# 🎮 Arkamon

Gioco ibrido tra Pokémon e boardgame con dadi D6, costruito con **React + TypeScript + Vite + Tailwind**.

Versione web del progetto originariamente prototipato in PowerPoint+VBA.

## 🚀 Avvio rapido

Requisiti: **Node.js 18+** ([scarica qui](https://nodejs.org)).

```bash
# Installa le dipendenze (la prima volta)
npm install

# Avvia il server di sviluppo (con hot reload)
npm run dev
# → apri http://localhost:3000

# Compila per la produzione
npm run build

# Anteprima del build
npm run preview
```

## 📁 Architettura

```
arkamon/
├── public/                # Asset statici (immagini, suoni)
├── src/
│   ├── data/              # 📊 Dati di gioco (JSON convertiti dall'Excel originale)
│   │   ├── pokemon.json   # 110 specie
│   │   ├── mosse.json     # 220 mosse con scaling per livello
│   │   ├── tipi.json      # Matrice di efficacia 8x8
│   │   ├── crescita_hp.json
│   │   ├── mappe.json
│   │   ├── incontri.json  # Pokemon nei cespugli
│   │   ├── allenatori.json
│   │   └── index.ts       # ⭐ Loader tipizzato + funzioni di lookup
│   │
│   ├── types/             # 🏷️ Interfacce TypeScript del dominio
│   │   └── index.ts
│   │
│   ├── engine/            # ⚙️ Logica pura (NO UI, testabile)
│   │   └── battleEngine.ts  # Porting di Mod_Battle_Engine.bas
│   │
│   ├── store/             # 💾 Stato globale (Zustand) con localStorage
│   │   └── gameStore.ts   # Sostituisce Stato_Giocatore + Battaglia_Corrente
│   │
│   ├── scenes/            # 🎬 Schermate del gioco (componenti React)
│   │   ├── TitoloScene.tsx
│   │   ├── LaboratorioScene.tsx
│   │   ├── MappaPrincipaleScene.tsx
│   │   └── BattagliaScene.tsx
│   │
│   ├── components/        # 🧩 UI riutilizzabile (HpBar, MoveButton, ...)
│   │
│   ├── App.tsx            # Router scene
│   ├── main.tsx           # Entry React
│   └── index.css          # 🎨 Tema globale (modifica le variabili qui!)
│
├── tailwind.config.js     # 🎨 Colori, font, animazioni custom
├── vite.config.ts         # Configurazione build
└── tsconfig.json          # TypeScript
```

## 🎨 Come modificare l'interfaccia grafica

L'aspetto del gioco è controllato in 3 punti:

1. **Colori globali** → `src/index.css` (variabili `--arka-*`)
2. **Tema esteso (font, animazioni, palette tipi)** → `tailwind.config.js`
3. **Layout di una scena specifica** → file `.tsx` corrispondente in `src/scenes/`

Esempi pratici:

```css
/* Vuoi cambiare il colore "accento" del gioco? */
/* src/index.css */
:root {
  --arka-primary: #ff6b6b;  /* prima era giallo, ora rosso */
}
```

```tsx
/* Vuoi spostare un punto sulla mappa? */
/* src/scenes/MappaPrincipaleScene.tsx */
const PUNTI = [
  { id: 'venezia', x: 60, y: 25, ... },  // <- modifica qui
]
```

Tutte le modifiche si vedono **istantaneamente** in browser (hot reload).

## 🌐 Deploy su GitHub Pages

```bash
# Una tantum: aggiungi nel package.json un campo "homepage"
# "homepage": "https://Andreatz.github.io/Arkamon"

# Pubblica
GITHUB_PAGES=true npm run deploy
```

Per il deploy automatico ad ogni push: vedi `.github/workflows/deploy.yml`.

## 🖥️ Distribuzione come app desktop

Quando vorrai un eseguibile Windows/Mac/Linux:

```bash
# Installa Tauri (più leggero di Electron)
npm install --save-dev @tauri-apps/cli
npx tauri init
npx tauri build
```

Tauri produce un installer di ~5MB (vs ~100MB di Electron) wrappando il sito in una webview nativa.

## 🛠️ Roadmap di sviluppo

- [x] **Fase 0**: Setup progetto (Vite + React + TS + Tailwind)
- [x] **Fase 1**: Conversione Excel → JSON
- [x] **Fase 2 (parziale)**: Battle engine (calcolo danno, AI, cattura)
- [x] **Fase 2 (parziale)**: Scene base (Titolo, Laboratorio, Mappa, Battaglia)
- [ ] **Fase 3**: Scena Percorso con cespugli interattivi
- [ ] **Fase 4**: Scena Città con palestra e centro pokemon
- [ ] **Fase 5**: Sistema deposito/squadra completo
- [ ] **Fase 6**: Battaglie NPC e PVP a turni completi
- [ ] **Fase 7**: Animazione evoluzione, sistema XP
- [ ] **Fase 8**: Sprite reali (sostituire emoji), sound effects
- [ ] **Fase 9**: Bilanciamento contenuti, capipalestra
- [ ] **Fase 10**: Build finale + Tauri per desktop

## 🧬 Mappatura VBA → TypeScript

| File VBA originale          | Equivalente TS                   |
|-----------------------------|----------------------------------|
| `Mod_Battle_Engine.bas`     | `src/engine/battleEngine.ts`     |
| `Mod_ButtonClick_Handlers`  | gestiti da `onClick` nei `.tsx`  |
| `Mod_UI_Manager.bas`        | componenti React in `scenes/`    |
| `Mod_Game_Events.bas`       | actions dello store              |
| `Mod_Deposito.bas`          | `scenes/DepositoScene.tsx` + store |
| `Mod_Utilities.bas`         | helper in `engine/` e `data/`    |
| `Database.xlsx`             | JSON in `src/data/` + `localStorage` per il salvataggio |

## 📜 Licenza

Privata.
