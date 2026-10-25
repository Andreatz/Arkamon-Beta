import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createHash } from 'node:crypto'
import sharp from 'sharp'
import { buildSplashArtworkCatalog } from '../catalog-splash-artwork.mjs'

const digest = data => createHash('sha256').update(data).digest('hex')
const bounds = { left: .38, top: .265, right: .64, bottom: .805 }

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'arkamon-splash-catalog-'))
  t.after(() => fs.rm(root, { recursive: true, force: true }))
  await fs.mkdir(path.join(root, 'art-source/splash/status'), { recursive: true })
  await fs.mkdir(path.join(root, 'public/backgrounds/arkamon-splash'), { recursive: true })
  const output = path.join(root, 'ui-source/splash-artwork.generated.json')
  async function writeStatus(record) {
    const file = path.join(root, 'art-source/splash/status', `${String(record.id).padStart(3, '0')}.json`)
    await fs.writeFile(file, JSON.stringify(record))
  }
  async function add({ id = 5, name = 'Darklaw', status = 'ui-validated-v2', width = 320, height = 180, ...overrides } = {}) {
    const outputFile = `public/backgrounds/arkamon-splash/${String(id).padStart(3, '0')}-${name.toLowerCase()}.webp`
    const bytes = await sharp({ create: { width, height, channels: 4, background: '#254a67' } }).webp().toBuffer()
    await fs.writeFile(path.join(root, outputFile), bytes)
    const record = { id, name, status, outputFile, runtimePath: `/${outputFile.slice(7)}`, sha256: digest(bytes), width, height, bytes: bytes.length, subjectBounds: bounds, ...overrides }
    await writeStatus(record)
    return record
  }
  return { root, output, add, writeStatus }
}

test('publishes only reviewed records in a minimal runtime catalog', async t => {
  const f = await fixture(t)
  await f.add()
  await f.add({ id: 1, name: 'Vyrath', status: 'generated-needs-ui-review' })
  // An unreviewed record is excluded before attempting to read its missing artwork.
  await f.writeStatus({ id: 9, name: 'Felyss', status: 'generated-needs-ui-review' })
  const result = await buildSplashArtworkCatalog({ root: f.root })
  assert.deepEqual(result.assets, [{ speciesId: 5, src: '/backgrounds/arkamon-splash/005-darklaw.webp', label: 'Illustrazione di Darklaw', objectPosition: '50% 50%', aspectRatio: '16 / 9', subjectBounds: bounds }])
  assert.equal(result.skipped.length, 2)
  assert.deepEqual(JSON.parse(await fs.readFile(f.output, 'utf8')), result.assets)
})

test('adds a form only after explicit visual approval and sorts by real ID', async t => {
  const f = await fixture(t)
  await f.add()
  const candidate = await f.add({ id: 1, name: 'Vyrath', status: 'generated-needs-ui-review' })
  assert.deepEqual((await buildSplashArtworkCatalog({ root: f.root })).assets.map(asset => asset.speciesId), [5])
  await f.writeStatus({ ...candidate, status: 'approved-visual' })
  assert.deepEqual((await buildSplashArtworkCatalog({ root: f.root })).assets.map(asset => asset.speciesId), [1, 5])
})

test('rejects artwork bytes changed after review without replacing the prior catalog', async t => {
  const f = await fixture(t), record = await f.add()
  await buildSplashArtworkCatalog({ root: f.root })
  const before = await fs.readFile(f.output)
  await fs.appendFile(path.join(f.root, record.outputFile), 'changed-after-review')
  await assert.rejects(buildSplashArtworkCatalog({ root: f.root }), /SHA256 differs/)
  assert.deepEqual(await fs.readFile(f.output), before)
})

test('requires a real decodable 16:9 file with matching reviewed dimensions', async t => {
  const f = await fixture(t)
  const wrongRatio = await f.add({ width: 320, height: 200 })
  await assert.rejects(buildSplashArtworkCatalog({ root: f.root }), /exact 16:9/)
  const correct = await f.add()
  await f.writeStatus({ ...correct, width: 640 })
  await assert.rejects(buildSplashArtworkCatalog({ root: f.root }), /dimensions differ/)
  await f.writeStatus({ ...wrongRatio, outputFile: correct.outputFile, sha256: correct.sha256, width: correct.width, height: correct.height, bytes: correct.bytes })
  await fs.unlink(path.join(f.root, correct.outputFile))
  await assert.rejects(buildSplashArtworkCatalog({ root: f.root }), /ENOENT/)
})

test('requires measured silhouette bounds inside the safe composition zone', async t => {
  const f = await fixture(t), record = await f.add()
  await f.writeStatus({ ...record, subjectBounds: undefined })
  await assert.rejects(buildSplashArtworkCatalog({ root: f.root }), /reviewed subjectBounds are required/)
  await f.writeStatus({ ...record, subjectBounds: { ...bounds, right: .8 } })
  await assert.rejects(buildSplashArtworkCatalog({ root: f.root }), /complete silhouette must fit/)
  await f.writeStatus({ ...record, subjectBounds: { ...bounds, left: .64 } })
  await assert.rejects(buildSplashArtworkCatalog({ root: f.root }), /nonempty silhouette/)
})

test('hero-focus publishes the real full silhouette and protects only the face and torso', async t => {
  const f = await fixture(t)
  await f.add()
  const subjectBounds = { left: .12, top: .08, right: .94, bottom: .98 }
  const focusBounds = { left: .4, top: .34, right: .58, bottom: .64 }
  await f.add({ id: 4, name: 'Vyrath', compositionPolicy: 'hero-focus', subjectBounds, focusBounds, displayScale: 1.4 })
  const { assets } = await buildSplashArtworkCatalog({ root: f.root })
  assert.deepEqual(assets.map(asset => asset.speciesId), [4, 5])
  assert.deepEqual(assets[0], { speciesId: 4, src: '/backgrounds/arkamon-splash/004-vyrath.webp', label: 'Illustrazione di Vyrath', objectPosition: '50% 50%', aspectRatio: '16 / 9', subjectBounds, compositionPolicy: 'hero-focus', focusBounds, displayScale: 1.4 })
  assert.equal(Object.hasOwn(assets[1], 'compositionPolicy'), false)
  assert.equal(Object.hasOwn(assets[1], 'focusBounds'), false)
})

test('hero-focus requires finite ordered focus bounds contained in the full silhouette', async t => {
  const f = await fixture(t)
  const record = await f.add({ compositionPolicy: 'hero-focus', subjectBounds: { left: .2, top: .1, right: .85, bottom: .95 } })
  await assert.rejects(buildSplashArtworkCatalog({ root: f.root }), /reviewed focusBounds are required/)
  await f.writeStatus({ ...record, focusBounds: { left: .35, top: .3, right: null, bottom: .7 } })
  await assert.rejects(buildSplashArtworkCatalog({ root: f.root }), /focusBounds must contain four finite/)
  await f.writeStatus({ ...record, focusBounds: { left: .6, top: .3, right: .5, bottom: .7 } })
  await assert.rejects(buildSplashArtworkCatalog({ root: f.root }), /nonempty rectangle/)
  await f.writeStatus({ ...record, subjectBounds: { left: .4, top: .3, right: .6, bottom: .7 }, focusBounds: { left: .35, top: .3, right: .62, bottom: .7 } })
  await assert.rejects(buildSplashArtworkCatalog({ root: f.root }), /contained in the full subjectBounds/)
})

test('hero-focus accepts the focus boundary and rejects each side outside its safe area', async t => {
  const f = await fixture(t)
  const focusBounds = { left: .31, top: .23, right: .65, bottom: .8 }
  const record = await f.add({ compositionPolicy: 'hero-focus', subjectBounds: { left: 0, top: 0, right: 1, bottom: 1 }, focusBounds })
  assert.deepEqual((await buildSplashArtworkCatalog({ root: f.root })).assets[0].focusBounds, focusBounds)
  for (const outside of [{ left: .30 }, { top: .22 }, { right: .66 }, { bottom: .81 }]) {
    await f.writeStatus({ ...record, focusBounds: { ...focusBounds, ...outside } })
    await assert.rejects(buildSplashArtworkCatalog({ root: f.root }), /critical face and torso must fit/)
  }
})

test('hero-focus still requires the full real silhouette inside the canvas', async t => {
  const f = await fixture(t)
  const record = await f.add({ compositionPolicy: 'hero-focus', subjectBounds: { left: -.01, top: .1, right: .9, bottom: .95 }, focusBounds: { left: .35, top: .3, right: .6, bottom: .7 } })
  await assert.rejects(buildSplashArtworkCatalog({ root: f.root }), /subjectBounds must remain inside/)
  await f.writeStatus({ ...record, subjectBounds: { left: .1, top: .1, right: 1.01, bottom: .95 } })
  await assert.rejects(buildSplashArtworkCatalog({ root: f.root }), /subjectBounds must remain inside/)
})

test('displayScale is optional with default1 and accepts only finite values from0.5 to2.5', async t => {
  const f = await fixture(t)
  const record = await f.add({ compositionPolicy: 'hero-focus', focusBounds: { left: .46, top: .45, right: .54, bottom: .55 } })
  const defaultAsset = (await buildSplashArtworkCatalog({ root: f.root })).assets[0]
  assert.equal(Object.hasOwn(defaultAsset, 'displayScale'), false)
  assert.equal(Object.hasOwn(defaultAsset, 'displayOffset'), false)
  assert.equal(defaultAsset.displayScale ?? 1, 1)
  for (const displayScale of [.5, .99, 1, 2.5]) {
    await f.writeStatus({ ...record, displayScale })
    assert.equal((await buildSplashArtworkCatalog({ root: f.root })).assets[0].displayScale, displayScale)
  }
  for (const displayScale of [0, .49, -1, 2.51, Infinity, '1.4', null]) {
    await f.writeStatus({ ...record, displayScale })
    await assert.rejects(buildSplashArtworkCatalog({ root: f.root }), /displayScale must be a finite number/)
  }
})

test('shrinking a large full face preserves its measured bounds and still enforces the projected safe area', async t => {
  const f = await fixture(t)
  const subjectBounds = { left: .1, top: .05, right: .9, bottom: .95 }
  const focusBounds = { left: .2, top: .08, right: .8, bottom: .92 }
  const record = await f.add({ compositionPolicy: 'hero-focus', subjectBounds, focusBounds })
  await assert.rejects(buildSplashArtworkCatalog({ root: f.root }), /projected critical face and torso must fit/)
  await f.writeStatus({ ...record, displayScale: .5 })
  const asset = (await buildSplashArtworkCatalog({ root: f.root })).assets[0]
  assert.equal(asset.displayScale, .5)
  assert.deepEqual(asset.subjectBounds, subjectBounds)
  assert.deepEqual(asset.focusBounds, focusBounds)
  // A valid scale cannot authorize shifting the now-visible face behind a panel.
  await f.writeStatus({ ...record, displayScale: .5, displayOffset: { x: .04, y: 0 } })
  await assert.rejects(buildSplashArtworkCatalog({ root: f.root }), /projected critical face and torso must fit/)
})

test('displayOffset repositions the projected face and torso without changing the measured source bounds', async t => {
  const f = await fixture(t)
  const subjectBounds = { left: .1, top: .1, right: .95, bottom: .99 }
  const focusBounds = { left: .44, top: .6, right: .56, bottom: .79 }
  const record = await f.add({ compositionPolicy: 'hero-focus', subjectBounds, focusBounds, displayScale: 1.6 })
  // Without the upward offset the projected torso extends to y.964, behind the UI.
  await assert.rejects(buildSplashArtworkCatalog({ root: f.root }), /projected critical face and torso must fit/)
  await f.writeStatus({ ...record, displayOffset: { x: -.02, y: -.2 } })
  const asset = (await buildSplashArtworkCatalog({ root: f.root })).assets[0]
  assert.deepEqual(asset.subjectBounds, subjectBounds)
  assert.deepEqual(asset.focusBounds, focusBounds)
  assert.equal(asset.displayScale, 1.6)
  assert.deepEqual(asset.displayOffset, { x: -.02, y: -.2 })
  await f.writeStatus({ ...record, displayOffset: { x: .2, y: -.2 } })
  await assert.rejects(buildSplashArtworkCatalog({ root: f.root }), /projected critical face and torso must fit/)
})

test('hero-focus evaluates the projected focus rather than imposing the destination safe zone on source coordinates', async t => {
  const f = await fixture(t)
  const focusBounds = { left: .2, top: .25, right: .4, bottom: .6 }
  await f.add({ compositionPolicy: 'hero-focus', subjectBounds: { left: .1, top: .1, right: .8, bottom: .9 }, focusBounds, displayOffset: { x: .15, y: 0 } })
  const asset = (await buildSplashArtworkCatalog({ root: f.root })).assets[0]
  assert.deepEqual(asset.focusBounds, focusBounds)
  assert.deepEqual(asset.displayOffset, { x: .15, y: 0 })
  assert.equal(Object.hasOwn(asset, 'displayScale'), false)
})

test('displayOffset requires both finite axes in range and rejects malformed offsets', async t => {
  const f = await fixture(t)
  const record = await f.add({ compositionPolicy: 'hero-focus', focusBounds: { left: .46, top: .45, right: .54, bottom: .55 } })
  for (const displayOffset of [{ x: -.301, y: 0 }, { x: 0, y: .301 }, { x: 0 }, { x: '0', y: 0 }, { x: Infinity, y: 0 }, null, [0, 0]]) {
    await f.writeStatus({ ...record, displayOffset })
    await assert.rejects(buildSplashArtworkCatalog({ root: f.root }), /displayOffset must contain finite x and y/)
  }
  // The maximum allowed translation is accepted when it puts the focus in the safe area.
  const focusBounds = { left: .04, top: .04, right: .05, bottom: .05 }
  await f.writeStatus({ ...record, subjectBounds: { left: 0, top: 0, right: .9, bottom: .9 }, focusBounds, displayOffset: { x: .3, y: .3 } })
  assert.deepEqual((await buildSplashArtworkCatalog({ root: f.root })).assets[0].displayOffset, { x: .3, y: .3 })
})

test('legacy records retain complete-silhouette protection when an optional display transform is added', async t => {
  const f = await fixture(t), record = await f.add()
  await f.writeStatus({ ...record, displayScale: 2 })
  await assert.rejects(buildSplashArtworkCatalog({ root: f.root }), /display transform moves the complete silhouette outside/)
})

test('an absent or mistyped composition policy cannot bypass the legacy silhouette rule', async t => {
  const f = await fixture(t)
  const record = await f.add({ subjectBounds: { left: .1, top: .1, right: .9, bottom: .95 }, focusBounds: { left: .35, top: .3, right: .6, bottom: .7 } })
  await assert.rejects(buildSplashArtworkCatalog({ root: f.root }), /complete silhouette must fit/)
  await f.writeStatus({ ...record, compositionPolicy: 'hero-foucs' })
  await assert.rejects(buildSplashArtworkCatalog({ root: f.root }), /unsupported compositionPolicy/)
})

test('rejects out-of-catalog IDs and mismatched or escaped runtime paths', async t => {
  const f = await fixture(t), record = await f.add()
  await f.writeStatus({ ...record, outputFile: '../unreviewed.webp' })
  await assert.rejects(buildSplashArtworkCatalog({ root: f.root }), /local splash WebP/)
  await f.writeStatus({ ...record, runtimePath: '/backgrounds/arkamon-splash/001-vyrath.webp' })
  await assert.rejects(buildSplashArtworkCatalog({ root: f.root }), /runtimePath must match/)
  await f.writeStatus({ ...record, status: 'generated-needs-ui-review' })
  await f.writeStatus({ ...record, id: 111 })
  await assert.rejects(buildSplashArtworkCatalog({ root: f.root }), /playable catalog form/)
})

test('writes a stable catalog and check mode detects stale output without editing it', async t => {
  const f = await fixture(t)
  await f.add()
  await buildSplashArtworkCatalog({ root: f.root })
  const first = await fs.readFile(f.output, 'utf8')
  await buildSplashArtworkCatalog({ root: f.root })
  assert.equal(await fs.readFile(f.output, 'utf8'), first)
  await buildSplashArtworkCatalog({ root: f.root, check: true })
  await fs.writeFile(f.output, '[]\n')
  await assert.rejects(buildSplashArtworkCatalog({ root: f.root, check: true }), /catalog is stale/)
  assert.equal(await fs.readFile(f.output, 'utf8'), '[]\n')
})
