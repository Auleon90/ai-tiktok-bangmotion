#!/usr/bin/env python3
"""Free, local QA for bang-motion videos (no paid or quota-limited APIs; Cloudflare is for images only).

  python3 qa.py vo <storyboard.json>            # voice-over: word count, stretched words, odd pauses, pace, clipping
  python3 qa.py visual <hf_project_dir>          # HyperFrames check: lint, runtime errors, layout overlap/overflow, contrast
  python3 qa.py final <video.mp4>                # loudness, true peak, black/frozen frames, A/V length, contact sheet
  python3 qa.py all <storyboard.json> <video.mp4> [hf_project_dir]   # everything -> output/qa_report.md
  python3 qa.py thumb <video.mp4>               # frame 00:00:00 cover-ready? exit 3 = not deliverable
  python3 qa.py precheck <storyboard.json> [hf_project_dir|lemo_dir] # BEFORE render; exit 2 = blocking issues

Exit code is 0, except `precheck`, which exits 2 when something must be fixed before spending render time. Read the report and fix what matters.
"""
import hashlib, json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "output")

STRETCH_S = 0.65      # a single word held longer than this sounds dragged
PAUSE_S = 0.45        # a pause mid-sentence (not after punctuation) longer than this sounds odd
PACE = (1.8, 3.6)     # words per second, comfortable Indonesian narration


def sh(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, **kw)


def tokens(text):
    return [t for t in re.split(r"\s+", text.strip()) if re.search(r"\w", t)]


# ---------------------------------------------------------------- voice-over
def qa_vo(sb_path):
    return qa_vo_full(sb_path)[0]


def qa_vo_full(sb_path):
    """-> (report text, blocking issues). Blocking = a word skipped/merged (count mismatch) or VO missing."""
    blocking = []
    sb = json.load(open(sb_path))
    if sb.get("vo_source"):   # remake with a source voice: no TTS to check (wording follows the recording)
        return "### Voice-over\n- source voice (" + str(sb["vo_source"].get("credit", "external")) + "): TTS checks skipped\n", []
    voice = sb.get("voice") or os.environ.get("CARTESIA_VOICE_ID", "")
    lines, issues = [], 0
    for s in sb["scenes"]:
        cfg = "|".join(os.environ.get(k, "") for k in ("CARTESIA_MODEL", "CARTESIA_EMOTION", "CARTESIA_SPEED", "CARTESIA_VOLUME"))
        h = hashlib.sha1(f"{voice}|{s['vo']}{('|' + cfg) if cfg.strip('|') else ''}".encode()).hexdigest()[:16]
        side = os.path.join(OUT, "vo", f"{h}.words.json")
        mp3 = os.path.join(OUT, "vo", f"{h}.mp3")
        if not os.path.exists(side):
            lines.append(f"- scene {s['id']}: VO not generated yet"); blocking.append(f"scene {s['id']}: VO missing"); continue
        d = json.load(open(side))
        ws = d["words"]
        notes = []
        n_script, n_audio = len(tokens(s["vo"])), len(ws)
        if n_script != n_audio:
            notes.append(f"word count script {n_script} ≠ audio {n_audio} (possible skipped/merged word)")
            blocking.append(f"scene {s['id']}: word count {n_script} vs {n_audio}")
        for i, w in enumerate(ws):
            dur = (w["end_ms"] - w["start_ms"]) / 1000
            if dur > STRETCH_S:
                notes.append(f"stretched '{w['text']}' {dur:.2f}s @{w['start_ms']/1000:.1f}s")
            if i > 0:
                gap = (w["start_ms"] - ws[i - 1]["end_ms"]) / 1000
                if gap > PAUSE_S and not re.search(r"[.,!?;:]$", ws[i - 1]["text"]):
                    notes.append(f"odd pause {gap:.2f}s before '{w['text']}'")
        speech = (ws[-1]["end_ms"] - ws[0]["start_ms"]) / 1000 if ws else 0
        wps = n_audio / speech if speech else 0
        if wps and not (PACE[0] <= wps <= PACE[1]):
            notes.append(f"pace {wps:.1f} words/s (comfortable {PACE[0]}–{PACE[1]})")
        if os.path.exists(mp3):
            r = sh(["ffmpeg", "-hide_banner", "-i", mp3, "-af", "astats=metadata=0", "-f", "null", "-"])
            m = re.findall(r"Peak level dB:\s*(-?[\d.]+|-?inf)", r.stderr)
            if m and m[-1] not in ("-inf",) and float(m[-1]) > -0.3:
                notes.append(f"near-clipping peak {m[-1]} dBFS")
        issues += len(notes)
        mark = "⚠️" if notes else "✅"
        lines.append(f"- {mark} scene {s['id']} ({d['duration_ms']/1000:.1f}s, {wps:.1f} w/s)" + ("".join(f"\n    - {n}" for n in notes)))
    head = f"### Voice-over ({issues} note{'s' if issues != 1 else ''})"
    tip = ("\n  Fix: rewrite the line (shorter words, commas where a pause is wanted, phonetic spelling) and re-run produce.py;"
           " only changed scenes are re-generated.") if issues else ""
    return head + "\n" + "\n".join(lines) + tip, blocking


# ---------------------------------------------------------------- visual (HyperFrames)
def qa_visual(proj):
    return qa_visual_full(proj)[0]


BLOCKING_SECTIONS = ("runtime", "layout", "contrast", "lint")


def qa_visual_full(proj, allow=()):
    """-> (report text, blocking issues). Blocking = any error in runtime/layout/contrast/lint whose code is not in `allow`."""
    blocking = []
    hf = os.path.join(ROOT, "hyperframes", "node_modules", ".bin", "hyperframes")
    if not (os.path.exists(hf) and os.path.isdir(proj)):
        return "### Visual\n- skipped (HyperFrames project not found)", blocking
    proj = os.path.abspath(proj)
    r = sh([hf, "check", proj, "--json"], cwd=os.path.join(ROOT, "hyperframes"), timeout=600)
    try:
        d = json.loads(r.stdout[r.stdout.index("{"):])
    except Exception:
        return "### Visual\n- hyperframes check failed:\n```\n" + (r.stderr or r.stdout)[-800:] + "\n```", ["hyperframes check failed"]
    lines = []
    total_err = 0
    for k in ("lint", "runtime", "layout", "contrast", "motion", "audio"):
        sec = d.get(k) or {}
        if not isinstance(sec, dict) or "errorCount" not in sec:
            continue
        e, w = sec.get("errorCount", 0), sec.get("warningCount", 0)
        total_err += e
        lines.append(f"- {'⚠️' if e else '✅'} {k}: {e} error, {w} warning")
        if k in BLOCKING_SECTIONS:
            for f in sec.get("findings") or []:
                if f.get("severity") == "error" and f.get("code") not in allow:
                    t = f.get("time")
                    blocking.append(f"{k}/{f.get('code')} {('@%.1fs ' % t) if isinstance(t, (int, float)) else ''}{f.get('selector','')}")
        for f in (sec.get("findings") or [])[:6]:
            t = f.get("time")
            lines.append(f"    - [{f.get('severity')}] {f.get('code')} {('@%.1fs ' % t) if isinstance(t, (int, float)) else ''}{f.get('selector','')}: {f.get('message','')[:140]}")
    note = ("\n  Note: overlap on purpose (double-printed titles, labels on maps) is fine; check each finding against the contact sheet."
            if total_err else "")
    return "### Visual (hyperframes check)\n" + "\n".join(lines) + note, blocking


LEMO_BLOCKING = ("runtime", "text_overflow", "out_of_frame", "outside_safe_area", "caption_outside_band", "text_overlap")


def qa_lemo_full(proj, allow=()):
    """Lemo-native kit: composition check on window.TEXTS (lemo/render.mjs layout) + one still per scene -> output/qa_prerender.jpg."""
    rep = os.path.join(OUT, "qa_layout.json")
    r = sh(["node", os.path.join(ROOT, "lemo", "render.mjs"), proj, "layout", rep], timeout=900)
    if r.returncode != 0 or not os.path.exists(rep):
        return "### Visual (Lemo layout)\n- layout check failed: " + (r.stderr or r.stdout)[-600:], ["layout check failed"]
    d = json.load(open(rep))
    issues = d["issues"]
    blocking = [f"{i['code']} {i['where']}: {i['text']}" for i in issues if i["code"] in LEMO_BLOCKING and i["code"] not in allow]
    lines = [f"- {'⚠️' if issues else '✅'} composition (9:16 safe area, captions band, overlaps, overflow): {len(issues)} issue(s) in {d['scenes']} scenes"]
    lines += [f"    - {i['code']} {i['where']}: {i['text']}" + (f" box={i['box']}" if i.get('box') else '') + (f" — {i['msg']}" if i.get('msg') else '') for i in issues[:12]]
    # one still per scene (at ~70%) for the eye
    props = open(os.path.join(proj, "props.js"), encoding="utf-8").read()
    data = json.loads(props[props.index("=") + 1:].rstrip().rstrip(";"))
    ts = [str(round((sc["startMs"] + sc["durationMs"] * .7) / 1000, 2)) for sc in data["scenes"]]
    tmp = os.path.join(OUT, "qa_stills"); subprocess.run(["rm", "-rf", tmp])
    if sh(["node", os.path.join(ROOT, "lemo", "render.mjs"), proj, "stills", tmp, *ts], timeout=900).returncode == 0:
        cols = min(5, len(ts))
        sh(["ffmpeg", "-y", "-loglevel", "error", "-pattern_type", "glob", "-i", os.path.join(tmp, "*.png"), "-vf", f"scale=360:640,tile={cols}x{(len(ts) + cols - 1) // cols}:padding=4",
            "-frames:v", "1", os.path.join(OUT, "qa_prerender.jpg")])
        lines.append("- stills per scene -> output/qa_prerender.jpg (look at it before the render)")
    return "### Visual (Lemo-native kit)\n" + "\n".join(lines), blocking


# ---------------------------------------------------------------- final file
IMG_BLOCK, IMG_WARN = 0.38, 0.50   # share of each AI image visible on screen (template full-bleed ≈ 0.43)


def qa_images_full(proj, allow=()):
    """-> (report text, blocking issues). Measures how much of each AI image is on screen (scripts/qa_images.js).
    Blocking = an image with < IMG_BLOCK visible (cropped by its box, object-fit, zoom or the frame), unless "image_crop" is allowed."""
    if not os.path.isdir(os.path.join(proj, "assets", "img")):
        return "### Images\n- no AI images", []
    r = sh(["node", os.path.join(ROOT, "scripts", "qa_images.js"), proj, "0"], timeout=300)
    try:
        res = json.loads(r.stdout.strip().splitlines()[-1])
    except Exception:
        return "### Images\n- image check failed:\n```\n" + (r.stderr or r.stdout)[-600:] + "\n```", ["image check failed"]
    lines, block = [], []
    for x in res:
        v = x["visible"]
        mark = "❌" if v < IMG_BLOCK else "⚠️" if v < IMG_WARN else "✅"
        lines.append(f"- {mark} scene {x['scene']} @{x['t']}s: {int(v * 100)}% of the image visible")
        if v < IMG_BLOCK and "image_crop" not in allow:
            block.append(f"images/image_crop scene {x['scene']}: only {int(v * 100)}% of the image visible (min {int(IMG_BLOCK * 100)}%)")
    tip = ("\n  Fix: show the picture whole — box close to the image's 1:1 aspect, object-fit cover in a box no wider than the frame, "
           "Ken Burns ≤ 1.08, no fixed 1920px width with a reduced height." if block else "")
    return "### Images (visible share)\n" + ("\n".join(lines) or "- none rendered") + tip, block


def qa_final(mp4):
    if not os.path.exists(mp4):
        return f"### Final file\n- missing: {mp4}"
    lines = []
    r = sh(["ffmpeg", "-hide_banner", "-i", mp4, "-af", "ebur128=peak=true:framelog=quiet", "-f", "null", "-"])
    I = re.findall(r"I:\s*(-?[\d.]+) LUFS", r.stderr)
    TP = re.findall(r"Peak:\s*(-?[\d.]+) dBFS", r.stderr)
    if I:
        i = float(I[-1]); ok = -15.5 <= i <= -12.5
        lines.append(f"- {'✅' if ok else '⚠️'} loudness {i:.1f} LUFS (target −14)")
    if TP:
        tp = float(TP[-1]); lines.append(f"- {'✅' if tp <= -1.0 else '⚠️'} true peak {tp:.1f} dBTP (≤ −1)")
    r = sh(["ffmpeg", "-hide_banner", "-i", mp4, "-vf", "blackdetect=d=0.25:pix_th=0.06,freezedetect=n=0.001:d=2.5", "-an", "-f", "null", "-"])
    blacks = re.findall(r"black_start:([\d.]+) black_end:([\d.]+)", r.stderr)
    freezes = re.findall(r"freeze_start: ([\d.]+)", r.stderr)
    lines.append(f"- {'⚠️' if blacks else '✅'} black frames: " + (", ".join(f"{float(a):.1f}–{float(b):.1f}s" for a, b in blacks) if blacks else "none"))
    lines.append(f"- {'⚠️' if freezes else '✅'} frozen picture ≥2.5s: " + (", ".join(f"@{float(a):.1f}s" for a in freezes) if freezes else "none"))
    r = sh(["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,duration", "-of", "json", mp4])
    st = {s["codec_type"]: float(s.get("duration", 0)) for s in json.loads(r.stdout).get("streams", [])}
    if "video" in st and "audio" in st:
        diff = abs(st["video"] - st["audio"])
        lines.append(f"- {'✅' if diff < 0.25 else '⚠️'} A/V length video {st['video']:.2f}s / audio {st['audio']:.2f}s")
    else:
        lines.append(f"- ⚠️ streams: {list(st)} (audio missing?)")
    sheet = os.path.join(OUT, "qa_sheet.jpg")
    dur = st.get("video", 60) or 60
    every = max(1.0, dur / 15)
    sh(["ffmpeg", "-v", "error", "-y", "-i", mp4, "-vf", f"fps=1/{every:.3f},scale=216:384,tile=5x3", "-frames:v", "1", sheet])
    lines.append(f"- contact sheet: {sheet} (one frame every {every:.1f}s — look at it before delivering)")
    return "### Final file\n" + "\n".join(lines)


# ---------------------------------------------------------------- thumbnail at 00:00:00 (owner rule 2026-11-26)
THUMB_STD = 22        # luma std-dev below this = flat/blank frame
THUMB_MEAN = 10       # mean luma below this = black frame
THUMB_RATIO = 0.6     # frame 0 detail < 60% of the 1.0 s frame = elements still fading in


def _frame_stats(mp4, t, path):
    from PIL import Image, ImageFilter
    import numpy as np
    sh(["ffmpeg", "-v", "error", "-y", "-ss", f"{t}", "-i", mp4, "-frames:v", "1", path])
    if not os.path.exists(path):
        return None
    g = Image.open(path).convert("L")
    a = np.asarray(g, dtype=float)
    edges = np.asarray(g.filter(ImageFilter.FIND_EDGES), dtype=float).mean()
    return a.mean(), a.std(), edges


def qa_thumbnail_sb(sb_path):
    """-> blocking issues: scene 1 must carry a "thumbnail" spec."""
    sc = (json.load(open(sb_path)).get("scenes") or [{}])[0]
    th = sc.get("thumbnail")
    if not th:
        return ["thumbnail: scene 1 has no \"thumbnail\" field (judul, subjudul, visual) — frame 00:00:00 must be cover-ready"]
    if isinstance(th, dict) and not th.get("judul") and not th.get("title"):
        return ["thumbnail: scene 1 \"thumbnail\" has no judul/title"]
    return []


def qa_thumbnail(mp4):
    """-> (report text, blocking issues). Frame 0 must be a full, cover-ready picture."""
    path = os.path.join(OUT, "qa_thumb.jpg")
    s0 = _frame_stats(mp4, 0, path)
    s1 = _frame_stats(mp4, 1.0, os.path.join(OUT, "qa_thumb_1s.jpg"))
    if not s0:
        return "### Thumbnail 00:00:00\n- ❌ could not extract frame 0", ["thumbnail: frame 0 missing"]
    block = []
    m, sd, ed = s0
    if m < THUMB_MEAN:
        block.append(f"thumbnail: frame 0 is black (mean luma {m:.0f})")
    elif sd < THUMB_STD:
        block.append(f"thumbnail: frame 0 is flat/blank (contrast {sd:.0f} < {THUMB_STD})")
    if s1 and s1[2] > 0 and ed < THUMB_RATIO * s1[2]:
        block.append(f"thumbnail: frame 0 has {ed / s1[2]:.0%} of the detail at 1.0 s — title/visual still appearing (show it fully at t=0)")
    head = "❌" if block else "✅"
    txt = (f"### Thumbnail 00:00:00\n- {head} frame 0: luma {m:.0f}, contrast {sd:.0f}, detail {ed:.1f}"
           + (f" (1.0 s: {s1[2]:.1f})" if s1 else "") + f"\n- frame 0 image: {path} (look at it: big 2-line hook title + one central visual)")
    return txt + "".join(f"\n- ❌ {b}" for b in block), block


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    cmd = sys.argv[1]
    if cmd == "vo":
        print(qa_vo(sys.argv[2]))
    elif cmd == "visual":
        print(qa_visual(sys.argv[2]))
    elif cmd == "thumb":
        t, b = qa_thumbnail(sys.argv[2]); print(t); sys.exit(3 if b else 0)
    elif cmd == "final":
        print(qa_final(sys.argv[2]))
    elif cmd == "precheck":
        sb = sys.argv[2]
        hf_dir = sys.argv[3] if len(sys.argv) > 3 else None
        allow = tuple(json.load(open(sb)).get("qa_allow", []))
        vo_txt, vo_block = qa_vo_full(sb)
        parts, block = ["## Pre-render QA", vo_txt], list(vo_block) + qa_thumbnail_sb(sb)
        if hf_dir:
            v_txt, v_block = (qa_lemo_full if os.path.exists(os.path.join(hf_dir, "kit.js")) else qa_visual_full)(hf_dir, allow)
            parts.append(v_txt); block += v_block
            i_txt, i_block = qa_images_full(hf_dir, allow)
            parts.append(i_txt); block += i_block
        verdict = ("### ❌ BLOCKED — fix before rendering:\n" + "\n".join(f"- {b}" for b in block[:20])
                   + ("\n  (intended overlaps: add the code to storyboard \"qa_allow\", or re-run with --accept-qa)" if block else "")) if block else "### ✅ Pre-render QA passed"
        rep = "\n\n".join(parts + [verdict]) + "\n"
        open(os.path.join(OUT, "qa_precheck.md"), "w").write(rep)
        print(rep)
        sys.exit(2 if block else 0)
    elif cmd == "all":
        sb, mp4 = sys.argv[2], sys.argv[3]
        parts = [f"## QA — {os.path.basename(mp4)}", qa_vo(sb)]
        if len(sys.argv) > 4:
            parts.append(qa_visual(sys.argv[4]))
        parts.append(qa_final(mp4))
        t_txt, t_block = qa_thumbnail(mp4)
        parts.append(t_txt)
        if t_block:
            parts.append("### ❌ DO NOT DELIVER — frame 00:00:00 is not cover-ready:\n" + "\n".join(f"- {b}" for b in t_block))
        rep = "\n\n".join(parts) + "\n"
        open(os.path.join(OUT, "qa_report.md"), "w").write(rep)
        print(rep)
        sys.exit(3 if t_block else 0)
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main()
