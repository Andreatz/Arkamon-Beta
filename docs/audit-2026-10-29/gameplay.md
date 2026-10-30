# Audit gameplay e dominio — 29 ottobre 2026

## Risultato

Un bug **P1** nuovo confermato su motore, store e ingresso reale del browser. Nessuna modifica ai sorgenti, ai test esistenti o a Git.

### P1 — Prosegui può perdere livelli e HP di una squadra finale valida

**File:** `src/scenes/BattagliaScene.tsx:833`, controllo che causa il rifiuto in `src/store/gameStore.ts:525` (azione da riga 515).

Il gestore `tornaIndietro` salva gli Arkamon della squadra di battaglia uno alla volta mediante `aggiornaPokemon`. Ogni aggiornamento verifica la differenza fra livelli contro il roster di campagna già parzialmente aggiornato. La transazione rende durevole il gruppo di modifiche, ma non evita il rifiuto di un membro intermedio.

**Trigger raggiungibile:** squadra di campagna in ordine `[compagno A Lv10 KO, compagno B Lv5 vivo]`. Il comando NPC sceglie B come primo vivo. Durante uno scontro con più avversari, B ottiene un KO e sale a 6; viene usato un Rianimatore su A; B cade e A entra in campo; A ottiene un KO e sale a 11. La squadra finale `[A Lv11 vivo, B Lv6 KO]` rispetta esattamente il cap di cinque livelli.

Al click su **Prosegui**, il loop tenta prima A11 contro B5 ancora nel roster di campagna: il gap transitorio è sei, quindi `aggiornaPokemon` rifiuta tutto l'aggiornamento di A. Poi B6 viene salvato, la battaglia viene cancellata e le ricompense vengono assegnate. A conserva il vecchio Lv10 e i vecchi HP0. Anche gli HP recuperati col Rianimatore vengono persi; il consumo dell'oggetto, già salvato durante lo scontro, non viene annullato.

**Atteso:** squadra `[Lv11/11HP, Lv6/0HP]`.

**Effettivo riprodotto:** `[Lv10/0HP, Lv6/0HP]`, +200 monete e allenatore 202 sconfitto. Tutta la squadra diventa KO dopo una vittoria. Un'ulteriore ricarica conserva il danno.

**Prova sullo store:** `node output/audit-2026-10-29/gameplay/settlement-order.mjs`. Usa i moduli reali `applicaXPDopoKO`, `teamProgressionLimit`, `resolveItemEffect` e lo stesso loop del gestore finale, senza cambiare il codice del gioco. Risultato completo: `settlement-order.json`.

**Prova browser:** `node output/audit-2026-10-29/gameplay/settlement-order-browser.mjs`, usando il server QA già avviato su 3069. Chromium 1920×1080, un contesto isolato; carica il checkpoint concluso, ricarica prima dell'azione, preme il **Prosegui reale**, controlla il salvataggio e ricarica ancora. Nessun errore JavaScript. Screenshot `settlement-order-before.png` e `settlement-order-after.png`; stato prima/dopo/ricaricato in `settlement-order-browser.json`.

La parte precedente dello scontro è un fixture generato da moduli reali; questa prova browser non afferma di aver eseguito tutti i dadi, le animazioni e le selezioni della sequenza precedente.

**Direzione di correzione:** validare identità e cap della squadra finale nel suo insieme, applicare HP/status/livelli di tutti i membri in un singolo comando di chiusura e cancellare lo scontro solo dopo il commit riuscito. Il guard di gestione ordinaria non deve decidere su una combinazione temporanea di roster precedente e finale. La Lega ha già un percorso che valida/applica la squadra completa e non usa questo loop.

## Ambito ispezionato

- Specifica del format, rapporti `docs/audit-2026-10-26/gameplay.md` e `docs/structural-2026-10-26/domain.md`, per distinguere i problemi precedenti già corretti.
- `src/store/gameStore.ts` e i comandi `game/commandPolicy`, `rosterCommands`, `battleCommands`, `leagueActions`.
- Motore danno/Suprema, KO simultaneo, EXP/cap/evoluzioni, status e ordine dei round; riserve, cattura e consumo oggetti nella scena Battaglia; cleanup e ritorno alle scene.
- Flussi di ingresso città/percorso/griglia/mappa locale, interazioni configurate, requisiti/costi/ricompense, acquisti e uso oggetti; modello e scena Lega; Sfide e ripristino della campagna; scena Evoluzione.
- Coerenza riferimenti catalogo, modelli e test già presenti. Non sono trattate come bug le chiamate arbitrarie alle API interne prive di un ingresso reale.

## Controllo indipendente aggiuntivo

`node output/audit-2026-10-29/gameplay/invariants.mjs`, con Vite SSR, cache esclusiva e nessun browser/build. Risultato `invariants.json`: **zero anomalie** su:

- 110 specie e 566 riferimenti a mosse/evoluzioni/allenatori/incontri;
- 15.912 risoluzioni offensive, campionando livelli 5/6/14/15/20/35/55/99/100, RNG estremo, entrambi i lati, azione ordinaria/Suprema consentita;
- 59.400 risoluzioni status (tutti gli status, HP0/1/massimi, azione offensiva/non offensiva);
- 103.950 applicazioni di oggetti sui dati reali;
- 896 scambi fra squadra e primi/ultimi slot del deposito, con verifica di conservazione identità, limite sei e immutabilità degli input.

La prima configurazione del probe aveva discovery dipendenze predefinita e poteva interferire con la cache Vite condivisa. È stata fermata e corretta con `cacheDir` separato in `output/.../gameplay` e `optimizeDeps.noDiscovery=true`. La seconda esecuzione con cache isolata è conclusa senza errori. Questo incidente dell'harness non è un finding del gioco.

## Ipotesi scartate e limiti

L'ID deterministico degli incontri configurati sembrava permettere catture duplicate tramite ripetizione; lo schema impedisce incontri/bush/trainer ripetibili, e una vittoria/cattura ne registra il completamento. Mancando un ingresso reale corrente non è riportato come bug. Il guard di cura ordinaria è volutamente separato dal costo turno, già applicato dalle interazioni chiamanti, come da correzione precedente.

Le invarianti pure non equivalgono a una campagna interamente giocata. Trasporto ospite/pubblico, sincronizzazione finestre, backend remoto, distribuzione, asset/animazioni e layout completi sono competenza degli altri sotto-audit. Questo rapporto non afferma copertura totale delle sequenze del gioco e non introduce regole diverse dal format GM/G1/G2 corrente.
