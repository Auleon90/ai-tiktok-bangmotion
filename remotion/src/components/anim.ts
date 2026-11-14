import { Easing, interpolate, spring } from "remotion";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0→1 eased reveal starting at frame `start` lasting `dur` frames */
export const reveal = (f: number, start: number, dur = 18) =>
  interpolate(f, [start, start + dur], [0, 1], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) });

export const pop = (f: number, start: number, fps: number) =>
  spring({ frame: f - start, fps, config: { damping: 12, stiffness: 140, mass: 0.7 } });

/** Enter/exit fade envelope for a scene of length `dur` */
export const envelope = (f: number, dur: number, fade = 10) =>
  interpolate(f, [0, fade, dur - fade, dur], [0, 1, 1, 0], clamp);

export const lerp = (f: number, a: number, b: number, from: number, to: number, ease = Easing.inOut(Easing.cubic)) =>
  interpolate(f, [a, b], [from, to], { ...clamp, easing: ease });
