# Handoff — Compas Fisheries

> **For Claude Code picking this up on another machine.** Read this first, then
> confirm the state matches before doing anything. This file is a snapshot and
> can go stale — `git log` is the truth.
>
> Last updated: 28 August 2026, end of the second working session.

---

## What this project is

An order-ahead app for **Compas Fisheries**, a real takeaway fish & chips shop
in South Africa. Customers browse the menu on their phone, pick a sauce, place
a collection order, and track it live. Staff manage incoming orders and menu
availability.

Rands, cash on collection, kasi voice in the copy ("Eish, why not all?"). The
tone is deliberate and the owner likes it — **keep the copy voice**, it's one of
the genuinely good things about the prototype.

## Where it started

It was exported from Figma Make: a 1341-line `src/app/App.tsx` containing every
screen and all logic, styled with Tailwind, storing orders in `localStorage`.

It looked finished. It wasn't — see the blocker below.

## The core problem being fixed

**Orders never reached the shop.** `localStorage` is scoped to one browser on
one device, so the customer's phone and the shop's tablet had two completely
unrelated stores. A customer could place an order, get a collection number, and
watch a tracking screen — while the kitchen saw nothing, forever. The app also
promised "We'll SMS you when your order is ready" with no messaging code
anywhere in the repo.

Everything else was polish on top of a thing that did not do its job.

## Decisions already made — do not relitigate these

| Question | Decision |
|---|---|
| Real shop or portfolio piece? | **Real shop, will trade on it.** POPIA, trading hours, real photography are all in scope. Correctness beats polish. |
| Backend | **Supabase** — Postgres + realtime + auth + RLS. Frontend stays a static Vercel deploy; nothing to operate. |
| Git workflow | **Feature branch + PR per sprint.** `main` stays deployable because Vercel deploys from it. Never commit straight to `main`. |
| Notifications | Live tracker + a staff-tapped WhatsApp link for now. Automate in sprint 4 once volume is known. |
| Rebuild vs refactor | Rebuild the structure, port the screens, **keep the copy**. |

## The plan

Four sprints. Full audit with all 29 findings is published at:
**https://claude.ai/code/artifact/46c1d412-8811-4352-9f27-0315201eee22**

1. **Make it real** ← *currently here.* Supabase, auth, realtime, the P0s.
2. **Make it sound.** File split, routing, CI, tests, dependency purge.
3. **Make it beautiful.** Design tokens, adopt shadcn properly, kitchen-display
   admin UI, WCAG AA, real photography, PWA.
4. **Make it earn.** WhatsApp notify, trading hours, reporting, POPIA notice.

One deviation from that plan already made deliberately: **the file split was
pulled forward from sprint 2 into sprint 1**, because migrating the data layer
inside a 1341-line file means writing code you immediately move.

---

## Current state

**Branch: `sprint-1/make-it-real`** (branched from `main` at `1dcf24cd`)

Three commits done:

### `2b036455` — TypeScript on, two latent bugs fixed, deps purged

The project **had no `tsconfig.json` at all**, so TypeScript had never run —
Vite strips annotations with esbuild and checks nothing. Every interface in the
codebase was decoration. Turning it on surfaced 10 errors, two of them real:

- **The staff dashboard had no auth guard.** `adminLoggedIn` was set on login
  and never read; the render switched on `view` alone. Harmless only because
  there was no routing — wide open the moment `/staff` exists.
- `pageVariants.transition.ease` widened to `number[]`, which framer-motion
  rejects.

Also: wrote a real `.gitignore` (the one from `1dcf24cd` was committed at zero
bytes, so nothing was ignored — it now covers `.env` *before* any key exists);
removed 11 orphaned dependencies (70 packages); `build` now runs `typecheck`
first so a type error fails the Vercel deploy rather than shipping.

### `a072dca2` — domain layer, Supabase schema, data access

- `src/domain/` — pure, testable. **25 tests, all passing.** Money is integer
  cents throughout (the prototype did float arithmetic on rands). The order
  lifecycle is an explicit state machine that refuses to skip steps, move
  backwards, or touch a terminal order. SA mobile numbers validated and
  normalised to E.164.
- `supabase/migrations/` — the schema. **Three things worth understanding
  before changing any of it:**
  1. **Totals are computed server-side** in `place_order()` from the menu. The
     client never sends a price, so a crafted request can't buy R900 of fish
     for nothing.
  2. **Customers cannot read the `orders` table** — it holds names and phone
     numbers. The live tracker reads `order_tracking`, a projection with no
     personal data, keyed by an unguessable UUID rather than the collection
     number, so nobody can enumerate other people's orders. **This is the POPIA
     position — don't "simplify" it by making orders publicly readable.**
  3. Collection numbers come from an atomic per-trading-day counter, replacing
     a 899-value random draw that collided after ~35 orders.
- `src/lib/supabase/` — repository layer with row→domain mappers. Screens never
  touch Supabase directly, so swapping storage stays a one-file change.

### `c5809e94` — `.gitattributes` for line endings

Windows checkouts were producing CRLF warnings that would become whole-file
diffs once CI runs on Linux.

---

## ⚠️ What is NOT done — read this before you get confused

**The UI is still the original localStorage prototype.** `src/app/App.tsx` is
untouched at 1341 lines apart from the two bug fixes. Nothing in the app calls
the repository layer yet.

So: the app does not behave any better than it did at the start. The foundation
is built; the wiring is not. Expect it to go from "unchanged" to "actually
works" in one step once the screens are connected.

Specifically still outstanding in sprint 1:

- [ ] Hoist the nine components out of `App()` — they're declared inside the
      render body, so React remounts the whole subtree on every parent render
- [ ] Split `App.tsx` into feature folders
- [ ] React Router with real URLs (`/`, `/menu`, `/cart`, `/checkout`,
      `/order/:id`, `/staff`) + `vercel.json` SPA rewrite
- [ ] Wire screens to `src/lib/supabase/repository.ts` via TanStack Query
- [ ] Replace hardcoded `admin`/`fish` login with Supabase Auth + a real route guard
- [ ] Error boundary (an unguarded `JSON.parse` can white-screen the app)
- [ ] Remove the SMS promise from the UI copy until SMS exists
- [ ] ESLint + Prettier + GitHub Actions CI

Dependencies for these are already installed: `@supabase/supabase-js`,
`@tanstack/react-query`, `react-router-dom`.

---

## Setting up on a new machine

```bash
git clone https://github.com/Ngandana/Compass-fisheries.git
cd Compass-fisheries
git checkout sprint-1/make-it-real   # NOT main — main is the old prototype
npm install
```

**`.env.local` is gitignored and will not clone.** You must recreate it:

```bash
cp .env.example .env.local
```

then paste the Supabase project URL and anon key into it. If the Supabase
project doesn't exist yet, follow [`supabase/README.md`](supabase/README.md) —
create the project, run the two migrations in the SQL editor, then create a
staff account. Note that creating the auth user is not enough on its own:
access is granted by a row in `staff_profiles`.

### Verify the checkout is healthy

```bash
npm run typecheck   # must be 0 errors
npm run test        # must be 25 passing
npm run build       # runs typecheck first, then vite build
```

If any of those fail on a fresh clone, something is wrong with the environment,
not the code — they were all green at `c5809e94`.

---

## Scripts

| Script | Does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | **typecheck, then** build — gates the Vercel deploy |
| `npm run build:only` | Build without the typecheck gate |
| `npm run typecheck` | `tsc --build --force` |
| `npm run test` | Vitest, single run |
| `npm run test:watch` | Vitest, watch mode |
| `npm run verify` | typecheck + lint + test + build. Run before opening the PR. |

`lint`, `format` and `test:e2e` are declared but **ESLint, Prettier and
Playwright are not installed yet** — those scripts will fail until that part of
sprint 1 lands.

---

## Repo map

```
src/
├── app/App.tsx              ← STILL THE ORIGINAL 1341-LINE PROTOTYPE
│   └── components/
│       ├── figma/ImageWithFallback.tsx
│       └── ui/              ← 45 shadcn components, currently ZERO imports
├── domain/                  ← pure logic, fully tested
│   ├── types.ts             ← canonical types, mirror the SQL schema
│   ├── order-status.ts      ← the state machine
│   ├── money.ts             ← integer cents, ZAR formatting
│   ├── cart.ts              ← totals, quantity clamping
│   ├── phone.ts             ← SA mobile validation → E.164
│   └── domain.test.ts       ← 25 tests
├── lib/supabase/
│   ├── client.ts            ← typed client; `isSupabaseConfigured` guard
│   ├── database.types.ts    ← hand-written; regenerate from live schema later
│   ├── mappers.ts           ← row → domain boundary
│   └── repository.ts        ← every read/write the app performs
└── styles/
supabase/
├── README.md                ← setup steps + how the security model works
└── migrations/
    ├── 0001_init.sql        ← schema, functions, RLS
    └── 0002_seed_menu.sql   ← the 9 menu items
```

---

## Gotchas and corrections

- **`main` is the old prototype.** Vercel deploys from it. Don't push there.
- **The 45 shadcn components in `components/ui/` are unused** — the app
  hand-rolls its own `Btn`. They're kept deliberately: sprint 3 adopts them
  properly rather than deleting them. Note that Tailwind still scans them, so
  the build emits ~106 KB of CSS for an app rendering a fraction of it.
- **Correction to an earlier claim:** the first audit said ~20 dependencies were
  unreferenced. That was wrong for about half. `cmdk`, `vaul`, `embla`,
  `recharts`, `react-day-picker`, `input-otp`, `next-themes` and
  `react-hook-form` *are* imported by the shadcn components. Only 11 were
  genuinely orphaned and those are the ones removed. Don't purge further
  without re-checking imports.
- **`date-fns` is kept** despite zero direct imports — it's a peer dependency of
  `react-day-picker`.
- **`public/logo.png` is 1.9 MB** and is the landing hero's LCP element.
  Optimising it is sprint 3, but it's low-hanging.
- **The customer tracking URL must use the order UUID, not the collection
  number.** Collection numbers are sequential and guessable by design.
- Menu images are currently `null` in the seed. The prototype hot-linked
  Unsplash stock photos of other shops' food; real photography is sprint 3.

## Working preferences established in these sessions

- Verify claims by running things — the audit numbers came from an actual
  `vite build`, not from reading.
- State corrections plainly and move on.
- Flag concerns once, then deliver the full scope rather than quietly narrowing it.
- Sprint 3 (the design system) needs the owner's taste input — bring directions
  to them rather than picking a palette unilaterally.
