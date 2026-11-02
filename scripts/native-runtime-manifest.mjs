import fs from 'node:fs/promises'
import path from 'node:path'

const MODULE_ID = 'virtual:arkamon-runtime-pages'
const RESOLVED_ID = '\0' + MODULE_ID

/**
 * The provenance manifest remains authoritative for packaging and pixel checks.
 * The browser needs only frame geometry. Tuples remove repeated property names
 * and derives repeated page geometry and filename prefixes/extensions. Decoded
 * page objects are created on first use, preserving the original runtime URLs.
 * This changes no media, source frames, source contract or atlas format.
 */
export function packNativeRuntimeManifest(manifest) {
  if (manifest?.schemaVersion !== 1 || !manifest.clips || typeof manifest.clips !== 'object') throw new Error('Unsupported native page manifest')
  return Object.fromEntries(Object.entries(manifest.clips).map(([source, clip]) => {
    if (!/^\/sprites\/arkamon\/\d+\/(front|back)\/(idle|attack|hit|victory|ko)\.webp$/.test(source)) throw new Error(`Invalid native clip identity: ${source}`)
    const directory = source.replace('/sprites/arkamon/', '/sprites/arkamon-paged/').replace(/\.webp$/, '/')
    let firstFrame = 0
    const pages = clip.pages.map((page, index) => {
      const file = page.src.slice(directory.length)
      const match = /^page-(\d+)(?:-([a-f0-9]{16}))?\.(webp|png)$/.exec(file)
      if (!page.src.startsWith(directory) || !match) throw new Error(`Native page belongs to another clip: ${page.src}`)
      if (match[1] !== String(index).padStart(2, '0')) throw new Error(`Native page index differs from its filename: ${page.src}`)
      const rows = Math.ceil(page.frameCount / page.columns), width = page.columns * clip.frameWidth, height = rows * clip.frameHeight
      if (!Number.isSafeInteger(page.columns) || page.columns < 1 || !Number.isSafeInteger(page.frameCount) || page.frameCount < 1
        || page.firstFrame !== firstFrame || page.rows !== rows || page.width !== width || page.height !== height
        || page.decodedBytes !== width * height * 4) throw new Error(`Native page geometry cannot be derived without changes: ${page.src}`)
      firstFrame += page.frameCount
      return [(match[2] ?? '') + (match[3] === 'png' ? '.png' : ''), page.frameCount, page.columns]
    })
    if (firstFrame !== clip.frameCount) throw new Error(`Native pages do not cover the complete clip: ${source}`)
    return [source, [clip.frameWidth, clip.frameHeight, clip.frameCount, clip.fps, pages]]
  }))
}

/** Build-time projection prevents hashes and other verification-only data from entering JS. */
export function nativeRuntimeManifestPlugin(root) {
  const manifestPath = path.resolve(root, 'src/data/arkamon-paged.json')
  return {
    name: 'arkamon-runtime-page-metadata',
    resolveId(id) { if (id === MODULE_ID) return RESOLVED_ID },
    async load(id) {
      if (id !== RESOLVED_ID) return
      this.addWatchFile(manifestPath)
      const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'))
      return `export default ${JSON.stringify(packNativeRuntimeManifest(manifest))};`
    },
  }
}
