#!/usr/bin/env python3
"""Prepara le clip di transizione generate con Flow (lotto 5) per il gioco.

Ogni clip diventa un MP4 H.264 con l'alfa «impilato»: in alto il colore premoltiplicato,
in basso l'opacità in scala di grigi. Il gioco le compone in WebGL (`TransitionClip.tsx`),
così funzionano allo stesso modo in Chrome, Safari e nell'app desktop.

    python3 scripts/transitions/build-clips.py --luce tx_luce.mp4 --titolo tx_titolo.mp4 \
        --fumo luma-matte-anime-smoke-transition-variation-filmbro.mov

Si possono rigenerare anche una alla volta. Le sorgenti restano fuori dal repository.

- `luce` (Flow): luce su fondo nero. L'opacità è il canale più luminoso; nei fotogrammi del bianco
  pieno è forzata a 1, così il cambio di scena avviene sotto una copertura totale.
- `titolo` (Flow): sabbia d'oro su verde #00FF00. Chiave fatta a mano (quella di ffmpeg rendeva
  trasparenti i neri e spostava l'oro verso l'arancio); nei fotogrammi di copertura i puntini di
  verde rimasti si chiudono con i colori vicini.
- `fumo` (Filmbro): ProRes 4444 con alfa già pronto.

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

# Fotogrammi della sorgente misurati il 27 novembre 2026 (24 fps Flow, 25 fps Filmbro).
CLIPS = {
    'luce': {
        'mode': 'light', 'first': 22, 'last': 78,
        # Centro dei cinque fotogrammi di bianco pieno (42–46).
        'cover': 44,
        'solid': (42, 46),
        'label': 'Esplosione di luce dorata che si apre sulla scena nuova (fine battaglia)',
    },
    'titolo': {
        'mode': 'key', 'first': 24, 'last': 92,
        # Copertura totale solo a 2,08–2,12 s: lì si chiudono i pochi puntini verdi rimasti.
        'cover': 51,
        'solid': (50, 51),
        'label': 'Vortice di sabbia e polvere d\'oro (titolo → gioco)',
    },
    'fumo': {
        'mode': 'alpha', 'first': 0, 'last': 36, 'fps': 25,
        'cover': 17,
        'solid': (17, 18),
        'label': 'Fumo anime (Filmbro, luma matte con alfa) per il viaggio mappa ↔ luoghi',
    },
}


def read_frames(path: Path, channels: int = 3) -> np.ndarray:
    raw = subprocess.run(
        ['ffmpeg', '-v', 'error', '-i', str(path), '-an', '-vf', f'scale={W}:{H}:flags=lanczos',
         '-f', 'rawvideo', '-pix_fmt', 'rgb24' if channels == 3 else 'rgba', '-'],
        capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, H, W, channels)


def with_alpha(frame: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    f = frame.astype(np.float32) / 255
    return f[..., :3] * f[..., 3:4], f[..., 3]


def key_green(frame: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    f = frame.astype(np.float32) / 255
    r, g, b = f[..., 0], f[..., 1], f[..., 2]
    greenness = g - np.maximum(r, b)
    alpha = 1 - np.clip((greenness - 0.12) / 0.25, 0, 1)
    spill = np.clip(greenness, 0, None) * (1 - alpha)
    f = f.copy()
    f[..., 1] -= spill
    # Alone verde residuo sui bordi: il verde non supera mai il più alto fra rosso e blu.
    # Alone verde: nessun pixel ha più verde del più alto fra rosso e blu (le clip su verde non
    # contengono verde), così il bagliore delle scintille non tira al verde.
    f[..., 1] = np.minimum(f[..., 1], np.maximum(f[..., 0], f[..., 2]))
    return np.clip(f, 0, 1) * alpha[..., None], alpha


def light_alpha(frame: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    f = frame.astype(np.float32) / 255
    peak = f.max(axis=2)
    # Il nero della sorgente non è mai zero (rumore di compressione): si toglie la soglia.
    alpha = np.clip((peak - 0.03) / 0.97, 0, 1)
    scale = np.where(peak > 1e-4, alpha / np.maximum(peak, 1e-4), 0)
    return np.clip(f * scale[..., None], 0, 1), alpha


def fill_holes(color: np.ndarray, alpha: np.ndarray) -> np.ndarray:
    """Nei fotogrammi di copertura chiude i buchi rimasti (puntini di sfondo) con i colori vicini."""
    import cv2
    holes = (alpha < 0.98).astype(np.uint8)
    if not holes.any():
        return color
    straight = np.where(alpha[..., None] > 1e-3, color / np.maximum(alpha[..., None], 1e-3), 0)
    image = (np.clip(straight, 0, 1) * 255).astype(np.uint8)
    healed = cv2.inpaint(image, cv2.dilate(holes, np.ones((3, 3), np.uint8)), 5, cv2.INPAINT_TELEA)
    return healed.astype(np.float32) / 255


def build(name: str, source: Path) -> dict:
    spec = CLIPS[name]
    frames = read_frames(source, 4 if spec['mode'] == 'alpha' else 3)
    process = {'key': key_green, 'light': light_alpha, 'alpha': with_alpha}[spec['mode']]
    out = OUT_DIR / f'tx-{name}.mp4'
    fps = spec.get('fps', FPS)
    enc = subprocess.Popen(
        ['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H * 2}', '-r', str(fps),
         '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p',
         '-movflags', '+faststart', '-tune', 'animation', str(out)],
        stdin=subprocess.PIPE)
    solid_from, solid_to = spec['solid']
    for index in range(spec['first'], spec['last'] + 1):
        color, alpha = process(frames[index])
        if solid_from <= index <= solid_to:
            if spec['mode'] == 'light':
                color = np.clip(color + (1 - alpha[..., None]), 0, 1)  # bianco dove la luce non arriva
            else:
                color = fill_holes(color, alpha)
            alpha = np.ones_like(alpha)
        stacked = np.concatenate([color, np.repeat(alpha[..., None], 3, axis=2)], axis=0)
        enc.stdin.write((stacked * 255 + 0.5).astype(np.uint8).tobytes())
    enc.stdin.close()
    if enc.wait():
        raise SystemExit(f'ffmpeg non ha codificato {name}')
    count = spec['last'] - spec['first'] + 1
    return {
        'src': f'ui/transitions/{out.name}',
        'width': W, 'height': H, 'fps': fps,
        'durationS': round(count / fps, 4),
        # Istante (nel tempo della clip) in cui lo schermo è coperto: lì cambia la scena.
        'coverAtS': round((spec['cover'] - spec['first']) / fps, 4),
        'label': spec['label'],
        'bytes': out.stat().st_size,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    for name in CLIPS:
        parser.add_argument(f'--{name}', type=Path, help=f'sorgente della clip {name}')
    args = parser.parse_args()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    data = json.loads(DATA.read_text(encoding='utf-8')) if DATA.exists() else {}
    data = {name: entry for name, entry in data.items() if name in CLIPS}
    for name in CLIPS:
        if getattr(args, name):
            data[name] = build(name, getattr(args, name))
    DATA.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    for name, entry in data.items():
        print(f"{name}: {entry['durationS']} s, copertura a {entry['coverAtS']} s, {entry['bytes'] // 1024} KB")


if __name__ == '__main__':
    main()
