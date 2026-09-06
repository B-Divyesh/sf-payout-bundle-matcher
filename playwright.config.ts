import { defineConfig } from '@playwright/test'

const externalBaseUrl = process.env.BASE_URL

export default defineConfig({
  testDir: '.factory/tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['line']],
  outputDir: '.factory/evidence/test-results',
  use: {
    baseURL: externalBaseUrl || 'http://127.0.0.1:4173',
    browserName: 'chromium',
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  webServer: externalBaseUrl ? undefined : {
    command: 'npm run preview:factory',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 20_000
  }
})
