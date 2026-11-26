import { useMemo, useState } from 'react'
import sfxCatalog from '@/data/audio-sfx.json'
import musicCatalog from '@/data/audio-music.json'
import { MOVE_VFX_ASSIGNMENTS } from '../vfx/moveVfxAssignments'
import { moveSoundFor } from '@/audio/moveSounds'
import { auditionMusicTrack, playSfx, unlockAudio, type MusicTrackId, type SfxId } from '@/utils/soundManager'

/**
 * Laboratorio audio (dev.html#audio-lab): ascolta ogni effetto generato, ogni brano e la scaletta
 * di ogni contesto, e verifica quale suono riceve ogni mossa. Gli effetti si rigenerano con
 * `python3 scripts/audio/generate-sfx.py`.
 */

const CATEGORY_LABEL: Record<string, string> = {
  ui: 'Interfaccia', map: 'Mappa e transizioni', battle: 'Battaglia', jingle: 'Jingle', move: 'Mosse (elemento × potenza)',
}
const CONTEXT_LABEL: Record<string, string> = {
  title: 'Titolo', laboratory: 'Laboratorio', 'world-map': 'Mappa principale', city: 'Città', route: 'Percorsi',
  hidden: 'Luoghi nascosti e Lega', evolution: 'Evoluzione', 'battle-wild': 'Battaglia: selvatici',
  'battle-trainer': 'Battaglia: allenatori', 'battle-pvp': 'Battaglia: PvP e Sfide', 'battle-gym': 'Battaglia: Capipalestra',
  'battle-elite': 'Battaglia: Superquattro', 'battle-champion': 'Battaglia: Campione', victory: 'Vittoria', defeat: 'Sconfitta',
}
const BUTTON = 'rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-left text-sm hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300'

type SfxEntry = { file: string; category: string; durationMs: number; description: string }

export function SoundLab() {
  const sounds = sfxCatalog.sounds as Record<string, SfxEntry>
  const [playing, setPlaying] = useState<MusicTrackId | null>(null)
  const [moveQuery, setMoveQuery] = useState('')
  const groups = useMemo(() => {
    const out = new Map<string, [string, SfxEntry][]>()
    for (const entry of Object.entries(sounds)) out.set(entry[1].category, [...(out.get(entry[1].category) ?? []), entry])
    return out
  }, [sounds])
  const moves = useMemo(() => {
    const q = moveQuery.trim().toLocaleLowerCase('it')
    return MOVE_VFX_ASSIGNMENTS.filter((move) => !q || move.name.toLocaleLowerCase('it').includes(q)).slice(0, 40)
  }, [moveQuery])
  const play = (id: SfxId, rate = 1) => { unlockAudio(); playSfx(id, { rate }) }
  const audition = (track: MusicTrackId | null) => { unlockAudio(); auditionMusicTrack(track); setPlaying(track) }

  return <main className="h-full overflow-y-auto bg-slate-950 p-6 text-slate-100">
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-black">Suoni</h1>
        <p className="text-slate-300">{Object.keys(sounds).length} effetti sintetizzati · {Object.keys(musicCatalog.tracks).length} brani della colonna sonora</p>
      </div>
      {playing && <button type="button" className={BUTTON} onClick={() => audition(null)}>■ Ferma la musica</button>}
    </header>

    <section aria-labelledby="music-heading" className="mb-8">
      <h2 id="music-heading" className="mb-3 text-xl font-bold">Musica per contesto</h2>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {Object.entries(musicCatalog.contexts).map(([context, tracks]) => <div key={context} className="rounded-xl border border-slate-700 p-3">
          <h3 className="mb-2 font-bold">{CONTEXT_LABEL[context] ?? context}</h3>
          <ul className="space-y-1">{(tracks as MusicTrackId[]).map((track) => <li key={track}>
            <button type="button" className={`${BUTTON} w-full`} aria-pressed={playing === track} onClick={() => audition(playing === track ? null : track)}>
              {playing === track ? '■' : '▶'} {musicCatalog.tracks[track].title}
              <span className="ml-2 text-xs text-slate-400">{musicCatalog.tracks[track].bpm} bpm · {musicCatalog.tracks[track].key}</span>
            </button>
          </li>)}</ul>
        </div>)}
      </div>
    </section>

    {[...groups.entries()].map(([category, entries]) => <section key={category} className="mb-8" aria-labelledby={`sfx-${category}`}>
      <h2 id={`sfx-${category}`} className="mb-3 text-xl font-bold">{CATEGORY_LABEL[category] ?? category}</h2>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {entries.map(([id, entry]) => <li key={id}>
          <button type="button" data-sfx="none" className={`${BUTTON} w-full`} onClick={() => play(id as SfxId)}>
            <span className="block font-mono text-xs text-amber-200">{id}</span>
            <span className="block">{entry.description}</span>
            <span className="text-xs text-slate-400">{(entry.durationMs / 1000).toFixed(2)} s</span>
          </button>
        </li>)}
      </ul>
    </section>)}

    <section aria-labelledby="moves-heading" className="mb-8">
      <h2 id="moves-heading" className="mb-3 text-xl font-bold">Suono di ogni mossa</h2>
      <label className="mb-3 block text-sm">Cerca una mossa{' '}
        <input className="ml-2 rounded border border-slate-600 bg-slate-900 px-2 py-1" value={moveQuery} onChange={(event) => setMoveQuery(event.target.value)} />
      </label>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {moves.map((move) => {
          const sound = moveSoundFor({ id: move.gameMoveId ?? move.sourceMoveId, tipo: move.element, effetto: null }, move.tier, move.type)
          return <li key={move.sourceMoveId}>
            <button type="button" data-sfx="none" className={`${BUTTON} w-full`} onClick={() => play(sound.id, sound.rate)}>
              <span className="block font-bold">{move.name}</span>
              <span className="text-xs text-slate-400">{move.type} · {move.tier} → <span className="font-mono text-amber-200">{sound.id}</span> · ×{sound.rate.toFixed(3)} · {sound.cue === 'impact' ? 'all\'impatto' : 'all\'avvio'}</span>
            </button>
          </li>
        })}
      </ul>
    </section>
  </main>
}
