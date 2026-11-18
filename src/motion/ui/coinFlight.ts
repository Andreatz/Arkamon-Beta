import { gameArtUrl } from '@/ui-system/GameArt'
import { getAnimationDuration, useGamePreferences } from '@/settings/gamePreferences'

/** True se il giocatore o il sistema chiedono movimento ridotto. */
function reducedMotion(): boolean {
  const preference = useGamePreferences.getState().reducedMotion
  if (preference !== 'system') return preference === 'on'
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
}

/**
 * Monete che volano da un elemento all'altro (per esempio dal borsellino al banco dopo un acquisto).
 * Solo presentazione: crea immagini temporanee fuori dal flusso e le rimuove a fine volo.
 */
export function flyCoins(from: Element | null, to: Element | null, count = 8): void {
  if (!from || !to || typeof document === 'undefined' || reducedMotion()) return
  const start = from.getBoundingClientRect(), end = to.getBoundingClientRect()
  if (!start.width || !end.width) return
  const src = gameArtUrl('item-coin')
  const sx = start.left + start.width / 2, sy = start.top + start.height / 2
  const ex = end.left + end.width / 2, ey = end.top + end.height / 2
  const duration = getAnimationDuration(900)
  for (let i = 0; i < count; i++) {
    const coin = document.createElement(src ? 'img' : 'span')
    coin.className = 'coin-flight'
    coin.setAttribute('aria-hidden', 'true')
    if (src && coin instanceof HTMLImageElement) { coin.src = src; coin.alt = '' } else coin.textContent = '₳'
    coin.style.left = `${sx}px`
    coin.style.top = `${sy}px`
    document.body.appendChild(coin)
    // L'arco non esce dallo schermo: con il borsellino in alto le monete scendono quasi subito.
    const spreadX = (Math.random() - .5) * 90, lift = Math.min(70 + Math.random() * 60, Math.max(0, sy - 24))
    const midX = (ex - sx) * .5 + spreadX, midY = Math.min(0, ey - sy) - lift
    const animation = coin.animate([
      { transform: 'translate(-50%, -50%) scale(.6) rotate(0deg)', opacity: 0 },
      { transform: `translate(calc(-50% + ${midX * .4}px), calc(-50% + ${midY * .7}px)) scale(1.1) rotate(160deg)`, opacity: 1, offset: .25 },
      { transform: `translate(calc(-50% + ${midX}px), calc(-50% + ${midY}px)) scale(1) rotate(320deg)`, opacity: 1, offset: .55 },
      { transform: `translate(calc(-50% + ${ex - sx}px), calc(-50% + ${ey - sy}px)) scale(.55) rotate(540deg)`, opacity: .2 },
    ], { duration, delay: i * getAnimationDuration(55), easing: 'cubic-bezier(.4, .1, .3, 1)', fill: 'both' })
    animation.onfinish = () => coin.remove()
    animation.oncancel = () => coin.remove()
  }
}
