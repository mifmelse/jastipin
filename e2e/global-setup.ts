import { createClient } from '@supabase/supabase-js'
import { E2E_EMAIL, E2E_PASSWORD } from './constants'

// Create a fresh admin user for the test run (service-role, server-side).
export default async function globalSetup() {
  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_KEY
  if (!url || !serviceKey) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_KEY missing (.env not loaded?)')
  }
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

  const { data: list } = await admin.auth.admin.listUsers()
  const existing = list.users.find((u) => u.email === E2E_EMAIL)
  if (existing) await admin.auth.admin.deleteUser(existing.id)

  const { error } = await admin.auth.admin.createUser({
    email: E2E_EMAIL,
    password: E2E_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: 'E2E Runner', role: 'admin' },
  })
  if (error) throw error
}
