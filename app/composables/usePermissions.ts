import type { Database } from '~/types/database.types'

type Insert = Database['public']['Tables']['permissions']['Insert']

export function usePermissions() {
  const supabase = useSupabaseClient<Database>()

  const { data: items, refresh, status } = useAsyncData('settings-permissions', async () => {
    const { data, error } = await supabase.from('permissions').select('*').order('key')
    if (error) throw error
    return data
  })

  async function create(payload: Insert) {
    const { error } = await supabase.from('permissions').insert(payload)
    if (error) throw error
    await refresh()
  }
  async function update(id: string, payload: Partial<Insert>) {
    const { error } = await supabase.from('permissions').update(payload).eq('id', id)
    if (error) throw error
    await refresh()
  }
  async function remove(id: string) {
    const { error } = await supabase.from('permissions').delete().eq('id', id)
    if (error) throw error
    await refresh()
  }

  return { items, status, refresh, create, update, remove }
}
