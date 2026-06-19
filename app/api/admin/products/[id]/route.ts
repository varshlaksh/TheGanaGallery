import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/session'
import { ok, fail } from '@/lib/api-response'
import { productUpdateSchema } from '@/lib/validations/product'

const uuidSchema = z.string().uuid()
type Params = { params: Promise<{ id: string }> }

// PUT /api/admin/products/[id] — update product
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const adminCheck = await requireAdmin()
    if (!adminCheck.ok) return fail(adminCheck.error, adminCheck.status)

    const { id } = await params
    if (!uuidSchema.safeParse(id).success) return fail('Invalid ID', 400)

    let body: unknown
    try { body = await request.json() } catch { return fail('Invalid JSON', 400) }

    const parsed = productUpdateSchema.safeParse(body)
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Invalid data', 400)
    if (Object.keys(parsed.data).length === 0) return fail('No fields to update', 400)

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('products')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', id).select().single()
    if (error || !data) return fail('Product not found', 404)
    return ok(data)
  } catch (err) {
    console.error('Admin product PUT error:', err)
    return fail('Internal server error', 500)
  }
}

// DELETE /api/admin/products/[id] — hard delete (admin only)
export async function DELETE(_: NextRequest, { params }: Params) {
  try {
    const adminCheck = await requireAdmin()
    if (!adminCheck.ok) return fail(adminCheck.error, adminCheck.status)

    const { id } = await params
    if (!uuidSchema.safeParse(id).success) return fail('Invalid ID', 400)

    const admin = createAdminClient()

    // Check no live orders reference this product before hard delete
    const { count } = await admin
      .from('order_items')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', id)

    if (count && count > 0) {
      // Has order history — soft delete only to preserve records
      const { error } = await admin
        .from('products').update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) return fail('Failed to deactivate product', 500)
      return ok({ message: 'Product deactivated (has order history)' })
    }

    // No order history — safe to hard delete
    const { error } = await admin.from('products').delete().eq('id', id)
    if (error) return fail('Failed to delete product', 500)
    return ok({ message: 'Product deleted' })
  } catch (err) {
    console.error('Admin product DELETE error:', err)
    return fail('Internal server error', 500)
  }
}