import type { Page } from '@playwright/test'

/** Salvataggio minimo e deterministico per le schermate di regressione visiva (audit fase 10). */
export async function seedCampaign(page: Page, scene: 'mappa-principale' | 'battaglia-finita' | 'battaglia') {
  await page.addInitScript((scene) => {
    if (sessionStorage.getItem('visual-fixture')) return
    const lead = { istanzaId: 'visual-lead', specieId: 5, nome: 'Darklaw', livello: 7, hp: 15, xp: 0 }
    const second = { istanzaId: 'visual-second', specieId: 1, nome: 'Vyrath', livello: 6, hp: 14, xp: 0 }
    const rival = { istanzaId: 'visual-rival', specieId: 9, nome: 'Felyss', livello: 6, hp: 14, xp: 0 }
    const enemy = { istanzaId: 'visual-enemy', specieId: 101, nome: 'Xesar', livello: 5, hp: scene === 'battaglia-finita' ? 0 : 12, xp: 0 }
    const player = (id: 1 | 2) => ({ id, nome: id === 1 ? 'Andrea' : 'Luca', squadra: id === 1 ? [lead, second] : [rival], deposito: {},
      cespugliVisitati: [], allenatoriSconfitti: [], monete: 600, inventario: { revive: 0 } })
    const position = { mappaId: 'mappa-principale', x: 0, y: 0, direzione: 'S', luogo: 'Venezia' }
    const battle = scene === 'mappa-principale' ? null : {
      tipo: 'NPC', allenatoreId: 201, pokemonA: lead, pokemonB: enemy, squadraA: [lead, second], squadraB: [enemy],
      hpMaxA: 15, hpMaxB: 12, turnoCorrente: 'A', luogoRitorno: 'Venezia', log: [], evoluzioneInAttesa: null,
      checkpoint: scene === 'battaglia-finita'
        ? { version: 1, initialPriority: 'A', actedThisRound: [], phase: 'ended', openingComplete: true, outcome: 'vittoria', evolutions: [], rivalMessages: [] }
        : { version: 1, initialPriority: 'A', actedThisRound: [], phase: 'turn', openingComplete: true, evolutions: [], rivalMessages: [] },
    }
    localStorage.setItem('arkamon-save', JSON.stringify({ version: 0, state: { dataVersion: 2,
      giocatore1: player(1), giocatore2: player(2), giocatoreAttivo: 1, rivaleStarterId: 9,
      posizione1: position, posizione2: position, turnoOverworld: { giocatoreAttivo: 1, azioniRimaste: 2 },
      posizioniLocali1: {}, posizioniLocali2: {}, audioMuted: true,
      scenaCorrente: { scena: battle ? 'battaglia' : 'mappa-principale' }, scenaPrecedente: { scena: 'mappa-principale' },
      interactionProgress: { completed1: [], completed2: [], completedShared: [], log1: [], log2: [], pendingBattle: null },
      battaglia: battle } }))
    localStorage.setItem('arkamon-preferences-v1', JSON.stringify({ version: 1, state: {
      musicVolume: 0, effectsVolume: 0, reducedMotion: 'on', animationSpeed: 'fast', tutorialDone: true } }))
    sessionStorage.setItem('visual-fixture', scene)
  }, scene)
}

/**
 * Testi visibilmente troncati: elementi con ellissi o overflow nascosto il cui contenuto
 * supera la larghezza disponibile. Restituisce il testo dei casi trovati.
 */
export async function truncatedTexts(page: Page, selector = 'button, h1, h2, h3, [role="status"], label, .arka-ds-button') {
  return page.locator(selector).evaluateAll((elements) => elements.flatMap((element) => {
    const html = element as HTMLElement
    const style = getComputedStyle(html)
    if (style.visibility === 'hidden' || style.display === 'none' || html.offsetParent === null) return []
    // Testi solo per lettori di schermo (sr-only): larghi un pixel per costruzione, non sono troncati.
    if (html.clientWidth <= 2 || style.clip === 'rect(0px, 0px, 0px, 0px)' || style.clipPath === 'inset(50%)') return []
    const clips = style.textOverflow === 'ellipsis' || style.overflow === 'hidden' || style.overflowX === 'hidden'
    if (!clips || !(html.innerText ?? '').trim()) return []
    return html.scrollWidth > html.clientWidth + 1 ? [(html.getAttribute('aria-label') || html.innerText).trim().slice(0, 80)] : []
  }))
}
