# Importazione animazioni frontali — 10 ottobre 2026

I 35 nuovi video forniti dall’utente sono integrati come cinque azioni per sette forme. Il laboratorio `#arkamon-lab` e la scena di battaglia leggono lo stesso manifest. Il totale passa a 23 forme e 115 animazioni frontali.

| ID | Arkamon | Finestra logica | Cella trasparente | Rilascio attacco | Reazione colpo |
| ---: | --- | --- | --- | ---: | ---: |
| 15 | Wormaren | 384 × 384 | 768 × 768 | 35 | 29 |
| 16 | Clastoom | 352 × 352 | 768 × 768 | 46 | 18 |
| 17 | Clastoom | 320 × 320 | 768 × 768 | 43 | 38 |
| 18 | Clastoom | 384 × 384 | 768 × 768 | 55 | 16 |
| 19 | Colussand | 352 × 352 | 768 × 768 | 36 | 13 |
| 23 | Sparkly | 288 × 288 | 768 × 768 | 50 | 30 |
| 24 | Grimbolt | 320 × 320 | 704 × 704 | 52 | 27 |

I marker sono indici nativi contati da zero, verificati sui fotogrammi consecutivi originali. I tre stadi di Clastoom condividono il nome nel database e mantengono asset distinti.

## Sorgenti e fedeltà

Tutti i nuovi filmati sono a 24 FPS. Attacco 17 e attesa 23 contengono 95 fotogrammi; le altre 33 clip ne contengono 96. Sono conservati tutti i 3.358 fotogrammi, nel loro ordine, senza interpolazioni o pose generate. Le clip 18 e la vittoria 23 sono a 1280 × 720; le altre sono a 1920 × 1080. Una calibrazione fissa per clip allinea le risoluzioni diverse, con scala e appoggio comuni per le cinque azioni.

Le copie originali in `public/sprites/animation/Front/` e quelle canoniche in `animation-source/raw/` coincidono byte per byte. Il rapporto [front-2026-10-10.json](../animation-source/audits/front-2026-10-10.json) conserva SHA-256, dimensioni, conteggi, frequenza, profili di trasparenza e marker. I nuovi atlas e poster occupano 409.406.670 byte; i 35 video originali occupano 85.884.780 byte per copia. Il formato runtime resta WebP statico lossless RGBA, con griglie 10 × 10 e texture entro 8192 pixel.

La scala deriva dal corpo opaco nella prima posa di attesa, anziché dall’intera unione delle particelle. Tutte le particelle rimangono nel padding trasparente: il corpo di Wormaren 15 mantiene la dimensione del riferimento anche quando i sassi arrivano al bordo della sorgente. Il riuso della normalizzazione verifica la sorgente prima di conservare geometria e camera.

La correzione RGB della sabbia è applicata soltanto a 15, 19 e alla vittoria 18. Non cambia alfa, sagoma, movimento o conteggi. I profili per azione e le opzioni del convertitore sono descritti in [darklaw-animation-prototype.md](darklaw-animation-prototype.md). Le sedici forme precedenti conservano i loro asset e la loro geometria.

## Limiti delle sorgenti

Sassi 15, alcuni vapori 17 e alcune estremità dei fulmini 23 raggiungono già il bordo dei video nativi. La conversione conserva questi limiti e non ricostruisce disegno assente nella sorgente. Ogni metadato elenca i fotogrammi che toccano il bordo originale.

Alcuni bagliori al suolo di Clastoom 17 e la polvere chiara di Grimbolt 24 mantengono una lieve tinta giallo/oliva. I confronti su sfondo chiaro e scuro hanno mostrato che estendere la correzione della sabbia rendeva rosati anche i riflessi dell’armatura o la polvere. Si conserva quindi il profilo base per queste azioni, insieme ai bagliori e al fumo completi. Non viene applicata una rimozione aggressiva che cancelli gli effetti.

## Verifica degli asset

Il controllo dei pixel reali delle 35 griglie ha verificato tutti i 3.358 fotogrammi: bounding box alfa uguali ai metadati, celle inutilizzate trasparenti, SHA-256 corretti, indici consecutivi, 24 FPS e marker coerenti con le sorgenti. Il confronto visivo comprende sorgenti originali e output su fondi chiari e scuri, con approfondimenti su sabbia, fumo, stelle, fiamme e fulmini.

I controlli automatici del repository coprono tutte le 115 animazioni, la corrispondenza manifest/asset, le copie dei video, il canale alfa e il comportamento del renderer. I test Python del convertitore verificano anche la correzione RGB con alfa invariata, il fit iniziale e l’applicazione coerente del profilo in analisi e conversione.

La riproduzione e la sincronizzazione vengono verificate separatamente nel browser: controllare i metadati o renderizzare il componente sul server non dimostra la temporizzazione nella scena reale.
