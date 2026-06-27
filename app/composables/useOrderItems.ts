import type { Database } from '~/types/database.types'

type Insert = Database['public']['Tables']['order_items']['Insert']

// Line items for one order.
export function useOrderItems(orderId: string) {
  const supabase = useSupabaseClient<Database>()

  const { data: items, refresh, status } = useAsyncData(`order-items-${orderId}`, async () => {
    const { data, error } = await supabase
      .from('order_items')
      .select('*, products(name, base_price, weight_g, length_mm, width_mm, height_mm), units(name, symbol), sourcing_records(is_substitute, substitute_note)')
      .eq('order_id', orderId)
      .order('created_at')
    if (error) throw error
    return data
  })

  async function create(payload: Insert) {
    const { error } = await supabase.from('order_items').insert(payload)
    if (error) throw error
    await refresh()
  }
  async function update(id: string, payload: Partial<Insert>) {
    const { error } = await supabase.from('order_items').update(payload).eq('id', id)
    if (error) throw error
    await refresh()
  }
  async function remove(id: string) {
    const { error } = await supabase.from('order_items').delete().eq('id', id)
    if (error) throw error
    await refresh()
  }

  return { items, status, refresh, create, update, remove }
}
