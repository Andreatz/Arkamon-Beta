import { expect, test, type Locator, type Page } from '@playwright/test'

const preview = (page: Page) => page.frameLocator('.uis-canvas iframe')

async function openStudio(page: Page, screen = 'battaglia') {
  await page.setViewportSize({ width: 1920, height: 1080 })
  await page.goto('/#ui-studio')
  await expect(page.locator('.uis-layer').first()).toBeVisible()
  await page.getByLabel('Schermata da modificare', { exact: true }).selectOption(screen)
}

async function selectLayer(page: Page, label: string, kind?: string) {
  await page.getByLabel('Cerca elemento', { exact: true }).fill(label)
  let entry = page.locator('.uis-layer').filter({ has: page.locator('strong', { hasText: new RegExp(`^${label}$`) }) })
  if (kind) entry = entry.filter({ hasText: kind })
  await entry.click()
  await expect(page.getByTestId('ui-studio-selection')).toBeVisible()
}

async function chooseAsset(page: Page, name: string, category = 'Comuni') {
  await page.getByRole('button', { name: 'Scegli asset', exact: true }).click()
  const library = page.getByRole('dialog', { name: 'Scegli asset', exact: true })
  await library.getByLabel('Categoria asset', { exact: true }).selectOption(category)
  await library.getByLabel('Cerca asset', { exact: true }).fill(name)
  await library.getByRole('button', { name: `${name} ${category}`, exact: true }).click()
  await expect(library).toBeHidden()
}

async function original(page: Page) {
  await page.getByRole('button', { name: 'Originale', exact: true }).click()
}

async function assertBackground(target: Locator, file: string) {
  // Known HP templates are sanitized into a vector skin with live game data;
  // their data URL records the original library source for comparison.
  await expect.poll(() => target.evaluate(element => {
    const background = getComputedStyle(element).backgroundImage
    try { return decodeURIComponent(background.replace(/%(?![0-9a-f]{2})/gi, '%25')) }
    catch { return background }
  })).toContain(file)
}

test.describe('Studio UI artwork replaces the existing artwork', () => {
  test.skip(({ isMobile }) => isMobile, 'The layout editor is a desktop workspace.')
  test.setTimeout(120_000)

  test('the enemy and player HP groups replace their frame and texture while preserving the live bar and labels', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await openStudio(page)
    const enemy = preview(page).locator('[data-ui-id="layout.hp-nemico"]')
    const surface = enemy.locator('[data-ui-asset-surface]').first()
    const texture = surface.locator('[data-ui-asset-decoration]')
    const fill = surface.locator('svg rect')
    const track = surface.locator('[data-ui-hp-track]')
    await assertBackground(surface, '/ui/hp_bar_enemy.png')
    await expect(texture).toBeVisible()
    const labels = (await surface.textContent())!.trim()
    const originalFillWidth = await fill.getAttribute('width')
    const originalTexture = await texture.getAttribute('src')
    const trackGeometry = () => track.evaluate(element => {
      const style = getComputedStyle(element)
      return { left: style.left, top: style.top, width: style.width, height: style.height }
    })
    const originalTrackGeometry = await trackGeometry()

    await selectLayer(page, 'HP nemico')
    await chooseAsset(page, 'hp bar enemy')
    await page.getByRole('combobox', { name: 'Adattamento immagine', exact: true }).selectOption('fill')
    await assertBackground(surface, '/ui/studio/Comuni/hp-bar-enemy.svg')
    await expect(enemy).toHaveCSS('background-image', 'none')
    await expect(texture).toBeHidden()
    await expect(surface.locator('svg')).toBeVisible()
    await expect(fill).toHaveAttribute('width', originalFillWidth!)
    expect((await surface.textContent())!.trim()).toBe(labels)
    await test.info().attach('HP nemico: nuova cornice senza sovrapposizione', { body: await page.screenshot({ path: 'output/ui-studio-asset-replacement.png' }), contentType: 'image/png' })

    // Change the real Zustand color observed by HpBar: React must still own the
    // animated health fill after the editor replaces only the surrounding art.
    await preview(page).locator('body').evaluate(async () => {
      const modulePath = '/src/store/adminStore.ts'
      const { useAdminStore } = await import(modulePath)
      useAdminStore.getState().updateColor('hpHigh', '#1122ee')
    })
    await expect(fill).toHaveCSS('fill', 'rgb(17, 34, 238)')
    await assertBackground(surface, '/ui/studio/Comuni/hp-bar-enemy.svg')
    expect((await surface.textContent())!.trim()).toBe(labels)

    await original(page)
    await assertBackground(surface, '/ui/hp_bar_enemy.png')
    await expect(texture).toBeVisible()
    await expect(texture).toHaveAttribute('src', originalTexture!)
    await expect(fill).toHaveCSS('fill', 'rgb(17, 34, 238)')
    await expect.poll(trackGeometry).toEqual(originalTrackGeometry)
    await page.getByRole('button', { name: '↶ Annulla', exact: true }).click()
    await assertBackground(surface, '/ui/studio/Comuni/hp-bar-enemy.svg')
    await expect(texture).toBeHidden()
    await page.getByRole('button', { name: '↷ Ripeti', exact: true }).click()
    await assertBackground(surface, '/ui/hp_bar_enemy.png')
    await expect(texture).toBeVisible()

    const player = preview(page).locator('[data-ui-id="layout.hp-giocatore"]')
    const playerSurface = player.locator('[data-ui-asset-surface]').first()
    const playerLabels = (await playerSurface.textContent())!.trim()
    await selectLayer(page, 'HP giocatore')
    await chooseAsset(page, 'hp bar')
    await assertBackground(playerSurface, '/ui/studio/Comuni/hp-bar.svg')
    await expect(player).toHaveCSS('background-image', 'none')
    await expect(playerSurface.locator('[data-ui-asset-decoration]')).toBeHidden()
    await expect(playerSurface.locator('svg[viewBox="0 0 507 40"]')).toBeVisible()
    expect((await playerSurface.textContent())!.trim()).toBe(playerLabels)
    await original(page)
    await assertBackground(playerSurface, '/ui/hp_bar_player.png')
    await expect(playerSurface.locator('[data-ui-asset-decoration]')).toBeVisible()

    await selectLayer(page, 'HP nemico')
    await chooseAsset(page, 'hp bar enemy')
    await page.getByRole('button', { name: 'Applica al gioco', exact: true }).click()
    await expect(page.getByRole('status')).toContainText('Layout applicato')
    await page.reload()
    await expect(page.locator('.uis-layer').first()).toBeVisible()
    await page.getByLabel('Schermata da modificare', { exact: true }).selectOption('battaglia')
    await assertBackground(surface, '/ui/studio/Comuni/hp-bar-enemy.svg')
    await expect(texture).toBeHidden()
    await expect(surface.locator('[data-ui-hp-labels]')).toContainText('Darklaw')
    await expect(surface.locator('[data-ui-hp-labels]')).toContainText('LV. 21')
    await expect(surface.locator('[data-ui-hp-value]')).toHaveText('36/36')
    expect(errors).toEqual([])
  })

  test('message groups and direct move buttons replace their own background without losing text and type icons', async ({ page }) => {
    await openStudio(page)
    await preview(page).locator('body').evaluate(async () => {
      const modulePath = '/src/store/adminStore.ts'
      const { useAdminStore } = await import(modulePath)
      useAdminStore.getState().setLayoutEditing(true)
    })
    const infoGroup = preview(page).locator('[data-ui-id="layout.box-messaggi"]')
    const info = infoGroup.locator('[data-ui-asset-surface]').first()
    await assertBackground(info, '/ui/infobox.png')
    const messageLines = info.locator('.battle-message-lines')
    await expect(messageLines).toBeAttached()
    await selectLayer(page, 'Box messaggi', 'Gruppo')
    await chooseAsset(page, 'infobox')
    await assertBackground(info, '/ui/studio/Comuni/infobox.svg')
    await expect(infoGroup).toHaveCSS('background-image', 'none')
    await expect(messageLines).toBeAttached()
    await original(page)
    await assertBackground(info, '/ui/infobox.png')

    const move = preview(page).locator('.battle-move-button').first()
    const moveId = (await move.getAttribute('data-ui-id'))!
    const moveText = (await move.textContent())!.trim()
    const typeIcon = move.locator('img')
    const typeSource = await typeIcon.getAttribute('src')
    await page.getByLabel('Cerca elemento', { exact: true }).fill(moveId)
    await page.locator('.uis-layer').first().click()
    await chooseAsset(page, 'infobox')
    await assertBackground(move, '/ui/studio/Comuni/infobox.svg')
    expect((await move.textContent())!.trim()).toBe(moveText)
    await expect(typeIcon).toBeVisible()
    await expect(typeIcon).toHaveAttribute('src', typeSource!)
    await original(page)
    await assertBackground(move, '/ui/move_button.png')
    await expect(typeIcon).toBeVisible()
  })

  test('KitFrame and GameButton replacements still suppress and restore their original border image', async ({ page }) => {
    await openStudio(page, 'menu')
    const diary = preview(page).locator('[data-ui-id="service.journal"]')
    const kitFrame = diary.locator(':scope>.pu-frame')
    await expect(kitFrame).toBeVisible()
    const kitBorder = await kitFrame.evaluate(element => getComputedStyle(element).borderImageSource)
    const diaryText = (await diary.textContent())!.trim()
    await selectLayer(page, 'Apri Diario')
    await chooseAsset(page, 'infobox')
    await assertBackground(kitFrame, '/ui/studio/Comuni/infobox.svg')
    await expect(kitFrame).toHaveCSS('border-image-source', 'none')
    expect((await diary.textContent())!.trim()).toBe(diaryText)
    await original(page)
    await expect(kitFrame).toHaveCSS('border-image-source', kitBorder)

    await page.getByLabel('Schermata da modificare', { exact: true }).selectOption('titolo')
    const command = preview(page).locator('button[data-game-button]').first()
    const gameFrame = command.locator(':scope>.game-button-frame')
    await expect(gameFrame).toBeVisible()
    const border = await gameFrame.evaluate(element => getComputedStyle(element).borderImageSource)
    const label = (await command.textContent())!.trim()
    await selectLayer(page, 'Comando titolo 1')
    await chooseAsset(page, 'infobox')
    await assertBackground(gameFrame, '/ui/studio/Comuni/infobox.svg')
    await expect(gameFrame).toHaveCSS('border-image-source', 'none')
    expect((await command.textContent())!.trim()).toBe(label)
    await original(page)
    await expect(gameFrame).toHaveCSS('border-image-source', border)
    await expect(command).toBeEnabled()
  })

  test('Squadra, Analisi and Arkadex hero skins replace the inset decoration while preserving official portraits', async ({ page }) => {
    test.setTimeout(180_000)
    await openStudio(page, 'squadra')
    for (const screen of ['squadra', 'analisi', 'arkadex']) {
      await page.getByLabel('Schermata da modificare', { exact: true }).selectOption(screen)
      const hero = preview(page).locator('[data-ui-id="hero"]')
      await expect(hero).toBeVisible({ timeout: 45_000 })
      const portrait = hero.locator('svg.pu-creature-art')
      await expect(portrait).toBeVisible()
      const image = portrait.locator('image')
      const originalSource = await image.getAttribute('href')
      const background = await hero.evaluate(element => getComputedStyle(element).backgroundImage)
      const pseudoVisibility = () => hero.evaluate(element => getComputedStyle(element, '::before').visibility)
      await expect.poll(pseudoVisibility).toBe('visible')

      await selectLayer(page, 'Arkamon selezionato', 'Gruppo')
      await chooseAsset(page, 'infobox')
      await assertBackground(hero, '/ui/studio/Comuni/infobox.svg')
      await expect.poll(pseudoVisibility).toBe('hidden')
      await expect(portrait).toBeVisible()
      await expect(image).toHaveAttribute('href', originalSource!)

      await original(page)
      await expect(hero).toHaveCSS('background-image', background)
      await expect.poll(pseudoVisibility).toBe('visible')
      await expect(portrait).toBeVisible()
      await expect(image).toHaveAttribute('href', originalSource!)
    }
  })
})
