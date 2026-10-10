import type { PokemonIstanza } from '@/types'

export type ChallengeMode = 'seed' | 'fanta'

export interface SeededRandomState {
  algorithm: 'arkamon-counter-v1'
  seed: string
  cursor: number
}

/** Initial battle configuration. Progress and campaign snapshots belong to the game store. */
export interface ChallengeSession {
  version: 1
  rulesVersion: 1
  id: string
  mode: ChallengeMode
  seed: string
  rng: SeededRandomState
  team: PokemonIstanza[]
  enemyTeam: PokemonIstanza[]
  budget: number
  level: number
}

export interface ChallengeDraft {
  version: 1
  seed: string
  mode: ChallengeMode
  speciesIds: number[]
}

export interface ChallengeResult {
  id: string
  sessionId: string
  mode: ChallengeMode
  seed: string
  outcome: 'vittoria' | 'sconfitta'
  turns: number
  remainingHp: number
  completedAt: string
  team: number[]
}

export type ChallengeValidation = { ok: true } | { ok: false; error: string }
