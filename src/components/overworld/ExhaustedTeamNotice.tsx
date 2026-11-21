import { GameButton } from '@/components/ui/GameButton'
import { useGameStore } from '@store/gameStore'

/**
 * 21 novembre 2026: la squadra si cura alla fine di ogni battaglia e le infermerie non esistono più.
 * Una squadra interamente KO fuori battaglia può arrivare solo da un salvataggio precedente: questo
 * avviso permette di recuperarla senza consumare azioni, così la partita non resta bloccata.
 */
export function ExhaustedTeamNotice({ playerId, className = '' }: { playerId: 1 | 2; className?: string }) {
  const curaSquadra = useGameStore((s) => s.curaSquadra)
  return (
    <div role="status" className={`arka-ds-panel flex flex-col items-center gap-2 text-center text-amber-200 ${className}`} data-density="compact">
      <p>Nessun Arkamon della squadra è in grado di combattere. Questo salvataggio precede la cura automatica di fine battaglia.</p>
      <GameButton onClick={() => curaSquadra(playerId)}>Recupera la squadra</GameButton>
    </div>
  )
}
