import type { Database } from '~/types/database.types'

type Insert = Database['public']['Tables']['luggage_types']['Insert']

export function useLuggageTypes() {
  const supabase = useSupabaseClient<Database>()

  const { data: items, refresh, status } = useAsyncData('master-luggage-types', async () => {
    const { data, error } = await supabase.from('luggage_types').select('*').order('name')
    if (error) throw error
    return data
  })

  async function create(payload: Insert) {
    const { error } = await supabase.from('luggage_types').insert(payload)
    if (error) throw error
    await refresh()
  }
  async function update(id: string, payload: Partial<Insert>) {
    const { error } = await supabase.from('luggage_types').update(payload).eq('id', id)
    if (error) throw error
    await refresh()
  }
  async function remove(id: string) {
    const { error } = await supabase.from('luggage_types').delete().eq('id', id)
    if (error) throw error
    await refresh()
  }

  return { items, status, refresh, create, update, remove }
}
