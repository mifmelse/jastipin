import { test, expect } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { gotoReady, login } from './helpers'

// Delivery acts on a packed order, so seed one ready to ship.
const ts = Date.now()
const CUST = `E2E DlvCust ${ts}`
const TRIP = `E2E DlvTrip ${ts}`

let admin: SupabaseClient
let orderId = ''

test.beforeAll(async () => {
  admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, { auth: { persistSession: false } })
  const { data: countries } = await admin.from('countries').select('id').limit(2)
  const [from, to] = countries!
  const { data: c } = await admin.from('customers').insert({ name: CUST }).select('id').single()
  const { data: t } = await admin.from('trips').insert({ name: TRIP, type: 'single' }).select('id').single()
  const { data: leg } = await admin.from('trip_routes').insert({
    trip_id: t!.id, from_country_id: from!.id, to_country_id: to!.id, departure_date: '2099-07-31', sequence: 1,
  }).select('id').single()
  const { data: o } = await admin.from('orders').insert({
    customer_id: c!.id, trip_route_id: leg!.id, currency: 'IDR', fx_rate: 1, status: 'packed',
  }).select('id').single()
  orderId = o!.id
  await admin.from('order_items').insert({
    order_id: orderId, item_name: 'E2E Dlv Item', fulfillment_type: 'sourcing', qty: 1, requested_price: 1000, status: 'packed',
  })
})

test.beforeEach(async ({ page }) => {
  await login(page)
})

test('delivery: create shipment → mark delivered → order + items cascade', async ({ page }) => {
  await gotoReady(page, '/operations/delivery')

  // create a shipment for the seeded order
  await page.getByRole('button', { name: 'Buat shipment' }).click()
  const d = page.getByRole('dialog')
  await d.waitFor()
  await d.getByRole('combobox').first().click() // order
  await page.getByRole('option', { name: new RegExp(CUST) }).click()
  await d.getByRole('textbox').first().fill('JNE') // courier
  await page.getByRole('button', { name: 'Simpan' }).click()
  await expect(page.getByRole('row', { name: new RegExp(CUST) })).toContainText('JNE')

  // mark it delivered from the Tracking board
  await page.getByRole('tab', { name: 'Tracking' }).click()
  const card = page.locator('div.rounded-lg', { hasText: CUST })
  await card.getByRole('combobox').click()
  const patched = page.waitForResponse((r) => r.url().includes('/rest/v1/shipments') && r.request().method() === 'PATCH')
  await page.getByRole('option', { name: 'Delivered', exact: true }).click()
  await patched

  // the trigger cascaded delivered onto the order + its items
  const { data: ord } = await admin.from('orders').select('status').eq('id', orderId).single()
  expect(ord!.status).toBe('delivered')
  const { data: its } = await admin.from('order_items').select('status').eq('order_id', orderId)
  expect(its!.every((i) => i.status === 'delivered')).toBeTruthy()
})
