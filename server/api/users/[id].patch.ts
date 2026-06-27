import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'

// Update a user's profile (role / full_name / user_type).
export default defineEventHandler(async (event) => {
  await requirePermission(event, 'users.write')
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id wajib' })

  const body = await readBody<{ full_name?: string; role?: string; user_type?: string | null; avatar_url?: string | null }>(event)

  const admin = serverSupabaseServiceRole<Database>(event)
  const { error } = await admin
    .from('profiles')
    .update({ full_name: body.full_name, role: body.role, user_type: body.user_type, avatar_url: body.avatar_url })
    .eq('id', id)
  if (error) throw createError({ statusCode: 400, statusMessage: error.message })
  return { ok: true }
})
