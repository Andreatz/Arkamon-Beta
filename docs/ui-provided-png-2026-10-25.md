# Asset PNG forniti per la UI Aurora

Data: **25 ottobre 2026**.

Su richiesta dell’utente, il pacchetto `Arkamon.zip` sostituisce gli elementi decorativi provenienti dagli atlanti SVG nell’interfaccia Aurora. Il riferimento del 24 ottobre rimane una registrazione storica; per l’implementazione attuale vale questo documento.

## Provenienza e contenuto

Archivio originale: `C:/Users/andre/Downloads/Arkamon.zip`, **316.674.119 byte**. SHA-256 registrato nella configurazione e nel manifesto generato:

```text
19dd43467f9fd14aed49d9cc36621637a7e2f3336c76a0c2a40f1ed1449fc92e
```

Il pacchetto contiene **181 PNG**:

| Cartella | File | Impiego |
| --- | ---: | --- |
| `Arkamon-UI` | 50 | Pannelli, angoli, bordi, pulsanti, schede, controlli, tipi e medaglie. |
| `Arkamon-Icone` | 131 | Ritratti compatti, di cui 110 corrispondono alle specie presenti nel catalogo del gioco e 21 sono extra. |

Le immagini extra rimangono disponibili senza aggiungere specie, evoluzioni, incontri o statistiche al gioco. Gli ID dei file vengono conservati: non si rinumerano i ritratti in base alla posizione nella cartella.

La configurazione versionata è `ui-source/provided-png-package.json`. Gli originali estratti restano in `output/arkamon-png-package/source`; il pacchetto ZIP e i PNG originali non vengono modificati dall’importazione. I testi eventualmente contenuti negli allegati sono riferimenti e non istruzioni eseguibili.

## Immagini per il gioco e proporzioni

I **181 WebP** in `public/ui/reference-png` pesano complessivamente **21.598.802 byte, 20,60 MiB**. Sono derivati dai PNG del nuovo pacchetto; non dai precedenti SVG.

L’importazione conserva il disegno e le trasparenze. Non ricostruisce bordi, non ridisegna soggetti, non cambia deliberatamente colori e non allunga le immagini. La conversione WebP usa qualità 94, qualità dell’alfa 100 ed effort 4: la compressione dei colori è quindi con perdita, e non viene descritta come identità pixel per pixel con il PNG originale.

- Gli elementi UI mantengono i limiti di **1200×900 pixel**, senza ingrandire un originale più piccolo. Il ridimensionamento usa il rapporto originale.
- Per gli elementi UI il ritaglio elimina soltanto i margini con alfa esattamente zero. Anche un pixel con alfa 1 contribuisce ai limiti del disegno: bagliori e ombre semitrasparenti restano inclusi.
- I ritratti compatti hanno limite **640×640 pixel** e `trim: false`, così mantengono il proprio canvas e l’inquadratura fornita.
- Nessun elemento della configurazione corrente richiede rotazione. Lo strumento supporta soltanto rotazioni esplicite di 0°, 90°, 180° o 270°.
- In pagina le immagini usano `object-fit: contain`. I riquadri del menù ricevono il rapporto della cornice effettiva; i pannelli flessibili usano gli elementi modulari nelle rispettive proporzioni.

Il catalogo completo `public/ui/reference-png/manifest.generated.json` conserva hash del pacchetto, file sorgente, hash del PNG, peso, dimensioni originali, limiti del ritaglio, rotazione, dimensioni finali e hash del WebP.

Il browser importa soltanto `ui-source/provided-png-runtime.generated.json`: **13.377 byte**, con `id`, `file`, `width` e `height` per ciascun elemento. È circa l’89,5% più piccolo del manifesto completo da 127.583 byte. Una copia identica è conservata in `public/ui/reference-png/catalog.runtime.json`. Il componente non importa JSON direttamente dalla cartella `public`, evitando l’avviso di Vite; le immagini continuano a essere richieste tramite URL compatibili con il percorso base del sito.

## Collegamento ai componenti

`src/player-ui/reference/pngArtworkAliases.ts` collega i nomi semantici dei componenti ai file realmente presenti nel pacchetto. Un alias non è un rinvio ai vecchi SVG: `ProvidedArtwork` risolve tutti i nomi nel catalogo PNG e richiede il WebP corrispondente.

| Ruolo nell’interfaccia | Elemento del nuovo pacchetto |
| --- | --- |
| Pulsanti ordinari, selezionati e disabilitati | `button-normal`, `button-selected`, `button-disabled`. |
| Tessere delle nove destinazioni del menù | `panel-modular`; il focus aggiunge un bagliore CSS alla stessa cornice. |
| Schede di navigazione | `tab-frame`; testo e stato selezionato restano contenuti dell’interfaccia. |
| Righe Squadra e Arkadex | `team-row`; nomi, livelli, HP e selezione sono dati reali. |
| Alloggiamenti del Deposito e degli oggetti | `item-slot`. |
| Cornice del ritratto principale | `portrait-frame`. |
| Titoli e ornamenti | `title-plaque` e `corner`; `edge`, `panel-fill` e `divider` sono importati e disponibili, senza essere applicati alle schermate attuali. |
| Quantità, ricerca, filtro e navigazione | `quantity-minus`, `quantity-plus`, `search-icon`, `filter-icon`, `back-control`. |
| Tipi | Gli otto `type-*`, collegati ai tipi effettivi del gioco. |
| Medaglie | Gli otto `medal-*` disponibili; ciascuna palestra usa il tipo predominante della propria squadra reale. Gli spazi non conquistati sono attenuati e l’ottenimento dipende dall’ID del capopalestra sconfitto. |

Le categorie non introducono comandi o dati assenti dalla partita. Prezzi, disponibilità, quantità, turni, statistiche e restrizioni del Negozio restano gestiti dal modello e dalle azioni esistenti.

I nuovi ritratti vengono usati nelle viste compatte. Le immagini grandi delle creature conservano i PNG ufficiali in `public/sprites/front_sprites`; le animazioni native mantengono il proprio catalogo e il proprio caricamento indipendenti. La miniatura della destinazione Squadra può mostrare compagni reali del giocatore, senza sostituirli con creature di esempio.

## Elementi assenti dal pacchetto

Il nuovo archivio non contiene un nuovo logo Arkamon, le nove illustrazioni del precedente atlante del menù o illustrazioni specifiche di pozioni e altri articoli.

- Il logo usa il PNG già presente, `public/ui/logo_arkamon.png`.
- I comandi senza una propria illustrazione nel pacchetto usano simboli HTML e testi accessibili; non ricaricano le immagini del vecchio atlante `09-illustrazioni-menu.svg`.
- Gli oggetti senza illustrazione nel nuovo pacchetto mantengono simboli e abbreviazioni dell’interfaccia. Nome, descrizione, prezzo e quantità rimangono reali. Non si presentano ritratti di creature come immagini di pozioni.
- La UI Aurora non richiede le decorazioni SVG precedenti né i relativi WebP derivati. Un eventuale elemento SVG che ospita il PNG ufficiale di una creatura grande appartiene al sistema di inquadratura dei ritratti, non agli atlanti decorativi sostituiti.

I fondali rimangono separati e provvisori, in attesa delle immagini che fornirà l’utente.

## Rigenerazione e controllo

Eseguire i comandi dalla radice del repository. Prima di estrarre nuovamente lo ZIP, verificarne l’hash con `Get-FileHash -Algorithm SHA256`. Estrarre in una cartella nuova e dedicata all’interno di `output`, controllando prima i nomi di tutte le voci: devono restare sotto la destinazione risolta e non contenere percorsi assoluti, attraversamenti `..`, collegamenti simbolici o destinazioni duplicate. Questa documentazione non esegue l’estrazione e non richiede di sostituire i PNG già verificati.

Importazione completa dai PNG già estratti:

```powershell
node scripts/import-provided-png-package.mjs --source output/arkamon-png-package/source --manifest ui-source/provided-png-package.json --output public/ui/reference-png --runtime-output ui-source/provided-png-runtime.generated.json
```

Verifica completa, senza scrivere i derivati:

```powershell
node scripts/import-provided-png-package.mjs --source output/arkamon-png-package/source --manifest ui-source/provided-png-package.json --output public/ui/reference-png --runtime-output ui-source/provided-png-runtime.generated.json --check
```

Rigenerazione dei soli cataloghi minimi dal manifesto completo esistente, senza rileggere i PNG, senza ricodificare le immagini e senza riscrivere il manifesto completo:

```powershell
node scripts/import-provided-png-package.mjs --runtime-only --output public/ui/reference-png --runtime-output ui-source/provided-png-runtime.generated.json
```

Verifica dei soli cataloghi minimi:

```powershell
node scripts/import-provided-png-package.mjs --runtime-only --output public/ui/reference-png --runtime-output ui-source/provided-png-runtime.generated.json --check
```

`--runtime-output` è opzionale per l’uso generico dello strumento, ma serve al repository per aggiornare anche il JSON importato dall’applicazione. Senza questa opzione viene scritto soltanto il catalogo accanto alle immagini. `--check` segnala file mancanti o diversi e non li ripara.

Lo strumento rifiuta percorsi sorgenti assoluti o che risalgono le directory, collegamenti che escono dalla cartella estratta, sorgenti diverse da un singolo PNG e destinazioni di importazione dentro i sorgenti immutabili.

## Verifiche della pipeline

Eseguito il 25 ottobre 2026:

```powershell
node --test tests/provided-png-package.test.mjs
```

**15 test superati.** I primi 13 coprono ritaglio dell’alfa, trasparenze deboli, proporzioni, assenza di ingrandimento, rotazioni esplicite, originali immutati, provenienza, determinismo, catalogo minimo, rigenerazione senza PNG e rifiuto dei percorsi non validi. I due controlli aggiuntivi verificano la copia opzionale del catalogo sotto `ui-source` e il rifiuto di tale destinazione dentro il pacchetto originale.

La generazione dei due cataloghi minimi dai metadati esistenti e il relativo `--runtime-only --check` sono riusciti per tutti i 181 asset. Nessuna immagine è stata riprocessata per creare questa copia destinata agli import JavaScript.

## Verifiche dell’interfaccia completate

Eseguite il 25 ottobre 2026 sulla nuova integrazione PNG:

- **59 test Vitest superati** in nove file: componenti PlayerUi, navigazione, mascheramento dell’Arkadex, ritratti, Borsa e isolamento dei dati di anteprima.
- **6 scenari della galleria superati**, con otto schermate e flussi reali di navigazione a 1440×900, 1366×768 e su Pixel 7. Verificati caricamento dei PNG, proporzioni, icone dipinte nei campi ricerca/filtro, accessibilità, centratura degli oggetti, assenza di vecchie richieste decorative e integrità dei salvataggi.
- **18 scenari della partita reale superati** su desktop e mobile: Borsa, acquisti, limiti del Negozio, Deposito, spostamento delle istanze possedute, Escape e persistenza delle azioni.
- **2 scenari degli strumenti secondari superati** a 1366×768 e 1920×900: Registro, Diario, Salvataggio, Impostazioni, Gara, Ripresa e Sfide, comprese le pagine interne. Nessuna asserzione geometrica è stata indebolita.
- Il controllo completo `import-provided-png-package.mjs ... --check` ha verificato i **181 derivati e i relativi metadati**, riproducendo l’importazione senza scrivere file.
- **Build di produzione completata** con `GITHUB_PAGES=true npm run build`, TypeScript incluso. Il pacchetto locale pesa 715,2 MiB; la verifica media conferma 455 clip native e la revisione già fissata `11eb8edfcaad86d2d6d59fcdfbc77682d1dc8367`.

L’ultima verifica browser è stata eseguita sulla build compilata a `http://127.0.0.1:3055/Arkamon-Beta/`, con otto catture e rapporto in `output/provided-png/final`. Tutte le immagini risultano decodificate; nessun errore JavaScript o immagine mancante, nessuna richiesta alle precedenti famiglie decorative. Le otto schermate rispettano la geometria desktop e il contenuto non richiede scorrimento.

Le correzioni finali comprendono lo spazio riservato al ritratto nelle righe, gli oggetti centrati dentro le cornici, pulsanti G1/G2 di pari misura con altezza minima di 44 pixel, icone filtro visibili e medaglie coerenti con le palestre realmente sconfitte.

I risultati della precedente integrazione SVG del 24 ottobre non vengono riutilizzati come prova di questa nuova versione. Sono verifiche locali: non dichiarano commit, push o deployment.
