import { chromium } from '@playwright/test'
import sharp from 'sharp'
import { mkdir, writeFile, rename, stat } from 'node:fs/promises'
import { join, resolve } from 'node:path'

const URL_ROOT = process.env.ARKAMON_AUDIT_URL || 'http://127.0.0.1:3014'
const OUT = resolve(process.env.ARKAMON_AUDIT_OUTPUT || 'output/visual-audit')
const LIMIT = Number(process.env.ARKAMON_AUDIT_LIMIT || 0)
const BASE_SCREENS = ['titolo','laboratorio','mappa-principale','citta','percorso','mappa-griglia','battaglia','lega','evoluzione','menu','squadra','deposito','arkadex','analisi','borsa','negozio','register','race','recap','journal','backup','settings','chronicles','match','challenges']
const LABS = [
  ['battle-rules-lab','Laboratorio regole'],
  ['audio-lab','Laboratorio audio'],
  ['transition-lab','Laboratorio transizioni'],
  ['vfx-lab','Galleria VFX'],
  ['dice-lab','Laboratorio dadi'],
  ['deposit-lab','Laboratorio deposito'],
  ['arkamon-lab','Laboratorio animazioni'],
  ['ui-studio','Editor UI']
]
const report = { generatedAt: new Date().toISOString(), revision: process.env.GITHUB_SHA || 'local', url: URL_ROOT, entries: [], interactions: [], motion: [], errors: [], network: [] }
const sleep = ms => new Promise(done => setTimeout(done, ms))
const slug = value => value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').slice(0, 90)
const escaped = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

async function takeShot(page, relativeName) {
  const path = join(OUT, relativeName)
  await mkdir(resolve(path, '..'), { recursive: true })
  const jpeg = await page.screenshot({ type: 'jpeg', quality: 80, animations: 'disabled', timeout: 30000 })
  await sharp(jpeg).webp({ quality: 77, effort: 4 }).toFile(path)
  return relativeName
}

function watchPage(page, mode) {
  page.on('pageerror', error => {
    if (report.errors.length < 200) report.errors.push({ mode, kind: 'pageerror', message: error.message })
  })
  page.on('console', message => {
    if (message.type() === 'error' && report.errors.length < 200)
      report.errors.push({ mode, kind: 'console', message: message.text().slice(0, 500) })
  })
  page.on('response', response => {
    if (response.status() >= 400 && report.network.length < 200)
      report.network.push({ mode, status: response.status(), url: response.url().slice(0, 220) })
  })
}

async function registry(browser) {
  const page = await browser.newPage()
  try {
    await page.goto(URL_ROOT + '/', { waitUntil: 'domcontentloaded', timeout: 60000 })
    const data = await page.evaluate(async () => {
      const module = await import('/src/ui-studio/types.ts')
      return { screens: module.UI_STUDIO_SCREENS, views: module.UI_STUDIO_SCREEN_VIEWS }
    })
    return data
  } catch (error) {
    report.errors.push({ mode: 'registry', kind: 'fallback', message: String(error) })
    return { screens: BASE_SCREENS.map(id => [id, id]), views: {} }
  } finally {
    await page.close()
  }
}

async function initPreview(page, fluid) {
  await page.goto(URL_ROOT + '/', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.evaluate((config) => {
    window.__auditReady = false
    window.addEventListener('message', event => {
      if (event.source === document.getElementById('audit-preview-frame')?.contentWindow &&
          event.data?.source === 'arkamon-ui-preview' && event.data?.type === 'ready')
        window.__auditReady = true
    })
    const iframe = document.createElement('iframe')
    iframe.id = 'audit-preview-frame'
    iframe.title = 'Arkamon isolated UI audit'
    iframe.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;border:0;z-index:2147483647;background:#0b1728'
    iframe.src = '/?uiStudioPreview=1' + (config.fluid ? '&uiConceptFluid=1&uiConcept=aurora' : '')
    document.body.appendChild(iframe)
  }, { fluid })
  await page.waitForFunction(() => window.__auditReady === true, null, { timeout: 60000 })
}

async function showScreen(page, screen) {
  await page.evaluate(value => {
    const iframe = document.getElementById('audit-preview-frame')
    iframe.contentWindow.postMessage({ source: 'arkamon-ui-studio', type: 'screen', screen: value }, location.origin)
  }, screen)
  await page.waitForFunction(value => {
    const iframe = document.getElementById('audit-preview-frame')
    const target = iframe?.contentDocument?.querySelector('[data-ui-studio-preview-screen]')
    return target?.getAttribute('data-ui-studio-preview-screen') === value && target.children.length > 0
  }, screen, { timeout: 35000 })
  await page.evaluate(async () => {
    const doc = document.getElementById('audit-preview-frame')?.contentDocument
    if (!doc) return
    await Promise.race([doc.fonts.ready, new Promise(done => setTimeout(done, 1500))])
    const images = Array.from(doc.images).filter(image => image.loading !== 'lazy').slice(0, 80)
    await Promise.race([
      Promise.all(images.map(image => image.decode().catch(() => null))),
      new Promise(done => setTimeout(done, 3200))
    ])
  })
  await sleep(250)
}

async function inspectDocument(page, inFrame) {
  return page.evaluate(isFrame => {
    const doc = isFrame ? document.getElementById('audit-preview-frame')?.contentDocument : document
    if (!doc) return { error: 'Preview document inaccessible' }
    const stage = doc.querySelector('[data-ui-studio-preview-screen]') || doc.body
    const controls = Array.from(stage.querySelectorAll('button,a[href],input,select,textarea,[role="button"],[role="tab"]'))
      .filter(element => {
        const rect = element.getBoundingClientRect()
        return rect.width > 0 && rect.height > 0 && getComputedStyle(element).visibility !== 'hidden'
      })
      .slice(0, 180).map(element => {
        const rect = element.getBoundingClientRect()
        return {
          type: element.tagName.toLowerCase(),
          role: element.getAttribute('role'),
          label: (element.getAttribute('aria-label') || element.getAttribute('title') || element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 85),
          disabled: element.disabled === true || element.getAttribute('aria-disabled') === 'true',
          bounds: [Math.round(rect.x), Math.round(rect.y), Math.round(rect.width), Math.round(rect.height)]
        }
      })
    const images = Array.from(stage.querySelectorAll('img')).slice(0, 250)
    const shell = stage.querySelector('.pu-shell,.local-map-scene') || stage
    return {
      title: doc.title,
      controls, controlCount: controls.length,
      imageCount: images.length,
      brokenImages: images.filter(image => image.complete && image.naturalWidth === 0).map(image => image.getAttribute('src')).slice(0, 25),
      viewportWidth: doc.defaultView.innerWidth,
      viewportHeight: doc.defaultView.innerHeight,
      width: shell.clientWidth,
      scrollWidth: shell.scrollWidth,
      height: shell.clientHeight,
      scrollHeight: shell.scrollHeight,
      horizontalOverflow: Math.max(0, shell.scrollWidth - shell.clientWidth),
      verticalOverflow: Math.max(0, shell.scrollHeight - shell.clientHeight)
    }
  }, inFrame)
}

async function captureMode(browser, mode, screens) {
  const context = await browser.newContext({ viewport: { width: mode.width, height: mode.height }, deviceScaleFactor: 1, reducedMotion: 'reduce', serviceWorkers: 'block' })
  const page = await context.newPage()
  watchPage(page, mode.id)
  try {
    await initPreview(page, mode.fluid)
    for (const item of screens) {
      try {
        await showScreen(page, item.id)
        const metrics = await inspectDocument(page, true)
        const image = await takeShot(page, 'screens/' + mode.id + '/' + slug(item.id) + '.webp')
        report.entries.push({ mode: mode.id, screen: item.id, label: item.label, image, ...metrics })
        console.log('[SCREEN]', mode.id, item.id, 'controls=' + (metrics.controlCount || 0), 'overflow=' + (metrics.horizontalOverflow || 0))
      } catch (error) {
        report.errors.push({ mode: mode.id, screen: item.id, kind: 'capture', message: String(error).slice(0, 700) })
        console.error('[CAPTURE ERROR]', mode.id, item.id, String(error).slice(0, 200))
      }
    }
    if (mode.id === 'aurora-desktop') await testInteractiveStates(page)
  } finally {
    await context.close()
  }
}

async function testInteractiveStates(page) {
  const experiments = {
    squadra: ['Mosse', 'Statistiche', 'Riepilogo'],
    negozio: ['Cure', 'Cattura', 'Tutti'],
    arkadex: ['Mosse', 'Evoluzioni'],
    analisi: ['Mosse', 'Statistiche']
  }
  const frame = page.frameLocator('#audit-preview-frame')
  for (const [screen, actions] of Object.entries(experiments)) {
    for (const label of actions) {
      try {
        await showScreen(page, 'titolo')
        await showScreen(page, screen)
        const tabs = frame.getByRole('tab', { name: label, exact: true })
        const buttons = frame.getByRole('button', { name: label, exact: true })
        const target = (await tabs.count()) ? tabs.first() : buttons.first()
        if ((await target.count()) === 0) {
          report.interactions.push({ screen, action: label, status: 'not-present' })
          continue
        }
        await target.click({ timeout: 8000 })
        await sleep(300)
        const image = await takeShot(page, 'interactions/' + slug(screen + '-' + label) + '.webp')
        report.interactions.push({ screen, action: label, status: 'clicked', image, metrics: await inspectDocument(page, true) })
        console.log('[INTERACTION]', screen, label)
      } catch (error) {
        report.interactions.push({ screen, action: label, status: 'error', detail: String(error).slice(0, 300) })
      }
    }
  }
}

async function captureLabs(browser) {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, reducedMotion: 'reduce', serviceWorkers: 'block' })
  const page = await context.newPage()
  watchPage(page, 'labs')
  try {
    for (const [hash, label] of LABS) {
      try {
        await page.goto(URL_ROOT + '/#' + hash, { waitUntil: 'domcontentloaded', timeout: 60000 })
        await page.waitForTimeout(1300)
        await page.evaluate(async () => { await Promise.race([document.fonts.ready, new Promise(done => setTimeout(done, 1200))]) })
        const image = await takeShot(page, 'labs/' + hash + '.webp')
        report.entries.push({ mode: 'laboratories', screen: hash, label, image, ...(await inspectDocument(page, false)) })
        console.log('[LAB]', hash)
      } catch (error) {
        report.errors.push({ mode: 'laboratories', screen: hash, kind: 'capture', message: String(error).slice(0, 500) })
      }
    }
  } finally {
    await context.close()
  }
}

async function captureMotion(browser, speciesId, animation) {
  const dir = join(OUT, 'motions')
  await mkdir(dir, { recursive: true })
  const context = await browser.newContext({ viewport: { width: 1024, height: 576 }, recordVideo: { dir, size: { width: 1024, height: 576 } }, reducedMotion: 'no-preference' })
  const page = await context.newPage()
  watchPage(page, 'motion-' + speciesId + '-' + animation)
  let recording
  try {
    await page.goto(URL_ROOT + '/', { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.evaluate(async ({ id, action }) => {
      const module = await import('/e2e/native-pages-harness.tsx')
      window.__auditNative = module.mountNativePages(id, action, 'low', false)
    }, { id: speciesId, action: animation })
    await page.locator('[data-sprite-renderer="paged-canvas"]').first().waitFor({ timeout: 30000 })
    await sleep(4400)
    recording = page.video()
  } catch (error) {
    report.errors.push({ mode: 'motion', screen: speciesId + '-' + animation, kind: 'capture', message: String(error).slice(0, 500) })
  } finally {
    await context.close()
  }
  if (recording) {
    try {
      const source = await recording.path()
      const target = join(dir, slug('arkamon-' + speciesId + '-' + animation) + '.webm')
      await rename(source, target)
      const bytes = (await stat(target)).size
      report.motion.push({ speciesId, animation, video: 'motions/' + target.split('/').pop(), bytes })
      console.log('[MOTION]', speciesId, animation, 'bytes=' + bytes)
    } catch (error) {
      report.errors.push({ mode: 'motion', kind: 'video', message: String(error) })
    }
  }
}

async function finalize() {
  await writeFile(join(OUT, 'manifest.json'), JSON.stringify(report, null, 2))
  const rows = report.entries.map(entry => [
    '<article class="shot"><h3>' + escaped(entry.mode + ' / ' + entry.label) + '</h3>',
    '<a href="' + escaped(entry.image) + '"><img loading="lazy" src="' + escaped(entry.image) + '" alt="' + escaped(entry.screen) + '"></a>',
    '<p>' + escaped(entry.screen) + ' · controlli ' + (entry.controlCount || 0) + ' · overflow orizzontale ' + (entry.horizontalOverflow || 0) + 'px · immagini rotte ' + (entry.brokenImages?.length || 0) + '</p></article>'
  ].join('')).join('\n')
  const movies = report.motion.map(item => '<article><h3>' + escaped(item.speciesId + ' ' + item.animation) + '</h3><video controls preload="none" src="' + escaped(item.video) + '"></video></article>').join('\n')
  const index = [
    '<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
    '<title>Arkamon · Visual Audit</title><style>',
    'body{background:#0e1422;color:#e9eef6;font:15px system-ui;margin:0;padding:30px}a{color:#84b9ff}h1{font-size:30px}p{color:#a4b0c2}.gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:18px}.shot{background:#1b2537;border-radius:12px;padding:14px}.shot img{width:100%;height:auto;border-radius:7px}video{width:100%;max-width:720px}header{margin-bottom:28px}',
    '</style><header><h1>Arkamon · Visual Audit</h1><p>Revisione ' + escaped(report.revision) + ' · ' + escaped(report.generatedAt) + '</p>',
    '<p>' + report.entries.length + ' schermate · ' + report.interactions.length + ' prove interattive · ' + report.motion.length + ' clip · ' + report.errors.length + ' problemi/log registrati.</p>',
    '<p>Le schermate di anteprima utilizzano fixture dimostrative: non sono un test completo di tutti i flussi reali.</p>',
    '<p><a href="manifest.json">Dati e metriche JSON</a> · <a href="functional.log">Test funzionali (se eseguiti)</a></p></header>',
    '<section class="gallery">' + rows + '</section><h2>Campioni delle animazioni native</h2>' + movies + '</html>'
  ].join('\n')
  await writeFile(join(OUT, 'index.html'), index)
  const summary = [
    '# Arkamon — visual audit', '',
    '- Revision: ' + report.revision,
    '- Generated: ' + report.generatedAt,
    '- Screenshots: ' + report.entries.length,
    '- Interaction attempts: ' + report.interactions.length,
    '- Motion clips: ' + report.motion.length,
    '- Errors and console diagnostics: ' + report.errors.length,
    '- HTTP errors: ' + report.network.length, '',
    'The captures are generated from isolated UI Studio preview fixtures and the live lab routes.',
    'They do not assert that every game command or broadcast integration works.', '',
    'Open index.html to inspect the image gallery and manifest.json for per-screen controls/overflow.',
    'The functional.log file is generated by the separate Playwright smoke step.', '',
    '## Captures with horizontal overflow', '',
    ...report.entries.filter(item => item.horizontalOverflow > 1).map(item => '- ' + item.mode + '/' + item.screen + ': ' + item.horizontalOverflow + ' px'), '',
    '## Failed captures', '',
    ...report.errors.filter(item => item.kind === 'capture').map(item => '- ' + item.mode + '/' + (item.screen || '') + ': ' + item.message)
  ].join('\n')
  await writeFile(join(OUT, 'SUMMARY.md'), summary)
  console.log('[AUDIT COMPLETE]', report.entries.length, 'screenshots,', report.motion.length, 'videos,', report.errors.length, 'diagnostics')
}

await mkdir(OUT, { recursive: true })
const browser = await chromium.launch({ headless: true })
try {
  const catalog = await registry(browser)
  const all = catalog.screens.map(([id, label]) => ({ id, label }))
  for (const [screen, views] of Object.entries(catalog.views || {})) {
    if (!BASE_SCREENS.includes(screen)) continue
    for (const [id, label] of views) {
      if (id === 'default') continue
      all.push({ id: screen + ':' + id, label: screen + ' · ' + label })
    }
  }
  const subset = LIMIT > 0 ? all.slice(0, LIMIT) : all
  const bases = subset.filter(item => BASE_SCREENS.includes(item.id))
  const modes = [
    { id: 'current-desktop', width: 1920, height: 1080, fluid: false, items: subset },
    { id: 'aurora-desktop', width: 1920, height: 1080, fluid: true, items: subset },
    { id: 'aurora-mobile', width: 390, height: 844, fluid: true, items: bases }
  ]
  for (const mode of modes) await captureMode(browser, mode, mode.items)
  if (LIMIT === 0) {
    await captureLabs(browser)
    for (const [speciesId, animation] of [[13, 'attack'], [13, 'hit'], [1, 'ko']]) await captureMotion(browser, speciesId, animation)
  }
} finally {
  await browser.close()
  await finalize()
}
if (report.entries.length === 0) process.exitCode = 1
