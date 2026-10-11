# Arkamon

Gioco ibrido tra Pokemon e boardgame con dadi D6, costruito con **React + TypeScript + Vite + Tailwind**.

Versione web del progetto originariamente prototipato in PowerPoint + VBA.

## Avvio Rapido

Requisiti: **Node.js 20.19+**.

```bash
npm install
npm run dev
# apri http://localhost:3000

npm run build
npm run preview
npm test
```

## Stato Attuale

- Ultima verifica dell’interfaccia: **11 ottobre 2026**, [sette viste SVG integrate nel gioco](./docs/player-ui-svg-integration.md); [audit generale del progetto del 10 ottobre](./docs/project-audit-2026-10-10.md).
- Nuovi strumenti: [diario, backup completo, editor delle interazioni, cronache e impostazioni](./docs/player-tools.md); [verifica dell'integrazione](./docs/improvements-audit-2026-10-10.md).
- Nuove modalità: [Arkadex, Arkastore, registro del match, sfide a seed e Fanta-Team](./docs/arkadex-arkastore-challenges.md), con cap di cinque livelli in squadra; [verifica delle cinque funzioni](./docs/game-features-audit-2026-10-10.md).
- Anteprime grafiche: [sette schermate e kit SVG fornito](./docs/ui-previews/README.md), con confronto della versione precedente, catture desktop/telefono e pacchetti scaricabili.
- Interfaccia nel gioco: **Partita → Menù Partita, Squadra, Deposito, Arkadex, Analisi, Borsa e Negozio** usa i dati reali della campagna e il kit SVG fornito. Anche **Città → Attività → Arkastore** e la scena **Deposito** usano le nuove viste; [accessi, regole e verifiche locali](./docs/player-ui-svg-integration.md). Le anteprime grafiche precedenti conservano dati dimostrativi.
- Layout completo a **1920×1080 senza scorrimento** nelle sette viste: sei membri e 35 posti del box visibili insieme, Arkadex a pagine con schede dedicate, Borsa con uso dell’oggetto selezionato e Negozio con catalogo e carrello completi. Su schermi più piccoli resta disponibile un layout adattabile; [disposizione e verifiche](./docs/player-ui-svg-integration.md#una-schermata-completa-a-19201080).
- Verifica locale dell’integrazione UI: TypeScript senza errori, **2.112 test in 106 file**, **66 prove browser desktop/telefono superate** (quattro prove riservate al desktop escluse sul telefono) e controllo Axe delle sette viste senza violazioni rilevate. I 47 SVG sono identici all’archivio fornito.
- Build web dell’integrazione completata con base GitHub Pages `/Arkamon-Beta/`; verificati nel browser l’apertura dell’applicazione, le nuove viste e il caricamento dei 47 SVG. CI e pubblicazione online sono passaggi distinti: il sito si aggiorna dopo il merge della PR e il deploy.
- Test: il rapporto corrente contiene il risultato della suite completa e delle prove nel browser; i rapporti precedenti restano storici.
- Verifica interattiva del gameplay: **completata per i passaggi documentati**; [verifica generale](./docs/gameplay-audit-2026-10-06.md), [verifica status/doppio KO](./docs/status-and-double-ko-audit-2026-10-06.md) e [correzione paralisi/sonno](./docs/status-corrections-audit-2026-10-06.md) del 6 ottobre 2026.
- Loop giocabile: titolo -> laboratorio -> mappa -> percorso/citta -> battaglia -> evoluzione/deposito -> ritorno
- Verifica mappe locali: [movimento dei due giocatori e budget condiviso](./docs/local-maps-audit-2026-10-06.md).

## Funzionalita Implementate

- Dati convertiti in JSON: 110 Pokemon, 229 mosse runtime (incluse 9 mosse di paralisi), tipi, mappe, incontri e allenatori; catalogo di 276 mosse per le anteprime VFX/audio.
- Battle engine: danno D6, bonus STAB sulle debolezze tipo, iniziativa, cattura, AI, XP, monete.
- Battle Refresh completato: sprite grandi, HP bar PNG, InfoBox a blocchi, pulsante avversario, modal scambio post-KO, pulsante `Prosegui`.
- [Stati alterati e segnalini](./docs/status.md): paralisi permanente fino a una cura e iniziativa per seconda; d6 1–2 impedisce l'attacco, 3–6 lo permette. Sonno fino a 3 turni, con primo turno obbligatorio senza dado e risveglio 4–6 dal secondo. Veleno crescente 10%→20%→30% degli HP massimi; stato singolo e mosse di cura che rimuovono paralisi e veleno anche a HP pieni.
- Mosse speciali: cure percentuali, Masterball e pulsante [Mossa Suprema](./docs/mossa-suprema.md) per giocatore e avversario PvP: scegli un attacco, infliggi il doppio del danno e perdi il 50% degli HP massimi (arrotondato per difetto, minimo 1 HP). Il KO del bersaglio assegna XP e livelli prima del contraccolpo; nel doppio KO vince lo specifico scontro chi ha attaccato.
- Battaglie selvatiche, NPC, Capopalestra e PvP locale.
- Rivale e Capipalestra con squadre complete da 6 Pokemon.
- Deposito con box, squadra, selezione e scambio slot.
- Sette viste degli strumenti dell’allenatore con kit SVG, navigazione comune G1/G2, layout desktop/telefono e condizioni reali degli Arkamon. Consultare l’altro giocatore non cambia il turno attivo; scambi, cure e acquisti rispettano i controlli della campagna.
- Evoluzione post-battaglia con animazione.
- Mappa principale con movimento a turni, percorsi e citta interattivi.
- [Mappe locali di città e percorsi](./docs/local-maps.md): 16 immagini con pallini e strade percorribili, posizioni separate per G1/G2, curve e ponti, salvataggi e comandi accessibili. Budget condiviso con la mappa principale: due movimenti oppure un movimento e un'interazione. I nuovi punti attendono l'assegnazione delle loro interazioni; le attività esistenti restano in un pannello dedicato.
- Bilanciamento codificato: progressione mappe, range livelli, economia, incontri e soglie stati/cure/Supreme.
- Audio da file per mosse, eventi, dadi e transizioni; musica generativa Web Audio per scene, effetti generativi di riserva e toggle muto persistito.
- Scaffold desktop Tauri 2 con configurazione finestra e script dedicati.
- Votazioni del pubblico con QR separati per NPC e Capipalestra/PvP; [configurazione e utilizzo](./docs/audienceVoting.md).
- Menu **Partita**: diario individuale e riepilogo del turno, backup versionato con anteprima/ripristino/copia precedente, archivio delle ultime 20 battaglie e preferenze separate per musica, effetti, velocità e movimento ridotto.
- **Admin → Interazioni**: dialoghi, cure, incontri, requisiti e ricompense sui pallini; completamento individuale/condiviso, tappe collegate, import/export JSON e adattatore Tiled. Strade, ID e regole di accesso conservati.
- Cronaca esplicativa e consultazione dei risultati già rivelati, esportabili senza nuovi dadi; test browser desktop/mobile e controlli di accessibilità in CI.
- Arkadex individuale con specie viste/ottenute, informazioni nascoste prima della scoperta e animazioni su richiesta; registro complessivo della campagna esportabile.
- Arkastore nelle città, carrello atomico e Borsa fuori/dentro battaglia: Pozioni, Rianimatori, cure degli status e Masterball.
- Squadre con differenza massima di cinque livelli: catture fuori fascia nel deposito e XP conservata al cap, senza cambiare HP o livelli dei vecchi salvataggi.
- Sfide a seed e Fanta-Team Builder con sei specie al livello 20, budget 100, codici condivisibili, salvataggi separati e classifica locale della stessa configurazione.
- Pubblicazione GitHub Pages tramite il workflow Vite: [configurazione e verifica della sorgente GitHub Actions](./docs/github-pages-deployment.md). Il workflow pubblica `dist/`; una build locale riuscita non conferma un deploy online.

## Architettura

```text
src/
  data/                 Dati statici e loader tipizzati
    mappe-griglia/      Prototipo legacy dell'overworld a griglia
  engine/               Logica pura testabile
  store/                Stato globale Zustand + localStorage
  save/                 Recupero, serializzazione e ripristino della campagna
  interactions/         Catalogo, editor e risoluzione delle attività dei pallini
  journal/              Diario individuale e riepilogo del turno
  settings/             Menu partita, preferenze audio e animazioni
  player-ui/            Sette viste SVG collegate alla campagna reale
  scenes/               Schermate React
  types/                Tipi dominio condivisi
  utils/                Helper runtime asset
public/
  backgrounds/          Sfondi scena
  maps/                 Mappe principali
  sprites/              Sprite front/back/small
  ui/                   Asset UI da prototipo PowerPoint
src-tauri/              Shell desktop Tauri 2
```

## Script

```bash
npm run dev       # server locale Vite
npm run build     # type-check + build produzione
npm run preview   # preview dist/
npm test          # suite Vitest
npm run test:e2e  # flussi desktop/mobile + accessibilità, richiede Chromium
npm run tauri:dev # app desktop in sviluppo, richiede Rust/Cargo
npm run tauri:build # build desktop/installer, richiede Rust/Cargo
```

## Modalita Admin Grafica

Arkamon include una modalita admin locale per modificare colori, UI, asset e preset grafici.

Attivazione: `CTRL + SHIFT + A`

La configurazione viene salvata separatamente dalla partita.

Vedi: [docs/ADMIN_MODE.md](./docs/ADMIN_MODE.md)

## Roadmap Breve

- [x] Fase A: parita VBA core
- [x] Fase B: stati, cure, Supreme, oggetti
- [x] Fase C: sprite, sfondi, animazioni, code-splitting
- [x] Fase BR: Battle Refresh
- [x] Mappa principale alternativa con movimento a turni
- [x] Priorita 3: bilanciamento
- [x] Fase C audio: sound effects e musica
- [x] Fase D desktop: scaffold Tauri
- [ ] Verifica di un nuovo installer Windows con le correzioni correnti (le verifiche precedenti sono storiche).

Per il piano completo vedi [ROADMAP.md](./ROADMAP.md).

## Deploy

Il workflow GitHub Pages e' in `.github/workflows/deploy.yml`.

Con il repository privato e il piano rilevato nelle verifiche precedenti, Pages non risultava disponibile. Il repository resta privato per scelta dell'utente. Verificare l'hosting scelto prima di considerare pubblicata una release.

Per buildare con base GitHub Pages:

```bash
GITHUB_PAGES=true npm run build
```

## Desktop

Il progetto include lo scaffold Tauri 2 in `src-tauri/`.

Requisiti desktop: **Node.js 20.19+** e **Rust/Cargo**.

```bash
npm run tauri:dev
npm run tauri:build
```

La build web resta disponibile anche senza toolchain Rust:

```bash
npm run build
```

Per produrre l'installer Windows:

```bash
npx tauri build
```

Output atteso:

```text
src-tauri/target/release/arkamon.exe
src-tauri/target/release/bundle/msi/Arkamon_0.1.0_x64_en-US.msi
src-tauri/target/release/bundle/nsis/Arkamon_0.1.0_x64-setup.exe
```

## Mappatura VBA -> TypeScript

| VBA originale | TypeScript |
| --- | --- |
| `Mod_Battle_Engine.bas` | `src/engine/battleEngine.ts` |
| `Mod_Game_Events.bas` | `src/store/gameStore.ts` |
| `Mod_Deposito.bas` | `src/engine/deposito.ts` + `src/scenes/DepositoScene.tsx` |
| `Mod_UI_Manager.bas` | scene React e asset in `public/ui/` |
| `Database.xlsx` | JSON in `src/data/` |

## Licenza

Privata.
