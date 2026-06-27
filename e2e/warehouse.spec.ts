import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { gotoReady, login } from './helpers'

// Warehouse drives off fulfilled items, so seed an order with one 'purchased'
// item (intake-eligible) and exercise intake → stock.
const ts = Date.now()
const CUST = `E2E WhCust ${ts}`
const TRIP = `E2E WhTrip ${ts}`

test.beforeAll(async () => {
  const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { persistSession: false },
  })
  const { data: countries } = await admin.from('countries').select('id').limit(2)
  const [from, to] = countries!
  const { data: c } = await admin.from('customers').insert({ name: CUST }).select('id').single()
  const { data: t } = await admin.from('trips').insert({ name: TRIP, type: 'single' }).select('id').single()
  const { data: leg } = await admin.from('trip_routes').insert({
    trip_id: t!.id, from_country_id: from!.id, to_country_id: to!.id, departure_date: '2099-10-31', sequence: 1,
  }).select('id').single()
  const { data: o } = await admin.from('orders').insert({
    customer_id: c!.id, trip_route_id: leg!.id, currency: 'IDR', fx_rate: 1,
  }).select('id').single()
  await admin.from('order_items').insert({
    order_id: o!.id, item_name: 'E2E Wh Item', fulfillment_type: 'sourcing',
    qty: 1, requested_price: 100000, weight_g: 500, status: 'purchased',
  })
})

test.beforeEach(async ({ page }) => {
  await login(page)
})

test('warehouse: intake weighs the item and moves it from queue to stock', async ({ page }) => {
  await gotoReady(page, '/operations/warehouse')

  const intakePanel = page.getByRole('tabpanel', { name: /Intake/ })
  const stockPanel = page.getByRole('tabpanel', { name: 'Stock', exact: true })

  // intake the seeded item
  await page.getByRole('tab', { name: /Intake/ }).click()
  await intakePanel.getByRole('row', { name: new RegExp(CUST) }).getByRole('button', { name: 'Terima & timbang' }).click()
  const d = page.getByRole('dialog')
  await d.waitFor()
  await d.locator('input[type="text"]').first().fill('Rak A-1') // location
  await d.getByRole('spinbutton').first().fill('750') // actual weight overrides 500g estimate
  const saved = page.waitForResponse(
    (r) => r.url().includes('/rest/v1/warehouse_items') && r.request().method() === 'POST',
  )
  await d.getByRole('button', { name: 'Simpan' }).click()
  await saved

  // it left the intake queue (status mirrored to in_warehouse)
  await expect(intakePanel.getByRole('row', { name: new RegExp(CUST) })).toHaveCount(0)

  // and shows up in stock with the actual weight + location
  await page.getByRole('tab', { name: 'Stock', exact: true }).click()
  const stockRow = stockPanel.getByRole('row', { name: new RegExp(CUST) })
  await expect(stockRow).toContainText('750 g')
  await expect(stockRow).toContainText('Rak A-1')
  await expect(stockRow).toContainText('good') // condition column lives in Stock now
})
