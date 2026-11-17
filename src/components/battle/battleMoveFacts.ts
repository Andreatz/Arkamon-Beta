import { efficaciaTipo } from '@/data/index'
import { getMossaAlLivello, èMossaCura, èMossaSoloStato } from '@/engine/battleEngine'
import type { MossaDef, TipoPokemon } from '@/types'

const STATUS_LABELS: Record<string, string> = {
  PARALISI: 'Paralisi', SONNO: 'Sonno', CONFUSIONE: 'Confusione', VELENO: 'Veleno',
}

export function battleMoveFacts(move: MossaDef, level: number, defenderType?: TipoPokemon) {
  if (move.livelloMinimo && level < move.livelloMinimo) {
    return { label: `Dal Lv. ${move.livelloMinimo}`, detail: `Disponibile dal livello ${move.livelloMinimo}.`, kind: 'status' as const }
  }
  if (move.effetto === 'CURA_PARALISI') {
    return { label: 'Cura paralisi', detail: 'Rimuove la paralisi da chi la usa. Nessun tiro offensivo.', kind: 'heal' as const }
  }
  if (move.effetto === 'IMMUNITA') {
    const turns = move.valoreEffetto ?? 5
    return { label: `Immunità ${turns} turni`, detail: `Cura lo stato attuale e blocca i nuovi stati per ${turns} turni.`, kind: 'heal' as const }
  }
  if (move.effetto === 'DANNO_FISSO') {
    const amount = move.valoreEffetto ?? 0
    return { label: `${amount} danni fissi`, detail: `Infligge sempre ${amount} danni, senza dadi né efficacia di tipo; non può diventare Suprema.`, kind: 'attack' as const }
  }
  if (èMossaCura(move)) {
    const amount = move.valoreEffetto ?? 0
    const label = move.effetto === 'CURA_PCT' ? `Cura ${amount}% HP` : `Cura ${amount} HP`
    return { label, detail: `${label}. Rimuove veleno e paralisi; conserva sonno e confusione. Nessun tiro offensivo.`, kind: 'heal' as const }
  }
  if (èMossaSoloStato(move)) {
    const name = move.effetto ? STATUS_LABELS[move.effetto] ?? move.effetto : 'Status'
    return { label: name, detail: `${name} al bersaglio. Nessun danno o tiro offensivo; non può diventare Suprema.`, kind: 'status' as const }
  }
  const { dadi, incremento } = getMossaAlLivello(move, level)
  const label = `${dadi}d6${incremento ? ` ${incremento > 0 ? '+' : '−'} ${Math.abs(incremento)}` : ''}`
  const multiplier = defenderType ? efficaciaTipo(move.tipo, defenderType) : undefined
  const effectiveness = multiplier === undefined ? '' : ` Efficacia contro ${defenderType}: ×${multiplier}.`
  return { label, detail: `${label}.${effectiveness} Suprema: danno doppio, poi contraccolpo di metà degli HP massimi.`, kind: 'attack' as const }
}
