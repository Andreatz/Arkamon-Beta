#!/usr/bin/env node
/**
 * Importa le illustrazioni di gioco in public/ui/game-art e aggiorna src/data/gameArt.json.
 *
 *   node scripts/assets/import-game-art.mjs --reference [--max 720] menu-map-art:menu-map coin ...
 *     converte asset già presenti in public/ui/reference-assets (id[:nuovo-id]), lato massimo 720 px;
 *   node scripts/assets/import-game-art.mjs --inbox asset-inbox/lotto-1
 *     elabora i PNG consegnati secondo ui-source/game-art-inbox.json: toglie il fondo
 *     magenta, ritaglia i margini trasparenti, taglia le griglie, ridimensiona, salva WebP.
 *
 * I file sconosciuti vengono segnalati e ignorati; un file mancante non blocca gli altri.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { gridCells, hasMagentaCorners, keyOutMagenta, mergeCatalog, safeArtId } from './gameArtImport.mjs'

const require = createRequire(import.meta.url)
const sharp = require('sharp')
const root = process.cwd()
const output = path.join(root, 'public/ui/game-art')
const catalogPath = path.join(root, 'src/data/gameArt.json')
const specPath = path.join(root, 'ui-source/game-art-inbox.json')

async function writeArt(id, image, { maxSide = 1400, trim = true } = {}) {
  safeArtId(id)
  let pipeline = sharp(image.data, { raw: image.info })
  if (trim) pipeline = sharp(await pipeline.png().toBuffer()).trim({ threshold: 1 })
  const buffer = await pipeline.png().toBuffer()
  let result = sharp(buffer)
  const meta = await result.metadata()
  if (Math.max(meta.width, meta.height) > maxSide) result = result.resize({ width: meta.width >= meta.height ? maxSide : undefined, height: meta.height > meta.width ? maxSide : undefined })
  const file = `${id}.webp`
  const info = await result.webp({ quality: 90, alphaQuality: 100, effort: 5 }).toFile(path.join(output, file))
  return { id, file, width: info.width, height: info.height }
}

async function loadRaw(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return { data, info: { width: info.width, height: info.height, channels: 4 } }
}

async function fromReference(args) {
  const entries = []
  const maxIndex = args.indexOf('--max')
  const referenceMaxSide = maxIndex >= 0 ? Number(args.splice(maxIndex, 2)[1]) : 720
  for (const arg of args) {
    const [source, target = source] = arg.split(':')
    const from = path.join(root, 'public/ui/reference-assets', `${source}.webp`)
    const id = safeArtId(target)
    // Le illustrazioni del menù e degli oggetti stanno in tessere da qualche centinaio di pixel.
    entries.push({ ...await writeArt(id, await loadRaw(from), { maxSide: referenceMaxSide, trim: false }), source: `reference-assets/${source}` })
    console.log(`${source} -> ${id}`)
  }
  return entries
}

async function fromInbox(directory) {
  const spec = JSON.parse(await fs.readFile(specPath, 'utf8'))
  const entries = []
  const files = (await fs.readdir(directory)).filter(name => /\.png$/i.test(name)).sort()
  for (const name of files) {
    const rule = spec.files[name]
    if (!rule) { console.warn(`! ${name}: nome non previsto, ignorato`); continue }
    const image = await loadRaw(path.join(directory, name))
    const { width, height } = image.info
    if (rule.magenta !== false && hasMagentaCorners(image.data, width, height)) {
      const cleared = keyOutMagenta(image.data)
      console.log(`  ${name}: fondo magenta rimosso (${cleared} px)`)
    }
    const options = { maxSide: rule.maxSide ?? 1400, trim: rule.trim !== false }
    if (rule.grid) {
      const cells = gridCells(width, height, rule.grid[0], rule.grid[1])
      for (const [index, id] of rule.ids.entries()) {
        const cell = cells[index]
        const crop = await sharp(image.data, { raw: image.info }).extract(cell).raw().toBuffer({ resolveWithObject: true })
        entries.push({ ...await writeArt(id, { data: crop.data, info: { width: crop.info.width, height: crop.info.height, channels: 4 } }, options), source: `inbox/${name}#${index}` })
        console.log(`${name}[${index}] -> ${id}`)
      }
    } else {
      entries.push({ ...await writeArt(rule.id, image, options), source: `inbox/${name}` })
      console.log(`${name} -> ${rule.id}`)
    }
  }
  const missing = Object.keys(spec.files).filter(name => !files.includes(name))
  if (missing.length) console.log(`Non ancora consegnati: ${missing.join(', ')}`)
  return entries
}

const [mode, ...rest] = process.argv.slice(2)
await fs.mkdir(output, { recursive: true })
const entries = mode === '--reference' ? await fromReference(rest) : mode === '--inbox' ? await fromInbox(path.resolve(rest[0] ?? 'asset-inbox')) : null
if (!entries) { console.error('Uso: --reference id[:nuovo] ... | --inbox <cartella>'); process.exit(1) }
const catalog = JSON.parse(await fs.readFile(catalogPath, 'utf8').catch(() => '{"version":1,"assets":[]}'))
await fs.writeFile(catalogPath, JSON.stringify(mergeCatalog(catalog, entries), null, 2) + '\n')
console.log(`${entries.length} illustrazioni importate; catalogo: ${path.relative(root, catalogPath)}`)
