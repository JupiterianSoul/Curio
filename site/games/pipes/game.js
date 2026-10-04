'use strict';
const Pipes = (() => {
  const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
  const rot = (m, r) => { r = ((r % 4) + 4) % 4; return ((m << r) | (m >> (4 - r))) & 15; };
  function nb(n, wrap, i, d) {
    let x = i % n + DX[d], y = Math.floor(i / n) + DY[d];
    if (wrap) { x = (x + n) % n; y = (y + n) % n; } else if (x < 0 || y < 0 || x >= n || y >= n) return -1;
    return y * n + x;
  }
  const deg = (m) => (m & 1) + ((m >> 1) & 1) + ((m >> 2) & 1) + ((m >> 3) & 1);
  function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function generate(n, wrap, rand = Math.random) {
    const N = n * n;
    for (;;) {
      const mask = new Uint8Array(N), inT = new Uint8Array(N);
      const src = Math.floor(n / 2) * n + Math.floor((n - 1) / 2);
      inT[src] = 1;
      let count = 1;
      const fr = [];
      const add = (u) => { for (let d = 0; d < 4; d++) fr.push([u, d]); };
      add(src);
      while (fr.length) {
        const k = Math.floor(rand() * fr.length);
        const [u, d] = fr[k]; fr[k] = fr[fr.length - 1]; fr.pop();
        const v = nb(n, wrap, u, d);
        if (v < 0 || inT[v] || deg(mask[u]) >= 3) continue;
        if (u === src && deg(mask[u]) >= 2 && n > 5) continue;
        mask[u] |= 1 << d; mask[v] |= 1 << ((d + 2) % 4);
        inT[v] = 1; count++; add(v);
      }
      if (count < N) continue;
      let leaves = 0;
      for (let i = 0; i < N; i++) if (deg(mask[i]) === 1 && i !== src) leaves++;
      if (leaves < N * 0.18) continue;
      return { mask, src };
    }
  }
  function flood(n, wrap, cur, src) {
    const dist = new Int16Array(n * n).fill(-1), parentDir = new Int8Array(n * n).fill(-1);
    dist[src] = 0;
    const q = [src];
    for (let qi = 0; qi < q.length; qi++) {
      const u = q[qi];
      for (let d = 0; d < 4; d++) {
        if (!(cur[u] & (1 << d))) continue;
        const v = nb(n, wrap, u, d);
        if (v < 0 || dist[v] >= 0) continue;
        if (!(cur[v] & (1 << ((d + 2) % 4)))) continue;
        dist[v] = dist[u] + 1; parentDir[v] = (d + 2) % 4; q.push(v);
      }
    }
    return { dist, parentDir };
  }
  return { rot, nb, deg, generate, flood, rng, DX, DY };
})();

(() => {
  const $ = (id) => document.getElementById(id);
  const svg = $('board'), seg = $('seg');
  const NS = 'http://www.w3.org/2000/svg';
  const SIZES = [5, 6, 7, 8, 9, 10];
  const CAMP = 60;
  const campCfg = (L) => {
    if (L <= 10) return { n: 5, wrap: false };
    if (L <= 20) return { n: 6, wrap: false };
    if (L <= 30) return { n: 7, wrap: false };
    if (L <= 38) return { n: 8, wrap: false };
    if (L <= 44) return { n: 9, wrap: false };
    if (L <= 50) return { n: 10, wrap: false };
    return { n: 5 + Math.floor((L - 51) / 2), wrap: true };
  };
  const ACH = [
    { id: 'first', name: 'Plumber', d: 'Solve any board' },
    { id: 'perfect', name: 'Smooth Operator', d: 'Earn three stars on a level' },
    { id: 'camp10', name: 'Apprentice', d: 'Clear 10 campaign levels' },
    { id: 'camp30', name: 'Journeyman', d: 'Clear 30 campaign levels' },
    { id: 'camp60', name: 'Master Plumber', d: 'Clear all 60 campaign levels' },
    { id: 'wrap', name: 'Möbius Mind', d: 'Solve a wrap-around board' },
    { id: 'big', name: 'Waterworks', d: 'Solve a 10×10 board' },
    { id: 'nohint', name: 'No Manual Needed', d: 'Solve 8×8 or bigger without hints' },
    { id: 'daily', name: 'Daily Drip', d: 'Solve the daily puzzle' },
    { id: 'rush10', name: 'Flash Flood', d: 'Solve 10 boards in one Rush' },
    { id: 'speedy', name: 'Quick Wrench', d: 'Solve a 6×6 in under 30 seconds' }
  ];
  const SKEY = 'pipes2';
  const loadS = () => {
    const base = { v: 1, camp: {}, ach: {}, stats: { solved: 0, turns: 0, hints: 0, rushBest: 0 }, theme: 'garden', mode: 'campaign', level: 1, daily: {} };
    const d = Curio.store.get(SKEY, null);
    if (!d || typeof d !== 'object' || d.v !== 1) return base;
    return { ...base, ...d, stats: { ...base.stats, ...(d.stats || {}) } };
  };
  const S = loadS();
  const save = () => Curio.store.set(SKEY, S);
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const cfg0 = Curio.store.get('pipes:cfg', { n: 5, wrap: false }) || {};
  const SIMPLE = Curio.simple;
  let mode = ['campaign', 'free', 'daily', 'rush'].includes(S.mode) ? S.mode : 'campaign';
  if (mode === 'rush') mode = 'campaign';
  if (SIMPLE) mode = 'simple';
  let sL = Math.max(1, +Curio.store.get('pipes:simpleL', 1) || 1);
  const simpleN = (L) => (L <= 3 ? 4 : L <= 12 ? 5 : L <= 24 ? 6 : 7);
  const clank = (pitch = 1, wet = false) => {
    if (Curio.muted) return; const ac = Curio.audioContext(); if (!ac) return;
    const t = ac.currentTime, len = Math.ceil(ac.sampleRate * 0.05), buf = ac.createBuffer(1, len, ac.sampleRate), ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 4;
    const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = buf; f.type = 'bandpass'; f.frequency.value = 1800 * pitch; f.Q.value = 6; g.gain.value = 0.45;
    src.connect(f).connect(g).connect(ac.destination); src.start(t);
    [1, 2.76].forEach((m, k) => { const o = ac.createOscillator(), og = ac.createGain(); o.type = 'sine'; o.frequency.value = 520 * pitch * m; og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(k ? 0.012 : 0.03, t + 0.004); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.22); o.connect(og).connect(ac.destination); o.start(t); o.stop(t + 0.25); });
    if (wet) { const o = ac.createOscillator(), og = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(380, t + 0.03); o.frequency.exponentialRampToValueAtTime(900 + Math.random() * 300, t + 0.12); og.gain.setValueAtTime(0.0001, t + 0.03); og.gain.exponentialRampToValueAtTime(0.05, t + 0.05); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.14); o.connect(og).connect(ac.destination); o.start(t + 0.03); o.stop(t + 0.16); }
  };
  let n = 5, wrap = false, freeN = SIZES.includes(cfg0.n) ? cfg0.n : 5, freeWrap = !!cfg0.wrap, level = Math.max(1, Math.min(CAMP, S.level | 0 || 1));
  let base, src, rots, locked, moves = 0, history = [], status = 'playing', cur = 0, opt = 0;
  let elapsed = 0, t0 = 0, started = false, hints = 0, lockMode = false, revMode = false, cellEls = [], rotEls = [], dripEls = [], lastFlood = null, gameId = 0;
  let rushLeft = 0, rushCount = 0;

  const fmtT = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const key = () => `${n}${wrap ? 'w' : ''}`;
  const el = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.append(e); return e; };
  const curMask = (i) => Pipes.rot(base[i], rots[i]);
  const campDone = () => Object.keys(S.camp).length;
  const campUnlocked = () => { let f = 1; while (f <= CAMP && S.camp[f]) f++; return Math.min(CAMP, f + 2); };

  SIZES.forEach((k) => {
    const b = document.createElement('button');
    b.type = 'button'; b.dataset.n = k; b.textContent = `${k}×${k}`;
    b.addEventListener('click', () => { freeN = k; newGame(); });
    seg.append(b);
  });

  function minTurns(i) {
    let best = 9;
    for (let k = 0; k < 4; k++) if (Pipes.rot(base[i], rots[i] + k) === base[i]) best = Math.min(best, k, 4 - k);
    return best;
  }
  function pipeShape(g, m) {
    const ends = [[0, -50], [50, 0], [0, 50], [-50, 0]];
    const dirs = [0, 1, 2, 3].filter((d) => m & (1 << d));
    for (const d of dirs) el('line', { x1: 0, y1: 0, x2: ends[d][0], y2: ends[d][1], class: 'rim' }, g);
    el('circle', { r: 19, class: 'joint-rim' }, g);
    for (const d of dirs) el('line', { x1: 0, y1: 0, x2: ends[d][0], y2: ends[d][1], class: 'body' }, g);
    el('circle', { r: 15, class: 'joint' }, g);
    for (const d of dirs) {
      const [ex, ey] = ends[d];
      const w = d % 2 ? 7 : 40, h = d % 2 ? 40 : 7;
      el('rect', { x: ex * 0.86 - w / 2, y: ey * 0.86 - h / 2, width: w, height: h, rx: 2, class: 'flange' }, g);
      const ox = d % 2 ? 0 : -7, oy = d % 2 ? -7 : 0;
      el('line', { x1: ox + ex * 0.2, y1: oy + ey * 0.2, x2: ox + ex * 0.78, y2: oy + ey * 0.78, class: 'shine' }, g);
    }
    for (const d of dirs) el('line', { x1: 0, y1: 0, x2: ends[d][0], y2: ends[d][1], class: 'chan' }, g);
    el('circle', { r: 7, class: 'joint-c' }, g);
    for (const d of dirs) el('line', { x1: 0, y1: 0, x2: ends[d][0] * 0.95, y2: ends[d][1] * 0.95, class: 'flowline' }, g);
  }
  function tapArt(g) {
    const th = S.theme;
    if (th === 'lab') {
      el('path', { d: 'M-8 -24h16v12l14 26a6 6 0 0 1-5 9h-34a6 6 0 0 1-5-9l14-26z', class: 'flask' }, g);
      el('path', { d: 'M-13 -6h26l9 17a6 6 0 0 1-5 9h-34a6 6 0 0 1-5-9z', class: 'flask-fill' }, g);
      el('rect', { x: -10, y: -28, width: 20, height: 5, rx: 2, fill: '#c9d6ff' }, g);
    } else if (th === 'copper') {
      el('circle', { r: 24, class: 'valve' }, g);
      el('circle', { r: 13, class: 'valve-c' }, g);
      for (let k = 0; k < 4; k++) el('rect', { x: -3, y: -24, width: 6, height: 10, rx: 2, fill: '#fff', opacity: '.7', transform: `rotate(${k * 90 + 45})` }, g);
    } else {
      el('path', { d: 'M-20 0h40l-6 26h-28z', class: 'pot' }, g);
      el('rect', { x: -23, y: -6, width: 46, height: 10, rx: 3, class: 'pot-rim' }, g);
      el('ellipse', { cx: 0, cy: -2, rx: 18, ry: 3, class: 'soil' }, g);
      el('path', { d: 'M0 -4C0 -16 2 -22 0 -30', class: 'stem' }, g);
      el('path', { d: 'M0 -14q-12 -6 -14 -14q12 2 14 12z', class: 'leafy' }, g);
      el('path', { d: 'M0 -18q12 -6 13 -13q-11 1 -13 11z', class: 'leafy' }, g);
      el('path', { d: 'M-8 -30q8 6 16 0', stroke: '#8d6e63', 'stroke-width': 2.5, fill: 'none', class: 'sad' }, g);
      const bl = el('g', { class: 'bloom' }, g);
      const hue = Math.floor(Math.random() * 6);
      const col = ['#ff6b9d', '#ffb347', '#c792ea', '#ff5a5f', '#ffd93d', '#6ec6ff'][hue];
      for (let k = 0; k < 6; k++) el('ellipse', { cx: 0, cy: -38, rx: 5, ry: 8, fill: col, transform: `rotate(${k * 60} 0 -31)` }, bl);
      el('circle', { cx: 0, cy: -31, r: 5, fill: '#ffe066' }, bl);
    }
  }
  function pumpArt(g) {
    el('circle', { r: 32, class: 'pump-body' }, g);
    const w = el('g', { class: 'pump-wheel' }, g);
    el('circle', { r: 20, fill: 'none', stroke: '#fff', 'stroke-width': 4, opacity: '.85' }, w);
    for (let k = 0; k < 6; k++) el('line', { x1: 0, y1: 0, x2: Math.cos(k * Math.PI / 3) * 20, y2: Math.sin(k * Math.PI / 3) * 20, stroke: '#fff', 'stroke-width': 3, opacity: '.85' }, w);
    el('path', { d: 'M0 -11 C 5 -4 8 0 8 4 A 8 8 0 0 1 -8 4 C -8 0 -5 -4 0 -11 Z', fill: '#fff' }, g);
  }
  function setMode(m) {
    mode = m;
    if (m !== 'rush' && m !== 'simple') { S.mode = m; save(); }
    $('freeOpts').hidden = m !== 'free';
    $('campOpts').hidden = m !== 'campaign';
    document.querySelectorAll('#modes [data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
    $('new').disabled = m === 'campaign' || m === 'daily';
  }
  function seedFor() {
    if (mode === 'simple') return sL * 104729 + 77;
    if (mode === 'campaign') return level * 7919 + 1301;
    if (mode === 'daily') return [...today()].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261);
    return (Math.random() * 2 ** 31) | 0;
  }
  function newGame(opts = {}) {
    gameId++;
    if (mode === 'simple') { n = simpleN(sL); wrap = false; }
    else if (mode === 'campaign') ({ n, wrap } = campCfg(level));
    else if (mode === 'daily') { n = 8; wrap = Math.floor(Date.now() / 864e5) % 2 === 1; }
    else if (mode === 'rush') { n = 5; wrap = false; }
    else { n = freeN; wrap = freeWrap; Curio.store.set('pipes:cfg', { n, wrap }); }
    const rand = Pipes.rng(seedFor());
    const g = Pipes.generate(n, wrap, rand);
    base = g.mask; src = g.src;
    do { rots = Array.from({ length: n * n }, () => Math.floor(rand() * 4)); } while (solvedNow());
    locked = new Uint8Array(n * n);
    opt = 0;
    for (let i = 0; i < n * n; i++) opt += minTurns(i);
    moves = 0; history = []; status = 'playing'; hints = 0;
    if (mode !== 'rush' || opts.fresh) { elapsed = 0; started = false; }
    cur = src;
    $('result').hidden = true;
    build();
    [...seg.children].forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.n === n)));
    $('mWall').setAttribute('aria-pressed', String(!wrap)); $('mWrap').setAttribute('aria-pressed', String(wrap));
    $('wrapEl').classList.toggle('wrap', wrap);
    paintPicker();
    if (!opts.quiet) {
      if (mode === 'simple') msg(sL === 1 ? 'Tap a pipe to turn it. Join every pipe so water from the pump reaches all the pots.' : Curio.pick(['New job on the board. Spin those fittings.', 'Another leaky garden. You know the drill.', 'Tools out. Water on.', 'The pump is ready when you are.']));
      else if (mode === 'rush') msg(rushCount ? `Board ${rushCount + 1}. Keep going!` : 'Rush: solve as many 5×5 boards as you can in three minutes. The clock starts on your first turn.');
      else if (mode === 'daily') msg(`Today's puzzle: 8×8${wrap ? ' with wrap-around edges' : ''}. Same board for everyone.`);
      else msg(wrap ? 'Wrap-around: pipes on one edge continue on the opposite edge.' : S.theme === 'garden' ? 'Get water from the pump to every thirsty plant.' : 'Get water from the pump to every outlet.');
    }
    render();
  }
  function solvedNow() {
    const c = Array.from({ length: n * n }, (_, i) => Pipes.rot(base[i], rots[i]));
    return Pipes.flood(n, wrap, c, src).dist.every((d) => d >= 0);
  }
  function build() {
    svg.innerHTML = '';
    svg.setAttribute('viewBox', `0 0 ${n * 100} ${n * 100}`);
    svg.classList.remove('solved');
    cellEls = []; rotEls = []; dripEls = [];
    const layer = el('g', {}, svg);
    for (let i = 0; i < n * n; i++) {
      const x = i % n, y = Math.floor(i / n);
      const g = el('g', { transform: `translate(${x * 100 + 50} ${y * 100 + 50})`, 'data-i': i }, layer);
      el('rect', { x: -47, y: -45, width: 96, height: 96, rx: 12, class: 'tsh' }, g);
      el('rect', { x: -48, y: -48, width: 96, height: 96, rx: 12, class: 'tbg' }, g);
      const r = el('g', { class: 'rot' }, g);
      r.style.transform = `rotate(${rots[i] * 90}deg)`;
      pipeShape(r, base[i]);
      if (i === src) pumpArt(g);
      else if (Pipes.deg(base[i]) === 1) tapArt(g);
      const drips = [[0, -40], [40, 0], [0, 40], [-40, 0]].map(([dx, dy]) => el('circle', { cx: dx, cy: dy, r: 5, class: 'drip' }, g));
      el('path', { d: 'M28 -38h14v10h-14z M31 -38v-4a4 4 0 0 1 8 0v4', class: 'lockmark' }, g);
      cellEls.push(g); rotEls.push(r); dripEls.push(drips);
    }
    el('rect', { class: 'cursor', x: 3, y: 3, width: 94, height: 94, id: 'cur' }, svg);
  }
  function msg(t) { $('msg').textContent = t; }
  function bump(id, v) { const e = $(id); if (e.textContent !== String(v)) { e.textContent = v; e.classList.add('bump'); setTimeout(() => e.classList.remove('bump'), 120); } }
  function render() {
    const c = Array.from({ length: n * n }, (_, i) => curMask(i));
    lastFlood = Pipes.flood(n, wrap, c, src);
    let taps = 0, wet = 0;
    for (let i = 0; i < n * n; i++) {
      const w = lastFlood.dist[i] >= 0;
      cellEls[i].classList.toggle('wet', w);
      cellEls[i].classList.toggle('locked', !!locked[i]);
      if (Pipes.deg(base[i]) === 1 && i !== src && w) taps++;
      if (w) wet++;
      for (let d = 0; d < 4; d++) {
        let leak = false;
        if (w && (c[i] & (1 << d))) { const v = Pipes.nb(n, wrap, i, d); leak = v < 0 || !(c[v] & (1 << ((d + 2) % 4))); }
        dripEls[i][d].classList.toggle('leak', leak);
      }
    }
    bump('moves', moves);
    $('taps').textContent = `${taps}/${tapsTotal()}`;
    renderTime();
    let b;
    if (mode === 'rush') { b = S.stats.rushBest || null; $('bestLbl').textContent = 'Best rush'; $('best').textContent = b ? b : '-'; }
    else if (mode === 'campaign') { const c2 = S.camp[level]; $('bestLbl').textContent = 'Best'; $('best').textContent = c2 ? fmtT(c2.time) : '-'; }
    else if (mode === 'simple') { b = Curio.getBest(`simple-${sL}`); $('bestLbl').textContent = 'Best'; $('best').textContent = b == null ? '-' : fmtT(b); }
    else if (mode === 'daily') { $('bestLbl').textContent = 'Best'; $('best').textContent = S.daily[today()] != null ? fmtT(S.daily[today()]) : '-'; }
    else { b = Curio.getBest(`time-${key()}`); $('bestLbl').textContent = 'Best'; $('best').textContent = b == null ? '-' : fmtT(b); }
    $('undo').disabled = !history.length || status !== 'playing';
    $('hint').disabled = status !== 'playing' || mode === 'rush';
    $('lockMode').setAttribute('aria-pressed', String(lockMode));
    $('revMode').setAttribute('aria-pressed', String(revMode));
    const cr = svg.querySelector('#cur');
    if (cr) cr.setAttribute('transform', `translate(${(cur % n) * 100} ${Math.floor(cur / n) * 100})`);
    return wet;
  }
  function renderTime() {
    if (mode === 'rush') {
      $('timeLbl').textContent = 'Left';
      const left = Math.max(0, rushLeft);
      $('time').textContent = fmtT(Math.ceil(left));
      $('time').classList.toggle('urgent', left < 20 && started);
      $('taps').parentElement.querySelector('span').textContent = `Plants · board ${rushCount + 1}`;
    } else {
      $('timeLbl').textContent = 'Time';
      $('time').classList.remove('urgent');
      $('time').textContent = fmtT(elapsed);
      $('taps').parentElement.querySelector('span').textContent = S.theme === 'garden' ? 'Plants' : 'Outlets';
    }
  }
  function tapsTotal() { let t = 0; for (let i = 0; i < n * n; i++) if (Pipes.deg(base[i]) === 1 && i !== src) t++; return t; }
  function turn(i, d, record = true) {
    if (status !== 'playing') return;
    if (locked[i] && record) { Curio.beep(160, 0.06, 'square', 0.04); cellEls[i].animate([{ opacity: 1 }, { opacity: 0.5 }, { opacity: 1 }], 200); return; }
    if (!started) startClock();
    rots[i] += d;
    rotEls[i].style.transform = `rotate(${rots[i] * 90}deg)`;
    if (record) { history.push([i, d]); moves++; S.stats.turns++; } else moves--;
    const before = lastFlood ? lastFlood.dist.filter((x) => x >= 0).length : 0;
    const wet = render();
    clank(0.9 + Math.random() * 0.25, wet > before);
    navigator.vibrate?.(4);
    if (record) checkWin();
  }
  function startClock() { started = true; t0 = performance.now(); if (mode === 'rush' && rushLeft <= 0) rushLeft = 180; }
  function toggleLock(i) {
    if (status !== 'playing') return;
    locked[i] ^= 1;
    Curio.beep(locked[i] ? 880 : 440, 0.04, 'sine', 0.05);
    render();
  }
  function undo() {
    if (!history.length || status !== 'playing') return;
    const [i, d] = history.pop();
    turn(i, -d, false);
  }
  function hint() {
    if (status !== 'playing' || mode === 'rush') return;
    const wrong = [];
    for (let i = 0; i < n * n; i++) if (curMask(i) !== base[i]) wrong.push(i);
    if (!wrong.length) return;
    const near = wrong.filter((i) => lastFlood.dist[i] < 0 && [0, 1, 2, 3].some((d) => { const v = Pipes.nb(n, wrap, i, d); return v >= 0 && lastFlood.dist[v] >= 0; }));
    const pool = near.length ? near : wrong;
    const i = pool[Math.floor(Math.random() * pool.length)];
    let r = rots[i];
    while (Pipes.rot(base[i], r) !== base[i]) r++;
    hints++; S.stats.hints++;
    if (!started) startClock();
    history.push([i, r - rots[i]]); moves++;
    rots[i] = r;
    rotEls[i].style.transform = `rotate(${rots[i] * 90}deg)`;
    locked[i] = 1;
    cur = i;
    cellEls[i].animate([{ opacity: 0.3 }, { opacity: 1 }], 500);
    msg('That tile is now in place and locked.');
    Curio.beep(990, 0.08, 'sine', 0.06);
    render();
    checkWin();
  }
  const starSvg = (on) => `<svg viewBox="0 0 24 24"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 21l1.6-7L2 9.2l7.1-.6z" fill="${on ? '#ffc93c' : 'var(--surface-2)'}" stroke="${on ? '#e09b00' : 'var(--line)'}" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
  function award(id, fresh) { if (!S.ach[id]) { S.ach[id] = Date.now(); fresh.push(id); } }
  function flowAnim(step) {
    svg.classList.add('solved');
    const fl = el('g', {}, svg);
    for (let i = 0; i < n * n; i++) {
      const d = lastFlood.dist[i];
      cellEls[i].style.setProperty('--d', `${d * step}ms`);
      if (Pipes.deg(base[i]) === 1 && i !== src) {
        const s = el('circle', { cx: (i % n) * 100 + 50, cy: Math.floor(i / n) * 100 + 50, r: 22, class: 'splash' }, fl);
        s.style.setProperty('--d', `${(d + 0.8) * step}ms`);
        if (step > 20) setTimeout(() => Curio.beep(700 + Math.random() * 500, 0.06, 'sine', 0.04), (d + 0.8) * step);
      }
    }
  }
  function checkWin() {
    if (!lastFlood.dist.every((d) => d >= 0)) return;
    status = 'won';
    tick();
    const secs = Math.round(elapsed);
    const fresh = [];
    S.stats.solved++;
    award('first', fresh);
    if (wrap) award('wrap', fresh);
    if (n === 10) award('big', fresh);
    if (n >= 8 && !hints) award('nohint', fresh);
    if (mode === 'rush') {
      rushCount++;
      if (rushCount >= 10) award('rush10', fresh);
      save();
      flowAnim(25);
      Curio.beep(784, 0.1, 'triangle', 0.08); setTimeout(() => Curio.beep(1046, 0.12, 'triangle', 0.08), 90);
      msg(`Board ${rushCount} done!`);
      const gid = gameId;
      setTimeout(() => { if (gid === gameId && mode === 'rush' && rushLeft > 0) newGame(); }, 650);
      return;
    }
    const st = hints ? 1 : moves <= opt + 2 ? 3 : moves <= Math.ceil(opt * 1.5) + 4 ? 2 : 1;
    if (st === 3) award('perfect', fresh);
    if (n === 6 && secs < 30 && !hints) award('speedy', fresh);
    let bt = { best: null, isNew: false };
    if (mode === 'campaign') {
      const prev = S.camp[level];
      S.camp[level] = { stars: Math.max(st, prev ? prev.stars : 0), time: Math.min(secs, prev ? prev.time : 1e9), moves: Math.min(moves, prev ? prev.moves : 1e9) };
      bt = { best: S.camp[level].time, isNew: !prev || secs < prev.time };
      if (campDone() >= 10) award('camp10', fresh);
      if (campDone() >= 30) award('camp30', fresh);
      if (campDone() >= CAMP) award('camp60', fresh);
    } else if (mode === 'simple') {
      bt = Curio.best(`simple-${sL}`, secs, false);
    } else if (mode === 'daily') {
      award('daily', fresh);
      S.daily[today()] = Math.min(S.daily[today()] ?? 1e9, secs);
    } else if (!hints) bt = Curio.best(`time-${key()}`, secs, false);
    save();
    const maxD = Math.max(...lastFlood.dist);
    const step = Math.min(90, 1400 / Math.max(1, maxD));
    flowAnim(step);
    render();
    msg(S.theme === 'garden' ? 'Water is flowing. Every plant is blooming!' : 'Water is flowing. Every outlet is running!');
    setTimeout(() => {
      if (!hints) Curio.confetti();
      [523, 659, 784, 1046].forEach((f, k) => setTimeout(() => Curio.beep(f, 0.14, 'triangle', 0.09), k * 100));
    }, maxD * step);
    navigator.vibrate?.([20, 40, 20]);
    const gid = gameId;
    setTimeout(() => {
      if (gid !== gameId) return;
      $('rStars').innerHTML = [1, 2, 3].map((i) => starSvg(i <= st)).join('');
      $('rTitle').textContent = mode === 'simple' ? `Job ${sL} done!` : mode === 'daily' ? 'Daily puzzle plumbed!' : mode === 'campaign' ? `Level ${level} flowing!` : 'Water works!';
      $('rBody').textContent = `${n}×${n}${wrap ? ' wrap-around' : ''} in ${fmtT(secs)} with ${moves} turns (about ${opt} needed)${hints ? ` and ${hints} hint${hints > 1 ? 's' : ''}` : ''}. ${bt.isNew ? 'New best time!' : bt.best != null ? `Best: ${fmtT(bt.best)}.` : ''}`;
      $('rBadges').innerHTML = fresh.map((id) => { const a = ACH.find((x) => x.id === id); return `<span class="badge on new" title="${a.d}">★ ${a.name}</span>`; }).join('');
      const nx = $('rNext');
      nx.hidden = mode === 'daily' || (mode === 'campaign' && level >= CAMP);
      nx.textContent = mode === 'simple' ? 'Next job' : mode === 'campaign' ? `Level ${level + 1}` : 'Next puzzle';
      $('result').hidden = false;
      (nx.hidden ? $('rAgain') : nx).focus({ preventScroll: true });
      paintProgress(); paintPicker();
    }, maxD * step + 1300);
  }
  function rushOver() {
    status = 'over';
    const fresh = [];
    const prev = S.stats.rushBest || 0;
    if (rushCount > prev) S.stats.rushBest = rushCount;
    if (rushCount >= 10) award('rush10', fresh);
    save();
    if (rushCount > prev && rushCount > 0) Curio.confetti();
    [659, 523, 392].forEach((f, k) => setTimeout(() => Curio.beep(f, 0.14, 'triangle', 0.08), k * 120));
    $('rStars').innerHTML = [1, 2, 3].map((i) => starSvg(rushCount >= [3, 6, 10][i - 1])).join('');
    $('rTitle').textContent = 'Time!';
    $('rBody').textContent = `You plumbed ${rushCount} board${rushCount === 1 ? '' : 's'} in three minutes. ${rushCount > prev ? 'New best rush!' : `Best: ${prev}.`}`;
    $('rBadges').innerHTML = fresh.map((id) => { const a = ACH.find((x) => x.id === id); return `<span class="badge on new">★ ${a.name}</span>`; }).join('');
    $('rNext').hidden = false;
    $('rNext').textContent = 'Rush again';
    $('result').hidden = false;
    $('rNext').focus({ preventScroll: true });
    paintProgress();
  }
  $('rNext').addEventListener('click', () => {
    if (mode === 'campaign') { level = Math.min(CAMP, level + 1); S.level = level; save(); }
    if (mode === 'simple') { sL++; Curio.store.set('pipes:simpleL', sL); }
    if (mode === 'rush') { rushCount = 0; rushLeft = 0; newGame({ fresh: true }); return; }
    newGame();
  });
  $('rAgain').addEventListener('click', () => { $('result').hidden = true; });
  $('rShare').addEventListener('click', () => {
    const st = $('rStars').querySelectorAll('[fill="#ffc93c"]').length;
    const what = mode === 'rush' ? `Rush: ${rushCount} boards in 3:00` : mode === 'daily' ? `Daily ${today()} in ${fmtT(Math.round(elapsed))}` : mode === 'campaign' ? `Level ${level} in ${fmtT(Math.round(elapsed))}` : `${n}×${n} in ${fmtT(Math.round(elapsed))}`;
    const txt = `Zoble Pipes · ${what}\n${'⭐'.repeat(st)}${'☆'.repeat(3 - st)}${mode === 'rush' ? '' : ` ${moves} turns`}`;
    (navigator.clipboard?.writeText(txt) || Promise.reject()).then(() => Curio.toast('Result copied'), () => Curio.toast('Copy failed, sorry'));
  });
  function paintPicker() {
    if (mode !== 'campaign') return;
    const p = $('picker'), up = campUnlocked();
    p.innerHTML = Array.from({ length: CAMP }, (_, k) => {
      const L = k + 1, c = S.camp[L], cf = campCfg(L);
      return `<button type="button" class="pk${c ? ' done' : ''}${cf.wrap ? ' wrapl' : ''}" data-l="${L}" aria-current="${L === level}" ${L > up && !c ? 'disabled' : ''} title="${cf.n}×${cf.n}${cf.wrap ? ' wrap' : ''}">${L}<small>${c ? '★'.repeat(c.stars) : ''}</small></button>`;
    }).join('');
    const c = S.camp[level], cf = campCfg(level);
    $('lvlName').innerHTML = `Level ${level} · ${cf.n}×${cf.n}${cf.wrap ? ' ↻' : ''}<small>${c ? '★'.repeat(c.stars) + '☆'.repeat(3 - c.stars) : ''}</small>`;
    $('prev').disabled = level <= 1;
    $('nextL').disabled = level >= CAMP || level + 1 > up;
  }
  $('picker').addEventListener('click', (e) => { const b = e.target.closest('[data-l]'); if (!b || b.disabled) return; level = +b.dataset.l; S.level = level; save(); $('picker').classList.remove('open'); newGame(); });
  $('lvlName').addEventListener('click', () => { const p = $('picker'); p.classList.toggle('open'); $('lvlName').setAttribute('aria-expanded', String(p.classList.contains('open'))); });
  $('prev').addEventListener('click', () => { if (level > 1) { level--; S.level = level; save(); newGame(); } });
  $('nextL').addEventListener('click', () => { if (level < CAMP && level + 1 <= campUnlocked()) { level++; S.level = level; save(); newGame(); } });
  function paintProgress() {
    const st = S.stats;
    $('stats').innerHTML = `<div class="c-stat"><b>${st.solved}</b><span>Solved</span></div><div class="c-stat"><b>${campDone()}/${CAMP}</b><span>Campaign</span></div><div class="c-stat"><b>${st.turns}</b><span>Turns</span></div><div class="c-stat"><b>${st.rushBest || 0}</b><span>Best rush</span></div><div class="c-stat"><b>${st.hints}</b><span>Hints</span></div>`;
    $('badges').innerHTML = ACH.map((a) => `<span class="badge${S.ach[a.id] ? ' on' : ''}" title="${a.d}">${S.ach[a.id] ? '★' : '☆'} ${a.name}</span>`).join('');
    $('badgeCount').textContent = `(${ACH.filter((a) => S.ach[a.id]).length}/${ACH.length} badges)`;
  }
  function paintTheme() {
    document.querySelector('.play').className = `play theme-${S.theme}`;
    document.querySelectorAll('[data-theme-pick]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.themePick === S.theme)));
  }
  function tick() {
    const now = performance.now();
    if (started && !document.hidden) {
      const dt = (now - t0) / 1000;
      if (status === 'playing') elapsed += dt;
      if (mode === 'rush' && status !== 'over' && rushLeft > 0) {
        rushLeft -= dt;
        if (rushLeft <= 0) { rushLeft = 0; gameId++; rushOver(); }
        else if (rushLeft < 10 && Math.ceil(rushLeft) !== Math.ceil(rushLeft + dt)) Curio.beep(880, 0.04, 'square', 0.04);
      }
    }
    t0 = now;
    renderTime();
  }
  setInterval(tick, 250);
  document.addEventListener('visibilitychange', () => { t0 = performance.now(); });

  let press = null, lastType = 'mouse';
  const cellOf = (e) => { const g = e.target.closest('[data-i]'); return g ? +g.dataset.i : -1; };
  svg.addEventListener('pointerdown', (e) => {
    lastType = e.pointerType;
    const i = cellOf(e); if (i < 0) return;
    if (e.button === 2) return;
    press = { i, id: e.pointerId, long: false, timer: setTimeout(() => { if (press) { press.long = true; toggleLock(press.i); } }, 480) };
  });
  const cancel = () => { if (press) clearTimeout(press.timer); press = null; };
  svg.addEventListener('pointerup', (e) => {
    if (!press || e.pointerId !== press.id) return;
    const p = press; cancel();
    if (p.long) return;
    const i = cellOf(e); if (i !== p.i) return;
    cur = i;
    if (lockMode) toggleLock(i); else turn(i, revMode ? -1 : 1);
  });
  svg.addEventListener('pointercancel', cancel);
  svg.addEventListener('pointerleave', cancel);
  svg.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (lastType !== 'mouse') return;
    const i = cellOf(e); if (i < 0) return;
    cur = i;
    if (e.shiftKey || lockMode) toggleLock(i); else turn(i, -1);
  });
  svg.addEventListener('keydown', (e) => {
    if (document.querySelector('.curio-modal') || e.metaKey || e.altKey || e.ctrlKey) return;
    const mv = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key];
    if (mv) { e.preventDefault(); cur = ((Math.floor(cur / n) + mv[1] + n) % n) * n + (cur % n + mv[0] + n) % n; render(); return; }
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); turn(cur, e.shiftKey ? -1 : 1); return; }
    if (e.key === 'q' || e.key === 'Q') turn(cur, -1);
    if (e.key === 'l' || e.key === 'L') toggleLock(cur);
  });
  addEventListener('keydown', (e) => {
    if (document.querySelector('.curio-modal') || e.metaKey || e.altKey) return;
    if (e.target.closest?.('input, select, textarea')) return;
    if ((e.key === 'z' || e.key === 'Z') && !e.shiftKey) { e.preventDefault(); undo(); }
    if ((e.key === 'h' || e.key === 'H') && !e.ctrlKey) hint();
  });
  $('revMode').addEventListener('click', () => { revMode = !revMode; msg(revMode ? 'Taps now turn tiles anticlockwise.' : 'Taps turn tiles clockwise again.'); render(); });
  $('undo').addEventListener('click', undo);
  $('hint').addEventListener('click', hint);
  $('lockMode').addEventListener('click', () => { lockMode = !lockMode; msg(lockMode ? 'Lock mode: taps now pin tiles instead of turning them.' : 'Back to turning tiles.'); render(); });
  $('new').addEventListener('click', async () => {
    if (status === 'playing' && moves > 5 && mode === 'free') {
      const v = await Curio.modal({ emoji: '🔧', title: 'Start a new puzzle?', body: 'This one is not finished yet.', buttons: [{ label: 'New puzzle', value: 'y' }, { label: 'Keep going', value: 'n' }] });
      if (v !== 'y') return;
    }
    if (mode === 'rush') { rushCount = 0; rushLeft = 0; newGame({ fresh: true }); return; }
    newGame();
  });
  $('mWall').addEventListener('click', () => { freeWrap = false; newGame(); });
  $('mWrap').addEventListener('click', () => { freeWrap = true; newGame(); });
  document.querySelectorAll('#modes [data-mode]').forEach((b) => b.addEventListener('click', () => { setMode(b.dataset.mode); rushCount = 0; rushLeft = 0; newGame({ fresh: true }); }));
  document.querySelectorAll('[data-theme-pick]').forEach((b) => b.addEventListener('click', () => {
    S.theme = b.dataset.themePick; save(); paintTheme();
    const keep = { status };
    build(); render();
    if (keep.status === 'won') svg.classList.add('solved');
    Curio.beep(660, 0.05, 'triangle', 0.06);
  }));

  paintTheme();
  setMode(mode);
  if (SIMPLE) { $('freeOpts').hidden = true; $('campOpts').hidden = true; }
  newGame({ fresh: true });
  paintProgress();
  window.__pipes = { engine: Pipes, get base() { return base; }, get rots() { return rots; }, get src() { return src; }, get status() { return status; }, turn, newGame, get n() { return n; }, setMode, setLevel: (L) => { level = L; }, solveAll: () => { for (let i = 0; i < n * n; i++) { let r = 0; while (Pipes.rot(base[i], rots[i] + r) !== base[i]) r++; for (let k = 0; k < r; k++) turn(i, 1); } }, get rush() { return { rushLeft, rushCount }; } };
})();
