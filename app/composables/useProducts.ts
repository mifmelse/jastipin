import type { Database } from '~/types/database.types'

type Insert = Database['public']['Tables']['products']['Insert']

export function useProducts() {
  const supabase = useSupabaseClient<Database>()

  const { data: items, refresh, status } = useAsyncData('catalog-products', async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*, brands(name), categories(name), sub_categories(name), units(name, symbol), countries(name)')
      .order('name')
    if (error) throw error
    return data
  })

  async function create(payload: Insert) {
    const { error } = await supabase.from('products').insert(payload)
    if (error) throw error
    await refresh()
  }
  async function update(id: string, payload: Partial<Insert>) {
    const { error } = await supabase.from('products').update(payload).eq('id', id)
    if (error) throw error
    await refresh()
  }
  async function remove(id: string) {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) throw error
    await refresh()
  }

  return { items, status, refresh, create, update, remove }
}
