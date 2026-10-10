# Arkadex, Arkastore, registro e sfide

Le nuove funzioni sono disponibili dal pulsante **Partita**. Il negozio si apre dalle **Attività** della città; in combattimento compare un pulsante **Borsa**.

## Arkadex

**Partita → Arkadex** mostra le 110 specie, con progressi separati per G1 e G2. Ogni scheda è da scoprire, vista oppure ottenuta. Uno starter o una cattura registra la specie ottenuta; un avversario registra la specie vista quando entra effettivamente in campo. Deposito ed evoluzione non cancellano le specie già ottenute.

Le specie sconosciute nascondono nome, tipo, mosse e forma; ricerca e filtri non permettono di scoprirle in anticipo. Puoi cercare le specie note o un numero e filtrare per stato di scoperta e tipo. Il dettaglio mostra categoria HP, mosse, evoluzione, esemplari in squadra/deposito e dati reali di livello, HP, status e XP. Se non possiedi più un esemplare, i valori di riferimento sono dichiarati al livello 5. Il nome della forma evoluta resta nascosto finché non viene vista.

Le animazioni disponibili si avviano su richiesta e sono caricate soltanto per la scheda selezionata. I vecchi salvataggi ricostruiscono l’Arkadex dalla collezione attuale e dall’incontro in corso; non inventano incontri o evoluzioni passate non registrate.

## Arkastore e Borsa

Ogni città ha un **Arkastore** nel pannello **Attività**. Aprirlo e preparare il carrello non consuma azioni. Un solo **Acquista carrello** compra tutti gli articoli selezionati, addebita il totale e conclude l’interazione del turno. Il secondo giocatore conserva saldo e inventario separati. La regola resta due movimenti oppure un movimento e un’interazione.

| Oggetto | Prezzo in monete | Effetto |
| --- | ---: | --- |
| Pozione | 100 | Recupera il 25% degli HP massimi di un Arkamon vivo. |
| Superpozione | 200 | Recupera il 50% degli HP massimi di un Arkamon vivo. |
| Rianimatore | 300 | Rianima un Arkamon KO con il 50% degli HP massimi. Conserva gli status. |
| Antidoto | 80 | Rimuove Avvelenato da un Arkamon vivo. |
| Antiparalisi | 80 | Rimuove Paralizzato da un Arkamon vivo. |
| Sveglia | 80 | Rimuove Addormentato da un Arkamon vivo. |
| Masterball | 1.500 | Cattura garantita durante una battaglia selvatica. |

Le cure degli oggetti arrotondano per eccesso, con almeno 1 HP, senza superare il massimo. Pozione e Superpozione curano solo gli HP: per gli status si usa l’oggetto specifico. Gli acquisti non applicano cure. Oggetti inefficaci, quantità non valide o carrelli troppo costosi non spendono monete, oggetti o azioni. In caso di spazio del browser esaurito o bloccato, la scrittura viene controllata prima di pubblicare acquisto o cura in memoria.

Fuori dalla battaglia, **Partita → Borsa** permette di scegliere un membro della squadra e un oggetto; l’uso riuscito è un’interazione e conclude il turno. In battaglia, **Borsa** sostituisce la mossa di quel turno, con le normali verifiche degli status all’inizio del turno. Puoi curare anche un compagno o rianimare un Arkamon KO in squadra. Consumo, HP e checkpoint si salvano insieme e la cronaca riporta l’oggetto usato. La Masterball conserva il pulsante dedicato nelle battaglie selvatiche.

Questi prezzi sono una prima configurazione di gioco, distinta dal bilanciamento degli attacchi. Si trovano in `src/shop/catalog.ts`.

## Registro del match

**Partita → Registro del match** riunisce avvio della campagna, starter, movimenti, interazioni, incontri, conclusione delle battaglie, catture, livelli/XP, evoluzioni, acquisti e organizzazione del deposito. Mostra data, giocatore, luogo e dettagli dell’attività. Le letture dei pannelli, le anteprime e una seconda scrittura dello stesso checkpoint non generano eventi nuovi.

Filtra per giocatore, categoria e testo, poi scarica gli eventi selezionati in JSON o testo. Il registro conserva gli ultimi **600 eventi** della campagna ed è incluso nel backup completo insieme all’Arkadex e all’inventario. La nuova partita azzera questi progressi. I dadi e la formula del danno restano consultabili nelle **Cronache** delle battaglie: il registro della campagna non rilancia i dadi.

I salvataggi precedenti non possiedono uno storico delle attività: il nuovo registro parte dagli eventi effettivamente avvenuti dopo l’aggiornamento.

## Cap di cinque livelli

La differenza fra il membro di livello più alto e quello di livello più basso deve essere **al massimo 5**, includendo gli Arkamon KO. Il deposito non è soggetto al cap.

- Una cattura fuori fascia va nel deposito anche se in squadra ci sono slot vuoti. Se il deposito è pieno, la cattura viene rifiutata senza consumare la Masterball.
- Uno scambio che crea una squadra fuori fascia è rifiutato con un messaggio. Puoi togliere membri dal gruppo per sistemare una squadra di un vecchio salvataggio.
- La crescita del singolo Arkamon è limitata al livello del compagno più basso + 5. Se è l’unico membro, resta il massimo normale di livello 100.
- L’XP ottenuta al cap resta conservata. Quando la fascia lo permette, un successivo premio XP può utilizzarla; non avvengono cure o aumenti artificiali dei livelli dei compagni.
- La Suprema continua a premiare il KO prima del contraccolpo; il costo usa gli HP massimi al livello effettivamente raggiunto, rispettando il cap.

Un vecchio salvataggio fuori fascia mantiene tutti gli Arkamon, livelli e HP. Un avviso chiede di sistemare la squadra nel deposito prima di avviare un nuovo incontro; non viene effettuato un abbassamento dei livelli. Gli avversari della campagna conservano le loro squadre definite nei dati.

## Sfide a seed

Apri **Partita → Sfide**, inserisci un seed e premi **Genera sfida**. Le regole v1 producono due squadre da **sei specie diverse al livello 20**, con HP pieni, entro **100 crediti** per lato. Il seed può contenere da 1 a 64 caratteri; spazi ai bordi sono rimossi, maiuscole/minuscole restano significative.

**Avvia sfida** usa il motore reale della battaglia. Il seed controlla iniziativa, dadi, status e scelte casuali dell’IA. Anteprime, consultazione dei pannelli e animazioni non consumano questa sequenza. A parità di configurazione e scelte, i tiri sono riproducibili. Scelte diverse possono consumare la sequenza in modo diverso e produrre risultati differenti.

Il cursore dei dadi viene salvato insieme al turno concluso. Una ricarica durante un’animazione riprende dal precedente checkpoint; una ricarica dopo il turno riprende dal tiro successivo. Le votazioni del pubblico sono escluse dalle sfide per conservare la riproducibilità.

La sfida ha un contenitore separato: squadre, HP, monete, diario, Arkadex, registro e archivio della campagna non vengono modificati. Il banner indica il seed. **Torna alla campagna → Conferma uscita** abbandona il tentativo senza un risultato di classifica. **Prosegui**, dopo la conclusione, registra il risultato e ripristina la campagna. Concludi una battaglia/evoluzione della campagna prima di avviare una sfida.

Il risultato viene scritto prima di ritirare lo scontro concluso. Se manca spazio, il checkpoint resta disponibile e **Prosegui** può ritentare con lo stesso identificatore, evitando duplicati. Un contenitore con dadi non validi recupera la campagna conservata e viene ritirato, evitando che i riavvii successivi ripristinino una fotografia ormai vecchia.

## Fanta-Team Builder

Nella stessa scheda scegli **Fanta-Team Builder**. Costruisci una squadra di **sei specie diverse**, tutte al livello 20, con **100 crediti**. Ricerca e filtro per tipo aiutano a scegliere; ogni aggiunta mostra il costo e il budget residuo. Non puoi aggiungere un settimo membro, duplicare una specie o superare il budget. Puoi rimuovere un membro e sostituirlo oppure usare una squadra suggerita dal seed.

Il prezzo v1 combina base 8, categoria HP, stadio evolutivo e danno medio della migliore mossa offensiva al livello 20. La formula è spiegata nel pannello. **Prepara Fanta-Team** mostra squadra e avversari prima dell’avvio. Il catalogo competitivo comprende tutte le specie; non sblocca quelle sconosciute nell’Arkadex della campagna.

**Crea codice da condividere** esporta seed, modalità, versione delle regole e specie scelte. Il codice si può copiare/importare su un altro dispositivo. L’importazione controlla versione, specie, duplicati e budget, poi ricostruisce squadre e HP dalle regole; non accetta HP o dadi impostati nel file.

La bozza e gli ultimi **30 risultati** si salvano separatamente sul dispositivo. La classifica confronta soltanto la stessa configurazione: vittorie, meno azioni di combattimento e più HP residui. Un contatore separato conserva le azioni anche se la cronaca supera il suo limite di eventi. **Riprova questo seed** ricrea la configurazione iniziale, anche se le creature sono cresciute durante lo scontro. La classifica è locale e non è un servizio online condiviso.
