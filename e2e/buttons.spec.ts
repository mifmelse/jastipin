import { test, expect, type Page } from '@playwright/test'
import { gotoReady, login, deleteRow } from './helpers'

const CATEGORY = `E2E Cat btn ${Date.now()}`

test.beforeEach(async ({ page }) => {
  await login(page)
})

// Every create modal must close via both the X (Close) and the Batal button.
async function assertModalCloses(page: Page, path: string) {
  await gotoReady(page, path)

  await page.getByRole('button', { name: 'Tambah' }).click()
  await page.getByRole('dialog').waitFor()
  await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click()
  await expect(page.getByRole('dialog'), `${path}: X should close`).toHaveCount(0)

  await page.getByRole('button', { name: 'Tambah' }).click()
  await page.getByRole('dialog').waitFor()
  await page.getByRole('button', { name: 'Batal' }).click()
  await expect(page.getByRole('dialog'), `${path}: Batal should close`).toHaveCount(0)
}

test('catalog: modal X + Batal close on every page', async ({ page }) => {
  for (const path of ['/catalog/units', '/catalog/brands', '/catalog/categories', '/catalog/products']) {
    await assertModalCloses(page, path)
  }
})

// The reported bug: after interacting with the category select, X/Batal seemed
// dead (the stuck-open dropdown's layer swallowed clicks). Guard that flow.
test('product modal: X + Batal still close after using the category select', async ({ page }) => {
  await gotoReady(page, '/catalog/categories')
  await page.getByRole('button', { name: 'Tambah' }).click()
  await page.getByRole('dialog').locator('input[type="text"]').first().fill(CATEGORY)
  await page.getByRole('button', { name: 'Simpan' }).click()
  await expect(page.getByRole('cell', { name: CATEGORY })).toBeVisible()

  await gotoReady(page, '/catalog/products')

  for (const closeVia of ['Batal', 'Close'] as const) {
    await page.getByRole('button', { name: 'Tambah' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.waitFor()
    await dialog.getByRole('combobox').filter({ hasText: 'Pilih…' }).first().click()
    await page.getByRole('option', { name: CATEGORY }).click()
    await expect(page.getByRole('listbox')).toHaveCount(0) // dropdown closed
    await page.getByRole('button', { name: closeVia, exact: true }).click()
    await expect(page.getByRole('dialog'), `close via ${closeVia}`).toHaveCount(0)
  }

  // cleanup
  await gotoReady(page, '/catalog/categories')
  await deleteRow(page, new RegExp(CATEGORY))
})
