(() => {
  const P = window.Phys;
  const W = 1000, H = 800, MR = 10, TR = 6, MAXM = 320, STEP = 1 / 60;
  const KEY = 'marble-run:build';
  const NOTES = [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77, 1046.5];
  const NOTE_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C'];
  const NOTE_COLORS = ['#ff5a5a', '#ff9f43', '#ffd23f', '#5ad66f', '#36c5d9', '#4f8cff', '#9b6bff', '#ff6fb5'];
  const MARBLE_COLORS = ['#ff5a5a', '#ff9f43', '#ffd23f', '#5ad66f', '#36c5d9', '#4f8cff', '#9b6bff', '#ff6fb5', '#f5f5f5', '#2ec4a6'];

  const canvas = document.getElementById('board');
  const g = canvas.getContext('2d');
  const stage = document.getElementById('stage');
  const selBar = document.getElementById('selBar');
  const intro = document.getElementById('intro');
  const nMarbles = document.getElementById('nMarbles');

  let world, pieces = [], marbles = [], sel = null, armed = null, paused = false, simTime = 0;
  let scale = 1, ox = 0, oy = 0, dpr = 1, cw = 0, ch = 0;
  let history = [], hover = null, ghostAngle = {}, touched = false;
  let colorIdx = 0, panRange = 0, panX = null, panHinted = false;
  function setPan(x) { if (panRange) { x = Math.max(cw - W * scale - (cw < 560 ? 6 : 16), Math.min(cw < 560 ? 6 : 16, x)); panX = x; } ox = x; }

  function kit(p) {
    const f = p.f ? -1 : 1, c = Math.cos(p.a), s = Math.sin(p.a);
    const k = {
      f,
      tp: (x, y) => [p.x + c * f * x - s * y, p.y + s * f * x + c * y],
      cap: (x1, y1, x2, y2, r = TR, o = {}) => P.makeCapsule(f * x1, y1, f * x2, y2, r, o),
      circ: (x, y, r, o = {}) => P.makeCircle(r, f * x, y, o),
      box: (w, h, x = 0, y = 0, a = 0, o = {}) => P.makeBox(w, h, f * x, y, f * a, 0, o),
      arc: (cx, cy, R, a0, a1, n, r = TR, o = {}) => {
        const out = [];
        for (let i = 0; i < n; i++) {
          const t0 = a0 + (a1 - a0) * i / n, t1 = a0 + (a1 - a0) * (i + 1) / n;
          out.push(k.cap(cx + R * Math.cos(t0), cy + R * Math.sin(t0), cx + R * Math.cos(t1), cy + R * Math.sin(t1), r, o));
        }
        return out;
      },
      body: (type, shapes, o = {}) => world.add({ type, x: p.x, y: p.y, a: p.a, shapes, friction: 0.35, restitution: 0.2, ...o, user: { piece: p, kind: p.t, ...(o.user || {}) } })
    };
    return k;
  }

  const CAT = {
    ramp: { label: 'Ramp', a: 0.24, color: '#f3a541', build: (p, k) => [k.body(P.STATIC, [k.cap(-110, 0, 110, 0)])] },
    short: { label: 'Short', a: 0.24, color: '#f3a541', build: (p, k) => [k.body(P.STATIC, [k.cap(-55, 0, 55, 0)])] },
    curve: { label: 'Curve', a: 0, color: '#ef7d57', build: (p, k) => [k.body(P.STATIC, k.arc(-50, -50, 100, 0, Math.PI / 2, 8))] },
    funnel: {
      label: 'Funnel', a: 0, color: '#36c5d9',
      build: (p, k) => [k.body(P.STATIC, [k.cap(-85, -55, -19, 8), k.cap(85, -55, 19, 8), k.cap(-19, 8, -19, 28), k.cap(19, 8, 19, 28)])]
    },
    bumper: { label: 'Bumper', a: 0, color: '#ff6fb5', build: (p, k) => [k.body(P.STATIC, [k.circ(0, 0, 22)], { restitution: 1.05 })] },
    seesaw: {
      label: 'See-saw', a: 0, color: '#8bc34a',
      build: (p, k) => {
        const base = k.body(P.STATIC, [P.makePoly([0, 9, -22, 44, 22, 44]), k.cap(-72, 30, -72, 44, 4), k.cap(72, 30, 72, 44, 4)], { user: { deco: 'base' } });
        const plank = k.body(P.DYNAMIC, [P.makeBox(176, 10)], { density: 0.6, friction: 0.5, restitution: 0.05, angDamp: 0.6, user: { plank: true } });
        world.pinWorld(plank, p.x, p.y);
        return [base, plank];
      }
    },
    loop: {
      label: 'Loop', a: 0, color: '#9b6bff',
      build: (p, k) => [k.body(P.STATIC, [...k.arc(0, 0, 78, Math.PI * 0.56, -Math.PI * 0.9, 18), k.cap(-14, 77, -80, 77)])]
    },
    xylo: { label: 'Xylophone', a: 0.12, color: '#ffd23f', build: (p, k) => [k.body(P.STATIC, [k.box(78, 12)], { restitution: 0.4, friction: 0.25 })] },
    bell: { label: 'Bell', a: 0, color: '#f2c14e', build: (p, k) => [k.body(P.STATIC, [k.circ(0, 6, 18), k.cap(-20, 22, 20, 22, 4)], { restitution: 0.5 })] },
    tramp: { label: 'Trampoline', a: 0, color: '#4f8cff', build: (p, k) => [k.body(P.STATIC, [k.cap(-46, 0, 46, 0, 4)], { restitution: 1.12, friction: 0.2 })] },
    spinner: {
      label: 'Spinner', a: 0, color: '#2ec4a6',
      build: (p, k) => {
        const arms = [];
        for (let i = 0; i < 3; i++) { const t = i * Math.PI * 2 / 3; arms.push(P.makeCapsule(0, 0, 62 * Math.cos(t), 62 * Math.sin(t), 6)); }
        return [k.body(P.KINEMATIC, arms, { w: 1.7 * k.f })];
      }
    },
    elevator: {
      label: 'Elevator', a: 0, color: '#78909c',
      build: (p, k) => {
        const frame = k.body(P.STATIC, [k.cap(-42, -215, -42, 150, 6), k.cap(-36, 152, 75, 136, 6)], { friction: 0.2 });
        const out = [frame];
        for (let i = 0; i < 5; i++) out.push(k.body(P.KINEMATIC, [k.cap(-30, 0, 31, 0, 4), k.cap(-30, 0, -33, -8, 4)], { friction: 0.8, user: { shelf: i } }));
        return out;
      },
      tick: (p, bodies, t, dt) => {
        const k = kitStatic(p);
        for (const b of bodies) {
          if (b.user.shelf == null) continue;
          const ny = 205 - ((t + dt) * 75 + b.user.shelf * 80) % 400;
          const [tx, ty] = k.tp(0, ny);
          const tilt = ny > -140 ? -0.15 : -0.15 + Math.min(1, (-140 - ny) / 40) * 0.75;
          const ta = p.a + k.f * tilt;
          if (Math.hypot(tx - b.x, ty - b.y) > 60) { b.x = tx; b.y = ty; b.a = ta; b.vx = 0; b.vy = 0; b.w = 0; b.sync(); }
          else { b.vx = (tx - b.x) / dt; b.vy = (ty - b.y) / dt; b.w = (ta - b.a) / dt; }
        }
      }
    },
    cup: { label: 'Cup', a: 0, color: '#ef7d57', build: (p, k) => [k.body(P.STATIC, [k.cap(-44, -34, -38, 22), k.cap(-38, 22, 38, 22), k.cap(38, 22, 44, -34)], { restitution: 0.05 })] },
    dispenser: {
      label: 'Dispenser', a: 0, color: '#5d6d7e',
      build: (p, k) => [k.body(P.STATIC, [k.cap(-48, -46, -17, -2, 5), k.cap(48, -46, 17, -2, 5), k.cap(-17, -2, -17, 12, 5), k.cap(17, -2, 17, 12, 5)], { friction: 0.1 })]
    }
  };
  const kitStatic = (p) => { const f = p.f ? -1 : 1, c = Math.cos(p.a), s = Math.sin(p.a); return { f, tp: (x, y) => [p.x + c * f * x - s * y, p.y + s * f * x + c * y] }; };

  const PRESETS = {
    scale: {
      label: 'Xylophone stairs',
      pieces: (() => {
        const out = [{ t: 'dispenser', x: 110, y: 70, a: 0 }, { t: 'ramp', x: 205, y: 170, a: 0.2 }];
        for (let i = 0; i < 8; i++) out.push({ t: 'xylo', x: 342 + i * 74, y: 222 + i * 30, a: 0.18, n: i });
        out.push({ t: 'curve', x: 940, y: 520, a: 0 }, { t: 'ramp', x: 760, y: 610, a: -0.12, f: 0 }, { t: 'bell', x: 590, y: 600, a: 0 });
        out.push({ t: 'ramp', x: 420, y: 680, a: -0.1 }, { t: 'cup', x: 230, y: 730, a: 0 });
        return out;
      })()
    },
    pinball: {
      label: 'Bumper bash',
      pieces: [
        { t: 'dispenser', x: 500, y: 60, a: 0 }, { t: 'funnel', x: 500, y: 170, a: 0 },
        { t: 'bumper', x: 430, y: 290, a: 0 }, { t: 'bumper', x: 570, y: 290, a: 0 }, { t: 'bumper', x: 500, y: 370, a: 0 },
        { t: 'bumper', x: 360, y: 400, a: 0 }, { t: 'bumper', x: 640, y: 400, a: 0 },
        { t: 'ramp', x: 230, y: 470, a: 0.42 }, { t: 'ramp', x: 770, y: 470, a: -0.42 },
        { t: 'tramp', x: 500, y: 600, a: 0 }, { t: 'spinner', x: 250, y: 650, a: 0 }, { t: 'spinner', x: 750, y: 650, a: 0, f: 1 },
        { t: 'bell', x: 120, y: 330, a: 0 }, { t: 'bell', x: 880, y: 330, a: 0 },
        { t: 'seesaw', x: 500, y: 715, a: 0 }
      ]
    },
    forever: {
      label: 'Forever loop',
      pieces: [
        { t: 'elevator', x: 80, y: 595, a: 0 }, { t: 'dispenser', x: 200, y: 300, a: 0 }, { t: 'ramp', x: 235, y: 452, a: 0.18 },
        { t: 'xylo', x: 380, y: 498, a: 0.2, n: 0 }, { t: 'xylo', x: 454, y: 528, a: 0.2, n: 2 }, { t: 'xylo', x: 528, y: 558, a: 0.2, n: 4 },
        { t: 'curve', x: 640, y: 560, a: 0 }, { t: 'ramp', x: 480, y: 646, a: -0.232 }, { t: 'ramp', x: 262, y: 697, a: -0.232 }
      ]
    },
    seesaws: {
      label: 'See-saw cascade',
      pieces: [
        { t: 'dispenser', x: 345, y: 70, a: 0 }, { t: 'seesaw', x: 300, y: 200, a: 0 }, { t: 'seesaw', x: 470, y: 320, a: 0 }, { t: 'seesaw', x: 300, y: 440, a: 0 },
        { t: 'seesaw', x: 470, y: 560, a: 0 }, { t: 'xylo', x: 175, y: 250, a: -0.3, n: 0 }, { t: 'xylo', x: 600, y: 375, a: 0.3, n: 4 }, { t: 'xylo', x: 175, y: 490, a: -0.3, n: 2 }, { t: 'xylo', x: 600, y: 615, a: 0.3, n: 7 },
        { t: 'funnel', x: 385, y: 680, a: 0 }, { t: 'cup', x: 385, y: 760, a: 0 }, { t: 'bell', x: 800, y: 300, a: 0 }, { t: 'spinner', x: 800, y: 560, a: 0 }
      ]
    }
  };

  let walls;
  function newWorld() {
    world = new P.World({ gy: 1300, substeps: 4, sleepTime: 0.6 });
    walls = world.add({ type: P.STATIC, shapes: [P.makeCapsule(-40, H + 30, W + 40, H + 30, 30), P.makeCapsule(-30, -400, -30, H + 30, 30), P.makeCapsule(W + 30, -400, W + 30, H + 30, 30)], friction: 0.5, restitution: 0.1, user: { kind: 'wall' } });
  }

  function buildPiece(p) {
    const def = CAT[p.t];
    p.bodies = def.build(p, kit(p));
    if (def.tick) def.tick(p, p.bodies, simTime, STEP);
    for (const b of p.bodies) world.wakeArea(b.minX - 30, b.minY - 30, b.maxX + 30, b.maxY + 30);
  }
  function unbuild(p) { for (const b of p.bodies || []) world.remove(b); p.bodies = []; }
  function rebuild(p) { unbuild(p); buildPiece(p); }
  const clean = (p) => { const o = { t: p.t, x: Math.round(p.x), y: Math.round(p.y), a: +p.a.toFixed(4) }; if (p.f) o.f = 1; if (p.n != null) o.n = p.n; return o; };
  const snapshot = () => JSON.stringify(pieces.map(clean));
  function save() { Curio.store.set(KEY, pieces.map(clean)); }
  function pushHistory() { history.push(snapshot()); if (history.length > 80) history.shift(); }
  function loadPieces(list) {
    for (const p of pieces) unbuild(p);
    pieces = [];
    sel = null;
    for (const raw of list) { if (!CAT[raw.t]) continue; const p = { ...raw, a: raw.a || 0, queue: 0, cool: 0 }; if (p.t === 'xylo' && p.n == null) p.n = 0; pieces.push(p); buildPiece(p); }
    updateSel();
  }

  let ac = null, master = null, budget = 0, audioOk = false;
  function audio() {
    if (Curio.muted || !audioOk) return null;
    ac = Curio.audioContext();
    if (!ac) return null;
    if (!master) { master = ac.createDynamicsCompressor(); master.threshold.value = -14; master.ratio.value = 6; master.connect(ac.destination); }
    return ac;
  }
  function tone(freq, dur, type, vol, glide, delay = 0) {
    const a = audio(); if (!a || budget <= 0) return;
    budget--;
    const t = a.currentTime + delay;
    const o = a.createOscillator(), gn = a.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + dur * 0.8);
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.linearRampToValueAtTime(vol, t + 0.004);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(gn).connect(master);
    o.start(t); o.stop(t + dur + 0.03);
  }
  const SND = {
    tick: (v) => tone(500 + Math.random() * 300, 0.05, 'triangle', Math.min(0.14, v / 5000)),
    clack: (v) => tone(2300 + Math.random() * 900, 0.03, 'sine', Math.min(0.12, v / 6000)),
    note: (n, v) => { const vol = Math.min(0.3, 0.08 + v / 4000); tone(NOTES[n], 0.9, 'sine', vol); tone(NOTES[n] * 3.98, 0.18, 'sine', vol * 0.25); },
    bell: (v) => { const vol = Math.min(0.24, 0.07 + v / 5000); [[1, 1.8, 1], [2.0, 1.1, 0.5], [2.76, 0.8, 0.35], [5.4, 0.4, 0.2]].forEach(([m, d, k]) => tone(698.46 * m, d, 'sine', vol * k)); },
    bump: (v) => tone(260, 0.16, 'square', Math.min(0.08, 0.03 + v / 10000), 620),
    boing: (v) => tone(160, 0.25, 'sine', Math.min(0.22, 0.06 + v / 5000), 420),
    pop: () => tone(900, 0.05, 'sine', 0.05, 1500)
  };

  function marbleColor() { colorIdx = (colorIdx + 1) % MARBLE_COLORS.length; return colorIdx; }
  function addMarble(x, y, vx = 0, vy = 0) {
    const b = world.add({ x, y, vx, vy, shapes: [P.makeCircle(MR)], density: 1, friction: 0.3, restitution: 0.3, angDamp: 0.4, user: { marble: true, col: marbleColor() } });
    marbles.push(b);
    while (marbles.length > MAXM) world.remove(marbles.shift());
    return b;
  }
  function spaceFree(x, y, r) {
    for (let i = marbles.length - 1; i >= Math.max(0, marbles.length - 60); i--) { const m = marbles[i]; if ((m.x - x) ** 2 + (m.y - y) ** 2 < r * r) return false; }
    return true;
  }

  function preStep(dt) {
    for (const p of pieces) {
      const def = CAT[p.t];
      if (def.tick) def.tick(p, p.bodies, simTime, dt);
      if (p.t === 'dispenser' && p.queue > 0) {
        p.cool -= dt;
        if (p.cool <= 0) {
          const [sx, sy] = kitStatic(p).tp(0, -26);
          if (spaceFree(sx, sy, MR * 2.2)) { addMarble(sx + Curio.rand(-2, 2), sy, Curio.rand(-20, 20), 40); p.queue--; p.cool = 0.09; p.flash = 1; SND.pop(); }
        }
      }
    }
  }

  function handleEvents() {
    for (const e of world.events) {
      const ma = e.a.user.marble, mb = e.b.user.marble;
      const other = ma ? e.b : e.a;
      const v = e.speed;
      if (ma && mb) { if (v > 80) SND.clack(v); continue; }
      const kind = other.user.kind;
      const pc = other.user.piece;
      if (pc) pc.flash = Math.min(1, (pc.flash || 0) + Math.min(1, v / 600));
      if (kind === 'xylo') { if (v > 60) SND.note(pc.n || 0, v); }
      else if (kind === 'bell') { if (v > 60) { SND.bell(v); pc.swing = Math.min(0.5, (pc.swing || 0) + v / 2500) * (e.x < other.x ? -1 : 1); } }
      else if (kind === 'bumper') {
        const m = ma ? e.a : e.b, s = ma ? -1 : 1;
        m.vx += e.c.nx * s * 260; m.vy += e.c.ny * s * 260;
        SND.bump(v);
      } else if (kind === 'tramp') { if (v > 80) SND.boing(v); }
      else if (v > 90) SND.tick(v);
    }
  }

  function cleanupMarbles() {
    for (let i = marbles.length - 1; i >= 0; i--) {
      const m = marbles[i];
      if (m.y > H + 200 || m.x < -200 || m.x > W + 200 || m.y < -1500) { world.remove(m); marbles.splice(i, 1); }
    }
  }

  function fit() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = stage.getBoundingClientRect();
    cw = r.width; ch = r.height;
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    const pad = cw < 560 ? 6 : 16;
    const top = cw < 560 ? 70 : 56;
    const fitS = Math.min((cw - pad * 2) / W, (ch - top - pad) / H);
    const tallS = Math.min(1, (ch - top - pad) / H);
    scale = cw < 760 && tallS > fitS * 1.15 ? tallS : fitS;
    oy = top + (ch - top - pad - H * scale) / 2;
    panRange = Math.max(0, W * scale + pad * 2 - cw);
    setPan(panRange ? (panX ?? (cw - W * scale) / 2) : (cw - W * scale) / 2);
    sprites = {};
    paletteIcons();
    updateSel();
  }
  const toWorld = (cx, cy) => [(cx - ox) / scale, (cy - oy) / scale];

  let sprites = {};
  function sprite(ci) {
    if (sprites[ci]) return sprites[ci];
    const px = Math.ceil(MR * 2 * scale * dpr) + 4;
    const c = document.createElement('canvas'); c.width = c.height = px;
    const x = c.getContext('2d'), r = MR * scale * dpr, m = px / 2;
    const col = MARBLE_COLORS[ci];
    const gr = x.createRadialGradient(m - r * 0.35, m - r * 0.4, r * 0.1, m, m, r);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.25, col); gr.addColorStop(1, shade(col, -0.45));
    x.fillStyle = gr; x.beginPath(); x.arc(m, m, r, 0, Math.PI * 2); x.fill();
    x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = Math.max(1, r * 0.08); x.stroke();
    x.fillStyle = 'rgba(255,255,255,.75)'; x.beginPath(); x.ellipse(m - r * 0.35, m - r * 0.42, r * 0.28, r * 0.18, -0.6, 0, Math.PI * 2); x.fill();
    return (sprites[ci] = c);
  }
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, gg = (n >> 8) & 255, b = n & 255;
    if (k < 0) { r *= 1 + k; gg *= 1 + k; b *= 1 + k; } else { r += (255 - r) * k; gg += (255 - gg) * k; b += (255 - b) * k; }
    return `rgb(${r | 0},${gg | 0},${b | 0})`;
  }

  function pieceColor(b) {
    const p = b.user.piece;
    if (!p) return '#888';
    if (p.t === 'xylo') return NOTE_COLORS[p.n || 0];
    if (b.user.deco === 'base') return '#6d8f3a';
    return CAT[p.t].color;
  }

  function strokeShapes(x, b, color, lw, alpha = 1) {
    x.globalAlpha = alpha;
    x.strokeStyle = color; x.fillStyle = color; x.lineCap = 'round'; x.lineJoin = 'round';
    for (const sh of b.shapes) {
      if (sh.type === 'c') { x.beginPath(); x.arc(sh.wx, sh.wy, sh.r + lw / 2, 0, Math.PI * 2); x.fill(); }
      else if (sh.n === 2) { x.lineWidth = sh.r * 2 + lw; x.beginPath(); x.moveTo(sh.wv[0], sh.wv[1]); x.lineTo(sh.wv[2], sh.wv[3]); x.stroke(); }
      else {
        x.lineWidth = lw + sh.r * 2;
        x.beginPath(); x.moveTo(sh.wv[0], sh.wv[1]);
        for (let i = 1; i < sh.n; i++) x.lineTo(sh.wv[2 * i], sh.wv[2 * i + 1]);
        x.closePath(); x.fill(); if (lw > 0) x.stroke();
      }
    }
    x.globalAlpha = 1;
  }

  function drawBody(x, b, alpha = 1) {
    const col = pieceColor(b);
    const p = b.user.piece;
    const fl = p && p.flash ? p.flash : 0;
    strokeShapes(x, b, shade(col.startsWith('#') ? col : '#888888', -0.35), 4, alpha);
    strokeShapes(x, b, fl > 0.05 ? shade(col, fl * 0.6) : col, 0, alpha);
    x.globalAlpha = alpha * 0.45;
    x.strokeStyle = '#fff'; x.lineWidth = 2; x.lineCap = 'round';
    for (const sh of b.shapes) {
      if (sh.n === 2) {
        const dx = sh.wv[2] - sh.wv[0], dy = sh.wv[3] - sh.wv[1], L = Math.hypot(dx, dy) || 1;
        let nx = dy / L, ny = -dx / L; if (ny > 0) { nx = -nx; ny = -ny; }
        const o = sh.r * 0.45;
        x.beginPath(); x.moveTo(sh.wv[0] + nx * o, sh.wv[1] + ny * o); x.lineTo(sh.wv[2] + nx * o, sh.wv[3] + ny * o); x.stroke();
      }
    }
    x.globalAlpha = 1;
  }

  function drawDeco(x, p, alpha = 1) {
    const k = kitStatic(p);
    x.globalAlpha = alpha;
    if (p.t === 'xylo') {
      const [cx, cy] = k.tp(0, 0);
      x.save(); x.translate(cx, cy); x.rotate(p.a);
      x.fillStyle = 'rgba(0,0,0,.35)';
      x.beginPath(); x.arc(-30, 0, 2.6, 0, 7); x.arc(30, 0, 2.6, 0, 7); x.fill();
      x.rotate(-p.a);
      x.fillStyle = 'rgba(0,0,0,.6)'; x.font = '800 11px system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(NOTE_NAMES[p.n || 0] + ((p.n || 0) === 7 ? '′' : ''), 0, 1);
      x.restore();
    } else if (p.t === 'bell') {
      const sw = p.swing || 0;
      const [cx, cy] = k.tp(0, -22);
      x.save(); x.translate(cx, cy); x.rotate(p.a + Math.sin(simTime * 18) * sw);
      x.fillStyle = '#7a5a20'; x.fillRect(-2, -6, 4, 8);
      const gr = x.createLinearGradient(-22, 0, 22, 0); gr.addColorStop(0, '#c99a2e'); gr.addColorStop(0.4, '#ffe082'); gr.addColorStop(1, '#b8861b');
      x.fillStyle = gr; x.strokeStyle = '#7a5a20'; x.lineWidth = 2;
      x.beginPath(); x.moveTo(-6, 0); x.quadraticCurveTo(-14, 6, -16, 26); x.quadraticCurveTo(-22, 36, -24, 42); x.lineTo(24, 42); x.quadraticCurveTo(22, 36, 16, 26); x.quadraticCurveTo(14, 6, 6, 0); x.closePath(); x.fill(); x.stroke();
      x.fillStyle = '#7a5a20'; x.beginPath(); x.arc(0, 44, 4.5, 0, 7); x.fill();
      x.restore();
    } else if (p.t === 'tramp') {
      x.strokeStyle = '#37474f'; x.lineWidth = 3; x.lineCap = 'round';
      for (const sx of [-34, 34]) { const [a1, b1] = k.tp(sx, 2), [a2, b2] = k.tp(sx * 1.15, 26); x.beginPath(); x.moveTo(a1, b1); x.lineTo(a2, b2); x.stroke(); }
      x.strokeStyle = '#90a4ae'; x.lineWidth = 1.6;
      for (let i = -3; i <= 3; i++) { const [a1, b1] = k.tp(i * 11, 4); const [a2, b2] = k.tp(i * 11, 14); x.beginPath(); x.moveTo(a1, b1); for (let j = 1; j <= 4; j++) { const [q, w] = k.tp(i * 11 + (j % 2 ? 3 : -3), 4 + j * 2.5); x.lineTo(q, w); } x.lineTo(a2, b2); x.stroke(); }
    } else if (p.t === 'spinner') {
      const [cx, cy] = k.tp(0, 0);
      x.fillStyle = '#1f7a68'; x.beginPath(); x.arc(cx, cy, 11, 0, 7); x.fill();
      x.fillStyle = '#e0f2f1'; x.beginPath(); x.arc(cx, cy, 4, 0, 7); x.fill();
    } else if (p.t === 'seesaw') {
      const [cx, cy] = k.tp(0, 0);
      x.fillStyle = '#fff'; x.strokeStyle = '#33691e'; x.lineWidth = 2;
      x.beginPath(); x.arc(cx, cy, 5, 0, 7); x.fill(); x.stroke();
    } else if (p.t === 'dispenser') {
      const pts = [[-48, -46], [48, -46], [17, -2], [-17, -2]].map(([a, b]) => k.tp(a, b));
      x.fillStyle = 'rgba(93,109,126,.18)';
      x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); x.fill();
      const [lx, ly] = k.tp(0, -60);
      x.fillStyle = p.queue > 0 ? '#ff5a36' : '#5d6d7e';
      x.beginPath(); x.arc(lx, ly, 5 + (p.flash || 0) * 2, 0, 7); x.fill();
    } else if (p.t === 'elevator') {
      const a1 = k.tp(-38, 158), a2 = k.tp(38, 158), a3 = k.tp(38, 210), a4 = k.tp(-38, 210);
      x.fillStyle = '#546e7a';
      x.beginPath(); x.moveTo(...a1); x.lineTo(...a2); x.lineTo(...a3); x.lineTo(...a4); x.closePath(); x.fill();
      x.strokeStyle = 'rgba(120,144,156,.45)'; x.lineWidth = 3; x.setLineDash([5, 7]); x.lineDashOffset = -simTime * 75;
      const t1 = k.tp(-30, 200), t2 = k.tp(-30, -195); x.beginPath(); x.moveTo(...t1); x.lineTo(...t2); x.stroke();
      x.setLineDash([]); x.lineDashOffset = 0;
      const [gx, gy] = k.tp(0, 184);
      x.fillStyle = '#cfd8dc'; x.beginPath(); x.arc(gx, gy, 12, 0, 7); x.fill();
      x.strokeStyle = '#37474f'; x.lineWidth = 3; x.beginPath(); x.moveTo(gx, gy); x.lineTo(gx + Math.cos(simTime * 4) * 10, gy + Math.sin(simTime * 4) * 10); x.stroke();
    }
    x.globalAlpha = 1;
  }

  function drawPieceBodies(x, p, alpha = 1) {
    if (p.t === 'elevator') {
      drawBody(x, p.bodies[0], alpha);
      drawDeco(x, p, alpha);
      for (let i = 1; i < p.bodies.length; i++) drawBody(x, p.bodies[i], alpha);
      return;
    }
    if (p.t === 'bell') { drawDeco(x, p, alpha); return; }
    for (const b of p.bodies) drawBody(x, b, alpha);
    drawDeco(x, p, alpha);
  }

  function themeCols() {
    const dark = Curio.isDark();
    return dark ? { bg: '#161412', board: '#211e1b', dot: 'rgba(255,255,255,.07)', edge: '#3a352f', wall: '#3a352f' } : { bg: '#fbf7f0', board: '#fffdf8', dot: 'rgba(60,40,20,.08)', edge: '#e4dccf', wall: '#d8cdbb' };
  }

  let ghost = null;
  function draw() {
    const T = themeCols();
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = T.bg; g.fillRect(0, 0, cw, ch);
    g.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * ox, dpr * oy);
    g.fillStyle = T.board;
    g.beginPath(); g.roundRect(-8, -8, W + 16, H + 16, 22); g.fill();
    g.strokeStyle = T.edge; g.lineWidth = 2; g.stroke();
    g.fillStyle = T.dot;
    for (let y = 50; y < H; y += 50) for (let x = 50; x < W; x += 50) g.fillRect(x - 1.5, y - 1.5, 3, 3);
    for (const p of pieces) drawPieceBodies(g, p);
    if (sel) {
      g.save(); g.setLineDash([8, 6]); g.strokeStyle = '#ff5a36'; g.lineWidth = 2;
      const bb = bounds(sel);
      g.strokeRect(bb[0] - 8, bb[1] - 8, bb[2] - bb[0] + 16, bb[3] - bb[1] + 16);
      g.restore();
      const [hx, hy] = handlePos(sel);
      const [cx, cy] = [sel.x, sel.y];
      g.strokeStyle = 'rgba(255,90,54,.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx, cy); g.lineTo(hx, hy); g.stroke();
      g.fillStyle = '#ff5a36'; g.beginPath(); g.arc(hx, hy, 11, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.font = '700 14px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('↻', hx, hy + 1);
    }
    if (ghost) for (const b of ghost.bodies) drawBody(g, b, 0.4);
    for (const m of marbles) {
      const s = sprite(m.user.col);
      const sz = s.width / (dpr * scale);
      g.drawImage(s, m.x - sz / 2, m.y - sz / 2, sz, sz);
    }
    g.fillStyle = T.wall;
    g.fillRect(-8, H, W + 16, 8);
  }

  function bounds(p) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const b of p.bodies) { x0 = Math.min(x0, b.minX); y0 = Math.min(y0, b.minY); x1 = Math.max(x1, b.maxX); y1 = Math.max(y1, b.maxY); }
    if (p.t === 'bell') y0 = Math.min(y0, p.y - 30);
    return [x0, y0, x1, y1];
  }
  function handlePos(p) {
    const bb = bounds(p);
    const r = Math.max(bb[2] - bb[0], bb[3] - bb[1]) / 2 + 24;
    return [p.x + Math.cos(p.a) * r, p.y + Math.sin(p.a) * r];
  }

  function shapeDist(sh, x, y) {
    if (sh.type === 'c') return Math.hypot(x - sh.wx, y - sh.wy) - sh.r;
    if (P.shapeContains(sh, x, y)) return 0;
    let best = Infinity;
    const n = sh.n;
    for (let i = 0; i < n; i++) {
      if (n === 2 && i === 1) break;
      const j = (i + 1) % n;
      const [px, py] = P.segClosest(x, y, sh.wv[2 * i], sh.wv[2 * i + 1], sh.wv[2 * j], sh.wv[2 * j + 1]);
      best = Math.min(best, Math.hypot(x - px, y - py));
    }
    return best - sh.r;
  }
  function pick(x, y) {
    let best = null, bd = Math.max(10, 14 / scale);
    for (const p of pieces) {
      let d = Infinity;
      for (const b of p.bodies) for (const sh of b.shapes) d = Math.min(d, shapeDist(sh, x, y));
      if (p.t === 'bell') d = Math.min(d, Math.hypot(x - p.x, y - p.y) - 26);
      if (p.t === 'dispenser') { const [lx, ly] = p.bodies[0].localPoint(x, y); if (Math.abs(lx) < 40 && ly > -50 && ly < 10) d = 0; }
      if (p.t === 'elevator') { const [lx, ly] = p.bodies[0].localPoint(x, y); if (Math.abs(lx) < 46 && ly > -190 && ly < 210) d = Math.min(d, 2); }
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  }

  function updateSel() {
    if (!sel || !sel.bodies) { selBar.classList.remove('is-on'); return; }
    const bb = bounds(sel);
    selBar.classList.add('is-on');
    selBar.querySelector('[data-sel="note"]').hidden = sel.t !== 'xylo';
    const bw = selBar.offsetWidth || 200, bh = selBar.offsetHeight || 46;
    let left = ox + ((bb[0] + bb[2]) / 2) * scale - bw / 2;
    let top = oy + bb[1] * scale - bh - 14;
    if (top < 4) top = oy + bb[3] * scale + 14;
    left = Math.max(4, Math.min(cw - bw - 4, left)); top = Math.max(4, Math.min(ch - bh - 4, top));
    selBar.style.left = left + 'px'; selBar.style.top = top + 'px';
  }

  function commit() { save(); }
  function rotateSel(d) {
    if (!sel) return;
    pushHistory();
    sel.a = Math.round((sel.a + d) / (Math.PI / 24)) * (Math.PI / 24);
    ghostAngle[sel.t] = sel.a;
    rebuild(sel); updateSel(); commit();
  }
  function act(name) {
    if (!sel) return;
    if (name === 'ccw') rotateSel(-Math.PI / 12);
    else if (name === 'cw') rotateSel(Math.PI / 12);
    else if (name === 'flip') { pushHistory(); sel.f = sel.f ? 0 : 1; rebuild(sel); commit(); }
    else if (name === 'note') { pushHistory(); sel.n = ((sel.n || 0) + 1) % 8; SND.note(sel.n, 300); commit(); }
    else if (name === 'del') { pushHistory(); unbuild(sel); pieces.splice(pieces.indexOf(sel), 1); sel = null; commit(); }
    updateSel();
  }
  selBar.addEventListener('click', (e) => { const b = e.target.closest('[data-sel]'); if (b) { unlockAudio(); act(b.dataset.sel); } });

  let nextNote = 0;
  function makePiece(t, x, y) {
    const p = { t, x: Math.round(x / 5) * 5, y: Math.round(y / 5) * 5, a: ghostAngle[t] ?? CAT[t].a, queue: 0, cool: 0 };
    if (t === 'xylo') { p.n = nextNote; nextNote = (nextNote + 1) % 8; }
    return p;
  }
  function placePiece(t, x, y) {
    pushHistory();
    const p = makePiece(t, clampX(x), clampY(y));
    pieces.push(p); buildPiece(p);
    sel = p; updateSel(); commit();
    fadeIntro();
    return p;
  }
  const clampX = (x) => Math.max(10, Math.min(W - 10, x));
  const clampY = (y) => Math.max(10, Math.min(H - 10, y));

  function unlockAudio() { audioOk = true; }
  function fadeIntro() { if (!touched) { touched = true; intro.classList.add('is-faded'); } }

  let drag = null, keepSel = false;
  function canvasPos(e) { const r = canvas.getBoundingClientRect(); return toWorld(e.clientX - r.left, e.clientY - r.top); }
  const latched = () => canvas.classList.contains('curio-latched');
  canvas.addEventListener('pointerdown', (e) => {
    if (!Curio.touchpad || e.pointerType !== 'mouse' || latched() || armed || (e.button != null && e.button > 0)) return;
    const [x, y] = canvasPos(e);
    if (sel) { const [hx, hy] = handlePos(sel); if (Math.hypot(x - hx, y - hy) < Math.max(16, 20 / scale)) return; }
    if (pick(x, y)) return;
    e.stopImmediatePropagation();
    unlockAudio();
    sel = null; updateSel();
    dropMarble(x, y); fadeIntro();
  });
  Curio.drag(canvas, {
    start(q) {
      unlockAudio();
      const e = q.event;
      const [x, y] = toWorld(q.x, q.y);
      if (sel) {
        const [hx, hy] = handlePos(sel);
        if (Math.hypot(x - hx, y - hy) < Math.max(16, 20 / scale)) { pushHistory(); drag = { mode: 'rot', moved: false }; return; }
      }
      if (armed === 'marble') { dropMarble(x, y); drag = { mode: 'spray', t: 0, x, y }; fadeIntro(); return; }
      const hit = pick(x, y);
      if (hit) {
        sel = hit; updateSel();
        drag = { mode: 'move', dx: x - hit.x, dy: y - hit.y, snap: snapshot(), moved: false };
        return;
      }
      if (armed && CAT[armed]) {
        const p = placePiece(armed, x, y);
        drag = { mode: 'move', dx: x - p.x, dy: y - p.y, snap: null, moved: false };
        return;
      }
      sel = null; updateSel();
      drag = { mode: 'pan', sx: e.clientX, ox, moved: false, x, y };
    },
    move(q) {
      const [x, y] = toWorld(q.x, q.y);
      hover = [x, y];
      if (!drag) return;
      if (q.event.target !== canvas && q.event.target.closest?.('.mr-sel, .mr-tools')) return;
      if (drag.mode === 'move' && sel) {
        const nx = Math.round(clampX(x - drag.dx) / 5) * 5, ny = Math.round(clampY(y - drag.dy) / 5) * 5;
        if (nx !== sel.x || ny !== sel.y) { sel.x = nx; sel.y = ny; drag.moved = true; rebuild(sel); updateSel(); }
      } else if (drag.mode === 'rot' && sel) {
        const a = Math.round(Math.atan2(y - sel.y, x - sel.x) / (Math.PI / 24)) * (Math.PI / 24);
        if (a !== sel.a) { sel.a = a; ghostAngle[sel.t] = a; drag.moved = true; rebuild(sel); updateSel(); }
      } else if (drag.mode === 'spray') { drag.x = x; drag.y = y; }
      else if (drag.mode === 'pan') {
        if (Math.abs(q.clientX - drag.sx) > 6) drag.moved = true;
        if (drag.moved && panRange) { setPan(drag.ox + q.clientX - drag.sx); updateSel(); }
      }
    },
    end() {
      if (!drag) return;
      if (drag.mode === 'move' && drag.moved && drag.snap) { history.push(drag.snap); }
      if (drag.mode === 'move' || drag.mode === 'rot') commit();
      if (drag.mode === 'rot' && !drag.moved) history.pop();
      if (drag.mode === 'pan' && !drag.moved) { dropMarble(drag.x, drag.y); fadeIntro(); if (panRange && !panHinted) { panHinted = true; Curio.toast('Tip: drag empty space or two-finger scroll to slide the board'); } }
      drag = null;
    }
  });
  canvas.addEventListener('pointermove', (e) => { if (!drag) { const [x, y] = canvasPos(e); hover = [x, y]; } });
  selBar.addEventListener('pointerdown', () => { if (latched()) { keepSel = true; window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); keepSel = false; } });
  canvas.addEventListener('pointerleave', () => { if (!drag) hover = null; });
  let wheelAcc = 0;
  canvas.addEventListener('wheel', (e) => {
    if (e.ctrlKey) { e.preventDefault(); return; }
    if (sel && Math.abs(e.deltaY) >= Math.abs(e.deltaX)) {
      e.preventDefault();
      wheelAcc += e.deltaMode ? e.deltaY * 40 : e.deltaY;
      if (Math.abs(wheelAcc) >= 40) { rotateSel((wheelAcc > 0 ? 1 : -1) * Math.PI / 24); wheelAcc = 0; }
      return;
    }
    if (panRange && Math.abs(e.deltaX) > Math.abs(e.deltaY)) { e.preventDefault(); setPan(ox - e.deltaX); updateSel(); }
  }, { passive: false });

  function dropMarble(x, y) {
    if (y < 0 || y > H || x < 0 || x > W) return;
    if (!spaceFree(x, y, MR * 1.6)) return;
    for (const p of pieces) for (const b of p.bodies) for (const sh of b.shapes) if (shapeDist(sh, x, y) < MR) return;
    addMarble(x, y);
    SND.pop();
  }

  const palette = document.getElementById('palette');
  const TOOLS = [['select', '👆', 'Move'], ['marble', '🔮', 'Marble'], ...Object.keys(CAT).map((t) => [t, null, CAT[t].label])];
  for (const [t, emo, label] of TOOLS) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'mr-pc'; b.dataset.tool = t; b.setAttribute('aria-pressed', 'false');
    const ki = TOOLS.findIndex((x) => x[0] === t), key = ki < 9 ? String(ki + 1) : ki === 9 ? '0' : '';
    b.title = (t === 'select' ? 'Select and move pieces' : t === 'marble' ? 'Tap or hold on the board to drop marbles' : `${label}: drag onto the board, or tap then tap the board`) + (key ? ` (${key})` : '');
    if (emo) { const s = document.createElement('span'); s.className = 'mr-emo'; s.textContent = emo; b.append(s); }
    else { const c = document.createElement('canvas'); c.width = 104; c.height = 68; b.append(c); }
    const l = document.createElement('span'); l.textContent = label; b.append(l);
    palette.append(b);
  }
  function setArmed(t) {
    armed = t === 'select' ? null : t;
    for (const b of palette.children) b.setAttribute('aria-pressed', String((b.dataset.tool === 'select' && !armed) || b.dataset.tool === armed));
    canvas.style.cursor = armed === 'marble' ? 'crosshair' : armed ? 'copy' : 'default';
  }
  setArmed('select');

  function scratchBuild(t, x, y, a, f) {
    const real = world;
    world = new P.World();
    const p = { t, x, y, a, f, n: t === 'xylo' ? nextNote : undefined, queue: 0, cool: 0 };
    p.bodies = CAT[t].build(p, kit(p));
    if (CAT[t].tick) CAT[t].tick(p, p.bodies, 0, STEP);
    world = real;
    return p;
  }
  function paletteIcons() {
    for (const b of palette.querySelectorAll('canvas')) {
      const t = b.parentElement.dataset.tool;
      const p = scratchBuild(t, 0, 0, CAT[t].a, 0);
      const bb = bounds(p);
      if (t === 'bell') bb[1] = -30;
      const x = b.getContext('2d');
      x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, b.width, b.height);
      const s = Math.min((b.width - 10) / (bb[2] - bb[0]), (b.height - 10) / (bb[3] - bb[1]));
      x.setTransform(s, 0, 0, s, b.width / 2 - s * (bb[0] + bb[2]) / 2, b.height / 2 - s * (bb[1] + bb[3]) / 2);
      drawPieceBodies(x, p);
    }
  }

  let pdrag = null;
  palette.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('.mr-pc'); if (!b) return;
    unlockAudio();
    pdrag = { tool: b.dataset.tool, id: e.pointerId, sx: e.clientX, sy: e.clientY, piece: null, btn: b };
  });
  window.addEventListener('pointermove', (e) => {
    if (!pdrag || e.pointerId !== pdrag.id) return;
    if (!CAT[pdrag.tool]) return;
    const r = canvas.getBoundingClientRect();
    const inside = e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom;
    if (!pdrag.piece && Math.hypot(e.clientX - pdrag.sx, e.clientY - pdrag.sy) > 12 && inside) {
      const [x, y] = toWorld(e.clientX - r.left, e.clientY - r.top);
      pdrag.piece = placePiece(pdrag.tool, x, y);
    } else if (pdrag.piece) {
      const [x, y] = toWorld(e.clientX - r.left, e.clientY - r.top);
      pdrag.piece.x = Math.round(clampX(x) / 5) * 5; pdrag.piece.y = Math.round(clampY(y) / 5) * 5;
      rebuild(pdrag.piece); updateSel();
    }
  });
  window.addEventListener('pointerup', (e) => {
    if (!pdrag || e.pointerId !== pdrag.id) return;
    const r = canvas.getBoundingClientRect();
    const inside = e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom;
    if (pdrag.piece) {
      if (!inside) { unbuild(pdrag.piece); pieces.splice(pieces.indexOf(pdrag.piece), 1); history.pop(); sel = null; updateSel(); }
      commit();
    } else if (Math.hypot(e.clientX - pdrag.sx, e.clientY - pdrag.sy) < 12) {
      setArmed(armed === pdrag.tool && pdrag.tool !== 'select' ? 'select' : pdrag.tool);
      if (CAT[pdrag.tool]) Curio.toast(`Tap the board to place a ${CAT[pdrag.tool].label.toLowerCase()}`);
    }
    pdrag = null;
  });
  window.addEventListener('pointercancel', () => { pdrag = null; });

  const presetSel = document.getElementById('preset');
  for (const [k, v] of Object.entries(PRESETS)) { const o = document.createElement('option'); o.value = k; o.textContent = v.label; presetSel.append(o); }
  presetSel.addEventListener('change', () => {
    const v = presetSel.value; presetSel.value = '';
    if (!PRESETS[v]) return;
    pushHistory(); clearMarbles(); loadPieces(PRESETS[v].pieces); commit(); fadeIntro();
    Curio.toast(`${PRESETS[v].label} loaded. Hit Release!`);
  });

  function clearMarbles() { for (const m of marbles) world.remove(m); marbles = []; for (const p of pieces) p.queue = 0; }
  function release() {
    unlockAudio(); fadeIntro();
    const ds = pieces.filter((p) => p.t === 'dispenser');
    if (!ds.length) {
      for (let i = 0; i < 24; i++) addMarble(80 + (i % 12) * 70 + Curio.rand(-5, 5), 20 + Math.floor(i / 12) * 24);
      Curio.toast('No dispenser, so it rained marbles. Add a dispenser for a tidy queue.');
      return;
    }
    for (const p of ds) p.queue += 30;
    if (paused) togglePause();
  }
  function togglePause() {
    paused = !paused;
    const b = document.getElementById('pause');
    b.setAttribute('aria-pressed', String(paused)); b.textContent = paused ? '▶ Play' : '⏸ Pause';
    document.getElementById('pausedTag').classList.toggle('is-on', paused);
  }
  function undo() {
    if (!history.length) { Curio.toast('Nothing to undo'); return; }
    const s = history.pop();
    loadPieces(JSON.parse(s)); commit();
  }
  document.getElementById('release').addEventListener('click', release);
  document.getElementById('pause').addEventListener('click', togglePause);
  document.getElementById('undo').addEventListener('click', undo);
  document.getElementById('clearM').addEventListener('click', clearMarbles);
  document.getElementById('reset').addEventListener('click', () => { if (!pieces.length) return; pushHistory(); clearMarbles(); loadPieces([]); commit(); Curio.toast('Fresh board. Undo brings it back.'); });

  window.addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('select')) return;
    unlockAudio();
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); undo(); return; }
    if (k === ' ') { e.preventDefault(); togglePause(); }
    else if (k === 'q' || k === '[') rotateSel(-Math.PI / 12);
    else if (k === 'e' || k === ']') rotateSel(Math.PI / 12);
    else if (k === 'f') act('flip');
    else if (k === 'n') act('note');
    else if (k === 'delete' || k === 'backspace') { if (sel) { e.preventDefault(); act('del'); } }
    else if (k === 'escape') { if (keepSel) return; sel = null; setArmed('select'); updateSel(); }
    else if (k === 'r') release();
    else if (k === 'm') setArmed('marble');
    else if (k === 'c') clearMarbles();
    else if (/^[0-9]$/.test(k) && !e.ctrlKey && !e.metaKey && !e.altKey) { const t = TOOLS[k === '0' ? 9 : +k - 1]; if (t) setArmed(armed === t[0] ? 'select' : t[0]); }
    else if (k === 'v') setArmed('select');
    else if (sel && k.startsWith('arrow')) {
      e.preventDefault(); pushHistory();
      const d = e.shiftKey ? 25 : 5;
      if (k === 'arrowleft') sel.x -= d; if (k === 'arrowright') sel.x += d; if (k === 'arrowup') sel.y -= d; if (k === 'arrowdown') sel.y += d;
      sel.x = clampX(sel.x); sel.y = clampY(sel.y); rebuild(sel); updateSel(); commit();
    }
  });

  let last = 0, acc = 0, raf = 0, sprayT = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    budget = 7;
    if (!paused) {
      acc += dt;
      let n = 0;
      while (acc >= STEP && n < 3) {
        preStep(STEP);
        world.step(STEP);
        simTime += STEP;
        handleEvents();
        acc -= STEP; n++;
      }
      if (n === 3) acc = 0;
      cleanupMarbles();
      for (const p of pieces) { if (p.flash) p.flash = Math.max(0, p.flash - dt * 4); if (p.swing) p.swing *= Math.pow(0.08, dt); }
    }
    if (drag && drag.mode === 'spray') { sprayT += dt; if (sprayT > 0.07) { sprayT = 0; dropMarble(drag.x + Curio.rand(-3, 3), drag.y); } }
    ghost = null;
    if (hover && armed && CAT[armed] && !drag && !pdrag) {
      ghost = scratchBuild(armed, Math.round(hover[0] / 5) * 5, Math.round(hover[1] / 5) * 5, ghostAngle[armed] ?? CAT[armed].a, 0);
    }
    draw();
    nMarbles.textContent = marbles.length;
  }
  function start() { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } }
  function stop() { cancelAnimationFrame(raf); raf = 0; }
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  window.addEventListener('resize', fit);
  window.addEventListener('curio:theme', () => { sprites = {}; });
  window.MarbleRun = { get world() { return world; }, get pieces() { return pieces; }, get marbles() { return marbles; }, release, loadPreset: (k) => { clearMarbles(); loadPieces(PRESETS[k].pieces); } };

  newWorld();
  const saved = Curio.store.get(KEY, null);
  loadPieces(Array.isArray(saved) && saved.length ? saved : PRESETS.scale.pieces);
  fit();
  start();
  if (!Curio.touchpad && matchMedia('(pointer: fine)').matches && !Curio.store.get('tp-hint-marble-run', false)) { Curio.store.set('tp-hint-marble-run', true); setTimeout(() => Curio.toast('Tip: on a laptop touchpad, turn on Touchpad mode in the top bar: click a piece to pick it up, click again to drop it', 4200), 1800); }
})();
