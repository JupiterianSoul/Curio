(() => {
  const STATIC = 0, KINEMATIC = 1, DYNAMIC = 2;
  let nextId = 1;

  function softness(hertz, zeta, h) {
    if (hertz === 0) return { biasRate: 0, massScale: 1, impulseScale: 0 };
    const omega = 2 * Math.PI * hertz;
    const a1 = 2 * zeta + h * omega;
    const a2 = h * omega * a1;
    const a3 = 1 / (1 + a2);
    return { biasRate: omega / a1, massScale: a2 * a3, impulseScale: a3 };
  }

  function makeCircle(r, x = 0, y = 0, opts = {}) {
    return { type: 'c', r, lx: x, ly: y, wx: 0, wy: 0, ...opts };
  }

  function makePoly(points, r = 0, opts = {}) {
    const n = points.length / 2;
    const v = Float64Array.from(points);
    if (n >= 3) {
      let area = 0;
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        area += v[2 * i] * v[2 * j + 1] - v[2 * j] * v[2 * i + 1];
      }
      if (area < 0) {
        const w = new Float64Array(v.length);
        for (let i = 0; i < n; i++) { w[2 * i] = v[2 * (n - 1 - i)]; w[2 * i + 1] = v[2 * (n - 1 - i) + 1]; }
        v.set(w);
      }
    }
    const nrm = new Float64Array(n * 2);
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      let ex = v[2 * j] - v[2 * i], ey = v[2 * j + 1] - v[2 * i + 1];
      const L = Math.hypot(ex, ey) || 1;
      nrm[2 * i] = ey / L; nrm[2 * i + 1] = -ex / L;
    }
    if (n === 2) { nrm[2] = -nrm[0]; nrm[3] = -nrm[1]; }
    return { type: 'p', r, n, lv: v, ln: nrm, wv: new Float64Array(n * 2), wn: new Float64Array(n * 2), ...opts };
  }

  function makeBox(w, h, x = 0, y = 0, a = 0, r = 0, opts = {}) {
    const c = Math.cos(a), s = Math.sin(a), hw = w / 2, hh = h / 2;
    const pts = [];
    for (const [px, py] of [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]]) pts.push(x + c * px - s * py, y + s * px + c * py);
    return makePoly(pts, r, opts);
  }

  function makeCapsule(x1, y1, x2, y2, r, opts = {}) {
    return makePoly([x1, y1, x2, y2], r, opts);
  }

  function shapeMass(sh, density) {
    if (sh.type === 'c') {
      const m = density * Math.PI * sh.r * sh.r;
      return { m, cx: sh.lx, cy: sh.ly, I: m * (0.5 * sh.r * sh.r + sh.lx * sh.lx + sh.ly * sh.ly) };
    }
    const v = sh.lv, n = sh.n;
    if (n === 2) {
      const L = Math.hypot(v[2] - v[0], v[3] - v[1]);
      const r = Math.max(sh.r, 0.5);
      const m = density * (2 * r * L + Math.PI * r * r);
      const cx = (v[0] + v[2]) / 2, cy = (v[1] + v[3]) / 2;
      const len = L + 2 * r, wid = 2 * r;
      return { m, cx, cy, I: m * ((len * len + wid * wid) / 12 + cx * cx + cy * cy) };
    }
    let area = 0, cx = 0, cy = 0, I = 0;
    const ox = v[0], oy = v[1];
    for (let i = 1; i < n - 1; i++) {
      const e1x = v[2 * i] - ox, e1y = v[2 * i + 1] - oy;
      const e2x = v[2 * i + 2] - ox, e2y = v[2 * i + 3] - oy;
      const D = e1x * e2y - e1y * e2x;
      const ta = 0.5 * D;
      area += ta;
      cx += ta * (e1x + e2x) / 3; cy += ta * (e1y + e2y) / 3;
      const intx2 = e1x * e1x + e2x * e1x + e2x * e2x;
      const inty2 = e1y * e1y + e2y * e1y + e2y * e2y;
      I += (0.25 / 3 * D) * (intx2 + inty2);
    }
    area = Math.abs(area) || 1e-6;
    I = Math.abs(I);
    cx = cx / area; cy = cy / area;
    const m = density * area;
    const Iabs = density * I;
    const wx = ox + cx, wy = oy + cy;
    const Ic = Iabs - m * (cx * cx + cy * cy);
    return { m, cx: wx, cy: wy, I: Ic + m * (wx * wx + wy * wy) };
  }

  class Body {
    constructor(world, o) {
      this.world = world;
      this.id = nextId++;
      this.type = o.type ?? DYNAMIC;
      this.x = o.x ?? 0; this.y = o.y ?? 0; this.a = o.a ?? 0;
      this.c = Math.cos(this.a); this.s = Math.sin(this.a);
      this.vx = o.vx ?? 0; this.vy = o.vy ?? 0; this.w = o.w ?? 0;
      this.friction = o.friction ?? 0.6;
      this.restitution = o.restitution ?? 0.1;
      this.density = o.density ?? 1;
      this.gravityScale = o.gravityScale ?? 1;
      this.linDamp = o.linDamp ?? 0.0;
      this.angDamp = o.angDamp ?? 0.05;
      this.group = o.group ?? 0;
      this.bullet = !!o.bullet;
      this.sensor = !!o.sensor;
      this.user = o.user ?? {};
      this.awake = true; this.sleepTime = 0;
      this.dpx = 0; this.dpy = 0; this.da = 0; this.dc = 1; this.ds = 0;
      this.minX = 0; this.minY = 0; this.maxX = 0; this.maxY = 0;
      this.shapes = [];
      this.m = 0; this.invM = 0; this.I = 0; this.invI = 0;
      this.extent = 1;
      for (const sh of o.shapes || []) this.addShape(sh);
      this.finish();
    }
    addShape(sh) { sh.body = this; sh.uid = nextId++; this.shapes.push(sh); }
    finish() {
      if (this.type !== DYNAMIC) { this.m = 0; this.invM = 0; this.I = 0; this.invI = 0; }
      else {
        let m = 0, cx = 0, cy = 0, I = 0;
        for (const sh of this.shapes) { const d = shapeMass(sh, sh.density ?? this.density); m += d.m; cx += d.m * d.cx; cy += d.m * d.cy; I += d.I; }
        if (m <= 0) m = 1;
        cx /= m; cy /= m;
        I -= m * (cx * cx + cy * cy);
        if (Math.abs(cx) > 1e-9 || Math.abs(cy) > 1e-9) {
          for (const sh of this.shapes) {
            if (sh.type === 'c') { sh.lx -= cx; sh.ly -= cy; }
            else for (let i = 0; i < sh.n; i++) { sh.lv[2 * i] -= cx; sh.lv[2 * i + 1] -= cy; }
          }
          this.x += this.c * cx - this.s * cy;
          this.y += this.s * cx + this.c * cy;
        }
        this.m = m; this.invM = 1 / m; this.I = Math.max(I, m * 1e-3); this.invI = this.fixedRotation ? 0 : 1 / this.I;
      }
      let ext = 1;
      for (const sh of this.shapes) {
        if (sh.type === 'c') ext = Math.max(ext, Math.hypot(sh.lx, sh.ly) + sh.r);
        else for (let i = 0; i < sh.n; i++) ext = Math.max(ext, Math.hypot(sh.lv[2 * i], sh.lv[2 * i + 1]) + sh.r);
      }
      this.extent = ext;
      this.sync();
    }
    setFixedRotation(f) { this.fixedRotation = f; this.invI = f || this.type !== DYNAMIC ? 0 : 1 / this.I; }
    sync() {
      const c = this.c = Math.cos(this.a), s = this.s = Math.sin(this.a);
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const sh of this.shapes) {
        let a0, b0, a1, b1;
        if (sh.type === 'c') {
          sh.wx = this.x + c * sh.lx - s * sh.ly; sh.wy = this.y + s * sh.lx + c * sh.ly;
          a0 = sh.wx - sh.r; b0 = sh.wy - sh.r; a1 = sh.wx + sh.r; b1 = sh.wy + sh.r;
        } else {
          a0 = Infinity; b0 = Infinity; a1 = -Infinity; b1 = -Infinity;
          const lv = sh.lv, ln = sh.ln, wv = sh.wv, wn = sh.wn;
          for (let i = 0; i < sh.n; i++) {
            const px = lv[2 * i], py = lv[2 * i + 1];
            const X = this.x + c * px - s * py, Y = this.y + s * px + c * py;
            wv[2 * i] = X; wv[2 * i + 1] = Y;
            const nx = ln[2 * i], ny = ln[2 * i + 1];
            wn[2 * i] = c * nx - s * ny; wn[2 * i + 1] = s * nx + c * ny;
            if (X < a0) a0 = X; if (X > a1) a1 = X; if (Y < b0) b0 = Y; if (Y > b1) b1 = Y;
          }
          a0 -= sh.r; b0 -= sh.r; a1 += sh.r; b1 += sh.r;
        }
        sh.minX = a0; sh.minY = b0; sh.maxX = a1; sh.maxY = b1;
        if (a0 < x0) x0 = a0; if (b0 < y0) y0 = b0; if (a1 > x1) x1 = a1; if (b1 > y1) y1 = b1;
      }
      this.minX = x0; this.minY = y0; this.maxX = x1; this.maxY = y1;
    }
    setPos(x, y, a = this.a) { this.x = x; this.y = y; this.a = a; this.sync(); this.wake(); }
    wake() { if (this.type === DYNAMIC) { this.awake = true; this.sleepTime = 0; } }
    applyImpulse(px, py, x = this.x, y = this.y) {
      if (this.type !== DYNAMIC) return;
      this.wake();
      this.vx += px * this.invM; this.vy += py * this.invM;
      this.w += this.invI * ((x - this.x) * py - (y - this.y) * px);
    }
    localPoint(x, y) { const dx = x - this.x, dy = y - this.y; return [this.c * dx + this.s * dy, -this.s * dx + this.c * dy]; }
    worldPoint(lx, ly) { return [this.x + this.c * lx - this.s * ly, this.y + this.s * lx + this.c * ly]; }
  }

  function segClosest(px, py, ax, ay, bx, by) {
    const ex = bx - ax, ey = by - ay;
    const L2 = ex * ex + ey * ey;
    let t = L2 > 0 ? ((px - ax) * ex + (py - ay) * ey) / L2 : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    return [ax + ex * t, ay + ey * t];
  }

  function segSeg(p1x, p1y, q1x, q1y, p2x, p2y, q2x, q2y) {
    const d1x = q1x - p1x, d1y = q1y - p1y, d2x = q2x - p2x, d2y = q2y - p2y;
    const rx = p1x - p2x, ry = p1y - p2y;
    const dd1 = d1x * d1x + d1y * d1y, dd2 = d2x * d2x + d2y * d2y, rd2 = rx * d2x + ry * d2y, rd1 = rx * d1x + ry * d1y;
    const eps = 1e-10;
    let f1 = 0, f2 = 0;
    if (dd1 < eps || dd2 < eps) {
      if (dd1 >= eps) { f1 = Math.min(1, Math.max(0, -rd1 / dd1)); f2 = 0; }
      else if (dd2 >= eps) { f1 = 0; f2 = Math.min(1, Math.max(0, rd2 / dd2)); }
    } else {
      const d12 = d1x * d2x + d1y * d2y;
      const denom = dd1 * dd2 - d12 * d12;
      f1 = 0;
      if (denom !== 0) f1 = Math.min(1, Math.max(0, (d12 * rd2 - rd1 * dd2) / denom));
      f2 = (d12 * f1 + rd2) / dd2;
      if (f2 < 0) { f2 = 0; f1 = Math.min(1, Math.max(0, -rd1 / dd1)); }
      else if (f2 > 1) { f2 = 1; f1 = Math.min(1, Math.max(0, (d12 - rd1) / dd1)); }
    }
    const c1x = p1x + f1 * d1x, c1y = p1y + f1 * d1y, c2x = p2x + f2 * d2x, c2y = p2y + f2 * d2y;
    return { f1, f2, c1x, c1y, c2x, c2y, d2: (c2x - c1x) ** 2 + (c2y - c1y) ** 2 };
  }

  function collideCircles(A, B, margin, out) {
    const dx = B.wx - A.wx, dy = B.wy - A.wy;
    const d = Math.hypot(dx, dy);
    const sep = d - A.r - B.r;
    if (sep > margin) return false;
    let nx = 0, ny = 1;
    if (d > 1e-9) { nx = dx / d; ny = dy / d; }
    out.nx = nx; out.ny = ny; out.count = 1;
    const p = out.pts[0];
    p.x = A.wx + nx * (A.r + sep / 2); p.y = A.wy + ny * (A.r + sep / 2); p.sep = sep; p.id = 0;
    return true;
  }

  function collidePolyCircle(A, B, margin, out) {
    const cx = B.wx, cy = B.wy, n = A.n, v = A.wv, nn = A.wn;
    let maxS = -Infinity, bi = 0;
    for (let i = 0; i < n; i++) {
      const s = nn[2 * i] * (cx - v[2 * i]) + nn[2 * i + 1] * (cy - v[2 * i + 1]);
      if (s > maxS) { maxS = s; bi = i; }
    }
    let nx, ny, sep, qx, qy;
    if (maxS <= 1e-9 && n >= 3) {
      nx = nn[2 * bi]; ny = nn[2 * bi + 1];
      sep = maxS - A.r - B.r;
      qx = cx - nx * maxS; qy = cy - ny * maxS;
    } else {
      let best = Infinity;
      qx = 0; qy = 0;
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        if (n === 2 && i === 1) break;
        const [px, py] = segClosest(cx, cy, v[2 * i], v[2 * i + 1], v[2 * j], v[2 * j + 1]);
        const d2 = (cx - px) ** 2 + (cy - py) ** 2;
        if (d2 < best) { best = d2; qx = px; qy = py; }
      }
      const d = Math.sqrt(best);
      if (d - A.r - B.r > margin) return false;
      if (d > 1e-9) { nx = (cx - qx) / d; ny = (cy - qy) / d; }
      else { nx = nn[2 * bi]; ny = nn[2 * bi + 1]; }
      sep = d - A.r - B.r;
    }
    if (sep > margin) return false;
    out.nx = nx; out.ny = ny; out.count = 1;
    const p = out.pts[0];
    p.x = qx + nx * (A.r + sep / 2); p.y = qy + ny * (A.r + sep / 2); p.sep = sep; p.id = 0;
    return true;
  }

  function maxSeparation(A, B) {
    let best = -Infinity, bi = 0;
    const na = A.n, nb = B.n, va = A.wv, vb = B.wv, nn = A.wn;
    for (let i = 0; i < na; i++) {
      const nx = nn[2 * i], ny = nn[2 * i + 1], ax = va[2 * i], ay = va[2 * i + 1];
      let si = Infinity;
      for (let j = 0; j < nb; j++) {
        const s = nx * (vb[2 * j] - ax) + ny * (vb[2 * j + 1] - ay);
        if (s < si) si = s;
      }
      if (si > best) { best = si; bi = i; }
    }
    return [best, bi];
  }

  function collidePolys(A, B, margin, out) {
    const rr = A.r + B.r;
    const [sA, eA] = maxSeparation(A, B);
    if (sA > rr + margin) return false;
    const [sB, eB] = maxSeparation(B, A);
    if (sB > rr + margin) return false;
    let ref, inc, edge, flip;
    if (sB > sA + 0.05) { ref = B; inc = A; edge = eB; flip = true; }
    else { ref = A; inc = B; edge = eA; flip = false; }
    const rn = ref.n, ivn = inc.n;
    const i1 = edge, i2 = (edge + 1) % rn;
    const nx = ref.wn[2 * edge], ny = ref.wn[2 * edge + 1];
    let j = 0, minD = Infinity;
    for (let k = 0; k < ivn; k++) {
      const d = nx * inc.wn[2 * k] + ny * inc.wn[2 * k + 1];
      if (d < minD) { minD = d; j = k; }
    }
    const j2 = (j + 1) % ivn;
    const v11x = ref.wv[2 * i1], v11y = ref.wv[2 * i1 + 1], v12x = ref.wv[2 * i2], v12y = ref.wv[2 * i2 + 1];
    const v21x = inc.wv[2 * j], v21y = inc.wv[2 * j + 1], v22x = inc.wv[2 * j2], v22y = inc.wv[2 * j2 + 1];
    const sep = Math.max(sA, sB);
    if (sep > 0.1) {
      const r = segSeg(v11x, v11y, v12x, v12y, v21x, v21y, v22x, v22y);
      const endA = r.f1 === 0 || r.f1 === 1, endB = r.f2 === 0 || r.f2 === 1;
      if (endA && endB) {
        const d = Math.sqrt(r.d2);
        if (d - rr > margin) return false;
        let mx = r.c2x - r.c1x, my = r.c2y - r.c1y;
        if (d > 1e-9) { mx /= d; my /= d; } else { mx = nx; my = ny; }
        const s = d - rr;
        if (flip) { mx = -mx; my = -my; }
        out.nx = mx; out.ny = my; out.count = 1;
        const p = out.pts[0];
        const rRef = ref.r;
        const bx = r.c1x + (flip ? -mx : mx) * (rRef + s / 2), by = r.c1y + (flip ? -my : my) * (rRef + s / 2);
        p.x = bx; p.y = by; p.sep = s; p.id = 1000 + (flip ? 500 : 0) + i1 * 16 + j;
        return true;
      }
    }
    const tx = v12x - v11x, ty = v12y - v11y;
    const tl = Math.hypot(tx, ty) || 1;
    const ux = tx / tl, uy = ty / tl;
    const lo = 0, hi = tl;
    let ax = v21x, ay = v21y, bx = v22x, by = v22y;
    let da = (ax - v11x) * ux + (ay - v11y) * uy, db = (bx - v11x) * ux + (by - v11y) * uy;
    let ida = 0, idb = 1;
    if (da < lo && db < lo) return false;
    if (da > hi && db > hi) return false;
    if (da < lo) { const t = (lo - da) / (db - da); ax += (bx - ax) * t; ay += (by - ay) * t; da = lo; ida = 2; }
    else if (db < lo) { const t = (lo - db) / (da - db); bx += (ax - bx) * t; by += (ay - by) * t; db = lo; idb = 2; }
    if (da > hi) { const t = (da - hi) / (da - db); ax += (bx - ax) * t; ay += (by - ay) * t; ida = 3; }
    else if (db > hi) { const t = (db - hi) / (db - da); bx += (ax - bx) * t; by += (ay - by) * t; idb = 3; }
    let count = 0;
    const mx = flip ? -nx : nx, my = flip ? -ny : ny;
    for (const [px, py, cid] of [[ax, ay, ida], [bx, by, idb]]) {
      const s = (px - v11x) * nx + (py - v11y) * ny - rr;
      if (s > margin) continue;
      const p = out.pts[count++];
      const off = inc.r + s / 2;
      p.x = px - nx * off; p.y = py - ny * off; p.sep = s;
      p.id = (flip ? 500 : 0) + i1 * 64 + j * 4 + cid + (count === 2 ? 4000 : 0);
    }
    if (!count) return false;
    out.nx = mx; out.ny = my; out.count = count;
    return true;
  }

  function collide(sa, sb, margin, out) {
    if (sa.type === 'c' && sb.type === 'c') { out.flip = false; return collideCircles(sa, sb, margin, out); }
    if (sa.type === 'p' && sb.type === 'c') { out.flip = false; return collidePolyCircle(sa, sb, margin, out); }
    if (sa.type === 'c' && sb.type === 'p') {
      if (!collidePolyCircle(sb, sa, margin, out)) return false;
      out.nx = -out.nx; out.ny = -out.ny; return true;
    }
    return collidePolys(sa, sb, margin, out);
  }

  const tmp = { nx: 0, ny: 0, count: 0, pts: [{ x: 0, y: 0, sep: 0, id: 0 }, { x: 0, y: 0, sep: 0, id: 0 }] };

  class World {
    constructor(o = {}) {
      this.gx = o.gx ?? 0; this.gy = o.gy ?? 1200;
      this.substeps = o.substeps ?? 4;
      this.contactHertz = o.contactHertz ?? 30;
      this.contactDamping = o.contactDamping ?? 10;
      this.jointHertz = o.jointHertz ?? 60;
      this.jointDamping = o.jointDamping ?? 2;
      this.pushout = o.pushout ?? 300;
      this.restThreshold = o.restThreshold ?? 40;
      this.sleepLin = o.sleepLin ?? 6;
      this.sleepTimeToSleep = o.sleepTime ?? 0.5;
      this.maxSpeed = o.maxSpeed ?? 4000;
      this.bodies = [];
      this.joints = [];
      this.contacts = new Map();
      this.events = [];
      this.noCollide = new Set();
      this.time = 0;
      this.sorted = [];
    }
    add(o) { const b = new Body(this, o); this.bodies.push(b); this.sorted.push(b); return b; }
    remove(b) {
      const i = this.bodies.indexOf(b); if (i < 0) return;
      this.bodies.splice(i, 1);
      this.sorted.splice(this.sorted.indexOf(b), 1);
      for (const j of this.joints.slice()) if (j.a === b || j.b === b) this.removeJoint(j);
      for (const [k, c] of this.contacts) if (c.A.body === b || c.B.body === b) this.contacts.delete(k);
      this.wakeArea(b.minX - 20, b.minY - 20, b.maxX + 20, b.maxY + 20);
    }
    clear() { this.bodies = []; this.sorted = []; this.joints = []; this.contacts.clear(); this.noCollide.clear(); }
    wakeArea(x0, y0, x1, y1) {
      for (const o of this.bodies) if (o.type === DYNAMIC && o.maxX > x0 && o.minX < x1 && o.maxY > y0 && o.minY < y1) o.wake();
    }
    pairKey(a, b) { return a.id < b.id ? a.id * 1048576 + b.id : b.id * 1048576 + a.id; }
    addJoint(o) {
      const j = { kind: o.kind ?? 'pin', a: o.a, b: o.b, la: o.la ?? [0, 0], lb: o.lb ?? [0, 0], ix: 0, iy: 0, hertz: o.hertz, damping: o.damping, maxForce: o.maxForce ?? Infinity, tx: o.tx ?? 0, ty: o.ty ?? 0, user: o.user ?? {} };
      if (o.kind !== 'mouse' && !o.collide && j.a && j.b) this.noCollide.add(this.pairKey(j.a, j.b));
      this.joints.push(j);
      if (j.a) j.a.wake(); if (j.b) j.b.wake();
      return j;
    }
    pinWorld(b, x, y, o = {}) {
      if (!this.ground) this.ground = this.add({ type: STATIC, shapes: [], user: { ground: true } });
      return this.addJoint({ ...o, a: this.ground, b, la: [x, y], lb: b.localPoint(x, y) });
    }
    mouseJoint(b, x, y, o = {}) {
      return this.addJoint({ kind: 'mouse', a: null, b, lb: b.localPoint(x, y), tx: x, ty: y, hertz: o.hertz ?? 5, damping: o.damping ?? 0.7, maxForce: o.maxForce ?? b.m * 50000 });
    }
    removeJoint(j) {
      const i = this.joints.indexOf(j); if (i >= 0) this.joints.splice(i, 1);
      if (j.a && j.b && j.kind !== 'mouse') this.noCollide.delete(this.pairKey(j.a, j.b));
      if (j.a) j.a.wake(); if (j.b) j.b.wake();
    }
    queryPoint(x, y, filter) {
      for (let i = this.bodies.length - 1; i >= 0; i--) {
        const b = this.bodies[i];
        if (filter && !filter(b)) continue;
        if (x < b.minX || x > b.maxX || y < b.minY || y > b.maxY) continue;
        for (const sh of b.shapes) if (shapeContains(sh, x, y)) return b;
      }
      return null;
    }
    findPairs(dt) {
      const list = this.sorted;
      for (const b of list) {
        if (b.type !== STATIC && b.awake !== false) {
          const sp = (Math.abs(b.vx) + Math.abs(b.vy) + Math.abs(b.w) * b.extent) * dt;
          b.fx0 = b.minX - sp; b.fx1 = b.maxX + sp; b.fy0 = b.minY - sp; b.fy1 = b.maxY + sp;
        } else { b.fx0 = b.minX; b.fx1 = b.maxX; b.fy0 = b.minY; b.fy1 = b.maxY; }
      }
      for (let i = 1; i < list.length; i++) {
        const b = list[i]; let j = i - 1;
        while (j >= 0 && list[j].fx0 > b.fx0) { list[j + 1] = list[j]; j--; }
        list[j + 1] = b;
      }
      const pairs = [];
      for (let i = 0; i < list.length; i++) {
        const a = list[i];
        const aActive = (a.type === DYNAMIC && a.awake) || (a.type === KINEMATIC);
        const aDyn = a.type === DYNAMIC;
        for (let j = i + 1; j < list.length; j++) {
          const b = list[j];
          if (b.fx0 > a.fx1) break;
          if (b.fy0 > a.fy1 || b.fy1 < a.fy0) continue;
          const bActive = (b.type === DYNAMIC && b.awake) || (b.type === KINEMATIC);
          const bDyn = b.type === DYNAMIC;
          if (!aDyn && !bDyn) continue;
          if (!aActive && !bActive) continue;
          if (a.group && a.group === b.group) continue;
          if (this.noCollide.size && this.noCollide.has(this.pairKey(a, b))) continue;
          pairs.push(a, b);
        }
      }
      return pairs;
    }
    narrow(dt) {
      const pairs = this.findPairs(dt);
      const old = this.contacts;
      const next = new Map();
      const spec = 2;
      for (let p = 0; p < pairs.length; p += 2) {
        let a = pairs[p], b = pairs[p + 1];
        if (a.id > b.id) { const t = a; a = b; b = t; }
        const rel = (Math.hypot(a.vx - b.vx, a.vy - b.vy) + Math.abs(a.w) * a.extent + Math.abs(b.w) * b.extent) * dt;
        const margin = spec + rel;
        for (const sa of a.shapes) {
          if (sa.maxX + margin < b.minX || sa.minX - margin > b.maxX || sa.maxY + margin < b.minY || sa.minY - margin > b.maxY) continue;
          for (const sb of b.shapes) {
            if (sa.maxX + margin < sb.minX || sa.minX - margin > sb.maxX || sa.maxY + margin < sb.minY || sa.minY - margin > sb.maxY) continue;
            if (!collide(sa, sb, margin, tmp)) continue;
            const key = sa.uid * 1048576 + sb.uid;
            const prev = old.get(key);
            const sensor = a.sensor || b.sensor || sa.sensor || sb.sensor;
            const c = { A: sa, B: sb, a, b, nx: tmp.nx, ny: tmp.ny, count: tmp.count, pts: [], sensor, isNew: !prev, friction: Math.sqrt((sa.friction ?? a.friction) * (sb.friction ?? b.friction)), restitution: Math.max(sa.restitution ?? a.restitution, sb.restitution ?? b.restitution) };
            for (let k = 0; k < tmp.count; k++) {
              const t = tmp.pts[k];
              const cp = { x: t.x, y: t.y, sep: t.sep, id: t.id, ni: 0, ti: 0, maxNi: 0 };
              if (prev) for (const q of prev.pts) if (q.id === t.id) { cp.ni = q.ni; cp.ti = q.ti; break; }
              c.pts.push(cp);
            }
            next.set(key, c);
          }
        }
      }
      this.contacts = next;
    }
    islands(dt) {
      const dyn = [];
      for (const b of this.bodies) if (b.type === DYNAMIC) { b.isl = b; dyn.push(b); }
      const find = (b) => { while (b.isl !== b) { b.isl = b.isl.isl; b = b.isl; } return b; };
      const union = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) ra.isl = rb; };
      for (const c of this.contacts.values()) {
        if (c.sensor) continue;
        if (c.a.type === DYNAMIC && c.b.type === DYNAMIC) { union(c.a, c.b); continue; }
        let touching = false;
        for (const p of c.pts) if (p.sep < 1) { touching = true; break; }
        if (!touching) continue;
        if (c.a.type === KINEMATIC && (c.a.vx || c.a.vy || c.a.w)) c.b.sleepTime = 0;
        else if (c.b.type === KINEMATIC && (c.b.vx || c.b.vy || c.b.w)) c.a.sleepTime = 0;
      }
      for (const j of this.joints) {
        if (j.kind === 'mouse') { if (j.b) j.b.sleepTime = 0; continue; }
        if (j.a && j.b && j.a.type === DYNAMIC && j.b.type === DYNAMIC) union(j.a, j.b);
      }
      for (const b of dyn) { const r = find(b); r.islMin = Infinity; }
      for (const b of dyn) { const r = find(b); if (b.sleepTime < r.islMin) r.islMin = b.sleepTime; }
      for (const b of dyn) {
        const r = find(b);
        const sleep = r.islMin >= this.sleepTimeToSleep;
        if (sleep) { if (b.awake) { b.awake = false; b.vx = 0; b.vy = 0; b.w = 0; b.dpx = 0; b.dpy = 0; b.da = 0; b.dc = 1; b.ds = 0; } }
        else b.awake = true;
      }
    }
    step(dt) {
      this.events.length = 0;
      if (dt <= 0) return;
      const h = dt / this.substeps, ih = 1 / h;
      this.narrow(dt);
      this.islands(dt);
      const contactSoft = softness(Math.min(this.contactHertz, 0.25 / h), this.contactDamping, h);
      const staticSoft = softness(2 * Math.min(this.contactHertz, 0.25 / h), this.contactDamping, h);
      const jointSoft = softness(Math.min(this.jointHertz, 0.5 / h), this.jointDamping, h);
      const movers = this.bodies.filter((b) => (b.type === DYNAMIC && b.awake) || b.type === KINEMATIC);
      const cons = [];
      for (const c of this.contacts.values()) {
        const a = c.a, b = c.b;
        const aOn = a.type === DYNAMIC ? a.awake : a.type === KINEMATIC;
        const bOn = b.type === DYNAMIC ? b.awake : b.type === KINEMATIC;
        if (!aOn && !bOn) continue;
        const nx = c.nx, ny = c.ny, tx = -ny, ty = nx;
        const mA = a.invM, mB = b.invM, iA = a.invI, iB = b.invI;
        for (const p of c.pts) {
          p.rAx = p.x - a.x; p.rAy = p.y - a.y; p.rBx = p.x - b.x; p.rBy = p.y - b.y;
          const rnA = p.rAx * ny - p.rAy * nx, rnB = p.rBx * ny - p.rBy * nx;
          const kN = mA + mB + iA * rnA * rnA + iB * rnB * rnB;
          p.nm = kN > 0 ? 1 / kN : 0;
          const rtA = p.rAx * ty - p.rAy * tx, rtB = p.rBx * ty - p.rBy * tx;
          const kT = mA + mB + iA * rtA * rtA + iB * rtB * rtB;
          p.tm = kT > 0 ? 1 / kT : 0;
          p.adj = p.sep - ((p.rBx - p.rAx) * nx + (p.rBy - p.rAy) * ny);
          const dvx = b.vx - b.w * p.rBy - a.vx + a.w * p.rAy;
          const dvy = b.vy + b.w * p.rBx - a.vy - a.w * p.rAx;
          p.rv = dvx * nx + dvy * ny;
          p.maxNi = 0;
          if (c.isNew && !c.sensor && p.rv < -this.restThreshold && p.sep < 3) this.events.push({ a, b, c, x: p.x, y: p.y, speed: -p.rv });
        }
        c.soft = a.type === DYNAMIC && b.type === DYNAMIC ? contactSoft : staticSoft;
        if (c.sensor) { if (c.isNew) this.events.push({ a, b, c, x: c.pts[0].x, y: c.pts[0].y, speed: Math.max(0, -c.pts[0].rv), sensor: true }); continue; }
        cons.push(c);
      }
      const js = [];
      for (const j of this.joints) {
        const a = j.a, b = j.b;
        const aOn = a && (a.type === DYNAMIC ? a.awake : a.type === KINEMATIC);
        const bOn = b && (b.type === DYNAMIC ? b.awake : b.type === KINEMATIC);
        if (!aOn && !bOn) continue;
        if (a) { j.rAx = a.c * j.la[0] - a.s * j.la[1]; j.rAy = a.s * j.la[0] + a.c * j.la[1]; } else { j.rAx = 0; j.rAy = 0; }
        j.rBx = b.c * j.lb[0] - b.s * j.lb[1]; j.rBy = b.s * j.lb[0] + b.c * j.lb[1];
        j.dcx = b.x - (a ? a.x : j.tx); j.dcy = b.y - (a ? a.y : j.ty);
        j.soft = j.kind === 'mouse' ? softness(j.hertz, j.damping, h) : (j.hertz ? softness(j.hertz, j.damping ?? 1, h) : jointSoft);
        if (j.kind === 'mouse') { j.ix = 0; j.iy = 0; }
        js.push(j);
      }
      for (const b of movers) { b.dpx = 0; b.dpy = 0; b.da = 0; b.dc = 1; b.ds = 0; }
      const gx = this.gx, gy = this.gy, maxV = this.maxSpeed;
      for (let s = 0; s < this.substeps; s++) {
        for (const b of movers) {
          if (b.type !== DYNAMIC) continue;
          b.vx += gx * b.gravityScale * h; b.vy += gy * b.gravityScale * h;
          if (b.linDamp) { const f = 1 / (1 + h * b.linDamp); b.vx *= f; b.vy *= f; }
          if (b.angDamp) b.w *= 1 / (1 + h * b.angDamp);
          const v2 = b.vx * b.vx + b.vy * b.vy;
          if (v2 > maxV * maxV) { const f = maxV / Math.sqrt(v2); b.vx *= f; b.vy *= f; }
          const wm = 0.25 * Math.PI * ih;
          if (b.w > wm) b.w = wm; else if (b.w < -wm) b.w = -wm;
        }
        for (const j of js) warmJoint(j);
        for (const c of cons) warmContact(c);
        for (const j of js) solveJoint(j, true, jointSoft, ih);
        for (const c of cons) solveContact(c, true, ih, this.pushout);
        for (const b of movers) {
          b.x += b.vx * h; b.y += b.vy * h; b.a += b.w * h;
          b.dpx += b.vx * h; b.dpy += b.vy * h; b.da += b.w * h;
          b.dc = Math.cos(b.da); b.ds = Math.sin(b.da);
        }
        for (const j of js) solveJoint(j, false, jointSoft, ih);
        for (const c of cons) solveContact(c, false, ih, this.pushout);
      }
      for (const c of cons) applyRestitution(c, this.restThreshold);
      const lin = this.sleepLin;
      for (const b of movers) {
        b.sync();
        if (b.type === DYNAMIC) {
          const v = Math.hypot(b.vx, b.vy) + Math.abs(b.w) * b.extent;
          if (v > lin || b.noSleep) b.sleepTime = 0; else b.sleepTime += dt;
        }
      }
      this.time += dt;
    }
  }

  function shapeContains(sh, x, y) {
    if (sh.type === 'c') return (x - sh.wx) ** 2 + (y - sh.wy) ** 2 <= sh.r * sh.r;
    const n = sh.n, v = sh.wv, nn = sh.wn;
    if (n >= 3) {
      let inside = true;
      for (let i = 0; i < n; i++) if (nn[2 * i] * (x - v[2 * i]) + nn[2 * i + 1] * (y - v[2 * i + 1]) > 0) { inside = false; break; }
      if (inside) return true;
    }
    const lim = Math.max(sh.r, 0);
    if (lim <= 0) return false;
    for (let i = 0; i < n; i++) {
      if (n === 2 && i === 1) break;
      const j = (i + 1) % n;
      const [px, py] = segClosest(x, y, v[2 * i], v[2 * i + 1], v[2 * j], v[2 * j + 1]);
      if ((x - px) ** 2 + (y - py) ** 2 <= lim * lim) return true;
    }
    return false;
  }

  function warmContact(c) {
    const a = c.a, b = c.b, nx = c.nx, ny = c.ny, tx = -ny, ty = nx;
    for (const p of c.pts) {
      const Px = p.ni * nx + p.ti * tx, Py = p.ni * ny + p.ti * ty;
      if (a.invM || a.invI) { a.vx -= a.invM * Px; a.vy -= a.invM * Py; a.w -= a.invI * (p.rAx * Py - p.rAy * Px); }
      if (b.invM || b.invI) { b.vx += b.invM * Px; b.vy += b.invM * Py; b.w += b.invI * (p.rBx * Py - p.rBy * Px); }
    }
  }

  function solveContact(c, useBias, ih, pushout) {
    const a = c.a, b = c.b, nx = c.nx, ny = c.ny, tx = -ny, ty = nx;
    const mA = a.invM, mB = b.invM, iA = a.invI, iB = b.invI;
    const soft = c.soft;
    for (const p of c.pts) {
      const cRAx = a.dc * p.rAx - a.ds * p.rAy, cRAy = a.ds * p.rAx + a.dc * p.rAy;
      const cRBx = b.dc * p.rBx - b.ds * p.rBy, cRBy = b.ds * p.rBx + b.dc * p.rBy;
      const dx = b.dpx - a.dpx + cRBx - cRAx, dy = b.dpy - a.dpy + cRBy - cRAy;
      const s = dx * nx + dy * ny + p.adj;
      let bias = 0, ms = 1, is = 0;
      if (s > 0) bias = s * ih;
      else if (useBias) { bias = Math.max(soft.biasRate * s, -pushout); ms = soft.massScale; is = soft.impulseScale; }
      const dvx = b.vx - b.w * p.rBy - a.vx + a.w * p.rAy;
      const dvy = b.vy + b.w * p.rBx - a.vy - a.w * p.rAx;
      const vn = dvx * nx + dvy * ny;
      let imp = -p.nm * ms * (vn + bias) - is * p.ni;
      const ni = Math.max(p.ni + imp, 0);
      imp = ni - p.ni; p.ni = ni;
      if (imp > p.maxNi) p.maxNi = imp;
      const Px = imp * nx, Py = imp * ny;
      a.vx -= mA * Px; a.vy -= mA * Py; a.w -= iA * (p.rAx * Py - p.rAy * Px);
      b.vx += mB * Px; b.vy += mB * Py; b.w += iB * (p.rBx * Py - p.rBy * Px);
    }
    const f = c.friction;
    for (const p of c.pts) {
      const dvx = b.vx - b.w * p.rBy - a.vx + a.w * p.rAy;
      const dvy = b.vy + b.w * p.rBx - a.vy - a.w * p.rAx;
      const vt = dvx * tx + dvy * ty;
      let imp = -p.tm * vt;
      const maxF = f * p.ni;
      const ti = Math.max(-maxF, Math.min(maxF, p.ti + imp));
      imp = ti - p.ti; p.ti = ti;
      const Px = imp * tx, Py = imp * ty;
      a.vx -= mA * Px; a.vy -= mA * Py; a.w -= iA * (p.rAx * Py - p.rAy * Px);
      b.vx += mB * Px; b.vy += mB * Py; b.w += iB * (p.rBx * Py - p.rBy * Px);
    }
  }

  function applyRestitution(c, thr) {
    const e = c.restitution;
    if (e === 0) return;
    const a = c.a, b = c.b, nx = c.nx, ny = c.ny;
    for (const p of c.pts) {
      if (p.rv > -thr || p.maxNi === 0) continue;
      const dvx = b.vx - b.w * p.rBy - a.vx + a.w * p.rAy;
      const dvy = b.vy + b.w * p.rBx - a.vy - a.w * p.rAx;
      const vn = dvx * nx + dvy * ny;
      let imp = -p.nm * (vn + e * p.rv);
      const ni = Math.max(p.ni + imp, 0);
      imp = ni - p.ni; p.ni = ni;
      const Px = imp * nx, Py = imp * ny;
      a.vx -= a.invM * Px; a.vy -= a.invM * Py; a.w -= a.invI * (p.rAx * Py - p.rAy * Px);
      b.vx += b.invM * Px; b.vy += b.invM * Py; b.w += b.invI * (p.rBx * Py - p.rBy * Px);
    }
  }

  const NOBODY = { invM: 0, invI: 0, vx: 0, vy: 0, w: 0, dpx: 0, dpy: 0, dc: 1, ds: 0, x: 0, y: 0 };

  function warmJoint(j) {
    const a = j.a || NOBODY, b = j.b;
    const rAx = a.dc * j.rAx - a.ds * j.rAy, rAy = a.ds * j.rAx + a.dc * j.rAy;
    const rBx = b.dc * j.rBx - b.ds * j.rBy, rBy = b.ds * j.rBx + b.dc * j.rBy;
    a.vx -= a.invM * j.ix; a.vy -= a.invM * j.iy; a.w -= a.invI * (rAx * j.iy - rAy * j.ix);
    b.vx += b.invM * j.ix; b.vy += b.invM * j.iy; b.w += b.invI * (rBx * j.iy - rBy * j.ix);
  }

  function solveJoint(j, useBias, soft, ih) {
    const a = j.a || NOBODY, b = j.b;
    const rAx = a.dc * j.rAx - a.ds * j.rAy, rAy = a.ds * j.rAx + a.dc * j.rAy;
    const rBx = b.dc * j.rBx - b.ds * j.rBy, rBy = b.ds * j.rBx + b.dc * j.rBy;
    const cdx = b.vx - b.w * rBy - a.vx + a.w * rAy;
    const cdy = b.vy + b.w * rBx - a.vy - a.w * rAx;
    let bx = 0, by = 0, ms = 1, is = 0;
    const mouse = j.kind === 'mouse';
    if (useBias || mouse) {
      const sx = (b.dpx - a.dpx) + (rBx - rAx) + j.dcx;
      const sy = (b.dpy - a.dpy) + (rBy - rAy) + j.dcy;
      const s = mouse ? j.soft : j.soft || soft;
      bx = s.biasRate * sx; by = s.biasRate * sy; ms = s.massScale; is = s.impulseScale;
    }
    const mA = a.invM, mB = b.invM, iA = a.invI, iB = b.invI;
    const k11 = mA + mB + rAy * rAy * iA + rBy * rBy * iB;
    const k12 = -rAy * rAx * iA - rBy * rBx * iB;
    const k22 = mA + mB + rAx * rAx * iA + rBx * rBx * iB;
    let det = k11 * k22 - k12 * k12;
    if (det === 0) return;
    det = 1 / det;
    const vx = cdx + bx, vy = cdy + by;
    const sx = det * (k22 * vx - k12 * vy), sy = det * (k11 * vy - k12 * vx);
    let ix = -ms * sx - is * j.ix, iy = -ms * sy - is * j.iy;
    let nix = j.ix + ix, niy = j.iy + iy;
    if (j.maxForce !== Infinity) {
      const lim = j.maxForce / ih;
      const L = Math.hypot(nix, niy);
      if (L > lim) { nix *= lim / L; niy *= lim / L; }
    }
    ix = nix - j.ix; iy = niy - j.iy; j.ix = nix; j.iy = niy;
    a.vx -= mA * ix; a.vy -= mA * iy; a.w -= iA * (rAx * iy - rAy * ix);
    b.vx += mB * ix; b.vy += mB * iy; b.w += iB * (rBx * iy - rBy * ix);
  }

  function convexHull(pts) {
    const p = pts.slice().sort((u, v) => u[0] - v[0] || u[1] - v[1]);
    if (p.length < 3) return p;
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    up.pop(); lo.pop();
    return lo.concat(up);
  }

  window.Phys = { World, Body, STATIC, KINEMATIC, DYNAMIC, makeCircle, makePoly, makeBox, makeCapsule, convexHull, shapeContains, segClosest };
})();
