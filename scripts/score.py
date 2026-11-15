#!/usr/bin/env python3
"""Original background score + timed sound effects from the storyboard timings.

Run with the audio venv:  .venv-audio/bin/python scripts/score.py <timing.json> <out_dir> [mood|none] [sfx:on|off]
Writes <out_dir>/music.wav and <out_dir>/sfx.wav (stereo, 48 kHz, unmastered; produce.py ducks + masters).

The score is different for every video:
- a seed from the title (or the storyboard's "music_seed") picks key, tempo, chord progression, arpeggio patterns
  and the instrument palette from the mood's options;
- the Lemo style (if any) steers the palette toward that style's sound (e.g. engraving -> harpsichord + strings);
- the storyboard may force instruments: "instruments": {"lead": "marimba", "pad": "violas", "bass": "contrabass_pizz", "perc": "shaker"};
- the arrangement follows the scenes: thin intro, fuller middle, a peak around two thirds, thinning outro, final tonic chord.

Instruments: real recorded samples (CC0: VSCO 2 CE, VCSL) through Lemo-Opuscar's core/audio/sampler.py, downloaded by
scripts/setup.sh into .lemo/ (not committed). Without them the score falls back to the physical-model plucks in
audio/lemo/pluck.py with the same seeded variation.

Moods: warm, epic, tense, calm, playful, sacred (no melody: drone + soft pulse, for religious content)
"""
import hashlib, json, os, sys

import numpy as np
import soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "audio", "lemo"))
import sfx as X  # noqa: E402
import pluck as P  # noqa: E402

SR = X.SR
S = None  # Lemo sampler, if available
try:
    sys.path.insert(0, os.path.join(ROOT, ".lemo", "lemo-opuscar"))
    from core.audio import sampler as _S  # noqa: E402
    if all(_S._have(l) for l in ("vcsl", "vsco2ce")) and _S.SR == SR:
        S = _S
except Exception as e:  # noqa: BLE001
    print(f"  (sampler unavailable, using synth plucks: {e})")

MAJ = [0, 2, 4, 5, 7, 9, 11]
MIN = [0, 2, 3, 5, 7, 8, 10]
KEYS = {"C": 48, "C#": 49, "D": 50, "Eb": 51, "E": 52, "F": 53, "F#": 54, "G": 55, "Ab": 56, "A": 45, "Bb": 46, "B": 47}

# Each mood: tempo range, scale, progressions (scale degrees), arp patterns (semitones over the chord root),
# palettes (sampled instruments) and a synth fallback lead (pluck.py preset).
MOODS = {
    "warm": dict(bpm=(76, 92), minor=False, keys=["C", "D", "F", "G", "A", "Bb"],
                 prog=[[0, 4, 5, 3], [0, 5, 3, 4], [0, 3, 0, 4], [5, 3, 0, 4], [0, 2, 3, 4]],
                 arp=[[0, 4, 7, 12, 7, 4], [0, 7, 12, 16], [0, 4, 7, 4], [12, 7, 4, 7, 0, 7]],
                 pal=[dict(lead="harp", pad="violas", bass="contrabass_pizz"),
                      dict(lead="upright", pad="cellos", bass="contrabass_pizz"),
                      dict(lead="vibraphone", pad="organ_soft", bass="cellos_pizz"),
                      dict(lead="strumstick", pad="violins", bass="contrabass_pizz", perc="shaker")],
                 synth="harp"),
    "epic": dict(bpm=(66, 80), minor=True, keys=["C", "D", "E", "F", "A"],
                 prog=[[0, 5, 2, 6], [0, 5, 3, 4], [0, 6, 5, 4], [5, 6, 0, 0], [0, 3, 5, 4]],
                 arp=[[0, 7, 12, 7], [0, 12, 7, 12], [0, 3, 7, 12, 7, 3]],
                 pal=[dict(lead="horn", pad="cellos", bass="contrabass", perc="timpani"),
                      dict(lead="violins_spic", pad="violas", bass="contrabass", perc="gran_cassa"),
                      dict(lead="trumpet", pad="violins_trem", bass="tuba", perc="timpani"),
                      dict(lead="harp", pad="cellos", bass="contrabass", perc="toms")],
                 synth="harp", drum=True),
    "tense": dict(bpm=(88, 104), minor=True, keys=["C#", "D", "E", "F#", "G"],
                  prog=[[0, 0, 5, 4], [0, 1, 0, 5], [0, 5, 0, 6], [0, 0, 3, 4]],
                  arp=[[0, 3, 0, 7], [0, 1, 0, 6], [12, 0, 7, 0], [0, 3, 6, 3]],
                  pal=[dict(lead="violins_spic", pad="violins_trem", bass="contrabass_pizz", perc="woodblock"),
                       dict(lead="marimba", pad="vibraphone_bowed", bass="cellos_pizz", perc="frame_drum"),
                       dict(lead="dan_tranh", pad="cellos", bass="contrabass_pizz", perc="conga")],
                  synth="pipa", pulse=True),
    "calm": dict(bpm=(62, 74), minor=False, keys=["D", "E", "F", "G", "A", "Bb"],
                 prog=[[0, 3, 5, 4], [0, 5, 3, 4], [3, 0, 4, 5], [0, 2, 3, 0]],
                 arp=[[7, 4, 9, 4], [0, 7, 11, 14], [12, 7, 4, 7], [0, 4, 9, 7]],
                 pal=[dict(lead="vibraphone", pad="organ_soft"),
                      dict(lead="harp", pad="violas"),
                      dict(lead="glockenspiel", pad="vibraphone_bowed"),
                      dict(lead="upright", pad="cellos"),
                      dict(lead="hand_chimes", pad="violins")],
                 synth="music_box"),
    "playful": dict(bpm=(100, 120), minor=False, keys=["C", "D", "F", "G", "A", "Bb"],
                    prog=[[0, 3, 4, 0], [0, 5, 3, 4], [0, 4, 5, 3], [0, 1, 4, 0], [3, 4, 0, 0]],
                    arp=[[0, 4, 7, 4, 9, 7], [0, 7, 4, 12], [0, 4, 7, 9], [12, 7, 9, 4], [0, 0, 7, 4]],
                    pal=[dict(lead="marimba", pad="violins", bass="contrabass_pizz", perc="shaker"),
                         dict(lead="xylophone", pad="organ_soft", bass="tuba_stac", perc="woodblock"),
                         dict(lead="mbira", pad="violas", bass="cellos_pizz", perc="cajon"),
                         dict(lead="glockenspiel", pad="violins", bass="contrabass_pizz", perc="claps"),
                         dict(lead="clarinet_stac", pad="violas", bass="bassoon_stac", perc="tambourine")],
                    synth="kalimba"),
    "sacred": dict(bpm=(56, 64), minor=True, keys=["C", "D", "E", "F", "G", "A"],
                   prog=[[0, 0, 5, 5], [0, 0, 3, 3], [0, 5, 0, 3], [0, 0, 6, 6]],
                   arp=[], pal=[dict(pad="cellos"), dict(pad="organ_soft"), dict(pad="violas")], synth=None),
}

# Lemo style -> instrument hints (taken from each STYLE.md sound palette; only instruments we have samples for)
STYLE = {
    "engraving": dict(lead="harpsichord", pad="violas", bass="cellos_pizz"),
    "vintage-collage": dict(lead="harpsichord", pad="cellos"),
    "gilded-illumination": dict(lead="harp", pad="organ_soft"),
    "stained-glass": dict(lead="hand_chimes", pad="organ_soft"),
    "ink-wash": dict(lead="dan_tranh", pad="cellos", perc="frame_drum"),
    "ukiyoe": dict(lead="dan_tranh", pad="violas"),
    "papercut-red": dict(lead="dan_tranh", perc="woodblock"),
    "shadow-puppet": dict(lead="dan_tranh", perc="gong2"),
    "newsreel": dict(lead="upright", pad="violins", perc="snare2"),
    "silent-film": dict(lead="upright", pad="violins"),
    "rubber-hose": dict(lead="xylophone", bass="tuba_stac", perc="woodblock"),
    "risograph": dict(lead="marimba", perc="shaker"),
    "crayon-book": dict(lead="glockenspiel", pad="violas"),
    "crayon-world": dict(lead="glockenspiel"),
    "paper-popup": dict(lead="mbira"),
    "watercolor": dict(lead="harp", pad="violins"),
    "art-deco": dict(lead="vibraphone", bass="contrabass_pizz", perc="hihat"),
    "spy-titles": dict(lead="vibraphone", bass="contrabass_pizz", perc="hihat"),
    "chalkboard": dict(lead="marimba"),
    "dark-documentary": dict(lead="vibraphone_bowed", pad="cellos"),
    "microscope": dict(lead="glockenspiel", pad="vibraphone_bowed"),
}
SUSTAIN = {"violas", "violins", "cellos", "organ_soft", "vibraphone_bowed", "violins_trem", "contrabass", "tuba", "horn"}
SYNTH_LEADS = ["harp", "kalimba", "music_box", "pipa"]


def chord(root_m, degree, minor):
    sc = MIN if minor else MAJ
    return [root_m + sc[(degree + k) % 7] + 12 * ((degree + k) // 7) for k in (0, 2, 4)]


def pad_tone(midis, dur, gain):
    t = np.arange(int(dur * SR)) / SR
    x = np.zeros_like(t)
    for mm in midis:
        f = 440 * 2 ** ((mm - 69) / 12)
        for det in (-0.12, 0.0, 0.12):
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


# ---------- instruments (sampled when possible, synth otherwise) ----------
def inst_note(name, midi, dur, vel, synth_lead):
    if S is not None and name:
        try:
            return S.note(name, midi, dur, vel=vel, attack=0.35 if name in SUSTAIN else 0.0)
        except Exception:  # noqa: BLE001
            pass
    preset = synth_lead if synth_lead else "harp"
    return P.pluck(preset, midi, max(dur, 0.4) * 1.5, vel=vel)


def perc_hit(name, vel):
    if S is not None and name:
        try:
            return S.hit(name, None, vel)
        except Exception:  # noqa: BLE001
            pass
    return X.click(1.2, 0.5)


def plan(cfg, seed, style, force):
    rng = np.random.default_rng(seed)
    pick = lambda xs: xs[int(rng.integers(len(xs)))]
    key = pick(cfg["keys"])
    pal = dict(pick(cfg["pal"]))
    pal.update({k: v for k, v in STYLE.get(style or "", {}).items() if not (cfg is MOODS["sacred"] and k != "pad")})
    pal.update(force or {})
    return dict(
        root=KEYS[key], key=key, minor=cfg["minor"],
        bpm=float(rng.uniform(*cfg["bpm"])),
        prog=pick(cfg["prog"]),
        arps=[pick(cfg["arp"]) for _ in range(12)] if cfg["arp"] else [],
        pal=pal, synth=cfg["synth"] if S is None else cfg["synth"],
        swing=float(rng.uniform(0, 0.08)) if cfg is MOODS["playful"] else 0.0,
        rng=rng,
    )


def intensity(t, scenes, total):
    """0 = intro, 1 = verse, 2 = full, 3 = peak, 0.5 = outro — follows the storyboard scenes"""
    n = len(scenes)
    idx = 0
    for i, s in enumerate(scenes):
        if t >= s["startMs"] / 1000 - 0.05:
            idx = i
    if idx == 0:
        return 0
    if idx == n - 1:
        return 0.5
    peak = max(1, round(n * 0.66) - 1)
    if idx == peak or scenes[idx].get("type") == "counter" and idx >= n // 2:
        return 3
    return 1 if idx < n // 3 else 2


def music(total, cfg, pl, scenes):
    buf = np.zeros((int((total + 4) * SR), 2), np.float32)
    beat = 60 / pl["bpm"]
    bar = beat * 4
    root, pal = pl["root"], pl["pal"]
    rng = pl["rng"]
    nbars = int(np.ceil(total / bar))
    scene_of = lambda t: max([i for i, s in enumerate(scenes) if t >= s["startMs"] / 1000 - 0.05] or [0])
    for b in range(nbars):
        t0 = b * bar
        if t0 >= total - 0.5:
            break
        lvl = intensity(t0, scenes, total)
        last_bar = t0 + bar >= total - 0.5
        deg = 0 if last_bar else pl["prog"][b % len(pl["prog"])]
        ch = chord(root, deg, pl["minor"])
        # pad (sustained chord, voiced an octave up)
        pad_gain = 0.10 + 0.04 * lvl
        if S is not None and pal.get("pad"):
            for k, c in enumerate(ch):
                place(buf, inst_note(pal["pad"], c + 12, bar + 0.3, 0.45 + 0.1 * min(lvl, 2), None), t0, pad_gain * 1.6, (-0.3, 0, 0.3)[k])
        else:
            place(buf, pad_tone([c + 12 for c in ch], bar + 0.6, 1.0), t0, pad_gain)
        if cfg is MOODS["sacred"]:  # drone + soft pulse only
            place(buf, X.thump(0.4, 50), t0, 0.12)
            continue
        # bass
        if pal.get("bass") and lvl >= 1:
            hits = (0, 2) if lvl < 2 else (0, 1.5, 2, 3)
            for k in hits:
                place(buf, inst_note(pal["bass"], ch[0] - 12, beat * 1.6, 0.7, "upright_bass_pizz"), t0 + k * beat, 0.45, -0.1)
        # lead arpeggio — pattern changes per scene, sparse in the intro/outro, doubled at the peak
        lead = pal.get("lead")
        if pl["arps"] and (lead or pl["synth"]):
            arp = pl["arps"][scene_of(t0) % len(pl["arps"])]
            step = bar / len(arp)
            for i, off in enumerate(arp):
                if lvl in (0, 0.5) and i % 2:
                    continue
                if lvl == 1 and rng.random() < 0.15:
                    continue
                at = t0 + i * step + (pl["swing"] * step if i % 2 else 0)
                vel = 0.5 + 0.2 * (i == 0) + 0.05 * min(lvl, 3)
                note = ch[0] + 12 + off
                place(buf, inst_note(lead, note, step * 1.5, vel, pl["synth"]), at, 0.30, 0.25 if i % 2 else -0.25)
                if lvl == 3 and i % 2 == 0:
                    place(buf, inst_note(lead, note + 12, step * 1.2, vel * 0.7, pl["synth"]), at, 0.16, 0.4)
        # percussion
        perc = pal.get("perc")
        if perc and lvl >= 2:
            for k in range(8 if lvl == 3 else 4):
                place(buf, perc_hit(perc, 0.45 + 0.25 * (k % 4 == 0)), t0 + k * bar / (8 if lvl == 3 else 4), 0.22, 0.3)
        if cfg.get("drum") and lvl >= 2:
            place(buf, X.thump(0.9, 55), t0, 0.5)
            place(buf, X.thump(0.6, 70), t0 + 2.5 * beat, 0.35)
        if cfg.get("pulse") and lvl >= 1:
            for k in (0, 2):
                place(buf, X.heartbeat(0.6), t0 + k * beat, 0.3)
    # final tonic chord rings over the end
    end_ch = chord(root, 0, pl["minor"])
    final_lead = pal.get("lead") or pal.get("pad")
    if final_lead:
        for k, c in enumerate(end_ch + [end_ch[0] + 12]):
            place(buf, inst_note(final_lead, c + 12, 2.5, 0.5, pl["synth"] or "harp"), max(0, total - 1.6) + k * 0.06, 0.25, (k - 1.5) * 0.2)
    if S is not None:
        try:
            buf = S.room(buf, size=0.45, mix=0.18)
        except Exception:  # noqa: BLE001
            pass
    end = int(total * SR)
    tail = len(buf) - end
    buf[end:] *= np.linspace(1, 0, tail)[:, None]
    buf = buf[: end + int(1.5 * SR)]
    peak = np.abs(buf).max()
    return buf * (0.6 / peak) if peak > 0 else buf


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
        seed_src = str(p.get("music_seed") or p.get("title") or p["totalMs"]) + mood
        seed = int(hashlib.sha1(seed_src.encode()).hexdigest()[:12], 16)
        pl = plan(cfg, seed, p.get("style"), p.get("instruments"))
        sf.write(os.path.join(out_dir, "music.wav"), np.clip(music(total, cfg, pl, p["scenes"]), -1, 1), SR)
        engine = "samples" if S is not None else "synth"
        pal = ", ".join(f"{k}={v}" for k, v in pl["pal"].items())
        print(f"  music: {pl['key']} {'minor' if pl['minor'] else 'major'}, {pl['bpm']:.0f} bpm, prog {pl['prog']}, {engine}: {pal}")
    if use_sfx:
        sf.write(os.path.join(out_dir, "sfx.wav"), np.clip(effects(total, p["scenes"]), -1, 1), SR)
    print(f"OK  score mood={mood} sfx={'on' if use_sfx else 'off'} {total:.1f}s")


if __name__ == "__main__":
    main()
