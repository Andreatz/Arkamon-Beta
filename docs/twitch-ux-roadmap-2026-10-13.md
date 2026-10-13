# Arkamon: UX e roadmap per le live Twitch

Questa è una proposta di prodotto, separata dalle correzioni dell'[audit](project-audit-2026-10-13.md). Nessuna delle modalità nuove sotto è stata attivata. Font iniziali, kit SVG confermato, front ufficiali e grafica delle mosse sono la base visiva da mantenere.

## La priorità di prodotto

Il gioco ha già strumenti ricchi: sei schermate del giocatore, città e percorsi, inventario/negozi, diario, cronache, sfide a seed e Fanta, due canali di voto. Aggiungere un altro pannello non risolve la difficoltà di seguirlo in live. Lo spettatore deve riconoscere rapidamente **chi agisce, qual è l'obiettivo, quale scelta può influenzare e cosa è appena successo**.

Le misure reali nelle schermate mostrano HP a 12 px, nomi delle mosse a 16 px, effetti a 14 px e spiegazioni a 13 px. Una cattura 1920 ridotta a 960 pixel li porta rispettivamente a 6, 8, 7 e 6,5 px; a 360 pixel, circa 2,25–3 px. È una trasformazione geometrica della cattura, non una misura della compressione o del player Twitch. Dimostra che una schermata gestionale completa non può diventare leggibile su telefono soltanto adattando le sue dimensioni.

## Tre superfici, un'unica partita

| Superficie | Contenuti principali | Comandi |
| --- | --- | --- |
| Regia/giocatori | Tutte le informazioni consentite, gestione squadra e oggetti, dadi, stato salvataggio/servizio, controllo della puntata | Autorizzati e protetti; un solo scrittore della campagna |
| Trasmissione OBS | Giocatore attivo, luogo, obiettivo, creature e HP/status, apertura voto e risultato, ultimo fatto rilevante | Sola lettura, nessuna password o capacità di regia |
| Telefono pubblico | Canale scelto, tre mosse con effetto breve, tempo, conferma del proprio voto e risultato | Una scelta modificabile per membro/turno; nuova autenticazione solo se decisa per una modalità competitiva |

La prima vista OBS dovrebbe funzionare in una finestra distinta a 1920×1080, con preset per la webcam e aree di rispetto. Stessi asset, meno informazioni simultanee e testi principali da provare a 960 pixel. Un preview del layout dentro la regia aiuta a verificare ingombri; la prova vera resta la fonte OBS e un telefono.

## Cambi UX ad alto impatto

| Intervento | Specifica concreta | Criterio di riuscita proposto |
| --- | --- | --- |
| Gerarchia del turno | Una fascia stabile «Tocca a G1 — 1 movimento oppure interazione»; durante voto mostrare chiaramente l'attesa | Cinque spettatori nuovi identificano chi deve agire e quale fase è in corso entro cinque secondi |
| Conseguenze dei comandi | Costo e consumo del turno vicino a acquisto/oggetto/interazione; motivo visibile dei comandi indisponibili | Il giocatore anticipa la conseguenza senza aprire un manuale |
| Mappa comprensibile | Posizione di entrambi, luoghi raggiungibili, attività già usate e obiettivo attuale; legenda espandibile | Un nuovo giocatore distingue movimento e interazione al primo tentativo |
| Scheda tattica | Per mosse/specie conosciute: tipo, range del tiro e bonus, effetto cura/status, possibile conseguenza del cap; probabilità solo derivate dal motore | Numeri verificabili contro il motore; nessuna informazione di specie sconosciute |
| Squadra e deposito | Badge di stato e ruolo, spazio occupato, filtro e fascia di livelli compatibile prima dello scambio | Una riserva utile si trova senza provare più scambi rifiutati |
| Esito del turno | Scheda breve «dadi → bonus → efficacia → danno», poi HP/KO; il registro offre il dettaglio | Spettatore comprende il risultato anche con audio spento |
| Ritmo della live | Regia decide quando chiudere un recap; evitare finestre decorative che richiedono un clic dopo ogni fatto | Ridurre il tempo tra due decisioni senza accorciare il tempo necessario al voto |
| Stato del servizio | Apertura, votazione, chiusura, risultato confermato, interruzione e fallback distinti | Nessun «0 secondi» ambiguo; recupero senza nuovo tiro o doppio effetto |
| Entrata tardiva | Card «Finora»: giocatori, obiettivo, medaglie e ultimo evento dal registro | Chi entra a metà puntata sa cosa sta guardando senza chiedere in chat |

Per il voto, partire da una durata proposta di 25–30 secondi **da provare**, regolabile prima del round. Non è un valore garantito e non va applicato ai round già aperti. Misurare ritardo video, tempo per inquadrare il QR e tempo per leggere le mosse; poi scegliere la durata. Twitch descrive Low Latency come riduzione del ritardo, non sincronizzazione perfetta fra tutti gli spettatori. [Low Latency](https://help.twitch.tv/s/article/low-latency-video?language=en_US), [effetti del ritardo di trasmissione](https://help.twitch.tv/s/article/how-to-add-stream-delay).

## Funzioni e modalità

Le durate sono obiettivi di design da validare con playtest, non tempi già misurati. Bassa/media/alta indica la complessità relativa, non una stima in giorni.

| Proposta | Partecipazione del pubblico e ciclo della puntata | Complessità e condizioni |
| --- | --- | --- |
| **Missione della puntata** | Obiettivo visibile, tappe cittadine e recap finale. Pubblico sceglie fra 2–3 obiettivi preparati dalla regia | Media. Definire premi, costi e completamento; mai aggiungere attività a Percorso 15 senza specifica |
| **Sfida della settimana a seed** | Configurazione identica condivisa; prove autonome e finale in live, confronto delle strategie | Media. Riusa seed/versioni e campagna isolata; classifica pubblica richiede risultati verificati, non un punteggio dichiarato dal client |
| **Fanta Draft del pubblico** | Sei turni di scelta fra candidati entro 100 crediti; G1 sfida la squadra costruita dalla community | Media. Modalità distinta dal Fanta attuale, budget verificato dal server, timeout e scelte di riserva; obiettivo draft 5–8 minuti |
| **Gym Rush** | Tre o cinque scontri, cure limitate, punteggio per vittorie/azioni/HP. Il pubblico comanda i capipalestra | Media/alta. Squadra e risorse separate dalla campagna, regole versionate; obiettivo puntata breve 20–35 minuti |
| **Chat contro allenatore** | Serie al meglio di tre con squadre preparate e voto del rivale; risultato leggibile subito | Media. Nessun vantaggio acquistabile per la mossa; regia conserva dadi e avanzamento, pubblico le scelte disponibili |
| **Previsioni del pubblico** | Prima di un incontro: «vittoria?», «cattura?», «KO entro tre turni?». Risultato dal registro confermato | Media. Chiusura prima dell'informazione decisiva, annullamento se lo scontro viene interrotto. Integrare eventualmente Predictions Twitch, separandole dalle monete della campagna |
| **Spedizione cooperativa** | I due giocatori percorrono tappe preparate, alternano sfide e risorse; pubblico decide bivi o nemici | Alta. Inventario condiviso, turni e premi da definire; una sessione distinta evita modifiche implicite alla campagna |
| **Raid della community** | Boss in fasi, traguardi di partecipazione e contributi visibili; pubblico controlla il boss o una squadra | Alta. Stato autorevole, cap dei partecipanti, ingresso tardivo e riconnessione; prima prova breve con numero limitato di persone |
| **Arena dei creator** | Due creator e le rispettive community; draft e incontri con tabellone/recap | Alta. Autorizzazioni per ruoli, scelta simultanea se prevista, calendario e disconnessioni; non riusare alla cieca il PvP locale |
| **Eventi della community** | Bivi narrativi, nome di una creatura o dialogo, tema cosmetico della puntata | Bassa/media. Proposte moderate e confermate dalla regia; punti canale opzionali per cosmetica, senza aumentare peso dei voti di combattimento |
| **Album e highlight** | Ritratto ufficiale, luogo di cattura e fatto memorabile; card condivisibile dal recap | Bassa/media. Dati pubblici, nome moderato e nessuna creatura ancora sconosciuta; riusa Arkadex e registro |

Le scelte più promettenti per la prima iterazione sono **vista trasmissione + esito del turno + missione della puntata**, poi **seed settimanale e Fanta Draft**. Raid e Arena richiedono più coordinamento e vanno dopo una prova di carico e una gestione robusta delle disconnessioni.

## Twitch e architettura

Mantenere i due QR attuali come ingresso universale. Una futura connessione Twitch può aggiungere identità, comandi moderati, riscatti cosmetici e annunci di poll/previsioni; va progettata con i permessi effettivi del canale. Non occorre partire da un'Extension per dare valore al pubblico: il telefono e la fonte OBS possono essere sviluppati prima.

Twitch EventSub fornisce notifiche di eventi, comprese quelle dei riscatti punti canale. Il servizio deve verificare provenienza/firma, deduplicare gli ID e conservare un esito per ciascun evento: Twitch può consegnare lo stesso evento più volte. Le chiamate devono proporre comandi al motore e alla regia, non scrivere direttamente i dadi o il salvataggio. [EventSub](https://dev.twitch.tv/docs/eventsub/), [verifica e duplicati](https://dev.twitch.tv/docs/eventsub/handling-webhook-events/).

I risultati di poll e Predictions hanno cicli propri e notifiche di inizio/progresso/fine. Vanno collegati all'identità della puntata e al risultato confermato del gioco; una ricarica non deve aprire un secondo evento o risolvere due volte una previsione. [Polls](https://dev.twitch.tv/docs/api/polls/), [Predictions](https://dev.twitch.tv/docs/api/predictions/).

Prima di cambiare il backend, eseguire prove con 20/100/500 telefoni simulati e conflitti di voto/scadenza. Un aggiornamento push dei risultati può ridurre letture ripetute, ma richiede snapshot di recupero e contatori di revisione. Uno schema con sessione, round e voti separati è una possibile evoluzione del JSON unico soltanto se i numeri mostrano la necessità.

## Ordine di sviluppo consigliato

1. **Live leggibile e recuperabile:** modello pubblico, fonte OBS, turno/obiettivo/esito grandi, ricongiungimento dopo reload. Conservare font e asset.
2. **Pubblico informato:** HP/status consentiti sul telefono, descrizione dei tre effetti, conferma della scelta, risultato finale e countdown calibrato sulla live.
3. **Ritmo di puntata:** recap iniziale/finale e missioni preparate; una partita conclusa lascia un risultato utile da condividere.
4. **Rigiocabilità:** seed della settimana, Fanta Draft e Gym Rush con regole autonome/versionate.
5. **Interazione Twitch:** EventSub/OAuth e moderazione; nessuna credenziale nel client o nella fonte OBS.
6. **Modalità comunitarie grandi:** raid e Arena solo dopo prove di carico, recupero e bilanciamento.

Misurare prima e dopo: tempo dal QR al primo voto valido, quota di votanti sul pubblico collegato, turni senza voti, tempo fra due decisioni, abbandono del draft, errori di caricamento/chiusura e riprese riuscite. Obiettivi iniziali: primo voto entro 20 secondi nelle condizioni di prova, tutti i risultati applicati una sola volta, dettagli principali leggibili a 960 pixel, cinque nuovi spettatori su cinque capaci di spiegare la fase corrente. Sono criteri proposti, non KPI già raggiunti.
