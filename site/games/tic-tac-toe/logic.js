(function (root) {
  const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  const LINES4 = (() => {
    const L = [];
    for (let r = 0; r < 4; r++) L.push([0, 1, 2, 3].map((c) => r * 4 + c));
    for (let c = 0; c < 4; c++) L.push([0, 1, 2, 3].map((r) => r * 4 + c));
    L.push([0, 5, 10, 15], [3, 6, 9, 12]);
    return L;
  })();

  const other = (p) => (p === 'X' ? 'O' : 'X');
  const empties = (b) => b.reduce((acc, v, i) => (v ? acc : acc.concat(i)), []);
  const rnd = (arr, r = Math.random) => arr[Math.floor(r() * arr.length)];

  function lineResult(b, lines) {
    for (const line of lines) {
      const v = b[line[0]];
      if (v && line.every((i) => b[i] === v)) return { winner: v, line };
    }
    return b.every(Boolean) ? { winner: 'draw' } : null;
  }

  function result(b, misere = false) {
    const r = lineResult(b, b.length === 16 ? LINES4 : LINES);
    if (r && misere && r.winner !== 'draw') return { winner: other(r.winner), line: r.line, loser: r.winner };
    return r;
  }

  const memo = new Map();
  function value(b, turn, misere) {
    const key = b.map((v) => v || '-').join('') + turn + (misere ? 'm' : '');
    if (memo.has(key)) return memo.get(key);
    const r = result(b, misere);
    let best;
    if (r) best = r.winner === 'draw' ? 0 : (r.winner === turn ? 10 : -10);
    else {
      best = -Infinity;
      for (const i of empties(b)) {
        b[i] = turn;
        let v = -value(b, other(turn), misere);
        b[i] = null;
        v -= Math.sign(v);
        if (v > best) best = v;
      }
    }
    memo.set(key, best);
    return best;
  }

  function bestMoves(b, me, misere = false) {
    const board = b.slice();
    let top = -Infinity, moves = [];
    for (const i of empties(board)) {
      board[i] = me;
      const s = -value(board, other(me), misere);
      board[i] = null;
      if (s > top) { top = s; moves = [i]; } else if (s === top) moves.push(i);
    }
    return { moves, score: top };
  }

  function winningMove(b, p, misere = false) {
    for (const i of empties(b)) {
      const t = b.slice(); t[i] = p;
      if (result(t, misere)?.winner === p) return i;
    }
    return -1;
  }

  function safeMoves(b, p) {
    return empties(b).filter((i) => { const t = b.slice(); t[i] = p; return !lineResult(t, LINES)?.line; });
  }

  function aiMove(b, me, level, r = Math.random, misere = false) {
    const free = empties(b);
    if (!free.length) return -1;
    if (misere) {
      if (level === 'easy') { const s = safeMoves(b, me); return rnd(s.length && r() < 0.6 ? s : free, r); }
      if (level === 'medium' && r() < 0.4) { const s = safeMoves(b, me); return rnd(s.length ? s : free, r); }
      return rnd(bestMoves(b, me, true).moves, r);
    }
    if (level === 'easy') {
      const w = winningMove(b, me);
      return w >= 0 && r() < 0.5 ? w : rnd(free, r);
    }
    if (level === 'medium') {
      const w = winningMove(b, me); if (w >= 0) return w;
      const block = winningMove(b, other(me)); if (block >= 0 && r() < 0.85) return block;
      if (r() < 0.45) return rnd(bestMoves(b, me).moves, r);
      if (b[4] == null && r() < 0.5) return 4;
      return rnd(free, r);
    }
    return rnd(bestMoves(b, me).moves, r);
  }

  function eval4(b, me) {
    const op = other(me);
    let s = 0;
    for (const line of LINES4) {
      let m = 0, o = 0;
      for (const i of line) { if (b[i] === me) m++; else if (b[i] === op) o++; }
      if (m && o) continue;
      if (m) s += [0, 1, 8, 60, 10000][m];
      if (o) s -= [0, 1, 8, 60, 10000][o];
    }
    return s;
  }

  function aiMove4(b, me, level, r = Math.random) {
    const free = empties(b);
    if (!free.length) return -1;
    const win = (p) => { for (const i of free) { const t = b.slice(); t[i] = p; if (lineResult(t, LINES4)?.line) return i; } return -1; };
    const w = win(me); if (w >= 0 && (level !== 'easy' || r() < 0.6)) return w;
    const bl = win(other(me)); if (bl >= 0 && (level === 'hard' || r() < (level === 'medium' ? 0.9 : 0.4))) return bl;
    if (level === 'easy') return rnd(free, r);
    const depth = level === 'hard' ? 6 : 2;
    const deadline = Date.now() + (level === 'hard' ? 450 : 60);
    const tt = new Map();
    function neg(bd, turn, d, a, be) {
      const res = lineResult(bd, LINES4);
      if (res) return res.winner === 'draw' ? 0 : (res.winner === turn ? 100000 + d : -100000 - d);
      if (d === 0 || Date.now() > deadline) return eval4(bd, turn);
      const key = bd.map((v) => v || '-').join('') + turn + d;
      if (tt.has(key)) return tt.get(key);
      let best = -Infinity;
      const moves = empties(bd).sort((x, y) => (CENTER4[y] - CENTER4[x]));
      for (const i of moves) {
        bd[i] = turn;
        const v = -neg(bd, other(turn), d - 1, -be, -a);
        bd[i] = null;
        if (v > best) best = v;
        if (v > a) a = v;
        if (a >= be) break;
      }
      tt.set(key, best);
      return best;
    }
    let top = -Infinity, moves = [];
    const bd = b.slice();
    for (const i of free) {
      bd[i] = me;
      let v = -neg(bd, other(me), depth - 1, -Infinity, Infinity);
      bd[i] = null;
      if (level === 'medium') v += (r() - 0.5) * 30;
      if (v > top) { top = v; moves = [i]; } else if (v === top) moves.push(i);
    }
    return rnd(moves, r);
  }
  const CENTER4 = [0, 1, 1, 0, 1, 3, 3, 1, 1, 3, 3, 1, 0, 1, 1, 0];

  const U = {
    fresh() { return { cells: new Array(81).fill(0), small: new Array(9).fill(0), next: -1, turn: 1, winner: 0, last: -1 }; },
    clone(s) { return { cells: s.cells.slice(), small: s.small.slice(), next: s.next, turn: s.turn, winner: s.winner, last: s.last }; },
    moves(s) {
      if (s.winner) return [];
      const out = [];
      for (let bi = 0; bi < 9; bi++) {
        if (s.small[bi]) continue;
        if (s.next >= 0 && s.next !== bi) continue;
        for (let k = 0; k < 9; k++) if (!s.cells[bi * 9 + k]) out.push(bi * 9 + k);
      }
      return out;
    },
    smallWin(cells, bi) {
      for (const [a, b, c] of LINES) {
        const v = cells[bi * 9 + a];
        if (v && v === cells[bi * 9 + b] && v === cells[bi * 9 + c]) return v;
      }
      for (let k = 0; k < 9; k++) if (!cells[bi * 9 + k]) return 0;
      return 3;
    },
    bigLine(small) {
      for (const line of LINES) {
        const v = small[line[0]];
        if ((v === 1 || v === 2) && small[line[1]] === v && small[line[2]] === v) return { v, line };
      }
      return null;
    },
    play(s, m) {
      const bi = Math.floor(m / 9), k = m % 9;
      s.cells[m] = s.turn; s.last = m;
      const w = U.smallWin(s.cells, bi);
      if (w) s.small[bi] = w;
      const big = U.bigLine(s.small);
      if (big) s.winner = big.v;
      else if (s.small.every(Boolean)) s.winner = 3;
      s.next = s.small[k] ? -1 : k;
      s.turn = 3 - s.turn;
      return s;
    },
    quickWin(s) {
      for (const m of U.moves(s)) {
        const t = U.play(U.clone(s), m);
        if (t.winner === s.turn) return m;
      }
      return -1;
    },
    playout(s, r) {
      let n = 0;
      while (!s.winner && n++ < 90) {
        const ms = U.moves(s);
        if (!ms.length) { s.winner = 3; break; }
        let m = -1;
        if (r() < 0.5) {
          for (const c of ms) {
            const bi = Math.floor(c / 9), k = c % 9;
            s.cells[c] = s.turn;
            const w = U.smallWin(s.cells, bi);
            s.cells[c] = 0;
            if (w === s.turn) { m = c; break; }
          }
        }
        if (m < 0) m = ms[Math.floor(r() * ms.length)];
        U.play(s, m);
      }
      return s.winner;
    }
  };

  function mcts(state, budgetMs, r = Math.random, onDone) {
    const me = state.turn;
    const rootNode = { m: -1, n: 0, w: 0, kids: null, untried: U.moves(state), parent: null, who: 3 - state.turn };
    const end = Date.now() + budgetMs;
    function iterate() {
      const sliceEnd = Math.min(end, Date.now() + 24);
      while (Date.now() < sliceEnd) {
        let node = rootNode;
        const s = U.clone(state);
        while (!node.untried.length && node.kids && node.kids.length) {
          let best = null, bv = -Infinity;
          const ln = Math.log(node.n);
          for (const c of node.kids) {
            const v = c.w / c.n + 1.2 * Math.sqrt(ln / c.n);
            if (v > bv) { bv = v; best = c; }
          }
          node = best; U.play(s, node.m);
        }
        if (node.untried.length) {
          const idx = Math.floor(r() * node.untried.length);
          const m = node.untried.splice(idx, 1)[0];
          const who = s.turn;
          U.play(s, m);
          const child = { m, n: 0, w: 0, kids: null, untried: U.moves(s), parent: node, who };
          (node.kids ||= []).push(child);
          node = child;
        }
        const winner = U.playout(s, r);
        while (node) {
          node.n++;
          if (winner === node.who) node.w += 1; else if (winner === 3) node.w += 0.5;
          node = node.parent;
        }
      }
      if (Date.now() < end) setTimeout(iterate, 0);
      else {
        let best = null;
        for (const c of rootNode.kids || []) if (!best || c.n > best.n) best = c;
        onDone(best ? best.m : rnd(U.moves(state), r), rootNode.n, me);
      }
    }
    iterate();
  }

  function aiMoveUltimate(state, level, r = Math.random, onDone) {
    const ms = U.moves(state);
    if (!ms.length) return onDone(-1);
    const qw = U.quickWin(state);
    if (qw >= 0 && level !== 'easy') return setTimeout(() => onDone(qw), 0);
    if (level === 'easy') {
      const greedy = ms.filter((c) => { const s = U.clone(state); s.cells[c] = s.turn; return U.smallWin(s.cells, Math.floor(c / 9)) === state.turn; });
      return setTimeout(() => onDone(greedy.length && r() < 0.5 ? rnd(greedy, r) : rnd(ms, r)), 0);
    }
    mcts(state, level === 'hard' ? 1100 : 280, r, (m) => onDone(m));
  }

  const api = { LINES, LINES4, result, lineResult, empties, other, bestMoves, winningMove, aiMove, aiMove4, U, mcts, aiMoveUltimate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TTT = api;
})(typeof window !== 'undefined' ? window : globalThis);
