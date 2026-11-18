import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'

type Animation = 'idle' | 'attack' | 'hit' | 'victory' | 'ko'
const sourceCounts: Record<string, Record<Animation, number>> = JSON.parse(readFileSync(
  'src/components/arkamon/__tests__/fixtures/native-import-2026-11-18.json', 'utf8'))
const paged: { clips: Record<string, { pages: { src: string }[] }> } = JSON.parse(readFileSync('src/data/arkamon-paged.json', 'utf8'))
interface NativeEvent { kind: string; animation: Animation; frame: number; time: number }
interface ImportHarness {
  events: NativeEvent[]
  play: (animation: Animation) => void
  stats: () => { peakDecodedBytes: number; peakDecodes: number }
  close: () => void
}
declare global { interface Window { nativeImportNovember18: ImportHarness } }

for (const species of Object.keys(sourceCounts).map(Number)) {
  test(`November 18 ${species}: five complete native actions, timed cues and final KO`, async ({ page }, testInfo) => {
    const errors: string[] = [], requests = new Set<string>()
    page.on('pageerror', error => errors.push(error.message))
    page.on('request', request => requests.add(new URL(request.url()).pathname))
    page.on('response', response => {
      if (response.url().includes('/arkamon-paged/') && response.status() >= 400) errors.push(`${response.status()}: ${response.url()}`)
    })
    page.on('requestfailed', request => {
      if (request.url().includes('/arkamon-paged/')) errors.push(request.url())
    })
    await page.goto('/')
    await page.evaluate(async id => {
      const harness = await import('/e2e/native-pages-harness.tsx')
      window.nativeImportNovember18 = harness.mountNativePages(id, 'idle', 'low', false, 'fast') as ImportHarness
    }, species)
    const sprite = page.locator('[data-sprite-renderer="paged-canvas"]')
    await expect(sprite).toBeVisible()
    await expect(sprite).toHaveAttribute('data-sprite-fps', '48')
    await expect(sprite).toHaveAttribute('data-sprite-frame-count', String(sourceCounts[species].idle))
    await expect.poll(() => sprite.getAttribute('data-sprite-frame').then(Number)).toBeGreaterThan(0)
    const allPagesRequested = (action: Animation) => paged.clips[`/sprites/arkamon/${species}/front/${action}.webp`].pages
      .every(part => requests.has(part.src))
    await expect.poll(() => allPagesRequested('idle')).toBe(true)
    for (const action of ['attack', 'hit', 'victory', 'ko'] as const) {
      const metadata = JSON.parse(readFileSync(`public/sprites/arkamon/${species}/front/${action}.metadata.json`, 'utf8'))
      await page.evaluate(next => window.nativeImportNovember18.play(next), action)
      await expect(sprite).toHaveAttribute('data-sprite-frame-count', String(sourceCounts[species][action]))
      await expect.poll(() => page.evaluate(next => window.nativeImportNovember18.events
        .filter(event => event.kind === 'complete' && event.animation === next).length, action)).toBe(1)
      const events = await page.evaluate(() => window.nativeImportNovember18.events)
      expect(events.filter(event => event.kind === 'error')).toEqual([])
      const start = events.find(event => event.kind === 'start' && event.animation === action)!
      const complete = events.find(event => event.kind === 'complete' && event.animation === action)!
      expect(complete.time - start.time).toBeGreaterThanOrEqual((sourceCounts[species][action] - 2) / 48 * 1000)
      if (action === 'attack' || action === 'hit') {
        const kind = action === 'attack' ? 'release' : 'reaction'
        const expectedFrame = metadata.timing[kind + 'Frame'] as number
        const emitted = events.filter(event => event.kind === kind && event.animation === action)
        expect(emitted).toHaveLength(1)
        expect(emitted[0].frame).toBeGreaterThanOrEqual(expectedFrame)
        expect(emitted[0].time - start.time).toBeGreaterThanOrEqual((expectedFrame - 1) / 48 * 1000)
      }
      await expect.poll(() => allPagesRequested(action)).toBe(true)
      if (action === 'ko') {
        await expect(sprite).toHaveAttribute('data-sprite-frame', String(sourceCounts[species].ko - 1))
        await page.waitForTimeout(250)
        await expect(sprite).toHaveAttribute('data-sprite-frame', String(sourceCounts[species].ko - 1))
      }
      const stats = await page.evaluate(() => window.nativeImportNovember18.stats())
      expect(stats.peakDecodedBytes).toBeLessThanOrEqual(32 * 1024 * 1024)
      expect(stats.peakDecodes).toBeLessThanOrEqual(2)
    }
    expect([...requests].some(url => new RegExp(`/sprites/arkamon/${species}/front/(idle|attack|hit|victory|ko)\\.webp$`).test(url))).toBe(false)
    expect(errors).toEqual([])
    await page.screenshot({ path: testInfo.outputPath('native-final-ko.png') })
    await page.evaluate(() => window.nativeImportNovember18.close())
  })
}

for (const species of [177, 188, 201, 204, 206]) {
  test(`November 18 laboratory ${species}: playable Database form and original-frame review`, async ({ page }, testInfo) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto('/dev.html#arkamon-lab')
    await page.locator('#darklaw-preview-species').selectOption(String(species))
    const lab = page.locator('[data-darklaw-lab]')
    await expect(lab).toHaveAttribute('data-asset-status', 'game-data-present')
    await expect(lab).toHaveAttribute('data-preview-available', 'true')
    await expect(page.locator('[data-asset-pending]')).toHaveCount(0)
    await expect(page.locator('#arkamon-preview-move')).toHaveCount(1)
    await expect(page.locator('#arkamon-preview-target')).toHaveCount(1)
    await expect(page.getByRole('button', { name: 'Retro', exact: true })).toBeDisabled()
    const sprite = page.locator('[data-preview-card="animated"] [data-sprite-renderer="paged-canvas"]')
    await expect(sprite).toBeVisible()
    await expect(sprite).toHaveAttribute('data-sprite-fps', '24')
    await page.getByRole('button', { name: 'KO', exact: true }).click()
    await page.getByRole('button', { name: 'Ultimo fotogramma', exact: true }).click()
    await expect(sprite).toHaveAttribute('data-sprite-paused', 'true')
    await expect(sprite).toHaveAttribute('data-sprite-frame', String(sourceCounts[species].ko - 1))
    await expect(page.getByRole('slider', { name: 'Fotogramma sorgente', exact: true })).toHaveAttribute('max', String(sourceCounts[species].ko - 1))
    expect(errors).toEqual([])
    await page.locator('.darklaw-lab__comparison').screenshot({ path: testInfo.outputPath('native-laboratory.png') })
  })
}

for (const [attacker, target] of [[177, 188], [201, 206]]) {
  test(`November 18 VFX ${attacker} versus ${target}: native release and impact complete together`, async ({ page }, testInfo) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto('/dev.html#arkamon-lab')
    await page.locator('#darklaw-preview-species').selectOption(String(attacker))
    await expect(page.locator('[data-preview-card="animated"] [data-sprite-renderer="paged-canvas"]')).toBeVisible()
    await page.locator('#arkamon-preview-target').selectOption(String(target))
    const play = page.getByRole('button', { name: 'Prova attacco con VFX', exact: true })
    await play.click()
    const stage = page.locator('[data-preview-sync-phase]')
    await expect(stage.locator('[data-sprite-renderer="paged-canvas"]')).toHaveCount(2)
    await expect(stage).toHaveAttribute('data-preview-sync-phase', 'complete', { timeout: 30_000 })
    const events: { event: string; atMs: number }[] = JSON.parse((await stage.getAttribute('data-preview-sync-events'))!)
    for (const event of ['attacker-ready', 'target-ready', 'release', 'impact', 'target-reaction', 'attacker-complete', 'target-complete', 'complete']) {
      expect(events.filter(item => item.event === event)).toHaveLength(1)
    }
    expect(events.find(item => item.event === 'target-reaction')!.atMs).toBeGreaterThanOrEqual(events.find(item => item.event === 'impact')!.atMs)
    await expect(play).toBeEnabled()
    expect(errors).toEqual([])
    await stage.screenshot({ path: testInfo.outputPath('native-vfx-complete.png') })
  })
}
