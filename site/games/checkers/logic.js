function checkersEngine() {
  const VARIANTS = {
    english: { id: 'english', N: 8, back: false, flying: false, majority: false, promoteMid: false, give: false, kingVal: 170 },
    international: { id: 'international', N: 10, back: true, flying: true, majority: true, promoteMid: false, give: false, kingVal: 320 },
    brazilian: { id: 'brazilian', N: 8, back: true, flying: true, majority: true, promoteMid: false, give: false, kingVal: 300 },
    russian: { id: 'russian', N: 8, back: true, flying: true, majority: false, promoteMid: true, give: false, kingVal: 300 },
    giveaway: { id: 'giveaway', N: 8, back: false, flying: false, majority: false, promoteMid: false, give: true, kingVal: 170 }
  };
  const DIRS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  const sign = (v) => (v > 0 ? 1 : v < 0 ? -1 : 0);
  const kingRow = (side, N) => (side > 0 ? 0 : N - 1);
  const isDark = (i, N) => ((Math.floor(i / N) + (i % N)) & 1) === 1;

  function initial(R) {
    const N = R.N, b = Array(N * N).fill(0), rows = N / 2 - 1;
    for (let i = 0; i < N * N; i++) {
      if (!isDark(i, N)) continue;
      const r = Math.floor(i / N);
      if (r < rows) b[i] = -1; else if (r >= N - rows) b[i] = 1;
    }
    return b;
  }

  const squareNumber = (i, N) => Math.floor(i / N) * (N / 2) + Math.floor((i % N) / 2) + 1;

  function captureMoves(b, side, R) {
    const N = R.N, out = [];
    for (let from = 0; from < N * N; from++) {
      const piece = b[from];
      if (sign(piece) !== side) continue;
      b[from] = 0;
      const walk = (cur, king, path, caps) => {
        const r = Math.floor(cur / N), c = cur % N;
        let extended = false;
        for (const [dr, dc] of DIRS) {
          if (!king && !R.back && dr !== (side > 0 ? -1 : 1)) continue;
          if (king && R.flying) {
            let rr = r + dr, cc = c + dc;
            while (rr >= 0 && rr < N && cc >= 0 && cc < N && b[rr * N + cc] === 0) { rr += dr; cc += dc; }
            if (rr < 0 || rr >= N || cc < 0 || cc >= N) continue;
            const mid = rr * N + cc;
            if (sign(b[mid]) !== -side || caps.includes(mid)) continue;
            let lr = rr + dr, lc = cc + dc;
            while (lr >= 0 && lr < N && lc >= 0 && lc < N && b[lr * N + lc] === 0) {
              const land = lr * N + lc;
              extended = true;
              walk(land, true, path.concat(land), caps.concat(mid));
              lr += dr; lc += dc;
            }
          } else {
            const mr = r + dr, mc = c + dc, lr = r + 2 * dr, lc = c + 2 * dc;
            if (lr < 0 || lr >= N || lc < 0 || lc >= N) continue;
            const mid = mr * N + mc, land = lr * N + lc;
            if (sign(b[mid]) !== -side || b[land] !== 0 || caps.includes(mid)) continue;
            extended = true;
            const np = path.concat(land), nc = caps.concat(mid);
            if (!king && lr === kingRow(side, N)) {
              if (R.promoteMid) walk(land, true, np, nc);
              else if (!R.back) out.push({ from, path: np, caps: nc, promo: true });
              else walk(land, false, np, nc);
            } else walk(land, king, np, nc);
          }
        }
        if (!extended && path.length) {
          const to = path[path.length - 1];
          const promo = Math.abs(piece) === 1 && (R.promoteMid ? path.some((s) => Math.floor(s / N) === kingRow(side, N)) : Math.floor(to / N) === kingRow(side, N));
          out.push({ from, path, caps, promo });
        }
      };
      walk(from, Math.abs(piece) === 2, [], []);
      b[from] = piece;
    }
    const seen = new Set(), uniq = [];
    for (const m of out) {
      const k = `${m.from}:${m.path.join(',')}:${m.caps.slice().sort((a, b2) => a - b2).join(',')}`;
      if (!seen.has(k)) { seen.add(k); uniq.push(m); }
    }
    if (R.majority && uniq.length) {
      const max = Math.max(...uniq.map((m) => m.caps.length));
      return uniq.filter((m) => m.caps.length === max);
    }
    return uniq;
  }

  function simpleMoves(b, side, R) {
    const N = R.N, out = [];
    for (let i = 0; i < N * N; i++) {
      const p = b[i];
      if (sign(p) !== side) continue;
      const r = Math.floor(i / N), c = i % N, king = Math.abs(p) === 2;
      for (const [dr, dc] of DIRS) {
        if (!king && dr !== (side > 0 ? -1 : 1)) continue;
        let rr = r + dr, cc = c + dc;
        while (rr >= 0 && rr < N && cc >= 0 && cc < N && b[rr * N + cc] === 0) {
          const to = rr * N + cc;
          out.push({ from: i, path: [to], caps: [], promo: !king && rr === kingRow(side, N) });
          if (!(king && R.flying)) break;
          rr += dr; cc += dc;
        }
      }
    }
    return out;
  }

  function legalMoves(b, side, R) {
    const caps = captureMoves(b, side, R);
    return caps.length ? caps : simpleMoves(b, side, R);
  }

  function apply(b, m) {
    const nb = b.slice();
    let p = nb[m.from];
    nb[m.from] = 0;
    for (const c of m.caps) nb[c] = 0;
    if (m.promo && Math.abs(p) === 1) p *= 2;
    nb[m.path[m.path.length - 1]] = p;
    return nb;
  }

  function notation(m, N) {
    const sep = m.caps.length ? 'x' : '-';
    return m.caps.length ? [m.from, ...m.path].map((s) => squareNumber(s, N)).join(sep) : `${squareNumber(m.from, N)}-${squareNumber(m.path[m.path.length - 1], N)}`;
  }

  function count(b) {
    const n = { men: [0, 0], kings: [0, 0] };
    for (const p of b) {
      if (!p) continue;
      const k = p > 0 ? 0 : 1;
      if (Math.abs(p) === 2) n.kings[k]++; else n.men[k]++;
    }
    return n;
  }

  function evaluate(b, side, R) {
    const N = R.N;
    let s = 0, mine = 0, theirs = 0;
    for (let i = 0; i < N * N; i++) {
      const p = b[i];
      if (!p) continue;
      const r = Math.floor(i / N), c = i % N, own = sign(p);
      let v;
      if (Math.abs(p) === 2) v = R.kingVal + (r >= 2 && r <= N - 3 && c >= 2 && c <= N - 3 ? 10 : 0) - (R.flying ? 0 : (r === 0 || r === N - 1 ? 6 : 0));
      else {
        const adv = own > 0 ? N - 1 - r : r;
        v = 100 + adv * (R.give ? 2 : 5);
        if (r === (own > 0 ? N - 1 : 0)) v += 12;
        if (c === 0 || c === N - 1) v -= 4;
        if (r >= N / 2 - 1 && r <= N / 2 && c >= 2 && c <= N - 3) v += 6;
      }
      if (own === side) { s += v; mine++; } else { s -= v; theirs++; }
    }
    if (R.give) return -s;
    if (mine && theirs && mine !== theirs) s += (mine > theirs ? 1 : -1) * Math.round(400 / (mine + theirs));
    return s;
  }

  const WIN = 100000;
  const ABORT = {};

  function order(moves, b) {
    if (moves.length > 1) moves.sort((x, y) => (y.promo ? 1 : 0) - (x.promo ? 1 : 0) || y.caps.length - x.caps.length);
    return moves;
  }

  function negamax(b, side, depth, alpha, beta, ply, ctl, R) {
    if ((++ctl.nodes & 511) === 0 && ctl.deadline && Date.now() > ctl.deadline) throw ABORT;
    const moves = legalMoves(b, side, R);
    if (!moves.length) return R.give ? WIN - ply : -WIN + ply;
    if (depth <= 0 && (!moves[0].caps.length || depth < -6)) return evaluate(b, side, R);
    order(moves, b);
    let best = -Infinity;
    for (const m of moves) {
      const v = -negamax(apply(b, m), -side, depth - 1, -beta, -alpha, ply + 1, ctl, R);
      if (v > best) best = v;
      if (v > alpha) alpha = v;
      if (alpha >= beta) break;
    }
    return best;
  }

  function rootScores(b, side, depth, ctl, R, moves) {
    const out = [];
    let alpha = -Infinity;
    for (const m of moves) {
      const v = -negamax(apply(b, m), -side, depth - 1, -Infinity, -alpha + 1, 1, ctl, R);
      out.push({ m, v });
      if (v > alpha) alpha = v;
    }
    out.sort((x, y) => y.v - x.v);
    return out;
  }

  const LEVELS = {
    easy: { depth: 2, noise: 0.3, slack: 30, budget: 250 },
    medium: { depth: 4, noise: 0.06, slack: 0, budget: 450 },
    hard: { depth: 8, noise: 0, slack: 0, budget: 900 },
    expert: { depth: 14, noise: 0, slack: 0, budget: 1700 }
  };

  function aiMove(b, side, level, variantId, opts = {}) {
    const R = VARIANTS[variantId] || VARIANTS.english;
    const rnd = opts.random || Math.random;
    const moves = order(legalMoves(b, side, R), b);
    if (!moves.length) return null;
    if (moves.length === 1) return { m: moves[0], v: 0 };
    const cfg = LEVELS[level] || LEVELS.medium;
    if (cfg.noise && rnd() < cfg.noise) return { m: moves[Math.floor(rnd() * moves.length)], v: 0 };
    const ctl = { nodes: 0, deadline: Date.now() + (opts.budget ?? cfg.budget) };
    let scores = rootScores(b, side, 1, { nodes: 0 }, R, moves);
    for (let d = 2; d <= (opts.depth || cfg.depth); d++) {
      try { scores = rootScores(b, side, d, ctl, R, scores.map((s) => s.m)); } catch (e) { if (e === ABORT) break; throw e; }
      if (scores[0].v >= WIN - 200 || scores[0].v <= -WIN + 200) break;
    }
    const top = scores[0].v;
    const pool = scores.filter((s) => s.v >= top - cfg.slack);
    const pick = pool[Math.floor(rnd() * pool.length)];
    return { m: pick.m, v: pick.v };
  }

  function key(b, side) { return `${side}|${b.join('')}`; }

  return { VARIANTS, initial, legalMoves, captureMoves, simpleMoves, apply, notation, squareNumber, count, evaluate, aiMove, isDark, sign, key, WIN };
}
window.Checkers = checkersEngine();
window.checkersEngine = checkersEngine;
