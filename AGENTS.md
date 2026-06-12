# AGENTS.md — TheGanaGallery Project Handoff
> Last updated: Phase 1 complete  
> Lakshya → Backend | Daksh → Frontend

---

## What This File Is

This file keeps both of us in sync. Every time Lakshya finishes a phase or a new file is ready, this doc gets updated. Read this before starting any work session.

---

## Project Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS |
| Database + Auth | Supabase (PostgreSQL) |
| Cart State | Zustand |
| Payments | Razorpay (Phase 4) |
| Image Storage | Cloudinary (Phase 5) |
| Deploy | Vercel |

---

## Repo Rules

- `main` → production only, never push directly
- `dev` → shared branch, both of us PR into this
- Branch naming: `feat/your-feature-name`
- Always pull from `dev` before starting new work

```bash
git checkout dev
git pull origin dev
git checkout -b feat/your-feature-name
```

---

## Current Status

### ✅ Phase 1 — Foundation (DONE by Lakshya)

All files below are ready. Pull `dev` and you have everything.

| File | What it does | You need this? |
|---|---|---|
| `lib/supabase-browser.ts` | Supabase client for browser | Import when needed |
| `lib/supabase-server.ts` | Supabase client for server | Don't import in client files |
| `middleware.ts` | Auto session refresh + admin route protection | Already wired, don't touch |
| `types/index.ts` | All shared types — Product, Order, CartItem, etc | ✅ Yes, import everywhere |
| `lib/auth.ts` | Auth hooks and functions | ✅ Yes, use these |
| `lib/cartStore.ts` | Cart state (Zustand) | ✅ Yes, use these |

---

## Daksh: How To Use Auth

**Never call Supabase directly in UI.** Use these from `lib/auth.ts`:

```tsx
import { useUser, signIn, signUp, signOut } from '@/lib/auth'

// Inside any Client Component:
const { user, loading } = useUser()
// user = null if not logged in
// user.email, user.id when logged in

// Login button:
await signIn(email, password)

// Signup button:
await signUp(email, password)

// Logout button:
await signOut()
```

---

## Daksh: How To Use Cart

Import from `lib/cartStore.ts`:

```tsx
import { useCartStore } from '@/lib/cartStore'

const { items, addItem, removeItem, updateQuantity, clearCart, total, itemCount } = useCartStore()

// Add to cart button:
addItem(product)           // adds 1
addItem(product, 3)        // adds 3

// Remove from cart:
removeItem(product.id)

// Display total (divide by 100 for ₹):
<p>₹{(total() / 100).toFixed(2)}</p>

// Cart icon badge:
<span>{itemCount()}</span>
```

---

## Daksh: Shared Types

Import from `@/types`:

```tsx
import type { Product, CartItem, Order, ShippingAddress } from '@/types'
```

Key types to know:
- `Product` — id, name, description, price (paise), images[], category, stock
- `CartItem` — product, quantity
- `Order` — id, user_id, items, status, total, shipping_address
- `OrderStatus` — `'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled'`

---

## Daksh: API Contract (use mock data until marked READY)

When Lakshya marks a route ✅ below, switch your fetch from mock JSON to the real API.

| Route | Method | Status | What it returns |
|---|---|---|---|
| `/api/products` | GET | 🔄 in progress | `Product[]` |
| `/api/products?category=X` | GET | 🔄 in progress | filtered `Product[]` |
| `/api/products/[id]` | GET | 🔄 in progress | single `Product` |
| `/api/orders` | POST | ⏳ not started | `{ orderId, status }` |
| `/api/payment/create-order` | POST | ⏳ not started | `{ razorpayOrderId, amount }` |
| `/api/payment/verify` | POST | ⏳ not started | `{ success: boolean }` |

All responses follow this shape:
```ts
{ data?: T, error?: string, message?: string }
```

---

## Daksh: Pages To Build

Work in this order — top ones are needed first:

| Page | Path | Needs API? | Priority |
|---|---|---|---|
| Homepage | `app/(shop)/page.tsx` | No (static) | 🔴 First |
| Product listing | `app/(shop)/products/page.tsx` | Yes — `/api/products` | 🔴 First |
| Product detail | `app/(shop)/products/[id]/page.tsx` | Yes — `/api/products/[id]` | 🔴 First |
| Login | `app/(auth)/login/page.tsx` | No (use `signIn`) | 🔴 First |
| Signup | `app/(auth)/signup/page.tsx` | No (use `signUp`) | 🔴 First |
| Cart | `app/(shop)/cart/page.tsx` | No (use cartStore) | 🟡 Second |
| Checkout | `app/(shop)/checkout/page.tsx` | Yes — `/api/orders` | 🟡 Second |
| Order history | `app/(shop)/orders/page.tsx` | Yes — `/api/orders` | 🟠 Third |
| Admin dashboard | `app/(admin)/admin/page.tsx` | Yes — `/api/admin/*` | 🟠 Third |

---

## Daksh: Mock Data For Now

Until `/api/products` is ready, use this in your product listing page:

```tsx
// Paste in app/(shop)/products/page.tsx temporarily
const mockProducts = [
  {
    id: '1',
    name: 'Handwoven Basket',
    description: 'Handcrafted natural fibre basket',
    price: 59900,
    images: ['https://placehold.co/400x400?text=Basket'],
    category: 'Baskets',
    stock: 10,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: '2', 
    name: 'Ceramic Pot',
    description: 'Hand-painted terracotta pot',
    price: 89900,
    images: ['https://placehold.co/400x400?text=Pot'],
    category: 'Pottery',
    stock: 5,
    is_active: true,
    created_at: new Date().toISOString()
  }
]
```

Switch to real fetch once Lakshya marks `/api/products` as ✅ in the table above.

---

## Environment Setup (first time pulling the repo)

```bash
git clone <repo-url>
cd gle_store
npm install
```

Create `.env.local` in root — ask Lakshya for the values:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Then:
```bash
npm run dev
# Visit http://localhost:3000
```

---

## Questions / Blockers

Drop a message on WhatsApp or add a comment in `API_CONTRACT.md`. Don't wait — if you're blocked, say so immediately.