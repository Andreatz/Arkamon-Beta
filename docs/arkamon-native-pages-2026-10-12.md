# Atlanti Arkamon a pagine: conversione e verifica del 12 ottobre 2026

La libreria nativa completa viene ora disegnata da pagine lossless, senza ridimensionare o tagliare le celle originali. I 160 clip delle 32 specie native mantengono tutti i 15.354 frame, i 24 fps di origine, i viewport e i marker di reazione/rilascio. I PNG front/back, i font e gli atlanti originali restano intatti. I metadati originali continuano a definire il contratto dell'animazione; il manifest generato aggiunge soltanto la mappatura dei frame alle pagine.

| Misura | Risultato |
| --- | ---: |
| Clip convertiti | 160 / 160 |
| Frame originali conservati | 15.354 |
| Pagine generate | 2.120 |
| Atlante originale più grande, RGBA | 225 MiB |
| Pagina più grande, RGBA | 16 MiB |
| Limite condiviso Standard | 64 MiB |
| Limite condiviso Memoria ridotta | 32 MiB |
| Decodifiche contemporanee | massimo 2 |
| Peso encoded degli atlanti originali | 1.366.536.688 byte |
| Peso encoded delle pagine runtime | 1.356.761.906 byte |

La paginazione riduce la memoria delle singole decodifiche. Non elimina il peso della libreria da distribuire: il totale encoded scende soltanto dello 0,715%. Il limite di 32/64 MiB comprende le pagine della cache, comprese le riserve delle decodifiche in corso; non comprende canvas, GPU, cache delle risposte compresse o altra memoria interna del browser. Un cambio da Standard a Memoria ridotta libera subito le pagine inutilizzate; le pagine già in uso vengono rilasciate al passaggio successivo.

Il convertitore copia le righe RGBA delle celle, crea pagine WebP lossless e confronta la decodifica di ogni pagina con i pixel originali. Conserva esattamente ogni valore alpha e i canali RGB di ogni pixel con alpha maggiore di zero; i canali RGB invisibili sotto alpha zero possono differire. Se un encoder WebP modifica un pixel visibile o l'alpha, la pagina viene prodotta come PNG. Il rapporto `arkamon-pages-verification.json` conferma l'uguaglianza per l'intera conversione. Il manifest conserva hash SHA-256 della sorgente, delle pagine encoded e delle matrici RGBA di origine/decodifica.

La cache è unica per URL runtime risolto tramite `assetUrl`, condivisa da caricamento iniziale e renderer. Una pagina pronta può essere riutilizzata senza una seconda bitmap. Le pagine inutilizzate vengono espulse per ordine d'uso quando serve spazio e dopo tre secondi senza riferimenti; le bitmap vengono chiuse. Il renderer mantiene l'ultimo frame sul canvas durante un passaggio lento e ferma il proprio tempo finché la pagina richiesta è pronta. Il colpo, il marker e il completamento seguono il frame effettivamente disegnato. Una sorgente non disponibile termina il caricamento con il fallback già previsto per la stessa specie/lato, invece di aspettare senza fine.

`Automatica` sceglie 32 MiB su layout compatti o dispositivi che dichiarano al massimo 4 GB di RAM, altrimenti 64 MiB. `Standard` e `Memoria ridotta` cambiano soltanto la quantità di pagine preparate. Risoluzione, dettagli, trasparenza e frame rate restano identici. Con due pagine correnti da circa 16 MiB e il limite di 32 MiB, il prefetch può essere rinunciato; al confine il canvas visibile consente di rilasciare la vecchia pagina e caricare quella critica.

Le verifiche mirate sono passate: 485 test in nove file, controllo TypeScript e controllo del diff. Coprono tutti i contratti nativi, i pixel dei frame iniziale/finale e dei confini della specie 13, tutti i 96 frame del player, reazione trattenuta, callback singole, pagina lenta/mancante, sorgente cambiata, bitmap tardive, condivisione e rilascio della memoria. Sono riuscite 10 prove in Chromium, cinque scenari ciascuno su desktop e con viewport/dispositivo mobile: passaggi reali e marker originale; continuità con una pagina ritardata; KO finale trasparente con movimento ridotto; due creature contemporanee al limite di 32 MiB; controlli reali Automatica/Standard/Memoria ridotta durante un attacco a 48 fps, con il marker al frame originale 48 emesso una sola volta. La variante mobile è un'emulazione browser, non una misura della memoria su telefono fisico.

Per riprodurre la conversione: `node scripts/build-arkamon-pages.mjs --resume --effort 1`. Il resume riutilizza soltanto pagine rilette e confrontate con i pixel originali. `--effort` regola il tempo di compressione lossless e il peso encoded, senza ridurre qualità o frame. Il manifest e il rapporto vengono scritti atomicamente al termine di ciascun clip. Il test browser dedicato usa `e2e/native-pages.config.ts` e conserva i risultati fuori dal checkout.
