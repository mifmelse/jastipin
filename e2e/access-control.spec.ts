import { test, expect, type Page } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { gotoReady } from './helpers'

// Access control: page-level (route middleware) + action-level (button gating).
const ts = Date.now()
const NOPERM = `e2e-crud-noperm-${ts}@jastipin.local`
const READONLY = `e2e-crud-readonly-${ts}@jastipin.local`
const PASSWORD = 'NoPerm-123!'

let admin: SupabaseClient

test.beforeAll(async () => {
  admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, { auth: { persistSession: false } })

  // ensure the zero-permission 'customer' role exists — profiles.role is now a FK
  // to roles, and this shared dev DB occasionally loses non-core roles
  await admin.from('roles').upsert(
    { name: 'customer', description: 'Eksternal — tanpa akses internal' },
    { onConflict: 'name', ignoreDuplicates: true },
  )

  // user with a role that has zero permissions
  await admin.auth.admin.createUser({
    email: NOPERM, password: PASSWORD, email_confirm: true,
    user_metadata: { full_name: 'E2E NoPerm', role: 'customer' },
  })

  // grant 'staff' read-only access to orders, and make a staff user
  const { data: role } = await admin.from('roles').select('id').eq('name', 'staff').single()
  const { data: perm } = await admin.from('permissions').select('id').eq('key', 'orders.read').single()
  await admin.from('role_permissions').upsert(
    { role_id: role!.id, permission_id: perm!.id },
    { onConflict: 'role_id,permission_id', ignoreDuplicates: true },
  )
  await admin.auth.admin.createUser({
    email: READONLY, password: PASSWORD, email_confirm: true,
    user_metadata: { full_name: 'E2E ReadOnly', role: 'staff' },
  })
})

test.afterAll(async () => {
  // revoke the temporary staff grant so role config isn't polluted
  const { data: role } = await admin.from('roles').select('id').eq('name', 'staff').single()
  const { data: perm } = await admin.from('permissions').select('id').eq('key', 'orders.read').single()
  if (role && perm) await admin.from('role_permissions').delete().eq('role_id', role.id).eq('permission_id', perm.id)
})

async function loginAs(page: Page, email: string) {
  await gotoReady(page, '/login')
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(PASSWORD)
  await page.getByRole('button', { name: 'Masuk' }).click()
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 20_000 })
}

test('no-permission user is redirected from a gated page', async ({ page }) => {
  await loginAs(page, NOPERM)
  await expect(page.getByRole('link', { name: 'Orders' })).toHaveCount(0) // not in sidebar
  await page.goto('/operations/orders')
  await expect(page).toHaveURL(/\/$/) // bounced to dashboard
  await expect(page.getByRole('heading', { name: 'Profit per trip' })).toBeVisible()
})

test('read-only user sees the page but no create/delete buttons', async ({ page }) => {
  await loginAs(page, READONLY)
  await gotoReady(page, '/operations/orders')
  await expect(page.getByRole('heading', { name: 'Orders' })).toBeVisible() // read allows the page
  await expect(page.getByRole('button', { name: 'Tambah' })).toHaveCount(0) // no orders.write
  await expect(page.getByRole('button', { name: 'Hapus order' })).toHaveCount(0) // no orders.delete
})
