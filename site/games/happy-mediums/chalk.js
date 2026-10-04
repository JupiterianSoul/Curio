HM.mats = HM.mats || {};
HM.mats.chalk = () => {
  const { W, H, clamp, mk, makeSampler, ui, noiseBuffer, audio, adv } = HM.kit;
  const N = W * H;
  const KEY = 'happy-mediums:chalk';
  const COLORS = [
    ['#f6f3ea', 'Chalk White'], ['#ffb3c7', 'Bubblegum Pink'], ['#ff9f8a', 'Coral'], ['#ffc99a', 'Peach'],
    ['#fff0a0', 'Lemon Ice'], ['#d9f2a6', 'Pistachio'], ['#a8e6cf', 'Mint'], ['#9fe3e8', 'Aqua'],
    ['#a9cdf5', 'Sky'], ['#bfb3f0', 'Lavender'], ['#e3b3ef', 'Lilac'], ['#f7a8e0', 'Orchid']
  ].map(([hex, name]) => ({ hex, name, rgb: [1, 3, 5].map((i) => parseInt(hex.substr(i, 2), 16)) }));

  let hgt, pave, puddles, chalkC, cc, img, D;
  let dirtyR = null, strokeR = null, ready = false;
  const saved = Curio.store.get(KEY + ':state', {});
  let tool = 'chalk', color = saved.color ?? 0, size = saved.size || 16;
  const used = new Set();

  function build() {
    let seed = 5150;
    const srnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    hgt = new Uint8Array(N); pave = mk(); puddles = mk();
    const p = pave.getContext('2d'), hc = mk(), hx = hc.getContext('2d');
    const sm = mk(60, 40), s = sm.getContext('2d');
    for (let y = 0; y < 40; y++) for (let x = 0; x < 60; x++) { const v = 90 + srnd() * 80 | 0; s.fillStyle = `rgb(${v},${v},${v})`; s.fillRect(x, y, 1, 1); }
    hx.imageSmoothingQuality = 'high'; hx.drawImage(sm, 0, 0, W, H);
    const id = hx.getImageData(0, 0, W, H), d = id.data;
    for (let i = 0; i < N; i++) { const o = i * 4; let v = d[o] * .45 + srnd() * 150; if (srnd() < .02) v = 250; if (srnd() < .015) v = 20; d[o] = d[o + 1] = d[o + 2] = clamp(v, 0, 255); }
    hx.putImageData(id, 0, 0);
    p.fillStyle = '#a7a096'; p.fillRect(0, 0, W, H);
    const SL = 250;
    for (let y = 0; y < H; y += SL) for (let x = 0; x < W; x += SL) { const t = (srnd() - .5) * 16; p.fillStyle = `rgb(${167 + t},${160 + t},${150 + t})`; p.fillRect(x, y, SL, SL); }
    for (let k = 0; k < 40; k++) {
      const x = srnd() * W, y = srnd() * H, r = 30 + srnd() * 140, gr = p.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, srnd() < .5 ? 'rgba(80,72,62,.12)' : 'rgba(220,214,200,.14)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      p.fillStyle = gr; p.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (let k = 0; k < 9000; k++) { const c = srnd(); p.fillStyle = c < .4 ? 'rgba(70,64,58,.45)' : c < .8 ? 'rgba(225,220,210,.4)' : 'rgba(150,120,95,.5)'; const s2 = .8 + srnd() * 2.6; p.fillRect(srnd() * W, srnd() * H, s2, s2); }
    for (let k = 0; k < 14; k++) { const x = srnd() * W, y = srnd() * H, r = 4 + srnd() * 7; p.fillStyle = 'rgba(70,66,62,.55)'; p.beginPath(); p.ellipse(x, y, r, r * .8, srnd() * 3, 0, Math.PI * 2); p.fill(); }
    p.lineCap = 'round'; hx.lineCap = 'round';
    const joint = (x0, y0, x1, y1, ox, oy) => {
      p.strokeStyle = 'rgba(60,55,50,.55)'; p.lineWidth = 5; p.beginPath(); p.moveTo(x0, y0); p.lineTo(x1, y1); p.stroke();
      p.strokeStyle = 'rgba(230,225,215,.35)'; p.lineWidth = 2; p.beginPath(); p.moveTo(x0 + ox, y0 + oy); p.lineTo(x1 + ox, y1 + oy); p.stroke();
      hx.strokeStyle = '#000'; hx.lineWidth = 8; hx.beginPath(); hx.moveTo(x0, y0); hx.lineTo(x1, y1); hx.stroke();
    };
    for (let x = SL; x < W; x += SL) joint(x, 0, x, H, 3, 0);
    for (let y = SL; y < H; y += SL) joint(0, y, W, y, 0, 3);
    const crack = (x, y, a, len, w, depth) => {
      const pts = [[x, y]];
      for (let i = 0; i < len; i++) { a += (srnd() - .5) * .7; x += Math.cos(a) * 7; y += Math.sin(a) * 7; pts.push([x, y]); if (depth < 1 && srnd() < .03) crack(x, y, a + (srnd() < .5 ? 1 : -1) * (.6 + srnd() * .6), len * .5 | 0, w * .6, depth + 1); }
      for (const [ctx, col, lw, off] of [[p, 'rgba(230,224,212,.35)', w + 2.5, 1.5], [p, 'rgba(45,40,36,.85)', w, 0], [hx, '#000', w + 4, 0]]) {
        ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.beginPath(); pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py + off) : ctx.moveTo(px, py))); ctx.stroke();
      }
    };
    for (let k = 0; k < 4; k++) crack(srnd() * W, srnd() * H, srnd() * Math.PI * 2, 25 + srnd() * 45 | 0, 1.6 + srnd() * 1.4, 0);
    const hd = hx.getImageData(0, 0, W, H).data;
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
    chalkC = mk(); cc = chalkC.getContext('2d'); img = cc.createImageData(W, H); D = img.data;
    ready = true;
  }

  const mark = (x0, y0, x1, y1) => {
    x0 = clamp(x0 | 0, 0, W - 1); y0 = clamp(y0 | 0, 0, H - 1); x1 = clamp(Math.ceil(x1), 0, W - 1); y1 = clamp(Math.ceil(y1), 0, H - 1);
    if (!dirtyR) dirtyR = { x0, y0, x1, y1 }; else { dirtyR.x0 = Math.min(dirtyR.x0, x0); dirtyR.y0 = Math.min(dirtyR.y0, y0); dirtyR.x1 = Math.max(dirtyR.x1, x1); dirtyR.y1 = Math.max(dirtyR.y1, y1); }
    if (!strokeR) strokeR = { x0, y0, x1, y1 }; else { strokeR.x0 = Math.min(strokeR.x0, x0); strokeR.y0 = Math.min(strokeR.y0, y0); strokeR.x1 = Math.max(strokeR.x1, x1); strokeR.y1 = Math.max(strokeR.y1, y1); }
  };
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
        const fall = dd < .5 ? 1 : 1 - (dd - .5) * 2, i = y * W + x, hh = hgt[i] / 255;
        const prob = fall * clamp((hh - th) * 2.6 + .1, 0, 1) * (.35 + cover * .55);
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
      const so = (sy * bw + sx) * 4, so2 = (sy * bw + clamp(sx + 1, 0, bw - 1)) * 4, so3 = (clamp(sy + 1, 0, bh - 1) * bw + sx) * 4;
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

  let lastE = null, rS = null;
  const dust = [];
  const sampler = makeSampler(() => Math.max(1.5, (rS || size) * (tool === 'smudge' ? .2 : .32)), (x, y, pr, v) => {
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
    const { x0, y0, x1, y1 } = strokeR, w = x1 - x0 + 1, hh = y1 - y0 + 1, data = new Uint8ClampedArray(w * hh * 4);
    for (let y = 0; y < hh; y++) { const so = ((y0 + y) * W + x0) * 4; data.set(backup.subarray(so, so + w * 4), y * w * 4); }
    undoStack.push({ x0, y0, w, h: hh, data }); if (undoStack.length > 30) undoStack.shift();
    backup = null; strokeR = null;
  }
  function fullUndoEntry() { undoStack.push({ x0: 0, y0: 0, w: W, h: H, data: D.slice() }); if (undoStack.length > 20) undoStack.shift(); }

  let scratch = null;
  function scratchOn() {
    const ac = audio(); if (!ac) return;
    if (!scratch) scratch = { buf: noiseBuffer(ac, 1) };
    scratchOff();
    const src = ac.createBufferSource(), bp = ac.createBiquadFilter(), gn = ac.createGain();
    src.buffer = scratch.buf; src.loop = true; bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = .9; gn.gain.value = 0;
    src.connect(bp).connect(gn).connect(ac.destination); src.start(); scratch.src = src; scratch.gn = gn; scratch.ac = ac;
  }
  function scratchLevel(v) { if (scratch && scratch.src) scratch.gn.gain.setTargetAtTime(Math.min(.06, v * .03), scratch.ac.currentTime, .03); }
  function scratchOff() { if (scratch && scratch.src) { try { scratch.gn.gain.setTargetAtTime(0, scratch.ac.currentTime, .02); scratch.src.stop(scratch.ac.currentTime + .1); } catch {} scratch.src = null; } }

  let raining = false, rainLeft = 0, wet = 0, drops = [], splashes = [], fadeRow = 0, rainSrc = null, rainBtn = null;
  function startRain() { fullUndoEntry(); raining = true; rainLeft = 15; paintRain(); Curio.toast('Here it comes...'); rainSound(true); }
  function stopRain(done) { raining = false; paintRain(); rainSound(false); save(); if (done) Curio.toast('Washed clean. The sun comes out.'); }
  function paintRain() { if (rainBtn) { rainBtn.setAttribute('aria-pressed', String(raining)); rainBtn.textContent = raining ? 'Stop the rain' : 'Make it rain'; } }
  function rainSound(on) {
    if (rainSrc) { try { rainSrc.g.gain.setTargetAtTime(0, rainSrc.ac.currentTime, .4); rainSrc.s.stop(rainSrc.ac.currentTime + 2); } catch {} rainSrc = null; }
    const ac = on && audio(); if (!ac) return;
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), gn = ac.createGain();
    s.buffer = noiseBuffer(ac, 2, 'brown'); s.loop = true; f.type = 'lowpass'; f.frequency.value = 3200; gn.gain.value = 0; gn.gain.setTargetAtTime(.12, ac.currentTime, .6);
    s.connect(f).connect(gn).connect(ac.destination); s.start(); rainSrc = { s, g: gn, ac };
  }
  function rainTick(dt) {
    if (raining) { rainLeft -= dt; wet = Math.min(1, wet + dt * .35); if (rainLeft <= 0) stopRain(true); }
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
      for (let k = 0; k < 25; k++) {
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
    const font = (px) => `900 ${px}px "Comic Sans MS", "Chalkboard SE", "Marker Felt", sans-serif`;
    const box = (bx, by, n) => { wob(bx, by, bx + S, by); wob(bx + S, by, bx + S, by + S); wob(bx + S, by + S, bx, by + S); wob(bx, by + S, bx, by); x.save(); x.font = font(72); x.textAlign = 'center'; x.textBaseline = 'middle'; x.translate(bx + S / 2, by + S / 2); x.rotate(-Math.PI / 2 + (Math.random() - .5) * .2); x.fillText(String(n), 0, 4); x.restore(); };
    let cx = sx, n = 1;
    for (const kind of [1, 1, 1, 2, 1, 2, 1, 1]) { if (kind === 1) box(cx, cy - S / 2, n++); else { box(cx, cy - S, n++); box(cx, cy, n++); } cx += S; }
    x.beginPath(); x.moveTo(cx, cy - S / 2); x.arc(cx, cy, S / 2, -Math.PI / 2, Math.PI / 2); x.stroke();
    x.save(); x.font = font(34); x.textAlign = 'center'; x.textBaseline = 'middle'; x.translate(cx + 30, cy); x.rotate(-Math.PI / 2); x.fillText('HOME', 0, 0); x.restore();
    x.save(); x.font = font(46); x.textAlign = 'center'; x.translate(sx - 70, cy); x.rotate(-Math.PI / 2); x.fillText('START', 0, 0); x.restore();
    const md = x.getImageData(0, 0, W, H).data, col = COLORS[color].rgb;
    for (let pass = 0; pass < 2; pass++) for (let i = 0; i < N; i++) {
      const a = md[i * 4 + 3]; if (!a) continue;
      const hh = hgt[i] / 255, prob = (a / 255) * clamp((hh - .18) * 2.6 + .1, 0, 1) * .75;
      if (Math.random() < prob) deposit(i, col, .5 + Math.random() * .4);
    }
    used.add(color); mark(0, 0, W - 1, H - 1); strokeR = null; save();
    Curio.toast('Hop to it!'); Curio.beep(520, .06, 'triangle', .07); setTimeout(() => Curio.beep(780, .08, 'triangle', .07), 90);
  }

  let saveT = 0;
  function save() {
    clearTimeout(saveT);
    saveT = setTimeout(() => {
      Curio.store.set(KEY + ':state', { color, size });
      if (raining || !ready) return;
      try {
        flush();
        let url = chalkC.toDataURL('image/webp', .85);
        if (!url.startsWith('data:image/webp')) url = chalkC.toDataURL('image/png');
        if (url.length < 2500000) Curio.store.set(KEY + ':art', url);
      } catch {}
    }, 800);
  }
  function flush() { if (dirtyR) { const r = dirtyR; cc.putImageData(img, 0, 0, r.x0, r.y0, r.x1 - r.x0 + 1, r.y1 - r.y0 + 1); dirtyR = null; } }
  function restore() {
    const url = Curio.store.get(KEY + ':art', null);
    if (!url) return;
    const im = new Image();
    im.onload = () => { const c = mk(), x = c.getContext('2d'); x.drawImage(im, 0, 0, W, H); D.set(x.getImageData(0, 0, W, H).data); mark(0, 0, W - 1, H - 1); strokeR = null; };
    im.src = url;
  }

  let toolSeg, sw, sizeS, nameEl, first = true, lastWet = -1;
  const sync = () => {
    if (toolSeg) toolSeg.set(tool);
    if (sw) sw.set(color);
    if (sizeS) sizeS.set(size);
    if (nameEl) nameEl.textContent = COLORS[color].name;
  };

  return {
    id: 'chalk', name: 'Sidewalk Chalk', surface: 'Pavement', verb: 'chalk',
    clearCopy: { title: 'Hose it down?', body: 'Everything gets washed off the pavement at once. Undo can bring it back.', yes: 'Spray it', no: 'Keep it' },
    saveMsg: 'Snapped before the rain',
    colors: COLORS,
    get used() { return used.size; },
    init() { if (!ready) { build(); restore(); } },
    panel(host) {
      const tools = [{ id: 'chalk', label: 'Chalk', title: 'Chalk (C)' }, { id: 'smudge', label: 'Smudge', title: 'Smudge with a finger (S)' }];
      if (adv()) tools.push({ id: 'sponge', label: 'Sponge', title: 'Wet sponge (W)' });
      toolSeg = ui.seg(tools, tool, (t) => { tool = t; sync(); }, 'Tool');
      host.append(toolSeg.el);
      const f = ui.field('Chalk box', COLORS[color].name); nameEl = f.side;
      sw = ui.swatches(COLORS, 'hm-sticks', (i) => { color = i; tool = 'chalk'; sync(); save(); Curio.beep(1400 + i * 40, .02, 'triangle', .03); }, 6);
      f.append(sw.el); host.append(f);
      const fs = ui.field('Stick size', String(size));
      sizeS = ui.slider(5, 48, size, (v) => { size = v; fs.side.textContent = v; save(); }, 'Stick size');
      fs.append(sizeS.el); host.append(fs);
      const row = HM.kit.h('div', 'hm-extras');
      rainBtn = ui.btn('Make it rain', () => (raining ? stopRain() : startRain()), 'hm-rain');
      row.append(rainBtn);
      if (adv()) row.append(ui.btn('Draw a hopscotch', hopscotch));
      host.append(row);
      paintRain(); sync();
    },
    tip: 'Press lightly for dusty strokes, harder for solid colour. Fast strokes skip over the bumps. The rain always wins.',
    keys: 'C chalk, S smudge, W sponge, R rain, 1 to 0 colours',
    down(p) { lastE = null; rS = null; beginUndo(); sampler.begin(p); if (tool === 'chalk') { used.add(color); scratchOn(); } },
    move(p) { sampler.move(p); scratchLevel(sampler.vel); },
    up() { sampler.end(); commitUndo(); scratchOff(); save(); },
    hover() {},
    frame(dt) {
      rainTick(dt);
      for (const p of dust) { p.x += p.vx; p.y += p.vy; p.vy += .02; p.life -= .03; }
      for (let i = dust.length - 1; i >= 0; i--) if (dust[i].life <= 0) dust.splice(i, 1);
      const need = dirtyR || drops.length || splashes.length || dust.length || wet !== lastWet || first;
      flush(); lastWet = wet; first = false;
      return !!need;
    },
    draw(ctx, live) {
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      ctx.drawImage(pave, 0, 0); flush(); ctx.drawImage(chalkC, 0, 0);
      if (wet > .01) {
        ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = `rgba(95,105,125,${wet * .55})`; ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = clamp((wet - .3) * .4, 0, .22); ctx.drawImage(puddles, 0, 0);
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      }
      if (!live) return;
      if (drops.length) { ctx.strokeStyle = 'rgba(220,232,255,.45)'; ctx.lineWidth = 2; ctx.beginPath(); for (const d of drops) { ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - d.l * .12, d.y - d.l); } ctx.stroke(); }
      for (const s of splashes) { ctx.strokeStyle = `rgba(230,240,255,${s.life * .6})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(s.x, s.y, s.r, s.r * .45, 0, 0, Math.PI * 2); ctx.stroke(); }
      for (const p of dust) { ctx.globalAlpha = p.life * .7; ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, p.s, p.s); }
      ctx.globalAlpha = 1;
    },
    undo() {
      const e = undoStack.pop(); if (!e) return false;
      if (raining) stopRain();
      for (let y = 0; y < e.h; y++) { const o = ((e.y0 + y) * W + e.x0) * 4; D.set(e.data.subarray(y * e.w * 4, (y + 1) * e.w * 4), o); }
      mark(e.x0, e.y0, e.x0 + e.w - 1, e.y0 + e.h - 1); strokeR = null; save(); return true;
    },
    clear() { fullUndoEntry(); D.fill(0); mark(0, 0, W - 1, H - 1); strokeR = null; wet = 1; used.clear(); save(); Curio.beep(240, .2, 'sine', .05); },
    resize(d) { size = clamp(size + d * 3, 5, 48); sync(); },
    key(k) {
      if (k === 'c') { tool = 'chalk'; sync(); return true; }
      if (k === 's') { tool = 'smudge'; sync(); return true; }
      if (k === 'w' && adv()) { tool = 'sponge'; sync(); return true; }
      if (k === 'r') { raining ? stopRain() : startRain(); return true; }
      const n = '1234567890'.indexOf(k);
      if (n >= 0) { color = n; tool = 'chalk'; sync(); return true; }
      return false;
    },
    pause() { scratchOff(); if (rainSrc) rainSound(false); },
    resume() { if (raining) rainSound(true); }
  };
};
