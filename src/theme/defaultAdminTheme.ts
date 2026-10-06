import suppliedTheme from './arkamon-theme.json'
import type { AdminTheme } from './adminThemeTypes'

export const defaultBattleLayout = suppliedTheme.layouts.battle
export const defaultMainMapNodePositions = suppliedTheme.layouts.mainMapNodes
export const defaultMainMapRoads = suppliedTheme.layouts.mainMapRoads
export const defaultMainMapUiLayout = suppliedTheme.layouts.mainMapUi
export const defaultMapGridLayout = suppliedTheme.layouts.mapGrid
export const defaultLuogoLayout = suppliedTheme.layouts.luogo
// The imported theme predates the circular portrait deposit. Its old rectangles
// are migrated on import, and new games must use the same current geometry.
export const defaultDepositLayout = {
  hud: { x: 31.5, y: 4.4, w: 62, h: 6.2 },
  boxGrid: { x: 31.5, y: 12.5, w: 62, h: 79 },
  teamPanel: { x: 1.9, y: 2, w: 27.1, h: 92.5 },
  infoBar: { x: 31.5, y: 93, w: 67, h: 6 },
}
export const defaultEvolutionLayout = suppliedTheme.layouts.evolution
export const defaultAdminTheme: AdminTheme = {
  ...suppliedTheme,
  layouts: { ...suppliedTheme.layouts, deposit: defaultDepositLayout },
}

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
