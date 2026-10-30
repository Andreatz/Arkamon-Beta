# Confini di dominio, squadra e battaglia

Base: `c150cf20`, 26 ottobre 2026. Il formato GM/G1/G2, l'isolamento delle sfide, il voto limitato alle mosse degli NPC e i checkpoint già risolti restano quelli di `docs/current-game-spec.md`.

## Modifiche

- `src/store/game/commandPolicy.ts` è l'unica policy di gestione della squadra: battaglia o interazione pendente, sfida isolata, Lega in corso/conclusa, schermata e turno. Squadra e Deposito usano la stessa funzione del comando effettivo; consultare G2 non cambia il giocatore attivo.
- `scambiaSlot`, `curaSquadra`, `iniziaBattaglia` e `cambiaGiocatoreAttivo` restituiscono un risultato tipizzato con codice e messaggio. Lo scambio distingue operazione applicata, nessuna modifica e rifiuto. L'interfaccia mostra il risultato reale: non comunica più un riordino riuscito dopo una scrittura negata o fallita.
- `src/store/game/rosterCommands.ts` risolve lo scambio senza scritture. Valida indici interi 0–5 e chiavi canoniche dei 30 box da 35 posti; un indice negativo o una chiave fuori deposito non può creare dati destinati a sparire al successivo recupero. La riparazione di vecchie squadre fuori fascia resta consentita rimuovendo un compagno; HP, status e identità sono conservati.
- Il confine dello store verifica proprietà della sessione, recupero backup irrisolto e salvataggio precedente in sospeso. Un comando rifiutato non scrive il checkpoint. L'avviso del cap è volatile: non passa attraverso il tracker della campagna e non può produrre un aggiornamento Arkadex collaterale.
- La policy di attività ordinaria protegge anche avvio NPC, cure, cambio del giocatore, acquisti, interazioni configurate e comandi di movimento/passaggio turno. Un nuovo ingresso non può sostituire una battaglia già attiva. Le API specifiche di continuazione della sfida e della Lega conservano il proprio percorso esplicito.
- `src/store/game/battleCommands.ts` concentra preparazione dell'ingresso e pulizia di fine battaglia. Gli ingressi storici senza `squadraA` ricevono tutte le riserve, compresi KO e status; la copia attiva è quella canonica del roster. Le regole di HP, paralisi persistente e HP del deposito restano compatibili con i salvataggi esistenti.
- `src/store/game/leagueActions.ts` possiede i sei comandi del tentativo della Lega, con lettura e commit iniettati dallo store. Il modulo non accede allo storage: sequenza degli incontri, turno riservato, cure consentite, sconfitta e vittoria passano ancora per un unico commit durevole.
- Nessuna chiave di persistenza, envelope, snapshot portabile o campo di gioco è stato migrato. I consumatori che ignoravano il risultato dei comandi `void` rimangono compatibili. Gli starter in deposito nei test del laboratorio sono preparati come salvataggi storici, evitando di simulare un comando ora correttamente indisponibile sulla schermata titolo.

## Verifiche

- 26 regressioni nuove in `commandBoundary.test.ts`: UI e comando coerenti in dieci contesti, slot malformati, nessuna modifica, cap, proprietà della finestra, recupero sospeso, salvataggio fallito, conservazione dati dopo ricarica, protezione della battaglia attiva e continuazione del checkpoint sfida.
- Primo giro mirato dopo le correzioni: **340/340 test in 19 file**, inclusi store, ingressi battaglia, Lega, sfide, esperienza e laboratorio.
- Giro allargato: **883/883 test in 57 file**; revisione indipendente **48/48**. L'intera suite del checkout finale ha poi registrato **4.207/4.207 test in 175 file**. I sottoinsiemi non si sommano a questo totale.
- TypeScript: `npx tsc --noEmit` riuscito.
- I risultati dell'esecuzione allargata sono conservati in `output/structural-2026-10-26/domain-tests.json` e riepilogati nel rapporto strutturale principale.

## Contratti e limiti

Lo store globale rimane il punto di composizione e persistenza. Le scene di battaglia conservano l'orchestrazione degli effetti visivi e delle scelte locali; questa modifica non introduce un secondo motore né risolve azioni già salvate una seconda volta. Le funzioni di basso livello per aggiornare istanze/checkpoint restano API interne dell'orchestrazione; non sono un protocollo remoto o un sistema di autorizzazione per codice arbitrario della stessa origine. La cura storica applica l'effetto della struttura già autorizzata dall'interazione; il costo/consumo del turno resta nel comando di interazione, per non addebitare due volte i flussi città/griglia.

Le prove unitarie verificano confini e persistenza locale. Browser, servizio ospite remoto, installazione desktop e pubblicazione sono livelli distinti, documentati nel rapporto principale.
