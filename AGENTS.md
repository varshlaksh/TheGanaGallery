# AGENTS.md — TheGanaGallery
> For: Daksh (Frontend) | Written by: Lakshya (Backend)  
> Status: **Backend 100% done.** You can now build every page.

---

## TL;DR — What's Ready For You Right Now

The entire backend is built and tested. Every API you need to build the full frontend is live and working. Here's what you can start on immediately without waiting for anything:

| What | Status |
|---|---|
| User signup / login / logout | ✅ Ready |
| Product listing page | ✅ Ready |
| Product detail page | ✅ Ready |
| Categories for navbar / homepage | ✅ Ready |
| Cart (no API needed) | ✅ Ready |
| Checkout + Payment | ✅ Ready |
| Order history page | ✅ Ready |
| Admin dashboard | ✅ Ready (routes done, you build the UI) |

---

## Project Setup (first time)

```bash
git clone <repo-url>
cd gle_store
npm install
```

Create `.env.local` in the root folder — ask Lakshya for these values:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
```

```bash
npm run dev
# Open http://localhost:3000
```

---

## Folder Structure — What's Yours

```
app/
  (auth)/
    login/page.tsx        ← YOU BUILD
    signup/page.tsx       ← YOU BUILD
  (shop)/
    page.tsx              ← YOU BUILD (homepage)
    products/
      page.tsx            ← YOU BUILD (product listing)
      [id]/page.tsx       ← YOU BUILD (product detail)
    cart/page.tsx         ← YOU BUILD
    checkout/page.tsx     ← YOU BUILD
    orders/
      page.tsx            ← YOU BUILD (order history)
      [id]/page.tsx       ← YOU BUILD (order confirmation)
  (admin)/
    admin/page.tsx        ← YOU BUILD (dashboard)
    admin/products/page.tsx  ← YOU BUILD
    admin/orders/page.tsx    ← YOU BUILD
  api/                    ← LAKSHYA's — don't touch
  layout.tsx              ← SHARED — add Razorpay script here (see below)

components/               ← YOU BUILD (Button, ProductCard, Navbar etc.)
lib/                      ← LAKSHYA's — import from here, don't edit
types/index.ts            ← SHARED — import types from here
```

---

## Auth — How To Use

Import from `lib/auth.ts`. Never call Supabase directly.

```tsx
'use client'
import { useUser, signIn, signUp, signOut } from '@/lib/auth'

// Inside any component:
const { user, loading } = useUser()

if (loading) return <p>Loading...</p>
if (!user) return <p>Not logged in</p>
// user.email, user.id are available when logged in

// Sign in:
await signIn(email, password)   // throws on wrong credentials

// Sign up:
await signUp(email, password)   // sends confirmation email

// Sign out:
await signOut()
```

**Protect pages** — if a page needs login, check `useUser()` and redirect:
```tsx
'use client'
import { useUser } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const { user, loading } = useUser()
const router = useRouter()

useEffect(() => {
  if (!loading && !user) router.push('/login')
}, [user, loading])
```

**Admin pages** are auto-protected by middleware — non-admins get redirected to homepage automatically. You don't need to add any checks in the admin UI.

---

## Cart — How To Use

Import from `lib/cartStore.ts`. This is a Zustand store — works in any Client Component.

```tsx
'use client'
import { useCartStore } from '@/lib/cartStore'

const {
  items,          // CartItem[] — list of items in cart
  addItem,        // (product, quantity?) => void
  removeItem,     // (productId) => void
  updateQuantity, // (productId, quantity) => void
  clearCart,      // () => void
  total,          // () => number — total in paise
  itemCount,      // () => number — total quantity count
} = useCartStore()

// Add to cart button:
<button onClick={() => addItem(product)}>Add to Cart</button>
<button onClick={() => addItem(product, 3)}>Add 3</button>

// Remove from cart:
<button onClick={() => removeItem(product.id)}>Remove</button>

// Show price (divide paise by 100 for rupees):
<p>₹{(total() / 100).toFixed(2)}</p>

// Cart icon badge:
<span>{itemCount()}</span>
```

> Note: prices in the database are stored in **paise** (₹1 = 100 paise). Always divide by 100 before showing to the user.

---

## TypeScript Types

All types are in `types/index.ts`. Import like this:

```tsx
import type { Product, Category, CartItem, Order, ShippingAddress, ApiResponse } from '@/types'
```

**Key types:**

```ts
Product {
  id, name, description,
  price: number        // paise — divide by 100 to show ₹
  images: string[]     // Cloudinary URLs
  category: string     // matches a Category slug e.g. "wall-hangings"
  stock: number
  is_active: boolean
  created_at: string
}

Category {
  id, name,
  slug: string         // url-safe e.g. "wall-hangings" — use in filters
  description: string
  image_url: string    // Cloudinary URL — use for category card images
  display_order: number // use this to sort categories in navbar
  is_active: boolean
}

Order {
  id, user_id, status, total,
  items: OrderItem[]
  shipping_address: ShippingAddress
}

OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

ApiResponse<T> = { data?: T, error?: string, message?: string }
// Every API route returns this shape
```

---

## API Routes — Full Reference

Every response has this shape: `{ data: ... }` on success, `{ error: "message" }` on failure.

### Products

```ts
// List products (public)
GET /api/products
GET /api/products?category=baskets          // filter by category slug
GET /api/products?search=handwoven          // search name + description
GET /api/products?page=2&limit=20           // paginate (default limit 20, max 50)
// Returns: { data: { products: Product[], total: number, page: number, limit: number } }

// Single product (public)
GET /api/products/[id]
// Returns: { data: Product }
```

### Categories

```ts
// List all active categories ordered by display_order (public)
GET /api/categories
// Returns: { data: Category[] }
// Use this for: navbar menu, homepage category sections, filter dropdown
```

### Orders

```ts
// Create order from cart (must be logged in)
POST /api/orders
body: {
  items: [{ product_id: string, quantity: number }],
  shipping_address: {
    full_name: string,
    phone: string,        // Indian mobile number
    line1: string,
    line2?: string,
    city: string,
    state: string,
    pincode: string       // 6 digits
  }
}
// Returns: { data: { orderId: string, status: "pending" } }

// List logged-in user's orders
GET /api/orders
// Returns: { data: Order[] } with nested items and product details

// Single order detail
GET /api/orders/[id]
// Returns: { data: Order } with nested items and product details
```

### Payment (Razorpay)

```ts
// Step 1 — create Razorpay order
POST /api/payment/create-order
body: { orderId: string }   // the orderId from /api/orders
// Returns: { data: { razorpayOrderId: string, amount: number, currency: "INR" } }

// Step 2 — verify payment after Razorpay widget completes
POST /api/payment/verify
body: {
  orderId: string,
  razorpay_order_id: string,
  razorpay_payment_id: string,
  razorpay_signature: string
}
// Returns: { data: { success: true } }
```

### Admin (you build the UI, these are the routes)

```ts
GET  /api/admin/products          // all products including inactive ones
POST /api/admin/products          // create product
PUT  /api/admin/products/[id]     // update product
DELETE /api/admin/products/[id]   // delete (hard if no orders, soft if has orders)

GET  /api/admin/orders            // all orders from all users
GET  /api/admin/orders/[id]       // single order full detail
PATCH /api/admin/orders/[id]      // update order status
body: { status: "processing" | "shipped" | "delivered" | "cancelled" }

POST /api/admin/upload            // upload image to Cloudinary
body: FormData with "file" (image) and "folder" ("products" or "categories")
// Returns: { data: { url: string, publicId: string } }
```

---

## Checkout Flow — Step By Step

This is the complete sequence for the checkout page:

```
1. User fills in shipping address form
2. User clicks "Place Order"
3. POST /api/orders → get orderId
4. POST /api/payment/create-order { orderId } → get razorpayOrderId + amount
5. Open Razorpay widget (see code below)
6. User completes payment
7. Razorpay calls your handler with razorpay_order_id, razorpay_payment_id, razorpay_signature
8. POST /api/payment/verify { orderId, ...razorpayFields }
9. On success → redirect to /orders/[orderId]
```

**Razorpay widget code for checkout page:**

First add this to `app/layout.tsx`:
```tsx
import Script from 'next/script'
// inside <body>:
<Script src="https://checkout.razorpay.com/v1/checkout.js" />
```

Then in your checkout component:
```tsx
const handlePayment = async (orderId: string, razorpayOrderId: string, amount: number) => {
  const options = {
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    amount: amount,              // already in paise
    currency: 'INR',
    order_id: razorpayOrderId,
    name: 'TheGanaGallery',
    description: 'Handicraft Order',
    handler: async (response: {
      razorpay_order_id: string
      razorpay_payment_id: string
      razorpay_signature: string
    }) => {
      const res = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, ...response })
      })
      const json = await res.json()
      if (json.data?.success) {
        router.push(`/orders/${orderId}`)
      }
    },
    prefill: {
      name: shippingAddress.full_name,
      contact: shippingAddress.phone,
    },
    theme: { color: '#000000' }  // change to match your brand color
  }
  const rzp = new (window as any).Razorpay(options)
  rzp.open()
}
```

---

## Pages Build Order (suggested)

Build in this order so you always have something working to show:

**Week 1 — Core pages**
1. `app/layout.tsx` — add Navbar, footer, Razorpay script
2. `app/(auth)/login/page.tsx` — email + password form, calls `signIn()`
3. `app/(auth)/signup/page.tsx` — email + password form, calls `signUp()`
4. `app/(shop)/page.tsx` — homepage, fetch `/api/categories` for sections
5. `app/(shop)/products/page.tsx` — product grid, fetch `/api/products`, filter by category
6. `app/(shop)/products/[id]/page.tsx` — product detail, add to cart button

**Week 2 — Transaction pages**
7. `app/(shop)/cart/page.tsx` — use `useCartStore()`, no API needed
8. `app/(shop)/checkout/page.tsx` — shipping form + Razorpay payment
9. `app/(shop)/orders/[id]/page.tsx` — order confirmation / detail
10. `app/(shop)/orders/page.tsx` — order history list

**Week 3 — Admin**
11. `app/(admin)/admin/page.tsx` — dashboard overview
12. `app/(admin)/admin/products/page.tsx` — product management table
13. `app/(admin)/admin/orders/page.tsx` — orders management table

---

## Error Handling Pattern

Every API call should handle errors the same way:

```tsx
const res = await fetch('/api/products')
const json = await res.json()

if (json.error) {
  // show error to user
  setError(json.error)
  return
}

// use json.data safely
const products = json.data.products
```

---

## Git Workflow

```bash
git checkout dev
git pull origin dev
git checkout -b feat/your-page-name

# do your work...

git add .
git commit -m "feat: add product listing page"
git push origin feat/your-page-name
# open PR into dev on GitHub
```

Never push directly to `main`.

---

## Questions?

WhatsApp Lakshya. Don't guess — if an API returns something unexpected, share the response and I'll check.
