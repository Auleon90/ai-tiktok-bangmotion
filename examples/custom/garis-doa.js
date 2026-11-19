// Custom scene: a glowing "life line" over the paper-lantern night — falls into the lowest point (kesulitan),
// pulses there (doa) and rises (pertolongan). curve: "fall" = one big V (hook), "pattern" = four small Vs, one per prophet.
// Storyboard: { "type":"custom", "code":"custom/garis-doa.js", "curve":"fall"|"pattern", "headline", "arabic?", "ref?", "labels?":[...] }
const GLOW = '#ffcd82', CORE = '#fff6e2';

function vPath(x0, x1, yTop, yLow, n = 90) {   // a smooth V: ease into the bottom, ease out of it
  const pts = [];
  for (let k = 0; k <= n; k++) { const u = k / n, x = x0 + (x1 - x0) * u, d = Math.abs(u - .5) * 2, y = yLow - (yLow - yTop) * Math.pow(d, 1.6); pts.push([x, y]); }
  return pts;
}
function stroke(g, pts, p, w, col, blur) {
  const m = Math.max(1, Math.floor((pts.length - 1) * p)); if (p <= 0) return null;
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round';
  g.shadowColor = col; g.shadowBlur = blur; g.strokeStyle = col; g.lineWidth = w;
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let k = 1; k <= m; k++) g.lineTo(pts[k][0], pts[k][1]); g.stroke(); g.restore();
  return pts[m];
}
function line(g, pts, p, scale = 1) {
  stroke(g, pts, p, 16 * scale, 'rgba(255,190,110,.35)', 40 * scale);
  const head = stroke(g, pts, p, 5 * scale, CORE, 14 * scale);
  if (head && p < 1) { g.save(); g.globalCompositeOperation = 'lighter'; const r = g.createRadialGradient(head[0], head[1], 0, head[0], head[1], 46 * scale);
    r.addColorStop(0, 'rgba(255,250,235,1)'); r.addColorStop(.25, 'rgba(255,205,130,.7)'); r.addColorStop(1, 'rgba(255,205,130,0)');
    g.fillStyle = r; g.beginPath(); g.arc(head[0], head[1], 46 * scale, 0, Math.PI * 2); g.fill(); g.restore(); }
  return head;
}
function ring(g, x, y, t, a, scale = 1) {
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 3; k++) { const u = ((t * .6 + k / 3) % 1); g.globalAlpha = a * (1 - u) * .8; g.strokeStyle = GLOW; g.lineWidth = 3 * scale;
    g.beginPath(); g.ellipse(x, y, (30 + u * 110) * scale, (12 + u * 40) * scale, 0, 0, Math.PI * 2); g.stroke(); }
  g.restore();
}
// a light pillar from the sky down to the bottom of the line: the answer coming down
function pillar(g, x, y, a, y0 = 200) {
  if (a <= 0) return; g.save(); g.globalCompositeOperation = 'lighter';
  const gr = g.createLinearGradient(0, y0, 0, y); gr.addColorStop(0, 'rgba(255,220,160,0)'); gr.addColorStop(1, `rgba(255,225,170,${.55 * a})`);
  g.fillStyle = gr; g.fillRect(x - 6, y0, 12, y - y0); g.fillStyle = `rgba(255,225,170,${.12 * a})`; g.fillRect(x - 30, y0, 60, y - y0); g.restore();
}
function paperStrip(g, x, y, w, h) {
  g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 22; g.shadowOffsetY = 10; g.fillStyle = '#e6d3ad'; g.fillRect(x, y, w, h); g.restore();
}

function tag(g, K, id, str, x, y, o) {   // label on a small dark paper tag so it reads over the light sheets
  const a = o.alpha ?? 1; if (a <= 0) return; g.save(); g.font = `${o.weight || 500} ${o.size}px ${o.family || 'serif'}`;
  const w = g.measureText(str).width * (1 + (o.ls || 0) * .9) + 36, al = o.align || 'left', x0 = al === 'center' ? x - w / 2 : al === 'right' ? x - w + 18 : x - 18;
  g.globalAlpha = a * .82; g.fillStyle = '#0d0b12'; g.fillRect(x0, y - o.size * 1.05, w, o.size * 1.5); g.restore();
  g.save(); g.globalAlpha = a; K.text(g, id, str, x, y, o); g.restore();
}
export default function (g, c) {
  const { K, theme: th, box, lt, d, s, t } = c, seg = (a, b) => K.seg(lt / d, a, b), X = box.x + 20, Wd = box.w - 40, top = box.y + 30;
  const first = s.i === 0;   // hook: everything readable on frame 0
  if (s.curve === 'pattern') {
    paperStrip(g, X, top, Wd, 170);
    K.block(g, 'main', s.headline, { x: X + 40, y: top + 20, w: Wd - 80, h: 130 }, { ...th.title, size: 74, min: 40, align: 'center', valign: 'middle' });
    const ya = top + 200;
    g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 20; g.fillStyle = '#120c08'; g.fillRect(X, ya, Wd, 230 * K.eo(seg(.0, .12))); g.restore();
    if (seg(.08, .2) > 0) { g.save(); g.shadowColor = GLOW; g.shadowBlur = 26;
      K.block(g, 'ar', s.arabic, { x: X + 40, y: ya + 22, w: Wd - 80, h: 130 }, { family: 'Amiri', weight: 700, size: 80, min: 40, lh: 1.5, color: '#ffd89a', align: 'center', valign: 'middle', alpha: seg(.08, .2) });
      g.restore();
      K.block(g, 'ref', s.ref, { x: X + 40, y: ya + 160, w: Wd - 80, h: 50 }, { ...th.label, color: '#e6c48a', align: 'center', alpha: seg(.1, .22) }); }
    const names = s.labels || ['YUNUS', 'AYYUB', 'MUSA', 'IBRAHIM'], n = names.length, cw = Wd / n, yTop = 760, yLow = 1120;
    names.forEach((nm, k) => {
      const a0 = .1 + k * .13, p = K.eo(seg(a0, a0 + .2)), cx = X + cw * (k + .5);
      if (p <= 0) return;
      const pts = vPath(cx - cw * .42, cx + cw * .42, yTop, yLow, 60);
      pillar(g, cx, yLow, seg(a0 + .08, a0 + .14) * (1 - seg(a0 + .2, a0 + .35) * .6), ya + 250);
      line(g, pts, p, .7); ring(g, cx, yLow, t + k, seg(a0 + .06, a0 + .1), .55);
      tag(g, K, 'n' + k, nm, cx, yLow + 78, { ...th.label, size: 32, color: '#f2dcae', align: 'center', alpha: seg(a0, a0 + .08) });
    });
    // the three words of the pattern under the lines, as they are spoken
    return;
  }
  // "fall": one big V
  paperStrip(g, X, top, Wd, 230);
  K.block(g, 'main', s.headline, { x: X + 40, y: top + 24, w: Wd - 80, h: 182 }, { ...th.title, size: 84, min: 44, align: 'center', valign: 'middle' });
  const yTop = 640, yLow = 1130, cx = c.W / 2, pts = vPath(X - 40, X + Wd + 40, yTop, yLow, 120);
  // the fall is drawn already on frame 0 of the hook (half way down), then continues; the rise waits for the answer
  const pFall = first ? .22 + .28 * K.eo(seg(0, .45)) : .5 * K.eo(seg(0, .45));
  const pRise = .5 * K.eo(seg(.72, 1));
  const p = pFall + pRise;
  ring(g, cx, yLow, t, seg(.4, .5));
  pillar(g, cx, yLow, seg(.55, .7) * (1 - seg(.85, 1) * .5), top + 250);
  line(g, pts, p, 1);
  tag(g, K, 'l0', 'KESULITAN', X + 60, yTop + 150, { ...th.label, size: 32, color: '#f2dcae', alpha: first ? 1 : seg(.05, .15) });
  tag(g, K, 'l1', 'DOA', cx, yLow + 80, { ...th.label, size: 34, color: '#ffe2a8', align: 'center', alpha: seg(.45, .55) });
  tag(g, K, 'l2', 'PERTOLONGAN', X + Wd - 60, yTop + 150, { ...th.label, size: 32, color: '#ffe2a8', align: 'right', alpha: seg(.85, .95) });
}
