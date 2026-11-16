/**
 * Rendering 2.5D di uno sfondo con la sua mappa di profondità (WebGL 1, nessuna dipendenza).
 * Ogni pixel si sposta in proporzione alla sua vicinanza: con il puntatore e con una lenta
 * deriva della camera l'illustrazione piatta acquista una vera parallasse.
 */

const VERTEX = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = vec2(aPosition.x * 0.5 + 0.5, 0.5 - aPosition.y * 0.5);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`

const FRAGMENT = `
precision mediump float;
uniform sampler2D uImage;
uniform sampler2D uDepth;
uniform vec4 uCover;   // scala xy e scostamento zw per il ritaglio "cover"
uniform vec2 uOffset;  // spostamento della camera in coordinate dell'immagine
uniform float uFocus;  // profondità che resta ferma (0 lontano, 1 vicino)
varying vec2 vUv;
void main() {
  vec2 uv = vUv * uCover.xy + uCover.zw;
  // Tre passi di affinamento: il campione di profondità segue lo spostamento.
  vec2 p = uv;
  for (int i = 0; i < 3; i++) {
    float d = texture2D(uDepth, p).r;
    p = uv + uOffset * (d - uFocus);
  }
  gl_FragColor = texture2D(uImage, clamp(p, 0.001, 0.999));
}`

export interface DepthRenderer {
  /** Disegna con uno spostamento in frazioni dell'immagine (circa ±0.02). */
  draw(offsetX: number, offsetY: number): void
  resize(width: number, height: number): void
  dispose(): void
}

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)
  if (!shader) throw new Error('shader')
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? 'shader')
  return shader
}

function texture(gl: WebGLRenderingContext, unit: number, image: TexImageSource): WebGLTexture {
  const handle = gl.createTexture()
  if (!handle) throw new Error('texture')
  gl.activeTexture(gl.TEXTURE0 + unit)
  gl.bindTexture(gl.TEXTURE_2D, handle)
  // Immagini non potenza di due: niente mipmap e bordi bloccati (WebGL 1).
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
  return handle
}

/** Scala e scostamento delle coordinate per riempire il riquadro come `background-size: cover`. */
export function coverTransform(viewWidth: number, viewHeight: number, imageWidth: number, imageHeight: number, bleed = 1.04): [number, number, number, number] {
  const view = viewWidth / Math.max(1, viewHeight)
  const image = imageWidth / Math.max(1, imageHeight)
  // Margine extra (bleed) perché lo spostamento non scopra mai i bordi.
  const sx = (view > image ? 1 : view / image) / bleed
  const sy = (view > image ? image / view : 1) / bleed
  return [sx, sy, (1 - sx) / 2, (1 - sy) / 2]
}

export function createDepthRenderer(canvas: HTMLCanvasElement, image: HTMLImageElement, depth: HTMLImageElement): DepthRenderer | null {
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: false })
  if (!gl) return null
  try {
    const program = gl.createProgram()!
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX))
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT))
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null
    gl.useProgram(program)
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const position = gl.getAttribLocation(program, 'aPosition')
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
    const textures = [texture(gl, 0, image), texture(gl, 1, depth)]
    gl.uniform1i(gl.getUniformLocation(program, 'uImage'), 0)
    gl.uniform1i(gl.getUniformLocation(program, 'uDepth'), 1)
    gl.uniform1f(gl.getUniformLocation(program, 'uFocus'), 0.35)
    const cover = gl.getUniformLocation(program, 'uCover')
    const offset = gl.getUniformLocation(program, 'uOffset')
    const resize = (width: number, height: number) => {
      canvas.width = width
      canvas.height = height
      gl.viewport(0, 0, width, height)
      gl.uniform4fv(cover, coverTransform(width, height, image.naturalWidth, image.naturalHeight))
    }
    resize(canvas.width || 1, canvas.height || 1)
    return {
      draw(x, y) {
        gl.uniform2f(offset, x, y)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      },
      resize,
      dispose() {
        textures.forEach(handle => gl.deleteTexture(handle))
        gl.deleteBuffer(buffer)
        gl.deleteProgram(program)
        gl.getExtension('WEBGL_lose_context')?.loseContext()
      },
    }
  } catch {
    return null
  }
}
