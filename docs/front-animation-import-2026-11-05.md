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

## Esiti definitivi

| Controllo | Esito |
|---|---|
| Preservazione indipendente | Superato: 665 clip precedenti profondamente identiche, 8.465 impronte della baseline verificate, 70 nuove clip e 6.580 frame, zero errori. |
| Suite unitaria completa | **6.334/6.334 test, 183 file**, codice 0, due processi. |
| Convertitore Python | **43/43**; il convertitore non è stato modificato per questa importazione. |
| Contratti Node e sicurezza | **12/12** contratti Node della verifica di rilascio e del budget; **9/9** controlli di sicurezza. I contratti del formato runtime sono inclusi anche nella suite unitaria. |
| Catalogo e TypeScript | Superati: 200 ID reali, 90 senza dati di gioco. |
| Browser sorgente desktop/mobile | **56/56**, in 5,1 minuti, due processi, zero retry, esclusioni o flaky. Tutte le 14 nuove forme e le cinque azioni, marker, KO, pagine, memoria e laboratorio reale. |
| Ritratti statici e filtri desktop/mobile | **10/10**, un processo, zero retry o esclusioni. Ritratti originali 205/184/206, errore e nuovo tentativo del PNG mancante, filtri degli ID realmente forniti. |
| Build di produzione | Codice 0; **742,3 MiB**, entro il limite di 900 MiB. |
| Budget di avvio | Superato: ingresso 469.597 byte, JavaScript iniziale 729.546 byte, CSS 76.721 byte. |
| Scenari generali sul compilato | **3/3**, zero retry o esclusioni: sei schermate di gestione, creazione e ripristino partita, profilo broadcast separato. |
| Animazioni e ritratti sullo stesso compilato | **46/46**, in 8,2 minuti, due processi, zero retry, esclusioni o flaky. Include 37 forme senza dati con animazioni, tre ritratti statici e i flussi nativi/VFX precedenti. |
| Prova delle 46 verifiche legata al compilato | `readPassingReport` superato contro l'impronta ricalcolata dell'intero artefatto invariato. |

La prima esecuzione unitaria ha rilevato un limite nel test che riuniva cinque repository Git temporanei sotto un'unica scadenza di 15 secondi. I casi sono ora indipendenti, con gli stessi controlli, la stessa scadenza e pulizia separata. Il primo giro browser ha avuto 54 prove superate e due interrotte dal riavvio Vite provocato dal pin dei media, confermato dai trace di connessione persa. L'intero gruppo di 56 prove è stato ripetuto dopo pin e build: la tabella riporta solo gli esiti definitivi. I log dei tentativi precedenti rimangono separati.

La revisione immutabile dei media è `a014a032479c7474417208d68e478a01d6757be1`; il manifest ha impronta canonica `4a99cfb416b9684259782b27b6ee9b0471c5529c35687778f483c5b6ed9ae487`. I PNG senza dati hanno impronta `851558327f3dac48b6783c167aa848838c59d510134749e4719c316db44e1f2e`. Il compilato verificato ha impronta di contenuto `5516abd3224c6c86c582924df5d80508324e8e9af78bb2185da9eaa2744b4caa`.

Confronti reali dell'attesa nel laboratorio, con il ritratto ufficiale a sinistra e l'animazione a destra: [forma 133](ui-previews/native-2026-11-05/133-native-comparison.png), [forma 138](ui-previews/native-2026-11-05/138-native-comparison.png), [forma 150](ui-previews/native-2026-11-05/150-native-comparison.png). Le pose cambiano durante il ciclo nativo, mentre scala e riferimento della camera rimangono costanti.

La provenienza completa e gli esiti sono registrati in [front-2026-11-05.json](../animation-source/audits/front-2026-11-05.json); i log e i report dettagliati locali sono in `output/animation-import-2026-11-05/`.

L'importazione è salvata in commit locali, senza push, deploy o nuovo installer desktop. Le prove sul compilato utilizzano soltanto le copie locali con byte e impronte corrispondenti alla revisione immutabile; non certificano la disponibilità del CDN. La verifica comprende l'intera suite unitaria e gli scenari browser indicati, senza essere una nuova esecuzione dell'intera raccolta E2E o un collaudo manuale completo della partita. Non viene creata una ricevuta di rilascio dell'intero progetto usando soltanto i test mirati dell'importazione.
