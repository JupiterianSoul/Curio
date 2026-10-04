(() => {
  class Fluid {
    constructor(W, H, max = 3000, o = {}) {
      this.W = W; this.H = H; this.max = max; this.n = 0;
      this.h = o.h ?? 24; this.rho0 = o.rho0 ?? 5; this.k = o.k ?? 0.04; this.kn = o.kn ?? 0.12; this.beta = o.beta ?? 0.08; this.sigma = o.sigma ?? 0.02;
      this.pr = o.pr ?? 4; this.ghost = o.ghost ?? 2;
      this.gx = 0; this.gy = 0.5;
      this.x = new Float32Array(max); this.y = new Float32Array(max);
      this.px = new Float32Array(max); this.py = new Float32Array(max);
      this.vx = new Float32Array(max); this.vy = new Float32Array(max);
      this.rho = new Float32Array(max); this.rhon = new Float32Array(max);
      this.dx = new Float32Array(max); this.dy = new Float32Array(max);
      this.cellOf = new Int32Array(max); this.order = new Int32Array(max);
      this.maxPairs = max * 40;
      this.pi = new Int32Array(this.maxPairs); this.pj = new Int32Array(this.maxPairs);
      this.pq = new Float32Array(this.maxPairs); this.pnx = new Float32Array(this.maxPairs); this.pny = new Float32Array(this.maxPairs);
      this.np = 0;
      this.gw = Math.ceil(W / this.h) + 2; this.gh = Math.ceil(H / this.h) + 2;
      this.cellStart = new Int32Array(this.gw * this.gh + 1);
      this.segs = [];
      this.bodies = [];
      this.segGrid = null;
    }
    add(x, y, vx = 0, vy = 0) {
      if (this.n >= this.max) return false;
      const i = this.n++;
      this.x[i] = x; this.y[i] = y; this.px[i] = x; this.py[i] = y; this.vx[i] = vx; this.vy[i] = vy;
      return true;
    }
    remove(i) {
      const j = --this.n;
      this.x[i] = this.x[j]; this.y[i] = this.y[j]; this.px[i] = this.px[j]; this.py[i] = this.py[j]; this.vx[i] = this.vx[j]; this.vy[i] = this.vy[j];
    }
    setSegments(segs) {
      this.segs = segs;
      const cs = 32, gw = Math.ceil(this.W / cs) + 1, gh = Math.ceil(this.H / cs) + 1;
      const grid = Array.from({ length: gw * gh }, () => []);
      segs.forEach((s, k) => {
        const pad = s.r + this.pr + 2;
        const x0 = Math.max(0, Math.floor((Math.min(s.x1, s.x2) - pad) / cs)), x1 = Math.min(gw - 1, Math.floor((Math.max(s.x1, s.x2) + pad) / cs));
        const y0 = Math.max(0, Math.floor((Math.min(s.y1, s.y2) - pad) / cs)), y1 = Math.min(gh - 1, Math.floor((Math.max(s.y1, s.y2) + pad) / cs));
        for (let i = x0; i <= x1; i++) for (let j = y0; j <= y1; j++) grid[j * gw + i].push(k);
      });
      this.segGrid = { cs, gw, gh, grid };
    }
    buildGrid() {
      const n = this.n, h = this.h, gw = this.gw, gh = this.gh, cs = this.cellStart, cell = this.cellOf, order = this.order;
      cs.fill(0);
      for (let i = 0; i < n; i++) {
        let cx = Math.floor(this.x[i] / h) + 1, cy = Math.floor(this.y[i] / h) + 1;
        if (cx < 0) cx = 0; else if (cx >= gw) cx = gw - 1;
        if (cy < 0) cy = 0; else if (cy >= gh) cy = gh - 1;
        const c = cy * gw + cx; cell[i] = c; cs[c + 1]++;
      }
      for (let c = 0; c < gw * gh; c++) cs[c + 1] += cs[c];
      const fill = this.fillTmp || (this.fillTmp = new Int32Array(gw * gh + 1));
      fill.set(cs);
      for (let i = 0; i < n; i++) order[fill[cell[i]]++] = i;
    }
    buildPairs(dt) {
      const n = this.n, h = this.h, h2 = h * h, gw = this.gw, gh = this.gh, cs = this.cellStart, order = this.order, X = this.x, Y = this.y;
      let np = 0;
      const PI = this.pi, PJ = this.pj, PQ = this.pq, NX = this.pnx, NY = this.pny, mp = this.maxPairs;
      const VX = this.vx, VY = this.vy, beta = this.beta, sigma = this.sigma, vk = dt * 0.5;
      for (let i = 0; i < n; i++) {
        const c = this.cellOf[i], cx = c % gw, cy = (c / gw) | 0;
        const xi = X[i], yi = Y[i];
        for (let oy = -1; oy <= 1; oy++) {
          const yy = cy + oy; if (yy < 0 || yy >= gh) continue;
          for (let ox = -1; ox <= 1; ox++) {
            const xx = cx + ox; if (xx < 0 || xx >= gw) continue;
            const cc = yy * gw + xx;
            for (let k = cs[cc], e = cs[cc + 1]; k < e; k++) {
              const j = order[k];
              if (j <= i) continue;
              const dx = X[j] - xi, dy = Y[j] - yi, d2 = dx * dx + dy * dy;
              if (d2 >= h2 || d2 < 1e-8) continue;
              if (np >= mp) continue;
              const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, qq = d / h;
              PI[np] = i; PJ[np] = j; PQ[np] = qq; NX[np] = nx; NY[np] = ny; np++;
              const u = (VX[i] - VX[j]) * nx + (VY[i] - VY[j]) * ny;
              if (u > 0) {
                const I = vk * (1 - qq) * (sigma * u + beta * u * u);
                VX[i] -= I * nx; VY[i] -= I * ny; VX[j] += I * nx; VY[j] += I * ny;
              }
            }
          }
        }
      }
      this.np = np;
    }
    step(dt) {
      const n = this.n; if (!n) return;
      const X = this.x, Y = this.y, PX = this.px, PY = this.py, VX = this.vx, VY = this.vy;
      const gx = this.gx * dt, gy = this.gy * dt;
      for (let i = 0; i < n; i++) {
        VX[i] += gx; VY[i] += gy;
        const sp = VX[i] * VX[i] + VY[i] * VY[i];
        if (sp > 400) { const f = 20 / Math.sqrt(sp); VX[i] *= f; VY[i] *= f; }
        PX[i] = X[i]; PY[i] = Y[i];
        X[i] += VX[i] * dt; Y[i] += VY[i] * dt;
      }
      this.buildGrid();
      this.buildPairs(dt);
      const np = this.np, PI = this.pi, PJ = this.pj, PQ = this.pq, NX = this.pnx, NY = this.pny;
      for (let i = 0; i < n; i++) { X[i] = PX[i] + VX[i] * dt; Y[i] = PY[i] + VY[i] * dt; }
      const R = this.rho, RN = this.rhon;
      R.fill(0, 0, n); RN.fill(0, 0, n);
      for (let p = 0; p < np; p++) {
        const q = 1 - PQ[p], q2 = q * q, q3 = q2 * q;
        R[PI[p]] += q2; R[PJ[p]] += q2; RN[PI[p]] += q3; RN[PJ[p]] += q3;
      }
      const DX = this.dx, DY = this.dy, k = this.k, kn = this.kn, rho0 = this.rho0, dt2 = dt * dt;
      DX.fill(0, 0, n); DY.fill(0, 0, n);
      const h = this.h, Wd = this.W, Hd = this.H, gf = this.ghost;
      for (let i = 0; i < n; i++) {
        const x = X[i], y = Y[i];
        let a = 0, an = 0, fx = 0, fy = 0;
        if (x < h) { const q = 1 - x / h; a += q * q; an += q * q * q; fx += q; }
        if (x > Wd - h) { const q = 1 - (Wd - x) / h; a += q * q; an += q * q * q; fx -= q; }
        if (y > Hd - h) { const q = 1 - (Hd - y) / h; a += q * q; an += q * q * q; fy -= q; }
        if (y < h) { const q = 1 - y / h; a += q * q; an += q * q * q; fy += q; }
        if (!a) continue;
        R[i] += a * gf; RN[i] += an * gf;
        const P = k * (R[i] - rho0), Pn = kn * RN[i];
        if (P <= 0 && Pn <= 0) continue;
        const D = dt2 * (Math.max(0, P) + Pn) * gf * 0.5;
        DX[i] += fx * D; DY[i] += fy * D;
      }
      for (let p = 0; p < np; p++) {
        const i = PI[p], j = PJ[p], q = 1 - PQ[p];
        const P = k * (R[i] + R[j] - 2 * rho0) * 0.5, Pn = kn * (RN[i] + RN[j]) * 0.5;
        const D = dt2 * (P * q + Pn * q * q) * 0.5;
        const ddx = D * NX[p], ddy = D * NY[p];
        DX[i] -= ddx; DY[i] -= ddy; DX[j] += ddx; DY[j] += ddy;
      }
      for (let i = 0; i < n; i++) { X[i] += DX[i]; Y[i] += DY[i]; }
      this.collide();
      const inv = 1 / dt;
      for (let i = 0; i < n; i++) { VX[i] = (X[i] - PX[i]) * inv; VY[i] = (Y[i] - PY[i]) * inv; }
    }
    collide() {
      const n = this.n, X = this.x, Y = this.y, PX = this.px, PY = this.py, r = this.pr, W = this.W, H = this.H;
      const sg = this.segGrid, segs = this.segs;
      for (let i = 0; i < n; i++) {
        let x = X[i], y = Y[i];
        if (x < r) { x = r; PX[i] += (x - PX[i]) * 0.5; } else if (x > W - r) { x = W - r; PX[i] += (x - PX[i]) * 0.5; }
        if (y < r) { y = r; } else if (y > H - r) { y = H - r; PX[i] += (x - PX[i]) * 0.3; }
        if (sg) {
          const ci = Math.floor(x / sg.cs), cj = Math.floor(y / sg.cs);
          if (ci >= 0 && ci < sg.gw && cj >= 0 && cj < sg.gh) {
            const L = sg.grid[cj * sg.gw + ci];
            for (let t = 0; t < L.length; t++) {
              const s = segs[L[t]];
              const ex = s.x2 - s.x1, ey = s.y2 - s.y1, L2 = ex * ex + ey * ey || 1e-6;
              let u = ((x - s.x1) * ex + (y - s.y1) * ey) / L2; u = u < 0 ? 0 : u > 1 ? 1 : u;
              const cx = s.x1 + ex * u, cy = s.y1 + ey * u;
              const dx = x - cx, dy = y - cy, d2 = dx * dx + dy * dy, rr = s.r + r;
              if (d2 >= rr * rr) continue;
              const d = Math.sqrt(d2) || 1e-4;
              let nx = dx / d, ny = dy / d;
              if (d2 < 1e-8) { nx = 0; ny = -1; }
              x = cx + nx * rr; y = cy + ny * rr;
              const vx = x - PX[i], vy = y - PY[i], vn = vx * nx + vy * ny;
              PX[i] = x - (vx - vn * nx) * 0.9; PY[i] = y - (vy - vn * ny) * 0.9;
            }
          }
        }
        for (const b of this.bodies) {
          const dx = x - b.x, dy = y - b.y, rr = b.r + r, d2 = dx * dx + dy * dy;
          if (d2 >= rr * rr) continue;
          const d = Math.sqrt(d2) || 1e-4, nx = dx / d, ny = dy / d, pen = rr - d;
          const share = b.m / (b.m + 1);
          x += nx * pen * share; y += ny * pen * share;
          b.fx -= nx * pen * (1 - share); b.fy -= ny * pen * (1 - share);
          b.sub += 1;
        }
        X[i] = x; Y[i] = y;
      }
    }
  }
  window.Fluid = Fluid;
})();
