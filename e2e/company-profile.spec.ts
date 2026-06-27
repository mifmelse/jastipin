import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { gotoReady, login } from './helpers'

// D1: single-row company profile (settings) — drives invoice header/footer.
const ts = Date.now()
const NAME = `E2E Co ${ts}`

function admin() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, { auth: { persistSession: false } })
}

test.afterAll(async () => {
  // restore the default name so other runs aren't affected
  await admin().from('company_profile').update({ name: 'Bagasian' }).eq('id', 1)
})

test.beforeEach(async ({ page }) => {
  await login(page)
})

test('company profile: edit name persists', async ({ page }) => {
  await gotoReady(page, '/settings/company')
  const nameInput = page.locator('main').getByRole('textbox').first()
  await nameInput.fill(NAME)
  const saved = page.waitForResponse((r) => r.url().includes('/rest/v1/company_profile') && r.request().method() === 'PATCH')
  await page.getByRole('button', { name: 'Simpan' }).click()
  await saved
  await expect(page.getByText('Tersimpan').first()).toBeVisible()

  const { data } = await admin().from('company_profile').select('name').eq('id', 1).single()
  expect(data!.name).toBe(NAME)
})
