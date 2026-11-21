import { useAudienceStore } from '@/audience/useAudienceStore'
import { useRegiaStore } from '@/regia/regiaStore'
import { useGamePreferences } from './gamePreferences'

/** Audit fase 8: attesa prima che l'avversario automatico agisca (ms, a velocità normale). */
export const AUTO_OPPONENT_DELAY_MS = 1100

/**
 * L'avversario automatico vale solo fuori dalla regia: con il pubblico collegato, un ospite
 * o la pausa di regia, le mosse restano nelle mani di chi conduce la diretta.
 */
export function autoOpponentAllowed(preference: boolean, audienceEnabled: boolean, regiaPaused: boolean): boolean {
  return preference && !audienceEnabled && !regiaPaused
}

export function useAutoOpponent(): { preference: boolean; active: boolean; blockedByDirector: boolean } {
  const preference = useGamePreferences((state) => state.autoOpponent)
  const audienceEnabled = useAudienceStore((state) => state.enabled)
  const regiaPaused = useRegiaStore((state) => state.paused)
  return { preference, active: autoOpponentAllowed(preference, audienceEnabled, regiaPaused), blockedByDirector: audienceEnabled || regiaPaused }
}
