import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { AyatScene, CounterScene, HeadlineScene, QuoteScene, Theme, TitleScene, TributeScene } from "../types";
import { FONT } from "../theme";
import { pop, reveal } from "../components/anim";
import { Icon } from "../components/Icon";

const Stage: React.FC<{ children: React.ReactNode; top?: number }> = ({ children, top = 260 }) => (
  <div style={{ position: "absolute", top, height: 1250 - top, left: 70, width: 940, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
    {children}
  </div>
);

export const Eyebrow: React.FC<{ text?: string; theme: Theme }> = ({ text, theme }) => {
  const f = useCurrentFrame();
  if (!text) return null;
  const r = reveal(f, 2, 16);
  return (
    <div style={{ position: "absolute", top: 190, width: "100%", display: "flex", justifyContent: "center", opacity: r }}>
      <div
        style={{
          fontFamily: FONT.sans,
          fontWeight: 700,
          fontSize: 30,
          letterSpacing: 8,
          textTransform: "uppercase",
          color: theme.accent,
          padding: "12px 28px",
          border: `2px solid ${theme.accent}`,
          borderRadius: 40,
          background: "rgba(0,0,0,0.35)",
          clipPath: `inset(0 ${(1 - r) * 50}% 0 ${(1 - r) * 50}%)`,
        }}
      >
        {text}
      </div>
    </div>
  );
};

const Ornament: React.FC<{ theme: Theme; progress: number; width?: number }> = ({ theme, progress, width = 520 }) => (
  <svg width={width} height={40} viewBox={`0 0 ${width} 40`} style={{ margin: "24px 0" }}>
    <line x1={width / 2} y1={20} x2={width / 2 - (width / 2 - 30) * progress} y2={20} stroke={theme.accent} strokeWidth={2} />
    <line x1={width / 2} y1={20} x2={width / 2 + (width / 2 - 30) * progress} y2={20} stroke={theme.accent} strokeWidth={2} />
    <rect x={width / 2 - 9} y={11} width={18} height={18} transform={`rotate(45 ${width / 2} 20) scale(1)`} fill="none" stroke={theme.accent} strokeWidth={2} opacity={progress} />
  </svg>
);

export const Title: React.FC<{ s: TitleScene; theme: Theme }> = ({ s, theme }) => {
  const f = useCurrentFrame();
  const a = reveal(f, 4, 40);
  return (
    <Stage>
      {s.arabic && (
        <div
          style={{
            fontFamily: FONT.arabic,
            fontWeight: 700,
            fontSize: 190,
            color: theme.accent,
            direction: "rtl",
            lineHeight: 1.3,
            clipPath: `inset(0 0 0 ${(1 - a) * 100}%)`,
            textShadow: `0 0 40px ${theme.accent}66`,
          }}
        >
          {s.arabic}
        </div>
      )}
      <Ornament theme={theme} progress={reveal(f, 20, 30)} />
      <div style={{ fontFamily: FONT.serif, fontWeight: 700, fontSize: 104, color: theme.text, lineHeight: 1.05, opacity: reveal(f, 26), transform: `translateY(${(1 - reveal(f, 26)) * 40}px)` }}>
        {s.title}
      </div>
      {s.subtitle && (
        <div style={{ fontFamily: FONT.sans, fontSize: 40, color: theme.muted, marginTop: 26, letterSpacing: 3, opacity: reveal(f, 40) }}>{s.subtitle}</div>
      )}
    </Stage>
  );
};

export const Headline: React.FC<{ s: HeadlineScene; theme: Theme }> = ({ s, theme }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = s.headline.split(" ");
  return (
    <Stage>
      {s.icon && (
        <div style={{ marginBottom: 40, transform: `scale(${0.6 + 0.4 * pop(f, 4, fps)})` }}>
          <Icon name={s.icon} size={220} color={theme.accent} progress={reveal(f, 4, 40)} />
        </div>
      )}
      <div style={{ fontFamily: FONT.serif, fontWeight: 800, fontSize: 96, lineHeight: 1.08, color: theme.text }}>
        {words.map((w, i) => {
          const r = reveal(f, 12 + i * 4, 16);
          return (
            <span key={i} style={{ display: "inline-block", marginRight: 22, opacity: r, transform: `translateY(${(1 - r) * 50}px)`, filter: `blur(${(1 - r) * 8}px)` }}>
              {w}
            </span>
          );
        })}
      </div>
      {s.sub && <div style={{ fontFamily: FONT.sans, fontSize: 42, color: theme.muted, marginTop: 30, opacity: reveal(f, 30) }}>{s.sub}</div>}
    </Stage>
  );
};

export const Counter: React.FC<{ s: CounterScene; theme: Theme }> = ({ s, theme }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Stage>
      <div style={{ display: "flex", gap: 40, alignItems: "center", justifyContent: "center", width: "100%" }}>
        {s.items.map((it, i) => {
          const st = 6 + i * 14;
          const p = interpolate(f, [st, st + 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (t) => 1 - Math.pow(1 - t, 3) });
          const c = it.color ?? theme.accent;
          return (
            <React.Fragment key={i}>
              {s.versus && i > 0 && (
                <div style={{ fontFamily: FONT.serif, fontStyle: "italic", fontSize: 70, color: theme.muted, transform: `scale(${pop(f, st, fps)})` }}>vs</div>
              )}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", transform: `scale(${0.7 + 0.3 * pop(f, st, fps)})`, opacity: reveal(f, st, 10) }}>
                <div style={{ fontFamily: FONT.serif, fontWeight: 800, fontSize: s.items.length > 1 ? 150 : 230, color: c, fontVariantNumeric: "tabular-nums", textShadow: `0 0 50px ${c}88` }}>
                  {it.prefix ?? ""}
                  {Math.round(it.value * p).toLocaleString("id-ID")}
                  {it.suffix ?? ""}
                </div>
                <div style={{ width: 260 * p, height: 6, background: c, borderRadius: 3, margin: "8px 0 18px" }} />
                <div style={{ fontFamily: FONT.sans, fontWeight: 700, fontSize: 40, color: theme.text, letterSpacing: 2, textTransform: "uppercase" }}>{it.label}</div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </Stage>
  );
};

export const Quote: React.FC<{ s: QuoteScene; theme: Theme }> = ({ s, theme }) => {
  const f = useCurrentFrame();
  const words = s.text.split(" ");
  const per = Math.max(2, Math.min(5, 50 / words.length));
  return (
    <Stage>
      <div style={{ fontFamily: FONT.serif, fontSize: 220, lineHeight: 0.6, color: theme.accent, opacity: reveal(f, 0, 20), height: 110 }}>“</div>
      <div style={{ fontFamily: FONT.serif, fontStyle: "italic", fontSize: 70, lineHeight: 1.28, color: theme.text, textShadow: `0 0 30px ${theme.accent}33` }}>
        {words.map((w, i) => {
          const r = reveal(f, 10 + i * per, 20);
          return (
            <span key={i} style={{ opacity: 0.08 + 0.92 * r, marginRight: 16, display: "inline-block" }}>
              {w}
            </span>
          );
        })}
      </div>
      {s.source && (
        <div style={{ fontFamily: FONT.sans, fontWeight: 600, fontSize: 36, color: theme.accent, marginTop: 40, letterSpacing: 4, opacity: reveal(f, 20 + words.length * per) }}>
          — {s.source}
        </div>
      )}
    </Stage>
  );
};

export const Ayat: React.FC<{ s: AyatScene; theme: Theme }> = ({ s, theme }) => {
  const f = useCurrentFrame();
  const a = reveal(f, 6, 50);
  return (
    <Stage>
      <div
        style={{
          fontFamily: FONT.arabic,
          fontSize: 74,
          lineHeight: 1.8,
          color: theme.accent,
          direction: "rtl",
          clipPath: `inset(0 0 0 ${(1 - a) * 100}%)`,
          textShadow: `0 0 30px ${theme.accent}55`,
        }}
      >
        {s.arabic}
      </div>
      <Ornament theme={theme} progress={reveal(f, 30, 30)} width={420} />
      <div style={{ fontFamily: FONT.serif, fontStyle: "italic", fontSize: 50, lineHeight: 1.35, color: theme.text, opacity: reveal(f, 40, 24) }}>“{s.translation}”</div>
      <div style={{ fontFamily: FONT.sans, fontWeight: 700, fontSize: 34, letterSpacing: 4, color: theme.muted, marginTop: 30, opacity: reveal(f, 55) }}>{s.ref}</div>
    </Stage>
  );
};

export const Tribute: React.FC<{ s: TributeScene; theme: Theme }> = ({ s, theme }) => {
  const f = useCurrentFrame();
  const glow = 0.6 + 0.4 * Math.sin(f / 12);
  return (
    <Stage>
      <svg width={140} height={220} viewBox="0 0 140 220" style={{ marginBottom: 30, opacity: reveal(f, 0, 30) }}>
        <defs>
          <radialGradient id="flame" cx="50%" cy="60%" r="50%">
            <stop offset="0%" stopColor="#fff6d8" />
            <stop offset="45%" stopColor={theme.accent} />
            <stop offset="100%" stopColor={theme.horizon} stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse cx={70} cy={70} rx={60 * glow} ry={70 * glow} fill="url(#flame)" opacity={0.5} />
        <path d={`M70 ${20 + Math.sin(f / 5) * 4} C${88 + Math.sin(f / 7) * 4} 55 90 80 70 100 C50 80 ${52 + Math.cos(f / 6) * 4} 55 70 20 Z`} fill="url(#flame)" />
        <rect x={56} y={104} width={28} height={110} rx={4} fill={theme.muted} opacity={0.85} />
      </svg>
      {s.arabic && <div style={{ fontFamily: FONT.arabic, fontWeight: 700, fontSize: 88, color: theme.accent, direction: "rtl", opacity: reveal(f, 12, 30) }}>{s.arabic}</div>}
      <div style={{ fontFamily: FONT.serif, fontWeight: 700, fontSize: 84, color: theme.text, letterSpacing: 2, opacity: reveal(f, 22, 30) }}>{s.name}</div>
      {s.note && <div style={{ fontFamily: FONT.sans, fontSize: 40, color: theme.muted, marginTop: 20, letterSpacing: 3, opacity: reveal(f, 36) }}>{s.note}</div>}
    </Stage>
  );
};
