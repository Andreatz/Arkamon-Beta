/** Imported paintings awaiting an authored, reviewed node/road definition.
 * A picture is not a movement graph: registering it as playable would invent
 * connections and invalidate existing location progress. Keep it available as
 * source artwork without silently enabling a new route topology.
 */
export const PENDING_LOCAL_MAP_ARTWORK = [
  { id: 'Civitavecchia', image: '/maps/Civitavecchia.png' },
  { id: 'Grosseto', image: '/maps/Grosseto.png' },
  { id: 'Pescara', image: '/maps/Pescara.png' },
  { id: 'Leggendario_Percorso_3', image: '/maps/Leggendario_Percorso_3.png' },
  { id: 'Leggendario_Percorso_11', image: '/maps/Leggendario_Percorso_11.png' },
  { id: 'Leggendario_Percorso_12', image: '/maps/Leggendario_Percorso_12.png' },
  { id: 'Nascondiglio_Team_Towers', image: '/maps/Nascondiglio_Team_Towers.png' },
  { id: 'Percorso_5', image: '/maps/Percorso_5.png' },
  { id: 'Percorso_6', image: '/maps/Percorso_6.png' },
  { id: 'Percorso_7', image: '/maps/Percorso_7.png' },
  { id: 'Percorso_8', image: '/maps/Percorso_8.png' },
  { id: 'Percorso_9', image: '/maps/Percorso_9.png' },
  { id: 'Percorso_10', image: '/maps/Percorso_10.png' },
  { id: 'Percorso_12', image: '/maps/Percorso_12.png' },
  { id: 'Percorso_15-2', image: '/maps/Percorso_15-2.png' },
] as const
