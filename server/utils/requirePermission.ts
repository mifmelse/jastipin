import type { H3Event } from 'h3'
import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'

// Gate a server route on a specific permission (not a hard-coded role). The
// caller's role → role_permissions → permissions is checked via their OWN
// session (RLS applies). Any role that grants the key passes — so 'developer'
// (or a custom role) works, not just 'admin'. Throws 401/403.
export async function requirePermission(event: H3Event, key: string) {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const client = await serverSupabaseClient<Database>(event)
  const { data: prof } = await client.from('profiles').select('role').eq('id', user.id).single()
  if (!prof?.role) throw createError({ statusCode: 403, statusMessage: `Forbidden: ${key} required` })

  const { data } = await client
    .from('role_permissions')
    .select('permissions!inner(key), roles!inner(name)')
    .eq('roles.name', prof.role)
    .eq('permissions.key', key)
    .limit(1)
  if (!data?.length) throw createError({ statusCode: 403, statusMessage: `Forbidden: ${key} required` })

  return user
}
