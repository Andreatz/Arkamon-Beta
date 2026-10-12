import { defineConfig, mergeConfig } from 'vite'
import gameConfig from '../vite.config'
export default mergeConfig(gameConfig, defineConfig({ server: { host: '127.0.0.1', port: 3014, strictPort: true, open: false,
  watch: { ignored: ['**/public/sprites/arkamon-paged/**', '**/src/data/arkamon-paged.json', '**/docs/arkamon-pages-verification.json'] },
} }))
