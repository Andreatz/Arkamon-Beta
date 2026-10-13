# Audit Arkamon — 13 ottobre 2026

La revisione parte da `9c330d2`, con le nuove animazioni 34–38 e i front sprite ufficiali nelle schermate del giocatore. Le correzioni sono sul ramo `feat/project-audit-2026-10-13`. Sono stati esaminati motore e battaglia, store, sfide, backup, interazioni, registri, UI e votazioni, caricamento, distribuzione e strumenti. Il servizio Arkanight aggiornato è stato verificato localmente in sola lettura. Le proposte UX e le nuove modalità sono in [roadmap per Twitch](twitch-ux-roadmap-2026-10-13.md).

## Difetti riprodotti e corretti

| Priorità | Trigger e problema | Risultato della correzione |
| --- | --- | --- |
| P1, backup | Un download dei progressi durante una sfida serializzava la squadra temporanea corrente invece della campagna conservata in `challengeContext.campaign`. Un ripristino successivo poteva sostituire la vera campagna con la sfida. | La funzione centrale esporta la campagna dei due giocatori. Un contesto danneggiato viene rifiutato, senza generare un backup sostitutivo. Sfida e cursore RNG restano separati. |
| P2, importazione | Una lettura lenta di un file poteva completarsi dopo la selezione di una copia automatica e sostituire l'anteprima scelta più recentemente. | Ogni selezione, annullamento e ripristino invalida le letture precedenti. Non si riattiva la conferma di un vecchio file. |
| P2, contenuti | Il catalogo accettava come prerequisito un dialogo o una cura ripetibile. Queste attività non registrano completamenti: la tappa dipendente era irraggiungibile. | Nuovi prerequisiti impossibili sono rifiutati. I cataloghi già salvati restano leggibili e portabili, con avviso nel backup. L'editor consente di riparare una dipendenza alla volta, conservando soltanto gli archi legacy già esistenti; non può reintrodurne uno rimosso. |
| P2, cronaca | Un contatore importato al massimo intero sicuro, oppure arretrato rispetto agli eventi, poteva riusare un ID e perdere azioni come duplicati. | Prenotazione deterministica di un ID libero e recupero del contatore; nessun consumo di RNG. Gli eventi già validi e la deduplica sono conservati. |
| P2, registro | Un evento importato alla sequenza 999.999.999 portava il contatore oltre il limite del validatore e congelava tutti gli eventi successivi. | Ripartenza delle sole sequenze al bordo patologico, conservando ID, date, ordine e contenuti. |
| P2, informazioni | Quattro mosse curative apparivano come attacchi a dadi in Squadra, Analisi e Arkadex. | Risveglio verde, Respiro profondo, Tocco di pace e Assorbilinfa mostrano Cura 40%, 30%, 50% e 25%. Il dettaglio descrive HP massimi e rimozione di veleno/paralisi, coerentemente con il motore. |
| P2, tastiera | Il dialogo del pubblico tentava il focus sul comando disabilitato durante l'apertura. | Focus nel dialogo anche durante apertura/chiusura; Tab e Shift+Tab confinati ai comandi disponibili. |
| P2, voto | Durante una chiusura remota lenta lo stato restava aperto; più pressioni abortivano e riavviavano la richiesta. | Stato `closing` pubblicato immediatamente, comando disabilitato, una richiesta fino alla risposta. Retry e fallback conservati. |
| P2, caricamento | Il rifiuto di un modulo di Squadra o Laboratorio produceva un albero React smontato, senza comando per recuperare. | Schermata leggibile con focus e «Ricarica il gioco». Nessuna cancellazione dei dati; ricarica dall'ultimo checkpoint salvato. Protezione per errori di rendering e moduli caricati su richiesta, non per il mancato download del bundle iniziale. |
| P3, strumenti | Il controllo di sincronizzazione VFX considerava un catalogo Windows CRLF diverso dallo stesso catalogo LF e dichiarava asset non aggiornati. | Normalizzazione delle terminazioni di riga soltanto nel confronto. Il file non viene riscritto e differenze nei contenuti continuano a essere rifiutate. |

La revisione indipendente ha riprodotto il caso di riparazione graduale con due dipendenze legacy; è coperto da una nuova regressione. Non sono state cambiate formule di danno, STAB, prezzi o comportamento delle mosse. Nessun nuovo difetto dimostrato nei normali calcoli di HP, status, cap e Suprema; questo esito non equivale a una prova di assenza di ogni possibile bug.

## Verifica

Baseline: 2.699 test in 124 file. La suite completa finale supera **2.721 test in 126 file**, compresa la regressione della riparazione graduale.

I test browser usano contesti isolati Chrome, desktop e Pixel 7 emulato, senza modificare il salvataggio abituale. Coprono ripresa, salvataggi rifiutati e retry, catture, evoluzioni, acquisti, status, voti, font e asset confermati, ritratti ufficiali, schermate dense e dati delle specie sconosciute. Le nuove prove riproducono lettura file ritardata, moduli rifiutati e ritorno dopo ricarica, cure mostrate correttamente, focus del voto e chiusura lenta. Gli endpoint dei voti sono simulati nelle prove frontend; lo stato, la battaglia, i dadi e i checkpoint sono reali.

La build con `/Arkamon-Beta/` mantiene il pacchetto di 569,5 MiB e 185 clip native. TypeScript, il catalogo runtime e le nove regressioni della mitigazione braces sono verificati. I video e gli asset originali restano invariati.

Il controllo aggiornato dei cataloghi trova zero errori nei riferimenti esaminati: 110 specie, 229 mosse runtime, 31 allenatori e 184 incontri in 85 cespugli; 29 luoghi e 31 strade principali; 16 mappe locali con 771 nodi e 922 strade. Tutti i nodi sono raggiungibili dall'ingresso e le strade sono bidirezionali. Sono letti gli header di tutti i 220 front/back PNG e delle mappe. Percorso 15 conserva zero incontri e zero allenatori definiti.

La build di produzione è stata aperta nel browser a 1920×1080: Squadra, Deposito, Arkadex e Analisi mostrano i front ufficiali completi; nessuna richiesta di media animati durante la consultazione e nessun errore JavaScript/HTTP. Il backup d'emergenza durante una sfida è verificato con un rifiuto reale della scrittura locale: il file scaricato conserva nomi, squadre, HP/status, monete e oggetti originali dei due giocatori, senza cambiare la campagna o il checkpoint della sfida.

Sul checkout aggiornato del servizio Arkanight (`bdd5a98b59c4f6d5a34270a0a0bb3bf670dcd6ae`), i 57 test di votazione passano: identità condivisa dei due QR, cookie, origini, sostituzione del voto, scadenza e risultato autorevole, concorrenza dei processi e collisioni di revisione Supabase simulate. La PR Arkanight 9 risulta già integrata; il vecchio checkout desktop locale è più arretrato e non rappresenta il codice aggiornato. Non sono stati letti o modificati segreti, database o impostazioni di hosting in produzione.

## Limiti e rischi residui

- Le prove frontend non misurano ritardo video Twitch, telefoni fisici, OBS attivo o database remoto. Prima di una puntata serve una prova su quel percorso completo.
- Il polling del telefono è circa una richiesta al secondo. Il servizio conserva l'intera sessione in una riga JSON e aggiorna con confronto di revisione. Cento telefoni possono generare circa cento letture al secondo, oltre a voti e retry: è una stima dalla frequenza, non una capacità certificata. Il limite di 1.000 membri è un limite di validazione, non un risultato di carico.
- L'identità è quella del browser registrato, non un'identità Twitch verificata. Browser o profili diversi possono rappresentare membri diversi. Per tornei competitivi serve una scelta esplicita sull'autenticazione e sulla prevenzione degli abusi.
- La distribuzione dei media usa URL raw vincolati a una revisione: garantisce identità degli asset, non banda o disponibilità illimitata. I budget 32/64 MiB limitano la cache delle pagine, non tutta la memoria del browser o della GPU.
- Audit npm di produzione: zero segnalazioni. Nell'audit completo restano cinque segnalazioni high nella catena degli strumenti Tailwind/braces. La mitigazione esistente passa i nove test, ma non elimina l'advisory né giustifica dichiarare la catena completamente risolta.
- `BattagliaScene` ha circa 1.750 linee non vuote e `gameStore` circa 940: accumulano coordinamento, persistenza e presentazione. Conviene separarli progressivamente usando i checkpoint e le regressioni attuali, prima di aggiungere raid o partite remote.
- Ramo, PR, integrazione e sito pubblico sono stati distinti. Questa consegna non pubblica automaticamente modalità nuove né configura il servizio Twitch.

## Prossime decisioni tecniche

1. Vista spettatore di sola lettura e console regia: pubblicare soltanto un modello dei dati già visibili, senza capacità host o specie sconosciute. Aggiornamenti con revisione/numero evento, riconnessione e snapshot completo dopo interruzione.
2. Prove di carico del voto con 20, 100 e 500 partecipanti: misurare latenza, conflitti, richieste, costo e chiusura alla scadenza prima di scegliere push o cambiare lo schema.
3. Ripresa della live: identità della puntata e riepilogo dal registro; una finestra OBS o spettatore non deve diventare un secondo scrittore della campagna.
4. Estrazione incrementale della coordinazione della battaglia in stati espliciti, senza cambiare il motore. Errori, salvataggio in attesa e risultato confermato devono essere stati distinguibili.
5. Distribuzione affidabile dei media e profilo memoria su hardware reale con OBS acceso; evitare una migrazione di stack senza un beneficio misurato.
