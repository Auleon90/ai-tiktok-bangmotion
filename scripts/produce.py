#!/usr/bin/env python3
"""One-shot producer: storyboard.json -> TTS (cached) -> mixed audio -> Remotion props -> MP4.

Usage:
  python3 produce.py <storyboard.json> <out.mp4> [--draft] [--no-render] [--check-only] [--accept-qa] [--no-qa]
  python3 produce.py <storyboard.json> <out.mp4> --engine=html --html=<animation.html>

HTML engine: same Cartesia VO + audio mix, then the HTML page is injected with
window.PROPS (scenes with startMs/durationMs, words with startMs/endMs), recorded
with Playwright (scripts/record.js) and muxed with the audio into an MP4.

Storyboard format: see .claude/skills/bang-motion/SKILL.md.
Each scene needs "vo" (spoken text). Optional per scene: "pad_before_ms", "gap_after_ms".
Top level optional: "theme" {..colors}, "ambience": "wind" | "none" (default "wind").
"""
import hashlib, json, os, shutil, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
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
    h = hashlib.sha1(f"{voice}|{text}".encode()).hexdigest()[:16]
    mp3 = os.path.join(VO_DIR, f"{h}.mp3")
    side = os.path.join(VO_DIR, f"{h}.words.json")
    if not (os.path.exists(mp3) and os.path.exists(side)):
        print(f"  TTS  {text[:60]}...")
        run([sys.executable, os.path.join(ROOT, "scripts", "tts.py"), text, mp3] + ([voice] if voice else []))
    else:
        print(f"  TTS  (cache) {text[:50]}...")
    with open(side) as f:
        return mp3, json.load(f)


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
    print(r.stdout if r.returncode == 0 else f"  QA failed: {r.stderr[-400:]}")


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    flags = {a.split("=")[0] for a in sys.argv[1:] if a.startswith("--")}
    opts = dict(a[2:].split("=", 1) for a in sys.argv[1:] if a.startswith("--") and "=" in a)
    engine = opts.get("engine", "remotion")
    if engine in ("html", "hyperframes") and "html" not in opts:
        sys.exit(f"--engine={engine} requires --html=<index.html>")
    if len(args) < 2:
        sys.exit(__doc__)
    sb_path, out_mp4 = args
    os.makedirs(VO_DIR, exist_ok=True)
    os.makedirs(os.path.join(OUT, "img"), exist_ok=True)
    sb = json.load(open(sb_path))

    print("STEP  voiceover")
    cursor = 0
    segs, scenes, words = [], [], []
    for s in sb["scenes"]:
        mp3, meta = tts_cached(s["vo"], sb.get("voice", ""))
        pad = s.get("pad_before_ms", 0)
        gap = s.get("gap_after_ms", DEFAULT_GAP)
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
    mood = sb.get("music", "warm")
    want_sfx = sb.get("sfx", True)
    audio_py = os.path.join(ROOT, ".venv-audio", "bin", "python")
    stems = os.path.join(OUT, "stems")
    shutil.rmtree(stems, ignore_errors=True)
    if (mood != "none" or want_sfx) and os.path.exists(audio_py):
        print(f"STEP  score (music={mood}, sfx={'on' if want_sfx else 'off'})")
        ms = lambda fr: round(fr / FPS * 1000)
        tprops = os.path.join(OUT, "timing_tmp.json")
        json.dump({"totalMs": total_ms, "scenes": [{**x, "startMs": ms(x["startFrame"]), "durationMs": ms(x["durationFrames"])} for x in scenes]}, open(tprops, "w"))
        run([audio_py, os.path.join(ROOT, "scripts", "score.py"), tprops, stems, mood, "sfx:on" if want_sfx else "sfx:off"])
    elif mood != "none" or want_sfx:
        print("  (skip score: .venv-audio missing, run scripts/setup.sh)")

    # mix: voice (compressed) over a bed (ambience + music) ducked by the voice, plus sfx; master to -14 LUFS
    ins, chains, bed = ["-i", voice_wav], [], []
    chains.append("[0:a]aformat=sample_rates=48000:channel_layouts=stereo,acompressor=threshold=0.1:ratio=3:attack=5:release=120,asplit=2[vo][key]")
    if sb.get("ambience", "wind") == "wind":
        chains.append(f"anoisesrc=color=brown:amplitude=0.6:duration={dur}:sample_rate=48000,lowpass=f=900,highpass=f=80,tremolo=f=0.15:d=0.6,volume=0.22,aformat=channel_layouts=stereo[wind]")
        bed.append("[wind]")
    n = 1
    if os.path.exists(os.path.join(stems, "music.wav")):
        ins += ["-i", os.path.join(stems, "music.wav")]
        chains.append(f"[{n}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=1.1[mus]")
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
        chains.append("[bed0][key]sidechaincompress=threshold=0.03:ratio=8:attack=30:release=500[bed]")
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

    if engine == "html":
        render_html(opts["html"], props, final_audio, out_mp4, total_ms)
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
    if "--no-qa" not in flags:
        print("STEP  QA (local, free) -> output/qa_report.md")
        qa_args = ["all", sb_path, out_mp4]  # visual check already ran before render
        run_qa(qa_args)


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


def render_html(html_path, props, audio, out_mp4, total_ms):
    """Inject timing into the HTML, record it with Playwright, mux with the mixed audio."""
    ms = lambda fr: round(fr / FPS * 1000)
    data = {
        "totalMs": total_ms,
        "scenes": [{**s, "startMs": ms(s["startFrame"]), "durationMs": ms(s["durationFrames"])} for s in props["scenes"]],
        "words": [{"text": w["text"], "startMs": ms(w["startFrame"]), "endMs": ms(w["endFrame"])} for w in props["words"]],
    }
    src = open(html_path, encoding="utf-8").read()
    tag = "<script>window.PROPS=" + json.dumps(data, ensure_ascii=False) + ";</script>"
    src = src.replace("<head>", "<head>\n" + tag, 1) if "<head>" in src else tag + src
    rendered = os.path.join(OUT, "animation.rendered.html")
    open(rendered, "w", encoding="utf-8").write(src)

    print("STEP  record (HTML / Playwright)")
    webm = os.path.join(OUT, "animation.webm")
    run(["node", os.path.join(ROOT, "scripts", "record.js"), rendered, webm, str(total_ms), "1080", "1920"])
    print("STEP  mux -> MP4")
    run(["bash", os.path.join(ROOT, "scripts", "mux.sh"), webm, audio, os.path.abspath(out_mp4)])
    size = os.path.getsize(out_mp4) / 1e6
    print(f"DONE  {out_mp4}  {total_ms/1000:.1f}s  {size:.1f} MB")


if __name__ == "__main__":
    main()
