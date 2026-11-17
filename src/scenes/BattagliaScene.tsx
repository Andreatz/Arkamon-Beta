import { AmbientParticles } from '@/motion/ambient/AmbientParticles'
import { DepthBackground } from '@/motion/depth/DepthBackground'
import { useBattleAssetReadiness } from '@/components/battle/useBattleAssetReadiness'
import { ChallengeBanner } from '@/challenges/ChallengeBanner'
import { useSettledBattleCheckpoint } from '@/components/battle/useSettledBattleCheckpoint'
import { BattleLayoutItem, ImpactPulseOverlay, InfoBox, ScambioModal, SquadIndicator, PokemonBattleSlot, HpBar, ActionButton, SupremeButton, MoveButton, type ImpactPulseDisplay } from '@/components/battle/BattlePresentation'
import '@/components/ui/gameButton.css'
import { BattleLogPanel } from '@/components/battle/BattleLogPanel'
import { BattleResultCard } from '@/components/battle/BattleResultCard'
import { useBattleChronicle } from '@/components/battle/useBattleChronicle'
import { useBattleArchiveStore } from '@/components/battle/battleArchiveStore'
import { appendBattleEvents, logPokemon, revealedAttackEvents, settledAttackEvents, statusEvents, xpEvent } from '@/components/battle/battleChronicle'
import { resolveBattleAttack, updateBattleSquad } from '@/engine/battleResolution'
import { getAnimationDuration, useGameMotionPreferences } from '@/settings/gamePreferences'
import { nextBattleSide } from '@/components/battle/battleRoundOrder'
import { restoreBattleCheckpoint, settledBattleCheckpoint } from '@/components/battle/battleCheckpoint'
import { BattleOpeningOverlay } from '@/components/battle/BattleOpeningOverlay'
import { SupremeMoveDialog } from '@/components/battle/SupremeMoveDialog'
import { BattleAudienceOverlay } from '@/components/battle/BattleAudienceOverlay'
import { audienceChannelForBattle, createAudienceBattleId, makeAudienceRoundRequest, validAudienceWinner } from '@/components/battle/audienceBattle'
import { useAudienceStore } from '@/audience/useAudienceStore'
import { useAudienceTurn } from '@/audience/useAudienceTurn'
import { getMoveVfxAssignment } from '@/components/vfx/moveVfxAssignments'
import { useGameStore, creaIstanza, haSpazioPokemon } from '@store/gameStore'
import { useAdminStore } from '@store/adminStore'
import { useState, useEffect, useRef, useCallback, useContext, useMemo } from 'react'
import { UiPreviewViewContext } from '@/ui-studio/UiPreviewViewContext'
import { BattleLayoutProvider, useResolvedBattleLayout } from '@/ui-studio/battleLayout'
import { useRegiaStore } from '@/regia/regiaStore'
import { usePublicPresentation } from '@/regia/publicPresentation'
import { teamProgressionLimit } from '@/engine/teamLevelCap'
import { nextSeededRandom } from '@/challenges/seededRandom'
import { exitChallenge } from '@/challenges/challengeRuntime'
import { BattleItemDialog } from '@/shop/BattleItemDialog'
import { applyDamageBoost, boostBlockedReason } from '@/shop/battleBoost'
import { CAPTURE_ITEM_IDS, getShopItem, type CaptureItemId, type ShopItemId } from '@/shop/catalog'
import { resolveItemEffect } from '@/shop/itemEffects'
import { motion, AnimatePresence } from 'framer-motion'
import {
  calcolaDanno,
  calcolaAzioneSuprema,
  costoSuprema,
  calcolaHPMax,
  scegliMossaIA,
  tentaCatturaSacchettino,
  applicaXP,
  applicaXPDopoKO,
  risolviStatoInizioTurno,
  èMossaCura,
  èMossaSoloStato,
  èMossaDisponibile,
  applicaMossaCura,
} from '@engine/battleEngine'
import { getPokemon, getMossa, getAllenatore } from '@data/index'
import { calcolaVariazioneMonete, type TipoAvversario } from '@engine/battleEngine'
import type {
  PokemonIstanza,
  MossaDef,
  RisultatoMossa,
  TipoPokemon,
  BattleCheckpoint,
  Lato,
} from '@/types'
import { getBackground, BATTLE_BG_DEFAULT } from '@data/backgrounds'
import { assetUrl } from '@/utils/assetUrl'
import { playSound } from '@/utils/soundManager'
import {
  getArkamonAnimationAsset,
  getArkamonAnimationDurationMs,
  type ArkamonBattleAnimation,
} from '@/components/arkamon/arkamonAnimationManifest'
import { prepareArkamonAnimationPlayback } from '@/components/arkamon/preloadArkamonAnimations'
import {
  createBattleAnimationPlayback,
  createBattleDamageReveal,
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
  preloadVfxAssets,
  prepareMoveVfxPlayback,
} from '@/components/vfx/preloadVfxAssets'
import { DEFAULT_PRELOAD_VFX_ASSET_IDS } from '@/components/vfx/vfxManifest'
import { getBattleSideCenter } from '@/components/vfx/battleVfxPosition'
import { Stage, StageLayer } from '@/motion/Stage'
import { useCameraRig } from '@/motion/useCameraRig'
import { ScreenFxLayer, useScreenFx } from '@/motion/ScreenFx'
import { useBattleCinematics } from '@/components/battle/useBattleCinematics'
import { efficacyTone } from '@/components/battle/battleCinematics'
import { BattleDamageNumber, BattleMoveBanner } from '@/components/battle/BattleCinematicLayer'
import { BattleCaptureLayer, captureHidesTarget } from '@/components/battle/BattleCaptureLayer'
import { planD20Capture, planMasterCapture } from '@/components/battle/battleCapture'
import { SupremeCutIn } from '@/components/battle/SupremeCutIn'
import { DiceRollOverlay, type DiceRollDisplay } from '@/components/battle/DiceRollOverlay'
import {
  BATTLE_DICE_ASSET_IDS,
  BATTLE_DICE_ROLL_VISIBLE_MS,
} from '@/components/battle/battleDiceAssets'
import {
  getMoveVfxFeedback,
  getMoveVfxImpactDelayMs,
} from '@/components/vfx/resolveMoveVfxAsset'


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
 * HP, livello, status e cronaca vengono salvati insieme a ogni turno concluso.
 * Durante i filmati il checkpoint precedente resta valido e il KO resta nascosto fino ai dadi.
 */
export function BattagliaScene() {
  const previewView = useContext(UiPreviewViewContext)
  const battaglia = useGameStore((s) => s.battaglia)
  const challengeContext = useGameStore((s) => s.challengeContext)
  const isChallenge = !!challengeContext
  const randomState = useRef(battaglia?.seeded)
  const challengeActions = useRef(battaglia?.challengeActionCount ?? 0)
  const battleRng = useCallback(() => {
    if (!randomState.current) return Math.random()
    const sample = nextSeededRandom(randomState.current); randomState.current = sample.state; return sample.value
  }, [])
  const aggiornaBattaglia = useGameStore((s) => s.aggiornaBattaglia)
  const saveSettled = useCallback((patch: Partial<NonNullable<typeof battaglia>>) => {
    aggiornaBattaglia({ ...patch, ...(randomState.current ? { seeded: { ...randomState.current }, challengeActionCount: challengeActions.current } : {}) })
  }, [aggiornaBattaglia])
  const concludiCattura = useGameStore((s) => s.concludiCattura)
  const giocatoreAttivo = useGameStore((s) => s.giocatoreAttivo)
  const giocatore = useGameStore((s) =>
    s.giocatoreAttivo === 1 ? s.giocatore1 : s.giocatore2
  )
  const customBattleBackground = useAdminStore((s) => s.theme.assets.battleBackground)
  const layoutEditing = useAdminStore((s) => s.layoutEditing)
  const updateBattleLayout = useAdminStore((s) => s.updateBattleLayout)
  const inventarioAttivo = useGameStore((s) => (s.giocatoreAttivo === 1 ? s.giocatore1 : s.giocatore2).inventario)
  const [initialCheckpoint] = useState(() => battaglia ? restoreBattleCheckpoint(battaglia) : null)
  /** Con il Boost velocità i tuoi Arkamon aprono ogni round (la paralisi resta più forte). */
  const battlePriority = (): Lato => useGameStore.getState().battaglia?.boost?.velocita ? 'A' : initialCheckpoint?.initialPriority ?? 'A'
  const publicAudienceEnabled = useAudienceStore((s) => s.enabled)
  const guestAudienceEnabled = useAudienceStore((s) => s.guestEnabled)
  const guestProtocol = useAudienceStore((s) => s.snapshot?.guest?.protocol ?? s.session?.guestProtocol)
  const audienceEnabled = !isChallenge && (audienceChannelForBattle(battaglia) === 'boss'
    ? guestAudienceEnabled && guestProtocol === 'private-guest-v1' : publicAudienceEnabled)
  const audienceSession = useAudienceStore((s) => s.session)
  const audienceDuration = useAudienceStore((s) => s.durationSeconds)
  const audienceBattleId = useRef(initialCheckpoint?.audienceBattleId ?? createAudienceBattleId())
  const { chronicle, current: chronicleRef, beginAction, append: appendChronicle } = useBattleChronicle(battaglia?.cronaca, audienceBattleId.current)
  const { reducedMotion } = useGameMotionPreferences()
  const opponentTurnNumber = useRef(initialCheckpoint?.opponentTurnNumber ?? 0)
  type PendingAudience = NonNullable<BattleCheckpoint['audiencePending']> & { pokemon: PokemonIstanza; messages: string[] }
  const [audienceChoice, setAudienceChoice] = useState<PendingAudience | null>(null)
  const audienceVote = useAudienceTurn(audienceChoice?.request ?? null)
  const completedAudienceTurns = useRef(new Set<string>())
  const [esito, setEsito] = useState<'vittoria' | 'sconfitta' | null>(initialCheckpoint?.outcome ?? null)

  const [pkmnA, updatePkmnA] = useState<PokemonIstanza | null>(null)
  const [pkmnB, updatePkmnB] = useState<PokemonIstanza | null>(null)
  const [squadraA, setSquadraA] = useState<PokemonIstanza[]>([])
  const [squadraB, setSquadraB] = useState<PokemonIstanza[]>([])
  const [infoBoxMessaggi, setInfoBoxMessaggi] = useState<string[]>([])
  const [diceRoll, setDiceRoll] = useState<DiceRollDisplay | null>(null)
  const [publicDiceId, setPublicDiceId] = useState<number | null>(null)
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
  const [bagOpen, setBagOpen] = useState(false)
  const assetReadiness = useBattleAssetReadiness([pkmnA?.specieId ?? 1, pkmnB?.specieId ?? 13], [...squadraA, ...squadraB].map(pokemon => pokemon.specieId))
  const battleLayout = useResolvedBattleLayout(bagOpen ? 'bag' : diceRoll ? 'dice' : previewView)
  // Cinepresa del mondo di battaglia: l'HUD resta fuori e non viene mai mosso.
  const battleFocusPoints = useMemo(() => {
    const player = getBattleSideCenter(battleLayout, 'A')
    const enemy = getBattleSideCenter(battleLayout, 'B')
    return { player: { x: player.x / 100, y: player.y / 100 }, enemy: { x: enemy.x / 100, y: enemy.y / 100 } }
  }, [battleLayout])
  const battleRig = useCameraRig({ focusPoints: battleFocusPoints })
  const battleFx = useScreenFx()
  // La regia resta ferma nell'editor dei layout e nelle anteprime: lì il mondo non deve muoversi.
  const cine = useBattleCinematics({ rig: battleRig, fx: battleFx, enabled: !layoutEditing && !previewView })
  const [pendingCaptureSave, setPendingCaptureSave] = useState<{ itemId: CaptureItemId } | null>(null)
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
    // La paralisi modifica la priorità finché una cura non la rimuove.
    const initial = battlePriority()
    return nextBattleSide(actedThisRound.current, side, initial, a?.stato?.tipo, b?.stato?.tipo)
  }
  function presentStatus(result: ReturnType<typeof risolviStatoInizioTurno>, pokemon: PokemonIstanza, done: () => void) {
    statusPending.current = true
    let continued = false
    setStatusRoll({ id: ++statusRollIdRef.current, value: result.tiroStato!, title: `${pokemon.nome} · ${pokemon.stato?.tipo === 'Paralizzato' ? 'Paralisi: attacchi con 3–6' : 'Sonno: svegliati con 4–6'}`, done: () => {
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
  const [presentationPaused, setPresentationPaused] = useState(false)
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
  const paused = useRegiaStore(state => state.paused)
  // In un incontro selvatico non c'è alcun rivale: il turno è dell'Arkamon selvatico.
  const wildDisplayName = battaglia?.tipo === 'Selvatico' && pkmnB ? `${getPokemon(pkmnB.specieId)?.nome ?? 'Arkamon'} selvatico` : null
  const rivalDisplayName = battaglia?.leagueOpponent?.nome ?? getAllenatore(battaglia?.allenatoreId ?? 0)?.nome ?? wildDisplayName ?? 'Rivale'
  const controlStatus = paused ? 'Pausa di regia' : terminata ? 'Battaglia finita'
    : pendingCaptureSave ? 'Cattura in attesa di salvataggio'
    : audienceChoice ? audienceChoice.request.channel === 'boss' ? `Ospite · ${audienceChoice.request.trainer.name} · sceglie la mossa` : 'Pubblico NPC · votazione in corso'
    : diceRoll ? 'Lancio dei dadi...' : moveVfx ? 'Animazione mossa...'
    : azioneInCorso ? 'Azione in corso...'
    : attesaAvversario ? `Tocca a ${rivalDisplayName} · avvia il turno avversario`
    : attesaPassaggio ? `Passa il controllo a ${attesaPassaggio.direzione === 'A→B' ? rivalDisplayName : giocatore.nome}`
    : mostraMoseB ? `${rivalDisplayName} · scegli una mossa`
    : turnoA ? `Turno di ${giocatore.nome} · scegli una mossa` : `Turno di ${rivalDisplayName}...`
  useEffect(() => {
    const busy = coinOpen || !!statusRoll || azioneInCorso || !!moveVfx || !!diceRoll || !!pendingHealth || !!audienceChoice || !!scambioRichiesto
    useRegiaStore.getState().setBusy(busy, controlStatus, 'battle')
    return () => useRegiaStore.getState().setBusy(false, '', 'battle')
  }, [coinOpen, statusRoll, azioneInCorso, moveVfx, diceRoll, pendingHealth, audienceChoice, scambioRichiesto, controlStatus])
  useEffect(() => {
    const publicView = usePublicPresentation.getState()
    if (!pkmnA || !pkmnB || previewView) return
    const animation = (side: 'A' | 'B'): ArkamonBattleAnimation => spriteActions[side]?.animation
      ?? (terminata && esito === (side === 'A' ? 'vittoria' : 'sconfitta') ? 'victory' : 'idle')
    publicView.setBattle({
      pokemonA: pendingHealth?.side === 'A' && pendingHealth.instanceId === pkmnA.istanzaId ? { ...pkmnA, hp: pendingHealth.hp } : pkmnA,
      pokemonB: pendingHealth?.side === 'B' && pendingHealth.instanceId === pkmnB.istanzaId ? { ...pkmnB, hp: pendingHealth.hp } : pkmnB,
      hpMaxA: calcolaHPMax(pkmnA), hpMaxB: calcolaHPMax(pkmnB), background: customBattleBackground ? assetUrl(customBattleBackground) : getBackground(luogoRitornoRef.current) ?? BATTLE_BG_DEFAULT,
      layout: battleLayout, animationA: animation('A'), animationB: animation('B'), replayA: spriteActions.A?.replayKey ?? 0, replayB: spriteActions.B?.replayKey ?? 0,
      status: controlStatus, messages: infoBoxMessaggi, effect: moveVfx,
      dice: diceRoll && publicDiceId === diceRoll.id ? diceRoll : null,
    })
  }, [pkmnA, pkmnB, pendingHealth, customBattleBackground, battleLayout, spriteActions, controlStatus, infoBoxMessaggi, moveVfx, diceRoll, publicDiceId, terminata, esito, previewView])
  useEffect(() => () => { usePublicPresentation.getState().setBattle(null) }, [])

  // Esito: la camera va sul lato vincitore mentre entra la scheda del risultato.
  const playOutcomeShot = cine.outcome
  const resumeCinematics = cine.resume
  useEffect(() => {
    if (terminata && esito) playOutcomeShot(esito === 'vittoria' ? 'A' : 'B')
    else if (!terminata) resumeCinematics()
  }, [terminata, esito, playOutcomeShot, resumeCinematics])

  useEffect(() => {
    preloadVfxAssets([...DEFAULT_PRELOAD_VFX_ASSET_IDS, ...BATTLE_DICE_ASSET_IDS])
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
      } else if (initialCheckpoint?.phase === 'audience' && initialCheckpoint.audiencePending) {
        setTurnoA(false)
        setAudienceChoice({ ...initialCheckpoint.audiencePending, pokemon: battaglia.pokemonB, messages: initialCheckpoint.rivalMessages })
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

  // Native media and private damage stay outside persisted control points.
  useSettledBattleCheckpoint({
    available: Boolean(battaglia),
    busy: coinOpen || Boolean(statusRoll) || azioneInCorso || actionInProgressRef.current || Boolean(moveVfx) || Boolean(diceRoll) || Boolean(pendingHealth),
    pokemonA: pkmnA, pokemonB: pkmnB, squadA: squadraA, squadB: squadraB,
    messages: infoBoxMessaggi, chronicle, onSettled: saveSettled,
    control: {
      initialPriority: battlePriority(), actedThisRound: actedThisRound.current,
      turnA: turnoA, pvp: battaglia?.tipo === 'PVP', chooseRivalMove: mostraMoseB,
      passDirection: attesaPassaggio?.direzione,
      switchRequest: scambioRichiesto ? { motivo: scambioRichiesto.motivo, prossimoPasso: scambioRichiesto.prossimoPasso } : undefined,
      outcome: terminata ? esito : null, openingComplete: true, evolutions: evoluzioniInAttesa,
      rivalMessages: audienceChoice?.messages ?? messaggiTurnoBRef.current,
      audienceBattleId: audienceBattleId.current, opponentTurnNumber: opponentTurnNumber.current,
      audiencePending: audienceChoice ? { sessionId: audienceChoice.sessionId, request: audienceChoice.request } : undefined,
    },
  })

  useEffect(() => {
    if (!pkmnA || !pkmnB || coinOpen || initialCheckpoint?.openingComplete) return
    appendChronicle([{ id: `${chronicleRef.current.battleId}:opening`, kind: 'opening', title: 'Inizio della battaglia', messages: [`Inizia ${battaglia?.turnoCorrente === 'B' ? pkmnB.nome : pkmnA.nome}.`, ...(battaglia?.log ?? [])] }])
  }, [pkmnA, pkmnB, coinOpen, initialCheckpoint?.openingComplete, appendChronicle, battaglia?.turnoCorrente, battaglia?.log, chronicleRef])

  useEffect(() => {
    if (!terminata || !esito) return
    appendChronicle([{ id: `${chronicleRef.current.battleId}:outcome`, kind: 'outcome', winnerSide: esito === 'vittoria' ? 'A' : 'B', title: esito === 'vittoria' ? 'Vittoria del giocatore' : 'Vittoria dell’avversario', messages: ['Battaglia conclusa. Gli HP residui restano nella squadra.'] }])
    // A locally revealed ending is not an archive entry until its checkpoint
    // and complete chronicle are durable. Replays remain available before Prosegui.
    const durable = battaglia?.cronaca
    if (!isChallenge && battaglia?.checkpoint?.phase === 'ended' && battaglia.checkpoint.outcome === esito
      && durable?.events.some(event => event.kind === 'outcome'))
      useBattleArchiveStore.getState().archiveBattle({ chronicle: durable, outcome: esito, playerId: giocatoreAttivo, location: luogoRitornoRef.current, battleType: battaglia.tipo, title: `${giocatore.nome} · ${battaglia.leagueOpponent?.nome ?? (battaglia.allenatoreId ? getAllenatore(battaglia.allenatoreId)?.nome ?? 'Allenatore' : 'Incontro selvatico')}` })
  }, [terminata, esito, appendChronicle, chronicleRef, giocatoreAttivo, giocatore.nome, battaglia?.tipo, battaglia?.allenatoreId, battaglia?.cronaca, battaglia?.checkpoint, isChallenge])

  useEffect(() => {
    if (!audienceChoice || !pkmnB || !pkmnA || coinOpen || statusRoll || azioneInCorso || actionInProgressRef.current) return
    if (terminata || turnoA || scambioRichiesto || audienceChoice.pokemon.istanzaId !== pkmnB.istanzaId) {
      void audienceVote.cancel().catch(() => {})
      setAudienceChoice(null)
      return
    }
    if (!audienceEnabled || audienceSession?.sessionId !== audienceChoice.sessionId) {
      void audienceVote.cancel().catch(() => {})
      if (audienceChoice.request.channel === 'boss') {
        setAudienceChoice(null)
        setMostraMoseB(true)
        mostraMessaggi(['Comando ospite disattivato: la regia sceglie la mossa dalla pulsantiera.'])
        return
      }
      finishAudienceChoice(audienceChoice.request.fallbackIndex, 'Votazione disattivata: il rivale sceglie automaticamente.', true)
      return
    }
    const result = audienceVote.round
    if (!result || audienceVote.status !== 'closed') return
    const currentKey = `${audienceBattleId.current}:B:${opponentTurnNumber.current}:${pkmnB.istanzaId}`
    const index = validAudienceWinner(audienceChoice, result, pkmnB, currentKey)
    if (index === null) return
    const selected = audienceChoice.request.options.find((option) => option.index === index)!
    const reason = result.resolution === 'guest' ? `L’ospite ha scelto ${selected.name}.`
      : result.resolution === 'no-votes' ? 'Nessun voto: il rivale sceglie automaticamente.'
      : result.resolution === 'tie' ? `Parità: è stata estratta ${selected.name}.`
      : `Il pubblico ha scelto ${selected.name} (${result.counts[index]} voti).`
    finishAudienceChoice(index, reason, result.resolution === 'no-votes')
    // A response belongs to its durable B-turn identity. Refresh execution
    // callbacks without restarting the server polling on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audienceChoice, audienceVote.round, audienceVote.status, audienceEnabled, audienceSession?.sessionId,
    pkmnA, pkmnB, turnoA, terminata, scambioRichiesto, coinOpen, statusRoll, azioneInCorso])

  useEffect(() => {
    // The PvP move screen already completed B's mandatory status step. Starting
    // audience mode here must not apply sleep or poison a second time.
    if (!mostraMoseB || !audienceEnabled || !audienceSession || !battaglia || !pkmnA || !pkmnB
      || audienceChoice || terminata || coinOpen || statusRoll || azioneInCorso || actionInProgressRef.current) return
    const request = makeAudienceRoundRequest(battaglia, pkmnB, pkmnA,
      audienceBattleId.current, opponentTurnNumber.current, audienceDuration)
    if (request) {
      setAudienceChoice({ sessionId: audienceSession.sessionId, request, pokemon: pkmnB, messages: messaggiTurnoBRef.current })
      setMostraMoseB(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostraMoseB, audienceEnabled, audienceSession?.sessionId, audienceChoice,
    pkmnA, pkmnB, terminata, coinOpen, statusRoll, azioneInCorso, audienceDuration])

  useEffect(() => {
    // A corrupted/disabled saved ballot still contains a B whose mandatory
    // status step was completed. NPC recovery chooses a move without re-ticking it.
    if (!mostraMoseB || audienceChannelForBattle(battaglia) === 'boss' || audienceEnabled && audienceSession
      || audienceChoice || !pkmnA || !pkmnB || terminata || coinOpen || statusRoll
      || azioneInCorso || actionInProgressRef.current) return
    setMostraMoseB(false)
    const messages = messaggiTurnoBRef.current
    messaggiTurnoBRef.current = []
    eseguiMossaB(pkmnB, calcolaHPMax(pkmnB), scegliMossaIA(pkmnB, pkmnA, battleRng), messages)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostraMoseB, audienceEnabled, audienceSession?.sessionId, audienceChoice,
    pkmnA, pkmnB, terminata, coinOpen, statusRoll, azioneInCorso])



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

  const updateInSquadra = updateBattleSquad

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
      tone: efficacyTone(risultato.moltiplicatoreTipo),
    })
  }

  const revealLancioDadi = (id: number) => {
    const callbacks = diceRollCallbacksRef.current
    if (!callbacks || callbacks.id !== id || diceRollTimerRef.current !== null) return
    setPublicDiceId(id)
    callbacks.onVisible()
    diceRollTimerRef.current = window.setTimeout(() => {
      if (diceRollCallbacksRef.current !== callbacks) return
      setDiceRoll(null)
      diceRollTimerRef.current = null
      diceRollCallbacksRef.current = null
      callbacks.onComplete()
    }, getAnimationDuration(BATTLE_DICE_ROLL_VISIBLE_MS))
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
    }, getAnimationDuration(delayMs))
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
    if (!reducedMotion && feedback.hitStopMs > 0) {
      setPresentationPaused(true)
      scheduleFeedbackTimer(() => setPresentationPaused(false), feedback.hitStopMs)
    }

    if (playHitAnimation) playSpriteAction(side, 'hit', Math.max(240, feedback.targetShakeMs))
    if (!reducedMotion && feedback.targetShakeMs > 0 && feedback.targetShakePx > 0) {
      setShakeStrengthPx(feedback.targetShakePx)
      setShakeDurationMs(getAnimationDuration(feedback.targetShakeMs))
      setShaking(side)
      scheduleFeedbackTimer(() => setShaking(null), feedback.targetShakeMs)
    }

    if (!reducedMotion && feedback.targetFlashMs > 0) {
      setImpactFlash(side)
      scheduleFeedbackTimer(() => setImpactFlash(null), feedback.targetFlashMs)
    }

    if (!reducedMotion && feedback.cameraShakeMs > 0 && feedback.cameraShakePx > 0) {
      battleRig.camera.shake({
        amplitudePx: feedback.cameraShakePx,
        durationMs: getAnimationDuration(feedback.cameraShakeMs),
        rotateDeg: Math.min(0.6, feedback.cameraShakePx * 0.04),
      })
    }

    if (playHitSound && !getMoveVfxAssignment(move)) playSound('hit')
  }

  const playMoveVisuals = (
    move: MossaDef,
    side: 'A' | 'B',
    targetSide: 'A' | 'B' | null,
    onImpact: () => void,
    onComplete: () => void,
    onReleaseCue?: () => void
  ) => {
    const attacker = side === 'A' ? pkmnA : pkmnB
    const target = targetSide === 'A' ? pkmnA : targetSide === 'B' ? pkmnB : null
    if (!attacker) return
    const attackerView = side === 'A' ? 'back' : 'front'
    const targetView = targetSide === 'A' ? 'back' : 'front'
    const attackAsset = getArkamonAnimationAsset(attacker.specieId, attackerView, 'attack')
    const targetAsset = target ? getArkamonAnimationAsset(target.specieId, targetView, 'hit') : undefined
    const dedicatedAttack = !!attackAsset
    const dedicatedHit = !!targetAsset
    setHeldHitReactions(targetSide && dedicatedHit ? { [targetSide]: true } : {})
    const plan = planBattleAnimationPlayback(
      attackAsset ? (attackAsset.releaseFrame ?? 0) / attackAsset.fps * 1000 : 0,
      dedicatedHit && targetAsset ? (targetAsset.reactionFrame ?? 0) / targetAsset.fps * 1000 : 0,
      getMoveVfxImpactDelayMs(move), reducedMotion
    )
    const effectId = ++moveVfxIdRef.current
    const sequence = createBattleVisualSequence({
      waitForAttacker: dedicatedAttack,
      waitForTarget: !!targetAsset,
      onRelease: () => {
        onReleaseCue?.()
        mostraVfxMossa(move, side, effectId, {
          onStart: () => playback.vfxStart(),
          onImpact: () => sequence.impact(),
          onComplete: () => sequence.vfxComplete(),
        }, targetSide ? 'opponent' : 'self')
      },
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
    // All resources are ready before either clip's native clock can start.
    void Promise.all([
      prepareArkamonAnimationPlayback(attacker.specieId, attackerView, 'attack'),
      target ? prepareArkamonAnimationPlayback(target.specieId, targetView, 'hit') : Promise.resolve(),
      prepareMoveVfxPlayback(move, effectId),
    ]).then(() => {
      if (activePlaybackRef.current === active) playback.start()
    })
  }

  const eseguiSequenzaOffensiva = (
    risultato: RisultatoMossa,
    side: 'A' | 'B',
    targetSide: 'A' | 'B',
    onDamageReveal: () => void,
    onComplete: (actionId: string) => void
  ) => {
    if (actionInProgressRef.current) return
    if (isChallenge) challengeActions.current += 1
    actionInProgressRef.current = true
    setAzioneInCorso(true)
    const actionId = beginAction()
    const feedback = getMoveVfxFeedback(risultato.mossa)
    const target = targetSide === 'A' ? pkmnA : pkmnB
    // Keep all resolved damage private until the dice faces have been revealed.
    setPendingHealth(target ? { side: targetSide, instanceId: target.istanzaId, hp: target.hp } : null)
    const targetWillKO = !!target && target.hp <= risultato.dannoFinale
    const targetHasHit = target && !!getArkamonAnimationAsset(target.specieId, targetSide === 'A' ? 'back' : 'front', 'hit')
    const attacker = side === 'A' ? pkmnA : pkmnB
    const intro = cine.attackStart({
      side, moveName: risultato.mossa.nome, color: VFX_TYPE_COLORS[risultato.mossa.tipo], suprema: !!risultato.suprema,
      speciesId: attacker?.specieId, pokemonName: attacker?.nome,
    })
    // The same hit reaction plays for every attack; a fatal result must not reveal KO early.
    // Lo stacco della Suprema (se c'è) termina prima che parta l'animazione dell'attacco.
    void intro.then(() => playMoveVisuals(risultato.mossa, side, targetSide, () => {
      playImpactFeedback(risultato.mossa, targetSide, true, !targetHasHit)
      cine.impact()

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
      if (èMossaSoloStato(risultato.mossa) && risultato.dannoFinale === 0) {
        appendChronicle(revealedAttackEvents(risultato, side, actionId))
        onDamageReveal()
        setPendingHealth(null)
        cine.attackEnd()
        onComplete(actionId)
        actionInProgressRef.current = false
        setAzioneInCorso(false)
        return
      }
      const waitForTargetKO = targetWillKO && !!target && !!getArkamonAnimationAsset(
        target.specieId, targetSide === 'A' ? 'back' : 'front', 'ko'
      )
      const reveal = createBattleDamageReveal({
        waitForTargetKO,
        onReveal: () => {
          if (waitForTargetKO) {
            spriteCompletionWaitersRef.current[targetSide] = {
              animation: 'ko', replayKey: 0, onComplete: () => reveal.targetKOComplete(),
            }
          }
          setPendingHealth(null)
          appendChronicle(revealedAttackEvents(risultato, side, actionId))
          onDamageReveal()
          // Il danno è appena diventato pubblico: solo ora la regia può mostrarlo.
          cine.damageReveal({
            targetSide, damage: risultato.dannoFinale, hpMax: target ? calcolaHPMax(target) : 0,
            ko: targetWillKO, multiplier: risultato.moltiplicatoreTipo,
          })
        },
        onComplete: () => {
          if (activePlaybackRef.current === reveal) activePlaybackRef.current = null
          cine.attackEnd()
          onComplete(actionId)
          actionInProgressRef.current = false
          setAzioneInCorso(false)
        },
      })
      activePlaybackRef.current = reveal
      cine.diceStart()
      mostraLancioDadi(risultato, side, reveal.diceVisible, reveal.diceComplete)
    }, () => cine.release(targetSide)))
  }

  const eseguiSequenzaCura = (
    move: MossaDef,
    side: 'A' | 'B',
    onComplete: () => void
  ) => {
    if (actionInProgressRef.current) return
    if (isChallenge) challengeActions.current += 1
    actionInProgressRef.current = true
    setAzioneInCorso(true)
    void cine.attackStart({ side, moveName: move.nome, color: VFX_TYPE_COLORS[move.tipo] })
    playMoveVisuals(move, side, null, () => {}, () => {
      cine.attackEnd()
      onComplete()
      actionInProgressRef.current = false
      setAzioneInCorso(false)
    })
  }

  const tornaIndietro = () => {
    if (isChallenge) { const result = exitChallenge(true); if (!result.ok) mostraMessaggi([result.message]); return }
    if (audienceChoice) void audienceVote.cancel().catch(() => {})
    if (battaglia?.leagueBattle && esito) {
      const result = useGameStore.getState().concludiBattagliaLega(esito, squadraA, evoluzioniInAttesa)
      if (!result.ok) mostraMessaggi([result.message])
      return
    }
    if (!esito) return
    const result = useGameStore.getState().concludiBattaglia(esito)
    if (!result.ok) { mostraMessaggi([result.message]); return }
    useBattleArchiveStore.getState().archiveBattle({
      chronicle: chronicleRef.current, outcome: esito, playerId: giocatoreAttivo,
      location: luogoRitorno, battleType: battaglia?.tipo ?? 'Selvatico',
      title: `${giocatore.nome} · ${battaglia?.leagueOpponent?.nome ?? (battaglia?.allenatoreId ? getAllenatore(battaglia.allenatoreId)?.nome ?? 'Allenatore' : 'Incontro selvatico')}`,
    })
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
    opponentTurnNumber.current += 1
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
    if (audienceChoice) void audienceVote.cancel().catch(() => {})
    setAudienceChoice(null)
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
    appendChronicle([{ id: `${beginAction()}:switch`, kind: 'switch', side: 'A', title: `${scelto.nome} entra in campo`, messages: [], actor: logPokemon(scelto) }])

    if (richiesta.prossimoPasso === 'passaAB') {
      passaTurnoAaB(richiesta.pendingB ?? pkmnB, 300)
      return
    }

    passaTurnoBaA()
  }

  const specieA = getPokemon(pkmnA.specieId)!
  const hpMaxA = calcolaHPMax(pkmnA)
  const hpMaxB = calcolaHPMax(pkmnB)

  const presentaPremioXP = (
    attivo: PokemonIstanza,
    xpRes: ReturnType<typeof applicaXP>,
    annunciaLivello = true
  ) => {
    const messaggi: string[] = []
    if (xpRes.livelliGuadagnati > 0) {
      playSound('level-up')
      if (annunciaLivello) messaggi.push(`${attivo.nome} è salito al livello ${xpRes.istanza.livello}!`)
    }
    if (annunciaLivello && xpRes.xpScartata > 0 && xpRes.istanza.livello < 100) {
      messaggi.push(`${attivo.nome} ha raggiunto il cap di squadra: l’EXP di questo KO non si accumula. Allena gli Arkamon di livello più basso.`)
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
  }

  const premiaConXP = (
    attivo: PokemonIstanza,
    sconfittoPrima: PokemonIstanza,
    sconfittoDopo: PokemonIstanza
  ): PokemonIstanza => {
    const xpRes = applicaXPDopoKO(attivo, sconfittoPrima, sconfittoDopo, teamProgressionLimit(squadraA, attivo.istanzaId))
    appendChronicle(xpEvent(attivo, xpRes, 'A', `${beginAction()}:xp`))
    if (xpRes.xpAssegnata) presentaPremioXP(attivo, xpRes)
    return xpRes.istanza
  }

  const premiaRivaleConXP = (
    rivale: PokemonIstanza,
    sconfittoPrima: PokemonIstanza,
    sconfittoDopo: PokemonIstanza
  ): PokemonIstanza => {
    const xpRes = applicaXPDopoKO(rivale, sconfittoPrima, sconfittoDopo,
      isChallenge ? teamProgressionLimit(squadraB, rivale.istanzaId) : 100)
    appendChronicle(xpEvent(rivale, xpRes, 'B', `${beginAction()}:xp`))
    if (xpRes.livelliGuadagnati > 0) {
      playSound('level-up')
      mostraMessaggi([`${rivale.nome} è salito al livello ${xpRes.istanza.livello}!`])
    }
    // B è una squadra temporanea: le sue evoluzioni non appartengono al giocatore A.
    return xpRes.istanza
  }

  const preparaTurnoGiocatore = (
    onReady: (pokemon: PokemonIstanza, messages: string[]) => void,
    resolvedStatus?: ReturnType<typeof risolviStatoInizioTurno>,
    verificaAttacco = true
  ) => {
    if (coinOpen || statusPending.current) return
    if (terminata || !turnoA || azioneInCorso || actionInProgressRef.current || scambioRichiesto || attesaPassaggio || attesaAvversario) return
    resetInfoBox()

    const statoRes = resolvedStatus ?? risolviStatoInizioTurno(pkmnA, hpMaxA, battleRng, verificaAttacco)
    if (!resolvedStatus && statoRes.tiroStato !== undefined) { presentStatus(statoRes, pkmnA, () => preparaTurnoGiocatore(onReady, statoRes, verificaAttacco)); return }
    if (statoRes.messaggi.length) appendChronicle(statusEvents(pkmnA, statoRes, 'A', `${beginAction()}:status`))
    const pkmnAEffettivo = statoRes.istanza
    setPkmnA(pkmnAEffettivo)
    setSquadraA((sq) => updateInSquadra(sq, pkmnAEffettivo))

    if (pkmnAEffettivo.hp <= 0) {
      appendChronicle([{ id: `${beginAction()}:ko`, kind: 'ko', side: 'A', title: `${pkmnAEffettivo.nome} è KO`, messages: [], actor: logPokemon(pkmnAEffettivo) }])
      const finishKO = () => {
        actionInProgressRef.current = false
        setAzioneInCorso(false)
        mostraMessaggi([...statoRes.messaggi, `${pkmnAEffettivo.nome} è caduto!`])
        playSound('ko')
        const aggiornatoB = premiaRivaleConXP(pkmnB, pkmnA, pkmnAEffettivo)
        appendChronicle([{ id: `${beginAction()}:winner`, kind: 'winner', side: 'B', winnerSide: 'B', title: `${aggiornatoB.nome} vince lo scontro`, messages: [], actor: logPokemon(aggiornatoB) }])
        setPkmnB(aggiornatoB)
        setSquadraB((sq) => updateInSquadra(sq, aggiornatoB))
        const nextA = squadraA.find(
          (p) => p.istanzaId !== pkmnAEffettivo.istanzaId && p.hp > 0
        )
        if (nextA) {
          apriScambio({
            motivo: `${pkmnAEffettivo.nome} non può continuare.`,
            prossimoPasso: 'passaAB',
            pendingB: aggiornatoB,
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

  const eseguiMossa = (numeroMossa: 0 | 1 | 2, suprema = false) => {
    const mossaScelta = specieA.mosse[numeroMossa]
      ? getMossa(specieA.mosse[numeroMossa]!)
      : null
    preparaTurnoGiocatore((pkmnAEffettivo, statusMessages) => {
    if (mossaScelta && èMossaCura(mossaScelta)) {
      if (suprema) return
      const cura = applicaMossaCura(pkmnAEffettivo, mossaScelta, hpMaxA)
      const actionId = beginAction()
      eseguiSequenzaCura(mossaScelta, 'A', () => {
        appendChronicle([{ id: `${actionId}:heal`, kind: 'heal', side: 'A', title: `${pkmnAEffettivo.nome} usa ${mossaScelta.nome}`, messages: cura.messaggi, actor: logPokemon(cura.istanza), hpBefore: pkmnAEffettivo.hp, hpAfter: cura.istanza.hp }])
        setPkmnA(cura.istanza)
        setSquadraA((sq) => updateInSquadra(sq, cura.istanza))
        mostraMessaggi([...statusMessages, ...cura.messaggi])
        passaTurnoAaB(pkmnB, 1200)
      })
      return
    }

    const risultatoBase = suprema
      ? calcolaAzioneSuprema(pkmnAEffettivo, pkmnB, numeroMossa, battleRng)
      : calcolaDanno(pkmnAEffettivo, pkmnB, numeroMossa, battleRng, false)
    // Boost danno: +25% agli attacchi dei tuoi Arkamon per il resto della sfida.
    const ris = risultatoBase && useGameStore.getState().battaglia?.boost?.danno ? applyDamageBoost(risultatoBase) : risultatoBase
    if (!ris) return

    const settlement = resolveBattleAttack(ris, 'A', squadraA, squadraB, teamProgressionLimit(squadraA, pkmnAEffettivo.istanzaId), isChallenge ? teamProgressionLimit(squadraB, pkmnB.istanzaId) : 100)
    let nuovoB = settlement.defenderAfterImpact
    let nuovaSquadraB = updateInSquadra(squadraB, nuovoB)
    eseguiSequenzaOffensiva(
      ris,
      'A',
      'B',
      () => {
        setPkmnB(nuovoB)
        setSquadraB(nuovaSquadraB)
      },
      (actionId) => {
      const risoluzione = settlement.attackerProgression
      const aggiornatoA = settlement.attacker
      const nuovaSquadraA = settlement.squadA
      appendChronicle(settledAttackEvents(ris, settlement, 'A', actionId))
      mostraMessaggi([...statusMessages, ...risoluzione.messaggi])
      if (risoluzione.xpAssegnata) presentaPremioXP(pkmnAEffettivo, risoluzione, false)
      setPkmnA(aggiornatoA)
      setSquadraA(nuovaSquadraA)
      if (nuovoB.hp <= 0 || aggiornatoA.hp <= 0) playSound('ko')

      if (settlement.defenderProgression?.livelliGuadagnati) {
        playSound('level-up')
        mostraMessaggi([`${nuovoB.nome} è salito al livello ${settlement.defender.livello}!`])
      }
      nuovoB = settlement.defender
      nuovaSquadraB = settlement.squadB
      setPkmnB(nuovoB)
      setSquadraB(nuovaSquadraB)
      const esitoDopoMossa = settlement.outcome
      if (esitoDopoMossa) {
        const vittoria = esitoDopoMossa === 'vittoria'
        mostraMessaggi([vittoria ? 'Hai vinto la battaglia!' : 'Hai perso la battaglia...'])
        if (vittoria) playSound('victory')
        setEsito(esitoDopoMossa)
        setTerminata(true)
        return
      }

      const prossimoB = nuovoB.hp <= 0
        ? nuovaSquadraB.find((p) => p.istanzaId !== nuovoB.istanzaId && p.hp > 0)!
        : nuovoB
      if (nuovoB.hp <= 0) {
        mostraMessaggi([`L'avversario manda in campo ${prossimoB.nome}!`])
        appendChronicle([{ id: `${actionId}:switch-b`, kind: 'switch', side: 'B', title: `${prossimoB.nome} entra in campo`, messages: [], actor: logPokemon(prossimoB) }])
        setPkmnB(prossimoB)
      }
      if (aggiornatoA.hp <= 0) {
        mostraMessaggi([`${aggiornatoA.nome} è esausto!`])
        apriScambio({
          motivo: `${aggiornatoA.nome} non può continuare.`,
          prossimoPasso: 'passaAB',
          pendingB: prossimoB,
        })
        return
      }
      passaTurnoAaB(prossimoB, nuovoB.hp <= 0 ? 800 : 1500)
    })
    }, undefined, !mossaScelta || !èMossaCura(mossaScelta))
  }

  // Porting di: EseguiAzioneCattura da old_files/Mod_Battle_Engine.txt
  const salvaCatturaConclusa = (itemId: CaptureItemId) => {
    const currentA = latestPokemon.current.A ?? pkmnA
    const checkpoint = settledBattleCheckpoint({
      initialPriority: battlePriority(),
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
      cronaca: chronicleRef.current,
    }, itemId)
  }

  const segnalaCatturaNonSalvata = (itemId: CaptureItemId) => {
    // Keep this resolved action pending: retry persistence without another status tick or RNG draw.
    setPendingCaptureSave({ itemId })
    setAzioneInCorso(true)
    mostraMessaggi(['Cattura non salvata. Squadra e deposito restano intatti. Libera spazio per i salvataggi del browser e riprova.'])
  }

  const mostraCatturaConclusa = () => {
    setPendingCaptureSave(null)
    setAzioneInCorso(false)
    playSound('capture')
    setEsito('vittoria')
    setTerminata(true)
  }

  const completaCatturaSalvata = (itemId: CaptureItemId) => {
    if (!salvaCatturaConclusa(itemId)) {
      segnalaCatturaNonSalvata(itemId)
      return false
    }
    mostraCatturaConclusa()
    return true
  }

  /**
   * Mette in scena una cattura già decisa dal motore. Una cattura riuscita è
   * salvata prima dell'animazione: ricaricare la pagina a metà non permette
   * di ritentare il tiro. Durante la scena i comandi restano bloccati.
   */
  const presentaCattura = (plan: Parameters<typeof cine.capture>[0], itemId: CaptureItemId, onEscaped: () => void, onCaught: () => void) => {
    if (plan.caught && !salvaCatturaConclusa(itemId)) {
      segnalaCatturaNonSalvata(itemId)
      return
    }
    actionInProgressRef.current = true
    setAzioneInCorso(true)
    void cine.capture(plan).then(() => {
      actionInProgressRef.current = false
      if (plan.caught) {
        mostraCatturaConclusa()
        onCaught()
        return
      }
      setAzioneInCorso(false)
      onEscaped()
    })
  }

  /** Cattura con un Sacchettino della borsa: il sacchetto si consuma sempre, insieme all'esito salvato. */
  const eseguiCattura = (itemId: CaptureItemId) => {
    if (!haSpazioPokemon(giocatore, pkmnB)) {
      mostraMessaggi(['Nessun posto disponibile per questo Arkamon: libera uno slot nel deposito o una posizione compatibile in squadra.'])
      return
    }
    const item = getShopItem(itemId)
    if (!item || item.effect.kind !== 'capture' || (inventarioAttivo[itemId] ?? 0) <= 0) return
    const tier = item.effect.tier
    preparaTurnoGiocatore((_pokemon, statusMessages) => {
      const ris = tentaCatturaSacchettino(pkmnB, tier, battleRng)
      // Riuscita: il Sacchettino si consuma insieme alla cattura (un salvataggio rifiutato non toglie nulla).
      // Fallita: si consuma subito, prima della scena; se il browser rifiuta, il lancio non avviene.
      if (!ris.riuscita && !useGameStore.getState().spendiOggetto(giocatoreAttivo, itemId)) {
        mostraMessaggi([`${item.name} non usato: il browser non può salvare la partita.`])
        return
      }
      const detail = ris.roll === null
        ? `${item.name}: cattura garantita, nessun dado.`
        : `d20: ${ris.roll}. Serve ${ris.soglia} o più (Arkamon ${ris.difficolta}, ${ris.fascia.replace('pieno', 'HP sopra il 50%').replace('+status', ' con status').replace(/^(25|50)/, 'HP al $1%')}).`
      appendChronicle([{ id: `${beginAction()}:capture`, kind: 'capture', side: 'A', title: ris.riuscita ? `${pkmnB.nome} catturato` : `${pkmnB.nome} sfugge alla cattura`, messages: [detail], target: logPokemon(pkmnB), ...(ris.roll === null ? {} : { diceSum: ris.roll }) }])
      mostraMessaggi([...statusMessages, `Lanci un ${item.name}...`])
      const plan = ris.roll === null ? planMasterCapture() : planD20Capture({ roll: ris.roll, soglia: ris.soglia!, riuscita: ris.riuscita })
      presentaCattura(plan, itemId, () => {
        mostraMessaggi([`${pkmnB.nome} è scappato dal ${item.name}!`])
        passaTurnoAaB(pkmnB, 0)
      }, () => mostraMessaggi([`${pkmnB.nome} è stato catturato!`]))
    }, undefined, false)
  }

  /** Boost del Database: sostituisce la mossa del turno e vale per il resto della sfida. */
  const eseguiBoost = (itemId: ShopItemId, boost: 'velocita' | 'danno'): { ok: boolean; message: string } => {
    const current = useGameStore.getState().battaglia
    const blocked = boostBlockedReason(current)
    if (blocked) return { ok: false, message: blocked }
    if (current?.boost?.[boost]) return { ok: false, message: 'Questo Boost è già attivo in questa sfida.' }
    if ((giocatore.inventario[itemId] ?? 0) < 1) return { ok: false, message: 'Questo oggetto non è nella borsa.' }
    const name = getShopItem(itemId)!.name
    preparaTurnoGiocatore((active, messages) => {
      const nextBoost = { ...(current?.boost ?? {}), [boost]: true }
      const priority: Lato = nextBoost.velocita ? 'A' : initialCheckpoint?.initialPriority ?? 'A'
      const acted = new Set(actedThisRound.current)
      const side = nextBattleSide(acted, 'A', priority, active.stato?.tipo, pkmnB.stato?.tipo)
      const checkpoint = settledBattleCheckpoint({ initialPriority: priority, actedThisRound: acted,
        turnA: side === 'A', pvp: isPvP, chooseRivalMove: false, passDirection: side === 'B' && isPvP ? 'A→B' : undefined,
        outcome: null, openingComplete: true, evolutions: evoluzioniInAttesa, rivalMessages: [], audienceBattleId: audienceBattleId.current, opponentTurnNumber: opponentTurnNumber.current })
      const text = boost === 'velocita' ? 'Per il resto della sfida i tuoi Arkamon agiscono per primi.' : 'Per il resto della sfida i tuoi Arkamon fanno il 25% di danni in più.'
      const event = { id: `${chronicleRef.current.battleId}:${chronicleRef.current.nextSequence}:item`, kind: 'heal' as const, side: 'A' as const,
        title: name, messages: [text], actor: logPokemon(active), hpBefore: active.hp, hpAfter: active.hp }
      const candidate = appendBattleEvents({ ...chronicleRef.current, nextSequence: chronicleRef.current.nextSequence + 1 }, [event])
      const currentSquad = updateInSquadra(squadraA, active)
      const committed = useGameStore.getState().usaOggetto(giocatoreAttivo, itemId, { boost: nextBoost, pokemonA: active, squadraA: currentSquad, pokemonB: pkmnB, squadraB,
        turnoCorrente: side, checkpoint, cronaca: candidate, log: [...messages, `${name}! ${text}`] })
      if (!committed) { mostraMessaggi(['Oggetto non usato: il browser non può salvare la partita.']); return }
      beginAction(); appendChronicle([event])
      setPkmnA(active); setSquadraA(currentSquad); mostraMessaggi([...messages, `${name}! ${text}`]); passaTurnoAaB(pkmnB, 0)
    }, undefined, false)
    return { ok: true, message: 'Boost attivato.' }
  }

  const eseguiOggetto = (itemId: ShopItemId, instanceId: string): { ok: boolean; message: string } => {
    if (!turnoA || terminata || azioneInCorso || actionInProgressRef.current || coinOpen || statusRoll || scambioRichiesto || attesaAvversario || attesaPassaggio) return { ok: false, message: 'Attendi il tuo turno.' }
    const boostItem = getShopItem(itemId)
    if (boostItem?.effect.kind === 'boost') return eseguiBoost(itemId, boostItem.effect.boost)
    const target = squadraA.find((pokemon) => pokemon.istanzaId === instanceId)
    const preview = target && resolveItemEffect(target, itemId)
    if (!preview?.ok) return { ok: false, message: preview?.message ?? 'Scegli un Arkamon della squadra.' }
    if ((giocatore.inventario[itemId] ?? 0) < 1) return { ok: false, message: 'Questo oggetto non è nella borsa.' }
    preparaTurnoGiocatore((active, messages) => {
      const currentSquad = updateInSquadra(squadraA, active)
      const currentTarget = currentSquad.find((pokemon) => pokemon.istanzaId === instanceId)!
      const effect = resolveItemEffect(currentTarget, itemId, battleRng)
      if (!effect.ok || !effect.pokemon) { mostraMessaggi([effect.message]); return }
      const nextSquad = updateInSquadra(currentSquad, effect.pokemon)
      const nextA = instanceId === active.istanzaId ? effect.pokemon : active
      const acted = new Set(actedThisRound.current)
      const side = nextBattleSide(acted, 'A', battlePriority(), nextA.stato?.tipo, pkmnB.stato?.tipo)
      const checkpoint = settledBattleCheckpoint({ initialPriority: battlePriority(), actedThisRound: acted,
        turnA: side === 'A', pvp: isPvP, chooseRivalMove: false, passDirection: side === 'B' && isPvP ? 'A→B' : undefined,
        outcome: null, openingComplete: true, evolutions: evoluzioniInAttesa, rivalMessages: [], audienceBattleId: audienceBattleId.current, opponentTurnNumber: opponentTurnNumber.current })
      const event = { id: `${chronicleRef.current.battleId}:${chronicleRef.current.nextSequence}:item`, kind: 'heal' as const, side: 'A' as const,
        title: `${getShopItem(itemId)!.name} su ${effect.pokemon.nome}`, messages: [effect.message], actor: logPokemon(effect.pokemon), hpBefore: currentTarget.hp, hpAfter: effect.pokemon.hp }
      const candidate = appendBattleEvents({ ...chronicleRef.current, nextSequence: chronicleRef.current.nextSequence + 1 }, [event])
      const committed = useGameStore.getState().usaOggetto(giocatoreAttivo, itemId, { pokemonA: nextA, squadraA: nextSquad, pokemonB: pkmnB, squadraB,
        turnoCorrente: side, checkpoint, cronaca: candidate, log: [...messages, effect.message], ...(randomState.current ? { seeded: { ...randomState.current }, challengeActionCount: challengeActions.current + 1 } : {}) })
      if (!committed) { mostraMessaggi(['Oggetto non usato: il browser non può salvare la partita.']); return }
      if (isChallenge) challengeActions.current += 1
      beginAction(); appendChronicle([event])
      setPkmnA(nextA); setSquadraA(nextSquad); mostraMessaggi([...messages, effect.message]); passaTurnoAaB(pkmnB, 0)
    }, undefined, false)
    return { ok: true, message: 'Uso dell’oggetto avviato.' }
  }

  const turnoAvversario = (statoBcorrente: PokemonIstanza, resolvedStatus?: ReturnType<typeof risolviStatoInizioTurno>) => {
    if (coinOpen || statusPending.current) return
    if (terminata || actionInProgressRef.current || azioneInCorso || scambioRichiesto) return
    resetInfoBox()
    const hpMaxBcorrente = calcolaHPMax(statoBcorrente)
    // B sceglie la mossa dopo gli altri status: il tiro PAR serve solo se attacca.
    const statoRes = resolvedStatus ?? risolviStatoInizioTurno(statoBcorrente, hpMaxBcorrente, battleRng, false)
    if (!resolvedStatus && statoRes.tiroStato !== undefined) { presentStatus(statoRes, statoBcorrente, () => turnoAvversario(statoBcorrente, statoRes)); return }
    if (statoRes.messaggi.length) appendChronicle(statusEvents(statoBcorrente, statoRes, 'B', `${beginAction()}:status`))
    const bEffettivo = statoRes.istanza
    setPkmnB(bEffettivo)
    setSquadraB((sq) => updateInSquadra(sq, bEffettivo))

    if (bEffettivo.hp <= 0) {
      appendChronicle([{ id: `${beginAction()}:ko`, kind: 'ko', side: 'B', title: `${bEffettivo.nome} è KO`, messages: [], actor: logPokemon(bEffettivo) }])
      const finishKO = () => {
        actionInProgressRef.current = false
        setAzioneInCorso(false)
        mostraMessaggi(statoRes.messaggi)
        mostraMessaggi([`${bEffettivo.nome} è caduto!`])
        playSound('ko')
        const aggiornatoA = premiaConXP(pkmnA, statoBcorrente, bEffettivo)
        appendChronicle([{ id: `${beginAction()}:winner`, kind: 'winner', side: 'A', winnerSide: 'A', title: `${aggiornatoA.nome} vince lo scontro`, messages: [], actor: logPokemon(aggiornatoA) }])
        setPkmnA(aggiornatoA)
        setSquadraA((sq) => updateInSquadra(sq, aggiornatoA))
        const nextB = squadraB.find(
          (p) => p.istanzaId !== bEffettivo.istanzaId && p.hp > 0
        )
        if (nextB && !isSelvatico) {
          mostraMessaggi([`L'avversario manda in campo ${nextB.nome}!`])
          appendChronicle([{ id: `${beginAction()}:switch-b`, kind: 'switch', side: 'B', title: `${nextB.nome} entra in campo`, messages: [], actor: logPokemon(nextB) }])
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

    if (audienceEnabled && audienceSession && battaglia && audienceChannelForBattle(battaglia)) {
      const request = makeAudienceRoundRequest(battaglia, bEffettivo, pkmnA,
        audienceBattleId.current, opponentTurnNumber.current, audienceDuration)
      if (request) {
        setMostraMoseB(false)
        setAudienceChoice({ sessionId: audienceSession.sessionId, request, pokemon: bEffettivo, messages: statoRes.messaggi })
        return
      }
    }

    if (isPvP || audienceChannelForBattle(battaglia) === 'boss') {
      messaggiTurnoBRef.current = statoRes.messaggi
      setMostraMoseB(true)
      return
    }

    const mossaIdx = scegliMossaIA(bEffettivo, pkmnA, battleRng)
    eseguiMossaB(bEffettivo, hpMaxBcorrente, mossaIdx, statoRes.messaggi)
  }

  const eseguiMossaB = (
    bEffettivo: PokemonIstanza,
    hpMaxBcorrente: number,
    mossaIdx: 0 | 1 | 2,
    messaggiIniziali: string[] = [],
    suprema?: boolean,
    resolvedParalysis?: ReturnType<typeof risolviStatoInizioTurno>
  ) => {
    const specieB = getPokemon(bEffettivo.specieId)
    const mossaIdB = specieB?.mosse[mossaIdx] ?? null
    const mossaDefB = mossaIdB ? getMossa(mossaIdB) : null

    if (bEffettivo.stato?.tipo === 'Paralizzato' && (!mossaDefB || !èMossaCura(mossaDefB))) {
      const statoRes = resolvedParalysis ?? risolviStatoInizioTurno(bEffettivo, hpMaxBcorrente, battleRng)
      if (!resolvedParalysis && statoRes.tiroStato !== undefined) {
        presentStatus(statoRes, bEffettivo, () => eseguiMossaB(bEffettivo, hpMaxBcorrente, mossaIdx, messaggiIniziali, suprema, statoRes))
        return
      }
      if (statoRes.messaggi.length) appendChronicle(statusEvents(bEffettivo, statoRes, 'B', `${beginAction()}:paralysis`))
      bEffettivo = statoRes.istanza
      setPkmnB(bEffettivo)
      setSquadraB((sq) => updateInSquadra(sq, bEffettivo))
      messaggiIniziali = [...messaggiIniziali, ...statoRes.messaggi]
      if (!statoRes.puoAgire) {
        mostraMessaggi(messaggiIniziali)
        passaTurnoBaA(pkmnA, bEffettivo)
        return
      }
    }

    if (mossaDefB && èMossaCura(mossaDefB)) {
      if (suprema) return
      const cura = applicaMossaCura(bEffettivo, mossaDefB, hpMaxBcorrente)
      const actionId = beginAction()
      eseguiSequenzaCura(mossaDefB, 'B', () => {
        appendChronicle([{ id: `${actionId}:heal`, kind: 'heal', side: 'B', title: `${bEffettivo.nome} usa ${mossaDefB.nome}`, messages: cura.messaggi, actor: logPokemon(cura.istanza), hpBefore: bEffettivo.hp, hpAfter: cura.istanza.hp }])
        setPkmnB(cura.istanza)
        setSquadraB((sq) => updateInSquadra(sq, cura.istanza))
        mostraMessaggi([...messaggiIniziali, ...cura.messaggi])
        passaTurnoBaA()
      })
      return
    }

    const ris = suprema
      ? calcolaAzioneSuprema(bEffettivo, pkmnA, mossaIdx, battleRng)
      : calcolaDanno(bEffettivo, pkmnA, mossaIdx, battleRng, suprema)
    if (!ris) {
      passaTurnoBaA()
      return
    }
    const settlement = resolveBattleAttack(ris, 'B', squadraA, squadraB, teamProgressionLimit(squadraA, pkmnA.istanzaId), isChallenge ? teamProgressionLimit(squadraB, bEffettivo.istanzaId) : 100)
    const nuovoA = settlement.defenderAfterImpact
    const nuovaSquadraA = updateInSquadra(squadraA, nuovoA)
    eseguiSequenzaOffensiva(
      ris,
      'B',
      'A',
      () => {
        setPkmnA(nuovoA)
        setSquadraA(nuovaSquadraA)
      },
      (actionId) => {
      const risoluzione = settlement.attackerProgression
      const bDopoAutodanno = settlement.attacker
      appendChronicle(settledAttackEvents(ris, settlement, 'B', actionId))
      mostraMessaggi([...messaggiIniziali, ...risoluzione.messaggi])
      if (risoluzione.livelliGuadagnati > 0) playSound('level-up')
      // La squadra B resta nella battaglia; la coda evoluzioni appartiene ad A.
      setPkmnB(bDopoAutodanno)
      const nuovaSquadraB = settlement.squadB
      setSquadraB(nuovaSquadraB)
      if (nuovoA.hp <= 0 || bDopoAutodanno.hp <= 0) playSound('ko')

      // Se A sopravvive al colpo e B cade per il proprio contraccolpo, A vince.
      // Nel doppio KO il premio è già stato assegnato al solo attaccante B.
      const aggiornatoA = settlement.defender
      if (settlement.defenderProgression?.xpAssegnata) presentaPremioXP(nuovoA, settlement.defenderProgression)
      setPkmnA(aggiornatoA)
      setSquadraA(settlement.squadA)
      const esitoDopoMossa = settlement.outcome
      if (esitoDopoMossa) {
        const vittoria = esitoDopoMossa === 'vittoria'
        mostraMessaggi([vittoria ? 'Hai vinto la battaglia!' : 'Hai perso la battaglia...'])
        if (vittoria) playSound('victory')
        setEsito(esitoDopoMossa)
        setTerminata(true)
        return
      }

      const prossimoB = bDopoAutodanno.hp <= 0
        ? nuovaSquadraB.find((p) => p.istanzaId !== bDopoAutodanno.istanzaId && p.hp > 0)!
        : bDopoAutodanno
      if (bDopoAutodanno.hp <= 0) {
        mostraMessaggi([`${bDopoAutodanno.nome} è esausto! L'avversario manda in campo ${prossimoB.nome}!`])
        appendChronicle([{ id: `${actionId}:switch-b`, kind: 'switch', side: 'B', title: `${prossimoB.nome} entra in campo`, messages: [], actor: logPokemon(prossimoB) }])
        setPkmnB(prossimoB)
      }
      if (nuovoA.hp <= 0) {
        mostraMessaggi([`${nuovoA.nome} è KO!`])
        apriScambio({
          motivo: `${nuovoA.nome} è KO.`,
          prossimoPasso: 'passaAdA',
        })
        return
      }
      passaTurnoBaA(aggiornatoA, prossimoB)
    })
  }

  function finishAudienceChoice(index: 0 | 1 | 2, message: string, automaticFallback = false) {
    const pending = audienceChoice
    if (!pending || completedAudienceTurns.current.has(pending.request.turnKey)
      || actionInProgressRef.current || azioneInCorso || terminata || turnoA
      || latestPokemon.current.B?.istanzaId !== pending.pokemon.istanzaId) return
    const current = latestPokemon.current.B
    const option = pending.request.options.find((item) => item.index === index)
    if (!option || getPokemon(current.specieId)?.mosse[index] !== option.moveId) return
    completedAudienceTurns.current.add(pending.request.turnKey)
    appendChronicle([{ id: `${pending.request.turnKey}:audience`, kind: 'audience', side: 'B', title: pending.request.channel === 'boss' ? 'Comando dell’ospite' : 'Scelta del pubblico', messages: [message] }])
    setAudienceChoice(null)
    setMostraMoseB(false)
    // A public choice is a normal human action, including legacy SUPREMA moves.
    // Only the automatic fallback retains the AI's legacy classification.
    eseguiMossaB(current, calcolaHPMax(current), index, [...pending.messages, message], automaticFallback ? undefined : false)
  }

  const continueWithoutAudience = () => {
    if (!audienceChoice) return
    void audienceVote.cancel().catch(() => {})
    finishAudienceChoice(audienceChoice.request.fallbackIndex, audienceChoice.request.channel === 'boss'
      ? 'La regia sceglie esplicitamente la mossa automatica al posto dell’ospite.'
      : 'La regia continua senza votazione: il rivale sceglie automaticamente.', true)
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
    <BattleLayoutProvider value={battleLayout}><div
      data-battle-layout-root
      className="battle-stage w-full h-full relative overflow-hidden"
      data-battle-impact-held={presentationPaused}
      data-battle-assets-ready={assetReadiness.ready}
      data-battle-decoded-vfx-bytes={assetReadiness.metrics.images.decodedBytes}
      data-battle-decoded-native-bytes={assetReadiness.metrics.pages.decodedBytes}
    >
      <ChallengeBanner embedded />
      <BattleLogPanel chronicle={chronicle} busy={azioneInCorso || coinOpen || !!statusRoll} />
      {previewView === 'dice' && <DiceRollOverlay staticPreview roll={{ id: -1, side: 'A', moveName: 'Attacco di esempio', rolls: [2, 4, 6], increment: 2, damage: 14 }} />}
      {previewView === 'bag' && <BattleItemDialog squad={squadraA} inventory={giocatore.inventario} onUse={() => ({ ok: false, message: 'Anteprima del layout: nessun oggetto usato.' })} onClose={() => {}} />}
      {!terminata && <button type="button" className="absolute bottom-3 right-3 z-30 rounded border border-violet-300 bg-slate-950 px-3 py-2 text-sm text-white" disabled={!turnoA || azioneInCorso || coinOpen || !!statusRoll || !!attesaAvversario || !!attesaPassaggio || !!scambioRichiesto || !!mostraMoseB} onClick={() => setBagOpen(true)}>Borsa</button>}
      {bagOpen && <BattleItemDialog squad={squadraA} inventory={giocatore.inventario} onUse={eseguiOggetto} onClose={() => setBagOpen(false)} boostBlocked={boostBlockedReason(battaglia)} activeBoosts={battaglia?.boost} />}
      {audienceChoice && !terminata && <BattleAudienceOverlay
        request={audienceChoice.request} round={audienceVote.round} status={audienceVote.status}
        remainingMs={audienceVote.remainingMs} error={audienceVote.error}
        joinUrl={audienceChoice.request.channel === 'npc' ? audienceSession?.joinUrls.npc ?? '' : ''}
        onRetry={audienceVote.retry} onCloseEarly={audienceVote.closeEarly} onFallback={continueWithoutAudience}
      />}
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

      <Stage rig={battleRig} data-battle-world className="battle-world absolute inset-0">
      {/* Il fondale è un livello lontano: nelle inquadrature si muove meno degli Arkamon e il margine copre i bordi durante lo shake. */}
      <StageLayer depth={0.9} bleed={1.03} className="bg-cover bg-center" style={{ backgroundImage: `url(${bgBattaglia})` }}>
        {/* Con una mappa di profondità il fondale diventa 2.5D (WebGL); altrimenti resta l'immagine. */}
        <DepthBackground src={bgBattaglia} className="absolute inset-0" />
        <AmbientParticles variant="motes" count={22} seed={3} />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/10 via-transparent to-slate-950/60 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-t from-slate-950/80 to-transparent pointer-events-none" />
        <div className={`battle-knockout-veil ${cine.knockoutSide ? 'is-active' : ''}`} data-battle-knockout-veil={cine.knockoutSide ?? undefined} />
      </StageLayer>

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
      <AnimatePresence mode="popLayout">
        <BattleLayoutItem
          key={pkmnB.istanzaId}
          layoutKey="enemySprite"
          label="Sprite nemico"
          rect={battleLayout.enemySprite}
          editing={layoutEditing}
          onChange={updateBattleLayout}
        >
          {/* Durante la cattura l'Arkamon selvatico entra nella sfera: si rimpicciolisce verso il suo centro. */}
          <motion.div
            className="h-full w-full"
            data-capture-absorbed={captureHidesTarget(cine.captureDisplay) || undefined}
            initial={false}
            animate={captureHidesTarget(cine.captureDisplay) ? { scale: 0.05, opacity: 0 } : { scale: 1, opacity: 1 }}
            transition={{ duration: getAnimationDuration(reducedMotion ? 0 : 320) / 1000, ease: [0.7, 0, 0.84, 0] }}
          >
          <PokemonBattleSlot
            presentationPaused={presentationPaused}
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
          </motion.div>
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
            presentationPaused={presentationPaused}
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

      <BattleCaptureLayer
        capture={cine.captureDisplay}
        from={{ x: battleFocusPoints.player.x * 100, y: battleFocusPoints.player.y * 100 }}
        to={{ x: battleFocusPoints.enemy.x * 100, y: battleFocusPoints.enemy.y * 100 }}
      />
      <BattleDamageNumber
        display={cine.damageNumber}
        position={cine.damageNumber ? { x: battleFocusPoints[cine.damageNumber.side === 'A' ? 'player' : 'enemy'].x * 100, y: battleFocusPoints[cine.damageNumber.side === 'A' ? 'player' : 'enemy'].y * 100 } : null}
      />
      </Stage>
      <ScreenFxLayer fx={battleFx} className="battle-fx-layer" />
      <BattleMoveBanner banner={cine.banner} />
      <SupremeCutIn display={cine.cutIn} />

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
          stato={pkmnB.stato}
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
          stato={pkmnA.stato}
          side="player"
        />
      </BattleLayoutItem>

      {/* A battaglia conclusa i messaggi passano nella scheda del risultato: due riquadri sovrapposti erano illeggibili. */}
      {(layoutEditing || (!terminata && (infoBoxMessaggi.length > 0 || !!attesaAvversario))) && (
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
                  defenderType={specieB.tipo}
                  textKeyPrefix={`move-${idx}`}
                  disabled={!turnoA || azioneInCorso || !èMossaDisponibile(mossa, pkmnA.livello)}
                  onClick={() => eseguiMossa(idx)}
                />
              ))}
            </div>

            {isSelvatico && battaglia && (
              <div className="mt-3 flex justify-end gap-2">
                {pendingCaptureSave && (
                  <ActionButton disabled={false} onClick={() => {
                    if (completaCatturaSalvata(pendingCaptureSave.itemId)) mostraMessaggi([`${pkmnB.nome} è stato catturato!`])
                  }}>
                    Riprova salvataggio cattura
                  </ActionButton>
                )}
                {!pendingCaptureSave && <>{CAPTURE_ITEM_IDS.filter((id) => (inventarioAttivo[id] ?? 0) > 0).map((id) => (
                  <ActionButton key={id} disabled={!turnoA || azioneInCorso} onClick={() => eseguiCattura(id)}>
                    {getShopItem(id)!.name} ×{inventarioAttivo[id]}
                  </ActionButton>
                ))}
                {!CAPTURE_ITEM_IDS.some((id) => (inventarioAttivo[id] ?? 0) > 0) && (
                  <ActionButton disabled onClick={() => undefined}>Nessun Sacchettino</ActionButton>
                )}</>}
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
              disabled={!turnoA || azioneInCorso || coinOpen || !!statusRoll || !mosseA.some(({ mossa }) => !èMossaCura(mossa) && !èMossaSoloStato(mossa))}
              recoil={costoSuprema(hpMaxA)}
              onClick={() => setSupremaSide('A')}
            />
          </div>
        </BattleLayoutItem>
      )}

      {(isPvP || audienceChannelForBattle(battaglia) === 'boss') && mostraMoseB && !terminata && !scambioRichiesto && (
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
                  defenderType={specieA.tipo}
                  textKeyPrefix={`move-${idx}`}
                  disabled={azioneInCorso || !èMossaDisponibile(mossa, pkmnB.livello)}
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
              disabled={azioneInCorso || coinOpen || !!statusRoll || !mosseB.some(({ mossa }) => !èMossaCura(mossa) && !èMossaSoloStato(mossa))}
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

      {terminata && isNPC && !battaglia?.leagueBattle && esito && (() => {
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

      {terminata && <BattleResultCard chronicle={chronicle} outcome={isSelvatico && esito === 'vittoria' && pkmnB.hp > 0 ? 'cattura' : esito}
        messages={infoBoxMessaggi}
        gymVictory={esito === 'vittoria' && battaglia?.allenatoreId !== undefined && getAllenatore(battaglia.allenatoreId)?.tipo === 'Capopalestra'} />}

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
        <div role="status" data-battle-turn-status className={`${diceRoll ? 'relative isolate' : 'arka-panel'} flex h-full w-full items-center justify-center px-4 py-1`}>
        {diceRoll && <span className="game-button-frame" data-kit="button-primary" aria-hidden="true" style={{
          borderImageSource: `url("${assetUrl('/ui/player-kit/button-primary.svg')}")`, borderImageSlice: '44 fill',
        }} />}
        <span className="arka-layout-content battle-turn-label text-center">
          {controlStatus}
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
    </div></BattleLayoutProvider>
  )
}
