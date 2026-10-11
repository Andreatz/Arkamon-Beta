import { lazy, Suspense, useEffect } from 'react'
import { useGameStore } from '@store/gameStore'
import { useAdminStore } from '@store/adminStore'
import { DepositView } from '@/components/deposit/DepositView'

const PlayerUi = lazy(() => import('@/player-ui/PlayerUi').then(module => ({ default: module.PlayerUi })))

/** Squadra e box usano gli stessi scambi del motore, con il nuovo layout deposito. */
export function DepositoScene() {
  const scenaIndietro = useGameStore((state) => state.scenaIndietro)
  const giocatoreAttivo = useGameStore((state) => state.giocatoreAttivo)
  const giocatore = useGameStore((state) => state.giocatoreAttivo === 1 ? state.giocatore1 : state.giocatore2)
  const scambiaSlot = useGameStore((state) => state.scambiaSlot)
  const layoutEditing = useAdminStore((state) => state.layoutEditing)
  const depositLayout = useAdminStore((state) => state.theme.layouts.deposit)
  const updateSceneLayout = useAdminStore((state) => state.updateSceneLayout)

  useEffect(() => {
    if (layoutEditing) return
    const close = (event: KeyboardEvent) => {
      if (
        event.key !== 'Escape'
        || event.defaultPrevented
        || document.querySelector('[data-game-dialog], [data-battle-log-dialog]')
      ) return
      event.preventDefault()
      scenaIndietro()
    }
    document.addEventListener('keydown', close)
    return () => document.removeEventListener('keydown', close)
  }, [layoutEditing, scenaIndietro])

  if (!layoutEditing) return <div className="pu-scene-host">
    <Suspense fallback={<p role="status">Caricamento deposito…</p>}>
      <PlayerUi initialScreen="deposito" initialPlayerId={giocatoreAttivo} onClose={scenaIndietro} />
    </Suspense>
  </div>

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
