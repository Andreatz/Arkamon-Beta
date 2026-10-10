import selections from '@/data/audio-selections.json'
import { assetUrl } from './assetUrl'

const activeClips = new Map<HTMLAudioElement, number>()
let musicVolume = 1
let effectsVolume = 1
export function playSelectedAudio(key: string): () => void {
  const choice = (selections.choices as Record<string, { soundId: string; volume: number }>)[key]
  const clip = choice && (selections.sounds as Record<string, { src: string }>)[choice.soundId]
  if (muted || !clip || typeof Audio === 'undefined') return () => {}
  const player = new Audio(assetUrl(clip.src))
  player.volume = Math.max(0, Math.min(1, choice.volume * effectsVolume))
  const stop = () => { player.pause(); activeClips.delete(player) }
  // Bound overlapping effects during rapid UI input.
  if (activeClips.size >= 8) { const oldest = activeClips.keys().next().value; oldest?.pause(); if (oldest) activeClips.delete(oldest) }
  activeClips.set(player, choice.volume)
  player.onended = stop
  player.onerror = stop
  void player.play().catch(stop)
  return stop
}

export type SoundId =
  | 'click'
  | 'battle-start'
  | 'hit'
  | 'ko'
  | 'capture'
  | 'victory'
  | 'level-up'
  | 'evolution'

export type MusicId = 'title' | 'map' | 'battle' | 'evolution'

type WaveType = OscillatorType

interface ToneStep {
  frequency: number
  duration: number
  delay?: number
  type?: WaveType
  gain?: number
}

const SOUND_BANK: Record<SoundId, ToneStep[]> = {
  click: [{ frequency: 620, duration: 0.045, type: 'square', gain: 0.035 }],
  'battle-start': [
    { frequency: 196, duration: 0.08, type: 'sawtooth', gain: 0.055 },
    { frequency: 247, duration: 0.08, delay: 0.08, type: 'sawtooth', gain: 0.055 },
    { frequency: 330, duration: 0.14, delay: 0.16, type: 'sawtooth', gain: 0.06 },
  ],
  hit: [
    { frequency: 130, duration: 0.055, type: 'sawtooth', gain: 0.08 },
    { frequency: 92, duration: 0.07, delay: 0.035, type: 'square', gain: 0.06 },
  ],
  ko: [
    { frequency: 220, duration: 0.12, type: 'triangle', gain: 0.055 },
    { frequency: 165, duration: 0.14, delay: 0.11, type: 'triangle', gain: 0.055 },
    { frequency: 110, duration: 0.2, delay: 0.24, type: 'triangle', gain: 0.055 },
  ],
  capture: [
    { frequency: 523, duration: 0.08, type: 'triangle', gain: 0.05 },
    { frequency: 659, duration: 0.08, delay: 0.09, type: 'triangle', gain: 0.05 },
    { frequency: 784, duration: 0.16, delay: 0.18, type: 'triangle', gain: 0.06 },
  ],
  victory: [
    { frequency: 392, duration: 0.1, type: 'square', gain: 0.045 },
    { frequency: 523, duration: 0.1, delay: 0.1, type: 'square', gain: 0.045 },
    { frequency: 659, duration: 0.12, delay: 0.2, type: 'square', gain: 0.045 },
    { frequency: 784, duration: 0.22, delay: 0.32, type: 'square', gain: 0.045 },
  ],
  'level-up': [
    { frequency: 440, duration: 0.07, type: 'triangle', gain: 0.045 },
    { frequency: 554, duration: 0.07, delay: 0.07, type: 'triangle', gain: 0.045 },
    { frequency: 659, duration: 0.12, delay: 0.14, type: 'triangle', gain: 0.05 },
  ],
  evolution: [
    { frequency: 330, duration: 0.12, type: 'sine', gain: 0.04 },
    { frequency: 440, duration: 0.12, delay: 0.12, type: 'sine', gain: 0.04 },
    { frequency: 660, duration: 0.18, delay: 0.24, type: 'sine', gain: 0.045 },
    { frequency: 880, duration: 0.28, delay: 0.42, type: 'sine', gain: 0.045 },
  ],
}

const MUSIC_BANK: Record<MusicId, ToneStep[]> = {
  title: [
    { frequency: 196, duration: 0.2 },
    { frequency: 247, duration: 0.2, delay: 0.25 },
    { frequency: 294, duration: 0.35, delay: 0.5 },
  ],
  map: [
    { frequency: 262, duration: 0.16 },
    { frequency: 330, duration: 0.16, delay: 0.22 },
    { frequency: 392, duration: 0.22, delay: 0.44 },
  ],
  battle: [
    { frequency: 110, duration: 0.08, type: 'square' },
    { frequency: 147, duration: 0.08, delay: 0.14, type: 'square' },
    { frequency: 165, duration: 0.08, delay: 0.28, type: 'square' },
    { frequency: 220, duration: 0.1, delay: 0.42, type: 'square' },
  ],
  evolution: [
    { frequency: 330, duration: 0.25 },
    { frequency: 494, duration: 0.25, delay: 0.3 },
    { frequency: 659, duration: 0.4, delay: 0.6 },
  ],
}

let ctx: AudioContext | null = null
let muted = false
let currentMusic: MusicId | null = null
let musicTimer: number | null = null
let musicBus: GainNode | null = null
let effectsBus: GainNode | null = null
const activeTones = new Map<OscillatorNode, { gain: GainNode; music: boolean }>()

export function setChannelVolumes(music: number, effects: number): void {
  const valid = (value: number, fallback: number) => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback
  musicVolume = valid(music, musicVolume)
  effectsVolume = valid(effects, effectsVolume)
  if (ctx) {
    musicBus?.gain.setValueAtTime(musicVolume, ctx.currentTime)
    effectsBus?.gain.setValueAtTime(effectsVolume, ctx.currentTime)
  }
  for (const [clip, baseVolume] of activeClips) clip.volume = Math.max(0, Math.min(1, baseVolume * effectsVolume))
}

function channelBus(audio: AudioContext, music: boolean): GainNode {
  const existing = music ? musicBus : effectsBus
  if (existing) return existing
  const bus = audio.createGain()
  bus.gain.setValueAtTime(music ? musicVolume : effectsVolume, audio.currentTime)
  bus.connect(audio.destination)
  if (music) musicBus = bus
  else effectsBus = bus
  return bus
}

function releaseTone(oscillator: OscillatorNode): void {
  const tone = activeTones.get(oscillator)
  if (!tone) return
  activeTones.delete(oscillator)
  oscillator.onended = null
  oscillator.disconnect()
  tone.gain.disconnect()
}

function stopTones(musicOnly = false): void {
  for (const [oscillator, tone] of activeTones) {
    if (musicOnly && !tone.music) continue
    // Stop also cancels tones scheduled for a future point in the melody.
    try { oscillator.stop() } catch { /* A tone may have just ended. */ }
    releaseTone(oscillator)
  }
}

function hasAudio(): boolean {
  return typeof window !== 'undefined' && typeof window.AudioContext !== 'undefined'
}

function audioContext(): AudioContext | null {
  if (!hasAudio()) return null
  if (!ctx) ctx = new window.AudioContext()
  if (ctx.state === 'suspended') void ctx.resume().catch(() => {})
  return ctx
}

/** Resume Web Audio inside the input gesture; HTML audio clicks do not unlock it. */
export function unlockAudio(): void {
  if (!muted) audioContext()
}

function playTone(step: ToneStep, baseDelay = 0, volumeScale = 1, music = false): void {
  const audio = audioContext()
  if (!audio || muted) return

  const start = audio.currentTime + baseDelay + (step.delay ?? 0)
  const duration = Math.max(0.02, step.duration)
  const oscillator = audio.createOscillator()
  const gain = audio.createGain()

  oscillator.type = step.type ?? 'sine'
  oscillator.frequency.setValueAtTime(step.frequency, start)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime((step.gain ?? 0.025) * volumeScale, start + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  oscillator.connect(gain)
  gain.connect(channelBus(audio, music))
  activeTones.set(oscillator, { gain, music })
  oscillator.onended = () => releaseTone(oscillator)
  oscillator.start(start)
  oscillator.stop(start + duration + 0.02)
}

export function setAudioMuted(nextMuted: boolean): void {
  muted = nextMuted
  if (muted) { stopMusic(); stopTones(); for (const clip of activeClips.keys()) clip.pause(); activeClips.clear() }
}

export function isAudioMuted(): boolean {
  return muted
}

export function playSound(sound: SoundId): void {
  if (muted) return
  if (selections.choices[`event:${sound}`]) { playSelectedAudio(`event:${sound}`); return }
  for (const step of SOUND_BANK[sound]) playTone(step)
}

export function playMusic(music: MusicId): void {
  if (currentMusic === music || muted) return
  stopMusic()
  currentMusic = music

  const playLoop = () => {
    if (!currentMusic || muted) return
    for (const step of MUSIC_BANK[currentMusic]) playTone(step, 0, 0.45, true)
  }

  playLoop()
  musicTimer = window.setInterval(playLoop, 3800)
}

export function stopMusic(): void {
  if (musicTimer !== null && typeof window !== 'undefined') {
    window.clearInterval(musicTimer)
  }
  musicTimer = null
  currentMusic = null
  stopTones(true)
}

export function musicForScene(scene: string): MusicId {
  if (scene === 'titolo' || scene === 'laboratorio') return 'title'
  if (scene === 'battaglia') return 'battle'
  if (scene === 'evoluzione') return 'evolution'
  return 'map'
}

export const AUDIO_EVENTI: SoundId[] = [
  'click',
  'battle-start',
  'hit',
  'ko',
  'capture',
  'victory',
  'level-up',
  'evolution',
]
