# Pacchetto desktop e politica dei contenuti

## Una build selettiva anche fuori da Pages

`vite.config.ts` espone `createGameConfig`: tutte le compilazioni di produzione usano il confezionamento validato già adottato dal sito. Il comando ordinario non copia più circa 9.107 MiB di `public` senza selezione. Restano gli asset statici richiesti dal gioco e dallo Studio; i video sorgente e gli atlanti completi non entrano nell'eseguibile.

`npm run build:desktop` compila con base `/` in `dist-desktop`, distinta da `dist`. Tauri incorpora soltanto il frontend di circa **4,2 MiB**; circa **799,9 MiB** di immagini, font, audio e filmati selezionati entrano nell'installer come risorse separate in `dist-desktop-resources`. La modalità desktop conserva la base corretta anche se l'ambiente ereditasse `GITHUB_PAGES=true`. Le configurazioni di sviluppo e test continuano a utilizzare i file locali.

Il pacchetto corrente è circa **802,7 MiB**, con **455 clip native**. I media pesanti vengono richiesti dalla revisione immutabile `11eb8edfcaad86d2d6d59fcdfbc77682d1dc8367`, come nel sito. Questa distribuzione desktop richiede quindi una connessione per quelle animazioni, suoni ed effetti; non viene presentata come pacchetto completamente offline. I sorgenti e gli strumenti per confezionare separatamente le pagine restano nel repository.

I dati runtime delle mosse vengono verificati prima di entrambe le build. Il controllo del budget usa il manifest generato anche per `dist-desktop`, includendo ogni dipendenza statica effettiva.

`separate-desktop-resources.mjs` impone un limite di 12 MiB al frontend incorporato. Il confezionamento desktop copia i media direttamente nella cartella risorse, evitando una seconda copia temporanea da 800 MiB. I file sono enumerati dal manifest validato: il codice JavaScript generato resta incorporato anche se condivide la directory `assets/` con i media autoriali. Percorsi esterni, link simbolici e risorse obsolete presenti da un precedente build vengono rifiutati.

La finestra principale è creata dal codice Rust con `on_web_resource_request`. Il gestore legge soltanto formati multimediali consentiti sotto `resource_dir/assets`, verifica il percorso canonico e mantiene gli URL della stessa origine già usati dal gioco e dai CSS. Supporta `HEAD` e intervalli video limitati a 8 MiB per lettura. Non espone un comando filesystem al frontend. Questa separazione segue il [confezionamento delle risorse di Tauri](https://v2.tauri.app/develop/resources/).

## CSP attiva

La precedente impostazione `csp: null` è sostituita da una politica esplicita:

- script del pacchetto, senza `unsafe-eval` o esecuzione libera di script inline;
- oggetti incorporati disabilitati, base e iframe limitati alla stessa origine;
- immagini e media locali, importazioni `blob:`/`data:` e pagine del repository media previsto;
- font locali o importati, stili inline necessari alla geometria e alle personalizzazioni dello Studio;
- connessioni IPC esplicite e HTTP/HTTPS per il servizio ospite, il cui indirizzo è configurabile dal conduttore. Non è un'autorizzazione a caricare script remoti.

La politica di sviluppo abilita separatamente gli script di Vite e le connessioni HMR locali; non introduce quei permessi nel rilascio. Nessuna nuova capacità filesystem, shell o comando nativo è stata concessa. La configurazione segue la [politica CSP di Tauri](https://v2.tauri.app/security/csp/) e la [specifica della configurazione](https://v2.tauri.app/reference/config/).

Il relay della regia è un servizio esplicito per la versione HTTP locale, non un'estensione dei privilegi dell'app. La cattura della finestra resta il percorso previsto per la finestra Tauri.

## Compilazione e prove

Sono stati usati gli strumenti C++ già installati e una toolchain Rust temporanea del solo lavoro, senza modificare il PATH di sistema. La prima collocazione della toolchain superava il limite di percorso accettato dal linker Windows: i file sono stati spostati in una directory temporanea più corta, senza cambiare i sorgenti o i prerequisiti del progetto.

Il controllo Rust è riuscito con Tauri 2.11.2. I primi tentativi di incorporare 800 MiB nella macro Rust hanno mostrato un costo elevato di compressione e generazione del codice; sono stati interrotti e non vengono usati come benchmark riusciti. La correzione strutturale separa i media dall'eseguibile. La compressione interna Tauri resta disabilitata, mentre l'installer può comprimere le risorse. Non sono state ricampionate immagini o alterate le pagine native.

Quattro contratti Node verificano separazione dei file, percorsi respinti, risorse obsolete e scrittura diretta senza duplicazione. Due test Rust verificano letture consentite, confinamento dei percorsi, MIME, `HEAD` e intervalli. Il normale controllo Cargo e la compilazione di sviluppo non provano il confezionamento di produzione: quest'ultimo deve usare anche la feature `tauri/custom-protocol`. L'esito preciso del binario e dell'installer finale è registrato in `verification.json`.

La compilazione nativa di produzione è riuscita in **4 minuti e 47 secondi**, con un worker e il protocollo del pacchetto attivo. L'eseguibile risultante è di **13.163.008 byte**. Il comando di confezionamento ha poi prodotto `src-tauri/target/release/bundle/nsis/Arkamon_0.1.0_x64-setup.exe`, **724.513.101 byte**, SHA-256 `464037da85b5a9d59e3a54fe69aecb83231162c2117dd286a811f6c9ca6568e5`. Il file è locale e ignorato da Git. L'installer non è firmato, installato o avviato durante questa verifica; nessuna impostazione del profilo utente è stata modificata.

`npm run test:desktop` esegue due prove sul pacchetto desktop compilato con la CSP effettiva come header HTTP:

1. Tutte le sei schermate, assenza di scroll indesiderato, nove cornici decodificate, nessun errore JavaScript o variazione del checkpoint. Un tentativo di inserire uno script inline e uno remoto viene bloccato prima dell'esecuzione.
2. Anteprima Studio nello stesso iframe, sostituzione della cornice del Registro, applicazione al gioco, uscita e ricarica: la personalizzazione resta funzionante.

**2/2 prove riuscite.** È una verifica browser del pacchetto e della politica; non viene confusa con l'installazione dell'eseguibile o un test completo WebView2. I risultati dell'installer effettivamente prodotto sono registrati nel riepilogo `verification.json`.

Per ripetere la compilazione Windows occorrono i [prerequisiti ufficiali](https://v2.tauri.app/start/prerequisites/) e il comando `npm run tauri:build -- --bundles nsis`. Il percorso Rust e il PATH temporanei di questa macchina non vengono versionati; non sono richiesti per un ambiente normalmente configurato.
