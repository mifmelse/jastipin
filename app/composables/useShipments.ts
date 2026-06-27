import type { Database } from '~/types/database.types'

type Insert = Database['public']['Tables']['shipments']['Insert']
type Update = Database['public']['Tables']['shipments']['Update']

// All shipments with their order/customer/leg. Marking a shipment 'delivered'
// cascades the order + items to 'delivered' via a DB trigger, so we also refresh
// the orders list.
export function useShipments() {
  const supabase = useSupabaseClient<Database>()

  const { data: items, refresh, status } = useAsyncData('shipments', async () => {
    const { data, error } = await supabase
      .from('shipments')
      .select(
        '*, orders!inner(code, status, customers(name), ' +
          'trip_route:trip_routes(sequence, departure_date, trips(name, code), ' +
          'from_country:countries!from_country_id(name, iso2), ' +
          'to_country:countries!to_country_id(name, iso2)))',
      )
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  })

  async function create(payload: Insert) {
    const { error } = await supabase.from('shipments').insert(payload)
    if (error) throw error
    await refresh()
    await refreshNuxtData('orders')
  }
  async function update(id: string, payload: Update) {
    const { error } = await supabase.from('shipments').update(payload).eq('id', id)
    if (error) throw error
    await refresh()
    await refreshNuxtData('orders')
  }
  async function remove(id: string) {
    const { error } = await supabase.from('shipments').delete().eq('id', id)
    if (error) throw error
    await refresh()
  }

  return { items, status, refresh, create, update, remove }
}
