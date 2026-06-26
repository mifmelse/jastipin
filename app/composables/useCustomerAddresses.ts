import type { Database } from '~/types/database.types'

type Insert = Database['public']['Tables']['customer_addresses']['Insert']

export function useCustomerAddresses(customerId: string) {
  const supabase = useSupabaseClient<Database>()

  const { data: items, refresh, status } = useAsyncData(`customer-addresses-${customerId}`, async () => {
    const { data, error } = await supabase
      .from('customer_addresses')
      .select('*, countries(name)')
      .eq('customer_id', customerId)
      .order('label')
    if (error) throw error
    return data
  })

  async function create(payload: Insert) {
    const { error } = await supabase.from('customer_addresses').insert(payload)
    if (error) throw error
    await refresh()
  }
  async function update(id: string, payload: Partial<Insert>) {
    const { error } = await supabase.from('customer_addresses').update(payload).eq('id', id)
    if (error) throw error
    await refresh()
  }
  async function remove(id: string) {
    const { error } = await supabase.from('customer_addresses').delete().eq('id', id)
    if (error) throw error
    await refresh()
  }

  return { items, status, refresh, create, update, remove }
}
