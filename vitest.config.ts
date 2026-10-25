import { defineConfig, mergeConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'
export default mergeConfig(viteConfig, defineConfig({ test: { exclude: [
  ...configDefaults.exclude, 'e2e/**', 'output/**', 'test-results/**', 'playwright-report/**',
  // These import-pipeline suites use node:test and run through test:ui-assets.
  'tests/reference-svg-atlas.test.mjs', 'tests/provided-png-package.test.mjs', 'scripts/__tests__/catalog-splash-artwork.test.mjs',
] } }))
