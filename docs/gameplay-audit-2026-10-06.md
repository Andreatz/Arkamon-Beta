# Verifica del flusso di gioco — 6 ottobre 2026

La verifica comprende prove pratiche nel browser, lettura del codice e test automatici sul branch `feature/vfx-recipe-engine`. Il gioco è stato provato nella build web di produzione su `http://127.0.0.1:3002/`, usando i controlli visibili tramite CUA. Per raggiungere i casi di stato, KO, contraccolpo ed evoluzione senza una lunga progressione casuale, è stata usata anche una pagina temporanea locale su `http://127.0.0.1:3003/`.

La pagina temporanea importa l'`App` e il motore reali dal repository. I suoi pulsanti preparano soltanto squadre, HP, stati e checkpoint iniziali; le azioni successive, i tiri, le animazioni, i salvataggi e le transizioni sono quelli del gioco. La casualità dei dadi non è sostituita. Questa pagina e la sua cache rimangono fuori dal repository, in `work/arkamon-qa`; il salvataggio della porta 3003 è separato da quello della porta 3002.

Verifica automatica: `npm test` ha superato **723 test in 58 file**; l'ultima esecuzione di `npm run build` è terminata con successo in 15,31 secondi, incluso il controllo TypeScript. Il controllo delle differenze non segnala errori di spaziatura. La verifica interattiva è completata per i passaggi elencati in questo report; i log del browser controllati non contengono errori o avvisi.

## Difetti corretti

| Passaggio | Difetto | Comportamento corretto |
| --- | --- | --- |
| Scelta starter | Il ricaricamento ripristinava gli starter già scelti; clic ripetuti potevano aggiungere un terzo Pokémon | Scelta atomica nello store, disponibilità derivata dalle squadre salvate, completamento del Rivale una sola volta |
| Ripresa dal titolo | Continua saltava alla mappa anche con un solo starter | Riprende il laboratorio quando la scelta è incompleta |
| Schermi stretti | Modulo dei nomi e starter potevano uscire dallo schermo senza scorrimento | Laboratorio scorrevole, griglia fluida e schede compatte sui piccoli schermi |
| Salvataggi parziali | Il caricamento assumeva la presenza di entrambi i giocatori e di tutti i nuovi campi | Campi mancanti recuperati dai valori predefiniti |
| Percorsi | Gli allenatori presenti nei dati non comparivano nella schermata normale | Controlli per sfidare gli allenatori, incluso il Rivale; squadre KO e allenatori già sconfitti non avviano scontri |
| Griglia | Azioni a distanza, su altra mappa o senza azioni disponibili | Controlli di adiacenza, mappa e disponibilità prima della modifica dello stato |
| Incontri | Il d6 modulo quattro o cinque rendeva alcuni livelli più frequenti | Livello estratto uniformemente nel range dichiarato |
| Cattura e status | Cattura e Masterball aggiravano la preparazione del turno e gli status | Preparazione comune alle azioni di A, con tiro e risoluzione prima della cattura |
| Ordine di battaglia | Cattura fallita e KO da status/contraccolpo potevano perdere il conteggio del round | Un'azione per lato nel round, compresi turni persi e sostituzioni |
| Recupero paralisi | Chi iniziava paralizzato poteva conservare per sempre l'ordine invertito | Priorità di livello o moneta recuperata quando la paralisi termina |
| Tiri degli status | Tiri consecutivi potevano riutilizzare il componente con risultato già pronto | Identità distinta per ogni tentativo e continuazione una sola volta |
| KO simultaneo | L'esito del contraccolpo finale dipendeva da chi attaccava | Sconfitta se il giocatore non ha alcuna riserva viva, vittoria se una riserva viva rimane |
| Ripresa battaglia | Un ricaricamento ripristinava HP e turno dell'inizio dello scontro | Salvataggio dei punti stabili tra azioni, incluse sostituzioni, esito ed evoluzioni pendenti; durante una sequenza animata si riprende dal precedente punto stabile |
| Cattura e ricompense | Pokémon, consumo Masterball o monete potevano essere salvati separatamente dalla conclusione | Cattura e checkpoint aggiornati insieme; ricompense NPC applicate una sola volta, anche dopo ricaricamento |
| Ripresa evoluzione | Il payload sopravviveva al ricaricamento e riproponeva evoluzioni già applicate | All'ingresso nella scena si conservano soltanto le evoluzioni ancora pendenti; la conferma dell'animazione in corso rimane visibile |
| Deposito | Il tema importato riportava le vecchie posizioni e rendeva inefficace la migrazione | Squadra a sinistra, griglia 7×5 a destra, rettangoli legacy migrati |
| Admin | Scala tema 0,75 riduceva le etichette dell'editor a 9 px | Tipografia leggibile dell'editor indipendente dalla scala del gioco |
| Lab | Collegamenti ricaricavano il documento; le pagine non erano accessibili nelle build di produzione | Navigazione tramite hash, contenuto a larghezza piena e route disponibili anche nella build |
| Moneta e dado | Focus sui pulsanti sottostanti e Continua tagliato nelle schermate basse | Focus confinato al dialogo, sfondo temporaneamente inattivo, contenuto adattato all'altezza disponibile |
| Moneta: difetto scoperto nel browser | Dopo Continua il contenitore poteva conservare `inert` e impedire i clic sulle azioni di battaglia | Rimosso il ref dal contenitore gestito da Framer Motion; ripristino dello sfondo idempotente e continuazione eseguita una sola volta |
| Audio | Il primo clic riproduceva il file audio senza sbloccare il contesto della musica | Sblocco sul gesto di puntatore o tastiera, rifiuti di autoplay gestiti |
| Audio e deposito: difetto scoperto nel browser | Il controllo audio copriva la freccia di uscita dal deposito | Controllo compatto a icona con margine a destra; aree cliccabili separate nei viewport verificati e uscita tramite mouse funzionante |
| Audio Lab | Ripristina aggiornava il salvataggio ma conservava il suono e le regolazioni correnti | Selezione e regolazioni ripristinate insieme; ritardo caricato dalla preferenza salvata |

## Prove confermate nella build di produzione

| Prova tramite controlli del gioco | Risultato osservato |
| --- | --- |
| Nuova partita, nomi e scelta starter | Avvio e nomi funzionanti. Il primo starter Vyrath resta salvato dopo ricaricamento nel viewport mobile 390×640; il secondo giocatore può scegliere soltanto gli altri starter e sceglie Darklaw |
| Mappa | Movimento, passaggio turno, ingresso in città e ingresso in percorso funzionanti |
| Incontro selvatico | Moneta a livelli uguali con iniziativa B; l'attacco successivo di B porta gli HP osservati da 12 a 6 |
| Cattura riuscita e ripresa | Cattura completata; dopo ricaricamento il checkpoint rimane `ended` e non replica la cattura. Il cespuglio A resta consumato |
| Rivale | La squadra di sei Pokémon è presente e B viene controllato manualmente. KO di Darklaw seguito da scelta di Wormaren; il dialogo di sostituzione si riprende anche dopo ricaricamento. KO di Felyss seguito dall'ingresso di Blazion |
| XP e HP residui | Wormaren passa dal livello 5 al 6 e conserva 4 HP: la barra passa da 4/12 a 4/13 senza cura |
| Sconfitta e squadra esausta | Con tutta la squadra KO, cespugli e sfide NPC rimangono bloccati |
| Centro Pokémon | Cura effettiva: Darklaw 12/12 e Wormaren 13/13 |
| Proprietario del deposito | Prova 1 mostra Vyrath; Prova 2 mostra Darklaw e Wormaren. Le squadre corrispondono al giocatore attivo |
| Scambio e salvataggio deposito | Darklaw spostato dalla squadra al box; posizione conservata dopo ricaricamento |
| Uscita dal deposito e controllo audio | Aree cliccabili disgiunte nei viewport 606×668, 390×640 e 1280×480. Il clic del mouse sulla freccia avvia la transizione di uscita |
| Dialoghi consecutivi nel laboratorio regole | Moneta seguita dal dialogo del sonno: entrambi funzionanti, senza blocco residuo dei controlli |
| Admin | Etichette dell'editor misurate a 12 px, conservando leggibilità indipendente dalla scala della scena |
| Accesso ai laboratori | Tutti e sette i laboratori aperti nella build di produzione e ritorno al gioco verificato: regole, dadi, animazioni Arkamon, VFX, audio, deposito e transizioni |
| Dadi | Facce da 1 a 6, somma osservata 21 e conclusione dell'animazione |
| Transizioni e animazioni | Riproduzione della transizione completata; animazione KO avviata e ripetizione VFX funzionante |
| Audio Lab | Riproduci insieme mostra `Ascolto in corso`. Scelta locale salvata con volume 50%, cue di impatto e ritardo 120 ms; impostazioni conservate dopo ricaricamento. Ripristina Codex confermato dal messaggio di stato |
| Controllo audio globale | Audio ON selezionato e conservato dopo ricaricamento |
| Dialoghi in finestre basse | Moneta a 640×320: Continua funzionante e Tab mantiene il focus nel dialogo. Dialogo del sonno successivo provato a 640×320 e 640×240: a 240 px di altezza Continua occupa l'intervallo verticale 170,4–206,4 px e rimane visibile. Il clic chiude il dialogo, restituisce il focus a Prova Sonno e libera lo sfondo da `inert`; i controlli si adattano senza necessità di scorrimento nelle prove eseguite |
| Stato della partita dopo le prove | Viewport reimpostati e partita del Giocatore 2 a Venezia conservata |

## Prove confermate con scenari iniziali locali

Le righe seguenti riguardano la pagina temporanea sulla porta 3003. Non costituiscono una partita raggiunta interamente attraverso la progressione: la preparazione dello scenario è esplicita, mentre ogni azione descritta è stata eseguita attraverso le schermate reali.

| Scenario iniziale | Azione e risultato osservato |
| --- | --- |
| A paralizzato, Masterball disponibile | Il dado dello stato mostra 4 prima della cattura; l'azione viene risolta e la Masterball scende da 1 a 0 |
| A avvelenato, 19 HP, Masterball disponibile | Il veleno porta A da 19 a 18 HP prima della cattura. Dopo ricaricamento il checkpoint rimane `ended`, Masterball 0 e una sola creatura catturata; all'uscita A conserva 18 HP e gli stati vengono puliti |
| A addormentato, Masterball disponibile | Il dado mostra 1: turno saltato e Masterball conservata a 1 |
| KO del bersaglio e contraccolpo con riserva viva | A passa da 5 a 0 HP e B da 1 a 0 HP. La riserva viva permette la vittoria; A riceve XP, passa al livello 6 e mantiene 0 HP anche nel salvataggio |
| Suprema e sostituzione | B passa da 12 a 11 HP, A da 5 a 0 HP; la riserva Darklaw conserva 9 HP e il passaggio successivo è al turno B |
| KO di B da veleno | A riceve XP e passa dal livello 10 all'11 conservando 19 HP |
| KO di B da contraccolpo | A riceve XP e passa dal livello 5 al 6 conservando 11 HP |
| Coda di due evoluzioni | Entrambe le istanze Vyrath evolvono nella specie 2, livello 15, mantenendo 6 HP. Il ricaricamento fra le due esclude la prima già applicata e mostra soltanto la seconda, come evoluzione 1 di 1. Fine seguito da ricaricamento ritorna al percorso senza ripetere le evoluzioni |
| Ripresa della ricompensa NPC | Checkpoint iniziale `ended`: ricaricamento prima di Prosegui conserva 1000 monete. Prosegui porta le monete a 1200 e conserva 7 HP; un ulteriore ricaricamento mantiene 1200 senza un secondo premio |
| Cattura fallita e turno avversario | Cattura naturale di Wormaren a 12/12 HP fallita. Il checkpoint `opponent` e l'attesa del turno B persistono dopo ricaricamento; AVVERSARIO esegue l'attacco reale, porta A da 19 a 13 HP e restituisce il turno A con checkpoint `player` |

## Asset e cataloghi

Il catalogo delle mosse runtime contiene 220 definizioni, con ID 1–220. Le anteprime VFX/audio coprono 276 voci; 56 sono prive di `gameMoveId` e non aggiungono tabelle di danno o mosse al combattimento. Gli stati implementati includono Paralizzato, Confuso, Addormentato e Avvelenato.

La consegna include cinque fogli sprite dei dadi già modificati. Il confronto con la versione precedente rileva differenze effettive nei pixel visibili e nell'alpha, mantenendo le dimensioni, i canali RGBA e i metadati degli atlanti: il foglio 1 è 2136×777 con 22 frame; i fogli 2–5 sono 1602×259 con 6 frame ciascuno. I riferimenti runtime e la struttura delle sequenze restano invariati.

## Limiti e stato della consegna

Il branch `feature/vfx-recipe-engine` è caricato con il commit della verifica, comprensivo delle correzioni, dei test, della documentazione e dei cinque fogli sprite dei dadi. La pagina temporanea e gli script di lavoro rimangono fuori dal repository.

Questa verifica copre i passaggi e i casi riportati, non un'intera campagna né tutte le 110 specie. I risultati automatici attestano i casi inclusi nella suite; le prove pratiche attestano le interazioni effettivamente eseguite e le dimensioni di schermo indicate. Le prove di Audio Lab confermano avvio e stato della riproduzione, salvataggio e ripristino delle regolazioni; non costituiscono una valutazione acustica dei 276 abbinamenti.

Il sito remoto GitHub Pages e l'applicazione desktop non sono stati verificati in questo intervento.
