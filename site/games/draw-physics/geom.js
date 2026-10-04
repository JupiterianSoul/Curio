(() => {
  function rdp(pts, eps) {
    if (pts.length < 3) return pts.slice();
    const keep = new Uint8Array(pts.length);
    keep[0] = 1; keep[pts.length - 1] = 1;
    const stack = [[0, pts.length - 1]];
    while (stack.length) {
      const [a, b] = stack.pop();
      const [ax, ay] = pts[a], [bx, by] = pts[b];
      const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy);
      let best = -1, bd = 0;
      for (let i = a + 1; i < b; i++) {
        const d = L < 1e-6 ? Math.hypot(pts[i][0] - ax, pts[i][1] - ay) : Math.abs((pts[i][0] - ax) * dy - (pts[i][1] - ay) * dx) / L;
        if (d > bd) { bd = d; best = i; }
      }
      if (bd > eps && best > 0) { keep[best] = 1; stack.push([a, best], [best, b]); }
    }
    return pts.filter((_, i) => keep[i]);
  }

  function area(poly) {
    let s = 0;
    for (let i = 0; i < poly.length; i++) { const [x1, y1] = poly[i], [x2, y2] = poly[(i + 1) % poly.length]; s += x1 * y2 - x2 * y1; }
    return s / 2;
  }

  function segCross(a, b, c, d) {
    const o = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
    const d1 = o(c, d, a), d2 = o(c, d, b), d3 = o(a, b, c), d4 = o(a, b, d);
    return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
  }

  function isSimple(poly) {
    const n = poly.length;
    for (let i = 0; i < n; i++) {
      const a = poly[i], b = poly[(i + 1) % n];
      for (let j = i + 2; j < n; j++) {
        if (i === 0 && j === n - 1) continue;
        if (segCross(a, b, poly[j], poly[(j + 1) % n])) return false;
      }
    }
    return true;
  }

  function triangulate(poly) {
    const n = poly.length;
    const idx = [];
    for (let i = 0; i < n; i++) idx.push(i);
    const tris = [];
    const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const inTri = (p, a, b, c) => cross(a, b, p) >= 0 && cross(b, c, p) >= 0 && cross(c, a, p) >= 0;
    let guard = 0;
    while (idx.length > 3 && guard++ < 5000) {
      let found = false;
      for (let k = 0; k < idx.length; k++) {
        const i0 = idx[(k + idx.length - 1) % idx.length], i1 = idx[k], i2 = idx[(k + 1) % idx.length];
        const a = poly[i0], b = poly[i1], c = poly[i2];
        if (cross(a, b, c) <= 1e-9) continue;
        let ok = true;
        for (const j of idx) { if (j === i0 || j === i1 || j === i2) continue; if (inTri(poly[j], a, b, c)) { ok = false; break; } }
        if (!ok) continue;
        tris.push([i0, i1, i2]);
        idx.splice(k, 1);
        found = true;
        break;
      }
      if (!found) break;
    }
    if (idx.length === 3) tris.push(idx.slice());
    return tris;
  }

  function convexParts(poly) {
    const tris = triangulate(poly);
    let parts = tris.map((t) => t.slice());
    const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const convex = (ids) => { for (let i = 0; i < ids.length; i++) if (cross(poly[ids[i]], poly[ids[(i + 1) % ids.length]], poly[ids[(i + 2) % ids.length]]) < -1e-6) return false; return true; };
    let merged = true;
    while (merged) {
      merged = false;
      outer: for (let a = 0; a < parts.length; a++) {
        for (let b = a + 1; b < parts.length; b++) {
          const A = parts[a], B = parts[b];
          for (let i = 0; i < A.length; i++) {
            const u = A[i], v = A[(i + 1) % A.length];
            const j = B.findIndex((x, k) => x === v && B[(k + 1) % B.length] === u);
            if (j < 0) continue;
            const C = [];
            for (let k = 0; k < A.length; k++) { C.push(A[(i + 1 + k) % A.length]); }
            C.pop();
            for (let k = 0; k < B.length - 1; k++) C.push(B[(j + 1 + k) % B.length]);
            if (C.length <= 8 && convex(C)) { parts[a] = C; parts.splice(b, 1); merged = true; break outer; }
          }
        }
      }
    }
    return parts.map((ids) => ids.map((i) => poly[i]));
  }

  window.Geom = { rdp, area, isSimple, triangulate, convexParts };
})();
