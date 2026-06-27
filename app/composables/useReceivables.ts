import type { Database } from '~/types/database.types'

type PaymentInsert = Database['public']['Tables']['payments']['Insert']

// Receivables = billed vs collected per order (from the ar_per_order view).
// Recording a paid payment moves the outstanding down.
export function useReceivables() {
  const supabase = useSupabaseClient<Database>()

  const { data: items, refresh, status } = useAsyncData('ar-per-order', async () => {
    const { data, error } = await supabase
      .from('ar_per_order')
      .select('*')
      .order('outstanding_idr', { ascending: false })
    if (error) throw error
    return data
  })

  async function paymentsFor(orderId: string) {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  }
  async function recordPayment(payload: PaymentInsert) {
    const { error } = await supabase.from('payments').insert(payload)
    if (error) throw error
    await refresh()
    await refreshNuxtData('trip-pnl')
  }
  async function removePayment(id: string) {
    const { error } = await supabase.from('payments').delete().eq('id', id)
    if (error) throw error
    await refresh()
    await refreshNuxtData('trip-pnl')
  }

  return { items, status, refresh, paymentsFor, recordPayment, removePayment }
}
