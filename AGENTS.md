# AGENTS.md — TheGanaGallery Project Handoff
> Last updated: Phase 2 complete  
> Lakshya → Backend | Daksh → Frontend

---

## What This File Is

This file keeps both of us in sync. Every time Lakshya finishes a phase or a new file/route is ready, this doc gets updated. Read this before starting any work session — check the **API Contract** table especially, it tells you exactly what's safe to wire up vs. what's still mock data.

---

## Project Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS |
| Database + Auth | Supabase (PostgreSQL, Row-Level Security) |
| Validation | Zod |
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

### ✅ Phase 1 — Foundation (DONE)

| File | What it does | You need this? |
|---|---|---|
| `lib/supabase-browser.ts` | Supabase client for browser | Import when needed |
| `lib/supabase-server.ts` | Supabase client for server | Don't import in client files |
| `middleware.ts` | Auto session refresh + `/admin` route protection | Already wired, don't touch |
| `types/index.ts` | All shared types — Product, Order, CartItem, etc | ✅ Yes, import everywhere |
| `lib/auth.ts` | Auth hooks and functions | ✅ Yes, use these |
| `lib/cartStore.ts` | Cart state (Zustand) | ✅ Yes, use these |

### ✅ Phase 2 — Products API (DONE)

| File | What it does | You need this? |
|---|---|---|
| `lib/session.ts` | Server-only — `getSession`, `getUserRole`, `requireAdmin` | No, backend only |
| `lib/api-response.ts` | Standard `{ data }` / `{ error }` response shape | Know the shape, see below |
| `lib/validations/product.ts` | Zod schemas for product input | No, backend only |
| `app/api/products/route.ts` | GET list (filters + pagination), POST create (admin) | ✅ Yes — see API Contract |
| `app/api/products/[id]/route.ts` | GET single, PUT update (admin), DELETE deactivate (admin) | ✅ Yes — see API Contract |

**Database tables live:** `products` (catalog) and `profiles` (user roles — `customer`/`admin`), both with RLS enabled.

### 🔄 Phase 3 — Cart & Orders (NEXT, not started)

`POST /api/orders` — takes cart items + shipping address, creates order.

### ⏳ Phase 4 — Payment (not started)

Razorpay create-order + verify routes.

### ⏳ Phase 5 — Admin + Polish (not started)

### ⏳ Phase 6 — Deploy (not started)

---

## Daksh: How To Use Auth

**Never call Supabase directly in UI.** Use these from `lib/auth.ts`:

```tsx
import { useUser, signIn, signUp, signOut } from '@/lib/auth'

const { user, loading } = useUser()
// user = null if not logged in
// user.email, user.id when logged in

await signIn(email, password)
await signUp(email, password)
await signOut()
```

---

## Daksh: How To Use Cart

Import from `lib/cartStore.ts`:

```tsx
import { useCartStore } from '@/lib/cartStore'

const { items, addItem, removeItem, updateQuantity, clearCart, total, itemCount } = useCartStore()

addItem(product)           // adds 1
addItem(product, 3)        // adds 3
removeItem(product.id)
<p>₹{(total() / 100).toFixed(2)}</p>
<span>{itemCount()}</span>
```

---

## Daksh: Shared Types

Import from `@/types`:

```tsx
import type { Product, CartItem, Order, ShippingAddress, ApiResponse } from '@/types'
```

Key types:
- `Product` — id, name, description, price (paise), images[], category, stock, is_active
- `CartItem` — product, quantity
- `Order` — id, user_id, items, status, total, shipping_address
- `OrderStatus` — `'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled'`
- `ApiResponse<T>` — `{ data?: T, error?: string, message?: string }` — **every API route returns this shape**

---

## Daksh: API Contract

When a route shows ✅ **READY**, switch your fetch from mock JSON to the real endpoint immediately. 🔄 means in progress — keep using mocks. ⏳ means not started yet.

| Route | Method | Status | Returns |
|---|---|---|---|
| `/api/products?category=&search=&page=&limit=` | GET | ✅ **READY** | `{ data: { products: Product[], total, page, limit } }` |
| `/api/products/[id]` | GET | ✅ **READY** | `{ data: Product }` or `{ error: "Product not found" }` (404) |
| `/api/products` | POST | ✅ READY (admin only — not for frontend UI) | `{ data: Product }`, 201 |
| `/api/products/[id]` | PUT | ✅ READY (admin only) | `{ data: Product }` |
| `/api/products/[id]` | DELETE | ✅ READY (admin only) | `{ data: { message } }` |
| `/api/orders` | POST | ⏳ not started | `{ data: { orderId, status } }` |
| `/api/payment/create-order` | POST | ⏳ not started | `{ data: { razorpayOrderId, amount } }` |
| `/api/payment/verify` | POST | ⏳ not started | `{ data: { success: boolean } }` |

**Example — fetching the product list (real API, ready now):**
```tsx
const res = await fetch('/api/products?category=Pottery&page=1')
const json = await res.json()
if (json.error) {
  // handle error
} else {
  const { products, total } = json.data
}
```

---

## Daksh: Pages To Build

| Page | Path | Needs API? | Priority |
|---|---|---|---|
| Homepage | `app/(shop)/page.tsx` | No (static) | 🔴 First |
| Product listing | `app/(shop)/products/page.tsx` | ✅ `/api/products` ready | 🔴 First |
| Product detail | `app/(shop)/products/[id]/page.tsx` | ✅ `/api/products/[id]` ready | 🔴 First |
| Login | `app/(auth)/login/page.tsx` | No (use `signIn`) | 🔴 First |
| Signup | `app/(auth)/signup/page.tsx` | No (use `signUp`) | 🔴 First |
| Cart | `app/(shop)/cart/page.tsx` | No (use cartStore) | 🟡 Second |
| Checkout | `app/(shop)/checkout/page.tsx` | ⏳ `/api/orders` not ready | 🟡 Second |
| Order history | `app/(shop)/orders/page.tsx` | ⏳ `/api/orders` not ready | 🟠 Third |
| Admin dashboard | `app/(admin)/admin/page.tsx` | ✅ products API ready, orders pending | 🟠 Third |

**You can now drop the mock product data and use the real `/api/products` endpoint for the listing and detail pages.** Cart, login, signup don't need any backend changes from here — start those any time.

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

```bash
npm run dev
# Visit http://localhost:3000
```

---

## Questions / Blockers

Drop a message on WhatsApp or add a comment in this file under "Questions" below. Don't wait — if you're blocked, say so immediately.

### Questions
_(add here)_