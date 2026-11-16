import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function indexedValues() {
  const values = [], indices = new Map()
  return { values, index(value) {
    if (!indices.has(value)) { indices.set(value, values.length); values.push(value) }
    return indices.get(value)
  } }
}

/** Freeze startup payload shape independently of the readable authoring files. */
export function compactRuntimeGameData({ moves, species, trainers, encounters }) {
  const tables = [], tableIds = new Map()
  const elements = indexedValues(), effects = indexedValues(), categories = indexedValues()
  const places = indexedValues(), trainerKinds = indexedValues(), rarities = indexedValues()
  const tableIndex = table => {
    const entries = Object.entries(table), start = Number(entries[0]?.[0])
    if (!entries.length || !Number.isInteger(start) || entries.some(([key, value], i) => String(start + i) !== key || !Number.isFinite(value)))
      throw new Error('Move level tables must contain consecutive numeric levels.')
    const key = JSON.stringify(table)
    if (!tableIds.has(key)) {
      const runs = []
      for (const [, value] of entries) {
        if (runs.at(-1) === value) runs[runs.length - 2]++
        else runs.push(1, value)
      }
      tableIds.set(key, tables.length)
      tables.push([start, runs])
    }
    return tableIds.get(key)
  }
  const optional = (required, extra) => [...required, ...extra.slice(0, extra.findLastIndex(value => value !== undefined) + 1)]
  const packedMoves = moves.map(move => optional([
    move.id, move.nome, elements.index(move.tipo), effects.index(move.effetto), move.valoreEffetto,
    tableIndex(move.dadiPerLivello), tableIndex(move.incrementoPerLivello),
  ], [move.soloStato, move.precisione, move.stadioMinimo, move.livelloMinimo]))
  const packedSpecies = species.map(entry => [
    entry.id, entry.nome, categories.index(entry.categoria), elements.index(entry.tipo), entry.hpBase,
    entry.mosse, entry.livelloEvoluzione, entry.evoluzioneId, entry.tassoCattura,
  ])
  const packedTrainers = trainers.map(trainer => optional([
    trainer.id, trainer.nome, places.index(trainer.luogo), trainerKinds.index(trainer.tipo),
    trainer.squadra.map(member => [member.pokemonId, member.livello]),
  ], [trainer.idDatabase, trainer.guadagno, trainer.perdita, trainer.livelliRivale]))
  const packedEncounters = encounters.map(entry => [
    places.index(entry.luogo), entry.cespuglio, entry.pokemonId, rarities.index(entry.probabilita), entry.livelloMin, entry.livelloMax,
  ])
  return { version: 2, tables, elements: elements.values, effects: effects.values, categories: categories.values,
    places: places.values, trainerKinds: trainerKinds.values, rarities: rarities.values,
    moves: packedMoves, species: packedSpecies, trainers: packedTrainers, encounters: packedEncounters }
}

export async function generateRuntimeGameData({ check = false } = {}) {
  const read = async filename => JSON.parse(await fs.readFile(path.join(root, 'src/data', filename), 'utf8'))
  const [moves, species, trainers, encounters] = await Promise.all(['mosse.json', 'pokemon.json', 'allenatori.json', 'incontri.json'].map(read))
  const data = compactRuntimeGameData({ moves, species, trainers, encounters })
  const destination = path.join(root, 'src/data/runtime-game-data.json')
  const source = JSON.stringify(data) + '\n'
  if (check) {
    if (await fs.readFile(destination, 'utf8') !== source) throw new Error('Runtime game data is stale. Run node scripts/build-runtime-game-data.mjs.')
  } else await fs.writeFile(destination, source)
  return { moves: data.moves.length, sharedTables: data.tables.length, bytes: Buffer.byteLength(source) }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await generateRuntimeGameData({ check: process.argv.includes('--check') })))
}
