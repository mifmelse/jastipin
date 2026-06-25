import { test, expect, type Page } from '@playwright/test'
import { gotoReady, login, deleteRow } from './helpers'

const ts = Date.now()

test.beforeEach(async ({ page }) => {
  await login(page)
})

async function openCreate(page: Page) {
  await page.getByRole('button', { name: 'Tambah' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.waitFor()
  return dialog
}
async function pick(page: Page, dialog: ReturnType<Page['getByRole']>, idx: number, option: string) {
  await dialog.getByRole('combobox').nth(idx).click()
  await page.getByRole('option', { name: option, exact: true }).click()
  await expect(page.getByRole('listbox')).toHaveCount(0)
}
test('units CRUD', async ({ page }) => {
  const name = `E2E Unit ${ts}`
  await gotoReady(page, '/catalog/units')
  let d = await openCreate(page)
  await d.locator('input[type="text"]').first().fill(name)
  await page.getByRole('button', { name: 'Simpan' }).click()
  await expect(page.getByRole('cell', { name, exact: true })).toBeVisible()
  // edit
  await page.getByRole('row', { name: new RegExp(name) }).getByRole('button').first().click()
  d = page.getByRole('dialog')
  await d.locator('input[type="text"]').first().fill(`${name} X`)
  await page.getByRole('button', { name: 'Simpan' }).click()
  await expect(page.getByRole('cell', { name: `${name} X`, exact: true })).toBeVisible()
  await deleteRow(page, new RegExp(`${name} X`))
})

test('brands CRUD with country', async ({ page }) => {
  const name = `E2E Brand ${ts}`
  await gotoReady(page, '/catalog/brands')
  const d = await openCreate(page)
  await d.locator('input[type="text"]').first().fill(name)
  await pick(page, d, 0, 'Indonesia')
  await page.getByRole('button', { name: 'Simpan' }).click()
  const row = page.getByRole('row', { name: new RegExp(name) })
  await expect(row).toContainText('Indonesia')
  await deleteRow(page, new RegExp(name))
})

test('luggage type CRUD with category + weight', async ({ page }) => {
  const name = `E2E Lug ${ts}`
  await gotoReady(page, '/master-data/luggage-types')
  const d = await openCreate(page)
  await d.locator('input[type="text"]').first().fill(name)
  await pick(page, d, 0, 'Cabin')
  await d.locator('input[type="number"]').first().fill('7000')
  await page.getByRole('button', { name: 'Simpan' }).click()
  const row = page.getByRole('row', { name: new RegExp(name) })
  await expect(row).toContainText('cabin')
  await expect(row).toContainText('7000')
  await deleteRow(page, new RegExp(name))
})

test('menu CRUD with group + permission selects', async ({ page }) => {
  const label = `E2E Menu ${ts}`
  await gotoReady(page, '/settings/menu')
  const d = await openCreate(page)
  await d.getByRole('textbox').first().fill(label) // Label
  await pick(page, d, 0, 'Operations') // group
  await pick(page, d, 1, 'trips.read') // required permission
  await page.getByRole('button', { name: 'Simpan' }).click()
  const row = page.getByRole('row', { name: new RegExp(label) })
  await expect(row).toContainText('Operations')
  await expect(row).toContainText('trips.read')
  await deleteRow(page, new RegExp(label))
})

test('role CRUD with permission matrix', async ({ page }) => {
  const name = `E2E Role ${ts}`
  await gotoReady(page, '/settings/roles')
  const d = await openCreate(page)
  await d.locator('input[type="text"]').first().fill(name)
  await page.getByRole('button', { name: 'Simpan' }).click()
  const row = page.getByRole('row', { name: new RegExp(name) })
  await expect(row).toBeVisible()
  // assign permissions
  await row.getByRole('button', { name: 'Permissions' }).click()
  const modal = page.getByRole('dialog')
  await modal.getByRole('checkbox').first().check()
  await modal.getByRole('button', { name: 'Simpan' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await deleteRow(page, new RegExp(name))
})

test('user-type + permission CRUD', async ({ page }) => {
  const ut = `E2E UT ${ts}`
  await gotoReady(page, '/settings/user-types')
  let d = await openCreate(page)
  await d.locator('input[type="text"]').first().fill(ut)
  await page.getByRole('button', { name: 'Simpan' }).click()
  await expect(page.getByRole('cell', { name: ut, exact: true })).toBeVisible()
  await deleteRow(page, new RegExp(ut))

  const perm = `e2e${ts}.read`
  await gotoReady(page, '/settings/permissions')
  d = await openCreate(page)
  await d.locator('input').first().fill(perm)
  await page.getByRole('button', { name: 'Simpan' }).click()
  await expect(page.getByRole('cell', { name: perm, exact: true })).toBeVisible()
  await deleteRow(page, new RegExp(perm.replace(/\./g, '\\.')))
})

test('geography continents + countries CRUD', async ({ page }) => {
  const cont = `E2E Cont ${ts}`
  await gotoReady(page, '/master-data/geography')
  let d = await openCreate(page) // Continents tab is default
  await d.locator('input[type="text"]').nth(0).fill('QC') // code
  await d.locator('input[type="text"]').nth(1).fill(cont) // name
  await page.getByRole('button', { name: 'Simpan' }).click()
  await expect(page.getByRole('cell', { name: cont, exact: true })).toBeVisible()

  await page.getByRole('tab', { name: 'Countries' }).click()
  const country = `E2E Country ${ts}`
  d = await openCreate(page)
  await d.locator('input[type="text"]').nth(0).fill(country) // name
  await d.locator('input[type="text"]').nth(1).fill('QC') // iso2
  await d.locator('input[type="text"]').nth(2).fill('QCY') // iso3
  await pick(page, d, 0, cont) // continent
  await page.getByRole('button', { name: 'Simpan' }).click()
  const row = page.getByRole('row', { name: new RegExp(country) })
  await expect(row).toContainText(cont)
  await deleteRow(page, new RegExp(country))

  await page.getByRole('tab', { name: 'Continents' }).click()
  await deleteRow(page, new RegExp(cont))
})

test('sub-category CRUD (category-dependent)', async ({ page }) => {
  const cat = `E2E SubCat ${ts}`
  const sub = `E2E Sub ${ts}`
  await gotoReady(page, '/catalog/categories')
  let d = await openCreate(page) // Categories tab
  await d.locator('input[type="text"]').first().fill(cat)
  await page.getByRole('button', { name: 'Simpan' }).click()
  await expect(page.getByRole('cell', { name: cat, exact: true })).toBeVisible()

  await page.getByRole('tab', { name: 'Sub-categories' }).click()
  d = await openCreate(page)
  await pick(page, d, 0, cat) // category select
  await d.locator('input[type="text"]').first().fill(sub)
  await page.getByRole('button', { name: 'Simpan' }).click()
  await expect(page.getByRole('row', { name: new RegExp(sub) })).toContainText(cat)
  await deleteRow(page, new RegExp(sub))

  await page.getByRole('tab', { name: 'Categories', exact: true }).click()
  await deleteRow(page, new RegExp(cat))
})

test('user CRUD via server route', async ({ page }) => {
  const email = `e2e-crud-${ts}@jastipin.local`
  await gotoReady(page, '/settings/users')
  const d = await openCreate(page)
  await d.locator('input[type="email"]').fill(email)
  await d.locator('input[type="password"]').fill('CrudUser-123!')
  await pick(page, d, 0, 'staff') // role
  await page.getByRole('button', { name: 'Simpan' }).click()
  const row = page.getByRole('row', { name: new RegExp(email) })
  await expect(row).toContainText('staff')
  // edit role → admin
  await row.getByRole('button').first().click()
  await pick(page, page.getByRole('dialog'), 0, 'admin')
  await page.getByRole('button', { name: 'Simpan' }).click()
  await expect(page.getByRole('row', { name: new RegExp(email) })).toContainText('admin')
  await deleteRow(page, new RegExp(email))
})
