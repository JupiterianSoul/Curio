HM.mats = HM.mats || {};
HM.mats.ink = () => {
  const { W, H, clamp, mk, makeSampler, ui, adv } = HM.kit;
  const KEY = 'happy-mediums:ink';
  let seed = 20240917;
  const srnd = () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  let paper, ink, ic, wet, wc, fibre, small, tmp, fc, sc, tc, ready = false;
  const white = (c) => { c.save(); c.globalCompositeOperation = 'source-over'; c.fillStyle = '#fff'; c.fillRect(0, 0, W, H); c.restore(); };

  function build() {
    paper = mk();
    const p = paper.getContext('2d');
    p.fillStyle = '#f3ecda'; p.fillRect(0, 0, W, H);
    const sm = mk(44, 30), s = sm.getContext('2d');
    for (let y = 0; y < 30; y++) for (let x = 0; x < 44; x++) { s.fillStyle = `rgba(${150 + srnd() * 70 | 0},${128 + srnd() * 60 | 0},${88 + srnd() * 50 | 0},${srnd() * .55})`; s.fillRect(x, y, 1, 1); }
    p.globalAlpha = .16; p.imageSmoothingQuality = 'high'; p.drawImage(sm, 0, 0, W, H); p.globalAlpha = 1;
    p.lineCap = 'round';
    for (let i = 0; i < 2400; i++) {
      const x = srnd() * W, y = srnd() * H, a = srnd() * Math.PI * 2, len = 6 + srnd() * srnd() * 110;
      const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len;
      const cx = (x + ex) / 2 + (srnd() - .5) * len * .5, cy = (y + ey) / 2 + (srnd() - .5) * len * .5;
      p.strokeStyle = srnd() < .7 ? `rgba(255,253,244,${.25 + srnd() * .4})` : `rgba(115,92,60,${.04 + srnd() * .08})`;
      p.lineWidth = .4 + srnd() * 1.3;
      p.beginPath(); p.moveTo(x, y); p.quadraticCurveTo(cx, cy, ex, ey); p.stroke();
    }
    for (let i = 0; i < 150; i++) {
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
    ink = mk(); ic = ink.getContext('2d'); wet = mk(); wc = wet.getContext('2d');
    white(ic); white(wc);
    wc.lineCap = 'round'; wc.lineJoin = 'round'; wc.globalCompositeOperation = 'darken';
    fibre = mk(); small = mk(400, 400); tmp = mk();
    fc = fibre.getContext('2d'); sc = small.getContext('2d'); tc = tmp.getContext('2d');
    fc.fillStyle = 'rgb(232,232,232)'; fc.fillRect(0, 0, W, H); fc.lineCap = 'round';
    for (let i = 0; i < 4800; i++) {
      const x = srnd() * W, y = srnd() * H, a = srnd() * Math.PI * 2, len = 5 + srnd() * srnd() * 70;
      const v = 110 + srnd() * 90 | 0; fc.strokeStyle = `rgb(${v},${v},${v})`; fc.lineWidth = .5 + srnd() * 1.1;
      fc.beginPath(); fc.moveTo(x, y); fc.quadraticCurveTo(x + Math.cos(a + .4) * len * .5, y + Math.sin(a + .4) * len * .5, x + Math.cos(a) * len, y + Math.sin(a) * len); fc.stroke();
    }
    ready = true;
  }

  const TONE = [];
  for (let k = 0; k <= 255; k++) { const d = k / 255; TONE.push(`rgb(${Math.round(255 - d * 236)},${Math.round(255 - d * 238)},${Math.round(255 - d * 233)})`); }
  const tone = (d) => TONE[clamp(Math.round(d * 255), 0, 255)];

  const saved = Curio.store.get(KEY + ':state', {});
  let size = saved.size || 26, water = saved.water ?? .12, autoDip = adv() ? (saved.autoDip ?? true) : true, initials = saved.initials || 'ME';
  let seals = Array.isArray(saved.seals) ? saved.seals : [];
  let load = 1, placing = false, hover = null, dirty = true, drawing = false;
  const used = new Set();
  const NB = 60;
  let bristles = [];
  function newBristles() {
    bristles = Array.from({ length: NB }, () => {
      const a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * .96;
      return { ox: Math.cos(a) * rr, oy: Math.sin(a) * rr, w: .2 + Math.random() * .32, load: .72 + Math.random() * .28, thr: Math.random() * .4 * (rr * .7 + .3), tn: .78 + Math.random() * .22, on: true, x: 0, y: 0, has: false };
    });
  }
  newBristles();

  let rS = null, strokeLen = 0, lastDab = null, prevDab = null, bb = null, spots = [], wetPending = false, recent = null, wetAmt = 0, passes = 0, passT = 0, lastMoveT = 0, stillT = 0;
  function grow(x, y, r) {
    if (!bb) bb = { x0: x - r, y0: y - r, x1: x + r, y1: y + r };
    else { bb.x0 = Math.min(bb.x0, x - r); bb.y0 = Math.min(bb.y0, y - r); bb.x1 = Math.max(bb.x1, x + r); bb.y1 = Math.max(bb.y1, y + r); }
  }
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
    const dens = 1 - water * .87, spread = 1 + Math.max(0, water - .45) * 1.5;
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
    for (const s of spots) { s.age += dt; const k = Math.min(1, s.age / s.life), want = Math.min(3, Math.floor(k * 3) + 1); while (s.stage < want) { s.stage++; drawSpotStage(s, s.stage / 3); } }
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
    bb = null; wetPending = false; dirty = true; save();
  }
  const sampler = makeSampler(() => Math.max(1.1, (rS || size) * .1), (x, y, pr, v, first) => dab(x, y, pr, v, first));

  function dipBrush(quiet) {
    load = 1; newBristles(); updateMeter();
    if (!quiet) { Curio.beep(180, .12, 'sine', .07); Curio.toast('Brush dipped in the inkstone'); }
  }
  let meterEl = null, loadEl = null, stampBtn = null, sizeS = null, waterF = null, waterS = null, dipBtn = null, toneSeg = null;
  function updateMeter() { if (meterEl) { meterEl.style.width = `${Math.round(load * 100)}%`; loadEl.textContent = `${Math.round(load * 100)}%`; } }

  const sealCache = new Map();
  function sealImage(text) {
    if (sealCache.has(text)) return sealCache.get(text);
    const S = 220, c = mk(S, S), s = c.getContext('2d');
    let r = 1337 + [...text].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7);
    const rr = () => { r = (r * 16807) % 2147483647; return r / 2147483647; };
    s.fillStyle = '#c4231b'; s.beginPath();
    const m = 14, pts = [];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 12; j++) {
      const t = j / 12, j1 = (rr() - .5) * 5;
      pts.push(i === 0 ? [m + t * (S - 2 * m), m + j1] : i === 1 ? [S - m + j1, m + t * (S - 2 * m)] : i === 2 ? [S - m - t * (S - 2 * m), S - m + j1] : [m + j1, S - m - t * (S - 2 * m)]);
    }
    pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); s.closePath(); s.fill();
    s.globalCompositeOperation = 'destination-out';
    const ch = [...(text || '?').toUpperCase()].slice(0, 4);
    s.textAlign = 'center'; s.textBaseline = 'middle'; s.fillStyle = '#000';
    const font = (px) => `900 ${px}px "Songti SC", "STSong", Georgia, "Times New Roman", serif`;
    const cells = ch.length === 1 ? [[S / 2, S / 2, 150]] : ch.length === 2 ? [[S / 2, S * .31, 92], [S / 2, S * .69, 92]] : ch.length === 3 ? [[S * .67, S * .31, 82], [S * .67, S * .69, 82], [S * .32, S / 2, 100]] : [[S * .67, S * .31, 82], [S * .67, S * .69, 82], [S * .33, S * .31, 82], [S * .33, S * .69, 82]];
    ch.forEach((cc, i) => { const [x, y, fs] = cells[i]; s.font = font(fs); s.fillText(cc, x, y + fs * .04); });
    for (let i = 0; i < 260; i++) { s.globalAlpha = .3 + rr() * .7; s.beginPath(); s.arc(rr() * S, rr() * S, .5 + rr() * 2.2, 0, Math.PI * 2); s.fill(); }
    s.globalAlpha = 1;
    sealCache.set(text, c); return c;
  }
  function drawSeal(ctx, sl, alpha) {
    const im = sealImage(sl.text), sz = sl.size || 110;
    ctx.save(); ctx.globalAlpha = alpha; ctx.globalCompositeOperation = 'multiply';
    ctx.translate(sl.x, sl.y); ctx.rotate(sl.rot || 0); ctx.drawImage(im, -sz / 2, -sz / 2, sz, sz); ctx.restore();
  }
  function stampSeal(x, y) {
    seals.push({ x: clamp(x, 60, W - 60), y: clamp(y, 60, H - 60), text: (initials || 'ME').toUpperCase(), size: 110, rot: (Math.random() - .5) * .07 });
    pushUndo({ type: 'seal' });
    setPlacing(false); dirty = true; save();
    Curio.beep(110, .1, 'triangle', .14); setTimeout(() => Curio.beep(70, .08, 'sine', .1), 40);
    Curio.toast('Signed. Very official.');
  }
  function setPlacing(v) { placing = v; if (stampBtn) stampBtn.setAttribute('aria-pressed', String(v)); HM.flag && HM.flag(v ? 'Tap the paper to stamp your seal' : ''); dirty = true; }

  let saveT = 0;
  function save() {
    clearTimeout(saveT);
    saveT = setTimeout(() => {
      Curio.store.set(KEY + ':state', { size, water, autoDip, initials, seals });
      if (ready) try { Curio.store.set(KEY + ':art', ink.toDataURL('image/jpeg', .86)); } catch {}
    }, 700);
  }
  function restore() {
    const url = Curio.store.get(KEY + ':art', null);
    if (!url) { welcome(); return; }
    const im = new Image();
    im.onload = () => { ic.drawImage(im, 0, 0, W, H); dirty = true; };
    im.src = url;
  }
  function stroke(sz, wt, pts, rot) {
    size = sz; water = wt; dipBrush(true); for (const b of bristles) b.has = false; rS = null; strokeLen = 0; lastDab = null;
    const s = makeSampler(() => Math.max(1.1, (rS || size) * .1), (x, y, pr, v, first) => dab(x, y, pr, v, first), 1);
    s.begin({ x: pts[0][0], y: pts[0][1], pr: pts[0][2], t: 0 });
    pts.slice(1).forEach((q, i) => s.move({ x: q[0], y: q[1], pr: q[2], t: (i + 1) * (rot || 100) }));
    s.end();
  }
  function welcome() {
    const keep = { size, water };
    const k = 1500 / 1650;
    stroke(30, .05, [[880, 180, .5], [930, 260, .85], [960, 360, .77], [975, 470, .69], [972, 590, .61], [955, 700, .53], [935, 800, .45], [920, 900, .37]].map(([x, y, p]) => [x * k, y * k, p]), 120);
    for (const [lx, ly, ang, len] of [[960, 380, -2.5, 210], [968, 520, -.55, 240], [955, 640, -2.7, 190], [940, 780, -.4, 200]]) {
      const pts = [];
      for (let i = 0; i <= 7; i++) { const t = i / 7, a = ang + Math.sin(t * Math.PI) * .25; pts.push([(lx + Math.cos(a) * len * t) * k, (ly + Math.sin(a) * len * t) * k, i ? Math.sin(t * Math.PI) * .9 + .1 * (1 - t) : .3]); }
      stroke(22, .14, pts, 60);
    }
    stroke(60, .82, [[420, 960, .6], [620, 930, .8], [820, 945, .8], [1050, 925, .8], [1260, 950, .8]].map(([x, y, p]) => [x * k, y * k, p]), 90);
    finalizeSpots();
    if (bb) { ic.globalCompositeOperation = 'multiply'; ic.drawImage(wet, 0, 0); ic.globalCompositeOperation = 'source-over'; white(wc); wc.globalCompositeOperation = 'darken'; }
    bb = null; wetPending = false;
    size = keep.size; water = keep.water; load = 1; dirty = true;
  }
  const TONES = [{ id: 'dark', label: 'Dark ink', w: .08 }, { id: 'soft', label: 'Soft grey', w: .35 }, { id: 'mist', label: 'Pale mist', w: .8 }];
  const toneId = () => (water < .2 ? 'dark' : water < .55 ? 'soft' : 'mist');
  const waterLabel = () => (water < .2 ? 'Dark ink' : water < .45 ? 'Soft ink' : water < .7 ? 'Grey wash' : 'Pale mist');

  return {
    id: 'ink', name: 'Ink Painting', surface: 'Rice paper', verb: 'paint',
    clearCopy: { title: 'Fresh sheet?', body: 'Roll out a new sheet of rice paper. Undo can bring the old one back.', yes: 'New sheet', no: 'Keep painting' },
    saveMsg: 'Saved. Hang it somewhere calm.',
    get used() { return 1; },
    get badge() { return ''; },
    init() { if (!ready) { build(); restore(); } },
    panel(host) {
      const fs = ui.field('Brush', String(size));
      sizeS = ui.slider(5, 80, size, (v) => { size = v; fs.side.textContent = v; save(); }, 'Brush size');
      fs.append(sizeS.el); host.append(fs);
      if (adv()) {
        waterF = ui.field('Water', waterLabel());
        waterS = ui.slider(0, 100, Math.round(water * 100), (v) => { water = v / 100; waterF.side.textContent = waterLabel(); save(); }, 'Water');
        waterF.append(waterS.el); host.append(waterF);
        const fl = ui.field('Ink on the brush', '100%'); loadEl = fl.side;
        const row = HM.kit.h('div', 'hm-loadrow');
        const meter = HM.kit.h('div', 'hm-meter', '<i></i>'); meterEl = meter.firstChild;
        dipBtn = ui.btn('Dip', () => dipBrush(false), 'hm-pill'); dipBtn.title = 'Dip the brush (D)';
        row.append(meter, dipBtn); fl.append(row);
        const auto = ui.btn('Auto-dip each stroke', () => { autoDip = !autoDip; auto.setAttribute('aria-pressed', String(autoDip)); if (!autoDip) Curio.toast('Manual dipping: press Dip or D to reload'); save(); }, 'hm-pill');
        auto.setAttribute('aria-pressed', String(autoDip)); fl.append(auto);
        host.append(fl);
        const fseal = ui.field('Red seal', 'your initials');
        const sr = HM.kit.h('div', 'hm-sealrow');
        const inp = document.createElement('input'); inp.className = 'c-input'; inp.maxLength = 4; inp.value = initials; inp.setAttribute('aria-label', 'Seal initials'); inp.autocomplete = 'off'; inp.spellcheck = false;
        inp.addEventListener('input', () => { initials = inp.value.replace(/\s+/g, '').slice(0, 4); save(); });
        stampBtn = ui.btn('Stamp seal', () => { setPlacing(!placing); if (placing) Curio.beep(400, .05, 'sine', .05); }, 'hm-pill');
        sr.append(inp, stampBtn); fseal.append(sr); host.append(fseal);
        updateMeter();
      } else {
        meterEl = null; stampBtn = null;
        const ft = ui.field('Ink', '');
        toneSeg = ui.seg(TONES, toneId(), (id) => { water = TONES.find((t) => t.id === id).w; toneSeg.set(id); save(); Curio.beep(200 + water * 300, .06, 'sine', .05); }, 'Ink tone');
        ft.append(toneSeg.el); host.append(ft);
      }
    },
    tip: 'Slow strokes pool the ink, fast flicks go dry and wispy. Hold the brush still and the ink blooms.',
    keys: 'D dip, S seal, Esc cancels the seal',
    down(p) {
      if (placing) { stampSeal(p.x, p.y); return 'click'; }
      merge();
      drawing = true;
      if (autoDip) dipBrush(true);
      for (const b of bristles) { b.has = false; b.on = true; }
      rS = null; strokeLen = 0; recent = null; wetAmt = 0; passes = 0; passT = 0; lastDab = null; prevDab = null; stillT = 0; lastMoveT = performance.now();
      sampler.begin(p);
    },
    move(p) { hover = p; sampler.move(p); lastMoveT = performance.now(); stillT = 0; },
    up() {
      if (!drawing) return;
      sampler.end();
      if (lastDab && prevDab) {
        let dx = lastDab.x - prevDab.x, dy = lastDab.y - prevDab.y; const m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m;
        const v = sampler.vel, r0 = lastDab.r, len = r0 * (.5 + Math.min(v, 3) * .9) + 6;
        const steps = Math.max(3, Math.ceil(len / Math.max(1.2, r0 * .12)));
        let x = lastDab.x, y = lastDab.y;
        for (let i = 1; i <= steps; i++) { x += dx * len / steps; y += dy * len / steps; dab(x, y, null, v, false, r0 * Math.pow(1 - i / steps, 1.4) + .4); }
      }
      drawing = false; updateMeter();
    },
    hover(p) { hover = p; if (placing) dirty = true; },
    frame(dts) {
      const dt = Math.min(64, dts * 1000), t = performance.now();
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
      const d = dirty; dirty = false; return d;
    },
    draw(g, live) {
      if (!live) merge();
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
      g.drawImage(paper, 0, 0);
      g.globalCompositeOperation = 'multiply';
      g.drawImage(ink, 0, 0);
      if (wetPending) g.drawImage(wet, 0, 0);
      g.globalCompositeOperation = 'source-over';
      for (const sl of seals) drawSeal(g, sl, .93);
      if (live && placing && hover) drawSeal(g, { x: hover.x, y: hover.y, text: (initials || 'ME').toUpperCase(), size: 110 }, .45);
    },
    undo() {
      merge();
      const e = undoStack.pop(); if (!e) return false;
      if (e.type === 'px') ic.putImageData(e.data, e.x, e.y);
      else if (e.type === 'seal') seals.pop();
      else if (e.type === 'full') { ic.putImageData(e.data, 0, 0); seals = e.seals; }
      dirty = true; save(); return true;
    },
    clear() { merge(); pushUndo({ type: 'full', data: ic.getImageData(0, 0, W, H), seals: seals.slice() }); white(ic); seals = []; dirty = true; save(); Curio.beep(520, .1, 'sine', .06); },
    resize(d) { size = clamp(size + d * 3, 5, 80); if (sizeS) sizeS.set(size); },
    key(k) {
      if (k === 'd' && adv()) { dipBrush(false); return true; }
      if (k === 's' && adv()) { setPlacing(!placing); return true; }
      if (k === 'escape' && placing) { setPlacing(false); return true; }
      return false;
    },
    pause() { if (placing) setPlacing(false); },
    resume() {}
  };
};
