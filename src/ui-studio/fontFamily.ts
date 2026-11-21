/**
 * Shared font lookup is independent of the editor's image catalog.
 * 21 novembre 2026: il gioco usa un solo carattere, Cinzel. Gli identificatori salvati nei
 * progetti (`norwester`, `chela`, `azonix`, `system`, font importati) restano leggibili ma
 * vengono tutti risolti nel carattere del gioco.
 */
export const GAME_FONT_STACK = "'Arkamon Cinzel', Georgia, serif"
export function getUiFontFamily(_id: string): string {
  return GAME_FONT_STACK
}
