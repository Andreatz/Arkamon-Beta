import { useEffect, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useInteractionStore } from './interactionStore'
import { interactionRequirementMessage, isInteractionComplete } from './runtime'
import './interactions.css'
import { openPlayerUi } from '@/player-ui/navigation'
import { GameButton } from '@/components/ui/GameButton'
import { getShopItem } from '@/shop/catalog'
import type { InteractionResources } from './types'

function resourceText(resources: InteractionResources): string {
  const labels = Object.entries(resources.items).filter(([, quantity]) => quantity).map(([id, quantity]) => `${quantity} ${getShopItem(id)?.name ?? id}`)
  if (resources.coins) labels.unshift(`${resources.coins} monete`)
  return labels.join(' e ')
}

export function ConfiguredInteractionPanel({ mapId, nodeId, inputBlocked = false, onShopOpened }: { mapId: string; nodeId: string; inputBlocked?: boolean; onShopOpened?: () => void }) {
  const definitions = useInteractionStore((s) => s.interactions)
  const playerId = useGameStore((s) => s.giocatoreAttivo)
  const player1 = useGameStore((s) => s.giocatore1)
  const player2 = useGameStore((s) => s.giocatore2)
  const progress = useGameStore((s) => s.interactionProgress)
  const turn = useGameStore((s) => s.turnoOverworld)
  const battle = useGameStore((s) => s.battaglia)
  const execute = useGameStore((s) => s.eseguiInterazioneConfigurata)
  const [message, setMessage] = useState('')
  useEffect(() => setMessage(''), [playerId, mapId, nodeId])
  const state = { giocatore1: player1, giocatore2: player2, interactionProgress: progress }
  const available = definitions.filter((entry) => entry.mapId === mapId && entry.nodeId === nodeId && entry.enabled)
  return <div className="configured-interactions">
    {!available.length && <p>Non ci sono interazioni definite su questo pallino.</p>}
    {available.map((entry) => {
      const player = state[playerId === 1 ? 'giocatore1' : 'giocatore2']
      const visitedBush = entry.action.kind === 'bush' && player.cespugliVisitati.has(`${mapId}:${entry.action.bush}`)
      const canRetryBush = visitedBush && (player.inventario['special-perfume'] ?? 0) > (entry.cost.items['special-perfume'] ?? 0)
      const done = !canRetryBush && (visitedBush || !entry.repeatable && isInteractionComplete(progress, entry, playerId))
      const requirement = interactionRequirementMessage(state, entry, playerId)
      const disabled = inputBlocked || !!battle || !!progress.pendingBattle || done || !!requirement || turn.giocatoreAttivo !== playerId || turn.azioniRimaste <= 0
      const reward = resourceText(entry.reward)
      const cost = resourceText(entry.cost)
      return <article key={entry.id} className="configured-interaction">
        <h3>{entry.title}</h3><p>{entry.dialogue}</p>
        <small>{entry.scope === 'shared' ? 'Si completa una volta per la partita; il premio va a chi la completa.' : 'Completamento indipendente per questo giocatore.'}{entry.repeatable ? ' Attività ripetibile.' : ''}</small>
        {cost && <small>Costo all’avvio: {cost}.</small>}{reward && <small>Ricompensa al completamento: {reward}{['trainer', 'bush', 'encounter'].includes(entry.action.kind) ? ', soltanto dopo una vittoria o cattura' : ''}.</small>}
        {requirement && <p>{requirement}</p>}
        <GameButton tone="primary" disabled={disabled} onClick={() => {
          const result = execute(playerId, entry.id)
          setMessage(result.message)
          if (result.ok && entry.action.kind === 'shop') {
            onShopOpened?.()
            openPlayerUi('negozio', { playerId, shopInteractionId: entry.id })
          }
        }}>
          {canRetryBush ? 'Riprova con Profumo speciale' : done ? 'Completata' : entry.action.kind === 'shop' ? 'Apri Arkastore' : entry.action.kind === 'heal' ? 'Cura la squadra' : ['trainer', 'bush', 'encounter'].includes(entry.action.kind) ? 'Avvia incontro' : 'Interagisci'}
        </GameButton>
      </article>
    })}
    <p role="status" aria-live="polite">{message}</p>
  </div>
}
