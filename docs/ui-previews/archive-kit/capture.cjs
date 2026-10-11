const previewBase = process.env.UI_PREVIEW_URL || 'http://127.0.0.1:3010/docs/ui-previews/archive-kit/';
const {chromium}=require('@playwright/test');
const fs=require('fs');const path=require('path');
(async()=>{const browser=await chromium.launch({headless:true,channel:"chrome"});const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));const results=[];
for(const [i,id] of ['squadra','deposito','arkadex','analisi','menu','borsa','negozio'].entries()){
  await page.goto(previewBase+'#'+id);await page.evaluate(()=>document.fonts.ready);await page.locator('.content').waitFor();await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>null))));await page.waitForTimeout(250);
  const status=await page.evaluate(()=>({width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,brokenImages:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src),overflow:[...document.querySelectorAll('.content *')].filter(e=>{if(e.closest(".dex-scroll,.kit-frame,.kit-sprite"))return false;const r=e.getBoundingClientRect();return r.right>innerWidth+1||r.bottom>innerHeight-28&&r.width>100&&r.height>20}).map(e=>({tag:e.tagName,cls:e.className,bottom:Math.round(e.getBoundingClientRect().bottom)})).slice(0,12)}));
  await page.screenshot({path:path.join(__dirname,'screens',`${i+1}-${id}.png`)});results.push({id,...status});
}
const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
for(const [i,id] of ['squadra','deposito','arkadex','analisi','menu','borsa','negozio'].entries()){
  await mobile.goto(previewBase+'?export='+id+'#'+id);await mobile.locator('.content').waitFor();await mobile.evaluate(()=>document.fonts.ready);await mobile.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>null))));await mobile.screenshot({path:path.join(__dirname,'mobile',`${i+1}-${id}.png`),fullPage:true});
}
await page.goto(previewBase+'#overview');await page.locator('.overview-grid').waitFor();await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>null))));await page.screenshot({path:path.join(__dirname,'screens','overview.png'),fullPage:true});
await page.goto(previewBase+'assets.html');await page.locator('#grid .asset').first().waitFor();await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>null))));await page.screenshot({path:path.join(__dirname,'screens','asset-catalog.png'),fullPage:true});
await browser.close();fs.writeFileSync(path.join(__dirname,'desktop-verification.json'),JSON.stringify({errors,results},null,2));console.log(JSON.stringify({errors,results},null,2));})();
