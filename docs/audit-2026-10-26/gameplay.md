# Audit gameplay e dominio — 26 ottobre 2026

## Ambito e metodo

Ispezionati i moduli correnti `src/engine`, `src/shop`, `src/league`, `src/interactions` e `src/challenges`, compresi i relativi test. Letti `docs/current-game-spec.md`, `docs/status.md` e `docs/mossa-suprema.md`; le note storiche non sono state considerate prova dello stato corrente. Consultati in sola lettura gli ingressi `gameStore`, Squadra/Deposito e Battaglia per distinguere funzioni pure da percorsi realmente raggiungibili.

Sono stati controllati danno e Suprema, KO simultaneo, XP prima del contraccolpo, status all'inizio del turno, cap di squadra, scambi, fabbrica delle istanze, selezione incontri, carrello atomico, possesso e utilizzo oggetti, requisiti e ricompense delle interazioni, sequenza della Lega, ripresa delle Sfide, isolamento della campagna e versioni delle regole condivise.

## Risultato

La prima verifica dei soli moduli di dominio non ha individuato nuovi bug P0/P1/P2. La successiva estensione alle scene reali ha invece riprodotto e corretto il bug P1 descritto sotto; il caso mostra il limite dei test del motore isolato. Le regole di danno e progressione sono rimaste invariate. La tabella dei tipi corrente non contiene immunità a moltiplicatore zero: il minimo di danno pari a 1 non costituisce quindi un bug attualmente riproducibile.

Il comando store `scambiaSlot` non controlla direttamente lo stato di battaglia (riferimento osservato `src/store/gameStore.ts:718`), ma gli ingressi Squadra e Deposito applicano `canManagePlayerTeam` prima di ogni modifica. Questo è stato segnalato all'audit store per valutare la difesa del confine dei comandi; non è presentato come perdita di creature riprodotta tramite l'interfaccia.

`src/shop/ArkaStorePanel.tsx` è un componente storico privo di utilizzatori correnti: richiama la verifica del negozio senza il contesto del pallino, e risulterebbe quindi sempre non disponibile se reintrodotto. La UI attuale usa l'altro percorso. Non viene classificato come blocco attivo del negozio.

La frase «l'inventario giocabile contiene solo la Masterball» in `docs/status.md` è storica: il catalogo corrente include Pozione, Superpozione, Rianimatore, Antidoto, Antiparalisi e Sveglia. Non ho modificato documenti al di fuori del rapporto assegnato; questo scarto non è stato usato per alterare cure o oggetti già testati.

## Verifiche eseguite

- `npx vitest run src/engine src/shop src/league src/interactions src/challenges --reporter=dot --outputFile.json=output/audit-2026-10-26/gameplay-tests.json --reporter=json`: **406 test superati in 23 file**. Durata test 3,17 secondi. Il rapporto JSON registra i singoli casi.
- Verifica indipendente caricando i moduli reali tramite Vite SSR: **700 combinazioni di scambio** con squadra da 0 a 6, slot occupati/vuoti e primi/ultimi slot dei box. Conservazione di tutte le istanze, limite di 6 e immutabilità degli input: superati.
- Stessa verifica sui dati reali: **3.680 calcoli di attacco** per tutte le 110 forme, livelli 5/14/15/20/35/55/99/100, ogni mossa disponibile e RNG minimo/massimo. Danno intero, finito e non negativo; dadi nel range 1–6: superati.
- Rapporto delle invarianti: `output/audit-2026-10-26/gameplay-invariants.json`.

## Limiti

Le verifiche delle invarianti sono deterministiche e non equivalgono a una campagna interamente giocata dall'inizio. I test di dominio includono errori di scrittura per Sfide/Lega, ma questo sotto-audit non prova controller remoto, database ospitato, browser, OBS o distribuzione. La copertura e le correzioni negli altri moduli sono documentate dagli altri responsabili dell'audit.

## Estensione alle scene reali: bug P1 confermato e corretto

L'estensione richiesta alle scene Battaglia, mappe e ritorni ha individuato un problema che i test del motore puro non coprivano.

### P1 — Battaglie selvatiche legacy prive delle riserve del giocatore

**Origine:** `src/scenes/PercorsoScene.tsx:72` e `src/scenes/MappaGrigliaScene.tsx:408` costruiscono la richiesta di battaglia senza `squadraA`. Il confine store precedente controllava il cap usando il roster di campagna, ma salvava la richiesta originale senza completarlo. `src/scenes/BattagliaScene.tsx:329` ripiegava quindi su `[pokemonA]`. Alla ricerca di una riserva dopo un KO (`BattagliaScene.tsx:1025`) la lista era vuota, anche quando la campagna possedeva compagni vivi. Anche il cap di progressione e la Borsa di quello scontro leggevano una squadra incompleta.

**Riproduzione prima della correzione:** browser Chromium isolato, server locale 3014, dati dimostrativi con Vyrath livello 10 a 1 HP e avvelenato, Darklaw livello 10 a 12 HP. Percorso 1 → scorciatoia esplicita del GM → Cespuglio A → Soffio. Il veleno manda Vyrath KO prima dell'attacco; la schermata dichiara sconfitta invece di offrire il cambio. La campagna contiene due creature e Darklaw conserva 12 HP, ma il checkpoint della battaglia contiene solo Vyrath. Nessun errore JavaScript. Evidenza: `output/audit-2026-10-26/legacy-wild-before.json` e `legacy-wild-before.png`.

**Correzione:** `src/store/gameStore.ts:739` completa `squadraA` con il roster del giocatore attivo quando il chiamante lo omette. La creatura attiva viene presa dalla stessa copia canonica del roster; un lead assente, KO, di livello non valido, con HP non finiti o oltre il massimo non apre la battaglia. Il massimo HP viene ricalcolato. Una squadra esplicitamente fornita resta esplicita. Non sono state cambiate le scene o le regole di danno/XP.

**Prima/dopo:** i sette nuovi casi `src/engine/__tests__/battleEntry.test.ts` fallivano prima della modifica e passano dopo. Coprono G1/Percorso e G2/griglia, riserva viva e KO, veleno del lead, assenza di sconfitta prematura, cap basato sulle riserve, serializzazione/ripresa del checkpoint, squadra esplicita e lead non validi.

**Prova completa dopo:** stesso ingresso del browser, stesso stato iniziale. Il KO apre «Scegli un Pokemon», il checkpoint salva `phase: switch`, il reload conserva HP e riserva, Darklaw entra, il turno avversario viene eseguito, una Masterball cattura il selvatico e Prosegui torna a Percorso 1 con tre creature, il lead KO e la riserva ancora viva. Evidenza: `legacy-wild-after.json` e `legacy-wild-after-switch.png` nella stessa cartella. Script diagnostico locale ripetibile: `legacy-wild-live.mjs`.

**Test permanenti aggiunti:** `e2e/legacy-wild-roster.spec.ts` riproduce l'intero flusso reale, senza sostituire i dadi. Esecuzione isolata con output separato: **2/2 superati, Chromium desktop e profilo mobile**, 12 secondi. La suite estesa dominio + scene + componenti battle + feature store + persistenza EXP supera **565/565 test in 45 file** (`output/audit-2026-10-26/gameplay-expanded-tests.json`). I warning del renderer server dei test scene e dello storage stub sono preesistenti e non compaiono come errori nella prova browser.

## Limiti dell'estensione

I file delle scene, dei callback e dei preloader sono stati letti, comprese cancellazione timer, attesa delle pagine native, VFX, dadi, cambio avversario e coda evoluzioni. La prova browser mirata verifica il flusso Percorso/KO/sostituzione/ripresa/cattura/ritorno; la griglia è coperta dal confine store e dai test di dominio, non da una seconda partita browser completa. Non equivale a giocare tutta la campagna o a verificare ogni sequenza multigiocatore in rete. Nessun commit o push eseguito da questo sotto-audit.
