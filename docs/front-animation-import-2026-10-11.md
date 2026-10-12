# Animazioni frontali delle forme 25–33

I **45 nuovi video** forniti l’11 ottobre 2026 sono integrati come attesa, attacco, colpito, vittoria e KO per nove forme. Il totale del gioco passa a **32 forme e 160 animazioni frontali**. Battaglia, Arkadex e laboratorio `#arkamon-lab` leggono lo stesso manifest. I nomi dei diversi stadi seguono il catalogo del gioco; l’ID distingue la forma.

| ID | Arkamon | Finestra logica | Cella RGBA | Rilascio attacco | Reazione al colpo |
| ---: | --- | --- | --- | ---: | ---: |
| 25 | Grimbolt | 256×256 | 704×704 | 53 | 12 |
| 26 | Ampereel | 320×320 | 768×768 | 32 | 14 |
| 27 | Ampereel | 256×256 | 768×768 | 29 | 13 |
| 28 | Silvard | 256×256 | 768×768 | 46 | 21 |
| 29 | Silvard | 320×320 | 768×768 | 45 | 14 |
| 30 | Eclyps | 192×192 | 768×768 | 34 | 15 |
| 31 | Eclyps | 288×288 | 768×768 | 32 | 11 |
| 32 | Blazion | 256×256 | 768×768 | 30 | 25 |
| 33 | Blazion | 320×320 | 768×768 | 45 | 14 |

I marker sono indici originali da zero, scelti osservando fotogrammi consecutivi prima e dopo il rilascio o la reazione. L’evidenza è conservata nei metadati delle azioni e nel [rapporto di provenienza](../animation-source/audits/front-2026-10-11.json).

## Fotogrammi, proporzioni e originali

Tutte le sorgenti sono a **24 FPS**. Vittoria di 26 e Vittoria/KO di 30 contengono 95 fotogrammi; le altre 42 clip ne contengono 96. Sono conservati tutti i **4.317 fotogrammi originali**, nel loro ordine, senza interpolazioni, pose generate o tagli temporali. I cinque video di 28 sono 1280×720; gli altri quaranta sono 1920×1080.

Gli originali in `public/sprites/animation/Front/` e le copie canoniche in `animation-source/raw/{id}/front/` coincidono byte per byte, verificati con SHA-256. Occupano **98.825.881 byte per copia**. Le 45 griglie e i rispettivi poster occupano **343.829.612 byte**. I **391 file runtime** delle 23 forme precedenti sono invariati.

Il formato resta WebP statico lossless RGBA, griglia 10×10. Le texture sono 7040×7040 per 25 e 7680×7680 per le altre otto forme, entro 8192 pixel. Non vengono introdotti atlanti a pagine o un nuovo sistema di distribuzione degli asset.

La scala del corpo deriva dalla prima posa di attesa e dal PNG specifico della specie. Camera per clip costante, scala comune e piano d’appoggio condiviso evitano salti tra le cinque azioni. Il canvas esterno contiene tutte le particelle e i movimenti; il renderer compensa la finestra logica rispetto al padding. La finestra ridotta di Eclyps 30 consente di contenere il fumo esteso del KO mantenendo la dimensione proporzionata nello slot; riguarda la risoluzione del canvas logico, senza ingrandire o ridurre il corpo rispetto alle altre azioni.

La prima posa Colpito di Grimbolt 25 comprende un fulmine isolato a sinistra. La calibrazione del corpo misura `[622,212,1296,871]` ed esclude il fulmine dalla sola misura iniziale; tutti i pixel del fulmine, la loro unione alfa e i fotogrammi restano nell’output. L’evidenza è nel campo `calibrationInspection`.

## Profili di trasparenza

| Forma/azione | Profilo |
| --- | --- |
| 25 attesa | Verde, dominanza |
| 25 attacco e KO | Verde, base |
| 25 colpito e vittoria | Verde, base; fallback del colore del fondale soltanto durante flash che coprono gli angoli |
| 26 e 27, tutte le azioni | Verde, base con conservazione del corpo verde-grigio |
| 28, tutte le azioni; 29 attesa/attacco/colpito/vittoria | Blu, base; verde del soggetto conservato |
| 29 KO | Blu, separazione graduale dell’aura, cutoff alfa 0,02 |
| 30, 31 e 33 attesa | Verde, dominanza |
| 30, 31 e 33 azioni | Verde, base |
| 32 attesa | Verde, dominanza |
| 32 attacco | Verde, dominanza e fringe, con protezione dei nuclei luminosi caldi |
| 32 colpito/vittoria/KO | Verde, base |

I profili sono opzioni esplicite del [convertitore](../scripts/build-arkamon-idle.py). Il percorso verde precedente resta invariato quando non sono attivati. Il canale blu conserva le foglie verdi di Silvard; per Ampereel vengono conservate le scaglie verde-grigio distinguibili dal fondale saturo, mantenendo trasparenti le cavità dello schermo. Il semplice conteggio dei pixel verdi non è quindi un criterio di contaminazione per queste quattro forme.

Grimbolt 25 Colpito usa fallback RGB `[16,243,69]` nei frame 17–22; Vittoria usa `[15,243,71]` nei frame 62–65 e 71–72. Sono colori verificati della stessa clip, usati solo quando gli angoli perdono il colore del fondale. Il flash nativo resta visibile.

Nel KO di Silvard 29 il bordo dell’aura risultava troppo netto con il rifiuto cromatico duro. Il profilo `--soft-blue-screen-rejection` sfuma la separazione nell’intervallo di deviazione dei rapporti 0,02–0,12, con cutoff alfa 0,02. L’unione più ampia entra nel padding già presente: i 96 fotogrammi sono verificati, e camera, scala, appoggio e finestra restano identici. Le altre quattro azioni non cambiano.

## Manutenzione e ritratti

Per rigenerare una sola azione con un profilo differente, usare `--reuse-normalization` e `--actions` con la sola azione richiesta. La geometria viene verificata sulla fonte prima del riuso; una nuova specie senza normalizzazione richiede l’attesa. Scrivere l’output in staging e aggiornare solo l’azione e la corrispondente voce del metadato combinato.

Esempio di riproduzione della sola dissolvenza di 29:

```text
python scripts/build-arkamon-idle.py --species-id 29 --source-dir animation-source/raw/29/front --reuse-normalization public/sprites/arkamon/29/front --actions ko --screen-colour blue --soft-blue-screen-rejection --alpha-cutoff .02 --output .tmp/29-ko-rebuilt
```

FFmpeg è necessario; specificarne il percorso con `--ffmpeg` se non è disponibile nel sistema. Per la calibrazione verificata di 25, riusare i metadati finali e il fallback del colore appropriato alla clip. Il riuso conserva anche marker e nota di calibrazione.

Squadra, Deposito, Arkadex e Analisi possono usare i nove nuovi poster di attesa. [`portraitMetadata.json`](../src/player-ui/portraitMetadata.json) è rigenerato per **110 PNG e 32 poster**, così ciascuna sorgente mantiene la propria inquadratura completa e centrata. Il controllo `node scripts/build-player-portrait-metadata.mjs --check` verifica i 142 riferimenti senza modificarli.

## Limiti delle sorgenti

Fulmini, scie, fiamme e fumo raggiungono già i margini di alcuni video originali. I metadati registrano i relativi fotogrammi; la conversione mantiene tutto il disegno presente e non ricostruisce porzioni assenti fuori dal video. Anche i finali KO conservano quanto realmente filmato: Ampereel 26 resta caduto, altre forme terminano con particelle o fumo, anziché essere forzate a una cella vuota.

Nel soffio di Blazion 32 restano piccoli toni oliva già mescolati alle zone protette dal bagliore caldo. Il profilo fringe riduce gli interstizi contaminati, ma una rimozione più aggressiva cancellerebbe parti delle fiamme. La verifica non presenta il risultato come una separazione cromatica perfetta.

## Verifica

Le prove delle sorgenti e degli asset sono distinte dalla riproduzione nel browser. Il rapporto di provenienza verifica SHA, FPS, conteggi, indici consecutivi, dimensioni, profili e trasformazioni comuni. Il controllo dei pixel decodificati verifica tutti i 4.317 bounding box alfa, i poster identici al fotogramma iniziale e la trasparenza delle celle inutilizzate. Le tavole di confronto comprendono sorgenti e output su fondi chiari, scuri e di battaglia.

Verifiche locali completate il **12 ottobre 2026**:

- **2.374 test superati in 107 file**, con la suite completa eseguita con due worker.
- **34 test Python** dei profili di trasparenza, conservazione del colore e riuso della normalizzazione. Il confronto indipendente delle opzioni predefinite mantiene identico il risultato RGBA di venti casi del convertitore precedente.
- Build TypeScript/Vite riuscita con base GitHub Pages `/Arkamon-Beta/`. Resta l’avviso preesistente sulla dimensione del bundle principale.
- **45 clip provate in Chrome** nella build di produzione: pixel reali del canvas in movimento, 24 FPS nativi, conteggi da 95/96, attesa che ricomincia, azioni che tornano all’attesa e KO che conserva l’ultimo fotogramma.
- **Nove attacchi sincronizzati** con bersaglio animato: caricamento, rilascio, impatto, reazione e completamento nell’ordine previsto.
- **18 controlli di layout**, nove desktop e nove a 390 pixel con dimensione del personaggio al 150%, senza fuoriuscita orizzontale del canvas.
- Prova di battaglia con **Grimbolt 25**: nessun KO o cambio degli HP prima della rivelazione dei dadi; KO del bersaglio, XP con passaggio 14→15 e HP residui conservati, contraccolpo, KO dell’attaccante e vittoria della Suprema nel doppio KO. Eventi del registro senza duplicazioni.
- **Nove regressioni delle sette viste** a 1920×1080, 1920×945 e 1920×900, incluse tutte le 110 specie dell’Arkadex, 32 poster, 78 fallback PNG e un poster mancante. Nessuno scorrimento dei contenitori principali e nessuna mutazione del salvataggio durante la consultazione.
- Controllo dei **142 riferimenti dei ritratti** e `git diff --check` riusciti.

Le prove browser sono state completate in esecuzioni distinte. La prima prova del KO apriva la preview senza lo slash finale della base `/Arkamon-Beta/`, raggiungendo la pagina di errore del server: è stato corretto l’indirizzo nel solo strumento di verifica e ripetuto il solo scenario KO, riuscito senza errori dell’applicazione. Nella prima esecuzione delle nove regressioni UI, la prima prova ha raggiunto il limite di attesa all’avvio, prima della comparsa della scena; le altre otto sono passate. La prova iniziale è poi passata isolatamente sul codice invariato. I risultati non sono presentati come un’unica esecuzione completa senza interruzioni.

La pubblicazione online richiede separatamente merge della PR, workflow di deploy e verifica del sito. Questi risultati attestano l’importazione e la build locali.
