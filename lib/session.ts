import { createServerSupabaseClient } from './supabase-server'
import type { User } from '@supabase/supabase-js'

export async function getSession() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getUserRole(userId: string) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()
  return data?.role ?? 'customer'
}

// Use at the top of any admin-only route handler
export async function requireAdmin(): Promise<
  | { ok: true; user: User }
  | { ok: false; error: string; status: number }
> {
  const user = await getSession()
  if (!user) return { ok: false, error: 'Unauthorized', status: 401 }

  const role = await getUserRole(user.id)
  if (role !== 'admin') return { ok: false, error: 'Forbidden', status: 403 }

  return { ok: true, user }
}