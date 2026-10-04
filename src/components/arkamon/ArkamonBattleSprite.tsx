import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import {
  motion,
  useAnimation,
  useReducedMotion,
  type TargetAndTransition,
  type Transition,
} from 'framer-motion'
import { assetUrl } from '@/utils/assetUrl'
import { AnimatedSprite } from '@/components/vfx/AnimatedSprite'
import {
  resolveArkamonAnimationAsset,
  type ArkamonBattleAnimation,
  type ArkamonSpriteSide,
  type ResolvedArkamonAnimation,
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
  animationEnabled = true,
  replayKey = 0,
  className = '',
  onError,
}: {
  speciesId: number
  name: string
  side: ArkamonSpriteSide
  animation: ArkamonBattleAnimation
  scale?: number
  animationEnabled?: boolean
  replayKey?: number
  className?: string
  onError?: () => void
}) {
  const reduceMotion = useReducedMotion()
  const resolved = animationEnabled ? resolveArkamonAnimationAsset(speciesId, side, animation) : undefined
  const transformStyle: CSSProperties = {
    transform: `scale(${scale})`,
    transformOrigin: 'center bottom',
  }

  if (resolved) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ ...transformStyle, width: '100%', height: '100%', containerType: 'size' }}
        role="img"
        aria-label={name}
        data-arkamon-animation={animation}
      >
        <AnimatedArkamonVisual
          key={`${speciesId}:${side}:${resolved.asset.src}`}
          speciesId={speciesId}
          side={side}
          animation={animation}
          resolved={resolved}
          animationEnabled={animationEnabled}
          replayKey={replayKey}
          reduceMotion={!!reduceMotion}
          onError={onError}
        />
      </div>
    )
  }

  const folder = side === 'back' ? 'back_sprites' : 'front_sprites'
  const procedural = getProceduralMotion(speciesId, side, animation, !!reduceMotion || !animationEnabled)

  return (
    <div
      className={className}
      style={transformStyle}
      data-arkamon-animation={animation}
      data-arkamon-renderer="procedural"
      data-arkamon-playback={reduceMotion || !animationEnabled ? 'paused' : 'playing'}
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

/** The key above scopes a failed sheet to its species, view, and source. */
function AnimatedArkamonVisual({
  speciesId,
  side,
  animation,
  resolved,
  animationEnabled,
  replayKey,
  reduceMotion,
  onError,
}: {
  speciesId: number
  side: ArkamonSpriteSide
  animation: ArkamonBattleAnimation
  resolved: ResolvedArkamonAnimation
  animationEnabled: boolean
  replayKey: number
  reduceMotion: boolean
  onError?: () => void
}) {
  const [sheetFailed, setSheetFailed] = useState(false)
  const controls = useAnimation()
  const onSheetError = useCallback(() => setSheetFailed(true), [])
  const animated = resolved.asset
  const aspect = animated.width / animated.height
  const paused = !animationEnabled || reduceMotion || (animation === 'ko' && resolved.isIdleFallback)
  const useProcedural = sheetFailed || resolved.isIdleFallback
  const folder = side === 'back' ? 'back_sprites' : 'front_sprites'

  useEffect(() => {
    const neutral = getProceduralMotion(speciesId, side, animation, true)
    if (useProcedural) {
      const procedural = getProceduralMotion(speciesId, side, animation, reduceMotion || !animationEnabled)
      // Replay only the action transform; the mounted idle player keeps its phase.
      void controls.start({
        ...neutral.animate,
        ...procedural.animate,
        transition: procedural.transition,
      })
    } else {
      controls.set(neutral.animate)
    }
    return () => controls.stop()
  }, [controls, speciesId, side, animation, reduceMotion, animationEnabled, useProcedural, replayKey])

  return (
    <motion.div
      // Both dimensions are constrained by the battle slot, with no stretching.
      style={{
        width: `min(100cqw, ${aspect * 100}cqh)`,
        height: `min(100cqh, ${100 / aspect}cqw)`,
        aspectRatio: String(aspect),
        transformOrigin: 'center bottom',
      }}
      animate={controls}
      data-arkamon-renderer={sheetFailed ? 'procedural' : 'sprite-sheet'}
      data-arkamon-asset-animation={resolved.animation}
      data-arkamon-motion={useProcedural ? 'procedural' : 'none'}
      data-arkamon-playback={paused ? 'paused' : 'playing'}
    >
      {sheetFailed ? (
        <img
          src={assetUrl(`/sprites/${folder}/${speciesId}.png`)}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-contain"
          onError={onError}
          draggable={false}
        />
      ) : (
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
          loop={animated.loop ?? resolved.animation === 'idle'}
          responsive
          paused={paused}
          onError={onSheetError}
        />
      )}
    </motion.div>
  )
}
