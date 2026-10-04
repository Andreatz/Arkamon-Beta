# Prototipo di animazioni Darklaw

Il frontale di Darklaw (specie 5) usa cinque filmati forniti dall’utente: attesa, attacco, colpito, vittoria e KO. La pagina di sviluppo `#arkamon-lab` confronta il PNG originale con il nuovo set su quattro sfondi e alle dimensioni 75%, 100%, 125% e 150%. Il retro mostra lo sprite esistente. I comandi dell’anteprima non modificano la partita.

## Filmati e riproduzione

| Animazione | Sorgente | Risoluzione sorgente | Fotogrammi originali | FPS nativi | Durata | Dopo il filmato |
| --- | --- | --- | ---: | ---: | ---: | --- |
| Attesa | `animation-source/raw/5/front/idle.mp4` | 1920 × 1080 | 96 | 24 | 4 s | Ricomincia il ciclo |
| Attacco | `animation-source/raw/5/front/attack.mp4` | 1280 × 720 | 96 | 24 | 4 s | Torna all’attesa |
| Colpito | `animation-source/raw/5/front/hit.mp4` | 1280 × 720 | 96 | 24 | 4 s | Torna all’attesa |
| Vittoria | `animation-source/raw/5/front/victory.mp4` | 1280 × 720 | 96 | 24 | 4 s | Torna all’attesa |
| KO | `animation-source/raw/5/front/ko.mp4` | 1920 × 1080 | 96 | 24 | 4 s | Mantiene il fotogramma finale |

L’attacco è un’unica animazione `attack`. I precedenti nomi di animazione `physical` e `special` sono rimossi dal tipo e dal manifest. Le categorie fisica e speciale delle mosse e il relativo calcolo dei danni mantengono il loro significato nel gioco.

Ogni atlas contiene tutti i fotogrammi originali, in ordine da 0 a 95, riprodotti alla frequenza nativa del video. Non vengono saltati fotogrammi, inserite interpolazioni o inventate pose. L’ultimo fotogramma occupa l’intervallo da 95/24 secondi fino alla fine dei quattro secondi.

La durata effettiva delle immagini è calcolata dal numero di fotogrammi decodificati diviso per gli FPS: 96/24 = 4 secondi. Il contenitore MP4 può dichiarare una durata leggermente maggiore, per esempio 4,01 secondi, per audio o impacchettamento; questo valore non aggiunge fotogrammi né allunga il filmato del personaggio.

Il filmato di KO mostra la caduta seguita dalla dissoluzione. Il fotogramma 95 è quasi vuoto: conservarlo mantiene l’esito della dissoluzione originale, anche quando Darklaw non è più visibile. Il renderer non sostituisce quel fotogramma con una posa di KO disegnata o con un fotogramma precedente.

## Asset e provenienza

Per ogni nome di animazione `{action}`, il gioco legge:

- `public/sprites/arkamon/5/front/{action}.webp`: atlas WebP statico senza perdita con canale alfa;
- `public/sprites/arkamon/5/front/{action}.metadata.json`: sorgente, impronta SHA-256, griglia, FPS, durata, indici dei fotogrammi e trasformazione;
- `public/sprites/arkamon/5/front/{action}-poster.webp`: anteprima statica.

I video originali restano in `animation-source/raw/5/front/`, fuori dalla cartella pubblica. Ogni atlas misura 6400 × 6400 pixel: dieci colonne e dieci righe di celle da 640 × 640, con 96 fotogrammi usati e quattro celle vuote. La finestra logica comune misura 384 × 384 pixel ed è posizionata a sinistra 177 e in alto 140 all’interno della cella. Dimensioni delle celle, griglia e finestra logica sono dichiarate nei metadati e replicate nel manifest usato dal renderer.

La conversione rimuove lo sfondo verde e corregge i residui cromatici ai bordi. Le sorgenti a 1280 × 720 vengono normalizzate nello spazio comune 1920 × 1080 prima di applicare la trasformazione del set. Scala e appoggio comuni mantengono coerente la posizione del personaggio tra i filmati; gli spostamenti presenti nei video restano parte dell’animazione. Gli indici registrati in `sampling.sourceFrameIndices` sono consecutivi, e `sampling.allSourceFramesPreserved` conferma la conversione completa.

Il convertitore conserva una calibrazione della camera fissa per ogni clip, ricavata dal corpo iniziale. Successivamente applica a tutto il set la scala e il piano di appoggio derivati dall’attesa. Il margine trasparente aggiunto alla cella contiene gli effetti e gli spostamenti originali senza tagliarli; la finestra logica di visualizzazione è registrata nei metadati.

La conversione richiede Python 3.10 o superiore, Pillow, NumPy e FFmpeg; il pacchetto facoltativo `imageio-ffmpeg` può fornire l’eseguibile. Dalla root del repository:

```text
python scripts/build-arkamon-idle.py --source-dir animation-source/raw/5/front --output public/sprites/arkamon/5/front --qa-dir .tmp/darklaw-animation-qa --reference public/sprites/front_sprites/5.png --battle-background public/backgrounds/battle_forest.jpg
```

`--ffmpeg` permette di indicare un eseguibile specifico. Il comando prepara le cinque azioni; `--actions` consente di selezionarne un sottoinsieme, includendo sempre `idle` come riferimento. `--decoded-dir` permette di riusare fotogrammi decodificati la cui cache viene validata mediante l’impronta della sorgente. Le anteprime dei filmati e i confronti visivi vengono scritti nella cartella QA, mentre il gioco carica gli atlas statici. La normalizzazione condivisa e il riepilogo delle azioni sono registrati rispettivamente in `animation-set.normalization.json` e `animation-set.metadata.json` nella cartella degli asset.

## Comportamento in battaglia e nell’anteprima

Le clip dedicate hanno precedenza sul ripiego idle e vengono riprodotte senza sovrapporre il movimento procedurale del personaggio. Un ritorno automatico anticipato della battaglia allo stato di attesa non tronca la clip in corso. Una nuova azione la può interrompere; il completamento di una clip interrotta non deve modificare quella successiva.

Il player attende il caricamento dell’atlas prima di contare il tempo del filmato. Al completamento, attacco, colpito e vittoria tornano all’attesa; KO conserva il fotogramma finale. La preferenza di movimento ridotto rilevata al caricamento ferma il movimento del personaggio; per KO mostra il fotogramma finale. Le transizioni esterne della scena di battaglia restano quelle del gioco.

L’anteprima riceve il completamento dal renderer. La sequenza è attesa → attacco → colpito → vittoria → KO; le azioni avanzano alla fine della propria clip, senza un tempo massimo che possa tagliare il filmato. L’intervallo iniziale di attesa usa la durata dichiarata dal manifest. Una scelta manuale interrompe la sequenza, e il comando Attesa può ripristinare subito l’idling. Cambiare sfondo o dimensione non crea una nuova azione. La linea decorativa sotto gli sprite è stata rimossa.

Il confronto usa due colonne sul desktop e una colonna sotto 900 pixel o alla scala 150%. La dimensione degli sprite tiene conto del canvas completo e dei margini della finestra logica; entrambe le carte conservano la stessa dimensione di visualizzazione. L’area cresce con lo zoom, e sui dispositivi piccoli la dimensione è limitata allo spazio disponibile per mostrare l’animazione senza tagliare gli effetti.

Un errore di caricamento dell’atlas ripristina il PNG della stessa specie e vista. L’errore del PNG continua a essere comunicato alla battaglia. Il retro di Darklaw, le altre specie e i ritratti del deposito usano gli asset esistenti; questo set aggiunge filmati al solo frontale di Darklaw.

## Verifiche

I test degli asset confrontano le dimensioni reali e il canale alfa degli atlas con il manifest, verificano l’impronta dei video, il numero completo di fotogrammi, l’ordine consecutivo e la frequenza nativa. I controlli sul fotogramma iniziale di ogni clip verificano trasparenza, pelo scuro, dettagli rossi e assenza di residui verdi. Il KO finale non viene obbligato a contenere una sagoma opaca, perché la sua dissoluzione appartiene al video originale.

I test di selezione verificano le cinque clip dedicate, il singolo attacco, il ripiego idle e le viste prive di animazione. I test del ciclo di riproduzione verificano il ritorno anticipato all’attesa, l’interruzione manuale, l’ignorare un completamento obsoleto e il mantenimento del KO finale. Il rendering dei test sul server non esegue la temporizzazione del browser: caricamento, riproduzione completa, replay, completamento, KO, ripiego per errore e dimensioni responsive vanno verificati anche nel browser.
