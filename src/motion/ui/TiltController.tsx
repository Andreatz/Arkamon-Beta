import { useEffect, useRef } from 'react'
import { useGameMotionPreferences } from '@/settings/gamePreferences'
import { tiltPose } from './tilt'
import './liveInterface.css'

/** Elementi che si inclinano verso il puntatore; altri si aggiungono con `data-tilt`. */
export const TILT_SELECTOR = '[data-tilt], .pu-menu-tile, .ref-trainer-card, .pu-team-slot, .ref-team-card, .pu-dex-entry'

/**
 * Un solo ascoltatore per tutto il gioco: il puntatore inclina la carta sotto di sé,
 * aggiorna il riflesso e solleva l'icona (variabili CSS `--tilt-*`, vedi liveInterface.css).
 * L'inclinazione usa le proprietà `rotate` e `scale`, che si sommano al `transform` dei fogli
 * di stile esistenti invece di sostituirlo; la prospettiva va sul contenitore.
 * Solo mouse e penna: al tocco le carte restano ferme. Nulla con il movimento ridotto.
 */
export function TiltController() {
  const { reducedMotion } = useGameMotionPreferences()
  const disabled = useRef(reducedMotion)
  disabled.current = reducedMotion

  useEffect(() => {
    let current: HTMLElement | null = null
    let frame = 0
    let pending: PointerEvent | null = null
    const release = (element: HTMLElement | null) => {
      if (!element) return
      element.removeAttribute('data-tilting')
      for (const name of ['--tilt-ax', '--tilt-ay', '--tilt-angle', '--glare-x', '--glare-y']) element.style.removeProperty(name)
      // La prospettiva vive sul contenitore solo mentre una carta è inclinata.
      if (element.parentElement?.hasAttribute('data-tilt-stage')) {
        element.parentElement.removeAttribute('data-tilt-stage')
        element.parentElement.style.removeProperty('perspective')
      }
    }
    const ensureGlare = (element: HTMLElement) => {
      if (element.querySelector(':scope > .arka-tilt-glare')) return
      // Il riflesso è assoluto: senza un contenitore posizionato finirebbe altrove.
      if (getComputedStyle(element).position === 'static') return
      const glare = document.createElement('span')
      glare.className = 'arka-tilt-glare'
      glare.setAttribute('aria-hidden', 'true')
      element.append(glare)
    }
    const apply = () => {
      frame = 0
      const event = pending
      pending = null
      if (!event) return
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>(TILT_SELECTOR) : null
      const usable = target && !disabled.current && event.pointerType !== 'touch' && !target.matches(':disabled')
      if (current && current !== target) { release(current); current = null }
      if (!usable || !target) return
      const pose = tiltPose(target.getBoundingClientRect(), event.clientX, event.clientY)
      ensureGlare(target)
      target.setAttribute('data-tilting', '')
      target.style.setProperty('--tilt-ax', String(pose.axisX))
      target.style.setProperty('--tilt-ay', String(pose.axisY))
      target.style.setProperty('--tilt-angle', `${pose.angle}deg`)
      const stage = target.parentElement
      if (stage && !stage.style.perspective) {
        stage.setAttribute('data-tilt-stage', '')
        stage.style.setProperty('perspective', '900px')
      }
      target.style.setProperty('--glare-x', `${pose.glareX}%`)
      target.style.setProperty('--glare-y', `${pose.glareY}%`)
      current = target
    }
    const move = (event: PointerEvent) => {
      pending = event
      if (!frame) frame = requestAnimationFrame(apply)
    }
    const leave = () => { release(current); current = null }
    document.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerleave', leave)
    window.addEventListener('blur', leave)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('pointermove', move)
      document.removeEventListener('pointerleave', leave)
      window.removeEventListener('blur', leave)
      leave()
    }
  }, [])

  useEffect(() => {
    if (!reducedMotion) return
    document.querySelectorAll<HTMLElement>('[data-tilting]').forEach(element => element.removeAttribute('data-tilting'))
  }, [reducedMotion])
  return null
}
