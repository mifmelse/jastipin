import type { Database } from '~/types/database.types'

// List + create/update invoices. Totals stay derived; an invoice just records
// code/dates/status against an order.
export function useInvoices() {
  const supabase = useSupabaseClient<Database>()

  const { data: items, refresh, status } = useAsyncData('invoices', async () => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, orders(code, customers(name))')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  })

  async function createForOrder(orderId: string) {
    const { data, error } = await supabase.from('invoices').insert({ order_id: orderId }).select('id').single()
    if (error) throw error
    await refresh()
    return data
  }
  // Avoid duplicate drafts: reuse the latest invoice for the order if one exists.
  async function getOrCreateForOrder(orderId: string) {
    const { data: existing } = await supabase
      .from('invoices')
      .select('id')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    return existing ?? (await createForOrder(orderId))
  }
  async function updateStatus(id: string, newStatus: string) {
    const { error } = await supabase.from('invoices').update({ status: newStatus }).eq('id', id)
    if (error) throw error
    await refresh()
  }
  async function remove(id: string) {
    const { error } = await supabase.from('invoices').delete().eq('id', id)
    if (error) throw error
    await refresh()
  }

  return { items, status, refresh, createForOrder, getOrCreateForOrder, updateStatus, remove }
}

// Full invoice payload for the printable page: invoice + order (+ derived totals)
// + items + customer + shipping address + company profile.
export function useInvoice(id: string) {
  const supabase = useSupabaseClient<Database>()

  const { data, refresh, status } = useAsyncData(`invoice-${id}`, async () => {
    const { data: inv } = await supabase.from('invoices').select('*').eq('id', id).single()
    if (!inv) return null
    const { data: order } = await supabase.from('order_summaries').select('*').eq('id', inv.order_id).single()
    const { data: itemRows } = await supabase
      .from('order_items')
      .select('id, item_name, qty, requested_price, fulfillment_type, products(name), units(name, symbol)')
      .eq('order_id', inv.order_id)
      .order('created_at')
    const { data: company } = await supabase.from('company_profile').select('*').eq('id', 1).single()
    const customer = order?.customer_id
      ? (await supabase.from('customers').select('name, phone, email').eq('id', order.customer_id).single()).data
      : null
    const address = order?.shipping_address_id
      ? (await supabase.from('customer_addresses').select('*').eq('id', order.shipping_address_id).single()).data
      : null
    return { inv, order, items: itemRows ?? [], company, customer, address }
  })

  async function updateStatus(newStatus: string) {
    const { error } = await supabase.from('invoices').update({ status: newStatus }).eq('id', id)
    if (error) throw error
    await refresh()
  }

  return { data, status, refresh, updateStatus }
}
