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
import type {
  StatoGiocatore,
  StatoBattaglia,
  PokemonIstanza,
  NavigazioneScena,
  SceneId,
} from '@/types'
import { calcolaHPMax } from '@engine/battleEngine'
import { getPokemon } from '@data/index'

interface GameState {
  // === STATO GIOCATORI ===
  giocatore1: StatoGiocatore
  giocatore2: StatoGiocatore
  /** Quale dei due giocatori sta giocando il proprio turno */
  giocatoreAttivo: 1 | 2

  // === STATO BATTAGLIA ===
  battaglia: StatoBattaglia | null

  // === NAVIGAZIONE ===
  scenaCorrente: NavigazioneScena
  scenaPrecedente: NavigazioneScena | null

  // =====================================================
  // ACTIONS
  // =====================================================

  /** Naviga a una nuova scena, ricordando quella precedente */
  vaiAScena: (scena: SceneId, payload?: Record<string, unknown>) => void

  /** Torna alla scena precedente */
  scenaIndietro: () => void

  /** Cambia il giocatore attivo (alternanza tra Giocatore 1 e 2) */
  cambiaGiocatoreAttivo: () => void

  /** Aggiunge un pokemon alla squadra (se piena va in deposito) */
  aggiungiPokemon: (giocatoreId: 1 | 2, istanza: PokemonIstanza) => void

  /** Aggiorna un pokemon esistente (HP, livello, evoluzione...) */
  aggiornaPokemon: (giocatoreId: 1 | 2, istanza: PokemonIstanza) => void

  /** Marca un cespuglio come visitato (non più ripetibile per quel giocatore) */
  segnaCespuglioVisitato: (giocatoreId: 1 | 2, luogo: string, cespuglio: string) => void

  /** Verifica se un cespuglio è già stato visitato dal giocatore */
  cespuglioVisitato: (giocatoreId: 1 | 2, luogo: string, cespuglio: string) => boolean

  /** Avvia una nuova battaglia */
  iniziaBattaglia: (battaglia: StatoBattaglia) => void

  /** Aggiorna lo stato della battaglia in corso */
  aggiornaBattaglia: (patch: Partial<StatoBattaglia>) => void

  /** Termina la battaglia, opzionalmente curando la squadra */
  terminaBattaglia: (curaCompleta: boolean) => void

  /** Reset completo del gioco (Nuova Partita) */
  reset: () => void
}

const giocatoreVuoto = (id: 1 | 2): StatoGiocatore => ({
  id,
  nome: `Giocatore ${id}`,
  squadra: [],
  deposito: {},
  cespugliVisitati: new Set(),
  allenatoriSconfitti: new Set(),
})

/**
 * Cerca il primo slot libero nel deposito (box × slot).
 * Il deposito ha 30 box × 35 slot, identici a Excel.
 */
function trovaSlotDepositoLibero(deposito: Record<string, PokemonIstanza>): string {
  for (let box = 1; box <= 30; box++) {
    for (let slot = 1; slot <= 35; slot++) {
      const chiave = `${box}:${slot}`
      if (!deposito[chiave]) return chiave
    }
  }
  return '1:1' // fallback (deposito pieno: 1050 pokemon — improbabile)
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      giocatore1: giocatoreVuoto(1),
      giocatore2: giocatoreVuoto(2),
      giocatoreAttivo: 1,
      battaglia: null,
      scenaCorrente: { scena: 'titolo' },
      scenaPrecedente: null,

      vaiAScena: (scena, payload) =>
        set((s) => ({
          scenaPrecedente: s.scenaCorrente,
          scenaCorrente: { scena, payload },
        })),

      scenaIndietro: () =>
        set((s) =>
          s.scenaPrecedente
            ? { scenaCorrente: s.scenaPrecedente, scenaPrecedente: null }
            : s
        ),

      cambiaGiocatoreAttivo: () =>
        set((s) => ({ giocatoreAttivo: s.giocatoreAttivo === 1 ? 2 : 1 })),

      aggiungiPokemon: (giocatoreId, istanza) =>
        set((s) => {
          const chiaveG = giocatoreId === 1 ? 'giocatore1' : 'giocatore2'
          const g = s[chiaveG]
          if (g.squadra.length < 6) {
            return { [chiaveG]: { ...g, squadra: [...g.squadra, istanza] } } as Partial<GameState>
          }
          // Squadra piena → deposito
          const slot = trovaSlotDepositoLibero(g.deposito)
          return {
            [chiaveG]: { ...g, deposito: { ...g.deposito, [slot]: istanza } },
          } as Partial<GameState>
        }),

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

      iniziaBattaglia: (battaglia) => set({ battaglia }),

      aggiornaBattaglia: (patch) =>
        set((s) => (s.battaglia ? { battaglia: { ...s.battaglia, ...patch } } : s)),

      terminaBattaglia: (curaCompleta) =>
        set((s) => {
          if (!curaCompleta) return { battaglia: null }
          // Cura tutti i pokemon di entrambi i giocatori (come VBA: PostBattaglia)
          const curaSquadra = (squadra: PokemonIstanza[]) =>
            squadra.map((p) => {
              const specie = getPokemon(p.specieId)
              if (!specie) return p
              return { ...p, hp: calcolaHPMax(p) }
            })
          return {
            battaglia: null,
            giocatore1: { ...s.giocatore1, squadra: curaSquadra(s.giocatore1.squadra) },
            giocatore2: { ...s.giocatore2, squadra: curaSquadra(s.giocatore2.squadra) },
          }
        }),

      reset: () =>
        set({
          giocatore1: giocatoreVuoto(1),
          giocatore2: giocatoreVuoto(2),
          giocatoreAttivo: 1,
          battaglia: null,
          scenaCorrente: { scena: 'titolo' },
          scenaPrecedente: null,
        }),
    }),
    {
      name: 'arkamon-save',
      // Custom serializer perché Set non è serializzabile in JSON
      partialize: (state) => ({
        ...state,
        giocatore1: {
          ...state.giocatore1,
          cespugliVisitati: Array.from(state.giocatore1.cespugliVisitati),
          allenatoriSconfitti: Array.from(state.giocatore1.allenatoriSconfitti),
        },
        giocatore2: {
          ...state.giocatore2,
          cespugliVisitati: Array.from(state.giocatore2.cespugliVisitati),
          allenatoriSconfitti: Array.from(state.giocatore2.allenatoriSconfitti),
        },
      }) as unknown as GameState,
      merge: (persisted, current) => {
        // Riconverti gli array in Set dopo il caricamento
        const p = persisted as GameState
        return {
          ...current,
          ...p,
          giocatore1: {
            ...p.giocatore1,
            cespugliVisitati: new Set(p.giocatore1.cespugliVisitati as unknown as string[]),
            allenatoriSconfitti: new Set(p.giocatore1.allenatoriSconfitti as unknown as number[]),
          },
          giocatore2: {
            ...p.giocatore2,
            cespugliVisitati: new Set(p.giocatore2.cespugliVisitati as unknown as string[]),
            allenatoriSconfitti: new Set(p.giocatore2.allenatoriSconfitti as unknown as number[]),
          },
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
