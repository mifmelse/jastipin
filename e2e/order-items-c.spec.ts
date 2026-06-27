import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { gotoReady, login } from './helpers'

// FASE C: product price auto-fills from the catalog; substitution (from sourcing)
// is surfaced on the order item.
const ts = Date.now()
const PROD = `E2E C Prod ${ts}`

function admin() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, { auth: { persistSession: false } })
}

let tripId = ''
let routeId = ''
let custId = ''
let productId = ''

test.beforeAll(async () => {
  const a = admin()
  const { data: cs } = await a.from('countries').select('id').limit(2)
  const { data: cat } = await a.from('categories').insert({ name: `E2E C Cat ${ts}` }).select('id').single()
  const { data: unit } = await a.from('units').insert({ name: `E2E C Unit ${ts}` }).select('id').single()
  const { data: p } = await a.from('products').insert({
    name: PROD, category_id: cat!.id, unit_id: unit!.id, weight_g: 250, base_price: 75000,
  }).select('id').single()
  productId = p!.id
  const { data: c } = await a.from('customers').insert({ name: `E2E C Cust ${ts}` }).select('id').single()
  custId = c!.id
  const { data: t } = await a.from('trips').insert({ name: `E2E C Trip ${ts}`, type: 'single' }).select('id').single()
  tripId = t!.id
  const { data: leg } = await a.from('trip_routes').insert({ trip_id: tripId, from_country_id: cs![0]!.id, to_country_id: cs![1]!.id, sequence: 1 }).select('id').single()
  routeId = leg!.id
})

test.afterAll(async () => {
  const a = admin()
  await a.from('trips').delete().eq('id', tripId)
  await a.from('customers').delete().eq('id', custId)
  await a.from('products').delete().eq('id', productId)
})

test.beforeEach(async ({ page }) => {
  await login(page)
})

test('product item: picking a product auto-fills its price', async ({ page }) => {
  const { data: o } = await admin().from('orders').insert({ customer_id: custId, trip_route_id: routeId, currency: 'IDR', fx_rate: 1 }).select('id').single()
  await gotoReady(page, `/operations/orders/${o!.id}`)
  await page.getByRole('tab', { name: 'Items' }).click()
  await page.getByRole('button', { name: 'Tambah item' }).click()
  const m = page.getByRole('dialog')
  await m.waitFor()
  // product mode is the default; pick the product
  await m.getByRole('combobox').first().click()
  await page.getByRole('option', { name: PROD }).click()
  // requested price (2nd spinbutton: qty, price, actual) auto-filled from base_price
  await expect(m.getByRole('spinbutton').nth(1)).toHaveValue('75000')

  await admin().from('orders').delete().eq('id', o!.id)
})

test('substitution from sourcing shows a "diganti" badge on the order item', async ({ page }) => {
  const a = admin()
  const { data: o } = await a.from('orders').insert({ customer_id: custId, trip_route_id: routeId, currency: 'IDR', fx_rate: 1 }).select('id').single()
  const { data: it } = await a.from('order_items').insert({
    order_id: o!.id, product_id: productId, fulfillment_type: 'sourcing', qty: 1, requested_price: 75000, status: 'pending',
  }).select('id').single()
  await a.from('sourcing_records').insert({ order_item_id: it!.id, is_substitute: true, substitute_note: 'Diganti merek lain' })

  await gotoReady(page, `/operations/orders/${o!.id}`)
  await page.getByRole('tab', { name: 'Items' }).click()
  await expect(page.getByText('diganti').first()).toBeVisible()
  await expect(page.getByText('Diganti merek lain')).toBeVisible()

  await a.from('orders').delete().eq('id', o!.id)
})
