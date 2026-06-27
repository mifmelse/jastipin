import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { gotoReady, login } from './helpers'

// D2: issue an invoice from an order → printable invoice page (Save as PDF).
const ts = Date.now()
const CUST = `E2E Inv Cust ${ts}`

function admin() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, { auth: { persistSession: false } })
}

let orderId = ''
let tripId = ''

test.beforeAll(async () => {
  const a = admin()
  const { data: cs } = await a.from('countries').select('id').limit(2)
  await a.from('company_profile').update({ name: 'Bagasian', bank_name: 'BCA', bank_account: '1234567890', bank_holder: 'Jastipin' }).eq('id', 1)
  const { data: c } = await a.from('customers').insert({ name: CUST, phone: '0812-0000-1111' }).select('id').single()
  const { data: t } = await a.from('trips').insert({ name: `E2E Inv Trip ${ts}`, type: 'single' }).select('id').single()
  tripId = t!.id
  const { data: leg } = await a.from('trip_routes').insert({ trip_id: tripId, from_country_id: cs![0]!.id, to_country_id: cs![1]!.id, sequence: 1 }).select('id').single()
  const { data: o } = await a.from('orders').insert({ customer_id: c!.id, trip_route_id: leg!.id, currency: 'IDR', fx_rate: 1, fee: 50000, shipping_cost: 30000 }).select('id').single()
  orderId = o!.id
  await a.from('order_items').insert([
    { order_id: orderId, item_name: 'Skincare', fulfillment_type: 'sourcing', qty: 2, requested_price: 100000, status: 'pending' },
    { order_id: orderId, item_name: 'Titipan baju', fulfillment_type: 'drop_in', qty: 1, status: 'pending' },
  ])
})

test.afterAll(async () => {
  await admin().from('trips').delete().eq('id', tripId)
  await admin().from('orders').delete().eq('id', orderId)
})

test.beforeEach(async ({ page }) => {
  await login(page)
})

test('issue invoice from order → printable invoice renders', async ({ page }) => {
  await gotoReady(page, `/operations/orders/${orderId}`)
  await page.getByRole('button', { name: 'Terbitkan invoice' }).click()
  await page.waitForURL(/\/finance\/invoices\/[0-9a-f-]+/)

  // the invoice document
  await expect(page.getByText('INVOICE', { exact: true })).toBeVisible()
  await expect(page.getByText(/INV-/).first()).toBeVisible()
  await expect(page.getByText(CUST)).toBeVisible()
  await expect(page.getByText('Skincare')).toBeVisible()
  await expect(page.getByText('Titipan baju')).toBeVisible()
  await expect(page.getByText('BCA · 1234567890')).toBeVisible()
  // total = 200.000 + 50.000 + 30.000 = 280.000
  await expect(page.getByText('IDR 280.000')).toBeVisible()

  // it persisted + shows in the Invoices list
  await gotoReady(page, '/finance/invoices')
  await expect(page.getByText(CUST).first()).toBeVisible()
})
