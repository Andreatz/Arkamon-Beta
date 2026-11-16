import { efficaciaTipo } from '@/data/index'
import { getMossaAlLivello, percentualeProssimoTickVeleno, èMossaCura, èMossaSoloStato } from '@/engine/battleEngine'
import type { MossaDef, Stato, TipoPokemon } from '@/types'

const STATUS_LABELS: Record<string, string> = {
  PARALISI: 'Paralisi', PARALIZZATO: 'Paralisi', VELENO: 'Veleno', SONNO: 'Sonno', CONFUSIONE: 'Confusione',
}

export function battleMoveFacts(move: MossaDef, level: number, defenderType?: TipoPokemon) {
  const amount = move.valoreEffetto ?? 0
  if (move.effetto === 'DANNO_FISSO') {
    return { label: `${amount} danni fissi`, detail: 'Danno fisso, senza dadi o moltiplicatori di tipo.', kind: 'status' as const }
  }
  if (move.effetto === 'CURA_PARALISI') {
    return { label: 'Cura paralisi', detail: 'Rimuove la paralisi del proprio Arkamon.', kind: 'heal' as const }
  }
  if (move.effetto === 'IMMUNITA_STATUS') {
    return { label: 'Immunità agli status', detail: `Rimuove lo status in corso e protegge per ${amount} turni.`, kind: 'heal' as const }
  }
  if (move.effetto === 'CURA_VELENO_HP') {
    return { label: `Cura ${amount}% HP e veleno`, detail: `Recupera il ${amount}% degli HP massimi e rimuove l'avvelenamento.`, kind: 'heal' as const }
  }
  if (move.effetto === 'CURA_HP_LIMITATA') {
    return { label: `Cura ${amount}% HP`, detail: `Recupera il ${amount}% degli HP massimi. Tre utilizzi per battaglia.`, kind: 'heal' as const }
  }
  if (èMossaCura(move)) {
    const label = move.effetto === 'CURA_PCT' ? `Cura ${amount}% HP` : `Cura ${amount} HP`
    return { label, detail: `${label}. Rimuove veleno e paralisi; conserva sonno e confusione. Nessun tiro offensivo.`, kind: 'heal' as const }
  }
  if (èMossaSoloStato(move)) {
    const effect = STATUS_LABELS[move.effetto ?? ''] ?? 'Status'
    const label = move.precisione === undefined ? effect : `${effect} · ${move.precisione}%`
    return { label, detail: `${label}. Applica uno status senza danno diretto. La Suprema è riservata alle mosse offensive con dadi.`, kind: 'status' as const }
  }
  const { dadi, incremento } = getMossaAlLivello(move, level)
  const label = `${dadi}d6${incremento ? ` ${incremento > 0 ? '+' : '−'} ${Math.abs(incremento)}` : ''}`
  const multiplier = defenderType ? efficaciaTipo(move.tipo, defenderType) : undefined
  const effectiveness = multiplier === undefined ? '' : ` Efficacia contro ${defenderType}: ×${multiplier}.`
  return { label, detail: `${label}.${effectiveness} Suprema: danno doppio, poi contraccolpo di metà degli HP massimi.`, kind: 'attack' as const }
}

export function battleStatusDescription(status: Stato): string {
  const database = status.regola === 'database'
  const remaining = Math.max(0, status.turniRimanenti)
  switch (status.tipo) {
    case 'Avvelenato': {
      const percentage = percentualeProssimoTickVeleno(status).toLocaleString('it-IT')
      return `Avvelenato. Il prossimo danno è pari al ${percentage}% degli HP massimi. Turno ${(status.turniTrascorsi ?? 0) + 1}.`
    }
    case 'Paralizzato':
      return `Paralizzato. Agisce per secondo. Con 1–2 sul d6 perde l’attacco, con 3–6 attacca. ${database ? 'Termina con una cura o a fine battaglia.' : 'Termina con una cura.'}`
    case 'Addormentato':
      return database
        ? `Addormentato. Salta il primo turno. Al secondo si sveglia al 50%, al terzo al 75%, al quarto automaticamente. Restano ${remaining} turni.`
        : `Addormentato. Salta il primo turno, poi si sveglia con 4–6 sul d6. Restano ${remaining} turni.`
    case 'Confuso':
      return `Confuso. Ha il 50% di probabilità di perdere il turno e subire ${database ? '1/8 degli HP massimi' : '1d6 di danno'}. Restano ${remaining} turni.`
  }
}
