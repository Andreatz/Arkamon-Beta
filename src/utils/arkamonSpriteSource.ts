export const MISSING_ARKAMON_SPRITE = '/ui/grey_pokeball.png'

const fronts = new Set(__ARKAMON_FRONT_SPRITE_IDS__)
const backs = new Set(__ARKAMON_BACK_SPRITE_IDS__)

/** Use a supplied portrait when the battle or map lacks rear artwork. */
export function getArkamonSpriteSource(speciesId: number, side: 'front' | 'back' = 'front'): string {
  if (side === 'back' && backs.has(speciesId)) return `/sprites/back_sprites/${speciesId}.png`
  return fronts.has(speciesId) ? `/sprites/front_sprites/${speciesId}.png` : MISSING_ARKAMON_SPRITE
}
