import type { Database } from '~/types/database.types'

type WarehouseInsert = Database['public']['Tables']['warehouse_items']['Insert']

// Intake queue: order_items that came out of fulfillment (purchased/received)
// and aren't logged in the warehouse yet. Receiving inserts a warehouse_item;
// a DB trigger flips the item to 'in_warehouse' (so it leaves this queue).
export function useWarehouseIntake() {
  const supabase = useSupabaseClient<Database>()

  const { data: items, refresh, status } = useAsyncData('warehouse-intake', async () => {
    const { data, error } = await supabase
      .from('order_items')
      .select('id, qty, item_name, status, weight_g, length_mm, width_mm, height_mm, products(name, weight_g), orders!inner(code, customers(name))')
      .in('status', ['purchased', 'received'])
      .order('created_at')
    if (error) throw error
    return data
  })

  async function receive(orderItemId: string, payload: Omit<WarehouseInsert, 'order_item_id'>) {
    const { error } = await supabase.from('warehouse_items').insert({ order_item_id: orderItemId, ...payload })
    if (error) throw error
    await refresh()
    await refreshNuxtData('warehouse-stock') // the item now shows up in Stock
  }

  return { items, status, refresh, receive }
}
