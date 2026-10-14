/**
 * Store globale dell'applicazione (Zustand).
 *
 * Sostituisce i fogli Excel `Stato_Giocatore`, `Battaglia_Corrente`,
 * `Giocatore1_Squadra`, `Giocatore2_Squadra`, etc.
 *
 * Persiste automaticamente su localStorage tra sessioni.
 */
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { normalizeChallengeContext, scopedGameStorage, type ChallengeContext } from '@/challenges/challengePersistence'
import { emptyPlayer as giocatoreVuoto, mainMapPosition, normalizeGameSave, serializeGameState, GAME_SAVE_STORAGE_KEY, type GameSaveState } from '@/save/gamePersistence'
import { emptyInteractionProgress } from '@/interactions/types'
import { useInteractionStore } from '@/interactions/interactionStore'
import { finalizeConfiguredBattle, resolveConfiguredInteraction } from '@/interactions/runtime'
import { emptyArkadexProgress } from '@/arkadex/arkadexModel'
import { appendMatchEvent, emptyMatchLog } from '@/match/matchLog'
import { trackGameChange } from '@/match/trackGameChange'
import { canJoinTeam, isTeamWithinLevelCap, teamCapMessage, teamLevelRange } from '@/engine/teamLevelCap'
import { getOwnedPokemon, hasOwnedPokemon } from '@/engine/pokemonOwnership'
import { rememberRecoveryCopy, reportSaveFailure, useSaveWriteStatus } from '@/save/durableWrites'
import { resolveShopPurchase, type ShopPurchaseResult } from '@/shop/purchase'
import { getShopItem, isShopItemId, MAX_ITEM_QUANTITY, type ShopCart } from '@/shop/catalog'
import { resolveItemEffect } from '@/shop/itemEffects'
import { emptyLeagueState, emptyLeagueProgress, isLeagueTurnLocked, leagueConfigurationProblems, leagueOpponents, makeLeagueBattle, normalizeLeagueConfiguration, type LeagueConfiguration } from '@/league/leagueModel'
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
  clearStoredExperience,
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
  configuraLega: (configuration: LeagueConfiguration) => { ok: boolean; message: string }
  iniziaLega: () => { ok: boolean; message: string }
  prossimoIncontroLega: () => { ok: boolean; message: string }
  concludiBattagliaLega: (esito: EsitoBattaglia, squadra: PokemonIstanza[], evoluzioni?: { istanzaId: string; oldSpecieId: number; newSpecieId: number }[]) => { ok: boolean; message: string }
  usaOggettoLega: (itemId: OggettoId, instanceId: string) => { ok: boolean; message: string }
  abbandonaLega: () => { ok: boolean; message: string }
  /** Publish a compound action only after its complete checkpoint is durable. */
  eseguiTransazione: (operation: (read: () => GameState) => void) => boolean
  aggiornaStato: (patch: Partial<GameSaveState> & { teamRuleMessage?: string | null }) => boolean
  challengeContext: ChallengeContext | null
  teamRuleMessage: string | null
  dismissTeamRuleMessage: () => void
  acquistaOggetti: (playerId: 1 | 2, cart: ShopCart, location: string, shopInteractionId?: string) => ShopPurchaseResult
  applicaOggetto: (playerId: 1 | 2, itemId: OggettoId, instanceId: string) => { ok: boolean; message: string }
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
  usaOggetto: (giocatoreId: 1 | 2, oggettoId: OggettoId, battlePatch?: Partial<StatoBattaglia>) => boolean

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

function clearBattleExperience(battle: StatoBattaglia): StatoBattaglia {
  return { ...battle, pokemonA: clearStoredExperience(battle.pokemonA), pokemonB: clearStoredExperience(battle.pokemonB),
    ...(battle.squadraA ? { squadraA: battle.squadraA.map(clearStoredExperience) } : {}),
    ...(battle.squadraB ? { squadraB: battle.squadraB.map(clearStoredExperience) } : {}),
  }
}

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

export function haSpazioPokemon(giocatore: StatoGiocatore, target?: PokemonIstanza): boolean {
  const canUseTeam = target ? canJoinTeam(giocatore.squadra, target) : giocatore.squadra.length < 6
  return canUseTeam || trovaSlotDepositoLibero(giocatore.deposito) !== null
}

export const useGameStore = create<GameState>()(
  persist(
    (rawSet, getRaw) => {
      let staged: GameState | null = null
      let retryingWrite = false
      const get = (): GameState => staged ?? getRaw()
      const set = (update: Parameters<typeof rawSet>[0], replace?: boolean): boolean => {
        const previous = get()
        const patch = typeof update === 'function' ? update(previous) : update
        if (patch === previous) return true
        if (staged) { staged = { ...staged, ...patch }; return true }
        return commitDurable(patch, false, replace)
      }
      const publish = (state: GameState, replace?: boolean) => {
        const storage = useGameStore.persist?.getOptions().storage
        if (storage) useGameStore.persist.setOptions({ storage: { ...storage, setItem: () => undefined } })
        try { rawSet(state, replace) } finally { if (storage) useGameStore.persist.setOptions({ storage }) }
      }
      const commitDurable = (patch: Partial<GameState>, local = false, replace?: boolean): boolean => {
        if (staged) { staged = { ...staged, ...patch }; return true }
        const pendingWrite = useSaveWriteStatus.getState()
        // Background checkpoint effects must not replace an unsaved action.
        if (!retryingWrite && pendingWrite.error && !pendingWrite.local) return false
        const previous = get(), next = { ...previous, ...patch }
        const tracked = next.challengeContext ? next : { ...next, ...trackGameChange(previous, next) }
        const options = useGameStore.persist?.getOptions(), storage = options?.storage
        const previousSave = { ...serializeGameState(previous), ...(previous.challengeContext ? { challengeContext: previous.challengeContext } : {}) }
        const saved = { ...serializeGameState(tracked), ...(tracked.challengeContext ? { challengeContext: tracked.challengeContext } : {}) }
        const baseline = JSON.stringify(previousSave)
        if (baseline === JSON.stringify(saved)) { publish(tracked, replace); return true }
        const failed = () => {
          reportSaveFailure(() => {
            const current = get()
            const currentSaved = { ...serializeGameState(current), ...(current.challengeContext ? { challengeContext: current.challengeContext } : {}) }
            if (current.campaignRevision !== previous.campaignRevision || JSON.stringify(currentSaved) !== baseline) { useSaveWriteStatus.getState().clear(); return false }
            retryingWrite = true
            try { return commitDurable(patch, local, replace) } finally { retryingWrite = false }
          }, local, () => publish({ ...getRaw(), campaignRevision: getRaw().campaignRevision + 1 }))
          return false
        }
        if (!storage) { if (typeof window !== 'undefined') return failed(); publish(tracked, replace); return true }
        try {
          const result = storage.setItem(options?.name ?? GAME_SAVE_STORAGE_KEY, { state: saved as unknown as GameState, version: 0 })
          if (result instanceof Promise) { void result.catch(() => {}); return failed() }
          if (!previous.challengeContext && !tracked.challengeContext && typeof window !== 'undefined' && typeof localStorage !== 'undefined') rememberRecoveryCopy(previous)
          // A retried battle action must rebuild its scene from the checkpoint;
          // the failed action's local HP/messages are not authoritative.
          publish(retryingWrite && !local && tracked.scenaCorrente.scena === 'battaglia'
            ? { ...tracked, campaignRevision: tracked.campaignRevision + 1 } : tracked, replace)
          useSaveWriteStatus.getState().clear()
          return true
        } catch { return failed() }
      }
      return ({
      aggiornaStato: (patch) => set(patch),
      eseguiTransazione: (operation) => {
        if (staged) { operation(get); return true }
        const previous = getRaw()
        staged = previous
        let candidate: GameState
        try { operation(get); candidate = staged } finally { staged = null }
        return candidate === previous ? true : commitDurable(candidate)
      },
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
      challengeContext: null,
      league: emptyLeagueState(),
      interactionProgress: emptyInteractionProgress(),
      arkadex: emptyArkadexProgress(), matchLog: emptyMatchLog(),
      teamRuleMessage: null,
      dismissTeamRuleMessage: () => set({ teamRuleMessage: null }),
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
        set((s) => isLeagueTurnLocked(s.league) ? s : ({ giocatoreAttivo: s.giocatoreAttivo === 1 ? 2 : 1 })),

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
        const giocatoreId = !hasOwnedPokemon(state.giocatore1)
          ? 1
          : !hasOwnedPokemon(state.giocatore2) ? 2 : null
        const scelti = [...getOwnedPokemon(state.giocatore1), ...getOwnedPokemon(state.giocatore2)]
          .map((pokemon) => pokemon.specieId)
        if (!giocatoreId || !STARTER_IDS.some((id) => id === specieId) || scelti.includes(specieId)) {
          return false
        }
        const istanza = creaIstanza(specieId, 5)
        if (!istanza) return false
        const chiaveG = giocatoreId === 1 ? 'giocatore1' : 'giocatore2'
        const rimanenti = STARTER_IDS.filter((id) => id !== specieId && !scelti.includes(id))
        return set({
          [chiaveG]: { ...state[chiaveG], squadra: [istanza] },
          giocatoreAttivo: giocatoreId === 1 ? 2 : state.turnoOverworld.giocatoreAttivo,
          ...(giocatoreId === 2 && rimanenti.length === 1 ? { rivaleStarterId: rimanenti[0] } : {}),
        } as Partial<GameState>)
      },

      aggiungiPokemon: (giocatoreId, creature) =>
        set((s) => {
          const istanza = clearStoredExperience(creature)
          const chiaveG = giocatoreId === 1 ? 'giocatore1' : 'giocatore2'
          const g = s[chiaveG]
          if ([...g.squadra, ...Object.values(g.deposito)].some((pokemon) => pokemon.istanzaId === istanza.istanzaId)) return s
          if (canJoinTeam(g.squadra, istanza)) {
            return { [chiaveG]: { ...g, squadra: [...g.squadra, istanza] } } as Partial<GameState>
          }
          // Squadra piena → deposito
          const slot = trovaSlotDepositoLibero(g.deposito)
          if (!slot) return s
          return {
            [chiaveG]: { ...g, deposito: { ...g.deposito, [slot]: istanza } },
          } as Partial<GameState>
        }),

      concludiCattura: (giocatoreId, creature, patch, masterball = false) => {
        const istanza = clearStoredExperience(creature)
        const state = get()
        const battle = state.battaglia
        const key = giocatoreId === 1 ? 'giocatore1' : 'giocatore2'
        const player = state[key]
        if (!battle || battle.tipo !== 'Selvatico' || battle.checkpoint?.phase === 'ended'
          || battle.pokemonB.istanzaId !== istanza.istanzaId || !haSpazioPokemon(player, istanza)
          || battle.pokemonB.hp <= 0 || patch.checkpoint?.phase !== 'ended' || patch.checkpoint.outcome !== 'vittoria'
          || (masterball && (player.inventario.masterball ?? 0) <= 0)) return false
        const eligible = canJoinTeam(player.squadra, istanza)
        const slot = !eligible ? trovaSlotDepositoLibero(player.deposito) : null
        if (!eligible && !slot) return false
        const nextPlayer = {
          ...player,
          squadra: slot ? player.squadra : [...player.squadra, istanza],
          deposito: slot ? { ...player.deposito, [slot]: istanza } : player.deposito,
          inventario: masterball
            ? { ...player.inventario, masterball: (player.inventario.masterball ?? 0) - 1 }
            : player.inventario,
        }
        return commitDurable({ [key]: nextPlayer, battaglia: clearBattleExperience({ ...battle, ...patch }) } as Partial<GameState>, true)
      },

      aggiornaPokemon: (giocatoreId, creature) =>
        set((s) => {
          const istanza = clearStoredExperience(creature)
          const chiaveG = giocatoreId === 1 ? 'giocatore1' : 'giocatore2'
          const g = s[chiaveG]
          // Cerca prima nella squadra
          const idxSquadra = g.squadra.findIndex((p) => p.istanzaId === istanza.istanzaId)
          if (idxSquadra >= 0) {
            const nuovaSquadra = [...g.squadra]
            nuovaSquadra[idxSquadra] = istanza
            if (teamLevelRange(nuovaSquadra).gap > Math.max(5, teamLevelRange(g.squadra).gap)) return { teamRuleMessage: teamCapMessage(nuovaSquadra) }
            return { [chiaveG]: { ...g, squadra: nuovaSquadra },
              ...(s.league.winner?.playerId === giocatoreId && s.scenaCorrente.scena === 'evoluzione'
                ? { league: { ...s.league, winner: { ...s.league.winner, team: s.league.winner.team.map((p) => p.istanzaId === istanza.istanzaId ? istanza : p) } } } : {}),
            } as Partial<GameState>
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

      usaOggetto: (giocatoreId, oggettoId, battlePatch) => {
        if (!isShopItemId(oggettoId)) return false
        const state = get()
        const chiaveG = giocatoreId === 1 ? 'giocatore1' : 'giocatore2'
        const g = state[chiaveG]
        const q = g.inventario[oggettoId] ?? 0
        if (battlePatch && (!state.battaglia || state.battaglia.checkpoint?.outcome || state.giocatoreAttivo !== giocatoreId)) return false
        if (q <= 0) return false
        const written = commitDurable({
          ...(battlePatch ? { battaglia: { ...state.battaglia!, ...battlePatch } } : {}),
          [chiaveG]: {
            ...g,
            inventario: { ...g.inventario, [oggettoId]: q - 1 },
          },
        } as Partial<GameState>)
        return written
      },

      aggiungiOggetto: (giocatoreId, oggettoId, delta) =>
        set((s) => {
          if (!isShopItemId(oggettoId) || !Number.isSafeInteger(delta)) return s
          const chiaveG = giocatoreId === 1 ? 'giocatore1' : 'giocatore2'
          const g = s[chiaveG]
          const q = g.inventario[oggettoId] ?? 0
          return {
            [chiaveG]: {
              ...g,
              inventario: { ...g.inventario, [oggettoId]: Math.min(MAX_ITEM_QUANTITY, Math.max(0, q + delta)) },
            },
          } as Partial<GameState>
        }),

      // Porting di: IniziaBattagliaAllenatore da old_files/Mod_Game_Events.txt
      acquistaOggetti: (playerId, cart, location, shopInteractionId) => {
        const result = resolveShopPurchase(get(), playerId, cart, location, { interactionId: shopInteractionId, interactions: useInteractionStore.getState().interactions })
        if (result.ok && result.patch && !commitDurable(result.patch)) return { ok: false, message: 'Acquisto non salvato: spazio del browser esaurito o bloccato. Monete e borsa restano intatte.' }
        return result
      },
      applicaOggetto: (playerId, itemId, instanceId) => {
        const state = get(), key = playerId === 1 ? 'giocatore1' : 'giocatore2', player = state[key]
        if (state.league.players[state.giocatoreAttivo].status === 'running' && !state.battaglia) {
          return playerId === state.giocatoreAttivo ? state.usaOggettoLega(itemId, instanceId) : { ok: false, message: 'La Lega è riservata al giocatore in sfida.' }
        }
        if (state.battaglia || state.interactionProgress.pendingBattle) return { ok: false, message: 'Usa la Borsa della battaglia durante uno scontro.' }
        if (['titolo', 'laboratorio', 'evoluzione'].includes(state.scenaCorrente.scena)) return { ok: false, message: 'Concludi questa schermata prima di usare un oggetto.' }
        if (state.giocatoreAttivo !== playerId || state.turnoOverworld.giocatoreAttivo !== playerId || state.turnoOverworld.azioniRimaste < 1) return { ok: false, message: 'Il turno di questo giocatore è concluso.' }
        if (!isShopItemId(itemId) || (player.inventario[itemId] ?? 0) < 1) return { ok: false, message: 'Questo oggetto non è nella borsa.' }
        const pokemon = player.squadra.find((entry) => entry.istanzaId === instanceId)
        if (!pokemon) return { ok: false, message: 'Scegli un Arkamon della tua squadra.' }
        const result = resolveItemEffect(pokemon, itemId)
        if (!result.ok || !result.pokemon) return result
        const written = commitDurable({ [key]: { ...player, squadra: player.squadra.map((entry) => entry.istanzaId === instanceId ? result.pokemon! : entry),
          inventario: { ...player.inventario, [itemId]: player.inventario[itemId]! - 1 } }, turnoOverworld: nuovoTurno(playerId),
          matchLog: appendMatchEvent(state.matchLog, { kind: 'interaction', playerId, title: `Usa ${getShopItem(itemId)!.name}`, message: result.message }),
        })
        if (!written) return { ok: false, message: 'Oggetto non usato: il browser non può salvare la partita. Borsa e HP restano intatti.' }
        return { ok: true, message: `${result.message} Il turno è concluso.` }
      },
      iniziaBattagliaNPC: (allenatoreId, luogoRitorno) => {
        const allenatore = getAllenatore(allenatoreId)
        if (!allenatore || allenatore.squadra.length === 0) return false

        const state = get()
        if (isLeagueTurnLocked(state.league)) return false
        if ((luogoRitorno === SECRET_LOCATION_ID || allenatore.luogo === SECRET_LOCATION_ID)
          && (!puoAccedereAlLuogoSegreto(state, state.giocatoreAttivo) || allenatore.luogo !== luogoRitorno)) return false
        const giocatore =
          state.giocatoreAttivo === 1 ? state.giocatore1 : state.giocatore2
        if (giocatore.squadra.length === 0) return false
        if (!isTeamWithinLevelCap(giocatore.squadra)) { set({ teamRuleMessage: teamCapMessage(giocatore.squadra) }); return false }
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

        return set({
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
      },

      risolviBattagliaNPC: (esito) => {
        const state = get()
        const b = state.battaglia
        if (!b || b.leagueBattle || b.allenatoreId === undefined || b.tipo === 'Selvatico' || b.ricompenseApplicate) return

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
          if (s.league.players[1].status === 'running' || s.league.players[2].status === 'running') return s
          const chiaveG = giocatoreId === 1 ? 'giocatore1' : 'giocatore2'
          const g = s[chiaveG]
          const r = scambia(g.squadra, g.deposito, source, target)
          if (r.squadra === g.squadra && r.deposito === g.deposito) return s
          if (!isTeamWithinLevelCap(r.squadra) && !(r.squadra.length < g.squadra.length)) return { teamRuleMessage: teamCapMessage(r.squadra) }
          return {
            [chiaveG]: { ...g, squadra: r.squadra, deposito: r.deposito },
            teamRuleMessage: null,
          } as Partial<GameState>
        }),
      // Porting di: AssegnaRivaleEVaiAllaMappa da old_files/Mod_Game_Events.txt
      assegnaRivaleStarter: (specieId) => set({ rivaleStarterId: specieId }),

      iniziaBattaglia: (battaglia) => {
        const state = get()
        if (isLeagueTurnLocked(state.league)) return
        if (battaglia.luogoRitorno === SECRET_LOCATION_ID && !puoAccedereAlLuogoSegreto(state, state.giocatoreAttivo)) return
        const team = battaglia.squadraA ?? state[state.giocatoreAttivo === 1 ? 'giocatore1' : 'giocatore2'].squadra
        if (!isTeamWithinLevelCap(team)) { set({ teamRuleMessage: teamCapMessage(team) }); return }
        set({ battaglia: clearBattleExperience(battaglia) })
      },

      aggiornaBattaglia: (patch) =>
        set((s) => (s.battaglia ? { battaglia: clearBattleExperience({ ...s.battaglia, ...patch }) } : s)),

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
        if (isLeagueTurnLocked(get().league)) return { ok: false, message: 'Concludi la Lega prima di altre interazioni.' }
        const definition = useInteractionStore.getState().interactions.find((entry) => entry.id === interactionId)
        const result = resolveConfiguredInteraction(get(), definition, giocatoreId)
        if (result.patch?.battaglia && !isTeamWithinLevelCap(result.patch.battaglia.squadraA ?? [])) return { ok: false, message: teamCapMessage(result.patch.battaglia.squadraA ?? []) }
        if (result.ok && result.patch && !set(result.patch)) return { ok: false, message: 'Interazione non salvata. Costi, ricompense e azioni restano intatti.' }
        return { ok: result.ok, message: result.message }
      },

      configuraLega: (configuration) => {
        const state = get()
        if (state.challengeContext || isLeagueTurnLocked(state.league) || state.league.players[1].attempt > 0 || state.league.players[2].attempt > 0)
          return { ok: false, message: 'La configurazione della Lega resta fissa dopo il primo tentativo.' }
        const config = normalizeLeagueConfiguration(configuration)
        if (!config) return { ok: false, message: 'La configurazione della Lega non è valida.' }
        const written = set({ league: { ...state.league, config } })
        return { ok: written, message: written ? (leagueConfigurationProblems(config).length ? 'Bozza della Lega salvata: completa i dati mancanti prima di iniziare.' : 'Lega configurata: quattro incontri consecutivi nello stesso turno.') : 'Configurazione non salvata: libera spazio nel browser.' }
      },
      iniziaLega: () => {
        const state = get(), playerId = state.giocatoreAttivo, key = playerId === 1 ? 'giocatore1' : 'giocatore2', player = state[key]
        const problems = leagueConfigurationProblems(state.league.config)
        if (state.challengeContext || state.battaglia || state.interactionProgress.pendingBattle) return { ok: false, message: 'Concludi l’attività in corso prima della Lega.' }
        if (state.league.winner) return { ok: false, message: `${state.league.winner.name} ha già vinto la Lega.` }
        if (state.league.players[1].status === 'running' || state.league.players[2].status === 'running') return { ok: false, message: 'Un tentativo della Lega è già in corso.' }
        if (problems.length) return { ok: false, message: problems.join(' ') }
        const position = state[playerId === 1 ? 'posizione1' : 'posizione2']
        if (position.mappaId !== 'mappa-principale' || position.luogo !== 'Roma' || !hasUnlockedSecretLocation(player))
          return { ok: false, message: 'Raggiungi Roma e conquista tutte le otto medaglie per entrare nella Lega.' }
        if (state.turnoOverworld.giocatoreAttivo !== playerId || state.turnoOverworld.azioniRimaste < 1) return { ok: false, message: 'Il turno di questo giocatore è concluso.' }
        if (!isTeamWithinLevelCap(player.squadra)) return { ok: false, message: teamCapMessage(player.squadra) }
        const previous = state.league.players[playerId]
        if (previous.attempt >= 100_000) return { ok: false, message: 'Il numero massimo di tentativi della Lega è stato raggiunto.' }
        const restart = state.league.config!.defeat === 'restart'
        const progress = { ...(restart ? emptyLeagueProgress() : previous), status: 'running' as const,
          runId: `league-${playerId}-${previous.attempt + 1}-${Date.now()}`, attempt: previous.attempt + 1, stageCompleted: false }
        const battle = makeLeagueBattle(state.league.config!, progress, playerId, player.squadra)
        if (!battle) return { ok: false, message: 'Nessun Arkamon può combattere. Cura esplicitamente la squadra prima di entrare.' }
        const written = set({ league: { ...state.league, players: { ...state.league.players, [playerId]: progress } }, battaglia: battle,
          turnoOverworld: { giocatoreAttivo: playerId, azioniRimaste: 0 }, scenaPrecedente: { scena: 'lega' }, scenaCorrente: { scena: 'battaglia' },
          matchLog: appendMatchEvent(state.matchLog, { kind: 'battle', playerId, title: 'Ingresso nella Lega', message: `Tentativo ${progress.attempt}: quattro incontri consecutivi nello stesso turno.`, place: 'Roma' }) })
        return { ok: written, message: written ? 'La sfida della Lega ha inizio.' : 'Tentativo non salvato: la squadra resta intatta.' }
      },
      prossimoIncontroLega: () => {
        const state = get(), playerId = state.giocatoreAttivo, progress = state.league.players[playerId]
        if (state.challengeContext || state.battaglia || state.league.winner || progress.status !== 'running' || !state.league.config) return { ok: false, message: 'Non c’è un prossimo incontro pronto.' }
        const player = state[playerId === 1 ? 'giocatore1' : 'giocatore2']
        if (!isTeamWithinLevelCap(player.squadra)) return { ok: false, message: teamCapMessage(player.squadra) }
        const battle = makeLeagueBattle(state.league.config, progress, playerId, player.squadra)
        if (!battle) return { ok: false, message: 'Nessun Arkamon può combattere. Usa una cura consentita o termina il tentativo.' }
        const written = set({ battaglia: battle, league: { ...state.league, players: { ...state.league.players, [playerId]: { ...progress, stageCompleted: false } } },
          scenaCorrente: { scena: 'battaglia' }, scenaPrecedente: { scena: 'lega' }, campaignRevision: state.campaignRevision + 1 })
        return { ok: written, message: written ? 'Prossimo incontro della Lega.' : 'Incontro non salvato: riprova dopo aver liberato spazio.' }
      },
      concludiBattagliaLega: (esito, squadra, evoluzioni = []) => {
        const state = get(), battle = state.battaglia, reference = battle?.leagueBattle
        if (!reference || state.challengeContext || !state.league.config || battle?.checkpoint?.phase !== 'ended' || battle.checkpoint.outcome !== esito)
          return { ok: false, message: 'Attendi che l’esito della battaglia sia salvato prima di proseguire.' }
        const playerId = reference.playerId, progress = state.league.players[playerId], key = playerId === 1 ? 'giocatore1' : 'giocatore2'
        if (progress.status !== 'running' || progress.runId !== reference.runId || progress.nextStage !== reference.stageIndex || state.giocatoreAttivo !== playerId || state.league.winner)
          return { ok: false, message: 'Questo incontro della Lega è già stato concluso.' }
        const player = state[key], teamIds = new Set(player.squadra.map((p) => p.istanzaId))
        if (squadra.length !== player.squadra.length || new Set(squadra.map((p) => p.istanzaId)).size !== squadra.length || squadra.some((p) => !teamIds.has(p.istanzaId)))
          return { ok: false, message: 'La squadra non coincide con quella entrata nella Lega.' }
        if (squadra.some((p) => !getPokemon(p.specieId) || !Number.isSafeInteger(p.livello) || p.livello < 5 || p.livello > 100
          || !Number.isFinite(p.hp) || p.hp < 0 || p.hp > calcolaHPMax(p)) || !isTeamWithinLevelCap(squadra))
          return { ok: false, message: 'La squadra non ha un risultato valido per la Lega.' }
        const total = leagueOpponents(state.league.config).length
        const nextStage = esito === 'vittoria' ? progress.nextStage + 1 : progress.nextStage
        const completed = esito === 'vittoria' && nextStage === total
        const next = { ...progress, nextStage, status: completed ? 'completed' as const : esito === 'sconfitta' ? 'defeated' as const : 'running' as const,
          completedStages: esito === 'vittoria' ? [...progress.completedStages, reference.stageIndex] : progress.completedStages, stageCompleted: esito === 'vittoria' }
        const team = squadra.map(clearStoredExperience).map((p) => {
          if (p.stato?.tipo === 'Paralizzato') return p
          const { stato: _status, ...clean } = p
          return clean
        })
        const winner = completed ? { playerId, name: player.nome, team: team.map((p) => ({ ...p })), runId: reference.runId, completedAt: new Date().toISOString() } : null
        const written = set({ battaglia: null, [key]: { ...player, squadra: team },
          league: { ...state.league, players: { ...state.league.players, [playerId]: next }, winner },
          turnoOverworld: esito === 'sconfitta' ? nuovoTurno(playerId) : { giocatoreAttivo: playerId, azioniRimaste: 0 },
          ...(esito === 'sconfitta' ? { giocatoreAttivo: playerId === 1 ? 2 : 1 } : {}),
          scenaCorrente: evoluzioni.length ? { scena: 'evoluzione', payload: { evoluzioni, luogoRitorno: 'lega', giocatoreId: playerId } } : { scena: 'lega', payload: { playerId } },
          scenaPrecedente: null,
          matchLog: appendMatchEvent(state.matchLog, { id: `${reference.runId}-${reference.stageIndex}-result`, kind: 'battle', playerId,
            title: completed ? `${player.nome} è Campione della regione` : esito === 'vittoria' ? `Lega: incontro ${nextStage}/${total} vinto` : 'Lega: tentativo concluso',
            message: completed ? 'La corsa alla Lega è conclusa. La squadra del Campione resta nel registro.' : esito === 'vittoria' ? 'Gli HP residui restano nella squadra. Il prossimo incontro usa lo stesso turno.' : 'Gli HP residui restano nella squadra. Il turno passa all’altro giocatore.', place: 'Roma' }) })
        return { ok: written, message: written ? (completed ? `${player.nome} ha vinto la Lega!` : 'Risultato della Lega salvato.') : 'Risultato non salvato: resta su questa schermata e riprova.' }
      },
      usaOggettoLega: (itemId, instanceId) => {
        const state = get(), playerId = state.giocatoreAttivo, key = playerId === 1 ? 'giocatore1' : 'giocatore2', player = state[key]
        if (state.challengeContext || state.battaglia || state.league.players[playerId].status !== 'running' || state.league.config?.betweenBattleItems !== true)
          return { ok: false, message: 'Gli oggetti fra questi incontri non sono consentiti.' }
        if (!isShopItemId(itemId) || (player.inventario[itemId] ?? 0) < 1) return { ok: false, message: 'Questo oggetto non è nella borsa.' }
        const pokemon = player.squadra.find((p) => p.istanzaId === instanceId)
        if (!pokemon) return { ok: false, message: 'Scegli un Arkamon della squadra.' }
        const effect = resolveItemEffect(pokemon, itemId)
        if (!effect.ok || !effect.pokemon) return effect
        const written = set({ [key]: { ...player, squadra: player.squadra.map((p) => p.istanzaId === instanceId ? effect.pokemon! : p),
          inventario: { ...player.inventario, [itemId]: player.inventario[itemId]! - 1 } } } as Partial<GameState>)
        return { ok: written, message: written ? effect.message : 'Oggetto non salvato: borsa e HP restano intatti.' }
      },
      abbandonaLega: () => {
        const state = get(), playerId = state.giocatoreAttivo, progress = state.league.players[playerId]
        if (state.challengeContext || state.battaglia || progress.status !== 'running' || state.league.winner) return { ok: false, message: 'Concludi la battaglia prima di terminare il tentativo.' }
        const turn = nuovoTurno(playerId)
        const written = set({ league: { ...state.league, players: { ...state.league.players, [playerId]: { ...progress, status: 'defeated' } } },
          turnoOverworld: turn, giocatoreAttivo: turn.giocatoreAttivo, scenaCorrente: { scena: 'lega', payload: { playerId } } })
        return { ok: written, message: written ? 'Tentativo terminato. Gli HP residui restano nella squadra.' : 'Tentativo non salvato.' }
      },
      // ----------------------------------------------------------------
      // OVERWORLD (Fase E)
      // ----------------------------------------------------------------

      muoviAvatar: (giocatoreId, nuovaPos, mappa) => {
        const state = get()
        const chiavePos = giocatoreId === 1 ? 'posizione1' : 'posizione2'
        const da = state[chiavePos]
        if (isLeagueTurnLocked(state.league)) return false
        if (mappa.id === SECRET_LOCATION_ID || nuovaPos.luogo === SECRET_LOCATION_ID || isSecretLocationPosition(da)) return false
        if (state.turnoOverworld.giocatoreAttivo !== giocatoreId) return false
        if (state.turnoOverworld.azioniRimaste <= 0) return false
        if (nuovaPos.mappaId !== mappa.id) return false
        if (!puòMuoversi(da, { x: nuovaPos.x, y: nuovaPos.y }, mappa)) return false

        const turnoNuovo = consumaAzione(state.turnoOverworld, 'movimento')
        const turnoFinale =
          turnoNuovo.azioniRimaste <= 0 ? nuovoTurno(giocatoreId) : turnoNuovo

        return set({
          [chiavePos]: nuovaPos,
          turnoOverworld: turnoFinale,
        } as Partial<GameState>)
      },

      interagisciCasella: (giocatoreId, mappa, x, y) => {
        const state = get()
        if (isLeagueTurnLocked(state.league)) return { tipo: 'no-op' }
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

        if (!set({
          [chiaveG]: { ...g, caselleConsumate: nuoveConsumate },
          [chiavePos]: nuovaPos,
          turnoOverworld: turnoFinale,
        } as Partial<GameState>)) return { tipo: 'no-op' }
        return r
      },

      passaTurnoOverworld: () =>
        set((s) => {
          if (s.battaglia || isLeagueTurnLocked(s.league)) return s
          const turnoOverworld = nuovoTurno(s.turnoOverworld.giocatoreAttivo)
          return {
            turnoOverworld,
            giocatoreAttivo: turnoOverworld.giocatoreAttivo,
          }
        }),

      muoviAvatarMappaPrincipale: (giocatoreId, luogoDestinazione) => {
        const state = get()
        if (state.battaglia || isLeagueTurnLocked(state.league)) return false
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

        return set({
          [chiavePos]: posizioneMappaPrincipale(luogoDestinazione),
          giocatoreAttivo: giocatoreId,
          turnoOverworld: {
            ...state.turnoOverworld,
            azioniRimaste: state.turnoOverworld.azioniRimaste - 1,
          },
        } as Partial<GameState>)
      },

      attraversaPassaggioSegreto: (giocatoreId) => {
        const state = get()
        const posizione = state[giocatoreId === 1 ? 'posizione1' : 'posizione2']
        if (posizione.mappaId !== 'mappa-principale'
          || (posizione.luogo !== SECRET_LOCATION_ORIGIN && posizione.luogo !== SECRET_LOCATION_ID)) return false
        const destinazione = posizione.luogo === SECRET_LOCATION_ORIGIN ? SECRET_LOCATION_ID : SECRET_LOCATION_ORIGIN
        let moved = false
        const written = state.eseguiTransazione(() => {
          moved = state.muoviAvatarMappaPrincipale(giocatoreId, destinazione)
          if (!moved) return
          get().inizializzaPosizioneLocale(giocatoreId, destinazione)
          get().vaiAScena(destinazione === SECRET_LOCATION_ID ? 'percorso' : 'citta', { luogo: destinazione })
        })
        return moved && written
      },

      interagisciLuogoMappaPrincipale: (giocatoreId) => {
        const state = get()
        if (state.battaglia || isLeagueTurnLocked(state.league)) return { tipo: 'no-op' }
        const chiavePos = giocatoreId === 1 ? 'posizione1' : 'posizione2'
        const posizione = state[chiavePos]
        if (state.turnoOverworld.giocatoreAttivo !== giocatoreId) return { tipo: 'no-op' }
        if (state.turnoOverworld.azioniRimaste <= 0) return { tipo: 'no-op' }
        if (posizione.mappaId !== 'mappa-principale') return { tipo: 'no-op' }

        const luogo = luogoMappaPrincipale(posizione)
        if (luogo === SECRET_LOCATION_ID && !puoAccedereAlLuogoSegreto(state, giocatoreId)) return { tipo: 'no-op' }
        if (!set({
          [chiavePos]: posizioneMappaPrincipale(luogo),
          giocatoreAttivo: giocatoreId,
          turnoOverworld: nuovoTurno(giocatoreId),
        } as Partial<GameState>)) return { tipo: 'no-op' }

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
          if (!set({ [positionKey]: { ...state[positionKey], [luogo]: nodeId } } as Partial<GameState>)) return null
        }
        return nodeId
      },

      apriMappaLocale: (giocatoreId, luogo) => {
        const state = get()
        if (state.battaglia || isLeagueTurnLocked(state.league) || state.turnoOverworld.giocatoreAttivo !== giocatoreId) return false
        if (luogo === SECRET_LOCATION_ID && state.giocatoreAttivo !== giocatoreId) return false
        let valid = false
        const written = state.eseguiTransazione(() => {
          valid = state.inizializzaPosizioneLocale(giocatoreId, luogo) !== null
          if (valid) set({ giocatoreAttivo: giocatoreId })
        })
        return valid && written
      },

      muoviAvatarMappaLocale: (giocatoreId, luogo, nodoDestinazione) => {
        const state = get()
        const map = getLocalMap(luogo)
        const positionKey = giocatoreId === 1 ? 'posizioniLocali1' : 'posizioniLocali2'
        const worldPosition = state[giocatoreId === 1 ? 'posizione1' : 'posizione2']
        if (luogo === SECRET_LOCATION_ID && !puoAccedereAlLuogoSegreto(state, giocatoreId)) return false
        if (!map || state.battaglia || isLeagueTurnLocked(state.league) || state.giocatoreAttivo !== giocatoreId
          || state.turnoOverworld.giocatoreAttivo !== giocatoreId || state.turnoOverworld.azioniRimaste <= 0
          || worldPosition.mappaId !== 'mappa-principale' || luogoMappaPrincipale(worldPosition) !== luogo) {
          return false
        }
        const from = getLocalMapNode(map, state[positionKey][luogo]).id
        if (!canMoveOnLocalMap(map, from, nodoDestinazione)) return false
        return set({
          [positionKey]: { ...state[positionKey], [luogo]: nodoDestinazione },
          turnoOverworld: consumaAzione(state.turnoOverworld, 'movimento'),
        } as Partial<GameState>)
      },

      consumaInterazioneMappaLocale: (giocatoreId, luogo) => {
        const state = get()
        const worldPosition = state[giocatoreId === 1 ? 'posizione1' : 'posizione2']
        if (luogo === SECRET_LOCATION_ID && !puoAccedereAlLuogoSegreto(state, giocatoreId)) return false
        if (state.battaglia || isLeagueTurnLocked(state.league) || !getLocalMap(luogo) || state.giocatoreAttivo !== giocatoreId
          || state.turnoOverworld.giocatoreAttivo !== giocatoreId || state.turnoOverworld.azioniRimaste <= 0
          || worldPosition.mappaId !== 'mappa-principale' || luogoMappaPrincipale(worldPosition) !== luogo) {
          return false
        }
        return set({ turnoOverworld: nuovoTurno(giocatoreId) })
      },

      passaTurnoMappaLocale: () => {
        const state = get()
        if (state.battaglia || isLeagueTurnLocked(state.league)) return false
        const turnoOverworld = state.giocatoreAttivo !== state.turnoOverworld.giocatoreAttivo
          ? state.turnoOverworld
          : nuovoTurno(state.giocatoreAttivo)
        return set({ turnoOverworld, giocatoreAttivo: turnoOverworld.giocatoreAttivo })
      },

      reset: () =>
        set((s) => ({
          campaignRevision: s.campaignRevision + 1,
          giocatore1: giocatoreVuoto(1),
          giocatore2: giocatoreVuoto(2),
          giocatoreAttivo: 1,
          battaglia: null,
          league: emptyLeagueState(),
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
          arkadex: emptyArkadexProgress(), matchLog: emptyMatchLog(), teamRuleMessage: null,
        })),
    })},
    {
      name: GAME_SAVE_STORAGE_KEY,
      storage: createJSONStorage(() => {
        if (typeof localStorage === 'undefined') throw new Error('Storage non disponibile')
        return scopedGameStorage
      }),
      partialize: (state) => ({ ...serializeGameState(state), ...(state.challengeContext ? { challengeContext: state.challengeContext } : {}) }) as unknown as GameState,
      merge: (persisted, current) => {
        const recovered = normalizeGameSave(persisted, current)
        const context = persisted && typeof persisted === 'object' && 'challengeContext' in persisted ? normalizeChallengeContext(persisted.challengeContext) : null
        if (context && (!recovered.state.battaglia?.seeded || recovered.state.battaglia.seeded.seed !== context.session.seed)) {
          return { ...current, ...normalizeGameSave(context.campaign).state, challengeContext: null,
            saveRecoveryWarnings: ['La sfida non ha un punto dei dadi valido: è stata recuperata la campagna conservata.'] }
        }
        return { ...current, ...recovered.state, challengeContext: context, saveRecoveryWarnings: recovered.warnings }
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) queueMicrotask(() => {
          const storage = useGameStore.persist?.getOptions().storage
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
