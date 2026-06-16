import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { getSession } from '@/lib/session'
import { ok, fail } from '@/lib/api-response'
import { razorpay } from '@/lib/razorpay'
import { createPaymentOrderSchema } from '@/lib/validations/payment'

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

    const parsed = createPaymentOrderSchema.safeParse(body)
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? 'Invalid request', 400)
    }

    const { orderId } = parsed.data

    // RLS-protected read — confirms this order belongs to this user
    const supabase = await createServerSupabaseClient()
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single()

    if (error || !order) return fail('Order not found', 404)

    if (order.status !== 'pending') {
      return fail('Order is not awaiting payment', 400)
    }

    // Retry-safe: if a Razorpay order already exists for this, reuse it
    if (order.razorpay_order_id) {
      return ok({
        razorpayOrderId: order.razorpay_order_id,
        amount: order.total,
        currency: 'INR',
      })
    }

    // amount is in paise — same unit Razorpay expects, no conversion
    const razorpayOrder = await razorpay.orders.create({
      amount: order.total,
      currency: 'INR',
      receipt: order.id,
    })

    // Service role — RLS has no "update own order" policy by design,
    // this write is authorized by our own checks above, not by RLS.
    const admin = createAdminClient()
    const { error: updateError } = await admin
      .from('orders')
      .update({ razorpay_order_id: razorpayOrder.id })
      .eq('id', orderId)

    if (updateError) {
      console.error('Order update error:', updateError)
      return fail('Failed to initiate payment', 500)
    }

    return ok({
      razorpayOrderId: razorpayOrder.id,
      amount: order.total,
      currency: 'INR',
    })
  } catch (err) {
    console.error('Payment create-order unexpected error:', err)
    return fail('Internal server error', 500)
  }
}