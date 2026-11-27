#!/usr/bin/env python3
"""
Nuvole dipinte per le transizioni «in volo» fra mappa e luoghi.

Rumore frattale (fBm) modellato in cumuli, illuminato dall'alto a sinistra e tinto con
la luce calda e le ombre blu notte di Arkamon. Deterministico: stesso seme, stesse nuvole.

    python3 scripts/transitions/generate-clouds.py    # scrive public/ui/transitions/cloud-{1,2,3}.webp
"""
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.ndimage import zoom, gaussian_filter

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public/ui/transitions'
W, H = 1024, 576


def value_noise(rng, cells_x, cells_y):
    grid = rng.random((cells_y + 3, cells_x + 3))
    up = zoom(grid, (H / cells_y, W / cells_x), order=3)
    oy, ox = int(H / cells_y), int(W / cells_x)
    return up[oy:oy + H, ox:ox + W]


def fbm(seed, base=4, octaves=6):
    rng = np.random.default_rng(seed)
    total, amp, norm = np.zeros((H, W)), 1.0, 0.0
    for o in range(octaves):
        n = base * 2 ** o
        total += value_noise(rng, n, max(2, int(n * H / W))) * amp
        norm += amp
        amp *= 0.52
    return total / norm


def cloud(seed, blobs):
    """Un cumulo fatto di sfere fuse insieme, illuminato come un volume e sfrangiato ai bordi."""
    rng = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:H, 0:W].astype(float)
    k = 60.0  # unione morbida: le sfere si fondono invece di intersecarsi
    acc = np.zeros((H, W))
    for cx, cy, rx, ry in blobs:
        for _ in range(26):
            a = rng.uniform(0, 2 * np.pi)
            rr = rng.uniform(0, 1) ** 0.7
            px, py = cx + np.cos(a) * rx * rr * 0.9, cy + np.sin(a) * ry * rr * 0.75 - 0.04
            r = rng.uniform(0.05, 0.11) * (1.25 - rr * 0.6) * (1 if py < cy else 1.15)
            d2 = ((xx - px * W) / (r * W)) ** 2 + ((yy - py * H) / (r * W)) ** 2
            z = np.sqrt(np.clip(1 - d2, 0, 1)) * r
            acc += np.where(z > 0, np.exp(k * z) - 1, 0)
    height = np.log1p(acc) / k
    covered = height > 0.002
    # Rilievo: altezza ammorbidita più un velo di rumore che fa «ribollire» la superficie.
    detail = gaussian_filter(fbm(seed + 1, base=7, octaves=3), 4)
    relief = gaussian_filter(height, 5) + (detail - 0.5) * 0.03 * covered
    gy, gx = np.gradient(relief)
    scale = 320.0
    nx, ny = -gx * scale, -gy * scale
    nz = np.ones_like(nx)
    norm = np.sqrt(nx ** 2 + ny ** 2 + nz ** 2)
    nx, ny, nz = nx / norm, ny / norm, nz / norm
    lx, ly, lz = -0.5, -0.7, 0.5
    ln = np.sqrt(lx * lx + ly * ly + lz * lz)
    lambert = np.clip((nx * lx + ny * ly + nz * lz) / ln, 0, 1)
    thick = np.clip(height / (height.max() or 1), 0, 1)
    light = np.clip(0.15 + lambert * 0.95 - (yy / H) * 0.18 + thick * 0.08, 0, 1)
    light = gaussian_filter(light, 0.8)
    edge = gaussian_filter(covered.astype(float), 4)
    erosion = fbm(seed + 2, base=18, octaves=4)
    alpha = np.clip((edge - (1 - erosion) * 0.75) / 0.3, 0, 1)
    alpha = gaussian_filter(alpha, 1.0) * np.clip(0.55 + thick * 2.5, 0, 1)
    hi, mid, lo = np.array([255, 247, 230]), np.array([226, 222, 222]), np.array([104, 118, 162])
    t = light[..., None]
    rgb = np.where(t > 0.55, mid + (hi - mid) * (t - 0.55) / 0.45, lo + (mid - lo) * t / 0.55)
    return Image.fromarray(np.dstack([np.clip(rgb, 0, 255), np.clip(alpha, 0, 1) * 255]).astype(np.uint8), 'RGBA')


VARIANTS = [
    (11, [(0.30, 0.58, 0.26, 0.34), (0.52, 0.48, 0.30, 0.42), (0.74, 0.60, 0.24, 0.32)]),
    (23, [(0.36, 0.55, 0.32, 0.36), (0.64, 0.52, 0.30, 0.40)]),
    (37, [(0.22, 0.62, 0.20, 0.28), (0.44, 0.50, 0.26, 0.38), (0.66, 0.56, 0.24, 0.34), (0.84, 0.64, 0.14, 0.22)]),
]

if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    for index, (seed, blobs) in enumerate(VARIANTS, 1):
        path = OUT / f'cloud-{index}.webp'
        cloud(seed, blobs).save(path, 'WEBP', quality=80, method=6)
        print(path.relative_to(ROOT), path.stat().st_size // 1024, 'KB')
