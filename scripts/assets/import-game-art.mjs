#!/usr/bin/env node
/**
 * Importa le illustrazioni di gioco in public/ui/game-art e aggiorna src/data/gameArt.json.
 *
 *   node scripts/assets/import-game-art.mjs --reference [--max 720] menu-map-art:menu-map coin ...
 *     converte asset già presenti in public/ui/reference-assets (id[:nuovo-id]), lato massimo 720 px;
 *   node scripts/assets/import-game-art.mjs --inbox asset-inbox/lotto-1
 *     elabora le immagini consegnate (PNG, JPG o WebP) secondo ui-source/game-art-inbox.json: toglie il fondo
 *     magenta, ritaglia i margini trasparenti, taglia le griglie, ridimensiona, salva WebP.
 *
 * I file sconosciuti vengono segnalati e ignorati; un file mancante non blocca gli altri.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { INBOX_IMAGE, floodKeyBackground, gridCells, hasMagentaCorners, keyOutMagenta, mergeCatalog, safeArtId, ruleForFile } from './gameArtImport.mjs'

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

async function writeHalves(whole, name) {
  const source = path.join(output, whole.file)
  const half = Math.ceil(whole.width / 2)
  const halves = []
  for (const [suffix, left] of [['left', 0], ['right', whole.width - half]]) {
    const id = `${whole.id}-${suffix}`
    const info = await sharp(source).extract({ left, top: 0, width: half, height: whole.height })
      .webp({ quality: 90, alphaQuality: 100, effort: 5 }).toFile(path.join(output, `${id}.webp`))
    halves.push({ id, file: `${id}.webp`, width: info.width, height: info.height, source: `inbox/${name}#${suffix}` })
    console.log(`${name} -> ${id}`)
  }
  return halves
}

async function fromInbox(directory) {
  const spec = JSON.parse(await fs.readFile(specPath, 'utf8'))
  const entries = []
  const files = (await fs.readdir(directory)).filter(name => INBOX_IMAGE.test(name)).sort()
  for (const name of files) {
    const rule = ruleForFile(spec, name)
    if (!rule) { console.warn(`! ${name}: nome non previsto, ignorato`); continue }
    const image = await loadRaw(path.join(directory, name))
    const { width, height } = image.info
    if (rule.magenta !== false && hasMagentaCorners(image.data, width, height)) {
      const cleared = keyOutMagenta(image.data)
      console.log(`  ${name}: fondo magenta rimosso (${cleared} px)`)
    }
    if (rule.floodKey) {
      const cleared = floodKeyBackground(image.data, width, height, rule.floodKey === true ? {} : rule.floodKey)
      console.log(`  ${name}: fondo piatto scontornato dai bordi (${cleared} px)`)
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
      const whole = await writeArt(rule.id, image, options)
      entries.push({ ...whole, source: `inbox/${name}` })
      console.log(`${name} -> ${rule.id}`)
      // Cornici con un ornamento al centro di un lato: due metà, ognuna allungabile a nove pezzi
      // con il mezzo ornamento fermo sul lato interno (vedi battleFrames.css).
      if (rule.halves) entries.push(...await writeHalves(whole, name))
    }
  }
  const delivered = new Set(files.map(name => { const canonical = name.replace(INBOX_IMAGE, '.png'); return spec.aliases?.[canonical] ?? canonical }))
  const missing = Object.keys(spec.files).filter(name => !delivered.has(name))
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
