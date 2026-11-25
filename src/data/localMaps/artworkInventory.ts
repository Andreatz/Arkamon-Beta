/** Imported paintings awaiting an authored, reviewed node/road definition.
 * A picture is not a movement graph: registering it as playable would invent
 * connections and invalidate existing location progress. Keep it available as
 * source artwork without silently enabling a new route topology.
 */
// Dal 24 novembre 2026 ogni pittura ha la propria rete: l'elenco resta per le pitture future.
export const PENDING_LOCAL_MAP_ARTWORK: readonly { id: string; image: string }[] = []
