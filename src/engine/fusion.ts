import { getPokemon, POKEMON_BASE } from '@data/index'
import type { PokemonIstanza, StatoGiocatore } from '@/types'
import { calcolaHPMax } from './battleEngine'

/**
 * Fusione di Axolux (decisione del 18 novembre 2026).
 *
 * Axolux non ha mosse e non si evolve: appena nella squadra o nel deposito dello stesso
 * giocatore c'è un Arkamon compatibile, Axolux sparisce e il compatibile diventa la sua
 * forma «(luce)» allo stesso livello. Con più compatibili se ne sceglie uno a caso.
 * Se non ce n'è nessuno, Axolux aspetta e si fonde appena ne arriva uno.
 */
export const AXOLUX_ID = 130

const LUCE_SUFFIX = ' (luce)'

/** Specie compatibile (qualsiasi stadio) → id della forma «(luce)», ricavato dai nomi del Database. */
export const FUSIONI_AXOLUX: ReadonlyMap<number, number> = (() => {
  const luceByBaseName = new Map(POKEMON_BASE
    .filter(species => species.nome.endsWith(LUCE_SUFFIX))
    .map(species => [species.nome.slice(0, -LUCE_SUFFIX.length), species.id] as const))
  return new Map(POKEMON_BASE
    .filter(species => !species.nome.endsWith(LUCE_SUFFIX) && luceByBaseName.has(species.nome))
    .map(species => [species.id, luceByBaseName.get(species.nome)!] as const))
})()

export function èCompatibileConAxolux(specieId: number): boolean {
  return FUSIONI_AXOLUX.has(specieId)
}

export interface EsitoFusione {
  giocatore: StatoGiocatore
  /** Una voce per ogni fusione avvenuta, nell'ordine. */
  fusioni: { axolux: PokemonIstanza; prima: PokemonIstanza; dopo: PokemonIstanza }[]
}

type Posizione = { dove: 'squadra'; indice: number } | { dove: 'deposito'; slot: string }

function elenca(giocatore: StatoGiocatore): { pokemon: PokemonIstanza; posizione: Posizione }[] {
  return [
    ...giocatore.squadra.map((pokemon, indice) => ({ pokemon, posizione: { dove: 'squadra', indice } as Posizione })),
    ...Object.entries(giocatore.deposito)
      .sort(([a], [b]) => a.localeCompare(b, 'it', { numeric: true }))
      .map(([slot, pokemon]) => ({ pokemon, posizione: { dove: 'deposito', slot } as Posizione })),
  ]
}

/** Il compatibile diventa la forma «(luce)»: stesso livello, stessa proporzione di HP, stato conservato. */
export function trasformaInLuce(pokemon: PokemonIstanza): PokemonIstanza {
  const luceId = FUSIONI_AXOLUX.get(pokemon.specieId)
  const luce = luceId ? getPokemon(luceId) : undefined
  if (!luce) return pokemon
  const specieAttuale = getPokemon(pokemon.specieId)
  const hpMaxPrima = calcolaHPMax(pokemon)
  // Un soprannome scelto dal giocatore resta; il nome della specie diventa quello della forma «(luce)».
  const nome = !specieAttuale || pokemon.nome === specieAttuale.nome ? luce.nome : pokemon.nome
  const dopo: PokemonIstanza = { ...pokemon, specieId: luce.id, nome }
  const hpMaxDopo = calcolaHPMax(dopo)
  dopo.hp = pokemon.hp <= 0 ? 0 : Math.max(1, Math.round(pokemon.hp / Math.max(1, hpMaxPrima) * hpMaxDopo))
  return dopo
}

/**
 * Applica tutte le fusioni possibili per un giocatore. Funzione pura: il generatore
 * casuale sceglie il compatibile quando ce n'è più di uno.
 */
export function applicaFusioniAxolux(
  giocatore: StatoGiocatore,
  rng: () => number = Math.random,
  /** Istanze da non trasformare ora (per esempio con un'evoluzione in attesa): si fonderanno la volta dopo. */
  escludi: ReadonlySet<string> = new Set(),
): EsitoFusione {
  let corrente = giocatore
  const fusioni: EsitoFusione['fusioni'] = []
  for (;;) {
    const tutti = elenca(corrente)
    const axolux = tutti.find(entry => entry.pokemon.specieId === AXOLUX_ID)
    const compatibili = tutti.filter(entry => èCompatibileConAxolux(entry.pokemon.specieId) && !escludi.has(entry.pokemon.istanzaId))
    if (!axolux || compatibili.length === 0) break
    const scelto = compatibili[Math.min(compatibili.length - 1, Math.floor(rng() * compatibili.length))]
    const dopo = trasformaInLuce(scelto.pokemon)
    let squadra = [...corrente.squadra]
    const deposito = { ...corrente.deposito }
    if (scelto.posizione.dove === 'squadra') squadra[scelto.posizione.indice] = dopo
    else deposito[scelto.posizione.slot] = dopo
    if (axolux.posizione.dove === 'squadra') {
      const indice = axolux.posizione.indice
      if (squadra.length === 1 && scelto.posizione.dove === 'deposito') {
        // Axolux era l'unico in squadra: la forma «(luce)» prende il suo posto, la squadra non resta vuota.
        squadra = [dopo]
        delete deposito[scelto.posizione.slot]
      } else squadra = squadra.filter((_, i) => i !== indice)
    } else delete deposito[axolux.posizione.slot]
    corrente = { ...corrente, squadra, deposito }
    fusioni.push({ axolux: axolux.pokemon, prima: scelto.pokemon, dopo })
  }
  return { giocatore: corrente, fusioni }
}

/** Testo per l'avviso: «Axolux si è fuso con Nyxclaw: ora è Nyxclaw (luce)!» */
export function messaggioFusione(fusione: EsitoFusione['fusioni'][number]): string {
  return `${fusione.axolux.nome} si è fuso con ${fusione.prima.nome}: ora è ${fusione.dopo.nome}!`
}
