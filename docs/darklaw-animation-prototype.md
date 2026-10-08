# Animazioni frontali degli Arkamon

Il gioco integra i filmati frontali di Vyrath (specie 1, 2, 3 e 4), Darklaw (5, 6, 7 e 8), Felyss (9, 10, 11 e 12), Wormaren (13 e 14), Handipus (20) e Shrody (21). Ogni specie dispone di attesa, attacco, colpito, vittoria e KO: 80 animazioni complessive per 16 specie. I nomi sono condivisi dai rispettivi stadi nel database; il numero distingue le forme.

La pagina di sviluppo `#arkamon-lab` permette di scegliere la specie, confrontare il PNG originale con le cinque animazioni, cambiare sfondo e dimensione, e provare una mossa con il relativo VFX su un bersaglio animato. I comandi del laboratorio non modificano la partita. Il retro usa gli sprite esistenti.

## Filmati e riproduzione

I filmati forniti in `public/sprites/animation/Front/{speciesId} {action}.mp4` sono conservati anche nella cartella sorgente `animation-source/raw/{speciesId}/front/`. Tutte le clip mantengono i 24 FPS originali: 79 contengono 96 fotogrammi, per quattro secondi; il KO di Wormaren 14 ne contiene 95, per 95/24 secondi (circa 3,958). Tutte le 7.679 immagini dei set sono conservate, in ordine, senza saltare fotogrammi, aggiungere interpolazioni, generare pose, invertire o mescolare i filmati. Il manifest conserva il conteggio specifico dell’azione, compreso il KO più breve.

La durata è il rapporto fra numero di fotogrammi decodificati e FPS. Una durata del contenitore MP4 leggermente maggiore, per esempio 4,01 secondi, non aggiunge fotogrammi. Gli indici sono contati da zero: l’ultimo è 95 nelle clip da 96 fotogrammi, 94 nel KO di Wormaren 14.

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

I metadati `animation-set.metadata.json` e `animation-set.normalization.json` descrivono l’intero set. Le dimensioni delle celle e i margini sono specifici della specie e coprono gli spostamenti dei cinque filmati. La finestra logica di visualizzazione misura 384 × 384 pixel, tranne la specie 6 che usa 320 × 320, come dichiarato nei metadati del set. L’atlas dispone di dieci colonne e dieci righe, con 96 celle usate e quattro celle vuote; il KO della specie 14 usa 95 celle e ne lascia cinque vuote.

La conversione rimuove lo sfondo verde e corregge i residui cromatici. Le risoluzioni sorgente sono normalizzate nello stesso spazio per ogni specie. Una calibrazione della camera, costante per tutta la clip, allinea il corpo iniziale alla posa di attesa; la scala e il piano di appoggio sono comuni alle cinque azioni. Gli spostamenti e le deformazioni presenti nei filmati restano parte dell’animazione. Non viene ridimensionato separatamente ogni fotogramma, né riallineata la posa caduta del KO.

I nuovi set 1, 2, 3, 4, 9 e 21 usano `--screen-dominance-cleanup` con geometria calcolata dalle rispettive sorgenti. Questa pulizia rimuove il fondale non uniforme e i residui periferici che possono falsare i limiti dell’attesa e ridurre troppo il corpo. Il profilo aggiuntivo per il contorno gialloverde resta disattivato: i ciano delle ali, delle fiamme e delle scie e i dettagli dorati di Shrody sono controllati rispetto ai video. Felyss è fornito a 1280 × 720 pixel; gli altri cinque nuovi set a 1920 × 1080. Frequenza, fotogrammi e durata coincidono.

Anche i set 10–14 usano la pulizia per dominanza senza il profilo fringe, per conservare i colori del corpo, le scie ciano e le particelle dorate originali. Il solo KO di Felyss 11 usa il profilo base: conserva il cerchio luminoso pallido che la pulizia aggiuntiva spezzava, mantenendo la geometria comune e rimuovendo il fondale. Felyss 10 combina attesa e KO a 1920 × 1080 con attacco, colpito e vittoria a 1280 × 720: la calibrazione fissa di ogni clip riporta queste risoluzioni nel medesimo spazio logico. Il suo riferimento è il PNG frontale aggiornato fornito dall’utente. Per i PNG rettangolari il piano di appoggio e la dimensione tengono conto della centratura con `object-contain` nel riquadro quadrato, come nel renderer statico. Gli altri quattro set sono forniti a 1920 × 1080; il KO della specie 14 conserva il proprio conteggio nativo di 95 fotogrammi.

I video delle forme Darklaw 6, 7 e 8 includono un contorno gialloverde già mescolato al disegno. Il solo eccesso di verde non lo elimina: alcuni pixel hanno rosso uguale o maggiore del verde, e la desaturazione può renderli gialli. Questi tre set usano quindi il profilo esplicito `--screen-fringe-cleanup`, che lavora sul colore sorgente prima della desaturazione. Riduce gradualmente l’alfa fra 35° e 45° di tinta ed elimina il residuo verde fino a 170°, compresi gli spazi chiusi tra arti, corpo e fiamme. Protegge i nuclei luminosi caldi per conservare i bagliori del colpo e le fiamme arancioni. Il profilo resta disattivato per impostazione predefinita: non va applicato automaticamente a personaggi con parti verdi. Il set 5 conserva i suoi effetti dorati originali.

Le azioni diverse dall’attesa limitano la maschera del residuo ai colori con rosso maggiore del blu di oltre dieci livelli, conservando il fumo neutro e le scie chiare/ciano mescolate al fondale. La clip colpito usa trenta livelli per mantenere anche la polvere chiara già visibile prima della correzione. La pulizia preesistente del fondale non uniforme resta invariata e può ancora ridurre le parti più trasparenti della polvere sorgente.

Attacco, colpito e KO proteggono inoltre il bagliore caldo entro otto pixel sorgente dai nuclei delle scintille. La protezione locale usa nuclei con `R >= 190`, `G <= R+25`, `R > B+50`, e mantiene soltanto il loro vicinato caldo con tinta inferiore a 65° e `R >= G-25`. Vittoria conserva i nuclei luminosi, ma non espande questa protezione: l’aura arancione continua del corpo proteggeva altrimenti anche il bordo gialloverde contaminato. La posa di attesa mantiene il profilo più ampio: estendere a essa la protezione delle scie ripristinerebbe la corona mescolata al contorno. L’alfa e il colore delle porzioni che assorbono il verde vengono corretti, mentre il movimento e l’ordine di tutti i fotogrammi rimangono quelli originali.

Il margine trasparente della cella contiene gli effetti del video. Il renderer compensa questo margine rispetto alla finestra logica, così il personaggio mantiene la dimensione prevista nella scena. Il manifest e i metadati vengono confrontati dai test per rilevare differenze di griglia, frequenza, conteggio o finestra.

Per gli Arkamon il player disegna la sola cella corrente in un Canvas 2D. Crea un `ImageBitmap` dall’immagine già decodificata e ne conserva i pixel durante il clip; lo chiude al cambio di sorgente o allo smontaggio, anche se la creazione asincrona termina dopo una cancellazione. Se questa API non è disponibile o fallisce, usa l’immagine decodificata. Non mantiene una cache globale dei bitmap. La superficie richiede un percorso orientato alla CPU per limitare il costo degli atlas più grandi durante il primo disegno. Il canvas viene pulito a ogni fotogramma: la trasparenza sostituisce il disegno precedente, anche nel KO finale. Coordinate, FPS, marker e durata restano quelli del medesimo atlas; il player CSS degli effetti VFX resta disponibile con il comportamento preesistente.

Il convertitore richiede Python 3.10 o superiore, Pillow, NumPy e FFmpeg; `imageio-ffmpeg` può fornire l’eseguibile. Esempio dalla root del repository:

```text
python scripts/build-arkamon-idle.py --species-id 6 --screen-dominance-cleanup --screen-fringe-cleanup --source-dir animation-source/raw/6/front --reuse-normalization public/sprites/arkamon/6/front --output .tmp/animation-6-clean/front --qa-dir .tmp/animation-6-qa --battle-background public/backgrounds/battle_forest.jpg
```

`--ffmpeg` seleziona un eseguibile specifico, `--actions` limita le azioni da convertire includendo sempre l’attesa come riferimento, e `--decoded-dir` riusa una cache verificata mediante l’impronta della sorgente. `--species-id` deve corrispondere al percorso sorgente e alla specie nel manifest. La specie 6 usa una finestra logica da 320 pixel e la pulizia aggiuntiva del fondale non uniforme con `--screen-dominance-cleanup`; le specie 7, 8 e 20 usano la finestra predefinita da 384 pixel.

`--reuse-normalization` riutilizza scala, ritaglio, calibrazione della camera, margini, punto di appoggio e marker dei metadati esistenti. Verifica prima l’impronta, le dimensioni, il conteggio dei fotogrammi e gli FPS del video: una sorgente differente interrompe la conversione. È il percorso da usare per correggere la trasparenza di asset già integrati, evitando che un contorno più piccolo cambi anche la dimensione del personaggio. Per creare un set nuovo senza metadati, omettere questa opzione e fornire il riferimento PNG e la finestra logica appropriata.

## Attacco, rilascio e impatto

I marker sono indici dei fotogrammi nativi, contati da zero, selezionati dal movimento del personaggio nei video:

| Specie | Nome | Rilascio dell’attacco | Reazione al colpo |
| ---: | --- | ---: | ---: |
| 1 | Vyrath | 45 | 30 |
| 2 | Vyrath | 53 | 22 |
| 3 | Vyrath | 45 | 33 |
| 4 | Vyrath | 47 | 25 |
| 5 | Darklaw | 31 | 28 |
| 6 | Darklaw | 47 | 27 |
| 7 | Darklaw | 51 | 26 |
| 8 | Darklaw | 26 | 37 |
| 9 | Felyss | 50 | 17 |
| 10 | Felyss | 58 | 27 |
| 11 | Felyss | 58 | 26 |
| 12 | Felyss | 47 | 25 |
| 13 | Wormaren | 48 | 32 |
| 14 | Wormaren | 48 | 23 |
| 20 | Handipus | 56 | 29 |
| 21 | Shrody | 54 | 25 |

`releaseFrame` appartiene alla clip di attacco; `reactionFrame` appartiene a quella colpito. I tempi corrispondono agli indici divisi per gli FPS originali. Il VFX viene rilasciato al marker dell’attaccante, e la posa di reazione del bersaglio viene allineata all’impatto dichiarato dall’effetto.

I marker delle nuove forme sono verificati sui fotogrammi originali consecutivi. Quando il rinculo inizia prima del flash già contenuto nel filmato, il marker della reazione coincide con l’inizio del rinculo: vale per le specie 2, 3 e 21. Il gate non deve mostrare in anticipo una posa già colpita aspettando il flash successivo.

Le clip vengono caricate prima di iniziare la sequenza. Il coordinatore usa il primo fotogramma effettivamente riprodotto come origine del tempo, e non la richiesta di caricamento. Quando la reazione richiede una preparazione più lunga, il filmato del bersaglio può iniziare prima dell’attacco, in modo che il suo marker raggiunga l’impatto del VFX. Tutti i fotogrammi sono conservati e le clip mantengono i 24 FPS.

Se il VFX tarda a comparire, il clip colpito si ferma al fotogramma subito prima di `reactionFrame`. L’evento di impatto effettivo libera quella posa e il filmato prosegue dal marker, compensando il tempo trascorso in attesa. Non riparte da zero e conserva tutti i fotogrammi restanti. Il gate riguarda soltanto la reazione al colpo; attacco e KO mantengono il loro orologio originale.

La preparazione attende anche la decodifica dei pixel. Una cache temporanea conserva le immagini decodificate per dieci secondi, con un limite di sei immagini e 512 MiB stimati, evitando una seconda decodifica all’inizio del gesto. Il laboratorio presenta prima i fotogrammi iniziali di attacco e reazione a riproduzione ferma e lascia completare il primo disegno delle texture; poi avvia i due orologi secondo i ritardi del planner. Il momento di impatto usa la stessa funzione nel renderer VFX e nel planner, limitato alla durata effettiva dell’effetto anche in presenza di regolazioni Admin.

La scena di battaglia e la prova del laboratorio condividono il planner `planBattleAnimationPlayback` e i coordinatori `createBattleAnimationPlayback` e `createBattleVisualSequence`. Il turno attende il completamento del VFX e delle clip dedicate prima di proseguire. Caricamenti falliti e preferenza di movimento ridotto devono comunque completare la sequenza una sola volta, senza bloccare il turno. Un completamento obsoleto non deve alterare una nuova azione.

Il numero animato dei danni subiti è rimosso dalla scena. In battaglia ogni attacco mostra prima la reazione colpito, anche se il danno già calcolato sarà fatale. HP, segnalini della squadra e KO restano invariati finché il pannello e tutte le facce dei dadi sono stati mostrati e dipinti. Solo la rivelazione del risultato aggiorna gli HP e avvia l’eventuale KO; il coordinatore `createBattleDamageReveal` attende sia la presentazione dei dadi sia la clip KO completa prima di proseguire con esperienza, contraccolpo della Suprema, cambio o esito. Le mosse di solo stato mantengono il percorso senza dadi del danno.

## Laboratorio e ripieghi

La sequenza delle azioni singole è attesa → attacco → colpito → vittoria → KO. Avanza al completamento delle clip; solo il ciclo iniziale di attesa usa la durata del manifest. Una scelta manuale interrompe la sequenza, e Attesa può ripristinare subito l’idling. Cambiare sfondo o dimensione non riavvia un’azione; cambiare specie o vista annulla quella precedente.

La prova “Attacco e impatto” permette di scegliere una delle mosse reali della specie, la vista dell’attaccante e un bersaglio tra le specie animate. La vista Retro riproduce la combinazione della battaglia: attaccante di spalle con gli sprite esistenti e bersaglio frontale animato. Usa gli stessi sprite, VFX, marker, caricamenti e coordinatori della battaglia. Non calcola danni, non lancia dadi e non modifica HP, salvataggi o numeri casuali. Il comando Interrompi annulla i callback e i timer della prova.

Il confronto usa due colonne sul desktop e una sotto 900 pixel o alla scala 150%. La dimensione considera il canvas completo e i margini specifici della specie; sui dispositivi piccoli viene limitata allo spazio disponibile. La linea decorativa sotto gli sprite è rimossa.

Un atlas non disponibile ripristina il PNG della stessa specie e vista e comunica comunque la fine dell’azione. Il retro e le specie prive di filmati conservano gli asset esistenti e il movimento procedurale. Il deposito continua a usare i ritratti statici.

## Verifiche

I test degli asset confrontano dimensioni reali, alfa, griglia e finestra logica con il manifest; verificano le copie originali e canoniche dei video, le impronte degli atlas e dei poster, tutti gli indici consecutivi, i 24 FPS nativi e la trasformazione fissa condivisa per specie. I conteggi seguono la sorgente: 95 nel KO di Wormaren 14 e 96 nelle altre clip. Il KO finale non è obbligato a contenere una sagoma opaca, perché la dissoluzione appartiene al filmato originale.

`python scripts/test_arkamon_key.py` verifica la rimozione del contorno e degli spazi chiusi, la conservazione dei dettagli rossi, viola, scuri e dei bagliori caldi, il profilo disattivato per colori verdi legittimi, e il riuso della geometria soltanto quando la sorgente coincide. Il conteggio `remainingGreenDominantPixelsOver8` non basta per giudicare i bordi: la desaturazione può azzerarlo lasciando una corona gialla. I metadati riportano anche un conteggio diagnostico gialloverde, che può includere luci dorate legittime; la verifica comprende quindi il confronto dei fotogrammi su sfondo scuro e chiaro e la revisione degli effetti luminosi.

I test del manifest verificano i sedici set completi, le ottanta clip dedicate, i marker e il ripiego idle, oltre a mantenere i conteggi e le frequenze delle undici specie già integrate. I test del coordinatore verificano l’ordine rilascio → impatto → completamento, l’allineamento dei tempi, le notifiche duplicate, l’annullamento e il completamento quando un asset fallisce. Caricamento, riproduzione, sincronizzazione e dimensioni responsive richiedono anche una verifica nel browser; il rendering sul server non esegue la temporizzazione dei filmati.
