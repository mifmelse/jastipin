import type { Database } from '~/types/database.types'

// The five A4 picker masters share one shape, so one factory + one CRUD UI fit
// all. Operations snapshot the chosen name as text — these are option lists.
export type MasterTable =
  | 'expense_categories'
  | 'lead_sources'
  | 'stores'
  | 'couriers'
  | 'payment_methods'

export interface MasterRow {
  id: string
  name: string
  is_active: boolean
  created_at: string
}

export function useSimpleMaster(table: MasterTable) {
  const supabase = useSupabaseClient<Database>()

  const { data: items, refresh, status } = useAsyncData(`master-${table}`, async () => {
    const { data, error } = await supabase.from(table).select('*').order('name')
    if (error) throw error
    return (data ?? []) as MasterRow[]
  })

  async function create(payload: { name: string; is_active: boolean }) {
    const { error } = await supabase.from(table).insert(payload)
    if (error) throw error
    await refresh()
  }
  async function update(id: string, payload: { name?: string; is_active?: boolean }) {
    const { error } = await supabase.from(table).update(payload).eq('id', id)
    if (error) throw error
    await refresh()
  }
  async function remove(id: string) {
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) throw error
    await refresh()
  }

  return { items, status, refresh, create, update, remove }
}
