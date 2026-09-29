import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { assetUrl } from '@/utils/assetUrl'
import { AnimatedSprite } from './AnimatedSprite'
import { FallbackVfx } from './FallbackVfx'
import { GifVfx } from './GifVfx'
import type {
  MoveVfxAsset,
  VfxAnchor,
  VfxBlendMode,
  VfxLayer,
  VfxMotion,
} from './types'

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

export const VFX_Z_INDEX: Record<VfxLayer, number> = {
  'behind-pokemon': 30,
  'over-pokemon': 45,
  'front-ui': 60,
}

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

export function MoveVfxLayer({
  asset,
  effectId,
  side,
  target,
  durationMs,
  anchor: anchorOverride,
  layer: layerOverride,
  motion: motionOverride,
  scaleMultiplier = 1,
  offsetX = 0,
  offsetY = 0,
  opacity,
  blendMode,
}: {
  asset: MoveVfxAsset
  effectId: number
  side: 'A' | 'B'
  target?: 'opponent' | 'self'
  durationMs?: number
  anchor?: VfxAnchor
  layer?: VfxLayer
  motion?: VfxMotion
  scaleMultiplier?: number
  offsetX?: number
  offsetY?: number
  opacity?: number
  blendMode?: VfxBlendMode
}) {
  const reduceMotion = useReducedMotion()
  const [assetFailed, setAssetFailed] = useState(false)
  const [compact, setCompact] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(COMPACT_VFX_QUERY).matches
  )
  const duration = durationMs ?? asset.durationMs
  const anchor = target === 'self' ? 'self' : anchorOverride ?? asset.anchor
  const layer = layerOverride ?? asset.layer
  const motionType = motionOverride ?? asset.motion ?? 'static'
  const destination = getPosition(side, anchor)
  const attacker = getPosition(side, 'attacker')
  const projectile = anchor === 'target' && motionType === 'projectile'
  const isScreen = anchor === 'screen'

  useEffect(() => {
    setAssetFailed(false)
  }, [asset.id, effectId])

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

  const visualStyle: CSSProperties = {
    opacity: opacity ?? asset.opacity ?? 1,
    mixBlendMode: blendMode ?? asset.blendMode ?? 'normal',
    transform: [
      `scale(${(asset.scale ?? 1) * scaleMultiplier * (compact ? 0.78 : 1)})`,
      side === 'B' && asset.mirrorForEnemy ? 'scaleX(-1)' : '',
      side === 'B' && asset.rotateDegForEnemy ? `rotate(${asset.rotateDegForEnemy}deg)` : '',
    ].filter(Boolean).join(' '),
    willChange: 'transform, opacity',
  }

  const visual = assetFailed ? (
    <FallbackVfx effectId={effectId} />
  ) : asset.kind === 'gif' ? (
    <GifVfx asset={asset} effectId={effectId} style={visualStyle} onError={onAssetError} />
  ) : asset.kind === 'sprite-sheet' && asset.sprite ? (
    <AnimatedSprite
      src={assetUrl(asset.src)}
      {...asset.sprite}
      width={asset.width}
      height={asset.height}
      durationMs={duration}
      loop={asset.loop}
      style={visualStyle}
      onError={onAssetError}
    />
  ) : (
    <StaticImageVfx asset={asset} effectId={effectId} style={visualStyle} onError={onAssetError} />
  )

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-visible"
      style={{ zIndex: VFX_Z_INDEX[layer] }}
      aria-hidden="true"
    >
      <motion.div
        className="absolute flex items-center justify-center overflow-visible"
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
        transition={{ duration: reduceMotion ? 0 : duration / 1000, ease: 'easeInOut' }}
        style={{
          width: isScreen ? '100%' : asset.width,
          height: isScreen ? '100%' : asset.height,
          marginLeft: isScreen
            ? '-50%'
            : -(asset.width / 2) + (asset.offsetX ?? 0) + offsetX,
          marginTop: isScreen
            ? '-50%'
            : -(asset.height / 2) + (asset.offsetY ?? 0) + offsetY,
          willChange: 'left, top, transform, opacity',
        }}
      >
        {visual}
      </motion.div>
    </div>
  )
}
