import { nextBattleSide } from '@/components/battle/battleRoundOrder'
import { restoreBattleCheckpoint, settledBattleCheckpoint } from '@/components/battle/battleCheckpoint'
import { BattleOpeningOverlay } from '@/components/battle/BattleOpeningOverlay'
import { SupremeMoveDialog } from '@/components/battle/SupremeMoveDialog'
import { getMoveVfxAssignment } from '@/components/vfx/moveVfxAssignments'
import { useGameStore, creaIstanza, haSpazioPokemon } from '@store/gameStore'
import { useAdminStore } from '@store/adminStore'
import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  calcolaDanno,
  calcolaAzioneSuprema,
  costoSuprema,
  calcolaHPMax,
  scegliMossaIA,
  tentaCattura,
  applicaXP,
  xpGuadagnato,
  applicaStato,
  risolviStatoInizioTurno,
  èMossaCura,
  applicaMossaCura,
  getMossaAlLivello,
  esitoSquadre,
} from '@engine/battleEngine'
import { getPokemon, getMossa, getAllenatore } from '@data/index'
import { calcolaVariazioneMonete, type TipoAvversario } from '@engine/battleEngine'
import type {
  PokemonIstanza,
  MossaDef,
  RisultatoMossa,
  StatoAlterato,
  TipoPokemon,
} from '@/types'
import type { AdminBattleLayoutKey, AdminLayoutRect } from '@/theme/adminThemeTypes'
import { getBackground, BATTLE_BG_DEFAULT } from '@data/backgrounds'
import { assetUrl } from '@/utils/assetUrl'
import { playSound } from '@/utils/soundManager'
import { AdminLayoutItem } from '@/admin/AdminLayoutItem'
import {
  ArkamonBattleSprite,
  type ArkamonAnimationCue,
} from '@/components/arkamon/ArkamonBattleSprite'
import {
  getArkamonAnimationAsset,
  getArkamonAnimationDurationMs,
  type ArkamonBattleAnimation,
} from '@/components/arkamon/arkamonAnimationManifest'
import { prepareArkamonAnimationPlayback } from '@/components/arkamon/preloadArkamonAnimations'
import {
  createBattleAnimationPlayback,
  createBattleVisualSequence,
  planBattleAnimationPlayback,
} from '@/components/battle/battleVisualSequence'
import {
  MoveVfx,
  type MoveVfxEvent,
  type MoveVfxSide,
  type MoveVfxTarget,
} from '@/components/MoveVfx'
import {
  preloadMoveVfxForPokemon,
  preloadVfxAssets,
  prepareMoveVfxPlayback,
} from '@/components/vfx/preloadVfxAssets'
import { DEFAULT_PRELOAD_VFX_ASSET_IDS } from '@/components/vfx/vfxManifest'
import { DiceRollOverlay, type DiceRollDisplay } from '@/components/battle/DiceRollOverlay'
import {
  BATTLE_DICE_ASSET_IDS,
  BATTLE_DICE_ROLL_VISIBLE_MS,
} from '@/components/battle/battleDiceAssets'
import {
  getMoveVfxFeedback,
  getMoveVfxImpactDelayMs,
} from '@/components/vfx/resolveMoveVfxAsset'
import type { AdminBattleLayout } from '@/theme/adminThemeTypes'
import {
  getBattleSideCenter,
} from '@/components/vfx/battleVfxPosition'

const STATO_BADGE: Record<StatoAlterato, { label: string; color: string; emoji: string }> = {
  Paralizzato: { label: 'PAR', color: 'bg-amber-500', emoji: '⚡' },
  Confuso: { label: 'CONF', color: 'bg-fuchsia-500', emoji: '💫' },
  Addormentato: { label: 'ZZZ', color: 'bg-blue-500', emoji: '😴' },
  Avvelenato: { label: 'PSN', color: 'bg-purple-600', emoji: '☠️' },
}

const INFOBOX_VISIBLE_MS = 2000

const VFX_TYPE_COLORS: Record<TipoPokemon, string> = {
  Normale: '#f8fafc',
  Fuoco: '#fb923c',
  Acqua: '#38bdf8',
  Erba: '#4ade80',
  Elettro: '#fde047',
  Terra: '#d6a15f',
  Psico: '#e879f9',
  Oscurità: '#a78bfa',
}

type PendingSwitch = {
  motivo: string
  prossimoPasso: 'passaAdA' | 'passaAB'
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
  const aggiornaBattaglia = useGameStore((s) => s.aggiornaBattaglia)
  const concludiCattura = useGameStore((s) => s.concludiCattura)
  const aggiornaPokemon = useGameStore((s) => s.aggiornaPokemon)
  const giocatoreAttivo = useGameStore((s) => s.giocatoreAttivo)
  const giocatore = useGameStore((s) =>
    s.giocatoreAttivo === 1 ? s.giocatore1 : s.giocatore2
  )
  const risolviBattagliaNPC = useGameStore((s) => s.risolviBattagliaNPC)
  const battleLayout = useAdminStore((s) => s.theme.layouts.battle)
  const customBattleBackground = useAdminStore((s) => s.theme.assets.battleBackground)
  const layoutEditing = useAdminStore((s) => s.layoutEditing)
  const updateBattleLayout = useAdminStore((s) => s.updateBattleLayout)
  const masterballRimaste = useGameStore((s) =>
    s.giocatoreAttivo === 1
      ? s.giocatore1.inventario.masterball ?? 0
      : s.giocatore2.inventario.masterball ?? 0
  )
  const [initialCheckpoint] = useState(() => battaglia ? restoreBattleCheckpoint(battaglia) : null)
  const [esito, setEsito] = useState<'vittoria' | 'sconfitta' | null>(initialCheckpoint?.outcome ?? null)

  const [pkmnA, updatePkmnA] = useState<PokemonIstanza | null>(null)
  const [pkmnB, updatePkmnB] = useState<PokemonIstanza | null>(null)
  const [squadraA, setSquadraA] = useState<PokemonIstanza[]>([])
  const [squadraB, setSquadraB] = useState<PokemonIstanza[]>([])
  const [infoBoxMessaggi, setInfoBoxMessaggi] = useState<string[]>([])
  const [diceRoll, setDiceRoll] = useState<DiceRollDisplay | null>(null)
  const [pendingHealth, setPendingHealth] = useState<{
    side: 'A' | 'B'
    instanceId: string
    hp: number
  } | null>(null)
  const diceRollTimerRef = useRef<number | null>(null)
  const diceRollIdRef = useRef(0)
  const diceRollCallbacksRef = useRef<{
    id: number
    onVisible: () => void
    onComplete: () => void
  } | null>(null)
  const [impactPulse, setImpactPulse] = useState<ImpactPulseDisplay | null>(null)
  const impactPulseIdRef = useRef(0)
  const [moveVfx, setMoveVfx] = useState<MoveVfxEvent | null>(null)
  const moveVfxIdRef = useRef(0)
  const moveVfxCallbacksRef = useRef<{
    id: number
    onStart: () => void
    onImpact: () => void
    onComplete: () => void
  } | null>(null)
  const [spriteActions, setSpriteActions] = useState<Partial<Record<'A' | 'B', {
    animation: 'attack' | 'hit'
    replayKey: number
  }>>>({})
  const spriteActionIdRef = useRef(0)
  const [heldHitReactions, setHeldHitReactions] = useState<Partial<Record<'A' | 'B', boolean>>>({})
  const spriteCompletionWaitersRef = useRef<Partial<Record<'A' | 'B', {
    animation: ArkamonBattleAnimation
    replayKey?: number
    onComplete: () => void
  }>>>({})
  const spriteStartWaitersRef = useRef<Partial<Record<'A' | 'B', {
    animation: 'attack' | 'hit'
    replayKey?: number
    onStart: () => void
  }>>>({})
  const spriteCueWaitersRef = useRef<Partial<Record<'A' | 'B', {
    replayKey?: number
    onRelease: () => void
  }>>>({})
  const activePlaybackRef = useRef<{ cancel: () => void } | null>(null)
  const feedbackTimersRef = useRef<Set<number>>(new Set())
  const messaggiTurnoBRef = useRef<string[]>([])
  const [azioneInCorso, setAzioneInCorso] = useState(false)
  const [supremaSide, setSupremaSide] = useState<'A' | 'B' | null>(null)
  const actionInProgressRef = useRef(false)
  const [turnoA, setTurnoA] = useState(true)
  const [coinOpen, setCoinOpen] = useState(() => Boolean(battaglia && !initialCheckpoint?.openingComplete && battaglia.pokemonA.livello === battaglia.pokemonB.livello && (battaglia.pokemonA.stato?.tipo === 'Paralizzato') === (battaglia.pokemonB.stato?.tipo === 'Paralizzato')))
  const [statusRoll, setStatusRoll] = useState<{ id: number; value: number; title: string; done: () => void } | null>(null)
  const statusRollIdRef = useRef(0)
  const statusPending = useRef(false)
  const actedThisRound = useRef(new Set<'A' | 'B'>(initialCheckpoint?.actedThisRound ?? []))
  const latestPokemon = useRef({ A: pkmnA, B: pkmnB })
  latestPokemon.current = { A: pkmnA, B: pkmnB }
  // Turn hand-offs happen in the same callback as HP/status changes and replacements.
  // Update the ref immediately instead of waiting for the next React render.
  const setPkmnA = (pokemon: PokemonIstanza | null) => {
    latestPokemon.current.A = pokemon
    updatePkmnA(pokemon)
  }
  const setPkmnB = (pokemon: PokemonIstanza | null) => {
    latestPokemon.current.B = pokemon
    updatePkmnB(pokemon)
  }
  function nextSide(side: 'A' | 'B', a = latestPokemon.current.A, b = latestPokemon.current.B): 'A' | 'B' {
    // The opening side may have been reversed by pre-existing paralysis.
    // Once it clears, restore the level/coin priority rather than that forced order.
    const initial = initialCheckpoint?.initialPriority ?? 'A'
    return nextBattleSide(actedThisRound.current, side, initial, a?.stato?.tipo, b?.stato?.tipo)
  }
  function presentStatus(result: ReturnType<typeof risolviStatoInizioTurno>, pokemon: PokemonIstanza, done: () => void) {
    statusPending.current = true
    let continued = false
    setStatusRoll({ id: ++statusRollIdRef.current, value: result.tiroStato!, title: `${pokemon.nome} · ${pokemon.stato?.tipo === 'Paralizzato' ? 'Paralisi: esci con 5–6' : 'Sonno: svegliati con 4–6'}`, done: () => {
      if (continued) return
      continued = true
      statusPending.current = false
      setStatusRoll(null)
      done()
    } })
  }
  const [shaking, setShaking] = useState<'A' | 'B' | null>(null)
  const [impactFlash, setImpactFlash] = useState<'A' | 'B' | null>(null)
  const [shakeStrengthPx, setShakeStrengthPx] = useState(8)
  const [shakeDurationMs, setShakeDurationMs] = useState(260)
  const [cameraShake, setCameraShake] = useState<{ px: number; ms: number } | null>(null)
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
  const [terminata, setTerminata] = useState(Boolean(initialCheckpoint?.outcome))
  const [evoluzioniInAttesa, setEvoluzioniInAttesa] = useState<
    { istanzaId: string; oldSpecieId: number; newSpecieId: number }[]
  >(initialCheckpoint?.evolutions ?? [])
  const luogoRitornoRef = useRef(battaglia?.luogoRitorno ?? 'mappa-principale')

  useEffect(() => {
    preloadVfxAssets([...DEFAULT_PRELOAD_VFX_ASSET_IDS, ...BATTLE_DICE_ASSET_IDS])
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
    if (!initialCheckpoint?.openingComplete && !initialCheckpoint?.outcome) playSound('battle-start')
    if (battaglia) {
      const turnoInizialeA = battaglia.turnoCorrente === 'A'
      setPkmnA(battaglia.pokemonA)
      setPkmnB(battaglia.pokemonB)
      setSquadraA(battaglia.squadraA ?? [battaglia.pokemonA])
      setSquadraB(battaglia.squadraB ?? [battaglia.pokemonB])
      setInfoBoxMessaggi(battaglia.log.slice(-4))
      setTurnoA(turnoInizialeA)
      if (initialCheckpoint?.phase === 'switch' && initialCheckpoint.switchRequest) {
        setScambioRichiesto({
          ...initialCheckpoint.switchRequest,
          pendingB: initialCheckpoint.switchRequest.prossimoPasso === 'passaAB' ? battaglia.pokemonB : undefined,
        })
      } else if (initialCheckpoint?.phase === 'rival-move') {
        setTurnoA(false)
        setMostraMoseB(true)
        messaggiTurnoBRef.current = initialCheckpoint.rivalMessages
      } else if (initialCheckpoint?.phase === 'pass-player') {
        setAttesaPassaggio({ direzione: 'B→A' })
      } else if (initialCheckpoint?.phase === 'pass-rival') {
        setAttesaPassaggio({ direzione: 'A→B', pendingB: battaglia.pokemonB })
      } else if (!turnoInizialeA && !initialCheckpoint?.outcome) {
        if (battaglia.tipo === 'PVP') {
          setAttesaPassaggio({ direzione: 'A→B', pendingB: battaglia.pokemonB })
        } else {
          setAttesaAvversario(battaglia.pokemonB)
        }
      }
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

  // Save only settled turns. Reloading during a cinematic retries that action from
  // its previous checkpoint; it cannot restore an HP change without its dice.
  useEffect(() => {
    if (!battaglia || !pkmnA || !pkmnB || coinOpen || statusRoll || azioneInCorso
      || actionInProgressRef.current || moveVfx || diceRoll || pendingHealth) return
    const checkpoint = settledBattleCheckpoint({
      initialPriority: initialCheckpoint?.initialPriority ?? 'A',
      actedThisRound: actedThisRound.current,
      turnA: turnoA,
      pvp: battaglia.tipo === 'PVP',
      chooseRivalMove: mostraMoseB,
      passDirection: attesaPassaggio?.direzione,
      switchRequest: scambioRichiesto ? { motivo: scambioRichiesto.motivo, prossimoPasso: scambioRichiesto.prossimoPasso } : undefined,
      outcome: terminata ? esito : null,
      openingComplete: true,
      evolutions: evoluzioniInAttesa,
      rivalMessages: messaggiTurnoBRef.current,
    })
    aggiornaBattaglia({
      pokemonA: pkmnA,
      pokemonB: pkmnB,
      squadraA,
      squadraB,
      hpMaxA: calcolaHPMax(pkmnA),
      hpMaxB: calcolaHPMax(pkmnB),
      turnoCorrente: turnoA ? 'A' : 'B',
      ...(infoBoxMessaggi.length > 0 ? { log: infoBoxMessaggi } : {}),
      checkpoint,
    })
    // The store patch changes battaglia but must not recursively save the same local state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pkmnA, pkmnB, squadraA, squadraB, coinOpen, statusRoll, azioneInCorso, moveVfx,
    diceRoll, pendingHealth, turnoA, mostraMoseB, attesaPassaggio, scambioRichiesto,
    terminata, esito, evoluzioniInAttesa, infoBoxMessaggi, aggiornaBattaglia])

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
      diceRollCallbacksRef.current = null
      activePlaybackRef.current?.cancel()
      activePlaybackRef.current = null
      moveVfxCallbacksRef.current = null
      for (const timer of feedbackTimersRef.current) {
        window.clearTimeout(timer)
      }
      feedbackTimersRef.current.clear()
      spriteCompletionWaitersRef.current = {}
      spriteStartWaitersRef.current = {}
      spriteCueWaitersRef.current = {}
    }
  }, [])

  const luogoRitorno = luogoRitornoRef.current
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
    onVisible: () => void,
    onComplete: () => void
  ) => {
    if (diceRollTimerRef.current !== null) {
      window.clearTimeout(diceRollTimerRef.current)
      diceRollTimerRef.current = null
    }

    const id = ++diceRollIdRef.current
    diceRollCallbacksRef.current = { id, onVisible, onComplete }
    setDiceRoll({
      id,
      side,
      moveName: risultato.suprema ? `${risultato.mossa.nome} · Suprema` : risultato.mossa.nome,
      rolls: risultato.tiriDado,
      increment: risultato.incremento,
      damage: risultato.dannoFinale,
    })
  }

  const revealLancioDadi = (id: number) => {
    const callbacks = diceRollCallbacksRef.current
    if (!callbacks || callbacks.id !== id || diceRollTimerRef.current !== null) return
    callbacks.onVisible()
    diceRollTimerRef.current = window.setTimeout(() => {
      if (diceRollCallbacksRef.current !== callbacks) return
      setDiceRoll(null)
      diceRollTimerRef.current = null
      diceRollCallbacksRef.current = null
      callbacks.onComplete()
    }, BATTLE_DICE_ROLL_VISIBLE_MS)
  }

  const mostraVfxMossa = (
    move: MossaDef,
    side: MoveVfxSide,
    id: number,
    callbacks: Omit<NonNullable<typeof moveVfxCallbacksRef.current>, 'id'>,
    target: MoveVfxTarget = 'opponent'
  ) => {
    moveVfxCallbacksRef.current = { id, ...callbacks }
    setMoveVfx({
      id,
      move,
      side,
      target,
    })
  }

  const notifyMoveVfx = (id: number, event: 'onStart' | 'onImpact' | 'onComplete') => {
    const callbacks = moveVfxCallbacksRef.current
    if (!callbacks || callbacks.id !== id) return
    if (event === 'onComplete') {
      moveVfxCallbacksRef.current = null
      setMoveVfx((current) => current?.id === id ? null : current)
    }
    callbacks[event]()
  }

  const scheduleFeedbackTimer = (callback: () => void, delayMs: number) => {
    const timer = window.setTimeout(() => {
      feedbackTimersRef.current.delete(timer)
      callback()
    }, delayMs)
    feedbackTimersRef.current.add(timer)
  }

  const playSpriteAction = (side: 'A' | 'B', animation: 'attack' | 'hit', requestMs: number) => {
    const replayKey = ++spriteActionIdRef.current
    const waiter = spriteCompletionWaitersRef.current[side]
    if (waiter?.animation === animation) waiter.replayKey = replayKey
    const startWaiter = spriteStartWaitersRef.current[side]
    if (startWaiter?.animation === animation) startWaiter.replayKey = replayKey
    const cueWaiter = spriteCueWaitersRef.current[side]
    if (animation === 'attack' && cueWaiter) cueWaiter.replayKey = replayKey
    setSpriteActions((current) => ({ ...current, [side]: { animation, replayKey } }))
    const pokemon = side === 'A' ? pkmnA : pkmnB
    // Keep native requests alive through their actual completion, including a gated hit.
    if (pokemon && getArkamonAnimationAsset(pokemon.specieId, side === 'A' ? 'back' : 'front', animation)) return
    // Static sprites retain their short procedural feedback.
    scheduleFeedbackTimer(() => {
      setSpriteActions((current) => current[side]?.replayKey === replayKey
        ? { ...current, [side]: undefined }
        : current)
    }, requestMs)
  }

  const completeSpriteAction = (side: 'A' | 'B', animation: ArkamonBattleAnimation, replayKey: number) => {
    setSpriteActions((current) => current[side]?.animation === animation && current[side]?.replayKey === replayKey
      ? { ...current, [side]: undefined }
      : current)
    const waiter = spriteCompletionWaitersRef.current[side]
    if (!waiter || waiter.animation !== animation || (waiter.replayKey !== undefined && waiter.replayKey !== replayKey)) return
    delete spriteCompletionWaitersRef.current[side]
    waiter.onComplete()
  }

  const startSpriteAction = (side: 'A' | 'B', animation: ArkamonBattleAnimation, replayKey: number) => {
    const waiter = spriteStartWaitersRef.current[side]
    if (!waiter || waiter.animation !== animation || waiter.replayKey !== replayKey) return
    delete spriteStartWaitersRef.current[side]
    waiter.onStart()
  }

  const releaseSpriteAction = (side: 'A' | 'B', animation: ArkamonBattleAnimation, replayKey: number) => {
    const waiter = spriteCueWaitersRef.current[side]
    if (!waiter || animation !== 'attack' || waiter.replayKey !== replayKey) return
    delete spriteCueWaitersRef.current[side]
    waiter.onRelease()
  }

  const playImpactFeedback = (
    move: MossaDef,
    side: 'A' | 'B',
    playHitSound = true,
    playHitAnimation = true
  ) => {
    const feedback = getMoveVfxFeedback(move)

    if (playHitAnimation) playSpriteAction(side, 'hit', Math.max(240, feedback.targetShakeMs))
    if (feedback.targetShakeMs > 0 && feedback.targetShakePx > 0) {
      setShakeStrengthPx(feedback.targetShakePx)
      setShakeDurationMs(feedback.targetShakeMs)
      setShaking(side)
      scheduleFeedbackTimer(() => setShaking(null), feedback.targetShakeMs)
    }

    if (feedback.targetFlashMs > 0) {
      setImpactFlash(side)
      scheduleFeedbackTimer(() => setImpactFlash(null), feedback.targetFlashMs)
    }

    if (feedback.cameraShakeMs > 0 && feedback.cameraShakePx > 0) {
      setCameraShake({
        px: feedback.cameraShakePx,
        ms: feedback.cameraShakeMs,
      })
      scheduleFeedbackTimer(() => setCameraShake(null), feedback.cameraShakeMs)
    }

    if (playHitSound && !getMoveVfxAssignment(move)) playSound('hit')
  }

  const playMoveVisuals = (
    move: MossaDef,
    side: 'A' | 'B',
    targetSide: 'A' | 'B' | null,
    targetAnimation: 'hit' | 'ko',
    onImpact: () => void,
    onComplete: () => void
  ) => {
    const attacker = side === 'A' ? pkmnA : pkmnB
    const target = targetSide === 'A' ? pkmnA : targetSide === 'B' ? pkmnB : null
    if (!attacker) return
    const attackerView = side === 'A' ? 'back' : 'front'
    const targetView = targetSide === 'A' ? 'back' : 'front'
    const attackAsset = getArkamonAnimationAsset(attacker.specieId, attackerView, 'attack')
    const targetAsset = target ? getArkamonAnimationAsset(target.specieId, targetView, targetAnimation) : undefined
    const dedicatedAttack = !!attackAsset
    const dedicatedHit = targetAnimation === 'hit' && !!targetAsset
    setHeldHitReactions(targetSide && dedicatedHit ? { [targetSide]: true } : {})
    const plan = planBattleAnimationPlayback(
      attackAsset ? (attackAsset.releaseFrame ?? 0) / attackAsset.fps * 1000 : 0,
      dedicatedHit && targetAsset ? (targetAsset.reactionFrame ?? 0) / targetAsset.fps * 1000 : 0,
      getMoveVfxImpactDelayMs(move)
    )
    const effectId = ++moveVfxIdRef.current
    const sequence = createBattleVisualSequence({
      waitForAttacker: dedicatedAttack,
      waitForTarget: !!targetAsset,
      onRelease: () => mostraVfxMossa(move, side, effectId, {
        onStart: () => playback.vfxStart(),
        onImpact: () => sequence.impact(),
        onComplete: () => sequence.vfxComplete(),
      }, targetSide ? 'opponent' : 'self'),
      onImpact: () => {
        setHeldHitReactions({})
        onImpact()
      },
      onComplete: () => {
        playback.cancel()
        if (activePlaybackRef.current === active) activePlaybackRef.current = null
        onComplete()
      },
    })
    const playback = createBattleAnimationPlayback({
      plan,
      dedicatedAttack,
      dedicatedHit,
      schedule: scheduleFeedbackTimer,
      startAttack: () => {
        if (dedicatedAttack) {
          spriteStartWaitersRef.current[side] = { animation: 'attack', onStart: () => playback.attackerStart() }
          spriteCueWaitersRef.current[side] = { onRelease: () => playback.release() }
          spriteCompletionWaitersRef.current[side] = {
            animation: 'attack', onComplete: () => {
              playback.release()
              sequence.attackerComplete()
            },
          }
        }
        playSpriteAction(side, 'attack', 450)
      },
      startHit: () => {
        if (!targetSide) return
        spriteStartWaitersRef.current[targetSide] = { animation: 'hit', onStart: () => playback.targetStart() }
        spriteCompletionWaitersRef.current[targetSide] = { animation: 'hit', onComplete: () => {
          playback.targetStart()
          sequence.targetComplete()
        } }
        playSpriteAction(targetSide, 'hit', 240)
      },
      onRelease: () => sequence.release(),
    })
    const active = { cancel: () => { playback.cancel(); sequence.cancel() } }
    activePlaybackRef.current?.cancel()
    activePlaybackRef.current = active
    if (targetSide && targetAnimation === 'ko' && targetAsset) {
      spriteCompletionWaitersRef.current[targetSide] = {
        animation: 'ko', replayKey: 0, onComplete: () => sequence.targetComplete(),
      }
    }
    // All resources are ready before either clip's native clock can start.
    void Promise.all([
      prepareArkamonAnimationPlayback(attacker.specieId, attackerView, 'attack'),
      target ? prepareArkamonAnimationPlayback(target.specieId, targetView, targetAnimation) : Promise.resolve(),
      prepareMoveVfxPlayback(move, effectId),
    ]).then(() => {
      if (activePlaybackRef.current === active) playback.start()
    })
  }

  const eseguiSequenzaOffensiva = (
    risultato: RisultatoMossa,
    side: 'A' | 'B',
    targetSide: 'A' | 'B',
    playHitSound: boolean,
    onImpact: () => void,
    onComplete: () => void
  ) => {
    if (actionInProgressRef.current) return
    actionInProgressRef.current = true
    setAzioneInCorso(true)
    const feedback = getMoveVfxFeedback(risultato.mossa)
    const target = targetSide === 'A' ? pkmnA : pkmnB
    // Keep the bar at its pre-attack HP while resolved HP can start a native KO.
    setPendingHealth(target ? { side: targetSide, instanceId: target.istanzaId, hp: target.hp } : null)
    const targetAnimation = target && target.hp <= risultato.dannoFinale ? 'ko' : 'hit'
    const targetHasHit = target && !!getArkamonAnimationAsset(target.specieId, targetSide === 'A' ? 'back' : 'front', 'hit')
    playMoveVisuals(risultato.mossa, side, targetSide, targetAnimation, () => {
      onImpact()
      playImpactFeedback(risultato.mossa, targetSide, playHitSound, targetAnimation === 'hit' && !targetHasHit)

      const pulseId = ++impactPulseIdRef.current
      setImpactPulse({
        id: pulseId,
        side: targetSide,
        color: VFX_TYPE_COLORS[risultato.mossa.tipo],
        strength: Math.max(0.85, 0.9 + feedback.cameraShakePx * 0.06),
      })
      scheduleFeedbackTimer(() => {
        setImpactPulse((current) => (current?.id === pulseId ? null : current))
      }, 560)

    }, () => {
      mostraLancioDadi(risultato, side, () => setPendingHealth(null), () => {
        onComplete()
        actionInProgressRef.current = false
        setAzioneInCorso(false)
      })
    })
  }

  const eseguiSequenzaCura = (
    move: MossaDef,
    side: 'A' | 'B',
    onComplete: () => void
  ) => {
    if (actionInProgressRef.current) return
    actionInProgressRef.current = true
    setAzioneInCorso(true)
    playMoveVisuals(move, side, null, 'hit', () => {}, () => {
      onComplete()
      actionInProgressRef.current = false
      setAzioneInCorso(false)
    })
  }

  const tornaIndietro = () => {
    if (isNPC && esito) risolviBattagliaNPC(esito)
    for (const p of squadraA) aggiornaPokemon(giocatoreAttivo, p)
    terminaBattaglia(false)

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

  const eseguiMossaPvP_B = (numeroMossa: 0 | 1 | 2, suprema = false) => {
    if (terminata || turnoA || !mostraMoseB || azioneInCorso || actionInProgressRef.current) return
    setMostraMoseB(false)
    const messaggiIniziali = messaggiTurnoBRef.current
    messaggiTurnoBRef.current = []
    eseguiMossaB(pkmnB, calcolaHPMax(pkmnB), numeroMossa, messaggiIniziali, suprema)
  }

  const passaTurnoAaB = (nuovoB: PokemonIstanza, delayMs = 1500) => {
    if (nextSide('A', latestPokemon.current.A, nuovoB) === 'A') { setTurnoA(true); return }
    setTurnoA(false)
    if (isPvP) {
      setAttesaPassaggio({ direzione: 'A→B', pendingB: nuovoB })
      return
    }
    scheduleFeedbackTimer(() => setAttesaAvversario(nuovoB), Math.min(delayMs, 250))
  }

  const passaTurnoBaA = (updatedA = latestPokemon.current.A, updatedB = latestPokemon.current.B) => {
    if (nextSide('B', updatedA, updatedB) === 'B' && updatedB) { setTurnoA(false); if (isPvP) setAttesaPassaggio({ direzione: 'A→B', pendingB: updatedB }); else setAttesaAvversario(updatedB); return }
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

    passaTurnoBaA()
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
      setEvoluzioniInAttesa((prev) =>
        prev.some((evoluzione) => evoluzione.istanzaId === attivo.istanzaId)
          ? prev
          : [
              ...prev,
              {
                istanzaId: attivo.istanzaId,
                oldSpecieId: attivo.specieId,
                newSpecieId: xpRes.evoluzionePendente!.nuovaSpecieId,
              },
            ]
      )
    }
    mostraMessaggi(messaggi)
    return xpRes.istanza
  }

  const preparaTurnoGiocatore = (
    onReady: (pokemon: PokemonIstanza, messages: string[]) => void,
    resolvedStatus?: ReturnType<typeof risolviStatoInizioTurno>
  ) => {
    if (coinOpen || statusPending.current) return
    if (terminata || !turnoA || azioneInCorso || actionInProgressRef.current || scambioRichiesto || attesaPassaggio || attesaAvversario) return
    resetInfoBox()

    const statoRes = resolvedStatus ?? risolviStatoInizioTurno(pkmnA, hpMaxA)
    if (!resolvedStatus && statoRes.tiroStato !== undefined) { presentStatus(statoRes, pkmnA, () => preparaTurnoGiocatore(onReady, statoRes)); return }
    const pkmnAEffettivo = statoRes.istanza
    setPkmnA(pkmnAEffettivo)
    setSquadraA((sq) => updateInSquadra(sq, pkmnAEffettivo))

    if (pkmnAEffettivo.hp <= 0) {
      const finishKO = () => {
        actionInProgressRef.current = false
        setAzioneInCorso(false)
        mostraMessaggi([...statoRes.messaggi, `${pkmnAEffettivo.nome} è caduto!`])
        playSound('ko')
        const nextA = squadraA.find(
          (p) => p.istanzaId !== pkmnAEffettivo.istanzaId && p.hp > 0
        )
        if (nextA) {
          apriScambio({
            motivo: `${pkmnAEffettivo.nome} non può continuare.`,
            prossimoPasso: 'passaAB',
            pendingB: pkmnB,
          })
          return
        }
        mostraMessaggi(['Hai perso la battaglia...'])
        setEsito('sconfitta')
        setTerminata(true)
      }
      if (getArkamonAnimationDurationMs(pkmnAEffettivo.specieId, 'back', 'ko') > 0) {
        actionInProgressRef.current = true
        setAzioneInCorso(true)
        spriteCompletionWaitersRef.current.A = { animation: 'ko', replayKey: 0, onComplete: finishKO }
      } else {
        finishKO()
      }
      return
    }

    if (!statoRes.puoAgire) {
      mostraMessaggi(statoRes.messaggi)
      passaTurnoAaB(pkmnB, 1200)
      return
    }

    onReady(pkmnAEffettivo, statoRes.messaggi)
  }

  const eseguiMossa = (numeroMossa: 0 | 1 | 2, suprema = false) => preparaTurnoGiocatore((pkmnAEffettivo, statusMessages) => {

    const mossaScelta = specieA.mosse[numeroMossa]
      ? getMossa(specieA.mosse[numeroMossa]!)
      : null
    if (mossaScelta && èMossaCura(mossaScelta)) {
      if (suprema) return
      const cura = applicaMossaCura(pkmnAEffettivo, mossaScelta, hpMaxA)
      eseguiSequenzaCura(mossaScelta, 'A', () => {
        setPkmnA(cura.istanza)
        setSquadraA((sq) => updateInSquadra(sq, cura.istanza))
        mostraMessaggi([...statusMessages, ...cura.messaggi])
        passaTurnoAaB(pkmnB, 1200)
      })
      return
    }

    const ris = suprema
      ? calcolaAzioneSuprema(pkmnAEffettivo, pkmnB, numeroMossa)
      : calcolaDanno(pkmnAEffettivo, pkmnB, numeroMossa, Math.random, false)
    if (!ris) return

    let nuovoB = { ...pkmnB, hp: Math.max(0, pkmnB.hp - ris.dannoFinale) }
    if (ris.statoApplicato && nuovoB.hp > 0) {
      nuovoB = applicaStato(nuovoB, ris.statoApplicato)
    }
    const nuovaSquadraB = updateInSquadra(squadraB, nuovoB)
    eseguiSequenzaOffensiva(
      ris,
      'A',
      'B',
      nuovoB.hp > 0,
      () => {
        setPkmnB(nuovoB)
        setSquadraB(nuovaSquadraB)
      },
      () => {
      mostraMessaggi([...statusMessages, ...ris.messaggi])

      let aDopoAutodanno = pkmnAEffettivo
      if (ris.autodanno && ris.autodanno > 0) {
        aDopoAutodanno = {
          ...pkmnAEffettivo,
          hp: Math.max(0, pkmnAEffettivo.hp - ris.autodanno),
        }
        setPkmnA(aDopoAutodanno)
        setSquadraA((sq) => updateInSquadra(sq, aDopoAutodanno))
      }

      if (esitoSquadre(updateInSquadra(squadraA, aDopoAutodanno), nuovaSquadraB) === 'sconfitta') {
        mostraMessaggi(['Hai perso la battaglia...'])
        playSound('ko')
        setEsito('sconfitta')
        setTerminata(true)
        return
      }

      if (nuovoB.hp <= 0) {
        playSound('ko')
        const aggiornatoA = premiaConXP(aDopoAutodanno, nuovoB)
        setPkmnA(aggiornatoA)
        setSquadraA((sq) => updateInSquadra(sq, aggiornatoA))

        const nextB = nuovaSquadraB.find(
          (p) => p.istanzaId !== nuovoB.istanzaId && p.hp > 0
        )
        if (nextB && !isSelvatico) {
          mostraMessaggi([`L'avversario manda in campo ${nextB.nome}!`])
          setPkmnB(nextB)
          if (aggiornatoA.hp <= 0) {
            const nextA = squadraA.find(
              (p) => p.istanzaId !== aggiornatoA.istanzaId && p.hp > 0
            )
            if (nextA) {
              mostraMessaggi([`${aggiornatoA.nome} è esausto!`])
              apriScambio({
                motivo: `${aggiornatoA.nome} non può continuare.`,
                prossimoPasso: 'passaAB',
                pendingB: nextB,
              })
              return
            }
            mostraMessaggi(['Hai perso la battaglia...'])
            setEsito('sconfitta')
            setTerminata(true)
            return
          }
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
          mostraMessaggi([`${aDopoAutodanno.nome} è esausto!`])
          apriScambio({
            motivo: `${aDopoAutodanno.nome} non può continuare.`,
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
  })

  // Porting di: EseguiAzioneCattura da old_files/Mod_Battle_Engine.txt
  const salvaCatturaConclusa = (masterball = false) => {
    const currentA = latestPokemon.current.A ?? pkmnA
    const checkpoint = settledBattleCheckpoint({
      initialPriority: initialCheckpoint?.initialPriority ?? 'A',
      actedThisRound: actedThisRound.current,
      turnA: true,
      pvp: false,
      chooseRivalMove: false,
      outcome: 'vittoria',
      openingComplete: true,
      evolutions: evoluzioniInAttesa,
      rivalMessages: [],
    })
    return concludiCattura(giocatoreAttivo, pkmnB, {
      pokemonA: currentA,
      pokemonB: pkmnB,
      squadraA: updateInSquadra(squadraA, currentA),
      squadraB,
      hpMaxA: calcolaHPMax(currentA),
      hpMaxB,
      turnoCorrente: 'A',
      checkpoint,
    }, masterball)
  }

  const eseguiCattura = () => {
    if (!haSpazioPokemon(giocatore)) {
      mostraMessaggi(['Squadra e deposito sono pieni: libera uno slot prima di catturare.'])
      return
    }
    preparaTurnoGiocatore((_pokemon, statusMessages) => {
      const ris = tentaCattura(pkmnB)
      mostraMessaggi([...statusMessages, 'Lanci una pokeball...'])
      if (ris.riuscita) {
        if (!salvaCatturaConclusa()) return
        mostraMessaggi([`${pkmnB.nome} è stato catturato!`])
        playSound('capture')
        setEsito('vittoria')
        setTerminata(true)
        return
      }
      mostraMessaggi([`${pkmnB.nome} è scappato dalla pokeball!`])
      passaTurnoAaB(pkmnB, 0)
    })
  }

  const eseguiMasterball = () => {
    if (!haSpazioPokemon(giocatore)) {
      mostraMessaggi(['Squadra e deposito sono pieni: libera uno slot prima di catturare.'])
      return
    }
    if (masterballRimaste <= 0) return
    preparaTurnoGiocatore((_pokemon, statusMessages) => {
      if (!salvaCatturaConclusa(true)) return
      mostraMessaggi([
        ...statusMessages,
        'Lanci una Masterball...',
        `${pkmnB.nome} è stato catturato!`,
      ])
      playSound('capture')
      setEsito('vittoria')
      setTerminata(true)
    })
  }

  const turnoAvversario = (statoBcorrente: PokemonIstanza, resolvedStatus?: ReturnType<typeof risolviStatoInizioTurno>) => {
    if (coinOpen || statusPending.current) return
    if (terminata || actionInProgressRef.current || azioneInCorso || scambioRichiesto) return
    resetInfoBox()
    const hpMaxBcorrente = calcolaHPMax(statoBcorrente)
    const statoRes = resolvedStatus ?? risolviStatoInizioTurno(statoBcorrente, hpMaxBcorrente)
    if (!resolvedStatus && statoRes.tiroStato !== undefined) { presentStatus(statoRes, statoBcorrente, () => turnoAvversario(statoBcorrente, statoRes)); return }
    const bEffettivo = statoRes.istanza
    setPkmnB(bEffettivo)
    setSquadraB((sq) => updateInSquadra(sq, bEffettivo))

    if (bEffettivo.hp <= 0) {
      const finishKO = () => {
        actionInProgressRef.current = false
        setAzioneInCorso(false)
        mostraMessaggi(statoRes.messaggi)
        mostraMessaggi([`${bEffettivo.nome} è caduto!`])
        playSound('ko')
        const aggiornatoA = premiaConXP(pkmnA, bEffettivo)
        setPkmnA(aggiornatoA)
        setSquadraA((sq) => updateInSquadra(sq, aggiornatoA))
        const nextB = squadraB.find(
          (p) => p.istanzaId !== bEffettivo.istanzaId && p.hp > 0
        )
        if (nextB && !isSelvatico) {
          mostraMessaggi([`L'avversario manda in campo ${nextB.nome}!`])
          setPkmnB(nextB)
          passaTurnoBaA(aggiornatoA, nextB)
          return
        }
        mostraMessaggi(['Hai vinto la battaglia!'])
        playSound('victory')
        setEsito('vittoria')
        setTerminata(true)
      }
      if (getArkamonAnimationDurationMs(bEffettivo.specieId, 'front', 'ko') > 0) {
        actionInProgressRef.current = true
        setAzioneInCorso(true)
        spriteCompletionWaitersRef.current.B = { animation: 'ko', replayKey: 0, onComplete: finishKO }
      } else {
        finishKO()
      }
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
    messaggiIniziali: string[] = [],
    suprema?: boolean
  ) => {
    const specieB = getPokemon(bEffettivo.specieId)
    const mossaIdB = specieB?.mosse[mossaIdx] ?? null
    const mossaDefB = mossaIdB ? getMossa(mossaIdB) : null

    if (mossaDefB && èMossaCura(mossaDefB)) {
      if (suprema) return
      const cura = applicaMossaCura(bEffettivo, mossaDefB, hpMaxBcorrente)
      eseguiSequenzaCura(mossaDefB, 'B', () => {
        setPkmnB(cura.istanza)
        setSquadraB((sq) => updateInSquadra(sq, cura.istanza))
        mostraMessaggi([...messaggiIniziali, ...cura.messaggi])
        passaTurnoBaA()
      })
      return
    }

    const ris = suprema
      ? calcolaAzioneSuprema(bEffettivo, pkmnA, mossaIdx)
      : calcolaDanno(bEffettivo, pkmnA, mossaIdx, Math.random, suprema)
    if (!ris) {
      passaTurnoBaA()
      return
    }
    let nuovoA = { ...pkmnA, hp: Math.max(0, pkmnA.hp - ris.dannoFinale) }
    if (ris.statoApplicato && nuovoA.hp > 0) {
      nuovoA = applicaStato(nuovoA, ris.statoApplicato)
    }
    const nuovaSquadraA = updateInSquadra(squadraA, nuovoA)
    eseguiSequenzaOffensiva(
      ris,
      'B',
      'A',
      nuovoA.hp > 0,
      () => {
        setPkmnA(nuovoA)
        setSquadraA(nuovaSquadraA)
      },
      () => {
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
      const nuovaSquadraB = updateInSquadra(squadraB, bDopoAutodanno)

      if (nuovoA.hp <= 0) {
        const nextA = nuovaSquadraA.find(
          (p) => p.istanzaId !== nuovoA.istanzaId && p.hp > 0
        )
        if (nextA) {
          mostraMessaggi([`${nuovoA.nome} è KO!`])
          if (bDopoAutodanno.hp <= 0) {
            const aggiornatoA = premiaConXP(nuovoA, bDopoAutodanno)
            setPkmnA(aggiornatoA)
            setSquadraA((sq) => updateInSquadra(sq, aggiornatoA))
            const nextB = nuovaSquadraB.find(
              (p) => p.istanzaId !== bDopoAutodanno.istanzaId && p.hp > 0
            )
            if (!nextB || isSelvatico) {
              mostraMessaggi(['Hai vinto la battaglia!'])
              playSound('victory')
              setEsito('vittoria')
              setTerminata(true)
              return
            }
            mostraMessaggi([
              `${bDopoAutodanno.nome} è esausto! L'avversario manda in campo ${nextB.nome}!`,
            ])
            setPkmnB(nextB)
          }
          apriScambio({
            motivo: `${nuovoA.nome} è KO.`,
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
        const aggiornatoA = premiaConXP(nuovoA, bDopoAutodanno)
        setPkmnA(aggiornatoA)
        setSquadraA((sq) => updateInSquadra(sq, aggiornatoA))
        const nextB = nuovaSquadraB.find(
          (p) => p.istanzaId !== bDopoAutodanno.istanzaId && p.hp > 0
        )
        if (nextB && !isSelvatico) {
          mostraMessaggi([`${bDopoAutodanno.nome} è esausto! L'avversario manda in campo ${nextB.nome}!`])
          setPkmnB(nextB)
          passaTurnoBaA(aggiornatoA, nextB)
          return
        }
        mostraMessaggi(['Hai vinto la battaglia!'])
        playSound('victory')
        setEsito('vittoria')
        setTerminata(true)
        return
      }

      passaTurnoBaA(nuovoA, bDopoAutodanno)
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

  const activeAnimationA: ArkamonBattleAnimation | undefined =
    spriteActions.A
      ? spriteActions.A.animation
      : terminata && esito === 'vittoria'
      ? 'victory'
      : undefined
  const activeAnimationB: ArkamonBattleAnimation | undefined =
    spriteActions.B
      ? spriteActions.B.animation
      : terminata && esito === 'sconfitta'
      ? 'victory'
      : undefined

  return (
    <motion.div
      data-battle-layout-root
      className="w-full h-full relative bg-cover bg-center"
      style={{ backgroundImage: `url(${bgBattaglia})` }}
      animate={
        cameraShake
          ? {
              x: [0, -cameraShake.px, cameraShake.px, -cameraShake.px * 0.6, cameraShake.px * 0.4, 0],
              y: [0, cameraShake.px * 0.25, -cameraShake.px * 0.2, cameraShake.px * 0.15, 0],
            }
          : { x: 0, y: 0 }
      }
      transition={{
        duration: cameraShake ? cameraShake.ms / 1000 : 0.08,
        ease: 'easeOut',
      }}
    >
      {coinOpen && battaglia ? <BattleOpeningOverlay kind="coin" value={battaglia.turnoCorrente === 'A' ? 0 : 1} title="Stesso livello: decide la moneta" result={`${battaglia.turnoCorrente === 'A' ? 'Testa' : 'Croce'} · Inizia ${battaglia.turnoCorrente === 'A' ? pkmnA.nome : pkmnB.nome}`} onContinue={() => setCoinOpen(false)} /> : null}
      {statusRoll ? <BattleOpeningOverlay key={statusRoll.id} kind="die" value={statusRoll.value} title={statusRoll.title} result={`Risultato: ${statusRoll.value}`} onContinue={statusRoll.done} /> : null}
      {supremaSide && !terminata && !azioneInCorso && !coinOpen && !statusRoll && (
        <SupremeMoveDialog
          moves={supremaSide === 'A' ? mosseA : mosseB}
          level={supremaSide === 'A' ? pkmnA.livello : pkmnB.livello}
          recoil={costoSuprema(supremaSide === 'A' ? hpMaxA : hpMaxB)}
          pokemonName={supremaSide === 'A' ? pkmnA.nome : pkmnB.nome}
          onClose={() => setSupremaSide(null)}
          onChoose={(idx) => {
            const side = supremaSide
            setSupremaSide(null)
            if (side === 'A') eseguiMossa(idx, true)
            else eseguiMossaPvP_B(idx, true)
          }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/10 via-transparent to-slate-950/60 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-t from-slate-950/80 to-transparent pointer-events-none" />

      <AnimatePresence>
        {moveVfx && <MoveVfx key={moveVfx.id} effect={moveVfx} soundEnabled
          onStart={() => notifyMoveVfx(moveVfx.id, 'onStart')}
          onImpact={() => notifyMoveVfx(moveVfx.id, 'onImpact')}
          onComplete={() => notifyMoveVfx(moveVfx.id, 'onComplete')}
        />}
      </AnimatePresence>

      <AnimatePresence>
        {impactPulse && (
          <ImpactPulseOverlay key={impactPulse.id} pulse={impactPulse} layout={battleLayout} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {diceRoll && (
          <DiceRollOverlay key={diceRoll.id} roll={diceRoll} onVisible={() => revealLancioDadi(diceRoll.id)} />
        )}
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
            shakePx={shakeStrengthPx}
            shakeDurationMs={shakeDurationMs}
            flashing={impactFlash === 'B'}
            lunging={shaking === 'A'}
            activeAnimation={activeAnimationB}
            replayKey={spriteActions.B?.replayKey ?? 0}
            holdReactionUntilImpact={heldHitReactions.B ?? false}
            onAnimationStart={(animation, replayKey) => startSpriteAction('B', animation, replayKey)}
            onAnimationCue={(animation, replayKey) => releaseSpriteAction('B', animation, replayKey)}
            onAnimationComplete={(animation, replayKey) => completeSpriteAction('B', animation, replayKey)}
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
            shakePx={shakeStrengthPx}
            shakeDurationMs={shakeDurationMs}
            flashing={impactFlash === 'A'}
            lunging={shaking === 'B'}
            activeAnimation={activeAnimationA}
            replayKey={spriteActions.A?.replayKey ?? 0}
            holdReactionUntilImpact={heldHitReactions.A ?? false}
            onAnimationStart={(animation, replayKey) => startSpriteAction('A', animation, replayKey)}
            onAnimationCue={(animation, replayKey) => releaseSpriteAction('A', animation, replayKey)}
            onAnimationComplete={(animation, replayKey) => completeSpriteAction('A', animation, replayKey)}
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
          hp={pendingHealth?.side === 'B' && pendingHealth.instanceId === pkmnB.istanzaId ? pendingHealth.hp : pkmnB.hp}
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
          hp={pendingHealth?.side === 'A' && pendingHealth.instanceId === pkmnA.istanzaId ? pendingHealth.hp : pkmnA.hp}
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
          <div className="h-full w-full p-2">
            <div
              className="grid h-[100%] gap-1"
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

      {!terminata && !mostraMoseB && !attesaPassaggio && !attesaAvversario && !scambioRichiesto && (
        <BattleLayoutItem
          layoutKey="playerSupreme"
          label="Suprema giocatore"
          rect={battleLayout.playerSupreme}
          editing={layoutEditing}
          onChange={updateBattleLayout}
        >
          <div className="h-full w-full p-0 sm:p-2">
            <SupremeButton
              disabled={!turnoA || azioneInCorso || coinOpen || !!statusRoll || !mosseA.some(({ mossa }) => !èMossaCura(mossa))}
              recoil={costoSuprema(hpMaxA)}
              onClick={() => setSupremaSide('A')}
            />
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
          <div className="h-full w-full p-2">
            <div
              className="grid h-full gap-2"
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

      {isPvP && mostraMoseB && !terminata && !scambioRichiesto && (
        <BattleLayoutItem
          layoutKey="enemySupreme"
          label="Suprema rivale"
          rect={battleLayout.enemySupreme}
          editing={layoutEditing}
          onChange={updateBattleLayout}
        >
          <div className="h-full w-full p-0 sm:p-2">
            <SupremeButton
              disabled={azioneInCorso || coinOpen || !!statusRoll || !mosseB.some(({ mossa }) => !èMossaCura(mossa))}
              recoil={costoSuprema(hpMaxB)}
              onClick={() => setSupremaSide('B')}
            />
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
    </motion.div>
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

type ImpactPulseDisplay = {
  id: number
  side: 'A' | 'B'
  color: string
  strength: number
}

function ImpactPulseOverlay({
  pulse,
  layout,
}: {
  pulse: ImpactPulseDisplay
  layout: AdminBattleLayout
}) {
  const point = getBattleSideCenter(layout, pulse.side)

  const position = {
    left: `${point.x}%`,
    top: `${point.y}%`,
  }

  return (
    <div
      className="pointer-events-none absolute z-[64] -translate-x-1/2 -translate-y-1/2"
      style={position}
      aria-hidden="true"
    >
      <motion.div
        initial={{ opacity: 0.95, scale: 0.25 }}
        animate={{
          opacity: [0.95, 0.72, 0],
          scale: [
            0.25,
            pulse.strength,
            pulse.strength * 1.9,
          ],
        }}
        exit={{ opacity: 0 }}
        transition={{
          duration: 0.5,
          ease: 'easeOut',
        }}
        className="h-28 w-28 rounded-full border-[3px]"
        style={{
          borderColor: pulse.color,
          background: `radial-gradient(circle, ${pulse.color}55 0%, ${pulse.color}22 42%, transparent 70%)`,
          boxShadow: `0 0 18px ${pulse.color}, 0 0 42px ${pulse.color}88, inset 0 0 20px ${pulse.color}66`,
          mixBlendMode: 'screen',
        }}
      />
    </div>
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
      className="arka-battle-font relative h-full w-full text-slate-950 drop-shadow-2xl"
      style={{
        backgroundImage: `url(${frameSrc})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div
        className={`absolute left-[8%] top-[16%] space-y-0.5 text-3xl leading-none text-white [text-shadow:-1px_-1px_0_#111,1px_-1px_0_#111,-1px_1px_0_#111,1px_1px_0_#111,0_3px_3px_rgba(0,0,0,0.55)] ${
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
          className="absolute bottom-[13%] right-[10%] rounded-md bg-blue-400 px-4 py-2 text-m text-white text-slate-950 shadow-lg hover:bg-blue-300 active:scale-95 [text-shadow:-1px_-1px_0_#111,1px_-1px_0_#111,-1px_1px_0_#111,1px_1px_0_#111,0_3px_3px_rgba(0,0,0,0.55)]"
          onClick={onOpponentTurn}
        >
          AVVERSARIO
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
  shakePx,
  shakeDurationMs,
  flashing,
  lunging,
  activeAnimation,
  replayKey,
  holdReactionUntilImpact,
  onAnimationStart,
  onAnimationCue,
  onAnimationComplete,
}: {
  istanza: PokemonIstanza
  position: 'top-right' | 'bottom-left'
  shaking: boolean
  shakePx: number
  shakeDurationMs: number
  flashing: boolean
  lunging: boolean
  activeAnimation?: ArkamonBattleAnimation
  replayKey: number
  holdReactionUntilImpact: boolean
  onAnimationStart: (animation: ArkamonBattleAnimation, replayKey: number) => void
  onAnimationCue: (animation: ArkamonBattleAnimation, replayKey: number, cue: ArkamonAnimationCue) => void
  onAnimationComplete: (animation: ArkamonBattleAnimation, replayKey: number) => void
}) {
  const isPlayer = position === 'bottom-left'
  const spriteScale = useAdminStore((state) => state.theme.spriteScales[String(istanza.specieId)] ?? 1)
  const side = isPlayer ? 'back' : 'front'
  const spriteIdentity = `${istanza.istanzaId}:${istanza.specieId}:${side}`
  const [failedIdentity, setFailedIdentity] = useState<string | null>(null)
  const spriteFailed = failedIdentity === spriteIdentity
  const isKO = istanza.hp <= 0
  const battleAnimation: ArkamonBattleAnimation = isKO
    ? 'ko'
    : activeAnimation ?? 'idle'
  const animationReplayKey = battleAnimation === 'ko' ? 0 : replayKey
  const usesDedicatedSprites = !!getArkamonAnimationAsset(istanza.specieId, side, 'idle')
  const hasDedicatedKO = !!getArkamonAnimationAsset(istanza.specieId, side, 'ko')

  const completionCallbackRef = useRef(onAnimationComplete)
  completionCallbackRef.current = onAnimationComplete
  const startCallbackRef = useRef(onAnimationStart)
  startCallbackRef.current = onAnimationStart
  const cueCallbackRef = useRef(onAnimationCue)
  cueCallbackRef.current = onAnimationCue
  const currentIdentityRef = useRef(spriteIdentity)
  currentIdentityRef.current = spriteIdentity
  const completedTokenRef = useRef<string | null>(null)
  const startedTokenRef = useRef<string | null>(null)
  const releasedTokenRef = useRef<string | null>(null)
  const deferredFailedHitRef = useRef<{ identity: string; replayKey: number } | null>(null)
  const notifyAnimationStart = useCallback((animation: ArkamonBattleAnimation, startedReplayKey: number) => {
    if (currentIdentityRef.current !== spriteIdentity) return
    const token = `${spriteIdentity}:${animation}:${startedReplayKey}`
    if (startedTokenRef.current === token) return
    startedTokenRef.current = token
    startCallbackRef.current(animation, startedReplayKey)
  }, [spriteIdentity])
  const notifyAnimationCue = useCallback((animation: ArkamonBattleAnimation, releasedReplayKey: number, cue: ArkamonAnimationCue) => {
    if (currentIdentityRef.current !== spriteIdentity) return
    const token = `${spriteIdentity}:${animation}:${releasedReplayKey}:${cue}`
    if (releasedTokenRef.current === token) return
    releasedTokenRef.current = token
    cueCallbackRef.current(animation, releasedReplayKey, cue)
  }, [spriteIdentity])
  const notifyAnimationComplete = useCallback((animation: ArkamonBattleAnimation, completedReplayKey: number) => {
    if (currentIdentityRef.current !== spriteIdentity) return
    const token = `${spriteIdentity}:${animation}:${completedReplayKey}`
    if (completedTokenRef.current === token) return
    completedTokenRef.current = token
    completionCallbackRef.current(animation, completedReplayKey)
  }, [spriteIdentity])

  useEffect(() => {
    const failedHit = deferredFailedHitRef.current
    if (failedHit && failedHit.identity !== spriteIdentity) deferredFailedHitRef.current = null
    else if (failedHit && !holdReactionUntilImpact) {
      deferredFailedHitRef.current = null
      notifyAnimationComplete('hit', failedHit.replayKey)
    }
    if (battleAnimation === 'idle') {
      completedTokenRef.current = null
      startedTokenRef.current = null
      releasedTokenRef.current = null
      return
    }
    // A missing PNG leaves the emoji visible, but future actions must still release their waiter.
    if (spriteFailed) {
      notifyAnimationStart(battleAnimation, animationReplayKey)
      if (battleAnimation === 'attack') notifyAnimationCue(battleAnimation, animationReplayKey, 'release')
      if (battleAnimation === 'hit' && holdReactionUntilImpact) {
        deferredFailedHitRef.current = { identity: spriteIdentity, replayKey: animationReplayKey }
      } else notifyAnimationComplete(battleAnimation, animationReplayKey)
    }
  }, [spriteFailed, spriteIdentity, holdReactionUntilImpact, battleAnimation, animationReplayKey, notifyAnimationStart, notifyAnimationCue, notifyAnimationComplete])

  const horizontalMotion = usesDedicatedSprites
    ? 0
    : shaking
    ? [0, -shakePx, shakePx, -shakePx, shakePx, 0]
    : lunging
    ? isPlayer
      ? [0, 30, 0]
      : [0, -30, 0]
    : 0
  const innerDuration = shaking
    ? shakeDurationMs / 1000
    : lunging
    ? 0.4
    : flashing
    ? 0.16
    : 0.2

  return (
    <motion.div
      className="relative z-10 h-full w-full"
      initial={{ x: isPlayer ? -400 : 400, opacity: 0 }}
      animate={{
        x: 0,
        opacity: isKO && !hasDedicatedKO ? 0.45 : 1,
        filter: isKO && !hasDedicatedKO ? 'grayscale(100%)' : 'grayscale(0%)',
      }}
      exit={{ y: 180, opacity: 0, rotate: isPlayer ? -15 : 15, filter: 'grayscale(100%)' }}
      transition={{ type: 'spring', stiffness: 110, damping: 16 }}
    >
      <motion.div
        animate={{
          x: horizontalMotion,
          filter: flashing && !usesDedicatedSprites
            ? ['brightness(1)', 'brightness(2.5) saturate(0.35)', 'brightness(1)']
            : 'brightness(1)',
        }}
        transition={{ duration: innerDuration, ease: 'easeOut' }}
        className="flex h-full w-full items-center justify-center drop-shadow-2xl"
      >
        {!spriteFailed ? (
          <ArkamonBattleSprite
            speciesId={istanza.specieId}
            name={istanza.nome}
            side={side}
            animation={battleAnimation}
            replayKey={animationReplayKey}
            holdReactionUntilImpact={holdReactionUntilImpact}
            onAnimationStart={notifyAnimationStart}
            onAnimationCue={notifyAnimationCue}
            onAnimationComplete={notifyAnimationComplete}
            scale={spriteScale}
            className="w-full h-full object-contain"
            onError={() => setFailedIdentity(spriteIdentity)}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center rounded-full border-4 border-white bg-arka-surface text-5xl">
            {isPlayer ? '🐺' : '🦈'}
          </span>
        )}
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
  const hpColors = useAdminStore((state) => state.theme.colors)
  const pct = Math.max(0, Math.min(100, (hp / hpMax) * 100))
  const colore = pct > 60 ? hpColors.hpHigh : pct > 25 ? hpColors.hpMid : hpColors.hpLow
  const badge = stato ? STATO_BADGE[stato] : null
  const frameSrc = assetUrl(`/ui/hp_bar_${side}.png`)
  const barSrc = assetUrl('/ui/hp_bar.png')
  const barClipId = `hp-bar-inner-${side}`
  const fillWidth = pct === 0 ? 0 : 23 + pct * 5

  return (
    <div
      className={`arka-battle-font relative z-20 h-full w-full text-white arka-letter-outline ${className}`}
      data-battle-hp-side={side}
      data-battle-hp={hp}
      style={{
        backgroundImage: `url(${frameSrc})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
      }}
    >
          {badge && (
            <span
              className={`absolute right-0 top-full mt-1 z-30 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${badge.color} text-white`}
              title={stato} aria-label={`Stato: ${stato}`}
            >
              {badge.emoji} {badge.label}
            </span>
          )}
      <div className="absolute left-[13.5%] right-[6.5%] top-[15%] flex items-center justify-between gap-3">
        <span
          data-admin-layout-text-key="pokemon-name"
          className="arka-layout-content min-w-0 truncate text-[clamp(13px,1.25vw,18px)] leading-none text-white [text-shadow:-1px_-1px_0_#111,1px_-1px_0_#111,-1px_1px_0_#111,1px_1px_0_#111,0_3px_3px_rgba(0,0,0,0.55)]"
        >
          {nome}

        </span>
        <span
          data-admin-layout-text-key="pokemon-level"
          className="arka-layout-content shrink-0 text-[clamp(11px,1vw,15px)] text-white [text-shadow:-1px_-1px_0_#111,1px_-1px_0_#111,-1px_1px_0_#111,1px_1px_0_#111,0_3px_3px_rgba(0,0,0,0.55)]"
        >
          LV. {livello}
        </span>
      </div>
      <div className="absolute left-[10.25%] top-[66.5%] h-[33.5%] w-[59.7%]">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 507 40"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <clipPath id={barClipId}>
              <path d="M 16 3 H 503 V 20 C 503 29 499 35 493 36 H 3 V 20 C 3 12 8 5 16 3 Z" />
            </clipPath>
          </defs>
          <motion.rect
            x="-20"
            y="3"
            height="33"
            clipPath={`url(#${barClipId})`}
            initial={false}
            animate={{ width: fillWidth, rx: pct === 100 ? 0 : 16.5, fill: colore }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </svg>
        <img
          src={barSrc}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full mix-blend-multiply"
        />
      </div>
      {side === 'player' && (
        <div
          data-admin-layout-text-key="pokemon-hp"
          className="arka-layout-content absolute left-[10.25%] top-[66.5%] flex h-[33.5%] w-[59.7%] items-center justify-center text-center text-[clamp(10px,0.9vw,13px)] text-white [text-shadow:-1px_-1px_0_#111,1px_-1px_0_#111,-1px_1px_0_#111,1px_1px_0_#111,0_3px_3px_rgba(0,0,0,0.55)]"
        >
          {hp}/{hpMax}
        </div>
      )}
    </div>
  )
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

function SupremeButton({ disabled, recoil, onClick }: {
  disabled: boolean
  recoil: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label="Mossa Suprema"
      title={`Scegli un attacco: danno doppio, contraccolpo ${recoil} HP (50% degli HP massimi)`}
      disabled={disabled}
      onClick={onClick}
      className="flex h-full w-full min-h-0 min-w-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-lg border-2 border-amber-200 bg-gradient-to-b from-amber-400 to-orange-600 px-0 text-center font-black text-slate-950 shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:px-1"
    >
      <span className="max-w-full truncate text-[clamp(9px,1.4vw,20px)] leading-tight tracking-tight"><span className="hidden sm:inline">Mossa<br /></span>Suprema</span>
      <span className="hidden text-[clamp(9px,1vw,14px)] leading-tight sm:block">×2 · −{recoil} HP</span>
    </button>
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
  const { dadi, incremento } = getMossaAlLivello(mossa, livello)
  const frameSrc = assetUrl('/ui/move_button.png')
  const typeSrc = assetUrl(`/ui/${mossa.tipo.toLocaleLowerCase('it-IT')}.png`)

  return (
    <motion.button
      whileHover={!disabled ? { y: -2, scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      disabled={disabled}
      onClick={onClick}
      className="arka-battle-font relative h-full min-h-0 overflow-hidden px-[8%] py-[7%] text-slate-950 drop-shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-45"
      style={{
        backgroundImage: `url(${frameSrc})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div
        data-admin-layout-text-key={`${textKeyPrefix}-name`}
        className="arka-layout-content truncate px-[4%] text-center text-[clamp(16px,1.65vw,28px)] leading-none text-white [text-shadow:-1px_-1px_0_#111,1px_-1px_0_#111,-1px_1px_0_#111,1px_1px_0_#111,0_3px_3px_rgba(0,0,0,0.55)]"
      >
        {mossa.nome}
      </div>
      <div className="absolute bottom-[14%] left-[8%] flex w-[48%] items-center justify-start">
        <span
          data-admin-layout-text-key={`${textKeyPrefix}-dice`}
          className="arka-layout-content flex items-center gap-[0.14em] whitespace-nowrap text-[clamp(15px,1.65vw,26px)] leading-none text-white [text-shadow:-1px_-1px_0_#111,1px_-1px_0_#111,-1px_1px_0_#111,1px_1px_0_#111,0_3px_3px_rgba(0,0,0,0.55)]"
        >
          <span>{dadi}</span>
          <span className="text-[0.78em]" aria-label="dadi D6">🎲</span>
          {incremento !== 0 && <span>{incremento > 0 ? `+${incremento}` : incremento}</span>}
        </span>
      </div>
      <div className="absolute bottom-[14%] right-[9%] flex h-[22%] w-[15%] items-center justify-center">
        <img
          data-admin-layout-text-key={`${textKeyPrefix}-type`}
          src={typeSrc}
          alt={mossa.tipo}
          title={mossa.tipo}
          className="arka-layout-content max-h-full max-w-full object-contain drop-shadow-md"
        />
      </div>
    </motion.button>
  )
}
