/** Inclinazione delle carte verso il puntatore: logica pura. */

export interface TiltPose {
  /** Rotazione attorno all'asse X in gradi (positiva = bordo superiore verso chi guarda). */
  rx: number
  ry: number
  /** Punto del riflesso in percentuale della carta. */
  glareX: number
  glareY: number
  /**
   * La stessa posa come rotazione attorno a un asse (proprietà CSS `rotate`), che si
   * compone con il `transform` già usato dai fogli di stile per hover e selezione.
   */
  axisX: number
  axisY: number
  angle: number
}

const round = (value: number) => Math.round(value * 100) / 100

/** Posa della carta per un puntatore in (x, y) dentro `rect`; `maxDeg` limita l'inclinazione. */
export function tiltPose(rect: { left: number; top: number; width: number; height: number }, x: number, y: number, maxDeg = 7): TiltPose {
  const px = rect.width > 0 ? Math.min(1, Math.max(0, (x - rect.left) / rect.width)) : 0.5
  const py = rect.height > 0 ? Math.min(1, Math.max(0, (y - rect.top) / rect.height)) : 0.5
  // Le carte grandi si inclinano meno: lo stesso gesto non deve deformare un pannello intero.
  const scale = Math.min(1, 260 / Math.max(rect.width, rect.height, 1)) * 0.6 + 0.4
  const rx = round((0.5 - py) * 2 * maxDeg * scale)
  const ry = round((px - 0.5) * 2 * maxDeg * scale)
  const angle = round(Math.hypot(rx, ry))
  return {
    rx,
    ry,
    glareX: round(px * 100),
    glareY: round(py * 100),
    axisX: angle > 0.01 ? round(rx / angle) : 1,
    axisY: angle > 0.01 ? round(ry / angle) : 0,
    angle,
  }
}
