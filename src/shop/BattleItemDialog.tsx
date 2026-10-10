import { GameDialog } from '@/components/ui/GameDialog'
import type { PokemonIstanza } from '@/types'
import type { ShopInventory, ShopItemId } from './catalog'
import { ItemUsePanel } from './ItemUsePanel'

export interface BattleItemDialogProps {
  squad: PokemonIstanza[]
  inventory: ShopInventory
  onUse: (itemId: ShopItemId, instanceId: string) => { ok: boolean; message: string }
  onClose: () => void
  disabled?: boolean
}

export function BattleItemDialog({ squad, inventory, onUse, onClose, disabled = false }: BattleItemDialogProps) {
  return <GameDialog title="Borsa in battaglia" onClose={onClose}>
    <ItemUsePanel squad={squad} inventory={inventory} disabled={disabled}
      actionNote="Usare un oggetto sostituisce la mossa di questo turno. Puoi curare un compagno in squadra o rianimare un Arkamon KO. L’oggetto viene consumato soltanto se ha effetto."
      onUse={(itemId, instanceId) => {
        const result = onUse(itemId, instanceId)
        if (result.ok) onClose()
        return result
      }} />
  </GameDialog>
}
