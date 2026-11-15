"""Named sound effects for storyboard scenes: "sfx": [{"name": "explosion", "at": 0.3, "gain": 1.0}].

Every effect is synthesised (numpy, from audio/lemo/sfx.py primitives); some add a real CC0 percussion sample
(gran cassa, gong, cymbal, bells…) when Lemo's sampler is available. Each function returns mono float32 at sfx.SR.
Preview: .venv-audio/bin/python scripts/score.py preview <name|all> [out_dir]
"""
import numpy as np

import sfx as X

SR = X.SR
_r = np.random.default_rng(7)
S = None  # set by score.py when the sampler is available


def _t(d): return np.arange(int(d * SR)) / SR
def _n(d): return _r.standard_normal(int(d * SR))
def _env(d, tau): return np.exp(-_t(d) / tau)


def _mix(*parts):
    n = max(len(p[1]) + int(p[0] * SR) for p in parts)
    out = np.zeros(n)
    for at, x, g in parts:
        i = int(at * SR); out[i:i + len(x)] += np.asarray(x, float) * g
    return X.norm(out, 0.95)


def _hit(inst, var=None, vel=.8, pitch=None, dur=None):
    if S is None: return np.zeros(1)
    try:
        x = S.note(inst, pitch, dur or 2.0, vel=vel) if pitch is not None else S.hit(inst, var, vel)
        x = np.asarray(x, float)[: int((dur or 3.0) * SR)]
        return _fade(x, 0, min(.8, len(x) / SR / 3)) if len(x) > SR // 10 else x
    except Exception:  # noqa: BLE001
        return np.zeros(1)


def _fade(x, a=.005, b=.05):
    x = x.copy(); ia, ib = int(a * SR), int(b * SR)
    if ia: x[:ia] *= np.linspace(0, 1, ia)
    if ib: x[-ib:] *= np.linspace(1, 0, ib)
    return x


# ---------- impacts & destruction ----------
def explosion(v=1.0):
    d = 3.5; t = _t(d)
    sub = np.sin(2 * np.pi * (38 * t - 6 * t ** 2)) * _env(d, .55)
    blast = X.lp(_n(d), 900) * _env(d, .25)
    crack = X.hp(_n(.12), 1500) * _env(.12, .02)
    tail = X.lp(X.brown(d), 250) * np.minimum(1, t / .15) * _env(d, 1.1)
    debris = np.zeros(int(d * SR))
    for _ in range(25):
        c = X.clack(.5 + _r.random() * .8, .2 + _r.random() * .4); s = int((.3 + _r.random() ** 1.5 * 2.2) * SR)
        debris[s:s + len(c)] += c[:len(debris) - s]
    return _fade(_mix((0, sub, 1.0), (0, blast, .8), (0, crack, .6), (0, tail, .9), (0, debris, .25),
                      (0, _hit("gran_cassa", vel=1), .7), (0.02, _hit("sus_cymbal", vel=.9), .25))) * v


def boom(v=1.0):  # cinematic low hit for reveals
    d = 2.5; t = _t(d)
    return _fade(_mix((0, np.sin(2 * np.pi * (45 * t - 5 * t ** 2)) * _env(d, .6), 1), (0, X.lp(_n(d), 300) * _env(d, .15), .5),
                      (0, _hit("timpani", 0, vel=1), .6))) * v


def impact(v=1.0):  # punch / hit
    d = .4; t = _t(d)
    return _fade(_mix((0, np.sin(2 * np.pi * 90 * t * (1 - .5 * t)) * _env(d, .06), 1), (0, X.hp(_n(d), 800) * _env(d, .015), .7))) * v


def glass_break(v=1.0):
    d = 1.6; out = np.zeros(int(d * SR))
    for _ in range(40):
        f = 2500 + _r.random() * 6000; dd = .05 + _r.random() * .25; tt = _t(dd)
        s = int(_r.random() ** 2 * 1.0 * SR); g = np.sin(2 * np.pi * f * tt) * np.exp(-tt / (dd / 4)) * (.3 + _r.random() * .7)
        out[s:s + len(g)] += g[:len(out) - s]
    out[:int(.08 * SR)] += X.hp(_n(.08), 2000) * _env(.08, .015) * 2
    return _fade(X.norm(out, .95)) * v


def gunshot(v=1.0):
    d = 1.2; t = _t(d)
    return _fade(_mix((0, X.hp(_n(.02), 500) * 3, 1), (0, X.lp(_n(d), 1500) * _env(d, .05), 1),
                      (0, np.sin(2 * np.pi * 70 * t) * _env(d, .08), .6), (.03, X.lp(_n(d), 500) * _env(d, .35), .35))) * v


def sword_clash(v=1.0):
    d = 1.4; t = _t(d)
    ring = sum(a * np.sin(2 * np.pi * f * t) * _env(d, tau) for f, a, tau in [(2380, 1, .5), (3710, .6, .3), (5120, .4, .2), (1690, .4, .6)])
    return _fade(_mix((0, X.hp(_n(.05), 2500) * _env(.05, .008), 1.2), (0, ring, .6))) * v


# ---------- nature ----------
def thunder(v=1.0):
    d = 4.0; t = _t(d)
    crack = X.hp(_n(.3), 1000) * _env(.3, .06)
    roll = X.lp(X.brown(d), 180) * (np.minimum(1, t / .2)) * _env(d, 1.4) * (1 + .5 * np.sin(2 * np.pi * 1.3 * t))
    return _fade(_mix((0, crack, .7), (.05, roll, 1), (.05, X.lp(_n(d), 700) * _env(d, .6), .3))) * v


def rain(v=1.0, d=4.0):
    t = _t(d); bed = X.bp(_n(d), 800, 6000) * .4
    drops = np.zeros(len(t))
    for _ in range(int(d * 120)):
        s = int(_r.random() * (len(t) - 600)); f = 2000 + _r.random() * 4000; dd = _t(.012)
        drops[s:s + len(dd)] += np.sin(2 * np.pi * f * dd) * np.exp(-dd / .003) * _r.random()
    return _fade(X.norm(bed + drops, .7), .6, .8) * v


def wind(v=1.0, d=4.0):
    t = _t(d); out = np.zeros(len(t)); n = _n(d)
    for i in range(0, len(t), 960):
        f = 300 + 500 * (1 + np.sin(2 * np.pi * .4 * i / SR + 1)) ; seg = X.bp(n[max(0, i - 4000):i + 960], f * .6, f * 1.4)[-min(960, len(t) - i):]
        out[i:i + len(seg)] = seg
    return _fade(X.norm(out, .7), 1, 1) * v


def fire(v=1.0, d=3.0):
    t = _t(d); bed = X.lp(X.brown(d), 500) * .6
    cr = np.zeros(len(t))
    for _ in range(int(d * 40)):
        s = int(_r.random() * (len(t) - 400)); c = X.hp(_n(.008), 2500) * _r.random(); cr[s:s + len(c)] += c
    return _fade(X.norm(bed + cr, .8), .4, .6) * v


def splash(v=1.0):
    d = 1.2; t = _t(d)
    body = X.bp(_n(d), 300, 3000) * _env(d, .18)
    bub = np.zeros(len(t))
    for _ in range(18):
        f0 = 600 + _r.random() * 1200; dd = .06; tt = _t(dd); s = int((.1 + _r.random() * .7) * SR)
        b = np.sin(2 * np.pi * np.cumsum(f0 * (1 + 2 * tt / dd)) / SR) * np.exp(-tt / .02); bub[s:s + len(b)] += b[:len(bub) - s] * .4
    return _fade(_mix((0, X.lp(_n(.05), 400) * 2, .8), (0, body, 1), (0, bub, .5))) * v


def earthquake(v=1.0):
    d = 4.0; t = _t(d)
    return _fade(_mix((0, X.lp(X.brown(d), 90) * np.sin(np.pi * t / d), 1), (0, X.crash(.6), .3), (1.2, X.crash(.5), .25)), .3, .8) * v


# ---------- objects & everyday ----------
def door_creak(v=1.0):
    return _fade(_mix(*[(i * .18, X.creak(1), 1) for i in range(5)], (1.0, X.thump(.6, 90), .6))) * v


def footsteps(v=1.0, n=6):
    return _mix(*[(i * .45, X.thump(.6, 110) * .6 + np.pad(X.step(.5), (0, int(.3 * SR)))[:int(.35 * SR)], 1) for i in range(n)]) * v


def clock_tick(v=1.0, n=6):
    return _mix(*[(i * .5, X.click(1.6 if i % 2 else 1.3, 1), 1) for i in range(n)]) * v


def typing(v=1.0, n=14):
    return _mix(*[(i * .09 + _r.random() * .04, X.clack(1.6 + _r.random() * .4, .5 + _r.random() * .5), 1) for i in range(n)]) * v


def camera(v=1.0):
    return _mix((0, X.click(1.1, 1), 1), (.06, X.hp(_n(.08), 1500) * _env(.08, .02), .5), (.12, X.click(.9, .8), 1)) * v


def coin(v=1.0):
    d = .8; t = _t(d)
    a = sum(np.sin(2 * np.pi * f * t) * _env(d, .25) for f in (1975, 2637))
    b = np.pad(sum(np.sin(2 * np.pi * f * t) * _env(d, .3) for f in (2637, 3520)), (int(.08 * SR), 0))[:len(t)]
    return _fade(X.norm(a + b, .9)) * v


def bell(v=1.0):
    x = _hit("tubular_bells", pitch=67, dur=3, vel=.8)
    if len(x) > 1: return _fade(X.norm(x, .9)) * v
    d = 3.0; t = _t(d)
    return _fade(X.norm(sum(a * np.sin(2 * np.pi * f * t) * _env(d, tau) for f, a, tau in [(392, 1, 1.4), (784, .5, .9), (1046, .4, .6), (1568, .3, .4)]), .9)) * v


def gong(v=1.0):
    x = _hit("gong", vel=.9, dur=5.0)
    return (_fade(X.norm(x, .9)) if len(x) > 1 else boom(1)) * v


def heartbeat(v=1.0, n=3):
    return _mix(*[(i * .85, X.heartbeat(1), 1) for i in range(n)]) * v


# ---------- transitions / UI ----------
def riser(v=1.0, d=2.0):
    t = _t(d); f = 200 * 2 ** (3 * t / d)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * .3
    hiss = X.hp(_n(d), 2000) * (t / d) ** 2
    return _fade(X.norm((tone + hiss) * (t / d) ** 1.5, .9), .01, .02) * v


def magic(v=1.0):
    d = 1.6; out = np.zeros(int(d * SR))
    for i in range(14):
        f = 1500 + i * 180 + _r.random() * 300; dd = .5; tt = _t(dd); s = int(i * .06 * SR)
        g = np.sin(2 * np.pi * f * tt) * np.exp(-tt / .15) * .5; out[s:s + len(g)] += g[:len(out) - s]
    return _fade(X.norm(out, .9)) * v


def swoosh(v=1.0):
    return X.whoosh(.6, 1) * v


def ding(v=1.0):
    return X.ding(1) * v


def pop(v=1.0):
    return X.pop(1) * v


LIB = {k: f for k, f in dict(globals()).items() if callable(f) and not k.startswith("_") and k not in ("X",) and f.__module__ == __name__}
