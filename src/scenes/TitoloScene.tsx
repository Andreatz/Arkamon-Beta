import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '@store/gameStore'
import { useAdminStore } from '@store/adminStore'
import { motion } from 'framer-motion'
import { assetUrl } from '@/utils/assetUrl'
import { useGameMotionPreferences } from '@/settings/gamePreferences'

const DEFAULT_TITLE_LOGO = '/ui/logo_arkamon.png'
const DEFAULT_TITLE_BACKGROUND_VIDEO = '/assets/Sfondo Titolo.mp4'

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
  const haGiocatori = useGameStore((s) => s.giocatore1.squadra.length > 0 || s.giocatore2.squadra.length > 0)
  const starterCompletati = useGameStore((s) => s.giocatore1.squadra.length > 0 && s.giocatore2.squadra.length > 0)
  const titleLogo = useAdminStore((s) => s.theme.assets.titleLogo)
  const titleBackground = useAdminStore((s) => s.theme.assets.titleBackground)
  const [logoFailed, setLogoFailed] = useState(false)
  const [failedBackgroundPath, setFailedBackgroundPath] = useState<string | null>(null)

  useEffect(() => {
    setLogoFailed(false)
  }, [titleLogo])

  useEffect(() => {
    setFailedBackgroundPath(null)
  }, [titleBackground])

  const logoPath = titleLogo && !logoFailed ? titleLogo : DEFAULT_TITLE_LOGO
  const backgroundPath =
    titleBackground && failedBackgroundPath !== titleBackground ? titleBackground : DEFAULT_TITLE_BACKGROUND_VIDEO
  const hasBackground = Boolean(backgroundPath && failedBackgroundPath !== backgroundPath)
  const hasVideoBackground = /\.(mp4|webm|ogg)$/i.test(backgroundPath)
  useEffect(() => {
    if (!video.current) return
    if (reducedMotion) video.current.pause()
    else void video.current.play().catch(() => {})
  }, [reducedMotion, backgroundPath])

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-arka-bg via-slate-900 to-purple-950">
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

      <motion.img
        key={logoPath}
        src={assetUrl(logoPath)}
        alt="Arkamon"
        className="relative -top-40 z-10 w-[500px] max-w-[90%] mb-4 drop-shadow-2xl"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: reducedMotion ? 0 : 0.2 / speed, type: 'spring' }}
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
        className="relative z-10 flex flex-col gap-3 w-72"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: reducedMotion ? 0 : 1 / speed }}
      >
        <button
          className="arka-button text-xl"
          onClick={() => {
            if (haGiocatori && !window.confirm('Vuoi iniziare una nuova partita? La partita salvata verrà sostituita.')) return
            reset()
            vaiAScena('laboratorio')
          }}
        >
          Nuova Partita
        </button>
        {haGiocatori && (
          <button
            className="arka-button-secondary text-lg"
            onClick={() => vaiAScena(starterCompletati ? 'mappa-principale' : 'laboratorio')}
          >
            Continua
          </button>
        )}
      </motion.div>

    </div>
  )
}
