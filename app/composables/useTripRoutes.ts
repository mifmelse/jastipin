import type { Database } from '~/types/database.types'

type Insert = Database['public']['Tables']['trip_routes']['Insert']

export function useTripRoutes(tripId: string) {
  const supabase = useSupabaseClient<Database>()

  const { data: items, refresh, status } = useAsyncData(`trip-routes-${tripId}`, async () => {
    const { data, error } = await supabase
      .from('trip_routes')
      .select('*, from_country:countries!from_country_id(name, iso2), to_country:countries!to_country_id(name, iso2)')
      .eq('trip_id', tripId)
      .order('sequence')
    if (error) throw error
    return data
  })

  async function create(payload: Insert) {
    const { error } = await supabase.from('trip_routes').insert(payload)
    if (error) throw error
    await refresh()
  }
  // One atomic insert of several legs (used for round trips: outbound + return).
  async function createMany(payloads: Insert[]) {
    const { error } = await supabase.from('trip_routes').insert(payloads)
    if (error) throw error
    await refresh()
  }
  async function remove(id: string) {
    const { error } = await supabase.from('trip_routes').delete().eq('id', id)
    if (error) throw error
    await refresh()
  }

  return { items, status, refresh, create, createMany, remove }
}
