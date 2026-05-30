import { useMemo, useState, type CSSProperties } from 'react'
import { AnimatedSprite } from './AnimatedSprite'
import { FallbackVfx } from './FallbackVfx'
import { GifVfx } from './GifVfx'
import type { MoveVfxAsset, VfxAnchor, VfxPlaybackKind } from './types'
import { MOVE_VFX_ASSETS, type MoveVfxAssetId } from './vfxManifest'
import { assetUrl } from '@/utils/assetUrl'

type Side = 'A' | 'B'
type Background = 'dark' | 'light' | 'battle'
type KindFilter = 'all' | VfxPlaybackKind

const ANCHORS: VfxAnchor[] = ['attacker', 'target', 'self', 'center', 'screen']
const SCALES = [0.5, 1, 1.5, 2]

const POSITIONS: Record<Side, Record<VfxAnchor, { x: number; y: number }>> = {
  A: {
    attacker: { x: 25, y: 64 },
    target: { x: 77, y: 32 },
    self: { x: 25, y: 64 },
    center: { x: 50, y: 48 },
    screen: { x: 50, y: 50 },
  },
  B: {
    attacker: { x: 77, y: 32 },
    target: { x: 25, y: 64 },
    self: { x: 77, y: 32 },
    center: { x: 50, y: 48 },
    screen: { x: 50, y: 50 },
  },
}

function AssetVisual({
  asset,
  replayId,
  side,
  scale,
}: {
  asset: MoveVfxAsset
  replayId: number
  side: Side
  scale: number
}) {
  const [failed, setFailed] = useState(false)
  const onError = () => setFailed(true)
  const style: CSSProperties = {
    transform: [
      `scale(${scale})`,
      side === 'B' && asset.mirrorForEnemy ? 'scaleX(-1)' : '',
      side === 'B' && asset.rotateDegForEnemy ? `rotate(${asset.rotateDegForEnemy}deg)` : '',
    ].filter(Boolean).join(' '),
    mixBlendMode: asset.blendMode ?? 'normal',
    opacity: asset.opacity ?? 1,
  }

  if (failed) return <FallbackVfx effectId={replayId} />

  if (asset.kind === 'gif') {
    return <GifVfx asset={asset} effectId={replayId} style={style} onError={onError} />
  }

  if (asset.kind === 'sprite-sheet' && asset.sprite) {
    return (
      <AnimatedSprite
        key={`${asset.id}-${replayId}`}
        src={assetUrl(asset.src)}
        {...asset.sprite}
        width={asset.width}
        height={asset.height}
        durationMs={asset.durationMs}
        loop={asset.loop}
        style={style}
        onError={onError}
      />
    )
  }

  return (
    <img
      src={assetUrl(asset.src)}
      alt=""
      decoding="async"
      onError={onError}
      style={{ width: asset.width, height: asset.height, objectFit: 'contain', ...style }}
    />
  )
}

export function VfxGallery() {
  const [selectedId, setSelectedId] = useState<MoveVfxAssetId>('slash')
  const [replayId, setReplayId] = useState(1)
  const [side, setSide] = useState<Side>('A')
  const [anchor, setAnchor] = useState<VfxAnchor>('target')
  const [scale, setScale] = useState(1)
  const [background, setBackground] = useState<Background>('battle')
  const [kindFilter, setKindFilter] = useState<KindFilter>('all')
  const asset = MOVE_VFX_ASSETS[selectedId]
  const point = POSITIONS[side][anchor]
  const visibleAssets = useMemo(
    () => Object.values(MOVE_VFX_ASSETS).filter((entry) => kindFilter === 'all' || entry.kind === kindFilter),
    [kindFilter]
  )

  const selectAsset = (id: MoveVfxAssetId) => {
    setSelectedId(id)
    setReplayId((value) => value + 1)
  }

  return (
    <div className="flex h-full w-full bg-slate-950 text-slate-100">
      <aside className="w-72 shrink-0 overflow-y-auto border-r border-white/10 bg-slate-950/95 p-4">
        <h1 className="text-xl font-black text-amber-300">VFX Lab</h1>
        <p className="mt-1 text-xs text-slate-400">Dev-only asset calibration</p>
        <select
          value={kindFilter}
          onChange={(event) => setKindFilter(event.target.value as KindFilter)}
          className="mt-4 w-full rounded bg-slate-800 px-3 py-2 text-sm"
        >
          <option value="all">All formats</option>
          <option value="sprite-sheet">Sprite sheets</option>
          <option value="gif">GIF</option>
          <option value="static-image">Static images</option>
        </select>
        <div className="mt-3 space-y-1">
          {visibleAssets.map((entry) => (
            <button
              key={entry.id}
              onClick={() => selectAsset(entry.id as MoveVfxAssetId)}
              className={`w-full rounded px-3 py-2 text-left text-sm ${
                entry.id === selectedId ? 'bg-amber-400 font-black text-slate-950' : 'bg-slate-900 hover:bg-slate-800'
              }`}
            >
              {entry.label}
              <span className="block text-[10px] opacity-70">{entry.kind}</span>
            </button>
          ))}
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-slate-900/95 p-3 text-xs">
          <button className="rounded bg-amber-400 px-4 py-2 font-black text-slate-950" onClick={() => setReplayId((value) => value + 1)}>
            Replay
          </button>
          <select value={side} onChange={(event) => setSide(event.target.value as Side)} className="rounded bg-slate-800 px-3 py-2">
            <option value="A">Side A</option>
            <option value="B">Side B</option>
          </select>
          <select value={anchor} onChange={(event) => setAnchor(event.target.value as VfxAnchor)} className="rounded bg-slate-800 px-3 py-2">
            {ANCHORS.map((value) => <option key={value}>{value}</option>)}
          </select>
          <select value={scale} onChange={(event) => setScale(Number(event.target.value))} className="rounded bg-slate-800 px-3 py-2">
            {SCALES.map((value) => <option key={value} value={value}>{value}x</option>)}
          </select>
          <select value={background} onChange={(event) => setBackground(event.target.value as Background)} className="rounded bg-slate-800 px-3 py-2">
            <option value="battle">Battle background</option>
            <option value="dark">Dark background</option>
            <option value="light">Light background</option>
          </select>
          <span className="ml-auto text-slate-300">
            {asset.width}x{asset.height} | {asset.durationMs} ms | {asset.anchor} | {asset.layer}
          </span>
        </div>

        <div
          className={`relative flex-1 overflow-hidden ${
            background === 'dark' ? 'bg-slate-950' : background === 'light' ? 'bg-slate-200' : 'bg-cover bg-center'
          }`}
          style={background === 'battle' ? { backgroundImage: `url(${assetUrl('backgrounds/battle_forest.jpg')})` } : undefined}
        >
          <div className="absolute left-[25%] top-[64%] h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-emerald-300/80 bg-emerald-500/20 text-center text-xs font-black leading-[6rem]">
            A
          </div>
          <div className="absolute left-[77%] top-[32%] h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-rose-300/80 bg-rose-500/20 text-center text-xs font-black leading-[6rem]">
            B
          </div>
          <div
            key={`${selectedId}-${replayId}-${side}-${anchor}-${scale}`}
            className="pointer-events-none absolute flex items-center justify-center"
            style={{
              left: `${point.x}%`,
              top: `${point.y}%`,
              width: anchor === 'screen' ? '100%' : asset.width,
              height: anchor === 'screen' ? '100%' : asset.height,
              marginLeft: anchor === 'screen' ? '-50%' : -(asset.width / 2),
              marginTop: anchor === 'screen' ? '-50%' : -(asset.height / 2),
            }}
          >
            <AssetVisual asset={asset} replayId={replayId} side={side} scale={scale} />
          </div>
        </div>
      </main>
    </div>
  )
}
