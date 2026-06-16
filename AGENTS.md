# AGENTS.md — TheGanaGallery Project Handoff
> Last updated: Phase 4 complete — full backend done  
> Lakshya → Backend | Daksh → Frontend

---

## What This File Is

This file keeps both of us in sync. Read this before every work session.  
Check the **API Contract** table — it's the source of truth for what's ready to wire up vs. still mock data.

---

## Project Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS |
| Database + Auth | Supabase (PostgreSQL, Row-Level Security) |
| Validation | Zod |
| Cart State | Zustand |
| Payments | Razorpay (test mode — live keys go in at deploy) |
| Image Storage | Cloudinary (Phase 5) |
| Deploy | Vercel (Phase 6) |

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

| File | What it does | Daksh needs? |
|---|---|---|
| `lib/supabase-browser.ts` | Supabase client for browser | Import when needed |
| `lib/supabase-server.ts` | Supabase client for server | Don't import in client files |
| `middleware.ts` | Session refresh + `/admin` protection | Don't touch |
| `types/index.ts` | All shared types | ✅ Import everywhere |
| `lib/auth.ts` | useUser, signIn, signUp, signOut | ✅ Use these |
| `lib/cartStore.ts` | Zustand cart store | ✅ Use these |

### ✅ Phase 2 — Products API (DONE)

| File | What it does | Daksh needs? |
|---|---|---|
| `lib/session.ts` | getSession, getUserRole, requireAdmin | No — backend only |
| `lib/api-response.ts` | ok() / fail() response helpers | No — backend only |
| `lib/validations/product.ts` | Zod product schemas | No — backend only |
| `app/api/products/route.ts` | GET list + POST create (admin) | ✅ GET ready |
| `app/api/products/[id]/route.ts` | GET + PUT + DELETE | ✅ GET ready |

### ✅ Phase 3 — Orders API (DONE)

| File | What it does | Daksh needs? |
|---|---|---|
| `lib/validations/order.ts` | Zod order schemas | No — backend only |
| `app/api/orders/route.ts` | POST create order + GET list | ✅ Both ready |
| `app/api/orders/[id]/route.ts` | GET single order | ✅ Ready |

### ✅ Phase 4 — Payment (DONE)

| File | What it does | Daksh needs? |
|---|---|---|
| `lib/razorpay.ts` | Razorpay client instance | No — backend only |
| `lib/supabase-admin.ts` | Service role client (bypasses RLS) | No — backend only |
| `lib/validations/payment.ts` | Zod payment schemas | No — backend only |
| `app/api/payment/create-order/route.ts` | Creates Razorpay order from internal orderId | ✅ Ready |
| `app/api/payment/verify/route.ts` | HMAC signature verify → marks order paid | ✅ Ready |

### 🔄 Phase 5 — Admin Panel + Categories + Images (NEXT)

See Phase 5 plan below.

### ⏳ Phase 6 — Deploy (Vercel + live Razorpay keys)

---

## Daksh: How To Use Auth

```tsx
import { useUser, signIn, signUp, signOut } from '@/lib/auth'

const { user, loading } = useUser()
// user = null if not logged in, user.email / user.id when logged in

await signIn(email, password)
await signUp(email, password)
await signOut()
```

---

## Daksh: How To Use Cart

```tsx
import { useCartStore } from '@/lib/cartStore'

const { items, addItem, removeItem, updateQuantity, clearCart, total, itemCount } = useCartStore()

addItem(product)        // adds 1
addItem(product, 3)     // adds 3
removeItem(product.id)
<p>₹{(total() / 100).toFixed(2)}</p>
<span>{itemCount()}</span>
```

---

## Daksh: Shared Types

```tsx
import type { Product, CartItem, Order, ShippingAddress, ApiResponse } from '@/types'
```

All API responses follow this shape:
```ts
{ data?: T, error?: string, message?: string }
```

---

## Daksh: API Contract — Full Reference

| Route | Method | Status | Returns |
|---|---|---|---|
| `/api/products` | GET | ✅ READY | `{ data: { products: Product[], total, page, limit } }` |
| `/api/products?category=X&search=X&page=1&limit=20` | GET | ✅ READY | filtered + paginated |
| `/api/products/[id]` | GET | ✅ READY | `{ data: Product }` |
| `/api/products` | POST | ✅ READY (admin only) | `{ data: Product }` 201 |
| `/api/products/[id]` | PUT | ✅ READY (admin only) | `{ data: Product }` |
| `/api/products/[id]` | DELETE | ✅ READY (admin only) | soft delete |
| `/api/orders` | POST | ✅ READY | `{ data: { orderId, status } }` 201 |
| `/api/orders` | GET | ✅ READY | `{ data: Order[] }` with nested items |
| `/api/orders/[id]` | GET | ✅ READY | `{ data: Order }` with nested items |
| `/api/payment/create-order` | POST | ✅ READY | `{ data: { razorpayOrderId, amount, currency } }` |
| `/api/payment/verify` | POST | ✅ READY | `{ data: { success: true } }` |
| `/api/admin/products` | GET/POST | 🔄 Phase 5 | admin product management |
| `/api/admin/orders` | GET/PUT | 🔄 Phase 5 | admin order management |
| `/api/categories` | GET | 🔄 Phase 5 | `{ data: Category[] }` |

---

## Daksh: Checkout Flow (how the payment routes connect)

This is the sequence Daksh needs to implement in the checkout page:

```
1. User fills shipping form + clicks "Place Order"
2. POST /api/orders → { orderId }
3. POST /api/payment/create-order { orderId } → { razorpayOrderId, amount }
4. Open Razorpay checkout widget with razorpayOrderId + NEXT_PUBLIC_RAZORPAY_KEY_ID
5. User pays → Razorpay returns { razorpay_order_id, razorpay_payment_id, razorpay_signature }
6. POST /api/payment/verify { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature }
7. On { success: true } → redirect to /orders/[orderId] (order confirmation page)
```

Razorpay widget snippet for checkout page:
```tsx
const options = {
  key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  amount: amount,           // from create-order response
  currency: 'INR',
  order_id: razorpayOrderId, // from create-order response
  handler: async (response) => {
    // response has razorpay_order_id, razorpay_payment_id, razorpay_signature
    await fetch('/api/payment/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, ...response })
    })
    router.push(`/orders/${orderId}`)
  }
}
const rzp = new window.Razorpay(options)
rzp.open()
```

Add this to `app/layout.tsx` so the Razorpay script is available:
```tsx
<Script src="https://checkout.razorpay.com/v1/checkout.js" />
```

---

## Daksh: Pages Status

| Page | Path | API Status | Priority |
|---|---|---|---|
| Homepage | `app/(shop)/page.tsx` | No API needed | 🔴 Build now |
| Product listing | `app/(shop)/products/page.tsx` | ✅ Ready | 🔴 Build now |
| Product detail | `app/(shop)/products/[id]/page.tsx` | ✅ Ready | 🔴 Build now |
| Login | `app/(auth)/login/page.tsx` | ✅ Ready | 🔴 Build now |
| Signup | `app/(auth)/signup/page.tsx` | ✅ Ready | 🔴 Build now |
| Cart | `app/(shop)/cart/page.tsx` | No API (cartStore) | 🔴 Build now |
| Checkout | `app/(shop)/checkout/page.tsx` | ✅ All APIs ready | 🟡 Build next |
| Order confirmation | `app/(shop)/orders/[id]/page.tsx` | ✅ Ready | 🟡 Build next |
| Order history | `app/(shop)/orders/page.tsx` | ✅ Ready | 🟡 Build next |
| Admin dashboard | `app/(admin)/admin/page.tsx` | 🔄 Phase 5 | 🟠 After Phase 5 |

---

## Environment Setup (first time pulling repo)

```bash
git clone <repo-url>
cd gle_store
npm install
```

Create `.env.local` — ask Lakshya for values:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
```

```bash
npm run dev
```

---

## Questions / Blockers

Drop a message on WhatsApp. Don't wait — if blocked, say immediately.

### Questions
_(add here)_