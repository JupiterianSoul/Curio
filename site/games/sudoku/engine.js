(function (root) {
  function rng(seed) {
    let s = seed >>> 0;
    return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const shuffle = (a, r) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const bits = (m) => { let n = 0; while (m) { m &= m - 1; n++; } return n; };
  const digitsOf = (m) => { const out = []; for (let d = 1; d <= 9; d++) if (m & (1 << d)) out.push(d); return out; };

  function makeShape(n, diag) {
    const bw = n === 6 ? 3 : 3, bh = n === 6 ? 2 : 3;
    const N = n * n;
    const boxOf = (i) => { const r = Math.floor(i / n), c = i % n; return Math.floor(r / bh) * (n / bw) + Math.floor(c / bw); };
    const units = [];
    for (let r = 0; r < n; r++) units.push({ kind: 'row', idx: r, cells: Array.from({ length: n }, (_, c) => r * n + c) });
    for (let c = 0; c < n; c++) units.push({ kind: 'col', idx: c, cells: Array.from({ length: n }, (_, r) => r * n + c) });
    for (let b = 0; b < n; b++) units.push({ kind: 'box', idx: b, cells: [...Array(N).keys()].filter((i) => boxOf(i) === b) });
    if (diag) {
      units.push({ kind: 'diag', idx: 0, cells: Array.from({ length: n }, (_, k) => k * n + k) });
      units.push({ kind: 'diag', idx: 1, cells: Array.from({ length: n }, (_, k) => k * n + (n - 1 - k)) });
    }
    const unitsOf = Array.from({ length: N }, () => []);
    units.forEach((u, ui) => u.cells.forEach((i) => unitsOf[i].push(ui)));
    const peers = Array.from({ length: N }, (_, i) => { const s = new Set(); for (const ui of unitsOf[i]) for (const j of units[ui].cells) if (j !== i) s.add(j); return [...s]; });
    const full = ((1 << (n + 1)) - 1) & ~1;
    return { n, N, bw, bh, diag: !!diag, boxOf, units, unitsOf, peers, full };
  }

  function cageInfo(shape, cages) {
    if (!cages) return null;
    const of = new Int16Array(shape.N).fill(-1);
    cages.forEach((c, k) => c.cells.forEach((i) => { of[i] = k; }));
    return { list: cages, of };
  }

  function sumRange(avail, k) {
    const ds = digitsOf(avail);
    if (ds.length < k) return null;
    let lo = 0, hi = 0;
    for (let i = 0; i < k; i++) { lo += ds[i]; hi += ds[ds.length - 1 - i]; }
    return [lo, hi];
  }

  function cageMask(shape, cg, g, i) {
    if (!cg) return shape.full;
    const k = cg.of[i]; if (k < 0) return shape.full;
    const cage = cg.list[k];
    let used = 0, sum = 0, empty = 0;
    for (const j of cage.cells) { if (g[j]) { used |= 1 << g[j]; sum += g[j]; } else empty++; }
    let m = shape.full & ~used;
    let out = 0;
    for (const d of digitsOf(m)) {
      const rest = cage.sum - sum - d;
      if (empty === 1) { if (rest === 0) out |= 1 << d; continue; }
      const rg = sumRange(m & ~(1 << d), empty - 1);
      if (rg && rest >= rg[0] && rest <= rg[1]) out |= 1 << d;
    }
    return out;
  }

  function candidates(shape, g, i, cg) {
    if (g[i]) return 0;
    let used = 0;
    for (const j of shape.peers[i]) if (g[j]) used |= 1 << g[j];
    return shape.full & ~used & cageMask(shape, cg, g, i);
  }

  function solve(shape, grid, { limit = 2, out = null, r = null, cages = null, maxNodes = 2e6 } = {}) {
    const g = Array.from(grid);
    const cg = cageInfo(shape, cages);
    for (let i = 0; i < shape.N; i++) if (g[i]) for (const j of shape.peers[i]) if (g[j] === g[i]) return 0;
    let count = 0, nodes = 0, aborted = false;
    function rec() {
      if (++nodes > maxNodes) { aborted = true; return true; }
      let best = -1, bm = 0, bn = 99;
      for (let i = 0; i < shape.N; i++) if (!g[i]) {
        const m = candidates(shape, g, i, cg), c = bits(m);
        if (c < bn) { bn = c; best = i; bm = m; if (c <= 1) break; }
      }
      if (best < 0) { count++; if (out && count === 1) for (let i = 0; i < shape.N; i++) out[i] = g[i]; return count >= limit; }
      if (!bn) return false;
      const ds = digitsOf(bm);
      if (r) shuffle(ds, r);
      for (const d of ds) { g[best] = d; if (rec()) return true; }
      g[best] = 0;
      return false;
    }
    rec();
    return aborted ? -1 : count;
  }

  function fullGrid(shape, r) {
    for (let tries = 0; tries < 20; tries++) {
      const out = new Array(shape.N).fill(0);
      const res = solve(shape, out.slice(), { limit: 1, out, r, maxNodes: 200000 });
      if (res === 1) return out;
    }
    return null;
  }

  function makeCages(shape, sol, r, maxSize) {
    const N = shape.N, n = shape.n, owner = new Int16Array(N).fill(-1), cages = [];
    const nb = (i) => { const out = [], rr = Math.floor(i / n), c = i % n; if (rr > 0) out.push(i - n); if (rr < n - 1) out.push(i + n); if (c > 0) out.push(i - 1); if (c < n - 1) out.push(i + 1); return out; };
    const order = shuffle([...Array(N).keys()], r);
    for (const start of order) {
      if (owner[start] >= 0) continue;
      const roll = r();
      const target = roll < 0.1 ? 1 : roll < 0.45 ? 2 : roll < 0.8 ? 3 : Math.min(maxSize, 4 + Math.floor(r() * (maxSize - 3)));
      const cells = [start]; owner[start] = cages.length;
      let used = 1 << sol[start];
      while (cells.length < target) {
        const opts = [];
        for (const c of cells) for (const j of nb(c)) if (owner[j] < 0 && !(used & (1 << sol[j]))) opts.push(j);
        if (!opts.length) break;
        const j = opts[Math.floor(r() * opts.length)];
        owner[j] = cages.length; cells.push(j); used |= 1 << sol[j];
      }
      cages.push({ cells: cells.sort((a, b) => a - b), sum: cells.reduce((s, i) => s + sol[i], 0) });
    }
    for (let k = 0; k < cages.length; k++) {
      if (cages[k].cells.length !== 1) continue;
      const i = cages[k].cells[0];
      const near = nb(i).map((j) => owner[j]).filter((o) => o !== k && cages[o].cells.length < maxSize && !cages[o].cells.some((c) => sol[c] === sol[i]));
      if (!near.length) continue;
      const o = near[Math.floor(r() * near.length)];
      cages[o].cells.push(i); cages[o].cells.sort((a, b) => a - b); cages[o].sum += sol[i];
      owner[i] = o; cages[k].cells = [];
    }
    return cages.filter((c) => c.cells.length);
  }

  const TARGETS = {
    9: { easy: 38, medium: 32, hard: 28, expert: 24 },
    6: { easy: 18, medium: 14, hard: 12, expert: 10 }
  };
  const KILLER_EXTRA = { easy: 22, medium: 10, hard: 3, expert: 0 };

  function generate({ variant = 'classic', level = 'medium', seed = (Math.random() * 2 ** 32) >>> 0 } = {}) {
    const r = rng(seed);
    const n = variant === 'mini' ? 6 : 9;
    const shape = makeShape(n, variant === 'diagonal');
    const solution = fullGrid(shape, r);
    if (variant === 'killer') {
      const cages = makeCages(shape, solution, r, 5);
      const puzzle = new Array(shape.N).fill(0);
      for (let guard = 0; guard < 81; guard++) {
        const sols = [];
        const c = solveTwo(shape, puzzle, cages, sols);
        if (c === 'one') break;
        const free = puzzle.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
        if (c === 'abort') { shuffle(free, r).slice(0, 2).forEach((i) => { puzzle[i] = solution[i]; }); continue; }
        const diffs = free.filter((i) => sols[0][i] !== sols[1][i]);
        const pick = diffs[Math.floor(r() * diffs.length)];
        puzzle[pick] = solution[pick];
      }
      const extra = KILLER_EXTRA[level] || 0;
      const free = shuffle(puzzle.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0), r);
      for (let k = 0; k < extra && k < free.length; k++) puzzle[free[k]] = solution[free[k]];
      return { variant, level, n, seed, puzzle, solution, cages };
    }
    const puzzle = solution.slice();
    const target = TARGETS[n][level] || TARGETS[n].medium;
    let givens = shape.N;
    const order = shuffle([...Array(Math.ceil(shape.N / 2)).keys()], r);
    for (const i of order) {
      if (givens <= target) break;
      const j = shape.N - 1 - i;
      const pair = i === j ? [i] : [i, j];
      if (pair.some((k) => !puzzle[k])) continue;
      const keep = pair.map((k) => puzzle[k]);
      pair.forEach((k) => { puzzle[k] = 0; });
      if (solve(shape, puzzle, { limit: 2, maxNodes: 400000 }) !== 1) pair.forEach((k, t) => { puzzle[k] = keep[t]; });
      else givens -= pair.length;
    }
    return { variant, level, n, seed, puzzle, solution, cages: null };
  }

  function solveTwo(shape, grid, cages, sols) {
    const g = Array.from(grid), cg = cageInfo(shape, cages);
    let nodes = 0, aborted = false;
    (function rec() {
      if (++nodes > 250000) { aborted = true; return true; }
      let best = -1, bm = 0, bn = 99;
      for (let i = 0; i < shape.N; i++) if (!g[i]) { const m = candidates(shape, g, i, cg), c = bits(m); if (c < bn) { bn = c; best = i; bm = m; if (c <= 1) break; } }
      if (best < 0) { sols.push(g.slice()); return sols.length >= 2; }
      if (!bn) return false;
      for (const d of digitsOf(bm)) { g[best] = d; if (rec()) return true; }
      g[best] = 0; return false;
    })();
    if (aborted) return 'abort';
    return sols.length >= 2 ? 'many' : 'one';
  }

  const UNIT_NAME = (u) => (u.kind === 'row' ? `row ${u.idx + 1}` : u.kind === 'col' ? `column ${u.idx + 1}` : u.kind === 'box' ? 'this box' : u.idx === 0 ? 'the main diagonal' : 'the anti-diagonal');

  function findStep(shape, g, cages, solution) {
    const cg = cageInfo(shape, cages);
    const N = shape.N;
    for (let i = 0; i < N; i++) if (g[i] && solution && g[i] !== solution[i]) return { kind: 'mistake', cell: i, title: 'Spot the mistake', text: 'This number does not match the solution. Something earlier went sideways, so erase it and look again.', focus: [i], region: [] };
    const cand = new Array(N).fill(0);
    for (let i = 0; i < N; i++) cand[i] = candidates(shape, g, i, cg);
    for (let i = 0; i < N; i++) if (!g[i] && cand[i] === 0) return null;
    if (cg) {
      for (const cage of cg.list) {
        const empty = cage.cells.filter((i) => !g[i]);
        if (empty.length !== 1) continue;
        const i = empty[0], filled = cage.cells.filter((j) => g[j]).reduce((s, j) => s + g[j], 0), d = cage.sum - filled;
        if (d >= 1 && d <= shape.n) return { kind: 'cage', cell: i, digit: d, title: 'Cage math', text: `This cage adds up to ${cage.sum}. The other cells already make ${filled}, so the last one must be ${d}.`, focus: [i], region: cage.cells };
      }
    }
    for (const u of shape.units) {
      for (let d = 1; d <= shape.n; d++) {
        if (u.cells.some((i) => g[i] === d)) continue;
        const spots = u.cells.filter((i) => cand[i] & (1 << d));
        if (spots.length === 1 && u.kind === 'box') return { kind: 'hidden', cell: spots[0], digit: d, title: 'Hidden single', text: `Every ${d} nearby blocks the rest of this box. The only place a ${d} can go in this box is here.`, focus: spots, region: u.cells };
      }
    }
    for (let i = 0; i < N; i++) if (!g[i] && bits(cand[i]) === 1) {
      const d = digitsOf(cand[i])[0];
      return { kind: 'naked', cell: i, digit: d, title: 'Last option', text: `Look along this cell's row, column${shape.diag && shape.unitsOf[i].some((ui) => shape.units[ui].kind === 'diag') ? ', diagonal' : ''} and box${cg && cg.of[i] >= 0 ? ' plus its cage' : ''}. Between them they rule out every digit except ${d}.`, focus: [i], region: shape.peers[i] };
    }
    for (const u of shape.units) {
      if (u.kind === 'box') continue;
      for (let d = 1; d <= shape.n; d++) {
        if (u.cells.some((i) => g[i] === d)) continue;
        const spots = u.cells.filter((i) => cand[i] & (1 << d));
        if (spots.length === 1) return { kind: 'hidden', cell: spots[0], digit: d, title: 'Hidden single', text: `Check ${UNIT_NAME(u)}: it still needs a ${d}, and this is the only cell in it where a ${d} fits.`, focus: spots, region: u.cells };
      }
    }
    const work = cand.slice();
    const elim = [];
    for (let pass = 0; pass < 4; pass++) {
      let changed = false;
      for (const u of shape.units) {
        const empt = u.cells.filter((i) => !g[i]);
        for (let a = 0; a < empt.length; a++) for (let b = a + 1; b < empt.length; b++) {
          const ma = work[empt[a]];
          if (bits(ma) !== 2 || ma !== work[empt[b]]) continue;
          for (const k of empt) if (k !== empt[a] && k !== empt[b] && (work[k] & ma)) { work[k] &= ~ma; changed = true; elim.push({ t: 'pair', u, cells: [empt[a], empt[b]], ds: digitsOf(ma) }); }
        }
      }
      for (const u of shape.units) {
        if (u.kind !== 'box') continue;
        for (let d = 1; d <= shape.n; d++) {
          const spots = u.cells.filter((i) => !g[i] && (work[i] & (1 << d)));
          if (spots.length < 2) continue;
          for (const line of shape.units) {
            if (line.kind !== 'row' && line.kind !== 'col') continue;
            if (!spots.every((i) => line.cells.includes(i))) continue;
            for (const k of line.cells) if (!u.cells.includes(k) && !g[k] && (work[k] & (1 << d))) { work[k] &= ~(1 << d); changed = true; elim.push({ t: 'point', u, line, d, cells: spots }); }
          }
        }
      }
      for (let i = 0; i < N; i++) if (!g[i] && bits(work[i]) === 1 && bits(cand[i]) > 1) {
        const d = digitsOf(work[i])[0], e = elim[0];
        const why = e.t === 'pair' ? `Two cells in ${UNIT_NAME(e.u)} can only hold ${e.ds[0]} and ${e.ds[1]} between them (a naked pair), so no other cell there can.` : `Inside its box, every possible ${e.d} sits on ${UNIT_NAME(e.line)} (a pointing pair), so ${e.d} cannot go anywhere else on that line.`;
        return { kind: 'advanced', cell: i, digit: d, title: e.t === 'pair' ? 'Naked pair' : 'Pointing pair', text: `${why} That leaves only ${d} for the highlighted cell.`, focus: [i], region: e.cells };
      }
      for (const u of shape.units) for (let d = 1; d <= shape.n; d++) {
        if (u.cells.some((i) => g[i] === d)) continue;
        const spots = u.cells.filter((i) => !g[i] && (work[i] & (1 << d)));
        if (spots.length === 1 && cand[spots[0]] !== (1 << d) && elim.length) {
          const e = elim[0];
          const why = e.t === 'pair' ? `A naked pair in ${UNIT_NAME(e.u)} (${e.ds.join(' and ')}) clears those digits from the rest of it.` : `A pointing pair of ${e.d}s in a box clears ${e.d} from the rest of ${UNIT_NAME(e.line)}.`;
          return { kind: 'advanced', cell: spots[0], digit: d, title: e.t === 'pair' ? 'Naked pair' : 'Pointing pair', text: `${why} After that, ${UNIT_NAME(u)} has just one home left for ${d}.`, focus: [spots[0]], region: e.cells };
        }
      }
      if (!changed) break;
    }
    return null;
  }

  const api = { rng, makeShape, solve, generate, candidates, cageInfo, findStep, digitsOf, bits };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.SudokuEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
