import { z } from 'zod'

export const orderItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity:   z.number().int().min(1).max(100), // hard cap — sanity limit per item
})

export const shippingAddressSchema = z.object({
  full_name: z.string().trim().min(1).max(100),
  phone:     z.string().trim().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
  line1:     z.string().trim().min(1).max(200),
  line2:     z.string().trim().max(200).optional(),
  city:      z.string().trim().min(1).max(100),
  state:     z.string().trim().min(1).max(100),
  pincode:   z.string().trim().regex(/^\d{6}$/, 'Invalid pincode'),
})

// POST /api/orders body
export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1).max(50),
  shipping_address: shippingAddressSchema,
})