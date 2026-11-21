import { describe, expect, it } from 'vitest'
import { MOSSE } from '@data/index'
import { poseForTarget } from '@/motion/camera'
import { attackerShot, damageRevealShake, DUEL_FRAME_MARGIN, frameBothSides, targetShot } from './battleCinematics'
import { resolveMoveVfxProfile, VFX_TRAVEL_BY_ARCHETYPE } from '@/components/vfx/moveVfxProfiles'
import { planVfxTravel, MIN_TRAVEL_MS } from '@/components/vfx/VfxTravelTrail'
import { projectileTransition } from '@/components/vfx/MoveVfxLayer'

const points = { player: { x: 0.23, y: 0.67 }, enemy: { x: 0.78, y: 0.31 } }

function inFrame(point: { x: number; y: number }, shot: ReturnType<typeof frameBothSides>) {
  const pose = poseForTarget({ focus: shot.focus as { x: number; y: number }, zoom: (shot.zoom ?? 1) * 1.07 })
  const cx = 0.5 - pose.x / pose.zoom, cy = 0.5 - pose.y / pose.zoom, half = 0.5 / pose.zoom
  return Math.abs(point.x - cx) <= half - DUEL_FRAME_MARGIN.x + 1e-9 && Math.abs(point.y - cy) <= half - DUEL_FRAME_MARGIN.y + 1e-9
}

describe('peso del colpo (audit fase 5)', () => {
  it('ferma l’immagine fra 60 e 90 ms per ogni colpo fisico, e non per cure o stati', () => {
    for (const move of MOSSE) {
      const { intensity, archetype, feedback } = resolveMoveVfxProfile(move)
      if (intensity === 'subtle' || archetype === 'heal') expect(feedback.hitStopMs, move.nome).toBe(0)
      else {
        expect(feedback.hitStopMs, move.nome).toBeGreaterThanOrEqual(60)
        expect(feedback.hitStopMs, move.nome).toBeLessThanOrEqual(90)
      }
    }
  })

  it('assegna a ogni mossa un percorso coerente con la sua famiglia', () => {
    for (const move of MOSSE) {
      const profile = resolveMoveVfxProfile(move)
      expect(profile.travel, move.nome).toBe(VFX_TRAVEL_BY_ARCHETYPE[profile.archetype])
      if (profile.archetype === 'heal' || profile.archetype === 'status') expect(profile.travel).toBe('burst')
    }
  })

  it('mostra il viaggio solo verso l’avversario, con tempo sufficiente e senza movimento ridotto', () => {
    const base = { travel: 'projectile' as const, target: 'opponent' as const, reducedMotion: false, impactMs: 400, from: { x: 20, y: 70 }, to: { x: 80, y: 30 } }
    expect(planVfxTravel(base)).toMatchObject({ travel: 'projectile', arriveMs: 400 })
    expect(planVfxTravel({ ...base, travel: 'burst' })).toBeNull()
    expect(planVfxTravel({ ...base, target: 'self' })).toBeNull()
    expect(planVfxTravel({ ...base, reducedMotion: true })).toBeNull()
    expect(planVfxTravel({ ...base, impactMs: MIN_TRAVEL_MS - 1 })).toBeNull()
  })

  it('fa arrivare il proiettile all’impatto invece che a fine effetto', () => {
    const transition = projectileTransition(1.2, 450, 1200, 1) as { left?: { duration: number } }
    expect(transition.left?.duration).toBeCloseTo(0.45)
    expect(projectileTransition(1.2, 450, 1200, 2)).toMatchObject({ left: { duration: 0.225 } })
    expect(projectileTransition(1.2, undefined, 1200, 1)).not.toHaveProperty('left')
    expect(projectileTransition(0, 450, 1200, 1)).not.toHaveProperty('left')
  })

  it('scuote il bersaglio in proporzione al danno rivelato', () => {
    expect(damageRevealShake(0, 20)).toBeNull()
    const scratch = damageRevealShake(1, 40)!, half = damageRevealShake(20, 40)!, ko = damageRevealShake(5, 40, true)!
    expect(half.px).toBeGreaterThan(scratch.px)
    expect(half.ms).toBeGreaterThan(scratch.ms)
    expect(ko.px).toBeGreaterThanOrEqual(half.px)
  })

  it.each([
    ['attacco di G1', attackerShot('A', false)], ['attacco di G2', attackerShot('B', false)],
    ['Suprema', attackerShot('A', true)], ['rilascio su G2', targetShot('B', false)], ['rilascio Suprema su G1', targetShot('A', true)],
  ])('tiene in quadro entrambi gli Arkamon: %s', (_label, shot) => {
    const framed = frameBothSides(shot, points)
    expect(framed.zoom).toBeGreaterThanOrEqual(1)
    expect(framed.zoom).toBeLessThanOrEqual(shot.zoom ?? 1)
    expect(inFrame(points.player, framed)).toBe(true)
    expect(inFrame(points.enemy, framed)).toBe(true)
  })

  it('lascia invariati i primi piani che non riguardano lo scambio', () => {
    const custom = { focus: { x: 0.5, y: 0.5 }, zoom: 1.3 }
    expect(frameBothSides(custom, points)).toBe(custom)
  })
})

describe('scia del percorso', () => {
  it('disegna un raggio SVG e un proiettile con il colore del tipo', async () => {
    const { renderToStaticMarkup } = await import('react-dom/server')
    const { createElement } = await import('react')
    const { VfxTravelTrail } = await import('@/components/vfx/VfxTravelTrail')
    const plan = { from: { x: 20, y: 70 }, to: { x: 80, y: 30 }, arriveMs: 360 }
    const beam = renderToStaticMarkup(createElement(VfxTravelTrail, { side: 'A', effectId: 1, color: '#fb923c', plan: { ...plan, travel: 'beam' } }))
    expect(beam).toContain('data-vfx-travel="beam"')
    expect(beam).toContain('<line')
    expect(beam).toContain('#fb923c')
    const orb = renderToStaticMarkup(createElement(VfxTravelTrail, { side: 'B', effectId: 2, color: '#38bdf8', plan: { ...plan, travel: 'projectile' } }))
    expect(orb).toContain('data-vfx-travel="projectile"')
    expect(orb).toContain('radial-gradient')
  })
})
