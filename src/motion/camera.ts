/**
 * Modello puro della cinepresa di scena: niente React e niente DOM.
 *
 * Il mondo viene trasformato attorno al proprio centro con
 * `traslazione → scala → rotazione`. Le traslazioni della posa sono frazioni
 * della dimensione del palco, così la stessa inquadratura vale a ogni risoluzione.
 */
import { resolveDuration, type EaseToken, type MotionSettings } from './tokens'

/** Punto del palco in coordinate 0..1 (0,0 = alto a sinistra). */
export interface StagePoint { x: number; y: number }

export interface CameraPose {
  /** Traslazione orizzontale in frazioni della larghezza del palco. */
  x: number
  /** Traslazione verticale in frazioni dell'altezza del palco. */
  y: number
  zoom: number
  /** Gradi. */
  rotate: number
}

export const CAMERA_REST: CameraPose = Object.freeze({ x: 0, y: 0, zoom: 1, rotate: 0 })
export const CAMERA_MAX_ZOOM = 2.5

export interface CameraTarget {
  /** Punto da portare al centro: coordinate 0..1 oppure il nome di un punto registrato. */
  focus?: StagePoint | string
  zoom?: number
  rotate?: number
}

export interface CameraMove extends CameraTarget {
  ms?: number
  ease?: EaseToken
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const finite = (value: number | undefined, fallback: number) => typeof value === 'number' && Number.isFinite(value) ? value : fallback

/**
 * Posa che porta `focus` al centro con lo zoom richiesto. La traslazione è
 * limitata in modo che il mondo continui a coprire tutto il palco: a zoom 1
 * non esiste margine e la camera resta ferma.
 */
export function poseForTarget(
  target: { focus?: StagePoint; zoom?: number; rotate?: number },
  current: CameraPose = CAMERA_REST,
  maxZoom = CAMERA_MAX_ZOOM,
): CameraPose {
  const zoom = clamp(finite(target.zoom, current.zoom), 1, Math.max(1, maxZoom))
  const limit = (zoom - 1) / 2
  const x = target.focus ? -zoom * (clamp(finite(target.focus.x, 0.5), 0, 1) - 0.5) : current.x
  const y = target.focus ? -zoom * (clamp(finite(target.focus.y, 0.5), 0, 1) - 0.5) : current.y
  // `+ 0` evita lo zero negativo, che sporcherebbe confronti e attributi di stile.
  return { x: clamp(x, -limit, limit) + 0, y: clamp(y, -limit, limit) + 0, zoom, rotate: finite(target.rotate, current.rotate) }
}

/* ------------------------------------------------------------------ shake */

export interface ShakeImpulse {
  amplitudePx: number
  rotateDeg: number
  durationMs: number
  frequencyHz: number
  seed: number
  startedAt: number
}

export interface ShakeRequest {
  amplitudePx: number
  durationMs: number
  rotateDeg?: number
  frequencyHz?: number
}

export interface ShakeSample { x: number; y: number; rotate: number; active: boolean }

const TAU = Math.PI * 2
/** Rumore continuo e deterministico in [-1, 1]: due sinusoidi con frequenze non multiple. */
function noise(seconds: number, frequency: number, seed: number): number {
  return Math.sin(TAU * frequency * seconds + seed) * 0.62 + Math.sin(TAU * frequency * 1.73 * seconds + seed * 2.3) * 0.38
}

/** Somma gli impulsi ancora vivi. L'inviluppo quadratico dà un colpo secco che si spegne dolcemente. */
export function sampleShake(impulses: readonly ShakeImpulse[], now: number): ShakeSample {
  let x = 0
  let y = 0
  let rotate = 0
  let active = false
  for (const impulse of impulses) {
    const elapsed = now - impulse.startedAt
    if (elapsed < 0 || elapsed >= impulse.durationMs || impulse.durationMs <= 0) continue
    active = true
    const envelope = (1 - elapsed / impulse.durationMs) ** 2
    const seconds = elapsed / 1000
    x += impulse.amplitudePx * envelope * noise(seconds, impulse.frequencyHz, impulse.seed)
    y += impulse.amplitudePx * 0.6 * envelope * noise(seconds, impulse.frequencyHz, impulse.seed + 11.7)
    rotate += impulse.rotateDeg * envelope * noise(seconds, impulse.frequencyHz * 0.8, impulse.seed + 23.1)
  }
  return { x, y, rotate, active }
}

export function pruneShake(impulses: readonly ShakeImpulse[], now: number): ShakeImpulse[] {
  return impulses.filter((impulse) => now - impulse.startedAt < impulse.durationMs)
}

export interface TraumaConfig { maxOffsetPx: number; maxRotateDeg: number }
export const DEFAULT_TRAUMA: TraumaConfig = { maxOffsetPx: 26, maxRotateDeg: 1.6 }

/**
 * Traduce un "trauma" 0..1 (per esempio danno / HP massimi) in un impulso.
 * L'ampiezza cresce col quadrato: i colpi leggeri restano discreti, quelli forti si sentono.
 */
export function shakeFromTrauma(trauma: number, config: TraumaConfig = DEFAULT_TRAUMA): ShakeRequest {
  const amount = clamp(finite(trauma, 0), 0, 1)
  return {
    amplitudePx: config.maxOffsetPx * amount * amount,
    rotateDeg: config.maxRotateDeg * amount * amount,
    durationMs: amount === 0 ? 0 : 220 + 520 * amount,
    frequencyHz: 11 + 6 * amount,
  }
}

/* ------------------------------------------------------------- parallasse */

export interface LayerTransform { x: number; y: number; scale: number }

/**
 * Trasformazione relativa di un livello dentro il mondo già trasformato dalla camera.
 * `depth` 1 è il piano focale (identità); sotto 1 il livello è lontano e si muove
 * meno; sopra 1 è un primo piano e si muove di più. `bleed` allarga il livello
 * per coprire i bordi durante shake e panoramiche.
 */
export function layerTransform(camera: { x: number; y: number; zoom: number }, depth: number, bleed = 1): LayerTransform {
  const zoom = camera.zoom > 0 ? camera.zoom : 1
  const d = finite(depth, 1)
  return {
    x: camera.x * (d - 1) / zoom + 0,
    y: camera.y * (d - 1) / zoom + 0,
    scale: ((1 + (zoom - 1) * d) / zoom) * (bleed > 0 ? bleed : 1),
  }
}

/* -------------------------------------------------------------- deriva */

export interface DriftConfig { x: number; y: number; zoom: number; periodMs: number }
export const DEFAULT_DRIFT: DriftConfig = { x: 0.006, y: 0.004, zoom: 0.012, periodMs: 9000 }

/** Respiro lento a riposo: va sommato alla posa e richiede un margine (`bleed`) sui livelli. */
export function sampleDrift(now: number, config: DriftConfig = DEFAULT_DRIFT): { x: number; y: number; zoom: number } {
  const phase = TAU * now / Math.max(1, config.periodMs)
  return {
    x: config.x * Math.sin(phase),
    y: config.y * Math.sin(phase * 0.71 + 1.3),
    zoom: config.zoom * (0.5 + 0.5 * Math.sin(phase * 0.53 + 0.4)),
  }
}

/* ---------------------------------------------------------- controller */

/** Ciò che il controller chiede a chi disegna: React, test o vista pubblica. */
export interface CameraDriver {
  /** Anima fino alla posa. Una nuova animazione sostituisce la precedente, la cui promessa si risolve comunque. */
  animate(pose: CameraPose, durationMs: number, ease: EaseToken): Promise<void>
  set(pose: CameraPose): void
  addShake(request: Required<ShakeRequest>): void
}

export interface CameraControllerOptions {
  getSettings: () => MotionSettings
  resolveFocus?: (name: string) => StagePoint | undefined
  maxZoom?: number
}

export interface CameraController {
  /** Posa di arrivo dell'ultimo comando. */
  readonly pose: CameraPose
  /** Movimento animato. Con movimento ridotto la camera resta a riposo. */
  to(move: CameraMove): Promise<void>
  /** Stacco immediato. */
  cut(target: CameraTarget): void
  reset(ms?: number, ease?: EaseToken): Promise<void>
  shake(request: ShakeRequest): void
  /** Shake proporzionale a un trauma 0..1. */
  impact(trauma: number, config?: TraumaConfig): void
  /** Colpo di zoom: entra rapido e torna alla posa di partenza. */
  punch(options?: { zoom?: number; ms?: number }): Promise<void>
}

export function createCameraController(driver: CameraDriver, options: CameraControllerOptions): CameraController {
  let pose: CameraPose = { ...CAMERA_REST }
  const maxZoom = options.maxZoom ?? CAMERA_MAX_ZOOM

  const resolve = (target: CameraTarget): CameraPose => {
    const focus = typeof target.focus === 'string' ? options.resolveFocus?.(target.focus) : target.focus
    return poseForTarget({ focus, zoom: target.zoom, rotate: target.rotate }, pose, maxZoom)
  }

  const to: CameraController['to'] = (move) => {
    const settings = options.getSettings()
    if (settings.reducedMotion) return Promise.resolve()
    pose = resolve(move)
    return driver.animate(pose, resolveDuration(move.ms ?? 'slow', settings), move.ease ?? 'out')
  }

  const shake: CameraController['shake'] = (request) => {
    const settings = options.getSettings()
    if (settings.reducedMotion || !(request.amplitudePx > 0) || !(request.durationMs > 0)) return
    driver.addShake({
      amplitudePx: request.amplitudePx,
      durationMs: request.durationMs,
      rotateDeg: request.rotateDeg ?? 0,
      frequencyHz: (request.frequencyHz ?? 13) * (settings.speed > 0 ? settings.speed : 1),
    })
  }

  return {
    get pose() { return pose },
    to,
    cut(target) {
      if (options.getSettings().reducedMotion) return
      pose = resolve(target)
      driver.set(pose)
    },
    reset(ms, ease = 'inOut') {
      const settings = options.getSettings()
      pose = { ...CAMERA_REST }
      if (settings.reducedMotion) { driver.set(pose); return Promise.resolve() }
      return driver.animate(pose, resolveDuration(ms ?? 'slow', settings), ease)
    },
    shake,
    impact(trauma, config) {
      const request = shakeFromTrauma(trauma, config)
      shake({ ...request, durationMs: resolveDuration(request.durationMs, options.getSettings()) })
    },
    async punch({ zoom = 1.06, ms = 180 } = {}) {
      const settings = options.getSettings()
      if (settings.reducedMotion) return
      const origin = pose
      const peak = poseForTarget({ zoom: origin.zoom * zoom }, origin, maxZoom)
      const duration = resolveDuration(ms, settings)
      await driver.animate(peak, duration * 0.35, 'out')
      // Un altro comando può aver cambiato l'inquadratura durante il colpo: non la sovrascrivo.
      if (pose === origin) await driver.animate(origin, duration * 0.65, 'inOut')
    },
  }
}

/** Controller inerte per i componenti montati fuori da un palco. */
export const NOOP_CAMERA: CameraController = {
  pose: CAMERA_REST,
  to: () => Promise.resolve(),
  cut: () => undefined,
  reset: () => Promise.resolve(),
  shake: () => undefined,
  impact: () => undefined,
  punch: () => Promise.resolve(),
}
