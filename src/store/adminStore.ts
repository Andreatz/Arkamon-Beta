import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { StateStorage } from 'zustand/middleware'
import type { AdminTheme, AdminThemeColors, AdminThemeUi } from '@/theme/adminThemeTypes'
import { cloneAdminTheme, defaultAdminTheme } from '@/theme/defaultAdminTheme'

const ADMIN_ENABLED_BY_DEFAULT = import.meta.env.DEV

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

interface AdminState {
  enabled: boolean
  panelOpen: boolean
  theme: AdminTheme
  toggleEnabled: () => void
  setPanelOpen: (open: boolean) => void
  updateColor: (key: keyof AdminThemeColors, value: string) => void
  updateUi: (key: keyof AdminThemeUi, value: number) => void
  resetTheme: () => void
  importTheme: (theme: AdminTheme) => void
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      enabled: ADMIN_ENABLED_BY_DEFAULT,
      panelOpen: false,
      theme: cloneAdminTheme(defaultAdminTheme),

      toggleEnabled: () =>
        set((state) => ({
          enabled: !state.enabled,
          panelOpen: state.enabled ? false : state.panelOpen,
        })),

      setPanelOpen: (panelOpen) => set({ panelOpen }),

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

      resetTheme: () => set({ theme: cloneAdminTheme(defaultAdminTheme) }),

      importTheme: (theme) => set({ theme: cloneAdminTheme(theme) }),
    }),
    {
      name: 'arkamon-admin-theme',
      storage: adminStorage,
    }
  )
)
