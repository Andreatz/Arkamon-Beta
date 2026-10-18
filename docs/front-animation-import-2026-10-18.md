# Animazioni frontali delle forme 39–53 e 56–60

L'importazione aggiunge venti forme con cinque azioni ciascuna: **attesa, attacco, colpito, vittoria e KO**. Sono cento video originali, per **9.595 fotogrammi** a 24 FPS. Il totale del gioco diventa **57 forme, 285 animazioni e 27.349 fotogrammi nativi**. Le forme 22, 54 e 55 non ricevono animazioni in questa importazione perché non sono presenti fra i nuovi video forniti.

## Fotogrammi e comportamento

95 clip contengono 96 fotogrammi e durano quattro secondi. Le cinque clip seguenti contengono 95 fotogrammi e durano 3.958,333 ms:

- 41: attesa e attacco;
- 47: colpito;
- 52: attacco e KO.

L'utente ha scelto esplicitamente di conservare i 95 fotogrammi originali. Non vengono aggiunti duplicati, interpolazioni o pose generate. Le due copie dei video, quella fornita sotto `public/sprites/animation/Front` e quella canonica sotto `animation-source/raw`, coincidono tramite SHA-256. La verifica preliminare ha decodificato tutte le cento fonti: 83 video sono 1920×1080 e 17 sono 1280×720.

Solo l'attesa è ciclica. Attacco, colpo e vittoria terminano e riprendono l'attesa; il KO conserva l'ultimo fotogramma reale. Se il video originale dissolve il corpo e lascia soltanto fumo o particelle, il risultato mantiene quel finale. Alcune attese originali hanno primo e ultimo frame diversi: l'importazione non modifica il movimento per nascondere la giunzione.

## Trasparenza e geometria

Le forme 52 e 53 usano il fondale blu per preservare foglie e corpo verdi. La forma 45 conserva il profilo dedicato ai dettagli verdi e grigi. Per la forma 46 il confronto del frame originale con i due profili ha mostrato che il profilo base riduce il bordo verde nelle ali sfocate senza eliminare il corpo: viene mantenuta la stessa geometria verificata, rielaborando il colore e l'alfa.

L'attacco di 57 contiene nastri d'acqua che coprono gli angoli ai frame originali 43, 44 e 46–52. Il colore di fondale verificato nel frame 0 è RGB `[55,207,14]`: viene usato come riferimento soltanto quando gli angoli non rappresentano più il fondale, conservando l'effetto azzurro.

Ogni clip conserva una camera costante, mentre scala e appoggio sono condivisi dalle cinque azioni della stessa forma. Il corpo è misurato sulla posa iniziale dell'attesa in rapporto al PNG ufficiale. Il padding comprende l'unione alfa di tutti i fotogrammi, mantenendo gli atlanti entro 8192 pixel per lato. Le finestre logiche più piccole consentono di contenere gli effetti ampi senza tagliarli; il renderer usa la finestra logica per dimensionare il corpo nello slot.

Gli atlanti e i poster sono WebP statici lossless RGBA. Il renderer del gioco usa le pagine già previste dal progetto, entro 16 MiB decodificati per pagina. Ogni pagina conserva tutti i pixel visibili e tutti i valori alfa dell'atlante. Le 185 clip precedenti vengono conservate integralmente nel manifest.

La separazione del fondale rimane limitata dall'immagine originale: il bloom ciano dell'attacco di 39 presenta un bordo di matte visibile al picco. Alcuni raggi, flash e particelle raggiungono già i margini del filmato. L'importazione conserva quanto presente e non ricostruisce porzioni mancanti fuori campo.

## Punti di sincronizzazione

I marker di rilascio dell'attacco e di reazione al colpo sono scelti osservando fotogrammi consecutivi originali. Sono indici da zero; i tempi sono calcolati alla frequenza nativa di 24 FPS. Evidenze e marker sono riportati nei metadati individuali, nel metadato del set e nel [rapporto di provenienza](../animation-source/audits/front-2026-10-18.json).

| ID | Arkamon | Finestra logica | Cella RGBA | Rilascio attacco | Reazione al colpo |
| ---: | --- | --- | --- | ---: | ---: |
| 39 | RS-219 | 176×176, left 296 / top 296 | 768×768 | 30 | 13 |
| 40 | RS-219 | 256×256, left 256 / top 258 | 768×768 | 40 | 26 |
| 41 | RS-219 | 256×256, left 223 / top 223 | 704×704 | 23 | 13 |
| 42 | Felvex | 192×192, left 256 / top 253 | 704×704 | 45 | 11 |
| 43 | Felvex | 256×256, left 274 / top 240 | 704×704 | 41 | 22 |
| 44 | Felvex | 192×192, left 224 / top 222 | 640×640 | 42 | 17 |
| 45 | Spectron | 256×256, left 224 / top 232 | 704×704 | 29 | 27 |
| 46 | Spectron | 256×256, left 192 / top 192 | 640×640 | 33 | 14 |
| 47 | Weedrug | 256×256, left 263 / top 260 | 768×768 | 36 | 14 |
| 48 | Weedrug | 256×256, left 235 / top 225 | 704×704 | 36 | 16 |
| 49 | Constrix | 256×256, left 243 / top 248 | 704×704 | 36 | 12 |
| 50 | Constrix | 256×256, left 160 / top 128 | 512×512 | 30 | 29 |
| 51 | Goliash | 256×256, left 197 / top 195 | 640×640 | 38 | 14 |
| 52 | Leafrex | 176×176, left 291 / top 317 | 768×768 | 21 | 12 |
| 53 | Leafrex | 176×176, left 168 / top 169 | 512×512 | 44 | 16 |
| 56 | Deephion | 192×192, left 224 / top 225 | 640×640 | 35 | 22 |
| 57 | Deephion | 256×256, left 256 / top 258 | 768×768 | 36 | 18 |
| 58 | Shabyss | 192×192, left 288 / top 289 | 768×768 | 31 | 13 |
| 59 | Shabyss | 192×192, left 223 / top 225 | 640×640 | 37 | 28 |
| 60 | Shabyss | 256×256, left 256 / top 255 | 768×768 | 23 | 25 |

## Integrazione e controlli

Battaglia e laboratorio `#arkamon-lab` selezionano le nuove azioni dedicate attraverso lo stesso manifest. Squadra, Deposito, Arkadex e Analisi continuano a usare i PNG ufficiali di `/sprites/front_sprites/{id}.png`. L'aggiunta di poster al catalogo geometrico non cambia questa scelta.

La verifica finale locale ha prodotto questi risultati:

- **136 file e 3.205 test unitari superati**, inclusi provenienza dei video, dimensioni, metadati, poster, numero di frame, marker e ritratti ufficiali. La verifica del poster confronta la prima cella della prima pagina realmente usata dal renderer, evitando di decodificare un intero atlante per ritagliare un solo frame.
- **34 test della separazione del fondale superati**, 9 controlli di sicurezza superati e catalogo VFX verificato con 276 voci.
- **TypeScript e compilazione web superati**. Il confezionamento verifica 285 clip native e le relative 3.755 pagine, mantiene i media pesanti sul pin `eee4e630132bde9ea3709661fe39a885fd88d0cf` e produce un pacchetto locale di 572,6 MiB. Rimane l'avviso di dimensione per i moduli JavaScript più grandi di 600 kB.
- **34 scenari browser riusciti**, 25 desktop e 9 mobili. Tutte le cento nuove clip vengono riprodotte sul desktop; su mobile sono controllate tutte le azioni delle forme 41, 47, 52 e 57, oltre ai casi già esistenti. I controlli includono pixel visibili, marker, avanzamento fra pagine, limiti di memoria, ritardi di caricamento, movimento ridotto e mantenimento dell'ultimo frame KO. I 16 casi mobili restanti sono esclusioni intenzionali, coperte integralmente sul desktop.
- **Due regressioni aggiuntive del laboratorio mobile superate**: simulazione Leafrex 52 contro Deephion 57 entro 32 MiB e successivo ritorno all'azione singola; mancata disponibilità sia dell'animazione sia del PNG di recupero, uscita dalla preparazione e nuovo tentativo con un altro bersaglio. È stata verificata anche manualmente nel browser la simulazione completa con attacco, effetto, impatto e reazione.

La matrice browser completa ha terminato tutti i suoi 34 scenari con successo, ma il comando ha restituito errore per due segnalazioni esterne agli scenari: il processo di un worker Windows non si è chiuso entro 300 secondi al cambio di progetto ed è stato terminato dal runner. La successiva esecuzione delle due regressioni mobili si è chiusa normalmente. Non viene quindi dichiarata una matrice browser completa con uscita pulita. Le prove riuscite usano il server locale sulla porta 3040; i tentativi sulla porta 3016 si sono fermati sul caricamento iniziale, senza una causa applicativa accertata.

Durante la verifica manuale è stato corretto un blocco reale del laboratorio: il confronto singolo poteva occupare una terza pagina mentre attaccante e bersaglio preparavano le loro animazioni. Ora il confronto rilascia il proprio lettore durante la simulazione; i lettori della simulazione vengono rilasciati al termine prima di riabilitare le azioni singole. Se fallisce anche l'immagine di recupero, la preparazione viene interrotta e si può riprovare.

L'importazione e le prove locali sono distinte dalla pubblicazione online. Le pagine sono registrate nel commit indicato e il pin dei media è aggiornato. In questa lavorazione non sono stati effettuati push, pubblicazione della release o deploy.
