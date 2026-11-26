import type { BattleLogEvent } from '@/types'
import type { SfxId } from './sfxIds'
import { panForSide } from './moveSounds'

export interface SfxCue { id: SfxId; pan: number; delayMs?: number }

const STATUS_SOUND: Record<string, SfxId> = {
  Paralizzato: 'status.paralysis',
  Addormentato: 'status.sleep',
  Confuso: 'status.confusion',
  Avvelenato: 'status.poison',
}

function statusOf(title: string): string | undefined {
  return Object.keys(STATUS_SOUND).find((name) => title.includes(name))
}

/**
 * Suoni che nascono dalla Cronaca della battaglia: stati alterati applicati o in azione a inizio
 * turno e cambi di Arkamon. Colpi, KO, cure e cattura hanno già il loro momento nella regia.
 */
export function chronicleSfx(events: readonly BattleLogEvent[]): SfxCue[] {
  const cues: SfxCue[] = []
  for (const event of events) {
    if (event.kind === 'switch') {
      cues.push({ id: 'battle.switch-in', pan: panForSide(event.side) })
      continue
    }
    if (event.kind !== 'status') continue
    const status = statusOf(event.title)
    if (!status) continue
    // Applicato da un attacco (senza HP prima/dopo): l'evento è del lato di chi attacca,
    // il suono sta sul bersaglio. A inizio turno, invece, l'evento è del lato colpito.
    const applied = event.hpBefore === undefined
    const side = applied ? (event.side === 'A' ? 'B' : 'A') : event.side
    const tick = !applied && status === 'Avvelenato' && (event.damage ?? 0) > 0
    cues.push({ id: tick ? 'status.tick' : STATUS_SOUND[status], pan: panForSide(side), ...(applied ? { delayMs: 380 } : {}) })
  }
  return cues
}
