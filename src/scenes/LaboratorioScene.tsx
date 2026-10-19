import { RpgCommand, RpgFrame } from '@/components/rpg'
import { SpatialNavigation } from '@/components/rpg/SpatialNavigation'
import { SpeciesPortrait } from '@/player-ui/kit'
import { useGameMotionPreferences } from '@/settings/gamePreferences'
import './rpgScenes.css'
import { useGameStore, STARTER_IDS } from '@store/gameStore'
import { getPokemon } from '@data/index'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { LABORATORY_BG } from '@data/backgrounds'
import { assetUrl } from '@/utils/assetUrl'
import { getOwnedPokemon, hasOwnedPokemon } from '@/engine/pokemonOwnership'

/**
 * Scena del Laboratorio: scelta dello starter.
 *
 * Replica la prima slide del gioco VBA. I due giocatori scelgono
 * a turno il proprio starter tra ID 1, 5, 9 (le prime forme delle
 * tre famiglie evolutive). Il terzo non scelto andrà al Rivale.
 */
export function LaboratorioScene() {
  const { reducedMotion } = useGameMotionPreferences()
  const vaiAScena = useGameStore((s) => s.vaiAScena)
  const scegliStarter = useGameStore((s) => s.scegliStarter)
  const impostaNomeGiocatore = useGameStore((s) => s.impostaNomeGiocatore)
  const giocatore1 = useGameStore((s) => s.giocatore1)
  const giocatore2 = useGameStore((s) => s.giocatore2)
  const g1HaStarter = useGameStore((s) => hasOwnedPokemon(s.giocatore1))
  const g2HaStarter = useGameStore((s) => hasOwnedPokemon(s.giocatore2))
  const [nomiConfermati, setNomiConfermati] = useState(g1HaStarter || g2HaStarter)
  const [nomeGiocatore1, setNomeGiocatore1] = useState(giocatore1.nome)
  const [nomeGiocatore2, setNomeGiocatore2] = useState(giocatore2.nome)
  const [confermaRichiesta, setConfermaRichiesta] = useState(false)

  useEffect(() => {
    if (confermaRichiesta && giocatore1.nome === (nomeGiocatore1.trim() || 'Giocatore 1')
      && giocatore2.nome === (nomeGiocatore2.trim() || 'Giocatore 2')) setNomiConfermati(true)
  }, [confermaRichiesta, giocatore1.nome, giocatore2.nome, nomeGiocatore1, nomeGiocatore2])

  const tuttiHannoStarter = g1HaStarter && g2HaStarter
  const giocatoreAttivo = g1HaStarter ? 2 : 1
  const starterScelti = [...getOwnedPokemon(giocatore1), ...getOwnedPokemon(giocatore2)].map((pokemon) => pokemon.specieId)
  const nomeGiocatoreAttivo = giocatoreAttivo === 1 ? giocatore1.nome : giocatore2.nome

  useEffect(() => {
    if (!tuttiHannoStarter) return
    const timer = window.setTimeout(() => {
      if (useGameStore.getState().scenaCorrente.scena === 'laboratorio') vaiAScena('mappa-principale')
    }, 800)
    return () => window.clearTimeout(timer)
  }, [tuttiHannoStarter, vaiAScena])

  const confermaNomi = () => {
    setConfermaRichiesta(true)
    useGameStore.getState().eseguiTransazione(() => {
      impostaNomeGiocatore(1, nomeGiocatore1)
      impostaNomeGiocatore(2, nomeGiocatore2)
    })
  }

  return (
    <div
      className="rpg-starter-scene relative w-full h-full overflow-y-auto bg-gradient-to-b from-slate-800 to-slate-950 bg-cover bg-center"
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
          className="rpg-starter-form mt-5 w-full max-w-[40rem] space-y-4 p-6"
          onSubmit={(event) => {
            event.preventDefault()
            confermaNomi()
          }}
        >
          <RpgFrame />
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
          <RpgCommand type="submit" tone="primary" className="w-full">
            Continua
          </RpgCommand>
        </form>
      ) : (
        <>
      <p className="arka-readable-text mb-4 text-center text-sm text-arka-text-muted sm:mb-8 sm:text-lg">
        {tuttiHannoStarter
          ? 'Tutti hanno scelto! Si parte!'
          : `${nomeGiocatoreAttivo}, scegli il tuo Starter.`}
      </p>

      <SpatialNavigation columns={3} selectOnFocus={false} className="rpg-starter-cards grid w-full grid-cols-3">
        {STARTER_IDS.map((id) => {
          const specie = getPokemon(id)
          if (!specie) return null
          const disponibile = !tuttiHannoStarter && !starterScelti.includes(id)

          return (
            <motion.button
              data-rpg-item key={id}
              whileHover={disponibile && !reducedMotion ? { scale: 1.05, y: -10 } : {}}
              whileTap={disponibile && !reducedMotion ? { scale: 0.95 } : {}}
              disabled={!disponibile}
              onClick={() => scegliStarter(id)}
              className={`rpg-starter-card flex min-w-0 w-full flex-col items-center gap-2 p-2 sm:gap-3 sm:p-6
                ${disponibile ? 'cursor-pointer hover:border-arka-accent' : 'opacity-40 cursor-not-allowed'}
              `}
            >
              <RpgFrame />
              <SpeciesPortrait speciesId={specie.id} large />
              <h3 className="w-full break-words text-center text-base font-bold sm:text-2xl">{specie.nome}</h3>
              <span className="text-xs text-arka-text-muted sm:text-sm">{specie.tipo}</span>
            </motion.button>
          )
        })}
      </SpatialNavigation>
        </>
      )}
      </div>
    </div>
  )
}
