(function () {
  const O = window.SPACE_OBJECTS;
  const A = window.SpaceArt;
  const N = O.length;
  const cv = document.getElementById('sky');
  const g = cv.getContext('2d');
  const stage = document.getElementById('stage');
  const $ = (id) => document.getElementById(id);
  const slider = $('slider');
  slider.max = N - 1;
  const START = Math.max(0, O.findIndex((o) => o.start));
  const font = getComputedStyle(document.body).fontFamily;

  const saved = Curio.store.get('sos:save', null);
  const S = { v: 2, seen: [], badges: [], f: START };
  if (saved && saved.v === 2) Object.assign(S, saved);
  if (!Array.isArray(S.seen)) S.seen = [];
  if (!Array.isArray(S.badges)) S.badges = [];
  let saveT = 0;
  const save = () => { clearTimeout(saveT); saveT = setTimeout(() => Curio.store.set('sos:save', S), 300); };

  O.forEach((o) => {
    o.h = A.HEIGHT[o.kind] || 1;
    o.w = o.ring ? 2.3 : (A.WIDTH[o.kind] || 1);
    o.land = o.zone !== 'space';
    o.cy = o.land ? (A.FLOAT.has(o.kind) ? o.s * 1.1 : o.s * o.h / 2) : 0;
    o.fit = o.s * Math.max(1, o.h / 1.15, o.w / 2.2);
    o.gap = 0.32 * o.s * Math.max(0.6, o.w);
  });
  O[0].x = 0;
  for (let i = 1; i < N; i++) O[i].x = O[i - 1].x + O[i - 1].w * O[i - 1].s / 2 + O[i - 1].gap + O[i].w * O[i].s / 2;

  let rs = 42;
  const rnd = () => { rs = (rs * 16807) % 2147483647; return (rs - 1) / 2147483646; };
  const stars = Array.from({ length: 300 }, () => ({ x: rnd(), y: rnd(), r: rnd() * 1.4 + 0.2, a: rnd() * 0.7 + 0.2, p: rnd() * 6 }));
  const motes = Array.from({ length: 40 }, () => ({ x: rnd(), y: rnd(), r: rnd() * 18 + 4, a: rnd() * 0.12 + 0.03, p: rnd() * 6 }));

  let W = 0, H = 0, dpr = 1;
  function resize() {
    dpr = Math.min(2, devicePixelRatio || 1);
    W = stage.clientWidth; H = stage.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    dirty = true;
  }
  const panelH = () => { const p = document.querySelector('.panel:not([hidden])'); return p ? p.offsetHeight + 24 : 170; };
  const smooth = (t) => t * t * (3 - 2 * t);
  const lerp = (a, b, t) => a + (b - a) * t;
  let PH = 170;
  function camera(f) {
    const i = Math.min(N - 2, Math.max(0, Math.floor(f)));
    const t = Math.min(1, Math.max(0, f - i));
    const a = O[i], b = O[i + 1];
    const avail = H - PH - 60;
    const target = Math.min(W * 0.42, avail * 0.62);
    const logS = lerp(Math.log(a.fit), Math.log(b.fit), t);
    const k = target / Math.exp(logS);
    const st = smooth(t);
    const B = a.x + a.w * a.s / 2 + a.gap;
    const P0 = (a.w * a.s / 2 + a.gap) * (target / a.fit);
    const P1 = -(b.w * b.s / 2) * (target / b.fit);
    const cx = B - lerp(P0, P1, st) / k;
    const cy = lerp(a.cy, b.cy, st);
    return { k, cx, cy, midY: 50 + avail * 0.5 + 10 };
  }

  const ZC = { micro: [[8, 38, 48], [20, 74, 82]], space: [[4, 5, 12], [11, 13, 28]] };
  const landC = () => Curio.isDark() ? [[28, 43, 82], [58, 79, 134]] : [[111, 181, 236], [207, 233, 255]];
  function zoneW(f) {
    const i = Math.max(0, Math.min(N - 1, Math.floor(f))), j = Math.min(N - 1, i + 1), t = f - i;
    const w = { micro: 0, land: 0, space: 0 };
    w[O[i].zone] += 1 - t; w[O[j].zone] += t;
    return w;
  }
  const rgb = (c) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
  function bg(wz) {
    const L = landC();
    const mixc = (k) => [0, 1, 2].map((ch) => ZC.micro[k][ch] * wz.micro + L[k][ch] * wz.land + ZC.space[k][ch] * wz.space);
    return [rgb(mixc(0)), rgb(mixc(1))];
  }

  function niceNum(m) { const e = Math.pow(10, Math.floor(Math.log10(m))); const f = m / e; return (f >= 5 ? 5 : f >= 2 ? 2 : 1) * e; }
  const LY = 9.4607e15, AU = 1.496e11;
  function words(n, d = 1) {
    for (const [v, w] of [[1e12, 'trillion'], [1e9, 'billion'], [1e6, 'million']]) if (n >= v) return `${Curio.fmt(n / v, n / v < 10 ? d : 0)} ${w}`;
    return Curio.fmt(n, n < 10 ? d : 0);
  }
  function fmtSize(s) {
    if (s < 1e-6) return `${Curio.fmt(s * 1e9, s * 1e9 < 10 ? 2 : 0)} nanometres`;
    if (s < 1e-3) return `${Curio.fmt(s * 1e6, s * 1e6 < 10 ? 1 : 0)} micrometres`;
    if (s < 0.01) return `${Curio.fmt(s * 1000, 1)} mm`;
    if (s < 1) return `${Curio.fmt(s * 100, s * 100 < 10 ? 1 : 0)} cm`;
    if (s < 1000) return `${Curio.fmt(s, s < 10 ? 1 : 0)} m`;
    if (s < 1e11) return `${words(s / 1000)} km`;
    if (s < 1e15) return `${words(s / 1000)} km (${Curio.fmt(s / AU, s / AU < 10 ? 1 : 0)} AU)`;
    return `${words(s / LY)} light-years`;
  }
  function fmtShort(s) {
    if (s < 1e-6) return `${+(s * 1e9).toPrecision(2)} nm`;
    if (s < 1e-3) return `${+(s * 1e6).toPrecision(2)} µm`;
    if (s < 1) return `${+(s * 1000).toPrecision(3)} mm`;
    if (s < 1000) return `${Curio.fmt(s, s < 10 ? 1 : 0)} m`;
    if (s < 1e11) return `${words(s / 1000)} km`;
    if (s < 1e15) return `${Curio.fmt(s / AU, s / AU < 10 ? 1 : 0)} AU`;
    return `${words(s / LY)} ly`;
  }
  const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  const sci = (r) => { const e = Math.floor(Math.log10(r)); const m = r / Math.pow(10, e); return `${m.toFixed(1)} × 10${String(e).split('').map((d) => SUP[+d]).join('')}`; };
  const ratioTxt = (r) => r >= 1e15 ? sci(r) : r >= 1e6 ? words(r, 1) : r >= 100 ? Curio.fmt(r, 0) : Curio.fmt(r, r < 10 ? 1 : 0);
  const the = (n) => n.replace(/^The /, 'the ');
  function groupOf(o) {
    if (o.zone === 'micro') return 'Too small to see';
    if (o.zone === 'land') return 'On Earth';
    if (o.s < 1.4e8) return 'The solar system';
    if (o.s < 3e16) return 'Stars and black holes';
    return 'Deep space';
  }

  let f = Math.max(0, Math.min(N - 1, Math.round(S.f))), target = f, dirty = true, touring = false, mode = 'explore';
  const env = { W: 0, H: 0, t: 0, dpr: 1, font };

  function drawBackdrop(cam, wz, t) {
    const [c1, c2] = bg(wz);
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, c1); gr.addColorStop(1, c2);
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    if (wz.space > 0) {
      for (const s of stars) { g.globalAlpha = wz.space * s.a * (0.75 + 0.25 * Math.sin(t * 1.2 + s.p)); g.fillStyle = '#fff'; g.fillRect(((s.x * W - f * 22) % W + W) % W, s.y * H, s.r, s.r); }
      g.globalAlpha = 1;
    }
    if (wz.micro > 0) {
      g.globalAlpha = wz.micro;
      for (const m of motes) { const x = ((m.x * W + Math.sin(t * 0.3 + m.p) * 20 - f * 40) % W + W) % W, y = m.y * H + Math.cos(t * 0.25 + m.p) * 14; g.fillStyle = `rgba(160,255,230,${m.a})`; g.beginPath(); g.arc(x, y, m.r, 0, 6.283); g.fill(); }
      const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,10,12,.55)');
      g.fillStyle = vg; g.fillRect(0, 0, W, H);
      g.globalAlpha = 1;
    }
    const groundY = cam.midY + cam.cy * cam.k;
    if (wz.land > 0 && groundY < H) {
      g.globalAlpha = wz.land;
      const dark = Curio.isDark();
      const gg = g.createLinearGradient(0, groundY, 0, H);
      gg.addColorStop(0, dark ? '#2a4a31' : '#7cc563'); gg.addColorStop(0.08, dark ? '#1f3a26' : '#5fae4e'); gg.addColorStop(1, dark ? '#122016' : '#3f8a3a');
      g.fillStyle = gg; g.fillRect(0, groundY, W, H - groundY);
      g.globalAlpha = 1;
    }
    if (wz.micro > 0 && groundY < H) {
      g.globalAlpha = wz.micro;
      g.fillStyle = 'rgba(180,240,255,.12)'; g.fillRect(0, groundY, W, H - groundY);
      g.fillStyle = 'rgba(200,250,255,.5)'; g.fillRect(0, groundY, W, 1.5);
      g.globalAlpha = 1;
    }
  }

  function drawScale(k, col) {
    const px = niceNum(140 / k);
    const bw = px * k;
    const sy = 22, sx = 16;
    g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 2;
    g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + bw, sy); g.moveTo(sx, sy - 5); g.lineTo(sx, sy + 5); g.moveTo(sx + bw, sy - 5); g.lineTo(sx + bw, sy + 5); g.stroke();
    g.textAlign = 'left'; g.font = `700 11px ${font}`;
    g.fillText(fmtShort(px), sx, sy + 18);
  }

  function drawExplore(t) {
    const cam = camera(f);
    const wz = zoneW(f);
    drawBackdrop(cam, wz, t);
    const labelCol = wz.space + wz.micro > 0.5 ? 'rgba(255,255,255,.75)' : (Curio.isDark() ? 'rgba(255,255,255,.8)' : 'rgba(20,30,50,.75)');
    const fi = Math.round(f);
    g.font = `700 12px ${font}`;
    g.textAlign = 'center';
    const lo = Math.max(0, Math.floor(f) - 14), hi = Math.min(N - 1, Math.floor(f) + 3);
    const labels = [];
    for (let i = lo; i <= hi; i++) {
      const o = O[i];
      const L = o.s * cam.k;
      const X = W / 2 + (o.x - cam.cx) * cam.k;
      const Y = cam.midY - (o.cy - cam.cy) * cam.k;
      const halfW = L * o.w / 2 * (o.tail ? 4.5 : o.kind === 'neutron' ? 6 : o.kind === 'blackhole' ? 2.6 : 1.2);
      if (X + halfW < -5 || X - halfW > W + 5) continue;
      if (L < 0.25) { if (L * 4 > 0.25) { g.fillStyle = labelCol; g.fillRect(X, Y, 1, 1); } continue; }
      if (L > W * 400 && o.kind !== 'globe') continue;
      A.draw(g, o, i, X, Y, L, env);
      if (i !== fi && L > 16 && L < W * 0.8) {
        const tw = g.measureText(o.name).width / 2 + 6;
        const ly = Math.min(H - PH - 8, Y + L * o.h / 2 + 16);
        if (!labels.some(([a, b, y]) => Math.abs(y - ly) < 14 && X + tw > a && X - tw < b)) {
          labels.push([X - tw, X + tw, ly]);
          g.fillStyle = labelCol;
          g.fillText(o.name, X, ly);
        }
      }
    }
    drawScale(cam.k, labelCol);
    const nb = Math.min(N - 1, Math.round(f) + 2);
    const ccam = camera(Math.min(N - 1, f + 2));
    A.warm(O[nb], nb, O[nb].s * ccam.k * dpr);
  }

  let cmp = { a: 0, b: 1, reveal: 1 };
  const ROUND = new Set(['globe', 'rock', 'neutron', 'blackhole', 'virus', 'atom', 'rbc']);
  function drawPair(t, ia, ib, reveal) {
    const a = O[ia], b = O[ib];
    const big = a.s >= b.s ? a : b, small = big === a ? b : a;
    const wz = { micro: 0, land: 0, space: 0 }; wz[big.zone] = 1;
    const avail = H - PH - 70;
    const kBig = Math.min(W * 0.46 / (big.w * big.s), avail * 0.72 / (big.h * big.s));
    const Lb = big.s * kBig;
    const LsTrue = small.s * kBig;
    const LsEq = Math.min(W * 0.3 / small.w, avail * 0.72 / small.h);
    const Ls = Math.exp(lerp(Math.log(LsEq), Math.log(Math.max(1e-9, LsTrue)), reveal));
    const base = 60 + avail * 0.5;
    const camLike = { midY: base, cy: 0, k: 1 };
    drawBackdrop(camLike, wz, t);
    const total = Lb * big.w + Ls * small.w + Math.max(30, W * 0.06);
    let x0 = W / 2 - total / 2;
    const xb = x0 + Lb * big.w / 2;
    const xs = x0 + Lb * big.w + Math.max(30, W * 0.06) + Ls * small.w / 2;
    const order = [[big, xb, Lb, O.indexOf(big)], [small, xs, Ls, O.indexOf(small)]];
    const labelCol = big.zone === 'land' && !Curio.isDark() ? 'rgba(20,30,50,.8)' : 'rgba(255,255,255,.85)';
    g.font = `800 13px ${font}`; g.textAlign = 'center';
    for (const [o, X, L, i] of order) {
      const Y = o.land || big.land ? base + Lb * big.h / 2 - L * o.h / 2 : base;
      if (L >= 0.3) A.draw(g, o, i, X, Y, L, env);
      g.fillStyle = labelCol;
      g.fillText(o.name, X, Math.min(H - PH - 10, Math.max(Y + L * o.h / 2, base + Lb * big.h / 2) + 20));
      if (o === small && reveal > 0.95 && L < 6) {
        g.strokeStyle = '#ff5a36'; g.lineWidth = 2; g.beginPath(); g.arc(X, Y, 14, 0, 6.283); g.stroke();
        g.beginPath(); g.moveTo(X + 10, Y - 10); g.lineTo(X + 40, Y - 50); g.stroke();
        const lx = Math.min(W - 80, X + 100), ly = Math.max(70, Y - 110), lr = 62;
        g.save(); g.beginPath(); g.arc(lx, ly, lr, 0, 6.283); g.clip();
        const [c1] = bg(wz); g.fillStyle = c1; g.fillRect(lx - lr, ly - lr, lr * 2, lr * 2);
        const Lz = Math.min(lr * 1.4 / o.w, lr * 1.4 / o.h);
        A.draw(g, o, i, lx, ly, Lz, env);
        g.restore();
        g.strokeStyle = '#ff5a36'; g.lineWidth = 3; g.beginPath(); g.arc(lx, ly, lr, 0, 6.283); g.stroke();
        g.fillStyle = '#fff'; g.font = `800 11px ${font}`; g.fillText(`zoomed ${ratioTxt(Lz / Math.max(L, 1e-12))}×`, lx, ly + lr + 16);
      }
    }
    drawScale(kBig, labelCol);
  }

  function draw(now) {
    const t = now / 1000;
    env.W = W; env.H = H; env.t = t; env.dpr = dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    PH = panelH();
    if (mode === 'explore') drawExplore(t);
    else if (mode === 'compare') drawPair(t, cmp.a, cmp.b, 1);
    else if (quiz.pair) drawPair(t, quiz.pair[0], quiz.pair[1], quiz.reveal);
    else drawPair(t, START, START + 1, 1);
  }

  let shown = -1, reachedEnd = false;
  function info() {
    const i = Math.max(0, Math.min(N - 1, Math.round(f)));
    if (i === shown) return;
    const up = i > shown;
    shown = i;
    const o = O[i];
    $('name').textContent = o.name;
    $('name').classList.remove('bump'); void $('name').offsetWidth; $('name').classList.add('bump');
    $('size').textContent = fmtSize(o.s);
    $('fact').textContent = o.fact;
    $('tag').textContent = groupOf(o);
    $('count').textContent = `${i + 1}/${N}`;
    const vsYou = o.s >= 1.7 ? `${ratioTxt(o.s / 1.7)}× bigger than you` : `${ratioTxt(1.7 / o.s)}× smaller than you`;
    $('rel').textContent = i > 0 ? `${ratioTxt(o.s / O[i - 1].s)}× bigger than ${the(O[i - 1].name)} · ${vsYou}` : vsYou;
    if (i === START) $('rel').textContent = 'Where it all starts';
    $('intro').classList.toggle('faded', i !== START);
    Curio.beep(220 * Math.pow(2, (i - START) / 14), 0.07, 'sine', up ? 0.05 : 0.035);
    S.f = i;
    if (!S.seen.includes(o.name)) { S.seen.push(o.name); if (S.seen.length >= 50) award('curious'); if (S.seen.length >= N) award('all'); }
    save();
    if (i === 0) award('tiny');
    if (i === N - 1 && !reachedEnd) {
      reachedEnd = true;
      setTimeout(() => { Curio.confetti(); Curio.toast('That is everything we can see. You are very, very small.', 3200); }, 400);
      Curio.best('reached', 1);
      award('everything');
    }
    paintIndexCurrent();
  }

  let last = performance.now(), raf = 0, lastDraw = 0;
  function loop(now) {
    raf = 0;
    if (document.hidden) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (touring) {
      target = Math.min(N - 1, target + dt * 0.42);
      if (target >= N - 1) { setTour(false); award('tour'); }
    }
    const diff = target - f;
    const moving = Math.abs(diff) > 0.0005;
    if (moving) {
      f += diff * (1 - Math.exp(-dt * (touring ? 12 : 7)));
      if (Math.abs(target - f) < 0.0005) f = target;
      if (document.activeElement !== slider) slider.value = f.toFixed(3);
    }
    if (quiz.revealing) { quiz.reveal = Math.min(1, quiz.reveal + dt * 0.9); if (quiz.reveal >= 1) quiz.revealing = false; }
    if (moving || dirty || touring || quiz.revealing || now - lastDraw > 40) {
      dirty = false; lastDraw = now;
      draw(now);
      if (mode === 'explore') info();
    }
    raf = requestAnimationFrame(loop);
  }
  function kick() { if (!raf && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(loop); } }
  function go(tg, snap) { target = Math.max(0, Math.min(N - 1, tg)); if (snap) target = Math.round(target); kick(); }
  let snapT = 0;
  const snapSoon = () => { clearTimeout(snapT); snapT = setTimeout(() => go(Math.round(target)), 450); };

  const tourBtn = $('tour');
  function setTour(on) {
    touring = on;
    tourBtn.textContent = on ? 'Pause' : 'Tour';
    if (on && target >= N - 1) { f = START; target = START; shown = -1; }
    if (!on) go(Math.round(target));
    kick();
  }
  tourBtn.addEventListener('click', () => setTour(!touring));
  $('prev').addEventListener('click', () => { setTour(false); go(Math.round(target) - 1); });
  $('next').addEventListener('click', () => { setTour(false); go(Math.round(target) + 1); });
  slider.addEventListener('input', () => { if (touring) setTour(false); go(+slider.value); snapSoon(); });
  addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, select') && e.target !== slider) return;
    const k = e.key;
    if (k === 'i' || k === 'I') { toggleDrawer(); return; }
    if (k === 'Escape') { toggleDrawer(false); return; }
    if (k === 'c' || k === 'C') { setMode(mode === 'compare' ? 'explore' : 'compare'); return; }
    if (mode !== 'explore') return;
    let d = 0;
    if (k === 'ArrowRight' || k === 'ArrowUp' || k === 'PageDown' || k === '+' || k === '=') d = 1;
    else if (k === 'ArrowLeft' || k === 'ArrowDown' || k === 'PageUp' || k === '-') d = -1;
    else if (k === 'Home') { e.preventDefault(); setTour(false); go(0); return; }
    else if (k === 'End') { e.preventDefault(); setTour(false); go(N - 1); return; }
    else if (k === ' ' && e.target === document.body) { e.preventDefault(); setTour(!touring); return; }
    if (d) { e.preventDefault(); setTour(false); go(Math.round(target) + d); }
  });
  cv.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (mode !== 'explore') return;
    if (touring) setTour(false);
    const k = e.deltaMode === 1 ? 30 : 1;
    const dx = e.deltaX * k, dy = e.deltaY * k;
    const d = e.ctrlKey ? dy * 0.012 : (Math.abs(dx) > Math.abs(dy) ? dx : dy) * 0.0025;
    go(target + d);
    snapSoon();
  }, { passive: false });
  const touches = new Map();
  let pinchD = 0, dragX = 0, moved = false, pinching = false;
  cv.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch') return;
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touches.size === 2) { const [p1, p2] = [...touches.values()]; pinchD = Math.hypot(p1.x - p2.x, p1.y - p2.y); pinching = true; }
  });
  cv.addEventListener('pointermove', (e) => {
    if (!touches.has(e.pointerId)) return;
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touches.size === 2) {
      const [p1, p2] = [...touches.values()];
      const d = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      if (pinchD > 0 && d > 0) go(target - Math.log(d / pinchD) * 1.6);
      pinchD = d;
    }
  });
  const tEnd = (e) => { touches.delete(e.pointerId); if (touches.size < 2) pinchD = 0; if (!touches.size && pinching) { pinching = false; go(Math.round(target)); } };
  cv.addEventListener('pointerup', tEnd);
  cv.addEventListener('pointercancel', tEnd);
  Curio.drag(cv, {
    start(p) { if (mode !== 'explore') return; if (touring) setTour(false); dragX = p.clientX; moved = false; },
    move(p) {
      if (mode !== 'explore' || pinching) return;
      const dx = p.clientX - dragX; dragX = p.clientX;
      if (dx) { go(target - dx / Math.max(160, W * 0.3)); moved = true; }
    },
    end() { if (moved) go(Math.round(target)); }
  });
  if (!Curio.store.get('sos:tip', false)) {
    setTimeout(() => { Curio.toast('Tip: two-finger scroll to zoom, or turn on Touchpad mode in the top bar', 4200); Curio.store.set('sos:tip', true); }, 1800);
  }

  function setMode(m) {
    if (m === mode) return;
    mode = m;
    setTour(false);
    document.querySelectorAll('.modes [data-m]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.m === m)));
    $('panelExplore').hidden = m !== 'explore';
    $('panelCompare').hidden = m !== 'compare';
    $('panelQuiz').hidden = m !== 'quiz';
    $('intro').classList.toggle('faded', m !== 'explore' || Math.round(f) !== START);
    if (m === 'compare') { if (cmp.a === cmp.b) cmp.b = cmp.a + 1; paintCompare(); award('compare'); }
    if (m === 'quiz') quizIntro();
    shown = -1;
    dirty = true; kick();
    Curio.beep(500, 0.06, 'triangle', 0.08);
  }
  document.querySelectorAll('.modes [data-m]').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.m)));

  const selA = $('cmpA'), selB = $('cmpB');
  const opts = O.map((o, i) => `<option value="${i}">${o.name}</option>`).join('');
  selA.innerHTML = opts; selB.innerHTML = opts;
  cmp.a = Math.max(0, Math.round(f) - 1); cmp.b = Math.round(f);
  function cmpText() {
    const a = O[cmp.a], b = O[cmp.b];
    const big = a.s >= b.s ? a : b, small = big === a ? b : a;
    const r = big.s / small.s;
    let t = `<b>${big.name}</b> (${fmtShort(big.s)}) is <b>${ratioTxt(r)}×</b> ${big.kind === 'gap' || big.kind === 'orbit' ? 'longer' : 'bigger'} than <b>${the(small.name)}</b> (${fmtShort(small.s)}).`;
    if (r === 1) t = 'Pick two different things.';
    else if (ROUND.has(a.kind) && ROUND.has(b.kind) && r > 1) {
      const v = r * r * r;
      t += ` About <b>${v >= 1e6 ? words(v, 1) : Curio.fmt(v, 0)}</b> of ${the(small.name)} would fit inside.`;
    } else if (r < 1e6 && r > 1) t += ` You could line up ${Curio.fmt(Math.floor(r), 0)} of them end to end.`;
    return t;
  }
  function paintCompare() {
    selA.value = cmp.a; selB.value = cmp.b;
    $('cmpTxt').innerHTML = cmpText();
    dirty = true; kick();
  }
  selA.addEventListener('change', () => { cmp.a = +selA.value; paintCompare(); Curio.beep(600, 0.05, 'sine', 0.06); });
  selB.addEventListener('change', () => { cmp.b = +selB.value; paintCompare(); Curio.beep(700, 0.05, 'sine', 0.06); });
  $('swap').addEventListener('click', () => { [cmp.a, cmp.b] = [cmp.b, cmp.a]; paintCompare(); });
  $('cmpRand').addEventListener('click', () => { cmp.a = Curio.randInt(0, N - 1); do cmp.b = Curio.randInt(0, N - 1); while (cmp.b === cmp.a); paintCompare(); Curio.beep(440, 0.08, 'triangle', 0.08); });
  $('cmpCopy').addEventListener('click', async () => { try { await navigator.clipboard.writeText($('cmpTxt').textContent + ' (Curio: Size of Space)'); Curio.toast('Copied'); } catch { Curio.toast('Could not copy, sorry'); } });

  const quiz = { round: 0, score: 0, pair: null, reveal: 1, revealing: false, locked: false, daily: false, rng: Math.random };
  function seeded(seed) { let s = seed % 2147483647 || 1; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function quizIntro() {
    quiz.pair = null;
    const best = Curio.getBest('quiz');
    const today = new Date().toISOString().slice(0, 10);
    const daily = Curio.store.get('sos:daily', null);
    $('qRound').textContent = 'Size quiz'; $('qScore').textContent = best != null ? `Best ${best}/10` : '';
    $('qBody').innerHTML = `<div class="q-end"><p>Ten pairs. Guess how many times bigger one is than the other. The true scale is revealed after each guess.</p><div class="q-pick"><button class="c-btn" type="button" id="qGo">Random quiz</button><button class="c-btn c-btn--ghost" type="button" id="qDaily">${daily && daily.d === today ? `Today's quiz: ${daily.s}/10` : "Today's quiz"}</button></div></div>`;
    $('qGo').addEventListener('click', () => quizStart(false));
    $('qDaily').addEventListener('click', () => quizStart(true));
    dirty = true;
  }
  function quizStart(daily) {
    const d = new Date();
    Object.assign(quiz, { round: 0, score: 0, daily, rng: daily ? seeded(d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()) : Math.random });
    quizNext();
  }
  function quizNext() {
    if (quiz.round >= 10) return quizEnd();
    quiz.round++;
    let a, b;
    do { a = Math.floor(quiz.rng() * N); b = a + 2 + Math.floor(quiz.rng() * 22); } while (b >= N || O[b].s / O[a].s < 3);
    quiz.pair = [a, b]; quiz.reveal = 0; quiz.revealing = false; quiz.locked = false;
    const r = O[b].s / O[a].s;
    const pool = [-2, -1, 1, 2].map((k) => r * Math.pow(10, k)).filter((x) => x >= 1.5);
    const choices = Curio.shuffle([r, ...Curio.shuffle(pool).slice(0, 3)]);
    $('qRound').textContent = `${quiz.daily ? 'Daily · ' : ''}Round ${quiz.round} of 10`;
    $('qScore').textContent = `Score ${quiz.score}`;
    $('qBody').innerHTML = `<p class="q-ask">How many times bigger is ${the(O[b].name)} than ${the(O[a].name)}?</p><div class="q-opts">${choices.map((c) => `<button type="button" data-v="${c}">about ${nice(c)}×</button>`).join('')}</div>`;
    $('qBody').querySelectorAll('button').forEach((btn) => btn.addEventListener('click', () => quizAnswer(btn, +btn.dataset.v === r)));
    dirty = true; kick();
  }
  function nice(x) { const p = Math.pow(10, Math.floor(Math.log10(x)) - 1); const v = Math.round(x / p) * p; return v >= 1e6 ? words(v, 1) : Curio.fmt(v, v < 10 ? 1 : 0); }
  function quizAnswer(btn, right) {
    if (quiz.locked) return;
    quiz.locked = true;
    btn.classList.add(right ? 'right' : 'wrong');
    if (!right) { const r = O[quiz.pair[1]].s / O[quiz.pair[0]].s; $('qBody').querySelectorAll('button').forEach((b) => { if (+b.dataset.v === r) b.classList.add('right'); }); Curio.beep(170, 0.2, 'sawtooth', 0.05); try { navigator.vibrate?.(35); } catch {} }
    else { quiz.score++; Curio.beep(660, 0.08, 'triangle', 0.1); setTimeout(() => Curio.beep(990, 0.12, 'triangle', 0.1), 80); }
    $('qScore').textContent = `Score ${quiz.score}`;
    quiz.revealing = true; kick();
    setTimeout(quizNext, 1900);
  }
  function quizEnd() {
    const res = Curio.best('quiz', quiz.score);
    if (quiz.daily) Curio.store.set('sos:daily', { d: new Date().toISOString().slice(0, 10), s: quiz.score });
    if (quiz.score === 10) { award('quiz'); Curio.confetti(); }
    const share = `I scored ${quiz.score}/10 on the ${quiz.daily ? 'daily ' : ''}Curio Size of Space quiz.`;
    $('qRound').textContent = 'Finished'; $('qScore').textContent = '';
    $('qBody').innerHTML = `<div class="q-end"><b>${quiz.score}/10</b><p>${quiz.score >= 9 ? 'Cosmic intuition.' : quiz.score >= 6 ? 'Pretty good sense of scale.' : 'Space is hard to picture. Everyone struggles.'} Best: ${res.best}/10${res.isNew ? ', a new record!' : ''}</p><div class="q-pick"><button class="c-btn" type="button" id="qAgain">Play again</button><button class="c-btn c-btn--ghost" type="button" id="qShare">Copy score</button></div></div>`;
    $('qAgain').addEventListener('click', () => quizStart(false));
    $('qShare').addEventListener('click', async () => { try { await navigator.clipboard.writeText(share); Curio.toast('Copied'); } catch {} });
    [523, 659, 784].forEach((x, i) => setTimeout(() => Curio.beep(x, 0.15, 'triangle', 0.08), i * 100));
  }

  const drawer = $('drawer');
  function toggleDrawer(on) {
    const show = on == null ? drawer.hidden : on;
    drawer.hidden = !show;
    if (show) { paintIndex(); $('idxSearch').focus({ preventScroll: true }); }
  }
  $('idxBtn').addEventListener('click', () => toggleDrawer());
  $('idxClose').addEventListener('click', () => toggleDrawer(false));
  $('idxSearch').addEventListener('input', paintIndex);
  function paintIndex() {
    const q = $('idxSearch').value.trim().toLowerCase();
    let html = '', grp = '';
    O.forEach((o, i) => {
      if (q && !o.name.toLowerCase().includes(q)) return;
      const gname = groupOf(o);
      if (gname !== grp) { if (grp) html += '</ul>'; html += `<h3>${gname}</h3><ul>`; grp = gname; }
      html += `<li><button type="button" data-i="${i}"><i class="${S.seen.includes(o.name) ? 'seen' : ''}"></i><span>${o.name}</span><small>${fmtShort(o.s)}</small></button></li>`;
    });
    $('idxList').innerHTML = html + (grp ? '</ul>' : '<p class="c-muted">No match.</p>');
    $('idxList').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      const i = +b.dataset.i;
      if (mode === 'compare') { cmp.b = i; paintCompare(); }
      else { setMode('explore'); go(i, true); }
      if (innerWidth < 700) toggleDrawer(false);
    }));
    $('seenTxt').textContent = `You have visited ${S.seen.length} of ${N}.`;
    paintIndexCurrent();
    paintBadges();
  }
  function paintIndexCurrent() {
    if (drawer.hidden) return;
    const i = Math.round(f);
    $('idxList').querySelectorAll('button').forEach((b) => b.setAttribute('aria-current', String(+b.dataset.i === i)));
  }

  const BADGES = [
    ['tiny', 'Atom smasher', 'Shrink down to the atom', '#5ad8ff', 'M20 17a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM8 20c0-3 5-6 12-6s12 3 12 6-5 6-12 6-12-3-12-6z'],
    ['everything', 'Everything', 'Reach the edge of the universe', '#6c5ce7', 'M20 6l3.8 8 8.7 1.2-6.3 6 1.6 8.6L20 25.6l-7.8 4.2 1.6-8.6-6.3-6 8.7-1.2z'],
    ['tour', 'Tour guide', 'Finish the full tour', '#ff5a36', 'M12 10l18 10-18 10z'],
    ['compare', 'Side by side', 'Use compare mode', '#2ecc71', 'M8 26h10V14H8zM22 26h10V8H22z'],
    ['quiz', 'Sense of scale', 'Score 10/10 in the quiz', '#ffb020', 'M12 10h16v6a8 8 0 0 1-16 0zM17 26h6v4h-6z'],
    ['curious', 'Curious', 'Visit 50 things', '#e84393', 'M17 10a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM22 22l8 8'],
    ['all', 'Completionist', 'Visit all 101', '#1f9d55', 'M10 20l6 6 14-14']
  ];
  function paintBadges() {
    $('badges').innerHTML = BADGES.map(([id, n, how, col, d]) => {
      const got = S.badges.includes(id);
      const stroke = /l6 6|l8 8|M8 20c/.test(d);
      return `<div class="badge${got ? '' : ' locked'}" title="${how}"><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="19" fill="${col}"/><path d="${d}" fill="${stroke ? 'none' : '#fff'}" stroke="#fff" stroke-width="${stroke ? 2.6 : 0.6}" stroke-linecap="round" stroke-linejoin="round"/></svg>${n}</div>`;
    }).join('');
  }
  function award(id) {
    if (S.badges.includes(id)) return;
    S.badges.push(id); save();
    const b = BADGES.find((x) => x[0] === id);
    setTimeout(() => Curio.toast(`Badge unlocked: ${b[1]}`), 500);
    if (!drawer.hidden) paintBadges();
  }

  document.addEventListener('visibilitychange', () => { if (document.hidden && touring) setTour(false); kick(); });
  addEventListener('curio:theme', () => { dirty = true; kick(); });
  new ResizeObserver(() => { resize(); kick(); }).observe(stage);
  resize();
  slider.value = f;
  $('intro').classList.toggle('faded', Math.round(f) !== START);
  dirty = true; kick();
})();
