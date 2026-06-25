import type { Database } from '~/types/database.types'

type Insert = Database['public']['Tables']['brands']['Insert']

export function useBrands() {
  const supabase = useSupabaseClient<Database>()

  const { data: items, refresh, status } = useAsyncData('catalog-brands', async () => {
    const { data, error } = await supabase
      .from('brands')
      .select('*, countries(name)')
      .order('name')
    if (error) throw error
    return data
  })

  async function create(payload: Insert) {
    const { error } = await supabase.from('brands').insert(payload)
    if (error) throw error
    await refresh()
  }
  async function update(id: string, payload: Partial<Insert>) {
    const { error } = await supabase.from('brands').update(payload).eq('id', id)
    if (error) throw error
    await refresh()
  }
  async function remove(id: string) {
    const { error } = await supabase.from('brands').delete().eq('id', id)
    if (error) throw error
    await refresh()
  }

  return { items, status, refresh, create, update, remove }
}
