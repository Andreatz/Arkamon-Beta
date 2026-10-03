import { useGameStore } from '@store/gameStore'
import { useAdminStore } from '@store/adminStore'
import { DepositView } from '@/components/deposit/DepositView'

/** Squadra e box usano gli stessi scambi del motore, con il nuovo layout deposito. */
export function DepositoScene() {
  const scenaIndietro = useGameStore((state) => state.scenaIndietro)
  const giocatoreAttivo = useGameStore((state) => state.giocatoreAttivo)
  const giocatore = useGameStore((state) => state.giocatoreAttivo === 1 ? state.giocatore1 : state.giocatore2)
  const scambiaSlot = useGameStore((state) => state.scambiaSlot)
  const layoutEditing = useAdminStore((state) => state.layoutEditing)
  const depositLayout = useAdminStore((state) => state.theme.layouts.deposit)
  const updateSceneLayout = useAdminStore((state) => state.updateSceneLayout)

  return (
    <DepositView
      key={giocatoreAttivo}
      squadra={giocatore.squadra}
      deposito={giocatore.deposito}
      giocatoreNome={giocatore.nome}
      onSwap={(source, target) => scambiaSlot(giocatoreAttivo, source, target)}
      onBack={scenaIndietro}
      layout={depositLayout}
      editing={layoutEditing}
      onLayoutChange={(key, rect) => updateSceneLayout({ scene: 'deposit', key, rect })}
    />
  )
}
