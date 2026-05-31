import { create } from 'zustand'
import type { MoveVfxAssetId } from '@/components/vfx/vfxManifest'
import type {
  VfxAnchor,
  VfxBlendMode,
  VfxLayer,
} from '@/components/vfx/types'

export interface AdminMoveVfxOverride {
  moveId: number
  assetId: MoveVfxAssetId
  scale: number
  offsetX: number
  offsetY: number
  durationMs: number
  anchor: VfxAnchor
  layer: VfxLayer
  mirrorForEnemy: boolean
  blendMode: VfxBlendMode
}

interface VfxAdminState {
  overrides: Record<number, AdminMoveVfxOverride>
  setOverride: (override: AdminMoveVfxOverride) => void
  removeOverride: (moveId: number) => void
  resetOverrides: () => void
}

export const useVfxAdminStore = create<VfxAdminState>((set) => ({
  overrides: {},
  setOverride: (override) =>
    set((state) => ({
      overrides: {
        ...state.overrides,
        [override.moveId]: override,
      },
    })),
  removeOverride: (moveId) =>
    set((state) => {
      const overrides = { ...state.overrides }
      delete overrides[moveId]
      return { overrides }
    }),
  resetOverrides: () => set({ overrides: {} }),
}))

export function getAdminMoveVfxOverride(moveId: number): AdminMoveVfxOverride | undefined {
  return useVfxAdminStore.getState().overrides[moveId]
}
