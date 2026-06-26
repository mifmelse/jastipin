import { test, expect, type Page, type Locator } from '@playwright/test'
import { gotoReady, login, deleteRow } from './helpers'

test.beforeEach(async ({ page }) => {
  await login(page)
})

// A select must: open, render options (the empty-value bug made it render none),
// and close after picking (the dependent-select bug kept it open).
async function assertSelectWorks(page: Page, combo: Locator) {
  await combo.click()
  await expect(page.getByRole('option').first()).toBeVisible()
  await page.getByRole('option').first().click()
  await expect(page.getByRole('listbox')).toHaveCount(0)
}

async function auditModalSelects(page: Page, path: string, expectedCombos: number, tab?: string) {
  await gotoReady(page, path)
  if (tab) await page.getByRole('tab', { name: tab }).click()
  await page.getByRole('button', { name: 'Tambah' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.waitFor()
  const combos = dialog.getByRole('combobox')
  await expect(combos, `${path}: combobox count`).toHaveCount(expectedCombos)
  for (let i = 0; i < expectedCombos; i++) {
    await assertSelectWorks(page, combos.nth(i))
  }
  await page.getByRole('button', { name: 'Batal' }).click()
  await expect(dialog).toHaveCount(0)
}

test('every select opens with options and closes on pick', async ({ page }) => {
  // The products form needs ≥1 category to be enabled and to populate the
  // category select — create one for the run.
  const cat = `E2E Cat sel ${Date.now()}`
  await gotoReady(page, '/catalog/categories')
  await page.getByRole('button', { name: 'Tambah' }).click()
  await page.getByRole('dialog').locator('input[type="text"]').first().fill(cat)
  await page.getByRole('button', { name: 'Simpan' }).click()
  await expect(page.getByRole('cell', { name: cat })).toBeVisible()

  await auditModalSelects(page, '/catalog/brands', 1) // country
  await auditModalSelects(page, '/catalog/products', 6) // category, sub, brand, unit, country, currency
  await auditModalSelects(page, '/master-data/luggage-types', 1) // category enum
  await auditModalSelects(page, '/settings/users', 2) // role, user_type
  await auditModalSelects(page, '/settings/menu', 2) // group, required_permission
  await auditModalSelects(page, '/master-data/geography', 1, 'Countries') // continent

  // cleanup
  await gotoReady(page, '/catalog/categories')
  await deleteRow(page, new RegExp(cat))
})
