import { getAllenatore, getPokemon } from '@/data'
import { calcolaHPMax } from '@/engine/battleEngine'
import type { PokemonIstanza, StatoBattaglia } from '@/types'
import { getShopItem } from './catalog'

export interface ItemEffectResult {
  ok: boolean
  message: string
  pokemon?: PokemonIstanza
  recoveredHp?: number
  possibleRecovery?: readonly [minimum: number, maximum: number]
}

export function battleBoostBlock(battle: StatoBattaglia | null, stat: 'speed' | 'damage', challenge: boolean): string | undefined {
  if (!battle) return 'Usa questo potenziamento durante una sfida ordinaria.'
  const trainer = battle.allenatoreId === undefined ? undefined : getAllenatore(battle.allenatoreId)
  const specialTrainer = trainer && (
    trainer.tipo === 'Capopalestra' || trainer.tipo === 'Superquattro' || trainer.tipo === 'Campione'
    || trainer.luogo === 'Nascondiglio' || trainer.livelliRivale || /\b(?:rivale|mascherat[oi]|seguac[ei]|team)\b/i.test(trainer.nome)
  )
  if (challenge || battle.leagueBattle || specialTrainer) {
    return 'Potenziamento riservato agli scontri ordinari.'
  }
  if (battle.playerBoosts?.[stat]) return 'Questo potenziamento è già attivo per la sfida in corso.'
}

/** Effetto puro: lo store deve verificare il possesso e consumare l'oggetto soltanto se ok. */
export function resolveItemEffect(pokemon: PokemonIstanza, itemId: unknown, roll?: number): ItemEffectResult {
  const item = getShopItem(itemId)
  if (!item) return { ok: false, message: 'Questo oggetto non è disponibile.' }
  if (!getPokemon(pokemon.specieId) || !Number.isInteger(pokemon.livello) || pokemon.livello < 5 || pokemon.livello > 100
    || !Number.isFinite(pokemon.hp) || pokemon.hp < 0) return { ok: false, message: 'Questo Arkamon non ha dati validi.' }
  if (item.effect.kind === 'capture') return { ok: false, message: 'Usa questa sfera durante una battaglia selvatica.' }
  if (item.effect.kind === 'boost') return { ok: false, message: 'Usa questo potenziamento durante una sfida ordinaria.' }
  if (item.effect.kind === 'transport') return { ok: false, message: 'Il mezzo è un oggetto di viaggio.' }
  if (item.effect.kind === 'retry-encounter') return { ok: false, message: 'Usa il Profumo speciale presso un cespuglio già visitato.' }
  const hpMax = calcolaHPMax(pokemon)
  if (pokemon.hp > hpMax) return { ok: false, message: 'Gli HP di questo Arkamon superano il massimo.' }
  if (item.effect.kind === 'revive') {
    if (pokemon.hp > 0) return { ok: false, message: 'Il Rianimatore si usa soltanto su un Arkamon KO.' }
    const hp = Math.max(1, Math.ceil(hpMax * item.effect.fraction))
    return { ok: true, message: `${pokemon.nome} torna in squadra con ${hp} HP.`, pokemon: { ...pokemon, hp }, recoveredHp: hp }
  }
  if (pokemon.hp === 0) return { ok: false, message: 'Questo Arkamon è KO: serve un Rianimatore.' }
  if (item.effect.kind === 'heal') {
    if (pokemon.hp >= hpMax) return { ok: false, message: `${pokemon.nome} ha già tutti gli HP.` }
    const amount = item.effect.amount
    const recovered = amount === 'full' ? hpMax : amount[0] + Math.floor((amount[1] - amount[0] + 1) * (roll ?? 0))
    const hp = Math.min(hpMax, pokemon.hp + recovered)
    if (roll === undefined && amount !== 'full') {
      const maximum = Math.min(hpMax - pokemon.hp, amount[1])
      const minimum = hp - pokemon.hp
      if (maximum > minimum) return { ok: true, message: `${pokemon.nome} può recuperare da ${minimum} a ${maximum} HP.`,
        pokemon: { ...pokemon, hp }, recoveredHp: minimum, possibleRecovery: [minimum, maximum] }
    }
    return { ok: true, message: `${pokemon.nome} recupera ${hp - pokemon.hp} HP.`, pokemon: { ...pokemon, hp }, recoveredHp: hp - pokemon.hp }
  }
  if (!pokemon.stato || (item.effect.status && pokemon.stato.tipo !== item.effect.status)) {
    return { ok: false, message: item.effect.status
      ? `${pokemon.nome} non ha lo status ${item.effect.status}.`
      : `${pokemon.nome} non ha uno status alterato.` }
  }
  const { stato: _status, ...cured } = pokemon
  return { ok: true, message: `${pokemon.nome} è stato curato dallo status ${pokemon.stato.tipo}.`, pokemon: cured }
}
