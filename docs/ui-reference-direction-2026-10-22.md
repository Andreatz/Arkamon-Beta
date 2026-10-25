# UI basata sui riferimenti dell'utente

Questa direzione sostituisce le cinque proposte precedenti come interfaccia locale predefinita. I riferimenti visivi sono i sei file forniti dall'utente: Arkadex, Deposito, Mappa locale, Menù principale, Negozio e Squadra.

## Linguaggio visivo

Pannelli blu notte con finitura smaltata, bordi dorati sottili e doppi, piccoli ornamenti agli angoli, titoli serif color avorio e selezioni luminose ciano. Cornici e spazi dipendono dal layout del componente; gli ornamenti angolari hanno dimensione fissa e non vengono deformati per riempire il pannello. Dal 24 ottobre gli elementi illustrati utilizzano gli SVG forniti dall’utente e le loro copie leggere, separati dalle vecchie famiglie sospese. Il catalogo e la pipeline sono descritti in `ui-provided-assets-2026-10-24.md`.

Le immagini di riferimento definiscono l'aspetto. Testi, prezzi, categorie, mosse, HP, evoluzioni e restrizioni continuano a provenire dai dati effettivi di Arkamon. Non sono stati aggiunti PP, attacco/difesa o talenti non previsti dal gioco.

## Schermate

- Menù principale: nove destinazioni illustrate, scheda del giocatore selezionato, secondo giocatore e comandi Gara/Ripresa/Sfide. Mappa chiude gli strumenti e restituisce la scena già aperta. Negozio resta accessibile tramite una vera interazione autorizzata.
- Squadra: sei schede verticali a sinistra, compagno al centro, dossier a destra con Riepilogo/Mosse/Statistiche. Selezione, riordino, fasce di livello e consultazione dell'altro giocatore mantengono le regole precedenti.
- Deposito: griglia a sinistra e dettaglio a destra, squadra sotto entrambe le colonne. Sono conservati i 35 posti reali per box, disposti 7×5.
- Arkadex: indice a sinistra, nome e ritratto al centro, scheda pergamena a destra. Filtri, paginazione, mosse, evoluzioni e animazioni restano funzionanti.
- Negozio: catalogo con prezzi a sinistra, oggetto e quantità a destra, carrello e acquisto reali. Le categorie filtrano il catalogo esistente senza azzerare il carrello.
- Borsa: celle centrate, dettaglio e utilizzo con confronto HP prima/dopo.
- Analisi: ritratto ampio e dossier coordinato.
- Mappa locale: intestazione del luogo, giocatori, azioni rimaste, squadra compatta e contesto del punto. La geometria della mappa e le coordinate dei percorsi restano inalterate.

## Anteprima

`http://127.0.0.1:3054/?uiReferences=1`

Anche il precedente collegamento `?uiConcepts=1` apre ora questa proposta. Il vecchio confronto rimane raggiungibile esplicitamente con `?uiConcepts=1&legacyConcepts=1`.

La galleria include otto schermate e il collegamento a pieno schermo. L'anteprima usa campagna, preferenze e catalogo interazioni volatili. Per provare il negozio viene creata un'interazione dimostrativa valida in memoria; il normale accesso della partita non è aggirato. Backup, copie automatiche e avvio/uscita delle sfide non scrivono sul salvataggio reale.

## Sfondi da fornire

Gli sfondi ora visibili sono quelli già presenti nel progetto, usati provvisoriamente. Le immagini complete allegate non sono state appiattite nell'interfaccia e non sono usate come fondali contenenti pulsanti finti.

I percorsi provvisori sono centralizzati in `src/player-ui/reference/referenceBackgrounds.ts`, separati dai componenti UI. I nuovi sfondi possono essere immagini pulite, senza titoli, pannelli, testi o pulsanti incorporati. Formato di lavoro desktop consigliato: 1920×1080 o una risoluzione superiore con rapporto 16:9. La UI si adatta alla finestra e si ricompone sui telefoni.

Per le mappe interattive, lo sfondo è parte del piano di coordinate della mappa; se cambia la disposizione dei percorsi, anche i punti dovranno essere posizionati sul nuovo disegno tramite il sistema mappe esistente.

## Implementazione

Il default è `aurora`; le vecchie direzioni richiedono il parametro esplicito `uiConcept`. I fogli sotto `src/player-ui/reference/` sono circoscritti al root della nuova UI. La policy `MENU_SVG_ARTWORK_ENABLED` resta reversibile e nessun vecchio asset è stato cancellato.

I PNG ufficiali degli Arkamon restano nelle viste statiche. Le animazioni native rimangono disponibili nell'Arkadex tramite il comando esplicito.

## Verifica

`e2e/reference-ui.config.ts` verifica le otto schermate su desktop, desktop compatto e telefono, incluse geometria, selezione dei compagni e del giocatore, schede del dossier, filtri del negozio e conservazione dello storage reale. Un secondo scenario verifica il movimento effettivo nella mappa dimostrativa e il passaggio mappa → menù → squadra.

`e2e/player-ui-integration.spec.ts` percorre la partita normale: navigazione, accessibilità, deposito, scambi, vincoli di livello, HP, cure, consumo degli oggetti e del turno, acquisti e gating del negozio.

I controlli Axe automatici sono accompagnati da ispezione degli screenshot; gradienti, sfondi illustrati e pseudoelementi possono richiedere valutazione visiva e non costituiscono una certificazione automatica di tutti i contrasti.

La proposta resta locale; non è stato eseguito un push o un nuovo deployment.

Risultati del controllo locale: 90 test mirati superati, tutti i 18 scenari di integrazione della partita coperti con esito positivo fra esecuzione completa e ricontrolli mirati, otto schermate e navigazione dell'anteprima verificate nei tre formati. I tentativi scaduti durante il carico parallelo sono stati ripetuti isolatamente senza indebolire le asserzioni. La build di produzione è stata compilata con i media esistenti, senza modificare la release delle animazioni.
