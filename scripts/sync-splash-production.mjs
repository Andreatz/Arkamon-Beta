import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
const root=process.cwd(),file=path.join(root,'art-source/splash/production-plan.json')
const plan=JSON.parse(await fs.readFile(file,'utf8'))
const records=await Promise.all((await fs.readdir(path.join(root,'art-source/splash/status'))).filter(name=>name.endsWith('.json')).map(async name=>JSON.parse(await fs.readFile(path.join(root,'art-source/splash/status',name),'utf8'))))
const byId=new Map(records.map(record=>[record.id,record]))
const catalog=JSON.parse(await fs.readFile(path.join(root,'ui-source/splash-artwork.generated.json'),'utf8'))
const catalogSha256=createHash('sha256').update(await fs.readFile(path.join(root,'ui-source/splash-artwork.generated.json'))).digest('hex')
const currentReport=report=>report.framingPolicy==='measured-ui-gap-v1'&&report.catalogSha256===catalogSha256
const published=new Set(catalog.map(entry=>entry.speciesId)),generated=records.filter(record=>record.outputFile),blocked=records.filter(record=>record.status==='generation-blocked')
const reports=[]
for(const project of ['desktop','compact','fullhd']){
  try { const report=JSON.parse(await fs.readFile(path.join(root,'output/splash-art/catalog-ui',project,'measurements.json'),'utf8')); reports.push({project,date:report.date,inspectedScreens:report.inspectedScreens,ids:report.catalogIds,current:currentReport(report),passed:currentReport(report)&&report.catalogIds.length>0&&report.issues.length===0&&report.errors.length===0,resultFile:'output/splash-art/catalog-ui/'+project+'/measurements.json'}) } catch {}
}
try {
  const resultFile='output/splash-art/gallery-autofit-audit.json'
  const report=JSON.parse(await fs.readFile(path.join(root,resultFile),'utf8'))
  reports.push({project:'gallery-compact',date:report.date,inspectedScreens:report.inspectedScreens,ids:report.catalogIds,current:currentReport(report),passed:currentReport(report)&&report.catalogIds.length===published.size&&report.inspectedScreens===published.size*2&&report.faceIssues.length===0&&report.layoutIssues.length===0&&report.errors.length===0,resultFile})
} catch {}
const validated=entry=>reports.filter(report=>report.passed&&report.ids.includes(entry.id)).map(report=>report.project)
const validatedDesktop=entry=>validated(entry).filter(project=>['desktop','compact','fullhd'].includes(project))
plan.purpose='Produzione e integrazione delle splash 16:9 con priorita a volto e torso, secondo il riferimento4.png fornito dall’utente.'
Object.assign(plan.scope,{productionStatus:blocked.length?'partial-external-generation-block':'generated-awaiting-ui-review',progressNote:generated.length+' immagini disponibili su110; '+published.size+' pubblicate nel catalogo locale; '+blocked.length+' bloccate dal generatore. Il completamento UI si ricava dai rapporti per risoluzione.'})
Object.assign(plan.production,{
  compositionPolicy:'hero-focus',subjectSafeZone:{appliesTo:'Face and main torso only; wings, tail and peripheral limbs may be covered by UI.',xPercent:[31,65],yPercent:[23,80],reference:'C:/Users/andre/Downloads/Sprite/4.png'},
  previousFullSilhouetteRule:'Superseded by the user on25October2026. Preserved small paintings may use reviewed uniform displayScale/displayOffset; originals are retained.',
  futureUiZones:{leftPercent:[0,30],rightPercent:[66,100],topNonessentialPercent:[0,23],bottomNonessentialPercent:[80,100]},
  completedArtIds:generated.map(record=>record.id).sort((a,b)=>a-b),completedArtCount:generated.length,
  publishedArtIds:[...published].sort((a,b)=>a-b),publishedArtCount:published.size,
  blockedArtIds:blocked.map(record=>record.id),pendingArtCount:110-generated.length,integrationInProgressIds:[],revisionRequestedArtIds:[],productionPaused:false,
  commonPrompt:'Original cinematic painterly fantasy illustration16:9. Exact official form anatomy and colors. Large central figure like the user reference4.png. Face and main torso clearly readable between live panels. Wings, tail and peripheral limbs may extend behind the UI. No text or baked interface. A distinct painting for each catalog form.',
  sharedRules:['The user prioritizes a large readable face and torso over visibility of every extremity.','Use the exact official frontPNG for each form.','One distinct artwork for each of110catalog forms, including forms with the same name.','Environment and lighting proposals are editorial art direction, not canonical lore.','Never alter gameplay statistics, evolution data, native animations or compact portrait identity.','Export1920x1080WebP; preserve source paintings and generation prompts.','Publish only explicit reviewed records; verify projected face/torso bounds in the live interface.'],
  qaChecklist:['Review exact official form identity and the painted face/main torso.','Verify1920x1080decoded16:9 derivative andSHA256.','Verify the projected focus in Squadra and Arkadex at1366x768,1440x900,1920x1080.','Check title and panel overlaps, content overflow, image loading, player switching and undiscovered species privacy.','Keep generated image counts, local publication, browser validation, build, commit and push as distinct states.'],
  runtimeFraming:{policy:'measured-ui-gap-v1',marginPixels:[14,22],protectedRegion:'Actual opening between roster/index, dossier, title, lower caption and commands. Recomputed on resize, font loading and lazy screen changes.',catalogSha256},
  uiValidationInProgressIds:generated.filter(record=>validatedDesktop(record).length<3).map(record=>record.id),
  qualityCheckpoint:{policy:'hero-focus',reports,scope:'Only matching catalog SHA256 and measured-ui-gap-v1 reports establish current validation. Earlier static framing reports are historical and superseded.',validatedAtAllThreeResolutions:generated.filter(record=>validatedDesktop(record).length===3).map(record=>record.id)}
})
for(const entry of plan.entries){
  const record=byId.get(entry.id)
  Object.assign(entry,{artStatus:record?.status??'pending',integrationStatus:published.has(entry.id)?validatedDesktop(entry).length===3?'ui-validated-three-desktop-sizes':validated(entry).includes('gallery-compact')?'ui-validated-compact-gallery':'published-local-awaiting-full-ui-check':'official-portrait-fallback',
    fileExistsAtAudit:!!record?.outputFile,sourcePromptFile:record?.promptFile??null,sourceOriginalFile:record?.sourceMaster??null,exportDimensions:record?.outputFile?{width:record.width,height:record.height}:null,
    compositionSafeZone:{policy:'hero-focus',faceAndTorsoXPercent:[31,65],faceAndTorsoYPercent:[23,80],peripheralAnatomyMayBeCovered:true},
    sourceStatusFile:'art-source/splash/status/'+entry.paddedId+'.json',uiValidatedProjects:validated(entry)})
}
plan.updatedAt=new Date().toISOString()
await fs.writeFile(file,JSON.stringify(plan,null,2)+'\n')
const rows=plan.entries.map(entry=>'|'+entry.paddedId+'|'+entry.name+'|'+entry.artStatus+'|'+entry.integrationStatus+'|').join('\n')
const text='# Produzione splash Arkamon\n\nAggiornamento: 25 ottobre 2026. Ambito confermato: 110 illustrazioni distinte, una per forma.\n\n**'+generated.length+'/110 immagini disponibili**, '+published.size+' collegate alla UI locale. Le forme '+blocked.map(record=>String(record.id).padStart(3,'0')).join(' e ')+' non hanno ricevuto un’immagine dal generatore e conservano il ritratto ufficiale. Nessuna di esse viene dichiarata completata.\n\nIl criterio attuale è **volto e torso grandi e leggibili**, come in 4.png fornito dall’utente. Ali, coda e arti periferici possono finire dietro i pannelli. Il precedente obbligo della sagoma intera nella fascia centrale è superato. Le opere più piccole sono conservate e ricevono un’inquadratura proporzionale esplicita dove necessario.\n\nFonti: [piano completo](./production-plan.json), [revisioni di inquadratura](./hero-framing-review.json), record individuali in status/. Le cartelle output/splash-art/originals e output/splash-art/catalog-ui conservano originali e prove locali; sono ignorate da Git.\n\nLe scene sono proposte artistiche e non introducono nuova lore. Nessun dato di gioco viene alterato. I WebP 1920×1080 sono esportazioni da master del generatore normalmente 1672×941; non sono presentati come master nativi Full HD o 4K.\n\n|ID|Forma|Stato art|Integrazione|\n|---|---|---|---|\n'+rows+'\n'
await fs.writeFile(path.join(root,'art-source/splash/production-plan.md'),text)
console.log(JSON.stringify({generated:generated.length,published:published.size,blocked:blocked.map(record=>record.id),validationReports:reports.map(report=>({project:report.project,passed:report.passed,forms:report.ids.length}))}))
