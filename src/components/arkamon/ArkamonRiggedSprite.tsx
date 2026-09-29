import { useId } from 'react'
import {
  motion,
  useReducedMotion,
  type TargetAndTransition,
  type Transition,
} from 'framer-motion'
import { assetUrl } from '@/utils/assetUrl'
import type { ArkamonBattleAnimation } from './arkamonAnimationManifest'
import type {
  ArkamonRigMotion,
  ArkamonSpriteRig,
} from './arkamonRigManifest'

function polygonPoints(points: { x: number; y: number }[]): string {
  return points.map((point) => `${point.x},${point.y}`).join(' ')
}

function getMotion(
  motionDef: ArkamonRigMotion | undefined,
  reduceMotion: boolean
): { animate: TargetAndTransition; transition: Transition } {
  if (!motionDef || reduceMotion) {
    return {
      animate: {},
      transition: { duration: 0 },
    }
  }

  const animate: TargetAndTransition = {}

  if (motionDef.rotate) animate.rotate = motionDef.rotate
  if (motionDef.x) animate.x = motionDef.x
  if (motionDef.y) animate.y = motionDef.y
  if (motionDef.scale) animate.scale = motionDef.scale
  if (motionDef.scaleX) animate.scaleX = motionDef.scaleX
  if (motionDef.scaleY) animate.scaleY = motionDef.scaleY
  if (motionDef.opacity) animate.opacity = motionDef.opacity

  return {
    animate,
    transition: {
      duration: motionDef.durationMs / 1000,
      delay: (motionDef.delayMs ?? 0) / 1000,
      repeat: motionDef.loop ? Infinity : 0,
      repeatDelay: (motionDef.repeatDelayMs ?? 0) / 1000,
      repeatType: motionDef.loop ? 'loop' : undefined,
      ease: motionDef.ease ?? 'easeInOut',
    },
  }
}

export function ArkamonRiggedSprite({
  rig,
  name,
  animation,
  scale = 1,
  className = '',
  onError,
}: {
  rig: ArkamonSpriteRig
  name: string
  animation: ArkamonBattleAnimation
  scale?: number
  className?: string
  onError?: () => void
}) {
  const reduceMotion = !!useReducedMotion()
  const reactId = useId().replace(/:/g, '')
  const maskId = `arkamon-rig-mask-${reactId}`
  const src = assetUrl(rig.src)
  const { width, height } = rig.canvas
  const cutoutParts = rig.parts.filter((part) => part.cutout)

  return (
    <div
      className={`relative overflow-visible ${className}`}
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'center bottom',
      }}
      role="img"
      aria-label={name}
      data-arkamon-animation={animation}
      data-arkamon-renderer="rig"
    >
      <svg
        className="absolute inset-0 h-full w-full overflow-visible"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <mask
            id={maskId}
            maskUnits="userSpaceOnUse"
            maskContentUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={width}
            height={height}
          >
            <rect x={0} y={0} width={width} height={height} fill="white" />
            {cutoutParts.map((part) => (
              <polygon
                key={part.id}
                points={polygonPoints(part.polygon)}
                fill="black"
              />
            ))}
          </mask>
        </defs>

        <image
          href={src}
          x={0}
          y={0}
          width={width}
          height={height}
          preserveAspectRatio="none"
          mask={cutoutParts.length > 0 ? `url(#${maskId})` : undefined}
          onError={onError}
        />
      </svg>

      {rig.parts.map((part) => {
        const clipId = `arkamon-rig-clip-${reactId}-${part.id}`
        const ambient = getMotion(part.ambient, reduceMotion)
        const state = getMotion(part.states?.[animation], reduceMotion)
        const transformOrigin = `${(part.pivot.x / width) * 100}% ${(part.pivot.y / height) * 100}%`

        return (
          <motion.div
            key={part.id}
            className="pointer-events-none absolute inset-0 overflow-visible"
            style={{
              zIndex: part.zIndex ?? 2,
              transformOrigin,
            }}
            animate={ambient.animate}
            transition={ambient.transition}
            aria-hidden="true"
          >
            <motion.div
              className="absolute inset-0 overflow-visible"
              style={{ transformOrigin }}
              animate={state.animate}
              transition={state.transition}
            >
              <svg
                className="absolute inset-0 h-full w-full overflow-visible"
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
                    <polygon points={polygonPoints(part.polygon)} />
                  </clipPath>
                </defs>

                <image
                  href={src}
                  x={0}
                  y={0}
                  width={width}
                  height={height}
                  preserveAspectRatio="none"
                  clipPath={`url(#${clipId})`}
                  onError={onError}
                />
              </svg>
            </motion.div>
          </motion.div>
        )
      })}

      {rig.blink && !reduceMotion ? (
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
          style={{ zIndex: 8 }}
        >
          {rig.blink.zones.map((zone, index) => (
            <motion.ellipse
              key={index}
              cx={zone.cx}
              cy={zone.cy}
              rx={zone.rx}
              ry={zone.ry}
              fill={zone.fill}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: [0, 0, 1, 0, 0] }}
              transition={{
                duration: rig.blink!.cycleMs / 1000,
                times: [0, 0.81, 0.84, 0.88, 1],
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{
                transformOrigin: `${zone.cx}px ${zone.cy}px`,
              }}
            />
          ))}
        </svg>
      ) : null}
    </div>
  )
}
