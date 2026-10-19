# Animazioni frontali: forme 22, 54, 55 e 61–81

Importazione locale completata e verificata il 19 ottobre 2026. I limiti visivi delle sorgenti e la copertura effettiva dei controlli sono indicati sotto.

## Sorgenti e fedeltà temporale

Sono stati individuati e decodificati integralmente **120 nuovi video per 24 forme**. Tutti sono 1920×1080 a 24 FPS. Ogni forma comprende attesa, attacco, colpito, vittoria e KO, per **11.519 fotogrammi originali**.

La Vittoria della forma **79** contiene 95 fotogrammi (3.958,333 ms); le altre 119 clip ne contengono 96 (4.000 ms). Si applica la scelta dell’utente di conservare i fotogrammi nativi: niente duplicati, interpolazioni, inversioni, ricostruzioni o correzioni automatiche del raccordo. Soltanto l’attesa è ciclica; attacco/colpo/vittoria rientrano in attesa, mentre KO mantiene l’ultimo fotogramma reale.

I file forniti si trovano nella cartella `public/sprites/animation/Front` del checkout principale dell’utente. Le copie nell’attuale checkout e le sorgenti canoniche `animation-source/raw/{id}/front/{action}.mp4` vengono confrontate tramite SHA-256. Il nome originale **69 hiy.mp4** viene mantenuto nella copia fornita e associato all’azione canonica `hit.mp4`, senza rinominare l’originale. La stessa compatibilità con `36 defeat.mp4` resta valida per l’importazione storica.

## Trasparenza, scala e immagini

Le forme **54, 69 e 70** hanno il fondale blu e conservano foglie/corpo verdi. Le altre usano il profilo verde di base. Quando un flash copre gli angoli, il convertitore può usare il colore del fondale campionato dalla posa iniziale originale, soltanto nei fotogrammi privi di un campione affidabile agli angoli. Il riferimento e i frame interessati sono registrati nei metadati.

Le cinque azioni condividono scala, appoggio e finestra logica derivati dall’attesa e dal front PNG ufficiale. La camera di ciascuna clip è costante. L’unione alfa di tutti i fotogrammi determina lo spazio esterno alla finestra logica: gli effetti presenti nel video restano nel canvas, entro atlanti di 8192 pixel per lato. Il renderer dimensiona il corpo attraverso la finestra logica, anche quando l’effetto richiede un ampio padding.

Gli originali restano archiviati a 1920×1080. Il corpo usa una finestra logica di 192×192 pixel per 22 nuovi set e di 256×256 per le forme 55 e 61, con un canvas trasparente più ampio quando necessario; non si tratta di 120 filmati 1080p riprodotti direttamente. La fedeltà temporale conserva ogni fotogramma, mentre il controllo lossless confronta i pixel delle immagini RGBA convertite e delle pagine runtime, dopo il ridimensionamento e la rimozione del fondale.

Le immagini sono WebP statiche lossless RGBA. Il convertitore verifica l’uguaglianza dei pixel decodificati; i poster corrispondono alla prima posa e le celle inutilizzate sono trasparenti. L’opzione `--webp-method` regola soltanto lo sforzo di compressione: il valore predefinito 1 riduce il costo di codifica, mentre 4 riproduce lo sforzo storico. Una regressione confronta RGBA e alfa esatti per entrambi, inclusi i pixel completamente trasparenti. Le clip già prodotte con metodo 4 rimangono valide e non vengono ricodificate per uniformarne il metodo.

I confronti dei profili su lana/polvere e fiamme mostrano un compromesso reale: la pulizia aggressiva riduce gli aloni ma può irrigidire bagliori e bordi. Il profilo di base conserva gli effetti morbidi; possono rimanere bordi di matte olivastri nel bloom, per esempio nell’attacco di 74, e nella polvere/contorno di 62. Alcuni effetti, come i vortici di 73 e i fogli/fiamme di 75, raggiungono già i margini del filmato originale e possono mostrare il taglio della sorgente. Non vengono inventate porzioni fuori campo. Le tavole di confronto sono disponibili nella galleria locale.

I raccordi dell’attesa mantengono le variazioni native, anche quando le fiamme fra primo e ultimo fotogramma differiscono. La forma 74 supera la soglia statistica già usata dal laboratorio ed entra nella coda di revisione, che passa da sette a otto forme; l’intestazione ora mostra il numero effettivo. La misura indica una priorità di osservazione, non una bocciatura artistica. Il confronto visivo di 74 e 77 mostra soprattutto differenze nelle fiamme; nessun frame viene corretto o sostituito.

## Punti di sincronizzazione

I marker dell’attacco e del colpo sono scelti osservando fotogrammi originali consecutivi. Sono indici da zero; i tempi derivano da 24 FPS. Le evidenze sono conservate nei metadati di attacco/colpo e nel metadato completo del set. Non si aggiunge un flash alle clip con semplice contraccolpo corporeo: per esempio le reazioni di 75 e 81 usano il movimento osservato.

## Integrazione e conservazione

Battaglia e laboratorio `#arkamon-lab` leggono lo stesso manifest esplicito. Squadra, Deposito, Arkadex e Analisi usano i front PNG ufficiali. L’aggiornamento del catalogo geometrico dei poster non cambia questa scelta.

Le pagine runtime usano il formato già presente nel progetto, con massimo 16 MiB decodificati per pagina. Il convertitore le aggiunge al manifest esistente, pubblicato atomicamente soltanto al termine del gruppo completo. Il proiettore del manifest browser accetta sia i nomi storici sia quelli con impronta del contenuto, conservando i controlli della directory e dell’estensione.

La verifica indipendente confronta le **285 clip precedenti** e tutte le loro pagine con il manifest registrato prima dell’importazione; confronta inoltre i **110 front PNG ufficiali**, all’interno di **131 file PNG numerati** presenti nella cartella e tutti verificati immutati. Il catalogo integrato comprende **81 forme, 405 clip e 38.868 fotogrammi nativi**. La conversione non produce una release media, un nuovo pin o una pubblicazione online.

Il primo collaudo completo ha rilevato un’asserzione di peso ormai incompleta: il limite percentuale precedente non considerava l’entropia dei nuovi nomi con impronta del contenuto, necessari per indirizzare i file corretti. Il controllo ora separa il costo inevitabile dei nomi dalla geometria, mantiene il precedente budget del 2% per quest’ultima e impone anche un tetto assoluto di 32 KiB gzip per l’indice completo. Il risultato misurato è **18.661 byte gzip**, contro 650.725 byte del manifest di provenienza; sono misure in memoria, non un rilevamento del trasferimento in rete. I dati di provenienza restano fuori dal modulo browser. Il primo esito fallito è conservato nei log e la suite completa viene rieseguita dopo la correzione.

## Collaudo locale

Le verifiche riproducibili e le anteprime si trovano in `output/animation-import-2026-10-19/`. L’inventario originale contiene l’impronta SHA-256 di ogni file e il digest di ogni fotogramma decodificato. La verifica finale comprende provenienza, metadati individuali/completi, geometria, marker, poster, pixel lossless, copertura consecutiva delle pagine, compilazione e riproduzione delle cinque azioni nel browser.

Le prove con viewport mobile riguardano un campione dichiarato, separato dalla copertura desktop di tutte le nuove clip. Non certificano prestazioni su telefoni fisici, OBS o hosting. Push, commit, deploy e release restano azioni distinte dall’importazione locale.

La revisione visiva comprende tavole campionate delle immagini convertite per tutte le 24 forme, confronti dei marker su frame consecutivi originali e confronti specifici dei profili di trasparenza. Non equivale alla visione manuale di ciascuno degli 11.519 frame. Il browser interattivo dell’app ha restituito “Local browser use is disabled in Work settings”: la prova manuale nell’anteprima dell’app non è quindi stata eseguita in questa ripresa. I test automatici del progetto sono riportati separatamente qui sotto.

## Esiti finali verificati

- **3856 test Vitest superati**, zero fallimenti nella riesecuzione completa. La prima esecuzione e il suo unico fallimento sul budget compresso sono conservati separatamente.
- **36 test Python superati** per keying, conservazione e codifica lossless; log `key-tests.log`.
- **Controllo TypeScript superato** e **build Vite completata**. La build di controllo non copia l'intera libreria media; non è una release distribuibile. Rimane l'avviso preesistente sui chunk applicativi superiori a 600 kB.
- **33 test automatici Playwright superati, 17 esclusioni intenzionali**: desktop copre tutte le 24 nuove forme con le cinque azioni più una prova completa nel laboratorio; viewport mobile copre 7 forme rappresentative più il laboratorio. Le 17 forme restanti sono escluse soltanto dal progetto mobile. Le prove singole usano la modalità veloce del banco di test; il laboratorio prova la sequenza nativa ordinaria.
- I test controllano marker, durata, caricamento delle pagine, assenza di errori, finale KO fermo sull'ultimo frame e massimo di **32 MiB** nella cache decodificata delle sequenze singole. Il laboratorio verifica anche la liberazione del confronto mentre attaccante e difensore sono attivi.
- **285 clip precedenti conservate**, con le loro pagine e impronte. **131 PNG frontali numerati immutati**, inclusi i 110 front ufficiali del catalogo.
- Totale corrente: **81 forme, 405 clip, 38.868 fotogrammi, 4990 pagine runtime**; massimo per pagina 16 MiB decodificati. Aggiunti **120 filmati e 11.519 fotogrammi nativi**.

La galleria locale è `http://127.0.0.1:3062/output/animation-import-2026-10-19/index.html`; il gioco usa `http://127.0.0.1:3062/#arkamon-lab`. I controlli HTTP hanno verificato la risposta della galleria; la prova manuale nel browser dell'app resta non eseguita per l'impostazione già indicata.

Le evidenze complete sono `verification-steps.json`, `unit-results.json`, `browser-results.json`, `preservation-verification.json`, `visual-review.json`, `runtime-index-statistics.json` e i rispettivi log nella cartella dell'importazione. La provenienza persistente è in `animation-source/audits/front-2026-10-19.json`.

## Catalogo dei nuovi set

Le colonne dei frame seguono l'ordine **Attesa / Attacco / Colpito / Vittoria / KO**. Gli indici dei marker partono da zero; il tempo corrisponde all'indice diviso 24. La finestra logica del corpo è 192×192 per 22 set e 256×256 per 55 e 61, distinta dal canvas indicato.

| ID | Nome | Frame per azione | Canvas | Fondale sorgente | Attacco | Reazione |
|---:|---|---|---|---|---:|---:|
| 22 | Voltrake | 96 / 96 / 96 / 96 / 96 | 512×512 | Verde | 51 | 26 |
| 54 | Leafrex | 96 / 96 / 96 / 96 / 96 | 448×448 | Blu | 39 | 25 |
| 55 | Peek-a-buu | 96 / 96 / 96 / 96 / 96 | 768×768 | Verde | 25 | 12 |
| 61 | Wailoom | 96 / 96 / 96 / 96 / 96 | 768×768 | Verde | 30 | 16 |
| 62 | Fluffet | 96 / 96 / 96 / 96 / 96 | 640×640 | Verde | 26 | 22 |
| 63 | Fluffet | 96 / 96 / 96 / 96 / 96 | 640×640 | Verde | 53 | 26 |
| 64 | Hopz | 96 / 96 / 96 / 96 / 96 | 576×576 | Verde | 22 | 25 |
| 65 | Piox | 96 / 96 / 96 / 96 / 96 | 704×704 | Verde | 35 | 20 |
| 66 | Hoppiox | 96 / 96 / 96 / 96 / 96 | 576×576 | Verde | 21 | 15 |
| 67 | Fearstraw | 96 / 96 / 96 / 96 / 96 | 640×640 | Verde | 50 | 25 |
| 68 | Fearstraw | 96 / 96 / 96 / 96 / 96 | 576×576 | Verde | 35 | 17 |
| 69 | Lickard | 96 / 96 / 96 / 96 / 96 | 704×704 | Blu | 38 | 26 |
| 70 | Lickard | 96 / 96 / 96 / 96 / 96 | 704×704 | Blu | 50 | 14 |
| 71 | Blizzaquil | 96 / 96 / 96 / 96 / 96 | 704×704 | Verde | 19 | 31 |
| 72 | Blizzaquil | 96 / 96 / 96 / 96 / 96 | 640×640 | Verde | 49 | 26 |
| 73 | Blizzaquil | 96 / 96 / 96 / 96 / 96 | 512×512 | Verde | 32 | 13 |
| 74 | Impise | 96 / 96 / 96 / 96 / 96 | 768×768 | Verde | 34 | 14 |
| 75 | Impise | 96 / 96 / 96 / 96 / 96 | 704×704 | Verde | 51 | 26 |
| 76 | Impise | 96 / 96 / 96 / 96 / 96 | 640×640 | Verde | 39 | 22 |
| 77 | Ignitor | 96 / 96 / 96 / 96 / 96 | 576×576 | Verde | 55 | 35 |
| 78 | Trippix | 96 / 96 / 96 / 96 / 96 | 576×576 | Verde | 26 | 9 |
| 79 | Cellgon | 96 / 96 / 96 / 95 / 96 | 704×704 | Verde | 45 | 14 |
| 80 | Cellgon | 96 / 96 / 96 / 96 / 96 | 576×576 | Verde | 32 | 13 |
| 81 | Cellgon | 96 / 96 / 96 / 96 / 96 | 512×512 | Verde | 27 | 35 |
