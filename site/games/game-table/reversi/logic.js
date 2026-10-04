function reversiEngine() {
  const DIRS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
  const WEIGHTS = [
    120, -20, 20, 5, 5, 20, -20, 120,
    -20, -40, -5, -5, -5, -5, -40, -20,
    20, -5, 15, 3, 3, 15, -5, 20,
    5, -5, 3, 3, 3, 3, -5, 5,
    5, -5, 3, 3, 3, 3, -5, 5,
    20, -5, 15, 3, 3, 15, -5, 20,
    -20, -40, -5, -5, -5, -5, -40, -20,
    120, -20, 20, 5, 5, 20, -20, 120
  ];
  const CORNERS = [0, 7, 56, 63];
  const XSQ = { 9: 0, 14: 7, 49: 56, 54: 63 };
  const CSQ = { 1: 0, 8: 0, 6: 7, 15: 7, 48: 56, 57: 56, 55: 63, 62: 63 };

  function initial() {
    const b = new Array(64).fill(0);
    b[27] = -1; b[36] = -1; b[28] = 1; b[35] = 1;
    return b;
  }

  function flips(b, i, p) {
    if (b[i]) return [];
    const r0 = i >> 3, c0 = i & 7, out = [];
    for (const [dr, dc] of DIRS) {
      let r = r0 + dr, c = c0 + dc;
      const line = [];
      while (r >= 0 && r < 8 && c >= 0 && c < 8 && b[r * 8 + c] === -p) { line.push(r * 8 + c); r += dr; c += dc; }
      if (line.length && r >= 0 && r < 8 && c >= 0 && c < 8 && b[r * 8 + c] === p) out.push(...line);
    }
    return out;
  }

  function moves(b, p) {
    const out = [];
    for (let i = 0; i < 64; i++) if (!b[i] && flips(b, i, p).length) out.push(i);
    return out;
  }

  function play(b, i, p) {
    const f = flips(b, i, p);
    const nb = b.slice();
    nb[i] = p;
    for (const x of f) nb[x] = p;
    return { board: nb, flipped: f };
  }

  function count(b) {
    let a = 0, c = 0;
    for (const v of b) { if (v === 1) a++; else if (v === -1) c++; }
    return { black: a, white: c, empty: 64 - a - c };
  }

  function evaluate(b, p) {
    let pos = 0, mine = 0, theirs = 0, empty = 0;
    for (let i = 0; i < 64; i++) {
      const v = b[i];
      if (!v) { empty++; continue; }
      let w = WEIGHTS[i];
      if (i in XSQ && b[XSQ[i]]) w = 5;
      if (i in CSQ && b[CSQ[i]]) w = 10;
      if (v === p) { pos += w; mine++; } else { pos -= w; theirs++; }
    }
    const m1 = moves(b, p).length, m2 = moves(b, -p).length;
    const mob = m1 + m2 ? 100 * (m1 - m2) / (m1 + m2 + 2) : 0;
    let corners = 0;
    for (const c of CORNERS) { if (b[c] === p) corners++; else if (b[c] === -p) corners--; }
    const parity = empty < 16 ? (mine - theirs) * (16 - empty) / 2 : 0;
    return pos + mob * 2 + corners * 60 + parity;
  }

  const WIN = 100000;

  function search(b, p, opts) {
    const ctl = { nodes: 0, deadline: Date.now() + opts.time };
    const ABORT = {};
    const empties = count(b).empty;
    const exact = opts.solve && empties <= opts.solve;

    function negamax(bd, side, depth, alpha, beta, passed) {
      if ((++ctl.nodes & 1023) === 0 && Date.now() > ctl.deadline) throw ABORT;
      const ms = moves(bd, side);
      if (!ms.length) {
        if (passed || !moves(bd, -side).length) {
          const n = count(bd), d = (n.black - n.white) * side;
          return d > 0 ? WIN + d : d < 0 ? -WIN + d : 0;
        }
        return -negamax(bd, -side, depth, -beta, -alpha, true);
      }
      if (depth <= 0) return exact ? finalDiff(bd, side) : evaluate(bd, side);
      ms.sort((a, c) => WEIGHTS[c] - WEIGHTS[a]);
      for (const m of ms) {
        const v = -negamax(play(bd, m, side).board, -side, depth - 1, -beta, -alpha, false);
        if (v > alpha) alpha = v;
        if (alpha >= beta) break;
      }
      return alpha;
    }
    function finalDiff(bd, side) { const n = count(bd); return (n.black - n.white) * side; }

    const root = moves(b, p);
    if (!root.length) return null;
    if (root.length === 1) return root[0];
    let best = root[0];
    const maxDepth = exact ? empties : opts.depth;
    for (let depth = exact ? empties : 1; depth <= maxDepth; depth++) {
      try {
        let alpha = -Infinity, iterBest = best;
        const ordered = [best, ...root.filter((m) => m !== best).sort((a, c) => WEIGHTS[c] - WEIGHTS[a])];
        for (const m of ordered) {
          let v = -negamax(play(b, m, p).board, -p, depth - 1, -Infinity, -(alpha - (opts.noise || 0)), false);
          v += opts.noise ? Math.random() * opts.noise : 0;
          if (v > alpha) { alpha = v; iterBest = m; }
        }
        best = iterBest;
      } catch (e) {
        if (e !== ABORT) throw e;
        if (exact) return search(b, p, { ...opts, solve: 0 });
        break;
      }
    }
    return best;
  }

  const LEVELS = {
    easy: { depth: 1, time: 300, noise: 60 },
    medium: { depth: 3, time: 700, noise: 8 },
    hard: { depth: 7, time: 1600, noise: 0, solve: 10 },
    expert: { depth: 10, time: 2600, noise: 0, solve: 14 },
    hint: { depth: 7, time: 1200, noise: 0, solve: 12 }
  };

  function think(b, p, level) {
    return search(b, p, LEVELS[level] || LEVELS.medium);
  }

  return { initial, flips, moves, play, count, evaluate, think };
}

if (typeof window !== 'undefined') window.ReversiEngine = reversiEngine();
