import { GameButton } from '@/components/ui/GameButton'
import { ArkaCardButton } from '@/ui-system/primitives'
import { GameArt } from '@/ui-system/GameArt'
import { useSceneNavigation } from '@/components/transitions/SceneNavigationContext'
import { AdminLayoutItem } from '@/admin/AdminLayoutItem'
import { getBackground } from '@data/backgrounds'
import { getAllenatoriInLuogo, getPokemon } from '@data/index'
import { useAdminStore } from '@store/adminStore'
import { useGameStore } from '@store/gameStore'
import type { AdminLayoutRect, AdminLuogoLayoutKey } from '@/theme/adminThemeTypes'
import type { AllenatoreDef } from '@/types'
import { getLocalMap } from '@/data/localMaps'
import { LocalMapScene } from './LocalMapScene'
import { isTeamWithinLevelCap, teamCapMessage } from '@/engine/teamLevelCap'

const RICOMPENSA: Record<AllenatoreDef['tipo'], number> = {
  NPC: 200,
  Capopalestra: 1000,
  Superquattro: 0,
  Campione: 0,
  PVP: 0,
}

/**
 * Scena città: allenatori, Infermeria Arka e ritorno alla mappa.
 * Il layout admin è condiviso da tutte le città.
 */
export function CittaScene() {
  const scenaCorrente = useSceneNavigation()
  const giocatoreAttivo = useGameStore((s) => s.giocatoreAttivo)
  const giocatore = useGameStore((s) =>
    giocatoreAttivo === 1 ? s.giocatore1 : s.giocatore2
  )
  const vaiAScena = useGameStore((s) => s.vaiAScena)
  const iniziaBattagliaNPC = useGameStore((s) => s.iniziaBattagliaNPC)
  const curaSquadra = useGameStore((s) => s.curaSquadra)
  const consumaInterazione = useGameStore((s) => s.consumaInterazioneMappaLocale)
  const turno = useGameStore((s) => s.turnoOverworld)
  const fallbackActivity = useGameStore((s) => s.fallbackLocationActivity)
  const layoutEditing = useAdminStore((s) => s.layoutEditing)
  const luogoLayout = useAdminStore((s) => s.theme.layouts.luogo)
  const updateSceneLayout = useAdminStore((s) => s.updateSceneLayout)

  const luogo = (scenaCorrente.payload?.luogo as string) || 'Venezia'
  const localMap = getLocalMap(luogo)
  const interazioneDisponibile = localMap
    ? turno.giocatoreAttivo === giocatoreAttivo && turno.azioniRimaste > 0
    : fallbackActivity?.playerId === giocatoreAttivo && fallbackActivity.location === luogo
  const haPokemonVivi = giocatore.squadra.some((pokemon) => pokemon.hp > 0)
  const tutti = getAllenatoriInLuogo(luogo).filter((a) => a.tipo !== 'PVP')
  const allenatoriOrdinati = [...tutti].sort((a, b) => {
    if (a.tipo === b.tipo) return a.id - b.id
    return a.tipo === 'NPC' ? -1 : 1
  })

  const sfida = (allenatoreId: number) => {
    if (layoutEditing || !interazioneDisponibile || !haPokemonVivi || giocatore.allenatoriSconfitti.has(allenatoreId)) return
    if (!isTeamWithinLevelCap(giocatore.squadra)) { useGameStore.getState().aggiornaStato({ teamRuleMessage: teamCapMessage(giocatore.squadra) }); return }
    useGameStore.getState().eseguiTransazione(() => {
      if (!consumaInterazione(giocatoreAttivo, luogo)) return
      const ok = iniziaBattagliaNPC(allenatoreId, luogo)
      if (ok) vaiAScena('battaglia')
    })
  }

  const bg = getBackground(luogo)
  const updateLuogoLayout = (key: AdminLuogoLayoutKey, rect: AdminLayoutRect) =>
    updateSceneLayout({ scene: 'luogo', key, rect })

  // Audit fase 2: schede comuni del design system con icone dipinte (niente più emoji né card vuote giganti).
  const activities = (
    <div className="grid w-full grid-cols-2 content-start gap-3 overflow-y-auto p-1 lg:grid-cols-3">
          {!haPokemonVivi && (
            <p role="status" className="arka-ds-panel col-span-full text-center text-amber-200" data-density="compact">
              La squadra è esausta. Curala all’Infermeria Arka per tornare a combattere.
            </p>
          )}
          <ArkaCardButton
            disabled={layoutEditing || !interazioneDisponibile}
            onClick={() => {
              useGameStore.getState().eseguiTransazione(() => {
                if (!consumaInterazione(giocatoreAttivo, luogo)) return
                curaSquadra(giocatoreAttivo)
              })
            }}
            icon={<GameArt id="node-heal" />}
            title="Infermeria Arka"
            meta="Cura tutta la squadra"
          />

          {allenatoriOrdinati.map((a) => {
            const sconfitto = giocatore.allenatoriSconfitti.has(a.id)
            const primoPkmn = getPokemon(a.squadra[0]?.pokemonId)
            const isCapo = a.tipo === 'Capopalestra'
            const ricompensa = RICOMPENSA[a.tipo]
            return (
              <ArkaCardButton
                key={a.id}
                disabled={layoutEditing || !interazioneDisponibile || sconfitto || !haPokemonVivi}
                onClick={() => sfida(a.id)}
                accent={isCapo && !sconfitto ? 'gold' : undefined}
                icon={<GameArt id={sconfitto ? 'icon-captured' : isCapo ? 'node-gym' : 'node-trainer'} />}
                title={a.nome}
                meta={sconfitto ? 'Già sconfitto' : `${isCapo ? 'Capopalestra · ' : ''}${primoPkmn ? `Squadra: ${a.squadra.length} · Lv. ${a.squadra[0].livello}` : 'Allenatore'}`}
                badge={sconfitto ? undefined : `+${ricompensa} ₳`}
              />
            )
          })}

          {allenatoriOrdinati.length === 0 && (
            <p className="arka-ds-note col-span-full text-center">Nessun allenatore in questa città.</p>
          )}
        </div>
  )

  if (localMap) return <LocalMapScene key={luogo} map={localMap} activities={activities} />

  return (
    <div
      data-citta-layout-root
      className="relative h-full w-full overflow-hidden bg-gradient-to-b from-rose-900 via-rose-700 to-amber-700 bg-cover bg-center"
      style={bg ? { backgroundImage: `url(${bg})` } : undefined}
    >
      <AdminLayoutItem
        rootSelector="[data-citta-layout-root]"
        label="Indietro"
        rect={luogoLayout.backButton}
        editing={layoutEditing}
        onChange={(rect) => updateLuogoLayout('backButton', rect)}
      >
        <GameButton
          className="arka-layout-content h-full w-full px-3 py-2 text-sm"
          onClick={() => vaiAScena('mappa-principale')}
        >
          ← Torna alla mappa
        </GameButton>
      </AdminLayoutItem>

      <AdminLayoutItem
        rootSelector="[data-citta-layout-root]"
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
        rootSelector="[data-citta-layout-root]"
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
        rootSelector="[data-citta-layout-root]"
        label="Titolo"
        rect={luogoLayout.title}
        editing={layoutEditing}
        onChange={(rect) => updateLuogoLayout('title', rect)}
      >
        <h2 className="arka-layout-content arka-readable-title flex h-full w-full items-center justify-center text-center text-4xl font-bold text-white">
          {luogo}
        </h2>
      </AdminLayoutItem>

      <AdminLayoutItem
        rootSelector="[data-citta-layout-root]"
        label="Sottotitolo"
        rect={luogoLayout.subtitle}
        editing={layoutEditing}
        onChange={(rect) => updateLuogoLayout('subtitle', rect)}
      >
        <p className="arka-layout-content arka-readable-text flex h-full w-full items-center justify-center text-center italic text-arka-text-muted">
          Sfida gli allenatori o cura la tua squadra all’Infermeria Arka
        </p>
      </AdminLayoutItem>

      <AdminLayoutItem
        rootSelector="[data-citta-layout-root]"
        label="Attività"
        rect={luogoLayout.contentGrid}
        editing={layoutEditing}
        onChange={(rect) => updateLuogoLayout('contentGrid', rect)}
        zIndex={10}
      >
        {activities}
      </AdminLayoutItem>
    </div>
  )
}
