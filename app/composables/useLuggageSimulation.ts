import type { Database } from '~/types/database.types'

// Per-luggage weight/volume totals for a trip, from the derived view.
export function useLuggageSimulation(tripId: Ref<string | null>) {
  const supabase = useSupabaseClient<Database>()

  const { data: items, refresh, status } = useAsyncData(
    'luggage-simulation',
    async () => {
      if (!tripId.value) return []
      const { data, error } = await supabase
        .from('luggage_simulation')
        .select('*')
        .eq('trip_id', tripId.value)
        .order('label')
      if (error) throw error
      return data
    },
    { watch: [tripId] },
  )

  return { items, status, refresh }
}
