/**
 * Database types.
 *
 * Hand-written to match `supabase/migrations/`. Once the project exists you can
 * regenerate these from the live schema instead, which is the better habit:
 *
 *   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/database.types.ts
 *
 * Keep the shape identical if you do — the repository layer depends on it.
 */

export type MenuCategoryRow = 'Chips' | 'Fish & Chips' | 'Fish Only';
export type SauceRow = 'Plain' | 'Tomato Sauce' | 'Chilli Sauce' | 'Vinegar' | 'All of the above';
export type OrderStatusRow =
  | 'Order Received'
  | 'Being Prepared'
  | 'Ready for Collection'
  | 'Collected'
  | 'Cancelled';

export interface MenuItemRow {
  id: string;
  name: string;
  category: MenuCategoryRow;
  price_cents: number;
  description: string;
  image_url: string | null;
  available: boolean;
  popular: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface OrderRow {
  id: string;
  order_number: string;
  trading_day: string;
  customer_name: string;
  phone: string;
  notes: string;
  status: OrderStatusRow;
  total_cents: number;
  created_at: string;
  updated_at: string;
}

export interface OrderLineRow {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  name: string;
  unit_price_cents: number;
  quantity: number;
  sauce: SauceRow;
  notes: string;
  line_index: number;
}

export interface OrderTrackingRow {
  order_id: string;
  order_number: string;
  status: OrderStatusRow;
  total_cents: number;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      menu_items: {
        Row: MenuItemRow;
        Insert: Partial<MenuItemRow> & Pick<MenuItemRow, 'name' | 'category' | 'price_cents'>;
        Update: Partial<MenuItemRow>;
      };
      orders: {
        Row: OrderRow;
        Insert: never;
        Update: Partial<Pick<OrderRow, 'status'>>;
      };
      order_lines: {
        Row: OrderLineRow;
        Insert: never;
        Update: never;
      };
      order_tracking: {
        Row: OrderTrackingRow;
        Insert: never;
        Update: never;
      };
      staff_profiles: {
        Row: { user_id: string; display_name: string; created_at: string };
        Insert: { user_id: string; display_name: string };
        Update: Partial<{ display_name: string }>;
      };
    };
    Views: Record<never, never>;
    Functions: {
      place_order: {
        Args: {
          p_customer_name: string;
          p_phone: string;
          p_notes: string;
          p_lines: unknown;
        };
        Returns: string;
      };
      advance_order_status: {
        Args: { p_order_id: string; p_status: OrderStatusRow };
        Returns: undefined;
      };
      is_staff: {
        Args: Record<never, never>;
        Returns: boolean;
      };
    };
    Enums: {
      menu_category: MenuCategoryRow;
      sauce: SauceRow;
      order_status: OrderStatusRow;
    };
    CompositeTypes: Record<never, never>;
  };
}
