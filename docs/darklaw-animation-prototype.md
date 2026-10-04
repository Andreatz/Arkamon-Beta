# Prototipo di animazione Darklaw

Il video fornito dall'utente è collegato al frontale di Darklaw (specie 5) nel renderer di battaglia. La pagina di sviluppo `#arkamon-lab` confronta il PNG esistente con il nuovo movimento e permette di provare attacchi, colpi, vittoria e KO su quattro sfondi e a diverse dimensioni, senza modificare la partita.

## Asset e conversione

- Sorgente: `animation-source/raw/5/front/idle.mp4`, 4 secondi, 1920 × 1080, 24 FPS.
- Runtime: `public/sprites/arkamon/5/front/idle.webp`, atlas WebP statico con trasparenza, 8 colonne × 6 righe, 48 celle di 384 × 384 pixel, riprodotte a 12 FPS.
- Poster: `public/sprites/arkamon/5/front/idle-poster.webp`.
- Provenienza e misure: `public/sprites/arkamon/5/front/idle.metadata.json`.

Il convertitore seleziona un fotogramma ogni due senza interpolazione o generazione di nuovi disegni. Rimuove lo sfondo verde, corregge i residui cromatici sui bordi e applica un unico ritaglio e una trasformazione fissa a tutti i fotogrammi. L'allineamento verticale e la dimensione seguono il PNG di riferimento. L'atlas è codificato senza perdita e verificato dopo la decodifica.

Richiede Python 3.10 o superiore, Pillow, NumPy e FFmpeg (oppure il pacchetto `imageio-ffmpeg`). Dalla root del repository:

```text
python scripts/build-arkamon-idle.py --source animation-source/raw/5/front/idle.mp4 --output public/sprites/arkamon/5/front --qa-dir .tmp/darklaw-animation-qa --reference public/sprites/front_sprites/5.png --battle-background public/backgrounds/battle_forest.jpg
```

`--ffmpeg` permette di specificare l'eseguibile. Le anteprime animate e i contatti su sfondo chiaro, scuro e di battaglia vengono scritti soltanto nella cartella QA; il gioco carica l'atlas statico. Il video originale resta fuori dalla cartella pubblica.

## Comportamento

Il catalogo delle animazioni resta separato dal catalogo VFX generato. Una futura animazione dedicata a un'azione ha precedenza sull'attesa. In sua assenza il frontale di Darklaw conserva il movimento di attesa durante l'azione, con gli spostamenti e gli effetti di battaglia esistenti applicati al contenitore. Il passaggio tra queste azioni mantiene la stessa istanza e la fase del loop.

Il KO blocca il fotogramma corrente; al ritorno all'attesa il loop riparte. La preferenza di sistema per il movimento ridotto, rilevata al caricamento, mostra il primo fotogramma senza movimento del personaggio. Non modifica le transizioni esterne già presenti nella scena di battaglia. Un errore di caricamento dell'atlas ripristina il PNG della stessa specie e vista. L'eventuale errore del PNG continua a essere comunicato al renderer di battaglia.

Il retro di Darklaw, le altre specie e i ritratti del deposito conservano gli asset esistenti. Questo prototipo comprende il solo ciclo di attesa frontale; non contiene nuove animazioni disegnate appositamente per gli attacchi.

## Verifica del loop

Il raccordo mantiene i fotogrammi originali del video, senza inversione temporale o dissolvenza aggiunta. Il confronto visuale primo/ultimo e la differenza numerica sono riportati nei dati QA. Un video di attesa non garantisce un raccordo matematicamente identico: la valutazione resta una verifica del prototipo a dimensioni di gioco.

I test verificano la griglia reale, la trasparenza, la conservazione di pelo scuro e dettagli rossi, la provenienza della sorgente, la scelta degli asset e le viste prive di animazione. La verifica nel browser controlla playback, continuità durante le azioni, KO, ripresa, fallback del caricamento e dimensioni responsive.
