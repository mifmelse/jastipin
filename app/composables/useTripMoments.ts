import type { Database } from '~/types/database.types'

export type MomentMedia = { url: string; type: string }

export function useTripMoments(tripId: string) {
  const supabase = useSupabaseClient<Database>()

  const { data: items, refresh, status } = useAsyncData(`trip-moments-${tripId}`, async () => {
    const { data, error } = await supabase
      .from('trip_moments')
      .select('*, media:trip_moment_media(*)')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((p) => ({
      ...p,
      media: [...(p.media ?? [])].sort((a, b) => a.sort_order - b.sort_order),
    }))
  })

  // Post + media inserted atomically by the create_moment RPC.
  async function create(body: string, location: string, media: MomentMedia[]) {
    const { error } = await supabase.rpc('create_moment', {
      p_trip_id: tripId,
      p_body: body,
      p_location: location,
      p_media: media,
    })
    if (error) throw error
    await refresh()
  }
  async function remove(id: string) {
    const { error } = await supabase.from('trip_moments').delete().eq('id', id)
    if (error) throw error
    await refresh()
  }

  return { items, status, refresh, create, remove }
}
