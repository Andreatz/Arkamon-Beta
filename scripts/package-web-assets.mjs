import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { validateNativeManifestCompleteness } from './native-manifest-completeness.mjs'

export const MAX_WEB_BYTES = 900 * 1024 * 1024
export const STATIC_DIRS = ['ui', 'maps', 'backgrounds', 'assets', 'sprites/front_sprites', 'sprites/back_sprites', 'sprites/small_sprites', 'audio', 'audio-lab']
export function assertPinnedMediaRevision(revision, pinned) {
  if (!/^[a-f0-9]{40}$/.test(revision ?? '')) throw new Error('A complete immutable Git media revision is required')
  if (pinned?.version !== 1 || !/^[a-f0-9]{40}$/.test(pinned.revision ?? '')) throw new Error('A valid immutable media release pin is required')
  if (revision !== pinned.revision) throw new Error('Requested media revision differs from the pinned media release. Remove the stale VITE_MEDIA_REVISION override or repin the matching media.')
  return revision
}
const safeRelative = value => {
  if (typeof value !== 'string' || !value || value.includes('\\') || value.split('/').some(p => !p || p === '.' || p === '..') || path.isAbsolute(value)) throw new Error('Unsafe asset path')
  return value
}
export async function listFiles(root, relative = '') {
  const files = []
  for (const entry of await fs.readdir(path.join(root, relative), { withFileTypes: true })) {
    const next = relative ? `${relative}/${entry.name}` : entry.name
    if (entry.isSymbolicLink()) throw new Error(`Asset symlink is not supported: ${next}`)
    if (entry.isDirectory()) files.push(...await listFiles(root, next))
    else files.push(next)
  }
  return files
}
export async function packageWebAssets({ root, output, revision, requireComplete = true, maxBytes = MAX_WEB_BYTES, staticOutput = output }) {
  if (!/^[a-f0-9]{40}$/.test(revision)) throw new Error('A complete immutable Git media revision is required')
  const publicRoot = path.join(root, 'public')
  const manifest = JSON.parse(await fs.readFile(path.join(root, 'src/data/arkamon-paged.json'), 'utf8'))
  const clips = Object.values(manifest.clips ?? {})
  if (requireComplete) await validateNativeManifestCompleteness({ root, manifest })
  if (requireComplete) {
    const pinned = JSON.parse(await fs.readFile(path.join(root, 'src/data/media-release.json'), 'utf8'))
    assertPinnedMediaRevision(revision, pinned)
    const fingerprint = createHash('sha256').update(JSON.stringify(manifest)).digest('hex')
    if (pinned.version !== 1 || fingerprint !== pinned.manifestSha256) throw new Error('Native manifest differs from the pinned media release. Commit and repin the generated pages.')
  }
  const records = [], locals = [], excluded = []
  for (const relative of await listFiles(publicRoot)) {
    safeRelative(relative)
    const file = path.join(publicRoot, relative), stat = await fs.stat(file)
    const local = relative === '.nojekyll' || STATIC_DIRS.some(dir => relative.startsWith(dir + '/'))
      || (relative.startsWith('sprites/arkamon/') && relative.endsWith('/idle-poster.webp'))
    if (local) {
      const destination = path.join(staticOutput, relative)
      await fs.mkdir(path.dirname(destination), { recursive: true })
      await fs.copyFile(file, destination)
      locals.push({ path: relative, bytes: stat.size })
    } else if (relative.startsWith('sprites/arkamon-paged/') || relative.startsWith('sounds/') || relative.startsWith('vfx/')) {
      records.push({ path: relative, bytes: stat.size })
    } else excluded.push({ path: relative, bytes: stat.size })
  }
  const actualPaths = new Set(records.map(entry => entry.path))
  for (const clip of clips) for (const page of clip.pages) {
    const relative = safeRelative(page.src.replace(/^\//, ''))
    if (!actualPaths.has(relative)) throw new Error(`Missing/case mismatched native page: ${relative}`)
    const data = await fs.readFile(path.join(publicRoot, relative))
    if (data.length !== page.encodedBytes || createHash('sha256').update(data).digest('hex') !== page.sha256) throw new Error(`Page fingerprint mismatch: ${relative}`)
  }
  const proof = { version: 1, mediaRevision: revision, manifestSha256: createHash('sha256').update(JSON.stringify(manifest)).digest('hex'),
    nativeClips: clips.length, nativeFrames: clips.reduce((sum, clip) => sum + clip.frameCount, 0),
    mediaBase: `https://raw.githubusercontent.com/Andreatz/Arkamon-Beta/${revision}/public/`, localAssets: locals, externalAssets: records, sourceOnlyAssets: excluded }
  await fs.writeFile(path.join(output, 'media-release.json'), JSON.stringify(proof, null, 2))
  const built = await listFiles(output)
  let bytes = (await Promise.all(built.map(file => fs.stat(path.join(output, file))))).reduce((sum, stat) => sum + stat.size, 0)
  if (path.resolve(staticOutput) !== path.resolve(output)) bytes += locals.reduce((sum, entry) => sum + entry.bytes, 0)
  if (bytes > maxBytes) throw new Error(`Web package exceeds ${maxBytes} bytes: ${bytes}`)
  console.log(`Web assets verified: ${clips.length} native clips, ${(bytes / 1024 / 1024).toFixed(1)} MiB local package; heavy media pinned to ${revision}`)
  return { ...proof, webBytes: bytes, maxWebBytes: maxBytes }
}

export function webAssetsPlugin(root, revision, afterPackage, staticOutput) {
  let output
  return { name: 'arkamon-web-asset-package', apply: 'build', configResolved(config) { output = path.resolve(root, config.build.outDir) },
    async closeBundle() { await packageWebAssets({ root, output, revision, staticOutput }); await afterPackage?.(output) } }
}
