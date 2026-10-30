import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, mkdir, rm, readFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fingerprintRelease, NATIVE_RELEASE_PROOF, NATIVE_RELEASE_SCENARIOS, readPassingReport, sealRelease, verifyRelease } from '../release-verification.mjs'

function nativeReport(artifact) {
  return { stats: { expected: 6, unexpected: 0, flaky: 0, skipped: 0 }, suites: [{ specs: NATIVE_RELEASE_SCENARIOS.map(title => ({ title, tests: [{
    status: 'expected', expectedStatus: 'passed', results: [{ status: 'passed', attachments: [{ name: NATIVE_RELEASE_PROOF, contentType: 'application/json',
      body: Buffer.from(JSON.stringify({ version: 1, ...artifact, transport: 'verified-local-pinned-media', cdnAvailabilityVerified: false })).toString('base64') }] }],
  }] })) }] }
}

async function releaseFixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'arkamon-release-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const dist = path.join(root, 'dist'); await mkdir(dist)
  const media = { version: 1, mediaRevision: 'c'.repeat(40), manifestSha256: 'd'.repeat(64), nativeClips: 550, nativeFrames: 52_775 }
  await writeFile(path.join(dist, 'index.html'), '<html>verified application</html>')
  await writeFile(path.join(dist, 'media-release.json'), JSON.stringify(media))
  const unit = path.join(root, 'unit.json'), browser = path.join(root, 'browser.json'), compiled = path.join(root, 'compiled.json'), nativeCompiled = path.join(root, 'compiled-native.json')
  await writeFile(unit, JSON.stringify({ success: true, numFailedTests: 0, numPassedTests: 10 }))
  await writeFile(browser, JSON.stringify({ stats: { expected: 12, unexpected: 0, flaky: 0, skipped: 2 } }))
  await writeFile(compiled, JSON.stringify({ stats: { expected: 3, unexpected: 0, flaky: 0, skipped: 0 } }))
  const artifact = { contentSha256: (await fingerprintRelease(dist)).contentSha256, mediaRevision: media.mediaRevision, manifestSha256: media.manifestSha256, nativeClips: media.nativeClips, nativeFrames: media.nativeFrames }
  await writeFile(nativeCompiled, JSON.stringify(nativeReport(artifact)))
  return { dist, revision: 'a'.repeat(40), unit, browser, compiled, nativeCompiled, artifact }
}

test('the published artifact belongs to the checked revision and rejects changed or added bytes', async t => {
  const fixture = await releaseFixture(t), { dist, revision } = fixture
  const sealed = await sealRelease(fixture)
  const command = spawnSync(process.execPath, ['scripts/release-verification.mjs', 'seal', '--dist', dist, '--revision', revision,
    '--unit', fixture.unit, '--browser', fixture.browser, '--compiled', fixture.compiled, '--native-compiled', fixture.nativeCompiled], { encoding: 'utf8' })
  assert.equal(command.status, 0, command.stderr)
  assert.deepEqual((await verifyRelease(dist, revision)).files, sealed.files)
  assert.equal(sealed.version, 2)
  assert.equal(sealed.reports.find(report => report.kind === 'native-compiled').artifact.cdnAvailabilityVerified, false)
  await assert.rejects(verifyRelease(dist, 'b'.repeat(40)), /another revision/)
  await writeFile(path.join(dist, 'injected.js'), 'unverified')
  await assert.rejects(verifyRelease(dist, revision), /changed after verification/)
})

test('empty, failed, flaky, or skipped compiled suites cannot authorize publication', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'arkamon-release-report-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const file = path.join(root, 'report.json')
  for (const stats of [
    { expected: 0, unexpected: 0, flaky: 0, skipped: 4 },
    { expected: 3, unexpected: 1, flaky: 0, skipped: 0 },
    { expected: 3, unexpected: 0, flaky: 1, skipped: 0 },
    { expected: 3, unexpected: 0, flaky: 0, skipped: 1 },
  ]) { await writeFile(file, JSON.stringify({ stats })); await assert.rejects(readPassingReport(file, 'compiled')) }
  await writeFile(file, JSON.stringify({ success: false, numFailedTests: 1, numPassedTests: 10 }))
  await assert.rejects(readPassingReport(file, 'unit'))
})

test('a missing, partial, skipped or unbound native compiled group cannot seal a release', async t => {
  const fixture = await releaseFixture(t)
  await assert.rejects(sealRelease({ ...fixture, nativeCompiled: undefined }), /native verification report is required/)
  const passing = nativeReport(fixture.artifact)
  const invalid = [
    { ...passing, stats: { ...passing.stats, expected: 5 } },
    { ...passing, stats: { ...passing.stats, skipped: 1 } },
    { ...passing, suites: [] },
    nativeReport({ ...fixture.artifact, contentSha256: 'e'.repeat(64) }),
    nativeReport({ ...fixture.artifact, mediaRevision: 'f'.repeat(40) }),
    nativeReport({ ...fixture.artifact, manifestSha256: 'f'.repeat(64) }),
    nativeReport({ ...fixture.artifact, nativeClips: 455 }),
  ]
  const missingProof = structuredClone(passing); missingProof.suites[0].specs[0].tests[0].results[0].attachments = []
  const duplicate = structuredClone(passing); duplicate.suites[0].specs[1].title = duplicate.suites[0].specs[0].title
  const falsePass = structuredClone(passing); falsePass.suites[0].specs[0].tests[0].results[0].status = 'skipped'
  invalid.push(missingProof, duplicate, falsePass)
  for (const report of invalid) {
    await writeFile(fixture.nativeCompiled, JSON.stringify(report))
    await assert.rejects(sealRelease(fixture), /native|Compiled/)
  }
  await writeFile(fixture.nativeCompiled, JSON.stringify(passing))
  await writeFile(path.join(fixture.dist, 'index.html'), 'rebuilt after the native tests')
  await assert.rejects(sealRelease(fixture), /belongs to another artifact/)
})

test('verification rejects receipts from the old gate and receipts without native evidence', async t => {
  const fixture = await releaseFixture(t), { dist, revision } = fixture
  await sealRelease(fixture)
  const filename = path.join(dist, 'release-verification.json'), sealed = JSON.parse(await readFile(filename, 'utf8'))
  await writeFile(filename, JSON.stringify({ ...sealed, version: 1 }))
  await assert.rejects(verifyRelease(dist, revision), /obsolete verification contract/)
  await writeFile(filename, JSON.stringify({ ...sealed, reports: sealed.reports.filter(report => report.kind !== 'native-compiled') }))
  await assert.rejects(verifyRelease(dist, revision), /missing a required verification report/)
  const wrongCatalog = structuredClone(sealed)
  wrongCatalog.reports.find(report => report.kind === 'native-compiled').artifact.nativeClips = 455
  await writeFile(filename, JSON.stringify(wrongCatalog))
  await assert.rejects(verifyRelease(dist, revision), /no matching complete native catalog verification/)
})
