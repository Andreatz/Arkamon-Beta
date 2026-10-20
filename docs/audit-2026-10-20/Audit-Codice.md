# Arkamon — audit del codice, dello stato e della distribuzione

> Archivio del 20 ottobre 2026: **Snapshot iniziale del codice**. Origine nella cartella della sessione: `outputs/Audit-Codice.md`. I rilievi e i conteggi descrivono quella fase; leggere [stato e provenienza](./README.md) per gli interventi successivi. I link al codice puntano ai file correnti; i numeri di riga sono quelli rilevati durante l'audit.


Analisi ricostruita sul checkout attuale il 20 ottobre 2026, commit **`ea4dcab344cf4030757b4c9bb00f4890b4421be4`**. Repository letto: `C:/Users/andre/Documents/Codex/2026-10-19/https-github-com-andreatz-arkamon-beta/checkout`.

## Esito e perimetro

Il progetto ha già una base di regole e persistenza più solida di quanto suggerisca una semplice beta: motori puri, checkpoint, scritture prima della pubblicazione in memoria, ripristino con journal, proprietà esclusiva della sessione, challenge separate dalla campagna, configurazioni validate e una vista pubblica con campi esplicitamente selezionati. La priorità è rendere coerenti i contratti fra questi sistemi e alleggerire l'orchestrazione nelle scene. Un rifacimento delle regole non è necessario per migliorare molto qualità visiva e affidabilità.

Questa è **una revisione selettiva e verificabile, non la lettura umana di ogni riga del repository**. Ho censito tutti i file sotto `src`, letto integralmente 69 file (64 applicativi e 5 test) e letto porzioni o indicizzato scenari di altri 13. Il dettaglio distingue `read`, `partial`, `indexed-only` e specifica gli intervalli in [code-inventory.json](./README.md#evidenze-locali-non-incluse) (origine locale: `outputs/evidence/code-inventory.json`). Gli altri 406 file di `src` sono censiti: alcuni JSON sono stati analizzati strutturalmente, ma ciò non equivale a una revisione umana completa. Le porzioni stampate e troncate non sono dichiarate lette integralmente.

**Non ho eseguito test, build o verifiche browser in questo incarico.** L'agente principale gestisce queste esecuzioni e integra le relative prove. I risultati di un turno precedente recuperati dalla cronologia non sono usati qui come certificazione attuale. Nessun file del prodotto è stato modificato. Non ho scaricato asset; l'inventario Git disabilita esplicitamente il recupero automatico dei blob mancanti.

## Dimensione e architettura

| Misura attuale | Valore | Interpretazione |
|---|---:|---|
| File `src` | 488 | 305 `.ts`, 133 `.tsx`, 28 CSS, 19 JSON, 2 SVG, 1 font |
| File TS/TSX | 438 | 60.894 righe fisiche, incluse righe vuote e commenti |
| Test TS/TSX in `src` | 155 | 16.417 righe; 44.477 righe TS/TSX restanti |
| File sotto `scripts` | 28 | Pipeline di asset, distribuzione e verifiche |
| Specifiche E2E | 37 | Presenza del codice dei test, non esito di esecuzione |
| `generatedVfxAssets.ts` | 9.045 righe | Catalogo generato: non va confuso con complessità manuale |
| `ui-studio/assetCatalog.ts` | 2.414 righe | Catalogo editor |
| `BattagliaScene.tsx` | 1.904 righe, 51 import | 24 riferimenti `useRef`, 10 effetti: coordinamento molto concentrato |
| `gameStore.ts` | 1.227 righe, 32 import | Persistenza, regole applicative, mappe, negozio, Lega e navigazione |
| `MappaPrincipaleScene.tsx` / `MappaGrigliaScene.tsx` | 908 / 824 righe | Ulteriori centri di orchestrazione UI/stato |

Il flusso principale è React → scena → comandi Zustand → funzioni di dominio/dati → checkpoint locale → presentazione. `App` carica scene e laboratori in modo differito. `engine` contiene regole pure; `save` normalizza lo stato e gestisce backup/ripristino; `session` controlla la scheda scrivente; `interactions` e `league` descrivono contenuti configurabili; `audience` è il client di un servizio esterno; `regia` proietta lo stato consentito verso una finestra dello stesso browser/profilo. Laboratori, strumenti del giocatore, editor UI e regia sono superfici diverse: la loro esistenza non dimostra che ogni combinazione di stato sia stata verificata.

### Contratti già validi da preservare

- [gameStore.ts:319](../../src/store/gameStore.ts#L319) salva il candidato prima di pubblicarlo. Il retry controlla baseline e generazione campagna; le transazioni composte vengono preparate senza pubblicare stati intermedi. Non è un semplice autosave dopo il rendering.
- [restoreGameBackup.ts:14](../../src/save/restoreGameBackup.ts#L14) rivalida il backup alla conferma; [restoreJournal.ts:56](../../src/save/restoreJournal.ts#L56) conserva i valori prima/dopo e risolve un'interruzione senza mescolare metà campagna e metà catalogo.
- [gamePersistence.ts:94](../../src/save/gamePersistence.ts#L94) conserva HP residui, riconosce specie e livelli, non cura implicitamente durante il recupero; a `:246` recupera identità duplicate senza assegnare arbitrariamente una battaglia all'istanza sbagliata. Il sentinel `evoluzioneId: 0` indica assenza di evoluzione, non un riferimento rotto.
- [sessionOwnership.ts:20](../../src/session/sessionOwnership.ts#L20) integra Web Locks o lease e revisioni; le repliche sono in sola lettura. La semplice presenza di due schede non dimostra un bug di salvataggio.
- [purchase.ts:35](../../src/shop/purchase.ts#L35) verifica turno, posizione, scena e pallino configurato; ricalcola prezzi/quantità dal catalogo. Monete, oggetti e turno entrano nello stesso aggiornamento. Gli effetti degli oggetti sono puri e possono rifiutare un uso inutile.
- [challengeRuntime.ts:17](../../src/challenges/challengeRuntime.ts#L17) conserva la campagna separatamente e scrive la sfida su una chiave distinta; l'abbandono non diventa una vittoria competitiva.
- [gameBackup.ts:24](../../src/save/gameBackup.ts#L24) esclude credenziali e collegamenti del pubblico; [publicSnapshot.ts:27](../../src/regia/publicSnapshot.ts#L27) copia una whitelist di presentazione. I dati da mostrare al pubblico devono continuare a passare da questa proiezione.

## Rilievi prioritari riconfermati

P1 indica un'incoerenza che può alterare la gara; P2 un rischio concreto di funzionamento/manutenzione o una lacuna di verifica; P3 un problema circoscritto di feedback o difesa aggiuntiva. Un rischio prospettico è indicato esplicitamente e non viene trasformato in bug già osservato.

### C01 — P1: una visita ai luoghi senza mappa locale non limita le attività successive

**Prova:** [MappaPrincipaleScene.tsx:293](../../src/scenes/MappaPrincipaleScene.tsx#L293), [gameStore.ts:1032](../../src/store/gameStore.ts#L1032), [CittaScene.tsx:43](../../src/scenes/CittaScene.tsx#L43), [PercorsoScene.tsx:43](../../src/scenes/PercorsoScene.tsx#L43).

L'ingresso normale nel luogo fallback **paga già il turno** nello store: l'attore resta quello che deve completare l'attività e il turno successivo è accodato. Questo spiega perché la prima attività non debba essere bloccata soltanto perché l'attore non coincide più col turno della mappa. Tuttavia, nei luoghi senza mappa locale, `!localMap` abilita sempre le attività e il consumo ulteriore è condizionato all'esistenza di una mappa locale (`CittaScene:55,76`, `PercorsoScene:54,81`). Nessuno stato persistente limita la visita a una scelta.

Dopo una prima sfida, [BattagliaScene.tsx:831](../../src/scenes/BattagliaScene.tsx#L831) torna allo stesso percorso/città; `terminaBattaglia` non riallinea da solo l'attore al turno accodato. Si possono quindi avviare altri cespugli non visitati nella stessa visita fallback, o una cura e un allenatore, senza nuovo consumo. Il vincolo «cespuglio già esplorato» impedisce ripetere lo stesso cespuglio, ma non limita quelli diversi. Esempi di luoghi interessati sono Pescara, Grosseto e Percorso_3. Pordenone ha inoltre un trattamento speciale da nodo iniziale: non va usata come unica riproduzione del flusso ordinario.

**Verifica pratica da fare:** entrare normalmente in Percorso_3 con azioni disponibili, completare un cespuglio, tentare un secondo cespuglio prima del ritorno alla mappa/passaggio del controllo; in una città fallback alternare cura/sfida. Annotare attore, turno e azioni prima/dopo. Non è ancora una prova browser.

**Correzione proposta:** rappresentare l'attività prenotata all'ingresso e consumarla una sola volta, oppure uniformare l'interazione al comando di dominio delle mappe locali. Conservare l'eccezione GM come azione esplicita separata. Sostituire semplicemente `!localMap` con `availableTurn` bloccherebbe anche la prima attività legittima: non è una correzione adeguata.

### C02 — P2: la pausa di regia non include l'evoluzione in corso

**Prova:** [EvoluzioneScene.tsx:145](../../src/scenes/EvoluzioneScene.tsx#L145), [regiaStore.ts:24](../../src/regia/regiaStore.ts#L24), [AdminSessionPanel.tsx:72](../../src/readiness/AdminSessionPanel.tsx#L72).

L'evoluzione avvia un timer di 1.800 ms, scalato dalle preferenze, e aggiorna la specie alla scadenza. Non registra una sorgente `busy` e non legge `paused`. La pausa è rifiutata soltanto quando `busy` è vero; `RegiaPause` rende inerte la scena e blocca input, ma non sospende timer di dominio. Il risultato può cambiare durante l'overlay che promette ripresa dallo stesso punto. Combattimento e transizioni registrano invece attività distinte (`BattagliaScene:303`, `SceneTransition:36`).

**Intervento:** registrare `evolution` come attività fino al completamento del salvataggio, includendo rifiuto, retry, annullamento e cambio campagna. Verificare nel browser la pausa durante morphing; la normale animazione non va spezzata né il risultato ricalcolato. Il timer di uscita dal laboratorio merita la stessa verifica del contratto, senza presumere automaticamente un secondo bug identico.

### C03 — P2: il recupero accetta scene che il router non sa renderizzare

**Prova:** [gamePersistence.ts:164](../../src/save/gamePersistence.ts#L164), [App.tsx:143](../../src/App.tsx#L143).

La whitelist delle scene ammette `palestra`, `centro-pokemon` e `squadra`; il router non ha i relativi casi e mostra «Scena non implementata». Un salvataggio di quella forma viene accettato come navigazione nota, ma porta a un contenuto non giocabile. È un disallineamento di contratto osservabile dal codice, non la prova che un comando ordinario generi oggi tutte e tre queste scene.

**Intervento:** mappare scene storiche ai pannelli/luoghi reali durante la migrazione, oppure escluderle dal modello persistibile con un recupero leggibile. Centralizzare il registro delle scene fra tipi, router, salvataggio e studio; verificare backup storici e ritorno al gioco.

### C04 — P3: riordino squadra confermato anche quando il comando è rifiutato

**Prova:** [TeamScreen.tsx:71](../../src/player-ui/TeamScreen.tsx#L71), [gameStore.ts:706](../../src/store/gameStore.ts#L706).

La UI mostra subito «Ordine della squadra aggiornato» dopo `scambiaSlot`, che restituisce `void`. Lo store può rifiutare per scrittura non disponibile o perché una squadra storica fuori fascia non viene ridotta dallo scambio. Il recupero conserva correttamente quella squadra con un avviso, ma la UI può consentire il tentativo di riordino. A `TeamScreen:127` il messaggio positivo ha precedenza sul motivo del rifiuto. `DepositScreen:82-97` controlla invece il risultato dopo il comando: è un modello già presente da riutilizzare.

**Intervento:** restituire un esito tipizzato oppure confrontare gli identificativi dopo l'operazione. Nessuna perdita dati è dimostrata; il difetto è il feedback di successo falso. Decidere esplicitamente se sia sensato vietare il mero riordino di una squadra fuori fascia, senza cambiare silenziosamente le regole.

### C05 — P3: l'anteprima di configurazione può riapparire dopo annullamento

**Prova:** [AdminSessionPanel.tsx:57](../../src/readiness/AdminSessionPanel.tsx#L57), [BackupPanel.tsx:29](../../src/save/BackupPanel.tsx#L29).

`await file.text()` termina sempre con `setConfiguration`. Due letture completate fuori ordine possono mostrare il file precedente; annullare l'anteprima non invalida la lettura pendente. L'applicazione resta esplicita e presenta il nome del pacchetto: non è un'importazione automatica né un accesso non autorizzato.

**Intervento:** introdurre la revisione di lettura già usata dal pannello backup e incrementarla anche su annullamento/unmount. Verificare lettura A lenta, selezione B e annullamento durante la lettura.

### C06 — P2: il coordinamento del combattimento è troppo concentrato nella scena

**Prova:** [BattagliaScene.tsx:125](../../src/scenes/BattagliaScene.tsx#L125), a `:291-320` regia/proiezione pubblica, `:498-580` callback dadi/VFX/sprite, `:821-855` archiviazione e chiusura.

Il motore delle regole è estratto, ma la scena da 1.904 righe coordina stato locale, status, iniziativa, timer, RNG a seed, scelte remote, transizioni visive, salvataggio, ricompense e navigazione. 51 import e numerosi riferimenti mutabili rendono difficile capire quali fasi siano consentite insieme. Il numero di righe da solo non è un bug: il rischio deriva dalla distribuzione del protocollo temporale fra stato React e callback.

**Intervento:** estrarre progressivamente un controller di battaglia con stati ed eventi espliciti e dipendenze per RNG, persistenza, audio e presentazione. La UI deve ricevere snapshot e comandi validi, mentre il controller produce una sequenza già risolta. Conservare ordine danno → KO → livello → contraccolpo, checkpoint e dadi già usciti. Iniziare dai confini già estratti (`battleResolution`, `battleCheckpoint`, `battleVisualSequence`), evitando una riscrittura totale.

### C07 — P2: i comandi di dominio hanno garanzie e risultati eterogenei

**Prova:** [gameStore.ts:85](../../src/store/gameStore.ts#L85), `:571-594` acquisti/oggetti, `:596-660` avvio NPC, `:694-718` cura/scambi.

Alcuni comandi verificano turno, luogo e contesto e restituiscono esito/motivo; altri sono setter generici o `void` e si affidano alle guardie del componente. `aggiornaStato(Partial<GameSaveState>)` permette aggiornamenti trasversali senza un contratto specifico per l'azione. La scrittura resta protetta dalla proprietà di sessione: questo non costituisce da solo una vulnerabilità contro un utente ostile. È un rischio di correttezza interna, già visibile in C01/C04 e più costoso con nuove UI.

**Intervento:** separare comandi applicativi, mutazioni interne e strumenti GM; definire un `Result` comune e invarianti al confine del comando. Suddividere lo store per responsabilità mantenendo un coordinatore unico per le transazioni di campagna. Non frammentare salvataggi che devono restare atomici.

### C08 — P2: dati di combattimento derivati da un catalogo di presentazione

**Prova:** [statusMoves.ts:1](../../src/data/statusMoves.ts#L1), [data/index.ts:37](../../src/data/index.ts#L37).

Le mosse di paralisi e l'assegnazione degli slot delle specie vengono costruite da `move-vfx-assignments.json`, filtrando identificativi, `gameMoveId`, tipo e proprietari del catalogo. Modificare i metadati di assegnazione grafica può quindi cambiare il set di mosse realmente disponibile. L'introduzione degli status è esplicita e testata nel repository; il problema è l'accoppiamento, non l'illegittimità delle mosse.

**Intervento:** rendere mosse/learnset un catalogo delle regole autorevole e collegare il VFX per ID. La pipeline grafica deve leggere quel catalogo e verificare copertura, senza aggiungere o togliere abilità. Congelare l'output attuale prima della separazione e confrontare esattamente specie, slot e parametri.

### C09 — P2: la versione competitiva non congela l'intero motore/dataset

**Prova:** [challengeRules.ts:103](../../src/challenges/challengeRules.ts#L103), `:111-120`, [challengeStore.ts:70](../../src/challenges/challengeStore.ts#L70).

L'ID include versione regole, modalità, seed e squadra ordinata. Le regole classiche conservano prezzi e stadio evolutivo in uno snapshot; HP iniziali, mosse e risoluzione del combattimento usano comunque i dati e il motore correnti. Una futura modifica di bilanciamento senza cambio versione può mantenere lo stesso identificativo ma produrre una sfida diversa. Non è una prova che i risultati attuali siano già corrotti.

**Intervento:** aggiungere una revisione/fingerprint di motore e dati al contratto della challenge e al confronto risultati, oppure definire rigorosamente quali cambi impongano nuova versione. I codici condivisi devono continuare a ricostruire dati affidabili: non importare HP o cursori RNG arbitrari dal codice utente.

### C10 — P2: pubblicazione e controlli CI non sono concatenati nel repository

**Prova:** [ci.yml:3](../../.github/workflows/ci.yml#L3), [deploy.yml:3](../../.github/workflows/deploy.yml#L3).

La CI esegue test, controllo sicurezza, catalogo, build ed E2E su pull request o avvio manuale. Il deploy su push a `main` esegue installazione e build Pages e verifica soltanto la presenza dell'indice media prima di pubblicare. Dal solo codice dei workflow non è assicurato che ogni artifact pubblicato abbia superato quella suite sullo stesso commit. Le eventuali protezioni remote di `main` non sono state lette e potrebbero ridurre il rischio.

**Intervento:** riutilizzare un workflow di verifica oppure far dipendere la pubblicazione dall'artifact dello stesso SHA già verificato. Conservare controlli e prove; non cambiare hosting in conseguenza di questo audit.

### C11 — P2: gli E2E predefiniti esercitano il server di sviluppo

**Prova:** [playwright.config.ts:15](../../playwright.config.ts#L15), [e2e/vite.config.ts:1](../../e2e/vite.config.ts#L1), [vite.config.ts:19](../../vite.config.ts#L19).

Gli E2E avviano Vite; la build Pages usa invece base `/Arkamon-Beta/`, chunk prodotti e origine media separata. I test funzionali di sviluppo non sostituiscono uno smoke dell'artifact distribuito. Un controllo HTTP dell'artifact, quando eseguito dal root, copre raggiungibilità/integrità ma non sostituisce il rendering e l'interazione nel browser.

**Intervento:** conservare gli E2E rapidi e aggiungere un gruppo essenziale contro la `dist` con base reale: avvio, import DEMO, apertura menu, prima animazione, una battaglia, reload e asset esterno con cache fredda/calda.

### C12 — P2: il percorso telefono/ospite dipende da un backend non incluso

**Prova:** [private-guest-battle.spec.ts:4](../../e2e/private-guest-battle.spec.ts#L4), [playwright.private-guest.config.ts:4](../../playwright.private-guest.config.ts#L4).

La specifica salta se manca `ARKAMON_GUEST_E2E_SERVICE`. La configurazione dedicata richiede un checkout Arkanight e avvia il relativo servizio isolato. La CI standard non fornisce questo backend. Parser e controller del client validano sessioni, opzioni e corrispondenza del turno; questo non verifica autorizzazione, persistenza e concorrenza sul servizio reale.

**Intervento:** documentare e automatizzare l'ambiente d'integrazione isolato con revisioni del client/backend e distinguere i report «client simulato», «backend isolato», «telefono reale». Non estendere il voto pubblico oltre il normale NPC: ospiti privati e boss hanno un contratto diverso già rappresentato dal codice.

### C13 — P2: build locale/desktop e authoring condividono troppo materiale pubblico

**Prova:** [vite.config.ts:39](../../vite.config.ts#L39), [tauri.conf.json:9](../../src-tauri/tauri.conf.json#L9), [package-web-assets.mjs:37](../../scripts/package-web-assets.mjs#L37).

La build ordinaria copia tutto `public`; Tauri richiama quella build e usa `dist`. Pages ha già whitelist e split media. Il tree attuale contiene 13.654 file sotto `public`, mentre la proiezione del packager Pages ne copia 868, registra 11.085 esterni ed esclude 1.701 sorgenti. Il database Git del clone è parziale: le dimensioni di molti blob non sono ancora disponibili tramite Git e non vengono recuperate via rete da questo agente. La ripresa ha però riconfermato i file fisici in `public`: 13.654 file e 8.690.270.963 byte; `animation-source`: 410 file e 900.355.664 byte; `vfx-source`: 1.446 file e 602.433.028 byte. Il JSON distingue `mediaTree` da `mediaPhysical`; questa conta non ricalcola tutti gli hash.

**Intervento:** profili di lavoro e packaging distinti per codice/UI, authoring, web e desktop offline; whitelist runtime anche locale/Tauri e archivio sorgenti separato verificato per hash. Conservare tutti i frame e gli originali. Il browser carica le risorse richieste: non dedurre dai file del repository un download iniziale dell'intero archivio.

### C14 — P2: costo del checkpoint completo da misurare prima di aumentare la densità visiva

**Prova:** [gameStore.ts:330](../../src/store/gameStore.ts#L330), [gamePersistence.ts:379](../../src/save/gamePersistence.ts#L379), [durableWrites.ts:64](../../src/save/durableWrites.ts#L64).

Il percorso primario serializza stato precedente e successivo e confronta JSON, quindi scrive in storage sincrono. Roster/deposito, cronaca e progressi aumentano il lavoro sul thread UI. La copia automatica è già differita e accorpata: non va descritta come una seconda copia integrale immediata a ogni impatto. Non ho misurato un rallentamento attuale.

**Intervento:** misurare durata del comando, serializzazione, write e frame persi con campagna densa. Se il costo è rilevante, riutilizzare la serializzazione canonica e ridurre lavoro duplicato mantenendo la garanzia «prima durevole, poi visibile». Un passaggio a persistenza asincrona richiede un protocollo esplicito: non basta sostituire `localStorage` con una Promise.

### C15 — P3: Tauri non applica una Content Security Policy

**Prova:** [tauri.conf.json:25](../../src-tauri/tauri.conf.json#L25) imposta `csp: null`.

È una difesa aggiuntiva assente, non una vulnerabilità XSS dimostrata. I contenuti importabili, le URL di media e il servizio remoto rendono utile delimitare le origini nel profilo desktop, ma una policy va progettata con le necessità reali di immagini, blob, font, audio e connessione al backend.

**Intervento:** inventariare le origini e provare una CSP esplicita sul pacchetto desktop completo. Non introdurre una policy che rompa la regia o il playback e non dichiarare protetto il backend perché il client ha una CSP.

## Dati, test e sicurezza: cosa è stato effettivamente verificato

Tutti i **19 JSON sotto `src` sono sintatticamente leggibili**. Il censimento dei cinque cataloghi di base trova 110 specie, 220 mosse, 31 allenatori, 52 righe di incontri originali e 29 mappe. Categorie: 46 Media, 28 Veloce, 32 Lenta, 4 Leggendaria. Non emergono duplicati degli ID base, mosse base mancanti nei riferimenti delle specie, evoluzioni non nulle verso specie assenti, slot allenatore con specie/level invalidi, o intervalli incontro invalidi. Questi controlli strutturali sono nel JSON di evidenza; **non certificano bilanciamento, leggibilità o gradimento**. `data/index` aggiunge incontri generati e mosse di stato: i 52 incontri e le 220 mosse sono il catalogo originale, non l'intero risultato runtime.

I test presenti coprono scenari significativi: roundtrip backup senza cura implicita, quota piena, restore interrotto, journal corrotto, proprietà esclusiva e revisioni, retry di transazioni composte, compatibilità dei prezzi classici, sequenza Lega e rifiuto di riferimenti obsoleti. Ho indicizzato titoli e scenari, senza leggere ogni assert e senza eseguirli. Gli E2E includono geometrie, clipping, roster di sei membri, deposito denso, consultazione G2 e risoluzioni inferiori; l'esistenza di questi controlli evita di sostenere che non ci sia alcuna copertura responsive, ma non prova l'assenza di difetti in ogni schermata.

La mitigazione locale delle dipendenze in [harden-build-dependencies.mjs:102](../../scripts/harden-build-dependencies.mjs#L102) verifica versione, hash sorgenti originali e percorso reale prima di applicare guardie di complessità a `braces`. Il `postinstall` la richiama e la CI include un controllo dedicato. La presenza della mitigazione non equivale a una nuova esecuzione di `npm audit` o a una correzione upstream certificata; non ho interrogato nuovi advisory in questo incarico.

Nel client remoto ho letto timeout, annullamento, `credentials: omit`, validazione degli URL invito e dei token, corrispondenza fra richiesta e turno, invalidazione delle risposte tardive. Le credenziali host sono escluse dal backup e dalla proiezione pubblica; restano dati locali sensibili del browser. Non ho controllato database, CORS, rate limit, scadenze/autorizzazioni del backend, configurazione hosting o protezioni dei branch.

### Precisazioni che evitano falsi positivi

- **Status e `0d6`:** [battleMoveFacts.ts:10](../../src/components/battle/battleMoveFacts.ts#L10) produce «Status» e descrive assenza di danno/tiro offensivo; il motore riconosce `soloStato`. Il valore numerico zero nei dati non prova che la UI mostri un attacco `0d6`. Le altre superfici di presentazione vanno viste, non dedotte da un campo JSON.
- **Overflow:** una proprietà CSS isolata non dimostra clipping effettivo. Servono geometria nel browser, cascata completa, contenuti massimi e screenshot. Questo audit non attribuisce un difetto visivo a ogni `overflow: hidden`.
- **Prima attività fallback:** il turno viene consumato entrando dal mondo; C01 riguarda la mancata limitazione delle scelte successive, non l'idea che ogni primo click nel luogo sia gratuito.
- **Grande repository:** costo del clone, disco di lavoro, artifact, traffico iniziale e memoria decodificata sono cinque misure diverse. Il piano grafico deve conservarne la distinzione.

## Piano di intervento senza cambiare le regole

1. **Rendere espliciti i contratti delle azioni.** Chiudere C01 con stato di attività prenotata/consumata e C02 con un ciclo di attività regia completo. Uniformare gli esiti dei comandi per C04 e invalidare letture file per C05. Verifiche mirate sui casi di errore reali, evitando test che si limitino a ricopiare l'implementazione.
2. **Stabilizzare migrazioni e distribuzione.** Allineare scene persistite/router, concatenare verifica e pubblicazione sullo stesso SHA, esercitare l'artifact Pages. Preparare fixture DEMO importabili mediante il vero pannello backup, senza iniettare dati nella campagna corrente.
3. **Separare regole e presentazione.** Catalogo mosse autorevole; VFX collegati per ID. Estrarre controller di battaglia a piccoli passi, mantenendo gli snapshot/ordini attuali e gli eventi già risolti. Versionare il fingerprint competitivo prima di futuri cambi di bilanciamento.
4. **Ridurre il costo operativo dei media.** Profili di checkout e artifact; originali conservati per hash, runtime selettivo e pack offline esplicito. Nessun taglio ai frame per compensare un packaging non selettivo. Misurare prestazioni e memoria sui dispositivi reali prima di cambiare formato o cache.
5. **Consentire il salto grafico con un contratto stabile.** Componenti di presentazione ricevono snapshot coerenti, token grafici e una sequenza di cue; animazioni, transizioni e regia si appoggiano allo stesso ciclo di attività. Il piano UI/RPG può così migliorare composizione, gerarchia, feedback e motion senza ricostruire la logica del turno dentro ogni nuova schermata.

## Lettura coperta e limiti residui

Moduli letti integralmente: router; scena città; engine battaglia e risoluzione; incontri/factory/deposito/cap; dati unificati e status; registrazione mappe locali; salvataggio, backup, journal, copie automatiche e pannello backup; proprietà sessione; regia/pausa/proiezione pubblica; challenge rules/runtime/persistenza/store/tipi; acquisto ed effetti; squadra/roster; preparazione sessione; overlay Admin; URL asset; fatti delle mosse; fixture dello studio. Sono inoltre letti i due workflow, configurazioni Vite/Vitest/Playwright/Tauri, packager web e hardening dipendenze. Gli intervalli delle letture parziali sono nel JSON.

**Restano da leggere sistematicamente:** le restanti porzioni del grande componente battaglia e delle scene mappa; editor UI e pipeline di presentazione; CSS e layout completi; gallerie e laboratori audio/VFX; tutte le ricette/pagine/asset; i pannelli delle interazioni (runtime, schema e store ora letti integralmente); tutti gli assert dei test; backend esterno e codice Rust desktop. Le prove di browser, tutte le schermate e animazioni, OBS/telefono, installatore Tauri, rete reale e qualità grafica comparata appartengono agli altri filoni dell'audit e non sono implicitamente completate da questo rapporto.

L'inventario automatizzato è riproducibile con lo script esterno al prodotto `C:/Users/andre/Documents/Codex/2026-10-19/https-github-com-andreatz-arkamon-beta/work/audit_inventory.py`. Il suo JSON comprende anche i file soltanto censiti, per rendere verificabile il lavoro ancora necessario.


## Fixture DEMO consegnate

Otto backup sintetici sono disponibili in [LEGGIMI-fixture-DEMO.md](./README.md#evidenze-locali-non-incluse) (origine locale: `outputs/evidence/fixtures/LEGGIMI-fixture-DEMO.md`). Ogni file ha zero avvisi del validatore reale, invarianti di scenario e roundtrip portabile identico; sidecar SHA-256 verificati da disco. Gli stati coprono città/percorso fallback dopo ingresso pagato, selvatico, NPC, Rivale PvP, evoluzione, intervallo Lega e gestione densa. Sono inclusi catalogo/configurazione DEMO validati e seed storage separati per un contesto nuovo. Non è stata eseguita alcuna interazione browser per produrli.


## Estensione successiva della lettura di dominio

La revisione è stata ampliata e la copertura iniziale sopra è aggiornata: 69 file letti integralmente, 13 parzialmente, 406 censiti. Il dettaglio, le conferme su sessione/interazioni/Lega/RNG e tre rilievi aggiuntivi C16–C18 sono in [Ampliamento-Audit-Codice.md](./Ampliamento-Audit-Codice.md). Il caso più delicato riguarda il recupero di una importazione solo catalogo con Lega identica e journal rimasto presente: è derivato dal codice e richiede una prova con lo store reale; non è stato eseguito da questo agente. Nessun nuovo esito di test/build viene implicitamente rivendicato.
