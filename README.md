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
- Test: **161/161 verdi**
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
- Overworld a griglia MVP: movimento a turni, 2 azioni, interazioni, camera responsive, Percorso_1, Venezia, Piacenza e mappa-principale griglia.
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
```

## Script

```bash
npm run dev       # server locale Vite
npm run build     # type-check + build produzione
npm run preview   # preview dist/
npm test          # suite Vitest
```

## Roadmap Breve

- [x] Fase A: parita VBA core
- [x] Fase B: stati, cure, Supreme, oggetti
- [x] Fase C: sprite, sfondi, animazioni, code-splitting
- [x] Fase BR: Battle Refresh
- [x] Fase E.1-E.6: Overworld a griglia MVP
- [ ] Fase E.7-E.9: polish overworld restante, debug grid, asset definitivi
- [ ] Fase E.8: migrazione incrementale delle restanti mappe a griglia
- [ ] Fase C audio: sound effects e musica
- [ ] Fase D desktop: build Tauri

Per il piano completo vedi [ROADMAP.md](./ROADMAP.md).

## Deploy

Il workflow GitHub Pages e' in `.github/workflows/deploy.yml`.

Per buildare con base GitHub Pages:

```bash
GITHUB_PAGES=true npm run build
```

## Desktop

Tauri e' ancora una fase futura. Il piano previsto:

```bash
npm install --save-dev @tauri-apps/cli
npx tauri init
npx tauri build
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
