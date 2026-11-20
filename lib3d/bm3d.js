// bm3d — deterministic three.js scenes for Bang Motion (shared by HyperFrames and Lemo native).
// Built with the threejs-skills guides (.claude/skills/threejs-*, MIT, github.com/cloudai-x/threejs-skills).
// Every frame is a pure function of time: no clock, no requestAnimationFrame, no unseeded random.
// The server has no GPU (software WebGL), so scenes render at half resolution (540×960) and are scaled up:
// low-poly geometry, flat/standard materials, fog instead of post-processing, ≤ 6k points.
//
//   import { create } from './bm3d.js';
//   const s3 = create({ preset: 'terrain', accent: '#ffcd82', seed: 3 }, { w: 540, h: 960, alpha: true });
//   s3.render(localTime, duration);   // → s3.canvas (draw it, or it is the page's <canvas>)
//
// Presets (storyboard "three": {...}):
//   terrain   low-poly night hills in fog, a glowing path dipping into the valley and rising (fall → doa → lifted), slow dolly
//   globe     a dotted planet with an atmosphere rim, orbit ring and travelling points (sains, bumi, skala)
//   crystal   a faceted gem turning in rim light inside a ring of dust (renungan, nilai, "harga" nikmat)
//   galaxy    a spiral of 6k stars, the camera drifting through (kosmos, QS Adz-Dzariyat 47, skala)
//   bars      3D columns rising to `values` (data, perbandingan) — numbers stay drawn by the page
//   water     a low-poly sea surface with swell under a moon path (air, hujan, laut, Musa)
// Common options: accent, bg (null = transparent), fog, seed, camera: "dolly" | "orbit" | "rise" | "still", speed (1), values (bars)
import * as THREE from './three.module.min.js';
export { THREE };

const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const fbm = (x, y) => vnoise(x, y) * .55 + vnoise(x * 2.1, y * 2.1) * .28 + vnoise(x * 4.3, y * 4.3) * .17;
const ease = u => u < 0 ? 0 : u > 1 ? 1 : u * u * (3 - 2 * u);
const col = c => new THREE.Color(c);

function glowSprite(color) {   // a soft round sprite texture drawn once (no texture files needed)
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d');
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.3, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

const PRESETS = {
  terrain(S, o, R) {
    const acc = col(o.accent || '#ffcd82');
    S.fog = new THREE.FogExp2(col(o.fog || '#141a33'), .03);
    const geo = new THREE.PlaneGeometry(60, 60, 70, 70); geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position;
    for (let k = 0; k < p.count; k++) { const x = p.getX(k), z = p.getZ(k), valley = Math.min(1, Math.abs(x) / 7);
      p.setY(k, (fbm(x * .09 + 3, z * .09) * 9 - 2.5) * (.25 + .75 * valley)); }
    geo.computeVertexNormals();
    const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: col(o.ground || '#4a5a9c'), flatShading: true, roughness: .9 }));
    S.add(ground);
    S.add(new THREE.HemisphereLight(col('#8ea2ff'), col('#0a0c18'), 1.4));
    const moon = new THREE.DirectionalLight(acc, 2.4); moon.position.set(8, 6, -20); S.add(moon);
    // the path: a V across the valley (falls, touches bottom, rises), drawn as a glowing tube that grows with time
    const pts = []; for (let k = 0; k <= 80; k++) { const u = k / 80, x = (u - .5) * 16, d = Math.abs(u - .5) * 2; pts.push(new THREE.Vector3(x, .4 + 6 * Math.pow(d, 1.6), -6 - Math.sin(u * Math.PI) * 2)); }
    const curve = new THREE.CatmullRomCurve3(pts), tube = new THREE.TubeGeometry(curve, 200, .09, 8, false);
    const mat = new THREE.MeshBasicMaterial({ color: col('#fff3d6') }), line = new THREE.Mesh(tube, mat); S.add(line);
    const halo = new THREE.Mesh(new THREE.TubeGeometry(curve, 200, .32, 8, false), new THREE.MeshBasicMaterial({ color: acc, transparent: true, opacity: .25, blending: THREE.AdditiveBlending, depthWrite: false }));
    S.add(halo);
    const head = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite(), color: acc, blending: THREE.AdditiveBlending, depthWrite: false })); head.scale.set(2.4, 2.4, 1); S.add(head);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(.06, .5, 14, 16, 1, true), new THREE.MeshBasicMaterial({ color: acc, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    beam.position.set(0, 7.4, -8); S.add(beam);
    const stars = points(R, 900, () => [(R() - .5) * 90, 8 + R() * 30, -20 - R() * 30], '#dfe6ff', .18); S.add(stars);
    const total = tube.index.count;
    return (lt, d, cam) => {
      const u = o.progress != null ? o.progress : ease(lt / Math.max(1, d * .9));
      tube.setDrawRange(0, Math.floor(total * u)); halo.geometry.setDrawRange(0, Math.floor(total * u));
      const hp = curve.getPointAt(Math.min(.999, Math.max(.001, u))); head.position.copy(hp);
      beam.material.opacity = .35 * Math.max(0, 1 - Math.abs(u - .5) * 6);   // the light comes down when the path is at its lowest
      cam.position.set(Math.sin(lt * .05) * 1.5, 6.5 + lt * .03, 17 - lt * .25 * (o.speed || 1)); cam.lookAt(0, 2.6, -8);
    };
  },
  globe(S, o, R) {
    const acc = col(o.accent || '#7fd4ff');
    const n = 4200, pos = new Float32Array(n * 3), cols = new Float32Array(n * 3), base = col(o.land || '#9fc6ff'), sea = col('#2a4f8f');
    for (let k = 0; k < n; k++) { const y = 1 - 2 * (k + .5) / n, r = Math.sqrt(1 - y * y), th = k * 2.39996; const x = Math.cos(th) * r, z = Math.sin(th) * r;
      pos.set([x * 2, y * 2, z * 2], k * 3); const land = fbm(x * 1.6 + 5, y * 1.6 + z * 1.4) > .46; (land ? base : sea).toArray(cols, k * 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    const globe = new THREE.Points(g, new THREE.PointsMaterial({ size: .06, vertexColors: true })); S.add(globe);
    const core = new THREE.Mesh(new THREE.SphereGeometry(1.96, 48, 32), new THREE.MeshBasicMaterial({ color: col('#0b1430') })); S.add(core);
    const rim = new THREE.Mesh(new THREE.SphereGeometry(2.25, 48, 32), new THREE.ShaderMaterial({ transparent: true, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false,
      uniforms: { c: { value: acc } }, vertexShader: 'varying vec3 vN; void main(){ vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: 'uniform vec3 c; varying vec3 vN; void main(){ float i = pow(.72 - dot(vN, vec3(0,0,1.)), 3.); gl_FragColor = vec4(c, 1.)*i; }' }));
    S.add(rim);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3, .012, 6, 160), new THREE.MeshBasicMaterial({ color: acc, transparent: true, opacity: .6 })); ring.rotation.x = 1.25; S.add(ring);
    const sats = []; for (let k = 0; k < 3; k++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite(), color: acc, blending: THREE.AdditiveBlending, depthWrite: false })); s.scale.set(.5, .5, 1); S.add(s); sats.push(s); }
    S.add(points(R, 700, () => { const a = R() * 6.28, b = Math.acos(2 * R() - 1), r = 30 + R() * 20; return [Math.sin(b) * Math.cos(a) * r, Math.cos(b) * r, Math.sin(b) * Math.sin(a) * r]; }, '#ffffff', .12));
    return (lt, d, cam) => {
      globe.rotation.y = lt * .12 * (o.speed || 1); globe.rotation.x = .25;
      sats.forEach((s, k) => { const a = lt * (.5 + k * .15) + k * 2.1; s.position.set(Math.cos(a) * 3, Math.sin(a) * 3 * Math.cos(1.25), Math.sin(a) * 3 * Math.sin(1.25) * -1); });
      cam.position.set(0, .3, 11.5 - ease(lt / d) * 2); cam.lookAt(0, .2, 0);
    };
  },
  crystal(S, o, R) {
    const acc = col(o.accent || '#ffcd82');
    const gem = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6, 0), new THREE.MeshStandardMaterial({ color: col(o.color || '#f6e7c8'), flatShading: true, metalness: .35, roughness: .25, emissive: acc, emissiveIntensity: .08 }));
    S.add(gem);
    const wire = new THREE.LineSegments(new THREE.EdgesGeometry(gem.geometry), new THREE.LineBasicMaterial({ color: acc, transparent: true, opacity: .7 })); gem.add(wire);
    S.add(new THREE.AmbientLight(col('#30365a'), .8));
    const k1 = new THREE.PointLight(acc, 40, 20); k1.position.set(3, 3, 3); S.add(k1);
    const k2 = new THREE.PointLight(col('#6d8cff'), 30, 20); k2.position.set(-4, -1, 2); S.add(k2);
    const dust = points(R, 1400, () => { const a = R() * 6.28, r = 2.6 + R() * 1.6; return [Math.cos(a) * r, (R() - .5) * .8, Math.sin(a) * r]; }, o.accent || '#ffcd82', .05); S.add(dust);
    return (lt, d, cam) => {
      const s = o.speed || 1; gem.rotation.set(lt * .21 * s, lt * .33 * s, 0); dust.rotation.y = -lt * .08 * s;
      gem.position.y = Math.sin(lt * .9) * .12; cam.position.set(0, .4, 7.2 - ease(lt / d) * 1.2); cam.lookAt(0, 0, 0);
    };
  },
  galaxy(S, o, R) {
    const n = 6000, pos = new Float32Array(n * 3), cols = new Float32Array(n * 3), inner = col(o.accent || '#ffd59a'), outer = col(o.outer || '#5b6cff');
    for (let k = 0; k < n; k++) { const r = Math.pow(R(), 1.3) * 9, arm = (k % 3) / 3 * 6.283, spin = r * .55, sc = Math.pow(R(), 2) * (R() < .5 ? 1 : -1) * 1.4;
      pos.set([Math.cos(arm + spin) * r + sc, sc * .5 * (R() - .5), Math.sin(arm + spin) * r + sc * (R() - .5)], k * 3);
      inner.clone().lerp(outer, r / 9).toArray(cols, k * 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    const gal = new THREE.Points(g, new THREE.PointsMaterial({ size: .16, vertexColors: true, map: glowSprite(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); S.add(gal);
    return (lt, d, cam) => { gal.rotation.y = lt * .06 * (o.speed || 1); const u = ease(lt / d); cam.position.set(0, 6 - u * 3.5, 11 - u * 5); cam.lookAt(0, 0, 0); };
  },

  // heart: a beating hologram heart (extruded heart shape + vessels), wireframe + additive glow.
  // o.split (cyan | gold halves: organ vs spirit), o.organs (kabid/liver on the body's right), o.ribs (rib cage rings),
  // o.bpm (default 72), o.y (screen offset), o.zoom (camera distance factor)
  heart(S, o, R) {
    const hue = col(o.hue || '#5fe3ff'), acc = col(o.accent || '#ffc861');
    const sh = new THREE.Shape(); sh.moveTo(0, -1.25);
    sh.bezierCurveTo(-.35, -.8, -1.35, -.35, -1.25, .35); sh.bezierCurveTo(-1.15, 1.05, -.3, 1.15, 0, .6);
    sh.bezierCurveTo(.3, 1.15, 1.15, 1.05, 1.25, .35); sh.bezierCurveTo(1.35, -.35, .35, -.8, 0, -1.25);
    const geo = new THREE.ExtrudeGeometry(sh, { depth: .55, bevelEnabled: true, bevelThickness: .45, bevelSize: .3, bevelSegments: 8, curveSegments: 28 });
    geo.center(); geo.rotateZ(-.32);
    const grp = new THREE.Group(); S.add(grp);
    const half = (c, side) => {
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: .16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
        clippingPlanes: side ? [new THREE.Plane(new THREE.Vector3(side, 0, 0), 0)] : [] }));
      const w = new THREE.LineSegments(new THREE.WireframeGeometry(geo), new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: .22, blending: THREE.AdditiveBlending, depthWrite: false,
        clippingPlanes: m.material.clippingPlanes }));
      const e = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 25), new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: .6, clippingPlanes: m.material.clippingPlanes }));
      grp.add(m, w, e);
    };
    if (o.split) { half(hue, -1); half(acc, 1); } else half(o.gold ? acc : hue, 0);
    // vessels: aorta arch + two trunks
    const tube = (pts, r, c) => grp.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), 40, r, 10),
      new THREE.MeshBasicMaterial({ color: c, wireframe: true, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false })));
    tube([[.15, .7, 0], [.25, 1.5, 0], [-.25, 1.85, 0], [-.75, 1.55, 0], [-.85, .9, -.1]], .09, o.vessels ? acc : hue);
    tube([[-.35, .7, .1], [-.5, 1.5, .25], [-.45, 2.0, .3]], .07, hue);
    tube([[.55, .6, -.1], [.9, 1.3, -.2], [1.25, 1.5, -.2]], .07, hue);
    if (o.organs) {   // kabid: a wedge on the body's right = viewer's left, low
      const ls = new THREE.Shape(); ls.moveTo(-3.6, -1.6); ls.bezierCurveTo(-3.9, -.6, -2.6, -.4, -1.2, -.9); ls.bezierCurveTo(-.9, -1.4, -1.6, -2.2, -2.6, -2.3); ls.bezierCurveTo(-3.2, -2.3, -3.5, -2, -3.6, -1.6);
      const lg = new THREE.ExtrudeGeometry(ls, { depth: .5, bevelEnabled: true, bevelThickness: .3, bevelSize: .2, bevelSegments: 4 }); lg.translate(0, 0, -.5);
      const liver = new THREE.Group();
      liver.add(new THREE.LineSegments(new THREE.EdgesGeometry(lg, 20), new THREE.LineBasicMaterial({ color: col('#ff8a6b'), transparent: true, opacity: .8 })));
      liver.add(new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: col('#ff8a6b'), transparent: true, opacity: .1, blending: THREE.AdditiveBlending, depthWrite: false })));
      S.add(liver); grp.position.x = .9;
    }
    const ribs = [];
    if (o.ribs) for (let k = 0; k < 7; k++) {
      const r = new THREE.Mesh(new THREE.TorusGeometry(2.6 - Math.abs(k - 2.5) * .12, .03, 6, 80, Math.PI * 1.55), new THREE.MeshBasicMaterial({ color: hue, transparent: true, opacity: .28 }));
      r.rotation.set(Math.PI / 2 + .25, 0, Math.PI * .72); r.scale.set(1, .62, 1); r.position.y = 2.2 - k * .7; S.add(r); ribs.push(r);
    }
    const dust = points(R, 900, () => { const a = R() * 6.28, rr = 2.2 + R() * 2.2; return [Math.cos(a) * rr, (R() - .5) * 6, Math.sin(a) * rr]; }, o.gold ? '#ffc861' : '#5fe3ff', .05); S.add(dust);
    const bpm = o.bpm || 72;
    return (lt, d, cam) => {
      const ph = (lt * bpm / 60) % 1, beat = Math.exp(-ph * 9) * .09 + Math.exp(-Math.max(0, ph - .18) * 10) * (ph > .18 ? .05 : 0);
      grp.scale.setScalar(1 + beat); grp.rotation.y = Math.sin(lt * .35) * .5 + (o.spin ? lt * .3 : 0);
      dust.rotation.y = lt * .05; const z = (o.zoom || 1) * (12 - ease(lt / d) * 1.6);
      cam.position.set(Math.sin(lt * .12) * 1.2, .6, z); cam.lookAt(0, o.y ?? -.2, 0);
    };
  },
  // layers: three nested shells (shadr outer, qalb, fu'ad core) that open one after another
  layers(S, o, R) {
    const cs = [col('#5fe3ff'), col('#9fd8ff'), col(o.accent || '#ffc861')], rs = [2.6, 1.75, .9];
    const shells = rs.map((r, k) => { const g = new THREE.IcosahedronGeometry(r, k === 2 ? 2 : 3);
      const m = new THREE.LineSegments(new THREE.WireframeGeometry(g), new THREE.LineBasicMaterial({ color: cs[k], transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      const f = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: cs[k], transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); m.add(f); S.add(m); return { m, f }; });
    const dust = points(R, 700, () => { const a = R() * 6.28, rr = 3 + R() * 2; return [Math.cos(a) * rr, (R() - .5) * 5, Math.sin(a) * rr]; }, '#5fe3ff', .05); S.add(dust);
    const step = o.step || 2.4;
    return (lt, d, cam) => {
      shells.forEach((s, k) => { const u = ease((lt - .3 - k * step) / 1), on = lt > .3 + (k + 1) * step + .2 && k < 2 ? .35 : 1;
        s.m.material.opacity = u * .55 * on; s.f.material.opacity = u * (k === 2 ? .35 : .05); s.m.rotation.set(lt * .1 * (k + 1), lt * .15 * (k % 2 ? -1 : 1), 0); });
      dust.rotation.y = -lt * .04; cam.position.set(0, .8, 9 - ease(lt / d) * 2.2); cam.lookAt(0, 0, 0);
    };
  },
  bars(S, o, R) {
    const vals = (o.values && o.values.length ? o.values : [3, 5, 8]).map(Number), mx = Math.max(...vals) || 1, acc = col(o.accent || '#ffcd82');
    const colsC = (o.colors || []).map(col);
    S.add(new THREE.HemisphereLight(col('#c9d4ff'), col('#141018'), 1)); const key = new THREE.DirectionalLight(col('#ffffff'), 1.4); key.position.set(4, 8, 6); S.add(key);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(9, 48), new THREE.MeshStandardMaterial({ color: col(o.floor || '#1b1f36'), roughness: 1 })); floor.rotation.x = -Math.PI / 2; S.add(floor);
    const grid = new THREE.GridHelper(16, 16, acc, col('#39406a')); grid.material.transparent = true; grid.material.opacity = .35; S.add(grid);
    const W = 1.3, gap = .55, x0 = -(vals.length * W + (vals.length - 1) * gap) / 2 + W / 2;
    const bars = vals.map((v, k) => { const m = new THREE.Mesh(new THREE.BoxGeometry(W, 1, W), new THREE.MeshStandardMaterial({ color: colsC[k] || acc.clone().offsetHSL(0, -.1 * k, -.12 * (vals.length - 1 - k)), roughness: .5, metalness: .1 }));
      m.position.x = x0 + k * (W + gap); S.add(m); return { m, h: 6 * v / mx }; });
    return (lt, d, cam) => {
      bars.forEach((b, k) => { const u = ease((lt - .3 - k * .35) / 1.4), h = Math.max(.02, b.h * u); b.m.scale.y = h; b.m.position.y = h / 2; });
      const a = -.5 + lt * .05; cam.position.set(Math.sin(a) * 11, 5.5, Math.cos(a) * 11); cam.lookAt(0, 2.4, 0);
    };
  },
  water(S, o, R) {
    const acc = col(o.accent || '#ffe2a8');
    S.fog = new THREE.Fog(col(o.fog || '#0d1430'), 8, 42);
    const geo = new THREE.PlaneGeometry(70, 70, 90, 90); geo.rotateX(-Math.PI / 2); const base = geo.attributes.position.array.slice();
    const sea = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: col(o.color || '#2a4a8a'), flatShading: true, roughness: .7, metalness: 0 })); S.add(sea);
    S.add(new THREE.HemisphereLight(col('#7d93d8'), col('#05070f'), .7));
    const moonL = new THREE.DirectionalLight(acc, 1.1); moonL.position.set(0, 6, -30); S.add(moonL);
    const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite(), color: acc, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); moon.scale.set(9, 9, 1); moon.position.set(0, 9, -40); S.add(moon);
    S.add(points(R, 600, () => [(R() - .5) * 90, 6 + R() * 30, -30 - R() * 10], '#dfe6ff', .15));
    const p = geo.attributes.position;
    return (lt, d, cam) => {
      for (let k = 0; k < p.count; k++) { const x = base[k * 3], z = base[k * 3 + 2];
        p.setY(k, Math.sin(x * .35 + lt * 1.1) * .35 + Math.sin(z * .5 + lt * .8 + x * .1) * .3 + (vnoise(x * .2 + lt * .2, z * .2) - .5) * .6); }
      p.needsUpdate = true; geo.computeVertexNormals();
      cam.position.set(Math.sin(lt * .1) * .8, 2.6, 10 - lt * .25 * (o.speed || 1)); cam.lookAt(0, 3, -30);
    };
  },
};

function points(R, n, f, color, size) {
  const pos = new Float32Array(n * 3); for (let k = 0; k < n; k++) pos.set(f(), k * 3);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ color: col(color), size, map: glowSprite(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
}

export const presets = Object.keys(PRESETS);

// create(options, { w, h, alpha, canvas }) → { canvas, render(lt, d), dispose() }
export function create(o = {}, { w = 540, h = 960, alpha = true, canvas } = {}) {
  const make = PRESETS[o.preset] || PRESETS.crystal;
  const R = mulberry((o.seed ?? 7) * 9301 + 49297);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha, preserveDrawingBuffer: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(1); renderer.localClippingEnabled = true; renderer.setSize(w, h, false); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const S = new THREE.Scene(); if (o.bg) S.background = col(o.bg);
  const cam = new THREE.PerspectiveCamera(o.fov || 50, w / h, .1, 200);
  const step = make(S, o, R);
  let last = null;
  return {
    canvas: renderer.domElement,
    render(lt, d = 6) { const key = Math.round(lt * 1000); if (key === last) return renderer.domElement; last = key; step(Math.max(0, lt), d, cam); renderer.render(S, cam); return renderer.domElement; },
    dispose() { renderer.dispose(); S.traverse(x => { x.geometry?.dispose?.(); x.material?.dispose?.(); }); },
  };
}
