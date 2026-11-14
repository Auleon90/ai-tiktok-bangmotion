"""Manim scene for examples/pythagoras.storyboard.json (mode 3).
Render: python3 scripts/produce.py examples/pythagoras.storyboard.json output/py.mp4 --engine=manim --scene=examples/pythagoras_manim.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "manim"))
from bm_manim import *  # noqa: E402,F403


class Video(BMScene):
    def construct(self):
        s1, s2, s3, s4 = self.scenes

        # 1 — title
        self.at(s1)
        eb = self.eyebrow(s1["eyebrow"])
        title = Text("Teorema\nPythagoras", font="Playfair Display", weight="BOLD", color=TEXT, line_spacing=0.8).scale(0.75).shift(UP * 0.8)
        tri = Polygon(ORIGIN, RIGHT * 1.2, UP * 0.9, color=ACCENT, stroke_width=6).move_to(DOWN * 0.9)
        self.play(FadeIn(eb, shift=DOWN * 0.2), Write(title), run_time=1.4)
        self.play(Create(tri), run_time=1.2)
        self.play(Rotate(tri, angle=TAU, run_time=self.remaining(s1) - 0.5, rate_func=smooth))
        self.clear_scene()

        # 2 — triangle 3-4-c
        self.at(s2)
        u = 0.42
        A, B, C = LEFT * 1.2 + DOWN * 0.6, LEFT * 1.2 + RIGHT * 4 * u + DOWN * 0.6, LEFT * 1.2 + DOWN * 0.6 + UP * 3 * u
        tri = Polygon(A, B, C, color=TEXT, stroke_width=5)
        right = Square(0.18, color=TEXT, stroke_width=3).move_to(A + RIGHT * 0.09 + UP * 0.09)
        la = Text("a = 3", font="Inter", weight="BOLD", color=BLUE).scale(0.4).next_to(Line(A, C), LEFT)
        lb = Text("b = 4", font="Inter", weight="BOLD", color=GREEN).scale(0.4).next_to(Line(A, B), DOWN)
        lc = Text("c = ?", font="Inter", weight="BOLD", color=ACCENT).scale(0.45).move_to((B + C) / 2 + UR * 0.35)
        self.play(FadeIn(self.eyebrow(s2["eyebrow"])), Create(tri), run_time=1.2)
        self.play(Create(right), Write(la), run_time=0.8)
        self.play(Write(lb), run_time=0.8)
        self.play(Indicate(Line(B, C, color=ACCENT, stroke_width=8)), Write(lc), run_time=1.2)
        self.at(s2["start"] + s2["dur"] - 0.4)
        self.clear_scene()

        # 3 — squares on each side
        self.at(s3)
        u = 0.24
        A = LEFT * 0.2 + UP * 0.6
        B, C = A + RIGHT * 4 * u, A + UP * 3 * u
        tri = Polygon(A, B, C, color=TEXT, stroke_width=4)
        sq_a = Polygon(A, C, C + LEFT * 3 * u, A + LEFT * 3 * u, color=BLUE, fill_opacity=0.5, stroke_width=3)
        sq_b = Polygon(A, B, B + DOWN * 4 * u, A + DOWN * 4 * u, color=GREEN, fill_opacity=0.5, stroke_width=3)
        v = B - C; n = np.array([v[1], -v[0], 0]) * -1
        sq_c = Polygon(C, B, B + n, C + n, color=ACCENT, fill_opacity=0.5, stroke_width=3)
        t9 = Text("9", font="Inter", weight="HEAVY", color=TEXT).scale(0.5).move_to(sq_a)
        t16 = Text("16", font="Inter", weight="HEAVY", color=TEXT).scale(0.5).move_to(sq_b)
        t25 = Text("25", font="Inter", weight="HEAVY", color=TEXT).scale(0.55).move_to(sq_c)
        self.play(FadeIn(self.eyebrow(s3["eyebrow"])), Create(tri), run_time=0.8)
        gap = max(0.6, (s3["dur"] - 2.0) / 3)
        for sq, t in ((sq_a, t9), (sq_b, t16), (sq_c, t25)):
            self.play(DrawBorderThenFill(sq), FadeIn(t, scale=1.6), run_time=gap)
        self.at(s3["start"] + s3["dur"] - 0.4)
        self.clear_scene()

        # 4 — formula
        self.at(s4)
        eq1 = Text("9 + 16 = 25", font="Inter", weight="HEAVY", color=TEXT).scale(0.65).shift(UP * 1.4)
        eq2 = MarkupText(f'<span fgcolor="{BLUE}">a²</span> + <span fgcolor="{GREEN}">b²</span> = <span fgcolor="{ACCENT}">c²</span>',
                         font="Playfair Display", weight="BOLD").scale(0.85).shift(UP * 0.2)
        box = SurroundingRectangle(eq2, color=ACCENT, buff=0.25, corner_radius=0.15)
        self.play(FadeIn(self.eyebrow(s4["eyebrow"])), Write(eq1), run_time=1.2)
        self.at(s4["start"] + s4["dur"] * 0.45)
        self.play(TransformMatchingShapes(eq1.copy(), eq2), run_time=1.4)
        self.play(Create(box), Flash(box, color=ACCENT, flash_radius=1.6), run_time=1.0)
        self.finish()
