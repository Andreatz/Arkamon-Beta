"""Primitive di disegno per i VFX disegnati in codice (metodo 3 del lotto pilota).

Stile: effetti anime da gioco di ruolo coreano/giapponese. Forme piene con un tono d'ombra
e uno di luce, bordi netti, un alone luminoso morbido sotto le parti accese, particelle che
seguono archi propri. Si disegna con Skia (antialias, sfocature, fusioni) su tela 512×512
con lo sfondo trasparente; il punto d'impatto è il centro della cella.
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Callable, Iterable

import numpy as np
import skia

S = 512
C = S / 2


# ---------------------------------------------------------------- colori e tempi
def hexc(value: str, alpha: float = 1.0) -> skia.Color4f:
    value = value.lstrip('#')
    r, g, b = (int(value[i:i + 2], 16) / 255 for i in (0, 2, 4))
    return skia.Color4f(r, g, b, max(0.0, min(1.0, alpha)))


def mix(a: str, b: str, t: float, alpha: float = 1.0) -> skia.Color4f:
    ca, cb = hexc(a), hexc(b)
    t = max(0.0, min(1.0, t))
    return skia.Color4f(ca.fR + (cb.fR - ca.fR) * t, ca.fG + (cb.fG - ca.fG) * t, ca.fB + (cb.fB - ca.fB) * t, alpha)


def clamp01(x: float) -> float:
    return max(0.0, min(1.0, x))


def seg(t: float, a: float, b: float) -> float:
    """Avanzamento 0→1 di t nell'intervallo [a, b]."""
    return clamp01((t - a) / (b - a)) if b > a else float(t >= a)


def ease_out(x: float, p: float = 3) -> float:
    return 1 - (1 - clamp01(x)) ** p


def ease_in(x: float, p: float = 3) -> float:
    return clamp01(x) ** p


def ease_io(x: float) -> float:
    x = clamp01(x)
    return x * x * (3 - 2 * x)


def back_out(x: float, s: float = 1.7) -> float:
    if x <= 0:
        return 0.0
    if x >= 1:
        return 1.0
    x = x - 1
    return x * x * ((s + 1) * x + s) + 1


def bump(x: float) -> float:
    """0 → 1 → 0 su [0, 1]."""
    x = clamp01(x)
    return math.sin(math.pi * x)


def polar(r: float, a: float, cx: float = C, cy: float = C, squash: float = 1.0) -> tuple[float, float]:
    return cx + math.cos(a) * r, cy + math.sin(a) * r * squash


# ---------------------------------------------------------------- tela
class Frame:
    def __init__(self) -> None:
        self.surface = skia.Surface(S, S)
        self.canvas = self.surface.getCanvas()
        self.canvas.clear(skia.ColorTRANSPARENT)

    def array(self) -> np.ndarray:
        image = self.surface.makeImageSnapshot()
        data = image.toarray(colorType=skia.kRGBA_8888_ColorType, alphaType=skia.kUnpremul_AlphaType)
        return data.astype(np.float32) / 255


def paint(color: skia.Color4f, *, stroke: float = 0, blur: float = 0, blend: skia.BlendMode | None = None,
          cap: skia.Paint.Cap = skia.Paint.kRound_Cap) -> skia.Paint:
    p = skia.Paint(Color=color, AntiAlias=True)
    if stroke:
        p.setStyle(skia.Paint.kStroke_Style)
        p.setStrokeWidth(stroke)
        p.setStrokeCap(cap)
        p.setStrokeJoin(skia.Paint.kRound_Join)
    if blur:
        p.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, blur))
    if blend is not None:
        p.setBlendMode(blend)
    return p


class layer:
    """Livello temporaneo: opacità, sfocatura (alone) o fusione applicate al gruppo."""

    def __init__(self, f: Frame, *, alpha: float = 1.0, blur: float = 0, blend: skia.BlendMode | None = None) -> None:
        self.f, self.alpha, self.blur, self.blend = f, alpha, blur, blend

    def __enter__(self) -> skia.Canvas:
        p = skia.Paint()
        p.setAlphaf(clamp01(self.alpha))
        if self.blur:
            p.setImageFilter(skia.ImageFilters.Blur(self.blur, self.blur))
        if self.blend is not None:
            p.setBlendMode(self.blend)
        self.f.canvas.saveLayer(None, p)
        return self.f.canvas

    def __exit__(self, *exc) -> None:
        self.f.canvas.restore()


def glow(f: Frame, draw: Callable[[skia.Canvas], None], sigma: float, strength: float = 1.0, passes: int = 1) -> None:
    """Alone: lo stesso disegno sfocato sotto, poi nitido sopra."""
    for i in range(passes):
        with layer(f, alpha=strength, blur=sigma * (1 + i * 1.6)) as canvas:
            draw(canvas)
    draw(f.canvas)


# ---------------------------------------------------------------- tracciati
def path_poly(points: Iterable[tuple[float, float]], close: bool = True) -> skia.Path:
    path = skia.Path()
    pts = list(points)
    path.moveTo(*pts[0])
    for p in pts[1:]:
        path.lineTo(*p)
    if close:
        path.close()
    return path


def smooth_closed(points: list[tuple[float, float]], tension: float = 0.5) -> skia.Path:
    """Curva chiusa morbida (Catmull-Rom) attraverso i punti."""
    n = len(points)
    path = skia.Path()
    path.moveTo(*points[0])
    for i in range(n):
        p0, p1, p2, p3 = points[i - 1], points[i], points[(i + 1) % n], points[(i + 2) % n]
        c1 = (p1[0] + (p2[0] - p0[0]) * tension / 3, p1[1] + (p2[1] - p0[1]) * tension / 3)
        c2 = (p2[0] - (p3[0] - p1[0]) * tension / 3, p2[1] - (p3[1] - p1[1]) * tension / 3)
        path.cubicTo(*c1, *c2, *p2)
    path.close()
    return path


def blade(x: float, y: float, angle: float, length: float, width: float, *, peak: float = 0.35, curve: float = 0.0,
          tail: float = 0.0) -> skia.Path:
    """Fuso affusolato da (x, y) lungo `angle`: scie, scintille, lame, piume. `curve` lo incurva."""
    ca, sa = math.cos(angle), math.sin(angle)
    nx, ny = -sa, ca
    def at(u: float, side: float) -> tuple[float, float]:
        bend = curve * length * 4 * u * (1 - u)
        half = width / 2 * (math.sin(math.pi * min(1, u / (2 * peak))) if u < peak else math.cos(math.pi / 2 * (u - peak) / (1 - peak)))
        half = max(half, tail * width / 2 * (1 - u))
        return (x + ca * u * length + nx * (bend + side * half), y + sa * u * length + ny * (bend + side * half))
    steps = 14
    left = [at(i / steps, 1) for i in range(steps + 1)]
    right = [at(i / steps, -1) for i in range(steps, -1, -1)]
    return path_poly(left + right)


def jagged(rng: np.random.Generator, cx: float, cy: float, r: float, spikes: int, depth: float, *, squash: float = 1.0,
           rot: float = 0.0, jitter: float = 0.25) -> skia.Path:
    """Stella irregolare a punte (esplosioni, corone, fauci)."""
    pts = []
    for i in range(spikes * 2):
        a = rot + math.pi * i / spikes + rng.uniform(-jitter, jitter) * math.pi / spikes
        rr = r * (1 if i % 2 == 0 else 1 - depth) * rng.uniform(0.85, 1.12)
        pts.append(polar(rr, a, cx, cy, squash))
    return path_poly(pts)


def lightning(rng: np.random.Generator, p0: tuple[float, float], p1: tuple[float, float], *, detail: int = 5,
              roughness: float = 0.22) -> list[tuple[float, float]]:
    pts = [p0, p1]
    offset = math.dist(p0, p1) * roughness
    for _ in range(detail):
        out = [pts[0]]
        for a, b in zip(pts, pts[1:]):
            mx, my = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2
            dx, dy = b[0] - a[0], b[1] - a[1]
            length = math.hypot(dx, dy) or 1
            k = rng.uniform(-offset, offset)
            out += [(mx - dy / length * k, my + dx / length * k), b]
        pts = out
        offset *= 0.55
    return pts


# ---------------------------------------------------------------- elementi ricorrenti
def ring(canvas: skia.Canvas, cx: float, cy: float, r: float, width: float, color: skia.Color4f, squash: float = 1.0,
         blur: float = 0) -> None:
    if r <= 0 or width <= 0:
        return
    rect = skia.Rect.MakeXYWH(cx - r, cy - r * squash, 2 * r, 2 * r * squash)
    canvas.drawOval(rect, paint(color, stroke=width, blur=blur))


def disc(canvas: skia.Canvas, cx: float, cy: float, r: float, color: skia.Color4f, squash: float = 1.0, blur: float = 0) -> None:
    if r <= 0:
        return
    canvas.drawOval(skia.Rect.MakeXYWH(cx - r, cy - r * squash, 2 * r, 2 * r * squash), paint(color, blur=blur))


def radial(canvas: skia.Canvas, cx: float, cy: float, r: float, stops: list[tuple[float, skia.Color4f]], squash: float = 1.0) -> None:
    if r <= 0:
        return
    shader = skia.GradientShader.MakeRadial(skia.Point(cx, cy), r, [c.toColor() for _, c in stops], [p for p, _ in stops])
    p = skia.Paint(AntiAlias=True)
    p.setShader(shader)
    canvas.save()
    canvas.translate(cx, cy)
    canvas.scale(1, squash)
    canvas.translate(-cx, -cy)
    canvas.drawCircle(cx, cy, r, p)
    canvas.restore()


@dataclass
class Particle:
    x: float
    y: float
    vx: float
    vy: float
    size: float
    spin: float
    angle: float
    life: float
    delay: float
    kind: int = 0

    def at(self, t: float, gravity: float = 0.0, drag: float = 0.0) -> tuple[float, float, float, float]:
        """Posizione, angolo e vita residua (1→0) al tempo t (frazione del ciclo)."""
        age = t - self.delay
        if age < 0 or age > self.life:
            return self.x, self.y, self.angle, -1
        k = age if drag <= 0 else (1 - math.exp(-drag * age)) / drag
        return (self.x + self.vx * k, self.y + self.vy * k + 0.5 * gravity * age * age,
                self.angle + self.spin * age, 1 - age / self.life)


def burst_particles(rng: np.random.Generator, n: int, *, cx: float = C, cy: float = C, speed: tuple[float, float] = (300, 600),
                    size: tuple[float, float] = (4, 10), life: tuple[float, float] = (0.3, 0.6), delay: tuple[float, float] = (0, 0.05),
                    angle: tuple[float, float] = (0, 2 * math.pi), radius: float = 0.0, kinds: int = 1) -> list[Particle]:
    out = []
    for _ in range(n):
        a = rng.uniform(*angle)
        v = rng.uniform(*speed)
        r0 = rng.uniform(0, radius)
        out.append(Particle(cx + math.cos(a) * r0, cy + math.sin(a) * r0, math.cos(a) * v, math.sin(a) * v,
                            rng.uniform(*size), rng.uniform(-12, 12), a, rng.uniform(*life), rng.uniform(*delay),
                            int(rng.integers(0, kinds))))
    return out


def puff(canvas: skia.Canvas, rng_seed: int, cx: float, cy: float, r: float, *, base: str, shade: str, light: str,
         erode: float = 0.0, alpha: float = 1.0, lobes: int = 6, outline: str | None = None) -> None:
    """Nuvoletta di fumo anime: lobi tondi, ombra a mezzaluna in basso a destra, riflesso in alto a
    sinistra; `erode` la consuma con buchi che si allargano dai bordi."""
    if r <= 1 or alpha <= 0.01:
        return
    rng = np.random.default_rng(rng_seed)
    r *= 1 - 0.25 * erode
    circles = [(cx, cy, r * 0.7)]
    for i in range(lobes):
        a = 2 * math.pi * i / lobes + rng.uniform(-0.3, 0.3)
        d = r * rng.uniform(0.38, 0.55)
        circles.append((cx + math.cos(a) * d, cy + math.sin(a) * d * 0.8, r * rng.uniform(0.4, 0.58)))
    body = skia.Path()
    for x, y, rr in circles:
        body.addCircle(x, y, rr)
    with layer(_frame_of(canvas), alpha=alpha) as c:
        if outline:
            c.drawPath(body, paint(hexc(outline), stroke=max(2.0, r * 0.08)))
        c.drawPath(body, paint(hexc(shade)))
        c.save()
        c.clipPath(body, doAntiAlias=True)
        lit = skia.Path()
        for x, y, rr in circles:
            lit.addCircle(x - rr * 0.12, y - rr * 0.2, rr * 0.9)
        c.drawPath(lit, paint(hexc(base)))
        glint = skia.Path()
        for x, y, rr in circles:
            glint.addCircle(x - rr * 0.3, y - rr * 0.36, rr * 0.5)
        c.clipPath(lit, doAntiAlias=True)
        c.drawPath(glint, paint(hexc(light)))
        c.restore()
        if erode > 0:
            hole = paint(skia.Color4f(0, 0, 0, 1), blend=skia.BlendMode.kDstOut)
            # Buchi che entrano dal bordo esterno: il fumo si sfrangia invece di bucherellarsi.
            for k, (x, y, rr) in enumerate(circles):
                base_a = math.atan2(y - cy, x - cx) if k else rng.uniform(0, 2 * math.pi)
                a = base_a + rng.uniform(-0.6, 0.6)
                d = rr * (1.25 - 0.55 * erode)
                c.drawCircle(x + math.cos(a) * d, y + math.sin(a) * d, rr * (0.2 + 0.75 * erode), hole)


def broken_ring(canvas: skia.Canvas, rng_seed: int, cx: float, cy: float, r: float, width: float, color: skia.Color4f,
                squash: float = 1.0, pieces: int = 4, gap: float = 0.35, rot: float = 0.0) -> None:
    """Anello d'urto spezzato in archi affusolati (più disegnato di un cerchio pieno)."""
    if r <= 0 or width <= 0.3:
        return
    rng = np.random.default_rng(rng_seed)
    span = 2 * math.pi / pieces
    for k in range(pieces):
        a0 = rot + k * span + rng.uniform(0, gap * span * 0.5)
        a1 = rot + (k + 1) * span - rng.uniform(gap * span * 0.5, gap * span)
        steps = 18
        outer, inner = [], []
        for i in range(steps + 1):
            u = i / steps
            a = a0 + (a1 - a0) * u
            w = width * math.sin(math.pi * u) ** 0.6
            outer.append((cx + math.cos(a) * (r + w / 2), cy + math.sin(a) * (r + w / 2) * squash))
            inner.append((cx + math.cos(a) * (r - w / 2), cy + math.sin(a) * (r - w / 2) * squash))
        canvas.drawPath(path_poly(outer + inner[::-1]), paint(color))


_CURRENT: list[Frame] = []


def _frame_of(canvas: skia.Canvas) -> Frame:
    return _CURRENT[-1]


LAST_FIT = [1.0]


def _render_pass(frames: int, draw: Callable[[Frame, float, int], None], scale: float) -> list[np.ndarray]:
    out = []
    for i in range(frames):
        f = Frame()
        _CURRENT.append(f)
        if scale != 1.0:
            f.canvas.translate(C, C)
            f.canvas.scale(scale, scale)
            f.canvas.translate(-C, -C)
        draw(f, i / (frames - 1), i)
        _CURRENT.pop()
        out.append(f.array())
    return out


def render(frames: int, draw: Callable[[Frame, float, int], None], margin: float = 10) -> list[np.ndarray]:
    """Disegna i fotogrammi. Se l'effetto tocca i bordi della cella lo si ridisegna rimpicciolito
    attorno al centro (il gioco allarga la cella dello stesso fattore: `LAST_FIT`)."""
    out = _render_pass(frames, draw, 1.0)
    mask = np.zeros((S, S), bool)
    for frame in out:
        mask |= frame[..., 3] > 0.02
    ys, xs = np.nonzero(mask)
    LAST_FIT[0] = 1.0
    if not len(xs):
        return out
    reach = max(C - xs.min(), xs.max() + 1 - C, C - ys.min(), ys.max() + 1 - C)
    if reach <= C - margin:
        return out
    # Il ritaglio a 512 sottostima l'estensione: si allarga un po' oltre quanto misurato.
    k = (C - margin) / (reach * 1.12)
    LAST_FIT[0] = k
    return _render_pass(frames, draw, k)
