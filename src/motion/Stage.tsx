import { createContext, forwardRef, useContext, useEffect, useRef, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react'
import { motion, useTransform } from 'framer-motion'
import { layerTransform } from './camera'
import { useCameraRig, type CameraRig } from './useCameraRig'
import './motion.css'

const StageContext = createContext<CameraRig | null>(null)

/** Cinepresa del palco più vicino, oppure `null` fuori da un palco. */
export function useStageRig(): CameraRig | null {
  return useContext(StageContext)
}

export interface StageProps extends HTMLAttributes<HTMLDivElement> {
  /** Cinepresa creata con `useCameraRig`. Se manca, il palco ne crea una propria. */
  rig?: CameraRig
  children?: ReactNode
}

/**
 * Palco: un contenitore che ritaglia e un "mondo" trasformato dalla cinepresa.
 * Tutto ciò che deve muoversi con l'inquadratura sta dentro; l'HUD resta fuori.
 */
export const Stage = forwardRef<HTMLDivElement, StageProps>(function Stage({ rig, children, className = '', ...rest }, forwardedRef) {
  const own = useCameraRig()
  const active = rig ?? own
  const root = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const element = root.current
    if (!element) return
    const measure = () => active.setSize(element.clientWidth, element.clientHeight)
    measure()
    if (typeof ResizeObserver !== 'function') return
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [active])

  return (
    <div
      {...rest}
      ref={(element) => {
        root.current = element
        if (typeof forwardedRef === 'function') forwardedRef(element)
        else if (forwardedRef) forwardedRef.current = element
      }}
      className={`arka-motion-stage ${className}`}
    >
      <StageContext.Provider value={active}>
        <motion.div
          className="arka-motion-world"
          data-stage-world
          style={{ x: active.values.x, y: active.values.y, scale: active.values.zoom, rotate: active.values.rotate }}
        >
          {children}
        </motion.div>
      </StageContext.Provider>
    </div>
  )
})

export interface StageLayerProps {
  /**
   * Profondità: 1 è il piano focale e segue la camera alla lettera; sotto 1 il
   * livello è lontano (si muove e ingrandisce meno); sopra 1 è un primo piano.
   */
  depth?: number
  /** Ingrandimento fisso del livello per coprire i bordi durante shake e panoramiche. */
  bleed?: number
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/** Livello del palco. Con `depth` 1 e senza `bleed` non applica alcuna trasformazione. */
export function StageLayer({ depth = 1, bleed = 1, className = '', style, children }: StageLayerProps) {
  const rig = useStageRig()
  if (!rig || (depth === 1 && bleed === 1)) {
    return <div className={`arka-motion-layer ${className}`} data-stage-depth={depth} style={style}>{children}</div>
  }
  return <ParallaxLayer rig={rig} depth={depth} bleed={bleed} className={className} style={style}>{children}</ParallaxLayer>
}

function ParallaxLayer({ rig, depth, bleed, className, style, children }: Required<Pick<StageLayerProps, 'depth' | 'bleed' | 'className'>> & Pick<StageLayerProps, 'style' | 'children'> & { rig: CameraRig }) {
  const { x: cameraX, y: cameraY, zoom } = rig.values
  const x = useTransform([cameraX, zoom], ([offset, scale]: number[]) => layerTransform({ x: offset, y: 0, zoom: scale }, depth, bleed).x)
  const y = useTransform([cameraY, zoom], ([offset, scale]: number[]) => layerTransform({ x: 0, y: offset, zoom: scale }, depth, bleed).y)
  const scale = useTransform(zoom, (value) => layerTransform({ x: 0, y: 0, zoom: value }, depth, bleed).scale)
  return (
    <motion.div className={`arka-motion-layer ${className}`} data-stage-depth={depth} style={{ ...style, x, y, scale }}>
      {children}
    </motion.div>
  )
}
