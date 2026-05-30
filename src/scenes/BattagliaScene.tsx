import { useGameStore, creaIstanza } from '@store/gameStore'
import { useAdminStore } from '@store/adminStore'
import { useState, useEffect, useRef, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  calcolaDanno,
  calcolaHPMax,
  scegliMossaIA,
  tentaCattura,
  applicaXP,
  xpGuadagnato,
  applicaStato,
  risolviStatoInizioTurno,
  èMossaCura,
  applicaMossaCura,
} from '@engine/battleEngine'
import { getPokemon, getMossa, getAllenatore } from '@data/index'
import { calcolaVariazioneMonete, type TipoAvversario } from '@engine/battleEngine'
import type { PokemonIstanza, MossaDef, RisultatoMossa, StatoAlterato } from '@/types'
import type { AdminBattleLayoutKey, AdminLayoutRect } from '@/theme/adminThemeTypes'
import { getBackground, BATTLE_BG_DEFAULT } from '@data/backgrounds'
import { assetUrl } from '@/utils/assetUrl'
import { playSound } from '@/utils/soundManager'
import { AdminLayoutItem } from '@/admin/AdminLayoutItem'
import {
  MoveVfx,
  type MoveVfxEvent,
  type MoveVfxSide,
  type MoveVfxTarget,
} from '@/components/MoveVfx'
import {
  preloadMoveVfxForPokemon,
  preloadVfxAssets,
} from '@/components/vfx/preloadVfxAssets'
import { DEFAULT_PRELOAD_VFX_ASSET_IDS } from '@/components/vfx/vfxManifest'
import {
  getMoveVfxDurationMs,
  getMoveVfxImpactDelayMs,
} from '@/components/vfx/resolveMoveVfxAsset'

const STATO_BADGE: Record<StatoAlterato, { label: string; color: string; emoji: string }> = {
  Confuso: { label: 'CONF', color: 'bg-fuchsia-500', emoji: '💫' },
  Addormentato: { label: 'ZZZ', color: 'bg-blue-500', emoji: '😴' },
  Avvelenato: { label: 'PSN', color: 'bg-purple-600', emoji: '☠️' },
}

const INFOBOX_VISIBLE_MS = 4200
const DICE_ROLL_VISIBLE_MS = 2200

type PendingSwitch = {
  motivo: string
  prossimoPasso: 'continuaA' | 'passaAdA' | 'passaAB'
  pendingB?: PokemonIstanza
}

/**
 * Scena di battaglia.
 *
 * Supporta:
 * - Battaglie selvatiche (1 vs 1) con cattura
 * - Battaglie NPC/PVP multi-pokemon (scambio manuale su KO del giocatore)
 * - XP per nemico sconfitto (1 KO = 1 livello, cap 100)
 * - Evoluzioni inline al raggiungimento della soglia
 *
 * Aggiornamenti del Pokémon attivo (HP, livello, evoluzione) vengono
 * persistiti nello store all'uscita dalla scena.
 */
export function BattagliaScene() {
  const vaiAScena = useGameStore((s) => s.vaiAScena)
  const battaglia = useGameStore((s) => s.battaglia)
  const terminaBattaglia = useGameStore((s) => s.terminaBattaglia)
  const aggiungiPokemon = useGameStore((s) => s.aggiungiPokemon)
  const aggiornaPokemon = useGameStore((s) => s.aggiornaPokemon)
  const giocatoreAttivo = useGameStore((s) => s.giocatoreAttivo)
  const risolviBattagliaNPC = useGameStore((s) => s.risolviBattagliaNPC)
  const usaOggetto = useGameStore((s) => s.usaOggetto)
  const battleLayout = useAdminStore((s) => s.theme.layouts.battle)
  const customBattleBackground = useAdminStore((s) => s.theme.assets.battleBackground)
  const layoutEditing = useAdminStore((s) => s.layoutEditing)
  const updateBattleLayout = useAdminStore((s) => s.updateBattleLayout)
  const masterballRimaste = useGameStore((s) =>
    s.giocatoreAttivo === 1
      ? s.giocatore1.inventario.masterball ?? 0
      : s.giocatore2.inventario.masterball ?? 0
  )
  const [esito, setEsito] = useState<'vittoria' | 'sconfitta' | null>(null)

  const [pkmnA, setPkmnA] = useState<PokemonIstanza | null>(null)
  const [pkmnB, setPkmnB] = useState<PokemonIstanza | null>(null)
  const [squadraA, setSquadraA] = useState<PokemonIstanza[]>([])
  const [squadraB, setSquadraB] = useState<PokemonIstanza[]>([])
  const [infoBoxMessaggi, setInfoBoxMessaggi] = useState<string[]>([])
  const [diceRoll, setDiceRoll] = useState<DiceRollDisplay | null>(null)
  const diceRollTimerRef = useRef<number | null>(null)
  const diceRollIdRef = useRef(0)
  const [moveVfx, setMoveVfx] = useState<MoveVfxEvent | null>(null)
  const moveVfxTimerRef = useRef<number | null>(null)
  const moveVfxIdRef = useRef(0)
  const feedbackTimersRef = useRef<Set<number>>(new Set())
  const messaggiTurnoBRef = useRef<string[]>([])
  const [azioneInCorso, setAzioneInCorso] = useState(false)
  const [turnoA, setTurnoA] = useState(true)
  const [shaking, setShaking] = useState<'A' | 'B' | null>(null)
  /** In PvP: vero quando si attende la scelta della mossa di B (input umano). */
  const [mostraMoseB, setMostraMoseB] = useState(false)
  const [attesaAvversario, setAttesaAvversario] = useState<PokemonIstanza | null>(null)
  const [scambioRichiesto, setScambioRichiesto] = useState<PendingSwitch | null>(null)
  /**
   * In PvP: pausa esplicita tra fine turno corrente e inizio turno successivo.
   */
  const [attesaPassaggio, setAttesaPassaggio] = useState<
    | { direzione: 'A→B'; pendingB: PokemonIstanza }
    | { direzione: 'B→A' }
    | null
  >(null)
  const [terminata, setTerminata] = useState(false)
  const [evoluzioniInAttesa, setEvoluzioniInAttesa] = useState<
    { istanzaId: string; oldSpecieId: number; newSpecieId: number }[]
  >([])

  useEffect(() => {
    preloadVfxAssets(DEFAULT_PRELOAD_VFX_ASSET_IDS)
    preloadMoveVfxForPokemon(
      battaglia
        ? [
            battaglia.pokemonA.specieId,
            battaglia.pokemonB.specieId,
            ...(battaglia.squadraA ?? []).map((pokemon) => pokemon.specieId),
            ...(battaglia.squadraB ?? []).map((pokemon) => pokemon.specieId),
          ]
        : [1, 13]
    )
    playSound('battle-start')
    if (battaglia) {
      setPkmnA(battaglia.pokemonA)
      setPkmnB(battaglia.pokemonB)
      setSquadraA(battaglia.squadraA ?? [battaglia.pokemonA])
      setSquadraB(battaglia.squadraB ?? [battaglia.pokemonB])
      setInfoBoxMessaggi(battaglia.log.slice(-4))
    } else {
      const a = creaIstanza(1, 5)
      const b = creaIstanza(13, 5)
      const messaggiIniziali = [`Appare ${b?.nome} selvatico!`]
      setPkmnA(a)
      setPkmnB(b)
      setSquadraA(a ? [a] : [])
      setSquadraB(b ? [b] : [])
      setInfoBoxMessaggi(messaggiIniziali)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (infoBoxMessaggi.length === 0) return

    const timeout = window.setTimeout(() => {
      setInfoBoxMessaggi([])
    }, INFOBOX_VISIBLE_MS)

    return () => window.clearTimeout(timeout)
  }, [infoBoxMessaggi])

  useEffect(() => {
    return () => {
      if (diceRollTimerRef.current !== null) {
        window.clearTimeout(diceRollTimerRef.current)
      }
      if (moveVfxTimerRef.current !== null) {
        window.clearTimeout(moveVfxTimerRef.current)
      }
      for (const timer of feedbackTimersRef.current) {
        window.clearTimeout(timer)
      }
      feedbackTimersRef.current.clear()
    }
  }, [])

  const luogoRitorno = battaglia?.luogoRitorno ?? 'mappa-principale'
  const isNPC = !!battaglia && battaglia.tipo !== 'Selvatico' && battaglia.allenatoreId !== undefined
  const isSelvatico = !battaglia || battaglia.tipo === 'Selvatico'
  const isPvP = !!battaglia && battaglia.tipo === 'PVP'
  const isPercorso = !!luogoRitorno && /^Percorso_/.test(luogoRitorno)

  const updateInSquadra = (squadra: PokemonIstanza[], updated: PokemonIstanza) =>
    squadra.map((p) => (p.istanzaId === updated.istanzaId ? updated : p))

  const resetInfoBox = () => setInfoBoxMessaggi([])

  const mostraMessaggi = (messaggi: string[]) => {
    if (messaggi.length === 0) return
    setInfoBoxMessaggi((correnti) => [...correnti, ...messaggi].slice(-6))
  }

  const mostraLancioDadi = (
    risultato: RisultatoMossa,
    side: 'A' | 'B',
    onComplete: () => void
  ) => {
    if (diceRollTimerRef.current !== null) {
      window.clearTimeout(diceRollTimerRef.current)
    }

    setDiceRoll({
      id: ++diceRollIdRef.current,
      side,
      moveName: risultato.mossa.nome,
      rolls: risultato.tiriDado,
      increment: risultato.incremento,
      damage: risultato.dannoFinale,
    })
    diceRollTimerRef.current = window.setTimeout(() => {
      setDiceRoll(null)
      diceRollTimerRef.current = null
      onComplete()
    }, DICE_ROLL_VISIBLE_MS)
  }

  const mostraVfxMossa = (
    move: MossaDef,
    side: MoveVfxSide,
    target: MoveVfxTarget = 'opponent'
  ): number => {
    if (moveVfxTimerRef.current !== null) {
      window.clearTimeout(moveVfxTimerRef.current)
    }

    setMoveVfx({
      id: ++moveVfxIdRef.current,
      move,
      side,
      target,
    })
    const durationMs = getMoveVfxDurationMs(move)
    moveVfxTimerRef.current = window.setTimeout(() => {
      setMoveVfx(null)
      moveVfxTimerRef.current = null
    }, durationMs)
    return durationMs
  }

  const scheduleFeedbackTimer = (callback: () => void, delayMs: number) => {
    const timer = window.setTimeout(() => {
      feedbackTimersRef.current.delete(timer)
      callback()
    }, delayMs)
    feedbackTimersRef.current.add(timer)
  }

  const scheduleImpactFeedback = (
    move: MossaDef,
    side: 'A' | 'B',
    playHitSound = true
  ) => {
    scheduleFeedbackTimer(() => {
      setShaking(side)
      if (playHitSound) playSound('hit')
      scheduleFeedbackTimer(() => setShaking(null), 400)
    }, getMoveVfxImpactDelayMs(move))
  }

  const eseguiSequenzaOffensiva = (
    risultato: RisultatoMossa,
    side: 'A' | 'B',
    targetSide: 'A' | 'B',
    playHitSound: boolean,
    onComplete: () => void
  ) => {
    setAzioneInCorso(true)
    const vfxDurationMs = mostraVfxMossa(risultato.mossa, side)
    scheduleImpactFeedback(risultato.mossa, targetSide, playHitSound)
    scheduleFeedbackTimer(() => {
      mostraLancioDadi(risultato, side, () => {
        onComplete()
        setAzioneInCorso(false)
      })
    }, vfxDurationMs)
  }

  const eseguiSequenzaCura = (
    move: MossaDef,
    side: 'A' | 'B',
    onComplete: () => void
  ) => {
    setAzioneInCorso(true)
    const vfxDurationMs = mostraVfxMossa(move, side, 'self')
    scheduleFeedbackTimer(() => {
      onComplete()
      setAzioneInCorso(false)
    }, vfxDurationMs)
  }

  const tornaIndietro = () => {
    if (isNPC && esito) risolviBattagliaNPC(esito)
    for (const p of squadraA) aggiornaPokemon(giocatoreAttivo, p)
    terminaBattaglia(true)

    if (evoluzioniInAttesa.length > 0) {
      vaiAScena('evoluzione', {
        evoluzioni: evoluzioniInAttesa,
        luogoRitorno,
        giocatoreId: giocatoreAttivo,
      })
      return
    }

    if (luogoRitorno === 'mappa-griglia') {
      vaiAScena('mappa-griglia')
    } else if (isPercorso) {
      vaiAScena('percorso', { luogo: luogoRitorno })
    } else if (luogoRitorno && luogoRitorno !== 'mappa-principale') {
      vaiAScena('citta', { luogo: luogoRitorno })
    } else {
      vaiAScena('mappa-principale')
    }
  }

  if (!pkmnA || !pkmnB) return <div className="text-white p-8">Caricamento...</div>

  const specieB = getPokemon(pkmnB.specieId)!

  const eseguiMossaPvP_B = (numeroMossa: 0 | 1 | 2) => {
    if (terminata || turnoA || !mostraMoseB || azioneInCorso) return
    setMostraMoseB(false)
    const messaggiIniziali = messaggiTurnoBRef.current
    messaggiTurnoBRef.current = []
    eseguiMossaB(pkmnB, calcolaHPMax(pkmnB), numeroMossa, messaggiIniziali)
  }

  const passaTurnoAaB = (nuovoB: PokemonIstanza, delayMs = 1500) => {
    setTurnoA(false)
    if (isPvP) {
      setAttesaPassaggio({ direzione: 'A→B', pendingB: nuovoB })
      return
    }
    window.setTimeout(() => setAttesaAvversario(nuovoB), Math.min(delayMs, 250))
  }

  const passaTurnoBaA = () => {
    setAttesaAvversario(null)
    if (isPvP) {
      setAttesaPassaggio({ direzione: 'B→A' })
      return
    }
    setTurnoA(true)
  }

  const confermaPassaggio = () => {
    if (!attesaPassaggio) return
    if (attesaPassaggio.direzione === 'A→B') {
      const nb = attesaPassaggio.pendingB
      setAttesaPassaggio(null)
      turnoAvversario(nb)
    } else {
      setAttesaPassaggio(null)
      setTurnoA(true)
    }
  }

  const confermaTurnoAvversario = () => {
    if (!attesaAvversario) return
    const pendingB = attesaAvversario
    setAttesaAvversario(null)
    turnoAvversario(pendingB)
  }

  const apriScambio = (richiesta: PendingSwitch) => {
    setMostraMoseB(false)
    setAttesaAvversario(null)
    mostraMessaggi(['Scegli un Pokemon dalla squadra.'])
    setScambioRichiesto(richiesta)
  }

  const scegliPokemonCambio = (scelto: PokemonIstanza) => {
    if (!scambioRichiesto || scelto.hp <= 0) return
    const richiesta = scambioRichiesto
    setPkmnA(scelto)
    setScambioRichiesto(null)
    resetInfoBox()
    mostraMessaggi([`${scelto.nome} entra in campo!`])

    if (richiesta.prossimoPasso === 'passaAB') {
      passaTurnoAaB(richiesta.pendingB ?? pkmnB, 300)
      return
    }

    if (richiesta.prossimoPasso === 'passaAdA') {
      passaTurnoBaA()
      return
    }

    setTurnoA(true)
  }

  const specieA = getPokemon(pkmnA.specieId)!
  const hpMaxA = calcolaHPMax(pkmnA)
  const hpMaxB = calcolaHPMax(pkmnB)

  const premiaConXP = (
    attivo: PokemonIstanza,
    sconfitto: PokemonIstanza
  ): PokemonIstanza => {
    const xpRes = applicaXP(attivo, xpGuadagnato(sconfitto))
    const messaggi: string[] = []
    if (xpRes.livelliGuadagnati > 0) {
      playSound('level-up')
      messaggi.push(`${attivo.nome} è salito al livello ${xpRes.istanza.livello}!`)
    }
    if (xpRes.evoluzionePendente) {
      playSound('evolution')
      messaggi.push(`Cosa? ${attivo.nome} si sta evolvendo!`)
      setEvoluzioniInAttesa((prev) => [
        ...prev,
        {
          istanzaId: attivo.istanzaId,
          oldSpecieId: attivo.specieId,
          newSpecieId: xpRes.evoluzionePendente!.nuovaSpecieId,
        },
      ])
    }
    mostraMessaggi(messaggi)
    return xpRes.istanza
  }

  const eseguiMossa = (numeroMossa: 0 | 1 | 2) => {
    if (terminata || !turnoA || azioneInCorso) return
    resetInfoBox()

    const statoRes = risolviStatoInizioTurno(pkmnA, hpMaxA)
    const pkmnAEffettivo = statoRes.istanza
    setPkmnA(pkmnAEffettivo)
    setSquadraA((sq) => updateInSquadra(sq, pkmnAEffettivo))

    if (pkmnAEffettivo.hp <= 0) {
      mostraMessaggi(statoRes.messaggi)
      const nextA = squadraA.find(
        (p) => p.istanzaId !== pkmnAEffettivo.istanzaId && p.hp > 0
      )
      if (nextA) {
        mostraMessaggi([`${pkmnAEffettivo.nome} e caduto!`])
        apriScambio({
          motivo: `${pkmnAEffettivo.nome} non puo continuare.`,
          prossimoPasso: 'continuaA',
        })
        return
      }
      mostraMessaggi(['Hai perso la battaglia...'])
      setEsito('sconfitta')
      setTerminata(true)
      return
    }

    if (!statoRes.puoAgire) {
      mostraMessaggi(statoRes.messaggi)
      passaTurnoAaB(pkmnB, 1200)
      return
    }

    const mossaScelta = specieA.mosse[numeroMossa]
      ? getMossa(specieA.mosse[numeroMossa]!)
      : null
    if (mossaScelta && èMossaCura(mossaScelta)) {
      const cura = applicaMossaCura(pkmnAEffettivo, mossaScelta, hpMaxA)
      eseguiSequenzaCura(mossaScelta, 'A', () => {
        setPkmnA(cura.istanza)
        setSquadraA((sq) => updateInSquadra(sq, cura.istanza))
        mostraMessaggi([...statoRes.messaggi, ...cura.messaggi])
        passaTurnoAaB(pkmnB, 1200)
      })
      return
    }

    const ris = calcolaDanno(pkmnAEffettivo, pkmnB, numeroMossa)
    if (!ris) return

    let nuovoB = { ...pkmnB, hp: Math.max(0, pkmnB.hp - ris.dannoFinale) }
    if (ris.statoApplicato && nuovoB.hp > 0) {
      nuovoB = applicaStato(nuovoB, ris.statoApplicato)
    }
    eseguiSequenzaOffensiva(ris, 'A', 'B', nuovoB.hp > 0, () => {
      setPkmnB(nuovoB)
      const nuovaSquadraB = updateInSquadra(squadraB, nuovoB)
      setSquadraB(nuovaSquadraB)
      mostraMessaggi([...statoRes.messaggi, ...ris.messaggi])

      let aDopoAutodanno = pkmnAEffettivo
      if (ris.autodanno && ris.autodanno > 0) {
        aDopoAutodanno = {
          ...pkmnAEffettivo,
          hp: Math.max(0, pkmnAEffettivo.hp - ris.autodanno),
        }
        setPkmnA(aDopoAutodanno)
        setSquadraA((sq) => updateInSquadra(sq, aDopoAutodanno))
      }

      if (nuovoB.hp <= 0) {
        playSound('ko')
        const aggiornatoA = premiaConXP(aDopoAutodanno, nuovoB)
        setPkmnA(aggiornatoA)
        setSquadraA((sq) => updateInSquadra(sq, aggiornatoA))

        const nextB = nuovaSquadraB.find(
          (p) => p.istanzaId !== nuovoB.istanzaId && p.hp > 0
        )
        if (nextB && isNPC) {
          mostraMessaggi([`L'avversario manda in campo ${nextB.nome}!`])
          setPkmnB(nextB)
          // BR.3: il nuovo Pokémon nemico attacca subito (VBA: Cells(12,2)="B")
          passaTurnoAaB(nextB, 800)
          return
        }
        mostraMessaggi(['Hai vinto la battaglia!'])
        playSound('victory')
        setEsito('vittoria')
        setTerminata(true)
        return
      }

      if (aDopoAutodanno.hp <= 0) {
        const nextA = squadraA.find(
          (p) => p.istanzaId !== aDopoAutodanno.istanzaId && p.hp > 0
        )
        if (nextA) {
          mostraMessaggi([`${aDopoAutodanno.nome} e esausto!`])
          apriScambio({
            motivo: `${aDopoAutodanno.nome} non puo continuare.`,
            prossimoPasso: 'passaAB',
            pendingB: nuovoB,
          })
          return
        }
        mostraMessaggi(['Hai perso la battaglia...'])
        playSound('ko')
        setEsito('sconfitta')
        setTerminata(true)
        return
      }

      passaTurnoAaB(nuovoB, 1500)
    })
  }

  // Porting di: EseguiAzioneCattura da old_files/Mod_Battle_Engine.txt
  const eseguiCattura = () => {
    if (terminata || !turnoA || azioneInCorso) return
    resetInfoBox()
    const ris = tentaCattura(pkmnB)
    mostraMessaggi([
      `Lanci una pokeball... (3d6=${ris.roll}, soglia=${ris.soglia.toFixed(1)})`,
    ])
    if (ris.riuscita) {
      mostraMessaggi([`${pkmnB.nome} e stato catturato!`])
      playSound('capture')
      aggiungiPokemon(giocatoreAttivo, pkmnB)
      setEsito('vittoria')
      setTerminata(true)
      return
    }
    mostraMessaggi([`${pkmnB.nome} e scappato dalla pokeball!`])
    setTurnoA(false)
    setAttesaAvversario(pkmnB)
  }

  const eseguiMasterball = () => {
    if (terminata || !turnoA || azioneInCorso) return
    if (!usaOggetto(giocatoreAttivo, 'masterball')) return
    resetInfoBox()
    mostraMessaggi([
      'Lanci una Masterball...',
      `${pkmnB.nome} e stato catturato!`,
    ])
    playSound('capture')
    aggiungiPokemon(giocatoreAttivo, pkmnB)
    setEsito('vittoria')
    setTerminata(true)
  }

  const turnoAvversario = (statoBcorrente: PokemonIstanza) => {
    resetInfoBox()
    const hpMaxBcorrente = calcolaHPMax(statoBcorrente)
    const statoRes = risolviStatoInizioTurno(statoBcorrente, hpMaxBcorrente)
    const bEffettivo = statoRes.istanza
    setPkmnB(bEffettivo)
    setSquadraB((sq) => updateInSquadra(sq, bEffettivo))

    if (bEffettivo.hp <= 0) {
      mostraMessaggi(statoRes.messaggi)
      mostraMessaggi([`${bEffettivo.nome} e caduto!`])
      playSound('ko')
      const nextB = squadraB.find(
        (p) => p.istanzaId !== bEffettivo.istanzaId && p.hp > 0
      )
      if (nextB && isNPC) {
        mostraMessaggi([`L'avversario manda in campo ${nextB.nome}!`])
        setPkmnB(nextB)
        setTurnoA(true)
        return
      }
      const aggiornatoA = premiaConXP(pkmnA, bEffettivo)
      setPkmnA(aggiornatoA)
      setSquadraA((sq) => updateInSquadra(sq, aggiornatoA))
      mostraMessaggi(['Hai vinto la battaglia!'])
      playSound('victory')
      setEsito('vittoria')
      setTerminata(true)
      return
    }

    if (!statoRes.puoAgire) {
      mostraMessaggi(statoRes.messaggi)
      passaTurnoBaA()
      return
    }

    if (isPvP) {
      messaggiTurnoBRef.current = statoRes.messaggi
      setMostraMoseB(true)
      return
    }

    const mossaIdx = scegliMossaIA(bEffettivo, pkmnA)
    eseguiMossaB(bEffettivo, hpMaxBcorrente, mossaIdx, statoRes.messaggi)
  }

  const eseguiMossaB = (
    bEffettivo: PokemonIstanza,
    hpMaxBcorrente: number,
    mossaIdx: 0 | 1 | 2,
    messaggiIniziali: string[] = []
  ) => {
    const specieB = getPokemon(bEffettivo.specieId)
    const mossaIdB = specieB?.mosse[mossaIdx] ?? null
    const mossaDefB = mossaIdB ? getMossa(mossaIdB) : null

    if (mossaDefB && èMossaCura(mossaDefB)) {
      const cura = applicaMossaCura(bEffettivo, mossaDefB, hpMaxBcorrente)
      eseguiSequenzaCura(mossaDefB, 'B', () => {
        setPkmnB(cura.istanza)
        setSquadraB((sq) => updateInSquadra(sq, cura.istanza))
        mostraMessaggi([...messaggiIniziali, ...cura.messaggi])
        passaTurnoBaA()
      })
      return
    }

    const ris = calcolaDanno(bEffettivo, pkmnA, mossaIdx)
    if (!ris) {
      passaTurnoBaA()
      return
    }
    let nuovoA = { ...pkmnA, hp: Math.max(0, pkmnA.hp - ris.dannoFinale) }
    if (ris.statoApplicato && nuovoA.hp > 0) {
      nuovoA = applicaStato(nuovoA, ris.statoApplicato)
    }
    eseguiSequenzaOffensiva(ris, 'B', 'A', nuovoA.hp > 0, () => {
      setPkmnA(nuovoA)
      const nuovaSquadraA = updateInSquadra(squadraA, nuovoA)
      setSquadraA(nuovaSquadraA)
      mostraMessaggi([...messaggiIniziali, ...ris.messaggi])

      let bDopoAutodanno = bEffettivo
      if (ris.autodanno && ris.autodanno > 0) {
        bDopoAutodanno = {
          ...bEffettivo,
          hp: Math.max(0, bEffettivo.hp - ris.autodanno),
        }
        setPkmnB(bDopoAutodanno)
        setSquadraB((sq) => updateInSquadra(sq, bDopoAutodanno))
      }

      if (nuovoA.hp <= 0) {
        const nextA = nuovaSquadraA.find(
          (p) => p.istanzaId !== nuovoA.istanzaId && p.hp > 0
        )
        if (nextA) {
          mostraMessaggi([`${nuovoA.nome} e KO!`])
          apriScambio({
            motivo: `${nuovoA.nome} e KO.`,
            prossimoPasso: 'passaAdA',
          })
          return
        }
        mostraMessaggi(['Hai perso la battaglia...'])
        playSound('ko')
        setEsito('sconfitta')
        setTerminata(true)
        return
      }

      if (bDopoAutodanno.hp <= 0) {
        const nextB = squadraB.find(
          (p) => p.istanzaId !== bDopoAutodanno.istanzaId && p.hp > 0
        )
        if (nextB && isNPC) {
          mostraMessaggi([`${bDopoAutodanno.nome} e esausto! L'avversario manda in campo ${nextB.nome}!`])
          setPkmnB(nextB)
          setTurnoA(true)
          return
        }
        const aggiornatoA = premiaConXP(nuovoA, bDopoAutodanno)
        setPkmnA(aggiornatoA)
        setSquadraA((sq) => updateInSquadra(sq, aggiornatoA))
        mostraMessaggi(['Hai vinto la battaglia!'])
        playSound('victory')
        setEsito('vittoria')
        setTerminata(true)
        return
      }

      passaTurnoBaA()
    })
  }

  const bgBattaglia = customBattleBackground
    ? assetUrl(customBattleBackground)
    : getBackground(luogoRitorno) ?? BATTLE_BG_DEFAULT
  const mosseA = specieA.mosse
    .map((mossaId, i) => {
      const mossa = mossaId ? getMossa(mossaId) : null
      return mossa ? { mossa, idx: i as 0 | 1 | 2 } : null
    })
    .filter((entry): entry is { mossa: MossaDef; idx: 0 | 1 | 2 } => entry !== null)
  const mosseB = specieB.mosse
    .map((mossaId, i) => {
      const mossa = mossaId ? getMossa(mossaId) : null
      return mossa ? { mossa, idx: i as 0 | 1 | 2 } : null
    })
    .filter((entry): entry is { mossa: MossaDef; idx: 0 | 1 | 2 } => entry !== null)

  return (
    <div
      data-battle-layout-root
      className="w-full h-full relative bg-cover bg-center"
      style={{ backgroundImage: `url(${bgBattaglia})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/10 via-transparent to-slate-950/60 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-t from-slate-950/80 to-transparent pointer-events-none" />

      <AnimatePresence>
        {moveVfx && <MoveVfx key={moveVfx.id} effect={moveVfx} />}
      </AnimatePresence>

      <AnimatePresence>
        {diceRoll && <DiceRollOverlay key={diceRoll.id} roll={diceRoll} />}
      </AnimatePresence>

      {isNPC && (
        <>
          <BattleLayoutItem
            layoutKey="enemySquad"
            label="Squadra nemica"
            rect={battleLayout.enemySquad}
            editing={layoutEditing}
            onChange={updateBattleLayout}
          >
            <SquadIndicator squadra={squadraB} />
          </BattleLayoutItem>
          <BattleLayoutItem
            layoutKey="playerSquad"
            label="Squadra giocatore"
            rect={battleLayout.playerSquad}
            editing={layoutEditing}
            onChange={updateBattleLayout}
          >
            <SquadIndicator squadra={squadraA} />
          </BattleLayoutItem>
        </>
      )}

      <AnimatePresence mode="popLayout">
        <BattleLayoutItem
          key={pkmnB.istanzaId}
          layoutKey="enemySprite"
          label="Sprite nemico"
          rect={battleLayout.enemySprite}
          editing={layoutEditing}
          onChange={updateBattleLayout}
        >
          <PokemonBattleSlot
            istanza={pkmnB}
            position="top-right"
            shaking={shaking === 'B'}
            lunging={shaking === 'A'}
          />
        </BattleLayoutItem>
      </AnimatePresence>

      <AnimatePresence mode="popLayout">
        <BattleLayoutItem
          key={pkmnA.istanzaId}
          layoutKey="playerSprite"
          label="Sprite giocatore"
          rect={battleLayout.playerSprite}
          editing={layoutEditing}
          onChange={updateBattleLayout}
        >
          <PokemonBattleSlot
            istanza={pkmnA}
            position="bottom-left"
            shaking={shaking === 'A'}
            lunging={shaking === 'B'}
          />
        </BattleLayoutItem>
      </AnimatePresence>

      <BattleLayoutItem
        layoutKey="enemyHp"
        label="HP nemico"
        rect={battleLayout.enemyHp}
        editing={layoutEditing}
        onChange={updateBattleLayout}
      >
        <HpBar
          nome={pkmnB.nome}
          livello={pkmnB.livello}
          hp={pkmnB.hp}
          hpMax={hpMaxB}
          stato={pkmnB.stato?.tipo}
          side="enemy"
        />
      </BattleLayoutItem>

      <BattleLayoutItem
        layoutKey="playerHp"
        label="HP giocatore"
        rect={battleLayout.playerHp}
        editing={layoutEditing}
        onChange={updateBattleLayout}
      >
        <HpBar
          nome={pkmnA.nome}
          livello={pkmnA.livello}
          hp={pkmnA.hp}
          hpMax={hpMaxA}
          stato={pkmnA.stato?.tipo}
          side="player"
        />
      </BattleLayoutItem>

      {(infoBoxMessaggi.length > 0 || !!attesaAvversario || layoutEditing) && (
        <BattleLayoutItem
          layoutKey="infoBox"
          label="Box messaggi"
          rect={battleLayout.infoBox}
          editing={layoutEditing}
          onChange={updateBattleLayout}
        >
          <InfoBox
            messaggi={infoBoxMessaggi}
            showOpponentButton={!!attesaAvversario && !terminata}
            onOpponentTurn={confermaTurnoAvversario}
          />
        </BattleLayoutItem>
      )}

      {!terminata && !mostraMoseB && !attesaPassaggio && !attesaAvversario && !scambioRichiesto && (
        <BattleLayoutItem
          layoutKey="playerMoves"
          label="Mosse giocatore"
          rect={battleLayout.playerMoves}
          editing={layoutEditing}
          onChange={updateBattleLayout}
        >
          <div className="h-full w-full rounded-lg border border-white/15 bg-slate-950/80 p-3 shadow-2xl backdrop-blur-sm">
            <div
              className="grid h-[68%] gap-3"
              style={{ gridTemplateColumns: `repeat(${Math.max(1, mosseA.length)}, minmax(0, 1fr))` }}
            >
              {mosseA.map(({ mossa, idx }) => (
                <MoveButton
                  key={idx}
                  mossa={mossa}
                  livello={pkmnA.livello}
                  textKeyPrefix={`move-${idx}`}
                  disabled={!turnoA || azioneInCorso}
                  onClick={() => eseguiMossa(idx)}
                />
              ))}
            </div>

            {isSelvatico && battaglia && (
              <div className="mt-3 flex justify-end gap-2">
                <ActionButton disabled={!turnoA || azioneInCorso} onClick={eseguiCattura}>
                  Cattura
                </ActionButton>
                {masterballRimaste > 0 && (
                  <ActionButton disabled={!turnoA || azioneInCorso} onClick={eseguiMasterball}>
                    Masterball x{masterballRimaste}
                  </ActionButton>
                )}
              </div>
            )}
          </div>
        </BattleLayoutItem>
      )}

      {isPvP && mostraMoseB && !terminata && !scambioRichiesto && (
        <BattleLayoutItem
          layoutKey="enemyMoves"
          label="Mosse rivale"
          rect={battleLayout.enemyMoves}
          editing={layoutEditing}
          onChange={updateBattleLayout}
        >
          <div className="h-full w-full rounded-lg border border-white/15 bg-slate-950/80 p-3 shadow-2xl backdrop-blur-sm">
            <div
              className="grid h-full gap-3"
              style={{ gridTemplateColumns: `repeat(${Math.max(1, mosseB.length)}, minmax(0, 1fr))` }}
            >
              {mosseB.map(({ mossa, idx }) => (
                <MoveButton
                  key={`B-${idx}`}
                  mossa={mossa}
                  livello={pkmnB.livello}
                  textKeyPrefix={`move-${idx}`}
                  disabled={azioneInCorso}
                  onClick={() => eseguiMossaPvP_B(idx)}
                />
              ))}
            </div>
          </div>
        </BattleLayoutItem>
      )}

      {isPvP && attesaPassaggio && !terminata && (
        <BattleLayoutItem
          layoutKey="passTurnButton"
          label="Passa controllo"
          rect={battleLayout.passTurnButton}
          editing={layoutEditing}
          onChange={updateBattleLayout}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={confermaPassaggio}
            className="arka-button h-full w-full text-base px-6 py-3 shadow-lg"
          >
            <span className="arka-layout-content">
              ▶ Passa il controllo al{' '}
              {attesaPassaggio.direzione === 'A→B' ? 'Rivale' : 'Giocatore'}
            </span>
          </motion.button>
        </BattleLayoutItem>
      )}

      {terminata && isNPC && esito && (() => {
        const allenatore = battaglia?.allenatoreId !== undefined
          ? getAllenatore(battaglia.allenatoreId)
          : null
        const tipoAvv: TipoAvversario =
          allenatore?.tipo === 'Capopalestra'
            ? 'Capopalestra'
            : allenatore?.tipo === 'PVP'
            ? 'PVP'
            : 'NPC'
        const delta = calcolaVariazioneMonete(esito, tipoAvv)
        if (delta === 0) return null
        return (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 arka-panel px-6 py-3 z-20">
            <p className="arka-layout-content text-yellow-300 font-bold text-center">
              {delta > 0 ? `+${delta}₳ guadagnati` : `${delta}₳ persi`}
              {tipoAvv === 'Capopalestra' && delta > 0 && ' 👑'}
            </p>
          </div>
        )
      })()}

      {terminata && (
        <BattleLayoutItem
          layoutKey="continueButton"
          label="Prosegui"
          rect={battleLayout.continueButton}
          editing={layoutEditing}
          onChange={updateBattleLayout}
        >
          <button className="arka-button h-full w-full" onClick={tornaIndietro}>
            <span className="arka-layout-content">Prosegui</span>
          </button>
        </BattleLayoutItem>
      )}

      <BattleLayoutItem
        layoutKey="turnStatus"
        label="Stato turno"
        rect={battleLayout.turnStatus}
        editing={layoutEditing}
        onChange={updateBattleLayout}
      >
        <div className="arka-panel flex h-full w-full items-center justify-center px-4 py-1">
        <span className="arka-layout-content text-sm text-center">
          {terminata
            ? 'Battaglia finita'
            : moveVfx
            ? 'Animazione mossa...'
            : diceRoll
            ? 'Lancio dei dadi...'
            : attesaAvversario
            ? 'Premi Avversario... per continuare'
            : isPvP && attesaPassaggio
            ? attesaPassaggio.direzione === 'A→B'
              ? 'Pronto per passare il controllo al Rivale'
              : 'Pronto per passare il controllo al Giocatore'
            : isPvP && mostraMoseB
            ? 'Turno del Rivale — scegli una mossa'
            : isPvP && turnoA
            ? 'Turno del Giocatore — scegli una mossa'
            : turnoA
            ? 'Il tuo turno'
            : 'Turno avversario...'}
        </span>
        </div>
      </BattleLayoutItem>

      {scambioRichiesto && (
        <ScambioModal
          squadra={squadraA}
          attivoId={pkmnA.istanzaId}
          motivo={scambioRichiesto.motivo}
          onSelect={scegliPokemonCambio}
        />
      )}
    </div>
  )
}

// =============================================================
// SOTTOCOMPONENTI
// =============================================================

function BattleLayoutItem({
  layoutKey,
  label,
  rect,
  editing,
  onChange,
  children,
}: {
  layoutKey: AdminBattleLayoutKey
  label: string
  rect: AdminLayoutRect
  editing: boolean
  onChange: (key: AdminBattleLayoutKey, rect: AdminLayoutRect) => void
  children: ReactNode
}) {
  return (
    <AdminLayoutItem
      rootSelector="[data-battle-layout-root]"
      label={label}
      rect={rect}
      editing={editing}
      onChange={(nextRect) => onChange(layoutKey, nextRect)}
      zIndex={20}
    >
      {children}
    </AdminLayoutItem>
  )
}

type DiceRollDisplay = {
  id: number
  side: 'A' | 'B'
  moveName: string
  rolls: number[]
  increment: number
  damage: number
}

const DIE_PIPS: Record<number, string[]> = {
  1: ['col-start-2 row-start-2'],
  2: ['col-start-1 row-start-1', 'col-start-3 row-start-3'],
  3: ['col-start-1 row-start-1', 'col-start-2 row-start-2', 'col-start-3 row-start-3'],
  4: [
    'col-start-1 row-start-1',
    'col-start-3 row-start-1',
    'col-start-1 row-start-3',
    'col-start-3 row-start-3',
  ],
  5: [
    'col-start-1 row-start-1',
    'col-start-3 row-start-1',
    'col-start-2 row-start-2',
    'col-start-1 row-start-3',
    'col-start-3 row-start-3',
  ],
  6: [
    'col-start-1 row-start-1',
    'col-start-3 row-start-1',
    'col-start-1 row-start-2',
    'col-start-3 row-start-2',
    'col-start-1 row-start-3',
    'col-start-3 row-start-3',
  ],
}

function DiceRollOverlay({ roll }: { roll: DiceRollDisplay }) {
  const total = roll.rolls.reduce((sum, value) => sum + value, 0)

  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: -18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ duration: 0.22 }}
        className="w-[min(560px,88vw)] rounded-md border border-white/20 bg-slate-950/88 px-5 py-4 text-center text-white shadow-2xl backdrop-blur-sm"
      >
        <p className="text-[11px] font-black uppercase text-amber-300">
          {roll.side === 'A' ? 'Lancio giocatore' : 'Lancio avversario'}
        </p>
        <h3 className="mt-1 text-lg font-black">{roll.moveName}</h3>
        <div className="mt-3 flex min-h-16 flex-wrap items-center justify-center gap-3">
          {roll.rolls.map((value, index) => (
            <DieFace key={`${roll.id}-${index}`} value={value} index={index} />
          ))}
        </div>
        <p className="mt-3 text-xs font-bold text-slate-200">
          Dadi: {roll.rolls.join(' + ')}
          {roll.increment > 0 ? ` + ${roll.increment}` : ''}
          {' = '}
          {total + roll.increment}
        </p>
        <p className="mt-1 text-base font-black text-rose-300">
          Danno finale: {roll.damage}
        </p>
      </motion.div>
    </div>
  )
}

function DieFace({ value, index }: { value: number; index: number }) {
  return (
    <motion.div
      initial={{ y: -70, rotate: -180, opacity: 0 }}
      animate={{ y: 0, rotate: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 16, delay: index * 0.08 }}
      className="grid h-14 w-14 shrink-0 grid-cols-3 grid-rows-3 rounded-md border-2 border-slate-300 bg-white p-2 shadow-lg"
      aria-label={`Dado: ${value}`}
    >
      {(DIE_PIPS[value] ?? []).map((position, pipIndex) => (
        <span
          key={`${position}-${pipIndex}`}
          className={`${position} h-2.5 w-2.5 place-self-center rounded-full bg-slate-950`}
        />
      ))}
    </motion.div>
  )
}

function InfoBox({
  messaggi,
  showOpponentButton,
  onOpponentTurn,
}: {
  messaggi: string[]
  showOpponentButton: boolean
  onOpponentTurn: () => void
}) {
  const righe = messaggi.slice(-4)
  const frameSrc = assetUrl('/ui/infobox.png')

  return (
    <div
      className="relative h-full w-full text-slate-950 drop-shadow-2xl"
      style={{
        backgroundImage: `url(${frameSrc})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div
        className={`absolute left-[8%] top-[16%] space-y-1.5 text-[clamp(11px,0.92vw,15px)] font-extrabold leading-snug ${
          showOpponentButton ? 'right-[28%]' : 'right-[8%]'
        }`}
      >
        {righe.map((msg, idx) => (
          <p
            key={`${idx}-${msg}`}
            data-admin-layout-text-key={`message-${idx}`}
            className="arka-layout-content whitespace-normal break-words"
          >
            {msg}
          </p>
        ))}
      </div>

      {showOpponentButton && (
        <button
          className="absolute bottom-[13%] right-[8%] rounded-md bg-amber-400 px-4 py-2 text-xs font-extrabold text-slate-950 shadow-lg hover:bg-amber-300 active:scale-95"
          onClick={onOpponentTurn}
        >
          Avversario...
        </button>
      )}
    </div>
  )
}

function ScambioModal({
  squadra,
  attivoId,
  motivo,
  onSelect,
}: {
  squadra: PokemonIstanza[]
  attivoId: string
  motivo: string
  onSelect: (pokemon: PokemonIstanza) => void
}) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/62 px-6 backdrop-blur-sm">
      <div className="w-[min(760px,92vw)] rounded-lg border border-white/15 bg-slate-950/92 p-5 text-white shadow-2xl">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold">Scegli un Pokemon</h2>
            <p className="mt-1 text-sm font-semibold text-slate-300">{motivo}</p>
          </div>
          <span className="text-xs font-bold uppercase tracking-wide text-amber-300">
            Cambio squadra
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {squadra.slice(0, 6).map((pokemon) => {
            const specie = getPokemon(pokemon.specieId)
            const hpMax = calcolaHPMax(pokemon)
            const pct = Math.max(0, Math.min(100, (pokemon.hp / hpMax) * 100))
            const disabled = pokemon.hp <= 0 || pokemon.istanzaId === attivoId

            return (
              <button
                key={pokemon.istanzaId}
                disabled={disabled}
                onClick={() => onSelect(pokemon)}
                className="flex min-h-[116px] items-center gap-3 rounded-md border border-white/10 bg-slate-900/86 p-3 text-left shadow-lg transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <img
                  src={assetUrl(`/sprites/front_sprites/${pokemon.specieId}.png`)}
                  alt=""
                  className="h-20 w-20 shrink-0 object-contain"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-extrabold">
                      {pokemon.nome}
                    </span>
                    <span className="text-xs font-bold text-slate-300">
                      LV. {pokemon.livello}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/60">
                    <div
                      className="h-full bg-emerald-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-xs font-bold text-slate-300">
                    <span>{pokemon.hp}/{hpMax}</span>
                    <span>{pokemon.hp <= 0 ? 'KO' : specie?.tipo}</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function SquadIndicator({
  squadra,
}: {
  squadra: PokemonIstanza[]
}) {
  return (
    <div className="relative z-10 flex h-full w-full items-center gap-1">
      {squadra.map((p) => (
        <div
          key={p.istanzaId}
          className={`w-3 h-3 rounded-full border border-white/60 ${
            p.hp > 0 ? 'bg-emerald-400' : 'bg-slate-600'
          }`}
          title={`${p.nome} lv${p.livello} (${p.hp} HP)`}
        />
      ))}
    </div>
  )
}

function PokemonBattleSlot({
  istanza,
  position,
  shaking,
  lunging,
}: {
  istanza: PokemonIstanza
  position: 'top-right' | 'bottom-left'
  shaking: boolean
  lunging: boolean
}) {
  const isPlayer = position === 'bottom-left'
  const spriteFolder = isPlayer ? 'back_sprites' : 'front_sprites'
  const spriteSrc = assetUrl(`/sprites/${spriteFolder}/${istanza.specieId}.png`)
  const isKO = istanza.hp <= 0

  const innerAnim = shaking
    ? { x: [0, -8, 8, -8, 8, 0] }
    : lunging
    ? { x: isPlayer ? [0, 30, 0] : [0, -30, 0] }
    : {}

  return (
    <motion.div
      className="relative z-10 h-full w-full"
      initial={{ x: isPlayer ? -400 : 400, opacity: 0 }}
      animate={{
        x: 0,
        opacity: isKO ? 0.45 : 1,
        filter: isKO ? 'grayscale(100%)' : 'grayscale(0%)',
      }}
      exit={{ y: 180, opacity: 0, rotate: isPlayer ? -15 : 15, filter: 'grayscale(100%)' }}
      transition={{ type: 'spring', stiffness: 110, damping: 16 }}
    >
      <motion.div
        animate={innerAnim}
        transition={{ duration: 0.4 }}
        className="flex h-full w-full items-center justify-center drop-shadow-2xl"
      >
        <img
          src={spriteSrc}
          alt={istanza.nome}
          className="w-full h-full object-contain"
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).style.display = 'none'
            const sib = e.currentTarget.nextElementSibling as HTMLElement | null
            if (sib) sib.style.display = 'flex'
          }}
        />
        <span
          className="text-5xl items-center justify-center w-full h-full rounded-full bg-arka-surface border-4 border-white"
          style={{ display: 'none' }}
        >
          {isPlayer ? '🐺' : '🦈'}
        </span>
      </motion.div>
    </motion.div>
  )
}

function HpBar({
  nome,
  livello,
  hp,
  hpMax,
  stato,
  side,
  className = '',
}: {
  nome: string
  livello: number
  hp: number
  hpMax: number
  stato?: StatoAlterato
  side: 'player' | 'enemy'
  className?: string
}) {
  const pct = Math.max(0, Math.min(100, (hp / hpMax) * 100))
  const colore = pct > 60 ? 'var(--hp-high)' : pct > 25 ? 'var(--hp-mid)' : 'var(--hp-low)'
  const badge = stato ? STATO_BADGE[stato] : null
  const frameSrc = assetUrl(`/ui/hp_bar_${side}.png`)

  return (
    <div
      className={`relative z-20 h-full w-full text-white drop-shadow-2xl ${className}`}
      style={{
        backgroundImage: `url(${frameSrc})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="absolute left-[13.5%] right-[6.5%] top-[15%] flex items-center justify-between gap-3">
        <span
          data-admin-layout-text-key="pokemon-name"
          className="arka-layout-content min-w-0 truncate text-[clamp(13px,1.25vw,18px)] font-extrabold leading-none text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.85)]"
        >
          {nome}
          {badge && (
            <span
              className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${badge.color} text-white`}
              title={stato}
            >
              {badge.emoji} {badge.label}
            </span>
          )}
        </span>
        <span
          data-admin-layout-text-key="pokemon-level"
          className="arka-layout-content shrink-0 text-[clamp(11px,1vw,15px)] font-extrabold text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.85)]"
        >
          LV. {livello}
        </span>
      </div>
      <div className="absolute left-[10.5%] top-[70%] h-[16%] w-[59.2%] overflow-hidden rounded-r-[999px] bg-black/35">
        <motion.div
          className="h-full"
          style={{ backgroundColor: colore }}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <div
        data-admin-layout-text-key="pokemon-hp"
        className="arka-layout-content absolute left-[72%] right-[5%] top-[68%] text-right text-[clamp(10px,0.9vw,13px)] font-extrabold text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)]"
      >
        {hp}/{hpMax}
      </div>
    </div>
  )
}

function typeColor(tipo: string): string {
  const key = tipo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  return `var(--tw-color-tipo-${key})`
}

function ActionButton({
  children,
  disabled,
  onClick,
}: {
  children: ReactNode
  disabled: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      whileHover={!disabled ? { y: -1, scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.96 } : {}}
      disabled={disabled}
      onClick={onClick}
      className="rounded-md bg-amber-400 px-5 py-2.5 text-sm font-extrabold text-slate-950 shadow-lg transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-45"
    >
      {children}
    </motion.button>
  )
}

function MoveButton({
  mossa,
  livello,
  textKeyPrefix,
  disabled,
  onClick,
}: {
  mossa: MossaDef
  livello: number
  textKeyPrefix: string
  disabled: boolean
  onClick: () => void
}) {
  const dadi = mossa.dadiPerLivello[String(livello)] ?? 1
  const incremento = mossa.incrementoPerLivello[String(livello)] ?? 0
  const coloreTipo = typeColor(mossa.tipo)
  const frameSrc = assetUrl('/ui/move_button.png')

  return (
    <motion.button
      whileHover={!disabled ? { y: -2, scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      disabled={disabled}
      onClick={onClick}
      className="relative h-full min-h-0 overflow-hidden px-5 py-4 text-left text-slate-950 drop-shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-45"
      style={{
        backgroundImage: `url(${frameSrc})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div
        className="absolute left-4 top-4 h-[calc(100%-32px)] w-1.5 rounded-full"
        style={{ backgroundColor: coloreTipo }}
      />
      <div
        data-admin-layout-text-key={`${textKeyPrefix}-name`}
        className="arka-layout-content truncate pl-3 pr-2 text-[15px] font-extrabold leading-tight"
      >
        {mossa.nome}
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 pl-3 text-[12px] font-bold">
        <span
          data-admin-layout-text-key={`${textKeyPrefix}-dice`}
          className="arka-layout-content rounded bg-white/60 px-2 py-1 text-slate-900 shadow-inner"
        >
          D6 {dadi} +{incremento}
        </span>
        <span
          data-admin-layout-text-key={`${textKeyPrefix}-type`}
          className="arka-layout-content rounded px-2 py-1 text-[11px] font-extrabold uppercase text-slate-950 shadow"
          style={{ backgroundColor: coloreTipo }}
        >
          {mossa.tipo}
        </span>
      </div>
    </motion.button>
  )
}
