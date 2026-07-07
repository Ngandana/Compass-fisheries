# 🐟 Compas Fisheries — Order & Management App

A full-stack-style single-page ordering application for **Compas Fisheries**, a takeaway fish & chips shop. Customers can browse the menu, customise their order (including sauce choice), place orders, and track them live. Staff manage incoming orders and menu availability through a built-in admin dashboard.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [User Flow](#user-flow)
4. [Admin Flow](#admin-flow)
5. [Tech Stack](#tech-stack)
6. [Project Structure](#project-structure)
7. [Getting Started](#getting-started)
8. [Menu Items & Pricing](#menu-items--pricing)
9. [Sauce Options](#sauce-options)
10. [Order Statuses](#order-statuses)
11. [Admin Credentials](#admin-credentials)
12. [Data Persistence](#data-persistence)
13. [Desktop vs Mobile](#desktop-vs-mobile)
14. [Attributions](#attributions)

---

## Overview

Compas Fisheries is a **React single-page application (SPA)** originally prototyped in Figma Make and extended with full ordering logic, real-time status tracking, and an admin dashboard. It is designed to run as a web app — accessible from any browser — with a mobile-first design that also looks good on desktop.

The app has **no backend server or database**. All order data is stored in the browser's `localStorage`, making it easy to run and demo without any infrastructure setup.

---

## Features

### Customer Side
- **Landing page** with shop branding, quick stats, and a sauce teaser
- **Menu browsing** with category filters: All Items, Chips, Fish & Chips, Fish Only
- **Item customisation** per order item:
  - Quantity selector
  - Sauce/source flavour picker (5 options)
  - Free-text special requests (e.g. "extra crispy", "no salt")
- **Shopping cart** with itemised breakdown, sauce badges, and live subtotal
- **Checkout** — customer enters name and phone number; optional collection notes
- **Order confirmation** with a unique collection number (e.g. `CP-247`)
- **Live order tracking** with a 4-step progress indicator and estimated wait time

### Staff / Admin Side
- **Staff portal login** (password-protected)
- **Orders dashboard** with live stats (New, Preparing, Ready, Collected)
- **Per-order actions**: Accept & Prepare → Mark Ready → Mark Collected; or Cancel
- **Sauce and special request visibility** on every order card
- **Menu management** — toggle items between Available and Sold Out

---

## User Flow

```
Landing Page
    │
    ├─► Menu  ──► Item Card (tap)
    │               │
    │               ▼
    │         Customise Item
    │         (qty + sauce + notes)
    │               │
    │               ▼
    │             Cart
    │               │
    │               ▼
    │           Checkout
    │         (name + phone)
    │               │
    │               ▼
    │         Confirmation
    │         (collection number)
    │               │
    │               ▼
    │         Order Tracking
    │         (live 4-step progress)
    │
    └─► Track Order (for existing orders)
```

---

## Admin Flow

```
Staff Portal (login)
    │
    ▼
Admin Dashboard
    ├── Orders tab
    │     ├── Stats row (New / Preparing / Ready / Collected)
    │     └── Order cards
    │           ├── Customer name + phone (tap to call)
    │           ├── Items with sauce choices & notes
    │           ├── Action buttons (Accept / Mark Ready / Collect / Cancel)
    │           └── Status badge (auto-updates)
    │
    └── Menu tab
          └── Table of all items
                └── Toggle Available / Sold Out per item
```

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **UI Framework** | React | 18.3.1 |
| **Language** | TypeScript | (via Vite) |
| **Build Tool** | Vite | 6.3.5 |
| **Styling** | Tailwind CSS | 4.1.12 |
| **Animations** | Framer Motion | ^12.x |
| **Icons** | Lucide React | 0.487.0 |
| **Toast Notifications** | Sonner | 2.0.3 |
| **UI Primitives** | Radix UI (full suite) | various |
| **Component Library** | shadcn/ui (via Radix) | — |
| **Charts** | Recharts | 2.15.2 |
| **Forms** | React Hook Form | 7.55.0 |
| **Path Aliases** | `@` → `./src` | (Vite config) |
| **Data Storage** | Browser localStorage | (no backend) |
| **Images** | Unsplash (CDN URLs) | — |

### Key Design Decisions
- **No backend** — keeps setup to zero; `localStorage` handles order persistence between page refreshes within the same browser session.
- **Single file component** — the entire customer + admin app lives in `src/app/App.tsx` for simplicity, making it easy to read, deploy, and hand off.
- **Framer Motion** for all page transitions and micro-animations (entrance, exit, spring physics on the logo).
- **Sonner** for non-intrusive toast feedback on add-to-cart, status updates, and errors.
- **Tailwind CSS v4** with `@tailwindcss/vite` plugin — no `tailwind.config.js` needed; configuration lives in CSS.

---

## Project Structure

```
compas-v2/
├── index.html                        # App entry point (meta, fonts, root div)
├── vite.config.ts                    # Vite + React + Tailwind + @ alias
├── package.json                      # Dependencies and scripts
├── postcss.config.mjs                # PostCSS config (used by Tailwind)
│
├── src/
│   ├── main.tsx                      # React DOM render entry
│   │
│   ├── app/
│   │   ├── App.tsx                   # ★ Main application — all views & logic
│   │   │
│   │   └── components/
│   │       ├── figma/
│   │       │   └── ImageWithFallback.tsx   # Graceful image error handler
│   │       └── ui/                         # Radix-based shadcn/ui components
│   │           ├── button.tsx
│   │           ├── card.tsx
│   │           ├── dialog.tsx
│   │           ├── select.tsx
│   │           └── ... (full shadcn suite)
│   │
│   └── styles/
│       ├── index.css                 # Main stylesheet (imports below)
│       ├── tailwind.css              # @import 'tailwindcss'
│       ├── theme.css                 # CSS custom properties / design tokens
│       └── fonts.css                 # Font declarations
│
├── guidelines/
│   └── Guidelines.md                 # Design system notes (editable)
│
├── ATTRIBUTIONS.md                   # Licenses for shadcn/ui + Unsplash
└── README.md                         # This file
```

### Core File: `App.tsx`

All application logic is self-contained in one file, organised into clearly labelled sections:

| Section | What it does |
|---|---|
| **Types** | TypeScript interfaces for `MenuItem`, `CartItem`, `Order`, `SauceFlavor`, `OrderStatus` |
| **Sauce Options** | Array of 5 sauce choices with emoji, label, and description |
| **Menu Data** | `INITIAL_MENU` — 9 items with name, price, category, description, image URL |
| **Animation Variants** | Framer Motion page transition config |
| **Category Config** | Colour, icon, and accent per category (Chips / Fish & Chips / Fish Only) |
| **Shared Components** | `Btn`, `StatusBadge`, `SaucePicker`, `SauceIcon` |
| **App State** | `useState` for view routing, cart, orders, admin auth |
| **LandingPage** | Hero, stats row, sauce teaser, CTA buttons |
| **MenuPage** | Category filter pills, menu grid, floating cart bar |
| **MenuCard** | Individual menu item card with image, price, popular badge |
| **CustomizePage** | Quantity picker, SaucePicker, special requests textarea |
| **CartPage** | Cart items list, order summary, checkout CTA |
| **CheckoutPage** | Name + phone form, order notes, place order action |
| **ConfirmationPage** | Success animation, collection number display |
| **TrackPage** | 4-step order progress tracker, ETA card |
| **AdminLogin** | Username/password form with show/hide toggle |
| **AdminDashboard** | Orders tab + Menu tab with sidebar nav |

---

## Getting Started

### Prerequisites
- Node.js 18+ (or 20+)
- npm or pnpm

### Install & Run

```bash
# 1. Unzip the project
unzip Compas-Fisheries-v3.zip
cd compas-v2

# 2. Install dependencies
npm install
# or if you prefer pnpm:
pnpm install

# 3. Start the dev server
npm run dev
# or:
pnpm dev
```

The app will be available at `http://localhost:5173` by default.

### Build for Production

```bash
npm run build
```

Output goes to `dist/`. Serve it with any static host (Netlify, Vercel, GitHub Pages, or a simple `npx serve dist`).

---

## Menu Items & Pricing

| # | Item | Category | Price |
|---|---|---|---|
| 1 | Small Chips | Chips | R20 |
| 2 | Medium Chips ⭐ | Chips | R30 |
| 3 | Large Chips | Chips | R60 |
| 4 | 2 Russians & Chips ⭐ | Fish & Chips | R45 |
| 5 | 1 Russian & Chips | Fish & Chips | R40 |
| 6 | 1 Piece Fish & Chips | Fish & Chips | R70 |
| 7 | 2 Pieces Fish & Chips ⭐ | Fish & Chips | R90 |
| 8 | 3 Pieces Fish & Chips | Fish & Chips | R100 |
| 9 | Fish Only (3 Pieces) | Fish Only | R80 |

⭐ = marked as **Popular** in the app

Menu prices and availability can be updated directly in `INITIAL_MENU` inside `App.tsx`. Staff can toggle individual items as **Sold Out** from the Admin Dashboard at runtime (this does not persist after a page refresh — it's session-only).

---

## Sauce Options

When customising any item, customers choose one sauce flavour:

| Emoji | Option | Description shown |
|---|---|---|
| 🤍 | Plain | No sauce, straight up |
| 🍅 | Tomato Sauce | Classic All Gold vibes |
| 🌶️ | Chilli Sauce | Turn up the heat |
| 💧 | Vinegar | The OG way |
| 🔥 | All of the above | Eish, why not all? |

The chosen sauce is:
- Displayed as a badge in the **cart**
- Visible on the **admin order card** so staff know exactly how to dress the food

---

## Order Statuses

Orders move through a linear pipeline:

```
Order Received → Being Prepared → Ready for Collection → Collected
                                                              ↑
                                                     (terminal state)

At any point before Collected:  → Cancelled (terminal state)
```

| Status | Colour | Who sets it |
|---|---|---|
| Order Received | 🔴 Red | Automatic on order placement |
| Being Prepared | 🔵 Blue | Admin: "Accept & Prepare" |
| Ready for Collection | 🟢 Green | Admin: "Mark Ready" |
| Collected | ⚫ Grey | Admin: "Mark Collected" |
| Cancelled | ⚫ Grey strikethrough | Admin: "Cancel" |

The customer's tracking page reflects these status changes in real time (within the same browser session — no WebSocket/polling is implemented; refresh to see updates if admin and customer are in different tabs).

---

## Admin Credentials

The staff portal is protected by a hardcoded username and password for demo purposes:

```
Username: admin
Password: fish
```

> ⚠️ **Security note:** These credentials are stored in plain text in `App.tsx`. For a production deployment, replace this with a real authentication system (JWT, OAuth, Supabase Auth, etc.).

---

## Data Persistence

All order data is saved to the browser's `localStorage` under the key `compas_orders_v3`.

- Orders **survive page refreshes** within the same browser.
- Orders are **scoped to one device/browser** — there is no shared database.
- Clearing browser data or opening in a different browser starts fresh.
- The active tracked order is stored in React state only — it clears on refresh.

For a production deployment with real-time multi-device sync, you would replace the `saveOrders` / `useEffect` localStorage hooks with a backend API (e.g. Supabase, Firebase, or a custom REST API).

---

## Desktop vs Mobile

The app is **mobile-first** — it was designed for customers ordering on their phones.

On **desktop browsers**, the customer-facing views render as a centred 480px-wide "phone frame" on a warm linen background, so it looks intentional rather than stretched. The **admin dashboard** breaks out of this frame and uses full screen width, as it's a data management interface suited to desktop.

| View | Mobile | Desktop |
|---|---|---|
| Landing, Menu, Cart, Checkout, Track | Full width | 480px centred frame |
| Admin Dashboard | Full width | Full width |

---

## Attributions

- **UI components** — [shadcn/ui](https://ui.shadcn.com/) under [MIT License](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md)
- **Food photography** — [Unsplash](https://unsplash.com) under [Unsplash License](https://unsplash.com/license)
- **Icons** — [Lucide React](https://lucide.dev/) under ISC License
- **Animations** — [Framer Motion](https://www.framer.com/motion/) under MIT License
- **Original prototype** — designed in [Figma Make](https://www.figma.com/make/)

---

*Built with 🐟 and 🔥 for Compas Fisheries.*