import { test, expect } from '@playwright/test'
import { gotoReady, login, deleteRow } from './helpers'

// Exercises the reusable SimpleMasterCrud via one of the five A4 masters.
// The other four share the exact same component, so this covers the pattern.
const ts = Date.now()

test.beforeEach(async ({ page }) => {
  await login(page)
})

test('A4 master (expense categories) CRUD via reusable component', async ({ page }) => {
  const name = `E2E Cat ${ts}`
  await gotoReady(page, '/master-data/expense-categories')

  // create
  await page.getByRole('button', { name: 'Tambah' }).click()
  const d = page.getByRole('dialog')
  await d.waitFor()
  await d.locator('input[type="text"]').first().fill(name)
  await page.getByRole('button', { name: 'Simpan' }).click()
  await expect(page.getByRole('cell', { name, exact: true })).toBeVisible()

  // edit
  await page.getByRole('row', { name: new RegExp(name) }).getByRole('button').first().click()
  await page.getByRole('dialog').locator('input[type="text"]').first().fill(`${name} X`)
  await page.getByRole('button', { name: 'Simpan' }).click()
  await expect(page.getByRole('cell', { name: `${name} X`, exact: true })).toBeVisible()

  // delete
  await deleteRow(page, new RegExp(`${name} X`))
  await expect(page.getByRole('cell', { name: `${name} X`, exact: true })).toHaveCount(0)
})
