import type { Database } from '~/types/database.types'

type WarehouseUpdate = Database['public']['Tables']['warehouse_items']['Update']

// Stock: everything logged in the warehouse and not yet packed. Shared by the
// Stock and Conditions tabs (same useAsyncData key → one fetch).
export function useWarehouseStock() {
  const supabase = useSupabaseClient<Database>()

  const { data: items, refresh, status } = useAsyncData('warehouse-stock', async () => {
    const { data, error } = await supabase
      .from('warehouse_items')
      .select(
        '*, order_items!inner(status, qty, item_name, weight_g, products(name), orders(code, customers(name)))',
      )
      .eq('order_items.status', 'in_warehouse')
      .order('intake_at', { ascending: false })
    if (error) throw error
    return data
  })

  async function update(id: string, payload: WarehouseUpdate) {
    const { error } = await supabase.from('warehouse_items').update(payload).eq('id', id)
    if (error) throw error
    await refresh()
  }

  // No remove(): an item leaves the warehouse by being packed (Load Planning),
  // not by deleting its record — deleting would orphan the item at status
  // 'in_warehouse' with no warehouse row. Mis-received? mark condition 'missing'.

  return { items, status, refresh, update }
}
