import { useEffect, useRef, useState } from 'react'
import type { MoveVfxEvent, MoveVfxPlaybackCallbacks } from '@/components/MoveVfx'
import { CompositeMoveVfx } from './CompositeMoveVfx'
import { MoveVfxLayer } from './MoveVfxLayer'
import {
  getMoveVfxImpactDelayMs,
  resolveMoveVfxAsset,
  resolveMoveVfxRecipe,
} from './resolveMoveVfxAsset'
import { prepareMoveVfxPlayback } from './preloadVfxAssets'

export function SpriteMoveVfx({ effect, onStart, onImpact, onComplete }: { effect: MoveVfxEvent } & MoveVfxPlaybackCallbacks) {
  const asset = resolveMoveVfxAsset(effect.move)
  const recipe = resolveMoveVfxRecipe(effect.move)
  const durationMs = recipe?.durationMs ?? asset.durationMs
  const impactMs = getMoveVfxImpactDelayMs(effect.move)
  const [readyId, setReadyId] = useState<number | null>(null)
  const [completedId, setCompletedId] = useState<number | null>(null)
  const callbacksRef = useRef({ onStart, onImpact, onComplete })
  callbacksRef.current = { onStart, onImpact, onComplete }

  useEffect(() => {
    let active = true
    void prepareMoveVfxPlayback(effect.move, effect.id, true).then(() => {
      if (active) setReadyId(effect.id)
    })
    return () => { active = false }
  }, [effect.id, effect.move, recipe?.id, asset.id])

  useEffect(() => {
    if (readyId !== effect.id) return
    let active = true
    let impacted = false
    const impact = () => {
      if (!active || impacted) return
      impacted = true
      callbacksRef.current.onImpact?.()
    }
    let impactTimer: number | undefined
    let completeTimer: number | undefined
    // The prepared layers and their frame players share this first paint clock.
    const firstFrame = requestAnimationFrame(() => {
      if (!active) return
      callbacksRef.current.onStart?.()
      impactTimer = window.setTimeout(impact, Math.max(0, Math.min(impactMs, durationMs)))
      completeTimer = window.setTimeout(() => {
        if (!active) return
        impact()
        setCompletedId(effect.id)
        callbacksRef.current.onComplete?.()
      }, durationMs)
    })
    return () => {
      active = false
      cancelAnimationFrame(firstFrame)
      window.clearTimeout(impactTimer)
      window.clearTimeout(completeTimer)
    }
  }, [readyId, effect.id, durationMs, impactMs])

  if (readyId !== effect.id || completedId === effect.id) return null

  if (recipe) {
    return <CompositeMoveVfx effect={effect} recipe={recipe} />
  }

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-visible"
      data-move-vfx-id={effect.move.id}
      data-move-vfx-asset={asset.id}
      data-move-vfx-event={effect.id}
      aria-hidden="true"
    >
      <MoveVfxLayer
        asset={asset}
        effectId={effect.id}
        side={effect.side}
        target={effect.target}
      />
    </div>
  )
}
