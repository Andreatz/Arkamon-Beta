import { describe, expect, it } from 'vitest'
import { gridCells, hasMagentaCorners, isMagenta, keyOutMagenta, mergeCatalog, ruleForFile, safeArtId } from '../assets/gameArtImport.mjs'
import inboxSpec from '../../ui-source/game-art-inbox.json'

describe('importazione illustrazioni di gioco', () => {
  it('riconosce il fondo magenta con tolleranza', () => {
    expect(isMagenta(255, 0, 255)).toBe(true)
    expect(isMagenta(230, 40, 240)).toBe(true)
    expect(isMagenta(255, 200, 255)).toBe(false)
    expect(isMagenta(20, 0, 255)).toBe(false)
  })

  it('rende trasparente il magenta e lascia intatti i colori lontani', () => {
    const data = new Uint8ClampedArray([255, 0, 255, 255, 30, 120, 60, 255])
    expect(keyOutMagenta(data)).toBe(1)
    expect(data[3]).toBe(0)
    expect([...data.slice(4)]).toEqual([30, 120, 60, 255])
  })

  it('riconosce un fondo magenta dai quattro angoli', () => {
    const data = new Uint8ClampedArray(2 * 2 * 4)
    for (let i = 0; i < data.length; i += 4) data.set([255, 0, 255, 255], i)
    expect(hasMagentaCorners(data, 2, 2)).toBe(true)
    data.set([0, 0, 0, 255], 12)
    expect(hasMagentaCorners(data, 2, 2)).toBe(false)
  })

  it('divide un atlante in celle che coprono tutta l’immagine', () => {
    const cells = gridCells(101, 50, 4, 2)
    expect(cells).toHaveLength(8)
    expect(cells[0]).toEqual({ left: 0, top: 0, width: 25, height: 25 })
    expect(cells[3].left + cells[3].width).toBe(101)
    expect(cells[7].top + cells[7].height).toBe(50)
  })

  it('unisce il catalogo sostituendo gli id ripetuti e ordinando', () => {
    const merged = mergeCatalog({ assets: [{ id: 'logo', file: 'a.webp' }, { id: 'coin', file: 'c.webp' }] }, [{ id: 'logo', file: 'b.webp' }])
    expect(merged.assets.map(asset => asset.id)).toEqual(['coin', 'logo'])
    expect(merged.assets[1].file).toBe('b.webp')
  })

  it('rifiuta nomi di file non sicuri', () => {
    expect(safeArtId('menu-team')).toBe('menu-team')
    expect(() => safeArtId('../etc')).toThrow()
    expect(() => safeArtId('Logo')).toThrow()
  })

  it('trova la regola per nome esatto o per schema dei ritratti', () => {
    expect(ruleForFile(inboxSpec, 'item-antiparalisi.png')?.id).toBe('item-paralysis-heal')
    expect(ruleForFile(inboxSpec, 'trainer-capopalestra-1.png')).toEqual({ id: 'trainer-capopalestra-1', maxSide: 1400 })
    expect(ruleForFile(inboxSpec, 'npc-giustina-vecchietta.png')?.id).toBe('npc-giustina-vecchietta')
    expect(ruleForFile(inboxSpec, 'npc-Nome Sbagliato.png')).toBeUndefined()
    expect(ruleForFile(inboxSpec, 'foto.png')).toBeUndefined()
    // Consegne in JPG e refusi noti nel nome (lotto 1, 17/11/2026).
    expect(ruleForFile(inboxSpec, 'item-sacchettino.jpg')?.id).toBe('item-sacchettino')
    expect(ruleForFile(inboxSpec, 'pawn-player-1.jpeg')?.ids).toEqual(['pawn-player-1-idle', 'pawn-player-1-jump'])
    expect(ruleForFile(inboxSpec, 'item-profump-speciale.jpg')?.id).toBe('item-profumo-speciale')
  })
})
