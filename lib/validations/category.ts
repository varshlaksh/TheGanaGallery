import { z } from 'zod'

export const categoryCreateSchema = z.object({
  name:          z.string().trim().min(1).max(100),
  slug:          z.string().trim().min(1).max(100)
                  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase with hyphens only'),
  description:   z.string().trim().max(500).default(''),
  image_url:     z.string().url().optional().or(z.literal('')).default(''),
  display_order: z.number().int().min(0).default(0),
  is_active:     z.boolean().default(true),
})

export const categoryUpdateSchema = categoryCreateSchema.partial()