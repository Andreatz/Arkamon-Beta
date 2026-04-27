# 📋 Piano operativo

## PARTE A — `CLAUDE.md` (1 file)

**Sezione da modificare**: `### Cattura (solo battaglie selvatiche)` (~righe 110-118 del file).

### Diff atteso

```diff
 ### Cattura (solo battaglie selvatiche)
 ```
-roll          = 3d6   (tre tiri di 1d6 sommati, range 3..18)
-sogliaSuccesso = tassoCattura * (2 - hpAttualiB / hpMaxB)
-catturaRiuscita = roll <= sogliaSuccesso
+roll           = 3d6   (tre tiri di 1d6 sommati, range 3..18)
+sogliaSuccesso = tassoCattura * (3 - hpAttualiB / hpMaxB)
+catturaRiuscita = roll <= sogliaSuccesso
 ```
-- HP pieno → moltiplicatore 1× (più difficile)
-- HP a 0 → moltiplicatore 2× (più facile)
+- HP pieno (hp/hpMax = 1) → soglia = tassoCattura × 2 (più difficile)
+- HP a 0 (hp/hpMax = 0) → soglia = tassoCattura × 3 (più facile)
 - `tassoCattura` per Pokémon: dal database (1 leggendari, 5 comuni)
```

Nessun'altra modifica al file.

---

## PARTE B — `src/engine/battleEngine.ts` (1 file)

### B.1 `calcolaHPMax` — porting fedele
- Aggiungo commento `// Porting di: CalcolaHPMax da old_files/Mod_Utilities.txt`
- Sostituisco la formula con: `livello <= 5 ? hpBase : hpBase + Math.floor((livello - 5) * crescita)`

### B.2 `tiraDadi` — RNG opzionale per testabilità
- Aggiungo commento `// Porting di: LanciaDadi da old_files/Mod_Utilities.txt`
- Firma: `tiraDadi(numero: number, rng: () => number = Math.random): number[]`

### B.3 `calcolaDanno` — rimozione STAB dal danno
- Aggiungo commento `// Porting di: CalcolaEApplicaDanno da old_files/Mod_Battle_Engine.txt`
- Tolgo `moltStab`, danno = `Math.floor((sommaDadi + incremento) * moltTipo)` (uso `RoundIntHalfUp` → `Math.round` per fedeltà al VBA, da chiarire)
- Lascio `stab: boolean` nel `RisultatoMossa` (è informativo, lo legge l'AI)
- Rimuovo `messaggi.push('(STAB)')` (ingannevole se non applicato)
- Rimuovo `BATTLE_CONSTANTS.STAB_MULTIPLIER` dalla moltiplicazione del danno; resta usato in `scegliMossaIA`
- Aggiungo `rng` opzionale alla firma per propagarlo a `tiraDadi`

> **Nota arrotondamento**: il VBA usa `RoundIntHalfUp((sommaDadi + incremento) * moltTipo)` (banker-style → half up). L'attuale TS usa `Math.floor` con clamp a 1. Procedo con `Math.round` (= half-up per positivi) **senza** il clamp `Math.max(1, ...)`: se nel VBA `moltTipo=0` → `dannoFinale=0` esplicito. Se preferisci mantenere il clamp a 1, dimmelo.

### B.4 `tentaCattura` — porting fedele VBA
- Aggiungo commento `// Porting di: EseguiAzioneCattura da old_files/Mod_Battle_Engine.txt`
- Firma: `tentaCattura(bersaglio, rng: () => number = Math.random)`
- Logica:
  ```
  roll = somma di tiraDadi(3, rng)
  soglia = specie.tassoCattura * (3 - hp/hpMax)
  successo = roll <= soglia
  ```
- Output `RisultatoCattura`: `{ successo, soglia, roll, tiri: number[], messaggio }` (rinomino `tiro` → `roll` per coerenza con la formula)
- **Rimuovo completamente** `BATTLE_CONSTANTS.CATTURA_SOGLIA_BASE` e `CATTURA_BONUS_HP_BASSO` (non più usati)

### B.5 `xpGuadagnato` — torna a 1 fisso
- Aggiungo commento `// Porting di: assegnazione EXP da old_files/Mod_Battle_Engine.txt`
- Body: `return 1` con TODO sotto:
  ```ts
  // TODO: roadmap — 2× per cattura, EXP limitata per percorso (vedi CLAUDE.md)
  ```
- **Rimuovo** `BATTLE_CONSTANTS.XP_BASE_VITTORIA` (non più usato)
- Lascio `applicaXP` invariato (la curva di livellamento è già "inventata" — non era nel mandato ed eliminarla rompe Battaglia/Laboratorio)

### B.6 `scegliMossaIA` — propagazione RNG (per il test del tie-break determinato)
- Aggiungo commento `// Porting di: ScegliMossaIA da old_files/Mod_Utilities.txt`
- Firma: aggiungo `rng: () => number = Math.random` (per ora non usato attivamente — il test del punto 5 non richiede tie-break casuale, sceglie deterministicamente la mossa con STAB)

### Costanti finali
`BATTLE_CONSTANTS` rimane solo con `STAB_MULTIPLIER: 1.5` (usato dall'AI). Le altre costanti spariscono.

---

## PARTE C — `src/engine/__tests__/battleEngine.test.ts` (1 file nuovo)

### Pre-requisito: installare vitest

**Comando da approvare**:
```bash
npm install --save-dev vitest @vitest/ui
```

Aggiungo anche allo `package.json` lo script:
```json
"test": "vitest"
```

(Nessun cambio a vite.config.ts: vitest legge automaticamente la config Vite per i path alias `@/...`, `@engine/...` ecc.)

### Test che scriverò (5 totali, uno per correzione)

```ts
import { describe, it, expect } from 'vitest'
import {
  calcolaHPMax, calcolaDanno, tentaCattura,
  xpGuadagnato, scegliMossaIA, tiraDadi,
} from '../battleEngine'
import { creaIstanza } from '@store/gameStore'

// 1. calcolaHPMax (Media: +1.5/livello)
//    Vyrath (id=1, Media, hpBase=12) lvl 5 → 12 ; lvl 10 → 12 + floor(5*1.5)=19
// 2. calcolaDanno: niente STAB. Mossa Fuoco usata da Pokémon Fuoco vs Normale → moltTipo=1, danno = sommaDadi+incr (no *1.5)
//    Uso un RNG deterministico iniettato che ritorna sempre 0.5 (→ tiri = 4)
// 3. tentaCattura: tassoCattura=5, hp=hpMax → soglia=5*(3-1)=10
//    rng che dà tutti 1 → roll=3 → 3<=10 → successo
//    rng che dà tutti 0.999... → roll=18 → 18>10 → fallita
// 4. xpGuadagnato: livelli 5, 50, 100 → tutti 1
// 5. scegliMossaIA: pokémon di tipo Fuoco con due mosse identiche per dadi/incremento, una di tipo Fuoco (STAB) e una di tipo Normale → sceglie quella di tipo Fuoco
```

**Pokémon/mosse usati**: scelgo specie con tipo noto da `pokemon.json` reale (es. ID 1 Vyrath = Normale, ID 5 Darklaw = Oscurità, ID 9 Felyss = Psico) per non dover mockare i dati. Per il test STAB scelgo un Pokémon Fuoco esistente con due mosse di tipi diversi — verifico ora i dati prima di hardcodare gli ID.

> **Vincolo dati**: se non trovo un Pokémon Fuoco con esattamente quel pattern di mosse, costruisco il test direttamente con un'istanza fake e mock minimale tramite `vi.mock` di `@data/index`. Te lo segnalerò in caso.

---

## File toccati in totale
1. `CLAUDE.md` (Edit, sezione Cattura)
2. `src/engine/battleEngine.ts` (Edit, 5 sezioni)
3. `src/engine/__tests__/battleEngine.test.ts` (Write, nuovo)
4. `package.json` (Edit, +script `test`)
5. `package-lock.json` + `node_modules/` (modifiche da `npm install`)

## File NON toccati (per vincolo)
- `src/store/gameStore.ts`, tutte le scene, `src/types/index.ts`, `src/data/*`

---

## ❓ Domande prima di procedere

1. **OK ad installare vitest** con `npm install --save-dev vitest @vitest/ui`?
2. **Arrotondamento danno**: in `calcolaDanno` uso `Math.round` (fedele a `RoundIntHalfUp` VBA) oppure mantengo `Math.max(1, Math.floor(...))`? Il VBA permette danno=0 quando moltTipo=0.
3. **`applicaXP`**: confermo che resta com'è (curva inventata)? Il tuo punto 4 menziona solo `xpGuadagnato`, ma `applicaXP` è la funzione che **consuma** quegli XP — con `xpGuadagnato=1` e curva attuale (`20 * lvl^1.3`) servirebbero ~37 vittorie per andare da lvl 5 a lvl 6: bilanciamento da rivedere ma fuori scope di questo task. OK lasciarlo per ora?

## ⏭ Action item da segnalare
- 🚧 **BLOCKED: file mancante** — `old_files/Mod_ButtonClick_Handlers.txt` è un duplicato byte-per-byte di `Mod_Battle_Engine.txt`. Va re-esportato dal sorgente VBA originale prima di procedere con il porting degli handler `*_Click()` collegati alle shape PowerPoint.

Aspetto il tuo via libera (e risposta alle 3 domande) per partire.