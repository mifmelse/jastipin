import type { Database } from '~/types/database.types'

// Items ready to pack for a trip: status 'in_warehouse', belonging to any of the
// trip's legs. (Carry-over means a packed item can still be re-added to another
// leg — but the default queue is what's sitting in the warehouse.)
export function usePackableItems(tripId: Ref<string | null>) {
  const supabase = useSupabaseClient<Database>()

  const { data: items, refresh, status } = useAsyncData(
    'packable-items',
    async () => {
      if (!tripId.value) return []
      const { data: legs } = await supabase.from('trip_routes').select('id').eq('trip_id', tripId.value)
      const legIds = (legs ?? []).map((l) => l.id)
      if (!legIds.length) return []

      const { data, error } = await supabase
        .from('order_items')
        .select('id, item_name, qty, weight_g, length_mm, width_mm, height_mm, status, products(name), orders!inner(code, trip_route_id, customers(name))')
        .eq('status', 'in_warehouse')
        .in('orders.trip_route_id', legIds)
        .order('created_at')
      if (error) throw error
      return data
    },
    { watch: [tripId] },
  )

  return { items, status, refresh }
}
