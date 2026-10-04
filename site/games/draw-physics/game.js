(() => {
  const P = window.Phys, G = window.Geom;
  const W = 1000, H = 650, STEP = 1 / 60, BALL_R = 18, STAR_R = 24, LINE_R = 5;
  const CRAYONS = [
    { id: 'blue', light: '#2f6fdb', dark: '#7fb0ff' },
    { id: 'green', light: '#2e9d4f', dark: '#7fe0a0' },
    { id: 'orange', light: '#ef7d1a', dark: '#ffb36b' },
    { id: 'purple', light: '#8a4fd8', dark: '#c8a2ff' },
    { id: 'pink', light: '#e0478f', dark: '#ff9cc8' }
  ];

  const ground = (pts) => ({ poly: pts });
  const LEVELS = [
    {
      name: 'Mind the gap', hint: 'Draw a bridge over the gap, then tap the ball to nudge it.',
      ball: [300, 401], star: [830, 380],
      ground: [ground([[0, 420], [380, 420], [380, 650], [0, 650]]), ground([[620, 420], [1000, 420], [1000, 650], [620, 650]])]
    },
    {
      name: 'Over the wall', hint: 'Draw a slide from the cliff over the wall. Tap the ball to start.',
      ball: [190, 231], star: [840, 570],
      ground: [ground([[0, 250], [260, 250], [260, 650], [0, 650]]), ground([[260, 600], [1000, 600], [1000, 650], [260, 650]]), ground([[480, 380], [540, 380], [540, 600], [480, 600]])]
    },
    {
      name: 'Knock it off', hint: 'No nudging this time. Drop something on the ball to knock it off its tower.', noPoke: true,
      ball: [480, 311], star: [930, 572],
      ground: [ground([[0, 560], [1000, 610], [1000, 650], [0, 650]]), ground([[440, 330], [520, 330], [520, 600], [440, 600]])]
    },
    {
      name: 'Bowling', hint: 'No nudging. Roll something down the hill to knock the ball along.', noPoke: true,
      ball: [440, 501], star: [860, 532],
      ground: [ground([[0, 230], [120, 260], [320, 520], [590, 520], [860, 568], [1000, 540], [1000, 650], [0, 650]])]
    },
    {
      name: 'Long jump', hint: 'The ball will fly off the cliff. Give it somewhere to land.',
      ball: [70, 247], star: [900, 388],
      ground: [ground([[0, 266], [120, 266], [200, 296], [330, 330], [330, 650], [0, 650]]), ground([[700, 420], [1000, 420], [1000, 650], [700, 650]])]
    },
    {
      name: 'Catapult', hint: 'Drop something big on the raised end of the see-saw.', noPoke: true,
      ball: [262, 540], star: [870, 560],
      ground: [ground([[0, 600], [1000, 600], [1000, 650], [0, 650]]), ground([[365, 600], [400, 540], [435, 600]]), ground([[640, 360], [680, 360], [680, 600], [640, 600]])],
      lines: [[[760, 600], [750, 520]], [[985, 600], [990, 500]]],
      seesaw: { x: 400, y: 540, len: 330 }
    },
    {
      name: 'Free draw', hint: 'No rules. Draw, pin and fling. Tap the ball to push it around.', free: true,
      ball: [180, 400], star: null,
      ground: [ground([[0, 600], [250, 590], [450, 610], [700, 560], [1000, 600], [1000, 650], [0, 650]]), ground([[760, 300], [920, 300], [920, 320], [760, 320]])]
    }
  ];

  const canvas = document.getElementById('board');
  const g = canvas.getContext('2d');
  const stage = document.getElementById('stage');
  let world, ball, level = 0, tool = 'draw', fixed = false, color = 0, paused = false;
  let scale = 1, ox = 0, oy = 0, dpr = 1, cw = 0, ch = 0;
  let actions = [], userBodies = [], pins = [], strokes = 0, t0 = 0, simTime = 0, won = false, audioOk = false;
  let drawing = null, sparkle = [];
  const done = Curio.store.get('draw-physics:done', {});

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
    gn.gain.setValueAtTime(0.0001, t); gn.gain.linearRampToValueAtTime(vol, t + 0.004); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(gn).connect(master); o.start(t); o.stop(t + dur + 0.03);
  }
  const SND = {
    thud: (v) => tone(Curio.rand(110, 170), 0.12, 'sine', Math.min(0.25, v / 2400)),
    knock: (v) => tone(Curio.rand(240, 320), 0.07, 'triangle', Math.min(0.16, v / 3000)),
    ball: (v) => tone(Curio.rand(380, 460), 0.08, 'sine', Math.min(0.18, v / 2500)),
    pin: () => { tone(1200, 0.05, 'square', 0.04); tone(700, 0.08, 'sine', 0.08, 0, 0.03); },
    poke: () => tone(300, 0.1, 'sine', 0.12, 600),
    pop: () => tone(500, 0.08, 'sine', 0.08, 900),
    erase: () => tone(400, 0.12, 'sawtooth', 0.04, 150),
    win: () => [523, 659, 784, 1047].forEach((f, i) => { budget++; tone(f, 0.35, 'triangle', 0.14, 0, i * 0.09); }),
    lost: () => tone(300, 0.3, 'sine', 0.1, 120),
    scratch: () => tone(Curio.rand(2000, 3000), 0.02, 'triangle', 0.012)
  };

  function crayon(i) { const c = CRAYONS[i]; return Curio.isDark() ? c.dark : c.light; }

  function addGroundPoly(pts, user) {
    let poly = pts.slice();
    if (G.area(poly) < 0) poly.reverse();
    const parts = G.convexParts(poly);
    const shapes = parts.map((q) => P.makePoly(q.flat(), 0));
    return world.add({ type: P.STATIC, shapes, friction: 0.8, restitution: 0.1, user: { ...user, outline: poly, closed: true } });
  }
  function addLineBody(pts, type, r, user, density = 1) {
    const shapes = [];
    for (let i = 0; i < pts.length - 1; i++) shapes.push(P.makeCapsule(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], r));
    if (pts.length === 1) shapes.push(P.makeCircle(r * 2, pts[0][0], pts[0][1]));
    return world.add({ type, shapes, density, friction: 0.7, restitution: 0.1, angDamp: 0.1, user: { ...user, outline: pts, closed: false, r } });
  }

  const buildKey = () => `draw-physics:build:${level}`;
  function saveBuild() {
    if (!world) return;
    const bodies = userBodies.map((b) => ({ p: b.user.outline.map(([x, y]) => b.worldPoint(x, y).map((v) => Math.round(v * 10) / 10)), c: !!b.user.closed, d: !!b.user.dot, f: !!b.user.fixed, k: b.user.color }));
    const pp = pins.filter((j) => !j.user.level).map((j) => j.b.worldPoint(...j.lb).map((v) => Math.round(v)));
    Curio.store.set(buildKey(), bodies.length || pp.length ? { bodies, pins: pp, strokes } : null);
  }
  function loadLevel(i, fresh) {
    if (world && i !== level) saveBuild();
    level = i;
    const L = LEVELS[i];
    world = new P.World({ gy: 1000, substeps: 4, sleepTime: 0.6 });
    userBodies = []; pins = []; actions = []; strokes = 0; won = false; sparkle = [];
    for (const gp of L.ground) addGroundPoly(gp.poly, { level: true });
    for (const ln of L.lines || []) addLineBody(ln, P.STATIC, 7, { level: true });
    if (L.seesaw) {
      const s = L.seesaw;
      const plank = world.add({ x: s.x, y: s.y, a: -Math.asin(52 / (s.len / 2)), shapes: [P.makeBox(s.len, 12, 0, -8), P.makeBox(10, 30, -s.len / 2 + 5, -27)], density: 0.5, friction: 0.8, user: { level: true, plank: true } });
      const j = world.pinWorld(plank, s.x, s.y);
      j.user.level = true;
      pins.push(j);
    }
    ball = world.add({ x: L.ball[0], y: L.ball[1], shapes: [P.makeCircle(BALL_R)], density: 1.2, friction: 0.6, restitution: 0.25, linDamp: 0.01, angDamp: 0.04, user: { ball: true } });
    t0 = simTime;
    document.getElementById('lvlName').textContent = L.free ? 'Free draw' : `Level ${i + 1}: ${L.name}`;
    document.getElementById('hint').textContent = L.hint;
    document.getElementById('next').hidden = true;
    levelSel.value = String(i);
    if (fresh) Curio.store.set(buildKey(), null);
    else {
      const b = Curio.store.get(buildKey(), null);
      if (b && Array.isArray(b.bodies)) {
        try {
          for (const r of b.bodies) finishStroke(r.p, r);
          for (const [x, y] of b.pins || []) pinAt(x, y, true);
          strokes = b.strokes | 0;
        } catch {}
      }
    }
    paintStat();
    Curio.store.set('draw-physics:level', i);
  }
  function paintStat() {
    const L = LEVELS[level];
    const best = Curio.getBest(`lvl${level}`);
    document.getElementById('lvlStat').textContent = L.free ? `${userBodies.length} drawings` : `${strokes} stroke${strokes === 1 ? '' : 's'}${best != null ? ` · best ${best}` : ''}`;
  }

  function finishStroke(raw, rec) {
    if (!raw || !raw.length) return;
    let len = 0;
    for (let i = 1; i < raw.length; i++) len += Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1]);
    const isFixed = rec ? rec.f : fixed, col = rec ? (rec.k | 0) % CRAYONS.length : color;
    const type = isFixed ? P.STATIC : P.DYNAMIC;
    const user = { user: true, color: col, fixed: isFixed };
    let body = null;
    if (rec ? rec.d : len < 8) {
      const [x, y] = raw[0];
      body = world.add({ type, x, y, shapes: [P.makeCircle(11)], density: 1, friction: 0.7, restitution: 0.2, user: { ...user, dot: true, outline: [[0, 0]], local: true, r: 11 } });
    } else {
      const first = raw[0], last = raw[raw.length - 1];
      const closeGap = Math.hypot(first[0] - last[0], first[1] - last[1]);
      let poly = G.rdp(raw, 3);
      if (rec ? rec.c : closeGap < Math.max(26, len * 0.12) && len > 90) {
        if (rec) poly = raw.slice(); else poly = poly.slice(0, -1);
        if (Math.hypot(poly[0][0] - poly[poly.length - 1][0], poly[0][1] - poly[poly.length - 1][1]) < 4) poly.pop();
        const pts = [];
        for (const p of poly) if (!pts.length || Math.hypot(p[0] - pts[pts.length - 1][0], p[1] - pts[pts.length - 1][1]) > 5) pts.push(p);
        if (pts.length >= 3 && G.isSimple(pts) && Math.abs(G.area(pts)) > 300) {
          let pp = pts.slice();
          if (G.area(pp) < 0) pp.reverse();
          const parts = G.convexParts(pp);
          if (parts.length) {
            const shapes = parts.map((q) => P.makePoly(q.flat(), 2.5));
            body = world.add({ type, shapes, density: 1, friction: 0.7, restitution: 0.1, angDamp: 0.1, user: { ...user, closed: true } });
            body.user.outline = pp.map(([x, y]) => body.localPoint(x, y));
            body.user.local = true;
          }
        }
      }
      if (!body) {
        const pts = [];
        for (const p of rec ? raw : G.rdp(raw, 2.5)) if (!pts.length || Math.hypot(p[0] - pts[pts.length - 1][0], p[1] - pts[pts.length - 1][1]) > 4) pts.push(p);
        if (pts.length === 1) pts.push(raw[raw.length - 1]);
        body = addLineBody(pts, type, LINE_R, user);
        body.user.outline = pts.map(([x, y]) => body.localPoint(x, y));
        body.user.local = true;
      }
    }
    body.user.born = simTime;
    userBodies.push(body);
    actions.push({ kind: 'body', body });
    if (rec) return;
    strokes++;
    paintStat();
    world.wakeArea(body.minX - 20, body.minY - 20, body.maxX + 20, body.maxY + 20);
    SND.pop();
    saveBuild();
  }

  function pinAt(x, y, quiet) {
    const hits = [];
    for (let i = world.bodies.length - 1; i >= 0; i--) {
      const b = world.bodies[i];
      if (b.user.ball || b.user.ground) continue;
      if (x < b.minX - 4 || x > b.maxX + 4 || y < b.minY - 4 || y > b.maxY + 4) continue;
      if (b.shapes.some((sh) => P.shapeContains(sh, x, y))) hits.push(b);
    }
    const dyn = hits.filter((b) => b.type === P.DYNAMIC);
    if (!dyn.length) { if (!quiet) Curio.toast('Pin a drawn shape: tap on top of it'); return; }
    let j;
    if (dyn.length >= 2) j = world.addJoint({ a: dyn[1], b: dyn[0], la: dyn[1].localPoint(x, y), lb: dyn[0].localPoint(x, y) });
    else if (hits.length >= 2) { const st = hits.find((b) => b !== dyn[0]); j = world.addJoint({ a: st, b: dyn[0], la: st.localPoint(x, y), lb: dyn[0].localPoint(x, y) }); }
    else j = world.pinWorld(dyn[0], x, y);
    pins.push(j);
    actions.push({ kind: 'pin', joint: j });
    if (quiet) return;
    SND.pin();
    saveBuild();
  }

  function eraseAt(x, y) {
    for (let i = userBodies.length - 1; i >= 0; i--) {
      const b = userBodies[i];
      if (x < b.minX - 6 || x > b.maxX + 6 || y < b.minY - 6 || y > b.maxY + 6) continue;
      const hit = b.shapes.some((sh) => P.shapeContains(sh, x, y) || P.shapeContains(sh, x + 5, y) || P.shapeContains(sh, x - 5, y) || P.shapeContains(sh, x, y + 5) || P.shapeContains(sh, x, y - 5));
      if (hit) { removeBody(b); SND.erase(); saveBuild(); return true; }
    }
    for (let i = pins.length - 1; i >= 0; i--) {
      const j = pins[i]; if (j.user.level) continue;
      const [px, py] = j.b.worldPoint(...j.lb);
      if (Math.hypot(px - x, py - y) < 14) { world.removeJoint(j); pins.splice(i, 1); SND.erase(); saveBuild(); return true; }
    }
    return false;
  }
  function removeBody(b) {
    world.remove(b);
    userBodies.splice(userBodies.indexOf(b), 1);
    pins = pins.filter((j) => j.a !== b && j.b !== b);
    paintStat();
  }
  function undo() {
    const a = actions.pop();
    if (!a) { Curio.toast('Nothing to undo'); return; }
    if (a.kind === 'body') { if (userBodies.includes(a.body)) { removeBody(a.body); strokes = Math.max(0, strokes - 1); } }
    else if (a.kind === 'pin') { world.removeJoint(a.joint); pins = pins.filter((j) => j !== a.joint); }
    paintStat();
    SND.erase();
    saveBuild();
  }

  function poke(x) {
    const L = LEVELS[level];
    if (L.noPoke) { Curio.toast('No nudging on this level. Draw something!'); return; }
    let dir = L.star ? Math.sign(L.star[0] - ball.x) || 1 : Math.sign(ball.x - x) || 1;
    ball.wake();
    ball.vx += dir * 330; ball.vy -= 170; ball.w += dir * 14;
    SND.poke();
  }

  function respawnBall() {
    const L = LEVELS[level];
    ball.setPos(L.ball[0], L.ball[1], 0); ball.vx = 0; ball.vy = 0; ball.w = 0;
    SND.lost();
    Curio.toast('The ball fell off the page. Here it is again.');
  }

  async function win() {
    won = true;
    SND.win(); Curio.confetti();
    const secs = simTime - t0;
    const r = Curio.best(`lvl${level}`, strokes, false);
    done[level] = true; Curio.store.set('draw-physics:done', done);
    paintLevels(); paintStat();
    const last = level >= LEVELS.length - 2;
    const all = LEVELS.every((L, i) => L.free || done[i]);
    const res = await Curio.modal({ emoji: '⭐', title: all && last ? 'You beat every level!' : 'Star collected!', body: `${strokes} stroke${strokes === 1 ? '' : 's'} in ${secs.toFixed(1)}s.${r.isNew ? ' A new personal best!' : ` Best: ${r.best} stroke${r.best === 1 ? '' : 's'}.`}`, buttons: [{ label: last ? 'Free draw ✏️' : 'Next level ▶', value: 'next' }, { label: 'Replay', value: 'again' }, { label: 'Admire it', value: 'stay' }] });
    if (res === 'next') loadLevel(Math.min(LEVELS.length - 1, level + 1));
    else if (res === 'again') loadLevel(level, true);
    else document.getElementById('next').hidden = false;
  }

  function fit() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = stage.getBoundingClientRect();
    cw = r.width; ch = r.height;
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    const pad = cw < 560 ? 4 : 14, top = cw < 560 ? 92 : 64;
    scale = Math.min((cw - pad * 2) / W, (ch - top - pad) / H);
    ox = (cw - W * scale) / 2; oy = top + (ch - top - pad - H * scale) / 2;
    grain = null;
  }
  const toWorld = (cx, cy) => [(cx - ox) / scale, (cy - oy) / scale];

  let grain = null;
  function grainPattern() {
    if (grain) return grain;
    const c = document.createElement('canvas'); c.width = c.height = 96;
    const x = c.getContext('2d');
    const id = x.createImageData(96, 96);
    for (let i = 0; i < id.data.length; i += 4) { const v = Math.random(); id.data[i] = id.data[i + 1] = id.data[i + 2] = Curio.isDark() ? 0 : 255; id.data[i + 3] = v > 0.72 ? 150 : v > 0.55 ? 60 : 0; }
    x.putImageData(id, 0, 0);
    grain = g.createPattern(c, 'repeat');
    return grain;
  }

  function theme() {
    return Curio.isDark()
      ? { bg: '#161412', paper: '#23302a', line: 'rgba(255,255,255,.06)', margin: 'rgba(255,120,120,.18)', ground: '#c9a27a', groundFill: 'rgba(201,162,122,.28)', fixed: '#cfd6dc', ink: '#f3eee7' }
      : { bg: '#fbf7f0', paper: '#fffdf6', line: 'rgba(70,120,200,.13)', margin: 'rgba(230,80,80,.25)', ground: '#8a5a2b', groundFill: 'rgba(160,110,60,.22)', fixed: '#4a4f57', ink: '#1d1b19' };
  }

  function bodyPath(b) {
    const pts = b.user.outline;
    g.beginPath();
    if (b.user.local) {
      const [x0, y0] = b.worldPoint(pts[0][0], pts[0][1]); g.moveTo(x0, y0);
      for (let i = 1; i < pts.length; i++) { const [x, y] = b.worldPoint(pts[i][0], pts[i][1]); g.lineTo(x, y); }
    } else {
      g.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    }
    if (b.user.closed) g.closePath();
  }

  function crayonStroke(col, w, alpha = 1) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.globalAlpha = alpha; g.strokeStyle = col; g.lineWidth = w; g.stroke();
    g.globalAlpha = alpha * 0.55; g.lineWidth = w * 0.55;
    g.save(); g.translate(0.8, -0.6); g.stroke(); g.restore();
    g.globalAlpha = 1;
  }

  function drawBody(b, T) {
    const u = b.user;
    if (u.ball || (!u.outline && !u.plank)) return;
    let col = u.level ? T.ground : u.fixed ? T.fixed : crayon(u.color);
    if (u.plank) {
      g.fillStyle = Curio.isDark() ? 'rgba(255,207,122,.35)' : 'rgba(192,118,27,.3)';
      for (const sh of b.shapes) { g.beginPath(); for (let i = 0; i < sh.n; i++) g.lineTo(sh.wv[2 * i], sh.wv[2 * i + 1]); g.closePath(); g.fill(); crayonStroke(Curio.isDark() ? '#ffcf7a' : '#c0761b', 4); }
      return;
    }
    if (u.dot) {
      g.fillStyle = col; g.beginPath(); g.arc(b.x, b.y, 11, 0, 7); g.fill();
      g.strokeStyle = col; g.globalAlpha = 0.6; g.lineWidth = 2.5; g.stroke(); g.globalAlpha = 1;
      return;
    }
    if (u.closed) {
      bodyPath(b);
      g.fillStyle = u.level ? T.groundFill : col; g.globalAlpha = u.level ? 1 : 0.28; g.fill(); g.globalAlpha = 1;
      if (!u.level) {
        g.save(); bodyPath(b); g.clip();
        g.strokeStyle = col; g.globalAlpha = 0.35; g.lineWidth = 2;
        const s = 11, x0 = b.minX - 40, x1 = b.maxX + 40;
        g.beginPath();
        for (let x = x0 - (b.maxY - b.minY); x < x1; x += s) { g.moveTo(x, b.minY - 2); g.lineTo(x + (b.maxY - b.minY) + 4, b.maxY + 2); }
        g.stroke(); g.restore(); g.globalAlpha = 1;
      }
      bodyPath(b);
      crayonStroke(col, u.level ? 5 : 5);
    } else {
      bodyPath(b);
      crayonStroke(col, (u.r || LINE_R) * 2);
    }
  }

  function starPath(x, y, r, rot) {
    g.beginPath();
    for (let i = 0; i < 10; i++) { const a = rot + i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    g.closePath();
  }

  function draw() {
    const T = theme();
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = T.bg; g.fillRect(0, 0, cw, ch);
    g.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * ox, dpr * oy);
    g.fillStyle = T.paper; g.beginPath(); g.roundRect(0, 0, W, H, 16); g.fill();
    g.save(); g.beginPath(); g.roundRect(0, 0, W, H, 16); g.clip();
    g.strokeStyle = T.line; g.lineWidth = 1.5;
    for (let y = 40; y < H; y += 34) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    g.strokeStyle = T.margin; g.beginPath(); g.moveTo(60, 0); g.lineTo(60, H); g.stroke();
    const L = LEVELS[level];
    if (L.star) {
      const [sx, sy] = L.star, rot = simTime * 0.8, pul = 1 + Math.sin(simTime * 4) * 0.06;
      g.fillStyle = 'rgba(255,210,63,.25)'; g.beginPath(); g.arc(sx, sy, STAR_R * 1.6 * pul, 0, 7); g.fill();
      starPath(sx, sy, STAR_R * pul, rot); g.fillStyle = '#ffd23f'; g.fill();
      g.strokeStyle = '#d49a00'; g.lineWidth = 3; g.lineJoin = 'round'; g.stroke();
    }
    for (const b of world.bodies) drawBody(b, T);
    for (const j of pins) {
      const [px, py] = j.b.worldPoint(...j.lb);
      g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.arc(px + 1.5, py + 2, 6.5, 0, 7); g.fill();
      g.fillStyle = '#e53935'; g.beginPath(); g.arc(px, py, 6.5, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(px - 2, py - 2, 2.2, 0, 7); g.fill();
    }
    if (ball) {
      g.fillStyle = '#e53935'; g.beginPath(); g.arc(ball.x, ball.y, BALL_R, 0, 7); g.fill();
      g.strokeStyle = '#a3201d'; g.lineWidth = 3; g.stroke();
      g.save(); g.translate(ball.x, ball.y); g.rotate(ball.a);
      g.fillStyle = '#fff'; g.beginPath(); g.arc(-6, -4, 4, 0, 7); g.arc(6, -4, 4, 0, 7); g.fill();
      g.fillStyle = '#1d1b19'; g.beginPath(); g.arc(-5, -3.5, 2, 0, 7); g.arc(7, -3.5, 2, 0, 7); g.fill();
      g.strokeStyle = '#1d1b19'; g.lineWidth = 2; g.lineCap = 'round'; g.beginPath(); g.arc(0, 3, 6, 0.3, Math.PI - 0.3); g.stroke();
      g.restore();
    }
    for (const s of sparkle) {
      g.globalAlpha = Math.max(0, s.life); g.fillStyle = s.c;
      starPath(s.x, s.y, 6 * s.life + 2, s.life * 4); g.fill();
    }
    g.globalAlpha = 1;
    if (drawing && drawing.pts.length) {
      const pts = drawing.pts;
      g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
      for (const p of pts) g.lineTo(p[0], p[1]);
      crayonStroke(fixed ? T.fixed : crayon(color), LINE_R * 2, 0.85);
      if (pts.length > 8) {
        const a = pts[0], b = pts[pts.length - 1];
        let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
        if (Math.hypot(a[0] - b[0], a[1] - b[1]) < Math.max(26, len * 0.12) && len > 90) { g.strokeStyle = '#ff5a36'; g.lineWidth = 2; g.setLineDash([4, 4]); g.beginPath(); g.arc(a[0], a[1], 14, 0, 7); g.stroke(); g.setLineDash([]); }
      }
    }
    g.globalAlpha = 0.22; g.fillStyle = grainPattern(); g.fillRect(0, 0, W, H); g.globalAlpha = 1;
    g.restore();
  }

  function handleEvents() {
    for (const e of world.events) {
      const v = e.speed;
      if (e.a.user.ball || e.b.user.ball) { if (v > 70) SND.ball(v); continue; }
      if (v > 120) (e.a.type === P.STATIC || e.b.type === P.STATIC ? SND.thud : SND.knock)(v);
    }
  }

  let drag = null;
  const pos = (e) => { const r = canvas.getBoundingClientRect(); return toWorld(e.clientX - r.left, e.clientY - r.top); };
  const onBall = (x, y) => Math.hypot(x - ball.x, y - ball.y) < BALL_R + 10 / Math.min(1, scale * 1.4);
  canvas.addEventListener('pointerdown', (e) => {
    if (!Curio.touchpad || e.pointerType !== 'mouse' || canvas.classList.contains('curio-latched') || (e.button != null && e.button > 0)) return;
    const [x, y] = pos(e);
    if (tool === 'pin' || (tool === 'draw' && onBall(x, y))) {
      e.stopImmediatePropagation();
      audioOk = true;
      if (tool === 'pin') pinAt(x, y); else poke(x);
    }
  });
  Curio.drag(canvas, {
    start(q) {
      audioOk = true;
      if (q.event.button != null && q.event.button > 0) return;
      const [x, y] = toWorld(q.x, q.y);
      if (tool === 'draw' && onBall(x, y)) { poke(x); return; }
      if (tool === 'draw') { drawing = { pts: [[x, y]], t: 0 }; return; }
      if (tool === 'pin') { pinAt(x, y); return; }
      if (tool === 'erase') { drag = {}; eraseAt(x, y); }
    },
    move(q) {
      const [x, y] = toWorld(q.x, q.y);
      if (drawing) {
        const last = drawing.pts[drawing.pts.length - 1];
        const d = Math.hypot(x - last[0], y - last[1]);
        if (d > 2.5 && drawing.pts.length < 600) {
          drawing.pts.push([Math.max(-20, Math.min(W + 20, x)), Math.max(-200, Math.min(H, y))]);
          drawing.t += d; if (drawing.t > 40) { drawing.t = 0; SND.scratch(); }
        }
      } else if (drag) eraseAt(x, y);
    },
    end(q) {
      if (drawing) { if (q && q.event.type !== 'pointercancel') finishStroke(drawing.pts); drawing = null; }
      drag = null;
    }
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  const toolBtns = [...document.querySelectorAll('.dp-t[data-tool]')];
  function setTool(t) { tool = t; for (const b of toolBtns) b.setAttribute('aria-pressed', String(b.dataset.tool === t)); canvas.style.cursor = t === 'erase' ? 'cell' : t === 'pin' ? 'pointer' : 'crosshair'; }
  for (const b of toolBtns) b.addEventListener('click', () => { audioOk = true; setTool(b.dataset.tool); });
  const staticBtn = document.getElementById('static');
  function setFixed(v) { fixed = v; staticBtn.setAttribute('aria-pressed', String(v)); if (v && tool !== 'draw') setTool('draw'); }
  staticBtn.addEventListener('click', () => { setFixed(!fixed); Curio.toast(fixed ? 'New drawings will be fixed in place' : 'New drawings will fall'); });
  const colorsEl = document.getElementById('colors');
  CRAYONS.forEach((c, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'dp-c'; b.setAttribute('role', 'radio'); b.setAttribute('aria-label', `${c.id} crayon`); b.title = `${c.id} (${i + 1})`;
    b.style.background = c.light;
    b.addEventListener('click', () => { color = i; paintColors(); if (fixed) setFixed(false); setTool('draw'); });
    colorsEl.append(b);
  });
  function paintColors() { [...colorsEl.children].forEach((b, i) => b.setAttribute('aria-checked', String(i === color))); }
  paintColors();

  const levelSel = document.getElementById('level');
  function paintLevels() {
    levelSel.innerHTML = '';
    LEVELS.forEach((L, i) => { const o = document.createElement('option'); o.value = String(i); o.textContent = L.free ? '✏️ Free draw' : `${done[i] ? '⭐' : '○'} ${i + 1}. ${L.name}`; levelSel.append(o); });
    levelSel.value = String(level);
  }
  levelSel.addEventListener('change', () => loadLevel(+levelSel.value));
  document.getElementById('undo').addEventListener('click', undo);
  document.getElementById('restart').addEventListener('click', () => loadLevel(level, true));
  document.getElementById('next').addEventListener('click', () => loadLevel(Math.min(LEVELS.length - 1, level + 1)));
  function togglePause() {
    paused = !paused;
    const b = document.getElementById('pause');
    b.setAttribute('aria-pressed', String(paused)); b.textContent = paused ? '▶ Play' : '⏸ Pause';
    document.getElementById('tag').classList.toggle('is-on', paused);
  }
  document.getElementById('pause').addEventListener('click', togglePause);
  window.addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('select')) return;
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); undo(); }
    else if (k === ' ') { e.preventDefault(); togglePause(); }
    else if (k === 'r') loadLevel(level, true);
    else if (k === 'd') setTool('draw');
    else if (k === 'p') setTool('pin');
    else if (k === 'x') setTool('erase');
    else if (k === 'f') setFixed(!fixed);
    else if (k === 'n' && !document.getElementById('next').hidden) loadLevel(Math.min(LEVELS.length - 1, level + 1));
    else if (k >= '1' && k <= '5') { color = +k - 1; paintColors(); }
  });
  window.addEventListener('curio:theme', () => { grain = null; });

  let last = 0, acc = 0, raf = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    budget = 5;
    if (!paused) {
      acc += dt;
      let n = 0;
      while (acc >= STEP && n < 3) { world.step(STEP); simTime += STEP; handleEvents(); acc -= STEP; n++; }
      if (n === 3) acc = 0;
      const L = LEVELS[level];
      if (ball.y > H + 150 || ball.x < -150 || ball.x > W + 150) respawnBall();
      for (let i = userBodies.length - 1; i >= 0; i--) { const b = userBodies[i]; if (b.y > H + 600) removeBody(b); }
      if (L.star && !won && Math.hypot(ball.x - L.star[0], ball.y - L.star[1]) < BALL_R + STAR_R) {
        for (let i = 0; i < 18; i++) sparkle.push({ x: L.star[0], y: L.star[1], vx: Curio.rand(-260, 260), vy: Curio.rand(-320, 80), life: 1, c: Curio.pick(['#ffd23f', '#ff5a36', '#4f8cff', '#5ad66f']) });
        win();
      }
      for (const s of sparkle) { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 600 * dt; s.life -= dt * 0.9; }
      sparkle = sparkle.filter((s) => s.life > 0);
    }
    draw();
  }
  function start() { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } }
  function stop() { cancelAnimationFrame(raf); raf = 0; saveBuild(); }
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  window.addEventListener('resize', fit);
  window.addEventListener('pagehide', saveBuild);
  setInterval(() => { if (!document.hidden && !paused) saveBuild(); }, 4000);
  window.DrawPhysics = { get world() { return world; }, get ball() { return ball; }, loadLevel, stroke: (pts, opt = {}) => { if (opt.fixed != null) fixed = opt.fixed; finishStroke(pts); fixed = false; }, pinAt, poke: () => poke(0), get won() { return won; } };

  level = Math.min(LEVELS.length - 1, Math.max(0, Curio.store.get('draw-physics:level', 0) | 0));
  paintLevels();
  loadLevel(level);
  fit();
  start();
  if (!Curio.touchpad && matchMedia('(pointer: fine)').matches && !Curio.store.get('tp-hint-draw-physics', false)) { Curio.store.set('tp-hint-draw-physics', true); setTimeout(() => Curio.toast('Tip: on a laptop touchpad, turn on Touchpad mode in the top bar: click to put the crayon down, click again to lift it', 4200), 1800); }
})();
