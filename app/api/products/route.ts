import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/session'
import { ok, fail } from '@/lib/api-response'
import { productQuerySchema, productCreateSchema } from '@/lib/validations/product'

// GET /api/products — public, paginated, filterable
export async function GET(request: NextRequest) {
  try {
    const rawParams = Object.fromEntries(request.nextUrl.searchParams)
    const parsed = productQuerySchema.safeParse(rawParams)

    if (!parsed.success) {
      return fail('Invalid query parameters', 400)
    }

    const { category, search, page, limit } = parsed.data
    const supabase = await createServerSupabaseClient()

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    if (search) {
      // safe — Supabase escapes this, no raw SQL string concat
      const term = `%${search}%`
      query = query.or(`name.ilike.${term},description.ilike.${term}`)
    }

    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Products GET error:', error)
      return fail('Failed to fetch products', 500)
    }

    return ok({
      products: data,
      total: count ?? 0,
      page,
      limit,
    })
  } catch (err) {
    console.error('Products GET unexpected error:', err)
    return fail('Internal server error', 500)
  }
}

// POST /api/products — admin only
export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin()
if (!adminCheck.ok) {
  return fail(adminCheck.error, adminCheck.status)
}

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return fail('Invalid JSON body', 400)
    }

    const parsed = productCreateSchema.safeParse(body)
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? 'Invalid product data', 400)
    }

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('products')
      .insert(parsed.data)
      .select()
      .single()

    if (error) {
      console.error('Products POST error:', error)
      return fail('Failed to create product', 500)
    }

    return ok(data, 201)
  } catch (err) {
    console.error('Products POST unexpected error:', err)
    return fail('Internal server error', 500)
  }
}