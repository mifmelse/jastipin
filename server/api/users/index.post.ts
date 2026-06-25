import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'

// Create a new user. The profiles trigger fills role/full_name from metadata.
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody<{
    email: string
    password: string
    full_name?: string
    role?: string
    user_type?: string
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

  // user_type isn't part of the trigger — set it after creation if provided.
  if (body.user_type) {
    await admin.from('profiles').update({ user_type: body.user_type }).eq('id', data.user.id)
  }
  return { id: data.user.id }
})
