(() => {
  const P = window.Phys;
  const W = 1400, H = 700, FLOOR = 650, STEP = 1 / 60;
  const KEY = 'domino-run:build';
  const SIZES = [{ w: 8, h: 30, n: 'S' }, { w: 11, h: 46, n: 'M' }, { w: 16, h: 70, n: 'L' }, { w: 24, h: 106, n: 'XL' }];
  const PATTERNS = {
    rainbow: { label: 'Rainbow', fn: (i) => `hsl(${(i * 13) % 360} 78% 58%)` },
    sunset: { label: 'Sunset', fn: (i) => ['#ff5e62', '#ff7e5f', '#ff9966', '#ffb35c', '#ffc371', '#f9d976'][Math.abs(((i % 10) + 10) % 10 - 5) % 6] },
    ocean: { label: 'Ocean', fn: (i) => ['#0b7a75', '#138d90', '#19a7ce', '#3fb8e6', '#62cdff', '#8fdcff'][Math.abs(((i % 10) + 10) % 10 - 5) % 6] },
    candy: { label: 'Candy', fn: (i) => ['#ff6fb5', '#ffd23f', '#5ad66f', '#4f8cff', '#9b6bff'][i % 5] },
    stripes: { label: 'Stripes', fn: (i) => (i % 2 ? '#fdf6e3' : '#ff5a36') },
    classic: { label: 'Classic', fn: () => '#24211e' }
  };

  const canvas = document.getElementById('board');
  const g = canvas.getContext('2d');
  const stage = document.getElementById('stage');
  const intro = document.getElementById('intro');
  const tag = document.getElementById('tag');

  let world, items = [], history = [], tool = 'line', size = 1, pattern = 'rainbow', paused = false, slow = false;
  let scale = 1, ox = 0, oy = 0, dpr = 1, cw = 0, ch = 0, panRange = 0, panX = null;
  let run = null, simTime = 0, touched = false, audioOk = false, sel = null;
  let hover = null;

  function newWorld() {
    world = new P.World({ gy: 1500, substeps: 6, sleepTime: 0.5, sleepLin: 5 });
    world.add({ type: P.STATIC, shapes: [P.makeBox(W + 400, 200, W / 2, FLOOR + 100), P.makeBox(60, 2000, -30, 0), P.makeBox(60, 2000, W + 30, 0)], friction: 0.7, restitution: 0, user: { floor: true } });
  }

  const BUILD = {
    d: (it) => {
      const S = SIZES[it.s ?? 1];
      return [world.add({ x: it.x, y: it.y, a: it.a || 0, shapes: [P.makeBox(S.w, S.h)], density: 1, friction: 0.3, restitution: 0, angDamp: 0.02, user: { item: it, domino: true } })];
    },
    ball: (it) => [world.add({ x: it.x, y: it.y, shapes: [P.makeCircle(16)], density: 1, friction: 0.5, restitution: 0.25, angDamp: 0.3, user: { item: it, ball: true } })],
    crate: (it) => [world.add({ x: it.x, y: it.y, a: it.a || 0, shapes: [P.makeBox(44, 44)], density: 0.5, friction: 0.6, restitution: 0.05, user: { item: it, crate: true } })],
    stairs: (it) => {
      const f = it.f ? -1 : 1, sh = [];
      for (let i = 0; i < 5; i++) { const hh = 13 * (i + 1); sh.push(P.makeBox(52, hh, f * (i * 52 + 26), -hh / 2)); }
      return [world.add({ type: P.STATIC, x: it.x, y: it.y, shapes: sh, friction: 0.7, user: { item: it, wood: true } })];
    },
    ramp: (it) => {
      const f = it.f ? -1 : 1;
      return [world.add({ type: P.STATIC, x: it.x, y: it.y, shapes: [P.makePoly([0, 0, f * 200, 0, f * 200, -64])], friction: 0.6, user: { item: it, wood: true } })];
    },
    plank: (it) => [world.add({ type: P.STATIC, x: it.x, y: it.y, a: it.a || 0, shapes: [P.makeBox(it.len || 200, 14)], friction: 0.7, user: { item: it, wood: true } })],
    bell: (it) => {
      const f = it.f ? -1 : 1;
      const post = world.add({ type: P.STATIC, x: it.x, y: it.y, shapes: [P.makeCapsule(0, -4, 0, -62, 5), P.makeCapsule(0, -62, -f * 46, -62, 4), P.makeBox(44, 8, 0, -4)], friction: 0.5, user: { item: it, post: true } });
      const px = it.x - f * 46, py = it.y - 62;
      const bell = world.add({ x: px, y: py, shapes: [P.makePoly([-7, 4, 7, 4, 19, 44, -19, 44])], density: 1.2, friction: 0.4, restitution: 0.3, angDamp: 0.15, user: { item: it, bell: true } });
      world.pinWorld(bell, px, py);
      world.noCollide.add(world.pairKey(post, bell));
      return [post, bell];
    }
  };

  function buildItem(it) { it.bodies = BUILD[it.t](it); }
  function unbuild(it) { for (const b of it.bodies || []) world.remove(b); it.bodies = []; }
  const clean = (it) => { const o = { t: it.t, x: Math.round(it.x * 10) / 10, y: Math.round(it.y * 10) / 10 }; for (const k of ['a', 's', 'c', 'f', 'len']) if (it[k] != null && it[k] !== 0) o[k] = it[k]; return o; };
  const snapshot = () => JSON.stringify(items.map(clean));
  function save() { Curio.store.set(KEY, items.map(clean)); }
  function pushHistory() { history.push(snapshot()); if (history.length > 60) history.shift(); }
  function loadItems(list) {
    newWorld();
    items = list.filter((r) => BUILD[r.t]).map((r) => ({ ...r }));
    for (const it of items) buildItem(it);
    sel = null; run = null;
    counts();
  }
  function standUp() { loadItems(items.map(clean)); }

  let ac = null, master = null, budget = 0;
  function audio() {
    if (Curio.muted || !audioOk) return null;
    ac = Curio.audioContext();
    if (!ac) return null;
    if (!master) { master = ac.createDynamicsCompressor(); master.threshold.value = -16; master.ratio.value = 8; master.connect(ac.destination); }
    return ac;
  }
  function tone(freq, dur, type, vol, glide) {
    const a = audio(); if (!a || budget <= 0) return;
    budget--;
    const t = a.currentTime;
    const o = a.createOscillator(), gn = a.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + dur);
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.linearRampToValueAtTime(vol, t + 0.003);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(gn).connect(master);
    o.start(t); o.stop(t + dur + 0.03);
  }
  const pf = () => (slow ? 0.62 : 1);
  const SND = {
    clack: (v, s) => { const f = [2600, 2000, 1500, 1100][s] * pf() * Curio.rand(0.9, 1.1); tone(f, 0.035, 'triangle', Math.min(0.16, 0.02 + v / 3000)); tone(f * 0.5, 0.05, 'sine', Math.min(0.08, v / 6000)); },
    thud: (v) => tone(Curio.rand(160, 220) * pf(), 0.08, 'sine', Math.min(0.2, v / 2500)),
    ball: (v) => tone(Curio.rand(300, 360) * pf(), 0.09, 'sine', Math.min(0.2, v / 2000)),
    place: (i) => tone((700 + (i % 8) * 60), 0.03, 'triangle', 0.05),
    bell: (v) => { const vol = Math.min(0.28, 0.08 + v / 2500); [[1, 2.2, 1], [2.0, 1.4, 0.5], [2.76, 0.9, 0.35], [5.4, 0.4, 0.2]].forEach(([m, d, k]) => tone(880 * m * pf(), d, 'sine', vol * k)); },
    pop: () => tone(420, 0.08, 'sine', 0.08, 180)
  };

  function handleEvents() {
    for (const e of world.events) {
      const ua = e.a.user, ub = e.b.user, v = e.speed;
      if (ua.bell || ub.bell) { if (v > 25) { SND.bell(v); const bi = (ua.bell ? ua : ub).item; bi.flash = 1; if (run && !run.rang) { run.rang = true; } } continue; }
      if (ua.domino && ub.domino) { if (v > 20) SND.clack(v, Math.min(ua.item.s ?? 1, ub.item.s ?? 1)); continue; }
      if (ua.ball || ub.ball) { if (v > 40) SND.ball(v); continue; }
      if (v > 50) SND.thud(v);
    }
  }

  function counts() {
    let total = 0, fallen = 0;
    for (const it of items) if (it.t === 'd') { total++; const b = it.bodies[0]; if (Math.abs(Math.sin(b.a - (it.a || 0))) > 0.5 || Math.abs(b.y - it.y) > 30) fallen++; }
    document.getElementById('nFallen').textContent = fallen;
    document.getElementById('nTotal').textContent = total;
    return { total, fallen };
  }

  function topple() {
    unlock(); fadeIntro();
    const ds = items.filter((it) => it.t === 'd');
    if (!ds.length) { Curio.toast('Place some dominoes first: drag a line on the table'); return; }
    const first = ds.find((it) => { const b = it.bodies[0]; return Math.abs(b.a - (it.a || 0)) < 0.15; });
    if (!first) { Curio.toast('Everything is already down. Press Stand up!'); return; }
    let best = null, bd = Infinity;
    for (const o of ds) { if (o === first) continue; const d = Math.hypot(o.x - first.x, o.y - first.y); if (d < bd) { bd = d; best = o; } }
    const dir = best ? Math.sign(best.x - first.x) || 1 : 1;
    push(first.bodies[0], dir);
    if (!run) run = { t0: simTime, quiet: 0, done: false, total: ds.length };
    if (paused) togglePause();
  }
  function push(b, dir) {
    const it = b.user.item;
    if (b.user.domino) { const S = SIZES[it.s ?? 1]; b.applyImpulse(dir * b.m * 70, 0, b.x - Math.sin(b.a) * S.h * 0.45, b.y - Math.cos(b.a) * S.h * 0.45); }
    else b.applyImpulse(dir * b.m * 260, -b.m * 40);
    SND.pop();
  }

  function checkRun(dt) {
    if (!run || run.done) return;
    let moving = false;
    for (const b of world.bodies) if (b.type === P.DYNAMIC && b.awake && !b.user.bell && (Math.abs(b.vx) + Math.abs(b.vy) > 8 || Math.abs(b.w) > 0.3)) { moving = true; break; }
    run.quiet = moving ? 0 : run.quiet + dt;
    if (run.quiet > 1.2) {
      run.done = true;
      const { total, fallen } = counts();
      const secs = Math.max(0, simTime - run.t0 - 1.2);
      if (total >= 10 && fallen === total) {
        const r = Curio.best('perfect', total);
        Curio.confetti();
        Curio.toast(`Perfect run! All ${total} down in ${secs.toFixed(1)}s${r.isNew ? ' · new record chain' : ''}`, 3200);
      } else Curio.toast(`${fallen} of ${total} dominoes toppled in ${secs.toFixed(1)}s`, 2600);
    }
  }

  function surfaceY(x0, x1, yStart) {
    const xs = [x0 + 1, (x0 + x1) / 2, x1 - 1];
    for (let y = Math.max(0, yStart); y < FLOOR; y += 2) {
      for (const x of xs) {
        const b = world.queryPoint(x, y, (q) => q.type === P.STATIC);
        if (b) return y;
      }
    }
    return FLOOR;
  }
  function overlapsDomino(x, y, w, h) {
    for (const it of items) {
      if (it.t !== 'd' && it.t !== 'ball' && it.t !== 'crate') continue;
      const b = it.bodies[0];
      if (b.maxX > x - w / 2 && b.minX < x + w / 2 && b.maxY > y - h / 2 && b.minY < y + h / 2) return true;
    }
    return false;
  }
  let placed = 0;
  function placeDomino(x, yHint) {
    const S = SIZES[size];
    if (x < S.w || x > W - S.w) return false;
    const top = surfaceY(x - S.w / 2, x + S.w / 2, yHint - S.h * 0.6);
    const y = top - S.h / 2 - 0.2;
    if (y - S.h / 2 < 0) return false;
    if (overlapsDomino(x, y, S.w + 2, S.h - 2)) return false;
    const idx = items.filter((i) => i.t === 'd').length;
    const it = { t: 'd', x, y, s: size, c: PATTERNS[pattern].fn(idx) };
    items.push(it); buildItem(it);
    SND.place(placed++);
    counts();
    return true;
  }
  function placeThing(t, x, y) {
    let it;
    if (t === 'stairs') { const bx = x - 130; it = { t, x: bx, y: surfaceY(bx, bx + 260, y - 20), f: 0 }; }
    else if (t === 'ramp') { const bx = x - 100; it = { t, x: bx, y: surfaceY(bx, bx + 200, y - 20), f: 0 }; }
    else if (t === 'bell') it = { t, x, y: surfaceY(x - 22, x + 22, y - 20), f: 0 };
    else if (t === 'plank') it = { t, x, y, a: 0 };
    else if (t === 'ball') it = { t, x, y: Math.min(y, surfaceY(x - 16, x + 16, y - 20) - 17) };
    else if (t === 'crate') it = { t, x, y: Math.min(y, surfaceY(x - 22, x + 22, y - 20) - 23) };
    if (!it) return null;
    pushHistory();
    items.push(it); buildItem(it);
    world.wakeArea(it.bodies[0].minX - 30, it.bodies[0].minY - 60, it.bodies[0].maxX + 30, it.bodies[0].maxY + 10);
    save(); SND.place(3);
    return it;
  }
  function itemAt(x, y) {
    const b = world.queryPoint(x, y, (q) => q.user.item) || world.queryPoint(x - 5, y, (q) => q.user.item) || world.queryPoint(x + 5, y, (q) => q.user.item);
    return b ? b.user.item : null;
  }
  function removeItem(it) { unbuild(it); items.splice(items.indexOf(it), 1); if (sel === it) sel = null; counts(); }

  function fit() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = stage.getBoundingClientRect();
    cw = r.width; ch = r.height;
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    const pad = cw < 560 ? 4 : 14, top = cw < 560 ? 70 : 52;
    const fitS = Math.min((cw - pad * 2) / W, (ch - top - pad) / H);
    const tallS = Math.min(1.1, (ch - top - pad) / H);
    scale = cw < 900 && tallS > fitS * 1.2 ? Math.min(tallS, fitS * 2.2) : fitS;
    oy = top + (ch - top - pad - H * scale) / 2;
    panRange = Math.max(0, W * scale + pad * 2 - cw);
    setPan(panRange ? (panX ?? pad) : (cw - W * scale) / 2);
  }
  function setPan(x) { const pad = cw < 560 ? 4 : 14; if (panRange) { x = Math.max(cw - W * scale - pad, Math.min(pad, x)); panX = x; } ox = x; }
  const toWorld = (cx, cy) => [(cx - ox) / scale, (cy - oy) / scale];

  function colors() {
    const dark = Curio.isDark();
    return dark
      ? { bg: '#161412', wall0: '#1f2a3a', wall1: '#262230', table: '#6b4a2f', tableTop: '#8a6240', tableEdge: '#4a321f', wood: '#a77a4f', woodEdge: '#5e4128', ink: '#f3eee7', grid: 'rgba(255,255,255,.04)' }
      : { bg: '#fbf7f0', wall0: '#e9f3ff', wall1: '#fff3e6', table: '#c98f5a', tableTop: '#e0aa72', tableEdge: '#9a663a', wood: '#e8b77f', woodEdge: '#a8743f', ink: '#1d1b19', grid: 'rgba(60,40,20,.05)' };
  }

  function shadeHsl(c, k) { return `color-mix(in srgb, ${c} ${Math.round((1 - k) * 100)}%, #000)`; }
  const darkCache = new Map();
  function edgeOf(c) { if (!darkCache.has(c)) darkCache.set(c, shadeHsl(c, 0.38)); return darkCache.get(c); }

  function polyPath(sh) { g.beginPath(); g.moveTo(sh.wv[0], sh.wv[1]); for (let i = 1; i < sh.n; i++) g.lineTo(sh.wv[2 * i], sh.wv[2 * i + 1]); g.closePath(); }

  function drawDomino(b, alpha = 1) {
    const it = b.user.item, S = SIZES[it.s ?? 1];
    g.save(); g.globalAlpha = alpha;
    g.translate(b.x, b.y); g.rotate(b.a);
    const r = Math.min(3, S.w * 0.3);
    g.fillStyle = it.c || '#24211e';
    g.beginPath(); g.roundRect(-S.w / 2, -S.h / 2, S.w, S.h, r); g.fill();
    g.lineWidth = 1.4; g.strokeStyle = edgeOf(it.c || '#24211e'); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(-S.w / 2 + 1.5, -S.h / 2 + 2, Math.max(1.2, S.w * 0.18), S.h - 4);
    if (S.w >= 11) {
      const light = it.c === '#fdf6e3';
      g.fillStyle = light ? 'rgba(0,0,0,.55)' : 'rgba(255,255,255,.85)';
      g.fillRect(-S.w / 2 + 2, -0.6, S.w - 4, 1.2);
      const pr = S.w * 0.11;
      const pips = (S.w * 7 + (it.x | 0)) % 6 + 1;
      const dots = [[0, -S.h / 4]];
      if (pips > 1) dots.push([0, S.h / 4]);
      if (pips > 2) dots.push([-S.w * 0.22, -S.h * 0.38], [S.w * 0.22, S.h * 0.38]);
      for (const [dx, dy] of dots) { g.beginPath(); g.arc(dx, dy, pr, 0, 7); g.fill(); }
    }
    g.restore();
  }

  function drawWood(b, C) {
    for (const sh of b.shapes) {
      polyPath(sh);
      g.fillStyle = C.wood; g.fill();
      g.lineWidth = 2; g.strokeStyle = C.woodEdge; g.stroke();
    }
    g.save(); g.globalAlpha = 0.18; g.strokeStyle = C.woodEdge; g.lineWidth = 1;
    for (const sh of b.shapes) {
      if (sh.n !== 4) continue;
      const x0 = Math.min(sh.wv[0], sh.wv[4]), x1 = Math.max(sh.wv[0], sh.wv[4]);
      const y0 = Math.min(sh.wv[1], sh.wv[5]), y1 = Math.max(sh.wv[1], sh.wv[5]);
      if (Math.abs(b.a) > 0.01) continue;
      for (let y = y0 + 6; y < y1 - 2; y += 7) { g.beginPath(); g.moveTo(x0 + 3, y); g.lineTo(x1 - 3, y + 0.5); g.stroke(); }
    }
    g.restore();
  }

  function drawBell(it, C) {
    const [post, bell] = it.bodies;
    g.lineCap = 'round';
    for (const sh of post.shapes) {
      if (sh.n === 2) { g.strokeStyle = '#5d6d7e'; g.lineWidth = sh.r * 2; g.beginPath(); g.moveTo(sh.wv[0], sh.wv[1]); g.lineTo(sh.wv[2], sh.wv[3]); g.stroke(); }
      else { polyPath(sh); g.fillStyle = '#5d6d7e'; g.fill(); }
    }
    g.save(); g.translate(bell.x, bell.y); g.rotate(bell.a);
    const top = bell.shapes[0];
    const lv = top.lv;
    const fl = it.flash || 0;
    const grd = g.createLinearGradient(lv[6], 0, lv[4], 0);
    grd.addColorStop(0, '#c99a2e'); grd.addColorStop(0.45, fl > 0.1 ? '#fff6c8' : '#ffe082'); grd.addColorStop(1, '#b8861b');
    g.fillStyle = grd; g.strokeStyle = '#7a5a20'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(lv[0], lv[1]); g.quadraticCurveTo(lv[0] - 6, lv[1] + 18, lv[6], lv[7]); g.lineTo(lv[4], lv[5]); g.quadraticCurveTo(lv[2] + 6, lv[3] + 18, lv[2], lv[3]); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#7a5a20'; g.beginPath(); g.arc((lv[4] + lv[6]) / 2, lv[5] + 4, 4.5, 0, 7); g.fill();
    g.restore();
    if (fl > 0.05) {
      g.save(); g.globalAlpha = fl; g.strokeStyle = '#ffd23f'; g.lineWidth = 3; g.lineCap = 'round';
      for (let i = 0; i < 3; i++) { const a = -0.6 + i * 0.6 - Math.PI / 2, r0 = 52, r1 = 52 + 14 * fl; g.beginPath(); g.moveTo(bell.x + Math.cos(a) * r0 * 0.6, bell.y + 24 + Math.sin(a) * r0 * 0.6); g.lineTo(bell.x + Math.cos(a) * r1 * 0.6, bell.y + 24 + Math.sin(a) * r1 * 0.6); g.stroke(); }
      g.restore();
    }
  }

  function drawBall(b) {
    const r = 16;
    const grd = g.createRadialGradient(b.x - 5, b.y - 6, 2, b.x, b.y, r);
    grd.addColorStop(0, '#ffffff'); grd.addColorStop(0.3, '#4f8cff'); grd.addColorStop(1, '#1d3f8f');
    g.fillStyle = grd; g.beginPath(); g.arc(b.x, b.y, r, 0, 7); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2.5;
    g.beginPath(); g.arc(b.x, b.y, r * 0.62, b.a, b.a + 1.6); g.stroke();
  }
  function drawCrate(b) {
    g.save(); g.translate(b.x, b.y); g.rotate(b.a);
    g.fillStyle = '#d9a35b'; g.fillRect(-22, -22, 44, 44);
    g.strokeStyle = '#8a5a26'; g.lineWidth = 3; g.strokeRect(-20.5, -20.5, 41, 41);
    g.beginPath(); g.moveTo(-19, -19); g.lineTo(19, 19); g.moveTo(19, -19); g.lineTo(-19, 19); g.stroke();
    g.restore();
  }

  function draw() {
    const C = colors();
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = C.bg; g.fillRect(0, 0, cw, ch);
    g.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * ox, dpr * oy);
    const sky = g.createLinearGradient(0, 0, 0, FLOOR);
    sky.addColorStop(0, C.wall0); sky.addColorStop(1, C.wall1);
    g.fillStyle = sky; g.beginPath(); g.roundRect(0, 0, W, FLOOR + 10, [20, 20, 0, 0]); g.fill();
    g.strokeStyle = C.grid; g.lineWidth = 1;
    for (let x = 50; x < W; x += 50) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, FLOOR); g.stroke(); }
    g.fillStyle = C.tableTop; g.fillRect(0, FLOOR, W, 12);
    g.fillStyle = C.table; g.beginPath(); g.roundRect(0, FLOOR + 12, W, H - FLOOR - 12, [0, 0, 20, 20]); g.fill();
    g.fillStyle = C.tableEdge; g.fillRect(0, FLOOR + 12, W, 3);
    g.save(); g.globalAlpha = 0.15; g.strokeStyle = C.tableEdge; g.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(0, FLOOR + 22 + i * 5); g.bezierCurveTo(W * 0.3, FLOOR + 18 + i * 6, W * 0.6, FLOOR + 28 + i * 5, W, FLOOR + 20 + i * 6); g.stroke(); }
    g.restore();

    for (const it of items) {
      if (it.t === 'stairs' || it.t === 'ramp' || it.t === 'plank') drawWood(it.bodies[0], C);
    }
    for (const it of items) if (it.t === 'bell') drawBell(it, C);
    for (const it of items) {
      if (it.t === 'd') drawDomino(it.bodies[0]);
      else if (it.t === 'ball') drawBall(it.bodies[0]);
      else if (it.t === 'crate') drawCrate(it.bodies[0]);
    }
    if (sel && sel.bodies && sel.bodies[0]) {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const b of sel.bodies) { x0 = Math.min(x0, b.minX); y0 = Math.min(y0, b.minY); x1 = Math.max(x1, b.maxX); y1 = Math.max(y1, b.maxY); }
      g.save(); g.setLineDash([7, 5]); g.strokeStyle = '#ff5a36'; g.lineWidth = 2; g.strokeRect(x0 - 6, y0 - 6, x1 - x0 + 12, y1 - y0 + 12); g.restore();
    }
    if (hover && !drag) drawGhost();
    if (drag && drag.mode === 'line' && drag.pts.length > 1) {
      g.save(); g.strokeStyle = 'rgba(255,90,54,.35)'; g.lineWidth = 3; g.setLineDash([4, 6]); g.lineCap = 'round';
      g.beginPath(); g.moveTo(drag.pts[0][0], drag.pts[0][1]); for (const p of drag.pts) g.lineTo(p[0], p[1]); g.stroke(); g.restore();
    }
  }

  function drawGhost() {
    const [x, y] = hover;
    g.save(); g.globalAlpha = 0.35;
    if (tool === 'line') {
      const S = SIZES[size];
      const top = surfaceY(x - S.w / 2, x + S.w / 2, y - S.h * 0.6);
      g.fillStyle = PATTERNS[pattern].fn(items.length);
      g.fillRect(x - S.w / 2, top - S.h, S.w, S.h);
    } else if (tool === 'stairs' || tool === 'ramp') {
      g.fillStyle = '#e8b77f';
      const bx = x - (tool === 'stairs' ? 130 : 100);
      const by = surfaceY(bx, bx + (tool === 'stairs' ? 260 : 200), y - 20);
      if (tool === 'stairs') for (let i = 0; i < 5; i++) g.fillRect(bx + i * 52, by - 13 * (i + 1), 52, 13 * (i + 1));
      else { g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + 200, by); g.lineTo(bx + 200, by - 64); g.closePath(); g.fill(); }
    } else if (tool === 'plank') { g.fillStyle = '#e8b77f'; g.fillRect(x - 100, y - 7, 200, 14); }
    else if (tool === 'ball') { g.fillStyle = '#4f8cff'; g.beginPath(); g.arc(x, y, 16, 0, 7); g.fill(); }
    else if (tool === 'crate') { g.fillStyle = '#d9a35b'; g.fillRect(x - 22, y - 22, 44, 44); }
    else if (tool === 'bell') { const by = surfaceY(x - 22, x + 22, y - 20); g.fillStyle = '#ffd23f'; g.fillRect(x - 3, by - 62, 6, 62); g.beginPath(); g.arc(x - 46, by - 36, 18, 0, 7); g.fill(); }
    else if (tool === 'erase') { g.strokeStyle = '#d64545'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 12, 0, 7); g.stroke(); }
    g.restore();
  }

  function unlock() { audioOk = true; }
  function fadeIntro() { if (!touched) { touched = true; intro.classList.add('is-faded'); } }

  let drag = null;
  const pos = (e) => { const r = canvas.getBoundingClientRect(); return toWorld(e.clientX - r.left, e.clientY - r.top); };
  const pushAt = (x, y) => {
    const it = itemAt(x, y);
    if (!it || !it.bodies) return false;
    const b = it.t === 'bell' ? it.bodies[1] : it.bodies[0];
    if (b.type === P.DYNAMIC) { push(b, x < b.x ? 1 : -1); if (!run && it.t === 'd') run = { t0: simTime, quiet: 0, done: false }; }
    return true;
  };
  canvas.addEventListener('pointerdown', (e) => {
    if (!Curio.touchpad || e.pointerType !== 'mouse' || canvas.classList.contains('curio-latched') || (e.button != null && e.button > 0)) return;
    if (tool !== 'push' && tool !== 'move') return;
    const [x, y] = pos(e);
    if (tool === 'move' && (itemAt(x, y) || panRange)) return;
    if (tool === 'push' && !itemAt(x, y) && panRange) return;
    e.stopImmediatePropagation();
    unlock(); fadeIntro();
    if (tool === 'push') pushAt(x, y); else sel = null;
  });
  Curio.drag(canvas, {
    start(q) {
      const e = q.event;
      if (e.button != null && e.button > 0) return;
      unlock(); fadeIntro();
      const [x, y] = toWorld(q.x, q.y);
      if (tool === 'line') {
        pushHistory();
        const ok = placeDomino(x, y);
        drag = { mode: 'line', pts: [[x, y]], last: ok ? [x, y] : null, acc: 0, any: ok };
        return;
      }
      if (tool === 'push') {
        if (!pushAt(x, y)) drag = { mode: 'pan', sx: q.clientX, ox };
        return;
      }
      if (tool === 'erase') { pushHistory(); drag = { mode: 'erase', any: false }; eraseAt(x, y); return; }
      if (tool === 'move') {
        const it = itemAt(x, y);
        if (it) { sel = it; drag = { mode: 'move', dx: x - it.x, dy: y - it.y, snap: snapshot(), moved: false }; }
        else { sel = null; drag = { mode: 'pan', sx: q.clientX, ox }; }
        return;
      }
      const it = placeThing(tool, x, y);
      if (it) { sel = it; drag = { mode: 'move', dx: x - it.x, dy: y - it.y, snap: null, moved: false }; }
    },
    move(q) { dragMove(q); },
    end() { endDrag(); }
  });
  function eraseAt(x, y) {
    for (const [dx, dy] of [[0, 0], [-6, 0], [6, 0], [0, -6], [0, 6]]) {
      const it = itemAt(x + dx, y + dy);
      if (it) { removeItem(it); drag && (drag.any = true); SND.pop(); return; }
    }
  }
  canvas.addEventListener('pointermove', (e) => { if (!drag) hover = e.pointerType === 'mouse' ? pos(e) : null; });
  function dragMove(q) {
    const [x, y] = toWorld(q.x, q.y);
    hover = q.pointerType === 'mouse' ? [x, y] : null;
    if (!drag) return;
    if (drag.mode === 'line') {
      const prev = drag.pts[drag.pts.length - 1];
      drag.pts.push([x, y]);
      const S = SIZES[size], sp = S.h * 0.56;
      if (!drag.last) { if (placeDomino(x, y)) { drag.last = [x, y]; drag.any = true; } return; }
      let [px, py] = prev;
      let seg = Math.hypot(x - px, y - py);
      while (seg > 0.01) {
        const need = sp - drag.acc;
        if (seg >= need) {
          const t = need / seg;
          px += (x - px) * t; py += (y - py) * t; seg -= need; drag.acc = 0;
          if (Math.abs(px - drag.last[0]) >= sp * 0.8) { if (placeDomino(px, py)) { drag.last = [px, py]; drag.any = true; } }
        } else { drag.acc += seg; seg = 0; }
      }
    } else if (drag.mode === 'erase') eraseAt(x, y);
    else if (drag.mode === 'move' && sel) {
      const nx = x - drag.dx, ny = y - drag.dy;
      if (Math.hypot(nx - sel.x, ny - sel.y) > 1) {
        sel.x = Math.max(0, Math.min(W, nx)); sel.y = Math.max(0, Math.min(FLOOR, ny));
        if (sel.t === 'd') { const S = SIZES[sel.s ?? 1]; sel.y = Math.min(sel.y, surfaceY(sel.x - S.w / 2, sel.x + S.w / 2, sel.y - S.h / 2) - S.h / 2 - 0.2); sel.a = 0; }
        unbuild(sel); buildItem(sel); drag.moved = true;
        for (const b of sel.bodies) world.wakeArea(b.minX - 40, b.minY - 60, b.maxX + 40, b.maxY + 40);
      }
    } else if (drag.mode === 'pan' && panRange) setPan(drag.ox + q.clientX - drag.sx);
  }
  const endDrag = () => {
    if (!drag) return;
    if (drag.mode === 'line' || drag.mode === 'erase') { if (!drag.any) history.pop(); else save(); }
    if (drag.mode === 'move') { if (drag.moved && drag.snap) history.push(drag.snap); save(); }
    drag = null;
  };
  canvas.addEventListener('pointerleave', () => { hover = null; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  let wheelAcc = 0;
  canvas.addEventListener('wheel', (e) => {
    if (e.ctrlKey) { e.preventDefault(); return; }
    const dx = e.deltaMode ? e.deltaX * 40 : e.deltaX, dy = e.deltaMode ? e.deltaY * 40 : e.deltaY;
    if (sel && (sel.t === 'plank' || sel.t === 'crate') && Math.abs(dy) >= Math.abs(dx)) {
      e.preventDefault();
      wheelAcc += dy;
      if (Math.abs(wheelAcc) >= 40) { rotateSel(wheelAcc > 0 ? 1 : -1); wheelAcc = 0; }
    }
    else if (panRange) { e.preventDefault(); setPan(ox - (dx || dy)); }
  }, { passive: false });
  function rotateSel(d) {
    if (!sel) return;
    pushHistory();
    if (sel.t === 'plank' || sel.t === 'crate') sel.a = Math.round(((sel.a || 0) + d * Math.PI / 24) * 1000) / 1000;
    else if (sel.t === 'stairs' || sel.t === 'ramp' || sel.t === 'bell') sel.f = sel.f ? 0 : 1;
    unbuild(sel); buildItem(sel); save();
  }

  const TOOLS = [
    ['line', '✏️', 'Dominoes'], ['push', '👉', 'Push'], ['move', '✋', 'Move'], ['erase', '🧽', 'Erase'], ['sep'],
    ['stairs', '🪜', 'Stairs'], ['ramp', '📐', 'Ramp'], ['plank', '➖', 'Shelf'], ['ball', '⚽', 'Ball'], ['crate', '📦', 'Crate'], ['bell', '🔔', 'Bell'], ['sep'],
    ['s0', '▫️', 'Small'], ['s1', '▭', 'Medium'], ['s2', '▮', 'Large'], ['s3', '⬛', 'Giant']
  ];
  const KEYS = { line: 'D', push: 'H', move: 'M', erase: 'X', stairs: '5', ramp: '6', plank: '7', ball: '8', crate: '9', bell: '0', s0: '1', s1: '2', s2: '3', s3: '4' };
  const row = document.getElementById('toolRow');
  for (const [t, e, l] of TOOLS) {
    if (t === 'sep') { const s = document.createElement('span'); s.className = 'dr-sep'; row.append(s); continue; }
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'dr-t'; b.dataset.t = t;
    b.innerHTML = '<span class="e"></span><span class="l"></span>';
    b.querySelector('.e').textContent = e; b.querySelector('.l').textContent = l;
    b.title = { line: 'Drag a line to place dominoes, tap for one', push: 'Tap a domino to tip it', move: 'Drag things around. Q/E rotate or flip', erase: 'Tap or drag to erase' }[t] || (t[0] === 's' && t.length === 2 ? `${l} dominoes` : `Tap to place a ${l.toLowerCase()}`);
    if (KEYS[t]) b.title += ` (${KEYS[t]})`;
    b.addEventListener('click', () => { unlock(); if (t[0] === 's' && t.length === 2) { size = +t[1]; if (tool !== 'line') tool = 'line'; } else tool = t; paint(); });
    row.append(b);
  }
  function paint() {
    for (const b of row.querySelectorAll('.dr-t')) {
      const t = b.dataset.t;
      b.setAttribute('aria-pressed', String(t === tool || (t[0] === 's' && t.length === 2 && +t[1] === size)));
    }
    canvas.style.cursor = tool === 'move' ? 'grab' : tool === 'push' ? 'pointer' : 'crosshair';
  }
  paint();

  const patSel = document.getElementById('pattern');
  for (const [k, v] of Object.entries(PATTERNS)) { const o = document.createElement('option'); o.value = k; o.textContent = v.label; patSel.append(o); }
  pattern = Curio.store.get('domino-run:pattern', 'rainbow');
  if (!PATTERNS[pattern]) pattern = 'rainbow';
  patSel.value = pattern;
  patSel.addEventListener('change', () => {
    pattern = patSel.value; Curio.store.set('domino-run:pattern', pattern);
    pushHistory();
    let i = 0;
    for (const it of items) if (it.t === 'd') it.c = PATTERNS[pattern].fn(i++);
    save();
  });

  function line(out, x0, x1, y, s, pat = 'rainbow', start = 0, sp) {
    const S = SIZES[s];
    sp = sp || S.h * 0.56;
    let i = start;
    let lx = x0;
    for (let x = x0; x <= x1 + 0.01; x += sp) { out.push({ t: 'd', x: Math.round(x * 10) / 10, y: y - S.h / 2 - 0.2, s, c: PATTERNS[pat].fn(i++) }); lx = x; }
    line.last = lx;
    return i;
  }
  function growLine(o, x, groups, pat) {
    let i = 0;
    groups.forEach(([s, n], gi) => {
      const S = SIZES[s];
      if (gi > 0) { const P0 = SIZES[groups[gi - 1][0]]; x = line.last + P0.w / 2 + P0.h * 0.5 + S.w / 2; }
      i = line(o, x, x + (n - 1) * S.h * 0.56, FLOOR, s, pat, i);
    });
    return line.last;
  }
  function stairsLine(o, x, f, pat, i) {
    for (let k = 0; k < 5; k++) {
      const s0 = f ? x - 52 * (k + 1) : x + 52 * k;
      i = line(o, s0 + 10, s0 + 36, FLOOR - 13 * (k + 1), 1, pat, i, 26);
    }
    return i;
  }
  const PRESETS = {
    first: { label: 'First chain', make: () => { const o = []; line(o, 150, 1150, FLOOR, 1); o.push({ t: 'ball', x: 1185, y: FLOOR - 17 }, { t: 'bell', x: 1300, y: FLOOR }); return o; } },
    grow: {
      label: 'Bigger and bigger',
      make: () => {
        const o = [];
        const end = growLine(o, 90, [[0, 9], [1, 7], [2, 6], [3, 5]], 'sunset');
        o.push({ t: 'crate', x: end + 80, y: FLOOR - 23 }, { t: 'crate', x: end + 80, y: FLOOR - 68 }, { t: 'crate', x: end + 80, y: FLOOR - 113 }, { t: 'bell', x: Math.min(1390, end + 230), y: FLOOR });
        return o;
      }
    },
    stairs: {
      label: 'Up and over',
      make: () => {
        const o = [{ t: 'stairs', x: 400, y: FLOOR }, { t: 'plank', x: 760, y: FLOOR - 58, len: 200 }, { t: 'stairs', x: 1120, y: FLOOR, f: 1 }];
        let i = line(o, 124, 384, FLOOR, 1, 'candy', 0, 26);
        i = stairsLine(o, 400, 0, 'candy', i);
        i = line(o, 670, 852, FLOOR - 65, 1, 'candy', i, 26);
        for (let k = 4; k >= 0; k--) { const s0 = 1120 - 52 * (k + 1); i = line(o, s0 + 10 + (k === 4 ? 26 : 0), s0 + 36, FLOOR - 13 * (k + 1), 1, 'candy', i, 26); }
        i = line(o, 1130, 1200, FLOOR, 1, 'candy', i, 26);
        o.push({ t: 'ball', x: 1236, y: FLOOR - 17 }, { t: 'bell', x: 1350, y: FLOOR });
        return o;
      }
    },
    levels: {
      label: 'Two floors',
      make: () => {
        const o = [{ t: 'plank', x: 480, y: 420, len: 760 }, { t: 'ramp', x: 720, y: FLOOR }];
        let i = line(o, 130, 760, 413, 1, 'ocean');
        o.push({ t: 'ball', x: 800, y: 396 });
        line(o, 170, 690, FLOOR, 1, 'ocean', i);
        o.push({ t: 'bell', x: 70, y: FLOOR, f: 1 });
        return o;
      }
    },
    wave: { label: 'Long rainbow', make: () => { const o = []; line(o, 50, 1260, FLOOR, 0); o.push({ t: 'ball', x: 1290, y: FLOOR - 17 }, { t: 'bell', x: 1395, y: FLOOR }); return o; } }
  };
  const preSel = document.getElementById('preset');
  for (const [k, v] of Object.entries(PRESETS)) { const o = document.createElement('option'); o.value = k; o.textContent = v.label; preSel.append(o); }
  preSel.addEventListener('change', () => {
    const k = preSel.value; preSel.value = '';
    if (!PRESETS[k]) return;
    pushHistory(); loadItems(PRESETS[k].make()); save(); fadeIntro();
    Curio.toast(`${PRESETS[k].label}: press Topple!`);
  });

  function togglePause() {
    paused = !paused;
    const b = document.getElementById('pause');
    b.setAttribute('aria-pressed', String(paused)); b.textContent = paused ? '▶ Play' : '⏸ Pause';
    paintTag();
  }
  function toggleSlow() {
    slow = !slow;
    const b = document.getElementById('slow');
    b.setAttribute('aria-pressed', String(slow));
    paintTag();
  }
  function paintTag() {
    tag.textContent = paused ? 'PAUSED' : slow ? 'SLOW MOTION' : '';
    tag.classList.toggle('is-on', paused || slow);
  }
  function undo() { if (!history.length) { Curio.toast('Nothing to undo'); return; } loadItems(JSON.parse(history.pop())); save(); }
  document.getElementById('go').addEventListener('click', topple);
  document.getElementById('slow').addEventListener('click', () => { unlock(); toggleSlow(); });
  document.getElementById('pause').addEventListener('click', togglePause);
  document.getElementById('stand').addEventListener('click', () => { unlock(); standUp(); SND.place(5); });
  document.getElementById('undo').addEventListener('click', undo);
  document.getElementById('rotL').addEventListener('click', () => { if (!sel) Curio.toast('Pick something with ✋ Move first'); else rotateSel(-1); });
  document.getElementById('rotR').addEventListener('click', () => { if (!sel) Curio.toast('Pick something with ✋ Move first'); else rotateSel(1); });
  document.getElementById('clear').addEventListener('click', () => { if (!items.length) return; pushHistory(); loadItems([]); save(); Curio.toast('Table cleared. Undo brings it back.'); });

  window.addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('select')) return;
    unlock();
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); undo(); return; }
    if (k === ' ' || k === 'enter') { e.preventDefault(); topple(); }
    else if (k === 'p') togglePause();
    else if (k === 's') toggleSlow();
    else if (k === 'r') standUp();
    else if (k === 'q') rotateSel(-1);
    else if (k === 'e') rotateSel(1);
    else if ((k === 'delete' || k === 'backspace') && sel) { pushHistory(); removeItem(sel); save(); }
    else if (k >= '1' && k <= '4') { size = +k - 1; tool = 'line'; paint(); }
    else if (e.ctrlKey || e.metaKey || e.altKey) return;
    else { const t = Object.keys(KEYS).find((x) => KEYS[x].toLowerCase() === k && x[0] !== 's'); if (t) { tool = t; paint(); } }
  });

  let last = 0, acc = 0, raf = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    budget = 6;
    if (!paused) {
      acc += dt * (slow ? 0.25 : 1);
      let n = 0;
      while (acc >= STEP && n < 3) { world.step(STEP); simTime += STEP; handleEvents(); checkRun(STEP); acc -= STEP; n++; }
      if (n === 3) acc = 0;
      for (const it of items) if (it.flash) it.flash = Math.max(0, it.flash - dt * 2);
    }
    draw();
  }
  setInterval(() => { if (!document.hidden && !paused) counts(); }, 250);
  function start() { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } }
  function stop() { cancelAnimationFrame(raf); raf = 0; }
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  window.addEventListener('resize', fit);
  window.Dominoes = { get world() { return world; }, get items() { return items; }, topple, load: (k) => loadItems(PRESETS[k].make()), loadList: (l) => loadItems(l), counts, standUp, place: placeDomino, setSize: (s) => { size = s; } };

  const saved = Curio.store.get(KEY, null);
  loadItems(Array.isArray(saved) && saved.length ? saved : PRESETS.first.make());
  fit();
  start();
  if (!Curio.touchpad && matchMedia('(pointer: fine)').matches && !Curio.store.get('tp-hint-domino-run', false)) { Curio.store.set('tp-hint-domino-run', true); setTimeout(() => Curio.toast('Tip: on a laptop touchpad, turn on Touchpad mode in the top bar: click to start a line of dominoes, click again to finish', 4200), 1800); }
})();
