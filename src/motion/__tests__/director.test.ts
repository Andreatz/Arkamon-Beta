import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { call, createDirector, guard, hold, par, seq, stagger, tween, wait, when, type DirectorClock } from '../director'
import type { MotionSettings } from '../tokens'

/** Orologio manuale: i test decidono quando passa il tempo e quando arriva un fotogramma. */
function manualClock() {
  let now = 0
  let nextId = 1
  const timers = new Map<number, { at: number; callback: () => void }>()
  const frames = new Map<number, () => void>()
  const clock: DirectorClock = {
    now: () => now,
    setTimeout(callback, milliseconds) {
      const id = nextId++
      timers.set(id, { at: now + milliseconds, callback })
      return () => { timers.delete(id) }
    },
    requestFrame(callback) {
      const id = nextId++
      frames.set(id, callback)
      return () => { frames.delete(id) }
    },
  }
  const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve() }
  return {
    clock,
    pendingTimers: () => timers.size,
    async advance(milliseconds: number) {
      const end = now + milliseconds
      for (;;) {
        await flush()
        const due = [...timers.entries()].filter(([, timer]) => timer.at <= end).sort((a, b) => a[1].at - b[1].at)[0]
        if (!due) break
        now = due[1].at
        timers.delete(due[0])
        due[1].callback()
      }
      now = end
      await flush()
    },
    async frame(milliseconds = 16) {
      now += milliseconds
      const pending = [...frames.values()]
      frames.clear()
      pending.forEach((callback) => callback())
      await flush()
    },
  }
}

const setup = (settings: MotionSettings = { speed: 1, reducedMotion: false }) => {
  const time = manualClock()
  const current = { ...settings }
  const director = createDirector({ clock: time.clock, getSettings: () => current })
  return { time, director, settings: current }
}

describe('sequenziatore', () => {
  beforeEach(() => { vi.restoreAllMocks() })
  afterEach(() => { vi.restoreAllMocks() })

  it('esegue le battute in ordine e in parallelo', async () => {
    const { time, director } = setup()
    const log: string[] = []
    const mark = (label: string) => call(() => { log.push(`${label}@${time.clock.now()}`) })
    const playback = director.play(seq(
      mark('inizio'),
      wait(100),
      par(seq(wait(50), mark('breve')), seq(wait(200), mark('lunga'))),
      mark('fine'),
    ))
    expect(director.active).toBe(1)
    await time.advance(1000)
    await expect(playback.finished).resolves.toBe('completed')
    expect(log).toEqual(['inizio@0', 'breve@150', 'lunga@300', 'fine@300'])
    expect(director.active).toBe(0)
  })

  it('scagliona le partenze', async () => {
    const { time, director } = setup()
    const log: number[] = []
    const mark = call(() => { log.push(time.clock.now()) })
    director.play(stagger(40, mark, mark, mark))
    await time.advance(200)
    expect(log).toEqual([0, 40, 80])
  })

  it('scala le attese con la velocità; il movimento ridotto annulla wait ma conserva hold', async () => {
    const fast = setup({ speed: 2, reducedMotion: false })
    const fastLog: number[] = []
    fast.director.play(seq(wait(300), call(() => { fastLog.push(fast.time.clock.now()) }), hold(300), call(() => { fastLog.push(fast.time.clock.now()) })))
    await fast.time.advance(1000)
    expect(fastLog).toEqual([150, 300])

    const reduced = setup({ speed: 1, reducedMotion: true })
    const reducedLog: number[] = []
    reduced.director.play(seq(wait(300), call(() => { reducedLog.push(reduced.time.clock.now()) }), hold(300), call(() => { reducedLog.push(reduced.time.clock.now()) })))
    await reduced.time.advance(1000)
    expect(reducedLog).toEqual([0, 300])
  })

  it('attende le promesse restituite da call', async () => {
    const { time, director } = setup()
    let release!: () => void
    const log: string[] = []
    const playback = director.play(seq(
      call(() => new Promise<void>((resolve) => { release = resolve })),
      call(() => { log.push('dopo') }),
    ))
    await time.advance(500)
    expect(log).toEqual([])
    release()
    await expect(playback.finished).resolves.toBe('completed')
    expect(log).toEqual(['dopo'])
  })

  it('l’annullamento ferma le battute successive, libera i timer ed esegue le pulizie', async () => {
    const { time, director } = setup()
    const log: string[] = []
    const playback = director.play(guard(
      seq(call(() => { log.push('prima') }), wait(500), call(() => { log.push('mai') })),
      () => { log.push('pulizia') },
    ))
    await time.advance(100)
    expect(time.pendingTimers()).toBe(1)
    playback.cancel()
    await expect(playback.finished).resolves.toBe('cancelled')
    expect(time.pendingTimers()).toBe(0)
    await time.advance(2000)
    expect(log).toEqual(['prima', 'pulizia'])
    expect(director.active).toBe(0)
  })

  it('cancelAll interrompe tutte le sequenze e notifica gli iscritti', async () => {
    const { time, director } = setup()
    const counts: number[] = []
    const unsubscribe = director.subscribe((active) => counts.push(active))
    const first = director.play(wait(500))
    const second = director.play(par(wait(500), wait(900)))
    expect(counts).toEqual([1, 2])
    director.cancelAll()
    await expect(first.finished).resolves.toBe('cancelled')
    await expect(second.finished).resolves.toBe('cancelled')
    expect(counts).toEqual([1, 2, 1, 0])
    unsubscribe()
    director.play(wait(10))
    await time.advance(20)
    expect(counts).toEqual([1, 2, 1, 0])
  })

  it('la pausa congela le attese e riprende dal tempo residuo', async () => {
    const { time, director } = setup()
    const log: number[] = []
    director.play(seq(wait(300), call(() => { log.push(time.clock.now()) })))
    await time.advance(100)
    director.setPaused(true)
    expect(director.paused).toBe(true)
    await time.advance(5000)
    expect(log).toEqual([])
    director.setPaused(false)
    await time.advance(199)
    expect(log).toEqual([])
    await time.advance(1)
    expect(log).toEqual([5300])
  })

  it('un’attesa iniziata durante la pausa parte alla ripresa', async () => {
    const { time, director } = setup()
    const log: number[] = []
    director.setPaused(true)
    director.play(seq(wait(100), call(() => { log.push(time.clock.now()) })))
    await time.advance(1000)
    expect(log).toEqual([])
    director.setPaused(false)
    await time.advance(100)
    expect(log).toEqual([1100])
  })

  it('propaga gli errori reali di una battuta senza lasciare sequenze attive', async () => {
    const { director } = setup()
    const playback = director.play(seq(call(() => { throw new Error('asset mancante') })))
    await expect(playback.finished).rejects.toThrow('asset mancante')
    expect(director.active).toBe(0)
  })

  it('sceglie il ramo al momento dell’esecuzione', async () => {
    const { time, director, settings } = setup()
    const log: string[] = []
    const beat = when((context) => context.settings.reducedMotion, call(() => { log.push('ridotto') }), call(() => { log.push('pieno') }))
    director.play(beat)
    await time.advance(1)
    settings.reducedMotion = true
    director.play(beat)
    director.play(when(() => false, call(() => { log.push('mai') })))
    await time.advance(1)
    expect(log).toEqual(['pieno', 'ridotto'])
  })

  it('interpola fotogramma per fotogramma e termina sul valore finale', async () => {
    const { time, director } = setup()
    const values: number[] = []
    const playback = director.play(tween({ ms: 100, ease: 'linear', from: 10, to: 20, update: (value) => values.push(value) }))
    await time.advance(0)
    for (let i = 0; i < 6; i++) await time.frame(25)
    await expect(playback.finished).resolves.toBe('completed')
    expect(values[0]).toBe(10)
    expect(values).toEqual([10, 12.5, 15, 17.5, 20])
  })

  it('il tween non avanza in pausa e applica subito il valore finale con il movimento ridotto', async () => {
    const { time, director } = setup()
    const values: number[] = []
    director.play(tween({ ms: 100, ease: 'linear', update: (value) => values.push(value) }))
    await time.advance(0)
    director.setPaused(true)
    await time.frame(50)
    await time.frame(50)
    expect(values).toEqual([0, 0, 0])
    director.setPaused(false)
    await time.frame(50)
    expect(values[values.length - 1]).toBeCloseTo(0.5, 9)

    const reduced = setup({ speed: 1, reducedMotion: true })
    const instant: number[] = []
    const playback = reduced.director.play(tween({ ms: 400, from: 3, to: 9, update: (value) => instant.push(value) }))
    await expect(playback.finished).resolves.toBe('completed')
    expect(instant).toEqual([9])
  })

  it('annulla anche un tween in corso', async () => {
    const { time, director } = setup()
    const values: number[] = []
    const playback = director.play(tween({ ms: 1000, ease: 'linear', update: (value) => values.push(value) }))
    await time.advance(0)
    await time.frame(100)
    playback.cancel()
    await expect(playback.finished).resolves.toBe('cancelled')
    const seen = values.length
    await time.frame(100)
    expect(values).toHaveLength(seen)
  })
})
