# Splash art di Arkamon

Aggiornamento: **26 ottobre 2026**. Il nome del documento mantiene la data originale per conservare i collegamenti esistenti.

Sono disponibili e integrate in Squadra e Arkadex **110 illustrazioni distinte**, una per ciascuna forma del catalogo. Le due splash mancanti **037 e 038 di Chimzap** sono state generate e collegate. La revisione corrente ha ricomposto **21 dipinti esistenti** nei quali il volto era troppo alto, laterale o incompatibile con la visualizzazione dell’intero sfondo; le altre sorgenti sono conservate.

## Risultato grafico

Squadra e Arkadex mostrano **un unico dipinto nitido che riempie l’intera schermata**. A 16:9 è visibile l’intero canvas sorgente, senza riquadro ridotto, duplicato sfocato, maschera sui bordi o trasformazioni della pittura. Su finestre con un rapporto diverso, il riempimento `cover` comporta il ritaglio naturale dei margini e consente soltanto lo spostamento nei pixel eccedenti: non riduce il dipinto per nascondere un problema di composizione.

Il volto e il busto principale hanno priorità. Orecchie, creste, ali, coda, dita e zampe periferiche possono proseguire dietro i pannelli. I riferimenti approvati **036 Chimzap e 097 Beestrix** conservano la propria immagine. Anche la forma **004** conserva esattamente il dipinto fornito dall’utente. Oniros, Voider ed Eclyps restano riferimenti per presenza e finitura.

Le forme con nuove sorgenti `fullscreen-source-v3` sono:

`003, 008, 012, 015, 026, 034, 037, 038, 041, 048, 049, 058, 060, 061, 065, 066, 069, 084, 085, 092, 093, 094, 107`.

Sono **23 sorgenti**: 21 sostituzioni e 2 prime illustrazioni. Weedrug 048 conserva **cinque teste**, ora raccolte in una composizione frontale con tutte le bocche e gli occhi leggibili. Hoppiox 066 conserva sia il cavaliere sia la cavalcatura; Chimzap 038 conserva quattro braccia. Le scene sono direzioni artistiche, senza introdurre nuova lore canonica.

## Interfaccia e galleria

Le colonne laterali delle due schermate recuperano spazio per il personaggio. Le carte mantengono le loro dimensioni e i caratteri; i comandi rimangono funzionali. Titoli, pannelli e comandi inferiori vengono misurati nel vero `GameDialog`, con un margine di sicurezza di 14–22 pixel. La verifica ammette un pixel di arrotondamento CSS, già interno a tale margine.

La galleria `?uiReferences=1` conserva un viewport logico **1920×1080** per le schermate con splash e adatta proporzionalmente **l’intera anteprima, compresa l’interfaccia**, allo spazio rimasto sotto i propri controlli. Non trasforma il dipinto in un ritaglio ultrapanoramico. Il collegamento «Apri a pieno schermo» apre la schermata fluida effettiva. Su mobile resta il riquadro nitido 16:9 dedicato, separato dai pannelli leggibili.

Il caricamento continua a rispettare selezione, giocatore e scoperta della specie. Immagini non disponibili o non ancora decodificate conservano il ritratto ufficiale; le specie sconosciute non sono rivelate dallo sfondo. Le animazioni native sono un’opzione separata. La galleria usa dati dimostrativi e non modifica il salvataggio protetto della campagna.

## Metadati e provenienza

- `public/backgrounds/arkamon-splash/`: **110 WebP 1920×1080**, 72.084.612 byte, circa **68,75 MiB**.
- [fullscreen-composition-review-2026-10-26.json](../art-source/splash/fullscreen-composition-review-2026-10-26.json): revisione delle 110 composizioni, hash delle sorgenti e misure manuali di volto e busto.
- `art-source/splash/status/`: un record per forma con sorgente, master locale, prompt, dimensioni, hash e rettangoli revisionati.
- `art-source/splash/history/`: versioni precedenti dei record, conservate prima delle sostituzioni e della nuova revisione dell’inquadratura.
- `art-source/splash/prompts/*-fullscreen-source-v3.txt`: prompt delle illustrazioni create con lo strumento integrato `image_gen`.
- `ui-source/splash-artwork.generated.json`: catalogo runtime generato dai soli record approvati; include l’hash di ciascuna immagine, quindi una nuova pittura cambia la revisione del catalogo anche se percorso e coordinate rimangono uguali.
- `output/splash-art/originals/` e `output/splash-fullscreen-2026-10-26/`: master PNG e copie locali delle revisioni; `output/` è ignorata da Git.

I master del generatore misurano **1672×940 o 1672×941**. Il derivato 1920×1080 viene esportato con adattamento proporzionale al rapporto esatto e qualità WebP 94; non è descritto come master nativo Full HD o 4K. Le precedenti 76 rigenerazioni del personaggio troppo piccolo restano documentate in [source-scale-review-2026-10-26.json](../art-source/splash/source-scale-review-2026-10-26.json), anche quando una successiva revisione fullscreen sostituisce quel dipinto.

La policy `full-canvas-focus` conserva misure reali normalizzate di volto e busto e vieta `displayScale` e `displayOffset`. Le fasce nominali sono guide artistiche: la verifica nell’apertura reale dell’interfaccia decide se il soggetto entra. Un volto troppo grande o laterale rimane un problema esplicito, senza restringere artificialmente il rettangolo per ottenere un esito positivo. `subjectBounds` contiene l’area critica e può essere conservativo; i rettangoli sono revisioni visive, non segmentazioni automatiche dei pixel.

`scripts/save-regenerated-splash.mjs --fullscreen` importa anche forme prima assenti, conserva lo storico e non aggiunge compensazioni. `scripts/apply-splash-fullscreen-review.mjs` verifica tutti gli hash prima di aggiornare i record; rifiuta misure relative a sorgenti sostituite. Lo script storico di ridimensionamento salta i record già migrati.

## Verifica corrente

Il catalogo verificato ha SHA-256 **`0f7695efd0f30574354f19284056a99d5b937cacb40e83b303ecddddba166bfd`**. Solo rapporti con questa impronta e policy `cover-only-v2`, con prove di copertura dell’intero canvas, attestano la versione corrente.

|Ambito|Copertura|Esito|
|---|---|---|
|Galleria reale a viewport esterno 1366×768|110 forme × 2 schermate = **220 casi**, canvas logico 1920×1080|Passata: zero problemi di focus, overflow, renderer ed errori JavaScript|
|Build compilata|110 forme × 2 schermate × 3 risoluzioni = **660 casi**|Passata: zero problemi di focus, overflow, caricamento, salvataggio o renderer|
|Browser: selezione, caricamento, privacy, ridimensionamento e mobile|**72 test** su tre progetti desktop|Passati, nessun test saltato o instabile|
|Geometria, caricamento e importazione|**32 test**|Passati|
|Pipeline catalogo|**24 test**|Passati|
|Build web|TypeScript, Vite e verifica del pacchetto|Passata: 455 clip native, pacchetto locale 784,0 MiB|

La build è stata controllata a **1366×768, 1600×900 e 1920×1080**. Ogni caso controlla sorgente, caricamento, focus, pannelli, scorrimento globale, salvataggio protetto e livello grafico unico a pieno schermo. Sono stati anche aperti e ispezionati visivamente gli screenshot correnti di RS-219 041 nell’Arkadex, Chimzap 037 nella Squadra, Chimzap 038 nell’Arkadex e Weedrug 048 nella Squadra a 1366×768: tutte e cinque le facce sono leggibili. La copertura automatica di tutte le forme non viene descritta come un’ispezione manuale di ogni screenshot.

Rapporti locali:

- `output/splash-art/gallery-autofit-audit.json`.
- `output/splash-art/built-ui/measurements.json` e screenshot nella stessa cartella.
- `output/splash-art/interaction-and-gallery-results.json` per i 72 test browser; `output/splash-art/results.json` per i 12 test fullscreen e mobile ripassati dopo la correzione finale dei titoli.
- `output/splash-art/fullscreen-source-audit/` per tavole, misure e confronti.

I primi rapporti diagnostici della galleria ultrapanoramica e del layout intermedio sono conservati come prove storiche e non attestano la versione corrente. Il [piano di produzione](../art-source/splash/production-plan.json) riporta la copertura corrente di tutte le 110 forme alle tre risoluzioni desktop.

## Riproduzione

```text
node scripts/catalog-splash-artwork.mjs --check
node --test scripts/__tests__/catalog-splash-artwork.test.mjs
npx vitest run scripts/__tests__/save-regenerated-splash.test.mjs src/player-ui/__tests__/splashFraming.test.ts src/player-ui/__tests__/splashArtwork.test.tsx
node scripts/verify-splash-gallery-ui.mjs
SPLASH_ALL_FORMS=1 node scripts/verify-built-splash-ui.mjs
npx playwright test --config e2e/splash-artwork.config.ts e2e/splash-artwork.spec.ts e2e/splash-fullscreen.spec.ts e2e/splash-responsive-framing.spec.ts
node scripts/sync-splash-source-review.mjs
node scripts/sync-splash-production.mjs
```

Gli script usano il server locale 3054 e la build compilata su 3055 con base `/Arkamon-Beta/`, configurabili tramite `SPLASH_GALLERY_URL` e `SPLASH_PREVIEW_URL`. Il pin dei media resta `11eb8edfcaad86d2d6d59fcdfbc77682d1dc8367`. Questa revisione riguarda l’integrazione locale; build, commit, push e pubblicazione rimangono stati distinti.
