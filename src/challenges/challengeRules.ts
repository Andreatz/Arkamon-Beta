import { getMossa, getPokemon, POKEMON_BASE } from '@/data'
import { calcolaHPMax, getMossaAlLivello } from '@/engine/battleEngine'
import type { PokemonIstanza, PokemonSpecie } from '@/types'
import { createSeededRandomState, hashChallengeText, seededRandom, validateChallengeSeed } from './seededRandom'
import type { ChallengeDraft, ChallengeSession, ChallengeValidation } from './types'

export const CHALLENGE_RULES_VERSION = 1
export const CHALLENGE_LEVEL = 20
export const FANTA_BUDGET = 100
export const CHALLENGE_TEAM_SIZE = 6

const categoryCost: Record<PokemonSpecie['categoria'], number> = { Lenta: 2, Media: 4, Veloce: 7, Leggendaria: 14 }
const previousSpecies = new Map(POKEMON_BASE.filter((species) => species.evoluzioneId).map((species) => [species.evoluzioneId, species]))

export function speciesEvolutionStage(speciesId: number): number {
  let stage = 0
  let previous = previousSpecies.get(speciesId)
  const visited = new Set<number>([speciesId])
  while (previous && !visited.has(previous.id)) {
    visited.add(previous.id)
    stage++
    previous = previousSpecies.get(previous.id)
  }
  return stage
}

/** Frozen v1 price: growth category, evolution stage and best expected neutral attack at level 20. */
export function fantaSpeciesCost(speciesId: number): number {
  const species = getPokemon(speciesId)
  if (!species) throw new Error('Specie di Arkamon sconosciuta.')
  let expectedDamage = 0
  for (const moveId of species.mosse) {
    const move = getMossa(moveId)
    if (!move || move.soloStato || move.effetto === 'CURA') continue
    const params = getMossaAlLivello(move, CHALLENGE_LEVEL)
    expectedDamage = Math.max(expectedDamage, params.dadi * 3.5 + params.incremento)
  }
  return 8 + categoryCost[species.categoria] + speciesEvolutionStage(species.id) * 3 + Math.ceil(expectedDamage / 5)
}

export function fantaTeamCost(speciesIds: readonly number[]): number {
  return speciesIds.reduce((sum, id) => sum + fantaSpeciesCost(id), 0)
}

export function validateFantaTeam(speciesIds: unknown, requireComplete = true): ChallengeValidation {
  if (!Array.isArray(speciesIds) || speciesIds.length > CHALLENGE_TEAM_SIZE || (requireComplete && speciesIds.length !== CHALLENGE_TEAM_SIZE)) {
    return { ok: false, error: `Scegli ${CHALLENGE_TEAM_SIZE} Arkamon per la squadra.` }
  }
  if (speciesIds.some((id) => !Number.isSafeInteger(id) || !getPokemon(id))) return { ok: false, error: 'La squadra contiene una specie sconosciuta.' }
  if (new Set(speciesIds).size !== speciesIds.length) return { ok: false, error: 'Ogni specie può essere scelta una sola volta.' }
  if (fantaTeamCost(speciesIds) > FANTA_BUDGET) return { ok: false, error: `La squadra supera il budget di ${FANTA_BUDGET} crediti.` }
  return { ok: true }
}

/** Species are picked in deterministic order, reserving enough budget to finish all six slots. */
export function generateSeedTeam(seed: string, namespace: 'player' | 'opponent'): number[] {
  const normalized = validateChallengeSeed(seed)
  const rng = seededRandom(`${namespace}:${hashChallengeText(normalized).toString(16)}`)
  const candidates = POKEMON_BASE.map((species) => ({ id: species.id, type: species.tipo, cost: fantaSpeciesCost(species.id), tie: rng() }))
    .sort((a, b) => a.tie - b.tie || a.id - b.id)
  const selected: number[] = []
  const types = new Set<string>()
  let spent = 0
  for (let slot = 0; slot < CHALLENGE_TEAM_SIZE; slot++) {
    const affordable = candidates.filter((candidate) => !selected.includes(candidate.id)).filter((candidate) => {
      const remaining = candidates.filter((other) => other.id !== candidate.id && !selected.includes(other.id)).map((other) => other.cost).sort((a, b) => a - b)
      const reserve = remaining.slice(0, CHALLENGE_TEAM_SIZE - slot - 1).reduce((sum, cost) => sum + cost, 0)
      return spent + candidate.cost + reserve <= FANTA_BUDGET
    })
    const pick = affordable.find((candidate) => !types.has(candidate.type)) ?? affordable[0]
    if (!pick) throw new Error('Il catalogo non permette di completare una squadra entro il budget.')
    selected.push(pick.id)
    spent += pick.cost
    types.add(pick.type)
  }
  return selected
}

function createTeam(speciesIds: readonly number[], prefix: string): PokemonIstanza[] {
  return speciesIds.map((id, index) => {
    const species = getPokemon(id)!
    const pokemon: PokemonIstanza = { istanzaId: `${prefix}-${index}-${id}`, specieId: id, nome: species.nome, livello: CHALLENGE_LEVEL, hp: 1, xp: 0 }
    return { ...pokemon, hp: calcolaHPMax(pokemon) }
  })
}

export function createChallengeSession(draft: ChallengeDraft): ChallengeSession {
  if (draft.version !== 1 || (draft.mode !== 'seed' && draft.mode !== 'fanta')) throw new Error('Versione o modalità della sfida non supportata.')
  const seed = validateChallengeSeed(draft.seed)
  const team = draft.mode === 'seed' ? generateSeedTeam(seed, 'player') : [...draft.speciesIds]
  const checked = validateFantaTeam(team)
  if (!checked.ok) throw new Error(checked.error)
  const enemy = generateSeedTeam(seed, 'opponent')
  const id = `challenge-v1-${hashChallengeText(JSON.stringify([draft.mode, seed, team])).toString(16).padStart(8, '0')}`
  return { version: 1, rulesVersion: CHALLENGE_RULES_VERSION, id, mode: draft.mode, seed,
    rng: createSeededRandomState(seed), team: createTeam(team, `${id}-A`), enemyTeam: createTeam(enemy, `${id}-B`), budget: FANTA_BUDGET, level: CHALLENGE_LEVEL }
}

export const MAX_CHALLENGE_CODE_LENGTH = 8192

/** Sharing includes configuration, never trusted HP, moves or random state. */
export function exportChallengeCode(session: ChallengeSession): string {
  return JSON.stringify({ format: 'arkamon-challenge', version: 1, rulesVersion: 1, mode: session.mode, seed: session.seed,
    speciesIds: session.mode === 'fanta' ? session.team.map((pokemon) => pokemon.specieId) : [] })
}

export function importChallengeCode(code: string): ChallengeSession {
  if (code.length > MAX_CHALLENGE_CODE_LENGTH) throw new Error('Il codice della sfida è troppo grande.')
  let value: unknown
  try { value = JSON.parse(code) } catch { throw new Error('Il codice della sfida non è un JSON valido.') }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Codice della sfida non valido.')
  const parsed = value as Record<string, unknown>
  if (parsed.format !== 'arkamon-challenge' || parsed.version !== 1 || parsed.rulesVersion !== 1 || (parsed.mode !== 'seed' && parsed.mode !== 'fanta')) {
    throw new Error('Formato o versione della sfida non supportato.')
  }
  if (!Array.isArray(parsed.speciesIds)) throw new Error('La squadra condivisa non è valida.')
  const checked = validateFantaTeam(parsed.speciesIds, parsed.mode === 'fanta')
  if (!checked.ok) throw new Error(checked.error)
  if (parsed.mode === 'seed' && parsed.speciesIds.length > 0) throw new Error('Le squadre della sfida a seed sono generate dalle regole.')
  return createChallengeSession({ version: 1, seed: validateChallengeSeed(parsed.seed), mode: parsed.mode, speciesIds: parsed.speciesIds as number[] })
}
