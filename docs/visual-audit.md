# Arkamon visual audit — isolated GitHub Actions

This workflow does not change combat rules, game saves or asset data.

## Use

After merge to main, open Actions → Arkamon Visual Audit → Run workflow. Choose quick mode for five screenshots or the full run to enumerate the registered scenes and variants. This workflow also runs automatically in a pull request that changes the audit code.

Download the arkamon-visual-audit ZIP artifact and open index.html locally. It contains WebP screenshots, selected interaction state screenshots, short native sprite WebM samples, manifest.json, SUMMARY.md, Vite diagnostics and functional.log.

## What it actually verifies

The collector mounts each of the 25 registered UI Studio scenes and their named variants using isolated demonstration fixtures, recording visible controls, image loading failures, overflow and browser exceptions. The three visual modes are current desktop composition, Aurora desktop and Aurora mobile. It also visits the dedicated labs directly and records a few native animation samples.

The independent functional Playwright smoke subset uses the existing game tests. It does not fully cover every possible command, video, audience integration, stream environment or real physical device. A failure in the functional smoke test does not prevent uploading captured evidence.

## Run with your own full checkout

1. npm ci
2. npx playwright install chromium
3. Start the Vite server with: node node_modules/vite/bin/vite.js --config e2e/vite.config.ts --host 127.0.0.1 --port 3014
4. In another terminal run: node scripts/visual-audit.mjs
5. Open: output/visual-audit/index.html

Use ARKAMON_AUDIT_LIMIT=5 to capture only the first five screens.

The workflow is read-only, does not commit generated reports, and never deploys the game.