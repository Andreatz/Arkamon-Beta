# Revisione dell’interfaccia e della progressione — 12 ottobre 2026

Il menù Partita usa sei schede degli strumenti e sei destinazioni nella barra superiore. Gli Arkastore si aprono esclusivamente dalle interazioni configurate sui pallini delle mappe delle città. Titolo, mappa principale e mappe locali condividono le cornici SVG del kit fornito. La battaglia mantiene i propri asset: la cornice SVG riguarda il solo pannello di stato del lancio dei dadi.

## Menù e accessi

La barra superiore contiene Menù Partita, Squadra, Deposito, Arkadex, Analisi e Borsa. Le sei schede centrali aprono Diario, Backup, Impostazioni, Cronache, Registro del match e Sfide. La barra inferiore duplicata e le copie dei comandi nel riepilogo sono rimosse.

Il solo comando di chiusura degli strumenti è **Riprendi il Viaggio**, nel footer di tutte le viste. Escape mantiene la stessa funzione; i dialoghi interni mantengono i propri comandi di annullamento. Il dialogo Partita non mostra un secondo Chiudi. Il focus torna al controllo che ha aperto la finestra.

Durante una sfida, Menù Partita mantiene disponibili Impostazioni e Sfide; gli strumenti della campagna restano bloccati. Consultare G2 non cambia il giocatore attivo o il suo turno.

## Arkastore sul pallino

In **Admin → Interazioni**, scegliere la città e il pallino, compilare il titolo e selezionare **Attività → Arkastore**. L’attività è ripetibile e non ha costi o premi di apertura; gli acquisti usano i prezzi del catalogo esistente. Il sistema non assegna negozi a coordinate non indicate dall’autore.

Gli Arkastore non sono selezionabili come tappe precedenti e il catalogo rifiuta dipendenze da negozi, perché apertura e acquisto non producono un completamento; un negozio può invece richiedere una missione completabile.

Il giocatore raggiunge il pallino e usa **Interagisci sul punto → Apri Arkastore**. L’apertura e la preparazione del carrello sono gratuite; il checkout compra tutti gli articoli insieme e conclude il turno. L’apertura chiude il pannello dell’interazione, così la ripresa torna alla mappa.

La navigazione non espone un tab Negozio e le Attività generali della città non contengono un Arkastore. L’evento di apertura richiede un ID di interazione effettivamente configurata e disponibile sul punto del giocatore attivo. Il checkout rilegge il catalogo corrente e controlla punto, città, requisiti, turno, assenza di battaglie, quantità, capienza e saldo: un negozio cancellato o disattivato non resta acquistabile perché il pannello era già aperto.

## EXP senza accumulo

Un KO valido assegna un punto EXP, usato immediatamente per un livello quando la fascia di squadra lo consente. Al cap di cinque livelli o al livello 100 il premio viene scartato. Cambiare squadra o fare un nuovo acquisto non recupera premi precedenti. Gli eventuali premi multipli vengono consumati soltanto entro il limite corrente; quelli residui, compresi quelli dopo una soglia evolutiva, non vengono conservati.

Deposito e Analisi non mostrano EXP o contatori del prossimo livello; sono mantenuti livello, crescita, HP, status, evoluzione e mosse. Rimossi anche gli avvisi di EXP conservata da Squadra e Arkadex. La cronaca distingue un livello realmente ottenuto da un premio KO scartato al cap.

L’EXP residua dei vecchi salvataggi viene azzerata nel recupero della squadra, del deposito e delle copie della battaglia. Lo stesso controllo vale per backup e campagna custodita dalle sfide. Restano invariati livelli già ottenuti, HP, status e checkpoint; un avviso descrive la rimozione dei residui. Gli HP non vengono curati quando il livello aumenta e la Suprema mantiene l’ordine danno al bersaglio → KO/esperienza → contraccolpo.

## Font e pulsanti

I font tornano alla configurazione originale del gioco: famiglia Azonix/Inter con fallback di sistema nelle scene; **Chela One** nei titoli degli strumenti e nelle mosse della battaglia; Segoe UI nei testi delle schermate del giocatore. Il file Chela One originale rimane locale.

`GameButton` riusa `button-default.svg`, `button-primary.svg` e la cornice di annullamento del medesimo kit nei comandi del titolo e delle mappe. Mantiene il pulsante HTML, focus, comandi da tastiera, stati disabilitati, riferimenti e preferenza per movimento ridotto. I percorsi passano per `assetUrl`, compresa la base GitHub Pages. Le creature e i pallini delle mappe conservano i propri asset. Il margine interno dei pulsanti prevale sul reset CSS e mantiene comodi anche i comandi di dimensione automatica.

In battaglia, mosse, Suprema, cattura, Borsa, Cronaca e gli altri comandi conservano esattamente le precedenti grafiche. Il pannello di stato che mostra **Lancio dei dadi…** usa la cornice SVG del kit; rimane un indicatore di stato e non introduce una nuova azione cliccabile.

Il fondo del pannello del tiro dei dadi passa dal **90% al 55% di opacità**, senza sfocatura dello scenario. Testi, numeri, dadi e risultato restano opachi. Non cambia la sequenza rivelazione → danno.

## Verifiche

I controlli riguardano il flusso locale React → stato del gioco → salvataggio → vista; gli strumenti della campagna non richiedono un backend esterno.

- Suite completa: **2.398 test in 109 file**, riusciti prima dell’ultima correzione delle grafiche. Dopo il ripristino sono riusciti **54 test mirati** di menù, schede, cronaca, catalogo e runtime delle interazioni, compreso il nuovo caso di dipendenza da un negozio.
- Build TypeScript/Vite finale con base GitHub Pages riuscita. Rimane l’avviso già presente sulle dimensioni dei moduli; i controlli non introducono un sistema di release degli asset o atlanti a pagine.
- Chrome sulla build finale: quattro scenari riusciti per titolo, mappa principale/città, percorso e battaglia. Verificati cornici caricate, pulsanti delle mosse con l’asset PNG originale, Chela One, SVG dello stato del lancio, fondo del dado al 55%, testi opachi e HP invariati prima della rivelazione.
- Menù con i font originali: **20 scenari desktop** riusciti, compresi i contenuti massimi a 1920×1080, 1920×945 e 1920×900; **9 scenari telefono** riusciti. Verificati selettore G2, assenza di scorrimento desktop, catalogo pieno, singola ripresa, focus, cure e acquisti persistenti.
- Editor reale: creazione di un Arkastore sul punto, salvataggio, ricaricamento, consultazione gratuita, acquisto con saldo **300 → 200**, G2 invariato e ripresa senza un dialogo sottostante rimasto aperto.
- I flussi di cap, backup, sfide, registro, oggetti, battaglie e accessibilità sono riusciti nelle prove desktop. I selettori dei test sono aggiornati ai sei strumenti e all’ingresso dal pallino.

Le esecuzioni sono distinte: un selettore del test del negozio è stato corretto usando il ruolo della casella; gli avvii interrotti durante una build concorrente o dopo la chiusura della preview sono stati ripetuti. Dei 20 scenari desktop, 19 sono passati nella prima esecuzione; il solo scenario con contenuti massimi è passato isolatamente sul codice invariato dopo un timeout all’avvio. I tentativi interrotti non sono conteggiati come prove riuscite. CI della PR e pubblicazione del sito rimangono verifiche separate.
