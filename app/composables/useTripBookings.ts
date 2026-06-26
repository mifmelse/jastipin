import type { Database } from '~/types/database.types'

type Insert = Database['public']['Tables']['trip_bookings']['Insert']

export function useTripBookings(tripId: string) {
  const supabase = useSupabaseClient<Database>()

  const { data: items, refresh, status } = useAsyncData(`trip-bookings-${tripId}`, async () => {
    const { data, error } = await supabase
      .from('trip_bookings')
      .select('*')
      .eq('trip_id', tripId)
      .order('date', { ascending: true, nullsFirst: false })
    if (error) throw error
    return data
  })

  async function create(payload: Insert) {
    const { error } = await supabase.from('trip_bookings').insert(payload)
    if (error) throw error
    await refresh()
  }
  async function update(id: string, payload: Partial<Insert>) {
    const { error } = await supabase.from('trip_bookings').update(payload).eq('id', id)
    if (error) throw error
    await refresh()
  }
  async function remove(id: string) {
    const { error } = await supabase.from('trip_bookings').delete().eq('id', id)
    if (error) throw error
    await refresh()
  }

  return { items, status, refresh, create, update, remove }
}
