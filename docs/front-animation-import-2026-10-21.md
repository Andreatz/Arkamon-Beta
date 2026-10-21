# Animazioni frontali: forme 82–91

Importazione locale del 21 ottobre 2026. **Convertite e integrate 50 nuove clip per le forme 82–91; conservazione storica, provenienza, test unitari e prove automatiche nel browser verificati.** Il catalogo completo comprende 91 forme, 455 clip e 43.667 fotogrammi nativi. Build, pin della libreria media, push e deploy restano in attesa, come indicato nel riepilogo dei controlli.

## Sorgenti e fedeltà temporale

Il gruppo comprende **10 forme, 50 video e 4.799 fotogrammi nativi**. Ogni forma dispone delle cinque azioni attesa (`idle`), attacco (`attack`), colpito (`hit`), vittoria (`victory`) e KO (`ko`). Tutti i filmati sono H.264, **1920×1080 a 24 FPS**. Le 49 clip ordinarie hanno 96 fotogrammi, pari a 4.000 ms; il KO di **83, Cerebron**, ha 95 fotogrammi, pari a 3.958,333… ms, con indici da 0 a 94. Inventario, decodifica e verifica indipendente confermano questi conteggi.

Le sorgenti fornite si trovano in `C:/Users/andre/Desktop/GitHub/Arkamon-Beta/public/sprites/animation/Front`. I file con il nome fornito sono copiati in `public/sprites/animation/Front/{id} {action}.mp4` del checkout di lavoro e nelle sorgenti canoniche `animation-source/raw/{id}/front/{action}.mp4`. L'inventario locale `source-inventory.json` registra dimensione e SHA-256 dei 50 originali; la verifica indipendente ha confrontato con successo tutte e tre le copie di ciascuna clip.

Si conserva ciascun fotogramma originale nell'ordine nativo, con campionamento consecutivo da 0 a `frameCount - 1` e frequenza originale. Non si aggiungono fotogrammi, interpolazioni, inversioni o ricostruzioni. Solo l'attesa è ciclica; attacco, colpito e vittoria tornano all'attesa, mentre il KO mantiene **l'ultimo fotogramma effettivamente presente nella sorgente**, anche se il corpo è uscito dall'inquadratura o si è dissolto. Il mantenimento del finale viene collaudato nel renderer; non richiede una sagoma visibile nell'ultimo frame.

## Trasparenza, scala e canvas

La forma **82** usa il fondale blu per conservare le alghe e gli altri dettagli verdi del personaggio; le forme **83–91** usano il fondale verde. Il profilo rimane conservativo per preservare bagliori, fumo, motion blur e particelle semitrasparenti. Nella forma 86 gli accenti gialli e verde lime delle braccia appartengono al soggetto: una pulizia aggressiva basata sulla predominanza del verde potrebbe rimuoverli o modificarli. I colori ciano e turchesi delle altre forme devono restare distinti dal fondale.

Il convertitore può usare un colore di fondale esplicito quando gli effetti contaminano il campione agli angoli. Il profilo e l'eventuale ricorso al fallback sono registrati nei metadati; la revisione delle immagini convertite ne valuta il risultato su sfondo chiaro e scuro. Il campionamento della sorgente rimane un'evidenza distinta dal collaudo della trasparenza finale.

Le cinque azioni di ogni forma condividono la scala e il piano di appoggio derivati dall'attesa e dal front PNG ufficiale. La camera resta costante all'interno della singola clip. La finestra logica del corpo è **192×192 pixel per tutti i dieci nuovi set**; il canvas trasparente è più grande per contenere il movimento e gli effetti di tutti i fotogrammi. La tabella del catalogo riporta le geometrie lette dai metadati finali, con canvas da 512 a 704 pixel per lato e posizione del viewport al loro interno. Il limite degli atlanti rimane 8192 pixel per lato.

Per **82 e 91** viene usata l'opzione `--fit-initial-body`: la scala segue il corpo opaco della prima posa dell'attesa, evitando che particelle lontane rendano il personaggio troppo piccolo. Tutti i movimenti e gli effetti nativi continuano a contribuire al padding del canvas; l'opzione non elimina particelle e non ritaglia il video al corpo. Per 91 la normalizzazione finale misura **190,32 pixel** di altezza del corpo iniziale nel viewport logico da 192 pixel; la prima conversione che dimensionava anche le particelle dell'attesa è stata sostituita prima della generazione delle pagine. La revisione delle tavole campionate della forma 82 ha trovato leggibili i dettagli a 192 pixel e coerenti scala e appoggio delle cinque pose iniziali. Tale osservazione riguarda i campioni aperti e non certifica ogni fotogramma o la riproduzione nel browser.

Atlanti, poster e pagine runtime sono immagini WebP statiche lossless RGBA. Il confronto lossless riguarda i pixel dopo rimozione del fondale e ridimensionamento, non l'equivalenza con i pixel RGB del video 1080p originale. Il convertitore controlla tutti i pixel RGBA dell'atlante; il generatore delle pagine controlla tutti i pixel visibili e l'intero canale alfa. La verifica indipendente conferma i poster identici al primo frame, le celle inutilizzate trasparenti, la corrispondenza del finale nelle pagine e le impronte di ogni pagina nuova. Le pagine coprono tutti i frame consecutivamente, con un massimo misurato di **16 MiB decodificati per pagina**.

## Marker osservati

I marker sono stati scelti osservando fotogrammi consecutivi delle sorgenti native. `releaseFrame` indica il primo rilascio esterno riconoscibile dell'attacco; `reactionFrame` indica il primo impatto visibile secondo le evidenze della specifica clip. Il movimento preparatorio, la carica e le sfere già tenute in mano non valgono automaticamente come rilascio o impatto. La forma 88 usa il primo nucleo d'impatto ben definito con contraccolpo, dopo il fulmine in arrivo; la 91 usa il primo grande anello d'impatto sul corpo.

Gli indici partono da zero. Il tempo esatto è `indice / 24 × 1000` ms; i valori nella tabella sono arrotondati a tre decimali. Le scelte osservate sono conservate in `outputs/animation-import-2026-10-21/markers.json` della cartella di lavoro, con il confronto del frame precedente, del marker e del successivo. La verifica indipendente conferma frame, tempi ed evidenze nei metadati individuali e nel set completo; i test nel browser controllano l'emissione dei marker durante la riproduzione.

| ID | Nome | Frame Attesa / Attacco / Colpito / Vittoria / KO | Rilascio attacco | Tempo attacco (ms) | Reazione | Tempo reazione (ms) | Canvas definitivo | Viewport: sinistra, alto |
|---:|---|---|---:|---:|---:|---:|---|---|
| 82 | Reliskull | 96 / 96 / 96 / 96 / 96 | 33 | 1.375,000 | 11 | 458,333 | 576×576 | 190, 200 |
| 83 | Cerebron | 96 / 96 / 96 / 96 / 95 | 36 | 1.500,000 | 23 | 958,333 | 576×576 | 192, 178 |
| 84 | Psycroak | 96 / 96 / 96 / 96 / 96 | 34 | 1.416,667 | 19 | 791,667 | 640×640 | 224, 201 |
| 85 | Psycroak | 96 / 96 / 96 / 96 / 96 | 35 | 1.458,333 | 26 | 1.083,333 | 512×512 | 159, 153 |
| 86 | Teslat | 96 / 96 / 96 / 96 / 96 | 39 | 1.625,000 | 20 | 833,333 | 704×704 | 256, 253 |
| 87 | Teslat | 96 / 96 / 96 / 96 / 96 | 27 | 1.125,000 | 20 | 833,333 | 640×640 | 224, 216 |
| 88 | Teslat | 96 / 96 / 96 / 96 / 96 | 24 | 1.000,000 | 14 | 583,333 | 512×512 | 160, 159 |
| 89 | Espeiry | 96 / 96 / 96 / 96 / 96 | 49 | 2.041,667 | 19 | 791,667 | 704×704 | 256, 243 |
| 90 | Espeiry | 96 / 96 / 96 / 96 / 96 | 27 | 1.125,000 | 13 | 541,667 | 512×512 | 160, 140 |
| 91 | Espeiry | 96 / 96 / 96 / 96 / 96 | 27 | 1.125,000 | 23 | 958,333 | 576×576 | 189, 192 |

## Limiti visivi delle sorgenti e dell'estrazione

I seguenti punti distinguono comportamenti già presenti nei video originali e imperfezioni residue osservate dopo l'estrazione del fondale. Il padding conserva la porzione di effetto presente nella sorgente; non ricostruisce parti già fuori campo. Le lievi tinte e i piccoli blocchi residui del keying restano documentati come limiti della separazione dal fondale compresso.

- **82, KO:** il personaggio si rompe in legno, detriti e bandiere e scende oltre il bordo inferiore del video. Al frame 95 restano bolle e detriti senza un corpo integro. Il taglio inferiore durante l'uscita è nativo. Il finale mantiene quel frame effettivo.
- **83, KO:** dopo la dissoluzione, il frame finale 94 contiene un fondale quasi vuoto e minuscoli residui. Dopo il keying il finale può risultare quasi invisibile o trasparente. Non viene sostituito con un frame precedente contenente il corpo. Su fondo chiaro alcuni riccioli di fumo semitrasparente conservano una lieve tinta grigioverde, possibile residuo dei pixel già mescolati con il fondale verde; nelle tavole campionate non sono stati osservati un rettangolo verde pieno o buchi nel corpo opaco. Nel colpito alcune gocce viola raggiungono o oltrepassano i bordi laterali nativi.
- **84, attacco:** il proiettile e i fulmini ciano escono dal bordo sinistro intorno ai frame 42–48. La loro continuazione fuori campo manca già nel video. Il KO conserva invece un corpo visibile disteso e stelle gialle al frame 95.
- **85, attacco e colpito:** proiettile e fulmini viola raggiungono i bordi sinistro, superiore e inferiore; intorno al frame 40 del colpito, le grandi diramazioni elettriche attraversano anche gli altri bordi. Nell'attacco l'ampia aura grigioviola semitrasparente presenta bordi rettilinei sinistro e inferiore quando raggiunge il rettangolo dell'MP4; anche l'esplosione KO raggiunge i confini nativi. Sono limiti visibili della composizione sorgente e della sua estrazione, distinti dalla scala del corpo; eliminarli aggressivamente potrebbe distruggere bagliori e diramazioni sottili. Un effetto che raggiunge gli angoli può rendere necessario il fallback del fondale. Il finale KO conserva il corpo disteso.
- **86, attacco, vittoria e KO:** falci, anelli e frammenti raggiungono i confini nativi. Nella vittoria, intorno al frame 72, alcuni frammenti scuri o verdi hanno cromia simile al fondale e non sono recuperabili con certezza tramite il solo keying. Nel KO il corpo disteso visibile intorno al frame 72 si dissolve; il frame finale 95 ha solo residui minimi e può risultare quasi invisibile dopo la rimozione del fondale.
- **87, attacco:** gli effetti elettrici ampi richiedono di conservare il padding. Nelle sorgenti esaminate non è stato osservato un ulteriore taglio del corpo.
- **88, attacco:** l'anello verticale intorno ai frame 72–75 raggiunge ed è tagliato dal bordo inferiore originale; il corpo rimane visibile.
- **89, attacco, colpito e KO:** il raggio esce dal bordo sinistro intorno ai frame 52–60; si conserva il taglio nativo senza restringere ulteriormente il canvas. Nei frame 77 e 86 del colpito, la punta rosa della coda appare temporaneamente staccata dal tratto blu, comportamento verificato anche nei fotogrammi originali. Intorno al frame 69 del KO, il bordo tenue della grande aura ciano mostra gradini e piccole macchie rettangolari dopo l'estrazione dal verde compresso, soprattutto sullo sfondo scuro. È un'imperfezione locale del keying; corpo e nucleo luminoso restano integri e non si dichiara una matte perfetta.
- **90:** le ampie falci e il lampo viola del KO sono effetti nativi e richiedono padding e trasparenze morbide. Nei campioni della sorgente non è stato osservato un taglio del corpo.
- **91, colpito:** le scie orizzontali intorno ai frame 42–57 arrivano al bordo destro del filmato; il corpo rimane all'interno.

La revisione visiva comprende **110 tavole**: per ciascuna delle dieci forme, le cinque azioni su fondo chiaro e scuro e il confronto delle cinque pose iniziali sul canvas comune. Sono inoltre stati esaminati i marker su fotogrammi consecutivi originali e i dettagli dei limiti indicati sopra. Le tavole sono campionamenti: la revisione non equivale all'osservazione manuale di tutti i 4.799 fotogrammi. Aloni, bloom morbidi e motion blur sono stati confrontati con la sorgente e rimangono documentati nei report; una matte perfetta non è presunta.

## Integrazione e conservazione

Battaglia e laboratorio `#arkamon-lab` leggono lo stesso manifest esplicito, aggiornato con geometrie e marker dei nuovi set. **Squadra, Deposito, Arkadex e Analisi mantengono i front PNG ufficiali**; aggiungere animazioni non sostituisce le immagini statiche di gestione.

Prima dell'importazione sono stati registrati il manifest delle **405 clip precedenti** e le impronte di **5.931 file**: 4.990 pagine runtime, 405 atlanti, 405 poster e 131 PNG frontali numerati, inclusi i 110 front ufficiali del catalogo. La verifica indipendente conferma **tutte le 405 voci profondamente identiche e tutti i 5.931 file invariati per dimensione e SHA-256**, per 5.827.589.537 byte confrontati. Il perimetro delle impronte è quello dei file elencati nella baseline e non comprende tutti i vecchi metadati JSON.

Il catalogo integrato comprende **91 forme, 455 clip, 43.667 fotogrammi nativi e 5.430 pagine runtime**: alle precedenti 38.868 immagini e 4.990 pagine si aggiungono 4.799 immagini e **440 pagine**. Le dimensioni definitive dei canvas sono riportate nella tabella del catalogo.

Le pagine sono state generate in tre gruppi isolati, **82–85, 86–88 e 89–91**, con il generatore già presente nel progetto. I tre processi sono terminati con codice 0. Prima dell'unione sono stati validati ogni manifest parziale, l'identità delle 405 voci storiche e il rapporto di conservazione dei pixel delle nuove clip. L'unione completa ha verificato i totali di 455 clip e 43.667 fotogrammi e ha pubblicato atomicamente il manifest finale. Non sono stati modificati gli strumenti di generazione delle pagine né ricodificate le 405 clip storiche.

## Collaudo ed evidenze

Le evidenze locali dell'importazione sono raccolte in `outputs/animation-import-2026-10-21/` nella cartella di lavoro, esterna al checkout. L'audit persistente è stato creato in `animation-source/audits/front-2026-10-21.json` e comprende provenienza, marker, geometrie, conteggi, risultati della conservazione e i due report visivi completi. Il report indipendente `preservation-verification.json` termina con stato `passed` e zero errori.

| Verifica | Perimetro previsto | Stato |
|---|---|---|
| Inventario e provenienza | 50 originali, copie con nome fornito e sorgenti canoniche; SHA-256 e dimensioni | Superato per tutte le 150 copie |
| Decodifica e tempo nativo | 49×96 + 83/KO×95; 24 FPS, indici consecutivi e durata | Superato: 50 clip e 4.799 frame |
| Geometria e normalizzazione | Scala/appoggio comuni, camera costante, canvas/viewport definitivi; fit iniziale di 82 e 91 | Superato per le 50 clip |
| Pixel convertiti e pagine | RGBA lossless secondo il convertitore; poster al primo frame, celle vuote trasparenti, copertura e limite 16 MiB | Superato nel perimetro dei confronti descritto sopra; 440 nuove pagine |
| Conservazione storica | 405 voci precedenti identiche; byte e SHA-256 dei 5.931 file di baseline | Superato per tutte le voci e i file della baseline |
| Marker | 20 marker osservati, metadati individuali/set e riproduzione | Trascrizione verificata e prove browser superate |
| Revisione visiva | Tavole chiare/scure e pose iniziali delle dieci forme; confronto dei limiti nativi | 110 tavole esaminate; campionamento e limiti documentati |
| Regressioni Python del convertitore | Keying, conservazione e codifica lossless; `scripts/test_arkamon_key.py` | 36/36 test superati; esecuzione comunicata dal coordinatore |
| Strumenti Node: controlli mirati | Packing, pubblicazione atomica, confezionamento release e web, revisione pinnata e impronte | 30/30 test superati in quattro file; log `node-tests.log` |
| Test unitari completi | Contratti esatti 91 forme/455 clip, eccezione 83/KO, runtime e regressioni del progetto | **4.069/4.069 test superati in 162 file**, codice 0; log `vitest-full.log` |
| TypeScript | Controllo `tsc --noEmit` | Superato con codice 0; esecuzione comunicata dal coordinatore |
| Build | Compilazione con il nuovo catalogo | In attesa |
| Browser desktop | Tutte le forme 82–91, ciascuna con cinque azioni, marker, ritorno all'attesa e finale KO | Dieci prove singole e due prove nel laboratorio superate |
| Viewport mobile | Campione 82, 85, 88 e 91; altre sei forme escluse soltanto dal progetto mobile | Quattro prove singole e due prove nel laboratorio superate; sei esclusioni intenzionali |
| Laboratorio reale | Confronti 82/91 e 85/88 a velocità ordinaria, sequenza completa e rilascio/ripristino del confronto | Superato su desktop e viewport mobile; entrambi i renderer a 24 FPS |
| Budget runtime | Massimo 32 MiB di cache decodificata e due decodifiche attive nelle prove singole; budget del laboratorio rispettato | Superato nei test automatici previsti |

Playwright ha raccolto **24 test: 18 superati e sei esclusioni intenzionali**, con codice di uscita 0. I test singoli del banco di prova usano la riproduzione accelerata a 2× per contenere il tempo di collaudo, mantenendo le asserzioni sui metadati nativi a 24 FPS. Le prove nel vero laboratorio usano la velocità ordinaria e verificano 24 FPS su entrambi i renderer. Controllano inoltre il rilascio del confronto durante l'attacco e il suo ripristino a sequenza conclusa, marker emessi una sola volta, durata, caricamento delle pagine, assenza di errori e finale KO fermo sul frame reale. Un viewport mobile automatico non certifica prestazioni su telefoni fisici, OBS o hosting.

Il controllo della forma 82 distingue le piccole alghe del personaggio dal fondale blu: richiede assenza di residui dominanti blu e una quantità minima dedicata di pixel verdi opachi, superiore a 300. Nei cinque poster iniziali ne sono stati misurati 427–524, coerenti con le alghe visibili nel corpo a scala logica 192. Le altre forme con fondale blu mantengono la soglia già presente di oltre 1.000 pixel verdi; il controllo dedicato di 82 non riduce i requisiti storici. Le 15 verifiche mirate della forma 82 e la successiva suite completa sono superate. Quest'ultima comprende 4.069 test in 162 file e ha impiegato 106,67 secondi; le esecuzioni mirate sono riportate separatamente e non costituiscono test aggiuntivi da sommare al totale completo.

## Pubblicazione della libreria media

La conversione locale, il collaudo, i commit, il push e il deploy sono passaggi distinti. Per produrre una release coerente si applica l'ordine previsto dal progetto:

1. Completare conversione, metadati, manifest, audit e verifiche; registrare in un commit gli asset e il manifest definitivi.
2. Eseguire `npm run media:pin` oppure `node scripts/pin-media-release.mjs` sul commit degli asset, con il manifest corrispondente a quello registrato.
3. Registrare in un secondo commit il pin aggiornato `src/data/media-release.json`.
4. Eseguire gli eventuali passaggi di confezionamento, build, push e pubblicazione previsti, riportandone separatamente gli esiti.

**Release, pin definitivo, push e deploy di questa importazione sono in attesa.** Questo documento non attribuisce ai nuovi asset uno stato di pubblicazione sulla base della sola presenza nel checkout.
