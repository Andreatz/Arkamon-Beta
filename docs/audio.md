# Audio di Arkamon

Comparto audio rifatto da zero il 26 novembre 2026. Sostituisce la libreria `public/sounds` (pacchetti di provenienza incerta, segnalati dall'audit del 15 novembre), le scelte di `src/data/audio-selections.json` e la musica generativa a toni.

## Cosa c'è

| Parte | Dove | Note |
|---|---|---|
| Colonna sonora | `public/audio/music/*.mp3` (18 brani, 73 MB) | Fornita dall'utente. Copertina e metadati tolti senza ricodifica. |
| Scalette per contesto | `src/data/audio-music.json` | Brani, guadagno per portarli tutti a −15,6 LUFS, contesti → brani. |
| Effetti sonori | `public/audio/sfx/*.ogg` (88 file, 1,3 MB) | Sintetizzati da zero, stile 8 bit, Vorbis mono 44,1 kHz. |
| Generatore | `scripts/audio/generate-sfx.py` | Deterministico. Richiede numpy, scipy e ffmpeg con libvorbis. |
| Catalogo effetti | `src/data/audio-sfx.json` + `src/audio/sfxIds.ts` | Generato; un test verifica che coincidano. |
| Motore | `src/utils/soundManager.ts` | Web Audio per gli effetti, due `<audio>` in dissolvenza per la musica. |
| Regole | `src/audio/` | Suono di ogni mossa, suoni della Cronaca, suoni dell'interfaccia. |
| Laboratorio | `dev.html#audio-lab` | Ascolto di effetti, brani, scalette e suono di ogni mossa. |

Rigenerare gli effetti: `python3 scripts/audio/generate-sfx.py` (tutti) oppure `--only battle.` (un gruppo). `--wav CARTELLA` salva anche i WAV.

## Musica

| Contesto | Quando | Brani |
|---|---|---|
| `title` | Titolo | Pixel Adventure |
| `laboratory` | Laboratorio | 8-Bit Groove |
| `world-map` | Mappa principale | Brisk Driving Groove |
| `city` | Città | 8-Bit Groove (II), Pixel Pulse |
| `route` | Percorsi | Pixel Chase, Pixel Chase (II) |
| `hidden` | Luoghi nascosti, Lega di Roma, scena Lega | Square Wave Shadow |
| `evolution` | Evoluzione | Pixel Suspense |
| `battle-wild` | Selvatici | Bit-Beast Dash |
| `battle-trainer` | Allenatori | Bit-Crushed Tension, Bit-Crushed Tension (II) |
| `battle-pvp` | PvP e Sfide | Bit-Crushed Pulse |
| `battle-gym` | Capipalestra | 8-Bit Metal Quest |
| `battle-elite` | Superquattro e Lega | Arcade Nightmare |
| `battle-champion` | Campione | 8-Bit Nightmare |
| `victory` | Dopo la fanfara di vittoria | Arcade Pulse |
| `defeat` | Dopo la sconfitta | Game Over Groove |

- Menù Partita, Deposito e Squadra non cambiano musica: resta quella del luogo.
- Una scaletta con più brani ruota: a fine brano parte il successivo, e due visite di fila non ripartono dallo stesso.
- I brani finiscono con un colpo e una coda breve: il successivo entra 0,35 s prima della fine, con dissolvenza.
- Un jingle abbassa la musica (circa −13 dB) per la sua durata.
- Vittoria e sconfitta: KO, poi fanfara (0,8 s dopo), poi il brano del risultato con dissolvenza.
- Per cambiare un'assegnazione basta modificare `contexts` in `audio-music.json`.

## Effetti

- **Interfaccia** (`ui.*`): passaggio del mouse o del cursore da tastiera e gamepad, clic, conferma, indietro, errore, schede, interruttori, cursori, apertura e chiusura del menù, cambio pagina, dialoghi, avvisi, «Premi un tasto», monete, acquisto. Sono delegati in `AudioController`: ogni pulsante suona senza codice aggiuntivo. Con `data-sfx="<id>"` si sceglie un suono preciso; con `data-sfx="none"` si zittisce un'area.
- **Mappa** (`map.*`, `transition.*`): selezione di un luogo, viaggio, passo sulla mappa locale, arrivo, ingresso, cambio turno, incontro nell'erba, strada bloccata, transizioni. Viaggi, passi, turni, acquisti, oggetti, monete, cure e medaglie nascono dal confronto dello stato (`AudioEventBridge`).
- **Battaglia** (`battle.*`, `dice.*`, `capture.*`, `status.*`): ingresso sulla Carta VS, moneta, dadi, nome della mossa, Mossa Suprema (il colpo cade sul lampo a 1,25 s), superefficace, poco efficace, mancato, KO, cambio, oggetto, Boost, cura, sei suoni di stato, le sei fasi della cattura.
- **Jingle** (`jingle.*`, `evolution.charge`): vittoria, sconfitta, livello, evoluzione, medaglia, oggetto, cura, starter; la carica dell'evoluzione dura quanto la metamorfosi.
- **Mosse** (`move.<elemento>.<potenza>`): 8 elementi × leggera, media, pesante. La potenza viene dall'assegnazione VFX (`tier`). Ogni mossa ha un'intonazione propria entro ±1,5 semitoni, stabile per id. Il suono suona sull'impatto del VFX, a destra o a sinistra secondo il bersaglio. Le mosse di stato suonano all'avvio con il suono dello stato; il danno fisso è un colpo dell'elemento.

## Livelli

- Ogni effetto è normalizzato sul suo picco di volume medio (finestra di 300 ms): interfaccia da −30 a −18 dBFS, mappa e battaglia da −24 a −15, mosse da −18 a −15. Picco massimo −1 dBFS.
- In gioco si aggiungono il guadagno di categoria (interfaccia 0,7; mappa 0,8; battaglia 0,9; mosse 0,95; jingle 0,85), il cursore «Effetti» e un compressore leggero sul bus.
- Limiti: al massimo 4 voci per effetto (1 per passaggio del mouse, dadi e moneta) e un intervallo minimo per i suoni frequenti.

## Verifiche

- `src/utils/__tests__/soundManager.test.ts`: catalogo completo su disco, ogni brano usato, contesti per scena e battaglia, rotazione, limite di voci, silenzio.
- `src/audio/audioRules.test.ts`: suono di ogni mossa del moveset, Cronaca, interfaccia, suoni della mappa.
- Per seguire l'audio in un browser: `window.__arkamonAudioLog = []` prima del caricamento; ogni effetto e brano avviato vi aggiunge `{ kind, id, at }` (con il ritardo già applicato) e gli annullamenti compaiono come `stop`.

## Pacchetti visivi

Il formato dei pacchetti visivi conserva il campo `audio` per leggere e riesportare quelli esistenti, ma il motore audio non lo usa più: i suoni sono sempre quelli generati.
