import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { gotoReady, login } from './helpers'

// A media link should open the inline lightbox, not a new tab.
const ts = Date.now()
const TRIP = `E2E MvTrip ${ts}`

test.beforeAll(async () => {
  const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, { auth: { persistSession: false } })
  const { data: t } = await admin.from('trips').insert({ name: TRIP, type: 'single' }).select('id').single()
  await admin.from('trip_expenses').insert({
    trip_id: t!.id, category: 'E2E Receipt', amount: 50000, currency: 'IDR',
    spent_at: '2099-01-01', receipt_url: 'https://example.com/receipt.png',
  })
})

test.beforeEach(async ({ page }) => {
  await login(page)
})

test('media link opens the inline viewer (no new tab)', async ({ page }) => {
  await gotoReady(page, '/finance/trip-expenses')
  const row = page.getByRole('row', { name: new RegExp(TRIP) })
  await row.getByRole('button', { name: 'Lihat' }).click()
  // the lightbox is a dialog with a close button + the image
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('button', { name: 'Tutup' })).toBeVisible()
  await expect(dialog.locator('img[src="https://example.com/receipt.png"]')).toBeAttached()
})
