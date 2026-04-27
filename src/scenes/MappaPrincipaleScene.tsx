import { useGameStore } from '@store/gameStore'
import { motion } from 'framer-motion'

/**
 * Mappa principale.
 *
 * Architettura: ogni punto di interesse è un pulsante posizionato
 * in coordinate percentuali sopra l'immagine di sfondo. Per spostare
 * un punto basta modificare `top` e `left` qui.
 *
 * Per sostituire l'immagine di sfondo: metti il file in
 * /public/maps/mappa-principale.jpg e cambia il path qui sotto.
 */
interface PuntoMappa {
  id: string
  nome: string
  tipo: 'citta' | 'percorso' | 'transito'
  /** posizione percentuale (0-100) sull'immagine di sfondo */
  x: number
  y: number
  scenaTarget: 'percorso' | 'citta'
}

// Punti di esempio – verranno popolati dalla tua mappa reale.
// Quando ti deciderai per le coordinate finali, sposta in mappe.json
const PUNTI: PuntoMappa[] = [
  { id: 'venezia', nome: 'Venezia', tipo: 'citta', x: 50, y: 30, scenaTarget: 'citta' },
  { id: 'percorso_1', nome: 'Percorso 1', tipo: 'percorso', x: 35, y: 45, scenaTarget: 'percorso' },
  { id: 'piacenza', nome: 'Piacenza', tipo: 'citta', x: 25, y: 60, scenaTarget: 'citta' },
]

export function MappaPrincipaleScene() {
  const vaiAScena = useGameStore((s) => s.vaiAScena)
  const giocatoreAttivo = useGameStore((s) => s.giocatoreAttivo)

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-cyan-700 via-blue-800 to-slate-900">
      {/* Background placeholder - sostituisci con /public/maps/mappa-principale.jpg */}
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_40%,_rgba(255,255,255,0.4),_transparent_50%)]" />

      {/* HUD top: chi sta giocando */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20">
        <div className="arka-panel px-4 py-2">
          <span className="text-arka-text-muted text-sm">Turno di:</span>
          <span className="text-arka-accent font-bold ml-2">Giocatore {giocatoreAttivo}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => vaiAScena('squadra')}
            className="arka-button-secondary text-sm py-2 px-4"
          >
            Squadra
          </button>
          <button
            onClick={() => vaiAScena('deposito')}
            className="arka-button-secondary text-sm py-2 px-4"
          >
            Deposito
          </button>
          <button
            onClick={() => vaiAScena('battaglia')}
            className="arka-button text-sm py-2 px-4"
          >
            Test battaglia
          </button>
        </div>
      </div>

      {/* Punti di interesse */}
      {PUNTI.map((punto) => (
        <motion.button
          key={punto.id}
          className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
          style={{ left: `${punto.x}%`, top: `${punto.y}%` }}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => vaiAScena(punto.scenaTarget, { luogo: punto.id })}
        >
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-6 h-6 rounded-full border-4 border-white shadow-lg
                ${punto.tipo === 'citta' ? 'bg-pink-500' : punto.tipo === 'percorso' ? 'bg-blue-500' : 'bg-orange-500'}
              `}
            />
            <span className="text-white text-xs font-bold drop-shadow-lg">{punto.nome}</span>
          </div>
        </motion.button>
      ))}

      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-arka-text-muted text-sm">
        Mappa Arkamon · clicca un punto per esplorarlo
      </p>
    </div>
  )
}
