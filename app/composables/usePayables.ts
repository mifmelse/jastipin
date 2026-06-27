import type { Database } from '~/types/database.types'

type ManualInsert = Database['public']['Tables']['manual_payables']['Insert']

// Payables ledger (derived view). Settling/un-settling writes the thin overlay;
// manual 'other' payables are real rows.
export function usePayables() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  const { data: items, refresh, status } = useAsyncData('payables', async () => {
    const { data, error } = await supabase
      .from('payables')
      .select('*')
      .order('incurred_at', { ascending: false, nullsFirst: false })
    if (error) throw error
    return data
  })

  async function settle(sourceType: string, sourceId: string, method: string | null) {
    const { error } = await supabase
      .from('payable_settlements')
      .upsert(
        { source_type: sourceType, source_id: sourceId, status: 'paid', paid_at: new Date().toISOString(), method, recorded_by: user.value?.id ?? null },
        { onConflict: 'source_type,source_id' },
      )
    if (error) throw error
    await refresh()
    await refreshNuxtData('trip-pnl')
  }
  async function unsettle(sourceType: string, sourceId: string) {
    const { error } = await supabase
      .from('payable_settlements')
      .delete()
      .eq('source_type', sourceType)
      .eq('source_id', sourceId)
    if (error) throw error
    await refresh()
    await refreshNuxtData('trip-pnl')
  }

  async function addManual(payload: ManualInsert) {
    const { error } = await supabase.from('manual_payables').insert(payload)
    if (error) throw error
    await refresh()
    await refreshNuxtData('trip-pnl')
  }
  async function removeManual(id: string) {
    // also drop any settlement overlay row for it
    await supabase.from('payable_settlements').delete().eq('source_type', 'other').eq('source_id', id)
    const { error } = await supabase.from('manual_payables').delete().eq('id', id)
    if (error) throw error
    await refresh()
    await refreshNuxtData('trip-pnl')
  }

  return { items, status, refresh, settle, unsettle, addManual, removeManual }
}
