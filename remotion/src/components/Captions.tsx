import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Theme, Word } from "../types";
import { FONT } from "../theme";

const CHUNK = 3;

/** Word-synced captions: shows a 1–3 word group, current word highlighted with a pop. */
export const Captions: React.FC<{ words: Word[]; theme: Theme }> = ({ words, theme }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const idx = words.findIndex((w, i) => f >= w.startFrame && f < (words[i + 1]?.startFrame ?? w.endFrame + 12));
  if (idx < 0) return null;
  const cur = words[idx];
  if (f > cur.endFrame + 12) return null;

  // break chunks at sentence punctuation too
  let start = idx;
  while (start > 0 && idx - start < CHUNK - 1 && !/[.,!?;:]$/.test(words[start - 1].text)) start--;
  const group = words.slice(start, idx + 1);

  return (
    <div
      style={{
        position: "absolute",
        left: 70,
        right: 70,
        top: 1320,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "0 22px",
        fontFamily: FONT.sans,
        fontWeight: 800,
        fontSize: 78,
        lineHeight: 1.15,
        textAlign: "center",
      }}
    >
      {group.map((w, i) => {
        const active = start + i === idx;
        const s = spring({ frame: f - w.startFrame, fps, config: { damping: 14, stiffness: 220 } });
        return (
          <span
            key={start + i}
            style={{
              color: active ? theme.accent : theme.text,
              transform: `scale(${active ? 0.85 + 0.2 * s : 1}) translateY(${(1 - s) * 18}px)`,
              display: "inline-block",
              WebkitTextStroke: "10px rgba(0,0,0,0.85)",
              paintOrder: "stroke fill",
              textShadow: "0 6px 18px rgba(0,0,0,0.6)",
            }}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
};
