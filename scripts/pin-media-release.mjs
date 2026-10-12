import fs from 'node:fs/promises'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'

// Run only after committing all generated pages. CI can validate the canonical
// manifest fingerprint without fetching the whole binary Git history.
const root = process.cwd()
const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
const source = JSON.parse(await fs.readFile(path.join(root, 'src/data/arkamon-paged.json'), 'utf8'))
const committed = JSON.parse(execFileSync('git', ['show', `${revision}:src/data/arkamon-paged.json`], { cwd: root, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 }))
if (JSON.stringify(source) !== JSON.stringify(committed)) throw new Error('Commit the complete native manifest and its pages before pinning a media release')
const manifestSha256 = createHash('sha256').update(JSON.stringify(source)).digest('hex')
await fs.writeFile(path.join(root, 'src/data/media-release.json'), JSON.stringify({ version: 1, revision, manifestSha256 }, null, 2) + '\n')
console.log(`Media release pinned: ${revision}, manifest ${manifestSha256}`)
