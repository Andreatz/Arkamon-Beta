import { afterEach, describe, expect, it } from 'vitest'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { packageWebAssets } from '../package-web-assets.mjs'

const directories = []
afterEach(async () => { await Promise.all(directories.splice(0).map(root => fs.rm(root, { recursive: true, force: true }))) })
async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'arkamon-package-')); directories.push(root)
  const output = path.join(root, 'dist')
  const write = async (file, content = 'fixture') => { await fs.mkdir(path.dirname(path.join(root, file)), { recursive: true }); await fs.writeFile(path.join(root, file), content) }
  const src = '/sprites/arkamon-paged/1/front/idle/page-00.webp'
  const page = { src, encodedBytes: 7, sha256: createHash('sha256').update('fixture').digest('hex') }
  const manifest = { clips: { a: { frameCount: 96, pages: [page] } } }
  await write('src/data/arkamon-paged.json', JSON.stringify(manifest))
  for (const file of ['public' + src, 'public/ui/button.svg', 'public/maps/world.jpg', 'public/sprites/small_sprites/Sprite Small 1.png', 'public/sprites/arkamon/1/front/idle-poster.webp', 'public/sprites/arkamon/1/front/idle.webp', 'public/sounds/sound.wav', 'public/vfx/move.webp']) await write(file)
  await write('dist/index.html', 'shell')
  return { root, output, manifest, write, args: { root, output, revision: 'a'.repeat(40), requireComplete: false } }
}
describe('bounded web asset packaging', () => {
  it('ships local UI and all portrait variants, externalizes heavy media and excludes source atlases', async () => {
    const f = await fixture(), proof = await packageWebAssets(f.args)
    expect(proof.localAssets.map(file => file.path)).toContain('sprites/arkamon/1/front/idle-poster.webp')
    expect(proof.externalAssets.map(file => file.path)).toHaveLength(3)
    expect(proof.sourceOnlyAssets.map(file => file.path)).toEqual(['sprites/arkamon/1/front/idle.webp'])
    await expect(fs.access(path.join(f.output, 'sprites/arkamon/1/front/idle.webp'))).rejects.toThrow()
    await expect(fs.access(path.join(f.output, 'sprites/small_sprites/Sprite Small 1.png'))).resolves.toBeUndefined()
    expect(JSON.parse(await fs.readFile(path.join(f.output, 'media-release.json'), 'utf8')).mediaRevision).toBe('a'.repeat(40))
  })
  it('refuses partial native manifests, mutable revisions and an oversized Pages package', async () => {
    const f = await fixture()
    await expect(packageWebAssets({ ...f.args, requireComplete: true })).rejects.toThrow('Native animation contract incomplete')
    await expect(packageWebAssets({ ...f.args, revision: 'main' })).rejects.toThrow('immutable')
    await expect(packageWebAssets({ ...f.args, maxBytes: 1 })).rejects.toThrow('exceeds')
  })
  it('verifies exact page names, sizes and SHA fingerprints before releasing', async () => {
    const f = await fixture()
    await f.write('public/sprites/arkamon-paged/1/front/idle/page-00.webp', 'changed')
    await expect(packageWebAssets(f.args)).rejects.toThrow('fingerprint')
    f.manifest.clips.a.pages[0].src = '/sprites/arkamon-paged/1/front/idle/Page-00.webp'
    await f.write('src/data/arkamon-paged.json', JSON.stringify(f.manifest))
    await expect(packageWebAssets(f.args)).rejects.toThrow('case mismatched')
  })
  it('rejects a manifest path outside the asset root', async () => {
    const f = await fixture(); f.manifest.clips.a.pages[0].src = '/../outside.webp'
    await f.write('src/data/arkamon-paged.json', JSON.stringify(f.manifest))
    await expect(packageWebAssets(f.args)).rejects.toThrow('Unsafe')
  })
})
