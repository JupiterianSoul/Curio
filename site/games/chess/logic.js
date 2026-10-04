function chessEngine() {
  const P = 1, N = 2, B = 3, R = 4, Q = 5, K = 6;
  const NDIR = [33, 31, 18, 14, -33, -31, -18, -14];
  const BDIR = [17, 15, -17, -15];
  const RDIR = [16, 1, -16, -1];
  const KDIR = [17, 15, -17, -15, 16, 1, -16, -1];
  const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const LETTERS = ' PNBRQK';
  const CR = new Array(128).fill(15);
  CR[0] = 13; CR[7] = 14; CR[4] = 12; CR[112] = 7; CR[119] = 11; CR[116] = 3;

  const name = (sq) => 'abcdefgh'[sq & 7] + ((sq >> 4) + 1);
  const sqFromName = (s) => (s.charCodeAt(1) - 49) * 16 + (s.charCodeAt(0) - 97);

  function fromFEN(fen) {
    const [pl, side, cas = '-', ep = '-', hm = '0', fm = '1'] = fen.trim().split(/\s+/);
    const b = new Int8Array(128);
    let rank = 7, file = 0;
    for (const ch of pl) {
      if (ch === '/') { rank--; file = 0; }
      else if (ch >= '1' && ch <= '8') file += +ch;
      else {
        const t = 'pnbrqk'.indexOf(ch.toLowerCase()) + 1;
        b[rank * 16 + file] = ch === ch.toLowerCase() ? -t : t;
        file++;
      }
    }
    const s = { b, turn: side === 'b' ? -1 : 1, castle: 0, ep: -1, half: +hm || 0, full: +fm || 1, kings: [0, 0], hist: [] };
    for (const c of cas) s.castle |= { K: 1, Q: 2, k: 4, q: 8 }[c] || 0;
    if (ep !== '-') s.ep = sqFromName(ep);
    for (let i = 0; i < 128; i++) if (!(i & 0x88)) { if (b[i] === K) s.kings[0] = i; if (b[i] === -K) s.kings[1] = i; }
    return s;
  }

  function placement(b) {
    let out = '';
    for (let r = 7; r >= 0; r--) {
      let empty = 0;
      for (let f = 0; f < 8; f++) {
        const p = b[r * 16 + f];
        if (!p) { empty++; continue; }
        if (empty) { out += empty; empty = 0; }
        const l = 'pnbrqk'[Math.abs(p) - 1];
        out += p > 0 ? l.toUpperCase() : l;
      }
      if (empty) out += empty;
      if (r) out += '/';
    }
    return out;
  }

  function castleStr(c) {
    const s = (c & 1 ? 'K' : '') + (c & 2 ? 'Q' : '') + (c & 4 ? 'k' : '') + (c & 8 ? 'q' : '');
    return s || '-';
  }

  function toFEN(s) {
    return `${placement(s.b)} ${s.turn > 0 ? 'w' : 'b'} ${castleStr(s.castle)} ${s.ep >= 0 ? name(s.ep) : '-'} ${s.half} ${s.full}`;
  }

  function clone(s) {
    return { b: s.b.slice(), turn: s.turn, castle: s.castle, ep: s.ep, half: s.half, full: s.full, kings: s.kings.slice(), hist: [] };
  }

  function attacked(b, sq, by) {
    for (const d of [15, 17]) { const f = by > 0 ? sq - d : sq + d; if (!(f & 0x88) && b[f] === by * P) return true; }
    for (const d of NDIR) { const f = sq + d; if (!(f & 0x88) && b[f] === by * N) return true; }
    for (const d of KDIR) { const f = sq + d; if (!(f & 0x88) && b[f] === by * K) return true; }
    for (const d of BDIR) {
      let f = sq + d;
      while (!(f & 0x88)) { const p = b[f]; if (p) { if (p === by * B || p === by * Q) return true; break; } f += d; }
    }
    for (const d of RDIR) {
      let f = sq + d;
      while (!(f & 0x88)) { const p = b[f]; if (p) { if (p === by * R || p === by * Q) return true; break; } f += d; }
    }
    return false;
  }

  const mv = (f, t, p, c, pr, fl) => ({ f, t, p, c, pr, fl });

  function gen(s, capsOnly) {
    const b = s.b, us = s.turn, out = [];
    for (let f = 0; f < 120; f++) {
      if (f & 0x88) { f += 7; continue; }
      const p = b[f];
      if (!p || (p > 0) !== (us > 0)) continue;
      const t = p * us;
      if (t === P) {
        const fwd = 16 * us, r = f >> 4, promoRank = us > 0 ? 6 : 1, startRank = us > 0 ? 1 : 6;
        const to = f + fwd;
        if (!b[to]) {
          if (r === promoRank) for (const pr of [Q, N, R, B]) out.push(mv(f, to, p, 0, pr * us, 0));
          else if (!capsOnly) {
            out.push(mv(f, to, p, 0, 0, 0));
            if (r === startRank && !b[to + fwd]) out.push(mv(f, to + fwd, p, 0, 0, 1));
          }
        }
        for (const d of [fwd - 1, fwd + 1]) {
          const x = f + d;
          if (x & 0x88) continue;
          const c = b[x];
          if (c && (c > 0) !== (us > 0)) {
            if (r === promoRank) for (const pr of [Q, N, R, B]) out.push(mv(f, x, p, c, pr * us, 0));
            else out.push(mv(f, x, p, c, 0, 0));
          } else if (x === s.ep && !c) out.push(mv(f, x, p, -us * P, 0, 2));
        }
      } else if (t === N || t === K) {
        for (const d of t === N ? NDIR : KDIR) {
          const x = f + d;
          if (x & 0x88) continue;
          const c = b[x];
          if (!c) { if (!capsOnly) out.push(mv(f, x, p, 0, 0, 0)); }
          else if ((c > 0) !== (us > 0)) out.push(mv(f, x, p, c, 0, 0));
        }
        if (t === K && !capsOnly) {
          const home = us > 0 ? 4 : 116, kb = us > 0 ? 1 : 4, qb = us > 0 ? 2 : 8;
          if (f === home && !attacked(b, f, -us)) {
            if ((s.castle & kb) && !b[f + 1] && !b[f + 2] && b[f + 3] === R * us && !attacked(b, f + 1, -us) && !attacked(b, f + 2, -us)) out.push(mv(f, f + 2, p, 0, 0, 3));
            if ((s.castle & qb) && !b[f - 1] && !b[f - 2] && !b[f - 3] && b[f - 4] === R * us && !attacked(b, f - 1, -us) && !attacked(b, f - 2, -us)) out.push(mv(f, f - 2, p, 0, 0, 3));
          }
        }
      } else {
        const dirs = t === B ? BDIR : t === R ? RDIR : KDIR;
        for (const d of dirs) {
          let x = f + d;
          while (!(x & 0x88)) {
            const c = b[x];
            if (!c) { if (!capsOnly) out.push(mv(f, x, p, 0, 0, 0)); }
            else { if ((c > 0) !== (us > 0)) out.push(mv(f, x, p, c, 0, 0)); break; }
            x += d;
          }
        }
      }
    }
    return out;
  }

  function make(s, m) {
    const b = s.b;
    s.hist.push(m, s.castle, s.ep, s.half);
    b[m.t] = m.pr || m.p; b[m.f] = 0;
    if (m.fl === 2) b[m.t - 16 * s.turn] = 0;
    else if (m.fl === 3) {
      if (m.t === m.f + 2) { b[m.f + 1] = b[m.f + 3]; b[m.f + 3] = 0; }
      else { b[m.f - 1] = b[m.f - 4]; b[m.f - 4] = 0; }
    }
    if (m.p === K || m.p === -K) s.kings[s.turn > 0 ? 0 : 1] = m.t;
    s.castle &= CR[m.f] & CR[m.t];
    s.ep = m.fl === 1 ? (m.f + m.t) >> 1 : -1;
    s.half = (m.p === P || m.p === -P || m.c) ? 0 : s.half + 1;
    if (s.turn < 0) s.full++;
    s.turn = -s.turn;
  }

  function unmake(s) {
    const h = s.hist;
    const half = h.pop(), ep = h.pop(), castle = h.pop(), m = h.pop();
    s.turn = -s.turn;
    if (s.turn < 0) s.full--;
    const b = s.b;
    b[m.f] = m.p;
    if (m.fl === 2) { b[m.t] = 0; b[m.t - 16 * s.turn] = m.c; }
    else b[m.t] = m.c;
    if (m.fl === 3) {
      if (m.t === m.f + 2) { b[m.f + 3] = b[m.f + 1]; b[m.f + 1] = 0; }
      else { b[m.f - 4] = b[m.f - 1]; b[m.f - 1] = 0; }
    }
    if (m.p === K || m.p === -K) s.kings[s.turn > 0 ? 0 : 1] = m.f;
    s.castle = castle; s.ep = ep; s.half = half;
  }

  const kingSq = (s, c) => s.kings[c > 0 ? 0 : 1];
  const inCheck = (s) => attacked(s.b, kingSq(s, s.turn), -s.turn);

  function legal(s) {
    const us = s.turn, out = [];
    for (const m of gen(s, false)) {
      make(s, m);
      if (!attacked(s.b, kingSq(s, us), -us)) out.push(m);
      unmake(s);
    }
    return out;
  }

  function perft(s, d) {
    if (d === 0) return 1;
    const us = s.turn;
    let n = 0;
    for (const m of gen(s, false)) {
      make(s, m);
      if (!attacked(s.b, kingSq(s, us), -us)) n += d === 1 ? 1 : perft(s, d - 1);
      unmake(s);
    }
    return n;
  }

  function san(s, m, moves) {
    let out;
    if (m.fl === 3) out = m.t > m.f ? 'O-O' : 'O-O-O';
    else {
      const t = Math.abs(m.p);
      const cap = m.c ? 'x' : '';
      if (t === P) out = (cap ? 'abcdefgh'[m.f & 7] + 'x' : '') + name(m.t) + (m.pr ? '=' + LETTERS[Math.abs(m.pr)] : '');
      else {
        const rivals = moves.filter((o) => o.p === m.p && o.t === m.t && o.f !== m.f);
        let dis = '';
        if (rivals.length) {
          if (!rivals.some((o) => (o.f & 7) === (m.f & 7))) dis = 'abcdefgh'[m.f & 7];
          else if (!rivals.some((o) => (o.f >> 4) === (m.f >> 4))) dis = String((m.f >> 4) + 1);
          else dis = name(m.f);
        }
        out = LETTERS[t] + dis + cap + name(m.t);
      }
    }
    make(s, m);
    if (inCheck(s)) out += legal(s).length ? '+' : '#';
    unmake(s);
    return out;
  }

  function positionKey(s) {
    let ep = '-';
    if (s.ep >= 0) {
      const pawn = s.turn * P, from = s.ep - 16 * s.turn;
      for (const d of [-1, 1]) { const x = from + d; if (!(x & 0x88) && s.b[x] === pawn) ep = name(s.ep); }
    }
    return `${placement(s.b)} ${s.turn} ${s.castle} ${ep}`;
  }

  function insufficient(s) {
    const minors = [];
    for (let i = 0; i < 120; i++) {
      if (i & 0x88) { i += 7; continue; }
      const p = Math.abs(s.b[i]);
      if (!p || p === K) continue;
      if (p === P || p === R || p === Q) return false;
      minors.push({ p, c: ((i >> 4) + (i & 7)) & 1 });
    }
    if (minors.length <= 1) return true;
    return minors.every((x) => x.p === B) && minors.every((x) => x.c === minors[0].c);
  }

  const VAL = [0, 100, 320, 330, 500, 900, 20000];
  const PST = [
    [],
    [0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0],
    [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50],
    [-20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20],
    [0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0],
    [-20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20],
    [-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20]
  ];
  const KING_END = [-50, -40, -30, -20, -20, -30, -40, -50, -30, -20, -10, 0, 0, -10, -20, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -30, 0, 0, 0, 0, -30, -30, -50, -30, -30, -30, -30, -30, -30, -50];

  function evaluate(s) {
    const b = s.b;
    let score = 0, heavy = 0;
    for (let i = 0; i < 120; i++) {
      if (i & 0x88) { i += 7; continue; }
      const p = b[i];
      if (p && p !== K && p !== -K && p !== P && p !== -P) heavy += VAL[Math.abs(p)];
    }
    const endgame = heavy <= 1700;
    for (let i = 0; i < 120; i++) {
      if (i & 0x88) { i += 7; continue; }
      const p = b[i];
      if (!p) continue;
      const t = p > 0 ? p : -p, r = i >> 4, f = i & 7;
      const idx = p > 0 ? (7 - r) * 8 + f : r * 8 + f;
      const tbl = t === K && endgame ? KING_END : PST[t];
      const v = VAL[t] + tbl[idx];
      score += p > 0 ? v : -v;
    }
    return score * s.turn;
  }

  const MATE = 100000;
  const ABORT = {};

  function order(moves, best, killers) {
    for (const m of moves) {
      let k = 0;
      if (best && m.f === best.f && m.t === best.t && m.pr === best.pr) k = 1e6;
      else if (m.c) k = 1e4 + VAL[Math.abs(m.c)] * 10 - VAL[Math.abs(m.p)] / 10;
      else if (m.pr) k = 9000;
      else if (killers && killers.some((x) => x && x.f === m.f && x.t === m.t)) k = 5000;
      m.k = k;
    }
    moves.sort((a, b) => b.k - a.k);
    return moves;
  }

  function search(s, opts) {
    const ctl = { nodes: 0, deadline: Date.now() + (opts.time || 1000), killers: [] };
    const maxDepth = opts.depth || 4;
    const noise = opts.noise || 0;
    const rootMoves = legal(s);
    if (!rootMoves.length) return null;
    if (rootMoves.length === 1) return { move: rootMoves[0], score: 0, depth: 0 };
    const jitter = new Map(rootMoves.map((m) => [m, noise ? Math.random() * noise : 0]));

    function quiesce(alpha, beta, ply) {
      if ((++ctl.nodes & 2047) === 0 && Date.now() > ctl.deadline) throw ABORT;
      const stand = evaluate(s);
      if (stand >= beta) return beta;
      if (stand > alpha) alpha = stand;
      if (ply > 30) return alpha;
      const us = s.turn;
      for (const m of order(gen(s, true), null, null)) {
        make(s, m);
        if (attacked(s.b, kingSq(s, us), -us)) { unmake(s); continue; }
        const v = -quiesce(-beta, -alpha, ply + 1);
        unmake(s);
        if (v >= beta) return beta;
        if (v > alpha) alpha = v;
      }
      return alpha;
    }

    function negamax(depth, alpha, beta, ply) {
      if ((++ctl.nodes & 2047) === 0 && Date.now() > ctl.deadline) throw ABORT;
      if (s.half >= 100) return 0;
      const check = inCheck(s);
      if (check) depth++;
      if (depth <= 0) return quiesce(alpha, beta, ply);
      const us = s.turn;
      const killers = ctl.killers[ply] || (ctl.killers[ply] = [null, null]);
      let any = false;
      for (const m of order(gen(s, false), null, killers)) {
        make(s, m);
        if (attacked(s.b, kingSq(s, us), -us)) { unmake(s); continue; }
        any = true;
        const v = -negamax(depth - 1, -beta, -alpha, ply + 1);
        unmake(s);
        if (v >= beta) {
          if (!m.c) { killers[1] = killers[0]; killers[0] = m; }
          return beta;
        }
        if (v > alpha) alpha = v;
      }
      if (!any) return check ? -MATE + ply : 0;
      return alpha;
    }

    let best = null, bestScore = 0, reached = 0;
    for (let depth = 1; depth <= maxDepth; depth++) {
      try {
        let alpha = -Infinity, iterBest = null;
        order(rootMoves, best, null);
        for (const m of rootMoves) {
          make(s, m);
          let v = -negamax(depth - 1, -MATE - 1, -(alpha === -Infinity ? -MATE - 1 : alpha - noise), 1);
          unmake(s);
          v += jitter.get(m);
          if (v > alpha) { alpha = v; iterBest = m; }
        }
        best = iterBest; bestScore = alpha; reached = depth;
        if (Math.abs(bestScore) > MATE - 1000) break;
      } catch (e) {
        if (e !== ABORT) throw e;
        while (s.hist.length) unmake(s);
        break;
      }
      if (Date.now() > ctl.deadline - (opts.time || 1000) * 0.45 && depth >= (opts.minDepth || 1)) break;
    }
    if (!best) best = rootMoves[0];
    return { move: best, score: bestScore, depth: reached, nodes: ctl.nodes };
  }

  const LEVELS = {
    easy: { depth: 2, time: 400, noise: 140 },
    medium: { depth: 4, time: 800, noise: 20 },
    hard: { depth: 8, time: 2200, noise: 0, minDepth: 4 },
    eval: { depth: 6, time: 450, noise: 0, minDepth: 3 },
    hint: { depth: 8, time: 1300, noise: 0, minDepth: 4 }
  };

  function think(fen, level) {
    const s = fromFEN(fen);
    const r = search(s, LEVELS[level] || LEVELS.medium);
    return r && { f: r.move.f, t: r.move.t, pr: r.move.pr, depth: r.depth, score: r.score, nodes: r.nodes };
  }

  return { START, fromFEN, toFEN, clone, legal, make, unmake, inCheck, perft, san, positionKey, insufficient, name, think, evaluate, P, N, B, R, Q, K };
}

if (typeof module !== 'undefined' && module.exports) module.exports = chessEngine;
if (typeof window !== 'undefined') window.ChessEngine = chessEngine();
