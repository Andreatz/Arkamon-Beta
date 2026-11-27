"""058 · Occhio universale (Felyss, Psico).

Nastri viola e lilla arrivano a spirale e si intrecciano sopra il bersaglio in un grande occhio
a mandorla incorniciato da due orbite (l'alone di Felyss). L'occhio si apre: la pupilla è una
stella bianca a quattro punte. Lampo, poi un'onda psichica di anelli lilla, stelline e punti
magenta scende sul bersaglio; i nastri si srotolano in riccioli e svaniscono.
"""
from __future__ import annotations

import math

import numpy as np

from fxlib import (C, Frame, back_out, blade, broken_ring, bump, burst_particles, disc, ease_in, ease_out, glow, hexc, layer,
                   mix, paint, path_poly, radial, render, ring, seg)

FRAMES, FPS, IMPACT = 24, 20, 10
EYE_Y = C - 40
NIGHT, VIOLET, LILAC, MAGENTA, PINK, WHITE = '#2a0f4a', '#7b3fe4', '#c9a2ff', '#e04cd6', '#ffb8f4', '#ffffff'
rng = np.random.default_rng(58)
RIBBONS = [(k * 2 * math.pi / 6 + rng.uniform(-0.2, 0.2), rng.uniform(0.85, 1.15), k) for k in range(6)]
STARS = burst_particles(rng, 22, cx=C, cy=EYE_Y + 20, speed=(140, 330), size=(5, 11), life=(0.3, 0.5), delay=(0.42, 0.5),
                        angle=(0.2, math.pi - 0.2), radius=40)
DOTS = burst_particles(rng, 30, cx=C, cy=EYE_Y, speed=(80, 260), size=(2, 4.5), life=(0.3, 0.55), delay=(0.4, 0.56))


def star(cx: float, cy: float, r: float, rot: float = 0.0, thin: float = 0.22):
    pts = []
    for i in range(8):
        a = rot + i * math.pi / 4
        rr = r if i % 2 == 0 else r * thin
        pts.append((cx + math.cos(a) * rr, cy + math.sin(a) * rr))
    return path_poly(pts)


def ribbons(f: Frame, t: float) -> None:
    gather = ease_out(seg(t, 0.0, 0.34), 2)
    release = seg(t, 0.5, 0.92)
    if release >= 1:
        return

    def shapes(c):
        for a0, scale, k in RIBBONS:
            # Spirale che si stringe verso l'occhio; dopo il lampo si srotola verso l'esterno.
            spin = a0 + gather * 3.2 + release * 1.2
            radius = (230 - 130 * gather + 160 * ease_out(release)) * scale
            length = 1.6 + 0.6 * gather
            steps = 30
            prev = None
            for i in range(steps + 1):
                u = i / steps
                a = spin - length * (1 - u)
                rr = radius * (0.6 + 0.4 * u) + 14 * math.sin(u * 9 + k)
                x, y = C + math.cos(a) * rr, EYE_Y + math.sin(a) * rr * 0.55
                if prev:
                    w = 1.5 + 14 * math.sin(math.pi * u) ** 1.5 * (1 - 0.6 * release)
                    col = mix(VIOLET, LILAC, u, (1 - release) * min(1, gather * 3 + 0.2))
                    c.drawLine(*prev, x, y, paint(col, stroke=w))
                prev = (x, y)
            # Ricciolo in punta.
            if prev and release > 0:
                c.drawCircle(prev[0], prev[1], 10 * release, paint(hexc(LILAC, 1 - release), stroke=3))
    glow(f, shapes, 8, 0.9)


def eye(f: Frame, t: float) -> None:
    form = ease_out(seg(t, 0.2, 0.36), 2)
    open_ = back_out(seg(t, 0.36, 0.46), 2)
    fade = 1 - seg(t, 0.62, 0.82)
    if form <= 0 or fade <= 0:
        return
    w, h = 150 * form, 74 * form * max(0.08, open_)

    def shapes(c):
        # Orbite inclinate attorno all'occhio.
        for k, (tilt, rr) in enumerate(((0.35, 1.25), (-0.5, 1.12))):
            c.save()
            c.translate(C, EYE_Y)
            c.rotate(math.degrees(tilt + t * (1.5 if k else -1.2)))
            ring(c, 0, 0, w * rr, 3, hexc(LILAC, fade * form), 0.32)
            ax = math.cos(t * 9 + k * 2) * w * rr
            ay = math.sin(t * 9 + k * 2) * w * rr * 0.32
            disc(c, ax, ay, 5, hexc(WHITE, fade * form))
            c.restore()
        # Mandorla: due archi che si aprono.
        top = [(C - w, EYE_Y)]
        bottom = [(C - w, EYE_Y)]
        for i in range(1, 21):
            u = i / 20
            x = C - w + 2 * w * u
            top.append((x, EYE_Y - h * math.sin(math.pi * u) ** 0.9))
            bottom.append((x, EYE_Y + h * math.sin(math.pi * u) ** 0.9))
        almond = path_poly(top + bottom[::-1])
        c.drawPath(almond, paint(hexc(NIGHT, fade)))
        with layer(f, alpha=fade):
            c.save()
            c.clipPath(almond, doAntiAlias=True)
            radial(c, C, EYE_Y, w * 0.9, [(0, hexc(MAGENTA)), (0.35, hexc(VIOLET)), (1, hexc(NIGHT))])
            ring(c, C, EYE_Y, 46 * form, 4, hexc(LILAC, 0.9))
            ring(c, C, EYE_Y, 32 * form, 2, hexc(PINK, 0.9))
            c.restore()
        c.drawPath(almond, paint(hexc(LILAC, fade), stroke=5))
        # Ciglia a punta in alto, come le orecchie di Felyss.
        for k in range(5):
            u = 0.2 + k * 0.15
            x, y = C - w + 2 * w * u, EYE_Y - h * math.sin(math.pi * u) ** 0.9
            c.drawPath(blade(x, y, -math.pi / 2 + (u - 0.5) * 1.6, 24 * form * min(1, open_ + 0.2), 7, peak=0.3), paint(hexc(LILAC, fade)))
        # Pupilla a stella.
        if open_ > 0.05:
            r = 30 * open_ * (1 + 0.6 * bump(seg(t, 0.44, 0.54)))
            c.drawPath(star(C, EYE_Y, r, t * 2), paint(hexc(WHITE, fade)))
            disc(c, C, EYE_Y, r * 0.22, hexc(PINK, fade))
    glow(f, shapes, 10, 0.95, passes=2)


def wave(f: Frame, t: float) -> None:
    s = seg(t, 0.44, 0.86)
    if s <= 0 or s >= 1:
        return

    def shapes(c):
        for k in range(4):
            u = seg(s, k * 0.12, 0.55 + k * 0.12)
            if 0 < u < 1:
                y = EYE_Y + 40 + 150 * ease_out(u)
                broken_ring(c, 80 + k, C, y, 60 + 150 * ease_out(u), 14 * (1 - u) + 2, mix(LILAC, MAGENTA, u, 1 - u), 0.28,
                            pieces=5, gap=0.3, rot=k)
        flash = 1 - seg(s, 0, 0.25)
        if flash > 0:
            radial(c, C, EYE_Y, 220, [(0, hexc(WHITE, flash)), (0.25, hexc(PINK, flash * 0.7)), (0.6, hexc(VIOLET, flash * 0.3)), (1, hexc(VIOLET, 0))])
            c.drawPath(star(C, EYE_Y, 230 * ease_out(seg(s, 0, 0.2)), 0.0, 0.06), paint(hexc(WHITE, flash)))
    glow(f, shapes, 9, 0.8)


def sparkles(f: Frame, t: float) -> None:
    def shapes(c):
        for p in STARS:
            x, y, a, life = p.at(t, gravity=260, drag=2.2)
            if life >= 0:
                c.drawPath(star(x, y, p.size * (0.6 + 0.6 * bump(life)), a * 0.3, 0.3), paint(mix(WHITE, LILAC, 1 - life, min(1, life * 2.5))))
        for p in DOTS:
            x, y, a, life = p.at(t, gravity=-60, drag=2)
            if life >= 0:
                disc(c, x, y, p.size, mix(MAGENTA, PINK, life, min(1, life * 2.5)))
    glow(f, shapes, 4, 1)


def draw(f: Frame, t: float, i: int) -> None:
    ribbons(f, t)
    eye(f, t)
    wave(f, t)
    sparkles(f, t)


def build():
    return render(FRAMES, draw), {'fps': FPS, 'impact_frame': IMPACT, 'anchor': 'target', 'size': 470, 'offset_y': -10}
