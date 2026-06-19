import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/session'
import { ok, fail } from '@/lib/api-response'
import { orderStatusUpdateSchema, VALID_TRANSITIONS } from '@/lib/validations/admin'

const uuidSchema = z.string().uuid()
type Params = { params: Promise<{ id: string }> }

// GET /api/admin/orders/[id] — full order detail
export async function GET(_: NextRequest, { params }: Params) {
  try {
    const adminCheck = await requireAdmin()
    if (!adminCheck.ok) return fail(adminCheck.error, adminCheck.status)

    const { id } = await params
    if (!uuidSchema.safeParse(id).success) return fail('Invalid ID', 400)

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('orders')
      .select('*, order_items(*, product:products(*))')
      .eq('id', id).single()
    if (error || !data) return fail('Order not found', 404)
    return ok(data)
  } catch (err) {
    console.error('Admin order GET error:', err)
    return fail('Internal server error', 500)
  }
}

// PATCH /api/admin/orders/[id] — update order status (forward-only)
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const adminCheck = await requireAdmin()
    if (!adminCheck.ok) return fail(adminCheck.error, adminCheck.status)

    const { id } = await params
    if (!uuidSchema.safeParse(id).success) return fail('Invalid ID', 400)

    let body: unknown
    try { body = await request.json() } catch { return fail('Invalid JSON', 400) }

    const parsed = orderStatusUpdateSchema.safeParse(body)
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Invalid status', 400)

    const admin = createAdminClient()
    const { data: order, error: fetchError } = await admin
      .from('orders').select('status').eq('id', id).single()
    if (fetchError || !order) return fail('Order not found', 404)

    // Enforce forward-only transitions
    const allowed = VALID_TRANSITIONS[order.status] ?? []
    if (!allowed.includes(parsed.data.status)) {
      return fail(`Cannot move order from "${order.status}" to "${parsed.data.status}"`, 400)
    }

    const { data, error } = await admin
      .from('orders')
      .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
      .eq('id', id).select().single()
    if (error || !data) return fail('Failed to update order', 500)
    return ok(data)
  } catch (err) {
    console.error('Admin order PATCH error:', err)
    return fail('Internal server error', 500)
  }
}