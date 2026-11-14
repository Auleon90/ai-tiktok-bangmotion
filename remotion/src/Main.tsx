import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Props, Scene, Theme } from "./types";
import { DEFAULT_THEME } from "./theme";
import { Backdrop, Dust, Grain, Vignette } from "./components/Atmosphere";
import { Captions } from "./components/Captions";
import { envelope, lerp } from "./components/anim";
import { Ayat, Counter, Eyebrow, Headline, Quote, Title, Tribute } from "./scenes/TextScenes";
import { MapScene } from "./scenes/MapScene";
import { LottieLayer } from "./components/LottieFx";

const TRANS = 12;

const SceneBody: React.FC<{ s: Scene; theme: Theme }> = ({ s, theme }) => {
  switch (s.type) {
    case "title": return <Title s={s} theme={theme} />;
    case "headline": return <Headline s={s} theme={theme} />;
    case "counter": return <Counter s={s} theme={theme} />;
    case "quote": return <Quote s={s} theme={theme} />;
    case "ayat": return <Ayat s={s} theme={theme} />;
    case "tribute": return <Tribute s={s} theme={theme} />;
    case "map": return <MapScene s={s} theme={theme} />;
    case "image": return s.headline ? <Headline s={{ ...s, type: "headline", headline: s.headline }} theme={theme} /> : null;
  }
};

/** AI illustration background: cover-fit with a slow Ken Burns push and a readability gradient. */
const SceneImage: React.FC<{ src: string; dur: number; seed: number; dim: boolean }> = ({ src, dur, seed, dim }) => {
  const f = useCurrentFrame();
  const scale = lerp(f, 0, dur, 1.18, 1.04);
  const dir = seed % 2 === 0 ? 1 : -1;
  const x = lerp(f, 0, dur, -30 * dir, 30 * dir);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img src={staticFile(src)} style={{ position: "absolute", height: "100%", left: "50%", transform: `translateX(-50%) translateX(${x}px) scale(${scale})`, objectFit: "cover" }} />
      <AbsoluteFill style={{ background: dim
        ? "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.5) 30%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.8) 72%, rgba(0,0,0,0.92) 100%)"
        : "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.75) 72%, rgba(0,0,0,0.9) 100%)" }} />
    </AbsoluteFill>
  );
};

const SceneWrap: React.FC<{ s: Scene; theme: Theme; first: boolean }> = ({ s, theme, first }) => {
  const f = useCurrentFrame();
  const dur = s.durationFrames + TRANS;
  const o = first && f < TRANS ? 1 : envelope(f, dur, TRANS);
  const scale = lerp(f, 0, dur, 1, 1.05);
  const blur = (1 - o) * 10;
  const textShadow = s.imageSrc ? "0 4px 28px rgba(0,0,0,.95), 0 0 6px rgba(0,0,0,.8)" : undefined;
  return (
    <AbsoluteFill style={{ opacity: o, transform: `scale(${scale})`, filter: `blur(${blur}px)`, textShadow }}>
      {s.imageSrc && <SceneImage src={s.imageSrc} dur={dur} seed={s.id} dim={s.type !== "image" || !!s.headline} />}
      <Eyebrow text={s.eyebrow} theme={theme} />
      <SceneBody s={s} theme={theme} />
      <LottieLayer items={s.lottie} sceneFrames={s.durationFrames} />
    </AbsoluteFill>
  );
};

export const Main: React.FC<Props> = ({ scenes, words, theme: t, audio }) => {
  const theme = { ...DEFAULT_THEME, ...(t ?? {}) };
  return (
    <AbsoluteFill style={{ background: theme.ground }}>
      <Backdrop theme={theme} />
      <Dust color={theme.accent} />
      {scenes.map((s, i) => (
        <Sequence key={s.id} from={s.startFrame} durationInFrames={s.durationFrames + TRANS} name={`${s.id}-${s.type}`}>
          <SceneWrap s={s} theme={theme} first={i === 0} />
        </Sequence>
      ))}
      <Captions words={words} theme={theme} />
      <Vignette />
      <Grain />
      {audio && <Audio src={staticFile(audio)} />}
    </AbsoluteFill>
  );
};
