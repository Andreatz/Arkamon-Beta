import { GameButton } from '@/components/ui/GameButton'
import { getCespugliInLuogo, getIncontri } from '@/data'
import { calcolaHPMax, determinaIniziativa } from '@/engine/battleEngine'
import { generaIncontroDaCespuglio } from '@/engine/encounters'
import { isTeamWithinLevelCap, teamCapMessage } from '@/engine/teamLevelCap'
import { useGameStore } from '@/store/gameStore'
import { prepareBattleEntry } from '@/store/game/battleCommands'
import type { StatoBattaglia } from '@/types'

export function WildEncounterButtons({ place, disabled }: { place: string; disabled: boolean }) {
  const playerId = useGameStore((state) => state.giocatoreAttivo)
  const player = useGameStore((state) => playerId === 1 ? state.giocatore1 : state.giocatore2)
  const bushes = getCespugliInLuogo(place)

  function explore(bush: string) {
    if (disabled) return
    const store = useGameStore.getState()
    const current = playerId === 1 ? store.giocatore1 : store.giocatore2
    const retry = store.cespuglioVisitato(playerId, place, bush)
    if (retry && !(current.inventario['special-perfume'] ?? 0)) return
    if (!isTeamWithinLevelCap(current.squadra)) {
      store.aggiornaStato({ teamRuleMessage: teamCapMessage(current.squadra) })
      return
    }
    const lead = current.squadra.find((member) => member.hp > 0)
    const wild = generaIncontroDaCespuglio(getIncontri(place, bush))
    if (!lead || !wild) return
    const battle: StatoBattaglia = {
      tipo: 'Selvatico',
      pokemonA: lead,
      pokemonB: wild,
      hpMaxA: calcolaHPMax(lead),
      hpMaxB: calcolaHPMax(wild),
      turnoCorrente: determinaIniziativa(lead.livello, wild.livello, Math.random, lead.stato?.tipo, wild.stato?.tipo),
      luogoRitorno: place,
      log: [`Appare ${wild.nome} selvatico!`],
      evoluzioneInAttesa: null,
    }
    if (!prepareBattleEntry(battle, current).result.ok) return
    store.eseguiTransazione(() => {
      if (!store.consumaInterazioneMappaLocale(playerId, place) || !store.iniziaBattaglia(battle).ok) return
      if (retry) store.usaOggetto(playerId, 'special-perfume')
      else store.segnaCespuglioVisitato(playerId, place, bush)
      store.vaiAScena('battaglia')
    })
  }

  if (bushes.length === 0) return null
  return <section aria-label="Incontri selvatici" className="col-span-3 grid shrink-0 grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-7">
    {bushes.map((bush) => {
      const visited = player.cespugliVisitati.has(`${place}:${bush}`)
      const canRetry = visited && (player.inventario['special-perfume'] ?? 0) > 0
      return <GameButton
        key={bush}
        disabled={disabled || (visited && !canRetry)}
        aria-label={canRetry ? `Cespuglio ${bush}, riprova con Profumo speciale` : `Cespuglio ${bush}${visited ? ', esplorato' : ''}`}
        onClick={() => explore(bush)}
        className="flex aspect-square flex-col items-center justify-center disabled:cursor-not-allowed disabled:opacity-30"
      >
        <span className="arka-layout-content mb-2 text-5xl">{visited ? '🌾' : '🌳'}</span>
        <span className="arka-layout-content text-lg font-bold">{bush}</span>
        <span className="arka-layout-content text-xs text-arka-text-muted">
          {canRetry ? 'Riprova con Profumo speciale' : visited ? 'esplorato' : 'cespuglio'}
        </span>
      </GameButton>
    })}
  </section>
}
