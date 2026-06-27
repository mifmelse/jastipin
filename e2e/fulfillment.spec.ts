import { test, expect } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { gotoReady, login } from './helpers'

// Fulfillment drives off real orders/items, so seed an order with one sourcing
// item + one drop-in item server-side, then exercise the workspace.
const ts = Date.now()
const CUST = `E2E FulCust ${ts}`
const TRIP = `E2E FulTrip ${ts}`

let admin: SupabaseClient
let dropInItemId = ''

test.beforeAll(async () => {
  admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { persistSession: false },
  })
  const { data: countries } = await admin.from('countries').select('id').limit(2)
  const [from, to] = countries!

  const { data: c } = await admin.from('customers').insert({ name: CUST }).select('id').single()
  const { data: t } = await admin.from('trips').insert({ name: TRIP, type: 'single' }).select('id').single()
  const { data: leg } = await admin.from('trip_routes').insert({
    trip_id: t!.id, from_country_id: from!.id, to_country_id: to!.id,
    departure_date: '2099-11-30', sequence: 1,
  }).select('id').single()
  const { data: o } = await admin.from('orders').insert({
    customer_id: c!.id, trip_route_id: leg!.id, currency: 'IDR', fx_rate: 1,
  }).select('id').single()

  const { data: items } = await admin.from('order_items').insert([
    { order_id: o!.id, item_name: 'E2E Sourcing Item', fulfillment_type: 'sourcing', qty: 2, requested_price: 100000, status: 'pending' },
    { order_id: o!.id, item_name: 'E2E DropIn Item', fulfillment_type: 'drop_in', qty: 1, status: 'pending' },
  ]).select('id, fulfillment_type')
  dropInItemId = items!.find((i) => i.fulfillment_type === 'drop_in')!.id
})

test.beforeEach(async ({ page }) => {
  await login(page)
})

test('sourcing: record purchase → item status mirrors to purchased', async ({ page }) => {
  await gotoReady(page, '/operations/fulfillment')
  await page.getByRole('tab', { name: 'Sourcing' }).click()

  const row = page.getByRole('row', { name: new RegExp(CUST) }) // unique to this run
  await row.getByRole('button', { name: 'Catat' }).click()
  const d = page.getByRole('dialog')
  await d.waitFor()

  // status → Purchased
  await d.getByRole('combobox').first().click()
  await page.getByRole('option', { name: 'Purchased', exact: true }).click()
  // actual price/unit 90.000 → modal preview = 90.000 × qty 2
  await d.getByRole('spinbutton').first().fill('90000')
  await expect(d.getByText('Rp 180.000')).toBeVisible()

  const saved = page.waitForResponse(
    (r) => r.url().includes('/rest/v1/sourcing_records') && ['POST', 'PATCH'].includes(r.request().method()),
  )
  await d.getByRole('button', { name: 'Simpan' }).click()
  await saved

  // the DB trigger mirrored the record status onto the order_item
  await expect(page.getByRole('row', { name: new RegExp(CUST) })).toContainText('purchased')
})

test('drop-in: intake → item status mirrors to received', async ({ page }) => {
  await gotoReady(page, '/operations/fulfillment')
  await page.getByRole('tab', { name: 'Drop-in Intake' }).click()

  const row = page.getByRole('row', { name: new RegExp(CUST) }) // unique to this run
  await row.getByRole('button', { name: 'Terima' }).click()
  const d = page.getByRole('dialog')
  await d.waitFor()

  const saved = page.waitForResponse(
    (r) => r.url().includes('/rest/v1/drop_in_intakes') && ['POST', 'PATCH'].includes(r.request().method()),
  )
  await d.getByRole('button', { name: 'Simpan' }).click()
  await saved

  await expect(page.getByRole('row', { name: new RegExp(CUST) })).toContainText('received')
})

test('constraint: a sourcing record cannot attach to a drop-in item', async () => {
  // DB-level guard (the UI never offers this, but the rule lives in the database)
  const { error } = await admin.from('sourcing_records').insert({ order_item_id: dropInItemId })
  expect(error).not.toBeNull()
})
