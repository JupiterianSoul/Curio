(() => {
  const wrap = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };

  class VWorld {
    constructor(W, H) {
      this.W = W; this.H = H;
      this.pts = []; this.sticks = []; this.angles = []; this.polys = []; this.pads = [];
      this.gx = 0; this.gy = 1500; this.iter = 7; this.sub = 2; this.damp = 0.9995;
      this.events = [];
      this.cell = 56;
    }
    point(x, y, r, m = 1, o = {}) {
      const p = { x, y, px: x, py: y, r, im: m > 0 ? 1 / m : 0, m, fr: o.fr ?? 0.4, e: o.e ?? 0.2, owner: o.owner ?? null, vx0: 0, vy0: 0, grab: null };
      this.pts.push(p);
      return p;
    }
    stick(a, b, o = {}) {
      const s = { a, b, len: o.len ?? Math.hypot(a.x - b.x, a.y - b.y), r: o.r ?? 0, k: o.k ?? 1, owner: o.owner ?? a.owner };
      this.sticks.push(s);
      return s;
    }
    angle(a, b, c, min, max, k = 0.4) { const q = { a, b, c, min, max, k }; this.angles.push(q); return q; }
    poly(pts, owner) { const q = { pts, owner }; this.polys.push(q); return q; }
    removeOwner(owner) {
      this.pts = this.pts.filter((p) => p.owner !== owner);
      this.sticks = this.sticks.filter((s) => s.owner !== owner);
      this.angles = this.angles.filter((q) => q.b.owner !== owner);
      this.polys = this.polys.filter((q) => q.owner !== owner);
    }

    solveSticks() {
      for (const s of this.sticks) {
        const a = s.a, b = s.b;
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 1e-6;
        const w = a.im + b.im;
        if (w === 0) continue;
        const diff = ((d - s.len) / d) * s.k / w;
        a.x += dx * diff * a.im; a.y += dy * diff * a.im;
        b.x -= dx * diff * b.im; b.y -= dy * diff * b.im;
      }
    }
    solveAngles() {
      for (const q of this.angles) {
        const { a, b, c } = q;
        const a1 = Math.atan2(b.y - a.y, b.x - a.x), a2 = Math.atan2(c.y - b.y, c.x - b.x);
        const rel = wrap(a2 - a1);
        let d = 0;
        if (rel < q.min) d = q.min - rel; else if (rel > q.max) d = q.max - rel; else continue;
        const wa = a.im, wc = c.im, w = wa + wc;
        if (w === 0) continue;
        const pc = d * q.k * wc / w, pa = -d * q.k * wa / w;
        rot(c, b, pc); rot(a, b, pa);
      }
    }
    buildGrid() {
      const cs = this.cell, grid = new Map();
      const key = (i, j) => i * 73856093 ^ j * 19349663;
      const add = (i, j, it) => { const k = key(i, j); let c = grid.get(k); if (!c) grid.set(k, (c = { p: [], s: [] })); c.p.push(it); };
      for (const p of this.pts) {
        const i0 = Math.floor((p.x - p.r) / cs), i1 = Math.floor((p.x + p.r) / cs), j0 = Math.floor((p.y - p.r) / cs), j1 = Math.floor((p.y + p.r) / cs);
        for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) add(i, j, p);
      }
      this.grid = grid; this.key = key;
    }
    collidePairs() {
      for (const c of this.grid.values()) {
        const L = c.p;
        for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
          const a = L[i], b = L[j];
          if (a.owner === b.owner && a.owner) continue;
          const dx = b.x - a.x, dy = b.y - a.y, rr = a.r + b.r;
          const d2 = dx * dx + dy * dy;
          if (d2 >= rr * rr || d2 === 0) continue;
          const w = a.im + b.im; if (!w) continue;
          const d = Math.sqrt(d2), pen = (rr - d) / d / w;
          a.x -= dx * pen * a.im; a.y -= dy * pen * a.im;
          b.x += dx * pen * b.im; b.y += dy * pen * b.im;
        }
      }
    }
    collideSegments() {
      const cs = this.cell;
      for (const s of this.sticks) {
        if (!s.r) continue;
        const a = s.a, b = s.b;
        const x0 = Math.min(a.x, b.x) - s.r, x1 = Math.max(a.x, b.x) + s.r, y0 = Math.min(a.y, b.y) - s.r, y1 = Math.max(a.y, b.y) + s.r;
        const i0 = Math.floor(x0 / cs), i1 = Math.floor(x1 / cs), j0 = Math.floor(y0 / cs), j1 = Math.floor(y1 / cs);
        for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
          const c = this.grid.get(this.key(i, j)); if (!c) continue;
          for (const p of c.p) {
            if (p.owner === s.owner) continue;
            const ex = b.x - a.x, ey = b.y - a.y, L2 = ex * ex + ey * ey || 1e-6;
            let t = ((p.x - a.x) * ex + (p.y - a.y) * ey) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t;
            const cx = a.x + ex * t, cy = a.y + ey * t;
            const dx = p.x - cx, dy = p.y - cy, rr = s.r + p.r, d2 = dx * dx + dy * dy;
            if (d2 >= rr * rr || d2 === 0) continue;
            const d = Math.sqrt(d2), pen = rr - d, nx = dx / d, ny = dy / d;
            const wa = a.im * (1 - t), wb = b.im * t, w = p.im + wa * (1 - t) + wb * t;
            if (!w) continue;
            const lam = pen / w;
            p.x += nx * lam * p.im; p.y += ny * lam * p.im;
            a.x -= nx * lam * wa; a.y -= ny * lam * wa;
            b.x -= nx * lam * wb; b.y -= ny * lam * wb;
          }
        }
      }
    }
    pointPoly(p, q) {
      const P = q.pts, n = P.length;
      let best = -Infinity, bi = -1, bnx = 0, bny = 0;
      for (let i = 0; i < n; i++) {
        const a = P[i], b = P[(i + 1) % n];
        let nx = b.y - a.y, ny = -(b.x - a.x);
        const L = Math.hypot(nx, ny) || 1e-6; nx /= L; ny /= L;
        const d = (p.x - a.x) * nx + (p.y - a.y) * ny - p.r;
        if (d >= 0) return;
        if (d > best) { best = d; bi = i; bnx = nx; bny = ny; }
      }
      const a = P[bi], b = P[(bi + 1) % n];
      const ex = b.x - a.x, ey = b.y - a.y, L2 = ex * ex + ey * ey || 1e-6;
      let t = ((p.x - a.x) * ex + (p.y - a.y) * ey) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t;
      const wa = a.im * (1 - t), wb = b.im * t, w = p.im + wa * (1 - t) + wb * t;
      if (!w) return;
      const lam = -best / w;
      p.x += bnx * lam * p.im; p.y += bny * lam * p.im;
      a.x -= bnx * lam * wa; a.y -= bny * lam * wa;
      b.x -= bnx * lam * wb; b.y -= bny * lam * wb;
    }
    collidePolys() {
      for (const q of this.polys) {
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (const p of q.pts) { if (p.x < x0) x0 = p.x; if (p.x > x1) x1 = p.x; if (p.y < y0) y0 = p.y; if (p.y > y1) y1 = p.y; }
        q.x0 = x0; q.x1 = x1; q.y0 = y0; q.y1 = y1;
      }
      const cs = this.cell;
      for (const q of this.polys) {
        const i0 = Math.floor((q.x0 - 40) / cs), i1 = Math.floor((q.x1 + 40) / cs), j0 = Math.floor((q.y0 - 40) / cs), j1 = Math.floor((q.y1 + 40) / cs);
        const done = new Set();
        for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
          const c = this.grid.get(this.key(i, j)); if (!c) continue;
          for (const p of c.p) {
            if (p.owner === q.owner || done.has(p)) continue;
            done.add(p);
            if (p.x + p.r < q.x0 || p.x - p.r > q.x1 || p.y + p.r < q.y0 || p.y - p.r > q.y1) continue;
            this.pointPoly(p, q);
          }
        }
      }
    }
    bounds(vel) {
      const W = this.W, H = this.H;
      for (const p of this.pts) {
        if (p.grab) continue;
        let nx = 0, ny = 0, pen = 0;
        if (p.y + p.r > H) { ny = -1; pen = p.y + p.r - H; }
        else if (p.y - p.r < 0) { ny = 1; pen = p.r - p.y; }
        if (pen) this.hitWall(p, 0, ny, pen, vel);
        pen = 0;
        if (p.x + p.r > W) { nx = -1; pen = p.x + p.r - W; }
        else if (p.x - p.r < 0) { nx = 1; pen = p.r - p.x; }
        if (pen) this.hitWall(p, nx, 0, pen, vel);
        for (const pad of this.pads) {
          if (p.x + p.r < pad.x || p.x - p.r > pad.x + pad.w || p.y + p.r < pad.y || p.y - p.r > pad.y + pad.h) continue;
          const cx = Math.max(pad.x, Math.min(pad.x + pad.w, p.x)), cy = Math.max(pad.y, Math.min(pad.y + pad.h, p.y));
          let dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy);
          let qx, qy, qpen;
          if (d > 1e-6) { if (d >= p.r) continue; qx = dx / d; qy = dy / d; qpen = p.r - d; }
          else {
            const l = p.x - pad.x, r = pad.x + pad.w - p.x, t = p.y - pad.y, b = pad.y + pad.h - p.y, m = Math.min(l, r, t, b);
            if (m === t) { qx = 0; qy = -1; } else if (m === b) { qx = 0; qy = 1; } else if (m === l) { qx = -1; qy = 0; } else { qx = 1; qy = 0; }
            qpen = m + p.r;
          }
          const launch = vel && qx * pad.nx + qy * pad.ny > 0.7;
          this.hitWall(p, qx, qy, qpen, vel, launch ? pad : null);
        }
      }
    }
    hitWall(p, nx, ny, pen, vel, pad) {
      p.x += nx * pen; p.y += ny * pen;
      if (!vel) return;
      const vx = p.x - p.px, vy = p.y - p.py;
      const vn = vx * nx + vy * ny;
      if (pad) {
        const tx = vx - vn * nx, ty = vy - vn * ny, sp = pad.launch * this.h;
        p.px = p.x - (tx + nx * sp); p.py = p.y - (ty + ny * sp);
        pad.flash = 1;
        this.events.push({ p, pad, speed: pad.launch });
        return;
      }
      if (vn >= 0) return;
      const tx = vx - vn * nx, ty = vy - vn * ny;
      const f = Math.max(0, 1 - p.fr);
      const nvx = tx * f - vn * p.e * nx, nvy = ty * f - vn * p.e * ny;
      p.px = p.x - nvx; p.py = p.y - nvy;
      const sp = -vn / this.h;
      if (sp > 250) this.events.push({ p, speed: sp, wall: true });
    }
    step(dt) {
      const h = dt / this.sub;
      this.h = h;
      this.events.length = 0;
      const gx = this.gx * h * h, gy = this.gy * h * h, damp = this.damp;
      for (let s = 0; s < this.sub; s++) {
        for (const p of this.pts) {
          if (p.grab) {
            const tx = p.grab.x, ty = p.grab.y;
            p.px = p.x; p.py = p.y;
            p.x += (tx - p.x) * 0.5; p.y += (ty - p.y) * 0.5;
            continue;
          }
          if (!p.im) continue;
          let vx = (p.x - p.px) * damp, vy = (p.y - p.py) * damp;
          const v2 = vx * vx + vy * vy, mx = 3600 * h;
          if (v2 > mx * mx) { const f = mx / Math.sqrt(v2); vx *= f; vy *= f; }
          p.vx0 = vx; p.vy0 = vy;
          p.px = p.x; p.py = p.y;
          p.x += vx + gx; p.y += vy + gy;
        }
        this.buildGrid();
        const saved = [];
        for (const p of this.pts) if (p.grab) { saved.push(p, p.im); p.im = 0; }
        for (let k = 0; k < this.iter; k++) {
          this.solveSticks();
          if (k % 2 === 0) this.solveAngles();
          this.collidePairs();
          this.collideSegments();
          this.collidePolys();
          this.bounds(k === this.iter - 1);
        }
        for (let i = 0; i < saved.length; i += 2) saved[i].im = saved[i + 1];
        for (const p of this.pts) {
          if (p.grab || !p.im) continue;
          const dvx = (p.x - p.px) - p.vx0, dvy = (p.y - p.py) - p.vy0;
          const dv = Math.hypot(dvx, dvy) / h;
          if (dv > 520) this.events.push({ p, speed: dv });
        }
      }
    }
  }
  function rot(p, c, a) {
    if (!a) return;
    const cs = Math.cos(a), sn = Math.sin(a), dx = p.x - c.x, dy = p.y - c.y;
    p.x = c.x + dx * cs - dy * sn; p.y = c.y + dx * sn + dy * cs;
  }
  window.Verlet = { VWorld };
})();
