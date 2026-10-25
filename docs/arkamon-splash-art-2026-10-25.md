# Splash art di Arkamon

Aggiornamento: **25 ottobre 2026**.

L’ambito confermato è di **110 opere distinte**, una per ciascuna forma del catalogo. Sono disponibili e collegate alla UI locale **108 splash**. Le forme **037 e 038 di Chimzap** non hanno ricevuto un’immagine dal generatore integrato, che ha restituito `moderation_blocked` in fase di output anche dopo una seconda richiesta dello stesso soggetto. Restano escluse dal catalogo delle splash e usano il ritratto ufficiale. La serie completa di 110 non viene dichiarata conclusa.

## Criterio grafico attuale

L’ultima indicazione dell’utente sostituisce il precedente vincolo della sagoma intera nella fascia centrale: **volto e busto devono essere grandi, centrali e ben leggibili**, come nell’immagine `C:/Users/andre/Downloads/Sprite/4.png`. Ali, coda, corna e arti periferici possono passare dietro i pannelli. Il riferimento è stato integrato direttamente per la forma 004 di Vyrath.

Ogni record distingue `subjectBounds`, rettangolo conservativo della sagoma nel dipinto, da `focusBounds`, area critica di volto e busto. Sono stime da revisione visiva, non segmentazioni automatiche. La prova nel browser proietta l’area critica sullo sfondo realmente renderizzato e la confronta con pannelli, titoli, didascalie, navigazione e comandi.

Le opere precedenti sono conservate. Dove la creatura risultava piccola, `displayScale` e `displayOffset` definiscono un ingrandimento uniforme e uno spostamento dell’intero dipinto. Non deformano la creatura. La superficie dello sfondo contiene questo livello ingrandito, impedendogli di estendere la pagina o introdurre barre laterali.

## File e provenienza

- `public/backgrounds/arkamon-splash/`: **108 WebP**, complessivamente **71.804.682 byte**, circa **68,48 MiB**.
- `art-source/splash/status/`: record per tutte le 110 forme, comprese le due generazioni bloccate. Per le opere presenti sono registrati sorgente, versione, dimensioni, hash SHA-256, prompt, rettangoli visivi e inquadratura.
- `art-source/splash/prompts/`: prompt originali e revisioni. I prompt precedenti con soggetto piccolo sono documentazione storica; i nuovi prompt `hero-focus` seguono l’ultima indicazione.
- `art-source/splash/hero-framing-review.json`: revisione delle inquadrature di 72 dipinti precedenti.
- `ui-source/splash-artwork.generated.json`: catalogo minimo usato dal gioco, derivato esclusivamente dai record approvati.
- `output/splash-art/originals/`: master e versioni precedenti conservati localmente. `output/` è ignorata da Git.

I derivati sono **1920×1080, 16:9**. I master restituiti dal generatore sono normalmente **1672×941** e vengono adattati al rapporto esatto durante l’esportazione. I derivati non sono descritti come master nativi Full HD o 4K. WebP usa qualità 94; la compressione dei colori è con perdita.

Le scene e le palette ambientali sono direzioni artistiche. Non introducono habitat, relazioni o altra lore canonica. Il disegno ufficiale della specifica forma resta il riferimento per anatomia e colori.

## Comportamento nel gioco

Le splash compaiono in **Squadra e Arkadex**, seguendo la selezione della specie e del giocatore. L’immagine viene mostrata solo dopo la decodifica completa. In attesa del caricamento, in caso di errore o in assenza di una splash, rimane il ritratto ufficiale.

Il grande ritratto centrale non viene duplicato sopra una splash già pronta. I ritratti compatti nelle liste rimangono quelli del pacchetto PNG dell’utente. Le specie ancora da scoprire non vengono rivelate dall’illustrazione. Le animazioni native rimangono un’opzione separata nell’Arkadex.

Su desktop lo sfondo mantiene le proporzioni. L’inquadratura preferita viene adattata all’apertura realmente libera tra elenco, scheda, titolo e comandi, con un margine di 14–22 pixel. Prima viene corretto lo spostamento; lo zoom si riduce soltanto quando l’area di volto e busto non entra nello spazio disponibile. L’adattamento si aggiorna anche al ridimensionamento della finestra, al caricamento dei caratteri e al montaggio della schermata. Lo sfondo rimane nascosto fino alla prima misura valida; uno sfondo ambientale sfocato riempie le eventuali fasce esterne senza alterare la figura nitida.

Su mobile l’illustrazione viene presentata in uno spazio 16:9 dedicato, evitando di ingrandire uno sfondo orizzontale fino a coprire una pagina verticale.

L’anteprima `?uiReferences=1` contiene il selettore **Arkamon dello splash** per Squadra e Arkadex. I parametri `screen` e `splash` consentono di aprire direttamente una forma. L’anteprima modifica soltanto i dati dimostrativi in memoria e conserva i salvataggi reali.

## Controlli e riproduzione

Il catalogo rifiuta file mancanti, hash cambiati, rapporti errati, ID fuori catalogo e inquadrature che portano il focus sotto le aree della UI. Le prove di caricamento coprono il cambio G1/G2, le specie sconosciute e l’errore di caricamento.

Le misure delle singole forme si trovano in `output/splash-art/catalog-ui/<risoluzione>/measurements.json`. Ciascun rapporto elenca esplicitamente gli ID controllati, le due schermate e gli eventuali problemi. Il riepilogo versionato in `art-source/splash/production-plan.json` viene aggiornato da questi rapporti; un file presente non equivale automaticamente a una verifica UI conclusa.

### Correzione dopo la segnalazione del volto coperto

La precedente verifica di 648 combinazioni è **storica e superata**: utilizzava rettangoli troppo stretti in alcune immagini e non copriva l’iframe più basso della galleria effettivamente usata dall’utente. A 1366×768, la galleria lascia al gioco circa 1328×551 pixel: le trasformazioni fisse non tenevano conto del titolo e dei pannelli in questa disposizione.

Sono stati ampliati i riferimenti visivi di **041 RS-219, 049 Constrix, 052 Leafrex, 060 Shabyss, 061 Wailoom, 069 Lickard, 104 Boomrock e 108 Aka-shin**, includendo fronte, muso e corpo centrale. Le immagini originali restano intatte. Il nuovo adattamento usa la geometria del dialogo reale, anche nell’anteprima incorniciata.

La nuova verifica completa è registrata in `output/splash-art/gallery-autofit-audit.json`; la suite di regressione della galleria conserva immagini e misure in `output/splash-art/responsive-ui/`. Copre i casi critici in entrambe le schermate a 1366×768, 1440×900 e 1920×1080, oltre al ridimensionamento della stessa finestra fino a 1200×800. Le misure confrontano l’immagine effettivamente dipinta con i pannelli reali e con l’apertura protetta. I rettangoli restano stime revisionate visivamente, non segmentazioni automatiche dei pixel della creatura.

Esito dell’audit attuale: **108 forme × 2 schermate = 216 combinazioni nella galleria reale a 1366×768**, con zero sovrapposizioni del focus, zero overflow globale del contenitore e zero errori JavaScript. La distanza minima misurata dai pannelli è **15,935 pixel**. Sono stati inoltre controllati visivamente 004, 049, 069, 104 e 108 in entrambe le schermate. I **48 casi di regressione** distribuiti sulle tre risoluzioni sono passati; due primi avvii hanno richiesto una ripetizione dopo timeout di caricamento, distinta dai controlli geometrici. La navigazione dei test attende ora il documento e poi esplicitamente immagine, caratteri e inquadratura pronti.

Il controllo dell’overflow globale non certifica la leggibilità di tutte le righe: nell’iframe molto basso della galleria, l’indice Arkadex conserva una compressione verticale preesistente, separata dalla correzione dell’inquadratura.

I rapporti nuovi dichiarano `measured-ui-gap-v1` e l’hash del catalogo. Il piano di produzione non riconosce più i precedenti rapporti statici come prova dell’inquadratura attuale.

Le prove sulla build compilata si trovano in `output/splash-art/built-ui/`. Gli screenshot sono render reali dei componenti del gioco, con controlli e informazioni separati dal dipinto.

La verifica della build compilata controlla **28 combinazioni**: forme 004, 020, 049, 069, 104, 108 e 110, in Squadra e Arkadex, a 1366×768 e 1920×1080. Il controllo applicativo mirato comprende **26 test** di geometria e caricamento; la pipeline del catalogo comprende **18 test**, inclusa la riduzione uniforme delle immagini con volto molto grande.

```text
node scripts/catalog-splash-artwork.mjs --check
node --test scripts/__tests__/catalog-splash-artwork.test.mjs
npx playwright test --config e2e/splash-artwork.config.ts
npx playwright test --config e2e/splash-artwork.config.ts e2e/splash-responsive-framing.spec.ts
node scripts/verify-built-splash-ui.mjs
node scripts/sync-splash-production.mjs
```

La build locale ha verificato **455 clip native**, con pacchetto di **783,7 MiB** e pin dei media `11eb8edfcaad86d2d6d59fcdfbc77682d1dc8367`. La build è distinta da commit, push e pubblicazione.
