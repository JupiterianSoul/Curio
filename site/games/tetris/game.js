'use strict';
(() => {
  const D = window.BLOCKS_DATA;
  const COLS = 10, ROWS = 22, HID = 2, CS = 24;
  const FX = 92, FY = 12, FW = COLS * CS, FH = (ROWS - HID) * CS, W = FX * 2 + FW, H = FH + FY * 2;
  const FONT = 'ui-rounded, "SF Pro Rounded", "Nunito", "Segoe UI", system-ui, sans-serif';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const SAVE_KEY = 'tetris:save', VER = 2;
  const TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  const SHAPES = { I: ['....', 'IIII', '....', '....'], O: ['OO', 'OO'], T: ['.T.', 'TTT', '...'], S: ['.SS', 'SS.', '...'], Z: ['ZZ.', '.ZZ', '...'], J: ['J..', 'JJJ', '...'], L: ['..L', 'LLL', '...'] };
  const ROT = {};
  for (const [t, rows] of Object.entries(SHAPES)) {
    let m = rows.map((r) => [...r].map((c) => c !== '.'));
    ROT[t] = [];
    for (let r = 0; r < 4; r++) {
      const cells = [];
      m.forEach((row, y) => row.forEach((on, x) => on && cells.push([x, y])));
      ROT[t].push(cells);
      const n = m.length;
      m = m.map((row, y) => row.map((_, x) => m[n - 1 - x][y]));
    }
  }
  const K = (s) => s.split(' ').map((p) => p.split(',').map(Number));
  const KICKS = {
    '0>1': K('0,0 -1,0 -1,1 0,-2 -1,-2'), '1>0': K('0,0 1,0 1,-1 0,2 1,2'), '1>2': K('0,0 1,0 1,-1 0,2 1,2'), '2>1': K('0,0 -1,0 -1,1 0,-2 -1,-2'),
    '2>3': K('0,0 1,0 1,1 0,-2 1,-2'), '3>2': K('0,0 -1,0 -1,-1 0,2 -1,2'), '3>0': K('0,0 -1,0 -1,-1 0,2 -1,2'), '0>3': K('0,0 1,0 1,1 0,-2 1,-2')
  };
  const KICKS_I = {
    '0>1': K('0,0 -2,0 1,0 -2,-1 1,2'), '1>0': K('0,0 2,0 -1,0 2,1 -1,-2'), '1>2': K('0,0 -1,0 2,0 -1,2 2,-1'), '2>1': K('0,0 1,0 -2,0 1,-2 -2,1'),
    '2>3': K('0,0 2,0 -1,0 2,1 -1,-2'), '3>2': K('0,0 -2,0 1,0 -2,-1 1,2'), '3>0': K('0,0 1,0 -2,0 1,-2 -2,1'), '0>3': K('0,0 -1,0 2,0 -1,2 2,-1')
  };
  const KICKS_180 = K('0,0 0,1 1,0 -1,0 0,-1 1,1 -1,1');
  const LINE_PTS = [0, 100, 300, 500, 800], TSPIN_PTS = [400, 800, 1200, 1600], MINI_PTS = [100, 200, 400];
  const PC_PTS = [0, 800, 1200, 1800, 2000];
  const LOCK = 0.5, MAX_RESETS = 15;
  const MODE_ORDER = ['marathon', 'sprint', 'ultra', 'dig', 'daily', 'zen'];

  const canvas = $('#board'), ctx = canvas.getContext('2d'), stage = $('.bk-stage');
  const ovs = { menu: $('#ov-menu'), skins: $('#ov-skins'), settings: $('#ov-settings'), badges: $('#ov-badges'), help: $('#ov-help'), pause: $('#ov-pause'), over: $('#ov-over') };

  function defaults() {
    return {
      v: VER, mode: 'marathon', skin: 'gem', startLevel: 1,
      settings: { das: 150, arr: 40, sdf: 20, ghost: true, grid: true, music: true, haptics: true, shake: true },
      stats: { games: 0, lines: 0, tetrises: 0, tspins: 0, pcs: 0, pieces: 0, time: 0, maxCombo: 0, sprints: 0, days: 0 },
      badges: {}, daily: {}, history: []
    };
  }
  function load() {
    const d = defaults();
    let s = null;
    try { s = Curio.store.get(SAVE_KEY, null); } catch { s = null; }
    if (!s || typeof s !== 'object') { const sl = Curio.store.get('tetris:start', 1); if ([1, 5, 10].includes(sl)) d.startLevel = sl; return d; }
    if (typeof s.mode === 'string' && D.MODES[s.mode]) d.mode = s.mode;
    if (typeof s.skin === 'string' && D.SKINS.some((k) => k.id === s.skin)) d.skin = s.skin;
    if ([1, 5, 10].includes(s.startLevel)) d.startLevel = s.startLevel;
    for (const k of ['settings', 'stats']) if (s[k] && typeof s[k] === 'object') for (const j in d[k]) if (typeof s[k][j] === typeof d[k][j]) d[k][j] = s[k][j];
    for (const k of ['badges', 'daily']) if (s[k] && typeof s[k] === 'object' && !Array.isArray(s[k])) d[k] = s[k];
    if (Array.isArray(s.history)) d.history = s.history.filter((h) => h && typeof h === 'object').slice(0, 12);
    d.settings.das = Math.max(50, Math.min(300, d.settings.das)); d.settings.arr = Math.max(0, Math.min(100, d.settings.arr));
    return d;
  }
  const save = load();
  const advKeep = { mode: save.mode, skin: save.skin, startLevel: save.startLevel };
  if (Curio.simple) Object.assign(save, { mode: 'marathon', skin: 'gem', startLevel: 1 });
  const persist = () => Curio.store.set(SAVE_KEY, Curio.simple ? { ...save, ...advKeep } : save);

  function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function mulberry(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const mixHex = (a, b, t) => { const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16); const c = (s) => Math.round(((x >> s) & 255) * (1 - t) + ((y >> s) & 255) * t); return '#' + ((1 << 24) + (c(16) << 16) + (c(8) << 8) + c(0)).toString(16).slice(1); };
  const shade = (hex, amt) => mixHex(hex, amt < 0 ? '#000000' : '#ffffff', Math.abs(amt));
  function rrect(g, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  const fmtTime = (t, ms = true) => { const m = Math.floor(t / 60), s = t - m * 60; return ms ? `${m}:${s.toFixed(2).padStart(5, '0')}` : `${m}:${String(Math.floor(s)).padStart(2, '0')}`; };
  const vib = (p) => { if (save.settings.haptics && navigator.vibrate) try { navigator.vibrate(p); } catch {} };

  const audio = {
    tone(f, d = 0.08, type = 'sine', vol = 0.1, to = 0, delay = 0) {
      if (Curio.muted) return;
      const ac = Curio.audioContext(); if (!ac) return;
      const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + d);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d + 0.03);
    },
    noise(d = 0.2, vol = 0.1, freq = 1200) {
      if (Curio.muted) return;
      const ac = Curio.audioContext(); if (!ac) return;
      if (!this.buf) { this.buf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const ch = this.buf.getChannelData(0); for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1; }
      const t = ac.currentTime, s = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter();
      s.buffer = this.buf; f.type = 'lowpass'; f.frequency.setValueAtTime(freq, t); f.frequency.exponentialRampToValueAtTime(60, t + d);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      s.connect(f).connect(g).connect(ac.destination); s.start(t); s.stop(t + d + 0.02);
    },
    move() { this.tone(330, 0.03, 'square', 0.025); },
    rotate() { this.tone(620, 0.035, 'triangle', 0.06); },
    hold() { this.tone(740, 0.05, 'triangle', 0.06); this.tone(988, 0.05, 'triangle', 0.05, 0, 0.04); },
    land() { this.tone(160, 0.07, 'triangle', 0.09); },
    hard() { this.tone(240, 0.12, 'square', 0.06, 70); this.noise(0.1, 0.1, 700); },
    clear(n, combo) { const base = [523, 587, 659, 698, 784, 880, 988, 1047][Math.min(7, Math.max(0, combo))]; for (let i = 0; i < n; i++) this.tone(base * [1, 1.25, 1.5, 2][i], 0.14, 'triangle', 0.1, 0, i * 0.05); },
    tetris() { [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.12, 'square', 0.05, 0, i * 0.05)); this.noise(0.4, 0.08, 3000); },
    tspin() { [880, 1175, 1568, 2093].forEach((f, i) => this.tone(f, 0.1, 'sine', 0.08, 0, i * 0.04)); },
    level() { [392, 523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.14, 'triangle', 0.1, 0, i * 0.08)); },
    over() { this.tone(440, 0.9, 'sawtooth', 0.07, 60); },
    win() { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.16, 'triangle', 0.11, 0, i * 0.1)); },
    tick() { this.tone(1100, 0.04, 'square', 0.04); },
    go() { this.tone(880, 0.2, 'triangle', 0.1); this.tone(1320, 0.2, 'triangle', 0.06, 0, 0.05); }
  };

  const music = {
    on: false, next: 0, i: 0, bi: 0, bnext: 0,
    freq(n) { const m = /^([A-G])(#?)(\d)$/.exec(n); const idx = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 }[m[1]] + (m[2] ? 1 : 0) + (Number(m[3]) - 4) * 12; return 440 * Math.pow(2, idx / 12); },
    start() { const ac = Curio.audioContext(); if (!ac) return; this.on = true; this.next = this.bnext = ac.currentTime + 0.1; this.i = this.bi = 0; },
    stop() { this.on = false; },
    pump(level) {
      if (!this.on || Curio.muted || !save.settings.music) return;
      const ac = Curio.audioContext(); if (!ac) return;
      const eighth = 60 / (128 + Math.min(14, level) * 5) / 2;
      if (this.next < ac.currentTime - 0.5) this.next = this.bnext = ac.currentTime + 0.05;
      while (this.next < ac.currentTime + 0.25) {
        const [n, len] = D.MUSIC[this.i % D.MUSIC.length];
        if (n) this.note(ac, this.freq(n), this.next, eighth * len * 0.9, 'square', 0.028);
        this.next += eighth * len; this.i++;
      }
      while (this.bnext < ac.currentTime + 0.25) {
        const n = D.BASS[this.bi % D.BASS.length];
        this.note(ac, this.freq(n), this.bnext, eighth * 0.9, 'triangle', 0.05);
        this.bnext += eighth; this.bi++;
      }
    },
    note(ac, f, t, d, type, vol) {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.setValueAtTime(vol, t + d * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d + 0.02);
    }
  };

  const fx = {
    list: [],
    burst(x, y, n, colors, { speed = 160, life = 0.7, size = 4, gravity = 400, spread = Math.PI * 2, angle = 0, vx = 0 } = {}) {
      for (let i = 0; i < n && this.list.length < 900; i++) {
        const a = angle + (Math.random() - 0.5) * spread, s = speed * (0.3 + Math.random() * 0.7);
        this.list.push({ x, y, vx: Math.cos(a) * s + vx, vy: Math.sin(a) * s, life: life * (0.6 + Math.random() * 0.4), max: life, size: size * (0.5 + Math.random() * 0.8), c: colors[(Math.random() * colors.length) | 0], g: gravity, r: Math.random() * 6, vr: (Math.random() - 0.5) * 14 });
      }
    },
    update(dt) {
      const L = this.list;
      for (let i = L.length - 1; i >= 0; i--) {
        const p = L[i]; p.life -= dt;
        if (p.life <= 0) { L[i] = L[L.length - 1]; L.pop(); continue; }
        const k = Math.exp(-1.2 * dt); p.vx *= k; p.vy = p.vy * k + p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
      }
    },
    draw(g) {
      for (const p of this.list) {
        g.globalAlpha = Math.max(0, Math.min(1, p.life / p.max * 1.6));
        g.fillStyle = p.c; g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7); g.restore();
      }
      g.globalAlpha = 1;
    }
  };

  let scaleK = 1, sprites = new Map();
  const colorOf = (t, skin) => (skin === 'pastel' ? D.PASTEL[t] : D.COLORS[t]);
  function paintCell(g, s, t, skin) {
    const c = colorOf(t, skin);
    const r = s * 0.14;
    g.save();
    if (skin === 'gem') {
      rrect(g, 0, 0, s, s, r); g.fillStyle = c; g.fill(); g.clip();
      const b = s * 0.16;
      g.fillStyle = shade(c, 0.4); g.beginPath(); g.moveTo(0, 0); g.lineTo(s, 0); g.lineTo(s - b, b); g.lineTo(b, b); g.lineTo(b, s - b); g.lineTo(0, s); g.closePath(); g.fill();
      g.fillStyle = shade(c, -0.32); g.beginPath(); g.moveTo(s, s); g.lineTo(0, s); g.lineTo(b, s - b); g.lineTo(s - b, s - b); g.lineTo(s - b, b); g.lineTo(s, 0); g.closePath(); g.fill();
      const gr = g.createLinearGradient(0, b, 0, s - b); gr.addColorStop(0, shade(c, 0.18)); gr.addColorStop(1, shade(c, -0.08));
      g.fillStyle = gr; g.fillRect(b, b, s - 2 * b, s - 2 * b);
      g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.ellipse(s * 0.32, s * 0.3, s * 0.09, s * 0.05, -0.6, 0, 7); g.fill();
    } else if (skin === 'flat') {
      rrect(g, s * 0.04, s * 0.04, s * 0.92, s * 0.92, r); g.fillStyle = c; g.fill();
      g.fillStyle = 'rgba(255,255,255,.22)'; rrect(g, s * 0.12, s * 0.1, s * 0.76, s * 0.18, s * 0.08); g.fill();
    } else if (skin === 'retro') {
      g.fillStyle = shade(c, -0.55); g.fillRect(0, 0, s, s);
      g.fillStyle = c; g.fillRect(s * 0.07, s * 0.07, s * 0.86, s * 0.86);
      g.fillStyle = shade(c, 0.5); g.fillRect(s * 0.28, s * 0.28, s * 0.44, s * 0.44);
      g.fillStyle = '#ffffff'; g.fillRect(s * 0.12, s * 0.12, s * 0.12, s * 0.12);
    } else if (skin === 'jelly') {
      rrect(g, s * 0.03, s * 0.03, s * 0.94, s * 0.94, s * 0.32);
      const gr = g.createRadialGradient(s * 0.4, s * 0.35, s * 0.05, s * 0.5, s * 0.5, s * 0.7); gr.addColorStop(0, shade(c, 0.45)); gr.addColorStop(0.6, c); gr.addColorStop(1, shade(c, -0.3));
      g.fillStyle = gr; g.fill();
      g.fillStyle = 'rgba(255,255,255,.65)'; g.beginPath(); g.ellipse(s * 0.38, s * 0.24, s * 0.22, s * 0.09, -0.3, 0, 7); g.fill();
    } else if (skin === 'neon') {
      rrect(g, s * 0.12, s * 0.12, s * 0.76, s * 0.76, s * 0.12);
      g.fillStyle = 'rgba(12,10,30,.9)'; g.fill();
      g.shadowColor = c; g.shadowBlur = s * 0.35; g.strokeStyle = c; g.lineWidth = s * 0.1; g.stroke();
      g.shadowBlur = 0; g.fillStyle = c; g.globalAlpha = 0.22; g.fill(); g.globalAlpha = 1;
      g.strokeStyle = shade(c, 0.6); g.lineWidth = s * 0.03; g.stroke();
    } else if (skin === 'glass') {
      rrect(g, s * 0.05, s * 0.05, s * 0.9, s * 0.9, r);
      g.fillStyle = c; g.globalAlpha = 0.42; g.fill(); g.globalAlpha = 1;
      g.strokeStyle = shade(c, 0.45); g.lineWidth = s * 0.07; g.stroke();
      g.save(); g.clip(); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(0, s * 0.55); g.lineTo(s * 0.55, 0); g.lineTo(s * 0.8, 0); g.lineTo(0, s * 0.8); g.closePath(); g.fill(); g.restore();
    } else if (skin === 'stone') {
      rrect(g, s * 0.03, s * 0.03, s * 0.94, s * 0.94, s * 0.12); g.fillStyle = shade(c, -0.12); g.fill(); g.clip();
      const rnd = mulberry(hashStr(t + 'stone'));
      for (let i = 0; i < 14; i++) { g.fillStyle = rnd() < 0.5 ? 'rgba(0,0,0,.18)' : 'rgba(255,255,255,.18)'; g.beginPath(); g.arc(rnd() * s, rnd() * s, s * (0.03 + rnd() * 0.06), 0, 7); g.fill(); }
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = s * 0.08; g.beginPath(); g.moveTo(s * 0.06, s * 0.9); g.lineTo(s * 0.06, s * 0.06); g.lineTo(s * 0.9, s * 0.06); g.stroke();
      g.strokeStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.moveTo(s * 0.94, s * 0.1); g.lineTo(s * 0.94, s * 0.94); g.lineTo(s * 0.1, s * 0.94); g.stroke();
    } else if (skin === 'pastel') {
      rrect(g, s * 0.05, s * 0.05, s * 0.9, s * 0.9, s * 0.3); g.fillStyle = c; g.fill();
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = s * 0.06; rrect(g, s * 0.18, s * 0.18, s * 0.64, s * 0.64, s * 0.2); g.stroke();
    } else if (skin === 'pixel') {
      const p = s / 8;
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
        let col = c;
        if (x === 0 || y === 0) col = shade(c, 0.45); else if (x === 7 || y === 7) col = shade(c, -0.45); else if ((x + y) % 4 === 0) col = shade(c, 0.12);
        if (x === 1 && y === 1) col = '#ffffff';
        g.fillStyle = col; g.fillRect(Math.floor(x * p), Math.floor(y * p), Math.ceil(p), Math.ceil(p));
      }
    } else if (skin === 'gold') {
      rrect(g, s * 0.03, s * 0.03, s * 0.94, s * 0.94, r);
      const gr = g.createLinearGradient(0, 0, s, s); gr.addColorStop(0, shade(mixHex(c, '#ffd54a', 0.55), 0.4)); gr.addColorStop(0.5, mixHex(c, '#e0a800', 0.55)); gr.addColorStop(1, shade(mixHex(c, '#8a6100', 0.5), -0.2));
      g.fillStyle = gr; g.fill(); g.clip();
      g.fillStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.moveTo(s * 0.15, s); g.lineTo(s * 0.45, s); g.lineTo(s, s * 0.45); g.lineTo(s, s * 0.15); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(80,50,0,.45)'; g.lineWidth = s * 0.06; rrect(g, s * 0.03, s * 0.03, s * 0.94, s * 0.94, r); g.stroke();
    }
    g.restore();
  }
  function sprite(t, skin, logical) {
    const px = Math.max(4, Math.round(logical * scaleK));
    const key = `${skin}|${t}|${px}`;
    let c = sprites.get(key);
    if (!c) { c = document.createElement('canvas'); c.width = c.height = px; paintCell(c.getContext('2d'), px, t, skin); sprites.set(key, c); if (sprites.size > 400) sprites.clear(); }
    return c;
  }
  function cell(g, x, y, t, a = 1, s = CS, skin = save.skin) {
    if (a <= 0) return;
    g.globalAlpha = a; g.drawImage(sprite(t, skin, s), x, y, s, s); g.globalAlpha = 1;
  }
  function miniPiece(g, t, cx, cy, s, a = 1, skin = save.skin) {
    const cells = ROT[t][0], xs = cells.map((c) => c[0]), ys = cells.map((c) => c[1]);
    const mx = Math.min(...xs), my = Math.min(...ys), w = (Math.max(...xs) - mx + 1) * s, h = (Math.max(...ys) - my + 1) * s;
    for (const [x, y] of cells) cell(g, cx - w / 2 + (x - mx) * s, cy - h / 2 + (y - my) * s, t, a, s, skin);
  }

  let S = null, state = 'menu', countdown = 0, overAt = 0, time = 0;
  let menuMode = save.mode, lastStart = null;
  let shake = 0, shakeX = 0, kick = 0, texts = [], trails = [], lockFlash = [], bgPieces = [];
  const input = { left: false, right: false, soft: false, dasDir: 0, dasT: 0, arrT: 0 };

  function newBagFn(rng) { let bag = []; return () => { if (!bag.length) { bag = TYPES.slice(); for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; } } return bag.pop(); }; }
  function newGame(mode) {
    const daily = mode === 'daily' ? today() : null;
    const rng = daily ? mulberry(hashStr('blocks-' + daily)) : Math.random;
    S = {
      mode, daily, rng, next: newBagFn(rng), board: Array.from({ length: ROWS }, () => Array(COLS).fill(null)),
      cur: null, queue: [], hold: null, canHold: true, holdUsed: false,
      level: mode === 'marathon' ? save.startLevel : 1, startLevel: mode === 'marathon' ? save.startLevel : 1,
      lines: 0, score: 0, combo: -1, b2b: false, fallT: 0, lockT: 0, resets: 0, lowest: 0, lastRot: false, lastKick: 0,
      clearing: null, clearT: 0, are: 0, ending: false, endT: 0, t: 0, done: false, result: null,
      pieces: 0, tetrises: 0, tspins: 0, maxCombo: 0, pcs: 0, garbageLeft: 0, topouts: 0, newBadges: [], spawnT: 0
    };
    while (S.queue.length < 5) S.queue.push(S.next());
    if (mode === 'dig') {
      const hr = mulberry(hashStr('dig' + Math.random()));
      let last = -1;
      for (let y = ROWS - 10; y < ROWS; y++) {
        let h; do { h = Math.floor(hr() * COLS); } while (h === last); last = h;
        S.board[y] = Array.from({ length: COLS }, (_, x) => (x === h ? null : 'G'));
      }
      S.garbageLeft = 10;
    }
    texts = []; trails = []; lockFlash = []; fx.list.length = 0;
    spawn();
  }
  const timeLimit = () => (S.mode === 'ultra' || S.mode === 'daily' ? 120 : 0);
  function gravity() {
    if (S.mode === 'zen') return 0.9;
    if (S.mode === 'ultra' || S.mode === 'daily') return Math.pow(0.8 - 2 * 0.007, 2);
    const l = Math.min(S.level, 20) - 1;
    return Math.pow(0.8 - l * 0.007, l);
  }
  function collides(t, r, x, y) {
    for (const [cx, cy] of ROT[t][r]) {
      const bx = x + cx, by = y + cy;
      if (bx < 0 || bx >= COLS || by >= ROWS) return true;
      if (by >= 0 && S.board[by][bx]) return true;
    }
    return false;
  }
  function spawn(t) {
    if (!t) { t = S.queue.shift(); S.queue.push(S.next()); }
    S.cur = { t, r: 0, x: t === 'O' ? 4 : 3, y: HID - 1 };
    S.fallT = 0; S.lockT = 0; S.resets = 0; S.lastRot = false; S.spawnT = 0.12;
    if (collides(t, 0, S.cur.x, S.cur.y)) { S.cur.y--; if (collides(t, 0, S.cur.x, S.cur.y)) return topOut(); }
    S.lowest = S.cur.y;
  }
  const grounded = () => collides(S.cur.t, S.cur.r, S.cur.x, S.cur.y + 1);
  function touched() { if (grounded() && S.resets < MAX_RESETS) { S.lockT = 0; S.resets++; } }
  const active = () => S && S.cur && !S.clearing && !S.ending && S.are <= 0 && state === 'play';
  function move(dx) {
    if (!active()) return false;
    if (collides(S.cur.t, S.cur.r, S.cur.x + dx, S.cur.y)) { kick = dx * 2; return false; }
    S.cur.x += dx; S.lastRot = false; touched(); audio.move();
    return true;
  }
  function rotate(dir) {
    if (!active()) return;
    const c = S.cur;
    if (c.t === 'O') { audio.tone(500, 0.03, 'triangle', 0.04); return; }
    const to = (c.r + dir + 4) % 4;
    const kicks = dir === 2 ? KICKS_180 : (c.t === 'I' ? KICKS_I : KICKS)[c.r + '>' + to];
    for (let i = 0; i < kicks.length; i++) {
      const [kx, ky] = kicks[i];
      if (!collides(c.t, to, c.x + kx, c.y - ky)) {
        c.x += kx; c.y -= ky; c.r = to; S.lastRot = true; S.lastKick = i; touched(); audio.rotate();
        if (c.y > S.lowest) { S.lowest = c.y; S.resets = 0; }
        return;
      }
    }
  }
  function softStep() {
    if (!S.cur || collides(S.cur.t, S.cur.r, S.cur.x, S.cur.y + 1)) return false;
    S.cur.y++; S.lastRot = false;
    if (S.cur.y > S.lowest) { S.lowest = S.cur.y; S.resets = 0; }
    return true;
  }
  function ghostY() { let gy = S.cur.y; while (!collides(S.cur.t, S.cur.r, S.cur.x, gy + 1)) gy++; return gy; }
  function hardDrop() {
    if (!active()) return;
    const y0 = S.cur.y, gy = ghostY(), n = gy - y0;
    if (n > 0) S.lastRot = false;
    S.cur.y = gy;
    S.score += n * 2;
    const cols = new Set(ROT[S.cur.t][S.cur.r].map(([cx]) => cx));
    for (const cx of cols) {
      const cells = ROT[S.cur.t][S.cur.r].filter((c) => c[0] === cx), top = Math.min(...cells.map((c) => c[1]));
      trails.push({ x: FX + (S.cur.x + cx) * CS, y0: FY + (y0 + top - HID) * CS, y1: FY + (gy + top - HID) * CS, c: colorOf(S.cur.t, save.skin), t: 0.22, max: 0.22 });
    }
    if (save.settings.shake) shake = Math.min(0.25, 0.08 + n * 0.008);
    for (const [cx, cy] of ROT[S.cur.t][S.cur.r]) if (gy + cy >= HID) fx.burst(FX + (S.cur.x + cx + 0.5) * CS, FY + (gy + cy - HID + 1) * CS, 2, ['#ffffff', colorOf(S.cur.t, save.skin)], { speed: 120, life: 0.35, size: 3, gravity: 300, angle: -Math.PI / 2, spread: 2 });
    audio.hard(); vib(12);
    lock();
  }
  function doHold() {
    if (!active()) return;
    if (!S.canHold) { audio.tone(160, 0.05, 'square', 0.04); return; }
    const t = S.cur.t;
    S.canHold = false; S.holdUsed = true;
    if (S.hold) { const h = S.hold; S.hold = t; spawn(h); } else { S.hold = t; spawn(); }
    S.canHold = false;
    audio.hold();
  }
  function tspinType() {
    const c = S.cur;
    if (c.t !== 'T' || !S.lastRot) return null;
    const occ = (x, y) => x < 0 || x >= COLS || y >= ROWS || (y >= 0 && !!S.board[y][x]);
    const cx = c.x + 1, cy = c.y + 1;
    const corners = { tl: occ(cx - 1, cy - 1), tr: occ(cx + 1, cy - 1), bl: occ(cx - 1, cy + 1), br: occ(cx + 1, cy + 1) };
    const n = Object.values(corners).filter(Boolean).length;
    if (n < 3) return null;
    const front = [['tl', 'tr'], ['tr', 'br'], ['bl', 'br'], ['tl', 'bl']][c.r];
    const f = front.filter((k) => corners[k]).length;
    if (f === 2 || S.lastKick === 4) return 'full';
    return 'mini';
  }
  function lock() {
    const c = S.cur;
    const ts = tspinType();
    let above = true;
    for (const [cx, cy] of ROT[c.t][c.r]) {
      const y = c.y + cy;
      if (y >= 0) S.board[y][c.x + cx] = c.t;
      if (y >= HID) above = false;
      lockFlash.push({ x: c.x + cx, y, t: 0.18 });
    }
    S.cur = null; S.canHold = true; S.pieces++;
    save.stats.pieces++;
    if (above) return topOut();
    const full = [];
    for (let y = 0; y < ROWS; y++) if (S.board[y].every(Boolean)) full.push(y);
    const n = full.length;
    const lv = S.level;
    let pts = 0, label = '', difficult = false;
    if (ts === 'full') { pts = TSPIN_PTS[n] * lv; label = ['T-SPIN', 'T-SPIN SINGLE', 'T-SPIN DOUBLE', 'T-SPIN TRIPLE'][n]; difficult = n > 0; }
    else if (ts === 'mini') { pts = MINI_PTS[Math.min(2, n)] * lv; label = ['T-SPIN MINI', 'MINI T-SPIN SINGLE', 'MINI T-SPIN DOUBLE'][Math.min(2, n)]; difficult = n > 0; }
    else if (n) { pts = LINE_PTS[n] * lv; label = ['', 'SINGLE', 'DOUBLE', 'TRIPLE', 'TETRIS'][n]; difficult = n === 4; }
    const lines = [];
    if (n > 0) {
      if (difficult && S.b2b) { pts = Math.round(pts * 1.5); lines.push({ s: 'BACK-TO-BACK', c: '#ffd54a', z: 0.7 }); award('b2b'); }
      S.b2b = difficult;
      S.combo++;
      if (S.combo > 0) { pts += 50 * S.combo * lv; lines.push({ s: `${S.combo} COMBO`, c: '#7ff0ff', z: 0.75 }); }
      S.maxCombo = Math.max(S.maxCombo, S.combo);
      if (S.combo >= 4) award('combo4'); if (S.combo >= 8) award('combo8');
    } else S.combo = -1;
    if (label) lines.unshift({ s: label, c: ts ? '#e7a6ff' : n === 4 ? '#ffd54a' : '#ffffff', z: n === 4 || ts ? 1.15 : 0.95 });
    if (ts && n > 0) { S.tspins++; save.stats.tspins++; award('tspin'); if (ts === 'full' && n === 2) award('tsd'); if (ts === 'full' && n === 3) award('tst'); }
    if (n === 4) { S.tetrises++; save.stats.tetrises++; award('tetris'); }
    if (n > 0) {
      const rest = S.board.filter((row, y) => !full.includes(y));
      if (rest.every((row) => row.every((v) => !v))) {
        const pc = PC_PTS[n] * lv * (n === 4 && difficult && lines.some((l) => l.s === 'BACK-TO-BACK') ? 1.6 : 1);
        pts += Math.round(pc); S.pcs++; save.stats.pcs++; award('pc');
        lines.push({ s: 'PERFECT CLEAR', c: '#7dffb0', z: 1.1 });
        setTimeout(() => Curio.confetti(140), 150);
      }
    }
    S.score += pts;
    if (lines.length) texts.push({ lines, pts, t: 0, y: Math.max(FY + 90, Math.min(FY + FH - 70 - lines.length * 26, n ? FY + (full[0] - HID + n / 2) * CS : FY + FH / 2)) });
    if (n > 0) {
      award('firstline');
      S.clearing = full; S.clearT = 0.34;
      if (n === 4) audio.tetris(); else if (ts) audio.tspin(); else audio.clear(n, Math.max(0, S.combo));
      if (save.settings.shake) shake = 0.12 + n * 0.07;
      vib(n >= 4 ? [30, 30, 60] : 18 + n * 8);
      for (const y of full) for (let x = 0; x < COLS; x++) {
        const t = S.board[y][x], cx = FX + (x + 0.5) * CS, cy = FY + (y - HID + 0.5) * CS;
        fx.burst(cx, cy, n >= 4 ? 6 : 4, [colorOf(t, save.skin), shade(colorOf(t, save.skin), 0.5), '#ffffff'], { speed: 260 + n * 40, life: 0.9, size: 6, gravity: 520, angle: -Math.PI / 2, spread: Math.PI * 1.3, vx: (x - 4.5) * 25 });
      }
    } else {
      if (ts) { audio.tspin(); }
      else audio.land();
      S.are = 0;
      spawn();
    }
    bump('score');
  }
  function finishClear() {
    const n = S.clearing.length;
    for (const y of S.clearing) { S.board.splice(y, 1); S.board.unshift(Array(COLS).fill(null)); }
    S.clearing = null;
    S.lines += n; save.stats.lines += n;
    if (save.stats.lines >= 1000) award('lines1000');
    if (S.mode === 'marathon') {
      const old = S.level;
      S.level = Math.max(S.startLevel, Math.min(15, 1 + Math.floor(S.lines / 10)));
      if (S.level > old) { texts.push({ lines: [{ s: `LEVEL ${S.level}`, c: '#9ff5a5', z: 1.2 }], pts: 0, t: 0, y: FY + FH * 0.35 }); audio.level(); bgShift = 1; }
      if (S.level >= 10) award('lvl10');
      if (S.lines >= 150) return finish(true);
    }
    if (S.mode === 'sprint' && S.lines >= 40) return finish(true);
    if (S.mode === 'dig') { S.garbageLeft = S.board.filter((r) => r.includes('G')).length; if (S.garbageLeft === 0) return finish(true); }
    if (S.mode === 'zen' && S.lines >= 100) award('zen100');
    spawn();
  }
  let bgShift = 0;
  function topOut() {
    S.cur = null;
    if (S.mode === 'zen') {
      S.topouts++;
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (S.board[y][x]) { if (Math.random() < 0.5) fx.burst(FX + (x + 0.5) * CS, FY + (y - HID + 0.5) * CS, 2, [colorOf(S.board[y][x], save.skin), '#ffffff'], { speed: 200, life: 0.8, size: 5, gravity: 300 }); S.board[y][x] = null; }
      texts.push({ lines: [{ s: 'FRESH START', c: '#bfe3ff', z: 1 }], pts: 0, t: 0, y: FY + FH / 2 });
      audio.tone(300, 0.4, 'sine', 0.1, 900);
      spawn();
      return;
    }
    S.ending = true; S.endT = 0; S.result = 'topout';
    audio.over(); vib([50, 50, 120]);
    if (save.settings.shake) shake = 0.4;
  }
  function finish(win) {
    S.done = true; S.result = win ? 'win' : 'time'; S.cur = null;
    if (win) { audio.win(); Curio.confetti(); } else audio.level();
    S.ending = true; S.endT = 0.9;
  }

  function update(dt) {
    time += dt;
    fx.update(dt);
    shake = Math.max(0, shake - dt);
    kick *= Math.exp(-dt * 18);
    for (const t of texts) t.t += dt; texts = texts.filter((t) => t.t < 1.5);
    for (const t of trails) t.t -= dt; trails = trails.filter((t) => t.t > 0);
    for (const l of lockFlash) l.t -= dt; lockFlash = lockFlash.filter((l) => l.t > 0);
    bgShift = Math.max(0, bgShift - dt);
    updateBg(dt);
    if (!S) return;
    if (state === 'countdown') {
      const b = Math.ceil(countdown); countdown -= dt;
      if (Math.ceil(countdown) !== b && countdown > 0) audio.tick();
      if (countdown <= 0) { state = 'play'; audio.go(); music.start(); }
      return;
    }
    if (state !== 'play') return;
    hud();
    if (S.ending) { S.endT += dt; if (S.endT > 1.4) gameOver(); return; }
    S.t += dt; save.stats.time += dt;
    music.pump(S.level);
    if (S.spawnT > 0) S.spawnT -= dt;
    const lim = timeLimit();
    if (lim) {
      const before = Math.ceil(lim - S.t + dt);
      if (lim - S.t <= 10 && Math.ceil(lim - S.t) !== before) audio.tick();
      if (S.t >= lim) { S.t = lim; return finish(false); }
    }
    if (S.clearing) { S.clearT -= dt; if (S.clearT <= 0) finishClear(); return; }
    if (!S.cur) return;
    if (input.dasDir && (input.dasDir < 0 ? input.left : input.right)) {
      input.dasT += dt * 1000;
      if (input.dasT >= save.settings.das) {
        if (save.settings.arr === 0) { while (move(input.dasDir)) {} }
        else { input.arrT += dt * 1000; while (input.arrT >= save.settings.arr) { input.arrT -= save.settings.arr; if (!move(input.dasDir)) break; } }
      }
    }
    const g = gravity();
    if (input.soft && save.settings.sdf === 0) { let m = 0; while (softStep()) m++; S.score += m; S.fallT = 0; }
    const iv = input.soft ? Math.min(g, g / Math.max(1, save.settings.sdf), 0.05) : g;
    S.fallT += dt;
    while (S.cur && S.fallT >= iv) {
      S.fallT -= iv;
      if (softStep()) { if (input.soft) S.score += 1; }
      else { S.fallT = 0; break; }
    }
    if (!S.cur) return;
    if (grounded()) { S.lockT += dt; if (S.lockT >= LOCK) lock(); }
    else S.lockT = 0;
    hud();
  }

  function updateBg(dt) {
    if (!bgPieces.length) for (let i = 0; i < 14; i++) bgPieces.push({ t: TYPES[i % 7], x: Math.random() * W, y: Math.random() * H, s: 7 + Math.random() * 10, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, vy: 6 + Math.random() * 14, a: 0.07 + Math.random() * 0.1 });
    for (const p of bgPieces) { p.y -= p.vy * dt; p.r += p.vr * dt; if (p.y < -60) { p.y = H + 60; p.x = Math.random() * W; } }
  }

  function themeColors() {
    if (!S) return D.THEMES[0];
    if (S.mode === 'marathon') return D.THEMES[(S.level - 1) % D.THEMES.length];
    return D.THEMES[{ sprint: 1, ultra: 4, dig: 6, daily: 5, zen: 10 }[S.mode] || 0];
  }

  function fit() {
    const r = stage.getBoundingClientRect();
    const sc = Math.min(r.width / W, r.height / H);
    const cw = Math.max(1, Math.floor(W * sc)), ch = Math.max(1, Math.floor(H * sc));
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    canvas.style.width = cw + 'px'; canvas.style.height = ch + 'px';
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    const k = canvas.width / W;
    if (Math.abs(k - scaleK) > 0.001) { scaleK = k; sprites.clear(); }
  }

  function draw() {
    const g = ctx;
    g.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    const [c1, c2] = themeColors();
    const bg = g.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, c1); bg.addColorStop(1, c2);
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    if (bgShift > 0) { g.fillStyle = `rgba(255,255,255,${bgShift * 0.3})`; g.fillRect(0, 0, W, H); }
    for (const p of bgPieces) {
      g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.globalAlpha = p.a; g.fillStyle = '#ffffff';
      for (const [x, y] of ROT[p.t][0]) { rrect(g, (x - 1.5) * p.s, (y - 1) * p.s, p.s - 1.5, p.s - 1.5, p.s * 0.2); g.fill(); }
      g.restore();
    }
    g.globalAlpha = 1;
    g.save();
    if (shake > 0) g.translate((Math.random() - 0.5) * shake * 10, Math.sin(shake * 50) * shake * 14);
    g.translate(kick, 0);
    g.fillStyle = 'rgba(8,6,20,.62)'; rrect(g, FX - 5, FY - 5, FW + 10, FH + 10, 12); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 2; g.stroke();
    if (save.settings.grid) {
      g.strokeStyle = 'rgba(255,255,255,.055)'; g.lineWidth = 1; g.beginPath();
      for (let x = 1; x < COLS; x++) { g.moveTo(FX + x * CS + 0.5, FY); g.lineTo(FX + x * CS + 0.5, FY + FH); }
      for (let y = 1; y < ROWS - HID; y++) { g.moveTo(FX, FY + y * CS + 0.5); g.lineTo(FX + FW, FY + y * CS + 0.5); }
      g.stroke();
    }
    if (S) {
      let topRow = ROWS;
      for (let y = 0; y < ROWS; y++) if (S.board[y].some(Boolean)) { topRow = y; break; }
      if (topRow < HID + 5 && state === 'play') {
        const a = (0.25 + 0.15 * Math.sin(time * 8)) * (1 - (topRow - HID) / 5);
        const dg = g.createLinearGradient(0, FY, 0, FY + FH * 0.4); dg.addColorStop(0, `rgba(255,40,60,${a})`); dg.addColorStop(1, 'rgba(255,40,60,0)');
        g.fillStyle = dg; g.fillRect(FX, FY, FW, FH * 0.4);
      }
      g.save(); g.beginPath(); g.rect(FX, FY, FW, FH); g.clip();
      for (const t of trails) {
        const a = t.t / t.max, gr = g.createLinearGradient(0, t.y0, 0, t.y1 + CS);
        gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, `rgba(255,255,255,${0.35 * a})`);
        g.fillStyle = gr; g.fillRect(t.x + 2, t.y0, CS - 4, t.y1 - t.y0 + CS);
      }
      const endRows = S.ending && !S.done ? Math.floor(Math.min(1, S.endT / 1.0) * (ROWS - HID)) : 0;
      for (let y = HID; y < ROWS; y++) {
        const clearing = S.clearing && S.clearing.includes(y);
        const grey = endRows && (ROWS - 1 - y) < endRows;
        for (let x = 0; x < COLS; x++) {
          const t = S.board[y][x];
          if (!t) continue;
          const px = FX + x * CS, py = FY + (y - HID) * CS;
          if (clearing) {
            const k = S.clearT / 0.34, w = CS * k;
            cell(g, px + (CS - w) / 2, py + (CS - w) / 2, t, Math.min(1, k * 1.5), w);
          } else cell(g, px, py, grey ? 'G' : t);
        }
        if (clearing) {
          const k = S.clearT / 0.34;
          const bw = Math.min(FW, FW * (1 - k) * 1.6);
          g.fillStyle = `rgba(255,255,255,${0.85 * k})`; g.fillRect(FX + (FW - bw) / 2, FY + (y - HID) * CS + CS * 0.1, bw, CS * 0.8);
        }
      }
      for (const l of lockFlash) if (l.y >= HID) { g.fillStyle = `rgba(255,255,255,${l.t / 0.18 * 0.6})`; rrect(g, FX + l.x * CS + 1, FY + (l.y - HID) * CS + 1, CS - 2, CS - 2, 4); g.fill(); }
      if (S.cur && state !== 'menu') {
        const c = S.cur;
        if (save.settings.ghost) {
          const gy = ghostY(), col = colorOf(c.t, save.skin);
          for (const [cx, cy] of ROT[c.t][c.r]) {
            const px = FX + (c.x + cx) * CS, py = FY + (gy + cy - HID) * CS;
            g.globalAlpha = 0.16; g.fillStyle = col; rrect(g, px + 2, py + 2, CS - 4, CS - 4, 4); g.fill();
            g.globalAlpha = 0.6; g.strokeStyle = col; g.lineWidth = 1.6; g.stroke();
          }
          g.globalAlpha = 1;
        }
        const fade = grounded() ? 1 - 0.4 * Math.min(1, S.lockT / LOCK) : 1;
        const pop = S.spawnT > 0 ? 1 - S.spawnT / 0.12 : 1;
        for (const [cx, cy] of ROT[c.t][c.r]) {
          const px = FX + (c.x + cx) * CS, py = FY + (c.y + cy - HID) * CS;
          if (pop < 1) { const s = CS * (0.7 + 0.3 * pop); cell(g, px + (CS - s) / 2, py + (CS - s) / 2, c.t, fade * pop, s); }
          else cell(g, px, py, c.t, fade);
        }
      }
      if (S.ending && S.done) { g.fillStyle = `rgba(255,255,255,${Math.max(0, 0.3 - (S.endT - 0.9))})`; g.fillRect(FX, FY, FW, FH); }
      g.restore();
    }
    fx.draw(g);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const t of texts) {
      const k = t.t, a = Math.min(1, (1.5 - k) * 2.5), up = k * 22;
      let yy = t.y - up - (t.lines.length - 1) * 12;
      t.lines.forEach((l, i) => {
        const pop = Math.min(1, (k - i * 0.06) * 6);
        if (pop <= 0) return;
        const sc = (pop < 1 ? 0.4 + pop * 0.8 : 1.2 - Math.min(0.2, (k - 0.17) * 0.6)) * l.z;
        g.save(); g.translate(FX + FW / 2, yy); g.scale(sc, sc); g.globalAlpha = a;
        g.font = `900 22px ${FONT}`; g.lineWidth = 6; g.strokeStyle = 'rgba(10,6,30,.85)'; g.lineJoin = 'round';
        g.strokeText(l.s, 0, 0); g.fillStyle = l.c; g.fillText(l.s, 0, 0);
        g.restore();
        yy += 26 * l.z;
      });
      if (t.pts) { g.globalAlpha = a; g.font = `800 15px ${FONT}`; g.lineWidth = 4; g.strokeStyle = 'rgba(10,6,30,.85)'; g.strokeText('+' + Curio.fmt(t.pts), FX + FW / 2, yy + 2); g.fillStyle = '#ffffff'; g.fillText('+' + Curio.fmt(t.pts), FX + FW / 2, yy + 2); }
      g.globalAlpha = 1;
    }
    g.restore();
    drawPanels(g);
    if (state === 'countdown') {
      const n = Math.ceil(countdown), k = countdown - Math.floor(countdown);
      g.fillStyle = 'rgba(8,6,20,.35)'; g.fillRect(FX, FY, FW, FH);
      g.save(); g.translate(FX + FW / 2, FY + FH / 2 - 20); const s = 1 + Math.max(0, k - 0.7) * 2; g.scale(s, s);
      g.font = `900 84px ${FONT}`; g.lineWidth = 10; g.strokeStyle = 'rgba(10,6,30,.6)'; g.strokeText(String(n), 0, 0); g.fillStyle = '#ffffff'; g.fillText(String(n), 0, 0);
      g.font = `800 18px ${FONT}`; g.lineWidth = 5; const sub = D.MODES[S.mode].name.toUpperCase(); g.strokeText(sub, 0, 64); g.fillStyle = '#ffd54a'; g.fillText(sub, 0, 64);
      g.restore();
    }
  }

  function panelBox(g, x, y, w, h, label) {
    g.fillStyle = 'rgba(255,255,255,.1)'; rrect(g, x, y, w, h, 12); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.16)'; g.lineWidth = 1.5; g.stroke();
    if (label) { g.fillStyle = 'rgba(255,255,255,.75)'; g.font = `900 10px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillText(label, x + w / 2, y + 15); }
  }
  function drawPanels(g) {
    const lx = 8, pw = FX - 16, rx = FX + FW + 8;
    panelBox(g, lx, FY, pw, 72, 'HOLD');
    if (S?.hold) miniPiece(g, S.hold, lx + pw / 2, FY + 44, 15, S.canHold ? 1 : 0.35);
    panelBox(g, rx, FY, pw, 300, 'NEXT');
    if (S) S.queue.slice(0, 5).forEach((t, i) => miniPiece(g, t, rx + pw / 2, FY + 48 + (i === 0 ? 0 : 12 + i * 52), i === 0 ? 16 : 12, i === 0 ? 1 : 0.85));
    const rows = statRows();
    rows.forEach(([label, val], i) => {
      const y = FY + 86 + i * 60;
      panelBox(g, lx, y, pw, 52, '');
      g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      g.fillStyle = 'rgba(255,255,255,.7)'; g.font = `900 9.5px ${FONT}`; g.fillText(label, lx + pw / 2, y + 17);
      g.fillStyle = '#ffffff'; g.font = `900 ${String(val).length > 6 ? 15 : 19}px ${FONT}`; g.fillText(String(val), lx + pw / 2, y + 41);
    });
    if (S && (S.combo > 0 || S.b2b)) {
      const y = FY + 330;
      g.textAlign = 'center';
      if (S.combo > 0) { g.fillStyle = '#7ff0ff'; g.font = `900 14px ${FONT}`; g.fillText(`${S.combo} COMBO`, rx + pw / 2, y); }
      if (S.b2b) { g.fillStyle = '#ffd54a'; g.font = `900 12px ${FONT}`; g.fillText('B2B READY', rx + pw / 2, y + 20); }
    }
    if (S) {
      g.textAlign = 'center'; g.fillStyle = 'rgba(255,255,255,.6)'; g.font = `800 10px ${FONT}`;
      g.fillText(`${(S.pieces / Math.max(1, S.t)).toFixed(2)} PPS`, rx + pw / 2, FY + FH - 6);
    }
  }
  function statRows() {
    if (!S) return [['LEVEL', save.startLevel], ['LINES', 0], ['TIME', '0:00']];
    const tl = timeLimit();
    switch (S.mode) {
      case 'marathon': return [['LEVEL', S.level], ['LINES', `${S.lines}/150`], ['TIME', fmtTime(S.t, false)], ['TETRISES', S.tetrises]];
      case 'sprint': return [['LEFT', Math.max(0, 40 - S.lines)], ['TIME', fmtTime(S.t)], ['PIECES', S.pieces], ['T-SPINS', S.tspins]];
      case 'ultra': case 'daily': return [['TIME', fmtTime(Math.max(0, tl - S.t), false)], ['LINES', S.lines], ['TETRISES', S.tetrises], ['T-SPINS', S.tspins]];
      case 'dig': return [['GARBAGE', S.garbageLeft], ['TIME', fmtTime(S.t)], ['LINES', S.lines], ['PIECES', S.pieces]];
      default: return [['LINES', S.lines], ['PIECES', S.pieces], ['TIME', fmtTime(S.t, false)], ['RESETS', S.topouts]];
    }
  }

  const hudEls = {};
  $$('[data-hud]').forEach((el) => (hudEls[el.dataset.hud] ||= []).push(el));
  const setHud = (k, v) => { for (const el of hudEls[k] || []) if (el.textContent !== String(v)) el.textContent = v; };
  function bump(k) { for (const el of hudEls[k] || []) { el.classList.remove('is-bump'); void el.offsetWidth; el.classList.add('is-bump'); } }
  function bestKey(mode = S?.mode) { return Curio.simple ? 'simple' : mode === 'daily' ? `daily-${today()}` : mode === 'marathon' ? `marathon` : mode; }
  const lowerBetter = (m) => m === 'sprint' || m === 'dig';
  function bestLabel(mode) {
    const b = Curio.getBest(bestKey(mode));
    if (b == null) return '-';
    if (lowerBetter(mode)) return fmtTime(b / 1000);
    if (mode === 'zen') return Curio.fmt(b) + ' lines';
    return Curio.fmt(b);
  }
  function hud() {
    if (!S) return;
    setHud('score', Curio.fmt(S.score));
    setHud('best', bestLabel(S.mode));
  }

  function award(id) {
    if (!S || save.badges[id]) return;
    const b = D.BADGES.find((x) => x.id === id); if (!b) return;
    save.badges[id] = Date.now();
    S.newBadges.push(b.name);
    Curio.toast(`Badge unlocked: ${b.name}`);
    persist();
  }
  function skinUnlocked(sk) {
    const u = sk.unlock, s = save.stats;
    if (!u) return true;
    if (u.lines) return s.lines >= u.lines;
    if (u.tetrises) return s.tetrises >= u.tetrises;
    if (u.tspins) return s.tspins >= u.tspins;
    if (u.games) return s.games >= u.games;
    if (u.sprint) return s.sprints >= u.sprint;
    if (u.badges) return Object.keys(save.badges).length >= u.badges;
    return false;
  }
  const unlockText = (u) => !u ? 'Starter' : u.lines ? `Clear ${u.lines} lines` : u.tetrises ? `Score ${u.tetrises} tetrises` : u.tspins ? `Land ${u.tspins} T-spins` : u.games ? `Play ${u.games} games` : u.sprint ? 'Finish a Sprint' : u.badges ? `Earn ${u.badges} badges` : '';

  function medalSvg(kind) {
    const c = { gold: ['#ffd54a', '#c98a00'], silver: ['#e3e8ee', '#8a96a3'], bronze: ['#f0a76b', '#a4592a'], none: ['#bcb3c9', '#6f6680'] }[kind];
    if (kind === 'none') return `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="10" y="22" width="18" height="18" rx="4" fill="#ef4f53" transform="rotate(-14 19 31)"/><rect x="34" y="16" width="18" height="18" rx="4" fill="#3c78e8" transform="rotate(18 43 25)"/><rect x="22" y="38" width="18" height="18" rx="4" fill="#f7c831" transform="rotate(8 31 47)"/></svg>`;
    return `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M20 2h10l6 16H26zM34 2h10l-6 16H28z" fill="#7e57c2"/><circle cx="32" cy="38" r="22" fill="${c[1]}"/><circle cx="32" cy="38" r="18" fill="${c[0]}"/><path d="M32 25l4 8.5 9.3 1.3-6.7 6.5 1.6 9.2L32 46.1l-8.2 4.4 1.6-9.2-6.7-6.5 9.3-1.3z" fill="#ffffff" fill-opacity=".85"/></svg>`;
  }

  function gameOver() {
    if (state === 'over') return;
    state = 'over'; overAt = performance.now(); music.stop();
    const st = save.stats, m = S.mode, win = S.result === 'win', timeUp = S.result === 'time';
    const prevSkins = new Set(D.SKINS.filter(skinUnlocked).map((s) => s.id));
    st.games++; st.maxCombo = Math.max(st.maxCombo, S.maxCombo);
    if (S.pieces >= 100 && S.pieces / Math.max(1, S.t) >= 2) award('pps2');
    let big, title, msg, medal = 'none', isNew = false, bestVal = null;
    if (m === 'sprint') {
      if (win) {
        st.sprints++; award('sprint'); if (S.t < 90) award('sprint90'); if (!S.holdUsed) award('hold0');
        bestVal = Math.round(S.t * 1000); isNew = Curio.best(bestKey(), bestVal, false).isNew;
        big = fmtTime(S.t); title = 'Sprint complete!'; medal = S.t < 60 ? 'gold' : S.t < 100 ? 'silver' : 'bronze';
        msg = `40 lines in ${fmtTime(S.t)} at ${(S.pieces / S.t).toFixed(2)} pieces per second.`;
      } else { big = `${S.lines}/40`; title = 'Topped out'; msg = Curio.pick(D.QUIPS); }
    } else if (m === 'dig') {
      if (win) {
        award('dig'); if (S.t < 60) award('dig60');
        bestVal = Math.round(S.t * 1000); isNew = Curio.best(bestKey(), bestVal, false).isNew;
        big = fmtTime(S.t); title = 'Dug out!'; medal = S.t < 45 ? 'gold' : S.t < 80 ? 'silver' : 'bronze';
        msg = 'All ten garbage rows, gone. The mole union salutes you.';
      } else { big = `${10 - S.garbageLeft}/10`; title = 'Buried'; msg = 'The garbage won. Try clearing the holes one at a time.'; }
    } else if (m === 'zen') {
      isNew = Curio.best(bestKey(), S.lines).isNew && S.lines > 0;
      big = `${S.lines}`; title = 'Zen session'; msg = `${S.lines} lines, ${S.pieces} pieces, ${S.topouts} fresh starts. Very calm.`; medal = S.lines >= 100 ? 'gold' : S.lines >= 40 ? 'silver' : S.lines >= 10 ? 'bronze' : 'none';
    } else {
      isNew = Curio.best(bestKey(), S.score).isNew && S.score > 0;
      big = Curio.fmt(S.score);
      if (m === 'marathon') { title = win ? 'Marathon complete!' : 'Topped out'; if (win) award('marathon'); medal = win ? 'gold' : S.lines >= 100 ? 'silver' : S.lines >= 50 ? 'bronze' : 'none'; msg = win ? 'All 150 lines. Legendary stamina.' : `${S.lines} lines, level ${S.level}. ${Curio.pick(D.QUIPS)}`; }
      else { title = timeUp ? "Time's up!" : 'Topped out'; if (m === 'ultra' && S.score >= 30000) award('ultra30k'); medal = S.score >= 40000 ? 'gold' : S.score >= 20000 ? 'silver' : S.score >= 8000 ? 'bronze' : 'none'; msg = timeUp ? `${S.lines} lines in two minutes.` : Curio.pick(D.QUIPS); }
      if (m === 'daily') {
        award('daily');
        const d = save.daily[S.daily] || { best: 0, plays: 0, first: null };
        if (!d.plays) st.days++;
        d.plays++; d.best = Math.max(d.best, S.score); if (d.first == null) d.first = S.score;
        save.daily[S.daily] = d;
        const keys = Object.keys(save.daily).sort(); while (keys.length > 40) delete save.daily[keys.shift()];
        msg += ` Today's best: ${Curio.fmt(d.best)}.`;
      }
    }
    if (D.SKINS.filter(skinUnlocked).length >= 5) award('skins5');
    const fresh = D.SKINS.filter(skinUnlocked).filter((sk) => !prevSkins.has(sk.id));
    save.history.unshift({ m, s: S.score, l: S.lines, t: Math.round(S.t * 10) / 10, w: win ? 1 : 0, d: Date.now() });
    save.history.length = Math.min(save.history.length, 12);
    persist();
    const box = ovs.over, set = (n, v) => { box.querySelector(`[data-o="${n}"]`).textContent = v; };
    box.querySelector('[data-o="medal"]').innerHTML = medalSvg(medal);
    set('title', title); set('big', big); set('msg', msg);
    box.querySelector('[data-o="new"]').hidden = !isNew;
    const rs = [[Curio.fmt(S.score), 'Score'], [S.lines, 'Lines'], [S.tetrises, 'Tetrises'], [S.tspins, 'T-spins'], [Math.max(0, S.maxCombo), 'Max combo'], [S.pcs, 'Perfect'], [(S.pieces / Math.max(1, S.t)).toFixed(2), 'Pieces/sec'], [fmtTime(S.t, false), 'Time']];
    box.querySelector('[data-o="stats"]').innerHTML = rs.map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join('');
    const earned = box.querySelector('[data-o="earned"]'); earned.innerHTML = '';
    S.newBadges.forEach((n, i) => { const sp = document.createElement('span'); sp.textContent = 'Badge: ' + n; sp.style.animationDelay = (0.2 + i * 0.1) + 's'; earned.append(sp); });
    fresh.forEach((sk, i) => { const sp = document.createElement('span'); sp.textContent = 'New skin: ' + sk.name; sp.style.animationDelay = (0.3 + i * 0.1) + 's'; earned.append(sp); });
    if (isNew) Curio.confetti();
    show('over');
    if (bestVal != null) window.Cab?.over(bestVal, { key: bestKey(), low: true });
    else if (m === 'zen') window.Cab?.over(S.lines, { key: bestKey() });
    else if (m !== 'sprint' && m !== 'dig') window.Cab?.over(S.score, { key: bestKey() });
  }

  function shareText() {
    if (!S) return '';
    const m = D.MODES[S.mode].name;
    if (S.mode === 'sprint' && S.result === 'win') return `Zoble Blocks Sprint: 40 lines in ${fmtTime(S.t)} (${(S.pieces / S.t).toFixed(2)} PPS)`;
    if (S.mode === 'dig' && S.result === 'win') return `Zoble Blocks Dig: cleared 10 garbage rows in ${fmtTime(S.t)}`;
    if (S.mode === 'daily') return `Zoble Blocks Daily ${S.daily}: ${Curio.fmt(S.score)} points, ${S.lines} lines, ${S.tetrises} tetrises, ${S.tspins} T-spins`;
    if (S.mode === 'zen') return `Zoble Blocks Zen: ${S.lines} lines of pure calm`;
    return `Zoble Blocks ${m}: ${Curio.fmt(S.score)} points, ${S.lines} lines${S.mode === 'marathon' ? `, level ${S.level}` : ''}`;
  }
  async function share() { const t = shareText(); try { await navigator.clipboard.writeText(t); Curio.toast('Copied to clipboard'); } catch { Curio.toast(t, 4000); } }

  function show(name) {
    for (const k in ovs) ovs[k].hidden = k !== name;
    document.body.classList.toggle('bk-playing', !name || name === 'pause');
    if (name) setTimeout(() => ovs[name].querySelector('.c-btn:not([hidden]), button')?.focus({ preventScroll: true }), 30);
  }
  function start(mode) {
    menuMode = mode; save.mode = mode; persist();
    newGame(mode);
    lastStart = mode;
    state = 'countdown'; countdown = 2.99;
    input.left = input.right = input.soft = false; input.dasDir = 0;
    $('#ov-pause [data-zen]').hidden = mode !== 'zen';
    setHud('scorelabel', 'Score');
    show(null); hud(); audio.tick();
    if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
  }
  function restart() { if (lastStart) start(lastStart); }
  function toMenu() {
    music.stop();
    state = 'menu';
    S = null;
    attract();
    show('menu'); renderMenu();
    setHud('score', 0); setHud('best', bestLabel(menuMode));
    window.Cab?.menu();
  }
  function attract() {
    newGame('marathon');
    S.cur = null;
    const rnd = mulberry(7);
    for (let y = ROWS - 7; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (rnd() < 0.78 - (ROWS - y) * 0.04) S.board[y][x] = TYPES[Math.floor(rnd() * 7)];
    S.queue = TYPES.slice(0, 5); S.hold = 'T';
  }
  function pause() { if (state !== 'play' && state !== 'countdown') return; state = 'paused'; music.stop(); show('pause'); audio.tone(392, 0.06, 'triangle', 0.08); input.left = input.right = input.soft = false; }
  function resume() { if (state !== 'paused') return; state = 'countdown'; countdown = 0.99; show(null); }

  function modeIcon(g, id) {
    g.save(); g.scale(2, 2); g.lineCap = 'round'; g.lineJoin = 'round';
    const sq = (x, y, c) => { g.fillStyle = c; rrect(g, x, y, 5.4, 5.4, 1.4); g.fill(); };
    if (id === 'marathon') { for (let i = 0; i < 4; i++) for (let j = 0; j <= i; j++) sq(2 + i * 6, 26 - j * 6, ['#2fc6e8', '#4cc65c', '#f7c831', '#ef4f53'][i]); g.fillStyle = '#7e57c2'; g.fillRect(24, 2, 1.6, 12); g.beginPath(); g.moveTo(25.6, 2); g.lineTo(31, 5); g.lineTo(25.6, 8); g.fill(); }
    else if (id === 'sprint') { g.strokeStyle = '#3c78e8'; g.lineWidth = 2.4; g.beginPath(); g.arc(16, 18, 11, 0, 7); g.stroke(); g.fillStyle = '#3c78e8'; g.fillRect(13, 2, 6, 3); g.strokeStyle = '#ef4f53'; g.beginPath(); g.moveTo(16, 18); g.lineTo(22, 12); g.stroke(); }
    else if (id === 'ultra') { g.fillStyle = '#f7c831'; g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 6 : 14, a = i * Math.PI / 5 - Math.PI / 2; g.lineTo(16 + Math.cos(a) * r, 17 + Math.sin(a) * r); } g.closePath(); g.fill(); g.strokeStyle = '#c98a00'; g.lineWidth = 1.2; g.stroke(); }
    else if (id === 'dig') { for (let y = 0; y < 3; y++) for (let x = 0; x < 5; x++) if (x !== (y * 2 + 1) % 5) sq(1 + x * 6, 13 + y * 6, '#8c8798'); g.strokeStyle = '#a0522d'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(22, 3); g.lineTo(14, 11); g.stroke(); g.fillStyle = '#b0bec5'; g.beginPath(); g.ellipse(12, 13, 4, 2.6, -0.8, 0, 7); g.fill(); }
    else if (id === 'daily') { g.fillStyle = '#fff'; g.strokeStyle = '#a55ee6'; g.lineWidth = 2; rrect(g, 3, 6, 26, 23, 4); g.fill(); g.stroke(); g.fillStyle = '#a55ee6'; g.fillRect(3, 6, 26, 6); sq(8, 16, '#f78a2c'); sq(14, 16, '#f78a2c'); sq(14, 22, '#f78a2c'); sq(20, 16, '#f78a2c'); }
    else if (id === 'zen') { g.fillStyle = '#4cc65c'; g.beginPath(); g.moveTo(5, 28); g.quadraticCurveTo(4, 6, 28, 4); g.quadraticCurveTo(27, 26, 5, 28); g.fill(); g.strokeStyle = '#2b7a35'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(5, 28); g.lineTo(20, 13); g.stroke(); }
    g.restore();
  }
  const modesEl = $('#modes');
  MODE_ORDER.forEach((id) => {
    const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'tab'); b.dataset.mode = id;
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64; modeIcon(cv.getContext('2d'), id);
    const nm = document.createElement('b'); nm.textContent = D.MODES[id].name;
    const sm = document.createElement('small'); sm.textContent = D.MODES[id].short;
    b.append(cv, nm, sm);
    b.addEventListener('click', () => { menuMode = id; save.mode = id; persist(); audio.tone(660, 0.04, 'triangle', 0.06); renderMenu(); });
    modesEl.append(b);
  });
  const panel = $('#mode-panel');
  function renderMenu() {
    $$('#modes button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.mode === menuMode)));
    const M = D.MODES[menuMode];
    panel.innerHTML = '';
    const p = document.createElement('p'); p.textContent = M.blurb; panel.append(p);
    if (menuMode === 'marathon') {
      const lab = document.createElement('div'); lab.className = 'bk-label'; lab.textContent = 'Starting level';
      const seg = document.createElement('div'); seg.className = 'bk-seg';
      for (const lv of [1, 5, 10]) { const b = document.createElement('button'); b.type = 'button'; b.textContent = `Level ${lv}`; b.setAttribute('aria-pressed', String(save.startLevel === lv)); b.addEventListener('click', () => { save.startLevel = lv; persist(); renderMenu(); }); seg.append(b); }
      panel.append(lab, seg);
    }
    if (menuMode === 'daily') { const d = save.daily[today()]; const q = document.createElement('p'); q.innerHTML = d ? `Today's best: <b>${Curio.fmt(d.best)}</b> (first try ${Curio.fmt(d.first)})` : `Seed for <b>${today()}</b>. One shot for bragging rights.`; panel.append(q); }
    const bp = document.createElement('p'); bp.innerHTML = `Personal best: <b>${bestLabel(menuMode)}</b>`; panel.append(bp);
    const b = document.createElement('button'); b.type = 'button'; b.className = 'c-btn bk-play'; b.textContent = 'Play'; b.addEventListener('click', () => start(menuMode)); panel.append(b);
    setHud('best', bestLabel(menuMode));
  }

  function openSkins() {
    const w = $('#skins'); w.innerHTML = '';
    for (const sk of D.SKINS) {
      const ok = skinUnlocked(sk);
      const b = document.createElement('button'); b.type = 'button'; b.className = 'bk-skin'; b.disabled = !ok; b.setAttribute('aria-pressed', String(save.skin === sk.id));
      const cv = document.createElement('canvas'); cv.width = 264; cv.height = 132;
      const g = cv.getContext('2d'), s = 24;
      const drawP = (t, cells, ox, oy) => { const c = document.createElement('canvas'); c.width = c.height = s; paintCell(c.getContext('2d'), s, t, sk.id); cells.forEach(([x, y]) => g.drawImage(c, ox + x * s, oy + y * s)); };
      drawP('T', [[0, 1], [1, 1], [2, 1], [1, 0]], 8, 10);
      drawP('S', [[1, 0], [2, 0], [0, 1], [1, 1]], 92, 10);
      drawP('Z', [[0, 0], [1, 0], [1, 1], [2, 1]], 176, 10);
      drawP('I', [[0, 0], [1, 0], [2, 0], [3, 0]], 8, 84);
      drawP('O', [[0, 0], [1, 0], [0, 1], [1, 1]], 116, 62);
      drawP('L', [[2, 0], [0, 1], [1, 1], [2, 1]], 176, 62);
      b.append(cv);
      const nm = document.createElement('b'); nm.textContent = sk.name;
      const sm = document.createElement('small'); sm.textContent = ok ? (save.skin === sk.id ? 'Equipped' : 'Tap to equip') : unlockText(sk.unlock);
      b.append(nm, sm);
      b.addEventListener('click', () => { save.skin = sk.id; sprites.clear(); persist(); audio.hold(); openSkins(); });
      w.append(b);
    }
    show('skins');
  }
  function openSettings() {
    const w = $('#settings'); w.innerHTML = '';
    const range = (key, label, desc, min, max, step, unit) => {
      const row = document.createElement('label'); row.className = 'bk-set';
      row.innerHTML = `<div><b></b><small></small></div><div><input type="range" min="${min}" max="${max}" step="${step}"> <output></output></div>`;
      row.querySelector('b').textContent = label; row.querySelector('small').textContent = desc;
      const inp = row.querySelector('input'), out = row.querySelector('output');
      inp.value = save.settings[key];
      const paint = () => { out.textContent = key === 'sdf' ? (Number(inp.value) === 0 ? 'Instant' : inp.value + 'x') : inp.value + unit; };
      paint();
      inp.addEventListener('input', () => { save.settings[key] = Number(inp.value); paint(); persist(); });
      w.append(row);
    };
    const check = (key, label, desc) => {
      const row = document.createElement('label'); row.className = 'bk-set';
      row.innerHTML = `<div><b></b><small></small></div><input type="checkbox">`;
      row.querySelector('b').textContent = label; row.querySelector('small').textContent = desc;
      const inp = row.querySelector('input'); inp.checked = save.settings[key];
      inp.addEventListener('change', () => { save.settings[key] = inp.checked; persist(); });
      w.append(row);
    };
    range('das', 'Auto-shift delay', 'How long to hold before a piece slides.', 50, 300, 10, 'ms');
    range('arr', 'Auto-repeat rate', 'Time between slides. 0 is instant.', 0, 100, 5, 'ms');
    range('sdf', 'Soft drop speed', 'Multiplier on gravity. 0 is instant.', 0, 40, 5, '');
    check('ghost', 'Ghost piece', 'Show where the piece will land.');
    check('grid', 'Grid lines', 'Faint lines in the well.');
    check('music', 'Music', 'A chiptune folk song, very quiet.');
    check('shake', 'Screen shake', 'Wobble on drops and big clears.');
    check('haptics', 'Vibration', 'Buzz on phones that support it.');
    show('settings');
  }
  function badgeIcon(g, icon, on) {
    g.clearRect(0, 0, 68, 68);
    const gr = g.createLinearGradient(0, 0, 68, 68); gr.addColorStop(0, on ? '#b388ff' : '#cfc8d8'); gr.addColorStop(1, on ? '#5e35b1' : '#8f879c');
    g.fillStyle = gr; rrect(g, 4, 4, 60, 60, 16); g.fill();
    g.save(); g.translate(34, 34); g.fillStyle = '#ffffff'; g.strokeStyle = '#ffffff'; g.lineWidth = 4; g.lineCap = 'round'; g.lineJoin = 'round';
    const sq = (x, y) => { rrect(g, x - 6, y - 6, 12, 12, 3); g.fill(); };
    if (icon === 'line') { for (let i = -2; i <= 1; i++) sq(i * 13 + 6, 0); }
    else if (icon === 'four') { for (let i = 0; i < 4; i++) { g.globalAlpha = 0.5 + i * 0.16; rrect(g, -18, -18 + i * 9, 36, 7, 2); g.fill(); } g.globalAlpha = 1; }
    else if (icon === 'spin') { sq(-12, 6); sq(0, 6); sq(12, 6); sq(0, -6); g.beginPath(); g.arc(0, 0, 20, -2.4, -0.6); g.stroke(); }
    else if (icon === 'crown') { g.beginPath(); g.moveTo(-18, 12); g.lineTo(-18, -10); g.lineTo(-8, 0); g.lineTo(0, -14); g.lineTo(8, 0); g.lineTo(18, -10); g.lineTo(18, 12); g.closePath(); g.fill(); }
    else if (icon === 'chain') { g.beginPath(); g.ellipse(-7, 0, 10, 6, 0, 0, 7); g.stroke(); g.beginPath(); g.ellipse(7, 0, 10, 6, 0, 0, 7); g.stroke(); }
    else if (icon === 'bolt') { g.beginPath(); g.moveTo(4, -18); g.lineTo(-10, 2); g.lineTo(0, 2); g.lineTo(-4, 18); g.lineTo(10, -2); g.lineTo(0, -2); g.closePath(); g.fill(); }
    else if (icon === 'sparkle') { g.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? 5 : 18, a = i * Math.PI / 4; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); }
    else if (icon === 'up') { g.beginPath(); g.moveTo(0, -16); g.lineTo(14, 2); g.lineTo(5, 2); g.lineTo(5, 16); g.lineTo(-5, 16); g.lineTo(-5, 2); g.lineTo(-14, 2); g.closePath(); g.fill(); }
    else if (icon === 'medal') { g.beginPath(); g.arc(0, 4, 12, 0, 7); g.fill(); g.fillRect(-8, -18, 5, 12); g.fillRect(3, -18, 5, 12); }
    else if (icon === 'clock') { g.beginPath(); g.arc(0, 2, 15, 0, 7); g.stroke(); g.beginPath(); g.moveTo(0, 2); g.lineTo(0, -7); g.moveTo(0, 2); g.lineTo(7, 6); g.stroke(); }
    else if (icon === 'star') { g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 7 : 17, a = i * Math.PI / 5 - Math.PI / 2; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); }
    else if (icon === 'shovel') { g.beginPath(); g.moveTo(-12, 12); g.lineTo(8, -8); g.stroke(); g.beginPath(); g.ellipse(-12, 12, 7, 5, -0.8, 0, 7); g.fill(); g.beginPath(); g.moveTo(5, -14); g.lineTo(14, -5); g.stroke(); }
    else if (icon === 'cal') { g.lineWidth = 3; rrect(g, -15, -12, 30, 27, 4); g.stroke(); g.fillRect(-15, -12, 30, 7); }
    else if (icon === 'leaf') { g.beginPath(); g.moveTo(-14, 14); g.quadraticCurveTo(-14, -14, 16, -15); g.quadraticCurveTo(15, 14, -14, 14); g.fill(); }
    g.restore();
  }
  function openBadges() {
    const s = save.stats;
    const cells = [[s.games, 'Games'], [Curio.fmt(s.lines), 'Lines'], [s.tetrises, 'Tetrises'], [s.tspins, 'T-spins'], [s.pcs, 'Perfect clears'], [Curio.fmt(s.pieces), 'Pieces'], [s.maxCombo, 'Best combo'], [fmtTime(s.time, false), 'Time played']];
    $('#stats').innerHTML = cells.map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join('');
    const bw = $('#badges'); bw.innerHTML = '';
    for (const b of D.BADGES) {
      const on = !!save.badges[b.id];
      const el = document.createElement('div'); el.className = 'bk-badge' + (on ? ' is-on' : '');
      const cv = document.createElement('canvas'); cv.width = 68; cv.height = 68; badgeIcon(cv.getContext('2d'), b.icon, on);
      const t = document.createElement('div'); t.innerHTML = '<b></b><small></small>'; t.querySelector('b').textContent = b.name; t.querySelector('small').textContent = b.desc;
      el.append(cv, t); bw.append(el);
    }
    const hl = $('#history'); hl.innerHTML = save.history.length ? '' : '<li>No games yet. The well is waiting.</li>';
    for (const h of save.history) {
      const li = document.createElement('li'); li.innerHTML = '<b></b><span></span>';
      const nm = D.MODES[h.m]?.name || h.m;
      li.querySelector('b').textContent = (h.m === 'sprint' || h.m === 'dig') && h.w ? `${nm}: ${fmtTime(h.t)}` : `${nm}: ${Curio.fmt(h.s)}`;
      li.querySelector('span').textContent = `${h.l} lines · ${new Date(h.d).toLocaleDateString()}`;
      hl.append(li);
    }
    show('badges');
  }

  $$('[data-act]').forEach((b) => b.addEventListener('click', () => {
    const a = b.dataset.act;
    if (a === 'pause') { if (state === 'play' || state === 'countdown') pause(); else if (state === 'paused') resume(); }
    else if (a === 'resume') resume();
    else if (a === 'restart') { if (performance.now() - overAt > 400) restart(); }
    else if (a === 'menu') toMenu();
    else if (a === 'skins') openSkins();
    else if (a === 'settings') openSettings();
    else if (a === 'badges') openBadges();
    else if (a === 'help') show('help');
    else if (a === 'share') share();
    else if (a === 'finish') { S.result = 'zen'; S.ending = true; S.endT = 1.4; state = 'play'; show(null); gameOver(); }
  }));

  function act(name, down) {
    if (name === 'left' || name === 'right') {
      const d = name === 'left' ? -1 : 1;
      input[name] = down;
      if (down) { input.dasDir = d; input.dasT = 0; input.arrT = 0; move(d); }
      else if (input.dasDir === d) { const o = d < 0 ? input.right : input.left; input.dasDir = o ? -d : 0; input.dasT = 0; input.arrT = 0; }
      return;
    }
    if (name === 'soft') { input.soft = down; if (down && active() && softStep()) { S.score += 1; S.fallT = 0; } return; }
    if (!down) return;
    if (name === 'hard') hardDrop();
    else if (name === 'cw') rotate(1);
    else if (name === 'ccw') rotate(-1);
    else if (name === '180') rotate(2);
    else if (name === 'hold') doHold();
  }
  const KEYS = { arrowleft: 'left', arrowright: 'right', arrowdown: 'soft', ' ': 'hard', arrowup: 'cw', x: 'cw', w: 'cw', z: 'ccw', q: 'ccw', control: 'ccw', a: '180', c: 'hold', shift: 'hold' };
  addEventListener('keydown', (e) => {
    if (e.metaKey || e.altKey) return;
    if (e.target.closest?.('input, select, textarea')) return;
    const k = e.key.toLowerCase();
    if (k === 'p' || k === 'escape') {
      if (state === 'play' || state === 'countdown') { pause(); e.preventDefault(); return; }
      if (state === 'paused') { resume(); e.preventDefault(); return; }
      if (k === 'escape' && ['skins', 'settings', 'badges', 'help'].some((n) => !ovs[n].hidden)) { toMenu(); return; }
    }
    if (state === 'play' && KEYS[k]) { e.preventDefault(); if (!e.repeat) act(KEYS[k], true); return; }
    if (state === 'countdown' && KEYS[k]) { e.preventDefault(); if (k === 'arrowleft' || k === 'arrowright') input[KEYS[k]] = true; return; }
    const onBtn = e.target.closest?.('button, a');
    if ((k === ' ' || k === 'enter') && !onBtn) {
      if (state === 'paused') { resume(); e.preventDefault(); }
      else if (state === 'over' && performance.now() - overAt > 400) { restart(); e.preventDefault(); }
      else if (state === 'menu' && !ovs.menu.hidden) { start(menuMode); e.preventDefault(); }
    }
    if (k === 'r' && (state === 'over' || state === 'paused' || state === 'play')) { e.preventDefault(); restart(); }
  });
  addEventListener('keyup', (e) => { const k = e.key.toLowerCase(); if (KEYS[k] && ['left', 'right', 'soft'].includes(KEYS[k])) act(KEYS[k], false); });

  $$('.bk-pad [data-k]').forEach((b) => {
    const k = b.dataset.k;
    let on = false;
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); document.body.classList.add('bk-touch'); if (on) return; on = true; b.classList.add('is-down'); try { b.setPointerCapture(e.pointerId); } catch {} if (state === 'play') act(k, true); vib(6); });
    const up = () => { if (!on) return; on = false; b.classList.remove('is-down'); act(k, false); };
    b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up);
    b.addEventListener('contextmenu', (e) => e.preventDefault());
  });

  let drag = null;
  const toLogical = (p) => { const r = canvas.getBoundingClientRect(); return { x: (p.clientX - r.left) / r.width * W, y: (p.clientY - r.top) / r.height * H }; };
  stage.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch' && !e.target.closest('.bk-ov')) document.body.classList.add('bk-touch'); });
  Curio.drag(canvas, {
    start(pt) {
      if (state !== 'play') { drag = null; return; }
      pt.event?.preventDefault?.();
      const p = toLogical(pt);
      drag = { x: p.x, y: p.y, sx: p.x, sy: p.y, t: performance.now(), moved: false };
    },
    move(pt) {
      if (!drag || state !== 'play') return;
      const p = toLogical(pt), unit = CS * 0.95;
      while (p.x - drag.x >= unit) { move(1); drag.x += unit; drag.moved = true; }
      while (drag.x - p.x >= unit) { move(-1); drag.x -= unit; drag.moved = true; }
      const dt = performance.now() - drag.t;
      if (p.y - drag.y >= unit && dt > 160) { if (active() && softStep()) { S.score += 1; S.fallT = 0; } drag.y += unit; drag.moved = true; }
      if (p.y < drag.y - unit) drag.y = p.y + unit * 0.5;
    },
    end(pt) {
      if (!drag) return;
      if (pt && state === 'play') {
        const p = toLogical(pt), dt = performance.now() - drag.t, dy = p.y - drag.sy, dx = p.x - drag.sx;
        if (dy > CS * 2 && dy / dt > 0.4 && Math.abs(dy) > Math.abs(dx) * 1.4) hardDrop();
        else if (-dy > CS * 2 && Math.abs(dy) > Math.abs(dx) * 1.4 && dt < 450) doHold();
        else if (!drag.moved && Math.hypot(dx, dy) < 12 && (dt < 300 || Curio.touchpad)) rotate(p.x < W / 2 ? -1 : 1);
      }
      drag = null;
    }
  });
  stage.addEventListener('contextmenu', (e) => e.preventDefault());

  let raf = 0, last = 0;
  function frame(t) {
    raf = requestAnimationFrame(frame);
    let dt = last ? (t - last) / 1000 : 0; last = t;
    if (dt > 0.1) dt = 0.1;
    if (state === 'paused' || state === 'over' || state === 'menu') { time += dt; fx.update(dt); updateBg(dt); for (const x of texts) x.t += dt; }
    else update(dt);
    draw();
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { pause(); music.stop(); cancelAnimationFrame(raf); raf = 0; persist(); }
    else if (!raf) { last = 0; raf = requestAnimationFrame(frame); }
  });
  addEventListener('blur', () => pause());
  addEventListener('pagehide', persist);
  new ResizeObserver(fit).observe(stage);

  window.__blocks = {
    get state() { return state; }, get S() { return S; }, save, start, toMenu,
    skip() { if (state === 'countdown') countdown = 0.001; },
    setBoard(rows, piece) { for (let y = 0; y < ROWS; y++) S.board[y] = Array(COLS).fill(null); rows.forEach((r, i) => { const y = ROWS - rows.length + i; S.board[y] = [...r].map((c) => (c === '.' ? null : c === '#' ? 'G' : c)); }); if (piece) { S.cur = { t: piece.t, r: piece.r || 0, x: piece.x, y: piece.y, }; S.lowest = S.cur.y; } },
    act: (n) => { act(n, true); act(n, false); },
    tspinType, lock: () => lock(), finishClear: () => { if (S.clearing) finishClear(); }
  };

  fit();
  toMenu();
  raf = requestAnimationFrame(frame);
  if (!Curio.store.get('tip:touchpad:tetris', false) && !matchMedia('(pointer: coarse)').matches) {
    Curio.store.set('tip:touchpad:tetris', true);
    setTimeout(() => Curio.toast('Tip: play with the keyboard, or turn on Touchpad mode in the top bar to slide pieces without holding the button', 4200), 1200);
  }
})();
