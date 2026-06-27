import type { Database } from '~/types/database.types'

export interface Notif {
  key: string
  label: string
  count: number
  to: string
  icon: string
  tone: string
}

// Bell alerts derived live from data (no notifications table): unpaid AR,
// overdue invoices, over-weight luggage. Each links to where it's actioned.
export function useNotifications() {
  const supabase = useSupabaseClient<Database>()

  const { data, refresh, status } = useAsyncData('notifications', async () => {
    const today = new Date().toISOString().slice(0, 10)
    const [{ data: ar }, { count: overdue }, { data: sim }] = await Promise.all([
      supabase.from('ar_per_order').select('outstanding_idr'),
      supabase.from('invoices').select('id', { count: 'exact', head: true }).lt('due_at', today).not('status', 'in', '(paid,void)'),
      supabase.from('luggage_simulation').select('loaded_weight_g, tare_weight_g, max_weight_g'),
    ])
    const arCount = (ar ?? []).filter((x) => Number(x.outstanding_idr ?? 0) > 0).length
    const overWeight = (sim ?? []).filter(
      (s) => s.max_weight_g && Number(s.loaded_weight_g ?? 0) + Number(s.tare_weight_g ?? 0) > Number(s.max_weight_g),
    ).length
    return { arCount, overdue: overdue ?? 0, overWeight }
  })

  const notifs = computed<Notif[]>(() => {
    const d = data.value
    const out: Notif[] = []
    if (d?.arCount) out.push({ key: 'ar', label: `${d.arCount} order belum lunas`, count: d.arCount, to: '/finance/receivables', icon: 'i-lucide-wallet', tone: 'text-warning' })
    if (d?.overdue) out.push({ key: 'inv', label: `${d.overdue} invoice jatuh tempo`, count: d.overdue, to: '/finance/invoices', icon: 'i-lucide-file-text', tone: 'text-error' })
    if (d?.overWeight) out.push({ key: 'ow', label: `${d.overWeight} luggage over-weight`, count: d.overWeight, to: '/operations/load-planning', icon: 'i-lucide-scale', tone: 'text-error' })
    return out
  })
  const total = computed(() => notifs.value.reduce((a, n) => a + n.count, 0))

  return { notifs, total, status, refresh }
}
