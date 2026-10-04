(() => {
  const W = 1500, H = 1000, N = W * H;
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mk = (w = W, h = H) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const cv = $('cv'), g = cv.getContext('2d');
  cv.width = W; cv.height = H;

  const COLORS = [
    ['#f6f3ea', 'Chalk White'], ['#ffb3c7', 'Bubblegum Pink'], ['#ff9f8a', 'Coral'], ['#ffc99a', 'Peach'],
    ['#fff0a0', 'Lemon Ice'], ['#d9f2a6', 'Pistachio'], ['#a8e6cf', 'Mint'], ['#9fe3e8', 'Aqua'],
    ['#a9cdf5', 'Sky'], ['#bfb3f0', 'Lavender'], ['#e3b3ef', 'Lilac'], ['#f7a8e0', 'Orchid']
  ].map(([hex, name]) => ({ hex, name, rgb: [1, 3, 5].map((i) => parseInt(hex.substr(i, 2), 16)) }));

  let seed = 5150;
  const srnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const hgt = new Uint8Array(N);
  const pave = mk(), puddles = mk();
  (function makePavement() {
    const p = pave.getContext('2d'), hc = mk(), h = hc.getContext('2d');
    const sm = mk(60, 40), s = sm.getContext('2d');
    for (let y = 0; y < 40; y++) for (let x = 0; x < 60; x++) { const v = 90 + srnd() * 80 | 0; s.fillStyle = `rgb(${v},${v},${v})`; s.fillRect(x, y, 1, 1); }
    h.imageSmoothingQuality = 'high'; h.drawImage(sm, 0, 0, W, H);
    const id = h.getImageData(0, 0, W, H), d = id.data;
    for (let i = 0; i < N; i++) { const o = i * 4; let v = d[o] * .45 + srnd() * 150; if (srnd() < .02) v = 250; if (srnd() < .015) v = 20; d[o] = d[o + 1] = d[o + 2] = clamp(v, 0, 255); }
    h.putImageData(id, 0, 0);
    p.fillStyle = '#a7a096'; p.fillRect(0, 0, W, H);
    const SL = 250;
    for (let y = 0; y < H; y += SL) for (let x = 0; x < W; x += SL) {
      const t = (srnd() - .5) * 16; p.fillStyle = `rgb(${167 + t},${160 + t},${150 + t})`; p.fillRect(x, y, SL, SL);
    }
    for (let k = 0; k < 40; k++) {
      const x = srnd() * W, y = srnd() * H, r = 30 + srnd() * 140, gr = p.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, srnd() < .5 ? 'rgba(80,72,62,.12)' : 'rgba(220,214,200,.14)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      p.fillStyle = gr; p.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (let k = 0; k < 9000; k++) { const c = srnd(); p.fillStyle = c < .4 ? 'rgba(70,64,58,.45)' : c < .8 ? 'rgba(225,220,210,.4)' : 'rgba(150,120,95,.5)'; const s2 = .8 + srnd() * 2.6; p.fillRect(srnd() * W, srnd() * H, s2, s2); }
    for (let k = 0; k < 14; k++) { const x = srnd() * W, y = srnd() * H, r = 4 + srnd() * 7; p.fillStyle = 'rgba(70,66,62,.55)'; p.beginPath(); p.ellipse(x, y, r, r * .8, srnd() * 3, 0, Math.PI * 2); p.fill(); }
    p.lineCap = 'round'; h.lineCap = 'round';
    for (let x = SL; x < W; x += SL) { p.strokeStyle = 'rgba(60,55,50,.55)'; p.lineWidth = 5; p.beginPath(); p.moveTo(x, 0); p.lineTo(x, H); p.stroke(); p.strokeStyle = 'rgba(230,225,215,.35)'; p.lineWidth = 2; p.beginPath(); p.moveTo(x + 3, 0); p.lineTo(x + 3, H); p.stroke(); h.strokeStyle = '#000'; h.lineWidth = 8; h.beginPath(); h.moveTo(x, 0); h.lineTo(x, H); h.stroke(); }
    for (let y = SL; y < H; y += SL) { p.strokeStyle = 'rgba(60,55,50,.55)'; p.lineWidth = 5; p.beginPath(); p.moveTo(0, y); p.lineTo(W, y); p.stroke(); p.strokeStyle = 'rgba(230,225,215,.35)'; p.lineWidth = 2; p.beginPath(); p.moveTo(0, y + 3); p.lineTo(W, y + 3); p.stroke(); h.strokeStyle = '#000'; h.lineWidth = 8; h.beginPath(); h.moveTo(0, y); h.lineTo(W, y); h.stroke(); }
    const crack = (x, y, a, len, w, depth) => {
      const pts = [[x, y]];
      for (let i = 0; i < len; i++) { a += (srnd() - .5) * .7; x += Math.cos(a) * 7; y += Math.sin(a) * 7; pts.push([x, y]); if (depth < 1 && srnd() < .03) crack(x, y, a + (srnd() < .5 ? 1 : -1) * (.6 + srnd() * .6), len * .5 | 0, w * .6, depth + 1); }
      for (const [ctx, col, lw] of [[p, 'rgba(230,224,212,.35)', w + 2.5], [p, 'rgba(45,40,36,.85)', w], [h, '#000', w + 4]]) {
        ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.beginPath(); pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py + (col.startsWith('rgba(230') ? 1.5 : 0)) : ctx.moveTo(px, py))); ctx.stroke();
      }
    };
    for (let k = 0; k < 4; k++) crack(srnd() * W, srnd() * H, srnd() * Math.PI * 2, 25 + srnd() * 45 | 0, 1.6 + srnd() * 1.4, 0);
    const hd = h.getImageData(0, 0, W, H).data;
    for (let i = 0; i < N; i++) hgt[i] = hd[i * 4];
    const pd = p.getImageData(0, 0, W, H), pdd = pd.data;
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const i = y * W + x, sh = (hgt[i - W - 1] - hgt[i + W + 1]) * .07 + (srnd() - .5) * 10, o = i * 4; pdd[o] += sh; pdd[o + 1] += sh; pdd[o + 2] += sh; }
    p.putImageData(pd, 0, 0);
    const q = puddles.getContext('2d');
    for (let k = 0; k < 5; k++) {
      const x = 120 + srnd() * (W - 240), y = 120 + srnd() * (H - 240), rx = 70 + srnd() * 120, ry = rx * (.35 + srnd() * .25);
      const gr = q.createRadialGradient(x, y, 0, x, y, rx); gr.addColorStop(0, 'rgba(170,200,235,.9)'); gr.addColorStop(.7, 'rgba(150,180,220,.6)'); gr.addColorStop(1, 'rgba(150,180,220,0)');
      q.save(); q.translate(x, y); q.scale(1, ry / rx); q.translate(-x, -y); q.fillStyle = gr; q.beginPath(); q.arc(x, y, rx, 0, Math.PI * 2); q.fill(); q.restore();
    }
  })();

  const chalkC = mk(), cc = chalkC.getContext('2d');
  const img = cc.createImageData(W, H), D = img.data;
  let dirtyR = null;
  const mark = (x0, y0, x1, y1) => {
    x0 = clamp(x0 | 0, 0, W - 1); y0 = clamp(y0 | 0, 0, H - 1); x1 = clamp(Math.ceil(x1), 0, W - 1); y1 = clamp(Math.ceil(y1), 0, H - 1);
    if (!dirtyR) dirtyR = { x0, y0, x1, y1 }; else { dirtyR.x0 = Math.min(dirtyR.x0, x0); dirtyR.y0 = Math.min(dirtyR.y0, y0); dirtyR.x1 = Math.max(dirtyR.x1, x1); dirtyR.y1 = Math.max(dirtyR.y1, y1); }
    if (!strokeR) strokeR = { x0, y0, x1, y1 }; else { strokeR.x0 = Math.min(strokeR.x0, x0); strokeR.y0 = Math.min(strokeR.y0, y0); strokeR.x1 = Math.max(strokeR.x1, x1); strokeR.y1 = Math.max(strokeR.y1, y1); }
  };
  let strokeR = null;

  const saved = Curio.store.get('chalk-art:state', {});
  let tool = 'chalk', color = saved.color ?? 0, size = saved.size || 16;

  function deposit(i, col, amt) {
    const o = i * 4, a = D[o + 3] / 255, na = a + (1 - a) * amt;
    const j = (Math.random() - .5) * 14, k = (na - a) / na;
    D[o] += (col[0] + j - D[o]) * k; D[o + 1] += (col[1] + j - D[o + 1]) * k; D[o + 2] += (col[2] + j - D[o + 2]) * k;
    D[o + 3] = na * 255;
  }
  function chalkStamp(cx, cy, r, cover) {
    const col = COLORS[color].rgb, x0 = Math.max(0, cx - r | 0), x1 = Math.min(W - 1, cx + r + 1 | 0), y0 = Math.max(0, cy - r | 0), y1 = Math.min(H - 1, cy + r + 1 | 0);
    const th = .78 - cover * .62, r2 = r * r;
    for (let y = y0; y <= y1; y++) {
      const dy = y - cy;
      for (let x = x0; x <= x1; x++) {
        const dx = x - cx, dd = (dx * dx + dy * dy) / r2;
        if (dd > 1) continue;
        const fall = dd < .5 ? 1 : 1 - (dd - .5) * 2, i = y * W + x, h = hgt[i] / 255;
        const prob = fall * clamp((h - th) * 2.6 + .1, 0, 1) * (.35 + cover * .55);
        if (Math.random() < prob) deposit(i, col, .45 + Math.random() * .4);
      }
    }
    mark(x0, y0, x1, y1);
  }
  function spongeStamp(cx, cy, r) {
    const x0 = Math.max(0, cx - r | 0), x1 = Math.min(W - 1, cx + r + 1 | 0), y0 = Math.max(0, cy - r | 0), y1 = Math.min(H - 1, cy + r + 1 | 0), r2 = r * r;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const dd = ((x - cx) ** 2 + (y - cy) ** 2) / r2; if (dd > 1) continue;
      const o = (y * W + x) * 4; D[o + 3] *= dd < .6 ? .55 + Math.random() * .2 : .85;
    }
    mark(x0, y0, x1, y1);
  }
  const tmp = new Uint8ClampedArray(4 * 200 * 200);
  function smudgeStamp(cx, cy, r, mx, my) {
    const m = Math.hypot(mx, my); if (m < .3) return;
    const k = Math.min(1, 10 / m); mx *= k; my *= k;
    const pad = Math.ceil(Math.abs(mx) + Math.abs(my)) + 2;
    const x0 = Math.max(0, cx - r - pad | 0), x1 = Math.min(W - 1, cx + r + pad + 1 | 0), y0 = Math.max(0, cy - r - pad | 0), y1 = Math.min(H - 1, cy + r + pad + 1 | 0);
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
    if (bw * bh * 4 > tmp.length) return;
    for (let y = 0; y < bh; y++) { const so = ((y0 + y) * W + x0) * 4; tmp.set(D.subarray(so, so + bw * 4), y * bw * 4); }
    const r2 = r * r;
    for (let y = Math.max(0, cy - r | 0); y <= Math.min(H - 1, cy + r + 1 | 0); y++) for (let x = Math.max(0, cx - r | 0); x <= Math.min(W - 1, cx + r + 1 | 0); x++) {
      const dd = ((x - cx) ** 2 + (y - cy) ** 2) / r2; if (dd > 1) continue;
      const f = (1 - dd) * .7;
      const sx = clamp(Math.round(x - mx) - x0, 0, bw - 1), sy = clamp(Math.round(y - my) - y0, 0, bh - 1);
      const so = (sy * bw + sx) * 4, sx2 = clamp(sx + 1, 0, bw - 1), so2 = (sy * bw + sx2) * 4, sy2 = clamp(sy + 1, 0, bh - 1), so3 = (sy2 * bw + sx) * 4;
      const sa = (tmp[so + 3] * 2 + tmp[so2 + 3] + tmp[so3 + 3]) / 4;
      const o = (y * W + x) * 4, ta = D[o + 3];
      const na = ta + (sa * .985 - ta) * f;
      if (na < 1) { D[o + 3] = 0; continue; }
      const wS = sa * f, wT = ta * (1 - f), tot = wS + wT || 1;
      for (let c = 0; c < 3; c++) D[o + c] = ((tmp[so + c] * 2 + tmp[so2 + c] + tmp[so3 + c]) / 4 * wS + D[o + c] * wT) / tot;
      D[o + 3] = na;
    }
    mark(x0, y0, x1, y1);
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
      end() { walk(mPrev.x, mPrev.y, pPrev.x, pPrev.y, raw().x, raw().y, prS, prS); },
      get vel() { return v; }
    };
    function raw() { return r0; }
  }
  let lastE = null, rS = null, speed = 0;
  const dust = [];
  const sampler = makeSampler(() => Math.max(1.5, (rS || size) * (tool === 'smudge' ? .2 : .32)), (x, y, pr, v) => {
    speed = v;
    const r = pr != null ? size * (.55 + pr * .6) : size;
    rS = rS == null ? r : rS + (r - rS) * .3;
    if (tool === 'chalk') {
      const cover = pr != null ? clamp(pr * 1.15, .1, 1) : clamp(.82 - v * .16, .3, .82);
      chalkStamp(x, y, rS, cover);
      if (Math.random() < .25 && dust.length < 140) dust.push({ x: x + (Math.random() - .5) * rS, y: y + (Math.random() - .5) * rS, vx: (Math.random() - .5) * .6, vy: .2 + Math.random() * .6, life: 1, c: COLORS[color].hex, s: 1 + Math.random() * 2.2 });
    } else if (tool === 'sponge') spongeStamp(x, y, rS * 1.6);
    else if (lastE) smudgeStamp(x, y, rS * 1.3, x - lastE.x, y - lastE.y);
    lastE = { x, y };
  });

  const undoStack = [];
  let backup = null;
  function beginUndo() { backup = D.slice(); strokeR = null; }
  function commitUndo() {
    if (!backup || !strokeR) { backup = null; return; }
    const { x0, y0, x1, y1 } = strokeR, w = x1 - x0 + 1, h = y1 - y0 + 1, data = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) { const so = ((y0 + y) * W + x0) * 4; data.set(backup.subarray(so, so + w * 4), y * w * 4); }
    undoStack.push({ x0, y0, w, h, data }); if (undoStack.length > 30) undoStack.shift();
    backup = null; strokeR = null;
  }
  function fullUndoEntry() { undoStack.push({ x0: 0, y0: 0, w: W, h: H, data: D.slice() }); if (undoStack.length > 30) undoStack.shift(); }
  function undo() {
    const e = undoStack.pop(); if (!e) { Curio.toast('Nothing to undo'); return; }
    if (raining) stopRain();
    for (let y = 0; y < e.h; y++) { const o = ((e.y0 + y) * W + e.x0) * 4; D.set(e.data.subarray(y * e.w * 4, (y + 1) * e.w * 4), o); }
    mark(e.x0, e.y0, e.x0 + e.w - 1, e.y0 + e.h - 1); strokeR = null; scheduleSave(); Curio.beep(330, .05, 'triangle', .07);
  }

  let scratch = null;
  function scratchOn() {
    if (Curio.muted || !Curio.audioContext) return;
    const ac = Curio.audioContext(); if (!ac) return;
    if (!scratch) { const len = ac.sampleRate, b = ac.createBuffer(1, len, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; scratch = { buf: b }; }
    scratchOff();
    const src = ac.createBufferSource(), bp = ac.createBiquadFilter(), gn = ac.createGain();
    src.buffer = scratch.buf; src.loop = true; bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = .9; gn.gain.value = 0;
    src.connect(bp).connect(gn).connect(ac.destination); src.start(); scratch.src = src; scratch.gn = gn; scratch.ac = ac;
  }
  function scratchLevel(v) { if (scratch && scratch.src) scratch.gn.gain.setTargetAtTime(Math.min(.06, v * .03), scratch.ac.currentTime, .03); }
  function scratchOff() { if (scratch && scratch.src) { try { scratch.gn.gain.setTargetAtTime(0, scratch.ac.currentTime, .02); scratch.src.stop(scratch.ac.currentTime + .1); } catch {} scratch.src = null; } }

  let drawing = false, activeId = null;
  function toDoc(e) { const r = cv.getBoundingClientRect(); const p = e.pointerType === 'pen' && e.pressure > 0; return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height, pr: p ? e.pressure : null, t: e.timeStamp || performance.now() }; }
  function down(e) {
    if (drawing) return;
    e.preventDefault();
    drawing = true; activeId = e.pointerId; lastE = null; rS = null;
    beginUndo(); sampler.begin(toDoc(e));
    if (tool === 'chalk') scratchOn();
  }
  function moveDraw(e) {
    if (!drawing) return;
    e.preventDefault();
    const list = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
    for (const ev of (list.length ? list : [e])) sampler.move(toDoc(ev));
    scratchLevel(sampler.vel);
  }
  function up() {
    if (!drawing) return;
    sampler.end(); drawing = false; activeId = null; commitUndo(); scratchOff(); scheduleSave();
  }
  Curio.drag(cv, { start: (p) => down(p.event), move: (p) => moveDraw(p.event), end: up });
  addEventListener('curio:touchpad', (e) => { if (e.detail) Curio.toast('Touchpad mode: click the pavement to put the chalk down, move to draw, click again to lift it', 3600); });

  let raining = false, rainLeft = 0, wet = 0, drops = [], splashes = [], fadeRow = 0;
  function startRain() {
    fullUndoEntry(); raining = true; rainLeft = 15; $('rain').setAttribute('aria-pressed', 'true'); $('rain').textContent = '☂️ Stop the rain';
    Curio.toast('Here it comes...'); rainSound(true);
  }
  function stopRain() { raining = false; $('rain').setAttribute('aria-pressed', 'false'); $('rain').textContent = '🌧️ Make it rain'; rainSound(false); scheduleSave(); }
  let rainSrc = null;
  function rainSound(on) {
    if (rainSrc) { try { rainSrc.g.gain.setTargetAtTime(0, rainSrc.ac.currentTime, .4); rainSrc.s.stop(rainSrc.ac.currentTime + 2); } catch {} rainSrc = null; }
    if (!on || Curio.muted || !Curio.audioContext) return;
    const ac = Curio.audioContext(); if (!ac) return;
    const len = ac.sampleRate * 2, b = ac.createBuffer(1, len, ac.sampleRate), d = b.getChannelData(0);
    let last = 0; for (let i = 0; i < len; i++) { last = last * .6 + (Math.random() * 2 - 1) * .4; d[i] = last + (Math.random() < .0008 ? (Math.random() - .5) * 3 : 0); }
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), gn = ac.createGain();
    s.buffer = b; s.loop = true; f.type = 'lowpass'; f.frequency.value = 3200; gn.gain.value = 0; gn.gain.setTargetAtTime(.12, ac.currentTime, .6);
    s.connect(f).connect(gn).connect(ac.destination); s.start(); rainSrc = { s, g: gn, ac };
  }
  function rainTick(dt) {
    if (raining) { rainLeft -= dt; wet = Math.min(1, wet + dt * .35); if (rainLeft <= 0) { stopRain(); Curio.toast('Washed clean. The sun comes out.'); } }
    else if (wet > 0) wet = Math.max(0, wet - dt * .07);
    if (!raining && !drops.length && !splashes.length) return;
    if (raining) {
      for (let k = 0; k < 6; k++) drops.push({ x: Math.random() * (W + 200) - 100, y: -40 - Math.random() * 200, v: 34 + Math.random() * 18, l: 30 + Math.random() * 40 });
      const n = 20 + (wet * 40 | 0);
      for (let k = 0; k < n; k++) {
        const x = Math.random() * W | 0, y = Math.random() * H | 0, r = 4 + Math.random() * 10 | 0;
        for (let yy = Math.max(0, y - r); yy <= Math.min(H - 2, y + r); yy++) for (let xx = Math.max(0, x - r); xx <= Math.min(W - 1, x + r); xx++) {
          if ((xx - x) ** 2 + (yy - y) ** 2 > r * r) continue;
          const o = (yy * W + xx) * 4; if (!D[o + 3]) continue;
          const a = D[o + 3] * (.62 + Math.random() * .25), b = o + W * 4;
          if (Math.random() < .35) { const ba = D[b + 3], nb = Math.min(255, ba + a * .25); if (nb > ba) { const kk = (nb - ba) / nb; D[b] += (D[o] - D[b]) * kk; D[b + 1] += (D[o + 1] - D[b + 1]) * kk; D[b + 2] += (D[o + 2] - D[b + 2]) * kk; D[b + 3] = nb; } }
          D[o + 3] = a < 6 ? 0 : a;
        }
        mark(x - r, y - r, x + r, y + r + 1);
        if (k < 3) splashes.push({ x, y, r: 2, life: 1 });
      }
      const rows = 25;
      for (let k = 0; k < rows; k++) {
        const y = fadeRow; fadeRow = (fadeRow + 37) % H;
        const o0 = y * W * 4, o1 = o0 + W * 4;
        for (let o = o0 + 3; o < o1; o += 4) if (D[o]) D[o] = D[o] * .96 < 4 ? 0 : D[o] * .96;
        mark(0, y, W - 1, y);
      }
    }
    for (const d of drops) d.y += d.v;
    drops = drops.filter((d) => d.y < H + 60);
    for (const s of splashes) { s.r += 1.6; s.life -= .06; }
    splashes = splashes.filter((s) => s.life > 0);
  }

  function hopscotch() {
    fullUndoEntry();
    const m = mk(), x = m.getContext('2d');
    x.strokeStyle = '#fff'; x.fillStyle = '#fff'; x.lineWidth = 11; x.lineCap = 'round'; x.lineJoin = 'round';
    const S = 130, cy = H / 2, sx = 150;
    const wob = (x0, y0, x1, y1) => { x.beginPath(); x.moveTo(x0 + (Math.random() - .5) * 4, y0 + (Math.random() - .5) * 4); x.quadraticCurveTo((x0 + x1) / 2 + (Math.random() - .5) * 8, (y0 + y1) / 2 + (Math.random() - .5) * 8, x1 + (Math.random() - .5) * 4, y1 + (Math.random() - .5) * 4); x.stroke(); };
    const box = (bx, by, n) => { wob(bx, by, bx + S, by); wob(bx + S, by, bx + S, by + S); wob(bx + S, by + S, bx, by + S); wob(bx, by + S, bx, by); x.save(); x.font = '900 72px "Comic Sans MS", "Chalkboard SE", "Marker Felt", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.translate(bx + S / 2, by + S / 2); x.rotate(-Math.PI / 2 + (Math.random() - .5) * .2); x.fillText(String(n), 0, 4); x.restore(); };
    let cx = sx, n = 1;
    for (const kind of [1, 1, 1, 2, 1, 2, 1, 1]) {
      if (kind === 1) box(cx, cy - S / 2, n++);
      else { box(cx, cy - S, n++); box(cx, cy, n++); }
      cx += S;
    }
    x.beginPath(); x.moveTo(cx, cy - S / 2); x.arc(cx, cy, S / 2, -Math.PI / 2, Math.PI / 2); x.stroke();
    x.save(); x.font = '900 34px "Comic Sans MS", "Chalkboard SE", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.translate(cx + 30, cy); x.rotate(-Math.PI / 2); x.fillText('HOME', 0, 0); x.restore();
    x.save(); x.font = '900 46px "Comic Sans MS", "Chalkboard SE", sans-serif'; x.textAlign = 'center'; x.translate(sx - 70, cy); x.rotate(-Math.PI / 2); x.fillText('START', 0, 0); x.restore();
    const md = x.getImageData(0, 0, W, H).data, col = COLORS[color === 0 ? 0 : color].rgb;
    for (let pass = 0; pass < 2; pass++) for (let i = 0; i < N; i++) {
      const a = md[i * 4 + 3]; if (!a) continue;
      const hh = hgt[i] / 255, prob = (a / 255) * clamp((hh - .18) * 2.6 + .1, 0, 1) * .75;
      if (Math.random() < prob) deposit(i, col, .5 + Math.random() * .4);
    }
    mark(0, 0, W - 1, H - 1); strokeR = null; scheduleSave();
    Curio.toast('Hop to it!'); Curio.beep(520, .06, 'triangle', .07); setTimeout(() => Curio.beep(780, .08, 'triangle', .07), 90);
  }
  async function hose() {
    const ok = await Curio.modal({ emoji: '🚿', title: 'Hose it down?', body: 'Everything gets washed off at once. Undo can bring it back.', buttons: [{ label: 'Spray it', value: true }, { label: 'Keep it', value: false }] });
    if (!ok) return;
    fullUndoEntry(); D.fill(0); mark(0, 0, W - 1, H - 1); strokeR = null; wet = 1; scheduleSave(); Curio.beep(240, .2, 'sine', .05);
  }

  function compose(ctx, live) {
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.drawImage(pave, 0, 0);
    ctx.drawImage(chalkC, 0, 0);
    if (wet > .01) {
      ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = `rgba(95,105,125,${wet * .55})`; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = clamp((wet - .3) * .4, 0, .22); ctx.drawImage(puddles, 0, 0);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
    if (!live) return;
    if (drops.length) {
      ctx.strokeStyle = 'rgba(220,232,255,.45)'; ctx.lineWidth = 2; ctx.beginPath();
      for (const d of drops) { ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - d.l * .12, d.y - d.l); }
      ctx.stroke();
    }
    for (const s of splashes) { ctx.strokeStyle = `rgba(230,240,255,${s.life * .6})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(s.x, s.y, s.r, s.r * .45, 0, 0, Math.PI * 2); ctx.stroke(); }
    for (const p of dust) { ctx.globalAlpha = p.life * .7; ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, p.s, p.s); }
    ctx.globalAlpha = 1;
  }
  let lastT = performance.now(), lastWet = -1, first = true;
  function loop(t) {
    const dt = Math.min(.05, (t - lastT) / 1000); lastT = t;
    if (!document.hidden) {
      rainTick(dt);
      for (const p of dust) { p.x += p.vx; p.y += p.vy; p.vy += .02; p.life -= .03; }
      for (let i = dust.length - 1; i >= 0; i--) if (dust[i].life <= 0) dust.splice(i, 1);
      const need = dirtyR || drops.length || splashes.length || dust.length || wet !== lastWet || first;
      if (dirtyR) { const r = dirtyR; cc.putImageData(img, 0, 0, r.x0, r.y0, r.x1 - r.x0 + 1, r.y1 - r.y0 + 1); dirtyR = null; }
      if (need) { compose(g, true); lastWet = wet; first = false; }
    }
    requestAnimationFrame(loop);
  }

  let saveT = 0;
  function scheduleSave() {
    clearTimeout(saveT);
    saveT = setTimeout(() => {
      Curio.store.set('chalk-art:state', { color, size });
      if (raining) return;
      try {
        if (dirtyR) { const r = dirtyR; cc.putImageData(img, 0, 0, r.x0, r.y0, r.x1 - r.x0 + 1, r.y1 - r.y0 + 1); dirtyR = null; }
        let url = chalkC.toDataURL('image/webp', .9);
        if (!url.startsWith('data:image/webp')) url = chalkC.toDataURL('image/png');
        if (url.length < 3500000) Curio.store.set('chalk-art:chalk', url);
      } catch {}
    }, 800);
  }
  function restore() {
    const url = Curio.store.get('chalk-art:chalk', null);
    if (!url) return;
    const im = new Image();
    im.onload = () => {
      const c = mk(), x = c.getContext('2d'); x.drawImage(im, 0, 0, W, H);
      D.set(x.getImageData(0, 0, W, H).data); mark(0, 0, W - 1, H - 1); strokeR = null;
    };
    im.src = url;
  }
  function savePng() {
    const c = mk(), x = c.getContext('2d'); compose(x, false);
    c.toBlob((b) => {
      if (!b) return;
      const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'curio-sidewalk-chalk.png';
      document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      Curio.toast('Snapped before the rain'); Curio.beep(880, .08, 'triangle', .08);
    }, 'image/png');
  }

  const pal = $('pal');
  COLORS.forEach((c, i) => {
    const b = document.createElement('button'); b.className = 'ch-stick'; b.style.background = c.hex; b.title = c.name; b.setAttribute('aria-label', c.name);
    b.addEventListener('click', () => { color = i; if (tool !== 'chalk') tool = 'chalk'; syncUi(); scheduleSave(); Curio.beep(1400 + i * 40, .02, 'triangle', .03); });
    pal.append(b);
  });
  function syncUi() {
    document.querySelectorAll('[data-tool]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tool === tool)));
    [...pal.children].forEach((b, i) => b.setAttribute('aria-pressed', String(i === color)));
    $('colName').textContent = COLORS[color].name; $('size').value = size; $('sizeV').textContent = size;
  }
  document.querySelectorAll('[data-tool]').forEach((b) => b.addEventListener('click', () => { tool = b.dataset.tool; syncUi(); }));
  $('size').addEventListener('input', (e) => { size = +e.target.value; $('sizeV').textContent = size; scheduleSave(); });
  $('rain').addEventListener('click', () => (raining ? stopRain() : startRain()));
  $('hop').addEventListener('click', hopscotch);
  $('undo').addEventListener('click', undo);
  $('hose').addEventListener('click', hose);
  $('save').addEventListener('click', savePng);
  addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); return; }
    if (e.key === '[') { size = Math.max(5, size - 3); syncUi(); }
    if (e.key === ']') { size = Math.min(48, size + 3); syncUi(); }
    if (e.key === 's' || e.key === 'S') { tool = 'smudge'; syncUi(); }
    if (e.key === 'c' || e.key === 'C') { tool = 'chalk'; syncUi(); }
    if (e.ctrlKey || e.metaKey || e.altKey || (e.target.closest && e.target.closest('input'))) return;
    if (e.key === 'w' || e.key === 'W') { tool = 'sponge'; syncUi(); }
    if (e.key === 'u' || e.key === 'U') undo();
    if (e.key === 'r' || e.key === 'R') $('rain').click();
    const n = '1234567890'.indexOf(e.key);
    if (n >= 0 && pal.children[n]) pal.children[n].click();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { scratchOff(); if (rainSrc) rainSound(false); } else if (raining) rainSound(true); });

  syncUi(); restore();
  if (!Curio.touchpad && !Curio.store.get('tp-hint-chalk-art', false) && matchMedia('(pointer: fine)').matches) { Curio.store.set('tp-hint-chalk-art', true); setTimeout(() => Curio.toast('Tip: on a laptop touchpad, turn on Touchpad mode in the top bar: click to put the chalk down, click again to lift it', 4200), 1800); }
  requestAnimationFrame(loop);
})();
