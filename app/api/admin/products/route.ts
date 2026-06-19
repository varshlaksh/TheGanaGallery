import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/session'
import { ok, fail } from '@/lib/api-response'
import { productCreateSchema } from '@/lib/validations/product'

// GET /api/admin/products — all products including inactive
export async function GET() {
  try {
    const adminCheck = await requireAdmin()
    if (!adminCheck.ok) return fail(adminCheck.error, adminCheck.status)

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return fail('Failed to fetch products', 500)
    return ok(data)
  } catch (err) {
    console.error('Admin products GET error:', err)
    return fail('Internal server error', 500)
  }
}

// POST /api/admin/products — create product
export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin()
    if (!adminCheck.ok) return fail(adminCheck.error, adminCheck.status)

    let body: unknown
    try { body = await request.json() } catch { return fail('Invalid JSON', 400) }

    const parsed = productCreateSchema.safeParse(body)
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Invalid data', 400)

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('products').insert(parsed.data).select().single()
    if (error) return fail('Failed to create product', 500)
    return ok(data, 201)
  } catch (err) {
    console.error('Admin products POST error:', err)
    return fail('Internal server error', 500)
  }
}