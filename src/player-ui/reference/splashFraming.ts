export interface SplashFrameBounds {
  readonly left: number
  readonly top: number
  readonly right: number
  readonly bottom: number
}

export interface SplashFrameInput {
  readonly canvas: { readonly width: number; readonly height: number }
  readonly image: { readonly width: number; readonly height: number }
  /** Face and torso in normalized source-image coordinates. */
  readonly focus: SplashFrameBounds
  /** The unobstructed region, including its safety margin, in local canvas pixels. */
  readonly available: SplashFrameBounds
  readonly preferredScale: number
  /** Authored translation as fractions of the whole canvas, matching the CSS backdrop. */
  readonly preferredOffset: { readonly x: number; readonly y: number }
}

export interface SplashFrameResult {
  readonly scale: number
  readonly translateX: number
  readonly translateY: number
  readonly focus: SplashFrameBounds
}

const finite = (...values: number[]) => values.every(Number.isFinite)
const validBounds = (bounds: SplashFrameBounds) => finite(bounds.left, bounds.top, bounds.right, bounds.bottom)
  && bounds.right > bounds.left && bounds.bottom > bounds.top
const clamp = (value: number, minimum: number, maximum: number) => Math.min(Math.max(value, minimum), maximum)

/**
 * Fit the critical part of a proportionally contained painting to the real UI gap.
 * The result applies `translate(px, px) scale(n)` around the canvas center. An
 * authored framing is preserved whenever it fits; a smaller gap first reduces
 * the scale only as much as necessary, then clamps the translation to its edges.
 */
export function fitSplashFrame(input: SplashFrameInput): SplashFrameResult | null {
  const { canvas, image, focus, available, preferredScale, preferredOffset } = input
  if (!finite(canvas.width, canvas.height, image.width, image.height, preferredScale, preferredOffset.x, preferredOffset.y)
    || canvas.width <= 0 || canvas.height <= 0 || image.width <= 0 || image.height <= 0 || preferredScale <= 0
    || !validBounds(focus) || focus.left < 0 || focus.top < 0 || focus.right > 1 || focus.bottom > 1
    || !validBounds(available) || available.left < 0 || available.top < 0
    || available.right > canvas.width || available.bottom > canvas.height) return null

  const containedScale = Math.min(canvas.width / image.width, canvas.height / image.height)
  const width = image.width * containedScale, height = image.height * containedScale
  const startX = (canvas.width - width) / 2, startY = (canvas.height - height) / 2
  const base = {
    left: startX + focus.left * width, right: startX + focus.right * width,
    top: startY + focus.top * height, bottom: startY + focus.bottom * height,
  }
  const scale = Math.min(preferredScale,
    (available.right - available.left) / (base.right - base.left),
    (available.bottom - available.top) / (base.bottom - base.top))
  if (!Number.isFinite(scale) || scale <= 0) return null

  const centerX = canvas.width / 2, centerY = canvas.height / 2
  const scaled = {
    left: centerX + (base.left - centerX) * scale,
    right: centerX + (base.right - centerX) * scale,
    top: centerY + (base.top - centerY) * scale,
    bottom: centerY + (base.bottom - centerY) * scale,
  }
  const translateX = clamp(preferredOffset.x * canvas.width, available.left - scaled.left, available.right - scaled.right)
  const translateY = clamp(preferredOffset.y * canvas.height, available.top - scaled.top, available.bottom - scaled.bottom)
  return {
    scale, translateX, translateY,
    focus: {
      left: scaled.left + translateX, right: scaled.right + translateX,
      top: scaled.top + translateY, bottom: scaled.bottom + translateY,
    },
  }
}
