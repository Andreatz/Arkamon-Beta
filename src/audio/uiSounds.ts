import { SFX_IDS, type SfxId } from './sfxIds'

const KNOWN = new Set<string>(SFX_IDS)

/** Elementi che, premuti o sorvolati, meritano un suono d'interfaccia. */
export const INTERACTIVE = 'button, [role="button"], [role="tab"], [role="menuitem"], [role="option"], [role="switch"], a[href], summary, select'
const BACK_LABEL = /^(chiudi|indietro|annulla|esci|torna|riprendi|no\b|×|✕|✖)/i

/** Quale suono merita un clic: un `data-sfx` esplicito (anche `none`) vince su tutto. */
export function clickSfxFor(element: Element): SfxId | null {
  const explicit = element.closest('[data-sfx]')?.getAttribute('data-sfx')
  if (explicit === 'none') return null
  if (explicit && KNOWN.has(explicit)) return explicit as SfxId
  const control = element.closest(INTERACTIVE)
  if (!control) return null
  if ((control as HTMLButtonElement).disabled || control.getAttribute('aria-disabled') === 'true') return 'ui.error'
  const role = control.getAttribute('role')
  if (role === 'tab') return 'ui.tab'
  if (role === 'switch') return control.getAttribute('aria-checked') === 'true' ? 'ui.toggle-off' : 'ui.toggle-on'
  const label = (control.getAttribute('aria-label') ?? control.textContent ?? '').trim()
  const className = typeof control.className === 'string' ? control.className : ''
  if (BACK_LABEL.test(label) || /(^|[-_\s])(close|back|cancel)([-_\s]|$)/i.test(className)) return 'ui.back'
  if (control.getAttribute('data-game-button') === 'primary') return 'ui.confirm'
  return 'ui.select'
}
