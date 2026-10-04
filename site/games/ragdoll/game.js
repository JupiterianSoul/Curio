(() => {
  const V = window.Verlet;
  const H = 720, STEP = 1 / 60, G = 1500, KEY = 'ragdoll:scene';
  const SHIRTS = ['#ff5a5a', '#ff9f43', '#ffd23f', '#5ad66f', '#36c5d9', '#4f8cff', '#9b6bff', '#ff6fb5', '#2ec4a6'];
  const PANTS = ['#2d3a6b', '#3d2f5b', '#30525e', '#4a3b2a', '#283845', '#5b2d3a'];
  const SKIN = ['#ffd9b8', '#f2c094', '#d9a06b', '#b87a4b', '#8d5a36', '#ffe3c9'];
  const HAIR = ['#2b1d14', '#5a3a1e', '#e0b44c', '#c2552d', '#1d1b19', '#7a7a7a', '#ff6fb5', '#4f8cff'];

  const canvas = document.getElementById('room');
  const g = canvas.getContext('2d');
  const stage = document.getElementById('stage');
  const intro = document.getElementById('intro');
  const tagEl = document.getElementById('tag');
  let W = 1200, world, objs = [], tool = 'grab', paused = false, slow = false, ouches = 0, gname = 'down';
  let scale = 1, ox = 0, oy = 0, dpr = 1, cw = 0, ch = 0, shake = 0, simTime = 0, audioOk = false, touched = false;
  let grabbed = null, spawnStack = [];

  let ac = null, master = null, budget = 0;
  function audio() {
    if (Curio.muted || !audioOk) return null;
    ac = Curio.audioContext(); if (!ac) return null;
    if (!master) { master = ac.createDynamicsCompressor(); master.connect(ac.destination); }
    return ac;
  }
  function tone(freq, dur, type, vol, glide, delay = 0, glide2) {
    const a = audio(); if (!a || budget <= 0) return;
    budget--;
    const t = a.currentTime + delay;
    const o = a.createOscillator(), gn = a.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + dur * (glide2 ? 0.35 : 1));
    if (glide2) o.frequency.exponentialRampToValueAtTime(glide2, t + dur);
    gn.gain.setValueAtTime(0.0001, t); gn.gain.linearRampToValueAtTime(vol, t + 0.01); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(gn).connect(master); o.start(t); o.stop(t + dur + 0.03);
  }
  const pf = () => (slow ? 0.55 : 1);
  const SND = {
    ouch: (d, v) => {
      const base = d.voice * pf() * Curio.rand(0.92, 1.08), vol = Math.min(0.16, 0.07 + v / 20000);
      if (Math.random() < 0.5) { tone(base, 0.2, 'sine', vol, base * 1.5, 0, base * 0.8); tone(base * 2, 0.12, 'sine', vol * 0.25, base * 3); }
      else { tone(base * 1.2, 0.09, 'triangle', vol * 0.8, base * 1.6); tone(base * 1.5, 0.16, 'sine', vol, base * 1.1, 0.08); }
    },
    thud: (v) => tone(Curio.rand(90, 130) * pf(), 0.14, 'sine', Math.min(0.22, v / 6000)),
    wood: (v) => { tone(Curio.rand(180, 240) * pf(), 0.08, 'triangle', Math.min(0.16, v / 7000)); tone(Curio.rand(500, 700) * pf(), 0.04, 'square', Math.min(0.03, v / 30000)); },
    ball: (v) => tone(Curio.rand(220, 260) * pf(), 0.18, 'sine', Math.min(0.18, v / 6000), 330 * pf()),
    boing: () => tone(150 * pf(), 0.35, 'sine', 0.18, 520 * pf()),
    pop: () => tone(500, 0.08, 'sine', 0.08, 900),
    whoosh: () => tone(200, 0.3, 'sawtooth', 0.03, 60)
  };

  function newWorld() { world = new V.VWorld(W, H); setGravity(gname, true); }

  function makeDoll(x, y, data) {
    const o = { k: 'doll', shirt: Curio.pick(SHIRTS), pants: Curio.pick(PANTS), skin: Curio.pick(SKIN), hair: Curio.pick(HAIR), voice: Curio.rand(650, 1250), hurt: 0, cool: 0, blink: Curio.rand(1, 4), style: Curio.randInt(0, 2), ...(data && data.look) };
    const P = [[0, -130, 17, 1.0], [0, -104, 8, 1.3], [0, -58, 11, 1.6], [-9, -82, 6, 0.6], [-12, -58, 7, 0.5], [9, -82, 6, 0.6], [12, -58, 7, 0.5], [-7, -32, 7, 0.9], [-8, -6, 8, 0.8], [7, -32, 7, 0.9], [8, -6, 8, 0.8]];
    o.p = P.map(([dx, dy, r, m], i) => {
      const q = data && data.pts && data.pts[i];
      const pt = world.point(q ? q[0] : x + dx, q ? q[1] : y + dy, r, m, { owner: o, fr: 0.5, e: 0.25 });
      return pt;
    });
    const [head, neck, pelvis, le, lh, re, rh, lk, lf, rk, rf] = o.p;
    world.stick(head, neck, { len: 26 });
    world.stick(neck, pelvis, { len: 46, r: 10 });
    world.stick(head, pelvis, { len: 72, k: 0.6 });
    world.stick(neck, le, { len: 24, r: 5 }); world.stick(le, lh, { len: 24, r: 5 });
    world.stick(neck, re, { len: 24, r: 5 }); world.stick(re, rh, { len: 24, r: 5 });
    world.stick(pelvis, lk, { len: 27, r: 6 }); world.stick(lk, lf, { len: 26, r: 6 });
    world.stick(pelvis, rk, { len: 27, r: 6 }); world.stick(rk, rf, { len: 26, r: 6 });
    world.angle(pelvis, neck, head, -0.7, 0.7, 0.5);
    world.angle(neck, le, lh, -2.6, 0.05); world.angle(neck, re, rh, -2.6, 0.05);
    world.angle(pelvis, lk, lf, -0.05, 2.5); world.angle(pelvis, rk, rf, -0.05, 2.5);
    world.angle(neck, pelvis, lk, -1.9, 1.0); world.angle(neck, pelvis, rk, -1.9, 1.0);
    objs.push(o);
    return o;
  }
  function makeCrate(x, y, s = 62, data) {
    const o = { k: 'crate', s, tint: Curio.rand(-0.06, 0.06) };
    const c = [[-s / 2, -s / 2], [s / 2, -s / 2], [s / 2, s / 2], [-s / 2, s / 2]];
    o.p = c.map(([dx, dy], i) => { const q = data && data.pts && data.pts[i]; return world.point(q ? q[0] : x + dx, q ? q[1] : y + dy, 2, 1.2, { owner: o, fr: 0.6, e: 0.1 }); });
    const [a, b, cc, d] = o.p;
    for (const [u, v] of [[a, b], [b, cc], [cc, d], [d, a], [a, cc], [b, d]]) world.stick(u, v, { owner: o });
    world.poly([a, b, cc, d], o);
    objs.push(o);
    return o;
  }
  function makeBall(x, y, data) {
    const o = { k: 'ball', rot: 0, hue: Curio.randInt(0, 3) };
    const q = data && data.pts && data.pts[0];
    o.p = [world.point(q ? q[0] : x, q ? q[1] : y, 30, 0.5, { owner: o, fr: 0.15, e: 0.82 })];
    objs.push(o);
    return o;
  }
  function makePad(x, y, data) {
    const nx = data ? data.nx : -world.gx / G || 0, ny = data ? data.ny : -world.gy / G || 0;
    const horiz = Math.abs(ny) >= Math.abs(nx);
    const w = horiz ? 120 : 22, h = horiz ? 22 : 120;
    const pad = data ? { ...data } : { x: x - w / 2, y: y - h / 2, w, h, nx: horiz ? 0 : Math.sign(nx), ny: horiz ? (Math.sign(ny) || -1) : 0, launch: 1350 };
    if (!data) {
      if (horiz) pad.y = pad.ny < 0 ? Math.min(H - h, pad.y) : Math.max(0, pad.y);
      pad.x = Math.max(0, Math.min(W - pad.w, pad.x)); pad.y = Math.max(0, Math.min(H - pad.h, pad.y));
    }
    pad.flash = 0;
    const o = { k: 'pad', pad, p: [] };
    world.pads.push(pad);
    objs.push(o);
    return o;
  }
  function removeObj(o) {
    world.removeOwner(o);
    if (o.k === 'pad') world.pads.splice(world.pads.indexOf(o.pad), 1);
    objs.splice(objs.indexOf(o), 1);
  }

  function defaultScene() {
    newWorld(); objs = [];
    const m = W / 2;
    makeDoll(m - 220, H - 10); makeDoll(m + 40, H - 300); makeDoll(m + 260, H - 10);
    makeCrate(m - 60, H - 31); makeCrate(m - 60, H - 95, 56); makeCrate(m + 380, H - 31);
    makeBall(m + 160, H - 240);
    makePad(m - 420, H - 11);
  }
  function serialize() {
    return { W, g: gname, objs: objs.map((o) => o.k === 'pad' ? { k: 'pad', pad: { ...o.pad, flash: 0 } } : { k: o.k, s: o.s, look: o.k === 'doll' ? { shirt: o.shirt, pants: o.pants, skin: o.skin, hair: o.hair, voice: o.voice, style: o.style } : undefined, pts: o.p.map((p) => [Math.round(p.x), Math.round(p.y)]) }) };
  }
  function restore(sc) {
    newWorld(); objs = [];
    const sx = W / (sc.W || W);
    for (const r of sc.objs || []) {
      const pts = r.pts && r.pts.map(([x, y]) => [x * sx, Math.min(H - 5, y)]);
      if (r.k === 'doll') makeDoll(0, 0, { pts, look: r.look });
      else if (r.k === 'crate') makeCrate(0, 0, r.s || 62, { pts });
      else if (r.k === 'ball') makeBall(0, 0, { pts });
      else if (r.k === 'pad') makePad(0, 0, { ...r.pad, x: Math.min(W - r.pad.w, r.pad.x * sx) });
    }
    if (sc.g) setGravity(sc.g, true);
  }
  function save() { try { Curio.store.set(KEY, serialize()); } catch {} }

  function fit() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = stage.getBoundingClientRect();
    cw = r.width; ch = r.height;
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    const top = cw < 560 ? 64 : 8;
    const availH = ch - top - 6;
    let newW = Math.max(560, Math.min(1800, (cw - 12) / availH * H));
    scale = Math.min((cw - 12) / newW, availH / H);
    ox = (cw - newW * scale) / 2; oy = top + (availH - H * scale) / 2;
    if (world && Math.abs(newW - W) > 1) {
      for (const p of world.pts) { if (p.x > newW - p.r) { const d = p.x - (newW - p.r - Curio.rand(0, 40)); p.x -= d; p.px -= d; } }
      for (const pd of world.pads) pd.x = Math.min(newW - pd.w, pd.x);
    }
    W = newW;
    if (world) world.W = W;
  }
  const toWorld = (cx, cy) => [(cx - ox) / scale, (cy - oy) / scale];

  function setGravity(n, quiet) {
    gname = n;
    const v = { down: [0, G], up: [0, -G], left: [-G, 0], right: [G, 0], zero: [0, 0] }[n];
    world.gx = v[0]; world.gy = v[1];
    world.damp = n === 'zero' ? 0.998 : 0.9995;
    for (const b of document.querySelectorAll('[data-g]')) b.setAttribute('aria-pressed', String(b.dataset.g === n));
    if (!quiet) { SND.whoosh(); for (const o of objs) if (o.k === 'doll') o.hurt = Math.max(o.hurt, 0.2); }
  }

  function theme() {
    return Curio.isDark()
      ? { bg: '#121418', wall: '#23272f', stripe: 'rgba(255,255,255,.03)', floor: '#5b4330', floorTop: '#2f5fa8', base: '#0b0c0e', ink: '#f3eee7', shadow: 'rgba(0,0,0,.4)', mark: 'rgba(255,255,255,.35)' }
      : { bg: '#e9ebee', wall: '#f6f7f9', stripe: 'rgba(40,60,90,.05)', floor: '#d9a066', floorTop: '#3d78d6', base: '#1f2329', ink: '#1d1b19', shadow: 'rgba(20,30,50,.18)', mark: 'rgba(30,35,45,.45)' };
  }

  function limb(a, b, w, col) { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); }
  function shadeCol(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const f = (c) => Math.max(0, Math.min(255, Math.round(c * (1 + k))));
    return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
  }

  function drawDoll(o) {
    const [head, neck, pelvis, le, lh, re, rh, lk, lf, rk, rf] = o.p;
    g.lineCap = 'round'; g.lineJoin = 'round';
    const back = shadeCol(o.pants, -0.25), backSkin = shadeCol(o.skin, -0.15), backShirt = shadeCol(o.shirt, -0.2);
    limb(pelvis, lk, 14, back); limb(lk, lf, 12, back);
    g.fillStyle = '#2b2b33'; g.beginPath(); g.arc(lf.x, lf.y, 8, 0, 7); g.fill();
    limb(neck, le, 12, backShirt); limb(le, lh, 10, backSkin);
    g.fillStyle = backSkin; g.beginPath(); g.arc(lh.x, lh.y, 6.5, 0, 7); g.fill();
    limb(neck, pelvis, 26, o.shirt);
    const mx = (neck.x + pelvis.x) / 2, my = (neck.y + pelvis.y) / 2;
    if (o.style === 1) { g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 4; g.beginPath(); g.moveTo(neck.x * 0.7 + pelvis.x * 0.3, neck.y * 0.7 + pelvis.y * 0.3); g.lineTo(mx, my); g.stroke(); }
    else if (o.style === 2) { g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.arc(mx, my, 4.5, 0, 7); g.fill(); }
    limb(pelvis, { x: pelvis.x + (neck.x - pelvis.x) * 0.12, y: pelvis.y + (neck.y - pelvis.y) * 0.12 }, 24, o.pants);
    limb(pelvis, rk, 14, o.pants); limb(rk, rf, 12, o.pants);
    g.fillStyle = '#33333d'; g.beginPath(); g.arc(rf.x, rf.y, 8, 0, 7); g.fill();
    limb(neck, re, 12, o.shirt); limb(re, rh, 10, o.skin);
    g.fillStyle = o.skin; g.beginPath(); g.arc(rh.x, rh.y, 6.5, 0, 7); g.fill();
    const ux = head.x - neck.x, uy = head.y - neck.y, ul = Math.hypot(ux, uy) || 1;
    const ang = Math.atan2(uy, ux) + Math.PI / 2;
    g.save(); g.translate(head.x, head.y); g.rotate(ang);
    g.fillStyle = o.skin; g.beginPath(); g.arc(0, 0, 18, 0, 7); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = 1.5; g.stroke();
    g.fillStyle = o.hair; g.beginPath(); g.arc(0, 0, 18.5, Math.PI * 1.05, Math.PI * 1.95); g.closePath(); g.fill();
    if (o.style === 0) { g.beginPath(); g.arc(9, -15, 6, 0, 7); g.fill(); }
    const hurt = o.hurt > 0.05;
    g.strokeStyle = '#1d1b19'; g.fillStyle = '#1d1b19'; g.lineWidth = 2.2; g.lineCap = 'round';
    if (hurt) {
      for (const sx of [-6, 6]) { g.beginPath(); g.moveTo(sx - 3, -2); g.lineTo(sx + 3, 2); g.moveTo(sx + 3, -2); g.lineTo(sx - 3, 2); g.stroke(); }
      g.beginPath(); g.ellipse(0, 8, 3.5, 4.5, 0, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,90,90,.35)'; g.beginPath(); g.arc(-11, 5, 3.5, 0, 7); g.arc(11, 5, 3.5, 0, 7); g.fill();
    } else {
      const blink = (simTime + o.blink) % 4 < 0.12;
      for (const sx of [-6, 6]) { if (blink) { g.beginPath(); g.moveTo(sx - 2.5, 0); g.lineTo(sx + 2.5, 0); g.stroke(); } else { g.beginPath(); g.arc(sx, 0, 2.4, 0, 7); g.fill(); } }
      g.beginPath(); g.arc(0, 5, 5, 0.25, Math.PI - 0.25); g.stroke();
    }
    g.restore();
    if (o.hurt > 0.4) {
      g.save(); g.globalAlpha = Math.min(1, o.hurt); g.fillStyle = '#ffd23f';
      for (let i = 0; i < 3; i++) { const a = simTime * 6 + i * 2.1; star(head.x + Math.cos(a) * 24 + ux / ul * 10, head.y + Math.sin(a) * 9 + uy / ul * 10, 5); }
      g.restore();
    }
  }
  function star(x, y, r) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); }

  function drawCrate(o) {
    const [a, b, c, d] = o.p;
    g.fillStyle = shadeCol('#d9a35b', o.tint); g.strokeStyle = '#8a5a26'; g.lineWidth = 3.5; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.lineTo(c.x, c.y); g.lineTo(d.x, d.y); g.closePath(); g.fill(); g.stroke();
    const lerp = (p, q, t) => [p.x + (q.x - p.x) * t, p.y + (q.y - p.y) * t];
    g.lineWidth = 2.5; g.beginPath();
    let [x1, y1] = lerp(a, d, 0.15), [x2, y2] = lerp(b, c, 0.15); g.moveTo(x1, y1); g.lineTo(x2, y2);
    [x1, y1] = lerp(a, d, 0.85); [x2, y2] = lerp(b, c, 0.85); g.moveTo(x1, y1); g.lineTo(x2, y2);
    [x1, y1] = lerp(a, d, 0.15); [x2, y2] = lerp(b, c, 0.85); g.moveTo(x1, y1); g.lineTo(x2, y2);
    g.stroke();
  }
  const BALLC = [['#ff5a5a', '#ffd23f', '#4f8cff'], ['#5ad66f', '#ffffff', '#ff6fb5'], ['#36c5d9', '#ffd23f', '#ff9f43'], ['#9b6bff', '#ffffff', '#5ad66f']];
  function drawBall(o) {
    const p = o.p[0], cols = BALLC[o.hue];
    g.save(); g.translate(p.x, p.y); g.rotate(o.rot);
    for (let i = 0; i < 6; i++) { g.fillStyle = cols[i % 3]; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 30, i * Math.PI / 3, (i + 1) * Math.PI / 3); g.closePath(); g.fill(); }
    g.fillStyle = '#fff'; g.beginPath(); g.arc(0, 0, 6, 0, 7); g.fill();
    g.restore();
    g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(p.x - 10, p.y - 12, 9, 5, -0.6, 0, 7); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.2)'; g.lineWidth = 2; g.beginPath(); g.arc(p.x, p.y, 30, 0, 7); g.stroke();
  }
  function drawPad(o) {
    const pd = o.pad, f = pd.flash || 0;
    const sq = f * 6;
    g.fillStyle = '#37474f';
    g.beginPath(); g.roundRect(pd.x, pd.y, pd.w, pd.h, 6); g.fill();
    g.fillStyle = f > 0.05 ? '#a6ff8f' : '#5ad66f';
    const inset = 4;
    if (pd.ny) { const y = pd.ny < 0 ? pd.y - 6 + sq : pd.y + pd.h - 4 - sq; g.beginPath(); g.roundRect(pd.x + inset, y, pd.w - inset * 2, 10, 5); g.fill(); }
    else { const x = pd.nx < 0 ? pd.x - 6 + sq : pd.x + pd.w - 4 - sq; g.beginPath(); g.roundRect(x, pd.y + inset, 10, pd.h - inset * 2, 5); g.fill(); }
    g.fillStyle = 'rgba(255,255,255,.8)'; g.font = '800 11px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (pd.ny) g.fillText('BOING', pd.x + pd.w / 2, pd.y + pd.h / 2 + (pd.ny < 0 ? 2 : -2));
  }

  function draw() {
    const T = theme();
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = T.bg; g.fillRect(0, 0, cw, ch);
    const sx = shake ? Curio.rand(-1, 1) * shake * 10 : 0, sy = shake ? Curio.rand(-1, 1) * shake * 10 : 0;
    g.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * (ox + sx), dpr * (oy + sy));
    g.fillStyle = T.wall; g.beginPath(); g.roundRect(0, 0, W, H, 18); g.fill();
    g.save(); g.beginPath(); g.roundRect(0, 0, W, H, 18); g.clip();
    g.fillStyle = T.stripe;
    for (let x = 0; x < W; x += 80) g.fillRect(x, 0, 40, H);
    g.fillStyle = T.floorTop; g.fillRect(0, H - 4, W, 4);
    g.fillStyle = T.mark; g.strokeStyle = T.mark; g.lineWidth = 2; g.font = '700 12px ui-monospace, monospace';
    for (let y = H, m = 0; y > 40; y -= 120, m++) { g.fillRect(8, y - 1, m ? 26 : 14, 2); for (let k = 1; k < 4; k++) g.fillRect(8, y - k * 30, 10, 1.5); if (m) g.fillText(`${m} m`, 38, y + 4); }
    for (let x = W - 160; x < W; x += 18) { g.fillStyle = (x / 18) % 2 < 1 ? '#ffcf1a' : '#111'; g.beginPath(); g.moveTo(x, H - 4); g.lineTo(x + 9, H - 4); g.lineTo(x + 18, H - 22); g.lineTo(x + 9, H - 22); g.fill(); }
    g.fillStyle = T.shadow;
    for (const o of objs) {
      if (o.k === 'pad') continue;
      let x0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const p of o.p) { x0 = Math.min(x0, p.x - p.r); x1 = Math.max(x1, p.x + p.r); y1 = Math.max(y1, p.y + p.r); }
      if (gname !== 'down') continue;
      const hgt = H - y1, a = Math.max(0, 1 - hgt / 500);
      if (a <= 0) continue;
      g.globalAlpha = a; g.beginPath(); g.ellipse((x0 + x1) / 2, H - 3, (x1 - x0) / 2 * (0.6 + a * 0.4), 5, 0, 0, 7); g.fill();
    }
    g.globalAlpha = 1;
    for (const o of objs) if (o.k === 'pad') drawPad(o);
    for (const o of objs) if (o.k === 'crate') drawCrate(o);
    for (const o of objs) if (o.k === 'ball') drawBall(o);
    for (const o of objs) if (o.k === 'doll') drawDoll(o);
    if (grabbed) {
      g.strokeStyle = 'rgba(255,90,54,.55)'; g.lineWidth = 3; g.setLineDash([5, 6]);
      g.beginPath(); g.moveTo(grabbed.p.x, grabbed.p.y); g.lineTo(grabbed.p.grab.x, grabbed.p.grab.y); g.stroke(); g.setLineDash([]);
      g.fillStyle = '#ff5a36'; g.beginPath(); g.arc(grabbed.p.grab.x, grabbed.p.grab.y, 6, 0, 7); g.fill();
    }
    g.restore();
    g.strokeStyle = T.base; g.lineWidth = 3; g.beginPath(); g.roundRect(0, 0, W, H, 18); g.stroke();
  }

  function handleEvents() {
    for (const e of world.events) {
      const o = e.p.owner;
      if (e.pad) { if (!e.pad.cool || simTime - e.pad.cool > 0.15) { e.pad.cool = simTime; SND.boing(); if (touched) rec.pads++; } if (o && o.k === 'doll') { o.hurt = Math.max(o.hurt, 0.5); } continue; }
      if (!o) continue;
      if (grabbed && grabbed.o === o) continue;
      const v = e.speed;
      if (o.k === 'doll') {
        if (v > 900 && touched && simTime - o.cool > 0.4) { o.cool = simTime; o.hurt = 1; ouches++; stuntHit(v); document.getElementById('nOuch').textContent = ouches; SND.ouch(o, v); }
        else if (e.wall && v > 400) SND.thud(v * 0.5);
      } else if (o.k === 'crate') { if (v > 300 && (!o.snd || simTime - o.snd > 0.08)) { o.snd = simTime; SND.wood(v); } }
      else if (o.k === 'ball') { if (v > 250 && (!o.snd || simTime - o.snd > 0.08)) { o.snd = simTime; SND.ball(v); } }
    }
  }

  function nearest(x, y) {
    let best = null, bd = Infinity;
    for (const o of objs) {
      if (o.k === 'crate') {
        const [a, b, c, d] = o.p;
        const inside = [[a, b], [b, c], [c, d], [d, a]].every(([u, v]) => (v.x - u.x) * (y - u.y) - (v.y - u.y) * (x - u.x) >= -4);
        if (inside) { let pp = o.p[0], pd = Infinity; for (const p of o.p) { const q = Math.hypot(p.x - x, p.y - y); if (q < pd) { pd = q; pp = p; } } return { o, p: pp }; }
      }
      for (const p of o.p) { const d = Math.hypot(p.x - x, p.y - y) - p.r; if (d < bd) { bd = d; best = { o, p }; } }
    }
    const lim = Math.max(24, 30 / scale);
    if (best && bd < lim) return best;
    for (const o of objs) if (o.k === 'pad') { const pd = o.pad; if (x > pd.x - 6 && x < pd.x + pd.w + 6 && y > pd.y - 10 && y < pd.y + pd.h + 10) return { o, p: null }; }
    return null;
  }

  function spawn(kind, x, y) {
    x = Math.max(40, Math.min(W - 40, x)); y = Math.max(40, Math.min(H - 20, y));
    let o;
    if (kind === 'doll') o = makeDoll(x, Math.min(y + 70, H - 2));
    else if (kind === 'crate') o = makeCrate(x, Math.min(y, H - 32));
    else if (kind === 'ball') o = makeBall(x, Math.min(y, H - 31));
    else if (kind === 'pad') o = makePad(x, y);
    if (o) { spawnStack.push(o); SND.pop(); if (o.k === 'doll') { o.hurt = 0; } }
    if (objs.length > 60) { const old = objs.find((q) => q.k !== 'pad'); if (old) removeObj(old); }
    save();
  }

  let pointer = null, trail = [];
  const pos = (e) => { const r = canvas.getBoundingClientRect(); return toWorld(e.clientX - r.left, e.clientY - r.top); };
  function tapAt(x, y) {
    audioOk = true; if (!touched) { touched = true; intro.classList.add('is-faded'); }
    if (tool === 'grab' || tool === 'erase') {
      const hit = nearest(x, y);
      if (!hit) return null;
      if (tool === 'erase') { removeObj(hit.o); spawnStack = spawnStack.filter((q) => q !== hit.o); SND.pop(); save(); return null; }
      return hit.p ? hit : null;
    }
    spawn(tool, x, y);
    return null;
  }
  canvas.addEventListener('pointerdown', (e) => {
    if (!Curio.touchpad || e.pointerType !== 'mouse' || canvas.classList.contains('curio-latched') || (e.button != null && e.button > 0)) return;
    const [x, y] = pos(e);
    if (tool === 'grab') { const hit = nearest(x, y); if (hit && hit.p) return; }
    e.stopImmediatePropagation();
    tapAt(x, y);
  });
  function fling() {
    const now = performance.now();
    if (!trail.length || now - trail[trail.length - 1].t > 400) return;
    const lastS = trail[trail.length - 1];
    let first = lastS;
    for (let i = trail.length - 1; i >= 0 && lastS.t - trail[i].t <= 110; i--) first = trail[i];
    const dt = (lastS.t - first.t) / 1000;
    if (dt < 0.012) return;
    let vx = (lastS.x - first.x) / dt, vy = (lastS.y - first.y) / dt;
    const sp = Math.hypot(vx, vy), mx = 3200;
    if (sp < 60) return;
    if (sp > mx) { vx *= mx / sp; vy *= mx / sp; }
    const h = world.h || STEP / 2;
    for (const p of grabbed.o.p) { if (!p.im && p !== grabbed.p) continue; p.px = p.x - vx * h; p.py = p.y - vy * h; }
  }
  Curio.drag(canvas, {
    start(q) {
      const [x, y] = toWorld(q.x, q.y);
      const hit = tapAt(x, y);
      if (!hit) { if (tool !== 'grab' && tool !== 'erase') pointer = { x, y, t: 0 }; return; }
      grabbed = { o: hit.o, p: hit.p };
      hit.p.grab = { x, y };
      trail = [{ t: performance.now(), x, y }];
      canvas.classList.add('is-grabbing');
      if (hit.o.k === 'doll' && Math.random() < 0.5) { budget++; SND.ouch(hit.o, 0); hit.o.hurt = 0.3; }
    },
    move(q) {
      if (!grabbed) return;
      const [x, y] = toWorld(q.x, q.y);
      grabbed.p.grab.x = Math.max(-40, Math.min(W + 40, x)); grabbed.p.grab.y = Math.max(-40, Math.min(H + 40, y));
      const lt = trail[trail.length - 1];
      if (!lt || Math.hypot(x - lt.x, y - lt.y) > 2) { trail.push({ t: performance.now(), x, y }); if (trail.length > 30) trail.shift(); }
    },
    end(q) {
      if (grabbed) {
        grabbed.p.grab = null;
        if (q && q.event.type === 'pointerdown') fling();
        grabbed = null; trail = []; canvas.classList.remove('is-grabbing'); save();
      }
      pointer = null;
    }
  });

  const toolBtns = [...document.querySelectorAll('[data-tool]')];
  function setTool(t) { tool = t; for (const b of toolBtns) b.setAttribute('aria-pressed', String(b.dataset.tool === t)); canvas.style.cursor = t === 'grab' ? '' : t === 'erase' ? 'cell' : 'copy'; }
  for (const b of toolBtns) b.addEventListener('click', () => { audioOk = true; setTool(b.dataset.tool); });
  for (const b of document.querySelectorAll('[data-g]')) b.addEventListener('click', () => { audioOk = true; setGravity(b.dataset.g); save(); });
  function paintTag() { tagEl.textContent = paused ? 'PAUSED' : slow ? 'SLOW MOTION' : ''; tagEl.classList.toggle('is-on', paused || slow); }
  function togglePause() { paused = !paused; const b = document.getElementById('pause'); b.setAttribute('aria-pressed', String(paused)); b.textContent = paused ? '▶ Play' : '⏸ Pause'; paintTag(); }
  function toggleSlow() { slow = !slow; document.getElementById('slow').setAttribute('aria-pressed', String(slow)); paintTag(); }
  function doShake() {
    audioOk = true; shake = 1; SND.whoosh();
    for (const p of world.pts) { if (!p.im) continue; const kx = Curio.rand(-1, 1) * 14, ky = -Curio.rand(4, 16) * Math.sign(world.gy || 1); p.px -= kx; p.py -= ky; }
  }
  document.getElementById('pause').addEventListener('click', togglePause);
  document.getElementById('slow').addEventListener('click', () => { audioOk = true; toggleSlow(); });
  document.getElementById('shake').addEventListener('click', doShake);
  document.getElementById('undo').addEventListener('click', () => {
    let o = spawnStack.pop();
    while (o && !objs.includes(o)) o = spawnStack.pop();
    if (!o) { Curio.toast('Nothing to undo'); return; }
    removeObj(o); SND.pop(); save();
  });
  document.getElementById('reset').addEventListener('click', () => { defaultScene(); spawnStack = []; setGravity('down', true); save(); Curio.toast('Fresh room, fresh ragdolls'); });
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (Curio.mode === 'simple' && (k.startsWith('arrow') || k === '0' || k === 's' || k === '3')) return;
    if (k === ' ') { e.preventDefault(); togglePause(); }
    else if (k === 's') toggleSlow();
    else if (k === 'arrowdown') { e.preventDefault(); setGravity('down'); }
    else if (k === 'arrowup') { e.preventDefault(); setGravity('up'); }
    else if (k === 'arrowleft') { e.preventDefault(); setGravity('left'); }
    else if (k === 'arrowright') { e.preventDefault(); setGravity('right'); }
    else if (k === '0') setGravity('zero');
    else if (k === 'z' && (e.ctrlKey || e.metaKey)) document.getElementById('undo').click();
    else if (k === 'x') doShake();
    else if (k >= '1' && k <= '6') setTool(['grab', 'doll', 'crate', 'ball', 'pad', 'erase'][+k - 1]);
  });


  const GM = Curio.mode;
  const rec = Object.assign({ ouch: 0, land: 0, pads: 0 }, Curio.store.get('ragdoll:rec', {}));
  let minute = [];
  function kmh(v) { return Math.round(v / 100 * 3.6 * 2); }
  function stuntHit(v) {
    rec.ouch++;
    const k = kmh(v);
    if (k > rec.land) { rec.land = k; if (touched && k > 60) Curio.toast(`💥 New hardest landing: ${k} km/h`, 1600); }
    minute.push(performance.now());
  }
  function paintRec() { document.getElementById('rec').textContent = rec.land ? `record ${rec.land} km/h` : ''; }
  paintRec();
  const SURPRISES = [
    ['Ragdoll rain!', () => { for (let i = 0; i < 4; i++) spawn('doll', Curio.rand(120, W - 120), 60 + i * 20); }],
    ['Ball pit delivery', () => { for (let i = 0; i < 6; i++) spawn('ball', Curio.rand(100, W - 100), 50 + i * 15); }],
    ['Crate tower', () => { const x = Curio.rand(200, W - 200); for (let i = 0; i < 5; i++) spawn('crate', x + Curio.rand(-4, 4), H - 40 - i * 64); }],
    ['Gravity flip!', () => { setGravity('up', true); setTimeout(() => setGravity('down', true), 1400); }],
    ['Sideways day', () => { const d = Math.random() < 0.5 ? 'left' : 'right'; setGravity(d, true); setTimeout(() => setGravity('down', true), 1200); }],
    ['Earthquake', () => { doShake(); setTimeout(doShake, 400); setTimeout(doShake, 800); }],
    ['Trampoline park', () => { for (let i = 0; i < 3; i++) spawn('pad', 150 + i * (W - 300) / 2, H - 11); spawn('doll', W / 2, 80); }],
    ['Zero gravity party', () => { setGravity('zero', true); doShake(); setTimeout(() => setGravity('down', true), 2600); }]
  ];
  let lastS = -1;
  function surprise() {
    audioOk = true; if (!touched) { touched = true; intro.classList.add('is-faded'); }
    let n; do n = Math.floor(Math.random() * SURPRISES.length); while (n === lastS);
    lastS = n;
    Curio.toast(SURPRISES[n][0]);
    SURPRISES[n][1]();
    save();
  }
  document.getElementById('surprise').addEventListener('click', surprise);
  window.addEventListener('keydown', (e) => { if (e.target.closest?.('input, textarea') || e.ctrlKey || e.metaKey) return; if (e.key === 'g' || e.key === 'G') surprise(); });
  const JOBS = [
    ['10 ouches in one minute', () => minute.filter((t) => performance.now() - t < 60000).length >= 10], ['A landing over 120 km/h', () => rec.land >= 120], ['A landing over 200 km/h', () => rec.land >= 200],
    ['50 bounces on bouncy pads', () => rec.pads >= 50], ['250 ouches in total', () => rec.ouch >= 250], ['Fill the room with 30 things', () => objs.length >= 30], ['Save a room', () => [1, 2, 3].some((n) => Curio.store.get(`ragdoll:slot${n}`, null))]
  ];
  const jobsDone = Curio.store.get('ragdoll:jobs', {});
  const bookEl = document.getElementById('bookPanel'), bookBtn = document.getElementById('book');
  bookBtn.addEventListener('click', () => { bookEl.hidden = !bookEl.hidden; bookBtn.setAttribute('aria-pressed', String(!bookEl.hidden)); paintBook(); });
  function paintBook() {
    if (bookEl.hidden) return;
    document.getElementById('jobs').replaceChildren(...JOBS.map(([t], i) => { const li = document.createElement('li'); li.textContent = t; if (jobsDone[i]) li.classList.add('done'); return li; }));
    document.getElementById('tO').textContent = Curio.fmt(rec.ouch); document.getElementById('tL').textContent = rec.land; document.getElementById('tB').textContent = Curio.fmt(rec.pads);
    document.getElementById('slots').replaceChildren(...[1, 2, 3].map((n) => {
      const o = Curio.store.get(`ragdoll:slot${n}`, null);
      const r = document.createElement('div'); r.className = 'rg-slot';
      const sp = document.createElement('span'); sp.textContent = `Room ${n}: ${o ? `${o.objs.length} things` : 'empty'}`;
      const sv = document.createElement('button'); sv.type = 'button'; sv.className = 'rg-b'; sv.textContent = 'Save';
      sv.addEventListener('click', () => { Curio.store.set(`ragdoll:slot${n}`, serialize()); Curio.toast(`Saved to room ${n}`); paintBook(); });
      const ld = document.createElement('button'); ld.type = 'button'; ld.className = 'rg-b'; ld.textContent = 'Load'; ld.disabled = !o;
      ld.addEventListener('click', () => { const v = Curio.store.get(`ragdoll:slot${n}`, null); if (v) { restore(v); save(); Curio.toast(`Room ${n} loaded`); } });
      r.append(sp, sv, ld);
      return r;
    }));
  }
  async function packCode(obj) {
    const json = JSON.stringify(obj);
    try { const buf = await new Response(new Blob([json]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer(); let bin = ''; const u = new Uint8Array(buf); for (let i = 0; i < u.length; i++) bin += String.fromCharCode(u[i]); return 'ZRG1.' + btoa(bin); }
    catch { return 'ZRG0.' + btoa(unescape(encodeURIComponent(json))); }
  }
  async function unpackCode(c) {
    c = c.trim();
    if (c.startsWith('ZRG0.')) return JSON.parse(decodeURIComponent(escape(atob(c.slice(5)))));
    if (!c.startsWith('ZRG1.')) throw new Error('bad');
    const bin = atob(c.slice(5)); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return JSON.parse(await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text());
  }
  document.getElementById('copyCode').addEventListener('click', async () => { const c = await packCode(serialize()); try { await navigator.clipboard.writeText(c); Curio.toast('Room code copied'); } catch { Curio.toast('Could not copy. Try again.'); } });
  document.getElementById('pasteCode').addEventListener('click', async () => {
    const ta = document.createElement('textarea'); ta.className = 'rg-code'; ta.placeholder = 'Paste a ZRG1 code'; ta.setAttribute('aria-label', 'Room code');
    const v = Curio.modal({ emoji: '📥', title: 'Load a shared room', body: ta, buttons: [{ label: 'Load it', value: 'go' }, { label: 'Cancel', value: '' }] });
    setTimeout(() => ta.focus(), 40);
    if (await v !== 'go') return;
    try { const o = await unpackCode(ta.value); if (!o || !Array.isArray(o.objs)) throw 0; restore(o); save(); Curio.toast('Shared room loaded'); } catch { Curio.toast('That code did not work'); }
  });
  setInterval(() => {
    if (document.hidden) return;
    minute = minute.filter((t) => performance.now() - t < 60000);
    let ch = false;
    if (GM === 'advanced') JOBS.forEach(([t, f], i) => { if (!jobsDone[i] && f()) { jobsDone[i] = Date.now(); ch = true; Curio.toast(`🏆 Stunt done: ${t}`); } });
    if (ch) Curio.store.set('ragdoll:jobs', jobsDone);
    Curio.store.set('ragdoll:rec', rec);
    paintRec(); paintBook();
  }, 1000);
  if (GM === 'simple' && !['grab', 'doll', 'ball', 'pad', 'erase'].includes(tool)) setTool('grab');

  let last = 0, acc = 0, raf = 0, saveT = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    budget = 4;
    if (!paused) {
      acc += dt * (slow ? 0.25 : 1);
      let n = 0;
      while (acc >= STEP && n < 3) {
        world.step(STEP); simTime += STEP; handleEvents();
        for (const o of objs) {
          if (o.k === 'ball') { const p = o.p[0]; o.rot += ((p.x - p.px) * (world.gy >= 0 ? 1 : -1)) / 30; }
          if (o.k === 'doll') o.hurt = Math.max(0, o.hurt - STEP * 0.9);
          if (o.k === 'pad') o.pad.flash = Math.max(0, (o.pad.flash || 0) - STEP * 4);
        }
        acc -= STEP; n++;
      }
      if (n === 3) acc = 0;
      shake = Math.max(0, shake - dt * 2.5);
      saveT += dt; if (saveT > 4) { saveT = 0; save(); }
    }
    draw();
  }
  function start() { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } }
  function stop() { cancelAnimationFrame(raf); raf = 0; save(); }
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  window.addEventListener('pagehide', save);
  window.addEventListener('resize', fit);
  window.Ragdoll = { get world() { return world; }, get objs() { return objs; }, spawn, setGravity, fling: (i, vx, vy) => { const o = objs.filter((q) => q.k === 'doll')[i]; for (const p of o.p) { p.px = p.x - vx / 120; p.py = p.y - vy / 120; } }, get ouches() { return ouches; } };

  fit();
  const sc = Curio.store.get(KEY, null);
  if (sc && Array.isArray(sc.objs) && sc.objs.length) { try { restore(sc); } catch { defaultScene(); } } else defaultScene();
  start();
  if (!Curio.touchpad && matchMedia('(pointer: fine)').matches && !Curio.store.get('tp-hint-ragdoll', false)) { Curio.store.set('tp-hint-ragdoll', true); setTimeout(() => Curio.toast('Tip: on a laptop touchpad, turn on Touchpad mode in the top bar: click a ragdoll to grab it, swing, click again to fling', 4200), 1800); }
})();
