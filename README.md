# Arkamon

Gioco ibrido tra Pokemon e boardgame con dadi D6, costruito con **React + TypeScript + Vite + Tailwind**.

Versione web del progetto originariamente prototipato in PowerPoint + VBA.

## Avvio Rapido

Requisiti: **Node.js 18+**.

```bash
npm install
npm run dev
# apri http://localhost:3000

npm run build
npm run preview
npm test
```

## Stato Attuale

- Branch di lavoro: `main`
- Ultima verifica: **25 maggio 2026**
- Build: `npm run build` pulito
- Test: **309/309 verdi**
- Loop giocabile: titolo -> laboratorio -> mappa -> percorso/citta -> battaglia -> evoluzione/deposito -> ritorno

## Funzionalita Implementate

- Dati convertiti in JSON: 110 Pokemon, 220 mosse, tipi, mappe, incontri e allenatori.
- Battle engine allineato al VBA: danno D6, STAB, efficacia tipi, iniziativa, cattura, AI, XP, monete.
- Battle Refresh completato: sprite grandi, HP bar PNG, InfoBox a blocchi, pulsante avversario, modal scambio post-KO, pulsante `Prosegui`.
- Stati alterati: Confuso, Addormentato, Avvelenato, immunita stato singolo, cura che rimuove veleno.
- Mosse speciali: cure percentuali, mosse Supreme con autodanno, Masterball.
- Battaglie selvatiche, NPC, Capopalestra e PvP locale.
- Rivale e Capipalestra con squadre complete da 6 Pokemon.
- Deposito con box, squadra, selezione e scambio slot.
- Evoluzione post-battaglia con animazione.
- Overworld a griglia completo in formato `MappaGriglia`: movimento a turni, 2 azioni, interazioni, camera responsive, debug grid, transizioni chiare, avatar leggibili, tutte le citta e tutti i percorsi storici registrati.
- Bilanciamento codificato: progressione mappe, range livelli, economia, incontri e soglie stati/cure/Supreme.
- Audio generativo Web Audio: musica per scene, effetti principali e toggle muto persistito.
- Scaffold desktop Tauri 2 con configurazione finestra e script dedicati.
- Deploy GitHub Pages configurato.

## Architettura

```text
src/
  data/                 Dati statici e loader tipizzati
    mappe-griglia/      Mappe MVP del nuovo overworld
  engine/               Logica pura testabile
  store/                Stato globale Zustand + localStorage
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
- [x] Fase E.1-E.6: Overworld a griglia MVP
- [x] Fase E.7-E.9: polish overworld
- [x] Fase E.8: migrazione completa delle mappe a griglia
- [x] Priorita 3: bilanciamento
- [x] Fase C audio: sound effects e musica
- [x] Fase D desktop: scaffold Tauri
- [x] Fase D desktop: installer Windows verificato

Per il piano completo vedi [ROADMAP.md](./ROADMAP.md).

## Deploy

Il workflow GitHub Pages e' in `.github/workflows/deploy.yml`.

Per buildare con base GitHub Pages:

```bash
GITHUB_PAGES=true npm run build
```

## Desktop

Il progetto include lo scaffold Tauri 2 in `src-tauri/`.

Requisiti desktop: **Node.js 18+** e **Rust/Cargo**.

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
