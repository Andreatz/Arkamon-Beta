import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import sfxCatalog from '@/data/audio-sfx.json'
import musicCatalog from '@/data/audio-music.json'
import { SFX_IDS } from '@/audio/sfxIds'
import {
  isAudioMuted,
  musicContextFor,
  MUSIC_CONTEXTS,
  nextTrackFor,
  playSfx,
  setAudioMuted,
  setMusicOverride,
  setSceneMusic,
  sfxCategory,
  sfxUrl,
  type MusicTrackId,
} from '@/utils/soundManager'

describe('catalogo audio', () => {
  it('ha un identificatore TypeScript per ogni effetto generato, e viceversa', () => {
    expect([...SFX_IDS].sort()).toEqual(Object.keys(sfxCatalog.sounds).sort())
  })

  it('trova su disco ogni effetto e ogni brano', () => {
    for (const id of SFX_IDS) {
      expect(sfxUrl(id)).toBe((sfxCatalog.sounds as Record<string, { file: string }>)[id].file)
      expect(existsSync(resolve('public', sfxUrl(id))), id).toBe(true)
    }
    for (const track of Object.values(musicCatalog.tracks)) expect(existsSync(resolve('public', track.file)), track.file).toBe(true)
  })

  it('usa ogni brano della colonna sonora in almeno un contesto', () => {
    const used = new Set(Object.values(musicCatalog.contexts).flat())
    expect([...used].sort()).toEqual(Object.keys(musicCatalog.tracks).sort())
    for (const track of Object.values(musicCatalog.tracks)) expect(track.gain).toBeGreaterThan(0.7)
  })

  it('non contiene più la libreria di suoni di provenienza incerta', () => {
    expect(existsSync(resolve('src/data/audio-selections.json'))).toBe(false)
    const source = readFileSync(resolve('src/utils/soundManager.ts'), 'utf8')
    expect(source).not.toMatch(/sounds\/Part|audio\/selected/)
  })

  it('classifica gli effetti per canale', () => {
    expect(sfxCategory('ui.hover')).toBe('ui')
    expect(sfxCategory('transition.whoosh')).toBe('map')
    expect(sfxCategory('evolution.charge')).toBe('jingle')
    expect(sfxCategory('move.fuoco.heavy')).toBe('move')
    expect(sfxCategory('capture.shake')).toBe('battle')
  })
})

describe('musica per scena', () => {
  it('assegna un contesto a ogni scena e lascia suonare quella del luogo nei menù', () => {
    expect(musicContextFor({ scena: 'titolo' })).toBe('title')
    expect(musicContextFor({ scena: 'laboratorio' })).toBe('laboratory')
    expect(musicContextFor({ scena: 'mappa-principale' })).toBe('world-map')
    expect(musicContextFor({ scena: 'citta', luogo: 'Venezia' })).toBe('city')
    expect(musicContextFor({ scena: 'percorso', luogo: 'Percorso_1' })).toBe('route')
    expect(musicContextFor({ scena: 'percorso', luogo: 'x', nascosto: true })).toBe('hidden')
    expect(musicContextFor({ scena: 'lega' })).toBe('hidden')
    expect(musicContextFor({ scena: 'evoluzione' })).toBe('evolution')
    expect(musicContextFor({ scena: 'deposito' })).toBeNull()
    expect(musicContextFor({ scena: 'squadra' })).toBeNull()
  })

  it('distingue le battaglie per avversario', () => {
    const battle = (tipo: 'Selvatico' | 'NPC' | 'PVP', tipoAllenatore?: 'PVP' | 'NPC' | 'Capopalestra' | 'Superquattro' | 'Campione', lega = false) =>
      musicContextFor({ scena: 'battaglia', battaglia: { tipo, tipoAllenatore, lega } })
    expect(battle('Selvatico')).toBe('battle-wild')
    expect(battle('NPC', 'NPC')).toBe('battle-trainer')
    expect(battle('PVP')).toBe('battle-pvp')
    expect(battle('NPC', 'Capopalestra')).toBe('battle-gym')
    expect(battle('PVP', 'Capopalestra')).toBe('battle-gym')
    expect(battle('NPC', 'Superquattro')).toBe('battle-elite')
    expect(battle('NPC', 'NPC', true)).toBe('battle-elite')
    expect(battle('NPC', 'Campione', true)).toBe('battle-champion')
    for (const context of MUSIC_CONTEXTS) expect(musicCatalog.contexts[context].length).toBeGreaterThan(0)
  })

  it('fa ruotare le scalette e passa al brano successivo a fine brano', () => {
    const first = nextTrackFor('city')
    const second = nextTrackFor('city')
    expect(first).not.toBe(second)
    expect(nextTrackFor('city', 'pixel-pulse' as MusicTrackId)).toBe('8-bit-groove-2')
    expect(nextTrackFor('title', 'pixel-adventure' as MusicTrackId)).toBe('pixel-adventure')
  })
})

describe('motore audio senza browser', () => {
  it('silenzio e riproduzione sono no-op sicuri in Vitest', () => {
    setAudioMuted(true)
    expect(isAudioMuted()).toBe(true)
    expect(() => playSfx('ui.select')).not.toThrow()
    setAudioMuted(false)
    expect(isAudioMuted()).toBe(false)
    expect(() => playSfx('move.acqua.heavy', { rate: 9, pan: -4, volume: Number.NaN })).not.toThrow()
    expect(() => { setSceneMusic('route'); setMusicOverride('victory'); setMusicOverride(null) }).not.toThrow()
  })

  it('sblocca Web Audio sul gesto utente e tollera un rifiuto del browser', async () => {
    vi.resetModules()
    const resume = vi.fn().mockRejectedValue(new Error('autoplay denied'))
    const construct = vi.fn()
    class FakeContext {
      state = 'suspended'
      resume = resume
      constructor() { construct() }
    }
    vi.stubGlobal('window', { AudioContext: FakeContext })
    try {
      const audio = await import('../soundManager')
      audio.setAudioMuted(true)
      audio.unlockAudio()
      expect(construct).not.toHaveBeenCalled()
      audio.setAudioMuted(false)
      audio.unlockAudio()
      expect(construct).toHaveBeenCalledOnce()
      expect(resume).toHaveBeenCalledOnce()
      await Promise.resolve()
    } finally { vi.unstubAllGlobals() }
  })

  it('decodifica una volta, rispetta il limite di voci e ferma tutto quando si toglie l’audio', async () => {
    vi.resetModules()
    const sources: { start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn>; playbackRate: { value: number }; onended: (() => void) | null }[] = []
    const decode = vi.fn(async () => ({ duration: 0.2 }))
    const node = () => ({ connect: vi.fn(), disconnect: vi.fn() })
    class FakeContext {
      state = 'running'
      currentTime = 3
      destination = {}
      decodeAudioData = decode
      createGain() { return { ...node(), gain: { value: 1, setTargetAtTime: vi.fn() } } }
      createStereoPanner() { return { ...node(), pan: { value: 0 } } }
      createBufferSource() {
        const source = { ...node(), buffer: null, start: vi.fn(), stop: vi.fn(), playbackRate: { value: 1 }, onended: null as (() => void) | null }
        sources.push(source)
        return source
      }
    }
    const fetchMock = vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }))
    vi.stubGlobal('window', { AudioContext: FakeContext })
    vi.stubGlobal('fetch', fetchMock)
    try {
      const audio = await import('../soundManager')
      for (let i = 0; i < 6; i++) audio.playSfx('dice.land', { rate: 1.2 })
      await new Promise((done) => setTimeout(done, 0))
      expect(fetchMock).toHaveBeenCalledOnce()
      expect(decode).toHaveBeenCalledOnce()
      expect(sources).toHaveLength(6)
      // Quattro voci al massimo: le due più vecchie sono state fermate.
      expect(sources.filter((source) => source.stop.mock.calls.length > 0)).toHaveLength(2)
      expect(sources[5].playbackRate.value).toBe(1.2)
      expect(sources[5].start).toHaveBeenCalledWith(3)
      audio.setAudioMuted(true)
      expect(sources.slice(2).every((source) => source.stop.mock.calls.length > 0)).toBe(true)
      audio.playSfx('dice.land')
      await new Promise((done) => setTimeout(done, 0))
      expect(sources).toHaveLength(6)
    } finally { vi.unstubAllGlobals() }
  })

  it('non ripete il passaggio del mouse in una raffica', async () => {
    vi.resetModules()
    const sources: unknown[] = []
    class FakeContext {
      state = 'running'
      currentTime = 0
      destination = {}
      decodeAudioData = async () => ({ duration: 0.02 })
      createGain() { return { connect: vi.fn(), disconnect: vi.fn(), gain: { value: 1 } } }
      createBufferSource() { const source = { connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn(), playbackRate: { value: 1 }, onended: null }; sources.push(source); return source }
    }
    vi.stubGlobal('window', { AudioContext: FakeContext })
    vi.stubGlobal('fetch', async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }))
    try {
      const audio = await import('../soundManager')
      audio.playSfx('ui.hover'); audio.playSfx('ui.hover'); audio.playSfx('ui.hover')
      await new Promise((done) => setTimeout(done, 0))
      expect(sources).toHaveLength(1)
    } finally { vi.unstubAllGlobals() }
  })
})
