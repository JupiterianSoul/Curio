(() => {
  const E = window.C4;
  const $ = (id) => document.getElementById(id);
  const app = $('app');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SAVE = 'c4v2';

  const OPPS = [
    { id: 'easy', name: 'Pip', sub: 'Still learning which way is up', tag: 'Easy', body: '#7ccf8a', shape: 'round' },
    { id: 'medium', name: 'Gizmo', sub: 'Plans four moves ahead, on a good day', tag: 'Medium', body: '#64b5f6', shape: 'square' },
    { id: 'hard', name: 'Vega', sub: 'Reads nine moves deep and rarely blinks', tag: 'Hard', body: '#ba68c8', shape: 'tall' },
    { id: 'expert', name: 'Oracle', sub: 'Thinks as hard as it can. Good luck', tag: 'Expert', body: '#ff8a65', shape: 'dome' },
    { id: 'pvp', name: 'A friend', sub: 'Pass and play on one screen', tag: '2 players', body: '#ffd54f', shape: 'human' }
  ];
  const VARIANTS = [
    { id: 'classic', name: 'Classic', sub: '7 by 6, four in a row wins', w: 7, h: 6, n: 4 },
    { id: 'pop', name: 'Pop Out', sub: 'You may pop your own disc out of the bottom', w: 7, h: 6, n: 4, pop: true },
    { id: 'five', name: 'Five in a Row', sub: '9 by 6, edges pre-filled, connect five', w: 9, h: 6, n: 5, locked: [0, 8] },
    { id: 'big', name: 'Big Board', sub: '8 by 7, more room to scheme', w: 8, h: 7, n: 4 }
  ];
  const SKINS = [
    { id: 'classic', name: 'Classic', p1: '#e53935', p2: '#fdd835', bd: '#1e5bd8', n1: 'Red', n2: 'Yellow' },
    { id: 'reef', name: 'Reef', p1: '#ff7a59', p2: '#2ec4b6', bd: '#0b4f7c', n1: 'Coral', n2: 'Teal' },
    { id: 'candy', name: 'Candy', p1: '#ff5fa2', p2: '#7ee8c4', bd: '#7c4dff', n1: 'Pink', n2: 'Mint' },
    { id: 'forest', name: 'Forest', p1: '#f28c28', p2: '#f6efd9', bd: '#2d6a4f', n1: 'Orange', n2: 'Cream' },
    { id: 'night', name: 'Midnight', p1: '#c084fc', p2: '#fbbf24', bd: '#232a4d', n1: 'Violet', n2: 'Gold' },
    { id: 'ink', name: 'Ink', p1: '#2b2b2b', p2: '#f2f2f2', bd: '#c0392b', n1: 'Black', n2: 'White' }
  ];
  const BADGES = [
    { id: 'first', e: '🎉', t: 'First Four', d: 'Win any game against a robot' },
    { id: 'easy', e: '🌱', t: 'Pip Popped', d: 'Beat Pip' },
    { id: 'medium', e: '⚙️', t: 'Gizmo Jammed', d: 'Beat Gizmo' },
    { id: 'hard', e: '🔮', t: 'Vega Vanquished', d: 'Beat Vega' },
    { id: 'expert', e: '🧠', t: 'Oracle Outplayed', d: 'Beat Oracle' },
    { id: 'quick', e: '⚡', t: 'Speedrun', d: 'Win using 7 or fewer of your discs' },
    { id: 'diag', e: '↗️', t: 'Slantwise', d: 'Win with a diagonal line' },
    { id: 'long', e: '📏', t: 'Overachiever', d: 'Make a line longer than you needed' },
    { id: 'pop', e: '🫧', t: 'Pop Star', d: 'Win a Pop Out game' },
    { id: 'five', e: '🖐️', t: 'High Five', d: 'Win Five in a Row' },
    { id: 'big', e: '🗺️', t: 'Big Board Boss', d: 'Win on the Big Board' },
    { id: 'daily', e: '📅', t: 'Daily Dropper', d: 'Win a daily challenge' },
    { id: 'streak', e: '🔥', t: 'Hat Trick', d: 'Win 3 games in a row against robots' },
    { id: 'clock', e: '⏱️', t: 'Beat the Clock', d: 'Win with the shot clock on' },
    { id: 'pure', e: '💎', t: 'No Takebacks', d: 'Beat Vega or Oracle with no undo or hint' },
    { id: 'draw', e: '🤝', t: 'Stalemate Artist', d: 'Fill the board without a winner' },
    { id: 'comeback', e: '🛡️', t: 'Second Mover', d: 'Beat Vega or Oracle when they went first' },
    { id: 'ten', e: '🏅', t: 'Regular', d: 'Finish 10 games' },
    { id: 'fifty', e: '🏆', t: 'Disc Jockey', d: 'Finish 50 games' },
    { id: 'skins', e: '🎨', t: 'Fashionista', d: 'Play with 4 different colour sets' }
  ];

  const DEF = { v: 2, opp: 'medium', variant: 'classic', skin: 'classic', clock: false, first: 'alt', rec: {}, badges: {}, hist: [], total: 0, streak: 0, bestStreak: 0, daily: {}, fastest: {}, skinsUsed: [] };
  function load() {
    const s = Curio.store.get(SAVE, null);
    const out = JSON.parse(JSON.stringify(DEF));
    if (s && typeof s === 'object' && s.v === 2) {
      for (const k of Object.keys(DEF)) if (s[k] != null && typeof s[k] === typeof DEF[k] && Array.isArray(s[k]) === Array.isArray(DEF[k])) out[k] = s[k];
    } else {
      const old = Curio.store.get('c4:mode', null);
      if (old && OPPS.some((o) => o.id === (old === 'pvp' ? 'pvp' : old))) out.opp = old;
    }
    if (!OPPS.some((o) => o.id === out.opp)) out.opp = 'medium';
    if (!VARIANTS.some((o) => o.id === out.variant)) out.variant = 'classic';
    if (!SKINS.some((o) => o.id === out.skin)) out.skin = 'classic';
    return out;
  }
  const S = load();
  const save = () => Curio.store.set(SAVE, S);

  let noiseBuf = null;
  const sfx = {
    ac() { if (Curio.muted) return null; return Curio.audioContext(); },
    tone(f, d = 0.1, type = 'sine', v = 0.1, f2 = 0, delay = 0) {
      const ac = this.ac(); if (!ac) return;
      const t = ac.currentTime + delay;
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d + 0.03);
    },
    noise(d = 0.06, v = 0.1, freq = 1800, delay = 0, q = 1.2) {
      const ac = this.ac(); if (!ac) return;
      if (!noiseBuf) { noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate); const ch = noiseBuf.getChannelData(0); for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1; }
      const t = ac.currentTime + delay;
      const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
      src.buffer = noiseBuf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
      g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      src.connect(f).connect(g).connect(ac.destination); src.start(t, Math.random() * 0.3); src.stop(t + d + 0.02);
    },
    clack(power = 1, pitch = 1) { this.noise(0.07, 0.16 * power, 2200 * pitch, 0, 1.4); this.tone(150 * pitch, 0.09, 'triangle', 0.12 * power, 90); },
    tick() { this.tone(1300, 0.018, 'square', 0.025); },
    win() { [523, 659, 784, 1046, 1318].forEach((f, k) => this.tone(f, 0.18, 'triangle', 0.12, 0, k * 0.09)); },
    lose() { [392, 330, 262, 196].forEach((f, k) => this.tone(f, 0.22, 'sawtooth', 0.05, 0, k * 0.13)); },
    draw() { this.tone(440, 0.2, 'sine', 0.1); this.tone(440, 0.25, 'sine', 0.08, 0, 0.18); },
    badge() { [880, 1175, 1568].forEach((f, k) => this.tone(f, 0.14, 'sine', 0.09, 0, k * 0.07)); },
    plop() { this.tone(620, 0.16, 'sine', 0.14, 180); }
  };
  const buzz = (p) => { try { if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return; navigator.vibrate?.(p); } catch {} };

  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (h, to, t) => { const a = hex(h), b = to === 'w' ? [255, 255, 255] : [0, 0, 0]; return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')})`; };

  function applySkin() {
    const k = SKINS.find((x) => x.id === S.skin) || SKINS[0];
    const st = app.style;
    st.setProperty('--p1', k.p1); st.setProperty('--p1-hi', mix(k.p1, 'w', 0.45)); st.setProperty('--p1-lo', mix(k.p1, 'b', 0.45));
    st.setProperty('--p2', k.p2); st.setProperty('--p2-hi', mix(k.p2, 'w', 0.5)); st.setProperty('--p2-lo', mix(k.p2, 'b', 0.4));
    st.setProperty('--bd', k.bd); st.setProperty('--bd-hi', mix(k.bd, 'w', 0.3)); st.setProperty('--bd-lo', mix(k.bd, 'b', 0.45));
  }
  const skin = () => SKINS.find((x) => x.id === S.skin) || SKINS[0];

  function avatar(o, color) {
    if (o.shape === 'human') {
      const c = color || 'var(--p1)';
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="22" fill="${c}"/><circle cx="24" cy="24" r="22" fill="url(#none)" stroke="rgba(0,0,0,.2)" stroke-width="2"/><circle cx="17" cy="21" r="3" fill="#2a2018"/><circle cx="31" cy="21" r="3" fill="#2a2018"/><circle cx="18" cy="20" r="1" fill="#fff"/><circle cx="32" cy="20" r="1" fill="#fff"/><path d="M15 29 Q24 37 33 29" stroke="#2a2018" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="12" cy="28" r="3" fill="rgba(255,255,255,.35)"/><circle cx="36" cy="28" r="3" fill="rgba(255,255,255,.35)"/></svg>`;
    }
    const b = o.body, dk = mix(b, 'b', 0.35), lt = mix(b, 'w', 0.4);
    let head;
    if (o.shape === 'round') head = `<circle cx="24" cy="26" r="17" fill="${b}"/><circle cx="24" cy="26" r="17" fill="none" stroke="${dk}" stroke-width="2"/>`;
    else if (o.shape === 'square') head = `<rect x="7" y="11" width="34" height="30" rx="7" fill="${b}" stroke="${dk}" stroke-width="2"/><rect x="3" y="20" width="5" height="12" rx="2" fill="${dk}"/><rect x="40" y="20" width="5" height="12" rx="2" fill="${dk}"/>`;
    else if (o.shape === 'tall') head = `<path d="M12 42 L10 14 Q24 4 38 14 L36 42 Z" fill="${b}" stroke="${dk}" stroke-width="2" stroke-linejoin="round"/>`;
    else head = `<path d="M6 40 Q6 12 24 10 Q42 12 42 40 Z" fill="${b}" stroke="${dk}" stroke-width="2"/><path d="M12 22 Q24 14 36 22" stroke="${lt}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    const ant = o.shape === 'dome' ? `<path d="M24 10 V3" stroke="${dk}" stroke-width="2"/><circle cx="24" cy="3" r="2.5" fill="#ffeb3b"/>` : o.shape === 'tall' ? `<path d="M17 9 L13 2 M31 9 L35 2" stroke="${dk}" stroke-width="2"/><circle cx="13" cy="2" r="2" fill="#ff5252"/><circle cx="35" cy="2" r="2" fill="#ff5252"/>` : `<path d="M24 10 V4" stroke="${dk}" stroke-width="2"/><circle cx="24" cy="4" r="2.5" fill="${lt}"/>`;
    const eyes = o.shape === 'tall' ? `<rect x="14" y="21" width="20" height="7" rx="3.5" fill="#1b1530"/><circle cx="19" cy="24.5" r="2" fill="#7df9ff"/><circle cx="29" cy="24.5" r="2" fill="#7df9ff"/>` : `<circle cx="17" cy="25" r="5" fill="#fff"/><circle cx="31" cy="25" r="5" fill="#fff"/><circle cx="18" cy="26" r="2.5" fill="#1b1530"/><circle cx="32" cy="26" r="2.5" fill="#1b1530"/>`;
    const mouth = o.shape === 'round' ? `<path d="M19 34 Q24 38 29 34" stroke="#1b1530" stroke-width="2" fill="none" stroke-linecap="round"/>` : o.shape === 'dome' ? `<rect x="16" y="32" width="16" height="4" rx="2" fill="#1b1530"/><path d="M20 32 v4 M24 32 v4 M28 32 v4" stroke="${b}" stroke-width="1"/>` : `<path d="M18 35 H30" stroke="#1b1530" stroke-width="2.5" stroke-linecap="round"/>`;
    return `<svg viewBox="0 0 48 48" aria-hidden="true">${ant}${head}${eyes}${mouth}</svg>`;
  }

  const variant = () => VARIANTS.find((v) => v.id === S.variant) || VARIANTS[0];
  const opp = () => OPPS.find((o) => o.id === S.opp) || OPPS[1];
  const vsAI = () => opp().id !== 'pvp';

  function variantIcon(v) {
    const W = v.w, H = v.h, cs = 100 / Math.max(W, H * 1.3);
    let s = `<svg class="vic" viewBox="0 0 ${W * cs + 6} ${H * cs + 6}" aria-hidden="true"><rect width="${W * cs + 6}" height="${H * cs + 6}" rx="5" fill="var(--bd)"/>`;
    const fill = { classic: [[3, 0, 1], [2, 0, 2], [3, 1, 2], [4, 0, 1], [4, 1, 1]], pop: [[3, 0, 1], [3, 1, 2], [3, 2, 1], [2, 0, 2]], five: [], big: [[4, 0, 1], [3, 0, 2], [4, 1, 2], [5, 0, 1]] }[v.id];
    const map = {};
    if (v.locked) for (const c of v.locked) for (let r = 0; r < H; r++) map[`${c},${r}`] = ((r + (c === 0 ? 0 : 1)) % 2) + 1;
    if (v.id === 'five') [[4, 0, 1], [5, 0, 2], [4, 1, 1]].forEach(([c, r, p]) => { map[`${c},${r}`] = p; });
    for (const [c, r, p] of fill) map[`${c},${r}`] = p;
    for (let c = 0; c < W; c++) for (let r = 0; r < H; r++) {
      const p = map[`${c},${r}`];
      s += `<circle cx="${3 + c * cs + cs / 2}" cy="${3 + (H - 1 - r) * cs + cs / 2}" r="${cs * 0.36}" fill="${p ? `var(--p${p})` : 'var(--bg)'}"/>`;
    }
    if (v.pop) s += `<path d="M${3 + 3 * cs + cs / 2} ${H * cs + 2} v-${cs * 0.6}" stroke="#fff" stroke-width="2" opacity=".9"/>`;
    return s + '</svg>';
  }

  function buildHero() {
    const svg = $('hero');
    const W = 7, H = 4, cs = 38, ox = 320 - (W * cs) / 2, oy = 52;
    let s = `<defs><linearGradient id="hb" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" style="stop-color:var(--bd-hi)"/><stop offset="1" style="stop-color:var(--bd)"/></linearGradient><mask id="hm"><rect x="0" y="0" width="640" height="220" fill="#fff"/>`;
    for (let c = 0; c < W; c++) for (let r = 0; r < H; r++) s += `<circle cx="${ox + c * cs + cs / 2}" cy="${oy + r * cs + cs / 2}" r="${cs * 0.37}" fill="#000"/>`;
    s += `</mask><radialGradient id="hd1" cx=".35" cy=".3"><stop offset="0" style="stop-color:var(--p1-hi)"/><stop offset=".5" style="stop-color:var(--p1)"/><stop offset="1" style="stop-color:var(--p1-lo)"/></radialGradient><radialGradient id="hd2" cx=".35" cy=".3"><stop offset="0" style="stop-color:var(--p2-hi)"/><stop offset=".5" style="stop-color:var(--p2)"/><stop offset="1" style="stop-color:var(--p2-lo)"/></radialGradient></defs>`;
    s += `<rect x="${ox - 4}" y="${oy}" width="${W * cs + 8}" height="${H * cs}" fill="rgba(0,0,0,.18)"/>`;
    const seq = [[3, 1], [2, 2], [3, 1], [4, 2], [4, 1], [2, 2], [5, 1], [1, 2], [6, 1], [3, 2], [0, 1]];
    const hts = Array(W).fill(0);
    seq.forEach(([c, p], i) => {
      const r = H - 1 - hts[c]++;
      if (r < 0) return;
      s += `<g class="hero-disc" style="animation-delay:${(i * 0.18).toFixed(2)}s"><circle cx="${ox + c * cs + cs / 2}" cy="${oy + r * cs + cs / 2}" r="${cs * 0.42}" fill="url(#hd${p})"/><circle cx="${ox + c * cs + cs / 2}" cy="${oy + r * cs + cs / 2}" r="${cs * 0.26}" fill="none" stroke="rgba(0,0,0,.15)" stroke-width="2"/></g>`;
    });
    s += `<rect x="${ox - 14}" y="${oy - 12}" width="${W * cs + 28}" height="${H * cs + 24}" rx="16" fill="url(#hb)" mask="url(#hm)"/>`;
    s += `<rect x="${ox - 30}" y="${oy + H * cs + 10}" width="${W * cs + 60}" height="14" rx="7" style="fill:var(--bd-lo)"/>`;
    const floats = [[70, 60, 1, 26], [130, 150, 2, 18], [540, 70, 2, 24], [585, 160, 1, 16], [40, 170, 2, 12], [600, 30, 1, 12]];
    floats.forEach(([x, y, p, r], i) => {
      s += `<g class="hero-float" style="animation-delay:${i * 0.4}s"><circle cx="${x}" cy="${y}" r="${r}" fill="url(#hd${p})"/><circle cx="${x}" cy="${y}" r="${r * 0.6}" fill="none" stroke="rgba(0,0,0,.15)" stroke-width="2"/></g>`;
    });
    const o = opp();
    s += `<g class="hero-float" style="animation-delay:.8s" transform="translate(470 106) scale(1.6)">${avatar(o).replace('<svg viewBox="0 0 48 48" aria-hidden="true">', '').replace('</svg>', '')}</g>`;
    s += `<g transform="translate(118 96) scale(1.25)">${avatar(OPPS[4], 'var(--p1)').replace('<svg viewBox="0 0 48 48" aria-hidden="true">', '').replace('</svg>', '')}</g>`;
    svg.innerHTML = s;
  }

  const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  function rng(seed) {
    let h = 1779033703 ^ seed.length;
    for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    let a = h >>> 0;
    return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function dailyOpening(key) {
    for (let attempt = 0; attempt < 50; attempt++) {
      const r = rng(`${key}#${attempt}`);
      const g = E.create(VARIANTS[0]);
      const seq = [];
      let ok = true;
      for (let k = 0; k < 6; k++) {
        const p = (k % 2) + 1;
        const cols = E.legal(g, p);
        const c = cols[Math.floor(r() * Math.min(cols.length, 5))];
        const t = E.doMove(g, c, p);
        if (E.winnerAfter(g, c, p, t)) { ok = false; break; }
        seq.push({ m: c, p });
      }
      if (!ok) continue;
      let threat = false;
      for (const p of [1, 2]) for (const c of E.legal(g, p)) { const t = E.doMove(g, c, p); if (E.winnerAfter(g, c, p, t)) threat = true; E.undoMove(g, c, t); }
      if (!threat) return seq;
    }
    return [{ m: 3, p: 1 }, { m: 3, p: 2 }];
  }

  let worker = null, wid = 0;
  const pending = new Map();
  function makeWorker() {
    try {
      const src = `const E=(${window.c4Engine.toString()})();onmessage=(e)=>{const d=e.data;postMessage({id:d.id,r:E.aiMove(E.revive(d.g),d.p,d.level,{budget:d.budget})});};`;
      worker = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
      worker.onmessage = (e) => { const f = pending.get(e.data.id); pending.delete(e.data.id); if (f) f(e.data.r); };
      worker.onerror = () => { worker = null; for (const [id, f] of pending) { pending.delete(id); f(null); } };
    } catch { worker = null; }
  }
  makeWorker();
  function think(p, level, budget) {
    const snap = E.clone(g);
    return new Promise((res) => {
      const fallback = () => setTimeout(() => res(E.aiMove(snap, p, level, { budget: Math.min(budget || 9999, 650) })), 30);
      if (!worker) { fallback(); return; }
      const id = ++wid;
      pending.set(id, (r) => (r ? res(r) : fallback()));
      worker.postMessage({ id, g: E.pack(snap), p, level, budget });
    });
  }

  const stage = $('stage'), board = $('board'), discsEl = $('discs'), front = $('front'), fx = $('fx'), colsEl = $('cols'), ghost = $('ghost'), statusEl = $('status'), shell = $('shell'), popsEl = $('pops'), resultEl = $('result'), hintArrow = $('hint-arrow');
  let g, turn, over = true, busy = false, moves = [], fixed = 0, colEls = [], sel = 3, round = 0, starter = 1, nextStarter = 1, daily = false;
  let usedUndo = false, usedHint = false, t0 = 0, clockTimer = 0, clockLeft = 0, session = { 1: 0, 2: 0, 0: 0 }, sessionKey = '', lastWin = null, replaying = false;

  const W = () => g.W, H = () => g.H;
  const humanSide = (p) => !vsAI() || p === 1;
  const humanTurn = () => !over && !busy && !replaying && humanSide(turn);
  const nameOf = (p) => (vsAI() ? (p === 1 ? 'You' : opp().name) : p === 1 ? skin().n1 : skin().n2);

  function buildFront() {
    const w = W(), h = H(), M = 40;
    stage.style.setProperty('--W', w); stage.style.setProperty('--H', h);
    front.setAttribute('viewBox', `${-M} ${-M} ${w * 100 + 2 * M} ${h * 100 + 2 * M}`);
    front.setAttribute('preserveAspectRatio', 'none');
    fx.setAttribute('viewBox', `0 0 ${w * 100} ${h * 100}`);
    fx.setAttribute('preserveAspectRatio', 'none');
    let holes = '', rims = '', bolts = '';
    for (let c = 0; c < w; c++) for (let r = 0; r < h; r++) {
      const x = c * 100 + 50, y = r * 100 + 50;
      holes += `<circle cx="${x}" cy="${y}" r="38" fill="#000"/>`;
      rims += `<circle cx="${x}" cy="${y}" r="39.5" fill="none" stroke="url(#c4rim)" stroke-width="5"/>`;
    }
    for (const [x, y] of [[-20, -20], [w * 100 + 20, -20], [-20, h * 100 + 20], [w * 100 + 20, h * 100 + 20]]) bolts += `<circle cx="${x}" cy="${y}" r="7" fill="url(#c4bolt)"/><path d="M${x - 4} ${y} h8" stroke="rgba(0,0,0,.35)" stroke-width="2"/>`;
    front.innerHTML = `<defs>
      <linearGradient id="c4bd" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" style="stop-color:var(--bd-hi)"/><stop offset=".45" style="stop-color:var(--bd)"/><stop offset="1" style="stop-color:var(--bd)"/></linearGradient>
      <linearGradient id="c4sheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset=".7" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".08"/></linearGradient>
      <linearGradient id="c4rim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset=".55" stop-color="#000" stop-opacity=".05"/><stop offset="1" stop-color="#fff" stop-opacity=".35"/></linearGradient>
      <radialGradient id="c4bolt" cx=".35" cy=".35"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" style="stop-color:var(--bd-lo)"/></radialGradient>
      <mask id="c4holes"><rect x="${-M}" y="${-M}" width="${w * 100 + 2 * M}" height="${h * 100 + 2 * M}" fill="#fff"/>${holes}</mask>
    </defs>
    <g mask="url(#c4holes)">
      <rect x="${-M}" y="${-M}" width="${w * 100 + 2 * M}" height="${h * 100 + 2 * M}" rx="36" fill="url(#c4bd)"/>
      <rect x="${-M}" y="${-M}" width="${w * 100 + 2 * M}" height="${h * 100 + 2 * M}" rx="36" fill="url(#c4sheen)"/>
      <rect x="${-M + 4}" y="${-M + 4}" width="${w * 100 + 2 * M - 8}" height="${h * 100 + 2 * M - 8}" rx="32" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="3"/>
    </g>${rims}${bolts}`;
    colsEl.replaceChildren();
    for (let c = 0; c < w; c++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', `Drop in column ${c + 1}`);
      b.addEventListener('click', () => humanMove(c));
      b.addEventListener('pointerenter', () => aim(c));
      b.addEventListener('focus', () => aim(c));
      colsEl.append(b);
    }
    popsEl.replaceChildren();
    for (let c = 0; c < w; c++) {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = 'POP';
      b.setAttribute('aria-label', `Pop out the bottom disc of column ${c + 1}`);
      b.addEventListener('click', () => humanMove(w + c));
      popsEl.append(b);
    }
    popsEl.hidden = !g.pop;
  }

  function aim(c) {
    if (c === sel) return;
    sel = Math.max(0, Math.min(W() - 1, c));
    if (humanTurn()) sfx.tick();
    paintGhost();
  }

  function makeDisc(c, r, p, locked) {
    const d = document.createElement('div');
    d.className = `disc p${p}${locked ? ' locked' : ''}`;
    d.innerHTML = '<i></i>';
    place(d, c, r);
    discsEl.append(d);
    return d;
  }
  function place(d, c, r) {
    d.style.left = `${(c * 100) / W()}%`;
    d.style.top = `${((H() - 1 - r) * 100) / H()}%`;
    d.dataset.c = c; d.dataset.r = r;
  }

  function rebuildDiscs() {
    discsEl.replaceChildren(); discsEl.classList.remove('done'); fx.replaceChildren();
    colEls = [];
    for (let c = 0; c < W(); c++) {
      colEls.push([]);
      for (let r = 0; r < g.heights[c]; r++) colEls[c].push(makeDisc(c, r, g.cells[c * H() + r], g.locked.includes(c)));
    }
  }

  function fall(el, from, bounceSound = true) {
    return new Promise((res) => {
      if (reduce) { el.style.transform = ''; res(); return; }
      let y = -from, v = 0, bounces = 0, last = performance.now();
      const G = 75;
      el.style.transform = `translateY(${y * 100}%)`;
      const tick = (t) => {
        const dt = Math.min(0.034, (t - last) / 1000); last = t;
        v += G * dt; y += v * dt;
        if (y >= 0) {
          y = 0;
          if (bounceSound) {
            if (bounces === 0) impact(el, Math.min(1, v / 28));
            else if (v > 6) sfx.clack(0.3, 1.3);
          }
          if (v < 6 || bounces >= 2) { el.style.transform = ''; res(); return; }
          v = -v * 0.3; bounces++;
        }
        el.style.transform = `translateY(${y * 100}%)`;
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  function impact(el, power) {
    const r = +el.dataset.r;
    sfx.clack(0.5 + power * 0.6, 0.85 + r * 0.06);
    buzz(12);
    shell.classList.remove('shake'); void shell.offsetWidth; shell.classList.add('shake');
    const c = +el.dataset.c;
    const cx = c * 100 + 50, cy = (H() - 1 - r) * 100 + 92;
    for (let k = 0; k < 6; k++) {
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      const ang = Math.PI + (k / 5) * Math.PI;
      p.setAttribute('cx', cx); p.setAttribute('cy', cy); p.setAttribute('r', 4);
      p.setAttribute('fill', 'rgba(255,255,255,.8)');
      fx.append(p);
      p.animate([{ transform: 'translate(0,0)', opacity: 0.9 }, { transform: `translate(${Math.cos(ang) * 36}px, ${Math.sin(ang) * 18 - 6}px)`, opacity: 0 }], { duration: 420, easing: 'ease-out' }).onfinish = () => p.remove();
    }
  }

  function paintGhost() {
    const ht = humanTurn();
    ghost.className = `disc ghost p${turn}`;
    ghost.style.transform = `translateX(${sel * 100}%)`;
    ghost.style.opacity = ht && E.canDrop(g, sel) ? '1' : '0';
    hintArrow.style.transform = '';
    [...colsEl.children].forEach((b, c) => { b.classList.toggle('sel', c === sel); b.disabled = !ht || !E.canDrop(g, c); });
    if (g.pop) [...popsEl.children].forEach((b, c) => { b.className = `p${turn}${ht && E.canPop(g, c, turn) ? ' on' : ''}`; b.disabled = !(ht && E.canPop(g, c, turn)); });
    $('chip-1').classList.toggle('turn', !over && turn === 1);
    $('chip-2').classList.toggle('turn', !over && turn === 2);
    $('undo').disabled = busy || replaying || moves.length <= fixed || (vsAI() && !moves.slice(fixed).some((m) => m.p === 1));
    $('hint').disabled = !ht;
  }

  function setStatus(html) { statusEl.innerHTML = html; }
  function turnStatus() {
    if (over) return;
    const dot = `<i class="dot" style="background:var(--p${turn})"></i>`;
    if (vsAI() && turn === 2) setStatus(`${opp().name} is thinking<span class="think"><i></i><i></i><i></i></span>`);
    else if (vsAI()) setStatus(`Your move ${dot}${g.pop ? '<small class="c-muted"> drop or pop</small>' : ''}`);
    else setStatus(`${dot}${nameOf(turn)} to play`);
  }

  function paintHud() {
    const o = opp();
    $('ava-1').innerHTML = avatar(OPPS[4], 'var(--p1)');
    $('ava-2').innerHTML = vsAI() ? avatar(o) : avatar(OPPS[4], 'var(--p2)');
    $('name-1').textContent = vsAI() ? 'You' : skin().n1;
    $('name-2').textContent = vsAI() ? o.name : skin().n2;
    $('sub-1').textContent = vsAI() ? skin().n1 : 'Player 1';
    $('sub-2').textContent = vsAI() ? `${o.tag} · ${skin().n2}` : 'Player 2';
    $('variant-tag').textContent = daily ? `Daily ${todayKey().slice(5)}` : variant().name;
    $('score-1').textContent = session[1]; $('score-2').textContent = session[2];
    $('draws').textContent = `${session[0]} draw${session[0] === 1 ? '' : 's'}`;
  }

  function stopClock() { clearInterval(clockTimer); clockTimer = 0; document.querySelectorAll('.pchip').forEach((c) => c.classList.remove('clock', 'low')); }
  function startClock() {
    stopClock();
    if (!S.clock || over || !humanSide(turn)) return;
    const chip = $(`chip-${turn}`);
    clockLeft = 8000;
    const r0 = round, p0 = turn, n0 = moves.length;
    chip.classList.add('clock');
    chip.style.setProperty('--t', 1);
    let lastSec = 9;
    clockTimer = setInterval(() => {
      if (r0 !== round || over || moves.length !== n0 || turn !== p0) { stopClock(); return; }
      if (busy || document.hidden) return;
      clockLeft -= 100;
      chip.style.setProperty('--t', Math.max(0, clockLeft / 8000));
      const sec = Math.ceil(clockLeft / 1000);
      if (sec <= 3 && sec !== lastSec) { lastSec = sec; chip.classList.add('low'); sfx.tone(sec === 0 ? 300 : 880, 0.06, 'square', 0.05); }
      if (clockLeft <= 0) {
        stopClock();
        const opts = E.legal(g, turn).filter((m) => m < W());
        const m = opts.length ? Curio.pick(opts) : E.legal(g, turn)[0];
        Curio.toast('Too slow! The clock dropped one for you.');
        doPlay(m, turn).then(afterMove);
      }
    }, 100);
  }

  function newSessionKey() { return `${S.opp}|${S.variant}|${daily}`; }

  async function newGame(opts = {}) {
    round++;
    const r0 = round;
    stopClock();
    resultEl.hidden = true; resultEl.replaceChildren();
    hintArrow.classList.remove('on');
    daily = !!opts.daily;
    const key = newSessionKey();
    if (key !== sessionKey) { session = { 1: 0, 2: 0, 0: 0 }; sessionKey = key; nextStarter = S.first === 'ai' ? 2 : 1; }
    if (colEls.some((c) => c.length) && !opts.instant) { busy = true; paintGhost(); await releaseAll(); if (r0 !== round) return; }
    const v = daily ? VARIANTS[0] : variant();
    g = E.create(v);
    moves = []; fixed = 0; over = false; busy = false; usedUndo = false; usedHint = false; lastWin = null; replaying = false;
    sel = Math.floor(W() / 2);
    buildFront(); rebuildDiscs(); paintHud();
    if (daily) starter = 1;
    else if (!vsAI()) { starter = nextStarter; nextStarter = S.first === 'alt' ? 3 - nextStarter : nextStarter; }
    else if (S.first === 'you') starter = 1;
    else if (S.first === 'ai') starter = 2;
    else { starter = nextStarter; nextStarter = 3 - nextStarter; }
    turn = starter;
    t0 = Date.now();
    if (!S.skinsUsed.includes(S.skin)) { S.skinsUsed.push(S.skin); save(); }
    if (daily) {
      busy = true; paintGhost(); setStatus('Setting up today’s opening...');
      const seq = dailyOpening(todayKey());
      for (const mv of seq) {
        if (r0 !== round) return;
        await doPlay(mv.m, mv.p, true);
      }
      fixed = moves.length; turn = 1; busy = false;
    }
    turnStatus(); paintGhost();
    if (vsAI() && turn === 2) aiTurn(); else startClock();
  }

  async function releaseAll() {
    const all = [...discsEl.querySelectorAll('.disc')];
    fx.replaceChildren();
    discsEl.classList.remove('done');
    if (reduce || !all.length) { discsEl.replaceChildren(); return; }
    sfx.noise(0.25, 0.12, 900, 0, 0.8);
    const anims = all.map((d) => {
      const r = +d.dataset.r;
      const delay = (H() - r) * 25 + Math.random() * 90;
      setTimeout(() => sfx.clack(0.25, 0.9 + Math.random() * 0.6), delay + 260);
      return d.animate([{ transform: 'translateY(0) rotate(0)' }, { transform: `translateY(${(r + 3) * 100}%) rotate(${(Math.random() - 0.5) * 60}deg)`, opacity: 0 }], { duration: 520, delay, easing: 'cubic-bezier(.5,0,1,.6)', fill: 'forwards' }).finished.catch(() => {});
    });
    await Promise.all(anims);
    discsEl.replaceChildren();
  }

  async function doPlay(m, p, quick) {
    const r0 = round;
    hintArrow.classList.remove('on');
    const tok = E.doMove(g, m, p);
    moves.push({ m, p });
    busy = true; paintGhost();
    if (m < W()) {
      const c = m, r = tok;
      const d = makeDisc(c, r, p, false);
      colEls[c].push(d);
      if (quick) d.style.transform = `translateY(${-(H() - r + 0.1) * 100}%)`;
      await fall(d, H() - r + 0.1);
    } else {
      const c = m - W();
      const out = colEls[c].shift();
      sfx.plop(); buzz([8, 30, 8]);
      if (out && !reduce) {
        out.style.zIndex = 0;
        out.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(160%) scale(.9)', opacity: 0 }], { duration: 380, easing: 'cubic-bezier(.5,0,1,.5)' }).onfinish = () => out.remove();
      } else out?.remove();
      colEls[c].forEach((d, r) => place(d, c, r));
      await Promise.all(colEls[c].map((d, k) => new Promise((res) => setTimeout(() => fall(d, 1, k === 0).then(res), 60 + k * 18))));
    }
    if (r0 !== round) return { stale: true };
    busy = false;
    const w = E.winnerAfter(g, m, p, tok);
    return { w };
  }

  function afterMove(res) {
    if (!res || res.stale || over) return;
    const p = moves[moves.length - 1].p;
    if (res.w) { finish(res.w.p, res.w.cells); return; }
    const np = 3 - p;
    if ((!g.pop && E.isFull(g)) || (g.pop && moves.length >= 140) || !E.legal(g, np).length) { finish(0); return; }
    turn = np;
    turnStatus(); paintGhost();
    if (vsAI() && turn === 2) aiTurn(); else startClock();
  }

  async function humanMove(m) {
    if (!humanTurn()) return;
    if (m < W() ? !E.canDrop(g, m) : !E.canPop(g, m - W(), turn)) { sfx.tone(140, 0.12, 'square', 0.05); return; }
    stopClock();
    if (m < W()) sel = m;
    const res = await doPlay(m, turn);
    afterMove(res);
  }

  async function aiTurn() {
    busy = true;
    const r0 = round;
    $('chip-2').classList.add('thinking');
    turnStatus(); paintGhost();
    const start = performance.now();
    const res = await think(2, opp().id, null);
    const wait = Math.max(0, 520 - (performance.now() - start));
    await new Promise((r) => setTimeout(r, wait));
    $('chip-2').classList.remove('thinking');
    if (r0 !== round || over) return;
    let m = res && res.move >= 0 ? res.move : E.legal(g, 2)[0];
    if (m < W()) { sel = m; ghost.className = 'disc ghost p2'; ghost.style.transform = `translateX(${m * 100}%)`; }
    busy = false;
    const out = await doPlay(m, 2);
    afterMove(out);
  }

  function drawWinLine(cells) {
    const [a, b] = [cells[0], cells[cells.length - 1]];
    const x1 = a[0] * 100 + 50, y1 = (H() - 1 - a[1]) * 100 + 50, x2 = b[0] * 100 + 50, y2 = (H() - 1 - b[1]) * 100 + 50;
    const len = Math.hypot(x2 - x1, y2 - y1);
    fx.innerHTML = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="rgba(255,255,255,.55)" stroke-width="30" stroke-linecap="round" stroke-dasharray="${len}" stroke-dashoffset="${len}"><animate attributeName="stroke-dashoffset" from="${len}" to="0" dur=".5s" fill="freeze"/></line><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-dasharray="${len}" stroke-dashoffset="${len}"><animate attributeName="stroke-dashoffset" from="${len}" to="0" dur=".5s" fill="freeze"/></line>`;
  }

  function finish(winner, cells) {
    over = true; busy = false; stopClock();
    lastWin = { winner, cells };
    session[winner]++;
    const scoreEl = winner ? $(`score-${winner}`) : null;
    paintHud(); paintGhost();
    if (scoreEl) { scoreEl.classList.remove('bump'); void scoreEl.offsetWidth; scoreEl.classList.add('bump'); }
    if (winner) {
      discsEl.classList.add('done');
      const set = new Set(cells.map(([c, r]) => `${c},${r}`));
      discsEl.querySelectorAll('.disc').forEach((d) => d.classList.toggle('win', set.has(`${d.dataset.c},${d.dataset.r}`)));
      drawWinLine(cells);
    }
    const humanMoves = moves.slice(fixed).filter((m) => m.p === 1).length;
    const secs = Math.round((Date.now() - t0) / 1000);
    const o = opp();
    let outcome;
    if (!vsAI()) outcome = winner ? `p${winner}` : 'd';
    else outcome = winner === 1 ? 'w' : winner === 2 ? 'l' : 'd';
    const fresh = record(outcome, winner, cells, humanMoves);
    let emoji, title, line;
    if (outcome === 'w') {
      emoji = Curio.pick(['🏆', '🎉', '🥳']);
      title = Curio.pick(['Four in a row!', 'Connected!', 'You win!', 'Clunk. Victory.']);
      line = Curio.pick([`${o.name} is rebooting in shame.`, `${o.name} demands a rematch.`, `That one is going on the fridge.`, `${o.name} did not see that coming.`]);
      Curio.confetti(); sfx.win(); buzz([30, 40, 60]);
    } else if (outcome === 'l') {
      emoji = '🤖';
      title = Curio.pick([`${o.name} connects four`, 'Outfoxed by arithmetic', 'The robot wins this round']);
      line = Curio.pick(['Rematch? It will not get smug. Probably.', 'Try blocking earlier next time.', 'Watch the diagonals, they sneak up on you.']);
      sfx.lose(); buzz(80);
    } else if (outcome === 'd') {
      emoji = '🤝'; title = 'A full board draw'; line = 'Nobody blinked. Remarkable.'; sfx.draw();
    } else {
      emoji = '🏆'; title = `${nameOf(winner)} wins!`; line = `${nameOf(3 - winner)} wants a rematch, surely.`;
      Curio.confetti(); sfx.win();
    }
    if (outcome === 'w' && humanMoves) {
      const b = Curio.best(`fastest-${S.variant}-${o.id}`, humanMoves, false);
      if (b.isNew) line += ' Your fastest win yet!';
    }
    const stats = [[humanMoves || Math.ceil(moves.length / 2), vsAI() ? 'Your discs' : 'Moves each'], [`${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`, 'Time'], [vsAI() ? S.streak : `${session[1]}-${session[2]}`, vsAI() ? 'Win streak' : 'Session']];
    resultEl.innerHTML = `<div class="big" aria-hidden="true">${emoji}</div><h3></h3><p></p>${fresh.length ? `<div class="newb">${fresh.map((b) => `<span>${b.e} ${b.t}</span>`).join('')}</div>` : ''}<div class="rstats">${stats.map(([v, k]) => `<div><b>${v}</b><span>${k}</span></div>`).join('')}</div><div class="c-row"><button type="button" class="c-btn" data-a="again">${daily ? 'Free play' : 'Rematch'}</button><button type="button" class="c-btn c-btn--ghost" data-a="replay">Replay</button><button type="button" class="c-btn c-btn--ghost" data-a="share">Share</button><button type="button" class="c-btn c-btn--ghost" data-a="look">Look</button></div>`;
    resultEl.querySelector('h3').textContent = title;
    resultEl.querySelector('p').textContent = line;
    if (fresh.length) setTimeout(() => sfx.badge(), 700);
    setTimeout(() => {
      if (!over || replaying) return;
      resultEl.hidden = false;
      resultEl.querySelector('[data-a="again"]').focus({ preventScroll: true });
    }, winner ? 900 : 400);
    setStatus(winner ? `<i class="dot" style="background:var(--p${winner})"></i>${title}` : title);
  }

  function boardString() {
    const rows = [];
    for (let r = H() - 1; r >= 0; r--) {
      let s = '';
      for (let c = 0; c < W(); c++) { const v = g.cells[c * H() + r]; s += v === 1 ? '🔴' : v === 2 ? '🟡' : '⚪'; }
      rows.push(s);
    }
    return rows.join('\n');
  }

  function record(outcome, winner, cells, humanMoves) {
    S.total++;
    const o = opp();
    if (!daily) {
      const rk = `${o.id}`;
      const rec = (S.rec[rk] ||= { w: 0, l: 0, d: 0 });
      if (outcome === 'w') rec.w++; else if (outcome === 'l') rec.l++; else if (outcome === 'd') rec.d++;
    }
    if (vsAI()) {
      if (outcome === 'w') { S.streak++; S.bestStreak = Math.max(S.bestStreak, S.streak); } else if (outcome === 'l') S.streak = 0;
    }
    if (daily) {
      const k = todayKey();
      const prev = S.daily[k];
      if (!prev || (prev !== 'w' && outcome === 'w')) S.daily[k] = outcome;
    }
    const cellsStr = Array.from(g.cells).join('');
    S.hist.unshift({ t: Date.now(), o: o.id, v: daily ? 'daily' : S.variant, res: outcome, n: humanMoves, W: W(), H: H(), b: cellsStr, s: S.skin });
    S.hist = S.hist.slice(0, 12);
    const got = [];
    const give = (id) => { if (!S.badges[id]) { S.badges[id] = Date.now(); got.push(BADGES.find((b) => b.id === id)); } };
    const strong = o.id === 'hard' || o.id === 'expert';
    if (outcome === 'w') {
      give('first'); give(o.id);
      if (humanMoves <= 7) give('quick');
      if (cells && cells[0][0] !== cells[cells.length - 1][0] && cells[0][1] !== cells[cells.length - 1][1]) give('diag');
      if (cells && cells.length > g.N) give('long');
      if (!daily && S.variant === 'pop') give('pop');
      if (!daily && S.variant === 'five') give('five');
      if (!daily && S.variant === 'big') give('big');
      if (daily) give('daily');
      if (S.streak >= 3) give('streak');
      if (S.clock) give('clock');
      if (strong && !usedUndo && !usedHint) give('pure');
      if (strong && starter === 2) give('comeback');
    }
    if (outcome === 'd') give('draw');
    if (S.total >= 10) give('ten');
    if (S.total >= 50) give('fifty');
    if (S.skinsUsed.length >= 4) give('skins');
    save();
    paintBadgeCount();
    return got.filter(Boolean);
  }

  async function replay() {
    if (replaying || !moves.length) return;
    replaying = true; resultEl.hidden = true;
    const r0 = round;
    const list = moves.slice();
    const v = daily ? VARIANTS[0] : variant();
    setStatus('Replaying...');
    await releaseAll();
    g = E.create(v);
    rebuildDiscs();
    for (let i = 0; i < list.length; i++) {
      if (r0 !== round || !replaying) return;
      busy = false;
      const res = await doPlay(list[i].m, list[i].p, true);
      if (res.stale) return;
      moves.pop();
      await new Promise((r) => setTimeout(r, reduce ? 50 : 160));
    }
    moves = list;
    busy = false; replaying = false;
    if (lastWin && lastWin.winner) {
      discsEl.classList.add('done');
      const set = new Set(lastWin.cells.map(([c, r]) => `${c},${r}`));
      discsEl.querySelectorAll('.disc').forEach((d) => d.classList.toggle('win', set.has(`${d.dataset.c},${d.dataset.r}`)));
      drawWinLine(lastWin.cells);
      sfx.win();
    }
    paintGhost();
    setTimeout(() => { if (over && r0 === round) resultEl.hidden = false; }, 700);
  }

  async function share() {
    const o = opp();
    const res = lastWin ? lastWin.winner : 0;
    const humanMoves = moves.slice(fixed).filter((m) => m.p === 1).length;
    let head;
    if (!vsAI()) head = res ? `${nameOf(res)} won a 2 player game` : 'A 2 player draw';
    else if (res === 1) head = `I beat ${o.name} (${o.tag}) in ${humanMoves} moves`;
    else if (res === 2) head = `${o.name} (${o.tag}) beat me`;
    else head = `I drew with ${o.name} (${o.tag})`;
    const text = `Connect Four on Curio${daily ? ` · Daily ${todayKey()}` : ` · ${variant().name}`}\n${head}\n${boardString()}`;
    try { await navigator.clipboard.writeText(text); Curio.toast('Result copied. Go brag.'); }
    catch {
      const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.append(ta); ta.select();
      try { document.execCommand('copy'); Curio.toast('Result copied. Go brag.'); } catch { Curio.toast('Could not copy, sorry.'); }
      ta.remove();
    }
  }

  function undo() {
    if (busy || replaying || moves.length <= fixed) return;
    if (vsAI() && !moves.slice(fixed).some((m) => m.p === 1)) return;
    round++;
    stopClock();
    resultEl.hidden = true;
    if (over && lastWin) { session[lastWin.winner]--; }
    over = false; lastWin = null; usedUndo = true;
    if (vsAI()) { while (moves.length > fixed) { const mv = moves.pop(); if (mv.p === 1) break; } }
    else moves.pop();
    const v = daily ? VARIANTS[0] : variant();
    g = E.create(v);
    for (const mv of moves) E.doMove(g, mv.m, mv.p);
    turn = moves.length ? 3 - moves[moves.length - 1].p : starter;
    rebuildDiscs(); paintHud();
    sfx.tone(520, 0.08, 'sine', 0.08, 380);
    turnStatus(); paintGhost(); startClock();
  }

  async function hint() {
    if (!humanTurn()) return;
    usedHint = true;
    const r0 = round, n0 = moves.length;
    $('hint').disabled = true;
    setStatus('Consulting the oracle<span class="think"><i></i><i></i><i></i></span>');
    const res = await think(turn, 'hard', 700);
    if (r0 !== round || moves.length !== n0 || !res) return;
    turnStatus(); paintGhost();
    const m = res.move;
    if (m < W()) {
      sel = m; paintGhost();
      hintArrow.style.left = `${(m * 100) / W()}%`;
      hintArrow.classList.add('on');
      Curio.toast(`Try column ${m + 1}`);
    } else {
      const b = popsEl.children[m - W()];
      b.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 400, iterations: 3 });
      Curio.toast(`Try popping column ${m - W() + 1}`);
    }
    sfx.tone(988, 0.1, 'sine', 0.08); sfx.tone(1318, 0.12, 'sine', 0.07, 0, 0.08);
  }

  function showMenu() {
    round++;
    stopClock();
    over = true; busy = false; replaying = false;
    $('game').hidden = true; $('menu').hidden = false; app.classList.remove('playing');
    buildMenu();
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  }

  function startGame(opts = {}) {
    $('menu').hidden = true; $('game').hidden = false; app.classList.add('playing');
    colEls = []; discsEl.replaceChildren();
    sfx.tone(392, 0.08, 'triangle', 0.08); sfx.tone(587, 0.12, 'triangle', 0.08, 0, 0.07);
    newGame({ ...opts, instant: true });
  }

  function radio(container, items, current, render, onPick) {
    container.replaceChildren();
    items.forEach((it) => {
      const b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(it.id === current));
      b.innerHTML = render(it);
      b.addEventListener('click', () => { onPick(it); sfx.tick(); });
      container.append(b);
    });
  }

  function buildMenu() {
    applySkin();
    radio($('opps'), OPPS, S.opp, (o) => {
      const r = S.rec[o.id];
      const tag = o.id === 'pvp' ? o.tag : r ? `${r.w}W ${r.l}L` : o.tag;
      return `<span class="ava">${avatar(o, 'var(--p2)')}</span><span class="t"><b>${o.name}</b><small>${o.sub}</small></span><span class="tag">${tag}</span>`;
    }, (o) => { S.opp = o.id; save(); buildMenu(); });
    [...$('opps').children].forEach((b) => b.classList.add('opt'));
    radio($('variants'), VARIANTS, S.variant, (v) => `${variantIcon(v)}<span class="t"><b>${v.name}</b><small>${v.sub}</small></span>`, (v) => { S.variant = v.id; save(); buildMenu(); });
    [...$('variants').children].forEach((b) => b.classList.add('opt'));
    radio($('skins'), SKINS, S.skin, (k) => `<span class="sw" style="background:${k.bd}"><i style="background:${k.p1}"></i><i style="background:${k.p2}"></i></span>${k.name}`, (k) => { S.skin = k.id; save(); buildMenu(); });
    [...$('skins').children].forEach((b) => b.classList.add('skin'));
    $('opt-clock').checked = S.clock;
    document.querySelectorAll('#first button').forEach((b) => { b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', String(b.dataset.first === S.first)); });
    const k = todayKey(), d = S.daily[k];
    $('daily-card').classList.toggle('done', d === 'w');
    let streak = 0;
    for (let i = 0; i < 400; i++) { const dt = new Date(); dt.setDate(dt.getDate() - i); const kk = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`; if (S.daily[kk] === 'w') streak++; else if (i > 0 || S.daily[kk]) break; }
    $('daily-sub').textContent = d === 'w' ? `Solved today! Daily win streak: ${streak}. Come back tomorrow.` : d ? 'Not cracked yet today. Vega is waiting for a rematch.' : 'A fresh opening every day against Vega. Can you convert it?';
    $('daily-go').textContent = d === 'w' ? 'Play again' : 'Play today';
    buildHero();
    paintBadgeCount();
  }

  function paintBadgeCount() { $('badge-count').textContent = `${Object.keys(S.badges).filter((k) => BADGES.some((b) => b.id === k)).length}/${BADGES.length}`; }

  function openSheet(title, html) {
    $('sheet-title').textContent = title;
    $('sheet-body').innerHTML = html;
    $('sheet').hidden = false;
    $('sheet-x').focus();
  }
  const closeSheet = () => { $('sheet').hidden = true; };

  function miniBoard(h) {
    const w = h.W, hh = h.H, s = 10;
    let out = `<svg viewBox="0 0 ${w * s + 4} ${hh * s + 4}" aria-hidden="true"><rect width="${w * s + 4}" height="${hh * s + 4}" rx="3" fill="${(SKINS.find((k) => k.id === h.s) || SKINS[0]).bd}"/>`;
    const sk = SKINS.find((k) => k.id === h.s) || SKINS[0];
    for (let c = 0; c < w; c++) for (let r = 0; r < hh; r++) {
      const v = +h.b[c * hh + r];
      out += `<circle cx="${2 + c * s + s / 2}" cy="${2 + (hh - 1 - r) * s + s / 2}" r="${s * 0.38}" fill="${v === 1 ? sk.p1 : v === 2 ? sk.p2 : 'rgba(255,255,255,.85)'}"/>`;
    }
    return out + '</svg>';
  }

  function showStats() {
    const tot = OPPS.filter((o) => o.id !== 'pvp').reduce((a, o) => { const r = S.rec[o.id] || { w: 0, l: 0, d: 0 }; a.w += r.w; a.l += r.l; a.d += r.d; return a; }, { w: 0, l: 0, d: 0 });
    const n = tot.w + tot.l + tot.d;
    let html = `<div class="sgrid"><div><b>${S.total}</b><span>Games</span></div><div><b>${tot.w}</b><span>Robot wins</span></div><div><b>${n ? Math.round((tot.w / n) * 100) : 0}%</b><span>Win rate</span></div><div><b>${S.bestStreak}</b><span>Best streak</span></div></div>`;
    html += '<table class="rtable"><thead><tr><th>Rival</th><th>Won</th><th>Lost</th><th>Drawn</th><th>Fastest</th></tr></thead><tbody>';
    for (const o of OPPS.filter((x) => x.id !== 'pvp')) {
      const r = S.rec[o.id] || { w: 0, l: 0, d: 0 };
      const fast = VARIANTS.map((v) => Curio.getBest(`fastest-${v.id}-${o.id}`)).filter((x) => x != null);
      html += `<tr><td>${o.name} <span class="c-muted">${o.tag}</span></td><td>${r.w}</td><td>${r.l}</td><td>${r.d}</td><td>${fast.length ? Math.min(...fast) : '-'}</td></tr>`;
    }
    html += '</tbody></table>';
    html += `<h3 class="sub">Badges ${Object.keys(S.badges).length}/${BADGES.length}</h3><div class="badges">${BADGES.map((b) => `<div class="badge ${S.badges[b.id] ? 'got' : 'locked'}"><span class="e">${b.e}</span><b>${b.t}</b><small>${b.d}</small></div>`).join('')}</div>`;
    html += `<h3 class="sub">Recent games</h3>${S.hist.length ? `<div class="hist">${S.hist.map((h) => {
      const o = OPPS.find((x) => x.id === h.o) || OPPS[1];
      const lbl = h.res === 'w' ? `<span class="w">Beat ${o.name}</span>` : h.res === 'l' ? `<span class="l">Lost to ${o.name}</span>` : h.res === 'd' ? 'Draw' : `${h.res === 'p1' ? 'P1' : 'P2'} won`;
      const vn = h.v === 'daily' ? 'Daily' : (VARIANTS.find((v) => v.id === h.v) || VARIANTS[0]).name;
      return `<div>${miniBoard(h)}${lbl}<br><span class="c-muted">${vn}</span></div>`;
    }).join('')}</div>` : '<p class="c-muted">No finished games yet.</p>'}`;
    html += '<p style="margin-top:14px"><button type="button" class="c-btn c-btn--ghost" id="reset-stats">Reset all stats</button></p>';
    openSheet('Stats and badges', html);
    $('reset-stats').addEventListener('click', async () => {
      closeSheet();
      const v = await Curio.modal({ emoji: '🧹', title: 'Wipe everything?', body: 'Records, badges and history will be cleared. Settings stay.', buttons: [{ label: 'Keep them', value: 'no' }, { label: 'Wipe', value: 'yes' }] });
      if (v !== 'yes') return;
      Object.assign(S, { rec: {}, badges: {}, hist: [], total: 0, streak: 0, bestStreak: 0, daily: {}, skinsUsed: [] });
      save(); buildMenu(); Curio.toast('Fresh start.');
    });
  }

  function demo(cells, W2 = 4, H2 = 3, extra = '') {
    const s = 20;
    let out = `<svg viewBox="0 0 ${W2 * s + 6} ${H2 * s + 6}" aria-hidden="true"><rect width="${W2 * s + 6}" height="${H2 * s + 6}" rx="5" fill="var(--bd)"/>`;
    for (let c = 0; c < W2; c++) for (let r = 0; r < H2; r++) {
      const p = cells[`${c},${r}`];
      out += `<circle cx="${3 + c * s + s / 2}" cy="${3 + (H2 - 1 - r) * s + s / 2}" r="${s * 0.38}" fill="${p ? `var(--p${p})` : 'var(--bg)'}"/>`;
    }
    return out + extra + '</svg>';
  }

  function showHow() {
    const html = `<div class="how">
      <div class="step">${demo({ '1,0': 1, '2,0': 2, '1,1': 2 }, 4, 3, '<path d="M53 0 v10" stroke="#fff" stroke-width="3"/><path d="M48 6 l5 6 l5 -6" stroke="#fff" stroke-width="3" fill="none"/>')}<p><b>Drop.</b> Pick a column and your disc falls to the lowest free slot. Players alternate.</p></div>
      <div class="step">${demo({ '0,0': 1, '1,1': 1, '2,2': 1, '1,0': 2, '2,0': 2, '2,1': 2, '3,0': 2 }, 4, 3)}<p><b>Connect.</b> Four of your colour in a row wins: across, up, or diagonally. Diagonals are the sneaky ones.</p></div>
      <div class="step">${demo({ '1,0': 1, '1,1': 2, '1,2': 1, '2,0': 2 }, 4, 3, '<path d="M33 66 v-12" stroke="#fff" stroke-width="3"/>')}<p><b>Pop Out.</b> On your turn you may instead pull one of your own discs from the bottom row; the column slides down. A full board does not end the game. In Curio, if a pop lines up four for both colours, the popper wins.</p></div>
      <div class="step">${demo({ '0,0': 1, '0,1': 2, '0,2': 1, '3,0': 2, '3,1': 1, '3,2': 2 }, 4, 3)}<p><b>Five in a Row.</b> A wider 9 by 6 board whose outer columns start full of alternating discs. You need five, and those edge discs count.</p></div>
      <div class="step"><svg viewBox="0 0 86 66" aria-hidden="true"><rect width="86" height="66" rx="8" fill="var(--surface-2)"/><text x="43" y="42" text-anchor="middle" font-size="26">⏱️</text></svg><p><b>Shot clock.</b> Turn it on for eight seconds a move. Dither and a disc gets dropped for you.</p></div>
      <div class="step"><svg viewBox="0 0 86 66" aria-hidden="true"><rect width="86" height="66" rx="8" fill="var(--surface-2)"/><text x="43" y="42" text-anchor="middle" font-size="26">🧠</text></svg><p><b>Tips.</b> The middle column is part of more lines than any other, so it is worth the most. Build two threats at once and the robot can only block one. Classic Connect Four was solved in 1988: with perfect play, the first player always wins by starting in the middle.</p></div>
    </div>`;
    openSheet('How to play', html);
  }

  $('go').addEventListener('click', () => startGame());
  $('daily-go').addEventListener('click', () => { S.opp = 'hard'; save(); startGame({ daily: true }); });
  $('how').addEventListener('click', showHow);
  $('stats-btn').addEventListener('click', showStats);
  $('sheet-x').addEventListener('click', closeSheet);
  $('sheet').addEventListener('click', (e) => { if (e.target === $('sheet')) closeSheet(); });
  $('opt-clock').addEventListener('change', (e) => { S.clock = e.target.checked; save(); sfx.tick(); });
  $('first').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; S.first = b.dataset.first; save(); buildMenu(); sfx.tick(); });
  $('undo').addEventListener('click', undo);
  $('hint').addEventListener('click', hint);
  $('restart').addEventListener('click', () => newGame({ daily }));
  $('back').addEventListener('click', showMenu);
  resultEl.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    const a = b.dataset.a;
    if (a === 'again') newGame({ daily: false });
    else if (a === 'replay') replay();
    else if (a === 'share') share();
    else if (a === 'look') { resultEl.hidden = true; Curio.toast('Press R for a rematch'); }
  });

  stage.addEventListener('pointermove', (e) => {
    if (!g || e.pointerType === 'touch') return;
    const r = board.getBoundingClientRect();
    const c = Math.floor(((e.clientX - r.left) / r.width) * W());
    if (c >= 0 && c < W()) aim(c);
  });

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector('.curio-modal')) return;
    if (!$('sheet').hidden) { if (e.key === 'Escape') closeSheet(); return; }
    if ($('game').hidden) { if (e.key === 'Enter' && !e.target.closest('button,input')) { startGame(); e.preventDefault(); } return; }
    const k = e.key.toLowerCase();
    if (/^[1-9]$/.test(e.key) && +e.key <= W()) { humanMove(+e.key - 1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { aim((sel + W() - 1) % W()); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { aim((sel + 1) % W()); e.preventDefault(); }
    else if ((e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') && !e.target.closest('button,input')) {
      if (over && !resultEl.hidden) newGame({ daily: false }); else humanMove(sel);
      e.preventDefault();
    }
    else if (k === 'p' && g.pop) humanMove(W() + sel);
    else if (k === 'u') undo();
    else if (k === 'h') hint();
    else if (k === 'r' || k === 'n') newGame({ daily: over ? false : daily });
    else if (e.key === 'Escape') showMenu();
  });

  document.addEventListener('visibilitychange', () => { if (!document.hidden && clockTimer) startClock(); });

  buildMenu();
  window.__c4 = { get g() { return g; }, get over() { return over; }, get busy() { return busy; }, get turn() { return turn; }, humanMove, startGame, newGame, get moves() { return moves; }, S };
})();
