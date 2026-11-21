import { useInteractionStore } from '@/interactions/interactionStore'
import { AmbientParticles } from '@/motion/ambient/AmbientParticles'
import { RpgCommand as GameButton } from '@/components/rpg'
import './rpgScenes.css'
import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '@store/gameStore'
import { useAdminStore } from '@store/adminStore'
import { motion } from 'framer-motion'
import { assetUrl } from '@/utils/assetUrl'
import { useGameMotionPreferences } from '@/settings/gamePreferences'
import { hasOwnedPokemon } from '@/engine/pokemonOwnership'
import { preloadSceneTransitionArtwork } from '@/components/transitions/ArkamonDiceArtwork'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { SelectionCursor } from '@/motion/ui/SelectionCursor'
import { TitleKeyArt } from './TitleKeyArt'

// Logo dorato degli atlanti forniti (audit UX/UI); il vecchio logo resta il ripiego.
const DEFAULT_TITLE_LOGO = '/ui/game-art/logo.webp'
const DEFAULT_TITLE_BACKGROUND_VIDEO = '/assets/Sfondo Titolo.mp4'
/** Fase U5: senza un fondo scelto dall'Admin, il titolo usa la key art provvisoria al posto del vecchio video. */
const USE_KEY_ART = true

/**
 * Schermata titolo.
 * Tutto è in HTML + Tailwind: per modificare l'aspetto cambia le classi
 * o le variabili CSS in src/index.css.
 */
export function TitoloScene() {
  const { reducedMotion, speed } = useGameMotionPreferences()
  const video = useRef<HTMLVideoElement>(null)
  const vaiAScena = useGameStore((s) => s.vaiAScena)
  const reset = useGameStore((s) => s.reset)
  const haGiocatori = useGameStore((s) => hasOwnedPokemon(s.giocatore1) || hasOwnedPokemon(s.giocatore2))
  const starterCompletati = useGameStore((s) => hasOwnedPokemon(s.giocatore1) && hasOwnedPokemon(s.giocatore2))
  const titleLogo = useAdminStore((s) => s.theme.assets.titleLogo)
  const titleBackground = useAdminStore((s) => s.theme.assets.titleBackground)
  const [confirm, confirmDialog] = useConfirmDialog()
  const commands = useRef<HTMLDivElement>(null)
  const [logoFailed, setLogoFailed] = useState(false)
  const [failedBackgroundPath, setFailedBackgroundPath] = useState<string | null>(null)
  // Audit fase 6: un clic o Invio salta l'ingresso animato e porta subito ai comandi.
  const [introSkipped, setIntroSkipped] = useState(false)
  const instant = reducedMotion || introSkipped
  useEffect(() => {
    const skip = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      setIntroSkipped(true)
      const active = document.activeElement
      if (!active || active === document.body) {
        event.preventDefault()
        commands.current?.querySelector<HTMLButtonElement>('button')?.focus()
      }
    }
    window.addEventListener('keydown', skip)
    return () => window.removeEventListener('keydown', skip)
  }, [])

  useEffect(() => {
    setLogoFailed(false)
  }, [titleLogo])

  useEffect(() => {
    setFailedBackgroundPath(null)
  }, [titleBackground])

  const logoPath = titleLogo && !logoFailed ? titleLogo : DEFAULT_TITLE_LOGO
  const customBackground = Boolean(titleBackground && failedBackgroundPath !== titleBackground)
  const keyArt = USE_KEY_ART && !customBackground
  const backgroundPath =
    customBackground ? titleBackground! : DEFAULT_TITLE_BACKGROUND_VIDEO
  const hasBackground = !keyArt && Boolean(backgroundPath && failedBackgroundPath !== backgroundPath)
  const hasVideoBackground = /\.(mp4|webm|ogg)$/i.test(backgroundPath)
  useEffect(() => {
    if (!video.current) return
    if (reducedMotion) video.current.pause()
    else void video.current.play().catch(() => {})
  }, [reducedMotion, backgroundPath])

  return (
    <div onPointerDown={() => setIntroSkipped(true)} className="rpg-title-scene relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-arka-bg via-slate-900 to-purple-950" data-title-key-art={keyArt || undefined}>
      {keyArt && <TitleKeyArt still={reducedMotion} />}
      {hasBackground && hasVideoBackground ? (
        <video
          ref={video}
          key={backgroundPath}
          className="absolute inset-0 h-full w-full object-cover"
          src={assetUrl(backgroundPath)}
          autoPlay={!reducedMotion}
          muted
          loop
          playsInline
          onError={() => setFailedBackgroundPath(backgroundPath)}
        />
      ) : null}
      {hasBackground && !hasVideoBackground ? (
        <img
          key={backgroundPath}
          src={assetUrl(backgroundPath)}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setFailedBackgroundPath(backgroundPath)}
        />
      ) : null}
      {hasBackground ? (
        <div className="absolute inset-0 bg-[color-mix(in_srgb,var(--arka-bg)_45%,transparent)]" />
      ) : null}
      <AmbientParticles variant="fireflies" count={26} seed={11} />

      <motion.img
        key={logoPath}
        src={assetUrl(logoPath)}
        alt="Arkamon"
        className="rpg-title-logo relative z-10 drop-shadow-2xl"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={instant ? { duration: 0 } : { delay: 0.2 / speed, type: 'spring' }}
        onError={(e) => {
          if (logoPath !== DEFAULT_TITLE_LOGO) {
            setLogoFailed(true)
            return
          }

          e.currentTarget.style.display = 'none'
        }}
      />
      <h1 className="sr-only">ARKAMON</h1>

      <motion.div
        ref={commands}
        className="rpg-title-commands relative z-10 flex flex-col"
        onPointerEnter={() => { if (!reducedMotion) preloadSceneTransitionArtwork() }}
        onFocusCapture={() => { if (!reducedMotion) preloadSceneTransitionArtwork() }}
        onPointerDown={() => { if (!reducedMotion) preloadSceneTransitionArtwork() }}
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={instant ? { duration: 0 } : { delay: .3 / speed }}
      >
        <GameButton
          tone="primary" className="text-xl"
          onClick={async () => {
            if (haGiocatori && !await confirm({
              title: 'Nuova partita',
              message: 'Vuoi iniziare una nuova partita? La partita salvata verrà sostituita.',
              confirmLabel: 'Inizia da capo',
              danger: true,
            })) return
            useGameStore.getState().eseguiTransazione(() => { reset(); vaiAScena('laboratorio') })
            // Audit fase 8: una partita nuova senza catalogo riceve le interazioni di base.
            if (useInteractionStore.getState().interactions.length === 0) useInteractionStore.getState().installDefaultCatalog()
          }}
        >
          Nuova Partita
        </GameButton>
        {haGiocatori && (
          <GameButton
            className="text-lg"
            onClick={() => vaiAScena(starterCompletati ? 'mappa-principale' : 'laboratorio')}
          >
            Continua
          </GameButton>
        )}
      </motion.div>
      <SelectionCursor scope={commands} />
      {confirmDialog}
    </div>
  )
}
