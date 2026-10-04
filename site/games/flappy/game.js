'use strict';
(() => {
  const D = window.FLAPPY_DATA;
  const W = 320, H = 520, GY = H - 72, BX = 92, R = 12, PW = 56, L = 640;
  const FONT = 'ui-rounded, "SF Pro Rounded", "Nunito", "Segoe UI", system-ui, sans-serif';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const SAVE_KEY = 'flappy:save', VER = 2;
  const canvas = $('#sky'), ctx = canvas.getContext('2d'), stage = $('.fl-stage');
  const ovs = { menu: $('#ov-menu'), shop: $('#ov-shop'), badges: $('#ov-badges'), help: $('#ov-help'), pause: $('#ov-pause'), over: $('#ov-over') };
  const TAU = Math.PI * 2;

  function defaults() {
    return {
      v: VER, coins: 0, char: 'chick', world: 'meadow', trail: 'none', mode: 'classic', sky: 'cycle', haptics: true,
      owned: { chick: 1, meadow: 1, none: 1 },
      stats: { games: 0, pipes: 0, coins: 0, flaps: 0, time: 0, best: 0, shields: 0 },
      badges: {}, daily: {}, history: []
    };
  }
  function load() {
    const d = defaults();
    let s = null;
    try { s = Curio.store.get(SAVE_KEY, null); } catch { s = null; }
    if (!s || typeof s !== 'object') return d;
    if (Number.isFinite(s.coins)) d.coins = Math.max(0, Math.floor(s.coins));
    for (const k of ['char', 'world', 'trail', 'mode', 'sky']) if (typeof s[k] === 'string') d[k] = s[k];
    if (typeof s.haptics === 'boolean') d.haptics = s.haptics;
    for (const k of ['owned', 'badges', 'daily']) if (s[k] && typeof s[k] === 'object' && !Array.isArray(s[k])) d[k] = { ...d[k], ...s[k] };
    if (s.stats && typeof s.stats === 'object') for (const j in d.stats) if (Number.isFinite(s.stats[j])) d.stats[j] = s.stats[j];
    if (Array.isArray(s.history)) d.history = s.history.filter((h) => h && typeof h === 'object').slice(0, 12);
    if (!D.CHARS.some((c) => c.id === d.char) || !d.owned[d.char]) d.char = 'chick';
    if (!D.WORLDS.some((c) => c.id === d.world) || !d.owned[d.world]) d.world = 'meadow';
    if (!D.TRAILS.some((c) => c.id === d.trail) || !d.owned[d.trail]) d.trail = 'none';
    if (!D.MODES[d.mode]) d.mode = 'classic';
    if (!['cycle', 'day', 'night'].includes(d.sky)) d.sky = 'cycle';
    return d;
  }
  const save = load();
  const persist = () => Curio.store.set(SAVE_KEY, save);

  function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function mulberry(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const mixHex = (a, b, t) => { const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16); const c = (s) => Math.round(((x >> s) & 255) * (1 - t) + ((y >> s) & 255) * t); return '#' + ((1 << 24) + (c(16) << 16) + (c(8) << 8) + c(0)).toString(16).slice(1); };
  const shade = (hex, amt) => mixHex(hex, amt < 0 ? '#000000' : '#ffffff', Math.abs(amt));
  function rrect(g, x, y, w, h, r) { r = Math.max(0, Math.min(r, w / 2, h / 2)); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function starPath(g, x, y, R1, r1, n) { g.beginPath(); for (let i = 0; i < n * 2; i++) { const rr = i % 2 ? r1 : R1, a = i * Math.PI / n - Math.PI / 2; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); }
  const vib = (p) => { if (save.haptics && navigator.vibrate) try { navigator.vibrate(p); } catch {} };
  const worldOf = (id) => D.WORLDS.find((w) => w.id === id) || D.WORLDS[0];

  const audio = {
    tone(f, d = 0.08, type = 'sine', vol = 0.1, to = 0, delay = 0) {
      if (Curio.muted) return;
      const ac = Curio.audioContext(); if (!ac) return;
      const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + d);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d + 0.03);
    },
    noise(d = 0.2, vol = 0.1, freq = 1500) {
      if (Curio.muted) return;
      const ac = Curio.audioContext(); if (!ac) return;
      if (!this.buf) { this.buf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const ch = this.buf.getChannelData(0); for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1; }
      const t = ac.currentTime, s = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter();
      s.buffer = this.buf; f.type = 'bandpass'; f.frequency.setValueAtTime(freq, t); f.Q.value = 0.8;
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      s.connect(f).connect(g).connect(ac.destination); s.start(t); s.stop(t + d + 0.02);
    },
    flap() { this.noise(0.07, 0.09, 1800); this.tone(520, 0.05, 'triangle', 0.035, 760); },
    point() { this.tone(880, 0.07, 'square', 0.05); this.tone(1320, 0.1, 'square', 0.05, 0, 0.06); },
    coin(n) { const f = 1046 * Math.pow(2, (n % 5) / 12); this.tone(f, 0.06, 'square', 0.04); this.tone(f * 1.5, 0.1, 'square', 0.04, 0, 0.05); },
    hit() { this.noise(0.25, 0.25, 600); this.tone(220, 0.25, 'square', 0.08, 80); },
    fall() { this.tone(500, 0.6, 'sine', 0.07, 120, 0.15); },
    power() { [660, 880, 1100, 1320].forEach((f, i) => this.tone(f, 0.08, 'triangle', 0.07, 0, i * 0.05)); },
    pop() { this.noise(0.12, 0.2, 2500); this.tone(900, 0.15, 'sine', 0.08, 300); },
    buy() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.12, 'triangle', 0.1, 0, i * 0.07)); },
    medal() { [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, 0.16, 'triangle', 0.1, 0, i * 0.09)); },
    close() { this.tone(1600, 0.06, 'sine', 0.06); this.tone(2000, 0.06, 'sine', 0.05, 0, 0.05); },
    tick() { this.tone(1100, 0.04, 'square', 0.04); }
  };

  const fx = {
    list: [],
    add(p) { if (this.list.length < 500) this.list.push(p); },
    burst(x, y, n, colors, o = {}) {
      const { speed = 160, life = 0.7, size = 4, gravity = 300, kind = 'sq' } = o;
      for (let i = 0; i < n; i++) { const a = Math.random() * TAU, s = speed * (0.3 + Math.random() * 0.7); this.add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: life * (0.6 + Math.random() * 0.4), max: life, size: size * (0.6 + Math.random() * 0.7), c: colors[(Math.random() * colors.length) | 0], g: gravity, r: Math.random() * 6, vr: (Math.random() - 0.5) * 8, kind }); }
    },
    update(dt, scroll) {
      const Lst = this.list;
      for (let i = Lst.length - 1; i >= 0; i--) {
        const p = Lst[i]; p.life -= dt;
        if (p.life <= 0) { Lst[i] = Lst[Lst.length - 1]; Lst.pop(); continue; }
        const k = Math.exp(-1.5 * dt); p.vx *= k; p.vy = p.vy * k + p.g * dt; p.x += p.vx * dt - (p.scroll ? scroll : 0); p.y += p.vy * dt; p.r += p.vr * dt;
      }
    },
    draw(g) {
      for (const p of this.list) {
        const a = Math.max(0, Math.min(1, p.life / p.max * 1.4));
        g.globalAlpha = a * (p.alpha ?? 1); g.fillStyle = p.c; g.strokeStyle = p.c;
        if (p.kind === 'feather') { g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.beginPath(); g.ellipse(0, 0, p.size * 1.4, p.size * 0.5, 0, 0, TAU); g.fill(); g.restore(); }
        else if (p.kind === 'dot') { g.beginPath(); g.arc(p.x, p.y, p.size * (0.4 + 0.6 * a), 0, TAU); g.fill(); }
        else if (p.kind === 'ring') { g.lineWidth = 1.5; g.beginPath(); g.arc(p.x, p.y, p.size, 0, TAU); g.stroke(); }
        else if (p.kind === 'star') { starPath(g, p.x, p.y, p.size, p.size * 0.4, 4); g.fill(); }
        else if (p.kind === 'heart') { g.save(); g.translate(p.x, p.y); g.scale(p.size / 6, p.size / 6); g.beginPath(); g.moveTo(0, 3); g.bezierCurveTo(-6, -2, -3, -7, 0, -3); g.bezierCurveTo(3, -7, 6, -2, 0, 3); g.fill(); g.restore(); }
        else if (p.kind === 'glow') { const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size); gr.addColorStop(0, p.c); gr.addColorStop(1, 'rgba(255,80,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, p.size, 0, TAU); g.fill(); }
        else { g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7); g.restore(); }
      }
      g.globalAlpha = 1;
    }
  };

  function drawChar(g, id, x, y, rot, wing, s = 1, t = 0, alpha = 1) {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); g.globalAlpha = alpha;
    g.lineJoin = 'round'; g.lineCap = 'round';
    const wingA = -0.9 + wing * 1.5;
    const eye = (ex, ey, r, iris = null, lookX = 1) => {
      g.fillStyle = '#ffffff'; g.beginPath(); g.arc(ex, ey, r, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 0.8; g.stroke();
      if (iris) { g.fillStyle = iris; g.beginPath(); g.arc(ex + lookX * r * 0.2, ey, r * 0.62, 0, TAU); g.fill(); }
      g.fillStyle = '#1a1a22'; g.beginPath(); g.arc(ex + lookX * r * 0.3, ey, r * 0.42, 0, TAU); g.fill();
      g.fillStyle = '#ffffff'; g.beginPath(); g.arc(ex + lookX * r * 0.15, ey - r * 0.3, r * 0.18, 0, TAU); g.fill();
    };
    const body = (c1, c2, rx = 14, ry = 12) => {
      const gr = g.createRadialGradient(-4, -6, 2, 0, 0, rx * 1.2); gr.addColorStop(0, shade(c1, 0.3)); gr.addColorStop(1, c1);
      g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, TAU); g.fill();
      g.strokeStyle = c2; g.lineWidth = 1.6; g.stroke();
    };
    const birdWing = (c, c2) => { g.save(); g.translate(-3, 2); g.rotate(wingA); g.fillStyle = c; g.beginPath(); g.ellipse(-4, 0, 9, 5, 0, 0, TAU); g.fill(); g.strokeStyle = c2; g.lineWidth = 1.2; g.stroke(); g.restore(); };
    const beak = (c) => { g.fillStyle = c; g.beginPath(); g.moveTo(10, -3); g.quadraticCurveTo(20, 0, 10, 4); g.closePath(); g.fill(); g.strokeStyle = shade(c, -0.3); g.lineWidth = 1; g.stroke(); g.beginPath(); g.moveTo(11, 0.5); g.lineTo(17, 0.5); g.stroke(); };
    switch (id) {
      case 'robin':
        g.fillStyle = '#6b4a2f'; g.beginPath(); g.moveTo(-12, -2); g.lineTo(-20, -6); g.lineTo(-19, 2); g.closePath(); g.fill();
        body('#8a5a36', '#4a2e18'); g.fillStyle = '#ff6b3d'; g.beginPath(); g.ellipse(4, 4, 9, 7, -0.3, 0, TAU); g.fill();
        birdWing('#6b4a2f', '#3a2412'); eye(6, -5, 4.2); beak('#f2b33d'); break;
      case 'penguin':
        body('#26283a', '#0e0f18', 13, 13); g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(4, 3, 9, 10, 0, 0, TAU); g.fill();
        g.save(); g.translate(-4, 3); g.rotate(wingA * 0.6 + 0.3); g.fillStyle = '#1a1c2a'; g.beginPath(); g.ellipse(-3, 3, 4, 9, 0.2, 0, TAU); g.fill(); g.restore();
        eye(6, -5, 3.8); g.fillStyle = '#ff9f1c'; g.beginPath(); g.moveTo(11, -2); g.lineTo(19, 1); g.lineTo(11, 3); g.closePath(); g.fill();
        g.fillStyle = '#ff9f1c'; g.beginPath(); g.ellipse(2, 13, 4, 2, 0, 0, TAU); g.ellipse(-5, 13, 4, 2, 0, 0, TAU); g.fill(); break;
      case 'bee':
        g.save(); g.globalAlpha = alpha * 0.6; g.fillStyle = '#e6f6ff'; const bw = Math.sin(t * 60) * 0.5;
        g.beginPath(); g.ellipse(-2, -12, 6, 9, -0.5 + bw, 0, TAU); g.fill(); g.beginPath(); g.ellipse(4, -12, 5, 8, 0.4 - bw, 0, TAU); g.fill(); g.restore();
        body('#ffd23f', '#6b4a00', 14, 11);
        g.save(); g.beginPath(); g.ellipse(0, 0, 14, 11, 0, 0, TAU); g.clip(); g.fillStyle = '#2a2a2a'; g.fillRect(-9, -12, 4, 24); g.fillRect(-1, -12, 4, 24); g.restore();
        g.fillStyle = '#2a2a2a'; g.beginPath(); g.moveTo(-14, -1); g.lineTo(-20, 1); g.lineTo(-14, 3); g.fill();
        eye(8, -3, 3.8); g.strokeStyle = '#2a2a2a'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(8, -9); g.quadraticCurveTo(10, -16, 14, -16); g.moveTo(5, -10); g.quadraticCurveTo(5, -17, 9, -18); g.stroke(); break;
      case 'bat':
        g.save(); g.translate(0, -2); for (const sd of [-1, 1]) { g.save(); g.scale(sd, 1); g.rotate(-wingA * 0.7); g.fillStyle = '#4a2f6a'; g.beginPath(); g.moveTo(2, 0); g.lineTo(22, -10); g.quadraticCurveTo(18, -2, 20, 4); g.quadraticCurveTo(14, 0, 12, 6); g.quadraticCurveTo(8, 2, 4, 6); g.closePath(); g.fill(); g.restore(); } g.restore();
        body('#5b3f7d', '#2a1640', 12, 11);
        g.fillStyle = '#5b3f7d'; g.beginPath(); g.moveTo(-6, -8); g.lineTo(-8, -17); g.lineTo(-1, -10); g.moveTo(3, -10); g.lineTo(5, -18); g.lineTo(8, -8); g.fill();
        eye(-2, -2, 3.4, '#ffd23f'); eye(6, -2, 3.4, '#ffd23f');
        g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(0, 5); g.lineTo(1.5, 8); g.lineTo(3, 5); g.moveTo(4, 5); g.lineTo(5.5, 8); g.lineTo(7, 5); g.fill(); break;
      case 'owl':
        body('#9a6b45', '#5a3a1e', 13, 14); g.fillStyle = '#e9d2a8'; g.beginPath(); g.ellipse(2, 5, 8, 8, 0, 0, TAU); g.fill();
        g.fillStyle = '#7a5030'; g.beginPath(); g.moveTo(-9, -10); g.lineTo(-11, -19); g.lineTo(-3, -12); g.moveTo(5, -12); g.lineTo(9, -19); g.lineTo(10, -9); g.fill();
        birdWing('#7a5030', '#4a2e18'); eye(-1, -4, 5, '#ffb703'); eye(8, -4, 5, '#ffb703');
        g.fillStyle = '#f29f05'; g.beginPath(); g.moveTo(3, 0); g.lineTo(6, 0); g.lineTo(4.5, 4); g.closePath(); g.fill(); break;
      case 'ghost': {
        g.globalAlpha = alpha * 0.92; g.fillStyle = '#f5f7ff'; g.strokeStyle = '#b9c3e6'; g.lineWidth = 1.4;
        g.beginPath(); g.arc(0, -2, 13, Math.PI, 0); g.lineTo(13, 10);
        for (let i = 0; i < 5; i++) { const xx = 13 - (i + 1) * 5.2; g.quadraticCurveTo(xx + 2.6, 10 + 4 * Math.sin(t * 8 + i), xx, 10); }
        g.closePath(); g.fill(); g.stroke();
        g.fillStyle = '#f5f7ff'; g.beginPath(); g.ellipse(-12, 2, 5, 3, wingA * 0.6, 0, TAU); g.fill(); g.stroke();
        g.fillStyle = '#2a2f4a'; g.beginPath(); g.ellipse(2, -4, 2.6, 3.6, 0, 0, TAU); g.ellipse(9, -4, 2.6, 3.6, 0, 0, TAU); g.fill();
        g.beginPath(); g.ellipse(6, 4, 2.2, 2.8, 0, 0, TAU); g.fill();
        g.fillStyle = 'rgba(255,140,170,.5)'; g.beginPath(); g.arc(-3, 1, 2.4, 0, TAU); g.fill(); break;
      }
      case 'dragon':
        g.fillStyle = '#3e9a4a'; g.beginPath(); g.moveTo(-12, 0); g.quadraticCurveTo(-22, 6, -24, -2); g.lineTo(-20, 0); g.quadraticCurveTo(-18, -4, -12, -4); g.fill();
        g.save(); g.translate(-2, -6); g.rotate(wingA * 0.8 - 0.3); g.fillStyle = '#2f7d3a'; g.beginPath(); g.moveTo(0, 0); g.lineTo(-6, -16); g.lineTo(-10, -6); g.lineTo(-16, -8); g.lineTo(-10, 2); g.closePath(); g.fill(); g.restore();
        body('#4cbf5a', '#21612a', 14, 11); g.fillStyle = '#ffe08a'; g.beginPath(); g.ellipse(4, 5, 8, 5, 0, 0, TAU); g.fill();
        g.fillStyle = '#ff9f43'; for (const xx of [-8, -3, 2]) { g.beginPath(); g.moveTo(xx, -10); g.lineTo(xx + 2.5, -15); g.lineTo(xx + 5, -10); g.fill(); }
        g.fillStyle = '#ffe08a'; g.beginPath(); g.moveTo(6, -10); g.lineTo(5, -17); g.lineTo(9, -10); g.fill();
        g.fillStyle = '#4cbf5a'; g.beginPath(); g.ellipse(13, 0, 6, 4.5, 0, 0, TAU); g.fill(); g.strokeStyle = '#21612a'; g.lineWidth = 1.2; g.stroke();
        g.fillStyle = '#21612a'; g.beginPath(); g.arc(16, -1, 0.9, 0, TAU); g.fill();
        eye(7, -5, 3.8, '#ff9f1c'); break;
      case 'robot': {
        g.save(); g.translate(0, -15); g.fillStyle = '#7a8796'; g.fillRect(-1, 0, 2, 4); const pr = Math.cos(t * 40); g.fillStyle = '#c8d2dc'; g.beginPath(); g.ellipse(0, 0, 12 * Math.abs(pr) + 1, 2.2, 0, 0, TAU); g.fill(); g.restore();
        const gr = g.createLinearGradient(0, -12, 0, 12); gr.addColorStop(0, '#dde4ec'); gr.addColorStop(1, '#8e9aa8');
        g.fillStyle = gr; rrect(g, -13, -11, 26, 23, 6); g.fill(); g.strokeStyle = '#56616e'; g.lineWidth = 1.6; g.stroke();
        g.fillStyle = '#1d2a36'; rrect(g, -2, -7, 13, 9, 3); g.fill();
        g.fillStyle = '#4fd1ff'; g.fillRect(1, -5, 2.6, 4); g.fillRect(6, -5, 2.6, 4);
        g.fillStyle = '#ff6b6b'; g.beginPath(); g.arc(-8, 6, 1.8, 0, TAU); g.fill(); g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(-3, 6, 1.8, 0, TAU); g.fill();
        g.save(); g.translate(-12, 2); g.rotate(wingA * 0.5); g.fillStyle = '#8e9aa8'; g.fillRect(-7, -2, 7, 4); g.restore(); break;
      }
      case 'ufo': {
        g.fillStyle = 'rgba(160,230,255,.55)'; g.beginPath(); g.ellipse(0, -4, 8, 8, 0, Math.PI, 0); g.fill();
        g.fillStyle = '#7bea8b'; g.beginPath(); g.arc(0, -4, 4, 0, TAU); g.fill(); g.fillStyle = '#1a1a22'; g.beginPath(); g.ellipse(-1.4, -5, 1, 1.6, 0, 0, TAU); g.ellipse(1.6, -5, 1, 1.6, 0, 0, TAU); g.fill();
        g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1.2; g.beginPath(); g.ellipse(0, -4, 8, 8, 0, Math.PI * 1.1, Math.PI * 1.4); g.stroke();
        const gr = g.createLinearGradient(0, -4, 0, 6); gr.addColorStop(0, '#d8dde6'); gr.addColorStop(1, '#6a7484');
        g.fillStyle = gr; g.beginPath(); g.ellipse(0, 1, 17, 6, 0, 0, TAU); g.fill(); g.strokeStyle = '#4a5260'; g.stroke();
        for (let i = 0; i < 5; i++) { g.fillStyle = (Math.floor(t * 8) + i) % 2 ? '#ffd23f' : '#ff6b9a'; g.beginPath(); g.arc(-12 + i * 6, 2, 1.6, 0, TAU); g.fill(); }
        break;
      }
      case 'parrot':
        g.fillStyle = '#2d7fe0'; g.beginPath(); g.moveTo(-11, 0); g.lineTo(-24, 4); g.lineTo(-22, -2); g.lineTo(-12, -4); g.fill(); g.fillStyle = '#ffd23f'; g.beginPath(); g.moveTo(-11, 2); g.lineTo(-22, 8); g.lineTo(-12, -1); g.fill();
        body('#e8322f', '#8a1612'); g.save(); g.translate(-3, 2); g.rotate(wingA); g.fillStyle = '#2d7fe0'; g.beginPath(); g.ellipse(-4, 0, 9, 5, 0, 0, TAU); g.fill(); g.fillStyle = '#ffd23f'; g.beginPath(); g.ellipse(-8, 0, 5, 3.5, 0, 0, TAU); g.fill(); g.restore();
        g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(7, -4, 5.5, 5, 0, 0, TAU); g.fill(); eye(7, -4, 3.4);
        g.fillStyle = '#3a3a3a'; g.beginPath(); g.moveTo(11, -4); g.quadraticCurveTo(20, -4, 16, 6); g.quadraticCurveTo(14, 1, 11, 2); g.closePath(); g.fill(); break;
      case 'phoenix': {
        for (let i = 0; i < 4; i++) { const w = Math.sin(t * 10 + i) * 3; g.fillStyle = ['#ff3b1f', '#ff7a1a', '#ffb703', '#ffe066'][i]; g.beginPath(); g.moveTo(-10, -1 + i); g.quadraticCurveTo(-22, -8 + i * 4 + w, -30 + i * 2, -2 + i * 4 + w); g.quadraticCurveTo(-20, 2 + i * 2, -10, 3); g.fill(); }
        const gl = g.createRadialGradient(0, 0, 4, 0, 0, 24); gl.addColorStop(0, 'rgba(255,180,60,.45)'); gl.addColorStop(1, 'rgba(255,120,0,0)'); g.fillStyle = gl; g.beginPath(); g.arc(0, 0, 24, 0, TAU); g.fill();
        body('#ff6a1f', '#9a2a00'); g.fillStyle = '#ffd23f'; g.beginPath(); g.ellipse(4, 4, 8, 6, -0.3, 0, TAU); g.fill();
        g.save(); g.translate(-3, 1); g.rotate(wingA); g.fillStyle = '#ffb703'; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-8, -10, -16, -6); g.quadraticCurveTo(-10, -2, -14, 2); g.quadraticCurveTo(-6, 4, 0, 3); g.fill(); g.restore();
        g.fillStyle = '#ffd23f'; for (const xx of [-2, 2, 6]) { g.beginPath(); g.moveTo(xx, -10); g.quadraticCurveTo(xx - 3, -18, xx + 1, -20); g.quadraticCurveTo(xx + 1, -14, xx + 3, -10); g.fill(); }
        eye(6, -5, 3.8, '#ff3b1f'); beak('#ffe066'); break;
      }
      default:
        g.fillStyle = '#f4a91c'; g.beginPath(); g.moveTo(-12, -1); g.lineTo(-19, -5); g.lineTo(-18, 3); g.closePath(); g.fill();
        body('#ffd23f', '#c98a00'); g.fillStyle = '#fff1b8'; g.beginPath(); g.ellipse(4, 5, 8, 5.5, -0.2, 0, TAU); g.fill();
        g.fillStyle = '#ffd23f'; g.beginPath(); g.moveTo(-1, -11); g.quadraticCurveTo(-3, -17, 1, -16); g.quadraticCurveTo(2, -13, 3, -11); g.fill();
        birdWing('#f4b91c', '#c98a00'); eye(6, -5, 4.4); beak('#ff8a1c');
        g.fillStyle = 'rgba(255,120,120,.45)'; g.beginPath(); g.arc(3, 2, 2.4, 0, TAU); g.fill();
    }
    g.restore();
  }

  function powerIcon(g, kind, x, y, r, t = 0) {
    const P = D.POWERS[kind];
    g.save(); g.translate(x, y);
    const gr = g.createRadialGradient(-r * 0.3, -r * 0.4, r * 0.1, 0, 0, r); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, P.color);
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill(); g.strokeStyle = shade(P.color, -0.35); g.lineWidth = r * 0.12; g.stroke();
    const k = r / 12; g.scale(k, k); g.lineCap = 'round'; g.lineJoin = 'round';
    if (kind === 'shield') { g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 6.5, 0, TAU); g.stroke(); g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.ellipse(-2.5, -2.5, 2, 1.2, -0.7, 0, TAU); g.fill(); }
    else if (kind === 'magnet') { g.strokeStyle = '#c62828'; g.lineWidth = 3.4; g.beginPath(); g.arc(0, -0.5, 4.5, Math.PI, 0); g.lineTo(4.5, 5); g.moveTo(-4.5, -0.5); g.lineTo(-4.5, 5); g.stroke(); g.strokeStyle = '#eceff1'; g.beginPath(); g.moveTo(-4.5, 4); g.lineTo(-4.5, 7); g.moveTo(4.5, 4); g.lineTo(4.5, 7); g.stroke(); }
    else if (kind === 'slow') { g.strokeStyle = '#4a3a8a'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(-5, -7); g.lineTo(5, -7); g.lineTo(-5, 7); g.lineTo(5, 7); g.closePath(); g.stroke(); g.fillStyle = '#ffd23f'; g.beginPath(); g.moveTo(-3, 6); g.lineTo(3, 6); g.lineTo(0, 2); g.fill(); }
    else if (kind === 'tiny') { g.strokeStyle = '#1f7a35'; g.lineWidth = 2; g.beginPath(); g.moveTo(-7, -7); g.lineTo(-2, -2); g.moveTo(-2, -6); g.lineTo(-2, -2); g.lineTo(-6, -2); g.moveTo(7, 7); g.lineTo(2, 2); g.moveTo(2, 6); g.lineTo(2, 2); g.lineTo(6, 2); g.stroke(); }
    g.restore(); void t;
  }

  function coin(g, x, y, t, s = 1) {
    const w = Math.abs(Math.cos(t * 4)) * 0.85 + 0.15;
    g.save(); g.translate(x, y); g.scale(w * s, s);
    g.fillStyle = '#c98a00'; g.beginPath(); g.arc(0, 1, 8, 0, TAU); g.fill();
    const gr = g.createRadialGradient(-3, -3, 1, 0, 0, 9); gr.addColorStop(0, '#fff3b0'); gr.addColorStop(0.6, '#ffc933'); gr.addColorStop(1, '#e0a000');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 8, 0, TAU); g.fill();
    if (w > 0.4) { g.fillStyle = 'rgba(255,255,255,.8)'; starPath(g, 0, 0, 4, 1.8, 5); g.fill(); }
    g.restore();
  }

  let pal = null, palKey = '';
  function palette(world, night) {
    const key = world.id + '|' + night.toFixed(2);
    if (key === palKey) return pal;
    palKey = key; pal = {};
    for (const k in world.day) pal[k] = mixHex(world.day[k], world.night[k], night);
    return pal;
  }
  const layerCache = {};
  function layerItems(world, kind, n) {
    const key = world.id + kind;
    if (layerCache[key]) return layerCache[key];
    const r = mulberry(hashStr(key));
    const items = Array.from({ length: n }, (_, i) => ({ x: (i + r() * 0.6) * L / n, h: r(), w: r(), s: r() }));
    layerCache[key] = items;
    return items;
  }
  const tiles = (off, f) => { const o = ((off % L) + L) % L; f(-o); f(-o + L); };

  function drawWorld(g, world, scroll, night, t) {
    const p = palette(world, night);
    const sky = g.createLinearGradient(0, 0, 0, GY);
    sky.addColorStop(0, p.top); sky.addColorStop(1, p.bot);
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    if (night > 0.05 || world.id === 'space') {
      const sr = mulberry(77), a = world.id === 'space' ? Math.max(0.6, night) : night;
      for (let i = 0; i < 60; i++) { const x = (sr() * W * 1.5 - scroll * 0.02) % W, y = sr() * (GY - 120), tw = 0.5 + 0.5 * Math.sin(t * 2 + i); g.fillStyle = `rgba(255,255,255,${a * (0.35 + 0.65 * tw)})`; g.beginPath(); g.arc((x + W) % W, y, 0.5 + sr() * 1.2, 0, TAU); g.fill(); }
    }
    const cyc = save.sky === 'cycle' ? (t / 70) % 1 : save.sky === 'night' ? 0.5 : 0;
    if (world.id !== 'ocean') {
      const sa = cyc * TAU, sx = W * 0.5 + Math.sin(sa) * W * 0.32, sy = 60 + (1 - Math.cos(sa)) * 0 + Math.abs(Math.sin(sa)) * 30 + (1 - night) * 10;
      if (night < 0.9) { const sunY = 70 + night * 200; const gr = g.createRadialGradient(W * 0.78, sunY, 4, W * 0.78, sunY, 60); gr.addColorStop(0, `rgba(255,240,180,${(1 - night) * 0.9})`); gr.addColorStop(1, 'rgba(255,240,180,0)'); g.fillStyle = gr; g.beginPath(); g.arc(W * 0.78, sunY, 60, 0, TAU); g.fill(); g.fillStyle = `rgba(255,236,150,${1 - night})`; g.beginPath(); g.arc(W * 0.78, sunY, 20, 0, TAU); g.fill(); }
      if (night > 0.1) { const my = 260 - night * 190; g.fillStyle = `rgba(240,244,255,${night})`; g.beginPath(); g.arc(W * 0.22, my, 16, 0, TAU); g.fill(); g.fillStyle = `rgba(200,210,235,${night * 0.6})`; g.beginPath(); g.arc(W * 0.22 - 5, my - 3, 3.5, 0, TAU); g.arc(W * 0.22 + 4, my + 5, 2.5, 0, TAU); g.fill(); }
      void sx; void sy;
    } else {
      g.save(); g.globalAlpha = 0.12 * (1 - night * 0.7); g.fillStyle = '#ffffff';
      for (let i = 0; i < 5; i++) { const x = ((i * 90 - scroll * 0.05) % (W + 80) + W + 80) % (W + 80) - 40; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 40, 0); g.lineTo(x - 30 + Math.sin(t + i) * 10, GY); g.lineTo(x - 70, GY); g.fill(); }
      g.restore();
    }
    g.fillStyle = p.cloud;
    const cl = layerItems(world, 'clouds', 6);
    tiles(scroll * 0.08, (ox) => cl.forEach((c) => {
      const x = ox + c.x, y = 40 + c.h * 140, s = 0.6 + c.s * 0.7;
      if (x < -80 || x > W + 80) return;
      g.globalAlpha = world.id === 'ocean' ? 0.35 : world.id === 'space' ? 0.25 : 0.85;
      if (world.id === 'ocean') { g.strokeStyle = p.cloud; g.lineWidth = 1.5; for (const [bx, by, br] of [[0, 0, 6], [14, 20, 4], [-10, 40, 3]]) { g.beginPath(); g.arc(x + bx * s, y + by - (t * 20) % 40, br * s, 0, TAU); g.stroke(); } }
      else if (world.id === 'space') { g.beginPath(); g.ellipse(x, y, 60 * s, 18 * s, 0.3, 0, TAU); g.fill(); }
      else { g.beginPath(); g.arc(x, y, 16 * s, 0, TAU); g.arc(x + 18 * s, y - 6 * s, 20 * s, 0, TAU); g.arc(x + 38 * s, y, 15 * s, 0, TAU); g.rect(x, y - 2, 38 * s, 16 * s); g.fill(); }
    }));
    g.globalAlpha = 1;
    drawFar(g, world, p, scroll * 0.22, night, t);
    drawNear(g, world, p, scroll * 0.5, night, t);
  }
  function wave(x, base, a1, a2, k1 = 3, k2 = 7) { return base - a1 * Math.sin(TAU * x * k1 / L) - a2 * Math.sin(TAU * x * k2 / L + 1); }
  function drawFar(g, world, p, off, night, t) {
    g.fillStyle = p.far;
    const kind = world.far;
    if (kind === 'hills' || kind === 'dunes' || kind === 'cream' || kind === 'reef') {
      const base = GY - (kind === 'dunes' ? 50 : 70), a1 = kind === 'cream' ? 14 : 24, a2 = kind === 'reef' ? 18 : 10;
      g.beginPath(); g.moveTo(0, GY);
      for (let x = 0; x <= W; x += 8) { const wx = x + off; let y = wave(wx, base, a1, a2, kind === 'dunes' ? 2 : 3, kind === 'cream' ? 12 : 7); if (kind === 'cream') y += Math.abs(Math.sin(TAU * wx * 10 / L)) * -8; g.lineTo(x, y); }
      g.lineTo(W, GY); g.closePath(); g.fill();
      if (kind === 'cream') { g.fillStyle = '#fff6e8'; g.globalAlpha = 0.6; tiles(off, (ox) => { for (let i = 0; i < 10; i++) { const x = ox + i * 64 + 20; if (x < -30 || x > W + 30) continue; g.beginPath(); g.arc(x, wave(x - ox, GY - 70, 14, 10, 3, 12) - 4, 9, 0, TAU); g.fill(); } }); g.globalAlpha = 1; }
    } else if (kind === 'sea') {
      g.fillRect(0, GY - 70, W, 70);
      g.fillStyle = shade(p.far, -0.2); g.beginPath(); g.moveTo(0, GY - 70);
      tiles(off * 0.5, (ox) => { const x = ox + 380; if (x > -120 && x < W + 120) { g.moveTo(x - 80, GY - 70); g.quadraticCurveTo(x, GY - 110, x + 80, GY - 70); } });
      g.fill();
      g.strokeStyle = `rgba(255,255,255,${0.35 - night * 0.2})`; g.lineWidth = 1.5;
      for (let i = 0; i < 8; i++) { const y = GY - 60 + i * 7, x = ((i * 53 - off * (1 + i * 0.1)) % W + W) % W; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 20 + i * 3, y); g.stroke(); }
    } else if (kind === 'skyline' || kind === 'peaks') {
      const items = layerItems(world, kind, kind === 'peaks' ? 6 : 14);
      tiles(off, (ox) => items.forEach((b, i) => {
        const x = ox + b.x;
        if (kind === 'peaks') {
          const w = 90 + b.w * 70, h = 90 + b.h * 90; if (x + w < 0 || x - w > W) return;
          g.fillStyle = p.far; g.beginPath(); g.moveTo(x - w, GY); g.lineTo(x, GY - h); g.lineTo(x + w, GY); g.fill();
          g.fillStyle = mixHex('#ffffff', p.far, night * 0.5); g.beginPath(); g.moveTo(x - w * 0.3, GY - h * 0.7); g.lineTo(x, GY - h); g.lineTo(x + w * 0.3, GY - h * 0.7); g.lineTo(x + w * 0.1, GY - h * 0.74); g.lineTo(x - w * 0.05, GY - h * 0.66); g.closePath(); g.fill();
        } else {
          const w = 26 + b.w * 22, h = 60 + b.h * 120; if (x + w < 0 || x > W) return;
          g.fillStyle = p.far; g.fillRect(x, GY - h, w, h);
          if (night > 0.2) { g.fillStyle = `rgba(255,220,120,${night * 0.6})`; for (let wy = GY - h + 8; wy < GY - 10; wy += 10) for (let wx = x + 4; wx < x + w - 4; wx += 7) if (((wx * 7 + wy * 13 + i) | 0) % 3 === 0) g.fillRect(wx, wy, 3, 4); }
        }
      }));
    } else if (kind === 'planets') {
      const x = ((W * 0.7 - off * 0.4) % (W + 200) + W + 200) % (W + 200) - 100, y = 150;
      const gr = g.createRadialGradient(x - 15, y - 15, 5, x, y, 50); gr.addColorStop(0, shade(p.far, 0.4)); gr.addColorStop(1, p.far);
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, 46, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(255,220,180,.6)'; g.lineWidth = 5; g.beginPath(); g.ellipse(x, y, 78, 16, -0.3, 0, TAU); g.stroke();
      g.fillStyle = '#ffb3c7'; g.beginPath(); g.arc(((W * 0.2 - off * 0.25) % (W + 60) + W + 60) % (W + 60) - 30, 300, 12, 0, TAU); g.fill();
      g.fillStyle = shade(p.near, -0.1); g.beginPath(); g.moveTo(0, GY);
      for (let x2 = 0; x2 <= W; x2 += 8) g.lineTo(x2, wave(x2 + off, GY - 30, 10, 6));
      g.lineTo(W, GY); g.fill();
    }
  }
  function drawNear(g, world, p, off, night, t) {
    const kind = world.near;
    const items = layerItems(world, kind, kind === 'buildings' ? 10 : kind === 'asteroids' ? 7 : 9);
    tiles(off, (ox) => items.forEach((b, i) => {
      const x = ox + b.x;
      if (x < -70 || x > W + 70) return;
      g.fillStyle = p.near;
      if (kind === 'trees') {
        const h = 24 + b.h * 26, r = 14 + b.w * 10;
        g.fillStyle = shade(p.near, -0.35); g.fillRect(x - 3, GY - h, 6, h);
        g.fillStyle = p.near; g.beginPath(); g.arc(x, GY - h - r * 0.4, r, 0, TAU); g.arc(x - r * 0.7, GY - h + r * 0.2, r * 0.7, 0, TAU); g.arc(x + r * 0.7, GY - h + r * 0.2, r * 0.7, 0, TAU); g.fill();
        g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.arc(x - r * 0.3, GY - h - r * 0.7, r * 0.4, 0, TAU); g.fill();
      } else if (kind === 'palms') {
        const h = 50 + b.h * 40, lean = (b.w - 0.5) * 30;
        g.strokeStyle = shade(p.near, 0.15); g.lineWidth = 5; g.beginPath(); g.moveTo(x, GY); g.quadraticCurveTo(x + lean * 0.3, GY - h * 0.6, x + lean, GY - h); g.stroke();
        g.fillStyle = p.near; for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k - 2) * 0.7 + Math.sin(t * 1.5 + i) * 0.05; g.save(); g.translate(x + lean, GY - h); g.rotate(a); g.beginPath(); g.ellipse(14, 0, 16, 4, 0.3, 0, TAU); g.fill(); g.restore(); }
      } else if (kind === 'buildings') {
        const w = 30 + b.w * 30, h = 40 + b.h * 90;
        g.fillRect(x, GY - h, w, h);
        g.fillStyle = shade(p.near, 0.12); g.fillRect(x, GY - h, w, 4);
        const lit = night > 0.3;
        for (let wy = GY - h + 10; wy < GY - 8; wy += 12) for (let wx = x + 5; wx < x + w - 6; wx += 9) { const on = ((wx * 3 + wy * 5 + i * 7) | 0) % 4 !== 0; g.fillStyle = lit && on ? `rgba(255,214,110,${0.4 + night * 0.5})` : 'rgba(255,255,255,.12)'; g.fillRect(wx, wy, 4, 6); }
        if (night > 0.4 && i % 3 === 0) { g.fillStyle = i % 2 ? '#ff3fb4' : '#3fe0ff'; g.globalAlpha = night * (0.7 + 0.3 * Math.sin(t * 6 + i)); rrect(g, x + 4, GY - h - 14, w - 8, 9, 4); g.fill(); g.globalAlpha = 1; }
      } else if (kind === 'pines') {
        const h = 40 + b.h * 40, w = 16 + b.w * 8;
        g.fillStyle = shade(p.near, -0.3); g.fillRect(x - 2, GY - 8, 4, 8);
        g.fillStyle = p.near; for (let k = 0; k < 3; k++) { const yy = GY - 6 - k * h * 0.3; g.beginPath(); g.moveTo(x - w * (1 - k * 0.2), yy); g.lineTo(x, yy - h * 0.5); g.lineTo(x + w * (1 - k * 0.2), yy); g.fill(); }
        g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.moveTo(x - 5, GY - 6 - h * 0.6 - 2); g.lineTo(x, GY - 6 - h * 0.6 - h * 0.5 + 6); g.lineTo(x + 5, GY - 6 - h * 0.6 - 2); g.fill();
      } else if (kind === 'cacti') {
        const h = 26 + b.h * 30;
        g.fillStyle = mixHex('#4f9a4a', '#1f3a2a', night); rrect(g, x - 5, GY - h, 10, h, 5); g.fill();
        rrect(g, x - 14, GY - h * 0.7, 6, h * 0.35, 3); g.fill(); g.fillRect(x - 12, GY - h * 0.4, 8, 5);
        rrect(g, x + 8, GY - h * 0.85, 6, h * 0.3, 3); g.fill(); g.fillRect(x + 4, GY - h * 0.6, 8, 5);
      } else if (kind === 'kelp') {
        g.strokeStyle = p.near; g.lineWidth = 6; const h = 60 + b.h * 70;
        g.beginPath(); g.moveTo(x, GY); for (let k = 1; k <= 8; k++) g.lineTo(x + Math.sin(t * 1.6 + k * 0.7 + i) * (k * 1.5), GY - h * k / 8); g.stroke();
        g.fillStyle = p.near; for (let k = 2; k <= 7; k += 2) { const yy = GY - h * k / 8, xx = x + Math.sin(t * 1.6 + k * 0.7 + i) * (k * 1.5); g.beginPath(); g.ellipse(xx + 6, yy, 7, 3, -0.5, 0, TAU); g.fill(); }
      } else if (kind === 'lollies') {
        const h = 40 + b.h * 40, r = 10 + b.w * 6;
        g.fillStyle = mixHex('#ffffff', '#c8b8c8', night); g.fillRect(x - 2, GY - h, 4, h);
        g.fillStyle = ['#ff6fa8', '#7ad7ff', '#ffd23f', '#b38cff'][i % 4]; g.globalAlpha = 1 - night * 0.4; g.beginPath(); g.arc(x, GY - h, r, 0, TAU); g.fill();
        g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 2; g.beginPath(); for (let a = 0; a < 10; a += 0.4) g.lineTo(x + Math.cos(a) * a * r / 10, GY - h + Math.sin(a) * a * r / 10); g.stroke(); g.globalAlpha = 1;
      } else if (kind === 'asteroids') {
        const y = 200 + b.h * 200, r = 8 + b.w * 14;
        g.fillStyle = p.near; g.beginPath(); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + t * 0.2 * (i % 2 ? 1 : -1), rr = r * (0.8 + 0.2 * Math.sin(k * 3 + i)); g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill();
        g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.2, r * 0.25, 0, TAU); g.fill();
      }
    }));
  }
  function drawGround(g, world, p, off, night) {
    const kind = world.ground;
    g.fillStyle = p.ground; g.fillRect(0, GY, W, H - GY);
    g.fillStyle = p.grass; g.fillRect(0, GY, W, 12);
    const o = ((off % 24) + 24) % 24;
    if (kind === 'grass') { g.fillStyle = shade(p.grass, -0.15); for (let x = -o; x < W; x += 24) { g.beginPath(); g.moveTo(x, GY + 12); g.lineTo(x + 12, GY); g.lineTo(x + 20, GY); g.lineTo(x + 8, GY + 12); g.fill(); } }
    else if (kind === 'road') { g.fillStyle = mixHex('#ffffff', '#ffd23f', night); for (let x = -((off % 48) + 48) % 48; x < W; x += 48) g.fillRect(x, GY + 34, 24, 4); }
    else if (kind === 'snow') { g.fillStyle = 'rgba(120,170,210,.25)'; for (let x = -o; x < W; x += 24) { g.beginPath(); g.ellipse(x + 12, GY + 30, 10, 3, 0, 0, TAU); g.fill(); } }
    else if (kind === 'cake') { g.fillStyle = mixHex('#ffffff', '#c8b8c8', night); g.fillRect(0, GY + 26, W, 8); g.fillStyle = mixHex('#8a4a2a', '#3a2a1a', night); g.fillRect(0, GY + 44, W, 10); g.fillStyle = '#ff6fa8'; for (let x = -o; x < W; x += 24) { g.beginPath(); g.arc(x + 6, GY + 6, 6, 0, Math.PI); g.fill(); } }
    else if (kind === 'moon') { g.fillStyle = 'rgba(0,0,0,.18)'; for (let x = -((off % 80) + 80) % 80; x < W; x += 80) { g.beginPath(); g.ellipse(x + 20, GY + 32, 14, 5, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(x + 58, GY + 52, 8, 3, 0, 0, TAU); g.fill(); } }
    else { g.fillStyle = 'rgba(0,0,0,.08)'; for (let x = -o; x < W; x += 24) { g.beginPath(); g.arc(x + 8, GY + 28, 2, 0, TAU); g.arc(x + 18, GY + 46, 1.5, 0, TAU); g.fill(); } if (kind === 'seabed') { g.fillStyle = '#ffd1dc'; for (let x = -((off % 96) + 96) % 96; x < W; x += 96) { g.beginPath(); g.arc(x + 30, GY + 22, 4, Math.PI, 0); g.fill(); } } }
    g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(0, GY + 12, W, 3);
  }

  function drawPipe(g, world, p, x, y0, y1, capAtBottom, night, t) {
    const style = world.pipe, h = y1 - y0;
    if (h <= 0) return;
    const gr = g.createLinearGradient(x, 0, x + PW, 0);
    gr.addColorStop(0, shade(p.pipe, 0.25)); gr.addColorStop(0.35, p.pipe); gr.addColorStop(1, p.pipeDark);
    g.save();
    if (style === 'cane') {
      g.fillStyle = '#ffffff'; g.fillRect(x + 6, y0, PW - 12, h);
      g.save(); g.beginPath(); g.rect(x + 6, y0, PW - 12, h); g.clip(); g.fillStyle = p.pipeDark;
      for (let yy = y0 - 60; yy < y1 + 60; yy += 26) { g.beginPath(); g.moveTo(x, yy); g.lineTo(x + PW, yy - 22); g.lineTo(x + PW, yy - 10); g.lineTo(x, yy + 12); g.fill(); }
      g.restore();
      g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x + 10, y0, 5, h);
      const cy = capAtBottom ? y1 : y0;
      g.strokeStyle = '#ffffff'; g.lineWidth = PW - 12; g.lineCap = 'butt';
      g.fillStyle = '#ffffff'; rrect(g, x + 2, capAtBottom ? cy - 14 : cy, PW - 4, 14, 7); g.fill(); g.fillStyle = p.pipeDark; g.fillRect(x + 2, capAtBottom ? cy - 9 : cy + 5, PW - 4, 4);
      g.restore(); return;
    }
    g.fillStyle = gr;
    if (style === 'coral') { rrect(g, x + 6, y0 - 6, PW - 12, h + 12, 14); g.fill(); g.fillStyle = 'rgba(255,255,255,.18)'; for (let yy = y0 + 10; yy < y1; yy += 22) { g.beginPath(); g.arc(x + 14 + (yy % 3) * 8, yy, 4, 0, TAU); g.fill(); } }
    else if (style === 'ice') { g.globalAlpha = 0.9; g.fillRect(x + 4, y0, PW - 8, h); g.globalAlpha = 1; g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.moveTo(x + 10, y0); g.lineTo(x + 18, y0); g.lineTo(x + 12, y1); g.lineTo(x + 8, y1); g.fill(); }
    else g.fillRect(x + 4, y0, PW - 8, h);
    if (style === 'post') { g.strokeStyle = 'rgba(60,30,10,.35)'; g.lineWidth = 2; for (let yy = y0 + 14; yy < y1; yy += 28) { g.beginPath(); g.moveTo(x + 4, yy); g.lineTo(x + PW - 4, yy); g.stroke(); } g.fillStyle = 'rgba(60,30,10,.4)'; for (let yy = y0 + 22; yy < y1; yy += 56) { g.beginPath(); g.arc(x + 14, yy, 2, 0, TAU); g.arc(x + PW - 14, yy, 2, 0, TAU); g.fill(); } }
    else if (style === 'tower') { for (let yy = y0 + 8; yy < y1 - 6; yy += 14) for (let xx = x + 10; xx < x + PW - 10; xx += 10) { const on = ((xx + yy) | 0) % 3 !== 0; g.fillStyle = night > 0.3 && on ? `rgba(120,240,255,${0.3 + night * 0.6})` : 'rgba(255,255,255,.15)'; g.fillRect(xx, yy, 5, 7); } }
    else if (style === 'column') { g.strokeStyle = 'rgba(90,50,20,.3)'; g.lineWidth = 2; for (let xx = x + 14; xx < x + PW - 8; xx += 9) { g.beginPath(); g.moveTo(xx, y0); g.lineTo(xx, y1); g.stroke(); } }
    else if (style === 'pylon') { g.fillStyle = `rgba(120,255,220,${0.4 + 0.4 * Math.sin(t * 4)})`; g.fillRect(x + PW / 2 - 2, y0, 4, h); g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = 1.5; for (let yy = y0; yy < y1 - 20; yy += 20) { g.beginPath(); g.moveTo(x + 4, yy); g.lineTo(x + PW - 4, yy + 20); g.stroke(); } }
    else if (style === 'pipe') { g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(x + 10, y0, 5, h); }
    const capH = 22, cy = capAtBottom ? y1 - capH : y0;
    if (style === 'coral') { g.fillStyle = shade(p.pipe, 0.1); for (const dx of [10, 28, 44]) { g.beginPath(); g.arc(x + dx, capAtBottom ? y1 : y0, 9, 0, TAU); g.fill(); } }
    else if (style === 'ice') { g.fillStyle = shade(p.pipe, 0.3); rrect(g, x, cy, PW, capH, 6); g.fill(); g.fillStyle = 'rgba(255,255,255,.8)'; const yy = capAtBottom ? y1 : y0; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(x + 8 + k * 12, yy); g.lineTo(x + 14 + k * 12, yy); g.lineTo(x + 11 + k * 12, yy + (capAtBottom ? 12 : -12)); g.fill(); } }
    else {
      const cg = g.createLinearGradient(x - 3, 0, x + PW + 3, 0);
      cg.addColorStop(0, shade(p.pipe, 0.3)); cg.addColorStop(0.35, shade(p.pipe, 0.05)); cg.addColorStop(1, shade(p.pipeDark, -0.1));
      g.fillStyle = cg; rrect(g, x - 3, cy, PW + 6, capH, style === 'column' ? 2 : 5); g.fill();
      g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 1.5; g.stroke();
      if (style === 'tower') { g.strokeStyle = shade(p.pipe, 0.3); g.lineWidth = 2; const ay = capAtBottom ? y1 : y0; g.beginPath(); g.moveTo(x + PW / 2, ay); g.lineTo(x + PW / 2, ay + (capAtBottom ? 12 : -12)); g.stroke(); g.fillStyle = Math.sin(t * 5) > 0 ? '#ff4d6d' : '#7a1f2f'; g.beginPath(); g.arc(x + PW / 2, ay + (capAtBottom ? 13 : -13), 2.5, 0, TAU); g.fill(); }
    }
    g.restore();
  }

  let state = 'menu', time = 0, overAt = 0, shake = 0, flash = 0;
  let F = null;
  let menuMode = save.mode;
  let scoreBump = 0;

  function newRun(mode) {
    const world = worldOf(save.world);
    const daily = mode === 'daily' ? today() : null;
    const rng = daily ? mulberry(hashStr('flappy-' + daily)) : Math.random;
    F = {
      mode, world, rng, daily,
      bird: { y: H * 0.42, vy: 0, rot: 0, wing: 0, wingT: 0, alive: true, inv: 0 },
      pipes: [], coins: [], pows: [], scroll: 0, score: 0, coinsGot: 0, started: false, deadT: 0, landed: false,
      speed: mode === 'hard' ? 150 : 128, gap: mode === 'hard' ? 104 : mode === 'rush' ? 150 : 124, spacing: mode === 'rush' ? 165 : 182,
      t: 0, timeLeft: mode === 'rush' ? 45 : 0, shield: false, eff: { magnet: 0, slow: 0, tiny: 0 }, lastGap: H * 0.42, sinceCoin: 0, sincePow: 0,
      closeStreak: 0, maxClose: 0, newBadges: [], flaps: 0, nightSeen: false, dayAfterNight: false, cycleT: 0, trailT: 0
    };
  }
  const gravityK = () => (F?.world.gravity || 1);

  function spawnPipe(x) {
    const minY = 70 + F.gap / 2, maxY = GY - 50 - F.gap / 2;
    let y = minY + F.rng() * (maxY - minY);
    y = Math.max(F.lastGap - 150, Math.min(F.lastGap + 150, y));
    F.lastGap = y;
    const moving = F.mode === 'hard' && F.score > 3 && F.rng() < 0.55 ? { amp: 18 + F.rng() * 22, ph: F.rng() * TAU, sp: 1.2 + F.rng() } : null;
    const pipe = { x, y, gap: F.gap - (F.mode === 'classic' || F.mode === 'daily' ? Math.min(14, F.score * 0.25) : 0), passed: false, moving };
    F.pipes.push(pipe);
    F.sinceCoin++; F.sincePow++;
    if (F.mode === 'rush') {
      for (let i = 0; i < 4; i++) F.coins.push({ x: x + PW / 2 + i * 34 + 20, y: y + Math.sin(i) * 20, base: y + Math.sin(i) * 20, got: false });
    } else if (F.rng() < 0.55) {
      const mid = x + PW + (F.spacing - PW) / 2, n = F.rng() < 0.4 ? 3 : 1;
      for (let i = 0; i < n; i++) F.coins.push({ x: mid + (i - (n - 1) / 2) * 22, y: y - (n > 1 ? Math.abs(i - 1) * -10 : 0), got: false });
    }
    if (F.sincePow >= 9 && F.rng() < 0.45) {
      F.sincePow = 0;
      const kinds = Object.keys(D.POWERS);
      F.pows.push({ x: x + PW / 2, y, kind: kinds[Math.floor(F.rng() * kinds.length)], got: false });
    }
  }

  function flap() {
    if (state === 'menu') return;
    if (state === 'ready') { state = 'play'; F.started = true; }
    if (state !== 'play' || !F.bird.alive) return;
    F.bird.vy = -430 * (F.world.flap || 1);
    F.bird.wingT = 0.22;
    F.flaps++; save.stats.flaps++;
    audio.flap(); vib(6);
    if (save.stats.flaps >= 1000) award('flaps1000');
    emitTrail(true);
  }
  function emitTrail(burst) {
    const tr = save.trail, b = F.bird, x = BX - 12, y = b.y + 2, n = burst ? 3 : 1;
    if (tr === 'none') { if (burst) for (let i = 0; i < 2; i++) fx.add({ x, y: y + 4, vx: -40 - Math.random() * 30, vy: 20 + Math.random() * 30, life: 0.4, max: 0.4, size: 3, c: 'rgba(255,255,255,.8)', g: 0, kind: 'dot', scroll: true }); return; }
    for (let i = 0; i < n; i++) {
      const base = { x: x + Math.random() * 4, y: y + (Math.random() - 0.5) * 8, vx: -20 - Math.random() * 30, vy: (Math.random() - 0.5) * 30, life: 0.7, max: 0.7, g: 0, scroll: true, r: 0, vr: 0 };
      if (tr === 'puffs') fx.add({ ...base, size: 4 + Math.random() * 3, c: '#ffffff', kind: 'dot', alpha: 0.8 });
      else if (tr === 'sparkle') fx.add({ ...base, size: 3 + Math.random() * 2, c: ['#fff6b0', '#ffffff', '#ffd23f'][i % 3], kind: 'star' });
      else if (tr === 'hearts') fx.add({ ...base, vy: -20, size: 5, c: ['#ff6b9a', '#ff9fbf'][i % 2], kind: 'heart' });
      else if (tr === 'rainbow') { const cols = ['#ff4d4d', '#ffa64d', '#ffe14d', '#5ed35e', '#4da6ff', '#a64dff']; cols.forEach((c, k) => fx.add({ ...base, x, y: y - 7 + k * 2.6, vx: 0, vy: 0, life: 0.45, max: 0.45, size: 3.2, c, kind: 'sq' })); }
      else if (tr === 'bubbles') fx.add({ ...base, vy: -40, size: 2 + Math.random() * 3, c: 'rgba(200,240,255,.9)', kind: 'ring' });
      else if (tr === 'fire') fx.add({ ...base, vy: -30 - Math.random() * 30, size: 6 + Math.random() * 5, c: ['rgba(255,200,60,.9)', 'rgba(255,110,20,.85)'][i % 2], kind: 'glow', life: 0.45, max: 0.45 });
    }
  }

  function circleRect(cx, cy, r, x, y, w, h) { const nx = Math.max(x, Math.min(cx, x + w)), ny = Math.max(y, Math.min(cy, y + h)); return (cx - nx) ** 2 + (cy - ny) ** 2 < r * r; }
  function pipeGapY(p) { return p.y + (p.moving ? Math.sin(F.t * p.moving.sp + p.moving.ph) * p.moving.amp : 0); }

  function crash(kind) {
    const b = F.bird;
    if (F.shield && kind === 'pipe') {
      F.shield = false; b.inv = 1.2; b.vy = -220; save.stats.shields++;
      award('shield'); audio.pop(); vib([15, 30, 15]);
      fx.burst(BX, b.y, 20, ['#bff0ff', '#ffffff', '#6fd6ff'], { speed: 200, life: 0.6, size: 4, gravity: 0, kind: 'dot' });
      return;
    }
    b.alive = false; F.deadT = 0;
    flash = 1; shake = 0.35;
    audio.hit(); vib([40, 30, 80]);
    if (kind !== 'ground') { audio.fall(); b.vy = Math.min(b.vy, -120); }
    const cols = { chick: ['#ffd23f', '#fff1b8'], robin: ['#8a5a36', '#ff6b3d'], penguin: ['#26283a', '#ffffff'], bee: ['#ffd23f', '#2a2a2a'], bat: ['#5b3f7d', '#4a2f6a'], owl: ['#9a6b45', '#e9d2a8'], ghost: ['#f5f7ff', '#b9c3e6'], dragon: ['#4cbf5a', '#ffe08a'], robot: ['#c8d2dc', '#56616e'], ufo: ['#d8dde6', '#7bea8b'], parrot: ['#e8322f', '#2d7fe0', '#ffd23f'], phoenix: ['#ff6a1f', '#ffd23f'] }[save.char] || ['#ffffff'];
    fx.burst(BX, b.y, 18, cols, { speed: 180, life: 1.2, size: 5, gravity: 200, kind: 'feather' });
  }

  function update(dt) {
    time += dt;
    shake = Math.max(0, shake - dt); flash = Math.max(0, flash - dt * 3);
    scoreBump = Math.max(0, scoreBump - dt * 4);
    if (!F) return;
    const slow = F.eff.slow > 0 ? 0.6 : 1;
    const sdt = dt * slow;
    const b = F.bird;
    let scrollD = 0;
    if (state === 'menu' || state === 'ready') {
      scrollD = F.speed * dt * 0.8;
      F.scroll += scrollD;
      b.y = (state === 'menu' ? H * 0.2 : H * 0.42) + Math.sin(time * 3) * 7; b.rot = Math.sin(time * 3) * 0.08;
      b.wing = (Math.sin(time * 14) + 1) / 2;
      F.cycleT += dt;
      fx.update(dt, scrollD);
      if (state === 'menu' && Math.random() < 0.3) emitTrail(false);
      return;
    }
    if (autoPilot && state === 'play' && F.bird.alive) { const nx = F.pipes.find((pp) => pp.x + PW > BX - 10); const gy = nx ? pipeGapY(nx) + 12 : H * 0.45; if (F.bird.y > gy && F.bird.vy > -50) flap(); }
    if (state !== 'play') return;
    F.t += sdt; F.cycleT += sdt; save.stats.time += dt;
    if (save.sky === 'cycle') { const n = nightVal(); if (n > 0.95) F.nightSeen = true; if (F.nightSeen && n < 0.05 && !F.dayAfterNight) { F.dayAfterNight = true; award('night'); } }
    for (const k in F.eff) if (F.eff[k] > 0) F.eff[k] = Math.max(0, F.eff[k] - dt);
    if (b.inv > 0) b.inv -= dt;
    b.wingT = Math.max(0, b.wingT - dt);
    b.wing = b.alive ? (b.wingT > 0 ? 1 - b.wingT / 0.22 : (Math.sin(time * 10) + 1) / 4) : 0.2;
    b.vy = Math.min(620, b.vy + 1500 * gravityK() * sdt);
    b.y += b.vy * sdt;
    const targetRot = b.alive ? Math.max(-0.5, Math.min(1.35, b.vy / 520)) : Math.min(1.57, b.rot + sdt * 6);
    b.rot += (targetRot - b.rot) * Math.min(1, sdt * (b.vy > 0 ? 6 : 14));
    const rad = R * (F.eff.tiny > 0 ? 0.6 : 1);
    if (b.y < -40) b.y = -40;
    if (b.alive) {
      scrollD = F.speed * sdt;
      F.scroll += scrollD;
      for (const p of F.pipes) p.x -= scrollD;
      for (const c of F.coins) c.x -= scrollD;
      for (const p of F.pows) p.x -= scrollD;
      const last = F.pipes[F.pipes.length - 1];
      if (!last || last.x < W - F.spacing) spawnPipe(last ? last.x + F.spacing : W + 60);
      F.pipes = F.pipes.filter((p) => p.x > -PW - 10);
      F.coins = F.coins.filter((c) => c.x > -20 && !c.gone);
      F.pows = F.pows.filter((p) => p.x > -20 && !p.got);
      if (F.mode === 'rush') {
        const before = Math.ceil(F.timeLeft); F.timeLeft -= dt;
        if (F.timeLeft <= 5 && Math.ceil(F.timeLeft) !== before) audio.tick();
        if (F.timeLeft <= 0) { F.timeLeft = 0; b.alive = false; F.timeUp = true; F.deadT = 0.6; audio.medal(); }
      }
      if (Math.random() < 0.5 || save.trail === 'rainbow') emitTrail(false);
      for (const p of F.pipes) {
        const gy = pipeGapY(p), top = gy - p.gap / 2, bot = gy + p.gap / 2;
        if (b.inv <= 0 && (circleRect(BX, b.y, rad - 1, p.x, -2000, PW, top + 2000) || circleRect(BX, b.y, rad - 1, p.x, bot, PW, GY - bot))) { crash('pipe'); break; }
        if (!p.passed && p.x + PW < BX) {
          p.passed = true; F.score++; scoreBump = 1;
          save.stats.pipes++;
          audio.point();
          if (F.score === 1) award('first');
          for (const m of D.MEDALS) if (F.score === m.at) { award(m.id); audio.medal(); fx.burst(W / 2, 70, 30, [m.c[0], '#ffffff'], { speed: 220, life: 0.9, size: 4, gravity: 200, kind: 'star' }); }
          if (F.mode === 'hard' && F.score >= 20) award('hard20');
          if (F.world.id === 'space' && F.score >= 20) award('space');
          const near = Math.min(Math.abs(b.y - top), Math.abs(bot - b.y)) - rad;
          if (near < 9) { F.closeStreak++; addCoins(1); popText(BX + 10, b.y - 24, 'Close!', '#ff6b9a'); audio.close(); if (F.closeStreak >= 5) award('close'); }
          else F.closeStreak = 0;
        }
      }
      for (const c of F.coins) {
        if (c.got) continue;
        if (F.eff.magnet > 0) { const dx = BX - c.x, dy = b.y - c.y, d = Math.hypot(dx, dy); if (d < 130) { c.x += dx / d * 260 * dt; c.y += dy / d * 260 * dt; } }
        if (F.mode === 'rush' && c.base != null) c.y = c.base + Math.sin(F.t * 3 + c.x * 0.05) * 10;
        if (Math.hypot(c.x - BX, c.y - b.y) < rad + 9) {
          c.got = true; c.gone = true; addCoins(1);
          fx.burst(c.x, c.y, 8, ['#ffd23f', '#fff3b0', '#ffffff'], { speed: 120, life: 0.5, size: 3, gravity: 0, kind: 'star' });
          popText(c.x, c.y - 10, '+1', '#ffc933');
        }
      }
      for (const p of F.pows) {
        if (p.got) continue;
        if (Math.hypot(p.x - BX, p.y - b.y) < rad + 12) {
          p.got = true; audio.power(); vib([10, 20, 10]);
          fx.burst(p.x, p.y, 20, [D.POWERS[p.kind].color, '#ffffff'], { speed: 200, life: 0.6, size: 4, gravity: 0, kind: 'star' });
          popText(p.x, p.y - 16, D.POWERS[p.kind].name, D.POWERS[p.kind].color);
          if (p.kind === 'shield') F.shield = true; else F.eff[p.kind] = p.kind === 'magnet' ? 8 : p.kind === 'slow' ? 5 : 7;
        }
      }
      if (b.y + rad >= GY) { b.y = GY - rad; crash('ground'); F.landed = true; }
    } else {
      if (b.y + rad >= GY) { if (!F.landed) { F.landed = true; audio.hit(); shake = 0.15; } b.y = GY - rad; b.vy = 0; }
      F.deadT += dt;
      if (F.deadT > (F.timeUp ? 1.0 : 1.1) && (F.landed || F.timeUp)) gameOver();
    }
    fx.update(dt, b.alive ? scrollD : 0);
    for (const p of pops) p.t += dt;
    pops = pops.filter((p) => p.t < 0.9);
  }
  let pops = [], autoPilot = false;
  function popText(x, y, text, color) { pops.push({ x, y, text, color, t: 0 }); }
  function addCoins(n) {
    F.coinsGot += n; save.coins += n; save.stats.coins += n;
    audio.coin(F.coinsGot); vib(5);
    setHud('coins', Curio.fmt(save.coins)); bump('coins');
    if (save.stats.coins >= 500) award('coins500');
    if (F.mode === 'rush' && F.coinsGot >= 50) award('rush50');
  }
  function nightVal() {
    if (save.sky === 'night') return 1;
    if (save.sky === 'day') return 0;
    const ph = ((F ? F.cycleT : time) / 70) % 1;
    const n = 0.5 - 0.5 * Math.cos(ph * TAU);
    return Math.max(0, Math.min(1, (n - 0.25) * 2));
  }

  function fit() {
    const r = stage.getBoundingClientRect();
    const sc = Math.min(r.width / W, r.height / H);
    const cw = Math.max(1, Math.floor(W * sc)), ch = Math.max(1, Math.floor(H * sc));
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    canvas.style.width = cw + 'px'; canvas.style.height = ch + 'px';
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
  }

  function draw() {
    if (!F) return;
    const g = ctx;
    g.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    g.save();
    if (shake > 0) g.translate((Math.random() - 0.5) * shake * 16, (Math.random() - 0.5) * shake * 16);
    const night = nightVal(), world = F.world, p = palette(world, night);
    drawWorld(g, world, F.scroll, night, F.cycleT);
    for (const pp of F.pipes) {
      const gy = pipeGapY(pp), top = gy - pp.gap / 2, bot = gy + pp.gap / 2;
      drawPipe(g, world, p, pp.x, -10, top, true, night, time);
      drawPipe(g, world, p, pp.x, bot, GY, false, night, time);
    }
    for (const c of F.coins) if (!c.got) coin(g, c.x, c.y, time + c.x * 0.01);
    for (const pw of F.pows) if (!pw.got) { const y = pw.y + Math.sin(time * 4) * 4; const gl = g.createRadialGradient(pw.x, y, 2, pw.x, y, 22); gl.addColorStop(0, 'rgba(255,255,255,.6)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gl; g.beginPath(); g.arc(pw.x, y, 22, 0, TAU); g.fill(); powerIcon(g, pw.kind, pw.x, y, 11, time); }
    drawGround(g, world, p, F.scroll, night);
    fx.draw(g);
    const b = F.bird, tiny = F.eff.tiny > 0 ? 0.6 : 1;
    const blink = b.inv > 0 && Math.sin(time * 30) > 0;
    drawChar(g, save.char, BX, b.y, b.rot, b.wing, tiny, time, blink ? 0.4 : 1);
    if (F.shield) { g.strokeStyle = `rgba(150,230,255,${0.6 + 0.2 * Math.sin(time * 6)})`; g.fillStyle = 'rgba(150,230,255,.15)'; g.lineWidth = 2; g.beginPath(); g.arc(BX, b.y, 22 * tiny, 0, TAU); g.fill(); g.stroke(); g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(BX - 8 * tiny, b.y - 10 * tiny, 4, 2, -0.6, 0, TAU); g.fill(); }
    if (F.eff.magnet > 0) { g.strokeStyle = `rgba(255,107,107,${0.25 + 0.15 * Math.sin(time * 10)})`; g.lineWidth = 2; g.setLineDash([4, 6]); g.beginPath(); g.arc(BX, b.y, 40 + (time * 40) % 30, 0, TAU); g.stroke(); g.setLineDash([]); }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const pp of pops) { g.globalAlpha = 1 - pp.t / 0.9; g.font = `900 14px ${FONT}`; g.lineWidth = 3.5; g.strokeStyle = 'rgba(0,0,0,.4)'; g.strokeText(pp.text, pp.x, pp.y - pp.t * 30); g.fillStyle = pp.color; g.fillText(pp.text, pp.x, pp.y - pp.t * 30); }
    g.globalAlpha = 1;
    if (F.eff.slow > 0) { const vg = g.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, H * 0.7); vg.addColorStop(0, 'rgba(185,164,255,0)'); vg.addColorStop(1, `rgba(185,164,255,${Math.min(0.4, F.eff.slow * 0.2)})`); g.fillStyle = vg; g.fillRect(0, 0, W, H); }
    g.restore();
    if (state === 'play' || state === 'ready' || state === 'paused') {
      const s = 1 + scoreBump * 0.25;
      g.save(); g.translate(W / 2, 54); g.scale(s, s);
      g.font = `900 48px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
      g.lineWidth = 8; g.strokeStyle = '#3a2a1a'; g.strokeText(String(F.score), 0, 0); g.fillStyle = '#ffffff'; g.fillText(String(F.score), 0, 0);
      g.restore();
      const chips = [];
      if (F.mode === 'rush') chips.push([`${Math.ceil(F.timeLeft)}s`, F.timeLeft < 10 ? '#ff6b6b' : '#ffffff']);
      for (const k in F.eff) if (F.eff[k] > 0) chips.push([`${D.POWERS[k].name} ${Math.ceil(F.eff[k])}`, D.POWERS[k].color]);
      if (F.shield) chips.push(['Bubble', D.POWERS.shield.color]);
      g.font = `900 12px ${FONT}`;
      chips.forEach(([txt, col], i) => { const w = g.measureText(txt).width + 18, x = W / 2 - w / 2, y = 90 + i * 22; g.fillStyle = 'rgba(0,0,0,.35)'; rrect(g, x, y, w, 18, 9); g.fill(); g.fillStyle = col; g.textAlign = 'center'; g.fillText(txt, W / 2, y + 9.5); });
    }
    if (state === 'ready') {
      g.save(); g.globalAlpha = 0.9 + 0.1 * Math.sin(time * 4);
      g.font = `900 30px ${FONT}`; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 7; g.strokeStyle = '#3a2a1a'; g.strokeText('Get ready!', W / 2, 150); g.fillStyle = '#ffd23f'; g.fillText('Get ready!', W / 2, 150);
      const hx = BX + 56, hy = F.bird.y + 30 + Math.sin(time * 6) * 4;
      g.fillStyle = '#ffffff'; g.strokeStyle = '#3a2a1a'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx - 8, hy + 16); g.lineTo(hx + 8, hy + 16); g.closePath(); g.fill(); g.stroke();
      g.font = `800 14px ${FONT}`; g.lineWidth = 4; g.strokeText('Tap or Space', hx, hy + 32); g.fillStyle = '#ffffff'; g.fillText('Tap or Space', hx, hy + 32);
      g.restore();
    }
    if (flash > 0) { g.fillStyle = `rgba(255,255,255,${flash * 0.8})`; g.fillRect(0, 0, W, H); }
  }

  const hudEls = {};
  $$('[data-hud]').forEach((el) => (hudEls[el.dataset.hud] ||= []).push(el));
  const setHud = (k, v) => { for (const el of hudEls[k] || []) if (el.textContent !== String(v)) el.textContent = v; };
  function bump(k) { for (const el of hudEls[k] || []) { el.classList.remove('is-bump'); void el.offsetWidth; el.classList.add('is-bump'); } }
  const bestKey = (m = menuMode) => (m === 'daily' ? `daily-${today()}` : m);
  function paintHud() { setHud('coins', Curio.fmt(save.coins)); setHud('best', Curio.fmt(Curio.getBest(bestKey(F && state !== 'menu' ? F.mode : menuMode)) ?? 0)); }

  function award(id) {
    if (save.badges[id]) return;
    const b = D.BADGES.find((x) => x.id === id); if (!b) return;
    save.badges[id] = Date.now();
    F?.newBadges.push(b.name);
    Curio.toast(`Badge unlocked: ${b.name}`);
    persist();
  }

  function medalFor(score) { return D.MEDALS.find((m) => score >= m.at) || null; }
  function medalSvg(m) {
    if (!m) return '<svg viewBox="0 0 76 76" aria-hidden="true"><circle cx="38" cy="38" r="30" fill="none" stroke="#c8a35a" stroke-width="4" stroke-dasharray="6 6"/></svg>';
    return `<svg viewBox="0 0 76 76" aria-hidden="true"><circle cx="38" cy="38" r="32" fill="${m.c[1]}"/><circle cx="38" cy="38" r="27" fill="${m.c[0]}"/><circle cx="38" cy="38" r="27" fill="url(#none)" stroke="rgba(255,255,255,.6)" stroke-width="2"/><path d="M38 20l5.3 10.7 11.8 1.7-8.5 8.3 2 11.7L38 46.9 27.4 52.4l2-11.7-8.5-8.3 11.8-1.7z" fill="#ffffff" fill-opacity=".9"/><ellipse cx="28" cy="24" rx="7" ry="3.5" fill="#ffffff" fill-opacity=".55" transform="rotate(-35 28 24)"/></svg>`;
  }
  function gameOver() {
    if (state === 'over') return;
    state = 'over'; overAt = performance.now();
    const st = save.stats; st.games++;
    st.best = Math.max(st.best, F.score);
    const r = Curio.best(bestKey(F.mode), F.mode === 'rush' ? F.coinsGot : F.score);
    const value = F.mode === 'rush' ? F.coinsGot : F.score;
    const isNew = r.isNew && value > 0;
    if (F.mode === 'daily') {
      award('daily');
      const d = save.daily[F.daily] || { best: 0, plays: 0, first: null };
      d.plays++; d.best = Math.max(d.best, F.score); if (d.first == null) d.first = F.score;
      save.daily[F.daily] = d;
      const keys = Object.keys(save.daily).sort(); while (keys.length > 40) delete save.daily[keys.shift()];
    }
    save.history.unshift({ m: F.mode, s: F.score, c: F.coinsGot, w: F.world.id, ch: save.char, d: Date.now() });
    save.history.length = Math.min(save.history.length, 12);
    persist();
    const box = ovs.over, set = (n, v) => { box.querySelector(`[data-o="${n}"]`).textContent = v; };
    const m = F.mode === 'rush' ? null : medalFor(F.score);
    box.querySelector('[data-o="medal"]').innerHTML = medalSvg(m);
    set('title', F.timeUp ? "Time's up!" : m ? `${m.name} medal!` : 'Game over');
    set('score', F.mode === 'rush' ? `${F.coinsGot}c` : F.score);
    set('best', Curio.fmt(r.best ?? value));
    set('coins', '+' + F.coinsGot);
    box.querySelector('[data-o="new"]').hidden = !isNew;
    const next = D.MEDALS.slice().reverse().find((mm) => mm.at > F.score);
    let msg = F.mode === 'rush' ? `${F.coinsGot} coins in 45 seconds. ${F.score} pipes too.` : Curio.pick(D.QUIPS);
    if (F.mode !== 'rush' && next) msg += ` ${next.at - F.score} more for ${next.name.toLowerCase()}.`;
    if (F.mode === 'daily') msg += ` Today's best: ${save.daily[F.daily].best}.`;
    const cheapest = [...D.CHARS, ...D.WORLDS, ...D.TRAILS].filter((it) => !save.owned[it.id]).sort((a, b) => a.price - b.price)[0];
    if (cheapest && save.coins >= cheapest.price) msg += ` You can afford the ${cheapest.name} in the shop!`;
    set('msg', msg);
    const earned = box.querySelector('[data-o="earned"]'); earned.innerHTML = '';
    F.newBadges.forEach((n, i) => { const sp = document.createElement('span'); sp.textContent = 'Badge: ' + n; sp.style.animationDelay = (0.2 + i * 0.1) + 's'; earned.append(sp); });
    if (isNew) { Curio.confetti(); audio.medal(); }
    show('over');
    paintHud();
  }
  function shareText() {
    if (!F) return '';
    const m = medalFor(F.score);
    if (F.mode === 'rush') return `Zoble Flappy Coin Rush: ${F.coinsGot} coins in 45 seconds`;
    if (F.mode === 'daily') return `Zoble Flappy daily ${F.daily}: ${F.score} pipes${m ? ` (${m.name})` : ''}`;
    return `Zoble Flappy ${D.MODES[F.mode].name}: ${F.score} pipes as the ${D.CHARS.find((c) => c.id === save.char).name} in ${F.world.name}${m ? `, ${m.name} medal` : ''}`;
  }
  async function share() { const t = shareText(); try { await navigator.clipboard.writeText(t); Curio.toast('Copied to clipboard'); } catch { Curio.toast(t, 4000); } }

  function show(name) {
    for (const k in ovs) ovs[k].hidden = k !== name;
    if (name) setTimeout(() => ovs[name].querySelector('.c-btn:not([hidden]), button')?.focus({ preventScroll: true }), 30);
  }
  let lastMode = 'classic';
  function start(mode) {
    menuMode = mode; save.mode = mode; persist(); lastMode = mode;
    newRun(mode);
    state = 'ready'; fx.list.length = 0; pops = [];
    show(null); paintHud();
    if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
  }
  function toMenu() { newRun(menuMode); state = 'menu'; show('menu'); renderMenu(); paintHud(); }
  function pause() { if (state !== 'play') return; state = 'paused'; show('pause'); audio.tone(392, 0.06, 'triangle', 0.08); }
  function resume() { if (state !== 'paused') return; state = 'play'; show(null); }

  function modeIcon(g, id) {
    g.save(); g.scale(2, 2);
    if (id === 'classic') drawChar(g, 'chick', 14, 15, -0.2, 0.8, 0.8, 0);
    else if (id === 'hard') { g.fillStyle = '#5cc45a'; g.fillRect(4, 0, 9, 10); g.fillRect(4, 20, 9, 12); g.fillRect(19, 0, 9, 14); g.fillRect(19, 24, 9, 8); g.fillStyle = '#ef4f53'; g.beginPath(); g.moveTo(16, 4); g.lineTo(12, 16); g.lineTo(16, 16); g.lineTo(14, 28); g.lineTo(21, 13); g.lineTo(17, 13); g.lineTo(20, 4); g.fill(); }
    else if (id === 'daily') { g.fillStyle = '#fff'; g.strokeStyle = '#3c78e8'; g.lineWidth = 2; rrect(g, 3, 6, 26, 23, 4); g.fill(); g.stroke(); g.fillStyle = '#3c78e8'; g.fillRect(3, 6, 26, 6); g.fillStyle = '#ffc933'; g.beginPath(); g.arc(16, 20, 5, 0, TAU); g.fill(); }
    else if (id === 'rush') { coin(g, 11, 18, 0, 1); coin(g, 22, 12, 0.3, 0.8); }
    g.restore();
  }
  const modesEl = $('#modes');
  Object.keys(D.MODES).forEach((id) => {
    const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'tab'); b.dataset.mode = id;
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64; modeIcon(cv.getContext('2d'), id);
    const nm = document.createElement('b'); nm.textContent = D.MODES[id].name;
    b.append(cv, nm);
    b.addEventListener('click', () => { menuMode = id; save.mode = id; persist(); audio.tone(660, 0.04, 'triangle', 0.06); renderMenu(); paintHud(); });
    modesEl.append(b);
  });
  const panel = $('#mode-panel');
  function picker(list, key, label) {
    const owned = list.filter((it) => save.owned[it.id]);
    const wrap = document.createElement('div'); wrap.className = 'fl-pick';
    const prev = document.createElement('button'); prev.type = 'button'; prev.className = 'fl-arrow'; prev.textContent = '‹'; prev.setAttribute('aria-label', `Previous ${label}`);
    const next = document.createElement('button'); next.type = 'button'; next.className = 'fl-arrow'; next.textContent = '›'; next.setAttribute('aria-label', `Next ${label}`);
    const cv = document.createElement('canvas'); cv.width = 120; cv.height = 120;
    const info = document.createElement('div');
    const paint = () => {
      const it = list.find((x) => x.id === save[key]);
      const g = cv.getContext('2d'); g.clearRect(0, 0, 120, 120);
      if (key === 'char') { g.save(); g.scale(2, 2); drawChar(g, it.id, 30, 32, 0, 0.6, 1.4, time); g.restore(); }
      else { g.save(); g.beginPath(); g.arc(60, 60, 58, 0, TAU); g.clip(); g.scale(120 / 200, 120 / 200); g.translate(-60, -(H - 200)); const wd = worldOf(it.id); drawWorld(g, wd, 0, 0, 0); drawPipe(g, wd, palette(wd, 0), 150, H - 200, GY - 60, true, 0, 0); drawGround(g, wd, palette(wd, 0), 0, 0); g.restore(); }
      info.innerHTML = `${it.name}<small>${label} ${owned.indexOf(it) + 1} of ${owned.length}</small>`;
    };
    const step = (d) => { const i = owned.findIndex((x) => x.id === save[key]); save[key] = owned[(i + d + owned.length) % owned.length].id; persist(); paint(); audio.tone(700, 0.04, 'triangle', 0.06); newRun(menuMode); };
    prev.addEventListener('click', () => step(-1)); next.addEventListener('click', () => step(1));
    paint();
    wrap.append(prev, cv, info, next);
    return wrap;
  }
  function renderMenu() {
    $$('#modes button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.mode === menuMode)));
    panel.innerHTML = '';
    const p = document.createElement('p'); p.textContent = D.MODES[menuMode].blurb; panel.append(p);
    panel.append(picker(D.CHARS, 'char', 'Flyer'), picker(D.WORLDS, 'world', 'World'));
    const seg = document.createElement('div'); seg.className = 'fl-seg'; seg.setAttribute('role', 'group'); seg.setAttribute('aria-label', 'Time of day');
    for (const [k, n] of [['cycle', 'Day + night'], ['day', 'Always day'], ['night', 'Always night']]) { const b = document.createElement('button'); b.type = 'button'; b.textContent = n; b.setAttribute('aria-pressed', String(save.sky === k)); b.addEventListener('click', () => { save.sky = k; persist(); renderMenu(); }); seg.append(b); }
    panel.append(seg);
    if (menuMode === 'daily') { const d = save.daily[today()]; const q = document.createElement('p'); q.innerHTML = d ? `Today's best: <b>${d.best}</b> (first try ${d.first})` : `Course for <b>${today()}</b>.`; panel.append(q); }
    const b = document.createElement('button'); b.type = 'button'; b.className = 'c-btn fl-play'; b.textContent = 'Fly!'; b.addEventListener('click', () => start(menuMode)); panel.append(b);
  }

  let shopTab = 'chars';
  function itemPreview(cv, kind, it) {
    const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height);
    g.save(); g.scale(cv.width / 216, cv.height / 144);
    if (kind === 'worlds') { const wd = worldOf(it.id); g.save(); g.scale(216 / W, 216 / W); g.translate(0, -(H - 144 * W / 216)); drawWorld(g, wd, 40, 0, 0); drawPipe(g, wd, palette(wd, 0), 200, -10, GY - 120, true, 0, 0); drawPipe(g, wd, palette(wd, 0), 200, GY - 30, GY, false, 0, 0); drawGround(g, wd, palette(wd, 0), 0, 0); g.restore(); }
    else {
      const gr = g.createLinearGradient(0, 0, 0, 144); gr.addColorStop(0, '#9fdcff'); gr.addColorStop(1, '#e6f7ff'); g.fillStyle = gr; g.fillRect(0, 0, 216, 144);
      if (kind === 'trails') {
        const saved = save.trail; save.trail = it.id;
        const fakeF = F; F = { bird: { y: 72 } };
        const keep = fx.list; fx.list = [];
        for (let i = 0; i < 26; i++) { emitTrail(true); for (const p of fx.list) { p.x -= 5; p.life = Math.max(p.life, 0.5); } }
        fx.list.forEach((p) => { p.x += 70; p.y += Math.sin(p.x * 0.05) * 6; });
        fx.draw(g); fx.list = keep; F = fakeF; save.trail = saved;
        drawChar(g, save.char, 160, 72, -0.15, 0.7, 1.6, 0);
      } else drawChar(g, it.id, 108, 74, -0.1, 0.7, 3, 0);
    }
    g.restore();
  }
  function openShop() {
    $$('.fl-tabs button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === shopTab)));
    const w = $('#shop'); w.innerHTML = '';
    const list = shopTab === 'chars' ? D.CHARS : shopTab === 'worlds' ? D.WORLDS : D.TRAILS;
    const key = shopTab === 'chars' ? 'char' : shopTab === 'worlds' ? 'world' : 'trail';
    for (const it of list) {
      const owned = !!save.owned[it.id];
      const b = document.createElement('button'); b.type = 'button'; b.className = 'fl-item' + (owned ? '' : ' is-locked');
      b.setAttribute('aria-pressed', String(save[key] === it.id));
      const cv = document.createElement('canvas'); cv.width = 216; cv.height = 144; itemPreview(cv, shopTab, it);
      const nm = document.createElement('b'); nm.textContent = it.name;
      b.append(cv, nm);
      if (it.desc) { const sm = document.createElement('small'); sm.textContent = it.desc; b.append(sm); }
      if (owned) { const sm = document.createElement('small'); sm.textContent = save[key] === it.id ? 'Equipped' : 'Tap to equip'; b.append(sm); }
      else { const pr = document.createElement('span'); pr.className = 'fl-price' + (save.coins < it.price ? ' is-poor' : ''); pr.textContent = `${it.price} coins`; b.append(pr); }
      b.setAttribute('aria-label', `${it.name}, ${owned ? 'owned' : it.price + ' coins'}`);
      b.addEventListener('click', () => {
        if (owned) { save[key] = it.id; persist(); audio.tone(700, 0.05, 'triangle', 0.07); }
        else if (save.coins >= it.price) {
          save.coins -= it.price; save.owned[it.id] = 1; save[key] = it.id; persist(); audio.buy(); Curio.confetti(60); vib([20, 30, 20]);
          Curio.toast(`Unlocked ${it.name}!`);
          if (D.CHARS.filter((c) => save.owned[c.id]).length >= 3) award('chars3');
          if (D.WORLDS.filter((c) => save.owned[c.id]).length >= 3) award('worlds3');
          if (it.id === 'phoenix') award('phoenix');
        } else { Curio.toast(`Need ${it.price - save.coins} more coins`); audio.tone(200, 0.1, 'square', 0.05); }
        paintHud(); newRun(menuMode); openShop();
      });
      w.append(b);
    }
    show('shop');
  }
  $$('.fl-tabs button').forEach((b) => b.addEventListener('click', () => { shopTab = b.dataset.tab; openShop(); }));

  function badgeIcon(g, icon, on) {
    g.clearRect(0, 0, 68, 68);
    const gr = g.createRadialGradient(26, 22, 4, 34, 34, 34); gr.addColorStop(0, on ? '#fff3b0' : '#e8e2d8'); gr.addColorStop(1, on ? '#f0a020' : '#a9a197');
    g.fillStyle = gr; g.beginPath(); g.arc(34, 34, 31, 0, TAU); g.fill();
    g.save(); g.translate(34, 34); const ink = on ? '#7a4a00' : '#7f776c'; g.fillStyle = ink; g.strokeStyle = ink; g.lineWidth = 4; g.lineCap = 'round'; g.lineJoin = 'round';
    if (icon === 'wing') { g.beginPath(); g.moveTo(-14, 8); g.quadraticCurveTo(-10, -16, 16, -12); g.quadraticCurveTo(6, -6, 12, -2); g.quadraticCurveTo(2, 0, 6, 6); g.quadraticCurveTo(-4, 6, -14, 8); g.fill(); }
    else if (icon === 'medal') { g.beginPath(); g.arc(0, 5, 12, 0, TAU); g.fill(); g.fillRect(-9, -18, 6, 12); g.fillRect(3, -18, 6, 12); }
    else if (icon === 'crown') { g.beginPath(); g.moveTo(-17, 11); g.lineTo(-17, -9); g.lineTo(-8, 0); g.lineTo(0, -14); g.lineTo(8, 0); g.lineTo(17, -9); g.lineTo(17, 11); g.closePath(); g.fill(); }
    else if (icon === 'bolt') { g.beginPath(); g.moveTo(4, -18); g.lineTo(-10, 2); g.lineTo(0, 2); g.lineTo(-4, 18); g.lineTo(10, -2); g.lineTo(0, -2); g.closePath(); g.fill(); }
    else if (icon === 'cal') { g.lineWidth = 3; rrect(g, -14, -12, 28, 26, 4); g.stroke(); g.fillRect(-14, -12, 28, 7); }
    else if (icon === 'coin') { g.beginPath(); g.arc(0, 0, 15, 0, TAU); g.stroke(); starPath(g, 0, 0, 8, 3.5, 5); g.fill(); }
    else if (icon === 'shield') { g.beginPath(); g.arc(0, 0, 15, 0, TAU); g.stroke(); g.beginPath(); g.ellipse(-5, -6, 4, 2, -0.7, 0, TAU); g.fill(); }
    else if (icon === 'moon') { g.beginPath(); g.arc(0, 0, 15, 0.6, 5.7); g.arc(7, -3, 11, 5.0, 1.3, true); g.fill(); }
    else if (icon === 'globe') { g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 15, 0, TAU); g.stroke(); g.beginPath(); g.ellipse(0, 0, 7, 15, 0, 0, TAU); g.stroke(); g.beginPath(); g.moveTo(-15, 0); g.lineTo(15, 0); g.stroke(); }
    g.restore();
  }
  function openBadges() {
    const s = save.stats;
    const cells = [[s.games, 'Flights'], [s.best, 'Best score'], [Curio.fmt(s.pipes), 'Pipes passed'], [Curio.fmt(s.coins), 'Coins earned'], [Curio.fmt(s.flaps), 'Flaps'], [s.shields, 'Bubble saves'], [D.CHARS.filter((c) => save.owned[c.id]).length + '/' + D.CHARS.length, 'Flyers'], [`${Math.floor(s.time / 60)}m`, 'Air time']];
    $('#stats').innerHTML = cells.map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join('');
    const bw = $('#badges'); bw.innerHTML = '';
    for (const b of D.BADGES) {
      const on = !!save.badges[b.id];
      const el = document.createElement('div'); el.className = 'fl-badge' + (on ? ' is-on' : '');
      const cv = document.createElement('canvas'); cv.width = 68; cv.height = 68; badgeIcon(cv.getContext('2d'), b.icon, on);
      const t = document.createElement('div'); t.innerHTML = '<b></b><small></small>'; t.querySelector('b').textContent = b.name; t.querySelector('small').textContent = b.desc;
      el.append(cv, t); bw.append(el);
    }
    const hl = $('#history'); hl.innerHTML = save.history.length ? '' : '<li>No flights yet. The pipes await.</li>';
    for (const h of save.history) {
      const li = document.createElement('li'); li.innerHTML = '<b></b><span></span>';
      li.querySelector('b').textContent = `${D.MODES[h.m]?.name || h.m}: ${h.s} pipes, ${h.c} coins`;
      li.querySelector('span').textContent = `${worldOf(h.w).name} · ${new Date(h.d).toLocaleDateString()}`;
      hl.append(li);
    }
    show('badges');
  }
  function openHelp() {
    const w = $('#powers'); w.innerHTML = '';
    for (const k in D.POWERS) {
      const el = document.createElement('div');
      const cv = document.createElement('canvas'); cv.width = 72; cv.height = 72; powerIcon(cv.getContext('2d'), k, 36, 36, 30);
      const t = document.createElement('div'); t.innerHTML = '<b></b><small></small>'; t.querySelector('b').textContent = D.POWERS[k].name; t.querySelector('small').textContent = D.POWERS[k].desc;
      el.append(cv, t); w.append(el);
    }
    show('help');
  }

  $$('[data-act]').forEach((b) => b.addEventListener('click', (e) => {
    e.stopPropagation();
    const a = b.dataset.act;
    if (a === 'pause') { if (state === 'play') pause(); else if (state === 'paused') resume(); }
    else if (a === 'resume') resume();
    else if (a === 'restart') { if (performance.now() - overAt > 450) start(lastMode); }
    else if (a === 'menu') toMenu();
    else if (a === 'shop') openShop();
    else if (a === 'badges') openBadges();
    else if (a === 'help') openHelp();
    else if (a === 'share') share();
  }));
  addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest?.('input, select, textarea')) return;
    const k = e.key.toLowerCase();
    if (k === 'p' || k === 'escape') {
      if (state === 'play') { pause(); e.preventDefault(); return; }
      if (state === 'paused') { resume(); e.preventDefault(); return; }
      if (k === 'escape' && ['shop', 'badges', 'help'].some((n) => !ovs[n].hidden)) { toMenu(); return; }
    }
    const onBtn = e.target.closest?.('button, a');
    if ((k === ' ' || k === 'arrowup' || k === 'w') && (state === 'play' || state === 'ready')) { e.preventDefault(); if (!e.repeat) flap(); return; }
    if ((k === ' ' || k === 'enter') && !onBtn) {
      if (state === 'paused') { resume(); e.preventDefault(); }
      else if (state === 'over' && performance.now() - overAt > 450) { start(lastMode); e.preventDefault(); }
      else if (state === 'menu' && !ovs.menu.hidden) { start(menuMode); e.preventDefault(); }
    }
    if (k === 'r' && (state === 'over' || state === 'paused')) start(lastMode);
  });
  stage.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.fl-ov')) return;
    if (e.button > 0) return;
    e.preventDefault();
    flap();
  });
  stage.addEventListener('contextmenu', (e) => e.preventDefault());

  let raf = 0, last = 0;
  function frame(t) {
    raf = requestAnimationFrame(frame);
    let dt = last ? (t - last) / 1000 : 0; last = t;
    if (dt > 0.05) dt = 0.05;
    if (state === 'paused') { time += dt; }
    else if (state === 'over') { time += dt; fx.update(dt, 0); }
    else update(dt);
    draw();
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { pause(); cancelAnimationFrame(raf); raf = 0; persist(); }
    else if (!raf) { last = 0; raf = requestAnimationFrame(frame); }
  });
  addEventListener('blur', () => pause());
  addEventListener('pagehide', persist);
  new ResizeObserver(fit).observe(stage);

  window.__flappy = {
    get state() { return state; }, get F() { return F; }, save, start, toMenu, flap: () => flap(),
    set auto(v) { autoPilot = !!v; }, godMode() { F.bird.inv = 9999; }, give(n) { save.coins += n; persist(); paintHud(); }, crash: () => crash('pipe')
  };

  fit();
  toMenu();
  raf = requestAnimationFrame(frame);
  if (!Curio.store.get('tip:touchpad:flappy', false) && !matchMedia('(pointer: coarse)').matches) {
    Curio.store.set('tip:touchpad:flappy', true);
    setTimeout(() => Curio.toast('Tip: Space, W or the up arrow flap too, so your touchpad can rest', 4000), 1200);
  }
})();
