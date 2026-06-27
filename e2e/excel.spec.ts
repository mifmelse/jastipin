import { test, expect } from '@playwright/test'
import * as XLSX from 'xlsx'
import { writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { gotoReady, login } from './helpers'

const ts = Date.now()

test.beforeEach(async ({ page }) => {
  await login(page)
})

test('excel: import creates master rows + export downloads xlsx', async ({ page }) => {
  const n1 = `E2E XL A ${ts}`
  const n2 = `E2E XL B ${ts}`

  // build an .xlsx to upload
  const ws = XLSX.utils.json_to_sheet([
    { name: n1, is_active: true },
    { name: n2, is_active: false },
  ])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
  const file = join(tmpdir(), `e2e-import-${ts}.xlsx`)
  writeFileSync(file, buf)

  await gotoReady(page, '/master-data/expense-categories')

  // import (hidden file input belongs to ExcelToolbar)
  await page.locator('input[type="file"]').setInputFiles(file)
  await expect(page.getByText(/ditambah/)).toBeVisible()
  await page.getByRole('button', { name: 'Tutup' }).click()
  await expect(page.getByRole('cell', { name: n1, exact: true })).toBeVisible()
  await expect(page.getByRole('cell', { name: n2, exact: true })).toBeVisible()

  // export triggers a download
  const dl = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export' }).click()
  const download = await dl
  expect(download.suggestedFilename()).toContain('.xlsx')

  // cleanup
  const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, { auth: { persistSession: false } })
  await admin.from('expense_categories').delete().in('name', [n1, n2])
})

test('excel: import upserts by non-name key (currencies by code)', async ({ page }) => {
  const code = `X${String(ts).slice(-2)}` // 3-char test code, unlikely to collide
  const ws = XLSX.utils.json_to_sheet([{ code, name: `E2E Cur ${ts}`, symbol: 'Ξ', is_active: true }])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
  const file = join(tmpdir(), `e2e-cur-${ts}.xlsx`)
  writeFileSync(file, buf)

  await gotoReady(page, '/master-data/currencies')
  await page.locator('input[type="file"]').setInputFiles(file)
  await expect(page.getByText(/ditambah/)).toBeVisible()
  await page.getByRole('button', { name: 'Tutup' }).click()
  await expect(page.getByRole('cell', { name: code, exact: true })).toBeVisible()

  const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, { auth: { persistSession: false } })
  await admin.from('currencies').delete().eq('code', code)
})
