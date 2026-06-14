import { z } from 'zod'

// GET /api/products?category=&search=&page=&limit=
export const productQuerySchema = z.object({
  category: z.string().trim().max(50).optional(),
  search:   z.string().trim().max(100).optional(),
  page:     z.coerce.number().int().min(1).default(1),
  limit:    z.coerce.number().int().min(1).max(50).default(20), // hard cap — prevents DOS via huge page sizes
})

// POST /api/products body
export const productCreateSchema = z.object({
  name:        z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).default(''),
  price:       z.number().int().min(0),          // paise — no negative/fraction prices
  images:      z.array(z.string().url()).max(10).default([]),
  category:    z.string().trim().min(1).max(50),
  stock:       z.number().int().min(0).default(0),
  is_active:   z.boolean().default(true),
})

// PUT /api/products/[id] body — every field optional
export const productUpdateSchema = productCreateSchema.partial()