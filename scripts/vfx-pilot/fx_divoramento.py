"""073 · Divoramento (Weedrug, Erba).

Una stella di foglie blu dentellate si apre al suolo; ne spuntano tre fauci di pianta carnivora
(da sinistra, da destra e dal basso), di foglie cerulee con denti bianchi e un riflesso rosso
come gli occhi di Weedrug. Si spalancano e scattano insieme sul bersaglio con uno schizzo di
linfa blu e brandelli di foglia; masticano una volta, poi rientrano nelle foglie che appassiscono
in petali blu.
"""
from __future__ import annotations

import math

import numpy as np

from fxlib import (C, Frame, back_out, blade, bump, burst_particles, disc, ease_in, ease_out, glow, hexc, layer, mix, paint,
                   path_poly, radial, render, seg, smooth_closed)

FRAMES, FPS, IMPACT = 26, 20, 11
GROUND = C + 104
SQUASH = 0.34
NAVY, DEEP, CERULEAN, SKY, PALE, WHITE, RED = '#0d1f4d', '#1d3f8f', '#2f78d8', '#7cc2ff', '#cfe9ff', '#ffffff', '#e8213a'
rng = np.random.default_rng(73)
# Fauci: angolo da cui arrivano (verso il centro), ritardo.
JAWS = [(math.radians(155), 0.0), (math.radians(25), 0.03), (math.radians(90), 0.06)]
SAP = burst_particles(rng, 30, cx=C, cy=C - 10, speed=(200, 460), size=(4, 9), life=(0.3, 0.5), delay=(0.44, 0.5), radius=24)
SHREDS = burst_particles(rng, 14, cx=C, cy=C - 10, speed=(160, 340), size=(10, 18), life=(0.35, 0.55), delay=(0.44, 0.5), radius=30)
PETALS = burst_particles(rng, 18, cx=C, cy=GROUND - 10, speed=(40, 140), size=(6, 11), life=(0.3, 0.42), delay=(0.66, 0.78),
                         angle=(-math.pi, 0), radius=120)


def serrated_leaf(c, x: float, y: float, angle: float, length: float, width: float, alpha: float, teeth: int = 5) -> None:
    ca, sa = math.cos(angle), math.sin(angle)
    nx, ny = -sa, ca
    pts_l, pts_r = [], []
    for i in range(teeth * 2 + 1):
        u = i / (teeth * 2)
        half = width / 2 * math.sin(math.pi * u) ** 0.8 * (1.18 if i % 2 else 0.86)
        px, py = x + ca * length * u, y + sa * length * u
        pts_l.append((px + nx * half, py + ny * half))
        pts_r.append((px - nx * half, py - ny * half))
    body = path_poly(pts_l + pts_r[::-1])
    c.drawPath(body, paint(hexc(DEEP, alpha)))
    half_path = path_poly(pts_l + [(x + ca * length, y + sa * length)] + [(x, y)])
    c.drawPath(half_path, paint(hexc(CERULEAN, alpha)))
    c.drawLine(x, y, x + ca * length * 0.95, y + sa * length * 0.95, paint(hexc(SKY, alpha), stroke=2))
    c.drawPath(body, paint(hexc(NAVY, alpha), stroke=2))


def ground_star(f: Frame, t: float) -> None:
    s = back_out(seg(t, 0.0, 0.16), 1.6)
    wither = seg(t, 0.62, 0.9)
    if s <= 0 or wither >= 1:
        return

    def shapes(c):
        for k in range(10):
            a = k * 2 * math.pi / 10 + 0.15
            length = 120 * s * (0.85 + 0.15 * (k % 2)) * (1 - 0.4 * wither)
            c.save()
            c.translate(C, GROUND)
            c.scale(1, SQUASH)
            serrated_leaf(c, 0, 0, a, length, 46, 1 - wither)
            c.restore()
        radial(c, C, GROUND, 70 * s, [(0, hexc(NAVY, 1 - wither)), (1, hexc(NAVY, 0))], SQUASH)
    glow(f, shapes, 5, 0.5)


def jaw(c, angle: float, dist: float, gape: float, scale: float, alpha: float, t: float) -> None:
    """Una fauce: due valve di foglia con denti, incernierate sul retro, rivolte verso il centro."""
    hx, hy = C + math.cos(angle) * dist, C - 10 + math.sin(angle) * dist
    facing = angle + math.pi
    length = 150 * scale
    # Stelo dal suolo alla cerniera.
    import skia
    stem = skia.Path()
    root = (C + (hx - C) * 0.35, GROUND + 4)
    stem.moveTo(*root)
    stem.quadTo((root[0] + hx) / 2 + (hx - C) * 0.4, (root[1] + hy) / 2 + 10, hx, hy)
    c.drawPath(stem, paint(hexc(NAVY, alpha), stroke=20 * scale))
    c.drawPath(stem, paint(hexc(CERULEAN, alpha), stroke=11 * scale))
    c.drawPath(stem, paint(hexc(SKY, alpha), stroke=3 * scale))
    for side in (-1, 1):
        a = facing + side * gape
        ca, sa = math.cos(a), math.sin(a)
        nx, ny = -sa * side, ca * side
        # Valva a mezzaluna: dorso esterno curvo, bordo interno dritto con i denti.
        outer = []
        for i in range(13):
            u = i / 12
            bulge = math.sin(math.pi * u ** 0.8) * 58 * scale
            outer.append((hx + ca * length * u + nx * bulge * -1, hy + sa * length * u + ny * bulge * -1))
        inner = [(hx + ca * length * u, hy + sa * length * u) for u in np.linspace(1, 0, 8)]
        valve = path_poly(outer + inner)
        c.drawPath(valve, paint(hexc(DEEP, alpha)))
        inner_face = path_poly(outer[2:11] + [(hx + ca * length * 0.82, hy + sa * length * 0.82), (hx + ca * length * 0.18, hy + sa * length * 0.18)])
        c.drawPath(inner_face, paint(hexc(CERULEAN, alpha)))
        for i in range(2, 11, 2):
            u = i / 12
            bx, by = outer[i]
            c.drawPath(blade(bx, by, a + math.pi / 2 * -side + side * 0.4, 18 * scale, 9 * scale, peak=0.3),
                       paint(hexc(SKY, alpha)))
        c.drawPath(valve, paint(hexc(NAVY, alpha), stroke=2.5))
        # Denti bianchi lungo il bordo interno.
        for i in range(1, 7):
            u = i / 7
            px, py = hx + ca * length * u, hy + sa * length * u
            ta = a + math.pi / 2 * side * -1
            c.drawPath(path_poly([(px - ca * 6 * scale, py - sa * 6 * scale), (px + ca * 6 * scale, py + sa * 6 * scale),
                                  (px + math.cos(ta) * 15 * scale, py + math.sin(ta) * 15 * scale)]), paint(hexc(WHITE, alpha)))
    # Riflesso rosso alla cerniera, come gli occhi di Weedrug.
    glint = 0.6 + 0.4 * math.sin(t * 60)
    disc(c, hx + math.cos(facing) * 18, hy + math.sin(facing) * 18 - 10, 6 * scale, hexc(RED, alpha * glint))


def jaws(f: Frame, t: float) -> None:
    def shapes(c):
        for angle, delay in JAWS:
            rise = ease_out(seg(t, 0.12 + delay, 0.32 + delay), 2)
            snap = ease_in(seg(t, 0.36, 0.44), 2.5)
            chew = bump(seg(t, 0.5, 0.6))
            sink = ease_in(seg(t, 0.62, 0.78), 2)
            if rise <= 0 or sink >= 1:
                continue
            dist = (220 - 120 * rise + 30 * sink) * (1 - 0.15 * snap)
            gape = 0.85 * rise * (1 - snap) + 0.04 + 0.2 * chew
            jaw(c, angle, dist, gape, 0.8 + 0.2 * rise, 1 - sink, t)
    glow(f, shapes, 6, 0.6)


def splash(f: Frame, t: float) -> None:
    def shapes(c):
        for p in SAP:
            x, y, a, life = p.at(t, gravity=900, drag=0.8)
            if life >= 0:
                c.drawPath(blade(x, y, math.atan2(p.vy, p.vx) + math.pi, p.size * 3, p.size * 1.4, peak=0.7), paint(mix(SKY, CERULEAN, 1 - life, min(1, life * 2.5))))
                disc(c, x - 1, y - 1, p.size * 0.3, hexc(WHITE, min(1, life * 2.5)))
        for p in SHREDS:
            x, y, a, life = p.at(t, gravity=500, drag=1.5)
            if life >= 0:
                serrated_leaf(c, x, y, a * 2, p.size * 1.6, p.size * 0.7, min(1, life * 2.5), teeth=3)
        flash = bump(seg(t, 0.42, 0.52))
        if flash > 0:
            radial(c, C, C - 10, 150, [(0, hexc(WHITE, flash)), (0.3, hexc(SKY, flash * 0.6)), (1, hexc(CERULEAN, 0))])
    glow(f, shapes, 4, 0.8)


def petals(f: Frame, t: float) -> None:
    for p in PETALS:
        x, y, a, life = p.at(t, gravity=-80, drag=1)
        if life >= 0:
            sway = math.sin(a * 3 + life * 8) * 10
            f.canvas.drawPath(blade(x + sway, y, a * 1.5, p.size * 2, p.size, peak=0.5, curve=0.2), paint(mix(SKY, DEEP, 1 - life, min(1, life * 2))))


def draw(f: Frame, t: float, i: int) -> None:
    ground_star(f, t)
    jaws(f, t)
    splash(f, t)
    petals(f, t)


def build():
    return render(FRAMES, draw), {'fps': FPS, 'impact_frame': IMPACT, 'anchor': 'target', 'size': 480, 'offset_y': -10}
