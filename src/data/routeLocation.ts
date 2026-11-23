/**
 * Luoghi che si comportano come percorsi (scena «percorso», Bicicletta, nessun Arkastore):
 * i Percorsi numerati, le mappe successive di Via Vittoria e i luoghi nascosti.
 */
const ROUTE_PREFIXES = ['Percorso_', 'Via_Vittoria_', 'Leggendario_', 'Nascondiglio_', 'Lega_'] as const

export function isRouteLocation(id: string): boolean {
  return ROUTE_PREFIXES.some((prefix) => id.startsWith(prefix))
}
