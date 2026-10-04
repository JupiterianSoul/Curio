(function (root) {
  const ALL = ['rock', 'paper', 'scissors', 'lizard', 'spock', 'well'];
  const BEATS = {
    rock: { scissors: 'crushes', lizard: 'crushes' },
    paper: { rock: 'covers', spock: 'disproves', well: 'covers' },
    scissors: { paper: 'cut', lizard: 'decapitate' },
    lizard: { spock: 'poisons', paper: 'eats' },
    spock: { scissors: 'smashes', rock: 'vaporizes' },
    well: { rock: 'swallows', scissors: 'swallows' }
  };
  const RULES = {
    classic: { id: 'classic', name: 'Classic', moves: ['rock', 'paper', 'scissors'] },
    well: { id: 'well', name: 'With the Well', moves: ['rock', 'paper', 'scissors', 'well'] },
    rpsls: { id: 'rpsls', name: 'Lizard Spock', moves: ['rock', 'paper', 'scissors', 'lizard', 'spock'] }
  };
  const outcomeNames = (a, b) => (a === b ? 0 : BEATS[a][b] ? 1 : -1);
  const verbNames = (a, b) => BEATS[a][b] || '';

  function makeRules(id) {
    const r = RULES[id] || RULES.classic;
    const moves = r.moves;
    const n = moves.length;
    const outcome = (a, b) => outcomeNames(moves[a], moves[b]);
    const verb = (a, b) => verbNames(moves[a], moves[b]);
    const beatersOf = (m) => moves.map((_, i) => i).filter((i) => outcome(i, m) > 0);
    return { ...r, n, outcome, verb, beatersOf };
  }

  function makeModels(n) {
    const table = () => new Map();
    const bump = (t, key, i) => { let row = t.get(key); if (!row) { row = Array(n).fill(0); t.set(key, row); } row[i]++; };
    const norm = (row) => { const tot = row ? row.reduce((a, b) => a + b, 0) : 0; return Array.from({ length: n }, (_, i) => (tot ? (row[i] + 0.25) / (tot + 0.25 * n) : 1 / n)); };
    const freq = Array(n).fill(0), m1 = table(), m2 = table(), m3 = table(), shift = table();
    return [
      { id: 'freq', name: 'Favourite-move counter', predict: () => norm(freq), learn: (h, move) => { freq[move]++; } },
      { id: 'm1', name: 'One-move memory', predict: (h) => (h.length >= 1 ? norm(m1.get(h[h.length - 1].you)) : norm(null)), learn: (h, move) => { if (h.length >= 1) bump(m1, h[h.length - 1].you, move); } },
      { id: 'm2', name: 'Two-move memory', predict: (h) => (h.length >= 2 ? norm(m2.get(`${h[h.length - 2].you},${h[h.length - 1].you}`)) : norm(null)), learn: (h, move) => { if (h.length >= 2) bump(m2, `${h[h.length - 2].you},${h[h.length - 1].you}`, move); } },
      { id: 'm3', name: 'Move and reply memory', predict: (h) => (h.length >= 1 ? norm(m3.get(`${h[h.length - 1].you}/${h[h.length - 1].ai}`)) : norm(null)), learn: (h, move) => { if (h.length >= 1) bump(m3, `${h[h.length - 1].you}/${h[h.length - 1].ai}`, move); } },
      {
        id: 'shift', name: 'Win-stay, lose-shift detector',
        predict: (h) => {
          if (!h.length) return norm(null);
          const last = h[h.length - 1];
          const s = norm(shift.get(last.result));
          return Array.from({ length: n }, (_, i) => s[(i - last.you + n) % n]);
        },
        learn: (h, move) => { if (h.length) { const last = h[h.length - 1]; bump(shift, last.result, (move - last.you + n) % n); } }
      }
    ];
  }

  function createMind(rules) {
    const n = rules.n;
    const models = makeModels(n);
    const skill = models.map(() => 1 / n);
    let last = null;
    function predict(history) {
      const preds = models.map((m) => m.predict(history));
      const w = skill.map((s) => Math.pow(Math.max(s, 0.01), 3));
      const tot = w.reduce((a, b) => a + b, 0);
      const dist = Array(n).fill(0);
      preds.forEach((p, k) => p.forEach((v, i) => { dist[i] += (v * w[k]) / tot; }));
      const bestModel = skill.indexOf(Math.max(...skill));
      last = { preds };
      return { dist, confidence: Math.max(...dist), guess: dist.indexOf(Math.max(...dist)), model: models[bestModel] };
    }
    function choose(history, rnd) {
      const p = predict(history);
      if (history.length < 2) return { move: Math.floor(rnd() * n), ...p };
      let best = -Infinity, moves = [];
      for (let a = 0; a < n; a++) {
        let ev = 0;
        for (let m = 0; m < n; m++) ev += p.dist[m] * rules.outcome(a, m);
        if (ev > best + 1e-9) { best = ev; moves = [a]; } else if (Math.abs(ev - best) < 1e-9) moves.push(a);
      }
      const move = p.confidence < 1 / n + 0.04 ? Math.floor(rnd() * n) : moves[Math.floor(rnd() * moves.length)];
      return { move, ...p };
    }
    function learn(history, you) {
      const preds = last ? last.preds : models.map((m) => m.predict(history));
      preds.forEach((p, k) => { skill[k] = skill[k] * 0.82 + p[you] * 0.18; });
      models.forEach((m) => m.learn(history, you));
      last = null;
    }
    return { choose, learn };
  }

  const PERSONAS = [
    { id: 'rocky', name: 'Rocky', tag: 'Rock fan', blurb: 'Big, solid, predictable. Maybe.', tell: 'Rocky throws rock about half the time. Paper is your friend.', glove: '#9e8c7a', face: '#c9b8a6', eye: 'dot' },
    { id: 'echo', name: 'Echo', tag: 'Copycat', blurb: 'Says it has its own ideas.', tell: 'Echo copies whatever you threw last round. Play what beats your own last move.', glove: '#64b5f6', face: '#bbdefb', eye: 'ring' },
    { id: 'cyclo', name: 'Cyclo', tag: 'Creature of habit', blurb: 'Loves a nice routine.', tell: 'Cyclo marches through the moves in order: rock, paper, scissors and round again.', glove: '#81c784', face: '#c8e6c9', eye: 'dot' },
    { id: 'sly', name: 'Sly', tag: 'Counter-puncher', blurb: 'Always fighting the last war.', tell: 'Sly throws whatever would have beaten your previous move. Stay one step ahead of it.', glove: '#ba68c8', face: '#e1bee7', eye: 'slit' },
    { id: 'bounce', name: 'Bounce', tag: 'Streaky', blurb: 'Rides a hot hand, sulks after a loss.', tell: 'Bounce repeats a winning throw, and after losing switches to whatever just beat it.', glove: '#ffb74d', face: '#ffe0b2', eye: 'ring' },
    { id: 'dice', name: 'Dice', tag: 'Pure chance', blurb: 'No plan, no tells, no mercy.', tell: 'Dice is genuinely random. Nobody can beat it in the long run, and it cannot beat you either.', glove: '#e57373', face: '#ffcdd2', eye: 'pip' },
    { id: 'mind', name: 'Mindreader', tag: 'Learns your habits', blurb: 'Watches. Learns. Counters.', tell: 'Mindreader runs five pattern detectors on your throws and trusts whichever has been right lately.', glove: '#546e7a', face: '#b0bec5', eye: 'visor' }
  ];

  function createPlayer(id, rules, rnd = Math.random) {
    const n = rules.n;
    const mind = id === 'mind' ? createMind(rules) : null;
    let cyc = Math.floor(rnd() * n);
    const randMove = () => Math.floor(rnd() * n);
    function choose(history) {
      const last = history[history.length - 1];
      let move;
      if (id === 'mind') return mind.choose(history, rnd);
      if (id === 'rocky') move = rnd() < 0.5 ? 0 : randMove();
      else if (id === 'echo') move = last && rnd() > 0.12 ? last.you : randMove();
      else if (id === 'cyclo') { move = rnd() < 0.1 ? randMove() : cyc; cyc = (cyc + 1) % n; }
      else if (id === 'sly') { if (last && rnd() > 0.12) { const b = rules.beatersOf(last.you); move = b[Math.floor(rnd() * b.length)]; } else move = randMove(); }
      else if (id === 'bounce') {
        if (!last || last.result === 0 || rnd() < 0.12) move = randMove();
        else if (last.result < 0) move = last.ai;
        else move = last.you;
      } else move = randMove();
      return { move };
    }
    function learn(history, you) { if (mind) mind.learn(history, you); }
    return { id, choose, learn };
  }

  function simulateBots(a, b, rules, target, rnd = Math.random) {
    const pa = createPlayer(a, rules, rnd), pb = createPlayer(b, rules, rnd);
    const ha = [], hb = [];
    let sa = 0, sb = 0, guard = 0;
    while (sa < target && sb < target && guard++ < 400) {
      const ma = pa.choose(ha).move, mb = pb.choose(hb).move;
      const r = rules.outcome(ma, mb);
      pa.learn(ha, mb); pb.learn(hb, ma);
      ha.push({ you: mb, ai: ma, result: -r }); hb.push({ you: ma, ai: mb, result: r });
      if (r > 0) sa++; else if (r < 0) sb++;
    }
    return { winner: sa >= sb ? a : b, score: [sa, sb] };
  }

  const api = { ALL, BEATS, RULES, PERSONAS, makeRules, createPlayer, createMind, simulateBots, outcomeNames, verbNames };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.RPS = api;
})(typeof window !== 'undefined' ? window : globalThis);
