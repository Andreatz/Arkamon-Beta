#!/usr/bin/env python3
"""Riconverte con la pulizia degli aloni le azioni di alcune specie, senza toccare le altre.

    python3 scripts/arkamon-fringe-reconvert.py 101:attack,ko,hit 102:ko [--jobs 2]

Per ogni specie esegue `build-arkamon-idle.py` sul video originale (animation-source/raw) con
`--screen-fringe-cleanup` (e, con `--dominance`, `--screen-dominance-cleanup`) e `--reuse-normalization` (stessa geometria, scala e tempi di prima), in una
cartella temporanea; poi copia solo gli atlas, i poster e i metadati delle azioni indicate e li unisce a
`animation-set.metadata.json`. Le pagine si rigenerano dopo con
`node scripts/build-arkamon-pages.mjs --species <id> --actions <azioni>`.

La pulizia vale solo per lo schermo verde e per creature senza verde proprio (lo dice l'opzione del
convertitore): le specie con schermo blu o magenta vanno escluse.
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import tempfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def reconvert(sid: int, actions: list[str], dominance: bool = False) -> str:
    front = ROOT / 'public/sprites/arkamon' / str(sid) / 'front'
    screens = {json.loads((front / f'{a}.metadata.json').read_text(encoding='utf-8'))['key'].get('screenColour', 'green') for a in actions}
    if screens != {'green'}:
        return f'{sid}: saltata (schermo {", ".join(sorted(screens))})'
    with tempfile.TemporaryDirectory(prefix=f'arkamon-{sid}-') as tmp:
        out = Path(tmp) / 'out'
        result = subprocess.run([sys.executable, str(ROOT / 'scripts/build-arkamon-idle.py'), '--species-id', str(sid),
                                 '--source-dir', str(ROOT / 'animation-source/raw' / str(sid) / 'front'),
                                 '--output', str(out), '--actions', *actions,
                                 '--reuse-normalization', str(front), '--screen-fringe-cleanup',
                                 *(['--screen-dominance-cleanup'] if dominance else [])],
                                capture_output=True, text=True, cwd=ROOT)
        if result.returncode:
            return f'{sid}: ERRORE\n{result.stderr[-2000:]}'
        set_path = front / 'animation-set.metadata.json'
        animation_set = json.loads(set_path.read_text(encoding='utf-8'))
        new_set = json.loads((out / 'animation-set.metadata.json').read_text(encoding='utf-8'))
        for action in actions:
            for name in (f'{action}.webp', f'{action}-poster.webp', f'{action}.metadata.json'):
                shutil.copy2(out / name, front / name)
            animation_set['actions'][action] = new_set['actions'][action]
        set_path.write_text(json.dumps(animation_set, indent=2) + '\n', encoding='utf-8')
    return f'{sid}: {", ".join(actions)} riconvertite'


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('targets', nargs='+', help='specie:azione,azione')
    parser.add_argument('--jobs', type=int, default=2)
    parser.add_argument('--dominance', action='store_true', help='aggiunge --screen-dominance-cleanup (foschia di schermo non uniforme)')
    args = parser.parse_args()
    work = []
    for target in args.targets:
        sid, actions = target.split(':')
        work.append((int(sid), actions.split(',')))
    with ThreadPoolExecutor(args.jobs) as pool:
        for line in pool.map(lambda job: reconvert(*job, dominance=args.dominance), work):
            print(line, flush=True)


if __name__ == '__main__':
    main()
