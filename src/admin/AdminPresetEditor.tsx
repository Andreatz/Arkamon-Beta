import { useAdminStore } from '@store/adminStore'
import { adminThemePresets } from '@/theme/adminThemePresets'

export function AdminPresetEditor() {
  const importTheme = useAdminStore((state) => state.importTheme)
  const resetTheme = useAdminStore((state) => state.resetTheme)

  return (
    <div className="space-y-3">
      <p className="rounded-md border border-[var(--arka-border)] bg-[var(--arka-bg)] px-3 py-2 text-xs text-[var(--arka-text-muted)]">
        Applicare un preset sovrascrive il tema corrente.
      </p>

      {adminThemePresets.map((preset) => (
        <article
          key={preset.id}
          className="rounded-md border border-[var(--arka-border)] bg-[color-mix(in_srgb,var(--arka-surface)_88%,black)] p-3"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-black text-[var(--arka-text)]">{preset.name}</h3>
            <button
              type="button"
              onClick={() => importTheme(preset)}
              className="rounded-md bg-[var(--arka-primary)] px-3 py-1.5 text-xs font-black text-[var(--arka-bg)] transition hover:bg-[var(--arka-primary-hover)]"
            >
              Applica
            </button>
          </div>

          <div className="mt-3 flex gap-1.5">
            {[
              preset.colors.primary,
              preset.colors.bg,
              preset.colors.surface,
              preset.colors.text,
              preset.colors.hpHigh,
              preset.colors.hpMid,
              preset.colors.hpLow,
            ].map((color) => (
              <span
                key={color}
                className="h-5 flex-1 rounded border border-[var(--arka-border)]"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </article>
      ))}

      <button
        type="button"
        onClick={resetTheme}
        className="w-full rounded-md border border-[var(--arka-primary)] px-3 py-2 text-sm font-black text-[var(--arka-primary-hover)] transition hover:bg-[var(--arka-surface-hover)]"
      >
        Ripristina Arkamon Classico
      </button>
    </div>
  )
}
