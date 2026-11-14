import React, { useEffect, useState } from "react";
import { Lottie, LottieAnimationData } from "@remotion/lottie";
import { cancelRender, continueRender, delayRender, Sequence, staticFile } from "remotion";
import { LottieFx as Fx } from "../types";

/** One Lottie effect from public/lottie/<name>.json, placed in 1080x1920 px space. */
const One: React.FC<{ fx: Fx }> = ({ fx }) => {
  const [data, setData] = useState<LottieAnimationData | null>(null);
  const [handle] = useState(() => delayRender(`lottie ${fx.name}`));
  useEffect(() => {
    fetch(staticFile(`lottie/${fx.name}.json`))
      .then((r) => r.json())
      .then((j) => { setData(j); continueRender(handle); })
      .catch((e) => cancelRender(e));
  }, [fx.name, handle]);
  if (!data) return null;
  const size = fx.size ?? 400;
  return (
    <div style={{ position: "absolute", left: fx.x - size / 2, top: fx.y - size / 2, width: size, height: size, opacity: fx.opacity ?? 1, pointerEvents: "none" }}>
      <Lottie animationData={data} loop={fx.loop ?? true} playbackRate={fx.speed ?? 1} />
    </div>
  );
};

export const LottieLayer: React.FC<{ items?: Fx[]; sceneFrames: number }> = ({ items, sceneFrames }) => (
  <>
    {(items ?? []).map((fx, i) => {
      const from = Math.round((fx.at ?? 0) * sceneFrames);
      return (
        <Sequence key={i} from={from} layout="none">
          <One fx={fx} />
        </Sequence>
      );
    })}
  </>
);
