import { expect, test, type Locator } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { splashGeometry, type SplashBounds } from './helpers/splashGeometry'

type Screen = 'squadra' | 'arkadex'
interface ReviewedSplash { speciesId: number; src: string; focusBounds?: SplashBounds; subjectBounds: SplashBounds }
const catalog: ReviewedSplash[] = JSON.parse(readFileSync(new URL('../ui-source/splash-artwork.generated.json', import.meta.url), 'utf8'))
const regressionIds = [4, 49, 60, 61, 69, 104, 108]

function artworkFor(id: number) {
  const artwork = catalog.find(entry => entry.speciesId === id)
  if (!artwork) throw new Error(`The responsive framing regression requires published artwork ${id}`)
  return artwork
}

async function framingSnapshot(root: Locator, screen: Screen, artwork: ReviewedSplash) {
  const geometry = await splashGeometry(root, screen, artwork.focusBounds ?? artwork.subjectBounds)
  const rawRegion = await root.getAttribute('data-splash-frame-region')
  const coordinates = (rawRegion ?? '').split(',').map(Number)
  const validRegion = coordinates.length === 4 && coordinates.every(Number.isFinite)
    && coordinates[2] > coordinates[0] && coordinates[3] > coordinates[1]
  const region = validRegion ? {
    left: geometry.paint.x + coordinates[0], top: geometry.paint.y + coordinates[1],
    right: geometry.paint.x + coordinates[2], bottom: geometry.paint.y + coordinates[3],
  } : null
  const focus = geometry.creature
  const focusInsideProtectedRegion = region !== null
    && focus.x >= region.left - 1 && focus.y >= region.top - 1
    && focus.right <= region.right + 1 && focus.bottom <= region.bottom + 1
  const overlaps = geometry.panels.filter(panel => panel.overlap.width > 1 && panel.overlap.height > 1)
  return { ...geometry, rawRegion, region, focusInsideProtectedRegion, overlaps }
}

async function expectResponsiveFrame(root: Locator, screen: Screen, artwork: ReviewedSplash) {
  await expect(root).toHaveAttribute('data-reference-splash-ready', 'true', { timeout: 30_000 })
  await expect(root).toHaveAttribute('data-reference-splash-species', String(artwork.speciesId))
  await expect(root).toHaveAttribute('data-splash-frame-ready', 'true')
  await root.evaluate(async element => {
    await document.fonts.ready
    await Promise.all([...element.querySelectorAll('img')].map(image => image.decode()))
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  })
  // A live resize may still have its previous framing for one animation frame.
  // Wait for the projected source-image focus to fit the newly measured region.
  await expect.poll(async () => {
    const snapshot = await framingSnapshot(root, screen, artwork)
    return snapshot.focusInsideProtectedRegion && snapshot.overlaps.length === 0
  }, { message: `Form ${artwork.speciesId}: face and torso remain clear inside the actual gallery iframe` }).toBe(true)
  const snapshot = await framingSnapshot(root, screen, artwork)
  expect(snapshot.region, 'the runtime exposes a valid protected region in canvas pixels').not.toBeNull()
  expect(snapshot.focusInsideProtectedRegion, 'painted face and torso fit within the region after its safety margin').toBe(true)
  expect(snapshot.overlaps, 'the actual roster, dossier, headings and controls do not cover the critical artwork').toEqual([])
  expect(snapshot.background.image).toContain(artwork.src)
  expect(snapshot.layout.rootScrollWidth).toBeLessThanOrEqual(snapshot.layout.rootClientWidth + 2)
  expect(snapshot.layout.contentScrollWidth).toBeLessThanOrEqual(snapshot.layout.contentClientWidth + 2)
  return snapshot
}

for (const screen of ['squadra', 'arkadex'] as const) {
  for (const id of regressionIds) {
    test(`${screen}: form ${id} keeps its face clear in the real reference gallery`, async ({ page }, info) => {
      const errors: string[] = []
      page.on('pageerror', error => errors.push(error.message))
      const artwork = artworkFor(id)
      await page.goto(`/?uiReferences=1&screen=${screen}&splash=${id}`, { waitUntil: 'domcontentloaded' })
      const root = page.frameLocator('iframe').locator('.pu-shell[data-ui-concept="aurora"]')
      const snapshot = await expectResponsiveFrame(root, screen, artwork)
      const frame = await page.locator('iframe').boundingBox()
      expect(frame).not.toBeNull()
      expect(snapshot.shell.height, 'gallery chrome leaves less height than a fullscreen page').toBeLessThan(page.viewportSize()!.height - 100)
      expect(snapshot.shell.width).toBeLessThanOrEqual(frame!.width)
      const directory = resolve('output/splash-art/responsive-ui', info.project.name)
      await mkdir(directory, { recursive: true })
      const stem = `gallery-${String(id).padStart(3, '0')}-${screen}`
      await page.screenshot({ path: resolve(directory, `${stem}.png`), animations: 'disabled' })
      await writeFile(resolve(directory, `${stem}.json`), JSON.stringify(snapshot, null, 2) + '\n')
      await info.attach('responsive-gallery-framing', { body: JSON.stringify(snapshot), contentType: 'application/json' })
      expect(errors).toEqual([])
    })
  }

  test(`${screen}: resizing the same gallery recomputes the protected framing`, async ({ page }, info) => {
    const artwork = artworkFor(108)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(`/?uiReferences=1&screen=${screen}&splash=108`, { waitUntil: 'domcontentloaded' })
    const root = page.frameLocator('iframe').locator('.pu-shell[data-ui-concept="aurora"]')
    const records = []
    for (const viewport of [{ width: 1440, height: 900 }, { width: 1366, height: 768 }, { width: 1200, height: 800 }, { width: 1440, height: 900 }]) {
      await page.setViewportSize(viewport)
      const snapshot = await expectResponsiveFrame(root, screen, artwork)
      records.push({ viewport, ...snapshot })
    }
    expect(records[1].shell.height).toBeLessThan(records[0].shell.height)
    expect(records[1].rawRegion, 'the measured region follows the iframe size change').not.toBe(records[0].rawRegion)
    expect(records[3].shell.height).toBe(records[0].shell.height)
    expect(records[3].creature.x).toBeCloseTo(records[0].creature.x, 1)
    expect(records[3].creature.y).toBeCloseTo(records[0].creature.y, 1)
    const directory = resolve('output/splash-art/responsive-ui', info.project.name)
    await mkdir(directory, { recursive: true })
    await writeFile(resolve(directory, `live-resize-${screen}.json`), JSON.stringify(records, null, 2) + '\n')
    await info.attach('live-gallery-resize', { body: JSON.stringify(records), contentType: 'application/json' })
  })
}
