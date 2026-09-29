import type { CSSProperties } from 'react'
import {
  motion,
  useReducedMotion,
  type TargetAndTransition,
  type Transition,
} from 'framer-motion'
import { assetUrl } from '@/utils/assetUrl'
import { AnimatedSprite } from '@/components/vfx/AnimatedSprite'
import {
  getArkamonAnimationAsset,
  type ArkamonBattleAnimation,
  type ArkamonSpriteSide,
} from './arkamonAnimationManifest'
import { getArkamonMotionProfile } from './arkamonMotionProfiles'

function getProceduralMotion(
  speciesId: number,
  side: ArkamonSpriteSide,
  animation: ArkamonBattleAnimation,
  reduceMotion: boolean
): { animate: TargetAndTransition; transition: Transition } {
  const profile = getArkamonMotionProfile(speciesId)
  const direction = side === 'back' ? 1 : -1

  if (reduceMotion) {
    return {
      animate: { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1, filter: 'brightness(1)' },
      transition: { duration: 0.1 },
    }
  }

  switch (animation) {
    case 'physical':
      return {
        animate: {
          x: [0, direction * profile.physicalDistance, 0],
          y: [0, -profile.physicalLift, 0],
          rotate: [0, direction * profile.physicalTilt, 0],
          scale: [1, profile.physicalScale, 1],
        },
        transition: { duration: 0.46, ease: 'easeInOut' },
      }

    case 'special':
      return {
        animate: {
          y: [0, -profile.specialLift, 0],
          rotate: [
            0,
            direction * profile.specialTilt,
            -direction * profile.specialTilt * 0.65,
            0,
          ],
          scale: [1, profile.specialScale, 1],
          filter: [
            'brightness(1) drop-shadow(0 0 0 transparent)',
            `brightness(1.28) drop-shadow(0 0 18px ${profile.specialGlow})`,
            'brightness(1) drop-shadow(0 0 0 transparent)',
          ],
        },
        transition: { duration: 0.72, ease: 'easeInOut' },
      }

    case 'hit':
      return {
        animate: {
          scale: [1, profile.hitScale, 1.025, 1],
          filter: [
            'brightness(1)',
            'brightness(2.2) saturate(0.45)',
            'brightness(1)',
          ],
        },
        transition: { duration: 0.24, ease: 'easeOut' },
      }

    case 'ko':
      return {
        animate: {
          y: [0, 8],
          rotate: [0, direction * profile.koTilt],
          scale: [1, 0.96],
          opacity: [1, 0.56],
        },
        transition: { duration: 0.42, ease: 'easeOut' },
      }

    case 'victory':
      return {
        animate: {
          y: [0, -profile.victoryLift, 0],
          rotate: [
            0,
            -direction * profile.victoryTilt,
            direction * profile.victoryTilt,
            0,
          ],
          scale: [1, 1.045, 1],
        },
        transition: {
          duration: 1.15,
          ease: 'easeInOut',
          repeat: Infinity,
          repeatDelay: 0.18,
        },
      }

    case 'idle':
    default:
      return {
        animate: {
          y: [0, -profile.idleLift, 0],
          rotate: [0, -profile.idleTilt, profile.idleTilt, 0],
          scale: [1, profile.idleScale, 1],
        },
        transition: {
          duration: profile.idleSeconds,
          ease: 'easeInOut',
          repeat: Infinity,
          repeatType: 'mirror',
        },
      }
  }
}

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
        data-arkamon-animation={animation}
        data-arkamon-renderer="sprite-sheet"
      >
        <AnimatedSprite
          src={assetUrl(animated.src)}
          frameWidth={animated.frameWidth}
          frameHeight={animated.frameHeight}
          columns={animated.columns}
          rows={animated.rows}
          frameCount={animated.frameCount}
          startFrame={animated.startFrame}
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
  const procedural = getProceduralMotion(speciesId, side, animation, !!reduceMotion)

  return (
    <div
      className={className}
      style={transformStyle}
      data-arkamon-animation={animation}
      data-arkamon-renderer="procedural"
    >
      <motion.img
        src={assetUrl(`/sprites/${folder}/${speciesId}.png`)}
        alt={name}
        className="h-full w-full object-contain"
        animate={procedural.animate}
        transition={procedural.transition}
        onError={onError}
        draggable={false}
      />
    </div>
  )
}
