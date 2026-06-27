import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { gotoReady, login } from './helpers'

// FASE E: actionable work queues + period cash filter + notification bell.
const ts = Date.now()

function admin() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, { auth: { persistSession: false } })
}

let tripId = ''
let orderId = ''

test.beforeAll(async () => {
  const a = admin()
  const { data: cs } = await a.from('countries').select('id').limit(2)
  const { data: c } = await a.from('customers').insert({ name: `E2E E Cust ${ts}` }).select('id').single()
  const { data: t } = await a.from('trips').insert({ name: `E2E E Trip ${ts}`, type: 'single', status: 'ongoing' }).select('id').single()
  tripId = t!.id
  const { data: leg } = await a.from('trip_routes').insert({ trip_id: tripId, from_country_id: cs![0]!.id, to_country_id: cs![1]!.id, sequence: 1 }).select('id').single()
  const { data: o } = await a.from('orders').insert({ customer_id: c!.id, trip_route_id: leg!.id, currency: 'IDR', fx_rate: 1 }).select('id').single()
  orderId = o!.id
  // an in_warehouse item → "Siap di-pack" queue; the order is unpaid → AR alert
  await a.from('order_items').insert({ order_id: orderId, item_name: 'E2E E item', fulfillment_type: 'sourcing', qty: 1, requested_price: 200000, status: 'in_warehouse' })
  await a.from('invoices').insert({ order_id: orderId, status: 'sent', due_at: '2020-01-01' }) // overdue
})

test.afterAll(async () => {
  await admin().from('trips').delete().eq('id', tripId)
  await admin().from('orders').delete().eq('id', orderId)
})

test.beforeEach(async ({ page }) => {
  await login(page)
})

test('dashboard: work queues, period cash, and notifications', async ({ page }) => {
  await gotoReady(page, '/')

  // work queue (actionable) — at least the packing queue shows + links there
  await expect(page.getByText('Antrian kerja')).toBeVisible()
  const packing = page.getByRole('link', { name: /Siap di-pack/ })
  await expect(packing).toBeVisible()

  // period cash section + selector
  await expect(page.getByText('Kas', { exact: true })).toBeVisible()
  await expect(page.getByText('Masuk')).toBeVisible()

  // notification bell → overdue invoice + unpaid AR
  await page.getByRole('button', { name: 'Notifikasi' }).click()
  await expect(page.getByText('invoice jatuh tempo')).toBeVisible()
  await expect(page.getByText('order belum lunas')).toBeVisible()

  // clicking the packing queue goes to load planning
  await packing.click()
  await expect(page).toHaveURL(/\/operations\/load-planning/)
})
