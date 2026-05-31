import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { StateStorage } from 'zustand/middleware'
import type {
  AdminBattleLayoutKey,
  AdminDepositLayoutKey,
  AdminEvolutionLayoutKey,
  AdminLuogoLayoutKey,
  AdminMainMapUiLayoutKey,
  AdminMapGridLayoutKey,
  AdminMapNodePosition,
  AdminMapRoadPoint,
  AdminTheme,
  AdminThemeAssets,
  AdminThemeColors,
  AdminThemeUi,
  AdminLayoutRect,
} from '@/theme/adminThemeTypes'
import { compactRoadPoints } from '@/utils/mainMapRoadGeometry'
import {
  cloneAdminTheme,
  defaultAdminTheme,
  defaultBattleLayout,
  defaultDepositLayout,
  defaultEvolutionLayout,
  defaultMainMapNodePositions,
  defaultMainMapRoads,
  defaultMainMapUiLayout,
  defaultMapGridLayout,
  defaultLuogoLayout,
} from '@/theme/defaultAdminTheme'

const ADMIN_ENABLED_BY_DEFAULT = import.meta.env.DEV
const MAX_LAYOUT_UNDO_STEPS = 50

function createMemoryStorage(): StateStorage {
  const storage = new Map<string, string>()

  return {
    getItem: (name) => storage.get(name) ?? null,
    setItem: (name, value) => {
      storage.set(name, value)
    },
    removeItem: (name) => {
      storage.delete(name)
    },
  }
}

const adminStorage = createJSONStorage<AdminState>(() =>
  typeof localStorage === 'undefined' ? createMemoryStorage() : localStorage
)

type PersistedAdminTheme = Partial<AdminTheme> & {
  colors?: Partial<AdminThemeColors>
  ui?: Partial<AdminThemeUi>
  assets?: Partial<AdminThemeAssets>
  layouts?: Partial<AdminTheme['layouts']> & {
    battle?: Partial<AdminTheme['layouts']['battle']>
    mainMapNodes?: Partial<AdminTheme['layouts']['mainMapNodes']>
    mainMapRoads?: Partial<AdminTheme['layouts']['mainMapRoads']>
    mainMapUi?: Partial<AdminTheme['layouts']['mainMapUi']>
    mapGrid?: Partial<AdminTheme['layouts']['mapGrid']>
    luogo?: Partial<AdminTheme['layouts']['luogo']>
    deposit?: Partial<AdminTheme['layouts']['deposit']>
    evolution?: Partial<AdminTheme['layouts']['evolution']>
  }
}

type SceneLayoutUpdate =
  | { scene: 'mapGrid'; key: AdminMapGridLayoutKey; rect: AdminLayoutRect }
  | { scene: 'luogo'; key: AdminLuogoLayoutKey; rect: AdminLayoutRect }
  | { scene: 'mainMapUi'; key: AdminMainMapUiLayoutKey; rect: AdminLayoutRect }
  | { scene: 'deposit'; key: AdminDepositLayoutKey; rect: AdminLayoutRect }
  | { scene: 'evolution'; key: AdminEvolutionLayoutKey; rect: AdminLayoutRect }

interface AdminState {
  enabled: boolean
  panelOpen: boolean
  layoutEditing: boolean
  layoutUndoStack: AdminTheme['layouts'][]
  theme: AdminTheme
  toggleEnabled: () => void
  setPanelOpen: (open: boolean) => void
  setLayoutEditing: (editing: boolean) => void
  beginLayoutChange: () => void
  undoLayoutChange: () => void
  updateColor: (key: keyof AdminThemeColors, value: string) => void
  updateUi: (key: keyof AdminThemeUi, value: number) => void
  updateAsset: (key: keyof AdminThemeAssets, value: string) => void
  updateSpriteScale: (speciesId: number, scale: number) => void
  resetSpriteScales: () => void
  updateBattleLayout: (key: AdminBattleLayoutKey, rect: AdminLayoutRect) => void
  updateMainMapNodePosition: (name: string, position: AdminMapNodePosition) => void
  updateMainMapRoad: (key: string, points: AdminMapRoadPoint[]) => void
  updateSceneLayout: (update: SceneLayoutUpdate) => void
  resetBattleLayout: () => void
  resetMainMapNodePositions: () => void
  resetMainMapRoads: () => void
  resetSceneLayout: (scene: SceneLayoutUpdate['scene']) => void
  resetTheme: () => void
  applyVisualTheme: (theme: AdminTheme) => void
  importTheme: (theme: AdminTheme) => void
}

function pushLayoutUndo(state: AdminState): AdminTheme['layouts'][] {
  return [
    ...state.layoutUndoStack.slice(-(MAX_LAYOUT_UNDO_STEPS - 1)),
    cloneAdminTheme(state.theme).layouts,
  ]
}

function normalizeTheme(theme: PersistedAdminTheme | undefined): AdminTheme {
  const spriteScales = Object.fromEntries(
    Object.entries(theme?.spriteScales ?? {}).flatMap(([speciesId, scale]) =>
      typeof scale === 'number' && Number.isFinite(scale) && scale > 0
        ? [[speciesId, scale]]
        : []
    )
  )
  const mainMapRoads = Object.fromEntries(
    Object.entries({
      ...defaultMainMapRoads,
      ...theme?.layouts?.mainMapRoads,
    }).map(([key, points]) => [
      key,
      compactRoadPoints(Array.isArray(points) ? points : []),
    ])
  )

  return {
    ...defaultAdminTheme,
    ...theme,
    colors: {
      ...defaultAdminTheme.colors,
      ...theme?.colors,
    },
    ui: {
      ...defaultAdminTheme.ui,
      ...theme?.ui,
    },
    assets: {
      ...defaultAdminTheme.assets,
      ...theme?.assets,
    },
    spriteScales,
    layouts: {
      battle: {
        ...defaultBattleLayout,
        ...theme?.layouts?.battle,
      },
      mainMapNodes: {
        ...defaultMainMapNodePositions,
        ...theme?.layouts?.mainMapNodes,
      },
      mainMapRoads: {
        ...mainMapRoads,
      },
      mainMapUi: {
        ...defaultMainMapUiLayout,
        ...theme?.layouts?.mainMapUi,
      },
      mapGrid: {
        ...defaultMapGridLayout,
        ...theme?.layouts?.mapGrid,
      },
      luogo: {
        ...defaultLuogoLayout,
        ...theme?.layouts?.luogo,
      },
      deposit: {
        ...defaultDepositLayout,
        ...theme?.layouts?.deposit,
      },
      evolution: {
        ...defaultEvolutionLayout,
        ...theme?.layouts?.evolution,
      },
    },
  }
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      enabled: ADMIN_ENABLED_BY_DEFAULT,
      panelOpen: false,
      layoutEditing: false,
      layoutUndoStack: [],
      theme: cloneAdminTheme(defaultAdminTheme),

      toggleEnabled: () =>
        set((state) => ({
          enabled: !state.enabled,
          panelOpen: state.enabled ? false : state.panelOpen,
        })),

      setPanelOpen: (panelOpen) => set({ panelOpen }),

      setLayoutEditing: (layoutEditing) => set({ layoutEditing }),

      beginLayoutChange: () =>
        set((state) => ({
          layoutUndoStack: pushLayoutUndo(state),
        })),

      undoLayoutChange: () =>
        set((state) => {
          const previousLayouts = state.layoutUndoStack[state.layoutUndoStack.length - 1]
          if (!previousLayouts) return state

          return {
            layoutUndoStack: state.layoutUndoStack.slice(0, -1),
            theme: {
              ...state.theme,
              layouts: previousLayouts,
            },
          }
        }),

      updateColor: (key, value) =>
        set((state) => ({
          theme: {
            ...state.theme,
            colors: {
              ...state.theme.colors,
              [key]: value,
            },
          },
        })),

      updateUi: (key, value) =>
        set((state) => ({
          theme: {
            ...state.theme,
            ui: {
              ...state.theme.ui,
              [key]: value,
            },
          },
        })),

      updateAsset: (key, value) =>
        set((state) => ({
          theme: {
            ...state.theme,
            assets: {
              ...state.theme.assets,
              [key]: value.trim() === '' ? undefined : value,
            },
          },
        })),

      updateSpriteScale: (speciesId, scale) =>
        set((state) => {
          const spriteScales = { ...state.theme.spriteScales }
          const key = String(speciesId)
          if (!Number.isFinite(scale) || scale <= 0 || scale === 1) {
            delete spriteScales[key]
          } else {
            spriteScales[key] = scale
          }
          return {
            theme: {
              ...state.theme,
              spriteScales,
            },
          }
        }),

      resetSpriteScales: () =>
        set((state) => ({
          theme: {
            ...state.theme,
            spriteScales: {},
          },
        })),

      updateBattleLayout: (key, rect) =>
        set((state) => ({
          theme: {
            ...state.theme,
            layouts: {
              ...state.theme.layouts,
              battle: {
                ...state.theme.layouts.battle,
                [key]: rect,
              },
            },
          },
        })),

      updateMainMapNodePosition: (name, position) =>
        set((state) => ({
          theme: {
            ...state.theme,
            layouts: {
              ...state.theme.layouts,
              mainMapNodes: {
                ...state.theme.layouts.mainMapNodes,
                [name]: position,
              },
            },
          },
        })),

      updateMainMapRoad: (key, points) =>
        set((state) => ({
          theme: {
            ...state.theme,
            layouts: {
              ...state.theme.layouts,
              mainMapRoads: {
                ...state.theme.layouts.mainMapRoads,
                [key]: compactRoadPoints(points),
              },
            },
          },
        })),

      updateSceneLayout: ({ scene, key, rect }) =>
        set((state) => ({
          theme: {
            ...state.theme,
            layouts: {
              ...state.theme.layouts,
              [scene]: {
                ...state.theme.layouts[scene],
                [key]: rect,
              },
            },
          },
        })),

      resetBattleLayout: () =>
        set((state) => ({
          layoutUndoStack: pushLayoutUndo(state),
          theme: {
            ...state.theme,
            layouts: {
              ...state.theme.layouts,
              battle: defaultBattleLayout,
            },
          },
        })),

      resetMainMapNodePositions: () =>
        set((state) => ({
          layoutUndoStack: pushLayoutUndo(state),
          theme: {
            ...state.theme,
            layouts: {
              ...state.theme.layouts,
              mainMapNodes: defaultMainMapNodePositions,
            },
          },
        })),

      resetMainMapRoads: () =>
        set((state) => ({
          layoutUndoStack: pushLayoutUndo(state),
          theme: {
            ...state.theme,
            layouts: {
              ...state.theme.layouts,
              mainMapRoads: defaultMainMapRoads,
            },
          },
        })),

      resetSceneLayout: (scene) =>
        set((state) => ({
          layoutUndoStack: pushLayoutUndo(state),
          theme: {
            ...state.theme,
            layouts: {
              ...state.theme.layouts,
              [scene]:
                scene === 'mapGrid'
                  ? defaultMapGridLayout
                  : scene === 'luogo'
                  ? defaultLuogoLayout
                  : scene === 'mainMapUi'
                  ? defaultMainMapUiLayout
                  : scene === 'deposit'
                  ? defaultDepositLayout
                  : defaultEvolutionLayout,
            },
          },
        })),

      resetTheme: () =>
        set({
          layoutUndoStack: [],
          theme: cloneAdminTheme(defaultAdminTheme),
        }),

      applyVisualTheme: (theme) =>
        set((state) => {
          const normalizedTheme = normalizeTheme(theme)

          return {
            theme: {
              ...state.theme,
              id: normalizedTheme.id,
              name: normalizedTheme.name,
              colors: normalizedTheme.colors,
              ui: normalizedTheme.ui,
              assets: normalizedTheme.assets,
              spriteScales: state.theme.spriteScales,
              layouts: state.theme.layouts,
            },
          }
        }),

      importTheme: (theme) =>
        set({
          layoutUndoStack: [],
          theme: cloneAdminTheme(normalizeTheme(theme)),
        }),
    }),
    {
      name: 'arkamon-admin-theme',
      storage: adminStorage,
      merge: (persisted, current) => {
        const saved = persisted as Partial<AdminState> | undefined

        return {
          ...current,
          ...saved,
          layoutUndoStack: [],
          theme: normalizeTheme(saved?.theme),
        }
      },
    }
  )
)
