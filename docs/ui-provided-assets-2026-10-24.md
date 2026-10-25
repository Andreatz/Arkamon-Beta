# Integrazione degli SVG forniti nell’interfaccia Aurora

Data: **24 ottobre 2026**.

> **Documento storico.** Dal 25 ottobre 2026, su richiesta dell’utente, la UI Aurora utilizza gli elementi PNG forniti in `Arkamon.zip` al posto delle decorazioni derivate dagli atlanti SVG. La nuova provenienza, i collegamenti ai componenti e la pipeline sono descritti in [Asset PNG forniti per la UI Aurora](./ui-provided-png-2026-10-25.md). I dettagli e le verifiche seguenti documentano la versione precedente e non attestano la nuova integrazione PNG.

Questa integrazione applica gli elementi grafici forniti dall’utente alla UI Aurora, già costruita a partire dai riferimenti di Menù principale, Squadra, Deposito, Arkadex, Negozio e Mappa locale. La modifica riguarda le illustrazioni e i componenti dell’interfaccia; i fondali rimangono separati e potranno essere sostituiti con le immagini pulite che fornirà l’utente.

Gli originali forniti dall’utente sono conservati senza modifiche nelle cartelle `C:/Users/andre/Downloads/Sprite/Assets-Arkamon-SVG/SVG` e `C:/Users/andre/Downloads/Sprite/Arkamon-Medaglie-Simboli-SVG/SVG`. L’interfaccia non carica i venti atlanti completi e non li inserisce nel DOM: usa gli elementi estratti singolarmente, con i relativi stati.

## Catalogo e stato del lavoro

Sono state analizzate **20 tavole**. Il catalogo di estrazione contiene **96 ritagli da 18 tavole**; le due tavole modulari ridondanti, 13 e 14, non richiedono nuovi ritagli per questa integrazione.

L’estrazione vettoriale corrente ammonta a **120.206.572 byte SVG** complessivi. I **96 WebP trasparenti** predisposti per il browser pesano in totale **6.580.394 byte**, circa il **94,5% in meno**. Ogni schermata richiede i derivati dei componenti che monta, comprese le varianti di stato predisposte; non carica l’intero catalogo. Gli SVG rimangono disponibili come sorgenti vettoriali dei singoli elementi.

La presenza di un ritaglio nel catalogo indica che l’elemento è disponibile; non obbliga a mostrarlo in ogni schermata. Le icone relative a dati assenti nel modello, per esempio altezza, peso o talento, non introducono nuove statistiche nel gioco.

## Destinazione delle venti tavole

| Tavola fornita | Elementi selezionati e destinazione | Elementi esclusi o limitazioni |
| --- | --- | --- |
| `01-cornici-e-pannelli.svg` | Anello runico trasparente dietro i ritratti ufficiali; cornice habitat disponibile per contenuti coerenti. | I pannelli completi non vengono allungati per riempire finestre di rapporto diverso. |
| `01-medaglie-palestra.svg` | Otto medaglie separate per i progressi reali dei giocatori. | Le medaglie acquisite dipendono dallo stato della partita, non da una sequenza grafica prestampata. |
| `02-arkadex-intestazioni-etichette.svg` | Intestazione vuota, con titolo scritto dall’interfaccia. | Escluse etichette e contatori incorporati che sostituirebbero i valori reali. |
| `02-simboli-elementali.svg` | Simboli separati per i tipi supportati: Normale, Fuoco, Acqua, Erba, Elettro, Terra, Oscurità e Psico. | I simboli accompagnano il nome del tipo effettivo; non cambiano le relazioni o le regole dei tipi. |
| `03-tabs-pulsanti-controlli.svg` | Pulsanti vuoti normali, hover, selezionati e disabilitati; schede vuote per le sezioni. | Il testo rimane HTML reale e accessibile. I controlli vengono composti mantenendo le proporzioni dell’illustrazione. |
| `04-ricerca-filtri-scroll.svg` | Campi di ricerca e filtro, con le rispettive versioni di focus, disponibili per misure compatibili. | Le dimensioni del componente devono rispettare il rapporto del disegno; non si deforma il campo per adattarlo a ogni larghezza. |
| `05-righe-creature.svg` | Righe vuote dedicate a Squadra e Arkadex, con stati normale, selezione, hover e indisponibile. | Escluse le righe con «Nome Creatura», numeri fittizi o tipi prestampati. Nome, livello, stato e HP restano separati. |
| `06-schede-profilo-evoluzioni.svg` | Pergamena compatta vuota per i dati effettivi e tessere evolutive vuote/con lucchetto. | Esclusi pannelli con altezza, peso, talento o valori di esempio incorporati. Le forme sconosciute non vengono rivelate. |
| `07-icone-componenti-modulari.svg` | Libro, ricerca e frecce per la navigazione; filtro, scoperta, cattura e lucchetto restano disponibili nel catalogo. | Un’icona disponibile non autorizza ad aggiungere dati o comandi assenti dal gioco. |
| `08-profilo-giocatore-cornici.svg` | Cornici delle tessere del menù e variante selezionata con gemma. Il controllo di chiusura rimane disponibile nel catalogo. | Identità, nome, ruolo e progressi dei giocatori sono quelli della campagna. |
| `09-illustrazioni-menu.svg` | Illustrazioni dedicate a Squadra, Arkadex, Borsa, Deposito, Mappa, Diario, Registro, Salvataggio e Impostazioni. | Lo scudo con creature è un’illustrazione della categoria Squadra; non viene presentato come composizione attuale del roster. |
| `10-allenatori-creature-medaglie.svg` | Tessere creatura vuote normali/selezionate, medaglia da conquistare, moneta e segnaposto della mappa. | I disegni di allenatori e creature di esempio non sostituiscono i personaggi e gli Arkamon ufficiali della partita. |
| `11-logo-arkamon-menu.svg` | Logo Arkamon. I separatori con gemma o sottili sono disponibili nel catalogo. | Esclusi i pulsanti con lettere del controller e testo già incorporato dove servono etichette e azioni reali. |
| `12-schede-bagliori-gemme.svg` | Card normali/selezionate e gemma ciano per richiami di selezione. | Non si sovrappongono più cornici complete sullo stesso componente. Gli aloni non devono coprire testi o controlli vicini. |
| `13-alchimia-pannelli.svg` | Analizzata come variante coerente per il laboratorio e il negozio. | Non aggiunge ritagli in questa versione: ripete ruoli coperti da 01, 03, 17 e 18. Non si aggiungono azioni alchemiche fittizie per utilizzare la tavola. |
| `14-pannelli-modulari-stati.svg` | Analizzata come insieme alternativo di pannelli e stati. | Non aggiunge ritagli in questa versione: le duplicazioni di tab, righe, cornici e CTA sono coperte da elementi più specifici delle altre tavole. |
| `15-inventario-icone.svg` | Icone delle categorie Cure, Cattura e Strumenti per Borsa e Negozio. | Le categorie filtrano il catalogo effettivo e mantengono il comportamento esistente. |
| `16-pozioni-campana-cristallo.svg` | Pozione, Superpozione, Antidoto, Sveglia e cristallo del Rianimatore associati ai rispettivi oggetti reali. | Prezzi, nomi ed effetti restano nel modello. Per Antiparalisi e Masterball si usano le icone coerenti delle categorie Cure e Cattura, senza creare nuovi articoli. |
| `17-negozio-controlli.svg` | Controlli meno/più, campo quantità vuoto e pulsante acquisto normale/selezionato. | La quantità e il totale sono reali. Nessuna funzione di vendita viene introdotta soltanto perché esiste il relativo disegno. |
| `18-insegne-rune-ornamenti.svg` | Insegne di alchimia, inventario e squadra e angolo oro. Insegna cure, angolo runico e separatore rimangono disponibili nel catalogo. | Le rune sono decorazioni. Gli angoli mantengono dimensioni e proporzioni proprie anche su pannelli flessibili. |

## Pipeline riproducibile

1. Gli atlanti originali rimangono nella cartella Downloads, senza modifiche.
2. `ui-source/reference-svg-crops.json` descrive ogni elemento tramite ID, nome del foglio, rettangolo nelle coordinate originali e ruolo. Le misure delle anteprime non vengono usate come coordinate SVG.
3. `scripts/import-reference-svg-atlas.mjs` legge il catalogo ed estrae la sola geometria pertinente e le definizioni necessarie. Non conserva un atlante completo dentro ogni ritaglio.
4. I singoli vettori vengono salvati in `public/ui/reference-assets/{id}.svg`. Il manifest generato conserva provenienza, hash, misure e metadati tecnici.
5. L’opzione `--runtime` genera anche `public/ui/reference-assets/{id}.webp`: immagini trasparenti derivate dagli SVG a densità doppia, con limite di 1400 pixel per lato. Gli SVG rimangono i corrispondenti vettoriali consultabili.
6. `ProvidedArtwork` e le variabili `--provided-{id}` usano URL compatibili con il percorso base del sito. Il browser richiede i singoli WebP usati dalla schermata, senza interpretare nuovamente gli atlanti vettoriali molto densi.

Comando di rigenerazione dal repository:

```powershell
node scripts/import-reference-svg-atlas.mjs --source "C:/Users/andre/Downloads/Sprite/Assets-Arkamon-SVG/SVG" --source "C:/Users/andre/Downloads/Sprite/Arkamon-Medaglie-Simboli-SVG/SVG" --manifest ui-source/reference-svg-crops.json --output public/ui/reference-assets --runtime
```

Per verificare che i derivati coincidano con sorgenti e catalogo senza riscriverli, il comando supporta anche `--check`. La rigenerazione richiede gli originali presenti nel percorso indicato; l’avvio del gioco utilizza invece i derivati già inclusi nel repository.

L’opzione `--source` si può ripetere per i due pacchetti separati, senza copiarli in una cartella comune. Un nome di tavola presente in entrambe le cartelle è segnalato come ambiguo; non viene scelto silenziosamente un file.

## Vincoli visivi e funzionali

- Le immagini decorative usano `contain` o `object-fit: contain`. Le righe e le tessere adattano il proprio spazio al rapporto del ritaglio. I pannelli di dimensioni variabili utilizzano angoli fissi e superfici flessibili, senza allungare l’intera cornice.
- Testi, titoli, quantità, prezzi, HP, livelli, mosse, evoluzioni, medaglie e condizioni rimangono contenuto reale dell’interfaccia. Non sono appiattiti nell’immagine decorativa.
- I PNG ufficiali degli Arkamon rimangono nelle viste statiche. I nuovi disegni del pacchetto non sostituiscono specie o allenatori reali. Le animazioni native mantengono il proprio flusso separato.
- Il Deposito conserva **35 posti per box, disposti 7×5**. L’impaginazione del riferimento non riduce la capacità del gioco.
- Le forme sconosciute nell’Arkadex mantengono nome e dettagli mascherati; una cornice con lucchetto non provoca il caricamento del ritratto segreto.
- Le nuove decorazioni non cambiano la possibilità di riordinare la squadra, usare un oggetto o effettuare uno scambio. I vincoli di turno, battaglia e fascia di livello restano quelli del gioco.
- Il Negozio continua a richiedere l’interazione autorizzata della partita. Un collegamento di anteprima non rende il Negozio liberamente raggiungibile nella campagna.
- Gli sfondi rimangono separati dalla UI. Le schermate complete dei riferimenti non sono usate come immagini con pulsanti finti sovrapposti.

## Anteprima e percorso predefinito

La galleria locale è disponibile su [UI Aurora con gli asset forniti](http://127.0.0.1:3054/?uiReferences=1). Consente di confrontare le otto schermate della nuova direzione e di aprirle a pieno schermo.

**Aurora è la direzione predefinita del gioco locale**, anche senza un parametro di anteprima. Il precedente collegamento `?uiConcepts=1` porta alla nuova proposta; il confronto storico delle cinque direzioni rimane esplicito con `?uiConcepts=1&legacyConcepts=1`. Eclisse, Atlante, Impulso, Taccuino e Prisma non diventano automaticamente alternative della campagna.

Le anteprime usano dati dimostrativi isolati. Il Negozio dimostrativo prepara un’interazione valida in memoria e non altera le restrizioni della partita normale. La presenza della galleria non prova da sola l’integrazione in ogni percorso reale: questi percorsi richiedono la verifica dedicata seguente.

## Verifiche completate il 24 ottobre 2026

- **102 test mirati, 11 file, superati**: componenti PlayerUi, Borsa, ritratti, cataloghi, effetti degli oggetti, acquisti e isolamento di preferenze/ripristino nelle anteprime.
- **18 test dell’importer superati**: clipping, ordine dei tracciati, trasparenza, gradienti, determinismo, controllo dei derivati, cartelle sorgenti separate con rifiuto di nomi ambigui e rifiuto di contenuti attivi o riferimenti esterni.
- **6 scenari della galleria superati**: otto schermate più navigazione mappa → menù → squadra, in tre formati: 1440×900, 1366×768 e Pixel 7. Verificati overflow desktop, assenza di overflow orizzontale, caricamento/decodifica, proporzioni, livelli decorativi visibili, centratura della Borsa, controlli Axe e conservazione dei dati reali.
- **18 scenari della partita normale superati**, desktop e mobile: sei destinazioni, strumenti ausiliari, negozio autorizzato, scambi, fasce di livello, cure, consumo esatto di inventario e turno, acquisto del carrello, protezione di G2 e ripristino delle schermate con Escape.
- **Build di produzione superata** con `GITHUB_PAGES=true npm run build`: 455 animazioni native conservate, release media invariata, pacchetto locale 694,4 MiB entro il limite esistente. Restano gli avvisi già presenti su dimensioni di alcuni chunk e import dinamici/statici condivisi.
- **Sei schermate della build compilata verificate nel browser** sotto `/Arkamon-Beta/`: tutte le immagini fornite decodificate, nessun errore JavaScript o immagine mancante. Catture in `output/new-svg-inspection/live/`; le 24 catture dell’anteprima nei tre formati sono in `output/reference-ui/final/`.
- **Integrità verificata**: 18 hash delle sorgenti, 96 SVG, 96 WebP e hash del catalogo coincidono con il manifest. SHA-256 del catalogo finale: `aeea02e4ed70ddf12d842f3744a9fa2eddc836853b8a1faa1080c53c922fa207`.
- `git diff --check` superato.

La prima prova con gli SVG densi aveva mostrato tempi di decodifica elevati e reticoli fra rettangoli adiacenti. La generazione WebP da SVG con `shape-rendering="crispEdges"` ha eliminato il reticolo osservato nelle catture del browser. Alcuni bordi originali includono piccoli aloni semitrasparenti colorati, conservati nel derivato.

I controlli Axe e di geometria sono accompagnati dall’ispezione delle catture; non costituiscono una certificazione manuale completa del contrasto su ogni possibile sfondo. Gli sfondi attuali rimangono provvisori e separati dalla UI. L’anteprima mobile si sviluppa in verticale; l’assenza di scorrimento verticale è verificata sulle schermate desktop dei due formati indicati.

In questa fase **non sono stati richiesti né eseguiti un nuovo commit, un push o un deployment**. La pubblicazione va riportata separatamente dall’implementazione e dalle verifiche locali.

## Aggiornamento dei percorsi sorgenti

Gli allegati successivi del 24 ottobre collocano le 18 tavole principali sotto `Downloads/Sprite/Assets-Arkamon-SVG/SVG` e i due fogli aggiuntivi sotto `Downloads/Sprite/Arkamon-Medaglie-Simboli-SVG/SVG`. La vecchia cartella `Downloads/Nuova cartella/Assets-Arkamon-SVG/SVG` non è più presente.

Nei 18 fogli utilizzati la sola differenza rispetto ai file registrati prima dello spostamento è l’aggiunta di `shape-rendering="crispEdges"` sul nodo SVG principale: 29 byte per foglio. Rimuovendo esclusivamente quell’attributo, ogni hash coincide con il precedente. Non cambiano disegni, dimensioni o coordinate.

L’importazione dai due nuovi percorsi è riuscita e aggiorna i 18 hash sorgenti nel manifest. I **96 SVG e 96 WebP generati coincidono byte per byte con i derivati precedenti**, verificati tramite SHA-256 anche sui file scritti. La UI mantiene quindi l’aspetto e le verifiche del paragrafo precedente; questo aggiornamento riguarda provenienza e riproducibilità, senza modifiche a componenti o layout.
