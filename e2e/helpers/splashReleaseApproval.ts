import { readFileSync } from 'node:fs'

const release: { images: { id: number; sha256: string }[] } = JSON.parse(
  readFileSync(new URL('../../art-source/splash/releases/2026-11-15-approved.json', import.meta.url), 'utf8'),
)
const approvedHashes = new Map(release.images.map(image => [image.id, image.sha256]))

/** Geometry observations are informational only for the exact artwork the user approved. */
export function usesApprovedSplashComposition(artwork: { speciesId: number; sha256?: string }) {
  return artwork.sha256 !== undefined && approvedHashes.get(artwork.speciesId) === artwork.sha256
}
