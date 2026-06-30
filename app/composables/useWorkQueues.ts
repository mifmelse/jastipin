import type { Database } from '~/types/database.types'

export interface WorkQueue {
  key: string
  label: string
  count: number
  to: string
  icon: string
}

// Actionable "what to do next" queues derived from item statuses → each links
// straight to the page where that work happens.
export function useWorkQueues() {
  const supabase = useSupabaseClient<Database>()

  const { data: rows, refresh, status } = useAsyncData('work-queue-counts', async () => {
    const { data, error } = await supabase.from('work_queue_counts').select('*')
    if (error) throw error
    return data
  })

  const queues = computed<WorkQueue[]>(() => {
    const r = rows.value ?? []
    const sum = (pred: (x: { status: string | null; fulfillment_type: string | null; n: number | null }) => boolean) =>
      r.filter(pred).reduce((a, x) => a + Number(x.n ?? 0), 0)
    return [
      { key: 'sourcing', label: 'Siap di-sourcing', icon: 'i-lucide-shopping-cart', to: '/operations/fulfillment', count: sum((x) => x.status === 'pending' && x.fulfillment_type === 'sourcing') },
      { key: 'dropin', label: 'Drop-in masuk', icon: 'i-lucide-package-open', to: '/operations/fulfillment', count: sum((x) => x.status === 'pending' && x.fulfillment_type === 'drop_in') },
      { key: 'warehouse', label: 'Siap diterima gudang', icon: 'i-lucide-warehouse', to: '/operations/warehouse', count: sum((x) => x.status === 'purchased' || x.status === 'received') },
      { key: 'packing', label: 'Siap di-pack', icon: 'i-lucide-luggage', to: '/operations/load-planning', count: sum((x) => x.status === 'in_warehouse') },
      { key: 'delivery', label: 'Siap dikirim', icon: 'i-lucide-truck', to: '/operations/delivery', count: sum((x) => x.status === 'packed') },
    ].filter((q) => q.count > 0)
  })

  return { queues, status, refresh }
}
