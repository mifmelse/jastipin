import type { Database } from '~/types/database.types'

type Insert = Database['public']['Tables']['currencies']['Insert']

export function useCurrencies() {
  const supabase = useSupabaseClient<Database>()

  const { data: items, refresh, status } = useAsyncData('currencies', async () => {
    const { data, error } = await supabase.from('currencies').select('*').order('code')
    if (error) throw error
    return data
  })

  async function create(payload: Insert) {
    const { error } = await supabase.from('currencies').insert(payload)
    if (error) throw error
    await refresh()
  }
  async function update(id: string, payload: Partial<Insert>) {
    const { error } = await supabase.from('currencies').update(payload).eq('id', id)
    if (error) throw error
    await refresh()
  }
  async function remove(id: string) {
    const { error } = await supabase.from('currencies').delete().eq('id', id)
    if (error) throw error
    await refresh()
  }

  return { items, status, refresh, create, update, remove }
}
