import type { Database } from '~/types/database.types'

type Insert = Database['public']['Tables']['crm_pipeline']['Insert']

export function useCrmPipeline() {
  const supabase = useSupabaseClient<Database>()

  const { data: items, refresh, status } = useAsyncData('crm-pipeline', async () => {
    const { data, error } = await supabase
      .from('crm_pipeline')
      .select('*, customers(name), trips(name, code), crm_activities(count)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  })

  async function create(payload: Insert) {
    const { error } = await supabase.from('crm_pipeline').insert(payload)
    if (error) throw error
    await refresh()
  }
  async function update(id: string, payload: Partial<Insert>) {
    const { error } = await supabase.from('crm_pipeline').update(payload).eq('id', id)
    if (error) throw error
    await refresh()
  }
  async function remove(id: string) {
    const { error } = await supabase.from('crm_pipeline').delete().eq('id', id)
    if (error) throw error
    await refresh()
  }

  return { items, status, refresh, create, update, remove }
}
