import { useMemo, useState } from 'react'
import { useAdminStore } from '@store/adminStore'
import type { AdminTheme, AdminThemeColors, AdminThemeUi } from '@/theme/adminThemeTypes'

const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

const colorKeys: (keyof AdminThemeColors)[] = [
  'primary',
  'primaryHover',
  'bg',
  'surface',
  'surfaceHover',
  'text',
  'textMuted',
  'border',
  'hpHigh',
  'hpMid',
  'hpLow',
]

const uiKeys: (keyof AdminThemeUi)[] = [
  'panelRadius',
  'buttonRadius',
  'panelOpacity',
  'shadowIntensity',
  'buttonScale',
  'stageScale',
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseThemeJson(value: string): { theme: AdminTheme; error: null } | { theme: null; error: string } {
  let parsed: unknown

  try {
    parsed = JSON.parse(value)
  } catch {
    return { theme: null, error: 'JSON non valido.' }
  }

  if (!isRecord(parsed)) {
    return { theme: null, error: 'Il contenuto deve essere un oggetto tema.' }
  }

  if (typeof parsed.id !== 'string' || typeof parsed.name !== 'string') {
    return { theme: null, error: 'Il tema deve contenere id e name testuali.' }
  }

  if (!isRecord(parsed.colors) || !isRecord(parsed.ui)) {
    return { theme: null, error: 'Il tema deve contenere colors e ui.' }
  }

  const colors: Partial<AdminThemeColors> = {}
  for (const key of colorKeys) {
    const color = parsed.colors[key]
    if (typeof color !== 'string' || !HEX_COLOR_PATTERN.test(color)) {
      return { theme: null, error: `Colore non valido: ${key}.` }
    }
    colors[key] = color
  }

  const ui: Partial<AdminThemeUi> = {}
  for (const key of uiKeys) {
    const valueForKey = parsed.ui[key]
    if (typeof valueForKey !== 'number' || !Number.isFinite(valueForKey)) {
      return { theme: null, error: `Valore UI non valido: ${key}.` }
    }
    ui[key] = valueForKey
  }

  return {
    theme: {
      id: parsed.id,
      name: parsed.name,
      colors: colors as AdminThemeColors,
      ui: ui as AdminThemeUi,
    },
    error: null,
  }
}

export function AdminImportExport() {
  const theme = useAdminStore((state) => state.theme)
  const importTheme = useAdminStore((state) => state.importTheme)
  const json = useMemo(() => JSON.stringify(theme, null, 2), [theme])
  const [importValue, setImportValue] = useState(json)
  const [message, setMessage] = useState<string | null>(null)

  const copyJson = async () => {
    if (!navigator.clipboard) {
      setMessage('Appunti non disponibili in questo browser.')
      return
    }

    await navigator.clipboard.writeText(json)
    setMessage('JSON copiato negli appunti.')
  }

  const downloadJson = () => {
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'arkamon-theme.json'
    link.click()
    URL.revokeObjectURL(url)
    setMessage('Export pronto come arkamon-theme.json.')
  }

  const importJson = () => {
    const result = parseThemeJson(importValue)
    if (result.theme === null) {
      setMessage(result.error)
      return
    }

    importTheme(result.theme)
    setMessage('Tema importato correttamente.')
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-sm font-black text-[var(--arka-text)]">Tema corrente</h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={copyJson}
              className="rounded-md bg-[var(--arka-primary)] px-3 py-1.5 text-xs font-black text-[var(--arka-bg)] transition hover:bg-[var(--arka-primary-hover)]"
            >
              Copia
            </button>
            <button
              type="button"
              onClick={downloadJson}
              className="rounded-md border border-[var(--arka-border)] px-3 py-1.5 text-xs font-black text-[var(--arka-text)] transition hover:bg-[var(--arka-surface-hover)]"
            >
              Scarica
            </button>
          </div>
        </div>
        <textarea
          value={json}
          readOnly
          className="h-40 w-full resize-none rounded-md border border-[var(--arka-border)] bg-[var(--arka-bg)] p-3 font-mono text-[11px] text-[var(--arka-text)] outline-none"
        />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-black text-[var(--arka-text)]">Importa JSON</h3>
        <textarea
          value={importValue}
          onChange={(event) => setImportValue(event.target.value)}
          className="h-40 w-full resize-none rounded-md border border-[var(--arka-border)] bg-[var(--arka-bg)] p-3 font-mono text-[11px] text-[var(--arka-text)] outline-none focus:border-[var(--arka-primary)]"
          spellCheck={false}
        />
        <button
          type="button"
          onClick={importJson}
          className="mt-2 w-full rounded-md bg-[var(--arka-primary)] px-3 py-2 text-sm font-black text-[var(--arka-bg)] transition hover:bg-[var(--arka-primary-hover)]"
        >
          Importa tema
        </button>
      </div>

      {message ? (
        <p className="rounded-md border border-[var(--arka-border)] bg-[var(--arka-bg)] px-3 py-2 text-xs text-[var(--arka-text-muted)]">
          {message}
        </p>
      ) : null}
    </div>
  )
}
