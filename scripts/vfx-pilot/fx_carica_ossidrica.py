"""004 · Carica ossidrica (Vyrath, Normale).

Due ali di drago (nervature avorio, membrana nera bordata di turchese) si chiudono attorno a
un nucleo d'aria compressa bianco; poi si spalancano e il nucleo esplode in avanti: anelli
d'urto avorio, un cono di linee d'aria, piume turchesi e la fiammella blu della coda che
gira attorno al colpo. Si scioglie in sbuffi grigio perla.
"""
from __future__ import annotations

import math

import numpy as np

from fxlib import (C, Frame, back_out, blade, broken_ring, bump, burst_particles, disc, ease_in, ease_out, glow, hexc, layer, lightning,
                   mix, paint, path_poly, puff, radial, render, ring, seg, smooth_closed)

FRAMES, FPS, IMPACT = 24, 20, 9
IVORY, PEARL, ANTHRACITE, BLACK, TURQ, CYAN, WHITE = '#f4f1e8', '#c9cdd3', '#4a4f58', '#121419', '#2fd3c8', '#9ff5ee', '#ffffff'
rng = np.random.default_rng(4)
FEATHERS = burst_particles(rng, 18, speed=(260, 520), size=(16, 26), life=(0.35, 0.55), delay=(0.36, 0.42),
                           angle=(-1.3, 1.3), radius=20)
AIR = [(rng.uniform(-0.55, 0.55), rng.uniform(0.7, 1.0), rng.uniform(0, 0.05)) for _ in range(16)]
PUFFS = [(rng.uniform(-150, 150), rng.uniform(-110, 110), rng.uniform(26, 44), int(rng.integers(0, 999))) for _ in range(10)]
CONVERGE = [(rng.uniform(0, 2 * math.pi), rng.uniform(150, 230), rng.uniform(0, 0.12)) for _ in range(22)]


def wing(f: Frame, side: int, fold: float, alpha: float, t: float) -> None:
    """Ala: `fold` 1 = chiusa attorno al nucleo, 0 = spalancata all'indietro."""
    sx, sy = C + side * (96 - 30 * fold), C - 10 + 10 * fold
    ribs = []
    for k in range(5):
        # Ala sinistra: aperta verso sinistra, chiusa ruotando dall'alto sopra il nucleo.
        open_a = math.pi + (-1.0 + k * 0.42)
        closed_a = 2 * math.pi + (-1.2 + k * 0.5)
        a = open_a + (closed_a - open_a) * fold
        if side > 0:
            a = math.pi - a
        length = (210 - k * 18) * (0.8 + 0.2 * fold)
        ribs.append((sx + math.cos(a) * length, sy + math.sin(a) * length, a, length, 0.0))
    pts = [(sx, sy)]
    for k, (x, y, a, length, bend) in enumerate(ribs):
        pts.append((x, y))
        if k < len(ribs) - 1:
            nx, ny = ribs[k + 1][0], ribs[k + 1][1]
            mx, my = (x + nx) / 2, (y + ny) / 2
            pts.append((sx + (mx - sx) * 0.84, sy + (my - sy) * 0.84))
    membrane = smooth_closed(pts, 0.3)

    def shapes(c):
        c.drawPath(membrane, paint(hexc(BLACK, alpha)))
        c.save()
        c.clipPath(membrane, doAntiAlias=True)
        with layer(f, alpha=alpha):
            radial(c, sx, sy, 220, [(0, hexc(BLACK)), (0.55, hexc('#16343a')), (0.85, hexc('#1d6b6a')), (1, hexc(TURQ))])
        c.restore()
        c.drawPath(membrane, paint(hexc(TURQ, alpha), stroke=5))
        for x, y, a, length, bend in ribs:
            c.drawLine(sx, sy, x, y, paint(hexc(ANTHRACITE, alpha), stroke=9))
            c.drawLine(sx, sy, x, y, paint(hexc(IVORY, alpha), stroke=5))
            c.drawPath(blade(x, y, a, 26, 9, peak=0.3), paint(hexc(IVORY, alpha)))
        disc(c, sx, sy, 12, hexc(ANTHRACITE, alpha))
        disc(c, sx, sy, 7, hexc(IVORY, alpha))

    with layer(f, alpha=1):
        glow(f, shapes, 7, 0.55)


def core(f: Frame, t: float) -> None:
    grow = ease_in(seg(t, 0.05, 0.36), 2)
    out = seg(t, 0.36, 0.46)
    if grow <= 0 or out >= 1:
        return
    r = 10 + 34 * grow
    pulse = 1 + 0.08 * math.sin(t * 90)
    with layer(f, alpha=1 - out):
        radial(f.canvas, C, C, r * 3.2 * pulse, [(0, hexc(CYAN, 0.7)), (0.4, hexc(TURQ, 0.3)), (1, hexc(TURQ, 0))])
        for k in range(3):
            ring(f.canvas, C, C, r * (1.5 + k * 0.45) * (1 - 0.15 * grow), 2.5, hexc(IVORY, 0.55 + 0.15 * k))
        disc(f.canvas, C, C, r * pulse, hexc(WHITE))
        disc(f.canvas, C - r * 0.3, C - r * 0.3, r * 0.35, hexc(CYAN, 0.6))


def converge(f: Frame, t: float) -> None:
    s = seg(t, 0.04, 0.36)
    if s <= 0 or s >= 1:
        return
    def shapes(c):
        for a, r0, d in CONVERGE:
            k = seg(s, d, 1)
            r = r0 * (1 - ease_in(k, 2)) + 30
            c.drawPath(blade(C + math.cos(a) * r, C + math.sin(a) * r, a + math.pi, 46 * (0.4 + k), 4, peak=0.6),
                       paint(hexc(IVORY, bump(k) * 0.95)))
    glow(f, shapes, 3, 0.8)


def blast(f: Frame, t: float) -> None:
    s = seg(t, 0.36, 0.8)
    if s <= 0 or s >= 1:
        return
    cx = C + 20
    def shapes(c):
        for k in range(3):
            rs = seg(s, k * 0.08, 0.7 + k * 0.1)
            if 0 < rs < 1:
                r = 40 + 200 * ease_out(rs, 2.4)
                broken_ring(c, 40 + k, cx + 30 * rs, C, r, 26 * (1 - rs) + 3, mix(WHITE, PEARL, rs, 1 - rs), 0.9 - 0.08 * k,
                            pieces=3 + k, gap=0.25 + 0.2 * rs, rot=k * 0.9 + rs * 0.6)
                broken_ring(c, 50 + k, cx + 30 * rs, C, r * 0.94, 8 * (1 - rs) + 1, hexc(TURQ, (1 - rs) * 0.9), 0.9 - 0.08 * k,
                            pieces=3 + k, gap=0.4, rot=k * 0.9 + rs * 0.6 + 0.3)
        for spread, length, d in AIR:
            k = seg(s, d, 0.5 + d)
            if 0 < k < 1:
                a = spread * 0.9
                x = cx + 20 + ease_out(k) * 120 * length
                c.drawPath(blade(x - 40, C + math.sin(a) * 90 * ease_out(k), a * 0.5, 150 * length * bump(k) + 10, 6, peak=0.25),
                           paint(hexc(WHITE, 1 - k)))
        flash = 1 - seg(s, 0, 0.2)
        if flash > 0:
            radial(c, cx, C, 170, [(0, hexc(WHITE, flash)), (0.4, hexc(CYAN, 0.6 * flash)), (1, hexc(TURQ, 0))])
            c.drawPath(blade(C - 60, C, 0, 300 * ease_out(seg(s, 0, 0.12)), 70 * flash, peak=0.3), paint(hexc(WHITE, flash)))
    glow(f, shapes, 9, 0.7)


def feathers(f: Frame, t: float) -> None:
    def shapes(c):
        for p in FEATHERS:
            x, y, a, life = p.at(t, gravity=160, drag=2.6)
            if life < 0:
                continue
            ang = math.atan2(p.vy, p.vx) + math.sin(a * 2) * 0.4
            alpha = min(1, life * 2.2)
            c.drawPath(blade(x, y, ang, p.size * 1.8, p.size * 0.55, peak=0.4, curve=0.12), paint(hexc(TURQ, alpha)))
            c.drawPath(blade(x, y, ang, p.size * 1.6, p.size * 0.12, peak=0.5, curve=0.12), paint(hexc(WHITE, alpha)))
    glow(f, shapes, 5, 0.8)


def tail_flame(f: Frame, t: float) -> None:
    s = seg(t, 0.34, 0.82)
    if s <= 0 or s >= 1:
        return
    head = ease_out(s, 2) * 2.1 * math.pi
    length = 1.4
    def shapes(c):
        prev = None
        steps = 26
        for i in range(steps):
            u = i / (steps - 1)
            a = head - length * (1 - u)
            if a < 0:
                continue
            r = 130 - 40 * u + 10 * math.sin(a * 3)
            x, y = C + 20 + math.cos(a - 1.2) * r, C + math.sin(a - 1.2) * r * 0.62
            if prev:
                w = 2 + 20 * u * (1 - s * 0.7)
                c.drawLine(*prev, x, y, paint(mix(TURQ, CYAN, u, (1 - s) * 1.3), stroke=w))
            prev = (x, y)
        if prev:
            c.drawPath(blade(prev[0], prev[1], head - 1.2 + math.pi / 2, 38 * (1 - s * 0.5), 26 * (1 - s * 0.5), peak=0.35, curve=0.25),
                       paint(hexc(CYAN, min(1, (1 - s) * 1.5))))
            disc(c, prev[0], prev[1], 9 * (1 - s), hexc(WHITE, 1 - s))
    glow(f, shapes, 8, 0.9)


def puffs(f: Frame, t: float) -> None:
    s = seg(t, 0.45, 1.0)
    if s <= 0:
        return
    for dx, dy, r, seed in PUFFS:
        puff(f.canvas, seed, C + 20 + dx * (0.5 + 0.7 * ease_out(s)), C + dy * (0.5 + 0.6 * ease_out(s)) - 20 * s, r * (0.8 + 0.5 * s),
             base='#e4e6ea', shade='#a3aab5', light='#ffffff', erode=ease_in(s, 1.4) * 0.8, alpha=min(1, bump(s) * 1.8) * (1 - ease_in(seg(s, 0.5, 1), 2)))


def draw(f: Frame, t: float, i: int) -> None:
    fold = ease_out(seg(t, 0.0, 0.3), 2) * (1 - back_out(seg(t, 0.34, 0.46), 2.2))
    wing_alpha = min(1, seg(t, 0.0, 0.08) * 3) * (1 - seg(t, 0.5, 0.66))
    puffs(f, t)
    if wing_alpha > 0:
        wing(f, -1, max(0, fold), wing_alpha, t)
        wing(f, 1, max(0, fold), wing_alpha, t)
    converge(f, t)
    core(f, t)
    blast(f, t)
    tail_flame(f, t)
    feathers(f, t)


def build() -> tuple[list[np.ndarray], dict]:
    return render(FRAMES, draw), {'fps': FPS, 'impact_frame': IMPACT, 'anchor': 'target', 'size': 460, 'offset_y': 0}
