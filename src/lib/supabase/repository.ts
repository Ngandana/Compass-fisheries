import type { MenuItem, Order, OrderStatus, PlaceOrderInput } from '@/domain/types';
import { normalisePhone } from '@/domain/phone';

import { supabase } from './client';
import { toMenuItem, toOrder, toTrackedOrder, type TrackedOrder } from './mappers';

/**
 * Every read and write the app performs. Screens call these; nothing calls
 * Supabase directly. Swapping storage means rewriting this file and nothing
 * else.
 */

function fail(context: string, error: { message: string }): never {
  throw new Error(`${context}: ${error.message}`);
}

// ─── Menu ─────────────────────────────────────────────────────────────────────

export async function fetchMenu(): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .order('category')
    .order('sort_order');

  if (error) fail('Could not load the menu', error);
  return (data ?? []).map(toMenuItem);
}

export async function setMenuItemAvailability(id: string, available: boolean): Promise<void> {
  const { error } = await supabase.from('menu_items').update({ available }).eq('id', id);
  if (error) fail('Could not update the item', error);
}

// ─── Placing an order ─────────────────────────────────────────────────────────

export async function placeOrder(input: PlaceOrderInput): Promise<string> {
  const phone = normalisePhone(input.phone);
  if (!phone) throw new Error('That does not look like a South African mobile number.');
  if (input.lines.length === 0) throw new Error('Your order is empty.');

  const { data, error } = await supabase.rpc('place_order', {
    p_customer_name: input.customerName.trim(),
    p_phone: phone,
    p_notes: input.notes.trim(),
    p_lines: input.lines.map((line) => ({
      menu_item_id: line.menuItemId,
      quantity: line.quantity,
      sauce: line.sauce,
      notes: line.notes,
    })),
  });

  if (error) fail('Could not place the order', error);
  return data as string;
}

// ─── Customer tracking (no personal information) ──────────────────────────────

export async function fetchTrackedOrder(orderId: string): Promise<TrackedOrder | null> {
  const { data, error } = await supabase
    .from('order_tracking')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle();

  if (error) fail('Could not find that order', error);
  return data ? toTrackedOrder(data) : null;
}

/** Calls back whenever this order's status changes. Returns an unsubscribe fn. */
export function subscribeToOrder(orderId: string, onChange: (order: TrackedOrder) => void): () => void {
  const channel = supabase
    .channel(`order:${orderId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'order_tracking', filter: `order_id=eq.${orderId}` },
      (payload) => {
        if (payload.new && 'order_id' in payload.new) {
          onChange(toTrackedOrder(payload.new as never));
        }
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

// ─── Staff ────────────────────────────────────────────────────────────────────

export async function fetchOrders(tradingDay?: string): Promise<Order[]> {
  let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
  if (tradingDay) query = query.eq('trading_day', tradingDay);

  const { data: orders, error } = await query;
  if (error) fail('Could not load orders', error);
  if (!orders || orders.length === 0) return [];

  const { data: lines, error: linesError } = await supabase
    .from('order_lines')
    .select('*')
    .in(
      'order_id',
      orders.map((o) => o.id),
    );

  if (linesError) fail('Could not load order items', linesError);

  const byOrder = new Map<string, typeof lines>();
  for (const line of lines ?? []) {
    const bucket = byOrder.get(line.order_id) ?? [];
    bucket.push(line);
    byOrder.set(line.order_id, bucket);
  }

  return orders.map((order) => toOrder(order, byOrder.get(order.id) ?? []));
}

export async function advanceOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const { error } = await supabase.rpc('advance_order_status', {
    p_order_id: orderId,
    p_status: status,
  });
  if (error) fail('Could not update the order', error);
}

/** Fires on any change to any order, so the kitchen board can refetch. */
export function subscribeToOrders(onChange: () => void): () => void {
  const channel = supabase
    .channel('orders:all')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, onChange)
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error('That email and password did not match a staff account.');

  // Authenticating is not the same as being staff. The grant is a
  // staff_profiles row; without one, sign the session straight back out.
  const { data, error: staffError } = await supabase.rpc('is_staff');
  if (staffError || !data) {
    await supabase.auth.signOut();
    throw new Error('That account does not have staff access.');
  }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
