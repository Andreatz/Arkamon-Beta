#!/usr/bin/env python3
"""
Importa data-source/Database.xlsx nei JSON di gioco.

    python3 scripts/data/import-database.py          # scrive i JSON
    python3 scripts/data/import-database.py --check  # verifica che siano aggiornati

Richiede openpyxl (pip install openpyxl). Il foglio è la fonte: le poche
correzioni conservate dal gioco sono elencate in CORREZIONI e nel report.

Scrive:
  src/data/pokemon.json      206 specie
  src/data/mosse.json        tutte le mosse (danno e Status)
  src/data/incontri.json     cespugli di percorsi e città
  src/data/allenatori.json   allenatori, capipalestra, Superquattro, rivale
  data-source/import-report.json  riepilogo, correzioni e avvisi
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'data-source' / 'Database.xlsx'
DATA = ROOT / 'src' / 'data'
LEVELS = range(5, 101)
TYPES = {'Normale', 'Elettro', 'Fuoco', 'Terra', 'Acqua', 'Erba', 'Oscurità', 'Psico'}
CATEGORIES = {'Lenta', 'Media', 'Veloce', 'Leggendaria'}

# Correzioni conservate: errori evidenti del foglio, già risolti nel gioco.
CORREZIONI = {
    # Grimbolt 24 evolve nel proprio secondo stadio (25), non in Ampereel (26).
    'evoluzione': {24: 25},
    # Le prime mosse dei leggendari hanno ID scambiati fra foglio e gioco (107↔109, 108↔110):
    # il gioco tiene i suoi ID (effetti Suprema, VFX e suoni sono legati a quelli), quindi
    # la mossa di gioco 107 è la riga 109 del foglio e le specie vengono rimappate allo stesso modo.
    'mossa_per_proprietario': {107: 109, 108: 110, 109: 107, 110: 108},
    # Axolux (130) non ha tipo nel foglio: Acqua, come le sue mosse di danno.
    'tipo': {130: 'Acqua'},
}

# Testo della colonna Status → regola in src/data/statusMoveRules.json.
STATUS_RULES = [
    (r'^(metti|mette)?\s*paralisi$', 'metti-paralisi'),
    (r'^(metti\s*)?sonno$', 'metti-sonno'),
    (r'^(metti\s*)?confusione$', 'metti-confusione'),
    (r'^metti veleno$', 'metti-veleno'),
    (r'^ripristina tanti hp$', 'ripristina-hp'),
    (r'^cura veleno e hp$', 'cura-veleno-hp'),
    (r'^cura paralisi$', 'cura-paralisi'),
    (r'^danno fisso$', 'danno-fisso'),
    (r'^immunità da status$', 'immunita'),
]


AXOLUX_ID = 130


def place(value: str | None) -> str | None:
    if not value:
        return None
    text = str(value).strip()
    if text == 'Route 15':
        return 'Percorso_15'
    if text == 'Reggio Calabria':
        return 'ReggioCalabria'
    return re.sub(r'^Percorso (\d+)$', r'Percorso_\1', text)


def number(value) -> int | None:
    if value is None or value == '' or isinstance(value, str):
        return None
    return int(round(float(value)))


def rows(workbook, name: str) -> tuple[list[str], list[dict]]:
    sheet = workbook[name]
    raw = [r for r in sheet.iter_rows(values_only=True) if r and any(c is not None for c in r)]
    header = [str(h).strip() if h is not None else '' for h in raw[0]]
    return header, [{header[i]: r[i] for i in range(min(len(header), len(r)))} for r in raw[1:]]


def fill_table(defined: dict[int, int], previous: dict[str, int] | None) -> dict[str, int]:
    """Livelli fuori dal campo dello stadio: valore del gioco se c'era, altrimenti il più vicino."""
    table: dict[str, int] = {}
    known = sorted(defined)
    for level in LEVELS:
        if level in defined:
            table[str(level)] = defined[level]
        elif previous is not None and str(level) in previous:
            table[str(level)] = previous[str(level)]
        elif known:
            nearest = min(known, key=lambda k: (abs(k - level), -k))
            table[str(level)] = defined[nearest]
        else:
            table[str(level)] = 0
    return table


def minimum_level(texts: list[str]) -> int | None:
    for text in texts:
        match = re.search(r'(?:lvl\s*(\d+)|(\d+)\s*°\s*livello)', text, re.I)
        if match:
            return int(match.group(1) or match.group(2))
    return None


def main() -> int:
    check = '--check' in sys.argv
    workbook = openpyxl.load_workbook(SOURCE, read_only=True, data_only=True)
    warnings: list[str] = []
    game_moves = {m['id']: m for m in json.loads((DATA / 'mosse.json').read_text())}
    game_species = {p['id']: p for p in json.loads((DATA / 'pokemon.json').read_text())}
    vfx = {m['sourceMoveId']: m for m in json.loads((ROOT / 'docs/vfx-generated-moves/prompts/moves-metadata.json').read_text())}

    # ---------------- Specie ----------------
    _, species_rows = rows(workbook, 'Pokemon_Base')
    species: list[dict] = []
    derived_rates: list[int] = []
    for r in species_rows:
        sid = number(r.get('ID'))
        if sid is None:
            continue
        previous = game_species.get(sid, {})
        tipo = CORREZIONI['tipo'].get(sid) or r.get('Tipo') or previous.get('tipo')
        categoria = r.get('Categoria') or previous.get('categoria')
        if tipo not in TYPES:
            warnings.append(f'Specie {sid}: tipo non valido ({tipo}).')
        if categoria not in CATEGORIES:
            warnings.append(f'Specie {sid}: categoria mancante, uso Media.')
            categoria = 'Media'
        evo = CORREZIONI['evoluzione'].get(sid, number(r.get('Evoluzione_ID')) or 0)
        species.append({
            'id': sid,
            'nome': str(r.get('Nome')).strip(),
            'categoria': categoria,
            'tipo': tipo,
            'hpBase': number(r.get('HP_Base')) or 12,
            'mosse': [CORREZIONI['mossa_per_proprietario'].get(number(r.get(f'Mossa{k}_ID')) or 0, number(r.get(f'Mossa{k}_ID')) or 0) for k in (1, 2, 3)],
            'livelloEvoluzione': number(r.get('Livello_Evoluzione')) or 0,
            'evoluzioneId': evo,
            'tassoCattura': number(r.get('Tasso_Cattura')) or previous.get('tassoCattura') or 3,
        })
    species_by_id = {s['id']: s for s in species}
    # Tasso di cattura assente nel foglio (specie 111–206): stessa progressione delle
    # specie storiche. Leggendarie 1; varianti "(luce)" 2; stadi 5/4/3; specie singole 3.
    previous_stage = {s['evoluzioneId']: s['id'] for s in species if s['evoluzioneId']}
    rates_from_sheet = {number(r.get('ID')): number(r.get('Tasso_Cattura')) for r in species_rows}
    for s in species:
        if rates_from_sheet.get(s['id']):
            continue
        stage, cursor = 1, s['id']
        while cursor in previous_stage:
            stage, cursor = stage + 1, previous_stage[cursor]
        single = stage == 1 and not s['evoluzioneId']
        if s['categoria'] == 'Leggendaria':
            s['tassoCattura'] = 1
        elif '(luce)' in s['nome']:
            s['tassoCattura'] = 2
        elif single:
            s['tassoCattura'] = 3
        else:
            s['tassoCattura'] = max(1, 6 - stage)
        derived_rates.append(s['id'])
    for s in species:
        if s['evoluzioneId'] and s['evoluzioneId'] not in species_by_id:
            warnings.append(f"Specie {s['id']}: evoluzione {s['evoluzioneId']} inesistente, rimossa.")
            s['evoluzioneId'] = 0
            s['livelloEvoluzione'] = 0

    # ---------------- Mosse ----------------
    _, move_rows = rows(workbook, 'Mosse')
    sheet_moves = {number(r.get('ID_Mossa')): r for r in move_rows if number(r.get('ID_Mossa')) is not None}
    owners_by_name = {s['nome']: s for s in reversed(species)}
    moves: list[dict] = []
    status_texts: dict[str, int] = {}
    for mid in sorted(sheet_moves):
        source_id = CORREZIONI['mossa_per_proprietario'].get(mid, mid)
        r = sheet_moves[source_id]
        name = str(r.get('Nome_Mossa')).strip()
        kind = str(r.get('Tipo') or '').strip()
        previous = game_moves.get(mid)
        if kind == 'Status':
            texts = [str(v).strip() for k, v in r.items() if k.startswith(('Dadi_lvl', 'Incremento_lvl')) and isinstance(v, str) and v.strip()]
            rule = None
            for text in texts:
                for pattern, key in STATUS_RULES:
                    if re.match(pattern, text.strip(), re.I):
                        rule = key
                        break
                if rule:
                    break
            if not rule:
                warnings.append(f'Mossa {mid} {name}: effetto Status non riconosciuto ({texts[:1]}).')
                rule = 'metti-paralisi'
            status_texts[rule] = status_texts.get(rule, 0) + 1
            owner = owners_by_name.get(str(r.get('Nome') or '').strip())
            element = (vfx.get(mid) or {}).get('element') or (owner or {}).get('tipo') or 'Normale'
            entry = {
                'id': mid, 'nome': name, 'tipo': element, 'effetto': None, 'valoreEffetto': None,
                'soloStato': True, 'regolaStato': rule,
                'dadiPerLivello': {'5': 0}, 'incrementoPerLivello': {'5': 0},
            }
            level = minimum_level(texts)
            if level:
                entry['livelloMinimo'] = level
            moves.append(entry)
            continue
        if kind not in TYPES:
            warnings.append(f'Mossa {mid} {name}: tipo non valido ({kind}).')
        dice = {lv: number(r.get(f'Dadi_lvl_{lv}')) for lv in LEVELS}
        bonus = {lv: number(r.get(f'Incremento_lvl_{lv}')) for lv in LEVELS}
        dice = {k: v for k, v in dice.items() if v is not None}
        bonus = {k: v for k, v in bonus.items() if v is not None}
        if not bonus and dice:
            bonus = {k: 0 for k in dice}
        effect = (previous or {}).get('effetto')
        value = (previous or {}).get('valoreEffetto')
        moves.append({
            'id': mid, 'nome': name, 'tipo': kind, 'effetto': effect, 'valoreEffetto': value,
            'dadiPerLivello': fill_table(dice, (previous or {}).get('dadiPerLivello')),
            'incrementoPerLivello': fill_table(bonus, (previous or {}).get('incrementoPerLivello')),
        })
    move_ids = {m['id'] for m in moves}
    for s in species:
        for slot, mid in enumerate(s['mosse']):
            if mid and mid not in move_ids:
                warnings.append(f"Specie {s['id']}: mossa {mid} inesistente, slot {slot + 1} svuotato.")
                s['mosse'][slot] = 0

    # ---------------- Incontri ----------------
    encounters: list[dict] = []
    # Il foglio ha due tabelle affiancate (percorsi e città) con le stesse intestazioni.
    sheet = workbook['Incontri_Selvatici']
    raw = [r for r in sheet.iter_rows(values_only=True) if r and any(c is not None for c in r)]
    for r in raw[1:]:
        for offset in (0, 8):
            cells = list(r[offset:offset + 6]) + [None] * 6
            luogo, bush, pid, prob, lmin, lmax = cells[:6]
            if not luogo or number(pid) is None:
                continue
            pid = number(pid)
            if pid not in species_by_id:
                warnings.append(f'Incontro {luogo} {bush}: specie {pid} inesistente.')
                continue
            # Axolux (130) non ha mosse per scelta: non combatte, si fonde con un compatibile (decisione del 18 novembre 2026).
            if not any(species_by_id[pid]['mosse']) and pid != AXOLUX_ID:
                warnings.append(f"Incontro {place(luogo)} {bush}: {species_by_id[pid]['nome']} ({pid}) non ha mosse nel foglio, escluso finché non le definisci.")
                continue
            lmin = number(lmin) or 5
            encounters.append({
                'luogo': place(luogo), 'cespuglio': str(bush).strip(), 'pokemonId': pid,
                'probabilita': str(prob).strip(), 'livelloMin': lmin, 'livelloMax': max(lmin, number(lmax) or lmin),
            })

    # ---------------- Allenatori ----------------
    _, trainer_rows = rows(workbook, 'Allenatori_NPC')
    trainers: list[dict] = []
    unnamed: dict[str, int] = {}
    game_rival = next((t for t in json.loads((DATA / 'allenatori.json').read_text()) if t['nome'] == 'Rivale'), None)
    rival_lines = [slot['pokemonId'] for slot in (game_rival or {}).get('squadra', [])][1:]
    for r in trainer_rows:
        tid = number(r.get('ID_Allenatore'))
        if tid is None:
            continue
        luogo = place(r.get('Luogo'))
        raw_name = str(r.get('Nome Allenatore') or '').strip()
        raw_kind = str(r.get('Tipo') or '').strip()
        rival = raw_name.startswith('Rivale') or '(rivale)' in raw_name.lower()
        if not raw_name:
            unnamed[luogo] = unnamed.get(luogo, 0) + 1
            label = luogo.replace('_', ' ').replace('ReggioCalabria', 'Reggio Calabria')
            raw_name = f'Allenatore di {label} {unnamed[luogo]}'
        if raw_name.startswith('Capopalestra'):
            kind = 'Capopalestra'
        elif raw_name.startswith('Superquattro'):
            kind = 'Superquattro'
        elif raw_kind == 'PVP':
            kind = 'PVP'
        else:
            kind = 'NPC'
        team = []
        for k in range(1, 7):
            level = number(r.get(f'Livello_Pokémon_{k}'))
            pid = number(r.get(f'ID_Pokémon_{k}'))
            if level is None:
                continue
            if pid is None and rival:
                # Il foglio lascia libere le specie del rivale: lo slot 1 è lo starter
                # del rivale (risolto in partita), gli altri riprendono la squadra storica.
                pid = 0 if k == 1 else (rival_lines[(k - 2) % len(rival_lines)] if rival_lines else 0)
            if pid is None:
                continue
            if pid and pid not in species_by_id:
                warnings.append(f'Allenatore {tid}: specie {pid} inesistente.')
                continue
            team.append({'pokemonId': pid, 'livello': level})
        entry = {'id': tid, 'nome': raw_name, 'luogo': luogo, 'tipo': kind, 'squadra': team}
        if rival:
            entry['rivale'] = True
        trainers.append(entry)

    outputs = {
        DATA / 'pokemon.json': species,
        DATA / 'mosse.json': moves,
        DATA / 'incontri.json': encounters,
        DATA / 'allenatori.json': trainers,
    }
    report = {
        'fonte': 'data-source/Database.xlsx',
        'specie': len(species), 'mosse': len(moves),
        'mosseStatus': sum(1 for m in moves if m.get('soloStato')),
        'regoleStatus': dict(sorted(status_texts.items())),
        'incontri': len(encounters), 'allenatori': len(trainers),
        'tassoCatturaDerivato': derived_rates,
        'correzioni': {k: {str(a): b for a, b in v.items()} for k, v in CORREZIONI.items()},
        'avvisi': warnings,
    }
    outputs[ROOT / 'data-source' / 'import-report.json'] = report
    stale = []
    for path, value in outputs.items():
        text = json.dumps(value, ensure_ascii=False, indent=2) + '\n'
        if check:
            if not path.exists() or path.read_text() != text:
                stale.append(str(path.relative_to(ROOT)))
        else:
            path.write_text(text)
    if stale:
        print('Dati non aggiornati: ' + ', '.join(stale))
        return 1
    print(json.dumps({k: (len(v) if k == 'tassoCatturaDerivato' else v) for k, v in report.items() if k != 'correzioni'}, ensure_ascii=False, indent=1))
    return 0


if __name__ == '__main__':
    sys.exit(main())
