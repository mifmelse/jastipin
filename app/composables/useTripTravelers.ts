import type { Database } from '~/types/database.types'

// Travelers assigned to one trip (who physically carries goods). Joined with the
// profile for display. Load Planning reads this to scope luggage-traveler picks.
export function useTripTravelers(tripId: Ref<string>) {
  const supabase = useSupabaseClient<Database>()

  const { data: items, refresh, status } = useAsyncData(
    'trip-travelers',
    async () => {
      if (!tripId.value) return []
      const { data, error } = await supabase
        .from('trip_travelers')
        .select('*, profiles(id, full_name, role)')
        .eq('trip_id', tripId.value)
        .order('role')
      if (error) throw error
      return data
    },
    { watch: [tripId] },
  )

  async function add(profileId: string, role: string) {
    const { error } = await supabase.from('trip_travelers').insert({ trip_id: tripId.value, profile_id: profileId, role })
    if (error) throw error
    await refresh()
  }
  async function updateRole(id: string, role: string) {
    const { error } = await supabase.from('trip_travelers').update({ role }).eq('id', id)
    if (error) throw error
    await refresh()
  }
  async function remove(id: string) {
    const { error } = await supabase.from('trip_travelers').delete().eq('id', id)
    if (error) throw error
    await refresh()
  }

  return { items, status, refresh, add, updateRole, remove }
}
