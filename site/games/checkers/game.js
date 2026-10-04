(() => {
  const K = window.Checkers;
  const $ = (id) => document.getElementById(id);
  const app = $('app');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SAVE = 'ckv2';
  const YOU = 1, AI = -1;

  const VARS = [
    { id: 'english', name: 'English', sub: '8x8. Men capture forward, kings step one square.', flag: '🇬🇧' },
    { id: 'international', name: 'International', sub: '10x10, 20 each. Flying kings, take the most.', flag: '🌍' },
    { id: 'brazilian', name: 'Brazilian', sub: 'International rules on an 8x8 board.', flag: '🇧🇷' },
    { id: 'russian', name: 'Russian', sub: 'Flying kings, crown mid-jump and keep going.', flag: '🪆' },
    { id: 'giveaway', name: 'Giveaway', sub: 'English moves, but lose all your pieces to win.', flag: '🙃' }
  ];
  const OPPS = [
    { id: 'easy', name: 'Twig', tag: 'Easy', sub: 'Knows the rules. Mostly.', c: '#8bc34a' },
    { id: 'medium', name: 'Burl', tag: 'Medium', sub: 'Looks a few moves ahead', c: '#ff9800' },
    { id: 'hard', name: 'Oakley', tag: 'Hard', sub: 'Deep search, no mercy', c: '#8d6e63' },
    { id: 'expert', name: 'Ironwood', tag: 'Expert', sub: 'Thinks for as long as it is allowed', c: '#455a64' },
    { id: 'pvp', name: 'A friend', tag: '2 players', sub: 'Pass and play', c: '#ffca28' }
  ];
  const BOARDS = [
    { id: 'walnut', name: 'Walnut', l: '#e8cfa6', d: '#8a5a3b', f: '#4e2f1c' },
    { id: 'maple', name: 'Maple', l: '#f5e6c8', d: '#c08a57', f: '#80522e' },
    { id: 'club', name: 'Club', l: '#efe5c6', d: '#4f7a4f', f: '#2f3b2f' }
  ];
  const SETS = [
    { id: 'classic', name: 'Classic', you: '#c62828', ai: '#2a2522' },
    { id: 'wood', name: 'Wood', you: '#e9c58f', ai: '#5d3a1a' },
    { id: 'stone', name: 'Stone', you: '#f1ede3', ai: '#2f6b52' }
  ];
  const BADGES = [
    { id: 'first', e: '🎉', t: 'First Win', d: 'Beat any AI' },
    { id: 'easy', e: '🌱', t: 'Twig Snapped', d: 'Beat Twig' },
    { id: 'medium', e: '🪵', t: 'Burl Busted', d: 'Beat Burl' },
    { id: 'hard', e: '🌳', t: 'Oak Felled', d: 'Beat Oakley' },
    { id: 'expert', e: '⚙️', t: 'Ironwood Rusted', d: 'Beat Ironwood' },
    { id: 'english', e: '🇬🇧', t: 'Draughtsman', d: 'Win at English rules' },
    { id: 'international', e: '🌍', t: 'World Class', d: 'Win at International 10x10' },
    { id: 'brazilian', e: '🇧🇷', t: 'Samba Squares', d: 'Win at Brazilian rules' },
    { id: 'russian', e: '🪆', t: 'Shashki Master', d: 'Win at Russian rules' },
    { id: 'giveaway', e: '🙃', t: 'Generous Soul', d: 'Win a Giveaway game' },
    { id: 'triple', e: '🦘', t: 'Kangaroo', d: 'Capture 3 or more in one move' },
    { id: 'kings3', e: '👑', t: 'Kingmaker', d: 'Crown 3 kings in one game' },
    { id: 'flawless', e: '💎', t: 'Flawless', d: 'Win without losing a single piece' },
    { id: 'comeback', e: '🛡️', t: 'Comeback', d: 'Win after being 3 pieces down' },
    { id: 'quick', e: '⚡', t: 'Blitzkrieg', d: 'Win in fewer than 25 of your moves' },
    { id: 'pure', e: '🧘', t: 'No Takebacks', d: 'Beat Oakley or Ironwood with no undo or hint' },
    { id: 'daily', e: '📅', t: 'Daily Grind', d: 'Win a daily challenge' },
    { id: 'draw', e: '🤝', t: 'Honours Even', d: 'Draw a game' },
    { id: 'ten', e: '🏅', t: 'Club Member', d: 'Finish 10 games' },
    { id: 'fifty', e: '🏆', t: 'Grandmaster', d: 'Finish 50 games' }
  ];

  const DEF = { v: 2, variant: 'english', opp: 'medium', board: 'walnut', set: 'classic', dots: true, nums: false, rec: {}, badges: {}, total: 0, daily: {}, hist: [], tip: 0 };
  function load() {
    const s = Curio.store.get(SAVE, null);
    const out = JSON.parse(JSON.stringify(DEF));
    if (s && typeof s === 'object' && s.v === 2) for (const k of Object.keys(DEF)) { if (s[k] != null && typeof s[k] === typeof DEF[k] && Array.isArray(s[k]) === Array.isArray(DEF[k])) out[k] = s[k]; }
    else { const lv = Curio.store.get('ck:level', null); if (['easy', 'medium', 'hard'].includes(lv)) out.opp = lv; }
    if (!VARS.some((v) => v.id === out.variant)) out.variant = 'english';
    if (!OPPS.some((v) => v.id === out.opp)) out.opp = 'medium';
    if (!BOARDS.some((v) => v.id === out.board)) out.board = 'walnut';
    if (!SETS.some((v) => v.id === out.set)) out.set = 'classic';
    return out;
  }
  const S = load();
  const save = () => Curio.store.set(SAVE, S);

  let noiseBuf = null;
  const sfx = {
    ac() { return Curio.muted ? null : Curio.audioContext(); },
    tone(f, d = 0.1, type = 'sine', v = 0.1, f2 = 0, delay = 0) {
      const ac = this.ac(); if (!ac) return;
      const t = ac.currentTime + delay;
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d + 0.03);
    },
    noise(d = 0.05, v = 0.1, freq = 1500, delay = 0, q = 2) {
      const ac = this.ac(); if (!ac) return;
      if (!noiseBuf) { noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.4, ac.sampleRate); const ch = noiseBuf.getChannelData(0); for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1; }
      const t = ac.currentTime + delay;
      const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
      src.buffer = noiseBuf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
      g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      src.connect(f).connect(g).connect(ac.destination); src.start(t, Math.random() * 0.2); src.stop(t + d + 0.02);
    },
    knock(p = 1) { this.noise(0.05, 0.22 * p, 1100 + Math.random() * 300, 0, 3); this.tone(240 + Math.random() * 40, 0.06, 'triangle', 0.1 * p, 160); },
    pick() { this.noise(0.03, 0.08, 2400, 0, 4); },
    cap(k) { this.noise(0.07, 0.25, 900, 0, 2); this.tone(520 - k * 40, 0.08, 'square', 0.05, 300); },
    crown() { [660, 880, 1100, 1320].forEach((f, k) => this.tone(f, 0.12, 'triangle', 0.1, 0, k * 0.06)); },
    win() { [523, 659, 784, 1046, 1318].forEach((f, k) => this.tone(f, 0.18, 'triangle', 0.12, 0, k * 0.09)); },
    lose() { [392, 330, 262, 196].forEach((f, k) => this.tone(f, 0.22, 'sawtooth', 0.05, 0, k * 0.13)); },
    tick() { this.tone(1200, 0.02, 'square', 0.025); },
    badge() { [880, 1175, 1568].forEach((f, k) => this.tone(f, 0.14, 'sine', 0.09, 0, k * 0.07)); }
  };
  const buzz = (p) => { try { if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return; navigator.vibrate?.(p); } catch {} };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const mixHex = (h, t, to = 0) => { const a = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); return `rgb(${a.map((v) => Math.round(v + (to - v) * t)).join(',')})`; };

  function applyLook() {
    const bd = BOARDS.find((x) => x.id === S.board) || BOARDS[0], st = SETS.find((x) => x.id === S.set) || SETS[0];
    const s = app.style;
    s.setProperty('--sq-l', bd.l); s.setProperty('--sq-d', bd.d); s.setProperty('--fr', bd.f); s.setProperty('--fr-hi', mixHex(bd.f, 0.3, 255)); s.setProperty('--fr-lo', mixHex(bd.f, 0.45));
    s.setProperty('--you', st.you); s.setProperty('--you-d', mixHex(st.you, 0.42)); s.setProperty('--you-l', mixHex(st.you, 0.35, 255));
    s.setProperty('--ai', st.ai); s.setProperty('--ai-d', mixHex(st.ai, 0.5)); s.setProperty('--ai-l', mixHex(st.ai, 0.3, 255));
    app.classList.toggle('nodots', !S.dots);
  }

  function face(o, small) {
    if (o.id === 'pvp') return `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21" fill="${o.c}" stroke="rgba(0,0,0,.2)" stroke-width="2"/><circle cx="17" cy="21" r="3" fill="#2a2018"/><circle cx="31" cy="21" r="3" fill="#2a2018"/><path d="M15 29 Q24 37 33 29" stroke="#2a2018" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;
    const dk = mixHex(o.c, 0.4), lt = mixHex(o.c, 0.35, 255);
    const rings = `<circle cx="24" cy="26" r="14" fill="none" stroke="${dk}" stroke-width="1.2" opacity=".5"/><circle cx="24" cy="26" r="9" fill="none" stroke="${dk}" stroke-width="1.2" opacity=".5"/>`;
    const top = o.id === 'easy' ? `<path d="M24 8 q-2 -6 4 -7 q0 6 -4 7z" fill="#66bb6a"/>` : o.id === 'medium' ? `<path d="M14 9 q10 -8 20 0" stroke="${dk}" stroke-width="3" fill="none"/>` : o.id === 'hard' ? `<circle cx="16" cy="6" r="5" fill="#66bb6a"/><circle cx="24" cy="4" r="6" fill="#4caf50"/><circle cx="32" cy="6" r="5" fill="#66bb6a"/>` : `<rect x="20" y="1" width="8" height="8" rx="2" fill="${dk}"/><circle cx="24" cy="5" r="2" fill="#80deea"/>`;
    const eyes = o.id === 'expert' ? `<rect x="12" y="20" width="24" height="7" rx="3.5" fill="#102027"/><rect x="15" y="22" width="6" height="3" rx="1.5" fill="#80deea"/><rect x="27" y="22" width="6" height="3" rx="1.5" fill="#80deea"/>` : `<circle cx="18" cy="23" r="3" fill="#2a1d14"/><circle cx="30" cy="23" r="3" fill="#2a1d14"/><circle cx="19" cy="22" r="1" fill="#fff"/><circle cx="31" cy="22" r="1" fill="#fff"/>`;
    const brow = o.id === 'hard' ? `<path d="M13 17 l9 3 M35 17 l-9 3" stroke="#2a1d14" stroke-width="2" stroke-linecap="round"/>` : '';
    return `<svg viewBox="0 0 48 48" aria-hidden="true">${top}<circle cx="24" cy="26" r="19" fill="${o.c}" stroke="${dk}" stroke-width="2.5"/>${rings}<circle cx="18" cy="17" r="5" fill="${lt}" opacity=".5"/>${brow}${eyes}<path d="M18 33 q6 ${o.id === 'easy' ? 5 : o.id === 'hard' ? -2 : 3} 12 0" stroke="#2a1d14" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>`;
  }
  const humanFace = () => face({ id: 'pvp', c: (SETS.find((x) => x.id === S.set) || SETS[0]).you });

  function miniBoard(v, size = 6) {
    const N = v.id === 'international' ? 10 : 8;
    const n = Math.min(N, size), cs = 38 / n;
    let s = `<svg viewBox="0 0 38 38" aria-hidden="true"><rect width="38" height="38" rx="5" style="fill:var(--fr)"/>`;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const dark = (r + c) & 1;
      s += `<rect x="${c * cs}" y="${r * cs}" width="${cs}" height="${cs}" style="fill:var(${dark ? '--sq-d' : '--sq-l'})"/>`;
      if (dark && (r < 2 || r >= n - 2)) s += `<circle cx="${c * cs + cs / 2}" cy="${r * cs + cs / 2}" r="${cs * 0.38}" style="fill:var(${r < 2 ? '--ai' : '--you'})"/>`;
    }
    if (v.id === 'giveaway') s += `<text x="19" y="25" text-anchor="middle" font-size="16">🙃</text>`;
    if (v.id === 'russian' || v.id === 'international' || v.id === 'brazilian') s += `<use href="#crown" x="11" y="12" width="16" height="12"/>`;
    return s + '</svg>';
  }

  function buildHero() {
    const svg = $('hero');
    const cs = 38, ox = 210, oy = 20, n = 6;
    let s = `<defs><linearGradient id="hfr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--fr-hi)"/><stop offset="1" style="stop-color:var(--fr-lo)"/></linearGradient><radialGradient id="hy" cx=".35" cy=".3"><stop offset="0" style="stop-color:var(--you-l)"/><stop offset=".6" style="stop-color:var(--you)"/><stop offset="1" style="stop-color:var(--you-d)"/></radialGradient><radialGradient id="ha" cx=".35" cy=".3"><stop offset="0" style="stop-color:var(--ai-l)"/><stop offset=".6" style="stop-color:var(--ai)"/><stop offset="1" style="stop-color:var(--ai-d)"/></radialGradient></defs>`;
    s += `<rect x="${ox - 14}" y="${oy - 10}" width="${n * cs + 28}" height="${n * cs + 24}" rx="14" fill="url(#hfr)"/>`;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) s += `<rect x="${ox + c * cs}" y="${oy + r * cs}" width="${cs}" height="${cs}" style="fill:var(${(r + c) & 1 ? '--sq-d' : '--sq-l'})"/>`;
    s += `<rect x="${ox}" y="${oy}" width="${n * cs}" height="${n * cs}" filter="url(#grain)" opacity=".25"/>`;
    const disc = (cx, cy, g, cls = '', king = false) => `<g class="${cls}"><ellipse cx="${cx}" cy="${cy + 4}" rx="15" ry="14" fill="rgba(0,0,0,.35)"/>${king ? `<circle cx="${cx}" cy="${cy + 3}" r="15" fill="url(#${g})"/>` : ''}<circle cx="${cx}" cy="${cy - (king ? 2 : 0)}" r="15" fill="url(#${g})"/><circle cx="${cx}" cy="${cy - (king ? 2 : 0)}" r="10" fill="none" stroke="rgba(0,0,0,.2)" stroke-width="1.5"/><circle cx="${cx}" cy="${cy - (king ? 2 : 0)}" r="6" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="1.5"/>${king ? `<use href="#crown" x="${cx - 9}" y="${cy - 10}" width="18" height="14"/>` : ''}</g>`;
    const at = (c, r) => [ox + c * cs + cs / 2, oy + r * cs + cs / 2];
    [[1, 0], [3, 0], [5, 0], [0, 1], [4, 1]].forEach(([c, r]) => { const [x, y] = at(c, r); s += disc(x, y, 'ha'); });
    [[0, 5], [2, 5], [4, 5], [3, 4]].forEach(([c, r]) => { const [x, y] = at(c, r); s += disc(x, y, 'hy'); });
    { const [x, y] = at(2, 3); s += disc(x, y, 'ha', 'hero-cap'); }
    { const [x, y] = at(1, 4); s += disc(x, y, 'hy', 'hero-jump'); }
    { const [x, y] = at(5, 2); s += disc(x, y, 'hy', '', true); }
    s += `<g class="hero-crown"><use href="#crown" x="520" y="60" width="70" height="52"/></g>`;
    s += `<g transform="translate(60 70) scale(2)">${face(OPPS.find((o) => o.id === S.opp) || OPPS[1]).replace(/<svg[^>]*>/, '').replace('</svg>', '')}</g>`;
    svg.innerHTML = s;
  }

  const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  function seeded(seed) {
    let h = 1779033703 ^ seed.length;
    for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    let a = h >>> 0;
    return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  let worker = null, wid = 0;
  const pending = new Map();
  function makeWorker() {
    try {
      const src = `const K=(${window.checkersEngine.toString()})();onmessage=(e)=>{const d=e.data;postMessage({id:d.id,r:K.aiMove(d.b,d.side,d.level,d.variant,{budget:d.budget})});};`;
      worker = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
      worker.onmessage = (e) => { const f = pending.get(e.data.id); pending.delete(e.data.id); if (f) f(e.data.r); };
      worker.onerror = () => { worker = null; for (const [id, f] of pending) { pending.delete(id); f(null); } };
    } catch { worker = null; }
  }
  makeWorker();
  function think(side, level, budget) {
    const snap = b.slice(), variant = R.id;
    return new Promise((res) => {
      const fallback = () => setTimeout(() => res(K.aiMove(snap, side, level, variant, { budget: Math.min(budget || 9999, 600) })), 30);
      if (!worker) { fallback(); return; }
      const id = ++wid;
      pending.set(id, (r) => (r ? res(r) : fallback()));
      worker.postMessage({ id, b: snap, side, level, variant, budget });
    });
  }

  const boardEl = $('board'), piecesEl = $('pieces'), arrowsEl = $('arrows');
  let R, N, b, ids, els, turn, over = true, busy = false, sel = null, prefix = [], legal = [], quiet, log, snaps, lastMove, round = 0, nextId = 1, humanMoves, flipped = false;
  let squares = [], posCount, captured, game, daily = false, cursor = -1;

  const opp = () => OPPS.find((o) => o.id === S.opp) || OPPS[1];
  const vsAI = () => S.opp !== 'pvp';
  const humanSide = (s) => !vsAI() || s === YOU;
  const sideName = (s) => (vsAI() ? (s === YOU ? 'You' : opp().name) : s === YOU ? (SETS.find((x) => x.id === S.set) || SETS[0]).name === 'Classic' ? 'Red' : 'Light' : (SETS.find((x) => x.id === S.set) || SETS[0]).name === 'Classic' ? 'Black' : 'Dark');

  function buildBoard() {
    N = R.N;
    app.style.setProperty('--N', N);
    [...boardEl.querySelectorAll('.sq')].forEach((x) => x.remove());
    squares = [];
    for (let v = 0; v < N * N; v++) {
      const dark = ((Math.floor(v / N) + (v % N)) & 1) === 1;
      const el = document.createElement(dark ? 'button' : 'div');
      el.className = `sq${dark ? ' dark' : ''}`;
      if (dark) {
        el.type = 'button';
        el.addEventListener('click', () => { if (suppressClick) { suppressClick = false; return; } clickSquare(idx(v)); });
      }
      boardEl.insertBefore(el, boardEl.querySelector('.grain'));
      squares.push(el);
    }
    paintNums();
    const g = boardEl.querySelector('.grain');
    if (!g.firstChild) g.innerHTML = '<svg aria-hidden="true"><rect width="100%" height="100%" filter="url(#grain)"/></svg>';
    const fg = document.querySelector('.frame-grain');
    if (!fg.firstChild) fg.innerHTML = '<svg aria-hidden="true"><rect width="100%" height="100%" filter="url(#grain2)"/></svg>';
    arrowsEl.setAttribute('viewBox', `0 0 ${N} ${N}`);
  }
  const idx = (v) => (flipped ? N * N - 1 - v : v);
  const view = (i) => (flipped ? N * N - 1 - i : i);
  function paintNums() {
    squares.forEach((el, v) => {
      if (!el.classList.contains('dark')) return;
      el.innerHTML = S.nums ? `<span class="num">${K.squareNumber(idx(v), N)}</span>` : '';
    });
  }

  function pos(el, i) { const v = view(i); el.style.left = `${((v % N) * 100) / N}%`; el.style.top = `${(Math.floor(v / N) * 100) / N}%`; }

  function makePiece(i) {
    const el = document.createElement('div');
    el.className = `piece ${b[i] > 0 ? 'you' : 'ai'}`;
    el.innerHTML = '<div class="disc"></div>';
    pos(el, i);
    piecesEl.append(el);
    return el;
  }
  function paintKing(el, king) {
    el.classList.toggle('king', king);
    const d = el.querySelector('.disc');
    if (king && !d.querySelector('.crown')) d.innerHTML = '<svg class="crown" viewBox="0 0 40 30" aria-hidden="true"><use href="#crown"/></svg>';
    if (!king) d.innerHTML = '';
  }
  function rebuildPieces() {
    piecesEl.replaceChildren(); els = new Map();
    for (let i = 0; i < N * N; i++) if (ids[i]) { const el = makePiece(i); paintKing(el, Math.abs(b[i]) === 2); els.set(ids[i], el); }
  }

  async function newGame(opts = {}) {
    round++;
    const r0 = round;
    daily = !!opts.daily;
    R = K.VARIANTS[daily ? 'english' : S.variant];
    flipped = false;
    b = K.initial(R);
    buildBoard();
    ids = Array(N * N).fill(null);
    for (let i = 0; i < N * N; i++) if (b[i]) ids[i] = nextId++;
    rebuildPieces();
    turn = YOU; over = false; busy = false; sel = null; prefix = []; quiet = 0; log = []; snaps = []; lastMove = null; humanMoves = 0; cursor = -1;
    posCount = new Map(); captured = { you: [], ai: [] };
    game = { undo: false, hint: false, maxCaps: 0, kings: 0, worst: 0, lost: 0 };
    arrowsEl.replaceChildren();
    closeSheet();
    paintPlayers();
    if (!reduce) {
      [...piecesEl.children].forEach((el, k) => el.animate([{ transform: 'translateY(-40px) scale(.6)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 320, delay: k * 18, easing: 'cubic-bezier(.2,1.4,.4,1)', fill: 'backwards' }));
      for (let k = 0; k < 6; k++) setTimeout(() => sfx.knock(0.4), k * 70);
    }
    if (daily) {
      busy = true; refresh();
      const rnd = seeded(`ck-${todayKey()}`);
      await sleep(500);
      for (let k = 0; k < 4; k++) {
        if (r0 !== round) return;
        const moves = K.legalMoves(b, turn, R);
        const m = moves[Math.floor(rnd() * moves.length)];
        await commit(m, 0, true);
      }
      busy = false; snaps = [];
    }
    bumpPos();
    refresh();
  }

  function bumpPos() { const k = K.key(b, turn); posCount.set(k, (posCount.get(k) || 0) + 1); }

  function refresh() {
    legal = !over && humanSide(turn) ? K.legalMoves(b, turn, R) : [];
    render();
  }

  function nextSteps() {
    if (sel == null) return [];
    return legal.filter((m) => m.from === sel && prefix.every((p, k) => m.path[k] === p)).map((m) => ({ to: m.path[prefix.length], cap: m.caps.length > 0 }));
  }

  function render() {
    const movable = new Set(prefix.length || busy ? [] : legal.map((m) => m.from));
    const steps = nextSteps();
    const stepSet = new Map(steps.map((s) => [s.to, s.cap]));
    squares.forEach((el, v) => {
      if (!el.classList.contains('dark')) return;
      const i = idx(v);
      el.classList.toggle('sel', i === sel);
      el.classList.toggle('target', stepSet.has(i));
      el.classList.toggle('cap', !!stepSet.get(i));
      el.classList.toggle('last', !!lastMove && (lastMove.from === i || lastMove.path.includes(i)) && i !== sel);
      el.classList.toggle('cursor', v === cursor);
      const p = b[i];
      el.setAttribute('aria-label', `Square ${K.squareNumber(i, N)}: ${p ? `${p > 0 ? sideName(YOU) : sideName(AI)} ${Math.abs(p) === 2 ? 'king' : 'piece'}` : 'empty'}${stepSet.has(i) ? ', move here' : ''}${movable.has(i) ? ', can move' : ''}`);
    });
    for (let i = 0; i < N * N; i++) {
      const id = ids[i]; if (!id) continue;
      const el = els.get(id); if (!el) continue;
      paintKing(el, Math.abs(b[i]) === 2);
      el.classList.toggle('movable', movable.has(i));
      el.classList.toggle('selected', i === sel);
    }
    const n = K.count(b);
    $('c-you').textContent = n.men[0] + n.kings[0];
    $('c-ai').textContent = n.men[1] + n.kings[1];
    $('undo').disabled = busy || !snaps.length || prefix.length > 0;
    $('hint').disabled = busy || over || !humanSide(turn);
    $('who-you').classList.toggle('turn', !over && turn === YOU);
    $('who-ai').classList.toggle('turn', !over && turn === AI);
    paintStatus(); paintHistory(); paintTrays();
    const rec = S.rec[`${S.opp}`] || { w: 0, l: 0, d: 0 };
    $('record').textContent = vsAI() ? `Record vs ${opp().name}: ${rec.w} won · ${rec.l} lost · ${rec.d} drawn` : '';
  }

  function paintPlayers() {
    $('ava-you').innerHTML = humanFace();
    $('ava-ai').innerHTML = vsAI() ? face(opp()) : face({ id: 'pvp', c: (SETS.find((x) => x.id === S.set) || SETS[0]).ai });
    $('name-you').textContent = sideName(YOU);
    $('name-ai').textContent = vsAI() ? `${opp().name} · ${opp().tag}` : sideName(AI);
  }

  function paintTrays() {
    $('tray-you').innerHTML = captured.you.map(() => '<i class="ai"></i>').join('');
    $('tray-ai').innerHTML = captured.ai.map(() => '<i class="you"></i>').join('');
  }

  function paintStatus() {
    const st = $('status');
    if (over) return;
    const v = VARS.find((x) => x.id === R.id);
    const quietNote = quiet >= 50 ? `<small>${Math.floor(quiet / 2)}/40 moves without a capture.</small>` : '';
    if (!humanSide(turn)) st.innerHTML = `${opp().name} is thinking<span class="think"><i></i><i></i><i></i></span>${quietNote}`;
    else if (prefix.length) st.innerHTML = 'Keep jumping!<small>A capture sequence must be finished.</small>';
    else if (legal.length && legal[0].caps.length) st.innerHTML = `${vsAI() ? 'You' : sideName(turn)} must capture!<small>${R.majority ? 'And you must take the most pieces possible.' : 'Jumps are compulsory.'}</small>`;
    else st.innerHTML = `${vsAI() ? 'Your move' : `${sideName(turn)} to move`}<small>${v.flag} ${v.name}${R.give ? ': lose everything to win!' : ''}</small>${quietNote}`;
  }

  function paintHistory() {
    const h = $('history'); h.replaceChildren();
    if (!log.length) { const li = document.createElement('li'); li.className = 'empty'; li.textContent = 'No moves yet.'; h.append(li); return; }
    for (let k = 0; k < log.length; k += 2) {
      const li = document.createElement('li');
      li.innerHTML = '<span></span><span></span><span></span>';
      li.children[0].textContent = `${k / 2 + 1}.`; li.children[1].textContent = log[k]; li.children[2].textContent = log[k + 1] || '';
      h.append(li);
    }
    h.scrollTop = h.scrollHeight;
  }

  function clickSquare(i) {
    if (busy || over || !humanSide(turn)) return;
    arrowsEl.replaceChildren();
    const steps = nextSteps();
    if (steps.some((s) => s.to === i)) { step(i); return; }
    if (prefix.length) { Curio.toast('Finish the jump!'); sfx.tone(160, 0.1, 'square', 0.04); return; }
    if (K.sign(b[i]) === turn) {
      if (legal.some((m) => m.from === i)) { sel = i; sfx.pick(); }
      else if (legal.length && legal[0].caps.length) { Curio.toast(R.majority ? 'You must take the biggest capture available.' : 'You must capture with another piece!'); sfx.tone(150, 0.12, 'square', 0.05); sel = null; flashMovable(); }
      else { Curio.toast('That piece is stuck.'); sel = null; }
    } else sel = null;
    render();
  }

  function flashMovable() {
    piecesEl.querySelectorAll('.movable .disc').forEach((d) => d.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.15)' }, { transform: 'scale(1)' }], { duration: 300, iterations: 2 }));
  }

  function snapshot() { return { b: b.slice(), ids: ids.slice(), quiet, log: log.slice(), lastMove, humanMoves, turn, captured: { you: captured.you.slice(), ai: captured.ai.slice() }, posCount: new Map(posCount), game: { ...game } }; }

  async function step(i) {
    const fromSq = prefix.length ? prefix[prefix.length - 1] : sel;
    prefix.push(i);
    const done = legal.find((m) => m.from === sel && m.path.length === prefix.length && m.path.every((p, k) => p === prefix[k]));
    const el = els.get(ids[sel]);
    hop(el, fromSq, i, legal.some((m) => m.from === sel && m.caps.length));
    const partial = legal.find((m) => m.from === sel && prefix.every((p, k) => m.path[k] === p));
    if (partial && partial.caps.length) {
      const cap = partial.caps[prefix.length - 1];
      els.get(ids[cap])?.classList.add('ghost');
      sfx.cap(prefix.length);
    } else sfx.knock();
    if (!done) { render(); return; }
    snaps.push(snapshot());
    humanMoves++;
    busy = true;
    await commit(done, prefix.length);
    sel = null; prefix = [];
    busy = false;
    afterMove();
  }

  function hop(el, from, to, jumping) {
    pos(el, to);
    if (jumping && !reduce && el) {
      el.querySelector('.disc').animate([{ transform: 'translateY(0) scale(1)' }, { transform: 'translateY(-30%) scale(1.18)' }, { transform: 'translateY(0) scale(1)' }], { duration: 230, easing: 'ease-out' });
    }
  }

  async function commit(m, alreadyStepped, quick) {
    const moverId = ids[m.from];
    const el = els.get(moverId);
    const side = K.sign(b[m.from]);
    const wasMan = Math.abs(b[m.from]) === 1;
    const r0 = round;
    let prev = m.from;
    for (let k = 0; k < m.path.length; k++) {
      if (k >= alreadyStepped) {
        hop(el, prev, m.path[k], m.caps.length > 0);
        if (m.caps[k] != null) sfx.cap(k); else sfx.knock();
        await sleep(quick ? 140 : 240);
        if (r0 !== round) return;
      }
      prev = m.path[k];
    }
    for (const c of m.caps) {
      const cid = ids[c];
      const cel = els.get(cid);
      if (cel) {
        cel.classList.remove('ghost');
        const tray = side === YOU ? 'you' : 'ai';
        if (!reduce) cel.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${side === YOU ? 60 : -60}px, ${side === YOU ? 40 : -40}px) scale(.3) rotate(120deg)`, opacity: 0 }], { duration: 420, easing: 'cubic-bezier(.5,0,.8,.5)', fill: 'forwards' }).onfinish = () => cel.remove();
        else cel.remove();
        els.delete(cid);
        captured[tray].push(b[c]);
      }
      ids[c] = null;
    }
    if (m.caps.length >= 2) { buzz([10, 30, 10, 30, 10]); if (m.caps.length >= 3 && humanSide(side) && vsAI()) Curio.toast(`${m.caps.length}-piece jump!`); }
    else if (m.caps.length) buzz(15);
    const to = m.path[m.path.length - 1];
    log.push(K.notation(m, N));
    b = K.apply(b, m);
    ids[to] = moverId; if (m.from !== to) ids[m.from] = null;
    quiet = m.caps.length ? 0 : quiet + 1;
    lastMove = m;
    if (side === YOU && vsAI()) game.maxCaps = Math.max(game.maxCaps, m.caps.length);
    if (wasMan && m.promo) {
      el.classList.remove('crowned'); void el.offsetWidth; el.classList.add('crowned');
      sfx.crown();
      if (humanSide(side)) { Curio.toast(R.flying ? '👑 Crowned! Kings fly any distance.' : '👑 Crowned! Kings move backwards too.'); if (side === YOU) game.kings++; }
    }
    const n = K.count(b);
    const diff = (n.men[1] + n.kings[1]) - (n.men[0] + n.kings[0]);
    game.worst = Math.max(game.worst, diff);
    turn = -turn;
    bumpPos();
    refresh();
  }

  function afterMove() {
    if (checkEnd()) return;
    if (!humanSide(turn)) aiTurn();
  }

  function checkEnd() {
    const moves = K.legalMoves(b, turn, R);
    if (!moves.length) {
      const moverWins = R.give;
      const winner = moverWins ? turn : -turn;
      finish(winner);
      return true;
    }
    if (quiet >= 80) { finish(0, 'Forty moves each without a capture.'); return true; }
    if ((posCount.get(K.key(b, turn)) || 0) >= 3) { finish(0, 'The same position came up three times.'); return true; }
    return false;
  }

  async function aiTurn() {
    busy = true; refresh();
    $('who-ai').classList.add('thinking');
    const r0 = round, t0 = performance.now();
    const res = await think(AI, S.opp, null);
    await sleep(Math.max(0, 450 - (performance.now() - t0)));
    $('who-ai').classList.remove('thinking');
    if (r0 !== round || over) return;
    const m = res && res.m ? res.m : K.legalMoves(b, AI, R)[0];
    if (!m) { checkEnd(); return; }
    const real = K.legalMoves(b, AI, R).find((x) => x.from === m.from && x.path.join() === m.path.join()) || K.legalMoves(b, AI, R)[0];
    await commit(real, 0);
    if (r0 !== round) return;
    busy = false;
    refresh();
    checkEnd();
  }

  function award(result) {
    const got = [];
    const give = (id) => { if (!S.badges[id]) { S.badges[id] = Date.now(); const x = BADGES.find((y) => y.id === id); if (x) got.push(x); } };
    if (vsAI() && result === 'win') {
      give('first'); give(S.opp); give(R.id);
      if (game.lost === 0 && captured.ai.length === 0) give('flawless');
      if (game.worst >= 3) give('comeback');
      if (humanMoves < 25) give('quick');
      if ((S.opp === 'hard' || S.opp === 'expert') && !game.undo && !game.hint) give('pure');
      if (daily) give('daily');
    }
    if (game.maxCaps >= 3) give('triple');
    if (game.kings >= 3) give('kings3');
    if (result === 'draw') give('draw');
    if (S.total >= 10) give('ten');
    if (S.total >= 50) give('fifty');
    return got;
  }

  async function finish(winner, reason = '') {
    over = true; busy = false;
    let result;
    if (!vsAI()) result = winner === 0 ? 'draw' : 'p';
    else result = winner === YOU ? 'win' : winner === AI ? 'lose' : 'draw';
    S.total++;
    if (vsAI() && !daily) { const rec = (S.rec[S.opp] ||= { w: 0, l: 0, d: 0 }); rec[{ win: 'w', lose: 'l', draw: 'd' }[result]]++; }
    if (daily) { const k = todayKey(); if (S.daily[k] !== 'win') S.daily[k] = result; }
    S.hist.unshift({ t: Date.now(), v: R.id, o: S.opp, r: result, m: humanMoves });
    S.hist = S.hist.slice(0, 15);
    const got = award(result);
    save();
    render();
    const st = $('status');
    let emoji, title, body;
    if (result === 'win') {
      emoji = '🏆'; title = Curio.pick(['You win!', 'Board cleared!', 'Crowned champion!']);
      const best = Curio.best(`fastest-${R.id}-${S.opp}`, humanMoves, false);
      body = `Won in ${humanMoves} moves${best.isNew ? ', your quickest yet!' : `. Quickest: ${best.best}.`}${R.give ? ' You gave it all away, beautifully.' : ''}`;
      Curio.confetti(); sfx.win(); buzz([30, 40, 60]);
      st.innerHTML = 'You win! 🎉';
    } else if (result === 'lose') {
      emoji = '🪵'; title = `${opp().name} wins`; body = R.give ? `${opp().name} managed to lose everything first.` : reason || 'No moves left for you. Rematch?';
      sfx.lose(); buzz(80);
      st.innerHTML = `${opp().name} wins.<small>${R.give ? 'It ran out of pieces first.' : 'You have no moves left.'}</small>`;
    } else if (result === 'draw') {
      emoji = '🤝'; title = 'A draw'; body = reason;
      st.innerHTML = `Draw.<small>${reason}</small>`;
      sfx.tone(440, 0.2, 'sine', 0.1); sfx.tone(440, 0.25, 'sine', 0.08, 0, 0.18);
    } else {
      emoji = '🏆'; title = `${sideName(winner)} wins!`; body = `${sideName(-winner)} ${R.give ? 'still has pieces left' : 'has no moves left'}.`;
      Curio.confetti(); sfx.win();
      st.innerHTML = `${sideName(winner)} wins!`;
    }
    const n = K.count(b);
    const html = `<div class="result-card"><div class="big">${emoji}</div><h3>${title}</h3><p class="c-muted">${body}</p>${got.length ? `<div class="newb">${got.map((x) => `<span>${x.e} ${x.t}</span>`).join('')}</div>` : ''}<div class="rstats"><div><b>${humanMoves}</b><span>Your moves</span></div><div><b>${n.men[0] + n.kings[0]}-${n.men[1] + n.kings[1]}</b><span>Pieces left</span></div><div><b>${game.maxCaps}</b><span>Best jump</span></div></div><div class="c-row"><button type="button" class="c-btn" data-a="again">${daily ? 'Free play' : 'Play again'}</button><button type="button" class="c-btn c-btn--ghost" data-a="share">Share</button><button type="button" class="c-btn c-btn--ghost" data-a="look">Look at the board</button></div></div>`;
    if (got.length) setTimeout(() => sfx.badge(), 700);
    await sleep(700);
    if (!over) return;
    openSheet(result === 'win' ? 'Victory' : result === 'lose' ? 'Defeat' : 'Game over', html, (a) => {
      if (a === 'again') newGame();
      else if (a === 'share') share(result);
      else closeSheet();
    });
  }

  async function share(result) {
    const v = VARS.find((x) => x.id === R.id);
    const n = K.count(b);
    const head = !vsAI() ? 'A two player game' : result === 'win' ? `I beat ${opp().name} (${opp().tag}) in ${humanMoves} moves` : result === 'lose' ? `${opp().name} (${opp().tag}) beat me` : `I drew with ${opp().name} (${opp().tag})`;
    const text = `Checkers on Curio · ${daily ? `Daily ${todayKey()}` : `${v.flag} ${v.name}`}\n${head}\nPieces left: ${'🔴'.repeat(n.men[0] + n.kings[0])}${'⚫'.repeat(n.men[1] + n.kings[1])}`;
    try { await navigator.clipboard.writeText(text); Curio.toast('Copied. Go brag.'); }
    catch {
      const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.append(ta); ta.select();
      try { document.execCommand('copy'); Curio.toast('Copied. Go brag.'); } catch { Curio.toast('Could not copy, sorry.'); }
      ta.remove();
    }
  }

  let drag = null, suppressClick = false;
  const squareAt = (x, y) => {
    const r = boardEl.getBoundingClientRect();
    const c = Math.floor(((x - r.left) / r.width) * N), row = Math.floor(((y - r.top) / r.height) * N);
    return c >= 0 && c < N && row >= 0 && row < N ? idx(row * N + c) : -1;
  };
  Curio.drag(boardEl, {
    start(p) {
      drag = null;
      if (busy || over || !humanSide(turn)) return;
      const i = squareAt(p.clientX, p.clientY);
      if (i < 0) return;
      const from = prefix.length ? prefix[prefix.length - 1] : i;
      const origin = prefix.length ? sel : i;
      if (prefix.length ? i !== from : !legal.some((m) => m.from === i)) return;
      drag = { i: origin, x: p.clientX, y: p.clientY, moved: false };
    },
    move(p) {
      if (!drag) return;
      const dx = p.clientX - drag.x, dy = p.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) < 6) return;
      if (!drag.moved) { drag.moved = true; sel = drag.i; sfx.pick(); render(); }
      const el = els.get(ids[drag.i]);
      if (!el) return;
      el.classList.add('dragging');
      el.style.transform = `translate(${dx}px, ${dy}px) scale(1.12)`;
      p.event?.preventDefault?.();
    },
    end(p) {
      const d = drag; drag = null;
      if (!d || !d.moved) return;
      suppressClick = true; setTimeout(() => { suppressClick = false; }, 0);
      const el = els.get(ids[d.i]);
      if (el) { el.classList.remove('dragging'); el.style.transform = ''; }
      const i = p ? squareAt(p.clientX, p.clientY) : -1;
      if (nextSteps().some((st) => st.to === i)) step(i); else render();
    }
  });
  addEventListener('curio:touchpad', () => { if (!$('game').hidden) Curio.toast(Curio.touchpad ? 'Touchpad mode: click a piece to pick it up, click a square to drop it.' : 'Touchpad mode off'); });

  function undo() {
    if (busy || !snaps.length || prefix.length) return;
    const s = snaps.pop();
    round++;
    b = s.b; ids = s.ids; quiet = s.quiet; log = s.log; lastMove = s.lastMove; humanMoves = s.humanMoves; turn = s.turn; captured = s.captured; posCount = s.posCount; game = { ...s.game, undo: true };
    over = false; sel = null; prefix = [];
    rebuildPieces();
    closeSheet();
    arrowsEl.replaceChildren();
    sfx.tone(520, 0.08, 'sine', 0.08, 380);
    refresh();
  }

  async function hint() {
    if (busy || over || !humanSide(turn)) return;
    game.hint = true;
    const r0 = round, n0 = log.length;
    $('hint').disabled = true;
    $('status').innerHTML = 'Thinking about it<span class="think"><i></i><i></i><i></i></span>';
    const res = await think(turn, 'hard', 700);
    if (r0 !== round || log.length !== n0 || !res || !res.m) { refresh(); return; }
    refresh();
    drawArrow(res.m);
    sel = res.m.from; prefix = []; render();
    sfx.tone(988, 0.1, 'sine', 0.08); sfx.tone(1318, 0.12, 'sine', 0.07, 0, 0.08);
  }

  function drawArrow(m) {
    const ctr = (i) => { const v = view(i); return [(v % N) + 0.5, Math.floor(v / N) + 0.5]; };
    const pts = [m.from, ...m.path].map(ctr);
    arrowsEl.innerHTML = `<defs><marker id="ckah" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3" markerHeight="3" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="#ffd54f"/></marker></defs><polyline points="${pts.map((p) => p.join(',')).join(' ')}" fill="none" stroke="#ffd54f" stroke-width=".16" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#ckah)" opacity=".9" stroke-dasharray="4" stroke-dashoffset="4"><animate attributeName="stroke-dashoffset" from="4" to="0" dur=".5s" fill="freeze"/></polyline>`;
  }

  let sheetHandler = null;
  function openSheet(title, html, onAction) {
    $('sheet-title').textContent = title;
    $('sheet-body').innerHTML = html;
    sheetHandler = onAction || null;
    $('sheet').hidden = false;
    ($('sheet-body').querySelector('.c-btn') || $('sheet-x')).focus({ preventScroll: true });
  }
  function closeSheet() { $('sheet').hidden = true; sheetHandler = null; }
  $('sheet-body').addEventListener('click', (e) => { const x = e.target.closest('[data-a]'); if (x && sheetHandler) sheetHandler(x.dataset.a); });
  $('sheet-x').addEventListener('click', closeSheet);
  $('sheet').addEventListener('click', (e) => { if (e.target === $('sheet')) closeSheet(); });

  function radio(container, items, current, render, onPick, cls) {
    container.replaceChildren();
    items.forEach((it) => {
      const x = document.createElement('button');
      x.type = 'button'; x.setAttribute('role', 'radio'); if (cls) x.className = cls;
      x.setAttribute('aria-checked', String(it.id === current));
      x.innerHTML = render(it);
      x.addEventListener('click', () => { onPick(it); sfx.tick(); });
      container.append(x);
    });
  }

  function buildMenu() {
    applyLook();
    radio($('variants'), VARS, S.variant, (v) => `<span class="vic">${miniBoard(v)}</span><span class="t"><b>${v.flag} ${v.name}</b><small>${v.sub}</small></span>`, (v) => { S.variant = v.id; save(); buildMenu(); }, 'opt');
    radio($('opps'), OPPS, S.opp, (o) => { const r = S.rec[o.id]; return `<span class="ava">${face(o)}</span><span class="t"><b>${o.name}</b><small>${o.sub}</small></span><span class="rec">${o.id === 'pvp' ? o.tag : r ? `${r.w}W ${r.l}L` : o.tag}</span>`; }, (o) => { S.opp = o.id; save(); buildMenu(); }, 'opt');
    radio($('boards'), BOARDS, S.board, (x) => `<svg viewBox="0 0 60 30" aria-hidden="true"><rect width="60" height="30" fill="${x.f}"/>${[0, 1, 2, 3, 4, 5].map((k) => `<rect x="${3 + k * 9}" y="3" width="9" height="12" fill="${k % 2 ? x.d : x.l}"/><rect x="${3 + k * 9}" y="15" width="9" height="12" fill="${k % 2 ? x.l : x.d}"/>`).join('')}</svg>${x.name}`, (x) => { S.board = x.id; save(); buildMenu(); }, 'sw');
    radio($('sets'), SETS, S.set, (x) => `<svg viewBox="0 0 60 30" aria-hidden="true"><circle cx="20" cy="15" r="11" fill="${x.you}" stroke="rgba(0,0,0,.3)" stroke-width="2"/><circle cx="40" cy="15" r="11" fill="${x.ai}" stroke="rgba(0,0,0,.3)" stroke-width="2"/></svg>${x.name}`, (x) => { S.set = x.id; save(); buildMenu(); }, 'sw');
    $('opt-dots').checked = S.dots; $('opt-nums').checked = S.nums;
    const k = todayKey(), d = S.daily[k];
    $('daily-card').classList.toggle('done', d === 'win');
    $('daily-sub').textContent = d === 'win' ? 'Beaten today! Come back tomorrow for a new opening.' : d ? 'Oakley won today’s round. Try again?' : 'English rules, a seeded opening and Oakley on the other side. Same for everyone.';
    $('daily-go').textContent = d === 'win' ? 'Play again' : 'Play today';
    $('badge-count').textContent = `${Object.keys(S.badges).filter((x) => BADGES.some((y) => y.id === x)).length}/${BADGES.length}`;
    buildHero();
  }

  function show(which) {
    $('menu').hidden = which !== 'menu'; $('game').hidden = which !== 'game';
    app.classList.toggle('playing', which === 'game');
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
  function toMenu() { round++; over = true; busy = false; closeSheet(); show('menu'); buildMenu(); }

  function showStats() {
    let w = 0, l = 0, d = 0;
    for (const o of OPPS) { const r = S.rec[o.id]; if (r) { w += r.w; l += r.l; d += r.d; } }
    let html = `<div class="sgrid"><div><b>${S.total}</b><span>Games</span></div><div><b>${w}</b><span>Wins</span></div><div><b>${w + l + d ? Math.round((w / (w + l + d)) * 100) : 0}%</b><span>Win rate</span></div><div><b>${Object.keys(S.badges).length}</b><span>Badges</span></div></div>`;
    html += '<table class="rtable"><thead><tr><th>Opponent</th><th>Won</th><th>Lost</th><th>Drawn</th></tr></thead><tbody>';
    for (const o of OPPS.filter((x) => x.id !== 'pvp')) { const r = S.rec[o.id] || { w: 0, l: 0, d: 0 }; html += `<tr><td>${o.name} <span class="c-muted">${o.tag}</span></td><td>${r.w}</td><td>${r.l}</td><td>${r.d}</td></tr>`; }
    html += '</tbody></table>';
    html += `<h3 class="sub">Badges ${Object.keys(S.badges).length}/${BADGES.length}</h3><div class="badges">${BADGES.map((x) => `<div class="badge ${S.badges[x.id] ? 'got' : 'locked'}"><span class="e">${x.e}</span><b>${x.t}</b><small>${x.d}</small></div>`).join('')}</div>`;
    html += `<h3 class="sub">Recent games</h3>${S.hist.length ? `<table class="rtable"><tbody>${S.hist.map((h) => { const v = VARS.find((x) => x.id === h.v) || VARS[0]; const o = OPPS.find((x) => x.id === h.o) || OPPS[1]; return `<tr><td>${h.r === 'win' ? '✅ Won' : h.r === 'lose' ? '❌ Lost' : h.r === 'draw' ? '🤝 Draw' : '👯 2P'}</td><td>${v.flag} ${v.name}</td><td>${o.name}</td><td>${h.m} moves</td></tr>`; }).join('')}</tbody></table>` : '<p class="c-muted">No games yet.</p>'}`;
    html += '<p><button type="button" class="c-btn c-btn--ghost" data-a="reset">Reset all stats</button></p>';
    openSheet('Stats and badges', html, async (a) => {
      if (a !== 'reset') return;
      closeSheet();
      const v = await Curio.modal({ emoji: '🧹', title: 'Wipe everything?', body: 'Records, badges and history will be cleared.', buttons: [{ label: 'Keep them', value: 'no' }, { label: 'Wipe', value: 'yes' }] });
      if (v !== 'yes') return;
      Object.assign(S, { rec: {}, badges: {}, total: 0, daily: {}, hist: [] });
      save(); buildMenu();
    });
  }

  function diagram(cells, arrows = '') {
    const n = 5, cs = 18;
    let s = `<svg viewBox="0 0 ${n * cs} ${n * cs}" aria-hidden="true">`;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) s += `<rect x="${c * cs}" y="${r * cs}" width="${cs}" height="${cs}" style="fill:var(${(r + c) & 1 ? '--sq-d' : '--sq-l'})"/>`;
    for (const [c, r, p, k] of cells) s += `<circle cx="${c * cs + cs / 2}" cy="${r * cs + cs / 2}" r="7" style="fill:var(${p > 0 ? '--you' : '--ai'})" stroke="rgba(0,0,0,.3)"/>${k ? `<use href="#crown" x="${c * cs + 4}" y="${r * cs + 5}" width="10" height="8"/>` : ''}`;
    return `${s}${arrows}</svg>`;
  }

  function showHow() {
    const arrow = (pts) => `<polyline points="${pts.map(([c, r]) => `${c * 18 + 9},${r * 18 + 9}`).join(' ')}" fill="none" stroke="#ffd54f" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="4 3"/>`;
    openSheet('How to play', `<div class="how">
      <div class="step">${diagram([[1, 4, 1], [3, 4, 1], [2, 1, -1]], arrow([[1, 4], [2, 3]]))}<p><b>Move diagonally</b> on the dark squares, one step forward. You move first.</p></div>
      <div class="step">${diagram([[1, 4, 1], [2, 3, -1], [4, 1, -1]], arrow([[1, 4], [3, 2]]))}<p><b>Jump to capture.</b> Hop over an enemy piece into the empty square behind it. Captures are compulsory, and if you can keep jumping you must.</p></div>
      <div class="step">${diagram([[2, 0, 1, 1], [3, 3, -1]], arrow([[2, 0], [3, 1], [4, 2]]))}<p><b>Reach the far row to be crowned.</b> Kings can move and capture backwards as well.</p></div>
      <div class="step">${diagram([[0, 4, 1, 1], [2, 2, -1]], arrow([[0, 4], [3, 1], [4, 0]]))}<p><b>Flying kings</b> (International, Brazilian, Russian) slide any distance along a diagonal and can capture a piece far away, landing on any empty square beyond it. Men can also capture backwards in these games.</p></div>
      <table class="vtable"><thead><tr><th>Rules</th><th>Board</th><th>Men capture back</th><th>Flying kings</th><th>Must take most</th></tr></thead><tbody>
        <tr><td>English</td><td>8x8</td><td>No</td><td>No</td><td>No</td></tr>
        <tr><td>International</td><td>10x10</td><td>Yes</td><td>Yes</td><td>Yes</td></tr>
        <tr><td>Brazilian</td><td>8x8</td><td>Yes</td><td>Yes</td><td>Yes</td></tr>
        <tr><td>Russian</td><td>8x8</td><td>Yes</td><td>Yes</td><td>No</td></tr>
        <tr><td>Giveaway</td><td>8x8</td><td>No</td><td>No</td><td>No</td></tr>
      </tbody></table>
      <p><b>Fine print.</b> In International and Brazilian, a man only becomes a king if it ends its move on the far row; in Russian it is crowned the moment it arrives, even mid-jump, and carries on as a king. In English, reaching the far row ends the move. Captured pieces come off the board when the move ends, and no piece can be jumped twice.</p>
      <p><b>Giveaway</b> uses English moves but flips the goal: the first player with no pieces, or no legal moves, wins.</p>
      <p><b>Draws.</b> Curio calls a draw after 40 moves each without a capture, or when the same position appears three times.</p>
    </div>`);
  }

  function tip() { if (!S.tip) { S.tip = 1; save(); setTimeout(() => Curio.toast('Tip: click a piece, then a square. On a touchpad you can also turn on Touchpad mode in the top bar.', 4200), 900); } }
  $('go').addEventListener('click', () => { show('game'); newGame(); tip(); });
  $('daily-go').addEventListener('click', () => { S.opp = 'hard'; save(); show('game'); newGame({ daily: true }); });
  $('how').addEventListener('click', showHow);
  $('stats-btn').addEventListener('click', showStats);
  $('opt-dots').addEventListener('change', (e) => { S.dots = e.target.checked; save(); applyLook(); });
  $('opt-nums').addEventListener('change', (e) => { S.nums = e.target.checked; save(); });
  $('undo').addEventListener('click', undo);
  $('hint').addEventListener('click', hint);
  $('flip').addEventListener('click', () => { flipped = !flipped; for (let i = 0; i < N * N; i++) if (ids[i]) pos(els.get(ids[i]), i); paintNums(); arrowsEl.replaceChildren(); render(); sfx.tick(); });
  $('new').addEventListener('click', () => newGame({ daily }));
  $('back').addEventListener('click', toMenu);

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector('.curio-modal')) return;
    if (!$('sheet').hidden) { if (e.key === 'Escape') closeSheet(); return; }
    if ($('game').hidden) { if (e.key === 'Enter' && !e.target.closest('button,input')) { $('go').click(); e.preventDefault(); } return; }
    const k = e.key.toLowerCase();
    if (k === 'u') undo();
    else if (k === 'h') hint();
    else if (k === 'n') newGame({ daily });
    else if (k === 'f') $('flip').click();
    else if (e.key === 'Escape') { if (sel != null && !prefix.length) { sel = null; render(); } else toMenu(); }
    else if (e.key.startsWith('Arrow')) {
      e.preventDefault();
      if (cursor < 0) cursor = view(sel ?? (legal[0] ? legal[0].from : 0));
      const r = Math.floor(cursor / N), c = cursor % N;
      const d = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key];
      cursor = Math.max(0, Math.min(N - 1, r + d[0])) * N + Math.max(0, Math.min(N - 1, c + d[1]));
      squares[cursor].focus({ preventScroll: true });
      render();
    } else if ((e.key === 'Enter' || e.key === ' ') && cursor >= 0 && !e.target.closest('.sq')) { clickSquare(idx(cursor)); e.preventDefault(); }
  });

  buildMenu();
  window.__checkers = { get board() { return b; }, get legal() { return legal; }, clickSquare, get busy() { return busy; }, get turn() { return turn; }, get over() { return over; }, get log() { return log; }, newGame, show, S, get N() { return N; } };
})();
