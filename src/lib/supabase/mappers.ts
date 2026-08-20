import type { MenuItem, Order, OrderLine } from '@/domain/types';

import type { MenuItemRow, OrderLineRow, OrderRow, OrderTrackingRow } from './database.types';

/**
 * The boundary between database rows (snake_case, nullable) and domain objects
 * (camelCase, total). Nothing outside this file should know what a row looks
 * like — that's what makes the storage layer swappable.
 */

export function toMenuItem(row: MenuItemRow): MenuItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    priceCents: row.price_cents,
    description: row.description,
    imageUrl: row.image_url,
    available: row.available,
    popular: row.popular,
    sortOrder: row.sort_order,
  };
}

export function toOrderLine(row: OrderLineRow): OrderLine {
  return {
    id: row.id,
    menuItemId: row.menu_item_id,
    name: row.name,
    unitPriceCents: row.unit_price_cents,
    quantity: row.quantity,
    sauce: row.sauce,
    notes: row.notes,
  };
}

export function toOrder(row: OrderRow, lines: OrderLineRow[]): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    phone: row.phone,
    status: row.status,
    totalCents: row.total_cents,
    notes: row.notes,
    lines: [...lines].sort((a, b) => a.line_index - b.line_index).map(toOrderLine),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** What a customer's tracker knows: no name, no phone. */
export interface TrackedOrder {
  id: string;
  orderNumber: string;
  status: Order['status'];
  totalCents: number;
  createdAt: string;
  updatedAt: string;
}

export function toTrackedOrder(row: OrderTrackingRow): TrackedOrder {
  return {
    id: row.order_id,
    orderNumber: row.order_number,
    status: row.status,
    totalCents: row.total_cents,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
