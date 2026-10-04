(function (root) {
  function create(R, C) {
    const H = (R + 1) * C, V = R * (C + 1);
    const g = { R, C, H, n: H + V, lines: new Uint8Array(H + V), boxes: new Uint8Array(R * C), boxLines: [], lineBoxes: [] };
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) g.boxLines.push([r * C + c, (r + 1) * C + c, H + r * (C + 1) + c, H + r * (C + 1) + c + 1]);
    for (let l = 0; l < g.n; l++) {
      const out = [];
      if (l < H) { const r = Math.floor(l / C), c = l % C; if (r > 0) out.push((r - 1) * C + c); if (r < R) out.push(r * C + c); }
      else { const k = l - H, r = Math.floor(k / (C + 1)), c = k % (C + 1); if (c > 0) out.push(r * C + c - 1); if (c < C) out.push(r * C + c); }
      g.lineBoxes.push(out);
    }
    return g;
  }

  const clone = (g) => ({ ...g, lines: g.lines.slice(), boxes: g.boxes.slice() });
  const sides = (g, b) => g.boxLines[b].reduce((n, l) => n + (g.lines[l] ? 1 : 0), 0);
  const open = (g) => { const out = []; for (let l = 0; l < g.n; l++) if (!g.lines[l]) out.push(l); return out; };

  function apply(g, l, p) {
    g.lines[l] = p;
    const done = [];
    for (const b of g.lineBoxes[l]) if (!g.boxes[b] && sides(g, b) === 4) { g.boxes[b] = p; done.push(b); }
    return done;
  }

  const isSafe = (g, l) => !g.lines[l] && g.lineBoxes[l].every((b) => sides(g, b) < 2);
  const capturing = (g, l) => !g.lines[l] && g.lineBoxes[l].some((b) => sides(g, b) === 3);

  function greedyTake(g, p) {
    let total = 0;
    for (;;) {
      let found = -1;
      for (let l = 0; l < g.n && found < 0; l++) if (capturing(g, l)) found = l;
      if (found < 0) return total;
      total += apply(g, found, p).length;
    }
  }

  function structures(g) {
    const seen = new Set(), out = [];
    for (let b = 0; b < g.boxes.length; b++) {
      if (g.boxes[b] || seen.has(b)) continue;
      const stack = [b], comp = [];
      let edges = 0, ends = 0;
      seen.add(b);
      while (stack.length) {
        const x = stack.pop();
        comp.push(x);
        for (const l of g.boxLines[x]) {
          if (g.lines[l]) continue;
          const other = g.lineBoxes[l].find((y) => y !== x);
          if (other == null || g.boxes[other]) { ends++; continue; }
          edges++;
          if (!seen.has(other)) { seen.add(other); stack.push(other); }
        }
      }
      out.push({ size: comp.length, loop: ends === 0 && edges / 2 >= comp.length && comp.length >= 4 });
    }
    return out;
  }

  function controlValue(structs) {
    if (!structs.length) return 0;
    const sorted = structs.slice().sort((a, b) => a.size - b.size);
    let v = 0;
    sorted.forEach((s, k) => {
      const lastOne = k === sorted.length - 1;
      if (lastOne) v += s.size;
      else if (s.loop) v += s.size - 8;
      else if (s.size >= 3) v += s.size - 4;
      else v -= s.size;
    });
    return v;
  }

  function chainFrom(g, l) {
    const start = g.lineBoxes[l].find((b) => sides(g, b) === 3);
    const path = [start];
    let prevLine = l, cur = start;
    for (;;) {
      const next = g.boxLines[cur].find((x) => !g.lines[x] && x !== prevLine);
      if (next == null) break;
      const nb = g.lineBoxes[next].find((b) => b !== cur);
      if (nb == null || g.boxes[nb] || sides(g, nb) !== 2 || path.includes(nb)) { path.farLine = next; break; }
      path.push(nb);
      prevLine = next; cur = nb;
    }
    return path;
  }

  function choose(g, p, level, rand = Math.random) {
    const lines = open(g);
    if (!lines.length) return -1;
    const pick = (arr) => arr[Math.floor(rand() * arr.length)];
    const caps = lines.filter((l) => capturing(g, l));
    const safe = lines.filter((l) => isSafe(g, l));
    if (level === 'easy') {
      if (caps.length && rand() < 0.9) return pick(caps);
      if (safe.length && rand() < 0.85) return pick(safe);
      return pick(lines);
    }
    if (caps.length) {
      if (safe.length || level === 'medium') return caps[0];
      const l = caps[0];
      const chain = chainFrom(g, l);
      if (chain.length === 2 && chain.farLine != null && !g.lines[chain.farLine]) {
        const t = clone(g);
        for (const b of chain) t.boxes[b] = 9;
        const rest = structures(t);
        if (rest.length && controlValue(rest) > 2) {
          const a = chain[0], b = chain[1];
          const shared = g.boxLines[a].find((x) => !g.lines[x] && g.boxLines[b].includes(x));
          const far = g.boxLines[b].find((x) => !g.lines[x] && x !== shared);
          if (far != null && !g.lineBoxes[far].some((x) => x !== b && !g.boxes[x] && sides(g, x) === 3)) return far;
        }
      }
      return l;
    }
    if (safe.length) {
      const scored = safe.map((l) => ({ l, s: rand() }));
      scored.sort((a, b) => a.s - b.s);
      return scored[0].l;
    }
    let best = [], bestGive = Infinity;
    for (const l of lines) {
      const t = clone(g);
      apply(t, l, p);
      const give = greedyTake(t, 3 - p);
      if (give < bestGive) { bestGive = give; best = [l]; }
      else if (give === bestGive) best.push(l);
    }
    return pick(best);
  }

  function score(g, players = 2) {
    const out = new Array(players).fill(0);
    for (const v of g.boxes) if (v >= 1 && v <= players) out[v - 1]++;
    return out;
  }

  root.DotsBoxes = { create, clone, apply, sides, open, isSafe, capturing, choose, score, structures };
})(typeof window !== 'undefined' ? window : globalThis);
