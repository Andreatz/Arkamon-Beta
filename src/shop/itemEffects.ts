import { getPokemon } from '@/data'
import { calcolaHPMax, rollD6 } from '@/engine/battleEngine'
import type { PokemonIstanza } from '@/types'
import { getShopItem, type ShopItemEffect } from './catalog'

export interface ItemEffectResult { ok: boolean; message: string; pokemon?: PokemonIstanza; recoveredHp?: number }

type HealEffect = Extract<ShopItemEffect, { kind: 'heal' }>

/** HP curati: frazione, valore fisso o base + dadi. Senza rng (anteprima) vale il minimo. */
export function healAmount(effect: HealEffect, hpMax: number, rng?: () => number): number {
  if (effect.fraction !== undefined) return Math.max(1, Math.ceil(hpMax * effect.fraction))
  if (effect.fixed !== undefined) return effect.fixed
  const dice = effect.dice ?? 0
  return (effect.base ?? 0) + (rng ? rollD6(dice, rng) : dice)
}

export function healRangeLabel(effect: HealEffect): string | null {
  if (!effect.dice) return null
  return `${(effect.base ?? 0) + effect.dice}–${(effect.base ?? 0) + effect.dice * 6}`
}

/**
 * Effetto puro: lo store deve verificare il possesso e consumare l'oggetto soltanto se ok.
 * `rng` serve solo alle cure con dadi: senza, l'anteprima mostra il minimo e l'intervallo.
 */
export function resolveItemEffect(pokemon: PokemonIstanza, itemId: unknown, rng?: () => number): ItemEffectResult {
  const item = getShopItem(itemId)
  if (!item) return { ok: false, message: 'Questo oggetto non è disponibile.' }
  if (!getPokemon(pokemon.specieId) || !Number.isInteger(pokemon.livello) || pokemon.livello < 5 || pokemon.livello > 100
    || !Number.isFinite(pokemon.hp) || pokemon.hp < 0) return { ok: false, message: 'Questo Arkamon non ha dati validi.' }
  const effect = item.effect
  if (effect.kind === 'capture') return { ok: false, message: `${item.name}: si usa durante una battaglia selvatica, dal comando di cattura.` }
  if (effect.kind === 'boost') return { ok: false, message: `${item.name}: si usa in battaglia, al posto della mossa.` }
  if (effect.kind === 'scent') return { ok: false, message: 'Il Profumo speciale si usa su un cespuglio già esplorato.' }
  if (effect.kind === 'vehicle') return { ok: false, message: `${item.name}: oggetto chiave, è sempre attivo quando lo possiedi.` }
  const hpMax = calcolaHPMax(pokemon)
  if (pokemon.hp > hpMax) return { ok: false, message: 'Gli HP di questo Arkamon superano il massimo.' }
  if (effect.kind === 'revive') {
    if (pokemon.hp > 0) return { ok: false, message: 'Il Rianimatore si usa soltanto su un Arkamon KO.' }
    const hp = Math.max(1, Math.ceil(hpMax * effect.fraction))
    return { ok: true, message: `${pokemon.nome} torna in squadra con ${hp} HP.`, pokemon: { ...pokemon, hp }, recoveredHp: hp }
  }
  if (pokemon.hp === 0) return { ok: false, message: 'Questo Arkamon è KO: serve un Rianimatore.' }
  if (effect.kind === 'heal') {
    if (pokemon.hp >= hpMax) return { ok: false, message: `${pokemon.nome} ha già tutti gli HP.` }
    const hp = Math.min(hpMax, pokemon.hp + healAmount(effect, hpMax, rng))
    const range = !rng ? healRangeLabel(effect) : null
    return { ok: true, message: range ? `${pokemon.nome} recupera da ${range} HP (tiro al momento dell’uso).` : `${pokemon.nome} recupera ${hp - pokemon.hp} HP.`,
      pokemon: { ...pokemon, hp }, recoveredHp: hp - pokemon.hp }
  }
  if (effect.status === 'tutti') {
    if (!pokemon.stato) return { ok: false, message: `${pokemon.nome} non ha status da curare.` }
    const { stato, ...cured } = pokemon
    return { ok: true, message: `${pokemon.nome} è stato curato dallo status ${stato.tipo}.`, pokemon: cured }
  }
  if (pokemon.stato?.tipo !== effect.status) return { ok: false, message: `${pokemon.nome} non ha lo status ${effect.status}.` }
  const { stato: _status, ...cured } = pokemon
  return { ok: true, message: `${pokemon.nome} è stato curato dallo status ${effect.status}.`, pokemon: cured }
}
