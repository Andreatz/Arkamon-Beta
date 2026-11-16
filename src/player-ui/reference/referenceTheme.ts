import { MENU_SVG_ARTWORK_ENABLED } from '../uiAppearancePolicy'

/** Una sola direzione, dai riferimenti forniti; i concept alternativi sono stati rimossi (Fase 6). */
export function isReferenceUi(): boolean {
  return !MENU_SVG_ARTWORK_ENABLED
}
