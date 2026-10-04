# Animazioni frontali degli Arkamon

Il gioco integra i filmati frontali di Darklaw (specie 5, 6, 7 e 8) e Handipus (specie 20). Ogni specie dispone di attesa, attacco, colpito, vittoria e KO: 25 animazioni complessive. Il nome Darklaw è condiviso dalle quattro specie nel database; il numero distingue i diversi stadi.

La pagina di sviluppo `#arkamon-lab` permette di scegliere la specie, confrontare il PNG originale con le cinque animazioni, cambiare sfondo e dimensione, e provare una mossa con il relativo VFX su un bersaglio animato. I comandi del laboratorio non modificano la partita. Il retro usa gli sprite esistenti.

## Filmati e riproduzione

I filmati forniti in `public/sprites/animation/front/{speciesId} {action}.mp4` sono conservati anche nella cartella sorgente `animation-source/raw/{speciesId}/front/`. Ogni clip contiene 96 fotogrammi originali a 24 FPS, per una durata effettiva di 4 secondi. Tutte le 2.400 immagini del set sono conservate, in ordine, senza saltare fotogrammi, aggiungere interpolazioni, generare pose, invertire o mescolare i filmati.

La durata è il rapporto fra numero di fotogrammi decodificati e FPS. Una durata del contenitore MP4 leggermente maggiore, per esempio 4,01 secondi, non aggiunge fotogrammi. L’ultimo fotogramma occupa l’intervallo da 95/24 secondi alla fine dei quattro secondi.

| Animazione | Dopo il filmato |
| --- | --- |
| Attesa | Ricomincia il ciclo |
| Attacco | Torna all’attesa |
| Colpito | Torna all’attesa |
| Vittoria | Torna all’attesa |
| KO | Mantiene il fotogramma finale originale |

L’attacco usa un’unica animazione `attack`. Non esistono animazioni separate `physical` e `special`; le categorie delle mosse e le regole dei danni mantengono il significato già previsto dal gioco. Le dissoluzioni e gli effetti compresi nei video fanno parte dei fotogrammi conservati, incluso l’esito finale del KO.

## Asset e normalizzazione

Per ogni specie e azione il gioco legge:

- `public/sprites/arkamon/{speciesId}/front/{action}.webp`: atlas WebP statico senza perdita con canale alfa;
- `{action}.metadata.json`: sorgente, impronta SHA-256, griglia, FPS, durata, indici e trasformazione;
- `{action}-poster.webp`: anteprima statica.

I metadati `animation-set.metadata.json` e `animation-set.normalization.json` descrivono l’intero set. Le dimensioni delle celle e i margini sono specifici della specie e coprono gli spostamenti dei cinque filmati. La finestra logica di visualizzazione misura 384 × 384 pixel per le specie 5, 7, 8 e 20, e 320 × 320 per la specie 6, come dichiarato nei metadati del set. L’atlas dispone di dieci colonne e dieci righe, con 96 celle usate e quattro celle vuote.

La conversione rimuove lo sfondo verde e corregge i residui cromatici. Le risoluzioni sorgente sono normalizzate nello stesso spazio per ogni specie. Una calibrazione della camera, costante per tutta la clip, allinea il corpo iniziale alla posa di attesa; la scala e il piano di appoggio sono comuni alle cinque azioni. Gli spostamenti e le deformazioni presenti nei filmati restano parte dell’animazione. Non viene ridimensionato separatamente ogni fotogramma, né riallineata la posa caduta del KO.

Il margine trasparente della cella contiene gli effetti del video. Il renderer compensa questo margine rispetto alla finestra logica, così il personaggio mantiene la dimensione prevista nella scena. Il manifest e i metadati vengono confrontati dai test per rilevare differenze di griglia, frequenza, conteggio o finestra.

Per gli Arkamon il player disegna la sola cella corrente in un Canvas 2D. Crea un `ImageBitmap` dall’immagine già decodificata e ne conserva i pixel durante il clip; lo chiude al cambio di sorgente o allo smontaggio, anche se la creazione asincrona termina dopo una cancellazione. Se questa API non è disponibile o fallisce, usa l’immagine decodificata. Non mantiene una cache globale dei bitmap. La superficie richiede un percorso orientato alla CPU per limitare il costo degli atlas più grandi durante il primo disegno. Il canvas viene pulito a ogni fotogramma: la trasparenza sostituisce il disegno precedente, anche nel KO finale. Coordinate, FPS, marker e durata restano quelli del medesimo atlas; il player CSS degli effetti VFX resta disponibile con il comportamento preesistente.

Il convertitore richiede Python 3.10 o superiore, Pillow, NumPy e FFmpeg; `imageio-ffmpeg` può fornire l’eseguibile. Esempio dalla root del repository:

```text
python scripts/build-arkamon-idle.py --species-id 6 --base-cell 320 --screen-dominance-cleanup --source-dir animation-source/raw/6/front --output public/sprites/arkamon/6/front --qa-dir .tmp/animation-6-qa --reference public/sprites/front_sprites/6.png --battle-background public/backgrounds/battle_forest.jpg
```

`--ffmpeg` seleziona un eseguibile specifico, `--actions` limita le azioni da convertire includendo sempre l’attesa come riferimento, e `--decoded-dir` riusa una cache verificata mediante l’impronta della sorgente. `--species-id` deve corrispondere al percorso sorgente e alla specie nel manifest. La specie 6 usa una finestra logica da 320 pixel e la pulizia aggiuntiva del fondale non uniforme con `--screen-dominance-cleanup`; le specie 7, 8 e 20 usano la finestra predefinita da 384 pixel.

## Attacco, rilascio e impatto

I marker sono indici dei fotogrammi nativi, contati da zero, selezionati dal movimento del personaggio nei video:

| Specie | Nome | Rilascio dell’attacco | Reazione al colpo |
| ---: | --- | ---: | ---: |
| 5 | Darklaw | 31 | 28 |
| 6 | Darklaw | 47 | 27 |
| 7 | Darklaw | 51 | 26 |
| 8 | Darklaw | 26 | 37 |
| 20 | Handipus | 56 | 29 |

`releaseFrame` appartiene alla clip di attacco; `reactionFrame` appartiene a quella colpito. I tempi corrispondono agli indici divisi per gli FPS originali. Il VFX viene rilasciato al marker dell’attaccante, e la posa di reazione del bersaglio viene allineata all’impatto dichiarato dall’effetto.

Le clip vengono caricate prima di iniziare la sequenza. Il coordinatore usa il primo fotogramma effettivamente riprodotto come origine del tempo, e non la richiesta di caricamento. Quando la reazione richiede una preparazione più lunga, il filmato del bersaglio può iniziare prima dell’attacco, in modo che il suo marker raggiunga l’impatto del VFX. Tutti i fotogrammi sono conservati e le clip mantengono i 24 FPS.

Se il VFX tarda a comparire, il clip colpito si ferma al fotogramma subito prima di `reactionFrame`. L’evento di impatto effettivo libera quella posa e il filmato prosegue dal marker, compensando il tempo trascorso in attesa. Non riparte da zero e conserva tutti i fotogrammi restanti. Il gate riguarda soltanto la reazione al colpo; attacco e KO mantengono il loro orologio originale.

La preparazione attende anche la decodifica dei pixel. Una cache temporanea conserva le immagini decodificate per dieci secondi, con un limite di sei immagini e 512 MiB stimati, evitando una seconda decodifica all’inizio del gesto. Il laboratorio presenta prima i fotogrammi iniziali di attacco e reazione a riproduzione ferma e lascia completare il primo disegno delle texture; poi avvia i due orologi secondo i ritardi del planner. Il momento di impatto usa la stessa funzione nel renderer VFX e nel planner, limitato alla durata effettiva dell’effetto anche in presenza di regolazioni Admin.

La scena di battaglia e la prova del laboratorio condividono il planner `planBattleAnimationPlayback` e i coordinatori `createBattleAnimationPlayback` e `createBattleVisualSequence`. Il turno attende il completamento del VFX e delle clip dedicate prima di proseguire. Caricamenti falliti e preferenza di movimento ridotto devono comunque completare la sequenza una sola volta, senza bloccare il turno. Un completamento obsoleto non deve alterare una nuova azione.

Il numero animato dei danni subiti è rimosso dalla scena. La comparsa dei dadi e il calcolo del risultato restano nel flusso della battaglia.

## Laboratorio e ripieghi

La sequenza delle azioni singole è attesa → attacco → colpito → vittoria → KO. Avanza al completamento delle clip; solo il ciclo iniziale di attesa usa la durata del manifest. Una scelta manuale interrompe la sequenza, e Attesa può ripristinare subito l’idling. Cambiare sfondo o dimensione non riavvia un’azione; cambiare specie o vista annulla quella precedente.

La prova “Attacco e impatto” permette di scegliere una delle mosse reali della specie, la vista dell’attaccante e un bersaglio tra le specie animate. La vista Retro riproduce la combinazione della battaglia: attaccante di spalle con gli sprite esistenti e bersaglio frontale animato. Usa gli stessi sprite, VFX, marker, caricamenti e coordinatori della battaglia. Non calcola danni, non lancia dadi e non modifica HP, salvataggi o numeri casuali. Il comando Interrompi annulla i callback e i timer della prova.

Il confronto usa due colonne sul desktop e una sotto 900 pixel o alla scala 150%. La dimensione considera il canvas completo e i margini specifici della specie; sui dispositivi piccoli viene limitata allo spazio disponibile. La linea decorativa sotto gli sprite è rimossa.

Un atlas non disponibile ripristina il PNG della stessa specie e vista e comunica comunque la fine dell’azione. Il retro e le specie prive di filmati conservano gli asset esistenti e il movimento procedurale. Il deposito continua a usare i ritratti statici.

## Verifiche

I test degli asset confrontano dimensioni reali, alfa, griglia e finestra logica con il manifest; verificano l’impronta dei video, tutti i 96 indici consecutivi, i 24 FPS nativi e la trasformazione fissa condivisa per specie. Il KO finale non è obbligato a contenere una sagoma opaca, perché la dissoluzione appartiene al filmato originale.

I test del manifest verificano i cinque set completi, le clip dedicate, i marker e il ripiego idle. I test del coordinatore verificano l’ordine rilascio → impatto → completamento, l’allineamento dei tempi, le notifiche duplicate, l’annullamento e il completamento quando un asset fallisce. Caricamento, riproduzione, sincronizzazione e dimensioni responsive richiedono anche una verifica nel browser; il rendering sul server non esegue la temporizzazione dei filmati.
