import manifest from '@/data/depthMaps.json'
import { assetUrl } from '@/utils/assetUrl'

const AVAILABLE = new Set<string>(manifest.maps)

/** Nome base di uno sfondo (`/Arkamon-Beta/backgrounds/route_1.jpg?v=2` → `route_1`). */
export function backgroundStem(url: string): string | null {
  const path = url.split(/[?#]/)[0]
  const match = /\/backgrounds\/([^/]+)\.(?:png|jpe?g|webp)$/i.exec(path)
  return match ? decodeURIComponent(match[1]) : null
}

/**
 * Mappa di profondità di uno sfondo, se generata (scripts/depth/generate-depth-maps.py):
 * WebP in scala di grigi, bianco = vicino. Senza mappa lo sfondo resta piatto.
 */
export function depthMapFor(url: string, available: ReadonlySet<string> = AVAILABLE): string | null {
  const stem = backgroundStem(url)
  return stem && available.has(stem) ? assetUrl(`/backgrounds/depth/${stem}.webp`) : null
}
