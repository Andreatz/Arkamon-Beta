# VFX delle mosse · lotto pilota

27 novembre 2026. Prima di rifare i VFX di tutte le 515 mosse si confrontano tre metodi sulle stesse 8 mosse, una per tipo, ognuna di un Arkamon diverso: Carica ossidrica (Vyrath), Abisso tenebroso (Darklaw), Occhio universale (Felyss), Ardemonio (Impise), Tormenta glaciale (Blizzaquil), Elettrocarica (Grimbolt), Cratere (Clastoom), Divoramento (Weedrug).

| Metodo | Chi lo produce | Script |
|---|---|---|
| `codice` | Disegnato fotogramma per fotogramma in Skia | `python3 scripts/vfx-pilot/draw-vfx.py` (un file `fx_<mossa>.py` per effetto, primitive in `fxlib.py`; serve `pip install skia-python`) |
| `flow` | Clip di Flow (Veo) su verde #00FF00 o nero | `python3 scripts/vfx-pilot/import-vfx.py flow <id> <clip>` |
| `imagegen` | Foglio 3×3 di ChatGPT, trasparente o su verde/nero | `python3 scripts/vfx-pilot/import-vfx.py imagegen <id> <png> --grid 3x3` |

I prompt per Flow e ImageGen sono nel documento di progetto «arkamon-prompt-vfx-pilota».

## Formato

- Sprite sheet WebP trasparente in `public/vfx/moves/pilot/`, celle di 512 px, al massimo 6 colonne.
- Catalogo `src/data/vfx-pilot.json`: per ogni mossa le varianti dei tre metodi (durata, fotogramma d'impatto, ancoraggio, dimensione, spostamento verticale) e quella `active`, usata in battaglia. Gli script lo aggiornano; `--activate` su `import-vfx.py` rende attiva la variante importata.
- `src/components/vfx/pilotVfx.ts` registra le varianti come asset `pilot:<mossa>:<metodo>`. In battaglia la variante attiva prevale sull'assegnazione di ottobre (`move-vfx-assignments.json`), ma non sull'editor Admin. La mossa deve avere lo stesso id e lo stesso nome.
- Gli effetti disegnati in codice che toccano il bordo della cella vengono ridisegnati rimpiccioliti e la cella si allarga dello stesso fattore, così nulla viene tagliato.

## Confronto

VFX Lab (`dev.html#vfx-lab`), ricerca «Pilota». Con «Fissa come riferimento» si mette accanto la versione di ottobre (cerca «Moveset #037», ecc.) o un altro metodo.
