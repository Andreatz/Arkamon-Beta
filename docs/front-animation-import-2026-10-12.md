# Animazioni frontali delle forme 34–38

I 25 nuovi video sono integrati come attesa, attacco, colpito, vittoria e KO per due stadi di Crawgoyle e tre di Chimzap. Il totale diventa **37 forme e 185 animazioni frontali**. I nomi seguono il catalogo; gli ID distinguono gli stadi. Il video originale `36 defeat.mp4` resta con il nome fornito ed è copiato byte per byte nella sorgente canonica `animation-source/raw/36/front/ko.mp4`.

| ID | Arkamon | Finestra logica | Cella RGBA | Rilascio attacco | Reazione al colpo |
| ---: | --- | --- | --- | ---: | ---: |
| 34 | Crawgoyle | 256×256, left 223 / top 227 | 704×704 | 49 | 18 |
| 35 | Crawgoyle | 288×288, left 240 / top 239 | 768×768 | 31 | 7 |
| 36 | Chimzap | 256×256, left 257 / top 230 | 768×768 | 50 | 30 |
| 37 | Chimzap | 256×256, left 256 / top 241 | 768×768 | 31 | 23 |
| 38 | Chimzap | 256×256, left 256 / top 258 | 768×768 | 45 | 18 |

I marker sono indici originali da zero, scelti osservando i fotogrammi consecutivi prima e dopo il gesto. Evidenza e tempi in millisecondi sono nei metadati di attacco e colpo, ripetuti nel metadato del set. Battaglia, laboratorio `#arkamon-lab` e strumenti del giocatore usano lo stesso contratto.

## Fedeltà, trasparenza e geometria

Tutte le clip contengono **96 fotogrammi a 24 FPS**, quindi quattro secondi. Sono conservati tutti i **2.400 fotogrammi originali**, senza interpolazioni, pose generate, tagli temporali o inversioni. Le copie canoniche e gli originali forniti coincidono tramite SHA-256, per **61.284.951 byte per copia**. I nuovi atlanti e poster occupano **186.459.442 byte**.

La camera rimane costante per clip; scala e appoggio sono comuni alle cinque azioni. La misura deriva dal PNG della forma e dalla posa iniziale dell'attesa. Il padding contiene tutta l'unione alfa; le finestre logiche sono scelte affinché gli atlanti restino entro 8192 pixel, mantenendo la dimensione proporzionata del corpo nello slot tramite il renderer. Il formato sorgente runtime è WebP statico lossless RGBA; le pagine preservano ogni byte visibile e tutta l'alfa dell'atlante.

34–37 usano il profilo base verde, che conserva archi, fulmini, pietre, polvere e fumo. 38 usa pulizia per dominanza nell'attesa e profilo base nelle quattro azioni. Il frame 53 della Vittoria di 38 contiene un lampo nativo che copre gli angoli: il convertitore usa soltanto in quel frame il fondale verificato `[15,245,61]`, conservando il lampo.

La prima posa di Vittoria di 35 comprende particelle scure isolate. Per la sola calibrazione iniziale, la componente opaca connessa del corpo, vicino al punto sorgente `(960,550)`, misura `[678,148,1242,933]`; il bbox automatico includeva invece particelle a sinistra e destra. `calibrationInspection.initialCameraBodyAudit` registra questa scelta. Le particelle restano tutte nell'unione alfa e nelle immagini. Per rigenerare il set già importato, `--reuse-normalization public/sprites/arkamon/35/front` conserva la camera verificata e i marker, controllando prima che la fonte sia identica.

## Memoria e completezza

Le nuove clip usano il renderer a pagine con massimo **16 MiB decodificati per pagina**, condividendo i budget Automatica/Standard/Ridotta esistenti. Il KO mantiene l'ultimo fotogramma reale: la dissolvenza di 36 lascia poche particelle, mentre altre forme restano a terra con fumo. Attesa ciclica e ritorno all'attesa dopo le altre azioni mantengono il comportamento precedente.

I confezionatori non assumono più un numero fisso di 160 clip. La completezza è ricavata dai metadati delle specie native, indipendentemente dal manifest delle pagine. Ogni specie deve avere cinque azioni concordanti nel metadato del set e nei singoli file. Il controllo verifica insieme delle sorgenti, SHA, frame, FPS, celle, viewport e copertura consecutiva di tutti i frame. Una conversione parziale o una nuova specie senza il set completo interrompe il confezionamento. Le 14 nuove regressioni comprendono sorgenti aggiuntive, stessa quantità con identità errata, differenze di FPS e pagine mancanti.

Squadra, Deposito, Arkadex e Analisi usano i cinque nuovi poster. Il catalogo dei ritratti contiene **110 PNG e 37 poster**; `node scripts/build-player-portrait-metadata.mjs --check` ne verifica i 147 riferimenti.

## Prove e limiti

Il [rapporto di provenienza](../animation-source/audits/front-2026-10-12.json) deriva da una verifica indipendente di tutte le 25 fonti e immagini. FFmpeg decodifica realmente 2.400 frame; SHA, indici, FPS, ogni bounding box alfa, celle inutilizzate trasparenti e poster uguale alla prima posa sono verificati. Le tavole visive confrontano sorgenti e risultati su fondo chiaro, scuro e di battaglia. Le prove nel browser verificano separatamente il percorso paged-canvas, i pixel in movimento, la sequenza attacco/effetto/impatto/reazione, il KO e il layout.

Alcuni fulmini, flash e sbuffi raggiungono già i margini dei video originali. La conversione conserva tutto ciò che è presente e non ricostruisce porzioni esterne mancanti. Il budget della cache riguarda le pagine decodificate, non tutta la memoria del browser. Le prove mobile sono emulazione; non certificano prestazioni su un telefono fisico.

Font, asset delle mosse, HP residui, regole di danno, cap di squadra e progressione restano quelli della partita. Il pin degli asset viene aggiornato dopo il commit delle nuove pagine. Merge, deploy e pubblicazione della release rimangono verifiche distinte dall'importazione.
