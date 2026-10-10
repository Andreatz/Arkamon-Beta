# Audit di Arkamon — 10 ottobre 2026

L'audit copre motore e scene di battaglia, status, XP e Suprema, stato e salvataggi, laboratorio, mappe e progressione, deposito/evoluzioni, Admin e temi, animazioni/VFX/audio, votazioni del pubblico, dipendenze, build e configurazione desktop. Le regole concordate sono state conservate. Le proposte creative sotto sono un backlog, non funzionalità già implementate.

## Correzioni applicate

| Area | Problema | Comportamento corretto |
| --- | --- | --- |
| XP | Un KO di A per veleno/confusione o contraccolpo non premiava B, mentre il caso speculare premiava A. | Premio simmetrico soltanto per la transizione viva → KO; HP residui conservati e doppio KO da Suprema assegnato all'attaccante. |
| Pubblico | Un attacco votato marcato SUPREMA nel catalogo attivava raddoppio e contraccolpo impliciti. | Maggioranza/parità eseguono l'attacco normale. Il fallback automatico conserva il comportamento IA esistente. |
| Ripresa del voto | Un voto di un turno precedente poteva restare chiuso senza eseguire la mossa. Il recupero malformato perdeva informazioni del round. | Identità del turno validata; conservati priorità, lati già attivi, evoluzioni e messaggi, senza ripetere lo status. |
| Collegamento pubblico | Un rifiuto 403 dell'origine del gioco veniva interpretato come sessione terminata, perdendo la possibilità di chiuderla. | Sessione conservata con errore; chiusura riprovabile dopo la correzione della configurazione. |
| Salvataggi | Collezioni null, Set non iterabili, scena null, funzioni sostituite da JSON e Pokémon parziali potevano bloccare il gioco. | Recupero per campo, conservando identità/HP/status validi e le vere azioni dello store. Nodo rimosso ricollocato all'ingresso; battaglia incompleta torna alla mappa. |
| Mappa principale | Le azioni dello store restavano consentite durante una battaglia, diversamente dalle mappe locali. | Movimento, interazione e passaggio turno bloccati finché lo scontro è attivo. |
| Temi | Scale UI zero o rettangoli senza dimensioni positive rendevano invisibile l'interfaccia. | Importazione rifiutata con messaggio; UI persistita fuori limiti recuperata. |
| Audio | Audio OFF e cambio scena lasciavano attivi i toni Web Audio già programmati. | Toni correnti/futuri interrotti e nodi liberati; cambio scena rimuove la melodia precedente. |
| Editor layout | Trascinamento restava in ascolto dopo annullamento tocco, perdita focus o smontaggio. | Pulizia completa dei listener e isolamento del dito che ha iniziato il trascinamento. |
| Admin | Pannello tagliato in ritratto, ID duplicato dei preset, riferimento a un asset eliminato e rifiuto appunti non gestito. | Editor ancorato allo schermo; variante Notte Viola morbida distinta; fallback Venezia; messaggio con alternativa Scarica e campi JSON accessibili. |
| Titolo | Sfondo personalizzato mancante nascondeva anche lo sfondo di riserva; nuova partita sostituiva subito un salvataggio. | Sfondo predefinito ripristinato e conferma prima di sostituire i progressi. |
| Caricamento | Laboratori e griglia legacy erano inclusi nel caricamento iniziale. | Moduli caricati quando vengono aperti, con messaggio durante l'attesa. |
| Manutenzione | Documentazione dichiarava Vite5/Node18, HP ripristinati e status ancora da creare. | README e contesto aggiornati, differenze storiche VBA esplicite. |

La prima ipotesi di salto del secondo giocatore dopo un'interazione è stata scartata leggendo la UI: la mappa mostrava già il turno successivo. Non è stata modificata quella regola.

## Verifica ed evidenza

- Baseline prima dell'audit: **1.643/1.643 test**, 80 file.
- Suite dopo le correzioni: **1.683/1.683 test**, 85 file, comprese nuove regressioni per salvataggi, KO, checkpoint, temi, audio e trascinamento.
- TypeScript e build web di produzione verificati; il riepilogo finale della consegna riporta anche lo stato dei controlli remoti.
- Nuova partita in browser reale isolato: nomi, due starter diversi, arrivo alla mappa, passaggio a G2, ricarica e annullamento del reset. Nessun errore JavaScript o asset mancante in questo flusso.
- Battaglie nel browser con fixture sintetiche: KO da veleno A 1→0, B 14→15 mantenendo 5 HP; Suprema con A KO per contraccolpo, B 40→41 mantenendo gli HP dopo il colpo. Ricarica e sostituzione preservano risultato e non ripetono XP/status. Dadi non forzati; movimento ridotto in queste due prove.
- Admin nel browser: tema con scala zero rifiutato; appunti bloccati gestiti; sfondo intenzionalmente inesistente usa il video predefinito. La prova in ritratto ha individuato e corretto il taglio dell'editor nel contenitore 16:9: ora il pannello usa l'intero schermo e campi/pulsanti sono raggiungibili a 390 pixel.
- **6.393 riferimenti asset** verificati, comprese maiuscole/minuscole e percorsi derivati dagli ID; nessun riferimento mancante dopo la correzione Admin. La fotografia cancellata dall'utente resta cancellata nella sua copia.

Il browser integrato dell'app non si è avviato per un errore interno del percorso del kernel. Le prove sono state effettuate con browser reali headless, attraverso Playwright e contesti nuovi. Non sono prove sui telefoni fisici o sulla versione online. Nessun salvataggio abituale è stato sostituito.

Non è stata giocata l'intera campagna dall'inizio a Roma. Le mappe/progressione sono coperte da revisione e test dei dati. Non è stato compilato un nuovo installer Tauri, ascoltato ogni suono o osservata ogni animazione. La nuova pubblicazione del servizio pubblico resta separata: le PR delle votazioni sono ancora bozze e una build locale non equivale a una release distribuita.

## Prestazioni e lavori ancora aperti

I file tracciati esistenti di `public` sono **6.942**, per **3.067.626.367 byte = 2,86 GiB**. È il contenuto distribuito, non il download iniziale della pagina. I 25 nuovi video grezzi delle specie 15–19, ancora non tracciati e non integrati nel manifest, sono esclusi dalla misura e sono stati preservati.

- La libreria originale dei suoni occupa circa 1 GB; i 41 clip selezionati del gioco occupano circa 656 KB. Distinguere l'archivio di lavoro dal materiale della release ridurrebbe la distribuzione senza cancellare originali.
- Gli 80 atlanti frontali attivi per 16 specie occupano circa 591 MiB compressi. Un atlas7680×7680 richiede circa 225 MiB come RGBA decodificato; un ImageBitmap può aggiungere memoria. La cache è già limitata, ma dividere gli atlanti in pagine più piccole migliorerebbe caricamento e uso sui dispositivi meno potenti, mantenendo frame/FPS/trasparenza.
- Il modulo principale compilato resta circa 1,32 MB prima della compressione, circa 207 KB gzip. Caricare i laboratori a richiesta è un primo passo; dati, Admin e scena battaglia richiedono ulteriore separazione.
- Dopo gli aggiornamenti compatibili di PostCSS/Vitest e dipendenze transitive, l'audit delle dipendenze registra **0 problemi sulle dipendenze di produzione** e **11 segnalazioni sugli strumenti di sviluppo**:8 alte, 2 moderate, 1 bassa. Le restanti riguardano soprattutto la catena Tailwind/gh-pages/Sharp. Non è stato usato un aggiornamento forzato: le migrazioni che cambiano versione principale richiedono verifica specifica di CSS, pipeline media e distribuzione.
- Il workflow Pages rimane presente. Con il repository privato e il piano rilevato in precedenza l'hosting non era disponibile; il repository resta privato per scelta dell'utente. La disponibilità attuale di un nuovo piano non è stata verificata in questo audit.
- La scena battaglia concentra oltre 2.300 righe; `gameStore` contiene stato, ripristino, navigazione e attività. Separare risoluzione del turno, ricompense e presentazione ridurrebbe il rischio di nuove asimmetrie.
- La specifica STAB/valutazione IA differisce fra documenti VBA e nomi usati nel motore. Non è stato cambiato il bilanciamento; occorre una tabella condivisa delle regole prima di rivedere le scelte dell'IA.

## Miglioramenti consigliati in ordine

Aggiornamento successivo all’audit: gli interventi della tabella, eccetto **release degli asset e atlanti a pagine**, sono stati sviluppati. Vedi [guida d’uso](./player-tools.md) e [verifica dell’integrazione](./improvements-audit-2026-10-10.md). Le idee del brainstorming sotto restano un backlog distinto; il registro/replay e le tappe configurabili sono compresi in questo incremento.

| Priorità | Intervento | Risultato concreto |
| --- | --- | --- |
|1| Backup/esportazione partita con versione e ripristino guidato | Una pulizia del browser o un cambio computer non perde la campagna; recuperi segnalati invece che silenziosi. |
|1| Release degli asset e atlanti a pagine | Download/distribuzione più snelli e minore pressione sulla memoria. Integrare i 25 nuovi Front con la pipeline alpha e una verifica visiva dedicata. |
|1| Editor delle interazioni locali | Selezionare un pallino e assegnare dialogo, requisito, incontro o ricompensa senza modificare il codice. Numeri solo nell'editor. |
|2| Diario individuale e riepilogo del turno | Due azioni rimaste, attività completate, palestre e prossimo obiettivo sempre leggibili. |
|2| Registro esplicativo della battaglia | Mostrare dado, base, efficacia, Suprema, status e contraccolpo; spiegare un risultato senza anticipare il KO. |
|2| Test regolari di flusso e accessibilità | Nuova partita, ricarica durante battaglia/voto, deposito e Admin coperti da browser in CI, oltre ai test puri. |
|3| Audio distinto e velocità animazioni | Volumi separati musica/effetti, velocità normale/rapida e movimento ridotto conservando l'ordine di rivelazione. |
|3| Scena battaglia e dati mappe modulari | Modifiche future più piccole e indipendenti; regole consolidate e test dei confini fra scena e store. |

## Brainstorming di funzionalità e interattività

1. **Missioni brevi collegate alle città.** Un NPC propone una scelta o chiede un oggetto ottenibile in un'altra città. Stato per giocatore, conseguenze visibili e possibilità di aiutarsi o ostacolarsi. La regola delle due azioni resta intatta.
2. **Pubblico come fazione del rivale.** Prima del combattimento vota uno stile (aggressivo, difensivo, status), durante il combattimento sceglie la mossa, dopo vede quante decisioni ha influenzato. Eventuali poteri speciali hanno limiti espliciti; nessuna Suprema nascosta.
3. **Sondaggi evento sulla mappa.** Il pubblico sceglie fra due eventi definiti: mercante, sfida, indizio o bonus circoscritto. La regia apre il voto in momenti precisi evitando interruzioni continue.
4. **Schermata spettatori per proiezione/OBS.** QR dei due canali, nomi, squadre, HP, turno e medaglie; controlli Admin separati. Permette la registrazione di una partita e rende chiara la partecipazione del pubblico.
5. **Bestiario/Arkadex.** Forme scoperte, animazioni già disponibili, tipi e mosse incontrate, statistiche personali. Le informazioni non ancora scoperte possono restare nascoste.
6. **Scambi e contratti fra giocatori.** Scambio di creature/oggetti, prestiti o collaborazione su una missione con conferma delle due parti; inventari separati e operazione atomica.
7. **Sfide cooperative occasionali.** Entrambi affrontano un incontro definito o contribuiscono a un obiettivo comune, con ricompensa per partecipazione. Serve una specifica dedicata per turni e vittoria.
8. **Replay e cronaca del match.** Registro dei dadi reali, mosse, status, XP e voti per rivedere una battaglia. La riproduzione registra i risultati già avvenuti e non ritira i dadi.
9. **Sfide a seed e modalità evento.** Scenario breve con squadre prestabilite per una serata o torneo. Classifica distinta dalla campagna e salvataggi indipendenti.
10. **Esplorazione e segreti.** Indizi raccolti nel diario sbloccano dialoghi o percorsi opzionali. Il Percorso 15 conserva la condizione già concordata; contenuti e premi devono essere definiti dall'utente.

Il primo incremento consigliato è **editor interazioni → diario → eventi del pubblico**: riutilizza le mappe e i QR già presenti e aggiunge varietà senza cambiare il motore di combattimento.

## Strumenti gratuiti utili

Le caratteristiche sono state controllate sulle fonti ufficiali il 10 ottobre 2026. Le colonne di applicazione sono proposte specifiche per Arkamon, non integrazioni già effettuate.

| Strumento | Applicazione proposta | Fonte ufficiale |
| --- | --- | --- |
| Tiled | Importare le mappe come immagini, collocare oggetti/punti con proprietà personalizzate ed esportare JSON verso un adattatore del gioco. Non richiede trasformare le mappe in griglie. | [Editor libero](https://www.mapeditor.org/), [proprietà](https://github.com/mapeditor/tiled/blob/master/docs/manual/custom-properties.rst) |
| Squoosh | Confrontare qualità/peso di mappe e sfondi WebP/AVIF prima della release, conservando gli originali. | [Progetto ufficiale](https://github.com/GoogleChromeLabs/squoosh) |
| FFmpeg | Automatizzare conversione, dimensioni e analisi dei nuovi video; già coerente con la pipeline esistente. | [Funzioni](https://ffmpeg.org/about.html), [licenze](https://www.ffmpeg.org/legal.html) |
| Audacity | Normalizzare volumi e preparare effetti/loop musicali senza differenze improvvise di intensità. | [Software gratuito e open source](https://www.audacityteam.org/) |
| Inkscape | Creare segnalini status, icone interazione, medaglie e QR frame vettoriali che restano nitidi a scale diverse. | [Editor libero](https://inkscape.org/?lang=en) |
| OBS Studio | Proiettare o registrare il gioco, aggiungere una pagina spettatori e visualizzare i QR tramite sorgente browser. | [Software gratuito](https://obsproject.com/), [Browser Source](https://obsproject.com/kb/browser-source) |
| Playwright | Rendere ripetibili i flussi reali di nuova partita, KO, ricarica e votazione su browser diversi. | [Documentazione](https://playwright.dev/docs/intro) |
| axe-core | Affiancare ai test di flusso controlli automatici su nomi accessibili, contrasto e struttura; resta necessaria verifica manuale. | [Motore open source](https://github.com/dequelabs/axe-core) |

Per il maggior beneficio immediato sceglierei Squoosh/FFmpeg per gli asset e Playwright per le regressioni. Tiled è utile se preferisci preparare i contenuti delle mappe in un editor esterno; un editor Admin interno può invece riusare direttamente la numerazione attuale.
