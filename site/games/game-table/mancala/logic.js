function mancalaEngine() {
  const STORE = [6, 13];
  const pitsOf = (p) => (p === 0 ? [0, 1, 2, 3, 4, 5] : [7, 8, 9, 10, 11, 12]);
  const VARIANTS = {
    kalah4: { kind: 'kalah', seeds: 4, name: 'Kalah' },
    kalah3: { kind: 'kalah', seeds: 3, name: 'Quick Kalah' },
    kalah6: { kind: 'kalah', seeds: 6, name: 'Kalah 6' },
    oware: { kind: 'oware', seeds: 4, name: 'Oware' },
    avalanche: { kind: 'avalanche', seeds: 4, name: 'Avalanche' }
  };
  const rulesOf = (v) => VARIANTS[v] || VARIANTS.kalah4;

  function initial(n = 4) {
    const b = new Array(14).fill(n);
    b[6] = 0; b[13] = 0;
    return b;
  }

  const nextPit = (k) => (k + 1) % 14;
  const rowSum = (b, p) => pitsOf(p).reduce((s, x) => s + b[x], 0);

  function legal(b, p, v) {
    const R = rulesOf(v);
    const raw = pitsOf(p).filter((i) => b[i] > 0);
    if (R.kind !== 'oware' || rowSum(b, 1 - p) > 0) return raw;
    const opp = pitsOf(1 - p);
    return raw.filter((i) => sowOware(b, i, p, true).board.some((n, k) => opp.includes(k) && n > 0));
  }

  function sweepAll(nb) {
    const sweep = [];
    for (const q of [0, 1]) for (const x of pitsOf(q)) if (nb[x]) { sweep.push({ pit: x, store: STORE[q], n: nb[x] }); nb[STORE[q]] += nb[x]; nb[x] = 0; }
    return sweep;
  }

  function sowKalah(b, i, p, relay) {
    const nb = b.slice();
    let n = nb[i];
    nb[i] = 0;
    let k = i;
    const path = [];
    let laps = 0;
    for (;;) {
      while (n > 0) {
        k = nextPit(k);
        if (k === STORE[1 - p]) continue;
        nb[k]++; n--; path.push(k);
      }
      if (!relay || k === STORE[p] || nb[k] <= 1 || ++laps > 60) break;
      n = nb[k]; nb[k] = 0; path.push({ pick: k });
    }
    let capture = null;
    const own = pitsOf(p);
    if (!relay && own.includes(k) && nb[k] === 1 && nb[12 - k] > 0) {
      capture = { pits: [k, 12 - k], stones: nb[12 - k] + 1 };
      nb[STORE[p]] += nb[12 - k] + 1;
      nb[k] = 0; nb[12 - k] = 0;
    }
    const extra = k === STORE[p];
    let sweep = null;
    if (pitsOf(0).every((x) => !nb[x]) || pitsOf(1).every((x) => !nb[x])) sweep = sweepAll(nb);
    return { board: nb, path, last: k, extra: extra && !sweep, capture, over: !!sweep, sweep };
  }

  function sowOware(b, i, p, dry) {
    const nb = b.slice();
    let n = nb[i];
    nb[i] = 0;
    let k = i;
    const path = [];
    while (n > 0) {
      k = nextPit(k);
      if (k === 6 || k === 13 || k === i) continue;
      nb[k]++; n--; path.push(k);
    }
    if (dry) return { board: nb };
    let capture = null;
    const opp = pitsOf(1 - p);
    if (opp.includes(k) && (nb[k] === 2 || nb[k] === 3)) {
      const taken = [];
      let j = k;
      while (opp.includes(j) && (nb[j] === 2 || nb[j] === 3)) { taken.push(j); j = j === 7 ? -1 : j - 1; }
      const total = taken.reduce((s, x) => s + nb[x], 0);
      if (total < rowSum(nb, 1 - p)) {
        capture = { pits: taken, stones: total };
        taken.forEach((x) => { nb[x] = 0; });
        nb[STORE[p]] += total;
      }
    }
    let over = nb[6] > 24 || nb[13] > 24 || (nb[6] === 24 && nb[13] === 24);
    let sweep = null;
    if (!over && legal(nb, 1 - p, 'oware').length === 0) { sweep = sweepAll(nb); over = true; }
    return { board: nb, path, last: k, extra: false, capture, over, sweep };
  }

  function sow(b, i, p, v) {
    const R = rulesOf(v);
    if (R.kind === 'oware') return sowOware(b, i, p);
    return sowKalah(b, i, p, R.kind === 'avalanche');
  }

  function evaluate(b, p) {
    const me = STORE[p], them = STORE[1 - p];
    return (b[me] - b[them]) * 4 + (rowSum(b, p) - rowSum(b, 1 - p));
  }

  function search(b, p, opts, v) {
    const deadline = Date.now() + opts.time;
    let nodes = 0;
    const ABORT = {};
    const fin = (bd, side) => (bd[STORE[side]] - bd[STORE[1 - side]]) * 1000;
    function negamax(bd, side, depth, alpha, beta) {
      if ((++nodes & 1023) === 0 && Date.now() > deadline) throw ABORT;
      const ms = legal(bd, side, v);
      if (!ms.length) return fin(bd, side);
      if (depth <= 0) return evaluate(bd, side);
      let best = -Infinity;
      for (const m of order(bd, ms, side)) {
        const r = sow(bd, m, side, v);
        let val;
        if (r.over) val = fin(r.board, side);
        else if (r.extra) val = negamax(r.board, side, depth - 1, alpha, beta);
        else val = -negamax(r.board, 1 - side, depth - 1, -beta, -alpha);
        if (val > best) best = val;
        if (val > alpha) alpha = val;
        if (alpha >= beta) break;
      }
      return best;
    }
    function order(bd, ms, side) {
      return ms.map((m) => { const r = sow(bd, m, side, v); return { m, k: (r.extra ? 100 : 0) + (r.capture ? r.capture.stones * 5 : 0) }; }).sort((a, c) => c.k - a.k).map((o) => o.m);
    }
    const root = legal(b, p, v);
    if (!root.length) return -1;
    let best = root[0];
    for (let depth = 1; depth <= opts.depth; depth++) {
      try {
        let alpha = -Infinity, iterBest = best;
        const ms = [best, ...order(b, root, p).filter((m) => m !== best)];
        for (const m of ms) {
          const r = sow(b, m, p, v);
          let val;
          if (r.over) val = fin(r.board, p);
          else if (r.extra) val = negamax(r.board, p, depth - 1, alpha - (opts.noise || 0), Infinity);
          else val = -negamax(r.board, 1 - p, depth - 1, -Infinity, -(alpha - (opts.noise || 0)));
          val += opts.noise ? Math.random() * opts.noise : 0;
          if (val > alpha) { alpha = val; iterBest = m; }
        }
        best = iterBest;
      } catch (e) {
        if (e !== ABORT) throw e;
        break;
      }
    }
    return best;
  }

  const LEVELS = { easy: { depth: 1, time: 200, noise: 12 }, medium: { depth: 5, time: 500, noise: 3 }, hard: { depth: 14, time: 1500, noise: 0 } };
  const think = (b, p, level, v) => search(b, p, LEVELS[level] || LEVELS.medium, v);

  return { STORE, VARIANTS, rulesOf, pitsOf, initial, legal, sow, evaluate, think };
}

if (typeof window !== 'undefined') window.MancalaEngine = mancalaEngine();
