/**
 * Motore audio di Arkamon (rifatto il 26 novembre 2026).
 *
 * - Effetti: file OGG generati da `scripts/audio/generate-sfx.py`, decodificati una volta in Web Audio
 *   e suonati con volume, intonazione, panorama e ritardo. Limite di voci e intervallo minimo per id.
 * - Musica: la colonna sonora dell'utente (`public/audio/music`), in streaming con due elementi
 *   `<audio>` che si danno il cambio in dissolvenza. Ogni contesto (titolo, città, battaglia…) ha
 *   una scaletta che ruota da un brano all'altro.
 * - Due canali regolabili dalle Impostazioni: musica ed effetti. Il silenzio ferma tutto subito.
 *
 * Nessuna funzione lancia eccezioni: senza Web Audio (test, browser vecchi) ogni chiamata è inerte.
 */
import musicCatalog from '@/data/audio-music.json'
import type { SfxCategory, SfxId } from '@/audio/sfxIds'
import { assetUrl } from './assetUrl'

export type { SfxId } from '@/audio/sfxIds'

// =============================================================
// Catalogo
// =============================================================

export type MusicContextId = keyof typeof musicCatalog.contexts
export type MusicTrackId = keyof typeof musicCatalog.tracks

interface MusicTrack { title: string; file: string; gain: number; durationS: number }
const TRACKS = musicCatalog.tracks as Record<MusicTrackId, MusicTrack>
const CONTEXTS = musicCatalog.contexts as Record<MusicContextId, MusicTrackId[]>

export const MUSIC_CONTEXTS = Object.keys(CONTEXTS) as MusicContextId[]

export function sfxCategory(id: SfxId): SfxCategory {
  if (id.startsWith('ui.')) return 'ui'
  if (id.startsWith('map.') || id.startsWith('transition.')) return 'map'
  if (id.startsWith('jingle.') || id.startsWith('evolution.')) return 'jingle'
  if (id.startsWith('move.')) return 'move'
  return 'battle'
}

export function sfxUrl(id: SfxId): string {
  return `audio/sfx/${id.replace(/\./g, '-')}.ogg`
}

export function musicTrackUrl(track: MusicTrackId): string {
  return TRACKS[track].file
}

/** Regole fini per i suoni più frequenti: niente raffiche, niente accumuli. */
const SFX_RULES: Partial<Record<SfxId, { cooldownMs?: number; maxVoices?: number; volume?: number }>> = {
  'ui.hover': { cooldownMs: 45, maxVoices: 1, volume: 0.8 },
  'ui.tick': { cooldownMs: 35, maxVoices: 2 },
  'ui.select': { cooldownMs: 40, maxVoices: 2 },
  'ui.tab': { cooldownMs: 50, maxVoices: 1 },
  'ui.page': { cooldownMs: 80, maxVoices: 1 },
  'ui.menu-open': { cooldownMs: 150, maxVoices: 1 },
  'ui.menu-close': { cooldownMs: 150, maxVoices: 1 },
  'ui.dialog': { cooldownMs: 150, maxVoices: 1 },
  'ui.error': { cooldownMs: 150, maxVoices: 1 },
  'map.step': { cooldownMs: 90, maxVoices: 2 },
  'capture.shake': { maxVoices: 1 },
  'dice.roll': { maxVoices: 1 },
  'battle.coin-spin': { maxVoices: 1 },
}
/** Volume di base per categoria, prima del cursore «Effetti». */
const CATEGORY_GAIN: Record<SfxCategory, number> = { ui: 0.7, map: 0.8, battle: 0.9, move: 0.95, jingle: 0.85 }
/** Quanto si abbassa la musica sotto un jingle (0 = silenzio, 1 = invariata). */
const JINGLE_DUCK = 0.22
const DEFAULT_MAX_VOICES = 4

// =============================================================
// Stato
// =============================================================

let muted = false
let musicVolume = 1
let effectsVolume = 1
let ctx: AudioContext | null = null
let effectsBus: GainNode | null = null
const buffers = new Map<SfxId, Promise<AudioBuffer | null>>()
const voices = new Map<SfxId, Set<AudioBufferSourceNode>>()
const lastStart = new Map<SfxId, number>()
/** Suoni chiesti ma non ancora partiti (in decodifica o in ritardo): si possono annullare. */
const pending = new Map<SfxId, Set<() => void>>()

/**
 * Traccia per le verifiche automatiche: se la pagina definisce `window.__arkamonAudioLog = []`,
 * ogni effetto e ogni brano avviato vi aggiunge una voce. Senza l'array non fa nulla.
 */
function trace(kind: 'sfx' | 'music' | 'stop', id: string, delayMs = 0): void {
  const log = (globalThis as { __arkamonAudioLog?: { kind: string; id: string; at: number }[] }).__arkamonAudioLog
  if (Array.isArray(log)) log.push({ kind, id, at: Math.round((typeof performance !== 'undefined' ? performance.now() : 0) + delayMs) })
}

function hasWebAudio(): boolean {
  return typeof window !== 'undefined' && typeof window.AudioContext !== 'undefined'
}

function audioContext(): AudioContext | null {
  if (!hasWebAudio()) return null
  if (!ctx) {
    try { ctx = new window.AudioContext({ latencyHint: 'interactive' }) } catch { return null }
  }
  if (ctx.state === 'suspended') void ctx.resume?.()?.catch?.(() => {})
  return ctx
}

function bus(audio: AudioContext): AudioNode {
  if (effectsBus) return effectsBus
  const gain = audio.createGain()
  gain.gain.value = effectsVolume
  // Un compressore leggero tiene insieme gli strati della battaglia senza saturare.
  const limiter = typeof audio.createDynamicsCompressor === 'function' ? audio.createDynamicsCompressor() : null
  if (limiter) {
    limiter.threshold.value = -10
    limiter.knee.value = 8
    limiter.ratio.value = 6
    limiter.attack.value = 0.003
    limiter.release.value = 0.15
    gain.connect(limiter)
    limiter.connect(audio.destination)
  } else gain.connect(audio.destination)
  effectsBus = gain
  return gain
}

// =============================================================
// Canali, silenzio, sblocco
// =============================================================

export function setChannelVolumes(music: number, effects: number): void {
  const valid = (value: number, fallback: number) => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback
  musicVolume = valid(music, musicVolume)
  effectsVolume = valid(effects, effectsVolume)
  if (ctx && effectsBus) effectsBus.gain.setTargetAtTime(effectsVolume, ctx.currentTime, 0.02)
  music_.refreshVolumes()
}

export function getChannelVolumes(): { music: number; effects: number } {
  return { music: musicVolume, effects: effectsVolume }
}

export function setAudioMuted(nextMuted: boolean): void {
  if (muted === nextMuted) return
  muted = nextMuted
  if (muted) {
    stopAllSfx()
    music_.silence()
  } else music_.resume()
}

export function isAudioMuted(): boolean {
  return muted
}

/** Va chiamata dentro un gesto dell'utente: il browser concede l'audio solo allora. */
export function unlockAudio(): void {
  if (muted) return
  audioContext()
  music_.retryBlocked()
}

// =============================================================
// Effetti
// =============================================================

function loadSfx(id: SfxId): Promise<AudioBuffer | null> {
  const cached = buffers.get(id)
  if (cached) return cached
  const audio = audioContext()
  if (!audio || typeof fetch === 'undefined') return Promise.resolve(null)
  const pending = fetch(assetUrl(sfxUrl(id)))
    .then((response) => (response.ok ? response.arrayBuffer() : Promise.reject(new Error(String(response.status)))))
    .then((data) => audio.decodeAudioData(data))
    .catch(() => { buffers.delete(id); return null })
  buffers.set(id, pending)
  return pending
}

/** Scarica e decodifica in anticipo, così il primo colpo non arriva in ritardo. */
export function preloadSfx(ids: readonly SfxId[]): void {
  if (!hasWebAudio()) return
  for (const id of ids) void loadSfx(id)
}

export interface SfxOptions {
  /** 0–1, moltiplica il volume di categoria e il cursore «Effetti». */
  volume?: number
  /** Velocità di lettura: 1 = originale, 2 = un'ottava sopra. */
  rate?: number
  /** Da -1 (sinistra) a 1 (destra). */
  pan?: number
  delayMs?: number
  /** Abbassa la musica per la durata del suono (i jingle lo fanno da sé). */
  duck?: boolean
}

/** Un suono che arriva troppo tardi è peggio del silenzio: oltre questa attesa si rinuncia. */
const LATE_LIMIT_MS = 260

export function playSfx(id: SfxId, options: SfxOptions = {}): () => void {
  if (muted) return () => {}
  const audio = audioContext()
  if (!audio) return () => {}
  const rule = SFX_RULES[id]
  const now = performance.now()
  if (rule?.cooldownMs && now - (lastStart.get(id) ?? -Infinity) < rule.cooldownMs) return () => {}
  lastStart.set(id, now)
  let cancelled = false
  let source: AudioBufferSourceNode | null = null
  const requested = now
  const waiting = pending.get(id) ?? new Set<() => void>()
  pending.set(id, waiting)
  const cancel = () => {
    cancelled = true
    waiting.delete(cancel)
    try { source?.stop() } catch { /* già finito */ }
  }
  waiting.add(cancel)
  void loadSfx(id).then((buffer) => {
    if (!buffer || cancelled || muted) { waiting.delete(cancel); return }
    const waited = performance.now() - requested
    const delayMs = Math.max(0, (options.delayMs ?? 0) - waited)
    if (!options.delayMs && waited > LATE_LIMIT_MS && sfxCategory(id) !== 'jingle') { waiting.delete(cancel); return }
    source = startBuffer(audio, id, buffer, options, delayMs / 1000)
    const started = source
    started.addEventListener?.('ended', () => waiting.delete(cancel))
  })
  return cancel
}

/** Ferma (o annulla prima che partano) tutti i suoni con questi id. */
export function stopSfx(ids: readonly SfxId[]): void {
  for (const id of ids) {
    if (pending.get(id)?.size) trace('stop', id)
    for (const cancel of [...(pending.get(id) ?? [])]) cancel()
    for (const source of voices.get(id) ?? []) {
      try { source.stop() } catch { /* già finito */ }
    }
  }
}

function startBuffer(audio: AudioContext, id: SfxId, buffer: AudioBuffer, options: SfxOptions, delayS: number): AudioBufferSourceNode {
  const rule = SFX_RULES[id]
  const active = voices.get(id) ?? new Set<AudioBufferSourceNode>()
  voices.set(id, active)
  const maxVoices = rule?.maxVoices ?? DEFAULT_MAX_VOICES
  while (active.size >= maxVoices) {
    const oldest = active.values().next().value as AudioBufferSourceNode
    active.delete(oldest)
    try { oldest.stop() } catch { /* già finito */ }
  }
  const source = audio.createBufferSource()
  source.buffer = buffer
  const rate = Number.isFinite(options.rate) ? Math.max(0.25, Math.min(4, options.rate ?? 1)) : 1
  source.playbackRate.value = rate
  const gain = audio.createGain()
  const category = sfxCategory(id)
  const volume = Number.isFinite(options.volume) ? Math.max(0, Math.min(1.5, options.volume ?? 1)) : 1
  gain.gain.value = volume * CATEGORY_GAIN[category] * (rule?.volume ?? 1)
  let tail: AudioNode = gain
  if (options.pan && typeof audio.createStereoPanner === 'function') {
    const panner = audio.createStereoPanner()
    panner.pan.value = Math.max(-1, Math.min(1, options.pan))
    gain.connect(panner)
    tail = panner
  }
  source.connect(gain)
  tail.connect(bus(audio))
  active.add(source)
  source.onended = () => {
    active.delete(source)
    source.disconnect()
    gain.disconnect()
    if (tail !== gain) tail.disconnect()
  }
  source.start(audio.currentTime + delayS)
  trace('sfx', id, delayS * 1000)
  if (category === 'jingle' || options.duck) music_.duck((buffer.duration / rate) + delayS)
  return source
}

export function stopAllSfx(): void {
  for (const active of voices.values()) {
    for (const source of active) {
      try { source.stop() } catch { /* già finito */ }
    }
    active.clear()
  }
}

// =============================================================
// Musica
// =============================================================

interface Deck {
  el: HTMLAudioElement
  track: MusicTrackId
  /** Livello della dissolvenza, 0–1. */
  level: number
  from: number
  to: number
  fadeStart: number
  fadeMs: number
  handedOff: boolean
  onDone?: () => void
}

/** Le scalette ruotano: due visite di fila in città non ripartono dallo stesso brano. */
const rotation = new Map<MusicContextId, number>()

export function nextTrackFor(context: MusicContextId, current?: MusicTrackId): MusicTrackId {
  const list = CONTEXTS[context]
  if (current && list.includes(current)) return list[(list.indexOf(current) + 1) % list.length]
  const index = rotation.get(context) ?? 0
  rotation.set(context, index + 1)
  return list[index % list.length]
}

const music_ = (() => {
  let context: MusicContextId | null = null
  let pendingContext: MusicContextId | null = null
  let pendingTimer: ReturnType<typeof setTimeout> | null = null
  const decks: Deck[] = []
  let blocked: Deck | null = null
  let duckLevel = 1
  let duckUntil = 0
  let ticker: ReturnType<typeof setInterval> | null = null

  const hasMedia = () => typeof Audio !== 'undefined'
  const clock = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

  function volumeOf(deck: Deck): number {
    return Math.max(0, Math.min(1, musicVolume * TRACKS[deck.track].gain * deck.level * duckLevel))
  }

  function refreshVolumes(): void {
    for (const deck of decks) deck.el.volume = volumeOf(deck)
  }

  function tick(): void {
    const now = clock()
    const target = now < duckUntil ? JINGLE_DUCK : 1
    duckLevel += (target - duckLevel) * (target < duckLevel ? 0.5 : 0.08)
    if (Math.abs(target - duckLevel) < 0.01) duckLevel = target
    for (const deck of [...decks]) {
      const t = deck.fadeMs > 0 ? Math.min(1, (now - deck.fadeStart) / deck.fadeMs) : 1
      deck.level = deck.from + (deck.to - deck.from) * t
      if (t >= 1 && deck.to === 0) retire(deck)
      else if (t >= 1 && deck.onDone) { const done = deck.onDone; deck.onDone = undefined; done() }
    }
    refreshVolumes()
    const fading = decks.some((deck) => deck.level !== deck.to)
    if (!fading && duckLevel === target && now >= duckUntil && ticker !== null) {
      clearInterval(ticker)
      ticker = null
    }
  }

  function ensureTicker(): void {
    if (ticker === null && typeof setInterval !== 'undefined') ticker = setInterval(tick, 30)
  }

  function fadeTo(deck: Deck, to: number, ms: number): void {
    deck.from = deck.level
    deck.to = to
    deck.fadeStart = clock()
    deck.fadeMs = ms
    ensureTicker()
  }

  function retire(deck: Deck): void {
    const index = decks.indexOf(deck)
    if (index >= 0) decks.splice(index, 1)
    deck.el.pause()
    deck.el.removeAttribute('src')
    deck.el.load?.()
    if (blocked === deck) blocked = null
  }

  function play(deck: Deck): void {
    const attempt = deck.el.play?.()
    if (attempt && typeof attempt.catch === 'function') {
      attempt.catch(() => {
        // Autoplay negato prima del primo gesto: si riprova a `unlockAudio`.
        if (decks.includes(deck)) blocked = deck
      })
    }
  }

  function start(track: MusicTrackId, fadeMs: number): void {
    if (!hasMedia() || muted) return
    const el = new Audio(assetUrl(TRACKS[track].file))
    el.preload = 'auto'
    trace('music', track)
    const deck: Deck = { el, track, level: 0, from: 0, to: 1, fadeStart: clock(), fadeMs, handedOff: false }
    el.volume = 0
    // Il brano finisce con un colpo e una breve coda: il successivo entra sul finale.
    el.addEventListener('timeupdate', () => {
      if (deck.handedOff || !Number.isFinite(el.duration) || el.duration - el.currentTime > 0.35) return
      handOff(deck)
    })
    el.addEventListener('ended', () => handOff(deck))
    decks.push(deck)
    if (fadeMs <= 0) { deck.level = 1; deck.to = 1 }
    refreshVolumes()
    play(deck)
    ensureTicker()
  }

  function handOff(deck: Deck): void {
    if (deck.handedOff || !decks.includes(deck)) return
    deck.handedOff = true
    if (context && CONTEXTS[context].includes(deck.track)) start(nextTrackFor(context, deck.track), 60)
    fadeTo(deck, 0, 400)
  }

  function fadeOutAll(ms: number): void {
    for (const deck of decks) if (deck.to !== 0) fadeTo(deck, 0, ms)
  }

  function clearPending(): void {
    if (pendingTimer !== null) clearTimeout(pendingTimer)
    pendingTimer = null
    pendingContext = null
  }

  return {
    get context() { return context },
    set(next: MusicContextId | null, options: { fadeOutMs?: number; fadeInMs?: number; delayMs?: number } = {}): void {
      if (next === context && pendingContext === null) return
      if (next !== null && next === pendingContext) return
      clearPending()
      const previous = context
      context = next
      if (!hasMedia()) return
      fadeOutAll(options.fadeOutMs ?? 700)
      if (next === null || muted) return
      const begin = () => {
        pendingTimer = null
        pendingContext = null
        if (context === next && !muted) start(nextTrackFor(next), options.fadeInMs ?? (previous ? 900 : 1400))
      }
      if (options.delayMs && options.delayMs > 0) {
        pendingContext = next
        pendingTimer = setTimeout(begin, options.delayMs)
      } else begin()
    },
    duck(seconds: number): void {
      if (!decks.length) return
      duckUntil = Math.max(duckUntil, clock() + seconds * 1000)
      ensureTicker()
    },
    refreshVolumes,
    silence(): void {
      clearPending()
      for (const deck of [...decks]) retire(deck)
    },
    resume(): void {
      if (context && !decks.length) start(nextTrackFor(context), 900)
    },
    retryBlocked(): void {
      const deck = blocked
      blocked = null
      if (deck && decks.includes(deck)) play(deck)
    },
    nowPlaying(): MusicTrackId | null {
      return decks.find((deck) => deck.to > 0)?.track ?? null
    },
  }
})()

type MusicOptions = { fadeOutMs?: number; fadeInMs?: number; delayMs?: number }
let sceneContext: MusicContextId | null = null
let overrideContext: MusicContextId | null = null
let pendingOptions: MusicOptions | undefined
let applyQueued = false

/**
 * Applica il contesto effettivo una sola volta per giro: quando una scena esce e la successiva
 * entra nello stesso aggiornamento di React, la musica intermedia non parte nemmeno.
 */
function queueApply(options?: MusicOptions): void {
  pendingOptions = options ?? pendingOptions
  if (applyQueued) return
  applyQueued = true
  queueMicrotask(() => {
    applyQueued = false
    const opts = pendingOptions
    pendingOptions = undefined
    music_.set(overrideContext ?? sceneContext, opts)
  })
}

/** Musica della scena corrente. Lo stesso contesto non riavvia il brano. */
export function setSceneMusic(context: MusicContextId | null, options?: MusicOptions): void {
  sceneContext = context
  queueApply(options)
}

/** Musica che sostituisce temporaneamente quella della scena (vittoria, sconfitta). `null` la toglie. */
export function setMusicOverride(context: MusicContextId | null, options?: MusicOptions): void {
  overrideContext = context
  queueApply(options)
}

export function getMusicContext(): MusicContextId | null {
  return music_.context
}

export function nowPlaying(): { id: MusicTrackId; title: string } | null {
  const id = music_.nowPlaying()
  return id ? { id, title: TRACKS[id].title } : null
}

export function stopMusic(): void {
  sceneContext = null
  overrideContext = null
  music_.set(null, { fadeOutMs: 300 })
}

let auditionEl: HTMLAudioElement | null = null

/** Laboratorio audio: ascolta un brano preciso al posto di quello in corso. `null` lo ferma. */
export function auditionMusicTrack(track: MusicTrackId | null): void {
  auditionEl?.pause()
  auditionEl = null
  if (!track || typeof Audio === 'undefined') return
  music_.set(null, { fadeOutMs: 200 })
  const el = new Audio(assetUrl(TRACKS[track].file))
  el.loop = true
  el.volume = Math.min(1, musicVolume * TRACKS[track].gain)
  auditionEl = el
  void el.play()?.catch?.(() => {})
}

// =============================================================
// Scene → contesto musicale
// =============================================================

export interface MusicSituation {
  scena: string
  /** Luogo della scena (percorso o città), se c'è. */
  luogo?: string
  /** Il luogo è nascosto (leggendari, nascondiglio, Lega di Roma). */
  nascosto?: boolean
  battaglia?: {
    tipo: 'Selvatico' | 'NPC' | 'PVP'
    tipoAllenatore?: 'PVP' | 'NPC' | 'Capopalestra' | 'Superquattro' | 'Campione'
    lega?: boolean
  } | null
}

/** `null`: la scena non cambia musica (menù e deposito tengono quella del luogo). */
export function musicContextFor(situation: MusicSituation): MusicContextId | null {
  switch (situation.scena) {
    case 'titolo': return 'title'
    case 'laboratorio': return 'laboratory'
    case 'mappa-principale': return 'world-map'
    case 'evoluzione': return 'evolution'
    case 'lega': return 'hidden'
    case 'citta':
    case 'palestra':
    case 'centro-pokemon':
      return situation.nascosto ? 'hidden' : 'city'
    case 'percorso': return situation.nascosto ? 'hidden' : 'route'
    case 'battaglia': {
      const battle = situation.battaglia
      if (!battle) return 'battle-wild'
      if (battle.tipoAllenatore === 'Campione') return 'battle-champion'
      if (battle.tipoAllenatore === 'Superquattro' || battle.lega) return 'battle-elite'
      if (battle.tipoAllenatore === 'Capopalestra') return 'battle-gym'
      if (battle.tipo === 'Selvatico') return 'battle-wild'
      if (battle.tipo === 'PVP') return 'battle-pvp'
      return 'battle-trainer'
    }
    default: return null
  }
}
