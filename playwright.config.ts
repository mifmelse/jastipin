import { defineConfig, devices } from '@playwright/test'
import 'dotenv/config'

// e2e runs against a PRODUCTION build (node .output/server) — the dev server's
// Vite dep re-optimization triggers full reloads that break interaction tests.
const PORT = 3100
const baseURL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  use: { baseURL, trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node .output/server/index.mjs',
    url: baseURL,
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      PORT: String(PORT),
      SUPABASE_URL: process.env.SUPABASE_URL ?? '',
      SUPABASE_KEY: process.env.SUPABASE_KEY ?? '',
      SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ?? '',
    },
  },
})
