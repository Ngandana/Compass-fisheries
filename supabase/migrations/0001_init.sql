-- ============================================================================
-- Compas Fisheries — initial schema
--
-- Design notes worth reading before changing anything:
--
-- 1. Money is integer cents everywhere. Never numeric, never float.
--
-- 2. Order totals are computed HERE, from the menu, inside place_order().
--    The client never sends a price. If it did, anyone could order R900 of
--    fish for R0 by editing a request.
--
-- 3. Customer name and phone are never readable by the anonymous role.
--    The customer's live tracker reads `order_tracking`, which carries no
--    personal information at all. This is what keeps us on the right side of
--    POPIA: personal data never crosses the staff boundary.
--
-- 4. Collection numbers come from a per-trading-day counter, allocated
--    atomically. The previous implementation drew from 899 random values and
--    collided after roughly 35 orders.
-- ============================================================================

-- ─── Enums ──────────────────────────────────────────────────────────────────

create type public.menu_category as enum ('Chips', 'Fish & Chips', 'Fish Only');

create type public.sauce as enum (
  'Plain', 'Tomato Sauce', 'Chilli Sauce', 'Vinegar', 'All of the above'
);

create type public.order_status as enum (
  'Order Received', 'Being Prepared', 'Ready for Collection', 'Collected', 'Cancelled'
);

-- ─── Staff ──────────────────────────────────────────────────────────────────
-- A staff member is an auth.users row with a matching profile. Creating the
-- auth user alone does not grant access; the profile row is the grant.

create table public.staff_profiles (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  display_name text        not null,
  created_at   timestamptz not null default now()
);

-- SECURITY DEFINER so policies can call it without the caller needing to read
-- the table, which would otherwise cause infinite policy recursion.
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.staff_profiles where user_id = auth.uid()
  );
$$;

-- ─── Menu ───────────────────────────────────────────────────────────────────

create table public.menu_items (
  id           uuid primary key default gen_random_uuid(),
  name         text                not null,
  category     public.menu_category not null,
  price_cents  integer             not null check (price_cents >= 0),
  description  text                not null default '',
  image_url    text,
  available    boolean             not null default true,
  popular      boolean             not null default false,
  sort_order   integer             not null default 0,
  created_at   timestamptz         not null default now(),
  updated_at   timestamptz         not null default now()
);

create index menu_items_category_sort_idx on public.menu_items (category, sort_order);

-- ─── Orders ─────────────────────────────────────────────────────────────────

create table public.orders (
  id            uuid primary key default gen_random_uuid(),
  order_number  text                not null,
  trading_day   date                not null default (now() at time zone 'Africa/Johannesburg')::date,
  customer_name text                not null check (length(trim(customer_name)) between 1 and 80),
  -- E.164, normalised client-side and re-checked here.
  phone         text                not null check (phone ~ '^\+27[678][0-9]{8}$'),
  notes         text                not null default '' check (length(notes) <= 500),
  status        public.order_status not null default 'Order Received',
  total_cents   integer             not null check (total_cents >= 0),
  created_at    timestamptz         not null default now(),
  updated_at    timestamptz         not null default now(),

  -- A collection number must be unique on the day it is called out.
  unique (trading_day, order_number)
);

create index orders_status_created_idx on public.orders (status, created_at desc);
create index orders_trading_day_idx     on public.orders (trading_day desc);
create index orders_phone_idx           on public.orders (phone);

create table public.order_lines (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid    not null references public.orders (id) on delete cascade,
  -- Nullable: an item may be deleted from the menu later. The order keeps its
  -- own copy of the name and price so old receipts never change.
  menu_item_id     uuid    references public.menu_items (id) on delete set null,
  name             text    not null,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity         integer not null check (quantity between 1 and 20),
  sauce            public.sauce not null default 'Plain',
  notes            text    not null default '' check (length(notes) <= 200),
  line_index       integer not null
);

create index order_lines_order_idx on public.order_lines (order_id, line_index);

-- ─── Public tracking projection ─────────────────────────────────────────────
-- Deliberately carries no personal information, so it can be world-readable
-- and safely broadcast over realtime to the customer's phone.

create table public.order_tracking (
  order_id     uuid primary key references public.orders (id) on delete cascade,
  order_number text                not null,
  status       public.order_status not null,
  total_cents  integer             not null,
  created_at   timestamptz         not null,
  updated_at   timestamptz         not null
);

create or replace function public.sync_order_tracking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.order_tracking (
    order_id, order_number, status, total_cents, created_at, updated_at
  )
  values (new.id, new.order_number, new.status, new.total_cents, new.created_at, new.updated_at)
  on conflict (order_id) do update
    set status      = excluded.status,
        total_cents = excluded.total_cents,
        updated_at  = excluded.updated_at;
  return new;
end;
$$;

create trigger orders_sync_tracking
  after insert or update on public.orders
  for each row execute function public.sync_order_tracking();

-- ─── updated_at maintenance ─────────────────────────────────────────────────

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger orders_touch_updated_at
  before update on public.orders
  for each row execute function public.touch_updated_at();

create trigger menu_items_touch_updated_at
  before update on public.menu_items
  for each row execute function public.touch_updated_at();

-- ─── Collection numbers ─────────────────────────────────────────────────────

create table public.daily_counters (
  trading_day date primary key,
  last_number integer not null default 0
);

-- Allocates the next number for today, atomically. Concurrent callers block on
-- the row lock rather than racing, so two customers can never be given the
-- same collection number.
create or replace function public.next_order_number(p_trading_day date)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_next integer;
begin
  insert into public.daily_counters (trading_day, last_number)
  values (p_trading_day, 1)
  on conflict (trading_day) do update
    set last_number = public.daily_counters.last_number + 1
  returning last_number into v_next;

  return 'CP-' || lpad(v_next::text, 3, '0');
end;
$$;

-- ─── place_order ────────────────────────────────────────────────────────────
-- The only way an order enters the system. Takes the customer's choices,
-- prices them from the menu, and writes the order and its lines in one
-- transaction.

create or replace function public.place_order(
  p_customer_name text,
  p_phone         text,
  p_notes         text,
  p_lines         jsonb   -- [{ menu_item_id, quantity, sauce, notes }, ...]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id    uuid;
  v_trading_day date := (now() at time zone 'Africa/Johannesburg')::date;
  v_number      text;
  v_total       integer := 0;
  v_line        jsonb;
  v_item        public.menu_items%rowtype;
  v_qty         integer;
  v_index       integer := 0;
begin
  if jsonb_array_length(p_lines) = 0 then
    raise exception 'Cannot place an empty order' using errcode = '22023';
  end if;

  if jsonb_array_length(p_lines) > 50 then
    raise exception 'Too many lines on one order' using errcode = '22023';
  end if;

  v_number := public.next_order_number(v_trading_day);

  insert into public.orders (order_number, trading_day, customer_name, phone, notes, total_cents)
  values (v_number, v_trading_day, trim(p_customer_name), p_phone, coalesce(p_notes, ''), 0)
  returning id into v_order_id;

  for v_line in select * from jsonb_array_elements(p_lines)
  loop
    select * into v_item
    from public.menu_items
    where id = (v_line->>'menu_item_id')::uuid;

    if not found then
      raise exception 'Menu item % no longer exists', v_line->>'menu_item_id'
        using errcode = '23503';
    end if;

    if not v_item.available then
      raise exception '% is sold out', v_item.name using errcode = '22023';
    end if;

    v_qty := greatest(1, least(20, coalesce((v_line->>'quantity')::integer, 1)));

    insert into public.order_lines (
      order_id, menu_item_id, name, unit_price_cents, quantity, sauce, notes, line_index
    )
    values (
      v_order_id,
      v_item.id,
      v_item.name,
      v_item.price_cents,   -- priced from the menu, never from the client
      v_qty,
      coalesce((v_line->>'sauce')::public.sauce, 'Plain'),
      coalesce(left(v_line->>'notes', 200), ''),
      v_index
    );

    v_total := v_total + (v_item.price_cents * v_qty);
    v_index := v_index + 1;
  end loop;

  update public.orders set total_cents = v_total where id = v_order_id;

  return v_order_id;
end;
$$;

-- ─── advance_order_status ───────────────────────────────────────────────────
-- Staff-only, and enforces the same state machine the UI does, so a crafted
-- request cannot jump an order straight to Collected.

create or replace function public.advance_order_status(
  p_order_id uuid,
  p_status   public.order_status
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current public.order_status;
  v_legal   boolean;
begin
  if not public.is_staff() then
    raise exception 'Not authorised' using errcode = '42501';
  end if;

  select status into v_current from public.orders where id = p_order_id for update;

  if not found then
    raise exception 'No such order' using errcode = '02000';
  end if;

  v_legal := case v_current
    when 'Order Received'       then p_status in ('Being Prepared', 'Cancelled')
    when 'Being Prepared'       then p_status in ('Ready for Collection', 'Cancelled')
    when 'Ready for Collection' then p_status in ('Collected', 'Cancelled')
    else false
  end;

  if not v_legal then
    raise exception 'Cannot move an order from % to %', v_current, p_status
      using errcode = '22023';
  end if;

  update public.orders set status = p_status where id = p_order_id;
end;
$$;

-- ============================================================================
-- Row level security
-- ============================================================================

alter table public.menu_items     enable row level security;
alter table public.orders         enable row level security;
alter table public.order_lines    enable row level security;
alter table public.order_tracking enable row level security;
alter table public.staff_profiles enable row level security;
alter table public.daily_counters enable row level security;

-- Menu: the world may read it. Only staff may change it.
create policy menu_public_read on public.menu_items
  for select using (true);

create policy menu_staff_write on public.menu_items
  for all using (public.is_staff()) with check (public.is_staff());

-- Orders: staff only. Customers never read this table — it holds their name
-- and phone number. Placing an order goes through place_order() instead.
create policy orders_staff_read on public.orders
  for select using (public.is_staff());

create policy orders_staff_write on public.orders
  for all using (public.is_staff()) with check (public.is_staff());

create policy order_lines_staff_read on public.order_lines
  for select using (public.is_staff());

create policy order_lines_staff_write on public.order_lines
  for all using (public.is_staff()) with check (public.is_staff());

-- Tracking: world-readable by design. Holds no personal information, and the
-- row is found by an unguessable UUID rather than the collection number.
create policy tracking_public_read on public.order_tracking
  for select using (true);

-- Staff profiles: a staff member may read their own row. Nobody writes here
-- from the client; profiles are created in the dashboard or by migration.
create policy staff_read_own on public.staff_profiles
  for select using (user_id = auth.uid());

-- daily_counters has RLS enabled and no policies at all, which denies every
-- client. Only next_order_number(), which is SECURITY DEFINER, touches it.

-- ─── Function grants ────────────────────────────────────────────────────────

revoke all on function public.place_order(text, text, text, jsonb) from public;
grant execute on function public.place_order(text, text, text, jsonb) to anon, authenticated;

revoke all on function public.advance_order_status(uuid, public.order_status) from public;
grant execute on function public.advance_order_status(uuid, public.order_status) to authenticated;

revoke all on function public.next_order_number(date) from public;
revoke all on function public.is_staff() from public;
grant execute on function public.is_staff() to authenticated;

-- ─── Realtime ───────────────────────────────────────────────────────────────
-- Staff dashboard subscribes to `orders`; customer tracker subscribes to
-- `order_tracking`. Realtime honours the policies above, so the customer's
-- phone can never receive another customer's details.

alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_tracking;
alter publication supabase_realtime add table public.menu_items;
