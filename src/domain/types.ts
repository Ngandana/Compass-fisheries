/**
 * Canonical domain types. These mirror the database schema in
 * `supabase/migrations/` — if you change one, change both.
 *
 * Money is always an integer count of cents. Never a float: `0.1 + 0.2` is not
 * `0.3`, and a till that is one cent out at the end of a trading day is a real
 * problem for a real shop.
 */

export type Cents = number;

export const CATEGORIES = ['Chips', 'Fish & Chips', 'Fish Only'] as const;
export type Category = (typeof CATEGORIES)[number];

export const SAUCES = [
  'Plain',
  'Tomato Sauce',
  'Chilli Sauce',
  'Vinegar',
  'All of the above',
] as const;
export type Sauce = (typeof SAUCES)[number];

export const ORDER_STATUSES = [
  'Order Received',
  'Being Prepared',
  'Ready for Collection',
  'Collected',
  'Cancelled',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface MenuItem {
  id: string;
  name: string;
  category: Category;
  /** Integer cents. R20.00 is 2000. */
  priceCents: Cents;
  description: string;
  imageUrl: string | null;
  available: boolean;
  popular: boolean;
  /** Display order within a category. */
  sortOrder: number;
}

/** A menu item plus the customer's choices, before the order is placed. */
export interface CartLine {
  /** Client-side identity. Two of the same item with different sauces are two lines. */
  lineId: string;
  menuItemId: string;
  name: string;
  priceCents: Cents;
  imageUrl: string | null;
  quantity: number;
  sauce: Sauce;
  notes: string;
}

/** A line as stored against a placed order. Price is captured at time of sale. */
export interface OrderLine {
  id: string;
  menuItemId: string | null;
  /** Denormalised: the menu may be renamed or repriced later; receipts must not change. */
  name: string;
  unitPriceCents: Cents;
  quantity: number;
  sauce: Sauce;
  notes: string;
}

export interface Order {
  id: string;
  /** Human-facing collection number, e.g. "CP-014". Unique per trading day. */
  orderNumber: string;
  customerName: string;
  phone: string;
  status: OrderStatus;
  totalCents: Cents;
  notes: string;
  lines: OrderLine[];
  createdAt: string;
  updatedAt: string;
}

/** What the checkout form collects. */
export interface PlaceOrderInput {
  customerName: string;
  phone: string;
  notes: string;
  lines: CartLine[];
}
