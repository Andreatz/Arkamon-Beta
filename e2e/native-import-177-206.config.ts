import { defineConfig } from '@playwright/test'
import gameTests from '../playwright.config'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const directory = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  ...gameTests,
  testDir: directory,
  testMatch: ['native-import-177-206.spec.ts'],
  testIgnore: [],
  workers: 2,
  retries: 0,
  outputDir: resolve(directory, '../output/animation-import-2026-11-18/browser-results'),
  reporter: [['list'], ['json', { outputFile: resolve(directory, '../output/animation-import-2026-11-18/browser-results.json') }]],
  use: { ...gameTests.use, baseURL: 'http://127.0.0.1:3071', reducedMotion: 'no-preference' },
  webServer: {
    command: 'node node_modules/vite/bin/vite.js --config e2e/vite.config.ts --port 3071 --strictPort',
    cwd: resolve(directory, '..'),
    url: 'http://127.0.0.1:3071', reuseExistingServer: false, timeout: 60_000,
  },
})
