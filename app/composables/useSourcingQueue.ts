import type { Database } from '~/types/database.types'

type SourcingInsert = Database['public']['Tables']['sourcing_records']['Insert']

// Shopper workspace: every `sourcing` order_item (optionally one leg), each with
// its sourcing_record (null until first saved). Saving upserts by order_item_id;
// a DB trigger mirrors the record status onto the order_item.
export function useSourcingQueue(legId: Ref<string | null>) {
  const supabase = useSupabaseClient<Database>()

  const { data: items, refresh, status } = useAsyncData(
    'sourcing-queue',
    async () => {
      let q = supabase
        .from('order_items')
        .select(
          'id, qty, item_name, requested_price, status, products(name), ' +
            'orders!inner(code, trip_route_id, customers(name)), sourcing_records(*)',
        )
        .eq('fulfillment_type', 'sourcing')
        .order('created_at')
      if (legId.value) q = q.eq('orders.trip_route_id', legId.value)
      const { data, error } = await q
      if (error) throw error
      return data
    },
    { watch: [legId] },
  )

  async function save(orderItemId: string, payload: Omit<SourcingInsert, 'order_item_id'>) {
    const { error } = await supabase
      .from('sourcing_records')
      .upsert({ order_item_id: orderItemId, ...payload }, { onConflict: 'order_item_id' })
    if (error) throw error
    await refresh()
  }

  return { items, status, refresh, save }
}
