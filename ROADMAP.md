# Roadmap & Stato Attuale - Arkamon

Aggiornato: **25 maggio 2026**.

Questo documento sostituisce la vecchia roadmap congelata su Battle Refresh: la fase BR e' ora completa e l'overworld a griglia e' gia in MVP giocabile fino a E.6.

## Stato Sintetico

| Indicatore | Valore |
| --- | --- |
| Branch attivo | `main` |
| Ultimo commit base | `6964a7f` |
| Test | `npm test` -> **161/161 verdi** |
| Build | `npm run build` pulito |
| Stack | React 18, TypeScript, Vite 5, Tailwind 3, Zustand, framer-motion, Vitest 2 |
| Loop giocabile | titolo -> laboratorio -> mappa -> percorso/citta -> battaglia -> evoluzione/deposito -> ritorno |
| Prossima fase | **E.7/E.9 - polish overworld a griglia** |

## Fasi Completate

### Fase A - Parita VBA Core

- Engine puro in `src/engine/battleEngine.ts`: danno, iniziativa, cattura, AI, XP, evoluzione, monete.
- Incontri selvatici pesati in `src/engine/encounters.ts`.
- Deposito/scambio slot in `src/engine/deposito.ts`.
- Store Zustand persistito con serializzazione `Set`.
- Scene base: titolo, laboratorio, mappa, percorso, citta, battaglia, evoluzione, deposito.

### Fase B - Estensioni Di Gameplay

- Stati alterati: Confuso, Addormentato, Avvelenato.
- Modello BR.3: stato singolo, applicazione sicura, durata da `valoreEffetto`.
- Cure HP e cure che rimuovono veleno.
- Mosse Supreme con autodanno.
- Masterball in inventario, uso e migrazione save.
- PvP locale con passaggio esplicito del controllo.

### Fase C - Polish Visivo Gia Fatto

- Sprite reali da `public/sprites/{front,back,small}_sprites`.
- Sfondi reali mappati in `src/data/backgrounds.ts`.
- Animazioni battaglia ed evoluzione con framer-motion.
- Code splitting Vite per react, motion e zustand.

### Fase BR - Battle Refresh

Completata.

- HP bar PNG da `public/ui/hp_bar_player.png` e `hp_bar_enemy.png`.
- InfoBox con asset `public/ui/infobox.png` e messaggi a blocchi per azione.
- Pulsanti mosse con asset `public/ui/move_button.png`.
- Sprite battaglia ingranditi e non pixelated.
- Pulsante `Avversario...` per avanzare il turno avversario.
- Modal scambio post-KO con squadra a 6 slot.
- Pulsante finale `Prosegui`.
- Formula cattura VBA: `tassoCattura * (3 - hp/hpMax)`.
- Turno post-KO NPC passa al nuovo Pokemon avversario.
- Rivale e Capipalestra hanno squadre complete da 6 Pokemon.
- Test dati dedicato per squadre principali e riferimenti Pokemon.

### Fase D - Distribuzione Web

- GitHub Pages configurato con workflow.
- `assetUrl()` applicato agli asset runtime.
- Vite `base` usa `/Arkamon-Beta/` quando `GITHUB_PAGES=true`.

### Fase E.1-E.6 - Overworld A Griglia MVP

Completata come MVP.

- Tipi dominio: `Casella`, `MappaGriglia`, `PosizioneAvatar`, `StatoTurnoOverworld`.
- Engine movimento puro in `src/engine/movimento.ts`.
- Store: posizioni avatar, turno overworld, azioni, caselle consumate.
- `MappaGrigliaScene`: due avatar, click, tastiera, 2 azioni, interazioni.
- Interazioni: cespuglio -> battaglia selvatica, allenatore -> battaglia NPC/PvP, centro -> cura, deposito -> scena deposito, uscita -> transizione.
- Mappe iniziali in `src/data/mappe-griglia/`: `mappa-principale`, `Percorso_1`, `Venezia`.
- Test movimento, store overworld e sanity check mappe.

## Test Suite

| Area | Test |
| --- | ---: |
| Battle engine | 25 |
| Monete | 7 |
| Encounters | 8 |
| Stati | 16 |
| Cure | 12 |
| Supreme | 7 |
| Deposito | 12 |
| Movimento overworld | 34 |
| Store overworld | 14 |
| Mappe griglia | 24 |
| Dati allenatori | 2 |
| **Totale** | **161** |

Nota: i test store possono stampare warning Zustand sullo storage non disponibile in Vitest. Sono warning attesi e non bloccanti.

## Prossime Fasi

### Priorita 1 - E.7/E.9 Polish Overworld

Obiettivo: rendere l'MVP griglia piu piacevole e robusto su desktop/mobile.

- [x] Celle responsive invece di dimensione fissa.
- [x] Camera/pan che segue il giocatore attivo quando la mappa supera il viewport.
- [x] Indicatori per caselle consumate dal giocatore attivo.
- Transizioni mappa piu chiare.
- Overlay debug griglia opzionale.
- Miglior leggenda.
- Avatar piu leggibili, con differenziazione giocatore 1/2.

### Priorita 2 - E.8 Migrazione Mappe Restanti

Obiettivo: portare le restanti citta e percorsi nel formato `MappaGriglia`.

- [x] Piacenza migrata con Luca (301), Centro Pokemon, deposito e uscita verso mappa-principale.
- Definire JSON/TS mappe per gli altri luoghi.
- Registrarle in `src/data/mappe-griglia/index.ts`.
- Collegare le uscite da `mappa-principale`.
- Mantenere scene 2D come fallback finche la migrazione non e' completa.

### Priorita 3 - Bilanciamento

- Playthrough completo.
- Livelli allenatori e capipalestra.
- Economia monete.
- Distribuzione incontri nei cespugli.
- Frequenza e potenza stati/cure/Supreme.

### Priorita 4 - Audio

- SoundManager.
- Effetti: click, battle-start, hit, KO, cattura, vittoria, level-up, evoluzione.
- Musica per titolo, mappa, battaglia, evoluzione.
- Toggle muto persistito.

### Priorita 5 - Desktop Tauri

- Inizializzazione Tauri.
- Script `tauri:dev` e `tauri:build`.
- Config finestra desktop.
- Build installer Windows.

## Regole Tecniche

- Vite resta bloccato a 5.x.
- Vitest resta a 2.x.
- L'engine resta senza React/DOM.
- Randomness sempre iniettabile con `rng?: () => number`.
- I tiri di dado passano da `rollD6`.
- Non cambiare la matrice tipi a x2: il sistema usa x1.5 intenzionalmente.
- Nuove feature: dati -> engine -> store -> scena -> test.

## Output Verificabile Corrente

```bash
npm run build
npm test
```

Entrambi devono restare verdi prima di considerare chiusa una fase.
