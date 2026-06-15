import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getSession } from '@/lib/session'
import { ok, fail } from '@/lib/api-response'
import { createOrderSchema } from '@/lib/validations/order'

// GET /api/orders — logged-in user's own orders
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) return fail('Unauthorized', 401)

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*, product:products(*))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Orders GET error:', error)
      return fail('Failed to fetch orders', 500)
    }

    return ok(data)
  } catch (err) {
    console.error('Orders GET unexpected error:', err)
    return fail('Internal server error', 500)
  }
}

// POST /api/orders — create order from cart
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) return fail('Unauthorized', 401)

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return fail('Invalid JSON body', 400)
    }

    const parsed = createOrderSchema.safeParse(body)
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? 'Invalid order data', 400)
    }

    const supabase = await createServerSupabaseClient()

    // All price/stock logic happens inside this DB function —
    // client never controls price or total.
    const { data: orderId, error } = await supabase.rpc('create_order', {
      p_user_id: user.id,
      p_items: parsed.data.items,
      p_shipping_address: parsed.data.shipping_address,
    })

    if (error) {
      console.error('create_order RPC error:', error)
      // messages here are our own raised exceptions (stock/validation) — safe to show
      return fail(error.message || 'Failed to create order', 400)
    }

    return ok({ orderId, status: 'pending' }, 201)
  } catch (err) {
    console.error('Orders POST unexpected error:', err)
    return fail('Internal server error', 500)
  }
}