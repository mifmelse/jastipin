import type { Database } from '~/types/database.types'

type Update = Database['public']['Tables']['orders']['Update']

// A single order with its leg + customer + chosen shipping address, read from
// the totals view. `update` patches the base table then re-reads the view.
export function useOrder(id: string) {
  const supabase = useSupabaseClient<Database>()

  const { data: order, refresh, status } = useAsyncData(`order-${id}`, async () => {
    const { data, error } = await supabase
      .from('order_summaries')
      .select(
        '*, customers(name, phone), ' +
          'trip_route:trip_routes(id, sequence, departure_date, trips(id, name, code), ' +
          'from_country:countries!from_country_id(id, name, iso2), ' +
          'to_country:countries!to_country_id(id, name, iso2)), ' +
          'shipping_address:customer_addresses(id, label, recipient_name, address_line, city)',
      )
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return data
  })

  async function update(payload: Update) {
    const { error } = await supabase.from('orders').update(payload).eq('id', id)
    if (error) throw error
    await refresh()
  }

  return { order, status, refresh, update }
}
