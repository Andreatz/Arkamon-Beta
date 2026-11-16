import type { BattleChronicle } from '@/types'
import { battleOutcomeSummary } from './battleOutcomeSummary'
import { motion } from 'framer-motion'
import { assetUrl } from '@/utils/assetUrl'
import { useGameMotionPreferences } from '@/settings/gamePreferences'
import './battleRpg.css'

/**
 * Scheda di fine battaglia. Sostituisce il box messaggi, quindi riporta anche
 * le ultime righe (`messages`) che altrimenti resterebbero coperte.
 */
export function BattleResultCard({ chronicle, outcome, gymVictory = false, messages = [] }: { chronicle: BattleChronicle; outcome: string | null; gymVictory?: boolean; messages?: readonly string[] }) {
  const summary = battleOutcomeSummary(chronicle)
  const { reducedMotion, speed } = useGameMotionPreferences()
  return <section className="battle-result-card" aria-label="Risultato della battaglia" data-battle-result-card>
    {(outcome === 'cattura' || gymVictory) && <motion.img src={assetUrl(`/ui/player-kit/${gymVictory ? 'reward-badge' : 'item-sphere'}.svg`)}
      alt="" aria-hidden="true" className="battle-result-seal" initial={reducedMotion ? false : { scale: .75, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }} transition={{ duration: reducedMotion ? 0 : .45 / speed }} />}
    <h2>{gymVictory ? 'Palestra superata!' : outcome === 'vittoria' ? 'Vittoria!' : outcome === 'sconfitta' ? 'Squadra sconfitta' : outcome === 'cattura' ? 'Arkamon catturato!' : 'Battaglia conclusa'}</h2>
    <p>{summary.partial ? 'Negli ultimi eventi: ' : ''}{summary.enemyKOs} KO avversari · {summary.playerKOs} KO in squadra</p>
    {summary.levels.length > 0 && <ul aria-label="Livelli guadagnati">{summary.levels.map((level, index) => <li key={index}>{level.name} · Lv. {level.before} → {level.after}</li>)}</ul>}
    {messages.length > 0 && <div className="battle-result-messages" role="status" aria-live="polite">{messages.slice(-3).map((message, index) => <p key={`${index}-${message}`}>{message}</p>)}</div>}
    <p className="battle-result-progress">Gli HP residui sono conservati. Premi Prosegui per continuare.</p>
  </section>
}
