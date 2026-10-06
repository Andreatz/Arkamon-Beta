import { useGameStore, STARTER_IDS } from '@store/gameStore'
import { getPokemon } from '@data/index'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { LABORATORY_BG } from '@data/backgrounds'
import { assetUrl } from '@/utils/assetUrl'

/**
 * Scena del Laboratorio: scelta dello starter.
 *
 * Replica la prima slide del gioco VBA. I due giocatori scelgono
 * a turno il proprio starter tra ID 1, 5, 9 (le prime forme delle
 * tre famiglie evolutive). Il terzo non scelto andrà al Rivale.
 */
export function LaboratorioScene() {
  const vaiAScena = useGameStore((s) => s.vaiAScena)
  const scegliStarter = useGameStore((s) => s.scegliStarter)
  const impostaNomeGiocatore = useGameStore((s) => s.impostaNomeGiocatore)
  const giocatore1 = useGameStore((s) => s.giocatore1)
  const giocatore2 = useGameStore((s) => s.giocatore2)
  const g1HaStarter = useGameStore((s) => s.giocatore1.squadra.length > 0)
  const g2HaStarter = useGameStore((s) => s.giocatore2.squadra.length > 0)
  const [nomiConfermati, setNomiConfermati] = useState(g1HaStarter || g2HaStarter)
  const [nomeGiocatore1, setNomeGiocatore1] = useState(giocatore1.nome)
  const [nomeGiocatore2, setNomeGiocatore2] = useState(giocatore2.nome)

  const tuttiHannoStarter = g1HaStarter && g2HaStarter
  const giocatoreAttivo = g1HaStarter ? 2 : 1
  const starterScelti = [...giocatore1.squadra, ...giocatore2.squadra].map((pokemon) => pokemon.specieId)
  const nomeGiocatoreAttivo = giocatoreAttivo === 1 ? giocatore1.nome : giocatore2.nome

  useEffect(() => {
    if (!tuttiHannoStarter) return
    const timer = window.setTimeout(() => {
      if (useGameStore.getState().scenaCorrente.scena === 'laboratorio') vaiAScena('mappa-principale')
    }, 800)
    return () => window.clearTimeout(timer)
  }, [tuttiHannoStarter, vaiAScena])

  const confermaNomi = () => {
    impostaNomeGiocatore(1, nomeGiocatore1)
    impostaNomeGiocatore(2, nomeGiocatore2)
    setNomiConfermati(true)
  }

  return (
    <div
      className="relative w-full h-full overflow-y-auto bg-gradient-to-b from-slate-800 to-slate-950 bg-cover bg-center"
      style={{ backgroundImage: `url(${LABORATORY_BG})` }}
    >
      <img
        src={assetUrl('/ui/player1.png')}
        alt=""
        className="pointer-events-none absolute bottom-[5%] left-[-15%] z-100 h-[60%] max-w-[75%] object-contain object-bottom-left drop-shadow-2xl"
        aria-hidden="true"
      />
      <img
        src={assetUrl('/ui/player2.png')}
        alt=""
        className="pointer-events-none absolute bottom-0 right-0 z-0 h-[88%] max-w-[30%] object-contain object-bottom-right drop-shadow-2xl"
        aria-hidden="true"
      />

      <div className="relative z-10 flex min-h-full w-full flex-col items-center justify-center px-4 py-4 sm:px-8 sm:py-8">
      <h2 className="arka-readable-title mb-2 text-center text-2xl font-bold text-arka-accent sm:text-4xl">
        Laboratorio del Professore
      </h2>
      {!nomiConfermati ? (
        <form
          className="arka-panel mt-5 w-full max-w-[34rem] space-y-4 p-4 sm:p-6"
          onSubmit={(event) => {
            event.preventDefault()
            confermaNomi()
          }}
        >
          <p className="text-center text-lg font-bold text-white">Inserisci i nomi dei giocatori</p>
          <label className="block text-sm font-bold text-arka-text">
            Giocatore 1
            <input
              value={nomeGiocatore1}
              onChange={(event) => setNomeGiocatore1(event.target.value)}
              maxLength={24}
              className="mt-2 h-11 w-full rounded-md border border-arka-border bg-slate-950/80 px-3 text-white outline-none focus:border-arka-accent"
              autoFocus
            />
          </label>
          <label className="block text-sm font-bold text-arka-text">
            Giocatore 2
            <input
              value={nomeGiocatore2}
              onChange={(event) => setNomeGiocatore2(event.target.value)}
              maxLength={24}
              className="mt-2 h-11 w-full rounded-md border border-arka-border bg-slate-950/80 px-3 text-white outline-none focus:border-arka-accent"
            />
          </label>
          <button type="submit" className="arka-button w-full">
            Continua
          </button>
        </form>
      ) : (
        <>
      <p className="arka-readable-text mb-4 text-center text-sm text-arka-text-muted sm:mb-8 sm:text-lg">
        {tuttiHannoStarter
          ? 'Tutti hanno scelto! Si parte!'
          : `${nomeGiocatoreAttivo}, scegli il tuo Starter.`}
      </p>

      <div className="grid w-full max-w-[45rem] grid-cols-3 gap-2 sm:gap-6">
        {STARTER_IDS.map((id) => {
          const specie = getPokemon(id)
          if (!specie) return null
          const disponibile = !tuttiHannoStarter && !starterScelti.includes(id)

          return (
            <motion.button
              key={id}
              whileHover={disponibile ? { scale: 1.05, y: -10 } : {}}
              whileTap={disponibile ? { scale: 0.95 } : {}}
              disabled={!disponibile}
              onClick={() => scegliStarter(id)}
              className={`arka-panel flex min-w-0 w-full flex-col items-center gap-2 p-2 sm:gap-3 sm:p-6
                ${disponibile ? 'cursor-pointer hover:border-arka-accent' : 'opacity-40 cursor-not-allowed'}
              `}
            >
              <div
                className="flex h-20 w-20 max-w-full items-center justify-center overflow-hidden rounded-full text-5xl sm:h-32 sm:w-32"
                style={{ backgroundColor: `var(--tw-color-tipo-${specie.tipo.toLowerCase()})` }}
              >
                <img
                  src={assetUrl(`/sprites/front_sprites/${specie.id}.png`)}
                  alt={specie.nome}
                  className="w-full h-full object-contain"
                  style={{ imageRendering: 'pixelated' }}
                  onError={(e) => {
                    ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
              <h3 className="w-full break-words text-center text-base font-bold sm:text-2xl">{specie.nome}</h3>
              <span className="text-xs text-arka-text-muted sm:text-sm">{specie.tipo}</span>
            </motion.button>
          )
        })}
      </div>
        </>
      )}
      </div>
    </div>
  )
}
