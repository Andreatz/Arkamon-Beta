# 🎯 Prompt per Claude Code — Arkamon

> Set di prompt copia-incolla per portare avanti Arkamon fase per fase.
> Lanciali in ordine; ognuno presuppone che il precedente sia completato.

---

## 0. Avvio della sessione (sempre)

Quando apri Claude Code nella cartella del progetto, **non serve nessun prompt iniziale**: Claude Code legge automaticamente `CLAUDE.md`.

Per il primo onboarding di Claude Code, però, è utile far fare un giro di ricognizione:

```
Hai appena letto CLAUDE.md. Per favore:
1. Apri src/types/index.ts e fammi un riassunto delle interfacce esistenti
2. Apri src/engine/battleEngine.ts e dimmi che funzioni espone e quali sono incomplete (TODO, stub, throw)
3. Apri src/store/gameStore.ts e mostrami lo shape dello stato
4. Confronta con la roadmap in CLAUDE.md e dimmi quali file servono per la Fase 3 (scena Percorso con cespugli)

Non scrivere ancora codice. Voglio prima un piano.
```

---

## 1. Fase 3 — Scena Percorso con cespugli interattivi

### 1.1 Pianificazione

```
Voglio implementare la Fase 3: la scena Percorso.

Specifiche:
- Un percorso è un sotto-livello accessibile dalla MappaPrincipale (es. "Percorso 1")
- La scena mostra una vista dall'alto con cespugli posizionati sulla mappa
- Cliccando un cespuglio: il giocatore può "perlustrarlo"
- Ogni cespuglio ha 3-4 Pokémon con rarità (comune/medio/difficile) → tira un D6 per decidere quale appare (o nessuno con bassa probabilità)
- Se appare un Pokémon, parte una BattagliaScene di tipo "selvaggio"
- Ogni cespuglio è visitabile UNA SOLA VOLTA per giocatore: dopo la perlustrazione il cespuglio diventa "vuoto" e il flag va salvato nello store (persistente)

Prima di scrivere codice, mostrami:
1. Le modifiche ai tipi (Cespuglio, Percorso, stato visitato per giocatore)
2. La struttura JSON che useremo per i dati dei cespugli
3. Lo skeleton della scena PercorsoScene.tsx
4. Le nuove action dello store
5. Come si integra con la MappaPrincipaleScene (transizione "vai al Percorso 1")

Aspetta il mio ok prima di implementare.
```

### 1.2 Implementazione

```
Il piano va bene. Procedi con l'implementazione.

Vincoli:
- Un solo round di cambi: aggiorna tutti i file necessari in questa risposta
- Niente sprite reali per ora: usa emoji 🌳 per cespuglio attivo, 🍃 per cespuglio già visitato
- La scelta del Pokémon che appare deve passare da una funzione pura in src/engine/encounter.ts (così la posso testare)
- Ricorda di aggiornare i tipi in src/types/index.ts
- Aggiorna anche il README se la roadmap cambia
```

### 1.3 Test rapido

```
Genera un file di esempio src/data/incontri.json con 2 percorsi e 3 cespugli ciascuno (usando Pokémon esistenti in pokemon.json), così posso testare la scena subito.

Se incontri.json esiste già, leggilo prima e integra senza sovrascrivere.
```

---

## 2. Fase 4 — Scena Città (palestra, centro Pokémon)

```
Implementiamo la Fase 4: scena Città.

Specifiche:
- Una città è un sotto-livello con edifici cliccabili: PALESTRA, CENTRO POKÉMON, NEGOZIO (placeholder), CASA NPC (almeno uno)
- CENTRO POKÉMON: cura tutti i Pokémon della squadra (HP al massimo) → mostra un'animazione/messaggio di 1.5s e torna
- PALESTRA: apre una sub-scena PalestraScene con il Capopalestra. Per ora: solo un dialogo "Vuoi sfidarmi?" → se sì, parte una battaglia di tipo NPC (o PvP se un terzo giocatore è presente — vedi più sotto)
- NEGOZIO: solo placeholder con messaggio "Coming soon"
- NPC nelle case: dialogo statico da JSON

Stessa procedura: prima il piano (tipi, JSON, struttura scene), poi aspetta ok, poi implementi.
```

---

## 3. Fase 5 — Sistema deposito/squadra completo

```
Implementiamo il sistema di gestione squadra/deposito.

Regole (vedi CLAUDE.md):
- Massimo 6 Pokémon in squadra attiva
- Tutti gli altri vanno nel "deposito" (illimitato)
- Quando catturo un Pokémon e ho già 6 in squadra, viene messo direttamente in deposito (con notifica)
- DepositoScene: griglia con tutti i Pokémon, pulsanti per scambiare con uno della squadra, vedere statistiche, rinominare (opzionale)
- Le operazioni di scambio sono possibili solo nel CENTRO POKÉMON

Crea:
- src/scenes/DepositoScene.tsx
- src/components/PokemonCard.tsx (riutilizzabile in squadra/deposito)
- Action nello store: aggiungiAlDeposito, scambiaSquadraDeposito, rilascia (con conferma)

Persistenza in localStorage via Zustand.
```

---

## 4. Fase 6 — Battaglie NPC e PvP complete

### 4.1 NPC

```
Completiamo la battaglia NPC.

L'AI dell'allenatore NPC deve:
1. Per ogni mossa disponibile, calcolare il danno atteso contro il Pokémon avversario (tenendo conto del tipo)
2. Aggiungere un piccolo fattore casuale (±15%) per non essere prevedibile
3. Se il Pokémon attivo è in pericolo (HP < 30%), considerare lo switch al Pokémon successivo (se presente)

Crea src/engine/trainerAI.ts con una funzione pura `chooseMove(state) → Action`. Testabile.
Poi integrala nella BattagliaScene quando il tipo è 'npc'.
```

### 4.2 PvP

```
Implementiamo la modalità PvP.

In una battaglia PvP, l'avversario non è un'AI ma un TERZO giocatore (Capopalestra/Rivale interpretato da un'altra persona allo stesso schermo).

UI:
- Stesso layout della battaglia, ma in basso ci sono DUE pulsantiere mosse: una per il Giocatore attivo, una per il giocatore-avversario
- I turni si alternano: solo la pulsantiera del giocatore di turno è abilitata
- Il giocatore di turno seleziona la mossa, viene risolta, poi tocca all'altro

Aggiungi un selettore in BattagliaScene per scegliere il tipo (selvaggio/npc/pvp). Per ora il PvP si triggera solo da una palestra che ha il flag pvp:true nei dati.
```

---

## 5. Fase 7 — XP ed evoluzioni

```
Aggiungiamo il sistema di esperienza ed evoluzione.

Regole:
- Vincere una battaglia → tutti i Pokémon usati ricevono XP
- XP necessaria per livellare: formula in src/engine/leveling.ts (proponi tu una formula classica, tipo XP = livello^2 * 4)
- Salire di livello: ricalcola HP max in base alla categoria di crescita (vedi crescita_hp.json), aggiorna danno mosse (X D6 cresce ogni tot livelli come da mossa)
- Evoluzione: gli starter (ID 1, 5, 9) hanno 4 fasi. Soglie di evoluzione: livelli 16, 32, 48 (proponibili)
- Animazione evoluzione: schermata dedicata con il nome che cambia, fade Pokémon vecchio → nuovo

Crea:
- src/engine/leveling.ts (puro)
- src/engine/evolution.ts (puro)
- src/scenes/EvoluzioneScene.tsx (animazione)
- Integra nella fine battaglia (BattagliaScene)
```

---

## 6. Fasi successive (8-10) — Polish & deploy

### 6.1 Sprite

```
Sostituiamo le emoji con sprite reali.

Approccio:
- Metti gli sprite in public/assets/pokemon/<id>.png (front view) e public/assets/pokemon/<id>_back.png (back view)
- Crea src/components/PokemonSprite.tsx che decide quale sprite mostrare in base a {pokemonId, view: 'front'|'back'}
- Fallback: se lo sprite non esiste ancora, mostra l'emoji
- Per i nemici in battaglia: front view; per il Pokémon del giocatore: back view (come nei giochi originali)

Non aggiungere sprite per i 110 Pokémon adesso: mostra solo come gestire il sistema con un esempio (1-2 Pokémon).
```

### 6.2 Sound effects

```
Aggiungiamo SFX di base.

Eventi sonori:
- Selezione menu (click)
- Inizio battaglia
- Attacco (genericho)
- Pokémon avversario K.O.
- Cattura riuscita
- Fanfara vittoria

Crea src/audio/SoundManager.ts con una API:
- preload(sfxName)
- play(sfxName, volume?)
- mute() / unmute()

Integra un toggle muto nelle impostazioni (nuova UI minimale in alto a destra).
File audio in public/assets/audio/. Per ora usa file placeholder vuoti se non li ho ancora.
```

### 6.3 Tauri (desktop)

```
Configuriamo Tauri per produrre un eseguibile desktop.

- Installa @tauri-apps/cli come devDependency
- Esegui tauri init con:
  - app name: Arkamon
  - window title: Arkamon
  - dist dir: ../dist
  - dev path: http://localhost:3000
- Aggiorna .gitignore per ignorare src-tauri/target
- Aggiungi script npm: "tauri:dev", "tauri:build"

Mostrami il diff prima di applicare.
```

---

## 🛠️ Prompt di manutenzione utili

### Refactor
```
Hai introdotto duplicazione tra <FileA> e <FileB>. Estrai il codice comune in un helper in src/engine/ o src/components/ a seconda del tipo. Mantieni l'API esterna invariata.
```

### Bug
```
Sto vedendo questo bug: <descrizione>. Apri i file rilevanti, formula 2-3 ipotesi sulla causa con un livello di confidenza, poi proponi la fix. Non patchare alla cieca.
```

### Test rapido
```
Aggiungi un test in src/engine/__tests__/<nome>.test.ts per la funzione <X>. Usa vitest. Se vitest non è installato, mostrami il comando di installazione prima di scrivere il test.
```

### Performance
```
Apri React DevTools profiler mentalmente: la scena <X> ri-renderizza troppo spesso. Identifica i selettori Zustand e i useEffect colpevoli. Proponi memo / selettori più stretti, senza cambiare il comportamento.
```

---

## 📌 Suggerimenti pratici per usare Claude Code

1. **Sessione corta = qualità alta**: chiudi la sessione e riaprila quando cambi argomento — il contesto resta più pulito.
2. **Lascia fare il giro di ricognizione**: il primo prompt di ogni sessione dovrebbe essere "leggi questi 3 file e riassumimi". Eviti che inventi.
3. **Pretendi il piano prima del codice**: per feature > 50 righe, chiedi sempre il piano prima.
4. **Versiona prima di modificare grossi pezzi**: `git commit` prima di lasciare a Claude un task ampio. Se va male, `git reset --hard`.
5. **Branch dedicato per esperimenti**: `git checkout -b prova-feature-X` → se non ti piace, `git checkout main` e basta.
