import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { MoveVfxEvent } from '@/components/MoveVfx'
import { assetUrl } from '@/utils/assetUrl'
import { AnimatedSprite } from './AnimatedSprite'
import { FallbackVfx } from './FallbackVfx'
import { GifVfx } from './GifVfx'
import { resolveMoveVfxAsset } from './resolveMoveVfxAsset'
import type { MoveVfxAsset, VfxAnchor, VfxLayer } from './types'

type Position = { x: number; y: number }

const POSITIONS = {
  A: {
    attacker: { x: 25, y: 64 },
    target: { x: 77, y: 32 },
    self: { x: 25, y: 64 },
  },
  B: {
    attacker: { x: 77, y: 32 },
    target: { x: 25, y: 64 },
    self: { x: 77, y: 32 },
  },
} satisfies Record<'A' | 'B', Record<'attacker' | 'target' | 'self', Position>>

const CENTER: Position = { x: 50, y: 48 }

const Z_INDEX: Record<VfxLayer, number> = {
  'behind-pokemon': 30,
  'over-pokemon': 45,
  'front-ui': 60,
}

const PROJECTILE_ASSETS = new Set(['thrust', 'waterGif', 'energyGif'])
const COMPACT_VFX_QUERY = '(max-width: 640px)'

function getPosition(side: 'A' | 'B', anchor: VfxAnchor): Position {
  if (anchor === 'center' || anchor === 'screen') return CENTER
  return POSITIONS[side][anchor]
}

function StaticImageVfx({
  asset,
  effectId,
  style,
  onError,
}: {
  asset: MoveVfxAsset
  effectId: number
  style?: CSSProperties
  onError: () => void
}) {
  const separator = asset.src.includes('?') ? '&' : '?'
  return (
    <img
      src={`${assetUrl(asset.src)}${separator}vfx=${effectId}`}
      alt=""
      decoding="async"
      draggable={false}
      onError={onError}
      style={{
        width: asset.width,
        height: asset.height,
        objectFit: 'contain',
        pointerEvents: 'none',
        ...style,
      }}
      aria-hidden="true"
    />
  )
}

export function SpriteMoveVfx({ effect }: { effect: MoveVfxEvent }) {
  const asset = resolveMoveVfxAsset(effect.move)
  const reduceMotion = useReducedMotion()
  const [assetFailed, setAssetFailed] = useState(false)
  const [visible, setVisible] = useState(true)
  const [compact, setCompact] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(COMPACT_VFX_QUERY).matches
  )
  const anchor = effect.target === 'self' ? 'self' : asset.anchor
  const destination = getPosition(effect.side, anchor)
  const attacker = getPosition(effect.side, 'attacker')
  const projectile = anchor === 'target' && PROJECTILE_ASSETS.has(asset.id)
  const isScreen = anchor === 'screen'

  useEffect(() => {
    setAssetFailed(false)
    setVisible(true)
    const timeout = window.setTimeout(() => setVisible(false), asset.durationMs)
    return () => window.clearTimeout(timeout)
  }, [asset.durationMs, asset.id, effect.id])

  useEffect(() => {
    const mediaQuery = window.matchMedia(COMPACT_VFX_QUERY)
    const updateCompact = () => setCompact(mediaQuery.matches)
    updateCompact()
    mediaQuery.addEventListener('change', updateCompact)
    return () => mediaQuery.removeEventListener('change', updateCompact)
  }, [])

  useEffect(() => {
    if (assetFailed && import.meta.env.DEV) {
      console.warn(`[vfx] Missing or invalid asset "${asset.src}", using CSS fallback.`)
    }
  }, [asset.src, assetFailed])

  const onAssetError = useCallback(() => setAssetFailed(true), [])

  if (!visible) return null

  const visualStyle: CSSProperties = {
    opacity: asset.opacity ?? 1,
    mixBlendMode: asset.blendMode ?? 'normal',
    transform: [
      `scale(${(asset.scale ?? 1) * (compact ? 0.78 : 1)})`,
      effect.side === 'B' && asset.mirrorForEnemy ? 'scaleX(-1)' : '',
      effect.side === 'B' && asset.rotateDegForEnemy ? `rotate(${asset.rotateDegForEnemy}deg)` : '',
    ].filter(Boolean).join(' '),
    willChange: 'transform, opacity',
  }

  const visual = assetFailed ? (
    <FallbackVfx effectId={effect.id} />
  ) : asset.kind === 'gif' ? (
    <GifVfx asset={asset} effectId={effect.id} style={visualStyle} onError={onAssetError} />
  ) : asset.kind === 'sprite-sheet' && asset.sprite ? (
    <AnimatedSprite
      src={assetUrl(asset.src)}
      {...asset.sprite}
      width={asset.width}
      height={asset.height}
      durationMs={asset.durationMs}
      loop={asset.loop}
      style={visualStyle}
      onError={onAssetError}
    />
  ) : (
    <StaticImageVfx asset={asset} effectId={effect.id} style={visualStyle} onError={onAssetError} />
  )

  return (
    <motion.div
      className="pointer-events-none absolute flex items-center justify-center overflow-visible"
      data-move-vfx-id={effect.move.id}
      data-move-vfx-asset={asset.id}
      initial={{
        left: `${projectile ? attacker.x : destination.x}%`,
        top: `${projectile ? attacker.y : destination.y}%`,
        opacity: 0,
        scale: projectile ? 0.7 : 0.9,
      }}
      animate={{
        left: `${destination.x}%`,
        top: `${destination.y}%`,
        opacity: [0, 1, 1, 0],
        scale: projectile ? [0.7, 1.1, 1] : [0.9, 1.04, 1],
      }}
      transition={{ duration: reduceMotion ? 0 : asset.durationMs / 1000, ease: 'easeInOut' }}
      style={{
        zIndex: Z_INDEX[asset.layer],
        width: isScreen ? '100%' : asset.width,
        height: isScreen ? '100%' : asset.height,
        marginLeft: isScreen ? '-50%' : -(asset.width / 2) + (asset.offsetX ?? 0),
        marginTop: isScreen ? '-50%' : -(asset.height / 2) + (asset.offsetY ?? 0),
        willChange: 'left, top, transform, opacity',
      }}
      aria-hidden="true"
    >
      {visual}
    </motion.div>
  )
}
