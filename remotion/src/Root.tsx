import React from "react";
import { Composition, continueRender, delayRender } from "remotion";
import { Main } from "./Main";
import { Props } from "./types";
import sample from "./sample.json";

const fontHandle = delayRender("fonts");
Promise.all(
  ["700 100px Amiri", "400 100px Amiri", "700 100px 'Playfair Display'", "italic 400 100px 'Playfair Display'", "800 100px 'Playfair Display'",
   "400 100px Inter", "600 100px Inter", "700 100px Inter", "800 100px Inter", "900 100px Inter"].map((f) => document.fonts.load(f))
).then(() => continueRender(fontHandle)).catch(() => continueRender(fontHandle));

export const Root: React.FC = () => (
  <Composition
    id="BangMotion"
    component={Main as unknown as React.FC<Record<string, unknown>>}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={300}
    defaultProps={sample as unknown as Record<string, unknown>}
    calculateMetadata={({ props }) => {
      const p = props as unknown as Props;
      return { durationInFrames: p.totalFrames, fps: p.fps };
    }}
  />
);
