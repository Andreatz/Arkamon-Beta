import { describe, expect, it, vi } from 'vitest'
import { initialGameSave } from '@/save/gamePersistence'
import { getLocalMap } from '@/data/localMaps'
import { ALLENATORI } from '@/data'
import { newInteractionDefinition } from '@/interactions/types'
import { journalLocations, nextJournalObjective, routeToLocation } from '../journalModel'
vi.hoisted(() => vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {}, removeItem: () => {} }))
const state = () => ({ ...initialGameSave(), giocatore1: { ...initialGameSave().giocatore1, squadra: [{ istanzaId: 'a', specieId: 1, nome: 'Vyrath', livello: 5, hp: 12, xp: 0 }] } })
describe('diario: obiettivi derivati dai progressi reali', () => {
  it('suggerisce il laboratorio soltanto al giocatore senza starter', () => {
    expect(nextJournalObjective(state(), 2, []).title).toMatch(/starter/)
    expect(nextJournalObjective(state(), 1, []).title).toMatch(/Palestra/)
  })
  it('calcola il prossimo luogo seguendo connessioni bidirezionali vere', () => {
    expect(routeToLocation('Pordenone', 'Piacenza')).toEqual(['Pordenone', 'Venezia', 'Percorso_1', 'Piacenza'])
    expect(routeToLocation('Piacenza', 'Pordenone')).toEqual(['Piacenza', 'Percorso_1', 'Venezia', 'Pordenone'])
    expect(routeToLocation('Pordenone', 'absent')).toBeNull()
  })
  it('una tappa bloccata non sostituisce l’obiettivo con una missione ineseguibile', () => {
    const entry = { ...newInteractionDefinition('Venezia', getLocalMap('Venezia')!.startNode, 'a'), title: 'Incarico', requirements: { gymIds: [], minLevel: 99, minCoins: 0, items: {}, completedInteractions: [] } }
    expect(nextJournalObjective(state(), 1, [entry]).title).not.toBe('Incarico')
    entry.requirements.minLevel = 0
    expect(nextJournalObjective(state(), 1, [entry]).title).toBe('Incarico')
  })
  it('mostra le conquiste individuali senza attribuirle all’altro giocatore', () => {
    const saved = state()
    const trainer = ALLENATORI.find((entry) => entry.tipo === 'Capopalestra')!
    saved.giocatore1.allenatoriSconfitti.add(trainer.id)
    saved.giocatore1.cespugliVisitati.add('Percorso_1:A')
    const row1 = journalLocations(saved, 1, []).find((entry) => entry.mapId === trainer.luogo)!
    const row2 = journalLocations(saved, 2, []).find((entry) => entry.mapId === trainer.luogo)!
    expect(row1.trainersCompleted).toBe(1); expect(row1.documented).toBe(true)
    expect(row2.trainersCompleted).toBe(0); expect(row2.documented).toBe(false)
  })
})
