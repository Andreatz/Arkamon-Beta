#!/usr/bin/env python3
"""Porta nel gioco il VFX di una mossa generato con Gemini/Flow o con ImageGen.

    python3 scripts/vfx-pilot/import-vfx.py flow 4 asset-inbox/vfx/gemini/004_carica_ossidrica.mp4
    python3 scripts/vfx-pilot/import-vfx.py imagegen 4 asset-inbox/vfx/imagegen/004_carica_ossidrica.png
    python3 scripts/vfx-pilot/import-vfx.py --inbox asset-inbox/vfx      # tutte le consegne, dal nome del file

- Clip (Gemini o Flow, MP4 o GIF) su verde #00FF00, magenta #FF00FF o nero, riconosciuti dagli angoli.
  Tolgo lo sfondo, trovo inizio e fine dell'effetto, ritaglio un quadrato stabile e tengo al massimo
  36 fotogrammi.
- ImageGen: foglio di pose chiave (3×3 di norma), trasparente oppure su verde, magenta o nero. Fra una
  posa e l'altra calcolo gli intermedi seguendo il movimento (flusso ottico), per arrivare a 24 fps.
Il fotogramma d'impatto è quello con più copertura e luce; si può forzare con --impact.
"""
from __future__ import annotations

import argparse
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image

from vfx_sheet import fit_square, write_variant

MAX_FRAMES = 36


def key_frame(rgb: np.ndarray, background: str) -> np.ndarray:
    """RGB float → RGBA straight alpha, togliendo lo sfondo verde o nero."""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    if background == 'magenta':
        keyness = np.minimum(r, b) - g
        alpha = 1 - np.clip((keyness - 0.12) / 0.25, 0, 1)
        out = rgb.copy()
        edge = alpha < 0.999
        spill = np.clip(keyness, 0, None) * (1 - alpha)
        out[..., 0] = np.where(edge, np.minimum(r - spill, np.maximum(g, b)), r)
        out[..., 2] = np.where(edge, np.minimum(b - spill, np.maximum(g, r)), b)
        return np.dstack([np.clip(out, 0, 1), alpha])
    if background == 'green':
        greenness = g - np.maximum(r, b)
        alpha = 1 - np.clip((greenness - 0.12) / 0.25, 0, 1)
        out = rgb.copy()
        edge = alpha < 0.999
        out[..., 1] = np.where(edge, np.minimum(g - np.clip(greenness, 0, None) * (1 - alpha), np.maximum(r, b)), g)
        return np.dstack([np.clip(out, 0, 1), alpha])
    peak = rgb.max(axis=2)
    alpha = np.clip((peak - 0.03) / 0.97, 0, 1)
    color = np.where(alpha[..., None] > 1e-3, rgb / np.maximum(peak[..., None], 1e-3), 0)
    return np.dstack([np.clip(color, 0, 1), alpha])


def detect_background(rgb: np.ndarray) -> str:
    corners = np.concatenate([rgb[:8, :8].reshape(-1, 3), rgb[:8, -8:].reshape(-1, 3), rgb[-8:, :8].reshape(-1, 3), rgb[-8:, -8:].reshape(-1, 3)])
    mean = corners.mean(axis=0)
    if mean[1] > 0.5 and mean[1] > mean[0] + 0.25 and mean[1] > mean[2] + 0.25:
        return 'green'
    if mean[0] > 0.5 and mean[2] > 0.5 and mean[1] < min(mean[0], mean[2]) - 0.25:
        return 'magenta'
    if mean.max() < 0.12:
        return 'black'
    return 'none'


def read_clip(path: Path) -> tuple[np.ndarray, float]:
    probe = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate',
                            '-of', 'csv=p=0', str(path)], capture_output=True, text=True, check=True).stdout.strip().split(',')
    w, h = int(probe[0]), int(probe[1])
    num, den = probe[2].split('/')
    fps = float(num) / float(den)
    scale = min(1.0, 1280 / w)
    W, H = int(w * scale) // 2 * 2, int(h * scale) // 2 * 2
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-an', '-vf', f'scale={W}:{H}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3).astype(np.float32) / 255, fps


def union_box(frames: list[np.ndarray], threshold: float = 0.06) -> tuple[int, int, int, int]:
    mask = np.zeros(frames[0].shape[:2], bool)
    for frame in frames:
        mask |= frame[..., 3] > threshold
    ys, xs = np.nonzero(mask)
    if not len(xs):
        raise SystemExit('Nessun effetto visibile dopo aver tolto lo sfondo')
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def energy(frame: np.ndarray) -> float:
    return float((frame[..., 3] * (0.4 + 0.6 * frame[..., :3].max(axis=2))).sum())


def from_flow(path: Path) -> tuple[list[np.ndarray], int, int]:
    clip, fps = read_clip(path)
    background = detect_background(clip[0])
    if background == 'none':
        raise SystemExit('Sfondo non riconosciuto: serve verde #00FF00, magenta #FF00FF o nero pieni')
    keyed = [key_frame(frame, background) for frame in clip]
    weights = np.array([frame[..., 3].sum() for frame in keyed])
    active = np.nonzero(weights > weights.max() * 0.01)[0]
    first, last = int(active[0]), int(active[-1])
    span = keyed[first:last + 1]
    # Al massimo 24 fotogrammi: si campiona in modo uniforme e il ritmo si adatta.
    count = min(MAX_FRAMES, len(span))
    picks = np.linspace(0, len(span) - 1, count).round().astype(int)
    chosen = [span[i] for i in picks]
    out_fps = max(8, round(fps * count / len(span)))
    box = union_box(chosen)
    frames = [fit_square(frame, box) for frame in chosen]
    impact = int(np.argmax([energy(frame) for frame in frames]))
    print(f'{path.name}: sfondo {background}, effetto {first / fps:.2f}–{last / fps:.2f} s, {count} fotogrammi a {out_fps} fps')
    return frames, out_fps, impact


def from_sheet(path: Path, grid: str, steps: int = 3) -> tuple[list[np.ndarray], int, int]:
    columns, rows = (int(value) for value in grid.lower().split('x'))
    image = Image.open(path).convert('RGBA')
    data = np.asarray(image, np.float32) / 255
    h, w = data.shape[:2]
    cells = []
    for row in range(rows):
        for column in range(columns):
            cell = data[round(h * row / rows):round(h * (row + 1) / rows), round(w * column / columns):round(w * (column + 1) / columns)]
            cells.append(cell)
    opaque = data[..., 3].min() > 0.99
    if opaque:
        background = detect_background(data[..., :3])
        if background == 'none':
            raise SystemExit('Foglio senza trasparenza e con sfondo non riconosciuto')
        cells = [key_frame(cell[..., :3], background) for cell in cells]
    # Le celle hanno lo stesso centro: un unico riquadro per tutte, nelle coordinate della cella.
    size = min(cell.shape[0] for cell in cells), min(cell.shape[1] for cell in cells)
    cells = [cell[:size[0], :size[1]] for cell in cells]
    cells = [cell for cell in cells if cell[..., 3].max() > 0.05] or cells
    box = union_box(cells)
    keys = [fit_square(cell, box) for cell in cells]
    frames = inbetween(keys, steps) if steps > 1 else keys
    impact = int(np.argmax([energy(frame) for frame in frames]))
    print(f'{path.name}: {len(keys)} pose, sfondo {"trasparente" if not opaque else "tolto"}, {len(frames)} fotogrammi')
    return frames, 24 if steps > 1 else 12, impact


def inbetween(keys: list[np.ndarray], steps: int) -> list[np.ndarray]:
    """Fotogrammi intermedi fra pose chiave: ogni posa viene spostata lungo il flusso ottico verso la
    successiva e le due si fondono (alpha premoltiplicato, niente aloni)."""
    import cv2
    dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
    premul = []
    for key in keys:
        p = key.copy()
        p[..., :3] *= p[..., 3:4]
        premul.append(p)
    gray = lambda f: (np.clip(f[..., :3].mean(axis=2) * 0.5 + f[..., 3] * 0.5, 0, 1) * 255).astype(np.uint8)
    h, w = premul[0].shape[:2]
    gx, gy = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32))
    def warp(img, flow, t):
        return cv2.remap(img, gx - flow[..., 0] * t, gy - flow[..., 1] * t, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
    out = []
    for a, b in zip(premul, premul[1:]):
        fab = dis.calc(gray(a), gray(b), None)
        fba = dis.calc(gray(b), gray(a), None)
        out.append(a)
        for k in range(1, steps):
            t = k / steps
            out.append(warp(a, fab, t) * (1 - t) + warp(b, fba, 1 - t) * t)
    out.append(premul[-1])
    straight = []
    for p in out:
        f = p.copy()
        f[..., :3] = np.where(f[..., 3:4] > 1e-4, f[..., :3] / np.maximum(f[..., 3:4], 1e-4), 0)
        straight.append(np.clip(f, 0, 1))
    return straight


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('method', nargs='?', choices=['flow', 'gemini', 'imagegen'])
    parser.add_argument('move', nargs='?', type=int)
    parser.add_argument('source', nargs='?', type=Path)
    parser.add_argument('--inbox', type=Path, help='cartella con imagegen/ e gemini/ (file <id>_<mossa>.*)')
    parser.add_argument('--steps', type=int, default=3, help='intermedi per ImageGen: fotogrammi per intervallo (1 = nessuno)')
    parser.add_argument('--grid', default='3x3', help='griglia del foglio ImageGen (colonne x righe)')
    parser.add_argument('--impact', type=int, help='fotogramma d\'impatto (da 0)')
    parser.add_argument('--fps', type=int, help='forza la velocità')
    parser.add_argument('--offset-y', type=int, default=0, help='spostamento verticale sul bersaglio (px)')
    parser.add_argument('--activate', action='store_true', help='usa questa variante in battaglia')
    args = parser.parse_args()
    jobs = []
    if args.inbox:
        for folder, method in (('imagegen', 'imagegen'), ('gemini', 'flow'), ('flow', 'flow')):
            for path in sorted((args.inbox / folder).glob('*')):
                match = path.stem.split('_', 1)[0]
                if match.isdigit() and path.suffix.lower() in ('.png', '.webp', '.jpg', '.mp4', '.mov', '.webm', '.gif'):
                    jobs.append((method, int(match), path))
    elif args.method and args.move and args.source:
        jobs.append(('flow' if args.method == 'gemini' else args.method, args.move, args.source))
    else:
        parser.error('serve METODO MOSSA FILE oppure --inbox CARTELLA')
    for method, move, source in jobs:
        frames, fps, impact = from_flow(source) if method == 'flow' else from_sheet(source, args.grid, args.steps)
        entry = write_variant(move, method, frames, fps=args.fps or fps, impact_frame=args.impact if args.impact is not None else impact,
                              offset_y=args.offset_y, activate=args.activate, notes=f'Importato da {source.name}.')
        print(f"→ {entry['src']} ({entry['bytes'] // 1024} KB), impatto a {entry['impactAtMs']} ms su {entry['durationMs']} ms")


if __name__ == '__main__':
    main()
