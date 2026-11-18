import type { CSSProperties } from 'react'
import { gameArtUrl, hasGameArt } from '@/ui-system/GameArt'
import './battleFrames.css'

/**
 * Cornici dipinte del lotto 3 (fase U6). Le cornici con un cristallo al centro di un lato
 * arrivano divise in due metà (`<id>-left`, `<id>-right`, vedi `import-game-art.mjs`): ogni metà
 * si allunga a nove pezzi tenendo fermi angoli e mezzo cristallo, così niente si deforma
 * qualunque sia la misura del riquadro scelta nell'Admin. Le cornici lunghe (targa, scanalatura,
 * fascia del turno) si allungano solo nel tratto dritto fra le due estremità.
 *
 * Il riquadro porta `data-ui-asset-decoration`: una personalizzazione di UI Studio lo nasconde
 * e mette la sua immagine, come per le altre decorazioni.
 */
export type BattleFrameKind = 'move' | 'message' | 'supreme' | 'turn' | 'hp-banner' | 'hp-track'

const ART: Record<BattleFrameKind, { id: string; halves: boolean; selected?: string }> = {
  move: { id: 'battle-move-frame', halves: true, selected: 'battle-move-frame-selected' },
  message: { id: 'battle-message-frame', halves: true },
  supreme: { id: 'battle-supreme-frame', halves: true },
  turn: { id: 'battle-turn-banner', halves: false },
  'hp-banner': { id: 'battle-hp-banner', halves: false },
  'hp-track': { id: 'battle-hp-track', halves: false },
}

const url = (id: string) => { const src = gameArtUrl(id); return src ? `url("${src}")` : undefined }

/** Vero quando la cornice dipinta c'è e l'interfaccia è quella di riferimento. */
export function hasBattleFrame(kind: BattleFrameKind): boolean {
  const art = ART[kind]
  return (art.halves ? hasGameArt(`${art.id}-left`) && hasGameArt(`${art.id}-right`) : hasGameArt(art.id))
}

export function BattleFrame({ kind, className = '' }: { kind: BattleFrameKind; className?: string }) {
  if (!hasBattleFrame(kind)) return null
  const art = ART[kind]
  const style = (art.halves
    ? {
      '--frame-left': url(`${art.id}-left`), '--frame-right': url(`${art.id}-right`),
      ...(art.selected && hasGameArt(`${art.selected}-left`) ? { '--frame-left-on': url(`${art.selected}-left`), '--frame-right-on': url(`${art.selected}-right`) } : {}),
    }
    : { '--frame': url(art.id) }) as unknown as CSSProperties
  return <span aria-hidden="true" data-ui-asset-decoration="" data-battle-frame={kind}
    className={`battle-frame battle-frame--${kind}${art.halves ? ' battle-frame--halves' : ''} ${className}`} style={style} />
}
