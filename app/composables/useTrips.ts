import type { Database } from '~/types/database.types'

type Insert = Database['public']['Tables']['trips']['Insert']

export function useTrips() {
  const supabase = useSupabaseClient<Database>()

  const { data: items, refresh, status } = useAsyncData('trips', async () => {
    const { data, error } = await supabase
      .from('trips')
      .select('*, trip_routes(count)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  })

  async function create(payload: Insert) {
    const { data, error } = await supabase.from('trips').insert(payload).select('id').single()
    if (error) throw error
    await refresh()
    return data
  }
  async function remove(id: string) {
    const { error } = await supabase.from('trips').delete().eq('id', id)
    if (error) throw error
    await refresh()
  }

  return { items, status, refresh, create, remove }
}
