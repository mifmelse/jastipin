import type { Database } from '~/types/database.types'

type LuggageInsert = Database['public']['Tables']['luggages']['Insert']
type LuggageUpdate = Database['public']['Tables']['luggages']['Update']
type LoadItemInsert = Database['public']['Tables']['load_items']['Insert']

// Luggages for one trip, each with its packed load_items. Adding/removing a
// load_item flips the order_item status (packed ↔ in_warehouse) via DB triggers,
// so we also refresh the simulation + packable-items queries.
export function useLuggages(tripId: Ref<string | null>) {
  const supabase = useSupabaseClient<Database>()

  const { data: items, refresh, status } = useAsyncData(
    'luggages',
    async () => {
      if (!tripId.value) return []
      const { data, error } = await supabase
        .from('luggages')
        .select(
          '*, luggage_types(name, category, max_weight_g, tare_weight_g, max_volume_cm3, regulation_note), ' +
            'assigned:profiles(full_name), ' +
            'load_items(id, trip_route_id, order_items(id, qty, item_name, weight_g, length_mm, width_mm, height_mm, products(name), orders(code, customers(name))))',
        )
        .eq('trip_id', tripId.value)
        .order('created_at')
      if (error) throw error
      return data
    },
    { watch: [tripId] },
  )

  async function create(payload: LuggageInsert) {
    const { error } = await supabase.from('luggages').insert(payload)
    if (error) throw error
    await refresh()
  }
  async function update(id: string, payload: LuggageUpdate) {
    const { error } = await supabase.from('luggages').update(payload).eq('id', id)
    if (error) throw error
    await refresh()
    await refreshNuxtData('luggage-simulation')
  }
  async function remove(id: string) {
    const { error } = await supabase.from('luggages').delete().eq('id', id)
    if (error) throw error
    await refresh()
    await refreshNuxtData(['luggage-simulation', 'packable-items'])
  }

  async function addLoadItem(payload: LoadItemInsert) {
    const { error } = await supabase.from('load_items').insert(payload)
    if (error) throw error
    await refresh()
    await refreshNuxtData(['luggage-simulation', 'packable-items'])
  }
  async function removeLoadItem(id: string) {
    const { error } = await supabase.from('load_items').delete().eq('id', id)
    if (error) throw error
    await refresh()
    await refreshNuxtData(['luggage-simulation', 'packable-items'])
  }

  return { items, status, refresh, create, update, remove, addLoadItem, removeLoadItem }
}
