'use strict';
(() => {
  const DATA = window.T48, THEMES = DATA.themes;
  const $ = (id) => document.getElementById(id);
  const boardEl = $('board'), tilesEl = $('tiles'), gridEl = document.querySelector('.grid'), fxEl = $('fx'), ovEl = $('ov'), cardEl = $('card');
  const VER = 2;
  const load = (k, fb) => { const v = Curio.store.get(`2048:${k}`, null); return v && v.v === VER && v.d != null && typeof v.d === typeof fb ? v.d : fb; };
  const save = (k, d) => Curio.store.set(`2048:${k}`, { v: VER, d });
  const ACH = [
    { id: 't128', icon: '🔸', name: 'Getting warmer', desc: 'Make a 128 tile.' },
    { id: 't512', icon: '🔶', name: 'Half a kilobyte', desc: 'Make a 512 tile.' },
    { id: 't1024', icon: '💾', name: 'Kibibyte', desc: 'Make a 1024 tile.' },
    { id: 't2048', icon: '🏆', name: 'The famous tile', desc: 'Make the 2048 tile.' },
    { id: 't4096', icon: '👑', name: '4K', desc: 'Make a 4096 tile.' },
    { id: 't8192', icon: '🌌', name: 'Beyond', desc: 'Make an 8192 tile.' },
    { id: 'tiny', icon: '🐜', name: 'Tiny titan', desc: 'Make a 256 on the 3×3 board.' },
    { id: 'big6', icon: '🐘', name: 'Room to breathe', desc: 'Make a 4096 on the 6×6 board.' },
    { id: 'goal', icon: '🎯', name: 'On target', desc: 'Win a Goal game.' },
    { id: 'goalbig', icon: '🚀', name: 'Overachiever', desc: 'Win a Goal game aiming for 4096 or more.' },
    { id: 'blitz', icon: '⏱️', name: 'Speed merger', desc: 'Score 3,000 in Blitz.' },
    { id: 'rocks', icon: '🪨', name: 'Rock solid', desc: 'Make a 512 in Rocks mode.' },
    { id: 'daily', icon: '📅', name: 'Daily doubler', desc: 'Finish a Daily board.' },
    { id: 'purist', icon: '🧘', name: 'Purist', desc: 'Make 2048 with undo switched off.' },
    { id: 'combo', icon: '⚡', name: 'Chain reaction', desc: 'Make 4 merges in a single move.' },
    { id: 'hint', icon: '💡', name: 'Teacher\'s pet', desc: 'Ask for a hint.' },
    { id: 'marathon', icon: '🏃', name: 'Marathon', desc: 'Make 1,000 moves in one game.' },
    { id: 'themes', icon: '🎨', name: 'Interior designer', desc: 'Try five different themes.' },
    { id: 'score20k', icon: '💰', name: 'Twenty grand', desc: 'Score 20,000 in one game.' },
    { id: 'score100k', icon: '💎', name: 'Six figures', desc: 'Score 100,000 in one game.' }
  ];
  let got = load('ach', {});
  let stats = load('stats', {});
  let hist = load('hist', []);
  if (!Array.isArray(hist)) hist = [];
  const set = Object.assign({ mode: 'classic', size: '4', undo: '1', goal: '2048', theme: 'wood' }, load('set', {}));
  if (!THEMES[set.theme]) set.theme = 'wood';
  const keepSet = { mode: set.mode, size: set.size, undo: set.undo };
  if (Curio.simple) Object.assign(set, { mode: 'classic', size: '4', undo: '1' });
  const saveSet = () => save('set', Curio.simple ? { ...set, ...keepSet } : set);
  let N, cfg, grid, score, moves, won, over, stack, undosLeft, nextId = 1, R, timeLeft, timer, started, topTile, hintsUsed, mergesGame;
  const els = new Map();

  function mkRng(state) {
    const o = { a: state >>> 0 };
    o.next = () => {
      o.a = (o.a + 0x6D2B79F5) | 0;
      let t = Math.imul(o.a ^ (o.a >>> 15), 1 | o.a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    return o;
  }
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const seedOf = (s) => { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rand = () => (R ? R.next() : Math.random());

  let badgeQ = [], badgeOn = false;
  function nextBadge() {
    if (badgeOn || !badgeQ.length) return;
    const a = badgeQ.shift();
    badgeOn = true;
    Curio.toast(`${a.icon} Badge unlocked: ${a.name}`, 2200);
    [784, 988, 1319].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.1, 'triangle', 0.07), i * 70));
    setTimeout(() => { badgeOn = false; nextBadge(); }, 2400);
  }
  function unlock(id) {
    if (got[id]) return;
    const a = ACH.find((x) => x.id === id);
    if (!a) return;
    got[id] = Date.now();
    save('ach', got);
    badgeQ.push(a);
    nextBadge();
    renderTab();
  }
  const stat = (k, n = 1) => { stats[k] = (stats[k] || 0) + n; return stats[k]; };
  const statMax = (k, v) => { if (v > (stats[k] || 0)) stats[k] = v; };

  const newTile = (v, r, c, kind) => ({ id: nextId++, v, r, c, kind });
  const emptyGrid = () => Array.from({ length: N }, () => Array(N).fill(null));
  const values = () => grid.map((row) => row.map((t) => (t ? t.v : 0)));

  function theme() { return THEMES[set.theme] || THEMES.classic; }
  function lum(hex) { const n = parseInt(hex.slice(1), 16); const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(n >> 16) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255); }
  function tileStyle(v) {
    const T = theme();
    if (v < 0) return null;
    const i = Math.min(T.tiles.length - 1, Math.max(0, Math.log2(v) - 1));
    const bg = T.tiles[i];
    const ink = (T.darkUntil != null ? i < T.darkUntil : lum(bg) > 0.5) ? T.ink[0] : T.ink[1];
    const glow = T.glow && v >= 8 ? `0 0 ${Math.min(30, 6 + i * 2)}px ${bg}` : v >= 128 ? `0 0 ${Math.min(34, (i - 5) * 5)}px color-mix(in srgb, ${bg} 70%, transparent)` : '';
    return { bg, ink, glow };
  }
  function applyTheme() {
    const T = theme();
    const dark = Curio.isDark();
    boardEl.style.setProperty('--board', dark ? T.dboard : T.board);
    boardEl.style.setProperty('--cell', dark ? T.dcell : T.cell);
    boardEl.classList.toggle('wood', !!T.wood);
    for (const row of grid || []) for (const t of row) if (t) styleEl(els.get(t.id), t.v);
    document.querySelectorAll('.t-theme').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.val === set.theme)));
  }
  addEventListener('curio:theme', applyTheme);
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);
  function styleEl(el, v) {
    if (!el) return;
    const s = tileStyle(v);
    if (!s) return;
    el.style.setProperty('--t-bg', s.bg);
    el.style.setProperty('--t-ink', s.ink);
    el.style.setProperty('--t-glow', s.glow || '0 0 0 transparent');
    const d = String(v).length;
    el.style.setProperty('--fs', String(N >= 6 ? [0.5, 0.5, 0.42, 0.33, 0.27, 0.22][d - 1] || 0.2 : [0.48, 0.48, 0.4, 0.31, 0.25, 0.21][d - 1] || 0.19));
  }
  function sizeBoard() {
    const gap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gap')) || 12;
    const g = N >= 6 ? Math.max(5, gap - 4) : N === 5 ? Math.max(6, gap - 2) : gap;
    boardEl.style.setProperty('--gap', g + 'px');
    const inner = boardEl.clientWidth - 2 * g;
    const ts = (inner - (N - 1) * g) / N;
    boardEl.style.setProperty('--ts', ts + 'px');
    gridEl.style.gridTemplateColumns = `repeat(${N}, 1fr)`;
    gridEl.style.gridTemplateRows = `repeat(${N}, 1fr)`;
    const dpr = Math.min(2, devicePixelRatio || 1);
    fxEl.width = Math.round(inner * dpr);
    fxEl.height = Math.round(inner * dpr);
    fx.scale = dpr;
    fx.ts = ts; fx.gap = g;
  }
  addEventListener('resize', () => { if (N) sizeBoard(); });

  function spawn() {
    const empty = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!grid[r][c]) empty.push([r, c]);
    if (!empty.length) return null;
    const [r, c] = empty[Math.floor(rand() * empty.length)];
    const t = newTile(rand() < 0.9 ? 2 : 4, r, c, 'new');
    grid[r][c] = t;
    return t;
  }
  function snapshot() { return { vals: values(), score, moves, won, topTile, r: R ? R.a : null }; }
  function loadVals(vals) {
    grid = emptyGrid();
    vals.forEach((row, r) => row.forEach((v, c) => { if (v) grid[r][c] = newTile(v, r, c, v < 0 ? null : 'new'); }));
    tilesEl.innerHTML = '';
    els.clear();
  }
  function fresh(confirmed) {
    cfg = { mode: set.mode, size: set.mode === 'daily' ? 4 : +set.size, goal: set.mode === 'goal' ? +set.goal : 2048, undo: set.mode === 'daily' ? 0 : +set.undo, date: set.mode === 'daily' ? today() : '' };
    N = cfg.size;
    R = cfg.mode === 'daily' ? mkRng(seedOf('2048-' + cfg.date)) : null;
    grid = emptyGrid();
    tilesEl.innerHTML = '';
    els.clear();
    gridEl.innerHTML = '<div></div>'.repeat(N * N);
    score = 0; moves = 0; won = false; over = false; stack = []; undosLeft = cfg.undo; topTile = 2; hintsUsed = 0; mergesGame = 0;
    timeLeft = 120; started = false;
    clearInterval(timer); timer = null;
    if (cfg.mode === 'rocks') {
      const n = N >= 5 ? 2 : 1;
      const spots = [];
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if ((r > 0 && r < N - 1) || (c > 0 && c < N - 1)) spots.push([r, c]);
      for (const [r, c] of Curio.shuffle(spots).slice(0, n)) grid[r][c] = newTile(-1, r, c, null);
    }
    spawn(); spawn();
    sizeBoard();
    hideOv();
    render([]);
    saveGame();
    applyTheme();
    paintSetup();
    if (confirmed !== 'quiet') Curio.beep(520, 0.06, 'triangle', 0.06);
  }

  function move(dir) {
    const [dr, dc] = [[-1, 0], [0, 1], [1, 0], [0, -1]][dir];
    const rows = [...Array(N).keys()], cols = [...Array(N).keys()];
    if (dr === 1) rows.reverse();
    if (dc === 1) cols.reverse();
    const snap = snapshot();
    const merged = new Set(), gone = [], made = [];
    let moved = false, gained = 0;
    for (const r of rows) for (const c of cols) {
      const t = grid[r][c];
      if (!t || t.v < 0) continue;
      t.kind = null;
      let nr = r, nc = c, did = false;
      for (;;) {
        const tr = nr + dr, tc = nc + dc;
        if (tr < 0 || tr >= N || tc < 0 || tc >= N) break;
        const o = grid[tr][tc];
        if (!o) { nr = tr; nc = tc; continue; }
        if (o.v === t.v && !merged.has(o)) {
          grid[r][c] = null;
          t.r = tr; t.c = tc; o.kind = null;
          gone.push(t, o);
          const m = newTile(t.v * 2, tr, tc, 'merged');
          grid[tr][tc] = m; merged.add(m); made.push(m);
          gained += m.v;
          did = true; moved = true;
        }
        break;
      }
      if (!did && (nr !== r || nc !== c)) { grid[r][c] = null; grid[nr][nc] = t; t.r = nr; t.c = nc; moved = true; }
    }
    if (!moved) return null;
    stack.push(snap);
    if (stack.length > 50) stack.shift();
    score += gained;
    moves++;
    return { gone, gained, made };
  }
  function slideVals(vals, dir) {
    const out = vals.map((r) => r.slice());
    let gain = 0, moved = false;
    for (let i = 0; i < N; i++) {
      const line = [];
      for (let j = 0; j < N; j++) {
        const [r, c] = dir === 0 ? [j, i] : dir === 2 ? [N - 1 - j, i] : dir === 3 ? [i, j] : [i, N - 1 - j];
        line.push([r, c]);
      }
      let seg = [];
      const flush = (endIdx) => {
        const vs = seg.map(([r, c]) => vals[r][c]).filter((v) => v > 0);
        const res = [];
        for (let k = 0; k < vs.length; k++) {
          if (k + 1 < vs.length && vs[k] === vs[k + 1]) { res.push(vs[k] * 2); gain += vs[k] * 2; k++; }
          else res.push(vs[k]);
        }
        seg.forEach(([r, c], k) => { const nv = res[k] || 0; if (out[r][c] !== nv) moved = true; out[r][c] = nv; });
        seg = [];
      };
      line.forEach(([r, c], k) => { if (vals[r][c] < 0) flush(k); else seg.push([r, c]); });
      flush(N);
    }
    return { vals: out, gain, moved };
  }
  function canMoveVals(vals) {
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const v = vals[r][c];
      if (v === 0) return true;
      if (v < 0) continue;
      if (c < N - 1 && vals[r][c + 1] === v) return true;
      if (r < N - 1 && vals[r + 1][c] === v) return true;
    }
    return false;
  }
  const canMove = () => canMoveVals(values());

  function evalVals(vals) {
    let empty = 0, best = -Infinity, smooth = 0, max = 0;
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const v = vals[r][c];
      if (v === 0) empty++;
      if (v > max) max = v;
      if (v > 0) {
        if (c < N - 1 && vals[r][c + 1] > 0) smooth -= Math.abs(Math.log2(v) - Math.log2(vals[r][c + 1]));
        if (r < N - 1 && vals[r + 1][c] > 0) smooth -= Math.abs(Math.log2(v) - Math.log2(vals[r + 1][c]));
      }
    }
    for (let o = 0; o < 8; o++) {
      let s = 0, k = 0;
      for (let i = 0; i < N; i++) for (let j0 = 0; j0 < N; j0++) {
        const j = i % 2 ? N - 1 - j0 : j0;
        let r = i, c = j;
        if (o & 1) r = N - 1 - r;
        if (o & 2) c = N - 1 - c;
        if (o & 4) [r, c] = [c, r];
        const v = vals[r][c];
        if (v > 0) s += Math.log2(v) * Math.pow(0.6, k);
        k++;
      }
      best = Math.max(best, s);
    }
    return best * 40 + empty * 12 + smooth * 1.5 + Math.log2(max || 1) * 2;
  }
  function expect(vals, depth) {
    const empties = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (vals[r][c] === 0) empties.push([r, c]);
    if (!empties.length) return evalVals(vals);
    const sample = empties.length > 6 ? Curio.shuffle(empties).slice(0, 6) : empties;
    let tot = 0;
    for (const [r, c] of sample) for (const [v, p] of [[2, 0.9], [4, 0.1]]) {
      const nv = vals.map((x) => x.slice());
      nv[r][c] = v;
      let best = -Infinity;
      if (depth > 0) for (let d = 0; d < 4; d++) { const s = slideVals(nv, d); if (s.moved) best = Math.max(best, s.gain * 0.5 + expect(s.vals, depth - 1)); }
      else best = evalVals(nv);
      tot += p * (best === -Infinity ? -1000 : best);
    }
    return tot / sample.length;
  }
  function bestMove() {
    const vals = values();
    let bd = -1, bs = -Infinity;
    const depth = N <= 4 ? 1 : 0;
    for (let d = 0; d < 4; d++) {
      const s = slideVals(vals, d);
      if (!s.moved) continue;
      const v = s.gain * 0.5 + expect(s.vals, depth);
      if (v > bs) { bs = v; bd = d; }
    }
    return bd;
  }

  function tileEl(t) {
    let el = els.get(t.id);
    if (!el) {
      el = document.createElement('div');
      el.innerHTML = '<b></b>';
      el.firstChild.textContent = t.v < 0 ? '' : t.v;
      tilesEl.append(el);
      els.set(t.id, el);
      styleEl(el, t.v);
    }
    el.className = `tile${t.v < 0 ? ' rock' : ''}${t.kind ? ' ' + t.kind : ''}${t.v >= 256 ? ' shine' : ''}`;
    el.style.setProperty('--r', t.r);
    el.style.setProperty('--c', t.c);
    return el;
  }
  function render(gone) {
    const live = new Set();
    for (const row of grid) for (const t of row) if (t) { tileEl(t); live.add(t.id); }
    for (const t of gone) { const el = tileEl(t); el.classList.add('gone'); live.add(t.id); setTimeout(() => { el.remove(); els.delete(t.id); }, 130); }
    for (const [id, el] of els) if (!live.has(id)) { el.remove(); els.delete(id); }
    hud();
  }
  const bestKey = () => `score-${cfg.mode}-${N}${cfg.mode === 'goal' ? '-' + cfg.goal : ''}`;
  function hud() {
    $('score').textContent = Curio.fmt(score);
    const b = Math.max(Curio.getBest(bestKey()) || 0, score);
    $('best').textContent = Curio.fmt(b);
    if (cfg.mode === 'blitz') {
      $('thirdLabel').textContent = 'Time';
      const s = Math.max(0, Math.ceil(timeLeft));
      $('moves').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
      $('third').classList.toggle('is-hot', started && timeLeft <= 15 && !over);
    } else {
      $('thirdLabel').textContent = 'Moves';
      $('moves').textContent = Curio.fmt(moves);
      $('third').classList.remove('is-hot');
    }
    $('goal').textContent = cfg.mode === 'blitz' ? topTile : cfg.goal;
    $('goal').nextElementSibling.textContent = cfg.mode === 'blitz' ? 'Top tile' : 'Target';
    const u = $('undo');
    u.disabled = !stack.length || undosLeft <= 0 || over && cfg.mode === 'blitz';
    u.textContent = cfg.undo >= 99 ? '↶ Undo' : `↶ Undo (${undosLeft})`;
    u.hidden = cfg.undo === 0;
    $('hint').disabled = over;
  }
  function saveGame() {
    save('cur', { cfg, vals: values(), score, moves, won, over, stack: stack.slice(-Math.min(10, Math.max(1, cfg.undo))), undosLeft, timeLeft, started, topTile, r: R ? R.a : null, hintsUsed, mergesGame });
  }
  function scorePop(n) {
    const s = document.createElement('span');
    s.className = 'score-pop';
    s.textContent = '+' + n;
    $('score').parentElement.append(s);
    setTimeout(() => s.remove(), 700);
  }
  function tilePop(t, text, big) {
    const s = document.createElement('div');
    s.className = 't-pop';
    s.textContent = text;
    const g = fx.gap, ts = fx.ts;
    s.style.left = `${g + t.c * (ts + g) + ts / 2}px`;
    s.style.top = `${g + t.r * (ts + g) + ts / 2}px`;
    s.style.fontSize = `${big ? 22 : 15}px`;
    boardEl.append(s);
    setTimeout(() => s.remove(), 800);
  }
  function banner(text) {
    const s = document.createElement('div');
    s.className = 't-banner';
    s.textContent = text;
    boardEl.append(s);
    setTimeout(() => s.remove(), 1000);
  }

  const fx = { list: [], raf: 0, scale: 1, ts: 100, gap: 12 };
  const fctx = fxEl.getContext('2d');
  function burst(t, n, color) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const x = t.c * (fx.ts + fx.gap) + fx.ts / 2, y = t.r * (fx.ts + fx.gap) + fx.ts / 2;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 80 + Math.random() * 220;
      fx.list.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, life: 0.6 + Math.random() * 0.4, max: 1, size: 3 + Math.random() * 4, c: Math.random() < 0.3 ? '#ffffff' : color, r: Math.random() * 6 });
    }
    if (!fx.raf) { fx.last = 0; fx.raf = requestAnimationFrame(fxTick); }
  }
  function fxTick(ts) {
    const dt = fx.last ? Math.min(0.05, (ts - fx.last) / 1000) : 0.016;
    fx.last = ts;
    fctx.setTransform(fx.scale, 0, 0, fx.scale, 0, 0);
    fctx.clearRect(0, 0, fxEl.width, fxEl.height);
    for (let i = fx.list.length - 1; i >= 0; i--) {
      const p = fx.list[i];
      p.life -= dt;
      if (p.life <= 0) { fx.list.splice(i, 1); continue; }
      p.vy += 500 * dt; p.vx *= 0.98; p.x += p.vx * dt; p.y += p.vy * dt; p.r += dt * 8;
      fctx.globalAlpha = Math.min(1, p.life * 2);
      fctx.fillStyle = p.c;
      fctx.save(); fctx.translate(p.x, p.y); fctx.rotate(p.r); fctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6); fctx.restore();
    }
    fctx.globalAlpha = 1;
    if (fx.list.length && !document.hidden) fx.raf = requestAnimationFrame(fxTick);
    else { fx.raf = 0; fctx.clearRect(0, 0, fxEl.width, fxEl.height); fx.list.length = 0; }
  }

  let busy = false;
  async function act(dir) {
    if (over || busy || !ovEl.hidden || document.querySelector('.curio-modal')) return;
    clearHint();
    const res = move(dir);
    if (!res) {
      boardEl.classList.remove('shake'); void boardEl.offsetWidth; boardEl.classList.add('shake');
      Curio.beep(140, 0.05, 'triangle', 0.05);
      return;
    }
    if (cfg.mode === 'blitz' && !started) { started = true; startTimer(); }
    spawn();
    render(res.gone);
    stat('moves');
    if (moves >= 1000) unlock('marathon');
    if (res.made.length) {
      mergesGame += res.made.length;
      stat('merges', res.made.length);
      scorePop(res.gained);
      const top = res.made.reduce((a, b) => (b.v > a.v ? b : a));
      const st = tileStyle(top.v);
      Curio.beep(200 + 40 * Math.log2(top.v), 0.09, 'triangle', 0.07);
      window.Cafe?.sound('tile', 0.9);
      if (res.made.length >= 2) setTimeout(() => Curio.beep(300 + 40 * Math.log2(top.v), 0.08, 'triangle', 0.08), 60);
      for (const m of res.made) if (m.v >= 32) tilePop(m, '+' + m.v, m.v >= 512);
      for (const m of res.made) if (m.v >= 64) burst(m, Math.min(40, 6 + Math.log2(m.v) * 2), tileStyle(m.v).bg);
      if (res.made.length >= 4) { banner(res.made.length >= 5 ? 'MEGA MERGE!' : 'QUAD MERGE!'); unlock('combo'); try { navigator.vibrate?.([10, 30, 10]); } catch {} }
      else if (res.made.length === 3) banner('Triple merge!');
      if (top.v > topTile) {
        const prevTop = topTile;
        topTile = top.v;
        if (top.v >= 128 && prevTop < top.v) {
          burst(top, 40, st.bg);
          const note = DATA.notes[top.v];
          if (note && !(stats['seen' + top.v])) { stats['seen' + top.v] = 1; showNote(note); }
        }
        statMax('bestTile', topTile);
        statMax('bt' + N, topTile);
        for (const [v, id] of [[128, 't128'], [512, 't512'], [1024, 't1024'], [2048, 't2048'], [4096, 't4096'], [8192, 't8192']]) if (topTile >= v) unlock(id);
        if (N === 3 && topTile >= 256) unlock('tiny');
        if (N === 6 && topTile >= 4096) unlock('big6');
        if (cfg.mode === 'rocks' && topTile >= 512) unlock('rocks');
        if (cfg.undo === 0 && topTile >= 2048) unlock('purist');
      }
    } else { Curio.beep(520, 0.02, 'sine', 0.02); window.Cafe?.sound('wood', 0.35); }
    if (score >= 20000) unlock('score20k');
    if (score >= 100000) unlock('score100k');
    $('live').textContent = `Score ${score}`;
    if (score > (Curio.getBest(bestKey()) || 0)) Curio.best(bestKey(), score);
    hud();
    if (!won && cfg.mode !== 'blitz' && topTile >= cfg.goal) {
      won = true;
      saveGame();
      busy = true;
      setTimeout(() => { busy = false; showWin(); }, 320);
      return;
    }
    if (!canMove()) { over = true; saveGame(); busy = true; setTimeout(() => { busy = false; showOver(false); }, 450); return; }
    saveGame();
  }
  let noteT = 0;
  function showNote(text) {
    const n = document.createElement('div');
    n.className = 't-toast';
    n.textContent = text;
    boardEl.append(n);
    document.querySelectorAll('.t-toast').forEach((x) => { if (x !== n) x.remove(); });
    clearTimeout(noteT);
    noteT = setTimeout(() => n.remove(), 3600);
  }
  function startTimer() {
    clearInterval(timer);
    let last = performance.now();
    timer = setInterval(() => {
      const now = performance.now();
      if (!document.hidden && ovEl.hidden && !document.querySelector('.curio-modal')) timeLeft -= (now - last) / 1000;
      last = now;
      if (timeLeft <= 10 && timeLeft > 0 && Math.ceil(timeLeft) !== Math.ceil(timeLeft + 0.25)) Curio.beep(880, 0.04, 'square', 0.04);
      if (timeLeft <= 0) { timeLeft = 0; clearInterval(timer); timer = null; over = true; hud(); saveGame(); showOver(true); return; }
      hud();
    }, 250);
  }

  const MEDAL = (c1, c2, glyph) => `<svg viewBox="0 0 120 120"><defs><radialGradient id="tm" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".25" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></radialGradient></defs><path d="M40 6h16l10 30H50zM80 6H64L54 36h16z" fill="#e84a5f"/><circle cx="60" cy="72" r="40" fill="${c2}"/><circle cx="60" cy="70" r="38" fill="url(#tm)"/><circle cx="60" cy="70" r="29" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="3" stroke-dasharray="4 5"/><text x="60" y="${glyph.length > 3 ? 79 : 82}" text-anchor="middle" font-size="${glyph.length > 3 ? 22 : glyph.length > 2 ? 26 : 32}" font-weight="900" fill="#fff" font-family="system-ui,sans-serif">${glyph}</text></svg>`;
  function card(html, buttons) {
    cardEl.innerHTML = html;
    const row = document.createElement('div');
    row.className = 'c-row';
    for (const [label, fn, ghost] of buttons) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = ghost ? 'c-btn c-btn--ghost' : 'c-btn';
      b.textContent = label;
      b.addEventListener('click', fn);
      row.append(b);
    }
    cardEl.append(row);
    ovEl.hidden = false;
    row.querySelector('button')?.focus({ preventScroll: true });
  }
  function hideOv() { ovEl.hidden = true; }
  const modeName = () => ({ classic: 'Classic', goal: `Goal ${cfg.goal}`, blitz: 'Blitz', rocks: 'Rocks', daily: `Daily ${cfg.date}` }[cfg.mode]);
  const shareText = () => `Zoble 2048 · ${modeName()} · ${N}×${N} · ${Curio.fmt(score)} pts · top tile ${topTile} · ${moves} moves`;
  function rowsHtml() { return `<div class="t-rows"><div><b>${topTile}</b><span>Top tile</span></div><div><b>${Curio.fmt(moves)}</b><span>Moves</span></div><div><b>${Curio.fmt(mergesGame)}</b><span>Merges</span></div></div>`; }
  function recordGame(win) {
    stat('games');
    if (win) stat('wins');
    hist.unshift({ d: today().slice(5), m: modeName(), n: N, s: score, t: topTile });
    hist = hist.slice(0, 15);
    save('hist', hist);
    save('stats', stats);
    if (cfg.mode === 'daily') unlock('daily');
    if (cfg.mode === 'blitz' && score >= 3000) unlock('blitz');
    renderTab();
  }
  function showWin() {
    stat('wins');
    save('stats', stats);
    if (cfg.mode === 'goal') { unlock('goal'); if (cfg.goal >= 4096) unlock('goalbig'); }
    Curio.confetti();
    [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.14, 'triangle', 0.1), i * 90));
    const b = Curio.best(bestKey(), score);
    card(`<div class="t-art">${MEDAL('#ffd34d', '#e0a100', String(cfg.goal))}</div><h2>You made ${cfg.goal}!</h2><div class="t-big">${Curio.fmt(score)}</div>${b.isNew ? '<span class="t-new">★ New best</span>' : ''}${rowsHtml()}<p>${cfg.goal >= 2048 ? 'Absolute legend.' : 'Target smashed.'} Keep going for a bigger tile, or set a tougher goal.</p>`, [
      ['Keep going', () => { hideOv(); boardEl.focus({ preventScroll: true }); }],
      ['New game', () => { recordGame(false); fresh(); }, true],
      ['Copy result', () => copy(shareText()), true]
    ]);
  }
  function showOver(timeUp) {
    clearInterval(timer); timer = null;
    const b = Curio.best(bestKey(), score);
    recordGame(false);
    if (b.isNew && score > 0) Curio.confetti();
    Curio.beep(timeUp ? 660 : 160, 0.35, timeUp ? 'triangle' : 'sawtooth', 0.08);
    const msg = timeUp ? 'Time is up! Every second counted.' : topTile >= 2048 ? 'A board full of glory.' : topTile >= 512 ? 'So close to greatness. The board just ran out of room.' : 'The tiles won this round. Corners are your friend.';
    const btns = [['Play again', () => fresh()]];
    if (!timeUp && stack.length && undosLeft > 0) btns.push(['Undo last move', () => { hideOv(); undo(); }, true]);
    btns.push(['Copy result', () => copy(shareText()), true]);
    card(`<div class="t-art">${MEDAL(b.isNew && score > 0 ? '#ffd34d' : '#dfe6ee', b.isNew && score > 0 ? '#e0a100' : '#9aa7b6', String(topTile))}</div><h2>${timeUp ? 'Time!' : 'No moves left'}</h2><div class="t-big">${Curio.fmt(score)}</div>${b.isNew && score > 0 ? '<span class="t-new">★ New personal best</span>' : `<p>Best: ${Curio.fmt(b.best)}</p>`}${rowsHtml()}<p>${msg}</p>`, btns);
  }
  function showWelcome() {
    card(`<div class="t-art">${MEDAL('#f2b179', '#e8803a', '2048')}</div><h2>Welcome to 2048</h2><p>Swipe or use the arrow keys to slide every tile at once. Matching numbers merge and double. Pick a mode, size and theme above, then make the biggest tile you can.</p><p>On a laptop touchpad? Arrow keys are easiest, or turn on Touchpad mode in the top bar: click the board, move, click again to swipe.</p>`, [['Let\'s play', () => { hideOv(); Curio.store.set('2048:welcomed', true); boardEl.focus({ preventScroll: true }); }]]);
  }
  function copy(text) {
    const done = () => Curio.toast('Result copied');
    try { navigator.clipboard.writeText(text).then(done, () => Curio.toast('Could not copy')); } catch { Curio.toast('Could not copy'); }
  }
  function undo() {
    if (!stack.length || undosLeft <= 0) return;
    const p = stack.pop();
    if (cfg.undo < 99) undosLeft--;
    loadVals(p.vals);
    for (const row of grid) for (const t of row) if (t) t.kind = null;
    score = p.score; moves = p.moves; won = p.won; topTile = p.topTile; over = false;
    if (R && p.r != null) R.a = p.r;
    if (cfg.mode === 'blitz' && started && !timer && timeLeft > 0) startTimer();
    render([]);
    applyTheme();
    saveGame();
    stat('undos');
    Curio.beep(330, 0.06, 'sine', 0.08);
  }
  let hintTile = null;
  function clearHint() { if (hintTile) { hintTile.remove(); hintTile = null; } }
  function hint() {
    if (over) return;
    const d = bestMove();
    if (d < 0) return;
    hintsUsed++;
    stat('hints');
    unlock('hint');
    clearHint();
    const arrow = document.createElement('div');
    arrow.className = 't-banner';
    arrow.style.animation = 't-banner 1.4s ease forwards';
    arrow.textContent = ['↑ up', '→ right', '↓ down', '← left'][d];
    boardEl.append(arrow);
    hintTile = arrow;
    setTimeout(() => { if (hintTile === arrow) clearHint(); }, 1400);
    Curio.beep(990, 0.06, 'sine', 0.06);
  }

  function paintSetup() {
    document.querySelectorAll('[data-set]').forEach((b) => {
      const k = b.dataset.set;
      const cur = k === 'size' && set.mode === 'daily' ? '4' : k === 'undo' && set.mode === 'daily' ? '0' : set[k];
      b.setAttribute('aria-pressed', String(String(cur) === b.dataset.val));
      b.disabled = set.mode === 'daily' && (k === 'size' || k === 'undo');
    });
    $('goals').hidden = set.mode !== 'goal';
    $('setupSum').textContent = `${{ classic: 'Classic', goal: 'Goal ' + set.goal, blitz: 'Blitz', rocks: 'Rocks', daily: 'Daily' }[set.mode]} · ${set.mode === 'daily' ? 4 : set.size}×${set.mode === 'daily' ? 4 : set.size} · ${THEMES[set.theme].name}`;
    $('desc').textContent = {
      classic: 'The original: reach 2048, then see how far you can push it.',
      goal: 'Pick a target tile and race to it in as few moves as you can.',
      blitz: 'Two minutes. Score as much as possible. Clock starts on your first move.',
      rocks: 'Immovable boulders block the board. Work around them.',
      daily: `Today's board (${today()}). Same tiles for everyone, no undo.`
    }[set.mode];
  }
  async function changeSetting(k, v) {
    if (set[k] === v) return;
    const inProgress = score > 0 && !over && !(k === 'goal' && cfg.mode !== 'goal');
    if (inProgress) {
      const r = await Curio.modal({ emoji: '🤔', title: 'Start a new game?', body: `Changing this starts a fresh board. You are on ${Curio.fmt(score)} points.`, buttons: [{ label: 'New game', value: 'y' }, { label: 'Keep playing', value: 'n' }] });
      if (r !== 'y') return;
      recordGame(false);
    }
    set[k] = v;
    saveSet();
    fresh();
  }
  document.querySelectorAll('[data-set]').forEach((b) => b.addEventListener('click', () => { if (!b.disabled) changeSetting(b.dataset.set, b.dataset.val); }));
  const goalsEl = $('goals');
  for (const gv of DATA.goals) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.set = 'goal';
    b.dataset.val = String(gv);
    b.textContent = gv;
    b.addEventListener('click', () => changeSetting('goal', String(gv)));
    goalsEl.append(b);
  }
  const themesEl = $('themes');
  for (const [id, T] of Object.entries(THEMES)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 't-theme';
    b.dataset.val = id;
    b.title = T.name;
    b.setAttribute('aria-label', `${T.name} theme`);
    for (const i of [1, 4, 7, 10]) { const s = document.createElement('i'); s.style.background = T.tiles[i]; b.append(s); }
    b.addEventListener('click', () => {
      set.theme = id;
      saveSet();
      applyTheme();
      Curio.beep(700, 0.04, 'triangle', 0.05);
      const tried = new Set(load('tried', []));
      tried.add(id);
      save('tried', [...tried]);
      if (tried.size >= 5) unlock('themes');
      paintSetup();
    });
    themesEl.append(b);
  }

  let tab = 'help';
  function renderTab(t = tab) {
    tab = t;
    document.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === t)));
    document.querySelectorAll('[data-body]').forEach((b) => { b.hidden = b.dataset.body !== t; });
    if (t === 'ach') {
      const box = document.querySelector('[data-body="ach"]');
      const n = ACH.filter((a) => got[a.id]).length;
      box.innerHTML = `<p>${n} of ${ACH.length} badges earned.</p><div class="t-achs"></div>`;
      const list = box.querySelector('.t-achs');
      for (const a of ACH) {
        const el = document.createElement('div');
        el.className = 't-ach' + (got[a.id] ? ' is-got' : '');
        el.innerHTML = '<i></i><div><b></b><span></span></div>';
        el.querySelector('i').textContent = got[a.id] ? a.icon : '?';
        el.querySelector('b').textContent = a.name;
        el.querySelector('span').textContent = a.desc;
        list.append(el);
      }
    }
    if (t === 'stats') {
      const box = document.querySelector('[data-body="stats"]');
      const rows = [['Games', stats.games || 0], ['Targets hit', stats.wins || 0], ['Moves', stats.moves || 0], ['Merges', stats.merges || 0], ['Best tile', stats.bestTile || 0], ['Best on 3×3', stats.bt3 || 0], ['Best on 4×4', stats.bt4 || 0], ['Best on 5×5', stats.bt5 || 0], ['Best on 6×6', stats.bt6 || 0], ['Undos used', stats.undos || 0], ['Hints used', stats.hints || 0]];
      box.innerHTML = '<div class="t-statgrid"></div>';
      const grid2 = box.querySelector('.t-statgrid');
      for (const [l, v] of rows) { const d = document.createElement('div'); d.innerHTML = '<b></b><span></span>'; d.querySelector('b').textContent = Curio.fmt(v); d.querySelector('span').textContent = l; grid2.append(d); }
      if (hist.length) {
        const h = document.createElement('div');
        h.className = 't-hist';
        h.innerHTML = '<h3>Recent games</h3>';
        for (const r of hist) { const d = document.createElement('div'); d.innerHTML = '<span></span><b></b>'; d.querySelector('span').textContent = `${r.d} · ${r.m} · ${r.n}×${r.n} · top ${r.t}`; d.querySelector('b').textContent = Curio.fmt(r.s); h.append(d); }
        box.append(h);
      }
    }
  }
  document.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => renderTab(b.dataset.tab)));

  const KEYS = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3, w: 0, d: 1, s: 2, a: 3, W: 0, D: 1, S: 2, A: 3 };
  addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest?.('input, textarea, select')) return;
    if (document.querySelector('.curio-modal')) return;
    const k = e.key;
    if ((k === 'z' || k === 'u' || k === 'U' || k === 'Z') && ovEl.hidden) { undo(); return; }
    if ((k === 'h' || k === 'H') && ovEl.hidden) { hint(); return; }
    if (k === 'n' || k === 'N') { $('new').click(); return; }
    if (k in KEYS) { if (e.target.closest?.('button') && !ovEl.hidden) return; e.preventDefault(); act(KEYS[k]); }
  });
  let sw = null, tracking = false;
  ovEl.addEventListener('pointerdown', (e) => e.stopPropagation());
  Curio.drag(boardEl, {
    start(p) { if (p.event?.target?.closest?.('.t-ov')) { sw = null; return; } sw = { x: p.clientX, y: p.clientY }; tracking = true; },
    move() {},
    end(p) {
      tracking = false;
      if (!sw || !p) { sw = null; return; }
      const dx = p.clientX - sw.x, dy = p.clientY - sw.y;
      sw = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
      act(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0));
    }
  });
  boardEl.addEventListener('touchmove', (e) => { if (tracking) e.preventDefault(); }, { passive: false });
  $('new').addEventListener('click', async () => {
    if (score > 0 && !over) {
      const v = await Curio.modal({ emoji: '🤔', title: 'Start over?', body: `You're on ${Curio.fmt(score)} points.`, buttons: [{ label: 'New game', value: 'y' }, { label: 'Cancel', value: 'n' }] });
      if (v !== 'y') return;
      recordGame(false);
    }
    fresh();
  });
  $('undo').addEventListener('click', undo);
  $('hint').addEventListener('click', hint);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { save('stats', stats); saveGame(); } });

  function restore() {
    let s = load('cur', null);
    if (!s || typeof s !== 'object') {
      const old = Curio.store.get('2048:game', null);
      if (old && Array.isArray(old.vals) && old.vals.length === 4 && !old.over) s = { cfg: { mode: 'classic', size: 4, goal: 2048, undo: 1, date: '' }, vals: old.vals, score: old.score || 0, moves: 0, won: !!old.won, over: false, stack: [], undosLeft: 1, timeLeft: 120, started: false, topTile: Math.max(2, ...old.vals.flat()) };
    }
    try {
      if (!s || !s.cfg || !Array.isArray(s.vals) || s.vals.length !== s.cfg.size || s.over) return false;
      if (Curio.simple && (s.cfg.mode !== 'classic' || s.cfg.size !== 4)) return false;
      if (s.cfg.mode === 'daily' && s.cfg.date !== today()) return false;
      cfg = s.cfg;
      N = cfg.size;
      set.mode = cfg.mode;
      if (cfg.mode !== 'daily') set.size = String(cfg.size);
      if (cfg.mode === 'goal') set.goal = String(cfg.goal);
      R = cfg.mode === 'daily' ? mkRng(s.r || seedOf('2048-' + cfg.date)) : null;
      gridEl.innerHTML = '<div></div>'.repeat(N * N);
      loadVals(s.vals);
      for (const row of grid) for (const t of row) if (t) t.kind = 'new';
      score = s.score || 0; moves = s.moves || 0; won = !!s.won; over = false;
      stack = Array.isArray(s.stack) ? s.stack.filter((x) => x && Array.isArray(x.vals) && x.vals.length === N) : [];
      undosLeft = s.undosLeft ?? cfg.undo; timeLeft = s.timeLeft ?? 120; started = !!s.started;
      topTile = s.topTile || Math.max(2, ...s.vals.flat()); hintsUsed = s.hintsUsed || 0; mergesGame = s.mergesGame || 0;
      sizeBoard();
      render([]);
      applyTheme();
      paintSetup();
      if (cfg.mode === 'blitz' && started && timeLeft > 0) startTimer();
      return true;
    } catch { return false; }
  }
  const setupEl = $('setup'), setupBtn = $('setupBtn');
  function toggleSetup(open) {
    setupEl.hidden = !open;
    setupBtn.setAttribute('aria-expanded', String(open));
    if (sizeBoard && N) requestAnimationFrame(() => sizeBoard());
  }
  setupBtn.addEventListener('click', () => toggleSetup(setupEl.hidden));
  toggleSetup(!Curio.simple && innerWidth > 700 && innerHeight > 760);
  if (!restore()) fresh('quiet');
  if (!Curio.simple && !Curio.store.get('2048:welcomed', false)) showWelcome();
  renderTab('help');

  window.__g2048 = {
    set(vals) { N = vals.length; cfg.size = N; gridEl.innerHTML = '<div></div>'.repeat(N * N); loadVals(vals); stack = []; over = false; won = true; sizeBoard(); render([]); applyTheme(); },
    move(dir) { const r = move(dir); render(r ? r.gone : []); return !!r; },
    act, values, canMove, hint: bestMove, slide: (v, d) => slideVals(v, d),
    get score() { return score; }, get over() { return over; }, get cfg() { return cfg; }, get time() { return timeLeft; },
    setTime(t) { timeLeft = t; }
  };
})();
