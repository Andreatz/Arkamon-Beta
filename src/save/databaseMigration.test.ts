import { describe, expect, it } from 'vitest'
import { initialGameSave, normalizeGameSave, serializeGameState } from './gamePersistence'

describe('salvataggi precedenti al Database', () => {
  const legacy = () => {
    const save = serializeGameState(initialGameSave()) as Record<string, any>
    delete save.dataVersion
    save.giocatore1.squadra = [{ istanzaId: 'a', specieId: 1, nome: 'Vyrath', livello: 12, hp: 20, xp: 0 }]
    save.giocatore1.allenatoriSconfitti = [203, 302, 202, 301]
    save.giocatore1.inventario = { masterball: 1, potion: 2 }
    return save
  }

  it('converte medaglie e sconfitte una sola volta e aggiunge 5 Sacchettini a chi ha già iniziato', () => {
    const { state, warnings } = normalizeGameSave(legacy())
    expect([...state.giocatore1.allenatoriSconfitti]).toEqual([203, 220])
    expect(state.giocatore1.inventario).toEqual({ masterball: 1, potion: 2, sacchettino: 5 })
    expect(warnings.join(' ')).toContain('Database')
    const again = normalizeGameSave(serializeGameState(state))
    expect(again.state.giocatore1.inventario.sacchettino).toBe(5)
    expect([...again.state.giocatore1.allenatoriSconfitti]).toEqual([203, 220])
  })

  it('i salvataggi nuovi portano la versione corrente dei dati e non vengono migrati', () => {
    const save = serializeGameState(initialGameSave())
    expect(save.dataVersion).toBe(3)
    expect(normalizeGameSave(save).warnings.join(' ')).not.toContain('Database')
  })
})
