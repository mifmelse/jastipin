import type { Database } from '~/types/database.types'

type Insert = Database['public']['Tables']['orders']['Insert']

// List reads from the `order_summaries` view (derived subtotal/total/total_idr);
// mutations write to the base `orders` table.
export function useOrders() {
  const supabase = useSupabaseClient<Database>()

  const { data: items, refresh, status } = useAsyncData('orders', async () => {
    const { data, error } = await supabase
      .from('order_summaries')
      .select(
        '*, customers(name), trip_route:trip_routes(sequence, departure_date, trips(name, code), from_country:countries!from_country_id(name, iso2), to_country:countries!to_country_id(name, iso2))',
      )
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  })

  async function create(payload: Insert) {
    const { data, error } = await supabase.from('orders').insert(payload).select('id').single()
    if (error) throw error
    await refresh()
    return data
  }
  async function remove(id: string) {
    const { error } = await supabase.from('orders').delete().eq('id', id)
    if (error) throw error
    await refresh()
  }

  return { items, status, refresh, create, remove }
}
