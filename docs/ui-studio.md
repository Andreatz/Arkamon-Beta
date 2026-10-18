# Studio interfaccia Arkamon

Lo Studio UI modifica la presentazione del gioco. La partita, le regole e i comandi restano quelli delle schermate reali.

## Aprire l’editor

Aprire **Admin → Apri editor completo dell’interfaccia**. In alternativa, aggiungere `#ui-studio` all’indirizzo del gioco. La scorciatoia Admin esistente è **Ctrl+Maiusc+A**.

Lo spazio di lavoro mostra una tela logica **1920 × 1080**, adattata allo spazio disponibile. Le misure nell’ispettore sono espresse in pixel della tela, indipendentemente dallo zoom.

## Schermate

Il selettore comprende Titolo, Laboratorio, Mappa principale, città, percorsi, mappa a griglia, Battaglia, Lega, Evoluzione, Menù Partita, Squadra, Deposito, Arkadex, Analisi, Borsa, Negozio e le sei sezioni di servizio: Diario, Backup, Impostazioni, Cronache, Registro del match e Sfide.

Il selettore **Vista interna** permette di modificare separatamente le schede di Analisi e Arkadex, il pannello dei dadi e la borsa della battaglia. Per città e percorsi si può scegliere il layout comune oppure una delle mappe locali: le personalizzazioni del singolo luogo ereditano il modello comune e prevalgono soltanto dove necessario. Il contenuto delle mappe e le interazioni continuano a dipendere dalla partita e dall’editor delle interazioni già presente.

## Modificare una schermata

1. Scegliere la schermata dal selettore superiore.
2. Selezionare un elemento nell’anteprima o nell’elenco a sinistra.
3. Trascinarlo, usare le otto maniglie, oppure inserire X, Y, larghezza e altezza nell’ispettore.
4. Scegliere un asset dalla libreria, importare un’immagine, modificare adattamento, opacità, livello, visibilità o blocco.
5. Usare **Schermata** per sfondo e font locali, **Font** per le impostazioni generali e **Menù** per etichette, visibilità e ordine dei comandi.
6. Premere **Applica al gioco** per rendere attiva la composizione.

Sono disponibili i kit Scuro, Blu e Comuni, i componenti separati dalle tavole e gli asset già presenti nel gioco. La selezione di un componente non modifica il file originale.

**Scegli asset** sostituisce la grafica dell’elemento selezionato. Nei gruppi della battaglia come **HP nemico**, **HP giocatore** e **Box messaggi**, la modifica raggiunge la cornice del componente interno: non aggiunge uno sfondo dietro la vecchia cornice. Le texture decorative originali sono escluse quando si cambia la cornice; nome, livello, HP, riempimento animato, status e comandi continuano ad aggiornarsi. **Originale** e **Annulla** ripristinano anche le decorazioni. Per aggiungere un’immagine indipendente sopra la schermata, usare **+ Immagine**.

Le due cornici HP del kit Comuni hanno un adattamento dedicato: il livello di esempio è escluso e il riempimento e i valori reali sono allineati alla nuova cornice, anche cambiando l’adattamento dell’immagine. I file SVG originali restano intatti. Negli altri asset, eventuali valori, barre o etichette già disegnati nel file restano parte dell’illustrazione: l’adattamento e il layout vanno verificati nell’anteprima.

Le frecce spostano l’elemento di 1 pixel; Maiusc aumenta il passo a 8 pixel. Alt disattiva temporaneamente l’aggancio durante il trascinamento. Ctrl+Z annulla; Ctrl+Maiusc+Z o Ctrl+Y ripete.

## Livelli aggiunti e menù

Si possono aggiungere immagini, testi, pannelli e pulsanti, quindi duplicarli o eliminarli. Un pulsante aggiunto può richiamare un comando già presente nella stessa schermata e ne rispetta la disponibilità. L’editor non introduce nuove azioni di gioco.

L’ordine dei comandi si modifica all’interno del relativo contenitore. Per una disposizione libera si usano posizione e dimensione dei singoli elementi.

Il negozio è disponibile nell’anteprima per poterlo progettare; nella partita resta accessibile esclusivamente attraverso l’interazione sulla mappa. Il pubblico conserva il solo voto sulle mosse degli NPC normali.

## Font

Norwester è il carattere predefinito per testi, titoli e pulsanti. Le lettere accentate e i simboli assenti nel file usano il carattere di riserva, conservando il testo originale. È possibile scegliere famiglie diverse per tutto il gioco, una schermata o un singolo elemento; la scelta più specifica prevale.

Si possono importare font OTF, TTF, WOFF e WOFF2. Le dimensioni, il peso, l’interlinea, la spaziatura, il colore, l’allineamento e la trasformazione maiuscolo/minuscolo sono regolabili. Il peso effettivo dipende dalle varianti contenute nel font.

Norwester e Chela One sono inclusi nel gioco. L’opzione Azonix usa l’eventuale installazione locale; per trasferire un font personale fra computer occorre importarne il file ed esportare il pacchetto UI.

La lista **File importati**, disponibile nei font e nella libreria asset, permette di rimuovere dalla bozza i file inutilizzati. I file ancora usati dal layout non sono rimovibili; quelli già applicati restano conservati anche quando si scarta una modifica.

## Bozza, salvataggio e trasferimento

L’anteprima usa dati dimostrativi isolati dalla campagna. I clic selezionano gli elementi e non eseguono le azioni di gioco. Le modifiche restano nella bozza fino ad **Applica al gioco**. **Scarta** ricarica l’ultima configurazione applicata. **Ripristina elemento** e **Ripristina questa schermata** rimuovono le personalizzazioni corrispondenti dalla bozza.

Il progetto applicato è salvato nel tema Admin del browser; immagini e font importati sono conservati in IndexedDB. Non esiste una sincronizzazione automatica fra browser o computer.

**Esporta** produce un file JSON con la configurazione e i media importati. **Importa** lo apre nella bozza; occorre poi applicarlo. Questo è il formato da usare per trasferire il progetto su un altro computer. Il vecchio export del solo tema Admin conserva i riferimenti ma non include i file della libreria.

La cronologia conserva fino a 60 modifiche. I limiti di importazione sono 12 MB per immagine, 3 MB per SVG, 4 MB per font e 64 MB di media per pacchetto. Gli SVG importati devono essere statici e autonomi.

Una composizione molto densa o con testi grandi può sovrapporre gli elementi: la tela e le misure aiutano a verificarla, ma l’editor non riprogetta automaticamente un layout personalizzato per ogni formato di schermo. Il riferimento di progettazione è 1920 × 1080.

Le evidenze dei controlli locali sono riportate nel [rapporto di verifica](ui-studio-verification.md).
