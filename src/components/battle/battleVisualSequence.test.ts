import { describe, expect, it, vi } from 'vitest'
import { createBattleAnimationPlayback, createBattleVisualSequence, planBattleAnimationPlayback } from './battleVisualSequence'

function sequence(waitForAttacker = true, waitForTarget = true) {
  const callbacks = { onRelease: vi.fn(), onImpact: vi.fn(), onComplete: vi.fn() }
  return { ...callbacks, ...createBattleVisualSequence({ waitForAttacker, waitForTarget, ...callbacks }) }
}

describe('battle visuals before the dice', () => {
  it('releases the move at the actual attack cue, with no duplicate impact or dice', () => {
    const run = sequence()
    run.release()
    run.release()
    expect(run.onRelease).toHaveBeenCalledTimes(1)
    run.impact()
    run.impact()
    expect(run.onImpact).toHaveBeenCalledTimes(1)
    run.attackerComplete()
    run.vfxComplete()
    expect(run.onComplete).not.toHaveBeenCalled()
    run.targetComplete()
    run.targetComplete()
    run.vfxComplete()
    expect(run.onComplete).toHaveBeenCalledTimes(1)
  })

  it('waits for the complete defender film when the attacker and VFX finish first', () => {
    const run = sequence()
    run.release()
    run.impact()
    run.attackerComplete()
    run.vfxComplete()
    expect(run.onComplete).not.toHaveBeenCalled()
    run.targetComplete()
    expect(run.onComplete).toHaveBeenCalledTimes(1)
  })

  it('waits for a late loaded attack after the defender and effect complete', () => {
    const run = sequence()
    run.release()
    run.impact()
    run.targetComplete()
    run.vfxComplete()
    expect(run.onComplete).not.toHaveBeenCalled()
    run.attackerComplete()
    expect(run.onComplete).toHaveBeenCalledTimes(1)
  })

  it('continues through a failed attack and VFX without applying damage twice', () => {
    const run = sequence()
    run.attackerComplete()
    expect(run.onRelease).toHaveBeenCalledTimes(1)
    run.vfxComplete()
    expect(run.onImpact).toHaveBeenCalledTimes(1)
    expect(run.onComplete).not.toHaveBeenCalled()
    run.targetComplete()
    expect(run.onComplete).toHaveBeenCalledTimes(1)
  })

  it('uses the same impact ordering for static sprites, without waiting for absent films', () => {
    const run = sequence(false, false)
    run.vfxComplete()
    run.impact()
    expect(run.onImpact).not.toHaveBeenCalled()
    run.release()
    run.impact()
    expect(run.onComplete).not.toHaveBeenCalled()
    run.vfxComplete()
    expect(run.onComplete).toHaveBeenCalledTimes(1)
  })

  it('ignores late media callbacks after unmount or interruption', () => {
    const run = sequence()
    run.release()
    run.cancel()
    run.impact()
    run.attackerComplete()
    run.targetComplete()
    run.vfxComplete()
    expect(run.onRelease).toHaveBeenCalledTimes(1)
    expect(run.onImpact).not.toHaveBeenCalled()
    expect(run.onComplete).not.toHaveBeenCalled()
  })
})

describe('native attack and hit pose alignment', () => {
  it('starts the defender early enough to reach its reaction pose at VFX impact', () => {
    const plan = planBattleAnimationPlayback(2000, 1250, 400)
    expect(plan).toEqual({ attackerAtMs: 0, hitAtMs: 1150, vfxAtMs: 2000, impactAtMs: 2400 })
    expect(plan.hitAtMs + 1250).toBe(plan.impactAtMs)
  })

  it('prerolls the defender when the attacker has no dedicated attack clip', () => {
    const plan = planBattleAnimationPlayback(0, 1250, 400)
    expect(plan).toEqual({ attackerAtMs: 850, hitAtMs: 0, vfxAtMs: 850, impactAtMs: 1250 })
    expect(plan.hitAtMs + 1250).toBe(plan.impactAtMs)
  })

  it('delays both attack and VFX if the reaction lead exceeds the attack preparation', () => {
    const plan = planBattleAnimationPlayback(250, 1250, 400)
    expect(plan).toEqual({ attackerAtMs: 600, hitAtMs: 0, vfxAtMs: 850, impactAtMs: 1250 })
  })

  it('starts a KO at impact without playing the separate hit film first', () => {
    expect(planBattleAnimationPlayback(2000, 0, 400)).toEqual({
      attackerAtMs: 0, hitAtMs: 2400, vfxAtMs: 2000, impactAtMs: 2400,
    })
  })

  it('keeps direct static feedback at the actual effect impact', () => {
    expect(planBattleAnimationPlayback(0, 0, 400)).toEqual({
      attackerAtMs: 0, hitAtMs: 400, vfxAtMs: 0, impactAtMs: 400,
    })
  })
})

describe('ready native clocks', () => {
  function playback(attackReleaseMs: number, hitReactionMs: number, vfxImpactMs: number, dedicatedAttack = true) {
    const jobs: { callback: () => void; delayMs: number }[] = []
    const callbacks = { startAttack: vi.fn(), startHit: vi.fn(), onRelease: vi.fn() }
    const run = createBattleAnimationPlayback({
      plan: planBattleAnimationPlayback(attackReleaseMs, hitReactionMs, vfxImpactMs),
      dedicatedAttack, dedicatedHit: hitReactionMs > 0, ...callbacks,
      schedule: (callback, delayMs) => { jobs.push({ callback, delayMs }) },
    })
    return { ...callbacks, ...run, jobs }
  }

  it('counts the hit lead from the actual loaded attack start, not from the user click', () => {
    const run = playback(2000, 1250, 400)
    run.start()
    expect(run.startAttack).toHaveBeenCalledTimes(1)
    expect(run.startHit).not.toHaveBeenCalled()
    expect(run.jobs).toHaveLength(0)
    run.attackerStart()
    expect(run.jobs[0].delayMs).toBe(1150)
    run.jobs[0].callback()
    expect(run.startHit).toHaveBeenCalledTimes(1)
    expect(run.onRelease).not.toHaveBeenCalled()
    run.release()
    run.release()
    expect(run.onRelease).toHaveBeenCalledTimes(1)
  })

  it('prerolls a hit from its own ready start before a static attacker releases the move', () => {
    const run = playback(0, 1250, 400, false)
    run.start()
    expect(run.startHit).toHaveBeenCalledTimes(1)
    expect(run.startAttack).not.toHaveBeenCalled()
    run.targetStart()
    expect(run.jobs[0].delayMs).toBe(850)
    run.jobs[0].callback()
    expect(run.startAttack).toHaveBeenCalledTimes(1)
    expect(run.onRelease).toHaveBeenCalledTimes(1)
  })

  it('counts a delayed hit from the VFX ready start for a static attacker', () => {
    const run = playback(0, 250, 1000, false)
    run.start()
    expect(run.startAttack).toHaveBeenCalledTimes(1)
    expect(run.onRelease).toHaveBeenCalledTimes(1)
    expect(run.jobs).toHaveLength(0)
    run.vfxStart()
    expect(run.jobs[0].delayMs).toBe(750)
    run.jobs[0].callback()
    expect(run.startHit).toHaveBeenCalledTimes(1)
  })

  it('cancels delayed playback without letting old jobs start another attack', () => {
    const run = playback(250, 1250, 400)
    run.start()
    run.targetStart()
    run.cancel()
    run.jobs[0].callback()
    run.release()
    expect(run.startAttack).not.toHaveBeenCalled()
    expect(run.onRelease).not.toHaveBeenCalled()
  })
})
