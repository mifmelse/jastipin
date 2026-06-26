import type { Database } from '~/types/database.types'

// Flat list of every leg across all trips, for the Order's leg picker.
export function useAllLegs() {
  const supabase = useSupabaseClient<Database>()

  const { data: items, refresh, status } = useAsyncData('all-legs', async () => {
    const { data, error } = await supabase
      .from('trip_routes')
      .select(
        'id, trip_id, sequence, departure_date, trips(name, code), from_country:countries!from_country_id(name, iso2), to_country:countries!to_country_id(name, iso2)',
      )
      .order('departure_date', { ascending: true, nullsFirst: false })
    if (error) throw error
    return data
  })

  return { items, status, refresh }
}
