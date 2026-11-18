import type { CSSProperties } from 'react'
import { LOCAL_MAP_AMBIENCE } from '@/data/localMapAmbience'
import { assetUrl } from '@/utils/assetUrl'
import './localMapAmbience.css'

/** Barche che ondeggiano e fontane con zampilli sopra la pittura della mappa locale. */
export function LocalMapAmbience({ mapId, image }: { mapId: string; image: string }) {
  const ambience = LOCAL_MAP_AMBIENCE[mapId]
  if (!ambience) return null
  const source = `url("${assetUrl(image)}")`
  return <div className="local-map-ambience" aria-hidden="true">
    {ambience.boats.map((boat, index) => <span key={`b${index}`} className="local-map-boat" style={{
      left: `${boat.x - boat.w / 2}%`, top: `${boat.y - boat.h / 2}%`, width: `${boat.w}%`, height: `${boat.h}%`,
      backgroundImage: source,
      // Il ritaglio mostra la stessa porzione della pittura: dimensione del fondo pari all'immagine intera.
      backgroundSize: `${10000 / boat.w}% ${10000 / boat.h}%`,
      backgroundPosition: `${(boat.x - boat.w / 2) / (100 - boat.w) * 100}% ${(boat.y - boat.h / 2) / (100 - boat.h) * 100}%`,
      '--boat-delay': `${(index * 0.37) % 2.2}s`,
    } as CSSProperties} />)}
    {ambience.fountains.map((fountain, index) => <span key={`f${index}`} className="local-map-fountain" style={{
      left: `${fountain.x}%`, top: `${fountain.y}%`, width: `${fountain.size}%`, '--fountain-delay': `${(index * 0.53) % 1.6}s`,
    } as CSSProperties}>
      <i className="local-map-fountain-ripple" /><i className="local-map-fountain-ripple is-late" />
      {Array.from({ length: 6 }, (_, drop) => <i key={drop} className="local-map-fountain-drop" style={{ '--drop': drop } as CSSProperties} />)}
    </span>)}
  </div>
}
