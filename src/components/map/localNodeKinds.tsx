import type { InteractionAction } from '@/interactions/types'

/** Tipo di un pallino della mappa locale, dedotto dall'interazione configurata dal Game Master. */
export type LocalNodeKind = 'gym' | 'trainer' | 'grass' | 'encounter' | 'heal' | 'shop' | 'dialogue'

export const LOCAL_NODE_KIND_LABELS: Record<LocalNodeKind, string> = {
  gym: 'Palestra', trainer: 'Allenatore', grass: 'Erba alta', encounter: 'Incontro',
  heal: 'Cura', shop: 'Negozio', dialogue: 'Dialogo',
}

/** Priorità quando lo stesso pallino ospita più interazioni: vince la più importante. */
const PRIORITY: LocalNodeKind[] = ['gym', 'shop', 'heal', 'trainer', 'grass', 'encounter', 'dialogue']

export function nodeKindOf(action: InteractionAction, isGymLeader: (trainerId: number) => boolean): LocalNodeKind {
  switch (action.kind) {
    case 'trainer': return isGymLeader(action.trainerId) ? 'gym' : 'trainer'
    case 'bush': return 'grass'
    case 'encounter': return 'encounter'
    case 'heal': return 'heal'
    case 'shop': return 'shop'
    default: return 'dialogue'
  }
}

/** Un tipo per pallino: il più importante fra le interazioni attive di quel punto. */
export function nodeKinds(entries: readonly { nodeId: string; action: InteractionAction }[], isGymLeader: (trainerId: number) => boolean): Record<string, LocalNodeKind> {
  const result: Record<string, LocalNodeKind> = {}
  for (const entry of entries) {
    const kind = nodeKindOf(entry.action, isGymLeader)
    const current = result[entry.nodeId]
    if (!current || PRIORITY.indexOf(kind) < PRIORITY.indexOf(current)) result[entry.nodeId] = kind
  }
  return result
}

/** Glifi originali, disegnati in un riquadro 24×24. */
const GLYPHS: Record<LocalNodeKind, string> = {
  gym: 'M4 18h16l-1.5-9-4.5 4-2-7-2 7-4.5-4z',
  trainer: 'M5 4l6 6M4 5l2-2M19 4l-6 6M20 5l-2-2M8 14l8-8M16 14 8 6M6 16l-2 4M18 16l2 4',
  grass: 'M5 20c1-5 0-9-2-12 3 2 4 6 4 12M10 20c0-6 1-11 3-15-1 5-1 10 0 15M15 20c1-4 3-7 6-9-3 3-4 6-4 9',
  encounter: 'M12 3l2.6 5.4 5.9.9-4.3 4.1 1 5.9L12 16.5l-5.2 2.8 1-5.9L3.5 9.3l5.9-.9z',
  heal: 'M9.5 4h5v5.5H20v5h-5.5V20h-5v-5.5H4v-5h5.5z',
  shop: 'M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2',
  dialogue: 'M4 5h16v10H10l-5 4v-4H4z',
}

export function LocalNodeGlyph({ kind }: { kind: LocalNodeKind }) {
  const filled = kind === 'gym' || kind === 'encounter' || kind === 'heal' || kind === 'dialogue' || kind === 'shop'
  return <svg viewBox="0 0 24 24" className="local-map-node-glyph" aria-hidden="true">
    <path d={GLYPHS[kind]} fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={filled ? 1.2 : 2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
}
