import { describe, expect, it } from 'vitest'
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
})
