function c4Engine() {
  const WIN = 1000000;
  const ABORT = {};
  const DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];
  const windowCache = new Map();

  function create(v) {
    const W = v.w || 7, H = v.h || 6;
    const g = { W, H, N: v.n || 4, pop: !!v.pop, cells: new Int8Array(W * H), heights: new Int8Array(W), moves: 0, locked: (v.locked || []).slice() };
    for (const c of g.locked) {
      for (let r = 0; r < H; r++) g.cells[c * H + r] = ((r + (c === 0 ? 0 : 1)) % 2) + 1;
      g.heights[c] = H;
    }
    return g;
  }

  function clone(g) {
    return { W: g.W, H: g.H, N: g.N, pop: g.pop, cells: Int8Array.from(g.cells), heights: Int8Array.from(g.heights), moves: g.moves, locked: g.locked.slice() };
  }

  function pack(g) { return { W: g.W, H: g.H, N: g.N, pop: g.pop, cells: Array.from(g.cells), heights: Array.from(g.heights), moves: g.moves, locked: g.locked }; }
  function revive(o) { return { W: o.W, H: o.H, N: o.N, pop: o.pop, cells: Int8Array.from(o.cells), heights: Int8Array.from(o.heights), moves: o.moves, locked: o.locked.slice() }; }

  const at = (g, c, r) => (c >= 0 && c < g.W && r >= 0 && r < g.H ? g.cells[c * g.H + r] : -1);
  const canDrop = (g, c) => c >= 0 && c < g.W && g.heights[c] < g.H;
  const canPop = (g, c, p) => g.pop && c >= 0 && c < g.W && g.heights[c] > 0 && g.cells[c * g.H] === p && !g.locked.includes(c);
  const isFull = (g) => { for (let c = 0; c < g.W; c++) if (g.heights[c] < g.H) return false; return true; };

  function order(W) {
    const out = [];
    const mid = (W - 1) / 2;
    for (let c = 0; c < W; c++) out.push(c);
    return out.sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid) || a - b);
  }

  function legal(g, p) {
    const out = [];
    for (const c of order(g.W)) if (canDrop(g, c)) out.push(c);
    if (g.pop) for (const c of order(g.W)) if (canPop(g, c, p)) out.push(g.W + c);
    return out;
  }

  function doMove(g, m, p) {
    if (m < g.W) { const r = g.heights[m]++; g.cells[m * g.H + r] = p; g.moves++; return r; }
    const c = m - g.W, H = g.H, b = c * H, h = g.heights[c], v = g.cells[b];
    for (let r = 0; r < h - 1; r++) g.cells[b + r] = g.cells[b + r + 1];
    g.cells[b + h - 1] = 0; g.heights[c]--; g.moves++;
    return v;
  }

  function undoMove(g, m, tok) {
    if (m < g.W) { const r = --g.heights[m]; g.cells[m * g.H + r] = 0; g.moves--; return; }
    const c = m - g.W, H = g.H, b = c * H;
    for (let r = g.heights[c]; r > 0; r--) g.cells[b + r] = g.cells[b + r - 1];
    g.cells[b] = tok; g.heights[c]++; g.moves--;
  }

  function lineAt(g, c, r) {
    const p = at(g, c, r);
    if (p <= 0) return null;
    let best = null;
    for (const [dc, dr] of DIRS) {
      const cells = [[c, r]];
      for (let k = 1; at(g, c + dc * k, r + dr * k) === p; k++) cells.push([c + dc * k, r + dr * k]);
      for (let k = 1; at(g, c - dc * k, r - dr * k) === p; k++) cells.unshift([c - dc * k, r - dr * k]);
      if (cells.length >= g.N && (!best || cells.length > best.length)) best = cells;
    }
    return best;
  }

  function columnLines(g, c) {
    const found = { 1: null, 2: null };
    for (let r = 0; r < g.heights[c]; r++) {
      const l = lineAt(g, c, r);
      if (l) { const p = at(g, c, r); if (!found[p]) found[p] = l; }
    }
    return found;
  }

  function winnerAfter(g, m, p, tok) {
    if (m < g.W) { const l = lineAt(g, m, tok); return l ? { p, cells: l } : null; }
    const f = columnLines(g, m - g.W);
    if (f[p]) return { p, cells: f[p] };
    if (f[3 - p]) return { p: 3 - p, cells: f[3 - p] };
    return null;
  }

  function windows(g) {
    const key = `${g.W}x${g.H}x${g.N}`;
    if (windowCache.has(key)) return windowCache.get(key);
    const out = [];
    for (let c = 0; c < g.W; c++) for (let r = 0; r < g.H; r++) {
      for (const [dc, dr] of DIRS) {
        const ec = c + dc * (g.N - 1), er = r + dr * (g.N - 1);
        if (ec < 0 || ec >= g.W || er < 0 || er >= g.H) continue;
        const idx = [];
        for (let k = 0; k < g.N; k++) idx.push((c + dc * k) * g.H + r + dr * k);
        out.push(idx);
      }
    }
    windowCache.set(key, out);
    return out;
  }

  function evaluate(g, p) {
    const o = 3 - p, N = g.N;
    let s = 0;
    const mid = (g.W - 1) / 2;
    for (let c = 0; c < g.W; c++) {
      const wgt = Math.max(0, 3 - Math.abs(c - mid));
      if (!wgt) continue;
      for (let r = 0; r < g.heights[c]; r++) { const v = g.cells[c * g.H + r]; if (v === p) s += wgt; else if (v === o) s -= wgt; }
    }
    for (const win of windows(g)) {
      let mine = 0, theirs = 0;
      for (const i of win) { const v = g.cells[i]; if (v === p) mine++; else if (v === o) theirs++; }
      if (mine && theirs) continue;
      if (mine === N - 1) s += 9; else if (mine === N - 2) s += 3; else if (mine === N - 3 && N > 4) s += 1;
      else if (theirs === N - 1) s -= 10; else if (theirs === N - 2) s -= 3;
    }
    return s;
  }

  function negamax(g, depth, alpha, beta, p, ply, ctl) {
    if ((++ctl.nodes & 1023) === 0 && ctl.deadline && Date.now() > ctl.deadline) throw ABORT;
    if (g.pop && g.moves > 140) return 0;
    const moves = legal(g, p);
    if (!moves.length) return 0;
    for (const m of moves) {
      const t = doMove(g, m, p); const w = winnerAfter(g, m, p, t); undoMove(g, m, t);
      if (w && w.p === p) return WIN - ply;
    }
    if (depth <= 0) return evaluate(g, p);
    let best = -Infinity;
    for (const m of moves) {
      const t = doMove(g, m, p);
      const w = winnerAfter(g, m, p, t);
      let v;
      if (w && w.p !== p) v = -(WIN - ply - 1);
      else if (!g.pop && isFull(g)) v = 0;
      else v = -negamax(g, depth - 1, -beta, -alpha, 3 - p, ply + 1, ctl);
      undoMove(g, m, t);
      if (v > best) best = v;
      if (v > alpha) alpha = v;
      if (alpha >= beta) break;
    }
    return best;
  }

  function rootScores(g, p, depth, ctl) {
    const out = [];
    let alpha = -Infinity;
    for (const m of legal(g, p)) {
      const t = doMove(g, m, p);
      const w = winnerAfter(g, m, p, t);
      let v;
      if (w) v = w.p === p ? WIN : -WIN + 1;
      else if (!g.pop && isFull(g)) v = 0;
      else v = -negamax(g, depth - 1, -Infinity, -alpha + 1, 3 - p, 1, ctl);
      undoMove(g, m, t);
      out.push({ m, v });
      if (v > alpha) alpha = v;
    }
    return out;
  }

  const LEVELS = {
    easy: { depth: 2, noise: 0.42, budget: 250 },
    medium: { depth: 4, noise: 0.12, budget: 450 },
    hard: { depth: 9, noise: 0, budget: 900 },
    expert: { depth: 16, noise: 0, budget: 1700 }
  };

  function aiMove(g0, p, level = 'medium', opts = {}) {
    const g = clone(g0);
    const rnd = opts.random || Math.random;
    const moves = legal(g, p);
    if (!moves.length) return { move: -1, depth: 0, scores: [] };
    if (moves.length === 1) return { move: moves[0], depth: 0, scores: [{ m: moves[0], v: 0 }] };
    const cfg = LEVELS[level] || LEVELS.medium;
    const budget = opts.budget ?? cfg.budget;
    const ctl = { nodes: 0, deadline: Date.now() + budget };
    let scores = rootScores(g, p, 1, { nodes: 0 });
    let reached = 1;
    for (let d = 2; d <= (opts.depth || cfg.depth); d++) {
      try { scores = rootScores(g, p, d, ctl); reached = d; } catch (e) { if (e === ABORT) break; throw e; }
      if (scores.some((s) => s.v >= WIN - 60)) break;
      if (scores.every((s) => s.v <= -WIN + 60)) break;
    }
    const top = Math.max(...scores.map((s) => s.v));
    if (cfg.noise && rnd() < cfg.noise && top < WIN - 60) {
      const safe = scores.filter((s) => s.v > -WIN + 60);
      const pool = safe.length ? safe : scores;
      return { move: pool[Math.floor(rnd() * pool.length)].m, depth: reached, scores };
    }
    const best = scores.filter((s) => s.v === top).map((s) => s.m);
    return { move: best[Math.floor(rnd() * best.length)], depth: reached, scores };
  }

  return { WIN, create, clone, pack, revive, at, canDrop, canPop, isFull, legal, doMove, undoMove, lineAt, winnerAfter, evaluate, aiMove, order };
}
window.C4 = c4Engine();
window.c4Engine = c4Engine;
