import { expect, test, type Locator, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { openConfiguredShop, seedConfiguredShop } from './helpers/configuredShop'
import type { PokemonIstanza } from '../src/types'

const SAVE_KEY = 'arkamon-save'
const pokemonCatalog: { id: number; nome: string }[] = JSON.parse(readFileSync(new URL('../src/data/pokemon.json', import.meta.url), 'utf8'))
type PortraitMetadata = { width: number; height: number; alphaBounds: [number, number, number, number] }
const portraitMetadata: Record<string, PortraitMetadata> = JSON.parse(readFileSync(new URL('../src/player-ui/portraitMetadata.json', import.meta.url), 'utf8'))
const SCREENS = [
  ['Squadra', 'squadra'], ['Deposito', 'deposito'], ['Arkadex', 'arkadex'], ['Analisi', 'analisi'],
  ['Borsa', 'borsa'], ['Menù Partita', 'partita'],
] as const
const ITEMS = [
  ['potion', 'Pozione'], ['super-potion', 'Superpozione'], ['revive', 'Rianimatore'],
  ['antidote', 'Antidoto'], ['paralysis-heal', 'Antiparalisi'], ['awakening', 'Sveglia'], ['masterball', 'Masterball'],
] as const

/** Dense but valid portable data exercises layout; UI consultation must never change it. */
async function seedFullCampaign(page: Page, sparseG2Discoveries = false, directDeposit = false) {
  await seedConfiguredShop(page)
  const allIds = pokemonCatalog.map(species => species.id)
  const creature = (owner: 1 | 2, index: number, reserve = false): PokemonIstanza => {
    const species = pokemonCatalog[reserve ? (index + 12) % pokemonCatalog.length : [0, 8, 24, 55, 75, 109][index]]
    const conditions: PokemonIstanza['stato'][] = [
      { tipo: 'Paralizzato', turniRimanenti: -1 },
      { tipo: 'Avvelenato', turniRimanenti: -1, turniTrascorsi: 2 },
      { tipo: 'Addormentato', turniRimanenti: 3 },
      { tipo: 'Confuso', turniRimanenti: 3 }, undefined, undefined,
    ]
    return {
      istanzaId: `viewport1080-g${owner}-${reserve ? 'reserve' : 'team'}-${index + 1}`,
      specieId: species.id, nome: `${species.nome} delle Costellazioni d’Oriente`,
      livello: 20 + index % 6, hp: !reserve && index === 5 ? 0 : 3 + index % 7, xp: 0,
      ...(conditions[index % 6] ? { stato: conditions[index % 6] } : {}),
    }
  }
  const player = (id: 1 | 2) => ({
    id, nome: id === 1 ? 'Arianna delle Costellazioni' : 'Bruno delle Costellazioni',
    squadra: Array.from({ length: 6 }, (_, index) => creature(id, index)),
    deposito: Object.fromEntries(Array.from({ length: 35 }, (_, index) => [`1:${index + 1}`, creature(id, index, true)])),
    cespugliVisitati: [], allenatoriSconfitti: [], caselleConsumate: [], monete: id === 1 ? 500_000 : 125,
    inventario: Object.fromEntries(ITEMS.map(([id]) => [id, id === 'masterball' ? 999_900 : 999_901])),
  })
  const position = (luogo: string) => ({ mappaId: 'mappa-principale', luogo, x: 0, y: 0, direzione: 'S' })
  const g2 = player(2)
  const g2Discoveries = sparseG2Discoveries
    ? [...new Set([...g2.squadra, ...Object.values(g2.deposito)].map(pokemon => pokemon.specieId))] : allIds
  const state = {
    giocatore1: player(1), giocatore2: g2, giocatoreAttivo: 1, rivaleStarterId: 9, battaglia: null,
    posizione1: position('Venezia'), posizione2: position('Torino'),
    turnoOverworld: { giocatoreAttivo: 1, azioniRimaste: 2 },
    posizioniLocali1: { Venezia: 'n56' }, posizioniLocali2: {},
    scenaCorrente: directDeposit ? { scena: 'deposito' } : { scena: 'citta', payload: { luogo: 'Venezia' } },
    scenaPrecedente: directDeposit ? { scena: 'citta', payload: { luogo: 'Venezia' } } : { scena: 'mappa-principale' }, audioMuted: true,
    arkadex: { seen1: allIds, caught1: allIds, seen2: g2Discoveries, caught2: g2Discoveries },
    matchLog: { version: 1, nextSequence: 1, events: [] },
    interactionProgress: { completed1: [], completed2: [], completedShared: [], log1: [], log2: [], pendingBattle: null },
  }
  await page.addInitScript(({ key, state }) => {
    if (localStorage.getItem(key)) return
    localStorage.setItem(key, JSON.stringify({ version: 0, state }))
    localStorage.setItem('arkamon-preferences-v1', JSON.stringify({ version: 1, state: {
      musicVolume: 0, effectsVolume: 0, animationSpeed: 'fast', reducedMotion: 'on',
    } }))
  }, { key: SAVE_KEY, state })
  await page.goto('/')
  await expect(page.locator('[data-presented-scene]')).toHaveAttribute('aria-busy', 'false')
}

async function savedCampaign(page: Page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)!).state, SAVE_KEY)
}

async function openTools(page: Page) {
  await page.getByRole('button', { name: 'Partita', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'La tua partita', exact: true })
  await expect(dialog).toBeVisible()
  return dialog
}

async function selectScreen(dialog: Locator, name: string, id: string) {
  await dialog.getByRole('button', { name, exact: true }).click()
  await expect(dialog.locator('.pu-shell')).toHaveAttribute('data-player-ui-screen', id)
  await expect(dialog.locator('.pu-content').getByRole('status').filter({ hasText: 'Caricamento…' })).toHaveCount(0)
}

/** Projects source pixels through the rendered SVG, so CSS zooming/cropping cannot pass as a centered portrait. */
async function assertVisiblePortraits(dialog: Locator, context: string) {
  const portraits = dialog.locator('svg.pu-creature-art')
  await expect(portraits.first(), `${context}: portraits use SVG framing`).toBeVisible()
  await expect.poll(async () => portraits.evaluateAll(elements => elements.filter(element =>
    element.getAttribute('data-creature-loaded') !== 'true').length), {
    message: `${context}: every visible portrait must finish loading`,
  }).toBe(0)
  const report = await portraits.evaluateAll((elements, metadata) => elements.map(element => {
    const svg = element as SVGSVGElement
    const source = svg.getAttribute('data-creature-source')!
    const speciesId = svg.getAttribute('data-species-id')
    const entry = metadata[source]
    if (!entry) return { source, issues: ['Unrecognized source metadata'] }
    const issues: string[] = []
    if (source !== `/sprites/front_sprites/${speciesId}.png`) issues.push('Portrait does not use the official front sprite')
    const image = svg.querySelector('image')!, matrix = svg.getScreenCTM()!
    const [left, top, right, bottom] = entry.alphaBounds
    const alphaPoints = [[left, top], [right, bottom]].map(([x, y]) => {
      const point = svg.createSVGPoint(); point.x = x; point.y = y
      return point.matrixTransform(matrix)
    })
    const alpha = { left: alphaPoints[0].x, top: alphaPoints[0].y, right: alphaPoints[1].x, bottom: alphaPoints[1].y }
    const rect = svg.getBoundingClientRect()
    const circle = svg.parentElement!.querySelector('.pu-creature-circle')!.getBoundingClientRect()
    // object-fit:contain renders the circle as a square even when its large portrait host is a wide rectangle.
    const diameter = Math.min(circle.width, circle.height), cx = (circle.left + circle.right) / 2, cy = (circle.top + circle.bottom) / 2
    const circleSquare = { left: cx - diameter / 2, top: cy - diameter / 2, right: cx + diameter / 2, bottom: cy + diameter / 2 }
    const epsilon = 2, viewBox = svg.viewBox.baseVal
    if (Math.abs(viewBox.width - viewBox.height) > 0.01) issues.push('Non-square source viewBox')
    if (Math.abs(viewBox.x + viewBox.width / 2 - (left + right) / 2) > 0.01
      || Math.abs(viewBox.y + viewBox.height / 2 - (top + bottom) / 2) > 0.01) issues.push('Source alpha is not centered in viewBox')
    if (Number(image.getAttribute('width')) !== entry.width || Number(image.getAttribute('height')) !== entry.height) issues.push('Source dimensions changed')
    if (Number(image.getAttribute('x') ?? 0) !== 0 || Number(image.getAttribute('y') ?? 0) !== 0 || image.hasAttribute('transform')) issues.push('Source image translated or transformed separately')
    if (!(image.getAttribute('href') ?? image.getAttributeNS('http://www.w3.org/1999/xlink', 'href'))?.endsWith(source)) issues.push('Image does not use the immutable source')
    // The SVG viewport can be wide; xMidYMid meet must still render its square viewBox at the contained circle size.
    if (Math.min(rect.width, rect.height) > diameter + epsilon) issues.push('Artwork enlarged beyond contained circle')
    if (Math.abs((alpha.left + alpha.right) / 2 - cx) > epsilon || Math.abs((alpha.top + alpha.bottom) / 2 - cy) > epsilon) issues.push('Visible alpha is off center')
    if (alpha.left < circleSquare.left - epsilon || alpha.right > circleSquare.right + epsilon
      || alpha.top < circleSquare.top - epsilon || alpha.bottom > circleSquare.bottom + epsilon) issues.push('Visible alpha exceeds circle square')
    if (alpha.left < -epsilon || alpha.right > innerWidth + epsilon || alpha.top < -epsilon || alpha.bottom > innerHeight + epsilon) issues.push('Visible alpha exceeds viewport')
    for (let ancestor = svg.parentElement; ancestor && ancestor !== document.body; ancestor = ancestor.parentElement) {
      const style = getComputedStyle(ancestor), bound = ancestor.getBoundingClientRect()
      const clippedX = ['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowX)
      const clippedY = ['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowY)
      if ((clippedX && (alpha.left < bound.left + ancestor.clientLeft - epsilon || alpha.right > bound.left + ancestor.clientLeft + ancestor.clientWidth + epsilon))
        || (clippedY && (alpha.top < bound.top + ancestor.clientTop - epsilon || alpha.bottom > bound.top + ancestor.clientTop + ancestor.clientHeight + epsilon))) {
        issues.push(`Visible alpha clipped by ${ancestor.className}`); break
      }
    }
    return { source, speciesId, issues }
  }), portraitMetadata)
  expect(report.filter(portrait => portrait.issues.length), `${context}: complete centered portrait pixels`).toEqual([])
  return report
}

/** Checks actual content geometry even when CSS hides overflowing content. */
async function assertFitsWithoutScroll(dialog: Locator, context: string) {
  await dialog.evaluate(async element => {
    await document.fonts.ready
    await Promise.all(Array.from(element.querySelectorAll('img')).map(image => image.decode().catch(() => null)))
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
  })
  const report = await dialog.evaluate(root => {
    const epsilon = 2
    const issues: string[] = []
    const identify = (element: HTMLElement) => element.getAttribute('aria-label')
      ?? (typeof element.className === 'string' && element.className ? element.className : element.tagName.toLowerCase())
    const visible = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect(), style = getComputedStyle(element)
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
    }
    const all = [root as HTMLElement, ...root.querySelectorAll<HTMLElement>('*')].filter(visible)
    const mainSelector = '.pu-shell,.pu-content,.pu-team-layout,.pu-team-list,.pu-detail-panel,.pu-deposit-layout,.pu-deposit-grid-panel,.pu-deposit-detail,.pu-box-grid,.pu-deposit-team,.pu-dex-layout,.pu-dex-index,.pu-dex-list,.pu-dex-detail,.pu-analysis-layout,.pu-bag-layout,.pu-bag-inventory,.pu-bag-detail,.pu-item-use,.pu-store-layout,.pu-store-catalog,.pu-store-detail,.pu-store-cart,.pu-cart-lines,.pu-menu-layout,.pu-menu-grid,.pu-journey'
    const main = all.filter(element => element === root || element.matches(mainSelector))
    const metrics = main.map(element => ({ element: identify(element), height: element.clientHeight,
      contentHeight: element.scrollHeight, top: element.getBoundingClientRect().top, bottom: element.getBoundingClientRect().bottom }))
    for (const element of all) {
      const style = getComputedStyle(element)
      const required = main.includes(element) || ['auto', 'scroll'].includes(style.overflowY)
      if (required && element.scrollHeight > element.clientHeight + epsilon) {
        issues.push(`${identify(element)}: vertical content ${element.scrollHeight}px exceeds available ${element.clientHeight}px (overflow-y:${style.overflowY})`)
      }
      if (main.includes(element) && element.scrollWidth > element.clientWidth + epsilon) {
        issues.push(`${identify(element)}: horizontal content ${element.scrollWidth}px exceeds available ${element.clientWidth}px`)
      }
    }
    if (document.documentElement.scrollHeight > innerHeight + epsilon) issues.push('Document exceeds the viewport vertically')
    if (document.documentElement.scrollWidth > innerWidth + epsilon) issues.push('Document exceeds the viewport horizontally')

    function checkBounds(rect: DOMRect, element: HTMLElement, label: string, horizontal: boolean) {
      if (rect.top < -epsilon || rect.bottom > innerHeight + epsilon
        || (horizontal && (rect.left < -epsilon || rect.right > innerWidth + epsilon))) {
        issues.push(`${label}: outside ${innerWidth}×${innerHeight} viewport (${Math.round(rect.left)},${Math.round(rect.top)})–(${Math.round(rect.right)},${Math.round(rect.bottom)})`)
      }
      // Decoration/portrait artwork may have intentional crops. Commands and text may not be clipped vertically.
      for (let ancestor = element.parentElement; ancestor && ancestor !== document.body; ancestor = ancestor.parentElement) {
        const style = getComputedStyle(ancestor)
        if (['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowY)) {
          const bound = ancestor.getBoundingClientRect(), top = bound.top + ancestor.clientTop
          const bottom = top + ancestor.clientHeight
          if (rect.top < top - epsilon || rect.bottom > bottom + epsilon) {
            issues.push(`${label}: clipped vertically by ${identify(ancestor)}`)
            break
          }
        }
      }
    }
    const controls = all.filter(element => element.matches('button,input,select,textarea,a[href],output,[role="tab"]'))
    controls.forEach(element => checkBounds(element.getBoundingClientRect(), element,
      `Command ${element.getAttribute('aria-label') ?? element.textContent?.trim().slice(0, 70) ?? element.tagName}`, true))

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    let node: Node | null
    while ((node = walker.nextNode())) {
      const parent = node.parentElement
      if (!(parent instanceof HTMLElement) || !visible(parent) || parent.closest('option,script,style') || !node.textContent?.trim()) continue
      const range = document.createRange(); range.selectNodeContents(node)
      for (const rect of range.getClientRects()) if (rect.width && rect.height) {
        checkBounds(rect, parent, `Text “${node.textContent.trim().slice(0, 65)}”`, false)
      }
    }
    const kit = all.filter((element): element is HTMLImageElement => element instanceof HTMLImageElement && element.src.includes('/ui/player-kit/'))
    const brokenKit = kit.filter(image => !image.complete || !image.naturalWidth).map(image => image.src)
    return { viewport: { width: innerWidth, height: innerHeight }, issueCount: issues.length, issues: issues.slice(0, 40), metrics, brokenKit }
  })
  expect(report.viewport).toEqual(dialog.page().viewportSize())
  expect(report.brokenKit, `${context}: SVG artwork must load`).toEqual([])
  expect(report.issues, `${context}: ${report.issueCount} geometry issues; ${JSON.stringify(report.metrics)}`).toEqual([])
  const portraits = await dialog.locator('svg.pu-creature-art').count() ? await assertVisiblePortraits(dialog, context) : []
  return { portraits }
}

test.describe('Six real player tools at 1920×1080 with maximum content', () => {
  test.use({ viewport: { width: 1920, height: 1080 } })
  test.skip(({ isMobile }) => isMobile, 'This requirement targets the desktop 1920×1080 viewport; existing tests cover phones.')

  test('all six views and their dense selected contents stay visible without scroll or campaign mutations', async ({ page }) => {
    test.setTimeout(180_000)
    await seedFullCampaign(page)
    const before = await savedCampaign(page)
    expect(before.giocatore1.squadra).toHaveLength(6)
    expect(Object.keys(before.giocatore1.deposito)).toHaveLength(35)
    expect(before.arkadex.seen1).toHaveLength(110)
    const dialog = await openTools(page)

    for (const [name, id] of SCREENS) {
      await selectScreen(dialog, name, id)
      await assertFitsWithoutScroll(dialog, `${name}: full campaign`)
      if (id === 'squadra') {
        for (let index = 1; index <= 6; index++) {
          await dialog.getByRole('button', { name: new RegExp(`^Squadra, posto ${index}:`) }).click()
          await assertFitsWithoutScroll(dialog, `Squadra: companion ${index}, real HP and status`)
        }
      }
      if (id === 'deposito') {
        await expect(dialog.getByRole('button', { name: /^Box 1, posto \d+:/ })).toHaveCount(35)
        await dialog.getByRole('button', { name: /^Box 1, posto 35:/ }).click()
        await assertFitsWithoutScroll(dialog, 'Deposito: last occupied reserve and full team')
        await dialog.getByLabel('Scegli box del deposito').selectOption('30')
        await assertFitsWithoutScroll(dialog, 'Deposito: empty final box, team and commands remain visible')
        await dialog.getByLabel('Scegli box del deposito').selectOption('1')
      }
      if (id === 'arkadex') {
        const pagination = dialog.getByRole('navigation', { name: 'Pagine dell’Arkadex', exact: true })
        const next = pagination.getByRole('button', { name: 'Pagina successiva dell’Arkadex', exact: true })
        const previous = pagination.getByRole('button', { name: 'Pagina precedente dell’Arkadex', exact: true })
        await dialog.getByRole('button', { name: /^Numero 1:/ }).click()
        const selectedName = await dialog.locator('.pu-dex-detail article').getAttribute('aria-label')
        await expect(previous).toBeDisabled()
        const visitedSpecies: number[] = []
        const portraitSources = new Set<string>()
        for (let pageNumber = 1; pageNumber <= 19; pageNumber++) {
          await expect(pagination).toContainText(`Pagina ${pageNumber} / 19`)
          const numbers = await dialog.locator('.pu-dex-list .pu-dex-row').evaluateAll(rows => rows.map(row =>
            Number(row.getAttribute('aria-label')?.match(/^Numero (\d+):/)?.[1])))
          expect(numbers).toHaveLength(pageNumber === 19 ? 2 : 6)
          visitedSpecies.push(...numbers)
          await expect(dialog.locator('.pu-dex-detail article')).toHaveAttribute('aria-label', selectedName!)
          const framing = await assertFitsWithoutScroll(dialog, `Arkadex: page ${pageNumber} / 19 and stable selected specimen`)
          framing.portraits.forEach(portrait => portraitSources.add(portrait.source))
          if (pageNumber < 19) await next.click()
        }
        expect(visitedSpecies).toEqual(pokemonCatalog.map(species => species.id))
        expect([...portraitSources].filter(source => source.endsWith('idle-poster.webp'))).toHaveLength(0)
        expect([...portraitSources].filter(source => source.endsWith('.png'))).toHaveLength(110)
        expect([...portraitSources].sort()).toEqual(pokemonCatalog.map(species => `/sprites/front_sprites/${species.id}.png`).sort())
        await expect(next).toBeDisabled()
        await previous.click()
        await expect(pagination).toContainText('Pagina 18 / 19')
        await assertFitsWithoutScroll(dialog, 'Arkadex: previous page without scrolling')
        await dialog.getByLabel('Cerca specie scoperta o numero').fill('1')
        await dialog.getByRole('button', { name: /^Numero 1:/ }).click()
        const detailTabs = dialog.getByRole('navigation', { name: 'Sezioni della scheda Arkadex', exact: true })
        for (const tab of ['Informazioni', 'Mosse', 'Evoluzioni']) {
          await detailTabs.getByRole('button', { name: tab, exact: true }).click()
          await assertFitsWithoutScroll(dialog, `Arkadex: ${tab}, owned specimen with complete four-stage chain`)
        }
        await dialog.getByLabel('Cerca specie scoperta o numero').fill('110')
        await dialog.getByRole('button', { name: /^Numero 110:/ }).click()
        await assertFitsWithoutScroll(dialog, 'Arkadex: final species with owned specimen')
        await dialog.getByRole('button', { name: 'Azzera filtri', exact: true }).click()
        await expect(pagination).toContainText('Pagina 1 / 19')
        await expect(dialog.getByLabel('Cerca specie scoperta o numero')).toHaveValue('')
        await assertFitsWithoutScroll(dialog, 'Arkadex: filters reset restores the full paginated catalog')
      }
      if (id === 'analisi') {
        for (const pokemon of before.giocatore1.squadra as PokemonIstanza[]) {
          await dialog.getByLabel('Arkamon da analizzare').selectOption(pokemon.istanzaId)
          for (const tab of ['Scheda', 'Mosse', 'Status e cure']) {
            await dialog.getByRole('button', { name: tab, exact: true }).click()
            await assertFitsWithoutScroll(dialog, `Analisi: ${pokemon.nome}, ${tab}`)
          }
        }
      }
      if (id === 'borsa') {
        for (const category of ['Cure', 'Status', 'Cattura', 'Tutti']) {
          await dialog.locator('.pu-bag-inventory').getByRole('button', { name: category, exact: true }).click()
          await assertFitsWithoutScroll(dialog, `Borsa: ${category} with seven real inventory entries`)
        }
        for (const [, itemName] of ITEMS) {
          await dialog.getByRole('button', { name: new RegExp(`^${itemName}: \\d+ disponibili$`) }).click()
          await assertFitsWithoutScroll(dialog, `Borsa: ${itemName} details and real use commands`)
        }
      }
      expect(await savedCampaign(page), `${name}: layout consultation preserves all campaign data`).toEqual(before)
    }
  })

  test('all six G2 consultation views include readonly notices without hiding commands or altering the active turn', async ({ page }) => {
    test.setTimeout(90_000)
    await seedFullCampaign(page)
    const before = await savedCampaign(page)
    const dialog = await openTools(page)
    await dialog.getByRole('button', { name: 'G2 · Bruno delle Costellazioni', exact: true }).click()
    await expect(dialog.locator('.pu-shell')).toHaveAttribute('data-player-ui-player', '2')
    for (const [name, id] of SCREENS) {
      await selectScreen(dialog, name, id)
      await assertFitsWithoutScroll(dialog, `${name}: inactive G2, full team and readonly notices`)
      expect(await savedCampaign(page), `${name}: G2 consultation preserves HP, XP, status, inventory, money and turn`).toEqual(before)
    }
  })

  test('unknown Arkadex detail stays private and fully visible after using a known species tab', async ({ page }) => {
    await seedFullCampaign(page, true)
    const before = await savedCampaign(page)
    const dialog = await openTools(page)
    await dialog.getByRole('button', { name: 'G2 · Bruno delle Costellazioni', exact: true }).click()
    await selectScreen(dialog, 'Arkadex', 'arkadex')
    await dialog.getByRole('button', { name: /^Numero 1:/ }).click()
    const tabs = dialog.getByRole('navigation', { name: 'Sezioni della scheda Arkadex', exact: true })
    for (const tab of ['Informazioni', 'Mosse', 'Evoluzioni']) {
      await tabs.getByRole('button', { name: tab, exact: true }).click()
      await assertFitsWithoutScroll(dialog, `G2 Arkadex: ${tab} before selecting an undiscovered species`)
    }
    await dialog.getByLabel('Cerca specie scoperta o numero').fill('99')
    await dialog.getByRole('button', { name: /^Numero 99: specie da scoprire/ }).click()
    await expect(dialog.getByRole('article', { name: 'Scheda da scoprire', exact: true })).toBeVisible()
    await expect(tabs).toHaveCount(0)
    await expect(dialog.locator('.pu-dex-tab-content')).toHaveCount(0)
    await expect(dialog.locator('.pu-dex-detail')).not.toContainText(pokemonCatalog.find(species => species.id === 99)!.nome)
    await assertFitsWithoutScroll(dialog, 'G2 Arkadex: unknown species does not retain hidden information from the previous tab')
    expect(await savedCampaign(page)).toEqual(before)
  })

  test('the direct deposit scene and its six tools also fit without scrolling', async ({ page }) => {
    await seedFullCampaign(page, false, true)
    const before = await savedCampaign(page)
    const scene = page.locator('.pu-scene-host')
    await expect(scene.locator('.pu-shell')).toHaveAttribute('data-player-ui-screen', 'deposito')
    for (const [name, id] of SCREENS) {
      await selectScreen(scene, name, id)
      await assertFitsWithoutScroll(scene, `Direct deposit: ${name} with full campaign`)
    }
    expect(await savedCampaign(page)).toEqual(before)
  })
})

for (const height of [900, 945, 1080]) {
  test.describe(`Six player tools in a normal desktop browser, 1920×${height} content viewport`, () => {
    test.use({ viewport: { width: 1920, height } })
    test.skip(({ isMobile }) => isMobile, 'Desktop browser chrome reduces usable height; phone layouts have separate coverage.')

    test('the match dialog fits dense G1 contents and every G2 readonly view', async ({ page }) => {
      test.setTimeout(120_000)
      await seedFullCampaign(page)
      const before = await savedCampaign(page)
      const dialog = await openTools(page)
      for (const [name, id] of SCREENS) {
        await selectScreen(dialog, name, id)
        if (id === 'deposito') await dialog.getByRole('button', { name: /^Box 1, posto 35:/ }).click()
        if (id === 'arkadex') {
          const tabs = dialog.getByRole('navigation', { name: 'Sezioni della scheda Arkadex', exact: true })
          for (const tab of ['Mosse', 'Evoluzioni', 'Informazioni']) {
            await tabs.getByRole('button', { name: tab, exact: true }).click()
            await assertFitsWithoutScroll(dialog, `${height}px dialog, G1 Arkadex ${tab}`)
          }
        }
        if (id === 'analisi') {
          for (const tab of ['Mosse', 'Status e cure', 'Scheda']) {
            await dialog.getByRole('button', { name: tab, exact: true }).click()
            await assertFitsWithoutScroll(dialog, `${height}px dialog, G1 analysis ${tab}`)
          }
        }
        await assertFitsWithoutScroll(dialog, `${height}px dialog, G1 ${name}, full team, reserves and cart`)
      }
      await dialog.getByRole('button', { name: 'G2 · Bruno delle Costellazioni', exact: true }).click()
      for (const [name, id] of SCREENS) {
        await selectScreen(dialog, name, id)
        await assertFitsWithoutScroll(dialog, `${height}px dialog, inactive G2 ${name} and readonly notices`)
      }
      expect(await savedCampaign(page)).toEqual(before)
    })

    test('the direct deposit scene fits all six tools, then the returned city fits a complete shopping cart', async ({ page }) => {
      test.setTimeout(90_000)
      await seedFullCampaign(page, false, true)
      const before = await savedCampaign(page)
      const scene = page.locator('.pu-scene-host')
      await expect(scene.locator('.pu-shell')).toHaveAttribute('data-player-ui-screen', 'deposito')
      for (const [name, id] of SCREENS) {
        await selectScreen(scene, name, id)
        await assertFitsWithoutScroll(scene, `${height}px direct scene, G1 ${name} and full selected contents`)
      }
      expect(await savedCampaign(page)).toEqual(before)
      await scene.getByRole('button', { name: 'Riprendi il Viaggio', exact: true }).click()
      await expect(page.locator('[data-presented-scene="citta:Venezia"]')).toHaveAttribute('aria-busy', 'false')
      const returnedCampaign = await savedCampaign(page)
      expect(returnedCampaign).toEqual({ ...before, scenaCorrente: before.scenaPrecedente, scenaPrecedente: null })
      const dialog = await openConfiguredShop(page)
      for (const [, itemName] of ITEMS) {
        const quantity = dialog.getByLabel(`Quantità di ${itemName}`, { exact: true })
        await expect(quantity).toBeEnabled()
        await quantity.fill('99')
      }
      await expect(dialog.locator('.pu-cart-line')).toHaveCount(7)
      await assertFitsWithoutScroll(dialog, `${height}px returned city, complete seven-item cart and checkout warnings`)
      expect(await savedCampaign(page)).toEqual(returnedCampaign)
    })
  })
}

test.describe('Official front sprites in all four creature consultation screens', () => {
  test.use({ viewport: { width: 1920, height: 1080 } })
  test.skip(({ isMobile }) => isMobile, 'The shared portrait source projection is checked in the dense desktop layouts.')

  test('team, deposit, Arkadex and analysis need no animation poster or atlas and preserve the saved campaign', async ({ page }) => {
    test.setTimeout(90_000)
    await seedFullCampaign(page)
    const before = await savedCampaign(page)
    const animationRequests: string[] = []
    await page.route('**/sprites/arkamon/**', async route => {
      animationRequests.push(route.request().url())
      await route.abort('failed')
    })
    const dialog = await openTools(page)
    for (const [name, id] of SCREENS.slice(0, 4)) {
      await selectScreen(dialog, name, id)
      if (id === 'deposito') await dialog.getByRole('button', { name: /^Box 1, posto 1:/ }).click()
      if (id === 'arkadex') await dialog.getByRole('button', { name: /^Numero 1:/ }).click()
      const { portraits } = await assertFitsWithoutScroll(dialog, `${name}: complete official front sprites at 1920×1080`)
      expect(portraits.length, `${name}: official front sprites are visible`).toBeGreaterThan(0)
      expect(animationRequests, `${name}: static consultation must not request native animation media`).toEqual([])
      expect(await savedCampaign(page), `${name}: sprite consultation does not change saved campaign data`).toEqual(before)
      await test.info().attach(`${id}-official-front-sprites-1920x1080`, {
        body: await page.screenshot(), contentType: 'image/png',
      })
    }
  })
})
