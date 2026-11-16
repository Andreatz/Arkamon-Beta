import type { SplashArtwork } from '@/player-ui/reference/splashArtwork'

/**
 * Punto da tenere al centro quando un'illustrazione 16:9 viene ritagliata in un
 * riquadro di forma diversa: il centro dell'area del soggetto, se nota.
 */
export function splashFocusPosition(artwork: Pick<SplashArtwork, 'objectPosition' | 'focusBounds'> | undefined): string {
  if (!artwork) return '50% 50%'
  const bounds = artwork.focusBounds
  if (!bounds) return artwork.objectPosition || '50% 50%'
  const clamp = (value: number) => Math.min(100, Math.max(0, Math.round(value * 1000) / 10))
  return `${clamp((bounds.left + bounds.right) / 2)}% ${clamp((bounds.top + bounds.bottom) / 2)}%`
}
