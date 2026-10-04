(function (root) {
  function heur(t, n) {
    let h = 0;
    for (let i = 0; i < t.length; i++) {
      const v = t[i]; if (!v) continue;
      const gr = Math.floor((v - 1) / n), gc = (v - 1) % n;
      h += Math.abs(gr - Math.floor(i / n)) + Math.abs(gc - (i % n));
    }
    for (let r = 0; r < n; r++) for (let a = 0; a < n; a++) {
      const va = t[r * n + a]; if (!va || Math.floor((va - 1) / n) !== r) continue;
      for (let b = a + 1; b < n; b++) { const vb = t[r * n + b]; if (vb && Math.floor((vb - 1) / n) === r && va > vb) h += 2; }
    }
    for (let c = 0; c < n; c++) for (let a = 0; a < n; a++) {
      const va = t[a * n + c]; if (!va || (va - 1) % n !== c) continue;
      for (let b = a + 1; b < n; b++) { const vb = t[b * n + c]; if (vb && (vb - 1) % n === c && va > vb) h += 2; }
    }
    return h;
  }
  const nbrs = (z, n) => { const out = [], r = Math.floor(z / n), c = z % n; if (r > 0) out.push(z - n); if (r < n - 1) out.push(z + n); if (c > 0) out.push(z - 1); if (c < n - 1) out.push(z + 1); return out; };
  function idaStar(start, n, maxNodes = 3e6) {
    const t = start.slice(); let z = t.indexOf(0), nodes = 0;
    const path = [];
    let bound = heur(t, n);
    function search(gc, prev) {
      const h = heur(t, n), f = gc + h;
      if (f > bound) return f;
      if (h === 0) return -1;
      if (++nodes > maxNodes) return Infinity;
      let min = Infinity;
      for (const m of nbrs(z, n)) {
        if (m === prev) continue;
        const oz = z; t[oz] = t[m]; t[m] = 0; z = m; path.push(m);
        const res = search(gc + 1, oz);
        if (res === -1) return -1;
        if (res < min) min = res;
        path.pop(); z = oz; t[m] = t[oz]; t[oz] = 0;
      }
      return min;
    }
    for (;;) { const res = search(0, -1); if (res === -1) return path.slice(); if (res === Infinity) return null; bound = res; }
  }
  function weighted(start, n, w = 2, maxNodes = 250000) {
    const key = (t) => String.fromCharCode(...t);
    const heap = [];
    const push = (x) => { heap.push(x); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p].f <= heap[i].f) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = i * 2 + 1, r = l + 1; let m = i; if (l < heap.length && heap[l].f < heap[m].f) m = l; if (r < heap.length && heap[r].f < heap[m].f) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
    const seen = new Map();
    const s0 = { t: start.slice(), z: start.indexOf(0), g: 0, parent: null, mv: -1 };
    s0.f = w * heur(s0.t, n); push(s0); seen.set(key(s0.t), 0);
    let nodes = 0;
    while (heap.length) {
      const cur = pop();
      if (heur(cur.t, n) === 0) { const p = []; for (let x = cur; x.parent; x = x.parent) p.push(x.mv); return p.reverse(); }
      if (++nodes > maxNodes) return null;
      for (const m of nbrs(cur.z, n)) {
        if (cur.parent && m === cur.parent.z) continue;
        const t = cur.t.slice(); t[cur.z] = t[m]; t[m] = 0;
        const k = key(t), g = cur.g + 1;
        if (seen.has(k) && seen.get(k) <= g) continue;
        seen.set(k, g);
        push({ t, z: m, g, parent: cur, mv: m, f: g + w * heur(t, n) });
      }
    }
    return null;
  }
  function solve(tiles, n) {
    if (n === 3) return idaStar(tiles, 3);
    if (n === 4) return weighted(tiles, 4, 1.6, 200000) || weighted(tiles, 4, 3, 200000);
    return n === 5 ? weighted(tiles, 5, 5, 200000) || weighted(tiles, 5, 12, 200000) : weighted(tiles, n, 12, 150000);
  }
  const api = { heur, solve, idaStar, weighted };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.SlideSolver = api;
})(typeof window !== 'undefined' ? window : globalThis);
