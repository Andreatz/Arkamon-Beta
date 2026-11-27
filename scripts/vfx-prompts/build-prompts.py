#!/usr/bin/env python3
"""Prompt VFX per tutte le mosse: pose chiave con ImageGen (intermedi calcolati dal gioco) e clip/GIF con Gemini.

    python3 scripts/vfx-prompts/build-prompts.py docs/vfx-prompt-mosse

Scrive in OUT_DIR:
- `arkamon-prompt-vfx-mosse.md`: istruzioni e blocchi comuni;
- `arkamon-prompt-vfx-<tipo>.md`: un blocco per mossa, raggruppate per tipo della mossa;
- `prompt-vfx-mosse.csv`: i prompt completi (blocco comune + mossa) per i due strumenti.
"""
from __future__ import annotations

import csv
import json
import re
import sys
import unicodedata
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from concepts_a import CONCEPTS_A  # noqa: E402
from concepts_b import CONCEPTS_B  # noqa: E402
from concepts_c import CONCEPTS_C  # noqa: E402
from species_extra import SPECIES_EXTRA  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
TYPES = ['Normale', 'Fuoco', 'Acqua', 'Erba', 'Elettro', 'Terra', 'Psico', 'Oscurità']
TYPE_EN = {'Normale': 'Normal', 'Fuoco': 'Fire', 'Acqua': 'Water', 'Erba': 'Grass', 'Elettro': 'Electric',
           'Terra': 'Ground', 'Psico': 'Psychic', 'Oscurità': 'Dark'}
STATUS_EN = {
    'metti-paralisi': ('target', 'status move that PARALYSES the target: it must read as the target being locked or frozen in place'),
    'metti-sonno': ('target', 'status move that puts the target to SLEEP: soft, slow, drowsy'),
    'metti-confusione': ('target', 'status move that CONFUSES the target: dizzy, swirling, disorienting'),
    'metti-veleno': ('target', 'status move that POISONS the target: toxic drops, bubbles, sickly colours'),
    'ripristina-hp': ('user', 'HEALING move on the user: restores health, warm and uplifting, rising light'),
    'cura-veleno-hp': ('user', 'HEALING move on the user that also washes away poison'),
    'cura-paralisi': ('user', 'CLEANSING move on the user: removes paralysis, a release of tension'),
    'danno-fisso': ('target', 'fixed-damage hit on the target: one sharp, precise strike'),
    'immunita': ('user', 'PROTECTION move on the user: a barrier that blocks status effects for several turns'),
}
EFFECT_EN = {
    'SUPREMA': 'SUPREME move: the most spectacular attack of this creature, bigger and longer (about 2 s), overwhelming',
    'CURA_PCT': 'HEALING move on the user: restores health',
    'VELENO': 'attack that also POISONS the target',
    'CONFUSIONE': 'attack that also CONFUSES the target',
    'SONNO': 'attack that also puts the target to SLEEP',
}
TIER_EN = {'light': 'light attack', 'medium': 'medium attack', 'heavy': 'heavy attack'}

COMMON_IMAGEGEN = """Create the KEY POSES of a 2D special-attack effect for a fantasy creature-battle video game.
The game will generate the in-between frames from your key poses, so think like an animation key artist.

STYLE: hand-drawn Japanese anime effects animation and Korean MMO skill effects: bold readable silhouettes,
crisp clean edges, flat cel-shaded colour with one or two shadow tones, bright highlight shapes, thin glowing
rim lines, layered secondary elements (sparks, debris, smoke puffs, particles). Rich in detail but readable.
No 3D render, no photorealism, no motion blur, no text, no numbers, no ground or scenery.

SHEET: one square image, a regular 3 x 3 grid of 9 equal square cells, no borders or gaps drawn between
cells. The cells are consecutive key poses in reading order (left to right, top to bottom):
1 anticipation begins, 2-3 build-up, 4 impact (largest, brightest), 5-6 follow-through, 7-8 dissipation,
9 last faint particles.
- Same scale and same centre point in every cell; nothing crosses the edge of its cell.
- The effect fills most of the cell at the impact pose.
- Continuity: the SAME elements move, grow and fade from one pose to the next; do not make new elements
  pop up in unrelated places, so that in-betweens can be drawn smoothly.
- Background: transparent (alpha). If transparency is not possible, use the flat colour given in the
  BACKGROUND line of the move, filling everything outside the effect.
- The creature named below is only a reference for colours and motifs: do NOT draw the creature, nor any
  face, character or text. If I attach images, use them only as colour and style references.

I will now send one move per message. For each message, generate one sheet."""

COMMON_GEMINI = """Make a short animated clip of a 2D special-attack effect for a fantasy creature-battle video game.

STYLE: hand-drawn Japanese anime effects animation and Korean MMO skill effects: bold readable silhouettes,
crisp clean edges, flat cel-shaded colour with one or two shadow tones, bright highlight shapes, thin glowing
rim lines, layered secondary elements (sparks, debris, smoke puffs, particles) each moving on its own arc.
Rich in detail but readable. Snappy anticipation, a strong impact frame, then follow-through and a clean
dissipation. No 3D render, no photorealism, no motion blur, no film grain.

CAMERA AND FRAME
- 16:9, highest resolution available, locked-off camera: no camera movement, zoom, pan or shake.
- The effect is centred and LARGE: at its biggest it fills about three quarters of the frame height.
  Nothing touches or leaves the frame edges.
- The background is the single flat colour of the BACKGROUND line, evenly lit, with no gradient, shadow,
  vignette or texture. The effect never uses that colour.
- Nothing else in the frame: no ground plane, no scenery, no characters, no creatures, no faces, no text.
  The creature named below is only a reference for colours and motifs: do NOT show it.

TIMING
- Half a second of empty background, then about 1.5 to 2 seconds of effect (2.5 for a SUPREME move),
  then it fades away COMPLETELY and the background stays empty until the end.

I will now send one move per message. For each message, make one clip."""

BACKGROUNDS = {
    'verde': 'BACKGROUND: solid pure chroma-key green (#00FF00).',
    'magenta': 'BACKGROUND: solid pure chroma-key magenta (#FF00FF).',
    'nero': 'BACKGROUND: solid pure black (#000000). Only light on black: no dark or solid shapes.',
}


def slug(text: str) -> str:
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', '_', text.lower()).strip('_')


def load() -> tuple[dict, dict, dict, dict]:
    species = {s['id']: s for s in json.load(open(ROOT / 'src/data/pokemon.json', encoding='utf-8'))}
    moves = {m['id']: m for m in json.load(open(ROOT / 'src/data/mosse.json', encoding='utf-8'))}
    appearance = {}
    for i in (1, 2, 3):
        for entry in json.load(open(ROOT / f'docs/vfx-generated-moves/prompts/appearance-{i}.json', encoding='utf-8')):
            appearance[entry['id']] = entry
    tiers = {(e['gameMoveId'] or e['sourceMoveId']): e['tier']
             for e in json.load(open(ROOT / 'src/data/move-vfx-assignments.json', encoding='utf-8'))['moves']}
    return species, moves, appearance, tiers


def creature_line(sid: int, species: dict, appearance: dict) -> str:
    s = species[sid]
    if sid in appearance:
        a = appearance[sid]
        return (f"{s['nome']} — {a['appearance']} Palette: {', '.join(a['palette'])}. Motifs: {a['signature']}")
    look, palette, motifs = SPECIES_EXTRA[s['nome']]
    return f"{s['nome']} — {look}. Palette: {palette}. Motifs: {motifs}."


def stage_tier(sid: int, species: dict) -> str:
    """Leggera / media / forte secondo lo stadio dell'evoluzione (mosse senza fascia del foglio di ottobre)."""
    s = species[sid]
    previous = [x for x in species.values() if x.get('evoluzioneId') == sid]
    if not s.get('evoluzioneId'):
        return 'heavy' if previous else 'medium'
    return 'medium' if previous else 'light'


def background_for(move: dict, concept: str, owner: str) -> str:
    text = concept.lower()
    greenish = move['tipo'] == 'Erba' or any(w in text for w in ('green', 'leaf', 'leaves', 'vine', 'grass', 'moss', 'kelp', 'sprout'))
    greenish = greenish or owner in ('Galvastein', 'Kelpsteed', 'Goblivius', 'Phyllodillo', 'Bogfly', 'Masquifowl', 'Leafrex', 'Silvard')
    if greenish:
        return 'magenta'
    dark = any(w in text for w in ('black', 'dark', 'shadow', 'smoke', 'rock', 'stone', 'soot', 'ash', 'mud', 'tar', 'iron'))
    light_only = move['tipo'] == 'Elettro' or '(luce)' in owner
    return 'nero' if light_only and not dark else 'verde'


def main() -> None:
    out = Path(sys.argv[1] if len(sys.argv) > 1 else '.')
    out.mkdir(parents=True, exist_ok=True)
    species, moves, appearance, tiers = load()
    concepts = {**CONCEPTS_A, **CONCEPTS_B, **CONCEPTS_C}
    owners: dict[int, list[int]] = defaultdict(list)
    for s in species.values():
        for k in s['mosse']:
            if k:
                owners[k].append(s['id'])
    missing = sorted(set(owners) - set(concepts))
    extra = sorted(set(concepts) - set(owners))
    if missing or extra:
        raise SystemExit(f'Concept mancanti: {missing}\nConcept senza mossa: {extra}')

    entries = []
    for move_id in sorted(owners):
        move = moves[move_id]
        sid = max(owners[move_id])  # lo stadio più evoluto che la usa
        owner = species[sid]['nome']
        rule = move.get('regolaStato')
        if rule:
            anchor, role = STATUS_EN[rule]
        elif move['effetto'] in EFFECT_EN:
            anchor = 'user' if move['effetto'] == 'CURA_PCT' else 'target'
            role = EFFECT_EN[move['effetto']]
        else:
            anchor = 'target'
            role = TIER_EN[tiers.get(move_id) if tiers.get(move_id) in TIER_EN else stage_tier(sid, species)]
        bg = background_for(move, concepts[move_id], owner)
        where = 'centred on the user (the creature using the move)' if anchor == 'user' else 'hitting the target in the centre'
        block = '\n'.join([
            BACKGROUNDS[bg],
            f"MOVE: {move['nome']} — {TYPE_EN[move['tipo']]}-type {role}, {where}.",
            f"CREATURE: {creature_line(sid, species, appearance)}",
            f"EFFECT: {concepts[move_id]}",
        ])
        entries.append({
            'id': move_id, 'name': move['nome'], 'type': move['tipo'], 'owner': owner, 'ownerId': sid,
            'users': ', '.join(f"{species[i]['nome']} #{i}" for i in owners[move_id]), 'bg': bg, 'block': block,
            'file': f"{move_id:03d}_{slug(move['nome'])}",
        })

    # Documento principale.
    counts = {t: sum(e['type'] == t for e in entries) for t in TYPES}
    bgcount = {b: sum(e['bg'] == b for e in entries) for b in BACKGROUNDS}
    main_doc = f"""# Arkamon · Prompt VFX di tutte le mosse

27 novembre 2026. Prompt per tutte le **{len(entries)} mosse** degli Arkamon, con i due metodi scelti:

1. **ImageGen (ChatGPT): 9 pose chiave** in un foglio 3×3. I fotogrammi intermedi li calcolo io, così l'effetto gira a 24 fps.
2. **Gemini: una clip** (MP4 se puoi, altrimenti GIF). La scontorno e la trasformo nello sprite del gioco.

I prompt sono in inglese perché i modelli rispondono meglio. Le istruzioni per te sono in italiano. Le mosse sono divise per tipo in otto file, nel repository in `docs/vfx-prompt-mosse/` e allegati in chat:

| Tipo | Mosse | Documento |
|---|---:|---|
""" + '\n'.join(f"| {t} | {counts[t]} | `arkamon-prompt-vfx-{slug(t)}.md` |" for t in TYPES) + f"""

## Come procedere

1. **Una conversazione per serie.** Apri una conversazione nuova con ChatGPT o con Gemini e incolla **una volta** il blocco comune dello strumento. Poi manda **una mossa per messaggio**, copiando il suo blocco. Tieni nella stessa conversazione le mosse di uno stesso Arkamon o di uno stesso tipo: lo stile resta uniforme. Dopo 10–15 mosse apri una conversazione nuova e incolla di nuovo il blocco comune.
2. **Allegati facoltativi.** Puoi allegare lo sprite dell'Arkamon (`public/sprites/front_sprites/<numero>.png`) e uno degli esempi di stile (foglio MapleStory o GIF anime). Servono solo per colori e stile.
3. **Sfondo.** Ogni blocco comincia con la riga BACKGROUND:
   - **verde** per la maggior parte degli effetti;
   - **magenta** per quelli con foglie, erba o verde, che su fondo verde sparirebbero;
   - **nero** solo per gli effetti fatti di sola luce.

   ImageGen deve comunque provare a dare lo sfondo trasparente: il colore serve solo se la trasparenza non arriva. Conteggi: {bgcount['verde']} verde, {bgcount['magenta']} magenta, {bgcount['nero']} nero.
4. **Rigenera se:**
   - la griglia non è regolare o le pose cambiano scala o centro (ImageGen);
   - la camera si muove o l'effetto è piccolo nel quadro (Gemini);
   - lo sfondo non è uniforme;
   - compaiono la creatura, un volto, scritte o un terreno.

   Frase utile per ImageGen: *«Rifallo con 9 celle identiche, stessa scala e stesso centro, nessun elemento che esce dalla cella»*.
5. **Consegna.**
   - ImageGen: `asset-inbox/vfx/imagegen/<id>_<mossa>.png`
   - Gemini: `asset-inbox/vfx/gemini/<id>_<mossa>.mp4` (oppure `.gif`)

   Il nome del file è indicato sopra ogni blocco, per esempio `004_carica_ossidrica`. Se fai più versioni, aggiungi `_a`, `_b`. Puoi anche mandarmele qui.
6. **Priorità.** Gli starter (Vyrath, Darklaw, Felyss) e gli Arkamon che si incontrano per primi. Le 8 mosse pilota sono già nel gioco: rifalle solo se vuoi provare Gemini anche su di loro.

**Cosa faccio io con le consegne:**
- tolgo lo sfondo e allineo le pose;
- calcolo gli intermedi per ImageGen;
- ritaglio un quadrato stabile per Gemini;
- imposto l'impatto (fermo immagine e scossa), la scala e la posizione;
- scelgo la versione migliore per ogni mossa e la provo nel VFX Lab.

In tutto ci sono 515 mosse: conviene procedere a lotti, per esempio un tipo alla volta.

## Blocco comune · ImageGen

Da incollare una volta all'inizio della conversazione con ChatGPT.

```
{COMMON_IMAGEGEN}
```

## Blocco comune · Gemini

Da incollare una volta all'inizio della conversazione con Gemini.

```
{COMMON_GEMINI}
```

Il file `prompt-vfx-mosse.csv` contiene gli stessi prompt già completi (blocco comune più mossa), una riga per mossa e per strumento: è utile se vuoi automatizzare.
"""
    (out / 'arkamon-prompt-vfx-mosse.md').write_text(main_doc, encoding='utf-8')

    bg_it = {'verde': 'verde', 'magenta': 'magenta', 'nero': 'nero'}
    for t in TYPES:
        group = [e for e in entries if e['type'] == t]
        lines = [f"# Arkamon · Prompt VFX · mosse di tipo {t} ({len(group)})", '',
                 "Blocchi comuni e istruzioni: `arkamon-prompt-vfx-mosse.md` (anche nel progetto Arkamon). "
                 "Per ogni mossa: nome del file, Arkamon che la usano, sfondo. Poi il blocco da mandare, uguale per ImageGen e per Gemini.", '']
        for e in group:
            lines += [f"### {e['id']:03d} · {e['name']}", '',
                      f"`{e['file']}` · {e['users']} · sfondo {bg_it[e['bg']]}", '', '```', e['block'], '```', '']
        (out / f"arkamon-prompt-vfx-{slug(t)}.md").write_text('\n'.join(lines), encoding='utf-8')

    with open(out / 'prompt-vfx-mosse.csv', 'w', newline='', encoding='utf-8') as handle:
        writer = csv.writer(handle)
        writer.writerow(['id', 'mossa', 'tipo', 'arkamon', 'file', 'sfondo', 'prompt_imagegen', 'prompt_gemini'])
        for e in entries:
            writer.writerow([e['id'], e['name'], e['type'], e['users'], e['file'], e['bg'],
                             COMMON_IMAGEGEN + '\n\n' + e['block'], COMMON_GEMINI + '\n\n' + e['block']])
    print(f"{len(entries)} mosse →", out)
    for t in TYPES:
        print(f"  {t}: {counts[t]}")
    print('  sfondi:', bgcount)


if __name__ == '__main__':
    main()
