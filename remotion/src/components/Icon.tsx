import React from "react";
import { IconName } from "../types";

/** Simple stroke icons (viewBox 100x100), drawn progressively via `progress` 0..1 */
const PATHS: Record<IconName, string[]> = {
  sword: ["M50 8 L56 62 L44 62 Z", "M30 62 L70 62", "M50 62 L50 86", "M44 92 A6 6 0 1 0 56 92 A6 6 0 1 0 44 92"],
  bow: ["M30 10 Q85 50 30 90", "M30 10 L30 90", "M14 50 L80 50", "M80 50 L70 44 M80 50 L70 56"],
  mountain: ["M6 86 L38 30 L52 52 L64 38 L94 86 Z", "M38 30 L46 44 L32 46 Z"],
  moon: ["M64 12 A40 40 0 1 0 88 64 A30 30 0 1 1 64 12 Z"],
  drop: ["M50 10 C50 10 20 50 20 66 A30 30 0 0 0 80 66 C80 50 50 10 50 10 Z"],
  star: ["M50 8 L61 38 L94 38 L67 58 L77 90 L50 70 L23 90 L33 58 L6 38 L39 38 Z"],
  shield: ["M50 8 L86 22 C86 60 70 80 50 92 C30 80 14 60 14 22 Z", "M50 24 L50 76"],
};

export const Icon: React.FC<{ name: IconName; size: number; color: string; progress: number }> = ({
  name,
  size,
  color,
  progress,
}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: "visible" }}>
    {PATHS[name].map((d, i) => (
      <path
        key={i}
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - Math.min(1, Math.max(0, progress * 1.3 - i * 0.1))}
        style={{ filter: `drop-shadow(0 0 10px ${color})` }}
      />
    ))}
  </svg>
);
