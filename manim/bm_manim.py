"""bang-motion helpers for Manim scenes (mode 3).

A video scene file (written per video, e.g. output/manim_scene.py) does:

    import sys; sys.path.insert(0, "<repo>/manim")
    from bm_manim import *

    class Video(BMScene):
        def construct(self):
            for sc in self.scenes:          # storyboard scenes with real timings (seconds)
                self.at(sc)                 # waits until the scene's start time
                ...animate with self.play(..., run_time=...)
            self.finish()                   # pads to the exact voiceover length

Captions are NOT drawn in Manim: scripts/produce.py burns word-synced captions in afterwards
(keep y < -1.4 free). There is no LaTeX in the container: use Text / MarkupText,
not MathTex / Tex. Fonts: "Inter", "Playfair Display", "Amiri" are registered automatically.
"""
import json, os
from pathlib import Path

from manim import *  # noqa: F401,F403
from manim import Scene, config

ROOT = Path(__file__).resolve().parent.parent

# Vertical 9:16 frame: 4.5 x 8 units (x: -2.25..2.25, y: -4..4).
# Keep content inside y in [-1.4, 3.6]: the bottom is reserved for burned-in captions (pixel y 1320+).
config.frame_width = 4.5
config.frame_height = 8.0
FONT_CACHE = ROOT / "output" / ".fonts_ttf"

# palette (matches the other modes)
BG = "#120c1c"
TEXT = "#f6efe2"
ACCENT = "#e9b552"
MUTED = "#b9a88f"
GREEN = "#4fb477"
RED = "#d2463a"
BLUE = "#5aa9e6"


def _ttf_fonts():
    """Pango cannot read woff2; convert assets/fonts/*.woff2 to TTF once."""
    FONT_CACHE.mkdir(parents=True, exist_ok=True)
    from fontTools.ttLib import TTFont
    for src in (ROOT / "assets" / "fonts").glob("*.woff2"):
        dst = FONT_CACHE / (src.stem + ".ttf")
        if not dst.exists():
            f = TTFont(str(src)); f.flavor = None; f.save(str(dst))
    return FONT_CACHE


def _register_fonts():
    try:
        import manimpango
        for ttf in _ttf_fonts().glob("*.ttf"):
            manimpango.register_font(str(ttf))
    except Exception as e:  # fonts are cosmetic; never fail the render
        print("font registration skipped:", e)


_register_fonts()


class Props:
    def __init__(self, path=None):
        path = path or os.environ.get("BM_PROPS", str(ROOT / "output" / "manim_props.json"))
        d = json.load(open(path))
        self.total = d["totalMs"] / 1000
        self.scenes = [dict(s, start=s["startMs"] / 1000, dur=s["durationMs"] / 1000) for s in d["scenes"]]
        self.words = [dict(w, start=w["startMs"] / 1000, end=w["endMs"] / 1000) for w in d["words"]]


class BMScene(Scene):
    """Scene with storyboard timing. self.scenes: list of dicts with start/dur (s) + storyboard fields."""

    def setup(self):
        config.background_color = BG
        self.camera.background_color = BG
        self.P = Props()
        self.scenes = self.P.scenes
        self.words = self.P.words

    # --- timing ---
    def at(self, t):
        """Wait until absolute time t (seconds, or a scene dict)."""
        t = t["start"] if isinstance(t, dict) else t
        gap = t - self.renderer.time
        if gap > 1e-3:
            self.wait(gap)

    def remaining(self, sc):
        """Seconds left in scene sc from now."""
        return max(0.0, sc["start"] + sc["dur"] - self.renderer.time)

    def finish(self):
        self.at(self.P.total)

    # --- helpers ---
    def eyebrow(self, text):
        t = Text(text.upper(), font="Inter", weight="BOLD", color=ACCENT).scale(0.32)
        box = RoundedRectangle(corner_radius=0.22, width=t.width + 0.6, height=t.height + 0.35, stroke_color=ACCENT, stroke_width=2)
        g = VGroup(box, t).move_to(UP * 3.1)
        return g

    def clear_scene(self, run_time=0.4):
        if self.mobjects:
            self.play(*[FadeOut(m) for m in self.mobjects], run_time=run_time)
