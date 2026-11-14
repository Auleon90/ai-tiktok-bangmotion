#!/usr/bin/env python3
"""One-shot producer: storyboard.json -> TTS (cached) -> mixed audio -> Remotion props -> MP4.

Usage:
  python3 produce.py <storyboard.json> <out.mp4> [--draft] [--no-render]

Storyboard format: see .claude/skills/bang-motion.md (Remotion engine).
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


def tts_cached(text: str) -> tuple[str, dict]:
    voice = os.environ.get("CARTESIA_VOICE_ID", "")
    h = hashlib.sha1(f"{voice}|{text}".encode()).hexdigest()[:16]
    mp3 = os.path.join(VO_DIR, f"{h}.mp3")
    side = os.path.join(VO_DIR, f"{h}.words.json")
    if not (os.path.exists(mp3) and os.path.exists(side)):
        print(f"  TTS  {text[:60]}...")
        run([sys.executable, os.path.join(ROOT, "scripts", "tts.py"), text, mp3])
    else:
        print(f"  TTS  (cache) {text[:50]}...")
    with open(side) as f:
        return mp3, json.load(f)


def ms2f(ms: float) -> int:
    return int(round(ms / 1000 * FPS))


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    flags = {a for a in sys.argv[1:] if a.startswith("--")}
    if len(args) < 2:
        sys.exit(__doc__)
    sb_path, out_mp4 = args
    os.makedirs(VO_DIR, exist_ok=True)
    sb = json.load(open(sb_path))

    print("STEP  voiceover")
    cursor = 0
    segs, scenes, words = [], [], []
    for s in sb["scenes"]:
        mp3, meta = tts_cached(s["vo"])
        pad = s.get("pad_before_ms", 0)
        gap = s.get("gap_after_ms", DEFAULT_GAP)
        vo_start = cursor + pad
        segs.append((mp3, vo_start))
        for w in meta["words"]:
            words.append({"text": w["text"], "startFrame": ms2f(vo_start + w["start_ms"]), "endFrame": ms2f(vo_start + w["end_ms"])})
        dur = pad + meta["duration_ms"] + gap
        visual = {k: v for k, v in s.items() if k not in ("vo", "pad_before_ms", "gap_after_ms")}
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
    amb = sb.get("ambience", "wind")
    if amb == "wind":
        # synthetic desert wind: brown noise, band-limited, slow swell, ducked under voice
        dur = total_ms / 1000
        fc = (
            f"anoisesrc=color=brown:amplitude=0.6:duration={dur}:sample_rate=44100,"
            "lowpass=f=900,highpass=f=80,tremolo=f=0.15:d=0.6,volume=0.22,aformat=channel_layouts=stereo[wind];"
            "[0:a]asplit=2[v1][v2];"
            "[wind][v2]sidechaincompress=threshold=0.02:ratio=6:attack=40:release=600[duck];"
            "[v1][duck]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[out]"
        )
        run(["ffmpeg", "-y", "-i", voice_wav, "-filter_complex", fc, "-map", "[out]", "-ar", "44100", "-c:a", "libmp3lame", "-q:a", "1", final_audio])
    else:
        run(["ffmpeg", "-y", "-i", voice_wav, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", "44100", "-c:a", "libmp3lame", "-q:a", "1", final_audio])

    props = {"fps": FPS, "totalFrames": total_frames, "audio": "audio.mp3", "theme": sb.get("theme", {}), "scenes": scenes, "words": words}
    props_path = os.path.join(OUT, "props.json")
    json.dump(props, open(props_path, "w"), ensure_ascii=False, indent=1)
    print(f"  total {total_ms/1000:.1f}s  {total_frames} frames  {len(words)} words  -> {props_path}")

    if "--no-render" in flags:
        return
    print("STEP  render (Remotion)")
    cmd = ["node", os.path.join(REMOTION, "render.mjs"), props_path, os.path.abspath(out_mp4)]
    if "--draft" in flags:
        cmd.append("--draft")
    p = subprocess.run(cmd, cwd=REMOTION)
    if p.returncode != 0:
        sys.exit("render failed")
    size = os.path.getsize(out_mp4) / 1e6
    print(f"DONE  {out_mp4}  {total_ms/1000:.1f}s  {size:.1f} MB")


if __name__ == "__main__":
    main()
