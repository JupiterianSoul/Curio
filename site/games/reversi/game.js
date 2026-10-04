(() => {
  const R = window.ReversiEngine;
  const $ = (id) => document.getElementById(id);
  const boardEl = $('board'), wrapEl = $('board-wrap');
  const BOARDS = [
    { id: 'felt', name: 'Club felt', a: '#2e7d32', b: '#276b2b', line: '#1b5e20', f: '#6d4c41', f2: '#3e2723', hi: '#8d6e63' },
    { id: 'ocean', name: 'Ocean', a: '#1e6091', b: '#1a5580', line: '#0f3a5a', f: '#37474f', f2: '#1c262b', hi: '#546e7a' },
    { id: 'wood', name: 'Maple', a: '#c99a5b', b: '#bb8c4e', line: '#8a6230', f: '#5d4037', f2: '#2e1d18', hi: '#795548' },
    { id: 'night', name: 'Midnight', a: '#2b2d42', b: '#25273a', line: '#14152a', f: '#111', f2: '#000', hi: '#333' },
    { id: 'berry', name: 'Berry', a: '#8e2453', b: '#7d1f49', line: '#55122f', f: '#4a1530', f2: '#260a18', hi: '#6d2246' }
  ];
  const DISCS = [['classic', 'Classic'], ['gems', 'Amethyst and gold'], ['cookies', 'Cookies and cream']];
  const ACH = [
    ['first', '⚫', 'First flip', 'Win a game against the AI'],
    ['medium', '🥈', 'Contender', 'Beat the Medium AI'],
    ['hard', '🥇', 'Strategist', 'Beat the Hard AI'],
    ['expert', '👑', 'Othello master', 'Beat the Expert AI'],
    ['white', '⚪', 'Second mover', 'Win as White'],
    ['corners', '📐', 'Cornered', 'Own all four corners in one game'],
    ['wipe', '🧹', 'Wipeout', 'Finish with none of the AI\'s discs left'],
    ['big', '🌊', 'Tidal wave', 'Flip 10 or more discs in one move'],
    ['margin', '💯', 'Landslide', 'Win by 40 discs or more'],
    ['clean', '🧼', 'No take-backs', 'Beat Hard or Expert without undo or hints']
  ];

  const SAVE_V = 2;
  const load = () => {
    const base = { v: SAVE_V, level: Curio.store.get('rv:level', 'medium'), side: 1, hints: Curio.store.get('rv:hints', true), board: 'felt', discs: 'classic', records: Curio.store.get('rv:records', {}) || {}, ach: {}, flips: 0, games: 0 };
    const raw = Curio.store.get('rv:v2', null);
    if (!raw || raw.v !== SAVE_V) return base;
    return { ...base, ...raw, records: raw.records || {}, ach: raw.ach || {} };
  };
  const save = load();
  if (!['easy', 'medium', 'hard', 'expert', 'two'].includes(save.level)) save.level = 'medium';
  const persist = () => Curio.store.set('rv:v2', save);
  const rec = () => (save.records[save.level] ||= { w: 0, l: 0, d: 0 });
  const two = () => save.level === 'two';
  const human = () => save.side;
  const aiColor = () => (two() ? 0 : -save.side);
  const isHumanTurn = () => two() || turn === human();

  let b, turn, over, busy, last, snaps, token = 0, legal = [], usedHelp = false, hist = [], hintSq = -1, bestFlip = 0;

  const cells = [], discs = new Array(64).fill(null);
  const nameOf = (i) => 'abcdefgh'[i & 7] + ((i >> 3) + 1);
  for (let i = 0; i < 64; i++) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = ((i >> 3) + (i & 7)) % 2 ? 'cell alt' : 'cell';
    el.setAttribute('role', 'gridcell');
    el.innerHTML = '<span class="ghost"></span>';
    el.addEventListener('click', () => humanPlay(i));
    el.addEventListener('pointerenter', () => preview(i));
    el.addEventListener('pointerleave', () => preview(-1));
    el.addEventListener('focus', () => preview(i));
    el.addEventListener('blur', () => preview(-1));
    el.addEventListener('keydown', (e) => {
      const d = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -8, ArrowDown: 8 }[e.key];
      if (d == null) return;
      const j = i + d;
      if (j >= 0 && j < 64 && !(Math.abs(d) === 1 && (j >> 3) !== (i >> 3))) { cells[j].focus(); e.preventDefault(); }
    });
    boardEl.append(el);
    cells.push(el);
  }
  for (const [r, c] of [[2, 2], [2, 6], [6, 2], [6, 6]]) {
    const d = document.createElement('span');
    d.className = 'dot';
    d.style.left = `${c * 12.5}%`; d.style.top = `${r * 12.5}%`;
    boardEl.append(d);
  }

  let worker = null, pending = null, hintPending = null;
  function makeWorker() {
    try {
      const src = `const R=(${window.reversiEngine.toString()})();onmessage=(e)=>{postMessage({id:e.data.id,m:R.think(e.data.b,e.data.p,e.data.level)});};`;
      worker = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
      worker.onmessage = (e) => { if (e.data.id < 0) { if (hintPending && e.data.id === hintPending.id) hintPending.fn(e.data.m); return; } if (e.data.id === token && pending) pending(e.data.m); };
      worker.onerror = () => { worker = null; };
    } catch { worker = null; }
  }
  makeWorker();

  function setDisc(i, p, fresh) {
    let d = discs[i];
    if (!p) { if (d) { d.remove(); discs[i] = null; } return; }
    if (!d) {
      d = document.createElement('span');
      d.className = 'disc';
      d.innerHTML = '<span class="f k"></span><span class="f l"></span>';
      cells[i].append(d);
      discs[i] = d;
      if (fresh) { d.classList.add('new'); d.addEventListener('animationend', () => d.classList.remove('new'), { once: true }); }
    }
    d.classList.toggle('w', p === -1);
  }
  function paintAll() { for (let i = 0; i < 64; i++) setDisc(i, b[i], false); }

  function applyLook() {
    const t = BOARDS.find((x) => x.id === save.board) || BOARDS[0];
    const st = document.documentElement.style;
    st.setProperty('--felt', t.a); st.setProperty('--felt-2', t.b); st.setProperty('--felt-line', t.line); st.setProperty('--frame', t.f); st.setProperty('--frame-2', t.f2); st.setProperty('--frame-hi', t.hi);
    document.body.dataset.discs = save.discs;
    $('boards').querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.id === save.board)));
    $('discs').querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.id === save.discs)));
  }
  BOARDS.forEach((t) => {
    const x = document.createElement('button'); x.type = 'button'; x.dataset.id = t.id; x.title = t.name; x.setAttribute('aria-label', `${t.name} board`);
    x.style.background = `linear-gradient(135deg, ${t.a} 50%, ${t.f} 50%)`;
    x.addEventListener('click', () => { save.board = t.id; persist(); applyLook(); Curio.beep(700, 0.04, 'sine', 0.06); });
    $('boards').append(x);
  });
  DISCS.forEach(([id, name]) => {
    const x = document.createElement('button'); x.type = 'button'; x.dataset.id = id; x.title = name; x.setAttribute('aria-label', `${name} discs`);
    x.innerHTML = `<span class="swd" data-discs="${id}" style="position:absolute;inset:4px"><span class="disc" style="inset:0 40% 40% 0"><span class="f k"></span><span class="f l"></span></span><span class="disc w" style="inset:40% 0 0 40%"><span class="f k"></span><span class="f l"></span></span></span>`;
    x.style.background = 'var(--surface-2)';
    x.addEventListener('click', () => { save.discs = id; persist(); applyLook(); Curio.beep(760, 0.04, 'sine', 0.06); });
    $('discs').append(x);
  });

  function newGame() {
    token++;
    if (busy && worker) { worker.terminate(); makeWorker(); }
    b = R.initial(); turn = 1; over = false; busy = false; last = -1; snaps = []; hist = []; usedHelp = false; hintSq = -1; bestFlip = 0;
    for (let i = 0; i < 64; i++) setDisc(i, 0);
    paintAll();
    document.querySelector('.curio-modal')?.remove();
    render();
    if (turn === aiColor()) aiTurn();
  }

  function preview(i) {
    cells.forEach((c) => c.classList.remove('would'));
    if (i < 0 || !legal.includes(i) || !isHumanTurn() || busy) return;
    for (const x of R.flips(b, i, turn)) cells[x].classList.add('would');
  }

  function render(note) {
    legal = !over && !busy && isHumanTurn() ? R.moves(b, turn) : [];
    const set = new Set(legal);
    boardEl.style.setProperty('--gc', turn === 1 ? 'var(--blk)' : 'var(--wht)');
    cells.forEach((el, i) => {
      el.classList.toggle('ok', set.has(i));
      el.classList.toggle('last', i === last);
      el.classList.toggle('besthint', i === hintSq);
      el.querySelector('.ghost').style.background = turn === 1 ? '#1e1c1b' : '#f7f4ee';
      const v = b[i];
      el.setAttribute('aria-label', `${nameOf(i)}: ${v === 1 ? 'black' : v === -1 ? 'white' : set.has(i) ? `empty, legal move, flips ${R.flips(b, i, turn).length}` : 'empty'}`);
    });
    boardEl.classList.toggle('nohint', !save.hints);
    const n = R.count(b);
    $('n-k').textContent = n.black;
    $('n-l').textContent = n.white;
    $('lbl-k').textContent = two() ? 'Black' : human() === 1 ? 'You' : 'AI';
    $('lbl-l').textContent = two() ? 'White' : human() === -1 ? 'You' : 'AI';
    $('bar').style.width = `${n.black / (n.black + n.white) * 100}%`;
    $('side-k').classList.toggle('turn', !over && turn === 1);
    $('side-l').classList.toggle('turn', !over && turn === -1);
    $('undo').disabled = !snaps.length;
    $('hint').disabled = over || busy || !isHumanTurn();
    $('hints').setAttribute('aria-pressed', String(save.hints));
    $('record').textContent = two() ? 'Two players on one device.' : `Record vs ${save.level} AI: ${rec().w} won · ${rec().l} lost · ${rec().d} drawn`;
    document.querySelectorAll('#levels button').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.level === save.level)));
    document.querySelectorAll('#sides button').forEach((x) => x.setAttribute('aria-pressed', String(+x.dataset.side === save.side)));
    $('sides').style.visibility = two() ? 'hidden' : '';
    boardEl.setAttribute('aria-label', `Reversi board. ${two() ? 'Two players.' : `You are ${human() === 1 ? 'black' : 'white'}.`}`);
    $('history').innerHTML = hist.length ? hist.map((h, k) => `<span class="${h.p === 1 ? 'k' : 'l'}">${k + 1}. ${h.m}</span>`).join('') : '<span>No moves yet. Black starts.</span>';
    $('history').scrollTop = 1e6;
    if (!over) {
      const st = $('status');
      const who = turn === 1 ? 'Black' : 'White';
      if (busy && isHumanTurn()) st.innerHTML = 'Flip, flip, flip...<small>Watch them go.</small>';
      else if (!isHumanTurn()) st.innerHTML = `AI is thinking...${note ? `<small>${note}</small>` : ''}`;
      else st.innerHTML = `${two() ? `${who} to move.` : 'Your move.'}<small>${note || `${legal.length} legal move${legal.length === 1 ? '' : 's'}${save.hints ? ', shown as dots' : ''}.`}</small>`;
    }
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function sparks(i, colors) {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    for (let k = 0; k < 12; k++) {
      const s = document.createElement('i'); s.className = 'spark';
      const a = Math.random() * Math.PI * 2, d = 20 + Math.random() * 30;
      s.style.left = `calc(${((i & 7) + 0.5) * 12.5}% - 3px)`; s.style.top = `calc(${((i >> 3) + 0.5) * 12.5}% - 3px)`;
      s.style.background = colors[k % colors.length];
      s.style.setProperty('--dx', `${Math.cos(a) * d}px`); s.style.setProperty('--dy', `${Math.sin(a) * d}px`);
      boardEl.append(s); setTimeout(() => s.remove(), 650);
    }
  }
  function unlock(id) {
    if (save.ach[id]) return;
    save.ach[id] = Date.now(); persist();
    const a = ACH.find((x) => x[0] === id);
    if (a) setTimeout(() => Curio.toast(`${a[1]} Badge unlocked: ${a[2]}`, 2400), 1000);
  }

  async function place(i, p) {
    const { board: nb, flipped } = R.play(b, i, p);
    b = nb; last = i; hintSq = -1;
    hist.push({ p, m: nameOf(i) });
    setDisc(i, p, true);
    preview(-1);
    Curio.beep(p === 1 ? 520 : 400, 0.06, 'triangle', 0.12);
    const r0 = i >> 3, c0 = i & 7;
    const my = token;
    await sleep(140);
    if (my !== token) return false;
    const byDist = flipped.map((x) => ({ x, d: Math.max(Math.abs((x >> 3) - r0), Math.abs((x & 7) - c0)) }));
    const maxD = Math.max(...byDist.map((o) => o.d));
    for (let d = 1; d <= maxD; d++) {
      const ring = byDist.filter((o) => o.d === d);
      ring.forEach((o) => setDisc(o.x, p));
      if (ring.length) Curio.beep(600 + d * 80, 0.04, 'sine', 0.06);
      await sleep(70);
      if (my !== token) return false;
    }
    const mine = two() || p === human();
    if (mine) { save.flips += flipped.length; bestFlip = Math.max(bestFlip, flipped.length); if (!two() && flipped.length >= 10) unlock('big'); }
    if (flipped.length >= 6) { Curio.toast(mine ? `Huge! ${flipped.length} discs flipped.` : `Ouch. The AI flipped ${flipped.length}.`); wrapEl.classList.remove('shake'); void wrapEl.offsetWidth; wrapEl.classList.add('shake'); try { navigator.vibrate?.(20); } catch {} }
    if ([0, 7, 56, 63].includes(i)) {
      sparks(i, ['#ffd54f', '#fff', '#ff5a36']);
      if (mine) { Curio.toast('Corner captured. Nobody can flip it now.'); [700, 900].forEach((f, k) => setTimeout(() => Curio.beep(f, 0.08, 'triangle', 0.1), k * 80)); }
    }
    await sleep(260);
    return my === token;
  }

  async function humanPlay(i) {
    if (over || busy || !isHumanTurn()) return;
    if (!legal.includes(i)) {
      if (!b[i]) { Curio.beep(160, 0.08, 'square', 0.04); cells[i].animate([{ transform: 'translateX(-3px)' }, { transform: 'translateX(3px)' }, { transform: 'none' }], { duration: 160 }); }
      return;
    }
    snaps.push({ b: b.slice(), last, turn, hist: hist.length });
    busy = true; render();
    if (!(await place(i, turn))) return;
    busy = false;
    advance(-turn);
  }

  function advance(next) {
    const nm = R.moves(b, next).length, om = R.moves(b, -next).length;
    if (!nm && !om) { finish(); return; }
    if (!nm) {
      turn = -next;
      const nextName = two() ? (next === 1 ? 'Black' : 'White') : next === aiColor() ? 'The AI' : 'You';
      const msg = `${nextName} ${nextName === 'You' ? 'have' : 'has'} no legal move and ${nextName === 'You' ? 'pass' : 'passes'}.`;
      Curio.toast(msg);
      Curio.beep(300, 0.12, 'sine', 0.08);
      if (turn === aiColor()) { render(msg); aiTurn(msg); } else render(msg);
      return;
    }
    turn = next;
    if (turn === aiColor()) aiTurn(); else render();
  }

  function aiTurn(note) {
    busy = true; render(note);
    const my = ++token, t0 = performance.now(), side = turn;
    pending = async (m) => {
      pending = null;
      await sleep(Math.max(0, 500 - (performance.now() - t0)));
      if (my !== token) return;
      if (m == null || !R.moves(b, side).includes(m)) m = R.moves(b, side)[0];
      if (!(await place(m, side))) return;
      busy = false;
      advance(-side);
    };
    if (worker) worker.postMessage({ id: my, b, p: side, level: save.level });
    else setTimeout(() => pending && pending(R.think(b, side, 'easy')), 30);
  }

  let hintId = 0;
  function bestMove() {
    if (over || busy || !isHumanTurn()) return;
    usedHelp = true;
    const id = -(++hintId), fen = b.join(','), side = turn;
    hintPending = { id, fn: (m) => { hintPending = null; if (b.join(',') !== fen || m == null) return; hintSq = m; render(); Curio.beep(990, 0.06, 'sine', 0.07); Curio.toast(`Try ${nameOf(m)}. It flips ${R.flips(b, m, side).length}.`); } };
    Curio.toast('Thinking about the best move...');
    if (worker) worker.postMessage({ id, b, p: side, level: 'hint' });
    else hintPending.fn(R.think(b, side, 'medium'));
  }

  async function finish() {
    over = true; busy = false;
    render();
    const n = R.count(b), diff = n.black - n.white;
    save.games++;
    const st = $('status');
    let title, body = `Final score ${n.black} to ${n.white}. `, emoji, win = false;
    if (two()) {
      title = diff > 0 ? 'Black wins!' : diff < 0 ? 'White wins!' : 'A draw!';
      emoji = diff ? '🏆' : '🤝';
      st.innerHTML = `${title}<small>${n.black} to ${n.white}.</small>`;
      win = !!diff;
    } else {
      const myDiff = diff * human();
      const outcome = myDiff > 0 ? 'win' : myDiff < 0 ? 'lose' : 'draw';
      rec()[{ win: 'w', lose: 'l', draw: 'd' }[outcome]]++;
      const mine = human() === 1 ? n.black : n.white, theirs = human() === 1 ? n.white : n.black;
      if (outcome === 'win') {
        win = true;
        const best = Curio.best(`margin-${save.level}`, myDiff);
        body += best.isNew ? `A ${myDiff}-disc margin is your best ever on ${save.level}!` : `Best margin on ${save.level}: ${best.best}.`;
        st.innerHTML = `You win, ${mine} to ${theirs}! 🎉`;
        title = 'You flipped the script!'; emoji = '🏆';
        unlock('first');
        if (save.level === 'medium') unlock('medium');
        if (save.level === 'hard') unlock('hard');
        if (save.level === 'expert') unlock('expert');
        if (human() === -1) unlock('white');
        if ([0, 7, 56, 63].every((c) => b[c] === human())) unlock('corners');
        if (!theirs) unlock('wipe');
        if (myDiff >= 40) unlock('margin');
        if (!usedHelp && (save.level === 'hard' || save.level === 'expert')) unlock('clean');
      } else if (outcome === 'lose') {
        body += mine === 0 ? 'Total wipeout. Not a single disc survived.' : 'The machine out-flipped you. Try grabbing corners early and keeping your moves open.';
        st.innerHTML = `AI wins, ${theirs} to ${mine}.<small>Corners, corners, corners.</small>`;
        title = 'Flipped and flattened'; emoji = '🤖';
      } else { body += 'Perfectly balanced. Rare in reversi!'; st.innerHTML = '32 all. A draw!'; title = 'Dead even'; emoji = '🤝'; }
      body += ` Record vs ${save.level} AI: ${rec().w}-${rec().l}-${rec().d}.`;
    }
    persist(); paintStats();
    if (win) { Curio.confetti(); [523, 659, 784, 1046].forEach((f, k) => setTimeout(() => Curio.beep(f, 0.12, 'triangle', 0.12), k * 90)); }
    else if (!two() && diff) [392, 330, 262].forEach((f, k) => setTimeout(() => Curio.beep(f, 0.16, 'sawtooth', 0.07), k * 120));
    const my = token;
    await sleep(700);
    if (my !== token) return;
    const v = await Curio.modal({ emoji, title, body, buttons: [{ label: 'Play again', value: 'again' }, { label: 'Share', value: 'share' }, { label: 'Look at the board', value: 'look' }] });
    if (v === 'share') { try { await navigator.clipboard.writeText(`⚫⚪ Curio Reversi${two() ? '' : ` vs ${save.level} AI`}: ${n.black} to ${n.white}. Biggest flip: ${bestFlip}.`); Curio.toast('Copied!'); } catch { Curio.toast('Could not reach the clipboard.'); } }
    if (v === 'again' && my === token) newGame();
  }

  function undo() {
    if (!snaps.length) return;
    token++;
    if (busy && worker) { worker.terminate(); makeWorker(); }
    const s = snaps.pop();
    b = s.b; last = s.last; turn = s.turn; hist.length = s.hist; over = false; busy = false; usedHelp = true; hintSq = -1;
    paintAll();
    document.querySelector('.curio-modal')?.remove();
    Curio.beep(500, 0.05, 'sine', 0.08);
    render();
  }

  function paintStats() {
    const tot = ['easy', 'medium', 'hard', 'expert'].reduce((a, k) => { const r = save.records[k] || { w: 0, l: 0, d: 0 }; return [a[0] + r.w, a[1] + r.l, a[2] + r.d]; }, [0, 0, 0]);
    $('statgrid').innerHTML = [[tot[0], 'Wins'], [tot[1], 'Losses'], [tot[2], 'Draws'], [save.games, 'Games'], [Curio.fmt(save.flips), 'Discs flipped'], [Object.keys(save.ach).length, 'Badges']].map(([v, l]) => `<div class="c-stat"><b>${v}</b><span>${l}</span></div>`).join('');
    $('achs').innerHTML = ACH.map(([id, e, n, d]) => `<div class="ach${save.ach[id] ? ' on' : ''}" title="${d}"><span>${e}</span><div><b>${n}</b>${d}</div></div>`).join('');
    $('ach-count').textContent = `${Object.keys(save.ach).length}/${ACH.length}`;
  }

  $('undo').addEventListener('click', undo);
  $('new').addEventListener('click', newGame);
  $('hint').addEventListener('click', bestMove);
  $('hints').addEventListener('click', () => { save.hints = !save.hints; persist(); render(); });
  $('levels').addEventListener('click', (e) => {
    const x = e.target.closest('button'); if (!x) return;
    save.level = x.dataset.level; persist();
    Curio.toast(two() ? 'Two players. Pass the device!' : `${x.textContent} AI. New game!`);
    newGame();
  });
  $('sides').addEventListener('click', (e) => {
    const x = e.target.closest('button'); if (!x) return;
    save.side = +x.dataset.side; persist();
    Curio.toast(save.side === 1 ? 'You play Black and move first.' : 'You play White. The AI opens.');
    newGame();
  });
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector('.curio-modal')) return;
    const k = e.key.toLowerCase();
    if (k === 'u') undo(); else if (k === 'n') newGame(); else if (k === 'h') $('hints').click(); else if (k === 'b') bestMove();
  });

  applyLook();
  paintStats();
  newGame();
  if (!Curio.touchpad && !Curio.store.get('padtip:reversi', false)) { Curio.store.set('padtip:reversi', true); setTimeout(() => Curio.toast('Tip: on a laptop touchpad? Turn on Touchpad mode in the top bar.', 3400), 2200); }
  window.__reversi = { get board() { return b; }, get legal() { return legal; }, get busy() { return busy; }, get over() { return over; }, get turn() { return turn; }, get hint() { return hintSq; }, humanPlay, bestMove, setLevel(l, side) { save.level = l; if (side) save.side = side; persist(); newGame(); }, load(nb, t) { token++; b = nb.slice(); turn = t; over = false; busy = false; snaps = []; paintAll(); advance(t); } };
})();
