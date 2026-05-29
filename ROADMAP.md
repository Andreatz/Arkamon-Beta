# ROADMAP CODEX — Arkamon Admin Mode / Theme Editor

Repository:

```txt
https://github.com/Andreatz/Arkamon-Beta
```

Obiettivo: creare una **modalità admin interna al gioco** che permetta di modificare la grafica di Arkamon direttamente dall’interfaccia del gioco, senza toccare manualmente ogni file CSS/TSX.

Il progetto è una app **React + TypeScript + Vite + Tailwind + Zustand**. La struttura è già adatta perché il codice è diviso in:

```txt
src/scenes
src/components
src/store
src/data
src/utils
public/backgrounds
public/maps
public/sprites
public/ui
```

Esistono già variabili CSS globali in `src/index.css`, come:

```css
--arka-primary
--arka-primary-hover
--arka-bg
--arka-surface
--arka-surface-hover
--arka-text
--arka-text-muted
--arka-border
--hp-high
--hp-mid
--hp-low
```

---

## Regole generali per Codex

Codex deve rispettare queste regole:

```txt
1. Non modificare la logica di gioco.
2. Non toccare engine, calcolo danni, cattura, XP, mappa o battaglia se non necessario.
3. Non aggiungere dipendenze pesanti.
4. Non aggiornare Vite, React, Tailwind o Zustand.
5. Usare npm, non pnpm/yarn.
6. Mantenere TypeScript strict.
7. Tutti i testi UI devono essere in italiano.
8. L’admin deve essere un layer opzionale sopra il gioco.
9. Il salvataggio grafico deve essere separato dal salvataggio partita.
10. Inserire marker verificabile:
    ARKAMON_ADMIN_MODE_V1_THEME_EDITOR
```

---

# FASE 0 — Analisi iniziale Codex

## Task 0.1 — Leggere struttura progetto

Codex deve analizzare questi file:

```txt
package.json
src/App.tsx
src/index.css
src/store/gameStore.ts
src/types/index.ts
tailwind.config.js
README.md
CLAUDE.md
```

## Obiettivo

Capire dove agganciare il sistema admin.

Il punto principale di aggancio è `src/App.tsx`, perché lì il gioco viene montato dentro:

```tsx
<div className="arka-stage">
```

e vengono renderizzate le scene correnti.

## Criteri di accettazione

```txt
- Codex conferma che l’admin verrà agganciato in App.tsx.
- Codex conferma che il tema verrà gestito separatamente da gameStore.ts.
- Codex conferma che verrà usato localStorage/Zustand per la persistenza grafica.
```

---

# FASE 1 — Creare il modello tema admin

## Task 1.1 — Creare il tipo dati del tema

Creare file:

```txt
src/theme/adminThemeTypes.ts
```

Contenuto atteso:

```ts
export interface AdminThemeColors {
  primary: string
  primaryHover: string
  bg: string
  surface: string
  surfaceHover: string
  text: string
  textMuted: string
  border: string
  hpHigh: string
  hpMid: string
  hpLow: string
}

export interface AdminThemeUi {
  panelRadius: number
  buttonRadius: number
  panelOpacity: number
  shadowIntensity: number
  buttonScale: number
  stageScale: number
}

export interface AdminTheme {
  id: string
  name: string
  colors: AdminThemeColors
  ui: AdminThemeUi
}
```

## Task 1.2 — Creare tema default

Creare file:

```txt
src/theme/defaultAdminTheme.ts
```

Il tema default deve rispecchiare i valori attuali di `src/index.css`.

Esempio:

```ts
import type { AdminTheme } from './adminThemeTypes'

export const defaultAdminTheme: AdminTheme = {
  id: 'arkamon-default',
  name: 'Arkamon Classico',
  colors: {
    primary: '#f59e0b',
    primaryHover: '#fbbf24',
    bg: '#0f172a',
    surface: '#1e293b',
    surfaceHover: '#334155',
    text: '#f1f5f9',
    textMuted: '#94a3b8',
    border: '#475569',
    hpHigh: '#16a34a',
    hpMid: '#eab308',
    hpLow: '#dc2626',
  },
  ui: {
    panelRadius: 16,
    buttonRadius: 12,
    panelOpacity: 1,
    shadowIntensity: 1,
    buttonScale: 0.95,
    stageScale: 1,
  },
}
```

## Criteri di accettazione

```txt
- Il tema è tipizzato.
- Non ci sono any.
- Non vengono modificate scene di gioco.
- Il tema default produce lo stesso aspetto attuale.
```

---

# FASE 2 — Applicare il tema al DOM

## Task 2.1 — Creare helper runtime

Creare file:

```txt
src/theme/applyAdminTheme.ts
```

Responsabilità:

```txt
- Riceve AdminTheme.
- Applica le variabili CSS su document.documentElement.
- Non usa React.
- Non modifica localStorage.
```

Esempio:

```ts
import type { AdminTheme } from './adminThemeTypes'

export function applyAdminTheme(theme: AdminTheme): void {
  const root = document.documentElement

  root.style.setProperty('--arka-primary', theme.colors.primary)
  root.style.setProperty('--arka-primary-hover', theme.colors.primaryHover)
  root.style.setProperty('--arka-bg', theme.colors.bg)
  root.style.setProperty('--arka-surface', theme.colors.surface)
  root.style.setProperty('--arka-surface-hover', theme.colors.surfaceHover)
  root.style.setProperty('--arka-text', theme.colors.text)
  root.style.setProperty('--arka-text-muted', theme.colors.textMuted)
  root.style.setProperty('--arka-border', theme.colors.border)

  root.style.setProperty('--hp-high', theme.colors.hpHigh)
  root.style.setProperty('--hp-mid', theme.colors.hpMid)
  root.style.setProperty('--hp-low', theme.colors.hpLow)

  root.style.setProperty('--arka-panel-radius', `${theme.ui.panelRadius}px`)
  root.style.setProperty('--arka-button-radius', `${theme.ui.buttonRadius}px`)
  root.style.setProperty('--arka-panel-opacity', `${theme.ui.panelOpacity}`)
  root.style.setProperty('--arka-shadow-intensity', `${theme.ui.shadowIntensity}`)
  root.style.setProperty('--arka-button-scale', `${theme.ui.buttonScale}`)
  root.style.setProperty('--arka-stage-scale', `${theme.ui.stageScale}`)
}
```

## Task 2.2 — Aggiornare `src/index.css`

Aggiungere variabili nuove:

```css
--arka-panel-radius: 16px;
--arka-button-radius: 12px;
--arka-panel-opacity: 1;
--arka-shadow-intensity: 1;
--arka-button-scale: 0.95;
--arka-stage-scale: 1;
```

Modificare le utility globali:

```css
.arka-panel {
  border-radius: var(--arka-panel-radius);
  opacity: var(--arka-panel-opacity);
}

.arka-button {
  border-radius: var(--arka-button-radius);
}

.arka-button:active {
  transform: scale(var(--arka-button-scale));
}

.arka-stage {
  transform: scale(var(--arka-stage-scale));
}
```

Attenzione: mantenere Tailwind dove possibile, ma usare CSS normale quando Tailwind non può leggere valori dinamici runtime.

## Criteri di accettazione

```txt
- Cambiare il tema cambia davvero i colori globali.
- Non si rompe Tailwind.
- Non si rompe la classe arka-stage.
- Il gioco resta visibile e centrato.
```

---

# FASE 3 — Creare adminStore separato

## Task 3.1 — Creare store admin

Creare file:

```txt
src/store/adminStore.ts
```

Non modificare `gameStore.ts`.

Lo store deve contenere:

```ts
interface AdminState {
  enabled: boolean
  panelOpen: boolean
  theme: AdminTheme
  toggleEnabled: () => void
  setPanelOpen: (open: boolean) => void
  updateColor: (key: keyof AdminThemeColors, value: string) => void
  updateUi: (key: keyof AdminThemeUi, value: number) => void
  resetTheme: () => void
  importTheme: (theme: AdminTheme) => void
}
```

Persistenza:

```txt
name: arkamon-admin-theme
```

## Perché store separato

`gameStore.ts` contiene già partita, giocatori, battaglia, navigazione, overworld e audio. La grafica admin deve restare indipendente dal salvataggio partita, che usa `arkamon-save`.

## Criteri di accettazione

```txt
- Il tema resta salvato ricaricando la pagina.
- Reset partita non cancella tema admin.
- Reset tema non cancella partita.
- Nessun uso diretto di localStorage nei componenti.
```

---

# FASE 4 — Creare AdminRuntime

## Task 4.1 — Creare file

```txt
src/admin/AdminRuntime.tsx
```

Responsabilità:

```txt
- Legge il tema da adminStore.
- Applica il tema usando applyAdminTheme().
- Non renderizza UI visibile.
```

Esempio:

```tsx
import { useEffect } from 'react'
import { useAdminStore } from '@store/adminStore'
import { applyAdminTheme } from '@/theme/applyAdminTheme'

export function AdminRuntime() {
  const theme = useAdminStore((s) => s.theme)

  useEffect(() => {
    applyAdminTheme(theme)
  }, [theme])

  return null
}
```

## Criteri di accettazione

```txt
- Il tema viene applicato al primo caricamento.
- Il tema cambia live quando lo store cambia.
- Nessun errore SSR, anche se Vite è client-only.
```

---

# FASE 5 — Attivazione admin mode

## Task 5.1 — Creare scorciatoia

Creare file:

```txt
src/admin/useAdminHotkey.ts
```

Scorciatoia:

```txt
CTRL + SHIFT + A
```

Comportamento:

```txt
- Se admin disattivo: abilita admin e apre pannello.
- Se admin attivo: chiude/apre pannello.
```

## Task 5.2 — Creare AdminOverlay

Creare file:

```txt
src/admin/AdminOverlay.tsx
```

Responsabilità:

```txt
- Usa useAdminHotkey().
- Se admin non è attivo, non mostra nulla.
- Se admin è attivo, mostra pulsante floating “Admin”.
- Se panelOpen è true, mostra AdminPanel.
```

## Stile

Il pulsante deve essere piccolo, non invasivo:

```txt
posizione: top-right
label: Admin
z-index alto
```

## Criteri di accettazione

```txt
- CTRL+SHIFT+A attiva il pannello.
- Il gioco resta cliccabile quando pannello chiuso.
- Il pannello non blocca la scena se non nella sua area.
```

---

# FASE 6 — Integrare in App.tsx

## Task 6.1 — Modificare `src/App.tsx`

Aggiungere import:

```tsx
import { AdminRuntime } from '@/admin/AdminRuntime'
import { AdminOverlay } from '@/admin/AdminOverlay'
```

Dentro:

```tsx
<div className="arka-stage">
```

aggiungere:

```tsx
<AdminRuntime />
<AdminOverlay />
```

Il risultato deve essere simile a:

```tsx
<div className="arka-stage">
  <AdminRuntime />
  <AudioController />
  <AdminOverlay />
  ...
</div>
```

## Criteri di accettazione

```txt
- Il gioco parte normalmente.
- AdminRuntime è sempre montato.
- AdminOverlay non appare finché non si attiva l’admin.
- Nessuna scena viene rotta.
```

---

# FASE 7 — AdminPanel V1

## Task 7.1 — Creare pannello principale

Creare file:

```txt
src/admin/AdminPanel.tsx
```

Struttura:

```txt
Header:
- Titolo: Modalità Admin
- Badge: Theme Editor V1
- Bottone chiudi

Tabs:
- Colori
- UI
- Preset
- Import/Export
```

Per V1 bastano tab interne gestite con stato React locale.

## Design

Il pannello deve essere coerente con Arkamon:

```txt
sfondo scuro
bordo luminoso
angoli arrotondati
testi italiani
dimensione compatta
scroll interno
```

## Marker obbligatorio

Inserire nel file:

```tsx
const ADMIN_MODE_MARKER = 'ARKAMON_ADMIN_MODE_V1_THEME_EDITOR'
```

Usarlo in modo non invasivo, per esempio:

```tsx
data-admin-marker={ADMIN_MODE_MARKER}
```

## Criteri di accettazione

```txt
- Pannello visibile sopra il gioco.
- Non manda fuori scala l’area 16:9.
- Ha marker cercabile con grep.
```

---

# FASE 8 — Color Editor

## Task 8.1 — Creare componente

```txt
src/admin/AdminColorEditor.tsx
```

Campi:

```txt
Primario
Primario hover
Sfondo
Superficie
Superficie hover
Testo
Testo secondario
Bordo
HP alta
HP media
HP bassa
```

Ogni campo deve avere:

```txt
- label italiano
- input type="color"
- input testuale hex
- preview piccola
```

## Validazione

Accettare solo valori tipo:

```txt
#fff
#ffffff
```

Se il valore non è valido:

```txt
- non applicare
- mostra bordo rosso
```

## Criteri di accettazione

```txt
- Cambiare colore modifica il gioco in tempo reale.
- Inserire hex manuale funziona.
- Valori non validi non rompono CSS.
```

---

# FASE 9 — UI Editor

## Task 9.1 — Creare componente

```txt
src/admin/AdminUiEditor.tsx
```

Slider:

```txt
Raggio pannelli: 0-40
Raggio bottoni: 0-40
Opacità pannelli: 0.4-1
Intensità ombra: 0-2
Scala click bottoni: 0.85-1
Scala stage: 0.8-1.05
```

Ogni slider deve mostrare:

```txt
label
valore numerico
descrizione breve
```

## Criteri di accettazione

```txt
- Slider fluidi.
- Valori salvati.
- Reload mantiene i valori.
```

---

# FASE 10 — Preset grafici

## Task 10.1 — Creare preset

Creare file:

```txt
src/theme/adminThemePresets.ts
```

Preset minimi:

```txt
Arkamon Classico
Notte Viola
Cartoon Luminoso
Battaglia Dark
Fantasy Dorato
```

Ogni preset è un `AdminTheme`.

## Task 10.2 — Creare componente

```txt
src/admin/AdminPresetEditor.tsx
```

Funzioni:

```txt
- mostra lista preset
- bottone Applica
- preview colori principali
- avviso: applicare un preset sovrascrive tema corrente
```

## Criteri di accettazione

```txt
- Ogni preset cambia davvero il tema.
- Reset riporta ad Arkamon Classico.
- Nessun preset rompe contrasto testo/sfondo.
```

---

# FASE 11 — Import / Export JSON

## Task 11.1 — Creare componente

```txt
src/admin/AdminImportExport.tsx
```

Funzioni:

```txt
- Esporta tema corrente come JSON.
- Copia JSON negli appunti.
- Importa JSON da textarea.
- Valida struttura prima di importare.
```

## Nome file suggerito export

```txt
arkamon-theme.json
```

## Validazione minima

Controllare che esistano:

```txt
id
name
colors
ui
```

E che i colori siano validi.

## Criteri di accettazione

```txt
- Export produce JSON leggibile.
- Import di JSON valido applica il tema.
- Import di JSON rotto mostra errore e non rompe il gioco.
```

---

# FASE 12 — Asset Editor V1, solo selezione path

Questa fase è successiva alla V1 colori/UI.

## Obiettivo

Permettere di scegliere asset già presenti in `public/`.

Non bisogna ancora caricare file nuovi.

## Task 12.1 — Estendere tipo tema

Aggiungere:

```ts
export interface AdminThemeAssets {
  titleLogo?: string
  titleBackground?: string
  battleBackground?: string
  panelTexture?: string
}
```

In `AdminTheme`:

```ts
assets: AdminThemeAssets
```

## Task 12.2 — Creare componente

```txt
src/admin/AdminAssetEditor.tsx
```

Campi:

```txt
Logo titolo
Sfondo titolo
Sfondo battaglia
Texture pannelli
```

Input:

```txt
select con path predefiniti
input manuale path
preview immagine
```

## Nota tecnica

Gli asset dinamici devono passare da:

```txt
src/utils/assetUrl.ts
```

## Criteri di accettazione

```txt
- Asset preview funzionante.
- Path compatibili con GitHub Pages.
- Se asset non esiste, fallback sicuro.
```

---

# FASE 13 — Scene Theme Bridge

## Obiettivo

Permettere alle scene principali di leggere configurazioni grafiche specifiche.

Scene prioritarie:

```txt
TitoloScene
BattagliaScene
MappaGrigliaScene
DepositoScene
EvoluzioneScene
```

## Strategia corretta

Non modificare tutte le scene insieme.

Procedere una scena alla volta.

## Task 13.1 — TitoloScene

Modificare:

```txt
src/scenes/TitoloScene.tsx
```

Renderlo compatibile con admin theme:

```txt
- logo dinamico se impostato
- background dinamico se impostato
- fallback identico all’attuale
```

## Criteri di accettazione

```txt
- TitoloScene resta identica se non c’è tema custom.
- Se admin imposta nuovo logo, cambia logo.
- Se path asset errato, non crasha.
```

---

# FASE 14 — Modalità sicura sviluppo/produzione

## Problema

Su GitHub Pages non esiste vera autenticazione frontend. Una password scritta nel codice non è sicurezza reale.

## Soluzione V1

Admin disponibile con hotkey, ma nascosto.

Aggiungere costante:

```ts
const ADMIN_ENABLED_BY_DEFAULT = import.meta.env.DEV
```

In produzione:

```txt
- hotkey ancora possibile
- nessun pulsante visibile finché non viene attivato
```

## Soluzione futura

Per sicurezza reale servirebbe:

```txt
- backend
oppure
- build Tauri con storage locale controllato
oppure
- flag di build separato
```

## Criteri di accettazione

```txt
- In dev è facile aprire admin.
- In produzione non è visibile per errore.
- Nessuna falsa promessa di sicurezza.
```

---

# FASE 15 — Test

## Task 15.1 — Test store admin

Creare:

```txt
src/store/adminStore.test.ts
```

Testare:

```txt
- tema default
- updateColor
- updateUi
- resetTheme
- importTheme
```

## Task 15.2 — Test helper tema

Creare:

```txt
src/theme/applyAdminTheme.test.ts
```

Testare:

```txt
- applica variabili CSS
- non crasha con tema valido
```

## Comandi obbligatori

```bash
npm test
npm run build
```

## Criteri di accettazione

```txt
- npm test passa.
- npm run build passa.
- Nessun errore TypeScript.
- Nessun warning grave.
```

---

# FASE 16 — QA manuale

## Checklist manuale

Codex deve verificare o indicare all’utente di verificare:

```txt
[ ] Avvio gioco normale.
[ ] CTRL+SHIFT+A apre admin.
[ ] Pannello chiudibile.
[ ] Nuova Partita funziona.
[ ] Continua funziona.
[ ] Battaglia ancora funzionante.
[ ] Mappa ancora funzionante.
[ ] Deposito ancora funzionante.
[ ] AudioController ancora visibile.
[ ] Tema resta dopo refresh.
[ ] Reset tema funziona.
[ ] Export JSON funziona.
[ ] Import JSON valido funziona.
[ ] Import JSON errato non rompe il gioco.
```

---

# FASE 17 — Documentazione

## Task 17.1 — Creare documento

Creare file:

```txt
docs/ADMIN_MODE.md
```

Contenuto:

```txt
- Cos’è la modalità admin.
- Come attivarla.
- Cosa modifica.
- Dove salva.
- Come esportare/importare tema.
- Limiti GitHub Pages.
- Come disattivarla.
```

## Task 17.2 — Aggiornare README

Aggiungere sezione breve:

```md
## Modalità Admin Grafica

Arkamon include una modalità admin locale per modificare colori, UI e preset grafici.

Attivazione: CTRL + SHIFT + A

La configurazione viene salvata separatamente dalla partita.

Vedi: docs/ADMIN_MODE.md
```

---

# Prompt principale da dare a Codex

Copia questo in Codex:

```txt
Agisci come senior full-stack developer, QA engineer e product engineer.

Repository: Andreatz/Arkamon-Beta.

Obiettivo: implementare una modalità admin grafica interna al gioco chiamata “Arkamon Admin Mode V1”.

La feature deve permettere di modificare colori globali, parametri UI, preset grafici e import/export JSON del tema direttamente dentro il gioco.

Vincoli:
- Non modificare logica di gioco.
- Non modificare engine.
- Non rompere gameStore.ts.
- Creare adminStore.ts separato.
- Usare Zustand persist.
- Usare TypeScript strict.
- Nessun any.
- Nessuna nuova dipendenza pesante.
- Non aggiornare Vite/React/Tailwind/Zustand.
- Usare npm.
- Testi UI in italiano.
- Inserire marker: ARKAMON_ADMIN_MODE_V1_THEME_EDITOR.

File da creare:
- src/theme/adminThemeTypes.ts
- src/theme/defaultAdminTheme.ts
- src/theme/adminThemePresets.ts
- src/theme/applyAdminTheme.ts
- src/store/adminStore.ts
- src/admin/AdminRuntime.tsx
- src/admin/AdminOverlay.tsx
- src/admin/AdminPanel.tsx
- src/admin/AdminColorEditor.tsx
- src/admin/AdminUiEditor.tsx
- src/admin/AdminPresetEditor.tsx
- src/admin/AdminImportExport.tsx
- src/admin/useAdminHotkey.ts
- docs/ADMIN_MODE.md

File da modificare:
- src/App.tsx
- src/index.css
- README.md

Criteri di completamento:
- CTRL+SHIFT+A apre la modalità admin.
- I colori cambiano live.
- I parametri UI cambiano live.
- Il tema resta dopo refresh.
- Reset tema funziona.
- Import/export JSON funziona.
- npm test passa.
- npm run build passa.
- Il gioco continua a funzionare normalmente.
```

---

# Prompt di verifica finale per Codex

Dopo l’implementazione, dare questo secondo prompt:

```txt
Esegui una revisione completa della feature Admin Mode V1.

Controlla:
1. TypeScript strict.
2. Nessun any.
3. Nessuna modifica accidentale alla logica di gioco.
4. Nessun uso diretto di localStorage nei componenti.
5. Persistenza separata da arkamon-save.
6. Compatibilità con GitHub Pages.
7. Presenza marker ARKAMON_ADMIN_MODE_V1_THEME_EDITOR.
8. npm test.
9. npm run build.

Poi produci un report finale con:
- file creati
- file modificati
- test eseguiti
- eventuali limiti noti
- istruzioni di uso per l’utente.
```

---

# Ordine consigliato dei commit

```txt
1. admin-theme-types-and-defaults
2. admin-store-and-runtime
3. admin-overlay-and-hotkey
4. admin-panel-color-ui-editors
5. admin-presets-import-export
6. admin-css-runtime-variables
7. admin-docs-and-readme
8. admin-tests-and-final-polish
```

---

# Comandi finali

```bash
npm install
npm test
npm run build
npm run dev
```

Verifica marker:

```bash
grep -R "ARKAMON_ADMIN_MODE_V1_THEME_EDITOR" src
```

Output atteso:

```txt
src/admin/AdminPanel.tsx
```

---

# Nota finale

Questa roadmap è pensata per far lavorare Codex in modo ordinato: prima crea il sistema tema, poi lo store, poi il pannello, poi gli editor, poi i preset, poi i test.

In questo modo la modalità admin nasce solida e non invade il cuore del gioco.
