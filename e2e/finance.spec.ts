import { test, expect } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { gotoReady, login } from './helpers'

// Seed an order with shipping + a sourcing actual cost so all the finance
// surfaces have data: AR (order total), payables (shipping + sourcing).
const ts = Date.now()
const CUST = `E2E FinCust ${ts}`
const TRIP = `E2E FinTrip ${ts}`

let admin: SupabaseClient
let tripId = ''
let orderId = ''

test.beforeAll(async () => {
  admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, { auth: { persistSession: false } })
  const { data: countries } = await admin.from('countries').select('id').limit(2)
  const [from, to] = countries!
  const { data: c } = await admin.from('customers').insert({ name: CUST }).select('id').single()
  const { data: t } = await admin.from('trips').insert({ name: TRIP, type: 'single' }).select('id').single()
  tripId = t!.id
  const { data: leg } = await admin.from('trip_routes').insert({
    trip_id: tripId, from_country_id: from!.id, to_country_id: to!.id, departure_date: '2099-06-30', sequence: 1,
  }).select('id').single()
  // total = subtotal 200.000 + shipping 50.000 = 250.000
  const { data: o } = await admin.from('orders').insert({
    customer_id: c!.id, trip_route_id: leg!.id, currency: 'IDR', fx_rate: 1, shipping_cost: 50000,
  }).select('id').single()
  orderId = o!.id
  const { data: oi } = await admin.from('order_items').insert({
    order_id: orderId, item_name: 'E2E Fin Item', fulfillment_type: 'sourcing', qty: 2, requested_price: 100000, status: 'pending',
  }).select('id').single()
  // sourcing actual = 80.000 × qty 2 = 160.000 → payable
  await admin.from('sourcing_records').insert({
    order_item_id: oi!.id, actual_price: 80000, currency: 'IDR', fx_rate: 1, status: 'purchased',
  })
})

test.beforeEach(async ({ page }) => {
  await login(page)
})

test('receivables: record full payment clears the outstanding', async ({ page }) => {
  await gotoReady(page, '/finance/receivables')
  const row = page.getByRole('row', { name: new RegExp(CUST) })
  await expect(row).toContainText('Rp 250.000') // billed total
  await row.getByRole('button', { name: 'Catat bayar' }).click()
  const d = page.getByRole('dialog')
  await d.waitFor()
  const paid = page.waitForResponse((r) => r.url().includes('/rest/v1/payments') && r.request().method() === 'POST')
  await d.getByRole('button', { name: 'Catat pembayaran' }).click() // amount prefilled with outstanding
  await paid
  await d.getByRole('button', { name: 'Tutup' }).click()
  await expect(page.getByRole('row', { name: new RegExp(CUST) })).toContainText('Rp 0')
})

test('payables: shipping + sourcing show as live ledger, settle one', async ({ page }) => {
  await gotoReady(page, '/finance/payables')
  const sourcingRow = page.getByRole('row', { name: /E2E Fin Item/ })
  await expect(sourcingRow).toContainText('Rp 160.000') // 80k × qty 2, live from source
  await expect(sourcingRow).toContainText('unpaid')

  const settled = page.waitForResponse((r) => r.url().includes('/rest/v1/payable_settlements') && r.request().method() === 'POST')
  await sourcingRow.getByRole('button', { name: 'Tandai lunas' }).click()
  await settled
  await expect(page.getByRole('row', { name: /E2E Fin Item/ })).toContainText('paid')
})

test('anti double-count: exactly one payable per source (sourcing + shipping)', async () => {
  const { data } = await admin.from('payables').select('source_type, amount_idr').eq('trip_id', tripId)
  expect(data!.length).toBe(2) // one sourcing + one shipping, never duplicated
  const byType = Object.fromEntries(data!.map((p) => [p.source_type, Number(p.amount_idr)]))
  expect(byType.sourcing).toBe(160000)
  expect(byType.shipping).toBe(50000)
})

test('reports: trip P&L = revenue − payables', async ({ page }) => {
  await gotoReady(page, '/finance/reports')
  // revenue 250.000 − cost (160k + 50k = 210k) = profit 40.000
  await expect(page.getByRole('row', { name: new RegExp(TRIP) })).toContainText('Rp 40.000')
})
