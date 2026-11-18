# Animazioni frontali del 18 novembre 2026

Sono stati aggiunti **28 set frontali**, per le forme **177–193 e 196–206**: attesa, attacco, reazione al colpo, vittoria e KO. I 140 video originali misurano 1920×1080 e contengono ciascuno 94 fotogrammi a 24 FPS. La conversione mantiene tutti i **13.160 fotogrammi** nell'ordine originale e conserva gli MP4 canonici con la stessa impronta dei video caricati.

Il convertitore gestisce ora anche gli sfondi magenta, usati dalle forme 188–190 e 201–206. Gli altri 19 set hanno lo sfondo verde. La conversione mantiene i colori propri delle creature e usa una scala del corpo comune alle cinque azioni, con spazio aggiuntivo per movimenti ed effetti. I raccordi dell'attesa di 188 e 203 sono segnalati nel Laboratorio per la revisione artistica, conservando i fotogrammi originali.

Le 980 nuove pagine sono state confrontate con gli atlas trasparenti: tutti i pixel visibili e tutti i valori alpha coincidono. Ogni pagina rispetta il limite di **16 MiB decodificati**; le nuove pagine occupano 564.654.042 byte compressi. Le **870 clip precedenti conservano esattamente le stesse voci nel catalogo**.

Il catalogo finale contiene **202 forme animate, 1.010 clip, 96.027 fotogrammi e 9.970 pagine**. Tutte le 206 forme hanno già i dati di gioco. Le sole forme senza video forniti sono 167, 168, 194 e 195 e continuano a usare il ritratto ufficiale. Il Laboratorio permette di confrontare i ritratti e le animazioni, esaminare ogni fotogramma e provare gli attacchi con VFX.

È stato inoltre corretto un problema di avvio su Windows: il modulo di calcolo delle particelle e il componente React avevano nomi distinti soltanto per maiuscole e minuscole. Il modulo è ora `ambientParticleMath.ts`.

L'[audit dell'importazione](../animation-source/audits/front-2026-11-18.json) contiene le impronte degli originali, le dimensioni, i conteggi indipendenti dei fotogrammi, i punti di rilascio e reazione e il confronto delle pagine con la revisione precedente. Il [rapporto delle pagine](arkamon-pages-verification.json) riporta la verifica del catalogo completo.

La verifica della build ha rilevato che i dati del nuovo Database portavano l'avvio oltre i limiti del progetto. Il generatore ora codifica mosse, specie, allenatori e incontri in tuple, condividendo i valori ripetuti e comprimendo le sequenze delle tabelle per livello. I test confrontano integralmente i dati ricostruiti con i quattro JSON originali, comprese le mosse Status, i livelli e i rivali. Il catalogo delle illustrazioni di riserva del titolo viene caricato solo quando serve; gli stili delle transizioni vengono attesi alla prima transizione e un errore di caricamento lascia completare la navigazione. Il Laboratorio animazioni resta raggiungibile anche dalla build compilata con `#arkamon-lab`.

La build GitHub Pages passa con un pacchetto locale di **720,4 MiB**. I pesi iniziali sono **495.811 byte** per il file principale, **761.968 byte** di JavaScript e **99.200 byte** di CSS: i limiti restano rispettivamente 500.000, 800.000 e 100.000 byte. I media sono fissati al commit immutabile `fa3dae9faae4a4486475533b8dc6040caf298ad9`.

Sono passati 5.847 test del catalogo e delle animazioni, 888 controlli su dati, motore, store e transizioni, 46 test della rimozione degli sfondi e 9 test dei controlli di rilascio. Nel browser sono passati 70 scenari dei nuovi video, 18 regressioni del Laboratorio e 6 prove dell'avvio su desktop e mobile. Sulla build compilata sono passati 12 scenari: tutte le azioni di 177, 188, 201, 202, 204 e 206, i quattro ritratti statici e due sequenze VFX. Questa verifica usa i file locali corrispondenti alla revisione fissata e non certifica la pubblicazione dei media sul CDN.
