import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'

// List all users: auth.users (for email) merged with their profile row.
export default defineEventHandler(async (event) => {
  await requirePermission(event, 'users.read')
  const admin = serverSupabaseServiceRole<Database>(event)

  const { data: list, error } = await admin.auth.admin.listUsers()
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const { data: profiles } = await admin.from('profiles').select('*')
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]))

  return list.users.map((u) => {
    const p = byId.get(u.id)
    return {
      id: u.id,
      email: u.email ?? null,
      created_at: u.created_at,
      full_name: p?.full_name ?? null,
      role: p?.role ?? null,
      user_type: p?.user_type ?? null,
      avatar_url: p?.avatar_url ?? null,
    }
  })
})
