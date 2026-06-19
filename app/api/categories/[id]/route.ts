import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/session'
import { ok, fail } from '@/lib/api-response'
import { categoryUpdateSchema } from '@/lib/validations/category'

const uuidSchema = z.string().uuid()
type Params = { params: Promise<{ id: string }> }

// PUT /api/categories/[id] — admin only
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const adminCheck = await requireAdmin()
    if (!adminCheck.ok) return fail(adminCheck.error, adminCheck.status)

    const { id } = await params
    if (!uuidSchema.safeParse(id).success) return fail('Invalid ID', 400)

    let body: unknown
    try { body = await request.json() } catch { return fail('Invalid JSON', 400) }

    const parsed = categoryUpdateSchema.safeParse(body)
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Invalid data', 400)
    if (Object.keys(parsed.data).length === 0) return fail('No fields to update', 400)

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('categories').update(parsed.data).eq('id', id).select().single()
    if (error || !data) return fail('Category not found', 404)
    return ok(data)
  } catch (err) {
    console.error('Category PUT error:', err)
    return fail('Internal server error', 500)
  }
}

// DELETE /api/categories/[id] — admin only, soft delete
export async function DELETE(_: NextRequest, { params }: Params) {
  try {
    const adminCheck = await requireAdmin()
    if (!adminCheck.ok) return fail(adminCheck.error, adminCheck.status)

    const { id } = await params
    if (!uuidSchema.safeParse(id).success) return fail('Invalid ID', 400)

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('categories').update({ is_active: false }).eq('id', id).select().single()
    if (error || !data) return fail('Category not found', 404)
    return ok({ message: 'Category deactivated' })
  } catch (err) {
    console.error('Category DELETE error:', err)
    return fail('Internal server error', 500)
  }
}