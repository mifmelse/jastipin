import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { gotoReady, login, deleteRow } from './helpers'

// Orders depend on a customer + a leg (trip_route). Those are heavy to build
// through the UI, so we seed them server-side and drive the Order UI itself.
const ts = Date.now()
const CUST = `E2E OrdCust ${ts}`
const TRIP = `E2E OrdTrip ${ts}`

let customerId = ''
let tripId = ''

test.beforeAll(async () => {
  const url = process.env.SUPABASE_URL!
  const admin = createClient(url, process.env.SUPABASE_SERVICE_KEY!, { auth: { persistSession: false } })

  const { data: countries } = await admin.from('countries').select('id').limit(2)
  const [from, to] = countries!

  const { data: c } = await admin.from('customers').insert({ name: CUST }).select('id').single()
  customerId = c!.id
  const { data: t } = await admin.from('trips').insert({ name: TRIP, type: 'single' }).select('id').single()
  tripId = t!.id
  // far-future date makes the leg's option label unique in the picker
  await admin.from('trip_routes').insert({
    trip_id: tripId, from_country_id: from!.id, to_country_id: to!.id,
    departure_date: '2099-12-31', sequence: 1,
  })
})

test.beforeEach(async ({ page }) => {
  await login(page)
})

test('order: create → add item → derived totals → edit fee → delete', async ({ page }) => {
  await gotoReady(page, '/operations/orders')
  await page.getByRole('button', { name: 'Tambah' }).click()
  const d = page.getByRole('dialog')
  await d.waitFor()

  // pick customer + leg
  await d.getByRole('combobox').nth(0).click()
  await page.getByRole('option', { name: CUST, exact: true }).click()
  await d.getByRole('combobox').nth(1).click()
  await page.getByRole('option', { name: '2099-12-31' }).click()
  await page.getByRole('button', { name: 'Simpan' }).click()

  // landed on the order detail (auto code ORD-xxxx)
  await expect(page.getByRole('heading', { name: /ORD-/ })).toBeVisible()

  // add a free-text drop-in item: qty 2 × 100.000
  await page.getByRole('tab', { name: 'Items' }).click()
  await page.getByRole('button', { name: 'Tambah item' }).click()
  const im = page.getByRole('dialog')
  await im.waitFor()
  await im.getByRole('button', { name: 'Titipan (free-text)' }).click()
  await im.locator('input[type="text"]').first().fill('Skincare titipan')
  await im.getByRole('spinbutton').nth(0).fill('2') // qty
  await im.getByRole('spinbutton').nth(1).fill('100000') // requested price
  await im.getByRole('button', { name: 'Simpan' }).click()

  // item row renders, and the order header total reflects it (derived view)
  await expect(page.getByText('Skincare titipan')).toBeVisible()
  await expect(page.getByText('Rp 200.000')).toBeVisible() // header total_idr (unique)

  // edit prefills the name on the FIRST open (no mode-toggle wipe)
  await page.getByRole('button', { name: 'Edit item' }).click()
  const em = page.getByRole('dialog')
  await em.waitFor()
  await expect(em.locator('input[type="text"]').first()).toHaveValue('Skincare titipan')
  await em.getByRole('button', { name: 'Batal' }).click()

  // edit fee → total recomputes through the view
  await page.getByRole('tab', { name: 'Order Info' }).click()
  const info = page.locator('main')
  await info.getByRole('spinbutton').first().fill('50000') // fee (fx hidden for IDR)
  const saved = page.waitForResponse((r) => r.url().includes('/rest/v1/orders') && r.request().method() === 'PATCH')
  await info.getByRole('button', { name: 'Simpan' }).click()
  await saved
  await expect(page.getByText('Rp 250.000')).toBeVisible()

  // delete from the list (cascades the item)
  await gotoReady(page, '/operations/orders')
  await deleteRow(page, new RegExp(CUST))
})

test('crm → order handoff: lead at stage order prefills the create form', async ({ page }) => {
  // seed a lead linked to the customer, already at stage 'order', for this trip
  const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { persistSession: false },
  })
  const { data: lead } = await admin
    .from('crm_pipeline')
    .insert({ customer_id: customerId, trip_id: tripId, stage: 'order', source: 'e2e' })
    .select('id')
    .single()

  await gotoReady(page, '/operations/crm')
  await page.getByRole('tab', { name: 'Pipeline' }).click()
  // the card for THIS customer exposes a "Buat order" handoff (scope to its card;
  // other leads may also sit at stage 'order')
  const card = page.locator('div.rounded-lg', { hasText: CUST })
  await card.getByRole('button', { name: 'Buat order' }).click()

  // lands on the order form with the customer prefilled + leg auto-picked
  await expect(page).toHaveURL(/\/operations\/orders\?customer=/)
  const d = page.getByRole('dialog')
  await d.waitFor()
  await expect(d.getByRole('combobox').first()).toContainText(CUST)
  await expect(d.getByRole('combobox').nth(1)).toContainText('2099-12-31')

  await admin.from('crm_pipeline').delete().eq('id', lead!.id)
})
