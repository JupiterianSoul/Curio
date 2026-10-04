(() => {
  const W = 1650, H = 1100;
  const $ = (id) => document.getElementById(id);
  const cv = $('cv'), g = cv.getContext('2d');
  cv.width = W; cv.height = H;
  const mk = (w = W, h = H) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let seed = 20240917;
  const srnd = () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

  const paper = mk();
  (function makePaper() {
    const p = paper.getContext('2d');
    p.fillStyle = '#f3ecda'; p.fillRect(0, 0, W, H);
    const sm = mk(44, 30), s = sm.getContext('2d');
    for (let y = 0; y < 30; y++) for (let x = 0; x < 44; x++) {
      s.fillStyle = `rgba(${150 + srnd() * 70 | 0},${128 + srnd() * 60 | 0},${88 + srnd() * 50 | 0},${srnd() * .55})`;
      s.fillRect(x, y, 1, 1);
    }
    p.globalAlpha = .16; p.imageSmoothingQuality = 'high'; p.drawImage(sm, 0, 0, W, H); p.globalAlpha = 1;
    p.lineCap = 'round';
    for (let i = 0; i < 2600; i++) {
      const x = srnd() * W, y = srnd() * H, a = srnd() * Math.PI * 2, len = 6 + srnd() * srnd() * 110;
      const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len;
      const cx = (x + ex) / 2 + (srnd() - .5) * len * .5, cy = (y + ey) / 2 + (srnd() - .5) * len * .5;
      p.strokeStyle = srnd() < .7 ? `rgba(255,253,244,${.25 + srnd() * .4})` : `rgba(115,92,60,${.04 + srnd() * .08})`;
      p.lineWidth = .4 + srnd() * 1.3;
      p.beginPath(); p.moveTo(x, y); p.quadraticCurveTo(cx, cy, ex, ey); p.stroke();
    }
    for (let i = 0; i < 160; i++) {
      const x = srnd() * W, y = srnd() * H, a = srnd() * Math.PI * 2, len = 60 + srnd() * 220;
      p.strokeStyle = `rgba(120,98,66,${.05 + srnd() * .07})`; p.lineWidth = .6 + srnd() * .9;
      p.beginPath(); p.moveTo(x, y);
      p.bezierCurveTo(x + Math.cos(a + .6) * len * .4, y + Math.sin(a + .6) * len * .4, x + Math.cos(a - .5) * len * .7, y + Math.sin(a - .5) * len * .7, x + Math.cos(a) * len, y + Math.sin(a) * len);
      p.stroke();
    }
    const id = p.getImageData(0, 0, W, H), d = id.data;
    for (let i = 0; i < d.length; i += 4) { const n = (srnd() - .5) * 13; d[i] += n; d[i + 1] += n; d[i + 2] += n * .9; }
    p.putImageData(id, 0, 0);
    const vg = p.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, W * .72);
    vg.addColorStop(0, 'rgba(120,95,60,0)'); vg.addColorStop(1, 'rgba(120,95,60,.13)');
    p.fillStyle = vg; p.fillRect(0, 0, W, H);
  })();

  const ink = mk(), ic = ink.getContext('2d');
  const wet = mk(), wc = wet.getContext('2d');
  const white = (c) => { c.save(); c.globalCompositeOperation = 'source-over'; c.fillStyle = '#fff'; c.fillRect(0, 0, W, H); c.restore(); };
  white(ic); white(wc);
  wc.lineCap = 'round'; wc.lineJoin = 'round'; wc.globalCompositeOperation = 'darken';

  const TONE = [];
  for (let k = 0; k <= 255; k++) { const d = k / 255; TONE.push(`rgb(${Math.round(255 - d * 236)},${Math.round(255 - d * 238)},${Math.round(255 - d * 233)})`); }
  const tone = (d) => TONE[clamp(Math.round(d * 255), 0, 255)];

  const saved = Curio.store.get('ink-painting:state', {});
  let size = saved.size || 26, water = saved.water ?? .12, autoDip = saved.autoDip ?? true, initials = saved.initials || 'ME';
  let seals = Array.isArray(saved.seals) ? saved.seals : [];
  let load = 1, placing = false, hover = null;

  const NB = 60;
  let bristles = [];
  function newBristles() {
    bristles = Array.from({ length: NB }, () => {
      const a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * .96;
      return { ox: Math.cos(a) * rr, oy: Math.sin(a) * rr, w: .2 + Math.random() * .32, load: .72 + Math.random() * .28, thr: Math.random() * .4 * (rr * .7 + .3), tn: .78 + Math.random() * .22, on: true, x: 0, y: 0, has: false };
    });
  }
  newBristles();

  function makeSampler(spacing, emit, K = .5) {
    let sm, raw, pPrev, mPrev, left = 0, vel = 0, prS = null;
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
          emit(px, py, pa == null ? null : pa + (pb - pa) * t, vel, false);
          d = Math.hypot(x - px, y - py); left = 0; sp = spacing();
        }
        left += d; px = x; py = y;
      }
    }
    return {
      begin(p) { raw = p; sm = { x: p.x, y: p.y }; pPrev = sm; mPrev = sm; left = 0; vel = 0; prS = p.pr; emit(p.x, p.y, p.pr, 0, true); },
      move(p) {
        const dt = Math.max(1, p.t - raw.t);
        vel += (Math.min(Math.hypot(p.x - raw.x, p.y - raw.y) / dt, 8) - vel) * .3; raw = p;
        const prOld = prS; prS = p.pr == null ? null : (prS == null ? p.pr : prS + (p.pr - prS) * .5);
        sm = { x: sm.x + (p.x - sm.x) * K, y: sm.y + (p.y - sm.y) * K };
        const mid = { x: (pPrev.x + sm.x) / 2, y: (pPrev.y + sm.y) / 2 };
        walk(mPrev.x, mPrev.y, pPrev.x, pPrev.y, mid.x, mid.y, prOld, prS);
        mPrev = mid; pPrev = sm;
      },
      end() { walk(mPrev.x, mPrev.y, pPrev.x, pPrev.y, raw.x, raw.y, prS, prS); },
      decay(f) { vel *= f; },
      get vel() { return vel; }
    };
  }

  let rS = null, strokeLen = 0, lastDab = null, prevDab = null, bb = null, spots = [], wetPending = false, recent = null, wetAmt = 0, passes = 0, passT = 0;
  const fibre = mk(), small = mk(400, 400), tmp = mk();
  const fc = fibre.getContext('2d'), sc = small.getContext('2d'), tc = tmp.getContext('2d');
  (function makeFibre() {
    fc.fillStyle = 'rgb(232,232,232)'; fc.fillRect(0, 0, W, H); fc.lineCap = 'round';
    for (let i = 0; i < 5200; i++) {
      const x = srnd() * W, y = srnd() * H, a = srnd() * Math.PI * 2, len = 5 + srnd() * srnd() * 70;
      const v = 110 + srnd() * 90 | 0; fc.strokeStyle = `rgb(${v},${v},${v})`; fc.lineWidth = .5 + srnd() * 1.1;
      fc.beginPath(); fc.moveTo(x, y); fc.quadraticCurveTo(x + Math.cos(a + .4) * len * .5, y + Math.sin(a + .4) * len * .5, x + Math.cos(a) * len, y + Math.sin(a) * len); fc.stroke();
    }
  })();
  function bleedPass(box, amt) {
    if (!box) return;
    const x = clamp(Math.floor(box.x0), 0, W), y = clamp(Math.floor(box.y0), 0, H);
    const w = clamp(Math.ceil(box.x1), 0, W) - x, h = clamp(Math.ceil(box.y1), 0, H) - y;
    if (w < 2 || h < 2) return;
    const f = water > .55 ? 1 / 6 : water > .25 ? 1 / 4.5 : 1 / 3.2;
    let sw = Math.max(1, Math.ceil(w * f)), sh = Math.max(1, Math.ceil(h * f));
    if (sw > 400 || sh > 400) { const k = Math.min(400 / sw, 400 / sh); sw = Math.max(1, Math.floor(sw * k)); sh = Math.max(1, Math.floor(sh * k)); }
    sc.imageSmoothingQuality = 'high'; sc.fillStyle = '#fff'; sc.fillRect(0, 0, sw + 1, sh + 1);
    sc.drawImage(wet, x, y, w, h, 0, 0, sw, sh);
    tc.globalCompositeOperation = 'source-over'; tc.imageSmoothingEnabled = true; tc.imageSmoothingQuality = 'high';
    tc.drawImage(small, 0, 0, sw, sh, x, y, w, h);
    tc.globalCompositeOperation = 'lighten'; tc.drawImage(fibre, x, y, w, h, x, y, w, h);
    wc.globalAlpha = clamp(amt, 0, 1); wc.drawImage(tmp, x, y, w, h, x, y, w, h); wc.globalAlpha = 1;
    grow(x + w / 2, y + h / 2, 0); dirty = true;
  }
  function grow(x, y, r) {
    if (!bb) bb = { x0: x - r, y0: y - r, x1: x + r, y1: y + r };
    else { bb.x0 = Math.min(bb.x0, x - r); bb.y0 = Math.min(bb.y0, y - r); bb.x1 = Math.max(bb.x1, x + r); bb.y1 = Math.max(bb.y1, y + r); }
  }
  function radiusFor(pr, v) {
    let r = pr != null ? size * (.1 + 1.08 * Math.pow(clamp(pr, 0, 1), 1.25)) : size * clamp(1.22 - v * .55, .3, 1.22);
    r *= Math.min(1, .42 + strokeLen / (size * 2.6));
    rS = rS == null ? r : rS + (r - rS) * .22;
    return rS;
  }
  function dab(x, y, pr, v, first, rForce) {
    const r = rForce != null ? rForce : radiusFor(pr, v);
    if (lastDab) { const ds = Math.hypot(x - lastDab.x, y - lastDab.y); strokeLen += ds; load = Math.max(0, load - ds * (.00018 + r * .0000075) * (1.3 - water * .65)); }
    prevDab = lastDab; lastDab = { x, y, r };
    const dens = 1 - water * .87;
    const spread = 1 + Math.max(0, water - .45) * 1.5;
    for (const b of bristles) {
      const bx = x + b.ox * r + (Math.random() - .5) * r * .05, by = y + b.oy * r + (Math.random() - .5) * r * .05;
      const eff = load * b.load - b.thr;
      if (eff <= 0) b.on = false;
      else if (eff < .2) { if (b.on && Math.random() < .1) b.on = false; else if (!b.on && Math.random() < eff * 1.5) b.on = true; }
      else b.on = true;
      if (b.on && (b.has || first)) {
        wc.strokeStyle = tone(dens * Math.min(1, .55 + eff * 1.5) * b.tn);
        wc.lineWidth = Math.max(.7, r * b.w * spread);
        wc.beginPath(); wc.moveTo(b.has ? b.x : bx, b.has ? b.y : by); wc.lineTo(bx + .01, by); wc.stroke();
      }
      b.x = bx; b.y = by; b.has = true;
    }
    grow(x, y, r * 2.4 + 30);
    const m = r * 1.6 + 14;
    if (!recent) recent = { x0: x - m, y0: y - m, x1: x + m, y1: y + m };
    else { recent.x0 = Math.min(recent.x0, x - m); recent.y0 = Math.min(recent.y0, y - m); recent.x1 = Math.max(recent.x1, x + m); recent.y1 = Math.max(recent.y1, y + m); }
    wetPending = true; wetAmt = Math.max(wetAmt, (.35 + water * .65) * clamp(load * 1.3, .2, 1));
    dirty = true;
  }
  function addSpot(x, y, r, boost) {
    const wl = clamp(load * 1.2, .15, 1);
    spots.push({ x, y, r, d: (1 - water * .87) * wl, grow: (.13 + water * .55) * wl * boost, life: (.35 + water * 1.3) * boost * 1000, age: 0, stage: 0 });
  }
  function drawSpotStage(s, k) {
    const rad = s.r * (1 + s.grow * k);
    const gr = wc.createRadialGradient(s.x, s.y, s.r * .55, s.x, s.y, rad);
    gr.addColorStop(0, tone(s.d * .55)); gr.addColorStop(.7, tone(s.d * .3)); gr.addColorStop(1, '#fff');
    wc.fillStyle = gr; wc.beginPath(); wc.arc(s.x, s.y, rad, 0, Math.PI * 2); wc.fill();
    if (k > .3 && Math.random() < .5 + water * .5) {
      const n = 1 + (Math.random() * (2 + water * 4) | 0);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, r0 = rad * (.75 + Math.random() * .15), r1 = rad * (1.01 + Math.random() * (.12 + water * .4));
        const bend = (Math.random() - .5) * .25;
        wc.strokeStyle = tone(s.d * (.1 + Math.random() * .16)); wc.lineWidth = .5 + Math.random() * .7;
        wc.beginPath(); wc.moveTo(s.x + Math.cos(a) * r0, s.y + Math.sin(a) * r0);
        wc.quadraticCurveTo(s.x + Math.cos(a + bend) * (r0 + r1) / 2, s.y + Math.sin(a + bend) * (r0 + r1) / 2, s.x + Math.cos(a + bend * 1.6) * r1, s.y + Math.sin(a + bend * 1.6) * r1);
        wc.stroke();
      }
    }
  }
  function tickSpots(dt) {
    if (!spots.length) return;
    for (const s of spots) {
      s.age += dt;
      const k = Math.min(1, s.age / s.life), want = Math.min(3, Math.floor(k * 3) + 1);
      while (s.stage < want) { s.stage++; drawSpotStage(s, s.stage / 3); }
    }
    spots = spots.filter((s) => s.age < s.life);
    dirty = true;
  }
  function finalizeSpots() { for (const s of spots) while (s.stage < 3) { s.stage++; drawSpotStage(s, s.stage / 3); } spots = []; while (wetPending && passes < 2 + Math.round(water * 3)) { passes++; bleedPass(bb, wetAmt * (.6 - passes * .07)); } }

  const undoStack = [];
  function pushUndo(entry) { undoStack.push(entry); if (undoStack.length > 30) undoStack.shift(); }
  function merge() {
    if (!wetPending) return;
    finalizeSpots();
    if (bb) {
      const x = clamp(Math.floor(bb.x0), 0, W), y = clamp(Math.floor(bb.y0), 0, H);
      const w = clamp(Math.ceil(bb.x1), 0, W) - x, h = clamp(Math.ceil(bb.y1), 0, H) - y;
      if (w > 0 && h > 0) {
        pushUndo({ type: 'px', x, y, data: ic.getImageData(x, y, w, h) });
        ic.globalCompositeOperation = 'multiply'; ic.drawImage(wet, x, y, w, h, x, y, w, h); ic.globalCompositeOperation = 'source-over';
        wc.save(); wc.globalCompositeOperation = 'source-over'; wc.fillStyle = '#fff'; wc.fillRect(x, y, w, h); wc.restore();
      }
    }
    bb = null; wetPending = false; dirty = true; scheduleSave();
  }

  const sampler = makeSampler(() => Math.max(1.1, (rS || size) * .1), (x, y, pr, v, first) => dab(x, y, pr, v, first));
  let drawing = false, activeId = null, lastMoveT = 0, stillT = 0;
  function toDoc(e) {
    const r = cv.getBoundingClientRect();
    const pen = e.pointerType === 'pen' && e.pressure > 0;
    return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height, pr: pen ? e.pressure : null, t: e.timeStamp || performance.now() };
  }
  function startStroke(e) {
    if (drawing) return;
    e.preventDefault();
    const p = toDoc(e);
    if (placing) { stampSeal(p.x, p.y); dropDrag(); return; }
    merge();
    drawing = true; activeId = e.pointerId;
    if (autoDip) dipBrush(true);
    for (const b of bristles) { b.has = false; b.on = true; }
    rS = null; strokeLen = 0; recent = null; wetAmt = 0; passes = 0; passT = 0; lastDab = null; prevDab = null; stillT = 0; lastMoveT = performance.now();
    sampler.begin(p);
  }
  cv.addEventListener('pointermove', (e) => {
    hover = toDoc(e);
    if (placing) dirty = true;
  });
  function moveStroke(e) {
    if (!drawing) return;
    hover = toDoc(e);
    e.preventDefault();
    const list = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
    for (const ev of (list.length ? list : [e])) sampler.move(toDoc(ev));
    lastMoveT = performance.now(); stillT = 0;
  }
  function endStroke() {
    if (!drawing) return;
    sampler.end();
    if (lastDab && prevDab) {
      let dx = lastDab.x - prevDab.x, dy = lastDab.y - prevDab.y; const m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m;
      const v = sampler.vel, r0 = lastDab.r, len = r0 * (.5 + Math.min(v, 3) * .9) + 6;
      const steps = Math.max(3, Math.ceil(len / Math.max(1.2, r0 * .12)));
      let x = lastDab.x, y = lastDab.y;
      for (let i = 1; i <= steps; i++) { x += dx * len / steps; y += dy * len / steps; dab(x, y, null, v, false, r0 * Math.pow(1 - i / steps, 1.4) + .4); }
    }
    drawing = false; activeId = null; updateMeter();
  }
  let unDrag = null;
  const bindDrag = () => { unDrag = Curio.drag(cv, { start: (p) => startStroke(p.event), move: (p) => moveStroke(p.event), end: () => endStroke() }); };
  function dropDrag() { if (unDrag) unDrag(); cv.classList.remove('curio-latched'); bindDrag(); }
  bindDrag();
  addEventListener('curio:touchpad', (e) => { if (e.detail) Curio.toast('Touchpad mode: click the paper to touch the brush down, move to paint, click again to lift it', 3600); });
  cv.addEventListener('pointerleave', () => { hover = null; if (placing) dirty = true; });

  function dipBrush(quiet) {
    load = 1; newBristles(); updateMeter();
    if (!quiet) { Curio.beep(180, .12, 'sine', .07); Curio.toast('Brush dipped in the inkstone'); }
  }
  function updateMeter() { $('meter').style.width = `${Math.round(load * 100)}%`; $('loadV').textContent = `${Math.round(load * 100)}%`; }

  const sealCache = new Map();
  function sealImage(text) {
    const key = text; if (sealCache.has(key)) return sealCache.get(key);
    const S = 220, c = mk(S, S), s = c.getContext('2d');
    let r = 1337 + [...text].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7);
    const rr = () => { r = (r * 16807) % 2147483647; return r / 2147483647; };
    s.fillStyle = '#c4231b';
    s.beginPath();
    const m = 14, pts = [];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 12; j++) {
      const t = j / 12, j1 = (rr() - .5) * 5;
      const [x, y] = i === 0 ? [m + t * (S - 2 * m), m + j1] : i === 1 ? [S - m + j1, m + t * (S - 2 * m)] : i === 2 ? [S - m - t * (S - 2 * m), S - m + j1] : [m + j1, S - m - t * (S - 2 * m)];
      pts.push([x, y]);
    }
    pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); s.closePath(); s.fill();
    s.globalCompositeOperation = 'destination-out';
    const ch = [...(text || '?').toUpperCase()].slice(0, 4);
    s.textAlign = 'center'; s.textBaseline = 'middle'; s.fillStyle = '#000';
    const font = (px) => `900 ${px}px "Songti SC", "STSong", Georgia, "Times New Roman", serif`;
    const cells = ch.length === 1 ? [[S / 2, S / 2, 150]] : ch.length === 2 ? [[S / 2, S * .31, 92], [S / 2, S * .69, 92]] : ch.length === 3 ? [[S * .67, S * .31, 82], [S * .67, S * .69, 82], [S * .32, S / 2, 100]] : [[S * .67, S * .31, 82], [S * .67, S * .69, 82], [S * .33, S * .31, 82], [S * .33, S * .69, 82]];
    ch.forEach((cc, i) => { const [x, y, fs] = cells[i]; s.font = font(fs); s.fillText(cc, x, y + fs * .04); });
    for (let i = 0; i < 260; i++) { s.globalAlpha = .3 + rr() * .7; s.beginPath(); s.arc(rr() * S, rr() * S, .5 + rr() * 2.2, 0, Math.PI * 2); s.fill(); }
    for (let i = 0; i < 70; i++) { const e = rr() * 4 | 0, t = rr() * S; s.globalAlpha = .6; s.beginPath(); s.arc(e === 0 ? t : e === 1 ? S - m + rr() * 3 : e === 2 ? t : m - rr() * 3, e === 0 ? m - rr() * 3 : e === 1 ? t : e === 2 ? S - m + rr() * 3 : t, 1 + rr() * 3, 0, Math.PI * 2); s.fill(); }
    s.globalAlpha = 1;
    sealCache.set(key, c); return c;
  }
  function drawSeal(ctx, sl, alpha) {
    const img = sealImage(sl.text), sz = sl.size || 120;
    ctx.save(); ctx.globalAlpha = alpha; ctx.globalCompositeOperation = 'multiply';
    ctx.translate(sl.x, sl.y); ctx.rotate(sl.rot || 0); ctx.drawImage(img, -sz / 2, -sz / 2, sz, sz); ctx.restore();
  }
  function stampSeal(x, y) {
    const text = (initials || 'ME').toUpperCase();
    seals.push({ x: clamp(x, 60, W - 60), y: clamp(y, 60, H - 60), text, size: 120, rot: (Math.random() - .5) * .07 });
    pushUndo({ type: 'seal' });
    setPlacing(false); dirty = true; scheduleSave();
    Curio.beep(110, .1, 'triangle', .14); setTimeout(() => Curio.beep(70, .08, 'sine', .1), 40);
    Curio.toast('Signed. Very official.');
  }
  function setPlacing(v) { placing = v; $('stamp').setAttribute('aria-pressed', String(v)); $('placing').classList.toggle('on', v); dirty = true; }

  let dirty = true;
  function present() {
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    g.drawImage(paper, 0, 0);
    g.globalCompositeOperation = 'multiply';
    g.drawImage(ink, 0, 0);
    if (wetPending) g.drawImage(wet, 0, 0);
    g.globalCompositeOperation = 'source-over';
    for (const sl of seals) drawSeal(g, sl, .93);
    if (placing && hover) drawSeal(g, { x: hover.x, y: hover.y, text: (initials || 'ME').toUpperCase(), size: 120 }, .45);
  }
  let lastT = performance.now();
  function loop(t) {
    const dt = Math.min(64, t - lastT); lastT = t;
    if (!document.hidden) {
      if (drawing) {
        sampler.decay(Math.pow(.9, dt / 16));
        if (t - lastMoveT > 140 && lastDab) { stillT += dt; if (stillT > 110) { stillT = 0; addSpot(lastDab.x, lastDab.y, lastDab.r * (1 + Math.random() * .1), 1.6); grow(lastDab.x, lastDab.y, lastDab.r * 4 + 40); load = Math.max(0, load - .012); } }
        updateMeter();
      }
      tickSpots(dt);
      passT += dt;
      if (drawing && recent && passT > 110) { passT = 0; bleedPass(recent, wetAmt * .55); recent = null; }
      if (!drawing && wetPending && passT > 140) {
        passT = 0;
        if (passes < 2 + Math.round(water * 3)) { passes++; bleedPass(bb, wetAmt * (.6 - passes * .07)); }
        else if (!spots.length) merge();
      }
      if (dirty) { present(); dirty = false; }
    }
    requestAnimationFrame(loop);
  }

  let saveT = 0;
  function scheduleSave() {
    clearTimeout(saveT);
    saveT = setTimeout(() => {
      Curio.store.set('ink-painting:state', { size, water, autoDip, initials, seals });
      try { Curio.store.set('ink-painting:ink', ink.toDataURL('image/jpeg', .86)); } catch {}
    }, 700);
  }
  function restoreInk() {
    const url = Curio.store.get('ink-painting:ink', null);
    if (!url) { paintWelcome(); return; }
    const img = new Image();
    img.onload = () => { ic.drawImage(img, 0, 0, W, H); dirty = true; };
    img.src = url;
  }
  function paintWelcome() {
    const pts = [[880, 180], [930, 260], [960, 360], [975, 470], [972, 590], [955, 700], [935, 800], [920, 900]];
    const save = { size, water };
    size = 30; water = .05; dipBrush(true); for (const b of bristles) b.has = false; rS = null; strokeLen = 0; lastDab = null;
    const s = makeSampler(() => Math.max(1.1, (rS || size) * .1), (x, y, pr, v, first) => dab(x, y, pr, v, first), 1);
    s.begin({ x: pts[0][0], y: pts[0][1], pr: .5, t: 0 });
    pts.slice(1).forEach(([x, y], i) => s.move({ x, y, pr: .85 - i * .08, t: (i + 1) * 120 }));
    s.end();
    for (const [lx, ly, ang, len] of [[960, 380, -2.5, 210], [968, 520, -.55, 240], [955, 640, -2.7, 190], [940, 780, -.4, 200]]) {
      size = 22; water = .14; dipBrush(true); for (const b of bristles) b.has = false; rS = null; strokeLen = 0; lastDab = null;
      const s2 = makeSampler(() => Math.max(1.1, (rS || size) * .1), (x, y, pr, v, first) => dab(x, y, pr, v, first), 1);
      const n = 7; s2.begin({ x: lx, y: ly, pr: .3, t: 0 });
      for (let i = 1; i <= n; i++) { const t = i / n, a = ang + Math.sin(t * Math.PI) * .25; s2.move({ x: lx + Math.cos(a) * len * t, y: ly + Math.sin(a) * len * t, pr: Math.sin(t * Math.PI) * .9 + .1 * (1 - t), t: i * 60 }); }
      s2.end();
    }
    size = 60; water = .82; dipBrush(true); for (const b of bristles) b.has = false; rS = null; strokeLen = 0; lastDab = null;
    const s3 = makeSampler(() => Math.max(1.1, (rS || size) * .1), (x, y, pr, v, first) => dab(x, y, pr, v, first), 1);
    s3.begin({ x: 420, y: 960, pr: .6, t: 0 });
    [[620, 930], [820, 945], [1050, 925], [1260, 950]].forEach(([x, y], i) => s3.move({ x, y, pr: .8, t: (i + 1) * 90 }));
    s3.end();
    finalizeSpots();
    if (bb) { ic.globalCompositeOperation = 'multiply'; ic.drawImage(wet, 0, 0); ic.globalCompositeOperation = 'source-over'; white(wc); wc.globalCompositeOperation = 'darken'; }
    bb = null; wetPending = false;
    size = save.size; water = save.water; load = 1; updateMeter(); dirty = true;
  }

  function undo() {
    merge();
    const e = undoStack.pop();
    if (!e) { Curio.toast('Nothing to undo'); return; }
    if (e.type === 'px') ic.putImageData(e.data, e.x, e.y);
    else if (e.type === 'seal') seals.pop();
    else if (e.type === 'full') { ic.putImageData(e.data, 0, 0); seals = e.seals; }
    dirty = true; scheduleSave(); Curio.beep(330, .05, 'triangle', .07);
  }
  async function clearAll() {
    merge();
    const ok = await Curio.modal({ emoji: '📜', title: 'Fresh sheet?', body: 'Roll out a new sheet of rice paper. Undo can bring the old one back.', buttons: [{ label: 'New sheet', value: true }, { label: 'Keep painting', value: false }] });
    if (!ok) return;
    pushUndo({ type: 'full', data: ic.getImageData(0, 0, W, H), seals: seals.slice() });
    white(ic); seals = []; dirty = true; scheduleSave(); Curio.beep(520, .1, 'sine', .06);
  }
  function savePng() {
    merge(); present();
    cv.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'curio-ink-painting.png';
      document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      Curio.toast('Saved. Hang it somewhere calm.'); Curio.beep(880, .08, 'triangle', .08);
    }, 'image/png');
  }

  const sizeEl = $('size'), waterEl = $('water');
  const waterLabel = () => (water < .2 ? 'Dark ink' : water < .45 ? 'Soft ink' : water < .7 ? 'Grey wash' : 'Pale mist');
  function syncUi() {
    sizeEl.value = size; $('sizeV').textContent = size;
    waterEl.value = Math.round(water * 100); $('waterV').textContent = waterLabel();
    $('autodip').setAttribute('aria-pressed', String(autoDip));
    $('initials').value = initials;
  }
  sizeEl.addEventListener('input', () => { size = +sizeEl.value; $('sizeV').textContent = size; scheduleSave(); });
  waterEl.addEventListener('input', () => { water = +waterEl.value / 100; $('waterV').textContent = waterLabel(); scheduleSave(); });
  $('dip').addEventListener('click', () => dipBrush(false));
  $('autodip').addEventListener('click', () => { autoDip = !autoDip; $('autodip').setAttribute('aria-pressed', String(autoDip)); if (!autoDip) Curio.toast('Manual dipping: press Dip or D to reload'); scheduleSave(); });
  $('initials').addEventListener('input', (e) => { initials = e.target.value.replace(/\s+/g, '').slice(0, 4); scheduleSave(); dirty = true; });
  $('stamp').addEventListener('click', () => { setPlacing(!placing); if (placing) Curio.beep(400, .05, 'sine', .05); });
  $('undo').addEventListener('click', undo);
  $('clear').addEventListener('click', clearAll);
  $('save').addEventListener('click', savePng);
  addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input')) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); return; }
    if (e.key === 'd' || e.key === 'D') dipBrush(false);
    if (e.key === '[') { size = Math.max(5, size - 3); syncUi(); }
    if (e.key === ']') { size = Math.min(80, size + 3); syncUi(); }
    if (e.key === 'Escape' && placing) setPlacing(false);
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'u' || e.key === 'U') undo();
    if (e.key === 's' || e.key === 'S') { setPlacing(!placing); if (placing) Curio.beep(400, .05, 'sine', .05); }
  });

  syncUi(); updateMeter(); restoreInk();
  if (!Curio.touchpad && !Curio.store.get('tp-hint-ink-painting', false) && matchMedia('(pointer: fine)').matches) { Curio.store.set('tp-hint-ink-painting', true); setTimeout(() => Curio.toast('Tip: on a laptop touchpad, turn on Touchpad mode in the top bar: click to put the brush down, click again to lift it', 4200), 1800); }
  requestAnimationFrame(loop);
})();
