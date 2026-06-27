import { test, expect } from '@playwright/test'
import { login } from './helpers'

test.beforeEach(async ({ page }) => {
  await login(page)
})

test('command palette: opens, searches, navigates', async ({ page }) => {
  await page.getByRole('button', { name: 'Cari (Command-K)' }).click()
  const d = page.getByRole('dialog')
  await d.waitFor()
  await d.getByPlaceholder('Cari halaman atau aksi…').fill('Orders')
  await page.getByRole('option', { name: 'Orders', exact: true }).first().click()
  await expect(page).toHaveURL(/\/operations\/orders/)
})

test('command palette: quick action navigates AND opens the create modal', async ({ page }) => {
  await page.getByRole('button', { name: 'Cari (Command-K)' }).click()
  const d = page.getByRole('dialog')
  await d.waitFor()
  await d.getByPlaceholder('Cari halaman atau aksi…').fill('Buat order')
  await page.getByRole('option', { name: 'Buat order' }).first().click()
  await expect(page).toHaveURL(/\/operations\/orders\?new=1|\/operations\/orders$/)
  // the order create modal auto-opens (not just the page)
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Tambah Order' })).toBeVisible()
})

test('command palette: "Tambah customer" selects Contacts tab + opens modal', async ({ page }) => {
  await page.getByRole('button', { name: 'Cari (Command-K)' }).click()
  const d = page.getByRole('dialog')
  await d.waitFor()
  await d.getByPlaceholder('Cari halaman atau aksi…').fill('Tambah customer')
  await page.getByRole('option', { name: 'Tambah customer' }).first().click()
  await expect(page).toHaveURL(/\/operations\/crm/)
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Tambah Customer' })).toBeVisible()
})

test('user menu: profile dropdown + edit modal', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Notifikasi' })).toBeVisible()

  await page.getByRole('button', { name: 'Menu profil' }).click()
  for (const item of ['Edit profile', 'Ganti tema', 'Logout']) {
    await expect(page.getByRole('menuitem', { name: item })).toBeVisible()
  }
  await page.getByRole('menuitem', { name: 'Edit profile' }).click()
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Edit profile' })).toBeVisible()
})

test('theme: switch to dark applies the dark class', async ({ page }) => {
  await page.getByRole('button', { name: 'Menu profil' }).click()
  await page.getByRole('menuitem', { name: 'Ganti tema' }).hover()
  await page.getByRole('menuitem', { name: 'Gelap' }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
})
