import { test, expect } from '@playwright/test'
import { gotoReady, login, deleteRow } from './helpers'

const stamp = Date.now()
const CATEGORY = `E2E Cat ${stamp}`
const PRODUCT = `E2E Product ${stamp}`

test('catalog: category + product CRUD via real selects', async ({ page }) => {
  await login(page)

  // --- create a category (basic create) ---
  await gotoReady(page, '/catalog/categories')
  await page.getByRole('button', { name: 'Tambah' }).click()
  const catDialog = page.getByRole('dialog')
  await catDialog.locator('input[type="text"]').first().fill(CATEGORY)
  await page.getByRole('button', { name: 'Simpan' }).click()
  await expect(page.getByRole('cell', { name: CATEGORY })).toBeVisible()

  // --- create a product, driving the Category + Unit selects ---
  await gotoReady(page, '/catalog/products')
  await page.getByRole('button', { name: 'Tambah' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.locator('input[type="text"]').first().fill(PRODUCT)

  // Both required selects show the "Pilih…" placeholder until chosen.
  await dialog.getByRole('combobox').filter({ hasText: 'Pilih…' }).first().click() // Category
  await page.getByRole('option', { name: CATEGORY }).click()
  // Regression: a category watcher used to re-render mid-close and keep the
  // dropdown open. It must close after selecting.
  await expect(page.getByRole('listbox')).toHaveCount(0)

  await dialog.getByRole('combobox').filter({ hasText: 'Pilih…' }).click() // Unit (only one left)
  await page.getByRole('option', { name: 'Piece', exact: true }).click()

  await dialog.locator('input[type="number"]').first().fill('150') // weight_g
  await page.getByRole('button', { name: 'Simpan' }).click()

  const row = page.getByRole('row', { name: new RegExp(PRODUCT) })
  await expect(row).toBeVisible()
  await expect(row).toContainText(CATEGORY)
  await expect(row).toContainText('150')

  // --- edit the weight ---
  await row.getByRole('button').first().click() // pencil
  await dialog.locator('input[type="number"]').first().fill('175')
  await page.getByRole('button', { name: 'Simpan' }).click()
  await expect(page.getByRole('row', { name: new RegExp(PRODUCT) })).toContainText('175')

  // --- delete the product (reusable confirm dialog) ---
  await deleteRow(page, new RegExp(PRODUCT))

  // --- clean up the category ---
  await gotoReady(page, '/catalog/categories')
  await deleteRow(page, new RegExp(CATEGORY))
})
