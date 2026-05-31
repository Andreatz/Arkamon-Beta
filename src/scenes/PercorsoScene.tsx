import { motion } from 'framer-motion'
import { AdminLayoutItem } from '@/admin/AdminLayoutItem'
import { getBackground } from '@data/backgrounds'
import { getIncontri } from '@data/index'
import { calcolaHPMax } from '@engine/battleEngine'
import { generaIncontroDaCespuglio } from '@engine/encounters'
import { useAdminStore } from '@store/adminStore'
import { useGameStore } from '@store/gameStore'
import type { AdminLayoutRect, AdminLuogoLayoutKey } from '@/theme/adminThemeTypes'
import type { StatoBattaglia } from '@/types'

const CESPUGLI = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const

/**
 * Scena percorso: 7 cespugli A-G visitabili una volta per giocatore.
 * Il layout admin è condiviso da tutti i percorsi.
 */
export function PercorsoScene() {
  const scenaCorrente = useGameStore((s) => s.scenaCorrente)
  const giocatoreAttivo = useGameStore((s) => s.giocatoreAttivo)
  const cespuglioVisitato = useGameStore((s) => s.cespuglioVisitato)
  const segnaCespuglioVisitato = useGameStore((s) => s.segnaCespuglioVisitato)
  const iniziaBattaglia = useGameStore((s) => s.iniziaBattaglia)
  const vaiAScena = useGameStore((s) => s.vaiAScena)
  const giocatore = useGameStore((s) =>
    giocatoreAttivo === 1 ? s.giocatore1 : s.giocatore2
  )
  const layoutEditing = useAdminStore((s) => s.layoutEditing)
  const luogoLayout = useAdminStore((s) => s.theme.layouts.luogo)
  const updateSceneLayout = useAdminStore((s) => s.updateSceneLayout)

  const luogo = (scenaCorrente.payload?.luogo as string) || 'Percorso_1'

  const apriCespuglio = (cespuglio: string) => {
    if (cespuglioVisitato(giocatoreAttivo, luogo, cespuglio)) return
    const incontri = getIncontri(luogo, cespuglio)
    const selvatico = generaIncontroDaCespuglio(incontri)
    if (!selvatico) return

    const primoDellaSquadra = giocatore.squadra[0]
    if (!primoDellaSquadra) return

    segnaCespuglioVisitato(giocatoreAttivo, luogo, cespuglio)

    const battaglia: StatoBattaglia = {
      tipo: 'Selvatico',
      pokemonA: primoDellaSquadra,
      pokemonB: selvatico,
      hpMaxA: calcolaHPMax(primoDellaSquadra),
      hpMaxB: calcolaHPMax(selvatico),
      turnoCorrente: 'A',
      luogoRitorno: luogo,
      log: [`Appare ${selvatico.nome} selvatico!`],
      evoluzioneInAttesa: null,
    }
    iniziaBattaglia(battaglia)
    vaiAScena('battaglia')
  }

  const bg = getBackground(luogo)
  const updateLuogoLayout = (key: AdminLuogoLayoutKey, rect: AdminLayoutRect) =>
    updateSceneLayout({ scene: 'luogo', key, rect })

  return (
    <div
      data-percorso-layout-root
      className="relative h-full w-full overflow-hidden bg-gradient-to-b from-emerald-900 via-emerald-700 to-amber-700 bg-cover bg-center"
      style={bg ? { backgroundImage: `url(${bg})` } : undefined}
    >
      <AdminLayoutItem
        rootSelector="[data-percorso-layout-root]"
        label="Indietro"
        rect={luogoLayout.backButton}
        editing={layoutEditing}
        onChange={(rect) => updateLuogoLayout('backButton', rect)}
      >
        <button
          className="arka-layout-content arka-button-secondary h-full w-full px-3 py-2 text-sm"
          onClick={() => vaiAScena('mappa-principale')}
        >
          ← Torna alla mappa
        </button>
      </AdminLayoutItem>

      <AdminLayoutItem
        rootSelector="[data-percorso-layout-root]"
        label="Turno"
        rect={luogoLayout.turnPanel}
        editing={layoutEditing}
        onChange={(rect) => updateLuogoLayout('turnPanel', rect)}
      >
        <div className="arka-panel flex h-full w-full items-center justify-center px-3 py-2">
          <span className="arka-layout-content text-xs text-arka-text-muted">Turno di:</span>
          <span className="arka-layout-content ml-2 font-bold text-arka-accent">
            {giocatore.nome}
          </span>
        </div>
      </AdminLayoutItem>

      <AdminLayoutItem
        rootSelector="[data-percorso-layout-root]"
        label="Monete"
        rect={luogoLayout.coinsPanel}
        editing={layoutEditing}
        onChange={(rect) => updateLuogoLayout('coinsPanel', rect)}
      >
        <div className="arka-panel flex h-full w-full items-center justify-center px-3 py-2">
          <span className="arka-layout-content text-xs text-arka-text-muted">Monete:</span>
          <span className="arka-layout-content ml-2 font-bold text-yellow-300">
            ₳ {giocatore.monete}
          </span>
        </div>
      </AdminLayoutItem>

      <AdminLayoutItem
        rootSelector="[data-percorso-layout-root]"
        label="Titolo"
        rect={luogoLayout.title}
        editing={layoutEditing}
        onChange={(rect) => updateLuogoLayout('title', rect)}
      >
        <h2 className="arka-layout-content arka-readable-title flex h-full w-full items-center justify-center text-center text-3xl font-bold text-white">
          {luogo.replace('_', ' ')}
        </h2>
      </AdminLayoutItem>

      <AdminLayoutItem
        rootSelector="[data-percorso-layout-root]"
        label="Sottotitolo"
        rect={luogoLayout.subtitle}
        editing={layoutEditing}
        onChange={(rect) => updateLuogoLayout('subtitle', rect)}
      >
        <p className="arka-layout-content arka-readable-text flex h-full w-full items-center justify-center text-center italic text-arka-text-muted">
          Esplora i cespugli: ogni cespuglio è esplorabile una sola volta
        </p>
      </AdminLayoutItem>

      <AdminLayoutItem
        rootSelector="[data-percorso-layout-root]"
        label="Cespugli"
        rect={luogoLayout.contentGrid}
        editing={layoutEditing}
        onChange={(rect) => updateLuogoLayout('contentGrid', rect)}
        zIndex={10}
      >
        <div className="grid h-full w-full grid-cols-7 gap-3 overflow-hidden p-1">
          {CESPUGLI.map((c) => {
            const visited = cespuglioVisitato(giocatoreAttivo, luogo, c)
            const haIncontri = getIncontri(luogo, c).length > 0
            const disabled = visited || !haIncontri
            return (
              <motion.button
                key={c}
                whileHover={!layoutEditing && !disabled ? { scale: 1.05, y: -4 } : {}}
                whileTap={!layoutEditing && !disabled ? { scale: 0.95 } : {}}
                disabled={layoutEditing || disabled}
                onClick={() => apriCespuglio(c)}
                className={`arka-panel flex aspect-square flex-col items-center justify-center
                  ${disabled ? 'cursor-not-allowed opacity-30' : 'cursor-pointer hover:border-arka-accent'}
                `}
              >
                <span className="arka-layout-content mb-2 text-5xl">{visited ? '🌾' : '🌳'}</span>
                <span className="arka-layout-content text-lg font-bold">{c}</span>
                <span className="arka-layout-content text-xs text-arka-text-muted">
                  {visited ? 'esplorato' : haIncontri ? 'cespuglio' : '—'}
                </span>
              </motion.button>
            )
          })}
        </div>
      </AdminLayoutItem>
    </div>
  )
}
