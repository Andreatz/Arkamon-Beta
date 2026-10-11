import { useState, type ButtonHTMLAttributes, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react'
import type { PokemonIstanza, TipoPokemon } from '@/types'
import { getMossa, getPokemon } from '@/data'
import { calcolaHPMax, getMossaAlLivello } from '@/engine/battleEngine'
import { getArkamonAnimationAsset } from '@/components/arkamon/arkamonAnimationManifest'
import { assetUrl } from '@/utils/assetUrl'
import './player-ui.css'

export const TYPE_ICONS: Record<TipoPokemon, string> = {
  Normale: 'type-normal', Elettro: 'type-electric', Fuoco: 'type-fire', Terra: 'type-earth',
  Acqua: 'type-water', Erba: 'type-grass', Oscurità: 'type-dark', Psico: 'type-psychic',
}
export const ITEM_ICONS: Record<string, string> = {
  potion: 'item-potion', 'super-potion': 'item-superpotion', revive: 'item-revive',
  antidote: 'item-antidote', masterball: 'item-sphere', 'paralysis-heal': 'type-electric', awakening: 'type-psychic',
}
export function kitAsset(id: string): string { return assetUrl(`/ui/player-kit/${id}.svg`) }
export function KitIcon({ id, className = '' }: { id: string; className?: string }) {
  return <span className={`pu-kit-icon ${className}`} aria-hidden="true"><img src={kitAsset(id)} alt="" draggable={false} /></span>
}
const slices: Record<string, number> = { 'panel-wide': 163, 'panel-medium': 97, 'button-primary': 44,
  'button-default': 48, 'card-default': 61, 'card-selected-violet': 58, 'card-selected-cyan': 56,
  'slot-default': 62, 'slot-selected': 60, 'slot-cyan': 62, 'card-portrait': 99 }
export function KitFrame({ id = 'panel-medium' }: { id?: string }) {
  const style: CSSProperties = { borderImageSource: `url("${kitAsset(id)}")`, borderImageSlice: `${slices[id] ?? 61} fill` }
  return <span className="pu-frame" style={style} data-kit={id} aria-hidden="true" />
}
export function KitPanel({ children, className = '', asset = 'panel-medium', ...props }: HTMLAttributes<HTMLDivElement> & { asset?: string }) {
  return <div {...props} className={`pu-panel ${className}`}><KitFrame id={asset} />{children}</div>
}
export function KitButton({ active = false, asset, children, className = '', type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; asset?: string }) {
  return <button {...props} type={type} className={`pu-button ${active ? 'is-active' : ''} ${className}`}><KitFrame id={asset ?? (active ? 'button-primary' : 'button-default')} />{children}</button>
}
export function TypeBadge({ type }: { type: TipoPokemon }) {
  return <span className="pu-type"><KitIcon id={TYPE_ICONS[type]} />{type}</span>
}
function CreatureImage({ speciesId }: { speciesId: number }) {
  const idle = getArkamonAnimationAsset(speciesId, 'front', 'idle')
  const poster = idle ? idle.src.replace(/idle\.webp$/, 'idle-poster.webp') : `/sprites/front_sprites/${speciesId}.png`
  const [fallback, setFallback] = useState(false)
  return <img className="pu-creature-art" src={assetUrl(fallback ? `/sprites/front_sprites/${speciesId}.png` : poster)}
    alt="" draggable={false} onError={() => { if (!fallback) setFallback(true) }} />
}
export function SpeciesPortrait({ speciesId, className = '', large = false, selected = false }: { speciesId: number; className?: string; large?: boolean; selected?: boolean }) {
  return <span className={`pu-creature-portrait ${large ? 'is-large' : ''} ${className}`} aria-hidden="true">
    <img className="pu-creature-circle" src={kitAsset(selected ? 'circle-selected' : 'circle-default')} alt="" />
    <CreatureImage key={speciesId} speciesId={speciesId} />
  </span>
}
export function CreaturePortrait({ pokemon, ...props }: { pokemon: PokemonIstanza; className?: string; large?: boolean; selected?: boolean }) {
  return <SpeciesPortrait speciesId={pokemon.specieId} {...props} />
}
export function HealthBar({ pokemon }: { pokemon: PokemonIstanza }) {
  const maximum = calcolaHPMax(pokemon), value = Math.min(maximum, Math.max(0, pokemon.hp))
  return <div className="pu-health"><progress aria-label={`HP di ${pokemon.nome}: ${value} su ${maximum}`} max={maximum} value={value} /><span>{value} / {maximum} HP</span></div>
}
export function PokemonMoves({ pokemon }: { pokemon: PokemonIstanza }) {
  const definition = getPokemon(pokemon.specieId)
  return <div className="pu-moves">{definition?.mosse.filter(id => id > 0).map(id => {
    const move = getMossa(id); if (!move) return null
    const dice = getMossaAlLivello(move, pokemon.livello)
    return <div className="pu-move" key={id}><div><strong>{move.nome}</strong><TypeBadge type={move.tipo} /></div>
      <span className="pu-dice">{move.soloStato ? 'Stato' : `${dice.dadi}d6 ${dice.incremento >= 0 ? '+' : ''}${dice.incremento}`}</span></div>
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
