/**
 * Battle Engine - Logica pura del combattimento.
 *
 * Porting fedele di Mod_Battle_Engine.bas + Mod_Utilities.bas.
 * Senza dipendenze UI: prende stato + azione → restituisce risultato.
 */
import captureTable from '@/data/captureTable.json'
import type {
  PokemonIstanza,
  MossaDef,
  RisultatoMossa,
  Lato,
  StatoAlterato,
  Stato,
  UsiMosse,
} from '@/types'
import { getPokemon, getMossa, efficaciaTipo, CRESCITA_HP } from '@data/index'

// =============================================================
// STATI ALTERATI (Fase B della roadmap)
// =============================================================

/** Durata iniziale (turni) per ciascuno stato. -1 = indefinita. */
export const DURATA_STATO: Record<StatoAlterato, number> = {
  Paralizzato: -1,
  Confuso: 2,
  Addormentato: 3,
  Avvelenato: -1,
}

/**
 * Mappa effetto di mossa → stato applicato.
 * Le chiavi corrispondono a `MossaDef.effetto` (campo già presente).
 */
const EFFETTO_TO_STATO: Record<string, StatoAlterato> = {
  PARALISI: 'Paralizzato',
  PARALIZZATO: 'Paralizzato',
  CONFUSIONE: 'Confuso',
  SONNO: 'Addormentato',
  VELENO: 'Avvelenato',
}

/** Percentuale del prossimo tick di veleno, condivisa con la sua descrizione nella UI. */
export function percentualeProssimoTickVeleno(stato: Stato): number {
  const turniTrascorsi = typeof stato.turniTrascorsi === 'number' && Number.isFinite(stato.turniTrascorsi)
    ? Math.max(0, Math.floor(stato.turniTrascorsi)) : 0
  return (turniTrascorsi + 1) * 10
}

export const percentualeVelenoProssimoTurno = percentualeProssimoTickVeleno

/** Applica uno stato a un'istanza (sovrascrive eventuale stato precedente). */
export function applicaStato(
  istanza: PokemonIstanza,
  tipo: StatoAlterato
): PokemonIstanza {
  return {
    ...istanza,
    stato: {
      tipo,
      turniRimanenti: DURATA_STATO[tipo],
      ...(tipo === 'Avvelenato' ? { turniTrascorsi: 0 } : {}),
    },
  }
}

/**
 * Tenta di applicare uno stato a un'istanza, rispettando le immunità.
 *
 * Regola BR.3: un Pokémon può avere un solo stato alterato alla volta.
 * Se ne ha già uno (qualsiasi), il nuovo stato non viene applicato.
 *
 * @returns `{ applicato: true }` se lo stato può essere applicato;
 *          `{ applicato: false, messaggio }` se bloccato da immunità.
 */
export function tentaApplicaStato(
  istanza: PokemonIstanza,
  _tipo: StatoAlterato
): { applicato: boolean; messaggio?: string } {
  if ((istanza.immunitaStati ?? 0) > 0) {
    return { applicato: false, messaggio: `${istanza.nome} è protetto dagli stati alterati!` }
  }
  if (istanza.stato) {
    return {
      applicato: false,
      messaggio: 'Ma non ha funzionato...',
    }
  }
  return { applicato: true }
}

/**
 * Risolve lo stato all'inizio del turno del pokemon.
 *
 * - Avvelenato: subisce 10%, 20%, 30%... degli HP massimi ai tick successivi.
 *   Il contatore rimane nello stato della creatura, anche tra cambi e salvataggi.
 * - Addormentato: primo turno sempre saltato senza dado. Dal secondo,
 *   4-6 su D6 sveglia e permette di agire. Si saltano al massimo tre turni.
 *   Nei vecchi salvataggi turniRimanenti=3 indica il primo turno obbligatorio.
 * - Paralizzato: resta tale fino a una cura e conserva la priorità ridotta.
 *   Per un attacco, 1-2 sul D6 perde il turno, 3-6 permette l'azione.
 *   Le azioni non offensive passano verificaAttacco=false e non tirano per PAR.
 * - Confuso: 50% probabilità di colpirsi da solo (1d6 danno + turno
 *   perso). Altrimenti agisce normalmente. turniRimanenti -= 1 in
 *   entrambi i casi; al raggiungimento di 0 lo stato si pulisce.
 */
export function risolviStatoInizioTurno(
  istanza: PokemonIstanza,
  hpMax: number,
  rng: () => number = Math.random,
  verificaAttacco = true
): {
  istanza: PokemonIstanza
  puoAgire: boolean
  dannoSubito: number
  messaggi: string[]
  tiroStato?: number
} {
  // Immunità da status: scala di un turno a ogni turno del Pokémon protetto.
  if ((istanza.immunitaStati ?? 0) > 0) {
    const restanti = (istanza.immunitaStati ?? 0) - 1
    const { immunitaStati: _scaduta, ...senzaImmunita } = istanza
    istanza = restanti > 0 ? { ...istanza, immunitaStati: restanti } : senzaImmunita
  }
  if (!istanza.stato || istanza.hp <= 0) {
    return { istanza, puoAgire: istanza.hp > 0, dannoSubito: 0, messaggi: [] }
  }

  const messaggi: string[] = []
  let stato: PokemonIstanza['stato'] = istanza.stato
  let hp = istanza.hp
  let dannoSubito = 0
  let puoAgire = true
  let tiroStato: number | undefined

  if (stato.tipo === 'Paralizzato') {
    stato = { ...stato, turniRimanenti: DURATA_STATO.Paralizzato }
    if (verificaAttacco) {
      tiroStato = rollD6(1, rng)
      puoAgire = tiroStato >= 3
      messaggi.push(puoAgire
        ? `${istanza.nome}: dado ${tiroStato}, può attaccare ma resta paralizzato.`
        : `${istanza.nome}: dado ${tiroStato}, la paralisi impedisce l'attacco e perde il turno.`)
    }
  } else if (stato.tipo === 'Avvelenato') {
    const percentuale = percentualeProssimoTickVeleno(stato)
    const turniTrascorsi = percentuale / 10
    dannoSubito = Math.max(1, Math.floor(hpMax * turniTrascorsi / 10))
    hp = Math.max(0, hp - dannoSubito)
    stato = { ...stato, turniTrascorsi }
    messaggi.push(`${istanza.nome} subisce ${dannoSubito} danni dal veleno (${percentuale}% degli HP massimi).`)
    // Veleno indefinito: nessun decremento
  } else if (stato.tipo === 'Addormentato') {
    if (stato.turniRimanenti >= DURATA_STATO.Addormentato) {
      puoAgire = false
      stato = { ...stato, turniRimanenti: DURATA_STATO.Addormentato - 1 }
      messaggi.push(`${istanza.nome} salta il primo turno di sonno obbligatorio, senza tiro di risveglio.`)
    } else {
      tiroStato = rollD6(1, rng)
      messaggi.push(`Tentativo di risveglio: dado ${tiroStato} (4–6 per svegliarsi).`)
      if (tiroStato >= 4) {
        messaggi.push(`${istanza.nome} si è svegliato!`)
        stato = undefined
      } else {
        messaggi.push(`${istanza.nome} sta dormendo profondamente...`)
        puoAgire = false
        const tr = stato.turniRimanenti - 1
        stato = tr > 0 ? { ...stato, turniRimanenti: tr } : undefined
        if (!stato) messaggi.push(`${istanza.nome} si sveglia dopo tre turni di sonno; agirà al prossimo turno.`)
      }
    }
  } else if (stato.tipo === 'Confuso') {
    const tr = stato.turniRimanenti - 1
    if (rng() < 0.5) {
      dannoSubito = rollD6(1, rng)
      hp = Math.max(0, hp - dannoSubito)
      messaggi.push(
        `${istanza.nome} è confuso e si è colpito da solo! (${dannoSubito} danni)`
      )
      puoAgire = false
    } else {
      messaggi.push(`${istanza.nome} è confuso ma riesce ad agire.`)
    }
    stato = tr > 0 ? { ...stato, turniRimanenti: tr } : undefined
    if (!stato) messaggi.push(`${istanza.nome} non è più confuso.`)
  }

  return {
    tiroStato,
    istanza: { ...istanza, hp, stato },
    puoAgire: puoAgire && hp > 0,
    dannoSubito,
    messaggi,
  }
}

// =============================================================
// COSTANTI DI BILANCIAMENTO
// =============================================================

export const BATTLE_CONSTANTS = {
  XP_BASE_VITTORIA: 50,
} as const

// =============================================================
// HELPER PURI (porting di Mod_Utilities.bas)
// =============================================================

// Porting di: LanciaDadi da old_files/Mod_Utilities.txt
export function rollD6(n: number, rng: () => number = Math.random): number {
  const k = n <= 0 ? 1 : n
  let totale = 0
  for (let i = 0; i < k; i++) totale += Math.floor(rng() * 6) + 1
  return totale
}

// Porting di: RoundIntHalfUp da old_files/Mod_Utilities.txt
/** Un d10 (1–10), usato solo per la precisione delle mosse di stato della legenda del foglio. */
export function rollD10(rng: () => number = Math.random): number {
  return Math.min(10, Math.floor(rng() * 10) + 1)
}

export function roundHalfUp(v: number): number {
  return v >= 0 ? Math.trunc(v + 0.5) : -Math.trunc(-v + 0.5)
}

// =============================================================
// CALCOLI DI BASE
// =============================================================

// Porting di: CalcolaHPMax da old_files/Mod_Utilities.txt
export function calcolaHPMax(istanza: PokemonIstanza): number {
  const specie = getPokemon(istanza.specieId)
  if (!specie) return 1
  if (istanza.livello <= 5) return specie.hpBase
  const crescita = CRESCITA_HP[specie.categoria] ?? 1
  return specie.hpBase + Math.trunc((istanza.livello - 5) * crescita)
}

// Porting di: OttieniParametriMossaAlLivello da old_files/Mod_Utilities.txt
export function getMossaAlLivello(
  mossa: MossaDef,
  livello: number
): { dadi: number; incremento: number } {
  const livStr = String(livello)
  let dadi = mossa.dadiPerLivello[livStr]
  let incremento = mossa.incrementoPerLivello[livStr]
  if (dadi === undefined || incremento === undefined) {
    for (let l = livello; l >= 5; l--) {
      if (dadi === undefined) dadi = mossa.dadiPerLivello[String(l)]
      if (incremento === undefined) incremento = mossa.incrementoPerLivello[String(l)]
      if (dadi !== undefined && incremento !== undefined) break
    }
  }
  return { dadi: dadi ?? 1, incremento: incremento ?? 0 }
}

// =============================================================
// CALCOLO DEL DANNO (porting di CalcolaEApplicaDanno)
// =============================================================

export function calcolaDanno(
  attaccante: PokemonIstanza,
  difensore: PokemonIstanza,
  numeroMossa: 0 | 1 | 2,
  rng: () => number = Math.random,
  supremaAttiva?: boolean
): RisultatoMossa | null {
  const specieAtt = getPokemon(attaccante.specieId)
  const specieDif = getPokemon(difensore.specieId)
  if (!specieAtt || !specieDif) return null

  const mossaId = specieAtt.mosse[numeroMossa]
  if (!mossaId) return null
  const mossa = getMossa(mossaId)
  if (!mossa) return null

  const soloStato = èMossaSoloStato(mossa)
  const { dadi, incremento } = soloStato ? { dadi: 0, incremento: 0 } : getMossaAlLivello(mossa, attaccante.livello)

  // Tiri singoli (per popolare RisultatoMossa.tiriDado, utile alla UI)
  const tiri: number[] = []
  for (let i = 0; i < dadi; i++) tiri.push(rollD6(1, rng))
  const sommaDadi = tiri.reduce((a, b) => a + b, 0)
  const dannoBase = sommaDadi + incremento

  const moltTipo = soloStato ? 1 : efficaciaTipo(mossa.tipo, specieDif.tipo)
  const stab = moltTipo > 1
  // undefined conserva la classificazione delle mosse legacy per chiamanti/IA.
  // Le azioni umane passano false per l'attacco normale e true per la Suprema.
  const suprema = !soloStato && (supremaAttiva ?? èMossaSuprema(mossa))
  const dannoOrdinario = Math.max(
    1,
    roundHalfUp(dannoBase * moltTipo)
  )
  // Danno fisso (mosse Status del Database): valore della regola, senza dadi né efficacia.
  const dannoFisso = soloStato && mossa.effetto === 'DANNO_FISSO' ? Math.max(1, Math.floor(mossa.valoreEffetto ?? 0)) : 0
  const dannoFinale = soloStato ? dannoFisso : dannoOrdinario * (suprema ? 2 : 1)

  const messaggi: string[] = [`${attaccante.nome} usa ${mossa.nome}!`]
  if (suprema) messaggi.push('💥 MOSSA SUPREMA! 💥')
  if (moltTipo > 1) messaggi.push('È superefficace!')
  else if (moltTipo < 1 && moltTipo > 0) messaggi.push('Non è molto efficace...')
  else if (moltTipo === 0) messaggi.push('Non ha effetto!')
  if (!soloStato || dannoFisso) messaggi.push(`${difensore.nome} subisce ${dannoFinale} danni${dannoFisso ? ' fissi' : ''}.`)

  // Il costo della Suprema è fisso: 50% degli HP massimi, mai degli HP correnti.
  let autodanno = 0
  if (suprema) {
    const hpMaxAtt = calcolaHPMax(attaccante)
    autodanno = costoSuprema(hpMaxAtt)
    messaggi.push(`${attaccante.nome} si scarica e perde ${autodanno} HP!`)
  }

  const difensoreSvenuto = difensore.hp - dannoFinale <= 0
  if (difensoreSvenuto) messaggi.push(`${difensore.nome} non può più combattere!`)

  // Trigger stato alterato (BR.3: sempre applicato se mossa ha effetto,
  // salvo immunità da tentaApplicaStato — nessun roll % di probabilità).
  let statoApplicato: StatoAlterato | undefined
  // Precisione della legenda (8/10, 9/10, 7/10): un d10 decide se la mossa di stato va a segno.
  // Si tira solo per le mosse di stato con precisione, così gli attacchi non consumano tiri in più.
  let tiroPrecisione: number | undefined
  let mancata = false
  if (soloStato && mossa.precisione && mossa.effetto && EFFETTO_TO_STATO[mossa.effetto] && !difensoreSvenuto) {
    tiroPrecisione = rollD10(rng)
    mancata = tiroPrecisione > mossa.precisione
    messaggi.push(mancata
      ? `Precisione: d10 = ${tiroPrecisione} (serve ${mossa.precisione} o meno). ${mossa.nome} manca il bersaglio!`
      : `Precisione: d10 = ${tiroPrecisione} (serve ${mossa.precisione} o meno). A segno!`)
  }
  if (mossa.effetto && EFFETTO_TO_STATO[mossa.effetto] && !difensoreSvenuto && !mancata) {
    const stato = EFFETTO_TO_STATO[mossa.effetto]
    const tentativo = tentaApplicaStato(difensore, stato)
    if (tentativo.applicato) {
      statoApplicato = stato
      messaggi.push(`${difensore.nome} è ora ${stato}!`)
    } else if (tentativo.messaggio) {
      messaggi.push(tentativo.messaggio)
    }
  }

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
    statoApplicato,
    autodanno,
    suprema,
    ...(tiroPrecisione !== undefined ? { tiroPrecisione, mancata } : {}),
  }
}

// =============================================================
// MOSSA SUPREMA (Fase B)
// =============================================================

/** True se la mossa è classificata Suprema. */
export function èMossaSuprema(mossa: MossaDef): boolean {
  return mossa.effetto === 'SUPREMA'
}

const RAPPORTO_AUTODANNO_SUPREMA = 0.5

/** Costo condiviso da motore e UI; non genera tiri e non dipende dalla mossa. */
export function costoSuprema(hpMaxAttaccante: number): number {
  return Math.max(1, Math.floor(hpMaxAttaccante * RAPPORTO_AUTODANNO_SUPREMA))
}

/** Mosse con livello minimo ("Dal Lvl 22" nel Database): prima non si possono usare. */
export function èMossaDisponibile(mossa: MossaDef, livello: number): boolean {
  return livello >= (mossa.livelloMinimo ?? 0)
}

/** Uno status puro è un'azione senza dadi offensivi o danno al bersaglio. */
export function èMossaSoloStato(mossa: MossaDef): boolean {
  return mossa.soloStato === true
}

/** Calcola l'autodanno fisso delle mosse legacy Suprema. Min 1, 50% HP massimi. */
export function autodannoSuprema(
  mossa: MossaDef,
  hpMaxAttaccante: number
): number {
  if (!èMossaSuprema(mossa)) return 0
  return costoSuprema(hpMaxAttaccante)
}

/** Azione Suprema esplicita: potenzia una mossa offensiva senza trasformare una cura. */
export function calcolaAzioneSuprema(
  attaccante: PokemonIstanza,
  difensore: PokemonIstanza,
  numeroMossa: 0 | 1 | 2,
  rng: () => number = Math.random
): RisultatoMossa | null {
  const mossaId = getPokemon(attaccante.specieId)?.mosse[numeroMossa]
  const mossa = mossaId ? getMossa(mossaId) : undefined
  if (!mossa || èMossaCura(mossa) || èMossaSoloStato(mossa)) return null
  return calcolaDanno(attaccante, difensore, numeroMossa, rng, true)
}

// =============================================================
// MOSSE DI CURA (Fase B)
// =============================================================
//
// Le cure HP rimuovono anche veleno o paralisi, persino a HP già pieni.

export const EFFETTI_CURA = new Set(['CURA', 'CURA_PCT', 'CURA_PARALISI', 'IMMUNITA'])

/** True se la mossa è una mossa curativa (non infligge danno). */
export function èMossaCura(mossa: MossaDef): boolean {
  return mossa.effetto != null && EFFETTI_CURA.has(mossa.effetto)
}

/**
 * Applica una mossa di cura sull'attaccante stesso.
 *
 * Rimuove anche Avvelenato o Paralizzato, pure se gli HP sono al massimo.
 * Sonno e confusione non vengono curati da queste mosse.
 */
export function applicaMossaCura(
  attaccante: PokemonIstanza,
  mossa: MossaDef,
  hpMax: number
): {
  istanza: PokemonIstanza
  hpRecuperato: number
  messaggi: string[]
  tiroStato?: number
} {
  const messaggi = [`${attaccante.nome} usa ${mossa.nome}!`]
  if (mossa.effetto === 'CURA_PARALISI') {
    if (attaccante.stato?.tipo !== 'Paralizzato') {
      messaggi.push(`${attaccante.nome} non è paralizzato.`)
      return { istanza: attaccante, hpRecuperato: 0, messaggi }
    }
    const { stato: _paralisi, ...guarito } = attaccante
    messaggi.push(`${attaccante.nome} è guarito dalla paralisi!`)
    return { istanza: guarito, hpRecuperato: 0, messaggi }
  }
  if (mossa.effetto === 'IMMUNITA') {
    const turni = Math.max(1, Math.floor(mossa.valoreEffetto ?? 5))
    const { stato: statoPrecedente, ...senzaStato } = attaccante
    if (statoPrecedente) messaggi.push(`${attaccante.nome} non è più ${statoPrecedente.tipo}.`)
    messaggi.push(`${attaccante.nome} è protetto dagli stati alterati per ${turni} turni.`)
    return { istanza: { ...senzaStato, immunitaStati: turni }, hpRecuperato: 0, messaggi }
  }
  if (!èMossaCura(mossa) || mossa.valoreEffetto == null) {
    return { istanza: attaccante, hpRecuperato: 0, messaggi }
  }

  let amount = 0
  if (mossa.effetto === 'CURA_PCT') {
    amount = Math.max(1, Math.floor((hpMax * mossa.valoreEffetto) / 100))
  } else {
    amount = Math.max(1, Math.floor(mossa.valoreEffetto))
  }

  const nuovoHp = Math.min(hpMax, attaccante.hp + amount)
  const recuperato = nuovoHp - attaccante.hp

  // La paralisi permanente può essere rimossa solo da una cura esplicita.
  const haVeleno = attaccante.stato?.tipo === 'Avvelenato'
  const haParalisi = attaccante.stato?.tipo === 'Paralizzato'
  let istanzaFinale: PokemonIstanza = { ...attaccante, hp: nuovoHp }
  if (haVeleno || haParalisi) {
    istanzaFinale = { ...istanzaFinale, stato: undefined }
  }

  // Nessun effetto solo se non c'è né recupero HP né uno stato curabile.
  if (recuperato <= 0 && !haVeleno && !haParalisi) {
    messaggi.push(`${attaccante.nome} è già al massimo dell'energia.`)
    return { istanza: attaccante, hpRecuperato: 0, messaggi }
  }

  if (recuperato > 0) {
    messaggi.push(`${attaccante.nome} recupera ${recuperato} HP.`)
  } else {
    messaggi.push(`${attaccante.nome} è già al massimo dell'energia.`)
  }
  if (haVeleno) {
    messaggi.push(`${attaccante.nome} è guarito dal veleno!`)
  }
  if (haParalisi) {
    messaggi.push(`${attaccante.nome} è guarito dalla paralisi!`)
  }

  return {
    istanza: istanzaFinale,
    hpRecuperato: recuperato,
    messaggi,
  }
}

// =============================================================
// CATTURA (porting di EseguiAzioneCattura)
// =============================================================

// Porting di: EseguiAzioneCattura da old_files/Mod_Battle_Engine.txt
// BR.3: formula riallineata al VBA → tasso * (3 - hp/hpMax) [più generosa di (2 -)]
export function tentaCattura(
  bersaglio: PokemonIstanza,
  rng: () => number = Math.random
): { riuscita: boolean; roll: number; soglia: number; tiri: [number, number, number] } {
  const specie = getPokemon(bersaglio.specieId)
  if (!specie) return { riuscita: false, roll: 0, soglia: 0, tiri: [0, 0, 0] }

  const tasso = Math.max(1, specie.tassoCattura)
  const hpMax = calcolaHPMax(bersaglio)
  // Stessi tre tiri, nello stesso ordine di prima: i singoli valori servono solo alla presentazione.
  const tiri: [number, number, number] = [rollD6(1, rng), rollD6(1, rng), rollD6(1, rng)]
  const roll = tiri[0] + tiri[1] + tiri[2] // 3..18
  const soglia = tasso * (3 - bersaglio.hp / hpMax)
  return { riuscita: roll <= soglia, roll, soglia, tiri }
}

// =============================================================
// CATTURA CON SACCHETTINO (tabella d20 del Database)
// =============================================================

export type LivelloSacchettino = 'base' | 'mega' | 'ultra' | 'master'
export type DifficoltaCattura = 'Facile' | 'Medio' | 'Difficile'
type FasciaCattura = 'pieno' | 'pieno+status' | '50' | '50+status' | '25' | '25+status'

export function difficoltaCattura(tassoCattura: number): DifficoltaCattura {
  const entries = Object.entries(captureTable.difficolta) as [DifficoltaCattura, [number, number]][]
  return entries.find(([, [min, max]]) => tassoCattura >= min && tassoCattura <= max)?.[0] ?? (tassoCattura >= 4 ? 'Facile' : tassoCattura <= 1 ? 'Difficile' : 'Medio')
}

/** HP fino al 25% / fino al 50% degli HP massimi, con o senza uno stato alterato. */
export function fasciaCattura(bersaglio: PokemonIstanza): FasciaCattura {
  const ratio = bersaglio.hp / Math.max(1, calcolaHPMax(bersaglio))
  const hp = ratio <= 0.25 ? '25' : ratio <= 0.5 ? '50' : 'pieno'
  return (bersaglio.stato ? `${hp}+status` : hp) as FasciaCattura
}

export function sogliaCatturaD20(bersaglio: PokemonIstanza, livello: Exclude<LivelloSacchettino, 'master'>): { soglia: number; difficolta: DifficoltaCattura; fascia: FasciaCattura } {
  const specie = getPokemon(bersaglio.specieId)
  const difficolta = difficoltaCattura(specie?.tassoCattura ?? 3)
  const fascia = fasciaCattura(bersaglio)
  return { soglia: captureTable.soglie[livello][fascia][difficolta], difficolta, fascia }
}

/** Un d20: la cattura riesce con un risultato uguale o maggiore della soglia. Il Supremo non tira. */
export function tentaCatturaSacchettino(
  bersaglio: PokemonIstanza,
  livello: LivelloSacchettino,
  rng: () => number = Math.random
): { riuscita: boolean; roll: number | null; soglia: number | null; difficolta: DifficoltaCattura; fascia: FasciaCattura } {
  const specie = getPokemon(bersaglio.specieId)
  if (livello === 'master') return { riuscita: true, roll: null, soglia: null, difficolta: difficoltaCattura(specie?.tassoCattura ?? 3), fascia: fasciaCattura(bersaglio) }
  const { soglia, difficolta, fascia } = sogliaCatturaD20(bersaglio, livello)
  const roll = Math.min(20, Math.floor(rng() * 20) + 1)
  return { riuscita: roll >= soglia, roll, soglia, difficolta, fascia }
}

// =============================================================
// AI (porting di ScegliMossaIA)
// =============================================================

/** Usi già fatti di una mossa da un Arkamon in questa lotta. */
export function usiMossa(usi: UsiMosse | undefined, istanzaId: string, mossaId: number): number {
  return usi?.[istanzaId]?.[String(mossaId)] ?? 0
}

/** True se la mossa ha un limite di usi per lotta e l'Arkamon l'ha già esaurito. */
export function èMossaEsaurita(mossa: MossaDef, usi: UsiMosse | undefined, istanzaId: string): boolean {
  return !!mossa.usiMassimi && usiMossa(usi, istanzaId, mossa.id) >= mossa.usiMassimi
}

/** Registra un uso; restituisce un nuovo contatore solo per le mosse con limite. */
export function registraUsoMossa(usi: UsiMosse | undefined, istanzaId: string, mossa: MossaDef): UsiMosse | undefined {
  if (!mossa.usiMassimi) return usi
  const perIstanza = usi?.[istanzaId] ?? {}
  return { ...(usi ?? {}), [istanzaId]: { ...perIstanza, [String(mossa.id)]: (perIstanza[String(mossa.id)] ?? 0) + 1 } }
}

/** Id delle mosse esaurite di un Arkamon: l'IA non le considera. */
export function mosseEsaurite(istanza: PokemonIstanza, usi: UsiMosse | undefined): Set<number> {
  const specie = getPokemon(istanza.specieId)
  const esaurite = new Set<number>()
  for (const mossaId of specie?.mosse ?? []) {
    const mossa = mossaId ? getMossa(mossaId) : undefined
    if (mossa && èMossaEsaurita(mossa, usi, istanza.istanzaId)) esaurite.add(mossa.id)
  }
  return esaurite
}

/**
 * Mossa prioritaria disponibile (legenda: «Cura paralisi ha priorità su tutte le altre mosse»).
 * Un Arkamon paralizzato agisce per secondo; se conosce una mossa prioritaria può usarla
 * prima dell'avversario. Restituisce l'indice della mossa, oppure null.
 */
export function indiceMossaPrioritaria(istanza: PokemonIstanza, usi?: UsiMosse): 0 | 1 | 2 | null {
  if (istanza.hp <= 0 || istanza.stato?.tipo !== 'Paralizzato') return null
  const specie = getPokemon(istanza.specieId)
  for (let i = 0; i < 3; i++) {
    const mossaId = specie?.mosse[i]
    const mossa = mossaId ? getMossa(mossaId) : undefined
    if (mossa?.priorita && èMossaDisponibile(mossa, istanza.livello) && !èMossaEsaurita(mossa, usi, istanza.istanzaId)) return i as 0 | 1 | 2
  }
  return null
}

export function scegliMossaIA(
  attaccante: PokemonIstanza,
  difensore: PokemonIstanza,
  rng: () => number = Math.random,
  esaurite: ReadonlySet<number> = new Set()
): 0 | 1 | 2 {
  const specie = getPokemon(attaccante.specieId)
  if (!specie) return 0
  const specieDif = getPokemon(difensore.specieId)
  if (!specieDif) return 0

  const hpMax = calcolaHPMax(attaccante)
  const hpRatio = attaccante.hp / hpMax

  let migliore: 0 | 1 | 2 = 0
  let punteggioMax = -Infinity

  for (let i = 0; i < 3; i++) {
    const idx = i as 0 | 1 | 2
    const mossaId = specie.mosse[idx]
    if (!mossaId) continue
    const mossa = getMossa(mossaId)
    if (!mossa || !èMossaDisponibile(mossa, attaccante.livello) || esaurite.has(mossa.id)) continue

    const { dadi, incremento } = getMossaAlLivello(mossa, attaccante.livello)
    let punteggio = dadi * 3.5 + incremento
    punteggio *= efficaciaTipo(mossa.tipo, specieDif.tipo)
    if (èMossaSoloStato(mossa)) {
      // La paralisi è utile se sottrae la priorità all'avversario per i round futuri.
      // Con pochi HP residui un attacco resta preferibile; uno stato già presente blocca il nuovo.
      const difensoreHaPriorita = attaccante.stato?.tipo === 'Paralizzato' || difensore.livello > attaccante.livello
      punteggio = mossa.effetto === 'DANNO_FISSO' ? Math.max(1, mossa.valoreEffetto ?? 0)
        : difensore.stato || (difensore.immunitaStati ?? 0) > 0 || difensore.hp <= 0 ? Number.NEGATIVE_INFINITY
        : mossa.effetto === 'PARALISI' && difensoreHaPriorita && difensore.hp > 1 ? difensore.hp : -1
    }
    if (mossa.effetto && EFFETTI_CURA.has(mossa.effetto)) {
      // La cura esplicita elimina una penalità permanente, anche a HP pieni.
      punteggio = mossa.effetto === 'CURA_PARALISI'
        ? (attaccante.stato?.tipo === 'Paralizzato' ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY)
        : mossa.effetto === 'IMMUNITA'
          ? (attaccante.stato ? 90 : (attaccante.immunitaStati ?? 0) > 0 ? Number.NEGATIVE_INFINITY : -1)
          : attaccante.stato?.tipo === 'Paralizzato' ? Number.POSITIVE_INFINITY : hpRatio <= 0.3 ? 100 : -1
    }
    if (èMossaSuprema(mossa)) {
      punteggio = hpRatio > RAPPORTO_AUTODANNO_SUPREMA + 0.05 ? punteggio * 2 : -1
    }

    if (punteggio > punteggioMax) {
      punteggioMax = punteggio
      migliore = idx
    } else if (Math.abs(punteggio - punteggioMax) < 0.0001 && rng() < 0.5) {
      migliore = idx
    }
  }

  return migliore
}

// =============================================================
// LIVELLI ED EVOLUZIONI
// =============================================================

export const LIVELLO_MAX = 100

export function xpRichiestoPerLivello(_livello: number): number {
  return 1
}

export function xpGuadagnato(_nemico: PokemonIstanza): number {
  return 1
}

/** EXP is a one-off level reward, never a balance carried by a creature. */
export function clearStoredExperience(istanza: PokemonIstanza): PokemonIstanza {
  return istanza.xp === 0 ? istanza : { ...istanza, xp: 0 }
}

export function applicaXP(
  istanza: PokemonIstanza,
  xp: number,
  levelLimit = LIVELLO_MAX
): {
  istanza: PokemonIstanza
  livelliGuadagnati: number
  evoluzionePendente: { nuovaSpecieId: number } | null
  xpScartata: number
} {
  const reward = Number.isFinite(xp) ? Math.max(0, Math.floor(xp)) : 0
  if (istanza.livello >= LIVELLO_MAX) {
    return { istanza: { ...istanza, xp: 0 }, livelliGuadagnati: 0, evoluzionePendente: null, xpScartata: reward }
  }

  const nuova = { ...istanza, xp: 0 }
  let remainingReward = reward
  let livelliGuadagnati = 0
  let evoluzionePendente: { nuovaSpecieId: number } | null = null

  const maximum = Math.max(istanza.livello, Math.min(LIVELLO_MAX, Math.floor(levelLimit)))
  while (remainingReward >= xpRichiestoPerLivello(nuova.livello) && nuova.livello < maximum) {
    remainingReward -= xpRichiestoPerLivello(nuova.livello)
    nuova.livello += 1
    livelliGuadagnati += 1

    const specie = getPokemon(nuova.specieId)
    if (
      specie?.livelloEvoluzione &&
      specie.evoluzioneId &&
      nuova.livello >= specie.livelloEvoluzione
    ) {
      evoluzionePendente = { nuovaSpecieId: specie.evoluzioneId }
      break
    }
  }

  // Ignore balances from old saves and discard rewards that cannot be spent now,
  // including those blocked by the team cap or a pending evolution.
  return { istanza: nuova, livelliGuadagnati, evoluzionePendente, xpScartata: remainingReward }
}

/**
 * Premia un KO appena avvenuto, anche quando è causato da status o contraccolpo.
 * Il lato sopravvissuto conserva gli HP residui. Un Pokémon già KO non può
 * essere premiato né generare un secondo premio quando si riprende il turno.
 */
export function applicaXPDopoKO(
  vincitore: PokemonIstanza,
  sconfittoPrima: PokemonIstanza,
  sconfittoDopo: PokemonIstanza,
  levelLimit = LIVELLO_MAX
): ReturnType<typeof applicaXP> & { xpAssegnata: number } {
  const xpAssegnata = vincitore.hp > 0 && sconfittoPrima.hp > 0 && sconfittoDopo.hp <= 0
    && sconfittoPrima.istanzaId === sconfittoDopo.istanzaId
    ? xpGuadagnato(sconfittoPrima) : 0
  const progressione = applicaXP(vincitore, xpAssegnata, levelLimit)
  return { ...progressione, xpAssegnata }
}

/**
 * Risolve la progressione dell'attaccante dopo il danno al bersaglio, prima
 * del contraccolpo. Il KO diretto assegna XP anche se la Suprema esaurirà poi
 * l'attaccante; il livello aumenta senza curarlo. Il costo della Suprema usa
 * gli HP massimi al nuovo livello, prima di un'eventuale evoluzione pendente.
 * I messaggi sostituiscono il costo preventivo di calcolaDanno e rispettano
 * l'ordine danno/KO → livello → contraccolpo. La UI gestisce l'evoluzione.
 */
export function risolviAttaccanteDopoMossa(risultato: RisultatoMossa, levelLimit = LIVELLO_MAX): {
  istanza: PokemonIstanza
  istanzaPrimaDelContraccolpo: PokemonIstanza
  xpAssegnata: number
  xpScartata: number
  livelliGuadagnati: number
  evoluzionePendente: { nuovaSpecieId: number } | null
  autodanno: number
  messaggi: string[]
} {
  const attaccante = risultato.attaccante
  const progressione = applicaXPDopoKO(attaccante, risultato.difensore, {
    ...risultato.difensore,
    hp: risultato.difensoreSvenuto ? 0 : risultato.difensore.hp,
  }, levelLimit)
  const { xpAssegnata } = progressione
  const istanzaPrimaDelContraccolpo = progressione.istanza
  const suprema = risultato.suprema ?? èMossaSuprema(risultato.mossa)
  const autodanno = suprema
    ? costoSuprema(calcolaHPMax(istanzaPrimaDelContraccolpo)) : (risultato.autodanno ?? 0)
  const messaggioAutodannoPreventivo = `${attaccante.nome} si scarica e perde ${risultato.autodanno} HP!`
  const messaggi = risultato.messaggi.filter((messaggio) => messaggio !== messaggioAutodannoPreventivo)
  if (progressione.livelliGuadagnati > 0) {
    messaggi.push(`${attaccante.nome} è salito al livello ${istanzaPrimaDelContraccolpo.livello}!`)
  }
  if (progressione.xpScartata > 0 && progressione.istanza.livello < LIVELLO_MAX) {
    messaggi.push(`${attaccante.nome} ha raggiunto il cap di squadra: l’EXP di questo KO non si accumula. Allena gli Arkamon di livello più basso.`)
  }
  if (autodanno > 0) messaggi.push(`${attaccante.nome} si scarica e perde ${autodanno} HP!`)

  return {
    ...progressione,
    istanza: { ...istanzaPrimaDelContraccolpo, hp: Math.max(0, istanzaPrimaDelContraccolpo.hp - autodanno) },
    istanzaPrimaDelContraccolpo,
    xpAssegnata,
    autodanno,
    messaggi,
  }
}

// =============================================================
// HELPER DI BATTAGLIA
// =============================================================

// Porting di: DeterminaPrimoTurno da old_files/Mod_Utilities.txt
export function determinaIniziativa(
  livelloA: number,
  livelloB: number,
  rng: () => number = Math.random,
  statoA?: StatoAlterato,
  statoB?: StatoAlterato
): Lato {
  if ((statoA === 'Paralizzato') !== (statoB === 'Paralizzato')) return statoA === 'Paralizzato' ? 'B' : 'A'
  if (livelloA > livelloB) return 'A'
  if (livelloB > livelloA) return 'B'
  return rng() < 0.5 ? 'A' : 'B'
}

export function squadraSconfitta(squadra: PokemonIstanza[] | undefined): boolean {
  if (!squadra || squadra.length === 0) return false
  return squadra.every((p) => p.hp <= 0)
}

/**
 * Se entrambi gli ultimi Pokémon vanno KO nella stessa azione, vince il lato
 * che ha abbattuto il bersaglio prima del contraccolpo. Il chiamante passa
 * questo lato solo dopo un KO diretto; senza tale contesto vale l'esito usuale.
 */
export function esitoSquadre(
  squadraA: PokemonIstanza[],
  squadraB: PokemonIstanza[],
  latoVincitoreScontro?: Lato
): EsitoBattaglia | null {
  const sconfittaA = squadraSconfitta(squadraA)
  const sconfittaB = squadraSconfitta(squadraB)
  if (sconfittaA && sconfittaB && latoVincitoreScontro) {
    return latoVincitoreScontro === 'A' ? 'vittoria' : 'sconfitta'
  }
  if (sconfittaA) return 'sconfitta'
  if (sconfittaB) return 'vittoria'
  return null
}

// =============================================================
// MONETE (porting di CalcolaVariazioneMonete)
// =============================================================

export type EsitoBattaglia = 'vittoria' | 'sconfitta'
export type TipoAvversario = 'NPC' | 'Capopalestra' | 'Selvatico' | 'PVP'

// Porting di: CalcolaVariazioneMonete da old_files/Mod_Battle_Engine.txt
export function calcolaVariazioneMonete(
  esito: EsitoBattaglia,
  tipoAvversario: TipoAvversario
): number {
  if (esito === 'vittoria') {
    if (tipoAvversario === 'NPC') return 200
    if (tipoAvversario === 'Capopalestra') return 1000
    return 0
  }
  if (tipoAvversario === 'NPC' || tipoAvversario === 'Capopalestra') return -200
  return 0
}
