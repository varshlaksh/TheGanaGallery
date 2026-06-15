import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getSession } from '@/lib/session'
import { ok, fail } from '@/lib/api-response'

const uuidSchema = z.string().uuid()

// GET /api/orders/[id] — owner or admin only (enforced by RLS)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession()
    if (!user) return fail('Unauthorized', 401)

    const { id } = await params
    if (!uuidSchema.safeParse(id).success) {
      return fail('Invalid order ID', 400)
    }

    const supabase = await createServerSupabaseClient()

    // RLS ensures only the owner or an admin can see this row —
    // if neither, this returns no rows (404), not 403.
    // This avoids leaking whether an order ID exists at all.
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*, product:products(*))')
      .eq('id', id)
      .single()

    if (error || !data) {
      return fail('Order not found', 404)
    }

    return ok(data)
  } catch (err) {
    console.error('Order GET error:', err)
    return fail('Internal server error', 500)
  }
}