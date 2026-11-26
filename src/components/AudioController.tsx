import { useSceneNavigation } from '@/components/transitions/SceneNavigationContext'
import { useEffect } from 'react'
import { useGameStore } from '@store/gameStore'
import { getAllenatore } from '@data/index'
import { isHiddenLocation, SECRET_LOCATION_ID } from '@/data/secretLocation'
import {
  musicContextFor,
  playSfx,
  preloadSfx,
  setAudioMuted,
  setChannelVolumes,
  setSceneMusic,
  stopAllSfx,
  stopMusic,
  unlockAudio,
  type SfxId,
} from '@/utils/soundManager'
import { clickSfxFor, INTERACTIVE } from '@/audio/uiSounds'
import { useGamePreferences } from '@/settings/gamePreferences'

/** Effetti dell'interfaccia e della mappa: leggeri, servono da subito. */
const BOOT_SFX: SfxId[] = [
  'ui.hover', 'ui.select', 'ui.confirm', 'ui.back', 'ui.error', 'ui.tab', 'ui.page', 'ui.toggle-on', 'ui.toggle-off',
  'ui.tick', 'ui.menu-open', 'ui.menu-close', 'ui.dialog', 'ui.notify', 'ui.start', 'transition.whoosh',
]
const MAP_SFX: SfxId[] = ['map.select', 'map.travel', 'map.step', 'map.arrive', 'map.enter', 'map.turn', 'map.encounter', 'map.blocked',
  'ui.coins', 'ui.purchase', 'jingle.item', 'jingle.heal', 'jingle.medal', 'battle.heal', 'battle.encounter']
function isEditableTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA)$/.test(target.tagName))
}

export function AudioController() {
  const navigation = useSceneNavigation()
  const scena = navigation.scena
  const luogo = typeof navigation.payload?.luogo === 'string' ? navigation.payload.luogo : undefined
  const audioMuted = useGameStore((s) => s.audioMuted)
  const battleType = useGameStore((s) => s.battaglia?.tipo)
  const trainerType = useGameStore((s) => s.battaglia?.leagueOpponent?.tipo
    ?? (s.battaglia?.allenatoreId !== undefined ? getAllenatore(s.battaglia.allenatoreId)?.tipo : undefined))
  const league = useGameStore((s) => !!s.battaglia?.leagueBattle)
  const musicVolume = useGamePreferences((s) => s.musicVolume)
  const effectsVolume = useGamePreferences((s) => s.effectsVolume)

  useEffect(() => { setChannelVolumes(musicVolume, effectsVolume) }, [musicVolume, effectsVolume])

  useEffect(() => { setAudioMuted(audioMuted) }, [audioMuted])

  // Musica della scena. Menù e deposito (contesto `null`) lasciano suonare quella del luogo.
  useEffect(() => {
    const context = musicContextFor({
      scena, luogo,
      nascosto: !!luogo && (isHiddenLocation(luogo) || luogo === SECRET_LOCATION_ID),
      battaglia: battleType ? { tipo: battleType, tipoAllenatore: trainerType, lega: league } : null,
    })
    if (context) setSceneMusic(context)
    if (scena !== 'titolo' && scena !== 'laboratorio') preloadSfx(MAP_SFX)
  }, [scena, luogo, battleType, trainerType, league])

  // Suoni dell'interfaccia, delegati: ogni pulsante del gioco suona senza toccarne il codice.
  useEffect(() => {
    preloadSfx(BOOT_SFX)
    let hovered: Element | null = null
    let keyboard = false
    const onPointerDown = (event: PointerEvent) => {
      keyboard = false
      unlockAudio()
      if (event.button !== 0 || !(event.target instanceof Element)) return
      const sound = clickSfxFor(event.target)
      if (sound) playSfx(sound)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      keyboard = true
      unlockAudio()
      if (event.repeat || (event.key !== 'Enter' && event.key !== ' ') || !(event.target instanceof Element)) return
      if (isEditableTarget(event.target)) return
      const sound = clickSfxFor(event.target)
      if (sound) playSfx(sound)
    }
    const onPointerOver = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || !(event.target instanceof Element)) return
      const control = event.target.closest(INTERACTIVE)
      if (control === hovered) return
      hovered = control
      if (control && !(control as HTMLButtonElement).disabled && control.closest('[data-sfx="none"]') === null) playSfx('ui.hover')
    }
    // Tastiera e gamepad spostano il fuoco: il cursore che scorre fa lo stesso ticchettio.
    const onFocusIn = (event: FocusEvent) => {
      if (!keyboard || !(event.target instanceof Element) || !event.target.matches(INTERACTIVE)) return
      if (event.target.closest('[data-sfx="none"]') === null) playSfx('ui.hover')
    }
    const onChange = (event: Event) => {
      const target = event.target
      if (target instanceof HTMLInputElement && target.type === 'checkbox') playSfx(target.checked ? 'ui.toggle-on' : 'ui.toggle-off')
      else if (target instanceof HTMLSelectElement) playSfx('ui.select')
    }
    const onInput = (event: Event) => {
      if (event.target instanceof HTMLInputElement && event.target.type === 'range') playSfx('ui.tick')
    }
    window.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('pointerover', onPointerOver, true)
    window.addEventListener('focusin', onFocusIn, true)
    window.addEventListener('change', onChange, true)
    window.addEventListener('input', onInput, true)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('pointerover', onPointerOver, true)
      window.removeEventListener('focusin', onFocusIn, true)
      window.removeEventListener('change', onChange, true)
      window.removeEventListener('input', onInput, true)
      stopMusic()
      stopAllSfx()
    }
  }, [])

  // Le finestre di dialogo che compaiono hanno un piccolo «pop».
  useEffect(() => {
    if (typeof MutationObserver === 'undefined' || typeof document === 'undefined') return
    const DIALOG = '[role="dialog"], [role="alertdialog"], [aria-modal="true"]'
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof Element)) continue
          const dialog = node.matches(DIALOG) ? node : node.querySelector(DIALOG)
          if (!dialog || dialog.closest('[data-sfx="none"]')) continue
          playSfx(dialog.getAttribute('role') === 'alertdialog' ? 'ui.notify' : 'ui.dialog')
          return
        }
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  // Fase U6: nell'interfaccia di riferimento l'audio si regola nelle Impostazioni («Audio attivo»).
  return null
}
