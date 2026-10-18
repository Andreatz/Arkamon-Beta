import { useEffect, useState, type CSSProperties } from 'react'
import { assetUrl } from '@/utils/assetUrl'
import { getLocalMap } from '@/data/localMaps'
import { getBackground } from '@/data/backgrounds'
import { ArkamonBattleSprite } from '@/components/arkamon/ArkamonBattleSprite'
import { HpBar } from '@/components/battle/BattlePresentation'
import { DiceRollOverlay } from '@/components/battle/DiceRollOverlay'
import { MoveVfx } from '@/components/MoveVfx'
import { BattleLayoutProvider } from '@/ui-studio/battleLayout'
import { PUBLIC_CHANNEL, type PublicSnapshot } from './publicSnapshot'
import { useSessionOwnership, requestSessionControl } from '@/session/sessionOwnership'
import type { AdminLayoutRect } from '@/theme/adminThemeTypes'
import './regia.css'
import { PublicMap } from './PublicMap'
import { resolveUiMediaSource } from '@/ui-studio/mediaStorage'

const position = (rect: AdminLayoutRect): CSSProperties => ({ position: 'absolute', left: `${rect.x}%`, top: `${rect.y}%`, width: `${rect.w}%`, height: `${rect.h}%` })
function usePublicAsset(source?: string): string | undefined {
  const [resolved, setResolved] = useState<{ source: string; url: string } | null>(null)
  useEffect(() => {
    if (!source?.startsWith('ui-media:')) return
    let current = true
    void resolveUiMediaSource(source).then(url => { if (current) setResolved({ source, url }) }).catch(() => {})
    return () => { current = false }
  }, [source])
  return source?.startsWith('ui-media:') ? resolved?.source === source ? resolved.url : undefined : source ? assetUrl(source) : undefined
}

/** A passive renderer. It never mounts game actions, audience polling, Admin or campaign effects. */
export function BroadcastView({ publicOnly = false }: { publicOnly?: boolean }) {
  const ownership = useSessionOwnership()
  const [snapshot, setSnapshot] = useState<PublicSnapshot | null>(null)
  const [connected, setConnected] = useState(false)
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return
    const channel = new BroadcastChannel(PUBLIC_CHANNEL)
    let receivedAt = 0
    channel.onmessage = event => {
      if (event.data?.kind !== 'snapshot' || event.data.snapshot?.version !== 1) return
      receivedAt = Date.now(); setConnected(true); setSnapshot(event.data.snapshot)
    }
    channel.postMessage({ kind: 'hello' })
    const timer = window.setInterval(() => {
      if (!receivedAt || Date.now() - receivedAt > 6500) { setConnected(false); channel.postMessage({ kind: 'hello' }) }
    }, 2000)
    return () => { clearInterval(timer); channel.close() }
  }, [])
  const battle = snapshot?.battle
  const enemyFrame = usePublicAsset(battle?.appearance?.enemyFrame?.source)
  const playerFrame = usePublicAsset(battle?.appearance?.playerFrame?.source)
  const customBackground = usePublicAsset(battle?.appearance?.background)
  const map = snapshot && ['citta', 'percorso'].includes(snapshot.scene) ? getLocalMap(snapshot.place) : undefined
  const background = customBackground ?? battle?.background ?? (map ? assetUrl(map.image) : snapshot?.scene === 'mappa-principale'
    ? assetUrl('/maps/Mappa-Finale.jpg') : getBackground(snapshot?.place ?? '') ?? assetUrl('/backgrounds/battle_forest.jpg'))
  return <main className="arka-broadcast" data-broadcast-view data-broadcast-connected={connected} style={{ backgroundImage: `url("${background}")` }}>
    {snapshot ? <>
      {battle ? <BattleLayoutProvider value={battle.layout}>
        <div style={position(battle.layout.enemySprite)}><ArkamonBattleSprite speciesId={battle.pokemonB.specieId} name={battle.pokemonB.nome} side="front" animation={battle.animationB} replayKey={battle.replayB} playbackPaused={snapshot.paused} className="w-full h-full" /></div>
        <div style={position(battle.layout.playerSprite)}><ArkamonBattleSprite speciesId={battle.pokemonA.specieId} name={battle.pokemonA.nome} side="back" animation={battle.animationA} replayKey={battle.replayA} playbackPaused={snapshot.paused} className="w-full h-full" /></div>
        <div style={position(battle.layout.enemyHp)}><HpBar nome={battle.pokemonB.nome} livello={battle.pokemonB.livello} hp={battle.pokemonB.hp} hpMax={battle.hpMaxB} stato={battle.pokemonB.stato} side="enemy" frameSource={enemyFrame} frameFit={battle.appearance?.enemyFrame?.fit} hpColorsOverride={battle.appearance?.hpColors} /></div>
        <div style={position(battle.layout.playerHp)}><HpBar nome={battle.pokemonA.nome} livello={battle.pokemonA.livello} hp={battle.pokemonA.hp} hpMax={battle.hpMaxA} stato={battle.pokemonA.stato} side="player" frameSource={playerFrame} frameFit={battle.appearance?.playerFrame?.fit} hpColorsOverride={battle.appearance?.hpColors} /></div>
        {battle.dice && <DiceRollOverlay key={battle.dice.id} roll={battle.dice} staticPreview />}
        {battle.effect && <MoveVfx key={battle.effect.id} effect={battle.effect} />}
        <div className="arka-public-battle-status" role="status">{battle.status}</div>
        {!!battle.messages.length && <div className="arka-public-message">{battle.messages.slice(-2).map((message, i) => <p key={i}>{message}</p>)}</div>}
      </BattleLayoutProvider> : snapshot.scene === 'mappa-principale' || map ? <PublicMap snapshot={snapshot} />
        : <div className="arka-public-wait"><img className="arka-public-logo" src={assetUrl('/ui/logo_arkamon.png')} alt="Arkamon" /><h1>{snapshot.scene === 'titolo' ? 'La corsa alla Lega' : snapshot.scene === 'laboratorio' ? 'La scelta del primo compagno' : snapshot.scene === 'evoluzione' ? 'Un compagno si sta evolvendo' : snapshot.scene === 'battaglia' ? 'Preparazione della battaglia' : snapshot.place.replace(/_/g, ' ')}</h1><p>{snapshot.scene === 'titolo' ? 'Melia e Maggi · un viaggio, un solo campione' : 'Il viaggio continua'}</p></div>}
      <aside className="arka-public-race" aria-label="Stato della gara">{snapshot.players.map(player => <div key={player.id} data-active={snapshot.active === player.id}><strong>{player.name}</strong><span>{player.place.replace(/_/g, ' ')} · {player.badges}/8 medaglie{player.leagueWins ? ` · Lega ${player.leagueWins}/${snapshot.leagueTotal}` : ''}</span></div>)}</aside>
      {snapshot.winner && <div className="arka-public-winner">Campione della regione · {snapshot.winner}</div>}
      {snapshot.paused && <div className="arka-public-pause" role="status">Pausa di regia · il viaggio riprende tra poco</div>}
    </> : <div className="arka-public-wait"><h1>Arkamon · In onda</h1><p>Apri la console di gioco nello stesso browser per collegare questa vista.</p><p>Per OBS usa Cattura finestra. Una Browser Source con un profilo separato richiede un collegamento dedicato.</p></div>}
    {!connected && <p className="arka-public-disconnected" role="status">Console non collegata · nessuna azione viene eseguita da questa vista.</p>}
    {!publicOnly && <section className="arka-session-ownership" aria-label="Controllo della sessione"><p>{ownership.reason}</p><button onClick={() => void requestSessionControl()}>Ricarica lo stato e richiedi controllo</button></section>}
  </main>
}
