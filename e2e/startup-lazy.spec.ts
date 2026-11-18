import { expect, test } from '@playwright/test'

test('the title defers game scenes and loads the laboratory on its first visit', async ({ page }) => {
  const requested: string[] = []
  page.on('request', request => requested.push(new URL(request.url()).pathname))
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Nuova Partita', exact: true })).toBeVisible()
  for (const name of ['LaboratorioScene', 'MappaPrincipaleScene', 'BattagliaScene', 'PercorsoScene', 'CittaScene', 'DepositoScene', 'EvoluzioneScene']) {
    expect(requested.some(url => url.includes(`/scenes/${name}.tsx`)), name).toBe(false)
  }
  expect(requested.some(url => url.includes('/admin/AdminPanel.tsx'))).toBe(false)
  expect(requested.some(url => url.includes('/ui-studio/UiStudioEditor.tsx'))).toBe(false)
  expect(requested.some(url => url.includes('/ui-studio/UiStudioPreview.tsx'))).toBe(false)
  expect(requested.some(url => url.includes('/vfxCuration.ts'))).toBe(false)
  expect(requested.some(url => url.includes('/vfx-curation-runtime.json'))).toBe(false)
  expect(requested.some(url => url.includes('/arkamon-paged/') || url.includes('/sprites/arkamon/'))).toBe(false)
  expect(requested.some(url => url.includes('/scenes/StarterTitleKeyArt.tsx'))).toBe(false)
  expect(requested.some(url => url.includes('/sceneTransitions.css'))).toBe(false)
  await page.getByRole('button', { name: 'Nuova Partita', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Laboratorio del Professore', exact: true })).toBeVisible()
  expect(requested.some(url => url.includes('/scenes/LaboratorioScene.tsx'))).toBe(true)
  expect(requested.some(url => url.includes('/scenes/BattagliaScene.tsx'))).toBe(false)
  await page.getByRole('button', { name: 'Admin', exact: true }).click()
  await expect(page.getByRole('region', { name: 'Modalità Admin', exact: true })).toBeVisible()
  expect(requested.some(url => url.includes('/admin/AdminPanel.tsx'))).toBe(true)
  await test.info().attach('Deferred initial scene requests', { body: JSON.stringify(requested.filter(url => url.includes('/src/')), null, 2), contentType: 'application/json' })
})

test.describe('transition styles load on navigation intent', () => {
  test.use({ reducedMotion: 'no-preference' })

  test('waits for the first stylesheet before covering and then unlocks the destination', async ({ page }) => {
    let releaseStyles!: () => void
    const barrier = new Promise<void>(resolve => { releaseStyles = resolve })
    let requested = false
    await page.route('**/src/components/transitions/sceneTransitions.css*', async route => {
      requested = true
      await barrier
      await route.continue()
    })
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Nuova Partita', exact: true })).toBeVisible()
    expect(requested).toBe(false)
    await page.getByRole('button', { name: 'Nuova Partita', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Laboratorio del Professore', exact: true })).toBeVisible()
    // Starting a new campaign remounts the scene router. Exercise its first real transition.
    await page.evaluate(async () => (await import('/src/store/gameStore.ts')).useGameStore.getState().vaiAScena('titolo'))
    await expect.poll(() => requested).toBe(true)
    await expect(page.locator('[data-presented-scene="laboratorio"]')).toHaveAttribute('aria-busy', 'true')
    await expect(page.locator('[data-scene-transition]')).toHaveCount(0)
    releaseStyles()
    await expect(page.getByRole('button', { name: 'Nuova Partita', exact: true })).toBeVisible()
    await expect(page.locator('[data-presented-scene="titolo"]')).toHaveAttribute('aria-busy', 'false', { timeout: 15_000 })
  })

  test('a stylesheet failure still completes navigation and releases the input lock', async ({ page }) => {
    let blocked = 0
    await page.route('**/src/components/transitions/sceneTransitions.css*', route => { blocked++; return route.abort() })
    await page.goto('/')
    await page.getByRole('button', { name: 'Nuova Partita', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Laboratorio del Professore', exact: true })).toBeVisible()
    await page.evaluate(async () => (await import('/src/store/gameStore.ts')).useGameStore.getState().vaiAScena('titolo'))
    await expect(page.getByRole('button', { name: 'Nuova Partita', exact: true })).toBeVisible()
    await expect(page.locator('[data-presented-scene="titolo"]')).toHaveAttribute('aria-busy', 'false')
    expect(blocked).toBeGreaterThan(0)
    await expect(page.locator('[data-scene-transition]')).toHaveCount(0)
  })
})
