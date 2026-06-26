import type { Database } from '~/types/database.types'

type Insert = Database['public']['Tables']['trip_itineraries']['Insert']

export function useTripItineraries(tripId: string) {
  const supabase = useSupabaseClient<Database>()

  const { data: items, refresh, status } = useAsyncData(`trip-itin-${tripId}`, async () => {
    const { data, error } = await supabase
      .from('trip_itineraries')
      .select('*')
      .eq('trip_id', tripId)
      .order('date', { ascending: true, nullsFirst: false })
      .order('created_at')
    if (error) throw error
    return data
  })

  async function create(payload: Insert) {
    const { error } = await supabase.from('trip_itineraries').insert(payload)
    if (error) throw error
    await refresh()
  }
  async function update(id: string, payload: Partial<Insert>) {
    const { error } = await supabase.from('trip_itineraries').update(payload).eq('id', id)
    if (error) throw error
    await refresh()
  }
  async function remove(id: string) {
    const { error } = await supabase.from('trip_itineraries').delete().eq('id', id)
    if (error) throw error
    await refresh()
  }

  return { items, status, refresh, create, update, remove }
}
