import { useEffect, useRef, useState } from 'react'
import { playSfx } from '@/utils/soundManager'
import { motion } from 'framer-motion'
import { useGameMotionPreferences } from '@/settings/gamePreferences'
import { BattleDie } from './DiceRollOverlay'
import { makeDialogBackgroundInert } from './modalFocus'
import { assetUrl } from '@/utils/assetUrl'
import './battleCoin.css'

/** Faccia della moneta: l'Arkamon del lato che vince il lancio. */
export interface CoinFace { nome: string; specieId: number }

export function BattleOpeningOverlay({ kind, value, title, result, onContinue, coinFaces }: {
  kind: 'coin' | 'die'; value: number; title: string; result: string; onContinue: () => void
  /** Testa = lato A, Croce = lato B. */
  coinFaces?: { heads: CoinFace; tails: CoinFace }
}) {
  const { reducedMotion: reduced, speed } = useGameMotionPreferences()
  const [ready, setReady] = useState(Boolean(reduced && kind === 'coin'))
  const dialogRef = useRef<HTMLDivElement>(null)
  const continueRef = useRef<HTMLButtonElement>(null)
  const releaseDialogRef = useRef<(() => void) | null>(null)
  const continuedRef = useRef(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const restoreBackground = makeDialogBackgroundInert(dialog)
    const focusDialog = () => {
      const button = continueRef.current
      const target = button && !button.disabled ? button : dialog
      target.focus({ preventScroll: true })
    }
    const trapFocus = (event: FocusEvent) => {
      if (event.target instanceof Node && !dialog.contains(event.target)) focusDialog()
    }
    const trapTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      event.preventDefault()
      focusDialog()
    }
    dialog.focus({ preventScroll: true })
    document.addEventListener('focusin', trapFocus)
    document.addEventListener('keydown', trapTab, true)
    let released = false
    const releaseDialog = () => {
      if (released) return
      released = true
      document.removeEventListener('focusin', trapFocus)
      document.removeEventListener('keydown', trapTab, true)
      restoreBackground()
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true })
    }
    releaseDialogRef.current = releaseDialog
    return () => {
      releaseDialog()
      if (releaseDialogRef.current === releaseDialog) releaseDialogRef.current = null
    }
  }, [])

  useEffect(() => {
    if (ready) continueRef.current?.focus({ preventScroll: true })
  }, [ready])

  // La moneta gira e ricade al 78% dell'animazione (vedi `times` qui sotto).
  useEffect(() => {
    if (kind === 'die') return reduced ? undefined : playSfx('dice.roll')
    if (reduced) { playSfx('battle.coin-land'); return }
    const stopSpin = playSfx('battle.coin-spin', { rate: Math.min(1.6, Math.max(0.8, speed)) })
    const land = window.setTimeout(() => playSfx('battle.coin-land'), (2400 / speed) * 0.78)
    return () => { stopSpin(); window.clearTimeout(land) }
    // Una volta per apertura.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // Il dado di stato suona quando si ferma, cioè quando il risultato diventa leggibile.
  useEffect(() => { if (ready && kind === 'die') playSfx('dice.land') }, [ready, kind])

  const continueOnce = () => {
    if (!ready || continuedRef.current) return
    continuedRef.current = true
    // Release this dialog before its continuation can mount the next one.
    releaseDialogRef.current?.()
    onContinue()
  }

  // Fase di rifinitura: moneta d'oro con l'Arkamon di ciascun lato sulle facce. Gira sull'asse
  // orizzontale, sale in un arco, ricade con un rimbalzo e mostra la faccia del lato che inizia.
  const spins = 6
  const finalTurn = spins * 360 + (value === 0 ? 0 : 180)
  return <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className="battle-opening-overlay absolute inset-0 z-[900] flex items-center justify-center p-3 outline-none" onKeyDown={(e) => e.stopPropagation()}>
    <div className="battle-opening-panel flex max-h-full w-full max-w-xl flex-col items-center gap-4 overflow-y-auto p-4 text-center sm:gap-6 sm:p-8 [&>*]:shrink-0">
      <h2 className="battle-opening-title">{title}</h2>
      {kind === 'coin' ? <div className="battle-coin-stage" data-ready={ready || undefined}>
        <motion.div className="battle-coin" initial={{ rotateX: 0, y: 40, scale: .8 }}
          animate={reduced ? { rotateX: value === 0 ? 0 : 180, y: 0, scale: 1 } : { rotateX: finalTurn, y: [40, -120, 0, -14, 0], scale: [.8, 1.15, 1, 1.03, 1] }}
          transition={{ duration: reduced ? 0 : 2.4 / speed, ease: [0.22, 0.8, 0.3, 1], times: reduced ? undefined : [0, .45, .78, .9, 1] }}
          onAnimationComplete={() => setReady(true)}>
          <span className="battle-coin-face is-heads" aria-hidden="true">
            {coinFaces ? <img src={assetUrl(`/sprites/front_sprites/${coinFaces.heads.specieId}.png`)} alt="" draggable={false} /> : null}
            <b>Testa</b>
          </span>
          <span className="battle-coin-face is-tails" aria-hidden="true">
            {coinFaces ? <img src={assetUrl(`/sprites/front_sprites/${coinFaces.tails.specieId}.png`)} alt="" draggable={false} /> : null}
            <b>Croce</b>
          </span>
        </motion.div>
        <span className="battle-coin-shadow" aria-hidden="true" />
        {coinFaces && <div className="battle-coin-legend" aria-hidden="true"><span>Testa · {coinFaces.heads.nome}</span><span>Croce · {coinFaces.tails.nome}</span></div>}
      </div> : <div className="w-32"><BattleDie value={value} forceFallback={false} onVisible={() => setReady(true)} /></div>}
      <p role="status" className="battle-opening-result min-h-8">{ready ? result : kind === 'coin' ? 'La moneta sta girando…' : 'Lancio del dado…'}</p>
      <button ref={continueRef} type="button" disabled={!ready} onClick={continueOnce} className="battle-opening-continue">Continua</button>
    </div>
  </div>
}
