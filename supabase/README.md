# Supabase setup

Ten minutes, once. After this the app is real: orders placed on a customer's
phone appear on the shop's tablet.

## 1. Create the project

1. Sign in at [supabase.com](https://supabase.com) and create a new project.
2. Pick the **eu-west-1 (Ireland)** or **eu-central-1** region — closest to
   South Africa of the free-tier options, and latency shows on a live tracker.
3. Save the database password somewhere safe. You won't need it for the app,
   but you will need it if you ever connect directly.

## 2. Run the migrations

In the Supabase dashboard, open **SQL Editor** and run these in order:

1. `migrations/0001_init.sql` — tables, functions, row level security
2. `migrations/0002_seed_menu.sql` — the nine current menu items

Each should finish with "Success. No rows returned."

## 3. Point the app at it

**Project Settings → Data API** gives you the Project URL and the `anon` public
key. Then:

```bash
cp .env.example .env.local
```

and paste both values in. `.env.local` is gitignored.

## 4. Create your first staff account

Staff sign in with email and password. Creating the auth user is not enough on
its own — access is granted by a row in `staff_profiles`.

1. **Authentication → Users → Add user**. Give it an email and password, and
   tick *Auto Confirm User*.
2. Copy the new user's UUID.
3. In the SQL editor:

```sql
insert into public.staff_profiles (user_id, display_name)
values ('paste-the-uuid-here', 'Shop Owner');
```

To revoke someone's access later, delete their `staff_profiles` row. The login
still works; it just grants nothing.

## 5. Turn off public signups

**Authentication → Sign In / Providers → Email**, and disable *Allow new users
to sign up*. Only the shop should be able to create accounts, and you create
them from the dashboard.

---

## How the security works

Worth understanding before you change any of it.

- **Customers never read the `orders` table.** It holds names and phone
  numbers. Row level security denies the anonymous role entirely.
- **Customers place orders through `place_order()`**, a function that prices
  the order from the menu server-side. The client never sends a price, so an
  edited request can't buy R900 of fish for nothing.
- **The live tracker reads `order_tracking`**, a projection carrying only the
  collection number, status and total — no personal information. It's found by
  an unguessable UUID, not by the collection number, so nobody can enumerate
  other people's orders.
- **Only staff can move an order along**, and `advance_order_status()` enforces
  the same state machine the UI shows. An order can't skip from Received
  straight to Collected.
