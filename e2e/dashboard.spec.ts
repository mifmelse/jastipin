import { test, expect } from '@playwright/test'
import { login } from './helpers'

test.beforeEach(async ({ page }) => {
  await login(page)
})

test('dashboard: summary KPIs + sections render', async ({ page }) => {
  // login() already lands on the dashboard. These KPI labels are unique.
  for (const label of ['Kas bersih', 'Piutang (AR)', 'Hutang (AP)']) {
    await expect(page.getByText(label, { exact: true })).toBeVisible()
  }
  for (const heading of ['Order berjalan', 'Trip aktif', 'Profit per trip']) {
    await expect(page.getByRole('heading', { name: heading })).toBeVisible()
  }

  // a KPI card links into its module
  await page.getByRole('link', { name: /Order berjalan/ }).click()
  await expect(page).toHaveURL(/\/operations\/orders/)
})
