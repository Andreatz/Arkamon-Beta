import suppliedTheme from './arkamon-theme.json'
import type { AdminTheme } from './adminThemeTypes'

export const defaultBattleLayout = suppliedTheme.layouts.battle
export const defaultMainMapNodePositions = suppliedTheme.layouts.mainMapNodes
export const defaultMainMapRoads = suppliedTheme.layouts.mainMapRoads
export const defaultMainMapUiLayout = suppliedTheme.layouts.mainMapUi
export const defaultMapGridLayout = suppliedTheme.layouts.mapGrid
export const defaultLuogoLayout = suppliedTheme.layouts.luogo
export const defaultDepositLayout = suppliedTheme.layouts.deposit
export const defaultEvolutionLayout = suppliedTheme.layouts.evolution
export const defaultAdminTheme: AdminTheme = suppliedTheme

export function cloneAdminTheme(theme: AdminTheme): AdminTheme {
  return {
    ...theme,
    colors: { ...theme.colors },
    ui: { ...theme.ui },
    assets: { ...theme.assets },
    spriteScales: { ...theme.spriteScales },
    layouts: {
      battle: {
        ...theme.layouts.battle,
      },
      mainMapNodes: {
        ...theme.layouts.mainMapNodes,
      },
      mainMapRoads: Object.fromEntries(
        Object.entries(theme.layouts.mainMapRoads).map(([key, points]) => [
          key,
          points.map((point) => ({ ...point })),
        ])
      ),
      mainMapUi: {
        ...theme.layouts.mainMapUi,
      },
      mapGrid: {
        ...theme.layouts.mapGrid,
      },
      luogo: {
        ...theme.layouts.luogo,
      },
      deposit: {
        ...theme.layouts.deposit,
      },
      evolution: {
        ...theme.layouts.evolution,
      },
    },
  }
}
