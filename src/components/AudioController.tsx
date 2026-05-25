import { useEffect } from 'react'
import { useGameStore } from '@store/gameStore'
import {
  musicForScene,
  playMusic,
  playSound,
  setAudioMuted,
  stopMusic,
} from '@/utils/soundManager'

export function AudioController() {
  const scena = useGameStore((s) => s.scenaCorrente.scena)
  const audioMuted = useGameStore((s) => s.audioMuted)
  const setMutedStore = useGameStore((s) => s.setAudioMuted)

  useEffect(() => {
    setAudioMuted(audioMuted)
    if (audioMuted) {
      stopMusic()
      return
    }
    playMusic(musicForScene(scena))
  }, [audioMuted, scena])

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target
      if (target instanceof Element && target.closest('button')) {
        playSound('click')
      }
    }

    window.addEventListener('pointerdown', onPointerDown)
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [])

  return (
    <button
      type="button"
      className="fixed bottom-4 right-4 z-50 rounded-md border border-white/15 bg-black/70 px-3 py-2 text-xs font-bold text-white shadow-xl backdrop-blur transition hover:bg-black/85"
      onClick={() => setMutedStore(!audioMuted)}
      aria-pressed={!audioMuted}
      title={audioMuted ? 'Audio disattivato' : 'Audio attivo'}
    >
      {audioMuted ? 'Audio OFF' : 'Audio ON'}
    </button>
  )
}
