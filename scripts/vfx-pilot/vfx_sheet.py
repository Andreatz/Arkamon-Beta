"""Formato comune dei VFX del lotto pilota (27 novembre 2026).

Ogni VFX è uno sprite sheet WebP trasparente a celle quadrate di 512 px, più una voce in
`src/data/vfx-pilot.json`. I tre metodi (codice, Flow, ImageGen) producono lo stesso
formato, così il gioco e il VFX Lab li trattano allo stesso modo.
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / 'public' / 'vfx' / 'moves' / 'pilot'
CATALOG = ROOT / 'src' / 'data' / 'vfx-pilot.json'
CELL = 512
METHODS = ('codice', 'flow', 'imagegen')

# Le 8 mosse del pilota: id della mossa → nome, Arkamon, posizione sul bersaglio.
# `offsetY` sposta l'effetto (in px della battaglia) per quelli che nascono dal suolo.
PILOT_MOVES: dict[int, dict] = {
    4: {'name': 'Carica ossidrica', 'type': 'Normale', 'arkamon': 'Vyrath', 'arkamonId': 4, 'slug': 'carica_ossidrica'},
    31: {'name': 'Abisso tenebroso', 'type': 'Oscurità', 'arkamon': 'Darklaw', 'arkamonId': 8, 'slug': 'abisso_tenebroso'},
    58: {'name': 'Occhio universale', 'type': 'Psico', 'arkamon': 'Felyss', 'arkamonId': 12, 'slug': 'occhio_universale'},
    37: {'name': 'Ardemonio', 'type': 'Fuoco', 'arkamon': 'Impise', 'arkamonId': 76, 'slug': 'ardemonio'},
    10: {'name': 'Tormenta glaciale', 'type': 'Acqua', 'arkamon': 'Blizzaquil', 'arkamonId': 73, 'slug': 'tormenta_glaciale'},
    19: {'name': 'Elettrocarica', 'type': 'Elettro', 'arkamon': 'Grimbolt', 'arkamonId': 25, 'slug': 'elettrocarica'},
    13: {'name': 'Cratere', 'type': 'Terra', 'arkamon': 'Clastoom', 'arkamonId': 18, 'slug': 'cratere'},
    73: {'name': 'Divoramento', 'type': 'Erba', 'arkamon': 'Weedrug', 'arkamonId': 48, 'slug': 'divoramento'},
}


def move_info(move_id: int) -> dict:
    """Nome, tipo e Arkamon di una mossa qualsiasi (le 8 pilota hanno già i loro dati)."""
    if move_id in PILOT_MOVES:
        return PILOT_MOVES[move_id]
    import re
    import unicodedata
    moves = {m['id']: m for m in json.loads((ROOT / 'src/data/mosse.json').read_text(encoding='utf-8'))}
    species = json.loads((ROOT / 'src/data/pokemon.json').read_text(encoding='utf-8'))
    if move_id not in moves:
        raise SystemExit(f'Mossa {move_id} inesistente')
    owners = [s for s in species if move_id in s['mosse']]
    owner = max(owners, key=lambda s: s['id']) if owners else {'nome': '?', 'id': 0}
    name = moves[move_id]['nome']
    slug = re.sub(r'[^a-z0-9]+', '_', unicodedata.normalize('NFKD', name).encode('ascii', 'ignore').decode().lower()).strip('_')
    return {'name': name, 'type': moves[move_id]['tipo'], 'arkamon': owner['nome'], 'arkamonId': owner['id'], 'slug': slug}


def load_catalog() -> dict:
    if CATALOG.exists():
        return json.loads(CATALOG.read_text(encoding='utf-8'))
    return {'note': 'Lotto pilota dei VFX: tre metodi a confronto sulle stesse 8 mosse. Generato da scripts/vfx-pilot.', 'moves': {}}


def save_catalog(catalog: dict) -> None:
    catalog['moves'] = dict(sorted(catalog['moves'].items(), key=lambda item: int(item[0])))
    CATALOG.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def pack(frames: list[np.ndarray], columns: int | None = None) -> Image.Image:
    """Impagina fotogrammi RGBA (float 0–1, straight alpha, CELL×CELL) in un foglio."""
    count = len(frames)
    columns = columns or min(count, 6)
    rows = (count + columns - 1) // columns
    sheet = np.zeros((rows * CELL, columns * CELL, 4), np.float32)
    for index, frame in enumerate(frames):
        row, column = divmod(index, columns)
        sheet[row * CELL:(row + 1) * CELL, column * CELL:(column + 1) * CELL] = frame
    return Image.fromarray((np.clip(sheet, 0, 1) * 255 + 0.5).astype(np.uint8), 'RGBA')


def write_variant(move_id: int, method: str, frames: list[np.ndarray], *, fps: int, impact_frame: int,
                  anchor: str = 'target', size: int = 460, offset_y: int = 0, blend: str = 'normal',
                  activate: bool = False, notes: str = '') -> dict:
    if method not in METHODS:
        raise ValueError(method)
    move = move_info(move_id)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    columns = min(len(frames), 6)
    sheet = pack(frames, columns)
    name = f'{move_id:03d}_{move["slug"]}_{method}.webp'
    sheet.save(OUT_DIR / name, 'WEBP', quality=74, alpha_quality=72, method=6)
    duration = round(len(frames) / fps * 1000)
    entry = {
        'src': f'vfx/moves/pilot/{name}',
        'sprite': {'frameWidth': CELL, 'frameHeight': CELL, 'columns': columns,
                   'rows': (len(frames) + columns - 1) // columns, 'frameCount': len(frames), 'fps': fps},
        'durationMs': duration,
        'impactAtMs': round(impact_frame / fps * 1000),
        'anchor': anchor,
        'width': size,
        'height': size,
        'offsetY': offset_y,
        'blendMode': blend,
        'bytes': (OUT_DIR / name).stat().st_size,
        'notes': notes,
    }
    catalog = load_catalog()
    record = catalog['moves'].setdefault(str(move_id), {
        'name': move['name'], 'type': move['type'], 'arkamon': move['arkamon'], 'arkamonId': move['arkamonId'],
        'active': method, 'variants': {},
    })
    record['variants'][method] = entry
    if activate or record.get('active') not in record['variants']:
        record['active'] = method
    save_catalog(catalog)
    return entry


def fit_square(rgba: np.ndarray, box: tuple[int, int, int, int], pad: float = 0.06) -> np.ndarray:
    """Ritaglia un quadrato centrato sul riquadro e lo porta a CELL×CELL (alpha premoltiplicato nel ridimensionamento)."""
    x0, y0, x1, y1 = box
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    side = max(x1 - x0, y1 - y0) * (1 + 2 * pad)
    h, w = rgba.shape[:2]
    left, top = int(round(cx - side / 2)), int(round(cy - side / 2))
    s = int(round(side))
    canvas = np.zeros((s, s, 4), np.float32)
    sx0, sy0 = max(0, left), max(0, top)
    sx1, sy1 = min(w, left + s), min(h, top + s)
    canvas[sy0 - top:sy1 - top, sx0 - left:sx1 - left] = rgba[sy0:sy1, sx0:sx1]
    image = Image.fromarray((np.clip(canvas, 0, 1) * 255 + 0.5).astype(np.uint8), 'RGBA')
    # Ridimensionamento in alpha premoltiplicato ('RGBa'): niente aloni scuri sui bordi.
    image = image.convert('RGBa').resize((CELL, CELL), Image.LANCZOS).convert('RGBA')
    out = np.asarray(image, np.float32) / 255
    return out
