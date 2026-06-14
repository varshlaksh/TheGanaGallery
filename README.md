# TheGanaGallery

A handicraft e-commerce store built with Next.js (App Router) and Supabase.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript, Turbopack)
- **Styling:** Tailwind CSS
- **Database & Auth:** Supabase (PostgreSQL + Row-Level Security)
- **Validation:** Zod
- **State:** Zustand (cart)
- **Payments:** Razorpay
- **Image hosting:** Cloudinary
- **Deployment:** Vercel

---

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd gle_store
npm install
```

### 2. Environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Get these from your Supabase project → Settings → API. **Never commit this file.**

### 3. Database setup

Run the SQL migration scripts (see `/supabase` folder or ask Lakshya for the latest schema) in the Supabase SQL Editor. This sets up:
- `products` table
- `profiles` table (user roles: `customer` / `admin`)
- Row-Level Security policies on both

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
app/
  api/              → Backend route handlers (REST API)
  (auth)/           → Login, signup pages
  (shop)/           → Customer-facing pages (home, products, cart, checkout)
  (admin)/          → Admin dashboard pages
lib/
  supabase-browser.ts   → Supabase client for Client Components
  supabase-server.ts    → Supabase client for Server Components / API routes
  session.ts            → Server-side auth/role helpers (admin checks)
  auth.ts                → Client-side auth hooks (useUser, signIn, signOut)
  cartStore.ts           → Zustand cart store
  api-response.ts        → Standard API response helpers
  validations/           → Zod schemas for request validation
types/
  index.ts          → Shared TypeScript types (Product, Order, CartItem, etc.)
middleware.ts       → Session refresh + protected route handling
```

---

## API Overview

All API routes return a consistent shape:

```ts
{ data?: T, error?: string, message?: string }
```

| Route | Methods | Auth |
|---|---|---|
| `/api/products` | GET (list), POST (create) | GET public, POST admin |
| `/api/products/[id]` | GET, PUT, DELETE | GET public, PUT/DELETE admin |
| `/api/orders` | POST | Logged-in user |
| `/api/payment/create-order` | POST | Logged-in user |
| `/api/payment/verify` | POST | Logged-in user |

Full contract with request/response examples is in [`AGENTS.md`](./AGENTS.md).

---

## Development Workflow

- `main` → production, deployed to Vercel. **Never push directly.**
- `dev` → shared integration branch. All work happens via PRs into `dev`.
- Branch naming: `feat/short-description`

```bash
git checkout dev
git pull origin dev
git checkout -b feat/your-feature
# ... work ...
git push origin feat/your-feature
# open PR into dev
```

---

## Team

- **Lakshya** — Backend (API, database, auth, payments)
- **Daksh** — Frontend (UI, pages, components)

For current progress, what's ready to use, and what's still in progress, see [`AGENTS.md`](./AGENTS.md) — this is updated after every completed phase.

---

## Scripts

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```