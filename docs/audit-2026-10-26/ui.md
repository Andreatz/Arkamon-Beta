# Interfaccia, asset e regia — 26 ottobre 2026

## Correzioni concrete

- **Trascinamento Studio:** un movimento di un secondo puntatore spostava la selezione avviata dal primo; nel browser la X passava da 672 a 808. `studioPointerDrag.ts` verifica il `pointerId` iniziale su move/up/cancel e interrompe su blur e smontaggio. La cronologia conserva il gesto dell'utente senza accettare il secondo tocco.
- **Percorsi Admin:** `/\\example.invalid/a.png` era accettato come file locale ma veniva risolto da Chromium fuori origine. `adminThemeAssetPaths.ts` riusa il validatore robusto degli asset Studio in parser, editor, `normalizeTheme` e `updateAsset`. I vecchi slot conservano il contratto dei file pubblici; i media importati continuano a utilizzare il proprio resolver. La prova controlla la risoluzione e il rifiuto senza effettuare richieste a terzi.
- **Arkadex desktop:** le righe conservavano un'altezza implicita incompatibile con la lista disponibile. `reference-png.css` assegna sei righe flessibili e limita il ritratto all'altezza del posto. Sono state conservate proporzioni, numero delle voci, filtri, paginazione e nomi.
- **Carrello massimo:** `reference-inventory.css` imponeva `max-height:96px`, ridotto a 56 px nel desktop compatto; sette articoli e i comandi di rimozione restavano nascosti. Ora il riepilogo usa due colonne e cresce fino all'altezza necessaria; a 768 px la spaziatura delle righe evita di sottrarre spazio all'avviso di capacità nel dettaglio. Non è stata abilitata la navigazione libera al negozio: la disponibilità continua a dipendere dal pallino configurato e dai normali controlli di acquisto.
- **Presentazione live:** `reference-shared.css` nascondeva `.pu-present-control` insieme ai suggerimenti del footer. Ora «Presenta scheda selezionata» e «Nascondi dalla live» restano disponibili come controlli compatti con nome accessibile e tooltip; la navigazione lascia loro lo spazio necessario. Viene presentata soltanto la scheda scelta, senza intero deposito, inventario, identificativi privati o segreti.
- **Accessibilità Impostazioni:** il titolo interno passa da H3 a H2 per seguire l'H1 della schermata. Il controllo Axe verifica il dialogo completo.
- **Galleria Taccuino:** quattro pulsanti su una colonna eccedevano il pannello e toccavano il roster. Nel layout desktop compatto i comandi sono su due colonne; rimangono utilizzabili tutti e quattro.

## Contratti dei test aggiornati

La nuova UI ha nove tessere e usa «Salvataggio», cornici PNG e splash. Alcuni test storici cercavano ancora sei tessere, «Backup», «Gestione squadra», immagini SVG nei toggle o ritratti indipendenti sopra la splash. Sono stati adeguati alle schermate correnti, mantenendo le prove di caricamento degli asset, conservazione dei dati, focus, azioni e geometria.

Il controllo di equivalenza G1/G2 confronta ora entrambi i pulsanti nel medesimo stato di riposo, spostando il mouse fuori dal pulsante appena premuto. Un hover su uno solo dei pulsanti non è una differenza di famiglia grafica.

I test degli splash misurano il supporto realmente dipinto: backdrop completo sul desktop, carta 16:9 contenuta sul telefono. La galleria mobile conserva la disposizione fluida; le verifiche del canvas desktop impostano esplicitamente un viewport desktop. Non vengono richieste al telefono geometrie del backdrop che su mobile è correttamente nascosto.

La nuova regressione del roster segue anche un eventuale secondo turno avversario dovuto alla paralisi e usa una riserva capace di sopravvivere ai normali tiri del percorso. I dadi e gli incontri restano casuali; la cattura fuori fascia va correttamente nel deposito. Le prove originali prima/dopo con le due creature di livello 10 rimangono conservate nel rapporto gameplay.

## Evidenze

- Verifica mirata desktop finale: `output/audit-2026-10-26/ui-stable.json`, **31/31 scenari superati**.
- Verifica mirata mobile di carta, fallback e galleria: `splash-mobile-final.json`, **21/21**.
- Verifica desktop/telefono del canvas nel profilo mobile: `fullscreen-mobile-recheck.json`, **4/4**.
- Build compilata: `compiled/results.json`, **12 viste reali** (sei destinazioni a 1366×768 e 1920×1080), nuova partita, due starter, ricarica, nessun errore JavaScript o mutazione durante la consultazione.
- Gli screenshot compilati `compiled/1366-arkadex.png` e `compiled/1366-squadra.png` mostrano lo stato corretto. La geometria è verificata sul dialogo effettivo, non soltanto sul contenitore principale.
- La prova compilata finale dello Studio (`compiled/studio-results-final.json`) verifica anche la libreria paginata, la ricerca sull'intero catalogo e la permanenza della cornice PNG dopo applicazione, uscita e ricarica, senza errori JavaScript.

Le immagini approvate non sono state rigenerate o ritoccate. Le prove browser usano contesti locali isolati. I risultati del giro generale e delle riprove sono riportati separatamente in `verification.json`.
