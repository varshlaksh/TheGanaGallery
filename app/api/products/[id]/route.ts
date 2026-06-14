import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/session'
import { ok, fail } from '@/lib/api-response'
import { productUpdateSchema } from '@/lib/validations/product'

const uuidSchema = z.string().uuid()

type Params = { params: Promise<{ id: string }> }

// GET /api/products/[id] — public
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    if (!uuidSchema.safeParse(id).success) {
      return fail('Invalid product ID', 400)
    }

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return fail('Product not found', 404)
    }

    return ok(data)
  } catch (err) {
    console.error('Product GET error:', err)
    return fail('Internal server error', 500)
  }
}

// PUT /api/products/[id] — admin only
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const adminCheck = await requireAdmin()
if (!adminCheck.ok) {
  return fail(adminCheck.error, adminCheck.status)
}

    const { id } = await params
    if (!uuidSchema.safeParse(id).success) {
      return fail('Invalid product ID', 400)
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return fail('Invalid JSON body', 400)
    }

    const parsed = productUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? 'Invalid product data', 400)
    }

    if (Object.keys(parsed.data).length === 0) {
      return fail('No fields to update', 400)
    }

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('products')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error || !data) {
      return fail('Product not found', 404)
    }

    return ok(data)
  } catch (err) {
    console.error('Product PUT error:', err)
    return fail('Internal server error', 500)
  }
}

// DELETE /api/products/[id] — admin only, soft delete
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const adminCheck = await requireAdmin()
    if ('error' in adminCheck) {
      return fail(adminCheck.error, adminCheck.status)
    }

    const { id } = await params
    if (!uuidSchema.safeParse(id).success) {
      return fail('Invalid product ID', 400)
    }

    const supabase = await createServerSupabaseClient()

    // Soft delete — keeps product row for past order references
    const { data, error } = await supabase
      .from('products')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error || !data) {
      return fail('Product not found', 404)
    }

    return ok({ message: 'Product deactivated' })
  } catch (err) {
    console.error('Product DELETE error:', err)
    return fail('Internal server error', 500)
  }
}