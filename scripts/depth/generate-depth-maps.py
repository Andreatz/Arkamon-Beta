#!/usr/bin/env python3
"""
Genera le mappe di profondità degli sfondi di Arkamon (Fase 6, sfondi 2.5D).

Modello: Depth Anything V2 Small in ONNX (licenza Apache-2.0), per esempio
  https://github.com/fabio-sim/Depth-Anything-ONNX/releases/download/v2.0.0/depth_anything_v2_vits.onnx

Uso:
  pip install onnxruntime pillow numpy
  python3 scripts/depth/generate-depth-maps.py --model depth_anything_v2_vits.onnx

Per ogni immagine di --input (default public/backgrounds) scrive in --output
(default public/backgrounds/depth) una WebP in scala di grigi larga 512 px:
bianco = vicino, nero = lontano. Aggiorna poi src/data/depthMaps.json con
l'elenco degli sfondi che hanno una mappa: il gioco usa solo quelli.

Una mappa fatta a mano (o con una demo online di Depth Anything / MiDaS) va
bene lo stesso: stessa proporzione dell'immagine, bianco vicino, nome
<sfondo>.webp in public/backgrounds/depth, poi aggiungi il nome al JSON.
"""
import argparse
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)
EXTENSIONS = {'.png', '.jpg', '.jpeg', '.webp'}


def predict(session, image: Image.Image, size: int) -> np.ndarray:
    rgb = image.convert('RGB').resize((size, size), Image.BICUBIC)
    tensor = (np.asarray(rgb, dtype=np.float32) / 255.0 - MEAN) / STD
    tensor = tensor.transpose(2, 0, 1)[None].astype(np.float32)
    output = session.run(None, {session.get_inputs()[0].name: tensor})[0]
    return np.squeeze(output).astype(np.float32)


def normalise(depth: np.ndarray) -> np.ndarray:
    # Profondità relativa inversa: valori alti = vicino. Si tagliano gli estremi.
    low, high = np.percentile(depth, [2, 98])
    scaled = np.clip((depth - low) / max(high - low, 1e-6), 0, 1)
    return (scaled * 255).astype(np.uint8)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--model', required=True, type=Path)
    parser.add_argument('--input', default=Path('public/backgrounds'), type=Path)
    parser.add_argument('--output', default=Path('public/backgrounds/depth'), type=Path)
    parser.add_argument('--manifest', default=Path('src/data/depthMaps.json'), type=Path)
    parser.add_argument('--width', default=512, type=int)
    parser.add_argument('--only', nargs='*', help='Nomi dei file da elaborare (default: tutti)')
    args = parser.parse_args()

    import onnxruntime as ort
    session = ort.InferenceSession(str(args.model), providers=['CPUExecutionProvider'])
    size = session.get_inputs()[0].shape[-1]
    size = size if isinstance(size, int) else 518

    args.output.mkdir(parents=True, exist_ok=True)
    sources = sorted(path for path in args.input.iterdir() if path.suffix.lower() in EXTENSIONS)
    if args.only:
        sources = [path for path in sources if path.name in set(args.only)]
    for source in sources:
        with Image.open(source) as image:
            width, height = image.size
            depth = normalise(predict(session, image, size))
        target_height = max(1, round(args.width * height / width))
        result = Image.fromarray(depth, 'L').resize((args.width, target_height), Image.BICUBIC)
        result = result.filter(ImageFilter.GaussianBlur(1.2))
        target = args.output / f'{source.stem}.webp'
        result.save(target, 'WEBP', quality=82, method=6)
        print(f'{source.name} -> {target} ({target.stat().st_size // 1024} KB)')

    names = sorted(path.stem for path in args.output.glob('*.webp'))
    args.manifest.write_text(json.dumps({'version': 1, 'maps': names}, indent=2) + '\n', encoding='utf-8')
    print(f'{len(names)} mappe in {args.manifest}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
