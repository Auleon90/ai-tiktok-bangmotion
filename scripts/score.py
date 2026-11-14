#!/usr/bin/env python3
"""Original background score + timed sound effects from the storyboard timings.

Run with the audio venv:  .venv-audio/bin/python scripts/score.py <props.json> <out_dir> [mood|none] [sfx:on|off]
Writes <out_dir>/music.wav and <out_dir>/sfx.wav (stereo, 48 kHz, unmastered; produce.py ducks + masters).

Music is synthesised (no sample downloads): physical-model plucks from audio/lemo/pluck.py plus a numpy pad,
on a chord loop chosen by mood. Sound effects come from audio/lemo/sfx.py, placed on scene cuts and on
scene-type events (title hit, counter ticks, map pulse, final chord).

Moods: warm, epic, tense, calm, playful, sacred (no melodic instruments: drone + soft pulse, for religious content)
"""
import json, os, sys

import numpy as np
import soundfile as sf

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "audio", "lemo"))
import sfx as X  # noqa: E402
import pluck as P  # noqa: E402

SR = X.SR
NOTE = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def m(name):  # 'A3' -> midi
    n, o = name[:-1], int(name[-1])
    v = NOTE[n[0]] + (1 if "#" in n else -1 if n.endswith("b") else 0)
    return 12 * (o + 1) + v


MOODS = {
    #            bpm  root  scale  progression (scale degrees)     lead             bass                 pad
    "warm":    dict(bpm=84, root="D3", minor=False, prog=[0, 4, 5, 3], lead="harp", bass="upright_bass_pizz", pad=0.10, arp=[0, 2, 4, 7, 4, 2]),
    "epic":    dict(bpm=72, root="D3", minor=True, prog=[0, 5, 2, 6], lead="harp", bass="upright_bass_pizz", pad=0.16, arp=[0, 4, 7, 12], drum=True),
    "tense":   dict(bpm=96, root="E3", minor=True, prog=[0, 0, 5, 4], lead="pipa", bass="upright_bass_pizz", pad=0.12, arp=[0, 3, 0, 7], pulse=True),
    "calm":    dict(bpm=68, root="F3", minor=False, prog=[0, 3, 5, 4], lead="music_box", bass=None, pad=0.12, arp=[7, 4, 9, 4]),
    "playful": dict(bpm=108, root="G3", minor=False, prog=[0, 3, 4, 0], lead="kalimba", bass="upright_bass_pizz", pad=0.05, arp=[0, 4, 7, 4, 9, 7]),
    "sacred":  dict(bpm=60, root="D3", minor=True, prog=[0, 0, 5, 5], lead=None, bass=None, pad=0.18, arp=[]),
}
MAJ = [0, 2, 4, 5, 7, 9, 11]
MIN = [0, 2, 3, 5, 7, 8, 10]


def chord(root_m, degree, minor):
    sc = MIN if minor else MAJ
    return [root_m + sc[(degree + k) % 7] + 12 * ((degree + k) // 7) for k in (0, 2, 4)]


def pad_tone(midis, dur, gain):
    t = np.arange(int(dur * SR)) / SR
    x = np.zeros_like(t)
    for mm in midis:
        f = 440 * 2 ** ((mm - 69) / 12)
        for det in (-0.12, 0.0, 0.12):  # detuned saw-ish via 3 harmonics
            ff = f * 2 ** (det / 12)
            x += np.sin(2 * np.pi * ff * t) + 0.3 * np.sin(4 * np.pi * ff * t) + 0.12 * np.sin(6 * np.pi * ff * t)
    x = X.lp(x, 1400)
    a = min(0.8, dur / 3)
    env = np.minimum(1, np.minimum(t / a, (dur - t) / a))
    return X.norm(x * env, gain)


def place(buf, x, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= len(buf) or x is None or len(x) == 0:
        return
    x = np.asarray(x, dtype=np.float32)
    if x.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        x = np.stack([x * l, x * r], 1)
    n = min(len(x), len(buf) - i)
    buf[i:i + n] += x[:n] * gain


def music(total, cfg):
    buf = np.zeros((int((total + 3) * SR), 2), np.float32)
    beat = 60 / cfg["bpm"]
    bar = beat * 4
    root = m(cfg["root"])
    nbars = int(np.ceil(total / bar)) + 1
    for b in range(nbars):
        t0 = b * bar
        if t0 > total:
            break
        ch = chord(root, cfg["prog"][b % len(cfg["prog"])], cfg["minor"])
        place(buf, pad_tone([c + 12 for c in ch], bar + 0.6, 1.0), t0, cfg["pad"])
        if cfg.get("bass"):
            for k in (0, 2):
                place(buf, P.pluck(cfg["bass"], ch[0] - 12, beat * 1.8, vel=0.75), t0 + k * beat, 0.5, -0.1)
        if cfg.get("lead") and b > 0 and cfg["arp"]:  # bar 0 = intro (pad only)
            step = bar / len(cfg["arp"])
            for i, off in enumerate(cfg["arp"]):
                note = ch[0] + 12 + off
                vel = 0.55 + 0.25 * (i == 0)
                place(buf, P.pluck(cfg["lead"], note, step * 3, vel=vel), t0 + i * step, 0.28, 0.25 if i % 2 else -0.25)
        if cfg.get("drum") and b > 0:
            place(buf, X.thump(0.9, 55), t0, 0.5)
            place(buf, X.thump(0.6, 70), t0 + 2.5 * beat, 0.35)
        if cfg.get("pulse"):
            for k in range(4):
                place(buf, X.heartbeat(0.6) if k % 2 == 0 else None, t0 + k * beat, 0.35)
    # end: let the final chord ring, fade the tail
    end = int(total * SR)
    fade = np.linspace(1, 0, len(buf) - end)[:, None]
    buf[end:] *= fade
    return buf[: end + int(1.5 * SR)]


def effects(total, scenes):
    buf = np.zeros((int((total + 2) * SR), 2), np.float32)
    for i, s in enumerate(scenes):
        a = s["startMs"] / 1000
        d = s["durationMs"] / 1000
        if i > 0:
            place(buf, X.whoosh(0.45, 1.0), max(0, a - 0.25), 0.35, 0.2 if i % 2 else -0.2)
        t = s.get("type")
        if t == "title":
            place(buf, X.thump(1.0, 48), a + 0.15, 0.6)
            place(buf, X.rumble(1.6, 0.7), a + 0.15, 0.25)
        elif t == "counter":
            for k, _ in enumerate(s.get("items", [])):
                st = a + 0.2 + k * 0.5
                for j in range(8):
                    place(buf, X.click(1.4 + j * 0.05, 0.5), st + j * 0.17 * (1 + j * 0.08), 0.18)
                place(buf, X.ding(0.8), st + 1.5, 0.3)
        elif t == "map":
            if s.get("pulse"):
                place(buf, X.thump(0.9, 60), a + s["pulse"].get("atFrac", 0.4) * d, 0.45)
            for ar in s.get("arrows", []):
                place(buf, X.whoosh(0.9, 0.8), a + ar.get("at", 0.25) * d, 0.3)
        elif t in ("quote", "ayat"):
            place(buf, X.ding(0.6), a + 0.3, 0.18)
        elif t == "headline":
            place(buf, X.pop(0.8), a + 0.3, 0.25)
        for fx in s.get("lottie", []):
            if fx.get("name", "").startswith("burst"):
                place(buf, X.pop(1.0), a + fx.get("at", 0) * d, 0.3)
    last = scenes[-1]
    place(buf, X.ding(0.9), last["startMs"] / 1000 + 0.4, 0.22)
    return buf[: int(total * SR)]


def main():
    props_path, out_dir = sys.argv[1], sys.argv[2]
    mood = sys.argv[3] if len(sys.argv) > 3 else "warm"
    use_sfx = (sys.argv[4] if len(sys.argv) > 4 else "sfx:on") != "sfx:off"
    p = json.load(open(props_path))
    total = p["totalMs"] / 1000
    os.makedirs(out_dir, exist_ok=True)
    if mood != "none":
        cfg = MOODS.get(mood, MOODS["warm"])
        sf.write(os.path.join(out_dir, "music.wav"), np.clip(music(total, cfg), -1, 1), SR)
    if use_sfx:
        sf.write(os.path.join(out_dir, "sfx.wav"), np.clip(effects(total, p["scenes"]), -1, 1), SR)
    print(f"OK  score mood={mood} sfx={'on' if use_sfx else 'off'} {total:.1f}s")


if __name__ == "__main__":
    main()
