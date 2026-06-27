import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { gotoReady, login } from './helpers'

// B5: an order_item (3 pcs) splits across luggages; status flips to 'packed'
// only when every unit is placed.
const ts = Date.now()
const TRIP = `E2E QtyTrip ${ts}`
const LUGA = `KoperA ${ts}`
const LUGB = `KoperB ${ts}`
let itemId: string

function admin() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, { auth: { persistSession: false } })
}

test.beforeAll(async () => {
  const a = admin()
  const { data: cs } = await a.from('countries').select('id').limit(2)
  const { data: c } = await a.from('customers').insert({ name: `E2E QtyCust ${ts}` }).select('id').single()
  const { data: t } = await a.from('trips').insert({ name: TRIP, type: 'single' }).select('id').single()
  const { data: leg } = await a.from('trip_routes').insert({ trip_id: t!.id, from_country_id: cs![0]!.id, to_country_id: cs![1]!.id, sequence: 1 }).select('id').single()
  const { data: lt } = await a.from('luggage_types').select('id').eq('category', 'personal').limit(1).single()
  await a.from('luggages').insert([
    { trip_id: t!.id, luggage_type_id: lt!.id, label: LUGA },
    { trip_id: t!.id, luggage_type_id: lt!.id, label: LUGB },
  ])
  const { data: o } = await a.from('orders').insert({ customer_id: c!.id, trip_route_id: leg!.id, currency: 'IDR', fx_rate: 1 }).select('id').single()
  const { data: it } = await a.from('order_items').insert({ order_id: o!.id, item_name: 'E2E Qty Item', fulfillment_type: 'sourcing', qty: 3, requested_price: 1000, weight_g: 1000, status: 'in_warehouse' }).select('id').single()
  itemId = it!.id
})

test.afterAll(async () => {
  await admin().from('trips').delete().eq('name', TRIP)
})

test.beforeEach(async ({ page }) => {
  await login(page)
})

async function status() {
  const { data } = await admin().from('order_items').select('status').eq('id', itemId).single()
  return data!.status
}

test('packing splits qty across luggages; packed only when fully placed', async ({ page }) => {
  await gotoReady(page, '/operations/load-planning')
  await page.getByRole('combobox').first().click()
  await page.getByRole('option', { name: new RegExp(TRIP) }).click()
  await page.getByRole('combobox').nth(1).click()
  await page.getByRole('option', { name: /→/ }).first().click()
  await expect(page.getByRole('listbox')).toHaveCount(0)

  // queue shows the 3-pcs item
  await expect(page.locator('.w-64')).toContainText('×3')

  // place ALL 3 into Koper A (tap)
  const cardA = page.locator('.w-72', { hasText: LUGA })
  await cardA.getByRole('button', { name: 'Tambah barang' }).click()
  const d = page.getByRole('dialog')
  await d.getByRole('combobox').first().click()
  await page.getByRole('option', { name: /E2E Qty Item/ }).click()
  await page.getByRole('button', { name: 'Tambah', exact: true }).click()

  await expect(page.getByText('0 barang siap dimuat di route ini.')).toBeVisible()
  await expect.poll(status).toBe('packed') // all units placed

  // take 2 units back via the − stepper → partial again
  await cardA.getByRole('button', { name: 'Kurangi' }).click()
  await cardA.getByRole('button', { name: 'Kurangi' }).click()
  await expect(page.locator('.w-64')).toContainText('×2') // 2 units back in queue
  await expect.poll(status).toBe('in_warehouse') // no longer fully packed
})
