import { useHealPulse } from '@/motion/ui/useHealPulse'
import { battleMoveFacts } from '@/components/battle/battleMoveFacts'
import { GameArt, gameArtForIcon, hasGameArt } from '@/ui-system/GameArt'
import { useEffect, useState, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react'
import type { PokemonIstanza, TipoPokemon } from '@/types'
import { getMossa, getPokemon } from '@/data'
import { calcolaHPMax, getMossaAlLivello, èMossaCura, èMossaSoloStato } from '@/engine/battleEngine'
import { assetUrl } from '@/utils/assetUrl'
import { getPortraitFraming } from './portraitFraming'
import { ReferenceIcon } from './reference/ReferenceEmblem'
import { ProvidedArtwork, providedIconAsset, providedPortraitSource } from './reference/ProvidedArtwork'
import './playerUiPrimitives'

export const TYPE_ICONS: Record<TipoPokemon, string> = {
  Normale: 'type-normal', Elettro: 'type-electric', Fuoco: 'type-fire', Terra: 'type-earth',
  Acqua: 'type-water', Erba: 'type-grass', Oscurità: 'type-dark', Psico: 'type-psychic',
}
export const ITEM_ICONS: Record<string, string> = {
  potion: 'item-potion', 'super-potion': 'item-superpotion', revive: 'item-revive',
  antidote: 'item-antidote', masterball: 'item-sphere', 'paralysis-heal': 'type-electric', awakening: 'type-psychic',
  'hyper-potion': 'item-hyperpotion', 'max-potion': 'item-maxpotion', 'full-heal': 'item-full-heal',
  sacchettino: 'item-sacchettino', 'mega-sacchettino': 'item-mega-sacchettino', 'ultra-sacchettino': 'item-ultra-sacchettino',
  'boost-speed': 'item-boost-speed', 'boost-damage': 'item-boost-damage', 'special-scent': 'item-scent', bicycle: 'item-bicycle', scooter: 'item-scooter',
}
export function itemIconId(itemId: string): string {
  if (itemId === 'awakening') return 'item-awakening'
  if (itemId === 'paralysis-heal') return 'item-paralysis-heal'
  return ITEM_ICONS[itemId]
}
const ICON_GLYPHS: Record<string, string> = {
  'icon-home': '⌂', 'icon-team': '◉', 'icon-bag': '▣', 'icon-analysis': '⌕',
  'icon-arkadex': '▤', 'icon-book': '▤', 'icon-deposit': '▦', 'icon-box': '▦',
  'icon-map': '⌖', 'icon-journal': '≡', 'icon-options': '⚙︎', 'icon-shop': '$',
  'icon-chronicles': '≡', 'icon-challenges': '◇', 'icon-activity': '↗',
  'item-potion': 'P', 'item-superpotion': 'SP', 'item-revive': 'R',
  'item-antidote': 'A', 'item-sphere': 'M', 'item-coin': '₳', 'item-awakening': 'SV', 'item-paralysis-heal': 'AP',
  'item-hyperpotion': 'IP', 'item-maxpotion': 'PM', 'item-full-heal': 'CT', 'item-sacchettino': 'S', 'item-mega-sacchettino': 'MS',
  'item-ultra-sacchettino': 'US', 'item-boost-speed': 'BV', 'item-boost-damage': 'BD', 'item-scent': 'PR', 'item-bicycle': 'BI', 'item-scooter': 'MO',
  'type-normal': 'N', 'type-electric': 'EL', 'type-fire': 'FU', 'type-earth': 'TE',
  'type-water': 'AC', 'type-grass': 'ER', 'type-dark': 'OS', 'type-psychic': 'PS',
}
export function KitIcon({ id, className = '' }: { id: string; className?: string }) {
  // Illustrazioni dipinte (oggetti e moneta) quando presenti nel catalogo di gioco.
  const art = gameArtForIcon(id)
  if (art) return <span className={`pu-kit-icon pu-kit-icon-art ${className}`} data-icon={id} aria-hidden="true"><GameArt id={art} /></span>
  const provided = providedIconAsset(id)
  if (provided) return <span className={`pu-kit-icon pu-kit-icon-provided ${className}`} data-icon={id} aria-hidden="true"><ProvidedArtwork id={provided} /></span>
  if (!id.startsWith('item-') || id === 'item-coin') return <span className={`pu-kit-icon pu-kit-icon-reference ${className}`} data-icon={id} aria-hidden="true"><ReferenceIcon kind={id} /></span>
  return <span className={`pu-kit-icon pu-kit-icon-css ${className}`} data-icon={id} aria-hidden="true"><span className="pu-kit-icon-glyph">{ICON_GLYPHS[id] ?? '◇'}</span></span>
}
/** Le cornici SVG dei pannelli sono state rimosse con la modalità SVG (18 novembre 2026): il pannello resta un contenitore. */
export function KitPanel({ children, className = '', asset: _asset, ...props }: HTMLAttributes<HTMLDivElement> & { asset?: string }) {
  return <div {...props} className={`pu-panel ${className}`} data-menu-artwork="css">{children}</div>
}
export function KitButton({ active = false, asset: _asset, artwork, children, className = '', type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; asset?: string; artwork?: 'previous' | 'next' | 'decrement' | 'increment' }) {
  const providedControl = artwork ? ({ previous: 'arrow-left', next: 'arrow-right', decrement: 'quantity-minus', increment: 'quantity-plus' } as const)[artwork] : undefined
  const symbol = artwork === 'previous' ? '←' : artwork === 'next' ? '→' : artwork === 'decrement' ? '−' : '+'
  const fallbackLabel = artwork === 'previous' ? 'Pagina precedente' : artwork === 'next' ? 'Pagina successiva' : artwork === 'decrement' ? 'Riduci quantità' : 'Aumenta quantità'
  return <button {...props} type={type} data-ui-artwork={artwork} data-menu-artwork="css" aria-label={props['aria-label'] ?? (artwork && children == null ? fallbackLabel : undefined)} className={`pu-button ${active ? 'is-active' : ''} ${artwork ? 'pu-artwork-button' : ''} ${className}`}>
    {artwork ? <>{providedControl ? <ProvidedArtwork id={providedControl} className="pu-provided-control" /> : <span className="pu-artwork-symbol" aria-hidden="true">{symbol}</span>}<span className="pu-artwork-label">{children ?? fallbackLabel}</span></>
      : children}
  </button>
}
export function TypeBadge({ type }: { type: TipoPokemon }) {
  return <span className="pu-type"><KitIcon id={TYPE_ICONS[type]} />{type}</span>
}
/**
 * Sigillo rotondo del tipo, senza testo visibile. Il nome resta per i lettori di schermo,
 * tranne dentro un comando che ha già un'etichetta accessibile (`labelled={false}`).
 */
/** Identificativo dell'emblema dipinto del tipo (lotto 3): `type-oscurita` per Oscurità. */
export const typeEmblemId = (type: TipoPokemon) => `type-${type.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('it-IT')}`

export function TypeSeal({ type, className = '', labelled = true }: { type: TipoPokemon; className?: string; labelled?: boolean }) {
  // Fase U6: con l'emblema dipinto il sigillo mostra l'illustrazione, altrimenti l'icona vettoriale.
  const emblem = hasGameArt(typeEmblemId(type))
  return <span className={`pu-type-seal ${className}${emblem ? ' has-emblem' : ''}`} data-type={type} title={type} aria-hidden={labelled ? undefined : true}>
    {emblem ? <GameArt id={typeEmblemId(type)} className="pu-type-emblem" /> : <KitIcon id={TYPE_ICONS[type]} />}
    {labelled && <span className="sr-only">{type}</span>}
  </span>
}
function CreatureImage({ speciesId, large }: { speciesId: number; large: boolean }) {
  const compact = !large ? providedPortraitSource(speciesId) : undefined
  const source = compact ?? `/sprites/front_sprites/${speciesId}.png`
  const [loadedSource, setLoadedSource] = useState<string | null>(null)
  const framing = getPortraitFraming(source)
  useEffect(() => {
    // Native SVG image load events are not consistently delivered by React.
    // Decode compact package PNGs and official full-body sprites independently.
    let current = true
    const resource = new Image()
    resource.src = assetUrl(source)
    resource.decode().then(() => {
      if (current) setLoadedSource(source)
    }).catch(() => {
      if (current) setLoadedSource(null)
    })
    return () => { current = false }
  }, [source])
  if (compact) return <img className="pu-creature-art pu-creature-compact" src={assetUrl(compact)} width={640} height={640} alt="" draggable={false}
    aria-hidden="true" data-species-id={speciesId} data-creature-source={compact} data-creature-loaded={loadedSource === source ? 'true' : undefined} />
  return <svg className="pu-creature-art" viewBox={framing.viewBox} preserveAspectRatio="xMidYMid meet"
    aria-hidden="true" focusable="false" data-species-id={speciesId} data-creature-source={source}
    data-creature-loaded={loadedSource === source ? 'true' : undefined}>
    <image key={source} href={assetUrl(source)} width={framing.width} height={framing.height} preserveAspectRatio="none" />
  </svg>
}
export function SpeciesPortrait({ speciesId, className = '', large = false }: { speciesId: number; className?: string; large?: boolean; selected?: boolean }) {
  return <span className={`pu-creature-portrait ${large ? 'is-large' : ''} ${className}`} data-menu-artwork="css" aria-hidden="true">
    <CreatureImage key={`${speciesId}:${large}`} speciesId={speciesId} large={large} />
  </span>
}
export function CreaturePortrait({ pokemon, ...props }: { pokemon: PokemonIstanza; className?: string; large?: boolean; selected?: boolean }) {
  return <SpeciesPortrait speciesId={pokemon.specieId} {...props} />
}
export function HealthBar({ pokemon }: { pokemon: PokemonIstanza }) {
  const maximum = calcolaHPMax(pokemon), value = Math.min(maximum, Math.max(0, pokemon.hp))
  const condition = value <= 0 ? 'ko' : value / maximum <= .25 ? 'low' : value / maximum <= .5 ? 'medium' : 'high'
  const healing = useHealPulse(value)
  return <div className="pu-health" data-health={condition} data-healing={healing || undefined}><progress aria-label={`HP di ${pokemon.nome}: ${value} su ${maximum}`} max={maximum} value={value} /><span>{value} / {maximum} HP</span></div>
}
export function PokemonMoves({ pokemon, detailed = false }: { pokemon: PokemonIstanza; detailed?: boolean }) {
  const definition = getPokemon(pokemon.specieId)
  return <div className="pu-moves">{definition?.mosse.filter(id => id > 0).map(id => {
    const move = getMossa(id); if (!move) return null
    const healing = èMossaCura(move)
    const facts = battleMoveFacts(move, pokemon.livello)
    const effect = facts.kind === 'attack' && !èMossaSoloStato(move) ? (() => { const dice = getMossaAlLivello(move, pokemon.livello); return `${dice.dadi}d6 ${dice.incremento >= 0 ? '+' : ''}${dice.incremento}` })() : facts.label
    const description = facts.kind === 'attack' && !èMossaSoloStato(move) ? 'Dadi e bonus al livello attuale · Il tipo del bersaglio modifica il danno' : facts.detail
    return <div className="pu-move" key={id} data-move-kind={healing ? 'heal' : èMossaSoloStato(move) ? 'status' : 'attack'}><div><strong>{move.nome}</strong><TypeBadge type={move.tipo} />{detailed && <small className="pu-move-tactical">{description}</small>}</div>
      <span className="pu-dice" role={healing ? 'note' : undefined} aria-label={description} title={description}>{effect}</span></div>
  })}</div>
}
export function PokemonHero({ pokemon, className = '', children }: { pokemon: PokemonIstanza; className?: string; children?: ReactNode }) {
  const definition = getPokemon(pokemon.specieId)
  return <section className={`pu-hero ${className}`} aria-label={`Arkamon selezionato: ${pokemon.nome}`}>
    <span className="pu-species-number">ARKA / {String(pokemon.specieId).padStart(3, '0')}</span>
    <CreaturePortrait pokemon={pokemon} large />
    <div className="pu-hero-caption"><span className="pu-kicker">Compagno selezionato · Lv. {pokemon.livello}</span><h2>{pokemon.nome}</h2>
      {definition && <TypeBadge type={definition.tipo} />}{pokemon.hp <= 0 ? <span className="pu-status-pill">KO</span> : pokemon.stato ? <span className="pu-status-pill">{pokemon.stato.tipo}</span> : null}
    </div>{children}
  </section>
}
export function formatNumber(value: number) { return value.toLocaleString('it-IT') }
