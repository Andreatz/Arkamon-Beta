# Le sette viste SVG nel gioco

L’interfaccia degli strumenti dell’allenatore è integrata nell’applicazione React e legge la partita reale: squadra, deposito, HP, status, esperienza, scoperte, inventario, monete e progressi dei due giocatori. I pannelli usano il kit di 47 SVG fornito nell’archivio dell’utente, insieme al logo, agli sfondi e alle immagini delle creature già presenti nel gioco.

Questa guida descrive le sette viste integrate nell’applicazione React e il loro layout compatto. Le [anteprime grafiche autonome](ui-previews/README.md) restano consultabili come riferimento della proposta: usano dati dimostrativi, hanno catture e verifiche proprie e non sono il salvataggio di una campagna. Per utilizzare le nuove viste con i propri Arkamon occorre aprire il gioco, anziché il prototipo in `docs/ui-previews/`.

## Dove aprire le schermate

Premi **Partita** per aprire la finestra **La tua partita**. La navigazione principale contiene tutte e sette le viste:

| Vista | Percorso nel gioco | Contenuto e operazioni |
| --- | --- | --- |
| Menù Partita | **Partita → Menù Partita** | Posizione, turno, monete, squadra, deposito, scoperte, medaglie e accessi agli strumenti. |
| Gestione Squadra | **Partita → Squadra** | Sei posti, condizioni dei compagni, mosse, fascia dei livelli e riordino dei membri. |
| Deposito Arkamon | **Partita → Deposito** | Box reali, riserve, squadra e spostamento o scambio tra posti. |
| Arkadex | **Partita → Arkadex** | Specie viste e ottenute, ricerca, filtri, esemplari e catena evolutiva. |
| Analisi Arkamon | **Partita → Analisi** | Scheda, crescita, HP, XP, mosse, dadi, affinità e spiegazioni degli status. |
| Borsa Oggetti | **Partita → Borsa** | Scorte possedute, categorie, effetti e uso su un membro della squadra. |
| Negozio | **Partita → Negozio** | Catalogo dell’Arkastore, quantità, carrello, costo e saldo effettivi. |

In città, **Attività → Arkastore** apre direttamente la vista Negozio della stessa finestra. Anche l’ingresso nella scena **Deposito** apre il nuovo layout, con squadra e box della partita. Da Squadra o Deposito, **Analizza Arkamon** porta alla scheda dell’esemplare selezionato. **Riprendi** ed **Esc** chiudono gli strumenti; nella scena Deposito, Riprendi torna alla scena precedente.

Il selettore **G1 / G2** cambia il giocatore consultato in tutte le viste. Non cambia il giocatore attivo, la sua posizione o le azioni rimaste. L’interfaccia indica separatamente il giocatore selezionato e il turno attuale. La consultazione è disponibile anche quando una modifica è bloccata; i comandi mostrano il motivo.

Diario, Backup, Impostazioni, Cronache, Registro del match e Sfide restano disponibili nella navigazione degli strumenti. Il backup e il registro continuano a usare i formati e le funzioni già descritti in [strumenti del giocatore](player-tools.md) e [Arkadex, Arkastore e sfide](arkadex-arkastore-challenges.md).

## Una schermata completa a 1920×1080

Le sette viste utilizzano un layout compatto a **1920×1080**: intestazione, navigazione, contenuto, strumenti aggiuntivi e comandi finali sono visibili insieme, senza scorrimento della pagina o delle liste interne. Il layout ridistribuisce pannelli e spazi; non applica uno zoom globale e non nasconde contenuti per farli rientrare.

- **Squadra:** tutti e sei i membri, con HP numerici, status e livelli, restano visibili accanto alla scheda e ai comandi dell’Arkamon selezionato.
- **Deposito:** ogni box mostra insieme i **35 posti**, i sei membri della squadra, la destinazione di spostamento e la scheda selezionata. Si cambia box con i comandi già presenti.
- **Arkadex:** le 110 specie sono suddivise in **19 pagine da sei voci**, con due voci nell’ultima pagina. Ricerca, filtri e cambio giocatore riportano alla prima pagina. Informazioni, Mosse ed Evoluzioni hanno schede separate; cambiare pagina non perde l’esemplare selezionato.
- **Analisi:** Scheda, Mosse e Status e cure suddividono i dati; la scheda degli status contiene anche le affinità. Le informazioni duplicate vengono riunite nella scheda pertinente.
- **Borsa:** la griglia conserva tutti gli oggetti della categoria. Il pannello laterale mostra effetto, bersaglio e un solo comando di uso per l’oggetto selezionato. Cambiare oggetto conserva il bersaglio; quando una scorta finisce, la selezione passa a un oggetto ancora posseduto.
- **Negozio:** i sette articoli, le quantità, il dettaglio selezionato e un carrello con tutti e sette gli articoli entrano contemporaneamente nello schermo, compresi totale, saldo, motivi di blocco e comandi di acquisto.
- **Menù Partita:** i sei accessi principali e il riepilogo della campagna restano affiancati, con registro, backup e ripresa visibili.

La disposizione compatta si attiva con almeno **1100 pixel di larghezza e 1000 di altezza disponibili**. A risoluzioni più piccole o su telefono, i pannelli tornano a un flusso adattabile con scorrimento, per mantenere leggibili testi e pulsanti. Il riferimento verificato senza scorrimento è il viewport del gioco di 1920×1080; l’area disponibile può essere inferiore se il browser mostra barre o strumenti laterali.

## Squadra, deposito e condizioni reali

Squadra e Analisi mostrano gli esemplari posseduti dal giocatore selezionato, con i loro livelli, HP residui, XP e status. Durante una battaglia, le condizioni sono lette anche dalle istanze aggiornate dello scontro. Le immagini non introducono Arkamon dimostrativi in un gruppo vuoto: prima dello starter viene mostrato lo stato iniziale della squadra.

Il Deposito contiene i **30 box da 35 posti** del motore e i sei posti della squadra. Per organizzarlo, seleziona un Arkamon, premi **Sposta o scambia** e scegli il posto di destinazione. Un posto occupato scambia i due esemplari. Il riordino in Squadra e gli scambi nel Deposito passano attraverso l’azione reale `scambiaSlot`: sono disponibili durante il turno del proprietario, fuori dalla battaglia, dalle sfide e dalle transizioni che richiedono una scelta. Le riserve dei due giocatori restano indipendenti.

Uno spostamento conserva l’identità dell’esemplare, HP, status, XP e livello. Aprire una scheda, cambiare vista o consultare l’altro giocatore non applica una cura. Gli HP residui restano dopo gli scontri; le cure avvengono tramite le azioni previste dal gioco.

La fascia di squadra resta **massimo cinque livelli tra il membro più basso e quello più alto**, inclusi gli Arkamon KO. Le viste Squadra e Deposito mostrano fascia e differenza; Analisi segnala l’XP conservata quando la crescita attende il cap. Uno scambio che crea una squadra fuori fascia viene rifiutato. I vecchi salvataggi conservano livelli e HP: possono essere riordinati senza abbassare i livelli. Le [regole complete del cap](arkadex-arkastore-challenges.md#cap-di-cinque-livelli) continuano ad applicarsi a catture, crescita e nuovi incontri.

## Scoperte, oggetti e acquisti

L’Arkadex usa i progressi separati della campagna per G1 e G2. Una specie sconosciuta non rivela nome, immagine, tipo o mosse; ricerca, filtri e catena evolutiva rispettano questa condizione. Le soglie dei predecessori non scoperti restano nascoste. La scheda di una specie nota può mostrare un esemplare reale in squadra o deposito; quando mancano esemplari, dichiara esplicitamente il riferimento di catalogo al livello 5. Le animazioni si avviano su richiesta per la scheda selezionata.

La Borsa mostra soltanto le quantità possedute dal giocatore consultato. L’uso fuori dalla battaglia richiama `applicaOggetto` e il pannello degli oggetti già collegato al motore: scelta del bersaglio, efficacia, status, consumo e conclusione del turno seguono le regole esistenti. Un oggetto inefficace non viene consumato. La Masterball resta utilizzabile per la cattura in uno scontro selvatico; dalla Borsa degli strumenti non si avvia una cattura. Durante la battaglia si usa la Borsa della pulsantiera di combattimento.

Il Negozio usa il catalogo e i prezzi reali di `SHOP_ITEMS`. Preparare il carrello non spende monete o azioni. **Acquista carrello** richiama `acquistaOggetti` e verifica città corrente, posizione del giocatore, disponibilità del turno, assenza di una battaglia o interazione pendente, quantità, capienza e saldo. Consultare il catalogo da un percorso o per il giocatore non attivo non rende disponibile un acquisto.

L’acquisto riuscito salva insieme inventario, addebito e conclusione dell’interazione; poi svuota il carrello. Un acquisto rifiutato conserva il carrello e mostra il motivo senza spendere risorse. L’acquisto non modifica gli HP della squadra. Saldo, inventario e scoperte di G2 non cambiano quando G1 acquista o usa una cura.

## Sfide e strumenti della campagna

**Partita → Sfide** conserva il pannello delle sfide a seed e del **Fanta-Team Builder**. Le regole restano sei specie diverse al livello 20 e budget di 100 crediti, con codice condivisibile e classifica locale della stessa configurazione.

Durante una sfida il menu mostra il seed e gli strumenti dedicati alla sessione. Le viste e le operazioni della campagna sono bloccate; Impostazioni e Sfide restano disponibili. La campagna è conservata separatamente e viene ripristinata al termine o all’uscita prevista. La consultazione e le immagini non consumano la sequenza dei dadi. Per checkpoint, uscita, importazione e risultati vale la [documentazione delle sfide](arkadex-arkastore-challenges.md#sfide-a-seed).

## Kit grafico e manutenzione

I 47 SVG runtime sono in [`public/ui/player-kit/`](../public/ui/player-kit/), con provenienza e impronte nel [`catalog.json`](../public/ui/player-kit/catalog.json). Sono copie dei file del kit fornito: cornici, pulsanti, cerchi, icone e simboli dei tipi vengono usati come risorse vettoriali, senza sostituirli con ritagli PNG. Le creature continuano a usare i poster delle animazioni disponibili, con fallback agli sprite originali; logo e sfondi conservano gli asset esistenti.

La finestra e le sette viste sono in [`src/player-ui/`](../src/player-ui/). I componenti comuni sono in [`kit.tsx`](../src/player-ui/kit.tsx), il layout adattabile in [`player-ui.css`](../src/player-ui/player-ui.css), e gli ingressi della finestra in [`PlayerTools.tsx`](../src/settings/PlayerTools.tsx). I percorsi dei nuovi asset passano per `assetUrl`, come gli altri asset del gioco. Le schermate vengono caricate quando richieste.

## Verifiche locali e pubblicazione

Verifiche completate l’**11 ottobre 2026** per questa integrazione:

- Controllo TypeScript completato senza errori.
- Suite completa: **2.112 test superati in 106 file**, eseguiti con isolamento e al massimo due worker.
- Build di produzione con base GitHub Pages `/Arkamon-Beta/` completata senza errori, con la gestione di Esc e il layout compatto. La preview della build apre l’applicazione e gli strumenti; tutti i 47 SVG rispondono correttamente dal percorso di produzione, senza errori di pagina o richieste fallite nella verifica.
- **47 SVG identici byte per byte** ai file dell’archivio fornito.
- Suite completa di **66 prove nel browser superate**, tra desktop e telefono, comprese battaglie, sfide, salvataggi e strumenti. Le quattro prove dedicate al formato 1920×1080 vengono escluse dal profilo telefono: **quattro esclusioni previste, nessun errore**. Le nuove viste coprono apertura e focus, consultazione di G2 senza mutazioni della campagna, caricamento degli SVG, layout, scambi persistenti, rifiuto degli scambi fuori fascia, cura della paralisi e acquisto dalla città. È verificato anche il blocco dell’acquisto fuori città.
- Controllo Axe: **zero violazioni rilevate nelle sette schermate**, sia su desktop sia su telefono.

Le regressioni verificano che Esc chiuda soltanto la finestra in primo piano: dal deposito diretto, chiudere gli strumenti o una cronaca archiviata lascia visibile la scena e conserva il focus e i dati. Un secondo Esc torna alla città. È verificato anche lo spostamento di una riserva verso un posto vuoto della squadra: il selettore segue la destinazione effettiva assegnata dal motore, con identità, HP, status e XP invariati.

I flussi sono documentati dai test [`player-ui.spec.ts`](../e2e/player-ui.spec.ts) e [`player-ui-integration.spec.ts`](../e2e/player-ui-integration.spec.ts); i controlli delle schede e della separazione dei dati sono in [`src/player-ui/__tests__/`](../src/player-ui/__tests__/) e [`TeamAnalysisDeposit.test.tsx`](../src/player-ui/TeamAnalysisDeposit.test.tsx).

La regressione [`player-ui-1080.spec.ts`](../e2e/player-ui-1080.spec.ts) misura anche le dimensioni effettive dei contenitori e dei comandi nel browser. Usa una campagna di prova con nomi lunghi, sei membri, 35 riserve, 110 specie scoperte, tutti gli oggetti e un carrello completo. Controlla le pagine e le schede dell’Arkadex, i dettagli più lunghi, la consultazione di G2, le specie sconosciute e l’ingresso diretto nel deposito; verifica che la consultazione non modifichi il salvataggio. Le catture delle sette viste sono state prodotte anche dalla build di produzione a 1920×1080.

Questi risultati riguardano l’esecuzione locale dell’integrazione e della build; non attestano un esito CI o la disponibilità online. La pubblicazione sul sito richiede il merge della PR in `main`, seguito dal workflow di build e deploy e dalla verifica della versione pubblicata. La [configurazione Pages](github-pages-deployment.md) resta il riferimento per quel passaggio.
