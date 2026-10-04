(() => {
  const $ = (id) => document.getElementById(id);
  const TAU = Math.PI * 2;
  const arena = $('arena'), cv = $('cv'), g = cv.getContext('2d');

  const MODES = {
    classic: { name: 'Classic', color: '#e53935', short: '30 targets, pure speed', desc: '30 targets, one at a time. Hit each one as fast as you can. Your score is the average time per target.', unit: 'ms per target', lower: true },
    grid: { name: 'Gridshot', color: '#ff8a1f', short: 'Three at once, 30s', desc: 'Three targets on a grid for 30 seconds. Every hit spawns a new one. Keep the combo alive for bonus points.', unit: 'points' },
    flick: { name: 'Flick', color: '#8e3bd6', short: 'Catch them before they fade', desc: '25 targets pop up and fade away. Catch as many as you can, and catch them early for extra points.', unit: 'points' },
    track: { name: 'Tracking', color: '#1faa59', short: 'Follow the drifter', desc: 'Keep your pointer on the drifting target for 30 seconds. No clicking needed. On a phone, keep your finger on it.', unit: '% on target' },
    precision: { name: 'Precision', color: '#2f7bf0', short: 'Gold scores 10', desc: '20 archery targets, one shot each. Hit the gold for 10 points, the outer white ring scores 1.', unit: 'points out of 200' }
  };
  const ORDER = Object.keys(MODES);
  const DIFFS = {
    easy: { name: 'Easy', r: 42, life: 1800, speed: 110, pr: 58, mul: .9 },
    normal: { name: 'Normal', r: 32, life: 1250, speed: 170, pr: 46, mul: 1 },
    hard: { name: 'Hard', r: 25, life: 900, speed: 240, pr: 36, mul: 1.12 }
  };
  const SKINS = { bull: 'Bullseye', neon: 'Neon', balloon: 'Balloon', planet: 'Planet', gem: 'Gem', donut: 'Donut' };
  const THEMES = { range: 'Range', night: 'Night grid', space: 'Deep space', meadow: 'Meadow' };
  const CROSS = { cross: 'Cross', dot: 'Dot', circle: 'Ring', system: 'System' };

  const ICONS = {
    classic: '<svg viewBox="0 0 48 48"><circle cx="24" cy="25" r="20" fill="#b71c1c"/><circle cx="24" cy="24" r="20" fill="#e53935"/><circle cx="24" cy="24" r="14.5" fill="#fff"/><circle cx="24" cy="24" r="9" fill="#e53935"/><circle cx="24" cy="24" r="3.5" fill="#fff"/><path d="M14 12 A14 14 0 0 1 22 9" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".6"/></svg>',
    grid: '<svg viewBox="0 0 48 48"><g fill="#ffd9b3"><rect x="4" y="4" width="11" height="11" rx="3"/><rect x="18.5" y="4" width="11" height="11" rx="3"/><rect x="33" y="4" width="11" height="11" rx="3"/><rect x="4" y="18.5" width="11" height="11" rx="3"/><rect x="18.5" y="18.5" width="11" height="11" rx="3"/><rect x="33" y="18.5" width="11" height="11" rx="3"/><rect x="4" y="33" width="11" height="11" rx="3"/><rect x="18.5" y="33" width="11" height="11" rx="3"/><rect x="33" y="33" width="11" height="11" rx="3"/></g><g fill="#ff8a1f"><circle cx="9.5" cy="9.5" r="6"/><circle cx="38.5" cy="24" r="6"/><circle cx="24" cy="38.5" r="6"/></g><g fill="#fff"><circle cx="9.5" cy="9.5" r="2.2"/><circle cx="38.5" cy="24" r="2.2"/><circle cx="24" cy="38.5" r="2.2"/></g></svg>',
    flick: '<svg viewBox="0 0 48 48"><g stroke="#c9a4ef" stroke-width="3.5" stroke-linecap="round"><path d="M3 18 H14"/><path d="M6 26 H13"/><path d="M3 34 H15"/></g><circle cx="30" cy="26" r="15" fill="#8e3bd6"/><circle cx="30" cy="26" r="10" fill="#fff"/><circle cx="30" cy="26" r="5" fill="#8e3bd6"/><path d="M30 6 A20 20 0 0 1 49 22" stroke="#8e3bd6" stroke-width="3" fill="none" stroke-linecap="round" stroke-dasharray="4 4"/></svg>',
    track: '<svg viewBox="0 0 48 48"><path d="M5 38 C12 18 22 40 30 22 S44 10 44 10" stroke="#9fdcb7" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-dasharray="1 6"/><circle cx="30" cy="22" r="13" fill="none" stroke="#1faa59" stroke-width="3"/><circle cx="30" cy="22" r="8" fill="#1faa59"/><circle cx="30" cy="22" r="3" fill="#fff"/></svg>',
    precision: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="21" fill="#f4f1ea" stroke="#d7d0c3"/><circle cx="24" cy="24" r="17" fill="#2a2a30"/><circle cx="24" cy="24" r="12.5" fill="#2f8fe0"/><circle cx="24" cy="24" r="8" fill="#e53935"/><circle cx="24" cy="24" r="4" fill="#ffd23f"/><path d="M24 24 L40 8" stroke="#6b4a2b" stroke-width="2.5" stroke-linecap="round"/><path d="M38 6 L44 4 L42 10 Z" fill="#e53935"/></svg>'
  };

  const ACH = [
    { id: 'first', em: '🎯', name: 'First Shot', desc: 'Finish any drill.' },
    { id: 'c450', em: '⚡', name: 'Quick Draw', desc: 'Classic average under 450ms.' },
    { id: 'c380', em: '🦅', name: 'Hawk Eye', desc: 'Classic average under 380ms.' },
    { id: 'g6k', em: '🧱', name: 'Grid Runner', desc: '6,000 points in Gridshot.' },
    { id: 'g10k', em: '🔥', name: 'Grid Master', desc: '10,000 points in Gridshot.' },
    { id: 'combo', em: '🌪️', name: 'Combo Storm', desc: 'A 20 hit combo in Gridshot.' },
    { id: 'f20', em: '🪃', name: 'Flick Wrist', desc: 'Catch 20 of 25 in Flick.' },
    { id: 'f25', em: '🫧', name: 'Nothing Escapes', desc: 'Catch all 25 in Flick.' },
    { id: 't60', em: '🧲', name: 'Sticky', desc: '60% on target in Tracking.' },
    { id: 't85', em: '🛰️', name: 'Locked On', desc: '85% on target in Tracking.' },
    { id: 'p150', em: '🏹', name: 'Archer', desc: '150 points in Precision.' },
    { id: 'bulls', em: '🥇', name: 'Gold Rush', desc: '5 golds in one Precision run.' },
    { id: 'flawless', em: '💎', name: 'Flawless', desc: '100% accuracy with 20+ shots.' },
    { id: 'hard', em: '🧗', name: 'Hardcore', desc: 'Finish any drill on Hard.' },
    { id: 'all', em: '🎛️', name: 'All Rounder', desc: 'Finish all five drills.' },
    { id: 'daily', em: '📅', name: 'Daily Drill', desc: 'Finish a daily challenge.' },
    { id: 'h500', em: '🎖️', name: 'Five Hundred', desc: 'Hit 500 targets in total.' },
    { id: 'reg', em: '🗓️', name: 'Regular', desc: 'Finish 25 drills.' },
    { id: 'skin', em: '🎨', name: 'Stylist', desc: 'Try a new target skin.' }
  ];
  const MEDALS = [
    { name: 'Rookie', c1: '#c9c2b8', c2: '#9a9187' },
    { name: 'Bronze', c1: '#e6a06a', c2: '#a8622e' },
    { name: 'Silver', c1: '#e9edf2', c2: '#9aa6b4' },
    { name: 'Gold', c1: '#ffe27a', c2: '#e0a800' },
    { name: 'Platinum', c1: '#d8fbff', c2: '#5bc0d8' },
    { name: 'Legend', c1: '#ffb3f0', c2: '#8e3bd6' }
  ];
  const VERDICTS = ['Everyone starts somewhere. Give it another go.', 'A good warm-up. Your hand is waking up.', 'Solid and steady. Nice work.', 'Well above average. Those targets felt it.', 'Seriously sharp. Pro-level stuff.', 'Legendary. The targets never stood a chance.'];

  const fresh = () => ({ v: 1, mode: 'classic', diff: 'normal', skin: 'bull', theme: 'range', cross: 'cross', assist: false, hist: {}, done: {}, ach: {}, daily: {}, tot: { sessions: 0, hits: 0, shots: 0, ms: 0 }, tip: false });
  let P = fresh();
  try {
    const raw = Curio.store.get('aim:v1', null);
    if (raw && raw.v === 1) P = Object.assign(fresh(), raw);
  } catch {}
  ['hist', 'done', 'ach', 'daily'].forEach((k) => { if (!P[k] || typeof P[k] !== 'object') P[k] = {}; });
  if (!P.tot || typeof P.tot !== 'object') P.tot = fresh().tot;
  if (!MODES[P.mode]) P.mode = 'classic';
  if (!DIFFS[P.diff]) P.diff = 'normal';
  if (!SKINS[P.skin]) P.skin = 'bull';
  if (!THEMES[P.theme]) P.theme = 'range';
  if (!CROSS[P.cross]) P.cross = 'cross';
  if (Curio.store.get('aim:v1', null) == null && Curio.touchpad) P.assist = true;
  const save = () => Curio.store.set('aim:v1', P);
  const legacy = Curio.getBest('avg');
  if (legacy != null && Curio.getBest('classic-easy') == null) Curio.best('classic-easy', legacy, false);

  const bestKey = (m, d) => m + '-' + d;
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  function seeded(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    let a = h >>> 0;
    return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const buzz = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch {} };
  const fmtScore = (m, v) => m === 'classic' ? v + 'ms' : m === 'track' ? v + '%' : Curio.fmt(v);

  let noiseBuf = null;
  function sfx(type, p = 0) {
    if (Curio.muted) return;
    const ac = Curio.audioContext && Curio.audioContext(); if (!ac) return;
    const t = ac.currentTime;
    const tone = (f0, f1, d, wave, v, at = 0) => {
      const o = ac.createOscillator(), gn = ac.createGain();
      o.type = wave; o.frequency.setValueAtTime(f0, t + at); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + at + d);
      gn.gain.setValueAtTime(.0001, t + at); gn.gain.exponentialRampToValueAtTime(v, t + at + .005); gn.gain.exponentialRampToValueAtTime(.0001, t + at + d);
      o.connect(gn).connect(ac.destination); o.start(t + at); o.stop(t + at + d + .03);
    };
    const noise = (d, f, v) => {
      if (!noiseBuf) { noiseBuf = ac.createBuffer(1, ac.sampleRate * .3, ac.sampleRate); const ch = noiseBuf.getChannelData(0); for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1; }
      const s = ac.createBufferSource(), bp = ac.createBiquadFilter(), gn = ac.createGain();
      s.buffer = noiseBuf; bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = 1.2;
      gn.gain.setValueAtTime(v, t); gn.gain.exponentialRampToValueAtTime(.0001, t + d);
      s.connect(bp).connect(gn).connect(ac.destination); s.start(t); s.stop(t + d + .02);
    };
    if (type === 'hit') { tone(760 + p * 22, 260, .09, 'sine', .2); noise(.05, 2600, .12); }
    else if (type === 'miss') { tone(150, 80, .14, 'triangle', .09); noise(.06, 500, .05); }
    else if (type === 'expire') tone(420, 210, .18, 'sine', .06);
    else if (type === 'tick') tone(1400, 0, .03, 'square', .025);
    else if (type === 'count') tone(660, 0, .12, 'triangle', .1);
    else if (type === 'go') { tone(990, 0, .2, 'triangle', .1); tone(1320, 0, .25, 'triangle', .06, .05); }
    else if (type === 'combo') { tone(880, 0, .08, 'triangle', .07); tone(1175, 0, .12, 'triangle', .07, .06); }
    else if (type === 'gold') { tone(1318, 0, .5, 'sine', .08); tone(1975, 0, .45, 'sine', .05, .02); }
    else if (type === 'end') [523, 659, 784, 1046].forEach((f, i) => tone(f, 0, .22, 'triangle', .08, i * .09));
    else if (type === 'ui') tone(700, 0, .05, 'triangle', .05);
  }

  let W = 0, H = 0, dpr = 1, k = 1;
  const bg = document.createElement('canvas'), bgc = bg.getContext('2d');
  let pal = {};
  function readPal() {
    const cs = getComputedStyle(document.documentElement);
    const v = (n) => cs.getPropertyValue(n).trim() || '#888';
    pal = { surface: v('--surface'), surface2: v('--surface-2'), ink: v('--ink'), ink3: v('--ink-3'), line: v('--line'), accent: v('--accent'), good: v('--good'), bad: v('--bad') };
  }
  const textCol = () => P.theme === 'range' ? pal.ink : P.theme === 'meadow' ? '#16361f' : '#ffffff';
  const starSeed = seeded('stars');
  let stars = [], clouds = [], motes = [];
  function resize() {
    const r = arena.getBoundingClientRect();
    W = Math.max(200, r.width); H = Math.max(200, r.height);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    bg.width = cv.width; bg.height = cv.height;
    k = Math.max(.72, Math.min(1.1, Math.min(W, H) / 520));
    const rr = seeded('bg' + Math.round(W));
    stars = Array.from({ length: 70 }, () => ({ x: rr() * W, y: rr() * H, r: rr() * 1.6 + .4, p: rr() * TAU, s: .5 + rr() * 2 }));
    clouds = Array.from({ length: 4 }, (_, i) => ({ x: rr() * W, y: 30 + i * H * .12 + rr() * 30, s: .6 + rr() * .7, v: 6 + rr() * 10 }));
    motes = Array.from({ length: 18 }, () => ({ x: rr() * W, y: rr() * H, r: 2 + rr() * 5, v: 4 + rr() * 8, p: rr() * TAU }));
    repaintBg();
    if (S) S.targets.forEach((t) => { t.x = Math.min(Math.max(t.r + 6, t.x), W - t.r - 6); t.y = Math.min(Math.max(t.r + 56, t.y), H - t.r - 10); });
  }
  const repaintBg = () => paintBg(bgc, W, H, dpr);
  function paintBg(c, W, H, s) {
    readPal();
    c.setTransform(s, 0, 0, s, 0, 0);
    c.clearRect(0, 0, W, H);
    if (P.theme === 'range') {
      c.fillStyle = pal.surface; c.fillRect(0, 0, W, H);
      const rg = c.createRadialGradient(W / 2, H * .45, 10, W / 2, H / 2, Math.max(W, H) * .75);
      rg.addColorStop(0, 'rgba(255,255,255,0)'); rg.addColorStop(1, Curio.isDark() ? 'rgba(0,0,0,.35)' : 'rgba(120,90,60,.10)');
      c.fillStyle = rg; c.fillRect(0, 0, W, H);
      c.fillStyle = pal.line;
      for (let x = 14; x < W; x += 28) for (let y = 14; y < H; y += 28) { c.beginPath(); c.arc(x, y, 1.3, 0, TAU); c.fill(); }
      c.strokeStyle = pal.line; c.lineWidth = 1.5; c.setLineDash([6, 8]);
      c.beginPath(); c.arc(W / 2, H / 2, Math.min(W, H) * .32, 0, TAU); c.stroke(); c.setLineDash([]);
    } else if (P.theme === 'night') {
      const lg = c.createLinearGradient(0, 0, 0, H); lg.addColorStop(0, '#0d1230'); lg.addColorStop(.6, '#1b2257'); lg.addColorStop(1, '#3a1d5c');
      c.fillStyle = lg; c.fillRect(0, 0, W, H);
      const hz = H * .62;
      const sun = c.createLinearGradient(0, hz - 120, 0, hz); sun.addColorStop(0, '#ffcf5c'); sun.addColorStop(1, '#ff4f8b');
      c.fillStyle = sun; c.beginPath(); c.arc(W / 2, hz, Math.min(W, H) * .2, Math.PI, 0); c.fill();
      c.fillStyle = '#1b2257';
      for (let i = 0; i < 5; i++) c.fillRect(W / 2 - Math.min(W, H) * .2, hz - 10 - i * 12, Math.min(W, H) * .4, 3 + i * .6);
      c.fillStyle = '#120c2c'; c.fillRect(0, hz, W, H - hz);
      c.strokeStyle = 'rgba(90,220,255,.35)'; c.lineWidth = 1.2;
      for (let i = -14; i <= 14; i++) { c.beginPath(); c.moveTo(W / 2 + i * 14, hz); c.lineTo(W / 2 + i * W * .16, H); c.stroke(); }
      for (let j = 0; j < 10; j++) { const y = hz + (H - hz) * Math.pow(j / 10, 1.8); c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    } else if (P.theme === 'space') {
      const rg = c.createRadialGradient(W * .4, H * .4, 10, W / 2, H / 2, Math.max(W, H)); rg.addColorStop(0, '#2b1d5e'); rg.addColorStop(1, '#05040d');
      c.fillStyle = rg; c.fillRect(0, 0, W, H);
      [['rgba(255,80,180,.18)', .2, .3, .45], ['rgba(80,160,255,.16)', .8, .7, .5], ['rgba(120,255,200,.08)', .6, .2, .3]].forEach(([col, x, y, s]) => {
        const n = c.createRadialGradient(W * x, H * y, 0, W * x, H * y, Math.max(W, H) * s); n.addColorStop(0, col); n.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = n; c.fillRect(0, 0, W, H);
      });
      const rr = seeded('sp' + Math.round(W));
      c.fillStyle = '#fff';
      for (let i = 0; i < 160; i++) { c.globalAlpha = .2 + rr() * .5; c.beginPath(); c.arc(rr() * W, rr() * H, rr() * .9 + .2, 0, TAU); c.fill(); }
      c.globalAlpha = 1;
      const px = W * .85, py = H * .2, pr = Math.min(W, H) * .07;
      const pg = c.createRadialGradient(px - pr * .4, py - pr * .4, 2, px, py, pr); pg.addColorStop(0, '#ffd59a'); pg.addColorStop(1, '#c0603a');
      c.fillStyle = pg; c.beginPath(); c.arc(px, py, pr, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,220,170,.6)'; c.lineWidth = 3; c.beginPath(); c.ellipse(px, py, pr * 1.8, pr * .45, -.35, 0, TAU); c.stroke();
    } else {
      const lg = c.createLinearGradient(0, 0, 0, H); lg.addColorStop(0, '#9fd8ff'); lg.addColorStop(.7, '#e4f6ff'); lg.addColorStop(1, '#e4f6ff');
      c.fillStyle = lg; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(255,236,150,.9)'; c.beginPath(); c.arc(W * .14, H * .16, Math.min(W, H) * .07, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,236,150,.3)'; c.beginPath(); c.arc(W * .14, H * .16, Math.min(W, H) * .11, 0, TAU); c.fill();
      const hill = (y, amp, col, ph) => { c.fillStyle = col; c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= W; x += 10) c.lineTo(x, y + Math.sin(x / W * 5 + ph) * amp); c.lineTo(W, H); c.fill(); };
      hill(H * .74, 16, '#a6dc8f', 1); hill(H * .82, 12, '#7cc36b', 3); hill(H * .9, 8, '#5aa94f', 5);
      c.fillStyle = 'rgba(255,255,255,.7)';
      const rr = seeded('fl' + Math.round(W));
      for (let i = 0; i < 40; i++) { c.beginPath(); c.arc(rr() * W, H * .84 + rr() * H * .16, 1.8, 0, TAU); c.fill(); }
    }
  }
  function drawLive(now) {
    const t = now / 1000;
    if (P.theme === 'space') {
      for (const s of stars) { g.globalAlpha = .25 + .75 * Math.abs(Math.sin(t * s.s + s.p)); g.fillStyle = '#fff'; g.beginPath(); g.arc(s.x, s.y, s.r, 0, TAU); g.fill(); }
      g.globalAlpha = 1;
    } else if (P.theme === 'meadow') {
      g.fillStyle = 'rgba(255,255,255,.85)';
      for (const cl of clouds) {
        const x = ((cl.x + t * cl.v) % (W + 200)) - 100, y = cl.y, s = cl.s * k;
        g.beginPath(); g.arc(x, y, 22 * s, 0, TAU); g.arc(x + 24 * s, y - 10 * s, 26 * s, 0, TAU); g.arc(x + 50 * s, y, 20 * s, 0, TAU); g.rect(x, y - 4 * s, 50 * s, 22 * s); g.fill();
      }
    } else if (P.theme === 'night') {
      const y = H * .62 + ((t * 30) % (H * .38));
      g.fillStyle = 'rgba(90,220,255,.12)'; g.fillRect(0, y, W, 2);
    } else {
      g.fillStyle = pal.accent;
      for (const m of motes) { g.globalAlpha = .05 + .04 * Math.sin(t + m.p); g.beginPath(); g.arc((m.x + Math.sin(t * .3 + m.p) * 20) % W, (m.y - t * m.v + H * 10) % H, m.r * 3, 0, TAU); g.fill(); }
      g.globalAlpha = 1;
    }
  }

  function hueOf(t) { return t.hue == null ? (t.hue = Math.floor((t.seed || Math.random()) * 360)) : t.hue; }
  function drawTarget(c, t, r, opts = {}) {
    const skin = opts.skin || P.skin;
    c.save(); c.translate(t.x, t.y);
    if (!opts.flat) { c.fillStyle = 'rgba(0,0,0,.16)'; c.beginPath(); c.ellipse(0, r * 1.08, r * .75, r * .18, 0, 0, TAU); c.fill(); }
    if (opts.precision) {
      const cols = ['#f4f1ea', '#f4f1ea', '#2a2a30', '#2a2a30', '#2f8fe0', '#2f8fe0', '#e53935', '#e53935', '#ffd23f', '#ffd23f'];
      for (let i = 0; i < 10; i++) {
        c.fillStyle = cols[i]; c.beginPath(); c.arc(0, 0, r * (10 - i) / 10, 0, TAU); c.fill();
        c.strokeStyle = i === 2 || i === 3 ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.25)'; c.lineWidth = 1; c.stroke();
      }
      c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 1; c.beginPath(); c.moveTo(-r * .05, 0); c.lineTo(r * .05, 0); c.moveTo(0, -r * .05); c.lineTo(0, r * .05); c.stroke();
    } else if (skin === 'bull') {
      const cols = ['#e53935', '#ffffff', '#e53935', '#ffffff', '#e53935'];
      c.fillStyle = '#a31f1c'; c.beginPath(); c.arc(0, r * .07, r, 0, TAU); c.fill();
      cols.forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(0, 0, r * (1 - i * .2), 0, TAU); c.fill(); });
      c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, r * .08, 0, TAU); c.fill();
    } else if (skin === 'neon') {
      const h = hueOf(t);
      c.fillStyle = 'rgba(10,8,30,.75)'; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
      c.shadowColor = `hsl(${h} 100% 60%)`; c.shadowBlur = 18;
      c.strokeStyle = `hsl(${h} 100% 65%)`; c.lineWidth = r * .16; c.beginPath(); c.arc(0, 0, r * .8, 0, TAU); c.stroke();
      c.strokeStyle = `hsl(${(h + 150) % 360} 100% 70%)`; c.lineWidth = r * .1; c.beginPath(); c.arc(0, 0, r * .42, 0, TAU); c.stroke();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, r * .12, 0, TAU); c.fill();
      c.shadowBlur = 0;
    } else if (skin === 'balloon') {
      const h = hueOf(t);
      c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, r); c.bezierCurveTo(r * .3, r * 1.3, -r * .3, r * 1.5, r * .1, r * 1.9); c.stroke();
      const gr = c.createRadialGradient(-r * .35, -r * .4, r * .1, 0, 0, r * 1.1);
      gr.addColorStop(0, `hsl(${h} 100% 78%)`); gr.addColorStop(.6, `hsl(${h} 85% 56%)`); gr.addColorStop(1, `hsl(${h} 80% 40%)`);
      c.fillStyle = gr; c.beginPath(); c.ellipse(0, 0, r * .86, r, 0, 0, TAU); c.fill();
      c.fillStyle = `hsl(${h} 80% 40%)`; c.beginPath(); c.moveTo(-r * .12, r * 1.08); c.lineTo(r * .12, r * 1.08); c.lineTo(0, r * .94); c.fill();
      c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(-r * .38, -r * .42, r * .14, r * .26, .5, 0, TAU); c.fill();
    } else if (skin === 'planet') {
      const h = hueOf(t);
      c.rotate(-.35);
      c.strokeStyle = `hsla(${(h + 40) % 360} 80% 75% / .9)`; c.lineWidth = r * .14;
      c.beginPath(); c.ellipse(0, 0, r * 1.45, r * .38, 0, Math.PI, TAU); c.stroke();
      const gr = c.createRadialGradient(-r * .35, -r * .35, r * .1, 0, 0, r);
      gr.addColorStop(0, `hsl(${h} 90% 75%)`); gr.addColorStop(1, `hsl(${h} 70% 38%)`);
      c.fillStyle = gr; c.beginPath(); c.arc(0, 0, r * .82, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(-r * .8, -r * .2, r * 1.6, r * .14); c.fillRect(-r * .7, r * .2, r * 1.4, r * .1);
      c.beginPath(); c.ellipse(0, 0, r * 1.45, r * .38, 0, 0, Math.PI); c.stroke();
    } else if (skin === 'gem') {
      const h = hueOf(t);
      const hex = (rad) => { c.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU - Math.PI / 2; c[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rad, Math.sin(a) * rad); } c.closePath(); };
      const gr = c.createLinearGradient(-r, -r, r, r); gr.addColorStop(0, `hsl(${h} 90% 75%)`); gr.addColorStop(1, `hsl(${h} 80% 35%)`);
      c.fillStyle = gr; hex(r); c.fill();
      c.fillStyle = `hsla(${h} 100% 88% / .7)`; hex(r * .55); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 1.2;
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU - Math.PI / 2; c.beginPath(); c.moveTo(Math.cos(a) * r * .55, Math.sin(a) * r * .55); c.lineTo(Math.cos(a) * r, Math.sin(a) * r); c.stroke(); }
    } else {
      c.fillStyle = '#d99a5b'; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.arc(0, 0, r * .3, 0, TAU, true); c.fill();
      const h = hueOf(t);
      c.fillStyle = `hsl(${h} 80% 78%)`; c.beginPath();
      for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU, rr = r * (.86 + Math.sin(i * 2.7) * .05); c[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr); }
      c.closePath(); c.moveTo(r * .36, 0); c.arc(0, 0, r * .36, 0, TAU, true); c.fill();
      c.strokeStyle = '#a5672e'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, r * .3, 0, TAU); c.stroke();
      const sc = ['#ff5a36', '#2f7bf0', '#ffd23f', '#1faa59', '#fff'];
      for (let i = 0; i < 14; i++) { const a = i * 2.4, d = r * (.45 + (i % 3) * .13); c.save(); c.translate(Math.cos(a) * d, Math.sin(a) * d); c.rotate(a * 3); c.fillStyle = sc[i % 5]; c.fillRect(-r * .08, -r * .025, r * .16, r * .05); c.restore(); }
    }
    if (!opts.flat && skin !== 'neon' && skin !== 'donut' && !opts.precision) {
      const hl = c.createRadialGradient(-r * .4, -r * .45, 0, -r * .4, -r * .45, r * .8);
      hl.addColorStop(0, 'rgba(255,255,255,.35)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = hl; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
    }
    c.restore();
  }

  let state = 'menu', mode = P.mode, diff = P.diff, daily = false, S = null, rng = Math.random;
  let pausedTotal = 0, pauseAt = 0, pausedFrom = '';
  const clock = () => performance.now() - pausedTotal;
  const aim = { x: 0, y: 0, on: false, touch: false, down: false, type: 'mouse' };
  let parts = [], shake = 0, lastFrame = 0, countTimer = 0;

  const R = (a, b) => a + rng() * (b - a);
  const D = () => DIFFS[daily ? 'normal' : diff];
  const tr = () => D().r * k * (P.assist ? 1.2 : 1);
  const hitPad = () => P.assist ? 1.15 : 1;

  function newSession() {
    rng = daily ? seeded(today() + mode) : Math.random;
    S = { mode, diff: daily ? 'normal' : diff, daily, start: clock(), targets: [], shots: [], hits: 0, misses: 0, times: [], score: 0, combo: 0, maxCombo: 0, spawned: 0, expired: 0, caught: 0, onMs: 0, totalMs: 0, lockMs: 0, bestLock: 0, perSec: [], points: [], bulls: 0, last: null, dirs: [], nextAt: 0, path: [], ptr: [], sampleAt: 0, gridLast: -1, tickSec: -1, dur: mode === 'grid' || mode === 'track' ? 30000 : 0, total: mode === 'classic' ? 30 : mode === 'flick' ? 25 : mode === 'precision' ? 20 : 0 };
  }
  function randomPos(r, avoid) {
    const top = 58 + r, bot = H - r - 12, left = r + 10, right = W - r - 10;
    let p, n = 0;
    do { p = { x: R(left, right), y: R(top, Math.max(top + 1, bot)) }; }
    while (avoid && Math.hypot(p.x - avoid.x, p.y - avoid.y) < Math.min(W, H) * .3 && ++n < 40);
    return p;
  }
  function spawn(extra = {}) {
    const now = clock();
    const r = extra.r || tr();
    const p = extra.pos || randomPos(r, S.last);
    const t = Object.assign({ x: p.x, y: p.y, r, born: now, seed: rng(), id: Math.random(), from: S.last ? { x: S.last.x, y: S.last.y } : null }, extra);
    S.targets.push(t); S.spawned++;
    return t;
  }
  function gridCells() {
    const cols = W / H > 1.25 ? 5 : W / H < .8 ? 3 : 4, rows = W / H > 1.25 ? 3 : W / H < .8 ? 5 : 4;
    const top = 60, mx = 16, cw = (W - mx * 2) / cols, ch = (H - top - 14) / rows;
    const out = [];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) out.push({ x: mx + cw * (i + .5), y: top + ch * (j + .5), cw, ch });
    return out;
  }
  function gridSpawn() {
    const cells = gridCells();
    const used = new Set(S.targets.map((t) => t.cell));
    const free = cells.map((c, i) => i).filter((i) => !used.has(i) && i !== S.gridLast);
    const i = free[Math.floor(rng() * free.length)];
    const c = cells[i];
    const r = Math.min(tr(), c.cw * .42, c.ch * .42);
    spawn({ pos: { x: c.x + (rng() - .5) * Math.max(0, c.cw - r * 2) * .4, y: c.y + (rng() - .5) * Math.max(0, c.ch - r * 2) * .4 }, cell: i, r });
  }

  function burst(x, y, col, n = 14, big = 1) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, v = (80 + Math.random() * 260) * big;
      parts.push({ kind: 'shard', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, life: 0, max: .45 + Math.random() * .35, col, s: 3 + Math.random() * 5, rot: Math.random() * TAU, vr: (Math.random() - .5) * 14 });
    }
    parts.push({ kind: 'ring', x, y, life: 0, max: .4, col, r0: 10, r1: 60 * big * k });
  }
  function popText(x, y, text, col, size = 16) { x = Math.max(size * 3, Math.min(W - size * 3, x)); parts.push({ kind: 'text', x, y, life: 0, max: .8, text, col, size }); }
  function targetColor(t) {
    if (P.skin === 'bull') return '#e53935';
    if (P.skin === 'donut') return '#ff7eb6';
    return `hsl(${hueOf(t)} 90% 60%)`;
  }

  function shoot(x, y) {
    const now = clock();
    if (mode === 'track') return;
    let best = null, bd = Infinity;
    for (const t of S.targets) {
      const r = curR(t, now) * (mode === 'precision' ? 1 : hitPad());
      const d = Math.hypot(x - t.x, y - t.y);
      if (d <= r && d < bd) { best = t; bd = d; }
    }
    S.shots.push({ x: x / W, y: y / H, hit: !!best });
    if (mode === 'precision') {
      const t = S.targets[0]; if (!t) return;
      const d = Math.hypot(x - t.x, y - t.y), r = curR(t, now);
      const pts = d <= r ? Math.max(1, 10 - Math.floor(d / r * 10)) : 0;
      S.points.push(pts); S.score += pts; S.times.push(Math.round(now - t.born));
      S.targets = []; S.last = { x: t.x, y: t.y };
      if (pts) { S.hits++; const col = pts >= 9 ? '#ffd23f' : pts >= 7 ? '#e53935' : pts >= 5 ? '#2f8fe0' : pts >= 3 ? '#2a2a30' : '#d7d0c3'; burst(x, y, col, pts >= 9 ? 22 : 10, pts >= 9 ? 1.2 : .7); popText(t.x, t.y - r - 10, pts === 10 ? '10 GOLD!' : '+' + pts, pts >= 9 ? '#e0a800' : textCol(), pts === 10 ? 22 : 17); if (pts === 10) { S.bulls++; sfx('gold'); } else sfx('hit', pts); buzz(8); }
      else { S.misses++; popText(x, y, '0', pal.bad, 18); sfx('miss'); shake = 6; buzz(25); }
      parts.push({ kind: 'mark', x, y, life: 0, max: .9 });
      S.nextAt = now + 260;
      updateHud(true);
      if (S.points.length >= S.total) setTimeout(() => state === 'play' && finish(), 450);
      return;
    }
    if (!best) {
      S.misses++;
      parts.push({ kind: 'x', x, y, life: 0, max: .5 });
      for (let i = 0; i < 5; i++) { const a = Math.random() * TAU; parts.push({ kind: 'dust', x, y, vx: Math.cos(a) * 60, vy: Math.sin(a) * 60, life: 0, max: .35, s: 3 }); }
      if (mode === 'grid' && S.combo >= 5) popText(x, y - 20, 'combo lost', pal.bad, 14);
      S.combo = 0; shake = Math.max(shake, 5);
      sfx('miss'); buzz(25);
      updateHud(true);
      return;
    }
    const ms = Math.round(now - best.born);
    S.hits++; S.combo++; S.maxCombo = Math.max(S.maxCombo, S.combo);
    S.targets = S.targets.filter((t) => t !== best);
    const col = targetColor(best);
    burst(best.x, best.y, col, 16, Math.max(.7, best.r / 34));
    if (best.from) S.dirs.push({ dx: best.x - best.from.x, dy: best.y - best.from.y, ms });
    S.last = { x: best.x, y: best.y };
    sfx('hit', Math.min(20, S.combo)); buzz(8);
    if (mode === 'classic') {
      S.times.push(ms);
      popText(best.x, best.y - best.r - 8, ms + 'ms', textCol());
      if (S.hits >= S.total) { updateHud(true); return finish(); }
      spawn();
    } else if (mode === 'grid') {
      const mult = 1 + Math.min(S.combo, 20) * .05;
      const pts = Math.round(100 * mult);
      S.score += pts; S.times.push(ms);
      S.perSec.push(now - S.start);
      popText(best.x, best.y - best.r - 6, '+' + pts, textCol(), 15);
      if (S.combo && S.combo % 5 === 0) { popText(W / 2, 90, S.combo + ' combo!', MODES.grid.color, 26); sfx('combo'); }
      S.gridLast = best.cell;
      gridSpawn();
    } else if (mode === 'flick') {
      const life = best.life, frac = Math.max(0, 1 - (now - best.born) / life);
      const pts = 100 + Math.round(100 * frac);
      S.score += pts; S.caught++; S.times.push(ms);
      popText(best.x, best.y - best.r - 6, '+' + pts, textCol(), 15);
      S.nextAt = now + R(220, 520);
    }
    updateHud(true);
  }
  function curR(t, now) {
    const age = now - t.born;
    let s = age < 170 ? easeBack(age / 170) : 1;
    if (mode === 'flick' && t.life) s *= 1 - .3 * Math.min(1, age / t.life);
    return t.r * Math.max(.05, s);
  }
  function easeBack(x) { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }

  function step(now, dt) {
    if (state !== 'play' || !S) return;
    const el = now - S.start;
    if (mode === 'flick') {
      for (const t of S.targets.slice()) {
        if (now - t.born > t.life) {
          S.targets = S.targets.filter((x) => x !== t); S.expired++; S.combo = 0;
          parts.push({ kind: 'ring', x: t.x, y: t.y, life: 0, max: .35, col: pal.ink3, r0: t.r * .7, r1: t.r * 1.1 });
          popText(t.x, t.y, 'missed', pal.ink3, 13); sfx('expire');
          S.last = { x: t.x, y: t.y }; S.nextAt = now + R(220, 520);
          updateHud(true);
        }
      }
      if (!S.targets.length && now >= S.nextAt) {
        if (S.spawned >= S.total) return finish();
        spawn({ life: D().life });
      }
    }
    if (mode === 'precision' && !S.targets.length && now >= S.nextAt && S.points.length < S.total) spawn({ r: D().pr * k * (P.assist ? 1.2 : 1) });
    if (mode === 'track') {
      const t = S.targets[0];
      if (t) {
        const sp = D().speed * k * t.sp;
        t.turn += (rng() - .5) * dt * 6; t.turn = Math.max(-2.2, Math.min(2.2, t.turn));
        t.a += t.turn * dt;
        t.sp += (rng() - .5) * dt * .8; t.sp = Math.max(.7, Math.min(1.35, t.sp));
        t.x += Math.cos(t.a) * sp * dt; t.y += Math.sin(t.a) * sp * dt;
        const top = 58 + t.r, bot = H - t.r - 12;
        if (t.x < t.r + 8) { t.x = t.r + 8; t.a = Math.PI - t.a; } if (t.x > W - t.r - 8) { t.x = W - t.r - 8; t.a = Math.PI - t.a; }
        if (t.y < top) { t.y = top; t.a = -t.a; } if (t.y > bot) { t.y = bot; t.a = -t.a; }
        const live = aim.touch ? aim.down : aim.on;
        const on = live && Math.hypot(aim.x - t.x, aim.y - t.y) <= t.r * hitPad() * 1.05;
        S.totalMs += dt * 1000;
        const sec = Math.floor(el / 1000);
        if (!S.perSec[sec]) S.perSec[sec] = { on: 0, all: 0 };
        S.perSec[sec].all += dt; if (on) S.perSec[sec].on += dt;
        if (on) { S.onMs += dt * 1000; S.lockMs += dt * 1000; S.bestLock = Math.max(S.bestLock, S.lockMs); if (Math.random() < dt * 30) parts.push({ kind: 'spark', x: t.x + (Math.random() - .5) * t.r * 2, y: t.y + (Math.random() - .5) * t.r * 2, vy: -40, life: 0, max: .5 }); }
        else S.lockMs = 0;
        t.onNow = on;
        if (now - S.sampleAt > 100) { S.sampleAt = now; S.path.push([t.x / W, t.y / H]); if (live) S.ptr.push([aim.x / W, aim.y / H]); else S.ptr.push(null); }
      }
    }
    if (S.dur) {
      const left = S.dur - el;
      const sec = Math.ceil(left / 1000);
      if (sec <= 5 && sec !== S.tickSec && sec > 0) { S.tickSec = sec; sfx('tick'); }
      if (left <= 0) return finish();
    }
    if (now - (S.hudAt || 0) > 90) { S.hudAt = now; updateHud(false); }
  }

  function render(now, dt) {
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (shake > .1) { g.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake); shake *= Math.pow(.001, dt); } else shake = 0;
    g.drawImage(bg, 0, 0, W, H);
    drawLive(now);
    if (S && (state === 'play' || state === 'paused')) {
      const cnow = state === 'paused' ? pauseAt - pausedTotal : clock();
      if (mode === 'grid') {
        g.strokeStyle = P.theme === 'range' ? pal.line : 'rgba(255,255,255,.12)'; g.lineWidth = 1.5; g.setLineDash([4, 6]);
        for (const c of gridCells()) { g.beginPath(); g.roundRect ? g.roundRect(c.x - c.cw / 2 + 4, c.y - c.ch / 2 + 4, c.cw - 8, c.ch - 8, 14) : g.rect(c.x - c.cw / 2 + 4, c.y - c.ch / 2 + 4, c.cw - 8, c.ch - 8); g.stroke(); }
        g.setLineDash([]);
      }
      for (const t of S.targets) {
        const r = curR(t, cnow);
        if (mode === 'track') {
          g.save();
          g.strokeStyle = t.onNow ? '#2bd46e' : (P.theme === 'range' ? pal.ink3 : 'rgba(255,255,255,.5)');
          g.lineWidth = t.onNow ? 5 : 2.5; g.setLineDash(t.onNow ? [] : [6, 6]);
          g.lineDashOffset = -now / 40;
          g.beginPath(); g.arc(t.x, t.y, r * 1.35 + (t.onNow ? Math.sin(now / 90) * 3 : 0), 0, TAU); g.stroke();
          g.restore();
        }
        drawTarget(g, t, r, { precision: mode === 'precision' });
        if (mode === 'flick' && t.life) {
          const f = Math.max(0, 1 - (cnow - t.born) / t.life);
          g.strokeStyle = f < .3 ? '#ff4f4f' : (P.theme === 'range' ? pal.ink : '#fff'); g.lineWidth = 3.5; g.lineCap = 'round';
          g.beginPath(); g.arc(t.x, t.y, r + 7, -Math.PI / 2, -Math.PI / 2 + f * TAU); g.stroke();
        }
      }
    }
    for (const p of parts) {
      p.life += dt; const f = p.life / p.max;
      if (p.kind === 'shard') {
        p.vy += 600 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.vx *= .98;
        g.save(); g.globalAlpha = Math.max(0, 1 - f); g.translate(p.x, p.y); g.rotate(p.rot); g.fillStyle = p.col; g.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6); g.restore();
      } else if (p.kind === 'ring') {
        g.globalAlpha = Math.max(0, 1 - f); g.strokeStyle = p.col; g.lineWidth = 4 * (1 - f) + 1;
        g.beginPath(); g.arc(p.x, p.y, p.r0 + (p.r1 - p.r0) * (1 - Math.pow(1 - f, 3)), 0, TAU); g.stroke(); g.globalAlpha = 1;
      } else if (p.kind === 'text') {
        g.globalAlpha = Math.max(0, 1 - f * f); g.fillStyle = p.col; g.font = `900 ${p.size}px ui-rounded, system-ui, sans-serif`; g.textAlign = 'center';
        g.strokeStyle = P.theme === 'range' ? pal.surface : 'rgba(0,0,0,.5)'; g.lineWidth = 4; g.lineJoin = 'round';
        const y = p.y - 34 * (1 - Math.pow(1 - f, 2));
        g.strokeText(p.text, p.x, y); g.fillText(p.text, p.x, y); g.globalAlpha = 1;
      } else if (p.kind === 'x') {
        const s = 9 * (1 + f * .5); g.globalAlpha = Math.max(0, 1 - f); g.strokeStyle = '#ff4f4f'; g.lineWidth = 4; g.lineCap = 'round';
        g.beginPath(); g.moveTo(p.x - s, p.y - s); g.lineTo(p.x + s, p.y + s); g.moveTo(p.x + s, p.y - s); g.lineTo(p.x - s, p.y + s); g.stroke(); g.globalAlpha = 1;
      } else if (p.kind === 'dust') {
        p.x += p.vx * dt; p.y += p.vy * dt; g.globalAlpha = Math.max(0, .6 - f * .6); g.fillStyle = pal.ink3; g.beginPath(); g.arc(p.x, p.y, p.s * (1 + f), 0, TAU); g.fill(); g.globalAlpha = 1;
      } else if (p.kind === 'mark') {
        g.globalAlpha = Math.max(0, 1 - f); g.fillStyle = '#111'; g.beginPath(); g.arc(p.x, p.y, 3, 0, TAU); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke(); g.globalAlpha = 1;
      } else if (p.kind === 'spark') {
        p.y += p.vy * dt; g.globalAlpha = Math.max(0, 1 - f); g.fillStyle = '#2bd46e'; g.beginPath(); g.arc(p.x, p.y, 2.5, 0, TAU); g.fill(); g.globalAlpha = 1;
      }
    }
    parts = parts.filter((p) => p.life < p.max);
    if (parts.length > 400) parts.splice(0, parts.length - 400);
    if (aim.on && !aim.touch && state === 'play' && P.cross !== 'system') drawCross(g, aim.x, aim.y);
  }
  function drawCross(g, x, y, style = P.cross) {
    const col = P.theme === 'range' ? pal.accent : '#7dffb0';
    const pass = (w, c) => {
      g.strokeStyle = c; g.fillStyle = c; g.lineWidth = w; g.lineCap = 'round';
      if (style === 'cross') { g.beginPath(); [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([a, b]) => { g.moveTo(x + a * 5, y + b * 5); g.lineTo(x + a * 14, y + b * 14); }); g.stroke(); g.beginPath(); g.arc(x, y, 1.6, 0, TAU); g.fill(); }
      else if (style === 'dot') { g.beginPath(); g.arc(x, y, 3.5, 0, TAU); g.fill(); }
      else { g.beginPath(); g.arc(x, y, 11, 0, TAU); g.stroke(); g.beginPath(); g.arc(x, y, 1.6, 0, TAU); g.fill(); }
    };
    pass(4.5, 'rgba(0,0,0,.45)'); pass(2.2, col);
  }

  function loop(ts) {
    requestAnimationFrame(loop);
    if (document.hidden) { lastFrame = ts; return; }
    const dt = Math.min(.05, Math.max(0, (ts - (lastFrame || ts)) / 1000)); lastFrame = ts;
    const now = clock();
    step(now, dt);
    render(state === 'paused' ? pauseAt - pausedTotal : now, dt);
  }

  const hudEls = {};
  function hudDef() {
    if (mode === 'classic') return [[['left', 'Left'], ['avg', 'Avg']], [['acc', 'Accuracy'], ['best', 'Best']]];
    if (mode === 'grid') return [[['time', 'Time'], ['score', 'Score']], [['combo', 'Combo'], ['acc', 'Accuracy']]];
    if (mode === 'flick') return [[['left', 'Left'], ['score', 'Score']], [['caught', 'Caught'], ['acc', 'Accuracy']]];
    if (mode === 'track') return [[['time', 'Time'], ['on', 'On target']], [['lock', 'Lock'], ['best', 'Best']]];
    return [[['left', 'Shots'], ['score', 'Points']], [['last', 'Last'], ['bulls', 'Golds']]];
  }
  function buildHud() {
    const [l, r] = hudDef();
    const mk = (arr) => arr.map(([key, lab]) => `<div class="at-pill" data-k="${key}"><b>-</b><span>${lab}</span></div>`).join('');
    $('hudL').innerHTML = mk(l); $('hudR').innerHTML = mk(r);
    document.querySelectorAll('.at-pill').forEach((p) => { hudEls[p.dataset.k] = p; });
  }
  function setHud(key, v, bump) {
    const p = hudEls[key]; if (!p || !p.isConnected) return;
    const b = p.firstChild; const s = String(v);
    if (b.textContent !== s) { b.textContent = s; if (bump) { p.classList.remove('is-bump'); void p.offsetWidth; p.classList.add('is-bump'); } }
  }
  const accPct = () => S.hits + S.misses ? Math.round(S.hits / (S.hits + S.misses) * 100) : 100;
  function updateHud(bump) {
    if (!S) return;
    const el = clock() - S.start;
    const bk = Curio.getBest(bestKey(mode, S.diff));
    if (mode === 'classic') {
      setHud('left', S.total - S.hits, bump); setHud('avg', S.times.length ? Math.round(avg(S.times)) + 'ms' : '-'); setHud('acc', accPct() + '%'); setHud('best', bk != null ? bk + 'ms' : '-');
      $('bar').style.width = (S.hits / S.total * 100) + '%';
    } else if (mode === 'grid') {
      setHud('time', Math.max(0, Math.ceil((S.dur - el) / 1000))); setHud('score', Curio.fmt(S.score), bump); setHud('combo', 'x' + S.combo, bump && S.combo > 0); setHud('acc', accPct() + '%');
      hudEls.combo?.classList.toggle('is-hot', S.combo >= 10);
      $('bar').style.width = Math.min(100, el / S.dur * 100) + '%';
    } else if (mode === 'flick') {
      setHud('left', Math.max(0, S.total - S.spawned + S.targets.length)); setHud('score', Curio.fmt(S.score), bump); setHud('caught', S.caught + '/' + S.total, bump); setHud('acc', accPct() + '%');
      $('bar').style.width = ((S.caught + S.expired) / S.total * 100) + '%';
    } else if (mode === 'track') {
      setHud('time', Math.max(0, Math.ceil((S.dur - el) / 1000))); setHud('on', S.totalMs ? Math.round(S.onMs / S.totalMs * 100) + '%' : '0%'); setHud('lock', (S.lockMs / 1000).toFixed(1) + 's'); setHud('best', (S.bestLock / 1000).toFixed(1) + 's');
      hudEls.lock?.classList.toggle('is-hot', S.lockMs > 2000);
      $('bar').style.width = Math.min(100, el / S.dur * 100) + '%';
    } else {
      setHud('left', S.total - S.points.length, bump); setHud('score', S.score, bump); setHud('last', S.points.length ? S.points[S.points.length - 1] : '-', bump); setHud('bulls', S.bulls, bump);
      $('bar').style.width = (S.points.length / S.total * 100) + '%';
    }
  }
  const avg = (a) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;

  function show(id) { ['startScreen', 'countScreen', 'pauseScreen', 'endScreen'].forEach((s) => { $(s).hidden = s !== id; }); }
  function paintStart() {
    const m = MODES[mode];
    arena.style.setProperty('--mc', m.color);
    $('startArt').innerHTML = ICONS[mode];
    $('startArt').style.setProperty('--mc', m.color);
    $('startKick').textContent = daily ? 'Daily challenge · ' + today() : 'Drill ' + (ORDER.indexOf(mode) + 1) + ' of 5 · ' + DIFFS[diff].name;
    $('startTitle').textContent = m.name;
    $('startDesc').textContent = m.desc;
    const pb = Curio.getBest(bestKey(mode, daily ? 'normal' : diff));
    const dk = P.daily[today() + ':' + mode];
    $('startBest').textContent = daily ? (dk != null ? 'Your best today: ' + fmtScore(mode, dk) : 'Same targets for everyone today. Normal difficulty.') : pb != null ? 'Personal best: ' + fmtScore(mode, pb) : 'No score yet. Press Space to start.';
  }

  function begin() {
    if (state === 'count' || state === 'play') return;
    Curio.audioContext && !Curio.muted && Curio.audioContext();
    newSession(); buildHud(); updateHud(false);
    const ar = arena.getBoundingClientRect();
    if (ar.top < 52 || ar.bottom > innerHeight) arena.scrollIntoView({ behavior: 'smooth', block: ar.height < innerHeight - 60 ? 'center' : 'end' });
    $('breakdown').classList.remove('is-on');
    state = 'count'; show('countScreen');
    arena.classList.add('is-playing'); arena.classList.toggle('no-cursor', P.cross !== 'system');
    parts = [];
    let n = 3;
    const tick = () => {
      if (state !== 'count') return;
      if (n === 0) { show(''); state = 'play'; startPlay(); return; }
      const c = $('count'); c.textContent = n; c.style.animation = 'none'; void c.offsetWidth; c.style.animation = '';
      sfx('count'); n--; countTimer = setTimeout(tick, 520);
    };
    tick();
  }
  function startPlay() {
    S.start = clock(); sfx('go');
    if (mode === 'classic') spawn();
    else if (mode === 'grid') { gridSpawn(); gridSpawn(); gridSpawn(); }
    else if (mode === 'flick') S.nextAt = clock() + 200;
    else if (mode === 'track') {
      const r = (DIFFS[S.diff].r + 6) * k * (P.assist ? 1.2 : 1);
      spawn({ pos: { x: W / 2, y: H / 2 + 20 }, r, a: rng() * TAU, turn: 0, sp: 1 });
    } else S.nextAt = clock() + 100;
    updateHud(false);
    if (!P.tip && matchMedia('(pointer: fine)').matches) { P.tip = true; save(); Curio.toast(Curio.touchpad ? 'Touchpad tip: turn on Aim assist in 🎨 Look for bigger hit areas' : 'Tip: on a touchpad? Turn on Touchpad mode in the top bar and Aim assist in 🎨 Look', 3600); }
  }
  function stop() {
    clearTimeout(countTimer);
    state = 'menu'; S = null; parts = [];
    arena.classList.remove('is-playing', 'no-cursor');
    paintStart(); show('startScreen');
  }
  function pause() {
    if (state !== 'play' && state !== 'count') return;
    clearTimeout(countTimer);
    pausedFrom = state; state = 'paused'; pauseAt = performance.now();
    show('pauseScreen');
  }
  function resume() {
    if (state !== 'paused') return;
    pausedTotal += performance.now() - pauseAt;
    if (pausedFrom === 'count') { state = 'menu'; begin(); return; }
    state = 'play'; show('');
  }

  function rate(m, score, d) {
    const mul = DIFFS[d].mul;
    if (m === 'classic') { const v = score / mul; return v < 380 ? 5 : v < 430 ? 4 : v < 500 ? 3 : v < 600 ? 2 : v < 720 ? 1 : 0; }
    const v = m === 'track' ? score : score * mul;
    const th = { grid: [2000, 4000, 6000, 8000, 10000], flick: [1400, 2200, 3000, 3600, 4200], track: [30, 44, 58, 72, 85], precision: [80, 110, 135, 155, 175] }[m];
    let r = 0; th.forEach((t, i) => { if (v >= t) r = i + 1; }); return r;
  }
  function medalSvg(tier) {
    const m = MEDALS[tier];
    return `<defs><linearGradient id="mg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${m.c1}"/><stop offset="1" stop-color="${m.c2}"/></linearGradient></defs>
      <path d="M32 4 L44 4 L50 30 L38 34Z" fill="#e53935"/><path d="M68 4 L56 4 L50 30 L62 34Z" fill="#2f7bf0"/>
      <circle cx="50" cy="60" r="34" fill="${m.c2}"/><circle cx="50" cy="58" r="33" fill="url(#mg)"/><circle cx="50" cy="58" r="25" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2.5"/>
      <path d="M50 40 L55.3 51 L67 52.6 L58.4 60.6 L60.6 72.4 L50 66.7 L39.4 72.4 L41.6 60.6 L33 52.6 L44.7 51Z" fill="rgba(255,255,255,.85)"/>
      <ellipse cx="38" cy="42" rx="9" ry="5" fill="rgba(255,255,255,.4)" transform="rotate(-30 38 42)"/>`;
  }

  let lastRes = null;
  function finish() {
    if (state !== 'play') return;
    state = 'end';
    const m = MODES[mode], d = S.diff;
    const dur = clock() - S.start;
    let score;
    if (mode === 'classic') score = Math.round(avg(S.times));
    else if (mode === 'track') score = S.totalMs ? Math.round(S.onMs / S.totalMs * 100) : 0;
    else score = S.score;
    const acc = mode === 'track' ? score : accPct();
    const prev = Curio.getBest(bestKey(mode, d));
    const b = Curio.best(bestKey(mode, d), score, !m.lower);
    const improved = b.isNew && prev != null;
    if (!P.hist[bestKey(mode, d)]) P.hist[bestKey(mode, d)] = [];
    const H2 = P.hist[bestKey(mode, d)];
    H2.push({ s: score, a: acc, ts: Date.now() }); if (H2.length > 50) H2.shift();
    P.done[mode] = (P.done[mode] || 0) + 1;
    P.tot.sessions++; P.tot.hits += S.hits; P.tot.shots += S.hits + S.misses; P.tot.ms += Math.round(dur);
    let dailyNote = '';
    if (S.daily) { const kk = today() + ':' + mode; const pv = P.daily[kk]; if (pv == null || (m.lower ? score < pv : score > pv)) P.daily[kk] = score; dailyNote = 'Daily best: ' + fmtScore(mode, P.daily[kk]); }
    save();
    const tier = rate(mode, score, d);
    unlock('first');
    if (mode === 'classic' && score < 450) unlock('c450');
    if (mode === 'classic' && score < 380) unlock('c380');
    if (mode === 'grid' && score >= 6000) unlock('g6k');
    if (mode === 'grid' && score >= 10000) unlock('g10k');
    if (S.maxCombo >= 20) unlock('combo');
    if (mode === 'flick' && S.caught >= 20) unlock('f20');
    if (mode === 'flick' && S.caught >= 25) unlock('f25');
    if (mode === 'track' && score >= 60) unlock('t60');
    if (mode === 'track' && score >= 85) unlock('t85');
    if (mode === 'precision' && score >= 150) unlock('p150');
    if (mode === 'precision' && S.bulls >= 5) unlock('bulls');
    if (mode !== 'track' && mode !== 'flick' && S.hits + S.misses >= 20 && S.misses === 0) unlock('flawless');
    if (d === 'hard' && !S.daily) unlock('hard');
    if (ORDER.every((x) => P.done[x])) unlock('all');
    if (S.daily) unlock('daily');
    if (P.tot.hits >= 500) unlock('h500');
    if (P.tot.sessions >= 25) unlock('reg');

    arena.classList.remove('is-playing', 'no-cursor');
    $('medal').innerHTML = medalSvg(tier);
    $('endKick').textContent = `${m.name} · ${DIFFS[d].name}${S.daily ? ' · daily' : ''} · ${MEDALS[tier].name}`;
    $('endScore').textContent = mode === 'classic' ? score : mode === 'track' ? score + '%' : Curio.fmt(score);
    $('endUnit').textContent = mode === 'track' ? 'time on target' : m.unit;
    $('endNew').innerHTML = improved ? '<span class="at-new">New personal best</span>' : '';
    $('endVerdict').textContent = VERDICTS[tier] + (dailyNote ? ' ' + dailyNote + '.' : '');
    const tiles = [];
    if (mode === 'classic') tiles.push(['Accuracy', acc + '%'], ['Fastest', Math.min(...S.times) + 'ms'], ['Total', (dur / 1000).toFixed(1) + 's'], ['Best', b.best + 'ms']);
    else if (mode === 'grid') tiles.push(['Hits', S.hits], ['Accuracy', acc + '%'], ['Max combo', S.maxCombo], ['Best', Curio.fmt(b.best)]);
    else if (mode === 'flick') tiles.push(['Caught', S.caught + '/' + S.total], ['Accuracy', acc + '%'], ['Avg catch', S.times.length ? Math.round(avg(S.times)) + 'ms' : '-'], ['Best', Curio.fmt(b.best)]);
    else if (mode === 'track') tiles.push(['Longest lock', (S.bestLock / 1000).toFixed(1) + 's'], ['On target', (S.onMs / 1000).toFixed(1) + 's'], ['Difficulty', DIFFS[d].name], ['Best', b.best + '%']);
    else tiles.push(['Golds', S.bulls], ['Misses', S.misses], ['Avg / shot', (score / S.total).toFixed(1)], ['Best', b.best]);
    $('endTiles').innerHTML = tiles.map(([a, v]) => `<div><b>${v}</b><span>${a}</span></div>`).join('');
    show('endScreen');
    sfx('end');
    if (improved || tier >= 4) Curio.confetti();
    lastRes = { mode, d, score, acc, tier, daily: S.daily };
    renderBreakdown();
    paintModes();
    if (!$('info').hidden && $('info').dataset.p === 'stats') renderInfo('stats');
    $('again').focus({ preventScroll: true });
  }

  function unlock(id) {
    if (P.ach[id]) return;
    const a = ACH.find((x) => x.id === id); if (!a) return;
    P.ach[id] = Date.now(); save();
    const n = Object.keys(P.ach).length;
    setTimeout(() => {
      const el = document.createElement('div'); el.className = 'at-badge';
      el.style.marginTop = document.querySelectorAll('.at-badge').length * 56 + 'px';
      el.innerHTML = `<i>${a.em}</i><span><small>Badge unlocked</small><b></b></span>`; el.querySelector('b').textContent = a.name;
      document.body.append(el); setTimeout(() => el.remove(), 3300);
      sfx('combo');
    }, 400);
    $('achCount').textContent = `${n}/${ACH.length}`;
  }

  function spark(list, lower, w = 300, h = 44, col = 'var(--accent)') {
    if (list.length < 2) return `<svg class="at-spark" viewBox="0 0 ${w} ${h}" role="img" aria-label="Not enough sessions yet"><text x="${w / 2}" y="${h / 2 + 4}" text-anchor="middle" style="fill:var(--ink-3);font-size:12px;font-weight:700">Play more to see a trend</text></svg>`;
    const mx = Math.max(...list), mn = Math.min(...list);
    const x = (i) => 6 + i / (list.length - 1) * (w - 12);
    const y = (v) => h - 6 - (v - mn) / Math.max(1, mx - mn) * (h - 14);
    const best = lower ? mn : mx, bi = list.lastIndexOf(best);
    const d = list.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
    return `<svg class="at-spark" viewBox="0 0 ${w} ${h}" role="img" aria-label="Trend of recent scores"><path d="${d} L${x(list.length - 1)} ${h} L${x(0)} ${h} Z" fill="${col}" opacity=".12"/><path d="${d}" fill="none" stroke="${col}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${x(bi).toFixed(1)}" cy="${y(best).toFixed(1)}" r="4" fill="var(--good)"/><circle cx="${x(list.length - 1).toFixed(1)}" cy="${y(list[list.length - 1]).toFixed(1)}" r="3.5" fill="${col}"/></svg>`;
  }
  function renderBreakdown() {
    if (!S) return;
    const box = $('breakdown'), m = MODES[mode];
    const vw = 300, vh = Math.round(300 * H / W);
    let map = `<rect x="1" y="1" width="${vw - 2}" height="${vh - 2}" rx="12" fill="var(--surface)" stroke="var(--line)"/>`;
    if (mode === 'track') {
      const line = (arr, col, wd, dash) => { let d = '', pen = false; arr.forEach((p) => { if (!p) { pen = false; return; } d += `${pen ? 'L' : 'M'}${(p[0] * vw).toFixed(1)} ${(p[1] * vh).toFixed(1)} `; pen = true; }); return `<path d="${d}" fill="none" stroke="${col}" stroke-width="${wd}" stroke-linejoin="round" stroke-linecap="round" ${dash ? 'stroke-dasharray="3 4"' : ''}/>`; };
      map += line(S.path, MODES.track.color, 5, false) + line(S.ptr, 'var(--accent)', 1.6, true);
    } else {
      S.shots.forEach((s) => {
        const x = (s.x * vw).toFixed(1), y = (s.y * vh).toFixed(1);
        map += s.hit ? `<circle cx="${x}" cy="${y}" r="4" fill="var(--good)" opacity=".8"/>` : `<path d="M${x - 3.5} ${y - 3.5} l7 7 m0 -7 l-7 7" stroke="var(--bad)" stroke-width="2" stroke-linecap="round"/>`;
      });
    }
    const mapNote = mode === 'track' ? 'Green: where the target went. Dashed: your pointer.' : `${S.hits} hits in green, ${S.misses} misses in red.`;
    let second = '', secondTitle = '', note = '';
    if (mode === 'classic' || mode === 'flick') {
      secondTitle = 'Speed by direction';
      const secs = Array.from({ length: 8 }, () => []);
      S.dirs.forEach((d) => { const a = (Math.atan2(d.dy, d.dx) + TAU + Math.PI / 8) % TAU; secs[Math.floor(a / (TAU / 8))].push(d.ms); });
      const av = secs.map((s) => s.length ? avg(s) : 0);
      const valid = av.filter((v) => v), mx = Math.max(...valid, 1), mn = Math.min(...valid, mx);
      const cx = 110, cy = 100, R0 = 80;
      let s = `<circle cx="${cx}" cy="${cy}" r="${R0}" fill="none" stroke="var(--line)"/><circle cx="${cx}" cy="${cy}" r="${R0 / 2}" fill="none" stroke="var(--line)" stroke-dasharray="3 4"/>`;
      const names = ['right', 'down-right', 'down', 'down-left', 'left', 'up-left', 'up', 'up-right'];
      av.forEach((v, i) => {
        const a0 = i * TAU / 8 - Math.PI / 8, a1 = a0 + TAU / 8;
        const rr = v ? 18 + (1 - (v - mn) / Math.max(1, mx - mn)) * (R0 - 18) : 6;
        const col = v === mn && v ? 'var(--good)' : v === mx && v ? '#ff9a3c' : '#6f9be0';
        s += `<path d="M${cx} ${cy} L${(cx + Math.cos(a0) * rr).toFixed(1)} ${(cy + Math.sin(a0) * rr).toFixed(1)} A${rr.toFixed(1)} ${rr.toFixed(1)} 0 0 1 ${(cx + Math.cos(a1) * rr).toFixed(1)} ${(cy + Math.sin(a1) * rr).toFixed(1)}Z" fill="${col}" opacity="${v ? .75 : .15}"/>`;
      });
      [['→', 0], ['↓', Math.PI / 2], ['←', Math.PI], ['↑', -Math.PI / 2]].forEach(([t, a]) => { s += `<text x="${cx + Math.cos(a) * (R0 + 12)}" y="${cy + Math.sin(a) * (R0 + 12) + 4}" text-anchor="middle">${t}</text>`; });
      second = `<svg viewBox="0 0 220 200" role="img" aria-label="Average time per movement direction">${s}</svg>`;
      const fi = av.indexOf(mn), si = av.indexOf(mx);
      note = valid.length > 2 ? `Bigger slice means faster. You are quickest moving ${names[fi]} (${Math.round(mn)}ms) and slowest moving ${names[si]} (${Math.round(mx)}ms).` : 'Not enough moves to compare directions.';
    } else if (mode === 'grid') {
      secondTitle = 'Hits every 3 seconds';
      const b = Array(10).fill(0); S.perSec.forEach((t) => { b[Math.min(9, Math.floor(t / 3000))]++; });
      const mx = Math.max(3, ...b);
      second = `<svg viewBox="0 0 300 150" role="img" aria-label="Hits in each three second slice">${b.map((v, i) => `<rect x="${8 + i * 29}" y="${120 - v / mx * 104}" width="23" height="${Math.max(2, v / mx * 104)}" rx="5" fill="${MODES.grid.color}" opacity="${.5 + .5 * v / mx}"/><text x="${19.5 + i * 29}" y="140" text-anchor="middle">${v}</text>`).join('')}</svg>`;
      const first = b.slice(0, 5).reduce((a, c) => a + c, 0), last = b.slice(5).reduce((a, c) => a + c, 0);
      note = last > first ? 'You sped up in the second half. Nice warm-up.' : last < first ? 'You slowed down a bit in the second half. Stay loose.' : 'Rock steady from start to finish.';
    } else if (mode === 'track') {
      secondTitle = 'On target, second by second';
      const ps = S.perSec.filter(Boolean);
      second = `<svg viewBox="0 0 300 150" role="img" aria-label="Percent of each second spent on target">${ps.map((p, i) => { const v = p.all ? p.on / p.all : 0, w = 290 / ps.length; return `<rect x="${(5 + i * w).toFixed(1)}" y="${(120 - v * 104).toFixed(1)}" width="${Math.max(1, w - 2).toFixed(1)}" height="${Math.max(2, v * 104).toFixed(1)}" rx="2" fill="${v > .7 ? 'var(--good)' : v > .4 ? MODES.track.color : 'var(--bad)'}" opacity=".85"/>`; }).join('')}<text x="5" y="140">0s</text><text x="295" y="140" text-anchor="end">${ps.length}s</text></svg>`;
      note = `Longest lock: ${(S.bestLock / 1000).toFixed(1)} seconds without slipping off.`;
    } else {
      secondTitle = 'Points per shot';
      const cols = (p) => p >= 9 ? '#ffd23f' : p >= 7 ? '#e53935' : p >= 5 ? '#2f8fe0' : p >= 3 ? '#2a2a30' : p ? '#d7d0c3' : 'var(--bad)';
      second = `<svg viewBox="0 0 300 150" role="img" aria-label="Points scored on each shot">${S.points.map((p, i) => `<rect x="${(6 + i * 14.4).toFixed(1)}" y="${120 - Math.max(.3, p) * 10.4}" width="11" height="${Math.max(3, p * 10.4)}" rx="3" fill="${cols(p)}" stroke="rgba(0,0,0,.15)"/>`).join('')}<line x1="4" x2="296" y1="120" y2="120" stroke="var(--line)"/><text x="5" y="140">shot 1</text><text x="295" y="140" text-anchor="end">shot ${S.total}</text></svg>`;
      note = `${S.bulls} golds, average ${(S.score / S.total).toFixed(1)} points a shot.`;
    }
    const hist = (P.hist[bestKey(mode, S.diff)] || []).slice(-20).map((e) => e.s);
    box.innerHTML = `<h3>Session breakdown <span class="c-muted" style="font-size:14px">${m.name} · ${DIFFS[S.diff].name}</span></h3>
      <div class="at-grid2">
        <div class="at-panel"><h4>Shot map</h4><svg viewBox="0 0 ${vw} ${vh}" role="img" aria-label="Where you clicked in the arena">${map}</svg><p class="at-note">${mapNote}</p></div>
        <div class="at-panel"><h4>${secondTitle}</h4>${second}<p class="at-note">${note}</p></div>
      </div>
      <div class="at-panel" style="margin-top:12px"><h4>Your last ${hist.length} ${m.name} runs on ${DIFFS[S.diff].name}</h4>${spark(hist, !!m.lower, 600, 70, m.color)}</div>`;
    box.classList.add('is-on');
  }

  function paintModes() {
    $('modes').innerHTML = ORDER.map((key, i) => {
      const m = MODES[key];
      const pb = Curio.getBest(bestKey(key, diff));
      return `<button class="at-mode" type="button" data-mode="${key}" aria-pressed="${key === mode}" style="--mc:${m.color}" title="${m.name} (key ${i + 1})">${ICONS[key]}<b>${m.name}</b><span>${m.short}</span><em>${pb != null ? 'Best ' + fmtScore(key, pb) : 'Not played'}</em></button>`;
    }).join('');
    $('diffs').innerHTML = Object.entries(DIFFS).map(([key, d]) => `<button type="button" data-d="${key}" aria-pressed="${(daily ? 'normal' : diff) === key}" ${daily ? 'disabled' : ''}>${d.name}</button>`).join('');
    $('daily').setAttribute('aria-pressed', String(daily));
    $('achCount').textContent = `${Object.keys(P.ach).length}/${ACH.length}`;
  }
  function setMode(m) {
    if (state === 'count' || state === 'play' || state === 'paused') stop();
    mode = m; P.mode = m; save(); paintModes(); stop(); sfx('ui');
  }

  const info = $('info');
  function renderInfo(p) {
    info.dataset.p = p;
    if (p === 'stats') {
      const t = P.tot;
      const acc = t.shots ? Math.round(t.hits / t.shots * 100) + '%' : '-';
      const mins = Math.round(t.ms / 60000);
      info.innerHTML = `<h3>📊 Your stats</h3>
        <div class="at-totals"><div><b>${t.sessions}</b><span>Drills done</span></div><div><b>${Curio.fmt(t.hits)}</b><span>Targets hit</span></div><div><b>${acc}</b><span>Accuracy</span></div><div><b>${mins < 1 && t.ms ? '<1' : mins}</b><span>Minutes trained</span></div></div>
        <div class="at-mrows">${ORDER.map((key) => {
          const m = MODES[key];
          const bests = Object.keys(DIFFS).map((d) => { const b = Curio.getBest(bestKey(key, d)); return `${DIFFS[d].name} ${b != null ? fmtScore(key, b) : '-'}`; }).join(' · ');
          const h = (P.hist[bestKey(key, diff)] || []).slice(-20).map((e) => e.s);
          return `<div class="at-mrow"><svg class="at-ic" viewBox="0 0 48 48">${ICONS[key].replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg><div><b>${m.name}</b><small>${bests}</small><small>${P.done[key] || 0} runs · daily today: ${P.daily[today() + ':' + key] != null ? fmtScore(key, P.daily[today() + ':' + key]) : '-'}</small></div>${spark(h, !!m.lower, 300, 44, m.color)}</div>`;
        }).join('')}</div><p class="c-muted" style="font-size:13px;margin:10px 0 0">Trend lines show your last 20 runs on ${DIFFS[diff].name}. The green dot marks your best.</p>`;
    } else if (p === 'badges') {
      info.innerHTML = `<h3>🏆 Badges · ${Object.keys(P.ach).length} of ${ACH.length}</h3><div class="at-achs">${ACH.map((a) => `<div class="at-ach ${P.ach[a.id] ? 'got' : ''}"><i>${a.em}</i><b>${a.name}</b>${a.desc}</div>`).join('')}</div>`;
    } else if (p === 'look') {
      const sw = (group, items, cur) => `<div class="at-swatches" data-group="${group}">${Object.entries(items).map(([key, name]) => `<button class="at-sw" type="button" data-v="${key}" aria-pressed="${key === cur}"><canvas width="68" height="68" data-prev="${group}:${key}"></canvas>${name}</button>`).join('')}</div>`;
      info.innerHTML = `<h3>🎨 Look and feel</h3><div class="at-set">
        <div><h4>Target skin</h4>${sw('skin', SKINS, P.skin)}</div>
        <div><h4>Arena</h4>${sw('theme', THEMES, P.theme)}</div>
        <div><h4>Crosshair</h4>${sw('cross', CROSS, P.cross)}</div>
        <div><h4>Aim assist</h4><div class="at-swatches" data-group="assist"><button class="at-sw" type="button" data-v="off" aria-pressed="${!P.assist}">Off</button><button class="at-sw" type="button" data-v="on" aria-pressed="${P.assist}">On: bigger targets and hit areas</button></div><p class="c-muted" style="font-size:13px;margin:6px 0 0">Great on a laptop touchpad or a small phone. Scores still count.</p></div></div>`;
      info.querySelectorAll('canvas[data-prev]').forEach(paintPrev);
    } else {
      info.innerHTML = `<h3>❓ How to play</h3><div class="at-help">
        <p>Pick a drill, choose a difficulty and press <b>Start</b> (or <span class="c-kbd">Space</span>). A short countdown gives you time to get ready.</p>
        <ul>
          <li><b>Classic</b>: 30 targets, one at a time. Score is your average time per target, so lower is better. Missed clicks lower your accuracy.</li>
          <li><b>Gridshot</b>: three targets sit on a grid for 30 seconds. Each hit is worth 100 points, plus 5% more for every hit in your current combo (up to double). A miss resets the combo.</li>
          <li><b>Flick</b>: 25 targets that fade away. A catch is worth 100 points plus up to 100 more the faster you catch it. The ring around each target shows how long it has left.</li>
          <li><b>Tracking</b>: no clicking. Keep the pointer on the drifting target. On a touch screen, hold your finger on it and follow.</li>
          <li><b>Precision</b>: 20 archery targets, one shot each. Gold scores 10 or 9, red 8 or 7, blue 6 or 5, black 4 or 3, white 2 or 1.</li>
        </ul>
        <p><b>Daily</b> gives everyone the same target positions for the day on Normal. <b>Aim assist</b> in Look makes targets and hit areas bigger: handy on a touchpad.</p>
        <p>Tips: relax your grip, move from the elbow for big moves and the wrist for small ones, and look at the next target before your hand gets there. Short sessions every day beat one long one.</p></div>`;
    }
  }
  function paintPrev(c) {
    const [group, key] = c.dataset.prev.split(':');
    const x = c.getContext('2d'); x.clearRect(0, 0, 68, 68);
    if (group === 'skin') { drawTarget(x, { x: 34, y: 34, seed: .58 }, 24, { skin: key, flat: true }); return; }
    if (group === 'theme') {
      const keep = P.theme; P.theme = key;
      x.save(); paintBg(x, 68, 68, 1); x.restore();
      P.theme = keep;
      return;
    }
    readPal();
    x.fillStyle = pal.surface2; x.fillRect(0, 0, 68, 68);
    if (key === 'system') { x.fillStyle = pal.ink; x.beginPath(); x.moveTo(26, 18); x.lineTo(26, 48); x.lineTo(33, 41); x.lineTo(38, 52); x.lineTo(43, 50); x.lineTo(38, 39); x.lineTo(47, 39); x.closePath(); x.fill(); return; }
    drawCross(x, 34, 34, key);
  }
  info.addEventListener('click', (e) => {
    const b = e.target.closest('.at-sw'); if (!b) return;
    const group = b.parentElement.dataset.group, v = b.dataset.v;
    if (group === 'assist') P.assist = v === 'on';
    else { if (group === 'skin' && v !== 'bull') unlock('skin'); P[group] = v; }
    save(); sfx('ui');
    b.parentElement.querySelectorAll('.at-sw').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    if (group === 'theme') repaintBg();
  });
  function togglePanel(p) {
    const open = info.hidden || info.dataset.p !== p;
    document.querySelectorAll('.at-tabs .at-chip, #settingsBtn').forEach((x) => x.setAttribute('aria-pressed', String(open && (x.dataset.panel || 'look') === p)));
    info.hidden = !open; if (open) { renderInfo(p); if (p === 'look') info.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  }
  document.querySelectorAll('.at-tabs .at-chip').forEach((t) => t.addEventListener('click', () => togglePanel(t.dataset.panel)));
  $('settingsBtn').addEventListener('click', () => togglePanel('look'));

  $('modes').addEventListener('click', (e) => { const b = e.target.closest('.at-mode'); if (b) setMode(b.dataset.mode); });
  $('diffs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b || daily) return; diff = b.dataset.d; P.diff = diff; save(); paintModes(); stop(); sfx('ui'); });
  $('daily').addEventListener('click', () => { daily = !daily; paintModes(); stop(); Curio.toast(daily ? '📅 Daily challenge: same targets for everyone today' : 'Free play'); });
  $('go').addEventListener('click', begin);
  $('again').addEventListener('click', () => { state = 'menu'; begin(); });
  $('menu').addEventListener('click', stop);
  $('resume').addEventListener('click', resume);
  $('quit').addEventListener('click', stop);
  $('share').addEventListener('click', async () => {
    if (!lastRes) return;
    const m = MODES[lastRes.mode];
    const txt = `🎯 Aim Trainer, ${m.name} (${DIFFS[lastRes.d].name}${lastRes.daily ? ', daily ' + today() : ''}): ${fmtScore(lastRes.mode, lastRes.score)}${lastRes.mode !== 'track' ? ', ' + lastRes.acc + '% accuracy' : ''}. ${MEDALS[lastRes.tier].name} medal. Curio`;
    try { await navigator.clipboard.writeText(txt); Curio.toast('Copied to clipboard'); } catch { Curio.toast(txt, 4000); }
  });

  const local = (e) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  cv.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    const p = local(e);
    aim.x = p.x; aim.y = p.y; aim.type = e.pointerType; aim.touch = e.pointerType === 'touch'; aim.down = true; aim.on = true;
    if (state !== 'play' || !S) return;
    e.preventDefault();
    if (mode !== 'track') shoot(p.x, p.y);
  });
  cv.addEventListener('pointermove', (e) => { const p = local(e); aim.x = p.x; aim.y = p.y; aim.on = true; aim.touch = e.pointerType === 'touch'; });
  cv.addEventListener('pointerleave', () => { aim.on = false; });
  window.addEventListener('pointerup', () => { aim.down = false; if (aim.touch) aim.on = false; });
  window.addEventListener('pointercancel', () => { aim.down = false; });

  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || document.querySelector('.curio-modal')) return;
    const inBtn = e.target.closest && e.target.closest('button, input, textarea, select');
    if (/^[1-5]$/.test(e.key) && state !== 'play' && state !== 'count') { setMode(ORDER[Number(e.key) - 1]); return; }
    if ((e.code === 'Space' || e.key === 'Enter') && !inBtn) {
      if (state === 'menu' || state === 'end') { e.preventDefault(); begin(); }
      else if (state === 'paused') { e.preventDefault(); resume(); }
      else if (state === 'play') e.preventDefault();
      return;
    }
    if ((e.key === 'r' || e.key === 'R') && !inBtn) { stop(); begin(); return; }
    if (e.key === 'Escape' && (state === 'play' || state === 'count' || state === 'paused' || state === 'end')) stop();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('blur', () => { if (state === 'play' && mode === 'track') pause(); });
  window.addEventListener('resize', resize);
  window.addEventListener('curio:theme', () => { setTimeout(() => { repaintBg(); if (!info.hidden && info.dataset.p === 'look') info.querySelectorAll('canvas[data-prev]').forEach(paintPrev); }, 30); });
  if (window.ResizeObserver) new ResizeObserver(() => resize()).observe(arena);

  resize(); paintModes(); paintStart(); show('startScreen');
  requestAnimationFrame(loop);
  window.__aim = {
    get state() { return state; }, get mode() { return mode; }, get session() { return S; },
    setMode, begin, finish: () => finish(), shootAt: (x, y) => shoot(x, y),
    target: () => S && S.targets[0] ? { x: S.targets[0].x, y: S.targets[0].y, r: S.targets[0].r } : null,
    targets: () => S ? S.targets.map((t) => ({ x: t.x, y: t.y, r: t.r })) : []
  };
})();
