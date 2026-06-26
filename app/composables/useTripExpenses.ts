import type { Database } from '~/types/database.types'

type Insert = Database['public']['Tables']['trip_expenses']['Insert']

export function useTripExpenses(tripId: string) {
  const supabase = useSupabaseClient<Database>()

  const { data: items, refresh, status } = useAsyncData(`trip-expenses-${tripId}`, async () => {
    const { data, error } = await supabase
      .from('trip_expenses')
      .select('*')
      .eq('trip_id', tripId)
      .order('spent_at', { ascending: true, nullsFirst: false })
    if (error) throw error
    return data
  })

  async function create(payload: Insert) {
    const { error } = await supabase.from('trip_expenses').insert(payload)
    if (error) throw error
    await refresh()
  }
  async function update(id: string, payload: Partial<Insert>) {
    const { error } = await supabase.from('trip_expenses').update(payload).eq('id', id)
    if (error) throw error
    await refresh()
  }
  async function remove(id: string) {
    const { error } = await supabase.from('trip_expenses').delete().eq('id', id)
    if (error) throw error
    await refresh()
  }

  return { items, status, refresh, create, update, remove }
}
