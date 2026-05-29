export interface AdminThemeColors {
  primary: string
  primaryHover: string
  bg: string
  surface: string
  surfaceHover: string
  text: string
  textMuted: string
  border: string
  hpHigh: string
  hpMid: string
  hpLow: string
}

export interface AdminThemeUi {
  panelRadius: number
  buttonRadius: number
  panelOpacity: number
  shadowIntensity: number
  buttonScale: number
  stageScale: number
}

export interface AdminTheme {
  id: string
  name: string
  colors: AdminThemeColors
  ui: AdminThemeUi
}
