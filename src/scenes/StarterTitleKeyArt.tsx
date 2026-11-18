import { getSplashArtwork } from '@/player-ui/reference/splashArtwork'
import { assetUrl } from '@/utils/assetUrl'

/** Load the full splash catalog only when the supplied title key art is absent. */
export function StarterTitleKeyArt({ still }: { still: boolean }) {
  return <div className="title-key-art" data-still={still || undefined} aria-hidden="true">
    {[1, 5, 9].map((speciesId, index) => {
      const artwork = getSplashArtwork(speciesId)
      if (!artwork) return null
      return <div key={speciesId} className={`title-key-art__panel title-key-art__panel--${index}`}>
        <img src={assetUrl(artwork.src)} alt="" draggable={false} style={{ objectPosition: artwork.objectPosition }} />
      </div>
    })}
    <svg className="title-key-art__seams" viewBox="0 0 100 100" preserveAspectRatio="none">
      <path d="M36 0 L30 100" />
      <path d="M70 0 L64 100" />
    </svg>
    <div className="title-key-art__veil" />
  </div>
}
