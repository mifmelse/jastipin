import type { Database } from '~/types/database.types'

type Insert = Database['public']['Tables']['continents']['Insert']

export function useContinents() {
  const supabase = useSupabaseClient<Database>()

  const { data: items, refresh, status } = useAsyncData('master-continents', async () => {
    const { data, error } = await supabase.from('continents').select('*').order('name')
    if (error) throw error
    return data
  })

  async function create(payload: Insert) {
    const { error } = await supabase.from('continents').insert(payload)
    if (error) throw error
    await refresh()
  }
  async function update(id: string, payload: Partial<Insert>) {
    const { error } = await supabase.from('continents').update(payload).eq('id', id)
    if (error) throw error
    await refresh()
  }
  async function remove(id: string) {
    const { error } = await supabase.from('continents').delete().eq('id', id)
    if (error) throw error
    await refresh()
  }

  return { items, status, refresh, create, update, remove }
}
