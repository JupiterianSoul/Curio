(function (root) {
  const BW = 1000, BH = 625;
  const KIND = {
    b: { r: 14, R: 72, name: 'Fizzer' },
    big: { r: 19, R: 124, name: 'Big fizzer' },
    tiny: { r: 10, R: 44, name: 'Tiny fizzer' },
    rk: { r: 14, R: 34, name: 'Rocket' },
    sh: { r: 16, R: 72, hp: 2, name: 'Shielded' },
    dud: { r: 15, R: 72, name: 'Dud' },
    tm: { r: 15, R: 84, name: 'Timer' }
  };
  const SPARK_R = 62, GROW = .26, LIFE = .5, BEAM_V = 1100, BEAM_W = 10;

  function World(level) {
    this.t = 0; this.blasts = []; this.beams = []; this.ids = 0; this.events = [];
    this.pieces = level.p.map((q, i) => {
      const k = KIND[q.t] || KIND.b;
      return { i, t: q.t, x: q.x, y: q.y, a: q.a || 0, d: q.d || 1.2, mv: q.mv || null, r: k.r, R: k.R, hp: k.hp || 1, alive: true, popAt: null, hits: new Set(), crackT: -1 };
    });
    this.moveTo(0);
  }
  World.prototype.moveTo = function (t) {
    for (const p of this.pieces) if (p.mv && p.alive && (p.popAt == null || p.t === 'tm')) {
      const m = p.mv;
      if (m.k === 'line') { const u = (Math.sin(t * m.s + (m.ph || 0)) + 1) / 2; p.x = m.x0 + (m.x1 - m.x0) * u; p.y = m.y0 + (m.y1 - m.y0) * u; }
      else { const a = t * m.s + (m.ph || 0); p.x = m.cx + Math.cos(a) * m.r; p.y = m.cy + Math.sin(a) * m.r; }
    }
  };
  World.prototype.spark = function (x, y) {
    this.blasts.push({ id: ++this.ids, x, y, R: SPARK_R, r: 0, age: 0, src: -1 });
    this.events.push({ k: 'spark', x, y });
  };
  World.prototype.hit = function (p, id) {
    if (!p.alive || p.popAt != null || p.hits.has(id)) return;
    p.hits.add(id);
    p.hp--;
    if (p.hp > 0) { p.crackT = this.t; this.events.push({ k: 'crack', p }); return; }
    p.popAt = this.t + (p.t === 'tm' ? p.d : .07);
    if (p.t === 'tm') this.events.push({ k: 'arm', p });
  };
  World.prototype.pop = function (p) {
    p.alive = false;
    this.events.push({ k: 'pop', p });
    this.blasts.push({ id: ++this.ids, x: p.x, y: p.y, R: p.R, r: 0, age: 0, src: p.i, kind: p.t });
    if (p.t === 'rk') {
      const a = p.a * Math.PI / 180;
      this.beams.push({ id: ++this.ids, x: p.x, y: p.y, dx: Math.cos(a), dy: Math.sin(a), len: 0, max: 1400, src: p.i });
    }
  };
  World.prototype.step = function (dt) {
    this.t += dt;
    this.moveTo(this.t);
    for (const p of this.pieces) if (p.alive && p.popAt != null && p.popAt <= this.t) this.pop(p);
    for (const b of this.blasts) {
      b.age += dt;
      b.r = b.R * Math.min(1, b.age / GROW);
      for (const p of this.pieces) {
        if (!p.alive || p.i === b.src) continue;
        const dx = p.x - b.x, dy = p.y - b.y, rr = b.r + p.r;
        if (dx * dx + dy * dy <= rr * rr) this.hit(p, b.id);
      }
    }
    this.blasts = this.blasts.filter((b) => b.age < LIFE);
    for (const m of this.beams) {
      const old = m.len;
      m.len = Math.min(m.max, m.len + BEAM_V * dt);
      const ex = m.x + m.dx * m.len, ey = m.y + m.dy * m.len;
      if (ex < -20 || ey < -20 || ex > BW + 20 || ey > BH + 20) m.len = m.max;
      for (const p of this.pieces) {
        if (!p.alive || p.i === m.src) continue;
        const px = p.x - m.x, py = p.y - m.y, along = px * m.dx + py * m.dy;
        if (along < old - p.r || along > m.len + p.r) continue;
        const perp = Math.abs(px * m.dy - py * m.dx);
        if (perp <= BEAM_W + p.r) this.hit(p, m.id);
      }
      m.done = m.len >= m.max;
      m.age = (m.age || 0) + dt;
    }
    this.beams = this.beams.filter((m) => !m.done || (m.fade = (m.fade || 0) + dt) < .25);
  };
  World.prototype.busy = function () {
    return this.blasts.length > 0 || this.beams.some((m) => !m.done) || this.pieces.some((p) => p.alive && p.popAt != null);
  };
  World.prototype.score = function () {
    let left = 0, duds = 0, popped = 0;
    for (const p of this.pieces) { if (p.t === 'dud') { if (!p.alive) duds++; } else if (p.alive) left++; else popped++; }
    return { left, duds, popped };
  };
  function simulate(level, clicks) {
    const w = new World(level);
    for (const c of clicks) {
      w.spark(c.x, c.y);
      let guard = 0;
      do { w.step(1 / 60); guard++; } while (w.busy() && guard < 2000);
    }
    return w.score();
  }
  function bestClick(level, prior, step) {
    let best = null;
    step = step || 20;
    for (let y = step / 2; y < BH; y += step) for (let x = step / 2; x < BW; x += step) {
      const s = simulate(level, [...(prior || []), { x, y }]);
      let near = 1e9;
      for (const q of level.p) near = Math.min(near, Math.hypot(q.x - x, q.y - y));
      const val = s.popped * 10 - s.duds * 1000 - near * .001;
      if (!best || val > best.val) best = { x, y, val, s };
    }
    return best;
  }
  root.FZ = { BW, BH, KIND, SPARK_R, World, simulate, bestClick };
})(typeof window !== 'undefined' ? window : globalThis);
