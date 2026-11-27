#!/usr/bin/env python3
"""Prepara le clip di transizione generate con Flow (lotto 5) per il gioco.

Ogni clip diventa un MP4 H.264 con l'alfa «impilato»: in alto il colore premoltiplicato,
in basso l'opacità in scala di grigi. Il gioco le compone in WebGL (`TransitionClip.tsx`),
così funzionano allo stesso modo in Chrome, Safari e nell'app desktop.

    python3 scripts/transitions/build-clips.py --incontro tx_incontro.mp4 --luce tx_luce.mp4

Le sorgenti restano fuori dal repository (1080p, con traccia audio da scartare).

- `incontro`: schegge su fondo verde #00FF00. Chiave fatta a mano: la chromakey di ffmpeg
  rendeva trasparenti i neri e spostava l'oro verso l'arancio.
- `luce`: luce su fondo nero. L'opacità è il canale più luminoso; nei fotogrammi del bianco
  pieno è forzata a 1, così il cambio di scena avviene sotto una copertura totale.

I tempi (`coverAt`, `durationS`) finiscono in `src/data/transitionClips.json`.
"""
import argparse
import json
import subprocess
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / 'public' / 'ui' / 'transitions'
DATA = ROOT / 'src' / 'data' / 'transitionClips.json'
W, H, FPS = 1280, 720, 24

# Fotogrammi della sorgente (a 24 fps) misurati il 27 novembre 2026.
CLIPS = {
    'incontro': {
        'mode': 'key', 'first': 19, 'last': 68,
        # Schegge quasi del tutto spente sul nero: la Carta VS prende il suo posto.
        'cover': 56,
        'solid': (45, 68),
        'label': 'Schegge a spirale che si chiudono al nero (inizio battaglia)',
    },
    'luce': {
        'mode': 'light', 'first': 22, 'last': 78,
        # Centro dei cinque fotogrammi di bianco pieno (42–46).
        'cover': 44,
        'solid': (42, 46),
        'label': 'Esplosione di luce dorata che si apre sulla scena nuova (fine battaglia)',
    },
}


def read_frames(path: Path) -> np.ndarray:
    raw = subprocess.run(
        ['ffmpeg', '-v', 'error', '-i', str(path), '-an', '-vf', f'scale={W}:{H}:flags=lanczos',
         '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
        capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)


def key_green(frame: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    f = frame.astype(np.float32) / 255
    r, g, b = f[..., 0], f[..., 1], f[..., 2]
    greenness = g - np.maximum(r, b)
    alpha = 1 - np.clip((greenness - 0.12) / 0.25, 0, 1)
    spill = np.clip(greenness, 0, None) * (1 - alpha)
    f = f.copy()
    f[..., 1] -= spill
    # Alone verde residuo sui bordi: il verde non supera mai il più alto fra rosso e blu.
    edge = alpha < 0.999
    f[..., 1] = np.where(edge, np.minimum(f[..., 1], np.maximum(r, b)), f[..., 1])
    return np.clip(f, 0, 1) * alpha[..., None], alpha


def light_alpha(frame: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    f = frame.astype(np.float32) / 255
    peak = f.max(axis=2)
    # Il nero della sorgente non è mai zero (rumore di compressione): si toglie la soglia.
    alpha = np.clip((peak - 0.03) / 0.97, 0, 1)
    scale = np.where(peak > 1e-4, alpha / np.maximum(peak, 1e-4), 0)
    return np.clip(f * scale[..., None], 0, 1), alpha


def build(name: str, source: Path) -> dict:
    spec = CLIPS[name]
    frames = read_frames(source)
    out = OUT_DIR / f'tx-{name}.mp4'
    enc = subprocess.Popen(
        ['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H * 2}', '-r', str(FPS),
         '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p',
         '-movflags', '+faststart', '-tune', 'animation', str(out)],
        stdin=subprocess.PIPE)
    solid_from, solid_to = spec['solid']
    for index in range(spec['first'], spec['last'] + 1):
        color, alpha = (key_green if spec['mode'] == 'key' else light_alpha)(frames[index])
        if solid_from <= index <= solid_to:
            if spec['mode'] == 'light':
                color = np.clip(color + (1 - alpha[..., None]), 0, 1)  # bianco dove la luce non arriva
            alpha = np.ones_like(alpha)
        stacked = np.concatenate([color, np.repeat(alpha[..., None], 3, axis=2)], axis=0)
        enc.stdin.write((stacked * 255 + 0.5).astype(np.uint8).tobytes())
    enc.stdin.close()
    if enc.wait():
        raise SystemExit(f'ffmpeg non ha codificato {name}')
    count = spec['last'] - spec['first'] + 1
    return {
        'src': f'ui/transitions/{out.name}',
        'width': W, 'height': H, 'fps': FPS,
        'durationS': round(count / FPS, 4),
        # Istante (nel tempo della clip) in cui lo schermo è coperto: lì cambia la scena.
        'coverAtS': round((spec['cover'] - spec['first']) / FPS, 4),
        'label': spec['label'],
        'bytes': out.stat().st_size,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    for name in CLIPS:
        parser.add_argument(f'--{name}', type=Path, required=True, help=f'clip tx_{name} consegnata da Flow')
    args = parser.parse_args()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    data = {name: build(name, getattr(args, name)) for name in CLIPS}
    DATA.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    for name, entry in data.items():
        print(f"{name}: {entry['durationS']} s, copertura a {entry['coverAtS']} s, {entry['bytes'] // 1024} KB")


if __name__ == '__main__':
    main()
