"""010 · Tormenta glaciale (Blizzaquil, Acqua).

Due grandi ali di piume di cristallo entrano dai lati e battono insieme sul bersaglio; il colpo
scatena una bufera a spirale di schegge a forma di piuma, fiocchi e nastri di vento, che finisce
in una corona di cristalli che esplode verso l'alto e si frantuma in brina scintillante.
"""
from __future__ import annotations

import math

import numpy as np

from fxlib import (C, Frame, back_out, blade, bump, burst_particles, disc, ease_in, ease_out, glow, hexc, layer, mix, paint,
                   path_poly, radial, render, seg)

FRAMES, FPS, IMPACT = 26, 20, 7
SNOW, ICE, GLACIER, DEEP, SLATE, WHITE = '#f3fbff', '#9fe6ff', '#3d8fd6', '#1f4f9a', '#3b4a63', '#ffffff'
rng = np.random.default_rng(10)
SHARDS = [(rng.uniform(0, 2 * math.pi), rng.uniform(40, 170), rng.uniform(10, 22), rng.uniform(0.7, 1.4), int(rng.integers(0, 3)))
          for _ in range(34)]
FROST = burst_particles(rng, 40, cx=C, cy=C - 40, speed=(120, 360), size=(2, 5), life=(0.3, 0.5), delay=(0.66, 0.74), radius=60)
CROWN = [(k, -math.pi / 2 + (k - 4) * 0.28 + rng.uniform(-0.06, 0.06), rng.uniform(0.75, 1.1)) for k in range(9)]


def crystal(c, x: float, y: float, angle: float, length: float, width: float, alpha: float) -> None:
    """Cristallo sfaccettato: corpo blu, faccia chiara, filo bianco."""
    ca, sa = math.cos(angle), math.sin(angle)
    nx, ny = -sa, ca
    tip = (x + ca * length, y + sa * length)
    mid_l = (x + ca * length * 0.35 + nx * width / 2, y + sa * length * 0.35 + ny * width / 2)
    mid_r = (x + ca * length * 0.35 - nx * width / 2, y + sa * length * 0.35 - ny * width / 2)
    base = (x - ca * length * 0.12, y - sa * length * 0.12)
    c.drawPath(path_poly([base, mid_l, tip, mid_r]), paint(hexc(GLACIER, alpha)))
    c.drawPath(path_poly([base, mid_l, tip, (x + ca * length * 0.4, y + sa * length * 0.4)]), paint(hexc(ICE, alpha)))
    c.drawLine(*base, *tip, paint(hexc(WHITE, alpha), stroke=1.6))
    c.drawPath(path_poly([base, mid_l, tip, mid_r]), paint(hexc(DEEP, alpha), stroke=1.6))


def wing(c, side: int, t: float) -> None:
    sweep = ease_in(seg(t, 0.0, 0.28), 1.6)
    fade = 1 - seg(t, 0.3, 0.42)
    if fade <= 0:
        return
    sx = C + side * (140 - 105 * sweep)
    sy = C - 20
    for k in range(9):
        a = (math.pi if side < 0 else 0) + side * (-1.25 + k * 0.3) * -1
        a += side * 0.9 * sweep * (1 if side < 0 else -1) * 0
        a = a if side > 0 else a
        length = (150 - abs(k - 4) * 12) * (0.8 + 0.2 * sweep)
        # Le piume puntano all'indietro rispetto al movimento.
        direction = math.atan2(math.sin(a), math.cos(a))
        x, y = sx, sy + (k - 4) * 9
        c.drawPath(blade(x, y, direction, length, 26, peak=0.35, curve=0.08 * side), paint(hexc(GLACIER, fade)))
        c.drawPath(blade(x, y, direction, length * 0.94, 15, peak=0.35, curve=0.08 * side), paint(hexc(SNOW, fade)))
        c.drawPath(blade(x, y, direction, length * 0.9, 3, peak=0.5, curve=0.08 * side), paint(hexc(ICE, fade)))


def clap(f: Frame, t: float) -> None:
    flash = bump(seg(t, 0.24, 0.38))
    if flash <= 0:
        return
    radial(f.canvas, C, C - 20, 200, [(0, hexc(WHITE, flash)), (0.35, hexc(ICE, flash * 0.7)), (1, hexc(GLACIER, 0))])
    for k in range(10):
        a = k * math.pi / 5 + 0.2
        f.canvas.drawPath(blade(C, C - 20, a, 230 * ease_out(seg(t, 0.26, 0.36)), 16 * flash, peak=0.2), paint(hexc(WHITE, flash)))


def vortex(f: Frame, t: float) -> None:
    s = seg(t, 0.28, 0.82)
    if s <= 0 or s >= 1:
        return

    def shapes(c):
        # Nastri di vento a spirale.
        for k in range(4):
            spin = s * 7 + k * math.pi / 2
            prev = None
            for i in range(26):
                u = i / 25
                a = spin - 2.2 * (1 - u)
                r = (60 + 140 * (1 - u)) * (0.6 + 0.6 * ease_out(s))
                x, y = C + math.cos(a) * r, C - 10 + math.sin(a) * r * 0.42 - 70 * s * u
                if prev:
                    c.drawLine(*prev, x, y, paint(hexc(SNOW, bump(s) * 0.9), stroke=1 + 9 * math.sin(math.pi * u)))
                prev = (x, y)
        for a0, r0, size, speed, kind in SHARDS:
            a = a0 + s * 9 * speed
            r = r0 * (0.5 + 0.7 * ease_out(s))
            x, y = C + math.cos(a) * r, C - 10 + math.sin(a) * r * 0.42 - 90 * s * (r0 / 170)
            alpha = min(1, bump(s) * 2)
            if kind == 2:
                for j in range(3):
                    aa = j * math.pi / 3 + a
                    c.drawLine(x - math.cos(aa) * size * 0.5, y - math.sin(aa) * size * 0.5, x + math.cos(aa) * size * 0.5,
                               y + math.sin(aa) * size * 0.5, paint(hexc(WHITE, alpha), stroke=2))
            else:
                crystal(c, x, y, a + math.pi / 2, size * 2, size * 0.7, alpha)
    glow(f, shapes, 5, 0.7)


def crown(f: Frame, t: float) -> None:
    rise = back_out(seg(t, 0.5, 0.64), 1.8)
    shatter = seg(t, 0.68, 0.8)
    if rise <= 0 or shatter >= 1:
        return

    def shapes(c):
        for k, a, scale in CROWN:
            length = 150 * scale * rise
            off = shatter * 50
            x, y = C + math.cos(a) * (30 + off), C + 40 + math.sin(a) * (30 + off)
            crystal(c, x, y, a, length, 34 * scale, 1 - shatter)
        radial(c, C, C + 40, 90, [(0, hexc(WHITE, (1 - shatter) * 0.8)), (1, hexc(ICE, 0))], 0.5)
    glow(f, shapes, 8, 0.8)


def frost(f: Frame, t: float) -> None:
    def shapes(c):
        for p in FROST:
            x, y, a, life = p.at(t, gravity=200, drag=2.2)
            if life < 0:
                continue
            r = p.size * (0.5 + bump(life))
            c.drawPath(path_poly([(x, y - r * 2), (x + r * 0.5, y), (x, y + r * 2), (x - r * 0.5, y)]), paint(hexc(WHITE, min(1, life * 2))))
            c.drawPath(path_poly([(x - r * 2, y), (x, y + r * 0.5), (x + r * 2, y), (x, y - r * 0.5)]), paint(hexc(ICE, min(1, life * 2))))
    glow(f, shapes, 3, 1)


def draw(f: Frame, t: float, i: int) -> None:
    def wings(c):
        wing(c, -1, t)
        wing(c, 1, t)
    glow(f, wings, 7, 0.6)
    vortex(f, t)
    clap(f, t)
    crown(f, t)
    frost(f, t)


def build():
    return render(FRAMES, draw), {'fps': FPS, 'impact_frame': IMPACT, 'anchor': 'target', 'size': 480, 'offset_y': -10}
