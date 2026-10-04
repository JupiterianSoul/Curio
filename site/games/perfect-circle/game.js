(() => {
  const $ = (id) => document.getElementById(id);
  const stage = $('stage'), cv = $('cv'), g = cv.getContext('2d'), paper = $('paper'), pg = paper.getContext('2d');
  const pctEl = $('pct'), msgEl = $('msg'), detailEl = $('detail'), rankEl = $('rank');
  const FULL = Math.PI * 2, BINS = 720, MIN_R = 45, MAX_MS = 12000;

  function tableFromPoly(pts) {
    const t = new Float32Array(BINS);
    for (let k = 0; k < BINS; k++) {
      const a = k / BINS * FULL, dx = Math.cos(a), dy = Math.sin(a);
      let best = 0;
      for (let i = 0; i < pts.length; i++) {
        const [px, py] = pts[i], [qx, qy] = pts[(i + 1) % pts.length];
        const ex = qx - px, ey = qy - py, den = dx * ey - dy * ex;
        if (Math.abs(den) < 1e-9) continue;
        const tt = (px * ey - py * ex) / den, u = (px * dy - py * dx) / den;
        if (tt > 0 && u >= -1e-6 && u <= 1 + 1e-6) best = Math.max(best, tt);
      }
      t[k] = best;
    }
    let m = 0; for (const v of t) m += v; m /= BINS;
    for (let k = 0; k < BINS; k++) t[k] /= m;
    return t;
  }
  const ngon = (n, rot = -Math.PI / 2) => Array.from({ length: n }, (_, i) => [Math.cos(rot + i / n * FULL), Math.sin(rot + i / n * FULL)]);
  const star = () => Array.from({ length: 10 }, (_, i) => { const r = i % 2 ? .42 : 1, a = -Math.PI / 2 + i / 10 * FULL; return [Math.cos(a) * r, Math.sin(a) * r]; });
  const heart = () => Array.from({ length: 240 }, (_, i) => { const t = i / 240 * FULL; return [16 * Math.sin(t) ** 3 / 16, (-(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) - 1.5) / 16]; });

  const SHAPES = [
    { id: 'circle', name: 'Circle', table: null, period: FULL, icon: '<circle cx="10" cy="10" r="7.5"/>', verb: 'circle' },
    { id: 'square', name: 'Square', table: tableFromPoly(ngon(4, -Math.PI / 4)), period: FULL / 4, icon: '<rect x="3" y="3" width="14" height="14" rx="1"/>', verb: 'square' },
    { id: 'triangle', name: 'Triangle', table: tableFromPoly(ngon(3)), period: FULL / 3, icon: '<path d="M10 2.5 L18 16.5 H2Z"/>', verb: 'triangle' },
    { id: 'hexagon', name: 'Hexagon', table: tableFromPoly(ngon(6)), period: FULL / 6, icon: '<path d="M10 2 L17 6 V14 L10 18 L3 14 V6Z"/>', verb: 'hexagon' },
    { id: 'star', name: 'Star', table: tableFromPoly(star()), period: FULL / 5, icon: '<path d="M10 1.5 L12.4 7.2 L18.5 7.6 L13.8 11.6 L15.3 17.6 L10 14.3 L4.7 17.6 L6.2 11.6 L1.5 7.6 L7.6 7.2Z"/>', verb: 'star' },
    { id: 'heart', name: 'Heart', table: tableFromPoly(heart()), period: 0, rot: .45, icon: '<path d="M10 17 C2 11 2 5 6 4 C8 3.5 9.5 5 10 6.5 C10.5 5 12 3.5 14 4 C18 5 18 11 10 17Z"/>', verb: 'heart' }
  ];
  const INKS = [
    { id: 'pen', name: 'Accuracy pen', short: 'Pen', em: '🖊️' },
    { id: 'ink', name: 'Fountain ink', short: 'Ink', em: '🖋️' },
    { id: 'brush', name: 'Calligraphy', short: 'Brush', em: '🖌️' },
    { id: 'neon', name: 'Neon', short: 'Neon', em: '💡' },
    { id: 'chalk', name: 'Chalk', short: 'Chalk', em: '🧑‍🏫' }
  ];
  const ACH = [
    { id: 'first', em: '✏️', name: 'First Stroke', desc: 'Finish any drawing.' },
    { id: 'c90', em: '⭕', name: 'Round Enough', desc: 'Score 90% on a circle.' },
    { id: 'c95', em: '🎯', name: 'Frighteningly Round', desc: 'Score 95% on a circle.' },
    { id: 'c99', em: '🧭', name: 'Human Compass', desc: 'Score 99% on a circle.' },
    { id: 'square', em: '🟥', name: 'Four Corners', desc: 'Score 88% on a square.' },
    { id: 'triangle', em: '🔺', name: 'Pointy', desc: 'Score 88% on a triangle.' },
    { id: 'hexagon', em: '🐝', name: 'Bee Approved', desc: 'Score 90% on a hexagon.' },
    { id: 'star', em: '⭐', name: 'Star Quality', desc: 'Score 85% on a star.' },
    { id: 'heart', em: '❤️', name: 'Big Heart', desc: 'Score 85% on a heart.' },
    { id: 'all80', em: '🌈', name: 'Shape Shifter', desc: 'Score 80% on every shape.' },
    { id: 'blind', em: '🙈', name: 'Eyes Closed', desc: 'Score 90% in blind mode.' },
    { id: 'daily', em: '📅', name: 'Daily Doodler', desc: 'Finish a daily challenge.' },
    { id: 'both', em: '🔄', name: 'Ambidextrous', desc: 'Score 85% clockwise and anticlockwise.' },
    { id: 'speed', em: '⚡', name: 'Whoosh', desc: 'Score 90% in under one second.' },
    { id: 'inks', em: '🎨', name: 'Ink Collector', desc: 'Finish a drawing with every ink.' },
    { id: 'p50', em: '📚', name: 'Sketchbook', desc: 'Make 50 attempts.' }
  ];
  const COMMENTS = {
    circle: [[99.5, ['Are you secretly a compass?', 'Giotto is sweating.', 'We checked. That is a circle.']], [97, ['Frighteningly round.', 'Pi would be proud.', 'A wheel could roll on that.']], [94, ['That is a genuinely good circle.', 'Round enough to be a coin.', 'The dot feels very surrounded.']], [90, ['Solid circle. Respectable.', 'Nice! Could hold a pizza.', 'A circle any teacher would accept.']], [85, ['Pretty round. Mostly.', 'An enthusiastic circle.', 'Close. The dot is impressed-ish.']], [78, ['More of an egg, honestly.', 'Circle-adjacent.', 'It has circle energy.']], [65, ['That is a potato.', 'A bold, lumpy statement.', 'Abstract art, surely.']], [0, ['Was that on purpose?', 'That shape has no name yet.', 'The dot is concerned.']]],
    square: [[96, ['Architects want your number.', 'Ruler? What ruler?', 'Four perfect corners.']], [90, ['Crisp corners. Lovely.', 'That could be a window.', 'Very square. In a good way.']], [80, ['A slightly melted square.', 'Square-ish. Square-esque.']], [65, ['A rounded rectangle with feelings.', 'More of a cushion.']], [0, ['That is a circle wearing a hat.', 'The corners have left the building.']]],
    triangle: [[96, ['Pythagoras nods slowly.', 'Sharp enough to cut paper.']], [90, ['A fine triangle. Very pointy.', 'Could be a road sign.']], [80, ['Triangular vibes.', 'A friendly, soft triangle.']], [65, ['A slice of something.', 'A guitar pick, maybe.']], [0, ['That is not a triangle. That is a mood.', 'Three corners were promised.']]],
    hexagon: [[96, ['Bees would move in tomorrow.', 'Nature\'s favourite shape, nailed.']], [90, ['A great hexagon. Honeycomb grade.', 'Six sides, all present.']], [80, ['A pretty decent nut.', 'Hexagon-shaped object.']], [65, ['A circle with ambitions.', 'Six sides, in spirit.']], [0, ['The bees are confused.', 'How many sides was that?']]],
    star: [[95, ['A star is born.', 'Twinkle twinkle, wow.']], [88, ['Five points, all pointy.', 'That could top a tree.']], [78, ['A starfish, maybe.', 'Star-ish. A starlet.']], [60, ['A splat with confidence.', 'A very relaxed star.']], [0, ['Stars are hard. You tried.', 'The universe forgives you.']]],
    heart: [[95, ['That heart is lovely.', 'Valentine\'s Day is sorted.']], [88, ['A big, warm heart.', 'Very romantic geometry.']], [78, ['A heart, roughly.', 'Emotionally accurate.']], [60, ['A peach, perhaps?', 'A heart that has been through things.']], [0, ['That heart is broken.', 'Love is complicated.']]]
  };

  const KEY = 'pc:v2';
  const fresh = () => ({ v: 2, hist: [], hall: {}, attempts: {}, sum: {}, ach: {}, daily: {}, ink: 'pen', shape: 'circle', blind: false, inksUsed: {}, dirs: {} });
  let P = Object.assign(fresh(), Curio.store.get(KEY, {}) || {});
  if (P.v !== 2) P = fresh();
  ['hist'].forEach((k) => { if (!Array.isArray(P[k])) P[k] = []; });
  ['hall', 'attempts', 'sum', 'ach', 'daily', 'inksUsed', 'dirs'].forEach((k) => { if (!P[k] || typeof P[k] !== 'object') P[k] = {}; });
  const oldBest = Curio.getBest('score');
  if (oldBest != null && !P.hall.circle) P.hall.circle = [{ s: Number(oldBest), ts: Date.now(), path: '' }];
  const save = () => Curio.store.set(KEY, P);

  let shape = SHAPES.find((s) => s.id === P.shape) || SHAPES[0];
  let ink = INKS.find((i) => i.id === P.ink) || INKS[0];
  let blind = !!P.blind, daily = false;
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  function dailySpec() {
    let h = 2166136261; for (const c of today()) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
    h >>>= 0;
    return { shape: SHAPES[h % SHAPES.length], blind: ((h >>> 8) % 3) === 0 };
  }

  let W = 0, H = 0, cx = 0, cy = 0;
  let pts = [], state = 'idle', sweep = 0, lastAng = 0, dir = 0, maxProg = 0, t0 = 0, pointerId = null;
  let fitRes = null, result = null, reveal = 1, revealRaf = 0, lastFitN = 0;

  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const dark = () => Curio.isDark();

  function lookup(table, a) {
    let x = (a % FULL + FULL) % FULL / FULL * BINS;
    const i = Math.floor(x) % BINS, f = x - Math.floor(x);
    return table[i] * (1 - f) + table[(i + 1) % BINS] * f;
  }
  function fit(list, coarse) {
    if (list.length < 3) return null;
    if (!shape.table) {
      let s = 0; for (const p of list) s += p.r; const R = s / list.length;
      let e = 0; for (const p of list) { p.dev = (p.r - R) / R; e += Math.abs(p.dev); }
      return { R, phi: 0, err: e / list.length };
    }
    const evalPhi = (phi) => {
      let num = 0, den = 0;
      for (const p of list) { const s = lookup(shape.table, p.a - phi); num += p.r * s; den += s * s; }
      const R = num / den; let e = 0;
      for (const p of list) e += Math.abs(p.r - R * lookup(shape.table, p.a - phi));
      return { R, phi, err: e / list.length / R };
    };
    const lo = shape.period ? 0 : -shape.rot, hi = shape.period ? shape.period : shape.rot;
    const steps = coarse ? 24 : 72;
    let best = null;
    const stride = list.length > 300 && coarse ? 3 : 1;
    const sub = stride > 1 ? list.filter((_, i) => i % stride === 0) : list;
    const evalSub = (phi) => { const keep = list; list = sub; const r = evalPhi(phi); list = keep; return r; };
    for (let k = 0; k <= steps; k++) { const r = evalSub(lo + (hi - lo) * k / steps); if (!best || r.err < best.err) best = r; }
    const st = (hi - lo) / steps;
    for (let k = -8; k <= 8; k++) { const r = evalPhi(best.phi + st * k / 8); if (r.err < best.err) best = r; }
    for (const p of list) p.dev = (p.r - best.R * lookup(shape.table, p.a - best.phi)) / best.R;
    return best;
  }
  const scoreOf = (f) => (f ? Math.max(0, Math.min(100, 100 * (1 - f.err * 3.2))) : 0);
  const scoreColour = (s) => `hsl(${Math.max(0, Math.min(125, (s - 50) * 2.5)).toFixed(0)} 75% ${dark() ? 60 : 40}%)`;
  const devColour = (d) => { const e = Math.min(1, Math.abs(d) / .14); return `hsl(${(125 * (1 - e)).toFixed(0)} 80% ${dark() ? 58 : 44}%)`; };
  const rankOf = (s) => s >= 97 ? ['S', '#e6a100'] : s >= 90 ? ['A', '#1f9d55'] : s >= 80 ? ['B', '#2b87d1'] : s >= 65 ? ['C', '#8e6bd6'] : ['D', '#d64545'];

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = stage.clientWidth; H = stage.clientHeight;
    for (const c of [cv, paper]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0); pg.setTransform(dpr, 0, 0, dpr, 0, 0);
    const nx = W / 2, ny = H / 2 + (H > 560 ? 22 : 18);
    if (pts.length) { const dx = nx - cx, dy = ny - cy; pts.forEach((p) => { p.x += dx; p.y += dy; }); }
    cx = nx; cy = ny;
    drawPaper(); draw();
  }

  function hash(i, k) { let h = (i * 374761393 + k * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
  function drawPaper() {
    const chalk = ink.id === 'chalk';
    const d = dark();
    const base = chalk ? '#24392f' : d ? '#1a1815' : '#fbf6ec';
    pg.fillStyle = base; pg.fillRect(0, 0, W, H);
    const vg = pg.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .2, W / 2, H / 2, Math.max(W, H) * .75);
    vg.addColorStop(0, 'rgba(255,255,255,' + (chalk ? .05 : d ? .03 : .5) + ')'); vg.addColorStop(1, 'rgba(0,0,0,' + (chalk ? .35 : d ? .35 : .08) + ')');
    pg.fillStyle = vg; pg.fillRect(0, 0, W, H);
    const n = Math.round(W * H / 500);
    for (let i = 0; i < n; i++) {
      const x = hash(i, 1) * W, y = hash(i, 2) * H, a = hash(i, 3);
      pg.fillStyle = chalk ? `rgba(255,255,255,${a * .05})` : d ? `rgba(255,255,255,${a * .035})` : `rgba(120,90,50,${a * .06})`;
      pg.fillRect(x, y, 1 + hash(i, 4) * 1.5, 1 + hash(i, 5) * 1.5);
    }
    pg.strokeStyle = chalk ? 'rgba(255,255,255,.03)' : d ? 'rgba(255,255,255,.025)' : 'rgba(140,110,70,.05)';
    pg.lineWidth = 1;
    for (let i = 0; i < 60; i++) { const x = hash(i, 7) * W, y = hash(i, 8) * H, l = 20 + hash(i, 9) * 50, a = hash(i, 10) * 6; pg.beginPath(); pg.moveTo(x, y); pg.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); pg.stroke(); }
    if (chalk) {
      for (let i = 0; i < 14; i++) { const x = hash(i, 11) * W, y = hash(i, 12) * H, r = 60 + hash(i, 13) * 140; const sg = pg.createRadialGradient(x, y, 0, x, y, r); sg.addColorStop(0, 'rgba(255,255,255,.035)'); sg.addColorStop(1, 'rgba(255,255,255,0)'); pg.fillStyle = sg; pg.fillRect(x - r, y - r, r * 2, r * 2); }
    }
    document.documentElement.style.setProperty('--pc-ink', chalk ? '#f3eee7' : '');
    stage.classList.toggle('is-chalk', chalk);
  }

  function baseWidth() { return Math.max(6, Math.min(10, W / 90)); }

  function strokePath(list, upto, c = g, inkO = ink, L = baseWidth()) {
    const n = Math.min(list.length, upto);
    if (n < 2) return;
    c.lineCap = 'round'; c.lineJoin = 'round';
    if (inkO.id === 'pen') {
      c.save(); c.shadowColor = 'rgba(0,0,0,.18)'; c.shadowBlur = 4; c.shadowOffsetY = 2;
      for (let i = 1; i < n; i++) { const a = list[i - 1], b = list[i]; c.strokeStyle = devColour(b.dev || 0); c.lineWidth = L; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); }
      c.restore();
    } else if (inkO.id === 'ink') {
      const col = (inkO.id === 'chalk' ? '#f6f2ea' : dark() ? '#a9c0ff' : '#1b2a6b');
      c.save(); c.globalAlpha = .16; c.strokeStyle = col; c.lineWidth = L * 2.2;
      c.beginPath(); c.moveTo(list[0].x, list[0].y); for (let i = 1; i < n; i++) c.lineTo(list[i].x, list[i].y); c.stroke();
      c.globalAlpha = .12; c.lineWidth = L * 3; c.stroke();
      c.restore();
      c.strokeStyle = col;
      for (let i = 1; i < n; i++) { const a = list[i - 1], b = list[i]; c.lineWidth = b.w * L * 1.25; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); }
      c.fillStyle = col; c.beginPath(); c.arc(list[0].x, list[0].y, L * .9, 0, FULL); c.fill();
      if (state !== 'drawing') { const e = list[n - 1]; c.beginPath(); c.arc(e.x, e.y, L * .7, 0, FULL); c.fill(); }
    } else if (inkO.id === 'brush') {
      const col = dark() ? '#f1e9dc' : '#161311';
      c.fillStyle = col;
      const nx = Math.cos(-Math.PI / 4), ny = Math.sin(-Math.PI / 4);
      for (let i = 1; i < n; i++) {
        const a = list[i - 1], b = list[i], wa = L * 1.25 * a.w, wb = L * 1.25 * b.w;
        c.beginPath(); c.moveTo(a.x + nx * wa, a.y + ny * wa); c.lineTo(b.x + nx * wb, b.y + ny * wb); c.lineTo(b.x - nx * wb, b.y - ny * wb); c.lineTo(a.x - nx * wa, a.y - ny * wa); c.closePath(); c.fill();
      }
      c.strokeStyle = col; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(list[0].x, list[0].y); for (let i = 1; i < n; i++) c.lineTo(list[i].x, list[i].y); c.stroke();
    } else if (inkO.id === 'neon') {
      c.save(); c.globalCompositeOperation = dark() ? 'lighter' : 'source-over';
      for (const [wm, al] of [[3.2, .12], [2, .22], [.9, 1]]) {
        c.lineWidth = L * wm;
        for (let i = 1; i < n; i += 8) {
          const hue = (i * 1.2 + 280) % 360;
          c.strokeStyle = `hsl(${hue} 100% ${dark() ? 62 : 52}% / ${al})`;
          c.beginPath(); c.moveTo(list[i - 1].x, list[i - 1].y);
          for (let k = i; k < Math.min(n, i + 8); k++) c.lineTo(list[k].x, list[k].y);
          c.stroke();
        }
      }
      c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = L * .25;
      c.beginPath(); c.moveTo(list[0].x, list[0].y); for (let i = 1; i < n; i++) c.lineTo(list[i].x, list[i].y); c.stroke();
      c.restore();
    } else if (inkO.id === 'chalk') {
      for (let i = 1; i < n; i++) {
        const a = list[i - 1], b = list[i], d = Math.hypot(b.x - a.x, b.y - a.y), m = Math.max(2, Math.round(d / 1.2));
        for (let k = 0; k < m; k++) {
          const t = k / m, x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
          for (let q = 0; q < 3; q++) {
            const r1 = hash(i * 31 + k, q), r2 = hash(i * 17 + k, q + 9);
            c.fillStyle = `rgba(246,242,234,${.35 + r1 * .5})`;
            c.fillRect(x + (r1 - .5) * L * 1.2, y + (r2 - .5) * L * 1.2, 1.6 + r2 * 1.6, 1.6 + r1 * 1.6);
          }
        }
      }
    }
  }

  function idealPath(f) {
    g.beginPath();
    for (let k = 0; k <= BINS; k++) {
      const a = k / BINS * FULL, r = shape.table ? f.R * lookup(shape.table, a - f.phi) : f.R;
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      k ? g.lineTo(x, y) : g.moveTo(x, y);
    }
  }

  function draw() {
    g.clearRect(0, 0, W, H);
    const ink3 = ink.id === 'chalk' ? 'rgba(255,255,255,.5)' : css('--ink-3') || '#999';
    const inkC = ink.id === 'chalk' ? '#f6f2ea' : css('--ink') || '#222';
    if (result && state === 'done') {
      g.save(); g.setLineDash([6, 8]); g.lineWidth = 2; g.strokeStyle = ink3; g.globalAlpha = .75;
      const total = 2 * Math.PI * result.R * 1.15;
      g.lineDashOffset = 0;
      if (reveal < 1) { g.setLineDash([total * reveal, total]); }
      idealPath(result); g.stroke(); g.restore();
    }
    const showPath = !(blind && state === 'drawing');
    g.globalAlpha = state === 'error' ? .35 : 1;
    if (showPath) strokePath(pts, state === 'done' && blind ? Math.ceil(pts.length * reveal) : pts.length);
    else if (pts.length) { const p = pts[pts.length - 1]; g.fillStyle = inkC; g.globalAlpha = .5; g.beginPath(); g.arc(p.x, p.y, 4, 0, FULL); g.fill(); }
    g.globalAlpha = 1;
    if (result && state === 'done' && reveal >= 1 && result.worst) {
      const w = result.worst;
      g.strokeStyle = '#d64545'; g.lineWidth = 2.5; g.beginPath(); g.arc(w.x, w.y, 14, 0, FULL); g.stroke();
      g.fillStyle = '#d64545'; g.font = '800 12px ' + (css('--font') || 'sans-serif'); g.textAlign = 'center';
      const ox = (w.x - cx) / Math.hypot(w.x - cx, w.y - cy), oy = (w.y - cy) / Math.hypot(w.x - cx, w.y - cy);
      g.fillText('wobble', w.x + ox * 30, w.y + oy * 30 + 4);
    }
    g.fillStyle = inkC;
    g.beginPath(); g.arc(cx, cy, 7, 0, FULL); g.fill();
    if (state === 'idle') {
      const t = performance.now() / 1000;
      g.strokeStyle = inkC; g.globalAlpha = .12 + Math.sin(t * 2) * .05; g.lineWidth = 2;
      g.beginPath(); g.arc(cx, cy, 16 + Math.sin(t * 2) * 3, 0, FULL); g.stroke(); g.globalAlpha = 1;
    }
  }

  let idleRaf = 0;
  function idleLoop() { if (state === 'idle' && !document.hidden) { draw(); idleRaf = requestAnimationFrame(idleLoop); } else idleRaf = 0; }

  let scratch = null;
  function scratchStart() {
    if (Curio.muted) return;
    const ac = Curio.audioContext && Curio.audioContext(); if (!ac) return;
    const len = ac.sampleRate, buf = ac.createBuffer(1, len, ac.sampleRate), ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource(), f = ac.createBiquadFilter(), gn = ac.createGain();
    src.buffer = buf; src.loop = true; f.type = 'bandpass'; f.frequency.value = ink.id === 'chalk' ? 1800 : ink.id === 'brush' ? 900 : 3200; f.Q.value = .8; gn.gain.value = 0;
    src.connect(f).connect(gn).connect(ac.destination); src.start();
    scratch = { src, gn, ac };
  }
  function scratchSpeed(v) { if (scratch) scratch.gn.gain.setTargetAtTime(Math.min(.09, v * .05), scratch.ac.currentTime, .03); }
  function scratchStop() { if (scratch) { try { scratch.gn.gain.setTargetAtTime(0, scratch.ac.currentTime, .03); scratch.src.stop(scratch.ac.currentTime + .15); } catch {} scratch = null; } }
  function chime(s) {
    const notes = s >= 97 ? [523, 659, 784, 1047, 1319] : s >= 90 ? [523, 659, 784, 1047] : s >= 80 ? [440, 554, 659] : [330, 392];
    notes.forEach((f, i) => setTimeout(() => Curio.beep(f, .22, 'triangle', .09), i * 80));
  }
  const buzz = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch {} };

  function setScore(text, colour) { pctEl.textContent = text; pctEl.style.color = colour || ''; }
  function pos(e) { const b = cv.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; }

  function start(p) {
    if (state === 'drawing') return;
    if (!$('sheet').hidden) return;
    p.event.preventDefault();
    pointerId = p.event.pointerId;
    const { x, y } = p;
    cancelAnimationFrame(revealRaf);
    pts = []; result = null; fitRes = null; sweep = 0; dir = 0; maxProg = 0; t0 = performance.now(); lastFitN = 0; reveal = 1;
    lastAng = Math.atan2(y - cy, x - cx);
    state = 'drawing';
    stage.classList.add('is-drawing');
    pctEl.classList.remove('is-final'); rankEl.className = 'pc-rank';
    msgEl.textContent = ''; msgEl.classList.remove('is-err'); detailEl.innerHTML = '';
    $('again').classList.add('pc-hidden'); $('shareBtn').classList.add('pc-hidden');
    setScore('');
    const r = Math.hypot(x - cx, y - cy);
    pts.push({ x, y, r, a: lastAng, t: t0, w: 1, dev: 0 });
    if (r < MIN_R) return fail('Too close to the dot');
    scratchStart();
    draw();
  }

  function addPoint(x, y, t, pressure) {
    const r = Math.hypot(x - cx, y - cy);
    if (r < MIN_R * .6) return fail('Too close to the dot');
    const ang = Math.atan2(y - cy, x - cx);
    let d = ang - lastAng;
    if (d > Math.PI) d -= FULL; else if (d < -Math.PI) d += FULL;
    lastAng = ang;
    sweep += d;
    if (!dir && Math.abs(sweep) > .35) dir = Math.sign(sweep);
    if (dir) { const prog = sweep * dir; maxProg = Math.max(maxProg, prog); if (prog < maxProg - .5) return fail('Wrong way?'); }
    const last = pts[pts.length - 1];
    const dt = Math.max(1, t - last.t), sp = Math.hypot(x - last.x, y - last.y) / dt;
    let w = Math.max(.35, Math.min(1.5, 1.45 - sp * .55));
    if (pressure && pressure !== .5 && pressure > 0) w *= .5 + pressure;
    w = last.w + (w - last.w) * .25;
    pts.push({ x, y, r, a: ang, t, w, dev: last.dev });
    scratchSpeed(sp);
    return true;
  }

  function move(p) {
    if (state !== 'drawing') return;
    const e = p.event;
    const list = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
    const events = list.length ? list : [e];
    for (const ev of events) {
      const { x, y } = pos(ev);
      const last = pts[pts.length - 1];
      if (Math.hypot(x - last.x, y - last.y) < 1.5) continue;
      if (addPoint(x, y, ev.timeStamp || performance.now(), ev.pressure) !== true) return;
      if (Math.abs(sweep) >= FULL) return finish();
    }
    if (performance.now() - t0 > (Curio.touchpad ? MAX_MS * 2 : MAX_MS)) return fail('Too slow');
    if (pts.length - lastFitN >= (shape.table ? 6 : 2)) {
      lastFitN = pts.length;
      fitRes = fit(pts, true);
      if (fitRes && fitRes.R < MIN_R * .8 && pts.length > 10) return fail('Too close to the dot');
      if (Math.abs(sweep) > .5 && !blind) setScore(scoreOf(fitRes).toFixed(1) + '%', scoreColour(scoreOf(fitRes)));
      if (blind && Math.abs(sweep) > .5) setScore('?', '');
    }
    draw();
  }

  function end() {
    pointerId = null;
    if (state === 'drawing') fail(Curio.touchpad ? `Keep going until the ${shape.verb} closes` : `Draw a full ${shape.verb}`);
  }
  let unDrag = null;
  function bindDrag() { unDrag = Curio.drag(cv, { start, move, end }); }
  function releaseDrag() { if (unDrag) unDrag(); cv.classList.remove('curio-latched'); bindDrag(); }

  function fail(text) {
    state = 'error';
    pointerId = null;
    releaseDrag();
    scratchStop();
    stage.classList.remove('is-drawing');
    setScore('×', 'var(--bad)');
    msgEl.textContent = text; msgEl.classList.add('is-err');
    Curio.beep(150, .18, 'square', .08); buzz(40);
    $('again').classList.remove('pc-hidden');
    draw();
    return false;
  }

  function thumb() {
    const step = Math.max(1, Math.floor(pts.length / 64));
    const R = result.R || 1;
    const out = [];
    for (let i = 0; i < pts.length; i += step) { const p = pts[i]; out.push(Math.round(50 + (p.x - cx) / R * 34) + ',' + Math.round(50 + (p.y - cy) / R * 34)); }
    return out.join(' ');
  }

  function unlock(id) {
    if (P.ach[id]) return;
    const a = ACH.find((x) => x.id === id); if (!a) return;
    P.ach[id] = Date.now();
    const b = document.createElement('div'); b.className = 'pc-badge';
    b.innerHTML = `<i>${a.em}</i><span><small>Badge unlocked</small><b></b></span>`; b.querySelector('b').textContent = a.name;
    stage.append(b); setTimeout(() => b.remove(), 3100);
    setTimeout(() => { Curio.beep(988, .1, 'triangle', .08); Curio.beep(1319, .2, 'triangle', .07); }, 400);
  }

  function finish() {
    state = 'done';
    pointerId = null;
    releaseDrag();
    scratchStop();
    stage.classList.remove('is-drawing');
    result = fit(pts, false);
    let worst = null;
    for (const p of pts) if (!worst || Math.abs(p.dev) > Math.abs(worst.dev)) worst = p;
    result.worst = worst;
    const s = Math.round(scoreOf(result) * 10) / 10;
    const ms = pts[pts.length - 1].t - pts[0].t;
    const [rk, rc] = rankOf(s);
    P.attempts[shape.id] = (P.attempts[shape.id] || 0) + 1;
    P.sum[shape.id] = (P.sum[shape.id] || 0) + s;
    const prevBest = (P.hall[shape.id] || [])[0]?.s;
    const entry = { s, ts: Date.now(), path: thumb(), blind: blind ? 1 : 0, daily: daily ? today() : '', ink: ink.id, dir: dir > 0 ? 'cw' : 'ccw', ms: Math.round(ms) };
    const hall = (P.hall[shape.id] || []).concat(entry).sort((a, b) => b.s - a.s).slice(0, 10);
    P.hall[shape.id] = hall;
    const place = hall.indexOf(entry);
    P.hist.push({ s, shape: shape.id, ts: entry.ts, blind: entry.blind, daily: entry.daily });
    if (P.hist.length > 120) P.hist.splice(0, P.hist.length - 120);
    let dailyNew = false;
    if (daily) { const prev = P.daily[today()]; if (prev == null || s > prev) { P.daily[today()] = s; dailyNew = true; } unlock('daily'); }
    if (shape.id === 'circle') Curio.best('score', s, true);
    unlock('first');
    if (shape.id === 'circle' && s >= 90) unlock('c90');
    if (shape.id === 'circle' && s >= 95) unlock('c95');
    if (shape.id === 'circle' && s >= 99) unlock('c99');
    const thr = { square: 88, triangle: 88, hexagon: 90, star: 85, heart: 85 };
    if (thr[shape.id] && s >= thr[shape.id]) unlock(shape.id);
    if (SHAPES.every((sh) => (P.hall[sh.id] || [])[0]?.s >= 80)) unlock('all80');
    if (blind && s >= 90) unlock('blind');
    if (s >= 85) { P.dirs[dir > 0 ? 'cw' : 'ccw'] = 1; if (P.dirs.cw && P.dirs.ccw) unlock('both'); }
    if (s >= 90 && ms < 1000) unlock('speed');
    P.inksUsed[ink.id] = 1; if (INKS.every((i) => P.inksUsed[i.id])) unlock('inks');
    if (Object.values(P.attempts).reduce((a, b) => a + b, 0) >= 50) unlock('p50');
    save();

    const isNew = prevBest == null || s > prevBest;
    const tiers = COMMENTS[shape.id];
    msgEl.textContent = Curio.pick(tiers.find(([min]) => s >= min)[1]);
    rankEl.textContent = rk; rankEl.style.background = rc;
    const R = result.R;
    const chips = [];
    if (isNew && prevBest != null) chips.push('<span class="new">New best!</span>');
    else if (place >= 0 && place < 3 && hall.length > 1) chips.push(`<span class="new">#${place + 1} in hall of fame</span>`);
    if (daily) chips.push(`<span${dailyNew ? ' class="new"' : ''}>Daily ${dailyNew ? 'best' : ''} ${P.daily[today()].toFixed(1)}%</span>`);
    chips.push(`<span>${(ms / 1000).toFixed(2)}s</span>`, `<span>${dir > 0 ? 'clockwise' : 'anticlockwise'}</span>`, `<span>${Math.round(R)}px</span>`, `<span>worst ${(Math.abs(worst.dev) * 100).toFixed(0)}% off</span>`);
    detailEl.innerHTML = chips.map((c, i) => c.replace('<span', `<span style="animation-delay:${.5 + i * .06}s"`)).join('');
    paintBest();
    $('again').classList.remove('pc-hidden'); $('shareBtn').classList.remove('pc-hidden');
    lastShare = { s, rk, ms };
    reveal = 0;
    const rs = performance.now(), dur = blind ? 900 : 600;
    const anim = (now) => {
      reveal = Math.min(1, (now - rs) / dur);
      const e = 1 - Math.pow(1 - reveal, 3);
      setScore((s * e).toFixed(1) + '%', scoreColour(s * e));
      draw();
      if (reveal < 1) revealRaf = requestAnimationFrame(anim);
      else {
        setScore(s.toFixed(1) + '%', scoreColour(s));
        pctEl.classList.remove('is-final'); void pctEl.offsetWidth; pctEl.classList.add('is-final');
        rankEl.classList.add('on');
        chime(s); buzz(s >= 90 ? [20, 40, 20, 40, 60] : 30);
        if (isNew && prevBest != null && s >= 80) Curio.confetti();
        else if (s >= 97) Curio.confetti(80);
        draw();
      }
    };
    revealRaf = requestAnimationFrame(anim);
  }
  let lastShare = null;

  function reset() {
    cancelAnimationFrame(revealRaf);
    pts = []; result = null; state = 'idle'; reveal = 1;
    setScore(''); msgEl.textContent = ''; detailEl.innerHTML = ''; rankEl.className = 'pc-rank';
    $('again').classList.add('pc-hidden'); $('shareBtn').classList.add('pc-hidden');
    draw(); if (!idleRaf) idleRaf = requestAnimationFrame(idleLoop);
  }

  function paintBest() {
    const b = (P.hall[shape.id] || [])[0];
    $('best').textContent = b ? b.s.toFixed(1) + '%' : '-';
    document.querySelectorAll('.pc-shape').forEach((el) => {
      const sh = SHAPES.find((s) => s.id === el.dataset.id);
      el.setAttribute('aria-pressed', String(sh === shape));
      el.disabled = daily && sh !== shape;
      const hb = (P.hall[sh.id] || [])[0];
      el.querySelector('i').textContent = hb ? Math.round(hb.s) + '%' : '';
    });
    $('title').textContent = `Draw a perfect ${shape.verb}`;
    const how = (shape.id === 'circle' ? 'Go around the dot in one smooth loop. Either direction. No pressure.' : `Go around the dot in one loop. Any size, any rotation${shape.id === 'heart' ? ' (keep it roughly upright)' : ''}.`) + (Curio.touchpad ? ' Touchpad mode: click once, glide around, it ends itself.' : '');
    $('sub').textContent = daily ? `Daily challenge for ${today()}: ${shape.name}${blind ? ', blind' : ''}. ${P.daily[today()] != null ? 'Today\'s best: ' + P.daily[today()].toFixed(1) + '%' : 'Best attempt counts.'}` : (blind ? 'Blind mode: your line stays invisible until you finish. ' : '') + how;
    $('blindBtn').setAttribute('aria-pressed', String(blind)); $('blindBtn').disabled = daily;
    $('dailyBtn').setAttribute('aria-pressed', String(daily));
    $('inkName').textContent = ink.short;
  }

  function buildShapes() {
    const box = $('shapes');
    box.innerHTML = SHAPES.map((s) => `<button class="pc-shape" type="button" data-id="${s.id}" title="${s.name}" aria-label="${s.name}"><svg viewBox="0 0 20 20" aria-hidden="true">${s.icon}</svg><span>${s.name}</span><i></i></button>`).join('');
    box.addEventListener('click', (e) => {
      const b = e.target.closest('.pc-shape'); if (!b || b.disabled || state === 'drawing') return;
      setShape(SHAPES.find((s) => s.id === b.dataset.id));
    });
  }
  function setShape(sh) {
    shape = sh; P.shape = sh.id; save(); reset(); paintBest();
    Curio.beep(660, .05, 'triangle', .06);
  }
  function setInk(i) {
    ink = i; P.ink = i.id; save(); drawPaper(); draw(); paintBest();
  }

  const sheet = $('sheet'), sheetBody = $('sheetBody'), sheetTabs = $('sheetTabs');
  let hallTab = 'circle';
  function openSheet(kind) {
    sheet.hidden = false; sheet.dataset.kind = kind;
    if (kind === 'ink') {
      $('sheetTitle').textContent = 'Choose your ink'; sheetTabs.innerHTML = '';
      sheetBody.innerHTML = `<div class="pc-inks">${INKS.map((i) => `<button class="pc-ink" type="button" data-id="${i.id}" aria-pressed="${i === ink}"><canvas width="280" height="120"></canvas>${i.em} ${i.name}</button>`).join('')}</div>`;
      sheetBody.querySelectorAll('.pc-ink').forEach((b) => {
        previewInk(b.querySelector('canvas'), INKS.find((i) => i.id === b.dataset.id));
        b.addEventListener('click', () => { setInk(INKS.find((i) => i.id === b.dataset.id)); closeSheet(); });
      });
    } else {
      $('sheetTitle').textContent = 'Hall of fame';
      const tabs = SHAPES.map((s) => [s.id, s.name]).concat([['stats', 'Stats'], ['badges', 'Badges'], ['help', 'How']]);
      sheetTabs.innerHTML = tabs.map(([id, n]) => `<button class="pc-tab" role="tab" type="button" data-id="${id}" aria-selected="${id === hallTab}">${n}</button>`).join('');
      sheetTabs.querySelectorAll('.pc-tab').forEach((b) => b.addEventListener('click', () => { hallTab = b.dataset.id; openSheet('hall'); }));
      renderHall();
    }
    $('sheetClose').focus({ preventScroll: true });
  }
  function closeSheet() { sheet.hidden = true; }
  function idealSvg(sh) {
    if (!sh.table) return '<circle cx="50" cy="50" r="34" fill="none" stroke="currentColor" stroke-opacity=".2" stroke-dasharray="3 4"/>';
    let d = '';
    for (let k = 0; k <= BINS; k += 6) { const a = k / BINS * FULL, r = 34 * sh.table[k % BINS]; d += (k ? 'L' : 'M') + (50 + Math.cos(a) * r).toFixed(1) + ' ' + (50 + Math.sin(a) * r).toFixed(1); }
    return `<path d="${d}Z" fill="none" stroke="currentColor" stroke-opacity=".2" stroke-dasharray="3 4"/>`;
  }
  function renderHall() {
    const t = hallTab;
    if (SHAPES.some((s) => s.id === t)) {
      const sh = SHAPES.find((s) => s.id === t), list = P.hall[t] || [];
      const att = P.attempts[t] || 0, avg = att ? (P.sum[t] / att).toFixed(1) + '%' : '-';
      sheetBody.innerHTML = `<div class="pc-stats"><div><b>${list[0] ? list[0].s.toFixed(1) + '%' : '-'}</b><span>Best</span></div><div><b>${avg}</b><span>Average</span></div><div><b>${att}</b><span>Attempts</span></div></div>` +
        (list.length ? `<ol class="pc-list">${list.map((e, i) => `<li class="pc-row${i === 0 ? ' gold' : ''}"><b class="pos">${['🥇', '🥈', '🥉'][i] || i + 1}</b><svg viewBox="0 0 100 100" aria-hidden="true" style="color:var(--ink)">${idealSvg(sh)}${e.path ? `<polyline points="${e.path}" fill="none" stroke="${scoreColour(e.s)}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>` : ''}</svg><span><span class="pc-when">${new Date(e.ts).toLocaleDateString()}${e.blind ? ' · 🙈 blind' : ''}${e.daily ? ' · 📅 daily' : ''}${e.ms ? ' · ' + (e.ms / 1000).toFixed(1) + 's' : ''}</span></span><b class="pc-sc" style="color:${scoreColour(e.s)}">${e.s.toFixed(1)}%</b></li>`).join('')}</ol>` : `<p class="pc-empty">No ${sh.name.toLowerCase()}s yet. Go draw one!</p>`);
    } else if (t === 'stats') {
      const h = P.hist.slice(-40);
      const total = Object.values(P.attempts).reduce((a, b) => a + b, 0);
      const days = Object.keys(P.daily).length;
      let spark = '';
      if (h.length > 1) {
        const x = (i) => 6 + i / (h.length - 1) * 488, y = (v) => 84 - v / 100 * 76;
        spark = `<svg class="pc-spark" viewBox="0 0 500 90" role="img" aria-label="Your last ${h.length} scores"><line x1="0" x2="500" y1="${y(90)}" y2="${y(90)}" stroke="var(--line)" stroke-dasharray="4 4"/><polyline points="${h.map((e, i) => x(i).toFixed(1) + ',' + y(e.s).toFixed(1)).join(' ')}" fill="none" stroke="var(--ink-3)" stroke-width="2"/>${h.map((e, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(e.s).toFixed(1)}" r="3.5" fill="${scoreColour(e.s)}"/>`).join('')}</svg>`;
      }
      sheetBody.innerHTML = `<div class="pc-stats"><div><b>${total}</b><span>Attempts</span></div><div><b>${days}</b><span>Dailies</span></div><div><b>${Object.keys(P.ach).length}/${ACH.length}</b><span>Badges</span></div></div>${spark || '<p class="pc-empty">Draw a few shapes to see your trend.</p>'}<div class="pc-stats">${SHAPES.map((s) => `<div><b style="color:${(P.hall[s.id] || [])[0] ? scoreColour(P.hall[s.id][0].s) : 'inherit'}">${(P.hall[s.id] || [])[0] ? P.hall[s.id][0].s.toFixed(1) + '%' : '-'}</b><span>${s.name}</span></div>`).join('')}</div>`;
    } else if (t === 'badges') {
      sheetBody.innerHTML = `<div class="pc-achs">${ACH.map((a) => `<div class="pc-ach ${P.ach[a.id] ? 'got' : ''}"><i>${a.em}</i><b>${a.name}</b>${a.desc}</div>`).join('')}</div>`;
    } else {
      sheetBody.innerHTML = `<div class="pc-help"><p>Press down anywhere and draw your shape around the dot in one continuous loop, then come back to where you started. Clockwise or anticlockwise, any size.</p><p>Your score compares every point you drew with the closest perfect version of the shape (best size and rotation). The dashed outline shows that perfect shape, and the red ring marks your biggest wobble.</p><p><b>Blind mode</b> hides your line until you finish. The <b>daily challenge</b> gives everyone the same shape each day. Inks are purely for looks, except the accuracy pen, which colours your line by how close it is.</p><p>Shortcuts: <span class="c-kbd">1</span> to <span class="c-kbd">6</span> shapes, <span class="c-kbd">I</span> ink, <span class="c-kbd">B</span> blind, <span class="c-kbd">D</span> daily, <span class="c-kbd">H</span> hall, <span class="c-kbd">Space</span> try again.</p><p>On a laptop touchpad, turn on <b>Touchpad mode</b> in the top bar: click once to put the pen down, glide around the dot without pressing, and the shape finishes by itself when the loop closes. Click again or press <span class="c-kbd">Esc</span> to give up.</p></div>`;
    }
  }
  function previewInk(c, i) {
    const cg = c.getContext('2d');
    cg.fillStyle = i.id === 'chalk' ? '#24392f' : dark() ? '#1a1815' : '#fbf6ec'; cg.fillRect(0, 0, 280, 120);
    const list = [];
    for (let k = 0; k <= 60; k++) { const t = k / 60; list.push({ x: 24 + t * 232, y: 60 + Math.sin(t * Math.PI * 2) * 30, w: .5 + Math.abs(Math.cos(t * Math.PI * 2)) * .9, dev: Math.sin(t * 9) * .12, t: k * 16 }); }
    strokePath(list, list.length, cg, i, 8);
  }

  $('inkBtn').addEventListener('click', () => openSheet('ink'));
  $('hallBtn').addEventListener('click', () => openSheet('hall'));
  $('sheetClose').addEventListener('click', closeSheet);
  sheet.addEventListener('pointerdown', (e) => { if (e.target === sheet) closeSheet(); });
  $('blindBtn').addEventListener('click', () => { if (daily || state === 'drawing') return; blind = !blind; P.blind = blind; save(); reset(); paintBest(); Curio.toast(blind ? '🙈 Blind mode on' : '👀 Blind mode off'); });
  $('dailyBtn').addEventListener('click', () => {
    if (state === 'drawing') return;
    daily = !daily;
    if (daily) { const d = dailySpec(); shape = d.shape; blind = d.blind; }
    else { blind = !!P.blind; shape = SHAPES.find((s) => s.id === P.shape) || SHAPES[0]; }
    reset(); paintBest();
    Curio.toast(daily ? `📅 Daily: ${shape.name}${blind ? ' (blind)' : ''}` : 'Free practice');
  });
  $('shareBtn').addEventListener('click', async () => {
    if (!lastShare) return;
    const txt = `${['⭕', '⬜', '🔺', '⬡', '⭐', '❤️'][SHAPES.indexOf(shape)]} I drew a ${lastShare.s.toFixed(1)}% perfect ${shape.verb} (rank ${lastShare.rk}) in ${(lastShare.ms / 1000).toFixed(1)}s${blind ? ', blind' : ''}${daily ? ' on the ' + today() + ' daily' : ''}. Zoble`;
    try { await navigator.clipboard.writeText(txt); Curio.toast('Copied to clipboard'); } catch { Curio.toast(txt, 4000); }
  });

  bindDrag();
  addEventListener('curio:touchpad', (e) => { paintBest(); if (e.detail) Curio.toast('Touchpad mode: click once to start, glide around the dot, the shape finishes itself when you get back to the start', 4200); });
  $('again').addEventListener('click', reset);
  document.addEventListener('keydown', (e) => {
    if (document.querySelector('.curio-modal')) return;
    if (e.key === 'Escape' && !sheet.hidden) { closeSheet(); return; }
    if (!sheet.hidden || state === 'drawing' || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (/^[1-6]$/.test(k) && !daily) setShape(SHAPES[Number(k) - 1]);
    else if (k === 'i') { const i = INKS.indexOf(ink); setInk(INKS[(i + 1) % INKS.length]); Curio.toast(`${ink.em} ${ink.name}`); }
    else if (k === 'b') $('blindBtn').click();
    else if (k === 'd') $('dailyBtn').click();
    else if (k === 'h') openSheet('hall');
    else if (k === ' ' && state !== 'idle') { e.preventDefault(); reset(); }
  });
  window.addEventListener('resize', resize);
  window.addEventListener('curio:theme', () => { drawPaper(); draw(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state === 'drawing') fail('Too slow');
    if (!document.hidden && state === 'idle' && !idleRaf) idleRaf = requestAnimationFrame(idleLoop);
  });

  buildShapes();
  paintBest();
  if (!Curio.touchpad && !Curio.store.get('tp-hint-perfect-circle', false) && matchMedia('(pointer: fine)').matches) { Curio.store.set('tp-hint-perfect-circle', true); setTimeout(() => Curio.toast('Tip: on a laptop touchpad, turn on Touchpad mode in the top bar. Click once, glide around the dot, done.', 4200), 1800); }
  window.__circle = { get center() { return { x: cx, y: cy }; }, get state() { return state; }, get P() { return P; }, setShape: (id) => setShape(SHAPES.find((s) => s.id === id)), setInk: (id) => setInk(INKS.find((i) => i.id === id)), SHAPES };
  resize();
  idleRaf = requestAnimationFrame(idleLoop);
})();
