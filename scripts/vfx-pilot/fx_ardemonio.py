"""037 · Ardemonio (Impise, Fuoco).

Un sigillo da grimorio s'accende al suolo; piume nere girano attorno; una colonna di fuoco
sale e si apre in due ali da demone con le nervature d'oro; pagine che bruciano e braci,
poi una seconda ondata di braci e fumo nero che si consuma.
"""
from __future__ import annotations

import math

import numpy as np

from fxlib import (C, Frame, back_out, blade, bump, burst_particles, disc, ease_in, ease_out, glow, hexc, layer, mix,
                   paint, path_poly, puff, radial, render, ring, seg, smooth_closed)

FRAMES, FPS, IMPACT = 26, 20, 8
GROUND = C + 92
SQUASH = 0.3

CHAR, EMBER, ORANGE, GOLD, YELLOW, WHITE = '#1a0d0a', '#9c2208', '#ff6a12', '#ffb627', '#ffe066', '#fff8dc'
rng = np.random.default_rng(37)
FEATHERS = [(rng.uniform(0, 2 * math.pi), rng.uniform(70, 150), rng.uniform(0.7, 1.2), rng.uniform(-0.12, 0.05)) for _ in range(14)]
PAGES = burst_particles(rng, 7, cx=C, cy=GROUND - 60, speed=(160, 330), size=(14, 22), life=(0.45, 0.6), delay=(0.3, 0.42),
                        angle=(-math.pi * 0.95, -math.pi * 0.05))
EMBERS = burst_particles(rng, 46, cx=C, cy=GROUND - 40, speed=(120, 420), size=(2.5, 6), life=(0.3, 0.6), delay=(0.28, 0.5),
                         angle=(-math.pi, 0), radius=40)
EMBERS2 = burst_particles(rng, 30, cx=C, cy=C - 40, speed=(140, 300), size=(2, 5), life=(0.3, 0.45), delay=(0.55, 0.68), radius=60)
SMOKE = [(rng.uniform(-120, 120), rng.uniform(-190, 30), rng.uniform(34, 58), int(rng.integers(0, 999))) for _ in range(11)]


def sigil(f: Frame, t: float) -> None:
    draw = seg(t, 0.0, 0.22)
    fade = 1 - seg(t, 0.55, 0.85)
    if draw <= 0 or fade <= 0:
        return
    flare = bump(seg(t, 0.22, 0.42))
    spin = t * 1.6
    r = 118 * ease_out(draw)

    def shapes(c):
        gold = mix(GOLD, WHITE, flare * 0.6, fade)
        ring(c, C, GROUND, r, 5 + 3 * flare, gold, SQUASH)
        ring(c, C, GROUND, r * 0.8, 2.2, gold, SQUASH)
        ring(c, C, GROUND, r * 0.42, 3, gold, SQUASH)
        # Rune: tacche fra i due cerchi esterni, scritte in giro mentre il cerchio si chiude.
        for i in range(24):
            if i / 24 > draw:
                break
            a = spin + i * 2 * math.pi / 24
            x0, y0 = C + math.cos(a) * r * 0.83, GROUND + math.sin(a) * r * 0.83 * SQUASH
            x1, y1 = C + math.cos(a + 0.09) * r * 0.97, GROUND + math.sin(a + 0.09) * r * 0.97 * SQUASH
            c.drawLine(x0, y0, x1, y1, paint(gold, stroke=2.4))
            if i % 3 == 0:
                c.drawCircle(C + math.cos(a + 0.13) * r * 0.9, GROUND + math.sin(a + 0.13) * r * 0.9 * SQUASH, 2.6, paint(gold))
        # Pentacolo schiacciato.
        pts = [(C + math.cos(-spin * 0.6 + i * 4 * math.pi / 5 - math.pi / 2) * r * 0.8,
                GROUND + math.sin(-spin * 0.6 + i * 4 * math.pi / 5 - math.pi / 2) * r * 0.8 * SQUASH) for i in range(5)]
        c.drawPath(path_poly(pts), paint(gold, stroke=2.2))

    with layer(f, alpha=fade):
        radial(f.canvas, C, GROUND, r * 1.2, [(0, hexc(ORANGE, 0.55 + 0.4 * flare)), (0.6, hexc(EMBER, 0.25)), (1, hexc(EMBER, 0))], SQUASH)
        glow(f, shapes, 6, 0.9)


def feathers(f: Frame, t: float, front: bool) -> None:
    life = seg(t, 0.0, 0.62)
    if life <= 0 or life >= 1:
        return
    for i, (a0, r0, s, lift) in enumerate(FEATHERS):
        a = a0 + life * 5.5
        side = math.sin(a) > 0
        if side != front:
            continue
        r = r0 * (1 - 0.55 * ease_in(life, 2))
        x, y = C + math.cos(a) * r, GROUND - 40 + math.sin(a) * r * 0.35 - life * 140 * (0.6 + lift)
        alpha = bump(life) * 1.4
        length = 34 * s
        ang = a + math.pi / 2 + 0.4
        with layer(f, alpha=min(1, alpha)):
            f.canvas.drawPath(blade(x, y, ang, length, 11 * s, peak=0.4, curve=0.12), paint(hexc(CHAR)))
            f.canvas.drawPath(blade(x, y, ang, length * 0.92, 3 * s, peak=0.5, curve=0.12), paint(hexc(ORANGE, 0.9)))


def flame_tongue(c, x: float, y: float, height: float, width: float, sway: float, heat: float, alpha: float) -> None:
    layers = [(CHAR, 1.12, 0.0), (EMBER, 1.0, 0.0), (ORANGE, 0.8, 0.08), (GOLD, 0.58, 0.16), (YELLOW, 0.38, 0.24), (WHITE, 0.2, 0.3)]
    for color, k, rise in layers:
        if color == WHITE and heat < 0.4:
            continue
        c.drawPath(blade(x, y + height * rise * 0.2, -math.pi / 2 + sway * 0.1, height * k, width * k, peak=0.28, curve=sway, tail=0.6),
                   paint(hexc(color, alpha)))


def pillar(f: Frame, t: float) -> None:
    rise = ease_out(seg(t, 0.24, 0.42), 2)
    fade = 1 - seg(t, 0.62, 0.86)
    if rise <= 0 or fade <= 0:
        return
    heat = 1 - seg(t, 0.4, 0.8)
    height = 250 * rise * (0.75 + 0.25 * fade)

    def shapes(c):
        for k in range(7):
            off = (k - 3) * 15
            wob = math.sin(t * 40 + k * 1.7) * 0.18
            h = height * (1 - abs(k - 3) * 0.12) * (0.84 + 0.2 * math.sin(t * 47 + k * 2.3))
            flame_tongue(c, C + off, GROUND - 6, h, 46 - abs(k - 3) * 5, wob, heat, fade)

    glow(f, shapes, 14, 0.75)


def wings(f: Frame, t: float) -> None:
    open_ = back_out(seg(t, 0.3, 0.5), 1.4)
    fade = 1 - seg(t, 0.6, 0.84)
    if open_ <= 0 or fade <= 0:
        return
    base_y = C - 46
    heat = 1 - seg(t, 0.45, 0.8)

    def shapes(c):
        for s in (-1, 1):
            ribs = []
            for k in range(5):
                a = -math.pi / 2 + s * (0.42 + k * 0.3) * (0.4 + 0.6 * open_)
                length = (170 - k * 20) * open_
                ribs.append((C + s * 14 + math.cos(a) * length, base_y + math.sin(a) * length * 0.95))
            # Membrana: dalla spalla alle punte, con lembi incurvati fra una nervatura e l'altra.
            pts = [(C + s * 14, base_y)]
            for k, tip in enumerate(ribs):
                pts.append(tip)
                if k < len(ribs) - 1:
                    nxt = ribs[k + 1]
                    pts.append(((tip[0] + nxt[0]) / 2 * 0.9 + (C + s * 14) * 0.1, (tip[1] + nxt[1]) / 2 * 0.9 + base_y * 0.1 + 18))
            pts.append((C + s * 30, base_y + 40))
            membrane = smooth_closed(pts, 0.35)
            c.drawPath(membrane, paint(hexc(CHAR, fade)))
            with layer(f, alpha=fade):
                c.save()
                c.clipPath(membrane, doAntiAlias=True)
                radial(c, C + s * 14, base_y, 190 * open_, [(0, hexc(WHITE)), (0.18, hexc(YELLOW)), (0.45, hexc(ORANGE)),
                                                             (0.8, hexc(EMBER)), (1, hexc(CHAR))])
                c.restore()
            for tip in ribs:
                c.drawLine(C + s * 14, base_y, tip[0], tip[1], paint(mix(GOLD, WHITE, heat * 0.5, fade), stroke=3.5))
                c.drawCircle(tip[0], tip[1], 3.5, paint(hexc(YELLOW, fade)))
            # Fiammelle lungo il bordo superiore.
            for k, tip in enumerate(ribs):
                sway = math.sin(t * 50 + k * 2) * 0.25
                flame_tongue(c, tip[0], tip[1] + 6, 46 * open_ * fade, 16, sway, heat, fade)

    glow(f, shapes, 12, 0.8)


def pages(f: Frame, t: float) -> None:
    for p in PAGES:
        x, y, a, life = p.at(t, gravity=420, drag=2.0)
        if life < 0:
            continue
        burn = 1 - life
        w, h = p.size * (1.2 - burn * 0.6), p.size * 1.35 * (1.2 - burn * 0.6)
        c = f.canvas
        c.save()
        c.translate(x, y)
        c.rotate(math.degrees(a * 0.6))
        c.skew(math.sin(a * 2) * 0.4, 0)
        body = path_poly([(-w / 2, -h / 2), (w / 2, -h / 2 + 2), (w / 2 - 2, h / 2), (-w / 2 + 1, h / 2 - 2)])
        c.drawPath(body, paint(mix('#f4e3b5', '#c9a46a', burn, min(1, life * 2.5))))
        for k in range(3):
            c.drawLine(-w * 0.35, -h * 0.25 + k * h * 0.22, w * 0.3, -h * 0.25 + k * h * 0.22, paint(hexc('#8a5a2b', min(1, life * 2)), stroke=1.2))
        c.drawPath(body, paint(hexc(ORANGE, min(1, life * 2.5)), stroke=2 + burn * 3))
        c.restore()


def embers(f: Frame, t: float, group) -> None:
    def shapes(c):
        for p in group:
            x, y, a, life = p.at(t, gravity=-260, drag=1.5)
            if life < 0:
                continue
            color = mix(YELLOW, EMBER, 1 - life, min(1, life * 2.2))
            c.drawPath(blade(x, y, math.atan2(p.vy - 200, p.vx), p.size * 3.2, p.size, peak=0.5), paint(color))
    glow(f, shapes, 4, 1.0)


def smoke(f: Frame, t: float) -> None:
    s = seg(t, 0.42, 1.0)
    if s <= 0:
        return
    for dx, dy, r, seed in SMOKE:
        rise = ease_out(s, 2) * 60
        puff(f.canvas, seed, C + dx * (0.7 + 0.5 * s), C + dy - rise, r * (0.7 + 0.6 * s), base='#3a2a26', shade='#1d1311',
             light='#5b4038', erode=ease_in(s, 1.4) * 0.95, alpha=bump(seg(s, 0, 1)) * 1.3)


def draw(f: Frame, t: float, i: int) -> None:
    smoke(f, t)
    feathers(f, t, front=False)
    sigil(f, t)
    wings(f, t)
    pillar(f, t)
    pages(f, t)
    embers(f, t, EMBERS)
    embers(f, t, EMBERS2)
    feathers(f, t, front=True)
    # Lampo d'impatto.
    flash = bump(seg(t, 0.27, 0.4))
    if flash > 0:
        radial(f.canvas, C, GROUND - 60, 150, [(0, hexc(WHITE, flash)), (0.35, hexc(YELLOW, flash * 0.6)), (1, hexc(ORANGE, 0))])


def build() -> tuple[list[np.ndarray], dict]:
    return render(FRAMES, draw), {'fps': FPS, 'impact_frame': IMPACT, 'anchor': 'target', 'size': 480, 'offset_y': -20}
