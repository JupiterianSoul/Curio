(() => {
  const cv = document.getElementById('cv');
  const ctx = cv.getContext('2d');
  const $ = (id) => document.getElementById(id);
  const intro = $('intro');
  const TAU = Math.PI * 2;
  const FABRICS = [
    { name: 'Gingham', swatch: 'repeating-conic-gradient(#d8343f 0 25%, #fff 0 50%) 0 0 / 50% 50%', kind: 'gingham' },
    { name: 'Denim', swatch: 'linear-gradient(135deg, #2f5d8a, #1f3f63)', kind: 'twill', a: [47, 93, 138], b: [34, 66, 104] },
    { name: 'Rainbow', swatch: 'linear-gradient(90deg, #ff595e, #ffca3a, #8ac926, #1982c4, #6a4c93)', kind: 'rainbow' },
    { name: 'Silk', swatch: 'linear-gradient(135deg, #f7c6d9, #b07bd8)', kind: 'silk', a: [240, 160, 200], b: [170, 120, 220] },
    { name: 'Tartan', swatch: 'linear-gradient(90deg, #1f5d3a 0 33%, #b8282e 33% 66%, #1f5d3a 66%)', kind: 'tartan' },
    { name: 'Polka dots', swatch: 'radial-gradient(circle, #fff 0 22%, #2a6fdb 24%) 0 0 / 50% 50%', kind: 'polka' },
    { name: 'Sailor stripes', swatch: 'repeating-linear-gradient(0deg, #1d2b53 0 6px, #f4f1ea 6px 12px)', kind: 'stripes' },
    { name: 'Camo', swatch: 'radial-gradient(circle at 30% 30%, #4b5d2c 0 30%, transparent 32%), radial-gradient(circle at 70% 70%, #2c3320 0 30%, transparent 32%), #7a7348', kind: 'camo' },
    { name: 'Sheet', swatch: 'linear-gradient(135deg, #ffffff, #e9e4f2)', kind: 'plain', a: [226, 224, 236] },
    { name: 'Velvet', swatch: 'linear-gradient(135deg, #7d1030, #3b0716)', kind: 'velvet', a: [140, 22, 58] }
  ];
  const RAINBOW = [[255, 89, 94], [255, 146, 76], [255, 202, 58], [138, 201, 38], [25, 130, 196], [106, 76, 147]];
  const SCENES = [
    { id: 'curtain', name: 'Curtain', d: 'Hangs from a rail', pins: 'all' },
    { id: 'flag', name: 'Flag', d: 'On a pole in the wind', pins: 'left', wind: true, fabric: 2 },
    { id: 'hammock', name: 'Hammock', d: 'Slung between two hooks', pins: 'corners', short: true, fabric: 4 },
    { id: 'table', name: 'Tablecloth', d: 'Drops onto a table', pins: 'none', drop: true, fabric: 0, objs: ['table'] },
    { id: 'ghost', name: 'Ghost', d: 'A sheet over a ball. Boo.', pins: 'none', drop: true, fabric: 8, objs: ['ball'] },
    { id: 'poles', name: 'Two posts', d: 'A sling between posts', pins: 'none', drop: true, fabric: 9, objs: ['postL', 'postR'] },
    { id: 'tent', name: 'Tent', d: 'Pegged over a ridge pole', pins: 'tent', drop: true, fabric: 7, objs: ['ridge'] },
    { id: 'net', name: 'Goal net', d: 'Pelt it with balls', pins: 'all', fabric: 5, tool: 'throw' }
  ];
  const BADGES = [
    ['shred', '✂️ Shredder', 'Cut 500 threads'],
    ['pyro', '🔥 Pyromaniac', 'Burn 300 threads'],
    ['rip', '💥 Brute force', 'Rip it by pulling'],
    ['ghost', '👻 Boo', 'Make a ghost'],
    ['pitcher', '🏐 Pitcher', 'Throw 20 balls'],
    ['flag', '🏳️ Flag bearer', 'Fly a flag in the wind'],
    ['scenes', '🎭 Set designer', 'Try every scene'],
    ['ash', '🌋 Ashes', 'Burn a whole sheet away']
  ];
  const S = { grav: 1, windS: 1, stiff: 8, tough: 6 };
  let W = 0, H = 0, FL = 0, dpr = 1, fabric = 0, wind = false, tool = 'grab', pinMode = 'all', cuts = 0, burnt = 0, time = 0, scene = 'curtain';
  let cols = 0, rows = 0, sp = 0, x0 = 0, y0 = 0, vRest = 1, tentSpread = 200;
  let X, Y, OX, OY, PIN, PX, PY, LA, LB, LR, LIVE, HL, VL, BURN, nPts = 0, nLinks = 0, liveStart = 0;
  let objs = [], balls = [], embers = [], thrown = 0;
  let badges = Curio.store.get('cloth:badges', []);
  if (!Array.isArray(badges)) badges = [];
  const triedScenes = new Set(Curio.store.get('cloth:scenes', []));
  const totals = Object.assign({ cut: 0, burn: 0 }, Curio.store.get('cloth:totals', {}));

  function award(id) {
    if (badges.includes(id)) return;
    badges.push(id);
    Curio.store.set('cloth:badges', badges);
    const b = BADGES.find((x) => x[0] === id);
    if (b) { Curio.toast(`Badge: ${b[1]}`); [784, 988, 1175].forEach((f, k) => setTimeout(() => Curio.beep(f, 0.08, 'triangle', 0.07), k * 80)); }
    renderBadges();
  }
  function renderBadges() {
    $('badges').innerHTML = BADGES.map(([id, n, d]) => `<div class="badge${badges.includes(id) ? ' got' : ''}"><b>${badges.includes(id) ? n : `🔒 ${n.split(' ').slice(1).join(' ')}`}</b>${d}</div>`).join('');
  }

  function sceneDef() { return SCENES.find((s) => s.id === scene) || SCENES[0]; }

  function makeObjs() {
    const sd = sceneDef();
    objs = [];
    const floorY = FL, cx = W / 2;
    for (const o of sd.objs || []) {
      if (o === 'table') { const w = Math.min(W * 0.5, 420), h = Math.min(170, H * 0.24); objs.push({ type: 'rect', x: cx - w / 2, y: floorY - h, w, h: 18, legs: h, kind: 'table' }); }
      if (o === 'ball') { const r = Math.min(110, W * 0.16, H * 0.17); objs.push({ type: 'circle', x: cx, y: floorY - r * 1.9, r, kind: 'ball', stand: true }); }
      if (o === 'postL' || o === 'postR') { const h = Math.min(260, H * 0.38), off = Math.min(130, W * 0.18); objs.push({ type: 'circle', x: cx + (o === 'postL' ? -off : off), y: floorY - h, r: 13, kind: 'post', h }); }
      if (o === 'ridge') { const h = Math.min(220, H * 0.32); objs.push({ type: 'circle', x: cx, y: floorY - h, r: 10, kind: 'post', h }); }
    }
  }

  function build() {
    const sd = sceneDef();
    makeObjs();
    let clothW = Math.min(W - 40, sd.pins === 'left' ? 640 : 860);
    const o0 = objs[0];
    if (sd.drop && o0) {
      if (o0.kind === 'table') clothW = Math.min(W - 20, o0.w * 1.45);
      else if (o0.kind === 'ball') clothW = Math.min(W - 20, o0.r * 3.6);
      else if (objs.length > 1) clothW = Math.min(W - 20, Math.abs(objs[1].x - objs[0].x) * 2.3);
      else { tentSpread = Math.min(W * 0.32, 280); clothW = 2 * Math.hypot(FL - o0.y, tentSpread) * 1.03; }
    }
    cols = Math.max(16, Math.min(46, Math.round(clothW / 19)));
    sp = clothW / cols;
    const top = W < 560 ? 132 : Math.max(110, H * 0.15);
    if (sd.id === 'tent') rows = Math.max(6, Math.round((FL - o0.y) / sp * 0.7));
    else if (sd.short) rows = Math.max(6, Math.min(10, Math.round(cols * 0.22)));
    else if (sd.drop && o0) rows = Math.max(6, Math.min(40, Math.round((FL - (o0.y - 40)) / sp * (o0.kind === 'ball' ? 0.95 : 0.8))));
    else if (sd.pins === 'left') rows = Math.max(10, Math.min(24, Math.round(cols * 0.62)));
    else rows = Math.max(10, Math.min(34, Math.round((FL - top - 60) / sp)));
    x0 = (W - clothW) / 2; y0 = sd.drop && o0 ? Math.max(20, o0.y - (o0.type === 'circle' ? o0.r : 0) - 50) : top;
    if (sd.pins === 'left') x0 = Math.max(40, (W - clothW) / 2 + 20);
    vRest = 1;
    nPts = (cols + 1) * (rows + 1);
    X = new Float32Array(nPts); Y = new Float32Array(nPts); OX = new Float32Array(nPts); OY = new Float32Array(nPts);
    PIN = new Uint8Array(nPts); PX = new Float32Array(nPts); PY = new Float32Array(nPts); BURN = new Float32Array(nPts);
    for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) {
      const k = j * (cols + 1) + i;
      if (sd.id === 'tent' && o0) { const t = i / cols, ry = o0.y - o0.r - 4; X[k] = OX[k] = W / 2 + (t * 2 - 1) * tentSpread; Y[k] = OY[k] = Math.min(FL, ry + Math.abs(2 * t - 1) * (FL - ry) + j * sp * 0.5); }
      else if (sd.drop) { X[k] = OX[k] = x0 + i * sp; Y[k] = OY[k] = y0 + j * sp * vRest; }
      else { X[k] = OX[k] = x0 + i * sp; Y[k] = OY[k] = y0 + j * sp; }
    }
    const maxL = 2 * nPts;
    LA = new Int32Array(maxL); LB = new Int32Array(maxL); LR = new Float32Array(maxL); LIVE = new Uint8Array(maxL);
    HL = new Int32Array(nPts).fill(-1); VL = new Int32Array(nPts).fill(-1);
    nLinks = 0;
    for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) {
      const k = j * (cols + 1) + i;
      if (i < cols) { LA[nLinks] = k; LB[nLinks] = k + 1; LR[nLinks] = sp; LIVE[nLinks] = 1; HL[k] = nLinks++; }
      if (j < rows) { LA[nLinks] = k; LB[nLinks] = k + cols + 1; LR[nLinks] = sp * vRest; LIVE[nLinks] = 1; VL[k] = nLinks++; }
    }
    liveStart = nLinks;
    pinMode = sd.pins;
    applyPins();
    cuts = 0; burnt = 0; balls = []; embers = [];
    paintCuts();
  }
  function applyPins() {
    PIN.fill(0);
    const m = pinMode;
    if (m === 'left') {
      for (let j = 0; j <= rows; j++) { const k = j * (cols + 1); PIN[k] = 1; PX[k] = x0; PY[k] = y0 + j * sp; }
    } else if (m === 'tent') {
      PIN[0] = 1; PX[0] = W / 2 - tentSpread; PY[0] = FL;
      PIN[cols] = 1; PX[cols] = W / 2 + tentSpread; PY[cols] = FL;
    } else if (m !== 'none') {
      for (let i = 0; i <= cols; i++) {
        const on = m === 'all' ? true : m === 'some' ? i % 4 === 0 || i === cols : i === 0 || i === cols;
        if (on) { PIN[i] = 1; PX[i] = x0 + i * sp; PY[i] = y0; }
      }
    }
    $('bPins').textContent = `📌 ${m === 'all' ? 'Pins: all' : m === 'some' ? 'Pins: some' : m === 'corners' ? 'Pins: corners' : m === 'left' ? 'Pins: pole' : m === 'tent' ? 'Pins: pegs' : 'Pins: none'}`;
  }

  function collideObjs(k) {
    for (const o of objs) {
      if (o.type === 'circle') {
        const dx = X[k] - o.x, dy = Y[k] - o.y, d2 = dx * dx + dy * dy, R = o.r + 3;
        if (d2 < R * R) {
          const d = Math.sqrt(d2) || 0.001;
          X[k] = o.x + dx / d * R; Y[k] = o.y + dy / d * R;
          const fr = o.kind === 'post' ? 0.85 : 0.35;
          OX[k] += (X[k] - OX[k]) * fr; OY[k] += (Y[k] - OY[k]) * fr;
        }
        if (o.kind === 'post' && X[k] > o.x - o.r && X[k] < o.x + o.r && Y[k] > o.y) {
          X[k] = X[k] < o.x ? o.x - o.r : o.x + o.r;
        }
        if (o.stand && X[k] > o.x - o.r * 0.3 && X[k] < o.x + o.r * 0.3 && Y[k] > o.y && Y[k] < FL) {
          X[k] = X[k] < o.x ? o.x - o.r * 0.3 : o.x + o.r * 0.3;
        }
      } else {
        const m = 3;
        if (X[k] > o.x - m && X[k] < o.x + o.w + m && Y[k] > o.y - m && Y[k] < o.y + o.h) {
          const dl = X[k] - (o.x - m), dr = o.x + o.w + m - X[k], dt = Y[k] - (o.y - m), db = o.y + o.h - Y[k];
          const mn = Math.min(dl, dr, dt, db);
          if (mn === dt) { Y[k] = o.y - m; OX[k] += (X[k] - OX[k]) * 0.4; }
          else if (mn === dl) X[k] = o.x - m;
          else if (mn === dr) X[k] = o.x + o.w + m;
          else Y[k] = o.y + o.h;
        }
        for (const lx of [o.x + 14, o.x + o.w - 14]) {
          if (Y[k] > o.y + o.h && Math.abs(X[k] - lx) < 8) X[k] = X[k] < lx ? lx - 8 : lx + 8;
        }
      }
    }
  }

  function segCollide() {
    for (const o of objs) {
      if (o.type !== 'circle') continue;
      const R = o.r + 3;
      for (let k = 0; k < cols; k++) {
        const l = HL[k];
        if (l < 0 || !LIVE[l]) continue;
        const a = k, b = k + 1;
        const ex = X[b] - X[a], ey = Y[b] - Y[a], L2 = ex * ex + ey * ey || 1;
        let t = ((o.x - X[a]) * ex + (o.y - Y[a]) * ey) / L2;
        if (t <= 0 || t >= 1) continue;
        const qx = X[a] + ex * t, qy = Y[a] + ey * t, dx = qx - o.x, dy = qy - o.y, d = Math.hypot(dx, dy) || 0.001;
        if (d >= R) continue;
        const push = R - d, nx = dx / d, ny = dy / d;
        if (!PIN[a]) { X[a] += nx * push * (1 - t) * 1.2; Y[a] += ny * push * (1 - t) * 1.2; OX[a] += (X[a] - OX[a]) * 0.6; }
        if (!PIN[b]) { X[b] += nx * push * t * 1.2; Y[b] += ny * push * t * 1.2; OX[b] += (X[b] - OX[b]) * 0.6; }
      }
    }
  }
  function linksOf(k) {
    const out = [];
    if (HL[k] >= 0) out.push(HL[k]);
    if (VL[k] >= 0) out.push(VL[k]);
    const i = k % (cols + 1);
    if (i > 0 && HL[k - 1] >= 0) out.push(HL[k - 1]);
    if (k - cols - 1 >= 0 && VL[k - cols - 1] >= 0) out.push(VL[k - cols - 1]);
    return out;
  }

  const grabs = new Map();
  function step(dt) {
    const g = 1500 * S.grav * dt * dt;
    const damp = 0.992;
    const wx = wind ? S.windS * 900 * dt * dt : 0;
    const gust = 0.55 + 0.45 * Math.sin(time * 0.7) * Math.sin(time * 0.23 + 1);
    for (let k = 0; k < nPts; k++) {
      if (PIN[k]) { X[k] = OX[k] = PX[k]; Y[k] = OY[k] = PY[k]; continue; }
      const vx = (X[k] - OX[k]) * damp, vy = (Y[k] - OY[k]) * damp;
      OX[k] = X[k]; OY[k] = Y[k];
      let fx = 0, fy = g;
      if (BURN[k] > 0) fy -= g * 0.6;
      if (wind) {
        const n = Math.sin(time * 2.1 + Y[k] * 0.012 + X[k] * 0.006) * 0.5 + Math.sin(time * 3.7 + X[k] * 0.02) * 0.3;
        fx += wx * gust * (0.8 + n);
        fy += wx * 0.25 * Math.sin(time * 5 + X[k] * 0.03 + Y[k] * 0.02);
      }
      X[k] += vx + fx; Y[k] += vy + fy;
    }
    for (const gr of grabs.values()) {
      if (!gr.pts.length) continue;
      for (const [k, offx, offy] of gr.pts) {
        if (PIN[k]) continue;
        const tx = gr.x + offx * 0.75, ty = gr.y + offy * 0.75;
        X[k] += (tx - X[k]) * 0.85; Y[k] += (ty - Y[k]) * 0.85;
      }
    }
    for (const b of balls) {
      b.vy += 1500 * S.grav * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.t += dt;
      if (b.y > FL - b.r) { b.y = FL - b.r; b.vy *= -0.45; b.vx *= 0.85; }
      if (b.x < b.r) { b.x = b.r; b.vx *= -0.5; } else if (b.x > W - b.r) { b.x = W - b.r; b.vx *= -0.5; }
    }
    const iters = S.stiff, tear = S.tough;
    let snapped = 0;
    for (let it = 0; it < iters; it++) {
      for (let l = 0; l < nLinks; l++) {
        if (!LIVE[l]) continue;
        const a = LA[l], b = LB[l];
        const dx = X[b] - X[a], dy = Y[b] - Y[a];
        const d = Math.sqrt(dx * dx + dy * dy) || 0.0001;
        if (it === 0 && d > LR[l] * tear) { LIVE[l] = 0; snapped++; continue; }
        const diff = (d - LR[l]) / d;
        const pa = PIN[a], pb = PIN[b];
        if (pa && pb) continue;
        const wa = pa ? 0 : pb ? 1 : 0.5, wb = pb ? 0 : pa ? 1 : 0.5;
        X[a] += dx * diff * wa; Y[a] += dy * diff * wa;
        X[b] -= dx * diff * wb; Y[b] -= dy * diff * wb;
      }
      if (objs.length) { for (let k = 0; k <= cols; k++) if (!PIN[k]) collideObjs(k); segCollide(); }
      if (balls.length && it === 0) for (const b of balls) {
        const R = b.r + 4, R2 = R * R;
        for (let k = 0; k < nPts; k++) {
          if (PIN[k]) continue;
          const dx = X[k] - b.x, dy = Y[k] - b.y, d2 = dx * dx + dy * dy;
          if (d2 < R2) {
            const d = Math.sqrt(d2) || 0.001, push = (R - d);
            X[k] += dx / d * push * 0.8; Y[k] += dy / d * push * 0.8;
            b.vx -= dx / d * push * 2.2; b.vy -= dy / d * push * 2.2;
            OX[k] -= b.vx * dt * 0.08; OY[k] -= b.vy * dt * 0.08;
          }
        }
        b.vx *= 0.995; b.vy *= 0.995;
      }
    }
    const floor = FL, left = 2, right = W - 2;
    for (let k = 0; k < nPts; k++) {
      if (Y[k] > floor) { Y[k] = floor; OX[k] = X[k] - (X[k] - OX[k]) * 0.5; }
      if (X[k] < left) X[k] = left; else if (X[k] > right) X[k] = right;
    }
    balls = balls.filter((b) => b.t < 9);
    burnStep(dt);
    if (snapped) {
      cuts += snapped; totals.cut += snapped; paintCuts(); rip(snapped);
      if (snapped > 2 && grabs.size && tool === 'grab') award('rip');
    }
  }

  let burnSoundT = 0;
  function burnStep(dt) {
    let any = 0, killed = 0;
    for (let k = 0; k < nPts; k++) {
      const b = BURN[k];
      if (b <= 0 || b >= 2) continue;
      any++;
      BURN[k] = b + dt * 0.9;
      const ls = linksOf(k);
      if (b > 0.25) for (const l of ls) {
        if (!LIVE[l]) continue;
        const o = LA[l] === k ? LB[l] : LA[l];
        if (BURN[o] === 0 && Math.random() < dt * (wind ? 3.2 : 2.2) * (Y[o] < Y[k] ? 1.8 : 0.7)) BURN[o] = 0.001;
      }
      if (BURN[k] > 1) {
        for (const l of ls) if (LIVE[l]) { LIVE[l] = 0; killed++; }
        BURN[k] = 2;
      }
      if (Math.random() < dt * 6) embers.push({ x: X[k], y: Y[k], vx: Curio.rand(-20, 20), vy: Curio.rand(-80, -30), life: 1 });
    }
    for (let i = embers.length - 1; i >= 0; i--) { const e = embers[i]; e.x += e.vx * dt; e.y += e.vy * dt; e.vx += Math.sin(time * 3 + i) * 20 * dt + (wind ? 60 * dt : 0); e.life -= dt * 0.9; if (e.life <= 0) embers.splice(i, 1); }
    if (embers.length > 600) embers.splice(0, embers.length - 600);
    if (killed) {
      burnt += killed; totals.burn += killed; paintCuts();
      if (totals.burn >= 300) award('pyro');
      let live = 0; for (let l = 0; l < nLinks; l++) live += LIVE[l];
      if (live < nLinks * 0.03 && burnt > nLinks * 0.5) award('ash');
    }
    if (any && performance.now() - burnSoundT > 70) { burnSoundT = performance.now(); crackle(Math.min(1, any / 40)); }
  }

  let noiseBuf = null, lastSnip = 0;
  function noise() {
    const ac = Curio.audioContext(); if (!ac) return null;
    if (!noiseBuf) { noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.3, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    return ac;
  }
  function snip(n, freq = 3800, dur = 0.05, vol = 0.12) {
    const now = performance.now();
    if (Curio.muted || now - lastSnip < 45) return;
    lastSnip = now;
    const ac = noise(); if (!ac) return;
    const t = ac.currentTime, src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = noiseBuf; f.type = 'bandpass'; f.frequency.value = freq + Math.random() * 800; f.Q.value = 1.4;
    g.gain.setValueAtTime(Math.min(0.25, vol * (0.6 + n * 0.15)), t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(ac.destination); src.start(t, Math.random() * 0.2); src.stop(t + dur + 0.02);
  }
  const rip = (n) => snip(n, 1400, 0.12, 0.1);
  function crackle(amt) {
    if (Curio.muted) return;
    const ac = noise(); if (!ac) return;
    const t = ac.currentTime, src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = 2000 + Math.random() * 3000;
    g.gain.setValueAtTime(0.03 + amt * 0.07 * Math.random(), t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    src.connect(f).connect(g).connect(ac.destination); src.start(t, Math.random() * 0.25); src.stop(t + 0.04);
  }
  function thud(v) {
    if (Curio.muted) return;
    const ac = Curio.audioContext(); if (!ac) return;
    const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(60, t + 0.15);
    g.gain.setValueAtTime(0.15 * v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    o.connect(g).connect(ac.destination); o.start(t); o.stop(t + 0.2);
  }

  function paintCuts() {
    const a = $('sCuts'), b = $('sBurn');
    const ta = Curio.fmt(cuts), tb = Curio.fmt(burnt);
    if (a.textContent !== ta) { a.textContent = ta; a.classList.remove('pulse'); void a.offsetWidth; a.classList.add('pulse'); }
    if (b.textContent !== tb) { b.textContent = tb; b.classList.remove('pulse'); void b.offsetWidth; b.classList.add('pulse'); }
    if (totals.cut >= 500) award('shred');
    if (cuts || burnt) Curio.store.set('cloth:totals', totals);
  }

  function segHit(ax, ay, bx, by, cx, cy, dx, dy) {
    const d = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx);
    if (Math.abs(d) < 1e-9) return false;
    const u = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / d;
    const v = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / d;
    return u >= 0 && u <= 1 && v >= 0 && v <= 1;
  }
  function cutAlong(ax, ay, bx, by) {
    let n = 0;
    const r2 = 36;
    for (let l = 0; l < nLinks; l++) {
      if (!LIVE[l]) continue;
      const a = LA[l], b = LB[l];
      let hit = segHit(ax, ay, bx, by, X[a], Y[a], X[b], Y[b]);
      if (!hit) { const mx = (X[a] + X[b]) / 2 - bx, my = (Y[a] + Y[b]) / 2 - by; hit = mx * mx + my * my < r2; }
      if (hit) { LIVE[l] = 0; n++; }
    }
    if (n) { cuts += n; totals.cut += n; paintCuts(); snip(n); }
  }
  function ignite(x, y) {
    let n = 0;
    for (let k = 0; k < nPts; k++) { const dx = X[k] - x, dy = Y[k] - y; if (dx * dx + dy * dy < 400 && BURN[k] === 0) { BURN[k] = 0.001; n++; } }
    if (n) { crackle(1); try { navigator.vibrate && navigator.vibrate(10); } catch (e) { } }
  }

  function colorsFor() {
    return Curio.isDark()
      ? { wall0: '#24202c', wall1: '#131118', floor: '#1b1714', board: '#2a231d', rod: ['#c9a25a', '#7a5a22'], ring: '#d9b46a', shadow: 'rgba(0,0,0,.45)', obj: ['#5c5866', '#36333d'], wood: ['#7a5232', '#4e3420'], dark: true }
      : { wall0: '#f7f1e8', wall1: '#e8dccb', floor: '#c9a27a', board: '#b48c63', rod: ['#d8b06a', '#8c6526'], ring: '#b28a3e', shadow: 'rgba(70,45,20,.16)', obj: ['#b9b3c4', '#8a8496'], wood: ['#a8774c', '#7a5232'], dark: false };
  }
  let C = colorsFor();
  const retheme = () => { C = colorsFor(); };
  addEventListener('curio:theme', retheme);
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', retheme);

  const hash = (i, j) => (((Math.imul(i, 73856093) ^ Math.imul(j, 19349663)) >>> 0) % 97) / 97;
  function baseColor(i, j) {
    const f = FABRICS[fabric];
    if (scene === 'flag' && f.kind === 'rainbow') return RAINBOW[Math.floor(j / Math.max(1, (rows + 1) / 6)) % 6];
    switch (f.kind) {
      case 'gingham': { const c = ((i >> 1) & 1) + ((j >> 1) & 1); return c === 2 ? [176, 30, 42] : c === 1 ? [228, 120, 124] : [250, 244, 238]; }
      case 'twill': return ((i + j) % 4 < 2) ? f.b : f.a;
      case 'rainbow': return RAINBOW[Math.floor(i / Math.max(1, cols / 6)) % 6];
      case 'silk': { const t = (i / cols + j / rows) / 2; return [f.a[0] + (f.b[0] - f.a[0]) * t, f.a[1] + (f.b[1] - f.a[1]) * t, f.a[2] + (f.b[2] - f.a[2]) * t]; }
      case 'polka': { const ci = i % 4, cj = j % 4, off = (Math.floor(j / 4) % 2) * 2; return (((ci + off) % 4 === 1 || (ci + off) % 4 === 2) && (cj === 1 || cj === 2)) ? [250, 250, 250] : [42, 111, 219]; }
      case 'stripes': return (j % 4 < 2) ? [29, 43, 83] : [244, 241, 234];
      case 'camo': { const n = Math.sin(i * 0.55 + Math.sin(j * 0.4) * 2) + Math.sin(j * 0.6 + Math.cos(i * 0.3) * 2); return n > 0.9 ? [44, 51, 32] : n > 0 ? [75, 93, 44] : n > -0.9 ? [122, 115, 72] : [96, 78, 52]; }
      case 'plain': return f.a;
      case 'velvet': return f.a;
      default: {
        const gi = i % 8, gj = j % 8;
        if (gi === 3 || gj === 3) return [230, 200, 80];
        if (gi < 3 && gj < 3) return [20, 70, 45];
        if (gi > 4 && gj > 4) return [150, 25, 35];
        return gi > 4 || gj > 4 ? [120, 40, 40] : [31, 93, 58];
      }
    }
  }

  const cache = new Map();
  function style(rgb, s, back, heat) {
    const q = Math.max(0, Math.min(63, Math.round(s * 40)));
    const hq = Math.max(0, Math.min(15, Math.round(heat * 15)));
    const key = `${rgb[0] | 0},${rgb[1] | 0},${rgb[2] | 0},${q},${back ? 1 : 0},${hq}`;
    let v = cache.get(key);
    if (!v) {
      const k = q / 40;
      let r = rgb[0] * k, g = rgb[1] * k, b = rgb[2] * k;
      if (k > 1) { const w = (k - 1) * 0.9; r += (255 - rgb[0]) * w; g += (255 - rgb[1]) * w; b += (255 - rgb[2]) * w; }
      if (back) { r = r * 0.6 + 30; g = g * 0.6 + 26; b = b * 0.6 + 24; }
      if (hq) {
        const h = hq / 15;
        if (h < 0.5) { const u = h * 2; r = r + (255 - r) * u; g = g + (140 - g) * u; b = b + (20 - b) * u; }
        else { const u = (h - 0.5) * 2; r = 255 + (30 - 255) * u; g = 140 + (18 - 140) * u; b = 20 + (10 - 20) * u; }
      }
      v = `rgb(${Math.max(0, Math.min(255, r)) | 0},${Math.max(0, Math.min(255, g)) | 0},${Math.max(0, Math.min(255, b)) | 0})`;
      if (cache.size > 8000) cache.clear();
      cache.set(key, v);
    }
    return v;
  }

  function tri(a, b, c, rgb, i, j) {
    const area = ((X[b] - X[a]) * (Y[c] - Y[a]) - (X[c] - X[a]) * (Y[b] - Y[a])) / (sp * sp * vRest);
    const back = area < 0;
    const ar = Math.abs(area) * 2;
    const lit = 0.42 + 0.58 * Math.min(1.25, ar);
    const kind = FABRICS[fabric].kind;
    const sheen = kind === 'silk' ? 0.12 * Math.sin((X[a] + Y[a]) * 0.02 + time * 0.5) : kind === 'velvet' ? 0.25 * (Math.min(1.25, ar) - 0.9) : 0;
    const ytone = (1.04 - 0.1 * (j / rows)) * (0.965 + 0.07 * hash(i, j));
    const heat = Math.max(BURN[a], BURN[b], BURN[c]);
    const st = style(rgb, (lit + sheen) * ytone, back, heat > 0 ? Math.min(1, heat) : 0);
    let bk = buckets.get(st);
    if (!bk) { bk = []; buckets.set(st, bk); }
    bk.push(X[a], Y[a], X[b], Y[b], X[c], Y[c]);
  }
  const buckets = new Map();
  function flushTris() {
    for (const [st, bk] of buckets) {
      if (!bk.length) continue;
      ctx.fillStyle = st; ctx.strokeStyle = st;
      ctx.beginPath();
      for (let q = 0; q < bk.length; q += 6) { ctx.moveTo(bk[q], bk[q + 1]); ctx.lineTo(bk[q + 2], bk[q + 3]); ctx.lineTo(bk[q + 4], bk[q + 5]); ctx.closePath(); }
      ctx.fill(); ctx.stroke();
      bk.length = 0;
    }
    if (buckets.size > 600) buckets.clear();
  }

  function drawRoom() {
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, C.wall0); bg.addColorStop(1, C.wall1);
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = C.dark ? 'rgba(255,255,255,.025)' : 'rgba(120,90,50,.05)';
    const fy = FL - 4;
    for (let x = 0; x < W; x += 36) ctx.fillRect(x, 0, 14, fy);
    ctx.fillStyle = C.dark ? 'rgba(0,0,0,.25)' : 'rgba(120,90,50,.18)';
    ctx.fillRect(0, fy - 6, W, 6);
    const fg = ctx.createLinearGradient(0, fy, 0, H);
    fg.addColorStop(0, C.board); fg.addColorStop(1, C.floor);
    ctx.fillStyle = fg; ctx.fillRect(0, fy, W, H - fy);
    ctx.strokeStyle = C.dark ? 'rgba(0,0,0,.35)' : 'rgba(90,60,30,.25)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = -40; x < W + 40; x += 90) { ctx.moveTo(x, fy); ctx.lineTo(x - 30, H); }
    ctx.moveTo(0, fy + 22); ctx.lineTo(W, fy + 22);
    ctx.stroke();
    ctx.fillStyle = C.dark ? '#c9a640' : '#f2cc4a';
    ctx.fillRect(0, fy + 4, W, 13);
    ctx.fillStyle = C.dark ? 'rgba(0,0,0,.55)' : 'rgba(60,40,10,.75)';
    for (let x = 0, n = 0; x < W; x += 9, n++) ctx.fillRect(x, fy + 4, 1, n % 10 === 0 ? 9 : n % 5 === 0 ? 6 : 3);
    ctx.font = '700 8px ui-monospace, monospace';
    for (let x = 90, n = 10; x < W; x += 90, n += 10) ctx.fillText(String(n), x + 2, fy + 15);
    const sp = (x, y, col) => {
      ctx.fillStyle = C.dark ? '#5a4632' : '#c69a63'; ctx.fillRect(x - 11, y - 2, 22, 5); ctx.fillRect(x - 11, y + 21, 22, 5);
      ctx.fillStyle = col; ctx.fillRect(x - 8, y + 3, 16, 18);
      ctx.fillStyle = 'rgba(255,255,255,.25)'; for (let k = 0; k < 6; k++) ctx.fillRect(x - 8, y + 4 + k * 3, 16, 1);
    };
    if (W > 520) { ctx.fillStyle = C.dark ? 'rgba(0,0,0,.3)' : 'rgba(110,70,30,.35)'; ctx.fillRect(W - 150, 120, 130, 5); sp(W - 130, 93, '#d8343f'); sp(W - 100, 93, '#2a6fdb'); sp(W - 70, 93, '#3aa35b'); sp(W - 40, 93, '#f2b13a'); }
  }

  function drawObjs() {
    for (const o of objs) {
      ctx.fillStyle = C.shadow;
      ctx.beginPath(); ctx.ellipse(o.type === 'rect' ? o.x + o.w / 2 : o.x, FL - 3, o.type === 'rect' ? o.w * 0.55 : o.r * 1.1 + 8, 7, 0, 0, TAU); ctx.fill();
      if (o.kind === 'table') {
        const g = ctx.createLinearGradient(0, o.y, 0, o.y + o.h);
        g.addColorStop(0, C.wood[0]); g.addColorStop(1, C.wood[1]);
        ctx.fillStyle = C.wood[1];
        ctx.fillRect(o.x + 8, o.y + o.h, 12, o.legs - o.h); ctx.fillRect(o.x + o.w - 20, o.y + o.h, 12, o.legs - o.h);
        ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(o.x, o.y, o.w, o.h, 4) : ctx.rect(o.x, o.y, o.w, o.h); ctx.fill();
      } else if (o.kind === 'ball') {
        ctx.fillStyle = C.wood[1];
        ctx.fillRect(o.x - o.r * 0.25, o.y, o.r * 0.5, FL - o.y);
        ctx.fillRect(o.x - o.r * 0.7, FL - 11, o.r * 1.4, 11);
        const g = ctx.createRadialGradient(o.x - o.r * 0.35, o.y - o.r * 0.4, o.r * 0.1, o.x, o.y, o.r);
        g.addColorStop(0, C.obj[0]); g.addColorStop(1, C.obj[1]);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, TAU); ctx.fill();
      } else {
        const g = ctx.createLinearGradient(o.x - o.r, 0, o.x + o.r, 0);
        g.addColorStop(0, C.wood[0]); g.addColorStop(1, C.wood[1]);
        ctx.fillStyle = g;
        ctx.fillRect(o.x - o.r * 0.7, o.y, o.r * 1.4, FL - o.y);
        ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, TAU); ctx.fill();
      }
    }
  }

  function drawGhostFace() {
    if (scene !== 'ghost' || !objs.length) return;
    const o = objs[0];
    const mid = Math.round(cols / 2), jE = Math.max(1, Math.round(o.r * 0.75 / sp));
    if (jE > rows) return;
    const k = jE * (cols + 1) + mid, kl = k - Math.max(1, Math.round(o.r * 0.32 / sp)), kr = k + Math.max(1, Math.round(o.r * 0.32 / sp)), km = Math.min(nPts - 1, k + Math.max(1, Math.round(o.r * 0.45 / sp)) * (cols + 1));
    if (!(HL[k] >= 0 && LIVE[HL[k]] && VL[k] >= 0 && LIVE[VL[k]])) return;
    if (Math.hypot(X[k] - o.x, Y[k] - o.y) < o.r * 0.8 && !drawGhostFace.done) { drawGhostFace.done = true; award('ghost'); }
    ctx.fillStyle = '#1b1820';
    const blink = Math.sin(time * 1.3) > 0.97 ? 0.15 : 1, er = o.r * 0.11;
    ctx.beginPath(); ctx.ellipse(X[kl], Y[kl], er, er * 1.5 * blink, 0, 0, TAU); ctx.ellipse(X[kr], Y[kr], er, er * 1.5 * blink, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(X[km], Y[km], er * 1.1, er * 1.4 + Math.sin(time * 2) * er * 0.3, 0, 0, TAU); ctx.fill();
  }

  function render() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawRoom();
    drawObjs();
    ctx.save();
    ctx.translate(6, 10);
    ctx.fillStyle = C.shadow;
    ctx.beginPath();
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const k = j * (cols + 1) + i, r = k + 1, d = k + cols + 1;
      if (HL[k] >= 0 && LIVE[HL[k]] && VL[k] >= 0 && LIVE[VL[k]]) { ctx.moveTo(X[k], Y[k]); ctx.lineTo(X[r], Y[r]); ctx.lineTo(X[d], Y[d]); ctx.closePath(); }
      if (VL[r] >= 0 && LIVE[VL[r]] && HL[d] >= 0 && LIVE[HL[d]]) { ctx.moveTo(X[r], Y[r]); ctx.lineTo(X[d + 1], Y[d + 1]); ctx.lineTo(X[d], Y[d]); ctx.closePath(); }
    }
    ctx.fill();
    ctx.restore();
    ctx.lineWidth = 0.9; ctx.lineJoin = 'round';
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const k = j * (cols + 1) + i, r = k + 1, d = k + cols + 1, dr = d + 1;
      const rgb = baseColor(i, j);
      if (HL[k] >= 0 && LIVE[HL[k]] && VL[k] >= 0 && LIVE[VL[k]]) tri(k, r, d, rgb, i, j);
      if (VL[r] >= 0 && LIVE[VL[r]] && HL[d] >= 0 && LIVE[HL[d]]) tri(r, dr, d, rgb, i, j);
    }
    flushTris();
    drawGhostFace();
    ctx.globalCompositeOperation = C.dark ? 'lighter' : 'source-over';
    for (let k = 0; k < nPts; k++) {
      const b = BURN[k];
      if (b <= 0 || b >= 1.6) continue;
      const fl = (1.2 - Math.min(1, b)) * (0.7 + 0.3 * Math.sin(time * 30 + k));
      const r = 6 + 10 * fl;
      const g = ctx.createRadialGradient(X[k], Y[k] - r * 0.4, 0, X[k], Y[k] - r * 0.4, r);
      g.addColorStop(0, `rgba(255,240,170,${0.85 * fl})`); g.addColorStop(0.4, `rgba(255,140,30,${0.55 * fl})`); g.addColorStop(1, 'rgba(255,60,0,0)');
      ctx.fillStyle = g; ctx.fillRect(X[k] - r, Y[k] - r * 1.4, r * 2, r * 2);
    }
    for (const e of embers) { ctx.fillStyle = `rgba(255,${120 + 100 * e.life | 0},40,${e.life})`; ctx.fillRect(e.x, e.y, 2, 2); }
    ctx.globalCompositeOperation = 'source-over';
    for (const b of balls) {
      ctx.fillStyle = C.shadow; ctx.beginPath(); ctx.ellipse(b.x, FL - 2, b.r, 4, 0, 0, TAU); ctx.fill();
      const g = ctx.createRadialGradient(b.x - b.r * 0.35, b.y - b.r * 0.4, 1, b.x, b.y, b.r);
      g.addColorStop(0, '#fff3c4'); g.addColorStop(1, b.c);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 0.7, b.t * 4, b.t * 4 + 2); ctx.stroke();
    }
    ctx.lineCap = 'round';
    if (pinMode === 'left') {
      const g = ctx.createLinearGradient(x0 - 6, 0, x0 + 6, 0);
      g.addColorStop(0, C.rod[0]); g.addColorStop(1, C.rod[1]);
      ctx.strokeStyle = g; ctx.lineWidth = 9;
      ctx.beginPath(); ctx.moveTo(x0 - 5, y0 - 30); ctx.lineTo(x0 - 5, FL); ctx.stroke();
      ctx.fillStyle = C.ring; ctx.beginPath(); ctx.arc(x0 - 5, y0 - 34, 8, 0, TAU); ctx.fill();
    } else {
      const pinned = [];
      for (let i = 0; i <= cols; i++) if (PIN[i]) pinned.push(i);
      if (pinMode === 'tent') {
        ctx.fillStyle = C.rod[1];
        for (const i of pinned) { ctx.beginPath(); ctx.moveTo(PX[i] - 5, PY[i] - 4); ctx.lineTo(PX[i] + 5, PY[i] - 4); ctx.lineTo(PX[i], PY[i] + 10); ctx.closePath(); ctx.fill(); }
      } else if (pinned.length) {
        const corners = pinMode === 'corners';
        const ry = y0 - 9;
        if (corners) {
          ctx.fillStyle = C.rod[1];
          for (const i of [0, cols]) { ctx.beginPath(); ctx.arc(x0 + i * sp, ry - 4, 7, 0, TAU); ctx.fill(); ctx.fillRect(x0 + i * sp - 3, ry - 60, 6, 56); }
        } else {
          const rx0 = x0 - 18, rx1 = x0 + cols * sp + 18;
          const rg = ctx.createLinearGradient(0, ry - 5, 0, ry + 5);
          rg.addColorStop(0, C.rod[0]); rg.addColorStop(1, C.rod[1]);
          ctx.strokeStyle = rg; ctx.lineWidth = 8;
          ctx.beginPath(); ctx.moveTo(rx0, ry); ctx.lineTo(rx1, ry); ctx.stroke();
          ctx.fillStyle = C.rod[1];
          ctx.beginPath(); ctx.arc(rx0 - 4, ry, 8, 0, TAU); ctx.arc(rx1 + 4, ry, 8, 0, TAU); ctx.fill();
        }
        ctx.strokeStyle = C.ring; ctx.lineWidth = 2;
        for (const i of pinned) { ctx.beginPath(); ctx.ellipse(X[i], Y[i] - 6, 3.2, 7, 0, 0, TAU); ctx.stroke(); }
      }
    }
    for (const gr of grabs.values()) if (gr.cut) drawScissors(gr.x, gr.y, gr.ang);
    if (hover.on && !grabs.size) {
      if (tool === 'cut') drawScissors(hover.x, hover.y, -0.6);
      else if (tool === 'fire') drawMatch(hover.x, hover.y);
      else if (tool === 'throw') { ctx.strokeStyle = C.dark ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.35)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(hover.x, hover.y, 14, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
    }
    for (const gr of grabs.values()) if (gr.aim) {
      ctx.strokeStyle = '#ff5a36'; ctx.lineWidth = 3; ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.moveTo(gr.sx, gr.sy); ctx.lineTo(gr.sx + (gr.sx - gr.x), gr.sy + (gr.sy - gr.y)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#ff9f43'; ctx.beginPath(); ctx.arc(gr.sx, gr.sy, 12, 0, TAU); ctx.fill();
    }
  }
  function drawScissors(x, y, ang) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    const open = 0.25 + 0.2 * Math.abs(Math.sin(time * 14));
    ctx.lineWidth = 3; ctx.strokeStyle = C.dark ? '#e8e3f0' : '#333'; ctx.fillStyle = '#ff5a36';
    for (const s of [-1, 1]) {
      ctx.save(); ctx.rotate(s * open);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(18, 0); ctx.stroke();
      ctx.beginPath(); ctx.arc(-9, 0, 6, 0, TAU); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }
  function drawMatch(x, y) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(0.5);
    ctx.fillStyle = '#e7c58e'; ctx.fillRect(-2, 4, 4, 26);
    ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.ellipse(0, 3, 4, 5, 0, 0, TAU); ctx.fill();
    const f = 1 + 0.15 * Math.sin(time * 25);
    ctx.fillStyle = 'rgba(255,170,40,.85)'; ctx.beginPath(); ctx.ellipse(0, -5 * f, 5, 9 * f, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,245,180,.9)'; ctx.beginPath(); ctx.ellipse(0, -3, 2.5, 5, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }

  const hover = { x: 0, y: 0, on: false };
  const posOf = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  function touchCount() { let n = 0; for (const g of grabs.values()) if (g.type === 'touch') n++; return n; }
  function objAt(x, y) {
    return objs.find((o) => (o.type === 'circle' ? Math.hypot(x - o.x, y - o.y) < o.r + 6 || (o.kind === 'post' && Math.abs(x - o.x) < o.r + 4 && y > o.y) : x > o.x && x < o.x + o.w && y > o.y - 4 && y < o.y + o.legs));
  }
  cv.addEventListener('contextmenu', (e) => e.preventDefault());
  function pdown(id, x, y, type) {
    intro.classList.add('is-faded');
    const cut = tool === 'cut' || (type === 'touch' && touchCount() >= 1 && tool === 'grab');
    const gr = { x, y, px: x, py: y, cut, type, pts: [], ang: -0.6 };
    if (cut && type === 'touch') for (const g of grabs.values()) if (g.type === 'touch') { g.cut = true; g.pts = []; }
    if (tool === 'fire' && !cut) { gr.fire = true; ignite(x, y); }
    else if (tool === 'throw' && !cut) { gr.aim = true; gr.sx = x; gr.sy = y; }
    else if (!cut) {
      const R = Math.max(22, sp * 1.7), R2 = R * R;
      for (let k = 0; k < nPts; k++) { const dx = X[k] - x, dy = Y[k] - y; if (dx * dx + dy * dy < R2) gr.pts.push([k, dx, dy]); }
      if (gr.pts.length) { cv.classList.add('is-grab'); Curio.beep(180, 0.06, 'sine', 0.05); }
      else { const o = objAt(x, y); if (o) { gr.obj = o; gr.ox = (o.x) - x; gr.oy = o.y - y; cv.classList.add('is-grab'); } }
    } else cutAlong(x, y, x, y);
    grabs.set(id, gr);
  }
  cv.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch') return;
    cv.setPointerCapture?.(e.pointerId);
    const [x, y] = posOf(e);
    pdown(e.pointerId, x, y, 'touch');
  });
  cv.addEventListener('pointermove', (e) => {
    const [x, y] = posOf(e);
    hover.x = x; hover.y = y; hover.on = true;
    if (e.pointerType === 'touch') pmove(e.pointerId, x, y);
  });
  function pmove(id, x, y) {
    hover.x = x; hover.y = y; hover.on = true;
    const gr = grabs.get(id);
    if (!gr) return;
    gr.px = gr.x; gr.py = gr.y; gr.x = x; gr.y = y;
    if (gr.cut) {
      if (Math.hypot(x - gr.px, y - gr.py) > 0.5) gr.ang = Math.atan2(y - gr.py, x - gr.px);
      cutAlong(gr.px, gr.py, x, y);
    } else if (gr.fire) ignite(x, y);
    else if (gr.obj) {
      const o = gr.obj;
      o.x = Math.max(20, Math.min(W - 20 - (o.w || 0), x + gr.ox));
      if (o.kind !== 'table') o.y = Math.max(80, Math.min(FL - 60, y + gr.oy));
      if (o.kind === 'post') o.h = FL - o.y;
    }
  }
  cv.addEventListener('pointerleave', () => { hover.on = false; });
  const release = (e) => { if (e.pointerType === 'touch') prelease(e.pointerId); };
  function prelease(id) {
    const gr = grabs.get(id);
    if (gr && gr.aim) {
      let vx = (gr.sx - gr.x) * 7, vy = (gr.sy - gr.y) * 7;
      if (Math.hypot(vx, vy) < 200) { const tx = W / 2 - gr.sx, ty = H * 0.45 - gr.sy, d = Math.hypot(tx, ty) || 1; vx = tx / d * 900; vy = ty / d * 900 - 200; }
      balls.push({ x: gr.sx, y: gr.sy, vx, vy, r: 13, t: 0, c: Curio.pick(['#ff5a36', '#3a86ff', '#2ec4b6', '#ffbe0b', '#8338ec']) });
      if (balls.length > 8) balls.shift();
      thrown++; if (thrown >= 20) award('pitcher');
      thud(1);
      Curio.beep(500, 0.05, 'triangle', 0.05);
    }
    grabs.delete(id);
    if (![...grabs.values()].some((g) => g.pts.length || g.obj)) cv.classList.remove('is-grab');
  }
  Curio.drag(cv, {
    start: (p) => { if (p.pointerType !== 'touch') pdown('mouse', p.x, p.y, p.pointerType); },
    move: (p) => { if (p.pointerType !== 'touch') pmove('mouse', p.x, p.y); },
    end: () => prelease('mouse')
  });
  cv.addEventListener('contextmenu', (e) => { const [x, y] = posOf(e); cutAlong(x - 20, y, x + 20, y); });
  cv.addEventListener('pointerup', release);
  cv.addEventListener('pointercancel', release);

  function setTool(t) {
    tool = t;
    document.querySelectorAll('.tools .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tool === t)));
    cv.classList.toggle('is-cut', t !== 'grab');
    if (t === 'cut') Curio.toast('Scissors: drag across the fabric to cut.');
    if (t === 'fire') Curio.toast('Matches: tap the fabric to set it alight. Fire climbs upward.');
    if (t === 'throw') Curio.toast('Pull back and let go to fling a ball. Or just tap.');
  }
  function setScene(id, quiet) {
    scene = id;
    const sd = sceneDef();
    triedScenes.add(id); Curio.store.set('cloth:scenes', [...triedScenes]);
    if (triedScenes.size >= SCENES.length) award('scenes');
    if (sd.fabric != null) setFabric(sd.fabric, true);
    wind = !!sd.wind; $('bWind').setAttribute('aria-pressed', String(wind));
    if (sd.id === 'flag' && wind) setTimeout(() => { if (scene === 'flag' && wind) award('flag'); }, 4000);
    setTool(sd.tool || 'grab');
    drawGhostFace.done = false;
    build();
    document.querySelectorAll('#scenes button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === id)));
    if (!quiet) { Curio.toast(`${sd.name}: ${sd.d}`); [392, 523, 659].forEach((f, k) => setTimeout(() => Curio.beep(f, 0.07, 'sine', 0.06), k * 70)); }
  }
  document.querySelectorAll('.tools .chip').forEach((b) => b.addEventListener('click', () => setTool(b.dataset.tool)));
  $('bWind').addEventListener('click', () => { wind = !wind; $('bWind').setAttribute('aria-pressed', String(wind)); if (wind) { whoosh(); if (scene === 'flag') setTimeout(() => { if (wind && scene === 'flag') award('flag'); }, 3000); } });
  const PIN_CYCLE = ['all', 'some', 'corners', 'left'];
  $('bPins').addEventListener('click', () => {
    const i = PIN_CYCLE.indexOf(pinMode);
    pinMode = PIN_CYCLE[(i + 1) % PIN_CYCLE.length];
    applyPins(); Curio.beep(440 + PIN_CYCLE.indexOf(pinMode) * 120, 0.06, 'triangle', 0.06);
  });
  $('bDrop').addEventListener('click', () => { PIN.fill(0); pinMode = 'none'; applyPins(); Curio.beep(300, 0.2, 'sine', 0.07); });
  $('bReset').addEventListener('click', () => { build(); Curio.beep(520, 0.08, 'sine', 0.06); });
  $('bPanel').addEventListener('click', () => { const p = $('panel'); p.hidden = !p.hidden; $('bPanel').setAttribute('aria-pressed', String(!p.hidden)); });
  function whoosh() {
    if (Curio.muted) return;
    const ac = noise(); if (!ac) return;
    const t = ac.currentTime, src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = noiseBuf; f.type = 'lowpass'; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(1600, t + 0.25);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.1); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    src.connect(f).connect(g).connect(ac.destination); src.start(t); src.stop(t + 0.31);
  }

  const fabEl = $('fabrics');
  FABRICS.forEach((f, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.title = f.name; b.setAttribute('aria-label', f.name);
    b.style.background = f.swatch;
    b.addEventListener('click', () => setFabric(i));
    fabEl.append(b);
  });
  function setFabric(i, quiet) { fabric = i; if (!quiet) Curio.store.set('cloth:fabric', i); [...fabEl.children].forEach((b, k) => b.setAttribute('aria-pressed', String(k === i))); }
  $('scenes').innerHTML = SCENES.map((s) => `<button type="button" data-id="${s.id}"><b>${s.name}</b>${s.d}</button>`).join('');
  $('scenes').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { setScene(b.dataset.id); intro.classList.add('is-faded'); } });
  [['grav', 'oGrav', (v) => v.toFixed(2) + '×'], ['windS', 'oWind', (v) => v.toFixed(2) + '×'], ['stiff', 'oStiff', (v) => String(v)], ['tough', 'oTough', (v) => (v >= 11.9 ? 'unbreakable' : v.toFixed(1) + '×')]].forEach(([id, out, f]) => {
    const el = $(id);
    const apply = () => { S[id] = parseFloat(el.value); if (id === 'tough' && S.tough >= 11.9) S.tough = 1e9; $(out).textContent = f(parseFloat(el.value)); };
    el.addEventListener('input', apply);
    apply();
  });

  addEventListener('keydown', (e) => {
    if (e.target.closest?.('input, button') || e.ctrlKey || e.metaKey) return;
    const k = e.key.toLowerCase();
    if (k === '1') setTool('grab');
    else if (k === '2' || k === 's') setTool('cut');
    else if (k === '3') setTool('fire');
    else if (k === '4') setTool('throw');
    else if (k === 'w') $('bWind').click();
    else if (k === 'r') $('bReset').click();
    else if (k === 'p') $('bPins').click();
    else if (k === 'd') $('bDrop').click();
    else if (k === ' ') { e.preventDefault(); const left = Math.random() < 0.5, sx = left ? 30 : W - 30, sy = FL - 40; const tx = W / 2 + Curio.rand(-120, 120), ty = H * 0.4, d = Math.hypot(tx - sx, ty - sy) || 1; balls.push({ x: sx, y: sy, vx: (tx - sx) / d * 950, vy: (ty - sy) / d * 950 - 250, r: 13, t: 0, c: Curio.pick(['#ff5a36', '#3a86ff', '#2ec4b6', '#ffbe0b']) }); thrown++; thud(1); }
    else if (k === 'b') { const live = []; for (let i = 0; i < nPts; i++) if (!PIN[i] && BURN[i] === 0) live.push(i); if (live.length) { const i = Curio.pick(live); ignite(X[i], Y[i]); } }
  });


  const GM = Curio.mode;
  let lastScene = scene;
  function surprise() {
    const sd = Curio.pick(SCENES.filter((x) => x.id !== lastScene)); lastScene = sd.id;
    setScene(sd.id, true);
    if (Math.random() < 0.6) setFabric(Math.floor(Math.random() * FABRICS.length), true);
    intro.classList.add('is-faded');
    Curio.toast(`${sd.name}: ${sd.d}`);
    [523, 659, 784].forEach((f, k) => setTimeout(() => Curio.beep(f, 0.06, 'triangle', 0.05), k * 60));
  }
  $('bSurprise').addEventListener('click', surprise);
  addEventListener('keydown', (e) => { if (e.target.closest?.('input, textarea') || e.ctrlKey || e.metaKey) return; if (e.key === 'g' || e.key === 'G') surprise(); });
  const ORDERS = [
    ['Snip 100 threads', () => totals.cut, 100], ['Snip 1,000 threads', () => totals.cut, 1000], ['Burn 300 bits of cloth', () => totals.burn, 300],
    ['Burn 3,000 bits of cloth', () => totals.burn, 3000], ['Visit every scene', () => triedScenes.size, SCENES.length], ['Earn 5 badges', () => badges.length, 5]
  ];
  function paintOrders() {
    $('orders').replaceChildren(...ORDERS.map(([t, f, n]) => { const li = document.createElement('li'); const v = Math.min(n, f()); li.textContent = t; if (v >= n) li.classList.add('done'); const sm = document.createElement('small'); sm.textContent = `${Curio.fmt(v)}/${Curio.fmt(n)}`; li.append(sm); return li; }));
  }
  if (GM === 'advanced') { paintOrders(); setInterval(() => { if (!document.hidden && !$('panel').hidden) paintOrders(); }, 1500); }
  const SL = ['grav', 'windS', 'stiff', 'tough'];
  $('bCopy').addEventListener('click', async () => {
    const c = 'ZCL1.' + btoa(JSON.stringify({ s: scene, f: fabric, v: SL.map((k) => +$(k).value) }));
    try { await navigator.clipboard.writeText(c); Curio.toast('Setup code copied'); } catch { Curio.toast(c, 5000); }
  });
  $('bPaste').addEventListener('click', async () => {
    const ta = document.createElement('textarea'); ta.className = 'cl-code'; ta.placeholder = 'Paste a ZCL1 code'; ta.setAttribute('aria-label', 'Setup code');
    const v = Curio.modal({ emoji: '📥', title: 'Paste a setup', body: ta, buttons: [{ label: 'Hang it up', value: 'go' }, { label: 'Cancel', value: '' }] });
    setTimeout(() => ta.focus(), 40);
    if (await v !== 'go') return;
    try {
      const t = ta.value.trim(); if (!t.startsWith('ZCL1.')) throw 0;
      const o = JSON.parse(atob(t.slice(5)));
      SL.forEach((k, i) => { if (typeof o.v[i] === 'number') { $(k).value = o.v[i]; $(k).dispatchEvent(new Event('input')); } });
      if (SCENES.some((x) => x.id === o.s)) setScene(o.s, true);
      if (FABRICS[o.f]) setFabric(o.f, true);
      Curio.toast('Setup loaded');
    } catch { Curio.toast('That code did not work'); }
  });

  function resize() {
    const r = cv.getBoundingClientRect();
    const oldW = W;
    dpr = Math.min(2, devicePixelRatio || 1);
    W = r.width; H = r.height; FL = H - (W < 560 ? 150 : 84);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    if (Math.abs(oldW - W) > 1 || !X) build();
  }

  let raf = 0, last = 0, acc = 0;
  const DT = 1 / 120;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    acc += Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    let n = 0;
    while (acc >= DT && n < 6) { time += DT; step(DT); acc -= DT; n++; }
    if (n >= 6) acc = 0;
    render();
  }
  const start = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  addEventListener('resize', resize);
  setFabric(Math.max(0, Math.min(FABRICS.length - 1, Curio.store.get('cloth:fabric', 0) | 0)), true);
  renderBadges();
  if (!Curio.store.get('cloth:padtip', false)) { Curio.store.set('cloth:padtip', true); setTimeout(() => Curio.toast('Tip: on a touchpad, turn on Touchpad mode in the top bar. Click to grab, click again to let go.', 4200), 2500); }
  resize();
  document.querySelectorAll('#scenes button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === scene)));
  start();
  window.__cl = { setScene, setTool, ignite, get burnt() { return burnt; }, get cuts() { return cuts; }, throwBall(x, y, vx, vy) { balls.push({ x, y, vx, vy, r: 13, t: 0, c: '#ff5a36' }); } };
})();
