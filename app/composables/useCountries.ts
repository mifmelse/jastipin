import type { Database } from '~/types/database.types'

type Insert = Database['public']['Tables']['countries']['Insert']

export function useCountries() {
  const supabase = useSupabaseClient<Database>()

  const { data: items, refresh, status } = useAsyncData('master-countries', async () => {
    const { data, error } = await supabase.from('countries').select('*').order('name')
    if (error) throw error
    return data
  })

  async function create(payload: Insert) {
    const { error } = await supabase.from('countries').insert(payload)
    if (error) throw error
    await refresh()
  }
  async function update(id: string, payload: Partial<Insert>) {
    const { error } = await supabase.from('countries').update(payload).eq('id', id)
    if (error) throw error
    await refresh()
  }
  async function remove(id: string) {
    const { error } = await supabase.from('countries').delete().eq('id', id)
    if (error) throw error
    await refresh()
  }

  return { items, status, refresh, create, update, remove }
}
