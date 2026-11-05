# Animazioni frontali aggiunte il 4 novembre 2026

## Fonti e destinazione

L'utente ha fornito **85 nuovi video**, cinque azioni per ciascuno degli ID **117–131, 134 e 139**, nella cartella `public/sprites/animation/Front` del checkout Desktop. Le azioni sono attesa, attacco, reazione al colpo, vittoria e KO. Tutti i video sono 1920×1080, a 24 FPS, con **94 fotogrammi decodificati ciascuno: 7.990 in totale**, per 233.407.449 byte di sorgenti.

Il confronto SHA-256 trova i 580 video precedenti identici, senza sostituzioni o rimozioni nella cartella Front. Le 110 cancellazioni di small sprite presenti separatamente nel checkout Desktop non fanno parte di questa importazione e non vengono propagate. I video nuovi erano file locali non registrati in quel checkout; le copie con il nome fornito e le copie canoniche vengono conservate byte per byte nel checkout di lavoro.

Le nuove forme hanno già sprite frontali, ma non dati di gioco. Rimangono anteprime grafiche del laboratorio `#arkamon-lab`, senza inventare nomi, tipi, statistiche o mosse e senza introdurre incontri, evoluzioni o nuove definizioni giocabili. Gli ID senza file o video non diventano forme artificiali. Il catalogo grafico conserva 195 ID reali, dei quali 110 giocabili e 85 da definire; le serie animate passano da 116 a **133**.

## Conservazione e riproduzione

Ogni video conserva tutti i fotogrammi decodificati, nello stesso ordine e alla frequenza originale: nessuna interpolazione, ripetizione per raggiungere 96 frame o posa finale sintetica. Il KO conserva il finale reale, compresi fumo, particelle o fotogrammi senza corpo. Il poster corrisponde al primo fotogramma nativo non vuoto.

Il primo confronto nel laboratorio ha rilevato una scala insufficiente per nove forme: **118, 119, 122, 123, 124, 128, 129, 130 e 131**. Le particelle della posa di attesa allargavano i bounds e riducevano il corpo. Le nove serie sono state riconvertite usando la sagoma iniziale opaca come riferimento, con il comando esistente `--fit-initial-body`. La dimensione del corpo corrisponde così al ritratto ufficiale nel viewport, mentre un canvas trasparente più ampio conserva tutti gli effetti. La calibrazione iniziale della camera e la scala rimangono costanti nelle cinque azioni. Nuovi controlli verificano che l'altezza del corpo raggiunga almeno il 95% del riferimento, tenendo conto del limite di larghezza. I primi test superati prima di questa correzione sono conservati come storico, senza presentarli come verifica dei media definitivi.

Le serie 123, 124 e 127 usano un fondale blu; le altre usano il verde. La scala e il punto di appoggio derivano dalla posa di attesa e restano costanti durante ciascuna clip. Il canvas trasparente esterno al viewport conserva le escursioni degli effetti. I marker di attacco e reazione sono indici originali a base zero, scelti esaminando fotogrammi consecutivi della sorgente, senza attribuire loro una mossa di gioco.

Per la sola attesa degli ID 130, 131 e 134 si applica un profilo esplicito che conserva i gradienti verdi all'interno della sagoma. Il profilo esclude bordi, zone trasparenti e dissolvenze a bassa copertura. Le aperture fra le piume e le ali della forma 131 sono spazi negativi presenti anche nello sprite ufficiale e restano trasparenti. Estendere questo recupero alle altre azioni alterava il colore di sfere, scie e rune: attacco, colpo, vittoria e KO mantengono quindi il keying conservativo. Su quelle azioni può rimanere una desaturazione dei verdi sovrapposti al fondale, limite documentato senza inventare colori o disegnare nuovi pixel. Nel KO della forma 121 il video originale mescola il finale al verde: la lieve dominante residua della dissolvenza resta visibile, conservando il fotogramma reale.

La serie 117 usa la compressione WebP lossless di livello 1; le altre sedici serie definitive usano il livello 0, più rapido e verificato sugli stessi pixel RGBA. Il livello modifica dimensione e tempo di codifica, senza perdere fotogrammi o qualità. Le pagine runtime vengono ricodificate e confrontate separatamente con l'atlante.

I cicli di attesa 124 e 125 conservano una discontinuità già presente nelle sorgenti: nella forma 124 cambia bruscamente la fase delle piccole scariche; nella forma 125 la testa torna alla propria inclinazione iniziale. Il confronto degli originali 91–93/0–2 conferma il limite. Anche la forma 134 supera di poco la soglia diagnostica del loop: il confronto mostra piccole differenze di fase del corpo e delle gocce, con posizione e posa generale stabili. Tutte e tre entrano nella coda di revisione, distinguendo le due discontinuità più visibili dalla variazione più sottile della forma 134. Non vengono eliminati fotogrammi, aggiunte interpolazioni o alterate le durate per mascherarle.

L'indice runtime condivide capacità e colonne delle pagine uniformi, conservando il formato esplicito per le geometrie storiche irregolari. Le sequenze di impronte dei nomi WebP vengono codificate come un unico blocco binario in base64url; i nomi storici e le combinazioni PNG/WebP mantengono i token espliciti. Ogni impronta viene ricostruita bit per bit. I percorsi, le estensioni, i frame e le dimensioni decodificate restano esatti; l'ultimo frammento mantiene il proprio conteggio nativo. Il limite di 32 KiB compressi dell'indice e quello di 16 MiB decodificati per pagina restano invariati.

## Verifiche e pubblicazione

L'audit indipendente finale, ripetuto dopo la correzione della scala, è superato: **580 clip storiche profondamente identiche e 7.620 file invariati per byte e SHA-256**. Le 85 nuove clip conservano tutti i 7.990 frame; le **670 pagine aggiunte** superano il confronto di tutti i pixel visibili e degli alpha durante la generazione e i controlli indipendenti delle impronte, dei primi/ultimi frame, dei poster e delle celle inutilizzate. Il catalogo complessivo comprende **133 forme, 665 clip, 63.595 fotogrammi e 6.935 pagine**. L'indice runtime compresso misura **30.077 byte**, entro il limite di 32 KiB. Le 270 pagine intermedie sostituite dalla correzione della scala sono rimosse soltanto dopo il confronto delle impronte e la verifica che nessuna appartenga alla baseline storica.

La revisione visiva indipendente copre tutte le 85 clip definitive, nei frame 0/47/93 su sfondo chiaro e scuro: 255 frame campionati, 510 composizioni. Per le nove serie ricalibrate sono stati ripetuti 135 campioni e 45 confronti delle pose iniziali con il ritratto ufficiale nel viewport. Non è una visione manuale di ogni fotogramma. Le impronte degli 85 atlanti pubblici corrispondono a quelli esaminati.

| Controllo definitivo | Esito |
|---|---|
| Conservazione delle fonti e della baseline | Superato: 580 clip e 7.620 file precedenti invariati, tutte le 85 clip nuove e i 7.990 frame verificati, zero errori. |
| Suite unitaria completa | **5.878/5.878 test, 183 file**, codice 0 dopo la correzione della scala. Include 45 contratti del corpo per i nove set. |
| Convertitore Python | **43/43**, comprese conservazione dei verdi, esclusione delle altre azioni e compatibilità delle impostazioni precedenti. |
| Contratti Node e controlli di sicurezza | **26/26** contratti e **9/9** controlli di sicurezza. |
| Catalogo degli sprite e TypeScript | Superati; 195 ID grafici, 85 senza dati di gioco. |
| Browser sorgente desktop/mobile | **68/68**, in 6,1 minuti, due processi, zero retry, esclusioni o flaky. Tutte le 17 forme, cinque azioni, marker, finale KO, pagine, cache e laboratorio reale. |
| Build di produzione | Codice 0; **741,2 MiB**, sotto il limite di 900 MiB. |
| Budget di avvio | Superato: ingresso 469.597 byte, JavaScript iniziale 729.546 byte, CSS 76.721 byte. |
| Scenari generali sul compilato | **3/3**, zero retry o esclusioni: sei schermate di gestione, creazione/ripristino partita e profilo broadcast separato. |
| Animazioni e ritratti sullo stesso compilato | **32/32**, in 5,6 minuti, due processi paralleli, zero retry, esclusioni o flaky. |
| Legame delle 32 prove con l'artefatto | `readPassingReport` superato contro l'impronta ricalcolata dell'intero compilato invariato. |

La revisione immutabile dei media è `2cb251da0753c53e5a328b1f550abdfb6a6a0318`; l'impronta canonica del manifest è `229b6a9de77f5324b3a6ce23d19bb26c4c7c29b101db0049cf5b20064e858855`. I PNG senza dati conservano l'impronta `2fab12a90fccffa6acb2ec8844b001d0177a549997605ae5ed5f80da3217bb69`. Il compilato ha impronta di contenuto `1d7cf78c4be0b621b650ff2a449468ed2d0b1bb7177279b95868131ea7570897`.

Confronti reali delle versioni definitive: [forma 123](ui-previews/native-2026-11-04/123-native-comparison.png), [forma 131](ui-previews/native-2026-11-04/131-native-comparison.png), [forma 139](ui-previews/native-2026-11-04/139-native-comparison.png). I primi esiti browser precedenti alla correzione della scala rimangono conservati separatamente e non vengono usati come prova dei media definitivi.

La baseline e i log dettagliati sono in `output/animation-import-2026-11-04/`; la provenienza e gli esiti definitivi sono registrati in [front-2026-11-04.json](../animation-source/audits/front-2026-11-04.json). Le prove del compilato sostituiscono soltanto il trasporto dei file della revisione esatta e verificano byte e SHA-256. Non certificano la disponibilità online del CDN. Nessun push, deploy o nuovo installer desktop è stato eseguito per questa importazione.

La verifica comprende l'intera suite unitaria e gli scenari browser indicati; non è una nuova esecuzione di tutta la raccolta E2E del progetto né un collaudo manuale completo della partita. Non viene creata una ricevuta di pubblicazione dell'intero progetto usando soltanto i 68 scenari di questa importazione.
