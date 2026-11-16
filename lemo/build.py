#!/usr/bin/env python3
"""Assemble a Lemo-native kit page for one video: output/lemo/{index.html, kit.js, props.js, fonts/, img/}.

  python3 lemo/build.py <slug> <timing.json> [<out_dir>]

timing.json = produce.py timing_data(): {totalMs, title, scenes:[{..., startMs, durationMs, imageSrc?}], words:[{text,startMs,endMs}]}
"""
import json, os, shutil, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KITS = os.path.join(ROOT, "lemo", "kits")


def manifest():
    return json.load(open(os.path.join(KITS, "kits.json")))


def build(slug, data, out_dir):
    src = os.path.join(KITS, slug)
    if not os.path.isfile(os.path.join(src, "index.html")):
        sys.exit(f"no Lemo-native kit for '{slug}'. Kits: {', '.join(manifest())}")
    shutil.rmtree(out_dir, ignore_errors=True)
    shutil.copytree(src, out_dir)
    shutil.copy(os.path.join(ROOT, "lemo", "kit.js"), out_dir)
    shutil.copytree(os.path.join(ROOT, "assets", "fonts"), os.path.join(out_dir, "fonts"))
    img = os.path.join(ROOT, "output", "img")
    if os.path.isdir(img):
        shutil.copytree(img, os.path.join(out_dir, "img"))
    open(os.path.join(out_dir, "props.js"), "w", encoding="utf-8").write("window.PROPS=" + json.dumps(data, ensure_ascii=False) + ";")
    return out_dir


if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    out = sys.argv[3] if len(sys.argv) > 3 else os.path.join(ROOT, "output", "lemo")
    print(build(sys.argv[1], json.load(open(sys.argv[2])), out))
