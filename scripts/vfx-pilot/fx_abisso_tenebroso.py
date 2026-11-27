"""031 · Abisso tenebroso (Darklaw, Oscurità).

Una voragine dentata dal bordo cremisi si squarcia sotto il bersaglio; tentacoli d'ombra con
artigli a uncino e creste come la criniera di Darklaw scattano in alto e si stringono sul
bersaglio, con rune rosse che lampeggiano; poi trascinano tutto giù, la voragine si richiude
di colpo con schegge di brace e volute di fumo nero.
"""
from __future__ import annotations

import math

import numpy as np

from fxlib import (C, Frame, blade, bump, burst_particles, disc, ease_in, ease_out, glow, hexc, jagged, layer, lightning,
                   mix, paint, path_poly, puff, radial, render, seg)

FRAMES, FPS, IMPACT = 24, 20, 9
GROUND = C + 96
SQUASH = 0.34
BLACK, VOID, CRIMSON, RED, HOT, VIOLET = '#0b0709', '#1c0b10', '#8e0d1c', '#e3182b', '#ff6b5a', '#3a1640'
rng = np.random.default_rng(31)
TENDRILS = [(-150, 0.0, 0.95), (-80, 0.05, 1.15), (-20, 0.02, 0.8), (35, 0.07, 1.2), (100, 0.01, 1.05), (155, 0.04, 0.9)]
SHARDS = burst_particles(rng, 26, cx=C, cy=GROUND - 6, speed=(180, 420), size=(6, 14), life=(0.25, 0.45), delay=(0.66, 0.7),
                         angle=(-math.pi * 0.95, -math.pi * 0.05), radius=50)
WISPS = [(rng.uniform(-130, 130), rng.uniform(-60, 10), rng.uniform(20, 34), int(rng.integers(0, 999))) for _ in range(8)]


def rift(f: Frame, t: float) -> None:
    open_ = ease_out(seg(t, 0.0, 0.18), 2)
    close = ease_in(seg(t, 0.6, 0.68), 2)
    gone = seg(t, 0.68, 0.8)
    width = 175 * open_ * (1 - 0.88 * close)
    if width <= 2 or gone >= 1:
        return
    sq = SQUASH * (1 - 0.6 * close)

    def shapes(c):
        # Crepe rosse che si irradiano sul suolo.
        for k in range(9):
            a = k * 2 * math.pi / 9 + 0.3
            pts = lightning(np.random.default_rng(k), (C + math.cos(a) * width * 0.8, GROUND + math.sin(a) * width * 0.8 * sq),
                            (C + math.cos(a) * width * 1.5, GROUND + math.sin(a) * width * 1.5 * sq), detail=3, roughness=0.3)
            c.drawPath(path_poly(pts, close=False), paint(hexc(RED, 1 - gone), stroke=3))
        maw = jagged(np.random.default_rng(3), C, GROUND, width, 13, 0.32, squash=sq, rot=0.1)
        c.drawPath(maw, paint(hexc(HOT, 1 - gone), stroke=7))
        c.drawPath(maw, paint(hexc(CRIMSON, 1 - gone)))
        inner = jagged(np.random.default_rng(3), C, GROUND + 3, width * 0.86, 13, 0.36, squash=sq, rot=0.1)
        c.drawPath(inner, paint(hexc(BLACK, 1 - gone)))
        radial(c, C, GROUND + 6, width * 0.6, [(0, hexc(VIOLET, 0.5 * (1 - gone))), (1, hexc(BLACK, 0))], sq)
    glow(f, shapes, 10, 0.8)


def tendril(c, x0: float, height: float, lean: float, curl: float, alpha: float, t: float, k: int) -> None:
    steps = 22
    pts = []
    for i in range(steps + 1):
        u = i / steps
        x = x0 + lean * u * u * 120 + math.sin(math.pi * u) * 28 * (1 if k % 2 else -1) + math.sin(u * 7 + t * 22 + k) * 6
        y = GROUND - height * u
        pts.append((x, y))
    # Spessore: largo alla radice, sottile verso l'artiglio.
    left, right = [], []
    for i, (x, y) in enumerate(pts):
        u = i / steps
        w = 13 * (1 - u) ** 0.7 + 2.5
        nx, ny = 1, 0.15 * lean
        left.append((x - w * nx, y - w * ny * 0.1))
        right.append((x + w * nx, y + w * ny * 0.1))
    body = path_poly(left + right[::-1])
    c.drawPath(body, paint(hexc(RED, alpha), stroke=5))
    c.drawPath(body, paint(hexc(BLACK, alpha)))
    # Creste a punta lungo il dorso, come la criniera.
    for i in range(4, steps - 2, 4):
        x, y = pts[i]
        side = -1 if lean > 0 else 1
        c.drawPath(blade(x + side * 12, y, math.pi / 2 + side * 1.0 + math.pi, 26 * (1 - i / steps) + 10, 10, peak=0.3),
                   paint(hexc(BLACK, alpha)))
    # Artiglio a uncino in cima.
    tx, ty = pts[-1]
    hook = -math.pi / 2 + curl
    for j, off in enumerate((-0.5, 0.0, 0.5)):
        c.drawPath(blade(tx, ty, hook + off, 46 - j * 4, 12, peak=0.25, curve=0.35 * (1 if lean <= 0 else -1)), paint(hexc(BLACK, alpha)))
        c.drawPath(blade(tx, ty, hook + off, 42 - j * 4, 3, peak=0.4, curve=0.35 * (1 if lean <= 0 else -1)), paint(hexc(RED, alpha)))
    # Rune rosse.
    for i in range(3, steps - 3, 5):
        x, y = pts[i]
        flick = 0.5 + 0.5 * math.sin(t * 70 + i + k)
        c.drawPath(path_poly([(x - 5, y), (x, y - 7), (x + 5, y), (x, y + 7)]), paint(hexc(HOT, alpha * flick)))


def tendrils(f: Frame, t: float) -> None:
    def shapes(c):
        for k, (x0, delay, scale) in enumerate(TENDRILS):
            rise = ease_out(seg(t, 0.14 + delay, 0.34 + delay), 2.5)
            sink = ease_in(seg(t, 0.52, 0.66), 2)
            height = 230 * scale * rise * (1 - sink)
            if height < 6:
                continue
            clutch = ease_out(seg(t, 0.32, 0.44))
            lean = -x0 / 120 * clutch * 1.1
            tendril(c, C + x0, height * (1 - 0.15 * clutch), lean, -lean * 0.9, 1.0, t, k)
    glow(f, shapes, 7, 0.75)


def shards(f: Frame, t: float) -> None:
    def shapes(c):
        for p in SHARDS:
            x, y, a, life = p.at(t, gravity=700, drag=1.2)
            if life < 0:
                continue
            c.drawPath(blade(x, y, a, p.size * 2.2, p.size * 0.8, peak=0.3), paint(mix(HOT, CRIMSON, 1 - life, min(1, life * 2.5))))
    glow(f, shapes, 4, 1)


def wisps(f: Frame, t: float) -> None:
    s = seg(t, 0.62, 1.0)
    if s <= 0:
        return
    for dx, dy, r, seed in WISPS:
        puff(f.canvas, seed, C + dx * (0.6 + 0.6 * s), GROUND + dy - 90 * ease_out(s), r * (0.7 + 0.8 * s), base='#2a1a24', shade='#120a10',
             light='#4a2a3a', erode=ease_in(s, 1.3) * 0.85, alpha=min(1, bump(s) * 1.6) * (1 - ease_in(seg(s, 0.5, 1), 2)))


def draw(f: Frame, t: float, i: int) -> None:
    rift(f, t)
    tendrils(f, t)
    flash = bump(seg(t, 0.36, 0.48))
    if flash > 0:
        radial(f.canvas, C, C, 140, [(0, hexc(RED, 0.6 * flash)), (1, hexc(CRIMSON, 0))])
    slam = bump(seg(t, 0.64, 0.74))
    if slam > 0:
        radial(f.canvas, C, GROUND, 150, [(0, hexc(HOT, slam)), (0.5, hexc(RED, slam * 0.5)), (1, hexc(RED, 0))], SQUASH)
    shards(f, t)
    wisps(f, t)


def build():
    return render(FRAMES, draw), {'fps': FPS, 'impact_frame': IMPACT, 'anchor': 'target', 'size': 480, 'offset_y': -10}
