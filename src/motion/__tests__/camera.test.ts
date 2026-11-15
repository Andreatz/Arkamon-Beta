import { describe, expect, it, vi } from 'vitest'
import {
  CAMERA_REST, createCameraController, layerTransform, poseForTarget, pruneShake, sampleDrift, sampleShake, shakeFromTrauma,
  type CameraDriver, type CameraPose, type ShakeImpulse,
} from '../camera'
import type { MotionSettings } from '../tokens'

function fakeDriver() {
  const calls: { kind: 'animate' | 'set' | 'shake'; pose?: CameraPose; ms?: number; ease?: string; shake?: unknown }[] = []
  const driver: CameraDriver = {
    animate: vi.fn((pose, ms, ease) => { calls.push({ kind: 'animate', pose, ms, ease }); return Promise.resolve() }),
    set: vi.fn((pose) => { calls.push({ kind: 'set', pose }) }),
    addShake: vi.fn((shake) => { calls.push({ kind: 'shake', shake }) }),
  }
  return { driver, calls }
}
const controller = (settings: MotionSettings = { speed: 1, reducedMotion: false }) => {
  const fake = fakeDriver()
  const camera = createCameraController(fake.driver, {
    getSettings: () => settings,
    resolveFocus: (name) => ({ enemy: { x: 0.8, y: 0.3 }, player: { x: 0.2, y: 0.7 } } as Record<string, { x: number; y: number }>)[name],
  })
  return { camera, ...fake }
}

describe('posa della cinepresa', () => {
  it('a zoom 1 non può spostarsi: il mondo deve coprire tutto il palco', () => {
    expect(poseForTarget({ focus: { x: 0.9, y: 0.1 } })).toEqual(CAMERA_REST)
  })

  it('porta il punto di interesse al centro quando lo zoom lo consente', () => {
    const pose = poseForTarget({ focus: { x: 0.6, y: 0.45 }, zoom: 2 })
    // Posizione a schermo del punto: traslazione + zoom × distanza dal centro.
    expect(pose.x + pose.zoom * (0.6 - 0.5)).toBeCloseTo(0, 9)
    expect(pose.y + pose.zoom * (0.45 - 0.5)).toBeCloseTo(0, 9)
  })

  it('limita la traslazione ai margini disponibili', () => {
    const pose = poseForTarget({ focus: { x: 1, y: 0 }, zoom: 1.2 })
    expect(pose.x).toBeCloseTo(-0.1, 9)
    expect(pose.y).toBeCloseTo(0.1, 9)
    // I bordi del mondo restano fuori o sul bordo del palco: ±0.5·zoom + traslazione copre ±0.5.
    expect(pose.x - pose.zoom / 2).toBeLessThanOrEqual(-0.5 + 1e-9)
    expect(pose.x + pose.zoom / 2).toBeGreaterThanOrEqual(0.5 - 1e-9)
  })

  it('normalizza zoom e coordinate fuori scala', () => {
    expect(poseForTarget({ zoom: 0.2 }).zoom).toBe(1)
    expect(poseForTarget({ zoom: 99 }).zoom).toBe(2.5)
    expect(poseForTarget({ zoom: Number.NaN }).zoom).toBe(1)
    expect(poseForTarget({ focus: { x: 7, y: -3 }, zoom: 2 })).toMatchObject({ x: -0.5, y: 0.5 })
  })

  it('senza un nuovo punto conserva l’inquadratura corrente', () => {
    const current = poseForTarget({ focus: { x: 0.7, y: 0.5 }, zoom: 1.5 })
    expect(poseForTarget({ rotate: 2 }, current)).toEqual({ ...current, rotate: 2 })
  })
})

describe('shake', () => {
  const impulse = (overrides: Partial<ShakeImpulse> = {}): ShakeImpulse => ({ amplitudePx: 20, rotateDeg: 1, durationMs: 400, frequencyHz: 13, seed: 3, startedAt: 1000, ...overrides })

  it('resta entro l’ampiezza, si spegne e termina alla durata', () => {
    const peaks: number[] = []
    for (let elapsed = 0; elapsed < 400; elapsed += 5) {
      const sample = sampleShake([impulse()], 1000 + elapsed)
      expect(sample.active).toBe(true)
      expect(Math.abs(sample.x)).toBeLessThanOrEqual(20)
      expect(Math.abs(sample.y)).toBeLessThanOrEqual(12)
      expect(Math.abs(sample.rotate)).toBeLessThanOrEqual(1)
      peaks.push(Math.abs(sample.x))
    }
    const early = Math.max(...peaks.slice(0, 20))
    const late = Math.max(...peaks.slice(-20))
    expect(early).toBeGreaterThan(8)
    expect(late).toBeLessThan(early / 4)
    expect(sampleShake([impulse()], 1400)).toEqual({ x: 0, y: 0, rotate: 0, active: false })
    expect(sampleShake([impulse()], 900).active).toBe(false)
  })

  it('è deterministico e somma gli impulsi contemporanei', () => {
    const one = sampleShake([impulse()], 1100)
    expect(sampleShake([impulse()], 1100)).toEqual(one)
    const two = sampleShake([impulse(), impulse()], 1100)
    expect(two.x).toBeCloseTo(one.x * 2, 9)
    expect(sampleShake([impulse({ seed: 9 })], 1100).x).not.toBeCloseTo(one.x, 6)
  })

  it('scarta gli impulsi conclusi', () => {
    expect(pruneShake([impulse(), impulse({ startedAt: 1300 })], 1450)).toEqual([impulse({ startedAt: 1300 })])
  })

  it('traduce il trauma in ampiezza quadratica', () => {
    expect(shakeFromTrauma(0)).toMatchObject({ amplitudePx: 0, durationMs: 0 })
    expect(shakeFromTrauma(1)).toMatchObject({ amplitudePx: 26, rotateDeg: 1.6, durationMs: 740 })
    expect(shakeFromTrauma(0.5).amplitudePx).toBeCloseTo(6.5, 9)
    expect(shakeFromTrauma(4)).toEqual(shakeFromTrauma(1))
    expect(shakeFromTrauma(-1)).toEqual(shakeFromTrauma(0))
  })
})

describe('parallasse e deriva', () => {
  it('il piano focale non riceve alcuna trasformazione', () => {
    expect(layerTransform({ x: 120, y: -40, zoom: 1.6 }, 1)).toEqual({ x: 0, y: 0, scale: 1 })
  })

  it('un livello lontano si sposta e ingrandisce meno del piano focale', () => {
    const camera = { x: 100, y: 50, zoom: 2 }
    const far = layerTransform(camera, 0.5)
    // Trasformazione apparente = camera ∘ livello: traslazione c + z·a, scala z·s.
    expect(camera.x + camera.zoom * far.x).toBeCloseTo(50, 9)
    expect(camera.y + camera.zoom * far.y).toBeCloseTo(25, 9)
    expect(camera.zoom * far.scale).toBeCloseTo(1.5, 9)
    const near = layerTransform(camera, 1.5)
    expect(camera.x + camera.zoom * near.x).toBeCloseTo(150, 9)
    expect(camera.zoom * near.scale).toBeCloseTo(2.5, 9)
  })

  it('applica il margine fisso anche a camera ferma', () => {
    expect(layerTransform({ x: 0, y: 0, zoom: 1 }, 0.8, 1.04)).toEqual({ x: 0, y: 0, scale: 1.04 })
  })

  it('la deriva resta entro i limiti configurati', () => {
    for (let now = 0; now < 30000; now += 250) {
      const drift = sampleDrift(now)
      expect(Math.abs(drift.x)).toBeLessThanOrEqual(0.006)
      expect(Math.abs(drift.y)).toBeLessThanOrEqual(0.004)
      expect(drift.zoom).toBeGreaterThanOrEqual(0)
      expect(drift.zoom).toBeLessThanOrEqual(0.012)
    }
  })
})

describe('controller della cinepresa', () => {
  it('risolve i punti con nome e scala la durata con la velocità', async () => {
    const { camera, calls } = controller({ speed: 2, reducedMotion: false })
    await camera.to({ focus: 'enemy', zoom: 1.5 })
    expect(calls).toHaveLength(1)
    expect(calls[0]).toMatchObject({ kind: 'animate', ms: 200, ease: 'out' })
    expect(calls[0].pose!.x).toBeCloseTo(-0.25, 9)
    expect(calls[0].pose!.zoom).toBe(1.5)
    expect(camera.pose).toEqual(calls[0].pose)
  })

  it('con il movimento ridotto resta a riposo e non scuote', async () => {
    const { camera, calls } = controller({ speed: 1, reducedMotion: true })
    await camera.to({ focus: 'enemy', zoom: 1.5 })
    camera.cut({ zoom: 2 })
    camera.shake({ amplitudePx: 12, durationMs: 300 })
    camera.impact(1)
    await camera.punch()
    expect(calls).toEqual([])
    expect(camera.pose).toEqual(CAMERA_REST)
    await camera.reset()
    expect(calls).toEqual([{ kind: 'set', pose: CAMERA_REST }])
  })

  it('lo stacco applica subito la posa e il reset torna a riposo', async () => {
    const { camera, calls } = controller()
    camera.cut({ focus: 'player', zoom: 1.4 })
    expect(calls[0].kind).toBe('set')
    await camera.reset(300)
    expect(calls[1]).toMatchObject({ kind: 'animate', pose: CAMERA_REST, ms: 300, ease: 'inOut' })
  })

  it('ignora gli shake nulli e accelera la frequenza in modalità rapida', () => {
    const { camera, calls } = controller({ speed: 2, reducedMotion: false })
    camera.shake({ amplitudePx: 0, durationMs: 300 })
    camera.shake({ amplitudePx: 10, durationMs: 0 })
    camera.shake({ amplitudePx: 10, durationMs: 300 })
    expect(calls).toEqual([{ kind: 'shake', shake: { amplitudePx: 10, durationMs: 300, rotateDeg: 0, frequencyHz: 26 } }])
  })

  it('il colpo di zoom torna alla posa di partenza, salvo un nuovo comando nel frattempo', async () => {
    const { camera, calls } = controller()
    await camera.to({ focus: 'enemy', zoom: 1.5 })
    const origin = camera.pose
    await camera.punch({ zoom: 1.1, ms: 200 })
    expect(calls.slice(1).map((call) => call.ms)).toEqual([70, 130])
    expect(calls[1].pose!.zoom).toBeCloseTo(1.65, 9)
    expect(calls[2].pose).toEqual(origin)

    const interrupted = controller()
    let resolvePeak!: () => void
    interrupted.driver.animate = vi.fn((pose, ms, ease) => {
      interrupted.calls.push({ kind: 'animate', pose, ms, ease })
      return interrupted.calls.length === 1 ? new Promise<void>((resolve) => { resolvePeak = resolve }) : Promise.resolve()
    })
    const punching = interrupted.camera.punch()
    await interrupted.camera.to({ focus: 'player', zoom: 1.3 })
    resolvePeak()
    await punching
    // Colpo (1) + nuovo comando (2): il ritorno del colpo non viene eseguito.
    expect(interrupted.calls).toHaveLength(2)
  })

  it('i metodi restano utilizzabili anche destrutturati', () => {
    const { camera, calls } = controller()
    const { impact } = camera
    impact(1)
    expect(calls[0]).toMatchObject({ kind: 'shake', shake: { amplitudePx: 26, durationMs: 740 } })
  })
})
