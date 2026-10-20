# Strumenti della partita interamente visibili

La revisione del 21 ottobre corregge lo scorrimento verticale degli strumenti desktop e la differenza tra i selettori G1/G2 passando da Borsa/Squadra alle altre schermate. Riguarda le schermate reali della campagna, senza parametri di anteprima.

## Disposizione

- Barra dei giocatori, navigazione e comandi inferiori sono comuni a tutte le viste, comprese le sezioni del Menù Partita. G1 e G2 usano `Scuro/bottone.svg` e `Scuro/bottone-selezionato.svg`; la selezione è l'unica differenza intenzionale. Gli SVG vengono mostrati interi con proporzioni conservate e i nomi rimangono nell'area utile.
- Borsa: inventario completo a dodici posti, articolo selezionato e pannello reale di utilizzo occupano tre colonne. Le icone rimangono centrate nei sette slot occupati. Dimensioni e proporzioni del quadro dipendono dall'altezza effettivamente disponibile.
- Squadra: ritratto, informazioni e mosse/comandi occupano tre colonne. I sei compagni, HP, status, fascia livelli e avvisi del riordino sono visibili insieme. I ritratti usano i PNG frontali ufficiali.
- Arkastore: catalogo completo dei sette articoli, dettaglio con quantità/avvisi e carrello occupano tre colonne. Tutte le righe del carrello, i totali e il comando di acquisto restano visibili. L'ingresso conserva il vincolo dell'interazione sulla mappa.
- Deposito, Arkadex, Analisi e Menù Partita usano il layout desktop anche sotto 820 pixel di altezza. A 1366×768 spazi e caratteri si adattano; il ritratto dell'Arkadex rimane visibile accanto al catalogo e alla scheda. Tutti i 35 posti del box sono presenti.
- Impostazioni, Gara e Backup distribuiscono i contenuti in colonne. Diario espone Medaglie, Luoghi, Tappe e Cronaca come sezioni; Registro, Cronache e risultati delle Sfide usano pagine esplicite. Le pagine cambiano soltanto la consultazione: dati ed esportazioni rimangono completi.
- Sfide distingue configurazione, squadre/avvio, condivisione, risultati, crediti e classifica. Il catalogo Fanta-Team è ricercabile e paginato. L'avvio conserva la validazione delle regole e la protezione della campagna.

Alle risoluzioni desktop verificate, il contenitore principale non usa uno scorrimento per raggiungere i comandi. Non vengono applicati zoom dell'intera pagina o ritagli del contenuto per simulare il risultato. I telefoni mantengono una disposizione verticale consultabile mediante scorrimento, con slot e comandi adatti alla larghezza disponibile. Anche le finestre desktop inferiori a 700 pixel di altezza tornano al flusso naturale, con il footer dopo i contenuti, per mantenere raggiungibili tutti i comandi.

## Verifica riproducibile

`e2e/player-ui-1080.spec.ts` controlla le sei viste sia nel dialogo della partita sia nella scena Deposito, a 1920×1080, 1920×945, 1920×900 e 1366×768. I controlli richiedono `scrollHeight <= clientHeight`, comandi e testo nel viewport, assenza di ritagli verticali, ritratti completi e conservazione dei dati della campagna. Vengono esercitati G1 e G2, nomi lunghi, sei compagni, 35 riserve, schede e pagine dell'Arkadex, avvisi e carrello di sette articoli.

I test di navigazione verificano inoltre che il selettore G1/G2 mantenga la stessa famiglia di asset e l'adattamento proporzionale in tutte le viste. Le schermate mobili, l'uso delle cure, gli acquisti e le Sfide restano coperti dai relativi scenari browser.

Le catture locali sono salvate nelle cartelle `outputs/fullscreen-team/`, `outputs/live-assets/` e `outputs/playerui-scroll-after/` della sessione; non contengono dati di una campagna personale e non sono parte del bundle di gioco. Le anteprime statiche archiviate in `docs/ui-previews/` documentano revisioni precedenti e non rappresentano questo layout corrente.

## Esito della revisione

- Suite completa Vitest: 162 file e 3.859 test superati.
- Selezione browser: 78 combinazioni tra Chromium e telefono; 16 casi desktop esclusi esplicitamente dal progetto mobile. Dei 62 casi applicabili, 61 sono passati nella prova integrata; il caso Fanta-Team a 1280×720 ha rilevato il comando sotto il footer, è stato corretto e ha superato la riesecuzione mirata. Tutti i 62 casi applicabili sono quindi verificati.
- Le verifiche geometriche non ammettono eccezioni per Borsa o Squadra: tutte le sei viste devono rientrare interamente nel viewport desktop. I controlli includono cornici G1/G2, letture del Diario/Registro e pagine delle Sfide.
- Prove isolate aggiuntive: 96 stati dei selettori dei giocatori, tutte le selezioni di Squadra anche con quattro mosse di stress, sette oggetti per entrambi i giocatori con nomi lunghi, carrello completo, 60 eventi, otto cronache e 30 risultati/classifiche. L'esportazione del Registro conserva tutti gli eventi filtrati.
- Backup provato con importazione non valida, anteprima, annullamento, consenso e ripristino persistente a 1280×720, 1366×768, 1920×1080 e su telefono. Fanta-Team provato anche a 1280×720; finestre di 640 pixel controllate per assenza di sovrapposizione del footer.
- TypeScript e build con base GitHub Pages superati. Il pacchetto compilato è stato aperto in browser a 1440×1000 e 390×844: asset dedicati caricati, proporzioni conservate e nessun errore JavaScript.
