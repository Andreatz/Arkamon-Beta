import { useEffect, useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { motion, useSpring } from 'framer-motion'
import { useGameMotionPreferences } from '@/settings/gamePreferences'
import './liveInterface.css'

/** Elementi che il cursore può raggiungere. */
export const CURSOR_SELECTOR = '[data-rpg-item], [data-cursor-target], button:not(:disabled), [role="tab"], a[href], select:not(:disabled)'

const SPRING = { stiffness: 520, damping: 42, mass: 0.7 }
/** Margine attorno all'elemento puntato, in pixel. */
const PAD = 5

interface Rect { x: number; y: number; width: number; height: number }

/**
 * Riquadro dell'elemento senza la sua trasformazione (l'inclinazione 3D ingrandirebbe il
 * riquadro proiettato): posizione di layout rispetto al genitore posizionato, convertita in
 * coordinate dello schermo con la scala del genitore (il palco può essere ridimensionato).
 */
function layoutBox(element: HTMLElement): { left: number; top: number; width: number; height: number } {
  const parent = element.offsetParent
  if (!(parent instanceof HTMLElement) || !element.hasAttribute('data-tilting')) return element.getBoundingClientRect()
  const frame = parent.getBoundingClientRect()
  const scaleX = parent.offsetWidth ? frame.width / parent.offsetWidth : 1
  const scaleY = parent.offsetHeight ? frame.height / parent.offsetHeight : 1
  return {
    left: frame.left + (parent.clientLeft + element.offsetLeft - parent.scrollLeft) * scaleX,
    top: frame.top + (parent.clientTop + element.offsetTop - parent.scrollTop) * scaleY,
    width: element.offsetWidth * scaleX,
    height: element.offsetHeight * scaleY,
  }
}

function sameRect(a: Rect | null, b: Rect | null) {
  return !!a && !!b && Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5
    && Math.abs(a.width - b.width) < 0.5 && Math.abs(a.height - b.height) < 0.5
}

/**
 * Cursore di selezione unico (audit, sezione 8.6): una cornice dorata che scivola
 * dall'elemento sotto il puntatore, oppure da quello con il fuoco (tastiera, gamepad),
 * all'elemento successivo dentro `scope`. Non intercetta mai il puntatore.
 */
export function SelectionCursor({ scope }: { scope: RefObject<HTMLElement> }) {
  const { reducedMotion } = useGameMotionPreferences()
  const [visible, setVisible] = useState(false)
  const x = useSpring(0, SPRING), y = useSpring(0, SPRING)
  const width = useSpring(0, SPRING), height = useSpring(0, SPRING)
  const springs = useRef({ x, y, width, height })
  springs.current = { x, y, width, height }
  const instant = useRef(reducedMotion)
  instant.current = reducedMotion

  useEffect(() => {
    const root = scope.current
    if (!root) return
    let hovered: HTMLElement | null = null
    let last: Rect | null = null
    let shown = false
    let frame = 0
    const usable = (element: Element | null): element is HTMLElement => !!element && element instanceof HTMLElement
      && root.contains(element) && !element.closest('[inert], [hidden]') && element.getClientRects().length > 0
    const targetOf = (node: EventTarget | null) => node instanceof Element ? node.closest(CURSOR_SELECTOR) : null
    const current = () => {
      if (usable(hovered)) return hovered
      const focused = document.activeElement
      const target = targetOf(focused)
      return usable(target) ? target : null
    }
    const place = (rect: Rect, jump: boolean) => {
      const { x, y, width, height } = springs.current
      const values: [typeof x, number][] = [[x, rect.x], [y, rect.y], [width, rect.width], [height, rect.height]]
      for (const [spring, value] of values) jump ? spring.jump(value) : spring.set(value)
    }
    // Un solo ciclo per fotogramma: segue anche elementi che si spostano (entrate, scorrimento).
    const tick = () => {
      const target = current()
      if (!target) {
        if (shown) { shown = false; setVisible(false) }
        last = null
      } else {
        const box = layoutBox(target)
        const rect = { x: box.left - PAD, y: box.top - PAD, width: box.width + PAD * 2, height: box.height + PAD * 2 }
        if (!sameRect(rect, last)) {
          place(rect, !shown || instant.current)
          last = rect
        }
        if (!shown) { shown = true; setVisible(true) }
      }
      frame = requestAnimationFrame(tick)
    }
    const over = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      const target = targetOf(event.target)
      hovered = usable(target) ? target : null
    }
    const out = (event: PointerEvent) => {
      if (!(event.relatedTarget instanceof Node) || !root.contains(event.relatedTarget)) hovered = null
    }
    root.addEventListener('pointerover', over)
    root.addEventListener('pointerout', out)
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      root.removeEventListener('pointerover', over)
      root.removeEventListener('pointerout', out)
    }
  }, [scope])

  if (typeof document === 'undefined') return null
  return createPortal(<motion.div className="arka-selection-cursor" aria-hidden="true" data-visible={visible}
    style={{ x, y, width, height }}>
    <span className="arka-selection-cursor__corner is-tl" /><span className="arka-selection-cursor__corner is-tr" />
    <span className="arka-selection-cursor__corner is-bl" /><span className="arka-selection-cursor__corner is-br" />
  </motion.div>, document.body)
}
