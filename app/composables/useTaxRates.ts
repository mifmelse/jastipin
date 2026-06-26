import type { Database } from '~/types/database.types'

type Insert = Database['public']['Tables']['tax_rates']['Insert']

export function useTaxRates() {
  const supabase = useSupabaseClient<Database>()

  const { data: items, refresh, status } = useAsyncData('tax-rates', async () => {
    const { data, error } = await supabase.from('tax_rates').select('*').order('rate')
    if (error) throw error
    return data
  })

  async function create(payload: Insert) {
    const { error } = await supabase.from('tax_rates').insert(payload)
    if (error) throw error
    await refresh()
  }
  async function update(id: string, payload: Partial<Insert>) {
    const { error } = await supabase.from('tax_rates').update(payload).eq('id', id)
    if (error) throw error
    await refresh()
  }
  async function remove(id: string) {
    const { error } = await supabase.from('tax_rates').delete().eq('id', id)
    if (error) throw error
    await refresh()
  }

  return { items, status, refresh, create, update, remove }
}
