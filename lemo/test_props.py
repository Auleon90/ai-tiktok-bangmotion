#!/usr/bin/env python3
"""Fake timing data for kit development (no TTS): words spread evenly over each scene's vo text.

  python3 lemo/test_props.py <storyboard.json> <out timing.json> [--with-images]

Scene length ~ 0.42 s per word + 0.6 s. Images are taken from output/img/ only when they already exist (cached FLUX)."""
import hashlib, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "scripts"))


def main():
    sb = json.load(open(sys.argv[1]))
    cur, scenes, words = 0, [], []
    from produce import DEFAULT_IMAGE_STYLE  # noqa: E402
    for s in sb["scenes"]:
        ws = s["vo"].split()
        dur = int(len(ws) * 420 + 900)
        for k, w in enumerate(ws):
            a = cur + 200 + k * 420
            words.append({"text": w, "startMs": a, "endMs": a + 380})
        sc = {k: v for k, v in s.items() if k not in ("image",)}
        if s.get("image") and "--with-images" in sys.argv:
            spec = s["image"]; prompt = spec if isinstance(spec, str) else spec["prompt"]; steps = 6 if isinstance(spec, str) else spec.get("steps", 6)
            style = sb.get("image_style", DEFAULT_IMAGE_STYLE)
            h = hashlib.sha1(f"{steps}|{prompt}, {style}".encode()).hexdigest()[:16]
            if os.path.exists(os.path.join(ROOT, "output", "img", f"{h}.jpg")):
                sc["imageSrc"] = f"img/{h}.jpg"
        scenes.append({**sc, "startMs": cur, "durationMs": dur, "vo_ms": dur - 600})
        cur += dur
    json.dump({"totalMs": cur + 900, "title": sb.get("title", ""), "theme": sb.get("theme", {}), "scenes": scenes, "words": words},
              open(sys.argv[2], "w"), ensure_ascii=False)


if __name__ == "__main__":
    main()
