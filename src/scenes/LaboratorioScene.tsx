import { useGameStore, creaIstanza } from '@store/gameStore'
import { getPokemon } from '@data/index'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { LABORATORY_BG } from '@data/backgrounds'
import { assetUrl } from '@/utils/assetUrl'

/**
 * Scena del Laboratorio: scelta dello starter.
 *
 * Replica la prima slide del gioco VBA. I due giocatori scelgono
 * a turno il proprio starter tra ID 1, 5, 9 (le prime forme delle
 * tre famiglie evolutive). Il terzo non scelto andrà al Rivale.
 */
const STARTER_IDS = [1, 5, 9]

export function LaboratorioScene() {
  const vaiAScena = useGameStore((s) => s.vaiAScena)
  const aggiungiPokemon = useGameStore((s) => s.aggiungiPokemon)
  const cambiaGiocatoreAttivo = useGameStore((s) => s.cambiaGiocatoreAttivo)
  const impostaNomeGiocatore = useGameStore((s) => s.impostaNomeGiocatore)
  const assegnaRivaleStarter = useGameStore((s) => s.assegnaRivaleStarter)
  const giocatoreAttivo = useGameStore((s) => s.giocatoreAttivo)
  const giocatore1 = useGameStore((s) => s.giocatore1)
  const giocatore2 = useGameStore((s) => s.giocatore2)
  const g1HaStarter = useGameStore((s) => s.giocatore1.squadra.length > 0)
  const g2HaStarter = useGameStore((s) => s.giocatore2.squadra.length > 0)
  const [starterDisponibili, setStarterDisponibili] = useState(STARTER_IDS)
  const [nomiConfermati, setNomiConfermati] = useState(g1HaStarter || g2HaStarter)
  const [nomeGiocatore1, setNomeGiocatore1] = useState(giocatore1.nome)
  const [nomeGiocatore2, setNomeGiocatore2] = useState(giocatore2.nome)

  const tuttiHannoStarter = g1HaStarter && g2HaStarter
  const nomeGiocatoreAttivo = giocatoreAttivo === 1 ? giocatore1.nome : giocatore2.nome

  const confermaNomi = () => {
    impostaNomeGiocatore(1, nomeGiocatore1)
    impostaNomeGiocatore(2, nomeGiocatore2)
    setNomiConfermati(true)
  }

  const scegliStarter = (specieId: number) => {
    const istanza = creaIstanza(specieId, 5)
    if (!istanza) return
    aggiungiPokemon(giocatoreAttivo, istanza)
    const rimanenti = starterDisponibili.filter((id) => id !== specieId)
    setStarterDisponibili(rimanenti)
    if (g1HaStarter && !g2HaStarter) {
      // Era il turno del 2: lo starter rimasto va al Rivale.
      // Porting di: AssegnaRivaleEVaiAllaMappa da old_files/Mod_Game_Events.txt
      if (rimanenti.length === 1) assegnaRivaleStarter(rimanenti[0])
      setTimeout(() => vaiAScena('mappa-principale'), 800)
    } else {
      cambiaGiocatoreAttivo()
    }
  }

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-800 to-slate-950 p-8 bg-cover bg-center"
      style={{ backgroundImage: `url(${LABORATORY_BG})` }}
    >
      <h2 className="arka-readable-title text-4xl font-bold text-arka-accent mb-2">
        Laboratorio del Professore
      </h2>
      {!nomiConfermati ? (
        <form
          className="arka-panel mt-5 w-[min(34rem,92vw)] space-y-4 p-6"
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
      <p className="arka-readable-text text-arka-text-muted mb-8 text-lg">
        {tuttiHannoStarter
          ? 'Tutti hanno scelto! Si parte!'
          : `${nomeGiocatoreAttivo}, scegli il tuo Starter.`}
      </p>

      <div className="flex gap-6">
        {STARTER_IDS.map((id) => {
          const specie = getPokemon(id)
          if (!specie) return null
          const disponibile = starterDisponibili.includes(id)

          return (
            <motion.button
              key={id}
              whileHover={disponibile ? { scale: 1.05, y: -10 } : {}}
              whileTap={disponibile ? { scale: 0.95 } : {}}
              disabled={!disponibile}
              onClick={() => scegliStarter(id)}
              className={`arka-panel p-6 w-56 flex flex-col items-center gap-3
                ${disponibile ? 'cursor-pointer hover:border-arka-accent' : 'opacity-40 cursor-not-allowed'}
              `}
            >
              <div
                className="w-32 h-32 rounded-full flex items-center justify-center text-5xl overflow-hidden"
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
              <h3 className="text-2xl font-bold">{specie.nome}</h3>
              <span className="text-sm text-arka-text-muted">{specie.tipo}</span>
            </motion.button>
          )
        })}
      </div>
        </>
      )}
    </div>
  )
}
