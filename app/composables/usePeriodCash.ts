import type { Database } from '~/types/database.types'

export type Period = 'this_month' | 'last_month' | 'last_30' | 'all'

export const PERIOD_OPTIONS = [
  { label: 'Bulan ini', value: 'this_month' },
  { label: 'Bulan lalu', value: 'last_month' },
  { label: '30 hari terakhir', value: 'last_30' },
  { label: 'Semua waktu', value: 'all' },
]

// Cash in/out/net for a period. Cash-in = paid payments (× fx). Cash-out = paid
// payables (already IDR via the view). Both filtered on paid_at.
export function usePeriodCash(period: Ref<Period>) {
  const supabase = useSupabaseClient<Database>()

  function range(p: Period): { start: string | null; end: string | null } {
    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth()
    const iso = (d: Date) => d.toISOString().slice(0, 10)
    if (p === 'this_month') return { start: iso(new Date(y, m, 1)), end: iso(new Date(y, m + 1, 1)) }
    if (p === 'last_month') return { start: iso(new Date(y, m - 1, 1)), end: iso(new Date(y, m, 1)) }
    if (p === 'last_30') return { start: iso(new Date(now.getTime() - 30 * 86400000)), end: iso(new Date(now.getTime() + 86400000)) }
    return { start: null, end: null }
  }

  const { data, refresh, status } = useAsyncData(
    'period-cash',
    async () => {
      const { start, end } = range(period.value)
      let pays = supabase.from('payments').select('amount, fx_rate').eq('status', 'paid')
      let pys = supabase.from('payables').select('amount_idr').eq('status', 'paid')
      if (start && end) {
        pays = pays.gte('paid_at', start).lt('paid_at', end)
        pys = pys.gte('paid_at', start).lt('paid_at', end)
      }
      const [{ data: pIn }, { data: pOut }] = await Promise.all([pays, pys])
      const cashIn = (pIn ?? []).reduce((a, x) => a + Number(x.amount ?? 0) * Number(x.fx_rate ?? 1), 0)
      const cashOut = (pOut ?? []).reduce((a, x) => a + Number(x.amount_idr ?? 0), 0)
      return { cashIn, cashOut, netCash: cashIn - cashOut }
    },
    { watch: [period] },
  )

  return { data, status, refresh }
}
