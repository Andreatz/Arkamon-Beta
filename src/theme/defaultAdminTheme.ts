import type { AdminTheme } from './adminThemeTypes'

export const defaultBattleLayout = {
  enemySprite: { x: 74, y: 14, w: 19, h: 34 },
  playerSprite: { x: 6, y: 47, w: 23, h: 41 },
  enemyHp: { x: 50, y: 17, w: 26, h: 10 },
  playerHp: { x: 33, y: 55, w: 26, h: 10 },
  infoBox: { x: 28, y: 38, w: 44, h: 16 },
  playerMoves: { x: 46, y: 70, w: 50, h: 24 },
  enemyMoves: { x: 3, y: 19, w: 50, h: 24 },
  turnStatus: { x: 39, y: 4, w: 22, h: 5 },
  passTurnButton: { x: 38, y: 87, w: 24, h: 8 },
  resultMoney: { x: 37, y: 78, w: 26, h: 7 },
  continueButton: { x: 2, y: 88, w: 15, h: 7 },
  enemySquad: { x: 2, y: 15, w: 16, h: 4 },
  playerSquad: { x: 82, y: 76, w: 16, h: 4 },
}

export const defaultMainMapNodePositions = {
  Torino: { x: 22, y: 26 },
  Percorso_6: { x: 24, y: 28 },
  Percorso_5: { x: 22, y: 32 },
  Percorso_4: { x: 26, y: 30 },
  Percorso_3: { x: 28, y: 24 },
  Milano: { x: 32, y: 22 },
  Percorso_2: { x: 36, y: 24 },
  Piacenza: { x: 40, y: 28 },
  Percorso_1: { x: 48, y: 26 },
  Venezia: { x: 56, y: 24 },
  Grosseto: { x: 38, y: 44 },
  Civitavecchia: { x: 42, y: 52 },
  Roma: { x: 48, y: 56 },
  Percorso_14: { x: 54, y: 54 },
  Pescara: { x: 60, y: 52 },
  Percorso_13: { x: 60, y: 56 },
  Molisnt: { x: 62, y: 60 },
  Napoli: { x: 56, y: 64 },
  Percorso_12: { x: 62, y: 64 },
  Percorso_11: { x: 66, y: 62 },
  Foggia: { x: 72, y: 62 },
  Percorso_10: { x: 64, y: 72 },
  ReggioCalabria: { x: 58, y: 82 },
  Percorso_9: { x: 52, y: 88 },
  Palermo: { x: 44, y: 90 },
  Percorso_7: { x: 32, y: 64 },
  Cagliari: { x: 24, y: 78 },
  Percorso_8: { x: 32, y: 86 },
}

export const defaultMainMapRoads = {}

export const defaultMainMapUiLayout = {
  turnPanel: { x: 1.5, y: 2, w: 11.5, h: 5.5 },
  coinsPanel: { x: 13.7, y: 2, w: 10.5, h: 5.5 },
  positionPanel: { x: 24.9, y: 2, w: 15, h: 5.5 },
  actionsPanel: { x: 40.6, y: 2, w: 21.5, h: 5.5 },
  enterButton: { x: 63, y: 2, w: 13.8, h: 5.5 },
  passButton: { x: 77.4, y: 2, w: 9.5, h: 5.5 },
  depositButton: { x: 87.5, y: 2, w: 9.8, h: 5.5 },
  titleButton: { x: 87.5, y: 8.2, w: 9.8, h: 5.5 },
  legend: { x: 1.5, y: 80.5, w: 14.5, h: 16 },
  footer: { x: 78.5, y: 94, w: 20, h: 3 },
}

export const defaultMapGridLayout = {
  hud: { x: 1.5, y: 2, w: 97, h: 8 },
  grid: { x: 3, y: 12, w: 94, h: 68 },
  bottomLog: { x: 1.5, y: 82, w: 76, h: 15 },
  legend: { x: 79, y: 78, w: 19.5, h: 20 },
}

export const defaultDepositLayout = {
  hud: { x: 3, y: 3, w: 94, h: 9 },
  boxGrid: { x: 4, y: 16, w: 66, h: 68 },
  teamPanel: { x: 73, y: 16, w: 23, h: 68 },
  infoBar: { x: 12, y: 88, w: 76, h: 8 },
}

export const defaultEvolutionLayout = {
  counter: { x: 78, y: 3, w: 18, h: 6 },
  sprite: { x: 40, y: 23, w: 20, h: 36 },
  textPanel: { x: 24, y: 63, w: 52, h: 25 },
}

export const defaultAdminTheme: AdminTheme = {
  id: 'arkamon-default',
  name: 'Arkamon Classico',
  colors: {
    primary: '#f59e0b',
    primaryHover: '#fbbf24',
    bg: '#0f172a',
    surface: '#1e293b',
    surfaceHover: '#334155',
    text: '#f1f5f9',
    textMuted: '#94a3b8',
    border: '#475569',
    hpHigh: '#16a34a',
    hpMid: '#eab308',
    hpLow: '#dc2626',
  },
  ui: {
    panelRadius: 16,
    buttonRadius: 12,
    panelOpacity: 1,
    shadowIntensity: 1,
    buttonScale: 0.95,
    stageScale: 1,
    fontScale: 1,
    mainMapRoadOpacity: 0.42,
  },
  assets: {},
  layouts: {
    battle: defaultBattleLayout,
    mainMapNodes: defaultMainMapNodePositions,
    mainMapRoads: defaultMainMapRoads,
    mainMapUi: defaultMainMapUiLayout,
    mapGrid: defaultMapGridLayout,
    deposit: defaultDepositLayout,
    evolution: defaultEvolutionLayout,
  },
}

export function cloneAdminTheme(theme: AdminTheme): AdminTheme {
  return {
    ...theme,
    colors: { ...theme.colors },
    ui: { ...theme.ui },
    assets: { ...theme.assets },
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
      deposit: {
        ...theme.layouts.deposit,
      },
      evolution: {
        ...theme.layouts.evolution,
      },
    },
  }
}
