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
import type { AdminEvolutionLayoutKey, AdminLayoutRect } from '@/theme/adminThemeTypes'

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

export function EvoluzioneScene() {
  const scenaCorrente = useGameStore((s) => s.scenaCorrente)
  const aggiornaPokemon = useGameStore((s) => s.aggiornaPokemon)
  const vaiAScena = useGameStore((s) => s.vaiAScena)
  const giocatore1 = useGameStore((s) => s.giocatore1)
  const giocatore2 = useGameStore((s) => s.giocatore2)
  const layoutEditing = useAdminStore((s) => s.layoutEditing)
  const evolutionLayout = useAdminStore((s) => s.theme.layouts.evolution)
  const updateSceneLayout = useAdminStore((s) => s.updateSceneLayout)

  const initialPayloadRef = useRef(scenaCorrente.payload)
  const evoluzioni = (initialPayloadRef.current?.evoluzioni as EvoluzioneSpec[]) ?? []
  const luogoRitorno =
    (initialPayloadRef.current?.luogoRitorno as string) ?? 'mappa-principale'
  const giocatoreId = (initialPayloadRef.current?.giocatoreId as 1 | 2) ?? 1

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

  useEffect(() => {
    return () => {
      if (evolutionTimerRef.current !== null) {
        window.clearTimeout(evolutionTimerRef.current)
      }
    }
  }, [])

  const oldSpec = corrente ? getPokemon(corrente.oldSpecieId) : null
  const newSpec = corrente ? getPokemon(corrente.newSpecieId) : null
  const giocatore = giocatoreId === 1 ? giocatore1 : giocatore2
  const istanza = corrente
    ? giocatore.squadra.find((p) => p.istanzaId === corrente.istanzaId)
    : null

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
      evoluto.hp = calcolaHPMax(evoluto)
      aggiornaPokemon(giocatoreId, evoluto)
      playSound('level-up')
      setFase('post')
      evolutionTimerRef.current = null
    }, 1800)
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
      className="w-full h-full relative bg-gradient-to-br from-violet-950 via-fuchsia-900 to-indigo-950 overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: `url(${EVOLUTION_BG})` }}
    >
      {/* Sfondo a stelline animate */}
      <div className="absolute inset-0 opacity-30">
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
      </div>

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
        <motion.div
          animate={
            fase === 'morphing'
              ? {
                  opacity: 1,
                  scale: [1, 1.2, 0.9, 1.3, 1],
                  rotate: [0, 90, 180, 270, 360],
                  filter: [
                    'brightness(1)',
                    'brightness(2)',
                    'brightness(3)',
                    'brightness(2)',
                    'brightness(1)',
                  ],
                }
              : {
                  opacity: 1,
                  scale: 1,
                  rotate: 0,
                  filter: 'brightness(1)',
                }
          }
          transition={
            fase === 'morphing'
              ? { duration: 1.8, ease: 'easeInOut' }
              : { duration: 0.35, ease: 'easeOut' }
          }
          className="relative z-10 flex h-full w-full items-center justify-center overflow-visible"
        >
          {fase === 'pre' && (
            <SpriteOrEmoji specieId={oldSpec.id} fallback={spriteFor(oldSpec.tipo)} />
          )}
          {fase === 'morphing' && <span className="text-8xl">✨</span>}
          {fase === 'post' && (
            <SpriteOrEmoji specieId={newSpec.id} fallback={spriteFor(newSpec.tipo)} />
          )}
        </motion.div>

        {/* Particelle che esplodono dal centro all'apparizione del nuovo sprite */}
        {fase === 'post' && (
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 14 }).map((_, i) => {
              const angle = (i / 14) * Math.PI * 2
              const dist = 180 + (i % 3) * 30
              return (
                <motion.div
                  key={i}
                  className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-yellow-300"
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{
                    x: Math.cos(angle) * dist,
                    y: Math.sin(angle) * dist,
                    opacity: 0,
                    scale: 0.3,
                  }}
                  transition={{ duration: 1.1, ease: 'easeOut', delay: 0.1 }}
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
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 px-6 text-center">
        {fase === 'pre' && (
          <>
            <h2 className="arka-layout-content arka-readable-title text-3xl font-bold text-white">
              {istanza.nome} sta per evolversi!
            </h2>
            <p className="arka-layout-content arka-readable-text text-arka-text-muted text-center max-w-md">
              {oldSpec.nome} (livello {istanza.livello}) ha raggiunto la soglia
              di evoluzione.
            </p>
            <button onClick={avvia} className="arka-button mt-4">
              <span className="arka-layout-content">✨ Evolvi!</span>
            </button>
          </>
        )}
        {fase === 'morphing' && (
          <h2 className="arka-layout-content arka-readable-title text-2xl font-bold text-white animate-pulse">
            ???
          </h2>
        )}
        {fase === 'post' && (
          <>
            <h2 className="arka-layout-content arka-readable-title text-4xl font-black text-yellow-300">
              {oldSpec.nome} si è evoluto in {newSpec.nome}!
            </h2>
            <p className="arka-layout-content arka-readable-text text-arka-text-muted text-sm">
              Tipo: {newSpec.tipo} · HP base: {newSpec.hpBase}
            </p>
            <button onClick={continua} className="arka-button mt-4">
              <span className="arka-layout-content">
                {indice + 1 < evoluzioni.length ? 'Continua' : 'Fine'}
              </span>
            </button>
          </>
        )}
      </div>
      </AdminLayoutItem>
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
  const [sourceIndex, setSourceIndex] = useState(0)
  const sources = [
    assetUrl(`/sprites/front_sprites/${specieId}.png`),
    assetUrl(`/sprites/small_sprites/Sprite Small ${specieId}.png`),
  ]

  useEffect(() => {
    setSourceIndex(0)
  }, [specieId])

  return (
    <>
      {sourceIndex < sources.length ? (
        <img
          key={`${specieId}-${sourceIndex}`}
          src={sources[sourceIndex]}
          alt=""
          className="w-full h-full object-contain"
          style={{ imageRendering: 'pixelated' }}
          onError={() => setSourceIndex((index) => index + 1)}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-8xl">
          {fallback}
        </span>
      )}
    </>
  )
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
