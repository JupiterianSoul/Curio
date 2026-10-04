(function (root) {
  const TAU = Math.PI * 2, R3 = Math.sqrt(3);
  function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  function square(W, H) {
    const cells = [];
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) cells.push({ x: c + 0.5, y: r + 0.5, edges: [] });
    const id = (c, r) => (c < 0 || r < 0 || c >= W || r >= H ? -1 : r * W + c);
    cells.forEach((cell, i) => {
      const c = i % W, r = Math.floor(i / W);
      cell.edges.push({ nb: id(c, r - 1), g: ['l', c, r, c + 1, r] });
      cell.edges.push({ nb: id(c + 1, r), g: ['l', c + 1, r, c + 1, r + 1] });
      cell.edges.push({ nb: id(c, r + 1), g: ['l', c, r + 1, c + 1, r + 1] });
      cell.edges.push({ nb: id(c - 1, r), g: ['l', c, r, c, r + 1] });
      cell.edges.forEach((e) => { e.own = e.nb < 0 || i < e.nb; });
    });
    return { kind: 'square', cells, w: W, h: H, start: 0, exit: W * H - 1, unit: 1 };
  }

  function hex(W, H) {
    const cells = [], map = new Map();
    const key = (x, y) => `${Math.round(x * 100)},${Math.round(y * 100)}`;
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
      const x = R3 * (c + 0.5 * (r & 1)) + R3 / 2, y = 1.5 * r + 1;
      map.set(key(x, y), cells.length);
      cells.push({ x, y, edges: [] });
    }
    cells.forEach((cell, i) => {
      for (let k = 0; k < 6; k++) {
        const a = k * Math.PI / 3, nx = cell.x + Math.cos(a) * R3, ny = cell.y + Math.sin(a) * R3;
        const nb = map.has(key(nx, ny)) ? map.get(key(nx, ny)) : -1;
        const a0 = a - Math.PI / 6, a1 = a + Math.PI / 6;
        cell.edges.push({ nb, own: nb < 0 || i < nb, g: ['l', cell.x + Math.cos(a0), cell.y + Math.sin(a0), cell.x + Math.cos(a1), cell.y + Math.sin(a1)] });
      }
    });
    return { kind: 'hex', cells, w: R3 * (W + 0.5), h: 1.5 * H + 0.5, start: 0, exit: cells.length - 1, unit: R3 };
  }

  function circle(rings) {
    const counts = [1, 6];
    for (let i = 2; i < rings; i++) { const prev = counts[i - 1]; counts.push(TAU * i / prev > 1.9 ? prev * 2 : prev); }
    const base = [0]; for (let i = 1; i < rings; i++) base.push(base[i - 1] + counts[i - 1]);
    const cells = [{ x: 0, y: 0, ring: 0, j: 0, edges: [] }];
    for (let i = 1; i < rings; i++) for (let j = 0; j < counts[i]; j++) { const a = (j + 0.5) * TAU / counts[i]; cells.push({ x: Math.cos(a) * (i + 0.5), y: Math.sin(a) * (i + 0.5), ring: i, j, edges: [] }); }
    const id = (i, j) => base[i] + ((j % counts[i]) + counts[i]) % counts[i];
    for (let i = 1; i < rings; i++) for (let j = 0; j < counts[i]; j++) {
      const c = cells[id(i, j)], n = counts[i], a0 = j * TAU / n, a1 = (j + 1) * TAU / n;
      const inward = i === 1 ? 0 : id(i - 1, Math.floor(j * counts[i - 1] / n));
      c.edges.push({ nb: inward, own: true, g: ['a', i, a0, a1] });
      c.edges.push({ nb: n > 1 ? id(i, j + 1) : -1, own: true, g: ['l', Math.cos(a1) * i, Math.sin(a1) * i, Math.cos(a1) * (i + 1), Math.sin(a1) * (i + 1)] });
      if (i === rings - 1) c.edges.push({ nb: -1, own: true, g: ['a', i + 1, a0, a1] });
    }
    for (let i = 0; i < cells.length; i++) for (const e of cells[i].edges) if (e.nb >= 0 && !cells[e.nb].edges.some((x) => x.nb === i)) cells[e.nb].edges.push({ nb: i, own: false, g: e.g });
    const outer = base[rings - 1];
    cells.forEach((c) => { c.x += rings; c.y += rings; });
    return { kind: 'circle', cells, w: rings * 2, h: rings * 2, start: outer, exit: 0, unit: 1, rings, counts, base, cx: rings, cy: rings };
  }

  function carve(m, r, bias = 0.7) {
    const N = m.cells.length;
    m.open = Array.from({ length: N }, () => new Set());
    const seen = new Uint8Array(N), list = [m.start];
    seen[m.start] = 1;
    while (list.length) {
      const idx = r() < bias ? list.length - 1 : Math.floor(r() * list.length);
      const i = list[idx];
      const opts = m.cells[i].edges.filter((e) => e.nb >= 0 && !seen[e.nb]).map((e) => e.nb);
      if (!opts.length) { list.splice(idx, 1); continue; }
      const j = opts[Math.floor(r() * opts.length)];
      m.open[i].add(j); m.open[j].add(i); seen[j] = 1; list.push(j);
    }
    return m;
  }

  function bfs(m, from) {
    const dist = new Int32Array(m.cells.length).fill(-1), prev = new Int32Array(m.cells.length).fill(-1), q = [from];
    dist[from] = 0;
    for (let h = 0; h < q.length; h++) { const i = q[h]; for (const j of m.open[i]) if (dist[j] < 0) { dist[j] = dist[i] + 1; prev[j] = i; q.push(j); } }
    return { dist, prev };
  }
  function path(m, a, b) { const { prev } = bfs(m, a); const p = []; for (let i = b; i >= 0 && i !== a; i = prev[i]) p.push(i); p.push(a); return p.reverse(); }

  function generate({ shape = 'square', size = 'M', seed = 1, gems = 0, loops = 0 } = {}) {
    const r = rng(seed);
    const dims = { square: { S: [8, 8], M: [12, 12], L: [17, 17], XL: [24, 24] }, hex: { S: [7, 7], M: [10, 10], L: [13, 14], XL: [17, 19] }, circle: { S: 5, M: 7, L: 10, XL: 13 } };
    let m;
    if (shape === 'hex') m = hex(...dims.hex[size]);
    else if (shape === 'circle') { m = circle(dims.circle[size]); m.start = m.base[m.rings - 1] + Math.floor(r() * m.counts[m.rings - 1]); }
    else m = square(...dims.square[size]);
    carve(m, r, shape === 'circle' ? 0.8 : 0.72);
    if (shape === 'circle') { const d0 = bfs(m, m.exit).dist; let best = m.start; for (let j = 0; j < m.counts[m.rings - 1]; j++) { const i = m.base[m.rings - 1] + j; if (d0[i] > d0[best]) best = i; } m.start = best; }
    for (let k = 0; k < loops; k++) {
      const i = Math.floor(r() * m.cells.length), es = m.cells[i].edges.filter((e) => e.nb >= 0 && !m.open[i].has(e.nb));
      if (es.length) { const j = es[Math.floor(r() * es.length)].nb; m.open[i].add(j); m.open[j].add(i); }
    }
    const { dist } = bfs(m, m.start);
    const dead = [];
    for (let i = 0; i < m.cells.length; i++) if (i !== m.start && i !== m.exit && m.open[i].size === 1) dead.push(i);
    dead.sort((a, b) => dist[b] - dist[a]);
    const pool = dead.slice(0, Math.max(gems * 3, gems));
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    m.gems = pool.slice(0, gems);
    while (m.gems.length < gems) { const i = Math.floor(r() * m.cells.length); if (i !== m.start && i !== m.exit && !m.gems.includes(i)) m.gems.push(i); }
    let at = m.start, steps = 0; const left = m.gems.slice();
    while (left.length) { const d = bfs(m, at).dist; left.sort((a, b) => d[a] - d[b]); steps += d[left[0]]; at = left.shift(); }
    steps += bfs(m, at).dist[m.exit];
    m.tour = steps;
    m.shortest = bfs(m, m.start).dist[m.exit];
    m.seed = seed; m.shape = shape; m.size = size;
    return m;
  }

  const api = { generate, bfs, path, rng };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.MazeEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
