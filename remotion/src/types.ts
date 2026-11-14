export type Pt = [number, number]; // map coords 0..1000

export type Word = { text: string; startFrame: number; endFrame: number };

export type Theme = {
  skyTop: string;
  skyMid: string;
  horizon: string;
  ground: string;
  text: string;
  accent: string;
  muted: string;
};

type Base = { id: number; startFrame: number; durationFrames: number; eyebrow?: string };

export type TitleScene = Base & { type: "title"; arabic?: string; title: string; subtitle?: string };
export type HeadlineScene = Base & { type: "headline"; headline: string; sub?: string; icon?: IconName };
export type CounterScene = Base & {
  type: "counter";
  items: { value: number; label: string; color?: string; prefix?: string; suffix?: string }[];
  versus?: boolean;
};
export type QuoteScene = Base & { type: "quote"; text: string; source?: string };
export type AyatScene = Base & { type: "ayat"; arabic: string; translation: string; ref: string };
export type TributeScene = Base & { type: "tribute"; name: string; arabic?: string; note?: string };
export type MapScene = Base & {
  type: "map";
  hills?: { label?: string; at: Pt; r: number; color?: string }[];
  units?: {
    label?: string;
    color: string;
    dots: number;
    from: Pt;
    to?: Pt;
    moveAt?: [number, number]; // fraction of scene [start,end] of movement
    spread?: number;
  }[];
  arrows?: { path: Pt[]; color: string; at?: number }[];
  pulse?: { at: Pt; label?: string; color?: string; atFrac?: number };
  focus?: { at: Pt; zoom: number }; // camera push-in target
};

export type IconName = "sword" | "bow" | "mountain" | "moon" | "drop" | "star" | "shield";

export type Scene =
  | TitleScene
  | HeadlineScene
  | CounterScene
  | QuoteScene
  | AyatScene
  | TributeScene
  | MapScene;

export type Props = {
  fps: number;
  totalFrames: number;
  audio?: string;
  theme?: Partial<Theme>;
  scenes: Scene[];
  words: Word[];
};
