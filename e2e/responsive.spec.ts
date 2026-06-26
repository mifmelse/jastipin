import { test, expect } from '@playwright/test'
import { login } from './helpers'

test('mobile: sidebar is an off-canvas drawer', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await login(page)

  const hamburger = page.getByRole('button', { name: 'Buka menu' })
  await expect(hamburger).toBeVisible()

  const aside = page.locator('aside')
  expect((await aside.boundingBox())!.x).toBeLessThan(0) // off-screen by default

  await hamburger.click()
  await page.waitForTimeout(400)
  expect((await aside.boundingBox())!.x).toBeGreaterThanOrEqual(0) // slid in

  // navigating closes the drawer
  await page.getByRole('link', { name: 'Geography' }).click()
  await expect(page.getByRole('heading', { name: 'Geography' })).toBeVisible()
  await page.waitForTimeout(400)
  expect((await aside.boundingBox())!.x).toBeLessThan(0)
})

test('desktop: sidebar fixed, no hamburger', async ({ page }) => {
  await login(page)
  await expect(page.getByRole('button', { name: 'Buka menu' })).toBeHidden()
  await expect(page.getByRole('link', { name: 'Trips' })).toBeVisible()
})
