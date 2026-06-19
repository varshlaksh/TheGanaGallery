import { createAdminClient } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/session'
import { ok, fail } from '@/lib/api-response'

export async function GET() {
  try {
    const adminCheck = await requireAdmin()
    if (!adminCheck.ok) return fail(adminCheck.error, adminCheck.status)

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('orders')
      .select('*, order_items(*, product:products(*))')
      .order('created_at', { ascending: false })
    if (error) return fail('Failed to fetch orders', 500)
    return ok(data)
  } catch (err) {
    console.error('Admin orders GET error:', err)
    return fail('Internal server error', 500)
  }
}