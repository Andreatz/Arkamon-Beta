import { useEffect } from 'react'
import { useAdminStore } from '@store/adminStore'

export function useAdminHotkey(): void {
  const enabled = useAdminStore((state) => state.enabled)
  const panelOpen = useAdminStore((state) => state.panelOpen)
  const toggleEnabled = useAdminStore((state) => state.toggleEnabled)
  const setPanelOpen = useAdminStore((state) => state.setPanelOpen)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey || !event.shiftKey || event.key.toLowerCase() !== 'a') {
        return
      }

      event.preventDefault()

      if (!enabled) {
        toggleEnabled()
        setPanelOpen(true)
        return
      }

      setPanelOpen(!panelOpen)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled, panelOpen, setPanelOpen, toggleEnabled])
}
