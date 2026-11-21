import { defineConfig, devices } from '@playwright/test'

// Audit fase 10: regressione visiva delle schermate chiave (titolo, mappa, menù, battaglia, risultato).
// Le immagini di riferimento mancanti vengono create e caricate come artefatto: una volta
// approvate si salvano in e2e-visual/__screenshots__ e da lì in poi ogni differenza fallisce.
export default defineConfig({
  testDir: './e2e-visual', timeout: 60_000, workers: 1, retries: 0,
  expect: { timeout: 15_000, toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled', caret: 'hide' } },
  updateSnapshots: 'missing',
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'output/visual-report' }]],
  outputDir: 'output/visual-results',
  use: { baseURL: 'http://127.0.0.1:3014', reducedMotion: 'reduce', trace: 'retain-on-failure' },
  projects: [{ name: 'visual-chromium', use: { ...devices['Desktop Chrome'], deviceScaleFactor: 1 } }],
  webServer: { command: 'node node_modules/vite/bin/vite.js --config e2e/vite.config.ts', url: 'http://127.0.0.1:3014', reuseExistingServer: !process.env.CI, timeout: 60_000 },
})
