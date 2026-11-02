# Nuovi asset e animazioni frontali — 2 novembre 2026

## Asset forniti e dati di gioco

Il commit dell’utente `8129ae42d9a443c611877a1a8cba1f5a54f29ad2` aggiunge 64 PNG frontali, ne aggiorna 16 e aggiunge 30 video. Il checkout è stato aggiornato con fast-forward, conservando il commit originale. I PNG delle 110 forme giocabili non sono cambiati.

Il catalogo grafico contiene **195 ID reali: 110 con dati di gioco e 85 ancora da definire**. Non vengono aggiunti nomi, mosse, tipi, statistiche, evoluzioni, incontri o schede giocabili. I buchi nella numerazione non diventano forme artificiali. Il catalogo `src/data/arkamon-assets.json` registra soltanto ID, stato dei dati, percorsi, dimensioni, bounds dei pixel visibili, byte e SHA-256. Si rigenera con `npm run assets:catalog`; `npm run assets:catalog:check` ne verifica la corrispondenza con le fonti.

Il laboratorio `#arkamon-lab` permette di filtrare tutti gli asset, quelli animati e quelli con dati ancora da definire. Le forme prive di video mostrano soltanto gli sprite originali, inquadrati conservando proporzioni e margini visibili. Il retro è disponibile soltanto quando esiste il relativo file. Le forme prive di dati non mostrano il duello con mosse; le cinque animazioni dei nuovi set si possono osservare separatamente senza simulare una mossa di gioco.

## Sei serie native 111–116

Le sorgenti comprendono **30 video, 86.842.807 byte e 2.830 fotogrammi**, tutti 1920×1080 a 24 FPS, con fondale verde. Le copie canoniche sono in `animation-source/raw/{id}/front/{azione}.mp4`; i file con i nomi forniti rimangono in `public/sprites/animation/Front/`.

| ID provvisorio | Attesa | Attacco | Colpito | Vittoria | KO | Canvas | Rilascio attacco | Reazione colpo |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 111 | 94 | 95 | 94 | 95 | 95 | 512 | 29 | 20 |
| 112 | 95 | 95 | 94 | 95 | 95 | 448 | 55 | 27 |
| 113 | 94 | 95 | 95 | 94 | 95 | 384 | 32 | 21 |
| 114 | 94 | 94 | 94 | 94 | 94 | 512 | 29 | 23 |
| 115 | 94 | 94 | 94 | 94 | 94 | 448 | 47 | 14 |
| 116 | 94 | 94 | 94 | 94 | 94 | 384 | 45 | 27 |

I conteggi restano quelli decodificati: non vengono portati a 96 frame. Indici e marker partono da zero. Ogni marker è stato osservato su tre frame originali consecutivi e descrive il movimento della sorgente, senza assegnare tipo o nome a una mossa. Il viewport comune di ogni set è 192×192; il canvas trasparente aggiuntivo conserva escursioni, fumo e particelle. Il KO mantiene il vero finale, anche quando il corpo è già scomparso.

Il catalogo nativo complessivo comprende **116 forme animate, 580 clip, 55.605 frame e 6.265 pagine**. Le cinque azioni dei sei nuovi ID aggiungono 180 pagine. Ogni pagina resta entro 16 MiB decodificati. Non vengono alterati gli sprite ufficiali, le splash art o le interfacce della partita.

La revisione grafica comprende primo, centro e ultimo frame di tutte le nuove clip su chiaro/scuro, tavole delle sorgenti e sequenze consecutive dei marker. Non è una visione manuale di ogni fotogramma. È stato usato il keying verde conservativo esistente; i bagliori mescolati con il fondale compresso possono conservare una lieve dominante giallo/verde. I tagli degli effetti già presenti ai bordi della sorgente restano documentati, senza inventare pixel o frame per nasconderli.

## Distribuzione e controlli del rilascio

Con tutti gli originali frontali nel pacchetto locale, i soli asset statici raggiungevano 919,9 MiB, oltre il limite di 900 MiB prima del JavaScript. I PNG delle forme con dati di gioco rimangono locali. Gli 85 PNG ancora senza dati, circa 189,95 MiB, seguono il canale media con revisione immutabile già usato dalle animazioni; gli originali restano integri nel repository. Lo sviluppo locale continua a leggere tutti i file locali. La scelta dei ritratti necessari alla partita deriva da `pokemon.json`, senza una soglia numerica fissa.

Il pin comprende anche `pendingFrontSpritesSha256`, impronta dell’inventario ordinato di percorso, byte e SHA-256 dei PNG ancora senza dati. Un’aggiunta o una sostituzione di soli sprite richiede quindi un nuovo pin, anche quando il manifest delle animazioni è invariato. Il comando di pin rifiuta fonti non registrate in Git; build e verifica confrontano nuovamente l’inventario reale, senza richiedere tutta la cronologia binaria in CI.

Il controllo del rilascio deriva clip e frame dal manifest e dai metadata autorevoli, confrontandoli con il pin e con il compilato. Le prove sullo stesso compilato passano da sei a **15 obbligatorie**: i sei scenari precedenti, le cinque azioni di ciascuna delle sei forme nuove e gli originali PNG 150/184/206. Il limite globale del gruppo passa a dieci minuti; i timeout individuali e il divieto di esclusioni/retry restano invariati.

L’aggiunta dei set portava l’indice runtime compresso a 34.956 byte, oltre il limite esistente di 32 KiB. Il nuovo formato conserva soltanto token del nome, numero di frame e colonne per pagina; ricostruisce progressivi, righe e dimensioni esatte dopo averne verificato la derivabilità. Tutti i 6.265 percorsi e tutte le geometrie risultano identici al manifest autorevole. L’indice scende a **29.839 byte**, senza aumentare il budget e senza modificare le pagine, gli alpha o i tempi dei frame. I test coprono anche nomi WebP/PNG storici e con impronta.

## Verifiche

L’audit indipendente ha confrontato byte e SHA-256 di **7.380 file**, comprese tutte le pagine storiche e i 195 PNG frontali, e verificato che le **550 voci native precedenti siano profondamente identiche**. Ha inoltre verificato tutte le 30 nuove clip, i 2.830 frame, le 180 nuove pagine, le copie delle sorgenti, il poster/primo frame, l’ultimo frame, i marker e le celle inutilizzate trasparenti: **superato, zero errori**.

Il convertitore verifica il confronto RGBA completo degli atlanti; il generatore delle pagine confronta ogni byte visibile e ogni alpha. Le 36 regressioni Python sono superate. Gli esiti finali e le impronte sono registrati nell’audit [front-2026-11-02.json](../animation-source/audits/front-2026-11-02.json).

La suite unitaria sulla versione compattata è conclusa con **5.367/5.367 test in 182 file**, codice 0. TypeScript, 26 contratti Node e nove controlli di sicurezza sono superati. I log precedenti restano disponibili: il primo giro unitario aveva rilevato il superamento del budget, mentre i primi giri browser avevano attese di test errate per il nodo del ritratto e per la modalità di osservazione di un singolo frame. Le prove corrette controllano il PNG realmente decodificato, il conteggio nativo prima dell’osservazione e il renderer a un solo frame con l’indice originale conservato durante la pausa; non si modifica il prodotto per soddisfare quei selettori.

| Verifica finale | Esito |
|---|---|
| Browser delle nuove sorgenti | **34 identità superate**, zero irrisolti, esclusioni o flaky: 12 scenari delle animazioni sulla versione compattata e 22 scenari UI ricontrollati. Report e precedenti tentativi conservati; non è un’unica invocazione tutta verde. |
| Build di produzione | Codice 0; **740,1 MiB**, limite 900 MiB. |
| Budget di avvio | Superato: ingresso 469.597 byte, JavaScript iniziale 729.546 byte, CSS 76.721 byte. |
| Scenari generali sul compilato | **3/3 superati**, zero esclusioni o retry. |
| Animazioni e ritratti sullo stesso compilato | **15/15 superati**, zero esclusioni, retry o flaky. |
| Legame delle 15 prove con l’artefatto | `readPassingReport` superato contro l’impronta dell’intero compilato, senza modificarlo. |

La revisione immutabile dei media è `f479e154b80279551ed5c5ba61eeecf8d7430954`. L’impronta canonica del manifest è `fa80274dfb359b4b0978778a3faef03d7a3599a152f37060151273c4f0ed917b`; quella dei PNG senza dati è `2fab12a90fccffa6acb2ec8844b001d0177a549997605ae5ed5f80da3217bb69`. Il compilato invariato ha impronta di contenuto `497d8adb525e923a0a8d1ca073a7d289342a9d45c5317e2e01ae5c9cf2d22fb8`.

Confronti reali del laboratorio: [forma 116, originale e animata](ui-previews/native-2026-11-02/116-native-comparison.png) e [forma 206, soltanto sprite](ui-previews/native-2026-11-02/206-static-comparison.png).

Le prove locali della distribuzione sostituiscono soltanto il trasporto dei file della revisione esatta e ne verificano le impronte. Non certificano la disponibilità online del CDN, una nuova installazione desktop fisica o l’avvenuto deploy. Log, tavole, report dettagliati e inventario della baseline sono conservati in `output/animation-import-2026-11-02/`.

Questi controlli verificano l’importazione e i percorsi del compilato indicati; non sono una nuova esecuzione di ogni scenario E2E del progetto. Non è stata creata una ricevuta di pubblicazione dell’intero progetto usando soltanto i 34 scenari di questa importazione. I commit locali registrano asset, codice, pin e audit; nessun push o deploy è stato eseguito per questa nuova importazione.
