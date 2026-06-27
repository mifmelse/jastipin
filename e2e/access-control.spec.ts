import { test, expect, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { gotoReady } from './helpers'

// A user whose role carries no permissions must be redirected away from gated
// pages even via a direct URL (the route middleware enforces it).
const ts = Date.now()
const EMAIL = `e2e-crud-noperm-${ts}@jastipin.local`
const PASSWORD = 'NoPerm-123!'

test.beforeAll(async () => {
  const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, { auth: { persistSession: false } })
  // role 'customer' exists but has no role_permissions → zero access
  await admin.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: 'E2E NoPerm', role: 'customer' },
  })
})

async function loginAs(page: Page, email: string, password: string) {
  await gotoReady(page, '/login')
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: 'Masuk' }).click()
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 20_000 })
}

test('no-permission user is redirected from a gated page', async ({ page }) => {
  await loginAs(page, EMAIL, PASSWORD)

  // dashboard ('/') has no required permission → allowed
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  // sidebar shows no Orders link for this user
  await expect(page.getByRole('link', { name: 'Orders' })).toHaveCount(0)

  // direct URL to a gated page → bounced back to the dashboard
  await page.goto('/operations/orders')
  await expect(page).toHaveURL(/\/$/) // redirected to '/'
  await expect(page.getByRole('heading', { name: 'Profit per trip' })).toBeVisible() // dashboard content
})
