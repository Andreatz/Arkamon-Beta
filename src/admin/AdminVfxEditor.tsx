import { useMemo, useState } from 'react'
import { MOSSE } from '@data/index'
import { SpriteMoveVfx } from '@/components/vfx/SpriteMoveVfx'
import { resolveMoveVfxAsset } from '@/components/vfx/resolveMoveVfxAsset'
import {
  MOVE_VFX_ASSETS,
  type MoveVfxAssetId,
} from '@/components/vfx/vfxManifest'
import {
  useVfxAdminStore,
  type AdminMoveVfxOverride,
} from '@store/vfxAdminStore'
import type { MoveVfxAsset, VfxAnchor, VfxBlendMode, VfxLayer } from '@/components/vfx/types'

const assetIds = Object.keys(MOVE_VFX_ASSETS) as MoveVfxAssetId[]
const anchors: VfxAnchor[] = ['attacker', 'target', 'self', 'center', 'screen']
const layers: VfxLayer[] = ['behind-pokemon', 'over-pokemon', 'front-ui']
const blendModes: VfxBlendMode[] = ['normal', 'screen', 'lighten', 'plus-lighter']

function toOverride(moveId: number, asset: MoveVfxAsset): AdminMoveVfxOverride {
  return {
    moveId,
    assetId: asset.id as MoveVfxAssetId,
    scale: asset.scale ?? 1,
    offsetX: asset.offsetX ?? 0,
    offsetY: asset.offsetY ?? 0,
    durationMs: asset.durationMs,
    anchor: asset.anchor,
    layer: asset.layer,
    mirrorForEnemy: asset.mirrorForEnemy ?? false,
    blendMode: asset.blendMode ?? 'normal',
  }
}

function NumericField({
  label,
  value,
  min,
  step = 1,
  onChange,
}: {
  label: string
  value: number
  min?: number
  step?: number
  onChange: (value: number) => void
}) {
  return (
    <label className="grid gap-1 text-[11px] font-bold text-[var(--arka-text-muted)]">
      {label}
      <input
        type="number"
        value={value}
        min={min}
        step={step}
        onChange={(event) => {
          const nextValue = Number(event.target.value)
          if (Number.isFinite(nextValue)) onChange(nextValue)
        }}
        className="h-8 rounded-md border border-[var(--arka-border)] bg-[var(--arka-bg)] px-2 text-xs text-[var(--arka-text)] outline-none focus:border-[var(--arka-primary)]"
      />
    </label>
  )
}

export function AdminVfxEditor() {
  const [selectedMoveId, setSelectedMoveId] = useState(MOSSE[0]?.id ?? 0)
  const [previewSide, setPreviewSide] = useState<'A' | 'B'>('A')
  const [replayId, setReplayId] = useState(1)
  const overrides = useVfxAdminStore((state) => state.overrides)
  const setOverride = useVfxAdminStore((state) => state.setOverride)
  const removeOverride = useVfxAdminStore((state) => state.removeOverride)
  const resetOverrides = useVfxAdminStore((state) => state.resetOverrides)
  const selectedMove = MOSSE.find((move) => move.id === selectedMoveId) ?? MOSSE[0]
  const resolvedAsset = selectedMove ? resolveMoveVfxAsset(selectedMove) : MOVE_VFX_ASSETS.punch
  const draft = overrides[selectedMoveId] ?? toOverride(selectedMoveId, resolvedAsset)
  const exportJson = useMemo(
    () => JSON.stringify(Object.values(overrides).sort((a, b) => a.moveId - b.moveId), null, 2),
    [overrides]
  )

  const update = (patch: Partial<AdminMoveVfxOverride>) => {
    setOverride({ ...draft, ...patch, moveId: selectedMoveId })
    setReplayId((value) => value + 1)
  }

  return (
    <div className="space-y-4">
      <p className="rounded-md border border-[var(--arka-border)] bg-[var(--arka-bg)] px-3 py-2 text-xs text-[var(--arka-text-muted)]">
        Gli override VFX restano in memoria fino al refresh. Esporta il JSON per conservarli.
      </p>

      <label className="grid gap-1 text-xs font-bold text-[var(--arka-text-muted)]">
        Mossa
        <select
          value={selectedMoveId}
          onChange={(event) => setSelectedMoveId(Number(event.target.value))}
          className="h-9 rounded-md border border-[var(--arka-border)] bg-[var(--arka-bg)] px-2 text-xs text-[var(--arka-text)] outline-none focus:border-[var(--arka-primary)]"
        >
          {MOSSE.map((move) => (
            <option key={move.id} value={move.id}>
              #{move.id} {move.nome}
            </option>
          ))}
        </select>
      </label>

      <section className="overflow-hidden rounded-md border border-[var(--arka-border)] bg-[var(--arka-bg)]">
        <div className="relative h-48 overflow-hidden bg-[radial-gradient(circle_at_center,#294d68,#102538_72%)]">
          {selectedMove ? (
            <SpriteMoveVfx
              key={`${selectedMove.id}-${previewSide}-${replayId}`}
              effect={{ id: replayId, move: selectedMove, side: previewSide }}
            />
          ) : null}
          <div className="absolute bottom-3 left-5 h-12 w-12 rounded-full border-2 border-white/60 bg-cyan-400/50" />
          <div className="absolute right-5 top-5 h-12 w-12 rounded-full border-2 border-white/60 bg-red-400/50" />
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-[var(--arka-border)] px-3 py-2">
          <span className="truncate text-[11px] font-bold text-[var(--arka-text-muted)]">
            {resolvedAsset.label} · {resolvedAsset.kind}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setPreviewSide((side) => (side === 'A' ? 'B' : 'A'))}
              className="rounded border border-[var(--arka-border)] px-2 py-1 text-[10px] font-bold"
            >
              Lato {previewSide}
            </button>
            <button
              type="button"
              onClick={() => setReplayId((value) => value + 1)}
              className="rounded border border-[var(--arka-primary)] px-2 py-1 text-[10px] font-bold text-[var(--arka-primary-hover)]"
            >
              Replay
            </button>
          </div>
        </div>
      </section>

      <label className="grid gap-1 text-xs font-bold text-[var(--arka-text-muted)]">
        Asset
        <select
          value={draft.assetId}
          onChange={(event) => update(toOverride(selectedMoveId, MOVE_VFX_ASSETS[event.target.value as MoveVfxAssetId]))}
          className="h-9 rounded-md border border-[var(--arka-border)] bg-[var(--arka-bg)] px-2 text-xs text-[var(--arka-text)] outline-none focus:border-[var(--arka-primary)]"
        >
          {assetIds.map((assetId) => (
            <option key={assetId} value={assetId}>
              {MOVE_VFX_ASSETS[assetId].label}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-2">
        <NumericField label="Scala" value={draft.scale} min={0.1} step={0.05} onChange={(scale) => update({ scale })} />
        <NumericField label="Durata ms" value={draft.durationMs} min={1} onChange={(durationMs) => update({ durationMs })} />
        <NumericField label="Offset X" value={draft.offsetX} onChange={(offsetX) => update({ offsetX })} />
        <NumericField label="Offset Y" value={draft.offsetY} onChange={(offsetY) => update({ offsetY })} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="grid gap-1 text-[11px] font-bold text-[var(--arka-text-muted)]">
          Anchor
          <select value={draft.anchor} onChange={(event) => update({ anchor: event.target.value as VfxAnchor })} className="h-8 rounded-md border border-[var(--arka-border)] bg-[var(--arka-bg)] px-2 text-xs text-[var(--arka-text)]">
            {anchors.map((anchor) => <option key={anchor}>{anchor}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-[11px] font-bold text-[var(--arka-text-muted)]">
          Layer
          <select value={draft.layer} onChange={(event) => update({ layer: event.target.value as VfxLayer })} className="h-8 rounded-md border border-[var(--arka-border)] bg-[var(--arka-bg)] px-2 text-xs text-[var(--arka-text)]">
            {layers.map((layer) => <option key={layer}>{layer}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-[11px] font-bold text-[var(--arka-text-muted)]">
          Blend mode
          <select value={draft.blendMode} onChange={(event) => update({ blendMode: event.target.value as VfxBlendMode })} className="h-8 rounded-md border border-[var(--arka-border)] bg-[var(--arka-bg)] px-2 text-xs text-[var(--arka-text)]">
            {blendModes.map((blendMode) => <option key={blendMode}>{blendMode}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 rounded-md border border-[var(--arka-border)] bg-[var(--arka-bg)] px-2 text-[11px] font-bold text-[var(--arka-text-muted)]">
          <input type="checkbox" checked={draft.mirrorForEnemy} onChange={(event) => update({ mirrorForEnemy: event.target.checked })} />
          Mirror lato B
        </label>
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={() => removeOverride(selectedMoveId)} className="flex-1 rounded-md border border-[var(--arka-border)] px-3 py-2 text-xs font-bold">
          Ripristina mossa
        </button>
        <button type="button" onClick={resetOverrides} className="flex-1 rounded-md border border-red-500/70 px-3 py-2 text-xs font-bold text-red-300">
          Azzera override
        </button>
      </div>

      <label className="grid gap-1 text-xs font-bold text-[var(--arka-text-muted)]">
        Export JSON ({Object.keys(overrides).length})
        <textarea
          readOnly
          value={exportJson}
          className="h-36 resize-y rounded-md border border-[var(--arka-border)] bg-[var(--arka-bg)] p-2 font-mono text-[10px] text-[var(--arka-text)]"
        />
      </label>
    </div>
  )
}
