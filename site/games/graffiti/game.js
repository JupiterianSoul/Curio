(() => {
  const W = 1600, H = 1000;
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mk = (w = W, h = H) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const cv = $('cv'), g = cv.getContext('2d');
  cv.width = W; cv.height = H;

  const COLORS = [
    ['#f7f7f2', 'Chalk White'], ['#bfc3c7', 'Chrome'], ['#5d6166', 'Gunmetal'], ['#141414', 'Blackbook'],
    ['#e51c23', 'Fire Red'], ['#9c1b2f', 'Wine'], ['#ff4f9a', 'Bubblegum'], ['#ff9ec9', 'Candy Floss'],
    ['#ff6a00', 'Traffic Orange'], ['#ffb300', 'Mango'], ['#ffe600', 'Taxi Yellow'], ['#d4b04c', 'Gold Leaf'],
    ['#b6f400', 'Toxic Lime'], ['#22c55e', 'Kelly Green'], ['#0e7a4a', 'Forest'], ['#2ee6c8', 'Mint Ice'],
    ['#22b8ff', 'Sky Burner'], ['#1f5fff', 'Electric Blue'], ['#1b2a7a', 'Navy Night'], ['#7c3aed', 'Ultraviolet'],
    ['#c34dff', 'Grape Soda'], ['#7a4a2a', 'Brickdust'], ['#d9a679', 'Toast'], ['#ff3df2', 'Hot Magenta']
  ];
  const CAPS = [{ name: 'Skinny cap', r: 11 }, { name: 'Regular cap', r: 26 }, { name: 'Fat cap', r: 56 }];

  const saved = Curio.store.get('graffiti:state', {});
  let tool = 'spray', cap = saved.cap ?? 1, color = saved.color ?? 4, wall = saved.wall || 'brick', night = false;
  let shape = 'star', stSize = saved.stSize || 300, word = saved.word || 'ZOBLE';

  let seed = 4242;
  const srnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const wallC = mk(), relief = mk();
  function buildWall() {
    seed = wall === 'brick' ? 4242 : 777;
    const w = wallC.getContext('2d'), r = relief.getContext('2d');
    r.fillStyle = '#fff'; r.fillRect(0, 0, W, H);
    if (wall === 'brick') {
      w.fillStyle = '#a79d90'; w.fillRect(0, 0, W, H);
      const BW = 120, BH = 50, M = 9;
      for (let row = 0, y = -20; y < H; row++, y += BH) {
        const off = row % 2 ? -BW / 2 : 0;
        for (let x = off; x < W; x += BW) {
          const hue = 6 + srnd() * 14, sat = 38 + srnd() * 22, lit = 30 + srnd() * 16;
          w.fillStyle = `hsl(${hue} ${sat}% ${lit}%)`;
          const bx = x + M / 2, by = y + M / 2, bw = BW - M, bh = BH - M;
          w.beginPath(); w.roundRect(bx, by, bw, bh, 3); w.fill();
          for (let k = 0; k < 40; k++) { w.fillStyle = `hsla(${hue} ${sat}% ${lit + (srnd() - .5) * 22}% / .5)`; w.fillRect(bx + srnd() * bw, by + srnd() * bh, 1 + srnd() * 4, 1 + srnd() * 3); }
          const gr = r.createLinearGradient(bx, by, bx, by + bh);
          gr.addColorStop(0, '#fff'); gr.addColorStop(.85, '#f1f1f1'); gr.addColorStop(1, '#d4d4d4');
          r.fillStyle = '#9c9c9c'; r.fillRect(bx - M / 2, by - M / 2, bw + M, bh + M);
          r.fillStyle = gr; r.beginPath(); r.roundRect(bx, by, bw, bh, 3); r.fill();
        }
      }
    } else {
      w.fillStyle = '#9d9a94'; w.fillRect(0, 0, W, H);
      for (let k = 0; k < 90; k++) {
        const x = srnd() * W, y = srnd() * H, rr = 40 + srnd() * 160;
        const gr = w.createRadialGradient(x, y, 0, x, y, rr); const d = srnd() < .5;
        gr.addColorStop(0, d ? 'rgba(70,66,60,.16)' : 'rgba(220,216,208,.18)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        w.fillStyle = gr; w.fillRect(x - rr, y - rr, rr * 2, rr * 2);
      }
      for (let k = 0; k < 20; k++) { const x = srnd() * W; const gr = w.createLinearGradient(x, 0, x + 30, 0); gr.addColorStop(0, 'rgba(60,55,50,0)'); gr.addColorStop(.5, 'rgba(60,55,50,.1)'); gr.addColorStop(1, 'rgba(60,55,50,0)'); w.fillStyle = gr; w.fillRect(x, srnd() * H * .5, 30, H); }
      r.strokeStyle = '#a8a8a8'; r.lineWidth = 3;
      for (const x of [400, 800, 1200]) { r.beginPath(); r.moveTo(x, 0); r.lineTo(x, H); r.stroke(); }
      r.beginPath(); r.moveTo(0, 500); r.lineTo(W, 500); r.stroke();
      for (let x = 200; x < W; x += 400) for (let y = 250; y < H; y += 500) {
        const gr = r.createRadialGradient(x, y, 0, x, y, 14); gr.addColorStop(0, '#555'); gr.addColorStop(.6, '#888'); gr.addColorStop(1, '#fff');
        r.fillStyle = gr; r.beginPath(); r.arc(x, y, 14, 0, Math.PI * 2); r.fill();
        w.fillStyle = '#6d6a64'; w.beginPath(); w.arc(x, y, 9, 0, Math.PI * 2); w.fill();
      }
      for (let k = 0; k < 4000; k++) { w.fillStyle = srnd() < .5 ? 'rgba(60,58,54,.35)' : 'rgba(230,228,220,.3)'; w.fillRect(srnd() * W, srnd() * H, 1 + srnd() * 2.5, 1 + srnd() * 2.5); }
    }
    const id = w.getImageData(0, 0, W, H), d = id.data;
    for (let i = 0; i < d.length; i += 4) { const n = (srnd() - .5) * 18; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    w.putImageData(id, 0, 0);
    const gr = w.createLinearGradient(0, H * .6, 0, H); gr.addColorStop(0, 'rgba(30,25,20,0)'); gr.addColorStop(1, 'rgba(30,25,20,.28)');
    w.fillStyle = gr; w.fillRect(0, 0, W, H);
    const rid = r.getImageData(0, 0, W, H), rd = rid.data;
    for (let i = 0; i < rd.length; i += 4) { const n = srnd() * 34; rd[i] -= n; rd[i + 1] -= n; rd[i + 2] -= n; }
    r.putImageData(rid, 0, 0);
    dirty = true;
  }

  const paint = mk(), pc = paint.getContext('2d');
  const buf = mk(), bc = buf.getContext('2d');
  const mask = mk(), mc = mask.getContext('2d');
  let sheet = null, stencil = null;

  const SHAPES = {
    star: (p) => { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .42 : 1; i ? p.lineTo(Math.cos(a) * r, Math.sin(a) * r + .1) : p.moveTo(Math.cos(a) * r, Math.sin(a) * r + .1); } p.closePath(); },
    heart: (p) => { p.moveTo(0, .95); p.bezierCurveTo(-.2, .75, -1, .3, -1, -.25); p.bezierCurveTo(-1, -.75, -.4, -1, 0, -.55); p.bezierCurveTo(.4, -1, 1, -.75, 1, -.25); p.bezierCurveTo(1, .3, .2, .75, 0, .95); p.closePath(); },
    arrow: (p) => { [[-1, -.25], [.2, -.25], [.2, -.65], [1, 0], [.2, .65], [.2, .25], [-1, .25]].forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath(); },
    bolt: (p) => { [[.15, -1], [-.6, .12], [-.05, .12], [-.25, 1], [.6, -.2], [.05, -.2], [.35, -1]].forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath(); },
    crown: (p) => { [[-1, .6], [-1, -.55], [-.5, .05], [0, -.8], [.5, .05], [1, -.55], [1, .6]].forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath(); }
  };
  const SHAPE_ICONS = { star: '⭐', heart: '❤️', arrow: '➡️', bolt: '⚡', crown: '👑' };

  function stencilBox(st) {
    if (st.kind === 'word') {
      const fs = st.size * .62, wd = st.word.length * fs * .72 + 20;
      return { w: wd + 80, h: fs + 80, fs };
    }
    return { w: st.size + 80, h: st.size + 80 };
  }
  function drawCut(ctx, st) {
    ctx.save(); ctx.translate(st.x, st.y);
    if (st.kind === 'word') {
      const { fs } = stencilBox(st);
      ctx.font = `900 ${fs}px Impact, "Arial Black", "Helvetica Neue", Arial, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const m = ctx.measureText(st.word), maxW = st.word.length * fs * .72 + 20;
      if (m.width > maxW) { ctx.scale(maxW / m.width, 1); }
      ctx.fillText(st.word, 0, fs * .04);
    } else {
      ctx.scale(st.size / 2, st.size / 2); ctx.beginPath(); SHAPES[st.kind](ctx); ctx.fill();
    }
    ctx.restore();
  }
  function buildStencil() {
    if (!stencil) { sheet = null; return; }
    const b = stencilBox(stencil);
    stencil.bx = stencil.x - b.w / 2; stencil.by = stencil.y - b.h / 2; stencil.bw = b.w; stencil.bh = b.h;
    if (!sheet) { sheet = mk(); }
    const s = sheet.getContext('2d');
    s.globalCompositeOperation = 'source-over'; s.clearRect(0, 0, W, H);
    s.fillStyle = '#c9a66b'; s.fillRect(stencil.bx, stencil.by, b.w, b.h);
    s.fillStyle = 'rgba(120,90,50,.25)';
    for (let k = 0; k < 160; k++) s.fillRect(stencil.bx + Math.random() * b.w, stencil.by + Math.random() * b.h, 1 + Math.random() * 3, 1);
    s.strokeStyle = 'rgba(90,65,35,.5)'; s.lineWidth = 3; s.strokeRect(stencil.bx + 1.5, stencil.by + 1.5, b.w - 3, b.h - 3);
    s.globalCompositeOperation = 'destination-out'; s.fillStyle = '#000'; drawCut(s, stencil);
    s.globalCompositeOperation = 'source-over';
    mc.globalCompositeOperation = 'source-over'; mc.clearRect(0, 0, W, H); mc.fillStyle = '#fff'; mc.fillRect(0, 0, W, H);
    mc.clearRect(stencil.bx, stencil.by, b.w, b.h); drawCut(mc, stencil);
    dirty = true;
  }

  const CELL = 12, COLS = Math.ceil(W / CELL), ROWS = Math.ceil(H / CELL);
  const acc = new Float32Array(COLS * ROWS);
  let drips = [];

  let spraying = false, activeId = null, raw = null, sm = null, lastSpray = null, vel = 0, pressure = null, hover = null, sprayBox = null;
  function sprayFrame(dtK) {
    const c = COLORS[color][0], R = CAPS[cap].r * (pressure != null ? .75 + pressure * .5 : 1) * (1 + Math.min(vel, 3) * .05);
    const flow = (pressure != null ? .35 + pressure * 1.1 : 1) * dtK;
    const n = Math.round(R * R * .16 * flow + 6);
    const from = lastSpray || sm, to = sm;
    const target = stencil ? bc : pc;
    if (stencil) { bc.globalCompositeOperation = 'source-over'; }
    target.fillStyle = c;
    let x0 = Math.min(from.x, to.x) - R * 2.6, y0 = Math.min(from.y, to.y) - R * 2.6, x1 = Math.max(from.x, to.x) + R * 2.6, y1 = Math.max(from.y, to.y) + R * 2.6;
    for (let k = 0; k < n; k++) {
      const t = Math.random(), cx = from.x + (to.x - from.x) * t, cy = from.y + (to.y - from.y) * t;
      const u = Math.random() || 1e-6, mag = Math.sqrt(-2 * Math.log(u)) * R * .42, a = Math.random() * Math.PI * 2;
      const x = cx + Math.cos(a) * mag, y = cy + Math.sin(a) * mag;
      const s = .8 + Math.random() * Math.random() * 2.2;
      target.globalAlpha = .25 + Math.random() * .5;
      target.fillRect(x - s / 2, y - s / 2, s, s);
      if (x >= 0 && y >= 0 && x < W && y < H && maskAt(x, y)) {
        const ci = ((y / CELL) | 0) * COLS + ((x / CELL) | 0); acc[ci] += .5 * s * (mag < R * .6 ? 1 : .4);
      }
    }
    target.globalAlpha = .09 * flow;
    const gr = target.createRadialGradient(to.x, to.y, 0, to.x, to.y, R * 1.1);
    gr.addColorStop(0, c); gr.addColorStop(1, c + '00');
    target.fillStyle = gr; target.beginPath(); target.arc(to.x, to.y, R * 1.1, 0, Math.PI * 2); target.fill();
    target.globalAlpha = 1;
    if (stencil) {
      x0 = clamp(Math.floor(x0), 0, W); y0 = clamp(Math.floor(y0), 0, H); x1 = clamp(Math.ceil(x1), 0, W); y1 = clamp(Math.ceil(y1), 0, H);
      const w = x1 - x0, h = y1 - y0;
      if (w > 0 && h > 0) {
        const sc = sheet.getContext('2d');
        sc.globalCompositeOperation = 'source-atop'; sc.drawImage(buf, x0, y0, w, h, x0, y0, w, h); sc.globalCompositeOperation = 'source-over';
        bc.globalCompositeOperation = 'destination-in'; bc.drawImage(mask, x0, y0, w, h, x0, y0, w, h);
        pc.drawImage(buf, x0, y0, w, h, x0, y0, w, h);
        bc.globalCompositeOperation = 'source-over'; bc.clearRect(x0, y0, w, h);
      }
    }
    growBox(x0, y0, x1, y1 + 260);
    lastSpray = { x: to.x, y: to.y };
  }
  let maskData = null;
  function maskAt(x, y) {
    if (!stencil) return true;
    if (x < stencil.bx || y < stencil.by || x > stencil.bx + stencil.bw || y > stencil.by + stencil.bh) return true;
    if (!maskData) maskData = mc.getImageData(0, 0, W, H).data;
    return maskData[((y | 0) * W + (x | 0)) * 4 + 3] > 128;
  }
  function growBox(x0, y0, x1, y1) {
    if (!sprayBox) sprayBox = { x0, y0, x1, y1 };
    else { sprayBox.x0 = Math.min(sprayBox.x0, x0); sprayBox.y0 = Math.min(sprayBox.y0, y0); sprayBox.x1 = Math.max(sprayBox.x1, x1); sprayBox.y1 = Math.max(sprayBox.y1, y1); }
  }

  function dripTick(dtK) {
    if (spraying && tool === 'spray') {
      const th = cap === 2 ? 150 : cap === 1 ? 170 : 190;
      const R = CAPS[cap].r * 1.4, cx0 = clamp(((sm.x - R) / CELL) | 0, 0, COLS - 1), cx1 = clamp(((sm.x + R) / CELL) | 0, 0, COLS - 1), cy0 = clamp(((sm.y - R) / CELL) | 0, 0, ROWS - 1), cy1 = clamp(((sm.y + R) / CELL) | 0, 0, ROWS - 1);
      for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
        const ci = cy * COLS + cx;
        if (acc[ci] > th && drips.length < 40 && Math.random() < .12) {
          acc[ci] = th * .2;
          drips.push({ x: cx * CELL + Math.random() * CELL, y: cy * CELL + CELL * .7, w: (cap === 2 ? 2.4 : cap === 1 ? 1.8 : 1.3) + Math.random() * 1.6, left: 30 + Math.random() * (cap === 2 ? 260 : 170), v: .7 + Math.random() * .9, c: COLORS[color][0], ph: Math.random() * 6 });
        }
      }
    }
    for (let i = 0; i < acc.length; i += 1) if (acc[i] > 0) acc[i] *= .985;
    if (!drips.length) return;
    pc.lineCap = 'round';
    for (const d of drips) {
      const step = Math.min(d.left, d.v * dtK * (.4 + Math.min(1, d.left / 60)));
      const nx = d.x + Math.sin(d.y * .05 + d.ph) * .15, ny = d.y + step;
      pc.strokeStyle = d.c; pc.lineWidth = d.w; pc.beginPath(); pc.moveTo(d.x, d.y); pc.lineTo(nx, ny); pc.stroke();
      d.x = nx; d.y = ny; d.left -= step;
      if (d.left <= .2) { pc.fillStyle = d.c; pc.beginPath(); pc.ellipse(d.x, d.y, d.w * .75, d.w * .95, 0, 0, Math.PI * 2); pc.fill(); d.done = true; }
    }
    drips = drips.filter((d) => !d.done && d.y < H + 10);
    dirty = true;
  }

  function makeSampler(spacing, emit, K = .5) {
    let s, r0, pPrev, mPrev, left = 0, v = 0, prS = null;
    function walk(x0, y0, cx, cy, x1, y1, pa, pb) {
      const est = Math.hypot(cx - x0, cy - y0) + Math.hypot(x1 - cx, y1 - cy);
      const n = Math.max(1, Math.ceil(est / 1.5));
      let px = x0, py = y0;
      for (let i = 1; i <= n; i++) {
        const t = i / n, u = 1 - t;
        const x = u * u * x0 + 2 * u * t * cx + t * t * x1, y = u * u * y0 + 2 * u * t * cy + t * t * y1;
        let d = Math.hypot(x - px, y - py), sp = spacing();
        while (d > 0 && left + d >= sp) {
          const f = (sp - left) / d;
          px += (x - px) * f; py += (y - py) * f;
          emit(px, py, pa == null ? null : pa + (pb - pa) * t, v, false);
          d = Math.hypot(x - px, y - py); left = 0; sp = spacing();
        }
        left += d; px = x; py = y;
      }
    }
    return {
      begin(p) { r0 = p; s = { x: p.x, y: p.y }; pPrev = s; mPrev = s; left = 0; v = 0; prS = p.pr; emit(p.x, p.y, p.pr, 0, true); },
      move(p) {
        const dt = Math.max(1, p.t - r0.t);
        v += (Math.min(Math.hypot(p.x - r0.x, p.y - r0.y) / dt, 8) - v) * .3; r0 = p;
        const prOld = prS; prS = p.pr == null ? null : (prS == null ? p.pr : prS + (p.pr - prS) * .5);
        s = { x: s.x + (p.x - s.x) * K, y: s.y + (p.y - s.y) * K };
        const mid = { x: (pPrev.x + s.x) / 2, y: (pPrev.y + s.y) / 2 };
        walk(mPrev.x, mPrev.y, pPrev.x, pPrev.y, mid.x, mid.y, prOld, prS);
        mPrev = mid; pPrev = s;
      },
      end() { walk(mPrev.x, mPrev.y, pPrev.x, pPrev.y, r0.x, r0.y, prS, prS); }
    };
  }
  let mLast = null, mW = null;
  const marker = makeSampler(() => Math.max(1, (mW || 8) * .25), (x, y, pr, v, first) => {
    const base = [5, 9, 16][cap];
    const w = pr != null ? base * (.4 + pr * 1.1) : base * clamp(1.15 - v * .2, .6, 1.15);
    mW = mW == null ? w : mW + (w - mW) * .3;
    const target = stencil ? bc : pc;
    target.strokeStyle = COLORS[color][0]; target.lineCap = 'round'; target.lineJoin = 'round'; target.lineWidth = mW;
    target.beginPath(); target.moveTo(mLast ? mLast.x : x, mLast ? mLast.y : y); target.lineTo(x + (mLast ? 0 : .01), y); target.stroke();
    if (stencil) {
      const x0 = clamp(Math.floor(Math.min(x, mLast ? mLast.x : x) - mW), 0, W), y0 = clamp(Math.floor(Math.min(y, mLast ? mLast.y : y) - mW), 0, H);
      const x1 = clamp(Math.ceil(Math.max(x, mLast ? mLast.x : x) + mW), 0, W), y1 = clamp(Math.ceil(Math.max(y, mLast ? mLast.y : y) + mW), 0, H);
      if (x1 > x0 && y1 > y0) {
        const sc = sheet.getContext('2d');
        sc.globalCompositeOperation = 'source-atop'; sc.drawImage(buf, x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0); sc.globalCompositeOperation = 'source-over';
        bc.globalCompositeOperation = 'destination-in'; bc.drawImage(mask, x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0);
        pc.drawImage(buf, x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0);
        bc.globalCompositeOperation = 'source-over'; bc.clearRect(x0, y0, x1 - x0, y1 - y0);
      }
    }
    growBox(x - 30, y - 30, x + 30, y + 30);
    mLast = { x, y }; dirty = true;
  });

  const backup = mk(), bk = backup.getContext('2d');
  const undoStack = [];
  function beginUndo() { bk.clearRect(0, 0, W, H); bk.drawImage(paint, 0, 0); sprayBox = null; }
  function commitUndo() {
    if (!sprayBox) return;
    const x = clamp(Math.floor(sprayBox.x0), 0, W), y = clamp(Math.floor(sprayBox.y0), 0, H);
    const w = clamp(Math.ceil(sprayBox.x1), 0, W) - x, h = clamp(Math.ceil(sprayBox.y1), 0, H) - y;
    if (w > 0 && h > 0) { undoStack.push({ x, y, data: bk.getImageData(x, y, w, h) }); if (undoStack.length > 25) undoStack.shift(); }
    sprayBox = null;
  }
  let pendingCommit = 0;

  let hiss = null;
  function hissOn() {
    if (Curio.muted || !Curio.audioContext) return;
    const ac = Curio.audioContext(); if (!ac) return;
    if (!hiss) {
      const len = ac.sampleRate * 2, b = ac.createBuffer(1, len, ac.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      hiss = { buf: b };
    }
    hissOff(true);
    const src = ac.createBufferSource(), hp = ac.createBiquadFilter(), bp = ac.createBiquadFilter(), gn = ac.createGain();
    src.buffer = hiss.buf; src.loop = true;
    hp.type = 'highpass'; hp.frequency.value = 2500; bp.type = 'peaking'; bp.frequency.value = 6500; bp.gain.value = 6;
    gn.gain.setValueAtTime(0, ac.currentTime); gn.gain.linearRampToValueAtTime(cap === 2 ? .13 : cap === 1 ? .09 : .06, ac.currentTime + .04);
    src.connect(hp).connect(bp).connect(gn).connect(ac.destination); src.start();
    hiss.src = src; hiss.gn = gn;
  }
  function hissOff(now) {
    if (!hiss || !hiss.src) return;
    const ac = Curio.audioContext(), { src, gn } = hiss;
    try { gn.gain.cancelScheduledValues(ac.currentTime); gn.gain.setValueAtTime(gn.gain.value, ac.currentTime); gn.gain.linearRampToValueAtTime(0, ac.currentTime + (now ? .01 : .08)); src.stop(ac.currentTime + (now ? .02 : .1)); } catch {}
    hiss.src = null;
  }
  function rattle() { if (Curio.muted) return; [0, 70, 140].forEach((t, i) => setTimeout(() => Curio.beep(1800 + i * 300, .025, 'square', .03), t)); }

  let dragSt = null;
  function toDoc(e) {
    const r = cv.getBoundingClientRect(); const pen = e.pointerType === 'pen' && e.pressure > 0;
    return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height, pr: pen ? e.pressure : null, t: e.timeStamp || performance.now() };
  }
  function downSpray(e) {
    if (activeId != null) return;
    e.preventDefault();
    const p = toDoc(e); activeId = e.pointerId; hover = p;
    if (tool === 'stencil') {
      if (!stencil) placeStencil(p.x, p.y);
      dragSt = { dx: stencil.x - p.x, dy: stencil.y - p.y }; return;
    }
    clearTimeout(pendingCommit); commitUndo(); beginUndo();
    raw = p; sm = { x: p.x, y: p.y }; lastSpray = null; vel = 0; pressure = p.pr;
    if (tool === 'spray') { spraying = true; hissOn(); maskData = null; }
    else { mLast = null; mW = null; marker.begin(p); }
  }
  cv.addEventListener('pointermove', (e) => { hover = toDoc(e); if (night) dirty = true; });
  function moveSpray(e) {
    const p = toDoc(e); hover = p; if (night) dirty = true;
    if (activeId == null) return;
    e.preventDefault();
    if (dragSt) { stencil.x = clamp(p.x + dragSt.dx, 0, W); stencil.y = clamp(p.y + dragSt.dy, 0, H); buildStencil(); return; }
    const list = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
    for (const ev of (list.length ? list : [e])) {
      const q = toDoc(ev);
      if (tool === 'spray') { const dt = Math.max(1, q.t - raw.t); vel += (Math.min(Math.hypot(q.x - raw.x, q.y - raw.y) / dt, 8) - vel) * .3; raw = q; if (q.pr != null) pressure = q.pr; }
      else marker.move(q);
    }
  }
  function up() {
    if (activeId == null) return;
    activeId = null;
    if (dragSt) { dragSt = null; Curio.beep(300, .04, 'triangle', .05); return; }
    if (tool === 'spray' && spraying) { spraying = false; hissOff(); }
    else if (tool === 'marker') marker.end();
    clearTimeout(pendingCommit); pendingCommit = setTimeout(() => { commitUndo(); scheduleSave(); }, 2500);
    scheduleSave();
  }
  Curio.drag(cv, { start: (p) => downSpray(p.event), move: (p) => moveSpray(p.event), end: up });
  addEventListener('curio:touchpad', (e) => { if (e.detail) Curio.toast('Touchpad mode: click the wall to start spraying, move to paint, click again to stop. Same for dragging the stencil', 4000); });
  cv.addEventListener('pointerleave', () => { if (night) dirty = true; });

  function placeStencil(x, y) {
    stencil = { kind: shape === 'word' ? 'word' : shape, word: word.toUpperCase() || 'ZOBLE', size: stSize, x, y };
    buildStencil(); maskData = null; showTip('Drag to move. Switch to Spray and go over it.');
    Curio.beep(240, .06, 'triangle', .07);
  }
  function liftStencil() {
    if (!stencil) { Curio.toast('No stencil on the wall'); return; }
    stencil = null; sheet = null; maskData = null; dirty = true;
    Curio.beep(520, .06, 'sine', .07); setTimeout(() => Curio.beep(780, .08, 'sine', .07), 70);
    Curio.toast('Ta-da! Crisp edges.');
  }
  let tipT = 0;
  function showTip(t) { const el = $('tip'); el.textContent = t; el.classList.add('on'); clearTimeout(tipT); tipT = setTimeout(() => el.classList.remove('on'), 2600); }

  let dirty = true;
  function compose(ctx, withSheet) {
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.drawImage(wallC, 0, 0);
    ctx.drawImage(paint, 0, 0);
    ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(relief, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    if (withSheet && sheet) {
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6; ctx.drawImage(sheet, 0, 0); ctx.restore();
    }
  }
  function present() {
    compose(g, true);
    if (night) {
      const lx = hover ? hover.x : W / 2, ly = hover ? hover.y : H / 2, R = 340;
      const gr = g.createRadialGradient(lx, ly, 0, lx, ly, R);
      gr.addColorStop(0, 'rgba(255,240,200,0)'); gr.addColorStop(.45, 'rgba(10,12,30,.15)'); gr.addColorStop(.8, 'rgba(5,7,20,.75)'); gr.addColorStop(1, 'rgba(3,5,15,.94)');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = 'overlay';
      const gl = g.createRadialGradient(lx, ly, 0, lx, ly, R * .6); gl.addColorStop(0, 'rgba(255,230,160,.35)'); gl.addColorStop(1, 'rgba(255,230,160,0)');
      g.fillStyle = gl; g.fillRect(lx - R, ly - R, R * 2, R * 2);
      g.globalCompositeOperation = 'source-over';
    }
  }

  let lastT = performance.now();
  function loop(t) {
    const dtK = clamp((t - lastT) / 16.7, .3, 3); lastT = t;
    if (!document.hidden) {
      if (spraying && sm) {
        sm.x += (raw.x - sm.x) * .55; sm.y += (raw.y - sm.y) * .55; vel *= .92;
        sprayFrame(dtK); dirty = true;
      }
      dripTick(dtK);
      if (dirty) { present(); dirty = false; }
    }
    requestAnimationFrame(loop);
  }

  let saveT = 0;
  function scheduleSave() {
    clearTimeout(saveT);
    saveT = setTimeout(() => {
      Curio.store.set('graffiti:state', { cap, color, wall, stSize, word });
      try {
        let url = paint.toDataURL('image/webp', .86);
        if (!url.startsWith('data:image/webp')) url = paint.toDataURL('image/png');
        if (url.length < 3500000) Curio.store.set('graffiti:paint', url);
      } catch {}
    }, 900);
  }
  function restore() {
    const url = Curio.store.get('graffiti:paint', null);
    if (!url) return;
    const im = new Image(); im.onload = () => { pc.drawImage(im, 0, 0, W, H); dirty = true; }; im.src = url;
  }
  function undo() {
    clearTimeout(pendingCommit); commitUndo(); drips = [];
    const e = undoStack.pop(); if (!e) { Curio.toast('Nothing to undo'); return; }
    if (e.full) pc.clearRect(0, 0, W, H);
    pc.putImageData(e.data, e.x, e.y); acc.fill(0); dirty = true; scheduleSave(); Curio.beep(330, .05, 'triangle', .07);
  }
  async function buff() {
    const ok = await Curio.modal({ emoji: '🧽', title: 'Buff the wall?', body: 'The council paints over everything in sad beige. Undo can bring it back.', buttons: [{ label: 'Buff it', value: true }, { label: 'Keep it', value: false }] });
    if (!ok) return;
    clearTimeout(pendingCommit); commitUndo();
    undoStack.push({ x: 0, y: 0, data: pc.getImageData(0, 0, W, H), full: true });
    pc.clearRect(0, 0, W, H); drips = []; acc.fill(0); dirty = true; scheduleSave(); Curio.beep(200, .15, 'sawtooth', .04);
  }
  function savePng() {
    const c = mk(), x = c.getContext('2d'); compose(x, false);
    c.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'curio-graffiti.png';
      document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      Curio.toast('Photographed for the blog'); Curio.beep(1200, .05, 'square', .04);
    }, 'image/png');
  }

  const pal = $('pal');
  COLORS.forEach(([hex, name], i) => {
    const b = document.createElement('button'); b.className = 'gf-sw'; b.style.background = hex; b.title = name; b.setAttribute('aria-label', name);
    b.addEventListener('click', () => { color = i; syncUi(); rattle(); scheduleSave(); });
    pal.append(b);
  });
  const shapesEl = $('shapes');
  Object.keys(SHAPES).forEach((k) => {
    const b = document.createElement('button'); b.dataset.shape = k; b.textContent = SHAPE_ICONS[k]; b.setAttribute('aria-label', `${k} stencil`);
    b.addEventListener('click', () => { shape = k; syncUi(); if (stencil) placeStencil(stencil.x, stencil.y); });
    shapesEl.append(b);
  });
  const wb = document.createElement('button'); wb.dataset.shape = 'word'; wb.textContent = 'Aa'; wb.setAttribute('aria-label', 'letters stencil'); wb.style.fontWeight = '900'; wb.style.fontSize = '15px';
  wb.addEventListener('click', () => { shape = 'word'; syncUi(); if (stencil) placeStencil(stencil.x, stencil.y); });
  shapesEl.append(wb);
  $('useWord').addEventListener('click', () => { shape = 'word'; syncUi(); if (stencil) placeStencil(stencil.x, stencil.y); else placeStencil(W / 2, H / 2); });
  $('word').addEventListener('input', (e) => { word = e.target.value.replace(/[^A-Za-z0-9!?&#+]/g, '').toUpperCase().slice(0, 6); if (stencil && shape === 'word') placeStencil(stencil.x, stencil.y); scheduleSave(); });
  $('stSize').addEventListener('input', (e) => { stSize = +e.target.value; $('stSizeV').textContent = stSize; if (stencil) { stencil.size = stSize; buildStencil(); maskData = null; } scheduleSave(); });
  $('lift').addEventListener('click', liftStencil);
  function setTool(t) {
    tool = t;
    if (t === 'stencil') { if (!stencil) placeStencil(W / 2, H / 2); else showTip('Drag the stencil where you want it'); }
    syncUi();
  }
  document.querySelectorAll('[data-tool]').forEach((b) => b.addEventListener('click', () => setTool(b.dataset.tool)));
  document.querySelectorAll('[data-cap]').forEach((b) => b.addEventListener('click', () => { cap = +b.dataset.cap; syncUi(); scheduleSave(); Curio.beep(900 + cap * 200, .03, 'square', .03); }));
  document.querySelectorAll('[data-wall]').forEach((b) => b.addEventListener('click', () => { wall = b.dataset.wall; buildWall(); syncUi(); scheduleSave(); }));
  $('night').addEventListener('click', () => {
    night = !night; dirty = true; syncUi();
    if (night) { Curio.toast('Shh. Flashlight follows your pointer.'); Curio.beep(150, .08, 'sine', .06); }
  });
  $('undo').addEventListener('click', undo);
  $('buff').addEventListener('click', buff);
  $('save').addEventListener('click', savePng);
  addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input')) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); return; }
    if (['1', '2', '3'].includes(e.key)) { cap = +e.key - 1; syncUi(); }
    if (e.key === 'n' || e.key === 'N') $('night').click();
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === 's') setTool('spray');
    else if (k === 'm') setTool('marker');
    else if (k === 't') setTool('stencil');
    else if (k === 'l' && stencil) liftStencil();
    else if (k === 'u') undo();
    else if (k === 'c') { color = (color + (e.shiftKey ? COLORS.length - 1 : 1)) % COLORS.length; syncUi(); rattle(); scheduleSave(); }
    else if (stencil && tool === 'stencil' && e.key.startsWith('Arrow')) {
      e.preventDefault();
      const st = e.shiftKey ? 60 : 15;
      stencil.x = clamp(stencil.x + (e.key === 'ArrowRight' ? st : e.key === 'ArrowLeft' ? -st : 0), 0, W);
      stencil.y = clamp(stencil.y + (e.key === 'ArrowDown' ? st : e.key === 'ArrowUp' ? -st : 0), 0, H);
      buildStencil(); dirty = true;
    }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && spraying) { spraying = false; hissOff(true); } });

  function syncUi() {
    document.querySelectorAll('[data-tool]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tool === tool)));
    document.querySelectorAll('[data-cap]').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.cap === cap)));
    document.querySelectorAll('[data-wall]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.wall === wall)));
    [...pal.children].forEach((b, i) => b.setAttribute('aria-pressed', String(i === color)));
    shapesEl.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.shape === shape)));
    $('capName').textContent = tool === 'marker' ? ['Fine tip', 'Chisel tip', 'Mop marker'][cap] : CAPS[cap].name;
    $('colName').textContent = COLORS[color][1];
    $('stbox').classList.toggle('on', tool === 'stencil' || !!stencil);
    $('night').setAttribute('aria-pressed', String(night));
    $('night').textContent = night ? '☀️ Back to daylight' : '🔦 Night session';
    $('stSizeV').textContent = stSize; $('stSize').value = stSize; $('word').value = word;
    cv.style.cursor = tool === 'stencil' ? 'move' : 'crosshair';
  }

  buildWall(); syncUi(); restore();
  if (!Curio.touchpad && !Curio.store.get('tp-hint-graffiti', false) && matchMedia('(pointer: fine)').matches) { Curio.store.set('tp-hint-graffiti', true); setTimeout(() => Curio.toast('Tip: on a laptop touchpad, turn on Touchpad mode in the top bar: click to start spraying, click again to stop', 4200), 1800); }
  requestAnimationFrame(loop);
})();
