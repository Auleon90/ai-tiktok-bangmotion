#!/usr/bin/env python3
"""Lemo-Opuscar style library helper (styles are downloaded by setup.sh into .lemo/, git-ignored).

  python3 scripts/styles.py list                 # all styles: slug, name, category, uses
  python3 scripts/styles.py search <words...>    # match slug/name/category/uses/logline
  python3 scripts/styles.py show <slug>          # path to STYLE.md + metadata

Licence: the STYLE.md docs are CC BY-NC 4.0 with an extra permission to read/adapt them to make your own
films (commercial included). Do NOT commit them to this repo or share them; only the films we make are ours.
Credit when a style is used: "Style: <name> from Lemo-Opuscar by Lemomo (LemoLab)".
"""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIB = os.path.join(ROOT, ".lemo", "lemo-opuscar", "styles")


def load():
    if not os.path.isdir(LIB):
        sys.exit("style library missing: run bash scripts/setup.sh")
    out = []
    for slug in sorted(os.listdir(LIB)):
        j = os.path.join(LIB, slug, "style.json")
        if os.path.exists(j):
            d = json.load(open(j))
            out.append(d)
    return out


def row(d):
    return f"{d['slug']:<24} {d['en']:<28} {d.get('category_en',''):<24} {', '.join(d.get('uses', []))[:60]}"


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "list"
    styles = load()
    if cmd == "list":
        for d in styles:
            print(row(d))
    elif cmd == "search":
        words = [w.lower() for w in sys.argv[2:]]
        for d in styles:
            hay = " ".join([d["slug"], d["en"], d.get("category_en", ""), " ".join(d.get("uses", [])), d.get("line", "")]).lower()
            if all(w in hay for w in words):
                print(row(d))
    elif cmd == "show":
        slug = sys.argv[2]
        d = next((x for x in styles if x["slug"] == slug), None)
        if not d:
            sys.exit(f"unknown style {slug}")
        print(json.dumps({k: d[k] for k in ("slug", "en", "category_en", "uses", "line", "dur") if k in d}, ensure_ascii=False, indent=1))
        print("STYLE.md:", os.path.join(LIB, slug, "STYLE.md"))
        print("poster:  ", os.path.join(LIB, slug, "poster.jpg"))
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main()
