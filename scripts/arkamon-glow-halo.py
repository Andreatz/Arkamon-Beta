#!/usr/bin/env python3
"""Aloni di bagliore rimasti dallo schermo nelle animazioni degli Arkamon (27 novembre 2026).

Il bagliore degli effetti (fulmini, fiamme, energia) era girato sopra lo schermo verde, blu o
magenta. Lo scontorno lo ha tenuto come colore semitrasparente mescolato allo schermo: su fondo
scuro sembra luce, su fondi chiari diventa una patina olivastra, verdastra, azzurrina o violacea.

La correzione tratta quei pixel come luce sommata: il colore premoltiplicato (ciò che si vede su
fondo scuro) resta identico, il pixel diventa luce piena con opacità ridotta in proporzione e
perde la componente dello schermo. Riguarda solo pixel semitrasparenti lontani dal corpo opaco e
con la tinta tipica dello schermo usato dalla specie, quindi contorni e colori propri non cambiano.

    python3 scripts/arkamon-glow-halo.py scan                 # misura sulle pagine presenti
    python3 scripts/arkamon-glow-halo.py fix --species 101,102 [--actions attack,ko]

`fix` riscrive gli atlas lossless in public/sprites/arkamon/<id>/front/ e aggiorna i metadati
(sha256, dimensione, `key.glowHaloCleanup`); poi si rigenerano le pagine con
`node scripts/build-arkamon-pages.mjs --species <id> --actions <azioni>`.
"""
from __future__ import annotations

import argparse
import glob
import hashlib
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ACTIONS = ['idle', 'attack', 'hit', 'victory', 'ko']
TINT = {'green': (45, 170), 'blue': (170, 250), 'magenta': (270, 340)}
MIN_SATURATION = 0.25


def hue_deg(c: np.ndarray) -> np.ndarray:
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    return np.degrees(np.arctan2(np.sqrt(3) * (g - b), 2 * r - g - b)) % 360


def halo_mask(f: np.ndarray, screen: str, min_dist: int = 2) -> np.ndarray:
    a, c = f[..., 3], f[..., :3]
    near = cv2.dilate((a > 0.95).astype(np.uint8), np.ones((2 * min_dist + 1,) * 2, np.uint8)) > 0
    lo, hi = TINT[screen]
    hue = hue_deg(c)
    mx = c.max(2)
    sat = (mx - c.min(2)) / np.maximum(mx, 1e-3)
    # Grigi e fumi (poco saturi) restano come sono: sono colori propri, non schermo.
    return (a > 0.003) & (a < 0.97) & ~near & (hue >= lo) & (hue <= hi) & (mx > 0.02) & (sat > MIN_SATURATION)


def glow_fix(f: np.ndarray, screen: str) -> tuple[np.ndarray, int]:
    """Restituisce il fotogramma corretto (RGBA straight, 0–1) e il numero di pixel toccati."""
    mask = halo_mask(f, screen)
    if not mask.any():
        return f, 0
    c, a = f[..., :3].copy(), f[..., 3].copy()
    v = np.where(mask, np.maximum(c.max(2), 1e-3), 1.0)
    c = np.where(mask[..., None], c / v[..., None], c)
    a = np.where(mask, a * v, a)
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    if screen == 'green':
        c[..., 1] = np.where(mask, np.minimum(g, np.maximum(r, b)), g)
    elif screen == 'blue':
        c[..., 2] = np.where(mask, np.minimum(b, np.maximum(r, g)), b)
    else:
        spill = np.clip(np.minimum(r, b) - g, 0, None)
        c[..., 0] = np.where(mask, r - spill * 0.7, r)
        c[..., 2] = np.where(mask, b - spill * 0.7, b)
    return np.dstack([np.clip(c, 0, 1), a]), int(mask.sum())


def dirty_score(f: np.ndarray, screen: str) -> tuple[int, int]:
    """Pixel di alone «sporco» (patina scura e tinta dello schermo) e pixel visibili."""
    mask = halo_mask(f, screen)
    v = f[..., :3].max(2)
    return int((mask & (v < 0.8) & (f[..., 3] > 0.04)).sum()), int((f[..., 3] > 0.03).sum())


def metadata_path(sid: int, action: str) -> Path:
    return ROOT / 'public/sprites/arkamon' / str(sid) / 'front' / f'{action}.metadata.json'


def screen_of(sid: int, action: str) -> str:
    return json.loads(metadata_path(sid, action).read_text(encoding='utf-8'))['key'].get('screenColour', 'green')


def scan() -> None:
    clips = json.loads((ROOT / 'src/data/arkamon-paged.json').read_text(encoding='utf-8'))['clips']
    rows = []
    for clip in clips.values():
        sid, action = clip['speciesId'], clip['animation']
        try:
            screen = screen_of(sid, action)
        except FileNotFoundError:
            continue
        dirty = visible = 0
        for page in clip['pages']:
            stem = page['src'].rsplit('.', 1)[0]
            files = glob.glob(str(ROOT / 'public') + stem + '*.webp')
            if not files:
                continue
            sheet = np.asarray(Image.open(files[0]).convert('RGBA'), np.float32) / 255
            fw, fh = clip['frameWidth'], clip['frameHeight']
            for k in range(0, page['frameCount'], 2):
                r, col = divmod(k, page['columns'])
                d, v = dirty_score(sheet[r * fh:(r + 1) * fh, col * fw:(col + 1) * fw], screen)
                dirty += d
                visible += v
        if visible:
            rows.append((dirty / visible, sid, action, screen, dirty))
    rows.sort(reverse=True)
    out = ROOT / 'docs/arkamon-glow-halo-scan.json'
    out.write_text(json.dumps([{'speciesId': s, 'action': a, 'screen': sc, 'dirtyShare': round(r, 5), 'dirtyPixels': d}
                               for r, s, a, sc, d in rows], indent=1) + '\n', encoding='utf-8')
    for r, s, a, sc, d in rows[:40]:
        print(f'{r:.4f} {s:3d} {a:8s} {sc:7s} {d}')
    print('→', out)


def save_lossless(image: Image.Image, path: Path) -> None:
    image.save(path, 'WEBP', lossless=True, quality=100, method=1, exact=True)


def fix(species: list[int], actions: list[str]) -> None:
    for sid in species:
        for action in actions:
            meta_path = metadata_path(sid, action)
            if not meta_path.exists():
                continue
            meta = json.loads(meta_path.read_text(encoding='utf-8'))
            sheet_meta = meta['sheet']
            atlas = meta_path.with_name(sheet_meta['file'])
            data = np.asarray(Image.open(atlas).convert('RGBA'), np.float32) / 255
            screen = meta['key'].get('screenColour', 'green')
            cw, ch, cols = sheet_meta['cellWidth'], sheet_meta['cellHeight'], sheet_meta['columns']
            out = data.copy()
            touched = 0
            for i in range(sheet_meta['frameCount']):
                r, c = divmod(i, cols)
                cell = data[r * ch:(r + 1) * ch, c * cw:(c + 1) * cw]
                fixed, n = glow_fix(cell, screen)
                out[r * ch:(r + 1) * ch, c * cw:(c + 1) * cw] = fixed
                touched += n
            pixels = (np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8)
            pixels[pixels[..., 3] == 0, :3] = 0
            save_lossless(Image.fromarray(pixels, 'RGBA'), atlas)
            raw = atlas.read_bytes()
            sheet_meta['sha256'] = hashlib.sha256(raw).hexdigest()
            sheet_meta['sizeBytes'] = len(raw)
            meta['key']['glowHaloCleanup'] = {
                'date': '2026-11-27', 'screenColour': screen, 'pixels': touched,
                'method': 'Semitransparent screen-tinted glow away from the opaque body treated as additive light: '
                          'premultiplied colour preserved, colour normalised to full value, alpha reduced by the same factor, screen spill removed.',
            }
            meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
            print(f'{sid} {action}: {touched} pixel corretti')


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest='command', required=True)
    sub.add_parser('scan')
    f = sub.add_parser('fix')
    f.add_argument('--species', required=True)
    f.add_argument('--actions', default=','.join(ACTIONS))
    args = parser.parse_args()
    if args.command == 'scan':
        scan()
    else:
        fix([int(s) for s in args.species.split(',')], args.actions.split(','))


if __name__ == '__main__':
    main()
