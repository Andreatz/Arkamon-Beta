/**
 * Battle Engine - Logica pura del combattimento.
 *
 * Porting fedele di Mod_Battle_Engine.bas. Questo modulo è SENZA
 * dipendenze UI: prende uno StatoBattaglia + azione → restituisce un
 * RisultatoMossa che la UI consumerà per animazioni e log.
 *
 * Tutte le costanti di bilanciamento sono raccolte in `BATTLE_CONSTANTS`
 * per facilità di tuning.
 */
import type {
  StatoBattaglia,
  PokemonIstanza,
  MossaDef,
  RisultatoMossa,
  Lato,
} from '@/types'
import { getPokemon, getMossa, efficaciaTipo, CRESCITA_HP } from '@data/index'

// =============================================================
// COSTANTI DI BILANCIAMENTO (tunabili)
// =============================================================

export const BATTLE_CONSTANTS = {
  STAB_MULTIPLIER: 1.5,
  /** Soglia base di cattura: pokeball semplice */
  CATTURA_SOGLIA_BASE: 0.3,
  /** Bonus per HP residuo basso del bersaglio (0..1) */
  CATTURA_BONUS_HP_BASSO: 0.4,
  /** XP base assegnato alla vittoria, scalato col livello del nemico */
  XP_BASE_VITTORIA: 50,
} as const

// =============================================================
// CALCOLI DI BASE
// =============================================================

/**
 * Calcola gli HP massimi di un'istanza in base alla sua specie e livello.
 * Replica `Mod_Utilities.CalcolaHPMax`.
 */
export function calcolaHPMax(istanza: PokemonIstanza): number {
  const specie = getPokemon(istanza.specieId)
  if (!specie) return 1
  const crescita = CRESCITA_HP[specie.categoria] ?? 1
  // Formula: HP_Base + (livello - 1) * crescita
  return Math.floor(specie.hpBase + (istanza.livello - 1) * crescita)
}

/**
 * Recupera i parametri (dadi e incremento) di una mossa al livello dato.
 * Se il livello esatto non esiste, prende il livello più vicino disponibile.
 * Replica `Mod_Utilities.OttieniParametriMossaAlLivello`.
 */
export function getMossaAlLivello(
  mossa: MossaDef,
  livello: number
): { dadi: number; incremento: number } {
  const livStr = String(livello)
  let dadi = mossa.dadiPerLivello[livStr]
  let incremento = mossa.incrementoPerLivello[livStr]

  // Fallback: cerca il livello più vicino verso il basso
  if (dadi === undefined || incremento === undefined) {
    for (let l = livello; l >= 5; l--) {
      if (dadi === undefined) dadi = mossa.dadiPerLivello[String(l)]
      if (incremento === undefined) incremento = mossa.incrementoPerLivello[String(l)]
      if (dadi !== undefined && incremento !== undefined) break
    }
  }
  return { dadi: dadi ?? 1, incremento: incremento ?? 0 }
}

/** Tira N dadi a 6 facce. */
export function tiraDadi(numero: number): number[] {
  return Array.from({ length: numero }, () => Math.floor(Math.random() * 6) + 1)
}

// =============================================================
// CALCOLO DEL DANNO
// =============================================================

/**
 * Calcola il danno di una mossa secondo le regole di Arkamon.
 * Replica la logica di `Mod_Battle_Engine.EseguiAttacco` ma in modo PURO:
 * non modifica nulla, ritorna solo il risultato. Lo stato sarà aggiornato
 * dal chiamante (lo store).
 */
export function calcolaDanno(
  attaccante: PokemonIstanza,
  difensore: PokemonIstanza,
  numeroMossa: 0 | 1 | 2
): RisultatoMossa | null {
  const specieAtt = getPokemon(attaccante.specieId)
  const specieDif = getPokemon(difensore.specieId)
  if (!specieAtt || !specieDif) return null

  const mossaId = specieAtt.mosse[numeroMossa]
  if (!mossaId) return null

  const mossa = getMossa(mossaId)
  if (!mossa) return null

  // 1. Parametri della mossa al livello dell'attaccante
  const { dadi, incremento } = getMossaAlLivello(mossa, attaccante.livello)

  // 2. Tiro dadi
  const tiri = tiraDadi(dadi)
  const sommaDadi = tiri.reduce((a, b) => a + b, 0)
  const dannoBase = sommaDadi + incremento

  // 3. STAB (Same Type Attack Bonus)
  const stab = mossa.tipo === specieAtt.tipo
  const moltStab = stab ? BATTLE_CONSTANTS.STAB_MULTIPLIER : 1

  // 4. Efficacia di tipo
  const moltTipo = efficaciaTipo(mossa.tipo, specieDif.tipo)

  // 5. Danno finale
  const dannoFinale = Math.max(1, Math.floor(dannoBase * moltStab * moltTipo))

  // 6. Messaggi
  const messaggi: string[] = [`${attaccante.nome} usa ${mossa.nome}!`]
  if (stab) messaggi.push('(STAB)')
  if (moltTipo > 1) messaggi.push("È superefficace!")
  else if (moltTipo < 1 && moltTipo > 0) messaggi.push('Non è molto efficace...')
  else if (moltTipo === 0) messaggi.push('Non ha effetto!')
  messaggi.push(`${difensore.nome} subisce ${dannoFinale} danni.`)

  const difensoreSvenuto = difensore.hp - dannoFinale <= 0
  if (difensoreSvenuto) messaggi.push(`${difensore.nome} non può più combattere!`)

  return {
    attaccante,
    difensore,
    mossa,
    numDadi: dadi,
    incremento,
    tiriDado: tiri,
    dannoBase,
    moltiplicatoreTipo: moltTipo,
    stab,
    dannoFinale,
    difensoreSvenuto,
    messaggi,
  }
}

// =============================================================
// CATTURA
// =============================================================

/**
 * Tenta la cattura di un Pokémon selvatico.
 * Replica la logica VBA: probabilità basata su tasso di cattura della specie
 * + bonus per HP residuo basso.
 */
export function tentaCattura(bersaglio: PokemonIstanza): {
  successo: boolean
  soglia: number
  tiro: number
  messaggio: string
} {
  const specie = getPokemon(bersaglio.specieId)
  if (!specie) {
    return { successo: false, soglia: 0, tiro: 0, messaggio: 'Errore: specie sconosciuta.' }
  }

  const hpMax = calcolaHPMax(bersaglio)
  const hpRatio = bersaglio.hp / hpMax

  // Tasso base normalizzato 0..1: tassoCattura va da 0 a 5
  const tassoBase = specie.tassoCattura / 5

  // Bonus per HP basso: più è ferito, più è facile catturare
  const bonusHp = (1 - hpRatio) * BATTLE_CONSTANTS.CATTURA_BONUS_HP_BASSO

  const soglia = Math.min(0.95, tassoBase * 0.7 + bonusHp + 0.1)
  const tiro = Math.random()
  const successo = tiro < soglia

  const messaggio = successo
    ? `${bersaglio.nome} è stato catturato!`
    : `${bersaglio.nome} è scappato dalla cattura!`

  return { successo, soglia, tiro, messaggio }
}

// =============================================================
// AI (per battaglie NPC)
// =============================================================

/**
 * Sceglie la mossa migliore per un'IA NPC.
 * Replica `Mod_Utilities.ScegliMossaIA`: valuta ciascuna mossa per danno
 * atteso, STAB, efficacia di tipo, e logica di cura.
 */
export function scegliMossaIA(
  attaccante: PokemonIstanza,
  difensore: PokemonIstanza
): 0 | 1 | 2 {
  const specie = getPokemon(attaccante.specieId)
  if (!specie) return 0
  const specieDif = getPokemon(difensore.specieId)
  if (!specieDif) return 0

  const hpMax = calcolaHPMax(attaccante)
  const hpRatio = attaccante.hp / hpMax

  let migliore: 0 | 1 | 2 = 0
  let punteggioMax = -Infinity

  for (let i = 0 as 0 | 1 | 2; i < 3; i = (i + 1) as 0 | 1 | 2) {
    const mossaId = specie.mosse[i]
    if (!mossaId) continue
    const mossa = getMossa(mossaId)
    if (!mossa) continue

    const { dadi, incremento } = getMossaAlLivello(mossa, attaccante.livello)
    let punteggio = dadi * 3.5 + incremento // valore atteso del tiro

    // STAB
    if (mossa.tipo === specie.tipo) punteggio *= BATTLE_CONSTANTS.STAB_MULTIPLIER

    // Efficacia di tipo
    punteggio *= efficaciaTipo(mossa.tipo, specieDif.tipo)

    // Cura: priorità altissima se HP basso
    if (mossa.effetto === 'CURA') {
      punteggio = hpRatio <= 0.2 ? 100 : -1
    }

    if (punteggio > punteggioMax) {
      punteggioMax = punteggio
      migliore = i
      if (i + 1 >= 3) break
    }
    if (i === 2) break
  }

  return migliore
}

// =============================================================
// LIVELLI ED EVOLUZIONI
// =============================================================

/** Tabella di XP necessario per livellare. Modifica per cambiare la curva. */
export function xpRichiestoPerLivello(livello: number): number {
  return Math.floor(20 * Math.pow(livello, 1.3))
}

/**
 * Applica XP a un'istanza, gestendo level-up multipli ed evoluzioni.
 * Ritorna i livelli guadagnati e l'eventuale evoluzione pendente.
 */
export function applicaXP(
  istanza: PokemonIstanza,
  xp: number
): {
  istanza: PokemonIstanza
  livelliGuadagnati: number
  evoluzionePendente: { nuovaSpecieId: number } | null
} {
  let nuova = { ...istanza, xp: istanza.xp + xp }
  let livelliGuadagnati = 0
  let evoluzionePendente: { nuovaSpecieId: number } | null = null

  while (nuova.xp >= xpRichiestoPerLivello(nuova.livello)) {
    nuova.xp -= xpRichiestoPerLivello(nuova.livello)
    nuova.livello += 1
    livelliGuadagnati += 1

    // Cura totale al level-up (come nei pokemon classici? scegli tu)
    nuova.hp = calcolaHPMax(nuova)

    // Verifica evoluzione
    const specie = getPokemon(nuova.specieId)
    if (
      specie?.livelloEvoluzione &&
      specie.evoluzioneId &&
      nuova.livello >= specie.livelloEvoluzione
    ) {
      evoluzionePendente = { nuovaSpecieId: specie.evoluzioneId }
      break // Si evolve al prossimo level-up
    }
  }

  return { istanza: nuova, livelliGuadagnati, evoluzionePendente }
}

/** XP guadagnato sconfiggendo un nemico */
export function xpGuadagnato(nemico: PokemonIstanza): number {
  return Math.floor(BATTLE_CONSTANTS.XP_BASE_VITTORIA * (nemico.livello / 5))
}

// =============================================================
// HELPER DI BATTAGLIA
// =============================================================

/** Determina chi attacca per primo (priorità A; espandibile a velocità) */
export function determinaIniziativa(_battaglia: StatoBattaglia): Lato {
  return 'A'
}

/** True se tutti i pokémon di un lato sono KO */
export function squadraSconfitta(squadra: PokemonIstanza[] | undefined): boolean {
  if (!squadra || squadra.length === 0) return false
  return squadra.every((p) => p.hp <= 0)
}
