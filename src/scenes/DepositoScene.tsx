import { useGameStore } from '@store/gameStore'
import { useAdminStore } from '@store/adminStore'
import { AdminLayoutItem } from '@/admin/AdminLayoutItem'
import { getPokemon } from '@data/index'
import { calcolaHPMax } from '@engine/battleEngine'
import {
  BOX_COUNT,
  SLOT_PER_BOX,
  SQUADRA_MAX,
  chiaveDeposito,
  type SlotRef,
} from '@engine/deposito'
import { motion } from 'framer-motion'
import { useState } from 'react'
import type { PokemonIstanza } from '@/types'
import type { AdminDepositLayoutKey, AdminLayoutRect } from '@/theme/adminThemeTypes'
import { DEPOSIT_BG } from '@data/backgrounds'
import { assetUrl } from '@/utils/assetUrl'

/**
 * Scena Deposito: gestione squadra ↔ deposito.
 *
 * Porting di Mod_Deposito.bas (ApriInterfacciaDeposito + GestisciClickSlot
 * + EseguiScambioDati + PopolaSlot).
 *
 * UI a due colonne:
 * - Sinistra: griglia 5×7 = 35 slot del box corrente, navigabile con ‹ ›
 * - Destra: 6 slot della squadra
 *
 * Interazione: click su slot per selezionarlo; click su un secondo slot
 * per swap/move. Click di nuovo sullo stesso slot per deselezionare.
 */
export function DepositoScene() {
  const scenaIndietro = useGameStore((s) => s.scenaIndietro)
  const giocatoreAttivo = useGameStore((s) => s.giocatoreAttivo)
  const giocatore = useGameStore((s) =>
    giocatoreAttivo === 1 ? s.giocatore1 : s.giocatore2
  )
  const scambiaSlot = useGameStore((s) => s.scambiaSlot)
  const layoutEditing = useAdminStore((s) => s.layoutEditing)
  const depositLayout = useAdminStore((s) => s.theme.layouts.deposit)
  const updateSceneLayout = useAdminStore((s) => s.updateSceneLayout)

  const [boxCorrente, setBoxCorrente] = useState(1)
  const [selezionato, setSelezionato] = useState<SlotRef | null>(null)
  const updateDepositLayout = (key: AdminDepositLayoutKey, rect: AdminLayoutRect) =>
    updateSceneLayout({ scene: 'deposit', key, rect })

  const refsUguali = (a: SlotRef | null, b: SlotRef): boolean => {
    if (!a) return false
    if (a.tipo !== b.tipo) return false
    if (a.tipo === 'squadra' && b.tipo === 'squadra') return a.indice === b.indice
    if (a.tipo === 'deposito' && b.tipo === 'deposito') return a.chiave === b.chiave
    return false
  }

  const click = (ref: SlotRef, occupato: boolean) => {
    if (!selezionato) {
      // Si può selezionare solo se occupato
      if (occupato) setSelezionato(ref)
      return
    }
    if (refsUguali(selezionato, ref)) {
      setSelezionato(null)
      return
    }
    scambiaSlot(giocatoreAttivo, selezionato, ref)
    setSelezionato(null)
  }

  const isSelezionato = (ref: SlotRef) => refsUguali(selezionato, ref)

  return (
    <div
      data-admin-layout-root
      className="relative w-full h-full bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 bg-cover bg-center"
      style={{ backgroundImage: `url(${DEPOSIT_BG})` }}
    >
      {/* HUD top */}
      <AdminLayoutItem
        rootSelector="[data-admin-layout-root]"
        label="HUD deposito"
        rect={depositLayout.hud}
        editing={layoutEditing}
        onChange={(rect) => updateDepositLayout('hud', rect)}
        zIndex={30}
      >
      <div className="flex h-full w-full justify-between items-center">
        <button
          className="arka-button-secondary text-sm py-2 px-4"
          onClick={() => scenaIndietro()}
        >
          <span className="arka-layout-content">← Torna indietro</span>
        </button>
        <h2 className="arka-layout-content arka-readable-title text-2xl font-bold text-arka-accent">Deposito</h2>
        <div className="arka-panel px-4 py-2">
          <span className="arka-layout-content text-arka-text-muted text-xs">Giocatore:</span>
          <span className="arka-layout-content text-arka-accent font-bold ml-2">{giocatoreAttivo}</span>
        </div>
      </div>
      </AdminLayoutItem>

        {/* Box deposito */}
      <AdminLayoutItem
        rootSelector="[data-admin-layout-root]"
        label="Box deposito"
        rect={depositLayout.boxGrid}
        editing={layoutEditing}
        onChange={(rect) => updateDepositLayout('boxGrid', rect)}
        zIndex={20}
      >
        <div className="arka-panel h-full w-full overflow-hidden p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              disabled={boxCorrente <= 1}
              onClick={() => setBoxCorrente((b) => Math.max(1, b - 1))}
              className="arka-button-secondary text-sm py-1 px-3 disabled:opacity-30"
            >
              <span className="arka-layout-content">‹</span>
            </button>
            <h3 className="arka-layout-content text-lg font-bold">
              Box {boxCorrente} <span className="text-arka-text-muted text-sm">/ {BOX_COUNT}</span>
            </h3>
            <button
              disabled={boxCorrente >= BOX_COUNT}
              onClick={() => setBoxCorrente((b) => Math.min(BOX_COUNT, b + 1))}
              className="arka-button-secondary text-sm py-1 px-3 disabled:opacity-30"
            >
              <span className="arka-layout-content">›</span>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: SLOT_PER_BOX }, (_, i) => {
              const slotN = i + 1
              const chiave = chiaveDeposito(boxCorrente, slotN)
              const istanza = giocatore.deposito[chiave]
              const ref: SlotRef = { tipo: 'deposito', chiave }
              return (
                <SlotCell
                  key={chiave}
                  istanza={istanza}
                  selezionato={isSelezionato(ref)}
                  onClick={() => click(ref, !!istanza)}
                  layoutTextPrefix={`box-slot-${slotN}`}
                />
              )
            })}
          </div>
        </div>
      </AdminLayoutItem>

        {/* Squadra */}
      <AdminLayoutItem
        rootSelector="[data-admin-layout-root]"
        label="Squadra"
        rect={depositLayout.teamPanel}
        editing={layoutEditing}
        onChange={(rect) => updateDepositLayout('teamPanel', rect)}
        zIndex={20}
      >
        <div className="arka-panel h-full w-full p-4 flex flex-col">
          <h3 className="arka-layout-content text-lg font-bold mb-3 text-center">
            Squadra <span className="text-arka-text-muted text-sm">{giocatore.squadra.length}/{SQUADRA_MAX}</span>
          </h3>
          <div className="flex flex-col gap-2 flex-1">
            {Array.from({ length: SQUADRA_MAX }, (_, i) => {
              const istanza = giocatore.squadra[i]
              const ref: SlotRef = { tipo: 'squadra', indice: i }
              return (
                <SlotCell
                  key={i}
                  istanza={istanza}
                  selezionato={isSelezionato(ref)}
                  onClick={() => click(ref, !!istanza)}
                  largo
                  layoutTextPrefix={`team-slot-${i}`}
                />
              )
            })}
          </div>
        </div>
      </AdminLayoutItem>

      {/* Info bar in basso */}
      <AdminLayoutItem
        rootSelector="[data-admin-layout-root]"
        label="Info"
        rect={depositLayout.infoBar}
        editing={layoutEditing}
        onChange={(rect) => updateDepositLayout('infoBar', rect)}
        zIndex={30}
      >
      <div className="arka-layout-content arka-panel flex h-full w-full items-center justify-center px-4 py-2 text-sm text-center">
        {selezionato
          ? '✋ Slot selezionato — clicca un altro slot per scambiare/spostare, o di nuovo lo stesso per annullare'
          : '🖱️ Clicca uno slot occupato per selezionarlo'}
      </div>
      </AdminLayoutItem>
    </div>
  )
}

function SlotCell({
  istanza,
  selezionato,
  onClick,
  largo = false,
  layoutTextPrefix,
}: {
  istanza?: PokemonIstanza
  selezionato: boolean
  onClick: () => void
  largo?: boolean
  layoutTextPrefix: string
}) {
  const specie = istanza ? getPokemon(istanza.specieId) : null
  const hpMax = istanza ? calcolaHPMax(istanza) : 0

  const baseClass = largo
    ? 'h-14 px-3 flex items-center gap-2'
    : 'aspect-square flex flex-col items-center justify-center'

  const stateClass = selezionato
    ? 'border-yellow-300 bg-yellow-300/10 ring-2 ring-yellow-300/50'
    : istanza
    ? 'border-arka-border hover:border-arka-accent cursor-pointer'
    : 'border-dashed border-slate-700 hover:border-slate-500'

  return (
    <motion.button
      whileHover={{ scale: largo ? 1.02 : 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`border-2 rounded-md transition ${baseClass} ${stateClass}`}
    >
      {istanza && specie ? (
        largo ? (
          <>
            <SmallSprite specieId={specie.id} tipo={specie.tipo} className="w-10 h-10" />
            <div className="flex-1 text-left">
              <div
                data-admin-layout-text-key={`${layoutTextPrefix}-name`}
                className="arka-layout-content font-bold text-sm leading-tight"
              >
                {istanza.nome}
              </div>
              <div
                data-admin-layout-text-key={`${layoutTextPrefix}-details`}
                className="arka-layout-content text-xs text-arka-text-muted"
              >
                lv {istanza.livello} · {istanza.hp}/{hpMax} HP
              </div>
            </div>
          </>
        ) : (
          <>
            <SmallSprite specieId={specie.id} tipo={specie.tipo} className="w-10 h-10" />
            <span
              data-admin-layout-text-key={`${layoutTextPrefix}-level`}
              className="arka-layout-content text-[9px] text-arka-text-muted leading-tight mt-0.5"
            >
              lv{istanza.livello}
            </span>
          </>
        )
      ) : (
        <span
          data-admin-layout-text-key={`${layoutTextPrefix}-empty`}
          className="arka-layout-content text-arka-text-muted text-xs"
        >
          ·
        </span>
      )}
    </motion.button>
  )
}

function SmallSprite({
  specieId,
  tipo,
  className = '',
}: {
  specieId: number
  tipo: string
  className?: string
}) {
  return (
    <span className={`relative inline-flex items-center justify-center ${className}`}>
      <img
        src={assetUrl(`/sprites/front_sprites/${specieId}.png`)}
        alt=""
        className="w-full h-full object-contain"
        style={{ imageRendering: 'pixelated' }}
        onError={(e) => {
          ;(e.currentTarget as HTMLImageElement).style.display = 'none'
          const sib = e.currentTarget.nextElementSibling as HTMLElement | null
          if (sib) sib.style.display = 'inline'
        }}
      />
      <span className="text-2xl leading-none" style={{ display: 'none' }}>
        {spriteFor(tipo)}
      </span>
    </span>
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
