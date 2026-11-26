#!/usr/bin/env python3
"""
Arkamon — sintetizzatore degli effetti sonori.

Tutti gli effetti del gioco nascono qui, da zero: onde a impulso, triangolo a 4 bit,
rumore a registro e pochi filtri, come una console a 8 bit. Nessun campione esterno.
Il risultato è deterministico: stessi parametri, stessi file.

Uso:
    python3 scripts/audio/generate-sfx.py               # scrive public/audio/sfx/*.ogg e src/data/audio-sfx.json
    python3 scripts/audio/generate-sfx.py --wav DIR     # in più salva i WAV non compressi in DIR
    python3 scripts/audio/generate-sfx.py --only ui.    # rigenera solo gli id che iniziano così

Richiede numpy, scipy e ffmpeg con libvorbis.
"""
from __future__ import annotations

import argparse
import json
import math
import os
import subprocess
import sys
import tempfile
import zlib
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import lfilter

SR = 44100
ROOT = Path(__file__).resolve().parents[2]

# ---------------------------------------------------------------------------
# Note e tempo
# ---------------------------------------------------------------------------
_NAMES = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}


def hz(note: str | float) -> float:
    """'E5', 'C#4', 'Bb3' → frequenza. Un numero passa invariato."""
    if not isinstance(note, str):
        return float(note)
    i, acc = 1, 0
    while i < len(note) and note[i] in '#b':
        acc += 1 if note[i] == '#' else -1
        i += 1
    midi = 12 * (int(note[i:]) + 1) + _NAMES[note[0].upper()] + acc
    return 440.0 * 2 ** ((midi - 69) / 12)


def ns(d: float) -> int:
    return max(1, int(round(d * SR)))


def tt(n: int) -> np.ndarray:
    return np.arange(n) / SR


def rng(seed: int | str) -> np.random.Generator:
    if isinstance(seed, str):
        seed = zlib.crc32(seed.encode())
    return np.random.default_rng(seed)


# ---------------------------------------------------------------------------
# Oscillatori
# ---------------------------------------------------------------------------
def _freq(f, n: int) -> np.ndarray:
    f = np.asarray(f, dtype=float)
    return np.full(n, float(f)) if f.ndim == 0 else f[:n]


def _phase(f, n: int) -> np.ndarray:
    return np.cumsum(_freq(f, n)) / SR


def pulse(f, d: float, duty: float = 0.5) -> np.ndarray:
    n = ns(d)
    p = _phase(f, n) % 1.0
    return np.where(p < duty, 1.0, -1.0)


def tri(f, d: float, steps: int = 16) -> np.ndarray:
    """Triangolo quantizzato a 16 gradini, come il canale triangolare del NES."""
    n = ns(d)
    p = _phase(f, n) % 1.0
    x = 1.0 - 4.0 * np.abs(p - 0.5)
    return np.round((x + 1) / 2 * (steps - 1)) / (steps - 1) * 2 - 1


def saw(f, d: float) -> np.ndarray:
    n = ns(d)
    return 2.0 * (_phase(f, n) % 1.0) - 1.0


def sine(f, d: float) -> np.ndarray:
    n = ns(d)
    return np.sin(2 * np.pi * _phase(f, n))


def noise(d: float, seed: int | str = 0, rate=None, metallic: bool = False) -> np.ndarray:
    """Rumore. Con `rate` il valore è tenuto (sample & hold) come il registro del NES;
    `metallic` usa una sequenza corta di 93 passi, il «rumore tonale»."""
    n = ns(d)
    g = rng(seed)
    if rate is None:
        return g.uniform(-1, 1, n)
    idx = np.floor(_phase(rate, n)).astype(np.int64)
    size = 93 if metallic else int(idx[-1]) + 2
    table = g.choice([-1.0, 1.0], size=size)
    return table[idx % size]


# ---------------------------------------------------------------------------
# Curve
# ---------------------------------------------------------------------------
def lin(a: float, b: float, d: float) -> np.ndarray:
    return np.linspace(a, b, ns(d))


def sweep(a: float, b: float, d: float, curve: float = 1.0) -> np.ndarray:
    """Glissando esponenziale da a a b (Hz). curve>1 indugia all'inizio."""
    x = np.linspace(0, 1, ns(d)) ** curve
    return a * (b / a) ** x


def vibrato(f, d: float, rate: float = 6.0, semis: float = 0.3, delay: float = 0.0) -> np.ndarray:
    n = ns(d)
    t = tt(n)
    depth = np.clip((t - delay) / 0.08, 0, 1) * semis if delay > 0 else semis
    return _freq(f, n) * 2 ** (depth * np.sin(2 * np.pi * rate * t) / 12)


def env_exp(d: float, decay: float, attack: float = 0.002) -> np.ndarray:
    n = ns(d)
    t = tt(n)
    e = np.exp(-t / max(decay, 1e-4))
    a = ns(attack)
    if a > 1:
        e[:a] *= np.linspace(0, 1, a)
    return e


def env_adsr(d: float, a: float = 0.004, dec: float = 0.06, s: float = 0.6, r: float = 0.06) -> np.ndarray:
    n = ns(d)
    e = np.full(n, s)
    na, nd, nr = ns(a), ns(dec), ns(r)
    na = min(na, n)
    e[:na] = np.linspace(0, 1, na)
    end_d = min(n, na + nd)
    e[na:end_d] = np.linspace(1, s, end_d - na)
    if nr < n:
        e[n - nr:] *= np.linspace(1, 0, nr)
    return e


def env_bell(d: float, peak: float = 0.35, power: float = 1.4) -> np.ndarray:
    """Sale fino a `peak` (frazione della durata) e poi scende: soffi e fruscii."""
    x = np.linspace(0, 1, ns(d))
    up = np.clip(x / peak, 0, 1)
    down = np.clip((1 - x) / (1 - peak), 0, 1)
    return (np.minimum(up, down) ** power)


def env_rise(d: float, power: float = 2.0) -> np.ndarray:
    return np.linspace(0, 1, ns(d)) ** power


def fade(x: np.ndarray, fin: float = 0.0015, fout: float = 0.012) -> np.ndarray:
    x = x.copy()
    a, b = min(len(x), ns(fin)), min(len(x), ns(fout))
    x[:a] *= np.linspace(0, 1, a)
    x[len(x) - b:] *= np.linspace(1, 0, b)
    return x


# ---------------------------------------------------------------------------
# Filtri ed effetti
# ---------------------------------------------------------------------------
def lp(x: np.ndarray, fc: float) -> np.ndarray:
    a = math.exp(-2 * math.pi * min(fc, SR * 0.45) / SR)
    return lfilter([1 - a], [1, -a], x)


def hp(x: np.ndarray, fc: float) -> np.ndarray:
    return x - lp(x, fc)


def lp2(x: np.ndarray, fc: float) -> np.ndarray:
    return lp(lp(x, fc), fc)


def svf(x: np.ndarray, fc, q: float = 1.0, mode: str = 'bp') -> np.ndarray:
    """Filtro a variabili di stato (Chamberlin) con frequenza che può cambiare nel tempo."""
    n = len(x)
    fcs = _freq(fc, n)
    f = 2 * np.sin(np.pi * np.clip(fcs, 20, SR / 6.5) / SR)
    damp = 1.0 / max(q, 0.3)
    out = np.empty(n)
    low = band = 0.0
    for i in range(n):
        high = x[i] - low - damp * band
        band += f[i] * high
        low += f[i] * band
        out[i] = band if mode == 'bp' else low if mode == 'lp' else high
    return out


def crush(x: np.ndarray, bits: int) -> np.ndarray:
    q = 2 ** (bits - 1)
    return np.round(x * q) / q


def decimate(x: np.ndarray, factor: int) -> np.ndarray:
    """Riduce la frequenza di campionamento tenendo ogni valore: grana «bit-crushed»."""
    if factor <= 1:
        return x
    idx = (np.arange(len(x)) // factor) * factor
    return x[idx]


def echo(x: np.ndarray, delay: float = 0.11, fb: float = 0.35, taps: int = 4, tone: float = 5000) -> np.ndarray:
    dn = ns(delay)
    out = np.zeros(len(x) + dn * taps)
    out[:len(x)] += x
    wet = x
    for k in range(1, taps + 1):
        wet = lp(wet, tone) * fb
        out[k * dn:k * dn + len(x)] += wet
    return out


def am(x: np.ndarray, rate: float, depth: float = 1.0, shape: str = 'sine', seed: int | str = 0) -> np.ndarray:
    t = tt(len(x))
    if shape == 'square':
        m = (np.sin(2 * np.pi * rate * t) > 0).astype(float)
    elif shape == 'random':
        # Modulazione casuale ma morbida: niente scatti on/off che diventerebbero clic.
        raw = lp2(noise(len(x) / SR, seed, rate=rate), rate * 1.5)
        m = (raw - raw.min()) / (np.ptp(raw) or 1.0)
    else:
        m = (np.sin(2 * np.pi * rate * t) + 1) / 2
    return x * (1 - depth + depth * m)


def pad(x: np.ndarray, d: float) -> np.ndarray:
    n = ns(d)
    return np.concatenate([x, np.zeros(max(0, n - len(x)))])


def reverse(x: np.ndarray) -> np.ndarray:
    return x[::-1].copy()


class Mix:
    """Somma di strati posati a un certo istante."""

    def __init__(self) -> None:
        self.buf = np.zeros(0)

    def add(self, at: float, x: np.ndarray, gain: float = 1.0) -> 'Mix':
        start = ns(at) if at > 0 else 0
        end = start + len(x)
        if end > len(self.buf):
            self.buf = np.concatenate([self.buf, np.zeros(end - len(self.buf))])
        self.buf[start:end] += x * gain
        return self

    def out(self) -> np.ndarray:
        return self.buf


# ---------------------------------------------------------------------------
# Mattoni sonori
# ---------------------------------------------------------------------------
def tone(note, d: float, wave: str = 'pulse', duty: float = 0.25, decay: float | None = None,
         vib: float = 0.0, vib_rate: float = 6.0, sustain: float = 0.7) -> np.ndarray:
    f = hz(note)
    freq = vibrato(f, d, vib_rate, vib, delay=0.06) if vib else f
    if wave == 'pulse':
        x = pulse(freq, d, duty)
    elif wave == 'tri':
        x = tri(freq, d)
    elif wave == 'sine':
        x = sine(freq, d)
    else:
        x = saw(freq, d)
    e = env_exp(d, decay) if decay else env_adsr(d, 0.003, 0.05, sustain, min(0.05, d * 0.3))
    # Ogni nota si chiude con un rilascio brevissimo: nessun clic alla fine.
    return fade(x * e, 0.0015, min(0.008, d * 0.25))


def melody(notes, unit: float, wave: str = 'pulse', duty: float = 0.25, gate: float = 0.88,
           decay: float | None = None, vib: float = 0.0, sustain: float = 0.7, last_vib: float = 0.0) -> np.ndarray:
    """notes: lista di (nota | None, durata in unità). None è una pausa."""
    m = Mix()
    at = 0.0
    for i, (note, length) in enumerate(notes):
        d = length * unit
        if note is not None:
            v = last_vib if (i == len(notes) - 1 and last_vib) else vib
            m.add(at, tone(note, d * gate, wave, duty, decay, v, sustain=sustain))
        at += d
    return pad(m.out(), at)


def chord(notes, d: float, wave: str = 'pulse', duty: float = 0.25, decay: float | None = None) -> np.ndarray:
    m = Mix()
    for note in notes:
        m.add(0, tone(note, d, wave, duty, decay), 1 / math.sqrt(len(notes)))
    return m.out()


def kick(d: float = 0.16, f0: float = 160, f1: float = 45) -> np.ndarray:
    return tri(sweep(f0, f1, d, 0.6), d) * env_exp(d, d * 0.45)


def snare(d: float = 0.12, seed: int | str = 'snare') -> np.ndarray:
    return lp(noise(d, seed, rate=9000), 7000) * env_exp(d, d * 0.3) + tri(sweep(240, 160, d), d) * env_exp(d, 0.03) * 0.4


def hat(d: float = 0.04, seed: int | str = 'hat') -> np.ndarray:
    return hp(noise(d, seed), 6000) * env_exp(d, 0.012)


def crash(d: float = 0.9, seed: int | str = 'crash') -> np.ndarray:
    return hp(noise(d, seed, rate=16000, metallic=False), 3500) * env_exp(d, d * 0.35)


def burst(d: float, seed, lpf: float | None = None, hpf: float | None = None, decay: float | None = None, rate=None) -> np.ndarray:
    x = noise(d, seed, rate=rate)
    if lpf:
        x = lp2(x, lpf)
    if hpf:
        x = hp(x, hpf)
    return x * env_exp(d, decay or d * 0.3)


def whoosh(d: float, f0: float, f1: float, seed, q: float = 1.4, peak: float = 0.45, f2: float | None = None) -> np.ndarray:
    """Soffio: rumore in un passa-banda che scorre (f0→f1, e poi →f2 se c'è)."""
    if f2 is None:
        fc = sweep(f0, f1, d)
    else:
        n1 = ns(d * peak)
        fc = np.concatenate([sweep(f0, f1, n1 / SR), sweep(f1, f2, d - n1 / SR)])[:ns(d)]
        fc = pad(fc, d)
        fc[fc == 0] = f2
    return svf(noise(d, seed), fc, q) * env_bell(d, peak) * 2.2


def thump(f0: float, f1: float, d: float, decay: float | None = None) -> np.ndarray:
    # Il triangolo a gradini è ricco di armoniche: per un colpo sordo si tiene solo il corpo.
    return lp2(tri(sweep(f0, f1, d, 0.5), d), 2600) * env_exp(d, decay or d * 0.4) * 1.3


def blip(note, d: float = 0.04, duty: float = 0.25, decay: float = 0.03) -> np.ndarray:
    return fade(pulse(hz(note), d, duty) * env_exp(d, decay), 0.001, 0.004)


def ping(f: float, d: float = 0.25, decay: float = 0.07) -> np.ndarray:
    """Tintinnio metallico: due parziali inarmoniche."""
    return (sine(f, d) + 0.6 * sine(f * 1.51, d) + 0.3 * sine(f * 2.76, d)) * env_exp(d, decay) / 1.9


def crackle(d: float, density: float, seed, hpf: float = 1800, gain_spread: float = 0.7) -> np.ndarray:
    g = rng(seed)
    m = Mix()
    count = max(1, int(density * d))
    for _ in range(count):
        at = g.uniform(0, d * 0.95)
        click = hp(noise(0.004, int(g.integers(1 << 30))), hpf) * env_exp(0.004, 0.0012)
        m.add(at, click, g.uniform(1 - gain_spread, 1))
    return pad(m.out(), d)


def bubbles(d: float, count: int, seed, fmin: float = 380, fmax: float = 1300) -> np.ndarray:
    g = rng(seed)
    m = Mix()
    for _ in range(count):
        f0 = g.uniform(fmin, fmax)
        bd = g.uniform(0.03, 0.06)
        b = sine(sweep(f0, f0 * g.uniform(1.8, 2.6), bd, 0.7), bd) * env_exp(bd, bd * 0.5)
        m.add(g.uniform(0, d * 0.82), b, g.uniform(0.45, 1))
    return pad(m.out(), d)


def zap(d: float, fmin: float, fmax: float, seed, hop: float = 0.007, duty: float = 0.5) -> np.ndarray:
    g = rng(seed)
    steps = int(math.ceil(d / hop)) + 1
    vals = np.exp(g.uniform(math.log(fmin), math.log(fmax), steps))
    f = np.repeat(vals, ns(hop))[:ns(d)]
    return pulse(pad(f, d) + 1e-3, d, duty)


def rumble(d: float, seed, fc: float = 160, trem: float = 0.0) -> np.ndarray:
    x = lp2(noise(d, seed, rate=2400), fc) * 3.0
    return am(x, trem, 0.6) if trem else x


def steps(count: int, interval: float, seed, tone_f: float = 1100, soft: float = 1.0) -> np.ndarray:
    g = rng(seed)
    m = Mix()
    for i in range(count):
        f = tone_f * (1.0 if i % 2 == 0 else 0.82)
        at = i * interval * g.uniform(0.94, 1.06)
        level = soft * g.uniform(0.75, 1.0)
        m.add(at, svf(noise(0.03, int(g.integers(1 << 30))), f, 1.6) * env_exp(0.03, 0.009) * 2.4, level)
        m.add(at, tri(sweep(150, 90, 0.04), 0.04) * env_exp(0.04, 0.012), 0.35 * level)
    return m.out()


# ---------------------------------------------------------------------------
# Effetti per elemento (mosse)
# ---------------------------------------------------------------------------
TIERS = ('light', 'medium', 'heavy')


def el_normale(k: int, s: str) -> np.ndarray:
    d = (0.24, 0.4, 0.8)[k]
    m = Mix()
    m.add(0, thump((280, 230, 190)[k], (90, 60, 42)[k], d * 0.75), 1.0)
    m.add(0, burst((0.05, 0.07, 0.1)[k], s + 'smack', lpf=3800, decay=(0.012, 0.018, 0.026)[k]), 0.9)
    m.add(0.004, pulse(sweep(950, 210, 0.07, 0.8), 0.07, 0.25) * env_exp(0.07, 0.03), 0.32)
    if k >= 1:
        m.add(0.085, thump(200, 55, 0.18), 0.65)
        m.add(0.085, burst(0.05, s + 'smack2', lpf=3000, decay=0.014), 0.6)
    if k == 2:
        m.add(0.0, sine(sweep(85, 38, 0.5), 0.5) * env_exp(0.5, 0.18), 0.8)
        m.add(0.17, burst(0.35, s + 'dust', lpf=1400, decay=0.1), 0.35)
        x = m.out()
        return echo(crush(x, 7), 0.09, 0.28, 3, 2600)
    return m.out()


def el_fuoco(k: int, s: str) -> np.ndarray:
    d = (0.36, 0.62, 1.15)[k]
    m = Mix()
    m.add(0, whoosh(d * 0.9, 420, 3200, s + 'flame', q=0.9, peak=0.28, f2=650), 0.85)
    m.add(0, crackle(d, (55, 80, 110)[k], s + 'crk'), 0.55)
    m.add(0, burst(0.06, s + 'ignite', hpf=900, decay=0.02), 0.5)
    if k >= 1:
        roar = lp(saw(vibrato(sweep(95, 62, d * 0.8), d * 0.8, 11, 0.6), d * 0.8), 700)
        m.add(0.02, am(roar, 23, 0.5, 'random', s + 'roar') * env_bell(d * 0.8, 0.2), 0.42)
    if k == 2:
        m.add(0, burst(0.18, s + 'boom', lpf=900, decay=0.07), 1.0)
        m.add(0, sine(sweep(110, 36, 0.6), 0.6) * env_exp(0.6, 0.22), 0.7)
        return echo(decimate(crush(m.out(), 6), 2), 0.1, 0.25, 3, 2400)
    return m.out()


def el_acqua(k: int, s: str) -> np.ndarray:
    d = (0.36, 0.6, 1.05)[k]
    m = Mix()
    m.add(0, hp(lp(noise(0.16, s + 'splash'), 7000), 1300) * env_exp(0.16, (0.035, 0.05, 0.07)[k]), 0.8)
    m.add(0.01, bubbles(d, (6, 10, 18)[k], s + 'bub'), 0.75)
    m.add(0, sine(sweep(260, 520, 0.05), 0.05) * env_exp(0.05, 0.02), 0.5)
    if k >= 1:
        m.add(0.0, svf(noise(d, s + 'wave'), np.concatenate([sweep(300, 1900, d * 0.35), sweep(1900, 380, d * 0.65)])[:ns(d)], 0.8) * env_bell(d, 0.3) * 1.8, 0.6)
    if k == 2:
        m.add(0, tri(sweep(95, 55, 0.7), 0.7) * env_bell(0.7, 0.15), 0.7)
        return echo(m.out(), 0.12, 0.3, 3, 3000)
    return m.out()


def el_erba(k: int, s: str) -> np.ndarray:
    d = (0.3, 0.5, 0.95)[k]
    m = Mix()

    def whip(at: float, g: float, f0: float = 1900) -> None:
        m.add(at, pulse(sweep(f0, 240, 0.075, 0.6), 0.075, 0.125) * env_exp(0.075, 0.035), 0.42 * g)
        m.add(at, hp(noise(0.06, s + f'w{at}'), 3200) * env_exp(0.06, 0.018), 0.7 * g)

    whip(0, 1.0)
    m.add(0, am(svf(noise(d, s + 'leaf'), 4600, 0.9), 26, 0.85, 'random', s + 'lam') * env_bell(d, 0.25) * 1.6, 0.55)
    if k >= 1:
        whip(0.11, 0.85, 1600)
        m.add(0.05, melody([('E6', 1), ('B5', 1), ('G#5', 1), ('E5', 1)], 0.03, 'tri', decay=0.03), 0.3)
    if k == 2:
        whip(0.22, 0.8, 2200)
        whip(0.33, 0.7, 1400)
        m.add(0.3, thump(150, 45, 0.3), 0.8)
        m.add(0.3, burst(0.2, s + 'soil', lpf=1600, decay=0.05), 0.4)
        return echo(m.out(), 0.08, 0.25, 3, 3500)
    return m.out()


def el_elettro(k: int, s: str) -> np.ndarray:
    d = (0.3, 0.55, 1.05)[k]
    m = Mix()
    z = zap(d, 320, 2300, s + 'zap', hop=(0.009, 0.007, 0.006)[k])
    z = am(z, 60, 0.7, 'square') * env_exp(d, d * 0.45)
    m.add(0, z, 0.38)
    m.add(0, lp(noise(d, s + 'arc', rate=7500), 9000) * am(np.ones(ns(d)), 38, 1.0, 'random', s + 'gate') * env_exp(d, d * 0.35), 0.4)
    m.add(0, pulse(sweep(180, 2600, 0.06), 0.06, 0.5) * env_exp(0.06, 0.04), 0.35)
    if k >= 1:
        m.add(0.12, zap(0.2, 600, 3000, s + 'z2', hop=0.004, duty=0.25) * env_exp(0.2, 0.07), 0.3)
    if k == 2:
        m.add(0.0, burst(0.05, s + 'crack', decay=0.012), 1.0)
        m.add(0.03, rumble(0.95, s + 'thunder', 230, trem=7) * env_exp(0.95, 0.35), 1.0)
        return decimate(crush(m.out(), 6), 2)
    return m.out()


def el_terra(k: int, s: str) -> np.ndarray:
    d = (0.36, 0.62, 1.15)[k]
    m = Mix()
    g = rng(s + 'rocks')
    m.add(0, thump((150, 130, 115)[k], 38, d * 0.7), 1.0)
    for _ in range((3, 6, 10)[k]):
        at = g.uniform(0.02, d * 0.7)
        m.add(at, burst(0.05, int(g.integers(1 << 30)), lpf=g.uniform(1200, 2400), decay=0.012), g.uniform(0.4, 0.85))
    m.add(0, rumble(d, s + 'rmb', 170, trem=(0, 13, 9)[k]) * env_exp(d, d * 0.4), (0.4, 0.6, 0.8)[k])
    if k == 2:
        m.add(0, sine(sweep(70, 30, 0.9), 0.9) * env_exp(0.9, 0.35), 0.8)
        return crush(echo(m.out(), 0.13, 0.25, 2, 1500), 7)
    return m.out()


def el_psico(k: int, s: str) -> np.ndarray:
    d = (0.42, 0.66, 1.15)[k]
    m = Mix()
    f = vibrato(sweep(300, 1150, d * 0.7, 0.8), d * 0.7, 9, 1.0)
    body = (pulse(f, d * 0.7, 0.25) + pulse(f * 1.0035, d * 0.7, 0.5)) * 0.5
    m.add(0, lp(body, 5000) * env_bell(d * 0.7, 0.4, 1.0), 0.4)
    arp = [('E6', 1), ('G6', 1), ('B6', 1), ('D7', 1)] * (2, 3, 5)[k]
    m.add(0.03, melody(arp, 0.028, 'pulse', 0.125, decay=0.025), 0.17)
    if k >= 1:
        m.buf = am(m.buf, 12, 0.5)
        m.add(0.05, svf(noise(d * 0.8, s + 'mind'), 2600, 3.5) * env_bell(d * 0.8, 0.5) * 2, 0.3)
    if k == 2:
        m.add(0.45, pulse(vibrato(sweep(1300, 200, 0.5), 0.5, 14, 1.2), 0.5, 0.25) * env_exp(0.5, 0.2), 0.35)
        return echo(m.out(), 0.13, 0.42, 4, 4000)
    return echo(m.out(), 0.09, 0.22, 2, 4000)


def el_oscurita(k: int, s: str) -> np.ndarray:
    d = (0.36, 0.62, 1.15)[k]
    pre = (0.05, 0.12, 0.2)[k]
    m = Mix()
    m.add(0, reverse(burst(pre, s + 'swell', lpf=4000, decay=pre * 0.35)), 0.55)
    m.add(pre, whoosh(0.1, 7200, 850, s + 'slash', q=1.1, peak=0.15), 1.0)
    drone = lp(saw(55, d) + saw(56.6, d) + 0.6 * pulse(27.5, d, 0.25), 520)
    m.add(pre, crush(drone, 4) * env_exp(d, d * 0.4), 0.38)
    if k >= 1:
        m.add(pre + 0.12, whoosh(0.1, 6200, 700, s + 'slash2', q=1.1, peak=0.15), 0.8)
    if k == 2:
        m.add(pre, sine(sweep(95, 28, 0.8), 0.8) * env_exp(0.8, 0.3), 0.9)
        m.add(pre + 0.24, whoosh(0.14, 7600, 500, s + 'slash3', q=1.0, peak=0.15), 0.9)
        return echo(m.out(), 0.14, 0.33, 3, 2200)
    return m.out()


ELEMENTS = {
    'normale': el_normale, 'fuoco': el_fuoco, 'acqua': el_acqua, 'erba': el_erba,
    'elettro': el_elettro, 'terra': el_terra, 'psico': el_psico, 'oscurita': el_oscurita,
}


# ---------------------------------------------------------------------------
# Jingle (tutti originali, in Mi maggiore / Mi minore come la colonna sonora)
# ---------------------------------------------------------------------------
def band(unit: float, lead, harm=None, bass=None, drums=None, lead_duty=0.25, harm_duty=0.125,
         lead_vib=0.0, last_vib=0.25, tail: float = 0.5) -> np.ndarray:
    m = Mix()
    m.add(0, melody(lead, unit, 'pulse', lead_duty, vib=lead_vib, last_vib=last_vib), 0.42)
    if harm:
        m.add(0, melody(harm, unit, 'pulse', harm_duty, vib=lead_vib, last_vib=last_vib * 0.8), 0.24)
    if bass:
        m.add(0, melody(bass, unit, 'tri', gate=0.95, sustain=0.85), 0.6)
    for kind, at in drums or []:
        hit = {'k': kick(), 's': snare(), 'h': hat(), 'c': crash()}[kind]
        m.add(at * unit, hit, {'k': 0.8, 's': 0.45, 'h': 0.3, 'c': 0.28}[kind])
    return echo(pad(m.out(), len(m.out()) / SR + tail), unit * 1.5, 0.18, 2, 3500)


def jingle_victory() -> np.ndarray:
    u = 0.095
    lead = [('B4', 1), ('E5', 1), ('G#5', 1), ('B5', 1), ('E6', 4), ('D#6', 2), ('C#6', 2), ('B5', 2), ('C#6', 2), ('E6', 10)]
    harm = [('G#4', 1), ('B4', 1), ('E5', 1), ('G#5', 1), ('G#5', 4), ('B5', 2), ('A5', 2), ('G#5', 2), ('A5', 2), ('G#5', 10)]
    bass = [('E3', 2), ('E3', 2), ('E3', 2), ('E3', 2), ('A2', 4), ('B2', 4), ('E3', 10)]
    drums = [('k', 0), ('h', 2), ('s', 4), ('h', 6), ('k', 8), ('s', 10), ('k', 12), ('s', 14), ('h', 15), ('k', 16), ('c', 16)]
    return band(u, lead, harm, bass, drums, last_vib=0.35, tail=0.7)


def jingle_defeat() -> np.ndarray:
    u = 0.13
    lead = [('E5', 2), ('D5', 2), ('C5', 2), ('B4', 3), (None, 1), ('A4', 2), ('G4', 2), ('F#4', 2), ('E4', 8)]
    harm = [('G4', 2), ('F#4', 2), ('E4', 2), ('D#4', 4), ('C4', 2), ('B3', 2), ('A#3', 2), ('B3', 8)]
    bass = [('E3', 4), ('D#3', 4), ('D3', 4), ('C#3', 4), ('C3', 2), ('B2', 2), ('E2', 4)]
    return band(u, lead, harm, bass, [('k', 0), ('k', 8), ('s', 16)], lead_duty=0.5, harm_duty=0.25, last_vib=0.4, tail=0.8)


def jingle_levelup() -> np.ndarray:
    u = 0.06
    lead = [('E5', 1), ('G#5', 1), ('B5', 1), ('E6', 1), ('B5', 1), ('E6', 1), ('G#6', 8)]
    harm = [('B4', 1), ('E5', 1), ('G#5', 1), ('B5', 1), ('G#5', 1), ('B5', 1), ('E6', 8)]
    bass = [('E3', 6), ('E3', 8)]
    return band(u, lead, harm, bass, [('h', 0), ('h', 2), ('h', 4), ('c', 6)], last_vib=0.3, tail=0.45)


def jingle_evolution() -> np.ndarray:
    u = 0.1
    lead = [('E5', 1), ('G#5', 1), ('B5', 1), ('E6', 3), ('D#6', 1), ('E6', 1), ('F#6', 2), ('G#6', 2), ('A6', 2), ('B6', 8)]
    harm = [('B4', 1), ('E5', 1), ('G#5', 1), ('B5', 3), ('B5', 1), ('B5', 1), ('D#6', 2), ('E6', 2), ('F#6', 2), ('G#6', 8)]
    bass = [('E3', 6), ('B2', 2), ('A2', 2), ('F#2', 2), ('B2', 2), ('E3', 8)]
    drums = [('k', 0), ('s', 4), ('k', 6), ('k', 8), ('s', 10), ('k', 12), ('s', 13), ('k', 14), ('c', 14)]
    x = band(u, lead, harm, bass, drums, last_vib=0.35, tail=0.8)
    m = Mix().add(0, x)
    m.add(1.4, melody([(n, 1) for n in ['E7', 'B6', 'G#6', 'E6', 'B6', 'G#6', 'E6', 'B5']], 0.04, 'pulse', 0.125, decay=0.04), 0.12)
    return m.out()


def jingle_medal() -> np.ndarray:
    u = 0.1
    lead = [('B5', 1), ('B5', 1), ('B5', 1), ('E6', 3), ('D#6', 1), ('C#6', 1), ('D#6', 1), ('E6', 2), ('G#6', 7)]
    harm = [('G#5', 1), ('G#5', 1), ('G#5', 1), ('B5', 3), ('B5', 1), ('A5', 1), ('B5', 1), ('B5', 2), ('E6', 7)]
    bass = [('E3', 3), ('E3', 3), ('A2', 3), ('B2', 2), ('E3', 7)]
    drums = [('k', 0), ('k', 3), ('s', 6), ('k', 9), ('s', 11), ('k', 11), ('c', 11)]
    return band(u, lead, harm, bass, drums, last_vib=0.35, tail=0.7)


def jingle_item() -> np.ndarray:
    u = 0.075
    lead = [('B5', 1), ('C#6', 1), ('D#6', 1), ('E6', 1), ('B5', 1), ('E6', 6)]
    harm = [('G#5', 1), ('A5', 1), ('B5', 1), ('B5', 1), ('G#5', 1), ('G#5', 6)]
    bass = [('E3', 4), ('B2', 1), ('E3', 6)]
    return band(u, lead, harm, bass, [('h', 0), ('h', 2), ('h', 4)], last_vib=0.3, tail=0.4)


def jingle_heal_center() -> np.ndarray:
    u = 0.11
    lead = [('E5', 2), ('G#5', 2), ('B5', 2), ('E6', 2), ('D#6', 1), ('B5', 1), ('E6', 6)]
    m = Mix()
    m.add(0, melody(lead, u, 'pulse', 0.5, decay=0.18), 0.32)
    m.add(0, melody([('B4', 4), ('E5', 4), ('F#5', 2), ('G#5', 6)], u, 'tri', gate=0.95, sustain=0.8), 0.45)
    m.add(0, melody([('E3', 4), ('A2', 2), ('B2', 2), ('E3', 8)], u, 'tri', gate=0.95, sustain=0.8), 0.45)
    return echo(pad(m.out(), 2.1), 0.16, 0.3, 3, 3500)


def jingle_capture() -> np.ndarray:
    u = 0.085
    m = Mix()
    m.add(0, capture_click(), 0.9)
    seq_ = [('E5', 1), ('B5', 1), ('E6', 1), (None, 1), ('E6', 1), ('F#6', 1), ('G#6', 6)]
    m.add(0.22, band(u, seq_, [('B4', 1), ('G#5', 1), ('B5', 1), (None, 1), ('B5', 1), ('D#6', 1), ('E6', 6)],
                      [('E3', 3), (None, 1), ('B2', 2), ('E3', 6)], [('k', 0), ('s', 4), ('c', 6)], tail=0.6), 1.0)
    return m.out()


def capture_click() -> np.ndarray:
    m = Mix()
    m.add(0, hp(noise(0.02, 'clk'), 2500) * env_exp(0.02, 0.004), 1.0)
    m.add(0, ping(2600, 0.2, 0.05), 0.55)
    m.add(0.035, ping(3900, 0.18, 0.04), 0.35)
    return m.out()


# ---------------------------------------------------------------------------
# Catalogo: id → (funzione, categoria, livello di riferimento in dBFS RMS)
# ---------------------------------------------------------------------------
CATALOG: dict[str, tuple] = {}


def sfx(sid: str, category: str, level: float, note: str):
    def deco(fn):
        CATALOG[sid] = (fn, category, level, note)
        return fn
    return deco


# --- Interfaccia ------------------------------------------------------------
@sfx('ui.hover', 'ui', -30, 'Passaggio su un pulsante: un ticchettio appena percettibile.')
def _():
    return blip('E7', 0.022, 0.125, 0.008)


@sfx('ui.select', 'ui', -22, 'Clic su un pulsante.')
def _():
    m = Mix()
    m.add(0, blip('B6', 0.03, 0.25, 0.014))
    m.add(0.022, blip('E7', 0.04, 0.25, 0.018), 0.8)
    return m.out()


@sfx('ui.confirm', 'ui', -20, 'Conferma di una scelta importante.')
def _():
    return melody([('B5', 1), ('E6', 1), ('G#6', 3)], 0.04, 'pulse', 0.25, decay=0.05)


@sfx('ui.back', 'ui', -23, 'Indietro, chiudi, annulla.')
def _():
    return melody([('G#6', 1), ('B5', 2)], 0.045, 'pulse', 0.5, decay=0.04)


@sfx('ui.error', 'ui', -21, 'Azione non disponibile.')
def _():
    m = Mix()
    m.add(0, pulse(hz('A#2'), 0.09, 0.5) * env_adsr(0.09, 0.002, 0.02, 0.8, 0.02), 1.0)
    m.add(0.12, pulse(hz('A2'), 0.12, 0.5) * env_adsr(0.12, 0.002, 0.02, 0.8, 0.04), 1.0)
    return lp(m.out(), 3000)


@sfx('ui.tab', 'ui', -24, 'Cambio di scheda o di pagina nel menù.')
def _():
    m = Mix()
    m.add(0, hp(noise(0.03, 'tab'), 2500) * env_exp(0.03, 0.006), 0.6)
    m.add(0, tri(hz('E6'), 0.06) * env_exp(0.06, 0.02), 0.9)
    return m.out()


@sfx('ui.page', 'ui', -25, 'Cambio di schermata dentro il menù Partita.')
def _():
    return whoosh(0.16, 1800, 5200, 'page', q=0.9, peak=0.4) * 0.8


@sfx('ui.toggle-on', 'ui', -23, 'Interruttore acceso.')
def _():
    return pulse(sweep(700, 1500, 0.05), 0.05, 0.25) * env_exp(0.05, 0.03)


@sfx('ui.toggle-off', 'ui', -23, 'Interruttore spento.')
def _():
    return pulse(sweep(1300, 600, 0.05), 0.05, 0.25) * env_exp(0.05, 0.03)


@sfx('ui.tick', 'ui', -27, 'Contatore che scorre, cursore di un cursore a scorrimento.')
def _():
    return blip('B6', 0.016, 0.5, 0.005)


@sfx('ui.menu-open', 'ui', -21, 'Apertura del menù Partita.')
def _():
    m = Mix()
    m.add(0, whoosh(0.26, 500, 4200, 'mopen', q=1.0, peak=0.7), 0.7)
    m.add(0.12, chord(['E5', 'B5', 'E6'], 0.22, 'pulse', 0.125, decay=0.07), 0.5)
    return m.out()


@sfx('ui.menu-close', 'ui', -23, 'Chiusura del menù Partita.')
def _():
    m = Mix()
    m.add(0, whoosh(0.22, 3800, 450, 'mclose', q=1.0, peak=0.3), 0.7)
    m.add(0, melody([('B5', 1), ('E5', 2)], 0.04, 'tri', decay=0.04), 0.5)
    return m.out()


@sfx('ui.dialog', 'ui', -23, 'Comparsa di una finestra o di un dialogo.')
def _():
    m = Mix()
    m.add(0, sine(sweep(260, 900, 0.05), 0.05) * env_exp(0.05, 0.03), 0.7)
    m.add(0.03, blip('B6', 0.05, 0.125, 0.025), 0.4)
    return m.out()


@sfx('ui.notify', 'ui', -21, 'Avviso o messaggio importante.')
def _():
    return echo(melody([('G#6', 1), ('E6', 3)], 0.07, 'pulse', 0.5, decay=0.09), 0.09, 0.25, 2)


@sfx('ui.start', 'ui', -18, 'Premi un tasto, dal titolo.')
def _():
    m = Mix()
    arp = ['E4', 'G#4', 'B4', 'E5', 'G#5', 'B5', 'E6', 'G#6', 'B6', 'E7']
    m.add(0, melody([(n, 1) for n in arp], 0.022, 'pulse', 0.25, decay=0.04), 0.45)
    m.add(0.22, chord(['E5', 'G#5', 'B5', 'E6'], 0.7, 'pulse', 0.25, decay=0.22), 0.7)
    m.add(0.22, tri(hz('E3'), 0.7) * env_exp(0.7, 0.3), 0.6)
    m.add(0.22, crash(0.8), 0.18)
    return echo(m.out(), 0.12, 0.3, 3)


@sfx('ui.coins', 'ui', -20, 'Monete guadagnate.')
def _():
    m = Mix()
    m.add(0, blip('B6', 0.06, 0.5, 0.04), 0.7)
    m.add(0.06, pulse(hz('E7'), 0.35, 0.5) * env_exp(0.35, 0.12), 0.6)
    m.add(0.06, ping(5274, 0.3, 0.08), 0.25)
    return m.out()


@sfx('ui.purchase', 'ui', -19, 'Acquisto nel negozio.')
def _():
    m = Mix()
    for i, f in enumerate([3100, 3500, 2900, 3800]):
        m.add(i * 0.045, ping(f, 0.12, 0.03), 0.5)
    m.add(0.2, blip('B6', 0.06, 0.5, 0.04), 0.6)
    m.add(0.26, pulse(hz('E7'), 0.4, 0.5) * env_exp(0.4, 0.13), 0.55)
    return m.out()


# --- Mappa ------------------------------------------------------------------
@sfx('map.select', 'map', -22, 'Selezione di un luogo o di un pallino sulla mappa.')
def _():
    m = Mix()
    m.add(0, blip('E6', 0.035, 0.5, 0.02), 0.8)
    m.add(0.03, blip('B6', 0.05, 0.5, 0.03), 0.8)
    return m.out()


@sfx('map.travel', 'map', -22, 'La pedina si mette in viaggio sulla mappa.')
def _():
    m = Mix()
    m.add(0, steps(6, 0.11, 'travel', 1150), 1.0)
    m.add(0, whoosh(0.7, 300, 1400, 'trv', q=0.8, peak=0.5), 0.18)
    return m.out()


@sfx('map.step', 'map', -24, 'Un passo sulla mappa locale.')
def _():
    return steps(2, 0.1, 'step', 1250)


@sfx('map.arrive', 'map', -22, 'Arrivo a destinazione.')
def _():
    m = Mix()
    m.add(0, thump(190, 70, 0.14), 0.7)
    m.add(0.02, blip('G#6', 0.08, 0.25, 0.05), 0.4)
    m.add(0.07, blip('E7', 0.12, 0.25, 0.06), 0.35)
    return m.out()


@sfx('map.enter', 'map', -21, 'Ingresso in un luogo.')
def _():
    m = Mix()
    m.add(0, whoosh(0.55, 350, 3800, 'enter', q=1.1, peak=0.6), 0.75)
    m.add(0.08, melody([('E5', 1), ('B5', 1), ('E6', 1), ('G#6', 3)], 0.05, 'pulse', 0.125, decay=0.06), 0.35)
    return m.out()


@sfx('map.turn', 'map', -19, 'Cambio di turno fra i giocatori.')
def _():
    m = Mix()
    m.add(0, chord(['B4', 'E5', 'G#5'], 0.1, 'pulse', 0.25, decay=0.05), 0.8)
    m.add(0.13, chord(['E5', 'G#5', 'B5', 'E6'], 0.6, 'pulse', 0.25, decay=0.2), 0.85)
    m.add(0.13, tri(hz('E3'), 0.6) * env_exp(0.6, 0.25), 0.7)
    m.add(0.13, crash(0.6), 0.15)
    return echo(m.out(), 0.11, 0.22, 2)


@sfx('map.encounter', 'map', -18, 'Incontro nell\'erba alta: il punto esclamativo.')
def _():
    m = Mix()
    m.add(0, am(svf(noise(0.35, 'grass'), 3800, 0.8), 30, 0.8, 'random', 'gr') * env_bell(0.35, 0.3) * 1.8, 0.7)
    m.add(0.05, blip('E7', 0.06, 0.25, 0.05), 0.7)
    m.add(0.12, pulse(hz('B7') * 0.5, 0.18, 0.25) * env_exp(0.18, 0.08), 0.7)
    return m.out()


@sfx('map.blocked', 'map', -22, 'Strada bloccata o luogo non raggiungibile.')
def _():
    m = Mix()
    m.add(0, thump(160, 60, 0.16), 0.9)
    m.add(0.02, lp(pulse(hz('E2'), 0.16, 0.5), 1500) * env_exp(0.16, 0.06), 0.45)
    return m.out()


@sfx('transition.whoosh', 'map', -21, 'Transizione fra scene.')
def _():
    m = Mix()
    m.add(0, whoosh(0.75, 380, 4200, 'trans', q=1.0, peak=0.45, f2=420), 0.9)
    m.add(0, tri(sweep(180, 520, 0.4), 0.4) * env_bell(0.4, 0.6), 0.18)
    return m.out()


# --- Battaglia: messa in scena ---------------------------------------------
@sfx('battle.encounter', 'battle', -16, 'Inizio di una battaglia.')
def _():
    m = Mix()
    # La rincorsa dura 0,45 s: il colpo cade sul lampo bianco della Carta VS (17% di 2,76 s).
    run = ['E6', 'D#6', 'E6', 'D6', 'E6', 'C#6', 'E6', 'C6', 'E6', 'B5', 'E6', 'A#5', 'G#5']
    hit = 0.035 * len(run)
    m.add(0, melody([(n, 1) for n in run], 0.035, 'pulse', 0.25, gate=0.8), 0.45)
    m.add(0, whoosh(hit, 250, 5000, 'enc', q=1.2, peak=0.95), 0.4)
    m.add(hit, chord(['E4', 'B4', 'E5'], 0.55, 'pulse', 0.5, decay=0.18), 0.6)
    m.add(hit, kick(0.3, 180, 40), 1.0)
    m.add(hit, crash(0.7), 0.3)
    return echo(m.out(), 0.1, 0.25, 3)


@sfx('battle.vs', 'battle', -15, 'Carta VS: colpo d\'apertura.')
def _():
    m = Mix()
    m.add(0, burst(0.25, 'vs', lpf=5000, decay=0.06), 1.0)
    m.add(0, sine(sweep(140, 35, 0.6), 0.6) * env_exp(0.6, 0.22), 1.0)
    m.add(0.01, chord(['E6', 'B6'], 0.6, 'pulse', 0.25, decay=0.16), 0.35)
    m.add(0.01, ping(1760, 0.8, 0.22), 0.35)
    return echo(crush(m.out(), 7), 0.13, 0.3, 3)


@sfx('battle.coin-spin', 'battle', -22, 'La moneta del primo turno gira in aria.')
def _():
    m = Mix()
    at, gap = 0.0, 0.07
    i = 0
    while at < 1.7:
        level = min(1.0, 0.4 + at) * (1.0 - max(0.0, at - 1.2) * 0.8)
        m.add(at, ping(3300 if i % 2 == 0 else 3650, 0.09, 0.022), level)
        at += gap
        gap *= 1.035
        i += 1
    return m.out()


@sfx('battle.coin-land', 'battle', -19, 'La moneta atterra e rimbalza.')
def _():
    m = Mix()
    m.add(0, ping(3100, 0.5, 0.14), 1.0)
    m.add(0, hp(noise(0.02, 'cl'), 3000) * env_exp(0.02, 0.004), 0.6)
    m.add(0.13, ping(3300, 0.3, 0.08), 0.5)
    m.add(0.21, ping(3200, 0.2, 0.05), 0.25)
    return m.out()


@sfx('dice.roll', 'battle', -20, 'I dadi rotolano.')
def _():
    g = rng('dice')
    m = Mix()
    at = 0.0
    while at < 0.62:
        f = g.uniform(1800, 3200)
        c = svf(noise(0.025, int(g.integers(1 << 30))), f, 2.0) * env_exp(0.025, 0.006) * 2.5
        c = c + tri(g.uniform(500, 900), 0.025) * env_exp(0.025, 0.006) * 0.4
        m.add(at, c, g.uniform(0.5, 1.0) * (1 - at * 0.6))
        at += g.uniform(0.025, 0.06)
    return m.out()


@sfx('dice.land', 'battle', -18, 'I dadi si fermano: il risultato è rivelato.')
def _():
    m = Mix()
    for at, f, gain in [(0, 2100, 1.0), (0.05, 2500, 0.7), (0.09, 1900, 0.5)]:
        m.add(at, svf(noise(0.035, f'land{f}'), f, 2.2) * env_exp(0.035, 0.008) * 2.6, gain)
        m.add(at, tri(hz('E5'), 0.03) * env_exp(0.03, 0.008), 0.3 * gain)
    m.add(0.13, blip('E7', 0.12, 0.25, 0.06), 0.35)
    m.add(0.17, blip('B7', 0.15, 0.125, 0.07), 0.2)
    return m.out()


@sfx('battle.banner', 'battle', -21, 'Il nome della mossa entra in scena.')
def _():
    m = Mix()
    m.add(0, whoosh(0.3, 700, 5200, 'banner', q=1.1, peak=0.55), 0.85)
    m.add(0.14, blip('E6', 0.06, 0.125, 0.03), 0.25)
    return m.out()


@sfx('battle.supreme', 'battle', -15, 'Mossa Suprema: carica e stacco a tutto schermo (1,25 s).')
def _():
    m = Mix()
    rise = 1.22  # il colpo coincide con il lampo che chiude lo stacco (1,25 s)
    m.add(0, whoosh(rise, 250, 6000, 'sup', q=1.5, peak=0.97), 0.7)
    f = vibrato(sweep(160, 1500, rise, 1.4), rise, 10, 0.6)
    m.add(0, pulse(f, rise, 0.25) * env_rise(rise, 1.5), 0.32)
    m.add(0, pulse(f * 1.5, rise, 0.125) * env_rise(rise, 2.2), 0.18)
    m.add(rise, burst(0.3, 'suphit', lpf=6000, decay=0.07), 1.0)
    m.add(rise, sine(sweep(150, 32, 0.7), 0.7) * env_exp(0.7, 0.25), 1.0)
    m.add(rise, chord(['E5', 'B5', 'E6', 'G#6'], 0.7, 'pulse', 0.25, decay=0.22), 0.5)
    m.add(rise, crash(0.9), 0.35)
    return echo(m.out(), 0.12, 0.32, 3)


@sfx('battle.super', 'battle', -17, 'Colpo superefficace.')
def _():
    m = Mix()
    m.add(0, blip('B6', 0.06, 0.25, 0.04), 0.7)
    m.add(0.06, pulse(hz('E7'), 0.28, 0.25) * env_exp(0.28, 0.1), 0.6)
    m.add(0.06, pulse(hz('B6'), 0.28, 0.125) * env_exp(0.28, 0.1), 0.35)
    m.add(0, crush(burst(0.12, 'crunch', lpf=4000, decay=0.03), 4), 0.5)
    return echo(m.out(), 0.08, 0.25, 2)


@sfx('battle.weak', 'battle', -20, 'Colpo poco efficace.')
def _():
    m = Mix()
    m.add(0, thump(130, 70, 0.14), 0.8)
    m.add(0.05, melody([('C4', 1), ('B3', 2)], 0.07, 'pulse', 0.5, decay=0.06), 0.35)
    return lp(m.out(), 2400)


@sfx('battle.miss', 'battle', -20, 'La mossa va a vuoto.')
def _():
    m = Mix()
    m.add(0, whoosh(0.22, 2400, 600, 'miss', q=1.0, peak=0.25), 0.9)
    m.add(0.08, pulse(sweep(700, 260, 0.2), 0.2, 0.5) * env_exp(0.2, 0.08), 0.3)
    return m.out()


@sfx('battle.ko', 'battle', -17, 'Un Arkamon va KO.')
def _():
    m = Mix()
    slide = pulse(sweep(820, 70, 0.75, 0.8), 0.75, 0.25)
    m.add(0, am(slide, 18, 0.5) * env_adsr(0.75, 0.004, 0.1, 0.8, 0.15), 0.5)
    m.add(0.72, thump(120, 40, 0.3), 1.0)
    m.add(0.72, burst(0.3, 'kodust', lpf=1200, decay=0.08), 0.5)
    return m.out()


@sfx('battle.switch-in', 'battle', -20, 'Un Arkamon entra in campo.')
def _():
    m = Mix()
    m.add(0, sine(sweep(220, 900, 0.05), 0.05) * env_exp(0.05, 0.03), 0.8)
    m.add(0.03, whoosh(0.35, 600, 4500, 'swin', q=1.2, peak=0.5), 0.6)
    m.add(0.1, melody([('B5', 1), ('E6', 1), ('B6', 3)], 0.04, 'pulse', 0.125, decay=0.05), 0.35)
    return m.out()


@sfx('battle.item', 'battle', -20, 'Uso di un oggetto della Borsa.')
def _():
    m = Mix()
    m.add(0, am(svf(noise(0.16, 'bag'), 2600, 0.7), 40, 0.8, 'random', 'bg') * env_bell(0.16, 0.3) * 1.6, 0.6)
    m.add(0.12, melody([('B5', 1), ('E6', 1), ('B6', 3)], 0.05, 'pulse', 0.25, decay=0.06), 0.4)
    return m.out()


@sfx('battle.boost', 'battle', -19, 'Potenziamento: velocità o danno in aumento.')
def _():
    m = Mix()
    arp = [('E5', 1), ('G#5', 1), ('B5', 1), ('E6', 1)] * 2 + [('G#6', 1), ('B6', 1), ('E7', 3)]
    m.add(0, melody(arp, 0.035, 'pulse', 0.25, decay=0.04), 0.4)
    m.add(0, whoosh(0.4, 400, 5000, 'boost', q=1.6, peak=0.85), 0.35)
    return echo(m.out(), 0.08, 0.22, 2)


@sfx('battle.heal', 'battle', -19, 'Cura: gli HP risalgono.')
def _():
    m = Mix()
    m.add(0, melody([('E6', 1), ('G#6', 1), ('B6', 1), ('E7', 1), ('B6', 1), ('E7', 1), ('G#7', 4)], 0.055, 'pulse', 0.125, decay=0.09), 0.35)
    m.add(0, tri(hz('E5'), 0.7) * env_bell(0.7, 0.25), 0.5)
    m.add(0, tri(hz('B5'), 0.7) * env_bell(0.7, 0.35), 0.3)
    m.add(0.1, crackle(0.55, 40, 'twinkle', hpf=6000), 0.25)
    return echo(m.out(), 0.11, 0.3, 3, 6000)


# --- Stati alterati ---------------------------------------------------------
@sfx('status.paralysis', 'battle', -19, 'Paralisi.')
def _():
    m = Mix()
    buzz = am(pulse(hz('E3'), 0.6, 0.5), 28, 1.0, 'square')
    m.add(0, lp(buzz, 3500) * env_exp(0.6, 0.25), 0.5)
    m.add(0, zap(0.35, 900, 3200, 'para', 0.006) * env_exp(0.35, 0.1), 0.25)
    m.add(0, crackle(0.5, 70, 'parc'), 0.45)
    return m.out()


@sfx('status.sleep', 'battle', -20, 'Sonno.')
def _():
    m = Mix()
    m.add(0, melody([('B5', 2), ('G#5', 2), ('E5', 2), ('B4', 5)], 0.1, 'tri', vib=0.25, sustain=0.75), 0.6)
    m.add(0, melody([('E5', 2), ('B4', 2), ('G#4', 2), ('E4', 5)], 0.1, 'pulse', 0.125, decay=0.15), 0.12)
    return echo(m.out(), 0.15, 0.35, 3, 3000)


@sfx('status.confusion', 'battle', -19, 'Confusione.')
def _():
    m = Mix()
    f = vibrato(np.concatenate([sweep(500, 900, 0.2), sweep(900, 400, 0.2), sweep(400, 1100, 0.2), sweep(1100, 600, 0.2)]), 0.8, 13, 1.5)
    m.add(0, pulse(f, 0.8, 0.25) * env_adsr(0.8, 0.01, 0.1, 0.7, 0.2), 0.35)
    m.add(0, tri(f * 0.5, 0.8) * env_adsr(0.8, 0.01, 0.1, 0.7, 0.2), 0.35)
    return echo(m.out(), 0.1, 0.3, 2)


@sfx('status.poison', 'battle', -19, 'Avvelenamento.')
def _():
    m = Mix()
    m.add(0, bubbles(0.55, 9, 'poison', 180, 520), 0.8)
    m.add(0, melody([('E4', 2), ('F4', 2), ('E4', 2), ('D#4', 4)], 0.06, 'pulse', 0.5, decay=0.08), 0.35)
    m.add(0, lp(saw(55, 0.55) + saw(55.8, 0.55), 400) * env_exp(0.55, 0.25), 0.3)
    return m.out()


@sfx('status.tick', 'battle', -21, 'Danno da veleno a fine turno.')
def _():
    m = Mix()
    m.add(0, bubbles(0.2, 3, 'ptick', 200, 450), 0.8)
    m.add(0, melody([('F4', 1), ('E4', 2)], 0.06, 'pulse', 0.5, decay=0.05), 0.35)
    return m.out()


@sfx('status.cure', 'battle', -19, 'Stato alterato curato.')
def _():
    m = Mix()
    m.add(0, whoosh(0.4, 1500, 7000, 'cure', q=1.4, peak=0.7), 0.4)
    m.add(0, melody([('B5', 1), ('D#6', 1), ('F#6', 1), ('B6', 1), ('E7', 3)], 0.045, 'pulse', 0.125, decay=0.07), 0.4)
    return echo(m.out(), 0.09, 0.3, 2, 6000)


@sfx('status.shield', 'battle', -19, 'Immunità agli stati: barriera.')
def _():
    m = Mix()
    for i, n in enumerate(['E5', 'B5', 'E6', 'G#6']):
        m.add(i * 0.06, pulse(vibrato(hz(n), 0.6, 7, 0.15), 0.6, 0.125) * env_exp(0.6, 0.25), 0.22)
    m.add(0, tri(hz('E4'), 0.7) * env_bell(0.7, 0.2), 0.45)
    m.add(0.04, svf(noise(0.6, 'shield'), 5200, 6) * env_bell(0.6, 0.2) * 3, 0.25)
    return echo(m.out(), 0.12, 0.3, 3)


# --- Cattura ---------------------------------------------------------------
@sfx('capture.throw', 'battle', -20, 'Il Sacchettino viene lanciato.')
def _():
    m = Mix()
    m.add(0, whoosh(0.5, 500, 2600, 'throw', q=1.1, peak=0.55), 0.8)
    m.add(0, pulse(sweep(320, 980, 0.3), 0.3, 0.25) * env_exp(0.3, 0.12), 0.22)
    return m.out()


@sfx('capture.absorb', 'battle', -18, 'Il Sacchettino si apre e assorbe l\'Arkamon.')
def _():
    m = Mix()
    m.add(0, sine(sweep(200, 800, 0.025), 0.025) * env_exp(0.025, 0.02), 0.9)
    m.add(0.02, pulse(sweep(1600, 180, 0.34, 0.6), 0.34, 0.25) * env_adsr(0.34, 0.004, 0.06, 0.7, 0.08), 0.35)
    m.add(0.02, reverse(whoosh(0.34, 800, 5000, 'absorb', q=1.0, peak=0.2)), 0.6)
    return m.out()


@sfx('capture.settle', 'battle', -20, 'Il Sacchettino cade a terra.')
def _():
    m = Mix()
    m.add(0, thump(300, 85, 0.12), 0.9)
    m.add(0.13, thump(260, 90, 0.08), 0.45)
    m.add(0.2, thump(240, 95, 0.05), 0.2)
    return m.out()


@sfx('capture.shake', 'battle', -20, 'Il Sacchettino oscilla.')
def _():
    m = Mix()
    m.add(0, hp(noise(0.015, 'sh1'), 2000) * env_exp(0.015, 0.004), 0.8)
    m.add(0, tri(sweep(420, 300, 0.07), 0.07) * env_exp(0.07, 0.03), 0.6)
    m.add(0.09, hp(noise(0.015, 'sh2'), 2200) * env_exp(0.015, 0.004), 0.6)
    m.add(0.09, tri(sweep(380, 280, 0.07), 0.07) * env_exp(0.07, 0.03), 0.45)
    return m.out()


@sfx('capture.escape', 'battle', -18, 'L\'Arkamon esce dal Sacchettino.')
def _():
    m = Mix()
    m.add(0, burst(0.12, 'esc', hpf=600, decay=0.03), 0.8)
    m.add(0, sine(sweep(260, 1100, 0.04), 0.04) * env_exp(0.04, 0.02), 0.7)
    m.add(0.05, pulse(sweep(900, 180, 0.4), 0.4, 0.5) * env_exp(0.4, 0.16), 0.3)
    return m.out()


@sfx('capture.caught', 'battle', -17, 'Cattura riuscita: scatto e fanfara.')
def _():
    return jingle_capture()


# --- Jingle -----------------------------------------------------------------
@sfx('jingle.victory', 'jingle', -17, 'Vittoria.')
def _():
    return jingle_victory()


@sfx('jingle.defeat', 'jingle', -19, 'Sconfitta.')
def _():
    return jingle_defeat()


@sfx('jingle.levelup', 'jingle', -18, 'Salita di livello.')
def _():
    return jingle_levelup()


@sfx('jingle.evolution', 'jingle', -17, 'Evoluzione completata.')
def _():
    return jingle_evolution()


@sfx('jingle.medal', 'jingle', -17, 'Medaglia ottenuta.')
def _():
    return jingle_medal()


@sfx('jingle.item', 'jingle', -18, 'Oggetto ricevuto.')
def _():
    return jingle_item()


@sfx('jingle.heal', 'jingle', -19, 'Squadra curata fuori dalla battaglia.')
def _():
    return jingle_heal_center()


@sfx('jingle.starter', 'jingle', -18, 'Scelta dello starter nel Laboratorio.')
def _():
    m = Mix()
    m.add(0, sine(sweep(220, 900, 0.05), 0.05) * env_exp(0.05, 0.03), 0.8)
    m.add(0.04, crackle(0.5, 50, 'capsule', hpf=5000), 0.4)
    m.add(0.08, band(0.075, [('E5', 1), ('G#5', 1), ('B5', 1), ('E6', 2), ('B5', 1), ('E6', 1), ('G#6', 6)],
                     [('B4', 1), ('E5', 1), ('G#5', 1), ('B5', 2), ('G#5', 1), ('B5', 1), ('E6', 6)],
                     [('E3', 5), ('B2', 2), ('E3', 6)], [('h', 0), ('h', 2), ('k', 5), ('c', 7)], tail=0.5), 1.0)
    return m.out()


# --- Evoluzione -------------------------------------------------------------
@sfx('evolution.charge', 'jingle', -18, 'Evoluzione: la luce cresce (3,2 s).')
def _():
    d = 3.2
    m = Mix()
    m.add(0, whoosh(d, 200, 5000, 'evo', q=1.8, peak=0.96), 0.45)
    f = sweep(110, 880, d, 1.3)
    pulse_rate = sweep(3, 14, d)
    ph = np.cumsum(pulse_rate) / SR
    throb = (np.sin(2 * np.pi * ph) > 0.2).astype(float)
    m.add(0, lp(pulse(f, d, 0.25) * throb, 6000) * env_rise(d, 1.2), 0.32)
    m.add(0, tri(f * 0.5, d) * env_rise(d, 1.0), 0.35)
    m.add(d - 0.06, burst(0.2, 'evoflash', decay=0.05), 0.6)
    return m.out()


# --- Mosse per elemento e potenza ------------------------------------------
for _el, _fn in ELEMENTS.items():
    for _k, _tier in enumerate(TIERS):
        def _make(fn=_fn, k=_k, el=_el):
            return lambda: fn(k, f'{el}-{k}')
        CATALOG[f'move.{_el}.{_tier}'] = (_make(), 'move', (-18, -16.5, -15)[_k], f'Mossa {_el}, potenza {_tier}.')


# ---------------------------------------------------------------------------
# Livelli, esportazione
# ---------------------------------------------------------------------------
def loudest_rms_db(x: np.ndarray, window: float = 0.3) -> float:
    w = min(len(x), ns(window))
    c = np.cumsum(np.concatenate([[0], x ** 2]))
    rms = np.sqrt((c[w:] - c[:-w]) / w)
    return 20 * math.log10(max(rms.max(), 1e-9))


def finish(x: np.ndarray, level_db: float) -> np.ndarray:
    x = np.nan_to_num(x.astype(float))
    x = hp(x, 25)  # niente continua
    x = lp(x, 12000)  # addolcisce l'aliasing delle onde a impulso più acute
    # Taglia la coda sotto -60 dB rispetto al picco, poi una breve dissolvenza.
    peak = np.abs(x).max() or 1.0
    above = np.where(np.abs(x) > peak * 10 ** (-60 / 20))[0]
    if len(above):
        x = x[:min(len(x), above[-1] + ns(0.02))]
    x = x * 10 ** ((level_db - loudest_rms_db(x)) / 20)
    # Limitatore morbido: nessun picco oltre -1 dBFS.
    ceiling = 10 ** (-1 / 20)
    if np.abs(x).max() > ceiling * 0.8:
        x = np.tanh(x / ceiling) * ceiling
    return fade(x, 0.001, 0.015)


def export_ogg(x: np.ndarray, dest: Path, wav_dir: Path | None) -> None:
    pcm = np.clip(x, -1, 1)
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
        wavfile.write(tmp.name, SR, (pcm * 32767).astype(np.int16))
        wav_path = tmp.name
    try:
        dest.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav_path, '-c:a', 'libvorbis', '-q:a', '5',
                        '-map_metadata', '-1', str(dest)], check=True)
        if wav_dir:
            wav_dir.mkdir(parents=True, exist_ok=True)
            Path(wav_path).replace(wav_dir / (dest.stem + '.wav'))
    finally:
        if os.path.exists(wav_path):
            os.unlink(wav_path)


def file_name(sid: str) -> str:
    return sid.replace('.', '-') + '.ogg'


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--out', default=str(ROOT / 'public/audio/sfx'))
    parser.add_argument('--manifest', default=str(ROOT / 'src/data/audio-sfx.json'))
    parser.add_argument('--wav', default=None, help='Cartella dove salvare anche i WAV')
    parser.add_argument('--only', default=None, help='Prefisso degli id da rigenerare')
    args = parser.parse_args()
    out = Path(args.out)
    wav_dir = Path(args.wav) if args.wav else None
    manifest_path = Path(args.manifest)
    previous = json.loads(manifest_path.read_text()) if manifest_path.exists() else {'sounds': {}}
    sounds = dict(previous.get('sounds', {})) if args.only else {}
    for sid, (fn, category, level, note) in CATALOG.items():
        if args.only and not sid.startswith(args.only):
            continue
        x = finish(fn(), level)
        export_ogg(x, out / file_name(sid), wav_dir)
        sounds[sid] = {'file': 'audio/sfx/' + file_name(sid), 'category': category,
                       'durationMs': int(round(len(x) / SR * 1000)), 'description': note}
        print(f'{sid:28s} {len(x) / SR:5.2f}s  {category}', flush=True)
    ordered = {sid: sounds[sid] for sid in CATALOG if sid in sounds}
    manifest = {'version': 1, 'generator': 'scripts/audio/generate-sfx.py', 'sampleRate': SR, 'sounds': ordered}
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print(f'{len(ordered)} effetti in {out}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
