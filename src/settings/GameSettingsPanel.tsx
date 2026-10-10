import { useGameStore } from '@/store/gameStore'
import { useGamePreferences } from './gamePreferences'

export function GameSettingsPanel() {
  const musicVolume = useGamePreferences((state) => state.musicVolume)
  const effectsVolume = useGamePreferences((state) => state.effectsVolume)
  const animationSpeed = useGamePreferences((state) => state.animationSpeed)
  const reducedMotion = useGamePreferences((state) => state.reducedMotion)
  const setPreferences = useGamePreferences((state) => state.setPreferences)
  const muted = useGameStore((state) => state.audioMuted)
  const setMuted = useGameStore((state) => state.setAudioMuted)
  return <section aria-label="Impostazioni del gioco" className="space-y-5">
    <h3 className="text-lg font-bold">Suoni e animazioni</h3>
    <label className="flex items-center gap-3"><input type="checkbox" checked={!muted} onChange={(event) => setMuted(!event.target.checked)} /> Audio attivo</label>
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
    <p className="text-sm text-slate-300">Le preferenze vengono ricordate su questo dispositivo. Dadi, turni e regole restano identici; il risultato del colpo viene mostrato prima del KO.</p>
  </section>
}
