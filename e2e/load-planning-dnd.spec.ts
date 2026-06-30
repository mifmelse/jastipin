import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { gotoReady, login } from './helpers'

// B3: dragging a queue card into a luggage packs it (Sortable.js needs stepped
// pointer movement, not a single dragTo).
const ts = Date.now()
const TRIP = `E2E DndTrip ${ts}`
const LUG = `DndKoper ${ts}`

test.beforeAll(async () => {
  const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, { auth: { persistSession: false } })
  const { data: cs } = await admin.from('countries').select('id').limit(2)
  const { data: c } = await admin.from('customers').insert({ name: `E2E DndCust ${ts}` }).select('id').single()
  const { data: t } = await admin.from('trips').insert({ name: TRIP, type: 'single' }).select('id').single()
  const { data: leg } = await admin.from('trip_routes').insert({ trip_id: t!.id, from_country_id: cs![0]!.id, to_country_id: cs![1]!.id, sequence: 1 }).select('id').single()
  const { data: lt } = await admin.from('luggage_types').select('id').eq('category', 'personal').limit(1).single()
  await admin.from('luggages').insert({ trip_id: t!.id, luggage_type_id: lt!.id, label: LUG })
  const { data: o } = await admin.from('orders').insert({ customer_id: c!.id, trip_route_id: leg!.id, currency: 'IDR', fx_rate: 1 }).select('id').single()
  await admin.from('order_items').insert({ order_id: o!.id, item_name: 'E2E Dnd Item', fulfillment_type: 'sourcing', qty: 1, requested_price: 1000, weight_g: 1000, status: 'in_warehouse' })
})

test.afterAll(async () => {
  const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, { auth: { persistSession: false } })
  await admin.from('trips').delete().eq('name', TRIP)
})

test.beforeEach(async ({ page }) => {
  await login(page)
})

test('load planning: drag a queue card into a luggage packs it', async ({ page }) => {
  await gotoReady(page, '/operations/load-planning')
  await page.getByRole('combobox').first().click()
  await page.getByRole('option', { name: new RegExp(TRIP) }).click()
  await page.getByRole('combobox').nth(1).click()
  await page.getByRole('option', { name: /→/ }).first().click()
  await expect(page.getByRole('listbox')).toHaveCount(0)

  const queueCard = page.locator('.lp-queue').getByText('E2E Dnd Item')
  const dropZone = page.locator('.lp-luggage', { hasText: LUG })
  await expect(queueCard).toBeVisible()

  const s = await queueCard.boundingBox()
  const d = await dropZone.boundingBox()
  if (!s || !d) throw new Error('no bounding box')

  const packed = page.waitForResponse((r) => r.url().includes('/rest/v1/load_items') && r.request().method() === 'POST')
  await page.mouse.move(s.x + s.width / 2, s.y + s.height / 2)
  await page.mouse.down()
  await page.mouse.move(s.x + s.width / 2, s.y + s.height / 2 + 8, { steps: 4 })
  await page.mouse.move(d.x + d.width / 2, d.y + d.height / 2, { steps: 14 })
  await page.mouse.move(d.x + d.width / 2, d.y + d.height / 2 + 4, { steps: 6 })
  await page.mouse.up()
  await packed

  await expect(dropZone).toContainText('E2E Dnd Item')
  await expect(page.getByText('0 barang siap dimuat di route ini.')).toBeVisible()
})
