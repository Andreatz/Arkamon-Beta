import { describe, expect, it } from 'vitest'
import { FIRST_TURN_TUTORIAL, shouldShowTutorial } from './firstTurnTutorial'
import { autoOpponentAllowed } from '@/settings/autoOpponent'
import { DEFAULT_GAME_PREFERENCES, normalizeGamePreferences } from '@/settings/gamePreferences'

describe('basi giocabili (audit fase 8)', () => {
  it('spiega movimento, interazioni e cattura in tre schede brevi', () => {
    expect(FIRST_TURN_TUTORIAL.map((step) => step.id)).toEqual(['movimento', 'interazioni', 'cattura'])
    expect(FIRST_TURN_TUTORIAL[0].body).toContain('due movimenti')
    expect(FIRST_TURN_TUTORIAL[2].body).toContain('Sacchettino')
    for (const step of FIRST_TURN_TUTORIAL) expect(step.body.length).toBeLessThan(240)
  })

  it('mostra il tutorial solo sulla mappa principale dopo il Laboratorio, finché non è completato', () => {
    expect(shouldShowTutorial(false, 'mappa-principale', true)).toBe(true)
    expect(shouldShowTutorial(true, 'mappa-principale', true)).toBe(false)
    expect(shouldShowTutorial(false, 'laboratorio', false)).toBe(false)
    expect(shouldShowTutorial(false, 'citta', true)).toBe(false)
  })

  it('lascia l’avversario al conduttore in modalità regia', () => {
    expect(autoOpponentAllowed(true, false, false)).toBe(true)
    expect(autoOpponentAllowed(false, false, false)).toBe(false)
    expect(autoOpponentAllowed(true, true, false)).toBe(false)
    expect(autoOpponentAllowed(true, false, true)).toBe(false)
  })

  it('salva le nuove preferenze con valori sicuri', () => {
    expect(DEFAULT_GAME_PREFERENCES).toMatchObject({ autoOpponent: false, tutorialDone: false })
    expect(normalizeGamePreferences({ autoOpponent: 'yes', tutorialDone: 1 })).toMatchObject({ autoOpponent: false, tutorialDone: false })
    expect(normalizeGamePreferences({ autoOpponent: true, tutorialDone: true })).toMatchObject({ autoOpponent: true, tutorialDone: true })
  })
})
