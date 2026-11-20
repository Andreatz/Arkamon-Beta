import type { AdminMainMapUiLayout } from '@/theme/adminThemeTypes'
import { defaultMainMapUiLayout } from '@/theme/defaultAdminTheme'
const HUD_KEYS = ['turnPanel', 'coinsPanel', 'positionPanel', 'actionsPanel'] as const
/** Refine the shipped composition only. An authored legacy HUD keeps its exact coordinates. */
export function resolveWorldMapHudLayout(layout: AdminMainMapUiLayout) {
  const combined = HUD_KEYS.every(key => {
    const rect = layout[key], original = defaultMainMapUiLayout[key]
    return ['x','y','w','h'].every(field => rect[field as 'x'] === original[field as 'x']) && !Object.keys(rect.contentOffsets ?? {}).length
  })
  // Audit fase 1: la targhetta dell'obiettivo era un riquadro di 4%×4% e il testo veniva troncato («G1 · 2…»).
  // Se è ancora quella fornita, diventa una fascia leggibile in basso al centro.
  const footer = layout.footer, originalFooter = defaultMainMapUiLayout.footer
  const shippedFooter = ['x','y','w','h'].every(field => footer[field as 'x'] === originalFooter[field as 'x'])
  const refined = shippedFooter ? { ...layout, footer: { ...footer, x: 27, y: 93.2, w: 46, h: 4.6 } } : layout
  if (!combined) return { layout: refined, combined }
  return { combined, layout: { ...refined,
    turnPanel: { ...layout.turnPanel, x: 2.5, y: 2, w: 23, h: 7.5 },
    coinsPanel: { ...layout.coinsPanel, x: 25.5, y: 2, w: 14, h: 7.5 },
    positionPanel: { ...layout.positionPanel, x: 39.5, y: 2, w: 24, h: 7.5 },
    actionsPanel: { ...layout.actionsPanel, x: 63.5, y: 2, w: 33.5, h: 7.5 },
  } }
}
