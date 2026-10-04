(() => {
  const E = window.ChessEngine;
  const $ = (id) => document.getElementById(id);
  const boardEl = $('board');
  const wrapEl = $('board-wrap');
  const SYM = ['', 'P', 'N', 'B', 'R', 'Q', 'K'];
  const NAMES = ['', 'pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];
  const VALUE = [0, 1, 3, 3, 5, 9, 0];
  const PUZZLES = window.CHESS_PUZZLES || [];
  const OPENINGS = (window.CHESS_OPENINGS || []).map(([moves, name]) => [moves.split(' '), name]);
  const BOARDS = [
    { id: 'walnut', name: 'Walnut', l: '#f0d9b5', d: '#b58863', f: '#6b4a37', f2: '#3e2a22', hi: '#8c654b' },
    { id: 'club', name: 'Tournament', l: '#eeeed2', d: '#769656', f: '#3d5a32', f2: '#22351c', hi: '#567a48' },
    { id: 'ice', name: 'Glacier', l: '#e6eef3', d: '#7f9db3', f: '#3b5266', f2: '#1f2f3d', hi: '#577390' },
    { id: 'rose', name: 'Rosewood', l: '#f6e3df', d: '#c48a86', f: '#7a3e48', f2: '#45202a', hi: '#9a5a62' },
    { id: 'slate', name: 'Slate', l: '#c9ccd3', d: '#6d7486', f: '#2b303c', f2: '#14171e', hi: '#454c5d' },
    { id: 'candy', name: 'Sherbet', l: '#fff3da', d: '#f59f7a', f: '#e2603f', f2: '#a63a20', hi: '#ff8a5c' },
    { id: 'violet', name: 'Amethyst', l: '#ece4f7', d: '#9a7cc4', f: '#523a78', f2: '#2c1d45', hi: '#6f53a0' },
    { id: 'sand', name: 'Desert', l: '#f3e7c9', d: '#d2a85f', f: '#8a6430', f2: '#4f3814', hi: '#a77d42' }
  ];
  const PIECES = [{ id: 'classic', name: 'Ivory and ebony' }, { id: 'gold', name: 'Gold and onyx' }, { id: 'mint', name: 'Mint and plum' }, { id: 'flat', name: 'Flat ink' }];
  const ACH = [
    ['first', '🏆', 'First win', 'Beat the computer once'],
    ['medium', '🥈', 'Club player', 'Beat the Medium AI'],
    ['hard', '🥇', 'Giant slayer', 'Beat the Hard AI'],
    ['black', '♚', 'Dark side', 'Win a game as Black'],
    ['quick', '⚡', 'Blitzkrieg', 'Mate the AI in 25 moves or fewer'],
    ['clean', '🧼', 'No take-backs', 'Beat Medium or Hard with no undo or hint'],
    ['promo', '👑', 'Coronation', 'Promote a pawn'],
    ['under', '🐴', 'Underpromoter', 'Promote to something other than a queen'],
    ['ep', '👻', 'En passant', 'Capture en passant'],
    ['p1', '🧩', 'Puzzled', 'Solve your first puzzle'],
    ['p10', '🔟', 'Tactician', 'Solve 10 puzzles'],
    ['p30', '🧠', 'Pattern master', 'Solve 30 puzzles'],
    ['pall', '🌟', 'Completionist', 'Solve every puzzle'],
    ['m3', '🔮', 'Deep sight', 'Solve a mate in 3'],
    ['streak', '🔥', 'On fire', 'Solve 5 puzzles in a row with no mistakes'],
    ['daily', '📅', 'Daily habit', 'Solve a daily puzzle']
  ];

  const SAVE_V = 2;
  const loadSave = () => {
    const raw = Curio.store.get('chess:v2', null);
    const base = { v: SAVE_V, board: 'walnut', pieces: 'classic', dots: true, coords: true, eval: true, solved: {}, ach: {}, streak: 0, bestStreak: 0, daily: {}, games: 0, hints: 0, puzFilter: '0' };
    if (!raw || typeof raw !== 'object' || raw.v !== SAVE_V) return base;
    return { ...base, ...raw, solved: raw.solved || {}, ach: raw.ach || {}, daily: raw.daily || {} };
  };
  const save = loadSave();
  const persist = () => Curio.store.set('chess:v2', save);

  let mode = Curio.store.get('chess:mode', 'medium');
  if (!['easy', 'medium', 'hard', 'two', 'puzzle'].includes(mode)) mode = 'medium';
  let human = Curio.store.get('chess:side', 1) === -1 ? -1 : 1;
  if (Curio.simple) { mode = 'medium'; human = 1; }
  const records = Curio.store.get('chess:records', {});
  const rec = () => (records[mode] ||= { w: 0, l: 0, d: 0 });

  let s, legal, sanLog, keys, snaps, last, over, busy, sel, flipped, token = 0, pendingAnim = null, result = null;
  let usedHelp = false, hintMove = null, evalScore = null, evalMate = 0;
  let puz = null;

  const pieceSvg = (p) => `<span class="pc ${p > 0 ? 'w' : 'b'}"><svg viewBox="0 0 45 45" aria-hidden="true"><use href="#p${SYM[Math.abs(p)]}"/></svg></span>`;
  const uci = (m) => E.name(m.f) + E.name(m.t) + (m.pr ? 'nbrq'[Math.abs(m.pr) - 2] : '');
  const sqName = (str) => (str.charCodeAt(1) - 49) * 16 + (str.charCodeAt(0) - 97);

  const squares = [];
  for (let v = 0; v < 64; v++) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'sq';
    el.setAttribute('role', 'gridcell');
    el.dataset.v = v;
    el.addEventListener('click', (e) => { if (e.detail === 0) tapSquare(sqOf(v)); });
    boardEl.append(el);
    squares.push(el);
  }
  const sqOf = (v) => { const row = v >> 3, col = v & 7; return flipped ? row * 16 + (7 - col) : (7 - row) * 16 + col; };
  const viewOf = (sq) => { const r = sq >> 4, f = sq & 7; return flipped ? r * 8 + (7 - f) : (7 - r) * 8 + f; };

  function spawnWorker(onmsg) {
    try {
      const src = `const E=(${window.chessEngine.toString()})();onmessage=(e)=>{postMessage({id:e.data.id,fen:e.data.fen,r:E.think(e.data.fen,e.data.level)});};`;
      const url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
      const w = new Worker(url);
      w.onmessage = (e) => onmsg(e.data);
      return w;
    } catch { return null; }
  }
  let worker = null, anaWorker = null, anaId = 0, anaBusy = false, anaQueued = null;
  const makeWorker = () => { worker = spawnWorker((d) => onAI(d)); if (worker) worker.onerror = () => { worker = null; }; };
  const makeAna = () => { anaWorker = spawnWorker((d) => onAna(d)); if (anaWorker) anaWorker.onerror = () => { anaWorker = null; }; };
  makeWorker(); makeAna();

  const isPuzzle = () => mode === 'puzzle';
  const aiColor = () => (mode === 'two' || isPuzzle() ? 0 : -human);
  const isHumanTurn = () => !over && (mode === 'two' || (isPuzzle() ? puz && !puz.done && s.turn === puz.side : s.turn === human));

  function applyLook() {
    const b = BOARDS.find((x) => x.id === save.board) || BOARDS[0];
    const st = document.documentElement.style;
    st.setProperty('--sq-l', b.l); st.setProperty('--sq-d', b.d); st.setProperty('--frame', b.f); st.setProperty('--frame-2', b.f2); st.setProperty('--frame-hi', b.hi);
    document.body.dataset.pieces = save.pieces;
    boardEl.classList.toggle('nodots', !save.dots);
    boardEl.classList.toggle('nocoords', !save.coords);
    boardEl.classList.add('tex');
    $('evalbar').hidden = !save.eval;
    $('opt-dots').checked = save.dots; $('opt-coords').checked = save.coords; $('opt-eval').checked = save.eval;
    $('boards').querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.id === save.board)));
    $('pieces').querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.id === save.pieces)));
  }

  function buildLookPickers() {
    for (const b of BOARDS) {
      const el = document.createElement('button');
      el.type = 'button'; el.className = 'swatch'; el.dataset.id = b.id; el.title = b.name; el.setAttribute('aria-label', `${b.name} board`);
      el.innerHTML = `<i style="background:${b.l}"></i><i style="background:${b.d}"></i><i style="background:${b.d}"></i><i style="background:${b.l}"></i>`;
      el.addEventListener('click', () => { save.board = b.id; persist(); applyLook(); Curio.beep(700, 0.04, 'sine', 0.06); });
      $('boards').append(el);
    }
    for (const p of PIECES) {
      const el = document.createElement('button');
      el.type = 'button'; el.className = 'pswatch'; el.dataset.id = p.id; el.title = p.name; el.setAttribute('aria-label', `${p.name} pieces`);
      el.innerHTML = `<span data-pieces="${p.id}" style="position:absolute;inset:0">${pieceSvg(2)}${pieceSvg(-5)}</span>`;
      el.addEventListener('click', () => { save.pieces = p.id; persist(); applyLook(); Curio.beep(760, 0.04, 'sine', 0.06); });
      $('pieces').append(el);
    }
    const opt = (id, key) => $(id).addEventListener('change', (e) => { save[key] = e.target.checked; persist(); applyLook(); if (key === 'eval' && save.eval) requestEval(); });
    opt('opt-dots', 'dots'); opt('opt-coords', 'coords'); opt('opt-eval', 'eval');
  }

  function unlock(id) {
    if (save.ach[id]) return;
    save.ach[id] = Date.now(); persist();
    const a = ACH.find((x) => x[0] === id);
    if (a) {
      setTimeout(() => { Curio.toast(`${a[1]} Badge unlocked: ${a[2]}`, 2600); [784, 988, 1175].forEach((f, k) => setTimeout(() => Curio.beep(f, 0.09, 'triangle', 0.08), k * 80)); }, 400);
    }
    paintAch();
  }

  function paintAch() {
    const box = $('achs');
    box.replaceChildren();
    let n = 0;
    for (const [id, emo, name, desc] of ACH) {
      const on = !!save.ach[id]; if (on) n++;
      const d = document.createElement('div');
      d.className = 'ach' + (on ? ' on' : '');
      d.innerHTML = `<span>${emo}</span><div><b></b></div>`;
      d.querySelector('b').textContent = name;
      d.querySelector('div').append(desc);
      d.title = desc;
      box.append(d);
    }
    $('ach-count').textContent = `${n}/${ACH.length}`;
    const tot = ['easy', 'medium', 'hard'].reduce((a, k) => { const r = records[k] || { w: 0, l: 0, d: 0 }; return [a[0] + r.w, a[1] + r.l, a[2] + r.d]; }, [0, 0, 0]);
    const solved = Object.keys(save.solved).length;
    $('statgrid').innerHTML = [[tot[0], 'Wins'], [tot[1], 'Losses'], [tot[2], 'Draws'], [solved, 'Puzzles'], [save.bestStreak, 'Best streak'], [save.hints, 'Hints used']]
      .map(([v, l]) => `<div class="c-stat"><b>${v}</b><span>${l}</span></div>`).join('');
  }

  function resetBoardState(fen) {
    s = E.fromFEN(fen);
    sanLog = []; keys = [E.positionKey(s)]; snaps = []; last = null; over = false; busy = false; sel = null; result = null; hintMove = null;
    $('result').hidden = true;
  }

  function newGame() {
    token++;
    if (busy && worker) { worker.terminate(); makeWorker(); }
    if (isPuzzle()) { loadPuzzle(puz ? puz.idx : firstUnsolved()); return; }
    resetBoardState(E.START);
    usedHelp = false;
    flipped = mode !== 'two' && human < 0;
    evalScore = 20; evalMate = 0;
    document.querySelector('.curio-modal')?.remove();
    layoutPanels();
    refresh();
    requestEval();
    if (s.turn === aiColor()) aiTurn();
  }

  function layoutPanels() {
    const p = isPuzzle();
    $('play-card').hidden = p;
    $('puz-card').hidden = !p;
    $('puz-list').hidden = !p;
    $('sides').style.visibility = mode === 'two' || p ? 'hidden' : '';
  }

  function refresh() {
    legal = E.legal(s);
    render();
  }

  function render() {
    const targets = new Map();
    if (sel != null) for (const m of legal) if (m.f === sel) targets.set(m.t, !!m.c);
    const checkSq = E.inCheck(s) ? s.kings[s.turn > 0 ? 0 : 1] : -1;
    const movable = new Set(isHumanTurn() && !busy ? legal.map((m) => m.f) : []);
    for (let v = 0; v < 64; v++) {
      const sq = sqOf(v), el = squares[v];
      const r = sq >> 4, f = sq & 7, p = s.b[sq];
      el.className = 'sq' + ((r + f) % 2 === 0 ? ' d' : '');
      if (last && (last.f === sq || last.t === sq)) el.classList.add('last');
      if (hintMove && hintMove.f === sq && !hintMove.arrow) el.classList.add('hintsq');
      if (sq === sel) el.classList.add('sel');
      if (sq === checkSq) el.classList.add('check');
      if (targets.has(sq)) el.classList.add('hint');
      if (targets.get(sq)) el.classList.add('cap');
      let html = '';
      if ((v & 7) === 0) html += `<span class="coord r">${r + 1}</span>`;
      if (v >> 3 === 7) html += `<span class="coord f">${'abcdefgh'[f]}</span>`;
      if (p) html += pieceSvg(p);
      el.innerHTML = html;
      el.setAttribute('aria-label', `${E.name(sq)}${p ? `, ${p > 0 ? 'white' : 'black'} ${NAMES[Math.abs(p)]}` : ''}${targets.has(sq) ? ', legal move' : ''}${movable.has(sq) ? ', can move' : ''}`);
    }
    if (pendingAnim) { animate(pendingAnim); pendingAnim = null; }
    paintArrows();
    paintStatus();
    paintCaps();
    paintHistory();
    paintEval();
    $('undo').disabled = !snaps.length;
    $('hint').disabled = !isHumanTurn() || busy;
    $('record').textContent = isPuzzle() ? `Puzzles solved: ${Object.keys(save.solved).length} of ${PUZZLES.length} · streak ${save.streak}` : mode === 'two' ? 'Two players on one device. Flip the board between turns if you like.' : `Record vs ${mode} AI: ${rec().w} won · ${rec().l} lost · ${rec().d} drawn`;
    document.querySelectorAll('#modes button').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.mode === mode)));
    document.querySelectorAll('#sides button').forEach((x) => x.setAttribute('aria-pressed', String(+x.dataset.side === human)));
    boardEl.setAttribute('aria-label', `Chess board, ${flipped ? 'black' : 'white'} at the bottom`);
  }

  function paintArrows() {
    const svg = $('arrows');
    if (!hintMove || !hintMove.arrow) { svg.innerHTML = ''; return; }
    const c = (sq) => { const v = viewOf(sq); return [(v & 7) + 0.5, (v >> 3) + 0.5]; };
    const [x1, y1] = c(hintMove.f), [x2, y2] = c(hintMove.t);
    const a = Math.atan2(y2 - y1, x2 - x1), len = Math.hypot(x2 - x1, y2 - y1) - 0.32;
    const ex = x1 + Math.cos(a) * len, ey = y1 + Math.sin(a) * len;
    const hx = x1 + Math.cos(a) * (len + 0.3), hy = y1 + Math.sin(a) * (len + 0.3);
    const px = Math.cos(a + Math.PI / 2) * 0.24, py = Math.sin(a + Math.PI / 2) * 0.24;
    svg.innerHTML = `<g opacity=".82"><line x1="${x1}" y1="${y1}" x2="${ex}" y2="${ey}" stroke="#1fae6a" stroke-width=".2" stroke-linecap="round"/><path d="M${hx} ${hy}L${ex + px} ${ey + py}L${ex - px} ${ey - py}z" fill="#1fae6a"/></g>`;
  }

  function animate(m) {
    const moves = [[m.f, m.t]];
    if (m.fl === 3) moves.push(m.t > m.f ? [m.f + 3, m.f + 1] : [m.f - 4, m.f - 1]);
    for (const [a, b] of moves) {
      const pc = squares[viewOf(b)].querySelector('.pc');
      if (!pc) continue;
      const va = viewOf(a), vb = viewOf(b);
      const dx = ((va & 7) - (vb & 7)) * 108.7, dy = ((va >> 3) - (vb >> 3)) * 108.7;
      pc.style.transition = 'none';
      pc.style.transform = `translate(${dx}%, ${dy}%)`;
      pc.getBoundingClientRect();
      pc.style.transition = '';
      pc.style.transform = '';
    }
  }

  function burst(sq, colors, ring) {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const fx = $('fx'), v = viewOf(sq);
    const cx = ((v & 7) + 0.5) * 12.5, cy = ((v >> 3) + 0.5) * 12.5;
    if (ring) {
      const r = document.createElement('i'); r.className = 'ring';
      r.style.left = `${cx - 6.25}%`; r.style.top = `${cy - 6.25}%`;
      fx.append(r); setTimeout(() => r.remove(), 600);
    }
    for (let k = 0; k < 12; k++) {
      const b = document.createElement('i'); b.className = 'bit';
      const a = (k / 12) * Math.PI * 2 + Math.random() * 0.4, d = 26 + Math.random() * 26;
      b.style.left = `calc(${cx}% - 3px)`; b.style.top = `calc(${cy}% - 3px)`;
      b.style.background = colors[k % colors.length];
      b.style.setProperty('--dx', `${Math.cos(a) * d}px`); b.style.setProperty('--dy', `${Math.sin(a) * d}px`);
      fx.append(b); setTimeout(() => b.remove(), 650);
    }
  }

  function openingName() {
    if (!sanLog.length || isPuzzle()) return '';
    const clean = sanLog.map((x) => x.replace(/[+#]/g, ''));
    let best = '', bl = 0;
    for (const [seq, name] of OPENINGS) {
      if (seq.length > clean.length || seq.length <= bl) continue;
      if (seq.every((x, k) => x === clean[k])) { best = name; bl = seq.length; }
    }
    return best;
  }

  function paintStatus() {
    const st = $('status');
    const op = openingName();
    $('opening').innerHTML = op ? `📖 <b></b>` : '';
    if (op) $('opening').querySelector('b').textContent = op;
    if (isPuzzle()) { paintPuzzle(); return; }
    if (over) { st.innerHTML = result.html; return; }
    const side = s.turn > 0 ? 'White' : 'Black';
    const check = E.inCheck(s);
    let note = '';
    if (s.half >= 80) note = `<small>${Math.floor(s.half / 2)}/50 moves without a capture or pawn move.</small>`;
    if (mode === 'two') st.innerHTML = `${check ? 'Check! ' : ''}${side} to move.${note || '<small>Pass and play.</small>'}`;
    else if (s.turn === human) st.innerHTML = check ? `Check! Get out of it.${note}` : `Your move.${note || `<small>You are ${human > 0 ? 'White' : 'Black'}.</small>`}`;
    else st.innerHTML = `AI is thinking<span class="think"><i></i><i></i><i></i></span>${note}`;
  }

  function paintCaps() {
    const count = (p) => { let n = 0; for (let i = 0; i < 120; i++) if (!(i & 0x88) && s.b[i] === p) n++; return n; };
    const START_N = [0, 8, 2, 2, 2, 1];
    const taken = { 1: [], '-1': [] };
    let mat = 0;
    for (const c of [1, -1]) for (let t = 5; t >= 1; t--) {
      const n = count(t * c);
      mat += c * n * VALUE[t];
      for (let k = n; k < START_N[t]; k++) taken[-c].push(t * c);
    }
    const row = (el, c) => {
      const lbl = mode === 'two' ? (c > 0 ? 'White' : 'Black') : (c === human ? 'You' : 'AI');
      const adv = mat * c > 0 ? `<span class="adv">+${mat * c}</span>` : '';
      el.innerHTML = `<span class="lbl">${lbl}</span>${taken[c].map((p) => `<span class="mini">${pieceSvg(p)}</span>`).join('')}${adv}`;
    };
    const bottom = flipped ? -1 : 1;
    row($('cap-bot'), bottom);
    row($('cap-top'), -bottom);
  }

  function paintHistory() {
    const h = $('history');
    h.replaceChildren();
    const startBlack = s && sanLog.length && puz && isPuzzle() && puz.side < 0;
    if (!sanLog.length) { const li = document.createElement('li'); li.className = 'empty'; li.textContent = isPuzzle() ? 'Find the forced mate.' : 'No moves yet. White starts.'; h.append(li); return; }
    const log = startBlack ? ['...', ...sanLog] : sanLog;
    for (let k = 0; k < log.length; k += 2) {
      const li = document.createElement('li');
      li.innerHTML = '<span></span><span></span><span></span>';
      li.children[0].textContent = `${k / 2 + 1}.`;
      li.children[1].textContent = log[k];
      li.children[2].textContent = log[k + 1] || '';
      const lastIdx = log.length - 1;
      if (lastIdx === k) li.children[1].className = 'now';
      if (lastIdx === k + 1) li.children[2].className = 'now';
      h.append(li);
    }
    h.scrollTop = h.scrollHeight;
  }

  function paintEval() {
    const bar = $('evalbar');
    bar.classList.toggle('flip', flipped);
    const fill = $('eval-fill');
    let pct = 50, label = '0.0';
    if (evalMate) { pct = evalMate > 0 ? 100 : 0; label = `M${Math.abs(evalMate)}`; }
    else if (evalScore != null && Math.abs(evalScore) >= 99999) { pct = evalScore > 0 ? 100 : 0; label = '#'; }
    else if (evalScore != null) {
      pct = 50 + 50 * (2 / (1 + Math.exp(-evalScore / 400)) - 1);
      pct = Math.max(4, Math.min(96, pct));
      label = (Math.abs(evalScore) / 100).toFixed(1);
    }
    fill.style.height = `${pct}%`;
    const whiteAhead = evalMate ? evalMate > 0 : (evalScore || 0) >= 0;
    const lo = $('eval-lo'), hi = $('eval-hi');
    const whiteEnd = flipped ? hi : lo, blackEnd = flipped ? lo : hi;
    whiteEnd.textContent = whiteAhead ? label : '';
    blackEnd.textContent = whiteAhead ? '' : label;
    whiteEnd.style.color = '#2b2724'; blackEnd.style.color = '#f3eee7';
    bar.setAttribute('aria-label', `Evaluation ${evalMate ? `mate in ${Math.abs(evalMate)} for ${evalMate > 0 ? 'White' : 'Black'}` : `${whiteAhead ? 'White' : 'Black'} ahead by ${label}`}`);
  }

  function requestEval() {
    if (!save.eval || !anaWorker) return;
    if (over) return;
    const fen = E.toFEN(s);
    if (anaBusy) { anaQueued = fen; return; }
    anaBusy = true;
    anaWorker.postMessage({ id: ++anaId, fen, level: 'eval' });
  }

  function onAna(d) {
    anaBusy = false;
    if (d.fen === (s && E.toFEN(s)) && d.r) {
      const turn = d.fen.split(' ')[1] === 'w' ? 1 : -1;
      const sc = d.r.score * turn;
      if (Math.abs(d.r.score) > 90000) { const plies = 100000 - Math.abs(d.r.score); evalMate = Math.sign(sc) * Math.ceil(plies / 2); }
      else { evalMate = 0; evalScore = sc; }
      paintEval();
    }
    if (anaQueued) { const f = anaQueued; anaQueued = null; if (s && f === E.toFEN(s)) requestEval(); }
  }

  function select(sq) {
    sel = sq;
    Curio.beep(620, 0.03, 'sine', 0.06);
    render();
  }

  function tapSquare(sq) {
    if (!isHumanTurn() || busy) return;
    if (sel != null && legal.some((m) => m.f === sel && m.t === sq)) { tryMove(sel, sq); return; }
    const p = s.b[sq];
    if (p && Math.sign(p) === s.turn) {
      if (legal.some((m) => m.f === sq)) select(sq === sel ? null : sq);
      else { Curio.toast(E.inCheck(s) ? 'You are in check! That piece cannot help.' : 'That piece has nowhere to go.'); sel = null; render(); }
    } else if (sel != null) { sel = null; render(); }
  }

  function promoPick(color) {
    return new Promise((resolve) => {
      const box = $('promo'), row = $('promo-row');
      row.replaceChildren();
      [5, 4, 3, 2].forEach((t) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', NAMES[t]);
        b.innerHTML = pieceSvg(t * color);
        b.addEventListener('click', () => { box.hidden = true; resolve(t * color); });
        row.append(b);
      });
      box.hidden = false;
      box.onclick = (e) => { if (e.target === box) { box.hidden = true; resolve(0); } };
      row.querySelector('button').focus();
    });
  }

  async function tryMove(f, t, dragged) {
    const cands = legal.filter((m) => m.f === f && m.t === t);
    if (!cands.length) return;
    let m = cands[0];
    if (cands.length > 1) {
      busy = true;
      const pr = await promoPick(s.turn);
      busy = false;
      if (!pr) { sel = null; render(); return; }
      m = cands.find((x) => x.pr === pr);
    }
    if (isPuzzle()) { puzzleMove(m, !dragged); return; }
    play(m, !dragged);
  }

  const buzz = (ms) => { try { navigator.vibrate?.(ms); } catch {} };

  function sfx(m, check) {
    if (check) { Curio.beep(880, 0.09, 'square', 0.07); setTimeout(() => Curio.beep(660, 0.1, 'square', 0.06), 90); buzz(25); }
    else if (m.c) { Curio.beep(240, 0.09, 'triangle', 0.16); setTimeout(() => Curio.beep(150, 0.08, 'sine', 0.12), 40); buzz(15); }
    else if (m.fl === 3) { Curio.beep(400, 0.05, 'triangle', 0.1); setTimeout(() => Curio.beep(500, 0.05, 'triangle', 0.1), 70); }
    else Curio.beep(380, 0.04, 'triangle', 0.05);
    window.Cafe?.sound(m.c ? 'thock' : 'wood', m.c ? 1 : 0.85);
    if (m.pr) setTimeout(() => [660, 880, 1100].forEach((fq, k) => setTimeout(() => Curio.beep(fq, 0.08, 'triangle', 0.1), k * 70)), 100);
  }

  function commit(m, anim) {
    snaps.push({ fen: E.toFEN(s), san: sanLog.length, keys: keys.length, last });
    sanLog.push(E.san(s, m, legal));
    const mover = s.turn;
    E.make(s, m);
    s.hist.length = 0;
    keys.push(E.positionKey(s));
    last = m; sel = null; hintMove = null;
    if (anim) pendingAnim = m;
    const check = E.inCheck(s);
    sfx(m, check);
    if (m.c) setTimeout(() => burst(m.t, m.c > 0 ? ['#fffdf8', '#e9dfcc', '#ffc233'] : ['#2d2926', '#5a524b', '#ff5a36'], true), anim ? 200 : 0);
    if (m.pr) setTimeout(() => burst(m.t, ['#ffc233', '#ff5a36', '#fff'], true), 220);
    if (mode !== 'two' && !isPuzzle() && mover === human) {
      if (m.pr) { unlock('promo'); if (Math.abs(m.pr) !== 5) unlock('under'); }
      if (m.fl === 2) unlock('ep');
    }
    if (m.pr && !isPuzzle()) Curio.toast(`Promoted to a ${NAMES[Math.abs(m.pr)]}!`);
    refresh();
    if (pendingAnim) { animate(pendingAnim); pendingAnim = null; }
  }

  function play(m, anim) {
    commit(m, anim);
    if (checkEnd()) return;
    requestEval();
    if (s.turn === aiColor()) aiTurn();
  }

  function checkEnd() {
    let r = null;
    if (!legal.length) r = E.inCheck(s) ? { kind: 'mate', winner: -s.turn } : { kind: 'stalemate' };
    else if (s.half >= 100) r = { kind: 'fifty' };
    else if (keys.filter((k) => k === keys[keys.length - 1]).length >= 3) r = { kind: 'threefold' };
    else if (E.insufficient(s)) r = { kind: 'material' };
    if (!r) return false;
    finish(r);
    return true;
  }

  let pendingAI = null;
  function aiTurn() {
    busy = true;
    render();
    const my = ++token, t0 = performance.now(), fen = E.toFEN(s);
    const done = (r) => {
      if (my !== token) return;
      const wait = Math.max(0, 450 - (performance.now() - t0));
      setTimeout(() => {
        if (my !== token) return;
        busy = false;
        const m = r && legal.find((x) => x.f === r.f && x.t === r.t && x.pr === r.pr);
        play(m || legal[Math.floor(Math.random() * legal.length)], true);
      }, wait);
    };
    pendingAI = done;
    if (worker) worker.postMessage({ id: my, fen, level: mode });
    else setTimeout(() => done(E.think(fen, 'easy')), 30);
  }
  function onAI(data) {
    if (data.id < 0) { onHint(data); return; }
    if (data.id === token && pendingAI) pendingAI(data.r);
  }

  let hintToken = 0;
  function askHint() {
    if (!isHumanTurn() || busy) return;
    if (isPuzzle()) { puzzleHint(); return; }
    if (hintMove) { hintMove.arrow = true; render(); return; }
    usedHelp = true; save.hints++; persist();
    $('hint').disabled = true;
    const fen = E.toFEN(s);
    const id = -(++hintToken);
    Curio.toast('Thinking about a good move...');
    if (worker) worker.postMessage({ id, fen, level: 'hint' });
    else onHint({ id, fen, r: E.think(fen, 'easy') });
  }
  function onHint(d) {
    if (d.id !== -hintToken || !s || d.fen !== E.toFEN(s) || !d.r) { render(); return; }
    hintMove = { f: d.r.f, t: d.r.t, arrow: true };
    Curio.beep(990, 0.06, 'sine', 0.07);
    const p = s.b[d.r.f];
    Curio.toast(`Try your ${NAMES[Math.abs(p)]} to ${E.name(d.r.t)}.`);
    render();
  }

  const medal = (kind) => {
    const c = { win: ['#ffd56b', '#f0a500', '#a86b00'], lose: ['#c9ccd3', '#8d93a3', '#4d5260'], draw: ['#bfe3ff', '#5ba7e6', '#2b6aa3'], puz: ['#b8f5d3', '#2ecc71', '#1a7c45'] }[kind];
    const icon = { win: '#pK', lose: '#pK', draw: '#pN', puz: '#pQ' }[kind];
    return `<defs><radialGradient id="mg" cx=".35" cy=".3"><stop offset="0" stop-color="${c[0]}"/><stop offset="1" stop-color="${c[1]}"/></radialGradient></defs>
      <path d="M26 2h12l-6 20zM46 2h12l-12 20z" fill="${kind === 'lose' ? '#777' : '#ff5a36'}"/>
      <circle cx="42" cy="48" r="32" fill="${c[2]}"/><circle cx="42" cy="46" r="31" fill="url(#mg)"/><circle cx="42" cy="46" r="24" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2" stroke-dasharray="3 4"/>
      <g transform="translate(23 26) scale(.85)" style="--pf:#fffdf8;--ps:${c[2]};--pd:${c[2]}"><use href="${icon}" width="45" height="45"/></g>`;
  };

  function showResult({ kind, title, body, stats, buttons }) {
    $('res-medal').innerHTML = medal(kind);
    $('res-title').textContent = title;
    $('res-body').textContent = body;
    $('res-stats').innerHTML = stats.map(([v, l]) => `<div class="c-stat"><b>${v}</b><span>${l}</span></div>`).join('');
    const row = $('res-btns'); row.replaceChildren();
    buttons.forEach(([label, fn], i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = i === 0 ? 'c-btn' : 'c-btn c-btn--ghost'; b.textContent = label;
      b.addEventListener('click', () => { $('result').hidden = true; fn(); });
      row.append(b);
    });
    $('result').hidden = false;
    row.querySelector('button')?.focus();
  }

  function pgn() {
    const d = new Date();
    const tag = (k, v) => `[${k} "${v}"]`;
    const res = over && result ? result.pgn : '*';
    const head = [tag('Event', 'Zoble casual game'), tag('Date', `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`),
      tag('White', mode === 'two' ? 'Player 1' : human > 0 ? 'You' : `Zoble AI (${mode})`), tag('Black', mode === 'two' ? 'Player 2' : human < 0 ? 'You' : `Zoble AI (${mode})`), tag('Result', res)];
    let moves = '';
    for (let k = 0; k < sanLog.length; k++) moves += (k % 2 === 0 ? `${k / 2 + 1}. ` : '') + sanLog[k] + ' ';
    return `${head.join('\n')}\n\n${moves}${res}`;
  }
  async function copy(text, msg) {
    try { await navigator.clipboard.writeText(text); Curio.toast(msg); } catch { Curio.toast('Could not reach the clipboard.'); }
  }

  async function finish(r) {
    over = true; busy = false; sel = null; hintMove = null;
    const human2 = mode === 'two';
    let outcome = 'draw', title;
    const why = { stalemate: 'Stalemate. No legal moves, but no check either.', fifty: '50 moves without a capture or pawn move.', threefold: 'The same position appeared three times.', material: 'Nobody has enough material left to mate.' };
    const moves = Math.ceil(sanLog.length / 2);
    let html;
    if (r.kind === 'mate') {
      const wName = r.winner > 0 ? 'White' : 'Black';
      if (human2) { title = `Checkmate! ${wName} wins`; outcome = 'two'; }
      else if (r.winner === human) { title = 'Checkmate! You beat the machine'; outcome = 'win'; }
      else { title = 'Checkmated by the computer'; outcome = 'lose'; }
      html = `${title}.<small>${sanLog[sanLog.length - 1]} ends it after ${moves} moves.</small>`;
      evalMate = 0; evalScore = r.winner * 100000;
    } else {
      title = r.kind === 'stalemate' ? 'Stalemate!' : 'A draw';
      outcome = human2 ? 'two' : 'draw';
      html = `Draw.<small>${why[r.kind]}</small>`;
      evalScore = 0; evalMate = 0;
    }
    result = { html, pgn: r.kind === 'mate' ? (r.winner > 0 ? '1-0' : '0-1') : '1/2-1/2' };
    let body = r.kind === 'mate' ? '' : why[r.kind] + ' ';
    let bestLine = '-';
    if (outcome !== 'two') {
      rec()[{ win: 'w', lose: 'l', draw: 'd' }[outcome]]++;
      Curio.store.set('chess:records', records);
      if (outcome === 'win') {
        const best = Curio.best(`fastest-${mode}`, moves, false);
        bestLine = best.best;
        body += best.isNew ? 'Your quickest win at this level! ' : '';
        unlock('first');
        if (mode === 'medium') unlock('medium');
        if (mode === 'hard') unlock('hard');
        if (human < 0) unlock('black');
        if (moves <= 25) unlock('quick');
        if (!usedHelp && (mode === 'medium' || mode === 'hard')) unlock('clean');
      }
      if (outcome === 'lose') body += 'The machine got you this time. Undo a few moves and look for the turning point.';
      if (outcome === 'win') body += 'Clean finish.';
    } else body += `Game over after ${moves} moves.`;
    save.games++; persist();
    render();
    if (outcome === 'win' || (outcome === 'two' && r.kind === 'mate')) {
      wrapEl.classList.remove('shake'); void wrapEl.offsetWidth; wrapEl.classList.add('shake');
      Curio.confetti();
      buzz([30, 40, 60]);
      [523, 659, 784, 1046].forEach((f, k) => setTimeout(() => Curio.beep(f, 0.12, 'triangle', 0.12), k * 90));
    } else if (outcome === 'lose') { wrapEl.classList.remove('shake'); void wrapEl.offsetWidth; wrapEl.classList.add('shake'); [392, 330, 262].forEach((f, k) => setTimeout(() => Curio.beep(f, 0.16, 'sawtooth', 0.07), k * 120)); }
    else [440, 440].forEach((f, k) => setTimeout(() => Curio.beep(f, 0.1, 'sine', 0.08), k * 140));
    const my = token;
    await new Promise((res) => setTimeout(res, 700));
    if (my !== token || !over) return;
    const stats = outcome === 'two' ? [[moves, 'Moves']] : [[moves, 'Moves'], [rec().w, 'Wins'], [bestLine, 'Fastest']];
    showResult({ kind: outcome === 'win' || outcome === 'two' && r.kind === 'mate' ? 'win' : outcome === 'lose' ? 'lose' : 'draw', title, body, stats,
      buttons: [['Play again', () => newGame()], ['Look at the board', () => {}], ['Copy PGN', () => copy(pgn(), 'PGN copied. Paste it into any chess site to analyse.')]] });
  }

  function undo() {
    if (isPuzzle()) { retryPuzzle(); return; }
    if (!snaps.length) return;
    token++;
    if (busy && worker) { worker.terminate(); makeWorker(); }
    busy = false; usedHelp = true;
    let snap = snaps.pop();
    if (mode !== 'two') {
      const turnOf = (fen) => (fen.split(' ')[1] === 'w' ? 1 : -1);
      while (turnOf(snap.fen) !== human && snaps.length) snap = snaps.pop();
    }
    s = E.fromFEN(snap.fen);
    sanLog.length = snap.san; keys.length = snap.keys; last = snap.last;
    over = false; sel = null; result = null; hintMove = null;
    $('result').hidden = true;
    document.querySelector('.curio-modal')?.remove();
    Curio.beep(500, 0.05, 'sine', 0.08);
    refresh();
    requestEval();
    if (s.turn === aiColor()) aiTurn();
  }

  function attackerWins(st, n) {
    const ms = E.legal(st);
    if (n === 1) {
      for (const m of ms) { E.make(st, m); const ok = E.inCheck(st) && E.legal(st).length === 0; E.unmake(st); if (ok) return true; }
      return false;
    }
    for (const m of ms) { E.make(st, m); const ok = defenderLoses(st, n - 1); E.unmake(st); if (ok) return true; }
    return false;
  }
  function defenderLoses(st, k) {
    const ms = E.legal(st);
    if (!ms.length) return E.inCheck(st);
    if (k === 0) return false;
    for (const m of ms) { E.make(st, m); const ok = attackerWins(st, k); E.unmake(st); if (!ok) return false; }
    return true;
  }

  const dayKey = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  const dailyIndex = () => { let h = 2166136261; for (const ch of dayKey()) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) % PUZZLES.length; };
  const firstUnsolved = () => { const i = PUZZLES.findIndex((_, k) => !save.solved[k]); return i < 0 ? 0 : i; };
  const filtered = () => PUZZLES.map((p, i) => ({ p, i })).filter(({ p }) => save.puzFilter === '0' || save.puzFilter === 'daily' || String(p.n) === save.puzFilter);

  function loadPuzzle(idx) {
    token++;
    if (busy && worker) { worker.terminate(); makeWorker(); }
    idx = ((idx % PUZZLES.length) + PUZZLES.length) % PUZZLES.length;
    const P = PUZZLES[idx];
    resetBoardState(P.fen);
    puz = { idx, n: P.n, line: P.line, ply: 0, left: P.n, side: s.turn, mistakes: 0, done: false, deviated: false, hinted: 0, shown: false, daily: idx === dailyIndex() };
    flipped = s.turn < 0;
    evalScore = null; evalMate = puz.n * s.turn;
    layoutPanels();
    refresh();
    paintPuzzleList();
    Curio.beep(520, 0.05, 'sine', 0.06);
  }
  function retryPuzzle() { if (puz) { const keep = puz.mistakes; loadPuzzle(puz.idx); puz.mistakes = keep; render(); } }

  function paintPuzzle() {
    if (!puz) return;
    const who = puz.side > 0 ? 'White' : 'Black';
    const badge = $('puz-badge');
    badge.className = `puz-badge m${puz.n}`;
    badge.innerHTML = `<span>Mate in<b>${puz.n}</b></span>`;
    let text;
    if (puz.done && puz.shown) text = `Solution shown.<small>Try the next one, or retry this.</small>`;
    else if (puz.done) text = `Solved! ✨<small>Puzzle #${puz.idx + 1}${puz.daily ? ' · today\'s daily' : ''}${puz.mistakes ? ` · ${puz.mistakes} miss${puz.mistakes > 1 ? 'es' : ''}` : ' · flawless'}</small>`;
    else if (busy) text = `Opponent replies<span class="think"><i></i><i></i><i></i></span>`;
    else text = `${who} to play${puz.left < puz.n ? ` · ${puz.left} to go` : ''}.<small>Puzzle #${puz.idx + 1}${puz.daily ? ' · 📅 daily' : ''}${save.solved[puz.idx] ? ' · solved before' : ''}. Every move must be forcing.</small>`;
    $('puz-status').innerHTML = text;
    $('puz-next').textContent = puz.done ? 'Next ▸' : 'Skip ▸';
  }

  function paintPuzzleList() {
    const grid = $('puz-grid');
    grid.replaceChildren();
    const list = save.puzFilter === 'daily' ? [{ p: PUZZLES[dailyIndex()], i: dailyIndex() }] : filtered();
    for (const { i } of list) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = i + 1;
      b.className = (save.solved[i] ? 'ok' : '') + (puz && puz.idx === i ? ' cur' : '');
      b.setAttribute('aria-label', `Puzzle ${i + 1}, mate in ${PUZZLES[i].n}${save.solved[i] ? ', solved' : ''}`);
      b.addEventListener('click', () => loadPuzzle(i));
      grid.append(b);
    }
    const n = Object.keys(save.solved).length;
    $('puz-count').textContent = `${n}/${PUZZLES.length}`;
    $('puz-prog').style.width = `${(n / PUZZLES.length) * 100}%`;
    $('puz-filters').querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.f === save.puzFilter)));
  }

  function puzzleMove(m, anim) {
    if (!puz || puz.done) return;
    const expected = !puz.deviated ? puz.line[puz.ply] : null;
    let ok = false;
    if (expected && uci(m) === expected) ok = true;
    else {
      E.make(s, m);
      if (puz.left === 1) ok = E.inCheck(s) && E.legal(s).length === 0;
      else if (puz.left === 2) ok = defenderLoses(s, 1);
      E.unmake(s);
      if (ok) puz.deviated = true;
    }
    if (!ok) {
      puz.mistakes++;
      save.streak = 0; persist();
      sel = null;
      wrapEl.classList.remove('wrong'); void wrapEl.offsetWidth; wrapEl.classList.add('wrong');
      Curio.beep(180, 0.18, 'sawtooth', 0.07); buzz(60);
      Curio.toast(Curio.pick(['Not quite. Look for a check that leaves no escape.', 'That lets the king breathe. Try again!', 'Close, but the defence holds. Again!', 'Hmm, not forcing enough. One more try.']));
      render();
      return;
    }
    commit(m, anim);
    puz.ply++;
    puz.left--;
    if (!legal.length && E.inCheck(s)) { solvedPuzzle(); return; }
    busy = true; render();
    const my = token;
    setTimeout(() => {
      if (my !== token) return;
      let reply = null;
      const want = !puz.deviated ? puz.line[puz.ply] : null;
      if (want) reply = legal.find((x) => uci(x) === want);
      if (!reply) {
        let bestLen = -1;
        for (const r of legal) {
          E.make(s, r);
          let len = 1; while (len < puz.left && !attackerWins(s, len)) len++;
          E.unmake(s);
          if (len > bestLen) { bestLen = len; reply = r; }
        }
        puz.deviated = true;
      }
      busy = false;
      commit(reply, true);
      puz.ply++;
      render();
    }, 520);
  }

  function solvedPuzzle() {
    puz.done = true;
    const first = !save.solved[puz.idx];
    if (!puz.shown) {
      save.solved[puz.idx] = Math.max(save.solved[puz.idx] || 0, puz.mistakes ? 1 : 2);
      if (!puz.mistakes && !puz.hinted) { save.streak++; save.bestStreak = Math.max(save.bestStreak, save.streak); } else save.streak = 0;
      if (puz.daily) { save.daily[dayKey()] = 1; unlock('daily'); }
      persist();
      const n = Object.keys(save.solved).length;
      unlock('p1');
      if (n >= 10) unlock('p10');
      if (n >= 30) unlock('p30');
      if (n >= PUZZLES.length) unlock('pall');
      if (puz.n === 3) unlock('m3');
      if (save.streak >= 5) unlock('streak');
    }
    wrapEl.classList.remove('shake'); void wrapEl.offsetWidth; wrapEl.classList.add('shake');
    if (!puz.shown) { Curio.confetti(70); [659, 784, 988, 1319].forEach((f, k) => setTimeout(() => Curio.beep(f, 0.1, 'triangle', 0.1), k * 80)); buzz([20, 30, 40]); }
    render();
    paintPuzzleList();
    if (puz.shown) return;
    const my = token;
    setTimeout(() => {
      if (my !== token) return;
      showResult({ kind: 'puz', title: puz.mistakes ? 'Got there!' : 'Flawless mate!', body: `${first ? 'New puzzle solved.' : 'Solved again.'} Mate in ${puz.n} with ${puz.mistakes} miss${puz.mistakes === 1 ? '' : 'es'}.`,
        stats: [[Object.keys(save.solved).length, 'Solved'], [save.streak, 'Streak'], [save.bestStreak, 'Best']],
        buttons: [['Next puzzle', () => nextPuzzle()], ['Stay here', () => {}], ['Share', () => copy(`Zoble Chess: solved puzzle #${puz.idx + 1} (mate in ${puz.n}) ${puz.mistakes ? `with ${puz.mistakes} miss${puz.mistakes === 1 ? '' : 'es'}` : 'flawlessly'} ♟️ ${Object.keys(save.solved).length}/${PUZZLES.length} solved`, 'Result copied!')]] });
    }, 650);
  }

  function nextPuzzle() {
    const list = filtered().map((x) => x.i);
    if (!list.length) return;
    const cur = puz ? list.indexOf(puz.idx) : -1;
    let pick = null;
    for (let k = 1; k <= list.length; k++) { const i = list[(cur + k) % list.length]; if (!save.solved[i]) { pick = i; break; } }
    loadPuzzle(pick ?? list[(cur + 1) % list.length]);
  }

  function puzzleHint() {
    if (!puz || puz.done || busy) return;
    const want = !puz.deviated ? puz.line[puz.ply] : null;
    let m = want ? legal.find((x) => uci(x) === want) : null;
    if (!m) {
      for (const x of legal) {
        E.make(s, x);
        const ok = puz.left === 1 ? E.inCheck(s) && !E.legal(s).length : defenderLoses(s, puz.left - 1);
        E.unmake(s);
        if (ok) { m = x; break; }
      }
    }
    if (!m) return;
    puz.hinted++;
    save.hints++; persist();
    if (!hintMove || hintMove.f !== m.f) { hintMove = { f: m.f, t: m.t, arrow: false }; Curio.toast(`Look at your ${NAMES[Math.abs(s.b[m.f])]}.`); }
    else { hintMove.arrow = true; Curio.toast('Here is the move.'); }
    Curio.beep(990, 0.06, 'sine', 0.07);
    render();
  }

  async function showSolution() {
    if (!puz || puz.done) return;
    const idx = puz.idx;
    loadPuzzle(idx);
    puz.shown = true;
    save.streak = 0; persist();
    busy = true;
    const my = token;
    for (const u of puz.line) {
      await new Promise((r) => setTimeout(r, 650));
      if (my !== token) return;
      const m = legal.find((x) => uci(x) === u);
      if (!m) break;
      commit(m, true);
    }
    busy = false;
    puz.done = true;
    render();
  }

  let drag = null;
  const squareAt = (x, y) => {
    const r = boardEl.getBoundingClientRect();
    const c = Math.floor((x - r.left) / r.width * 8), row = Math.floor((y - r.top) / r.height * 8);
    return c >= 0 && c < 8 && row >= 0 && row < 8 ? sqOf(row * 8 + c) : -1;
  };
  Curio.drag(boardEl, {
    start(p) {
      drag = null;
      if (!isHumanTurn() || busy) return;
      const sq = squareAt(p.clientX, p.clientY);
      if (sq < 0) return;
      if (sel != null && legal.some((m) => m.f === sel && m.t === sq)) { tryMove(sel, sq); return; }
      const pc = s.b[sq];
      if (pc && Math.sign(pc) === s.turn && legal.some((m) => m.f === sq)) {
        const wasSel = sel === sq;
        if (!wasSel) select(sq);
        drag = { from: sq, x: p.clientX, y: p.clientY, moved: false, wasSel, el: squares[viewOf(sq)].querySelector('.pc'), over: -1 };
        p.event.preventDefault();
      } else tapSquare(sq);
    },
    move(p) {
      if (!drag || !drag.el) return;
      const dx = p.clientX - drag.x, dy = p.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) < 6) return;
      drag.moved = true;
      drag.el.classList.add('drag');
      drag.el.style.transform = `translate(${dx}px, ${dy}px)`;
      const sq = squareAt(p.clientX, p.clientY);
      if (sq !== drag.over) {
        if (drag.over >= 0) squares[viewOf(drag.over)].classList.remove('hover');
        drag.over = legal.some((m) => m.f === drag.from && m.t === sq) ? sq : -1;
        if (drag.over >= 0) squares[viewOf(drag.over)].classList.add('hover');
      }
    },
    end(p) {
      if (!drag) return;
      const d = drag; drag = null;
      if (!p) { render(); return; }
      const sq = squareAt(p.clientX, p.clientY);
      if (!d.moved) {
        if (sq !== d.from && legal.some((m) => m.f === d.from && m.t === sq)) { tryMove(d.from, sq); return; }
        if (d.wasSel) { sel = null; render(); }
        return;
      }
      if (legal.some((m) => m.f === d.from && m.t === sq)) tryMove(d.from, sq, true);
      else render();
    }
  });

  $('undo').addEventListener('click', undo);
  $('new').addEventListener('click', newGame);
  $('hint').addEventListener('click', askHint);
  $('flip').addEventListener('click', () => { flipped = !flipped; Curio.beep(520, 0.05, 'sine', 0.07); render(); });
  $('pgn').addEventListener('click', () => copy(isPuzzle() ? `${PUZZLES[puz.idx].fen}\n${sanLog.join(' ')}` : pgn(), isPuzzle() ? 'Puzzle FEN copied.' : 'PGN copied.'));
  $('puz-hint').addEventListener('click', puzzleHint);
  $('puz-retry').addEventListener('click', retryPuzzle);
  $('puz-show').addEventListener('click', showSolution);
  $('puz-next').addEventListener('click', nextPuzzle);
  $('puz-filters').addEventListener('click', (e) => {
    const x = e.target.closest('button'); if (!x) return;
    save.puzFilter = x.dataset.f; persist();
    if (x.dataset.f === 'daily') loadPuzzle(dailyIndex());
    else if (puz && x.dataset.f !== '0' && String(PUZZLES[puz.idx].n) !== x.dataset.f) nextPuzzle();
    paintPuzzleList();
  });
  $('modes').addEventListener('click', (e) => {
    const x = e.target.closest('button'); if (!x) return;
    mode = x.dataset.mode; Curio.store.set('chess:mode', mode);
    Curio.toast(mode === 'two' ? 'Two players. Pass the device!' : mode === 'puzzle' ? 'Puzzle time. Find the forced mate!' : `${x.textContent} AI. New game!`);
    if (mode === 'puzzle') loadPuzzle(save.puzFilter === 'daily' ? dailyIndex() : firstUnsolved());
    else newGame();
  });
  $('sides').addEventListener('click', (e) => {
    const x = e.target.closest('button'); if (!x) return;
    human = +x.dataset.side; Curio.store.set('chess:side', human);
    Curio.toast(human > 0 ? 'You play White. You move first.' : 'You play Black. The AI opens.');
    newGame();
  });
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector('.curio-modal') || !$('promo').hidden) return;
    if (e.target.closest?.('input, select, textarea')) return;
    const k = e.key.toLowerCase();
    if (!$('result').hidden) { if (k === 'escape') $('result').hidden = true; return; }
    if (k === 'u') undo();
    else if (k === 'n') isPuzzle() ? nextPuzzle() : newGame();
    else if (k === 'f') $('flip').click();
    else if (k === 'h') askHint();
    else if (k === 'p' && !Curio.simple) $('modes').querySelector('[data-mode="puzzle"]').click();
    else if (k === 'escape') { sel = null; render(); }
  });

  buildLookPickers();
  applyLook();
  paintAch();
  if (isPuzzle()) loadPuzzle(save.puzFilter === 'daily' ? dailyIndex() : firstUnsolved());
  else newGame();
  window.__chess = {
    get state() { return s; }, get legal() { return legal; }, get san() { return sanLog; }, get busy() { return busy; }, get over() { return over; }, get puz() { return puz; },
    get eval() { return { evalScore, evalMate }; }, get hint() { return hintMove; },
    tapSquare, loadPuzzle, uci,
    load(fen) { token++; s = E.fromFEN(fen); sanLog = []; keys = [E.positionKey(s)]; snaps = []; last = null; over = false; busy = false; sel = null; refresh(); }
  };
  if (!Curio.touchpad && !Curio.store.get('padtip:chess', false)) { Curio.store.set('padtip:chess', true); setTimeout(() => Curio.toast('Tip: on a laptop touchpad? Turn on Touchpad mode in the top bar.', 3400), 2200); }
})();
