Ho tutto il contesto necessario. Ecco il report consolidato.

---

# 🔍 Ricognizione Arkamon — Report consolidato

## PARTE A — Codice TypeScript attuale

### 1. `src/types/index.ts` — interfacce esistenti

**Tipi unione (string literals)**
- `TipoPokemon` — gli 8 tipi (Normale, Elettro, Fuoco, Terra, Acqua, Erba, Oscurità, Psico) ✅ allineato con CLAUDE.md
- `CategoriaHP` — Lenta / Media / Veloce / Leggendaria ✅
- `Probabilita` — Comune / Medio / Difficile (cespugli)
- `TipoAllenatore` — PVP / NPC
- `TipoBattaglia` — Selvatico / NPC / PVP
- `Lato` — A | B
- `SceneId` — 10 scene

**Dati statici (JSON)**
- `PokemonSpecie` { id, nome, categoria, tipo, hpBase, mosse: [3], livelloEvoluzione, evoluzioneId, tassoCattura }
- `MossaDef` { id, nome, tipo, **effetto**, **valoreEffetto**, dadiPerLivello, incrementoPerLivello }
  - ⚠️ Già presenti `effetto`/`valoreEffetto` in vista degli stati futuri (Cura, Riduzione...)
- `TabellaTipi`, `Mappa`, `IncontroSelvatico`, `AllenatoreDef`

**Stato runtime**
- `PokemonIstanza` { istanzaId, specieId, nome, livello, hp, xp }
  - ⚠️ **Manca**: stati alterati (sonno/confusione/avvelenamento) — coerente, non sono ancora stati implementati neanche in VBA
- `StatoGiocatore` { id, nome, squadra, deposito (record key "box:slot"), cespugliVisitati: Set, allenatoriSconfitti: Set }
  - ⚠️ **Manca**: monete (`monete: number`)
- `StatoBattaglia` { tipo, pokemonA/B, hpMaxA/B, turnoCorrente, squadraA/B, luogoRitorno, allenatoreId, log, evoluzioneInAttesa }
- `RisultatoMossa` (output della funzione di danno)
- `NavigazioneScena` { scena, payload }

---

### 2. `src/engine/battleEngine.ts` — funzioni esposte

| Funzione | Stato | Note |
|---|---|---|
| `calcolaHPMax(istanza)` | ⚠️ **Divergente dal VBA** | Usa `(livello-1)*crescita`. VBA usa `livello<=5 ? hpBase : hpBase + Int((livello-5)*hpPerLivello)`. **Risultato diverso a tutti i livelli ≤ 5 e leggermente off oltre.** |
| `getMossaAlLivello(mossa, livello)` | ✅ Completo | Con fallback al livello più vicino |
| `tiraDadi(n)` | ⚠️ Manca seed/rng iniettabile | CLAUDE.md richiede `rollD6(n, rng?)` per testabilità |
| `calcolaDanno(att, dif, idxMossa)` | ⚠️ **Diverge dal VBA**: applica STAB×1.5 al danno; nel VBA originale lo STAB è **solo** nell'AI. CLAUDE.md lo segnala esplicitamente come violazione |
| `tentaCattura(bersaglio)` | ⚠️ **Formula riscritta**: usa `tassoBase*0.7 + bonusHp + 0.1` con random in `[0,1)`. VBA usa `roll=3d6 (3..18)` confrontato con `tassoCattura*(2 - hp/hpMax)`. Numerologia completamente diversa. |
| `scegliMossaIA(att, dif)` | ✅ Quasi fedele | Implementa `(d*3.5+inc) * stab * tipo`. Bug minore: nessun tie-break 50/50 (VBA lo fa); manca anche bonus "Cura" come usato in VBA |
| `xpRichiestoPerLivello`, `applicaXP`, `xpGuadagnato` | ⚠️ **Estensione propria** | VBA dà 1 EXP/nemico, qui 50×(lv/5). Da concordare con utente |
| `determinaIniziativa` | ❌ **Stub** | Ritorna sempre 'A' — VBA confronta livelli e fa 50/50 in pareggio |
| `squadraSconfitta` | ✅ Helper completo |
| `BATTLE_CONSTANTS` | ✅ Centralizzato |

**Mancanti completamente vs VBA:**
- `CalcolaVariazioneMonete` (+200/+1000/-200)
- `ControllaSeEvolve` / `GestisciLevelUp` (lato engine; in TS è dentro `applicaXP`)
- `ScegliProssimoPokemonAllenatore` / `ScegliProssimoPokemonPvP_Random` (cambio Pokémon su KO)
- `ScegliIndicePesato` / `PesoCategoria` (selezione cespuglio pesata 60/30/10)
- `ApplicaStato` / `CalcolaDannoAutoinflitto` (effetti stato — anche VBA li ha solo come scaffolding)

---

### 3. `src/store/gameStore.ts` — shape e action

**Shape**
```
giocatore1, giocatore2: StatoGiocatore
giocatoreAttivo: 1 | 2
battaglia: StatoBattaglia | null
scenaCorrente, scenaPrecedente: NavigazioneScena
```

**Action presenti**
- Navigazione: `vaiAScena`, `scenaIndietro`, `cambiaGiocatoreAttivo`
- Squadra: `aggiungiPokemon` (con overflow su deposito 30×35 slot), `aggiornaPokemon`
- Cespugli: `segnaCespuglioVisitato`, `cespuglioVisitato`
- Battaglia: `iniziaBattaglia`, `aggiornaBattaglia`, `terminaBattaglia(curaCompleta)`
- `reset()`

**Persistenza**: localStorage via `persist` middleware con `partialize`/`merge` custom per i `Set`.

**Gap**:
- ❌ **Nessun campo `monete`** (e nessuna action di update)
- ❌ Nessuna action `sconfiggiAllenatore` (per popolare `allenatoriSconfitti`)
- ❌ Nessuna action di switch posto in squadra né di scambio squadra↔deposito
- ⚠️ Deposito 30×35=1050 slot vs. CLAUDE.md "3 box × ~35 slot" — leggera discrepanza con il design
- `creaIstanza` helper presente ✅

---

### 4. Scene presenti

| File | Riga descrittiva |
|---|---|
| `TitoloScene.tsx` | Schermata titolo con "Nuova Partita" / "Continua" + animazioni framer-motion |
| `LaboratorioScene.tsx` | Scelta starter (ID 1/5/9) a turni tra G1 e G2; alla fine vai a mappa |
| `MappaPrincipaleScene.tsx` | Stub: solo 3 nodi mock (Venezia, Percorso 1, Piacenza) + HUD turno + bottone "Test battaglia" |
| `BattagliaScene.tsx` | Demo hardcoded Vyrath vs Weedrug lvl 5: turno → mossa → danno → turno IA. Niente cattura, niente cambio Pokémon, niente XP/monete a fine battaglia |

**Scene dichiarate in `SceneId` ma NON implementate**: `percorso`, `citta`, `palestra`, `centro-pokemon`, `deposito`, `squadra` (6 scene mancanti).

---

## PARTE B — Codice VBA in `old_files/`

### 5. File presenti (estensione `.txt` non `.bas`)

| File richiesto | Presente come | Note |
|---|---|---|
| `Mod_Battle_Engine.bas` | ✅ `Mod_Battle_Engine.txt` (32 KB, 627 righe) | |
| `Mod_Game_Events.bas` | ✅ `Mod_Game_Events.txt` (23 KB, 519 righe) | |
| `Mod_UI_Manager.bas` | ✅ `Mod_UI_Manager.txt` (27 KB, 664 righe) | |
| `Mod_ButtonClick_Handlers.bas` | ⚠️ `Mod_ButtonClick_Handlers.txt` (32 KB, 627 righe) — **byte-identico a Mod_Battle_Engine.txt** | Sospetto duplicato per errore di export. Le firme e la dimensione corrispondono al 100%. Da verificare con l'utente |
| `Mod_Deposito.bas` | ✅ `Mod_Deposito.txt` (10 KB, 215 righe) | |
| `Mod_Utilities.bas` | ✅ `Mod_Utilities.txt` (24 KB, 570 righe) | |
| Screenshot `.png` | ✅ 16 screenshot (Screenshot 4–19) | Tra 1.7 MB e 3.4 MB ciascuno |

➕ Bonus: `Prompt.txt` (142 KB) presente ma non richiesto.

### 6. Sommari per modulo

**`Mod_Battle_Engine`** (Public principale + helper privati)
- `EseguiAzioneDiBattaglia(Azione, Parametro)` — entry point unico per ogni azione di battaglia (mossa A/B, cattura, cambio).
- `EseguiAzioneCattura()` — gestisce roll 3d6 + soglia.
- `EseguiScambio(SlotSelezionato)` — cambia Pokémon in battaglia su KO.
- Privati: `CalcolaEApplicaDanno`, `ApplicaStato`, `CalcolaDannoAutoinflitto`, `CalcolaVariazioneMonete`, `PulisciStato`, `SalvaHPGiocatore`, `TerminaBattaglia`, `AggiungiPokemonCatturato`.

**`Mod_Game_Events`**
- Setup partita: `ScegliPokemonPerGiocatore`, `AssegnaRivaleEVaiAllaMappa`, `ImpostaTurnoAttivo`.
- Mappa: `SpostaGiocatore(NuovaPosizione, ID_Diapositiva)`.
- Avvio battaglie: `IniziaBattagliaSelvatica(luogo, cespuglio)`, `IniziaBattagliaAllenatore(idAllenatore, nome, luogoRitorno)`.
- Evoluzione: `AvviaScenaEvoluzione`, `PreparaScenaEvoluzione`, `AvviaAnimazioneEvoluzione`, `ConcludiEvoluzione`, `ControllaEseguiEvoluzionePostBattaglia`.
- Deposito: `NavigaEApriDeposito(BoxNumero)`, `RitornaAllaBattaglia`.

**`Mod_UI_Manager`**
- Visibilità pulsanti per turno: `AbilitaPulsantiMosse`, `AbilitaPulsantiPerTurno`, `ResettaStatoPulsantiBattaglia`, `GestisciVisibilitaIconeMosse`.
- Refresh schermo: `AggiornaInterfacciaBattaglia_DaTrigger(_SullaSlideSpecifica)`, `AggiornaPulsantiMossa`, `AggiornaSpritePokemon`, `AggiornaUI_PostAzione`.
- Info box e fine battaglia: `MostraInfoBox`, `MostraInfoSuSlideCorrente`, `NascondiSoloInfoBox`, `GetSlideIDPostBattaglia`, `TornaAllaMappa`.
- Schermata scambio: `MostraSchermataScambio`, `GestisciVisibilitaInterfacciaScambio`, `EseguiScambio_B`.
- Lettura completa stato battaglia: `LeggiDatiCompletiBattaglia`.

**`Mod_ButtonClick_Handlers`** ⚠️ DUPLICATO di `Mod_Battle_Engine` (stessi 11 nomi, stesso byte count). Da segnalare all'utente: probabilmente il vero handler dei click è andato perso/non esportato.

**`Mod_Deposito`**
- `ApriInterfacciaDeposito(BoxNumero)` — apre la slide del box e popola gli slot.
- `GestisciClickSlot(SlotID, Provenienza)` — selezione/scambio fra squadra e deposito.
- Helper: `PopolaSlot`, `PulisciUI_Deposito`, `EvidenziaSlot`, `GetIstanzaDaSlot`, `EseguiScambioDati`.

**`Mod_Utilities`** (la libreria pura — la base per il porting di `engine/`)
- Calcoli: `CalcolaHPMax`, `LanciaDadi`, `OttieniParametriMossaAlLivello`, `TipoMultiplier`, `RoundIntHalfUp`, `ClampLivello`.
- AI/scelta: `ScegliMossaIA`, `ScegliIndicePesato`, `PesoCategoria`, `DeterminaPrimoTurno`, `ScegliProssimoPokemonAllenatore`, `ScegliProssimoPokemonPvP_Random`.
- Progressione: `ControllaSeEvolve`, `GestisciLevelUp`.
- Helper Excel: `ColonnaDadiPerLivello`, `ColonnaIncrementoPerLivello`, `TrovaColonnaHeader`, `GetPokemonDetailsFromInstance`, `GetTipoFromIDBase`.
- CSV state: `CSVAppendUnique`, `CSVContains`.
- Squadra/deposito: `ControllaSquadraRimanente`, `ProssimoBox`, `CloseDatabaseWorkbook`.

### 7. `Database.xlsx`

✅ Presente. **Pesa 180 KB** (`du -h`). Non aperto.

---

## PARTE C — Gap analysis "Fase A — Parità con VBA"

| # | Voce roadmap | Stato TS | VBA corrispondente | Complessità |
|---|---|---|---|---|
| 1 | Battaglia selvatica (mossa, cattura, AI random) | **Parziale** — demo hardcoded, cattura presente ma con formula sbagliata, AI è "smart" non "random" | `EseguiAzioneDiBattaglia`, `EseguiAzioneCattura`, AI random in cespuglio | **M** |
| 2 | Battaglia NPC (AI con STAB+tipo) | **Parziale** — `scegliMossaIA` esiste ma manca tutto il flusso (squadre, switch su KO, monete) | `IniziaBattagliaAllenatore`, `ScegliMossaIA`, `ScegliProssimoPokemonAllenatore` | **L** |
| 3 | Battaglia PvP (due pulsantiere) | **Assente** | Stesso entry point + slide PvP | **M** |
| 4 | Calcolo danno con efficacia + messaggi ("Superefficace!") | **Completo, ma divergente** — applica STAB al danno (vietato da CLAUDE.md) e usa `Math.floor` invece di `RoundIntHalfUp` | `CalcolaEApplicaDanno`, `TipoMultiplier` | **S** (correzione) |
| 5 | XP e level-up con scaling mosse | **Parziale, formula propria** — non è 1 EXP/nemico VBA | `GestisciLevelUp`, `CalcolaHPMax` | **S** |
| 6 | Evoluzioni con scena dedicata | **Assente** — solo flag `evoluzioneInAttesa` nel tipo | `AvviaScenaEvoluzione`, `PreparaScenaEvoluzione`, `ConcludiEvoluzione`, `ControllaEseguiEvoluzionePostBattaglia` | **M** |
| 7 | Sistema monete (+200/+1000/-200) | **Assente** — manca campo `monete` nello store | `CalcolaVariazioneMonete` | **S** |
| 8 | Deposito 3 box, scambio | **Assente** scena UI; **store**: ha `deposito` ma 30×35 slot | `Mod_Deposito` intero, `EseguiScambio` | **L** |
| 9 | Cambio Pokémon in battaglia su KO | **Assente** | `EseguiScambio`, `ScegliProssimoPokemonAllenatore`, `ScegliProssimoPokemonPvP_Random` | **M** |
| 10 | Pokémon scartato → Rivale | **Assente** — laboratorio rimuove l'ID dalla lista ma non lo salva da nessuna parte | `AssegnaRivaleEVaiAllaMappa` | **S** |
| 11 | Cespugli 1-time pesati 60/30/10 | **Parziale** — store ha `cespugliVisitati` ma manca selezione pesata e dati `Incontri_Selvatici` | `ScegliIndicePesato`, `PesoCategoria`, `IniziaBattagliaSelvatica` | **M** |
| 12 | Mappa principale 28 nodi | **Stub** — solo 3 nodi placeholder | `SpostaGiocatore` + slide IDs in CLAUDE.md | **M** (visivo) |

**Bug noti aggiuntivi rilevati**:
- `calcolaHPMax` — formula sbagliata (vedi PARTE A.2).
- `tentaCattura` — non usa 3d6 come VBA.
- `tiraDadi` — non accetta RNG (richiesto da convenzioni TS in CLAUDE.md).
- `determinaIniziativa` — stub fisso ad 'A'.
- `MossaDef` ha `effetto/valoreEffetto`, ma i JSON dei dati (in `src/data/`, non ispezionati qui) potrebbero non popolarli — da verificare.

---

## ✅ Prossimo task concreto suggerito

**Allineamento engine puro al VBA — "fix delle formule autoritative"** (1 commit, S/M).

Motivazione: tutto il resto della Fase A (battaglie complete, XP, monete, evoluzioni, cespugli) chiama funzioni di `battleEngine.ts`. Se le formule sono sbagliate, ogni feature costruita sopra erediterà i bug. È il prerequisito *gratis* di tutto il resto.

Contenuto del task:
1. **`calcolaHPMax`** — sostituire `(lv-1)*crescita` con la formula VBA `lv<=5 ? hpBase : hpBase + Int((lv-5)*hpPerLivello)`.
2. **`calcolaDanno`** — rimuovere lo STAB dal calcolo (mantenerlo solo nell'AI), come dichiarato in CLAUDE.md riga "⚠️ Lo STAB NON è applicato al danno". Sostituire `Math.floor` con un `roundHalfUp` come in `Mod_Utilities.RoundIntHalfUp`.
3. **`tentaCattura`** — riportare alla formula `roll=3d6` vs `tassoCattura*(2 - hp/hpMax)`.
4. **`tiraDadi` → `rollD6(n, rng?)`** — accettare RNG iniettabile per i test (convenzione CLAUDE.md).
5. **`determinaIniziativa`** — confronto livelli con tie-break 50/50 come `Mod_Utilities.DeterminaPrimoTurno`.

Tutto in `src/engine/battleEngine.ts`. Niente UI, niente store: cambia 5 funzioni pure, niente API rotta verso le scene (le firme restano).

**Dopo questo:** scegliere se procedere con (a) sistema monete + scena `percorso` reale + cespugli pesati → unblock battaglia selvatica completa, oppure (b) deposito + scambio squadra → unblock progressione lunga. Voto per (a) perché chiude un loop end-to-end giocabile (esplora → cespuglio → battaglia → cattura → squadra), mentre (b) richiede prima dati popolati nelle squadre.

Vuoi che proceda con il task 1 (allineamento engine)?