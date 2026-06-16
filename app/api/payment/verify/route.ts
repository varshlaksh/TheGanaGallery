import { NextRequest } from 'next/server'
import crypto from 'crypto'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { getSession } from '@/lib/session'
import { ok, fail } from '@/lib/api-response'
import { verifyPaymentSchema } from '@/lib/validations/payment'

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

    const parsed = verifyPaymentSchema.safeParse(body)
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? 'Invalid payment data', 400)
    }

    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data

    const supabase = await createServerSupabaseClient()
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single()

    if (error || !order) return fail('Order not found', 404)

    // Idempotent — if already verified, don't error on retry
    if (order.status === 'paid') {
      return ok({ success: true, message: 'Order already verified' })
    }

    if (order.status !== 'pending') {
      return fail('Order cannot be verified in its current state', 400)
    }

    if (order.razorpay_order_id !== razorpay_order_id) {
      return fail('Order/payment mismatch', 400)
    }

    // THE critical check — recompute the signature ourselves.
    // Without this, anyone could POST fake "success" data and
    // mark their order paid without paying.
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    const isValid =
      expectedSignature.length === razorpay_signature.length &&
      crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(razorpay_signature)
      )

    if (!isValid) {
      console.error('Payment signature mismatch for order', orderId)
      return fail('Payment verification failed', 400)
    }

    const admin = createAdminClient()
    const { error: updateError } = await admin
      .from('orders')
      .update({ status: 'paid', updated_at: new Date().toISOString() })
      .eq('id', orderId)

    if (updateError) {
      console.error('Order update error:', updateError)
      return fail('Failed to update order status', 500)
    }

    return ok({ success: true })
  } catch (err) {
    console.error('Payment verify unexpected error:', err)
    return fail('Internal server error', 500)
  }
}