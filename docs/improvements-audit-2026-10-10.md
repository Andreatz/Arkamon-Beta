# Verifica dei miglioramenti — 10 ottobre 2026

Sono stati sviluppati gli interventi della tabella dell’audit del progetto, con l’esclusione concordata di release degli asset e atlanti a pagine. Gli originali e i nuovi video grezzi restano nella copia locale dell’utente. La guida operativa è in [player-tools.md](./player-tools.md).

## Risultati

| Intervento | Consegna |
| --- | --- |
| Backup versionato | File completo della campagna, catalogo interazioni e replay; anteprima, avvisi, conferma, annullamento, copia precedente, scritture controllate e rollback. |
| Editor delle interazioni | Dialoghi, cure, allenatori/cespugli esistenti e incontri definiti dalla regia; requisiti, costi, premi, completamento individuale/condiviso e dipendenze fra tappe. Import/export catalogo e adattatore Tiled. |
| Diario e turno | Medaglie, progressi individuali, tappe, requisiti, luoghi documentati e prossimo obiettivo dai dati reali. Riepilogo delle azioni su mappa principale e locale. |
| Cronaca e replay | Dadi reali e formula del danno, status, KO, XP, Suprema e contraccolpo; eventi rivelati, export testo/JSON e archivio automatico di 20 scontri. |
| Browser e accessibilità | Nove scenari permanenti eseguiti su desktop e viewport Pixel 7, controlli axe sulle nuove interfacce e workflow CI delle pull request. |
| Audio e movimento | Volumi indipendenti musica/effetti, velocità normale/rapida, movimento ridotto per scelta o dispositivo; preferenze separate dalla campagna. |
| Moduli | Recupero/persistenza fuori dallo store, un file per ciascuna delle 16 mappe, risoluzione A/B condivisa, presentazione e checkpoint della battaglia separati. Pannelli caricati alla richiesta. |

Le regole degli HP residui, degli status, della Suprema, delle due azioni e dell’accesso al Percorso 15 sono conservate. Le mappe mantengono coordinate, strade, collegamenti e ID; la numerazione resta nascosta nel gioco e visibile nell’editor. Nessun incontro o premio è preconfigurato nel luogo segreto.

## Difetti trovati durante l’integrazione

- **Ripristino nella stessa scena:** importare una battaglia mentre un’altra battaglia era aperta manteneva stato e callback locali precedenti. Una revisione volatile della campagna rimonta la scena al ripristino/reset; il file non può importare quella revisione. Il test browser verifica HP, creature, checkpoint e cronaca prima e dopo reload.
- **Tastiera nella griglia legacy:** i listener globali potevano ricevere frecce/Spazio dai pulsanti del menu. Gli eventi provenienti dai dialog sono esclusi dal listener della griglia.
- **Archiviazione delle definizioni:** una scrittura fallita poteva lasciare il catalogo modificato solo in memoria. Ora Salva/Importa/Elimina pubblicano la modifica soltanto dopo la scrittura riuscita, mostrando un errore in caso di quota o blocco.
- **Premi degli incontri configurati:** il premio è legato a proprietario, luogo, istanza della battaglia e risultato; viene attribuito una sola volta dopo il successo, senza consumare un secondo turno.
- **Dialoghi annidati:** il replay aperto dall’archivio usa un livello superiore e il contenitore esterno lascia gestire focus ed Escape al dialog attivo. I controlli sono verificati nel browser.
- **Caricamento differito:** avvisi di recupero e riepilogo del turno sono separati dai pannelli completi, così i loro import non annullano il caricamento alla richiesta di Backup e Diario.
- **Archivio a spazio esaurito:** un errore di quota durante l’archiviazione automatica non interrompe la battaglia. Il replay resta in memoria con un avviso e un comando per ritentare la scrittura; importazioni/eliminazioni fallite conservano l’archivio precedente.

## Flussi provati nel browser

I test usano browser reali, contesti nuovi, salvataggi isolati e il server sulla porta 3014. Non leggono o sostituiscono i salvataggi abituali dell’utente.

1. Impostazioni, tastiera/focus, persistenza e accessibilità.
2. Nuova campagna, nomi, scelta di due starter e ricarica.
3. Esportazione backup, file rifiutato, anteprima, annullamento, conferma, copia precedente e HP preservati.
4. Editor, salvataggio delle definizioni, requisiti del diario per G1/G2 e accessibilità.
5. Interazione reale sul pallino: premio unico, conclusione del turno, ricarica, completamento indipendente del secondo giocatore e accessibilità.
6. Suprema con doppio KO: osservazione del DOM prima della rivelazione dei dadi, HP e animazione non anticipati, ordine KO → XP/livello → contraccolpo → vittoria, reload e replay nell’archivio.
7. Importazione battaglia → battaglia nella stessa scena, con Pokémon, HP, checkpoint e cronaca differenti.
8. Deposito: scambio di slot occupati, spostamento fra box, ricarica, HP/status/XP preservati e secondo giocatore invariato.
9. Ripresa del voto NPC: stesso identificatore del turno dopo reload, maggioranza applicata una volta, nessun secondo tick di veleno, ricarica successiva senza riaprire il voto.

Il test del pubblico sostituisce soltanto le richieste HTTP con risposte del contratto del servizio; motore, dadi, recupero, status e interfaccia sono reali. Non dimostra disponibilità del backend, scansione da telefono fisico o pubblicazione online. La prova della Suprema usa una fixture sintetica con dadi non forzati e movimento normale; gli altri flussi possono usare movimento ridotto.

Il report HTML include screenshot delle nuove interfacce. Le tracce e gli screenshot degli errori sono conservati dalla CI per sette giorni. I controlli axe automatici coprono i pannelli nuovi: non costituiscono una certificazione di accessibilità dell’intero gioco.

## Controlli conclusivi

- Suite Vitest completa: **1.760/1.760 test passati**, 94 file. TypeScript completo passato.
- Browser: **18/18 prove passate**, nove scenari su due viewport, nessun errore JavaScript nei flussi che lo rilevano; controlli axe dei pannelli nuovi senza violazioni.
- Build di produzione verificata. Restano la dimensione del modulo principale e il peso degli asset documentati nell’audit: la riduzione degli asset è rinviata per richiesta dell’utente.
- Il workflow CI esegue installazione, test, build e browser anche per pull request con base diversa da main, così copre le PR successive alle votazioni e all’audit.

Non è stata giocata tutta la campagna fino a Roma, compilato un nuovo installer, ascoltato ogni effetto o controllata una release distribuita. Il repository rimane privato. La consegna su una pull request in bozza non equivale a un merge o a un deploy.
