(() => {
  const cv = document.getElementById('cv');
  const ctx = cv.getContext('2d');
  const $ = (id) => document.getElementById(id);
  const intro = $('intro'), main = $('main');
  const MAX = 1200, TAU = Math.PI * 2;
  const px = new Float32Array(MAX), py = new Float32Array(MAX), vx = new Float32Array(MAX), vy = new Float32Array(MAX);
  const ph = new Float32Array(MAX), flap = new Float32Array(MAX), depth = new Float32Array(MAX), fear = new Float32Array(MAX);
  const S = { sep: 1.7, ali: 1.1, coh: 0.9, num: 400, spd: 1, vis: 48, wind: 0 };
  const WORLDS = {
    sky: { pred: '🦅 Hawk', food: '🌾 Food', obst: '🎈 Balloons', many: 'birds', intro: 'Every bird follows three rules: don\'t crowd, match your neighbours, stay with the group. Move your pointer to send in the hawk.' },
    sea: { pred: '🦈 Shark', food: '🦐 Krill', obst: '🪸 Coral', many: 'fish', intro: 'A school of fish runs on the same three rules as a flock of birds. Move your pointer to send in the shark.' },
    night: { pred: '🦉 Owl', food: '🦟 Moths', obst: '🏮 Lanterns', many: 'bats', intro: 'Bats at dusk, swirling over the trees. Same three rules, different wings. Move your pointer to send in the owl.' }
  };
  const PRESETS = [
    { id: 'classic', name: 'Classic', d: 'The default balance', v: { sep: 1.7, ali: 1.1, coh: 0.9, spd: 1, vis: 48 } },
    { id: 'murmur', name: 'Murmuration', d: 'Huge, tight, rippling', v: { sep: 1.1, ali: 1.8, coh: 1.5, spd: 1.1, vis: 42, num: 900 } },
    { id: 'drift', name: 'Lazy drift', d: 'Slow and spread out', v: { sep: 1.8, ali: 0.9, coh: 0.7, spd: 0.5, vis: 60 } },
    { id: 'bait', name: 'Bait ball', d: 'Everyone huddles', v: { sep: 0.25, ali: 0.6, coh: 3.2, spd: 1, vis: 80 } },
    { id: 'swarm', name: 'Gnat swarm', d: 'No alignment at all', v: { sep: 1.5, ali: 0, coh: 0.6, spd: 1.3, vis: 40 } },
    { id: 'loners', name: 'Loners', d: 'Nobody sticks together', v: { sep: 2, ali: 0.3, coh: 0, spd: 1, vis: 30 } }
  ];
  const BADGES = [
    ['hunt10', '🎯 Hunter', 'Catch 10 in a hunt'],
    ['hunt25', '🔥 Apex', 'Catch 25 in a hunt'],
    ['hunt50', '👑 Top of the food chain', 'Catch 50 in a hunt'],
    ['combo5', '⚡ Feeding frenzy', '5 catches in a combo'],
    ['worlds', '🌍 Explorer', 'Visit all three worlds'],
    ['feed', '🍽️ Picnic', 'Let the flock finish its food'],
    ['thousand', '🌪️ Murmuration', 'Fly 1000+ at once'],
    ['inspect', '🔍 Field biologist', 'Inspect a single bird']
  ];
  let N = 0, W = 0, H = 0, dpr = 1, birdSize = 3.2, mode = 'hawk', time = 0;
  let world = Curio.store.get('flock:world', 'sky');
  if (!WORLDS[world]) world = 'sky';
  let hueMode = false, inspect = false;
  let badges = Curio.store.get('flock:badges', []);
  if (!Array.isArray(badges)) badges = [];
  const visited = new Set(Curio.store.get('flock:visited', []));
  let cellStart = new Int32Array(1), cellOf = new Int32Array(MAX), sorted = new Int32Array(MAX), gcols = 1, grows = 1, gsize = 48;
  const hawk = { x: -200, y: -200, vx: 0, vy: 0, on: false, ph: 0, a: 0, alpha: 0 };
  let obstacles = [], foods = [], parts = [];
  const sky = document.createElement('canvas'), skyCtx = sky.getContext('2d');
  let clouds = [], weeds = [];
  const hunt = { on: false, t: 0, score: 0, combo: 0, lastCatch: 0, bestCombo: 0 };
  const HUNT_T = 30;

  function award(id) {
    if (badges.includes(id)) return;
    badges.push(id);
    Curio.store.set('flock:badges', badges);
    const b = BADGES.find((x) => x[0] === id);
    if (b) setTimeout(() => Curio.toast(`Badge: ${b[1]}`), 300);
    renderBadges();
  }
  function renderBadges() {
    $('badges').innerHTML = BADGES.map(([id, n, d]) => `<div class="badge${badges.includes(id) ? ' got' : ''}"><b>${badges.includes(id) ? n : `🔒 ${n.split(' ').slice(1).join(' ')}`}</b>${d}</div>`).join('');
  }

  function spawn(i, x, y) {
    px[i] = x ?? Math.random() * W; py[i] = y ?? Math.random() * H * 0.8;
    const a = Math.random() * TAU, s = 60 + Math.random() * 40;
    vx[i] = Math.cos(a) * s; vy[i] = Math.sin(a) * s;
    ph[i] = Math.random() * TAU; flap[i] = Math.random(); depth[i] = 0.62 + Math.random() * 0.55; fear[i] = 0;
  }
  function spawnEdge(i) {
    const side = Math.random() < 0.5 ? -15 : W + 15;
    spawn(i, side, Curio.rand(H * 0.1, H * 0.7));
    vx[i] = side < 0 ? 90 : -90;
  }
  function setCount(n) {
    n = Math.max(0, Math.min(MAX, n | 0));
    for (let i = N; i < n; i++) spawn(i);
    N = n;
    if (N >= 1000) award('thousand');
  }

  function buildGrid() {
    gsize = S.vis;
    gcols = Math.max(1, Math.ceil(W / gsize)); grows = Math.max(1, Math.ceil(H / gsize));
    const cells = gcols * grows;
    if (cellStart.length < cells + 1) cellStart = new Int32Array(cells + 1);
    cellStart.fill(0, 0, cells + 1);
    for (let i = 0; i < N; i++) {
      let cx = (px[i] / gsize) | 0, cy = (py[i] / gsize) | 0;
      if (cx < 0) cx = 0; else if (cx >= gcols) cx = gcols - 1;
      if (cy < 0) cy = 0; else if (cy >= grows) cy = grows - 1;
      const c = cy * gcols + cx; cellOf[i] = c; cellStart[c + 1]++;
    }
    for (let c = 0; c < cells; c++) cellStart[c + 1] += cellStart[c];
    const fill = cellStart.slice(0, cells);
    for (let i = 0; i < N; i++) sorted[fill[cellOf[i]]++] = i;
  }

  function update(dt) {
    buildGrid();
    const maxS = 150 * S.spd, minS = 70 * S.spd, maxF = 420 * S.spd;
    const vis = S.vis, vis2 = vis * vis, sepR = vis * 0.42, sepR2 = sepR * sepR;
    const margin = Math.min(90, W * 0.12), ground = H - Math.min(world === 'sea' ? 90 : 120, H * 0.16);
    let scared = 0;
    const catchR = 15 * Math.max(1, birdSize / 3);
    for (let i = 0; i < N; i++) {
      const x = px[i], y = py[i];
      let ax = S.wind * 3, ay = 0, n = 0, avx = 0, avy = 0, cx = 0, cy = 0, sx = 0, sy = 0, sn = 0;
      const gx = cellOf[i] % gcols, gy = (cellOf[i] / gcols) | 0;
      outer: for (let yy = gy - 1; yy <= gy + 1; yy++) {
        if (yy < 0 || yy >= grows) continue;
        for (let xx = gx - 1; xx <= gx + 1; xx++) {
          if (xx < 0 || xx >= gcols) continue;
          const c = yy * gcols + xx;
          for (let k = cellStart[c], e = cellStart[c + 1]; k < e; k++) {
            const j = sorted[k];
            if (j === i) continue;
            const dx = px[j] - x, dy = py[j] - y, d2 = dx * dx + dy * dy;
            if (d2 > vis2) continue;
            n++; avx += vx[j]; avy += vy[j]; cx += dx; cy += dy;
            if (d2 < sepR2 && d2 > 0.0001) { const inv = 1 / d2; sx -= dx * inv; sy -= dy * inv; sn++; }
            if (n >= 28) break outer;
          }
        }
      }
      const sp = Math.hypot(vx[i], vy[i]) || 1;
      if (n) {
        const am = Math.hypot(avx, avy) || 1;
        ax += (avx / am * maxS - vx[i]) * S.ali;
        ay += (avy / am * maxS - vy[i]) * S.ali;
        const cm = Math.hypot(cx, cy) || 1;
        ax += (cx / cm * maxS - vx[i]) * S.coh * Math.min(1, cm / (vis * 0.5));
        ay += (cy / cm * maxS - vy[i]) * S.coh * Math.min(1, cm / (vis * 0.5));
      }
      if (sn) {
        const sm = Math.hypot(sx, sy) || 1;
        ax += (sx / sm * maxS - vx[i]) * S.sep * 1.3;
        ay += (sy / sm * maxS - vy[i]) * S.sep * 1.3;
      }
      let lim = maxF;
      for (const f of foods) {
        const dx = f.x - x, dy = f.y - y, d = Math.hypot(dx, dy);
        if (d < 280 && d > 0.01) {
          const k = d < 30 ? 0.3 : 1;
          ax += dx / d * maxS * 2.2 * k; ay += dy / d * maxS * 2.2 * k;
          if (d < 26) f.amt -= dt * 4;
        }
      }
      if (hawk.on) {
        const dx = x - hawk.x, dy = y - hawk.y, d = Math.hypot(dx, dy), R = 150;
        if (d < R && d > 0.01) {
          const k = (1 - d / R);
          const panic = hunt.on ? 6.5 : 9;
          ax += dx / d * maxS * panic * k; ay += dy / d * maxS * panic * k;
          fear[i] = Math.min(1, fear[i] + k * 0.25); lim = maxF * 3.5;
        }
        if (hunt.on && d < catchR) { caught(i); continue; }
      }
      for (const b of obstacles) {
        const dx = x - b.x, dy = y - (b.y + b.bob), d = Math.hypot(dx, dy), R = b.r + 46;
        if (d < R && d > 0.01) {
          const k = Math.pow(1 - (d - b.r) / 46, 2) * (d < b.r ? 3 : 1);
          const tx = -vy[i] / sp, ty = vx[i] / sp, side = (dx * tx + dy * ty) >= 0 ? 1 : -1;
          ax += (dx / d * 0.7 + tx * side * 0.6) * maxS * 10 * k;
          ay += (dy / d * 0.7 + ty * side * 0.6) * maxS * 10 * k;
          lim = Math.max(lim, maxF * 4);
        }
      }
      if (x < margin) ax += (margin - x) / margin * maxF * 1.4 * (S.wind ? 0.4 : 1);
      else if (x > W - margin) ax -= (x - (W - margin)) / margin * maxF * 1.4 * (S.wind ? 0.4 : 1);
      if (y < margin * 0.8) ay += (margin * 0.8 - y) / margin * maxF * 1.4;
      else if (y > ground) ay -= (y - ground) / margin * maxF * 1.8;
      const am = Math.hypot(ax, ay);
      if (am > lim) { ax *= lim / am; ay *= lim / am; }
      vx[i] += ax * dt; vy[i] += ay * dt;
      let s = Math.hypot(vx[i], vy[i]);
      const top = maxS * (1 + fear[i] * 1.1);
      if (s > top) { vx[i] *= top / s; vy[i] *= top / s; s = top; }
      else if (s < minS) { vx[i] *= minS / (s || 1); vy[i] *= minS / (s || 1); s = minS; }
      px[i] += vx[i] * dt; py[i] += vy[i] * dt;
      if (px[i] < -20) px[i] = W + 15; else if (px[i] > W + 20) px[i] = -15;
      if (py[i] < -20) py[i] = H + 15; else if (py[i] > H + 20) py[i] = -15;
      if (fear[i] > 0.3) scared++;
      fear[i] = Math.max(0, fear[i] - dt * 0.8);
      const want = fear[i] > 0.2 || ay < -maxF * 0.3 ? 1 : (Math.sin(time * 0.6 + i * 1.7) > 0.2 ? 0.85 : 0.08);
      flap[i] += (want - flap[i]) * Math.min(1, dt * 3);
      ph[i] += dt * (11 + fear[i] * 10 + (i % 7)) * (0.35 + flap[i]);
    }
    if (scared > N * 0.08) chirp();
    for (let k = foods.length - 1; k >= 0; k--) {
      const f = foods[k];
      f.t += dt;
      if (f.amt <= 0) { foods.splice(k, 1); puff(f.x, f.y, 10, '#ffe08a'); Curio.beep(880, 0.06, 'triangle', 0.05); award('feed'); }
    }
  }

  function caught(i) {
    const now = performance.now();
    hunt.combo = now - hunt.lastCatch < 900 ? hunt.combo + 1 : 1;
    hunt.lastCatch = now;
    hunt.bestCombo = Math.max(hunt.bestCombo, hunt.combo);
    if (hunt.combo >= 5) award('combo5');
    hunt.score += 1;
    puff(px[i], py[i], 8, world === 'sea' ? 'rgba(220,240,255,.9)' : world === 'night' ? '#b9a3d9' : '#f4efe6');
    const ac = !Curio.muted && Curio.audioContext && Curio.audioContext();
    if (ac) {
      const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(500 + Math.min(10, hunt.combo) * 80, t); o.frequency.exponentialRampToValueAtTime(1300 + hunt.combo * 90, t + 0.08);
      g.gain.setValueAtTime(0.08, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t + 0.16);
    }
    try { navigator.vibrate && navigator.vibrate(12); } catch (e) { }
    $('hScore').textContent = hunt.score;
    $('hCombo').textContent = hunt.combo > 1 ? `Combo x${hunt.combo}!` : '';
    const hud = $('hud'); hud.classList.remove('bump'); void hud.offsetWidth; hud.classList.add('bump');
    spawnEdge(i);
  }

  function puff(x, y, n, color) {
    for (let k = 0; k < n; k++) {
      const a = Math.random() * TAU, s = Curio.rand(30, 140);
      parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 20, life: 1, color, r: Curio.rand(1.5, 3.5), rot: Math.random() * TAU });
    }
  }

  let lastChirp = 0, gestured = false;
  addEventListener('pointerdown', () => { gestured = true; }, { capture: true });
  addEventListener('keydown', () => { gestured = true; }, { capture: true });
  function chirp() {
    const now = performance.now();
    if (now - lastChirp < 380 || Curio.muted || !gestured) return;
    lastChirp = now;
    const ac = Curio.audioContext(); if (!ac) return;
    const t = ac.currentTime;
    if (world === 'sea') {
      for (let k = 0; k < 3; k++) {
        const o = ac.createOscillator(), g = ac.createGain(), st = t + k * 0.06;
        o.type = 'sine'; const f = 300 + Math.random() * 300;
        o.frequency.setValueAtTime(f, st); o.frequency.exponentialRampToValueAtTime(f * 2.2, st + 0.06);
        g.gain.setValueAtTime(0.0001, st); g.gain.exponentialRampToValueAtTime(0.04, st + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, st + 0.07);
        o.connect(g).connect(ac.destination); o.start(st); o.stop(st + 0.08);
      }
      return;
    }
    const base = world === 'night' ? 4200 + Math.random() * 1500 : 2300 + Math.random() * 900;
    for (let k = 0; k < 2 + (Math.random() * 2 | 0); k++) {
      const o = ac.createOscillator(), g = ac.createGain(), st = t + k * (world === 'night' ? 0.04 : 0.075);
      o.type = 'sine';
      o.frequency.setValueAtTime(base, st); o.frequency.exponentialRampToValueAtTime(base * 1.45, st + 0.05);
      g.gain.setValueAtTime(0.0001, st); g.gain.exponentialRampToValueAtTime(world === 'night' ? 0.015 : 0.035, st + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, st + 0.06);
      o.connect(g).connect(ac.destination); o.start(st); o.stop(st + 0.08);
    }
  }

  function themeColors() {
    const dark = Curio.isDark();
    if (world === 'sea') return dark
      ? { sky: ['#03101f', '#06243d', '#0a3556', '#0e4466'], sun: [120, 200, 255], cloud: 'rgba(160,220,255,', birds: ['#5d7f99', '#86a7bf', '#b9d2e2'], sand: '#5b4a2c', weed: '#1f5e4a', balloonShade: 0.85, dark: true, light: true }
      : { sky: ['#0b5f8f', '#1784b8', '#36a6cf', '#6cc4d8'], sun: [210, 245, 255], cloud: 'rgba(255,255,255,', birds: ['#5a7d99', '#8eb0c8', '#d2e4ef'], sand: '#e3cc92', weed: '#2f8a5f', balloonShade: 1, dark: false, light: true };
    if (world === 'night') return dark
      ? { sky: ['#05041a', '#120c33', '#2c1a4d', '#4a2550'], sun: [250, 245, 220], hills: ['#160f2a', '#0e0a1d', '#070511'], cloud: 'rgba(170,150,220,', birds: ['#2a2342', '#1b162e', '#0c0a16'], balloonShade: 1, dark: true, light: true }
      : { sky: ['#1a1446', '#3d2a6b', '#8a4a7a', '#e98a6b'], sun: [255, 248, 225], hills: ['#2d1f4a', '#1e1535', '#120c22'], cloud: 'rgba(255,200,210,', birds: ['#3b2f55', '#261e3b', '#120e1d'], balloonShade: 1, dark: true, light: true };
    return dark
      ? { sky: ['#141a3d', '#3b2a5c', '#a2546a', '#f2925d'], sun: [255, 170, 110], hills: ['#3d2a4a', '#2a1f38', '#170f22'], cloud: 'rgba(255,190,170,', birds: ['#2b2236', '#1d1626', '#0e0a14'], balloonShade: .78, dark: true, light: true }
      : { sky: ['#4f9fe0', '#86c2ef', '#c5e3f6', '#ffe6c9'], sun: [255, 244, 210], hills: ['#9cc6b8', '#76ab97', '#4f8a72'], cloud: 'rgba(255,255,255,', birds: ['#5b6b80', '#38465a', '#1d2633'], balloonShade: 1, dark: false, light: false };
  }
  let T = themeColors();

  function paintSky() {
    sky.width = Math.round(W * dpr); sky.height = Math.round(H * dpr);
    const g = skyCtx;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const grad = g.createLinearGradient(0, 0, 0, H);
    if (world === 'sea') { grad.addColorStop(0, T.sky[3]); grad.addColorStop(0.3, T.sky[2]); grad.addColorStop(0.7, T.sky[1]); grad.addColorStop(1, T.sky[0]); }
    else { grad.addColorStop(0, T.sky[0]); grad.addColorStop(0.45, T.sky[1]); grad.addColorStop(0.78, T.sky[2]); grad.addColorStop(1, T.sky[3]); }
    g.fillStyle = grad; g.fillRect(0, 0, W, H);
    if (world === 'sea') {
      for (let k = 0; k < 7; k++) {
        const x = W * (k / 6) + Curio.rand(-40, 40);
        const rg = g.createLinearGradient(x, 0, x + 120, H * 0.85);
        rg.addColorStop(0, `rgba(${T.sun},.18)`); rg.addColorStop(1, `rgba(${T.sun},0)`);
        g.fillStyle = rg;
        g.beginPath(); g.moveTo(x - 20, 0); g.lineTo(x + 30 + k * 4, 0); g.lineTo(x + 180, H * 0.85); g.lineTo(x + 60, H * 0.85); g.closePath(); g.fill();
      }
      g.fillStyle = T.sand;
      g.beginPath(); g.moveTo(0, H);
      for (let x = 0; x <= W + 20; x += 20) g.lineTo(x, H - 46 - 12 * Math.sin(x * 0.008) - 6 * Math.sin(x * 0.03));
      g.lineTo(W, H); g.closePath(); g.fill();
      g.fillStyle = 'rgba(0,0,0,.08)';
      for (let k = 0; k < W / 6; k++) g.fillRect(Math.random() * W, H - Math.random() * 40, 2, 1.5);
      weeds = Array.from({ length: Math.round(W / 70) }, () => ({ x: Math.random() * W, h: Curio.rand(50, 140), ph: Math.random() * TAU, c: Curio.pick([T.weed, '#3aa676', '#c0563f', '#d9785a']) }));
      clouds = Array.from({ length: Math.round(W / 40) }, () => ({ x: Math.random() * W, y: Math.random() * H, s: Curio.rand(1, 4), v: Curio.rand(12, 36) }));
      return;
    }
    weeds = [];
    const sunX = W * 0.78, sunY = world === 'night' ? H * 0.22 : T.dark ? H * 0.84 : H * 0.2, sr = Math.min(W, H) * (world === 'night' ? 0.08 : T.dark ? 0.09 : 0.05);
    const sg = g.createRadialGradient(sunX, sunY, 0, sunX, sunY, sr * 7);
    sg.addColorStop(0, `rgba(${T.sun},.85)`); sg.addColorStop(0.15, `rgba(${T.sun},.4)`); sg.addColorStop(1, `rgba(${T.sun},0)`);
    if (T.dark) {
      const stars = W * H / 7000;
      for (let k = 0; k < stars; k++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.7 * (1 - k / stars)})`; const yy = Math.random() * H * 0.55; g.fillRect(Math.random() * W, yy, 1.3, 1.3); }
    }
    g.fillStyle = sg; g.fillRect(0, 0, W, H);
    g.fillStyle = `rgb(${T.sun})`; g.beginPath(); g.arc(sunX, sunY, sr, 0, TAU); g.fill();
    if (world === 'night') {
      g.fillStyle = 'rgba(200,190,170,.35)';
      [[-.3, -.2, .22], [.25, .15, .14], [.05, .35, .1], [-.35, .3, .08]].forEach(([dx, dy, r]) => { g.beginPath(); g.arc(sunX + dx * sr, sunY + dy * sr, r * sr, 0, TAU); g.fill(); });
    }
    T.hills.forEach((c, layer) => {
      g.fillStyle = c; g.beginPath(); g.moveTo(0, H);
      const base = H - (90 - layer * 28) * Math.min(1, H / 700) - 10, amp = 26 - layer * 6;
      for (let x = 0; x <= W + 20; x += 20) {
        const y = base - amp * Math.sin(x * (0.004 + layer * 0.002) + layer * 2.1) - amp * 0.5 * Math.sin(x * 0.013 + layer);
        g.lineTo(x, y);
      }
      g.lineTo(W, H); g.closePath(); g.fill();
      if (world === 'night' && layer === 1) {
        for (let k = 0; k < W / 55; k++) {
          const tx = Math.random() * W, th = Curio.rand(40, 110), ty = base - amp * Math.sin(tx * 0.006 + 2.1) + 6;
          g.beginPath(); g.moveTo(tx, ty - th);
          for (let s = 1; s <= 4; s++) { g.lineTo(tx - th * 0.12 * s, ty - th + th * 0.23 * s); g.lineTo(tx - th * 0.05 * s, ty - th + th * 0.23 * s); }
          for (let s = 4; s >= 1; s--) { g.lineTo(tx + th * 0.05 * s, ty - th + th * 0.23 * s); g.lineTo(tx + th * 0.12 * s, ty - th + th * 0.23 * s); }
          g.closePath(); g.fill();
        }
      }
    });
    clouds = Array.from({ length: Math.max(3, Math.round(W / 260)) }, () => ({ x: Math.random() * W, y: Curio.rand(H * 0.08, H * 0.55), s: Curio.rand(0.6, 1.4), v: Curio.rand(4, 12) }));
  }
  function drawCloud(c) {
    if (world === 'sea') {
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(c.x, c.y, c.s, 0, TAU); ctx.stroke();
      return;
    }
    const s = c.s * 34;
    ctx.fillStyle = T.cloud + (T.dark ? (world === 'night' ? 0.12 : 0.09) : 0.75) + ')';
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, s * 2.2, s * 0.6, 0, 0, TAU);
    ctx.ellipse(c.x - s * 0.9, c.y - s * 0.25, s * 0.9, s * 0.65, 0, 0, TAU);
    ctx.ellipse(c.x + s * 0.3, c.y - s * 0.5, s * 1.1, s * 0.9, 0, 0, TAU);
    ctx.ellipse(c.x + s * 1.3, c.y - s * 0.15, s * 0.7, s * 0.5, 0, 0, TAU);
    ctx.fill();
  }
  function drawWeeds() {
    for (const w of weeds) {
      ctx.strokeStyle = w.c; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(w.x, H - 40);
      for (let k = 1; k <= 6; k++) ctx.lineTo(w.x + Math.sin(time * 1.2 + w.ph + k * 0.6) * k * 3 + S.wind * 0.05 * k, H - 40 - w.h * k / 6);
      ctx.stroke();
    }
  }

  function setXf(x, y, a, s) {
    const c = Math.cos(a) * dpr * s, sn = Math.sin(a) * dpr * s;
    ctx.setTransform(c, sn, -sn, c, x * dpr, y * dpr);
  }
  function birdPath(x, y, a, s, p, amt) {
    setXf(x, y, a, s);
    const f = Math.cos(p);
    const span = 1.0 + 1.5 * (amt * Math.abs(f) + (1 - amt) * 0.9);
    const sweep = -0.55 - 0.45 * amt * f;
    ctx.moveTo(1.8, 0);
    ctx.quadraticCurveTo(1.3, 0.34, 0.5, 0.34);
    ctx.quadraticCurveTo(0.75, span * 0.75, sweep, span);
    ctx.quadraticCurveTo(-0.45, span * 0.5, -0.6, 0.3);
    ctx.lineTo(-1.7, 0.62); ctx.lineTo(-1.4, 0); ctx.lineTo(-1.7, -0.62); ctx.lineTo(-0.6, -0.3);
    ctx.quadraticCurveTo(-0.45, -span * 0.5, sweep, -span);
    ctx.quadraticCurveTo(0.75, -span * 0.75, 0.5, -0.34);
    ctx.quadraticCurveTo(1.3, -0.34, 1.8, 0);
    ctx.closePath();
  }
  function fishPath(x, y, a, s, p) {
    setXf(x, y, a, s);
    const w = Math.sin(p * 0.7) * 0.45;
    ctx.moveTo(2.1, 0);
    ctx.quadraticCurveTo(1.2, 0.95, -0.6, 0.45);
    ctx.lineTo(-1.6, 0.85 + w); ctx.lineTo(-1.3, w * 0.5); ctx.lineTo(-1.6, -0.85 + w);
    ctx.lineTo(-0.6, -0.45);
    ctx.quadraticCurveTo(1.2, -0.95, 2.1, 0);
    ctx.closePath();
  }
  function batPath(x, y, a, s, p) {
    setXf(x, y, a, s);
    const f = Math.cos(p * 1.3);
    const span = 1.2 + 1.4 * Math.abs(f);
    ctx.moveTo(1.3, 0.25); ctx.lineTo(1.6, 0.5); ctx.lineTo(1.4, 0);
    ctx.lineTo(1.6, -0.5); ctx.lineTo(1.3, -0.25);
    ctx.lineTo(0.5, -0.4);
    ctx.lineTo(0.9, -span); ctx.lineTo(0.2, -span * 0.7); ctx.lineTo(-0.2, -span * 0.85); ctx.lineTo(-0.5, -span * 0.5); ctx.lineTo(-0.9, -span * 0.55);
    ctx.lineTo(-0.7, -0.3); ctx.lineTo(-1.2, 0); ctx.lineTo(-0.7, 0.3);
    ctx.lineTo(-0.9, span * 0.55); ctx.lineTo(-0.5, span * 0.5); ctx.lineTo(-0.2, span * 0.85); ctx.lineTo(0.2, span * 0.7); ctx.lineTo(0.9, span);
    ctx.lineTo(0.5, 0.4);
    ctx.closePath();
  }
  function creaturePath(i, s) {
    const a = Math.atan2(vy[i], vx[i]);
    if (world === 'sea') fishPath(px[i], py[i], a, s, ph[i]);
    else if (world === 'night') batPath(px[i], py[i], a, s, ph[i]);
    else birdPath(px[i], py[i], a, s, ph[i], flap[i]);
  }

  function drawObstacle(b) {
    if (world === 'sea') return drawCoral(b);
    if (world === 'night') return drawLantern(b);
    drawBalloon(b);
  }
  function drawBalloon(b) {
    const x = b.x, y = b.y + b.bob, r = b.r;
    ctx.save();
    ctx.globalAlpha = T.balloonShade;
    ctx.strokeStyle = T.dark ? 'rgba(40,30,40,.8)' : 'rgba(80,60,40,.7)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(x - r * 0.45, y + r * 0.82); ctx.lineTo(x - r * 0.18, y + r * 1.35); ctx.moveTo(x + r * 0.45, y + r * 0.82); ctx.lineTo(x + r * 0.18, y + r * 1.35); ctx.stroke();
    ctx.fillStyle = T.dark ? '#5a3b26' : '#9a6a3d';
    ctx.fillRect(x - r * 0.2, y + r * 1.33, r * 0.4, r * 0.28);
    ctx.beginPath();
    ctx.moveTo(x, y + r * 0.95);
    ctx.bezierCurveTo(x - r * 0.4, y + r * 0.7, x - r * 1.05, y + r * 0.35, x - r, y - r * 0.1);
    ctx.arc(x, y - r * 0.1, r, Math.PI, 0);
    ctx.bezierCurveTo(x + r * 1.05, y + r * 0.35, x + r * 0.4, y + r * 0.7, x, y + r * 0.95);
    ctx.closePath();
    ctx.save(); ctx.clip();
    const n = 6;
    for (let k = 0; k < n; k++) {
      ctx.fillStyle = b.colors[k % 2];
      ctx.fillRect(x - r + (2 * r) * k / n, y - r * 1.2, 2 * r / n + 1, r * 2.3);
    }
    const sh = ctx.createRadialGradient(x - r * 0.4, y - r * 0.5, r * 0.1, x, y, r * 1.3);
    sh.addColorStop(0, 'rgba(255,255,255,.35)'); sh.addColorStop(0.6, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(0,0,0,.25)');
    ctx.fillStyle = sh; ctx.fillRect(x - r * 1.2, y - r * 1.2, r * 2.4, r * 2.4);
    ctx.restore();
    ctx.restore();
  }
  function drawCoral(b) {
    const x = b.x, y = b.y + b.bob * 0.2, r = b.r;
    ctx.save();
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.4, r * 0.1, x, y, r * 1.1);
    g.addColorStop(0, b.colors[1]); g.addColorStop(1, b.colors[0]);
    ctx.fillStyle = g;
    ctx.beginPath();
    for (let k = 0; k <= 12; k++) {
      const a = k / 12 * TAU, rr = r * (0.85 + 0.15 * Math.sin(k * 2.7 + b.t * 0.2));
      const qx = x + Math.cos(a) * rr, qy = y + Math.sin(a) * rr * 0.9;
      if (k) ctx.lineTo(qx, qy); else ctx.moveTo(qx, qy);
    }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.arc(x + Math.cos(k * 2.1) * r * 0.55, y + Math.sin(k * 1.7) * r * 0.5, r * 0.08, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = b.colors[1]; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let k = -1; k <= 1; k++) {
      ctx.beginPath(); ctx.moveTo(x + k * r * 0.4, y - r * 0.7);
      ctx.quadraticCurveTo(x + k * r * 0.6 + Math.sin(time + k) * 4, y - r * 1.1, x + k * r * 0.5 + Math.sin(time * 1.3 + k) * 6, y - r * 1.4);
      ctx.stroke();
    }
    ctx.restore();
  }
  function drawLantern(b) {
    const x = b.x, y = b.y + b.bob, r = b.r * 0.8;
    ctx.save();
    const glow = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 3);
    glow.addColorStop(0, 'rgba(255,190,90,.45)'); glow.addColorStop(1, 'rgba(255,150,60,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, r * 3, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(30,20,20,.8)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(x, y - r * 1.2); ctx.lineTo(x, y - r * 1.7); ctx.stroke();
    ctx.fillStyle = '#3a1d16'; ctx.fillRect(x - r * 0.45, y - r * 1.25, r * 0.9, r * 0.22); ctx.fillRect(x - r * 0.45, y + r * 1.03, r * 0.9, r * 0.22);
    const g = ctx.createRadialGradient(x - r * 0.2, y - r * 0.2, r * 0.1, x, y, r * 1.1);
    g.addColorStop(0, '#ffe7a1'); g.addColorStop(0.5, b.colors[0]); g.addColorStop(1, '#7d1a12');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(x, y, r * 0.95, r * 1.1, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(90,20,10,.5)'; ctx.lineWidth = 1;
    for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.ellipse(x, y, Math.abs(k) * r * 0.22 + 0.5, r * 1.1, 0, 0, TAU); ctx.stroke(); }
    ctx.restore();
  }

  function drawFood(f) {
    const amt = Math.max(0, f.amt);
    const n = Math.ceil(amt * 0.8);
    for (let k = 0; k < n; k++) {
      const a = k * 2.399, r = Math.sqrt(k) * 3.2;
      const x = f.x + Math.cos(a) * r + (world === 'sea' ? Math.sin(time * 2 + k) * 2 : 0);
      const y = f.y + Math.sin(a) * r + (world === 'night' ? Math.sin(time * 9 + k) * 2 : 0);
      if (world === 'night') { ctx.fillStyle = `rgba(255,240,170,${0.5 + 0.5 * Math.sin(time * 6 + k)})`; ctx.beginPath(); ctx.arc(x, y, 1.8, 0, TAU); ctx.fill(); }
      else if (world === 'sea') { ctx.fillStyle = '#ff9fae'; ctx.beginPath(); ctx.arc(x, y, 1.7, 0, TAU); ctx.fill(); }
      else { ctx.fillStyle = k % 3 ? '#d9a441' : '#a8742a'; ctx.beginPath(); ctx.ellipse(x, y, 2.2, 1.3, a, 0, TAU); ctx.fill(); }
    }
  }

  function drawPredator() {
    if (hawk.alpha < 0.02) return;
    ctx.globalAlpha = hawk.alpha;
    const s = birdSize * (world === 'sea' ? 4.6 : 3.2);
    ctx.beginPath();
    if (world === 'sea') fishPath(hawk.x, hawk.y, hawk.a, s, hawk.ph * 0.6);
    else birdPath(hawk.x, hawk.y, hawk.a, s, hawk.ph, 0.9);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = world === 'sea' ? (T.dark ? '#3e5566' : '#6f8796') : world === 'night' ? '#6b4a32' : T.dark ? '#120c0c' : '#3a2416';
    ctx.fill();
    setXf(hawk.x, hawk.y, hawk.a, s);
    if (world === 'sea') {
      ctx.fillStyle = T.dark ? '#2b3e4b' : '#56707f';
      ctx.beginPath(); ctx.moveTo(0.2, 0); ctx.lineTo(-0.5, 0); ctx.lineTo(-0.2, -0.05); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e8f0f4'; ctx.beginPath(); ctx.ellipse(0.6, 0.15, 0.9, 0.22, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(1.4, -0.2, 0.09, 0, TAU); ctx.fill();
    } else if (world === 'night') {
      ctx.fillStyle = '#ffd34d';
      ctx.beginPath(); ctx.arc(1.25, 0.18, 0.16, 0, TAU); ctx.arc(1.25, -0.18, 0.16, 0, TAU); ctx.fill();
    } else {
      ctx.fillStyle = '#f2c14e'; ctx.beginPath(); ctx.moveTo(1.8, 0.1); ctx.lineTo(2.15, 0); ctx.lineTo(1.8, -0.1); ctx.fill();
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1;
    if (hunt.on) {
      ctx.strokeStyle = 'rgba(255,90,54,.5)'; ctx.lineWidth = 2; ctx.setLineDash([3, 5]);
      ctx.beginPath(); ctx.arc(hawk.x, hawk.y, 15 * Math.max(1, birdSize / 3), 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    }
  }

  function drawInspect() {
    if (!inspect || !N) return;
    const i = 0, x = px[0], y = py[0], vis = S.vis, sepR = vis * 0.42;
    ctx.strokeStyle = 'rgba(255,90,54,.8)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.arc(x, y, vis, 0, TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,200,60,.8)';
    ctx.beginPath(); ctx.arc(x, y, sepR, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    ctx.lineWidth = 1;
    let n = 0;
    for (let j = 1; j < N && n < 28; j++) {
      const dx = px[j] - x, dy = py[j] - y, d2 = dx * dx + dy * dy;
      if (d2 > vis * vis) continue;
      n++;
      ctx.strokeStyle = d2 < sepR * sepR ? 'rgba(255,200,60,.9)' : 'rgba(255,90,54,.55)';
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(px[j], py[j]); ctx.stroke();
    }
    const sp = Math.hypot(vx[i], vy[i]) || 1;
    ctx.strokeStyle = '#ff5a36'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + vx[i] / sp * 30, y + vy[i] / sp * 30); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.font = '700 12px system-ui, sans-serif';
    const label = `sees ${n} neighbour${n === 1 ? '' : 's'}`;
    const tw = ctx.measureText(label).width;
    ctx.fillRect(x + 12, y - vis - 20, tw + 10, 18);
    ctx.fillStyle = '#fff'; ctx.fillText(label, x + 17, y - vis - 7);
  }

  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(sky, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (const c of clouds) drawCloud(c);
    drawWeeds();
    for (const b of obstacles) if (b.back) drawObstacle(b);
    for (const f of foods) drawFood(f);
    if (hueMode) {
      const B = 12;
      for (let bucket = 0; bucket < B; bucket++) {
        ctx.beginPath();
        for (let i = 0; i < N; i++) {
          const h = ((Math.atan2(vy[i], vx[i]) + Math.PI) / TAU * B) | 0;
          if ((h % B) !== bucket) continue;
          creaturePath(i, birdSize * depth[i]);
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = `hsl(${bucket / B * 360},80%,${T.light ? 62 : 45}%)`;
        ctx.fill();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    } else {
      const groups = [[0.62, 0.82], [0.82, 1.0], [1.0, 2]];
      groups.forEach(([lo, hi], gi) => {
        ctx.beginPath();
        for (let i = 0; i < N; i++) {
          const d = depth[i];
          if (d < lo || d >= hi) continue;
          creaturePath(i, birdSize * d);
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = T.birds[gi];
        ctx.fill();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      });
    }
    drawInspect();
    for (const b of obstacles) if (!b.back) drawObstacle(b);
    for (const p of parts) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r * 1.6, p.r * 0.8, p.rot, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
    drawPredator();
    if (mode !== 'hawk' && pointer.in) {
      ctx.strokeStyle = T.light ? 'rgba(255,255,255,.6)' : 'rgba(20,40,70,.45)'; ctx.setLineDash([4, 5]); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(pointer.x, pointer.y, mode === 'food' ? 16 : 38, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    }
  }

  const pointer = { x: 0, y: 0, in: false, down: false, type: 'mouse' };
  function pos(e) { const r = cv.getBoundingClientRect(); pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; pointer.type = e.pointerType; }
  cv.addEventListener('pointermove', (e) => { pos(e); pointer.in = true; if (mode === 'hawk' && (e.pointerType === 'mouse' || pointer.down)) { hawk.on = true; if (hawk.alpha < 0.05) { hawk.x = pointer.x; hawk.y = pointer.y; } } });
  cv.addEventListener('pointerleave', () => { pointer.in = false; if (pointer.type === 'mouse') hawk.on = false; });
  cv.addEventListener('pointerdown', (e) => {
    pos(e); pointer.in = true; pointer.down = true;
    cv.setPointerCapture?.(e.pointerId);
    intro.classList.add('is-faded');
    if (mode === 'hawk') { hawk.on = true; if (hawk.alpha < 0.05) { hawk.x = pointer.x; hawk.y = pointer.y; } screech(); }
    else if (mode === 'food') dropFood(pointer.x, pointer.y);
    else toggleObstacle(pointer.x, pointer.y);
  });
  const up = (e) => { pointer.down = false; if (e.pointerType !== 'mouse') { hawk.on = false; pointer.in = false; } };
  cv.addEventListener('pointerup', up);
  cv.addEventListener('pointercancel', up);

  function screech() {
    if (Curio.muted) return;
    const ac = Curio.audioContext(); if (!ac) return;
    const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    if (world === 'night') {
      o.type = 'sine'; o.frequency.setValueAtTime(420, t); o.frequency.linearRampToValueAtTime(380, t + 0.25);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.08, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t + 0.52);
      return;
    }
    o.type = world === 'sea' ? 'sine' : 'sawtooth';
    o.frequency.setValueAtTime(world === 'sea' ? 90 : 1500, t); o.frequency.exponentialRampToValueAtTime(world === 'sea' ? 50 : 900, t + 0.35);
    const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = world === 'sea' ? 120 : 1800; f.Q.value = 3;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(world === 'sea' ? 0.2 : 0.05, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    o.connect(f).connect(g).connect(ac.destination); o.start(t); o.stop(t + 0.42);
  }

  const PAIRS = { sky: [['#ff5a36', '#ffd23f'], ['#3a86ff', '#ffffff'], ['#8338ec', '#ff6fb5'], ['#2ec4b6', '#ffbf69'], ['#e63946', '#f1faee'], ['#06d6a0', '#118ab2']], sea: [['#c2414f', '#ff8c8c'], ['#7a3fa0', '#d39cf0'], ['#d9772b', '#ffc27a'], ['#2f7d6a', '#7fd8b5']], night: [['#e2482f'], ['#f28c28'], ['#d9363e'], ['#f5a524']] };
  function toggleObstacle(x, y) {
    const hit = obstacles.findIndex((b) => Math.hypot(x - b.x, y - (b.y + b.bob)) < b.r * 1.1);
    if (hit >= 0) {
      const b = obstacles.splice(hit, 1)[0];
      puff(b.x, b.y, 14, b.colors[0]);
      Curio.beep(180, 0.12, 'triangle', 0.1);
      return;
    }
    if (obstacles.length >= 14) { Curio.toast('That is plenty. Tap one to remove it.'); return; }
    const r = Curio.rand(26, 42) * Math.min(1, W / 700 + 0.4);
    obstacles.push({ x, y, r, colors: Curio.pick(PAIRS[world]), t: Math.random() * TAU, bob: 0, back: Math.random() < 0.3 });
    Curio.beep(520, 0.09, 'sine', 0.07); setTimeout(() => Curio.beep(780, 0.1, 'sine', 0.06), 70);
  }
  function dropFood(x, y) {
    if (foods.length >= 6) foods.shift();
    foods.push({ x, y, amt: 40, t: 0 });
    puff(x, y, 6, world === 'sea' ? '#ff9fae' : '#e2b25a');
    Curio.beep(1200, 0.04, 'triangle', 0.05); setTimeout(() => Curio.beep(1500, 0.04, 'triangle', 0.05), 50);
  }

  function setMode(m) {
    mode = m;
    $('mHawk').setAttribute('aria-pressed', String(m === 'hawk'));
    $('mFood').setAttribute('aria-pressed', String(m === 'food'));
    $('mBalloon').setAttribute('aria-pressed', String(m === 'obst'));
    cv.classList.toggle('is-place', m !== 'hawk');
    if (m !== 'hawk') hawk.on = false;
    if (m === 'obst') Curio.toast(`Tap to place ${WORLDS[world].obst.slice(3).toLowerCase()}. Tap one to remove it.`);
    if (m === 'food') Curio.toast(`Tap to scatter ${WORLDS[world].food.slice(3).toLowerCase()}. Watch them swarm it.`);
  }

  function setWorld(w, quiet) {
    world = w; Curio.store.set('flock:world', w);
    visited.add(w); Curio.store.set('flock:visited', [...visited]);
    if (visited.size >= 3) award('worlds');
    const D = WORLDS[w];
    $('mHawk').textContent = D.pred; $('mFood').textContent = D.food; $('mBalloon').textContent = D.obst;
    intro.querySelector('p').textContent = D.intro;
    intro.querySelector('h1').textContent = w === 'sea' ? 'School' : w === 'night' ? 'Colony' : 'Flock';
    document.querySelectorAll('#worlds button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.w === w)));
    obstacles = []; foods = [];
    birdSize = (W < 560 ? 2.8 : 3.3) * (w === 'sea' ? 1.15 : w === 'night' ? 1.05 : 1);
    retheme();
    if (!quiet) { Curio.toast(`${D.pred.slice(0, 2)} Welcome to the ${w}.`); [440, 554, 659].forEach((f, k) => setTimeout(() => Curio.beep(f, 0.08, 'sine', 0.06), k * 80)); }
  }

  function startHunt() {
    if (hunt.on) { endHunt(true); return; }
    hunt.on = true; hunt.t = HUNT_T; hunt.score = 0; hunt.combo = 0; hunt.bestCombo = 0;
    setMode('hawk');
    $('hud').classList.remove('hidden');
    $('hScore').textContent = '0'; $('hCombo').textContent = '';
    $('bHunt').setAttribute('aria-pressed', 'true');
    intro.classList.add('is-faded');
    Curio.toast(`${HUNT_T} seconds. Catch as many ${WORLDS[world].many} as you can!`, 2400);
    [392, 523, 659, 784].forEach((f, k) => setTimeout(() => Curio.beep(f, 0.09, 'square', 0.05), k * 110));
  }
  async function endHunt(cancel) {
    hunt.on = false;
    $('bHunt').setAttribute('aria-pressed', 'false');
    $('hud').classList.add('hidden');
    if (cancel) return;
    const best = Curio.best(`hunt-${world}`, hunt.score);
    if (hunt.score >= 10) award('hunt10');
    if (hunt.score >= 25) award('hunt25');
    if (hunt.score >= 50) award('hunt50');
    if (best.isNew && hunt.score > 0) { Curio.confetti(); [523, 659, 784, 1046].forEach((f, k) => setTimeout(() => Curio.beep(f, 0.1, 'triangle', 0.1), k * 90)); }
    const D = WORLDS[world];
    const v = await Curio.modal({ emoji: D.pred.slice(0, 2), title: `${hunt.score} ${D.many} caught`, body: `${best.isNew && hunt.score > 0 ? 'New personal best!' : `Best in the ${world}: ${best.best}.`} Longest combo: x${hunt.bestCombo}. Tip: flocks split around the predator, so cut into the edges of the group.`, buttons: [{ label: 'Hunt again', value: 'again' }, { label: 'Copy result', value: 'share' }, { label: 'Just watch', value: 'done' }] });
    if (v === 'again') startHunt();
    if (v === 'share') {
      const txt = `${D.pred.slice(0, 2)} Curio Flock hunt (${world}): ${hunt.score} ${D.many} in ${HUNT_T} s, combo x${hunt.bestCombo}. Best ${best.best}.`;
      try { await navigator.clipboard.writeText(txt); Curio.toast('Copied!'); } catch (e) { Curio.toast(txt, 4000); }
    }
  }

  $('mHawk').addEventListener('click', () => setMode('hawk'));
  $('mFood').addEventListener('click', () => setMode('food'));
  $('mBalloon').addEventListener('click', () => setMode('obst'));
  $('bHunt').addEventListener('click', startHunt);
  $('bScatter').addEventListener('click', () => {
    const cx = W / 2, cy = H * 0.45;
    for (let i = 0; i < N; i++) { const dx = px[i] - cx, dy = py[i] - cy, d = Math.hypot(dx, dy) || 1; vx[i] = dx / d * 320; vy[i] = dy / d * 320; fear[i] = 1; }
    chirp(); intro.classList.add('is-faded');
  });
  $('bClear').addEventListener('click', () => { if (!obstacles.length && !foods.length) { Curio.toast('Nothing to clear yet.'); return; } obstacles.forEach((b) => puff(b.x, b.y, 8, b.colors[0])); obstacles = []; foods = []; Curio.beep(240, 0.1, 'triangle', 0.08); });
  $('bPanel').addEventListener('click', () => { const p = $('panel'); p.hidden = !p.hidden; $('bPanel').setAttribute('aria-pressed', String(!p.hidden)); });
  $('worlds').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setWorld(b.dataset.w); });
  $('swHue').addEventListener('click', () => { hueMode = !hueMode; $('swHue').setAttribute('aria-pressed', String(hueMode)); if (hueMode) Curio.toast('Same colour means same heading. Watch the waves of agreement.'); });
  $('swInspect').addEventListener('click', () => { inspect = !inspect; $('swInspect').setAttribute('aria-pressed', String(inspect)); if (inspect) { award('inspect'); Curio.toast('Red ring: vision. Yellow ring: personal space.', 2600); } });

  const sliders = {};
  const fmt2 = (v) => v.toFixed(2);
  [['sep', 'oSep', fmt2], ['ali', 'oAli', fmt2], ['coh', 'oCoh', fmt2], ['num', 'oNum', (v) => String(v)], ['spd', 'oSpd', (v) => v.toFixed(2) + '×'], ['vis', 'oVis', (v) => v + ' px'], ['wind', 'oWind', (v) => (v === 0 ? 'calm' : `${v > 0 ? '→' : '←'} ${Math.abs(v)}`)]].forEach(([id, out, f]) => {
    const el = $(id);
    const saved = Curio.store.get('flock:' + id, null);
    if (typeof saved === 'number' && isFinite(saved)) el.value = saved;
    else if (id === 'num' && innerWidth < 560) el.value = 220;
    const apply = () => { const v = parseFloat(el.value); S[id] = v; $(out).textContent = f(v); if (id === 'num') setCount(v); };
    el.addEventListener('input', apply);
    el.addEventListener('change', () => Curio.store.set('flock:' + id, parseFloat(el.value)));
    sliders[id] = { el, apply };
  });
  $('presets').innerHTML = PRESETS.map((p) => `<button type="button" class="preset" data-id="${p.id}"><b>${p.name}</b>${p.d}</button>`).join('');
  $('presets').addEventListener('click', (e) => {
    const b = e.target.closest('.preset'); if (!b) return;
    const pr = PRESETS.find((p) => p.id === b.dataset.id);
    for (const [k, v] of Object.entries(pr.v)) {
      const val = k === 'num' && innerWidth < 560 ? Math.min(v, 550) : v;
      sliders[k].el.value = val; sliders[k].apply(); Curio.store.set('flock:' + k, val);
    }
    Curio.toast(`${pr.name}: ${pr.d.toLowerCase()}.`);
    Curio.beep(660, 0.06, 'triangle', 0.06);
  });

  function resize() {
    const r = cv.getBoundingClientRect();
    const oldW = W, oldH = H;
    dpr = Math.min(2, devicePixelRatio || 1);
    W = r.width; H = r.height;
    birdSize = (W < 560 ? 2.8 : 3.3) * (world === 'sea' ? 1.15 : world === 'night' ? 1.05 : 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    if (oldW) for (let i = 0; i < N; i++) { px[i] *= W / oldW; py[i] *= H / oldH; }
    paintSky();
  }
  function retheme() { T = themeColors(); main.classList.toggle('light-text', T.light); main.style.background = T.sky[1]; paintSky(); }
  addEventListener('curio:theme', retheme);
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', retheme);

  addEventListener('keydown', (e) => {
    if (e.target.closest?.('input, button') || e.ctrlKey || e.metaKey || document.querySelector('.curio-modal')) return;
    const k = e.key.toLowerCase();
    if (k === 'h') setMode('hawk');
    else if (k === 'f') setMode('food');
    else if (k === 'b') setMode('obst');
    else if (k === 's') $('bScatter').click();
    else if (k === 'g') startHunt();
    else if (k === '1') setWorld('sky');
    else if (k === '2') setWorld('sea');
    else if (k === '3') setWorld('night');
  });

  const arrows = new Set();
  addEventListener('keydown', (e) => { if (!e.key.startsWith('Arrow') || e.target.closest?.('input')) return; e.preventDefault(); if (!arrows.size) { if (pointer.type !== 'key' && !pointer.in) { pointer.x = W / 2; pointer.y = H / 2; } if (mode === 'hawk' && hawk.alpha < 0.05) { pointer.x = W / 2; pointer.y = H / 2; hawk.x = W / 2; hawk.y = H / 2; } intro.classList.add('is-faded'); } arrows.add(e.key); });
  addEventListener('keyup', (e) => { arrows.delete(e.key); if (!arrows.size && pointer.type === 'key') hawk.on = false; });
  addEventListener('keydown', (e) => {
    if (e.key !== ' ' || e.target.closest?.('input, button') || document.querySelector('.curio-modal')) return;
    e.preventDefault();
    const x = pointer.in || pointer.type === 'key' ? pointer.x : W / 2, y = pointer.in || pointer.type === 'key' ? pointer.y : H / 2;
    if (mode === 'food') dropFood(x, y); else if (mode === 'obst') toggleObstacle(x, y); else $('bScatter').click();
  });
  function keyHawk(dt) {
    if (!arrows.size) return;
    const sp = 420 * dt;
    pointer.type = 'key';
    if (arrows.has('ArrowLeft')) pointer.x -= sp;
    if (arrows.has('ArrowRight')) pointer.x += sp;
    if (arrows.has('ArrowUp')) pointer.y -= sp;
    if (arrows.has('ArrowDown')) pointer.y += sp;
    pointer.x = Math.max(10, Math.min(W - 10, pointer.x)); pointer.y = Math.max(10, Math.min(H - 10, pointer.y));
    pointer.in = true;
    hawk.on = mode === 'hawk';
  }
  let raf = 0, last = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(1 / 30, (now - last) / 1000 || 0);
    last = now; time += dt;
    for (const c of clouds) {
      if (world === 'sea') { c.y -= c.v * dt; c.x += Math.sin(time + c.s) * 0.3; if (c.y < -10) { c.y = H + 10; c.x = Math.random() * W; } }
      else { c.x += (c.v + S.wind * 0.3) * dt; if (c.x - 120 > W) c.x = -120; if (c.x < -140) c.x = W + 110; }
    }
    for (const b of obstacles) { b.t += dt; b.bob = Math.sin(b.t * 0.9) * 4; }
    for (let k = parts.length - 1; k >= 0; k--) { const p = parts[k]; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (world === 'sea' ? -40 : 60) * dt; p.vx *= 0.97; p.rot += dt * 3; p.life -= dt * 1.2; if (p.life <= 0) parts.splice(k, 1); }
    keyHawk(dt);
    const tx = hawk.on ? pointer.x : hawk.x + Math.cos(hawk.a) * 300, ty = hawk.on ? pointer.y : hawk.y - 200;
    const hx = hawk.x, hy = hawk.y;
    let mx = (tx - hawk.x) * Math.min(1, dt * 7), my = (ty - hawk.y) * Math.min(1, dt * 7);
    if (hunt.on) { const m = Math.hypot(mx, my), cap = 560 * dt; if (m > cap) { mx *= cap / m; my *= cap / m; } }
    hawk.x += mx; hawk.y += my;
    const mvx = hawk.x - hx, mvy = hawk.y - hy;
    if (Math.hypot(mvx, mvy) > 0.4) { const want = Math.atan2(mvy, mvx); let d = want - hawk.a; d = Math.atan2(Math.sin(d), Math.cos(d)); hawk.a += d * Math.min(1, dt * 8); }
    hawk.ph += dt * 9;
    hawk.alpha += ((hawk.on ? 1 : 0) - hawk.alpha) * Math.min(1, dt * 5);
    if (hunt.on) {
      hunt.t -= dt;
      $('hTime').textContent = Math.max(0, Math.ceil(hunt.t));
      if (hunt.t <= 0) endHunt(false);
    }
    if (dt > 0) update(dt);
    render();
  }
  const start = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  addEventListener('resize', resize);
  resize();
  Object.values(sliders).forEach((s) => s.apply());
  setWorld(world, true);
  renderBadges();
  if (!Curio.store.get('flock:padtip', false)) { Curio.store.set('flock:padtip', true); setTimeout(() => Curio.toast('Tip: just glide on your touchpad to steer the predator, or use the arrow keys', 4000), 2500); }
  if (innerWidth >= 900) { $('panel').hidden = false; $('bPanel').setAttribute('aria-pressed', 'true'); }
  start();
  window.__fl = { setWorld, startHunt, get hunt() { return hunt; }, hawkAt(x, y) { hawk.on = true; pointer.x = x; pointer.y = y; hawk.x = x; hawk.y = y; }, setMode, dropFood, toggleObstacle, get N() { return N; } };
})();
