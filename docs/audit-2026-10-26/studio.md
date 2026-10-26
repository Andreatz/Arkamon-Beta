# Audit Studio UI — 26 ottobre 2026

## Problemi confermati e correzioni

### P1 — Le modifiche applicate alle schermate gestionali sparivano nel gioco

Il runtime restituiva `found = null` per ogni `.pu-shell[data-ui-concept]` fuori dall'anteprima. Il menù corrente possiede sempre quell'attributo: lo Studio mostrava testo, geometria e pulsanti aggiunti nella bozza, ma «Applica al gioco» non li rendeva disponibili nelle schermate effettive. La baseline del browser includeva il fallimento del pulsante personalizzato collegato al Registro e delle modifiche al menù.

`src/ui-studio/UiDesignRuntime.tsx` ora applica gli edit alla radice corrente anche nel gioco. La sospensione delle vecchie famiglie SVG riguarda soltanto le sorgenti archiviate `/ui/studio/*.svg` e `/ui/player-kit/*.svg` nelle composizioni gestionali: non disattiva testi, geometria, visibilità, ordine, PNG o media importati. Lo stesso filtro vale per i vecchi sfondi SVG. Gli asset originali delle mosse/HP in battaglia restano supportati.

La prova rafforzata applica un pulsante nuovo, ne imposta posizione e dimensioni, ricarica, verifica le proporzioni nella radice reale e lo usa per aprire il Registro. Le modifiche di etichetta, ordine e visibilità del menù sono verificate anche dopo una ricarica. I pulsanti continuano a chiamare comandi del gioco già esistenti.

### P2 — Il catalogo dello Studio non offriva le immagini attualmente usate

Il catalogo generato era rimasto a 343 immagini e non comprendeva le nuove immagini dell'UI o le 110 splash. Rigenerato tramite `scripts/build-ui-studio-catalog.mjs`, comprende **842 immagini**, con categorie esplicite **UI PNG fornita** (181 file) e **Splash Arkamon** (110 file), mantenendo i riferimenti precedenti per i layout compatibili.

Dimensione del sorgente generato: **171.988 byte**, circa **11.366 byte gzip**; prima 69.101 byte. È un indice di percorsi, non incorpora il contenuto binario delle illustrazioni. I test confrontano tutte le immagini fornite con il manifest, verificano tutti i percorsi nel filesystem, gli ID univoci, le 110 splash e il mantenimento degli asset storici di battaglia.

### P2 — La sostituzione del frame PNG del menù dipingeva sotto l'immagine originale

Il frame corrente è un'immagine dentro `.ref-menu-card-face`, mentre il contratto riconosceva soltanto i vecchi frame diretti. `src/ui-studio/skinSlots.ts` ora individua espressamente `.ref-menu-card-frame` all'interno della tessera del menù. Lo Studio sostituisce la sorgente di quella decorazione e «Originale» la ripristina; etichette e comandi restano montati.

La prova reale cambia la cornice PNG del Registro, applica, esce dallo Studio, apre il menù, ricarica e ritrova la nuova cornice. Riapre lo Studio e ripristina l'originale. Verifica inoltre che uno SVG archiviato non riappaia nella composizione corrente.

## Aggiornamento dei test al prodotto corrente

- `e2e/ui-studio-assets.spec.ts`: conserva prove su HP, texture, colore React, messaggi, icone delle mosse, Undo/Redo e persistenza; sostituisce le aspettative dei vecchi frame con i PNG correnti. Per Squadra e Arkadex verifica che cambiare la decorazione non sostituisca la splash; Analisi conserva il ritratto ufficiale.
- `e2e/ui-studio-editor.spec.ts`: identifica Registro/Salvataggio tramite ID stabili fra le nove tessere correnti, mantiene etichetta/ordine/visibilità ed esclude accessi liberi al negozio. Rafforzate persistenza dopo ricarica e geometria del pulsante aggiunto nel gioco reale. Restano prove di importazione, esportazione, font, trascinamento, ridimensionamento, cronologia e viste interne.
- `e2e/ui-studio-preview.spec.ts`: il testo del comando può includere il cursore decorativo corrente; la verifica della sostituzione/restaurazione del ritratto attraverso aggiornamenti React usa Analisi, che conserva quel ritratto. Tutte le schermate correnti e le mappe restano nel ciclo, con controllo dei salvataggi protetti.
- `e2e/ui-studio-contracts.spec.ts`: non richiedeva modifiche; confermate le prove di skin HP, geometria condivisa fra viste e posizione dei VFX.

## Verifiche e limiti

- Quattro spec Studio, prima esecuzione mirata dopo le correzioni iniziali: **18/18 superati**, nessuno saltato (`output/audit-2026-10-26/studio-targeted.json`).
- Dopo aver rafforzato le prove di applicazione e ricarica: **8 superati e 1 fallito** (`studio-persistence.json`). Il solo caso PNG menù era rimasto sulla schermata di caricamento del pannello oltre l'attesa. Una prima ripetizione isolata aveva superato **1/1** in circa 72 secondi (`studio-png-repeat/`), ma il problema si è poi ripresentato anche con server stabile nella suite completa e nella verifica isolata. L'ipotesi iniziale del solo riavvio del server non spiega quindi il difetto; la diagnosi finale e la correzione sono descritte sotto. Non si presenta questo insieme come una singola esecuzione rafforzata integralmente verde.
- Test unitari Studio **49/49 in 9 file** (`studio-unit.json`).
- TypeScript senza errori e controllo del diff senza errori di whitespace.

Queste prove usano Chromium desktop e l'editor fisso 1920×1080, coerentemente con il contratto preesistente. Non costituiscono una prova dell'editor su telefono. Non sono state cambiate o rigenerate le illustrazioni approvate. Nessun commit, push o deploy da questo sotto-audit. La verifica finale dopo la correzione della libreria è riportata sotto; i risultati precedenti sono conservati come cronologia diagnostica.

## Diagnosi finale del caricamento del menù e limite delle anteprime

### P2 — La libreria apriva centinaia di anteprime e saturava il caricamento successivo

Il caso PNG ha riprodotto ancora «Caricamento…» dopo Applica → Esci → Partita anche sul server 3014 stabile. La trace della verifica isolata è stata letta direttamente: registra **110 splash complete, 72.084.612 byte**, oltre alle immagini del kit e agli altri asset. I contenuti con dimensione registrata sommano **124.557.102 byte** (circa 118,8 MiB) durante una singola selezione; i valori sconosciuti della trace non sono conteggiati come zero-byte reali. Alcune immagini archiviate impiegano **14–18 secondi** nel trasferimento. Il riepilogo estratto è in `output/audit-2026-10-26/studio-library-network-summary.json`. Il catalogo è un indice leggero, ma la griglia montava tutte le **842** anteprime contemporaneamente; `loading="lazy"` da solo non ha impedito l'avvio di tutte le 110 illustrazioni.

Confronti causali, senza aumentare le attese:

- Stesso test PNG copiato in un harness diagnostico isolato, con unica variazione il blocco delle richieste **immagine** verso le splash e gli asset archivio: **1/1 superato in 15,7 secondi**. Script, salvataggi, applicazione e ripristino non erano bloccati o sostituiti.
- La build compilata eseguita dal coordinatore supera Applica → Esci → Partita → ricarica → Partita; aperture misurate **454 e 276 ms**, nessun errore JavaScript (`output/audit-2026-10-26/compiled/studio-results.json`). Non c'è prova di un ciclo di importazione bloccante nella build distribuita.
- Correzione effettiva in `src/ui-studio/UiStudioEditor.tsx`: la griglia monta **24 anteprime per pagina**. I pulsanti precedente/successiva consentono di consultare tutti i risultati; ricerca e categoria continuano a filtrare l'intero catalogo. Cambiare filtro o riaprire la libreria riparte dalla prima pagina. L'importazione continua a selezionare la categoria Importati. Le immagini approvate non sono state modificate.
- Dopo la correzione, **stesso test PNG originale senza intercettazioni** e nuovo test della libreria: **2/2 superati in 14,15 secondi**, con le stesse attese di prima (`studio-bounded-library.json`). Il nuovo caso verifica 24 pulsanti, pagina successiva, ricerca di Oniros 109 al di fuori delle prime pagine e non più di 49 splash richieste attraversando due pagine e il risultato cercato.
- Chiusura del coordinatore, dopo l'ultima modifica: quattro spec Studio aggiornate, **19/19 casi desktop riusciti**, nessun caso saltato (`studio-final.json`, 1,8 minuti). TypeScript e build web nuovamente riusciti (`build-audit-final.log`).
- Prova sulla nuova build compilata: pagina 2, ricerca globale Oniros 109, selezione PNG, applicazione, uscita, apertura del menù e reload; **riuscita senza errori JavaScript**, aperture misurate a 181 e 123 ms (`compiled/studio-results-final.json`). Sono misure di questa prova locale, non un benchmark generalizzabile. Script ripetibile locale: `compiled-studio-smoke.cjs`.

La correzione limita il lavoro avviato dalla libreria; non usa nuove attese arbitrarie e non nasconde un errore del browser. I file sorgente dell'ultimo intervento sono soltanto `UiStudioEditor.tsx` e `e2e/ui-studio-assets.spec.ts`.

La cattura finale della build compilata attende inoltre tutte le immagini della schermata con `complete` e `naturalWidth > 0`, quindi controlla dimensioni positive delle nove cornici. Il primo screenshot immediato precedeva la decodifica delle immagini e mostrava solo i simboli; la verifica successiva conferma cornici e medaglie visibili, senza cambiare il CSS. Geometria registrata in `compiled/studio-image-geometry.json`; screenshot verificato `compiled/studio-applied-final.png`.
