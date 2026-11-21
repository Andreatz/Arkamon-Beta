#!/usr/bin/env node
// Audit fase 9: rapporto non distruttivo sul peso del repository.
// Uso: node scripts/repo-weight-report.mjs [--ref HEAD] [--depth 3] [--top 25] [--json]
// Legge soltanto `git ls-tree -r -l` e `git count-objects -vH`: non modifica file né storia.
import { execFileSync } from 'node:child_process'

const args = process.argv.slice(2)
const option = (name, fallback) => { const index = args.indexOf(`--${name}`); return index >= 0 ? args[index + 1] : fallback }
const ref = option('ref', 'HEAD'), depth = Number(option('depth', '3')), top = Number(option('top', '25'))
const git = (...command) => execFileSync('git', command, { encoding: 'utf8', maxBuffer: 1 << 30 })

export function summarize(lines, groupDepth = 3) {
  const groups = new Map(), extensions = new Map(), blobs = new Map()
  let total = 0, files = 0
  for (const line of lines) {
    const match = /^\d+ blob ([0-9a-f]+)\s+(\d+)\t(.+)$/.exec(line)
    if (!match) continue
    const [, sha, sizeText, path] = match, size = Number(sizeText)
    total += size; files += 1
    const key = path.split('/').slice(0, path.startsWith('public/') ? groupDepth : Math.max(1, groupDepth - 1)).join('/')
    const group = groups.get(key) ?? { bytes: 0, files: 0 }; group.bytes += size; group.files += 1; groups.set(key, group)
    const extension = path.includes('.') ? path.slice(path.lastIndexOf('.') + 1).toLowerCase() : '(nessuna)'
    extensions.set(extension, (extensions.get(extension) ?? 0) + size)
    const blob = blobs.get(sha) ?? { size, paths: [] }; blob.paths.push(path); blobs.set(sha, blob)
  }
  const duplicateBytes = [...blobs.values()].reduce((sum, blob) => sum + blob.size * (blob.paths.length - 1), 0)
  return {
    total, files, duplicateBytes,
    groups: [...groups].map(([path, value]) => ({ path, ...value })).sort((a, b) => b.bytes - a.bytes),
    extensions: [...extensions].map(([extension, bytes]) => ({ extension, bytes })).sort((a, b) => b.bytes - a.bytes),
  }
}

const mb = bytes => `${(bytes / 1e6).toFixed(1)} MB`
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('repo-weight-report.mjs')) {
  const report = summarize(git('ls-tree', '-r', '-l', ref).split('\n'), depth)
  let packed = null
  try { packed = git('count-objects', '-vH').trim() } catch { /* fuori da un repository */ }
  if (args.includes('--json')) console.log(JSON.stringify({ ref, ...report, packed }, null, 2))
  else {
    console.log(`Albero ${ref}: ${report.files} file, ${mb(report.total)} (copie identiche nel checkout: ${mb(report.duplicateBytes)})`)
    for (const group of report.groups.slice(0, top)) console.log(`${mb(group.bytes).padStart(12)} ${String(group.files).padStart(6)}  ${group.path}`)
    console.log('\nPer estensione: ' + report.extensions.slice(0, 8).map((entry) => `${entry.extension} ${mb(entry.bytes)}`).join(' · '))
    if (packed) console.log('\n' + packed)
  }
}
