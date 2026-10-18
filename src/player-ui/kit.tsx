import { useEffect, useState, type ButtonHTMLAttributes, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react'
import type { PokemonIstanza, TipoPokemon } from '@/types'
import { getMossa, getPokemon } from '@/data'
import { calcolaHPMax, getMossaAlLivello, èMossaCura, èMossaSoloStato } from '@/engine/battleEngine'
import { assetUrl } from '@/utils/assetUrl'
import { getPortraitFraming } from './portraitFraming'
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
  return <span className="pu-frame" style={style} data-kit={id} data-ui-skin-slot="frame" aria-hidden="true" />
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
  const source = `/sprites/front_sprites/${speciesId}.png`
  const [loadedSource, setLoadedSource] = useState<string | null>(null)
  const framing = getPortraitFraming(source)
  useEffect(() => {
    // Native SVG image load events are not consistently delivered by React.
    // Decode the official front sprite; framing keeps all of its visible pixels.
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
  return <svg className="pu-creature-art" viewBox={framing.viewBox} preserveAspectRatio="xMidYMid meet"
    aria-hidden="true" focusable="false" data-species-id={speciesId} data-creature-source={source}
    data-creature-loaded={loadedSource === source ? 'true' : undefined}>
    <image key={source} href={assetUrl(source)} width={framing.width} height={framing.height} preserveAspectRatio="none" />
  </svg>
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
  const condition = value <= 0 ? 'ko' : value / maximum <= .25 ? 'low' : value / maximum <= .5 ? 'medium' : 'high'
  return <div className="pu-health" data-health={condition}><progress aria-label={`HP di ${pokemon.nome}: ${value} su ${maximum}`} max={maximum} value={value} /><span>{value} / {maximum} HP</span></div>
}
export function PokemonMoves({ pokemon, detailed = false }: { pokemon: PokemonIstanza; detailed?: boolean }) {
  const definition = getPokemon(pokemon.specieId)
  return <div className="pu-moves">{definition?.mosse.filter(id => id > 0).map(id => {
    const move = getMossa(id); if (!move) return null
    const dice = getMossaAlLivello(move, pokemon.livello)
    const healing = èMossaCura(move)
    const effect = healing ? `Cura ${move.valoreEffetto ?? 0}${move.effetto === 'CURA_PCT' ? '%' : ' HP'}`
      : èMossaSoloStato(move) ? 'Stato' : `${dice.dadi}d6 ${dice.incremento >= 0 ? '+' : ''}${dice.incremento}`
    const statusName: Record<string, string> = { PARALISI: 'Paralisi', PARALIZZATO: 'Paralisi', VELENO: 'Veleno', SONNO: 'Sonno', CONFUSIONE: 'Confusione' }
    const description = healing ? `${effect}${move.effetto === 'CURA_PCT' ? ' degli HP massimi' : ''} e rimuove veleno e paralisi`
      : èMossaSoloStato(move) ? `${statusName[move.effetto ?? ''] ?? 'Stato alterato'} · Nessun danno e nessuna Suprema`
        : 'Dadi e bonus al livello attuale · Il tipo del bersaglio modifica il danno'
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
