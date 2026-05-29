import { beforeEach, describe, expect, it } from 'vitest'
import { useAdminStore } from '@store/adminStore'
import type { AdminTheme } from '@/theme/adminThemeTypes'
import { cloneAdminTheme, defaultAdminTheme } from '@/theme/defaultAdminTheme'

function resetAdminStore(): void {
  useAdminStore.setState({
    enabled: false,
    panelOpen: false,
    theme: cloneAdminTheme(defaultAdminTheme),
  })
}

describe('adminStore', () => {
  beforeEach(() => {
    resetAdminStore()
  })

  it('usa il tema default', () => {
    expect(useAdminStore.getState().theme).toEqual(defaultAdminTheme)
  })

  it('updateColor aggiorna solo il colore richiesto', () => {
    useAdminStore.getState().updateColor('primary', '#ffffff')

    const theme = useAdminStore.getState().theme
    expect(theme.colors.primary).toBe('#ffffff')
    expect(theme.colors.bg).toBe(defaultAdminTheme.colors.bg)
  })

  it('updateUi aggiorna solo il valore UI richiesto', () => {
    useAdminStore.getState().updateUi('panelRadius', 24)

    const theme = useAdminStore.getState().theme
    expect(theme.ui.panelRadius).toBe(24)
    expect(theme.ui.buttonRadius).toBe(defaultAdminTheme.ui.buttonRadius)
  })

  it('resetTheme ripristina Arkamon Classico', () => {
    useAdminStore.getState().updateColor('bg', '#ffffff')
    useAdminStore.getState().updateUi('stageScale', 0.8)

    useAdminStore.getState().resetTheme()

    expect(useAdminStore.getState().theme).toEqual(defaultAdminTheme)
  })

  it('importTheme sostituisce il tema corrente', () => {
    const imported: AdminTheme = {
      ...defaultAdminTheme,
      id: 'tema-test',
      name: 'Tema Test',
      colors: {
        ...defaultAdminTheme.colors,
        primary: '#123456',
      },
      ui: {
        ...defaultAdminTheme.ui,
        buttonRadius: 6,
      },
    }

    useAdminStore.getState().importTheme(imported)

    expect(useAdminStore.getState().theme).toEqual(imported)
  })
})
