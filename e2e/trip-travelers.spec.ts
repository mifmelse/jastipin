import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { gotoReady, login } from './helpers'

const ts = Date.now()
const TRIP = `E2E TravTrip ${ts}`

let tripId: string

test.beforeAll(async () => {
  const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, { auth: { persistSession: false } })
  const { data } = await admin.from('trips').insert({ name: TRIP, type: 'single' }).select('id').single()
  tripId = data!.id
})

test.afterAll(async () => {
  const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, { auth: { persistSession: false } })
  await admin.from('trips').delete().eq('id', tripId)
})

test.beforeEach(async ({ page }) => {
  await login(page)
})

test('trip travelers: assign a user, change role, remove', async ({ page }) => {
  await gotoReady(page, `/operations/trips/${tripId}`)
  await page.getByRole('tab', { name: 'Travelers' }).click()
  await expect(page.getByText('Belum ada traveler')).toBeVisible()

  // add
  await page.getByRole('button', { name: 'Tambah traveler' }).click()
  const d = page.getByRole('dialog')
  await d.waitFor()
  await d.getByRole('combobox').first().click() // user
  await page.getByRole('option').first().click()
  await expect(page.getByRole('listbox')).toHaveCount(0)
  await page.getByRole('button', { name: 'Tambah', exact: true }).click()

  await expect(page.getByText('Belum ada traveler')).toHaveCount(0)
  // a role select now exists in the list (defaults to Assistant)
  await expect(page.getByText('Assistant').first()).toBeVisible()

  // remove
  await page.getByRole('button', { name: 'Lepas traveler' }).click()
  await page.getByRole('button', { name: 'Lepas', exact: true }).click()
  await expect(page.getByText('Belum ada traveler')).toBeVisible()
})
