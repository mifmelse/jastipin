import type { Database } from '~/types/database.types'

type Insert = Database['public']['Tables']['menus']['Insert']

// CRUD for the menus table (Settings → Menu). Distinct from useMenu(), which
// builds the filtered sidebar for the current user.
export function useMenuAdmin() {
  const supabase = useSupabaseClient<Database>()

  const { data: items, refresh, status } = useAsyncData('settings-menus', async () => {
    const { data, error } = await supabase.from('menus').select('*').order('sort_order')
    if (error) throw error
    return data
  })

  async function create(payload: Insert) {
    const { error } = await supabase.from('menus').insert(payload)
    if (error) throw error
    await refresh()
  }
  async function update(id: string, payload: Partial<Insert>) {
    const { error } = await supabase.from('menus').update(payload).eq('id', id)
    if (error) throw error
    await refresh()
  }
  async function remove(id: string) {
    const { error } = await supabase.from('menus').delete().eq('id', id)
    if (error) throw error
    await refresh()
  }

  return { items, status, refresh, create, update, remove }
}
