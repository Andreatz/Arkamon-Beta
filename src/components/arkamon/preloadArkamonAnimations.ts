import { assetUrl } from '@/utils/assetUrl'
import { prepareImageAsset } from '@/utils/prepareImageAsset'
import { getArkamonAnimationAsset, type ArkamonBattleAnimation, type ArkamonSpriteSide } from './arkamonAnimationManifest'

export function prepareArkamonAnimationPlayback(
  speciesId: number,
  side: ArkamonSpriteSide,
  animation: ArkamonBattleAnimation,
): Promise<void> {
  const asset = getArkamonAnimationAsset(speciesId, side, animation)
  return asset ? prepareImageAsset(assetUrl(asset.src)) : Promise.resolve()
}
