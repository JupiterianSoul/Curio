(() => {
  const $ = (id) => document.getElementById(id);
  const D = window.KD_DATA;
  const RES = 1200, C = RES / 2, TAU = Math.PI * 2;
  const VER = 2, KEY = 'kaleido-v2', CUR = 'kaleido-cur';
  const BRUSH = Object.fromEntries(D.brushes.map((b) => [b.id, b]));
  const KIND = Object.fromEntries(D.kinds.map((k) => [k.id, k]));
  const PAL = Object.fromEntries(D.palettes.map((p) => [p.id, p]));
  const BG = Object.fromEntries(D.bgs.map((b) => [b.id, b]));
  const DEF = { brush: 'neon', kind: 'mirror', fold: 8, tiles: 4, size: 6, opac: 100, mode: 'rainbow', pal: 'sunset', c1: '#ff4fd8', c2: '#36e0ff', bg: 'midnight', glow: true, sound: true, gen: 'rose', rspeed: 2 };

  function loadState() {
    const base = { v: VER, set: { ...DEF }, gallery: [], ach: {}, used: { k: {}, b: {}, light: 0, dark: 0 }, stats: { strokes: 0, saves: 0 }, daily: {}, dailyOn: '' };
    const raw = Curio.store.get(KEY, null);
    if (!raw || typeof raw !== 'object' || raw.v !== VER) {
      const old = Curio.store.get('kaleidoscope', null);
      if (old && typeof old === 'object') {
        if (old.fold) base.set.fold = +old.fold || 8;
        if (old.size) base.set.size = +old.size || 6;
        if (old.glow != null) base.set.glow = !!old.glow;
      }
      return base;
    }
    const st = { ...base, ...raw };
    st.set = { ...DEF, ...(raw.set || {}) };
    st.used = { ...base.used, ...(raw.used || {}) };
    st.stats = { ...base.stats, ...(raw.stats || {}) };
    st.gallery = Array.isArray(raw.gallery) ? raw.gallery.filter((x) => x && x.thumb) : [];
    st.ach = raw.ach && typeof raw.ach === 'object' ? raw.ach : {};
    st.daily = raw.daily && typeof raw.daily === 'object' ? raw.daily : {};
    return st;
  }
  const S = loadState();
  const set = S.set;
  if (!BRUSH[set.brush]) set.brush = DEF.brush;
  if (!KIND[set.kind]) set.kind = DEF.kind;
  if (!PAL[set.pal]) set.pal = DEF.pal;
  if (!BG[set.bg]) set.bg = DEF.bg;
  set.fold = Math.min(16, Math.max(2, +set.fold || 8));
  set.tiles = Math.min(6, Math.max(2, +set.tiles || 4));
  const save = () => Curio.store.set(KEY, S);

  const rng = (seed) => () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const hex = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const mix = (a, b, t) => { const pa = hex(a), pb = hex(b); return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',')})`; };
  const r1 = (v) => Math.round(v * 10) / 10;
  const vib = (ms) => { try { navigator.vibrate?.(ms); } catch {} };

  const mk = () => { const c = document.createElement('canvas'); c.width = c.height = RES; return c; };
  const cv = $('cv'), g = cv.getContext('2d');
  const paper = mk(), pg = paper.getContext('2d');
  const base = mk(), bgc = base.getContext('2d');
  let strokes = [], redoStack = [], cp = 0, cleared = null;
  let hueCursor = Math.random() * 360;
  let cur = null, dirty = true;

  function mats(s) {
    const out = [], n = Math.max(1, s.n | 0);
    if (s.k === 'mirror' || s.k === 'radial') {
      for (let i = 0; i < n; i++) {
        const a = i * TAU / n, co = Math.cos(a), si = Math.sin(a);
        out.push([co, si, -si, co, C, C]);
        if (s.k === 'mirror') out.push([co, si, si, -co, C, C]);
      }
    } else if (s.k === 'spiral') {
      for (let i = 0; i < n * 2; i++) {
        const a = i * TAU / n, k = Math.pow(0.9, i), co = Math.cos(a) * k, si = Math.sin(a) * k;
        out.push([co, si, -si, co, C, C]);
      }
    } else if (s.k === 'flip') out.push([1, 0, 0, 1, C, C], [-1, 0, 0, 1, C, C]);
    else if (s.k === 'quad') out.push([1, 0, 0, 1, C, C], [-1, 0, 0, 1, C, C], [1, 0, 0, -1, C, C], [-1, 0, 0, -1, C, C]);
    else if (s.k === 'grid' || s.k === 'tiles') {
      const T = s.t, ts = RES / T;
      for (let i = -1; i <= T; i++) for (let j = -1; j <= T; j++) {
        const fx = s.k === 'tiles' && (i & 1) ? -1 : 1, fy = s.k === 'tiles' && (j & 1) ? -1 : 1;
        out.push([fx, 0, 0, fy, i * ts + (fx < 0 ? ts : 0), j * ts + (fy < 0 ? ts : 0)]);
      }
    } else out.push([1, 0, 0, 1, C, C]);
    return out;
  }
  const isGrid = (k) => k === 'grid' || k === 'tiles';
  function toSource(px, py, s) {
    if (!isGrid(s.k)) return [px - C, py - C];
    const ts = RES / s.t;
    let lx = px - s.ai * ts, ly = py - s.aj * ts;
    if (s.k === 'tiles' && (s.ai & 1)) lx = ts - lx;
    if (s.k === 'tiles' && (s.aj & 1)) ly = ts - ly;
    return [lx, ly];
  }

  function stateFor(s) {
    const bg = BG[set.bg];
    return { r: rng(s.seed), len: 0, w: s.s * RES / 700, acc: 1e9, hist: [], M: mats(s), dark: bg.dark, bgc: bg.c, pal: (PAL[s.p] || D.palettes[0]).c };
  }
  function colorAt(s, ss) {
    const len = ss.len;
    if (s.m === 'rainbow') return `hsl(${((s.h + len * 0.12) % 360).toFixed(1)} 95% ${ss.dark ? 62 : 50}%)`;
    if (s.m === 'palette') {
      const P = ss.pal, n = P.length, pos = len / 260 + s.h / 90, i = Math.floor(pos), f = pos - i, ff = f * f * (3 - 2 * f);
      return mix(P[((i % n) + n) % n], P[(((i + 1) % n) + n) % n], ff);
    }
    if (s.m === 'gradient') return mix(s.c1, s.c2, (Math.sin(len / 180 + s.h / 57) + 1) / 2);
    return s.c1;
  }
  function along(ss, x0, y0, x1, y1, L, sp, cb) {
    let t = Math.max(0, sp - ss.acc), last = -1;
    while (t <= L) { const f = L ? t / L : 0; cb(x0 + (x1 - x0) * f, y0 + (y1 - y0) * f); last = t; t += sp; }
    ss.acc = last < 0 ? ss.acc + L : L - last;
  }

  function seg(c, s, ss, x0, y0, x1, y1) {
    const L = Math.hypot(x1 - x0, y1 - y0);
    const col = colorAt(s, ss);
    const W = s.s * RES / 700, r = ss.r, M = ss.M, o = s.o;
    const glow = !!s.g && s.b !== 'eraser', lit = glow && ss.dark;
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    const each = (fn) => { for (let i = 0; i < M.length; i++) { const m = M[i]; c.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]); fn(); } };
    const halo = (path, w) => {
      if (!glow) return;
      c.globalCompositeOperation = lit ? 'lighter' : 'source-over'; c.strokeStyle = col;
      const ps = lit ? [[w * 3 + 8, 0.08], [w * 1.7 + 3, 0.18]] : [[w * 2.2 + 6, 0.07]];
      for (const [lw, al] of ps) { c.globalAlpha = al * o; c.lineWidth = lw; each(() => c.stroke(path)); }
      c.globalCompositeOperation = lit ? 'lighter' : 'source-over';
    };
    const line = () => { const p = new Path2D(); p.moveTo(x0, y0); p.lineTo(x1, y1); return p; };
    switch (s.b) {
      case 'neon': {
        const p = line(); halo(p, W);
        c.globalAlpha = o; c.strokeStyle = col; c.lineWidth = W * 0.9; each(() => c.stroke(p));
        if (lit) { c.strokeStyle = '#fff'; c.globalAlpha = 0.7 * o; c.lineWidth = Math.max(1, W * 0.26); each(() => c.stroke(p)); }
        break;
      }
      case 'ink': {
        const target = W * Math.min(1.5, Math.max(0.3, 1.5 - L / (W * 1.5 + 12)));
        ss.w = ss.w * 0.75 + target * 0.25;
        const p = line(); halo(p, ss.w);
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = o; c.strokeStyle = col; c.lineWidth = ss.w; each(() => c.stroke(p));
        break;
      }
      case 'calli': {
        const nx = Math.cos(-Math.PI / 4) * W * 0.9, ny = Math.sin(-Math.PI / 4) * W * 0.9;
        const p = new Path2D(); p.moveTo(x0 + nx, y0 + ny); p.lineTo(x1 + nx, y1 + ny); p.lineTo(x1 - nx, y1 - ny); p.lineTo(x0 - nx, y0 - ny); p.closePath();
        halo(p, W * 0.4);
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = o; c.fillStyle = col; c.strokeStyle = col; c.lineWidth = 1.4;
        each(() => { c.fill(p); c.stroke(p); });
        break;
      }
      case 'ribbon': {
        const dx = x1 - x0, dy = y1 - y0, l = L || 1, nx = -dy / l, ny = dx / l, p = new Path2D();
        for (let k = -2; k <= 2; k++) { const off = k * W * 0.55; p.moveTo(x0 + nx * off, y0 + ny * off); p.lineTo(x1 + nx * off, y1 + ny * off); }
        halo(p, W * 0.3);
        c.globalAlpha = o * 0.85; c.strokeStyle = col; c.lineWidth = Math.max(1, W * 0.22); each(() => c.stroke(p));
        break;
      }
      case 'sketch': {
        const p = line(), q = new Path2D(), h = ss.hist, reach = W * 10 + 40;
        for (let i = Math.max(0, h.length - 120); i < h.length; i += 2) {
          const hx = h[i][0], hy = h[i][1], dx = hx - x1, dy = hy - y1;
          if (dx * dx + dy * dy < reach * reach && r() < 0.35) { q.moveTo(x1 + dx * 0.15, y1 + dy * 0.15); q.lineTo(hx - dx * 0.15, hy - dy * 0.15); }
        }
        h.push([x1, y1]); if (h.length > 400) h.splice(0, 100);
        c.globalCompositeOperation = lit ? 'lighter' : 'source-over';
        c.strokeStyle = col; c.globalAlpha = o * 0.75; c.lineWidth = Math.max(1, W * 0.22); each(() => c.stroke(p));
        c.globalAlpha = o * (lit ? 0.24 : 0.2); c.lineWidth = Math.max(0.8, W * 0.12); each(() => c.stroke(q));
        break;
      }
      case 'spray': {
        const n = Math.min(60, 3 + Math.round(L * W * 0.02 + W * 0.6)), p = new Path2D(), R = W * 2.2, ds = Math.max(0.8, W * 0.14);
        for (let i = 0; i < n; i++) {
          const f = r(), a = r() * TAU, rr = Math.sqrt(r()) * R;
          const x = x0 + (x1 - x0) * f + Math.cos(a) * rr, y = y0 + (y1 - y0) * f + Math.sin(a) * rr, sz = ds * (0.5 + r());
          p.moveTo(x + sz, y); p.arc(x, y, sz, 0, TAU);
        }
        c.globalCompositeOperation = lit ? 'lighter' : 'source-over'; c.globalAlpha = o * 0.85; c.fillStyle = col; each(() => c.fill(p));
        break;
      }
      case 'dots': {
        const p = new Path2D();
        along(ss, x0, y0, x1, y1, L, W * 2.4 + 4, (x, y) => { const rr = W * 0.8 * (0.75 + r() * 0.5) + 1; p.moveTo(x + rr, y); p.arc(x, y, rr, 0, TAU); });
        halo(p, W * 0.5);
        c.globalAlpha = o; c.fillStyle = col; each(() => c.fill(p));
        break;
      }
      case 'stars': {
        const p = new Path2D();
        along(ss, x0, y0, x1, y1, L, W * 3.2 + 8, (x, y) => {
          const R = W * 1.3 * (0.6 + r() * 0.8) + 3, a0 = r() * TAU;
          for (let k = 0; k < 10; k++) { const rr = k % 2 ? R * 0.45 : R, a = a0 + k * Math.PI / 5, px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr; if (k) p.lineTo(px, py); else p.moveTo(px, py); }
          p.closePath();
        });
        halo(p, W * 0.6);
        c.globalAlpha = o; c.fillStyle = col; each(() => c.fill(p));
        break;
      }
      case 'petals': {
        const p = new Path2D(), dir = Math.atan2(y1 - y0, x1 - x0);
        along(ss, x0, y0, x1, y1, L, W * 2.4 + 6, (x, y) => {
          const a = dir + (r() - 0.5) * 0.6, rx = W * 1.6 + 4, ry = W * 0.55 + 1.5;
          p.moveTo(x + Math.cos(a) * rx, y + Math.sin(a) * rx); p.ellipse(x, y, rx, ry, a, 0, TAU);
        });
        c.globalCompositeOperation = lit ? 'lighter' : 'source-over';
        c.globalAlpha = o * 0.5; c.fillStyle = col; each(() => c.fill(p));
        c.globalAlpha = o * 0.9; c.strokeStyle = col; c.lineWidth = Math.max(1, W * 0.12); each(() => c.stroke(p));
        break;
      }
      case 'bubbles': {
        const p = new Path2D(), hl = new Path2D();
        along(ss, x0, y0, x1, y1, L, W * 2.6 + 8, (x, y) => {
          const rr = W * (0.5 + r() * 1.3) + 3;
          p.moveTo(x + rr, y); p.arc(x, y, rr, 0, TAU);
          hl.moveTo(x + Math.cos(3.6) * rr * 0.65, y + Math.sin(3.6) * rr * 0.65); hl.arc(x, y, rr * 0.65, 3.6, 4.4);
        });
        halo(p, W * 0.3);
        c.globalAlpha = o * 0.85; c.strokeStyle = col; c.lineWidth = Math.max(1.2, W * 0.2); each(() => c.stroke(p));
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = o * 0.7; c.strokeStyle = '#fff'; c.lineWidth = Math.max(1, W * 0.14); each(() => c.stroke(hl));
        break;
      }
      case 'eraser': {
        const p = line(); c.globalAlpha = 1; c.strokeStyle = ss.bgc; c.lineWidth = W * 2 + 4; each(() => c.stroke(p));
        break;
      }
    }
    ss.len += L;
    c.restore();
  }
  function drawStroke(c, s) {
    const P = s.pts; if (!P || P.length < 2) return;
    const ss = stateFor(s);
    seg(c, s, ss, P[0], P[1], P[0] + 0.01, P[1]);
    for (let i = 2; i < P.length; i += 2) seg(c, s, ss, P[i - 2], P[i - 1], P[i], P[i + 1]);
  }
  function fillBg(c) { c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.fillStyle = BG[set.bg].c; c.fillRect(0, 0, RES, RES); }
  function rebuild() { fillBg(bgc); cp = Math.max(0, strokes.length - 8); for (let i = 0; i < cp; i++) drawStroke(bgc, strokes[i]); compose(); }
  function compose() {
    pg.setTransform(1, 0, 0, 1, 0, 0); pg.globalAlpha = 1; pg.globalCompositeOperation = 'copy'; pg.drawImage(base, 0, 0); pg.globalCompositeOperation = 'source-over';
    for (let i = cp; i < strokes.length; i++) drawStroke(pg, strokes[i]);
    dirty = true;
  }
  function commit(s) {
    strokes.push(s); redoStack = []; cleared = null;
    if (strokes.length - cp > 16) { const to = strokes.length - 8; for (let i = cp; i < to; i++) drawStroke(bgc, strokes[i]); cp = to; }
    afterChange();
  }

  let view = 0, spin = false, cycle = false, hueShift = 0, guides = false;
  function resize() {
    const r = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    const px = Math.max(50, Math.round(r.width * dpr));
    if (cv.width !== px) { cv.width = cv.height = px; }
    dirty = true;
  }
  function present() {
    const w = cv.width, k = w / RES;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
    g.fillStyle = BG[set.bg].c; g.fillRect(0, 0, w, w);
    g.save();
    if (view) { g.translate(w / 2, w / 2); g.rotate(view); g.translate(-w / 2, -w / 2); }
    g.drawImage(paper, 0, 0, w, w);
    if (guides) {
      g.scale(k, k);
      g.strokeStyle = BG[set.bg].dark ? 'rgba(255,255,255,.28)' : 'rgba(0,0,0,.25)'; g.lineWidth = 1.5 / k; g.setLineDash([6 / k, 8 / k]);
      g.beginPath();
      if (set.kind === 'mirror' || set.kind === 'radial' || set.kind === 'spiral') {
        const n = set.kind === 'mirror' ? set.fold * 2 : set.fold;
        for (let i = 0; i < n; i++) { const a = i * TAU / n; g.moveTo(C, C); g.lineTo(C + Math.cos(a) * C * 1.5, C + Math.sin(a) * C * 1.5); }
      } else if (isGrid(set.kind)) {
        const ts = RES / set.tiles;
        for (let i = 1; i < set.tiles; i++) { g.moveTo(i * ts, 0); g.lineTo(i * ts, RES); g.moveTo(0, i * ts); g.lineTo(RES, i * ts); }
      } else if (set.kind === 'flip' || set.kind === 'quad') {
        g.moveTo(C, 0); g.lineTo(C, RES);
        if (set.kind === 'quad') { g.moveTo(0, C); g.lineTo(RES, C); }
      }
      g.stroke();
    }
    g.restore();
  }

  function toPaper(e) {
    const r = cv.getBoundingClientRect();
    let x = ((e.clientX - r.left) / r.width - 0.5) * RES, y = ((e.clientY - r.top) / r.height - 0.5) * RES;
    if (view) { const co = Math.cos(-view), si = Math.sin(-view); const nx = x * co - y * si; y = x * si + y * co; x = nx; }
    return [x + C, y + C];
  }
  function newStroke(px, py) {
    const s = { b: set.brush, k: set.kind, n: set.fold, t: set.tiles, s: set.size, o: set.opac / 100, m: set.mode, p: set.pal, c1: set.c1, c2: set.c2, g: set.glow ? 1 : 0, h: r1(hueCursor % 360), seed: (Math.random() * 1e9) | 0, pts: [] };
    if (isGrid(s.k)) { const ts = RES / s.t; s.ai = Math.floor(px / ts); s.aj = Math.floor(py / ts); }
    return s;
  }
  function startStroke(px, py) {
    const s = newStroke(px, py);
    const [x, y] = toSource(px, py, s).map(r1);
    s.pts.push(x, y);
    cur = { s, ss: stateFor(s) };
    seg(pg, s, cur.ss, x, y, x + 0.01, y);
    dirty = true;
    markUse(s);
  }
  function extend(px, py) {
    if (!cur) return;
    const s = cur.s, [x, y] = toSource(px, py, s).map(r1), P = s.pts;
    const lx = P[P.length - 2], ly = P[P.length - 1];
    if (Math.hypot(x - lx, y - ly) < 2.5) return;
    P.push(x, y);
    seg(pg, s, cur.ss, lx, ly, x, y);
    dirty = true;
    chime(px, py);
  }
  function endStroke() {
    if (!cur) return;
    hueCursor = (cur.s.h + cur.ss.len * 0.12) % 360;
    const s = cur.s; cur = null;
    commit(s);
    S.stats.strokes++;
    if (spin) unlock('spin');
    checkAch(s);
    save();
  }

  let lastChime = 0;
  const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
  function chime(px, py) {
    if (Curio.muted || !set.sound) return;
    const now = performance.now(); if (now - lastChime < 110) return; lastChime = now;
    const a = Curio.audioContext(); if (!a) return;
    const d = Math.min(1, Math.hypot(px - C, py - C) / C);
    const f = 392 * Math.pow(2, PENTA[Math.min(PENTA.length - 1, Math.floor((1 - d) * PENTA.length))] / 12);
    const t = a.currentTime, o = a.createOscillator(), o2 = a.createOscillator(), gn = a.createGain();
    o.type = 'sine'; o2.type = 'sine'; o.frequency.value = f; o2.frequency.value = f * 2.76;
    gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(0.03, t + 0.01); gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    const g2 = a.createGain(); g2.gain.value = 0.25;
    o.connect(gn); o2.connect(g2).connect(gn); gn.connect(a.destination);
    o.start(t); o2.start(t); o.stop(t + 1); o2.stop(t + 1);
  }
  function arp(notes, type = 'triangle', vol = 0.08, gap = 0.07) { notes.forEach((f, i) => setTimeout(() => Curio.beep(f, 0.18, type, vol), i * gap * 1000)); }

  let introOn = true;
  function dismissIntro() { if (!introOn) return; introOn = false; $('intro').classList.add('out'); setTimeout(() => { $('intro').hidden = true; }, 450); }
  let ignoreStroke = false;
  Curio.drag(cv, {
    start: (p) => {
      if (replay) { stopReplay(true); ignoreStroke = true; return; }
      ignoreStroke = false; dismissIntro();
      if (auto) stopAuto();
      if (cur) return;
      const [px, py] = toPaper(p); startStroke(px, py); vib(5);
    },
    move: (p) => {
      if (ignoreStroke || !cur || auto) return;
      const e = p.event, list = e && e.getCoalescedEvents ? e.getCoalescedEvents() : [];
      for (const ev of (list.length ? list : [p])) { const [px, py] = toPaper(ev); extend(px, py); }
    },
    end: () => { if (!ignoreStroke && !auto) endStroke(); ignoreStroke = false; }
  });
  addEventListener('curio:touchpad', (e) => { if (e.detail) Curio.toast('Touchpad mode: click the canvas to start a stroke, move to draw, click again to lift the pen', 3600); });

  const GENS = [
    { id: 'rose', name: 'Rose', init: (r) => ({ k: [2, 3, 4, 5, 7, 1.5, 2.5][Math.floor(r() * 7)], R: RES * (0.3 + r() * 0.14), sp: 0.012 }), at: (p, t) => { const rr = p.R * Math.cos(p.k * t); return [C + rr * Math.cos(t), C + rr * Math.sin(t)]; } },
    { id: 'spiro', name: 'Spiro', init: (r) => { const R = RES * 0.3, q = R * (0.2 + r() * 0.5); return { R, q, d: q * (0.5 + r() * 0.9), sp: 0.03 }; }, at: (p, t) => { const a = p.R - p.q; return [C + a * Math.cos(t) + p.d * Math.cos(a / p.q * t), C + a * Math.sin(t) - p.d * Math.sin(a / p.q * t)]; } },
    { id: 'lissa', name: 'Lissajous', init: (r) => ({ a: 1 + Math.floor(r() * 4), b: 2 + Math.floor(r() * 4), dl: r() * Math.PI, A: RES * (0.25 + r() * 0.15), sp: 0.012 }), at: (p, t) => [C + p.A * Math.sin(p.a * t + p.dl), C + p.A * Math.sin(p.b * t)] },
    { id: 'orbit', name: 'Orbit', init: (r) => ({ R: RES * 0.42, w: 0.12 + r() * 0.3, sp: 0.03 }), at: (p, t) => { const rr = p.R * (0.5 + 0.45 * Math.sin(t * p.w)); return [C + rr * Math.cos(t), C + rr * Math.sin(t)]; } },
    { id: 'wander', name: 'Wander', init: (r) => ({ x: C + (r() - 0.5) * 400, y: C + (r() - 0.5) * 400, vx: 0, vy: 0, ph: r() * 100, sp: 1 }), at: (p, t) => {
      const ang = Math.sin(p.ph + t * 0.016) * 2.2 + Math.cos(p.ph + t * 0.0084) * 1.7 + t * 0.005;
      p.vx = p.vx * 0.92 + Math.cos(ang) * 0.9; p.vy = p.vy * 0.92 + Math.sin(ang) * 0.9;
      p.vx -= (p.x - C) * 0.0022; p.vy -= (p.y - C) * 0.0022;
      const d = Math.hypot(p.x - C, p.y - C); if (d > RES * 0.44) { p.vx -= (p.x - C) / d * 3; p.vy -= (p.y - C) / d * 3; }
      p.x += p.vx * 3; p.y += p.vy * 3; return [p.x, p.y];
    } }
  ];
  let auto = null;
  function startAuto(genId = set.gen, limit = 900) {
    if (replay) stopReplay(true);
    dismissIntro();
    if (cur) endStroke();
    const gen = GENS.find((x) => x.id === genId) || GENS[0];
    const r = rng((Math.random() * 1e9) | 0);
    auto = { gen, p: gen.init(r), t: 0, n: 0, limit };
    const [x, y] = gen.at(auto.p, 0); startStroke(x, y);
    $('autoBtn').setAttribute('aria-pressed', 'true');
    unlock('auto');
  }
  function stopAuto() {
    if (!auto) return;
    auto = null; endStroke();
    $('autoBtn').setAttribute('aria-pressed', 'false');
  }
  function autoStep() {
    for (let i = 0; i < 4 && auto; i++) {
      auto.t += auto.gen.id === 'wander' ? 1 : auto.p.sp; auto.n++;
      const [x, y] = auto.gen.at(auto.p, auto.t); extend(x, y);
      if (auto.n >= auto.limit) stopAuto();
    }
  }

  let replay = null;
  function totalSegs() { return strokes.reduce((a, s) => a + s.pts.length / 2, 0); }
  function startReplay() {
    if (!strokes.length) { Curio.toast('Draw something first, then watch it rebuild'); shake(); return; }
    if (auto) stopAuto();
    dismissIntro();
    fillBg(pg);
    replay = { i: 0, j: 0, ss: null, done: 0, total: totalSegs() };
    $('replayBar').hidden = false;
    $('replay').setAttribute('aria-pressed', 'true');
  }
  function stopReplay(skip) {
    if (!replay) return;
    replay = null; compose();
    $('replayBar').hidden = true; $('replay').setAttribute('aria-pressed', 'false');
    if (!skip) { unlock('replay'); arp([523, 659, 784, 1047]); pop(); }
  }
  function replayStep() {
    let budget = set.rspeed * 5;
    while (budget-- > 0 && replay) {
      const s = strokes[replay.i];
      if (!s) { stopReplay(false); return; }
      const P = s.pts;
      if (!replay.ss) { replay.ss = stateFor(s); seg(pg, s, replay.ss, P[0], P[1], P[0] + 0.01, P[1]); replay.j = 2; }
      else if (replay.j < P.length) { seg(pg, s, replay.ss, P[replay.j - 2], P[replay.j - 1], P[replay.j], P[replay.j + 1]); replay.j += 2; }
      if (replay.j >= P.length) { replay.i++; replay.ss = null; }
      replay.done++;
    }
    if (replay) $('replayFill').style.width = `${Math.min(100, replay.done / replay.total * 100)}%`;
    dirty = true;
  }

  function undo() {
    if (replay) stopReplay(true);
    if (cur) return;
    if (!strokes.length) {
      if (cleared) { strokes = cleared.strokes; redoStack = cleared.redo; cleared = null; rebuild(); afterChange(); Curio.toast('Drawing restored'); arp([440, 660]); return; }
      Curio.toast('Nothing to undo'); shake(); return;
    }
    redoStack.push(strokes.pop());
    if (strokes.length < cp) rebuild(); else compose();
    Curio.beep(330, 0.05, 'triangle', 0.07);
    afterChange();
  }
  function redo() {
    if (replay) stopReplay(true);
    const s = redoStack.pop(); if (!s) { Curio.toast('Nothing to redo'); return; }
    strokes.push(s); drawStroke(pg, s); dirty = true;
    Curio.beep(440, 0.05, 'triangle', 0.07);
    afterChange();
  }
  function clearAll() {
    if (replay) stopReplay(true);
    if (auto) stopAuto();
    if (!strokes.length) { shake(); return; }
    cleared = { strokes, redo: redoStack };
    strokes = []; redoStack = []; cp = 0;
    fillBg(bgc); compose();
    Curio.toast('Wiped clean. Undo brings it back.');
    Curio.beep(200, 0.15, 'sine', 0.08); shake();
    afterChange(true);
  }

  let autosaveT = 0;
  function afterChange(keepCleared) {
    if (!keepCleared && strokes.length) cleared = null;
    const el = $('strokeCount'); el.textContent = strokes.length;
    const box = el.parentElement; box.classList.remove('bump'); void box.offsetWidth; box.classList.add('bump');
    $('undo').disabled = !strokes.length && !cleared; $('redo').disabled = !redoStack.length;
    clearTimeout(autosaveT);
    autosaveT = setTimeout(() => {
      try { const json = JSON.stringify({ v: VER, bg: set.bg, strokes }); if (json.length < 400000) localStorage.setItem('curio:' + CUR, json); } catch {}
    }, 700);
  }

  function markUse(s) {
    S.used.k[s.k] = 1; S.used.b[s.b] = 1;
    if (BG[set.bg].dark) S.used.dark = 1; else S.used.light = 1;
    unlock('first');
  }
  function checkAch(s) {
    if (D.kinds.every((k) => S.used.k[k.id])) unlock('kinds');
    if (D.brushes.every((b) => S.used.b[b.id])) unlock('brushes');
    if (S.stats.strokes >= 100) unlock('hundred');
    if (strokes.length >= 40) unlock('big');
    if (s.n >= 16 && !isGrid(s.k) && s.k !== 'flip' && s.k !== 'quad' && s.k !== 'free') unlock('max');
    if (S.used.dark && S.used.light) unlock('daynight');
  }
  function unlock(id) {
    if (S.ach[id]) return;
    const a = D.ach.find((x) => x.id === id); if (!a) return;
    S.ach[id] = Date.now(); save(); paintAch();
    unlockQ.push(a); if (!unlockBusy) nextUnlock();
  }
  const unlockQ = []; let unlockBusy = false;
  function nextUnlock() {
    const a = unlockQ.shift(); if (!a) { unlockBusy = false; return; }
    unlockBusy = true;
    const el = document.createElement('div'); el.className = 'kd-unlock'; el.setAttribute('role', 'status');
    const i = document.createElement('i'); i.textContent = a.icon;
    const t = document.createElement('div'); t.textContent = a.name; const sm = document.createElement('small'); sm.textContent = a.desc; t.append(sm);
    el.append(i, t); document.body.append(el); setTimeout(() => { el.remove(); nextUnlock(); }, 3100);
    arp([784, 988, 1175, 1568], 'triangle', 0.07, 0.08); vib([10, 40, 10]);
  }
  function paintAch() {
    const box = $('ach'); box.innerHTML = '';
    let got = 0;
    D.ach.forEach((a) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'kd-badge' + (S.ach[a.id] ? ' got' : '');
      if (S.ach[a.id]) got++;
      b.textContent = a.icon; b.title = `${a.name}: ${a.desc}${S.ach[a.id] ? ' (unlocked)' : ''}`; b.setAttribute('aria-label', b.title);
      b.addEventListener('click', () => Curio.toast(`${a.icon} ${a.name}: ${a.desc}${S.ach[a.id] ? ' ✓' : ''}`));
      box.append(b);
    });
    $('achCount').textContent = `${got}/${D.ach.length}`;
  }

  const pop = () => { const b = $('bezel'); b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); };
  const shake = () => { const b = $('bezel'); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); vib(20); };

  function frameShape() { $('bezel').classList.toggle('square', KIND[set.kind].frame === 'square'); }
  function status() {
    const k = KIND[set.kind];
    const sym = isGrid(set.kind) ? `${set.tiles}×${set.tiles} ${k.name.toLowerCase()}` : set.kind === 'free' ? 'No mirrors' : set.kind === 'flip' ? 'Butterfly' : set.kind === 'quad' ? 'Quad mirror' : `${set.fold}-fold ${k.name.toLowerCase()}`;
    $('status').textContent = `${sym} · ${BRUSH[set.brush].name}`;
  }

  const brushEls = [];
  function brushPreview(canvas, id) {
    const c = canvas.getContext('2d'), w = 240, h = 68; canvas.width = w; canvas.height = h;
    c.fillStyle = '#15121d'; c.fillRect(0, 0, w, h);
    const s = { b: id, k: 'free', n: 1, t: 1, s: 2.4, o: 1, m: 'rainbow', p: 'sunset', c1: '#ff4fd8', c2: '#36e0ff', g: 1, h: 300, seed: 7, pts: [] };
    const ss = { r: rng(7), len: 0, w: s.s * RES / 700, acc: 1e9, hist: [], M: [[1, 0, 0, 1, 0, 0]], dark: true, bgc: '#15121d', pal: PAL.sunset.c };
    if (id === 'eraser') { c.fillStyle = '#ff9ff3'; c.fillRect(20, 14, 200, 40); }
    let px = 18, py = h / 2;
    seg(c, s, ss, px, py, px + 0.01, py);
    for (let x = 22; x <= 222; x += 4) { const y = h / 2 + Math.sin(x / 22) * 16; seg(c, s, ss, px, py, x, y); px = x; py = y; }
  }
  D.brushes.forEach((b) => {
    const el = document.createElement('button'); el.type = 'button'; el.className = 'kd-brush'; el.title = b.tip;
    const cn = document.createElement('canvas'); cn.setAttribute('aria-hidden', 'true'); brushPreview(cn, b.id);
    const sp = document.createElement('span'); sp.textContent = b.name;
    el.append(cn, sp); el.dataset.b = b.id;
    el.addEventListener('click', () => { setBrush(b.id); Curio.beep(620, 0.04, 'sine', 0.06); });
    $('brushes').append(el); brushEls.push(el);
  });
  function setBrush(id) { set.brush = id; brushEls.forEach((e) => e.setAttribute('aria-pressed', String(e.dataset.b === id))); status(); save(); }

  const kindEls = [];
  function kindIcon(canvas, id) {
    const sz = 96, c = canvas.getContext('2d'); canvas.width = canvas.height = sz;
    const k = sz / RES;
    const s = { b: 'ink', k: id, n: 6, t: 3, s: 44, o: 1, m: 'palette', p: 'sunset', c1: '#ff5a36', c2: '#ffc233', g: 0, h: 0, seed: 3, pts: [] };
    const ss = { r: rng(3), len: 0, w: s.s * RES / 700, acc: 1e9, hist: [], M: mats(s).map((m) => [m[0] * k, m[1] * k, m[2] * k, m[3] * k, m[4] * k, m[5] * k]), dark: false, bgc: '#fff', pal: PAL.sunset.c };
    const pts = [];
    if (isGrid(id)) { const ts = RES / 3; for (let i = 0; i <= 12; i++) { const f = i / 12; pts.push([ts * (0.15 + f * 0.6), ts * (0.2 + 0.5 * f * f)]); } }
    else for (let i = 0; i <= 14; i++) { const f = i / 14; pts.push([120 + f * 340, -40 - Math.sin(f * 3.2) * 150]); }
    let [px, py] = pts[0];
    for (const [x, y] of pts.slice(1)) { seg(c, s, ss, px, py, x, y); px = x; py = y; }
  }
  D.kinds.forEach((kd) => {
    const el = document.createElement('button'); el.type = 'button'; el.className = 'kd-kind'; el.title = kd.tip; el.dataset.k = kd.id;
    const cn = document.createElement('canvas'); cn.setAttribute('aria-hidden', 'true'); kindIcon(cn, kd.id);
    const sp = document.createElement('span'); sp.textContent = kd.name;
    el.append(cn, sp);
    el.addEventListener('click', () => { setKind(kd.id); Curio.beep(520, 0.05, 'triangle', 0.06); pop(); });
    $('kinds').append(el); kindEls.push(el);
  });
  function setKind(id) {
    set.kind = id; kindEls.forEach((e) => e.setAttribute('aria-pressed', String(e.dataset.k === id)));
    $('foldField').hidden = !['mirror', 'radial', 'spiral'].includes(id);
    $('tileField').hidden = !isGrid(id);
    frameShape(); status(); save(); dirty = true;
    setTimeout(resize, 520);
  }

  const palEls = [];
  D.palettes.forEach((p) => {
    const el = document.createElement('button'); el.type = 'button'; el.className = 'kd-pal'; el.title = p.name; el.setAttribute('aria-label', `${p.name} palette`); el.dataset.p = p.id;
    p.c.forEach((c) => { const i = document.createElement('i'); i.style.background = c; el.append(i); });
    el.addEventListener('click', () => { setPal(p.id); if (set.mode !== 'palette') setMode('palette'); Curio.beep(700, 0.04, 'sine', 0.05); });
    $('pals').append(el); palEls.push(el);
  });
  function setPal(id) { set.pal = id; palEls.forEach((e) => e.setAttribute('aria-pressed', String(e.dataset.p === id))); save(); }

  const bgEls = [];
  D.bgs.forEach((b) => {
    const el = document.createElement('button'); el.type = 'button'; el.className = 'kd-bg'; el.style.background = b.c; el.title = b.name; el.setAttribute('aria-label', `${b.name} background`); el.dataset.bg = b.id;
    el.addEventListener('click', () => { if (set.bg === b.id) return; setBg(b.id); rebuild(); afterChange(); Curio.beep(480, 0.06, 'sine', 0.06); });
    $('bgs').append(el); bgEls.push(el);
  });
  function setBg(id) { set.bg = id; bgEls.forEach((e) => e.setAttribute('aria-pressed', String(e.dataset.bg === id))); cv.style.background = BG[id].c; save(); }

  const modeBtns = document.querySelectorAll('[data-mode]');
  function setMode(m) {
    set.mode = m; modeBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
    $('pals').hidden = m !== 'palette';
    $('pickers').hidden = m === 'rainbow' || m === 'palette';
    $('c2').style.display = m === 'gradient' ? '' : 'none';
    $('cHint').textContent = m === 'gradient' ? 'Blends between two colours' : 'One colour, pure vibes';
    save();
  }
  modeBtns.forEach((b) => b.addEventListener('click', () => { setMode(b.dataset.mode); Curio.beep(560, 0.04, 'sine', 0.05); }));
  $('c1').addEventListener('input', () => { set.c1 = $('c1').value; save(); });
  $('c2').addEventListener('input', () => { set.c2 = $('c2').value; save(); });

  GENS.forEach((gn) => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = gn.name; b.dataset.g = gn.id;
    b.addEventListener('click', () => { set.gen = gn.id; paintGens(); save(); startAuto(gn.id); });
    $('gens').append(b);
  });
  function paintGens() { $('gens').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.g === set.gen))); }

  const fe = $('fold'), te = $('tiles'), se = $('size'), oe = $('opac'), re = $('rspeed');
  function syncSliders() {
    fe.value = set.fold; $('foldV').textContent = set.fold;
    te.value = set.tiles; $('tilesV').textContent = set.tiles;
    se.value = set.size; $('sizeV').textContent = set.size;
    oe.value = set.opac; $('opacV').textContent = set.opac + '%';
    re.value = set.rspeed; $('rspeedV').textContent = set.rspeed + 'x';
  }
  fe.addEventListener('input', () => { set.fold = +fe.value; syncSliders(); status(); save(); dirty = true; });
  te.addEventListener('input', () => { set.tiles = +te.value; syncSliders(); status(); save(); dirty = true; });
  se.addEventListener('input', () => { set.size = +se.value; syncSliders(); save(); });
  oe.addEventListener('input', () => { set.opac = +oe.value; syncSliders(); save(); });
  re.addEventListener('input', () => { set.rspeed = +re.value; syncSliders(); save(); });

  function tog(id, get, put) {
    const b = $(id); b.setAttribute('aria-pressed', String(get()));
    b.addEventListener('click', () => { put(!get()); b.setAttribute('aria-pressed', String(get())); dirty = true; save(); Curio.beep(get() ? 760 : 380, 0.05, 'sine', 0.05); });
  }
  tog('glow', () => set.glow, (v) => { set.glow = v; });
  tog('sound', () => set.sound, (v) => { set.sound = v; });
  tog('guides', () => guides, (v) => { guides = v; });

  document.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('[data-tab]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    document.querySelectorAll('[data-pane]').forEach((p) => { p.hidden = p.dataset.pane !== b.dataset.tab; });
    if (b.dataset.tab === 'more') paintGallery();
  }));

  function setSpin(v) { spin = v; $('spinBtn').setAttribute('aria-pressed', String(v)); if (!v) { view = 0; dirty = true; } }
  function setCycle(v) { cycle = v; $('cycleBtn').setAttribute('aria-pressed', String(v)); if (!v) { hueShift = 0; cv.style.filter = ''; } }
  $('undo').addEventListener('click', undo);
  $('redo').addEventListener('click', redo);
  $('replay').addEventListener('click', () => replay ? stopReplay(true) : startReplay());
  $('spinBtn').addEventListener('click', () => { setSpin(!spin); Curio.beep(spin ? 660 : 330, 0.06, 'sine', 0.06); });
  $('cycleBtn').addEventListener('click', () => { setCycle(!cycle); Curio.beep(cycle ? 700 : 350, 0.06, 'sine', 0.06); });
  $('autoBtn').addEventListener('click', () => auto ? stopAuto() : startAuto());
  $('clear').addEventListener('click', clearAll);
  $('save').addEventListener('click', finish);

  function exportCanvas(size, round) {
    const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d');
    if (round) { x.beginPath(); x.arc(size / 2, size / 2, size / 2, 0, TAU); x.clip(); }
    x.drawImage(paper, 0, 0, size, size);
    return c;
  }
  const isRound = () => KIND[set.kind].frame === 'circle';
  function nameFor(seed) { const r = rng(seed); return `${D.adj[Math.floor(r() * D.adj.length)]} ${D.noun[Math.floor(r() * D.noun.length)]} No. ${1 + Math.floor(r() * 99)}`; }
  const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

  async function finish() {
    if (cur) endStroke();
    if (auto) stopAuto();
    if (replay) stopReplay(true);
    if (!strokes.length) { Curio.toast('Your canvas is empty. Draw something first!'); shake(); return; }
    const name = nameFor(strokes.length * 7919 + (strokes[0].seed | 0));
    const used = new Set(strokes.map((s) => s.b)), kinds = new Set(strokes.map((s) => s.k));
    const segs = totalSegs();
    let dailyNote = '';
    if (S.dailyOn === todayKey() && strokes.length >= 6 && !S.daily[todayKey()]) {
      S.daily[todayKey()] = 1; save(); unlock('daily'); dailyNote = `Daily prompt "${todayPrompt().w}" complete! `;
    }
    const box = document.createElement('div'); box.className = 'kd-result';
    const img = new Image(); img.alt = name; img.src = exportCanvas(480, false).toDataURL('image/jpeg', 0.9); if (!isRound()) img.className = 'sq';
    const h = document.createElement('h3'); h.textContent = `"${name}"`;
    const st = document.createElement('div'); st.className = 'kd-result__stats';
    [`${strokes.length} strokes`, `${Curio.fmt(segs)} segments`, `${used.size} brush${used.size === 1 ? '' : 'es'}`, `${kinds.size} symmetry kind${kinds.size === 1 ? '' : 's'}`].forEach((t) => { const sp = document.createElement('span'); sp.textContent = t; st.append(sp); });
    const p = document.createElement('div'); p.className = 'c-muted'; p.style.fontSize = '14px';
    p.textContent = dailyNote + Curio.pick(['A museum would hang this. Probably sideways.', 'Somewhere, a stained glass window is jealous.', 'Certified hypnotic.', 'The mirrors did most of the work, but you get the credit.', 'Frame it. Or make it your phone wallpaper. Both valid.']);
    box.append(img, h, st, p);
    Curio.confetti(140); arp([523, 659, 784, 1047, 1319], 'triangle', 0.08, 0.09); pop();
    const v = await Curio.modal({ emoji: '🖼️', title: 'Masterpiece complete', body: box, buttons: [{ label: '⬇ Download PNG', value: 'png' }, { label: '★ Save to gallery', value: 'gal' }, { label: '📋 Copy share text', value: 'share' }, { label: 'Keep drawing', value: 'close' }] });
    if (v === 'png') {
      const a = document.createElement('a'); a.download = `curio-kaleidoscope-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
      a.href = exportCanvas(RES, isRound()).toDataURL('image/png'); document.body.append(a); a.click(); a.remove();
      Curio.toast('Downloaded your mandala 🖼️');
    } else if (v === 'gal') addToGallery(name);
    else if (v === 'share') {
      const text = `I drew "${name}" on Curio Kaleidoscope: ${strokes.length} strokes, ${KIND[strokes[strokes.length - 1].k].name} symmetry, ${used.size} brush${used.size === 1 ? '' : 'es'}. ✨🪞`;
      try { await navigator.clipboard.writeText(text); Curio.toast('Copied! Paste it anywhere'); } catch { Curio.toast(text, 4000); }
    }
  }

  function addToGallery(name) {
    const thumb = exportCanvas(180, false).toDataURL('image/jpeg', 0.78);
    let data = null; try { const j = JSON.stringify(strokes); if (j.length < 150000) data = strokes; } catch {}
    S.gallery.unshift({ id: Date.now(), name, thumb, bg: set.bg, round: isRound(), strokes: data });
    if (S.gallery.length > 9) S.gallery.length = 9;
    S.stats.saves++;
    try { save(); } catch {}
    unlock('gallery'); paintGallery();
    Curio.toast(data ? 'Saved to your gallery (More tab)' : 'Saved a picture to your gallery (too big to re-edit)');
  }
  function paintGallery() {
    const box = $('gallery'); box.innerHTML = '';
    $('galCount').textContent = `${S.gallery.length}/9`;
    if (!S.gallery.length) { const e = document.createElement('div'); e.className = 'kd-empty'; e.textContent = 'Finish a drawing with ✓ and save it here.'; box.append(e); return; }
    S.gallery.forEach((it) => {
      const b = document.createElement('div'); b.className = 'kd-gal'; b.setAttribute('role', 'button'); b.tabIndex = 0; b.title = it.name; b.setAttribute('aria-label', `Open ${it.name}`);
      const img = new Image(); img.src = it.thumb; img.alt = '';
      if (it.round) b.style.borderRadius = '50%';
      const x = document.createElement('button'); x.type = 'button'; x.className = 'kd-gal__x'; x.textContent = '×'; x.setAttribute('aria-label', `Delete ${it.name}`);
      x.addEventListener('click', (e) => { e.stopPropagation(); S.gallery = S.gallery.filter((g2) => g2.id !== it.id); save(); paintGallery(); Curio.beep(220, 0.08, 'sine', 0.06); });
      const open = async () => {
        if (!Array.isArray(it.strokes)) { Curio.toast('Only the picture was kept for this one'); return; }
        const v = strokes.length ? await Curio.modal({ emoji: '🖼️', title: `Open "${it.name}"?`, body: 'Your current drawing will be replaced. Undo can bring it back.', buttons: [{ label: 'Open it', value: 'y' }, { label: 'Cancel', value: 'n' }] }) : 'y';
        if (v !== 'y') return;
        if (replay) stopReplay(true);
        cleared = strokes.length ? { strokes, redo: redoStack } : null;
        strokes = it.strokes.map((s) => ({ ...s, pts: s.pts.slice() })); redoStack = [];
        if (BG[it.bg]) setBg(it.bg);
        const last = strokes[strokes.length - 1]; if (last && KIND[last.k]) setKind(last.k);
        rebuild(); afterChange(true); dismissIntro(); pop();
        startReplay();
      };
      b.addEventListener('click', open);
      b.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(); });
      b.append(img, x); box.append(b);
    });
  }

  function hashStr(s) { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function todayPrompt() { return D.prompts[hashStr('kd' + todayKey()) % D.prompts.length]; }
  function applyPrompt(pr) {
    setKind(pr.k);
    if (['mirror', 'radial', 'spiral'].includes(pr.k)) set.fold = Math.max(2, pr.n);
    if (isGrid(pr.k)) set.tiles = Math.max(2, Math.min(6, pr.n));
    setBrush(pr.b); setMode(pr.m); setPal(pr.p);
    if (set.bg !== pr.bg) { setBg(pr.bg); rebuild(); }
    syncSliders(); status(); save();
  }
  function paintDaily() {
    const pr = todayPrompt(), done = S.daily[todayKey()];
    $('dailyBtn').textContent = done ? `📅 Today's prompt "${pr.w}" done ✓` : `📅 Today's prompt: ${pr.w}`;
  }
  $('dailyBtn').addEventListener('click', () => {
    const pr = todayPrompt();
    S.dailyOn = todayKey(); save();
    applyPrompt(pr);
    if (strokes.length) { cleared = { strokes, redo: redoStack }; strokes = []; redoStack = []; cp = 0; fillBg(bgc); compose(); afterChange(true); }
    dismissIntro();
    Curio.toast(`Draw a "${pr.w}". At least 6 strokes, then press ✓`, 3200);
    arp([392, 523, 659]);
  });
  $('go').addEventListener('click', () => { dismissIntro(); Curio.beep(660, 0.08, 'triangle', 0.08); });
  $('surprise').addEventListener('click', surprise);
  function surprise() {
    const pr = Curio.pick(D.prompts);
    applyPrompt(pr);
    set.gen = Curio.pick(GENS).id; paintGens();
    if (strokes.length) { cleared = { strokes, redo: redoStack }; strokes = []; redoStack = []; cp = 0; fillBg(bgc); compose(); afterChange(true); }
    startAuto(set.gen, 700);
    Curio.toast(`🎲 ${pr.w}: ${KIND[pr.k].name} + ${BRUSH[pr.b].name}`);
  }

  (function introArt() {
    const g2 = $('introPetals'), cols = ['#ff9ff3', '#feca57', '#48dbfb', '#ff6b6b', '#1dd1a1', '#c8a2ff'];
    for (let i = 0; i < 12; i++) {
      const e = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      e.setAttribute('cx', '60'); e.setAttribute('cy', '32'); e.setAttribute('rx', '9'); e.setAttribute('ry', '24');
      e.setAttribute('fill', cols[i % cols.length]); e.setAttribute('opacity', '.8'); e.setAttribute('transform', `rotate(${i * 30} 60 60)`);
      e.style.mixBlendMode = 'screen';
      g2.append(e);
    }
  })();

  const cycleList = (list, curId, dir) => { const i = list.findIndex((x) => x.id === curId); return list[(i + dir + list.length) % list.length].id; };
  addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea, select') || e.altKey) return;
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
    if ((e.ctrlKey || e.metaKey) && k === 'y') { e.preventDefault(); redo(); return; }
    if (e.ctrlKey || e.metaKey) return;
    if (document.querySelector('.curio-modal')) return;
    if (k === 'z') undo();
    else if (k === 'y') redo();
    else if (k === 'b') { setBrush(cycleList(D.brushes, set.brush, e.shiftKey ? -1 : 1)); Curio.toast(`🖌️ ${BRUSH[set.brush].name}`); }
    else if (k === 'm') { setKind(cycleList(D.kinds, set.kind, e.shiftKey ? -1 : 1)); Curio.toast(`🪞 ${KIND[set.kind].name}`); }
    else if (k === '[') { set.size = Math.max(1, set.size - 1); syncSliders(); save(); }
    else if (k === ']') { set.size = Math.min(40, set.size + 1); syncSliders(); save(); }
    else if (k === '-' || k === '_') { if (isGrid(set.kind)) set.tiles = Math.max(2, set.tiles - 1); else set.fold = Math.max(2, set.fold - 1); syncSliders(); status(); save(); dirty = true; }
    else if (k === '=' || k === '+') { if (isGrid(set.kind)) set.tiles = Math.min(6, set.tiles + 1); else set.fold = Math.min(16, set.fold + 1); syncSliders(); status(); save(); dirty = true; }
    else if (k === ' ') { if (e.target.matches('button')) return; e.preventDefault(); setSpin(!spin); }
    else if (k === 'h') setCycle(!cycle);
    else if (k === 'r') replay ? stopReplay(true) : startReplay();
    else if (k === 'a') auto ? stopAuto() : startAuto();
    else if (k === 'c') clearAll();
    else if (k === 's') finish();
    else if (k === 'g') { guides = !guides; $('guides').setAttribute('aria-pressed', String(guides)); dirty = true; }
    else return;
    dismissIntro();
  });

  let lastT = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
    if (!document.hidden) {
      if (auto) autoStep();
      if (replay) replayStep();
      if (spin) { view = (view + dt * 0.35) % TAU; dirty = true; }
      if (cycle) { hueShift = (hueShift + dt * 45) % 360; cv.style.filter = `hue-rotate(${hueShift.toFixed(1)}deg)`; }
      if (dirty) { present(); dirty = false; }
    }
    requestAnimationFrame(loop);
  }

  addEventListener('resize', resize);
  addEventListener('curio:theme', () => { dirty = true; });
  document.addEventListener('visibilitychange', () => { if (document.hidden && cur && !auto) endStroke(); });

  setBrush(set.brush); setKind(set.kind); setPal(set.pal); setBg(set.bg); setMode(set.mode); syncSliders(); paintGens(); paintAch(); paintDaily(); status();
  $('c1').value = set.c1; $('c2').value = set.c2;
  let restored = false;
  try {
    const raw = JSON.parse(localStorage.getItem('curio:' + CUR) || 'null');
    if (raw && raw.v === VER && Array.isArray(raw.strokes) && raw.strokes.length) {
      strokes = raw.strokes.filter((s) => s && Array.isArray(s.pts) && s.pts.length >= 2 && BRUSH[s.b] && KIND[s.k]);
      if (BG[raw.bg]) setBg(raw.bg);
      restored = strokes.length > 0;
    }
  } catch { strokes = []; }
  if (!restored) {
    const gen = GENS[0], p = { k: 3, R: RES * 0.36, sp: 0.012 };
    const s = { b: 'neon', k: 'mirror', n: 8, t: 4, s: 5, o: 1, m: 'rainbow', p: 'sunset', c1: set.c1, c2: set.c2, g: 1, h: r1(hueCursor), seed: 42, pts: [] };
    for (let t = 0; t <= Math.PI * 1.02; t += 0.012) { const [x, y] = gen.at(p, t); s.pts.push(r1(x - C), r1(y - C)); }
    strokes = [s];
  }
  rebuild(); afterChange(true);
  resize();
  if (!Curio.touchpad && !Curio.store.get('tp-hint-kaleidoscope', false)) { Curio.store.set('tp-hint-kaleidoscope', true); setTimeout(() => Curio.toast('Tip: on a laptop touchpad, turn on Touchpad mode in the top bar', 3600), 1800); }
  requestAnimationFrame(loop);
})();
