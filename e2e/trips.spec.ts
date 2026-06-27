import { test, expect, type Page } from '@playwright/test'
import { gotoReady, login, deleteRow } from './helpers'

const ts = Date.now()

test.beforeEach(async ({ page }) => {
  await login(page)
})

async function createTrip(page: Page, name: string, typeLabel: string) {
  await gotoReady(page, '/operations/trips')
  await page.getByRole('button', { name: 'Tambah' }).click()
  const d = page.getByRole('dialog')
  await d.waitFor()
  await d.locator('input[type="text"]').first().fill(name)
  await d.getByRole('combobox').first().click() // Type
  await page.getByRole('option', { name: typeLabel, exact: true }).click()
  await page.getByRole('button', { name: 'Simpan' }).click()
  await expect(page.getByRole('heading', { name })).toBeVisible()
  await page.getByRole('tab', { name: 'Routes' }).click()
}

async function pickLegCountries(page: Page, from: string, to: string) {
  const m = page.getByRole('dialog')
  await m.getByRole('combobox').nth(0).click()
  await page.getByRole('option', { name: from, exact: true }).click()
  await m.getByRole('combobox').nth(1).click()
  await page.getByRole('option', { name: to, exact: true }).click()
}

test('trip single: exactly one leg allowed', async ({ page }) => {
  const name = `E2E Trip single ${ts}`
  await createTrip(page, name, 'Single')
  await page.getByRole('button', { name: 'Tambah route' }).click()
  await pickLegCountries(page, 'Indonesia', 'Japan')
  await page.getByRole('button', { name: 'Simpan' }).click()
  await expect(page.getByRole('row', { name: /Indonesia.*Japan/ })).toBeVisible()
  // no second leg
  await expect(page.getByRole('button', { name: 'Tambah route' })).toBeDisabled()
  await gotoReady(page, '/operations/trips')
  await deleteRow(page, new RegExp(name))
})

test('trip round: outbound + auto-created return', async ({ page }) => {
  const name = `E2E Trip round ${ts}`
  await createTrip(page, name, 'Round')
  await page.getByRole('button', { name: 'Tambah route' }).click()
  await pickLegCountries(page, 'Indonesia', 'Japan')
  await page.getByRole('button', { name: 'Simpan' }).click()
  // both legs exist: outbound + auto return (swapped)
  await expect(page.getByRole('row', { name: /Indonesia.*→.*Japan/ })).toBeVisible()
  await expect(page.getByRole('row', { name: /Japan.*→.*Indonesia/ })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Tambah route' })).toBeDisabled()
  await gotoReady(page, '/operations/trips')
  await deleteRow(page, new RegExp(name))
})

test('trip multi: auto-chain + unbounded', async ({ page }) => {
  const name = `E2E Trip multi ${ts}`
  await createTrip(page, name, 'Multi')
  await page.getByRole('button', { name: 'Tambah route' }).click()
  await pickLegCountries(page, 'Indonesia', 'Japan')
  await page.getByRole('button', { name: 'Simpan' }).click()
  await expect(page.getByRole('row', { name: /Indonesia.*Japan/ })).toBeVisible()
  // second leg: From auto-chains to Japan
  await page.getByRole('button', { name: 'Tambah route' }).click()
  await expect(page.getByRole('dialog').getByRole('combobox').nth(0)).toContainText('Japan')
  await page.getByRole('dialog').getByRole('combobox').nth(1).click()
  await page.getByRole('option', { name: 'South Korea', exact: true }).click()
  await page.getByRole('button', { name: 'Simpan' }).click()
  await expect(page.getByRole('row', { name: /Japan.*South Korea/ })).toBeVisible()
  // still addable (unbounded)
  await expect(page.getByRole('button', { name: 'Tambah route' })).toBeEnabled()
  await gotoReady(page, '/operations/trips')
  await deleteRow(page, new RegExp(name))
})

test('trip type change resets legs', async ({ page }) => {
  const name = `E2E Trip reset ${ts}`
  await createTrip(page, name, 'Multi')
  await page.getByRole('button', { name: 'Tambah route' }).click()
  await pickLegCountries(page, 'Indonesia', 'Japan')
  await page.getByRole('button', { name: 'Simpan' }).click()
  await expect(page.getByRole('row', { name: /Indonesia.*Japan/ })).toBeVisible()

  // change type → single (confirm resets legs)
  await page.getByRole('tab', { name: 'Overview' }).click()
  await page.locator('main').getByRole('combobox').nth(0).click() // Type
  await page.getByRole('option', { name: 'Single', exact: true }).click()
  await page.getByRole('button', { name: 'Simpan' }).click()
  await page.getByRole('button', { name: 'Ganti & reset' }).click()

  await page.getByRole('tab', { name: 'Routes' }).click()
  await expect(page.getByText('Belum ada route').first()).toBeVisible()
  await gotoReady(page, '/operations/trips')
  await deleteRow(page, new RegExp(name))
})

test('trip slice B: bookings, expenses, itinerary, moments', async ({ page }) => {
  const name = `E2E Trip sub ${ts}`
  await createTrip(page, name, 'Single') // lands on Routes

  // --- Bookings ---
  await page.getByRole('tab', { name: 'Bookings' }).click()
  await page.getByRole('button', { name: 'Tambah booking' }).click()
  await page.getByRole('dialog').locator('input[type="text"]').first().fill('Flight GA-123')
  await page.getByRole('button', { name: 'Simpan' }).click()
  await expect(page.getByRole('row', { name: /Flight GA-123/ })).toBeVisible()
  await deleteRow(page, /Flight GA-123/)

  // --- Expenses (with total) ---
  await page.getByRole('tab', { name: 'Expenses' }).click()
  await page.getByRole('button', { name: 'Tambah expense' }).click()
  let d = page.getByRole('dialog')
  await d.locator('input[type="text"]').first().fill('Transport')
  await d.locator('input[type="number"]').first().fill('1000') // amount
  await d.getByRole('combobox').first().click() // currency
  await page.getByRole('option', { name: 'JPY', exact: true }).click()
  await d.locator('input[type="number"]').nth(1).fill('110') // fx_rate (foreign → shown)
  await page.getByRole('button', { name: 'Simpan' }).click()
  const expRow = page.getByRole('row', { name: /Transport/ })
  await expect(expRow).toContainText('JPY')
  await expect(page.getByText('Rp 110.000')).toBeVisible() // total IDR = 1000 × 110
  await deleteRow(page, /Transport/)

  // --- Itinerary (structured, date-based; floating add) ---
  await page.getByRole('tab', { name: 'Itinerary' }).click()
  await page.getByRole('button', { name: 'Tambah', exact: true }).click() // FAB
  d = page.getByRole('dialog')
  await d.locator('input[type="date"]').fill('2026-07-01')
  await d.locator('input[type="text"]').first().fill('Tiba di Tokyo')
  await page.getByRole('button', { name: 'Simpan' }).click()
  await expect(page.getByText('Tiba di Tokyo')).toBeVisible()

  // --- Moments (text-only post; floating composer) ---
  await page.getByRole('tab', { name: 'Moments' }).click()
  await page.getByRole('button', { name: 'Posting', exact: true }).click() // FAB
  d = page.getByRole('dialog')
  await d.locator('textarea').first().fill('Hari pertama seru!')
  await d.locator('input[type="text"]').first().fill('Tokyo') // location
  await d.getByRole('button', { name: 'Posting' }).click() // composer submit
  await expect(page.getByText('Hari pertama seru!')).toBeVisible()

  // cleanup (cascades the moment)
  await gotoReady(page, '/operations/trips')
  await deleteRow(page, new RegExp(name))
})

test('trip overview edit persists', async ({ page }) => {
  const name = `E2E Trip edit ${ts}`
  const renamed = `E2E Trip edited ${ts}`
  await createTrip(page, name, 'Multi')
  await page.getByRole('tab', { name: 'Overview' }).click()
  const main = page.locator('main')
  await main.locator('input[type="text"]').first().fill(renamed)
  await main.locator('input[type="number"]').first().fill('5') // traveler_count
  await main.getByRole('combobox').nth(1).click() // status
  await page.getByRole('option', { name: 'Ongoing', exact: true }).click()
  const saved = page.waitForResponse(
    (r) => r.url().includes('/rest/v1/trips') && r.request().method() === 'PATCH',
  )
  await page.getByRole('button', { name: 'Simpan' }).click()
  await saved

  // reload list → renamed trip is ongoing
  await gotoReady(page, '/operations/trips')
  const row = page.getByRole('row', { name: new RegExp(renamed) })
  await expect(row).toContainText('ongoing')
  await expect(row).toContainText('5')
  await deleteRow(page, new RegExp(renamed))
})
