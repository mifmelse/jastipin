import { defineStore } from 'pinia'
import type { Database } from '~/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

// Holds the signed-in user's profile + permission set (cross-component state:
// used by the sidebar and route guards). Permissions resolve by matching
// profiles.role → roles.name → role_permissions → permissions.
export const useAuthStore = defineStore('auth', () => {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  const profile = ref<Profile | null>(null)
  const permissions = ref<Set<string>>(new Set())
  const loaded = ref(false)

  async function load(userId?: string) {
    const id = userId ?? user.value?.id
    if (!id) return reset()

    const { data: prof } = await supabase
      .from('profiles')
      .select('id, full_name, role, user_type, created_at')
      .eq('id', id)
      .single()
    profile.value = prof

    const keys = new Set<string>()
    if (prof?.role) {
      const { data } = await supabase
        .from('roles')
        .select('role_permissions(permissions(key))')
        .eq('name', prof.role)
        .maybeSingle()
      for (const rp of data?.role_permissions ?? []) {
        if (rp.permissions?.key) keys.add(rp.permissions.key)
      }
    }
    permissions.value = keys
    loaded.value = true
  }

  function has(key: string) {
    return permissions.value.has(key)
  }

  function reset() {
    profile.value = null
    permissions.value = new Set()
    loaded.value = false
  }

  return { profile, permissions, loaded, load, has, reset }
})
