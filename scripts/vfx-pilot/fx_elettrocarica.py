"""019 · Elettrocarica (Grimbolt, Elettro).

Una scia di fulmini ciano arriva da sinistra come una pantera in corsa; tre artigliate d'oro
attraversano il bersaglio in diagonale; lungo i tagli si aprono anelli ciano (i cerchi sul
fianco di Grimbolt) e dall'impatto esplode una raggiera dorata a punte come il suo collare,
con saette gialle che crepitano e si spengono.
"""
from __future__ import annotations

import math

import numpy as np

from fxlib import (C, Frame, blade, broken_ring, bump, burst_particles, disc, ease_in, ease_out, glow, hexc, jagged, layer,
                   lightning, mix, paint, path_poly, radial, render, ring, seg)

FRAMES, FPS, IMPACT = 22, 20, 7
NIGHT, BLUE, CYAN, SKY, GOLD, YELLOW, WHITE = '#0a1020', '#1b5cff', '#27e8ff', '#a8f4ff', '#ffc21a', '#fff06a', '#ffffff'
rng = np.random.default_rng(19)
SLASHES = [(-34, 0.28), (0, 0.33), (34, 0.38)]
SPARKS = burst_particles(rng, 18, speed=(260, 520), size=(16, 30), life=(0.25, 0.4), delay=(0.34, 0.44), radius=20)
RINGS = [(rng.uniform(-90, 90), 0.36 + k * 0.035, rng.uniform(20, 34)) for k in range(6)]


def bolt_path(c, pts, width: float, color, core_color, alpha: float) -> None:
    path = path_poly(pts, close=False)
    c.drawPath(path, paint(hexc(color, alpha), stroke=width))
    c.drawPath(path, paint(hexc(core_color, alpha), stroke=max(1.2, width * 0.35)))


def dash(f: Frame, t: float) -> None:
    s = seg(t, 0.0, 0.3)
    fade = 1 - seg(t, 0.3, 0.46)
    if s <= 0 or fade <= 0:
        return
    head = 60 + (C - 40) * ease_in(s, 1.6)

    def shapes(c):
        r = np.random.default_rng(int(t * 40))
        for k in range(3):
            y = C - 6 + (k - 1) * 22
            tail = max(14, head - 260)
            pts = lightning(r, (tail, y + r.uniform(-10, 10)), (head, y), detail=5, roughness=0.18)
            bolt_path(c, pts, 9 - k * 2, CYAN if k != 1 else BLUE, WHITE, fade * (0.6 + 0.4 * (k == 1)))
        # Testa: punta luminosa a goccia, come il muso della pantera in corsa.
        c.drawPath(blade(head - 70, C - 6, 0, 90, 40, peak=0.75), paint(hexc(CYAN, fade)))
        c.drawPath(blade(head - 50, C - 6, 0, 66, 18, peak=0.8), paint(hexc(WHITE, fade)))
    glow(f, shapes, 9, 1.0)


def slashes(f: Frame, t: float) -> None:
    def shapes(c):
        for off, start in SLASHES:
            s = seg(t, start, start + 0.08)
            fade = 1 - seg(t, start + 0.12, start + 0.4)
            if s <= 0 or fade <= 0:
                continue
            a = math.radians(126)
            x0, y0 = C + 120 + off * 0.6, C - 130 + off
            length = 300 * ease_out(s, 2)
            thick = 30 * (1 - 0.5 * seg(t, start + 0.08, start + 0.4))
            c.drawPath(blade(x0, y0, a, length, thick, peak=0.45, curve=-0.08), paint(hexc(GOLD, fade)))
            c.drawPath(blade(x0, y0, a, length * 0.96, thick * 0.5, peak=0.45, curve=-0.08), paint(hexc(YELLOW, fade)))
            c.drawPath(blade(x0, y0, a, length * 0.9, thick * 0.16, peak=0.45, curve=-0.08), paint(hexc(WHITE, fade)))
    glow(f, shapes, 8, 0.9)


def rings(f: Frame, t: float) -> None:
    def shapes(c):
        for dx, start, size in RINGS:
            s = seg(t, start, start + 0.3)
            if s <= 0 or s >= 1:
                continue
            x, y = C + dx, C - dx * 1.38
            r = size * (0.4 + 1.2 * ease_out(s))
            ring(c, x, y, r, 7 * (1 - s) + 1, hexc(CYAN, 1 - s))
            ring(c, x, y, r * 0.55, 3 * (1 - s) + 0.6, hexc(WHITE, 1 - s))
    glow(f, shapes, 5, 0.9)


def collar(f: Frame, t: float) -> None:
    s = seg(t, 0.32, 0.62)
    if s <= 0 or s >= 1:
        return

    def shapes(c):
        r = 40 + 150 * ease_out(s, 2.5)
        fade = 1 - ease_in(s, 1.5)
        star = jagged(np.random.default_rng(7), C, C, r, 11, 0.5, rot=s * 0.4, jitter=0.35)
        c.drawPath(star, paint(hexc(GOLD, fade)))
        inner = jagged(np.random.default_rng(8), C, C, r * 0.68, 11, 0.45, rot=s * 0.4 + 0.15, jitter=0.35)
        c.drawPath(inner, paint(hexc(YELLOW, fade)))
        radial(c, C, C, r * 0.6, [(0, hexc(WHITE, fade)), (0.6, hexc(WHITE, fade * 0.7)), (1, hexc(YELLOW, 0))])
        broken_ring(c, 3, C, C, r * 0.98, 10 * fade, hexc(CYAN, fade), pieces=6, gap=0.3, rot=-s)
    glow(f, shapes, 10, 0.8)


def sparks(f: Frame, t: float) -> None:
    def shapes(c):
        for k, p in enumerate(SPARKS):
            x, y, a, life = p.at(t, drag=3.5)
            if life < 0:
                continue
            ang = math.atan2(p.vy, p.vx)
            length = p.size * (0.6 + life)
            r = np.random.default_rng(k * 31 + int(t * 30))
            pts = lightning(r, (x, y), (x + math.cos(ang) * length, y + math.sin(ang) * length), detail=3, roughness=0.35)
            bolt_path(c, pts, 4, GOLD if k % 2 else CYAN, WHITE, min(1, life * 2.2))
    glow(f, shapes, 4, 1)


def draw(f: Frame, t: float, i: int) -> None:
    dash(f, t)
    collar(f, t)
    slashes(f, t)
    rings(f, t)
    sparks(f, t)
    flash = bump(seg(t, 0.3, 0.42))
    if flash > 0:
        radial(f.canvas, C, C, 230, [(0, hexc(WHITE, flash)), (0.3, hexc(SKY, flash * 0.6)), (1, hexc(CYAN, 0))])


def build():
    return render(FRAMES, draw), {'fps': FPS, 'impact_frame': IMPACT, 'anchor': 'target', 'size': 460, 'offset_y': 0}
