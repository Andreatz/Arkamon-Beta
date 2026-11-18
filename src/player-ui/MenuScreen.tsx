import type { PlayerUiAuxiliary, PlayerUiScreen } from './navigation'
import { ReferenceMainMenu } from './reference/ReferenceMainMenu'

interface MenuScreenProps {
  playerId: 1 | 2
  onAuxiliary: (tool: PlayerUiAuxiliary) => void
  onNavigate?: (screen: PlayerUiScreen) => void
  onResume?: () => void
}

/** Menù principale: una sola composizione, quella dei riferimenti (la modalità SVG è stata rimossa il 18 novembre 2026). */
export function MenuScreen({ playerId, onAuxiliary, onNavigate, onResume }: MenuScreenProps) {
  return <ReferenceMainMenu playerId={playerId} onAuxiliary={onAuxiliary} onNavigate={onNavigate} onResume={onResume} />
}
