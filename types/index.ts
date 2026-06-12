// ── Product ──────────────────────────────────────────
export interface Product {
  id:          string
  name:        string
  description: string
  price:       number          // in INR paise (₹199 = 19900)
  images:      string[]        // Cloudinary URLs
  category:    string
  stock:       number
  is_active:   boolean
  created_at:  string
}

// ── Cart ─────────────────────────────────────────────
export interface CartItem {
  product:  Product
  quantity: number
}

// ── Order ────────────────────────────────────────────
export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export interface OrderItem {
  id:         string
  product_id: string
  product:    Product         // joined from Supabase
  quantity:   number
  unit_price: number
}

export interface ShippingAddress {
  full_name: string
  phone:     string
  line1:     string
  line2?:    string
  city:      string
  state:     string
  pincode:   string
}

export interface Order {
  id:               string
  user_id:          string
  items:            OrderItem[]
  status:           OrderStatus
  total:            number
  shipping_address: ShippingAddress
  razorpay_order_id?: string
  created_at:       string
}

// ── API Response wrapper ──────────────────────────────
// Use this in every route handler for consistency
export interface ApiResponse<T> {
  data?:    T
  error?:   string
  message?: string
}