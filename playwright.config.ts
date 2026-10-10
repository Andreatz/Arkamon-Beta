import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e', timeout: 60_000, globalTimeout: 10 * 60_000,
  expect: { timeout: 15_000 }, fullyParallel: false,
  forbidOnly: Boolean(process.env.CI), retries: process.env.CI ? 1 : 0,
  workers: 1, reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:3014', trace: 'retain-on-failure', screenshot: 'only-on-failure', reducedMotion: 'reduce' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], channel: process.env.PW_CHANNEL || undefined } },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel: process.env.PW_CHANNEL || undefined } },
  ],
  webServer: { command: 'node node_modules/vite/bin/vite.js --config e2e/vite.config.ts', url: 'http://127.0.0.1:3014', reuseExistingServer: !process.env.CI, timeout: 60_000 },
})
