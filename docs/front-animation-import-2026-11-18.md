# Animazioni frontali del 18 novembre 2026

Sono stati aggiunti **28 set frontali**, per le forme **177–193 e 196–206**: attesa, attacco, reazione al colpo, vittoria e KO. I 140 video originali misurano 1920×1080 e contengono ciascuno 94 fotogrammi a 24 FPS. La conversione mantiene tutti i **13.160 fotogrammi** nell'ordine originale e conserva gli MP4 canonici con la stessa impronta dei video caricati.

Il convertitore gestisce ora anche gli sfondi magenta, usati dalle forme 188–190 e 201–206. Gli altri 19 set hanno lo sfondo verde. La conversione mantiene i colori propri delle creature e usa una scala del corpo comune alle cinque azioni, con spazio aggiuntivo per movimenti ed effetti. I raccordi dell'attesa di 188 e 203 sono segnalati nel Laboratorio per la revisione artistica, conservando i fotogrammi originali.

Le 980 nuove pagine sono state confrontate con gli atlas trasparenti: tutti i pixel visibili e tutti i valori alpha coincidono. Ogni pagina rispetta il limite di **16 MiB decodificati**; le nuove pagine occupano 564.654.042 byte compressi. Le **870 clip precedenti conservano esattamente le stesse voci nel catalogo**.

Il catalogo finale contiene **202 forme animate, 1.010 clip, 96.027 fotogrammi e 9.970 pagine**. Tutte le 206 forme hanno già i dati di gioco. Le sole forme senza video forniti sono 167, 168, 194 e 195 e continuano a usare il ritratto ufficiale. Il Laboratorio permette di confrontare i ritratti e le animazioni, esaminare ogni fotogramma e provare gli attacchi con VFX.

È stato inoltre corretto un problema di avvio su Windows: il modulo di calcolo delle particelle e il componente React avevano nomi distinti soltanto per maiuscole e minuscole. Il modulo è ora `ambientParticleMath.ts`.

L'[audit dell'importazione](../animation-source/audits/front-2026-11-18.json) contiene le impronte degli originali, le dimensioni, i conteggi indipendenti dei fotogrammi, i punti di rilascio e reazione e il confronto delle pagine con la revisione precedente. Il [rapporto delle pagine](arkamon-pages-verification.json) riporta la verifica del catalogo completo.
