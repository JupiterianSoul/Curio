(() => {
  const D = window.LIFE_DATA;
  const $ = (id) => document.getElementById(id);
  const SAVE = 'lifev2';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const THEMES = [
    { id: 'ember', n: 'Ember', bg: [16, 13, 22], f: (t) => hsl((48 - t * 170 + 360) % 360, 90, 60 - t * 8), dying: [255, 120, 60], trail: [120, 90, 200] },
    { id: 'ocean', n: 'Ocean', bg: [6, 18, 32], f: (t) => hsl(185 + t * 45, 85, 62 - t * 20), dying: [80, 160, 255], trail: [40, 120, 180] },
    { id: 'neon', n: 'Neon', bg: [8, 6, 14], f: (t) => hsl((300 + t * 160) % 360, 100, 60), dying: [0, 255, 170], trail: [160, 0, 200] },
    { id: 'forest', n: 'Forest', bg: [14, 20, 12], f: (t) => hsl(110 - t * 80, 60, 55 - t * 15), dying: [200, 160, 60], trail: [60, 110, 50] },
    { id: 'rainbow', n: 'Rainbow', bg: [14, 12, 18], f: (t, a) => hsl((a * 9) % 360, 85, 60), dying: [255, 255, 255], trail: [90, 90, 120] },
    { id: 'paper', n: 'Ink', bg: null, f: (t) => (isDark() ? hsl(40, 30, 90 - t * 20) : hsl(30, 25, 18 + t * 25)), dying: [255, 90, 54], trail: [180, 160, 230] }
  ];
  const SIZES = [{ id: 's', n: 'Small', cells: 12000 }, { id: 'm', n: 'Medium', cells: 32000 }, { id: 'l', n: 'Large', cells: 80000 }];
  const BADGES = [
    { id: 'draw', e: '✏️', t: 'Gardener', d: 'Draw 25 cells by hand' },
    { id: 'collect', e: '📚', t: 'Collector', d: 'Place 10 different library patterns' },
    { id: 'curator', e: '🗂️', t: 'Curator', d: 'Place a pattern from every category' },
    { id: 'rules', e: '🧪', t: 'Rule Bender', d: 'Try 5 different rulesets' },
    { id: 'import', e: '📥', t: 'Importer', d: 'Paste in an RLE pattern' },
    { id: 'export', e: '📤', t: 'Archivist', d: 'Copy your grid as RLE' },
    { id: 'rewind', e: '⏪', t: 'Time Traveller', d: 'Rewind a generation' },
    { id: 'gen1k', e: '🏃', t: 'Marathon', d: 'Reach generation 1,000' },
    { id: 'gen10k', e: '🧭', t: 'Long Haul', d: 'Reach generation 10,000' },
    { id: 'boom', e: '💥', t: 'Population Boom', d: 'Have 5,000 cells alive at once' },
    { id: 'extinct', e: '☠️', t: 'Extinction Event', d: 'Watch a crowd of 300+ die out completely' },
    { id: 'settle', e: '🧘', t: 'Settled', d: 'Watch a soup settle into still lifes and blinkers' },
    { id: 'copy', e: '🧬', t: 'Copy Machine', d: 'Run the replicator in HighLife' },
    { id: 'ten', e: '🌿', t: 'Green Thumb', d: 'Score 100+ in Ten Cell Garden' },
    { id: 'long500', e: '🕯️', t: 'Slow Burn', d: 'Score 500+ in Long Fuse' },
    { id: 'long2k', e: '🌳', t: 'Methuselah Hunter', d: 'Score 2,000+ in Long Fuse' },
    { id: 'daily', e: '🍲', t: 'Soup Sommelier', d: 'Watch the daily soup settle' },
    { id: 'theme', e: '🎨', t: 'Decorator', d: 'Try 4 colour themes' }
  ];
  const DEF = { v: 2, rule: 'B3/S23', theme: 'ember', glow: false, trails: true, wrap: true, size: 'm', density: 22, symm: false, badges: {}, seen: {}, cats: {}, rulesTried: [], themesTried: [], drawn: 0, best: { ten: 0, long: 0 }, daily: {}, tipShown: false };
  function load() {
    const s = Curio.store.get(SAVE, null);
    const out = JSON.parse(JSON.stringify(DEF));
    if (s && typeof s === 'object' && s.v === 2) for (const k of Object.keys(DEF)) { if (s[k] != null && typeof s[k] === typeof DEF[k] && Array.isArray(s[k]) === Array.isArray(DEF[k])) out[k] = s[k]; }
    if (!parseRule(out.rule)) out.rule = 'B3/S23';
    if (!THEMES.some((t) => t.id === out.theme)) out.theme = 'ember';
    if (!SIZES.some((t) => t.id === out.size)) out.size = 'm';
    return out;
  }
  function parseRule(str) {
    const m = String(str).toUpperCase().replace(/\s/g, '').match(/^B([0-8]*)\/S([0-8]*)(?:\/(\d{1,2}))?$/);
    if (!m) return null;
    const B = Array(9).fill(false), Sv = Array(9).fill(false);
    for (const c of m[1]) B[+c] = true;
    for (const c of m[2]) Sv[+c] = true;
    const C = m[3] ? Math.max(2, Math.min(25, +m[3])) : 2;
    return { B, S: Sv, C, id: `B${m[1]}/S${m[2]}${m[3] ? `/${C}` : ''}` };
  }
  const S = load();
  const save = () => Curio.store.set(SAVE, S);
  const isDark = () => Curio.isDark();

  const sfx = {
    tone(f, d = 0.08, type = 'sine', v = 0.06, f2 = 0) {
      if (Curio.muted) return; const ac = Curio.audioContext(); if (!ac) return;
      const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d + 0.03);
    },
    blip(pop) { this.tone(220 + Math.min(900, pop / 6), 0.04, 'sine', 0.025); },
    place() { this.tone(660, 0.07, 'triangle', 0.08); this.tone(990, 0.08, 'triangle', 0.05); },
    badge() { [880, 1175, 1568].forEach((f, k) => setTimeout(() => this.tone(f, 0.14, 'sine', 0.08), k * 70)); }
  };

  function hsl(h, s, l) {
    s /= 100; l /= 100;
    const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
  }
  const pack = (r, g, b) => (255 << 24) | (b << 16) | (g << 8) | r;

  function parseRLE(text) {
    const lines = String(text).replace(/\r/g, '').split('\n');
    let rule = null, body = '';
    const plain = lines.filter((l) => !l.startsWith('!') && l.trim()).every((l) => /^[.Oo*]+$/.test(l.trim()));
    if (plain && lines.some((l) => /[Oo*]/.test(l) && !l.startsWith('!'))) {
      const cells = [];
      lines.filter((l) => !l.startsWith('!')).forEach((l, y) => [...l].forEach((ch, x) => { if (ch === 'O' || ch === 'o' || ch === '*') cells.push([x, y]); }));
      return finishParse(cells, null);
    }
    for (const l of lines) {
      const t = l.trim();
      if (!t || t.startsWith('#')) continue;
      if (/^x\s*=/.test(t)) { const m = t.match(/rule\s*=\s*([^,\s]+)/i); if (m) rule = m[1]; continue; }
      body += t;
    }
    if (!body) return null;
    const cells = [];
    let x = 0, y = 0, n = '';
    for (const ch of body) {
      if (ch >= '0' && ch <= '9') { n += ch; continue; }
      const k = n ? Math.min(+n, 5000) : 1; n = '';
      if (ch === 'b' || ch === '.') x += k;
      else if (ch === '$') { y += k; x = 0; }
      else if (ch === '!') break;
      else if (/[a-zA-Z]/.test(ch)) { for (let i = 0; i < k; i++) cells.push([x++, y]); }
      else return null;
      if (cells.length > 200000) return null;
    }
    return finishParse(cells, rule);
  }
  function finishParse(cells, rule) {
    if (!cells.length) return null;
    let w = 0, h = 0;
    for (const [x, y] of cells) { w = Math.max(w, x + 1); h = Math.max(h, y + 1); }
    return { cells, w, h, rule };
  }

  function sceneCells(id) {
    const P = (n) => parseRLE(D.patterns.find((p) => p.n === n).r).cells;
    const out = [];
    const add = (cells, dx, dy, rot = 0, flip = false) => {
      for (let [x, y] of cells) { if (flip) x = -x; for (let k = 0; k < rot; k++) [x, y] = [-y, x]; out.push([x + dx, y + dy]); }
    };
    if (id === 'fleet') for (let k = 0; k < 6; k++) add(P('Glider'), (k % 3) * 7 + (k > 2 ? 4 : 0), Math.floor(k / 3) * 7 + (k % 3) * 2);
    if (id === 'parade') { add(P('LWSS'), 0, 0); add(P('MWSS'), -4, 12); add(P('HWSS'), -8, 25); }
    if (id === 'pulsars') for (let k = 0; k < 4; k++) add(P('Pulsar'), (k % 2) * 17, Math.floor(k / 2) * 17);
    if (id === 'duel') { add(P('Gosper glider gun'), 0, 0); add(P('Gosper glider gun'), 80, 64, 2); }
    if (id === 'rain') { let seed = 7; const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }; for (let k = 0; k < 18; k++) add(P('Glider'), Math.floor(r() * 90), Math.floor(r() * 50), Math.floor(r() * 4)); }
    if (id === 'garden') {
      const names = ['Block', 'Beehive', 'Loaf', 'Boat', 'Blinker', 'Toad', 'Beacon', 'Pond', 'Clock', 'Tub', 'Ship', 'Pentadecathlon'];
      names.forEach((n, k) => add(P(n), (k % 4) * 14, Math.floor(k / 4) * 12));
    }
    let mx = Infinity, my = Infinity;
    for (const [x, y] of out) { mx = Math.min(mx, x); my = Math.min(my, y); }
    return out.map(([x, y]) => [x - mx, y - my]);
  }
  function patternCells(p) { return p.scene ? sceneCells(p.scene) : parseRLE(p.r).cells; }

  const canvas = $('grid'), ctx = canvas.getContext('2d'), stage = $('stage');
  let GW, GH, N, cells, next, age, trail, pad, PW, off, offCtx, img, buf;
  let rule = parseRule(S.rule);
  let gen = 0, pop = 0, peak = 0, running = false, dirty = true;
  let viewW = 0, viewH = 0, dpr = 1, s = 6, cx = 0, cy = 0;
  let history = [], undoStack = [], hashes = new Map(), popHist = [], stateMsg = '', crowdPeak = 0;
  let LUT = new Uint32Array(256), LUTcss = [], DYING = new Uint32Array(32), TRAIL = new Uint32Array(256), BGC = 0, bgCss = '#000', gridLine = '';

  function makeGrid(keep) {
    const r = stage.getBoundingClientRect();
    const aspect = Math.max(0.6, Math.min(2.4, r.width / Math.max(1, r.height)));
    const total = (SIZES.find((x) => x.id === S.size) || SIZES[1]).cells;
    const old = keep && cells ? { cells, GW, GH } : null;
    GW = Math.round(Math.sqrt(total * aspect)); GH = Math.round(total / GW); N = GW * GH;
    cells = new Uint8Array(N); next = new Uint8Array(N); age = new Uint8Array(N); trail = new Uint8Array(N);
    PW = GW + 2; pad = new Uint8Array(PW * (GH + 2));
    off = document.createElement('canvas'); off.width = GW; off.height = GH;
    offCtx = off.getContext('2d');
    img = offCtx.createImageData(GW, GH); buf = new Uint32Array(img.data.buffer);
    if (old) {
      const ox = Math.floor((GW - old.GW) / 2), oy = Math.floor((GH - old.GH) / 2);
      for (let y = 0; y < old.GH; y++) for (let x = 0; x < old.GW; x++) { const v = old.cells[y * old.GW + x]; const nx = x + ox, ny = y + oy; if (v && nx >= 0 && ny >= 0 && nx < GW && ny < GH) cells[ny * GW + nx] = v; }
    }
    history = []; hashes.clear(); popHist = [];
    recount();
  }

  function palette() {
    const th = THEMES.find((t) => t.id === S.theme) || THEMES[0];
    const bg = th.bg || (isDark() ? [18, 16, 22] : [252, 249, 243]);
    BGC = pack(...bg); bgCss = `rgb(${bg})`;
    const light = (bg[0] + bg[1] + bg[2]) / 3 > 128;
    gridLine = light ? 'rgba(40,30,20,.08)' : 'rgba(255,255,255,.06)';
    for (let a = 0; a < 256; a++) {
      const t = Math.min(1, Math.log(1 + a) / Math.log(64));
      const c = th.f(t, a);
      LUT[a] = pack(...c); LUTcss[a] = `rgb(${c})`;
    }
    for (let k = 0; k < 32; k++) {
      const t = Math.min(1, k / Math.max(2, rule.C - 1));
      DYING[k] = pack(...th.dying.map((v, i) => Math.round(v + (bg[i] - v) * t * 0.85)));
    }
    for (let v = 0; v < 256; v++) { const t = (v / 255) * 0.3; TRAIL[v] = pack(...bg.map((b0, i) => Math.round(b0 + (th.trail[i] - b0) * t))); }
    stage.style.background = bgCss;
    dirty = true;
  }

  function stepLife() {
    if (history.length >= 120) history.shift();
    history.push({ c: cells.slice(), a: age.slice(), gen, peak });
    const W = GW, H = GH, C = rule.C, B = rule.B, Sv = rule.S, wrap = S.wrap;
    for (let y = 0; y < H; y++) { const r = (y + 1) * PW + 1, o = y * W; for (let x = 0; x < W; x++) pad[r + x] = cells[o + x] === 1 ? 1 : 0; }
    if (wrap) {
      pad.copyWithin(0, H * PW, H * PW + PW);
      pad.copyWithin((H + 1) * PW, PW, 2 * PW);
      for (let r = 0; r < H + 2; r++) { pad[r * PW] = pad[r * PW + W]; pad[r * PW + W + 1] = pad[r * PW + 1]; }
    } else {
      pad.fill(0, 0, PW); pad.fill(0, (H + 1) * PW);
      for (let r = 0; r < H + 2; r++) { pad[r * PW] = 0; pad[r * PW + W + 1] = 0; }
    }
    let p = 0;
    for (let y = 0; y < H; y++) {
      let i = (y + 1) * PW + 1;
      let j = y * W;
      for (let x = 0; x < W; x++, i++, j++) {
        const n = pad[i - PW - 1] + pad[i - PW] + pad[i - PW + 1] + pad[i - 1] + pad[i + 1] + pad[i + PW - 1] + pad[i + PW] + pad[i + PW + 1];
        const st = cells[j];
        let ns;
        if (st === 0) ns = B[n] ? 1 : 0;
        else if (st === 1) ns = Sv[n] ? 1 : C > 2 ? 2 : 0;
        else ns = st + 1 < C ? st + 1 : 0;
        next[j] = ns;
        if (ns === 1) { p++; age[j] = st === 1 ? (age[j] < 255 ? age[j] + 1 : 255) : 0; }
        else if (st === 1) trail[j] = 255;
        else if (trail[j]) trail[j] = trail[j] > 20 ? trail[j] - 20 : 0;
      }
    }
    const t = cells; cells = next; next = t;
    gen++; pop = p; if (p > peak) peak = p;
    popHist.push(p); if (popHist.length > 160) popHist.shift();
    crowdPeak = Math.max(crowdPeak, p);
    detect();
    dirty = true;
  }

  function hashCells() {
    let h = 2166136261;
    for (let i = 0; i < N; i += 1) { const v = cells[i]; if (v) { h ^= i * 31 + v; h = Math.imul(h, 16777619); } }
    return h >>> 0;
  }
  let settledAt = -1;
  function detect() {
    if (pop === 0) {
      setState('Extinct');
      if (crowdPeak >= 300) award('extinct');
      crowdPeak = 0;
      return;
    }
    const h = hashCells();
    const prev = hashes.get(h);
    if (prev != null && gen - prev <= 60) {
      const per = gen - prev;
      if (settledAt < 0) settledAt = gen - per;
      setState(per === 1 ? `Still life since gen ${Curio.fmt(settledAt)}` : `Oscillating, period ${per}`);
      if (soupWatch && per <= 2) award('settle');
      if (dailyWatch) { award('daily'); S.daily[dailyWatch] = settledAt; save(); dailyWatch = null; Curio.toast(`Today's soup settled at generation ${Curio.fmt(settledAt)}.`); }
    } else { settledAt = -1; if (stateMsg && !stateMsg.startsWith('Running')) setState(''); }
    hashes.set(h, gen);
    if (hashes.size > 70) { const cut = gen - 64; for (const [k, g] of hashes) if (g < cut) hashes.delete(k); }
    if (gen === 1000) award('gen1k');
    if (gen === 10000) award('gen10k');
    if (pop >= 5000) award('boom');
  }
  function setState(t) {
    if (t === stateMsg) return;
    stateMsg = t;
    const el = $('state');
    el.textContent = t; el.classList.toggle('on', !!t);
  }

  function recount() { let p = 0; for (let i = 0; i < N; i++) if (cells[i] === 1) p++; pop = p; if (p > peak) peak = p; dirty = true; }

  function fitScale() { return Math.min(viewW / GW, viewH / GH); }
  function clampView() {
    const vw = viewW / s, vh = viewH / s;
    cx = GW <= vw ? -(vw - GW) / 2 : Math.max(0, Math.min(GW - vw, cx));
    cy = GH <= vh ? -(vh - GH) / 2 : Math.max(0, Math.min(GH - vh, cy));
  }
  function zoomAt(f, sx, sy) {
    const wx = cx + sx / s, wy = cy + sy / s;
    s = Math.max(fitScale(), Math.min(60, s * f));
    cx = wx - sx / s; cy = wy - sy / s;
    clampView(); dirty = true;
  }
  function resize(first) {
    const r = stage.getBoundingClientRect();
    dpr = Math.min(2, devicePixelRatio || 1);
    viewW = r.width; viewH = r.height;
    canvas.width = Math.round(viewW * dpr); canvas.height = Math.round(viewH * dpr);
    if (first) { s = Math.max(fitScale() * 1.6, 5); cx = (GW - viewW / s) / 2; cy = (GH - viewH / s) / 2; }
    s = Math.max(s, fitScale());
    clampView(); dirty = true;
  }

  function draw() {
    for (let i = 0; i < N; i++) { const v = cells[i]; buf[i] = v === 1 ? LUT[age[i]] : v ? DYING[v] : S.trails && trail[i] ? TRAIL[trail[i]] : BGC; }
    offCtx.putImageData(img, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = bgCss; ctx.globalAlpha = 1; ctx.fillRect(0, 0, viewW, viewH);
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(0, 0, viewW, viewH);
    ctx.imageSmoothingEnabled = false;
    const gx = -cx * s, gy = -cy * s;
    if (s >= 10) {
      ctx.fillStyle = bgCss; ctx.fillRect(gx, gy, GW * s, GH * s);
      const x0 = Math.max(0, Math.floor(cx)), x1 = Math.min(GW, Math.ceil(cx + viewW / s));
      const y0 = Math.max(0, Math.floor(cy)), y1 = Math.min(GH, Math.ceil(cy + viewH / s));
      const rr = s * 0.42;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        const i = y * GW + x, v = cells[i];
        if (!v && !(S.trails && trail[i])) continue;
        const c = v === 1 ? LUT[age[i]] : v ? DYING[v] : TRAIL[trail[i]];
        ctx.fillStyle = `rgb(${c & 255},${(c >> 8) & 255},${(c >> 16) & 255})`;
        if (v === 1) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(gx + x * s + s * 0.08, gy + y * s + s * 0.08, s * 0.84, s * 0.84, rr) : ctx.rect(gx + x * s + 1, gy + y * s + 1, s - 2, s - 2); ctx.fill(); }
        else ctx.fillRect(gx + x * s + 1, gy + y * s + 1, s - 2, s - 2);
      }
    } else ctx.drawImage(off, gx, gy, GW * s, GH * s);
    if (S.glow) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.55; ctx.filter = `blur(${Math.max(2, s * 0.8)}px)`;
      ctx.imageSmoothingEnabled = true; ctx.drawImage(off, gx, gy, GW * s, GH * s); ctx.restore();
    }
    if (s >= 7) {
      ctx.strokeStyle = gridLine; ctx.lineWidth = 1; ctx.beginPath();
      const x0 = Math.max(0, Math.floor(cx)), x1 = Math.min(GW, Math.ceil(cx + viewW / s));
      const y0 = Math.max(0, Math.floor(cy)), y1 = Math.min(GH, Math.ceil(cy + viewH / s));
      for (let x = x0; x <= x1; x++) { const px = Math.round(gx + x * s) + 0.5; ctx.moveTo(px, Math.max(0, gy)); ctx.lineTo(px, Math.min(viewH, gy + GH * s)); }
      for (let y = y0; y <= y1; y++) { const py = Math.round(gy + y * s) + 0.5; ctx.moveTo(Math.max(0, gx), py); ctx.lineTo(Math.min(viewW, gx + GW * s), py); }
      ctx.stroke();
    }
    if (!S.wrap) { ctx.strokeStyle = 'rgba(255,90,54,.6)'; ctx.lineWidth = 2; ctx.strokeRect(gx, gy, GW * s, GH * s); }
    if (tool === 'stamp' && hover && stamp) {
      ctx.fillStyle = 'rgba(255, 90, 54, .6)';
      for (const [dx, dy] of stampCells()) {
        const x = wrapX(hover[0] + dx), y = wrapY(hover[1] + dy);
        if (x < 0 || y < 0) continue;
        ctx.fillRect(gx + x * s, gy + y * s, Math.max(1, s - (s > 4 ? 1 : 0)), Math.max(1, s - (s > 4 ? 1 : 0)));
      }
    }
    $('gen').textContent = Curio.fmt(gen);
    $('pop').textContent = Curio.fmt(pop);
    $('peak').textContent = Curio.fmt(peak);
    drawSpark();
    dirty = false;
  }
  const wrapX = (x) => (S.wrap ? ((x % GW) + GW) % GW : x >= 0 && x < GW ? x : -1);
  const wrapY = (y) => (S.wrap ? ((y % GH) + GH) % GH : y >= 0 && y < GH ? y : -1);

  const spark = $('spark'), sctx = spark.getContext('2d');
  function drawSpark() {
    const w = 120, h = 34, d = Math.min(2, devicePixelRatio || 1);
    if (spark.width !== w * d) { spark.width = w * d; spark.height = h * d; }
    sctx.setTransform(d, 0, 0, d, 0, 0);
    sctx.clearRect(0, 0, w, h);
    if (popHist.length < 2) return;
    const max = Math.max(...popHist, 1);
    sctx.beginPath();
    popHist.forEach((v, i) => { const x = 4 + (i / 159) * (w - 8), y = h - 4 - (v / max) * (h - 8); i ? sctx.lineTo(x, y) : sctx.moveTo(x, y); });
    sctx.strokeStyle = LUTcss[2] || '#ff5a36'; sctx.lineWidth = 2; sctx.lineJoin = 'round'; sctx.stroke();
  }

  let tool = 'draw', stamp = null, rot = 0, flip = false, hover = null;
  function setTool(t) {
    tool = t;
    canvas.classList.toggle('pan', t === 'pan');
    canvas.classList.toggle('erase', t === 'erase');
    paintHint();
    if (activeTab === 'tools' || activeTab === 'library') renderPanel();
    dirty = true;
  }
  function paintHint() {
    const h = $('hint');
    if (challenge) h.textContent = `Place up to ${challenge.max} cells, then press Run.`;
    else if (tool === 'stamp' && stamp) h.textContent = `${stamp.n}: tap to place. R rotates, F flips, Enter drops it in the middle.`;
    else if (tool === 'erase') h.textContent = 'Erasing. Drag across cells.';
    else if (tool === 'pan') h.textContent = 'Moving. Drag to look around, or two-finger scroll.';
    else h.textContent = Curio.touchpad ? 'Touchpad mode: click to start drawing, click again to stop.' : 'Drag to draw. Start on a live cell to erase.';
  }
  function stampCells() {
    const c = stamp.cells;
    let w = 0, h = 0;
    for (const [x, y] of c) { w = Math.max(w, x); h = Math.max(h, y); }
    return c.map(([x, y]) => {
      let px = x - Math.floor(w / 2), py = y - Math.floor(h / 2);
      if (flip) px = -px;
      for (let k = 0; k < rot; k++) [px, py] = [-py, px];
      return [px, py];
    });
  }
  function pushUndo() { undoStack.push({ c: cells.slice(), a: age.slice(), gen, peak }); if (undoStack.length > 40) undoStack.shift(); }
  function placeStamp(gx0, gy0) {
    if (!stamp) return;
    if (challenge) { Curio.toast('Stamps are off during a challenge. Draw by hand!'); return; }
    pushUndo();
    for (const [dx, dy] of stampCells()) {
      const x = wrapX(gx0 + dx), y = wrapY(gy0 + dy);
      if (x < 0 || y < 0) continue;
      const i = y * GW + x; cells[i] = 1; age[i] = 0;
    }
    recount(); hashes.clear(); settledAt = -1;
    sfx.place();
    try { if (!navigator.userActivation || navigator.userActivation.hasBeenActive) navigator.vibrate?.(10); } catch {}
    if (stamp.src) {
      S.seen[stamp.src.n] = 1; S.cats[stamp.src.c] = 1;
      if (stamp.src.rule && stamp.src.rule !== rule.id) setRule(stamp.src.rule, true);
      if (stamp.src.n === 'Replicator' && rule.id === 'B36/S23') award('copy');
      if (Object.keys(S.seen).length >= 10) award('collect');
      if (D.categories.every((c) => S.cats[c.id])) award('curator');
      save();
    }
  }
  function paint(x, y, v) {
    if (x < 0 || y < 0 || x >= GW || y >= GH) return;
    const i = y * GW + x;
    if ((cells[i] === 1) === !!v) return;
    if (v && challenge && countLive() >= challenge.max) { if (!paint.warned) { Curio.toast(`Only ${challenge.max} cells allowed!`); paint.warned = true; } return; }
    cells[i] = v ? 1 : 0; age[i] = 0; if (!v) trail[i] = 140;
    pop += v ? 1 : -1; if (pop > peak) peak = pop;
    if (v) { S.drawn++; if (S.drawn >= 25) award('draw'); }
    hashes.clear(); settledAt = -1;
    dirty = true;
    if (challenge) paintChal();
  }
  function lineCells(x0, y0, x1, y1, v) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let k = 0; k <= n; k++) paint(Math.round(x0 + ((x1 - x0) * k) / n), Math.round(y0 + ((y1 - y0) * k) / n), v);
  }
  const toCell = (px, py) => [Math.floor(cx + px / s), Math.floor(cy + py / s)];

  let mode = null, drawVal = 1, last = null, panStart = null, pinch = null;
  const touches = new Map();
  canvas.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') { touches.set(e.pointerId, [e.clientX, e.clientY]); if (touches.size === 2) { const [a, b] = [...touches.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), m: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] }; mode = 'pinch'; } } });
  addEventListener('pointermove', (e) => {
    if (touches.has(e.pointerId)) touches.set(e.pointerId, [e.clientX, e.clientY]);
    if (mode === 'pinch' && touches.size === 2) {
      const [a, b] = [...touches.values()];
      const r = canvas.getBoundingClientRect();
      const d = Math.hypot(a[0] - b[0], a[1] - b[1]), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      cx -= (m[0] - pinch.m[0]) / s; cy -= (m[1] - pinch.m[1]) / s;
      zoomAt(d / Math.max(1, pinch.d), m[0] - r.left, m[1] - r.top);
      pinch = { d, m };
    }
  });
  const endTouch = (e) => { touches.delete(e.pointerId); if (mode === 'pinch' && touches.size < 2) mode = 'idle'; if (!touches.size && mode === 'idle') mode = null; };
  addEventListener('pointerup', endTouch); addEventListener('pointercancel', endTouch);

  Curio.drag(canvas, {
    start(p) {
      if (mode === 'pinch') return;
      if (tool === 'pan') { mode = 'pan'; panStart = { p: [p.x, p.y], cx, cy }; return; }
      const [gx, gy] = toCell(p.x, p.y);
      if (tool === 'stamp') { hover = [gx, gy]; placeStamp(gx, gy); mode = null; return; }
      pushUndo();
      mode = 'paint';
      drawVal = tool === 'erase' ? 0 : gx >= 0 && gy >= 0 && gx < GW && gy < GH && cells[gy * GW + gx] === 1 ? 0 : 1;
      paint(gx, gy, drawVal); last = [gx, gy];
    },
    move(p) {
      if (mode === 'pinch' || mode === 'idle') return;
      if (mode === 'pan') { cx = panStart.cx - (p.x - panStart.p[0]) / s; cy = panStart.cy - (p.y - panStart.p[1]) / s; clampView(); dirty = true; return; }
      const c = toCell(p.x, p.y);
      if (mode === 'paint') { lineCells(last[0], last[1], c[0], c[1], drawVal); last = c; }
    },
    end() { if (mode !== 'pinch') mode = null; paint.warned = false; }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (tool !== 'stamp' || e.pointerType === 'touch') return;
    const r = canvas.getBoundingClientRect();
    const c = toCell(e.clientX - r.left, e.clientY - r.top);
    if (!hover || hover[0] !== c[0] || hover[1] !== c[1]) { hover = c; dirty = true; }
  });
  canvas.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && tool === 'stamp') { hover = null; dirty = true; } });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const r = canvas.getBoundingClientRect();
    if (e.ctrlKey) zoomAt(Math.exp(-e.deltaY * 0.01), e.clientX - r.left, e.clientY - r.top);
    else if (e.deltaMode === 0 && (Math.abs(e.deltaX) > 0 || Math.abs(e.deltaY) < 50)) { cx += e.deltaX / s; cy += e.deltaY / s; clampView(); dirty = true; }
    else zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
  }, { passive: false });
  $('zin').addEventListener('click', () => zoomAt(1.4, viewW / 2, viewH / 2));
  $('zout').addEventListener('click', () => zoomAt(1 / 1.4, viewW / 2, viewH / 2));
  $('zfit').addEventListener('click', () => { s = fitScale(); clampView(); dirty = true; });

  const playBtn = $('play');
  function setRunning(r) {
    running = r;
    $('play-ico').textContent = r ? '⏸' : '▶'; $('play-txt').textContent = r ? 'Pause' : 'Play';
    playBtn.classList.toggle('on', r);
  }
  playBtn.addEventListener('click', () => { if (challenge && !challenge.done) { runChallenge(); return; } setRunning(!running); });
  $('step').addEventListener('click', () => { setRunning(false); stepLife(); });
  $('back').addEventListener('click', rewind);
  function rewind() {
    setRunning(false);
    const h = history.pop();
    if (!h) { Curio.toast('No more history to rewind.'); return; }
    cells = h.c; age = h.a; next = new Uint8Array(N); gen = h.gen; peak = h.peak;
    popHist.pop(); recount(); hashes.clear(); settledAt = -1; setState('');
    award('rewind');
  }
  function soup(seedFn) {
    pushUndo();
    const rnd = seedFn || Math.random;
    const dens = S.density / 100;
    cells.fill(0); age.fill(0); trail.fill(0);
    if (S.symm) {
      for (let y = 0; y < GH; y++) for (let x = 0; x <= GW / 2; x++) if (rnd() < dens) { const st = 1; cells[y * GW + x] = st; cells[y * GW + (GW - 1 - x)] = st; }
    } else for (let i = 0; i < N; i++) cells[i] = rnd() < dens ? 1 : 0;
    gen = 0; peak = 0; history = []; hashes.clear(); popHist = []; settledAt = -1; setState(''); crowdPeak = 0;
    recount();
  }
  let soupWatch = false, dailyWatch = null;
  $('random').addEventListener('click', () => { soup(); soupWatch = true; Curio.toast(Curio.pick(['Primordial soup served 🍲', 'Fresh soup, extra cells', 'Stirring the pot...'])); });
  $('clear').addEventListener('click', () => { pushUndo(); cells.fill(0); age.fill(0); trail.fill(0); gen = 0; pop = 0; peak = 0; history = []; hashes.clear(); popHist = []; setState(''); setRunning(false); dirty = true; if (challenge) paintChal(); });
  $('undo').addEventListener('click', undo);
  function undo() {
    const u = undoStack.pop();
    if (!u) { Curio.toast('Nothing to undo.'); return; }
    cells = u.c; age = u.a; next = new Uint8Array(N); gen = u.gen; peak = u.peak;
    recount(); hashes.clear(); setState('');
    if (challenge) paintChal();
  }
  const speedEl = $('speed');
  let gps = 10;
  function readSpeed() { const v = +speedEl.value; gps = v >= 100 ? 240 : Math.max(1, Math.round(Math.pow(60, v / 100))); $('speedV').textContent = v >= 100 ? 'max' : `${gps}/s`; }
  speedEl.addEventListener('input', readSpeed); readSpeed();

  function setRule(id, quiet) {
    const r = parseRule(id);
    if (!r) return false;
    rule = r; S.rule = r.id;
    if (!S.rulesTried.includes(r.id)) S.rulesTried.push(r.id);
    if (S.rulesTried.length >= 5) award('rules');
    if (r.C === 2) for (let i = 0; i < N; i++) if (cells[i] > 1) cells[i] = 0;
    save(); palette(); paintRule(); hashes.clear();
    if (!quiet) sfx.tone(520, 0.08, 'triangle', 0.07);
    else Curio.toast(`Rule switched to ${ruleName(r.id)}`);
    if (activeTab === 'rules') renderPanel();
    return true;
  }
  const ruleName = (id) => (D.rules.find((r) => r.id === id) || { n: 'Custom' }).n;
  function paintRule() { $('rulechip').textContent = `${ruleName(rule.id)} · ${rule.id}${S.wrap ? '' : ' · walls'}`; }

  function award(id) {
    if (S.badges[id]) return;
    S.badges[id] = Date.now(); save();
    const b = BADGES.find((x) => x.id === id);
    if (!b) return;
    Curio.toast(`${b.e} Badge: ${b.t}`, 2400);
    sfx.badge();
    $('badge-count').textContent = Object.keys(S.badges).length;
    if (activeTab === 'badges') renderPanel();
  }

  function rle() {
    let x0 = GW, y0 = GH, x1 = -1, y1 = -1;
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (cells[y * GW + x] === 1) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    if (x1 < 0) return null;
    const rows = [];
    for (let y = y0; y <= y1; y++) {
      let row = '', run = 0, cur = null;
      const flush = () => { if (cur && run) row += (run > 1 ? run : '') + cur; };
      for (let x = x0; x <= x1; x++) { const c = cells[y * GW + x] === 1 ? 'o' : 'b'; if (c === cur) run++; else { flush(); cur = c; run = 1; } }
      if (cur === 'o') flush();
      rows.push(row);
    }
    let body = '', blank = 0;
    rows.forEach((r, i) => {
      if (i === 0) { body += r; return; }
      if (!r) { blank++; return; }
      body += (blank + 1 > 1 ? blank + 1 : '') + '$' + r; blank = 0;
    });
    body += '!';
    const wrapped = body.match(/.{1,70}/g).join('\n');
    return `#C Made on Zoble\nx = ${x1 - x0 + 1}, y = ${y1 - y0 + 1}, rule = ${rule.id}\n${wrapped}`;
  }

  let challenge = null;
  const CHALS = [
    { id: 'ten', n: 'Ten Cell Garden', max: 10, d: 'Place up to 10 cells. Score: how many cells are alive at generation 1,000. Walls all round, Conway rules.' },
    { id: 'long', n: 'Long Fuse', max: 7, d: 'Place up to 7 cells. Score: how many generations until it settles or dies (up to 8,000). The acorn manages 5,206.' }
  ];
  function startChallenge(id) {
    const c = CHALS.find((x) => x.id === id);
    setRunning(false);
    pushUndo();
    challenge = { ...c, done: false };
    if (rule.id !== 'B3/S23') setRule('B3/S23', true);
    cells.fill(0); age.fill(0); trail.fill(0); gen = 0; peak = 0; pop = 0; history = []; hashes.clear(); popHist = [];
    setTool('draw'); dirty = true;
    s = Math.max(fitScale(), 14); cx = (GW - viewW / s) / 2; cy = (GH - viewH / s) / 2; clampView();
    paintChal(); paintHint();
    window.scrollTo({ top: stage.getBoundingClientRect().top + scrollY - 70, behavior: reduce ? 'auto' : 'smooth' });
  }
  const countLive = () => { let p = 0; for (let i = 0; i < N; i++) if (cells[i] === 1) p++; return p; };
  function paintChal() {
    const bar = $('chal-bar');
    if (!challenge) { bar.hidden = true; return; }
    bar.hidden = false;
    bar.innerHTML = `<span>${challenge.n}: ${countLive()}/${challenge.max} cells</span><button type="button" class="c-btn" id="chal-run">Run</button><button type="button" class="c-btn c-btn--ghost" id="chal-quit">Quit</button>`;
    $('chal-run').addEventListener('click', runChallenge);
    $('chal-quit').addEventListener('click', () => { challenge = null; paintChal(); paintHint(); });
  }
  async function runChallenge() {
    if (!challenge || challenge.running) return;
    const live = [];
    for (let i = 0; i < N; i++) if (cells[i] === 1) live.push([i % GW, Math.floor(i / GW)]);
    if (!live.length) { Curio.toast('Place some cells first!'); return; }
    challenge.running = true;
    const AW = 320, AH = 320, A = new Uint8Array(AW * AH), B2 = new Uint8Array(AW * AH);
    let mx = Infinity, my = Infinity, Mx = -1, My = -1;
    for (const [x, y] of live) { mx = Math.min(mx, x); my = Math.min(my, y); Mx = Math.max(Mx, x); My = Math.max(My, y); }
    const ox = Math.floor(AW / 2 - (Mx - mx) / 2) - mx, oy = Math.floor(AH / 2 - (My - my) / 2) - my;
    for (const [x, y] of live) { const X = x + ox, Y = y + oy; if (X > 0 && Y > 0 && X < AW - 1 && Y < AH - 1) A[Y * AW + X] = 1; }
    let cur = A, nxt = B2, g = 0, score = 0, p = 0;
    let bx0 = AW, by0 = AH, bx1 = 0, by1 = 0;
    for (let i = 0; i < cur.length; i++) if (cur[i]) { const x = i % AW, y = (i / AW) | 0; bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); by0 = Math.min(by0, y); by1 = Math.max(by1, y); }
    let px0 = bx0, py0 = by0, px1 = bx1, py1 = by1;
    const seen = new Map();
    const limit = challenge.id === 'ten' ? 1000 : 8000;
    const bar = $('chal-bar');
    while (g < limit) {
      const t0 = performance.now();
      while (g < limit && performance.now() - t0 < 30) {
        p = 0;
        const rx0 = Math.max(1, Math.min(bx0 - 1, px0)), rx1 = Math.min(AW - 2, Math.max(bx1 + 1, px1));
        const ry0 = Math.max(1, Math.min(by0 - 1, py0)), ry1 = Math.min(AH - 2, Math.max(by1 + 1, py1));
        px0 = bx0; py0 = by0; px1 = bx1; py1 = by1;
        let nx0 = AW, ny0 = AH, nx1 = 0, ny1 = 0;
        let h = 2166136261;
        for (let y = ry0; y <= ry1; y++) for (let x = rx0; x <= rx1; x++) {
          const i = y * AW + x;
          const n = cur[i - AW - 1] + cur[i - AW] + cur[i - AW + 1] + cur[i - 1] + cur[i + 1] + cur[i + AW - 1] + cur[i + AW] + cur[i + AW + 1];
          const v = n === 3 || (cur[i] && n === 2) ? 1 : 0;
          nxt[i] = v;
          if (v) { p++; h ^= i; h = Math.imul(h, 16777619); if (x < nx0) nx0 = x; if (x > nx1) nx1 = x; if (y < ny0) ny0 = y; if (y > ny1) ny1 = y; }
        }
        bx0 = nx0; by0 = ny0; bx1 = nx1; by1 = ny1;
        const t = cur; cur = nxt; nxt = t; g++;
        if (challenge.id === 'long') {
          if (!p) { score = g; g = limit; break; }
          const prev = seen.get(h >>> 0);
          if (prev != null) { score = prev; g = limit; break; }
          seen.set(h >>> 0, g);
          if (seen.size > 200) { const cut = g - 150; for (const [kk, gg] of seen) if (gg < cut) seen.delete(kk); }
        }
      }
      bar.firstChild.textContent = `Simulating... ${Math.min(100, Math.round((g / limit) * 100))}%`;
      await new Promise((r) => setTimeout(r, 0));
      if (!challenge) return;
    }
    if (challenge.id === 'ten') score = p;
    if (challenge.id === 'long' && !score) score = limit;
    const key = challenge.id;
    const isBest = score > (S.best[key] || 0);
    S.best[key] = Math.max(S.best[key] || 0, score);
    save();
    if (key === 'ten' && score >= 100) award('ten');
    if (key === 'long' && score >= 500) award('long500');
    if (key === 'long' && score >= 2000) award('long2k');
    if (isBest) Curio.confetti();
    sfx.place();
    const c = challenge;
    challenge = null; paintChal(); paintHint();
    S.wrap = false; paintRule(); gen = 0; peak = pop; history = []; hashes.clear(); popHist = [];
    setRunning(true);
    await Curio.modal({ emoji: isBest ? '🏆' : '🌱', title: `${c.n}: ${Curio.fmt(score)}`, body: `${key === 'ten' ? `${Curio.fmt(score)} cells alive at generation 1,000.` : `It ran for ${Curio.fmt(score)} generations before settling.`} Best: ${Curio.fmt(S.best[key])}. Walls are on so you can watch it play out.`, buttons: [{ label: 'Nice', value: 'ok' }] });
    if (activeTab === 'chal') renderPanel();
  }

  let activeTab = 'tools', libCat = 'osc', libSel = null;
  const panel = $('panel');
  document.querySelectorAll('.tabs [data-tab]').forEach((b) => b.addEventListener('click', () => { activeTab = b.dataset.tab; renderPanel(); }));
  function chipRow(items, current, onPick, lbl) {
    const row = document.createElement('div'); row.className = 'row';
    if (lbl) { const l = document.createElement('span'); l.className = 'lbl'; l.textContent = lbl; row.append(l); }
    items.forEach((it) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.innerHTML = it.n;
      b.setAttribute('aria-pressed', String(it.id === current));
      b.addEventListener('click', () => onPick(it.id));
      row.append(b);
    });
    return row;
  }
  function mini(cv, cellsList) {
    const w = cv.width = 112, h = cv.height = 84;
    const c = cv.getContext('2d');
    let mx = 0, my = 0; for (const [x, y] of cellsList) { mx = Math.max(mx, x); my = Math.max(my, y); }
    const sc = Math.max(1, Math.min(14, Math.floor(Math.min((w - 8) / (mx + 1), (h - 8) / (my + 1)))));
    const ox = (w - (mx + 1) * sc) / 2, oy = (h - (my + 1) * sc) / 2;
    c.fillStyle = '#14121c'; c.fillRect(0, 0, w, h);
    c.fillStyle = LUTcss[3] || '#ffb74d';
    for (const [x, y] of cellsList) c.fillRect(ox + x * sc, oy + y * sc, Math.max(1, sc - (sc > 3 ? 1 : 0)), Math.max(1, sc - (sc > 3 ? 1 : 0)));
  }
  function renderPanel() {
    document.querySelectorAll('.tabs [data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === activeTab)));
    panel.replaceChildren();
    if (activeTab === 'tools') {
      panel.append(chipRow([{ id: 'draw', n: '✏️ Draw <span class="k">1</span>' }, { id: 'erase', n: '🩹 Erase <span class="k">2</span>' }, { id: 'pan', n: '✋ Move <span class="k">3</span>' }, { id: 'stamp', n: `🧩 Stamp${stamp ? `: ${stamp.n}` : ''} <span class="k">4</span>` }], tool, (t) => { if (t === 'stamp' && !stamp) { activeTab = 'library'; renderPanel(); Curio.toast('Pick a pattern to stamp'); return; } setTool(t); }, 'Tool'));
      const r2 = document.createElement('div'); r2.className = 'row';
      r2.innerHTML = `<span class="lbl">Stamp</span><button type="button" class="chip" id="t-rot">⟳ Rotate <span class="k">R</span></button><button type="button" class="chip" id="t-flip">⇋ Flip <span class="k">F</span></button><button type="button" class="chip" id="t-mid">⊕ Drop in middle <span class="k">Enter</span></button>`;
      panel.append(r2);
      r2.querySelector('#t-rot').addEventListener('click', () => { rot = (rot + 1) % 4; dirty = true; });
      r2.querySelector('#t-flip').addEventListener('click', () => { flip = !flip; dirty = true; });
      r2.querySelector('#t-mid').addEventListener('click', dropMiddle);
      const r3 = document.createElement('div'); r3.className = 'row';
      r3.innerHTML = `<span class="lbl">Soup</span><label class="range">Density <input type="range" min="5" max="60" value="${S.density}" id="t-dens"> <b id="t-densv">${S.density}%</b></label><label class="tog"><input type="checkbox" id="t-symm" ${S.symm ? 'checked' : ''}> Mirror symmetric</label><button type="button" class="chip" id="t-daily">📅 Daily soup</button>`;
      panel.append(r3);
      r3.querySelector('#t-dens').addEventListener('input', (e) => { S.density = +e.target.value; r3.querySelector('#t-densv').textContent = `${S.density}%`; save(); });
      r3.querySelector('#t-symm').addEventListener('change', (e) => { S.symm = e.target.checked; save(); });
      r3.querySelector('#t-daily').addEventListener('click', dailySoup);
      const r4 = document.createElement('div'); r4.className = 'row';
      r4.innerHTML = `<span class="lbl">World</span><label class="tog"><input type="checkbox" id="t-wrap" ${S.wrap ? 'checked' : ''}> Wrap around edges</label>`;
      panel.append(r4);
      r4.querySelector('#t-wrap').addEventListener('change', (e) => { S.wrap = e.target.checked; save(); paintRule(); hashes.clear(); dirty = true; });
      panel.append(chipRow(SIZES, S.size, (id) => { S.size = id; save(); makeGrid(true); resize(true); renderPanel(); }, 'Grid size'));
      const p = document.createElement('p'); p.className = 'small';
      p.textContent = Curio.touchpad ? 'Touchpad mode is on: click once to start drawing or moving, click again to stop.' : 'Tip: on a laptop touchpad, turn on Touchpad mode in the top bar so you can draw without holding the button.';
      panel.append(p);
    } else if (activeTab === 'library') {
      const cats = document.createElement('div'); cats.className = 'cats';
      D.categories.forEach((c) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'chip';
        b.textContent = `${c.e} ${c.name}`; b.setAttribute('aria-pressed', String(c.id === libCat));
        b.addEventListener('click', () => { libCat = c.id; renderPanel(); });
        cats.append(b);
      });
      panel.append(cats);
      const lib = document.createElement('div'); lib.className = 'lib';
      D.patterns.filter((p) => p.c === libCat).forEach((p) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'pat';
        b.setAttribute('aria-pressed', String(!!(stamp && stamp.src === p && tool === 'stamp')));
        const cv = document.createElement('canvas'); cv.setAttribute('aria-hidden', 'true');
        const cl = patternCells(p);
        mini(cv, cl);
        const t = document.createElement('span');
        t.innerHTML = `<b></b><small>${p.p ? `period ${p.p}` : p.rule ? p.rule : `${cl.length} cells`} ${S.seen[p.n] ? '<span class="seen">✓</span>' : ''}</small>`;
        t.querySelector('b').textContent = p.n;
        b.append(cv, t);
        b.addEventListener('click', () => { stamp = { n: p.n, cells: cl, src: p }; libSel = p; rot = 0; flip = false; setTool('stamp'); renderPanel(); sfx.tone(780, 0.05, 'triangle', 0.06); });
        lib.append(b);
      });
      panel.append(lib);
      const det = document.createElement('div'); det.className = 'detail';
      if (libSel && libSel.c === libCat) { det.innerHTML = '<b></b> <span></span> <button type="button" class="chip" style="margin-left:6px">⊕ Drop in middle</button>'; det.querySelector('b').textContent = libSel.n; det.querySelector('span').textContent = libSel.d; det.querySelector('button').addEventListener('click', dropMiddle); }
      else det.textContent = `${D.patterns.length} patterns, all checked by simulation. Pick one, then tap the grid to place it.`;
      panel.append(det);
    } else if (activeTab === 'rules') {
      const wrap = document.createElement('div'); wrap.className = 'rules';
      D.rules.forEach((r) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'rule';
        b.setAttribute('aria-pressed', String(r.id === rule.id));
        b.innerHTML = '<b></b><code></code><small></small>';
        b.querySelector('b').textContent = r.n; b.querySelector('code').textContent = r.id; b.querySelector('small').textContent = r.d;
        b.addEventListener('click', () => setRule(r.id));
        wrap.append(b);
      });
      panel.append(wrap);
      const cu = document.createElement('div'); cu.className = 'custom';
      cu.innerHTML = `<span class="lbl">Custom rule</span><input class="c-input" id="r-custom" placeholder="B36/S23 or B2/S345/4" value="${rule.id}" aria-label="Custom rule"><button type="button" class="c-btn c-btn--ghost" id="r-apply">Apply</button>`;
      panel.append(cu);
      const apply = () => { if (!setRule($('r-custom').value)) Curio.toast('Use the form B3/S23, optionally /C for extra states.'); };
      cu.querySelector('#r-apply').addEventListener('click', apply);
      cu.querySelector('#r-custom').addEventListener('keydown', (e) => { if (e.key === 'Enter') apply(); });
      const p = document.createElement('p'); p.className = 'small'; p.style.marginTop = '8px';
      p.textContent = 'B is the neighbour counts that bring a dead cell to life, S the counts that let a live cell survive. A third number adds fading states, as in Brian’s Brain.';
      panel.append(p);
    } else if (activeTab === 'look') {
      const th = document.createElement('div'); th.className = 'themes';
      THEMES.forEach((t) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'theme';
        b.setAttribute('aria-pressed', String(t.id === S.theme));
        const cv = document.createElement('canvas'); cv.width = 110; cv.height = 34;
        const c = cv.getContext('2d');
        c.fillStyle = `rgb(${t.bg || (isDark() ? [18, 16, 22] : [252, 249, 243])})`; c.fillRect(0, 0, 110, 34);
        for (let k = 0; k < 12; k++) { c.fillStyle = `rgb(${t.f(k / 11, k * 20)})`; c.fillRect(6 + k * 8.4, 10 + (k % 2) * 6, 7, 7); }
        b.append(cv, document.createTextNode(t.n));
        b.addEventListener('click', () => { S.theme = t.id; if (!S.themesTried.includes(t.id)) S.themesTried.push(t.id); if (S.themesTried.length >= 4) award('theme'); save(); palette(); renderPanel(); });
        th.append(b);
      });
      panel.append(th);
      const r = document.createElement('div'); r.className = 'row';
      r.innerHTML = `<label class="tog"><input type="checkbox" id="l-trails" ${S.trails ? 'checked' : ''}> Ghost trails</label><label class="tog"><input type="checkbox" id="l-glow" ${S.glow ? 'checked' : ''}> Glow</label>`;
      panel.append(r);
      r.querySelector('#l-trails').addEventListener('change', (e) => { S.trails = e.target.checked; save(); dirty = true; });
      r.querySelector('#l-glow').addEventListener('change', (e) => { S.glow = e.target.checked; save(); dirty = true; });
      const p = document.createElement('p'); p.className = 'small'; p.textContent = 'Colour shows age: newborn cells are bright, old-timers fade into deeper shades. Zoom in close to see cells as rounded tiles.';
      panel.append(p);
    } else if (activeTab === 'io') {
      panel.innerHTML = `<p class="small" style="margin-bottom:8px">Paste a pattern in RLE or plaintext (.cells) format, from LifeWiki or anywhere else. Large patterns are fine up to your grid size.</p>
        <textarea class="rle" id="io-text" spellcheck="false" placeholder="x = 3, y = 3, rule = B3/S23&#10;bo$2bo$3o!"></textarea>
        <p class="err" id="io-err"></p>
        <div class="row"><button type="button" class="c-btn" id="io-load">Load as stamp</button><button type="button" class="c-btn c-btn--ghost" id="io-mid">Drop in middle</button><button type="button" class="c-btn c-btn--ghost" id="io-export">Copy my grid as RLE</button></div>`;
      const read = () => {
        const p = parseRLE($('io-text').value);
        if (!p) { $('io-err').textContent = 'Could not read that. Check it is RLE (like bo$2bo$3o!) or plaintext with . and O.'; return null; }
        if (p.w > GW || p.h > GH) { $('io-err').textContent = `That is ${p.w} by ${p.h}, bigger than the grid (${GW} by ${GH}). Try a larger grid size.`; return null; }
        $('io-err').textContent = '';
        if (p.rule && parseRule(p.rule) && parseRule(p.rule).id !== rule.id) setRule(p.rule, true);
        stamp = { n: 'Pasted pattern', cells: p.cells }; rot = 0; flip = false;
        award('import');
        return p;
      };
      $('io-load').addEventListener('click', () => { if (read()) { setTool('stamp'); Curio.toast('Loaded. Tap the grid to place it.'); } });
      $('io-mid').addEventListener('click', () => { if (read()) { setTool('stamp'); dropMiddle(); } });
      $('io-export').addEventListener('click', async () => {
        const t = rle();
        if (!t) { Curio.toast('The grid is empty.'); return; }
        $('io-text').value = t;
        try { await navigator.clipboard.writeText(t); Curio.toast('RLE copied to clipboard.'); } catch { $('io-text').select(); Curio.toast('Select and copy the text above.'); }
        award('export');
      });
    } else if (activeTab === 'chal') {
      const w = document.createElement('div'); w.className = 'chals';
      CHALS.forEach((c) => {
        const d = document.createElement('div'); d.className = 'chal';
        d.innerHTML = `<b>${c.n}</b><p>${c.d}</p><span class="best">Best: ${Curio.fmt(S.best[c.id] || 0)}</span><button type="button" class="c-btn">Start</button>`;
        d.querySelector('button').addEventListener('click', () => startChallenge(c.id));
        w.append(d);
      });
      const dd = document.createElement('div'); dd.className = 'chal';
      const k = todayKey();
      dd.innerHTML = `<b>📅 Daily soup</b><p>The same seeded soup for everyone today. Press play and see how long it takes to settle.</p><span class="best">${S.daily[k] != null ? `Settled at generation ${Curio.fmt(S.daily[k])}` : 'Not watched yet today'}</span><button type="button" class="c-btn">Serve it</button>`;
      dd.querySelector('button').addEventListener('click', dailySoup);
      w.append(dd);
      panel.append(w);
    } else if (activeTab === 'badges') {
      const w = document.createElement('div'); w.className = 'badges';
      w.innerHTML = BADGES.map((b) => `<div class="badge ${S.badges[b.id] ? 'got' : 'locked'}"><span class="e">${b.e}</span><b>${b.t}</b><small>${b.d}</small></div>`).join('');
      panel.append(w);
    }
  }
  function dropMiddle() {
    if (!stamp) { Curio.toast('Pick a pattern first'); return; }
    const gx0 = Math.floor(cx + viewW / s / 2), gy0 = Math.floor(cy + viewH / s / 2);
    placeStamp(Math.max(0, Math.min(GW - 1, gx0)), Math.max(0, Math.min(GH - 1, gy0)));
  }
  const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  function dailySoup() {
    const k = todayKey();
    let a = 0; for (const ch of k) a = Math.imul(a ^ ch.charCodeAt(0), 2654435761) >>> 0;
    const rnd = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    if (rule.id !== 'B3/S23') setRule('B3/S23', true);
    pushUndo();
    cells.fill(0); age.fill(0); trail.fill(0);
    const R = 40, x0 = Math.floor(GW / 2 - R / 2), y0 = Math.floor(GH / 2 - R / 2);
    for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) if (rnd() < 0.35) cells[(y0 + y) * GW + x0 + x] = 1;
    gen = 0; peak = 0; history = []; hashes.clear(); popHist = []; settledAt = -1; setState(''); recount();
    dailyWatch = k; soupWatch = true;
    s = Math.max(fitScale(), 4); cx = (GW - viewW / s) / 2; cy = (GH - viewH / s) / 2; clampView();
    setRunning(true);
    Curio.toast(`Today's soup (${k}). Let's see how long it bubbles.`);
  }

  addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input, textarea')) return;
    if (document.querySelector('.curio-modal')) return;
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); undo(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === ' ') { e.preventDefault(); if (!e.repeat) playBtn.click(); }
    else if (k === 'n') { setRunning(false); stepLife(); }
    else if (k === 'b') rewind();
    else if (k === 'r') { rot = (rot + 1) % 4; dirty = true; }
    else if (k === 'f') { flip = !flip; dirty = true; }
    else if (k === '1') setTool('draw');
    else if (k === '2') setTool('erase');
    else if (k === '3') setTool('pan');
    else if (k === '4') { if (stamp) setTool('stamp'); else { activeTab = 'library'; renderPanel(); } }
    else if (e.key === 'Enter' && tool === 'stamp' && !e.target.closest('button')) { e.preventDefault(); dropMiddle(); }
    else if (e.key === 'Escape') setTool('draw');
    else if (e.key === '+' || e.key === '=') zoomAt(1.4, viewW / 2, viewH / 2);
    else if (e.key === '-') zoomAt(1 / 1.4, viewW / 2, viewH / 2);
    else if (e.key.startsWith('Arrow')) {
      e.preventDefault();
      const d = 40 / s;
      if (e.key === 'ArrowLeft') cx -= d; if (e.key === 'ArrowRight') cx += d; if (e.key === 'ArrowUp') cy -= d; if (e.key === 'ArrowDown') cy += d;
      clampView(); dirty = true;
    }
  });

  let raf = 0, lastT = 0, acc = 0, blipT = 0;
  function frame(t) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(250, t - (lastT || t)); lastT = t;
    if (running) {
      acc += dt;
      const per = 1000 / gps;
      let n = 0;
      const cap = gps >= 240 ? 8 : 4;
      while (acc >= per && n < cap) { stepLife(); acc -= per; n++; }
      if (n === cap) acc = 0;
      if (n && t - blipT > 220 && gps <= 30) { sfx.blip(pop); blipT = t; }
    }
    if (dirty) draw();
  }
  const start = () => { if (!raf) { lastT = 0; raf = requestAnimationFrame(frame); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  addEventListener('curio:theme', () => { palette(); if (activeTab === 'look' || activeTab === 'library') renderPanel(); });
  addEventListener('curio:touchpad', () => { paintHint(); if (activeTab === 'tools') renderPanel(); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => palette());
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => resize(false), 80); });

  makeGrid(false); palette(); resize(true);
  const gun = D.patterns.find((p) => p.n === 'Gosper glider gun');
  stamp = { n: gun.n, cells: patternCells(gun) };
  placeStamp(Math.floor(GW / 2) - 6, Math.floor(GH / 2) - 6);
  for (const [n, fx, fy] of [['Acorn', 0.78, 0.72], ['Pulsar', 0.2, 0.28], ['LWSS', 0.15, 0.8]]) { stamp = { n, cells: patternCells(D.patterns.find((p) => p.n === n)) }; placeStamp(Math.floor(GW * fx), Math.floor(GH * fy)); }
  stamp = null; undoStack = []; peak = pop; gen = 0;
  if (!S.rulesTried.includes(rule.id)) { S.rulesTried.push(rule.id); save(); }
  paintRule(); setTool('draw'); renderPanel();
  $('badge-count').textContent = Object.keys(S.badges).length;
  if (!S.tipShown) { setTimeout(() => Curio.toast('Tip: on a touchpad, turn on Touchpad mode in the top bar', 3600), 1200); S.tipShown = true; save(); }
  setRunning(!reduce);
  start();
  window.__life = { get gen() { return gen; }, get pop() { return pop; }, step: stepLife, setRule, parseRLE, rle, get rule() { return rule.id; }, startChallenge, runChallenge, paint, get N() { return N; }, S };
})();
