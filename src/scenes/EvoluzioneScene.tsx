import { DepthBackground } from '@/motion/depth/DepthBackground'
import { RpgCommand } from '@/components/rpg'
import './rpgScenes.css'
import { useSceneNavigation } from '@/components/transitions/SceneNavigationContext'
import { useGameStore } from '@store/gameStore'
import { useAdminStore } from '@store/adminStore'
import { AdminLayoutItem } from '@/admin/AdminLayoutItem'
import { getPokemon } from '@data/index'
import { calcolaHPMax } from '@engine/battleEngine'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { EVOLUTION_BG } from '@data/backgrounds'
import { assetUrl } from '@/utils/assetUrl'
import { playSound } from '@/utils/soundManager'
import { useGameMotionPreferences, getAnimationDuration } from '@/settings/gamePreferences'
import { getPortraitFraming } from '@/player-ui/portraitFraming'
import type { AdminEvolutionLayoutKey, AdminLayoutRect } from '@/theme/adminThemeTypes'
import type { PokemonIstanza } from '@/types'
import { useRegiaStore } from '@/regia/regiaStore'
import { getSplashArtwork } from '@/player-ui/reference/splashArtwork'
import { splashFocusPosition } from '@/components/battle/splashFocus'
import { EVOLUTION_MORPH_MS, EVOLUTION_WHITE_AT, evolutionAlternation } from './evolutionChoreography'
import './evolutionScene.css'

/**
 * Scena Evoluzione: animazione per ogni Pokémon che ha raggiunto la
 * soglia di evoluzione durante l'ultima battaglia.
 *
 * Porting di:
 * - Mod_Game_Events.AvviaScenaEvoluzione
 * - Mod_Game_Events.PreparaScenaEvoluzione
 * - Mod_Game_Events.ConcludiEvoluzione
 *
 * Payload atteso:
 *   {
 *     evoluzioni: { istanzaId: string, oldSpecieId: number, newSpecieId: number }[],
 *     luogoRitorno: string,
 *     giocatoreId: 1 | 2,
 *   }
 *
 * Processa una evoluzione alla volta. Ad ogni "Continua":
 * - applica la nuova specie all'istanza nello store (specieId + nome + HP ricalcolato)
 * - avanza all'evoluzione successiva
 * - quando tutte sono fatte, naviga al luogoRitorno
 */
type EvoluzioneSpec = {
  istanzaId: string
  oldSpecieId: number
  newSpecieId: number
}

/** Il payload sopravvive al reload; una specie già aggiornata non va evoluta di nuovo. */
export function getPendingEvolutionQueue(evoluzioni: EvoluzioneSpec[], squadra: PokemonIstanza[]): EvoluzioneSpec[] {
  return evoluzioni.filter((evoluzione) =>
    squadra.some((pokemon) => pokemon.istanzaId === evoluzione.istanzaId && pokemon.specieId === evoluzione.oldSpecieId),
  )
}

export function EvoluzioneScene() {
  const { reducedMotion, speed } = useGameMotionPreferences()
  const scenaCorrente = useSceneNavigation()
  const aggiornaPokemon = useGameStore((s) => s.aggiornaPokemon)
  const vaiAScena = useGameStore((s) => s.vaiAScena)
  const giocatore1 = useGameStore((s) => s.giocatore1)
  const giocatore2 = useGameStore((s) => s.giocatore2)
  const layoutEditing = useAdminStore((s) => s.layoutEditing)
  const evolutionLayout = useAdminStore((s) => s.theme.layouts.evolution)
  const updateSceneLayout = useAdminStore((s) => s.updateSceneLayout)
  const setBusy = useRegiaStore((s) => s.setBusy)

  const initialPayloadRef = useRef(scenaCorrente.payload)
  const luogoRitorno =
    (initialPayloadRef.current?.luogoRitorno as string) ?? 'mappa-principale'
  const giocatoreId = (initialPayloadRef.current?.giocatoreId as 1 | 2) ?? 1

  // Filtra solo al mount: il cambio di specie durante questa animazione deve
  // mantenere la schermata di conferma, fino al click su Continua/Fine.
  const [evoluzioni] = useState(() => getPendingEvolutionQueue(
    (initialPayloadRef.current?.evoluzioni as EvoluzioneSpec[]) ?? [],
    (giocatoreId === 1 ? giocatore1 : giocatore2).squadra,
  ))

  const [indice, setIndice] = useState(0)
  const [fase, setFase] = useState<'pre' | 'morphing' | 'post'>('pre')
  const evolutionTimerRef = useRef<number | null>(null)
  const navigationRequestedRef = useRef(false)
  const updateEvolutionLayout = (key: AdminEvolutionLayoutKey, rect: AdminLayoutRect) =>
    updateSceneLayout({ scene: 'evolution', key, rect })

  const corrente = evoluzioni[indice]

  const tornaIndietro = () => {
    if (navigationRequestedRef.current) return
    navigationRequestedRef.current = true

    const isPercorso = /^Percorso_/.test(luogoRitorno)
    if (luogoRitorno === 'lega') {
      vaiAScena('lega', { playerId: giocatoreId })
    } else if (isPercorso) {
      vaiAScena('percorso', { luogo: luogoRitorno })
    } else if (luogoRitorno && luogoRitorno !== 'mappa-principale') {
      vaiAScena('citta', { luogo: luogoRitorno })
    } else {
      vaiAScena('mappa-principale')
    }
  }

  useEffect(() => {
    return () => {
      if (evolutionTimerRef.current !== null) {
        window.clearTimeout(evolutionTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const active = fase === 'morphing'
    setBusy(active, 'Attendi la conclusione dell’evoluzione.', 'evolution')
    return () => setBusy(false, undefined, 'evolution')
  }, [fase, setBusy])

  const oldSpec = corrente ? getPokemon(corrente.oldSpecieId) : null
  const newSpec = corrente ? getPokemon(corrente.newSpecieId) : null
  const giocatore = giocatoreId === 1 ? giocatore1 : giocatore2
  const istanza = corrente
    ? giocatore.squadra.find((p) => p.istanzaId === corrente.istanzaId)
    : null

  // A failed write keeps the old species. A successful retry publishes the
  // same evolution and only then reveals the confirmation screen.
  useEffect(() => {
    if (fase === 'morphing' && istanza?.specieId === corrente?.newSpecieId) {
      playSound('level-up')
      setBusy(false, undefined, 'evolution')
      setFase('post')
    }
  }, [fase, istanza?.specieId, corrente?.newSpecieId, setBusy])

  useEffect(() => {
    if (!corrente) {
      tornaIndietro()
      return
    }

    if (!oldSpec || !newSpec || !istanza) {
      setIndice((i) => i + 1)
      setFase('pre')
    }
    // La navigazione deve avvenire soltanto quando cambia l'evoluzione corrente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corrente, oldSpec, newSpec, istanza])

  if (!corrente || !oldSpec || !newSpec || !istanza) {
    return null
  }

  const avvia = () => {
    if (fase !== 'pre') return
    playSound('evolution')
    setFase('morphing')
    if (evolutionTimerRef.current !== null) {
      window.clearTimeout(evolutionTimerRef.current)
    }
    evolutionTimerRef.current = window.setTimeout(() => {
      // Applica l'evoluzione allo store
      const evoluto = {
        ...istanza,
        specieId: newSpec.id,
        nome: newSpec.nome,
      }
      // Dopo la cura di fine battaglia l'Arkamon è a HP pieni: lo resta anche con il nuovo massimo.
      evoluto.hp = istanza.hp >= calcolaHPMax(istanza) ? calcolaHPMax(evoluto) : Math.min(istanza.hp, calcolaHPMax(evoluto))
      aggiornaPokemon(giocatoreId, evoluto)
      evolutionTimerRef.current = null
    }, reducedMotion ? 0 : getAnimationDuration(EVOLUTION_MORPH_MS))
  }

  const continua = () => {
    if (fase !== 'post') return
    if (indice + 1 < evoluzioni.length) {
      setIndice((i) => i + 1)
      setFase('pre')
    } else {
      tornaIndietro()
    }
  }

  return (
    <div
      data-admin-layout-root
      className="rpg-evolution-scene w-full h-full relative bg-gradient-to-br from-violet-950 via-fuchsia-900 to-indigo-950 overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: `url(${EVOLUTION_BG})`, isolation: 'isolate' }}
    >
      <DepthBackground src={EVOLUTION_BG} className="absolute inset-0" style={{ zIndex: -1 }} />
      {/* Sfondo a stelline animate */}
      {!reducedMotion && <div className="absolute inset-0 opacity-30">
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 100}%`,
            }}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [0.5, 1.5, 0.5],
            }}
            transition={{
              duration: 2 + (i % 3),
              repeat: Infinity,
              delay: (i % 5) * 0.3,
            }}
          />
        ))}
      </div>}

      <EvolutionStageLayers fase={fase} newSpecieId={newSpec.id} reducedMotion={reducedMotion} speed={speed} />

      {/* Contatore */}
      <AdminLayoutItem
        rootSelector="[data-admin-layout-root]"
        label="Contatore"
        rect={evolutionLayout.counter}
        editing={layoutEditing}
        onChange={(rect) => updateEvolutionLayout('counter', rect)}
        zIndex={20}
      >
      <div className="arka-panel flex h-full w-full items-center justify-center px-3 py-1">
        <span className="arka-layout-content text-xs text-arka-text-muted">
          Evoluzione {indice + 1} di {evoluzioni.length}
        </span>
      </div>
      </AdminLayoutItem>

      {/* Sprite centrale */}
      <AdminLayoutItem
        rootSelector="[data-admin-layout-root]"
        label="Sprite evoluzione"
        rect={evolutionLayout.sprite}
        editing={layoutEditing}
        onChange={(rect) => updateEvolutionLayout('sprite', rect)}
        zIndex={20}
      >
      <div className="relative h-full w-full flex items-center justify-center">
        {fase === 'pre' && (
          <motion.div className="relative z-10 h-full w-full" data-evolution-idle
            animate={reducedMotion ? { y: 0 } : { y: ['0%', '-2.5%', '0%'] }}
            transition={reducedMotion ? { duration: 0 } : { duration: 2.4 / speed, repeat: Infinity, ease: 'easeInOut' }}>
            <SpriteOrEmoji specieId={oldSpec.id} fallback={spriteFor(oldSpec.tipo)} />
          </motion.div>
        )}
        {fase === 'morphing' && (
          <EvolutionMorph oldId={oldSpec.id} newId={newSpec.id} oldFallback={spriteFor(oldSpec.tipo)} newFallback={spriteFor(newSpec.tipo)} reducedMotion={reducedMotion} speed={speed} />
        )}
        {fase === 'post' && (
          <motion.div className="relative z-10 h-full w-full" data-evolution-reveal
            initial={reducedMotion ? false : { scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: reducedMotion ? 0 : 0.6 / speed, ease: [0.34, 1.56, 0.64, 1] }}>
            <SpriteOrEmoji specieId={newSpec.id} fallback={spriteFor(newSpec.tipo)} />
          </motion.div>
        )}

        {/* Particelle che esplodono dal centro all'apparizione del nuovo sprite */}
        {fase === 'post' && !reducedMotion && (
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 18 }).map((_, i) => {
              const angle = (i / 18) * Math.PI * 2
              const dist = 200 + (i % 3) * 40
              return (
                <motion.div
                  key={i}
                  className="evolution-spark absolute top-1/2 left-1/2"
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1.2 }}
                  animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, opacity: 0, scale: 0.3 }}
                  transition={{ duration: 1.2 / speed, ease: [0.16, 1, 0.3, 1], delay: 0.15 / speed }}
                />
              )
            })}
          </div>
        )}
      </div>
      </AdminLayoutItem>

      {/* Testo + pulsante */}
      <AdminLayoutItem
        rootSelector="[data-admin-layout-root]"
        label="Testi"
        rect={evolutionLayout.textPanel}
        editing={layoutEditing}
        onChange={(rect) => updateEvolutionLayout('textPanel', rect)}
        zIndex={20}
      >
      <div className="rpg-evolution-message flex h-full w-full flex-col items-center justify-center gap-4 px-6 text-center">
        {fase === 'pre' && (
          <>
            <h2 className="arka-layout-content arka-readable-title text-3xl font-bold text-white">
              {istanza.nome} sta per evolversi!
            </h2>
            <p className="arka-layout-content arka-readable-text text-arka-text-muted text-center max-w-md">
              {oldSpec.nome} (livello {istanza.livello}) ha raggiunto la soglia
              di evoluzione.
            </p>
            <RpgCommand tone="primary" onClick={avvia} className="mt-4">
              <span className="arka-layout-content">✨ Evolvi!</span>
            </RpgCommand>
          </>
        )}
        {fase === 'morphing' && (
          <h2 className="arka-layout-content arka-readable-title text-2xl font-bold text-white">
            Evoluzione in corso…
          </h2>
        )}
        {fase === 'post' && (
          <>
            <motion.h2 className="arka-layout-content arka-readable-title text-4xl font-black text-yellow-300"
              initial={reducedMotion ? false : { y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ duration: reducedMotion ? 0 : 0.45 / speed, delay: reducedMotion ? 0 : 0.35 / speed, ease: [0.16, 1, 0.3, 1] }}>
              {oldSpec.nome} si è evoluto!
            </motion.h2>
            <RpgCommand tone="primary" onClick={continua} className="mt-4">
              <span className="arka-layout-content">
                {indice + 1 < evoluzioni.length ? 'Continua' : 'Fine'}
              </span>
            </RpgCommand>
          </>
        )}
      </div>
      </AdminLayoutItem>
    </div>
  )
}

/**
 * Livelli a tutto schermo: il velo che scurisce la scena durante la
 * trasformazione, il lampo bianco finale e l'illustrazione della nuova
 * specie che emerge dal bianco.
 */
function EvolutionStageLayers({ fase, newSpecieId, reducedMotion, speed }: { fase: 'pre' | 'morphing' | 'post'; newSpecieId: number; reducedMotion: boolean; speed: number }) {
  const artwork = getSplashArtwork(newSpecieId)
  const morph = getAnimationDuration(EVOLUTION_MORPH_MS) / 1000
  return (
    <>
      <motion.div className="evolution-veil" aria-hidden="true" initial={false}
        animate={{ opacity: fase === 'morphing' ? 1 : 0 }} transition={{ duration: reducedMotion ? 0 : 0.5 / speed }} />
      {fase === 'post' && artwork && (
        <motion.img className="evolution-splash" data-evolution-splash={newSpecieId} src={assetUrl(artwork.src)} alt="" aria-hidden="true" draggable={false}
          style={{ objectPosition: splashFocusPosition(artwork) }}
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 1.14 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: reducedMotion ? 0 : 1.6 / speed, ease: [0.16, 1, 0.3, 1] }} />
      )}
      {/* Sfumatura: separa lo sprite dall'illustrazione e lascia leggibile il testo. */}
      {fase === 'post' && artwork && <div className="evolution-splash-shade" aria-hidden="true" />}
      {fase === 'post' && !reducedMotion && <div className="evolution-rays" aria-hidden="true" />}
      {!reducedMotion && fase === 'morphing' && (
        <motion.div className="evolution-flash" aria-hidden="true" initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0, 1, 1] }} transition={{ duration: morph, times: [0, EVOLUTION_WHITE_AT - 0.08, EVOLUTION_WHITE_AT, 1], ease: 'easeIn' }} />
      )}
      {!reducedMotion && fase === 'post' && (
        <motion.div className="evolution-flash" aria-hidden="true" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.7 / speed, ease: 'easeOut' }} />
      )}
    </>
  )
}

/** Sagome bianche che si alternano sempre più in fretta dentro un vortice di luce. */
function EvolutionMorph({ oldId, newId, oldFallback, newFallback, reducedMotion, speed }: { oldId: number; newId: number; oldFallback: string; newFallback: string; reducedMotion: boolean; speed: number }) {
  const duration = getAnimationDuration(EVOLUTION_MORPH_MS) / 1000
  const { times, oldOpacity, newOpacity } = evolutionAlternation()
  if (reducedMotion) {
    return <div className="relative h-full w-full" data-evolution-morph><SpriteOrEmoji specieId={newId} fallback={newFallback} /></div>
  }
  return (
    <div className="relative h-full w-full" data-evolution-morph>
      <div className="evolution-vortex" aria-hidden="true">
        {Array.from({ length: 16 }, (_, index) => (
          <motion.span key={index} className="evolution-vortex__arm" style={{ rotate: `${(index / 16) * 360}deg` }}
            animate={{ rotate: `${(index / 16) * 360 + 540}deg` }} transition={{ duration, ease: [0.65, 0, 0.35, 1] }}>
            <motion.span className="evolution-vortex__mote" initial={{ x: '46vmin', opacity: 0 }}
              animate={{ x: ['46vmin', '30vmin', '2vmin'], opacity: [0, 1, 0] }}
              transition={{ duration, times: [0, 0.4, 0.92], delay: (index % 4) * 0.08 / speed, ease: 'easeIn' }} />
          </motion.span>
        ))}
      </div>
      <motion.div className="absolute inset-0" animate={{ scale: [1, 1.04, 1.08, 1.16] }} transition={{ duration, times: [0, 0.5, 0.8, 1], ease: 'easeIn' }}>
        <motion.div className="evolution-silhouette absolute inset-0" initial={{ opacity: 1 }} animate={{ opacity: oldOpacity }} transition={{ duration, times, ease: 'linear' }}>
          <SpriteOrEmoji specieId={oldId} fallback={oldFallback} />
        </motion.div>
        <motion.div className="evolution-silhouette absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: newOpacity }} transition={{ duration, times, ease: 'linear' }}>
          <SpriteOrEmoji specieId={newId} fallback={newFallback} />
        </motion.div>
      </motion.div>
    </div>
  )
}

function SpriteOrEmoji({
  specieId,
  fallback,
}: {
  specieId: number
  fallback: string
}) {
  const [loadFailed, setLoadFailed] = useState(false)
  const frontSource = `/sprites/front_sprites/${specieId}.png`
  const framing = getPortraitFraming(frontSource)

  useEffect(() => {
    setLoadFailed(false)
  }, [specieId])

  if (loadFailed) {
    return <span className="flex h-full w-full items-center justify-center text-8xl">{fallback}</span>
  }

  return <svg className="h-full w-full" viewBox={framing.viewBox} preserveAspectRatio="xMidYMid meet" aria-hidden="true" data-evolution-species={specieId}>
    <image key={frontSource} href={assetUrl(frontSource)} width={framing.width} height={framing.height} preserveAspectRatio="none" onError={() => setLoadFailed(true)} />
  </svg>
}

function spriteFor(tipo: string): string {
  switch (tipo) {
    case 'Fuoco':
      return '🔥'
    case 'Acqua':
      return '💧'
    case 'Erba':
      return '🌿'
    case 'Elettro':
      return '⚡'
    case 'Terra':
      return '⛰️'
    case 'Oscurità':
      return '🌑'
    case 'Psico':
      return '🔮'
    default:
      return '⭐'
  }
}
