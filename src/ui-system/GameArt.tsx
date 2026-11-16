import type { CSSProperties, ImgHTMLAttributes } from 'react'
import catalog from '@/data/gameArt.json'
import { assetUrl } from '@/utils/assetUrl'

/**
 * Illustrazioni di gioco (audit UX/UI, fase U0): asset dipinti importati in public/ui/game-art
 * con scripts/assets/import-game-art.mjs. Un id assente non rompe nulla: `GameArt` non
 * disegna e i chiamanti tengono il segnaposto attuale.
 */
export interface GameArtAsset { id: string; file: string; width: number; height: number; source: string }

const ASSETS = new Map<string, GameArtAsset>((catalog.assets as GameArtAsset[]).map(asset => [asset.id, asset]))

export function hasGameArt(id: string): boolean {
  return ASSETS.has(id)
}

export function gameArtUrl(id: string): string | undefined {
  const asset = ASSETS.get(id)
  return asset ? assetUrl(`/ui/game-art/${asset.file}`) : undefined
}

export function GameArt({ id, className = '', style, ...props }: Omit<ImgHTMLAttributes<HTMLImageElement>, 'id' | 'src' | 'alt'> & { id: string; style?: CSSProperties }) {
  const asset = ASSETS.get(id)
  if (!asset) return null
  return <img {...props} className={`game-art ${className}`} src={assetUrl(`/ui/game-art/${asset.file}`)} width={asset.width} height={asset.height}
    alt="" aria-hidden="true" draggable={false} decoding="async" data-game-art={id} style={{ ...style, objectFit: 'contain' }} />
}

/** Illustrazione per le icone del kit (oggetti e moneta); le altre icone restano quelle attuali. */
const ICON_ART: Record<string, string> = {
  'item-coin': 'coin',
  'item-potion': 'item-potion',
  'item-superpotion': 'item-superpotion',
  'item-antidote': 'item-antidote',
  'item-awakening': 'item-awakening',
  'item-revive': 'item-revive',
  'item-paralysis-heal': 'item-paralysis-heal',
  'item-sphere': 'item-sacchettino-supremo',
}
export function gameArtForIcon(iconId: string): string | undefined {
  const art = ICON_ART[iconId]
  return art && ASSETS.has(art) ? art : undefined
}

/** Illustrazioni delle tessere del Menù principale, per icona della destinazione. */
const MENU_ART: Record<string, string> = {
  'icon-team': 'menu-team', 'icon-arkadex': 'menu-arkadex', 'icon-bag': 'menu-bag', 'icon-deposit': 'menu-deposit',
  'icon-map': 'menu-map', 'icon-journal': 'menu-diary', 'icon-book': 'menu-register', 'icon-backup': 'menu-save', 'icon-options': 'menu-settings',
}
export function gameArtForMenu(iconId: string): string | undefined {
  const art = MENU_ART[iconId]
  return art && ASSETS.has(art) ? art : undefined
}
