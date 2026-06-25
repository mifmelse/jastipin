import type { Database } from '~/types/database.types'

type Insert = Database['public']['Tables']['roles']['Insert']

export function useRoles() {
  const supabase = useSupabaseClient<Database>()

  const { data: items, refresh, status } = useAsyncData('settings-roles', async () => {
    const { data, error } = await supabase
      .from('roles')
      .select('*, role_permissions(count)')
      .order('name')
    if (error) throw error
    return data
  })

  async function create(payload: Insert) {
    const { error } = await supabase.from('roles').insert(payload)
    if (error) throw error
    await refresh()
  }
  async function update(id: string, payload: Partial<Insert>) {
    const { error } = await supabase.from('roles').update(payload).eq('id', id)
    if (error) throw error
    await refresh()
  }
  async function remove(id: string) {
    const { error } = await supabase.from('roles').delete().eq('id', id)
    if (error) throw error
    await refresh()
  }

  // Permission assignment (role_permissions matrix).
  async function getPermissionIds(roleId: string) {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('permission_id')
      .eq('role_id', roleId)
    if (error) throw error
    return (data ?? []).map((r) => r.permission_id)
  }

  async function savePermissions(roleId: string, permissionIds: string[]) {
    const { error: delErr } = await supabase.from('role_permissions').delete().eq('role_id', roleId)
    if (delErr) throw delErr
    if (permissionIds.length) {
      const rows = permissionIds.map((permission_id) => ({ role_id: roleId, permission_id }))
      const { error: insErr } = await supabase.from('role_permissions').insert(rows)
      if (insErr) throw insErr
    }
    await refresh()
  }

  return { items, status, refresh, create, update, remove, getPermissionIds, savePermissions }
}
