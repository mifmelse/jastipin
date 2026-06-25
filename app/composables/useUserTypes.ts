import type { Database } from '~/types/database.types'

type Insert = Database['public']['Tables']['user_types']['Insert']

export function useUserTypes() {
  const supabase = useSupabaseClient<Database>()

  const { data: items, refresh, status } = useAsyncData('settings-user-types', async () => {
    const { data, error } = await supabase.from('user_types').select('*').order('name')
    if (error) throw error
    return data
  })

  async function create(payload: Insert) {
    const { error } = await supabase.from('user_types').insert(payload)
    if (error) throw error
    await refresh()
  }
  async function update(id: string, payload: Partial<Insert>) {
    const { error } = await supabase.from('user_types').update(payload).eq('id', id)
    if (error) throw error
    await refresh()
  }
  async function remove(id: string) {
    const { error } = await supabase.from('user_types').delete().eq('id', id)
    if (error) throw error
    await refresh()
  }

  return { items, status, refresh, create, update, remove }
}
