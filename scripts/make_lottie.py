#!/usr/bin/env python3
"""Generate the shared Lottie (bodymovin JSON) assets used by the HyperFrames and Remotion modes.

LottieFiles is not reachable from the cloud container, so the library is authored here.
Usage: python3 make_lottie.py [out_dir]   (default: assets/lottie)

Animations (512x512, 30 fps, 2 s, seamless loop):
  pulse    three expanding rings (location ping / alert)
  burst    12 dots shooting outward (impact, reveal)
  sparkle  4-point stars twinkling (glory, highlight)
  dust     drifting particles (atmosphere)
  ring     a circle stroke drawing itself (focus / emphasis)
Each in gold, white and red variants: <name>-<color>.json
"""
import json, math, os, random, sys

FR, OP, W = 30, 60, 512
COLORS = {"gold": [0.914, 0.71, 0.322], "white": [1, 0.97, 0.9], "red": [0.86, 0.27, 0.23]}
EASE_OUT = {"o": {"x": [0.16], "y": [1]}, "i": {"x": [0.3], "y": [1]}}
LIN = {"o": {"x": [0], "y": [0]}, "i": {"x": [1], "y": [1]}}


def anim(keys, ease=EASE_OUT):
    """keys: [(t, value_list)]"""
    out = []
    for i, (t, v) in enumerate(keys):
        k = {"t": t, "s": v}
        if i < len(keys) - 1:
            k.update(ease)
        out.append(k)
    return {"a": 1, "k": out}


st = lambda v: {"a": 0, "k": v}


def transform(p=None, s=None, o=None, r=None):
    return {"ty": "tr", "p": p or st([0, 0]), "a": st([0, 0]), "s": s or st([100, 100]), "r": r or st(0), "o": o or st(100)}


def layer(ind, shapes, p=None, s=None, o=None, r=None, ip=0, op=OP):
    return {
        "ddd": 0, "ind": ind, "ty": 4, "nm": f"l{ind}", "sr": 1, "ip": ip, "op": op, "st": 0, "bm": 0,
        "ks": {"o": o or st(100), "r": r or st(0), "p": p or st([W / 2, W / 2, 0]), "a": st([0, 0, 0]), "s": s or st([100, 100, 100])},
        "shapes": shapes,
    }


def ellipse(size, fill=None, stroke=None, width=8, trim=None):
    items = [{"ty": "el", "p": st([0, 0]), "s": st([size, size])}]
    if trim:
        items.append({"ty": "tm", "s": st(0), "e": trim, "o": st(0), "m": 1})
    if stroke:
        items.append({"ty": "st", "c": st(stroke + [1]), "o": st(100), "w": st(width), "lc": 2, "lj": 2})
    if fill:
        items.append({"ty": "fl", "c": st(fill + [1]), "o": st(100), "r": 1})
    items.append(transform())
    return [{"ty": "gr", "it": items}]


def star4(size, color):
    a, b = size / 2, size / 9
    v = [[0, -a], [b, -b], [a, 0], [b, b], [0, a], [-b, b], [-a, 0], [-b, -b]]
    z = [[0, 0]] * len(v)
    return [{"ty": "gr", "it": [
        {"ty": "sh", "ks": st({"c": True, "v": v, "i": z, "o": z})},
        {"ty": "fl", "c": st(color + [1]), "o": st(100), "r": 1},
        transform(),
    ]}]


def doc(name, layers):
    return {"v": "5.7.4", "fr": FR, "ip": 0, "op": OP, "w": W, "h": W, "nm": name, "ddd": 0, "assets": [], "layers": layers}


def pulse(c):
    ls = []
    for i in range(3):
        t0 = i * 20
        # each ring loops: grows over 60 frames, offset; wrap by duplicating with negative offset
        for off in (t0, t0 - OP):
            ls.append(layer(len(ls) + 1, ellipse(440, stroke=c, width=10),
                            s=anim([(off, [10, 10, 100]), (off + OP, [100, 100, 100])], LIN),
                            o=anim([(off, [100]), (off + OP, [0])], LIN)))
    ls.append(layer(len(ls) + 1, ellipse(70, fill=c)))
    return doc("pulse", ls)


def burst(c):
    ls = []
    n = 12
    for i in range(n):
        ang = i / n * math.tau
        end = [W / 2 + math.cos(ang) * 220, W / 2 + math.sin(ang) * 220, 0]
        ls.append(layer(i + 1, ellipse(26, fill=c),
                        p=anim([(0, [W / 2, W / 2, 0]), (36, end)]),
                        s=anim([(0, [100, 100, 100]), (36, [30, 30, 100])]),
                        o=anim([(0, [100]), (24, [100]), (40, [0])], LIN)))
    ls.append(layer(n + 1, ellipse(300, stroke=c, width=6),
                    s=anim([(0, [10, 10, 100]), (30, [130, 130, 100])]),
                    o=anim([(0, [100]), (30, [0])], LIN)))
    return doc("burst", ls)


def sparkle(c):
    rnd = random.Random(7)
    ls = []
    for i in range(6):
        x, y = 80 + rnd.random() * 352, 80 + rnd.random() * 352
        sz = 60 + rnd.random() * 90
        t0 = int(i * 10)
        keys = lambda a, b: anim([(t0, a), (t0 + 15, b), (t0 + 30, a)])
        ls.append(layer(i + 1, star4(sz, c), p=st([x, y, 0]),
                        s=anim([(t0, [0, 0, 100]), (t0 + 15, [100, 100, 100]), (t0 + 30, [0, 0, 100])]),
                        r=anim([(t0, [0]), (t0 + 30, [90])], LIN)))
    return doc("sparkle", ls)


def dust(c):
    rnd = random.Random(3)
    ls = []
    for i in range(24):
        x, y = rnd.random() * W, rnd.random() * W
        dx, dy = 40 + rnd.random() * 60, -20 - rnd.random() * 40
        ls.append(layer(i + 1, ellipse(4 + rnd.random() * 10, fill=c),
                        p=anim([(0, [x, y, 0]), (OP, [x + dx, y + dy, 0])], LIN),
                        o=anim([(0, [0]), (20, [70]), (40, [70]), (OP, [0])], LIN)))
    return doc("dust", ls)


def ring(c):
    trim = anim([(0, [0]), (40, [100])])
    return doc("ring", [layer(1, ellipse(400, stroke=c, width=12, trim=trim), r=st(-90))])


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "lottie")
    os.makedirs(out, exist_ok=True)
    for fn in (pulse, burst, sparkle, dust, ring):
        for cname, c in COLORS.items():
            path = os.path.join(out, f"{fn.__name__}-{cname}.json")
            json.dump(fn(c), open(path, "w"), separators=(",", ":"))
    print(f"OK  {len(os.listdir(out))} files in {out}")


if __name__ == "__main__":
    main()
