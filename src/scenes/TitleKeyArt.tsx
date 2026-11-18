import { lazy, Suspense } from 'react'
import { GameArt, hasGameArt } from '@/ui-system/GameArt'
import './titleKeyArt.css'

const StarterTitleKeyArt = lazy(() => import('./StarterTitleKeyArt').then(module => ({ default: module.StarterTitleKeyArt })))

/**
 * Key art provvisoria del titolo (fase U5): un trittico con le splash art dei tre starter,
 * tagliato in diagonale da fili d'oro. Sostituisce il video con le sfere rosse e bianche
 * finché non arriva la key art definitiva; un fondo scelto dall'Admin resta prioritario.
 */
export function TitleKeyArt({ still }: { still: boolean }) {
  // Fase U6: la key art definitiva del lotto 3; il trittico resta come riserva se manca.
  if (hasGameArt('title-keyart')) return <div className="title-key-art title-key-art--painted" data-still={still || undefined} aria-hidden="true">
    <GameArt id="title-keyart" className="title-key-art__image" />
    <div className="title-key-art__veil" />
  </div>
  return <Suspense fallback={null}><StarterTitleKeyArt still={still} /></Suspense>
}
