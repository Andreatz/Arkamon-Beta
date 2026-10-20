# Esempi UI con asset per ruolo

La pagina `/?uiStudioPreview=1&assetExamples=1` mostra quattro esempi di impaginazione che usano gli SVG originali: Borsa, Squadra, Laboratorio e Comandi/opzioni. Si apre nello stesso server locale del gioco. I dati sono dimostrativi e tutte le interazioni rimangono nello stato locale di React; la pagina usa la modalità di anteprima che disabilita la persistenza della campagna.

Il selettore **Tre famiglie / Asset dedicati** confronta le cornici del renderer attuale con gli SVG specifici sullo stesso layout di esempio. Non è un confronto tra due versioni complete delle schermate di gioco.

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

I pannelli alti della Player UI non sono stati rimpiazzati con le composizioni orizzontali del catalogo: richiedono ancora i file con le dimensioni finali indicate nella specifica grafica. La gallery rende visibile la direzione di impaginazione prima di quella sostituzione.

## Verifica locale

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
