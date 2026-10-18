/**
 * A component declares which surface owns its frame. Only that surface and its
 * explicitly dependent decoration are replaced; text, controls and HP stay live.
 */
export function getUiSkinSurface(element: HTMLElement | SVGElement): HTMLElement | SVGElement {
  if (element.hasAttribute('data-ui-skin-slot')) return element
  return element.querySelector<HTMLElement | SVGElement>(':scope > [data-ui-skin-slot="frame"]')
    ?? element.querySelector<HTMLElement>(':scope > .pu-frame,:scope > .game-button-frame')
    ?? element
}

export function getUiSkinDependents(surface: HTMLElement | SVGElement): HTMLElement[] {
  const slot = surface.getAttribute('data-ui-skin-slot')
  if (!slot) return []
  return [...surface.querySelectorAll<HTMLElement>('[data-ui-skin-dependent]')]
    .filter(element => element.getAttribute('data-ui-skin-dependent') === slot
      && element.parentElement?.closest('[data-ui-skin-slot]') === surface)
}
