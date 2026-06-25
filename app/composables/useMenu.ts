import type { Database } from '~/types/database.types'

type MenuRow = Database['public']['Tables']['menus']['Row']

// Builds the sidebar from the `menus` table, filtered by the user's permissions.
// Rows are ordered by sort_order, so group order follows first appearance.
export function useMenu() {
  const supabase = useSupabaseClient<Database>()
  const auth = useAuthStore()

  const { data: menus } = useAsyncData('menus', async () => {
    const { data, error } = await supabase
      .from('menus')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
    if (error) throw error
    return data
  })

  const visible = computed<MenuRow[]>(() =>
    (menus.value ?? []).filter(
      (m) => !m.required_permission || auth.has(m.required_permission),
    ),
  )

  const topLevel = computed(() => visible.value.filter((m) => !m.menu_group))

  const groups = computed(() => {
    const map = new Map<string, MenuRow[]>()
    for (const m of visible.value) {
      if (!m.menu_group) continue
      if (!map.has(m.menu_group)) map.set(m.menu_group, [])
      map.get(m.menu_group)!.push(m)
    }
    return Array.from(map, ([name, items]) => ({ name, items }))
  })

  return { topLevel, groups }
}
