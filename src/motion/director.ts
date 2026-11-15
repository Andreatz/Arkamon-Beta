/**
 * Sequenziatore di "battute" per la presentazione.
 *
 * Una battuta è una funzione che riceve il contesto e termina quando la sua
 * parte di spettacolo è conclusa. Le battute si compongono con `seq` e `par`,
 * rispettano velocità e movimento ridotto, si possono mettere in pausa e
 * annullare. Niente React e niente DOM: il modulo è testabile con timer finti.
 *
 * Il sequenziatore non decide mai un esito di gioco: riceve risultati già
 * calcolati dal motore e li mette in scena.
 */
import { DEFAULT_MOTION_SETTINGS, easing, resolveDuration, resolveHold, type EaseToken, type MotionSettings } from './tokens'

export type BeatOutcome = 'completed' | 'cancelled'

export interface BeatContext {
  readonly signal: AbortSignal
  readonly settings: MotionSettings
  /** Attesa decorativa: scala con la velocità e si annulla con il movimento ridotto. */
  wait(milliseconds: number): Promise<void>
  /** Tempo di lettura: scala con la velocità ma resta con il movimento ridotto. */
  hold(milliseconds: number): Promise<void>
  /** Tempo del sequenziatore in millisecondi; non avanza durante la pausa. */
  now(): number
  /** Si risolve al fotogramma successivo. */
  frame(): Promise<void>
}

export type Beat = (context: BeatContext) => Promise<void> | void

export interface DirectorClock {
  now(): number
  /** Restituisce la funzione che annulla il timer. */
  setTimeout(callback: () => void, milliseconds: number): () => void
  /** Restituisce la funzione che annulla la richiesta. */
  requestFrame(callback: () => void): () => void
}

export function createBrowserClock(): DirectorClock {
  return {
    now: () => (typeof performance !== 'undefined' ? performance.now() : Date.now()),
    setTimeout: (callback, milliseconds) => {
      const id = setTimeout(callback, milliseconds)
      return () => clearTimeout(id)
    },
    requestFrame: (callback) => {
      if (typeof requestAnimationFrame === 'function') {
        const id = requestAnimationFrame(() => callback())
        return () => cancelAnimationFrame(id)
      }
      const id = setTimeout(callback, 16)
      return () => clearTimeout(id)
    },
  }
}

class BeatCancelled extends Error {
  constructor() { super('Sequenza annullata'); this.name = 'BeatCancelled' }
}
const isCancelled = (error: unknown): error is BeatCancelled => error instanceof BeatCancelled

export interface Playback {
  /** Si risolve quando la sequenza termina o viene annullata; si rifiuta solo per un errore reale di una battuta. */
  readonly finished: Promise<BeatOutcome>
  cancel(): void
}

export interface Director {
  play(beat: Beat): Playback
  cancelAll(): void
  setPaused(paused: boolean): void
  readonly paused: boolean
  /** Numero di sequenze in corso. */
  readonly active: number
  /** Notifica i cambi di `active`; restituisce la funzione di disiscrizione. */
  subscribe(listener: (active: number) => void): () => void
}

export interface DirectorOptions {
  getSettings?: () => MotionSettings
  clock?: DirectorClock
}

interface PendingTimer {
  remaining: number
  armedAt: number
  disarm: (() => void) | null
  fire: () => void
}

export function createDirector(options: DirectorOptions = {}): Director {
  const clock = options.clock ?? createBrowserClock()
  const getSettings = options.getSettings ?? (() => DEFAULT_MOTION_SETTINGS)
  const timers = new Set<PendingTimer>()
  const playbacks = new Set<AbortController>()
  const listeners = new Set<(active: number) => void>()
  let paused = false
  let pausedAt = 0
  let pausedTotal = 0

  const virtualNow = () => (paused ? pausedAt : clock.now()) - pausedTotal
  const notify = () => listeners.forEach((listener) => listener(playbacks.size))

  const arm = (timer: PendingTimer) => {
    timer.armedAt = clock.now()
    timer.disarm = clock.setTimeout(timer.fire, timer.remaining)
  }

  const sleep = (milliseconds: number, signal: AbortSignal) => new Promise<void>((resolve, reject) => {
    if (signal.aborted) { reject(new BeatCancelled()); return }
    if (!(milliseconds > 0)) { resolve(); return }
    const timer: PendingTimer = {
      remaining: milliseconds, armedAt: 0, disarm: null,
      fire: () => { timers.delete(timer); signal.removeEventListener('abort', abort); resolve() },
    }
    const abort = () => { timer.disarm?.(); timers.delete(timer); reject(new BeatCancelled()) }
    signal.addEventListener('abort', abort, { once: true })
    timers.add(timer)
    if (!paused) arm(timer)
  })

  const nextFrame = (signal: AbortSignal) => new Promise<void>((resolve, reject) => {
    if (signal.aborted) { reject(new BeatCancelled()); return }
    const abort = () => { cancelFrame(); reject(new BeatCancelled()) }
    const cancelFrame = clock.requestFrame(() => { signal.removeEventListener('abort', abort); resolve() })
    signal.addEventListener('abort', abort, { once: true })
  })

  return {
    play(beat) {
      const controller = new AbortController()
      playbacks.add(controller)
      notify()
      const context: BeatContext = {
        signal: controller.signal,
        get settings() { return getSettings() },
        wait: (milliseconds) => sleep(resolveDuration(milliseconds, getSettings()), controller.signal),
        hold: (milliseconds) => sleep(resolveHold(milliseconds, getSettings()), controller.signal),
        now: virtualNow,
        frame: () => nextFrame(controller.signal),
      }
      const settle = () => { if (playbacks.delete(controller)) notify() }
      const finished = (async (): Promise<BeatOutcome> => {
        try {
          await beat(context)
          return controller.signal.aborted ? 'cancelled' : 'completed'
        } catch (error) {
          if (isCancelled(error)) return 'cancelled'
          throw error
        } finally {
          settle()
        }
      })()
      return { finished, cancel: () => controller.abort() }
    },
    cancelAll() { [...playbacks].forEach((controller) => controller.abort()) },
    setPaused(next) {
      if (next === paused) return
      paused = next
      if (paused) {
        pausedAt = clock.now()
        timers.forEach((timer) => {
          timer.disarm?.()
          timer.disarm = null
          timer.remaining = Math.max(0, timer.remaining - (pausedAt - timer.armedAt))
        })
      } else {
        pausedTotal += clock.now() - pausedAt
        timers.forEach(arm)
      }
    },
    get paused() { return paused },
    get active() { return playbacks.size },
    subscribe(listener) {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
  }
}

/* ---------------------------------------------------------- combinatori */

const cancelIfAborted = (context: BeatContext) => { if (context.signal.aborted) throw new BeatCancelled() }

/** Esegue le battute una dopo l'altra. */
export function seq(...beats: Beat[]): Beat {
  return async (context) => {
    for (const beat of beats) {
      cancelIfAborted(context)
      await beat(context)
    }
  }
}

/** Esegue le battute insieme e termina quando sono finite tutte. */
export function par(...beats: Beat[]): Beat {
  return async (context) => {
    cancelIfAborted(context)
    await Promise.all(beats.map((beat) => beat(context)))
  }
}

/** Come `par`, ma ogni battuta parte `gapMs` dopo la precedente. */
export function stagger(gapMs: number, ...beats: Beat[]): Beat {
  return par(...beats.map((beat, index) => seq(wait(gapMs * index), beat)))
}

/** Attesa decorativa. */
export function wait(milliseconds: number): Beat {
  return (context) => context.wait(milliseconds)
}

/** Tempo di lettura, mantenuto anche con il movimento ridotto. */
export function hold(milliseconds: number): Beat {
  return (context) => context.hold(milliseconds)
}

/** Esegue un effetto immediato oppure attende la promessa restituita (per esempio un movimento di camera). */
export function call(effect: (context: BeatContext) => unknown): Beat {
  return async (context) => {
    cancelIfAborted(context)
    await effect(context)
  }
}

/** Sceglie la battuta al momento dell'esecuzione. */
export function when(condition: (context: BeatContext) => boolean, then: Beat, otherwise?: Beat): Beat {
  return (context) => (condition(context) ? then(context) : otherwise?.(context))
}

/**
 * Esegue `cleanup` sia a fine battuta sia in caso di annullamento: serve a non
 * lasciare lo schermo in uno stato intermedio (bande, veli, pose di camera).
 */
export function guard(beat: Beat, cleanup: () => void): Beat {
  return async (context) => {
    try { await beat(context) } finally { cleanup() }
  }
}

export interface TweenOptions {
  ms: number
  ease?: EaseToken
  from?: number
  to?: number
  update: (value: number) => void
}

/** Interpola un valore fotogramma per fotogramma; con durata zero applica subito il valore finale. */
export function tween({ ms, ease = 'out', from = 0, to = 1, update }: TweenOptions): Beat {
  const curve = easing(ease)
  return async (context) => {
    cancelIfAborted(context)
    const duration = resolveDuration(ms, context.settings)
    if (duration <= 0) { update(to); return }
    const start = context.now()
    for (;;) {
      const progress = Math.min(1, (context.now() - start) / duration)
      update(from + (to - from) * curve(progress))
      if (progress >= 1) return
      await context.frame()
    }
  }
}
