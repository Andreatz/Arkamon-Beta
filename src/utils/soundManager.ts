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

function hasAudio(): boolean {
  return typeof window !== 'undefined' && typeof window.AudioContext !== 'undefined'
}

function audioContext(): AudioContext | null {
  if (!hasAudio()) return null
  if (!ctx) ctx = new window.AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function playTone(step: ToneStep, baseDelay = 0, volumeScale = 1): void {
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
  gain.connect(audio.destination)
  oscillator.start(start)
  oscillator.stop(start + duration + 0.02)
}

export function setAudioMuted(nextMuted: boolean): void {
  muted = nextMuted
  if (muted) stopMusic()
}

export function isAudioMuted(): boolean {
  return muted
}

export function playSound(sound: SoundId): void {
  if (muted) return
  for (const step of SOUND_BANK[sound]) playTone(step)
}

export function playMusic(music: MusicId): void {
  if (currentMusic === music || muted) return
  stopMusic()
  currentMusic = music

  const playLoop = () => {
    if (!currentMusic || muted) return
    for (const step of MUSIC_BANK[currentMusic]) playTone(step, 0, 0.45)
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
