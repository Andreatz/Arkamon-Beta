# Arkamon — Anteprime con gli SVG dell’archivio fornito

Revisione dell’11 ottobre 2026. Le sette anteprime usano i **47 SVG di Arkamon-Assets-SVG.rar**, copiati senza modifiche. I colori di sfondi e testi si accordano ai blu e al ciano delle grafiche fornite. Gli eventuali accenti viola negli SVG restano quelli dell’archivio.

## Aprire le anteprime

- [Sette schermate interattive](index.html#overview)
- [Catalogo e confronto con la versione precedente](assets.html)
- [Confronto con i precedenti SVG viola](assets.html), conservata separatamente

Per aprire l’anteprima dalla radice del repository:

```powershell
python -m http.server 3010 --bind 127.0.0.1
```

Aprire `http://127.0.0.1:3010/docs/ui-previews/archive-kit/`. Dopo aver estratto lo ZIP, avviare lo stesso server nella cartella estratta e aprire `http://127.0.0.1:3010/`.

Le verifiche sono ripetibili con `node docs/ui-previews/archive-kit/verify.cjs` e `node docs/ui-previews/archive-kit/delivery-check.cjs` dopo `npm install`. Per un server con un indirizzo diverso, impostare `UI_PREVIEW_URL` all’indirizzo della cartella dell’anteprima.

## Consegna

- `Arkamon-UI-Anteprime-Archivio.zip`: codice dell’anteprima, SVG forniti, catalogo, SVG precedenti per il confronto, immagini desktop e telefono, guida e rapporti.
- `Arkamon-Assets-Archivio-SVG.zip`: i 47 SVG forniti e il catalogo aggiornato, senza materiali di lavoro o bitmap.
- `assets/vector/`: copie identiche dei file estratti dall’archivio, ciascuna verificata tramite SHA-256. I 47 SVG pesano complessivamente 114.073 byte.
- `assets/previous-vector/`: copie della proposta precedente, mostrate soltanto nel confronto del catalogo.

Il catalogo contenuto nel RAR riportava ancora alcuni valori della versione precedente. Il catalogo dell’anteprima aggiorna dimensioni, canvas, nomi, peso e impronte leggendo i file effettivi. Il RAR originale e la sua copia estratta rimangono inalterati. La Pozione conserva il nuovo canvas `viewBox="6 10 177 251.472"` e le nuove dimensioni `177 × 251.472`.

## Le sette viste

| Schermata | Desktop 1920 × 1080 | Telefono 390 px |
| --- | --- | --- |
| Gestione Squadra | [1-squadra.png](screens/1-squadra.png) | [1-squadra.png](mobile/1-squadra.png) |
| Deposito Arkamon | [2-deposito.png](screens/2-deposito.png) | [2-deposito.png](mobile/2-deposito.png) |
| Arkadex | [3-arkadex.png](screens/3-arkadex.png) | [3-arkadex.png](mobile/3-arkadex.png) |
| Analisi Arkamon | [4-analisi.png](screens/4-analisi.png) | [4-analisi.png](mobile/4-analisi.png) |
| Menù Partita | [5-menu.png](screens/5-menu.png) | [5-menu.png](mobile/5-menu.png) |
| Borsa Oggetti | [6-borsa.png](screens/6-borsa.png) | [6-borsa.png](mobile/6-borsa.png) |
| Arkastore | [7-negozio.png](screens/7-negozio.png) | [7-negozio.png](mobile/7-negozio.png) |

Le catture per telefono mostrano la pagina completa e hanno altezza variabile. Il catalogo offre ricerca, filtri, zoom, sfondi chiaro/scuro/scacchiera e confronto fra i tuoi SVG e la versione precedente; ogni risorsa è scaricabile singolarmente.

## Ambito e interazioni

Questa revisione aggiorna le anteprime autonome. Selezioni, box, ricerca dell’Arkadex, filtri degli oggetti, scelta del bersaglio e acquisti simulati consentono di valutare l’interfaccia. Borse e saldi dei due giocatori restano separati nel prototipo. Lo stato è dimostrativo e non legge né modifica una campagna reale.

Logo, fondali e creature conservano i materiali originali del gioco. Il motore di battaglia e le sue regole restano separati da questa consegna grafica.

## Verifiche

- `quality/archive-import.json`: archivio di origine, 47 impronte corrispondenti e dimensioni aggiornate.
- `quality/native-svg-audit.json`: SVG validi, senza immagini incorporate, script o riferimenti esterni.
- `quality/archive-browser-check.json`: uso delle risorse fornite e controlli del catalogo.
- `verification.json`: 8 interazioni e 21 combinazioni di schermata e dimensioni.
- `desktop-verification.json`: sette catture desktop senza risorse mancanti o contenuti fuori dal quadro.
- `delivery-check.json`: sette viste, risorse del catalogo e navigazione mobile.
- `manifest.json` e `package-verification.json`: provenienza e integrità degli archivi consegnati.
