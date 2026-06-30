import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'

// Delete a user (profile cascades via FK). Cannot delete your own account.
export default defineEventHandler(async (event) => {
  const me = await requirePermission(event, 'users.delete')
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id wajib' })
  if (id === me.id) {
    throw createError({ statusCode: 400, statusMessage: 'Tidak bisa menghapus akun sendiri' })
  }

  const admin = serverSupabaseServiceRole<Database>(event)
  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) throw createError({ statusCode: 400, statusMessage: error.message })
  return { ok: true }
})
