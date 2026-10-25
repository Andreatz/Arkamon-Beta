import { chromium } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'
import { splashGeometry } from '../e2e/helpers/splashGeometry.ts'
const origin=process.env.SPLASH_PREVIEW_URL??'http://127.0.0.1:3055/Arkamon-Beta/'
const catalog=JSON.parse(await fs.readFile('ui-source/splash-artwork.generated.json','utf8'))
const directory=path.resolve('output/splash-art/built-ui')
await fs.mkdir(directory,{recursive:true})
const browser=await chromium.launch({headless:true}),results=[],issues=[]
try{
  for(const viewport of [{width:1366,height:768},{width:1920,height:1080}]){
    const page=await browser.newPage({viewport,reducedMotion:'reduce'})
    page.on('pageerror',error=>issues.push(error.message))
    await page.addInitScript(()=>localStorage.setItem('arkamon-save','protected-built-splash-inspection'))
    for(const id of [4,20,49,69,104,108,110])for(const screen of ['squadra','arkadex']){
      const artwork=catalog.find(entry=>entry.speciesId===id)
      await page.goto(origin+'?uiStudioPreview=1&uiConceptFluid=1&uiConcept=aurora&screen='+screen+'&splash='+id)
      const root=page.locator('.pu-shell[data-reference-splash-ready="true"][data-reference-splash-species="'+id+'"]')
      await root.waitFor({timeout:30_000})
      await root.filter({has:page.locator('[data-splash-source]')}).waitFor()
      await page.waitForFunction(()=>document.querySelector('.pu-shell')?.getAttribute('data-splash-frame-ready')==='true')
      await root.evaluate(async element=>{await document.fonts.ready;await Promise.all([...element.querySelectorAll('img')].map(image=>image.decode()));await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))})
      const metrics=await splashGeometry(root,screen,artwork.focusBounds??artwork.subjectBounds)
      if(metrics.panels.some(panel=>panel.overlap.width>1&&panel.overlap.height>1))issues.push(viewport.width+'/'+id+'/'+screen+': critical region overlaps UI')
      if(metrics.layout.rootScrollWidth>metrics.layout.rootClientWidth+2||metrics.layout.contentScrollWidth>metrics.layout.contentClientWidth+2||metrics.layout.contentScrollHeight>metrics.layout.contentClientHeight+2)issues.push(viewport.width+'/'+id+'/'+screen+': overflow')
      if(!metrics.source.endsWith(artwork.src))issues.push('Built artwork URL differs from the reviewed source')
      if(await page.evaluate(()=>localStorage.getItem('arkamon-save'))!=='protected-built-splash-inspection')issues.push('Built preview changed protected campaign storage')
      const screenshot=viewport.width+'-'+String(id).padStart(3,'0')+'-'+screen+'.png'
      await page.screenshot({path:path.join(directory,screenshot),animations:'disabled'})
      results.push({viewport,id,screen,screenshot,...metrics})
    }
    await page.close()
  }
}finally{await browser.close()}
const report={date:new Date().toISOString(),origin,inspectedScreens:results.length,issues,results}
await fs.writeFile(path.join(directory,'measurements.json'),JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({inspectedScreens:results.length,issues,result:'output/splash-art/built-ui/measurements.json'}))
if(issues.length)process.exitCode=1
