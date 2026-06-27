import type { Database } from '~/types/database.types'

// Lightweight profile list (id + name) for assignment selects (e.g. traveler).
export function useProfiles() {
  const supabase = useSupabaseClient<Database>()

  const { data: items, refresh, status } = useAsyncData('profiles', async () => {
    const { data, error } = await supabase.from('profiles').select('id, full_name, role').order('full_name')
    if (error) throw error
    return data
  })

  return { items, status, refresh }
}
