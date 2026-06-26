import { createClient } from '@supabase/supabase-js'
import { E2E_EMAIL } from './constants'

// Remove the e2e user after the run.
export default async function globalTeardown() {
  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_KEY
  if (!url || !serviceKey) return
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

  // Sweep any leftover e2e fixtures. Order respects FKs (children first).
  // CRM leads: by contact_name, plus any linked to an e2e customer (customer_id
  // is SET NULL on customer delete, so those would otherwise leak). Activities
  // cascade with their lead.
  await admin.from('crm_pipeline').delete().like('contact_name', 'E2E%')
  const { data: e2eCustomers } = await admin.from('customers').select('id').like('name', 'E2E%')
  if (e2eCustomers?.length) {
    await admin.from('crm_pipeline').delete().in('customer_id', e2eCustomers.map((c) => c.id))
  }
  await admin.from('trips').delete().like('name', 'E2E%')
  await admin.from('customers').delete().like('name', 'E2E%')
  await admin.from('products').delete().like('name', 'E2E%')
  await admin.from('brands').delete().like('name', 'E2E%')
  await admin.from('luggage_types').delete().like('name', 'E2E%')
  await admin.from('sub_categories').delete().like('name', 'E2E%')
  await admin.from('categories').delete().like('name', 'E2E%')
  await admin.from('units').delete().like('name', 'E2E%')
  await admin.from('countries').delete().like('name', 'E2E%')
  await admin.from('continents').delete().like('name', 'E2E%')
  await admin.from('menus').delete().like('label', 'E2E%')
  await admin.from('roles').delete().like('name', 'E2E%')
  await admin.from('user_types').delete().like('name', 'E2E%')
  await admin.from('currencies').delete().like('name', 'E2E%')
  await admin.from('tax_rates').delete().like('name', 'E2E%')
  await admin.from('permissions').delete().like('key', 'e2e%')

  const { data: list } = await admin.auth.admin.listUsers()
  for (const u of list.users) {
    if (u.email === E2E_EMAIL || u.email?.startsWith('e2e-crud-')) {
      await admin.auth.admin.deleteUser(u.id)
    }
  }
}
