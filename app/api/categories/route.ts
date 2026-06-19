import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/session'
import { ok, fail } from '@/lib/api-response'
import { categoryCreateSchema } from '@/lib/validations/category'

// GET /api/categories — public, ordered by display_order
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
    if (error) return fail('Failed to fetch categories', 500)
    return ok(data)
  } catch (err) {
    console.error('Categories GET error:', err)
    return fail('Internal server error', 500)
  }
}

// POST /api/categories — admin only
export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin()
    if (!adminCheck.ok) return fail(adminCheck.error, adminCheck.status)

    let body: unknown
    try { body = await request.json() } catch { return fail('Invalid JSON', 400) }

    const parsed = categoryCreateSchema.safeParse(body)
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Invalid data', 400)

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('categories').insert(parsed.data).select().single()
    if (error) {
      if (error.code === '23505') return fail('Category name or slug already exists', 409)
      return fail('Failed to create category', 500)
    }
    return ok(data, 201)
  } catch (err) {
    console.error('Categories POST error:', err)
    return fail('Internal server error', 500)
  }
}