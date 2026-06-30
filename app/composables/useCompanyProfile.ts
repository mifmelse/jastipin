import type { Database } from '~/types/database.types'

type Update = Database['public']['Tables']['company_profile']['Update']

// Single-row company profile (id = 1). Drives invoice header/footer.
export function useCompanyProfile() {
  const supabase = useSupabaseClient<Database>()

  const { data: profile, refresh, status } = useAsyncData('company-profile', async () => {
    const { data, error } = await supabase.from('company_profile').select('*').eq('id', 1).single()
    if (error) throw error
    return data
  })

  async function update(payload: Update) {
    const { error } = await supabase.from('company_profile').update(payload).eq('id', 1)
    if (error) throw error
    await refresh()
  }

  return { profile, status, refresh, update }
}
