import fs from 'node:fs/promises'
import path from 'node:path'

const MODULE_ID = 'virtual:arkamon-runtime-pages'
const RESOLVED_ID = '\0' + MODULE_ID

/**
 * The provenance manifest remains authoritative for packaging and pixel checks.
 * The browser needs only frame geometry. Tuples remove repeated property names
 * and page directory prefixes; decoded page objects are created on first use.
 * This changes no media, source frames, source contract or atlas format.
 */
export function packNativeRuntimeManifest(manifest) {
  if (manifest?.schemaVersion !== 1 || !manifest.clips || typeof manifest.clips !== 'object') throw new Error('Unsupported native page manifest')
  return Object.fromEntries(Object.entries(manifest.clips).map(([source, clip]) => {
    if (!/^\/sprites\/arkamon\/\d+\/(front|back)\/(idle|attack|hit|victory|ko)\.webp$/.test(source)) throw new Error(`Invalid native clip identity: ${source}`)
    const directory = source.replace('/sprites/arkamon/', '/sprites/arkamon-paged/').replace(/\.webp$/, '/')
    const pages = clip.pages.map(page => {
      const file = page.src.slice(directory.length)
      if (!page.src.startsWith(directory) || !/^page-\d+(?:-[a-f0-9]{16})?\.(webp|png)$/.test(file)) throw new Error(`Native page belongs to another clip: ${page.src}`)
      return [file, page.firstFrame, page.frameCount, page.columns, page.rows, page.width, page.height, page.decodedBytes]
    })
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
