import type { CSSProperties } from 'react'
import { useReducedMotion } from 'framer-motion'
import { assetUrl } from '@/utils/assetUrl'
import type { MoveVfxAsset } from './types'

export function getGifRuntimeSrc(src: string, effectId: number): string {
  const separator = src.includes('?') ? '&' : '?'
  return `${src}${separator}vfx=${effectId}`
}

export function GifVfx({
  asset,
  effectId,
  className,
  style,
  onError,
}: {
  asset: MoveVfxAsset
  effectId: number
  className?: string
  style?: CSSProperties
  onError?: () => void
}) {
  const reduceMotion = useReducedMotion()
  const runtimeSrc = getGifRuntimeSrc(assetUrl(asset.src), effectId)

  if (reduceMotion) {
    return (
      <span
        className={className}
        style={{
          display: 'inline-block',
          width: asset.width,
          height: asset.height,
          borderRadius: '999px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.9), rgba(251,191,36,0.38) 48%, transparent 72%)',
          opacity: asset.opacity ?? 1,
          mixBlendMode: asset.blendMode ?? 'normal',
          pointerEvents: 'none',
          ...style,
        }}
        aria-hidden="true"
      />
    )
  }

  return (
    <img
      key={`${asset.id}-${effectId}`}
      src={runtimeSrc}
      alt=""
      decoding="async"
      draggable={false}
      className={className}
      onError={onError}
      style={{
        width: asset.width,
        height: asset.height,
        opacity: asset.opacity ?? 1,
        mixBlendMode: asset.blendMode ?? 'normal',
        pointerEvents: 'none',
        objectFit: 'contain',
        ...style,
      }}
      aria-hidden="true"
    />
  )
}
