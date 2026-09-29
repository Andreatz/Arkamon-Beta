import { assetUrl } from '@/utils/assetUrl'
import { getMossa, getPokemon } from '@data/index'
import {
  resolveMoveVfxAsset,
  resolveMoveVfxRecipe,
} from './resolveMoveVfxAsset'
import { getMoveVfxAsset } from './vfxManifest'

const preloaded = new Set<string>()

export function preloadVfxAssets(assetIds: string[]) {
  if (typeof Image === 'undefined') return

  for (const assetId of assetIds) {
    const asset = getMoveVfxAsset(assetId)
    if (!asset || preloaded.has(asset.src)) continue
    preloaded.add(asset.src)
    const image = new Image()
    image.decoding = 'async'
    image.src = assetUrl(asset.src)
  }
}

export function preloadMoveVfxForPokemon(speciesIds: number[]) {
  const assetIds = new Set<string>()

  for (const speciesId of speciesIds) {
    const species = getPokemon(speciesId)
    if (!species) continue
    for (const moveId of species.mosse) {
      if (!moveId) continue
      const move = getMossa(moveId)
      if (!move) continue

      const recipe = resolveMoveVfxRecipe(move)
      if (recipe) {
        for (const step of recipe.steps) assetIds.add(step.assetId)
      } else {
        assetIds.add(resolveMoveVfxAsset(move).id)
      }
    }
  }

  preloadVfxAssets([...assetIds])
}
