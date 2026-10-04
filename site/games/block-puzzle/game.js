(() => {
  const $ = (id) => document.getElementById(id);
  const N = 10;
  const P = (rows) => rows.flatMap((row, r) => [...row].map((ch, c) => (ch === '#' ? [r, c] : null)).filter(Boolean));
  const SHAPES = [
    { c: '#ffb020', w: 3, cells: P(['#']) },
    { c: '#ff7a45', w: 3, cells: P(['##']) }, { c: '#ff7a45', w: 3, cells: P(['#', '#']) },
    { c: '#f5487f', w: 3, cells: P(['###']) }, { c: '#f5487f', w: 3, cells: P(['#', '#', '#']) },
    { c: '#e0457b', w: 2, cells: P(['####']) }, { c: '#e0457b', w: 2, cells: P(['#', '#', '#', '#']) },
    { c: '#d64545', w: 1, cells: P(['#####']) }, { c: '#d64545', w: 1, cells: P(['#', '#', '#', '#', '#']) },
    { c: '#2fb36d', w: 4, cells: P(['##', '##']) },
    { c: '#18a6a6', w: 1.4, cells: P(['###', '###', '###']) },
    { c: '#5c6bc0', w: 2, cells: P(['##', '#.']) }, { c: '#5c6bc0', w: 2, cells: P(['##', '.#']) },
    { c: '#5c6bc0', w: 2, cells: P(['#.', '##']) }, { c: '#5c6bc0', w: 2, cells: P(['.#', '##']) },
    { c: '#3d8bfd', w: 1, cells: P(['###', '#..', '#..']) }, { c: '#3d8bfd', w: 1, cells: P(['###', '..#', '..#']) },
    { c: '#3d8bfd', w: 1, cells: P(['#..', '#..', '###']) }, { c: '#3d8bfd', w: 1, cells: P(['..#', '..#', '###']) },
    { c: '#9b59b6', w: 1, cells: P(['###', '.#.']) }, { c: '#9b59b6', w: 1, cells: P(['.#.', '###']) },
    { c: '#9b59b6', w: 1, cells: P(['#.', '##', '#.']) }, { c: '#9b59b6', w: 1, cells: P(['.#', '##', '.#']) },
    { c: '#00a3d9', w: 1, cells: P(['##.', '.##']) }, { c: '#00a3d9', w: 1, cells: P(['.##', '##.']) },
    { c: '#ffa000', w: 1, cells: P(['#..', '###']) }, { c: '#ffa000', w: 1, cells: P(['..#', '###']) },
    { c: '#8d6e63', w: .8, cells: P(['##', '##', '##']) }, { c: '#8d6e63', w: .8, cells: P(['###', '###']) },
    { c: '#c2185b', w: .5, cells: P(['.#.', '###', '.#.']) }
  ];
  const TOTAL_W = SHAPES.reduce((a, s) => a + s.w, 0);
  const SKINS = [['classic', 'Glossy'], ['jelly', 'Jelly'], ['wood', 'Wood'], ['neon', 'Neon']];
  const ACH = [
    ['first', '🧱', 'First clear', 'Clear your first line'],
    ['double', '✌️', 'Double', 'Clear two lines at once'],
    ['quad', '💥', 'Mega clear', 'Clear four lines at once'],
    ['combo5', '🔥', 'Combo king', 'Reach a ×5 combo'],
    ['wipe', '🧼', 'Clean sweep', 'Empty the whole board'],
    ['s1k', '🥉', 'Thousandaire', 'Score 1,000 in Endless'],
    ['s5k', '🥈', 'Block baron', 'Score 5,000 in Endless'],
    ['s10k', '🥇', 'Tetromancer', 'Score 10,000 in Endless'],
    ['gem1', '💎', 'Gem hunter', 'Finish a Gem hunt level'],
    ['gem30', '👑', 'Treasure hoard', 'Finish all 30 Gem hunt levels'],
    ['blitz', '⏱️', 'Speed builder', 'Score 2,000 in Blitz'],
    ['daily', '📅', 'Daily builder', 'Play a daily game to the end']
  ];

  const SAVE_V = 2;
  const load = () => {
    const base = { v: SAVE_V, mode: 'classic', skin: 'classic', level: 0, solved: {}, ach: {}, games: 0, lines: 0, best: { classic: Curio.getBest('score') || 0, blitz: 0 }, daily: {}, game: null };
    const raw = Curio.store.get('bf:v2', null);
    if (!raw || raw.v !== SAVE_V) return base;
    return { ...base, ...raw, solved: raw.solved || {}, ach: raw.ach || {}, best: { ...base.best, ...(raw.best || {}) }, daily: raw.daily || {} };
  };
  const save = load();
  if (!['classic', 'gems', 'blitz', 'daily'].includes(save.mode)) save.mode = 'classic';
  const persist = () => Curio.store.set('bf:v2', save);

  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  const hashStr = (s) => { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

  const mkPiece = (s) => { const cells = s.cells.map(([r, c]) => [r, c]); return { c: s.c, cells, h: Math.max(...cells.map((x) => x[0])) + 1, wd: Math.max(...cells.map((x) => x[1])) + 1 }; };
  let rand = Math.random;
  const randPiece = () => { let r = rand() * TOTAL_W; for (const s of SHAPES) { r -= s.w; if (r <= 0) return mkPiece(s); } return mkPiece(SHAPES[0]); };
  const rotatePiece = (p) => { const cells = p.cells.map(([r, c]) => [c, p.h - 1 - r]); return { c: p.c, cells, h: p.wd, wd: p.h }; };

  function levelLayout(k) {
    const r = rng(9137 + k * 7919);
    const g = Array(N * N).fill(null);
    const density = 0.13 + k * 0.006;
    const palette = ['#9aa0ad', '#8d93a3', '#a3a9b6'];
    const sym = k % 3 !== 2;
    for (let row = N - 1; row >= 0; row--) {
      const rowBias = row >= N - 4 ? 1.8 : row >= N - 7 ? 1 : 0.5;
      for (let c = 0; c < (sym ? N / 2 : N); c++) {
        if (r() < density * rowBias) {
          const col = palette[Math.floor(r() * 3)];
          g[row * N + c] = col;
          if (sym) g[row * N + (N - 1 - c)] = col;
        }
      }
    }
    for (let row = 0; row < N; row++) { let full = true; for (let c = 0; c < N; c++) if (!g[row * N + c]) full = false; if (full) g[row * N + Math.floor(r() * N)] = null; }
    for (let c = 0; c < N; c++) { let full = true; for (let row = 0; row < N; row++) if (!g[row * N + c]) full = false; if (full) g[Math.floor(r() * N) * N + c] = null; }
    const filled = g.map((v, i) => (v ? i : -1)).filter((i) => i >= 0);
    const gemCount = Math.min(filled.length, 3 + Math.floor(k / 3));
    const gems = new Set();
    while (gems.size < gemCount && filled.length) gems.add(filled[Math.floor(r() * filled.length)]);
    return { grid: g, gems: [...gems], seed: 555 + k * 31 };
  }

  const board = $('board'), tray = $('tray'), frame = $('frame');
  const cells = [];
  for (let i = 0; i < N * N; i++) { const d = document.createElement('div'); d.className = 'cell'; d.setAttribute('role', 'gridcell'); board.append(d); cells.push(d); }

  let grid, gems, pieces, score, streak, over, kbSel = -1, kbPos = [0, 0], ghost = null, undoLeft, rotLeft, rotMode = false, hist = [], timeLeft = 0, timer = 0, gemsTotal = 0, cleared = 0;

  const bestKey = () => (save.mode === 'daily' ? `daily-${todayKey()}` : save.mode);
  const bestVal = () => (save.mode === 'gems' ? 0 : save.mode === 'daily' ? save.daily[todayKey()] || 0 : save.best[save.mode] || 0);

  function persistGame() {
    save.game = over || save.mode !== 'classic' ? null : { grid, pieces, score, streak, undoLeft, rotLeft };
    persist();
  }

  function newGame(resume) {
    clearInterval(timer);
    cells.forEach((el) => { el.style.transition = ''; el.style.filter = ''; });
    over = false; kbSel = -1; streak = 0; score = 0; hist = []; rotMode = false; cleared = 0;
    gems = new Set();
    undoLeft = save.mode === 'blitz' ? 0 : 3; rotLeft = 3;
    rand = Math.random;
    if (save.mode === 'gems') {
      const L = levelLayout(save.level);
      grid = L.grid.slice(); gems = new Set(L.gems); gemsTotal = gems.size;
      rand = rng(L.seed);
    } else if (save.mode === 'daily') {
      grid = Array(N * N).fill(null);
      rand = rng(hashStr(todayKey()));
      undoLeft = 0; rotLeft = 2;
    } else grid = Array(N * N).fill(null);
    if (resume && save.mode === 'classic' && save.game) {
      const g = save.game;
      grid = g.grid; pieces = g.pieces; score = g.score || 0; streak = g.streak || 0; undoLeft = g.undoLeft ?? 3; rotLeft = g.rotLeft ?? 3;
    } else pieces = [randPiece(), randPiece(), randPiece()];
    if (save.mode === 'blitz') {
      timeLeft = 120;
      let last = performance.now();
      timer = setInterval(() => {
        const now = performance.now(), dt = (now - last) / 1000; last = now;
        if (document.hidden || over) return;
        const before = Math.ceil(timeLeft);
        timeLeft -= dt;
        if (Math.ceil(timeLeft) !== before) { hud(); if (timeLeft <= 5 && timeLeft > 0) Curio.beep(990, 0.04, 'square', 0.05); }
        if (timeLeft <= 0) { timeLeft = 0; clearInterval(timer); gameOver('time'); }
      }, 100);
    }
    paintModes(); paintBoard(); paintTray(true); hud(); persistGame();
    if (!pieces.some((p) => p && fitsAnywhere(p))) setTimeout(() => gameOver(), 500);
  }

  const fits = (p, r0, c0) => p.cells.every(([r, c]) => { const rr = r0 + r, cc = c0 + c; return rr >= 0 && cc >= 0 && rr < N && cc < N && !grid[rr * N + cc]; });
  const fitsAnywhere = (p) => { for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (fits(p, r, c)) return true; return false; };

  function linesAfter(p, r0, c0) {
    const g = grid.slice();
    for (const [r, c] of p.cells) g[(r0 + r) * N + c0 + c] = 1;
    const rows = [], cols = [];
    for (let r = 0; r < N; r++) { let ok = true; for (let c = 0; c < N; c++) if (!g[r * N + c]) { ok = false; break; } if (ok) rows.push(r); }
    for (let c = 0; c < N; c++) { let ok = true; for (let r = 0; r < N; r++) if (!g[r * N + c]) { ok = false; break; } if (ok) cols.push(c); }
    return { rows, cols };
  }

  function paintBoard(fresh) {
    for (let i = 0; i < N * N; i++) {
      const el = cells[i], v = grid[i];
      el.className = v ? (fresh && fresh.has(i) ? 'cell f nw' : 'cell f') : 'cell';
      if (gems.has(i)) el.classList.add('gem');
      if (v) el.style.setProperty('--c', v); else el.style.removeProperty('--c');
    }
  }

  function pieceEl(p, cls) {
    const el = document.createElement('div');
    el.className = cls; el.style.setProperty('--w', p.wd);
    const set = new Set(p.cells.map(([r, c]) => r * 10 + c));
    for (let r = 0; r < p.h; r++) for (let c = 0; c < p.wd; c++) {
      const i = document.createElement('i');
      if (!set.has(r * 10 + c)) i.className = 'x'; else i.style.setProperty('--c', p.c);
      el.append(i);
    }
    return el;
  }

  function paintTray(fresh, spun = -1) {
    tray.innerHTML = '';
    pieces.forEach((p, k) => {
      const slot = document.createElement('button');
      slot.type = 'button'; slot.className = 'slot'; slot.dataset.k = k;
      const key = document.createElement('span'); key.className = 'k'; key.textContent = k + 1; slot.append(key);
      if (p) {
        const pc = pieceEl(p, fresh ? 'pc new' : k === spun ? 'pc spin' : 'pc');
        pc.style.setProperty('--d', `${k * 70}ms`);
        slot.append(pc);
        if (!fitsAnywhere(p)) slot.classList.add('dead');
        if (rotMode) slot.classList.add('rot');
        slot.setAttribute('aria-label', `Shape ${k + 1}, ${p.cells.length} blocks${slot.classList.contains('dead') ? ', does not fit' : ''}`);
      } else { slot.disabled = true; slot.setAttribute('aria-label', `Slot ${k + 1}, empty`); }
      if (k === kbSel) slot.classList.add('sel');
      tray.append(slot);
    });
  }

  function hud(bumpScore) {
    $('score').textContent = Curio.fmt(score);
    $('best').textContent = save.mode === 'gems' ? `${Object.keys(save.solved).length}/30` : Curio.fmt(Math.max(bestVal(), score));
    $('best').nextElementSibling.textContent = save.mode === 'gems' ? 'Levels' : save.mode === 'daily' ? 'Today best' : 'Best';
    $('combo').textContent = streak > 1 ? `×${streak}` : '-';
    const ex = $('extra-stat');
    ex.hidden = save.mode !== 'gems' && save.mode !== 'blitz';
    ex.classList.toggle('low', save.mode === 'blitz' && timeLeft <= 10);
    if (save.mode === 'gems') { $('extra').textContent = `${gemsTotal - gems.size}/${gemsTotal}`; $('extra-l').textContent = 'Gems'; }
    if (save.mode === 'blitz') { const t = Math.max(0, Math.ceil(timeLeft)); $('extra').textContent = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; $('extra-l').textContent = 'Time'; }
    $('goal').textContent = save.mode === 'gems' ? `Level ${save.level + 1}: clear every 💎 by wiping the lines they sit on.` : save.mode === 'blitz' ? 'Two minutes. Score as much as you can.' : save.mode === 'daily' ? `Daily deal for ${todayKey()}: everyone gets the same shapes.` : 'Endless: survive as long as you can.';
    $('undo-n').textContent = `×${undoLeft}`; $('rot-n').textContent = `×${rotLeft}`;
    $('undo').disabled = !undoLeft || !hist.length || over;
    $('rotate').disabled = !rotLeft || over;
    if (bumpScore) { const b = $('score'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
  }

  function clearGhost() {
    if (!ghost) return;
    for (const el of cells) el.classList.remove('gh', 'clr');
    ghost = null;
  }
  function showGhost(p, r0, c0) {
    clearGhost();
    if (!fits(p, r0, c0)) return false;
    ghost = { p, r0, c0 };
    for (const [r, c] of p.cells) { const el = cells[(r0 + r) * N + c0 + c]; el.classList.add('gh'); el.style.setProperty('--g', p.c); }
    const { rows, cols } = linesAfter(p, r0, c0);
    for (const r of rows) for (let c = 0; c < N; c++) { const el = cells[r * N + c]; el.classList.add('clr'); el.style.setProperty('--g', p.c); }
    for (const c of cols) for (let r = 0; r < N; r++) { const el = cells[r * N + c]; el.classList.add('clr'); el.style.setProperty('--g', p.c); }
    return true;
  }

  function popText(text, x, y) {
    const d = document.createElement('div'); d.className = 'pop'; d.textContent = text;
    d.style.left = `${x}%`; d.style.top = `${y}%`;
    board.append(d); setTimeout(() => d.remove(), 1000);
  }
  function bits(i, color) {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const r = cells[i].getBoundingClientRect();
    for (let k = 0; k < 2; k++) {
      const b = document.createElement('i'); b.className = 'bit';
      const a = Math.random() * Math.PI * 2, d = 30 + Math.random() * 50;
      b.style.left = `${r.left + r.width / 2}px`; b.style.top = `${r.top + r.height / 2}px`;
      b.style.background = color;
      b.style.setProperty('--dx', `${Math.cos(a) * d}px`); b.style.setProperty('--dy', `${Math.sin(a) * d + 30}px`);
      document.body.append(b); setTimeout(() => b.remove(), 750);
    }
  }
  const buzz = (ms) => { try { navigator.vibrate?.(ms); } catch {} };

  function unlock(id) {
    if (save.ach[id]) return;
    save.ach[id] = Date.now(); persist();
    const a = ACH.find((x) => x[0] === id);
    if (a) setTimeout(() => Curio.toast(`${a[1]} Badge unlocked: ${a[2]}`, 2400), 700);
  }

  function snapshot() { hist.push({ grid: grid.slice(), gems: [...gems], pieces: pieces.map((p) => p && { ...p, cells: p.cells.map((x) => x.slice()) }), score, streak }); if (hist.length > 5) hist.shift(); }

  function place(k, r0, c0) {
    const p = pieces[k];
    if (!p || !fits(p, r0, c0) || over) return false;
    snapshot();
    clearGhost();
    const { rows, cols } = linesAfter(p, r0, c0);
    const placed = new Set();
    for (const [r, c] of p.cells) { grid[(r0 + r) * N + c0 + c] = p.c; placed.add((r0 + r) * N + c0 + c); }
    pieces[k] = null;
    let gained = p.cells.length;
    const lines = rows.length + cols.length;
    paintBoard(placed);
    if (lines) {
      streak++;
      const base = 10 * lines * (lines + 1) / 2;
      const bonus = base * Math.max(1, streak);
      gained += bonus;
      cleared += lines; save.lines += lines;
      const kill = new Set();
      rows.forEach((r) => { for (let c = 0; c < N; c++) kill.add(r * N + c); });
      cols.forEach((c) => { for (let r = 0; r < N; r++) kill.add(r * N + c); });
      const cr = r0 + p.h / 2, cc = c0 + p.wd / 2;
      let gemHit = 0;
      kill.forEach((i) => {
        const el = cells[i];
        const d = Math.hypot(Math.floor(i / N) - cr, (i % N) - cc) * 22;
        el.style.setProperty('--d', `${d}ms`);
        el.classList.add('boom');
        setTimeout(() => bits(i, grid[i] || p.c), d);
        if (gems.has(i)) { gems.delete(i); gemHit++; }
      });
      kill.forEach((i) => { grid[i] = null; });
      if (gemHit) { gained += gemHit * 50; setTimeout(() => popText(`💎 ×${gemHit}`, 50, 30), 200); [1175, 1568].forEach((f, q) => setTimeout(() => Curio.beep(f, 0.1, 'sine', 0.08), 150 + q * 90)); }
      setTimeout(() => paintBoard(), 380 + 10 * 22 + 20);
      const notes = [523, 659, 784, 988, 1175, 1319];
      for (let q = 0; q < Math.min(lines + streak - 1, 6); q++) setTimeout(() => Curio.beep(notes[q], 0.11, 'triangle', 0.09), q * 70);
      popText(`+${bonus}`, (cc / N) * 100, (cr / N) * 100);
      if (streak > 1) setTimeout(() => popText(`Combo ×${streak}!`, 50, 42), 160);
      if (lines >= 2) { frame.classList.remove('shake'); void frame.offsetWidth; frame.classList.add('shake'); buzz(lines * 12); }
      if (lines >= 3) Curio.toast(lines >= 4 ? 'Absolutely enormous clear!' : 'Triple clear!', 1200);
      unlock('first'); if (lines >= 2) unlock('double'); if (lines >= 4) unlock('quad'); if (streak >= 5) unlock('combo5');
      if (grid.every((v) => !v)) { gained += 300; setTimeout(() => { popText('Clean sweep! +300', 50, 55); Curio.confetti(60); }, 300); unlock('wipe'); }
    } else {
      streak = 0;
      Curio.beep(260 + p.cells.length * 25, 0.06, 'triangle', 0.08);
    }
    score += gained;
    const refilled = pieces.every((x) => !x);
    if (refilled) pieces = [randPiece(), randPiece(), randPiece()];
    kbSel = -1; rotMode = false;
    paintTray(refilled);
    hud(true); persistGame();
    if (save.mode === 'classic') { if (score >= 1000) unlock('s1k'); if (score >= 5000) unlock('s5k'); if (score >= 10000) unlock('s10k'); }
    if (save.mode === 'gems' && !gems.size) { setTimeout(levelWon, 700); return true; }
    if (!pieces.some((x) => x && fitsAnywhere(x))) setTimeout(() => gameOver(), lines ? 900 : 450);
    return true;
  }

  function undo() {
    if (!undoLeft || !hist.length || over) return;
    const h = hist.pop();
    grid = h.grid; gems = new Set(h.gems); pieces = h.pieces; score = h.score; streak = h.streak;
    undoLeft--;
    clearGhost(); paintBoard(); paintTray(false); hud(); persistGame();
    Curio.beep(400, 0.05, 'sine', 0.07);
  }
  function toggleRotate() {
    if (!rotLeft || over) return;
    rotMode = !rotMode;
    paintTray(false);
    if (rotMode) Curio.toast('Tap a shape to turn it 90°.');
  }
  function rotateSlot(k) {
    if (!pieces[k] || !rotLeft) return;
    pieces[k] = rotatePiece(pieces[k]);
    rotLeft--; rotMode = false;
    Curio.beep(700, 0.05, 'triangle', 0.07);
    paintTray(false, k); hud(); persistGame();
  }

  async function levelWon() {
    if (over) return;
    over = true;
    const first = !save.solved[save.level];
    save.solved[save.level] = 1; persist();
    unlock('gem1'); if (Object.keys(save.solved).length >= 30) unlock('gem30');
    Curio.confetti();
    [523, 659, 784, 1047].forEach((f, k) => setTimeout(() => Curio.beep(f, 0.14, 'triangle', 0.1), k * 110));
    paintLevels(); hud();
    const last = save.level >= 29;
    const v = await Curio.modal({ emoji: '💎', title: `Level ${save.level + 1} cleared!`, body: `Every gem collected with ${Curio.fmt(score)} points.${first ? '' : ' (Replayed.)'}${last ? ' That was the final level!' : ''}`, buttons: [...(last ? [] : [{ label: 'Next level', value: 'next' }]), { label: 'Replay', value: 'again' }] });
    if (v === 'next') save.level++;
    persist();
    newGame();
    paintLevels();
  }

  async function gameOver(why) {
    if (over) return;
    over = true; clearInterval(timer);
    save.games++;
    Curio.beep(220, 0.2, 'sawtooth', 0.06); setTimeout(() => Curio.beep(165, 0.3, 'sawtooth', 0.06), 180);
    cells.forEach((el, i) => { if (grid[i]) { el.style.transition = `filter .4s ${i * 4}ms`; el.style.filter = 'grayscale(1) brightness(.85)'; } });
    let isNew = false;
    if (save.mode === 'daily') { isNew = score > (save.daily[todayKey()] || 0); if (isNew) save.daily[todayKey()] = score; unlock('daily'); }
    else if (save.mode !== 'gems') { isNew = score > (save.best[save.mode] || 0); if (isNew) save.best[save.mode] = score; if (save.mode === 'classic') Curio.best('score', score); }
    if (save.mode === 'blitz' && score >= 2000) unlock('blitz');
    persistGame(); persist();
    if (isNew && score > 0) Curio.confetti();
    paintStats();
    const lines = ['No room at the inn.', 'The board is full of regrets.', 'Every shape refuses to fit.', 'Tetris would never.'];
    const title = why === 'time' ? 'Time!' : save.mode === 'gems' ? 'Stuck!' : isNew && score > 0 ? 'New best!' : 'Out of room!';
    const body = save.mode === 'gems' ? `${gems.size} gem${gems.size === 1 ? '' : 's'} left on level ${save.level + 1}. Plan ahead and keep the gem rows open.` : `${why === 'time' ? 'Two minutes are up.' : Curio.pick(lines)} You scored ${Curio.fmt(score)} and cleared ${cleared} line${cleared === 1 ? '' : 's'}. ${isNew ? '' : `Best: ${Curio.fmt(bestVal())}.`}`;
    const v = await Curio.modal({ emoji: why === 'time' ? '⏱️' : isNew && score > 0 ? '🏆' : '🧱', title, body, buttons: [{ label: save.mode === 'gems' ? 'Retry' : 'Play again', value: 'again' }, { label: 'Share', value: 'share' }, { label: 'Look at the board', value: 'look' }] });
    cells.forEach((el) => { el.style.transition = ''; el.style.filter = ''; });
    if (v === 'share') { try { await navigator.clipboard.writeText(`🧱 Zoble Block Fit ${save.mode === 'daily' ? `daily ${todayKey()}` : save.mode}: ${Curio.fmt(score)} points, ${cleared} lines.`); Curio.toast('Copied!'); } catch { Curio.toast('Could not reach the clipboard.'); } }
    if (v === 'again') newGame();
  }

  let drag = null;
  function boardMetrics() {
    const r = board.getBoundingClientRect();
    const gap = parseFloat(getComputedStyle(board).gap) || 3;
    const cs = (r.width - gap * 2 - gap * (N - 1)) / N;
    return { left: r.left + gap, top: r.top + gap, cs, pitch: cs + gap, gap };
  }
  function moveDrag(x, y) {
    const left = x - drag.w / 2, top = y - drag.lift;
    drag.fl.style.left = `${left}px`; drag.fl.style.top = `${top}px`;
    const m = boardMetrics();
    showGhost(drag.p, Math.round((top - m.top) / m.pitch), Math.round((left - m.left) / m.pitch));
  }
  let wantUnlatch = false;
  Curio.drag(document.querySelector('.stage'), {
    start(pt) {
      drag = null;
      const slot = pt.event.target.closest('.slot');
      if (!slot || over) { wantUnlatch = true; try { document.querySelector('.stage').releasePointerCapture(pt.event.pointerId); } catch {} return; }
      const k = +slot.dataset.k, p = pieces[k];
      if (!p) { wantUnlatch = true; return; }
      pt.event.preventDefault();
      if (rotMode) { rotateSlot(k); wantUnlatch = true; return; }
      const m = boardMetrics();
      const fl = pieceEl(p, 'fl');
      fl.style.setProperty('--cs', `${m.cs}px`);
      fl.style.setProperty('--gap', `${m.gap}px`);
      document.body.append(fl);
      const w = p.wd * m.pitch - m.gap, h = p.h * m.pitch - m.gap;
      const lift = pt.pointerType === 'mouse' ? h / 2 : h + 46;
      drag = { k, p, fl, w, h, lift, slot };
      slot.classList.add('lift');
      kbSel = -1; tray.querySelectorAll('.slot').forEach((x) => x.classList.remove('sel'));
      moveDrag(pt.clientX, pt.clientY);
      Curio.beep(500, 0.03, 'triangle', 0.05);
    },
    move(pt) { if (drag) moveDrag(pt.clientX, pt.clientY); },
    end(pt) {
      if (!drag) return;
      const d = drag; drag = null;
      d.fl.remove(); d.slot.classList.remove('lift');
      if (pt && ghost && ghost.p) place(d.k, ghost.r0, ghost.c0);
      else clearGhost();
    }
  });
  addEventListener('pointerup', () => { if (wantUnlatch) { wantUnlatch = false; if (Curio.touchpad) window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); } });

  function kbGhost() { if (kbSel >= 0 && pieces[kbSel]) { const ok = showGhost(pieces[kbSel], kbPos[0], kbPos[1]); if (!ok) { clearGhost(); outline(); } } }
  function outline() {
    const p = pieces[kbSel];
    for (const [r, c] of p.cells) { const rr = kbPos[0] + r, cc = kbPos[1] + c; if (rr < N && cc < N) { const el = cells[rr * N + cc]; el.classList.add('clr'); el.style.setProperty('--g', '#d64545'); } }
    ghost = { bad: true };
  }
  addEventListener('keydown', (e) => {
    if (over || document.querySelector('.curio-modal') || e.ctrlKey || e.metaKey) return;
    if (['1', '2', '3'].includes(e.key)) {
      const k = +e.key - 1; if (!pieces[k]) return;
      if (rotMode) { rotateSlot(k); return; }
      kbSel = k; paintTray(false);
      const p = pieces[k];
      kbPos = [Math.min(kbPos[0], N - p.h), Math.min(kbPos[1], N - p.wd)];
      kbGhost(); return;
    }
    if (e.key === 'u' || e.key === 'U') { undo(); return; }
    if (e.key === 'r' || e.key === 'R') { if (kbSel >= 0 && rotLeft) { const k = kbSel; rotateSlot(k); kbSel = k; const p = pieces[k]; kbPos = [Math.min(kbPos[0], N - p.h), Math.min(kbPos[1], N - p.wd)]; paintTray(false); kbGhost(); } else toggleRotate(); return; }
    if (kbSel < 0) return;
    const p = pieces[kbSel];
    const d = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key];
    if (d) {
      e.preventDefault();
      kbPos = [Math.max(0, Math.min(N - p.h, kbPos[0] + d[0])), Math.max(0, Math.min(N - p.wd, kbPos[1] + d[1]))];
      kbGhost();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (fits(p, kbPos[0], kbPos[1])) place(kbSel, kbPos[0], kbPos[1]);
      else Curio.beep(150, 0.06, 'square', 0.03);
    } else if (e.key === 'Escape') { kbSel = -1; clearGhost(); paintTray(false); }
  });
  tray.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.closest('.slot')) { e.preventDefault(); e.stopPropagation(); const k = +e.target.closest('.slot').dataset.k; if (!pieces[k]) return; if (rotMode) { rotateSlot(k); return; } kbSel = k; paintTray(false); tray.querySelectorAll('.slot')[k].focus(); kbGhost(); } });

  function paintModes() {
    $('modes').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === save.mode)));
    document.body.dataset.skin = save.skin;
    $('skins').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.s === save.skin)));
  }
  function paintLevels() {
    const box = $('levels'); box.replaceChildren();
    const maxOpen = Math.max(0, ...Object.keys(save.solved).map((x) => +x + 1));
    for (let k = 0; k < 30; k++) {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = k + 1;
      b.className = (save.solved[k] ? 'ok' : '') + (save.mode === 'gems' && save.level === k ? ' cur' : '');
      b.disabled = k > maxOpen;
      b.setAttribute('aria-label', `Gem hunt level ${k + 1}${save.solved[k] ? ', cleared' : b.disabled ? ', locked' : ''}`);
      b.addEventListener('click', () => { save.mode = 'gems'; save.level = k; persist(); newGame(); paintLevels(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
      box.append(b);
    }
    $('lv-count').textContent = `${Object.keys(save.solved).length}/30`;
  }
  function paintStats() {
    $('statgrid').innerHTML = [[save.games, 'Games'], [Curio.fmt(save.lines), 'Lines'], [Curio.fmt(save.best.classic || 0), 'Endless best'], [Curio.fmt(save.best.blitz || 0), 'Blitz best'], [Object.keys(save.solved).length, 'Gem levels'], [Object.keys(save.ach).length, 'Badges']]
      .map(([v, l]) => `<div class="c-stat"><b>${v}</b><span>${l}</span></div>`).join('');
    $('achs').innerHTML = ACH.map(([id, e, n, d]) => `<div class="ach${save.ach[id] ? ' on' : ''}" title="${d}"><span>${e}</span><div><b>${n}</b>${d}</div></div>`).join('');
    $('ach-count').textContent = `${Object.keys(save.ach).length}/${ACH.length}`;
  }
  SKINS.forEach(([id, name]) => {
    const b = document.createElement('button'); b.type = 'button'; b.dataset.s = id;
    b.innerHTML = `<span class="skin-demo" data-s="${id}">${['#f5487f', '#2fb36d', '#3d8bfd', '#ffb020', '#9b59b6', '#18a6a6'].map((c) => `<i style="--c:${c}"></i>`).join('')}</span>${name}`;
    b.addEventListener('click', () => { save.skin = id; persist(); paintModes(); Curio.beep(700, 0.04, 'sine', 0.06); });
    $('skins').append(b);
  });

  $('modes').addEventListener('click', async (e) => {
    const b = e.target.closest('button'); if (!b || b.dataset.mode === save.mode) return;
    if (score > 0 && !over && save.mode !== 'classic') {
      const v = await Curio.modal({ emoji: '🤔', title: 'Leave this game?', body: `You're on ${Curio.fmt(score)} points.`, buttons: [{ label: 'Switch', value: 'y' }, { label: 'Stay', value: 'n' }] });
      if (v !== 'y') return;
    }
    if (save.mode === 'classic') persistGame();
    save.mode = b.dataset.mode; persist();
    newGame(true); paintLevels();
  });
  $('undo').addEventListener('click', undo);
  $('rotate').addEventListener('click', toggleRotate);
  $('new').addEventListener('click', async () => {
    if (score > 0 && !over) {
      const v = await Curio.modal({ emoji: '🤔', title: 'Start over?', body: `You're on ${Curio.fmt(score)} points.`, buttons: [{ label: 'New game', value: 'y' }, { label: 'Cancel', value: 'n' }] });
      if (v !== 'y') return;
    }
    if (save.mode === 'classic') save.game = null;
    newGame();
  });

  paintStats();
  paintLevels();
  newGame(true);
  window.__bf = { place, fits, get grid() { return grid; }, set grid(g) { grid = g; paintBoard(); paintTray(false); }, get pieces() { return pieces; }, set pieces(p) { pieces = p; paintTray(false); }, get score() { return score; }, get over() { return over; }, get gems() { return gems; }, SHAPES, mkPiece, setMode(m, lv) { save.mode = m; if (lv != null) save.level = lv; persist(); newGame(); }, undo, rotateSlot, fitsAnywhere };
  if (!Curio.touchpad && !Curio.store.get('padtip:block-puzzle', false)) { Curio.store.set('padtip:block-puzzle', true); setTimeout(() => Curio.toast('Tip: on a laptop touchpad? Turn on Touchpad mode in the top bar.', 3400), 2200); }
})();
