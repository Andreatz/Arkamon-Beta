# Audit completo Arkamon — stato verificato il 20 ottobre 2026

> Archivio del 20 ottobre 2026: **Snapshot iniziale e piano**. Origine nella cartella della sessione: `outputs/Audit-Completo-2026-10-20.md`. I rilievi e i conteggi descrivono quella fase; leggere [stato e provenienza](./README.md) per gli interventi successivi. I link al codice puntano ai file correnti; i numeri di riga sono quelli rilevati durante l'audit.


Checkout analizzato: `C:/Users/andre/Documents/Codex/2026-10-19/https-github-com-andreatz-arkamon-beta/checkout`
Commit: `ea4dcab344cf4030757b4c9bb00f4890b4421be4`

Questo documento riunisce gli audit tecnici, grafici e di navigazione già prodotti nella sessione. Non modifica il prodotto. Le fixture DEMO e i contesti browser usati per le prove sono separati dalla campagna reale.

## Stato della verifica

- **Build TypeScript/Vite:** riuscita. `typecheck-final.log` è vuoto e `build-audit-runtime.log` termina con `✓ built`.
- **Test Vitest:** **162 file, 3.856 test superati** in `unit-tests-verified.log`.
- **Catalogo VFX:** controllo riuscito, **276 voci**.
- **Anteprime isolate dello Studio:** **47 schermate/varianti**, senza errori di pagina o immagini rotte (`preview-coverage.json`). Sono preview reali dei componenti, non sostituiscono i flussi di gioco.
- **Navigazione runtime già acquisita:** 33 passaggi reali su build locale, senza errori di pagina o risposte HTTP fallite (`real-browser-coverage.json`).
- **E2E completo:** 358 casi, **260 passati, 9 falliti, 89 saltati**. I dettagli sono in `e2e-current.log`.
- **Asset pubblici:** 13.654 file, 8.690.270.963 byte; verifica fisica completata rispetto al tree Git per ogni file (`public-restoration.json`). Gli originali non sono stati modificati.

I nove E2E falliti non hanno lo stesso significato:

1. Due varianti Arkastore non trovano l’input quantità Masterball nel flusso iniziale.
2. Due varianti della Borsa in battaglia usano `toHaveValue` su un controllo che non è un input.
3. Due varianti storage bloccato non trovano il nodo titolo atteso.
4. Un controllo Studio non vede il fondo sostitutivo atteso del gruppo messaggi.
5. Un controllo Studio confronta il testo del comando senza il cursore visivo `▸`.
6. Un controllo Studio cerca una cornice di servizio che il DOM corrente non espone più in quel punto.

I primi due gruppi richiedono una decisione sul contratto del test e sui ruoli ARIA prima di essere classificati come regressioni di prodotto. Gli ultimi tre indicano invece una sincronizzazione incompleta tra aspettative dello Studio e renderer corrente: vanno corretti insieme alla semantica degli ID e dei ruoli, non con selettori più fragili.

## Cosa funziona bene e va conservato

Il dominio è più solido della superficie grafica: motore puro con RNG iniettato, checkpoint e scrittura durevole prima della pubblicazione, backup con validazione e journal, proprietà esclusiva della scheda, challenge separata dalla campagna, catalogo pubblico a whitelist, cache native con budget, playback preparato prima dei cue, PNG frontali ufficiali nelle schermate statiche e movimento ridotto già previsto.

La gestione giocatore è visivamente riconoscibile e completa: Menù Partita, Squadra, Deposito, Arkadex, Analisi, Borsa, Arkastore, Registro, Backup, Impostazioni, Gara, Ripresa e Sfide. Lo Studio UI espone 25 schermate base e 22 viste interne o mappe. I sette laboratori sono realmente collegati al renderer del progetto.

Le schermate catturate mostrano una direzione già forte: fondali originali, creature leggibili, ritratti ufficiali, cornici coerenti, mappa italiana riconoscibile, battaglia con soggetto e bersaglio chiari. La qualità cresce soprattutto con gerarchia, spazio, timing e stati, senza dover sostituire subito l’identità esistente.

## Rilievi applicativi prioritari

### C01 — P1: attività ripetibili nella visita fallback

L’ingresso da MappaPrincipale consuma già il turno. Il problema è successivo: Città e Percorso, quando non hanno una mappa locale, impostano `interazioneDisponibile` a vero e consumano l’interazione soltanto se esiste `localMap`. Dopo il ritorno da una battaglia si possono quindi avviare attività ulteriori nella stessa visita fallback senza un nuovo consumo. La riproduzione da browser è ancora da trasformare in test di regressione dedicato; le 14 mappe fallback sono state renderizzate senza errori (`fallback-coverage.json`).

Correzione: introdurre un’attività prenotata all’ingresso e consumarla una sola volta, oppure passare sempre dal comando di dominio delle mappe locali. Non basta invertire il controllo su `availableTurn`, perché bloccherebbe la prima attività valida.

### C02 — P2: evoluzione non registrata come attività busy

La prova runtime mostra che durante l’evoluzione il pulsante di pausa è attivo ma la specie cambia comunque dopo il timer: specie 1 → 2 con pausa attivata (`critical-browser-coverage.json`). Il contratto della regia promette una pausa fra azioni e una ripresa dallo stesso punto. L’attività deve entrare nel registro busy fino a scrittura conclusa; il timer non deve proseguire dietro un overlay di pausa.

### C03 — P2: scene persistibili senza renderer

Il recupero accetta `palestra`, `centro-pokemon` e `squadra`, mentre il router non ha casi corrispondenti. Un backup storico può quindi essere formalmente valido e portare alla scena non implementata. Centralizzare il registro delle scene oppure migrare esplicitamente i valori storici verso pannelli esistenti.

### C04 — P3: feedback di riordino squadra

`TeamScreen` mostra il successo dopo `scambiaSlot`, ma lo store può rifiutare l’operazione. Restituire un esito tipizzato o confrontare le istanze dopo il comando; riusare il comportamento già presente in Deposito.

### C05 — P3: importazioni concorrenti

Il pannello di configurazione ha bisogno della stessa revisione di lettura già usata dal backup: una lettura file lenta non deve sostituire un’anteprima più recente, né riapparire dopo Annulla.

### C16–C18 — rischi aggiunti dalla revisione di dominio

- Catalogo interazioni invalido: il loader può degradare a elenco vuoto senza un avviso di recupero dedicato.
- Importazione solo catalogo con configurazione Lega identica: il salvataggio può essere un no-op per confronto byte; se il journal sopravvive dopo il successo, il recupero può interpretarlo come importazione non completata. È un percorso derivato dal codice e non ancora riprodotto.
- Errore tardivo del controller ospite: il ramo di errore non verifica sempre revisione/sessione corrente; il rischio è un messaggio vecchio nella sessione nuova, non l’applicazione dimostrata di un token obsoleto.

Gli altri rilievi di architettura sono dettagliati in [Audit-Codice.md](./Audit-Codice.md) e [Ampliamento-Audit-Codice.md](./Ampliamento-Audit-Codice.md).

## Rilievi UI, layout e Studio

### Overflow reale a 1280×900

La cattura responsive misura:

- Squadra: contenitore 1.194px, contenuto 1.298px; shell `scrollWidth` 1.328px.
- Arkadex: contenuto 1.268px; shell `scrollWidth` 1.298px.
- Le colonne minime sono 420 + 390 + 440 per Squadra e 420 + 370 + 430 per Arkadex, oltre a gap e padding.

Il breakpoint desktop parte già da 1100×820. A 1920×1080 tutto rientra; a 390×844 il ramo mobile impila i contenuti. Il caso intermedio deve diventare una modalità esplicita a due colonne o un inspector laterale comprimibile, non un overflow casuale.

### Scala font non uniforme

Con `--arka-font-scale: 1.25`, il root/body arrivano a 20px, ma shell resta 22px e il nome della squadra 23px. La scala globale esiste ma molte dimensioni sono ancora pixel fissi. Portare la tipografia a token relativi e definire una scala dati separata da titoli e pulsanti.

### Studio UI: tastiera e mappe

La prova reale dello Studio mostra che una freccia destra mentre è focalizzata la tab “Elemento” sposta di 1px l’elemento selezionato (`studio-keyboard`), perché il listener globale ascolta la freccia oltre il listener della tab. Il controllo deve ignorare `button`, `role=tab` ed eventi già prevenuti.

Le viste `citta:Venezia` e `percorso:Percorso_X` hanno chiavi specifiche nello Studio. Il registro runtime risolve invece principalmente `citta`/`percorso` e aggiunge suffissi soltanto per alcune viste. La prova corrente mostra che il marker importato e applicato è stato visto nel runtime, quindi non c’è una base sufficiente per dichiarare un bug generale di map override; resta necessario aggiungere un E2E che verifichi il singolo luogo con un marker non ambiguo e il reload.

Lo Studio scrive gli upload in IndexedDB prima che la bozza sia applicata. Un upload misto fallito o una bozza scartata può lasciare file non referenziati; serve garbage collection basata sui riferimenti di bozza, applicato e undo, senza eliminare dati condivisi indiscriminatamente.

### Mappa a griglia in modalità authoring

La scena a griglia riallinea posizioni mancanti al mount e i suoi handler WASD/frecce/click non sono interamente protetti da `layoutEditing`. È un percorso legacy/studio, non una prova di rottura del normale percorso italiano, ma l’authoring dovrebbe essere non mutante per definizione.

### Drag Admin della mappa principale

I drag di nodi e strade installano listener window senza filtro pointerId, pointercancel, blur o cleanup unmount, mentre `adminPointerDrag.ts` offre già un helper più robusto. Convergere sul helper comune.

## Cosa mostrano le schermate

La battaglia ha un forte assetto scenico, ma il grande riquadro centrale e le carte comando grigie competono con creature, HP e bersaglio. Il redesign dovrebbe rendere il rapporto attore → bersaglio → dado → esito più evidente e lasciare il VFX come conseguenza, non come rivale del testo.

La Squadra usa bene lista, ritratto e inspector, ma a 1280px la composizione non ha spazio sufficiente. Il Deposito rende troppo presenti i 35 cerchi vuoti; il focus e il contenuto selezionato devono dominare la griglia. I laboratori Regole, Dadi e VFX usano troppo Norwester piccolo e maiuscolo per le spiegazioni; ArkamonLab è un riferimento interno migliore perché combina titoli Norwester e corpo più leggibile.

Nel Dice Lab sei dadi mostrano overflow orizzontale effettivo durante il giro. Nel VFX Lab il GIF SharkKick quasi scompare su fondo chiaro e viene ritagliato a scala 1.25 vicino al margine. Il VFX va verificato su più fondali e con un rapporto preview coerente con l’arena reale.

La timeline reale della battaglia ha mostrato: click a 441ms, pannello dadi visibile a 5.770ms, danno a 7.933ms, messaggio di impatto e turno avversario a 9.821ms. Sono campioni sotto carico di audit, non benchmark FPS, ma indicano che la decisione successiva attende la coda visuale. La separazione fra risultato logico e reveal è corretta; occorre ridurre soltanto la coda decorativa dove non aggiunge informazione.

## Direzione grafica consigliata

1. **Arena prima, regolazioni dopo:** più spazio al soggetto e al bersaglio; pannelli compatti agganciati al contesto.
2. **Tre densità della stessa identità:** pubblico con stato e spettacolo, giocatore con decisione e conseguenza, GM con configurazione e diagnosi.
3. **Lista → identità → inspector:** stessa grammatica per Squadra, Deposito, Arkadex e Analisi.
4. **Conseguenza prima della conferma:** mossa, dado richiesto, modificatori, effetto noto e parte dipendente dal tiro.
5. **Motion causale:** anticipazione → azione → impatto → dado → HP/status → assestamento; skip della presentazione senza rilanciare risultati.
6. **Laboratori con flusso comune:** scegli, configura, anteprima, confronta, conserva. Preset rapidi sopra, dettagli tecnici sotto.
7. **Gerarchia selettiva:** un accento per selezione, colori di tipo solo quando informativi, meno cornici simultanee, dati con carattere leggibile e cifre tabulari.

## Piano di implementazione

### Fase 0 — baseline

Congelare le catture e gli invarianti attuali. Correggere i test E2E che usano ruoli o aspettative non coerenti con il DOM reale; poi rieseguire Arkastore, storage e Studio isolatamente.

### Fase 1 — layout e tipografia

Rifare Squadra e Arkadex a 1280×900 con modalità a due colonne/inspector; portare font e spazi a token relativi; verificare 1920×1080, 1366×768, 1280×900, 390×844 e scala 1.25.

### Fase 2 — verticale Squadra → Analisi → Borsa

Scegliere la famiglia più rappresentativa e definire componenti condivisi per selezione, stato, HP, mossa, oggetto e conferma. Confrontare stesso dato prima/dopo senza alterare la campagna.

### Fase 3 — strumenti e Deposito

Ridurre peso degli slot vuoti, rendere chiari filtro/target/azione, mantenere ritorno e focus, consolidare Menù, Arkadex, Registro e Arkastore sulla stessa grammatica.

### Fase 4 — mappe e fallback

Chiudere C01, rendere authoring non mutante, uniformare mappe locali e fallback, aggiungere prova a campagna DEMO per ogni luogo senza mappa.

### Fase 5 — battaglia, VFX e audio

Misurare una mossa normale, cura, Suprema e KO con velocità normale/rapida/ridotta. Sbloccare il dado al cue informativo corretto; conservare il risultato autorevole; validare fondali, retro, GIF, sprite sheet e audio con esempi scelti.

### Fase 6 — Studio e distribuzione

Correggere frecce/tab, chiavi delle viste mappa, GC degli upload, drag pointer-safe, scene persistite/router e pipeline CI→artifact→deploy. Aggiungere smoke browser contro `dist` con base Pages.

Questa sequenza produce il salto grafico più grande con rischio contenuto: prima rende affidabile lo spazio, poi stabilizza un linguaggio visivo su una famiglia completa, quindi lo propaga agli strumenti e infine rifinisce i momenti spettacolari.

## Allegati

- [Audit del codice](./Audit-Codice.md)
- [Ampliamento audit codice](./Ampliamento-Audit-Codice.md)
- [Copertura revisione codice](./Copertura-Revisione-Codice.md)
- [Audit UI, movimento e VFX](./Audit-UI-Movimento.md)
- [Mappa schermate e laboratori](./Mappa-Schermate-Laboratori.md)
- [Riferimenti RPG](./Riferimenti-RPG.md)
- [Audit browser dei laboratori](./Laboratori-Verifica-Browser.md)
- [Copertura responsive](./README.md#evidenze-locali-non-incluse) (origine locale: `outputs/evidence/responsive-coverage.json`)
- [Copertura Studio isolato](./README.md#evidenze-locali-non-incluse) (origine locale: `outputs/evidence/preview-coverage.json`)
- [Copertura runtime reale](./README.md#evidenze-locali-non-incluse) (origine locale: `outputs/evidence/real-browser-coverage.json`)
- [Timeline battaglia e prove critiche](./README.md#evidenze-locali-non-incluse) (origine locale: `outputs/evidence/critical-browser-coverage.json`)
- [Prove runtime aggiuntive](./README.md#evidenze-locali-non-incluse) (origine locale: `outputs/evidence/additional-runtime-coverage.json`)
- [E2E completo](./README.md#evidenze-locali-non-incluse) (origine locale: `outputs/evidence/e2e-current.log`)
- [Fixture DEMO](./README.md#evidenze-locali-non-incluse) (origine locale: `outputs/evidence/fixtures/LEGGIMI-fixture-DEMO.md`)
