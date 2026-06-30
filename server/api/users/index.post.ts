import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'

// Create a new user. The profiles trigger fills role/full_name from metadata.
export default defineEventHandler(async (event) => {
  await requirePermission(event, 'users.write')
  const body = await readBody<{
    email: string
    password: string
    full_name?: string
    role?: string
    user_type?: string
    avatar_url?: string
  }>(event)

  if (!body.email || !body.password) {
    throw createError({ statusCode: 400, statusMessage: 'Email & password wajib' })
  }

  const admin = serverSupabaseServiceRole<Database>(event)
  const { data, error } = await admin.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true,
    user_metadata: { full_name: body.full_name ?? null, role: body.role ?? 'staff' },
  })
  if (error) throw createError({ statusCode: 400, statusMessage: error.message })

  // user_type & avatar_url aren't part of the trigger — set them after creation.
  const patch: { user_type?: string; avatar_url?: string } = {}
  if (body.user_type) patch.user_type = body.user_type
  if (body.avatar_url) patch.avatar_url = body.avatar_url
  if (Object.keys(patch).length) {
    await admin.from('profiles').update(patch).eq('id', data.user.id)
  }
  return { id: data.user.id }
})
