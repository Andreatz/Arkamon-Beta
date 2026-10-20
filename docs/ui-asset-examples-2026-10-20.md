# Esempi UI con asset per ruolo

La pagina `/?uiStudioPreview=1&assetExamples=1` mostra quattro esempi di impaginazione che usano gli SVG originali: Borsa, Squadra, Laboratorio e Comandi/opzioni. Si apre nello stesso server locale del gioco. I dati sono dimostrativi e tutte le interazioni rimangono nello stato locale di React; la pagina usa la modalità di anteprima che disabilita la persistenza della campagna.

Il selettore **Tre famiglie / Asset dedicati** confronta le cornici generiche con gli SVG specifici sullo stesso layout di esempio. Non è un confronto tra due versioni complete delle schermate di gioco.

## Integrazione attiva nel gioco

Il commit iniziale `d8962760` conteneva la gallery separata e la prima integrazione di icone e frecce. Le composizioni approvate non erano ancora usate dalle schermate della campagna. L'integrazione successiva descritta qui corregge questo limite: aprire il gioco senza parametri di anteprima per usare la nuova UI con i dati della partita.

- **Borsa:** il menu della partita apre `BagScreen` con `box-inventario.svg`, selezione centrata e `box-1.svg` per le scorte. Inventario, filtri, bersaglio, anteprima della cura, restrizioni di turno/Lega/battaglia e consumo dell'oggetto continuano a usare lo store e `ItemUsePanel`. Su telefono la medesima lista diventa una griglia di cornici singole.
- **Squadra:** `TeamScreen` usa cornice ritratto, pannello informazioni, barra completa a sei posti e pulsanti dedicati. Selezione, HP/status, mosse, analisi, riordino e passaggio a Borsa/Deposito conservano i dati e i controlli reali. I telefoni usano slot singoli e scorrimento verticale.
- **Laboratorio:** la scelta effettiva degli starter usa le tre capsule e il dialogo del Professore. I nomi dei due giocatori vengono confermati tramite la transazione esistente; selezione esclusiva, salvataggio e ingresso nella mappa restano operazioni della campagna. Su telefono il laboratorio occupa l'altezza dello schermo e torna in alto dopo la conferma dei nomi.
- **Controlli:** il checkbox audio nativo mostra `toggle-on/off.svg` e conserva la preferenza al reload; il negozio usa i tre SVG del selettore quantità con input numerico e limiti originali; i dialoghi che espongono il comando Chiudi usano il relativo SVG. La Player UI conserva il comando Riprendi il Viaggio.

`StudioSurface` e `StudioCommand` renderizzano gli SVG interi conservandone il rapporto. La gallery resta disponibile come confronto dimostrativo, con un collegamento al gioco normale. Il Deposito a 35 posti e le altre schermate non illustrate negli esempi conservano le composizioni precedenti.

## Uso degli asset

- Borsa desktop: `Scuro/box-inventario.svg` contiene dodici posti a coordinate fisse. L’anteprima allinea sette articoli del catalogo reale alla sua griglia 4×3; non modifica i 35 posti del Deposito. Sul telefono usa singole `cornice-piccola.svg`/`cornice-piccola-selezionata.svg` in due colonne per mantenere leggibili i nomi.
- Il pulsante, l’icona e la cornice di selezione sono ancorati al centro di ogni posto. L’altezza intrinseca delle immagini non sposta più gli oggetti verso l’alto o verso il basso; i nomi restano sotto l’icona.
- Squadra: `Scuro/cornice-arkamon.svg`, `box-2.svg` e la striscia completa `squadra.svg` con sei compagni. Sul telefono la striscia è sostituita da slot singoli. I PNG sono gli sprite frontali ufficiali, inquadrati tramite i metadati esistenti.
- Laboratorio: `Comuni/capsula-lab-blu.svg`, `capsula-lab-nera.svg`, `capsula-lab-viola.svg` e `dialogo-lab.svg`. Il ritaglio SVG elimina soltanto la tela vuota, mantenendo le coordinate dipinte e lo stesso fattore di scala sui due assi. Il testo del Professore nel file originale non viene duplicato da HTML. Sul telefono il dialogo usa `dialogo-scuro.svg` e un testo HTML più breve.
- Controlli: toggle on/off, frecce, pulsante di chiusura e tre parti separate del selettore quantità. Pulsanti nativi, nomi accessibili, disabled ai limiti, focus visibile e valori annunciati tramite `aria-live`.

Gli SVG dedicati sono immagini intere con `object-fit: contain` dentro contenitori dal medesimo rapporto del `viewBox`. Non sono convertiti in `border-image`. I sorgenti originali restano intatti.

## Prima integrazione nelle schermate reali

`KitIcon` collega otto ruoli semantici alle icone individuali Studio: Analisi, Arkadex, Deposito, Diario, Impostazioni, Negozio, Cronache e Sfide. Le icone generiche non vengono riassegnate quando il loro significato dipende dal contesto.

`KitButton` supporta `artwork="previous"` e `artwork="next"`. Arkadex e Deposito usano frecce SVG complete su pulsanti 52×44, conservando proporzioni, callback, etichette e condizioni di disabilitazione. Su telefono il selettore giocatore può ridurre la larghezza delle due opzioni senza allargare l’intera finestra.

Questa prima fase lasciava i pannelli del gioco alle composizioni precedenti. La sezione iniziale descrive l'integrazione successiva di Borsa, Squadra e Laboratorio; non implica la sostituzione di tutti i pannelli del progetto.

## Verifica della prima fase

- TypeScript senza emissione: superato.
- 19 test esistenti relativi a squadra, cataloghi e navigazione: superati.
- Verifica completa prima del push: 162 file e 3.858 test Vitest superati, 9 test di sicurezza superati e catalogo VFX verificato.
- Anteprima: 4 esempi × 2 stili × 4 larghezze (1440, 1280, 390, 320), per 32 combinazioni. Nessun errore del browser, risorsa mancante o overflow orizzontale del contenitore.
- Borsa: centro delle sette icone confrontato con il centro degli slot alle quattro larghezze e in entrambi gli stili, con tolleranza massima di 1 pixel CSS.
- Interazioni demo: selezione e filtro degli oggetti, selezione compagno/starter, toggle, quantità, paginazione, chiudi/riapri.
- Schermate reali: cambio box avanti/indietro e paginazione Arkadex avanti/indietro, stato disabled, decode icone e geometria 52×44; verificate a 1920×1080 e 390×844 in contesti browser isolati.
- Regressioni browser prima del push: 41 scenari superati per negozio, Player UI, Studio, mappe e movimento, più 2 scenari di conferma evoluzione dopo salvataggio durabile. I 15 skip della selezione sono vincoli espliciti dei casi riservati al desktop. La Borsa in battaglia conserva i controlli Axe: intestazione interna senza banner duplicato e selezione del bersaglio esposta con `aria-pressed`.
- Bundle Vite verificato senza ricopiare l’intero archivio multimediale. Questa verifica non certifica una pubblicazione del sito.

Le catture e i dati QA locali sono nella cartella della chat `outputs/asset-examples/`. Le catture mobili mostrano il contenuto completo alla stessa larghezza; i controlli di overflow e delle interazioni sono eseguiti anche nel viewport 390×844.

Per ripetere le 32 verifiche sul server locale avviato con `npm run dev`, eseguire `node scripts/verify-ui-asset-examples.mjs`. Lo script usa Chromium di Playwright e salva immagini e risultati nella cartella ignorata `output/ui-asset-examples/`. Se il server usa un’altra origine, impostare `UI_EXAMPLES_URL`; `UI_EXAMPLES_OUTPUT` permette di scegliere la destinazione delle catture.

## Verifica dell'integrazione reale

- Suite completa: 162 file, 3.859 test superati.
- Browser: selezione di 44 scenari per acquisti/cure, strumenti, salvataggi e Studio; 39 superati e 5 riservati esplicitamente al desktop. Le asserzioni aggiuntive verificano gli SVG approvati nelle schermate reali, senza i parametri della gallery, il toggle audio dopo reload e le tre capsule nel flusso della nuova partita.
- Contenuti massimi: 11 scenari desktop superati a 1920×900, 1920×945 e 1920×1080, con nomi lunghi, sei compagni, 35 riserve, catalogo Arkadex completo e carrello di sette articoli. Borsa e Squadra usano uno spazio di scorrimento contenuto nella finestra; i controlli verificano raggiungibilità, testo e ritratti completi, area cliccabile, sorgenti ufficiali e conservazione della campagna. Le altre quattro viste mantengono la verifica dell'intero contenuto senza scorrimento.
- Borsa e Squadra provate a 1920×1080, 1280×900, 390×844 e 320×844: selezione da tastiera, filtri, memoria separata dei giocatori, callback e riordino; nessun overflow orizzontale. Tutte le sette icone della Borsa sono centrate con scostamento inferiore a un pixel CSS.
- Cura e acquisti verificano consumo, turno e persistenza tramite i test esistenti. La consultazione e il riordino conservano HP, status, inventario e numero di azioni.
- Laboratorio controllato a 1440×1000, 768×1024, 390×844 e 320×844; quattro scenari browser verificano anche fallimento/riprova del salvataggio dei nomi, scelta dei due starter e reload.
- Studio: sostituzione e ripristino delle nuove cornici di Squadra e comandi, con PNG ufficiali, testi, icone, HP e salvataggio invariati. Il caso browser delle skin di Squadra/Analisi/Arkadex è superato.
- TypeScript e build GitHub Pages superati. La build confezionata con base `/Arkamon-Beta/` è stata aperta in browser a 1440×1000 e 390×844: SVG dedicati caricati nelle schermate reali Borsa/Squadra, senza parametri di anteprima, errori JavaScript o overflow orizzontale.

Le catture dell'integrazione sono evidenze locali in `outputs/live-assets/` e `outputs/live-laboratory/` della sessione. I controlli browser riproducibili sono nei file `e2e/player-ui-integration.spec.ts`, `e2e/player-tools.spec.ts`, `e2e/arkastore.spec.ts`, `e2e/player-ui-1080.spec.ts`, `e2e/ui-studio-assets.spec.ts` e `e2e/ui-studio-editor.spec.ts`.
