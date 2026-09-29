import { useEffect, useState } from 'react'
import type { MoveVfxEvent } from '@/components/MoveVfx'
import { CompositeMoveVfx } from './CompositeMoveVfx'
import { MoveVfxLayer } from './MoveVfxLayer'
import {
  resolveMoveVfxAsset,
  resolveMoveVfxRecipe,
} from './resolveMoveVfxAsset'

export function SpriteMoveVfx({ effect }: { effect: MoveVfxEvent }) {
  const asset = resolveMoveVfxAsset(effect.move)
  const recipe = resolveMoveVfxRecipe(effect.move)
  const durationMs = recipe?.durationMs ?? asset.durationMs
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    setVisible(true)
    const timeout = window.setTimeout(() => setVisible(false), durationMs)
    return () => window.clearTimeout(timeout)
  }, [durationMs, effect.id, recipe?.id, asset.id])

  if (!visible) return null

  if (recipe) {
    return <CompositeMoveVfx effect={effect} recipe={recipe} />
  }

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-visible"
      data-move-vfx-id={effect.move.id}
      data-move-vfx-asset={asset.id}
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
