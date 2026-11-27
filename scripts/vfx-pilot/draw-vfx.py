#!/usr/bin/env python3
"""Disegna in codice gli 8 VFX del lotto pilota (metodo 3) e li registra nel catalogo.

    python3 scripts/vfx-pilot/draw-vfx.py            # tutti
    python3 scripts/vfx-pilot/draw-vfx.py 37 10      # solo alcune mosse

Ogni effetto è in `fx_<mossa>.py` (primitive comuni in `fxlib.py`); serve skia-python
(`pip install skia-python`). Il disegno è deterministico: stessi file a ogni esecuzione.
"""
import importlib
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from vfx_sheet import PILOT_MOVES, write_variant  # noqa: E402
import fxlib  # noqa: E402

MODULES = {4: 'fx_carica_ossidrica', 31: 'fx_abisso_tenebroso', 58: 'fx_occhio_universale', 37: 'fx_ardemonio',
           10: 'fx_tormenta_glaciale', 19: 'fx_elettrocarica', 13: 'fx_cratere', 73: 'fx_divoramento'}

for move_id in [int(a) for a in sys.argv[1:]] or MODULES:
    frames, meta = importlib.import_module(MODULES[move_id]).build()
    entry = write_variant(move_id, 'codice', frames, fps=meta['fps'], impact_frame=meta['impact_frame'], anchor=meta['anchor'],
                          size=round(meta['size'] / fxlib.LAST_FIT[0]), offset_y=meta['offset_y'],
                          notes=f"Disegnato in codice ({MODULES[move_id]}.py), {PILOT_MOVES[move_id]['arkamon']}.")
    print(f"  adattamento {fxlib.LAST_FIT[0]:.2f}")
    print(f"{move_id:3d} {PILOT_MOVES[move_id]['name']:<18} {len(frames)} fotogrammi, {entry['bytes'] // 1024} KB, impatto {entry['impactAtMs']} ms")
