import type { Database } from '~/types/database.types'

type IntakeInsert = Database['public']['Tables']['drop_in_intakes']['Insert']

// Intake desk: every `drop_in` order_item (optionally one leg), each with its
// intake record (null until received). Saving upserts by order_item_id; a DB
// trigger sets the order_item status to 'received'.
export function useDropInQueue(legId: Ref<string | null>) {
  const supabase = useSupabaseClient<Database>()

  const { data: items, refresh, status } = useAsyncData(
    'dropin-queue',
    async () => {
      let q = supabase
        .from('order_items')
        .select(
          'id, qty, item_name, status, products(name), ' +
            'orders!inner(code, trip_route_id, customers(name)), drop_in_intakes(*)',
        )
        .eq('fulfillment_type', 'drop_in')
        .order('created_at')
      if (legId.value) q = q.eq('orders.trip_route_id', legId.value)
      const { data, error } = await q
      if (error) throw error
      return data
    },
    { watch: [legId] },
  )

  async function save(orderItemId: string, payload: Omit<IntakeInsert, 'order_item_id'>) {
    const { error } = await supabase
      .from('drop_in_intakes')
      .upsert({ order_item_id: orderItemId, ...payload }, { onConflict: 'order_item_id' })
    if (error) throw error
    await refresh()
  }

  return { items, status, refresh, save }
}
