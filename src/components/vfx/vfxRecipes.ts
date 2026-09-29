import type { MoveVfxRecipe } from './types'
import type { MoveVfxAssetId } from './vfxManifest'

export const MOVE_VFX_RECIPES = {
  fireProjectile: {
    id: 'fire-projectile',
    label: 'Fire projectile + impact',
    durationMs: 1160,
    impactAtMs: 560,
    steps: [
      {
        id: 'projectile',
        assetId: 'fireballGif',
        startAtMs: 0,
        durationMs: 700,
        motion: 'projectile',
      },
      {
        id: 'impact',
        assetId: 'fireImpactGif',
        startAtMs: 500,
        durationMs: 660,
        anchor: 'target',
        motion: 'static',
        scaleMultiplier: 1.08,
      },
    ],
  },
  electricBolt: {
    id: 'electric-bolt',
    label: 'Electric projectile + lightning impact',
    durationMs: 1080,
    impactAtMs: 410,
    steps: [
      {
        id: 'charge-projectile',
        assetId: 'energyGif',
        startAtMs: 0,
        durationMs: 500,
        motion: 'projectile',
        scaleMultiplier: 0.9,
      },
      {
        id: 'lightning-impact',
        assetId: 'lightningGif',
        startAtMs: 350,
        durationMs: 730,
        anchor: 'target',
        motion: 'static',
        scaleMultiplier: 1.08,
      },
    ],
  },
  waterJet: {
    id: 'water-jet',
    label: 'Water projectile + splash',
    durationMs: 1500,
    impactAtMs: 720,
    steps: [
      {
        id: 'water-projectile',
        assetId: 'waterGif',
        startAtMs: 0,
        durationMs: 900,
        motion: 'projectile',
        scaleMultiplier: 0.92,
      },
      {
        id: 'water-splash',
        assetId: 'waterTorrentGif',
        startAtMs: 650,
        durationMs: 850,
        anchor: 'target',
        motion: 'static',
        scaleMultiplier: 0.58,
      },
    ],
  },
  psychicBurst: {
    id: 'psychic-burst',
    label: 'Psychic focus + burst',
    durationMs: 1450,
    impactAtMs: 600,
    steps: [
      {
        id: 'psychic-focus',
        assetId: 'psychicGif',
        startAtMs: 0,
        durationMs: 900,
        anchor: 'target',
      },
      {
        id: 'psychic-impact',
        assetId: 'psychicBurstGif',
        startAtMs: 480,
        durationMs: 970,
        anchor: 'target',
        scaleMultiplier: 0.9,
      },
    ],
  },
  healingPulse: {
    id: 'healing-pulse',
    label: 'Healing + shimmer',
    durationMs: 1500,
    impactAtMs: 0,
    steps: [
      {
        id: 'healing',
        assetId: 'cureGif',
        startAtMs: 0,
        durationMs: 1400,
        anchor: 'self',
      },
      {
        id: 'shimmer',
        assetId: 'shimmer',
        startAtMs: 180,
        durationMs: 900,
        anchor: 'self',
        scaleMultiplier: 0.72,
        opacity: 0.82,
      },
    ],
  },
} satisfies Record<string, MoveVfxRecipe>

export type MoveVfxRecipeId = keyof typeof MOVE_VFX_RECIPES

export const MOVE_VFX_RECIPE_BY_PRIMARY_ASSET: Partial<
  Record<MoveVfxAssetId, MoveVfxRecipeId>
> = {
  fireballGif: 'fireProjectile',
  energyGif: 'electricBolt',
  waterGif: 'waterJet',
  psychicGif: 'psychicBurst',
  cure: 'healingPulse',
  cureGif: 'healingPulse',
}
