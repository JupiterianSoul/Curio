(() => {
  const W = 640, H = 480, MAX = 2400, CELL = 4, KEY = 'water-toy:scene';
  const GRAV = 0.4, SUB = 2, DT = 0.5, MAXTILT = 0.52;
  const canvas = document.getElementById('tank');
  const g = canvas.getContext('2d');
  const stage = document.getElementById('stage');
  const intro = document.getElementById('intro');
  const tagEl = document.getElementById('tag');
  const tiltR = document.getElementById('tiltR');

  let fluid, walls = [], bodies = [], actions = [], tool = 'pour', paused = false, tapOn = false;
  let tilt = 0, tiltT = 0, phoneTilt = null, slosh = 0;
  let scale = 1, cx = 0, cy = 0, dpr = 1, cw = 0, ch = 0, simTime = 0, audioOk = false, touched = false, fullWarned = false;

  const FW = W / CELL, FH = H / CELL;
  const field = new Float32Array(FW * FH), fspd = new Float32Array(FW * FH);
  const off = document.createElement('canvas'); off.width = FW; off.height = FH;
  const og = off.getContext('2d');
  const img = og.createImageData(FW, FH);
  const pix = new Uint32Array(img.data.buffer);
  const KR = 2.7, KN = 3;
  const kern = [];
  for (let j = -KN; j <= KN; j++) for (let i = -KN; i <= KN; i++) { const d2 = (i * i + j * j) / (KR * KR); kern.push(d2 < 1 ? (1 - d2) * (1 - d2) : 0); }

  let ac = null, master = null, budget = 0;
  function audio() {
    if (Curio.muted || !audioOk) return null;
    ac = Curio.audioContext(); if (!ac) return null;
    if (!master) { master = ac.createDynamicsCompressor(); master.connect(ac.destination); }
    return ac;
  }
  function tone(freq, dur, type, vol, glide, delay = 0) {
    const a = audio(); if (!a || budget <= 0) return;
    budget--;
    const t = a.currentTime + delay;
    const o = a.createOscillator(), gn = a.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + dur);
    gn.gain.setValueAtTime(0.0001, t); gn.gain.linearRampToValueAtTime(vol, t + 0.006); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(gn).connect(master); o.start(t); o.stop(t + dur + 0.03);
  }
  let noiseBuf = null;
  function splashNoise(vol, dur = 0.35) {
    const a = audio(); if (!a || budget <= 0) return;
    budget--;
    if (!noiseBuf) { noiseBuf = a.createBuffer(1, a.sampleRate * 0.5, a.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const s = a.createBufferSource(); s.buffer = noiseBuf;
    const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 0.7;
    const gn = a.createGain(); const t = a.currentTime;
    gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(gn).connect(master); s.start(t); s.stop(t + dur);
  }
  const SND = {
    drip: () => tone(Curio.rand(700, 1400), 0.06, 'sine', 0.035, Curio.rand(1500, 2200)),
    bloop: (v) => { tone(Curio.rand(180, 260), 0.18, 'sine', Math.min(0.2, 0.06 + v / 40), 520); splashNoise(Math.min(0.12, 0.03 + v / 80)); },
    squeak: () => { tone(1500, 0.12, 'square', 0.04, 2100); tone(1900, 0.1, 'sine', 0.05, 1300, 0.1); },
    clunk: (v) => tone(Curio.rand(90, 120), 0.12, 'sine', Math.min(0.2, v / 30)),
    pop: () => tone(500, 0.07, 'sine', 0.06, 900),
    slosh: () => splashNoise(0.08, 0.6)
  };

  function newFluid() { fluid = new window.Fluid(W, H, MAX, { h: 24, rho0: 5, k: 0.08, kn: 0.2, beta: 0.08, sigma: 0.02 }); fluid.bodies = bodies; fluid.setSegments(walls); }
  function fillBlock(n, x0 = 10, x1 = W - 10) {
    const cols = Math.floor((x1 - x0) / 7);
    for (let i = 0; i < n; i++) fluid.add(x0 + (i % cols) * 7 + Math.random(), H - 8 - Math.floor(i / cols) * 7);
  }
  function makeBody(kind, x, y) {
    const b = kind === 'duck'
      ? { kind, x, y, vx: 0, vy: 0, a: 0, w: 0, r: 20, m: 16, dens: 0.35, fx: 0, fy: 0, sub: 0, frac: 0, id: Math.random() * 10 }
      : { kind, x, y, vx: 0, vy: 0, a: Math.random() * 6, w: 0, r: 17 + Math.random() * 6, m: 90, dens: 3, fx: 0, fy: 0, sub: 0, frac: 0, id: Math.random() * 10, shape: Array.from({ length: 9 }, () => 0.82 + Math.random() * 0.22) };
    bodies.push(b);
    return b;
  }
  function defaultScene() {
    walls = []; bodies.length = 0; actions = [];
    newFluid();
    fillBlock(1500);
    makeBody('duck', 200, 200); makeBody('duck', 420, 160); makeBody('rock', 520, 120);
    walls.push({ x1: 300, y1: 150, x2: 380, y2: 190, r: 6 });
    fluid.setSegments(walls);
    setTilt(0);
  }
  function save() {
    Curio.store.set(KEY, { walls: walls.map((s) => [s.x1, s.y1, s.x2, s.y2].map(Math.round)), bodies: bodies.map((b) => [b.kind, Math.round(b.x), Math.round(b.y)]), n: fluid.n, tilt: +tiltT.toFixed(3) });
  }
  function restore(sc) {
    walls = (sc.walls || []).map(([x1, y1, x2, y2]) => ({ x1, y1, x2, y2, r: 6 }));
    bodies.length = 0;
    for (const [k, x, y] of sc.bodies || []) if (k === 'duck' || k === 'rock') makeBody(k, x, y);
    newFluid();
    fillBlock(Math.min(MAX, Math.max(0, sc.n | 0)));
    setTilt(sc.tilt || 0);
  }

  function setTilt(t, fromSlider) {
    tiltT = Math.max(-MAXTILT, Math.min(MAXTILT, t));
    if (!fromSlider) tiltR.value = String(Math.round(tiltT * 180 / Math.PI));
  }

  function fit() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = stage.getBoundingClientRect();
    cw = r.width; ch = r.height;
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    const top = cw < 560 ? 70 : 20;
    scale = Math.min((cw - 16) / (W * 1.12), (ch - top - 10) / (H * 1.18));
    cx = cw / 2; cy = top + (ch - top) / 2;
  }
  function toLocal(px, py) {
    const dx = (px - cx) / scale, dy = (py - cy) / scale;
    const c = Math.cos(-tilt), s = Math.sin(-tilt);
    return [dx * c - dy * s + W / 2, dx * s + dy * c + H / 2];
  }

  function stepBodies(gx, gy) {
    const dt = DT;
    for (const b of bodies) {
      if (b.held) {
        b.vx = (b.hx - b.x) * 0.3; b.vy = (b.hy - b.y) * 0.3;
        b.x += b.vx; b.y += b.vy; b.fx = 0; b.fy = 0;
        continue;
      }
      const ratio = 1 / b.dens;
      const buoy = b.frac * ratio;
      b.vx += gx * dt * (1 - buoy); b.vy += gy * dt * (1 - buoy);
      const k = 0.55 / (1 + b.m * 0.01);
      b.vx += b.fx * k / dt; b.vy += b.fy * k / dt;
      b.fx = 0; b.fy = 0;
      const drag = 1 - Math.min(0.2, 0.05 * b.frac * dt * (b.kind === 'duck' ? 1.6 : 0.6));
      b.vx *= drag; b.vy *= drag;
      const sp = Math.hypot(b.vx, b.vy); if (sp > 22) { b.vx *= 22 / sp; b.vy *= 22 / sp; }
      b.x += b.vx * dt; b.y += b.vy * dt;
      let floor = false;
      if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) * 0.3; }
      if (b.x > W - b.r) { b.x = W - b.r; b.vx = -Math.abs(b.vx) * 0.3; }
      if (b.y < b.r) { b.y = b.r; b.vy = Math.abs(b.vy) * 0.3; }
      if (b.y > H - b.r) { if (b.vy > 3 && b.kind === 'rock') budgetSound(() => SND.clunk(b.vy)); b.y = H - b.r; b.vy = -Math.abs(b.vy) * 0.2; floor = true; }
      for (const s of walls) {
        const ex = s.x2 - s.x1, ey = s.y2 - s.y1, L2 = ex * ex + ey * ey || 1e-6;
        let u = ((b.x - s.x1) * ex + (b.y - s.y1) * ey) / L2; u = u < 0 ? 0 : u > 1 ? 1 : u;
        const px = s.x1 + ex * u, py = s.y1 + ey * u, dx = b.x - px, dy = b.y - py, d = Math.hypot(dx, dy), rr = b.r + s.r;
        if (d >= rr || d === 0) continue;
        const nx = dx / d, ny = dy / d;
        b.x = px + nx * rr; b.y = py + ny * rr;
        const vn = b.vx * nx + b.vy * ny;
        if (vn < 0) { b.vx -= vn * nx * 1.25; b.vy -= vn * ny * 1.25; b.vx *= 0.97; b.vy *= 0.97; }
        floor = true;
      }
      const gl = Math.hypot(gx, gy) || 1;
      const phi = Math.atan2(gx, gy);
      if (b.kind === 'duck') {
        const target = -phi + Math.sin(simTime * 1.7 + b.id) * 0.12 * b.frac;
        let da = target - b.a; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
        b.w += da * 0.02 * dt - b.w * 0.08 * dt;
      } else if (floor) {
        const tx = -gy / gl, ty = gx / gl;
        b.w += ((b.vx * tx + b.vy * ty) / b.r - b.w) * 0.3;
      } else b.w *= 0.995;
      b.a += b.w * dt;
    }
    for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i], b = bodies[j];
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), rr = a.r + b.r;
      if (d >= rr || d === 0) continue;
      const nx = dx / d, ny = dy / d, pen = rr - d;
      const wa = a.held ? 0 : 1 / a.m, wb = b.held ? 0 : 1 / b.m, w = wa + wb; if (!w) continue;
      a.x -= nx * pen * wa / w; a.y -= ny * pen * wa / w; b.x += nx * pen * wb / w; b.y += ny * pen * wb / w;
      const vn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
      if (vn < 0) { const j2 = -1.3 * vn / w; a.vx -= j2 * wa * nx; a.vy -= j2 * wa * ny; b.vx += j2 * wb * nx; b.vy += j2 * wb * ny; }
    }
  }
  let sndQueue = [];
  function budgetSound(fn) { sndQueue.push(fn); }

  function measureSubmersion() {
    const n = fluid.n, X = fluid.x, Y = fluid.y;
    for (const b of bodies) {
      const R = b.r + 10, R2 = R * R;
      let c = 0;
      for (let i = 0; i < n; i++) { const dx = X[i] - b.x, dy = Y[i] - b.y; if (dx * dx + dy * dy < R2) c++; }
      const expected = Math.PI * (R * R - b.r * b.r * 0.85) / 36;
      const prev = b.frac;
      b.frac = Math.min(1, c / expected);
      const vin = Math.hypot(b.vx, b.vy);
      if (prev < 0.12 && b.frac > 0.25 && vin > 4) { budget++; SND.bloop(vin); }
    }
  }

  let pourAt = null, stir = null, drawing = null, held = null, tiltDrag = null;
  function emit(x, y, vx, vy, count) {
    for (let k = 0; k < count; k++) {
      if (fluid.n >= MAX) { if (!fullWarned) { fullWarned = true; Curio.toast('The tank is full! Use the sponge or Empty.'); } return; }
      fluid.add(x + Curio.rand(-5, 5), y + Curio.rand(-3, 3), vx + Curio.rand(-0.3, 0.3), vy + Curio.rand(-0.3, 0.3));
    }
    fullWarned = false;
  }

  function frameSim() {
    tilt += (tiltT - tilt) * 0.12;
    if (slosh > 0) { slosh -= 1 / 60; tilt = tiltT + Math.sin(slosh * 14) * 0.35 * Math.min(1, slosh); }
    const gx = GRAV * Math.sin(tilt), gy = GRAV * Math.cos(tilt);
    fluid.gx = gx; fluid.gy = gy;
    if (tapOn) emit(70, 22, 1.2, 3, 3);
    if (pourAt) emit(pourAt.x, pourAt.y, pourAt.vx * 0.3, pourAt.vy * 0.3 + 1, 3);
    if (stir) {
      const n = fluid.n, X = fluid.x, Y = fluid.y, VX = fluid.vx, VY = fluid.vy, R2 = 45 * 45;
      for (let i = 0; i < n; i++) { const dx = X[i] - stir.x, dy = Y[i] - stir.y, d2 = dx * dx + dy * dy; if (d2 < R2) { const f = 1 - d2 / R2; VX[i] += (stir.vx * 0.5 - VX[i]) * f * 0.4; VY[i] += (stir.vy * 0.5 - VY[i]) * f * 0.4; } }
    }
    for (let s = 0; s < SUB; s++) { fluid.step(DT); stepBodies(gx, gy); }
    measureSubmersion();
    simTime += 1 / 60;
  }

  function hex(c) { const n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  const PAL = { light: [hex('#1a5fd0'), hex('#2fa8f0'), hex('#dff6ff')], dark: [hex('#1a4fb0'), hex('#29a0e8'), hex('#e8fbff')] };
  function renderWater() {
    field.fill(0); fspd.fill(0);
    const n = fluid.n, X = fluid.x, Y = fluid.y, VX = fluid.vx, VY = fluid.vy;
    for (let p = 0; p < n; p++) {
      const fx = X[p] / CELL, fy = Y[p] / CELL;
      const ix = fx | 0, iy = fy | 0;
      const sp = Math.sqrt(VX[p] * VX[p] + VY[p] * VY[p]);
      for (let j = -KN; j <= KN; j++) {
        const yy = iy + j; if (yy < 0 || yy >= FH) continue;
        const dy = yy + 0.5 - fy;
        for (let i = -KN; i <= KN; i++) {
          const xx = ix + i; if (xx < 0 || xx >= FW) continue;
          const dx = xx + 0.5 - fx;
          const d2 = (dx * dx + dy * dy) / (KR * KR);
          if (d2 >= 1) continue;
          const w = (1 - d2) * (1 - d2);
          const c = yy * FW + xx;
          field[c] += w; fspd[c] += w * sp;
        }
      }
    }
    const P = Curio.isDark() ? PAL.dark : PAL.light;
    const [c0, c1, c2] = P;
    for (let c = 0; c < FW * FH; c++) {
      const f = field[c];
      if (f < 0.32) { pix[c] = 0; continue; }
      const a = f >= 0.75 ? 1 : (f - 0.32) / 0.43;
      const sp = fspd[c] / f;
      let t = sp / 5; if (t > 2) t = 2;
      let r, gg, b;
      if (t < 1) { r = c0[0] + (c1[0] - c0[0]) * t; gg = c0[1] + (c1[1] - c0[1]) * t; b = c0[2] + (c1[2] - c0[2]) * t; }
      else { const u = t - 1; r = c1[0] + (c2[0] - c1[0]) * u; gg = c1[1] + (c2[1] - c1[1]) * u; b = c1[2] + (c2[2] - c1[2]) * u; }
      if (f < 0.55) { const e = (0.55 - f) / 0.23 * 0.5; r += (255 - r) * e; gg += (255 - gg) * e; b += (255 - b) * e; }
      const al = (a * (f > 1.4 ? 235 : 215)) | 0;
      pix[c] = (al << 24) | ((b | 0) << 16) | ((gg | 0) << 8) | (r | 0);
    }
    og.putImageData(img, 0, 0);
  }

  function drawDuck(b) {
    g.save(); g.translate(b.x, b.y); g.rotate(b.a);
    const s = b.r / 20;
    g.scale(s, s);
    g.fillStyle = '#ffd23f'; g.strokeStyle = '#c99400'; g.lineWidth = 2;
    g.beginPath(); g.ellipse(0, 4, 22, 14, 0, 0, 7); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(-20, 0); g.quadraticCurveTo(-30, -10, -24, 4); g.fill();
    g.beginPath(); g.arc(9, -12, 11, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#ff8a2a'; g.beginPath(); g.ellipse(21, -10, 7, 3.5, 0.15, 0, 7); g.fill();
    g.fillStyle = '#1d1b19'; g.beginPath(); g.arc(12, -15, 2.2, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.ellipse(-6, 0, 9, 4, -0.3, 0, 7); g.fill();
    g.restore();
  }
  function drawRock(b) {
    g.save(); g.translate(b.x, b.y); g.rotate(b.a);
    g.fillStyle = '#7d8590'; g.strokeStyle = '#4b525b'; g.lineWidth = 2.5;
    g.beginPath();
    b.shape.forEach((k, i) => { const a = i / b.shape.length * Math.PI * 2; g.lineTo(Math.cos(a) * b.r * k, Math.sin(a) * b.r * k); });
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.2)'; g.beginPath(); g.ellipse(-b.r * 0.3, -b.r * 0.35, b.r * 0.35, b.r * 0.18, -0.5, 0, 7); g.fill();
    g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.arc(b.r * 0.25, b.r * 0.2, 3, 0, 7); g.arc(-b.r * 0.1, b.r * 0.45, 2, 0, 7); g.fill();
    g.restore();
  }

  function draw() {
    const dark = Curio.isDark();
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = dark ? '#161412' : '#fbf7f0'; g.fillRect(0, 0, cw, ch);
    g.setTransform(dpr * scale * Math.cos(tilt), dpr * scale * Math.sin(tilt), -dpr * scale * Math.sin(tilt), dpr * scale * Math.cos(tilt), dpr * cx, dpr * cy);
    g.translate(-W / 2, -H / 2);
    g.fillStyle = dark ? 'rgba(0,0,0,.35)' : 'rgba(60,40,20,.12)';
    g.beginPath(); g.roundRect(-10, 2, W + 20, H + 18, 22); g.fill();
    g.fillStyle = dark ? '#0f1b26' : '#f3faff';
    g.beginPath(); g.roundRect(-8, -8, W + 16, H + 16, 18); g.fill();
    g.strokeStyle = dark ? 'rgba(255,255,255,.04)' : 'rgba(30,90,160,.06)'; g.lineWidth = 1;
    for (let x = 40; x < W; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    for (let y = 40; y < H; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    for (const b of bodies) if (b.kind === 'rock') drawRock(b);
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(off, 0, 0, W, H);
    for (const b of bodies) if (b.kind === 'duck') drawDuck(b);
    g.lineCap = 'round';
    for (const s of walls) {
      g.strokeStyle = dark ? '#8d99a6' : '#4a5562'; g.lineWidth = s.r * 2 + 2;
      g.beginPath(); g.moveTo(s.x1, s.y1); g.lineTo(s.x2, s.y2); g.stroke();
    }
    for (const s of walls) {
      g.strokeStyle = dark ? '#b7c2cc' : '#6c7a88'; g.lineWidth = s.r * 2 - 3;
      g.beginPath(); g.moveTo(s.x1, s.y1); g.lineTo(s.x2, s.y2); g.stroke();
    }
    if (drawing && drawing.pts.length > 1) {
      g.strokeStyle = 'rgba(255,90,54,.7)'; g.lineWidth = 12; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(drawing.pts[0][0], drawing.pts[0][1]); for (const p of drawing.pts) g.lineTo(p[0], p[1]); g.stroke();
    }
    g.fillStyle = '#90a4ae'; g.strokeStyle = '#546e7a'; g.lineWidth = 2.5;
    g.beginPath(); g.roundRect(30, -26, 56, 20, 6); g.fill(); g.stroke();
    g.beginPath(); g.roundRect(60, -14, 22, 26, 5); g.fill(); g.stroke();
    g.fillStyle = tapOn ? '#ff5a36' : '#cfd8dc'; g.beginPath(); g.arc(44, -30, 7, 0, 7); g.fill(); g.stroke();
    g.strokeStyle = dark ? '#5f6b78' : '#9aa7b4'; g.lineWidth = 6;
    g.beginPath(); g.roundRect(-8, -8, W + 16, H + 16, 18); g.stroke();
    g.strokeStyle = dark ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.7)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(14, 20); g.lineTo(14, H - 40); g.stroke();
    if (tool === 'erase' && hoverL) { g.strokeStyle = 'rgba(214,69,69,.6)'; g.lineWidth = 2; g.setLineDash([4, 4]); g.beginPath(); g.arc(hoverL[0], hoverL[1], 30, 0, 7); g.stroke(); g.setLineDash([]); }
  }

  let hoverL = null;
  const evLocal = (e) => { const r = canvas.getBoundingClientRect(); return toLocal(e.clientX - r.left, e.clientY - r.top); };
  const ID = 1;
  const hitAt = (x, y) => bodies.slice().reverse().find((b) => Math.hypot(b.x - x, b.y - y) < b.r + 8);
  function placeBody(x, y) {
    if (x < 0 || x > W || y < 0 || y > H) return;
    const b = makeBody(tool, Math.max(25, Math.min(W - 25, x)), Math.max(25, Math.min(H - 25, y)));
    actions.push({ type: 'body', b });
    budget++; if (tool === 'duck') SND.squeak(); else SND.pop();
    save();
  }
  canvas.addEventListener('pointerdown', (e) => {
    if (!Curio.touchpad || e.pointerType !== 'mouse' || canvas.classList.contains('curio-latched') || (e.button != null && e.button > 0)) return;
    if (tool !== 'duck' && tool !== 'rock') return;
    const [x, y] = evLocal(e);
    if (hitAt(x, y)) return;
    e.stopImmediatePropagation();
    audioOk = true;
    if (!touched) { touched = true; intro.classList.add('is-faded'); }
    placeBody(x, y);
  });
  Curio.drag(canvas, {
    start(q) {
      audioOk = true;
      if (!touched) { touched = true; intro.classList.add('is-faded'); }
      const [x, y] = toLocal(q.x, q.y);
      const id = ID;
      const hit = hitAt(x, y);
      if (tool === 'tilt') { tiltDrag = { id, sx: q.clientX, t0: tiltT }; return; }
      if (hit && (tool === 'hand' || tool === 'pour' || tool === 'duck' || tool === 'rock')) {
        held = { id, b: hit }; hit.held = true; hit.hx = x; hit.hy = y;
        if (hit.kind === 'duck') { budget++; SND.squeak(); }
        canvas.classList.add('is-grabbing');
        return;
      }
      if (tool === 'pour') pourAt = { id, x, y, vx: 0, vy: 0 };
      else if (tool === 'hand') stir = { id, x, y, vx: 0, vy: 0 };
      else if (tool === 'duck' || tool === 'rock') placeBody(x, y);
      else if (tool === 'wall') drawing = { id, pts: [[x, y]] };
      else if (tool === 'erase') { drawing = { id, erase: true }; sponge(x, y); }
    },
    move(q) {
      const [x, y] = toLocal(q.x, q.y);
      hoverL = [x, y];
      const id = ID;
      if (tiltDrag && tiltDrag.id === id) { setTilt(tiltDrag.t0 + (q.clientX - tiltDrag.sx) / Math.max(200, cw * 0.5)); return; }
      if (held && held.id === id) { held.b.hx = Math.max(10, Math.min(W - 10, x)); held.b.hy = Math.max(10, Math.min(H - 10, y)); return; }
      if (pourAt && pourAt.id === id) { pourAt.vx = x - pourAt.x; pourAt.vy = y - pourAt.y; pourAt.x = x; pourAt.y = y; }
      if (stir && stir.id === id) { stir.vx = x - stir.x; stir.vy = y - stir.y; stir.x = x; stir.y = y; }
      if (drawing && drawing.id === id) {
        if (drawing.erase) sponge(x, y);
        else { const l = drawing.pts[drawing.pts.length - 1]; if (Math.hypot(x - l[0], y - l[1]) > 14) drawing.pts.push([x, y]); }
      }
    },
    end() { up({ pointerId: ID }); }
  });
  canvas.addEventListener('pointermove', (e) => { hoverL = evLocal(e); });
  const up = (e) => {
    const id = e.pointerId;
    if (tiltDrag && tiltDrag.id === id) { tiltDrag = null; save(); }
    if (held && held.id === id) { held.b.held = false; held.b.vx = Math.max(-18, Math.min(18, held.b.vx * 2)); held.b.vy = Math.max(-18, Math.min(18, held.b.vy * 2)); held = null; canvas.classList.remove('is-grabbing'); save(); }
    if (pourAt && pourAt.id === id) { pourAt = null; save(); }
    if (stir && stir.id === id) stir = null;
    if (drawing && drawing.id === id) {
      if (!drawing.erase && drawing.pts.length) {
        const pts = drawing.pts;
        if (pts.length === 1) pts.push([pts[0][0] + 1, pts[0][1]]);
        const segs = [];
        for (let i = 0; i < pts.length - 1; i++) segs.push({ x1: pts[i][0], y1: pts[i][1], x2: pts[i + 1][0], y2: pts[i + 1][1], r: 6 });
        walls.push(...segs); fluid.setSegments(walls);
        actions.push({ type: 'walls', segs });
        budget++; SND.pop(); save();
      }
      drawing = null;
    }
  };
  canvas.addEventListener('pointerleave', () => { hoverL = null; });

  function sponge(x, y) {
    const R2 = 30 * 30;
    for (let i = fluid.n - 1; i >= 0; i--) { const dx = fluid.x[i] - x, dy = fluid.y[i] - y; if (dx * dx + dy * dy < R2) fluid.remove(i); }
    let changed = false;
    for (let i = walls.length - 1; i >= 0; i--) {
      const s = walls[i];
      const ex = s.x2 - s.x1, ey = s.y2 - s.y1, L2 = ex * ex + ey * ey || 1e-6;
      let u = ((x - s.x1) * ex + (y - s.y1) * ey) / L2; u = Math.max(0, Math.min(1, u));
      if (Math.hypot(x - s.x1 - ex * u, y - s.y1 - ey * u) < 18) { walls.splice(i, 1); changed = true; }
    }
    if (changed) fluid.setSegments(walls);
    for (let i = bodies.length - 1; i >= 0; i--) if (Math.hypot(bodies[i].x - x, bodies[i].y - y) < bodies[i].r + 6) { bodies.splice(i, 1); changed = true; }
    if (changed) { budget++; SND.pop(); save(); }
  }

  const toolBtns = [...document.querySelectorAll('[data-tool]')];
  function setTool(t) { tool = t; for (const b of toolBtns) b.setAttribute('aria-pressed', String(b.dataset.tool === t)); canvas.style.cursor = t === 'tilt' ? 'ew-resize' : t === 'hand' ? 'grab' : 'crosshair'; }
  for (const b of toolBtns) b.addEventListener('click', () => { audioOk = true; setTool(b.dataset.tool); });
  tiltR.addEventListener('input', () => setTilt(+tiltR.value * Math.PI / 180, true));
  tiltR.addEventListener('change', save);
  const tapBtn = document.getElementById('tap');
  function toggleTap() { tapOn = !tapOn; tapBtn.setAttribute('aria-pressed', String(tapOn)); audioOk = true; budget++; SND.pop(); }
  tapBtn.addEventListener('click', toggleTap);
  document.getElementById('wave').addEventListener('click', () => { audioOk = true; slosh = 1.2; budget++; SND.slosh(); });
  function paintTag() { tagEl.textContent = paused ? 'PAUSED' : ''; tagEl.classList.toggle('is-on', paused); }
  function togglePause() { paused = !paused; const b = document.getElementById('pause'); b.setAttribute('aria-pressed', String(paused)); b.textContent = paused ? '▶ Play' : '⏸ Pause'; paintTag(); }
  document.getElementById('pause').addEventListener('click', togglePause);
  document.getElementById('undo').addEventListener('click', () => {
    const a = actions.pop();
    if (!a) { Curio.toast('Nothing to undo'); return; }
    if (a.type === 'walls') { walls = walls.filter((s) => !a.segs.includes(s)); fluid.setSegments(walls); }
    else if (a.type === 'body') { const i = bodies.indexOf(a.b); if (i >= 0) bodies.splice(i, 1); }
    save();
  });
  document.getElementById('empty').addEventListener('click', () => { fluid.n = 0; tapOn = false; tapBtn.setAttribute('aria-pressed', 'false'); audioOk = true; budget++; SND.slosh(); save(); });
  document.getElementById('reset').addEventListener('click', () => { defaultScene(); save(); Curio.toast('Fresh tank'); });
  const phoneBtn = document.getElementById('phone');
  function onOrient(e) { if (e.gamma == null) return; phoneTilt = e.gamma; setTilt(Math.max(-30, Math.min(30, e.gamma)) * Math.PI / 180 * 1.0); }
  phoneBtn.addEventListener('click', async () => {
    const D = window.DeviceOrientationEvent;
    if (!D) { Curio.toast('No tilt sensor here. Use the slider or arrow keys.'); return; }
    if (phoneBtn.getAttribute('aria-pressed') === 'true') { window.removeEventListener('deviceorientation', onOrient); phoneBtn.setAttribute('aria-pressed', 'false'); return; }
    try { if (typeof D.requestPermission === 'function') { const r = await D.requestPermission(); if (r !== 'granted') { Curio.toast('Tilt permission denied'); return; } } } catch { Curio.toast('Tilt sensor unavailable'); return; }
    window.addEventListener('deviceorientation', onOrient);
    phoneBtn.setAttribute('aria-pressed', 'true');
    Curio.toast('Tilt your phone to slosh the water');
    setTimeout(() => { if (phoneTilt == null) Curio.toast('No tilt readings yet. Try on a phone.'); }, 1500);
  });
  const keys = {};
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'arrowright') { e.preventDefault(); keys[k] = true; }
    else if (k === ' ') { e.preventDefault(); togglePause(); }
    else if (k === 't') toggleTap();
    else if (k === 'w') document.getElementById('wave').click();
    else if (k >= '1' && k <= '7') setTool(['pour', 'hand', 'duck', 'rock', 'wall', 'erase', 'tilt'][+k - 1]);
    else if (k === 'z' && (e.ctrlKey || e.metaKey)) document.getElementById('undo').click();
  });
  window.addEventListener('keyup', (e) => { const k = e.key.toLowerCase(); if (keys[k]) { keys[k] = false; save(); } });
  window.addEventListener('blur', () => { keys.arrowleft = keys.arrowright = false; });

  let last = 0, raf = 0, saveT = 0, cntT = 0, dripT = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    budget = 3;
    if (keys.arrowleft) setTilt(tiltT - dt * 0.8);
    if (keys.arrowright) setTilt(tiltT + dt * 0.8);
    if (!paused) {
      frameSim();
      for (const f of sndQueue.splice(0)) f();
      if ((tapOn || pourAt) && (dripT -= dt) < 0) { dripT = Curio.rand(0.05, 0.14); SND.drip(); }
      saveT += dt; if (saveT > 6) { saveT = 0; save(); }
    } else sndQueue.length = 0;
    renderWater();
    draw();
    if ((cntT += dt) > 0.2) { cntT = 0; document.getElementById('nDrops').textContent = Curio.fmt(fluid.n); }
  }
  function start() { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } }
  function stop() { cancelAnimationFrame(raf); raf = 0; }
  document.addEventListener('visibilitychange', () => (document.hidden ? (stop(), save()) : start()));
  window.addEventListener('pagehide', save);
  window.addEventListener('resize', fit);
  window.WaterToy = { get fluid() { return fluid; }, get bodies() { return bodies; }, setTilt, toggleTap, emit, makeBody, slosh: () => { slosh = 1.2; } };

  fit();
  const sc = Curio.store.get(KEY, null);
  if (sc && typeof sc.n === 'number') { try { restore(sc); } catch { defaultScene(); } } else defaultScene();
  tilt = tiltT;
  start();
  if (!Curio.touchpad && matchMedia('(pointer: fine)').matches && !Curio.store.get('tp-hint-water-toy', false)) { Curio.store.set('tp-hint-water-toy', true); setTimeout(() => Curio.toast('Tip: on a laptop touchpad, turn on Touchpad mode in the top bar: click to start pouring, click again to stop', 4200), 1800); }
})();
