-- ============================================================================
-- Seed: the current Compas Fisheries menu.
--
-- Prices are in cents. image_url is left null for now — the app falls back to a
-- category placeholder. Fill these in once the real photographs are shot and
-- uploaded to Supabase Storage; the stock Unsplash photos the prototype used
-- are of other shops' food.
-- ============================================================================

insert into public.menu_items (name, category, price_cents, description, available, popular, sort_order)
values
  ('Small Chips',           'Chips',        2000, 'Crispy & golden, perfect for one',              true, false, 1),
  ('Medium Chips',          'Chips',        3000, 'The sweet spot — not too much, not too little', true, true,  2),
  ('Large Chips',           'Chips',        6000, 'Enough for the whole squad',                    true, false, 3),

  ('1 Russian & Chips',     'Fish & Chips', 4000, '1 thick russian sausage with chips',            true, false, 1),
  ('2 Russians & Chips',    'Fish & Chips', 4500, '2 juicy russians with a big scoop of chips',    true, true,  2),
  ('1 Piece Fish & Chips',  'Fish & Chips', 7000, '1 piece of crispy battered fish with chips',    true, false, 3),
  ('2 Pieces Fish & Chips', 'Fish & Chips', 9000, '2 pieces of golden battered fish with chips',   true, true,  4),
  ('3 Pieces Fish & Chips', 'Fish & Chips', 10000, '3 pieces of fish with chips — the family bundle', true, false, 5),

  ('Fish Only (3 Pieces)',  'Fish Only',    8000, '3 pieces of battered fish, no chips',           true, false, 1)
on conflict do nothing;
