import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { Theme } from "../types";
import { H, W } from "../theme";

// Deterministic mountain ridge path
const ridge = (seed: string, baseY: number, amp: number, steps = 14) => {
  let d = `M0 ${H} L0 ${baseY}`;
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * (W + 400) - 200;
    const y = baseY - random(`${seed}${i}`) * amp - (i % 2 === 0 ? amp * 0.25 : 0);
    d += ` L${x.toFixed(0)} ${y.toFixed(0)}`;
  }
  return d + ` L${W + 200} ${H} Z`;
};

export const Backdrop: React.FC<{ theme: Theme }> = ({ theme }) => {
  const f = useCurrentFrame();
  const stars = useMemo(
    () =>
      new Array(90).fill(0).map((_, i) => ({
        x: random(`sx${i}`) * W,
        y: random(`sy${i}`) * H * 0.5,
        r: 0.6 + random(`sr${i}`) * 1.8,
        p: random(`sp${i}`) * Math.PI * 2,
      })),
    []
  );
  const layers = useMemo(
    () => [
      { d: ridge("a", 1180, 260), c: theme.skyMid, o: 0.55, speed: 0.06 },
      { d: ridge("b", 1300, 220), c: theme.ground, o: 0.75, speed: 0.12 },
      { d: ridge("c", 1440, 160, 9), c: theme.ground, o: 1, speed: 0.22 },
    ],
    [theme]
  );
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${theme.skyTop} 0%, ${theme.skyMid} 45%, ${theme.horizon} 72%, ${theme.ground} 100%)`,
      }}
    >
      <svg width={W} height={H} style={{ position: "absolute" }}>
        <defs>
          <radialGradient id="sun" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={theme.accent} stopOpacity={0.9} />
            <stop offset="35%" stopColor={theme.horizon} stopOpacity={0.45} />
            <stop offset="100%" stopColor={theme.horizon} stopOpacity={0} />
          </radialGradient>
        </defs>
        {stars.map((s, i) => (
          <circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill="#fff"
            opacity={0.25 + 0.45 * (0.5 + 0.5 * Math.sin(f / 18 + s.p))}
          />
        ))}
        <circle cx={W * 0.68} cy={1150 - f * 0.05} r={520} fill="url(#sun)" />
        {layers.map((l, i) => (
          <path key={i} d={l.d} fill={l.c} opacity={l.o} transform={`translate(${-f * l.speed} 0)`} />
        ))}
      </svg>
    </AbsoluteFill>
  );
};

export const Dust: React.FC<{ color: string; count?: number }> = ({ color, count = 60 }) => {
  const f = useCurrentFrame();
  const ps = useMemo(
    () =>
      new Array(count).fill(0).map((_, i) => ({
        x: random(`dx${i}`) * W,
        y: random(`dy${i}`) * H,
        s: 1 + random(`ds${i}`) * 3.5,
        v: 0.3 + random(`dv${i}`) * 1.2,
        p: random(`dp${i}`) * 100,
      })),
    [count]
  );
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={W} height={H}>
        {ps.map((p, i) => {
          const x = (p.x + f * p.v * 1.4) % (W + 40);
          const y = (p.y - f * p.v * 0.5 + Math.sin((f + p.p) / 25) * 12 + H) % H;
          return <circle key={i} cx={x} cy={y} r={p.s} fill={color} opacity={0.12 + 0.25 * random(`do${i}`)} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

export const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "overlay", opacity: 0.22 }}>
      <svg width={W} height={H}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={f % 12} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width={W} height={H} filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};

export const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%)",
    }}
  />
);

export const Flash: React.FC<{ at: number[] }> = ({ at }) => {
  const f = useCurrentFrame();
  const o = Math.max(0, ...at.map((a) => interpolate(f, [a - 2, a, a + 10], [0, 0.35, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })));
  return <AbsoluteFill style={{ background: "#fff", opacity: o, pointerEvents: "none" }} />;
};
