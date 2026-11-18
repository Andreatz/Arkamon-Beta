import { createPortal } from 'react-dom'
import { lazy, Suspense } from 'react'
import { useAdminStore } from '@store/adminStore'
import { useAdminHotkey } from './useAdminHotkey'

const AdminPanel = lazy(() => import('./AdminPanel').then(module => ({ default: module.AdminPanel })))

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
        aria-label="Admin"
        title="Admin (Ctrl+Shift+A)"
        data-admin-toggle=""
        className="admin-toggle pointer-events-auto absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-[var(--arka-primary)] bg-[var(--arka-surface)] text-base text-[var(--arka-text)] opacity-60 shadow-lg transition hover:opacity-100 focus-visible:opacity-100 hover:bg-[var(--arka-surface-hover)]"
      >
        {/* Fase U6: icona discreta; la scorciatoia Ctrl+Shift+A resta la via principale. */}
        <span aria-hidden="true">⚙</span>
      </button>

      {panelOpen ? <Suspense fallback={<div role="status" className="pointer-events-auto absolute right-3 top-14 rounded-md border border-[var(--arka-primary)] bg-[var(--arka-surface)] p-3 text-[var(--arka-text)]">Caricamento Admin…</div>}><AdminPanel /></Suspense> : null}
    </div>,
    document.body,
  )
}
