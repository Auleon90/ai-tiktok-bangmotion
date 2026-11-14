import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { MapScene as MapS, Pt, Theme } from "../types";
import { FONT } from "../theme";
import { lerp, reveal } from "../components/anim";

const SIZE = 960;

const pathD = (pts: Pt[]) => {
  if (pts.length < 3) return `M${pts[0][0]} ${pts[0][1]} L${pts[1][0]} ${pts[1][1]}`;
  // smooth quadratic through midpoints
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i];
    const [nx, ny] = pts[i + 1];
    const mx = i === pts.length - 2 ? nx : (x + nx) / 2;
    const my = i === pts.length - 2 ? ny : (y + ny) / 2;
    d += ` Q${x} ${y} ${mx} ${my}`;
  }
  return d;
};

const Hill: React.FC<{ at: Pt; r: number; color: string; label?: string; theme: Theme; o: number }> = ({ at, r, color, label, theme, o }) => (
  <g opacity={o}>
    {[1, 0.78, 0.56, 0.34].map((k, i) => (
      <ellipse
        key={i}
        cx={at[0] + (1 - k) * r * 0.15}
        cy={at[1] - (1 - k) * r * 0.2}
        rx={r * k}
        ry={r * k * 0.72}
        fill={color}
        fillOpacity={0.22 + i * 0.14}
        stroke={theme.ground}
        strokeOpacity={0.35}
        strokeWidth={2}
      />
    ))}
    {label && (
      <text x={at[0]} y={at[1] + r * 0.72 + 42} textAnchor="middle" fontFamily={FONT.sans} fontWeight={800} fontSize={30} letterSpacing={3} fill={theme.ground}>
        {label.toUpperCase()}
      </text>
    )}
  </g>
);

export const MapScene: React.FC<{ s: MapS; theme: Theme }> = ({ s, theme }) => {
  const f = useCurrentFrame();
  const D = s.durationFrames;

  const contours = useMemo(
    () =>
      new Array(10).fill(0).map((_, i) => ({
        x: random(`cx${s.id}${i}`) * 1000,
        y: random(`cy${s.id}${i}`) * 1000,
        r: 80 + random(`cr${s.id}${i}`) * 200,
      })),
    [s.id]
  );

  // Camera push-in
  const zoom = s.focus ? lerp(f, 0, D, 1, s.focus.zoom) : lerp(f, 0, D, 1, 1.06);
  const fx = s.focus ? s.focus.at[0] : 500;
  const fy = s.focus ? s.focus.at[1] : 500;
  const k = (zoom - 1) / Math.max(0.0001, zoom);
  const tx = (500 - fx) * k * zoom * 0.9;
  const ty = (500 - fy) * k * zoom * 0.9;

  const intro = reveal(f, 0, 24);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 60,
          top: 300,
          width: SIZE,
          height: SIZE,
          borderRadius: 36,
          overflow: "hidden",
          boxShadow: `0 30px 80px rgba(0,0,0,0.6), 0 0 0 3px ${theme.accent}55`,
          transform: `perspective(1800px) rotateX(${(1 - intro) * 18}deg) scale(${0.92 + 0.08 * intro})`,
          opacity: intro,
        }}
      >
        <svg width={SIZE} height={SIZE} viewBox="0 0 1000 1000">
          <defs>
            <radialGradient id={`sand${s.id}`} cx="50%" cy="40%" r="75%">
              <stop offset="0%" stopColor="#e7c993" />
              <stop offset="70%" stopColor="#c59a5d" />
              <stop offset="100%" stopColor="#8a6338" />
            </radialGradient>
            {[...(s.arrows ?? []).map((a) => a.color), theme.accent].map((c, i) => (
              <marker key={i} id={`ah${s.id}_${i}`} viewBox="0 0 10 10" refX={6} refY={5} markerWidth={4} markerHeight={4} orient="auto-start-reverse">
                <path d="M0 0 L10 5 L0 10 Z" fill={c} />
              </marker>
            ))}
          </defs>
          <g transform={`translate(${tx} ${ty}) translate(500 500) scale(${zoom}) translate(-500 -500)`}>
            <rect x={-200} y={-200} width={1400} height={1400} fill={`url(#sand${s.id})`} />
            {contours.map((c, i) => (
              <g key={i} fill="none" stroke="#7a5530" strokeOpacity={0.18} strokeWidth={2}>
                <circle cx={c.x} cy={c.y} r={c.r} />
                <circle cx={c.x} cy={c.y} r={c.r * 0.7} />
                <circle cx={c.x} cy={c.y} r={c.r * 0.4} />
              </g>
            ))}
            {/* grid */}
            {new Array(9).fill(0).map((_, i) => (
              <g key={i} stroke="#5b3d20" strokeOpacity={0.08}>
                <line x1={(i + 1) * 100} y1={0} x2={(i + 1) * 100} y2={1000} />
                <line x1={0} y1={(i + 1) * 100} x2={1000} y2={(i + 1) * 100} />
              </g>
            ))}

            {(s.hills ?? []).map((h, i) => (
              <Hill key={i} at={h.at} r={h.r} color={h.color ?? "#6b4a2b"} label={h.label} theme={theme} o={reveal(f, 6 + i * 6, 20)} />
            ))}

            {(s.arrows ?? []).map((a, i) => {
              const st = (a.at ?? 0.25) * D;
              const p = lerp(f, st, st + Math.min(40, D * 0.35), 0, 1);
              return (
                <path
                  key={i}
                  d={pathD(a.path)}
                  fill="none"
                  stroke={a.color}
                  strokeWidth={14}
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - p}
                  markerEnd={p > 0.95 ? `url(#ah${s.id}_${i})` : undefined}
                  opacity={0.92}
                  style={{ filter: `drop-shadow(0 4px 6px rgba(0,0,0,0.35))` }}
                />
              );
            })}

            {(s.units ?? []).map((u, ui) => {
              const [ma, mb] = u.moveAt ?? [0.3, 0.8];
              const t = u.to ? lerp(f, ma * D, mb * D, 0, 1) : 0;
              const cx = u.from[0] + ((u.to?.[0] ?? u.from[0]) - u.from[0]) * t;
              const cy = u.from[1] + ((u.to?.[1] ?? u.from[1]) - u.from[1]) * t;
              const spread = u.spread ?? 70;
              const cols = Math.ceil(Math.sqrt(u.dots));
              const appear = reveal(f, 8 + ui * 6, 20);
              return (
                <g key={ui} opacity={appear}>
                  {new Array(u.dots).fill(0).map((_, di) => {
                    const gx = (di % cols) / Math.max(1, cols - 1) - 0.5;
                    const gy = Math.floor(di / cols) / Math.max(1, cols - 1) - 0.5;
                    const jx = (random(`ux${s.id}${ui}${di}`) - 0.5) * 0.25;
                    const jy = (random(`uy${s.id}${ui}${di}`) - 0.5) * 0.25;
                    const lag = random(`ul${s.id}${ui}${di}`) * 0.15;
                    const tt = Math.max(0, t - lag) / (1 - lag);
                    const dx = u.from[0] + ((u.to?.[0] ?? u.from[0]) - u.from[0]) * tt;
                    const dy = u.from[1] + ((u.to?.[1] ?? u.from[1]) - u.from[1]) * tt;
                    const bob = Math.sin((f + di * 7) / 6) * (t > 0 && t < 1 ? 2 : 0.4);
                    return <circle key={di} cx={dx + (gx + jx) * spread} cy={dy + (gy + jy) * spread + bob} r={7} fill={u.color} stroke="#1a1008" strokeWidth={1.5} />;
                  })}
                  {u.label && (
                    <g transform={`translate(${cx} ${cy - spread * 0.6 - 30})`}>
                      <rect x={-u.label.length * 9 - 18} y={-26} width={u.label.length * 18 + 36} height={44} rx={22} fill="#120c08" fillOpacity={0.85} stroke={u.color} strokeWidth={3} />
                      <text textAnchor="middle" y={5} fontFamily={FONT.sans} fontWeight={800} fontSize={26} fill="#fff">
                        {u.label}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {s.pulse &&
              (() => {
                const st = (s.pulse.atFrac ?? 0.4) * D;
                const c = s.pulse.color ?? "#ff4d3d";
                const on = f >= st;
                return on ? (
                  <g>
                    {[0, 15, 30].map((o) => {
                      const ph = ((f - st + o) % 45) / 45;
                      return <circle key={o} cx={s.pulse!.at[0]} cy={s.pulse!.at[1]} r={20 + ph * 110} fill="none" stroke={c} strokeWidth={6} opacity={1 - ph} />;
                    })}
                    <circle cx={s.pulse.at[0]} cy={s.pulse.at[1]} r={14} fill={c} />
                    {s.pulse.label && (
                      <text x={s.pulse.at[0]} y={s.pulse.at[1] + 95} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={36} fill={c} stroke="#1a1008" strokeWidth={8} paintOrder="stroke" opacity={reveal(f, st, 12)}>
                        {s.pulse.label}
                      </text>
                    )}
                  </g>
                ) : null;
              })()}
          </g>
          {/* paper vignette */}
          <rect width={1000} height={1000} fill="none" stroke="#3a2614" strokeOpacity={0.5} strokeWidth={60} style={{ filter: "blur(30px)" }} />
        </svg>
        {/* compass */}
        <div style={{ position: "absolute", right: 28, top: 24, fontFamily: FONT.serif, fontWeight: 700, color: "#3a2614", fontSize: 34, opacity: interpolate(f, [10, 30], [0, 0.8], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          N ↑
        </div>
      </div>
    </AbsoluteFill>
  );
};
