(() => {
  const cv = document.getElementById('cv');
  const ctx = cv.getContext('2d');
  const $ = (id) => document.getElementById(id);
  const intro = $('intro');
  const paper = document.createElement('canvas'), pctx = paper.getContext('2d');
  const COLORS = ['#ff5a36', '#ff2e7e', '#b14aed', '#3a6ff7', '#0fb5ae', '#2fb344', '#f5b700', '#ff8c1a', '#7c4dff', '#00a3e0', '#e84a5f', 'rainbow'];
  const WORLD = 150;
  const cfg = { mode: 'in', R: 105, r: 63, p: 0.8, color: '#ff5a36', w: 1.4, speed: 2, pen: Curio.store.get('spiro:pen', 'ink') };
  let paperKind = Curio.store.get('spiro:paper', 'cream'), preview = false;
  if (!['cream', 'velvet', 'blueprint', 'kraft'].includes(paperKind)) paperKind = 'cream';
  if (!['ink', 'glow', 'pencil'].includes(cfg.pen)) cfg.pen = 'ink';
  const PRESETS = [
    { name: 'Daisy', layers: [{ mode: 'in', R: 105, r: 63, p: 0.8, color: '#ff5a36' }] },
    { name: 'Rose', layers: [{ mode: 'in', R: 96, r: 36, p: 0.9, color: '#ff2e7e' }, { mode: 'in', R: 96, r: 60, p: 0.55, color: '#2fb344' }] },
    { name: 'Star', layers: [{ mode: 'in', R: 100, r: 40, p: 1.0, color: '#f5b700' }] },
    { name: 'Mandala', layers: [{ mode: 'in', R: 144, r: 54, p: 0.7, color: '#b14aed' }, { mode: 'in', R: 144, r: 64, p: 0.9, color: '#3a6ff7' }, { mode: 'in', R: 144, r: 90, p: 0.5, color: '#0fb5ae' }] },
    { name: 'Lace', layers: [{ mode: 'in', R: 150, r: 84, p: 0.95, color: '#00a3e0', w: 0.8 }] },
    { name: 'Sunflower', layers: [{ mode: 'out', R: 60, r: 18, p: 0.8, color: '#ff8c1a' }, { mode: 'in', R: 120, r: 45, p: 0.6, color: '#f5b700' }] },
    { name: 'Galaxy', layers: [{ mode: 'in', R: 140, r: 96, p: 1.0, color: 'rainbow', w: 0.9 }] },
    { name: 'Snowflake', layers: [{ mode: 'in', R: 96, r: 30, p: 0.9, color: '#00a3e0' }, { mode: 'in', R: 96, r: 60, p: 0.7, color: '#7c4dff' }] },
    { name: 'Atom', layers: [{ mode: 'out', R: 50, r: 30, p: 1.2, color: '#0fb5ae' }] },
    { name: 'Hypnotic', layers: [{ mode: 'in', R: 120, r: 115, p: 1.0, color: '#e84a5f', w: 0.8 }] },
    { name: 'Cardioid', layers: [{ mode: 'out', R: 60, r: 60, p: 1.0, color: '#ff2e7e', w: 2.2 }] },
    { name: 'Nephroid', layers: [{ mode: 'out', R: 60, r: 30, p: 1.0, color: '#3a6ff7', w: 2.2 }] },
    { name: 'Deltoid', layers: [{ mode: 'in', R: 90, r: 30, p: 1.0, color: '#2fb344', w: 2.2 }] },
    { name: 'Astroid', layers: [{ mode: 'in', R: 120, r: 30, p: 1.0, color: '#b14aed', w: 2.2 }] }
  ];
  const BADGES = [
    ['first', '🌸 First bloom', 'Finish a pattern'],
    ['stack', '🥞 Stacked', '6 layers in one drawing'],
    ['presets', '📚 Collector', 'Draw 8 classic designs'],
    ['glow', '✨ Neon sign', 'Draw with the glow pen'],
    ['chal1', '🎯 Gearhead', 'Solve a challenge target'],
    ['perfect', '💯 Watchmaker', 'Score 500 in a challenge'],
    ['daily', '📅 Daily gears', 'Finish a daily challenge'],
    ['cusp', '📐 Mathematician', 'Draw a cardioid, deltoid or astroid']
  ];
  let badges = Curio.store.get('spiro:badges', []);
  if (!Array.isArray(badges)) badges = [];
  const drawnPresets = new Set(Curio.store.get('spiro:presets', []));
  function award(id) {
    if (badges.includes(id)) return;
    badges.push(id);
    Curio.store.set('spiro:badges', badges);
    const b = BADGES.find((x) => x[0] === id);
    if (b) { setTimeout(() => Curio.toast(`Badge: ${b[1]}`), 500); [784, 988, 1175].forEach((f, k) => setTimeout(() => Curio.beep(f, 0.08, 'triangle', 0.07), 500 + k * 80)); }
    renderBadges();
  }
  function renderBadges() {
    const el = document.getElementById('badges');
    el.innerHTML = BADGES.map(([id, n, d]) => `<div class="badge${badges.includes(id) ? ' got' : ''}"><b>${badges.includes(id) ? n : `🔒 ${n.split(' ').slice(1).join(' ')}`}</b>${d}</div>`).join('');
  }
  let W = 0, H = 0, dpr = 1, cx = 0, cy = 0, k = 1, layers = [], playing = true, showGears = true, time = 0;

  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
  function makeLayer(c) {
    const L = { mode: c.mode, R: c.R, r: c.r, p: c.p, color: c.color, w: c.w ?? 1.4, pen: c.pen || cfg.pen, t: 0 };
    L.tMax = 2 * Math.PI * L.r / gcd(L.R, L.r);
    const ext = L.mode === 'in' ? Math.abs(L.R - L.r) + L.p * L.r : L.R + L.r + L.p * L.r;
    const gearExt = L.mode === 'in' ? L.R : L.R + 2 * L.r;
    L.fit = Math.min(1, WORLD / Math.max(ext, gearExt));
    L.step = 0.012 / Math.max(1, Math.abs(L.mode === 'in' ? L.R - L.r : L.R + L.r) / L.r);
    return L;
  }
  function pen(L, t) {
    if (L.mode === 'in') {
      const a = L.R - L.r, th = a / L.r * t, d = L.p * L.r;
      return [(a * Math.cos(t) + d * Math.cos(th)) * L.fit, (a * Math.sin(t) - d * Math.sin(th)) * L.fit];
    }
    const a = L.R + L.r, th = a / L.r * t, d = L.p * L.r;
    return [(a * Math.cos(t) - d * Math.cos(th)) * L.fit, (a * Math.sin(t) - d * Math.sin(th)) * L.fit];
  }
  const sx = (x) => cx + x * k, sy = (y) => cy + y * k;
  function strokeColor(L, t) { return L.color === 'rainbow' ? `hsl(${(t / L.tMax * 720) % 360},85%,${C.darkPaper ? 62 : 52}%)` : L.color; }

  function drawRange(L, t0, t1) {
    if (t1 <= t0) return;
    pctx.lineWidth = L.pen === 'pencil' ? Math.max(0.5, L.w * 0.75) : L.w; pctx.lineCap = 'round'; pctx.lineJoin = 'round';
    pctx.globalAlpha = L.pen === 'pencil' ? 0.55 : 1;
    pctx.shadowBlur = L.pen === 'glow' ? 9 : 0;
    pctx.globalCompositeOperation = L.pen === 'glow' && C.darkPaper ? 'lighter' : 'source-over';
    const chunk = L.color === 'rainbow' || L.pen === 'glow' ? 0.25 : 1e9;
    let t = t0;
    while (t < t1) {
      const end = Math.min(t1, t + chunk);
      pctx.strokeStyle = strokeColor(L, t);
      if (L.pen === 'glow') pctx.shadowColor = pctx.strokeStyle;
      pctx.beginPath();
      let [x, y] = pen(L, t); pctx.moveTo(sx(x), sy(y));
      for (let u = t + L.step; u < end; u += L.step) { [x, y] = pen(L, u); pctx.lineTo(sx(x), sy(y)); }
      [x, y] = pen(L, end); pctx.lineTo(sx(x), sy(y));
      pctx.stroke();
      t = end;
    }
    pctx.globalAlpha = 1; pctx.shadowBlur = 0; pctx.globalCompositeOperation = 'source-over';
  }

  function colors() {
    if (paperKind === 'velvet') return { bg: '#0c0a14', dot: 'rgba(255,255,255,.04)', ring: 'rgba(170,200,255,.10)', ringEdge: 'rgba(170,200,255,.4)', gear: 'rgba(255,200,120,.12)', gearEdge: 'rgba(255,210,150,.7)', hole: '#0c0a14', darkPaper: true };
    if (paperKind === 'blueprint') return { bg: '#1d5c94', dot: 'rgba(255,255,255,.16)', grid: true, ring: 'rgba(255,255,255,.08)', ringEdge: 'rgba(255,255,255,.55)', gear: 'rgba(255,255,255,.08)', gearEdge: 'rgba(255,255,255,.8)', hole: '#1d5c94', darkPaper: true };
    if (paperKind === 'kraft') return { bg: '#c9a273', dot: 'rgba(80,50,20,.12)', fiber: true, ring: 'rgba(90,60,30,.10)', ringEdge: 'rgba(90,60,30,.5)', gear: 'rgba(255,240,210,.25)', gearEdge: 'rgba(110,70,30,.75)', hole: '#c9a273', darkPaper: false };
    return Curio.isDark()
      ? { bg: '#16141c', dot: 'rgba(255,255,255,.05)', ring: 'rgba(170,200,255,.16)', ringEdge: 'rgba(170,200,255,.5)', gear: 'rgba(255,200,120,.18)', gearEdge: 'rgba(255,210,150,.75)', hole: '#16141c', darkPaper: true }
      : { bg: '#fffdf8', dot: 'rgba(60,40,20,.06)', ring: 'rgba(80,120,200,.10)', ringEdge: 'rgba(60,100,190,.45)', gear: 'rgba(255,150,60,.16)', gearEdge: 'rgba(210,110,30,.75)', hole: '#fffdf8', darkPaper: false };
  }
  let C = colors();

  function redrawPaper() {
    pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    pctx.clearRect(0, 0, W, H);
    for (const L of layers) drawRange(L, 0, L.t);
  }

  function layout() {
    const panelOpen = !$('panel').hidden && W >= 900;
    const availW = W - (panelOpen ? 300 : 0);
    const top = W < 560 ? 70 : 20, bottom = W < 560 ? 130 : 80;
    cx = availW / 2; cy = top + (H - top - bottom) / 2;
    k = Math.max(0.5, Math.min(availW - 24, H - top - bottom) * 0.5 / WORLD);
  }
  function resize() {
    const r = cv.getBoundingClientRect();
    dpr = Math.min(2, devicePixelRatio || 1);
    W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    paper.width = cv.width; paper.height = cv.height;
    layout(); redrawPaper();
  }

  function gearPath(radius, teeth, depth, rot, inward) {
    const n = Math.max(6, teeth), dir = inward ? -1 : 1;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a0 = rot + i / n * 6.283, a1 = rot + (i + 0.25) / n * 6.283, a2 = rot + (i + 0.5) / n * 6.283, a3 = rot + (i + 0.75) / n * 6.283;
      const ro = radius + depth * dir;
      if (i === 0) ctx.moveTo(cx0 + Math.cos(a0) * radius, cy0 + Math.sin(a0) * radius);
      ctx.lineTo(cx0 + Math.cos(a1) * radius, cy0 + Math.sin(a1) * radius);
      ctx.lineTo(cx0 + Math.cos(a1 + 0.08 / n * 6.283) * ro, cy0 + Math.sin(a1 + 0.08 / n * 6.283) * ro);
      ctx.lineTo(cx0 + Math.cos(a3 - 0.08 / n * 6.283) * ro, cy0 + Math.sin(a3 - 0.08 / n * 6.283) * ro);
      ctx.lineTo(cx0 + Math.cos(a3) * radius, cy0 + Math.sin(a3) * radius);
      ctx.lineTo(cx0 + Math.cos(a0 + 6.283 / n) * radius, cy0 + Math.sin(a0 + 6.283 / n) * radius);
    }
    ctx.closePath();
  }
  let cx0 = 0, cy0 = 0;

  function drawGears(L) {
    const f = L.fit * k, Rp = L.R * f, rp = L.r * f, tooth = Math.max(2.5, Math.min(6, 6.283 * rp / L.r * 0.45));
    const t = L.t;
    cx0 = cx; cy0 = cy;
    ctx.lineWidth = 1.5;
    if (L.mode === 'in') {
      ctx.beginPath(); ctx.arc(cx, cy, Rp + 16, 0, 6.283); ctx.arc(cx, cy, Rp, 0, 6.283, true);
      ctx.fillStyle = C.ring; ctx.fill('evenodd');
      gearPath(Rp, L.R, tooth, 0, true); ctx.strokeStyle = C.ringEdge; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, Rp + 16, 0, 6.283); ctx.stroke();
    } else {
      gearPath(Rp, L.R, tooth, 0, false); ctx.fillStyle = C.ring; ctx.fill(); ctx.strokeStyle = C.ringEdge; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, Rp * 0.12, 0, 6.283); ctx.stroke();
    }
    const a = L.mode === 'in' ? L.R - L.r : L.R + L.r;
    const gx = cx + a * Math.cos(t) * f, gy = cy + a * Math.sin(t) * f;
    const th = a / L.r * t;
    const spin = L.mode === 'in' ? -th : th;
    cx0 = gx; cy0 = gy;
    gearPath(rp - (L.mode === 'in' ? tooth : 0), L.r, tooth, spin, false);
    ctx.fillStyle = C.gear; ctx.fill(); ctx.strokeStyle = C.gearEdge; ctx.stroke();
    const [px, py] = pen(L, t);
    const pxs = sx(px), pys = sy(py);
    ctx.strokeStyle = C.gearEdge; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(pxs, pys); ctx.stroke();
    const arm = Math.atan2(pys - gy, pxs - gx);
    ctx.strokeStyle = C.gearEdge; ctx.globalAlpha = 0.5;
    for (let h = 1; h <= 7; h++) {
      const q = (rp - tooth) * (0.14 + h * 0.105), ang = arm + h * 0.85;
      ctx.beginPath(); ctx.arc(gx + Math.cos(ang) * q, gy + Math.sin(ang) * q, Math.max(1.5, rp * 0.035), 0, 6.283); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.arc(gx, gy, 3, 0, 6.283); ctx.fill();
    ctx.fillStyle = strokeColor(L, t);
    ctx.beginPath(); ctx.arc(pxs, pys, Math.max(3.5, L.w + 2), 0, 6.283); ctx.fill();
    ctx.strokeStyle = C.hole; ctx.lineWidth = 1.5; ctx.stroke();
  }

  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = C.dot;
    if (C.grid) { for (let y = 0; y < H; y += 24) ctx.fillRect(0, y, W, 1); for (let x = 0; x < W; x += 24) ctx.fillRect(x, 0, 1, H); }
    else for (let y = 12; y < H; y += 24) for (let x = 12; x < W; x += 24) ctx.fillRect(x, y, 1.5, 1.5);
    if (C.fiber) { ctx.strokeStyle = 'rgba(90,60,30,.08)'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 0; i < 90; i++) { const fx = (i * 137.5) % W, fy = (i * 89.3) % H; ctx.moveTo(fx, fy); ctx.lineTo(fx + 14, fy + (i % 5) - 2); } ctx.stroke(); }
    if (chal.on && chal.target) drawCurve(chal.target, '#e0a400', 2.2, [3, 5]);
    if ((preview || chal.on) && !(chal.on && chal.solved)) drawCurve(cfg, C.darkPaper ? 'rgba(255,255,255,.45)' : 'rgba(40,30,60,.35)', 1, chal.on ? [] : [2, 4]);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(paper, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const active = layers.find((L) => L.t < L.tMax) || layers[layers.length - 1];
    if (active && showGears) drawGears(active);
  }

  function advance(dt) {
    const L = layers.find((q) => q.t < q.tMax);
    if (!L) return;
    const t0 = L.t;
    L.t = Math.min(L.tMax, L.t + dt * cfg.speed * 2.6 * Math.sqrt(Math.max(1, L.tMax / (2 * Math.PI * 6))));
    drawRange(L, t0, L.t);
    if (L.t >= L.tMax) {
      const n = gcd(L.R, L.r);
      award('first');
      if (L.pen === 'glow') award('glow');
      if (layers.length >= 6) award('stack');
      if (L.p === 1 && ((L.mode === 'out' && L.R === L.r) || (L.mode === 'in' && (L.R === 3 * L.r || L.R === 4 * L.r)))) award('cusp');
      if (gestured) { Curio.beep(660, 0.08, 'sine', 0.06); setTimeout(() => Curio.beep(990, 0.12, 'sine', 0.05), 90); }
      const next = layers.find((q) => q.t < q.tMax);
      if (next) { Object.assign(cfg, { mode: next.mode, R: next.R, r: next.r, p: next.p, color: next.color, w: next.w }); syncControls(); }
      else Curio.toast(`Done: ${L.R / n} petals, ${L.r / n} trips round the ring ✨`, 2200);
      paintInfo();
    }
  }

  function paintInfo() {
    const n = gcd(cfg.R, cfg.r);
    const same = cfg.mode === 'in' && cfg.R === cfg.r;
    $('petals').textContent = same ? 'Same size as the ring: the gear cannot roll. Pick a smaller gear.' : `Makes ${cfg.R / n} petals and goes round the ring ${cfg.r / n} time${cfg.r / n === 1 ? '' : 's'}.`;
    const done = layers.filter((L) => L.t >= L.tMax).length;
    $('layersInfo').textContent = `${layers.length} layer${layers.length === 1 ? '' : 's'}${layers.length ? `, ${done} finished` : ''}.`;
    $('bUndo').disabled = !layers.length;
  }

  let gestured = false;
  addEventListener('pointerdown', () => { gestured = true; }, { capture: true });
  addEventListener('keydown', () => { gestured = true; }, { capture: true });
  function current() { return layers.find((L) => L.t < L.tMax) || null; }
  function settingsChanged() {
    if (cfg.mode === 'in' && cfg.r >= cfg.R) { cfg.r = cfg.R - 1; $('r').value = cfg.r; paintSlider('r'); }
    const L = current();
    if (L) { layers[layers.indexOf(L)] = makeLayer(cfg); redrawPaper(); }
    else if (layers.length) { const last = layers[layers.length - 1]; if (last.t >= last.tMax) { layers.pop(); layers.push(makeLayer(cfg)); redrawPaper(); } }
    paintInfo();
  }

  const fmt = { R: (v) => `${v}`, r: (v) => `${v}`, p: (v) => `${Math.round(v * 100)}%`, w: (v) => `${v.toFixed(1)} px`, s: (v) => `${v.toFixed(1)}×` };
  const keyOf = { R: 'R', r: 'r', p: 'p', w: 'w', s: 'speed' };
  function paintSlider(id) { $('o' + id).textContent = fmt[id](parseFloat($(id).value)); }
  ['R', 'r', 'p', 'w', 's'].forEach((id) => {
    const el = $(id);
    el.addEventListener('input', () => {
      const v = parseFloat(el.value);
      cfg[keyOf[id]] = id === 'R' || id === 'r' ? Math.round(v) : v;
      paintSlider(id);
      if (id === 's') return;
      if (id === 'w') { const L = current() || layers[layers.length - 1]; if (L) { L.w = v; redrawPaper(); } return; }
      settingsChanged();
    });
    paintSlider(id);
  });
  document.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => {
    cfg.mode = b.dataset.mode;
    document.querySelectorAll('[data-mode]').forEach((q) => q.setAttribute('aria-pressed', String(q === b)));
    settingsChanged();
  }));
  const swEl = $('swatches');
  COLORS.forEach((c) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', c === 'rainbow' ? 'Rainbow' : `Colour ${c}`);
    b.style.background = c === 'rainbow' ? 'conic-gradient(#ff5a36, #f5b700, #2fb344, #0fb5ae, #3a6ff7, #b14aed, #ff5a36)' : c;
    b.addEventListener('click', () => setColor(c, true));
    swEl.append(b);
  });
  function setColor(c, apply) {
    cfg.color = c;
    [...swEl.children].forEach((b, i) => b.setAttribute('aria-pressed', String(COLORS[i] === c)));
    if (apply) { const L = current() || layers[layers.length - 1]; if (L) { L.color = c; redrawPaper(); } }
  }
  setColor(cfg.color, false);

  function setPlaying(v) { playing = v; $('bPlay').textContent = v ? '⏸ Pause' : '▶ Draw'; $('bPlay').setAttribute('aria-pressed', String(!v)); }
  $('bPlay').addEventListener('click', () => setPlaying(!playing));
  $('bLayer').addEventListener('click', () => {
    const i = COLORS.indexOf(cfg.color);
    if (layers.length && cfg.color !== 'rainbow') setColor(COLORS[(i + 1) % (COLORS.length - 1)], false);
    layers.push(makeLayer(cfg));
    setPlaying(true); paintInfo();
    intro.classList.add('is-faded');
    Curio.beep(520, 0.07, 'triangle', 0.06);
  });
  $('bUndo').addEventListener('click', () => { layers.pop(); redrawPaper(); paintInfo(); Curio.beep(300, 0.07, 'triangle', 0.06); });
  $('bClear').addEventListener('click', () => { if (!layers.length) return; layers = []; redrawPaper(); paintInfo(); Curio.toast('Fresh paper. Press ➕ New layer or 🎲 Random design.'); });
  $('bGears').addEventListener('click', () => { showGears = !showGears; $('bGears').setAttribute('aria-pressed', String(showGears)); });
  $('bPanel').addEventListener('click', () => { const p = $('panel'); p.hidden = !p.hidden; $('bPanel').setAttribute('aria-pressed', String(!p.hidden)); layout(); redrawPaper(); });

  function syncControls() {
    ['R', 'r', 'p', 'w'].forEach((id) => { $(id).value = cfg[keyOf[id]]; paintSlider(id); });
    document.querySelectorAll('[data-mode]').forEach((q) => q.setAttribute('aria-pressed', String(q.dataset.mode === cfg.mode)));
    setColor(cfg.color, false);
  }
  function randomDesign() {
    layers = [];
    const base = Math.random() * 360, scheme = Curio.pick([[0, 30, 60], [0, 150, 200], [0, 120, 240], [0, 20, 200, 220], [0, 180]]);
    const count = 2 + (Math.random() * 3 | 0);
    const rainbow = Math.random() < 0.15;
    const outer = Math.random() < 0.3;
    for (let i = 0; i < count; i++) {
      let R, r, tries = 0;
      do {
        R = Curio.randInt(80, 150); r = Curio.randInt(12, R - 8);
        const g = gcd(R, r), lobes = R / g, loops = r / g;
        if (lobes >= 5 && lobes <= 48 && loops >= 2 && loops <= 30) break;
      } while (++tries < 200);
      const mode = outer && i === 0 ? 'out' : 'in';
      if (mode === 'out') { R = Curio.randInt(50, 80); r = Curio.randInt(10, 30); }
      const hue = (base + scheme[i % scheme.length]) % 360;
      const color = rainbow && i === 0 ? 'rainbow' : hslHex(hue, 80, Curio.isDark() ? 62 : 52);
      layers.push(makeLayer({ mode, R, r, p: Curio.rand(0.45, 1.05), color, w: Curio.rand(0.8, 2), speed: cfg.speed }));
    }
    const L = layers[0];
    Object.assign(cfg, { mode: L.mode, R: L.R, r: L.r, p: L.p, color: L.color, w: L.w });
    syncControls();
    redrawPaper(); setPlaying(true); paintInfo();
    if (cfg.speed < 5) { cfg.speed = 6; $('s').value = 6; paintSlider('s'); }
    intro.classList.add('is-faded');
    Curio.beep(392, 0.08, 'triangle', 0.06); setTimeout(() => Curio.beep(587, 0.1, 'triangle', 0.06), 80);
  }
  function hslHex(h, s, l) {
    s /= 100; l /= 100;
    const f = (n) => { const kk = (n + h / 30) % 12, c = l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(kk - 3, 9 - kk, 1)); return Math.round(c * 255).toString(16).padStart(2, '0'); };
    return `#${f(0)}${f(8)}${f(4)}`;
  }
  $('bRandom').addEventListener('click', randomDesign);
  $('bSave').addEventListener('click', () => {
    const out = document.createElement('canvas'); out.width = paper.width; out.height = paper.height;
    const o = out.getContext('2d');
    o.fillStyle = C.bg; o.fillRect(0, 0, out.width, out.height); o.drawImage(paper, 0, 0);
    out.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'spirograph.png';
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      Curio.toast('Saved spirograph.png 🌸');
    });
  });
  const pathCache = new Map();
  function drawCurve(c, color, width, dash) {
    const key = `${c.mode},${c.R},${c.r},${c.p},${cx},${cy},${k}`;
    let path = pathCache.get(key);
    if (!path) {
      const L = makeLayer({ ...c, color: '#000' });
      path = new Path2D();
      const stp = Math.max(L.step * 1.5, L.tMax / 6000);
      for (let t = 0; t <= L.tMax + stp; t += stp) { const [x, y] = pen(L, Math.min(t, L.tMax)); if (t === 0) path.moveTo(sx(x), sy(y)); else path.lineTo(sx(x), sy(y)); }
      if (pathCache.size > 30) pathCache.clear();
      pathCache.set(key, path);
    }
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash); ctx.lineJoin = 'round';
    ctx.stroke(path);
    ctx.restore();
  }

  function thumb(preset) {
    const c = document.createElement('canvas');
    c.width = 68; c.height = 68;
    const g = c.getContext('2d');
    for (const lc of preset.layers) {
      const L = makeLayer({ ...lc, color: '#000' });
      g.strokeStyle = lc.color === 'rainbow' ? '#b14aed' : lc.color; g.lineWidth = 1.2;
      g.beginPath();
      const stp = Math.max(L.step * 3, L.tMax / 1500);
      for (let t = 0; t <= L.tMax; t += stp) { const [x, y] = pen(L, t); const X = 34 + x / WORLD * 31, Y = 34 + y / WORLD * 31; if (t === 0) g.moveTo(X, Y); else g.lineTo(X, Y); }
      g.stroke();
    }
    return c;
  }
  function loadPreset(pr) {
    if (chal.on) endChallenge(true);
    layers = pr.layers.map((lc) => makeLayer({ w: 1.4, ...lc, pen: cfg.pen }));
    const L = layers[0];
    Object.assign(cfg, { mode: L.mode, R: L.R, r: L.r, p: L.p, color: L.color, w: L.w });
    syncControls();
    redrawPaper(); setPlaying(true); paintInfo();
    if (cfg.speed < 5) { cfg.speed = 6; $('s').value = 6; paintSlider('s'); }
    intro.classList.add('is-faded');
    drawnPresets.add(pr.name); Curio.store.set('spiro:presets', [...drawnPresets]);
    if (drawnPresets.size >= 8) award('presets');
    Curio.toast(`${pr.name} ✏️`);
    [523, 659].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.07, 'triangle', 0.06), i * 70));
  }
  PRESETS.forEach((pr) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'preset';
    b.append(thumb(pr), document.createTextNode(pr.name));
    b.addEventListener('click', () => { loadPreset(pr); if (innerWidth < 900) { $('panel').hidden = true; $('bPanel').setAttribute('aria-pressed', 'false'); } });
    $('presets').append(b);
  });

  function setPen(p) {
    cfg.pen = p; Curio.store.set('spiro:pen', p);
    document.querySelectorAll('[data-pen]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.pen === p)));
    const L = current() || layers[layers.length - 1];
    if (L) { L.pen = p; redrawPaper(); }
  }
  document.querySelectorAll('[data-pen]').forEach((b) => b.addEventListener('click', () => { setPen(b.dataset.pen); Curio.beep(880, 0.04, 'triangle', 0.05); }));
  function setPaper(p) {
    paperKind = p; Curio.store.set('spiro:paper', p);
    document.querySelectorAll('[data-paper]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.paper === p)));
    C = colors(); redrawPaper();
  }
  document.querySelectorAll('[data-paper]').forEach((b) => b.addEventListener('click', () => { setPaper(b.dataset.paper); Curio.beep(660, 0.04, 'triangle', 0.05); }));
  $('swPrev').addEventListener('click', () => { preview = !preview; $('swPrev').setAttribute('aria-pressed', String(preview)); });

  const chal = { on: false, i: 0, targets: [], score: 0, tries: 0, solved: false, daily: false, target: null };
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function makeTargets(rand) {
    const out = [];
    while (out.length < 5) {
      const mode = rand() < 0.2 ? 'out' : 'in';
      const n = 3 + Math.floor(rand() * 10);
      const m = 1 + Math.floor(rand() * (mode === 'in' ? n - 1 : 4));
      if (gcd(n, m) !== 1) continue;
      const gMin = Math.ceil(8 / m), gMax = mode === 'in' ? Math.floor(150 / n) : Math.floor(80 / n);
      if (gMax < gMin || (mode === 'out' && m * gMin > 60)) continue;
      const g = gMin + Math.floor(rand() * (gMax - gMin + 1));
      const p = Math.round((0.5 + rand() * (mode === 'out' ? 0.7 : 0.5)) * 10) / 10;
      out.push({ mode, R: n * g, r: m * g, p });
    }
    return out;
  }
  async function startChallenge() {
    const v = await Curio.modal({ emoji: '🎯', title: 'Gear challenge', body: 'Five mystery patterns. Set the gears and pen hole so your faint preview matches the gold one, then press Check. Fewer tries, more points.', buttons: [{ label: '📅 Today\'s daily', value: 'daily' }, { label: '🎲 Random five', value: 'random' }, { label: 'Not now', value: 'no' }] });
    if (v !== 'daily' && v !== 'random') return;
    const d = new Date(), key = `${d.getFullYear()}${d.getMonth() + 1}${d.getDate()}`;
    chal.daily = v === 'daily';
    chal.key = key;
    chal.targets = makeTargets(chal.daily ? rng(+key * 2654435761) : Math.random);
    chal.on = true; chal.i = 0; chal.score = 0;
    $('chal').classList.remove('hidden');
    $('bChal').setAttribute('aria-pressed', 'true');
    intro.classList.add('is-faded');
    if ($('panel').hidden && innerWidth >= 900) { $('panel').hidden = false; $('bPanel').setAttribute('aria-pressed', 'true'); layout(); }
    loadTarget();
  }
  function loadTarget() {
    chal.target = chal.targets[chal.i]; chal.tries = 0; chal.solved = false;
    layers = []; redrawPaper(); paintInfo();
    Object.assign(cfg, { mode: 'in', R: 120, r: 50, p: 0.7 });
    syncControls(); paintInfo();
    $('chalTitle').textContent = `${chal.daily ? 'Daily' : 'Target'} ${chal.i + 1} of 5`;
    $('chalScore').textContent = `${chal.score} pts`;
    hint('Match the dotted gold pattern. Change the gears and pen hole, then press Check.', '');
  }
  function hint(text, cls) { const p = $('chalHint'); p.textContent = text; p.className = cls; }
  function checkTarget() {
    if (!chal.on || chal.solved) return;
    const T = chal.target, gt = gcd(T.R, T.r), gu = gcd(cfg.R, cfg.r);
    const tn = T.R / gt, tm = T.r / gt, un = cfg.R / gu, um = cfg.r / gu;
    chal.tries++;
    let msg = '';
    if (cfg.mode !== T.mode) msg = `The gold gear rolls ${T.mode === 'in' ? 'inside' : 'outside'} the ring.`;
    else if (un !== tn) msg = `The target has ${tn} petals. Yours has ${un}.`;
    else if (um !== tm) msg = `${tn} petals, nice! But the gear goes round the ring ${tm} time${tm === 1 ? '' : 's'} in the target, ${um} in yours.`;
    else if (Math.abs(cfg.p - T.p) > 0.06) msg = `So close! Move the pen hole ${cfg.p < T.p ? 'further out' : 'further in'}.`;
    if (msg) {
      hint(msg, 'bad');
      const el = $('chal'); el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
      Curio.beep(220, 0.15, 'sawtooth', 0.05);
      try { navigator.vibrate && navigator.vibrate(40); } catch (e) { }
      return;
    }
    const pts = Math.max(40, 100 - (chal.tries - 1) * 15);
    chal.score += pts; chal.solved = true;
    award('chal1');
    $('chalScore').textContent = `${chal.score} pts`;
    hint(`Solved in ${chal.tries} ${chal.tries === 1 ? 'try' : 'tries'}! +${pts}`, 'good');
    layers = [makeLayer({ ...T, color: cfg.color === 'rainbow' ? 'rainbow' : cfg.color, w: 2, pen: cfg.pen })];
    if (cfg.speed < 6) { cfg.speed = 8; $('s').value = 8; paintSlider('s'); }
    setPlaying(true); redrawPaper();
    Curio.confetti(60);
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.1, 'triangle', 0.1), i * 80));
    const i = chal.i;
    setTimeout(() => { if (chal.on && chal.i === i) nextTarget(); }, 3200);
  }
  function nextTarget() {
    chal.i++;
    if (chal.i >= chal.targets.length) { endChallenge(false); return; }
    loadTarget();
  }
  async function endChallenge(quiet) {
    chal.on = false; chal.target = null;
    $('chal').classList.add('hidden');
    $('bChal').setAttribute('aria-pressed', 'false');
    if (quiet) return;
    if (chal.score >= 500) award('perfect');
    if (chal.daily) award('daily');
    const best = Curio.best(chal.daily ? `daily-${chal.key}` : 'challenge', chal.score);
    if (best.isNew && chal.score > 0) Curio.confetti();
    const v = await Curio.modal({ emoji: chal.score >= 450 ? '🏆' : chal.score >= 250 ? '⚙️' : '🌀', title: `${chal.score} points`, body: `${chal.daily ? 'Daily challenge done.' : 'Challenge done.'} ${best.isNew && chal.score > 0 ? 'New best!' : `Best: ${best.best}.`} A perfect run is 500.`, buttons: [{ label: 'Copy result', value: 'share' }, { label: 'Play again', value: 'again' }, { label: 'Close', value: 'x' }] });
    if (v === 'share') {
      const txt = `⚙️ Curio Spirograph ${chal.daily ? `daily ${chal.key}` : 'challenge'}: ${chal.score}/500`;
      try { await navigator.clipboard.writeText(txt); Curio.toast('Copied!'); } catch (e) { Curio.toast(txt, 4000); }
    }
    if (v === 'again') startChallenge();
  }
  $('bChal').addEventListener('click', () => { if (chal.on) endChallenge(true); else startChallenge(); });
  $('chalCheck').addEventListener('click', checkTarget);
  $('chalSkip').addEventListener('click', () => { if (!chal.on) return; hint(`It was ${chal.target.R} and ${chal.target.r} teeth, hole ${Math.round(chal.target.p * 100)}%.`, 'bad'); const i = chal.i; chal.solved = true; setTimeout(() => { if (chal.on && chal.i === i) nextTarget(); }, 1800); });
  $('chalQuit').addEventListener('click', () => endChallenge(true));

  const retheme = () => { C = colors(); redrawPaper(); };
  addEventListener('curio:theme', retheme);
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', retheme);
  addEventListener('keydown', (e) => {
    if (e.target.closest?.('input, button')) return;
    if (e.key === ' ') { e.preventDefault(); setPlaying(!playing); }
    else if (e.key === 'n' || e.key === 'N') $('bLayer').click();
    else if (e.key === 'r' || e.key === 'R') randomDesign();
    else if (e.key === 'g' || e.key === 'G') $('bGears').click();
    else if ((e.key === 'z' || e.key === 'Z') && layers.length) $('bUndo').click();
    else if (e.key === 'c' || e.key === 'C') $('bChal').click();
    else if (e.key === 'Enter' && chal.on) checkTarget();
  });
  cv.addEventListener('click', () => { intro.classList.add('is-faded'); setPlaying(!playing); });

  let raf = 0, last = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now; time += dt;
    if (playing) advance(dt);
    render();
  }
  const start = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  addEventListener('resize', resize);
  if (innerWidth >= 900) { $('panel').hidden = false; $('bPanel').setAttribute('aria-pressed', 'true'); }
  resize();
  layers.push(makeLayer(cfg));
  setPen(cfg.pen); setPaper(paperKind); renderBadges();
  paintInfo();
  setTimeout(() => intro.classList.add('is-faded'), 9000);
  start();
  window.__sp = { get chal() { return chal; }, cfg, checkTarget, setPaper, setPen, loadPreset: (n) => loadPreset(PRESETS.find((p) => p.name === n)), startChallenge };
})();
