// Shared portrait layout for Lemo-native kits that follow the standard frame:
//   eyebrow · text block · (photo card | battle field | text only) · captions band
// A kit gives its look (background, photo treatment, figure look, caption plate, post pass) and gets every scene type,
// including "clash", laid out inside the 9:16 safe area with registered boxes for the layout check.
import { W, H, SAFE, clamp, seg, eo, at, IMG, block, captions, stdBody, boot, reg, KIT } from './kit.js';
import { clashModel, drawFigure, drawFx, clashText } from './clash.js';
import { actionModel, drawActors, actionText } from './action.js';

export const ZONE = { x0: SAFE.x0, x1: SAFE.x1, ground: 1215, S: 230 };
export const PHOTO = { x: SAFE.x0 + 6, y: 690, w: SAFE.x1 - SAFE.x0 - 12, h: 540 };

// cfg: { fonts, prep(), bg(g,t,s,lt), photo(g,t,s,img,R,lt), th, look, fx, field(g,t,s,zone,lt), cap, post(g,t,s), enter: 'fade'|'rise'|'slide'|'zoom',
//        textTop, photoRect }
export function makeKit(cfg) {
  let ready = false; KIT.look = cfg.look || null;
  const draw = (g, t) => {
    if (!ready) { cfg.prep && cfg.prep(); ready = true; }
    const { s } = at(t), lt = t - s.t0, img = IMG[s.i], th = cfg.th, P = cfg.photoRect || PHOTO, top = cfg.textTop ?? SAFE.y0 + 70;
    cfg.bg(g, t, s, lt);
    const k = eo(seg(lt, 0, .45)), e = cfg.enter || 'fade';
    g.save(); g.globalAlpha = clamp(lt / .3);
    if (s.i && e === 'slide') g.translate((1 - k) * 140, 0);
    if (s.i && e === 'rise') g.translate(0, (1 - k) * 80);
    if (s.i && e === 'zoom') { const z = .9 + .1 * k; g.translate(W / 2, 760); g.scale(z, z); g.translate(-W / 2, -760); }
    if (s.eyebrow) block(g, 'eyebrow', s.eyebrow, { x: SAFE.x0, y: cfg.eyebrowY ?? SAFE.y0, w: SAFE.x1 - SAFE.x0, h: 50 }, { ...th.label, align: th.align || 'center', ...(cfg.eyebrowStyle || {}) });
    if (s.type === 'clash') {
      cfg.field && cfg.field(g, t, s, ZONE, lt);
      const m = clashModel(s, t, ZONE);
      for (const f of m.figs) drawFigure(g, f, t, cfg.look);
      drawFx(g, m.fx, cfg.fx || {});
      clashText(g, t, s, { x: SAFE.x0, y: top, w: SAFE.x1 - SAFE.x0, h: 560 - top }, th, 590);
    } else if (s.type === 'action') {
      const m = actionModel(s, t, { x0: SAFE.x0, x1: SAFE.x1, ground: 1150, top: 700, S: 150 });
      cfg.terrain ? cfg.terrain(g, m.T.path, lt) : (g.fillStyle = 'rgba(0,0,0,.08)', g.fill(m.T.path));
      drawActors(g, t, m, cfg.look, cfg.actors || {});
      actionText(g, t, s, { x: SAFE.x0, y: top, w: SAFE.x1 - SAFE.x0, h: 380 - top + SAFE.y0 }, th, m);
    } else if (s.type === 'custom') {
      stdBody(g, t, s, { x: SAFE.x0, y: top, w: SAFE.x1 - SAFE.x0, h: SAFE.y1 - 10 - top }, th);
    } else if (img) {
      cfg.photo(g, t, s, img, P, lt);
      reg('photo', '[photo]', { x0: P.x - 8, y0: P.y - 8, x1: P.x + P.w + 8, y1: P.y + P.h + 8 });
      const s2 = s.type === 'image' ? { ...s, type: 'headline' } : s;
      stdBody(g, t, s2, { x: SAFE.x0, y: top, w: SAFE.x1 - SAFE.x0, h: P.y - 40 - top }, { ...th, title: { ...th.title, size: (th.title.size || 110) * .75 }, num: { ...th.num, size: 120 } });
    } else stdBody(g, t, s, { x: SAFE.x0, y: top, w: SAFE.x1 - SAFE.x0, h: SAFE.y1 - 10 - top }, th);
    g.restore();
    cfg.post && cfg.post(g, t, s, lt);
    if (cfg.cap) captions(g, t, cfg.cap);
  };
  return boot({ fonts: cfg.fonts, draw });
}
