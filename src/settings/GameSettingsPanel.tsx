import { useGameStore } from '@/store/gameStore'
import { useGamePreferences } from './gamePreferences'
import { useAutoOpponent } from './autoOpponent'
import './gameSettingsArtwork.css'
import '@/components/ui/menuArtworkFallback.css'

export function GameSettingsPanel() {
  const musicVolume = useGamePreferences((state) => state.musicVolume)
  const effectsVolume = useGamePreferences((state) => state.effectsVolume)
  const animationSpeed = useGamePreferences((state) => state.animationSpeed)
  const reducedMotion = useGamePreferences((state) => state.reducedMotion)
  const graphicsMemory = useGamePreferences((state) => state.graphicsMemory)
  const textSize = useGamePreferences((state) => state.textSize)
  const setPreferences = useGamePreferences((state) => state.setPreferences)
  const autoOpponent = useAutoOpponent()
  const muted = useGameStore((state) => state.audioMuted)
  const setMuted = useGameStore((state) => state.setAudioMuted)
  return <section aria-label="Impostazioni del gioco" className="game-settings-artwork space-y-5">
    <h2 className="text-lg font-bold">Suoni e animazioni</h2>
    <label className="game-audio-toggle" data-menu-artwork="css"><input type="checkbox" checked={!muted} onChange={(event) => setMuted(!event.target.checked)} /><span>Audio attivo</span></label>
    <label className="block">Volume musica: {Math.round(musicVolume * 100)}%
      <input className="mt-2 block w-full" aria-label="Volume musica" type="range" min="0" max="100" step="1" value={Math.round(musicVolume * 100)} onChange={(event) => setPreferences({ musicVolume: Number(event.target.value) / 100 })} />
    </label>
    <label className="block">Volume effetti: {Math.round(effectsVolume * 100)}%
      <input className="mt-2 block w-full" aria-label="Volume effetti" type="range" min="0" max="100" step="1" value={Math.round(effectsVolume * 100)} onChange={(event) => setPreferences({ effectsVolume: Number(event.target.value) / 100 })} />
    </label>
    <label className="block">Velocità animazioni
      <select className="mt-2 block w-full rounded border border-slate-500 bg-slate-800 p-3 text-white" value={animationSpeed} onChange={(event) => setPreferences({ animationSpeed: event.target.value as 'normal' | 'fast' })}>
        <option value="normal">Normale</option><option value="fast">Rapida (2×)</option>
      </select>
    </label>
    <label className="block">Movimento ridotto
      <select className="mt-2 block w-full rounded border border-slate-500 bg-slate-800 p-3 text-white" value={reducedMotion} onChange={(event) => setPreferences({ reducedMotion: event.target.value as 'system' | 'on' | 'off' })}>
        <option value="system">Segui il dispositivo</option><option value="on">Sempre attivo</option><option value="off">Disattivato</option>
      </select>
    </label>
    <label className="block">Memoria delle animazioni
      <select className="mt-2 block w-full rounded border border-slate-500 bg-slate-800 p-3 text-white" value={graphicsMemory}
        onChange={(event) => setPreferences({ graphicsMemory: event.target.value as 'auto' | 'full' | 'low' })}>
        <option value="auto">Automatica</option><option value="full">Standard</option><option value="low">Memoria ridotta</option>
      </select>
    </label>
    <label className="block">Dimensione del testo
      <select className="mt-2 block w-full rounded border border-slate-500 bg-slate-800 p-3 text-white" value={textSize}
        onChange={(event) => setPreferences({ textSize: event.target.value as 'normal' | 'large' | 'tv' })}>
        <option value="normal">Normale</option><option value="large">Grande</option><option value="tv">Modalità TV (diretta e schermo lontano)</option>
      </select>
    </label>
    <h2 className="text-lg font-bold">Partita</h2>
    {/* Audit fase 8: l'avversario del gioco può muovere da solo; in regia resta al conduttore. */}
    <label className="game-audio-toggle" data-menu-artwork="css">
      <input type="checkbox" checked={autoOpponent.preference} disabled={autoOpponent.blockedByDirector}
        onChange={(event) => setPreferences({ autoOpponent: event.target.checked })} />
      <span>Avversario automatico</span>
    </label>
    <p className="text-sm text-slate-300">{autoOpponent.blockedByDirector
      ? 'Disattivato in modalità regia: con il pubblico collegato o la pausa di regia è il conduttore a far muovere l’avversario.'
      : 'Allenatori e Arkamon selvatici scelgono e giocano la mossa da soli dopo un attimo, senza premere «Turno dell’avversario».'}</p>
    <button type="button" className="arka-button-secondary" onClick={() => setPreferences({ tutorialDone: false })}>Rivedi il tutorial del primo turno</button>
    <p className="text-sm text-slate-300">La memoria ridotta prepara meno pagine contemporaneamente. Dettagli, trasparenza, frame e velocità restano identici.</p>
    <p className="text-sm text-slate-300">Le preferenze vengono ricordate su questo dispositivo. Dadi, turni e regole restano identici; il risultato del colpo viene mostrato prima del KO.</p>
  </section>
}
