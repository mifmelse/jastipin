import type { Database } from '~/types/database.types'

type Insert = Database['public']['Tables']['sub_categories']['Insert']

export function useSubCategories() {
  const supabase = useSupabaseClient<Database>()

  const { data: items, refresh, status } = useAsyncData('catalog-sub-categories', async () => {
    const { data, error } = await supabase
      .from('sub_categories')
      .select('*, categories(name)')
      .order('name')
    if (error) throw error
    return data
  })

  async function create(payload: Insert) {
    const { error } = await supabase.from('sub_categories').insert(payload)
    if (error) throw error
    await refresh()
  }
  async function update(id: string, payload: Partial<Insert>) {
    const { error } = await supabase.from('sub_categories').update(payload).eq('id', id)
    if (error) throw error
    await refresh()
  }
  async function remove(id: string) {
    const { error } = await supabase.from('sub_categories').delete().eq('id', id)
    if (error) throw error
    await refresh()
  }

  return { items, status, refresh, create, update, remove }
}
