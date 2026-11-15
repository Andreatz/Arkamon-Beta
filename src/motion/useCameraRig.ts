import { useEffect, useMemo, useRef } from 'react'
import { animate, useMotionValue, useTransform, type MotionValue } from 'framer-motion'
import { useGameMotionPreferences } from '@/settings/gamePreferences'
import {
  createCameraController, pruneShake, sampleShake,
  type CameraController, type CameraDriver, type CameraPose, type ShakeImpulse, type StagePoint,
} from './camera'
import { EASE, type MotionSettings } from './tokens'

export interface CameraRigOptions {
  /** Punti con nome, in coordinate 0..1 del palco: `camera.to({ focus: 'enemy' })`. */
  focusPoints?: Readonly<Record<string, StagePoint>>
  maxZoom?: number
}

export interface CameraRig {
  camera: CameraController
  /** Valori già pronti per `style` di un `motion.div`: non provocano render di React. */
  values: {
    /** Traslazione totale in pixel, shake incluso. */
    x: MotionValue<number>
    y: MotionValue<number>
    zoom: MotionValue<number>
    /** Rotazione totale in gradi, shake incluso. */
    rotate: MotionValue<number>
  }
  /** Chiamata dal palco quando cambia la propria dimensione. */
  setSize(width: number, height: number): void
}

/**
 * Crea la cinepresa di un palco. Va chiamato dal componente che deve comandarla
 * (per esempio la scena di battaglia) e passato a `<Stage rig={...}>`.
 */
export function useCameraRig(options: CameraRigOptions = {}): CameraRig {
  const preferences = useGameMotionPreferences()
  const settings = useRef<MotionSettings>(preferences)
  settings.current = preferences
  const focusPoints = useRef(options.focusPoints)
  focusPoints.current = options.focusPoints

  const fractionX = useMotionValue(0)
  const fractionY = useMotionValue(0)
  const zoom = useMotionValue(1)
  const baseRotate = useMotionValue(0)
  const shakeX = useMotionValue(0)
  const shakeY = useMotionValue(0)
  const shakeRotate = useMotionValue(0)
  const width = useMotionValue(0)
  const height = useMotionValue(0)

  const x = useTransform([fractionX, width, shakeX], ([fraction, size, shake]: number[]) => fraction * size + shake)
  const y = useTransform([fractionY, height, shakeY], ([fraction, size, shake]: number[]) => fraction * size + shake)
  const rotate = useTransform([baseRotate, shakeRotate], ([base, shake]: number[]) => base + shake)

  const runtime = useRef<{ stop: (() => void) | null; impulses: ShakeImpulse[]; frame: number | null; seed: number }>(
    { stop: null, impulses: [], frame: null, seed: 1 },
  )

  const camera = useMemo(() => {
    const state = runtime.current
    const set = (pose: CameraPose) => {
      state.stop?.()
      fractionX.set(pose.x); fractionY.set(pose.y); zoom.set(pose.zoom); baseRotate.set(pose.rotate)
    }
    const tick = () => {
      const now = performance.now()
      state.impulses = pruneShake(state.impulses, now)
      const sample = sampleShake(state.impulses, now)
      shakeX.set(sample.x); shakeY.set(sample.y); shakeRotate.set(sample.rotate)
      state.frame = sample.active ? requestAnimationFrame(tick) : null
    }
    const driver: CameraDriver = {
      set,
      animate(pose, durationMs, ease) {
        state.stop?.()
        if (!(durationMs > 0)) { set(pose); return Promise.resolve() }
        return new Promise<void>((resolve) => {
          const transition = { duration: durationMs / 1000, ease: [...EASE[ease]] as [number, number, number, number] }
          const controls = [
            animate(fractionX, pose.x, transition), animate(fractionY, pose.y, transition),
            animate(zoom, pose.zoom, transition), animate(baseRotate, pose.rotate, transition),
          ]
          let settled = false
          const finish = () => {
            if (settled) return
            settled = true
            if (state.stop === stop) state.stop = null
            resolve()
          }
          // Un nuovo comando interrompe questo: la promessa si risolve comunque, così nessuna sequenza resta appesa.
          const stop = () => { controls.forEach((control) => control.stop()); finish() }
          state.stop = stop
          void Promise.all(controls).then(finish, finish)
        })
      },
      addShake(request) {
        state.seed = (state.seed * 16807) % 2147483647
        state.impulses = [...state.impulses.slice(-5), { ...request, seed: state.seed % 1000, startedAt: performance.now() }]
        if (state.frame === null) state.frame = requestAnimationFrame(tick)
      },
    }
    return createCameraController(driver, {
      getSettings: () => settings.current,
      resolveFocus: (name) => focusPoints.current?.[name],
      maxZoom: options.maxZoom,
    })
    // I motion value sono stabili per tutta la vita del componente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const state = runtime.current
    return () => {
      state.stop?.()
      if (state.frame !== null) cancelAnimationFrame(state.frame)
      state.frame = null
      state.impulses = []
    }
  }, [])

  return useMemo<CameraRig>(() => ({
    camera,
    values: { x, y, zoom, rotate },
    setSize: (nextWidth, nextHeight) => { width.set(nextWidth); height.set(nextHeight) },
  }), [camera, x, y, zoom, rotate, width, height])
}
