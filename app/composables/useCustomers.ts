import type { Database } from '~/types/database.types'

type Insert = Database['public']['Tables']['customers']['Insert']

export function useCustomers() {
  const supabase = useSupabaseClient<Database>()

  const { data: items, refresh, status } = useAsyncData('customers', async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('*, countries(name), customer_addresses(count)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  })

  async function create(payload: Insert) {
    const { data, error } = await supabase.from('customers').insert(payload).select('id').single()
    if (error) throw error
    await refresh()
    return data
  }
  async function remove(id: string) {
    const { error } = await supabase.from('customers').delete().eq('id', id)
    if (error) throw error
    await refresh()
  }

  return { items, status, refresh, create, remove }
}
