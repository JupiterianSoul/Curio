(() => {
  const $ = (id) => document.getElementById(id);
  const SUIT_NAMES = ['spades', 'hearts', 'diamonds', 'clubs'];
  const RANKS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const RANK_NAMES = ['', 'Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Jack', 'Queen', 'King'];
  const SUIT_PATHS = [
    'M50 4C38 22 6 38 6 60c0 13 10 22 22 22 8 0 14-4 17-9-1 9-5 15-12 21h34c-7-6-11-12-12-21 3 5 9 9 17 9 12 0 22-9 22-22C94 38 62 22 50 4z',
    'M50 90C22 68 5 52 5 31 5 17 16 7 29 7c9 0 16 5 21 12 5-7 12-12 21-12 13 0 24 10 24 24 0 21-17 37-45 59z',
    'M50 3L86 50 50 97 14 50z',
    'M50 8a19 19 0 1 1-.1 0zM28 40a19 19 0 1 1-.1 0zM72 40a19 19 0 1 1-.1 0zM44 55h12c0 16 4 26 14 37H30c10-11 14-21 14-37z'
  ];
  const PIPS = {
    2: [[50, 0], [50, 100]], 3: [[50, 0], [50, 50], [50, 100]], 4: [[25, 0], [75, 0], [25, 100], [75, 100]],
    5: [[25, 0], [75, 0], [50, 50], [25, 100], [75, 100]], 6: [[25, 0], [75, 0], [25, 50], [75, 50], [25, 100], [75, 100]],
    7: [[25, 0], [75, 0], [50, 25], [25, 50], [75, 50], [25, 100], [75, 100]], 8: [[25, 0], [75, 0], [50, 25], [25, 50], [75, 50], [50, 75], [25, 100], [75, 100]],
    9: [[25, 0], [75, 0], [25, 33], [75, 33], [50, 50], [25, 67], [75, 67], [25, 100], [75, 100]],
    10: [[25, 0], [75, 0], [50, 17], [25, 33], [75, 33], [25, 67], [75, 67], [50, 83], [25, 100], [75, 100]]
  };
  const BACKS = [['classic', 'Classic blue'], ['ruby', 'Ruby medallion'], ['forest', 'Forest plaid'], ['sunset', 'Sunset'], ['night', 'Night sky'], ['tartan', 'Tartan'], ['curio', 'Zoble rainbow']];
  const FELTS = [['green', 'Casino green', '#1f7a3f', '#12592b'], ['blue', 'Ocean blue', '#1f5f8f', '#123c5e'], ['red', 'Burgundy', '#8a2b3a', '#5a1724'], ['purple', 'Royal purple', '#5b3a8f', '#36205c'], ['slate', 'Charcoal', '#3a4250', '#1f242d'], ['wood', 'Oak table', '#9a6a3c', '#6b4423'], ['teal', 'Lagoon', '#1b8a80', '#0f5a54']];
  const GAMES = {
    klondike: { cols: 7, found: 4, cells: 0, name: 'Klondike', sub: 'The one that came free with every computer. Build the four suits from Ace to King.',
      rules: ['Build the four foundations up by suit, Ace to King.', 'In the tableau, stack cards down in alternating colours (red 6 on black 7).', 'Only a King (or a run starting with one) can fill an empty column.', 'Tap the deck to draw one or three cards. Draw 1 costs 100 points per recycle.', 'Scoring: 10 for each card home, 5 for each card turned up or played from the waste, plus a speed bonus.'] },
    freecell: { cols: 8, found: 4, cells: 4, name: 'FreeCell', sub: 'Every card is face up, so it is all skill. Use the four free cells wisely. These are the classic numbered deals.',
      rules: ['All 52 cards are dealt face up into eight columns.', 'Build foundations up by suit from Ace to King.', 'Stack down in alternating colours. Any card can fill an empty column.', 'The four free cells at top left each hold one card.', 'You can move a run as long as there are enough free cells and empty columns to shuffle it: (free cells + 1) × 2 per empty column.', 'Deal numbers match the classic Windows game, where 31,999 of the first 32,000 are solvable.'] },
    spider: { cols: 10, found: 8, cells: 0, name: 'Spider', sub: 'Two decks, ten columns. Build full King-to-Ace runs in one suit and they fly home.',
      rules: ['104 cards in ten columns, with 50 left in the stock.', 'Place any card on one rank higher, whatever the suit.', 'You can only move a run if it is all one suit, in order.', 'A complete King-to-Ace run in one suit is removed automatically.', 'Tap the stock to deal ten more cards, one per column. Every column must have at least one card first.', 'Score starts at 500, minus 1 per move, plus 100 per finished run.'] }
  };
  const ACH = [
    ['k', '🃏', 'Klondiker', 'Win a game of Klondike'],
    ['k3', '🎩', 'Hard draw', 'Win Klondike on Draw 3'],
    ['fc', '🧊', 'Cool head', 'Win a game of FreeCell'],
    ['s1', '🕷️', 'Itsy bitsy', 'Win Spider with one suit'],
    ['s2', '🕸️', 'Web weaver', 'Win Spider with two suits'],
    ['s4', '🦂', 'Arachnophile', 'Win Spider with all four suits'],
    ['fast', '⚡', 'Speed dealer', 'Win any game in under 3 minutes'],
    ['clean', '🧼', 'No regrets', 'Win without using undo'],
    ['nohint', '🙈', 'Unassisted', 'Win without a single hint'],
    ['daily', '📅', 'Daily ritual', 'Win a daily deal'],
    ['streak', '🔥', 'Hot streak', 'Win 3 games of one kind in a row'],
    ['ten', '🏆', 'Card shark', 'Win 10 games in total']
  ];

  const table = $('table'), layer = $('layer');
  const isRed = (c) => c.s === 1 || c.s === 2;
  const suitSvg = (s, cls = '') => `<svg class="suit ${cls}" viewBox="0 0 100 100" aria-hidden="true"><use href="#s${s}"/></svg>`;

  const SAVE_V = 2;
  const load = () => {
    const base = { v: SAVE_V, game: 'klondike', draw: Curio.store.get('sol:draw', 1) === 3 ? 3 : 1, suits: 1, back: 'classic', felt: 'green', stats: {}, ach: {}, totalWins: Curio.store.get('sol:stats', { won: 0 }).won || 0 };
    const raw = Curio.store.get('sol:v2', null);
    if (!raw || raw.v !== SAVE_V) return base;
    return { ...base, ...raw, stats: raw.stats || {}, ach: raw.ach || {} };
  };
  const save = load();
  if (!GAMES[save.game]) save.game = 'klondike';
  if (![1, 2, 4].includes(save.suits)) save.suits = 1;
  const keep = { game: save.game, draw: save.draw };
  if (Curio.simple) { save.game = 'klondike'; save.draw = 1; }
  const persist = () => Curio.store.set('sol:v2', Curio.simple ? { ...save, ...keep } : save);
  const statKey = () => save.game === 'klondike' ? `klondike-d${save.draw}` : save.game === 'spider' ? `spider-${save.suits}` : 'freecell';
  const statsOf = (k = statKey()) => (save.stats[k] ||= { played: 0, won: 0, best: 0, streak: 0, bestStreak: 0, bestScore: 0 });

  let G = GAMES[save.game];
  let cards = [], slots = {}, piles = null;
  let score, moves, elapsed, t0, ticking, over, hist, auto, recycles, dealNo, isDaily, usedUndo, usedHint, counted;
  let M = { cw: 80, ch: 112, gap: 10 };

  function rng(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function shuffleSeeded(arr, seed) {
    const r = rng(seed), a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  function msDeal(seed) {
    const out = []; for (let i = 51; i >= 0; i--) out.push(i);
    for (let i = 0; i < 52; i++) {
      seed = (seed * 214013 + 2531011) % 2147483648;
      const j = 51 - ((seed >> 16) % (52 - i));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
  const dayNumber = () => { const d = new Date(); return d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate(); };
  const dailySeed = () => { let h = 2166136261; for (const ch of `${dayNumber()}:${statKey()}`) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return ((h >>> 0) % 31999) + 1; };

  function court(r, s) {
    const red = s === 1 || s === 2;
    const robe = ['#2b3f8f', '#c62828', '#d9622b', '#2f6f4a'][s];
    const robe2 = ['#1c2a63', '#8e1b1b', '#9c3f17', '#1d4a30'][s];
    const hair = r === 12 ? (red ? '#8a4b22' : '#3a2a1f') : '#5b3a26';
    const hat = r === 13
      ? '<path d="M18 27l2-13 6 7 4-10 4 10 6-7 2 13z" fill="#ffc233" stroke="#a87400" stroke-width="1.2" stroke-linejoin="round"/><circle cx="30" cy="11" r="2" fill="#ff5a36"/><circle cx="20" cy="14" r="1.6" fill="#3498db"/><circle cx="40" cy="14" r="1.6" fill="#3498db"/>'
      : r === 12
        ? '<path d="M21 26l3-8 6 5 6-5 3 8z" fill="#ffd56b" stroke="#a87400" stroke-width="1.1" stroke-linejoin="round"/><circle cx="30" cy="19" r="2.2" fill="#ff6fb5"/>'
        : `<path d="M17 28c0-9 6-13 13-13s13 4 13 13z" fill="${robe}"/><path d="M40 18c5-6 10-6 13-3-5 0-8 3-11 7z" fill="#ffc233"/>`;
    const beard = r === 13 ? `<path d="M23 38c1 7 4 10 7 10s6-3 7-10c-2 3-4 4-7 4s-5-1-7-4z" fill="${red ? '#a0522d' : '#e8e2d6'}"/>` : '';
    const longHair = r === 12 ? `<path d="M20 34c-2 8 0 14 2 18l5-3c-3-5-4-10-3-15zM40 34c2 8 0 14-2 18l-5-3c3-5 4-10 3-15z" fill="${hair}"/>` : '';
    const side = r === 11 ? '<path d="M50 36v40" stroke="#c9c2b4" stroke-width="2.4" stroke-linecap="round"/><path d="M46 40h8" stroke="#ffc233" stroke-width="2.4" stroke-linecap="round"/>' : r === 13 ? '<path d="M50 30v46" stroke="#ffc233" stroke-width="2.4" stroke-linecap="round"/><circle cx="50" cy="28" r="3.4" fill="#ffc233"/>' : '<path d="M9 44c3-3 6-3 8 0-2 4-6 4-8 0z" fill="#ff6fb5"/><path d="M13 44v22" stroke="#2f6f4a" stroke-width="1.6"/>';
    return `<svg viewBox="0 0 60 84" aria-hidden="true"><rect width="60" height="84" fill="${red ? '#fdeedd' : '#e9eefb'}"/><path d="M0 64h60v20H0z" fill="${red ? '#f7d9b8' : '#d6dff5'}"/>
      ${side}${longHair}<path d="M6 84l6-26c4-8 32-8 36 0l6 26z" fill="${robe}"/><path d="M12 58c6 5 30 5 36 0l-2 6c-8 4-24 4-32 0z" fill="${robe2}"/><path d="M22 52h16l-2 6h-12z" fill="#ffc233"/>
      <circle cx="30" cy="35" r="10" fill="#f6d2b0"/><circle cx="26.5" cy="34" r="1.2" fill="#2b2620"/><circle cx="33.5" cy="34" r="1.2" fill="#2b2620"/><path d="M27 39.5q3 2 6 0" stroke="#b5533c" stroke-width="1.2" fill="none" stroke-linecap="round"/><circle cx="24.5" cy="38" r="1.6" fill="#ff9a8a" opacity=".6"/><circle cx="35.5" cy="38" r="1.6" fill="#ff9a8a" opacity=".6"/>
      ${beard}${hat}<use href="#s${s}" x="24" y="64" width="12" height="12" fill="#fff"/><rect x=".75" y=".75" width="58.5" height="82.5" fill="none" stroke="${red ? '#d32f2f' : '#1d1b19'}" stroke-width="1.5"/></svg>`;
  }

  function faceHtml(c) {
    let mid = '';
    if (c.r === 1) mid = `<span class="ace">${suitSvg(c.s)}</span>`;
    else if (c.r > 10) mid = `<span class="court">${court(c.r, c.s)}</span>`;
    else mid = `<span class="pips">${PIPS[c.r].map(([x, y]) => `<svg class="suit${y > 50 ? ' dn' : ''}" style="left:${x}%;top:${y}%" viewBox="0 0 100 100" aria-hidden="true"><use href="#s${c.s}"/></svg>`).join('')}</span><span class="mid">${suitSvg(c.s)}</span>`;
    return `<div class="face"><span class="tl"><b>${RANKS[c.r]}</b>${suitSvg(c.s)}</span>${mid}<span class="br"><b>${RANKS[c.r]}</b>${suitSvg(c.s)}</span></div><div class="back" data-b="${save.back}"></div>`;
  }

  function buildCards(list) {
    cards.forEach((c) => c.el.remove());
    cards = list.map(([s, r], id) => {
      const el = document.createElement('div');
      const c = { id, s, r, up: false, el, x: 0, y: 0, pile: null };
      el.className = `card${isRed(c) ? ' red' : ''}`;
      el.dataset.id = id;
      el.innerHTML = faceHtml(c);
      layer.append(el);
      return c;
    });
  }

  function buildSlots() {
    Object.values(slots).forEach((d) => d.remove());
    slots = {};
    const mk = (key, html, cls = '') => { const d = document.createElement('div'); d.className = `slot ${cls}`; d.innerHTML = html; d.dataset.slot = key; layer.prepend(d); slots[key] = d; return d; };
    if (save.game !== 'freecell') { mk('stock', '', 'stock'); slots.stock.setAttribute('role', 'button'); slots.stock.tabIndex = 0; }
    if (save.game === 'klondike') mk('waste', '');
    for (let i = 0; i < G.found; i++) mk(`f${i}`, save.game === 'spider' ? suitSvg(0) : save.game === 'klondike' || save.game === 'freecell' ? suitSvg(i) : 'A');
    for (let i = 0; i < G.cells; i++) mk(`c${i}`, '', 'cell');
    for (let i = 0; i < G.cols; i++) mk(`t${i}`, save.game === 'klondike' ? 'K' : '');
  }

  function newPiles() {
    const P = { stock: { t: 'stock', arr: [] }, waste: { t: 'waste', arr: [] }, f: [], t: [], c: [] };
    for (let i = 0; i < G.found; i++) P.f.push({ t: 'f', i, arr: [] });
    for (let i = 0; i < G.cols; i++) P.t.push({ t: 't', i, arr: [] });
    for (let i = 0; i < G.cells; i++) P.c.push({ t: 'c', i, arr: [] });
    return P;
  }
  const allPiles = () => [piles.stock, piles.waste, ...piles.f, ...piles.t, ...piles.c];
  const reindex = () => { for (const p of allPiles()) for (const c of p.arr) c.pile = p; };
  const top = (a) => a[a.length - 1];

  function newGame(seed, daily = false) {
    G = GAMES[save.game];
    dealNo = seed || (save.game === 'freecell' ? 1 + Math.floor(Math.random() * 31999) : 1 + Math.floor(Math.random() * 999999));
    isDaily = daily;
    let list;
    if (save.game === 'freecell') list = msDeal(dealNo).map((c) => [[3, 2, 1, 0][c & 3], (c >> 2) + 1]);
    else if (save.game === 'klondike') { list = []; for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) list.push([s, r]); list = shuffleSeeded(list, dealNo); }
    else {
      const suits = save.suits === 1 ? [0] : save.suits === 2 ? [0, 1] : [0, 1, 2, 3];
      list = [];
      for (let k = 0; k < 8; k++) for (let r = 1; r <= 13; r++) list.push([suits[k % suits.length], r]);
      list = shuffleSeeded(list, dealNo);
    }
    buildCards(list);
    buildSlots();
    piles = newPiles();
    if (save.game === 'klondike') {
      let k = 0;
      for (let i = 0; i < 7; i++) for (let j = 0; j <= i; j++) { const c = cards[k++]; c.up = j === i; piles.t[i].arr.push(c); }
      piles.stock.arr = cards.slice(k);
    } else if (save.game === 'freecell') {
      cards.forEach((c, k) => { c.up = true; piles.t[k % 8].arr.push(c); });
    } else {
      let k = 0;
      for (let i = 0; i < 10; i++) { const n = i < 4 ? 6 : 5; for (let j = 0; j < n; j++) { const c = cards[k++]; c.up = j === n - 1; piles.t[i].arr.push(c); } }
      piles.stock.arr = cards.slice(k);
    }
    reindex();
    score = save.game === 'spider' ? 500 : 0; moves = 0; elapsed = 0; t0 = 0; ticking = false; over = false; hist = []; auto = false; recycles = 0;
    usedUndo = false; usedHint = false; counted = false;
    document.querySelectorAll('.win-canvas').forEach((e) => e.remove());
    layout();
    cards.forEach((c) => { c.el.style.transition = 'none'; c.el.style.transform = `translate(${M.colX(0)}px, 0px)`; c.el.classList.toggle('up', false); });
    void layer.offsetWidth;
    let d = 0;
    const order = [];
    const maxLen = Math.max(...piles.t.map((p) => p.arr.length));
    for (let row = 0; row < maxLen; row++) for (const p of piles.t) if (p.arr[row]) order.push(p.arr[row]);
    const step = Math.max(8, Math.round(900 / order.length));
    order.forEach((c) => { c.el.style.transition = `transform .3s cubic-bezier(.3, .8, .4, 1) ${d++ * step}ms`; });
    render();
    setTimeout(() => cards.forEach((c) => { c.el.style.transition = ''; }), 1300);
    window.Cafe?.sound('shuffle', 0.9);
    [0, 1, 2, 3].forEach((k2) => setTimeout(() => window.Cafe?.sound('deal', 0.5), 300 + k2 * 110));
    paintChrome();
    hud();
  }

  function layout() {
    const W = table.clientWidth - 2 * (parseFloat(getComputedStyle(table).getPropertyValue('--pad')) || 12);
    const n = G.cols;
    const gap = W < 520 ? (n > 8 ? 3 : 4) : n > 8 ? 8 : 12;
    const cw = Math.floor(Math.min(104, (W - (n - 1) * gap) / n));
    const ch = Math.round(cw * 1.4);
    M = { W, cw, ch, gap, colX: (i) => i * (cw + gap) + Math.max(0, (W - n * cw - (n - 1) * gap) / 2), y0: ch + gap * 2 + 6 };
    table.style.setProperty('--cw', `${cw}px`); table.style.setProperty('--ch', `${ch}px`);
    table.classList.toggle('narrow', cw < 62);
  }

  function slotPos() {
    const pos = {};
    if (save.game === 'klondike') { pos.stock = 0; pos.waste = 1; for (let i = 0; i < 4; i++) pos[`f${i}`] = 3 + i; }
    else if (save.game === 'freecell') { for (let i = 0; i < 4; i++) { pos[`c${i}`] = i; pos[`f${i}`] = 4 + i; } }
    else { pos.stock = 0; for (let i = 0; i < 8; i++) pos[`f${i}`] = 2 + i; }
    return pos;
  }

  function baseZ(p) { return p.t === 't' ? 300 + p.i * 40 : p.t === 'f' ? 200 + p.i * 14 : p.t === 'c' ? 150 + p.i : p.t === 'waste' ? 100 : 10; }

  function render(lift = []) {
    const { ch, colX, y0 } = M;
    const sp = slotPos();
    for (const [key, col] of Object.entries(sp)) if (slots[key]) slots[key].style.transform = `translate(${colX(col)}px, 0px)`;
    for (let i = 0; i < G.cols; i++) slots[`t${i}`].style.transform = `translate(${colX(i)}px, ${y0}px)`;
    if (slots.stock) slots.stock.innerHTML = piles.stock.arr.length ? '' : save.game === 'klondike' && piles.waste.arr.length ? '↻' : '';
    if (slots.waste) slots.waste.style.visibility = 'hidden';
    const set = (c, x, y, z) => {
      c.x = x; c.y = y;
      c.el.style.transform = `translate(${x}px, ${y}px)`;
      c.el.style.zIndex = lift.includes(c) ? 900 + z % 100 : z;
      c.el.classList.toggle('up', c.up);
      c.el.setAttribute('aria-label', c.up ? `${RANK_NAMES[c.r]} of ${SUIT_NAMES[c.s]}` : 'Face-down card');
    };
    const st = piles.stock.arr;
    if (save.game === 'spider') st.forEach((c, i) => set(c, colX(0) + Math.floor(i / 10) * Math.max(3, M.cw * 0.1), 0, 10 + i));
    else st.forEach((c, i) => set(c, colX(0) + 0, 0, 10 + i));
    const fan = save.draw === 3 ? M.cw * 0.3 : 0;
    const w = piles.waste.arr, vis = Math.min(save.draw === 3 ? 3 : 1, w.length);
    w.forEach((c, i) => { const k = i - (w.length - vis); set(c, colX(1) + Math.max(0, k) * fan, 0, 100 + i); });
    piles.f.forEach((p, f) => p.arr.forEach((c, i) => set(c, colX(sp[`f${f}`]), 0, baseZ(p) + i)));
    piles.c.forEach((p, f) => p.arr.forEach((c, i) => set(c, colX(sp[`c${f}`]), 0, baseZ(p) + i)));
    const availH = Math.max(ch * 3.2, innerHeight - 52 - 22 - y0 - 12);
    let maxBottom = y0 + ch;
    piles.t.forEach((p) => {
      const a = p.arr, downs = a.filter((c) => !c.up).length, ups = a.length - downs;
      let dd = ch * (save.game === 'spider' ? 0.1 : 0.13), du = ch * (G.cols > 8 ? 0.26 : 0.3);
      const need = downs * dd + Math.max(0, ups - 1) * du + ch;
      if (need > availH && ups > 1) du = Math.max(ch * 0.15, (availH - ch - downs * dd) / (ups - 1));
      let y = y0;
      a.forEach((c, i) => { set(c, colX(p.i), y, baseZ(p) + i); y += c.up ? du : dd; });
      if (a.length) maxBottom = Math.max(maxBottom, top(a).y + ch);
    });
    layer.style.height = `${maxBottom + 4}px`;
    cards.forEach((c) => { const pl = c.pile; c.el.tabIndex = c.up && pl && pl.t !== 'stock' && (pl.t === 't' || c === top(pl.arr)) ? 0 : -1; });
    if (st.length) { const t = top(st); t.el.tabIndex = 0; t.el.setAttribute('aria-label', save.game === 'spider' ? `Stock, ${st.length / 10} deals left. Deal.` : `Deck, ${st.length} cards. Draw.`); }
    if (slots.stock) slots.stock.setAttribute('aria-label', save.game === 'klondike' ? 'Recycle the waste pile' : 'Stock is empty');
    if (lift.length) setTimeout(() => lift.forEach((c) => { const pl = c.pile; if (pl) c.el.style.zIndex = baseZ(pl) + pl.arr.indexOf(c); }), 260);
    $('undo').disabled = !hist.length || over;
  }

  const fmtT = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const homeCount = () => piles.f.reduce((n, p) => n + p.arr.length, 0);
  function hud() {
    if (save.game === 'freecell') { $('score').textContent = `${homeCount()}/52`; $('score-l').textContent = 'Home'; }
    else { $('score').textContent = Curio.fmt(score); $('score-l').textContent = 'Score'; }
    $('moves').textContent = moves;
    $('time').textContent = fmtT(elapsed);
  }
  function startClock() {
    if (!counted) { counted = true; const st = statsOf(); st.played++; persist(); }
    if (ticking || over) return; ticking = true; t0 = performance.now() - elapsed * 1000;
  }
  setInterval(() => { if (!ticking || document.hidden || over) return; elapsed = (performance.now() - t0) / 1000; $('time').textContent = fmtT(elapsed); }, 500);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && ticking) t0 = performance.now() - elapsed * 1000; });

  function snap() {
    const ids = (p) => p.arr.map((c) => [c.id, c.up]);
    hist.push({ stock: ids(piles.stock), waste: ids(piles.waste), f: piles.f.map(ids), t: piles.t.map(ids), c: piles.c.map(ids), score, recycles });
    if (hist.length > 400) hist.shift();
  }
  function restore(h) {
    const back = (a) => a.map(([id, up]) => { cards[id].up = up; return cards[id]; });
    piles.stock.arr = back(h.stock); piles.waste.arr = back(h.waste);
    h.f.forEach((a, i) => { piles.f[i].arr = back(a); });
    h.t.forEach((a, i) => { piles.t[i].arr = back(a); });
    h.c.forEach((a, i) => { piles.c[i].arr = back(a); });
    score = h.score; recycles = h.recycles;
    reindex();
  }
  function undo() {
    if (!hist.length || over || auto) return;
    clearHint();
    const before = new Map(cards.map((c) => [c, c.pile]));
    restore(hist.pop()); moves++; usedUndo = true;
    render(cards.filter((c) => before.get(c) !== c.pile));
    hud(); Curio.beep(330, 0.05, 'sine', 0.07);
  }

  const canFound = (c, p) => { const a = p.arr; return a.length ? top(a).s === c.s && top(a).r === c.r - 1 : c.r === 1; };
  const freeCells = () => piles.c.filter((p) => !p.arr.length).length;
  const emptyCols = () => piles.t.filter((p) => !p.arr.length).length;
  const maxRun = (toEmpty) => (freeCells() + 1) * 2 ** Math.max(0, emptyCols() - (toEmpty ? 1 : 0));

  function validRun(stack) {
    for (let k = 1; k < stack.length; k++) {
      const a = stack[k - 1], b = stack[k];
      if (!b.up || a.r !== b.r + 1) return false;
      if (save.game === 'spider' ? a.s !== b.s : isRed(a) === isRed(b)) return false;
    }
    return true;
  }

  function canDrop(stack, p) {
    const head = stack[0];
    if (p.t === 'f') return save.game !== 'spider' && stack.length === 1 && canFound(head, p);
    if (p.t === 'c') return stack.length === 1 && !p.arr.length;
    if (p.t !== 't') return false;
    const tp = top(p.arr);
    if (save.game === 'klondike') return tp ? tp.up && isRed(tp) !== isRed(head) && tp.r === head.r + 1 : head.r === 13;
    if (save.game === 'freecell') {
      if (stack.length > maxRun(!tp)) return false;
      return tp ? isRed(tp) !== isRed(head) && tp.r === head.r + 1 : true;
    }
    return tp ? tp.r === head.r + 1 : true;
  }

  function stackFrom(c) {
    const pl = c.pile;
    if (!pl || !c.up || pl.t === 'stock') return null;
    if (pl.t === 'f' && save.game === 'spider') return null;
    if (pl.t === 't') {
      const stack = pl.arr.slice(pl.arr.indexOf(c));
      if (save.game !== 'klondike' && !validRun(stack)) return null;
      return { src: pl, stack };
    }
    if (c !== top(pl.arr)) return null;
    return { src: pl, stack: [c] };
  }

  function flipExposed() {
    let n = 0;
    for (const p of piles.t) { const tp = top(p.arr); if (tp && !tp.up) { tp.up = true; n++; tp.el.classList.add('flip'); setTimeout(() => tp.el.classList.remove('flip'), 300); } }
    return n;
  }

  function sparks(x, y, colors) {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const box = document.createElement('div'); box.className = 'sparks';
    for (let k = 0; k < 10; k++) {
      const i = document.createElement('i');
      const a = Math.random() * Math.PI * 2, d = 20 + Math.random() * 30;
      i.style.left = `${x}px`; i.style.top = `${y}px`; i.style.background = colors[k % colors.length];
      i.style.setProperty('--dx', `${Math.cos(a) * d}px`); i.style.setProperty('--dy', `${Math.sin(a) * d}px`);
      box.append(i);
    }
    layer.append(box); setTimeout(() => box.remove(), 700);
  }
  function popText(x, y, text) {
    const d = document.createElement('div'); d.className = 'combo'; d.textContent = text;
    d.style.left = `${x}px`; d.style.top = `${y}px`;
    layer.append(d); setTimeout(() => d.remove(), 1000);
  }
  const buzz = (ms) => { try { navigator.vibrate?.(ms); } catch {} };

  function homeFx(c) {
    c.el.classList.remove('home'); void c.el.offsetWidth; c.el.classList.add('home');
    setTimeout(() => sparks(c.x + M.cw / 2, c.y + M.ch / 2, ['#ffe082', '#fff', '#ffc233']), 200);
  }

  function move(src, stack, dst, quiet) {
    snap();
    clearHint();
    src.arr.splice(src.arr.length - stack.length, stack.length);
    dst.arr.push(...stack);
    reindex();
    if (save.game === 'klondike') {
      if (dst.t === 'f' && src.t !== 'f') score += 10;
      if (dst.t === 't') { if (src.t === 'waste') score += 5; if (src.t === 'f') score = Math.max(0, score - 15); }
    }
    if (save.game === 'spider') score = Math.max(0, score - 1);
    const flipped = flipExposed();
    if (save.game === 'klondike') score += flipped * 5;
    moves++; startClock();
    render(stack); hud();
    if (dst.t === 'f') { homeFx(stack[0]); Curio.beep(520 + stack[0].r * 30, 0.08, 'triangle', 0.08); window.Cafe?.sound('card', 0.8); buzz(8); }
    else if (!quiet) { Curio.beep(300 + Math.random() * 40, 0.03, 'triangle', 0.03); window.Cafe?.sound('card', 1); }
    afterMove();
  }

  function checkSpiderRuns() {
    let found = 0;
    for (const p of piles.t) {
      const a = p.arr;
      if (a.length < 13) continue;
      const run = a.slice(-13);
      if (run[0].r !== 13 || !run.every((c) => c.up) || !validRun(run)) continue;
      const dst = piles.f.find((f) => !f.arr.length);
      if (!dst) continue;
      a.splice(a.length - 13, 13);
      dst.arr.push(...run);
      reindex();
      score += 100;
      found++;
      const x = run[0].x + M.cw / 2, y = run[0].y;
      popText(x, y, '+100 Run!');
      sparks(x, y + M.ch / 2, ['#ffe082', '#fff', '#4ade80']);
    }
    if (found) {
      flipExposed();
      render(cards.filter((c) => c.pile.t === 'f'));
      hud();
      [660, 880, 1100].forEach((f, k) => setTimeout(() => Curio.beep(f, 0.09, 'triangle', 0.09), k * 80));
      buzz([15, 30, 15]);
    }
  }

  function draw() {
    if (over || auto) return;
    clearHint();
    const st = piles.stock.arr;
    if (save.game === 'spider') {
      if (!st.length) return;
      if (piles.t.some((p) => !p.arr.length)) { Curio.toast('Fill every column before dealing.'); Curio.beep(140, 0.06, 'square', 0.03); return; }
      snap();
      const got = [];
      for (const p of piles.t) { const c = st.pop(); c.up = true; p.arr.push(c); got.push(c); }
      reindex();
      moves++; startClock();
      got.forEach((c, k) => { c.el.style.transition = `transform .28s cubic-bezier(.3, .8, .4, 1) ${k * 45}ms`; setTimeout(() => Curio.beep(600 + k * 25, 0.025, 'triangle', 0.04), k * 45); });
      render(got); hud();
      setTimeout(() => got.forEach((c) => { c.el.style.transition = ''; }), 800);
      afterMove();
      return;
    }
    if (!st.length) {
      if (!piles.waste.arr.length) return;
      snap();
      piles.stock.arr = piles.waste.arr.reverse(); piles.waste.arr = [];
      piles.stock.arr.forEach((c) => { c.up = false; });
      reindex();
      recycles++;
      if (save.draw === 1) score = Math.max(0, score - 100); else if (recycles > 3) score = Math.max(0, score - 20);
      moves++; startClock();
      render(); hud();
      Curio.beep(200, 0.08, 'sine', 0.06);
      return;
    }
    snap();
    const n = Math.min(save.draw, st.length), got = [];
    for (let k = 0; k < n; k++) { const c = st.pop(); c.up = true; piles.waste.arr.push(c); got.push(c); }
    reindex();
    moves++; startClock();
    render(got); hud();
    got.forEach((c, k) => { c.el.classList.add('flip'); setTimeout(() => c.el.classList.remove('flip'), 300); setTimeout(() => Curio.beep(700 + k * 60, 0.025, 'triangle', 0.05), k * 40); });
    afterMove();
  }

  function tryFoundation(c) {
    if (save.game === 'spider') return false;
    const s = stackFrom(c);
    if (!s || s.stack.length !== 1 || s.src.t === 'f') return false;
    for (const p of piles.f) if (canFound(c, p)) { move(s.src, s.stack, p); return true; }
    return false;
  }

  function destinations(s) {
    const out = [];
    const head = s.stack[0];
    for (const p of piles.t) {
      if (p === s.src || !canDrop(s.stack, p)) continue;
      if (!p.arr.length && s.src.t === 't' && s.src.arr.indexOf(head) === 0) continue;
      let pr = p.arr.length ? 3 : 1;
      if (save.game === 'spider' && p.arr.length && top(p.arr).s === head.s) pr = 4;
      out.push({ p, pr });
    }
    for (const p of piles.c) if (p !== s.src && s.src.t !== 'c' && canDrop(s.stack, p)) { out.push({ p, pr: 0 }); break; }
    out.sort((a, b) => b.pr - a.pr);
    return out;
  }

  function autoMove(c) {
    const pl = c.pile;
    if (!pl) return;
    if (pl.t === 'stock') { draw(); return; }
    if (!c.up) return;
    if (tryFoundation(c)) return;
    const s = stackFrom(c);
    if (s) {
      const d = destinations(s);
      if (d.length) { move(s.src, s.stack, d[0].p); return; }
    }
    const stack = s ? s.stack : [c];
    stack.forEach((x) => { x.el.classList.remove('shake'); void x.el.offsetWidth; x.el.classList.add('shake'); });
    if (!s && save.game !== 'klondike' && pl.t === 't') Curio.toast(save.game === 'spider' ? 'Only same-suit runs move together.' : 'That run is not in order.');
    else if (save.game === 'freecell' && s && s.stack.length > 1 && s.stack.length > maxRun(false)) Curio.toast(`Not enough free space to move ${s.stack.length} cards.`);
    Curio.beep(140, 0.06, 'square', 0.03);
  }

  let safeTimer = 0;
  function freecellSafe() {
    if (save.game !== 'freecell' || over) return;
    const fRank = (su) => { const p = piles.f.find((x) => x.arr.length && x.arr[0].s === su); return p ? p.arr.length : 0; };
    for (const p of [...piles.c, ...piles.t]) {
      const c = top(p.arr); if (!c) continue;
      const f = piles.f.find((x) => canFound(c, x)); if (!f) continue;
      if (c.r <= 2 || (isRed(c) ? [0, 3] : [1, 2]).every((su) => fRank(su) >= c.r - 1)) {
        clearTimeout(safeTimer);
        safeTimer = setTimeout(() => { if (!over && c.pile === p && top(p.arr) === c && canFound(c, f)) move(p, [c], f, true); }, 160);
        return;
      }
    }
  }

  function afterMove() {
    if (save.game === 'spider') checkSpiderRuns();
    const full = save.game === 'spider' ? piles.f.every((p) => p.arr.length === 13) : homeCount() === 52;
    if (full) { win(); return; }
    if (auto) return;
    if (save.game === 'klondike' && !piles.stock.arr.length && !piles.waste.arr.length && piles.t.every((p) => p.arr.every((c) => c.up))) autoFinish();
    else if (save.game === 'freecell' && piles.t.every((p) => p.arr.every((c, i) => i === 0 || p.arr[i - 1].r > c.r))) autoFinish();
    else freecellSafe();
  }

  async function autoFinish() {
    auto = true;
    Curio.toast('All sorted. Finishing for you!', 1500);
    await new Promise((r) => setTimeout(r, 450));
    while (homeCount() < 52) {
      let best = null;
      for (const p of [...piles.t, ...piles.c]) {
        const c = top(p.arr);
        if (!c || (best && c.r >= best.c.r)) continue;
        const f = piles.f.find((x) => canFound(c, x));
        if (f) best = { c, p, f };
      }
      if (!best) break;
      best.p.arr.pop(); best.f.arr.push(best.c); reindex();
      if (save.game === 'klondike') score += 10;
      moves++;
      render([best.c]); hud();
      homeFx(best.c);
      Curio.beep(500 + best.c.r * 35, 0.05, 'triangle', 0.07);
      await new Promise((r) => setTimeout(r, 75));
    }
    auto = false;
    if (homeCount() === 52) win();
  }

  let hintEls = [];
  function clearHint() { hintEls.forEach((e) => e.classList.remove('hint')); hintEls = []; }
  function findMoves() {
    const out = [];
    const sources = [...piles.t, ...piles.c, piles.waste];
    for (const src of sources) {
      const a = src.arr;
      for (let i = 0; i < a.length; i++) {
        const c = a[i];
        if (!c.up) continue;
        if (src.t !== 't' && i !== a.length - 1) continue;
        const s = stackFrom(c); if (!s) continue;
        const below = src.t === 't' ? a[i - 1] : null;
        if (s.stack.length === 1 && save.game !== 'spider') for (const f of piles.f) if (canFound(c, f)) out.push({ s, dst: f, pr: 100 - c.r });
        for (const { p } of destinations(s)) {
          let pr = 20;
          if (below && !below.up) pr = 80;
          else if (src.t === 't' && i === 0 && p.arr.length) pr = 60;
          else if (below && below.up) {
            const same = save.game === 'spider' ? below.s === c.s && below.r === c.r + 1 : below.r === c.r + 1 && isRed(below) !== isRed(c);
            if (same) continue;
            pr = save.game === 'spider' && p.arr.length && top(p.arr).s === c.s ? 50 : 10;
          }
          if (src.t === 'waste') pr = 45;
          if (src.t === 'c') pr = 55;
          if (p.t === 'c') pr = 5;
          if (!p.arr.length && src.t === 't' && i === 0) continue;
          out.push({ s, dst: p, pr });
        }
      }
    }
    out.sort((x, y) => y.pr - x.pr);
    return out;
  }
  function hint() {
    if (over || auto) return;
    clearHint();
    usedHint = true;
    const m = findMoves()[0];
    if (m) {
      hintEls = [...m.s.stack.map((c) => c.el), m.dst.arr.length ? top(m.dst.arr).el : slots[`${m.dst.t}${m.dst.i}`]];
      Curio.beep(990, 0.06, 'sine', 0.06);
    } else if (piles.stock.arr.length || (save.game === 'klondike' && piles.waste.arr.length)) {
      hintEls = [piles.stock.arr.length ? top(piles.stock.arr).el : slots.stock];
      Curio.toast(save.game === 'spider' ? 'No good moves. Deal from the stock.' : 'Nothing on the table. Draw a card.');
    } else { Curio.toast('No moves left. Try undo or a new deal.'); Curio.beep(160, 0.12, 'sawtooth', 0.04); return; }
    hintEls.forEach((e) => e.classList.add('hint'));
    setTimeout(clearHint, 2600);
  }

  function unlock(id) {
    if (save.ach[id]) return;
    save.ach[id] = Date.now(); persist();
    const a = ACH.find((x) => x[0] === id);
    if (a) setTimeout(() => Curio.toast(`${a[1]} Badge unlocked: ${a[2]}`, 2600), 1200);
  }

  async function win() {
    if (over) return;
    over = true; ticking = false;
    const secs = Math.max(1, Math.round(elapsed));
    let bonus = 0;
    if (save.game === 'klondike') bonus = secs >= 30 ? Math.round(700000 / secs) : 0;
    score += bonus; hud();
    const st = statsOf();
    if (!counted) { st.played++; counted = true; }
    st.won++; st.streak++; st.bestStreak = Math.max(st.bestStreak, st.streak);
    const newBestTime = !st.best || secs < st.best; if (newBestTime) st.best = secs;
    const newBestScore = save.game !== 'freecell' && score > (st.bestScore || 0); if (newBestScore) st.bestScore = score;
    save.totalWins = (save.totalWins || 0) + 1;
    persist();
    if (save.game === 'klondike') { unlock('k'); if (save.draw === 3) unlock('k3'); }
    if (save.game === 'freecell') unlock('fc');
    if (save.game === 'spider') unlock(`s${save.suits}`);
    if (secs < 180) unlock('fast');
    if (!usedUndo) unlock('clean');
    if (!usedHint) unlock('nohint');
    if (isDaily) unlock('daily');
    if (st.streak >= 3) unlock('streak');
    if (save.totalWins >= 10) unlock('ten');
    paintStats();
    [523, 659, 784, 1047, 1319].forEach((f, k) => setTimeout(() => Curio.beep(f, 0.16, 'triangle', 0.1), k * 120));
    buzz([30, 50, 30, 50, 80]);
    await new Promise((r) => setTimeout(r, 350));
    await bounce();
    Curio.confetti();
    const body = document.createElement('div');
    const tiles = [[fmtT(secs), 'Time'], [moves, 'Moves'], save.game === 'freecell' ? [`#${dealNo}`, 'Deal'] : [Curio.fmt(score), 'Score'], [st.won, 'Wins']];
    body.innerHTML = `<div style="display:flex;gap:6px;justify-content:center;margin:6px 0 10px">${tiles.map(([v, l]) => `<div class="c-stat" style="min-width:62px"><b>${v}</b><span>${l}</span></div>`).join('')}</div>`;
    const p = document.createElement('div');
    p.textContent = `${newBestTime ? 'Fastest win yet! ' : `Best time: ${fmtT(st.best)}. `}${bonus ? `Includes a ${Curio.fmt(bonus)} speed bonus. ` : ''}Win streak: ${st.streak}.`;
    body.append(p);
    const v = await Curio.modal({ emoji: save.game === 'spider' ? '🕷️' : save.game === 'freecell' ? '🧊' : '🃏', title: isDaily ? 'Daily deal cleared!' : 'You won!', body, buttons: [{ label: 'Deal again', value: 'again' }, { label: 'Share', value: 'share' }, { label: 'Admire the table', value: 'x' }] });
    document.querySelectorAll('.win-canvas').forEach((e) => e.remove());
    if (v === 'share') {
      const label = save.game === 'klondike' ? `Klondike draw ${save.draw}` : save.game === 'spider' ? `Spider ${save.suits} suit${save.suits > 1 ? 's' : ''}` : 'FreeCell';
      try { await navigator.clipboard.writeText(`🃏 Zoble Solitaire: ${label}${isDaily ? ' daily' : ''} deal #${dealNo} won in ${fmtT(secs)} and ${moves} moves.`); Curio.toast('Result copied!'); } catch { Curio.toast('Could not reach the clipboard.'); }
    }
    if (v === 'again') newGame();
  }

  const PATHS = SUIT_PATHS.map((d) => { try { return new Path2D(d); } catch { return null; } });
  function drawCard(g, c, x, y, w, h) {
    const r = w * 0.09;
    g.fillStyle = '#fffdf8'; g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = isRed(c) ? '#d32f2f' : '#1d1b19';
    g.font = `900 ${w * 0.26}px system-ui, sans-serif`; g.textAlign = 'left'; g.textBaseline = 'top';
    g.fillText(RANKS[c.r], x + w * 0.07, y + w * 0.06);
    const P = PATHS[c.s];
    if (P) { g.save(); g.translate(x + w * 0.22, y + h * 0.36); g.scale(w * 0.0056, w * 0.0056); g.fill(P); g.restore(); }
  }

  function bounce() {
    return new Promise((resolve) => {
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { resolve(); return; }
      const cv = document.createElement('canvas'); cv.className = 'win-canvas';
      cv.setAttribute('aria-label', 'Victory animation, tap to skip');
      const dpr = Math.min(2, devicePixelRatio || 1);
      cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; cv.style.width = '100%'; cv.style.height = '100%';
      document.body.append(cv);
      const g = cv.getContext('2d'); g.scale(dpr, dpr);
      const rect = layer.getBoundingClientRect();
      const queue = [];
      const sp = slotPos();
      for (let r = 13; r >= 1; r--) piles.f.forEach((p, f) => { const c = p.arr.find((q) => q.r === r); if (c) queue.push({ c, col: sp[`f${f}`] }); });
      const live = [], W = innerWidth, H = innerHeight, w = M.cw, h = M.ch;
      let frame = 0, done = false;
      const finish = () => {
        if (done) return;
        done = true;
        cards.forEach((c) => { c.el.style.visibility = ''; });
        cv.style.transition = 'opacity .5s'; cv.style.opacity = '0';
        setTimeout(() => cv.remove(), 500);
        resolve();
      };
      cv.addEventListener('pointerdown', finish);
      const launch = () => {
        const q = queue.shift(); if (!q) return;
        q.c.el.style.visibility = 'hidden';
        live.push({ c: q.c, x: rect.left + M.colX(q.col), y: rect.top, vx: (Math.random() < 0.5 ? -1 : 1) * (2.5 + Math.random() * 4.5), vy: -2 - Math.random() * 7 });
        Curio.beep(300 + Math.random() * 500, 0.03, 'triangle', 0.03);
      };
      const limit = save.game === 'spider' ? 60 * 10 : 60 * 14;
      (function tick() {
        if (done) return;
        if (document.hidden) { requestAnimationFrame(tick); return; }
        if (frame % (save.game === 'spider' ? 6 : 11) === 0 && live.length < 6) launch();
        frame++;
        for (let k = live.length - 1; k >= 0; k--) {
          const p = live[k];
          p.vy += 0.5; p.x += p.vx; p.y += p.vy;
          if (p.y + h > H) { p.y = H - h; p.vy = -p.vy * 0.78; }
          drawCard(g, p.c, p.x, p.y, w, h);
          if (p.x + w < 0 || p.x > W) live.splice(k, 1);
        }
        if ((!queue.length && !live.length) || frame > limit) { setTimeout(finish, 250); return; }
        requestAnimationFrame(tick);
      })();
    });
  }

  function dropTarget(p) {
    const head = p.info.stack[0], { cw, ch } = M;
    const hx = head.x + p.dx, hy = head.y + p.dy;
    let best = null, bestA = 0;
    const sp = slotPos();
    const consider = (pile, x, y, extra = 0) => {
      const ox = Math.max(0, Math.min(hx + cw, x + cw) - Math.max(hx, x)), oy = Math.max(0, Math.min(hy + ch, y + ch + extra) - Math.max(hy, y));
      const a = ox * oy;
      if (a > bestA) { bestA = a; best = pile; }
    };
    for (const f of piles.f) if (f !== p.info.src && canDrop(p.info.stack, f)) consider(f, M.colX(sp[`f${f.i}`]), 0);
    for (const c of piles.c) if (c !== p.info.src && canDrop(p.info.stack, c)) consider(c, M.colX(sp[`c${c.i}`]), 0);
    for (const t of piles.t) {
      if (t === p.info.src || !canDrop(p.info.stack, t)) continue;
      const tp = top(t.arr);
      consider(t, M.colX(t.i), tp ? tp.y : M.y0, ch * 0.3);
    }
    return best;
  }
  let ptr = null, lastTap = { id: -1, t: 0 }, wantUnlatch = false;
  const noDrag = () => { wantUnlatch = true; };
  Curio.drag(layer, {
    start(p) {
      ptr = null;
      if (over || auto) { noDrag(); return; }
      const el = p.event.target.closest('.card, .slot');
      if (!el) { noDrag(); return; }
      const c = el.classList.contains('card') ? cards[+el.dataset.id] : null;
      if (el.dataset.slot === 'stock' || (c && c.pile.t === 'stock')) { draw(); noDrag(); return; }
      if (!c) { noDrag(); return; }
      const info = stackFrom(c);
      if (!info) { autoMove(c); noDrag(); return; }
      ptr = { x: p.clientX, y: p.clientY, c, drag: false, info };
      if (Curio.touchpad && p.pointerType === 'mouse') info.stack.forEach((x) => x.el.classList.add('hl'));
    },
    move(p) {
      if (!ptr) return;
      const dx = p.clientX - ptr.x, dy = p.clientY - ptr.y;
      if (!ptr.drag && Math.hypot(dx, dy) < 6) return;
      if (!ptr.drag) { ptr.drag = true; clearHint(); ptr.info.stack.forEach((c) => c.el.classList.add('drag')); }
      ptr.dx = dx; ptr.dy = dy;
      ptr.info.stack.forEach((c, k) => { c.el.style.transform = `translate(${c.x + dx}px, ${c.y + dy}px)`; c.el.style.zIndex = 1000 + k; });
      const t = dropTarget(ptr);
      Object.values(slots).forEach((x) => x.classList.remove('hot'));
      cards.forEach((c) => { if (!ptr.info.stack.includes(c)) c.el.classList.remove('hl'); });
      if (t) { if (t.arr.length) top(t.arr).el.classList.add('hl'); else slots[`${t.t}${t.i}`]?.classList.add('hot'); }
    },
    end(p) {
      const pt = ptr; ptr = null;
      Object.values(slots).forEach((x) => x.classList.remove('hot'));
      cards.forEach((c) => c.el.classList.remove('hl'));
      if (!pt) return;
      if (pt.drag) {
        pt.info.stack.forEach((c) => c.el.classList.remove('drag'));
        const t = p ? dropTarget(pt) : null;
        if (t) move(pt.info.src, pt.info.stack, t);
        else { render(pt.info.stack); Curio.beep(160, 0.05, 'sine', 0.04); }
        return;
      }
      if (!p) return;
      const now = performance.now();
      if (lastTap.id === pt.c.id && now - lastTap.t < 380) return;
      lastTap = { id: pt.c.id, t: now };
      autoMove(pt.c);
    }
  });
  addEventListener('pointerup', () => { if (wantUnlatch) { wantUnlatch = false; if (Curio.touchpad) window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); } });
  layer.addEventListener('dblclick', (e) => {
    const el = e.target.closest('.card'); if (!el || over || auto) return;
    const c = cards[+el.dataset.id];
    if (c.pile.t !== 'stock') tryFoundation(c);
  });
  layer.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const el = e.target.closest('.card, .slot'); if (!el) return;
    e.preventDefault();
    if (el.classList.contains('slot')) { if (el.dataset.slot === 'stock') draw(); return; }
    const c = cards[+el.dataset.id];
    const id = c.id;
    autoMove(c);
    requestAnimationFrame(() => cards[id]?.el.focus({ preventScroll: true }));
  });
  addEventListener('keydown', (e) => {
    if (document.querySelector('.curio-modal') || e.target instanceof HTMLInputElement) return;
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === 'd') draw();
    else if (k === 'u') undo();
    else if (k === 'h') hint();
    else if (k === 'n') $('new').click();
  });

  async function confirmNew() {
    if (moves > 0 && !over) {
      const v = await Curio.modal({ emoji: '🤔', title: 'Abandon this game?', body: 'It will count as a loss and the cards will be gathered up.', buttons: [{ label: 'Yes, new game', value: 'y' }, { label: 'Keep playing', value: 'n' }] });
      if (v === 'y') { statsOf().streak = 0; persist(); }
      return v === 'y';
    }
    return true;
  }

  function paintChrome() {
    document.querySelectorAll('#games button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.g === save.game)));
    const opts = $('opts');
    if (save.game === 'klondike') opts.innerHTML = '<button type="button" data-draw="1">Draw 1</button><button type="button" data-draw="3">Draw 3</button>';
    else if (save.game === 'spider') opts.innerHTML = '<button type="button" data-suits="1">1 suit</button><button type="button" data-suits="2">2 suits</button><button type="button" data-suits="4">4 suits</button>';
    else opts.innerHTML = '<button type="button" disabled aria-pressed="true">4 free cells</button>';
    opts.querySelectorAll('button').forEach((b) => { if (b.dataset.draw) b.setAttribute('aria-pressed', String(+b.dataset.draw === save.draw)); if (b.dataset.suits) b.setAttribute('aria-pressed', String(+b.dataset.suits === save.suits)); });
    $('sub').textContent = G.sub;
    $('dealno').textContent = `${isDaily ? '📅 Daily deal' : 'Deal'} #${Curio.fmt(dealNo)}`;
    $('rules-name').textContent = G.name;
    $('rules').innerHTML = G.rules.map((r) => `<li>${r}</li>`).join('');
    paintStats();
  }

  function paintStats() {
    const st = statsOf();
    const label = save.game === 'klondike' ? `Klondike, draw ${save.draw}` : save.game === 'spider' ? `Spider, ${save.suits} suit${save.suits > 1 ? 's' : ''}` : 'FreeCell';
    const pct = st.played ? Math.round((st.won / st.played) * 100) : 0;
    $('st-grid').innerHTML = [[st.played, 'Played'], [st.won, 'Won'], [`${pct}%`, 'Win rate'], [st.best ? fmtT(st.best) : '-', 'Best time'], [st.streak, 'Streak'], [st.bestStreak, 'Best streak'], [save.totalWins || 0, 'All wins'], [Object.keys(save.ach).length, 'Badges']]
      .map(([v, l]) => `<div class="c-stat"><b>${v}</b><span>${l}</span></div>`).join('') + `<p class="c-muted" style="grid-column:1/-1;margin:0;font-size:13px">Showing ${label}.</p>`;
    $('achs').innerHTML = ACH.map(([id, e, n, d]) => `<div class="ach${save.ach[id] ? ' on' : ''}" title="${d}"><span>${e}</span><div><b>${n}</b>${d}</div></div>`).join('');
    $('ach-count').textContent = `${Object.keys(save.ach).length}/${ACH.length}`;
  }

  function buildLook() {
    for (const [id, name] of BACKS) {
      const b = document.createElement('button');
      b.type = 'button'; b.dataset.id = id; b.title = name; b.setAttribute('aria-label', `${name} card back`);
      b.innerHTML = `<span class="back" data-b="${id}" style="position:absolute;inset:0;border-radius:5px"></span>`;
      b.addEventListener('click', () => { save.back = id; persist(); applyLook(); Curio.beep(760, 0.04, 'sine', 0.06); });
      $('backs').append(b);
    }
    for (const [id, name, a, z] of FELTS) {
      const b = document.createElement('button');
      b.type = 'button'; b.dataset.id = id; b.title = name; b.setAttribute('aria-label', `${name} table`);
      b.style.background = `radial-gradient(circle at 40% 35%, ${a}, ${z})`;
      b.addEventListener('click', () => { save.felt = id; persist(); applyLook(); Curio.beep(620, 0.04, 'sine', 0.06); });
      $('felts').append(b);
    }
  }
  function applyLook() {
    const f = FELTS.find((x) => x[0] === save.felt) || FELTS[0];
    table.style.setProperty('--felt', f[2]); table.style.setProperty('--felt-2', f[3]);
    table.dataset.felt = f[0];
    cards.forEach((c) => { c.el.querySelector('.back').dataset.b = save.back; });
    $('backs').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === save.back)));
    $('felts').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === save.felt)));
  }

  $('undo').addEventListener('click', undo);
  $('hint').addEventListener('click', hint);
  $('new').addEventListener('click', async () => { if (!auto && await confirmNew()) newGame(); });
  $('restart').addEventListener('click', async () => { if (!auto && await confirmNew()) newGame(dealNo, isDaily); });
  $('daily').addEventListener('click', async () => { if (!auto && await confirmNew()) { newGame(dailySeed(), true); Curio.toast('Today\'s deal. Everyone gets the same cards!'); } });
  $('games').addEventListener('click', async (e) => {
    const b = e.target.closest('button'); if (!b || b.dataset.g === save.game || auto) return;
    if (!(await confirmNew())) return;
    save.game = b.dataset.g; persist();
    newGame();
  });
  $('opts').addEventListener('click', async (e) => {
    const b = e.target.closest('button'); if (!b || auto || b.disabled) return;
    if (b.dataset.draw && +b.dataset.draw === save.draw) return;
    if (b.dataset.suits && +b.dataset.suits === save.suits) return;
    if (!(await confirmNew())) return;
    if (b.dataset.draw) { save.draw = +b.dataset.draw; Curio.store.set('sol:draw', save.draw); }
    if (b.dataset.suits) save.suits = +b.dataset.suits;
    persist();
    newGame();
  });
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { layout(); render(); }, 80); });

  buildLook();
  layout();
  newGame();
  applyLook();
  window.__sol = {
    get state() { return { stock: piles.stock.arr, waste: piles.waste.arr, found: piles.f.map((p) => p.arr), tab: piles.t.map((p) => p.arr), cells: piles.c.map((p) => p.arr), score, moves, over, dealNo, game: save.game }; },
    get cards() { return cards; }, piles: () => piles, draw, autoMove, undo, move, canDrop, hint, findMoves, win, newGame,
    setGame(g, opt) { save.game = g; if (g === 'spider' && opt) save.suits = opt; if (g === 'klondike' && opt) save.draw = opt; persist(); newGame(); }
  };
  if (!Curio.touchpad && !Curio.store.get('padtip:solitaire', false)) { Curio.store.set('padtip:solitaire', true); setTimeout(() => Curio.toast('Tip: on a laptop touchpad? Turn on Touchpad mode in the top bar.', 3400), 2200); }
})();
