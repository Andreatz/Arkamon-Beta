# Animazioni frontali aggiunte il 5 novembre 2026

## Fonti e destinazione

Importazione di **70 nuovi video**, cinque azioni per gli ID **132, 133, 135–138, 140–145, 149 e 150**. Tutti i video forniti sono 1920×1080, a 24 FPS, con **94 fotogrammi decodificati per clip: 6.580 nuovi fotogrammi**, per 193.629.410 byte. Le copie con il nome originale e quelle canoniche conservano gli stessi byte e SHA-256 delle sorgenti Desktop.

I 665 video precedenti risultano identici, senza sostituzioni o rimozioni nella cartella Front. Le cancellazioni separate degli small sprite nel checkout Desktop non fanno parte dell'importazione. Sono aggiunti anche i cinque PNG ufficiali 133 e 135–138. Il PNG 134 fornito è una ricodifica: cambia l'impronta del contenitore, mentre tutti i 4.194.304 pixel RGBA sono identici. Le animazioni precedenti della forma 134 restano intatte.

Il catalogo grafico comprende **200 ID reali**, dei quali **110 giocabili e 90 senza dati di gioco**. Le serie animate diventano **147**: gli ID 1–145, 149 e 150. Le nuove forme sono anteprime del laboratorio `#arkamon-lab`; non vengono inventati nomi, mosse, tipi, statistiche, incontri o evoluzioni. Gli ID senza video restano statici.

## Scala, colore e fotogrammi

Le nuove serie usano fin dalla prima conversione la sagoma opaca iniziale come riferimento di scala. Il corpo mantiene la dimensione del ritratto ufficiale dentro il viewport 192×192; un canvas trasparente esterno conserva le escursioni delle animazioni e degli effetti. Camera, scala e appoggio rimangono costanti nelle cinque azioni. Le forme 149 e 150 sono ampie in orizzontale: il riferimento ufficiale mantiene la loro proporzione senza allungarle verticalmente.

Tutti i frame nativi restano nello stesso ordine e alla frequenza originale. Nessuna interpolazione, ripetizione per raggiungere 96 frame o posa finale sintetica. Le particelle e i finali KO senza corpo sono conservati. Il poster corrisponde esattamente al primo frame dell'atlante.

Tutte le sorgenti nuove hanno fondale verde. Per la sola attesa degli ID **132, 133, 135 e 136** si applica il profilo esistente di conservazione dei gradienti verdi interni. Le altre azioni mantengono il keying conservativo: estendere il recupero dei verdi ad effetti e dissolvenze ne alterava il colore. Gli ID **137 e 138** mantengono il profilo conservativo in tutte le azioni: nel primo il recupero accentuava frammenti verdi ambigui intorno alla testa, nel secondo rendeva verde il nucleo della sfera. Rimane una lieve desaturazione di alcuni gradienti verdi, senza ridisegnare pixel o cambiare i colori per ipotesi.

Il loop di attesa della forma **137** ha un rapporto diagnostico di discontinuità 3,345 e viene aggiunto alla coda di revisione, ora di 14 elementi. Il confronto dell'originale mostra una variazione di posa già fra ultimo e primo frame. La forma **150** include nel KO un campo di luce e particelle con limite rettangolare presente nella sorgente; viene preservato, senza ritagliare effetti o ricostruire un finale diverso. Questi limiti delle sorgenti sono documentati separatamente dagli errori di importazione.

I 28 marker di attacco e reazione sono scelti su fotogrammi originali consecutivi a base zero e controllati da un secondo revisore. Non implicano l'assegnazione di mosse. La revisione visiva delle 70 clip campiona frame 0/47/93 su sfondo chiaro e scuro, oltre alle pose iniziali nel viewport e ai frame dei marker; non è un'ispezione manuale di tutti i 6.580 frame.

## Dati runtime e verifiche

Il catalogo complessivo contiene **735 clip, 70.175 fotogrammi e 7.610 pagine**. Le 675 pagine nuove conservano tutti i pixel visibili e gli alpha degli atlanti; ogni pagina resta entro 16 MiB decodificati.

L'indice runtime raggruppa le voci per forma, vista e azione. Quando tutte e cinque le azioni condividono esattamente dimensioni, conteggi e griglia, conserva un solo contratto e un unico blocco di impronte, ricostruendo le cinque sequenze senza perdere bit. I casi storici con conteggi diversi, pagine irregolari, percorsi legacy, PNG o viste parziali mantengono il formato esplicito. Le pagine sono disponibili già alla prima selezione sincrona. Il confronto dell'intero catalogo verifica percorsi, estensioni, geometria e ordine dei frame. L'indice misura **32.411 byte gzip**, entro il limite invariato di 32 KiB.

La baseline di preservazione è acquisita **dopo** l'aggiunta dei PNG forniti: comprende 665 clip, 8.265 file nativi precedenti e i 200 PNG attuali, per 8.465 file. Non viene presentata come prova che il contenitore precedente di 134 sia invariato; la sua ricodifica e l'identità dei pixel sono registrate separatamente.

Le verifiche definitive di preservazione, unità e browser sono in corso. La provenienza dettagliata e gli esiti verranno registrati in `animation-source/audits/front-2026-11-05.json`. I log locali sono in `output/animation-import-2026-11-05/`.

L'importazione è locale. Nessun push, deploy o nuovo installer desktop viene dichiarato senza la corrispondente operazione. Le prove sul compilato utilizzano soltanto le copie locali con impronte corrispondenti alla revisione immutabile; non certificano la disponibilità del CDN.
