#!/usr/bin/env python3
"""Porta nel gioco un VFX del lotto pilota generato con Flow o con ImageGen.

    python3 scripts/vfx-pilot/import-vfx.py flow 4 asset-inbox/vfx-pilota/flow/004_carica_ossidrica.mp4
    python3 scripts/vfx-pilot/import-vfx.py imagegen 4 asset-inbox/vfx-pilota/imagegen/004_carica_ossidrica.png --grid 3x3

- Flow: clip su verde #00FF00 o su nero (riconosciuto dagli angoli). Tolgo lo sfondo, trovo
  l'inizio e la fine dell'effetto, ritaglio un quadrato stabile e tengo al massimo 24 fotogrammi.
- ImageGen: foglio a griglia regolare, trasparente oppure su verde o nero.
Il fotogramma d'impatto è quello con più copertura e luce; si può forzare con --impact.
"""
from __future__ import annotations

import argparse
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image

from vfx_sheet import PILOT_MOVES, fit_square, write_variant

MAX_FRAMES = 24


def key_frame(rgb: np.ndarray, background: str) -> np.ndarray:
    """RGB float → RGBA straight alpha, togliendo lo sfondo verde o nero."""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
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
        raise SystemExit('Sfondo non riconosciuto: serve verde #00FF00 pieno o nero pieno')
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


def from_sheet(path: Path, grid: str) -> tuple[list[np.ndarray], int, int]:
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
    frames = [fit_square(cell, box) for cell in cells]
    impact = int(np.argmax([energy(frame) for frame in frames]))
    print(f'{path.name}: {len(frames)} celle, sfondo {"trasparente" if not opaque else "tolto"}')
    return frames, 12, impact


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('method', choices=['flow', 'imagegen'])
    parser.add_argument('move', type=int, choices=sorted(PILOT_MOVES))
    parser.add_argument('source', type=Path)
    parser.add_argument('--grid', default='3x3', help='griglia del foglio ImageGen (colonne x righe)')
    parser.add_argument('--impact', type=int, help='fotogramma d\'impatto (da 0)')
    parser.add_argument('--fps', type=int, help='forza la velocità')
    parser.add_argument('--offset-y', type=int, default=0, help='spostamento verticale sul bersaglio (px)')
    parser.add_argument('--activate', action='store_true', help='usa questa variante in battaglia')
    args = parser.parse_args()
    frames, fps, impact = from_flow(args.source) if args.method == 'flow' else from_sheet(args.source, args.grid)
    entry = write_variant(args.move, args.method, frames, fps=args.fps or fps, impact_frame=args.impact if args.impact is not None else impact,
                          offset_y=args.offset_y, activate=args.activate, notes=f'Importato da {args.source.name}.')
    print(f"→ {entry['src']} ({entry['bytes'] // 1024} KB), impatto a {entry['impactAtMs']} ms su {entry['durationMs']} ms")


if __name__ == '__main__':
    main()
