HM.mats = HM.mats || {};
HM.mats.spray = () => {
  const { W, H, clamp, mk, makeSampler, ui, noiseBuffer, audio, adv } = HM.kit;
  const KEY = 'happy-mediums:spray';
  const ALL = [
    ['#f7f7f2', 'Chalk White'], ['#bfc3c7', 'Chrome'], ['#5d6166', 'Gunmetal'], ['#141414', 'Blackbook'],
    ['#e51c23', 'Fire Red'], ['#9c1b2f', 'Wine'], ['#ff4f9a', 'Bubblegum'], ['#ff9ec9', 'Candy Floss'],
    ['#ff6a00', 'Traffic Orange'], ['#ffb300', 'Mango'], ['#ffe600', 'Taxi Yellow'], ['#d4b04c', 'Gold Leaf'],
    ['#b6f400', 'Toxic Lime'], ['#22c55e', 'Kelly Green'], ['#0e7a4a', 'Forest'], ['#2ee6c8', 'Mint Ice'],
    ['#22b8ff', 'Sky Burner'], ['#1f5fff', 'Electric Blue'], ['#1b2a7a', 'Navy Night'], ['#7c3aed', 'Ultraviolet'],
    ['#c34dff', 'Grape Soda'], ['#7a4a2a', 'Brickdust'], ['#d9a679', 'Toast'], ['#ff3df2', 'Hot Magenta']
  ].map(([hex, name]) => ({ hex, name }));
  const SIMPLE = [0, 3, 4, 6, 8, 10, 12, 13, 16, 17, 19, 23];
  const COLORS = adv() ? ALL : SIMPLE.map((i) => ALL[i]);
  const CAPS = [{ name: 'Skinny cap', r: 11 }, { name: 'Regular cap', r: 26 }, { name: 'Fat cap', r: 56 }];
  const saved = Curio.store.get(KEY + ':state:' + Curio.mode, {});
  let tool = 'spray', cap = saved.cap ?? 1, color = clamp(saved.color ?? COLORS.length - 1, 0, COLORS.length - 1), wall = adv() ? (saved.wall || 'brick') : 'brick', night = false;
  let shape = 'star', stSize = saved.stSize || 300, word = saved.word || 'ZOBLE';
  let wallC, relief, paint, pc, buf, bc, mask, mc, backup, bk, ready = false, dirty = true;
  let sheet = null, stencil = null;
  const used = new Set();

  function buildWall() {
    let seed = wall === 'brick' ? 4242 : 777;
    const srnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
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
      for (const x of [375, 750, 1125]) { r.beginPath(); r.moveTo(x, 0); r.lineTo(x, H); r.stroke(); }
      r.beginPath(); r.moveTo(0, 500); r.lineTo(W, 500); r.stroke();
      for (let x = 187; x < W; x += 375) for (let y = 250; y < H; y += 500) {
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
  function build() {
    wallC = mk(); relief = mk(); paint = mk(); pc = paint.getContext('2d'); buf = mk(); bc = buf.getContext('2d'); mask = mk(); mc = mask.getContext('2d'); backup = mk(); bk = backup.getContext('2d');
    buildWall(); ready = true;
  }

  const SHAPES = {
    star: (p) => { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .42 : 1; i ? p.lineTo(Math.cos(a) * r, Math.sin(a) * r + .1) : p.moveTo(Math.cos(a) * r, Math.sin(a) * r + .1); } p.closePath(); },
    heart: (p) => { p.moveTo(0, .95); p.bezierCurveTo(-.2, .75, -1, .3, -1, -.25); p.bezierCurveTo(-1, -.75, -.4, -1, 0, -.55); p.bezierCurveTo(.4, -1, 1, -.75, 1, -.25); p.bezierCurveTo(1, .3, .2, .75, 0, .95); p.closePath(); },
    arrow: (p) => { [[-1, -.25], [.2, -.25], [.2, -.65], [1, 0], [.2, .65], [.2, .25], [-1, .25]].forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath(); },
    bolt: (p) => { [[.15, -1], [-.6, .12], [-.05, .12], [-.25, 1], [.6, -.2], [.05, -.2], [.35, -1]].forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath(); },
    crown: (p) => { [[-1, .6], [-1, -.55], [-.5, .05], [0, -.8], [.5, .05], [1, -.55], [1, .6]].forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath(); }
  };
  const SHAPE_ICONS = { star: '★', heart: '♥', arrow: '➜', bolt: 'ϟ', crown: '♛' };
  function stencilBox(st) {
    if (st.kind === 'word') { const fs = st.size * .62, wd = st.word.length * fs * .72 + 20; return { w: wd + 80, h: fs + 80, fs }; }
    return { w: st.size + 80, h: st.size + 80 };
  }
  function drawCut(ctx, st) {
    ctx.save(); ctx.translate(st.x, st.y);
    if (st.kind === 'word') {
      const { fs } = stencilBox(st);
      ctx.font = `900 ${fs}px Impact, "Arial Black", "Helvetica Neue", Arial, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const m = ctx.measureText(st.word), maxW = st.word.length * fs * .72 + 20;
      if (m.width > maxW) ctx.scale(maxW / m.width, 1);
      ctx.fillText(st.word, 0, fs * .04);
    } else { ctx.scale(st.size / 2, st.size / 2); ctx.beginPath(); SHAPES[st.kind](ctx); ctx.fill(); }
    ctx.restore();
  }
  function buildStencil() {
    if (!stencil) { sheet = null; return; }
    const b = stencilBox(stencil);
    stencil.bx = stencil.x - b.w / 2; stencil.by = stencil.y - b.h / 2; stencil.bw = b.w; stencil.bh = b.h;
    if (!sheet) sheet = mk();
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
    maskData = null; dirty = true;
  }

  const CELL = 12, COLS = Math.ceil(W / CELL), ROWS = Math.ceil(H / CELL);
  const acc = new Float32Array(COLS * ROWS);
  let drips = [];
  let spraying = false, raw = null, sm = null, lastSpray = null, vel = 0, pressure = null, hover = null, sprayBox = null, maskData = null, dragSt = null, down = false;
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
  function through(x0, y0, x1, y1) {
    x0 = clamp(Math.floor(x0), 0, W); y0 = clamp(Math.floor(y0), 0, H); x1 = clamp(Math.ceil(x1), 0, W); y1 = clamp(Math.ceil(y1), 0, H);
    const w = x1 - x0, h = y1 - y0;
    if (w <= 0 || h <= 0) return;
    const sc = sheet.getContext('2d');
    sc.globalCompositeOperation = 'source-atop'; sc.drawImage(buf, x0, y0, w, h, x0, y0, w, h); sc.globalCompositeOperation = 'source-over';
    bc.globalCompositeOperation = 'destination-in'; bc.drawImage(mask, x0, y0, w, h, x0, y0, w, h);
    pc.drawImage(buf, x0, y0, w, h, x0, y0, w, h);
    bc.globalCompositeOperation = 'source-over'; bc.clearRect(x0, y0, w, h);
  }
  function sprayFrame(dtK) {
    const c = COLORS[color].hex, R = CAPS[cap].r * (pressure != null ? .75 + pressure * .5 : 1) * (1 + Math.min(vel, 3) * .05);
    const flow = (pressure != null ? .35 + pressure * 1.1 : 1) * dtK;
    const n = Math.round(R * R * .16 * flow + 6);
    const from = lastSpray || sm, to = sm;
    const target = stencil ? bc : pc;
    target.fillStyle = c;
    const x0 = Math.min(from.x, to.x) - R * 2.6, y0 = Math.min(from.y, to.y) - R * 2.6, x1 = Math.max(from.x, to.x) + R * 2.6, y1 = Math.max(from.y, to.y) + R * 2.6;
    for (let k = 0; k < n; k++) {
      const t = Math.random(), cx = from.x + (to.x - from.x) * t, cy = from.y + (to.y - from.y) * t;
      const u = Math.random() || 1e-6, mag = Math.sqrt(-2 * Math.log(u)) * R * .42, a = Math.random() * Math.PI * 2;
      const x = cx + Math.cos(a) * mag, y = cy + Math.sin(a) * mag;
      const s = .8 + Math.random() * Math.random() * 2.2;
      target.globalAlpha = .25 + Math.random() * .5;
      target.fillRect(x - s / 2, y - s / 2, s, s);
      if (x >= 0 && y >= 0 && x < W && y < H && maskAt(x, y)) acc[((y / CELL) | 0) * COLS + ((x / CELL) | 0)] += .5 * s * (mag < R * .6 ? 1 : .4);
    }
    target.globalAlpha = .09 * flow;
    const gr = target.createRadialGradient(to.x, to.y, 0, to.x, to.y, R * 1.1);
    gr.addColorStop(0, c); gr.addColorStop(1, c + '00');
    target.fillStyle = gr; target.beginPath(); target.arc(to.x, to.y, R * 1.1, 0, Math.PI * 2); target.fill();
    target.globalAlpha = 1;
    if (stencil) through(x0, y0, x1, y1);
    growBox(x0, y0, x1, y1 + 260);
    lastSpray = { x: to.x, y: to.y };
  }
  function dripTick(dtK) {
    if (spraying && sm) {
      const th = cap === 2 ? 150 : cap === 1 ? 170 : 190;
      const R = CAPS[cap].r * 1.4, cx0 = clamp(((sm.x - R) / CELL) | 0, 0, COLS - 1), cx1 = clamp(((sm.x + R) / CELL) | 0, 0, COLS - 1), cy0 = clamp(((sm.y - R) / CELL) | 0, 0, ROWS - 1), cy1 = clamp(((sm.y + R) / CELL) | 0, 0, ROWS - 1);
      for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
        const ci = cy * COLS + cx;
        if (acc[ci] > th && drips.length < 40 && Math.random() < .12) {
          acc[ci] = th * .2;
          drips.push({ x: cx * CELL + Math.random() * CELL, y: cy * CELL + CELL * .7, w: (cap === 2 ? 2.4 : cap === 1 ? 1.8 : 1.3) + Math.random() * 1.6, left: 30 + Math.random() * (cap === 2 ? 260 : 170), v: .7 + Math.random() * .9, c: COLORS[color].hex, ph: Math.random() * 6 });
        }
      }
    }
    for (let i = 0; i < acc.length; i++) if (acc[i] > 0) acc[i] *= .985;
    if (!drips.length) return;
    pc.lineCap = 'round';
    for (const d of drips) {
      const st = Math.min(d.left, d.v * dtK * (.4 + Math.min(1, d.left / 60)));
      const nx = d.x + Math.sin(d.y * .05 + d.ph) * .15, ny = d.y + st;
      pc.strokeStyle = d.c; pc.lineWidth = d.w; pc.beginPath(); pc.moveTo(d.x, d.y); pc.lineTo(nx, ny); pc.stroke();
      d.x = nx; d.y = ny; d.left -= st;
      if (d.left <= .2) { pc.fillStyle = d.c; pc.beginPath(); pc.ellipse(d.x, d.y, d.w * .75, d.w * .95, 0, 0, Math.PI * 2); pc.fill(); d.done = true; }
    }
    drips = drips.filter((d) => !d.done && d.y < H + 10);
    dirty = true;
  }
  let mLast = null, mW = null;
  const marker = makeSampler(() => Math.max(1, (mW || 8) * .25), (x, y, pr, v) => {
    const base = [5, 9, 16][cap];
    const w = pr != null ? base * (.4 + pr * 1.1) : base * clamp(1.15 - v * .2, .6, 1.15);
    mW = mW == null ? w : mW + (w - mW) * .3;
    const target = stencil ? bc : pc;
    target.strokeStyle = COLORS[color].hex; target.lineCap = 'round'; target.lineJoin = 'round'; target.lineWidth = mW;
    target.beginPath(); target.moveTo(mLast ? mLast.x : x, mLast ? mLast.y : y); target.lineTo(x + (mLast ? 0 : .01), y); target.stroke();
    if (stencil) through(Math.min(x, mLast ? mLast.x : x) - mW, Math.min(y, mLast ? mLast.y : y) - mW, Math.max(x, mLast ? mLast.x : x) + mW, Math.max(y, mLast ? mLast.y : y) + mW);
    growBox(x - 30, y - 30, x + 30, y + 30);
    mLast = { x, y }; dirty = true;
  });

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
    const ac = audio(); if (!ac) return;
    if (!hiss) hiss = { buf: noiseBuffer(ac, 2) };
    hissOff(true);
    const src = ac.createBufferSource(), hp = ac.createBiquadFilter(), bp = ac.createBiquadFilter(), gn = ac.createGain();
    src.buffer = hiss.buf; src.loop = true;
    hp.type = 'highpass'; hp.frequency.value = 2500; bp.type = 'peaking'; bp.frequency.value = 6500; bp.gain.value = 6;
    gn.gain.setValueAtTime(0, ac.currentTime); gn.gain.linearRampToValueAtTime(cap === 2 ? .13 : cap === 1 ? .09 : .06, ac.currentTime + .04);
    src.connect(hp).connect(bp).connect(gn).connect(ac.destination); src.start();
    hiss.src = src; hiss.gn = gn; hiss.ac = ac;
  }
  function hissOff(now) {
    if (!hiss || !hiss.src) return;
    const { src, gn, ac } = hiss;
    try { gn.gain.cancelScheduledValues(ac.currentTime); gn.gain.setValueAtTime(gn.gain.value, ac.currentTime); gn.gain.linearRampToValueAtTime(0, ac.currentTime + (now ? .01 : .08)); src.stop(ac.currentTime + (now ? .02 : .1)); } catch {}
    hiss.src = null;
  }
  function rattle() { if (Curio.muted) return; [0, 70, 140].forEach((t, i) => setTimeout(() => Curio.beep(1800 + i * 300, .025, 'square', .03), t)); }

  function placeStencil(x, y) {
    stencil = { kind: shape === 'word' ? 'word' : shape, word: word.toUpperCase() || 'ZOBLE', size: stSize, x, y };
    buildStencil(); HM.flag && HM.flag('Drag to move. Switch to Spray and go over it.', 2600);
    Curio.beep(240, .06, 'triangle', .07);
  }
  function liftStencil() {
    if (!stencil) { Curio.toast('No stencil on the wall'); return; }
    stencil = null; sheet = null; maskData = null; dirty = true;
    Curio.beep(520, .06, 'sine', .07); setTimeout(() => Curio.beep(780, .08, 'sine', .07), 70);
    Curio.toast('Ta-da! Crisp edges.'); sync();
  }

  let saveT = 0;
  function save() {
    clearTimeout(saveT);
    saveT = setTimeout(() => {
      Curio.store.set(KEY + ':state:' + Curio.mode, { cap, color, wall, stSize, word });
      if (!ready) return;
      try {
        let url = paint.toDataURL('image/webp', .85);
        if (!url.startsWith('data:image/webp')) url = paint.toDataURL('image/png');
        if (url.length < 2500000) Curio.store.set(KEY + ':art', url);
      } catch {}
    }, 900);
  }
  function restore() {
    const url = Curio.store.get(KEY + ':art', null);
    if (!url) return;
    const im = new Image(); im.onload = () => { pc.drawImage(im, 0, 0, W, H); dirty = true; }; im.src = url;
  }

  let toolSeg, capSeg, sw, colF, capF, wallSeg, nightBtn, stBox, shapeBtns = [], wordIn, stSizeS, stSizeF;
  function setTool(t) {
    tool = t;
    if (t === 'stencil') { if (!stencil) placeStencil(W / 2, H / 2); else HM.flag && HM.flag('Drag the stencil where you want it', 2200); }
    sync();
  }
  function sync() {
    if (!toolSeg) return;
    toolSeg.set(tool); capSeg.set(cap); sw.set(color);
    capF.side.textContent = tool === 'marker' ? ['Fine tip', 'Chisel tip', 'Mop marker'][cap] : CAPS[cap].name;
    colF.side.textContent = COLORS[color].name;
    if (wallSeg) wallSeg.set(wall);
    if (nightBtn) { nightBtn.setAttribute('aria-pressed', String(night)); nightBtn.textContent = night ? 'Back to daylight' : 'Night session'; }
    if (stBox) { stBox.classList.toggle('on', tool === 'stencil' || !!stencil); shapeBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.shape === shape))); stSizeF.side.textContent = stSize; }
    HM.cursor && HM.cursor(tool === 'stencil' ? 'move' : 'crosshair');
  }
  function shapePick(k) { shape = k; sync(); if (stencil) placeStencil(stencil.x, stencil.y); }

  return {
    id: 'spray', name: 'Graffiti Wall', surface: 'Brick wall', verb: 'spray',
    clearCopy: { title: 'Buff the wall?', body: 'The council paints over everything in sad beige. Undo can bring it back.', yes: 'Buff it', no: 'Keep it' },
    saveMsg: 'Photographed for the blog',
    get used() { return used.size; },
    get badge() { return ''; },
    init() { if (!ready) { build(); restore(); } },
    panel(host) {
      const tools = [{ id: 'spray', label: 'Spray' }, { id: 'marker', label: 'Marker' }];
      if (adv()) tools.push({ id: 'stencil', label: 'Stencil' });
      toolSeg = ui.seg(tools, tool, setTool, 'Tool'); host.append(toolSeg.el);
      capF = ui.field('Nozzle', '');
      capSeg = ui.seg([{ id: 0, label: 'Skinny' }, { id: 1, label: 'Regular' }, { id: 2, label: 'Fat cap' }], cap, (c) => { cap = +c; sync(); save(); Curio.beep(900 + cap * 200, .03, 'square', .03); }, 'Nozzle size');
      capF.append(capSeg.el); host.append(capF);
      colF = ui.field('Colour', '');
      sw = ui.swatches(COLORS, 'hm-cans', (i) => { color = i; sync(); rattle(); save(); }, adv() ? 8 : 6);
      colF.append(sw.el); host.append(colF);
      stBox = null; wallSeg = null; nightBtn = null; shapeBtns = [];
      if (adv()) {
        stBox = HM.kit.h('div', 'hm-stbox');
        const f = ui.field('Stencil', 'drag it, then spray'); stBox.append(f);
        const grid = HM.kit.h('div', 'hm-shapes');
        Object.keys(SHAPES).forEach((k) => { const b = ui.btn(SHAPE_ICONS[k], () => shapePick(k)); b.dataset.shape = k; b.setAttribute('aria-label', `${k} stencil`); grid.append(b); shapeBtns.push(b); });
        const wb = ui.btn('Aa', () => shapePick('word')); wb.dataset.shape = 'word'; wb.setAttribute('aria-label', 'letters stencil'); grid.append(wb); shapeBtns.push(wb);
        stBox.append(grid);
        wordIn = document.createElement('input'); wordIn.className = 'c-input hm-word'; wordIn.maxLength = 6; wordIn.value = word; wordIn.setAttribute('aria-label', 'Stencil letters'); wordIn.autocomplete = 'off'; wordIn.spellcheck = false;
        wordIn.addEventListener('input', () => { word = wordIn.value.replace(/[^A-Za-z0-9!?&#+]/g, '').toUpperCase().slice(0, 6); if (stencil && shape === 'word') placeStencil(stencil.x, stencil.y); save(); });
        stBox.append(wordIn);
        stSizeF = ui.field('Stencil size', String(stSize));
        stSizeS = ui.slider(120, 620, stSize, (v) => { stSize = v; stSizeF.side.textContent = v; if (stencil) { stencil.size = v; buildStencil(); } save(); }, 'Stencil size');
        stSizeF.append(stSizeS.el); stBox.append(stSizeF);
        stBox.append(ui.btn('Lift stencil', liftStencil, 'hm-btn--solid'));
        host.append(stBox);
        const fw = ui.field('Wall', '');
        wallSeg = ui.seg([{ id: 'brick', label: 'Bricks' }, { id: 'concrete', label: 'Concrete' }], wall, (w) => { wall = w; buildWall(); sync(); save(); }, 'Wall type');
        fw.append(wallSeg.el); host.append(fw);
        const row = HM.kit.h('div', 'hm-extras');
        nightBtn = ui.btn('Night session', () => { night = !night; dirty = true; sync(); if (night) { Curio.toast('Shh. Flashlight follows your pointer.'); Curio.beep(150, .08, 'sine', .06); } });
        row.append(nightBtn); host.append(row);
      }
      sync();
    },
    tip: 'Keep moving for clean lines, hold still if you want drips. Fat caps cover walls fast.',
    keys: 'S spray, M marker, T stencil, L lift, N night, C next colour, 1 2 3 caps',
    down(p) {
      down = true; hover = p;
      if (tool === 'stencil') { if (!stencil) placeStencil(p.x, p.y); dragSt = { dx: stencil.x - p.x, dy: stencil.y - p.y }; return; }
      clearTimeout(pendingCommit); commitUndo(); beginUndo();
      raw = p; sm = { x: p.x, y: p.y }; lastSpray = null; vel = 0; pressure = p.pr; used.add(color);
      if (tool === 'spray') { spraying = true; hissOn(); maskData = null; }
      else { mLast = null; mW = null; marker.begin(p); }
    },
    move(p) {
      hover = p; if (night) dirty = true;
      if (!down) return;
      if (dragSt) { stencil.x = clamp(p.x + dragSt.dx, 0, W); stencil.y = clamp(p.y + dragSt.dy, 0, H); buildStencil(); return; }
      if (tool === 'spray') { const dt = Math.max(1, p.t - raw.t); vel += (Math.min(Math.hypot(p.x - raw.x, p.y - raw.y) / dt, 8) - vel) * .3; raw = p; if (p.pr != null) pressure = p.pr; }
      else marker.move(p);
    },
    up() {
      if (!down) return;
      down = false;
      if (dragSt) { dragSt = null; Curio.beep(300, .04, 'triangle', .05); return; }
      if (tool === 'spray' && spraying) { spraying = false; hissOff(); }
      else if (tool === 'marker') marker.end();
      clearTimeout(pendingCommit); pendingCommit = setTimeout(() => { commitUndo(); save(); }, 2500);
      save();
    },
    hover(p) { hover = p; if (night) dirty = true; },
    frame(dt) {
      const dtK = clamp(dt * 60, .3, 3);
      if (spraying && sm) { sm.x += (raw.x - sm.x) * .55; sm.y += (raw.y - sm.y) * .55; vel *= .92; sprayFrame(dtK); dirty = true; }
      dripTick(dtK);
      const d = dirty; dirty = false; return d;
    },
    draw(g, live) {
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
      g.drawImage(wallC, 0, 0); g.drawImage(paint, 0, 0);
      g.globalCompositeOperation = 'multiply'; g.drawImage(relief, 0, 0);
      g.globalCompositeOperation = 'source-over';
      if (!live) return;
      if (sheet) { g.save(); g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 18; g.shadowOffsetY = 6; g.drawImage(sheet, 0, 0); g.restore(); }
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
    },
    undo() {
      clearTimeout(pendingCommit); commitUndo(); drips = [];
      const e = undoStack.pop(); if (!e) return false;
      if (e.full) pc.clearRect(0, 0, W, H);
      pc.putImageData(e.data, e.x, e.y); acc.fill(0); dirty = true; save(); return true;
    },
    clear() {
      clearTimeout(pendingCommit); commitUndo();
      undoStack.push({ x: 0, y: 0, data: pc.getImageData(0, 0, W, H), full: true });
      pc.clearRect(0, 0, W, H); drips = []; acc.fill(0); dirty = true; used.clear(); save(); Curio.beep(200, .15, 'sawtooth', .04);
    },
    resize(d) { cap = clamp(cap + d, 0, 2); sync(); },
    key(k, e) {
      if (['1', '2', '3'].includes(k)) { cap = +k - 1; sync(); return true; }
      if (k === 's') { setTool('spray'); return true; }
      if (k === 'm') { setTool('marker'); return true; }
      if (!adv()) { if (k === 'c') { color = (color + 1) % COLORS.length; sync(); rattle(); return true; } return false; }
      if (k === 't') { setTool('stencil'); return true; }
      if (k === 'l' && stencil) { liftStencil(); return true; }
      if (k === 'n') { nightBtn.click(); return true; }
      if (k === 'c') { color = (color + (e.shiftKey ? COLORS.length - 1 : 1)) % COLORS.length; sync(); rattle(); save(); return true; }
      if (stencil && tool === 'stencil' && e.key.startsWith('Arrow')) {
        const st = e.shiftKey ? 60 : 15;
        stencil.x = clamp(stencil.x + (e.key === 'ArrowRight' ? st : e.key === 'ArrowLeft' ? -st : 0), 0, W);
        stencil.y = clamp(stencil.y + (e.key === 'ArrowDown' ? st : e.key === 'ArrowUp' ? -st : 0), 0, H);
        buildStencil(); return true;
      }
      return false;
    },
    pause() { if (spraying) { spraying = false; hissOff(true); } },
    resume() {}
  };
};
