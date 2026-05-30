import { useState } from 'react'
import { useAdminStore } from '@store/adminStore'
import { AdminAssetEditor } from './AdminAssetEditor'
import { AdminColorEditor } from './AdminColorEditor'
import { AdminImportExport } from './AdminImportExport'
import { AdminLayoutEditor } from './AdminLayoutEditor'
import { AdminPresetEditor } from './AdminPresetEditor'
import { AdminUiEditor } from './AdminUiEditor'
import { AdminVfxEditor } from './AdminVfxEditor'

const ADMIN_MODE_MARKER = 'ARKAMON_ADMIN_MODE_V1_THEME_EDITOR'

type AdminTab = 'colors' | 'ui' | 'layout' | 'assets' | 'vfx' | 'presets' | 'json'

const tabs: { id: AdminTab; label: string }[] = [
  { id: 'colors', label: 'Colori' },
  { id: 'ui', label: 'UI' },
  { id: 'layout', label: 'Layout' },
  { id: 'assets', label: 'Asset' },
  { id: 'vfx', label: 'VFX' },
  { id: 'presets', label: 'Preset' },
  { id: 'json', label: 'Import/Export' },
]

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>('colors')
  const setPanelOpen = useAdminStore((state) => state.setPanelOpen)

  return (
    <section
      data-admin-marker={ADMIN_MODE_MARKER}
      className="arka-admin-panel pointer-events-auto absolute right-3 top-12 flex max-h-[calc(100%-4rem)] w-[min(25rem,calc(100%-1.5rem))] flex-col overflow-hidden rounded-[var(--arka-panel-radius)] border border-[var(--arka-primary)] bg-[var(--arka-surface)] text-[var(--arka-text)] shadow-2xl"
    >
      <header className="flex items-start justify-between gap-3 border-b border-[var(--arka-border)] px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-base font-black leading-tight">Modalita Admin</h2>
          <span className="mt-1 inline-flex rounded-full border border-[var(--arka-primary)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-normal text-[var(--arka-primary-hover)]">
            Theme Editor V1
          </span>
        </div>
        <button
          type="button"
          onClick={() => setPanelOpen(false)}
          className="rounded-md border border-[var(--arka-border)] px-2 py-1 text-xs font-bold text-[var(--arka-text)] transition hover:bg-[var(--arka-surface-hover)]"
        >
          Chiudi
        </button>
      </header>

      <nav className="grid grid-cols-7 border-b border-[var(--arka-border)] text-[10px] font-bold">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`min-h-10 px-1 py-2 leading-tight transition ${
              activeTab === tab.id
                ? 'bg-[var(--arka-primary)] text-[var(--arka-bg)]'
                : 'text-[var(--arka-text-muted)] hover:bg-[var(--arka-surface-hover)] hover:text-[var(--arka-text)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {activeTab === 'colors' ? <AdminColorEditor /> : null}
        {activeTab === 'ui' ? <AdminUiEditor /> : null}
        {activeTab === 'layout' ? <AdminLayoutEditor /> : null}
        {activeTab === 'assets' ? <AdminAssetEditor /> : null}
        {activeTab === 'vfx' ? <AdminVfxEditor /> : null}
        {activeTab === 'presets' ? <AdminPresetEditor /> : null}
        {activeTab === 'json' ? <AdminImportExport /> : null}
      </div>
    </section>
  )
}
