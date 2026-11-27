"""013 · Cratere (Clastoom, Terra).

Il suolo sotto il bersaglio si crepa in una ragnatela incandescente; una corona di lastre di
roccia antracite irte di punte, attraversate da crepe arancioni come il corpo di Clastoom, si
solleva di colpo; dal centro erutta il magma con lapilli e detriti su archi alti, mentre nuvole
di polvere rotolano fuori. Le rocce crollano e la polvere si posa.
"""
from __future__ import annotations

import math

import numpy as np

from fxlib import (C, Frame, back_out, blade, bump, burst_particles, disc, ease_in, ease_out, glow, hexc, jagged, layer,
                   lightning, mix, paint, path_poly, puff, radial, render, seg)

FRAMES, FPS, IMPACT = 26, 20, 7
GROUND = C + 100
SQUASH = 0.33
ANTH, ROCK, LIGHT, ORANGE, AMBER, YELLOW, DUST, DUSTD = '#2c2a2e', '#55525a', '#7d7983', '#ff7a1a', '#ffad33', '#ffe27a', '#8a7058', '#5a4636'
rng = np.random.default_rng(13)
PLATES = sorted([(k * 2 * math.pi / 11 + rng.uniform(-0.12, 0.12), rng.uniform(0.75, 1.15), rng.uniform(-0.25, 0.25), int(rng.integers(0, 999)))
                 for k in range(11)], key=lambda p: math.sin(p[0]))
LAVA = burst_particles(rng, 22, cx=C, cy=GROUND - 20, speed=(260, 520), size=(6, 13), life=(0.45, 0.65), delay=(0.3, 0.42),
                       angle=(-math.pi * 0.85, -math.pi * 0.15), radius=20)
DEBRIS = burst_particles(rng, 18, cx=C, cy=GROUND - 10, speed=(220, 460), size=(8, 16), life=(0.45, 0.6), delay=(0.26, 0.34),
                         angle=(-math.pi * 0.95, -math.pi * 0.05), radius=50)
DUSTS = [(rng.uniform(-1, 1), rng.uniform(30, 52), int(rng.integers(0, 999))) for _ in range(12)]


def cracks(f: Frame, t: float) -> None:
    s = ease_out(seg(t, 0.0, 0.24), 2)
    fade = 1 - seg(t, 0.7, 0.95)
    if s <= 0 or fade <= 0:
        return

    def shapes(c):
        for k in range(12):
            a = k * 2 * math.pi / 12 + 0.15
            reach = 200 * s * (0.75 + 0.25 * (k % 3) / 2)
            pts = lightning(np.random.default_rng(k + 3), (C, GROUND), (C + math.cos(a) * reach, GROUND + math.sin(a) * reach * SQUASH),
                            detail=4, roughness=0.25)
            c.drawPath(path_poly(pts, close=False), paint(hexc(ORANGE, fade), stroke=6 * (1 - 0.5 * s) + 1.5))
            c.drawPath(path_poly(pts, close=False), paint(hexc(YELLOW, fade), stroke=1.6))
        radial(c, C, GROUND, 120 * s, [(0, hexc(YELLOW, fade * 0.9)), (0.4, hexc(ORANGE, fade * 0.5)), (1, hexc(ORANGE, 0))], SQUASH)
    glow(f, shapes, 6, 0.9)


def plate(c, rng_seed: int, x: float, y: float, height: float, width: float, lean: float, alpha: float) -> None:
    r = np.random.default_rng(rng_seed)
    tip = (x + lean * height * 0.6, y - height)
    pts = [(x - width / 2, y), (x - width * 0.42, y - height * 0.45), (x - width * 0.18 + lean * 10, y - height * 0.78), tip,
           (x + width * 0.2 + lean * 10, y - height * 0.7), (x + width * 0.46, y - height * 0.4), (x + width / 2, y)]
    body = path_poly(pts)
    c.drawPath(body, paint(hexc(ANTH, alpha)))
    # Faccia illuminata a sinistra.
    c.drawPath(path_poly([pts[0], pts[1], pts[2], tip, (x + lean * height * 0.3, y - height * 0.3), (x - width * 0.1, y)]),
               paint(hexc(ROCK, alpha)))
    c.drawPath(path_poly([pts[1], pts[2], tip, (x - width * 0.05 + lean * 20, y - height * 0.55)]), paint(hexc(LIGHT, alpha)))
    # Crepa incandescente.
    crack = lightning(r, (x + r.uniform(-6, 6), y), (x + lean * height * 0.45, y - height * 0.8), detail=3, roughness=0.3)
    c.drawPath(path_poly(crack, close=False), paint(hexc(ORANGE, alpha), stroke=4))
    c.drawPath(path_poly(crack, close=False), paint(hexc(YELLOW, alpha), stroke=1.4))
    c.drawPath(body, paint(hexc('#141316', alpha), stroke=2.5))


def plates(f: Frame, t: float, front: bool) -> None:
    rise = back_out(seg(t, 0.22, 0.36), 2.4)
    sink = ease_in(seg(t, 0.62, 0.86), 2)
    if rise <= 0 or sink >= 1:
        return

    def shapes(c):
        for a, scale, lean, seed in PLATES:
            if (math.sin(a) > 0) != front:
                continue
            x, y = C + math.cos(a) * 118, GROUND + math.sin(a) * 118 * SQUASH
            height = 160 * scale * rise * (1 - sink) * (0.55 if front else 1.0)
            plate(c, seed, x, y + sink * 30, height, 62 * scale, lean + math.cos(a) * 0.35, 1 - ease_in(sink, 3))
    glow(f, shapes, 6, 0.5)


def magma(f: Frame, t: float) -> None:
    s = seg(t, 0.26, 0.6)
    if s <= 0 or s >= 1:
        return

    def shapes(c):
        h = 300 * ease_out(s, 2) * (1 - ease_in(seg(s, 0.6, 1), 2))
        for k in range(6):
            off = (k - 2.5) * 13
            hh = h * (1 - abs(k - 2.5) * 0.14) * (0.85 + 0.2 * math.sin(t * 60 + k * 2))
            for color, kk in ((ORANGE, 1.0), (AMBER, 0.72), (YELLOW, 0.45)):
                c.drawPath(blade(C + off, GROUND - 4, -math.pi / 2 + off * 0.004, hh * kk, 34 * kk, peak=0.3, tail=0.8),
                           paint(hexc(color)))
        radial(c, C, GROUND - 20, 110, [(0, hexc(YELLOW, 1 - s)), (1, hexc(ORANGE, 0))])
    glow(f, shapes, 12, 0.85)


def flying(f: Frame, t: float) -> None:
    def lava(c):
        for p in LAVA:
            x, y, a, life = p.at(t, gravity=1300, drag=0.3)
            if life < 0:
                continue
            disc(c, x, y, p.size, mix(YELLOW, ORANGE, 1 - life))
            disc(c, x - p.size * 0.3, y - p.size * 0.3, p.size * 0.4, hexc('#fff6d0'))
    glow(f, lava, 5, 1)
    for p in DEBRIS:
        x, y, a, life = p.at(t, gravity=1400, drag=0.2)
        if life < 0 or y > GROUND + 40:
            continue
        c = f.canvas
        c.save()
        c.translate(x, y)
        c.rotate(math.degrees(a * 3))
        rr = p.size
        c.drawPath(path_poly([(-rr, -rr * 0.4), (-rr * 0.2, -rr), (rr * 0.9, -rr * 0.3), (rr * 0.6, rr * 0.8), (-rr * 0.7, rr * 0.6)]),
                   paint(hexc(ANTH, min(1, life * 3))))
        c.drawPath(path_poly([(-rr, -rr * 0.4), (-rr * 0.2, -rr), (rr * 0.3, -rr * 0.5), (-rr * 0.5, 0)]), paint(hexc(LIGHT, min(1, life * 3))))
        c.restore()


def dust(f: Frame, t: float) -> None:
    s = seg(t, 0.3, 1.0)
    if s <= 0:
        return
    for side, r, seed in DUSTS:
        x = C + side * (60 + 170 * ease_out(s, 2))
        y = GROUND - 8 - 20 * abs(side) * s - 10
        puff(f.canvas, seed, x, y, r * (0.7 + 0.7 * ease_out(s)), base=DUST, shade=DUSTD, light='#b39a7e',
             erode=ease_in(s, 1.4) * 0.85, alpha=min(1, bump(s) * 2) * (1 - ease_in(seg(s, 0.55, 1), 2)))


def draw(f: Frame, t: float, i: int) -> None:
    cracks(f, t)
    plates(f, t, front=False)
    magma(f, t)
    plates(f, t, front=True)
    flying(f, t)
    dust(f, t)


def build():
    return render(FRAMES, draw), {'fps': FPS, 'impact_frame': IMPACT, 'anchor': 'target', 'size': 480, 'offset_y': -10}
