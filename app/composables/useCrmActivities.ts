import type { Database } from '~/types/database.types'

type Insert = Database['public']['Tables']['crm_activities']['Insert']

// Activities for one pipeline lead.
export function useCrmActivities(pipelineId: string) {
  const supabase = useSupabaseClient<Database>()

  const { data: items, refresh, status } = useAsyncData(`crm-activities-${pipelineId}`, async () => {
    const { data, error } = await supabase
      .from('crm_activities')
      .select('*')
      .eq('pipeline_id', pipelineId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  })

  async function create(payload: Insert) {
    const { error } = await supabase.from('crm_activities').insert(payload)
    if (error) throw error
    await refresh()
  }
  async function remove(id: string) {
    const { error } = await supabase.from('crm_activities').delete().eq('id', id)
    if (error) throw error
    await refresh()
  }

  return { items, status, refresh, create, remove }
}

// Recent activities across all leads (for the Activities tab).
export function useRecentActivities() {
  const supabase = useSupabaseClient<Database>()

  const { data: items, refresh, status } = useAsyncData('crm-activities-recent', async () => {
    const { data, error } = await supabase
      .from('crm_activities')
      .select('*, crm_pipeline(contact_name, customers(name))')
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throw error
    return data
  })

  return { items, status, refresh }
}
