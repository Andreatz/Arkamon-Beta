import { useEffect, useRef, useState } from 'react'
import { assetUrl } from '@/utils/assetUrl'
import clips from '@/data/transitionClips.json'

export type TransitionClipId = keyof typeof clips

export interface TransitionClipInfo {
  readonly src: string
  readonly durationS: number
  /** Istante della clip in cui lo schermo è coperto del tutto: lì si cambia scena. */
  readonly coverAtS: number
}

export const TRANSITION_CLIPS: Record<TransitionClipId, TransitionClipInfo> = clips

interface TransitionClipProps {
  clip: TransitionClipId
  /** Velocità di regia (1 = normale). */
  speed: number
  /**
   * Chiamato una volta quando lo schermo è coperto. La clip resta ferma su quel fotogramma
   * finché la promessa restituita non si risolve (scena di arrivo pronta); se `hold` è vero
   * resta ferma per sempre (la sequenza successiva prende il suo posto).
   */
  onCovered: () => Promise<unknown> | void
  hold: boolean
  /** La clip (o il ripiego) è partita davvero: qui parte il suono. */
  onStart: () => void
  /** Fine della clip (o del ripiego). */
  onEnded: () => void
}

/** Ripiego senza WebGL o senza video: un velo nel colore dominante della clip. */
const FALLBACK_COLOR: Record<TransitionClipId, string> = { incontro: 'var(--arka-tx-clip-dark)', luce: 'var(--arka-tx-clip-light)' }

const VERTEX = `attribute vec2 p;varying vec2 uv;void main(){uv=vec2(p.x*.5+.5,.25-p.y*.25);gl_Position=vec4(p,0.,1.);}`
// Metà superiore: colore premoltiplicato; metà inferiore: opacità. uv.y copre solo la metà alta.
const FRAGMENT = `precision mediump float;varying vec2 uv;uniform sampler2D t;
void main(){float a=texture2D(t,vec2(uv.x,uv.y+.5)).r;vec3 c=min(texture2D(t,uv).rgb,vec3(a));gl_FragColor=vec4(c,a);}`

interface Renderer { draw: (video: HTMLVideoElement) => void; dispose: () => void }

function createRenderer(canvas: HTMLCanvasElement): Renderer | null {
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false, preserveDrawingBuffer: false })
  if (!gl) return null
  const shader = (type: number, source: string) => {
    const s = gl.createShader(type)!
    gl.shaderSource(s, source)
    gl.compileShader(s)
    return s
  }
  const program = gl.createProgram()!
  gl.attachShader(program, shader(gl.VERTEX_SHADER, VERTEX))
  gl.attachShader(program, shader(gl.FRAGMENT_SHADER, FRAGMENT))
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null
  gl.useProgram(program)
  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const location = gl.getAttribLocation(program, 'p')
  gl.enableVertexAttribArray(location)
  gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0)
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.clearColor(0, 0, 0, 0)
  return {
    draw(video) {
      if (video.readyState < 2) return
      const width = canvas.clientWidth * Math.min(window.devicePixelRatio || 1, 1.5)
      const height = canvas.clientHeight * Math.min(window.devicePixelRatio || 1, 1.5)
      if (canvas.width !== Math.round(width) || canvas.height !== Math.round(height)) {
        canvas.width = Math.max(1, Math.round(width))
        canvas.height = Math.max(1, Math.round(height))
      }
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    },
    dispose() {
      gl.deleteTexture(texture)
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
    },
  }
}

type VideoWithFrames = HTMLVideoElement & { requestVideoFrameCallback?: (callback: () => void) => number; cancelVideoFrameCallback?: (id: number) => void }

/**
 * Clip di transizione generata con Flow (lotto 5), con l'alfa impilato e composta in WebGL
 * sopra la scena. La clip guida il cambio di scena: al fotogramma di copertura chiama
 * `onCovered`, alla fine `onEnded`. Se video o WebGL mancano, un velo dello stesso colore
 * fa lo stesso percorso in meno di un secondo.
 */
export function TransitionClip({ clip, speed, onCovered, hold, onStart, onEnded }: TransitionClipProps) {
  const info = TRANSITION_CLIPS[clip]
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const callbacks = useRef({ onCovered, onEnded, onStart, hold })
  callbacks.current = { onCovered, onEnded, onStart, hold }
  const started = useRef(false)
  const start = () => { if (!started.current) { started.current = true; callbacks.current.onStart() } }
  const [fallback, setFallback] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const video = videoRef.current as VideoWithFrames | null
    const canvas = canvasRef.current
    if (!video || !canvas) return
    const renderer = createRenderer(canvas)
    if (!renderer) { setFallback(true); return }
    let disposed = false, covered = false, ended = false, abandoned = false, frameId = 0, rafId = 0
    const end = () => { if (!ended && !abandoned) { ended = true; callbacks.current.onEnded() } }
    // Prima della copertura si passa al ripiego; dopo, la scena è già cambiata: si chiude e basta.
    const fail = () => {
      if (disposed || abandoned) return
      if (covered) { end(); return }
      abandoned = true
      video.pause()
      setFallback(true)
    }
    const cover = () => {
      if (covered) return
      covered = true
      video.pause()
      const waiting = callbacks.current.onCovered()
      if (callbacks.current.hold) return
      void Promise.resolve(waiting).then(() => { if (!disposed && !abandoned) void video.play().catch(end) })
    }
    const tick = () => {
      if (disposed || abandoned) return
      renderer.draw(video)
      if (!covered && video.currentTime >= info.coverAtS) cover()
      if (video.requestVideoFrameCallback) frameId = video.requestVideoFrameCallback(tick)
      else rafId = requestAnimationFrame(tick)
    }
    // Un video che non parte entro un secondo e mezzo lascia il posto al ripiego.
    const stall = window.setTimeout(fail, 1500)
    // Limite assoluto: una clip che si blocca a metà non tiene fermo il gioco.
    const failsafe = window.setTimeout(() => { if (!covered) fail(); else if (!callbacks.current.hold) end() },
      info.durationS / speed * 1000 + 4000)
    const onPlaying = () => { window.clearTimeout(stall); setVisible(true); start() }
    video.addEventListener('playing', onPlaying)
    video.addEventListener('ended', end)
    video.addEventListener('error', fail)
    video.playbackRate = speed
    tick()
    void video.play().catch(fail)
    return () => {
      disposed = true
      window.clearTimeout(stall)
      window.clearTimeout(failsafe)
      video.removeEventListener('playing', onPlaying)
      video.removeEventListener('ended', end)
      video.removeEventListener('error', fail)
      if (frameId) video.cancelVideoFrameCallback?.(frameId)
      cancelAnimationFrame(rafId)
      video.pause()
      renderer.dispose()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info.coverAtS, info.durationS, speed])

  // Ripiego: il velo copre in 240 ms, aspetta la scena, poi (se non è trattenuto) si apre.
  useEffect(() => {
    if (!fallback) return
    let disposed = false
    const timer = window.setTimeout(() => {
      const waiting = callbacks.current.onCovered()
      if (callbacks.current.hold) return
      void Promise.resolve(waiting).then(() => {
        if (disposed) return
        setVisible(false)
        window.setTimeout(() => { if (!disposed) callbacks.current.onEnded() }, 320 / speed)
      })
    }, 240 / speed)
    setVisible(true)
    start()
    return () => { disposed = true; window.clearTimeout(timer) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fallback, speed])

  return <div className="arka-tx-clip" data-tx-clip={clip} data-tx-clip-fallback={fallback || undefined} aria-hidden="true">
    <video ref={videoRef} src={assetUrl(info.src)} muted playsInline preload="auto" className="arka-tx-clip__source" />
    {fallback
      ? <div className="arka-tx-clip__veil" data-visible={visible} style={{ background: FALLBACK_COLOR[clip], transitionDuration: `${Math.round(260 / speed)}ms` }} />
      : <canvas ref={canvasRef} className="arka-tx-clip__canvas" data-visible={visible} />}
  </div>
}

const preloaded = new Set<TransitionClipId>()
/** Scarica in anticipo una clip nella cache del browser (una volta per sessione). */
export function preloadTransitionClip(clip: TransitionClipId): void {
  if (preloaded.has(clip) || typeof fetch !== 'function') return
  preloaded.add(clip)
  void fetch(assetUrl(TRANSITION_CLIPS[clip].src)).then(response => response.blob()).catch(() => preloaded.delete(clip))
}
