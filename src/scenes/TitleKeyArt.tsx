import { getSplashArtwork } from '@/player-ui/reference/splashArtwork'
import { assetUrl } from '@/utils/assetUrl'
import './titleKeyArt.css'

/** I tre starter del laboratorio, da sinistra: Vyrath, Darklaw, Felyss. */
const STARTERS = [1, 5, 9] as const

/**
 * Key art provvisoria del titolo (fase U5): un trittico con le splash art dei tre starter,
 * tagliato in diagonale da fili d'oro. Sostituisce il video con le sfere rosse e bianche
 * finché non arriva la key art definitiva; un fondo scelto dall'Admin resta prioritario.
 */
export function TitleKeyArt({ still }: { still: boolean }) {
  return <div className="title-key-art" data-still={still || undefined} aria-hidden="true">
    {STARTERS.map((speciesId, index) => {
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
