import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { gotoReady, login } from './helpers'

// Load Planning needs a trip with an in-warehouse item to pack.
const ts = Date.now()
const CUST = `E2E LpCust ${ts}`
const TRIP = `E2E LpTrip ${ts}`
const LUG = `Koper E2E ${ts}`

test.beforeAll(async () => {
  const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, { auth: { persistSession: false } })
  const { data: countries } = await admin.from('countries').select('id').limit(2)
  const [from, to] = countries!
  const { data: c } = await admin.from('customers').insert({ name: CUST }).select('id').single()
  const { data: t } = await admin.from('trips').insert({ name: TRIP, type: 'single' }).select('id').single()
  const { data: leg } = await admin.from('trip_routes').insert({
    trip_id: t!.id, from_country_id: from!.id, to_country_id: to!.id, departure_date: '2099-08-31', sequence: 1,
  }).select('id').single()
  const { data: o } = await admin.from('orders').insert({
    customer_id: c!.id, trip_route_id: leg!.id, currency: 'IDR', fx_rate: 1,
  }).select('id').single()
  // qty 2 × 2000g = 4kg of contents; already in_warehouse so it's packable
  await admin.from('order_items').insert({
    order_id: o!.id, item_name: 'E2E Lp Item', fulfillment_type: 'sourcing',
    qty: 2, requested_price: 1000, weight_g: 2000, status: 'in_warehouse',
  })
})

test.beforeEach(async ({ page }) => {
  await login(page)
})

test('load planning: create luggage, pack item, weight + status + simulation', async ({ page }) => {
  await gotoReady(page, '/operations/load-planning')

  // pick the trip → tabs appear
  await page.getByRole('combobox').first().click()
  await page.getByRole('option', { name: new RegExp(TRIP) }).click()

  // create a Backpack luggage (tare 1000g, max 8000g)
  await page.getByRole('tab', { name: 'Luggage' }).click()
  await page.getByRole('button', { name: 'Tambah luggage' }).click()
  const lm = page.getByRole('dialog')
  await lm.waitFor()
  await lm.getByRole('textbox').first().fill(LUG)
  await lm.getByRole('combobox').first().click() // tipe
  await page.getByRole('option', { name: 'Backpack', exact: true }).click()
  await page.getByRole('button', { name: 'Simpan' }).click()
  await expect(page.getByText(LUG).first()).toBeVisible()

  // pack the item onto it
  await page.getByRole('tab', { name: 'Packing Board' }).click()
  await expect(page.getByText('1 barang siap dimuat.')).toBeVisible()
  await page.getByRole('button', { name: 'Tambah barang' }).click()
  const pm = page.getByRole('dialog')
  await pm.waitFor()
  await pm.getByRole('combobox').first().click() // barang
  await page.getByRole('option', { name: /E2E Lp Item/ }).click()
  const packed = page.waitForResponse((r) => r.url().includes('/rest/v1/load_items') && r.request().method() === 'POST')
  await page.getByRole('button', { name: 'Tambah', exact: true }).click()
  await packed

  // card shows the item + weight = 4kg contents + 1kg tare = 5 kg; item left the queue
  const card = page.locator('.w-72', { hasText: LUG })
  await expect(card).toContainText('E2E Lp Item')
  await expect(card).toContainText('5 kg')
  await expect(page.getByText('0 barang siap dimuat.')).toBeVisible() // status mirrored → packed

  // simulation tab reflects the same weight
  await page.getByRole('tab', { name: 'Simulation' }).click()
  await expect(page.getByRole('row', { name: new RegExp(LUG) })).toContainText('5 kg')

  // unpack → item returns to the queue (status back to in_warehouse)
  await page.getByRole('tab', { name: 'Packing Board' }).click()
  await card.getByRole('button', { name: 'Keluarkan' }).click()
  await expect(page.getByText('1 barang siap dimuat.')).toBeVisible()
})
