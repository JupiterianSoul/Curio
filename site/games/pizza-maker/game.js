(() => {
  const $ = (id) => document.getElementById(id);
  const TOPS = window.PIZZA_TOPPINGS;
  const PD = window.PIZZA_DATA;
  const DOUGHS = PD.doughs;
  const S = 600, C = 300, N = 96, TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const hexRgb = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  function ramp(stops, t) {
    if (t <= stops[0][0]) return stops[0][1];
    for (let i = 1; i < stops.length; i++) {
      if (t <= stops[i][0]) {
        const [t0, c0] = stops[i - 1], [t1, c1] = stops[i], f = (t - t0) / (t1 - t0), a = hexRgb(c0), b = hexRgb(c1);
        return `rgb(${a.map((v, j) => Math.round(lerp(v, b[j], f))).join(',')})`;
      }
    }
    return stops[stops.length - 1][1];
  }
  const CRUST = [[0, '#efd6a4'], [.5, '#ebc27c'], [.9, '#d89443'], [1.25, '#a8622a'], [1.6, '#4f2f17'], [2.2, '#1c120b']];
  const DOUGH = [[0, '#f7e6bf'], [.6, '#f2d79f'], [1, '#e9c27f'], [1.6, '#7a4a24'], [2.2, '#2a1a0e']];
  const SAUCES = Object.assign({ tomato: { name: 'Tomato', c: '#c8321f' }, pesto: { name: 'Pesto', c: '#4f8c33' }, white: { name: 'Garlic cream', c: '#f6eed6' }, bbq: { name: 'BBQ', c: '#6e3018' } }, PD.sauces);
  const CHEESES = {
    mozz: { name: 'Mozzarella', c: ['#fffaf0', '#fff0c2', '#f2c35c'] },
    cheddar: { name: 'Cheddar', c: ['#ffc247', '#ffb52e', '#e8901c'] },
    parm: { name: 'Parmesan', c: ['#f6edc8', '#f3e2a6', '#e2b860'], fine: true },
    blue: { name: 'Blue cheese', c: ['#f1f3ea', '#e8ecda', '#cfcb9c'], veins: true }
  };
  Object.assign(CHEESES, PD.cheeses);
  const GROUPS = {
    meat: { label: '🥓 Meat & fish', items: ['pepperoni', 'salami', 'ham', 'prosciutto', 'bacon', 'sausage', 'meatball', 'chicken', 'anchovy', 'shrimp', 'egg'] },
    veg: { label: '🥦 Veg', items: ['mushroom', 'olive', 'greenolive', 'greenpepper', 'redpepper', 'onion', 'tomato', 'sundried', 'jalapeno', 'chili', 'corn', 'spinach', 'rocket', 'basil', 'artichoke', 'broccoli', 'potato', 'garlic', 'capers'] },
    extra: { label: '🧀 Cheese & fruit', items: ['feta', 'ricotta', 'pineapple', 'fig', 'pear'] },
    sweet: { label: '🍓 Sweet', items: ['strawberry', 'marshmallow', 'chocchips'] }
  };
  let group = 'meat';
  const dType = () => DOUGHS[st.dough] || DOUGHS.classic;
  const crustRamp = () => dType().crust || CRUST;
  const doughRamp = () => dType().dough || DOUGH;
  const STEPS = [
    { k: 'dough', icon: '🫓', label: 'Dough' },
    { k: 'sauce', icon: '🥫', label: 'Sauce' },
    { k: 'cheese', icon: '🧀', label: 'Cheese' },
    { k: 'tops', icon: '🍄', label: 'Toppings' },
    { k: 'bake', icon: '🔥', label: 'Bake' },
    { k: 'slice', icon: '🔪', label: 'Slice' },
    { k: 'review', icon: '⭐', label: 'Review' }
  ];

  const cv = $('pz'), g = cv.getContext('2d');
  let k = 1;
  const LS = 2;
  const mk = () => { const c = document.createElement('canvas'); c.width = c.height = S * LS; return c; };
  const sauceC = mk(), sg = sauceC.getContext('2d', { willReadFrequently: true });
  const layer = mk(), lg = layer.getContext('2d');
  const table = mk();
  (function paintTable() {
    const t = table.getContext('2d'); t.scale(LS, LS);
    t.fillStyle = '#c99a63'; t.fillRect(0, 0, S, S);
    for (let i = 0; i < 8; i++) {
      t.fillStyle = i % 2 ? 'rgba(120,70,30,.08)' : 'rgba(255,240,210,.06)'; t.fillRect(0, i * 75, S, 75);
      t.fillStyle = 'rgba(90,50,20,.35)'; t.fillRect(0, i * 75, S, 2);
      t.strokeStyle = 'rgba(110,65,25,.18)'; t.lineWidth = 1.5;
      for (let j = 0; j < 4; j++) { const y = i * 75 + 12 + j * 16; t.beginPath(); t.moveTo(0, y); for (let x = 0; x <= S; x += 40) t.lineTo(x, y + Math.sin(x * .02 + i + j) * 3); t.stroke(); }
    }
    t.fillStyle = '#e9ddc8'; t.beginPath(); t.arc(C, C, 282, 0, TAU); t.fill();
    t.strokeStyle = '#cbbba0'; t.lineWidth = 6; t.stroke();
  })();

  let st;
  function fresh() { return { step: 0, max: 0, R: new Array(N).fill(118), dough: 'classic', sauce: 'tomato', cheese: 'mozz', shreds: [], tops: [], bake: 0, oven: false, ovenTime: 0, cuts: [], cov: 0, review: null, order: null }; }
  const spots = Array.from({ length: 70 }, () => [Math.random() * TAU, Math.random(), Math.random() * 4 + 2, Math.random()]);
  const specks = Array.from({ length: 40 }, () => [Math.random() * TAU, Math.sqrt(Math.random()), Math.random() * 1.5 + .6]);

  const meanR = () => st.R.reduce((a, b) => a + b, 0) / N;
  const rimW = () => clamp(meanR() * .1, 12, 24) * dType().rim;
  function rAt(a) { a = ((a % TAU) + TAU) % TAU; const f = a / TAU * N, i = Math.floor(f) % N, j = (i + 1) % N; return lerp(st.R[i], st.R[j], f - Math.floor(f)); }
  function pathFor(off) {
    const p = new Path2D();
    const pts = st.R.map((r, i) => { const a = i / N * TAU; return [C + Math.cos(a) * (r - off), C + Math.sin(a) * (r - off)]; });
    for (let i = 0; i <= N; i++) {
      const a = pts[i % N], b = pts[(i + 1) % N], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      if (i === 0) p.moveTo(mx, my); else p.quadraticCurveTo(a[0], a[1], mx, my);
    }
    p.closePath(); return p;
  }
  function inside(x, y, pad = 4) { const d = Math.hypot(x - C, y - C); return d < rAt(Math.atan2(y - C, x - C)) - rimW() - pad; }
  function randomInside(pad = 14) {
    for (let t = 0; t < 50; t++) { const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * (meanR() - rimW() - pad); const x = C + Math.cos(a) * r, y = C + Math.sin(a) * r; if (inside(x, y, pad)) return [x, y]; }
    return [C, C];
  }

  let toss = null, ptr = null, down = null, last = null, dragTop = null, cutPrev = null, holdT = 0;
  const particles = [];
  let dirty = true;

  function render(ctx, scale, overlays = true) {
    const b = st.bake;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.drawImage(table, 0, 0, S, S);
    ctx.save();
    if (toss) {
      const p = clamp((performance.now() - toss.t0) / 900, 0, 1), sc = 1 + Math.sin(p * Math.PI) * .28;
      ctx.translate(C, C - Math.sin(p * Math.PI) * 40); ctx.rotate(p * TAU * 1.5); ctx.scale(sc, sc); ctx.translate(-C, -C);
    }
    const outer = pathFor(0), rim = rimW(), inner = pathFor(rim);
    ctx.save(); ctx.translate(5, 9); ctx.fillStyle = 'rgba(60,35,15,.28)'; ctx.fill(outer); ctx.restore();
    const dt0 = dType();
    if (dt0.deep) { ctx.save(); ctx.translate(0, 6); ctx.fillStyle = ramp(crustRamp(), b + .35); ctx.fill(outer); ctx.restore(); }
    ctx.fillStyle = ramp(crustRamp(), b); ctx.fill(outer);
    ctx.save(); ctx.strokeStyle = b > 1.4 ? 'rgba(0,0,0,.15)' : 'rgba(255,250,235,.25)'; ctx.lineWidth = 3; ctx.stroke(pathFor(rim * .4)); ctx.restore();
    crustExtras(ctx, dt0, rim, b, outer);
    ctx.fillStyle = ramp(doughRamp(), b); ctx.fill(inner);
    if (dt0.deep) { ctx.save(); ctx.clip(inner); ctx.strokeStyle = 'rgba(60,30,10,.35)'; ctx.lineWidth = 14; ctx.filter = 'blur(4px)'; ctx.stroke(inner); ctx.restore(); }
    ctx.save(); ctx.clip(inner);
    if (b < .3) { ctx.fillStyle = 'rgba(255,255,255,.55)'; const m = meanR(); specks.forEach(([a, r, s]) => { ctx.beginPath(); ctx.arc(C + Math.cos(a) * r * m * .85, C + Math.sin(a) * r * m * .85, s, 0, TAU); ctx.fill(); }); }
    lg.setTransform(1, 0, 0, 1, 0, 0); lg.clearRect(0, 0, layer.width, layer.height);
    lg.globalCompositeOperation = 'source-over'; lg.drawImage(sauceC, 0, 0);
    if (b > .2) { lg.globalCompositeOperation = 'source-atop'; lg.fillStyle = `rgba(90,25,5,${clamp((b - .2) * .3, 0, .7)})`; lg.fillRect(0, 0, layer.width, layer.height); lg.globalCompositeOperation = 'source-over'; }
    ctx.drawImage(layer, 0, 0, S, S);
    drawCheese(ctx);
    ctx.restore();
    lg.clearRect(0, 0, layer.width, layer.height);
    lg.setTransform(LS, 0, 0, LS, 0, 0);
    lg.shadowColor = 'rgba(0,0,0,.28)'; lg.shadowBlur = 3; lg.shadowOffsetY = 2;
    st.tops.forEach((t) => { if (t !== dragTop || !dragTop.ghost) drawTop(lg, t); });
    lg.shadowColor = 'transparent';
    if (b > .3) { lg.setTransform(1, 0, 0, 1, 0, 0); lg.globalCompositeOperation = 'source-atop'; lg.fillStyle = `rgba(70,30,5,${clamp((b - .3) * .32, 0, .8)})`; lg.fillRect(0, 0, layer.width, layer.height); lg.globalCompositeOperation = 'source-over'; }
    ctx.drawImage(layer, 0, 0, S, S);
    if (st.cuts.length) {
      ctx.save(); ctx.clip(outer); ctx.lineCap = 'round';
      st.cuts.forEach((c) => {
        ctx.strokeStyle = 'rgba(60,30,10,.75)'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(c[0], c[1]); ctx.lineTo(c[2], c[3]); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,240,220,.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(c[0] + 2, c[1] + 2); ctx.lineTo(c[2] + 2, c[3] + 2); ctx.stroke();
      });
      ctx.restore();
    }
    ctx.restore();
    if (!overlays) return;
    const key = STEPS[st.step].k;
    if (key === 'dough' && !down && st.R.every((r) => r === st.R[0]) && st.R[0] < 140) hintArrows(ctx);
    if (ptr && key === 'sauce') ladle(ctx, ptr.x, ptr.y, !!down);
    if (ptr && key === 'cheese') shaker(ctx, ptr.x, ptr.y, !!down);
    if (key === 'slice') {
      if (down && ptr && cutPrev) { ctx.save(); ctx.setLineDash([8, 8]); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(down.x, down.y); ctx.lineTo(ptr.x, ptr.y); ctx.stroke(); ctx.restore(); }
      if (ptr) cutter(ctx, ptr.x, ptr.y);
    }
    if (key === 'bake') oven(ctx);
    if ((key === 'slice' || key === 'review') && b > .5 && b < 1.6) steam(ctx);
    particles.forEach((p) => { ctx.fillStyle = `rgba(${p.c},${p.life * .5})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); });
    if (dragTop && dragTop.ghost) drawTop(ctx, dragTop);
  }
  function crustExtras(ctx, d, rim, b, outer) {
    ctx.save(); ctx.clip(outer);
    if (d.stuffed) {
      const ring = pathFor(rim * .5);
      ctx.strokeStyle = b > .4 ? 'rgba(255,214,120,.75)' : 'rgba(255,248,220,.6)'; ctx.lineWidth = rim * .35; ctx.stroke(ring);
      if (b > .4) { ctx.fillStyle = 'rgba(255,200,90,.9)'; [0.3, 1.6, 2.9, 4.4, 5.6].forEach((a) => { const r = rAt(a) - rim * .5; ctx.beginPath(); ctx.ellipse(C + Math.cos(a) * r, C + Math.sin(a) * r, rim * .35, rim * .2, a, 0, TAU); ctx.fill(); }); }
    }
    if (d.leopard && b > .55) {
      ctx.fillStyle = `rgba(30,15,5,${clamp((b - .55) * 1.4, 0, .85)})`;
      spots.forEach(([a, f, r]) => { const rr = rAt(a) - rim * (.2 + f * .6); ctx.beginPath(); ctx.arc(C + Math.cos(a) * rr, C + Math.sin(a) * rr, r * .8, 0, TAU); ctx.fill(); });
    }
    if (d.blisters) {
      ctx.fillStyle = b > .7 ? 'rgba(60,30,10,.45)' : 'rgba(255,250,230,.55)';
      spots.slice(0, 30).forEach(([a, f, r]) => { const rr = rAt(a) - rim * (.25 + f * .5); ctx.beginPath(); ctx.ellipse(C + Math.cos(a) * rr, C + Math.sin(a) * rr, r, r * .7, a, 0, TAU); ctx.fill(); });
    }
    if (d.bran) {
      ctx.fillStyle = 'rgba(110,70,30,.45)';
      spots.forEach(([a, f, r, z]) => { const rr = (rAt(a) - 4) * Math.sqrt(z); ctx.fillRect(C + Math.cos(a) * rr, C + Math.sin(a) * rr, 2, 1.4); });
    }
    ctx.restore();
  }
  function drawTop(ctx, t) { ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(t.a); ctx.scale(t.s, t.s); TOPS[t.t].draw(ctx); ctx.restore(); }
  function drawCheese(ctx) {
    if (!st.shreds.length) return;
    const ch = CHEESES[st.cheese], b = st.bake;
    const melt = clamp((b - .15) / .45, 0, 1), brown = clamp((b - .75) / .5, 0, 1), burn = clamp((b - 1.3) / .6, 0, 1);
    const col = ramp([[0, ch.c[0]], [.45, ch.c[1]], [1.05, ch.c[2]], [1.5, '#a8692a'], [2, '#2b1a0c']], b);
    ctx.lineCap = 'round';
    if (melt > 0) {
      const rad = (ch.fine ? 2.5 : 4.5) + melt * (ch.fine ? 4 : 8.5);
      const blobs = (rr) => { ctx.beginPath(); st.shreds.forEach((s) => { ctx.moveTo(s.x + rr, s.y); ctx.arc(s.x, s.y, rr, 0, TAU); }); ctx.fill(); };
      ctx.globalAlpha = melt; ctx.fillStyle = 'rgba(150,100,30,.35)'; ctx.save(); ctx.translate(0, 1.5); blobs(rad + 2); ctx.restore();
      ctx.fillStyle = col; blobs(rad + 1.5);
      ctx.globalAlpha = 1;
      ctx.fillStyle = `rgba(255,255,240,${.35 * melt * (1 - brown)})`; ctx.beginPath();
      st.shreds.forEach((s) => { if (s.r > .9) { ctx.moveTo(s.x + 3, s.y - 2); ctx.ellipse(s.x, s.y - 2, 3, 1.6, s.a, 0, TAU); } }); ctx.fill();
    }
    if (melt < 1) {
      ctx.globalAlpha = 1 - melt;
      const w = ch.fine ? 2 : 3.2;
      ctx.strokeStyle = 'rgba(120,90,40,.35)'; ctx.lineWidth = w + 1.6; ctx.beginPath();
      st.shreds.forEach((s) => { const dx = Math.cos(s.a) * s.l / 2, dy = Math.sin(s.a) * s.l / 2; ctx.moveTo(s.x - dx, s.y - dy + 1); ctx.lineTo(s.x + dx, s.y + dy + 1); }); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath();
      st.shreds.forEach((s) => { const dx = Math.cos(s.a) * s.l / 2, dy = Math.sin(s.a) * s.l / 2; ctx.moveTo(s.x - dx, s.y - dy); ctx.lineTo(s.x + dx, s.y + dy); }); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (ch.veins) { ctx.fillStyle = 'rgba(70,90,110,.55)'; ctx.beginPath(); st.shreds.forEach((s) => { if (s.r < .18) { ctx.moveTo(s.x + 1.6, s.y); ctx.arc(s.x, s.y, 1.6, 0, TAU); } }); ctx.fill(); }
    if (brown > 0) { ctx.fillStyle = 'rgba(160,85,20,.5)'; ctx.beginPath(); st.shreds.forEach((s) => { if (s.r < brown * .5) { const r = 2.5 + s.r * 8; ctx.moveTo(s.x + 3 + r, s.y + 2); ctx.arc(s.x + 3, s.y + 2, r, 0, TAU); } }); ctx.fill(); }
    if (burn > 0) { ctx.fillStyle = 'rgba(25,12,4,.7)'; ctx.beginPath(); st.shreds.forEach((s) => { if (s.r < burn * .8) { const r = 3 + s.r * 7; ctx.moveTo(s.x - 2 + r, s.y); ctx.arc(s.x - 2, s.y, r, 0, TAU); } }); ctx.fill(); }
  }
  function hintArrows(ctx) {
    const t = performance.now() / 1000, r = st.R[0] + 18 + Math.sin(t * 4) * 6;
    ctx.save(); ctx.strokeStyle = 'rgba(150,85,30,.9)'; ctx.fillStyle = 'rgba(150,85,30,.9)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU + .3; ctx.save(); ctx.translate(C + Math.cos(a) * r, C + Math.sin(a) * r); ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(26, 0); ctx.stroke(); ctx.beginPath(); ctx.moveTo(34, 0); ctx.lineTo(22, -8); ctx.lineTo(22, 8); ctx.fill(); ctx.restore();
    }
    ctx.font = '800 20px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(60,35,15,.85)';
    ctx.fillText('drag outward to stretch', C, 560);
    ctx.restore(); dirty = true;
  }
  function ladle(ctx, x, y, active) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-.5);
    ctx.fillStyle = '#9aa4ad'; ctx.fillRect(16, -4, 70, 8);
    ctx.beginPath(); ctx.arc(0, 0, 20, 0, TAU); ctx.fillStyle = '#c3cbd2'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#7d8790'; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 14, 0, TAU); ctx.fillStyle = SAUCES[st.sauce].c; ctx.globalAlpha = active ? .6 : 1; ctx.fill();
    ctx.restore();
  }
  function shaker(ctx, x, y, active) {
    ctx.save(); ctx.translate(x + 26, y - 40); ctx.rotate(active ? -.6 + Math.sin(performance.now() / 50) * .15 : -.3);
    ctx.fillStyle = '#d0d6db'; ctx.fillRect(-16, -26, 32, 44); ctx.fillStyle = '#9aa4ad'; ctx.fillRect(-18, -32, 36, 10);
    ctx.fillStyle = '#5d6770'; for (let i = -10; i <= 10; i += 6) for (let j = -18; j <= 10; j += 7) { ctx.beginPath(); ctx.arc(i, j, 1.6, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  function cutter(ctx, x, y) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#c3cbd2'; ctx.strokeStyle = '#6b757d'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, 18, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#6b757d'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, TAU); ctx.fill();
    ctx.rotate(-.7); ctx.fillStyle = '#d64545'; ctx.fillRect(4, -5, 62, 10); ctx.fillStyle = '#9aa4ad'; ctx.fillRect(0, -2, 10, 4);
    ctx.restore();
  }
  function oven(ctx) {
    const on = st.oven, t = performance.now() / 1000, heat = on ? .75 + Math.sin(t * 3) * .1 : Math.max(0, (ovenGlow -= .01));
    ctx.save();
    ctx.fillStyle = `rgba(255,110,20,${.08 + heat * .2})`; ctx.fillRect(0, 0, S, S);
    const frame = new Path2D(); frame.rect(0, 0, S, S); frame.roundRect(36, 74, 528, 490, 34);
    ctx.fillStyle = '#2c2a30'; ctx.fill(frame, 'evenodd');
    ctx.strokeStyle = '#4a4750'; ctx.lineWidth = 6; ctx.beginPath(); ctx.roundRect(36, 74, 528, 490, 34); ctx.stroke();
    ctx.fillStyle = '#9aa4ad'; ctx.beginPath(); ctx.roundRect(170, 24, 260, 16, 8); ctx.fill();
    ctx.fillStyle = '#0d1a10'; ctx.beginPath(); ctx.roundRect(470, 16, 100, 44, 10); ctx.fill();
    ctx.fillStyle = on ? '#6dff8f' : '#2f6b3c'; ctx.font = '800 26px ui-monospace, Menlo, monospace'; ctx.textAlign = 'center';
    const s = Math.floor(st.ovenTime); ctx.fillText(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`, 520, 48);
    [[60, 38], [118, 38]].forEach(([x, y], i) => { ctx.fillStyle = '#4a4750'; ctx.beginPath(); ctx.arc(x, y, 18, 0, TAU); ctx.fill(); ctx.strokeStyle = '#d0d6db'; ctx.lineWidth = 4; ctx.beginPath(); const a = on ? -.4 + i : -1.6; ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 13, y + Math.sin(a) * 13); ctx.stroke(); });
    const coil = `rgb(${Math.round(lerp(90, 255, heat))},${Math.round(lerp(90, 120, heat))},${Math.round(lerp(95, 40, heat))})`;
    ctx.strokeStyle = coil; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.shadowColor = '#ff7a1a'; ctx.shadowBlur = heat * 18 * k;
    [96, 544].forEach((y) => { ctx.beginPath(); for (let x = 70; x <= 530; x += 20) ctx.lineTo(x, y + ((x / 20) % 2 ? -6 : 6)); ctx.stroke(); });
    ctx.restore();
    if (on) dirty = true;
  }
  let ovenGlow = 0;
  function steam(ctx) {
    const t = performance.now() / 1000;
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const x0 = C - 60 + i * 60, ph = (t * .5 + i * .33) % 1;
      ctx.globalAlpha = Math.sin(ph * Math.PI);
      ctx.beginPath(); for (let j = 0; j <= 10; j++) { const y = C - 40 - ph * 120 - j * 8; ctx.lineTo(x0 + Math.sin(j * .7 + t * 3 + i) * 8, y); } ctx.stroke();
    }
    ctx.restore(); dirty = true;
  }

  function pos(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * S, y: (e.clientY - r.top) / r.height * S }; }
  function stretch(p) {
    const d = Math.hypot(p.x - C, p.y - C), a = Math.atan2(p.y - C, p.x - C), target = clamp(d, 70, 262);
    for (let i = 0; i < N; i++) {
      let diff = Math.abs(i / N * TAU - a) % TAU; if (diff > Math.PI) diff = TAU - diff;
      const w = Math.exp(-(diff * diff) / (2 * .4 * .4));
      if (target > st.R[i]) st.R[i] += (target - st.R[i]) * w * .3;
    }
    const R2 = st.R.map((r, i) => (st.R[(i + N - 1) % N] + 2 * r + st.R[(i + 1) % N]) / 4);
    st.R = R2; dirty = true;
    stretchSound();
  }
  let lastSound = 0;
  function stretchSound() { const n = performance.now(); if (n - lastSound > 90) { lastSound = n; Curio.beep(140 + meanR() * .8, .05, 'sine', .04); } }
  function doToss() {
    if (toss) return;
    toss = { t0: performance.now(), done: false };
    [300, 400, 500, 650].forEach((f, i) => setTimeout(() => Curio.beep(f, .07, 'sine', .05), i * 90));
  }
  function dab(a, b) {
    const dist = Math.hypot(b.x - a.x, b.y - a.y), steps = Math.max(1, Math.ceil(dist / 6));
    sg.save(); sg.setTransform(LS, 0, 0, LS, 0, 0); sg.clip(pathFor(rimW()));
    const col = hexRgb(SAUCES[st.sauce].c);
    for (let i = 0; i <= steps; i++) {
      const x = lerp(a.x, b.x, i / steps), y = lerp(a.y, b.y, i / steps);
      const gr = sg.createRadialGradient(x, y, 2, x, y, 30);
      gr.addColorStop(0, `rgba(${col.join(',')},.55)`); gr.addColorStop(.7, `rgba(${col.join(',')},.35)`); gr.addColorStop(1, `rgba(${col.join(',')},0)`);
      sg.fillStyle = gr; sg.beginPath(); sg.arc(x, y, 30, 0, TAU); sg.fill();
    }
    sg.restore(); dirty = true;
  }
  function coverage() {
    const data = sg.getImageData(0, 0, sauceC.width, sauceC.height).data;
    let tot = 0, cov = 0;
    for (let y = 0; y < S; y += 8) for (let x = 0; x < S; x += 8) {
      if (!inside(x, y, 2)) continue; tot++;
      if (data[((y * LS) * sauceC.width + x * LS) * 4 + 3] > 90) cov++;
    }
    st.cov = tot ? cov / tot : 0;
  }
  function sprinkle(p, n = 4) {
    if (st.shreds.length > 3200) return;
    const fine = CHEESES[st.cheese].fine;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * 38, x = p.x + Math.cos(a) * r, y = p.y + Math.sin(a) * r;
      if (!inside(x, y, 3)) continue;
      st.shreds.push({ x, y, a: Math.random() * Math.PI, l: fine ? rnd(3, 6) : rnd(8, 15), r: Math.random() });
    }
    dirty = true;
    const nw = performance.now(); if (nw - lastSound > 70) { lastSound = nw; Curio.beep(rnd(2400, 3400), .015, 'triangle', .02); }
  }
  function hitTop(p) { for (let i = st.tops.length - 1; i >= 0; i--) { const t = st.tops[i]; if (Math.hypot(t.x - p.x, t.y - p.y) < TOPS[t.t].size * t.s + 6) return t; } return null; }
  function addTop(type, x, y) {
    st.tops.push({ t: type, x, y, a: Math.random() * TAU, s: rnd(.9, 1.15) });
    Curio.beep(rnd(240, 320), .06, 'sine', .07); dirty = true; stats();
  }
  function poof(x, y) { for (let i = 0; i < 10; i++) particles.push({ x, y, vx: rnd(-2, 2), vy: rnd(-2, 2), r: rnd(3, 7), life: 1, c: '255,255,255' }); }

  function pdown(q) {
    const key = STEPS[st.step].k; if (key === 'bake' || key === 'review') return;
    if (q.event && q.event.cancelable) q.event.preventDefault();
    const p = pos(q); down = p; last = p; ptr = p;
    if (key === 'dough') stretch(p);
    else if (key === 'sauce') dab(p, p);
    else if (key === 'cheese') { sprinkle(p); clearInterval(holdT); holdT = setInterval(() => ptr && down && sprinkle(ptr, 3), 60); }
    else if (key === 'tops') { dragTop = hitTop(p); if (dragTop) { st.tops.splice(st.tops.indexOf(dragTop), 1); st.tops.push(dragTop); dragTop.ghost = true; dragTop.ox = dragTop.x - p.x; dragTop.oy = dragTop.y - p.y; } }
    else if (key === 'slice') cutPrev = p;
    dirty = true;
  }
  function pmove(q) {
    const p = pos(q); ptr = p; dirty = true;
    if (!down) return;
    const key = STEPS[st.step].k;
    if (key === 'dough') stretch(p);
    else if (key === 'sauce') dab(last, p);
    else if (key === 'cheese') sprinkle(p);
    else if (key === 'tops' && dragTop) { dragTop.x = p.x + dragTop.ox; dragTop.y = p.y + dragTop.oy; }
    last = p;
  }
  function up() {
    if (!down) return;
    const key = STEPS[st.step].k;
    clearInterval(holdT);
    if (key === 'sauce') coverage();
    if (key === 'tops' && dragTop) {
      dragTop.ghost = false;
      if (!inside(dragTop.x, dragTop.y, 0)) { st.tops.splice(st.tops.indexOf(dragTop), 1); poof(dragTop.x, dragTop.y); Curio.beep(180, .08, 'triangle', .06); }
      else Curio.beep(300, .04, 'sine', .05);
      dragTop = null;
    }
    if (key === 'slice' && ptr && Math.hypot(ptr.x - down.x, ptr.y - down.y) > 40) addCut(down, ptr);
    down = null; cutPrev = null; dirty = true; stats();
  }
  Curio.drag(cv, { start: pdown, move: pmove, end: up });
  cv.addEventListener('pointermove', (e) => { if (!down) { ptr = pos(e); dirty = true; } });
  cv.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && !down) { ptr = null; dirty = true; } });
  cv.addEventListener('touchstart', (e) => { if (e.cancelable) e.preventDefault(); }, { passive: false });
  addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey || document.querySelector('.curio-modal, .pz-dv')) return;
    const key = STEPS[st.step].k, k = e.key.toLowerCase();
    if (k === 'o' && key === 'bake') { e.preventDefault(); toggleOven(); }
    else if (k === 'n' && key !== 'review' && !st.oven && !(key === 'bake' && st.bake === 0)) { e.preventDefault(); next(); }
    else if (k === 't' && key === 'dough') doToss();
  });
  if (matchMedia('(pointer: fine)').matches && !Curio.touchpad && !Curio.store.get('pizza-tp-tip', false)) { Curio.store.set('pizza-tp-tip', true); setTimeout(() => Curio.toast('Tip: on a touchpad, turn on Touchpad mode in the top bar', 4000), 1200); }

  function addCut(a, b) {
    const r = meanR(), ux = b.x - a.x, uy = b.y - a.y, len = Math.hypot(ux, uy), dx = ux / len, dy = uy / len;
    const t = (C - a.x) * dx + (C - a.y) * dy, fx = a.x + dx * t, fy = a.y + dy * t, h = Math.hypot(C - fx, C - fy);
    if (h > r - 10) { Curio.toast('Missed the pizza!'); return; }
    const half = Math.sqrt((r + 20) ** 2 - h * h);
    st.cuts.push([fx - dx * half, fy - dy * half, fx + dx * half, fy + dy * half]);
    if (!Curio.muted) { const ac = Curio.audioContext(); if (ac) { const o = ac.createOscillator(), gn = ac.createGain(), tt = ac.currentTime; o.type = 'sawtooth'; o.frequency.setValueAtTime(900, tt); o.frequency.exponentialRampToValueAtTime(300, tt + .25); gn.gain.setValueAtTime(.04, tt); gn.gain.exponentialRampToValueAtTime(.0001, tt + .28); o.connect(gn).connect(ac.destination); o.start(tt); o.stop(tt + .3); } }
  }
  function pieces() {
    const r = meanR(), segs = st.cuts.map((c) => {
      const dx = c[2] - c[0], dy = c[3] - c[1], len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
      const t = (C - c[0]) * ux + (C - c[1]) * uy, fx = c[0] + ux * t, fy = c[1] + uy * t, h = Math.hypot(C - fx, C - fy), half = Math.sqrt(Math.max(0, r * r - h * h));
      return [fx - ux * half, fy - uy * half, fx + ux * half, fy + uy * half];
    });
    const pts = [];
    for (let i = 0; i < segs.length; i++) for (let j = i + 1; j < segs.length; j++) {
      const [x1, y1, x2, y2] = segs[i], [x3, y3, x4, y4] = segs[j];
      const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4); if (Math.abs(den) < 1e-6) continue;
      const tA = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den, tB = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;
      if (tA > 0 && tA < 1 && tB > 0 && tB < 1) pts.push({ x: x1 + tA * (x2 - x1), y: y1 + tA * (y2 - y1), lines: [i, j] });
    }
    const clusters = [];
    pts.forEach((q) => {
      const c = clusters.find((cl) => Math.hypot(cl.x - q.x, cl.y - q.y) < 12);
      if (c) q.lines.forEach((l) => c.lines.add(l)); else clusters.push({ x: q.x, y: q.y, lines: new Set(q.lines) });
    });
    return 1 + segs.length + clusters.reduce((a, c) => a + c.lines.size - 1, 0);
  }

  let ghost = null, trayDrag = null;
  function iconFor(type, px) {
    const c = document.createElement('canvas'); const dpr = Math.min(2, devicePixelRatio || 1); c.width = c.height = px * dpr;
    const x = c.getContext('2d'); x.scale(dpr * px / 44, dpr * px / 44); x.translate(22, 22); TOPS[type].draw(x); return c;
  }
  function trayDown(e, type) {
    e.preventDefault();
    trayDrag = { type, x0: e.clientX, y0: e.clientY, moved: false, id: e.pointerId };
  }
  addEventListener('pointermove', (e) => {
    if (!trayDrag || e.pointerId !== trayDrag.id) return;
    if (!trayDrag.moved && Math.hypot(e.clientX - trayDrag.x0, e.clientY - trayDrag.y0) > 6) {
      trayDrag.moved = true; ghost = iconFor(trayDrag.type, 56); ghost.className = 'pz-ghost'; document.body.append(ghost);
    }
    if (ghost) { ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px'; }
  });
  addEventListener('pointerup', (e) => {
    if (!trayDrag || e.pointerId !== trayDrag.id) return;
    const td = trayDrag; trayDrag = null;
    if (ghost) { ghost.remove(); ghost = null; }
    if (!td.moved) { const [x, y] = randomInside(16); addTop(td.type, x, y); return; }
    const r = cv.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width * S, y = (e.clientY - r.top) / r.height * S;
    if (x >= 0 && y >= 0 && x <= S && y <= S && inside(x, y, 0)) addTop(td.type, x, y);
    else if (x >= 0 && y >= 0 && x <= S && y <= S) { Curio.toast('Toppings go on the pizza, not the table'); }
  });
  addEventListener('pointercancel', () => { trayDrag = null; if (ghost) { ghost.remove(); ghost = null; } });

  const CUSTOMERS = [['👵', 'Nonna Rosa'], ['🧔', 'Big Sal'], ['👩‍🚀', 'Commander Lin'], ['🧒', 'Little Timmy'], ['🕵️', 'A Food Critic'], ['🐶', 'The Dog'], ['👨‍🍳', 'Chef Marco'], ['🧛', 'Count Pepperoni'], ['👸', 'Princess Mozzarella'], ['🤖', 'Robot 3000'], ['🦖', 'A Hungry T-Rex'], ['👽', 'Visitor from Mars'], ['🧙', 'Old Wizard Gus'], ['🐱', 'Mr. Whiskers']];
  function evaluate() {
    const mr = meanR(), sd = Math.sqrt(st.R.reduce((a, r) => a + (r - mr) ** 2, 0) / N), round = clamp(1 - sd / mr * 5, 0, 1);
    const inch = Math.round(mr / 250 * 16);
    const doughS = clamp((mr - 120) / 90, 0, 1) * .5 + round * .5;
    const cov = st.cov, sauceS = cov < .75 ? cov / .75 : 1;
    const ri = mr - rimW(), area = Math.PI * ri * ri, dens = st.shreds.length * (CHEESES[st.cheese].fine ? 45 : 95) / area;
    const cheeseS = dens < .6 ? dens / .6 * .8 : dens <= 1.8 ? 1 : Math.max(.4, 1 - (dens - 1.8) * .25);
    const n = st.tops.length, kinds = new Set(st.tops.map((t) => t.t)).size;
    let topsS = n === 0 ? .35 : clamp(n / 8, 0, 1) * .6 + clamp(kinds / 3, 0, 1) * .4;
    if (n > 70) topsS *= .6;
    const spread = n ? st.tops.reduce((a, t) => a + Math.hypot(t.x - C, t.y - C), 0) / n / ri : 0;
    if (n > 3 && spread < .3) topsS *= .75;
    const b = st.bake, bakeS = b >= .85 && b <= 1.25 ? 1 : b < .85 ? b / .85 * .85 : Math.max(0, 1 - (b - 1.25) * 1.5);
    const pc = pieces(), sliceS = pc <= 1 ? .3 : pc >= 6 && pc <= 12 ? 1 : pc < 6 ? .75 : .7;
    const noCheese = st.order && st.order.cheese === 'none';
    let total = doughS * 15 + sauceS * 15 + (noCheese ? 1 : cheeseS) * 15 + topsS * 15 + bakeS * 30 + sliceS * 10;
    if (b > 1.8) total = Math.min(total, 25);
    if (b < .3) total = Math.min(total, 40);
    const om = st.order ? orderMatch(st.order, dens, pc) : null;
    if (om) total = total * .6 + om.score * 40;
    total = Math.round(total);
    const bad = [], good = [];
    const say = (s, v, lo, hi) => { if (v < .55) bad.push([v, lo]); else if (v > .9) good.push([v, hi]); };
    say('dough', doughS, mr < 160 ? `It was the size of a drinks coaster.` : `The shape reminded me of a map of Norway.`, `Huge, gorgeous, ${inch}-inch base.`);
    say('sauce', sauceS, cov < .05 && st.sauce !== 'white' ? 'Was there supposed to be sauce?' : 'The sauce was patchy, like a dalmatian.', `${SAUCES[st.sauce].name} sauce right to the edges.`);
    if (!noCheese) say('cheese', cheeseS, dens < .1 ? 'No cheese. Bold. Wrong, but bold.' : dens < .6 ? 'Could have used way more cheese.' : 'I was buried alive in cheese.', `The ${CHEESES[st.cheese].name.toLowerCase()} pull went on for days.`);
    say('tops', topsS, n === 0 ? 'Plain and simple. Very minimalist.' : n > 70 ? 'I found a pizza somewhere under that salad.' : spread < .3 ? 'All the toppings were huddled in the middle like penguins.' : 'A bit stingy on the toppings.', kinds >= 4 ? 'What a topping combo!' : 'Toppings were spot on.');
    const bakeLine = b < .3 ? 'It was still raw. I could hear it breathing.' : b < .7 ? 'A couple more minutes in the oven would have done it.' : b <= 1.25 ? 'Baked to golden perfection.' : b < 1.6 ? 'A little crispy around the edges.' : b < 2 ? 'It tasted like a campfire. A sad campfire.' : 'I have had better meals from a volcano.';
    (bakeS > .9 ? good : bad).push([bakeS - .01, bakeLine]);
    say('slice', sliceS, pc <= 1 ? 'Nobody sliced it, so I ate it like a frisbee.' : pc > 12 ? 'Why are there so many tiny slices?' : 'The slices were a bit wonky.', 'Perfect slices, very professional.');
    const has = (t) => st.tops.some((x) => x.t === t);
    const extra = [];
    if (has('pineapple') && has('anchovy')) extra.push('Pineapple AND anchovies? You are an agent of chaos.');
    else if (has('pineapple')) extra.push(Curio.pick(['Pineapple. I have opinions, but I will keep them to myself.', 'Pineapple! Finally someone brave.']));
    else if (has('anchovy')) extra.push('Anchovies! Someone who finally gets me.');
    if (has('egg')) extra.push('An egg on a pizza? Fancy.');
    if (st.sauce === 'bbq') extra.push('The BBQ sauce was a nice touch.');
    if (st.cheese === 'blue') extra.push('Blue cheese is a choice, and I respect it.');
    if (st.sauce === 'choc') extra.push('Chocolate sauce. My dentist will hear about this.');
    if (has('marshmallow') && st.sauce !== 'choc') extra.push('Marshmallows on a savoury pizza? Brave.');
    if (st.dough === 'charcoal') extra.push('The black dough looked very mysterious.');
    if (st.dough === 'beet') extra.push('A pink pizza! My camera loved it.');
    if (om && om.score === 1) extra.unshift('Exactly what I ordered!');
    else if (om && om.score < .5) extra.unshift(`This is not a ${st.order.name}. Not even close.`);
    else if (om) extra.unshift(`Close to my ${st.order.name}, but ${om.missLine}`);
    bad.sort((a, c) => a[0] - c[0]); good.sort((a, c) => c[0] - a[0]);
    const stars = clamp(Math.round(total / 20), 1, 5);
    const opener = ['Absolutely not.', 'Hmm.', 'It was... food.', 'Pretty good!', 'Bellissima!'][stars - 1];
    const lines = [opener, ...good.slice(0, stars >= 4 ? 2 : 1).map((x) => x[1]), ...bad.slice(0, stars >= 4 ? 1 : 2).map((x) => x[1]), ...extra.slice(0, 1)];
    const closer = ['I would rather eat the box.', 'Two stars, mainly for effort.', 'I would order it again if nothing else was open.', 'I will be back next week!', 'Best pizza in town. Maybe the universe.'][stars - 1];
    lines.push(closer);
    const parts = [['Dough', doughS], ['Sauce', sauceS], ['Cheese', noCheese ? 1 : cheeseS], ['Toppings', topsS], ['Bake', bakeS], ['Slicing', sliceS]];
    if (om) parts.push(['Order match', om.score]);
    return { total, stars, text: lines.join(' '), who: st.order ? st.order.who : Curio.pick(CUSTOMERS), parts, pc, inch, bakeS, om };
  }
  function orderChecks(o, dens, pc) {
    const kinds = new Set(st.tops.map((t) => t.t));
    const cnt = (t) => st.tops.filter((x) => x.t === t).length;
    const out = [];
    if (o.dough) out.push([`${DOUGHS[o.dough].name} dough`, st.dough === o.dough, `the dough was wrong`]);
    out.push([`${SAUCES[o.sauce].name} sauce`, st.sauce === o.sauce && st.cov > .4, `the sauce was not right`]);
    if (o.cheese === 'none') out.push(['No cheese', dens < .08, 'I said NO cheese']);
    else out.push([CHEESES[o.cheese].name, st.cheese === o.cheese && dens >= .25, `I wanted ${CHEESES[o.cheese].name.toLowerCase()}`]);
    o.need.forEach((t) => out.push([TOPS[t].name, cnt(t) >= 2, `where was the ${TOPS[t].name.toLowerCase()}?`]));
    if (o.avoid) out.push([`No ${o.avoid.length > 3 ? 'meat or fish' : o.avoid.map((t) => TOPS[t].name.toLowerCase()).join(', ')}`, !o.avoid.some((t) => kinds.has(t)), 'you added something I asked you not to']);
    if (o.max) out.push([`Only ${o.max === 1 ? 'that topping' : o.max + ' kinds of topping'}`, kinds.size <= o.max, 'there was way too much going on']);
    if (o.minTops) out.push([`At least ${o.minTops} toppings`, st.tops.length >= o.minTops, 'it needed more toppings']);
    out.push([`${o.slices || 8} slices`, pc === (o.slices || 8), 'the slicing was off']);
    return out;
  }
  function orderMatch(o, dens, pc) {
    const ch = orderChecks(o, dens, pc), ok = ch.filter((c) => c[1]).length;
    const miss = ch.find((c) => !c[1]);
    return { score: ok / ch.length, checks: ch, missLine: miss ? miss[2] + '.' : '' };
  }

  function bakeLabel(b) { return b < .3 ? 'Raw' : b < .65 ? 'Doughy' : b < .85 ? 'Nearly there' : b <= 1.25 ? 'Golden' : b < 1.55 ? 'Crispy' : b < 1.9 ? 'Burnt' : 'Charcoal'; }

  function stats() {
    const key = STEPS[st.step].k, set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
    if (key === 'dough') {
      const mr = meanR(), sd = Math.sqrt(st.R.reduce((a, r) => a + (r - mr) ** 2, 0) / N);
      set('sSize', `${Math.max(6, Math.round(mr / 250 * 16))}"`); set('sRound', `${Math.round(clamp(1 - sd / mr * 5, 0, 1) * 100)}%`);
    } else if (key === 'sauce') set('sCov', `${Math.round(st.cov * 100)}%`);
    else if (key === 'cheese') {
      const ri = meanR() - rimW(), d = st.shreds.length * (CHEESES[st.cheese].fine ? 45 : 95) / (Math.PI * ri * ri);
      set('sCheese', d < .1 ? 'None' : d < .6 ? 'Light' : d <= 1.8 ? 'Just right' : d < 3 ? 'Extra' : 'Avalanche'); set('sShreds', Curio.fmt(st.shreds.length));
    } else if (key === 'tops') { set('sTops', st.tops.length); set('sKinds', new Set(st.tops.map((t) => t.t)).size); }
    else if (key === 'bake') {
      set('sTimer', `${Math.floor(st.ovenTime / 60)}:${String(Math.floor(st.ovenTime % 60)).padStart(2, '0')}`); set('sBake', bakeLabel(st.bake));
      const nd = $('needle'); if (nd) nd.style.left = `calc(${clamp(st.bake / 2.2, 0, 1) * 100}% - 2px)`;
    } else if (key === 'slice') set('sPieces', pieces());
    markTicket();
  }

  function btn(label, fn, ghostStyle = true, id) { const b = document.createElement('button'); b.type = 'button'; b.className = ghostStyle ? 'c-btn c-btn--ghost' : 'c-btn'; b.textContent = label; if (id) b.id = id; b.addEventListener('click', fn); return b; }
  function stat(id, label) { return `<div class="pz-stat"><b id="${id}">-</b><span>${label}</span></div>`; }
  function chips(map, cur, onPick, swatch) {
    const w = document.createElement('div'); w.className = 'pz-chips';
    Object.entries(map).forEach(([kk, v]) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'pz-chip'; b.setAttribute('aria-pressed', String(kk === cur));
      b.innerHTML = `<i style="background:${swatch(v)}"></i>${v.name}`;
      b.addEventListener('click', () => { onPick(kk); w.querySelectorAll('.pz-chip').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); });
      w.append(b);
    });
    return w;
  }
  function next() { go(st.step + 1); }
  function panel() {
    const p = $('panel'), key = STEPS[st.step].k; p.innerHTML = '';
    const head = (h, t) => { p.insertAdjacentHTML('beforeend', `<h2>${h}</h2><p>${t}</p>`); };
    const row = (...els) => { const r = document.createElement('div'); r.className = 'pz-btns'; r.append(...els); p.append(r); return r; };
    if (key === 'dough') {
      head('1. Stretch the dough', 'Pick a dough, then grab the edge and drag outward. Toss it in the air to even it out. Bigger and rounder scores better.');
      p.append(chips(DOUGHS, st.dough, (kk) => { st.dough = kk; dirty = true; const t = $('doughTip'); if (t) t.textContent = DOUGHS[kk].tip; Curio.beep(380, .05, 'triangle', .05); markTicket(); }, (v) => v.sw));
      p.insertAdjacentHTML('beforeend', `<p class="pz-tip" id="doughTip">${dType().tip}</p>`);
      p.insertAdjacentHTML('beforeend', `<div class="pz-stats">${stat('sSize', 'Size')}${stat('sRound', 'Roundness')}</div>`);
      row(btn('🌀 Toss it', doToss), btn('↺ New dough', () => { st.R = new Array(N).fill(118); sg.clearRect(0, 0, sauceC.width, sauceC.height); st.cov = 0; st.shreds = []; st.tops = []; dirty = true; stats(); }));
      row(btn('Next: sauce →', next, false));
    } else if (key === 'sauce') {
      head('2. Ladle on the sauce', 'Drag the ladle around in circles. Right to the edges, but not on the crust.');
      p.append(chips(SAUCES, st.sauce, (kk) => { st.sauce = kk; dirty = true; }, (v) => v.c));
      p.insertAdjacentHTML('beforeend', `<div class="pz-stats">${stat('sCov', 'Coverage')}</div>`);
      row(btn('🥄 Swirl it for me', autoSauce), btn('🧽 Wipe', () => { sg.clearRect(0, 0, sauceC.width, sauceC.height); st.cov = 0; dirty = true; stats(); }));
      row(btn('Next: cheese →', next, false));
    } else if (key === 'cheese') {
      head('3. Sprinkle the cheese', 'Hold and drag to shake cheese everywhere. It melts in the oven, so a little goes a long way.');
      p.append(chips(CHEESES, st.cheese, (kk) => { st.cheese = kk; dirty = true; stats(); }, (v) => v.c[0] === '#fffaf0' ? '#fff3c9' : v.c[0]));
      p.insertAdjacentHTML('beforeend', `<div class="pz-stats">${stat('sCheese', 'Cheesiness')}${stat('sShreds', 'Shreds')}</div>`);
      row(btn('🧀 A big handful', () => { for (let i = 0; i < 170; i++) { const [x, y] = randomInside(6); sprinkle({ x, y }, 3); } stats(); }), btn('🧽 Brush off', () => { st.shreds = []; dirty = true; stats(); }));
      row(btn('Next: toppings →', next, false));
    } else if (key === 'tops') {
      head('4. Pile on the toppings', 'Drag toppings onto the pizza, or tap one to drop it somewhere. Drag a topping off the pizza to remove it.');
      const tabs = document.createElement('div'); tabs.className = 'pz-chips pz-tabs';
      Object.entries(GROUPS).forEach(([gk, gv]) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'pz-chip'; b.textContent = gv.label; b.setAttribute('aria-pressed', String(gk === group));
        b.addEventListener('click', () => { group = gk; panel(); });
        tabs.append(b);
      });
      p.append(tabs);
      const tray = document.createElement('div'); tray.className = 'pz-tray';
      GROUPS[group].items.filter((kk) => TOPS[kk]).map((kk) => [kk, TOPS[kk]]).forEach(([kk, v]) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'pz-top'; b.setAttribute('aria-label', 'Add ' + v.name);
        b.append(iconFor(kk, 40)); const s = document.createElement('span'); s.textContent = v.name; b.append(s);
        b.addEventListener('pointerdown', (e) => trayDown(e, kk));
        b.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const [x, y] = randomInside(16); addTop(kk, x, y); } });
        tray.append(b);
      });
      p.append(tray);
      p.insertAdjacentHTML('beforeend', `<div class="pz-stats">${stat('sTops', 'Toppings')}${stat('sKinds', 'Kinds')}</div>`);
      row(btn("🎲 Chef's choice", () => { Curio.shuffle(Object.keys(TOPS)).slice(0, Curio.randInt(2, 4)).forEach((kk) => { for (let i = 0; i < Curio.randInt(4, 8); i++) { const [x, y] = randomInside(16); st.tops.push({ t: kk, x, y, a: Math.random() * TAU, s: rnd(.9, 1.15) }); } }); Curio.beep(520, .06, 'triangle', .06); dirty = true; stats(); }), btn('🧽 Clear', () => { st.tops = []; dirty = true; stats(); }));
      row(btn('Into the oven →', next, false));
    } else if (key === 'bake') {
      head('5. Bake it', 'Start the oven, watch the cheese bubble, and pull it out when it looks golden. Do not wander off.');
      p.insertAdjacentHTML('beforeend', `<div class="pz-timer" id="sTimer">0:00</div>
        <div class="pz-meter" aria-hidden="true"><span style="background:#f6e3b8">Raw</span><span style="background:#f2cf86">Melty</span><span style="background:#f0b34a">Golden</span><span style="background:#b8692c;color:#fff">Crispy</span><span style="background:#3b2412;color:#fff">Burnt</span><i class="pz-needle" id="needle"></i></div>
        <div class="pz-stats">${stat('sBake', 'Looks')}</div>`);
      const ob = btn(st.oven ? '🧯 Take it out!' : (st.bake > 0 ? '🔥 Bake a bit more' : '🔥 Start the oven'), toggleOven, false, 'ovenBtn');
      row(ob);
      const nb = btn('Next: slice →', next, true, 'bakeNext'); nb.disabled = st.oven || st.bake === 0; row(nb);
    } else if (key === 'slice') {
      head('6. Slice it', 'Drag the pizza cutter across the pizza. Each cut goes all the way through. Most people like 8 slices.');
      p.insertAdjacentHTML('beforeend', `<div class="pz-stats">${stat('sPieces', 'Slices')}</div>`);
      row(btn('🍕 Cut 8 for me', () => { st.cuts = []; const r = meanR() + 20; for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI + .2; st.cuts.push([C - Math.cos(a) * r, C - Math.sin(a) * r, C + Math.cos(a) * r, C + Math.sin(a) * r]); } Curio.beep(700, .1, 'sawtooth', .03); dirty = true; stats(); }), btn('↶ Undo cut', () => { st.cuts.pop(); dirty = true; stats(); }));
      row(btn('🛎️ Serve it!', next, false));
    } else if (key === 'review') {
      const r = st.review || (st.review = evaluate());
      const bestR = Curio.best('score', r.total);
      const made = Curio.store.get('pizza-made', 0) + (r.counted ? 0 : 1);
      if (!r.counted) {
        Curio.store.set('pizza-made', made); r.counted = true; r.isNew = bestR.isNew; r.best = bestR.best;
        r.tip = [0, 1, 2, 4, 7, 10][r.stars] + (r.om ? Math.round(r.om.score * 6) : 0);
        career.made++; career.tips += r.tip;
        if (!career.doughs.includes(st.dough)) career.doughs.push(st.dough);
        if (r.om) { career.orders++; const key = st.order.daily ? 'daily-' + today : st.order.name; career.ob[key] = Math.max(career.ob[key] || 0, r.total); }
        saveCareer();
        award(r, made);
        if (r.stars >= 5) Curio.confetti(); [523, 659, 784, 1047].slice(0, Math.max(1, r.stars - 1)).forEach((f, i) => setTimeout(() => Curio.beep(f, .12, 'triangle', .07), i * 130));
      }
      p.insertAdjacentHTML('beforeend', `<h2>7. The review is in</h2>
        <div class="pz-review"><div class="pz-who"><span class="face" aria-hidden="true">${r.who[0]}</span><div><b>${r.who[1]}</b><div class="pz-stars" aria-label="${r.stars} out of 5 stars">${Array.from({ length: 5 }, (_, i) => `<span style="animation-delay:${i * 120}ms">${i < r.stars ? '⭐' : '☆'}</span>`).join('')}</div></div></div>
        <p class="pz-quote">"${r.text}"</p>
        <div class="pz-break">${r.parts.map(([n, v]) => `<span>${n}</span><b>${Math.round(v * 100)}%</b>`).join('')}</div></div>
        <div class="pz-stats"><div class="pz-stat"><b>${r.total}</b><span>Score</span></div><div class="pz-stat"><b>${r.best}</b><span>${r.isNew ? 'New best!' : 'Best'}</span></div><div class="pz-stat"><b>$${r.tip + (r.dtip || 0)}</b><span>Tip</span></div></div>`);
      if (!r.delivered) row(btn('🛵 Deliver it for a bigger tip!', () => deliver(r), false));
      else p.insertAdjacentHTML('beforeend', `<p class="pz-tip">${r.dline}</p>`);
      row(btn('🖼️ Save PNG', savePng), btn('📋 Share', () => shareReview(r)), btn('🍕 Make another', () => { reset(); }, !!r.delivered ? false : true));
    }
    stats();
  }
  async function deliver(r) {
    const host = cv.parentElement;
    host.scrollIntoView({ block: 'center', behavior: 'smooth' });
    Curio.beep(330, .1, 'square', .05);
    const res = await window.PizzaDelivery.start(host, { distance: 1400 + r.stars * 100, house: 10 + Math.floor(Math.random() * 90) });
    r.delivered = true;
    if (!res.arrived) { r.dtip = 0; r.dline = res.cond <= 0 ? 'The pizza did not survive the trip. The customer got a refund and a sad face. 😢' : 'You gave up on the delivery. The customer collected it themselves, grumbling.'; }
    else {
      const timeBonus = res.time < 26 ? 1.25 : 1;
      r.dtip = Math.max(0, Math.round((r.tip + 2) * res.cond * timeBonus + res.coins * .5));
      r.dline = `Delivered in ${res.time.toFixed(1)}s with the pizza ${Math.round(res.cond * 100)}% intact and ${res.coins} coins grabbed. Extra tip: $${r.dtip}${timeBonus > 1 ? ' (speedy bonus!)' : ''}.`;
      career.deliveries++;
      if (res.cond >= 1) badge('flawless');
      badge('rider');
    }
    career.tips += r.dtip; saveCareer();
    if (career.tips >= 100) badge('rich');
    if (career.tips >= 500) badge('tycoon');
    panel(); paintWallet();
  }
  async function shareReview(r) {
    const txt = `🍕 Zoble Pizza Maker: ${r.total}/100 ${'⭐'.repeat(r.stars)}${st.order ? ` · ${st.order.name}` : ''}\n"${r.text.slice(0, 120)}${r.text.length > 120 ? '...' : ''}"`;
    try { await navigator.clipboard.writeText(txt); Curio.toast('Review copied 📋'); } catch { Curio.toast('Copy failed'); }
  }
  function autoSauce() {
    const pts = [], rmax = meanR() - rimW() - 8;
    for (let t = 0; t < 1; t += .004) { const a = t * TAU * 7, r = t * rmax; pts.push({ x: C + Math.cos(a) * r, y: C + Math.sin(a) * r }); }
    let i = 0, prev = pts[0];
    (function step() { for (let j = 0; j < 8 && i < pts.length; j++, i++) { dab(prev, pts[i]); prev = pts[i]; } if (i < pts.length) requestAnimationFrame(step); else { coverage(); stats(); } })();
  }
  let ovenTick = 0;
  function toggleOven() {
    if (!st.oven) { st.oven = true; ovenGlow = 1; Curio.beep(110, .3, 'sawtooth', .04); }
    else { st.oven = false; Curio.beep(1568, .3, 'sine', .1); Curio.toast(`Out of the oven: ${bakeLabel(st.bake).toLowerCase()}!`); }
    steps(); panel(); dirty = true;
  }
  let crossed = 0;
  function bakeTick(dt) {
    if (!st.oven) return;
    const before = st.bake;
    st.bake += dt / 9 * dType().rate; st.ovenTime += dt;
    if (st.bake > .25 && Math.random() < .3) { const [x, y] = randomInside(10); particles.push({ x, y, vx: 0, vy: -.2, r: rnd(2, 4), life: .8, c: '255,250,230' }); }
    if (st.bake > 1.3 && Math.random() < .4 + (st.bake - 1.3)) { const [x, y] = randomInside(0); particles.push({ x, y, vx: rnd(-.4, .4), vy: rnd(-1.6, -.6), r: rnd(8, 18), life: 1, c: st.bake > 1.7 ? '40,40,40' : '150,150,150' }); }
    if (before < .85 && st.bake >= .85 && crossed < 1) { crossed = 1; Curio.beep(1320, .25, 'sine', .1); Curio.toast('Smells amazing. Looking golden! 👃'); }
    if (before < 1.35 && st.bake >= 1.35 && crossed < 2) { crossed = 2; Curio.toast('Is something... crispy? 😬'); }
    if (st.bake > 1.6) { ovenTick += dt; if (ovenTick > .45) { ovenTick = 0; Curio.beep(2100, .12, 'square', .05); } }
    if (st.bake >= 2.3) { st.oven = false; Curio.toast('The smoke alarm took it out for you 🚒'); steps(); panel(); }
    if (Math.floor(st.ovenTime) !== Math.floor(st.ovenTime - dt)) Curio.beep(70, .04, 'sine', .03);
    stats();
  }

  function savePng() {
    const c = document.createElement('canvas'); c.width = c.height = 1200; const x = c.getContext('2d');
    render(x, 2, false);
    c.toBlob((b) => { if (!b) return; const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'curio-pizza.png'; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); Curio.toast('Pizza portrait saved 🍕'); }, 'image/png');
  }

  function canGo(i) { if (st.oven) return false; if (i > st.max) return false; if (st.bake > 0 && i < 4) return false; if (i === 6 && !st.review && st.max < 6) return false; return true; }
  function go(i) {
    i = clamp(i, 0, STEPS.length - 1);
    if (i > st.max) st.max = i; else if (!canGo(i)) return;
    if (i === 6 && st.step !== 6) st.review = null;
    st.step = i; ptr = null; down = null; dirty = true;
    steps(); panel();
    Curio.beep(440 + i * 70, .05, 'triangle', .05);
  }
  function steps() {
    const el = $('steps'); el.innerHTML = '';
    STEPS.forEach((s, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'pz-step' + (i < st.max && i !== st.step ? ' done' : '');
      b.innerHTML = `<i aria-hidden="true">${s.icon}</i>${s.label}`;
      if (i === st.step) b.setAttribute('aria-current', 'step');
      b.disabled = i !== st.step && !canGo(i);
      b.addEventListener('click', () => go(i));
      el.append(b);
      if (i === st.step) requestAnimationFrame(() => { el.scrollLeft = b.offsetLeft - el.clientWidth / 2 + b.offsetWidth / 2; });
    });
  }
  function reset() {
    st = fresh(); crossed = 0; sg.clearRect(0, 0, sauceC.width, sauceC.height); particles.length = 0;
    if (career.mode === 'orders') st.order = Object.assign({}, Curio.pick(PD.orders.filter((o) => !lastOrder || o.name !== lastOrder)));
    else if (career.mode === 'daily') st.order = Object.assign({ daily: true }, PD.orders[dailyIdx]);
    if (st.order) lastOrder = st.order.name;
    go(0); steps(); renderTicket();
  }

  function resize() { const r = cv.getBoundingClientRect(); const dpr = Math.min(2, devicePixelRatio || 1); cv.width = cv.height = Math.max(100, Math.round(r.width * dpr)); k = cv.width / S; dirty = true; }
  addEventListener('resize', resize);
  let lastT = performance.now(), raf = 0;
  function loop(now) {
    raf = 0; if (document.hidden) return;
    const dt = Math.min(.05, (now - lastT) / 1000); lastT = now;
    bakeTick(dt);
    if (toss) {
      const p = (now - toss.t0) / 900;
      if (p >= .5 && !toss.done) { toss.done = true; const m = meanR(), target = Math.min(250, m * 1.06 + 4); st.R = st.R.map((r) => lerp(r, m, .65) * target / m); stats(); }
      if (p >= 1) { toss = null; Curio.beep(200, .08, 'sine', .07); }
      dirty = true;
    }
    for (let i = particles.length - 1; i >= 0; i--) { const q = particles[i]; q.x += q.vx; q.y += q.vy; q.r += .15; q.life -= .015; if (q.life <= 0) particles.splice(i, 1); }
    if (particles.length) dirty = true;
    if (dirty) { dirty = false; render(g, k); }
    raf = requestAnimationFrame(loop);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !raf) { lastT = performance.now(); raf = requestAnimationFrame(loop); } });
  const today = new Date().toISOString().slice(0, 10);
  const dailyIdx = (() => { let h = 7; for (const ch of today) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h % PD.orders.length; })();
  let lastOrder = null;
  const career = Object.assign({ v: 1, mode: 'free', made: 0, tips: 0, deliveries: 0, orders: 0, doughs: [], ob: {}, badges: [] }, Curio.store.get('pizza-career', {}) || {});
  ['doughs', 'badges'].forEach((k) => { if (!Array.isArray(career[k])) career[k] = []; });
  if (!career.ob || typeof career.ob !== 'object') career.ob = {};
  if (!['free', 'orders', 'daily'].includes(career.mode)) career.mode = 'free';
  function saveCareer() { Curio.store.set('pizza-career', career); }
  const BADGES = [
    { id: 'first', icon: '🍕', name: 'First slice', d: 'Serve your first pizza' },
    { id: 'five', icon: '⭐', name: 'Five stars', d: 'Get a 5 star review' },
    { id: 'ten', icon: '👨‍🍳', name: 'Line cook', d: 'Serve 10 pizzas' },
    { id: 'fifty', icon: '🏆', name: 'Pizzaiolo', d: 'Serve 50 pizzas' },
    { id: 'golden', icon: '🔥', name: 'Golden touch', d: 'Bake a pizza perfectly' },
    { id: 'charcoal', icon: '🧯', name: 'Smoke alarm', d: 'Burn a pizza to charcoal' },
    { id: 'order', icon: '🧾', name: 'Order up', d: 'Nail an order exactly' },
    { id: 'orders10', icon: '📋', name: 'Regulars', d: 'Complete 10 orders' },
    { id: 'doughs', icon: '🫓', name: 'Dough nerd', d: 'Bake with every dough' },
    { id: 'rider', icon: '🛵', name: 'Delivery rider', d: 'Deliver a pizza' },
    { id: 'flawless', icon: '📦', name: 'Not a scratch', d: 'Deliver at 100% condition' },
    { id: 'rich', icon: '💰', name: 'Tip jar', d: 'Earn $100 in tips' },
    { id: 'tycoon', icon: '🏦', name: 'Pizza tycoon', d: 'Earn $500 in tips' },
    { id: 'dessert', icon: '🍓', name: 'Sweet tooth', d: 'Make a chocolate pizza' }
  ];
  function badge(id) {
    if (career.badges.includes(id)) return;
    career.badges.push(id); saveCareer();
    const b = BADGES.find((x) => x.id === id);
    if (b) { setTimeout(() => Curio.toast(`${b.icon} Badge: ${b.name}`, 2600), 600); setTimeout(() => [784, 988, 1318].forEach((f, i) => setTimeout(() => Curio.beep(f, .1, 'triangle', .06), i * 80)), 600); }
    renderBadges();
  }
  function award(r, made) {
    badge('first');
    if (r.stars >= 5) badge('five');
    if (made >= 10) badge('ten');
    if (made >= 50) badge('fifty');
    if (r.bakeS >= 1) badge('golden');
    if (st.bake >= 1.9) badge('charcoal');
    if (r.om && r.om.score === 1) badge('order');
    if (career.orders >= 10) badge('orders10');
    if (career.doughs.length >= Object.keys(DOUGHS).length) badge('doughs');
    if (st.sauce === 'choc') badge('dessert');
    if (career.tips >= 100) badge('rich');
    paintWallet();
  }
  function renderBadges() {
    const el = $('badges'); if (!el) return; el.innerHTML = '';
    BADGES.forEach((b) => {
      const d = document.createElement('div'); d.className = 'pz-badge' + (career.badges.includes(b.id) ? ' got' : '');
      d.innerHTML = `<i aria-hidden="true">${b.icon}</i><div><b></b><span></span></div>`;
      d.querySelector('b').textContent = b.name; d.querySelector('span').textContent = b.d;
      el.append(d);
    });
    $('careerStats').innerHTML = [[Curio.store.get('pizza-made', 0), 'Pizzas'], [`$${career.tips}`, 'Tips'], [career.deliveries, 'Deliveries'], [career.orders, 'Orders'], [Curio.getBest ? (Curio.getBest('score') || 0) : 0, 'Best score'], [`${career.badges.length}/${BADGES.length}`, 'Badges']]
      .map(([v, l]) => `<div class="pz-stat"><b>${v}</b><span>${l}</span></div>`).join('');
  }
  function paintWallet() { $('wallet').textContent = `💰 $${career.tips}`; renderBadges(); }
  const MODES = { free: '🍕 Free bake', orders: '🧾 Orders', daily: '📅 Daily special' };
  Object.entries(MODES).forEach(([kk, label]) => {
    const b = document.createElement('button'); b.type = 'button'; b.dataset.m = kk; b.textContent = label;
    b.addEventListener('click', () => { if (st.oven) return; career.mode = kk; saveCareer(); paintModes(); reset(); });
    $('modes').append(b);
  });
  function paintModes() { $('modes').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.m === career.mode))); }
  function densNow() { const ri = meanR() - rimW(); return st.shreds.length * (CHEESES[st.cheese].fine ? 45 : 95) / (Math.PI * ri * ri); }
  function renderTicket() {
    const t = $('ticket');
    if (!st.order) { t.hidden = true; return; }
    const o = st.order;
    t.hidden = false;
    const best = career.ob[o.daily ? 'daily-' + today : o.name];
    t.innerHTML = `<div class="pz-tk-head"><span class="face" aria-hidden="true">${o.who[0]}</span><div><small>${o.daily ? "Today's special for" : 'Order for'} ${o.who[1]}</small><b>${o.name}</b></div>${best ? `<span class="pz-tk-best">Best ${best}</span>` : ''}</div><p class="pz-tk-note">"${o.note}"</p><ul class="pz-tk-list" id="tkList"></ul>`;
    t.classList.remove('in'); void t.offsetWidth; t.classList.add('in');
    markTicket();
  }
  function markTicket() {
    const ul = $('tkList'); if (!ul || !st.order) return;
    const ch = orderChecks(st.order, densNow(), pieces());
    ul.innerHTML = ch.map(([label, ok]) => `<li class="${ok ? 'ok' : ''}">${ok ? '✅' : '⬜'} ${label}</li>`).join('');
  }
  st = fresh(); resize(); paintModes(); paintWallet(); reset(); raf = requestAnimationFrame(loop);
})();
