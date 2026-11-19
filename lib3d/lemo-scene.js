// Lemo-native adapter for bm3d: a 3D scene inside any kit, as a custom scene.
// Storyboard: { "type": "custom", "code": "lib3d/lemo-scene.js", "three": { "preset": "globe", "accent": "#7fd4ff", "area": "window" | "full" },
//               "as": "headline" | "counter" | "quote" | "list" | ..., + that type's fields (headline, sub, items...) }
// area "window" (default): the 3D plays in a framed window at the top, the kit draws the text below in its own style.
// area "full": the 3D fills the frame behind a soft shade; the text is drawn over it (pick a kit whose text is light).
import { create } from './bm3d.js';
const INST = {};
export function prep(c) {
  const o = c.s.three || {}, full = o.area === 'full';
  INST[c.s.i] = create({ seed: c.s.id, ...o }, full ? { w: 540, h: 960, alpha: true } : { w: 480, h: 336, alpha: true });
}
export default function (g, c) {
  const { K, s, lt, d, box, theme } = c, o = s.three || {}, full = o.area === 'full', cv = INST[s.i].render(lt, d);
  const a = K.eo(K.seg(lt, 0, .6));
  g.save(); g.globalAlpha = a;
  if (full) {
    g.drawImage(cv, 0, 0, c.W, c.H);
    const sh = g.createLinearGradient(0, 0, 0, c.H); sh.addColorStop(0, 'rgba(0,0,0,.35)'); sh.addColorStop(.5, 'rgba(0,0,0,.1)'); sh.addColorStop(.75, 'rgba(0,0,0,.55)'); sh.addColorStop(1, 'rgba(0,0,0,.8)');
    g.fillStyle = sh; g.fillRect(0, 0, c.W, c.H); g.restore();
    K.stdBody(g, c.t, { ...s, type: s.as || 'headline' }, box, theme); return;
  }
  // the window takes the top of the kit's content box (aspect 10:7), the text gets the rest
  const pw = box.w - 24, ph = Math.min(pw * .7, box.h * .62), P = { x: box.x + 12, y: box.y + 12, w: pw, h: ph }, lift = (1 - a) * 40;
  g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 30; g.shadowOffsetY = 14; g.fillStyle = o.frame || '#0c0e1a'; g.fillRect(P.x - 8, P.y - 8 + lift, P.w + 16, P.h + 16);
  g.shadowColor = 'transparent'; g.drawImage(cv, P.x, P.y + lift, P.w, P.h);
  g.strokeStyle = theme.accent || '#e9c27a'; g.lineWidth = 3; g.strokeRect(P.x - 8, P.y - 8 + lift, P.w + 16, P.h + 16);
  g.restore();
  K.reg('three', '3D', { x0: P.x - 8, y0: P.y - 8, x1: P.x + P.w + 8, y1: P.y + P.h + 8 });
  const y = P.y + P.h + 36;
  K.stdBody(g, c.t, { ...s, type: s.as || 'headline' }, { x: box.x, y, w: box.w, h: box.y + box.h - y }, theme);
}
