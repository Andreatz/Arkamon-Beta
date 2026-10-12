import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import sharp from 'sharp'
import { copyNativeFramesToPage, getNativePageGrid, hasSameVisibleRgba, MAX_PAGE_DECODED_BYTES } from './arkamon-page-packing.mjs'

const repository = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const arg = key => { const index = process.argv.indexOf(key); return index < 0 ? undefined : process.argv[index + 1] }
const output = path.resolve(arg('--output') ?? path.join(repository, 'public/sprites/arkamon-paged'))
const manifestPath = path.resolve(arg('--manifest') ?? path.join(repository, 'src/data/arkamon-paged.json'))
const reportPath = path.resolve(arg('--report') ?? path.join(repository, 'docs/arkamon-pages-verification.json'))
const speciesFilter = arg('--species')?.split(',')
const actions = arg('--actions')?.split(',') ?? ['idle', 'attack', 'hit', 'victory', 'ko']
const effort = Number(arg('--effort') ?? 4)
const resume = process.argv.includes('--resume')
if (!Number.isInteger(effort) || effort < 0 || effort > 6) throw new Error('Invalid WebP compression effort')
const sha256 = data => createHash('sha256').update(data).digest('hex')
sharp.cache(false)
sharp.concurrency(1)

await fs.mkdir(output, { recursive: true })
const manifest = { schemaVersion: 1, maxPageDecodedBytes: MAX_PAGE_DECODED_BYTES, clips: {} }
const report = { generatedAt: new Date().toISOString(), sharp: sharp.versions, clips: [], frames: 0, pageCount: 0, sourceEncodedBytes: 0, runtimeEncodedBytes: 0, maxPageDecodedBytes: 0, allVisibleRgbaPixelsAndAlphaPreserved: true }
async function saveProgress() {
  for (const [destination, value] of [[manifestPath, manifest], [reportPath, report]]) {
    await fs.mkdir(path.dirname(destination), { recursive: true })
    const temporary = destination + '.tmp'
    await fs.writeFile(temporary, JSON.stringify(value, null, 2) + '\n')
    await fs.rename(temporary, destination)
  }
}
const sourceRoot = path.join(repository, 'public/sprites/arkamon')
for (const species of (await fs.readdir(sourceRoot)).filter(id => /^\d+$/.test(id)).sort((a, b) => Number(a) - Number(b))) {
  if (speciesFilter && !speciesFilter.includes(species)) continue
  for (const action of actions) {
    const source = path.join(sourceRoot, species, 'front', `${action}.webp`)
    const metadata = JSON.parse(await fs.readFile(source.replace(/\.webp$/, '.metadata.json'), 'utf8'))
    const sheet = metadata.sheet
    const encodedSource = await fs.readFile(source)
    if (sha256(encodedSource) !== sheet.sha256) throw new Error(`Source fingerprint mismatch: ${source}`)
    const { data, info } = await sharp(encodedSource).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    if (info.channels !== 4 || info.width !== sheet.width || info.height !== sheet.height) throw new Error(`Invalid source pixels: ${source}`)
    const geometry = { frameWidth: sheet.cellWidth, frameHeight: sheet.cellHeight, columns: sheet.columns, width: info.width }
    const grid = getNativePageGrid(sheet.cellWidth, sheet.cellHeight)
    const pages = []
    const clipDir = path.join(output, species, 'front', action)
    await fs.mkdir(clipDir, { recursive: true })
    for (let firstFrame = 0; firstFrame < sheet.frameCount; firstFrame += grid.framesPerPage) {
      const count = Math.min(grid.framesPerPage, sheet.frameCount - firstFrame)
      const pageGrid = { ...grid, rows: Math.ceil(count / grid.columns) }
      const page = copyNativeFramesToPage(data, geometry, firstFrame, count, pageGrid)
      const pixelsHash = sha256(page.pixels)
      let format = 'webp'
      let encoded
      if (resume) {
        for (const candidate of ['webp', 'png']) {
          try { const saved = await fs.readFile(path.join(clipDir, `page-${String(pages.length).padStart(2, '0')}.${candidate}`));
            if (hasSameVisibleRgba(await sharp(saved).ensureAlpha().raw().toBuffer(), page.pixels)) { encoded = saved; format = candidate; break }
          } catch { /* Only verified existing pages can be reused. */ }
        }
      }
      encoded ??= await sharp(page.pixels, { raw: { width: page.width, height: page.height, channels: 4 } }).webp({ lossless: true, effort }).toBuffer()
      let decoded = await sharp(encoded).ensureAlpha().raw().toBuffer()
      // RGB under alpha zero is not displayed. Preserve every visible byte and all alpha values.
      if (!hasSameVisibleRgba(decoded, page.pixels)) {
        format = 'png'
        encoded = await sharp(page.pixels, { raw: { width: page.width, height: page.height, channels: 4 } }).png().toBuffer()
        decoded = await sharp(encoded).ensureAlpha().raw().toBuffer()
      }
      if (!hasSameVisibleRgba(decoded, page.pixels)) throw new Error(`Visible RGBA/alpha equality failed: ${species}/${action}/${firstFrame}`)
      const fileName = `page-${String(pages.length).padStart(2, '0')}.${format}`
      await fs.writeFile(path.join(clipDir, fileName), encoded)
      const runtimeSrc = `/sprites/arkamon-paged/${species}/front/${action}/${fileName}`
      pages.push({ src: runtimeSrc, firstFrame, frameCount: count, columns: grid.columns, rows: pageGrid.rows, width: page.width, height: page.height,
        decodedBytes: page.pixels.length, encodedBytes: encoded.length, sha256: sha256(encoded), sourceRgbaSha256: pixelsHash, decodedRgbaSha256: sha256(decoded) })
      report.runtimeEncodedBytes += encoded.length
      report.maxPageDecodedBytes = Math.max(report.maxPageDecodedBytes, page.pixels.length)
    }
    const key = `/sprites/arkamon/${species}/front/${action}.webp`
    manifest.clips[key] = { speciesId: Number(species), side: 'front', animation: action, originalSrc: key, sourceSha256: sheet.sha256,
      frameWidth: sheet.cellWidth, frameHeight: sheet.cellHeight, frameCount: sheet.frameCount, fps: sheet.fps, viewport: sheet.viewport ?? metadata.viewport, pages }
    report.frames += sheet.frameCount; report.pageCount += pages.length; report.sourceEncodedBytes += encodedSource.length
    report.clips.push({ source: key, sourceSha256: sheet.sha256, frames: sheet.frameCount, pages: pages.length, runtimeEncodedBytes: pages.reduce((sum, page) => sum + page.encodedBytes, 0), allVisibleRgbaPixelsAndAlphaPreserved: true })
    await saveProgress()
    console.log(`${species}/${action}: ${sheet.frameCount} frames → ${pages.length} pages, ${(grid.decodedBytes / 1024 / 1024).toFixed(2)} MiB/page`)
  }
}
await saveProgress()
console.log(JSON.stringify({ clips: report.clips.length, frames: report.frames, pageCount: report.pageCount, sourceEncodedBytes: report.sourceEncodedBytes,
  runtimeEncodedBytes: report.runtimeEncodedBytes, maxPageDecodedBytes: report.maxPageDecodedBytes, allVisibleRgbaPixelsAndAlphaPreserved: report.allVisibleRgbaPixelsAndAlphaPreserved }))
