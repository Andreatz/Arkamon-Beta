import type { MoveVfxAsset } from './types'

const sheet = (
  id: string,
  label: string,
  src: string,
  options: Partial<MoveVfxAsset> = {}
): MoveVfxAsset => ({
  id,
  label,
  kind: 'sprite-sheet',
  src,
  sprite: {
    frameWidth: 192,
    frameHeight: 192,
    columns: 5,
    rows: 6,
    frameCount: 30,
    fps: 60,
  },
  durationMs: 500,
  impactAtMs: 260,
  anchor: 'target',
  layer: 'over-pokemon',
  width: 260,
  height: 260,
  scale: 1,
  mirrorForEnemy: true,
  blendMode: 'screen',
  ...options,
})

const gif = (
  id: string,
  label: string,
  src: string,
  options: Partial<MoveVfxAsset> = {}
): MoveVfxAsset => ({
  id,
  label,
  kind: 'gif',
  src,
  durationMs: 900,
  impactAtMs: 420,
  anchor: 'target',
  layer: 'over-pokemon',
  width: 280,
  height: 280,
  scale: 1,
  mirrorForEnemy: true,
  blendMode: 'screen',
  ...options,
})

export const MOVE_VFX_ASSETS = {
  slash: sheet('slash', 'Slash', 'vfx/moves/slash/slash_60fps.png'),
  thrust: sheet('thrust', 'Thrust', 'vfx/moves/thrust/thrust_60fps.png'),
  punch: sheet('punch', 'Punch', 'vfx/moves/punch/punch_60fps.png'),
  buff: sheet('buff', 'Buff', 'vfx/moves/buff/buff_60fps.png', {
    sprite: {
      frameWidth: 192,
      frameHeight: 192,
      columns: 5,
      rows: 12,
      frameCount: 60,
      fps: 60,
    },
    durationMs: 1000,
    anchor: 'self',
    impactAtMs: 0,
  }),
  debuff: sheet('debuff', 'Debuff', 'vfx/moves/debuff/debuff_60fps.png', {
    sprite: {
      frameWidth: 192,
      frameHeight: 192,
      columns: 5,
      rows: 12,
      frameCount: 60,
      fps: 60,
    },
    durationMs: 1000,
  }),
  shimmer: sheet('shimmer', 'Shimmer', 'vfx/moves/shimmer/shimmer_60fps.png', {
    sprite: {
      frameWidth: 192,
      frameHeight: 192,
      columns: 5,
      rows: 12,
      frameCount: 60,
      fps: 60,
    },
    durationMs: 1000,
  }),
  cure: sheet('cure', 'Cure', 'vfx/moves/cure/cure_60fps.png', {
    sprite: {
      frameWidth: 192,
      frameHeight: 192,
      columns: 5,
      rows: 15,
      frameCount: 75,
      fps: 60,
    },
    durationMs: 1250,
    anchor: 'self',
    impactAtMs: 0,
  }),
  shield: sheet('shield', 'Shield', 'vfx/moves/shield/shield_60fps.png', {
    sprite: {
      frameWidth: 192,
      frameHeight: 192,
      columns: 5,
      rows: 12,
      frameCount: 60,
      fps: 60,
    },
    durationMs: 1000,
    anchor: 'self',
    impactAtMs: 0,
  }),
  barrier: sheet('barrier', 'Barrier', 'vfx/moves/barrier/barrier_60fps.png', {
    sprite: {
      frameWidth: 192,
      frameHeight: 192,
      columns: 5,
      rows: 20,
      frameCount: 100,
      fps: 60,
    },
    durationMs: 1667,
    anchor: 'self',
    impactAtMs: 0,
  }),
  burst: sheet('burst', 'Burst', 'vfx/moves/burst/burst_60fps.png', {
    sprite: {
      frameWidth: 192,
      frameHeight: 192,
      columns: 5,
      rows: 20,
      frameCount: 100,
      fps: 60,
    },
    durationMs: 1667,
    anchor: 'center',
    layer: 'front-ui',
    width: 390,
    height: 390,
    impactAtMs: 340,
  }),
  confuseGif: gif('confuseGif', 'Confuse', 'vfx/moves/confuse/confuse.gif', {
    durationMs: 1750,
  }),
  cureGif: gif('cureGif', 'Cure GIF', 'vfx/moves/cure/cure.gif', {
    durationMs: 1610,
    anchor: 'self',
    impactAtMs: 0,
  }),
  guardBreakGif: gif('guardBreakGif', 'Guard Break', 'vfx/moves/break/guard_break.gif', {
    durationMs: 1400,
  }),
  gutsPunchGif: gif('gutsPunchGif', 'Guts Punch', 'vfx/moves/punch/guts_punch.gif', {
    durationMs: 1500,
  }),
  waterGif: gif('waterGif', 'Water', 'vfx/moves/water/water_01.gif', {
    durationMs: 2160,
    width: 320,
    height: 320,
  }),
  waterTorrentGif: gif('waterTorrentGif', 'Water Torrent', 'vfx/moves/water/water_03.gif', {
    durationMs: 3020,
    width: 380,
    height: 280,
    anchor: 'center',
  }),
  energyGif: gif('energyGif', 'Energy', 'vfx/moves/energy/energy_11.gif', {
    durationMs: 480,
    width: 310,
    height: 310,
  }),
  lightningGif: gif('lightningGif', 'Lightning', 'vfx/moves/energy/lightning_01.gif', {
    durationMs: 1160,
    width: 300,
    height: 300,
  }),
  fireballGif: gif('fireballGif', 'Fireball', 'vfx/moves/burst/fire_01.gif', {
    durationMs: 800,
    width: 320,
    height: 240,
  }),
  fireWaveGif: gif('fireWaveGif', 'Fire Wave', 'vfx/moves/burst/fire_05.gif', {
    durationMs: 2160,
    width: 360,
    height: 260,
    anchor: 'center',
  }),
  fireImpactGif: gif('fireImpactGif', 'Fire Impact', 'vfx/moves/burst/fire_08.gif', {
    durationMs: 640,
    width: 310,
    height: 230,
  }),
  firePulseGif: gif('firePulseGif', 'Fire Pulse', 'vfx/moves/burst/fire_12.gif', {
    durationMs: 880,
    width: 330,
    height: 240,
  }),
  psychicGif: gif('psychicGif', 'Psychic', 'vfx/moves/confuse/psychic_01.gif', {
    durationMs: 1430,
    width: 320,
    height: 220,
  }),
  psychicBurstGif: gif('psychicBurstGif', 'Psychic Burst', 'vfx/moves/confuse/psychic_02.gif', {
    durationMs: 1320,
    width: 350,
    height: 250,
    anchor: 'center',
  }),
  poisonGif: gif('poisonGif', 'Poison', 'vfx/moves/debuff/poison_01.gif', {
    durationMs: 2440,
    width: 340,
    height: 250,
  }),
} satisfies Record<string, MoveVfxAsset>

export type MoveVfxAssetId = keyof typeof MOVE_VFX_ASSETS

export const DEFAULT_PRELOAD_VFX_ASSET_IDS: MoveVfxAssetId[] = [
  'punch',
  'waterGif',
  'energyGif',
  'fireballGif',
  'lightningGif',
  'psychicGif',
  'cureGif',
  'slash',
]

export function getMoveVfxAsset(id: string): MoveVfxAsset | undefined {
  return MOVE_VFX_ASSETS[id as MoveVfxAssetId]
}
