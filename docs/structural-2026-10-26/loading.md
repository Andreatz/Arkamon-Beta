# Caricamento e separazione dei cataloghi

La prima schermata ora carica il catalogo di gioco compatto; i metadati editoriali dei VFX e il runtime di personalizzazione dello Studio restano fuori dall'avvio ordinario. I valori di gioco e gli asset disponibili non cambiano.

## Causa verificata

La build di partenza aveva un file principale da 864.479 byte. Nel suo grafo statico erano presenti il JSON delle 220 mosse, con 42.240 valori delle tabelle di livello e chiavi ripetute, e l'intero catalogo di assegnazione VFX da 276 record. `statusMoves.ts` leggeva quest'ultimo per ricavarne soltanto nove mosse di paralisi.

Inoltre `App` montava sempre `UiDesignRuntime`. Sebbene il componente rilevasse poi che un documento non personalizzato non richiedeva interventi, l'importazione aveva già caricato registro DOM, gestione dei media e catalogo dello Studio. La normale apertura del titolo richiedeva così altri tre file JavaScript. La funzione di ricerca dei font era nello stesso modulo delle 970 immagini.

Due immagini del dado di transizione, complessivamente 1.321.262 byte, venivano richieste anche nelle anteprime e con movimenti ridotti, percorsi che non le mostravano.

## Interventi

- `scripts/build-runtime-game-data.mjs` produce un catalogo da 48.078 byte: 220 definizioni, 83 tabelle numeriche uniche e le sole nove assegnazioni di stato autorizzate. I JSON autoriali restano intatti. Il caricamento ricostruisce una tabella indipendente per ciascuna proprietà di ciascuna mossa, conservando anche l'indipendenza degli oggetti originali.
- `AppliedUiDesign` osserva la presenza di una personalizzazione effettiva e importa il runtime solo quando serve. Applicare un layout durante la sessione e ricaricarlo continua a funzionare. Le anteprime dello Studio conservano il runtime completo per selezione, modifiche e registrazione degli elementi.
- `fontFamily.ts` contiene la ricerca dei font; il catalogo espone ancora il precedente nome tramite riesportazione, mentre il runtime importa direttamente il modulo leggero. Anche il generatore del catalogo è stato aggiornato.
- Il titolo prepara i dadi su intenzione di navigazione: puntamento, focus o pressione del comando. Le scene successive li preparano se le animazioni sono abilitate. Anteprime e movimenti ridotti evitano la richiesta.
- `check-startup-budget.mjs` segue le importazioni statiche del manifest di build, deduplicando le dipendenze. Fallisce se il file principale supera 500.000 byte, il JavaScript necessario all'avvio supera 800.000 byte o i CSS iniziali superano 100.000 byte. I moduli differiti sono esclusi soltanto se esistono realmente come dipendenze dinamiche; dividere un file in più frammenti statici non aggira il controllo.

## Misura locale prima/dopo

Build compilate, medesimo server HTTP locale con gzip, Chromium isolato, finestra 1366 × 768, movimenti ridotti. Le risorse sono state raccolte per due secondi dopo la comparsa del comando Nuova Partita. Tre contesti nuovi per ciascuna versione, in ordine alternato.

| Misura | Prima | Dopo la modifica del caricamento |
| --- | ---: | ---: |
| File JavaScript principale | 864.479 byte | 462.263 byte |
| Chiusura statica JavaScript | 1.124.422 byte | 722.206 byte |
| JavaScript richiesto dal titolo, dopo decompressione | 1.322.256 byte | 722.206 byte |
| Trasferimento JavaScript osservato, gzip e intestazioni | 260.090 byte | 208.753 byte |
| Richieste JavaScript | 7 | 4 |
| Immagini richieste con movimenti ridotti | 1.357.528 byte | 36.266 byte |
| Richieste immagini | 3 | 1 |
| Errori JavaScript osservati | 0 | 0 |

La riduzione del JavaScript dopo decompressione è del 45,4%; il trasferimento JavaScript osservato da Resource Timing, incluse le intestazioni, diminuisce del 19,7%. I due numeri misurano grandezze diverse. Le immagini richieste nel caso con movimenti ridotti diminuiscono del 97,3%. La prima apertura di Partita nella versione compilata è stata verificata ed è visibile nello screenshot locale `output/structural-2026-10-26/loading-after-menu.png`.

I tempi locali di comparsa del titolo variano da 155 a 1.743 ms prima e da 159 a 213 ms dopo. Questi campioni non dimostrano un miglioramento statistico del tempo di avvio e non sono Core Web Vitals sul campo. Il vantaggio verificato riguarda byte, richieste e separazione delle responsabilità; dispositivo, rete e CDN richiedono misure specifiche. La build diagnostica precede l'integrazione finale dei CSS e del refactoring del dominio: il budget viene ricontrollato sulla build finale.

I numeri e i tre campioni per versione sono registrati in `loading-measurements.json`. Gli artefatti completi della prova restano nella directory locale ignorata `output/structural-2026-10-26`.

## Prove e manutenzione

- Sette test confrontano le definizioni ricostruite con i JSON autoriali, tutte le tabelle e tutti i proprietari delle mosse di stato.
- Tre test del controllo del budget verificano dipendenze statiche, esclusione dei moduli differiti, sforamento e file mancanti.
- Le due prove browser mirate dello Studio verificano la libreria paginata e l'applicazione di una cornice PNG nel gioco, anche dopo la ricarica.
- Tre prove browser di avvio riuscite coprono titolo e menù senza cataloghi dello Studio su desktop e mobile, oltre alla preparazione dei dadi su intenzione desktop. La prova hover mobile è esclusa esplicitamente.
- Il giro esteso dei test dati e transizioni ha registrato 291 successi su 292; l'unico fallimento riguardava il precedente assunto che tutti i PNG in `public/maps` fossero già mappe interattive. È stato segnalato separatamente per l'integrazione, senza modificare le mappe nel lavoro sul caricamento.

Dopo modifiche a `mosse.json` o alle assegnazioni di stato, eseguire `npm run data:runtime`. Le build verificano che il generato sia aggiornato; i test confrontano anche l'equivalenza dei valori. Eseguire `npm run test:startup -- dist` dopo la build web, oppure passare `dist-desktop` per quella desktop.
