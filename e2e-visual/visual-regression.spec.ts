import { expect, test, type Page } from '@playwright/test'
import { seedCampaign, truncatedTexts } from './fixtures'

/**
 * Audit fase 10: schermate chiave in regressione visiva. Ogni schermata:
 * 1. non deve avere testi visibilmente troncati (controllo sempre attivo);
 * 2. viene confrontata con la sua immagine di riferimento (`toHaveScreenshot`).
 * Le immagini mancanti vengono create alla prima esecuzione (`updateSnapshots: 'missing'`).
 */
const VIEWPORTS = [{ width: 1920, height: 1080 }, { width: 1440, height: 810 }] as const

async function settle(page: Page) {
  await page.evaluate(() => document.fonts?.ready)
  await page.waitForTimeout(400)
}

for (const viewport of VIEWPORTS) {
  test.describe(`${viewport.width}×${viewport.height}`, () => {
    test.use({ viewport })

    test('titolo', async ({ page }) => {
      await page.goto('/')
      await expect(page.getByRole('button', { name: 'Nuova Partita' })).toBeVisible()
      await settle(page)
      expect(await truncatedTexts(page)).toEqual([])
      await expect(page).toHaveScreenshot(`titolo-${viewport.width}.png`, { fullPage: false })
    })

    test('mappa principale', async ({ page }) => {
      await seedCampaign(page, 'mappa-principale')
      await page.goto('/')
      await expect(page.getByRole('button', { name: /Venezia, posizione attuale/ })).toBeVisible()
      await settle(page)
      expect(await truncatedTexts(page)).toEqual([])
      await expect(page).toHaveScreenshot(`mappa-${viewport.width}.png`)
    })

    test('menù Partita', async ({ page }) => {
      await seedCampaign(page, 'mappa-principale')
      await page.goto('/')
      await page.getByRole('button', { name: 'Partita', exact: true }).click()
      await expect(page.getByRole('button', { name: 'Apri Squadra' })).toBeVisible()
      await settle(page)
      expect(await truncatedTexts(page)).toEqual([])
      await expect(page).toHaveScreenshot(`menu-${viewport.width}.png`)
    })

    test('battaglia', async ({ page }) => {
      await seedCampaign(page, 'battaglia')
      await page.goto('/')
      await expect(page.locator('[data-presented-scene="battaglia"]')).toHaveAttribute('aria-busy', 'false')
      await settle(page)
      expect(await truncatedTexts(page)).toEqual([])
      await expect(page).toHaveScreenshot(`battaglia-${viewport.width}.png`)
    })

    test('risultato della battaglia', async ({ page }) => {
      await seedCampaign(page, 'battaglia-finita')
      await page.goto('/')
      await expect(page.locator('[data-battle-result-card]')).toBeVisible()
      await settle(page)
      expect(await truncatedTexts(page)).toEqual([])
      await expect(page).toHaveScreenshot(`risultato-${viewport.width}.png`)
    })
  })
}
