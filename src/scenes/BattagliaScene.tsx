import { useGameStore, creaIstanza } from '@store/gameStore'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { calcolaDanno, calcolaHPMax, scegliMossaIA } from '@engine/battleEngine'
import { getPokemon, getMossa } from '@data/index'
import type { PokemonIstanza, MossaDef } from '@/types'

/**
 * Scena di battaglia (versione dimostrativa).
 *
 * Mostra il flusso: tiro dadi → calcolo danno → animazione HP bar →
 * turno avversario → log degli eventi.
 *
 * Per ora crea una battaglia demo (Vyrath vs Weedrug). In produzione
 * lo store popolerà la battaglia con i dati reali.
 */
export function BattagliaScene() {
  const vaiAScena = useGameStore((s) => s.vaiAScena)

  // Battaglia demo: due pokemon casuali
  const [pkmnA, setPkmnA] = useState<PokemonIstanza | null>(null)
  const [pkmnB, setPkmnB] = useState<PokemonIstanza | null>(null)
  const [log, setLog] = useState<string[]>([])
  const [turnoA, setTurnoA] = useState(true)
  const [shaking, setShaking] = useState<'A' | 'B' | null>(null)
  const [terminata, setTerminata] = useState(false)

  useEffect(() => {
    const a = creaIstanza(1, 5)  // Vyrath lvl 5
    const b = creaIstanza(13, 5) // Weedrug lvl 5
    setPkmnA(a)
    setPkmnB(b)
    setLog([`Appare ${b?.nome} selvatico!`])
  }, [])

  if (!pkmnA || !pkmnB) return <div className="text-white p-8">Caricamento...</div>

  const specieA = getPokemon(pkmnA.specieId)!
  const specieB = getPokemon(pkmnB.specieId)!
  const hpMaxA = calcolaHPMax(pkmnA)
  const hpMaxB = calcolaHPMax(pkmnB)

  const eseguiMossa = (numeroMossa: 0 | 1 | 2) => {
    if (terminata || !turnoA) return
    const ris = calcolaDanno(pkmnA, pkmnB, numeroMossa)
    if (!ris) return

    setShaking('B')
    const nuovoB = { ...pkmnB, hp: Math.max(0, pkmnB.hp - ris.dannoFinale) }
    setPkmnB(nuovoB)
    setLog((l) => [...l, ...ris.messaggi])

    setTimeout(() => setShaking(null), 400)

    if (nuovoB.hp <= 0) {
      setLog((l) => [...l, `Hai vinto la battaglia!`])
      setTerminata(true)
      return
    }

    // Turno avversario dopo 1.5s
    setTurnoA(false)
    setTimeout(() => turnoAvversario(nuovoB), 1500)
  }

  const turnoAvversario = (statoBcorrente: PokemonIstanza) => {
    const mossa = scegliMossaIA(statoBcorrente, pkmnA)
    const ris = calcolaDanno(statoBcorrente, pkmnA, mossa)
    if (!ris) {
      setTurnoA(true)
      return
    }
    setShaking('A')
    const nuovoA = { ...pkmnA, hp: Math.max(0, pkmnA.hp - ris.dannoFinale) }
    setPkmnA(nuovoA)
    setLog((l) => [...l, ...ris.messaggi])
    setTimeout(() => setShaking(null), 400)
    if (nuovoA.hp <= 0) {
      setLog((l) => [...l, `Hai perso la battaglia...`])
      setTerminata(true)
    } else {
      setTurnoA(true)
    }
  }

  return (
    <div className="w-full h-full relative bg-gradient-to-b from-emerald-900 via-emerald-700 to-emerald-500">
      {/* Pokémon avversario (alto a destra) */}
      <PokemonBattleSlot
        istanza={pkmnB}
        hpMax={hpMaxB}
        position="top-right"
        shaking={shaking === 'B'}
      />

      {/* Pokémon giocatore (basso a sinistra) */}
      <PokemonBattleSlot
        istanza={pkmnA}
        hpMax={hpMaxA}
        position="bottom-left"
        shaking={shaking === 'A'}
      />

      {/* Box log eventi */}
      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 arka-panel px-6 py-3 max-w-md">
        <p className="text-white text-sm">{log[log.length - 1]}</p>
      </div>

      {/* Pulsanti mosse */}
      <div className="absolute bottom-4 right-4 grid grid-cols-3 gap-2 z-20">
        {specieA.mosse.map((mossaId, i) => {
          const mossa = mossaId ? getMossa(mossaId) : null
          if (!mossa) return null
          return (
            <MoveButton
              key={i}
              mossa={mossa}
              livello={pkmnA.livello}
              disabled={!turnoA || terminata}
              onClick={() => eseguiMossa(i as 0 | 1 | 2)}
            />
          )
        })}
      </div>

      {/* Pulsante exit */}
      {terminata && (
        <button
          className="arka-button absolute bottom-4 left-4 z-20"
          onClick={() => vaiAScena('mappa-principale')}
        >
          Torna alla mappa
        </button>
      )}

      {/* Indicatore turno */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 arka-panel px-4 py-1">
        <span className="text-sm">{terminata ? 'Battaglia finita' : turnoA ? 'Il tuo turno' : "Turno avversario..."}</span>
      </div>
    </div>
  )
}

// =============================================================
// SOTTOCOMPONENTI (qui per brevità - in produzione in /components)
// =============================================================

function PokemonBattleSlot({
  istanza,
  hpMax,
  position,
  shaking,
}: {
  istanza: PokemonIstanza
  hpMax: number
  position: 'top-right' | 'bottom-left'
  shaking: boolean
}) {
  const isPlayer = position === 'bottom-left'
  const posClass = isPlayer
    ? 'bottom-32 left-12 flex-row'
    : 'top-12 right-12 flex-row-reverse'

  return (
    <div className={`absolute ${posClass} flex items-center gap-4 z-10`}>
      <motion.div
        animate={shaking ? { x: [0, -8, 8, -8, 8, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="w-32 h-32 rounded-full bg-arka-surface border-4 border-white shadow-2xl flex items-center justify-center"
      >
        <span className="text-5xl">{isPlayer ? '🐺' : '🦈'}</span>
      </motion.div>

      <HpBar nome={istanza.nome} livello={istanza.livello} hp={istanza.hp} hpMax={hpMax} />
    </div>
  )
}

function HpBar({ nome, livello, hp, hpMax }: { nome: string; livello: number; hp: number; hpMax: number }) {
  const pct = (hp / hpMax) * 100
  const colore = pct > 60 ? 'var(--hp-high)' : pct > 25 ? 'var(--hp-mid)' : 'var(--hp-low)'

  return (
    <div className="arka-panel min-w-[200px] px-3 py-2">
      <div className="flex justify-between items-baseline mb-1">
        <span className="font-bold text-sm">{nome}</span>
        <span className="text-xs text-arka-text-muted">LV. {livello}</span>
      </div>
      <div className="h-3 bg-slate-900 rounded-full overflow-hidden">
        <motion.div
          className="h-full"
          style={{ backgroundColor: colore }}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <div className="text-xs text-right mt-1 text-arka-text-muted">
        {hp}/{hpMax}
      </div>
    </div>
  )
}

function MoveButton({
  mossa,
  livello,
  disabled,
  onClick,
}: {
  mossa: MossaDef
  livello: number
  disabled: boolean
  onClick: () => void
}) {
  const dadi = mossa.dadiPerLivello[String(livello)] ?? 1
  const incremento = mossa.incrementoPerLivello[String(livello)] ?? 0
  const coloreTipo = `var(--tw-color-tipo-${mossa.tipo.toLowerCase()})`

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      disabled={disabled}
      onClick={onClick}
      className="arka-panel px-3 py-2 text-left disabled:opacity-50"
      style={{ borderTop: `3px solid ${coloreTipo}` }}
    >
      <div className="font-bold text-sm">{mossa.nome}</div>
      <div className="text-xs text-arka-text-muted flex items-center gap-2 mt-1">
        <span>🎲 {dadi}d6 +{incremento}</span>
        <span className="text-xs">{mossa.tipo}</span>
      </div>
    </motion.button>
  )
}
