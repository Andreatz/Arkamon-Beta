import type { CSSProperties } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
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
  const reduceMotion = useReducedMotion()
  const animated = getArkamonAnimationAsset(speciesId, side, animation)
  const transformStyle: CSSProperties = {
    transform: `scale(${scale})`,
    transformOrigin: 'center bottom',
  }

  if (animated) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={transformStyle}
      >
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
          onError={onError}
        />
      </div>
    )
  }

  const folder = side === 'back' ? 'back_sprites' : 'front_sprites'
  const idle = animation === 'idle' && !reduceMotion

  return (
    <div className={className} style={transformStyle}>
      <motion.img
        src={assetUrl(`/sprites/${folder}/${speciesId}.png`)}
        alt={name}
        className="h-full w-full object-contain"
        animate={
          idle
            ? {
                y: [0, -3, 0],
                rotate: [0, -0.35, 0.35, 0],
                scale: [1, 1.012, 1],
              }
            : { y: 0, rotate: 0, scale: 1 }
        }
        transition={
          idle
            ? {
                duration: 2.6,
                ease: 'easeInOut',
                repeat: Infinity,
                repeatType: 'mirror',
              }
            : { duration: 0.16, ease: 'easeOut' }
        }
        onError={onError}
        draggable={false}
      />
    </div>
  )
}
