'use strict';
const LO = (() => {
  const VARIANTS = {
    classic: { name: 'Classic', offs: [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]], wrap: false, p: 2, sizes: [3, 4, 5, 6, 7] },
    cross: { name: 'Diagonal', offs: [[0, 0], [1, 1], [-1, 1], [1, -1], [-1, -1]], wrap: false, p: 2, sizes: [3, 4, 5, 6, 7] },
    torus: { name: 'Wraparound', offs: [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]], wrap: true, p: 2, sizes: [3, 4, 5, 6, 7] },
    tri: { name: 'Three-state', offs: [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]], wrap: false, p: 3, sizes: [3, 4, 5, 6] },
    pics: { name: 'Pictures', offs: [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]], wrap: false, p: 2, sizes: [] }
  };
  const effCache = new Map();
  function effects(v, n) {
    const key = v + n;
    if (effCache.has(key)) return effCache.get(key);
    const V = VARIANTS[v], out = [];
    for (let j = 0; j < n * n; j++) {
      const y = Math.floor(j / n), x = j % n, set = new Set();
      for (const [dx, dy] of V.offs) {
        let xx = x + dx, yy = y + dy;
        if (V.wrap) { xx = (xx + n) % n; yy = (yy + n) % n; }
        else if (xx < 0 || yy < 0 || xx >= n || yy >= n) continue;
        set.add(yy * n + xx);
      }
      out.push([...set]);
    }
    effCache.set(key, out);
    return out;
  }
  function press(v, n, b, j, times = 1) {
    const p = VARIANTS[v].p;
    for (const i of effects(v, n)[j]) b[i] = (b[i] + times) % p;
  }
  function solve(v, n, b, t) {
    const p = VARIANTS[v].p, N = n * n, eff = effects(v, n);
    const inv = p === 2 ? [0, 1] : [0, 1, 2];
    const rows = [];
    for (let i = 0; i < N; i++) {
      const r = new Uint8Array(N + 1);
      r[N] = (((t ? t[i] : 0) - b[i]) % p + p) % p;
      rows.push(r);
    }
    for (let j = 0; j < N; j++) for (const i of eff[j]) rows[i][j] = (rows[i][j] + 1) % p;
    const pivCol = [];
    let row = 0;
    for (let c = 0; c < N && row < N; c++) {
      let pr = -1;
      for (let r = row; r < N; r++) if (rows[r][c]) { pr = r; break; }
      if (pr < 0) continue;
      [rows[row], rows[pr]] = [rows[pr], rows[row]];
      const f = inv[rows[row][c]];
      if (f !== 1) for (let k = c; k <= N; k++) rows[row][k] = (rows[row][k] * f) % p;
      for (let r = 0; r < N; r++) {
        if (r === row || !rows[r][c]) continue;
        const m = rows[r][c];
        for (let k = c; k <= N; k++) rows[r][k] = ((rows[r][k] - m * rows[row][k]) % p + p) % p;
      }
      pivCol.push(c); row++;
    }
    for (let r = row; r < N; r++) if (rows[r][N]) return null;
    const isPiv = new Uint8Array(N); pivCol.forEach((c) => { isPiv[c] = 1; });
    const free = []; for (let c = 0; c < N; c++) if (!isPiv[c]) free.push(c);
    const build = (fv) => {
      const x = new Uint8Array(N);
      free.forEach((f, k) => { x[f] = fv[k]; });
      pivCol.forEach((c, r) => {
        let val = rows[r][N];
        for (const f of free) if (rows[r][f] && x[f]) val = ((val - rows[r][f] * x[f]) % p + p) % p;
        x[c] = val;
      });
      return x;
    };
    const combos = p ** free.length;
    const exact = combos <= 8192;
    let best = null, bestW = Infinity;
    for (let m = 0; m < (exact ? combos : 1); m++) {
      const fv = []; let mm = m;
      for (let k = 0; k < free.length; k++) { fv.push(mm % p); mm = Math.floor(mm / p); }
      const x = build(fv);
      let w = 0; for (let i = 0; i < N; i++) w += x[i];
      if (w < bestW) { bestW = w; best = x; }
    }
    best.weight = bestW;
    best.exact = exact;
    return best;
  }
  function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const LEVELS = 20;
  const VSEED = { classic: 0, cross: 7777, torus: 15551, tri: 23327 };
  function level(v, n, L, seedExtra = 0) {
    const N = n * n, p = VARIANTS[v].p;
    const presses = Math.min(N - 1, 1 + Math.round(L * N * 0.5 / LEVELS));
    for (let attempt = 0; ; attempt++) {
      const r = rng(n * 100003 + L * 7919 + attempt * 31 + VSEED[v] + seedExtra);
      const order = Array.from({ length: N }, (_, i) => i);
      for (let i = N - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
      const b = new Uint8Array(N);
      order.slice(0, presses).forEach((i) => press(v, n, b, i, p === 3 ? 1 + (r() < 0.4 ? 1 : 0) : 1));
      const sol = solve(v, n, b);
      const w = sol ? sol.weight : 0;
      if ((w >= Math.max(1, Math.min(presses, Math.ceil(presses * 0.7))) || attempt > 40) && w > 0) return { board: b, par: w, exact: sol.exact };
    }
  }
  function picture(i) {
    const pic = window.LO_PICTURES[i];
    const n = pic.rows.length;
    const t = new Uint8Array(n * n);
    pic.rows.forEach((row, y) => [...row].forEach((ch, x) => { t[y * n + x] = ch === '#' ? 1 : 0; }));
    const b = new Uint8Array(n * n);
    const sol = solve('pics', n, b, t);
    return { n, target: t, board: b, par: sol ? sol.weight : 0, exact: sol ? sol.exact : false, name: pic.name, ok: !!sol };
  }
  return { VARIANTS, solve, press, level, picture, LEVELS, effects };
})();

(() => {
  const $ = (id) => document.getElementById(id);
  const boardEl = $('board'), seg = $('seg'), vseg = $('vseg');
  const V = LO.VARIANTS;
  const ACH = [
    { id: 'first', name: 'Lights Out', d: 'Solve any board' },
    { id: 'perfect', name: 'Efficient', d: 'Solve in the fewest possible moves' },
    { id: 'perfect10', name: 'Minimalist', d: 'Ten solves in the fewest moves' },
    { id: 'big', name: 'Big Board', d: 'Solve a 7×7 board' },
    { id: 'cross', name: 'X Marks', d: 'Solve a diagonal board' },
    { id: 'torus', name: 'Round the World', d: 'Solve a wraparound board' },
    { id: 'tri', name: 'Tricolour', d: 'Solve a three-state board' },
    { id: 'pic', name: 'Pixel Painter', d: 'Finish a picture' },
    { id: 'pics', name: 'Gallery', d: 'Finish all 20 pictures' },
    { id: 'daily', name: 'Daily Switch', d: 'Solve the daily puzzle' },
    { id: 'speedy', name: 'Quick Fingers', d: 'Solve a 5×5 board in under 20 seconds' },
    { id: 'stars60', name: 'Star Collector', d: 'Collect 60 stars' }
  ];
  const SKEY = 'lo2';
  const loadS = () => {
    const base = { v: 1, solved: {}, stars: {}, ach: {}, stats: { solved: 0, perfect: 0, presses: 0, hints: 0 }, daily: {}, variant: 'classic', n: Curio.store.get('lo:n', 5) };
    const d = Curio.store.get(SKEY, null);
    if (d && typeof d === 'object' && d.v === 1) return { ...base, ...d, stats: { ...base.stats, ...(d.stats || {}) } };
    for (const k of V.classic.sizes) { const sv = Curio.store.get(`lo:solved:${k}`, 0) | 0; if (sv) base.solved[`classic-${k}`] = sv; }
    return base;
  };
  const S = loadS();
  const save = () => Curio.store.set(SKEY, S);
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  let variant = V[S.variant] ? S.variant : 'classic';
  let n = 5, L = 1, kind = 'level', start, b, target = null, par, exact = true, moves = 0, history = [], cells = [], sel = 0, status = 'playing';
  let elapsed = 0, t0 = 0, started = false, hints = 0, showSol = false, hintCell = -1, gameId = 0, picName = '';

  const fmtT = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const vkey = () => (variant === 'pics' ? 'pics' : `${variant}-${n}`);
  const solvedCount = () => S.solved[vkey()] || 0;
  const unlocked = () => (variant === 'pics' ? LO.LEVELS : Math.min(LO.LEVELS, solvedCount() + 1));
  const starsFor = (m, p) => (m <= p ? 3 : m <= p + 3 ? 2 : 1);
  const bestKey = () => (variant === 'classic' ? `moves-${n}-${L}` : `${vkey()}-moves-${L}`);
  const P = () => V[variant].p;

  Object.entries(V).forEach(([k, v]) => {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.dataset.v = k; btn.textContent = v.name;
    btn.addEventListener('click', () => { variant = k; S.variant = k; save(); kind = 'level'; if (k !== 'pics' && !V[k].sizes.includes(n)) n = 5; paintSizes(); load(variant === 'pics' ? 1 : unlocked()); });
    vseg.append(btn);
  });
  function paintSizes() {
    seg.innerHTML = '';
    seg.hidden = variant === 'pics';
    for (const k of V[variant].sizes) {
      const btn = document.createElement('button');
      btn.type = 'button'; btn.dataset.n = k; btn.textContent = k === 5 && variant === 'classic' ? '5×5 classic' : `${k}×${k}`;
      btn.setAttribute('aria-pressed', String(k === n));
      btn.addEventListener('click', () => { n = k; S.n = n; save(); kind = 'level'; load(unlocked()); });
      seg.append(btn);
    }
    [...vseg.children].forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.v === variant)));
  }
  function picSvg(i) {
    const rows = window.LO_PICTURES[i].rows, m = rows.length;
    let r = '';
    rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '#') r += `<rect x="${x}" y="${y}" width=".9" height=".9" rx=".2"/>`; }));
    return `<svg viewBox="0 0 ${m} ${m}" aria-hidden="true" fill="currentColor">${r}</svg>`;
  }
  function paintLevels() {
    const el = $('levels');
    let h = '';
    for (let i = 1; i <= LO.LEVELS; i++) {
      const st = S.stars[`${vkey()}-${i}`] || 0;
      const lock = i > unlocked();
      const cur = kind === 'level' && i === L;
      if (variant === 'pics') h += `<button type="button" class="lv pic" data-l="${i}" aria-current="${cur}" aria-label="Picture ${i}: ${window.LO_PICTURES[i - 1].name}${st ? ', ' + st + ' stars' : ''}" title="${window.LO_PICTURES[i - 1].name}" style="${st ? 'color:var(--warn)' : ''}">${picSvg(i - 1)}</button>`;
      else h += `<button type="button" class="lv" data-l="${i}" aria-current="${cur}" ${lock ? 'disabled' : ''} aria-label="Level ${i}${lock ? ' (locked)' : st ? ', ' + st + ' stars' : ''}">${lock ? '🔒' : i}<small>${st ? '★'.repeat(st) : ''}</small></button>`;
    }
    el.innerHTML = h;
  }
  $('levels').addEventListener('click', (e) => { const b = e.target.closest('[data-l]'); if (!b || b.disabled) return; kind = 'level'; load(+b.dataset.l); Curio.beep(600, 0.04, 'triangle', 0.05); });

  function load(level, opts = {}) {
    gameId++;
    L = level;
    let lv;
    target = null;
    if (kind === 'daily') {
      const day = Math.floor(Date.now() / 864e5);
      const vs = ['classic', 'cross', 'torus', 'tri'];
      variant = vs[day % 4]; n = 5;
      lv = LO.level(variant, n, 14, day * 13);
    } else if (variant === 'pics') {
      lv = LO.picture(L - 1);
      n = lv.n; target = lv.target; picName = lv.name;
    } else lv = LO.level(variant, n, L);
    start = lv.board; par = lv.par; exact = lv.exact; b = start.slice();
    moves = 0; history = []; status = 'playing'; elapsed = 0; started = false; hints = 0; showSol = false; hintCell = -1;
    $('result').hidden = true;
    boardEl.classList.remove('won', 'pic-won');
    boardEl.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
    boardEl.style.setProperty('--gap', `${Math.max(5, 14 - n)}px`);
    boardEl.innerHTML = '';
    cells = Array.from({ length: n * n }, (_, i) => {
      const c = document.createElement('button');
      c.type = 'button'; c.className = 'cell'; c.dataset.i = i; c.tabIndex = -1;
      boardEl.append(c);
      return c;
    });
    sel = Math.min(sel, n * n - 1);
    cells[sel].tabIndex = 0;
    $('target').hidden = !target;
    if (target) {
      $('tgrid').style.gridTemplateColumns = `repeat(${n}, 1fr)`;
      $('tgrid').innerHTML = [...target].map((v) => `<i class="${v ? 'on' : ''}"></i>`).join('');
      $('tname').textContent = picName;
    }
    $('brand').textContent = kind === 'daily' ? `DAILY·${V[variant].name.toUpperCase()}` : `${V[variant].name.toUpperCase()}·${variant === 'pics' ? picName.toUpperCase() : n + '×' + n}`;
    $('parLbl').textContent = exact ? 'Optimal' : 'Target';
    $('litLbl').textContent = target ? 'To fix' : 'Lit';
    paintSizes();
    paintLevels();
    if (!opts.quiet) {
      if (kind === 'daily') msg(`Today's puzzle is a ${V[variant].name.toLowerCase()} board. Can you do it in ${par}?`);
      else if (target) msg(`Switch lights on until the board looks like the ${picName.toLowerCase()}. ${par} presses will do it.`);
      else if (L === 1 && n === 5 && variant === 'classic') msg('Tip: press a light and watch its neighbours flip too.');
      else if (variant === 'tri') msg(`Lights cycle off, yellow, blue, off. Can you do it in ${par}?`);
      else msg(`Can you do it in ${par}?`);
    }
    render();
  }
  function msg(t) { $('msg').textContent = t; }
  function diffCount() { let c = 0; for (let i = 0; i < b.length; i++) if (b[i] !== (target ? target[i] : 0)) c++; return c; }
  function render() {
    const sol = showSol || hintCell >= 0 ? LO.solve(variant, n, b, target) : null;
    cells.forEach((c, i) => {
      c.classList.toggle('on', b[i] === 1);
      c.classList.toggle('on2', b[i] === 2);
      c.classList.toggle('want', !!(target && target[i]));
      c.classList.toggle('hint', status === 'playing' && ((showSol && sol && sol[i] > 0) || i === hintCell));
      const st = b[i] === 0 ? 'off' : b[i] === 1 ? (P() === 3 ? 'yellow' : 'on') : 'blue';
      c.setAttribute('aria-label', `Row ${Math.floor(i / n) + 1} column ${i % n + 1}, ${st}${target && target[i] ? ', should be on' : ''}${showSol && sol && sol[i] ? `, press ${sol[i] > 1 ? 'twice' : 'once'}` : ''}`);
    });
    const lit = b.reduce((a, v) => a + (v ? 1 : 0), 0);
    const mv = $('moves');
    if (mv.textContent !== String(moves)) { mv.textContent = moves; mv.classList.add('bump'); setTimeout(() => mv.classList.remove('bump'), 140); }
    $('par').textContent = par;
    $('lit').textContent = target ? diffCount() : lit;
    $('time').textContent = fmtT(elapsed);
    const best = kind === 'daily' ? S.daily[today()] : Curio.getBest(bestKey());
    $('best').textContent = best == null ? '-' : best;
    $('play').style.setProperty('--lit', String(Math.min(1, lit / (n * n) * 1.4)));
    $('led').classList.toggle('done', status !== 'playing');
    $('undo').disabled = !history.length || status !== 'playing';
    $('show').setAttribute('aria-pressed', String(showSol));
  }
  function ring(i) {
    const c = cells[i];
    const r = document.createElement('span');
    r.className = 'ring';
    r.style.left = `${c.offsetLeft}px`; r.style.top = `${c.offsetTop}px`;
    r.style.width = `${c.offsetWidth}px`; r.style.height = `${c.offsetHeight}px`;
    if (b[i] === 2) r.style.borderColor = 'var(--on3)';
    boardEl.style.position = 'relative';
    boardEl.append(r);
    setTimeout(() => r.remove(), 520);
  }
  function tap(i, fromUndo = false) {
    if (status !== 'playing') return;
    if (!started) { started = true; t0 = performance.now(); }
    LO.press(variant, n, b, i, fromUndo ? P() - 1 : 1);
    if (fromUndo) moves--; else { moves++; history.push(i); S.stats.presses++; }
    if (hintCell === i) hintCell = -1;
    LO.effects(variant, n)[i].forEach((j, k) => {
      const c = cells[j];
      c.classList.remove('flip');
      setTimeout(() => c.classList.add('flip'), k ? 40 : 0);
    });
    if (!fromUndo) ring(i);
    const y = Math.floor(i / n), x = i % n;
    Curio.beep(b[i] === 1 ? 660 + x * 40 : b[i] === 2 ? 880 + x * 30 : 330 + y * 30, 0.07, 'triangle', 0.07);
    navigator.vibrate?.(5);
    render();
    if (!fromUndo) checkWin();
  }
  function undo() {
    if (!history.length || status !== 'playing') return;
    tap(history.pop(), true);
  }
  function hint() {
    if (status !== 'playing') return;
    const sol = LO.solve(variant, n, b, target);
    if (!sol) return;
    const opts = [];
    let left = 0;
    sol.forEach((v, i) => { if (v) { opts.push(i); left += v; } });
    if (!opts.length) return;
    hintCell = opts.includes(sel) ? sel : opts[Math.floor(opts.length / 2)];
    hints++; S.stats.hints++; save();
    msg(`${left} press${left > 1 ? 'es' : ''} left if you play perfectly. Try the ringed light.`);
    Curio.beep(880, 0.08, 'sine', 0.06);
    render();
  }
  const starSvg = (on) => `<svg viewBox="0 0 24 24"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 21l1.6-7L2 9.2l7.1-.6z" fill="${on ? '#ffc93c' : 'var(--surface-2)'}" stroke="${on ? '#e09b00' : 'var(--line)'}" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
  function award(id, fresh) { if (!S.ach[id]) { S.ach[id] = Date.now(); fresh.push(id); } }
  const totalStars = () => Object.values(S.stars).reduce((a, c) => a + c, 0);
  function checkWin() {
    const d = diffCount();
    if (d) {
      if (moves === par * 2 + 6 && !hints) msg('Stuck? The Hint button knows the shortest way out.');
      return;
    }
    status = 'won';
    tick();
    const secs = Math.round(elapsed);
    const assisted = hints > 0 || showSol;
    const st = starsFor(moves, par);
    const fresh = [];
    let bm = { best: null, isNew: false };
    if (!assisted) {
      S.stats.solved++;
      if (moves <= par) S.stats.perfect++;
      award('first', fresh);
      if (moves <= par) award('perfect', fresh);
      if (S.stats.perfect >= 10) award('perfect10', fresh);
      if (n === 7 && !target) award('big', fresh);
      if (V[variant] && ['cross', 'torus', 'tri'].includes(variant)) award(variant, fresh);
      if (n === 5 && secs < 20 && !target) award('speedy', fresh);
      if (kind === 'daily') { award('daily', fresh); S.daily[today()] = Math.min(S.daily[today()] ?? 999, moves); }
      else {
        bm = Curio.best(bestKey(), moves, false);
        const k = `${vkey()}-${L}`;
        S.stars[k] = Math.max(S.stars[k] || 0, st);
        if (L > solvedCount()) S.solved[vkey()] = L;
        if (target) { award('pic', fresh); if (window.LO_PICTURES.every((_, i) => S.stars[`pics-${i + 1}`])) award('pics', fresh); }
      }
      if (totalStars() >= 60) award('stars60', fresh);
      save();
    }
    boardEl.classList.add(target ? 'pic-won' : 'won');
    cells.forEach((c, i) => { c.style.animationDelay = `${(Math.floor(i / n) + (i % n)) * 55}ms`; });
    if (!assisted) Curio.confetti();
    [392, 523, 659, 784, 1046].forEach((f, k) => setTimeout(() => Curio.beep(f, 0.14, 'triangle', 0.09), k * 90));
    navigator.vibrate?.([20, 40, 20]);
    msg(moves <= par ? (target ? 'Picture perfect, and perfectly efficient.' : 'Lights out. Perfectly efficient.') : target ? 'Picture complete!' : 'Lights out!');
    render();
    paintLevels();
    const gid = gameId;
    setTimeout(() => {
      if (gid !== gameId) return;
      cells.forEach((c) => { c.style.animationDelay = ''; });
      const last = L >= LO.LEVELS || kind === 'daily';
      $('rStars').innerHTML = [1, 2, 3].map((i) => starSvg(!assisted && i <= st)).join('');
      $('rTitle').textContent = assisted ? 'Solved with help' : st === 3 ? (target ? 'Picture perfect!' : 'Perfect darkness!') : target ? 'Picture done!' : 'All dark!';
      $('rBody').textContent = `${moves} moves (${exact ? 'optimal' : 'target'} ${par}) in ${fmtT(secs)}.${assisted ? ' Hints were used, so no stars this time.' : bm.isNew ? ' New best!' : bm.best != null ? ` Best: ${bm.best}.` : ''}${L >= LO.LEVELS && kind !== 'daily' ? ' That was the last level here. Try another size or variant!' : ''}`;
      $('rBadges').innerHTML = fresh.map((id) => { const a = ACH.find((x) => x.id === id); return `<span class="badge on new" title="${a.d}">★ ${a.name}</span>`; }).join('');
      $('rNext').hidden = last;
      $('rNext').textContent = target ? 'Next picture' : `Level ${L + 1}`;
      $('rAgain').textContent = st < 3 || assisted ? 'Retry for 3 stars' : 'Replay';
      $('result').hidden = false;
      ($('rNext').hidden ? $('rAgain') : $('rNext')).focus({ preventScroll: true });
      paintProgress();
    }, 1300);
  }
  $('rNext').addEventListener('click', () => load(L + 1));
  $('rAgain').addEventListener('click', () => load(L, { quiet: true }));
  $('rShare').addEventListener('click', () => {
    const what = kind === 'daily' ? `Daily ${today()} (${V[variant].name})` : target ? `Picture: ${picName}` : `${V[variant].name} ${n}×${n}, level ${L}`;
    const st = $('rStars').querySelectorAll('[fill="#ffc93c"]').length;
    const grid = [];
    for (let y = 0; y < n; y++) grid.push([...b.slice(y * n, y * n + n)].map((v) => (v ? '🟨' : '⬛')).join(''));
    const txt = `Zoble Lights Out · ${what}\n${'⭐'.repeat(st)}${'☆'.repeat(3 - st)} ${moves} moves (best possible ${par})${target ? '\n' + grid.join('\n') : ''}`;
    (navigator.clipboard?.writeText(txt) || Promise.reject()).then(() => Curio.toast('Result copied'), () => Curio.toast('Copy failed, sorry'));
  });
  function paintProgress() {
    const st = S.stats;
    $('stats').innerHTML = `<div class="c-stat"><b>${st.solved}</b><span>Solved</span></div><div class="c-stat"><b>${st.perfect}</b><span>Perfect</span></div><div class="c-stat"><b>${totalStars()}</b><span>Stars</span></div><div class="c-stat"><b>${st.presses}</b><span>Presses</span></div><div class="c-stat"><b>${st.hints}</b><span>Hints</span></div>`;
    $('badges').innerHTML = ACH.map((a) => `<span class="badge${S.ach[a.id] ? ' on' : ''}" title="${a.d}">${S.ach[a.id] ? '★' : '☆'} ${a.name}</span>`).join('');
    $('badgeCount').textContent = `(${ACH.filter((a) => S.ach[a.id]).length}/${ACH.length} badges)`;
  }
  function setSel(i) {
    cells[sel].tabIndex = -1;
    sel = i; cells[sel].tabIndex = 0; cells[sel].focus({ preventScroll: true });
  }
  function tick() {
    const now = performance.now();
    if (status === 'playing' && started && !document.hidden) elapsed += (now - t0) / 1000;
    t0 = now;
    $('time').textContent = fmtT(elapsed);
  }
  setInterval(tick, 250);
  document.addEventListener('visibilitychange', () => { t0 = performance.now(); });

  boardEl.addEventListener('click', (e) => {
    const c = e.target.closest('.cell'); if (!c || e.detail === 0) return;
    const i = +c.dataset.i;
    cells[sel].tabIndex = -1; sel = i; c.tabIndex = 0;
    tap(i);
  });
  $('undo').addEventListener('click', undo);
  $('restart').addEventListener('click', () => load(L, { quiet: true }));
  $('hint').addEventListener('click', hint);
  $('show').addEventListener('click', () => { if (status !== 'playing') return; showSol = !showSol; if (showSol) msg(P() === 3 ? 'Press each ringed light; some need two presses. Order does not matter.' : 'Press every ringed light once, in any order.'); render(); });
  $('daily').addEventListener('click', () => { kind = 'daily'; load(1); });
  $('howBtn').addEventListener('click', () => { const h = $('how'); h.hidden = !h.hidden; $('howBtn').setAttribute('aria-expanded', String(!h.hidden)); if (!h.hidden) h.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); });
  addEventListener('keydown', (e) => {
    if (document.querySelector('.curio-modal') || e.metaKey || e.altKey) return;
    if (e.ctrlKey) { if (e.key === 'z') { e.preventDefault(); undo(); } return; }
    if (!$('result').hidden) { if (e.key === 'n' || e.key === 'N') { if (!$('rNext').hidden) $('rNext').click(); } return; }
    const mv = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key];
    if (mv) {
      e.preventDefault();
      const x = (sel % n + mv[0] + n) % n, y = (Math.floor(sel / n) + mv[1] + n) % n;
      setSel(y * n + x); return;
    }
    if ((e.key === ' ' || e.key === 'Enter') && e.target.classList?.contains('cell')) { e.preventDefault(); tap(sel); return; }
    if (e.key === 'z' || e.key === 'Z') undo();
    else if (e.key === 'r' || e.key === 'R') load(L, { quiet: true });
    else if (e.key === 'h' || e.key === 'H') hint();
    else if ((e.key === 'n' || e.key === 'N') && kind === 'level' && L < unlocked()) load(L + 1);
  });

  n = V[variant].sizes.includes(S.n) ? S.n : 5;
  paintSizes();
  load(variant === 'pics' ? 1 : Math.min(unlocked(), Math.max(1, Curio.store.get(`lo:level:${n}`, 1) | 0)));
  paintProgress();
  window.__lo = { engine: LO, get b() { return b; }, get par() { return par; }, get status() { return status; }, get target() { return target; }, tap, load, get n() { return n; }, setVariant: (v, k) => { variant = v; if (k) n = k; kind = 'level'; }, setKind: (k) => { kind = k; }, solveNow: () => LO.solve(variant, n, b, target) };
})();
