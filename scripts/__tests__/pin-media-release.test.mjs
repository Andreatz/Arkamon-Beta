import { afterEach, describe, expect, it } from 'vitest'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createHash } from 'node:crypto'

const run = promisify(execFile)
const script = fileURLToPath(new URL('../pin-media-release.mjs', import.meta.url))
const temporaryRoots = []
afterEach(async () => {
  for (const folder of temporaryRoots.splice(0)) {
    const target = path.resolve(folder)
    if (!target.startsWith(path.resolve(os.tmpdir()) + path.sep) || !path.basename(target).startsWith('arkamon-pin-test-')) throw new Error('Refusing to remove an unrelated folder')
    await fs.rm(target, { recursive: true, force: true })
  }
})

async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'arkamon-pin-test-'))
  temporaryRoots.push(root)
  await fs.mkdir(path.join(root, 'src/data'), { recursive: true })
  // A real Git stdout read larger than the previous 4 MiB buffer, without
  // decoding media or manufacturing a second production animation catalog.
  const manifest = { schemaVersion: 1, clips: {}, notes: 'x'.repeat(5 * 1024 * 1024) }
  const file = path.join(root, 'src/data/arkamon-paged.json')
  await fs.writeFile(file, JSON.stringify(manifest) + '\n')
  await run('git', ['-c', 'init.defaultBranch=main', 'init', '--quiet'], { cwd: root })
  await run('git', ['add', 'src/data/arkamon-paged.json'], { cwd: root })
  await run('git', ['-c', 'user.name=Arkamon pin test', '-c', 'user.email=pin-test@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '--quiet', '-m', 'Committed media manifest fixture'], { cwd: root })
  const revision = (await run('git', ['rev-parse', 'HEAD'], { cwd: root })).stdout.trim()
  return { root, manifest, file, revision, pin: path.join(root, 'src/data/media-release.json') }
}

describe('pinning the complete committed media manifest', () => {
  it('reads a committed manifest over 4 MiB and pins its exact Git revision and canonical fingerprint', async () => {
    const f = await fixture()
    expect((await fs.stat(f.file)).size).toBeGreaterThan(4 * 1024 * 1024)
    await run(process.execPath, [script], { cwd: f.root })
    expect(JSON.parse(await fs.readFile(f.pin, 'utf8'))).toEqual({ version: 1, revision: f.revision,
      manifestSha256: createHash('sha256').update(JSON.stringify(f.manifest)).digest('hex') })
  }, 15_000)

  it('rejects an uncommitted change even when the complete manifest exceeds the old buffer', async () => {
    const f = await fixture()
    await fs.writeFile(f.file, JSON.stringify({ ...f.manifest, notes: f.manifest.notes + 'dirty' }) + '\n')
    await expect(run(process.execPath, [script], { cwd: f.root })).rejects.toThrow('Commit the complete native manifest and its pages before pinning a media release')
    await expect(fs.access(f.pin)).rejects.toMatchObject({ code: 'ENOENT' })
  }, 15_000)
})
