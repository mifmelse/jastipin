import { test, expect } from '@playwright/test'
import { gotoReady, login, deleteRow } from './helpers'

const ts = Date.now()
const NAME = `E2E Customer ${ts}`

test.beforeEach(async ({ page }) => {
  await login(page)
})

test('customer: create → detail, edit info, add address, delete', async ({ page }) => {
  await gotoReady(page, '/operations/crm')
  await page.getByRole('tab', { name: 'Contacts' }).click()
  await page.getByRole('button', { name: 'Tambah customer' }).click()
  const d = page.getByRole('dialog')
  await d.waitFor()
  await d.locator('input[type="text"]').first().fill(NAME)
  await page.getByRole('button', { name: 'Simpan' }).click()

  // landed on the customer detail
  await expect(page.getByRole('heading', { name: NAME })).toBeVisible()

  // edit info (phone) — persists via customers PATCH
  const main = page.locator('main')
  await main.locator('input').nth(1).fill('0811222333')
  const savedInfo = page.waitForResponse(
    (r) => r.url().includes('/rest/v1/customers') && r.request().method() === 'PATCH',
  )
  await main.getByRole('button', { name: 'Simpan' }).click()
  await savedInfo
  await expect(page.getByText('0811222333')).toBeVisible()

  // add a recipient address
  await page.getByRole('button', { name: 'Tambah alamat' }).click()
  const am = page.getByRole('dialog')
  await am.locator('input[type="text"]').first().fill('Rumah')
  await am.locator('textarea').first().fill('Jl. Sudirman 1')
  await page.getByRole('button', { name: 'Simpan' }).click()
  await expect(page.getByText('Rumah')).toBeVisible()

  // cleanup (cascades the address)
  await gotoReady(page, '/operations/crm')
  await page.getByRole('tab', { name: 'Contacts' }).click()
  await deleteRow(page, new RegExp(NAME))
})

test('crm pipeline: lead create, move stage, activity, delete', async ({ page }) => {
  const lead = `E2E Lead ${ts}`
  await gotoReady(page, '/operations/crm')
  await page.getByRole('tab', { name: 'Pipeline' }).click()
  await page.getByRole('button', { name: 'Tambah lead' }).click()
  const d = page.getByRole('dialog')
  await d.waitFor()
  await d.locator('input[type="text"]').first().fill(lead) // contact_name
  await page.getByRole('button', { name: 'Simpan' }).click()
  const card = page.getByTestId('lead-card').filter({ hasText: lead })
  await expect(card).toBeVisible()

  // move stage reach → lead via the card's stage select
  await card.getByRole('combobox').click()
  await page.getByRole('option', { name: 'Lead', exact: true }).click()
  await expect(card.getByRole('combobox')).toContainText('Lead')

  // add an activity
  await card.getByRole('button', { name: 'Activities' }).click()
  const am = page.getByRole('dialog')
  await am.waitFor()
  await am.locator('input[type="text"]').first().fill('Follow up WA')
  await am.getByRole('button', { name: 'Tambah' }).click()
  await expect(am.getByText('Follow up WA')).toBeVisible()
  await am.getByRole('button', { name: 'Close' }).click()
  // count updates live on the card — no page refresh needed
  await expect(card.getByRole('button', { name: 'Activities' })).toContainText('1')

  // delete lead
  await card.getByRole('button', { name: 'Hapus lead' }).click()
  const deleted = page.waitForResponse((r) => r.request().method() === 'DELETE')
  await page.getByRole('button', { name: 'Hapus', exact: true }).click()
  await deleted
  await expect(page.getByText(lead)).toHaveCount(0)
})

test('crm pipeline: lead linked to an existing customer (either/or)', async ({ page }) => {
  const cust = `E2E CustLead ${ts}`
  // create the customer
  await gotoReady(page, '/operations/crm')
  await page.getByRole('tab', { name: 'Contacts' }).click()
  await page.getByRole('button', { name: 'Tambah customer' }).click()
  await page.getByRole('dialog').locator('input[type="text"]').first().fill(cust)
  await page.getByRole('button', { name: 'Simpan' }).click()
  await expect(page.getByRole('heading', { name: cust })).toBeVisible()

  // add a lead in "Dari customer" mode
  await gotoReady(page, '/operations/crm')
  await page.getByRole('tab', { name: 'Pipeline' }).click()
  await page.getByRole('button', { name: 'Tambah lead' }).click()
  const d = page.getByRole('dialog')
  await d.waitFor()
  await d.getByRole('button', { name: 'Dari customer' }).click()
  // contact name field is gone in this mode
  await expect(d.getByText('Contact name')).toHaveCount(0)
  await d.getByRole('combobox').first().click() // Customer select
  await page.getByRole('option', { name: cust, exact: true }).click()
  await page.getByRole('button', { name: 'Simpan' }).click()
  const card = page.getByTestId('lead-card').filter({ hasText: cust })
  await expect(card).toBeVisible() // card shows the customer's name

  // cleanup: delete lead + customer
  await card.getByRole('button', { name: 'Hapus lead' }).click()
  const delLead = page.waitForResponse((r) => r.request().method() === 'DELETE')
  await page.getByRole('button', { name: 'Hapus', exact: true }).click()
  await delLead
  await gotoReady(page, '/operations/crm')
  await page.getByRole('tab', { name: 'Contacts' }).click()
  await deleteRow(page, new RegExp(cust))
})
