# CLAUDE.md — Contesto per Claude Code

> Questo file viene letto automaticamente da Claude Code ad ogni sessione.
> Contiene tutto ciò che serve per lavorare su Arkamon senza dover ricostruire il contesto ogni volta.

## 🎮 Cos'è Arkamon

Gioco ibrido **Pokémon × boardgame con dadi D6** (stile D&D), in versione web.
Originariamente prototipato in PowerPoint+VBA, ora React/TypeScript.

**Modalità di gioco**: 2 giocatori principali a turni + altri giocatori che interpretano Capipalestra e Rivale (ruoli PvP).

**Loop di gioco**:
1. Scelta starter in laboratorio (1 di 3, il terzo va al Rivale)
2. Movimento sulla mappa principale (città + percorsi)
3. Esplorazione cespugli (cattura Pokémon) e palestre (sfide)
4. Battaglie a turni: selvaggio / NPC / PvP
5. Progressione tramite XP, evoluzioni, badge

## 🏗️ Stack & comandi

- **Stack**: React 18 + TypeScript + Vite 5 + Tailwind 3 + Zustand
- **Node**: 18+
- **Pacchetto**: `npm` (NON usare yarn/pnpm in questa repo)

```bash
npm install      # prima volta
npm run dev      # http://localhost:3000 con hot reload
npm run build    # build produzione
npm run preview  # anteprima del build
```

⚠️ **NON eseguire MAI `npm audit fix --force`**: ha già rotto la repo una volta forzando Vite v5 → v8. Se vedi vulnerabilità "moderate" su dev-dependencies, ignorale. Vedi `INSTRUZIONI.md`.

## 📁 Architettura

```
src/
├── data/         JSON di gioco (pokemon, mosse, tipi, mappe…) + index.ts (loader tipizzato)
├── types/        Interfacce TypeScript del dominio
├── engine/       LOGICA PURA. Niente React/DOM qui. Testabile in isolamento.
├── store/        Stato globale Zustand + persistenza localStorage
├── scenes/       Schermate React (Titolo, Laboratorio, MappaPrincipale, Battaglia, …)
├── components/   UI riutilizzabile (HpBar, MoveButton, …)
├── App.tsx       Router scene
├── main.tsx      Entry React
└── index.css     Variabili CSS globali (--arka-*)
```

### Mappatura VBA → TS (riferimento storico)

| VBA originale            | TypeScript                      |
| ------------------------ | ------------------------------- |
| `Mod_Battle_Engine.bas`  | `src/engine/battleEngine.ts`    |
| `Mod_ButtonClick`        | `onClick` nei `.tsx`            |
| `Mod_UI_Manager.bas`     | componenti in `scenes/`         |
| `Mod_Game_Events.bas`    | actions dello store             |
| `Mod_Deposito.bas`       | `scenes/DepositoScene.tsx` + store |
| `Mod_Utilities.bas`      | helper in `engine/` e `data/`   |
| `Database.xlsx`          | JSON in `src/data/` + localStorage |

I file VBA originali sono in `old_files/` come riferimento — **non importarli**, solo consultarli per capire la logica.

## 🎯 Regole di game design (autoritative)

Queste regole sono **vincolanti** per qualsiasi feature: se devi modificarle, chiedimelo prima.

### Pokémon
- **Totale**: 110 specie
- **Starter**: ID 1, 5, 9 (4 fasi di evoluzione ciascuno)
- **Squadra**: massimo **6** in attivo, gli altri in deposito
- **Tipi**: 8 in totale → `Normale, Elettro, Fuoco, Terra, Acqua, Erba, Oscurità, Psico`
- **Resistenze/debolezze**: matrice 8×8 in `tipi.json`
- **HP per livello**: dipende dalla categoria del Pokémon (vedi `crescita_hp.json`)
- **Mosse**: 3 mosse attive per Pokémon (slot fissi). Danno = X dadi D6 + bonus livello fisso. X cresce di +1 ogni tot livelli (definito per mossa).

### Cespugli (incontri)
- 3-4 Pokémon per cespuglio, ciascuno con probabilità: comune / medio / difficile
- **Ogni cespuglio è visitabile UNA SOLA VOLTA per giocatore** (flag persistente)

### Combattimento (3 tipi)
Tutti a turni, basati su D6.

| Tipo            | Azioni giocatore         | Avversario controllato da |
| --------------- | ------------------------ | ------------------------- |
| **Selvaggio**   | Attacca (3 mosse) o Cattura | AI (solo attacca)        |
| **NPC**         | Attacca (3 mosse)        | AI (sceglie mossa migliore) |
| **PvP**         | Attacca (3 mosse)        | Terzo giocatore (pulsantiera dedicata) |

Fine battaglia → HP di tutti i Pokémon ripristinati al massimo, ritorno alla scena precedente.

### Mappa
- Città di partenza + percorsi grigi che collegano città / zone di transito (boschi, paesi)
- Ogni nodo ha una sotto-mappa con punti d'interesse: palestra, centro Pokémon, cespugli, NPC

## 📝 Convenzioni di codice

- **TypeScript strict**: niente `any` impliciti. Se serve, motivalo nel commento.
- **Engine puro**: `src/engine/*` non importa nulla da React, DOM, store. Funzioni pure per testabilità.
- **Determinismo**: i tiri di dadi passano per un helper `rollD6(n)` in `engine/` (così posso seedare nei test).
- **Store**: lo stato di gioco vive in `src/store/gameStore.ts` (Zustand). Le scene leggono via selettori, non destrutturano l'intero store.
- **Stile**: Tailwind con palette custom in `tailwind.config.js`. Colori globali via variabili CSS in `src/index.css` (`--arka-primary`, `--arka-bg`, ecc.). NON hardcodare `#xxxxxx` nei componenti.
- **Naming**: scene in `PascalCaseScene.tsx`, componenti in `PascalCase.tsx`, helper in `camelCase.ts`.
- **i18n**: il gioco è in **italiano**. Tutti i testi UI in italiano. I nomi delle variabili/funzioni in inglese (standard del codice).

## 🚫 Cose da NON fare

- ❌ NON lanciare `npm audit fix --force`
- ❌ NON aggiornare Vite oltre la 5.x senza un piano di migrazione
- ❌ NON aggiungere dipendenze pesanti senza chiedere (il bundle deve restare leggero per Tauri)
- ❌ NON spostare logica dell'engine dentro i componenti React
- ❌ NON usare `localStorage` direttamente nei componenti: passa sempre dallo store (che lo persiste)
- ❌ NON committare file di build (`dist/`, `node_modules/`)

## ✅ Workflow tipico per una feature

1. Aggiorna i tipi in `src/types/index.ts` se necessario
2. Aggiungi/modifica i dati in `src/data/*.json`
3. Aggiungi la logica pura in `src/engine/<nuovoModulo>.ts`
4. Aggiungi lo stato in `src/store/gameStore.ts`
5. Crea/modifica la scena in `src/scenes/<NomeScena>.tsx`
6. Componenti riutilizzabili in `src/components/`
7. Verifica con `npm run dev` e poi `npm run build` (deve passare senza errori TS)

## 🗺️ Roadmap corrente

- ✅ Fase 0: Setup
- ✅ Fase 1: Excel → JSON
- 🔶 Fase 2: Battle engine + scene base (parziale)
- ⏭️ **Fase 3**: Scena Percorso con cespugli interattivi ← **PROSSIMA**
- ⏭️ Fase 4: Scena Città (palestra, centro Pokémon)
- ⏭️ Fase 5: Sistema deposito/squadra completo
- ⏭️ Fase 6: Battaglie NPC e PVP a turni completi
- ⏭️ Fase 7: Animazione evoluzione, sistema XP
- ⏭️ Fase 8: Sprite reali (sostituire emoji), SFX
- ⏭️ Fase 9: Bilanciamento + capipalestra
- ⏭️ Fase 10: Build finale + Tauri (desktop)

## 💬 Stile delle risposte di Claude Code

- Scrivi in **italiano** (commenti in codice e messaggi all'utente)
- Quando proponi modifiche grosse, **mostra prima un piano** poi applica
- Se devi creare più file insieme, raggruppali in un'unica risposta
- Quando fai refactor, **non rompere l'API pubblica** delle funzioni dell'engine (le scene le importano)
- Dopo ogni modifica significativa, suggerisci di lanciare `npm run dev` e di verificare ad occhio

## 🆘 In caso di dubbio

Se la richiesta è ambigua, chiedi conferma prima di scrivere codice. Meglio una domanda in più che 200 righe da rifare.
