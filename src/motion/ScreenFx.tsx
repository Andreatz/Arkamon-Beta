import { useEffect, useMemo, useRef } from 'react'
import { animate, motion, useMotionValue, type MotionValue } from 'framer-motion'
import { useGameMotionPreferences } from '@/settings/gamePreferences'
import { EASE, resolveDuration, type MotionSettings } from './tokens'
import './motion.css'

export type ScreenFxColor = 'white' | 'black'

export interface ScreenFx {
  /** Lampo: sale subito al picco e si spegne. Saltato con il movimento ridotto. */
  flash(options?: { color?: ScreenFxColor; ms?: number; peak?: number }): Promise<void>
  /** Copre lo schermo con un colore pieno (dissolvenza al nero o al bianco). */
  cover(color?: ScreenFxColor, ms?: number): Promise<void>
  /** Toglie il velo. */
  reveal(ms?: number): Promise<void>
  /** Bande cinematografiche in alto e in basso. */
  letterbox(visible: boolean, ms?: number): Promise<void>
  /** Riporta tutto a zero senza animazione. */
  clear(): void
  values: { veil: MotionValue<number>; color: MotionValue<string>; bars: MotionValue<number> }
}

const COLOR_VARIABLE: Record<ScreenFxColor, string> = {
  white: 'var(--motion-fx-white)',
  black: 'var(--motion-fx-black)',
}

/** Effetti a schermo intero comandabili da una sequenza. Va abbinato a `<ScreenFxLayer fx={...} />`. */
export function useScreenFx(): ScreenFx {
  const preferences = useGameMotionPreferences()
  const settings = useRef<MotionSettings>(preferences)
  settings.current = preferences
  const veil = useMotionValue(0)
  const color = useMotionValue(COLOR_VARIABLE.black)
  const bars = useMotionValue(0)
  const running = useRef<{ veil: (() => void) | null; bars: (() => void) | null }>({ veil: null, bars: null })

  const fx = useMemo<ScreenFx>(() => {
    const run = (channel: 'veil' | 'bars', value: MotionValue<number>, keyframes: number | number[], ms: number, times?: number[]) => {
      running.current[channel]?.()
      const duration = resolveDuration(ms, settings.current)
      const target = Array.isArray(keyframes) ? keyframes[keyframes.length - 1] : keyframes
      if (!(duration > 0)) { value.set(target); return Promise.resolve() }
      return new Promise<void>((resolve) => {
        const control = animate(value, keyframes, { duration: duration / 1000, ease: [...EASE.inOut] as [number, number, number, number], ...(times ? { times } : {}) })
        let settled = false
        const finish = () => {
          if (settled) return
          settled = true
          if (running.current[channel] === stop) running.current[channel] = null
          resolve()
        }
        const stop = () => { control.stop(); finish() }
        running.current[channel] = stop
        void Promise.resolve(control).then(finish, finish)
      })
    }
    return {
      values: { veil, color, bars },
      flash({ color: tone = 'white', ms = 220, peak = 0.85 } = {}) {
        if (settings.current.reducedMotion) return Promise.resolve()
        color.set(COLOR_VARIABLE[tone])
        return run('veil', veil, [veil.get(), Math.min(1, Math.max(0, peak)), 0], ms, [0, 0.18, 1])
      },
      cover(tone = 'black', ms = 400) {
        color.set(COLOR_VARIABLE[tone])
        return run('veil', veil, 1, ms)
      },
      reveal(ms = 400) { return run('veil', veil, 0, ms) },
      letterbox(visible, ms = 240) { return run('bars', bars, visible ? 1 : 0, ms) },
      clear() {
        running.current.veil?.(); running.current.bars?.()
        veil.set(0); bars.set(0)
      },
    }
    // I motion value sono stabili per tutta la vita del componente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => () => { running.current.veil?.(); running.current.bars?.() }, [])
  return fx
}

/** Velo e bande. Non intercetta input e resta fuori dall'albero di accessibilità. */
export function ScreenFxLayer({ fx, className = '' }: { fx: ScreenFx; className?: string }) {
  return (
    <div className={`arka-motion-fx ${className}`} aria-hidden="true" data-screen-fx>
      <motion.span className="arka-motion-fx__bar arka-motion-fx__bar--top" style={{ scaleY: fx.values.bars }} />
      <motion.span className="arka-motion-fx__bar arka-motion-fx__bar--bottom" style={{ scaleY: fx.values.bars }} />
      <motion.span className="arka-motion-fx__veil" style={{ opacity: fx.values.veil, backgroundColor: fx.values.color }} />
    </div>
  )
}
