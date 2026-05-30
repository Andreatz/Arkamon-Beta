# ROADMAP — Nuovo sistema VFX mosse per Arkamon

## Obiettivo

Sostituire l’attuale sistema VFX delle mosse basato su SVG procedurali con un sistema più simile a GIF, sprite sheet e immagini animate, in stile cartoon/action RPG, come gli asset allegati:

- `60FPS_FA01_01_Slash.png`
- `60FPS_FA01_02_Thrust.png`
- `60FPS_FA01_03_Punch.png`
- `60FPS_FA01_04_Buff.png`
- `60FPS_FA01_05_Debuff.png`
- `60FPS_FA01_06_Shimmer.png`
- `60FPS_FA01_07_Cure.png`
- `60FPS_FA01_08_Shield.png`
- `60FPS_FA01_09_Barrier.png`
- `60FPS_FA01_10_Burst.png`
- `Confuse.gif`
- `Cure(1).gif`
- `GuardBreak.gif`
- `GutsPunch.gif`
- `Acqua 3.gif`
- `Combined Cartoon Action Effects 01 Color.gif`
- `energy_11.gif`
- `Simple Dynamic Cartoon Effects 18 Color.gif`

Il nuovo sistema deve:

1. Eliminare progressivamente la dipendenza visiva dagli SVG generati.
2. Usare sprite sheet PNG/WebP e GIF trasparenti.
3. Essere configurabile per tipo mossa, effetto speciale e singola mossa.
4. Funzionare sia per il giocatore sia per l’avversario.
5. Supportare VFX su bersaglio nemico, su sé stessi, a centro campo e full-screen.
6. Restare compatibile con il flusso attuale di `BattagliaScene`.
7. Non rompere build, test, layout admin o logica di combattimento.

---

## Contesto tecnico della repo

Repository:

```txt
https://github.com/Andreatz/Arkamon-Beta
```

Stack tecnico:

- React 18
- TypeScript strict
- Vite
- Framer Motion
- Zustand
- Vitest
- Tailwind

Comandi da rispettare:

```bash
npm run build
npm run test
npm run dev
```

File importanti:

```txt
src/scenes/BattagliaScene.tsx
src/components/MoveVfx.tsx
src/types/index.ts
src/data/index.ts
src/data/mosse.json
src/utils/assetUrl.ts
```

Attualmente `BattagliaScene.tsx` importa e usa:

```ts
MOVE_VFX_VISIBLE_MS
MoveVfx
MoveVfxEvent
MoveVfxSide
MoveVfxTarget
```

Il nuovo sistema deve mantenere inizialmente questa API pubblica, così da ridurre il rischio di regressioni.

---

# FASE 0 — Branch, backup e inventario

## Obiettivo

Preparare una base sicura per lavorare.

## Task Codex

1. Crea un branch:

```bash
git checkout -b feat/sprite-vfx-system
```

2. Non cancellare subito `MoveVfx.tsx`.
3. Prima crea una sostituzione compatibile.
4. Verifica che il progetto parta e compili:

```bash
npm install
npm run build
npm run test
```

## Criteri di accettazione

- La build iniziale deve passare prima delle modifiche.
- Nessun file core del battle engine deve essere modificato in questa fase.
- Nessun asset deve essere importato direttamente da `src` se verrà usato come path runtime. Usare `public/` e `assetUrl`.

---

# FASE 1 — Struttura asset VFX

## Obiettivo

Creare una struttura ordinata per gli asset animati.

## Cartelle da creare

```txt
public/
  vfx/
    moves/
      slash/
      thrust/
      punch/
      buff/
      debuff/
      shimmer/
      cure/
      shield/
      barrier/
      burst/
      confuse/
      water/
      energy/
      break/
      misc/
```

## Convenzione nomi

Rinominare gli asset in modo pulito, senza spazi e senza parentesi:

```txt
public/vfx/moves/slash/slash_60fps.png
public/vfx/moves/thrust/thrust_60fps.png
public/vfx/moves/punch/punch_60fps.png
public/vfx/moves/buff/buff_60fps.png
public/vfx/moves/debuff/debuff_60fps.png
public/vfx/moves/shimmer/shimmer_60fps.png
public/vfx/moves/cure/cure_60fps.png
public/vfx/moves/shield/shield_60fps.png
public/vfx/moves/barrier/barrier_60fps.png
public/vfx/moves/burst/burst_60fps.png

public/vfx/moves/confuse/confuse.gif
public/vfx/moves/cure/cure.gif
public/vfx/moves/punch/guts_punch.gif
public/vfx/moves/break/guard_break.gif
public/vfx/moves/water/water_01.gif
public/vfx/moves/energy/energy_11.gif
```

## Nota importante sugli asset

Gli asset allegati sembrano appartenere a due famiglie:

1. **Sprite sheet verticali/orizzontali**
   - Slash
   - Thrust
   - Punch
   - Buff
   - Debuff
   - Cure
   - Shield
   - Barrier
   - Burst

2. **GIF già animate**
   - Confuse.gif
   - Cure(1).gif
   - GuardBreak.gif
   - GutsPunch.gif
   - energy_11.gif

Il sistema deve supportare entrambe le tipologie.

## Criteri di accettazione

- Tutti gli asset sono in `public/vfx/moves/...`.
- I path sono compatibili con GitHub Pages/Vite usando `assetUrl`.
- Nessun path hardcoded tipo `/vfx/...` senza passare da `assetUrl`.

---

# FASE 2 — Tipi TypeScript per il nuovo sistema VFX

## Obiettivo

Separare la definizione logica della VFX dalla sua resa grafica.

## Nuovo file

```txt
src/components/vfx/types.ts
```

## Tipi da implementare

```ts
export type VfxPlaybackKind = 'sprite-sheet' | 'gif' | 'static-image'

export type VfxAnchor =
  | 'attacker'
  | 'target'
  | 'self'
  | 'center'
  | 'screen'

export type VfxLayer =
  | 'behind-pokemon'
  | 'over-pokemon'
  | 'front-ui'

export type VfxBlendMode =
  | 'normal'
  | 'screen'
  | 'lighten'
  | 'plus-lighter'

export interface SpriteSheetMeta {
  frameWidth: number
  frameHeight: number
  columns: number
  rows: number
  frameCount: number
  fps: number
}

export interface MoveVfxAsset {
  id: string
  label: string
  kind: VfxPlaybackKind
  src: string

  sprite?: SpriteSheetMeta

  durationMs: number
  impactAtMs?: number

  anchor: VfxAnchor
  layer: VfxLayer

  width: number
  height: number
  scale?: number

  offsetX?: number
  offsetY?: number

  mirrorForEnemy?: boolean
  rotateDegForEnemy?: number

  blendMode?: VfxBlendMode
  opacity?: number

  loop?: boolean
}
```

## Criteri di accettazione

- Tipi esportati e riutilizzabili.
- Nessun `any`.
- Compatibile con TypeScript strict.
- Nessun unused export/import.

---

# FASE 3 — Manifest VFX centralizzato

## Obiettivo

Creare una mappa dati che descriva tutti gli asset disponibili.

## Nuovo file

```txt
src/components/vfx/vfxManifest.ts
```

## Contenuto richiesto

Creare un oggetto `MOVE_VFX_ASSETS` con asset base:

```ts
export const MOVE_VFX_ASSETS = {
  slash: {
    id: 'slash',
    label: 'Slash',
    kind: 'sprite-sheet',
    src: 'vfx/moves/slash/slash_60fps.png',
    sprite: {
      frameWidth: 192,
      frameHeight: 192,
      columns: 5,
      rows: 6,
      frameCount: 30,
      fps: 60,
    },
    durationMs: 500,
    impactAtMs: 260,
    anchor: 'target',
    layer: 'over-pokemon',
    width: 260,
    height: 260,
    scale: 1,
    mirrorForEnemy: true,
    blendMode: 'screen',
  },

  thrust: { ... },
  punch: { ... },
  buff: { ... },
  debuff: { ... },
  shimmer: { ... },
  cure: { ... },
  shield: { ... },
  barrier: { ... },
  burst: { ... },
  confuseGif: { ... },
  cureGif: { ... },
  guardBreakGif: { ... },
  gutsPunchGif: { ... },
  waterGif: { ... },
  energyGif: { ... },
}
```

## Nota sui frame

Non assumere che tutti gli sprite sheet abbiano la stessa griglia.

Codex deve:

1. Ispezionare dimensioni reali degli asset.
2. Calcolare `frameWidth`, `frameHeight`, `columns`, `rows`, `frameCount`.
3. Se non è possibile dedurre correttamente la griglia, partire con una configurazione manuale ragionevole e documentarla nei commenti.

## Criteri di accettazione

- Ogni asset ha un ID stabile.
- Ogni asset ha durata, dimensione, anchor e layer.
- Tutti i path passano poi da `assetUrl`.
- Nessun asset obbligatorio deve rompere la build se manca: il componente deve avere fallback.

---

# FASE 4 — Renderer `AnimatedSprite`

## Obiettivo

Creare un renderer riutilizzabile per sprite sheet.

## Nuovo file

```txt
src/components/vfx/AnimatedSprite.tsx
```

## Requisiti

Il componente deve ricevere:

```ts
interface AnimatedSpriteProps {
  src: string
  frameWidth: number
  frameHeight: number
  columns: number
  rows: number
  frameCount: number
  fps: number
  width: number
  height: number
  durationMs?: number
  loop?: boolean
  className?: string
  style?: React.CSSProperties
  onComplete?: () => void
}
```

## Implementazione consigliata

Usare `requestAnimationFrame` e calcolare:

```ts
const currentFrame = Math.floor(elapsed / frameDuration)
const col = currentFrame % columns
const row = Math.floor(currentFrame / columns)
```

Poi impostare:

```ts
backgroundPosition = `-${col * frameWidth}px -${row * frameHeight}px`
```

## Requisiti QA

- Deve fermarsi all’ultimo frame se `loop=false`.
- Deve chiamare `onComplete`.
- Deve pulire `requestAnimationFrame` in un cleanup.
- Deve rispettare `prefers-reduced-motion`.
- Deve evitare memory leak quando la scena cambia.

## Criteri di accettazione

- Lo sprite sheet viene animato correttamente.
- Non ci sono warning React.
- Non ci sono timer lasciati attivi.
- Funziona su Chrome desktop e mobile.

---

# FASE 5 — Renderer `GifVfx`

## Obiettivo

Supportare GIF già animate.

## Nuovo file

```txt
src/components/vfx/GifVfx.tsx
```

## Requisiti

Il componente deve:

- Renderizzare `<img>`.
- Usare `assetUrl`.
- Applicare:
  - width
  - height
  - transform
  - opacity
  - mixBlendMode
  - pointer-events none
- Forzare il restart della GIF a ogni nuova mossa.

## Restart GIF

Quando cambia `effect.id`, aggiungere un query param cache-buster:

```ts
const runtimeSrc = `${assetUrl(asset.src)}?vfx=${effectId}`
```

## Criteri di accettazione

- La GIF riparte da frame 0 a ogni mossa.
- Funziona anche se la stessa mossa viene usata due volte di fila.
- Nessun flicker eccessivo.

---

# FASE 6 — Nuovo resolver `resolveMoveVfxAsset`

## Obiettivo

Sostituire la logica SVG con una logica di scelta asset.

## Nuovo file

```txt
src/components/vfx/resolveMoveVfxAsset.ts
```

## Input

```ts
import type { MossaDef } from '@/types'
import type { MoveVfxAsset } from './types'

export function resolveMoveVfxAsset(move: MossaDef): MoveVfxAsset
```

## Logica richiesta

Ordine di priorità:

1. Override per ID mossa.
2. Override per effetto speciale.
3. Tipo Pokémon.
4. Nome mossa.
5. Fallback generico.

## Esempio mapping

```ts
const BY_EFFECT = {
  CURA: 'cure',
  CURA_PCT: 'cure',
  CONFUSIONE: 'confuseGif',
  SONNO: 'debuff',
  VELENO: 'debuff',
  SUPREMA: 'burst',
}

const BY_TYPE = {
  Fuoco: 'burst',
  Acqua: 'waterGif',
  Erba: 'shimmer',
  Elettro: 'energyGif',
  Terra: 'punch',
  Psico: 'confuseGif',
  Oscurità: 'debuff',
  Normale: 'punch',
}
```

## Mapping per nome

Usare normalizzazione simile a quella attuale:

```ts
function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}
```

Esempi:

- nomi con `taglio`, `lama`, `artiglio`, `slash` → `slash`
- nomi con `pugno`, `colpo`, `botta`, `punch` → `punch`
- nomi con `cura`, `guarigione`, `heal` → `cure`
- nomi con `barriera`, `scudo`, `protezione` → `shield` o `barrier`
- nomi con `confusione`, `psico`, `mente` → `confuseGif`

## Criteri di accettazione

- Ogni mossa riceve sempre un asset.
- Le mosse cura sono self-target.
- Le mosse danno sono target-opponent.
- Le mosse buff/debuff possono essere self o target in base all’effetto.
- Il fallback non deve mai crashare.

---

# FASE 7 — Nuovo componente `SpriteMoveVfx`

## Obiettivo

Creare il nuovo componente visuale mantenendo compatibilità con `MoveVfxEvent`.

## Nuovo file

```txt
src/components/vfx/SpriteMoveVfx.tsx
```

## Props

```ts
import type { MoveVfxEvent } from '@/components/MoveVfx'

export function SpriteMoveVfx({ effect }: { effect: MoveVfxEvent }) {
  ...
}
```

## Coordinate battaglia

Attualmente `MoveVfx.tsx` usa coordinate SVG fisse:

```ts
A/player circa: x 250, y 355
B/enemy circa: x 770, y 180
```

Il nuovo sistema deve partire con coordinate compatibili:

```ts
const POSITIONS = {
  A: {
    attacker: { x: 25, y: 64 },
    target: { x: 77, y: 32 },
    self: { x: 25, y: 64 },
  },
  B: {
    attacker: { x: 77, y: 32 },
    target: { x: 25, y: 64 },
    self: { x: 77, y: 32 },
  },
}
```

Usare percentuali CSS invece di coordinate SVG, così il sistema scala meglio:

```tsx
style={{
  left: `${x}%`,
  top: `${y}%`,
  transform: `translate(-50%, -50%) scale(...)`,
}}
```

## Anchor richiesti

- `target`: effetto sul Pokémon colpito.
- `self`: effetto sul Pokémon che usa cura/buff.
- `attacker`: effetto vicino a chi attacca.
- `center`: effetto al centro campo.
- `screen`: effetto full-screen.

## Layering

Usare z-index coerenti:

```ts
behind-pokemon: z-30
over-pokemon: z-45
front-ui: z-60
```

## Movimento projectile

Per slash/punch/thrust si può partire in due modi.

### Versione 1 semplice

Mostrare direttamente l’effetto sul target.

### Versione 2 migliorata

Animare il contenitore da attacker a target con Framer Motion:

```tsx
<motion.div
  initial={{ left: `${start.x}%`, top: `${start.y}%`, opacity: 0, scale: 0.7 }}
  animate={{ left: `${end.x}%`, top: `${end.y}%`, opacity: [0, 1, 1, 0], scale: [0.7, 1.15, 1] }}
  transition={{ duration: asset.durationMs / 1000 }}
>
```

La roadmap deve implementare almeno la Versione 1. La Versione 2 è consigliata per slash/thrust/energy.

## Criteri di accettazione

- Il componente mostra correttamente sprite sheet e GIF.
- L’effetto appare nel punto giusto.
- Per avversario viene applicato mirror/orientamento quando necessario.
- Il componente sparisce dopo la durata configurata.
- Non intercetta click.
- Non rompe HP bar, mosse, dadi o info box.

---

# FASE 8 — Compatibilità con `MoveVfx.tsx`

## Obiettivo

Evitare una sostituzione rischiosa immediata.

## Strategia

Modificare `src/components/MoveVfx.tsx` così:

1. Mantenere export esistenti:
   - `MoveVfxSide`
   - `MoveVfxTarget`
   - `MoveVfxEvent`
   - `MOVE_VFX_VISIBLE_MS`
   - `MoveVfx`

2. Internamente delegare a `SpriteMoveVfx`.

Esempio:

```tsx
export const MOVE_VFX_VISIBLE_MS = 1450

export function MoveVfx({ effect }: { effect: MoveVfxEvent }) {
  return <SpriteMoveVfx effect={effect} />
}
```

3. Conservare temporaneamente il vecchio codice SVG in un file:

```txt
src/components/vfx/LegacySvgMoveVfx.tsx
```

oppure lasciarlo nel commit precedente, ma meglio non tenerlo in mezzo al nuovo componente.

## Criteri di accettazione

- `BattagliaScene.tsx` non deve richiedere grandi modifiche.
- La build deve passare.
- Tutti gli import esistenti devono continuare a funzionare.
- La scena battaglia deve mostrare le nuove VFX senza cambiare la logica delle mosse.

---

# FASE 9 — Timing, impatto e danno

## Problema attuale

La logica battaglia applica danno, shake e suono quasi subito dopo `mostraVfxMossa`.

Nel nuovo sistema, alcune animazioni hanno un punto di impatto visivo, ad esempio:

- Slash: impatto circa a metà animazione.
- Punch: impatto quando il pugno raggiunge il target.
- Burst: impatto verso il centro/finale.
- Cure: effetto immediato su self.
- Barrier/Shield: effetto continuo su self.

## Fase 9A — Non rompere nulla

Per la prima implementazione:

- Lasciare invariata la logica danno.
- Lasciare invariato `playSound('hit')`.
- Lasciare invariato `setShaking`.
- Concentrarsi solo sulla qualità visiva.

## Fase 9B — Miglioramento successivo

Creare una piccola funzione:

```ts
export function getMoveVfxImpactDelayMs(move: MossaDef): number
```

che usa `asset.impactAtMs`.

Poi in `BattagliaScene.tsx`, solo in una fase successiva, spostare:

```ts
setShaking(...)
playSound('hit')
```

dentro un timeout sincronizzato all’impatto.

## Criteri di accettazione Fase 9A

- Nessuna regressione nel battle engine.
- Nessuna modifica al calcolo danno.
- Nessun ritardo strano nel cambio turno.

## Criteri di accettazione Fase 9B

- Lo shake avviene quando l’effetto colpisce.
- Il suono hit è sincronizzato.
- I turni non si accavallano.
- I timeout sono puliti su unmount.

---

# FASE 10 — VFX Lab / schermata test interna

## Obiettivo

Avere una pagina/scena per testare tutte le VFX senza dover combattere ogni volta.

## Nuovo componente

```txt
src/components/vfx/VfxGallery.tsx
```

## Funzioni richieste

La gallery deve mostrare:

- Lista asset disponibili.
- Preview singola.
- Pulsante Replay.
- Toggle:
  - lato A/B
  - target/self/center/screen
  - sprite sheet/GIF
  - scala 0.5x / 1x / 1.5x / 2x
  - background chiaro/scuro/battle
- Nome asset.
- Durata.
- Dimensione.
- Anchor.
- Layer.

## Integrazione

Se esiste già un’area admin, aggiungere la preview lì.

Altrimenti creare componente standalone e renderizzarlo temporaneamente solo in dev con una condizione sicura, ad esempio:

```ts
if (import.meta.env.DEV && window.location.hash === '#vfx-lab') {
  ...
}
```

Non lasciare scorciatoie invasive in produzione.

## Criteri di accettazione

- Si possono testare tutte le VFX senza entrare in battaglia.
- Il replay funziona.
- Utile per calibrare scale e offset.
- Non appare al giocatore in produzione.

---

# FASE 11 — Mapping avanzato mosse

## Obiettivo

Rendere ogni mossa riconoscibile e non generica.

## Task

Creare:

```txt
src/components/vfx/moveVfxOverrides.ts
```

Con struttura:

```ts
export const MOVE_VFX_BY_MOVE_ID: Record<number, string> = {
  // esempio:
  // 1: 'punch',
  // 2: 'slash',
  // 3: 'waterGif',
}
```

Poi usare questo file nel resolver.

## Regole

- Non modificare `mosse.json` nella prima iterazione.
- Non aggiungere campi nuovi ai dati mossa finché il resolver funziona.
- In una fase successiva si potrà aggiungere un campo opzionale `vfxId` nel tipo `MossaDef`.

## Fase successiva opzionale

Estendere `MossaDef`:

```ts
vfxId?: string
```

E poi aggiungerlo in `mosse.json`.

## Criteri di accettazione

- Le mosse principali hanno VFX coerenti.
- Le mosse di tipo Acqua usano effetti acqua.
- Le mosse cura usano cure/shimmer.
- Le mosse protezione usano shield/barrier.
- Le mosse supreme usano burst/energy.
- Le mosse stato usano confuse/debuff.

---

# FASE 12 — Performance e qualità visiva

## Problemi da evitare

- GIF troppo grandi.
- Troppe animazioni simultanee.
- Layout shift.
- Immagini non precaricate.
- Memory leak da `requestAnimationFrame`.
- Effetti tagliati dal contenitore.
- Z-index sopra i bottoni.
- Mix blend non supportato uguale su tutti i browser.

## Task

1. Aggiungere preload leggero per gli asset usati più spesso.

Nuovo file:

```txt
src/components/vfx/preloadVfxAssets.ts
```

```ts
export function preloadVfxAssets(assetIds: string[]) {
  ...
}
```

2. Chiamare preload quando entra la battaglia.
3. Usare `decoding="async"` sulle immagini.
4. Usare `will-change: transform, opacity`.
5. Ridurre scale e dimensioni se mobile soffre.
6. Rispettare `prefers-reduced-motion`.

## Criteri di accettazione

- Nessun calo vistoso di FPS.
- Nessun freeze quando parte la prima mossa.
- Gli asset appaiono subito dopo il primo preload.
- Su mobile gli effetti restano fluidi.

---

# FASE 13 — Fallback e robustezza

## Obiettivo

Il gioco non deve rompersi se un asset manca.

## Requisiti

Se un asset non carica:

1. Mostrare un fallback semplice.
2. Loggare warning solo in dev.
3. Non crashare React.
4. Non bloccare il turno.

## Fallback consigliato

Creare un piccolo fallback CSS:

```txt
src/components/vfx/FallbackVfx.tsx
```

Effetto:

- cerchio glow;
- piccola esplosione;
- durata 600 ms;
- nessun SVG complesso.

## Criteri di accettazione

- Rinominando temporaneamente un asset, la battaglia continua.
- Console pulita in produzione.
- Warning utile in dev.

---

# FASE 14 — Refactor finale del vecchio SVG

## Obiettivo

Pulire il codice dopo aver validato il nuovo sistema.

## Task

Solo dopo verifica manuale:

1. Spostare il vecchio renderer SVG in `LegacySvgMoveVfx.tsx` oppure rimuoverlo.
2. Rimuovere funzioni non più usate:
   - `ProjectileGlyph`
   - `Trail`
   - `Burst`
   - `SelfAura`
   - vecchi archetype se non servono più.
3. Mantenere eventualmente solo:
   - tipi pubblici;
   - resolver nuovo;
   - wrapper `MoveVfx`.

## Criteri di accettazione

- `npm run build` passa.
- Nessun unused import.
- Nessun unused type.
- `MoveVfx.tsx` diventa piccolo e leggibile.

---

# FASE 15 — QA manuale battaglia

## Scenari da testare

### 1. Mossa normale giocatore

- Effetto appare sul nemico.
- Shake nemico.
- Danno applicato.
- Info box corretto.
- Turno passa all’avversario.

### 2. Mossa normale avversario

- Effetto appare sul giocatore.
- Orientamento corretto.
- Shake giocatore.
- Danno applicato.

### 3. Cura giocatore

- Effetto appare sul Pokémon del giocatore.
- Non va sul nemico.
- HP aumentano correttamente.

### 4. Cura avversario

- Effetto appare sul Pokémon avversario.
- Non va sul giocatore.

### 5. Stato alterato

- Confusione usa effetto coerente.
- Sonno/veleno/debuff usano effetto coerente.
- Badge stato continua a funzionare.

### 6. KO

- Effetto parte.
- KO sound parte.
- Cambio Pokémon o fine battaglia funziona.

### 7. PvP

- Mossa lato A.
- Passaggio controllo.
- Mossa lato B.
- Effetti orientati correttamente.

### 8. Mobile

- Nessun overflow strano.
- Effetto non copre permanentemente UI.
- Bottoni ancora cliccabili dopo animazione.

---

# FASE 16 — Test automatici consigliati

## Unit test resolver

Nuovo file:

```txt
src/components/vfx/__tests__/resolveMoveVfxAsset.test.ts
```

Testare:

- mossa cura → cure;
- mossa confusione → confuse;
- tipo acqua → water;
- tipo normale → punch;
- effetto suprema → burst;
- fallback sempre presente.

## Test utilità sprite

Nuovo file:

```txt
src/components/vfx/__tests__/spriteFrame.test.ts
```

Estrarre funzione pura:

```ts
export function getSpriteFramePosition(
  frame: number,
  columns: number,
  frameWidth: number,
  frameHeight: number
) {
  ...
}
```

Testare:

- frame 0;
- frame 1;
- frame columns;
- ultimo frame.

## Criteri di accettazione

```bash
npm run test
npm run build
```

devono passare entrambi.

---

# FASE 17 — Definizione qualità prodotto

## Risultato atteso

Il nuovo sistema deve dare una sensazione:

- più arcade;
- più cartoon;
- più vicina a giochi Pokémon/fantasy mobile;
- meno “grafico SVG tecnico”;
- più ricca di glow, scie, impatti, particelle;
- più coerente con GIF e sprite sheet allegati.

## Non obiettivi

Non fare ora:

- riscrittura del battle engine;
- nuovo sistema turni;
- editor completo degli asset;
- upload asset runtime;
- fisica particellare complessa;
- dipendenze pesanti tipo PixiJS o Three.js.

La prima versione deve restare semplice, stabile e integrata con React.

---

# FASE 18 — Possibile evoluzione futura: mini editor admin VFX

## Obiettivo futuro

Permettere da admin di modificare:

- asset associato a una mossa;
- scala;
- offset X/Y;
- durata;
- anchor;
- layer;
- mirror;
- blend mode.

## Possibile struttura futura

```ts
interface AdminMoveVfxOverride {
  moveId: number
  assetId: string
  scale: number
  offsetX: number
  offsetY: number
  durationMs: number
  anchor: VfxAnchor
}
```

## Prima milestone admin

Non serve salvare tutto subito.

Prima creare solo:

- pannello preview;
- modifica temporanea in memoria;
- export JSON configurazione.

Poi, in una fase successiva, collegare al sistema admin asset/layout già esistente.

---

# Piano operativo per Codex

## Primo commit

```txt
feat(vfx): add sprite/gif vfx asset architecture
```

Contenuto:

- cartelle asset;
- tipi;
- manifest;
- AnimatedSprite;
- GifVfx;
- resolver;
- SpriteMoveVfx;
- wrapper compatibile MoveVfx.

## Secondo commit

```txt
feat(vfx): map battle moves to new animated effects
```

Contenuto:

- mapping per effetto/tipo/nome;
- override per mosse principali;
- calibrazione anchor/scale;
- fallback.

## Terzo commit

```txt
test(vfx): add resolver and sprite frame tests
```

Contenuto:

- test resolver;
- test frame sprite;
- build pulita.

## Quarto commit opzionale

```txt
feat(vfx): add dev vfx gallery
```

Contenuto:

- VfxGallery;
- replay;
- side/target toggles;
- preview asset.

---

# Checklist finale prima PR

- [ ] `npm run build` passa.
- [ ] `npm run test` passa.
- [ ] Nessun errore TypeScript.
- [ ] Nessun unused import.
- [ ] Le VFX partono sia per lato A sia per lato B.
- [ ] Le cure appaiono sul self.
- [ ] Gli attacchi appaiono sul target.
- [ ] GIF restartano quando la stessa mossa viene usata due volte.
- [ ] Sprite sheet non restano bloccati al primo frame.
- [ ] Asset mancanti non crashano il gioco.
- [ ] Mobile ok.
- [ ] Nessuna regressione su HP, dadi, info box, KO, cambio Pokémon.
- [ ] Vecchio SVG rimosso o isolato come fallback legacy.
- [ ] Codice leggibile e documentato dove serve.

---

# Prompt breve da dare a Codex

Agisci come senior React/TypeScript game developer. Nella repo `Andreatz/Arkamon-Beta`, sostituisci il sistema VFX mosse attuale basato su SVG in `src/components/MoveVfx.tsx` con un sistema asset-driven basato su sprite sheet PNG/WebP e GIF animate. Mantieni compatibili gli export pubblici `MoveVfx`, `MOVE_VFX_VISIBLE_MS`, `MoveVfxEvent`, `MoveVfxSide`, `MoveVfxTarget`, così `BattagliaScene.tsx` non richiede una riscrittura. Crea tipi, manifest asset, renderer `AnimatedSprite`, renderer GIF, resolver per tipo/effetto/nome mossa, fallback robusto e test unitari. Usa asset in `public/vfx/moves/...` e risolvi i path con `assetUrl`. Non modificare la logica del battle engine nella prima iterazione. Alla fine esegui `npm run build` e `npm run test`.
