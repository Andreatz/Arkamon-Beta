# Audit Arkamon — 26 ottobre 2026

Per l'allineamento successivo alla richiesta di push, il catalogo aggiornato a 970 immagini e le verifiche aggiuntive, vedi [publication.md](publication.md). I risultati qui sotto descrivono la fase di audit precedente alla pubblicazione.

## Perimetro e metodo

Analisi del checkout locale `C:/Users/andre/Documents/Codex/2026-10-19/https-github-com-andreatz-arkamon-beta/checkout`, base Git `e7a40dc1`, comprendente le modifiche locali già presenti alla nuova UI e alle 110 splash. Queste modifiche sono state conservate. Nessun commit, push, merge o deploy fa parte di questo audit.

La ricognizione comprende codice applicativo, regole e dati di gioco, salvataggi e recupero, importazioni, sessione proprietaria, regia/pubblico, interfacce, Studio, animazioni, dipendenze, build e workflow. L'inventario iniziale dell'audit contava 529 file TS/TSX/JS/CSS in `src`, 58 in `e2e`, 39 in `scripts` e 3 in `tests`; comprende file generati e test. Le 77.108 righe in `src` non sono tutte logica scritta manualmente.

La lettura è stata approfondita nei percorsi di stato, battaglia, interazione, salvataggio, rendering e importazione; l'intera suite automatica e i flussi browser completano l'ispezione. Non si dichiara una lettura manuale di ogni riga generata, né che test verdi dimostrino assenza assoluta di bug. I rilievi storici sono stati ricontrollati sul codice attuale prima di considerarli ancora validi.

Priorità: P1 blocco importante o perdita della funzionalità; P2 errore concreto con condizioni specifiche; P3 difetto circoscritto. Le vulnerabilità delle dipendenze conservano separatamente la classificazione dell'advisory.

## Difetti confermati e corretti

| ID | Priorità | Problema prima del fix | Comportamento verificato dopo |
| --- | --- | --- | --- |
| GAME-01 | P1 | Gli incontri selvatici dai percorsi/griglia potevano montare soltanto il primo Arkamon: KO del primo = sconfitta, anche con riserve vive. | `iniziaBattaglia` completa il roster mancante, usa il lead corrispondente e ne valida HP/livello. Prova reale con veleno, sostituzione e ricarica; vedi [gameplay.md](gameplay.md). |
| SAVE-01 | P2 | Tre scene storiche accettate dal salvataggio (`palestra`, `centro-pokemon`, `squadra`) non esistono nel router e aprivano una schermata non implementata. | Migrazione alla mappa, storico di ritorno ripulito, battaglia valida conservata e ripresa con precedenza. Sei regressioni, senza alterare squadra, HP, status, monete o turno. |
| PERSIST-01 | P1 | Getter `localStorage` negato prima del montaggio: il bootstrap poteva interrompersi prima del titolo. | Il recupero intercetta anche l'accesso al getter. Titolo e comandi di recupero disponibili con `SecurityError` reale simulato nel browser. |
| PERSIST-02 | P2 | Importazione del solo catalogo comunicata come riuscita, poi annullata al riavvio se falliva la pulizia del journal e la Lega era invariata. | Commit esplicito `prepared/committed`, con rifiuto/rollback se il punto di commit non può essere conservato. |
| PERSIST-03 | P2 | Un vecchio recupero poteva sovrascrivere un catalogo modificato dopo l'interruzione. | Confronto del catalogo corrente con before/after; una terza versione resta intatta e richiede verifica esplicita. |
| PERSIST-04 | P2 | Preview isolate potevano leggere o ritirare il journal della partita reale. | Importazione rifiutata e recupero ignorato prima di qualsiasi accesso allo storage reale nelle tre modalità di anteprima. |
| PERSIST-05 | P2 | Rilettura fallita nella finestra già proprietaria: Promise rifiutata e stato `checking` senza uscita. | Stato di conflitto recuperabile, nessuna scrittura abilitata fino a rilettura riuscita. |
| PERSIST-06 | P3 | File A lento poteva sostituire l'anteprima B o riapparire dopo Annulla nel pannello Regia. | Revisione delle letture, controllo di risposte/errori obsoleti e invalidazione su annullamento/smontaggio. |
| PERSIST-07 | P2 | Catalogo interazioni danneggiato trasformato silenziosamente in `[]`, poi sovrascritto dal salvataggio successivo. | Originale conservato e scaricabile byte per byte; catalogo sospeso e sostituibile solo con consenso esplicito e dati validi. Backup campagna disponibile con omissione dichiarata del catalogo sospeso. |
| AUDIENCE-01 | P3 | Una risposta di rinnovo/revoca ospite precedente poteva cambiare stato o mostrare errori durante la sostituzione del collegamento. | Revisione e identità sessione controllate su successo ed errore; due regressioni che fallivano prima del fix. Nessun contatto con il servizio di produzione. |
| UI-01 | P2 | Un secondo puntatore modificava/terminava il trascinamento dello Studio; perdita del focus poteva lasciare il drag attivo. | Il trascinamento appartiene al puntatore iniziale e termina anche su blur/cancel/cleanup. Regressioni e riproduzione browser. |
| UI-02 | P2 | Percorsi come `/\\example.invalid/a.png`, ammessi da parser/editor/store Admin, vengono interpretati dal browser come URL esterni. | Validatore condiviso per importazione, scrittura e recupero dei vecchi slot; percorsi esterni respinti. Non è una dimostrazione di esecuzione di codice: il difetto riguardava il contratto degli asset locali. |
| UI-03 | P2 | Le sei righe dell'Arkadex superavano l'altezza disponibile fra 768 e 945 px. | Righe e ritratti si adattano allo spazio effettivo senza deformare le cornici; paginazione e contenuti verificati nei dialoghi reali. |
| UI-04 | P2 | Carrello completo ritagliato a 96/56 px: alcuni oggetti e comandi richiedevano scroll, anche a 1080p. | Riepilogo a due colonne, altezza libera e spazi compatti a 768 px; tutti i sette oggetti, totali, avvisi e comandi visibili. |
| UI-05 | P2 | La nuova skin nascondeva interamente il comando «Presenta scheda selezionata». | Controlli live compatti, con nomi accessibili, nel footer. La prova verifica presentazione intenzionale, segreti esclusi e rimozione della scheda al cambio schermata. |
| UI-06 | P3 | Impostazioni saltava da H1 a H3, segnalato dal controllo di accessibilità. | Titolo del pannello H2 e verifica Axe del dialogo senza violazioni. |
| UI-07 | P3 | Nel vecchio stile Taccuino, i quattro comandi potevano sovrapporsi alla lista dei compagni. | Comandi disposti su due colonne nel layout desktop compatto. Tutte e cinque le direzioni storiche continuano a funzionare nella galleria. |
| STUDIO-01 | P1 | «Applica al gioco» poteva funzionare in preview e ignorare ogni edit nel menù reale. | Runtime applicato alle radici correnti: testo, geometria, ordine, visibilità e livelli persistono anche dopo reload. |
| STUDIO-02 | P2 | Selettore asset rimasto ai vecchi file, privo dei PNG correnti e delle splash. | Catalogo rigenerato: 842 immagini, comprese 181 immagini UI fornite e 110 splash. |
| STUDIO-03 | P2 | Sostituzione di una cornice PNG dipinta sotto la cornice originale opaca. | Contratto della tessera individua il frame PNG effettivo, lo sostituisce e lo ripristina con «Originale». |
| STUDIO-04 | P2 | L'apertura della libreria montava 842 anteprime: la traccia registra circa 125 MB di immagini, con ritardi che potevano lasciare il menù su «Caricamento». | Pagine di 24 asset, ricerca e categorie sull'intero catalogo. La regressione originale e la nuova prova del limite passano senza intercettare richieste o aumentare i timeout. |
| DEP-01 | sicurezza strumenti | Vite 7.3.5, Vitest 4.1.11 e mocker correlato risultavano segnalati da `npm audit`. | Aggiornamento patch a Vite 7.3.7 e Vitest 4.1.12, lockfile e override coerenti; audit finale: zero vulnerabilità note segnalate. |

Dettagli delle sette correzioni di persistenza, prove prima/dopo e policy del catalogo: [persistence.md](persistence.md). Dettagli delle tre correzioni Studio e dei contratti mantenuti: [studio.md](studio.md).

Gli avvisi delle dipendenze riguardano gli strumenti di sviluppo/test; non si afferma che il sito statico distribuito sia stato compromesso. Fonti controllate: [advisory Vite/launch-editor](https://github.com/advisories/GHSA-587h-7wmj-h5pm), [advisory Vitest mocker](https://github.com/vitest-dev/vitest/security/advisories/GHSA-qxg6-89mg-rqv8), [secondo advisory Vitest Windows](https://github.com/vitest-dev/vitest/security/advisories/GHSA-xp26-3454-mjgp).

## Verifica locale

- Baseline: **4.120/4.120 test unitari** in 167 file, prima delle nuove regressioni.
- Verifica unitaria finale dopo le correzioni: **4.175/4.175 test in 173 file**, con quattro worker. L'esecuzione precedente senza limite di concorrenza aveva tre timeout sotto carico; non viene presentata come riuscita.
- Giro generale browser: **472 scenari**, **367 riusciti, 100 saltati secondo le condizioni delle spec e 5 falliti**. Quattro fallimenti riguardavano il pilota dei test (turno aggiuntivo lecito, attesa della mappa e viewport desktop nel profilo mobile); le riprove corrette sono riuscite. Il quinto ha portato alla correzione STUDIO-04. Le esecuzioni e riprove sono registrate separatamente in `verification.json`; non si dichiara un unico giro da 472 scenari interamente verde.
- Test sicurezza degli strumenti: **9/9**. Import asset e catalogo splash: **57/57**. Catalogo VFX coerente: **276 voci**.
- Dominio: **700 combinazioni di scambio** senza perdita/duplicazione e **3.680 attacchi** sui dati delle 110 forme con risultati validi. Non è una simulazione di ogni possibile partita; vedi rapporto gameplay.
- UI mirata: **31/31 scenari Chromium desktop**; verifica overflow reale fino a 1366×768, pannelli ausiliari, G1/G2, carrello massimo e cinque vecchi stili.
- Splash mobile mirata: **21/21 scenari**, con la carta 16:9 effettivamente dipinta sui telefoni e il canvas completo della galleria desktop. Il test misura il supporto grafico reale, anziché il backdrop nascosto su mobile.
- Studio, dopo l'ultima correzione della libreria: **19/19 scenari desktop**, comprendenti applicazione nel gioco, ricarica, import/export, font, cronologia, viste interne, mappe e sostituzione/restauro dei PNG. Le riprove dei cinque casi falliti nel giro generale sono tutte riuscite; il giro generale intero non è stato ripetuto dopo l'ultimo intervento.
- Build web limitata con `GITHUB_PAGES=true`: completata. TypeScript senza errori. Rimane l'avviso sul bundle iniziale, discusso sotto.
- Prova della build compilata: nuova partita, scelta dei due starter, ricarica e **12 viste gestionali** (sei schermate a 1366×768 e 1920×1080), senza errori JavaScript, scroll indesiderato o modifiche ai dati durante la consultazione. La cornice PNG applicata dallo Studio resta presente dopo uscita e reload.
- Prova compilata finale dello Studio dopo la paginazione: pagina successiva, ricerca Oniros 109 nell'intero catalogo, applicazione PNG, uscita e ricarica riuscite; aperture del menù misurate a **181 e 123 ms** in questa singola prova locale. Non è una misura generalizzabile delle prestazioni su tutti i dispositivi.
- Il primo giro ampio del browser ha scoperto errori di prodotto e attese obsolete; non viene presentato come riuscito. Sono stati aggiornati nomi/contratti dei test (Salvataggio, nove tessere, PNG, splash, tab Mosse), mantenendo controlli su dati, azioni, focus, geometria e accessibilità.

## Problemi strutturali e limiti ancora da pianificare

Gli interventi successivi su questi punti sono documentati separatamente nel [rapporto strutturale del 26 ottobre](../structural-2026-10-26/README.md). L'elenco seguente conserva la fotografia della fase di audit.

1. **Bundle iniziale ampio.** La build corrente segnala un chunk `index` di circa 864,48 kB minificati, 145,81 kB gzip. La build riesce, ma conviene separare meglio cataloghi/runtime amministrativo dalla prima schermata e misurare il caricamento su dispositivi modesti prima di scegliere il refactoring.
2. **Stato globale e cascata CSS complessi.** Lo store e le scene di battaglia concentrano molti comandi; le skin si sovrappongono attraverso più fogli CSS. I difetti di roster, runtime e altezza confermati mostrano dove servono confini espliciti e contratti condivisi. Un refactoring esteso non è stato mescolato alle correzioni puntuali.
3. **Coerenza fra comandi e UI.** Alcuni vincoli sono protetti anche dall'interfaccia, mentre comandi storici come `scambiaSlot` non verificano autonomamente tutta la modalità battaglia. Non è stato dimostrato un ingresso UI attuale che aggiri il blocco; resta utile rafforzare i confini di dominio e restituire risultati espliciti invece di azioni `void`.
4. **Gate della pubblicazione.** `.github/workflows/ci.yml` esegue i controlli su PR/manuale; `deploy.yml` sul push a `main` installa e compila, senza dipendenza esplicita dall'intera suite di quella revisione. Le protezioni remote del ramo non sono state verificate: non si afferma che un controllo sia aggirabile sul repository remoto. Conviene accoppiare verifica e pubblicazione della stessa revisione.
5. **Pacchetto desktop/Tauri.** Il build ordinario copia il grande albero `public`, mentre quello web usa il pacchetto limitato; non è stato prodotto o installato un eseguibile Tauri. `csp: null` è ancora una scelta da riesaminare per quel rilascio; non è stata provata una vulnerabilità sfruttabile nell'app desktop.
6. **Servizi esterni e dispositivi reali.** Il test del comando ospite privato richiede il servizio isolato Arkanight e resta escluso quando manca `ARKAMON_GUEST_E2E_SERVICE`. Voto e ospite sono verificati localmente con contratti simulati, senza credenziali o scritture su produzione. Chromium mobile emulato non sostituisce una prova su telefono fisico; OBS, Browser Source con profilo separato e sospensioni lunghe non sono stati validati qui.

## Evidenze e conservazione

`output/audit-2026-10-26/` contiene JSON, log, screenshot e trace locali ed è escluso dal versionamento. Questa cartella `docs/audit-2026-10-26/` conserva i rilievi, le correzioni e il riepilogo dei risultati in forma versionabile. Le nuove regressioni restano vicino ai moduli e in `e2e/`. Le illustrazioni approvate non sono state rigenerate durante questo audit.
