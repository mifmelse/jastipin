import type { H3Event } from 'h3'
import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'

// Gate for admin-only server routes. Verifies the caller is signed in and has
// role 'admin' (checked via their own session, so RLS applies). Throws 401/403.
export async function requireAdmin(event: H3Event) {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const client = await serverSupabaseClient<Database>(event)
  const { data } = await client.from('profiles').select('role').eq('id', user.id).single()
  if (data?.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: admin only' })
  }
  return user
}
