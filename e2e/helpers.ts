import { expect, type Page } from '@playwright/test'
import { E2E_EMAIL, E2E_PASSWORD } from './constants'

// Navigate and wait for Nuxt to finish hydrating before interacting —
// otherwise clicks hit pre-hydration DOM (forms do a native submit).
export async function gotoReady(page: Page, path: string) {
  await page.goto(path)
  await page.waitForFunction(() => {
    const el = document.querySelector('#__nuxt') as (Element & { __vue_app__?: unknown }) | null
    return !!el?.__vue_app__
  })
}

export async function login(page: Page) {
  await gotoReady(page, '/login')
  await page.locator('input[type="email"]').fill(E2E_EMAIL)
  await page.locator('input[type="password"]').fill(E2E_PASSWORD)
  await page.getByRole('button', { name: 'Masuk' }).click()
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 20_000 })
}

// Delete the row matching `name` via its trash button + confirm dialog. We
// explicitly await the DELETE response — the row is removed from the list as
// soon as the request is fired, so without this the test could end and abort
// the in-flight request before it commits.
export async function deleteRow(page: Page, name: RegExp) {
  await page.getByRole('row', { name }).getByRole('button').last().click()
  // Covers both Supabase REST (/rest/v1/...) and the users server route (/api/users/...).
  const deleted = page.waitForResponse((r) => r.request().method() === 'DELETE', { timeout: 15_000 })
  await page.getByRole('button', { name: 'Hapus', exact: true }).click()
  await deleted
  await expect(page.getByRole('row', { name })).toHaveCount(0)
}
