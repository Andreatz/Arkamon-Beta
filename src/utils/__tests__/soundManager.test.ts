import { describe, expect, it, vi } from 'vitest'
import {
  AUDIO_EVENTI,
  isAudioMuted,
  musicForScene,
  playSound,
  setAudioMuted,
} from '@/utils/soundManager'

describe('soundManager', () => {
  it('mappa le scene sulla musica corretta', () => {
    expect(musicForScene('titolo')).toBe('title')
    expect(musicForScene('laboratorio')).toBe('title')
    expect(musicForScene('battaglia')).toBe('battle')
    expect(musicForScene('evoluzione')).toBe('evolution')
    expect(musicForScene('mappa-griglia')).toBe('map')
  })

  it('espone gli eventi sonori richiesti dalla roadmap audio', () => {
    expect(AUDIO_EVENTI).toEqual([
      'click',
      'battle-start',
      'hit',
      'ko',
      'capture',
      'victory',
      'level-up',
      'evolution',
    ])
  })

  it('gestisce mute e playSound come no-op sicuro in Vitest', () => {
    setAudioMuted(true)
    expect(isAudioMuted()).toBe(true)
    expect(() => playSound('click')).not.toThrow()
    setAudioMuted(false)
    expect(isAudioMuted()).toBe(false)
  })

  it('sblocca Web Audio sul gesto utente e gestisce un rifiuto del browser', async () => {
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

  it('interrompe subito anche i toni musicali già programmati quando viene disattivato l’audio', async () => {
    vi.resetModules()
    const oscillators: { stop: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn>; onended: (() => void) | null }[] = []
    const gains: { disconnect: ReturnType<typeof vi.fn> }[] = []
    const clearInterval = vi.fn()
    class FakeContext {
      state = 'running'
      currentTime = 10
      destination = {}
      createOscillator() {
        const oscillator = { type: 'sine', frequency: { setValueAtTime: vi.fn() },
          connect: vi.fn(), start: vi.fn(), stop: vi.fn(), disconnect: vi.fn(), onended: null as (() => void) | null }
        oscillators.push(oscillator)
        return oscillator
      }
      createGain() {
        const gain = { gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn(), disconnect: vi.fn() }
        gains.push(gain)
        return gain
      }
    }
    vi.stubGlobal('window', { AudioContext: FakeContext, setInterval: vi.fn().mockReturnValue(7), clearInterval })
    try {
      const audio = await import('../soundManager')
      audio.playMusic('title')
      expect(oscillators).toHaveLength(3)
      audio.setAudioMuted(true)
      expect(clearInterval).toHaveBeenCalledWith(7)
      for (const oscillator of oscillators) {
        // The first stop schedules the normal end; the second cancels it now.
        expect(oscillator.stop.mock.calls).toEqual([[expect.any(Number)], []])
        expect(oscillator.disconnect).toHaveBeenCalledOnce()
        expect(oscillator.onended).toBeNull()
      }
      for (const gain of gains) expect(gain.disconnect).toHaveBeenCalledOnce()
      audio.playMusic('battle')
      expect(oscillators).toHaveLength(3)
    } finally { vi.unstubAllGlobals() }
  })

  it('rilascia un tono finito e cancella solo la melodia attiva quando cambia scena', async () => {
    vi.resetModules()
    const oscillators: { stop: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn>; onended: (() => void) | null }[] = []
    class FakeContext {
      state = 'running'
      currentTime = 0
      destination = {}
      createOscillator() {
        const oscillator = { type: 'sine', frequency: { setValueAtTime: vi.fn() }, connect: vi.fn(),
          start: vi.fn(), stop: vi.fn(), disconnect: vi.fn(), onended: null as (() => void) | null }
        oscillators.push(oscillator)
        return oscillator
      }
      createGain() {
        return { gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn(), disconnect: vi.fn() }
      }
    }
    vi.stubGlobal('window', { AudioContext: FakeContext, setInterval: vi.fn(), clearInterval: vi.fn() })
    try {
      const audio = await import('../soundManager')
      audio.playMusic('title')
      oscillators[0].onended?.()
      audio.playMusic('battle')
      expect(oscillators).toHaveLength(7)
      expect(oscillators[0].stop).toHaveBeenCalledOnce()
      expect(oscillators[0].disconnect).toHaveBeenCalledOnce()
      for (const oscillator of oscillators.slice(1, 3)) expect(oscillator.stop).toHaveBeenCalledTimes(2)
      audio.stopMusic()
      for (const oscillator of oscillators.slice(3)) expect(oscillator.disconnect).toHaveBeenCalledOnce()
    } finally { vi.unstubAllGlobals() }
  })
})
