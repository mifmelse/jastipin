import type { Database } from '~/types/database.types'

type Update = Database['public']['Tables']['customers']['Update']

export function useCustomer(id: string) {
  const supabase = useSupabaseClient<Database>()

  const { data: customer, refresh, status } = useAsyncData(`customer-${id}`, async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('*, countries(name)')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return data
  })

  async function update(payload: Update) {
    const { error } = await supabase.from('customers').update(payload).eq('id', id)
    if (error) throw error
    await refresh()
  }

  return { customer, status, refresh, update }
}
