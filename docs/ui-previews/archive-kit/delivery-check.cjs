const { chromium } = require('@playwright/test');
const fs = require('fs'), path = require('path'), assert = require('assert'), crypto = require('crypto');
const base = process.env.UI_PREVIEW_URL || 'http://127.0.0.1:3010/docs/ui-previews/archive-kit/';
const ids = ['squadra','deposito','arkadex','analisi','menu','borsa','negozio'];
const catalog = JSON.parse(fs.readFileSync(path.join(__dirname,'assets/vector/catalog.json'),'utf8').replace(/^\uFEFF/,''));
const nativeFiles = new Set(catalog.assets.map(asset => asset.file));
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const sourceProof=JSON.parse(fs.readFileSync(path.join(__dirname,'quality/archive-import.json'),'utf8'));
assert(sourceProof.passed&&sourceProof.sourceSVGCount===47&&sourceProof.allFileHashesMatchIncoming);
const sourceHashes=new Map(sourceProof.assets.map(asset=>[asset.id,asset.sha256]));
const archiveHashes=new Map(catalog.assets.map(asset=>{
  const copied=fs.readFileSync(path.join(__dirname,'assets/vector',asset.file));
  assert.equal(sourceHashes.get(asset.id),digest(copied),'Runtime file differs from the verified user archive: '+asset.file);
  assert.equal(digest(copied),asset.sha256,'Reindexed catalog hash is stale: '+asset.file);
  return [asset.file,sourceHashes.get(asset.id)];
}));
(async () => {
  const browser = await chromium.launch({headless:true, channel:'chrome'});
  const page = await browser.newPage({viewport:{width:390,height:844}});
  page.setDefaultTimeout(120000);
  const errors=[], failed=[], runtimeRequests=[], runtimes=[];
  let phase = 'runtime';
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => failed.push(request.url()));
  page.on('request', request => { if(phase==='runtime') runtimeRequests.push(request.url()); });
  const result = {passed:false, scope:'Published user archive SVG prototype at '+base, nativeCatalogAssets:catalog.assets.length};
  try {
    let active=null, rows=null, circles=null;
    for(const id of ids){
      await page.setViewportSize({width:id==='negozio'?390:1920,height:id==='negozio'?844:1080});
      const response = await page.goto(base+'#'+id);
      if(response) assert.equal(response.status(),200,id);
      await page.locator('.content').waitFor();
      await page.locator('.nav-button.active[data-page="'+id+'"]').waitFor();
      await page.evaluate(()=>document.fonts.ready);
      await page.evaluate(()=>Promise.all([...document.images].map(image=>image.decode())));
      if(id==='negozio'){
        active = await page.locator('.nav-button.active > .kit-frame').evaluate(element=>{
          const computed=getComputedStyle(element), rect=element.getBoundingClientRect();
          return {display:computed.display,kit:element.dataset.kit,borderImageSource:computed.borderImageSource,
            childSVGCount:element.querySelectorAll('svg').length,width:rect.width,height:rect.height};
        });
        assert(active.display!=='none'&&active.kit==='button-primary','Active mobile frame is absent');
        assert(active.width>0&&active.height>0,'Active mobile frame has no visible area');
        assert(active.borderImageSource.includes('/assets/vector/button-primary.svg'),'Mobile active frame is not the native SVG');
        assert.equal(active.childSVGCount,0,'Legacy bitmap nine-slice SVG children remain');
      }
      if(id==='deposito'){
        rows = await page.locator('.box-slot').evaluateAll(elements=>elements.map(element=>{
          const rect=element.getBoundingClientRect();return {x:rect.x,y:rect.y,width:rect.width,height:rect.height};
        }));
        circles = await page.locator('.box-slot > .kit-bg').evaluateAll(elements=>elements.map(element=>{
          const rect=element.getBoundingClientRect();return {x:rect.x,y:rect.y,width:rect.width,height:rect.height};
        }));
        assert(rows.length>=35,'Deposit slots missing');
        assert.equal(circles.length,rows.length,'Deposit portrait frames missing');
        for(let index=0;index<rows.length-7;index++){
          assert(rows[index].y+rows[index].height<=rows[index+7].y+.1,'Deposit rows overlap');
          assert(circles[index].y+circles[index].height<=circles[index+7].y+.1,'Deposit circle frames overlap vertically');
        }
      }
      const state=await page.evaluate(()=>({
        title:document.querySelector('.page-head h1')?.textContent,
        brokenImages:[...document.images].filter(image=>!image.naturalWidth).map(image=>image.src),
        inlineBitmapElements:[...document.querySelectorAll('svg image,svg feImage')].length,
        nativeKitImages:[...document.querySelectorAll('.kit-sprite img')].map(image=>image.src),
        frames:[...document.querySelectorAll('.kit-frame')].map(element=>({id:element.dataset.kit,source:getComputedStyle(element).borderImageSource}))
      }));
      assert.equal(state.brokenImages.length,0,'Broken image in '+id);
      assert.equal(state.inlineBitmapElements,0,'A bitmap is embedded in SVG DOM in '+id);
      assert(state.nativeKitImages.every(url=>url.includes('/assets/vector/')&&url.endsWith('.svg')),'A kit sprite is not native SVG in '+id);
      assert(state.frames.every(frame=>frame.source.includes('/assets/vector/')&&frame.source.includes('.svg')),'A kit frame is not native SVG in '+id);
      runtimes.push({id,title:state.title,nativeKitImages:state.nativeKitImages.length,nativeFrames:state.frames.length,inlineBitmapElements:state.inlineBitmapElements});
    }
    const circleLayoutChecks=[];
    for(const [width,height] of [[1920,1080],[390,844]]){
      for(const id of ids){
        await page.setViewportSize({width,height});
        await page.goto(base+'#'+id);
        await page.locator('.nav-button.active[data-page="'+id+'"]').waitFor();
        await page.evaluate(()=>Promise.all([...document.images].map(image=>image.decode())));
        const circleImages=await page.locator('.kit-circle > .kit-bg').evaluateAll(elements=>elements.map(element=>{
          const image=element.querySelector('img');
          if(!image) return {kit:element.dataset.kit,missingImage:true};
          const span=element.getBoundingClientRect(),img=image.getBoundingClientRect(),computed=getComputedStyle(image);
          return {kit:element.dataset.kit,src:image.src,span:{x:span.x,y:span.y,width:span.width,height:span.height},
            image:{x:img.x,y:img.y,width:img.width,height:img.height},position:computed.position,
            maximumRectDifference:Math.max(Math.abs(span.x-img.x),Math.abs(span.y-img.y),Math.abs(span.width-img.width),Math.abs(span.height-img.height))};
        }));
        assert(circleImages.length>0,'No circle frame images found in '+id+' at '+width);
        assert(circleImages.every(circle=>!circle.missingImage&&circle.span.width>0&&circle.span.height>0&&circle.maximumRectDifference<=.5),
          'A native circle SVG image is shifted or oversized in '+id+' at '+width+': '+JSON.stringify(circleImages.filter(circle=>circle.missingImage||circle.maximumRectDifference>.5)));
        assert(circleImages.every(circle=>circle.src.includes('/assets/vector/circle-')&&circle.src.endsWith('.svg')),
          'A circle frame is not from the exact native SVG archive in '+id);
        circleLayoutChecks.push({id,viewport:[width,height],circleImages:circleImages.length,
          maximumRectDifference:Math.max(...circleImages.map(circle=>circle.maximumRectDifference)),passed:true});
      }
    }
    const providedPNGRequests=runtimeRequests.filter(url=>{
      const pathname=decodeURIComponent(new URL(url).pathname);
      return /\/assets\/provided\/.*\.png$/i.test(pathname);
    });
    assert.equal(providedPNGRequests.length,0,'Provided PNG requested by the runtime: '+providedPNGRequests.join(', '));
    phase='gallery';
    await page.setViewportSize({width:1440,height:1000});
    await page.goto(base+'#overview');
    await page.locator('.screen-link').first().waitFor();
    const screenLinks=await page.locator('.screen-link').count(); assert.equal(screenLinks,ids.length);
    await page.evaluate(()=>Promise.all([...document.images].map(image=>image.decode())));
    const broken=await page.evaluate(()=>[...document.images].filter(image=>!image.naturalWidth).map(image=>image.src));
    assert.equal(broken.length,0,'Overview image missing');
    await page.goto(base+'assets.html');
    await page.locator('#grid .asset').first().waitFor();
    const count=await page.locator('#grid .asset').count();
    assert.equal(count,catalog.assets.length,'Gallery differs from the current native catalog');
    const nativeResponses=[];
    const assets=[...catalog.assets];
    for(let start=0;start<assets.length;start+=4){
      await Promise.all(assets.slice(start,start+4).map(async asset=>{
        const url=base+'assets/vector/'+encodeURIComponent(asset.file);
        const response=await page.request.get(url);
        assert.equal(response.status(),200,url);
        const body=await response.body();
        assert.equal(digest(body),archiveHashes.get(asset.file),'Served SVG differs from the user archive: '+asset.file);
        const text=body.toString('utf8');
        assert(!/<(?:[\w-]+:)?(?:image|feImage|foreignObject|script)\b/i.test(text),'Bitmap/foreign/script element in '+asset.file);
        assert(!/data\s*:/i.test(text),'Embedded data resource in '+asset.file);
        assert(/<(?:[\w-]+:)?(?:path|rect|circle|ellipse|polygon|polyline|line)\b/i.test(text),'No native geometry in '+asset.file);
        nativeResponses.push({file:asset.file,status:response.status(),bytes:body.length,sha256:digest(body),archiveMatched:true});
      }));
    }
    const docs=await page.request.get(base+'design-guide.html');assert.equal(docs.status(),200);
    assert.equal(errors.length,0,'JavaScript errors remain');assert.equal(failed.length,0,'Network requests failed');
    Object.assign(result,{passed:true,activeMobileNavigation:active,depositRowsSeparated:true,
      depositCircleFramesSeparated:true,depositSlots:rows.length,overviewScreens:screenLinks,
      nativeGalleryAssets:count,nativeAssetsAvailable:nativeResponses.length,nativeResponses,
      exactArchiveCopiesVerified:archiveHashes.size,exactArchiveHTTPHashesVerified:nativeResponses.filter(value=>value.archiveMatched).length,
      nativeCircleLayoutChecks:circleLayoutChecks,nativeCircleSVGsAlignedWithSpans:circleLayoutChecks.every(check=>check.passed),
      runtimeScreens:runtimes,providedPNGRequests,providedBitmapsRequestedAtRuntime:false,
      runtimeRequestsObserved:runtimeRequests.length,
      runtimeNativeSVGRequests:[...new Set(runtimeRequests.filter(url=>url.includes('/assets/vector/')&&new URL(url).pathname.endsWith('.svg')))].length,
      guideAvailable:true,errors,failedRequests:failed});
  }catch(error){
    Object.assign(result,{passed:false,error:error.message,errors,failedRequests:failed,runtimeScreens:runtimes});
    process.exitCode=1;
  }finally{
    await browser.close();
    fs.writeFileSync(path.join(__dirname,'delivery-check.json'),JSON.stringify(result,null,2));
    console.log(JSON.stringify(result,null,2));
  }
})().catch(error=>{console.error(error.message);process.exitCode=1;});
