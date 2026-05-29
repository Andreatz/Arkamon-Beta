import type { AdminTheme } from './adminThemeTypes'

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
  },
}

export function cloneAdminTheme(theme: AdminTheme): AdminTheme {
  return {
    ...theme,
    colors: { ...theme.colors },
    ui: { ...theme.ui },
  }
}
