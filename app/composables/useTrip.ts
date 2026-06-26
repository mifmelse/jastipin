import type { Database } from '~/types/database.types'

type Update = Database['public']['Tables']['trips']['Update']

export function useTrip(id: string) {
  const supabase = useSupabaseClient<Database>()

  const { data: trip, refresh, status } = useAsyncData(`trip-${id}`, async () => {
    const { data, error } = await supabase.from('trips').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    return data
  })

  async function update(payload: Update) {
    const { error } = await supabase.from('trips').update(payload).eq('id', id)
    if (error) throw error
    await refresh()
  }

  return { trip, status, refresh, update }
}
