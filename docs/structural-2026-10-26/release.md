# Pubblicazione della revisione verificata

La verifica e il deploy sono ora nello stesso workflow `.github/workflows/ci.yml`. Il precedente `deploy.yml`, che ricompilava sul push senza attendere la suite, è stato rimosso.

Il job `test-build` conserva il nome del controllo esistente ed esegue su PR, push a `main` e avvio manuale:

1. Installazione dal lockfile con Node 22, test unitari con quattro worker e contratti del rilascio, del relay e del budget iniziale.
2. Regressioni di sicurezza delle dipendenze, immagini UI, catalogo media e corrispondenza fra dati autoriali e proiezione runtime.
3. Una sola compilazione del pacchetto Pages, verifica del manifest media e del budget dei file iniziali.
4. Suite browser completa, in due gruppi complementari eseguiti in sequenza (flussi e animazioni native), compresi i test che importano intenzionalmente i moduli di sviluppo per verificare recupero e protezione delle scritture. Entrambi conservano il limite globale originario e un worker. I rapporti blob vengono riuniti con `playwright merge-reports`, senza eliminare errori o saltare casi. La separazione impedisce che il tempo cumulato dei due gruppi superi il limite di una singola invocazione.
5. Tre prove indipendenti sulla build compilata che sarà pubblicata: creazione e ricarica della partita, dodici viste gestionali e trasporto pubblico fra profili browser separati.
6. `release-verification.mjs seal` e `verify`: controllo dei rapporti e inventario SHA-256 di tutti i file del pacchetto. La ricevuta `release-verification.json` registra la revisione Git completa, i conteggi e gli hash dei rapporti. Fallimenti, suite vuote, test compilati saltati o risultati instabili impediscono di sigillare il pacchetto.

Solo `main` può caricare l'artefatto Pages e avviare `deploy`. Il job finale dipende dal successo di `test-build`, utilizza l'artefatto della stessa esecuzione e non ricompila. I permessi `pages: write` e `id-token: write` appartengono soltanto a quel job; i test hanno `contents: read`. Le PR non pubblicano. La concorrenza serializza i rilasci di `main` e annulla soltanto i precedenti controlli delle PR.

Questa struttura segue il collegamento fra job e artefatti descritto nella [documentazione GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) e il principio dei [permessi minimi del token](https://docs.github.com/en/actions/tutorials/authenticate-with-github_token). Il confezionamento di Pages usa un archivio dell'intera directory, inclusi i file nascosti necessari, senza un secondo build.

## Verifiche locali

- I test di sigillatura usano file e rapporti temporanei reali: una revisione differente, un file aggiunto dopo il controllo, un rapporto fallito o instabile e una suite compilata esclusa vengono rifiutati.
- Tredici contratti Node del rilascio, del relay, del budget e della separazione delle risorse desktop superati; i risultati della suite unitaria e browser generale sono nel rapporto complessivo di questo intervento.
- I due workflow sono stati analizzati con `actionlint 1.7.12`, distribuzione ufficiale con checksum confrontato: nessun errore.
- Build Pages finale riuscita, tre prove compilate riuscite. Log e screenshot in `output/structural-2026-10-26/`, rapporto Playwright in `output/ci/compiled.json`.

Non è stato avviato un workflow remoto né modificata una protezione del ramo durante questo intervento. La nuova sequenza entra in funzione quando questi sorgenti vengono pubblicati. La ricevuta non viene attribuita localmente a un vecchio commit: il checkout contiene ancora le modifiche in esame; `GITHUB_SHA` viene associato al pacchetto nel checkout pulito della CI.

La verifica dell'inventario raccolto da Playwright conferma che i filtri selezionano **478 scenari univoci: 348 flussi e 130 animazioni**, senza sovrapposizioni, casi mancanti o aggiunte. La riunione dei rapporti segue il [meccanismo ufficiale dei rapporti blob](https://playwright.dev/docs/test-sharding#merging-reports-from-multiple-shards). Il gate è stato controllato anche contro i rapporti locali realmente interrotti o falliti e li rifiuta: una suite fermata non diventa riuscita soltanto perché i casi non eseguiti sono presentati come saltati nel riepilogo.

Il collaudo locale completo è stato risolto attraverso esecuzioni conservate e riprove mirate: **376 casi riusciti e 102 esclusioni dichiarate**, tutti i 478 identificativi riconciliati e nessun caso rimasto da verificare. Nei flussi: 287 riusciti e 61 esclusi. Nelle animazioni: 89 riusciti e 41 esclusi; i 64 casi già eseguiti nel primo giro sono stati conservati e i 66 rimanenti sono stati selezionati per identificativo con `--test-list`, verificando unione completa e intersezione vuota. La riprova della forma 45 e i 26 casi attivi mobili sono riusciti, insieme alle 39 esclusioni mobili dichiarate. Il catalogo mobile ha verificato nuovamente tutte le 110 forme in Squadra e Arkadex, 220 viste senza problemi.

Questo risultato **non è presentato come un'unica esecuzione verde**. Il primo giro completo si era fermato al limite globale sotto carico e 356 scenari non erano stati eseguiti. Il successivo giro dei flussi ha conservato un'asserzione tardiva sul risultato transitorio dei dadi e 30 errori di connessione al server di sviluppo. Le riprove hanno corretto l'osservazione del test e verificato gli scenari senza modificare tempi o controlli del prodotto. I rapporti grezzi, i fallimenti e la storia per identificativo restano disponibili. [browser-verification.json](browser-verification.json) riporta conteggi, selezioni e hash dei rapporti; `output/structural-2026-10-26/browser-consolidated-final.json` conserva tutti i 478 casi con provenienza e tentativi precedenti. Il consolidamento descrittivo locale non viene accettato come rapporto Playwright dal gate della pubblicazione.

Durante il collaudo è emerso anche un conflitto fra il server di sviluppo e la compilazione desktop: gli HTML prodotti da Tauri potevano provocare una ricarica della partita o smontare il banco delle animazioni. La configurazione Vite comune esclude ora `src-tauri/target`, `dist`, `dist-desktop` e `dist-desktop-resources`, oltre ai rapporti. La prova comportamentale ha creato quattro HTML temporanei in quelle directory con il browser aperto: **zero navigazioni e memoria del documento conservata**. I file temporanei sono stati rimossi; la prova è registrata in `output/structural-2026-10-26/generated-html-isolation.json`.

## Servizio privato

L'integrazione del comando ospite appartiene a un repository separato e privato. Il workflow manuale `private-guest.yml` esegue il servizio reale fissato a una revisione, con archivio temporaneo e senza credenziali del database. Per usarlo su GitHub occorre un secret `ARKAMON_BACKEND_READ_TOKEN` limitato alla lettura del repository Arkanight. Non è stato creato né copiato un token personale. La prova reale è stata eseguita localmente; dettagli e limiti in [external-verification.md](external-verification.md).
