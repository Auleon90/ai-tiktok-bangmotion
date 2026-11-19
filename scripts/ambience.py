"""Ambience beds for Bang Motion: continuous, toneless room/nature texture under the voice-over (no melody).

Storyboard: top-level "ambience": "auto" (default) | "none" | one of NAMES; any scene may set its own "ambience" (a name or "none").
"auto" picks one per scene from the scene's words (vo + on-screen fields) and falls back to "room" (soft warm air), so the silence
under the voice never sounds dead. Consecutive scenes crossfade (0.8 s). Every layer is synthesised with ffmpeg (no files),
levelled to the same loudness, and the whole bed is then held at the owner's backsound ratio by produce.py.

  python3 scripts/ambience.py preview [name,...]   -> output/ambience_preview/<name>.wav (10 s each)
"""
import os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000

# name -> (ffmpeg lavfi graph producing [a] for D seconds, description)
def _g(d):
    return {
        "room":   (f"anoisesrc=color=brown:amplitude=0.5:duration={d}:sample_rate={SR},highpass=f=40,lowpass=f=260[a]",
                   "soft warm room air (default: no dead silence)"),
        "wind":   (f"anoisesrc=color=brown:amplitude=0.6:duration={d}:sample_rate={SR},lowpass=f=900,highpass=f=80,tremolo=f=0.15:d=0.6[a]",
                   "distant wind, slow gusts (desert, hills, journey)"),
        "rain":   (f"anoisesrc=color=pink:amplitude=0.5:duration={d}:sample_rate={SR}:seed=3,highpass=f=700,lowpass=f=7500,volume='1-0.25*0.5*(1+sin(2*PI*0.07*t))':eval=frame[r];"
                   f"anoisesrc=color=brown:amplitude=0.5:duration={d}:sample_rate={SR}:seed=4,lowpass=f=300[b];[r][b]amix=inputs=2:weights=1 0.6:normalize=0[a]",
                   "steady rain on soil and roofs (hujan, petrichor, rahmat)"),
        "sea":    (f"anoisesrc=color=brown:amplitude=0.7:duration={d}:sample_rate={SR}:seed=5,lowpass=f=520,highpass=f=40,volume='1-0.85*0.5*(1+sin(2*PI*0.09*t))':eval=frame[w];"
                   f"anoisesrc=color=pink:amplitude=0.3:duration={d}:sample_rate={SR}:seed=6,highpass=f=1800,lowpass=f=6000,volume='1-0.95*0.5*(1+sin(2*PI*0.09*t))':eval=frame[f];"
                   "[w][f]amix=inputs=2:weights=1 0.5:normalize=0[a]",
                   "slow waves and foam (laut, air, Musa, Yunus)"),
        "night":  (f"anoisesrc=color=brown:amplitude=0.4:duration={d}:sample_rate={SR}:seed=7,lowpass=f=240[b];"
                   f"sine=f=4300:duration={d}:sample_rate={SR},tremolo=f=21:d=1,tremolo=f=0.55:d=0.97,volume=0.05[c1];"
                   f"sine=f=4750:duration={d}:sample_rate={SR},tremolo=f=25:d=1,tremolo=f=0.37:d=0.98,volume=0.035[c2];"
                   "[b][c1][c2]amix=inputs=3:normalize=0[a]",
                   "quiet night with far crickets (malam, tidur, bintang, tahajud)"),
        "fire":   (f"anoisesrc=color=brown:amplitude=0.6:duration={d}:sample_rate={SR}:seed=8,lowpass=f=650,tremolo=f=2.3:d=0.45[f];"
                   f"anoisesrc=color=white:amplitude=1:duration={d}:sample_rate={SR}:seed=9,highpass=f=1500,lowpass=f=6000,"
                   "volume='if(lt(random(0),0.03),1,0)':eval=frame,volume=0.5[k];[f][k]amix=inputs=2:normalize=0[a]",
                   "fire roar with crackles (api, Ibrahim, perang)"),
        "space":  (f"anoisesrc=color=brown:amplitude=0.5:duration={d}:sample_rate={SR}:seed=10,lowpass=f=140,volume='1-0.5*0.5*(1+sin(2*PI*0.05*t))':eval=frame[l];"
                   f"anoisesrc=color=pink:amplitude=0.12:duration={d}:sample_rate={SR}:seed=11,bandpass=f=900:width_type=q:w=2,volume='1-0.7*0.5*(1+sin(2*PI*0.03*t))':eval=frame[h];"
                   "[l][h]amix=inputs=2:normalize=0[a]",
                   "deep cosmic hush (galaksi, langit, skala, 3D globe/galaxy)"),
    }

NAMES = list(_g(1).keys())

# words -> ambience (first match wins, checked in this order)
AUTO = [
    ("fire",  r"\bapi\b|bakar|kobar|perang|pedang|ibrahim"),
    ("rain",  r"hujan|gerimis|petrichor|geosmin|awan"),
    ("sea",   r"laut|ombak|samudra|pantai|sungai|ikan|yunus|musa|terbelah|banjir"),
    ("space", r"galaksi|bintang|semesta|planet|orbit|langit|angkasa|bumi berputar|kosmos"),
    ("night", r"malam|tidur|tahajud|gelap|bulan|subuh|mimpi"),
    ("wind",  r"gurun|padang|bukit|gunung|perjalanan|hijrah|angin|pasir|uhud"),
]


def pick(scene):
    text = " ".join(str(scene.get(k, "")) for k in ("vo", "headline", "title", "sub", "eyebrow", "context", "translation", "text")).lower()
    three = (scene.get("three") or {}).get("preset")
    if three in ("galaxy", "globe"): return "space"
    if three == "water": return "sea"
    for name, rx in AUTO:
        if re.search(rx, text): return name
    return "room"


def plan(sb, scenes, fps):
    """[(name, t0, t1)] per scene, merged when neighbours share a name. Empty list = no ambience."""
    top = sb.get("ambience", "auto")
    if top == "none": return []
    out, src = [], {x.get("id"): x for x in sb.get("scenes", [])}
    for s in scenes:
        s = {**src.get(s.get("id"), {}), **s}   # timed scenes may lack the storyboard text (vo): merge it back
        a = s.get("ambience") or (pick(s) if top == "auto" else top)
        if a not in NAMES: a = None if a == "none" else ("room" if top == "auto" else top)
        if a not in NAMES: continue
        t0 = s["startFrame"] / fps; t1 = (s["startFrame"] + s["durationFrames"]) / fps
        if out and out[-1][0] == a and abs(out[-1][2] - t0) < .05: out[-1] = (a, out[-1][1], t1)
        else: out.append((a, t0, t1))
    return out


def _lufs(path):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
    m = re.findall(r"I:\s+(-?[\d.]+) LUFS", r)
    return float(m[-1]) if m and float(m[-1]) > -70 else None


def layer(name, dur, out):
    g = _g(round(dur + 1, 2))[name][0]
    subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo:d=0.01",
                    "-filter_complex", g + ";[a]aformat=sample_rates=48000:channel_layouts=stereo[o]", "-map", "[o]", "-t", str(dur), out], check=True)
    m = _lufs(out)   # level every layer to -30 LUFS so a crossfade never jumps in loudness
    if m is not None:
        tmp = out + ".tmp.wav"; os.replace(out, tmp)
        subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", tmp, "-af", f"volume={10 ** ((-30 - m) / 20):.4f}", out], check=True)
        os.remove(tmp)


def build(sb, scenes, fps, dur, out_wav, xf=0.8):
    """Write the ambience bed to out_wav; returns the plan (or [] when there is none)."""
    P = plan(sb, scenes, fps)
    if not P: return []
    d = os.path.dirname(out_wav); os.makedirs(d, exist_ok=True)
    names = sorted({p[0] for p in P}); ins, chains = [], []
    for k, n in enumerate(names):
        f = os.path.join(d, f"amb_{n}.wav"); layer(n, dur, f); ins += ["-i", f]
        env = "+".join(f"clip((t-{max(0, t0 - xf / 2):.3f})/{xf},0,1)*clip(({t1 + xf / 2:.3f}-t)/{xf},0,1)" for (nm, t0, t1) in P if nm == n)
        chains.append(f"[{k}:a]volume='min(1,{env})':eval=frame[l{k}]")
    chains.append("".join(f"[l{k}]" for k in range(len(names))) + (f"amix=inputs={len(names)}:normalize=0" if len(names) > 1 else "anull") + f",atrim=0:{dur}[o]")
    subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", *ins, "-filter_complex", ";".join(chains), "-map", "[o]", out_wav], check=True)
    return P


if __name__ == "__main__" and len(sys.argv) > 1 and sys.argv[1] == "preview":
    want = sys.argv[2].split(",") if len(sys.argv) > 2 else NAMES
    od = os.path.join(ROOT, "output", "ambience_preview"); os.makedirs(od, exist_ok=True)
    for n in want:
        layer(n, 10, os.path.join(od, f"{n}.wav")); print(f"{n:6s} {_g(1)[n][1]}  -> {od}/{n}.wav")
