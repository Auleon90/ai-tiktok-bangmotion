#!/usr/bin/env python3
"""One-shot producer: storyboard.json -> TTS (cached) -> mixed audio -> Remotion props -> MP4.

Usage:
  python3 produce.py <storyboard.json> <out.mp4> [--draft] [--no-render] [--check-only] [--accept-qa] [--no-qa]
  python3 produce.py <storyboard.json> <out.mp4> --engine=lemo [--style=<slug>] [--workers=4]

Lemo engine (Lemo native): the storyboard's "style" picks a portrait kit in lemo/kits/<slug>/ (code adapted from the
Lemo-Opuscar demo films, MIT). The kit is built in output/lemo/, checked for 9:16 composition (lemo/render.mjs layout),
rendered frame by frame (window.render(t)) and muxed with the mixed audio.

Storyboard format: see .claude/skills/bang-motion/SKILL.md.
Each scene needs "vo" (spoken text). Optional per scene: "pad_before_ms", "gap_after_ms".
Top level optional: "theme" {..colors}, "ambience": "auto" (default) | "none" | room/wind/rain/sea/night/fire/space
(scripts/ambience.py; a scene may set its own "ambience"), "ambience_level" (0.35 = 35% of the VO).
"""
import hashlib, json, math, os, re, shutil, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# local use (laptop / IDE): read keys from a .env file at the repo root if present (KEY=value per line); real env vars win
_env = os.path.join(ROOT, ".env")
if os.path.exists(_env):
    for _ln in open(_env, encoding="utf-8"):
        _ln = _ln.strip()
        if _ln and not _ln.startswith("#") and "=" in _ln:
            _k, _v = _ln.split("=", 1); os.environ.setdefault(_k.strip(), _v.strip().strip('"').strip("'"))
OUT = os.path.join(ROOT, "output")
VO_DIR = os.path.join(OUT, "vo")
REMOTION = os.path.join(ROOT, "remotion")
FPS = 30
DEFAULT_GAP = 350
TAIL_MS = 900


def run(cmd, **kw):
    r = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if r.returncode != 0:
        sys.exit(f"FAILED: {' '.join(cmd[:3])}...\n{r.stderr[-1500:]}{r.stdout[-500:]}")
    return r.stdout


def tts_cached(text: str, voice: str = "") -> tuple[str, dict]:
    voice = voice or os.environ.get("CARTESIA_VOICE_ID", "")
    cfg = "|".join(os.environ.get(k, "") for k in ("CARTESIA_MODEL", "CARTESIA_EMOTION", "CARTESIA_SPEED", "CARTESIA_VOLUME"))
    h = hashlib.sha1(f"{voice}|{text}{('|' + cfg) if cfg.strip('|') else ''}".encode()).hexdigest()[:16]
    mp3 = os.path.join(VO_DIR, f"{h}.mp3")
    side = os.path.join(VO_DIR, f"{h}.words.json")
    if not (os.path.exists(mp3) and os.path.exists(side)):
        print(f"  TTS  {text[:60]}...")
        run([sys.executable, os.path.join(ROOT, "scripts", "tts.py"), text, mp3] + ([voice] if voice else []))
    else:
        print(f"  TTS  (cache) {text[:50]}...")
    with open(side) as f:
        return mp3, json.load(f)


def source_clip(src, s) -> tuple[str, dict]:
    """Cut scene s's span ("vo_src": [t0, t1] seconds) out of the source voice; words come from the source transcript."""
    t0, t1 = s["vo_src"]
    f = src["file"] if os.path.isabs(src["file"]) else os.path.join(ROOT, src["file"])
    words = json.load(open(src["words"] if os.path.isabs(src["words"]) else os.path.join(ROOT, src["words"]))) if isinstance(src["words"], str) else src["words"]
    h = hashlib.sha1(f"{f}|{os.path.getsize(f)}|{t0}|{t1}".encode()).hexdigest()[:16]
    mp3 = os.path.join(VO_DIR, f"src_{h}.mp3")
    if not os.path.exists(mp3):
        print(f"  SRC  {t0:.2f}-{t1:.2f}s")
        run(["ffmpeg", "-y", "-loglevel", "error", "-ss", str(t0), "-to", str(t1), "-i", f, "-vn", "-ac", "2", "-ar", "44100", "-c:a", "libmp3lame", "-q:a", "1", mp3])
    ws = [{"text": w["text"], "start_ms": round((w["start"] - t0) * 1000), "end_ms": round((min(w["end"], t1) - t0) * 1000)}
          for w in words if t0 <= w["start"] < t1]
    return mp3, {"duration_ms": round((t1 - t0) * 1000), "words": ws}


DEFAULT_IMAGE_STYLE = ("clean 2D cartoon illustration, bold outlines, soft cel shading, cinematic lighting, "
                       "rich colors, vertical composition, no text, no letters, no watermark")


def image_cached(spec, style: str) -> str:
    """Optional AI illustration (Cloudflare FLUX). Returns path relative to output/: img/<hash>.jpg"""
    prompt = spec if isinstance(spec, str) else spec["prompt"]
    steps = 6 if isinstance(spec, str) else spec.get("steps", 6)
    full = f"{prompt}, {style}" if style else prompt
    h = hashlib.sha1(f"{steps}|{full}".encode()).hexdigest()[:16]
    rel = f"img/{h}.jpg"
    path = os.path.join(OUT, rel)
    if os.path.exists(path):
        print(f"  IMG  (cache) {prompt[:50]}...")
    else:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        print(f"  IMG  {prompt[:60]}...")
        run([sys.executable, os.path.join(ROOT, "scripts", "gen_image.py"), full, path, f"--steps={steps}"])
    return rel


def ms2f(ms: float) -> int:
    return int(round(ms / 1000 * FPS))


def remotion_prestills(props_path, props):
    """Pre-render check for Remotion: one still per scene (at ~70%) tiled into output/qa_prerender.jpg."""
    hs = next(iter(sorted(__import__("glob").glob("/opt/pw-browsers/chromium_headless_shell-*/*/chrome-headless-shell"))), None)
    tmp = os.path.join(OUT, "qa_stills"); shutil.rmtree(tmp, ignore_errors=True); os.makedirs(tmp)
    frames = [sc["startFrame"] + int(sc["durationFrames"] * 0.7) for sc in props["scenes"]]
    for i, fr in enumerate(frames):
        cmd = ["npx", "remotion", "still", "src/index.ts", "BangMotion", os.path.join(tmp, f"{i:02d}.png"), f"--frame={fr}",
               f"--props={props_path}", "--scale=0.25", "--log=error"] + ([f"--browser-executable={hs}"] if hs else [])
        r = subprocess.run(cmd, cwd=REMOTION, capture_output=True, text=True)
        if r.returncode != 0:
            return [f"remotion still failed at frame {fr}: {r.stderr[-300:]}"]
    sheet = os.path.join(OUT, "qa_prerender.jpg")
    run(["ffmpeg", "-y", "-pattern_type", "glob", "-i", os.path.join(tmp, "*.png"), "-vf", "tile=5x2:padding=4", "-frames:v", "1", sheet])
    print(f"  pre-render stills -> {sheet} (look at every scene before the long render)")
    return []


def run_qa(args):
    r = subprocess.run([sys.executable, os.path.join(ROOT, "scripts", "qa.py"), *args], capture_output=True, text=True)
    print(r.stdout if r.returncode in (0, 3) else f"  QA failed: {r.stderr[-400:]}")
    if r.returncode == 3:
        print("  ❌ THUMBNAIL: frame 00:00:00 is not cover-ready — fix scene 1 and re-render before delivering (output/qa_thumb.jpg)")


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    flags = {a.split("=")[0] for a in sys.argv[1:] if a.startswith("--")}
    opts = dict(a[2:].split("=", 1) for a in sys.argv[1:] if a.startswith("--") and "=" in a)
    engine = opts.get("engine", "remotion")
    if engine == "html":
        sys.exit("--engine=html was removed: use --engine=lemo (Lemo native) instead")
    if engine == "hyperframes" and "html" not in opts:
        sys.exit(f"--engine={engine} requires --html=<index.html>")
    if engine == "hyperframes" and "--no-render" not in flags:
        sb = json.load(open(args[0]))
        page = open(opts["html"], encoding="utf-8").read()
        tpl = open(os.path.join(ROOT, "hyperframes", "template", "index.html"), encoding="utf-8").read()
        if sb.get("style") and page == tpl:
            sys.exit(f"style '{sb['style']}' is set but {opts['html']} is the unmodified template: write the styled page first")
        if not sb.get("style") and page == tpl:
            print("WARN  no Lemo style: rendering the plain default template look")
        if any(s.get("image") for s in sb["scenes"]) and "imageSrc" not in page:
            sys.exit(f"scenes have images but {opts['html']} never reads imageSrc: images would be dropped")
    if len(args) < 2:
        sys.exit(__doc__)
    sb_path, out_mp4 = args
    os.makedirs(VO_DIR, exist_ok=True)
    os.makedirs(os.path.join(OUT, "img"), exist_ok=True)
    sb = json.load(open(sb_path))
    kit = None
    if engine == "lemo":
        sys.path.insert(0, os.path.join(ROOT, "lemo"))
        from build import manifest
        kits = manifest()
        slug = opts.get("style") or sb.get("style")
        if slug not in kits:
            sys.exit(f"--engine=lemo needs a storyboard \"style\" with a Lemo-native kit: {', '.join(kits)} (got {slug!r})")
        kit = (slug, kits[slug])
        if kits[slug].get("photos") is False and any(x.get("image") for x in sb["scenes"]):
            sys.exit(f"style '{slug}' is a landscape kit: AI photos are not used here (they read as pasted). Act the moment out with a "
                     f"\"action\" scene (terrain + moving figures or dots), \"clash\" or \"custom\" instead.")
        if any(x.get("type") == "clash" for x in sb["scenes"]) and not kits[slug].get("clash"):
            sys.exit(f"style '{slug}' has no battle scene: use one of {', '.join(k for k in kits if kits[k].get('clash'))} for \"clash\" scenes")
        if "image_style" not in sb:
            sb["image_style"] = kits[slug]["image_style"]

    print("STEP  voiceover")
    cursor = 0
    segs, scenes, words = [], [], []
    src = sb.get("vo_source")   # remake from a source voice: {"file": audio, "words": [{text,start,end} s]}; scene "vo_src": [t0, t1] s
    for s in sb["scenes"]:
        mp3, meta = source_clip(src, s) if src else tts_cached(s["vo"], sb.get("voice", ""))
        pad = s.get("pad_before_ms", 0)
        gap = s.get("gap_after_ms", 0 if src else DEFAULT_GAP)   # source clips are cut back-to-back: no extra gap
        vo_start = cursor + pad
        segs.append((mp3, vo_start))
        for w in meta["words"]:
            words.append({"text": w["text"], "startFrame": ms2f(vo_start + w["start_ms"]), "endFrame": ms2f(vo_start + w["end_ms"])})
        dur = pad + meta["duration_ms"] + gap
        visual = {k: v for k, v in s.items() if k not in ("vo", "pad_before_ms", "gap_after_ms", "image")}
        if s.get("image") and engine != "manim":
            visual["imageSrc"] = image_cached(s["image"], sb.get("image_style", DEFAULT_IMAGE_STYLE))
        scenes.append({**visual, "startFrame": ms2f(cursor), "durationFrames": ms2f(dur), "vo_ms": meta["duration_ms"]})
        print(f"  scene {s['id']:>2} {s['type']:<9} {dur/1000:5.2f}s")
        cursor += dur
    # fix rounding so scenes are contiguous
    for a, b in zip(scenes, scenes[1:]):
        a["durationFrames"] = b["startFrame"] - a["startFrame"]
    total_ms = cursor + TAIL_MS
    scenes[-1]["durationFrames"] = ms2f(total_ms) - scenes[-1]["startFrame"]
    total_frames = ms2f(total_ms)

    print("STEP  audio mix")
    voice_wav = os.path.join(OUT, "voice.wav")
    inputs, filt = [], []
    for i, (mp3, start) in enumerate(segs):
        inputs += ["-i", mp3]
        filt.append(f"[{i}:a]aformat=sample_rates=44100:channel_layouts=stereo,adelay={int(start)}|{int(start)}[v{i}]")
    filt.append("".join(f"[v{i}]" for i in range(len(segs))) + f"amix=inputs={len(segs)}:normalize=0,apad=whole_dur={total_ms/1000}[vo]")
    run(["ffmpeg", "-y", *inputs, "-filter_complex", ";".join(filt), "-map", "[vo]", "-t", str(total_ms / 1000), voice_wav])

    final_audio = os.path.join(REMOTION, "public", "audio.mp3")
    os.makedirs(os.path.dirname(final_audio), exist_ok=True)
    dur = total_ms / 1000

    # score + sfx (audio/lemo via .venv-audio); optional per storyboard: "music": mood|"none", "sfx": true|false
    mood = sb.get("music", "none")      # owner rule: no music by default; ambience (auto) and SFX stay on
    want_sfx = sb.get("sfx", True)
    audio_py = os.path.join(ROOT, ".venv-audio", "bin", "python")
    stems = os.path.join(OUT, "stems")
    shutil.rmtree(stems, ignore_errors=True)
    if (mood != "none" or want_sfx) and os.path.exists(audio_py):
        print(f"STEP  score (music={mood}, sfx={'on' if want_sfx else 'off'})")
        ms = lambda fr: round(fr / FPS * 1000)
        tprops = os.path.join(OUT, "timing_tmp.json")
        json.dump({"totalMs": total_ms, **{k: sb[k] for k in ("title", "style", "music_seed", "instruments") if sb.get(k)}, "scenes": [{**x, "startMs": ms(x["startFrame"]), "durationMs": ms(x["durationFrames"])} for x in scenes]}, open(tprops, "w"))
        out = run([audio_py, os.path.join(ROOT, "scripts", "score.py"), tprops, stems, mood, "sfx:on" if want_sfx else "sfx:off"])
        print("".join(l + "\n" for l in out.splitlines() if "music:" in l or "sampler" in l or "WARN" in l), end="")
    elif mood != "none" or want_sfx:
        print("  (skip score: .venv-audio missing, run scripts/setup.sh)")

    # mix: voice (compressed) over a bed (ambience + music) held at 35% of the voice's loudness, plus sfx; master to -14 LUFS
    def lufs(path, af=""):
        r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", (af + "," if af else "") + "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
        m = re.findall(r"I:\s+(-?[\d.]+) LUFS", r)
        return float(m[-1]) if m and float(m[-1]) > -70 else None
    BED_RATIO = 0.35   # backsound = 35% of the VO (amplitude), every mode
    AMB_RATIO = float(sb.get("ambience_level", 0.6))   # ambience alone: 60% of the VO (owner: 35% was too quiet)
    vo_lufs = lufs(voice_wav, "acompressor=threshold=0.1:ratio=3:attack=5:release=120")
    def bed_gain(path, pre=1.0):
        m = lufs(path)
        if vo_lufs is None or m is None: return pre * BED_RATIO
        return pre * 10 ** ((vo_lufs + 20 * math.log10(BED_RATIO) - m) / 20)
    ins, chains, bed = ["-i", voice_wav], [], []
    chains.append("[0:a]aformat=sample_rates=48000:channel_layouts=stereo,acompressor=threshold=0.1:ratio=3:attack=5:release=120,asplit=2[vo][key]")
    n = 1
    # ambience bed (scripts/ambience.py): "auto" by default — one toneless texture per scene from its words, crossfaded
    sys.path.insert(0, os.path.join(ROOT, "scripts")); import ambience as AMB
    amb_wav = os.path.join(OUT, "stems_amb", "ambience.wav")
    amb_plan = AMB.build(sb, scenes, FPS, dur, amb_wav)
    if amb_plan:
        print("  ambience: " + " · ".join(f"{a} {t0:.0f}-{t1:.0f}s" for a, t0, t1 in amb_plan))
        ins += ["-i", amb_wav]
        chains.append(f"[{n}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume={bed_gain(amb_wav, AMB_RATIO / BED_RATIO):.4f}[amb]")
        bed.append("[amb]"); n += 1
    if os.path.exists(os.path.join(stems, "music.wav")):
        ins += ["-i", os.path.join(stems, "music.wav")]
        chains.append(f"[{n}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume={bed_gain(os.path.join(stems, 'music.wav')):.4f}[mus]")
        print(f"  backsound at {int(BED_RATIO*100)}% of VO (VO {vo_lufs} LUFS)")
        bed.append("[mus]"); n += 1
    sfx_lbl = None
    if os.path.exists(os.path.join(stems, "sfx.wav")):
        ins += ["-i", os.path.join(stems, "sfx.wav")]
        chains.append(f"[{n}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=0.8[sfx]")
        sfx_lbl = "[sfx]"; n += 1
    parts = ["[vo]"]
    if bed:
        mixbed = "".join(bed) + (f"amix=inputs={len(bed)}:normalize=0[bed0]" if len(bed) > 1 else "anull[bed0]")
        chains.append(mixbed)
        chains.append("[bed0]anull[bed]"); chains.append("[key]anullsink")   # no ducking: the bed stays at a steady 35%
        parts.append("[bed]")
    else:
        chains.append("[key]anullsink")
    if sfx_lbl:
        parts.append(sfx_lbl)
    chains.append("".join(parts) + f"amix=inputs={len(parts)}:normalize=0,atrim=0:{dur},loudnorm=I=-14:TP=-1.5:LRA=11[out]")
    run(["ffmpeg", "-y", *ins, "-filter_complex", ";".join(chains), "-map", "[out]", "-ar", "44100", "-c:a", "libmp3lame", "-q:a", "1", final_audio])

    props = {"fps": FPS, "totalFrames": total_frames, "audio": "audio.mp3", "theme": sb.get("theme", {}), "scenes": scenes, "words": words}
    props_path = os.path.join(OUT, "props.json")
    json.dump(props, open(props_path, "w"), ensure_ascii=False, indent=1)
    print(f"  total {total_ms/1000:.1f}s  {total_frames} frames  {len(words)} words  -> {props_path}")

    if "--no-render" in flags:
        print("STEP  QA voice-over (local)")
        run_qa(["vo", sb_path])
        return

    # ---------- pre-render QA gate (local, free): catch problems before spending render time ----------
    proj = build_hyperframes(opts["html"], props, final_audio, total_ms) if engine == "hyperframes" else None
    if engine == "lemo":
        from build import build as build_lemo
        data = timing_data(props, total_ms); data["title"] = sb.get("title", "")
        proj = build_lemo(kit[0], data, os.path.join(OUT, "lemo"))
        if os.path.exists(os.path.join(proj, "prerender.mjs")):   # hybrid kits: stills from the demo's own 3D engine
            print("STEP  pre-render 3D stills (demo engine, software WebGL)")
            p = subprocess.run(["node", os.path.join(proj, "prerender.mjs"), proj])
            if p.returncode != 0:
                sys.exit("pre-render failed")
        print(f"STEP  Lemo-native kit '{kit[0]}' ({kit[1]['name']}) -> {proj}")
    print("STEP  pre-render QA (local, free) -> output/qa_precheck.md")
    pre = subprocess.run([sys.executable, os.path.join(ROOT, "scripts", "qa.py"), "precheck", sb_path] + ([proj] if proj else []),
                         capture_output=True, text=True)
    verdict = [l for l in pre.stdout.splitlines() if l.startswith("### ✅") or l.startswith("### ❌") or l.startswith("- ")]
    print("\n".join(l for l in verdict if not l.startswith("- ✅"))[:3000])
    extra = remotion_prestills(props_path, props) if engine == "remotion" else []
    if (pre.returncode == 2 or extra) and "--accept-qa" not in flags:
        sys.exit("STOPPED before render: fix the issues in output/qa_precheck.md (or re-run with --accept-qa after reviewing).")
    if "--check-only" in flags:
        print("CHECK-ONLY: pre-render QA done, render skipped.")
        return

    if engine == "lemo":
        render_lemo(proj, final_audio, out_mp4, total_ms, opts.get("workers", "4"))
    elif engine == "hyperframes":
        render_hyperframes(proj, out_mp4, total_ms, "--draft" in flags)
    elif engine == "manim":
        render_manim(opts.get("scene", os.path.join(OUT, "manim_scene.py")), props, final_audio, out_mp4, total_ms, "--draft" in flags)
    else:
        print("STEP  render (Remotion)")
        cmd = ["node", os.path.join(REMOTION, "render.mjs"), props_path, os.path.abspath(out_mp4)]
        if "--draft" in flags:
            cmd.append("--draft")
        p = subprocess.run(cmd, cwd=REMOTION)
        if p.returncode != 0:
            sys.exit("render failed")
        size = os.path.getsize(out_mp4) / 1e6
        print(f"DONE  {out_mp4}  {total_ms/1000:.1f}s  {size:.1f} MB")
    page_html = open(opts["html"], encoding="utf-8").read() if engine == "hyperframes" else ""
    add_watermark(out_mp4, sb.get("watermark", WATERMARK), "data-watermark" in page_html, sb.get("style", ""), sb.get("watermark_extra"))
    if "--no-qa" not in flags:
        print("STEP  QA (local, free) -> output/qa_report.md")
        qa_args = ["all", sb_path, out_mp4]  # visual check already ran before render
        run_qa(qa_args)


WATERMARK = "@valsyz7"   # owner's account; storyboard "watermark": "<text>" overrides, false disables


# Per-style position (owner request 2026-11-25: the mark must not sit on a scene title). Checked on docs/styles previews:
# most styles start their eyebrow/title at y≈0.11–0.13, so the default is the clear band above it (y 0.085, under TikTok's tabs).
# Styles whose chip/title already starts at that band move to the top-right corner. (side, y as fraction of height)
WM_POS = {"bang:jurnalisme-visual": ("right", .085), "bang:papan-tulis": ("right", .085), "bang:infografik-flat": ("right", .085), "bang:sketsa-diagram": ("right", .085), "bang:kartun-cutaway": ("right", .125)}
WM_DEFAULT = ("left", .085)


def add_watermark(mp4, text, page_has_own, style="", extras=None):
    """MANDATORY (owner rule 2026-11-25): visible from 0 s to the last frame, so no enable= window on the filter.
    Faint account name, top-left below TikTok's tab bar (clear of the right rail, caption area and subtitles).
    Pages that draw their own mark (data-watermark, e.g. ukiran-tembaga's engraved stamp) are left alone."""
    if not text or page_has_own or not os.path.exists(mp4):
        return
    font = next((f for f in ["/usr/share/fonts/opentype/inter/Inter-SemiBold.otf", "/usr/share/fonts/opentype/inter/Inter-Medium.otf",
                             "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"] if os.path.exists(f)), None)
    esc = str(text).replace("\\", "\\\\").replace(":", "\\:").replace("'", "\\'")
    side, fy = WM_POS.get(style, WM_DEFAULT)
    xexpr = "w*0.06" if side == "left" else "w*0.94-tw"
    dt = (f"drawtext=text='{esc}':x={xexpr}:y=h*{fy}:fontsize=h*0.019:fontcolor=white@0.34:"
          f"shadowcolor=black@0.22:shadowx=2:shadowy=2" + (f":fontfile={font}" if font else ""))
    for k, extra in enumerate(extras or []):   # extra credit lines under the account name (e.g. "Sourcevoice: IG/@x")
        ee = str(extra).replace("\\", "\\\\").replace(":", "\\:").replace("'", "\\'")
        dt += (f",drawtext=text='{ee}':x={xexpr.replace('tw', 'text_w')}:y=h*{fy}+h*0.025*{k + 1}:fontsize=h*0.015:fontcolor=white@0.34:"
               f"shadowcolor=black@0.22:shadowx=2:shadowy=2" + (f":fontfile={font}" if font else ""))
    tmp = mp4 + ".wm.mp4"
    print(f"STEP  watermark '{text}' (faint, top-{side}, y={fy})")
    run(["ffmpeg", "-y", "-loglevel", "error", "-i", mp4, "-vf", dt, "-c:v", "libx264", "-crf", "18", "-preset", "medium",
         "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", tmp])
    os.replace(tmp, mp4)


def timing_data(props, total_ms):
    ms = lambda fr: round(fr / FPS * 1000)
    return {
        "totalMs": total_ms,
        "theme": props.get("theme", {}),
        "scenes": [{**s, "startMs": ms(s["startFrame"]), "durationMs": ms(s["durationFrames"])} for s in props["scenes"]],
        "words": [{"text": w["text"], "startMs": ms(w["startFrame"]), "endMs": ms(w["endFrame"])} for w in props["words"]],
    }


def build_hyperframes(html_path, props, audio, total_ms):
    """Assemble the HyperFrames project in output/hf (no rendering)."""
    proj = os.path.join(OUT, "hf")
    shutil.rmtree(proj, ignore_errors=True)
    a = os.path.join(proj, "assets")
    hfmods = os.path.join(ROOT, "hyperframes", "node_modules")
    os.makedirs(os.path.join(a, "lib"))
    shutil.copy(os.path.join(hfmods, "gsap", "dist", "gsap.min.js"), os.path.join(a, "lib"))
    shutil.copy(os.path.join(hfmods, "lottie-web", "build", "player", "lottie.min.js"), os.path.join(a, "lib"))
    shutil.copytree(os.path.join(ROOT, "assets", "fonts"), os.path.join(a, "fonts"))
    shutil.copytree(os.path.join(ROOT, "hyperframes", "runtime"), os.path.join(a, "bm"))
    if True:   # 3D scene layers (lib3d/bm3d.js + three.js), always shipped: the template imports it
        three = os.path.join(ROOT, "lemo", "node_modules", "three", "build", "three.module.min.js")
        if not os.path.isfile(three):
            sys.exit("three.js missing: run bash scripts/setup.sh (npm install in lemo/)")
        shutil.copytree(os.path.join(ROOT, "lib3d"), os.path.join(a, "lib3d"))
        shutil.copy(three, os.path.join(a, "lib3d"))
    shutil.copy(audio, os.path.join(a, "audio.mp3"))
    shutil.copytree(os.path.join(OUT, "img"), os.path.join(a, "img"))
    data = timing_data(props, total_ms)
    open(os.path.join(a, "props.js"), "w").write("window.PROPS=" + json.dumps(data, ensure_ascii=False) + ";")
    lot = {}
    ldir = os.path.join(ROOT, "assets", "lottie")
    for fn in sorted(os.listdir(ldir)):
        lot[fn[:-5]] = json.load(open(os.path.join(ldir, fn)))
    open(os.path.join(a, "lottie.js"), "w").write("window.LOTTIE=" + json.dumps(lot, separators=(",", ":")) + ";")
    src = open(html_path, encoding="utf-8").read().replace("__TOTAL_S__", f"{total_ms/1000:.3f}")
    open(os.path.join(proj, "index.html"), "w", encoding="utf-8").write(src)
    return proj


def render_hyperframes(proj, out_mp4, total_ms, draft):
    """Render the assembled HyperFrames project frame-by-frame to MP4."""
    hfmods = os.path.join(ROOT, "hyperframes", "node_modules")
    print("STEP  render (HyperFrames, frame-by-frame)")
    hf = os.path.join(hfmods, ".bin", "hyperframes")
    cmd = [hf, "render", proj, "-o", os.path.abspath(out_mp4), "--fps", str(FPS), "-w", "4", "--no-browser-gpu", "--quiet"]
    cmd += ["-q", "draft"] if draft else ["--crf", "16"]
    p = subprocess.run(cmd, cwd=os.path.join(ROOT, "hyperframes"))
    if p.returncode != 0:
        sys.exit("hyperframes render failed")
    size = os.path.getsize(out_mp4) / 1e6
    print(f"DONE  {out_mp4}  {total_ms/1000:.1f}s  {size:.1f} MB")


def ass_captions(words, path, accent="#e9b552", text="#f6efe2"):
    """Word-synced captions (groups of <=3 words, active word in accent) as an ASS file."""
    col = lambda h: "&H00%s%s%s&" % (h[5:7], h[3:5], h[1:3])
    ts = lambda ms: "%d:%02d:%02d.%02d" % (ms // 3600000, ms // 60000 % 60, ms // 1000 % 60, ms % 1000 // 10)
    groups, cur = [], []
    for i, w in enumerate(words):
        cur.append(w)
        if len(cur) >= 3 or w["text"][-1:] in ".,!?;:" or i == len(words) - 1:
            groups.append(cur); cur = []
    ev = []
    for gi, g in enumerate(groups):
        g_end = g[-1]["endMs"] + 600
        if gi + 1 < len(groups):
            g_end = min(g_end, groups[gi + 1][0]["startMs"])
        for wi, w in enumerate(g):
            end = g[wi + 1]["startMs"] if wi + 1 < len(g) else g_end
            if end <= w["startMs"]:
                continue
            parts = []
            for k, x in enumerate(g[: wi + 1]):
                t = x["text"].replace("{", "(").replace("}", ")")
                parts.append("{\\c%s}%s" % (col(accent) if k == wi else col(text), t))
            ev.append(f"Dialogue: 0,{ts(w['startMs'])},{ts(end)},Cap,,0,0,0,,{{\\an8\\pos(540,1320)}}" + " ".join(parts))
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,Inter,78,{col(text)},{col(text)},&H00000000&,&H80000000&,-1,0,0,0,100,100,0,0,1,7,3,8,70,70,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    open(path, "w", encoding="utf-8").write(head + "\n".join(ev) + "\n")


def render_manim(scene_py, props, audio, out_mp4, total_ms, draft):
    """Render a Manim scene (class Video) with storyboard timings, then burn captions + mux audio."""
    data = timing_data(props, total_ms)
    props_path = os.path.join(OUT, "manim_props.json")
    json.dump(data, open(props_path, "w"), ensure_ascii=False)
    manim_bin = os.path.join(ROOT, ".venv-manim", "bin", "manim")
    media = os.path.join(OUT, "manim_media")
    res = "540,960" if draft else "1080,1920"
    print("STEP  render (Manim)")
    env = dict(os.environ, BM_PROPS=props_path)
    p = subprocess.run([manim_bin, "render", scene_py, "Video", "--resolution", res, "--frame_rate", str(FPS),
                        "--format", "mp4", "--media_dir", media, "-o", "manim_raw", "--disable_caching", "--progress_bar", "none"],
                       cwd=ROOT, env=env)
    if p.returncode != 0:
        sys.exit("manim render failed")
    raw = next((os.path.join(d, f) for d, _, fs in os.walk(media) for f in fs if f == "manim_raw.mp4"), None)
    if not raw:
        sys.exit("manim output not found")

    print("STEP  captions + mux")
    fonts_dir = os.path.join(OUT, ".fonts_ttf")
    if not os.path.isdir(fonts_dir) or not os.listdir(fonts_dir):
        from fontTools.ttLib import TTFont
        os.makedirs(fonts_dir, exist_ok=True)
        fd = os.path.join(ROOT, "assets", "fonts")
        for f in os.listdir(fd):
            t = TTFont(os.path.join(fd, f)); t.flavor = None; t.save(os.path.join(fonts_dir, f[:-6] + ".ttf"))
    ass = os.path.join(OUT, "captions.ass")
    th = data.get("theme") or {}
    ass_captions(data["words"], ass, th.get("accent", "#e9b552"), th.get("text", "#f6efe2"))
    vf = f"scale=1080:1920:flags=lanczos,tpad=stop_mode=clone:stop_duration=5,subtitles={ass}:fontsdir={fonts_dir}"
    run(["ffmpeg", "-y", "-i", raw, "-i", audio, "-vf", vf, "-map", "0:v", "-map", "1:a", "-t", f"{total_ms/1000:.3f}",
         "-c:v", "libx264", "-preset", "veryfast" if draft else "slow", "-crf", "26" if draft else "16", "-pix_fmt", "yuv420p",
         "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", os.path.abspath(out_mp4)])
    size = os.path.getsize(out_mp4) / 1e6
    print(f"DONE  {out_mp4}  {total_ms/1000:.1f}s  {size:.1f} MB")


def render_lemo(proj, audio, out_mp4, total_ms, workers="4"):
    """Render the built kit frame by frame (lemo/render.mjs), then mux the mixed audio."""
    print("STEP  render (Lemo native, frame-by-frame)")
    raw = os.path.join(OUT, "lemo_raw.mp4")
    p = subprocess.run(["node", os.path.join(ROOT, "lemo", "render.mjs"), proj, "video", raw, "--fps", str(FPS), "--workers", str(workers)])
    if p.returncode != 0:
        sys.exit("lemo render failed")
    run(["ffmpeg", "-y", "-i", raw, "-i", audio, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
         "-t", f"{total_ms/1000:.3f}", "-movflags", "+faststart", os.path.abspath(out_mp4)])
    size = os.path.getsize(out_mp4) / 1e6
    print(f"DONE  {out_mp4}  {total_ms/1000:.1f}s  {size:.1f} MB")


if __name__ == "__main__":
    main()
