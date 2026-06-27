import type { Database } from '~/types/database.types'

// Per-trip revenue / cost / profit (derived view).
export function useTripPnl() {
  const supabase = useSupabaseClient<Database>()

  const { data: items, refresh, status } = useAsyncData('trip-pnl', async () => {
    const { data, error } = await supabase
      .from('trip_pnl')
      .select('*')
      .order('profit_idr', { ascending: false })
    if (error) throw error
    return data
  })

  return { items, status, refresh }
}
