# Animazioni frontali del 13 novembre 2026

Sono stati aggiunti quattro set frontali, per le forme **163–166**, e sostituita la clip di vittoria della **161**. Ogni set comprende attesa, attacco, reazione al colpo, vittoria e KO. Tutti i 21 video misurano 1920×1080 e contengono 94 fotogrammi a 24 FPS. La conversione mantiene tutti i 1.974 fotogrammi nell'ordine originale.

I PNG frontali delle forme 163–166 sono stati aggiornati con quelli corrispondenti ai nuovi video. Nel Laboratorio (`/#arkamon-lab`) si possono confrontare il ritratto ufficiale e l'anteprima animata. Le quattro forme sono in attesa di nome, mosse e attributi. Il Laboratorio permette di provare 56 forme animate in attesa dei dati di gioco e il catalogo giocabile conta 110 forme.

La conversione rimuove lo sfondo blu dei quattro nuovi set e lo sfondo verde dalla vittoria della 161. Nei KO di 164 e 165 è stata usata una maschera di trasparenza più graduale per mantenere la dissolvenza degli effetti. Alcuni lampi e particelle raggiungono i bordi già nei video originali. L'attesa della 166 torna da una posa inclinata a quella dritta a fine ciclo. Il Laboratorio segnala quel raccordo per la revisione e conserva i fotogrammi originali.

L'[audit dell'importazione](../animation-source/audits/front-2026-11-13.json) riporta le impronte degli originali, i fotogrammi di rilascio e reazione, la verifica delle pagine e le impronte della clip sostituita. Le altre 809 clip conservano gli stessi originali e le stesse pagine di riproduzione. Il catalogo finale comprende **166 forme animate, 830 clip, 79.105 fotogrammi e 8.625 pagine**. Tutte le 233 pagine convertite rientrano nel limite di 16 MiB decodificati. La build GitHub Pages pesa 743,6 MiB e rispetta i limiti di avvio.

In locale sono passati 1.117 test mirati al catalogo, ai media e al Laboratorio, 9 test dei controlli di rilascio, 22 scenari browser su desktop e mobile e 5 scenari sulla build di produzione con i media locali della revisione fissata. I cinque scenari provano ciascuna azione nel Laboratorio per 161 e 163–166.
