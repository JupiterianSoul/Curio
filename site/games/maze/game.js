(() => {
  const M = window.MazeEngine;
  const $ = (id) => document.getElementById(id);
  const TAU = Math.PI * 2;
  const KEY = 'maze:v2', VER = 2;

  const THEMES = {
    garden: { name: 'Hedge Garden', icon: '🌷', bg: '#7cb75a', floor: '#b5dd7f', floor2: '#a5d06c', wall: '#2f7d32', wallTop: '#6fc35a', shadow: 'rgba(20,60,10,.35)', trail: 'rgba(255,255,255,.6)', player: '#ff7043', gem: 'flower', gemCols: ['#ff6fa8', '#ffd23f', '#fff'], portal: '#ffd23f', fog: 'rgb(10,30,10)', card: 'linear-gradient(120deg,#3f9b46,#7cc56a)' },
    ice: { name: 'Frost Caves', icon: '❄️', bg: '#9fd0f0', floor: '#eef8ff', floor2: '#dcefff', wall: '#3d8fd6', wallTop: '#bfe8ff', shadow: 'rgba(30,80,140,.3)', trail: 'rgba(80,160,230,.45)', player: '#ff5a8a', gem: 'crystal', gemCols: ['#7df9ff', '#b388ff', '#fff'], portal: '#7df9ff', fog: 'rgb(10,30,60)', card: 'linear-gradient(120deg,#3d8fd6,#86d0ff)' },
    candy: { name: 'Candy Spiral', icon: '🍭', bg: '#ffb3d1', floor: '#fff0f6', floor2: '#ffe0ee', wall: '#7b4a2e', wallTop: '#ff8fb8', shadow: 'rgba(90,30,40,.3)', trail: 'rgba(255,111,168,.45)', player: '#6c5ce7', gem: 'candy', gemCols: ['#ff5f9e', '#58d6c9', '#ffd23f'], portal: '#ff5f9e', fog: 'rgb(40,10,30)', card: 'linear-gradient(120deg,#e85a9a,#ffa3c8)' },
    dungeon: { name: 'Torchlit Dungeon', icon: '🕯️', bg: '#1d1917', floor: '#4a413b', floor2: '#433a35', wall: '#8b847c', wallTop: '#beb6ad', shadow: 'rgba(0,0,0,.55)', trail: 'rgba(255,190,80,.35)', player: '#ffd54f', gem: 'coin', gemCols: ['#ffd23f', '#ffb300', '#fff3b0'], portal: '#ff8a3d', fog: 'rgb(6,4,3)', card: 'linear-gradient(120deg,#3a322d,#6b5f55)' },
    space: { name: 'Star Station', icon: '🚀', bg: '#05041a', floor: '#110e30', floor2: '#0d0b26', wall: '#5ef0ff', wallTop: '#ffffff', shadow: 'rgba(94,240,255,.25)', trail: 'rgba(255,159,67,.5)', player: '#ff9f43', gem: 'star', gemCols: ['#ffe066', '#ff9f43', '#fff'], portal: '#c084fc', fog: 'rgb(2,1,10)', card: 'linear-gradient(120deg,#1b1650,#5b3fb0)', glow: true }
  };
  const WORLDS = [
    { theme: 'garden', blurb: 'Sunny hedges, flowers to pick.', levels: [['square', 'S', 2], ['square', 'S', 3], ['square', 'M', 3], ['hex', 'S', 3], ['square', 'M', 4, 0, 2], ['hex', 'M', 4]] },
    { theme: 'ice', blurb: 'Six-sided ice caverns.', levels: [['hex', 'S', 3], ['hex', 'M', 3], ['square', 'M', 4, 0, 2], ['circle', 'S', 3], ['hex', 'L', 4], ['circle', 'M', 5]] },
    { theme: 'candy', blurb: 'Round and round to the middle.', levels: [['circle', 'S', 3], ['circle', 'M', 4], ['square', 'L', 4, 0, 3], ['hex', 'L', 5], ['circle', 'L', 5], ['square', 'L', 6, 0, 4]] },
    { theme: 'dungeon', blurb: 'You only see what your torch lights.', levels: [['square', 'S', 3, 1], ['square', 'M', 4, 1], ['hex', 'M', 4, 1], ['circle', 'M', 5, 1], ['square', 'L', 5, 1, 3], ['hex', 'L', 6, 1]] },
    { theme: 'space', blurb: 'The big ones. Bring snacks.', levels: [['circle', 'L', 5], ['hex', 'L', 5, 0, 3], ['square', 'XL', 6, 0, 5], ['circle', 'XL', 6, 1], ['hex', 'XL', 7, 1, 4], ['square', 'XL', 8, 1, 6]] }
  ];
  const LEVELS = WORLDS.flatMap((w, wi) => w.levels.map(([shape, size, gems, fog, loops], li) => ({ theme: w.theme, shape, size, gems, fog: !!fog, loops: loops || 0, seed: 7000 + (wi * 6 + li) * 7919, world: wi, n: wi * 6 + li })));
  const ACH = [
    { id: 'first', icon: '🚩', name: 'Way out', desc: 'Finish any maze.' },
    { id: 'gems', icon: '💎', name: 'Pocketful', desc: 'Collect every gem in a maze.' },
    { id: 'three', icon: '⭐', name: 'Three stars', desc: 'Earn three stars on a level.' },
    { id: 'hex', icon: '⬢', name: 'Six ways', desc: 'Finish a hexagon maze.' },
    { id: 'circle', icon: '🌀', name: 'Bullseye', desc: 'Reach the centre of a round maze.' },
    { id: 'fog', icon: '🕯️', name: 'Torchbearer', desc: 'Finish a maze in fog of war.' },
    { id: 'world', icon: '🗺️', name: 'World tour', desc: 'Finish all six levels of a world.' },
    { id: 'all', icon: '👑', name: 'Maze master', desc: 'Finish all thirty adventure levels.' },
    { id: 'stars', icon: '🌟', name: 'Perfectionist', desc: 'Collect all ninety adventure stars.' },
    { id: 'daily', icon: '📅', name: 'Daily runner', desc: 'Finish a daily maze.' },
    { id: 'streak3', icon: '🔥', name: 'Three days running', desc: 'Finish the daily maze three days in a row.' },
    { id: 'speed', icon: '⚡', name: 'Speedrunner', desc: 'Finish a medium or bigger maze in under 15 seconds.' },
    { id: 'xl', icon: '🐘', name: 'Extra large', desc: 'Finish an XL maze.' },
    { id: 'hoard', icon: '💰', name: 'Hoarder', desc: 'Collect 100 gems in total.' },
    { id: 'nohint', icon: '🧠', name: 'Own compass', desc: 'Finish 10 mazes without showing the path.' }
  ];

  function load() {
    const base = { v: VER, done: {}, best: {}, daily: {}, free: { shape: 'square', size: 'M', theme: 'garden', fog: false, gems: true }, ach: {}, gemsTotal: 0, finishes: 0, noHint: 0 };
    const d = Curio.store.get(KEY, null);
    if (!d || typeof d !== 'object' || d.v !== VER) return base;
    const s = Object.assign(base, d);
    for (const k of ['done', 'best', 'daily', 'ach']) if (!s[k] || typeof s[k] !== 'object') s[k] = {};
    s.free = Object.assign({}, base.free, d.free || {});
    if (!THEMES[s.free.theme]) s.free.theme = 'garden';
    if (!['square', 'hex', 'circle'].includes(s.free.shape)) s.free.shape = 'square';
    if (!['S', 'M', 'L', 'XL'].includes(s.free.size)) s.free.size = 'M';
    return s;
  }
  const S = load();
  const SIMPLE = Curio.simple;
  if (typeof S.walk !== 'number') S.walk = 0;
  const save = () => Curio.store.set(KEY, S);

  const SFX = {
    ac() { return Curio.muted ? null : Curio.audioContext(); },
    tone(f, d = 0.1, type = 'sine', vol = 0.08, when = 0, f2 = 0) {
      const ac = this.ac(); if (!ac) return;
      const t = ac.currentTime + when, o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d + 0.03);
    },
    step(k) { const base = { garden: 340, ice: 620, candy: 520, dungeon: 200, space: 440 }[G?.theme || 'garden']; this.tone(base + (k % 4) * 30, 0.04, G?.theme === 'space' ? 'square' : 'triangle', 0.035); },
    bump() { this.tone(90, 0.08, 'sine', 0.08, 0, 60); },
    gem(k) { [0, 4, 7, 12].forEach((s, i) => this.tone(880 * 2 ** ((s + k) / 12), 0.12, 'triangle', 0.06, i * 0.05)); },
    win() { [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.08, i * 0.09)); this.tone(1568, 0.6, 'sine', 0.05, 0.5); },
    star(i) { this.tone(1046 + i * 262, 0.2, 'sine', 0.07); },
    hint() { this.tone(300, 0.3, 'sawtooth', 0.04, 0, 600); },
    ding() { [880, 1320, 1760].forEach((f, i) => this.tone(f, 0.25, 'sine', 0.06, i * 0.08)); }
  };
  const buzz = (p) => { try { if (navigator.vibrate) navigator.vibrate(p); } catch {} };

  let badgeQ = [], badgeOn = false;
  function unlock(id) {
    if (S.ach[id]) return;
    const a = ACH.find((x) => x.id === id); if (!a) return;
    S.ach[id] = Date.now(); save(); badgeQ.push(a); if (!badgeOn) nextBadge();
  }
  function nextBadge() {
    const a = badgeQ.shift(), el = $('badge');
    if (!a) { badgeOn = false; return; }
    badgeOn = true;
    el.innerHTML = `<span class="bi">${a.icon}</span><span><small>Trophy unlocked</small><b></b></span>`;
    el.querySelector('b').textContent = a.name;
    el.classList.add('on'); SFX.ding(); buzz([20, 40, 20]);
    setTimeout(() => { el.classList.remove('on'); setTimeout(nextBadge, 450); }, 2600);
  }

  function Renderer(cv) {
    const g = cv.getContext('2d');
    const R = { m: null, th: null, sc: 1, ox: 0, oy: 0, w: 0, h: 0, dpr: 1, stat: document.createElement('canvas'), fogBase: document.createElement('canvas'), fogFrame: document.createElement('canvas') };
    R.px = (x, y) => [R.ox + x * R.sc, R.oy + y * R.sc];
    R.set = function (m, theme, cssW, cssH, fog) {
      R.m = m; R.th = THEMES[theme]; R.fog = fog;
      R.dpr = Math.min(2, devicePixelRatio || 1);
      R.w = cssW; R.h = cssH;
      cv.width = Math.round(cssW * R.dpr); cv.height = Math.round(cssH * R.dpr);
      cv.style.width = `${cssW}px`; cv.style.height = `${cssH}px`;
      const pad = Math.max(10, Math.min(cssW, cssH) * 0.04);
      R.sc = Math.min((cssW - pad * 2) / m.w, (cssH - pad * 2) / m.h);
      R.ox = (cssW - m.w * R.sc) / 2; R.oy = (cssH - m.h * R.sc) / 2;
      R.lw = Math.max(2, R.sc * m.unit * (m.kind === 'circle' ? 0.22 : 0.2));
      for (const c of [R.stat, R.fogBase, R.fogFrame]) { c.width = cv.width; c.height = cv.height; }
      buildStatic();
      if (fog) { const f = R.fogBase.getContext('2d'); f.setTransform(1, 0, 0, 1, 0, 0); f.clearRect(0, 0, cv.width, cv.height); f.fillStyle = R.th.fog; f.fillRect(0, 0, cv.width, cv.height); }
    };
    function wallPath() {
      const m = R.m, p = new Path2D();
      m.cells.forEach((c, i) => {
        for (const e of c.edges) {
          if (!e.own || (e.nb >= 0 && m.open[i].has(e.nb))) continue;
          const gm = e.g;
          if (gm[0] === 'l') { const [x1, y1] = R.px(gm[1] + (m.kind === 'circle' ? m.cx : 0), gm[2] + (m.kind === 'circle' ? m.cy : 0)); const [x2, y2] = R.px(gm[3] + (m.kind === 'circle' ? m.cx : 0), gm[4] + (m.kind === 'circle' ? m.cy : 0)); p.moveTo(x1, y1); p.lineTo(x2, y2); }
          else { const [cx, cy] = R.px(m.cx, m.cy), rad = gm[1] * R.sc; p.moveTo(cx + Math.cos(gm[2]) * rad, cy + Math.sin(gm[2]) * rad); p.arc(cx, cy, rad, gm[2], gm[3]); }
        }
      });
      return p;
    }
    function floorPath() {
      const m = R.m, p = new Path2D();
      if (m.kind === 'circle') { const [cx, cy] = R.px(m.cx, m.cy); p.arc(cx, cy, m.rings * R.sc + R.lw * 0.6, 0, TAU); }
      else if (m.kind === 'hex') { for (const c of m.cells) { const [x, y] = R.px(c.x, c.y); for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + k * Math.PI / 3, r = R.sc * 1.04; k ? p.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r) : p.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } p.closePath(); } }
      else { const [x, y] = R.px(0, 0); p.rect(x - R.lw / 2, y - R.lw / 2, m.w * R.sc + R.lw, m.h * R.sc + R.lw); }
      return p;
    }
    function buildStatic() {
      const s = R.stat.getContext('2d'), th = R.th, m = R.m;
      s.setTransform(R.dpr, 0, 0, R.dpr, 0, 0);
      const bg = s.createLinearGradient(0, 0, R.w, R.h); bg.addColorStop(0, th.bg); bg.addColorStop(1, shade(th.bg, -18));
      s.fillStyle = bg; s.fillRect(0, 0, R.w, R.h);
      const r = M.rng(m.seed + 99);
      if (R.th === THEMES.space) for (let i = 0; i < 90; i++) { s.globalAlpha = r(); s.fillStyle = '#fff'; s.fillRect(r() * R.w, r() * R.h, 1.5, 1.5); }
      s.globalAlpha = 1;
      const fp = floorPath();
      s.save(); s.shadowColor = 'rgba(0,0,0,.25)'; s.shadowBlur = 18; s.shadowOffsetY = 6; s.fillStyle = th.floor; s.fill(fp); s.restore();
      s.save(); s.clip(fp);
      if (m.kind === 'square') { for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if ((x + y) % 2) { const [px, py] = R.px(x, y); s.fillStyle = th.floor2; s.fillRect(px, py, R.sc, R.sc); } }
      else if (m.kind === 'circle') { const [cx, cy] = R.px(m.cx, m.cy); for (let i = m.rings; i > 0; i--) { s.fillStyle = i % 2 ? th.floor2 : th.floor; s.beginPath(); s.arc(cx, cy, i * R.sc, 0, TAU); s.fill(); } }
      else m.cells.forEach((c, i) => { if ((i + Math.floor(c.y)) % 3 === 0) { const [x, y] = R.px(c.x, c.y); s.fillStyle = th.floor2; s.beginPath(); for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + k * Math.PI / 3; s.lineTo(x + Math.cos(a) * R.sc, y + Math.sin(a) * R.sc); } s.fill(); } });
      const dec = Math.round(m.cells.length * 1.3);
      for (let i = 0; i < dec; i++) {
        const x = r() * R.w, y = r() * R.h, z = R.sc * 0.08 + 1;
        if (th === THEMES.garden) { s.strokeStyle = 'rgba(60,120,30,.45)'; s.lineWidth = 1.2; s.beginPath(); s.moveTo(x - z, y); s.lineTo(x, y - z * 2); s.lineTo(x + z, y); s.stroke(); if (r() < 0.15) { s.fillStyle = ['#fff', '#ffe066', '#ff9ec6'][i % 3]; s.beginPath(); s.arc(x, y - z, z * 0.8, 0, TAU); s.fill(); } }
        else if (th === THEMES.dungeon) { s.strokeStyle = 'rgba(0,0,0,.25)'; s.lineWidth = 1; s.beginPath(); s.moveTo(x, y); s.lineTo(x + z * 3 * (r() - 0.5) * 2, y + z * 3 * (r() - 0.5) * 2); s.stroke(); }
        else if (th === THEMES.ice) { s.strokeStyle = 'rgba(120,190,255,.6)'; s.lineWidth = 1; s.beginPath(); s.moveTo(x - z, y); s.lineTo(x + z, y); s.moveTo(x, y - z); s.lineTo(x, y + z); s.stroke(); }
        else if (th === THEMES.space) { s.fillStyle = `rgba(255,255,255,${0.2 + r() * 0.5})`; s.fillRect(x, y, 1.4, 1.4); }
        else { s.strokeStyle = ['#ff5f9e', '#58d6c9', '#ffd23f', '#9b7bff'][i % 4]; s.lineWidth = 2; s.lineCap = 'round'; const a = r() * TAU; s.beginPath(); s.moveTo(x, y); s.lineTo(x + Math.cos(a) * z * 2, y + Math.sin(a) * z * 2); s.stroke(); }
      }
      const [sx, sy] = R.px(m.cells[m.start].x, m.cells[m.start].y);
      s.fillStyle = 'rgba(255,255,255,.35)'; s.beginPath(); s.arc(sx, sy, R.sc * m.unit * 0.38, 0, TAU); s.fill();
      s.restore();
      const wp = wallPath();
      s.lineCap = 'round'; s.lineJoin = 'round';
      s.save(); s.translate(R.lw * 0.22, R.lw * 0.42); s.strokeStyle = th.shadow; s.lineWidth = R.lw * 1.05; s.stroke(wp); s.restore();
      if (th.glow) { s.save(); s.shadowColor = th.wall; s.shadowBlur = R.lw * 2.2; s.strokeStyle = th.wall; s.lineWidth = R.lw * 0.75; s.stroke(wp); s.restore(); }
      else { s.strokeStyle = th.wall; s.lineWidth = R.lw; s.stroke(wp); }
      s.save(); s.translate(-R.lw * 0.1, -R.lw * 0.16); s.strokeStyle = th.wallTop; s.globalAlpha = th.glow ? 0.9 : 0.7; s.lineWidth = R.lw * (th.glow ? 0.25 : 0.38); s.stroke(wp); s.restore();
      if (th === THEMES.garden) { s.save(); s.strokeStyle = 'rgba(20,70,20,.35)'; s.setLineDash([1, R.lw * 0.6]); s.lineWidth = R.lw * 0.5; s.stroke(wp); s.restore(); }
    }
    R.reveal = function (cells) {
      const f = R.fogBase.getContext('2d');
      f.setTransform(R.dpr, 0, 0, R.dpr, 0, 0);
      f.globalCompositeOperation = 'destination-out';
      for (const i of cells) { const c = R.m.cells[i], [x, y] = R.px(c.x, c.y), rad = R.sc * R.m.unit * 0.95; const gr = f.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, 'rgba(0,0,0,.62)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); f.fillStyle = gr; f.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
      f.globalCompositeOperation = 'source-over';
    };
    R.draw = function (st, t) {
      const m = R.m, th = R.th;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.drawImage(R.stat, 0, 0);
      g.setTransform(R.dpr, 0, 0, R.dpr, 0, 0);
      g.lineCap = 'round'; g.lineJoin = 'round';
      if (st.trail && st.trail.length > 1) {
        g.strokeStyle = th.trail; g.lineWidth = Math.max(2, R.sc * m.unit * 0.16); g.beginPath();
        st.trail.forEach((i, k) => { const c = m.cells[i], [x, y] = R.px(c.x, c.y); k ? g.lineTo(x, y) : g.moveTo(x, y); });
        const [ax, ay] = R.px(st.pos.x, st.pos.y); g.lineTo(ax, ay); g.stroke();
      }
      if (st.hint && st.hint.length) {
        g.save(); g.strokeStyle = '#fff'; g.shadowColor = '#00e5ff'; g.shadowBlur = 10; g.lineWidth = Math.max(2, R.sc * m.unit * 0.12); g.setLineDash([R.sc * 0.25, R.sc * 0.22]); g.lineDashOffset = -t * 0.03; g.globalAlpha = st.hintAlpha;
        g.beginPath(); st.hint.forEach((i, k) => { const c = m.cells[i], [x, y] = R.px(c.x, c.y); k ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); g.restore();
      }
      const ex = m.cells[m.exit], [exx, exy] = R.px(ex.x, ex.y), er = R.sc * m.unit * 0.36;
      g.save(); g.translate(exx, exy);
      const pg = g.createRadialGradient(0, 0, 0, 0, 0, er * 1.6); pg.addColorStop(0, '#fff'); pg.addColorStop(0.4, th.portal); pg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = pg; g.globalAlpha = 0.6 + Math.sin(t / 300) * 0.2; g.beginPath(); g.arc(0, 0, er * 1.6, 0, TAU); g.fill(); g.globalAlpha = 1;
      g.rotate(t / 600); g.strokeStyle = th.portal; g.lineWidth = Math.max(1.5, er * 0.22);
      for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(0, 0, er * (0.45 + k * 0.25), k * 2, k * 2 + 3.6); g.stroke(); }
      g.restore();
      st.gems.forEach((i, k) => { const c = m.cells[i], [x, y] = R.px(c.x, c.y + Math.sin(t / 260 + k) * 0.06); drawGem(th.gem, x, y, R.sc * m.unit * 0.28, t, th); });
      const [px, py] = R.px(st.pos.x, st.pos.y), pr = R.sc * m.unit * 0.3;
      g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(px, py + pr * 0.85, pr * 0.85, pr * 0.3, 0, 0, TAU); g.fill();
      const sq = 1 + st.squash * 0.18;
      g.save(); g.translate(px, py); g.scale(sq, 2 - sq);
      const bg = g.createRadialGradient(-pr * 0.35, -pr * 0.4, pr * 0.1, 0, 0, pr); bg.addColorStop(0, shade(th.player, 40)); bg.addColorStop(1, th.player);
      g.fillStyle = bg; g.beginPath(); g.arc(0, 0, pr, 0, TAU); g.fill();
      g.strokeStyle = shade(th.player, -40); g.lineWidth = Math.max(1, pr * 0.12); g.stroke();
      const lx = Math.cos(st.face) * pr * 0.18, ly = Math.sin(st.face) * pr * 0.18, blink = (t % 3200) < 120 ? 0.15 : 1;
      for (const s of [-1, 1]) { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(s * pr * 0.34 + lx, -pr * 0.12 + ly, pr * 0.25, pr * 0.3 * blink, 0, 0, TAU); g.fill(); g.fillStyle = '#1a1a2e'; g.beginPath(); g.arc(s * pr * 0.34 + lx * 1.8, -pr * 0.1 + ly * 1.8, pr * 0.12 * blink + 0.2, 0, TAU); g.fill(); }
      g.restore();
      for (const p of st.parts) { g.globalAlpha = Math.max(0, p.life); g.fillStyle = p.c; g.beginPath(); g.arc(p.x, p.y, p.s * p.life + 0.5, 0, TAU); g.fill(); }
      g.globalAlpha = 1;
      if (R.fog) {
        const f = R.fogFrame.getContext('2d');
        f.setTransform(1, 0, 0, 1, 0, 0); f.clearRect(0, 0, R.fogFrame.width, R.fogFrame.height); f.drawImage(R.fogBase, 0, 0);
        f.setTransform(R.dpr, 0, 0, R.dpr, 0, 0); f.globalCompositeOperation = 'destination-out';
        const L = R.sc * m.unit * (2.6 + Math.sin(t / 180) * 0.06), lg = f.createRadialGradient(px, py, L * 0.25, px, py, L);
        lg.addColorStop(0, 'rgba(0,0,0,1)'); lg.addColorStop(0.6, 'rgba(0,0,0,.85)'); lg.addColorStop(1, 'rgba(0,0,0,0)');
        f.fillStyle = lg; f.fillRect(px - L, py - L, L * 2, L * 2); f.globalCompositeOperation = 'source-over';
        g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(R.fogFrame, 0, 0); g.setTransform(R.dpr, 0, 0, R.dpr, 0, 0);
        const tg = g.createRadialGradient(px, py, 0, px, py, L); tg.addColorStop(0, 'rgba(255,170,60,.18)'); tg.addColorStop(1, 'rgba(255,170,60,0)'); g.fillStyle = tg; g.fillRect(px - L, py - L, L * 2, L * 2);
      }
    };
    function drawGem(kind, x, y, s, t, th) {
      g.save(); g.translate(x, y);
      if (kind === 'flower') { g.rotate(t / 1500); for (let k = 0; k < 5; k++) { const a = k * TAU / 5; g.fillStyle = th.gemCols[0]; g.beginPath(); g.arc(Math.cos(a) * s * 0.55, Math.sin(a) * s * 0.55, s * 0.45, 0, TAU); g.fill(); } g.fillStyle = th.gemCols[1]; g.beginPath(); g.arc(0, 0, s * 0.4, 0, TAU); g.fill(); }
      else if (kind === 'coin') { g.scale(Math.max(0.15, Math.abs(Math.cos(t / 400))), 1); g.fillStyle = '#b8860b'; g.beginPath(); g.arc(0, s * 0.08, s, 0, TAU); g.fill(); g.fillStyle = th.gemCols[0]; g.beginPath(); g.arc(0, 0, s, 0, TAU); g.fill(); g.strokeStyle = th.gemCols[1]; g.lineWidth = s * 0.18; g.beginPath(); g.arc(0, 0, s * 0.62, 0, TAU); g.stroke(); }
      else if (kind === 'crystal') { g.fillStyle = th.gemCols[0]; g.beginPath(); g.moveTo(0, -s * 1.2); g.lineTo(s * 0.8, -s * 0.2); g.lineTo(0, s * 1.1); g.lineTo(-s * 0.8, -s * 0.2); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.moveTo(0, -s * 1.2); g.lineTo(s * 0.3, -s * 0.2); g.lineTo(0, s * 0.2); g.lineTo(-s * 0.3, -s * 0.2); g.closePath(); g.fill(); }
      else if (kind === 'star') { g.rotate(t / 700); g.fillStyle = th.gemCols[0]; g.shadowColor = th.gemCols[0]; g.shadowBlur = s; g.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? s * 0.45 : s * 1.1; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); }
      else { g.rotate(Math.sin(t / 400) * 0.3); g.fillStyle = th.gemCols[1]; g.beginPath(); g.moveTo(-s * 0.6, 0); g.lineTo(-s * 1.3, -s * 0.55); g.lineTo(-s * 1.3, s * 0.55); g.closePath(); g.moveTo(s * 0.6, 0); g.lineTo(s * 1.3, -s * 0.55); g.lineTo(s * 1.3, s * 0.55); g.closePath(); g.fill(); g.fillStyle = th.gemCols[0]; g.beginPath(); g.arc(0, 0, s * 0.7, 0, TAU); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = s * 0.15; g.beginPath(); g.arc(0, 0, s * 0.4, 0.5, 2.5); g.stroke(); }
      g.restore();
    }
    return R;
  }
  function shade(hex, amt) { const n = parseInt(hex.slice(1), 16); const f = (v) => Math.max(0, Math.min(255, v + amt)); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; }

  const hero = Renderer($('heroCv'));
  const heroM = M.generate({ shape: 'square', size: 'S', seed: 314, gems: 2 });
  const heroPath = M.path(heroM, heroM.start, heroM.exit);
  let heroT0 = performance.now();
  function heroSetup() { hero.set(heroM, 'garden', 150, 150, false); }

  const dayKey = (d = new Date()) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  const dayNum = () => { const d = new Date(); return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000); };
  function dailySpec() { const n = dayNum(), th = Object.keys(THEMES); return { theme: th[n % 5], shape: ['square', 'hex', 'circle'][n % 3], size: 'L', gems: 4, fog: n % 4 === 0, loops: 2, seed: n * 2654435761 >>> 0, daily: dayKey() }; }
  function streak() { let k = 0; const d = new Date(); if (S.daily[dayKey(d)] == null) d.setDate(d.getDate() - 1); while (S.daily[dayKey(d)] != null) { k++; d.setDate(d.getDate() - 1); } return k; }
  const stars = (n) => '★'.repeat(n) + `<i>${'★'.repeat(3 - n)}</i>`;
  const unlocked = (i) => i === 0 || S.done[i - 1] != null;

  function paintHome() {
    const ds = dailySpec(), dt = S.daily[ds.daily];
    $('daily').innerHTML = `<h3>${THEMES[ds.theme].icon} Daily maze</h3><p>${THEMES[ds.theme].name} · ${{ square: 'square', hex: 'hexagon', circle: 'round' }[ds.shape]} · large${ds.fog ? ' · fog' : ''}<br>${dt != null ? `Best today: ${dt.toFixed(1)}s` : 'Same maze for everyone today.'}</p><button class="c-btn" type="button" id="dailyBtn">${dt != null ? 'Run it again' : 'Run today\'s maze'}</button>${streak() ? `<span class="tag">🔥 ${streak()}</span>` : ''}`;
    $('dailyBtn').onclick = () => start({ ...ds, label: 'Daily maze' });
    const f = S.free;
    $('fShape').innerHTML = [['square', '▢ Square'], ['hex', '⬡ Hex'], ['circle', '◎ Round']].map(([k, l]) => `<button type="button" role="radio" aria-checked="${f.shape === k}" data-v="${k}">${l}</button>`).join('');
    $('fSize').innerHTML = ['S', 'M', 'L', 'XL'].map((k) => `<button type="button" role="radio" aria-checked="${f.size === k}" data-v="${k}">${k}</button>`).join('');
    $('fTheme').innerHTML = Object.entries(THEMES).map(([k, t]) => `<button type="button" role="radio" aria-checked="${f.theme === k}" data-v="${k}" title="${t.name}" aria-label="${t.name}" style="background:${t.card}">${t.icon}</button>`).join('');
    $('fFog').checked = f.fog; $('fGems').checked = f.gems;
    const next = LEVELS.findIndex((l, i) => S.done[i] == null);
    $('worlds').innerHTML = WORLDS.map((w, wi) => {
      const th = THEMES[w.theme], ls = LEVELS.filter((l) => l.world === wi);
      const got = ls.reduce((a, l) => a + (S.done[l.n] || 0), 0);
      return `<div class="mz-world" style="background:${th.card}"><div><span class="wi">${th.icon}</span><h3>${th.name}</h3><p>${w.blurb}<br>${got}/18 stars</p></div><div class="mz-path">${ls.map((l) => {
        const lock = !unlocked(l.n), st = S.done[l.n];
        return `<button type="button" class="mz-node ${st != null ? 'done' : ''} ${l.n === next ? 'next' : ''} ${lock ? 'locked' : ''}" data-lvl="${l.n}" ${lock ? 'aria-disabled="true"' : ''} aria-label="Level ${l.n + 1}${lock ? ', locked' : st != null ? `, ${st} stars` : ''}"><b>${lock ? '🔒' : l.n + 1}</b><small>${st != null ? stars(st) : ''}</small><em>${{ square: '▢', hex: '⬡', circle: '◎' }[l.shape]}${l.fog ? ' 🌫' : ''}</em></button>`;
      }).join('')}</div></div>`;
    }).join('');
    $('trophyN').textContent = `${Object.keys(S.ach).length}/${ACH.length}`;
    heroSetup();
  }
  const segPick = (id, key) => $(id).addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (!b) return; S.free[key] = b.dataset.v; save(); SFX.tone(700, 0.04); paintHome(); $(id).querySelector(`[data-v="${S.free[key]}"]`)?.focus(); });
  segPick('fShape', 'shape'); segPick('fSize', 'size'); segPick('fTheme', 'theme');
  $('fFog').addEventListener('change', () => { S.free.fog = $('fFog').checked; save(); });
  $('fGems').addEventListener('change', () => { S.free.gems = $('fGems').checked; save(); });
  $('freeBtn').addEventListener('click', () => { const f = S.free; start({ theme: f.theme, shape: f.shape, size: f.size, gems: f.gems ? { S: 3, M: 4, L: 5, XL: 7 }[f.size] : 0, fog: f.fog, loops: { S: 0, M: 1, L: 3, XL: 5 }[f.size], seed: (Math.random() * 2 ** 31) >>> 0, label: 'Free play' }); });
  $('worlds').addEventListener('click', (e) => { const b = e.target.closest('[data-lvl]'); if (!b) return; const i = +b.dataset.lvl; if (!unlocked(i)) { Curio.toast('Finish the level before it to unlock this one'); SFX.bump(); return; } startLevel(i); });

  const cv = $('cv'), R = Renderer(cv);
  let G = null, raf = 0, lastT = 0;
  function walkSpec() {
    const k = S.walk, th = ['garden', 'ice', 'candy', 'space', 'dungeon'][Math.floor(k / 3) % 5];
    return { theme: th, shape: 'square', size: k < 2 ? 'S' : k < 6 ? 'M' : 'L', gems: k < 2 ? 0 : 1, fog: false, loops: 1, seed: (Math.random() * 2 ** 31) >>> 0, label: `Walk ${k + 1} · ${THEMES[th].name}`, walk: true };
  }
  function startLevel(i) { const l = LEVELS[i]; start({ ...l, label: `Level ${i + 1} · ${THEMES[l.theme].name}`, level: i }); }
  function start(spec) {
    const m = M.generate({ shape: spec.shape, size: spec.size, seed: spec.seed, gems: spec.gems, loops: spec.loops });
    G = { spec, m, theme: spec.theme, cell: m.start, pos: { x: m.cells[m.start].x, y: m.cells[m.start].y }, from: null, to: null, prog: 1, queue: [], buffered: null, trail: [m.start], gems: m.gems.slice(), total: m.gems.length, elapsed: 0, started: false, done: false, hints: 0, hint: null, hintUntil: 0, parts: [], squash: 0, face: 0, steps: 0, par: Math.round(m.tour * 0.33 + 3), stepMs: 80 };
    $('home').hidden = true; $('play').hidden = false; $('result').hidden = true;
    $('chip').textContent = spec.label;
    $('par').textContent = spec.walk ? (Curio.getBest(`walk:${spec.size}`) != null ? `${Curio.getBest(`walk:${spec.size}`).toFixed(1)}s` : '-') : `${G.par}s`;
    $('play').classList.toggle('walk', !!spec.walk);
    $('parL').textContent = spec.walk ? 'best' : 'par';
    $('gemsBox').hidden = !!spec.walk && !G.total;
    buildPad(); layout(); hud();
    if (spec.fog) { const seen = seenAround(); R.reveal(seen); }
    $('keys').innerHTML = m.kind === 'hex' ? 'Arrows or <span class="c-kbd">WASD</span>, plus <span class="c-kbd">Q</span> <span class="c-kbd">E</span> <span class="c-kbd">Z</span> <span class="c-kbd">C</span> for the slanted directions. Click or tap ahead of your explorer to run that way, or trace a path from it. <span class="c-kbd">H</span> path · <span class="c-kbd">R</span> restart' : 'Arrows or <span class="c-kbd">WASD</span> (hold two for diagonals). Click or tap ahead of your explorer to run that way, swipe, or trace a path from it. <span class="c-kbd">H</span> path · <span class="c-kbd">R</span> restart';
    scrollTo({ top: 0 });
    cv.focus({ preventScroll: true });
    kick();
  }
  function layout() {
    if (!G) return;
    const wide = innerWidth > 820;
    const avW = Math.min(document.querySelector('.c-wrap').clientWidth - 32 - (wide ? 230 : 0), 680);
    const avH = Math.max(260, innerHeight - (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bar-h')) || 0) - (wide ? 150 : SIMPLE ? 300 : 340));
    const m = G.m, ratio = m.w / m.h;
    let w = avW, h = w / ratio; if (h > avH) { h = avH; w = h * ratio; }
    R.set(m, G.theme, Math.floor(w), Math.floor(h), G.spec.fog);
    if (G.spec.fog) R.reveal(G.seen || []);
  }
  addEventListener('resize', () => { if (!$('play').hidden && G) { layout(); kick(); } });

  function seenAround() {
    const m = G.m, c = m.cells[G.cell], rad = 2.3 * m.unit, out = [];
    G.seenSet ||= new Set();
    m.cells.forEach((d, i) => { if (!G.seenSet.has(i) && Math.hypot(d.x - c.x, d.y - c.y) < rad) { G.seenSet.add(i); out.push(i); } });
    G.seen = [...G.seenSet];
    return out;
  }
  function hud(bumpGems) {
    $('gems').textContent = `${G.total - G.gems.length}/${G.total}`;
    if (bumpGems) { const el = $('gems'); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
    $('time').textContent = G.elapsed.toFixed(1);
    $('time').style.color = G.elapsed > G.par && !G.spec.walk ? 'var(--bad)' : '';
  }

  const angTo = (i, j) => { const a = G.m.cells[i], b = G.m.cells[j]; return Math.atan2(b.y - a.y, b.x - a.x); };
  const angDiff = (a, b) => { let d = Math.abs(a - b) % TAU; return d > Math.PI ? TAU - d : d; };
  let lastHoriz = 0;
  function pickDir(from, ang) {
    let best = -1, bd = 1.25;
    for (const j of G.m.open[from]) {
      let d = angDiff(angTo(from, j), ang);
      if (Math.abs(d - bd) < 0.05 && best >= 0) { const hx = Math.cos(angTo(from, j)); if (Math.sign(hx) === lastHoriz) best = j; continue; }
      if (d < bd) { bd = d; best = j; }
    }
    return best;
  }
  const tail = () => (G.queue.length ? G.queue[G.queue.length - 1] : G.to != null && G.prog < 1 ? G.to : G.cell);
  function go(ang, run = false) {
    if (!G || G.done || document.querySelector('.curio-modal')) return;
    if (Math.abs(Math.cos(ang)) > 0.3) lastHoriz = Math.sign(Math.cos(ang));
    if (G.prog < 1 || G.queue.length) { if (!run) { G.buffered = ang; return; } }
    const from = tail();
    const j = pickDir(from, ang);
    if (j < 0) { SFX.bump(); buzz(15); const st = $('stage'); st.classList.remove('shake'); void st.offsetWidth; st.classList.add('shake'); G.face = ang; return; }
    G.queue.push(j);
    if (run) {
      let prev = from, cur = j, n = 0;
      while (n++ < 300) {
        if (cur === G.m.exit || G.gems.includes(cur)) break;
        const nb = [...G.m.open[cur]].filter((k) => k !== prev);
        if (nb.length !== 1) break;
        prev = cur; cur = nb[0]; G.queue.push(cur);
      }
    }
    G.stepMs = run ? 55 : 80;
    kick();
  }
  function advance(dt) {
    if (G.prog < 1) {
      G.prog = Math.min(1, G.prog + dt / G.stepMs);
      const e = 1 - (1 - G.prog) ** 2, a = G.m.cells[G.from], b = G.m.cells[G.to];
      G.pos.x = a.x + (b.x - a.x) * e; G.pos.y = a.y + (b.y - a.y) * e;
      G.squash = Math.sin(G.prog * Math.PI);
      if (G.prog >= 1) arrive(G.to);
    }
    if (G.prog >= 1 && !G.done) {
      if (G.queue.length) {
        const j = G.queue.shift();
        if (!G.m.open[G.cell].has(j)) { G.queue = []; return; }
        if (!G.started) { G.started = true; }
        G.from = G.cell; G.to = j; G.prog = 0; G.face = angTo(G.cell, j);
        G.steps++; SFX.step(G.steps);
      } else if (G.buffered != null) { const a = G.buffered; G.buffered = null; go(a); }
      else G.squash *= 0.8;
    }
  }
  function arrive(i) {
    G.cell = i;
    const t = G.trail;
    if (t.length > 1 && t[t.length - 2] === i) t.pop(); else t.push(i);
    if (G.spec.fog) R.reveal(seenAround());
    const gi = G.gems.indexOf(i);
    if (gi >= 0) {
      G.gems.splice(gi, 1); S.gemsTotal++; save();
      const [x, y] = R.px(G.m.cells[i].x, G.m.cells[i].y);
      burst(x, y, R.th.gemCols, 20);
      SFX.gem(G.total - G.gems.length); buzz(20); hud(true);
      if (S.gemsTotal >= 100) unlock('hoard');
      if (!G.gems.length && G.total) Curio.toast(`All ${G.total} gems! Now find the exit`);
    }
    if (i === G.m.exit) finish();
  }
  function burst(x, y, cols, n) { for (let k = 0; k < n; k++) { const a = Math.random() * TAU, v = 1 + Math.random() * 3; G.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1, life: 1, c: cols[k % cols.length], s: 2 + Math.random() * 3 }); } }

  function loop(now) {
    raf = 0;
    if (document.hidden) return;
    const dt = Math.min(50, now - (lastT || now)); lastT = now;
    if (!$('home').hidden) {
      const k = Math.max(0, Math.floor((now - heroT0) / 260)) % (heroPath.length + 6), idx = Math.min(k, heroPath.length - 1), c = heroM.cells[heroPath[idx]];
      hero.draw({ trail: heroPath.slice(0, idx + 1), pos: { x: c.x, y: c.y }, gems: [], parts: [], squash: 0, face: 0 }, now);
      raf = requestAnimationFrame(loop); return;
    }
    if (!G) return;
    advance(dt);
    if (G.started && !G.done) G.elapsed += dt / 1000;
    for (const p of G.parts) { p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.life -= dt / 900; }
    G.parts = G.parts.filter((p) => p.life > 0);
    const hintAlpha = G.hint ? Math.min(1, (G.hintUntil - now) / 600) : 0;
    if (G.hint && now > G.hintUntil) G.hint = null;
    R.draw({ trail: G.trail, pos: G.pos, gems: G.gems, hint: G.hint, hintAlpha, parts: G.parts, squash: G.squash, face: G.face }, now);
    if (G.started && !G.done) { $('time').textContent = G.elapsed.toFixed(1); if (G.elapsed > G.par && !G.spec.walk) $('time').style.color = 'var(--bad)'; }
    raf = requestAnimationFrame(loop);
  }
  function kick() { if (!raf && !document.hidden) { lastT = 0; raf = requestAnimationFrame(loop); } }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });

  function finish() {
    G.done = true; G.queue = [];
    const secs = Math.round(G.elapsed * 10) / 10, sp = G.spec;
    if (sp.walk) return finishWalk(secs);
    const allGems = G.gems.length === 0, underPar = secs <= G.par;
    const st = 1 + (allGems ? 1 : 0) + (underPar ? 1 : 0);
    S.finishes++;
    if (!G.hints) S.noHint++;
    let isBest = false;
    if (sp.level != null) { if (S.done[sp.level] == null || st > S.done[sp.level]) S.done[sp.level] = st; const k = `l${sp.level}`; if (S.best[k] == null || secs < S.best[k]) { S.best[k] = secs; isBest = true; } }
    if (sp.daily) { if (S.daily[sp.daily] == null || secs < S.daily[sp.daily]) { S.daily[sp.daily] = secs; isBest = true; } }
    save();
    unlock('first');
    if (allGems && G.total) unlock('gems');
    if (st === 3) unlock('three');
    if (G.m.kind === 'hex') unlock('hex');
    if (G.m.kind === 'circle') unlock('circle');
    if (sp.fog) unlock('fog');
    if (sp.size === 'XL') unlock('xl');
    if (sp.size !== 'S' && secs < 15) unlock('speed');
    if (S.noHint >= 10) unlock('nohint');
    if (sp.daily) { unlock('daily'); if (streak() >= 3) unlock('streak3'); }
    if (WORLDS.some((w, wi) => LEVELS.filter((l) => l.world === wi).every((l) => S.done[l.n] != null))) unlock('world');
    if (LEVELS.every((l) => S.done[l.n] != null)) unlock('all');
    if (LEVELS.every((l) => S.done[l.n] === 3)) unlock('stars');
    const [x, y] = R.px(G.m.cells[G.m.exit].x, G.m.cells[G.m.exit].y);
    burst(x, y, [R.th.portal, '#fff', R.th.player], 60);
    SFX.win(); buzz([30, 50, 30, 50, 120]);
    setTimeout(() => Curio.confetti(), 300);
    hud();
    const box = $('result'), nextLvl = sp.level != null && sp.level < LEVELS.length - 1 ? sp.level + 1 : null;
    box.innerHTML = `<div class="mz-rcard" role="dialog" aria-label="Maze complete"><div class="mz-stars">${[0, 1, 2].map((i) => `<span class="${i < st ? '' : 'off'}" style="animation-delay:${0.3 + i * 0.2}s">★</span>`).join('')}</div>
      ${isBest ? '<span class="new">New best time</span>' : ''}<h3>${Curio.pick(['Escaped!', 'Out you pop!', 'Found it!', 'Free at last!'])}</h3>
      <div class="mz-reasons"><div class="ok"><i>✅</i>Reached the exit in ${secs.toFixed(1)}s</div><div class="${allGems ? 'ok' : ''}"><i>${allGems ? '✅' : '❌'}</i>${G.total ? `Gems: ${G.total - G.gems.length} of ${G.total}` : 'No gems in this maze'}</div><div class="${underPar ? 'ok' : ''}"><i>${underPar ? '✅' : '❌'}</i>Par ${G.par}s${G.hints ? ` (path shown ${G.hints}×, +${G.hints * 10}s)` : ''}</div></div>
      <div class="c-row">${nextLvl != null ? '<button class="c-btn" type="button" data-a="next">Next level</button>' : sp.level == null && !sp.daily ? '<button class="c-btn" type="button" data-a="new">New maze</button>' : ''}<button class="c-btn c-btn--ghost" type="button" data-a="retry">Retry</button><button class="c-btn c-btn--ghost" type="button" data-a="share">Share</button><button class="c-btn c-btn--ghost" type="button" data-a="menu">Map</button></div></div>`;
    [0, 1, 2].forEach((i) => { if (i < st) setTimeout(() => SFX.star(i), 300 + i * 200); });
    setTimeout(() => { box.hidden = false; box.querySelector('.c-btn')?.focus({ preventScroll: true }); }, 700);
    box.onclick = async (e) => {
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'next') startLevel(nextLvl);
      else if (a === 'new') $('freeBtn').click();
      else if (a === 'retry') start(sp);
      else if (a === 'menu') toHome();
      else if (a === 'share') { const text = `Zoble Maze Runner · ${sp.label}\n${'⭐'.repeat(st)} ${secs.toFixed(1)}s · gems ${G.total - G.gems.length}/${G.total}`; try { await navigator.clipboard.writeText(text); Curio.toast('Result copied'); } catch { Curio.toast('Could not copy'); } }
    };
  }
  function finishWalk(secs) {
    const sp = G.spec, b = Curio.best(`walk:${sp.size}`, secs, false);
    S.walk++; S.finishes++; if (!G.hints) S.noHint++; save();
    unlock('first'); if (S.noHint >= 10) unlock('nohint');
    const [x, y] = R.px(G.m.cells[G.m.exit].x, G.m.cells[G.m.exit].y);
    burst(x, y, [R.th.portal, '#fff', R.th.player], 60);
    SFX.win(); buzz([30, 50, 30]);
    if (b.isNew) setTimeout(() => Curio.confetti(), 300);
    hud();
    const box = $('result');
    box.innerHTML = `<div class="mz-rcard mz-walkcard" role="dialog" aria-label="Maze complete"><p class="mz-stamp">Walk ${S.walk} charted</p>${b.isNew ? '<span class="new">New best for this size</span>' : ''}<h3>${Curio.pick(['Out you pop!', 'Found the way!', 'Map complete!', 'Escaped!'])}</h3><p class="mz-walkt">${secs.toFixed(1)}<small>s</small></p><p class="c-muted">Best ${sp.size === 'S' ? 'small' : sp.size === 'M' ? 'medium' : 'large'} walk: ${b.best.toFixed(1)}s</p><div class="c-row"><button class="c-btn" type="button" data-a="next">Next maze</button><button class="c-btn c-btn--ghost" type="button" data-a="retry">Again</button></div></div>`;
    setTimeout(() => { box.hidden = false; box.querySelector('.c-btn')?.focus({ preventScroll: true }); }, 600);
    box.onclick = (e) => { const a = e.target.closest('[data-a]')?.dataset.a; if (a === 'next') start(walkSpec()); else if (a === 'retry') start({ ...sp }); };
  }
  function toHome() {
    if (SIMPLE) { start(walkSpec()); return; } $('play').hidden = true; $('home').hidden = false; G = null; paintHome(); heroT0 = performance.now(); kick(); scrollTo({ top: 0 }); }

  function showPath() {
    if (!G || G.done) return;
    const target = G.gems.length ? null : G.m.exit;
    const from = tail();
    let p;
    if (target != null) p = M.path(G.m, from, target);
    else { const d = M.bfs(G.m, from).dist; const near = G.gems.slice().sort((a, b) => d[a] - d[b])[0]; p = M.path(G.m, from, near); }
    G.hint = p; G.hintUntil = performance.now() + 3500; G.hints++; G.elapsed += 10; G.started = true;
    Curio.toast(target != null ? '+10s · path to the exit' : '+10s · path to the nearest gem');
    SFX.hint(); hud(); kick();
  }
  $('hintBtn').addEventListener('click', showPath);
  $('restartBtn').addEventListener('click', () => { if (G) start(G.spec); });
  $('backBtn').addEventListener('click', toHome);

  function buildPad() {
    const pad = $('pad'), hex = G.m.kind === 'hex';
    const angs = hex ? [-120, -60, 0, 60, 120, 180] : [-90, 0, 90, 180];
    const names = { '-120': 'Up left', '-60': 'Up right', 0: 'Right', 60: 'Down right', 120: 'Down left', 180: 'Left', '-90': 'Up', 90: 'Down' };
    pad.innerHTML = '';
    for (const a of angs) {
      const b = document.createElement('button'); b.type = 'button';
      b.style.left = `${50 + Math.cos(a * Math.PI / 180) * 34}%`; b.style.top = `${50 + Math.sin(a * Math.PI / 180) * 34}%`;
      b.innerHTML = `<span style="transform:rotate(${a}deg)">➜</span>`; b.setAttribute('aria-label', names[a]);
      const ang = a * Math.PI / 180;
      let rep = 0, del = 0;
      const stop = () => { clearTimeout(del); clearInterval(rep); b.classList.remove('on'); };
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); b.classList.add('on'); go(ang); del = setTimeout(() => { rep = setInterval(() => go(ang), 90); }, 280); });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => b.addEventListener(ev, stop));
      b.addEventListener('click', (e) => { if (e.detail === 0) go(ang); });
      b.addEventListener('contextmenu', (e) => e.preventDefault());
      pad.append(b);
    }
  }

  const held = new Set();
  const VEC = { arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1], arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0] };
  const DIAG = { q: -120, e: -60, z: 120, c: 60 };
  addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || !G || $('play').hidden || document.querySelector('.curio-modal')) return;
    const k = e.key.toLowerCase();
    if (VEC[k]) {
      e.preventDefault(); held.add(k);
      let x = 0, y = 0; for (const h of held) if (VEC[h]) { x += VEC[h][0]; y += VEC[h][1]; }
      if (!x && !y) { x = VEC[k][0]; y = VEC[k][1]; }
      go(Math.atan2(y, x));
    } else if (DIAG[k] != null) { e.preventDefault(); go(DIAG[k] * Math.PI / 180); }
    else if (k === 'h') showPath();
    else if (k === 'r') start(G.spec);
    else if (k === 'escape' && !SIMPLE) toHome();
    else if (k === 'n' && G.done && G.spec.walk) start(walkSpec());
  });
  addEventListener('keyup', (e) => held.delete(e.key.toLowerCase()));
  addEventListener('blur', () => held.clear());

  let tracing = false, dsx = 0, dsy = 0, dType = '', actedAt = 0;
  const toUnits = (p) => [(p.x - R.ox) / R.sc, (p.y - R.oy) / R.sc];
  Curio.drag(cv, {
    start: (p) => {
      if (!G || G.done) return;
      dsx = p.x; dsy = p.y; dType = p.pointerType;
      const [ux, uy] = toUnits(p);
      tracing = Math.hypot(ux - G.pos.x, uy - G.pos.y) < G.m.unit * 0.9;
    },
    move: (p) => {
      if (!tracing || !G || G.done) return;
      const [ux, uy] = toUnits(p);
      for (let n = 0; n < 6; n++) {
        const cur = tail(), cc = G.m.cells[cur], dc = Math.hypot(ux - cc.x, uy - cc.y);
        let best = -1, bd = dc;
        for (const j of G.m.open[cur]) { const c = G.m.cells[j], d = Math.hypot(ux - c.x, uy - c.y); if (d < bd && d < G.m.unit * 0.85) { bd = d; best = j; } }
        if (best < 0) break;
        G.queue.push(best); G.stepMs = 60; actedAt = performance.now();
      }
      kick();
    },
    end: (p) => {
      if (!p || !G) { tracing = false; return; }
      if (!tracing && dType !== 'mouse' && Math.hypot(p.x - dsx, p.y - dsy) > 20) { actedAt = performance.now(); go(Math.atan2(p.y - dsy, p.x - dsx), true); }
      tracing = false;
    }
  });
  cv.addEventListener('click', (e) => {
    if (!G || G.done || performance.now() - actedAt < 350) return;
    const r = cv.getBoundingClientRect(), [ux, uy] = toUnits({ x: e.clientX - r.left, y: e.clientY - r.top });
    if (Math.hypot(ux - G.pos.x, uy - G.pos.y) < G.m.unit * 0.9) return;
    go(Math.atan2(uy - G.pos.y, ux - G.pos.x), true);
  });

  $('howBtn').addEventListener('click', () => {
    const box = document.createElement('div'); box.style.textAlign = 'left';
    box.innerHTML = '<p style="margin:0 0 8px">Guide your explorer from the pale start mat to the swirling exit. Gems hide in dead ends.</p><p style="margin:0 0 8px"><b>Stars:</b> one for escaping, one for every gem, one for beating par time.</p><p style="margin:0 0 8px"><b>Moving:</b> arrows or WASD step, and holding two arrows goes diagonal on hex mazes (or use Q, E, Z, C). Click or tap anywhere ahead of your explorer to run that way to the next junction. Swipe on a phone. Or start on your explorer and trace a route: with Touchpad mode on, click the explorer, glide, and click again to stop.</p><p style="margin:0"><b>Fog:</b> in the dungeon you only see by torchlight, but places you have been stay dimly mapped. Stuck? Show path costs 10 seconds.</p>';
    Curio.modal({ emoji: '🧭', title: 'How to play', body: box, buttons: [{ label: 'Got it', value: 'x' }] });
  });
  $('trophyBtn').addEventListener('click', () => {
    const box = document.createElement('div'); box.className = 'mz-list';
    for (const a of ACH) { const d = document.createElement('div'); d.className = S.ach[a.id] ? '' : 'locked'; d.innerHTML = `<i>${a.icon}</i><div><b></b><span></span></div>`; d.querySelector('b').textContent = a.name; d.querySelector('span').textContent = a.desc; box.append(d); }
    Curio.modal({ emoji: '🏆', title: `Trophies ${Object.keys(S.ach).length}/${ACH.length}`, body: box, buttons: [{ label: 'Close', value: 'x' }] });
  });
  $('statsBtn').addEventListener('click', () => {
    const box = document.createElement('div');
    const lv = Object.keys(S.done).length, st = Object.values(S.done).reduce((a, b) => a + b, 0);
    box.innerHTML = `<p style="margin:0">${S.finishes} mazes escaped · ${lv}/30 levels · ${st}/90 stars · ${S.gemsTotal} gems collected · ${Object.keys(S.daily).length} daily mazes · daily streak ${streak()}</p>`;
    Curio.modal({ emoji: '📊', title: 'Your stats', body: box, buttons: [{ label: 'Close', value: 'x' }] });
  });

  if (SIMPLE) start(walkSpec()); else paintHome();
  kick();
  if (matchMedia('(pointer: fine)').matches && !Curio.store.get('maze:tip', false)) { Curio.store.set('maze:tip', true); setTimeout(() => Curio.toast('Tip: turn on Touchpad mode in the top bar to trace paths click-move-click', 4200), 1200); }
  window.__maze = { get G() { return G; }, go, startLevel, start, M, LEVELS, showPath };
})();
