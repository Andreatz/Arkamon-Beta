import type { MossaDef } from '@/types'
import { VFX_TYPE_COLORS } from '../vfxTypeColors'
import { formColors, formMotifs, motifs, moveMotifs } from './motifs'
import type { VfxTravel } from '../types'

type Motion = 'ray' | 'lance' | 'shower' | 'orbit' | 'strike' | 'bloom' | 'cage' | 'rift' | 'tide'
export interface MoveSequence {
  key: string
  motif: number
  seal: number
  color: string
  accent: string
  motion: Motion
  spokes: number
  phase: number
  spin: number
  duration: number
  impact: number
}

function choreography(move: MossaDef, travel: VfxTravel, motif: number): Motion {
  if (move.soloStato && move.effetto === 'PARALISI') return 'cage'
  if (/pioggia|tempesta|stormo|nevischio|valanga|diluvio|bombardamento|sciame|caduta/i.test(move.nome)) return 'shower'
  if (/vortice|danza|spirale|turbinio|circuito|labirinto|tornado/i.test(move.nome)) return 'orbit'
  if (/faglia|crepa|cratere|sepoltura|terremoto|tettonic|continentale/i.test(move.nome)) return 'rift'
  if (/onda|marea|risacca|tsunami|alluvione|cascata|correnti/i.test(move.nome)) return 'tide'
  if (move.soloStato) return 'bloom'
  if (travel === 'beam' || /boro breath/i.test(move.nome)) return 'ray'
  if (travel === 'projectile') return 'lance'
  if (['claw', 'paw', 'fang', 'horn', 'dart'].includes(motifs[motif])) return 'strike'
  return 'bloom'
}

export function moveSequence(move: MossaDef, formId: number, travel: VfxTravel): MoveSequence | undefined {
  const motif = moveMotifs[move.id - 1]
  const seal = formMotifs[formId - 1]
  if (motif === undefined || seal === undefined) return undefined
  const seed = (Math.imul(move.id, 2654435761) ^ Math.imul(formId, 1597334677)) >>> 0
  const motion = choreography(move, travel, motif)
  const duration = (move.soloStato ? 1150 : 920) + seed % 9 * 35
  const impact = Math.round(duration * (motion === 'strike' ? 0.34 : motion === 'shower' ? 0.62 : 0.48))
  return {
    key: move.id + '-' + formId, motif, seal, color: VFX_TYPE_COLORS[move.tipo],
    accent: '#' + formColors[formId - 1], motion, spokes: 4 + (seed >>> 8) % 5,
    phase: (seed >>> 12) / 1048576 * 2 * Math.PI, spin: seed % 2 ? 1 : -1, duration, impact,
  }
}
