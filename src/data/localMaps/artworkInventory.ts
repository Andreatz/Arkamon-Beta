/** Imported paintings awaiting an authored, reviewed node/road definition.
 * A picture is not a movement graph: registering it as playable would invent
 * connections and invalidate existing location progress. Keep it available as
 * source artwork without silently enabling a new route topology.
 */
export const PENDING_LOCAL_MAP_ARTWORK = [
  { id: 'Pescara', image: '/maps/Pescara.png' },
  { id: 'Percorso_9', image: '/maps/Percorso_9.png' },
  { id: 'Percorso_10', image: '/maps/Percorso_10.png' },
  { id: 'Percorso_12', image: '/maps/Percorso_12.png' },
  { id: 'Via_Vittoria_3', image: '/maps/Percorso_15-2.png' },
] as const
