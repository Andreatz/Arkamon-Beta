# Laboratorio audio

Aprire il server di sviluppo con `#audio-lab`, per esempio `http://localhost:3000/#audio-lab`.

La libreria comprende 5.466 file originali in `public/sounds`. Il catalogo è generato separatamente in `public/audio-lab/catalog.json` e caricato solo nel laboratorio. I file originali non vengono modificati. I nomi numerici del pacchetto MapleStory non vengono interpretati come categorie elementali.

La selezione iniziale è basata esclusivamente su nome, durata e misure del segnale: **nessun suono è stato ascoltato o approvato dall'assistente**. I candidati durano da 0,07 a 5 secondi e hanno superato una decodifica del segnale; i file senza metadati e i WMA sono esclusi dalle proposte. La scansione dei metadati non equivale a una decodifica integrale della libreria.

## Confronto

1. Scegliere una delle 276 mosse oppure un evento generico.
2. Selezionare un candidato, oppure cercare nella libreria completa disattivando il filtro iniziale.
3. Ascoltare il file dal lettore o usare **Riproduci insieme** per il confronto con il VFX reale della mossa.
4. Regolare volume, avvio all'inizio/all'impatto e ritardo aggiuntivo. Il suono aspetta il segnale del VFX preparato, anche se l'immagine carica lentamente.
5. Salvare un candidato o confermare dopo la riproduzione. Esportare le scelte in JSON per l'integrazione successiva.

Le scelte sono conservate nel browser con chiave `arkamon-audio-lab-v1`. Sono specifiche di origine/browser. L'esportazione include destinazione, file, volume e tempi. Nessuna scelta modifica l'audio effettivo delle battaglie o degli eventi finché non viene integrata esplicitamente.

La selezione di una mossa/suono diverso o **Ferma** interrompe audio e ritardi precedenti. Il laboratorio non avvia automaticamente i suoni. La musica del gioco non viene montata in questa pagina.

## Rigenerazione

`python scripts/build-audio-catalog.py --input public/sounds --output public/audio-lab/catalog.json --ffmpeg PERCORSO_FFMPEG --cache .cache/audio-probe-cache.json`

Dipendenze: Python, NumPy e FFmpeg. La cache invalida i metadati quando cambiano dimensione o data del file. Rimuovere la cache per una scansione forzata. Archivi ZIP, file SFK e altri file non audio non sono indicizzati.

## Aggiornamento: scelte delegate a Codex
Le 276 mosse e i 10 eventi hanno ora una selezione predefinita attiva. Vedi audio-selections.md per l'elenco completo. I passaggi precedenti che descrivono il laboratorio come unica destinazione delle scelte si riferiscono alla versione preliminare. Gli aggiustamenti manuali nel laboratorio restano locali; la selezione del gioco proviene da src/data/audio-selections.json.
