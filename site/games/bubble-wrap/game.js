(() => {
  const D = window.BUBBLE_DATA;
  const $ = (id) => document.getElementById(id);
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const MATS = Object.fromEntries(D.MATERIALS.map((m) => [m.id, m]));
  const PICS = Object.fromEntries(D.PICTURES.map((p) => [p.id, p]));

  const KEY = 'bubble-wrap:v2';
  function loadSave() {
    const base = { v: 2, total: 0, perMat: {}, sheets: 0, bestSprint: {}, bestRush: {}, bestCombo: 0, art: {}, daily: {}, ach: {}, days: {}, flips: 0, kernels: 0, settings: { mat: 'classic', mode: 'relax', auto: true } };
    const s = Curio.store.get(KEY, null);
    if (!s || s.v !== 2) {
      base.total = +Curio.store.get('bubble-wrap:total', 0) || 0;
      base.sheets = +Curio.store.get('bubble-wrap:sheets', 0) || 0;
      return base;
    }
    return { ...base, ...s, settings: { ...base.settings, ...(s.settings || {}) }, perMat: s.perMat || {}, bestSprint: s.bestSprint || {}, bestRush: s.bestRush || {}, art: s.art || {}, daily: s.daily || {}, ach: s.ach || {}, days: s.days || {} };
  }
  const save = loadSave();
  let saveT = 0;
  const persist = () => { clearTimeout(saveT); saveT = setTimeout(() => Curio.store.set(KEY, save), 300); };
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  function strSeed(str) { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  const unlocked = (m) => !MATS[m].unlock || save.total >= MATS[m].unlock;

  const cv = $('sheet'), g = cv.getContext('2d');
  const wrap = $('sheetWrap');
  let W = 0, H = 0, dpr = 1, dark = false;
  let mat = unlocked(save.settings.mat) ? save.settings.mat : 'classic';
  let mode = save.settings.mode;
  if (!D.MODES.some((m) => m.id === mode)) mode = 'relax';
  let rows = new Map(), finite = null, scrollY = 0, targetScroll = 0, minScroll = 0, rowH = 50, layout = null;
  let sessionPops = 0, sheetPops = 0, startT = 0, running = false, done = false, combo = 0, lastPopT = 0, bestComboRun = 0;
  let score = 0, rushEnd = 0, mistakes = 0, artPic = null, artDaily = false, unrolled = 0, flipAnim = 0, sheetIn = 0;
  let shards = [], floaters = [], rings = [], shake = 0, dirty = true;

  const DPR = () => Math.min(2, devicePixelRatio || 1);
  function resize() {
    const r = wrap.getBoundingClientRect();
    dpr = DPR(); W = Math.round(r.width); H = Math.round(r.height);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    sprites.clear(); bgTile = null;
  }

  function matLayout() {
    const small = W < 600;
    if (mat === 'classic' || mat === 'golden' || mat === 'jumbo') {
      const Dm = mat === 'jumbo' ? (small ? 84 : 108) : (small ? 44 : 54);
      const gap = Dm * 0.13, step = Dm + gap;
      const cols = Math.max(3, Math.floor((W - 16 - step / 2) / step));
      const ox = (W - (cols * step - gap + step / 2)) / 2;
      return { kind: 'hex', Dm, gap, step, cols, ox, rowH: step * 0.88 };
    }
    if (mat === 'foam') return { kind: 'foam', rowH: small ? 52 : 60, rmin: small ? 8 : 9, rmax: small ? 22 : 27 };
    if (mat === 'pillow') { const cols = small ? 2 : 3, gap = 10, w = (W - 24 - (cols - 1) * gap) / cols; return { kind: 'pillow', cols, gap, w, h: small ? 64 : 72, rowH: (small ? 64 : 72) + 12 }; }
    if (mat === 'popcorn') return { kind: 'pop', rowH: 54, r: small ? 9.5 : 11 };
    return { kind: 'popit' };
  }
  function genRow(ri, rnd, prev) {
    const L = layout, cells = [];
    const kindOf = () => {
      const x = rnd();
      if (mode === 'rush' && x < 0.05 && mat !== 'popit') return 'gold';
      if (x > (mat === 'jumbo' ? 0.94 : 0.97) && mat !== 'popcorn' && mat !== 'foam') return 'tough';
      return 'n';
    };
    if (L.kind === 'hex') {
      for (let c = 0; c < L.cols; c++) {
        const x = L.ox + c * L.step + (ri % 2 ? L.step / 2 : 0) + L.Dm / 2;
        cells.push({ shape: 'c', x, y: L.Dm / 2 + (L.rowH - L.Dm) / 2 + 2, r: L.Dm / 2, kind: kindOf(), st: 0, seed: (rnd() * 1e9) | 0 });
      }
    } else if (L.kind === 'foam') {
      const want = Math.round(W / 15);
      const others = prev ? prev.map((p) => ({ x: p.x, y: p.y - L.rowH, r: p.r })) : [];
      for (let t = 0; t < 500 && cells.length < want; t++) {
        const r = L.rmin + (L.rmax - L.rmin) * rnd() ** 1.7, x = r + 4 + rnd() * (W - 2 * r - 8), y = rnd() * L.rowH;
        if (cells.concat(others).every((o) => Math.hypot(o.x - x, o.y - y) > o.r + r - 1.5)) cells.push({ shape: 'c', x, y, r, kind: 'n', st: 0, seed: (rnd() * 1e9) | 0, hue: rnd() * 360 });
      }
    } else if (L.kind === 'pillow') {
      for (let c = 0; c < L.cols; c++) cells.push({ shape: 'r', x: 12 + c * (L.w + L.gap) + L.w / 2, y: L.h / 2 + 6, w: L.w, h: L.h, kind: kindOf(), st: 0, seed: (rnd() * 1e9) | 0 });
    } else if (L.kind === 'pop') {
      const want = Math.round(W / 34);
      const others = prev ? prev.map((p) => ({ x: p.x, y: p.y - L.rowH })) : [];
      for (let t = 0; t < 400 && cells.length < want; t++) {
        const x = 16 + rnd() * (W - 32), y = 6 + rnd() * (L.rowH - 12);
        if (cells.concat(others).every((o) => Math.hypot(o.x - x, o.y - y) > L.r * 2.6)) cells.push({ shape: 'k', x, y, r: L.r, rot: rnd() * TAU, kind: 'n', st: 0, seed: (rnd() * 1e9) | 0, th: 0.5 + rnd() * 1.4, heat: 0 });
      }
    }
    return cells;
  }
  function getRow(ri) {
    if (rows.has(ri)) return rows.get(ri);
    const prev = rows.get(ri - 1);
    const cells = genRow(ri, rng(strSeed(`${mat}:${ri}:${sheetSeed}`)), prev);
    for (const c of cells) { c.row = ri; c.wy = c.y + ri * rowH; }
    rows.set(ri, cells);
    return cells;
  }
  let sheetSeed = 1;

  function buildFinite() {
    finite = [];
    if (mode === 'art') {
      const pic = artPic, mh = pic.rows.length, mw = pic.rows[0].length;
      const cols = mw + 2, rr = mh + 2;
      const step = Math.min((W - 24) / (cols + 0.5), (H - 24) / ((rr - 1) * 0.88 + 1.05), 62);
      const Dm = step / 1.13, rowStep = step * 0.88;
      const ox = (W - (cols * step - step * 0.13 + step / 2)) / 2, oy = (H - ((rr - 1) * rowStep + Dm)) / 2;
      for (let r = 0; r < rr; r++) for (let c = 0; c < cols; c++) {
        const pr = r - 1, pc = c - 1;
        const target = pr >= 0 && pr < mh && pc >= 0 && pc < mw && pic.rows[pr][pc] === '#';
        finite.push({ shape: 'c', x: ox + c * step + (r % 2 ? step / 2 : 0) + Dm / 2, wy: oy + r * rowStep + Dm / 2, r: Dm / 2, kind: 'n', st: 0, seed: (Math.random() * 1e9) | 0, target });
      }
      return;
    }
    if (layout.kind === 'popit') {
      const small = W < 600, cols = small ? 6 : 9;
      const Dm = Math.min((Math.min(W, 760) - 70) / cols, 66);
      const nr = clamp(Math.floor((H - 70) / Dm), 3, 8);
      const tw = cols * Dm + 34, th = nr * Dm + 34, tx = (W - tw) / 2, ty = (H - th) / 2;
      layout.toy = { x: tx, y: ty, w: tw, h: th, Dm, nr, cols };
      for (let r = 0; r < nr; r++) for (let c = 0; c < cols; c++) finite.push({ shape: 'c', x: tx + 17 + c * Dm + Dm / 2, wy: ty + 17 + r * Dm + Dm / 2, r: Dm * 0.4, kind: 'n', st: 0, seed: (Math.random() * 1e9) | 0, hue: (r / nr) * 300 });
      return;
    }
    const nr = Math.max(2, Math.floor((H - 10) / rowH));
    const oy = (H - nr * rowH) / 2;
    let prev = null;
    const rnd = rng(strSeed(`${mat}:${Date.now()}`));
    for (let r = 0; r < nr; r++) {
      const cells = genRow(r, rnd, prev);
      for (const c of cells) { c.wy = oy + r * rowH + c.y; finite.push(c); }
      prev = cells;
    }
    if (layout.kind === 'foam' || layout.kind === 'pop') { const lim = H - 6; finite = finite.filter((c) => c.wy - c.r > 4 && c.wy + c.r < lim); }
  }

  function newSheet(silent) {
    layout = matLayout();
    rowH = layout.rowH || 50;
    rows = new Map(); finite = null; scrollY = targetScroll = minScroll = 0; unrolled = 0;
    sheetPops = 0; startT = 0; done = false; combo = 0; mistakes = 0; sheetSeed = (Math.random() * 1e9) | 0;
    shards = []; floaters = []; rings = [];
    if (mode !== 'relax' || layout.kind === 'popit') buildFinite();
    sheetIn = performance.now();
    dirty = true;
    paintHud();
    if (!silent) rustle();
  }

  function visibleCells() {
    if (finite) return finite;
    const out = [];
    const r0 = Math.floor(scrollY / rowH) - 1, r1 = Math.ceil((scrollY + H) / rowH) + 1;
    for (let ri = Math.max(0, r0); ri <= r1; ri++) for (const c of getRow(ri)) out.push(c);
    return out;
  }
  const sy = (c) => (finite ? c.wy : c.wy - scrollY);

  let master = null, noiseBuf = null;
  function audio() {
    if (Curio.muted) return null;
    const ac = Curio.audioContext(); if (!ac) return null;
    if (!master) {
      master = ac.createDynamicsCompressor(); master.threshold.value = -14; master.ratio.value = 5; master.connect(ac.destination);
      noiseBuf = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.6), ac.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return ac;
  }
  function nz(ac, t, { dur, freq, type = 'bandpass', q = 1, vol, sweep, rate = 1 }) {
    const s = ac.createBufferSource(); s.buffer = noiseBuf; s.playbackRate.value = rate;
    const f = ac.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q; if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, t + dur);
    const gn = ac.createGain(); gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(vol, t + 0.002); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(gn).connect(master); s.start(t, Math.random() * 0.3); s.stop(t + dur + 0.03);
  }
  function osc(ac, t, f0, f1, dur, vol, type = 'sine') {
    const o = ac.createOscillator(), gn = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(vol, t + 0.004); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(gn).connect(master); o.start(t); o.stop(t + dur + 0.03);
  }
  let lastSnd = 0;
  function popSound(c, soft) {
    const ac = audio(); if (!ac) return;
    const t = ac.currentTime;
    if (t - lastSnd < 0.01) return; lastSnd = t;
    const R = (a, b) => a + Math.random() * (b - a);
    if (soft) { nz(ac, t, { dur: 0.05, freq: R(600, 1200), vol: 0.25 }); return; }
    if (mat === 'classic' || mode === 'art') { nz(ac, t, { dur: R(0.05, 0.09), freq: R(900, 2600), q: R(0.8, 1.8), vol: 0.9, rate: R(0.75, 1.35) }); osc(ac, t, R(160, 260), 70, 0.06, 0.18); }
    else if (mat === 'jumbo') { nz(ac, t, { dur: 0.22, freq: R(500, 900), type: 'lowpass', vol: 1 }); nz(ac, t, { dur: 0.08, freq: 2400, vol: 0.5 }); osc(ac, t, R(90, 130), 40, 0.25, 0.4); }
    else if (mat === 'foam') { nz(ac, t, { dur: R(0.015, 0.035), freq: R(4000, 8000), type: 'highpass', vol: R(0.12, 0.3) }); }
    else if (mat === 'pillow') { nz(ac, t, { dur: 0.35, freq: 1800, sweep: 300, q: 0.7, vol: 0.5 }); osc(ac, t, 120, 60, 0.12, 0.3); }
    else if (mat === 'popcorn') { nz(ac, t, { dur: 0.04, freq: R(1000, 1800), q: 2, vol: 0.8 }); osc(ac, t, R(380, 520), 160, 0.05, 0.25, 'triangle'); }
    else if (mat === 'popit') { osc(ac, t, R(280, 340), 130, 0.09, 0.35); nz(ac, t, { dur: 0.04, freq: 500, type: 'lowpass', vol: 0.3 }); }
    else if (mat === 'golden') { nz(ac, t, { dur: 0.07, freq: R(1500, 3000), vol: 0.6 }); osc(ac, t, 1760, 1740, 0.4, 0.07); osc(ac, t, 2640, 2600, 0.3, 0.04); }
    if (c && c.kind === 'gold') { osc(ac, t + 0.02, 1568, 1560, 0.35, 0.09, 'triangle'); osc(ac, t + 0.08, 2093, 2090, 0.4, 0.07, 'triangle'); }
  }
  function rustle() { const ac = audio(); if (!ac) return; const t = ac.currentTime; for (let i = 0; i < 6; i++) nz(ac, t + i * 0.05, { dur: 0.12, freq: 2500 + Math.random() * 3000, type: 'highpass', vol: 0.05 }); }
  function buzz() { const ac = audio(); if (!ac) return; osc(ac, ac.currentTime, 140, 110, 0.18, 0.18, 'square'); }
  function chime(notes = [523, 659, 784, 1047]) { const ac = audio(); if (!ac) return; notes.forEach((f, i) => osc(ac, ac.currentTime + i * 0.08, f, f * 0.99, 0.35, 0.09, 'triangle')); }
  function sizzle() { const ac = audio(); if (!ac) return; nz(ac, ac.currentTime, { dur: 0.2, freq: 6000, type: 'highpass', vol: 0.03 }); }

  const sprites = new Map();
  function sprite(key, size, draw) {
    let s = sprites.get(key);
    if (s) return s;
    s = document.createElement('canvas');
    const px = Math.ceil(size * dpr);
    s.width = s.height = px;
    const c = s.getContext('2d'); c.scale(dpr, dpr); c.translate(size / 2, size / 2);
    draw(c);
    sprites.set(key, s);
    return s;
  }
  function bubbleIntact(c, r, gold, dented) {
    c.save();
    if (dented) c.scale(1.04, 0.86);
    c.shadowColor = dark ? 'rgba(0,0,0,.45)' : 'rgba(20,60,90,.28)'; c.shadowBlur = r * 0.35; c.shadowOffsetY = r * 0.12;
    const b = c.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.05, 0, 0, r);
    if (gold) { b.addColorStop(0, 'rgba(255,250,215,1)'); b.addColorStop(0.4, 'rgba(255,214,90,.95)'); b.addColorStop(0.85, 'rgba(214,150,30,.95)'); b.addColorStop(1, 'rgba(150,95,10,.95)'); }
    else if (dark) { b.addColorStop(0, 'rgba(210,240,255,.45)'); b.addColorStop(0.45, 'rgba(120,180,220,.22)'); b.addColorStop(0.85, 'rgba(70,140,190,.32)'); b.addColorStop(1, 'rgba(120,190,235,.55)'); }
    else { b.addColorStop(0, 'rgba(255,255,255,.7)'); b.addColorStop(0.45, 'rgba(205,234,248,.35)'); b.addColorStop(0.85, 'rgba(120,180,218,.42)'); b.addColorStop(1, 'rgba(80,145,192,.6)'); }
    c.fillStyle = b; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
    c.shadowColor = 'transparent';
    const sh = c.createRadialGradient(r * 0.35, r * 0.4, 0, r * 0.35, r * 0.4, r * 0.8);
    sh.addColorStop(0, gold ? 'rgba(120,70,0,.25)' : 'rgba(30,90,140,.2)'); sh.addColorStop(1, 'rgba(30,90,140,0)');
    c.fillStyle = sh; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
    c.strokeStyle = gold ? 'rgba(255,240,180,.8)' : dark ? 'rgba(200,235,255,.35)' : 'rgba(255,255,255,.65)'; c.lineWidth = Math.max(1, r * 0.06);
    c.beginPath(); c.arc(0, 0, r * 0.97, 0, TAU); c.stroke();
    c.save(); c.rotate(-0.6);
    const hl = c.createRadialGradient(-r * 0.05, -r * 0.5, 0, -r * 0.05, -r * 0.5, r * 0.4);
    hl.addColorStop(0, 'rgba(255,255,255,.95)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = hl; c.beginPath(); c.ellipse(-r * 0.05, -r * 0.5, r * 0.36, r * 0.2, 0, 0, TAU); c.fill();
    c.restore();
    c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.arc(r * 0.42, r * 0.4, r * 0.08, 0, TAU); c.fill();
    if (dented) { c.strokeStyle = gold ? 'rgba(120,70,0,.4)' : 'rgba(40,100,150,.35)'; c.lineWidth = Math.max(1, r * 0.05); c.beginPath(); c.arc(0, r * 0.6, r * 0.6, -2.4, -0.7); c.stroke(); }
    c.restore();
  }
  function bubblePopped(c, r, seed, gold, tint) {
    const rnd = rng(seed);
    c.save();
    c.beginPath();
    for (let k = 0; k <= 16; k++) { const a = k / 16 * TAU, rr = r * (0.86 + rnd() * 0.1); k ? c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    c.closePath();
    c.fillStyle = tint || (gold ? 'rgba(230,180,70,.55)' : dark ? 'rgba(120,180,220,.14)' : 'rgba(150,205,235,.28)');
    c.fill();
    c.strokeStyle = gold ? 'rgba(170,110,20,.6)' : dark ? 'rgba(140,200,240,.25)' : 'rgba(80,140,180,.35)'; c.lineWidth = 1; c.stroke();
    c.lineWidth = Math.max(0.8, r * 0.04);
    for (let k = 0; k < 5; k++) {
      c.strokeStyle = k % 2 ? (gold ? 'rgba(255,240,190,.7)' : 'rgba(255,255,255,.55)') : (gold ? 'rgba(140,90,10,.45)' : 'rgba(60,120,170,.28)');
      c.beginPath(); let x = (rnd() - 0.5) * r * 0.6, y = (rnd() - 0.5) * r * 0.6; c.moveTo(x, y);
      for (let j = 0; j < 3; j++) { x += (rnd() - 0.5) * r * 0.7; y += (rnd() - 0.5) * r * 0.7; const d = Math.hypot(x, y); if (d > r * 0.8) { x *= r * 0.8 / d; y *= r * 0.8 / d; } c.lineTo(x, y); }
      c.stroke();
    }
    c.restore();
  }
  function foamBubble(c, r, hue) {
    const b = c.createRadialGradient(0, 0, r * 0.6, 0, 0, r);
    b.addColorStop(0, 'rgba(255,255,255,.04)'); b.addColorStop(0.8, `hsla(${hue},80%,${dark ? 70 : 85}%,.16)`); b.addColorStop(1, `hsla(${hue + 40},90%,${dark ? 75 : 70}%,.4)`);
    c.fillStyle = b; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
    c.lineWidth = Math.max(1, r * 0.08);
    for (let k = 0; k < 6; k++) { c.strokeStyle = `hsla(${hue + k * 60},90%,${dark ? 70 : 62}%,.55)`; c.beginPath(); c.arc(0, 0, r * 0.95, k / 6 * TAU, (k + 1) / 6 * TAU + 0.05); c.stroke(); }
    c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = Math.max(1, r * 0.09);
    c.beginPath(); c.arc(0, 0, r * 0.7, -2.5, -1.7); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.arc(-r * 0.5, -r * 0.18, r * 0.07, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = Math.max(1, r * 0.05); c.beginPath(); c.arc(0, 0, r * 0.75, 0.6, 1.2); c.stroke();
  }
  function kernel(c, r, rot) {
    c.rotate(rot);
    c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = r * 0.4; c.shadowOffsetY = r * 0.15;
    const b = c.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r * 1.1);
    b.addColorStop(0, '#ffe98a'); b.addColorStop(0.55, '#f5b324'); b.addColorStop(1, '#b8640a');
    c.fillStyle = b; c.beginPath();
    c.moveTo(0, -r); c.bezierCurveTo(r * 0.95, -r * 0.9, r * 0.95, r * 0.6, 0, r); c.bezierCurveTo(-r * 0.95, r * 0.6, -r * 0.95, -r * 0.9, 0, -r); c.fill();
    c.shadowColor = 'transparent';
    c.fillStyle = '#fff3d0'; c.beginPath(); c.ellipse(0, r * 0.72, r * 0.3, r * 0.22, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.ellipse(-r * 0.3, -r * 0.35, r * 0.18, r * 0.3, -0.4, 0, TAU); c.fill();
  }
  function puff(c, r, seed) {
    const rnd = rng(seed);
    c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = r * 0.5; c.shadowOffsetY = r * 0.2;
    const n = 6 + ((rnd() * 3) | 0);
    const blobs = [];
    for (let k = 0; k < n; k++) { const a = k / n * TAU + rnd(), d = r * (0.45 + rnd() * 0.5); blobs.push([Math.cos(a) * d, Math.sin(a) * d * 0.85, r * (0.55 + rnd() * 0.35)]); }
    blobs.push([0, 0, r * 0.8]);
    for (const [x, y, rr] of blobs) {
      const b = c.createRadialGradient(x - rr * 0.3, y - rr * 0.35, rr * 0.1, x, y, rr);
      b.addColorStop(0, '#fffdf5'); b.addColorStop(0.7, '#fbf0d4'); b.addColorStop(1, '#e9d3a2');
      c.fillStyle = b; c.beginPath(); c.arc(x, y, rr, 0, TAU); c.fill();
      c.shadowColor = 'transparent';
    }
    c.fillStyle = 'rgba(245,190,60,.75)'; c.beginPath(); c.arc(r * 0.15, r * 0.1, r * 0.25, 0, TAU); c.fill();
    c.fillStyle = 'rgba(160,90,20,.6)'; c.beginPath(); c.arc(r * 0.2, r * 0.15, r * 0.1, 0, TAU); c.fill();
  }
  function dome(c, r, hue, pressed) {
    const base = `hsl(${hue},85%,${dark ? 55 : 62}%)`;
    c.fillStyle = `hsl(${hue},80%,${dark ? 38 : 48}%)`; c.beginPath(); c.arc(0, 0, r * 1.08, 0, TAU); c.fill();
    const b = pressed ? c.createRadialGradient(r * 0.3, r * 0.35, r * 0.1, 0, 0, r) : c.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r);
    if (pressed) { b.addColorStop(0, `hsl(${hue},90%,${dark ? 62 : 72}%)`); b.addColorStop(0.6, base); b.addColorStop(1, `hsl(${hue},80%,${dark ? 30 : 38}%)`); }
    else { b.addColorStop(0, `hsl(${hue},100%,${dark ? 78 : 86}%)`); b.addColorStop(0.5, base); b.addColorStop(1, `hsl(${hue},80%,${dark ? 36 : 44}%)`); }
    c.fillStyle = b; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
    if (!pressed) { c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(-r * 0.32, -r * 0.42, r * 0.28, r * 0.16, -0.6, 0, TAU); c.fill(); }
    else { c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = r * 0.12; c.beginPath(); c.arc(0, 0, r * 0.82, -2.6, -0.6); c.stroke(); }
  }

  let bgTile = null, bgKey = '';
  const BG = {
    classic: ['#d9eef8', '#c3e2f2', '#1c3140', '#152634'], jumbo: ['#d6f1ea', '#bfe6dc', '#183a36', '#112b28'], golden: ['#4a2160', '#2e1240', '#3b1a4d', '#220b31'],
    foam: ['#ece6fb', '#d9e8fb', '#241e38', '#1a1830'], pillow: ['#d2b289', '#c39f72', '#3d2f22', '#2e2319'], popcorn: ['#3d3d46', '#26262d', '#2c2c33', '#1c1c22'], popit: ['#f6efe3', '#efe4d2', '#211d2b', '#18151f']
  };
  function paintBgTile() {
    const key = `${mat}:${dark}:${W}`;
    if (bgTile && key === bgKey) return;
    bgKey = key;
    const th = 320;
    bgTile = document.createElement('canvas'); bgTile.width = Math.round(W * dpr); bgTile.height = Math.round(th * dpr);
    const c = bgTile.getContext('2d'); c.scale(dpr, dpr);
    const m = mode === 'art' ? 'classic' : mat;
    const [l1, l2, d1, d2] = BG[m];
    const gr = c.createLinearGradient(0, 0, 0, th); gr.addColorStop(0, dark ? d1 : l1); gr.addColorStop(0.5, dark ? d2 : l2); gr.addColorStop(1, dark ? d1 : l1);
    c.fillStyle = gr; c.fillRect(0, 0, W, th);
    if (m === 'pillow') {
      for (let i = 0; i < 300; i++) { c.fillStyle = `rgba(${Math.random() < 0.5 ? '90,60,30' : '255,240,210'},${Math.random() * 0.08})`; c.fillRect(Math.random() * W, Math.random() * th, Math.random() * 40 + 4, 1); }
      c.strokeStyle = 'rgba(90,60,30,.12)'; c.lineWidth = 1; for (let y = 0; y < th; y += 7) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y + 2); c.stroke(); }
    } else if (m === 'popcorn') {
      const rg = c.createRadialGradient(W / 2, th / 2, 0, W / 2, th / 2, Math.max(W, th));
      rg.addColorStop(0, 'rgba(255,200,120,.07)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = rg; c.fillRect(0, 0, W, th);
      for (let i = 0; i < 24; i++) { c.strokeStyle = `rgba(255,255,255,${0.02 + Math.random() * 0.03})`; c.lineWidth = 1; c.beginPath(); c.arc(W / 2, th * 3, th * 2.6 + i * 9, 0, TAU); c.stroke(); }
      for (let i = 0; i < 20; i++) { const x = Math.random() * W, y = Math.random() * th, rr = 6 + Math.random() * 18; const og = c.createRadialGradient(x - rr * 0.3, y - rr * 0.3, 0, x, y, rr); og.addColorStop(0, 'rgba(255,230,160,.18)'); og.addColorStop(1, 'rgba(255,230,160,0)'); c.fillStyle = og; c.beginPath(); c.arc(x, y, rr, 0, TAU); c.fill(); }
    } else if (m === 'popit') {
      for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(${dark ? '255,255,255' : '120,90,60'},.035)`; c.beginPath(); c.arc(Math.random() * W, Math.random() * th, Math.random() * 30 + 6, 0, TAU); c.fill(); }
    } else {
      c.globalAlpha = dark ? 0.06 : 0.3;
      c.fillStyle = 'rgba(255,255,255,.55)';
      for (let k = -4; k < Math.ceil(W / 120) + 2; k++) { c.beginPath(); c.moveTo(k * 120, 0); c.lineTo(k * 120 + 46, 0); c.lineTo(k * 120 + 166, th); c.lineTo(k * 120 + 120, th); c.fill(); }
      c.globalAlpha = 1;
      if (m === 'golden') for (let i = 0; i < 80; i++) { c.fillStyle = `rgba(255,215,120,${Math.random() * 0.25})`; c.fillRect(Math.random() * W, Math.random() * th, 1.5, 1.5); }
      if (m === 'foam') for (let i = 0; i < 40; i++) { c.strokeStyle = `hsla(${Math.random() * 360},80%,70%,.12)`; c.beginPath(); c.arc(Math.random() * W, Math.random() * th, Math.random() * 6 + 2, 0, TAU); c.stroke(); }
    }
  }

  function drawCell(c, now) {
    const y = sy(c);
    if (y < -80 || y > H + 80) return;
    const age = c.st === 2 ? now - c.pt : 1e9;
    const m = mode === 'art' ? 'classic' : mat;
    if (c.shape === 'c' && (m === 'classic' || m === 'jumbo' || m === 'golden')) {
      const gold = m === 'golden' || c.kind === 'gold';
      const r = c.r, size = Math.ceil(r * 2.6);
      if (c.st === 2) {
        const tint = mode === 'art' && c.target ? (c.reveal ? artPic.color : `${artPic.color}55`) : null;
        const tintKey = tint ? `${tint}:${c.reveal ? 1 : 0}` : '';
        const sp = sprite(`p:${m}:${Math.round(r)}:${c.seed % 6}:${gold}:${dark}:${tintKey}`, size, (x) => bubblePopped(x, r, c.seed % 6 + 1, gold, tint));
        let s = 1;
        if (age < 220) s = 1 + 0.12 * Math.sin(age / 220 * Math.PI);
        if (c.reveal && now - c.reveal < 400) s = 1 + 0.2 * Math.sin((now - c.reveal) / 400 * Math.PI);
        g.drawImage(sp, c.x - size / 2 * s, y - size / 2 * s, size * s, size * s);
        if (age < 90) { const sp2 = sprite(`i:${m}:${Math.round(r)}:${gold}:${dark}:0`, size, (x) => bubbleIntact(x, r, gold, false)); g.globalAlpha = 1 - age / 90; const s2 = 1 + age / 300; g.drawImage(sp2, c.x - size / 2 * s2, y - size / 2 * s2, size * s2, size * s2); g.globalAlpha = 1; }
      } else {
        const sp = sprite(`i:${m}:${Math.round(r)}:${gold}:${dark}:${c.st}`, size, (x) => bubbleIntact(x, r, gold, c.st === 1));
        let s = 1;
        if (c.hover) s = 0.96;
        if (c.dentT && now - c.dentT < 300) s = 1 - 0.12 * Math.sin((now - c.dentT) / 300 * Math.PI);
        g.drawImage(sp, c.x - size / 2 * s, y - size / 2 * s, size * s, size * s);
        if (mode === 'art' && c.target && artHint) { g.fillStyle = `${artPic.color}40`; g.beginPath(); g.arc(c.x, y, r * 0.78, 0, TAU); g.fill(); g.strokeStyle = `${artPic.color}aa`; g.lineWidth = 2; g.beginPath(); g.arc(c.x, y, r * 0.55, 0, TAU); g.stroke(); }
        if (c.kind === 'gold' && m !== 'golden') { g.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * Math.sin(now / 200 + c.seed)})`; g.beginPath(); g.arc(c.x - r * 0.3, y - r * 0.35, 2, 0, TAU); g.fill(); }
      }
      return;
    }
    if (m === 'foam') {
      if (c.st === 2) {
        if (age > 400) return;
        const t = age / 400;
        g.strokeStyle = `hsla(${c.hue},80%,70%,${1 - t})`; g.lineWidth = 1.5;
        g.beginPath(); g.arc(c.x, y, c.r * (1 + t * 0.6), 0, TAU); g.stroke();
        return;
      }
      const size = Math.ceil(c.r * 2.3);
      const sp = sprite(`f:${Math.round(c.r)}:${Math.round(c.hue / 30)}:${dark}`, size, (x) => foamBubble(x, c.r, Math.round(c.hue / 30) * 30));
      const wob = 1 + 0.02 * Math.sin(now / 300 + c.seed);
      g.drawImage(sp, c.x - size / 2 * wob, y - size / 2 * wob, size * wob, size * wob);
      return;
    }
    if (m === 'pillow') { drawPillow(c, y, now, age); return; }
    if (m === 'popcorn') {
      if (c.st === 2) {
        const size = Math.ceil(c.r * 4.4);
        const sp = sprite(`pf:${Math.round(c.r)}:${c.seed % 8}`, size, (x) => puff(x, c.r * 1.55, c.seed % 8 + 1));
        g.save(); g.translate(c.x + (c.jx || 0), y + (c.jy || 0)); g.rotate(c.jr || 0);
        const s = age < 120 ? 0.4 + age / 120 * 0.6 : 1;
        g.drawImage(sp, -size / 2 * s, -size / 2 * s, size * s, size * s); g.restore();
        return;
      }
      const size = Math.ceil(c.r * 2.8);
      const sp = sprite(`k:${Math.round(c.r)}:${Math.round(c.rot * 4)}`, size, (x) => kernel(x, c.r, Math.round(c.rot * 4) / 4));
      const jig = c.heat > 0.2 ? (Math.random() - 0.5) * c.heat * 3 : 0;
      g.drawImage(sp, c.x - size / 2 + jig, y - size / 2 + jig * 0.5, size, size);
      if (c.heat > 0.3) { g.fillStyle = `rgba(255,120,40,${Math.min(0.35, c.heat * 0.25)})`; g.beginPath(); g.arc(c.x, y, c.r * 1.2, 0, TAU); g.fill(); }
      return;
    }
    if (m === 'popit') {
      const size = Math.ceil(c.r * 2.4);
      const sp = sprite(`d:${Math.round(c.r)}:${Math.round(c.hue)}:${c.st === 2 ? 1 : 0}:${dark}`, size, (x) => dome(x, c.r, c.hue, c.st === 2));
      let s = 1; if (c.st === 2 && age < 160) s = 1 - 0.1 * Math.sin(age / 160 * Math.PI);
      g.drawImage(sp, c.x - size / 2 * s, y - size / 2 * s, size * s, size * s);
    }
  }
  function rrect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function drawPillow(c, y, now, age) {
    const x0 = c.x - c.w / 2, y0 = y - c.h / 2;
    g.save();
    if (c.st === 2) {
      const t = Math.min(1, age / 300);
      const hh = c.h * (1 - 0.35 * t);
      rrect(g, x0 + 3, y - hh / 2, c.w - 6, hh, 10);
      g.fillStyle = dark ? 'rgba(200,220,240,.12)' : 'rgba(255,255,255,.35)'; g.fill();
      g.strokeStyle = dark ? 'rgba(200,220,240,.25)' : 'rgba(120,100,80,.35)'; g.lineWidth = 1.2; g.stroke();
      const rnd = rng(c.seed);
      g.strokeStyle = dark ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.75)'; g.lineWidth = 1;
      for (let k = 0; k < 7; k++) { const px = x0 + 10 + rnd() * (c.w - 20), py = y - hh / 2 + 6 + rnd() * (hh - 12); g.beginPath(); g.moveTo(px, py); g.lineTo(px + (rnd() - 0.5) * 30, py + (rnd() - 0.5) * 14); g.lineTo(px + (rnd() - 0.5) * 40, py + (rnd() - 0.5) * 14); g.stroke(); }
    } else {
      const squash = c.dentT && now - c.dentT < 300 ? 1 - 0.08 * Math.sin((now - c.dentT) / 300 * Math.PI) : 1;
      const hh = c.h * squash * (c.st === 1 ? 0.88 : 1);
      g.shadowColor = dark ? 'rgba(0,0,0,.5)' : 'rgba(80,50,20,.3)'; g.shadowBlur = 12; g.shadowOffsetY = 5;
      rrect(g, x0, y - hh / 2, c.w, hh, Math.min(22, hh / 2.3));
      const gr = g.createLinearGradient(0, y - hh / 2, 0, y + hh / 2);
      gr.addColorStop(0, dark ? 'rgba(235,245,255,.42)' : 'rgba(255,255,255,.95)'); gr.addColorStop(0.5, dark ? 'rgba(200,220,240,.22)' : 'rgba(240,246,250,.7)'); gr.addColorStop(1, dark ? 'rgba(160,190,220,.3)' : 'rgba(200,215,228,.8)');
      g.fillStyle = gr; g.fill(); g.shadowColor = 'transparent';
      g.strokeStyle = dark ? 'rgba(220,235,255,.35)' : 'rgba(255,255,255,1)'; g.lineWidth = 1.5; g.stroke();
      g.fillStyle = dark ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.85)';
      g.beginPath(); g.ellipse(x0 + c.w * 0.3, y - hh * 0.22, c.w * 0.2, hh * 0.1, -0.08, 0, TAU); g.fill();
      if (c.kind === 'gold') { g.fillStyle = 'rgba(255,200,60,.35)'; rrect(g, x0 + 4, y - hh / 2 + 4, c.w - 8, hh - 8, 14); g.fill(); }
      if (c.kind === 'tough') { g.strokeStyle = dark ? 'rgba(160,190,220,.4)' : 'rgba(120,140,160,.5)'; g.setLineDash([4, 4]); rrect(g, x0 + 6, y - hh / 2 + 6, c.w - 12, hh - 12, 12); g.stroke(); g.setLineDash([]); }
    }
    g.strokeStyle = dark ? 'rgba(200,220,240,.18)' : 'rgba(150,130,110,.4)'; g.setLineDash([3, 4]); g.lineWidth = 1;
    g.beginPath(); g.moveTo(x0 + c.w + 5, y0 - 2); g.lineTo(x0 + c.w + 5, y0 + c.h + 2); g.stroke(); g.setLineDash([]);
    g.restore();
  }
  function drawToy(now) {
    const T = layout.toy; if (!T) return;
    const flip = flipAnim ? Math.min(1, (now - flipAnim) / 500) : 1;
    const sy2 = flipAnim && flip < 1 ? Math.abs(Math.cos(flip * Math.PI)) : 1;
    g.save(); g.translate(0, H / 2); g.scale(1, Math.max(0.05, sy2)); g.translate(0, -H / 2);
    g.shadowColor = dark ? 'rgba(0,0,0,.6)' : 'rgba(80,50,30,.3)'; g.shadowBlur = 24; g.shadowOffsetY = 10;
    rrect(g, T.x, T.y, T.w, T.h, 28); g.fillStyle = '#fff'; g.fill(); g.shadowColor = 'transparent';
    g.save(); rrect(g, T.x, T.y, T.w, T.h, 28); g.clip();
    for (let r = 0; r < T.nr; r++) { g.fillStyle = `hsl(${(r / T.nr) * 300},80%,${dark ? 45 : 56}%)`; g.fillRect(T.x, T.y + 17 + r * T.Dm - (r === 0 ? 17 : 0), T.w, T.Dm + (r === 0 || r === T.nr - 1 ? 17 : 0) + 1); }
    const gl = g.createLinearGradient(0, T.y, 0, T.y + T.h); gl.addColorStop(0, 'rgba(255,255,255,.25)'); gl.addColorStop(0.5, 'rgba(255,255,255,0)'); gl.addColorStop(1, 'rgba(0,0,0,.12)');
    g.fillStyle = gl; g.fillRect(T.x, T.y, T.w, T.h);
    g.restore();
    g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 3; rrect(g, T.x + 3, T.y + 3, T.w - 6, T.h - 6, 25); g.stroke();
    for (const c of finite) drawCell(c, now);
    g.restore();
    if (flipAnim && flip >= 1) flipAnim = 0;
  }
  function drawRoll(now) {
    const h = 34, y = H - h + 6;
    const [l1, , d1] = BG[mat];
    const gr = g.createLinearGradient(0, y, 0, y + h);
    gr.addColorStop(0, 'rgba(255,255,255,.0)'); gr.addColorStop(0.2, dark ? d1 : l1); gr.addColorStop(0.45, 'rgba(255,255,255,.75)'); gr.addColorStop(0.75, dark ? d1 : l1); gr.addColorStop(1, 'rgba(0,0,0,.35)');
    g.fillStyle = gr; g.fillRect(0, y, W, h);
    g.strokeStyle = dark ? 'rgba(255,255,255,.12)' : 'rgba(60,110,150,.18)'; g.lineWidth = 1;
    const off = (scrollY * 0.6) % 14;
    for (let x = -14; x < W + 14; x += 14) { g.beginPath(); g.moveTo(x + off, y + 6); g.quadraticCurveTo(x + off + 4, y + h / 2, x + off, y + h - 4); g.stroke(); }
    g.fillStyle = dark ? 'rgba(0,0,0,.35)' : 'rgba(40,70,90,.15)'; g.fillRect(0, y - 2, W, 2);
  }

  function render(now) {
    const pad = shake > 0.3 ? [(Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake] : [0, 0];
    shake *= 0.85;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    paintBgTile();
    const th = bgTile.height / dpr;
    const off = finite ? 0 : scrollY % th;
    for (let yy = -off; yy < H; yy += th) g.drawImage(bgTile, 0, yy, W, th);
    g.translate(pad[0], pad[1]);
    const intro = Math.min(1, (now - sheetIn) / 450);
    if (intro < 1) { const e = 1 - (1 - intro) ** 3; g.translate(0, (1 - e) * 60); g.globalAlpha = e; }
    if (layout.kind === 'popit') drawToy(now);
    else {
      const cells = visibleCells();
      const order = mat === 'popcorn' ? cells.slice().sort((a, b) => a.st - b.st) : cells;
      for (const c of order) drawCell(c, now);
    }
    g.globalAlpha = 1;
    if (!finite && mode === 'relax') drawRoll(now);
    for (const r of rings) { const t = (now - r.t) / r.d; if (t > 1) continue; g.strokeStyle = r.color.replace('A', String(1 - t)); g.lineWidth = r.w * (1 - t) + 0.5; g.beginPath(); g.arc(r.x, r.y - (finite ? 0 : scrollY - r.sy), r.r + t * r.grow, 0, TAU); g.stroke(); }
    for (const s of shards) { g.save(); g.translate(s.x, s.y - (finite ? 0 : scrollY - s.sy)); g.rotate(s.rot); g.globalAlpha = Math.max(0, s.life); g.fillStyle = s.color; g.fillRect(-s.size / 2, -s.size / 4, s.size, s.size / 2); g.restore(); }
    g.globalAlpha = 1;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const f of floaters) {
      const t = (now - f.t) / f.d; if (t > 1) continue;
      const e = 1 - (1 - t) ** 2;
      g.save(); g.translate(f.x, f.y - (finite ? 0 : scrollY - f.sy) - e * f.rise); g.rotate(f.rot); const sc = t < 0.15 ? 0.5 + t / 0.15 * 0.6 : 1.1 - (t - 0.15) * 0.12; g.scale(sc, sc);
      g.globalAlpha = t > 0.7 ? (1 - t) / 0.3 : 1;
      g.font = `900 ${f.size}px ui-rounded, "SF Pro Rounded", Nunito, system-ui, sans-serif`;
      g.lineWidth = 4; g.strokeStyle = dark ? 'rgba(0,0,0,.6)' : 'rgba(255,255,255,.9)'; g.strokeText(f.text, 0, 0);
      g.fillStyle = f.color; g.fillText(f.text, 0, 0); g.restore();
    }
    if (heatPt && mat === 'popcorn') {
      g.globalAlpha = 0.35 + 0.15 * Math.sin(now / 80);
      const hg = g.createRadialGradient(heatPt[0], heatPt[1], 0, heatPt[0], heatPt[1], 70);
      hg.addColorStop(0, 'rgba(255,140,40,.6)'); hg.addColorStop(1, 'rgba(255,80,20,0)'); g.fillStyle = hg; g.beginPath(); g.arc(heatPt[0], heatPt[1], 70, 0, TAU); g.fill(); g.globalAlpha = 1;
    }
  }

  function step(dt, now) {
    let active = false;
    if (!finite) {
      const d = targetScroll - scrollY;
      if (Math.abs(d) > 0.5) { scrollY += d * Math.min(1, dt * 0.008); active = true; } else scrollY = targetScroll;
      const firstRow = Math.floor((scrollY - H * 1.5) / rowH);
      for (const k of rows.keys()) if (k < firstRow) { rows.delete(k); minScroll = Math.max(minScroll, (k + 1) * rowH); }
    }
    for (const s of shards) { s.x += s.vx; s.y += s.vy; s.vy += 0.25; s.rot += s.vr; s.life -= 0.03; }
    shards = shards.filter((s) => s.life > 0);
    floaters = floaters.filter((f) => now - f.t < f.d);
    rings = rings.filter((r) => now - r.t < r.d);
    if (shards.length || floaters.length || rings.length || shake > 0.3) active = true;
    if (mat === 'popcorn' || (mode !== 'art' && layout && layout.kind === 'popit')) {
      for (const c of (finite || visibleCells())) {
        if (c.st === 2 && c.jvy != null) {
          c.jvy += 0.45; c.jy += c.jvy; c.jx += c.jvx; c.jr += c.jvr;
          if (c.jvy > 0 && c.jy >= c.land) { c.jy = c.land; if (Math.abs(c.jvy) > 2) { c.jvy *= -0.3; c.jvx *= 0.5; } else { c.jvy = null; } }
          active = true;
        }
      }
    }
    if (heatPt && mat === 'popcorn') {
      for (const c of visibleCells()) {
        if (c.st === 2 || c.shape !== 'k') continue;
        const d = Math.hypot(c.x - heatPt[0], sy(c) - heatPt[1]);
        if (d < 80) { c.heat += dt * 0.0012 * (1 - d / 90); if (c.heat > c.th) pop(c, true); }
      }
      if (Math.random() < 0.06) sizzle();
      active = true;
    }
    if (mode === 'rush' && running) { active = true; const left = rushEnd - now; if (left <= 0) finishRush(); else if (Math.floor(left / 100) !== lastRushPaint) { lastRushPaint = Math.floor(left / 100); paintHud(); } }
    if (mode === 'sprint' && startT && !done && Math.floor((now - startT) / 100) !== lastRushPaint) { lastRushPaint = Math.floor((now - startT) / 100); paintHud(); }
    if (now - sheetIn < 500 || flipAnim) active = true;
    if (mat === 'foam' || (mode === 'rush' && running) || mode === 'art') active = true;
    return active;
  }
  let lastRushPaint = -1;

  let heatPt = null;
  function burst(c, y, now) {
    const m = mode === 'art' ? 'classic' : mat;
    const n = m === 'jumbo' ? 14 : m === 'foam' ? 4 : m === 'pillow' ? 6 : 6;
    const col = m === 'golden' || c.kind === 'gold' ? 'rgba(255,215,90,.9)' : m === 'popit' ? `hsl(${c.hue},90%,70%)` : m === 'popcorn' ? 'rgba(255,240,200,.9)' : m === 'foam' ? `hsla(${c.hue},90%,80%,.9)` : dark ? 'rgba(180,220,250,.7)' : 'rgba(255,255,255,.9)';
    const base = finite ? 0 : scrollY;
    for (let k = 0; k < n; k++) { const a = Math.random() * TAU, v = 1.5 + Math.random() * (m === 'jumbo' ? 5 : 3); shards.push({ x: c.x, y, sy: base, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1.5, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 0.4, life: 1, color: col, size: m === 'jumbo' ? 7 : 4 }); }
    const r = c.r || Math.min(c.w, c.h) / 2;
    rings.push({ x: c.x, y, sy: base, r: r * 0.8, grow: r * (m === 'jumbo' ? 0.9 : 0.6), w: 3, t: now, d: 260, color: m === 'golden' || c.kind === 'gold' ? 'rgba(255,210,80,A)' : dark ? 'rgba(170,215,250,A)' : 'rgba(255,255,255,A)' });
    if (Math.random() < (m === 'jumbo' ? 0.5 : m === 'foam' ? 0.03 : 0.12)) floaters.push({ x: c.x, y: y - r, sy: base, text: Curio.pick(D.WORDS), t: now, d: 700, rise: 34, rot: (Math.random() - 0.5) * 0.5, size: m === 'jumbo' ? 26 : 17, color: Curio.pick(['#ff5a36', '#3fa7ff', '#2fae66', '#a98bff', '#ff5fa2', '#f0a020']) });
  }

  function pop(c, auto) {
    if (c.st === 2 || done) return false;
    const now = performance.now();
    if (mode === 'rush' && !running) return false;
    if (c.kind === 'tough' && c.st === 0) { c.st = 1; c.dentT = now; popSound(c, true); dirty = true; if (navigator.vibrate && lastType === 'touch') navigator.vibrate(4); return false; }
    c.st = 2; c.pt = now;
    const y = sy(c);
    if (mat === 'popcorn' && mode !== 'art') { c.jx = 0; c.jy = 0; c.jvx = (Math.random() - 0.5) * 3; c.jvy = -4 - Math.random() * 4; c.jr = 0; c.jvr = (Math.random() - 0.5) * 0.3; c.land = 8 + Math.random() * 18; save.kernels++; if (save.kernels >= 300) unlock('kernel'); }
    burst(c, y, now);
    popSound(c);
    if (navigator.vibrate && lastType === 'touch') navigator.vibrate(mat === 'jumbo' ? 22 : mat === 'pillow' ? 14 : 7);
    if (mat === 'jumbo') shake = Math.max(shake, 5);
    if (!startT) startT = now;
    if (now - lastPopT < 420) combo++; else combo = 1;
    lastPopT = now;
    if (combo > bestComboRun) bestComboRun = combo;
    if (combo > save.bestCombo) save.bestCombo = combo;
    if (combo >= 25) unlock('combo25'); if (combo >= 60) unlock('combo60');
    if (combo >= 10 && combo % 10 === 0) floaters.push({ x: c.x, y: y - 30, sy: finite ? 0 : scrollY, text: `${combo} combo!`, t: now, d: 900, rise: 40, rot: (Math.random() - 0.5) * 0.2, size: 24, color: '#ff5a36' });
    sheetPops++; sessionPops++;
    if (mode === 'art') {
      if (!c.target) { mistakes++; shake = 7; buzz(); floaters.push({ x: c.x, y: y - 20, sy: 0, text: 'oops', t: now, d: 700, rise: 24, rot: 0, size: 18, color: '#d64545' }); if (navigator.vibrate) navigator.vibrate([30, 30, 30]); }
    }
    if (mode === 'rush') {
      const mult = combo >= 30 ? 3 : combo >= 12 ? 2 : 1, pts = (c.kind === 'gold' ? 5 : 1) * mult;
      score += pts;
      if (pts > 1) floaters.push({ x: c.x, y: y - 24, sy: 0, text: `+${pts}`, t: now, d: 700, rise: 30, rot: 0, size: 20, color: c.kind === 'gold' ? '#f0a020' : '#2fae66' });
    }
    countPop();
    if (mat === 'foam' && !auto) chain(c, 0);
    else if (mat === 'foam') chain(c, 1);
    dirty = true;
    checkDone();
    return true;
  }
  function chain(c, depth) {
    if (depth > 6) return;
    const cells = finite || visibleCells();
    for (const o of cells) {
      if (o === c || o.st === 2) continue;
      const d = Math.hypot(o.x - c.x, (o.wy) - (c.wy));
      if (d < o.r + c.r + 5 && Math.random() < 0.32) setTimeout(() => { if (o.st !== 2 && mat === 'foam') pop(o, true); }, 40 + Math.random() * 70);
    }
  }
  function countPop() {
    save.total++;
    save.perMat[mode === 'art' ? 'classic' : mat] = (save.perMat[mode === 'art' ? 'classic' : mat] || 0) + 1;
    const k = today(); save.days[k] = (save.days[k] || 0) + 1;
    const dk = Object.keys(save.days).sort(); while (dk.length > 30) delete save.days[dk.shift()];
    unlock('pop1'); if (save.total >= 100) unlock('pop100'); if (save.total >= 1000) unlock('pop1k'); if (save.total >= 10000) unlock('pop10k');
    if (save.total >= 2500) unlock('golden');
    if (D.MATERIALS.every((m) => !unlocked(m.id) || save.perMat[m.id])) unlock('allmats');
    if (D.MILESTONES[save.total]) Curio.toast(D.MILESTONES[save.total], 2800);
    if (save.total === 2500) paintMats();
    persist();
    paintHud();
  }

  function remaining() { return finite ? finite.filter((c) => c.st !== 2 && (mode !== 'art' || c.target)).length : 0; }
  function checkDone() {
    if (!finite || done) return;
    if (layout.kind === 'popit' && mode !== 'sprint') { if (remaining() === 0) setTimeout(flip, 250); return; }
    if (remaining() > 0) return;
    if (mode === 'relax') return;
    if (mode === 'rush') { score += 10; floaters.push({ x: W / 2, y: H / 2, sy: 0, text: 'Sheet clear! +10', t: performance.now(), d: 1000, rise: 40, rot: 0, size: 28, color: '#2fae66' }); chime([659, 784, 988]); setTimeout(() => { if (running) newSheet(); }, 200); return; }
    done = true;
    if (mode === 'sprint') finishSprint();
    if (mode === 'art') finishArt();
  }
  function flip() {
    if (!finite || layout.kind !== 'popit' || remaining() > 0) return;
    flipAnim = performance.now();
    save.flips++; if (save.flips >= 5) unlock('flip'); persist();
    const ac = audio(); if (ac) nz(ac, ac.currentTime, { dur: 0.4, freq: 600, sweep: 2000, vol: 0.12 });
    setTimeout(() => { for (const c of finite) { c.st = 0; c.pt = 0; } dirty = true; }, 250);
    floaters.push({ x: W / 2, y: 40, sy: 0, text: 'Flip!', t: performance.now(), d: 800, rise: 20, rot: 0, size: 26, color: '#a98bff' });
    if (mode === 'rush') score += 10;
  }

  function finishSprint() {
    const secs = (performance.now() - startT) / 1000;
    const n = finite.length;
    save.sheets++;
    const prev = save.bestSprint[mat];
    const isNew = prev == null || secs < prev;
    if (isNew) save.bestSprint[mat] = Math.round(secs * 10) / 10;
    unlock('sprint'); persist();
    Curio.confetti(); chime();
    showResult({ emoji: isNew ? '🏆' : '⏱️', title: isNew ? 'New record sheet!' : 'Sheet destroyed', big: `${Curio.fmt(secs, 1)}s`, line: `${n} bubbles · ${Curio.fmt(n / secs, 1)} pops per second · best combo ${bestComboRun}`, best: `Best on ${MATS[mat].name}: ${Curio.fmt(save.bestSprint[mat], 1)}s`, share: `🫧 Bubble Wrap sprint: ${n} ${MATS[mat].name.toLowerCase()} bubbles in ${Curio.fmt(secs, 1)}s` });
  }
  function startRush() { running = true; score = 0; rushEnd = performance.now() + 30000; bestComboRun = 0; newSheet(); paintHud(); }
  function finishRush() {
    running = false; done = true;
    const prev = save.bestRush[mat] || 0, isNew = score > prev;
    if (isNew) save.bestRush[mat] = score;
    if (score >= 150) unlock('rush150'); if (score >= 300) unlock('rush300');
    persist();
    if (isNew) Curio.confetti(); chime(isNew ? [523, 659, 784, 1047, 1319] : [523, 659, 784]);
    paintHud();
    showResult({ emoji: isNew ? '🏆' : '⚡', title: isNew ? 'New rush record!' : 'Time!', big: `${score} pts`, line: `${sheetPops} pops this sheet · best combo ${bestComboRun}`, best: `Best on ${MATS[mat].name}: ${save.bestRush[mat] || score}`, share: `⚡ Bubble Wrap 30s rush on ${MATS[mat].name}: ${score} points, ${bestComboRun} combo` });
  }
  let artStart = 0, artHint = true;
  function startArt(pic, daily) {
    artPic = pic; artDaily = daily; mistakes = 0; done = false;
    newSheet();
    artStart = 0;
    $('modeNote').textContent = `${daily ? 'Daily picture' : 'Pop art'}: ${pic.name}. Pop only the tinted bubbles.`;
  }
  function finishArt() {
    const secs = (performance.now() - startT) / 1000 + mistakes * 2;
    const now = performance.now();
    finite.filter((c) => c.target).forEach((c, i) => { setTimeout(() => { c.reveal = performance.now(); dirty = true; }, i * 18); });
    for (const c of finite) if (!c.target && c.st !== 2) { c.st = 2; c.pt = now + 600; }
    const st = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
    const prev = save.art[artPic.id];
    if (!prev || secs < prev.t) save.art[artPic.id] = { t: Math.round(secs * 10) / 10, s: Math.max(st, prev ? prev.s : 0) };
    else if (st > prev.s) prev.s = st;
    if (artDaily) { const k = today(); const pd = save.daily[k]; if (!pd || secs < pd.t) save.daily[k] = { t: Math.round(secs * 10) / 10, s: st }; unlock('daily'); }
    unlock('art1'); if (Object.keys(save.art).length >= 10) unlock('art10'); if (mistakes === 0) unlock('artclean');
    persist();
    setTimeout(() => {
      Curio.confetti(); chime([523, 659, 784, 1047, 1319]);
      showResult({ emoji: '🖼️', title: `${artPic.name} complete!`, big: `${Curio.fmt(secs, 1)}s`, stars: st, line: `${mistakes} mistake${mistakes === 1 ? '' : 's'} (+2s each)`, best: `Best: ${Curio.fmt(save.art[artPic.id].t, 1)}s`, share: `🖼️ Bubble Wrap ${artDaily ? 'daily picture ' + today() : 'pop art'}: ${artPic.name} in ${Curio.fmt(secs, 1)}s, ${'★'.repeat(st)}${'☆'.repeat(3 - st)}`, pic: artPic });
    }, 900);
  }

  let lastType = 'mouse', drag = null;
  function hitAt(x, y) {
    let best = null, bd = Infinity;
    const cells = finite || visibleCells();
    for (const c of cells) {
      if (c.st === 2) continue;
      const cy = sy(c);
      if (c.shape === 'r') { if (Math.abs(x - c.x) < c.w / 2 && Math.abs(y - cy) < c.h / 2) return c; continue; }
      const rr = c.shape === 'k' ? c.r * 1.6 : c.r + 3;
      const d = (c.x - x) ** 2 + (cy - y) ** 2;
      if (d < rr * rr && d < bd) { bd = d; best = c; }
    }
    return best;
  }
  Curio.drag(cv, {
    start(p) {
      if (!startEl.hidden || !resEl.hidden) return;
      lastType = p.pointerType;
      audio();
      drag = { p: [p.x, p.y], hit: new Set(), still: performance.now() };
      if (mode === 'rush' && !running && !done) startRush();
      const c = hitAt(p.x, p.y); if (c) { drag.hit.add(c); pop(c); }
      p.event.preventDefault(); cv.focus({ preventScroll: true });
    },
    move(p) {
      if (!drag) return;
      const [x0, y0] = drag.p;
      const dist = Math.hypot(p.x - x0, p.y - y0);
      const n = Math.max(1, Math.ceil(dist / 7));
      for (let k = 1; k <= n; k++) {
        const c = hitAt(x0 + (p.x - x0) * k / n, y0 + (p.y - y0) * k / n);
        if (c && !drag.hit.has(c)) { drag.hit.add(c); pop(c); }
      }
      if (dist > 2) { drag.still = performance.now(); heatPt = null; }
      drag.p = [p.x, p.y];
    },
    end() { drag = null; heatPt = null; }
  });
  cv.addEventListener('wheel', (e) => {
    if (finite) return;
    e.preventDefault();
    scrollTo(targetScroll + e.deltaY);
  }, { passive: false });
  function scrollTo(v) {
    const before = targetScroll;
    targetScroll = Math.max(minScroll, v);
    if (targetScroll > before) { unrolled += (targetScroll - before) / H; if (unrolled >= 20) unlock('roll'); }
  }
  function unroll() { if (finite) return; scrollTo(targetScroll + H * 0.7); rustle(); }
  cv.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (mode === 'rush' && !running && !done) startRush();
      const cells = (finite || visibleCells()).filter((c) => c.st !== 2 && (!finite ? sy(c) > 0 && sy(c) < H : true) && (mode !== 'art' || c.target));
      if (cells.length) { lastType = 'key'; pop(cells[0]); if (cells[0].st === 1) pop(cells[0]); }
      else if (!finite) unroll();
    }
  });

  function autoUnroll() {
    if (finite || mode !== 'relax' || !save.settings.auto) return;
    if (Math.abs(targetScroll - scrollY) > 4) return;
    const vis = visibleCells().filter((c) => { const y = sy(c); return y > 0 && y < H - 30; });
    if (!vis.length) return;
    const left = vis.filter((c) => c.st !== 2).length;
    if (left / vis.length < 0.12) unroll();
  }

  const ACH = Object.fromEntries(D.ACH.map((a) => [a.id, a]));
  function unlock(id) {
    if (save.ach[id] || !ACH[id]) return;
    save.ach[id] = Date.now(); persist();
    const a = ACH[id];
    const el = document.createElement('div'); el.className = 'bw-badge';
    el.innerHTML = '<i></i><div><small>Achievement unlocked</small><b></b></div>';
    el.querySelector('i').textContent = a.icon; el.querySelector('b').textContent = a.name;
    document.body.append(el);
    requestAnimationFrame(() => el.classList.add('is-on'));
    setTimeout(() => { el.classList.remove('is-on'); setTimeout(() => el.remove(), 500); }, 3000);
    setTimeout(() => chime([784, 988, 1319]), 120);
  }

  function paintHud() {
    $('sPops').textContent = Curio.fmt(mode === 'relax' ? sessionPops : sheetPops);
    $('sPopsL').textContent = mode === 'relax' ? 'This session' : 'This sheet';
    $('sAll').textContent = Curio.fmt(save.total);
    const third = $('sThird'), tl = $('sThirdL');
    if (mode === 'sprint') { third.textContent = startT && !done ? Curio.fmt((performance.now() - startT) / 1000, 1) : startT ? '✓' : '0.0'; tl.textContent = 'Seconds'; }
    else if (mode === 'rush') { third.textContent = String(score); tl.textContent = running ? `${Math.max(0, Math.ceil((rushEnd - performance.now()) / 1000))}s left` : 'Score'; }
    else if (mode === 'art') { third.textContent = String(mistakes); tl.textContent = 'Mistakes'; }
    else { third.textContent = String(save.bestCombo); tl.textContent = 'Best combo'; }
    const prog = $('prog');
    if (finite) { const tot = mode === 'art' ? finite.filter((c) => c.target).length : finite.length; prog.style.width = `${(1 - remaining() / Math.max(1, tot)) * 100}%`; }
    else prog.style.width = '0%';
    $('unrollBtn').hidden = mode !== 'relax' || layout.kind === 'popit';
    $('autoBtn').hidden = mode !== 'relax' || layout.kind === 'popit';
    const rb = $('rushBar');
    if (mode === 'rush') { rb.hidden = false; rb.querySelector('i').style.width = running ? `${Math.max(0, (rushEnd - performance.now()) / 30000) * 100}%` : (done ? '0%' : '100%'); }
    else rb.hidden = true;
  }

  const matsEl = $('mats');
  function matIcon(id, size = 34) {
    const c = document.createElement('canvas'); c.width = c.height = size * 2; c.style.width = c.style.height = `${size}px`;
    const x = c.getContext('2d'); x.scale(2, 2); x.translate(size / 2, size / 2);
    const [l1, , d1] = BG[id];
    x.fillStyle = dark ? d1 : l1; x.beginPath(); x.arc(0, 0, size / 2, 0, TAU); x.fill();
    const r = size * 0.3;
    if (id === 'classic' || id === 'jumbo' || id === 'golden') bubbleIntact(x, id === 'jumbo' ? r * 1.2 : r, id === 'golden', false);
    else if (id === 'foam') { x.translate(-3, 2); foamBubble(x, r * 0.8, 200); x.translate(9, -7); foamBubble(x, r * 0.5, 300); }
    else if (id === 'pillow') { x.fillStyle = 'rgba(255,255,255,.9)'; rrect(x, -r * 1.2, -r * 0.8, r * 2.4, r * 1.6, r * 0.6); x.fill(); x.strokeStyle = 'rgba(120,100,80,.4)'; x.stroke(); }
    else if (id === 'popcorn') { x.fillStyle = '#2c2c33'; x.beginPath(); x.arc(0, 0, size / 2, 0, TAU); x.fill(); puff(x, r * 0.9, 3); }
    else if (id === 'popit') { dome(x, r, 200, false); }
    return c;
  }
  function paintMats() {
    matsEl.textContent = '';
    for (const m of D.MATERIALS) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'bw-mat';
      const ok = unlocked(m.id);
      b.disabled = !ok || mode === 'art';
      b.setAttribute('aria-pressed', String(mat === m.id && mode !== 'art'));
      b.title = ok ? `${m.name}: ${m.blurb}` : `Unlocks at ${Curio.fmt(m.unlock)} pops`;
      b.append(matIcon(m.id));
      const s = document.createElement('span'); s.textContent = ok ? m.name : '🔒'; b.append(s);
      b.addEventListener('click', () => setMat(m.id));
      matsEl.append(b);
    }
  }
  function setMat(id) {
    if (!unlocked(id)) return;
    mat = id; save.settings.mat = id; persist();
    running = false; done = false;
    paintMats(); newSheet();
    Curio.beep(520, 0.05, 'triangle', 0.06);
    setNote();
  }
  const modesEl = $('modes');
  function paintModes() {
    modesEl.textContent = '';
    for (const m of D.MODES) {
      const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-pressed', String(mode === m.id));
      b.innerHTML = '<i></i><span class="bw-long"></span><span class="bw-short"></span>'; b.querySelector('i').textContent = m.icon; b.querySelector('.bw-long').textContent = m.name; b.querySelector('.bw-short').textContent = m.short;
      b.addEventListener('click', () => setMode(m.id));
      modesEl.append(b);
    }
  }
  function setNote() {
    const n = $('modeNote');
    if (mode === 'relax') n.textContent = layout.kind === 'popit' ? 'Press every dome, then it flips over by itself.' : mat === 'popcorn' ? 'Tap kernels, or hold still on the pan to heat a whole patch.' : 'An endless roll. It unrolls by itself when you clear the view, or scroll for more.';
    else if (mode === 'sprint') n.textContent = 'The clock starts on your first pop. Clear every bubble.';
    else if (mode === 'rush') n.textContent = 'Tap to start. 30 seconds. Gold bubbles are worth 5, combos multiply.';
  }
  function setMode(id, opts = {}) {
    if (id === 'art' && !opts.pic) { openArt(); return; }
    mode = id; if (id !== 'art') { save.settings.mode = id; persist(); }
    mat = id === 'art' ? 'classic' : (unlocked(save.settings.mat) ? save.settings.mat : 'classic');
    running = false; done = false; score = 0;
    paintModes(); paintMats();
    if (id === 'art') startArt(opts.pic, opts.daily);
    else { newSheet(); setNote(); }
    $('newSheet').textContent = mode === 'rush' ? '↺ Restart' : mode === 'art' ? '🖼️ Pictures' : '✨ New sheet';
    paintHud();
  }

  const sheetEl = $('drawer'), drawerBody = $('drawerBody');
  function openDrawer(title, build) {
    $('drawerT').textContent = title; drawerBody.textContent = ''; build(drawerBody);
    sheetEl.hidden = false; requestAnimationFrame(() => sheetEl.classList.add('is-on'));
    sheetEl.querySelector('.bw-drawer__x').focus();
  }
  function closeDrawer() { sheetEl.classList.remove('is-on'); setTimeout(() => { sheetEl.hidden = true; }, 200); }
  sheetEl.addEventListener('click', (e) => { if (e.target === sheetEl) closeDrawer(); });
  sheetEl.querySelector('.bw-drawer__x').addEventListener('click', closeDrawer);

  function picCanvas(pic, size = 54, solved) {
    const c = document.createElement('canvas'); c.width = c.height = size * 2; c.style.width = c.style.height = `${size}px`;
    const x = c.getContext('2d'); x.scale(2, 2);
    const mh = pic.rows.length, mw = pic.rows[0].length, cell = (size - 8) / Math.max(mw + 0.5, mh);
    const ox = (size - (mw + 0.5) * cell) / 2, oy = (size - mh * cell) / 2;
    pic.rows.forEach((row, r) => [...row].forEach((ch, k) => {
      x.fillStyle = ch === '#' ? (solved ? pic.color : 'rgba(128,128,128,.55)') : 'rgba(128,128,128,.12)';
      x.beginPath(); x.arc(ox + k * cell + (r % 2 ? cell / 2 : 0) + cell / 2, oy + r * cell + cell / 2, cell * 0.42, 0, TAU); x.fill();
    }));
    return c;
  }
  function dailyPic() { const r = rng(strSeed('bubble' + today())); return D.PICTURES[Math.floor(r() * D.PICTURES.length)]; }
  function openArt() {
    openDrawer('Pop art', (box) => {
      const p = document.createElement('p'); p.className = 'bw-lead'; p.textContent = 'A picture is hidden in the sheet. Pop only the tinted bubbles. Each wrong pop adds 2 seconds.';
      box.append(p);
      const dp = dailyPic(), dd = save.daily[today()];
      const daily = document.createElement('button'); daily.type = 'button'; daily.className = 'bw-daily';
      daily.append(picCanvas(dp, 64, !!dd));
      const s = document.createElement('span'); s.innerHTML = '<b>Daily picture</b><small></small>'; s.querySelector('small').textContent = dd ? `Done in ${Curio.fmt(dd.t, 1)}s ${'★'.repeat(dd.s)}. Beat it?` : `Today: a mystery. ${Object.keys(save.daily).length} days played.`;
      daily.append(s);
      daily.addEventListener('click', () => { closeDrawer(); hideStart(); setMode('art', { pic: dp, daily: true }); });
      box.append(daily);
      const grid = document.createElement('div'); grid.className = 'bw-pics';
      for (const pic of D.PICTURES) {
        const rec = save.art[pic.id];
        const b = document.createElement('button'); b.type = 'button'; b.className = 'bw-pic';
        b.append(picCanvas(pic, 54, !!rec));
        const t = document.createElement('span'); t.textContent = rec ? pic.name : '???'; b.append(t);
        const st = document.createElement('small'); st.textContent = rec ? `${'★'.repeat(rec.s)}${'☆'.repeat(3 - rec.s)} ${Curio.fmt(rec.t, 1)}s` : 'Not yet'; b.append(st);
        b.addEventListener('click', () => { closeDrawer(); hideStart(); setMode('art', { pic, daily: false }); });
        grid.append(b);
      }
      box.append(grid);
    });
  }
  function openStats() {
    openDrawer('Stats and trophies', (box) => {
      const grid = document.createElement('div'); grid.className = 'bw-stats';
      const rows = [['All-time pops', save.total], ['Sprint sheets', save.sheets], ['Best combo', save.bestCombo], ['Pop-it flips', save.flips], ['Kernels popped', save.kernels], ['Pictures done', Object.keys(save.art).length]];
      for (const [k, v] of rows) { const d = document.createElement('div'); d.innerHTML = '<b></b><span></span>'; d.querySelector('b').textContent = Curio.fmt(v); d.querySelector('span').textContent = k; grid.append(d); }
      box.append(grid);
      const h1 = document.createElement('h3'); h1.textContent = 'Last 7 days'; box.append(h1);
      const days = document.createElement('div'); days.className = 'bw-days';
      const vals = [];
      for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; vals.push([d.toLocaleDateString('en-US', { weekday: 'short' }), save.days[k] || 0]); }
      const mx = Math.max(1, ...vals.map((v) => v[1]));
      for (const [l, v] of vals) { const d = document.createElement('div'); d.innerHTML = '<i></i><b></b><span></span>'; d.querySelector('i').style.height = `${Math.max(3, v / mx * 100)}%`; d.querySelector('b').textContent = v ? Curio.fmt(v) : ''; d.querySelector('span').textContent = l; days.append(d); }
      box.append(days);
      const h2 = document.createElement('h3'); h2.textContent = 'By material'; box.append(h2);
      const tbl = document.createElement('div'); tbl.className = 'bw-mtable';
      for (const m of D.MATERIALS) {
        const d = document.createElement('div');
        d.append(matIcon(m.id, 28));
        const s = document.createElement('span'); s.innerHTML = '<b></b><small></small>';
        s.querySelector('b').textContent = m.name;
        s.querySelector('small').textContent = `${Curio.fmt(save.perMat[m.id] || 0)} pops · sprint ${save.bestSprint[m.id] != null ? Curio.fmt(save.bestSprint[m.id], 1) + 's' : '-'} · rush ${save.bestRush[m.id] || '-'}`;
        d.append(s); tbl.append(d);
      }
      box.append(tbl);
      const n = Object.keys(save.ach).length;
      const h3 = document.createElement('h3'); h3.textContent = `Achievements ${n} / ${D.ACH.length}`; box.append(h3);
      const ag = document.createElement('div'); ag.className = 'bw-ach';
      for (const a of D.ACH) { const d = document.createElement('div'); d.className = save.ach[a.id] ? 'on' : ''; d.innerHTML = '<i></i><b></b><small></small>'; d.querySelector('i').textContent = save.ach[a.id] ? a.icon : '🔒'; d.querySelector('b').textContent = a.name; d.querySelector('small').textContent = a.desc; ag.append(d); }
      box.append(ag);
    });
  }
  function openHelp() {
    openDrawer('How to pop', (box) => {
      box.innerHTML = `<div class="bw-help">
        <p><b>Click, tap or drag</b> across the sheet to pop. Dragging pops a whole row in one swipe.</p>\n        <p><b>Touchpad?</b> Turn on Touchpad mode (🖱️ in the top bar): click once and every bubble you glide over pops. Click again to stop.</p>
        <p><b>Tough bubbles</b> just dent on the first press. Press again to finish them.</p>
        <p><b>Materials:</b> jumbo bubbles go bang, soap foam pops in chain reactions, air pillows deflate, popcorn kernels jump (hold still to heat a patch), and pop-its flip over when every dome is pressed.</p>
        <p><b>Modes:</b> Endless roll never runs out. Sprint is a race against the clock. 30s rush rewards combos (pops less than half a second apart) and gold bubbles. Pop art hides a picture in the sheet.</p>
        <p class="bw-keys"><span class="c-kbd">Space</span> pop the next bubble · <span class="c-kbd">U</span> unroll · <span class="c-kbd">N</span> new sheet · <span class="c-kbd">1</span>-<span class="c-kbd">7</span> materials · <span class="c-kbd">S</span> stats · <span class="c-kbd">Esc</span> menu</p>
      </div>`;
    });
  }

  const resEl = $('result');
  function showResult(o) {
    $('resEmoji').textContent = o.emoji; $('resTitle').textContent = o.title; $('resBig').textContent = o.big;
    $('resLine').textContent = o.line; $('resBest').textContent = o.best;
    const st = $('resStars'); st.textContent = '';
    if (o.stars) for (let i = 0; i < 3; i++) { const s = document.createElement('span'); s.textContent = i < o.stars ? '★' : '☆'; s.style.animationDelay = `${0.2 + i * 0.15}s`; st.append(s); }
    const pv = $('resPic'); pv.textContent = ''; if (o.pic) pv.append(picCanvas(o.pic, 90, true));
    lastShare = o.share;
    resEl.hidden = false; requestAnimationFrame(() => resEl.classList.add('is-on'));
    $('resAgain').focus();
  }
  let lastShare = '';
  function hideResult() { resEl.classList.remove('is-on'); resEl.hidden = true; }
  $('resAgain').addEventListener('click', () => { hideResult(); if (mode === 'art') setMode('art', { pic: artPic, daily: artDaily }); else if (mode === 'rush') { done = false; newSheet(); paintHud(); } else newSheet(); });
  $('resStay').addEventListener('click', () => { hideResult(); });
  $('resMenu').addEventListener('click', () => { hideResult(); showStart(); });
  $('resShare').addEventListener('click', async () => { try { await navigator.clipboard.writeText(lastShare); Curio.toast('Copied! Paste it anywhere 📋'); } catch { Curio.toast(lastShare, 4000); } });

  const startEl = $('start');
  function showStart() {
    $('stTotal').textContent = Curio.fmt(save.total);
    const dd = save.daily[today()];
    $('stDaily').textContent = dd ? `Done · ${Curio.fmt(dd.t, 1)}s` : 'New picture today';
    startEl.hidden = false; requestAnimationFrame(() => startEl.classList.add('is-on'));
    $('goRelax').focus();
  }
  function hideStart() {
    startEl.classList.remove('is-on'); setTimeout(() => { startEl.hidden = true; }, 250);
    if (!Curio.store.get('bubble-wrap:tphint', false) && !Curio.touchpad) { Curio.store.set('bubble-wrap:tphint', true); setTimeout(() => Curio.toast('Tip: on a touchpad, turn on Touchpad mode (🖱️ in the top bar). Click once, then just glide to pop whole rows.', 5000), 2500); }
  }
  startEl.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => {
    const m = b.dataset.go;
    if (m === 'daily') { hideStart(); setMode('art', { pic: dailyPic(), daily: true }); return; }
    if (m === 'art') { openArt(); return; }
    hideStart(); setMode(m);
  }));

  $('newSheet').addEventListener('click', () => { if (mode === 'art') openArt(); else if (mode === 'rush') { running = false; done = false; newSheet(); paintHud(); } else newSheet(); });
  $('unrollBtn').addEventListener('click', unroll);
  $('autoBtn').addEventListener('click', () => { save.settings.auto = !save.settings.auto; persist(); paintAuto(); });
  function paintAuto() { $('autoBtn').setAttribute('aria-pressed', String(save.settings.auto)); }
  $('statsBtn').addEventListener('click', openStats);
  $('helpBtn').addEventListener('click', openHelp);
  $('menuBtn').addEventListener('click', showStart);

  addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input, textarea')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape') { if (!sheetEl.hidden) closeDrawer(); else if (!resEl.hidden) hideResult(); else if (startEl.hidden) showStart(); else hideStart(); return; }
    if (!startEl.hidden || !sheetEl.hidden || !resEl.hidden) return;
    const k = e.key.toLowerCase();
    if (k === 'u') unroll();
    else if (k === 'n') $('newSheet').click();
    else if (k === 's') openStats();
    else if (/^[1-7]$/.test(k)) { const m = D.MATERIALS[+k - 1]; if (m && mode !== 'art') setMat(m.id); }
    else if (e.key === 'ArrowDown' || e.key === 'PageDown') { if (!finite) { e.preventDefault(); unroll(); } }
  });
  addEventListener('curio:theme', () => { dark = Curio.isDark(); sprites.clear(); bgTile = null; paintMats(); dirty = true; });
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { dark = Curio.isDark(); sprites.clear(); bgTile = null; dirty = true; });

  let raf = 0, last = 0, autoT = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(64, now - (last || now)); last = now;
    const active = step(dt, now);
    if (active || dirty) { render(now); dirty = false; }
    if (now - autoT > 300) { autoT = now; autoUnroll(); if (mode === 'rush') paintHud(); }
    if (drag && mat === 'popcorn' && now - drag.still > 380) heatPt = drag.p;
  }
  const start = () => { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { const ow = W, oh = H; resize(); if (Math.abs(W - ow) > 30 || (finite && Math.abs(H - oh) > 40)) { if (mode === 'art') setMode('art', { pic: artPic, daily: artDaily }); else if (!(mode === 'rush' && running)) newSheet(true); } dirty = true; }, 200); });

  window.__bubble = { get save() { return save; }, get finite() { return finite; }, get mode() { return mode; }, get mat() { return mat; }, setMat, setMode, pop, visibleCells, sy, unroll, get scroll() { return scrollY; }, dailyPic, PICS };

  dark = Curio.isDark();
  resize();
  layout = matLayout();
  paintModes(); paintMats(); paintAuto();
  setMode(mode === 'art' ? 'relax' : mode);
  showStart();
  start();
})();
