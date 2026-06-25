// Users are managed through server routes (service_role), not direct Supabase
// queries — auth admin ops can't run with the anon key.
export interface UserRow {
  id: string
  email: string | null
  created_at: string | null
  full_name: string | null
  role: string | null
  user_type: string | null
}

export interface UserCreate {
  email: string
  password: string
  full_name?: string
  role?: string
  user_type?: string
}

export function useUsers() {
  const { data: items, refresh, status } = useAsyncData<UserRow[]>(
    'settings-users',
    () => $fetch('/api/users'),
  )

  async function create(payload: UserCreate) {
    await $fetch('/api/users', { method: 'POST', body: payload })
    await refresh()
  }
  async function update(
    id: string,
    payload: { full_name?: string; role?: string; user_type?: string | null },
  ) {
    await $fetch(`/api/users/${id}`, { method: 'PATCH', body: payload })
    await refresh()
  }
  async function remove(id: string) {
    await $fetch(`/api/users/${id}`, { method: 'DELETE' })
    await refresh()
  }

  return { items, status, refresh, create, update, remove }
}
