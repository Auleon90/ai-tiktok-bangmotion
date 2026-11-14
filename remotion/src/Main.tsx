import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Props, Scene, Theme } from "./types";
import { DEFAULT_THEME } from "./theme";
import { Backdrop, Dust, Grain, Vignette } from "./components/Atmosphere";
import { Captions } from "./components/Captions";
import { envelope, lerp } from "./components/anim";
import { Ayat, Counter, Eyebrow, Headline, Quote, Title, Tribute } from "./scenes/TextScenes";
import { MapScene } from "./scenes/MapScene";

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
  }
};

const SceneWrap: React.FC<{ s: Scene; theme: Theme; first: boolean }> = ({ s, theme, first }) => {
  const f = useCurrentFrame();
  const dur = s.durationFrames + TRANS;
  const o = first && f < TRANS ? 1 : envelope(f, dur, TRANS);
  const scale = lerp(f, 0, dur, 1, 1.05);
  const blur = (1 - o) * 10;
  return (
    <AbsoluteFill style={{ opacity: o, transform: `scale(${scale})`, filter: `blur(${blur}px)` }}>
      <Eyebrow text={s.eyebrow} theme={theme} />
      <SceneBody s={s} theme={theme} />
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
