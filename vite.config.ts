import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import mediaRelease from './src/data/media-release.json'
// @ts-expect-error The packaging utility also runs as a standalone Node ES module.
import { webAssetsPlugin } from './scripts/package-web-assets.mjs'
// @ts-expect-error Shared Node build utility; emitted runtime data has a typed virtual module.
import { nativeRuntimeManifestPlugin } from './scripts/native-runtime-manifest.mjs'

const web = process.env.GITHUB_PAGES === 'true'
const mediaRevision = web ? process.env.VITE_MEDIA_REVISION ?? mediaRelease.revision : ''

// Cambia base se pubblichi su GitHub Pages sotto /Arkamon-Beta/.
// Il workflow .github/workflows/deploy.yml setta GITHUB_PAGES=true al build.
export default defineConfig({
  plugins: [react(), nativeRuntimeManifestPlugin(__dirname), ...(web ? [webAssetsPlugin(__dirname, mediaRevision)] : [])],
  publicDir: 'public',
  define: { 'import.meta.env.VITE_MEDIA_REVISION': JSON.stringify(mediaRevision), 'import.meta.env.VITE_SPLIT_MEDIA': JSON.stringify(web) },
  base: process.env.GITHUB_PAGES === 'true' ? '/Arkamon-Beta/' : '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@data': path.resolve(__dirname, './src/data'),
      '@engine': path.resolve(__dirname, './src/engine'),
      '@store': path.resolve(__dirname, './src/store'),
      '@components': path.resolve(__dirname, './src/components'),
      '@scenes': path.resolve(__dirname, './src/scenes'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
  server: {
    port: 3000,
    open: true,
    // Browser traces contain HTML snapshots. They must never trigger a live
    // reload of a game while the same browser run is collecting evidence.
    watch: { ignored: ['**/output/**', '**/test-results/**', '**/playwright-report/**'] },
  },
  build: {
    copyPublicDir: !web,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          motion: ['framer-motion'],
          zustand: ['zustand'],
        },
      },
    },
  },
})
