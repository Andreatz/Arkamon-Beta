import type { CSSProperties } from 'react'
import { assetUrl } from '@/utils/assetUrl'
import { AnimatedSprite } from '@/components/vfx/AnimatedSprite'
import {
  getArkamonAnimationAsset,
  type ArkamonBattleAnimation,
  type ArkamonSpriteSide,
} from './arkamonAnimationManifest'

export function ArkamonBattleSprite({
  speciesId,
  name,
  side,
  animation,
  scale = 1,
  className = '',
  onError,
}: {
  speciesId: number
  name: string
  side: ArkamonSpriteSide
  animation: ArkamonBattleAnimation
  scale?: number
  className?: string
  onError?: () => void
}) {
  const animated = getArkamonAnimationAsset(speciesId, side, animation)
  const transformStyle: CSSProperties = {
    transform: `scale(${scale})`,
    transformOrigin: 'center bottom',
  }

  if (animated) {
    return (
      <AnimatedSprite
        src={assetUrl(animated.src)}
        frameWidth={animated.frameWidth}
        frameHeight={animated.frameHeight}
        columns={animated.columns}
        rows={animated.rows}
        frameCount={animated.frameCount}
        fps={animated.fps}
        width={animated.width}
        height={animated.height}
        durationMs={animated.durationMs}
        loop={animated.loop ?? animation === 'idle'}
        className={className}
        style={transformStyle}
        onError={onError}
      />
    )
  }

  const folder = side === 'back' ? 'back_sprites' : 'front_sprites'

  return (
    <img
      src={assetUrl(`/sprites/${folder}/${speciesId}.png`)}
      alt={name}
      className={className}
      style={transformStyle}
      onError={onError}
      draggable={false}
    />
  )
}
