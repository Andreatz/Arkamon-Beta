/**
 * Store globale dell'applicazione (Zustand).
 *
 * Sostituisce i fogli Excel `Stato_Giocatore`, `Battaglia_Corrente`,
 * `Giocatore1_Squadra`, `Giocatore2_Squadra`, etc.
 *
 * Persiste automaticamente su localStorage tra sessioni.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { emptyPlayer as giocatoreVuoto, mainMapPosition, normalizeGameSave, serializeGameState, GAME_SAVE_STORAGE_KEY, type GameSaveState } from '@/save/gamePersistence'
import { emptyInteractionProgress } from '@/interactions/types'
import { useInteractionStore } from '@/interactions/interactionStore'
import { finalizeConfiguredBattle, resolveConfiguredInteraction } from '@/interactions/runtime'
import type {
  StatoGiocatore,
  StatoBattaglia,
  PokemonIstanza,
  NavigazioneScena,
  SceneId,
  OggettoId,
  PosizioneAvatar,
  StatoTurnoOverworld,
  Casella,
  MappaGriglia,
  PosizioniMappeLocali,
} from '@/types'
import {
  calcolaHPMax,
  calcolaVariazioneMonete,
  determinaIniziativa,
  type EsitoBattaglia,
  type TipoAvversario,
} from '@engine/battleEngine'
import { getPokemon, getAllenatore } from '@data/index'
import {
  MAIN_MAP_START_NODE,
  areMainMapNodesConnected,
} from '@data/mainMapRoads'
import { scambia, type SlotRef } from '@engine/deposito'
import { getLocalMap } from '@data/localMaps'
import {
  SECRET_LOCATION_ID,
  SECRET_LOCATION_ORIGIN,
  canAccessSecretLocation,
  hasUnlockedSecretLocation,
  isSecretLocationConnection,
  isSecretLocationPosition,
} from '@data/secretLocation'
import { canMoveOnLocalMap, getLocalMapNode } from '@engine/localMapMovement'
import {
  chiaveCasellaConsumata,
  consumaAzione,
  nuovoTurno,
  puòMuoversi,
  risultatoInterazione,
  type RisultatoInterazione,
} from '@engine/movimento'

export interface GameState extends GameSaveState {
  /** Volatile scene generation. A restored/new campaign must release every old timer and local scene snapshot. */
  campaignRevision: number
  /** Recoveries from the last load; excluded from portable files. */
  saveRecoveryWarnings: string[]
  dismissSaveRecoveryWarnings: () => void
  eseguiInterazioneConfigurata: (giocatoreId: 1 | 2, interactionId: string) => { ok: boolean; message: string }
  // === STATO GIOCATORI ===
  giocatore1: StatoGiocatore
  giocatore2: StatoGiocatore
  /** Quale dei due giocatori sta giocando il proprio turno */
  giocatoreAttivo: 1 | 2

  // === STATO BATTAGLIA ===
  battaglia: StatoBattaglia | null

  /** ID specie dello starter assegnato al Rivale (quello scartato dai giocatori) */
  rivaleStarterId: number | null

  // === OVERWORLD (Fase E) ===
  posizione1: PosizioneAvatar
  posizione2: PosizioneAvatar
  turnoOverworld: StatoTurnoOverworld
  posizioniLocali1: PosizioniMappeLocali
  posizioniLocali2: PosizioniMappeLocali

  // === NAVIGAZIONE ===
  scenaCorrente: NavigazioneScena
  scenaPrecedente: NavigazioneScena | null

  // === AUDIO ===
  audioMuted: boolean

  // =====================================================
  // ACTIONS
  // =====================================================

  /** Naviga a una nuova scena, ricordando quella precedente */
  vaiAScena: (scena: SceneId, payload?: Record<string, unknown>) => void

  /** Torna alla scena precedente */
  scenaIndietro: () => void

  /** Abilita/disabilita audio globale, persistito nel save. */
  setAudioMuted: (muted: boolean) => void

  /** Cambia il giocatore attivo (alternanza tra Giocatore 1 e 2) */
  cambiaGiocatoreAttivo: () => void

  /** Imposta il nome visualizzato di un giocatore. */
  impostaNomeGiocatore: (giocatoreId: 1 | 2, nome: string) => void

  /** Assegna uno starter disponibile al prossimo giocatore che deve sceglierlo. */
  scegliStarter: (specieId: number) => boolean

  /** Aggiunge un pokemon alla squadra (se piena va in deposito). */
  aggiungiPokemon: (giocatoreId: 1 | 2, istanza: PokemonIstanza) => void
  /** Capture, optional Masterball consumption and the finished battle save form one update. */
  concludiCattura: (giocatoreId: 1 | 2, istanza: PokemonIstanza, patch: Partial<StatoBattaglia>, masterball?: boolean) => boolean

  /** Aggiorna un pokemon esistente (HP, livello, evoluzione...) */
  aggiornaPokemon: (giocatoreId: 1 | 2, istanza: PokemonIstanza) => void

  /** Marca un cespuglio come visitato (non più ripetibile per quel giocatore) */
  segnaCespuglioVisitato: (giocatoreId: 1 | 2, luogo: string, cespuglio: string) => void

  /** Verifica se un cespuglio è già stato visitato dal giocatore */
  cespuglioVisitato: (giocatoreId: 1 | 2, luogo: string, cespuglio: string) => boolean

  /** Aggiunge (o sottrae se delta < 0) monete al giocatore, non scende sotto 0 */
  aggiornaMonete: (giocatoreId: 1 | 2, delta: number) => void

  /** Decrementa di 1 la quantità dell'oggetto. Ritorna true se consumato. */
  usaOggetto: (giocatoreId: 1 | 2, oggettoId: OggettoId) => boolean

  /** Aggiunge (o crea) `delta` unità di un oggetto. */
  aggiungiOggetto: (giocatoreId: 1 | 2, oggettoId: OggettoId, delta: number) => void

  /** Avvia una battaglia contro un allenatore NPC. Ritorna false se non avviabile */
  iniziaBattagliaNPC: (allenatoreId: number, luogoRitorno: string) => boolean

  /** Risolve l'esito di una battaglia NPC: applica monete e marca sconfitto */
  risolviBattagliaNPC: (esito: EsitoBattaglia) => void

  /** Cura tutta la squadra del giocatore (Centro Pokemon) */
  curaSquadra: (giocatoreId: 1 | 2) => void

  /** Scambia o sposta il contenuto tra due slot (squadra o deposito) */
  scambiaSlot: (giocatoreId: 1 | 2, source: SlotRef, target: SlotRef) => void
  /** Assegna lo starter scartato al Rivale (porting di AssegnaRivaleEVaiAllaMappa) */
  assegnaRivaleStarter: (specieId: number) => void

  /** Avvia una nuova battaglia */
  iniziaBattaglia: (battaglia: StatoBattaglia) => void

  /** Aggiorna lo stato della battaglia in corso */
  aggiornaBattaglia: (patch: Partial<StatoBattaglia>) => void

  /** Termina la battaglia: conserva la paralisi salvo cura completa, pulisce gli altri stati. */
  terminaBattaglia: (curaCompleta: boolean) => void

  // === ACTIONS OVERWORLD (Fase E) ===

  /**
   * Muove l'avatar del giocatore alla nuova posizione (deve essere adiacente
   * e calpestabile). Decrementa di 1 le azioni rimaste; se arriva a 0 passa
   * automaticamente il turno all'altro giocatore.
   * Ritorna `true` se il movimento è stato applicato.
   */
  muoviAvatar: (giocatoreId: 1 | 2, nuovaPos: PosizioneAvatar, mappa: MappaGriglia) => boolean

  /**
   * Interagisce con la casella in (x, y) sulla mappa data. Marca la casella
   * come consumata (per cespuglio/allenatore/npc), gestisce internamente
   * `transizione-mappa` (sposta l'avatar sulla mappa di destinazione) e
   * chiude il turno (azioni → 0 → swap).
   * Ritorna il `RisultatoInterazione` per delegare battaglia/edificio
   * alla UI; `no-op` se la casella non è interagibile dal giocatore.
   */
  interagisciCasella: (
    giocatoreId: 1 | 2,
    mappa: MappaGriglia,
    x: number,
    y: number
  ) => RisultatoInterazione

  /** Forza lo swap del turno overworld (usato dalla UI come pulsante manuale). */
  passaTurnoOverworld: () => void

  /** Muove l'avatar sulla mappa principale lungo una strada collegata. */
  muoviAvatarMappaPrincipale: (giocatoreId: 1 | 2, luogoDestinazione: string) => boolean

  /** Crosses the hidden Rome passage using one shared movement action. */
  attraversaPassaggioSegreto: (giocatoreId: 1 | 2) => boolean

  /** Consuma l'interazione del turno sul nodo corrente della mappa principale. */
  interagisciLuogoMappaPrincipale: (
    giocatoreId: 1 | 2
  ) => { tipo: 'no-op' } | { tipo: 'luogo'; luogo: string }

  /** Prepara il punto d'ingresso locale solo per un giocatore che si trova già nel luogo. */
  inizializzaPosizioneLocale: (giocatoreId: 1 | 2, luogo: string) => string | null

  /** Aprire il disegno locale non consuma azioni e non sposta il nodo sulla mappa principale. */
  apriMappaLocale: (giocatoreId: 1 | 2, luogo: string) => boolean

  /** Percorre una sola strada locale e consuma una delle due azioni condivise. */
  muoviAvatarMappaLocale: (giocatoreId: 1 | 2, luogo: string, nodoDestinazione: string) => boolean

  /** L'interazione chiude il turno ma mantiene il giocatore che deve completare l'attività. */
  consumaInterazioneMappaLocale: (giocatoreId: 1 | 2, luogo: string) => boolean

  /** Attiva il prossimo turno, anche se già accodato da un'interazione nel luogo. */
  passaTurnoMappaLocale: () => boolean

  /** Reset completo del gioco (Nuova Partita) */
  reset: () => void
}

export const STARTER_IDS = [1, 5, 9] as const

const posizioneIniziale = () => mainMapPosition()
const posizioneMappaPrincipale = mainMapPosition

function luogoMappaPrincipale(posizione: PosizioneAvatar): string {
  return posizione.mappaId === 'mappa-principale'
    ? posizione.luogo ?? MAIN_MAP_START_NODE
    : MAIN_MAP_START_NODE
}

function puoAccedereAlLuogoSegreto(state: GameState, giocatoreId: 1 | 2): boolean {
  return canAccessSecretLocation(
    state[giocatoreId === 1 ? 'giocatore1' : 'giocatore2'],
    state[giocatoreId === 1 ? 'posizione1' : 'posizione2'],
  )
}

function navigazioneSegretaConsentita(state: GameState, scena: NavigazioneScena): boolean {
  return scena.payload?.luogo !== SECRET_LOCATION_ID
    || (scena.scena === 'percorso' && puoAccedereAlLuogoSegreto(state, state.giocatoreAttivo))
}

/**
 * Cerca il primo slot libero nel deposito (box × slot).
 * Il deposito ha 30 box × 35 slot, identici a Excel.
 */
function trovaSlotDepositoLibero(deposito: Record<string, PokemonIstanza>): string | null {
  for (let box = 1; box <= 30; box++) {
    for (let slot = 1; slot <= 35; slot++) {
      const chiave = `${box}:${slot}`
      if (!deposito[chiave]) return chiave
    }
  }
  return null
}

export function haSpazioPokemon(giocatore: StatoGiocatore): boolean {
  return giocatore.squadra.length < 6 || trovaSlotDepositoLibero(giocatore.deposito) !== null
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      giocatore1: giocatoreVuoto(1),
      giocatore2: giocatoreVuoto(2),
      giocatoreAttivo: 1,
      battaglia: null,
      rivaleStarterId: null,
      posizione1: posizioneIniziale(),
      posizione2: posizioneIniziale(),
      turnoOverworld: { giocatoreAttivo: 1, azioniRimaste: 2 },
      posizioniLocali1: {},
      posizioniLocali2: {},
      scenaCorrente: { scena: 'titolo' },
      scenaPrecedente: null,
      audioMuted: false,
      campaignRevision: 0,
      interactionProgress: emptyInteractionProgress(),
      saveRecoveryWarnings: [],
      dismissSaveRecoveryWarnings: () => set({ saveRecoveryWarnings: [] }),

      vaiAScena: (scena, payload) =>
        set((s) => !navigazioneSegretaConsentita(s, { scena, payload }) ? s : ({
          scenaPrecedente: s.scenaCorrente,
          scenaCorrente: { scena, payload },
        })),

      scenaIndietro: () =>
        set((s) =>
          s.scenaPrecedente
            && navigazioneSegretaConsentita(s, s.scenaPrecedente)
            ? { scenaCorrente: s.scenaPrecedente, scenaPrecedente: null }
            : s
        ),

      setAudioMuted: (audioMuted) => set({ audioMuted }),

      cambiaGiocatoreAttivo: () =>
        set((s) => ({ giocatoreAttivo: s.giocatoreAttivo === 1 ? 2 : 1 })),

      impostaNomeGiocatore: (giocatoreId, nome) =>
        set((s) => {
          const chiaveG = giocatoreId === 1 ? 'giocatore1' : 'giocatore2'
          return {
            [chiaveG]: {
              ...s[chiaveG],
              nome: nome.trim() || `Giocatore ${giocatoreId}`,
            },
          } as Partial<GameState>
        }),

      scegliStarter: (specieId) => {
        const state = get()
        const giocatoreId = state.giocatore1.squadra.length === 0
          ? 1
          : state.giocatore2.squadra.length === 0 ? 2 : null
        const scelti = [...state.giocatore1.squadra, ...state.giocatore2.squadra]
          .map((pokemon) => pokemon.specieId)
        if (!giocatoreId || !STARTER_IDS.some((id) => id === specieId) || scelti.includes(specieId)) {
          return false
        }
        const istanza = creaIstanza(specieId, 5)
        if (!istanza) return false
        const chiaveG = giocatoreId === 1 ? 'giocatore1' : 'giocatore2'
        const rimanenti = STARTER_IDS.filter((id) => id !== specieId && !scelti.includes(id))
        set({
          [chiaveG]: { ...state[chiaveG], squadra: [istanza] },
          giocatoreAttivo: giocatoreId === 1 ? 2 : state.turnoOverworld.giocatoreAttivo,
          ...(giocatoreId === 2 && rimanenti.length === 1 ? { rivaleStarterId: rimanenti[0] } : {}),
        } as Partial<GameState>)
        return true
      },

      aggiungiPokemon: (giocatoreId, istanza) =>
        set((s) => {
          const chiaveG = giocatoreId === 1 ? 'giocatore1' : 'giocatore2'
          const g = s[chiaveG]
          if (g.squadra.length < 6) {
            return { [chiaveG]: { ...g, squadra: [...g.squadra, istanza] } } as Partial<GameState>
          }
          // Squadra piena → deposito
          const slot = trovaSlotDepositoLibero(g.deposito)
          if (!slot) return s
          return {
            [chiaveG]: { ...g, deposito: { ...g.deposito, [slot]: istanza } },
          } as Partial<GameState>
        }),

      concludiCattura: (giocatoreId, istanza, patch, masterball = false) => {
        const state = get()
        const battle = state.battaglia
        const key = giocatoreId === 1 ? 'giocatore1' : 'giocatore2'
        const player = state[key]
        if (!battle || battle.tipo !== 'Selvatico' || battle.checkpoint?.phase === 'ended'
          || battle.pokemonB.istanzaId !== istanza.istanzaId || !haSpazioPokemon(player)
          || battle.pokemonB.hp <= 0 || patch.checkpoint?.phase !== 'ended' || patch.checkpoint.outcome !== 'vittoria'
          || (masterball && (player.inventario.masterball ?? 0) <= 0)) return false
        const slot = player.squadra.length >= 6 ? trovaSlotDepositoLibero(player.deposito) : null
        const nextPlayer = {
          ...player,
          squadra: slot ? player.squadra : [...player.squadra, istanza],
          deposito: slot ? { ...player.deposito, [slot]: istanza } : player.deposito,
          inventario: masterball
            ? { ...player.inventario, masterball: (player.inventario.masterball ?? 0) - 1 }
            : player.inventario,
        }
        set({ [key]: nextPlayer, battaglia: { ...battle, ...patch } } as Partial<GameState>)
        return true
      },

      aggiornaPokemon: (giocatoreId, istanza) =>
        set((s) => {
          const chiaveG = giocatoreId === 1 ? 'giocatore1' : 'giocatore2'
          const g = s[chiaveG]
          // Cerca prima nella squadra
          const idxSquadra = g.squadra.findIndex((p) => p.istanzaId === istanza.istanzaId)
          if (idxSquadra >= 0) {
            const nuovaSquadra = [...g.squadra]
            nuovaSquadra[idxSquadra] = istanza
            return { [chiaveG]: { ...g, squadra: nuovaSquadra } } as Partial<GameState>
          }
          // Poi nel deposito
          for (const [chiave, p] of Object.entries(g.deposito)) {
            if (p.istanzaId === istanza.istanzaId) {
              return {
                [chiaveG]: { ...g, deposito: { ...g.deposito, [chiave]: istanza } },
              } as Partial<GameState>
            }
          }
          return s
        }),

      segnaCespuglioVisitato: (giocatoreId, luogo, cespuglio) =>
        set((s) => {
          if (luogo === SECRET_LOCATION_ID && (s.giocatoreAttivo !== giocatoreId || !puoAccedereAlLuogoSegreto(s, giocatoreId))) return s
          const chiaveG = giocatoreId === 1 ? 'giocatore1' : 'giocatore2'
          const g = s[chiaveG]
          const nuovo = new Set(g.cespugliVisitati)
          nuovo.add(`${luogo}:${cespuglio}`)
          return { [chiaveG]: { ...g, cespugliVisitati: nuovo } } as Partial<GameState>
        }),

      cespuglioVisitato: (giocatoreId, luogo, cespuglio) => {
        const g = get()[giocatoreId === 1 ? 'giocatore1' : 'giocatore2']
        return g.cespugliVisitati.has(`${luogo}:${cespuglio}`)
      },

      aggiornaMonete: (giocatoreId, delta) =>
        set((s) => {
          const chiaveG = giocatoreId === 1 ? 'giocatore1' : 'giocatore2'
          const g = s[chiaveG]
          return {
            [chiaveG]: { ...g, monete: Math.max(0, g.monete + delta) },
          } as Partial<GameState>
        }),

      usaOggetto: (giocatoreId, oggettoId) => {
        const state = get()
        const chiaveG = giocatoreId === 1 ? 'giocatore1' : 'giocatore2'
        const g = state[chiaveG]
        const q = g.inventario[oggettoId] ?? 0
        if (q <= 0) return false
        set({
          [chiaveG]: {
            ...g,
            inventario: { ...g.inventario, [oggettoId]: q - 1 },
          },
        } as Partial<GameState>)
        return true
      },

      aggiungiOggetto: (giocatoreId, oggettoId, delta) =>
        set((s) => {
          const chiaveG = giocatoreId === 1 ? 'giocatore1' : 'giocatore2'
          const g = s[chiaveG]
          const q = g.inventario[oggettoId] ?? 0
          return {
            [chiaveG]: {
              ...g,
              inventario: { ...g.inventario, [oggettoId]: Math.max(0, q + delta) },
            },
          } as Partial<GameState>
        }),

      // Porting di: IniziaBattagliaAllenatore da old_files/Mod_Game_Events.txt
      iniziaBattagliaNPC: (allenatoreId, luogoRitorno) => {
        const allenatore = getAllenatore(allenatoreId)
        if (!allenatore || allenatore.squadra.length === 0) return false

        const state = get()
        if ((luogoRitorno === SECRET_LOCATION_ID || allenatore.luogo === SECRET_LOCATION_ID)
          && (!puoAccedereAlLuogoSegreto(state, state.giocatoreAttivo) || allenatore.luogo !== luogoRitorno)) return false
        const giocatore =
          state.giocatoreAttivo === 1 ? state.giocatore1 : state.giocatore2
        if (giocatore.squadra.length === 0) return false
        if (giocatore.allenatoriSconfitti.has(allenatoreId)) return false
        const pokemonA = giocatore.squadra.find((p) => p.hp > 0)
        if (!pokemonA) return false

        // Per il Rivale (tipo PVP), il primo slot è lo starter scartato
        // dai giocatori (porting di AssegnaRivaleEVaiAllaMappa).
        const isRivale = allenatore.tipo === 'PVP'
        const slotsAllenatore = allenatore.squadra.map((s, i) =>
          isRivale && i === 0 && state.rivaleStarterId
            ? { ...s, pokemonId: state.rivaleStarterId }
            : s
        )

        // Crea istanze fresche per tutta la squadra dell'allenatore
        const squadraB: PokemonIstanza[] = []
        for (let i = 0; i < slotsAllenatore.length; i++) {
          const slot = slotsAllenatore[i]
          const speci = getPokemon(slot.pokemonId)
          if (!speci) continue
          const ist: PokemonIstanza = {
            istanzaId: `npc-${allenatoreId}-${i}-${Date.now()}`,
            specieId: slot.pokemonId,
            nome: speci.nome,
            livello: slot.livello,
            hp: 0,
            xp: 0,
          }
          ist.hp = calcolaHPMax(ist)
          squadraB.push(ist)
        }
        if (squadraB.length === 0) return false

        const pokemonB = squadraB[0]
        const turnoCorrente = determinaIniziativa(pokemonA.livello, pokemonB.livello, Math.random, pokemonA.stato?.tipo, pokemonB.stato?.tipo)
        const tipo = allenatore.tipo === 'PVP' ? 'PVP' : 'NPC'

        set({
          battaglia: {
            tipo,
            pokemonA,
            pokemonB,
            hpMaxA: calcolaHPMax(pokemonA),
            hpMaxB: calcolaHPMax(pokemonB),
            turnoCorrente,
            squadraA: giocatore.squadra,
            squadraB,
            luogoRitorno,
            allenatoreId,
            log: [`${allenatore.nome} ti sfida!`],
            evoluzioneInAttesa: null,
          },
        })
        return true
      },

      risolviBattagliaNPC: (esito) => {
        const state = get()
        const b = state.battaglia
        if (!b || b.allenatoreId === undefined || b.tipo === 'Selvatico' || b.ricompenseApplicate) return

        // tipoAvv per il calcolo monete: derivato da allenatore.tipo
        // (Capopalestra → +1000, NPC → +200, PVP → 0)
        const allenatore = getAllenatore(b.allenatoreId)
        const tipoAvv: TipoAvversario =
          allenatore?.tipo === 'Capopalestra'
            ? 'Capopalestra'
            : allenatore?.tipo === 'PVP'
            ? 'PVP'
            : 'NPC'
        const delta = calcolaVariazioneMonete(esito, tipoAvv)
        const giocatoreId = state.giocatoreAttivo
        const chiaveG = giocatoreId === 1 ? 'giocatore1' : 'giocatore2'
        const g = state[chiaveG]

        const nuoviSconfitti = new Set(g.allenatoriSconfitti)
        if (esito === 'vittoria') nuoviSconfitti.add(b.allenatoreId)

        set({
          battaglia: { ...b, ricompenseApplicate: true },
          [chiaveG]: {
            ...g,
            monete: Math.max(0, g.monete + delta),
            allenatoriSconfitti: nuoviSconfitti,
          },
        } as Partial<GameState>)
      },

      curaSquadra: (giocatoreId) =>
        set((s) => {
          const chiaveG = giocatoreId === 1 ? 'giocatore1' : 'giocatore2'
          const g = s[chiaveG]
          const squadraCurata = g.squadra.map((p) => {
            const { stato: _stato, ...senzaStato } = p
            return { ...senzaStato, hp: calcolaHPMax(senzaStato) }
          })
          return { [chiaveG]: { ...g, squadra: squadraCurata } } as Partial<GameState>
        }),

      // Porting di: EseguiScambioDati da old_files/Mod_Deposito.txt
      scambiaSlot: (giocatoreId, source, target) =>
        set((s) => {
          const chiaveG = giocatoreId === 1 ? 'giocatore1' : 'giocatore2'
          const g = s[chiaveG]
          const r = scambia(g.squadra, g.deposito, source, target)
          if (r.squadra === g.squadra && r.deposito === g.deposito) return s
          return {
            [chiaveG]: { ...g, squadra: r.squadra, deposito: r.deposito },
          } as Partial<GameState>
        }),
      // Porting di: AssegnaRivaleEVaiAllaMappa da old_files/Mod_Game_Events.txt
      assegnaRivaleStarter: (specieId) => set({ rivaleStarterId: specieId }),

      iniziaBattaglia: (battaglia) => {
        const state = get()
        if (battaglia.luogoRitorno === SECRET_LOCATION_ID && !puoAccedereAlLuogoSegreto(state, state.giocatoreAttivo)) return
        set({ battaglia })
      },

      aggiornaBattaglia: (patch) =>
        set((s) => (s.battaglia ? { battaglia: { ...s.battaglia, ...patch } } : s)),

      terminaBattaglia: (curaCompleta) =>
        set((s) => {
          const final = finalizeConfiguredBattle(s)
          const giocatore1 = final.giocatore1 ?? s.giocatore1
          const giocatore2 = final.giocatore2 ?? s.giocatore2
          const pulisciSquadra = (squadra: PokemonIstanza[]) =>
            squadra.map((p) => {
              const specie = getPokemon(p.specieId)
              if (!specie) return p
              if (!curaCompleta && p.stato?.tipo === 'Paralizzato') return p
              const { stato: _stato, ...senzaStato } = p
              return curaCompleta
                ? { ...senzaStato, hp: calcolaHPMax(senzaStato) }
                : senzaStato
            })
          const pulisciDeposito = (deposito: Record<string, PokemonIstanza>) =>
            Object.fromEntries(
              Object.entries(deposito).map(([slot, p]) => {
                if (!curaCompleta && p.stato?.tipo === 'Paralizzato') return [slot, p]
                const { stato: _stato, ...senzaStato } = p
                return [slot, senzaStato]
              })
            )
          return {
            ...final,
            battaglia: null,
            giocatore1: {
              ...giocatore1,
              squadra: pulisciSquadra(giocatore1.squadra),
              deposito: pulisciDeposito(giocatore1.deposito),
            },
            giocatore2: {
              ...giocatore2,
              squadra: pulisciSquadra(giocatore2.squadra),
              deposito: pulisciDeposito(giocatore2.deposito),
            },
          }
        }),

      eseguiInterazioneConfigurata: (giocatoreId, interactionId) => {
        const definition = useInteractionStore.getState().interactions.find((entry) => entry.id === interactionId)
        const result = resolveConfiguredInteraction(get(), definition, giocatoreId)
        if (result.ok && result.patch) set(result.patch)
        return { ok: result.ok, message: result.message }
      },

      // ----------------------------------------------------------------
      // OVERWORLD (Fase E)
      // ----------------------------------------------------------------

      muoviAvatar: (giocatoreId, nuovaPos, mappa) => {
        const state = get()
        const chiavePos = giocatoreId === 1 ? 'posizione1' : 'posizione2'
        const da = state[chiavePos]
        if (mappa.id === SECRET_LOCATION_ID || nuovaPos.luogo === SECRET_LOCATION_ID || isSecretLocationPosition(da)) return false
        if (state.turnoOverworld.giocatoreAttivo !== giocatoreId) return false
        if (state.turnoOverworld.azioniRimaste <= 0) return false
        if (nuovaPos.mappaId !== mappa.id) return false
        if (!puòMuoversi(da, { x: nuovaPos.x, y: nuovaPos.y }, mappa)) return false

        const turnoNuovo = consumaAzione(state.turnoOverworld, 'movimento')
        const turnoFinale =
          turnoNuovo.azioniRimaste <= 0 ? nuovoTurno(giocatoreId) : turnoNuovo

        set({
          [chiavePos]: nuovaPos,
          turnoOverworld: turnoFinale,
        } as Partial<GameState>)
        return true
      },

      interagisciCasella: (giocatoreId, mappa, x, y) => {
        const state = get()
        if (state.turnoOverworld.giocatoreAttivo !== giocatoreId) {
          return { tipo: 'no-op' }
        }
        if (state.turnoOverworld.azioniRimaste <= 0) return { tipo: 'no-op' }
        const posizione = state[giocatoreId === 1 ? 'posizione1' : 'posizione2']
        if (mappa.id === SECRET_LOCATION_ID || isSecretLocationPosition(posizione)) return { tipo: 'no-op' }
        if (posizione.mappaId !== mappa.id || Math.abs(posizione.x - x) + Math.abs(posizione.y - y) !== 1) {
          return { tipo: 'no-op' }
        }
        const casella: Casella | undefined = mappa.caselle[y]?.[x]
        if (!casella) return { tipo: 'no-op' }

        const chiaveG = giocatoreId === 1 ? 'giocatore1' : 'giocatore2'
        const g = state[chiaveG]
        const r = risultatoInterazione(
          mappa.id,
          x,
          y,
          casella,
          giocatoreId,
          {
            caselleConsumate: g.caselleConsumate,
            allenatoriSconfitti: g.allenatoriSconfitti,
          }
        )
        if (r.tipo === 'no-op') return r
        if (r.tipo === 'transizione-mappa' && r.versoMappaId === SECRET_LOCATION_ID) return { tipo: 'no-op' }

        // Marca la casella come consumata se è un tipo "esauribile".
        // Edifici e uscite restano sempre interagibili.
        const chiave = chiaveCasellaConsumata(mappa.id, x, y, casella)
        const nuoveConsumate = chiave
          ? new Set(g.caselleConsumate).add(chiave)
          : g.caselleConsumate

        // Se è una transizione-mappa, sposta l'avatar sul nuovo spawn.
        const chiavePos = giocatoreId === 1 ? 'posizione1' : 'posizione2'
        const nuovaPos: PosizioneAvatar =
          r.tipo === 'transizione-mappa'
            ? {
                mappaId: r.versoMappaId,
                x: r.spawnX,
                y: r.spawnY,
                direzione: state[chiavePos].direzione,
              }
            : state[chiavePos]

        // Interazione consuma l'intero turno → swap immediato.
        const turnoFinale = nuovoTurno(giocatoreId)

        set({
          [chiaveG]: { ...g, caselleConsumate: nuoveConsumate },
          [chiavePos]: nuovaPos,
          turnoOverworld: turnoFinale,
        } as Partial<GameState>)
        return r
      },

      passaTurnoOverworld: () =>
        set((s) => {
          if (s.battaglia) return s
          const turnoOverworld = nuovoTurno(s.turnoOverworld.giocatoreAttivo)
          return {
            turnoOverworld,
            giocatoreAttivo: turnoOverworld.giocatoreAttivo,
          }
        }),

      muoviAvatarMappaPrincipale: (giocatoreId, luogoDestinazione) => {
        const state = get()
        if (state.battaglia) return false
        const chiavePos = giocatoreId === 1 ? 'posizione1' : 'posizione2'
        const posizione = state[chiavePos]
        const luogoCorrente = luogoMappaPrincipale(posizione)

        if (state.turnoOverworld.giocatoreAttivo !== giocatoreId) return false
        if (state.turnoOverworld.azioniRimaste <= 0) return false
        if (luogoCorrente === SECRET_LOCATION_ID || luogoDestinazione === SECRET_LOCATION_ID) {
          const giocatore = state[giocatoreId === 1 ? 'giocatore1' : 'giocatore2']
          if (state.battaglia || state.giocatoreAttivo !== giocatoreId
            || posizione.mappaId !== 'mappa-principale'
            || !hasUnlockedSecretLocation(giocatore)
            || !isSecretLocationConnection(luogoCorrente, luogoDestinazione)) return false
        } else if (!areMainMapNodesConnected(luogoCorrente, luogoDestinazione)) return false

        set({
          [chiavePos]: posizioneMappaPrincipale(luogoDestinazione),
          giocatoreAttivo: giocatoreId,
          turnoOverworld: {
            ...state.turnoOverworld,
            azioniRimaste: state.turnoOverworld.azioniRimaste - 1,
          },
        } as Partial<GameState>)
        return true
      },

      attraversaPassaggioSegreto: (giocatoreId) => {
        const state = get()
        const posizione = state[giocatoreId === 1 ? 'posizione1' : 'posizione2']
        if (posizione.mappaId !== 'mappa-principale'
          || (posizione.luogo !== SECRET_LOCATION_ORIGIN && posizione.luogo !== SECRET_LOCATION_ID)) return false
        const destinazione = posizione.luogo === SECRET_LOCATION_ORIGIN ? SECRET_LOCATION_ID : SECRET_LOCATION_ORIGIN
        if (!state.muoviAvatarMappaPrincipale(giocatoreId, destinazione)) return false
        get().inizializzaPosizioneLocale(giocatoreId, destinazione)
        get().vaiAScena(destinazione === SECRET_LOCATION_ID ? 'percorso' : 'citta', { luogo: destinazione })
        return true
      },

      interagisciLuogoMappaPrincipale: (giocatoreId) => {
        const state = get()
        if (state.battaglia) return { tipo: 'no-op' }
        const chiavePos = giocatoreId === 1 ? 'posizione1' : 'posizione2'
        const posizione = state[chiavePos]
        if (state.turnoOverworld.giocatoreAttivo !== giocatoreId) return { tipo: 'no-op' }
        if (state.turnoOverworld.azioniRimaste <= 0) return { tipo: 'no-op' }
        if (posizione.mappaId !== 'mappa-principale') return { tipo: 'no-op' }

        const luogo = luogoMappaPrincipale(posizione)
        if (luogo === SECRET_LOCATION_ID && !puoAccedereAlLuogoSegreto(state, giocatoreId)) return { tipo: 'no-op' }
        set({
          [chiavePos]: posizioneMappaPrincipale(luogo),
          giocatoreAttivo: giocatoreId,
          turnoOverworld: nuovoTurno(giocatoreId),
        } as Partial<GameState>)

        return { tipo: 'luogo', luogo }
      },

      inizializzaPosizioneLocale: (giocatoreId, luogo) => {
        const state = get()
        const worldPosition = state[giocatoreId === 1 ? 'posizione1' : 'posizione2']
        const map = getLocalMap(luogo)
        if (luogo === SECRET_LOCATION_ID && !puoAccedereAlLuogoSegreto(state, giocatoreId)) return null
        if (!map || worldPosition.mappaId !== 'mappa-principale' || luogoMappaPrincipale(worldPosition) !== luogo) {
          return null
        }
        const positionKey = giocatoreId === 1 ? 'posizioniLocali1' : 'posizioniLocali2'
        const nodeId = getLocalMapNode(map, state[positionKey][luogo]).id
        if (state[positionKey][luogo] !== nodeId) {
          set({ [positionKey]: { ...state[positionKey], [luogo]: nodeId } } as Partial<GameState>)
        }
        return nodeId
      },

      apriMappaLocale: (giocatoreId, luogo) => {
        const state = get()
        if (state.battaglia || state.turnoOverworld.giocatoreAttivo !== giocatoreId) return false
        if (luogo === SECRET_LOCATION_ID && state.giocatoreAttivo !== giocatoreId) return false
        if (state.inizializzaPosizioneLocale(giocatoreId, luogo) === null) return false
        set({ giocatoreAttivo: giocatoreId })
        return true
      },

      muoviAvatarMappaLocale: (giocatoreId, luogo, nodoDestinazione) => {
        const state = get()
        const map = getLocalMap(luogo)
        const positionKey = giocatoreId === 1 ? 'posizioniLocali1' : 'posizioniLocali2'
        const worldPosition = state[giocatoreId === 1 ? 'posizione1' : 'posizione2']
        if (luogo === SECRET_LOCATION_ID && !puoAccedereAlLuogoSegreto(state, giocatoreId)) return false
        if (!map || state.battaglia || state.giocatoreAttivo !== giocatoreId
          || state.turnoOverworld.giocatoreAttivo !== giocatoreId || state.turnoOverworld.azioniRimaste <= 0
          || worldPosition.mappaId !== 'mappa-principale' || luogoMappaPrincipale(worldPosition) !== luogo) {
          return false
        }
        const from = getLocalMapNode(map, state[positionKey][luogo]).id
        if (!canMoveOnLocalMap(map, from, nodoDestinazione)) return false
        set({
          [positionKey]: { ...state[positionKey], [luogo]: nodoDestinazione },
          turnoOverworld: consumaAzione(state.turnoOverworld, 'movimento'),
        } as Partial<GameState>)
        return true
      },

      consumaInterazioneMappaLocale: (giocatoreId, luogo) => {
        const state = get()
        const worldPosition = state[giocatoreId === 1 ? 'posizione1' : 'posizione2']
        if (luogo === SECRET_LOCATION_ID && !puoAccedereAlLuogoSegreto(state, giocatoreId)) return false
        if (state.battaglia || !getLocalMap(luogo) || state.giocatoreAttivo !== giocatoreId
          || state.turnoOverworld.giocatoreAttivo !== giocatoreId || state.turnoOverworld.azioniRimaste <= 0
          || worldPosition.mappaId !== 'mappa-principale' || luogoMappaPrincipale(worldPosition) !== luogo) {
          return false
        }
        set({ turnoOverworld: nuovoTurno(giocatoreId) })
        return true
      },

      passaTurnoMappaLocale: () => {
        const state = get()
        if (state.battaglia) return false
        const turnoOverworld = state.giocatoreAttivo !== state.turnoOverworld.giocatoreAttivo
          ? state.turnoOverworld
          : nuovoTurno(state.giocatoreAttivo)
        set({ turnoOverworld, giocatoreAttivo: turnoOverworld.giocatoreAttivo })
        return true
      },

      reset: () =>
        set((s) => ({
          campaignRevision: s.campaignRevision + 1,
          giocatore1: giocatoreVuoto(1),
          giocatore2: giocatoreVuoto(2),
          giocatoreAttivo: 1,
          battaglia: null,
          rivaleStarterId: null,
          posizione1: posizioneIniziale(),
          posizione2: posizioneIniziale(),
          turnoOverworld: { giocatoreAttivo: 1, azioniRimaste: 2 },
          posizioniLocali1: {},
          posizioniLocali2: {},
          scenaCorrente: { scena: 'titolo' },
          scenaPrecedente: null,
          saveRecoveryWarnings: [],
          interactionProgress: emptyInteractionProgress(),
        })),
    }),
    {
      name: GAME_SAVE_STORAGE_KEY,
      partialize: (state) => serializeGameState(state) as unknown as GameState,
      merge: (persisted, current) => {
        const recovered = normalizeGameSave(persisted, current)
        return { ...current, ...recovered.state, saveRecoveryWarnings: recovered.warnings }
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) queueMicrotask(() => {
          const storage = useGameStore.persist.getOptions().storage
          if (storage) useGameStore.persist.setOptions({ storage: { ...storage, setItem: () => undefined } })
          try {
            useGameStore.setState({ saveRecoveryWarnings: [
              'Il salvataggio non è leggibile. Importa un backup per recuperare i progressi, oppure avvia una nuova partita.',
            ] })
          } finally {
            if (storage) useGameStore.persist.setOptions({ storage })
          }
        })
        else if (state?.saveRecoveryWarnings.length) {
          // Recovery details stay in memory until the player acknowledges them.
        }
      },
    }
  )
)

// =====================================================
// HELPER per creare istanze
// =====================================================

let istanzaCounter = 0
export function creaIstanza(specieId: number, livello: number): PokemonIstanza | null {
  const specie = getPokemon(specieId)
  if (!specie) return null
  const istanza: PokemonIstanza = {
    istanzaId: `pkmn-${Date.now()}-${++istanzaCounter}`,
    specieId,
    nome: specie.nome,
    livello,
    hp: 0, // popolato sotto
    xp: 0,
  }
  istanza.hp = calcolaHPMax(istanza)
  return istanza
}
