import { createPortal } from 'react-dom'
import { useAdminStore } from '@store/adminStore'
import { AdminPanel } from './AdminPanel'
import { useAdminHotkey } from './useAdminHotkey'

export function AdminOverlay() {
  useAdminHotkey()

  const enabled = useAdminStore((state) => state.enabled)
  const panelOpen = useAdminStore((state) => state.panelOpen)
  const setPanelOpen = useAdminStore((state) => state.setPanelOpen)

  if (!enabled || typeof document === 'undefined') return null

  // The game stage is letterboxed and scaled. The editor uses the real viewport
  // so its tabs and scrollable controls stay reachable on portrait screens.
  return createPortal(
    <div data-admin-overlay="viewport" className="fixed inset-0 z-[1000] pointer-events-none">
      <button
        type="button"
        aria-expanded={panelOpen}
        aria-controls="arkamon-admin-panel"
        onClick={() => setPanelOpen(!panelOpen)}
        className="pointer-events-auto absolute right-3 top-3 rounded-md border border-[var(--arka-primary)] bg-[var(--arka-surface)] px-3 py-1.5 text-xs font-bold text-[var(--arka-text)] shadow-lg transition hover:bg-[var(--arka-surface-hover)]"
      >
        Admin
      </button>

      {panelOpen ? <AdminPanel /> : null}
    </div>,
    document.body,
  )
}
