(() => {
  function workerMain() {
    onmessage = (e) => {
      const t = e.data;
      const { s, y0, y1, Wc, Hc, cx, cy, scale, maxIter, julia, kind } = t;
      const flip = kind === 'ship' ? -1 : 1;
      const jx = t.jx, jy = t.jy * flip;
      const cols = Math.ceil(Wc / s), rows = Math.ceil((y1 - y0) / s);
      const out = new Float32Array(cols * rows);
      const deg = kind === 'cubic' ? 3 : kind === 'quartic' ? 4 : 2;
      const INV_LOGD = 1 / Math.log(deg), eps = 1e-15;
      let k = 0;
      for (let r = 0; r < rows; r++) {
        const ci0 = (cy - (y0 + r * s + s * 0.5 - Hc / 2) * scale) * flip;
        for (let c = 0; c < cols; c++) {
          const cr0 = cx + (c * s + s * 0.5 - Wc / 2) * scale;
          let zr, zi, cr, ci;
          if (julia) { zr = cr0; zi = ci0; cr = jx; ci = jy; }
          else {
            zr = 0; zi = 0; cr = cr0; ci = ci0;
            if (kind === 'mandel') {
              const xq = cr - 0.25, q = xq * xq + ci * ci;
              if (q * (q + xq) <= 0.25 * ci * ci || (cr + 1) * (cr + 1) + ci * ci <= 0.0625) { out[k++] = -1; continue; }
            }
          }
          let n = 0, zr2 = zr * zr, zi2 = zi * zi, pr = zr, pi = zi, per = 0, perLen = 8;
          while (n < maxIter && zr2 + zi2 <= 65536) {
            if (kind === 'mandel') { zi = 2 * zr * zi + ci; zr = zr2 - zi2 + cr; }
            else if (kind === 'ship') { zi = Math.abs(2 * zr * zi) + ci; zr = zr2 - zi2 + cr; }
            else if (kind === 'tricorn') { zi = -2 * zr * zi + ci; zr = zr2 - zi2 + cr; }
            else if (kind === 'celtic') { zi = 2 * zr * zi + ci; zr = Math.abs(zr2 - zi2) + cr; }
            else if (kind === 'cubic') { const nr = zr * (zr2 - 3 * zi2) + cr; zi = zi * (3 * zr2 - zi2) + ci; zr = nr; }
            else { const a = zr2 - zi2, b = 2 * zr * zi; zr = a * a - b * b + cr; zi = 2 * a * b + ci; }
            zr2 = zr * zr; zi2 = zi * zi; n++;
            if (Math.abs(zr - pr) < eps && Math.abs(zi - pi) < eps) { n = maxIter; break; }
            if (++per === perLen) { per = 0; perLen *= 2; pr = zr; pi = zi; }
          }
          out[k++] = n >= maxIter ? -1 : n + 1 - Math.log(Math.log(zr2 + zi2) * 0.5) * INV_LOGD;
        }
      }
      postMessage({ job: t.job, s, y0, y1, cols, rows, out }, [out.buffer]);
    };
  }

  const cv = document.getElementById('cv');
  const ctx = cv.getContext('2d');
  const $ = (id) => document.getElementById(id);
  const intro = $('intro');
  const img = document.createElement('canvas'), ictx = img.getContext('2d');
  const tmp = document.createElement('canvas'), tctx = tmp.getContext('2d');
  let W = 0, H = 0, dpr = 1, Wc = 0, Hc = 0;
  let view = { cx: -0.6, cy: 0, scale: 0.004 }, imgView = null;
  let mode = 'mandel', jc = { x: -0.8, y: 0.156 }, savedView = null, picking = false;
  let kind = Curio.store.get('mb:kind', 'mandel'), orbitOn = false, orbitAt = null;
  const KINDS = {
    mandel: { name: 'Mandelbrot', f: 'z² + c', home: { cx: -0.6, cy: 0, h: 2.6 } },
    ship: { name: 'Burning Ship', f: '(|Re z| + i|Im z|)² + c', home: { cx: -0.45, cy: 0.55, h: 2.9 } },
    tricorn: { name: 'Tricorn', f: 'z̄² + c', home: { cx: -0.25, cy: 0, h: 3.2 } },
    celtic: { name: 'Celtic', f: '|Re z²| + i Im z² + c', home: { cx: -0.4, cy: 0, h: 3 } },
    cubic: { name: 'Multibrot 3', f: 'z³ + c', home: { cx: 0, cy: 0, h: 2.7 } },
    quartic: { name: 'Multibrot 4', f: 'z⁴ + c', home: { cx: -0.1, cy: 0, h: 2.6 } }
  };
  if (!KINDS[kind]) kind = 'mandel';
  const BADGES = [
    ['deep6', '🔭 A million times', 'Zoom past 10⁶'],
    ['deep10', '🛸 Ten billion', 'Zoom past 10¹⁰'],
    ['deep13', '⚛️ Edge of numbers', 'Zoom past 10¹³'],
    ['kinds', '🧭 Fractal tourist', 'Visit all six fractals'],
    ['julia', '🎯 Julia hunter', 'Pick a Julia set'],
    ['orbit', '🌀 Orbit watcher', 'Trace an orbit'],
    ['ship', '🚢 All aboard', 'Find the Armada'],
    ['gallery', '🖼️ Curator', 'Save 5 views to your gallery']
  ];
  let badges = Curio.store.get('mb:badges', []);
  if (!Array.isArray(badges)) badges = [];
  const seenKinds = new Set(Curio.store.get('mb:seen', []));
  let gallery = Curio.store.get('mb:gallery', []);
  if (!Array.isArray(gallery)) gallery = [];
  function award(id) {
    if (badges.includes(id)) return;
    badges.push(id);
    Curio.store.set('mb:badges', badges);
    const b = BADGES.find((x) => x[0] === id);
    if (b) { Curio.toast(`Badge: ${b[1]}`); [784, 988, 1175].forEach((f, k) => setTimeout(() => Curio.beep(f, 0.08, 'triangle', 0.07), k * 80)); }
    renderBadges();
  }
  function renderBadges() {
    const el = document.getElementById('badges');
    if (el) el.innerHTML = BADGES.map(([id, n, d]) => `<div class="badge${badges.includes(id) ? ' got' : ''}"><b>${badges.includes(id) ? n : `🔒 ${n.split(' ').slice(1).join(' ')}`}</b>${d}</div>`).join('');
  }
  let vals = null, imgData = null, pix = null, rowLevel = null;
  let job = 0, jobStart = 0, jobDone = true, wantJob = false, jobParams = null, tasksTotal = 0, tasksDone = 0;
  let dirty = true, density = 0.2, detail = 1, cycling = false, offset = 0;
  let fly = null, auto = null;
  const MIN_SCALE = 4e-15;

  const PALETTES = [
    { name: 'Classic', inside: '#000000', stops: [[0, '#000764'], [0.16, '#206bcb'], [0.42, '#edffff'], [0.6425, '#ffaa00'], [0.8575, '#000200'], [1, '#000764']] },
    { name: 'Fire', inside: '#000000', stops: [[0, '#0a0000'], [0.2, '#5c0a00'], [0.45, '#e83a00'], [0.65, '#ffb000'], [0.8, '#fff6c0'], [1, '#0a0000']] },
    { name: 'Ocean', inside: '#00090d', stops: [[0, '#001219'], [0.25, '#005f73'], [0.45, '#0a9396'], [0.62, '#94d2bd'], [0.8, '#e9d8a6'], [1, '#001219']] },
    { name: 'Neon', inside: '#05010f', stops: [[0, '#0d0221'], [0.3, '#ff00a0'], [0.55, '#00f0ff'], [0.75, '#f6ff00'], [1, '#0d0221']] },
    { name: 'Candy', inside: '#1a0f2e', stops: [[0, '#ffd1dc'], [0.22, '#ff6fb5'], [0.45, '#8a5cff'], [0.68, '#3fd0ff'], [0.85, '#fff3b0'], [1, '#ffd1dc']] },
    { name: 'Ink', inside: '#0b0b0b', stops: [[0, '#0b0b0b'], [0.5, '#f5efe2'], [1, '#0b0b0b']] },
    { name: 'Sunset', inside: '#14061f', stops: [[0, '#14061f'], [0.25, '#6a1b6e'], [0.5, '#e8455a'], [0.72, '#ffb35c'], [0.88, '#fff2c4'], [1, '#14061f']] },
    { name: 'Forest', inside: '#06120a', stops: [[0, '#06120a'], [0.3, '#1d4d2b'], [0.55, '#6fa84f'], [0.75, '#e6d98a'], [0.9, '#7a4b25'], [1, '#06120a']] },
    { name: 'Aurora', inside: '#020611', stops: [[0, '#020611'], [0.3, '#0b3d5c'], [0.5, '#21d19f'], [0.7, '#a6ff8f'], [0.85, '#b46cff'], [1, '#020611']] },
    { name: 'Gold', inside: '#0d0800', stops: [[0, '#0d0800'], [0.35, '#6b4500'], [0.6, '#f2c14e'], [0.8, '#fff7d6'], [1, '#0d0800']] },
    { name: 'Ice', inside: '#ffffff', stops: [[0, '#f4fbff'], [0.3, '#b9e2ff'], [0.55, '#4a8fd9'], [0.8, '#1a2d6b'], [1, '#f4fbff']] },
    { name: 'Rainbow', inside: '#000000', stops: [[0, '#ff3b3b'], [0.17, '#ffb03b'], [0.33, '#f7ff3b'], [0.5, '#3bff7a'], [0.67, '#3bc8ff'], [0.83, '#9b3bff'], [1, '#ff3b3b']] }
  ];
  const LUT_N = 2048;
  let lut = new Uint32Array(LUT_N), insideColor = 0, palIdx = 0;
  const little = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1;
  const pack = (r, g, b) => little ? ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0 : ((r << 24) | (g << 16) | (b << 8) | 255) >>> 0;
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  function buildLut(i) {
    palIdx = i;
    const p = PALETTES[i];
    const st = p.stops.map(([t, c]) => [t, hex(c)]);
    for (let k = 0; k < LUT_N; k++) {
      const t = k / LUT_N;
      let j = 0; while (j < st.length - 2 && st[j + 1][0] < t) j++;
      const [t0, c0] = st[j], [t1, c1] = st[j + 1];
      const u = (t - t0) / (t1 - t0 || 1), e = u * u * (3 - 2 * u);
      lut[k] = pack(Math.round(c0[0] + (c1[0] - c0[0]) * e), Math.round(c0[1] + (c1[1] - c0[1]) * e), Math.round(c0[2] + (c1[2] - c0[2]) * e));
    }
    const ic = hex(p.inside); insideColor = pack(ic[0], ic[1], ic[2]);
  }

  function colourRows(y0, y1) {
    const d = density * LUT_N, off = offset * LUT_N;
    for (let y = y0; y < y1; y++) {
      let i = y * Wc;
      for (let x = 0; x < Wc; x++, i++) {
        const v = vals[i];
        pix[i] = v < 0 ? insideColor : lut[(((Math.sqrt(v > 0 ? v : 0) - 1.4) * d + off + LUT_N) | 0) & (LUT_N - 1)];
      }
    }
  }

  const nWorkers = Math.max(2, Math.min(8, (navigator.hardwareConcurrency || 4) - 1));
  const workerUrl = URL.createObjectURL(new Blob([`(${workerMain.toString()})()`], { type: 'text/javascript' }));
  const workers = Array.from({ length: nWorkers }, () => {
    const w = new Worker(workerUrl);
    w.busy = false;
    w.onmessage = (e) => { w.busy = false; receive(e.data); pump(); };
    return w;
  });
  let queue = [];
  function pump() {
    for (const w of workers) {
      if (w.busy || !queue.length) continue;
      w.busy = true; w.postMessage(queue.shift());
    }
    if (!queue.length && workers.every((w) => !w.busy) && !jobDone) { jobDone = true; paintProgress(); }
  }
  function receive(m) {
    if (m.job !== job) return;
    const { s, y0, cols, rows, out } = m;
    let minY = Hc, maxY = 0;
    for (let r = 0; r < rows; r++) {
      const ya = y0 + r * s, yb = Math.min(Hc, ya + s);
      for (let y = ya; y < yb; y++) {
        if (rowLevel[y] <= s) continue;
        rowLevel[y] = s;
        if (y < minY) minY = y; if (y + 1 > maxY) maxY = y + 1;
        const base = y * Wc, ob = r * cols;
        for (let c = 0; c < cols; c++) {
          const v = out[ob + c], xa = c * s, xb = Math.min(Wc, xa + s);
          for (let x = xa; x < xb; x++) vals[base + x] = v;
        }
      }
    }
    if (maxY > minY) {
      colourRows(minY, maxY);
      ictx.putImageData(imgData, 0, 0, 0, minY, Wc, maxY - minY);
      dirty = true;
    }
    tasksDone++;
    paintProgress();
  }
  function paintProgress() {
    const p = $('progress');
    p.style.width = (tasksTotal ? (tasksDone / tasksTotal) * 100 : 100) + '%';
    p.classList.toggle('is-done', jobDone);
  }

  const zoomOf = (v) => (3 / Math.min(W, H)) / v.scale;
  function maxIterFor(v) {
    const z = Math.max(1, zoomOf(v));
    const base = mode === 'julia' ? 220 : 160;
    return Math.max(60, Math.min(30000, Math.round(detail * base * Math.pow(1 + Math.log10(z), 1.4))));
  }

  function bake() {
    if (!imgView) return;
    tctx.setTransform(1, 0, 0, 1, 0, 0);
    tctx.drawImage(img, 0, 0);
    ictx.fillStyle = '#000'; ictx.fillRect(0, 0, Wc, Hc);
    const k = imgView.scale / view.scale;
    const dx = Wc / 2 + ((imgView.cx - view.cx) / view.scale) * dpr - (Wc / 2) * k;
    const dy = Hc / 2 - ((imgView.cy - view.cy) / view.scale) * dpr - (Hc / 2) * k;
    ictx.imageSmoothingEnabled = k < 4;
    ictx.drawImage(tmp, dx, dy, Wc * k, Hc * k);
  }

  function startJob() {
    wantJob = false;
    bake();
    imgView = { ...view };
    job++; jobStart = performance.now(); jobDone = false;
    rowLevel.fill(99);
    const maxIter = maxIterFor(view);
    jobParams = { maxIter };
    const passes = Wc * Hc > 400000 ? [8, 4, 2, 1] : [4, 2, 1];
    queue = [];
    for (const s of passes) {
      const cols = Math.ceil(Wc / s);
      const perTask = Math.max(1, Math.floor((s === 1 ? 14000 : 22000) / cols));
      const bands = [];
      for (let y = 0; y < Hc; y += perTask * s) bands.push([y, Math.min(Hc, y + perTask * s)]);
      bands.sort((a, b) => Math.abs((a[0] + a[1]) / 2 - Hc / 2) - Math.abs((b[0] + b[1]) / 2 - Hc / 2));
      for (const [y0, y1] of bands) queue.push({ job, s, y0, y1, Wc, Hc, cx: view.cx, cy: view.cy, scale: view.scale / dpr, maxIter, julia: mode === 'julia', jx: jc.x, jy: jc.y, kind });
    }
    tasksTotal = queue.length; tasksDone = 0;
    paintProgress();
    pump();
    paintInfo();
  }
  function requestJob() { wantJob = true; dirty = true; }

  function recolourAll() {
    for (let y = 0; y < Hc; y++) if (rowLevel[y] < 99) { let y1 = y; while (y1 < Hc && rowLevel[y1] < 99) y1++; colourRows(y, y1); ictx.putImageData(imgData, 0, 0, 0, y, Wc, y1 - y); y = y1; }
    dirty = true;
  }

  function resize() {
    const r = cv.getBoundingClientRect();
    const oldW = W, oldH = H;
    dpr = Math.min(2, devicePixelRatio || 1);
    W = r.width; H = r.height;
    Wc = Math.max(1, Math.round(W * dpr)); Hc = Math.max(1, Math.round(H * dpr));
    cv.width = Wc; cv.height = Hc; ov.width = Wc; ov.height = Hc;
    img.width = Wc; img.height = Hc; tmp.width = Wc; tmp.height = Hc;
    vals = new Float32Array(Wc * Hc);
    imgData = ictx.createImageData(Wc, Hc);
    pix = new Uint32Array(imgData.data.buffer);
    rowLevel = new Uint8Array(Hc);
    if (!oldW) view = homeOf(kind);
    else view.scale *= Math.max(oldW / W, oldH / H) > 0 ? Math.min(oldW / W, oldH / H) : 1;
    ictx.fillStyle = '#000'; ictx.fillRect(0, 0, Wc, Hc);
    imgView = null;
    startJob();
  }

  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, Wc, Hc);
    if (imgView) {
      const k = imgView.scale / view.scale;
      const dx = Wc / 2 + ((imgView.cx - view.cx) / view.scale) * dpr - (Wc / 2) * k;
      const dy = Hc / 2 - ((imgView.cy - view.cy) / view.scale) * dpr - (Hc / 2) * k;
      ctx.imageSmoothingEnabled = k < 3 || k > 0.999 && k < 1.001;
      ctx.drawImage(img, dx, dy, Wc * k, Hc * k);
    }
    dirty = false;
  }

  function fmtZoom(z) {
    if (z < 1000) return z.toFixed(z < 10 ? 1 : 0) + '×';
    const e = Math.floor(Math.log10(z)), m = z / Math.pow(10, e);
    const sup = String(e).split('').map((d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]).join('');
    return `${m.toFixed(1)} × 10${sup}`;
  }
  function paintInfo() {
    const z = zoomOf(view);
    const prec = Math.max(4, Math.min(15, Math.ceil(-Math.log10(view.scale)) + 1));
    const im = view.cy;
    const where = mode === 'julia' ? `${KINDS[kind].name} Julia c = ${jc.x.toFixed(4)} ${jc.y < 0 ? '-' : '+'} ${Math.abs(jc.y).toFixed(4)}i · ` : `${KINDS[kind].name} ${KINDS[kind].f} · `;
    const lz = Math.log10(Math.max(1, z));
    if (lz > 6) award('deep6');
    if (lz > 10) award('deep10');
    if (lz > 13) award('deep13');
    if (lz > (paintInfo.best || 0) + 0.05) { paintInfo.best = Curio.best(`depth-${kind}`, Math.round(lz * 10) / 10).best; }
    $('info').textContent = `${where}zoom ${fmtZoom(z)} · ${Curio.fmt(jobParams ? jobParams.maxIter : 0)} iterations · ${view.cx.toFixed(prec)} ${im < 0 ? '-' : '+'} ${Math.abs(im).toFixed(prec)}i`;
  }

  const toC = (v, sx, sy) => ({ x: v.cx + (sx - W / 2) * v.scale, y: v.cy - (sy - H / 2) * v.scale });
  function clampScale() {
    if (view.scale < MIN_SCALE) { view.scale = MIN_SCALE; if (!clampScale.warned) { clampScale.warned = true; Curio.toast('That is as deep as 64-bit numbers can see. Impressive.', 2600); } return true; }
    if (view.scale > 0.05) view.scale = 0.05;
    return false;
  }
  function zoomAt(sx, sy, f) {
    const p = toC(view, sx, sy);
    view.scale *= f;
    clampScale();
    view.cx = p.x - (sx - W / 2) * view.scale;
    view.cy = p.y + (sy - H / 2) * view.scale;
    requestJob(); paintInfo();
  }

  function flyTo(target, ms = 1400) {
    const from = { ...view };
    const far = Math.hypot(target.cx - from.cx, target.cy - from.cy);
    const legs = [];
    const viaScale = Math.max(from.scale, target.scale, far / Math.min(W, H) * 1.6);
    if (viaScale > from.scale * 4 && viaScale > target.scale * 4) {
      const via = { cx: (from.cx + target.cx) / 2, cy: (from.cy + target.cy) / 2, scale: viaScale };
      legs.push([from, via, ms * 0.55], [via, target, ms]);
    } else legs.push([from, target, ms]);
    fly = { legs, i: 0, t0: performance.now() };
  }
  function stepFly(now) {
    const [a, b, ms] = fly.legs[fly.i];
    let u = Math.min(1, (now - fly.t0) / ms);
    const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
    const ls = Math.log(a.scale) + (Math.log(b.scale) - Math.log(a.scale)) * e;
    view.scale = Math.exp(ls);
    let w = e;
    if (Math.abs(a.scale - b.scale) / Math.max(a.scale, b.scale) > 0.05) w = (a.scale - view.scale) / (a.scale - b.scale);
    view.cx = a.cx + (b.cx - a.cx) * w; view.cy = a.cy + (b.cy - a.cy) * w;
    requestJob(); paintInfo();
    if (u >= 1) { fly.i++; fly.t0 = now; if (fly.i >= fly.legs.length) { const done = fly.done; fly = null; done?.(); } }
  }

  const PLACES = {
    mandel: [
      { name: 'Seahorse Valley', note: '-0.745 + 0.113i', cx: -0.7453, cy: 0.1127, h: 0.0065 },
      { name: 'Seahorse spiral', note: 'deep', cx: -0.743643887037151, cy: 0.13182590420533, h: 0.00012 },
      { name: 'Elephant Valley', note: '0.275 + 0.007i', cx: 0.2751, cy: 0.0068, h: 0.016 },
      { name: 'Triple Spiral Valley', note: '-0.088 + 0.654i', cx: -0.0881, cy: 0.6546, h: 0.016 },
      { name: 'Mini Mandelbrot', note: 'on the antenna', cx: -1.7549, cy: 0, h: 0.036 },
      { name: 'Scepter Valley', note: '-1.36 + 0.0i', cx: -1.3605, cy: 0.0, h: 0.06 },
      { name: 'Lightning', note: '-0.170 - 1.065i', cx: -0.170337, cy: -1.06506, h: 0.0004 },
      { name: 'Misiurewicz point c = i', note: 'a branch tip', cx: 0, cy: 1, h: 0.03 },
      { name: 'Double spiral', note: 'deep', cx: -0.761574, cy: -0.0847596, h: 0.00008 },
      { name: 'Galaxy', note: 'very deep', cx: -0.7746806106269039, cy: -0.1374168856037867, h: 3e-8 }
    ],
    ship: [
      { name: 'The Armada', note: 'masts and rigging', cx: -1.762, cy: 0.028, h: 0.07, badge: 'ship' },
      { name: 'Flagship', note: 'one ship up close', cx: -1.7612, cy: 0.0287, h: 0.012, badge: 'ship' },
      { name: 'Antenna spires', note: 'cathedral towers', cx: -1.86, cy: 0.002, h: 0.05 },
      { name: 'The harbour', note: 'along the mast', cx: -1.6, cy: 0, h: 0.1 },
      { name: 'Bow wave', note: 'the hull edge', cx: -0.5, cy: 0.55, h: 0.5 }
    ],
    tricorn: [
      { name: 'Western arm', note: 'mini tricorns', cx: -1.2177, cy: -0.0558, h: 0.08 },
      { name: 'Northeast arm', note: 'twisted lace', cx: 0.5973, cy: 0.8406, h: 0.08 },
      { name: 'Southern seam', note: 'broken spirals', cx: 0.4644, cy: -0.6066, h: 0.08 }
    ],
    celtic: [
      { name: 'Knotwork', note: 'upper edge', cx: -0.7923, cy: 0.7927, h: 0.08 },
      { name: 'Braids', note: 'lower edge', cx: -0.7785, cy: -0.7626, h: 0.08 },
      { name: 'Far south', note: 'thin tendrils', cx: -0.7504, cy: -1.188, h: 0.08 }
    ],
    cubic: [
      { name: 'Twin bays', note: 'two-fold symmetry', cx: -0.6089, cy: 0.4818, h: 0.08 },
      { name: 'South coast', note: 'lace edge', cx: -0.1686, cy: -0.8349, h: 0.08 },
      { name: 'East shore', note: 'little multibrots', cx: 0.5372, cy: 0.4585, h: 0.08 }
    ],
    quartic: [
      { name: 'Petal', note: 'three-fold bud', cx: 0.3, cy: 0.55, h: 0.35 },
      { name: 'West bud', note: 'the antenna', cx: -0.95, cy: 0, h: 0.3 }
    ]
  };
  const DEEP = [
    { cx: -0.743643887037151, cy: 0.13182590420533, min: 2e-13 },
    { cx: -0.7746806106269039, cy: -0.1374168856037867, min: 2e-13 },
    { cx: -0.10109636384562, cy: 0.95628651080914, min: 2e-13 },
    { cx: 0.001643721971153, cy: 0.822467633298876, min: 1e-12 },
    { cx: -1.25066, cy: 0.02012, min: 1e-9 },
    { cx: 0.3602404434376143, cy: -0.6413130610648031, min: 2e-13 }
  ];
  const homeOf = (k) => { const h = KINDS[k].home; return { cx: h.cx, cy: h.cy, scale: Math.max(h.h * 1.27 / W, h.h * 0.96 / H) }; };
  function goPlace(p) {
    stopAuto();
    if (mode === 'julia') leaveJulia(true);
    if (p.home) flyTo(homeOf(kind), 1400);
    else flyTo({ cx: p.cx, cy: p.cy, scale: p.h / Math.min(W, H) }, 1600);
    if (p.badge) award(p.badge);
    intro.classList.add('is-faded');
    Curio.beep(520, 0.08, 'sine', 0.06);
  }
  const placesEl = $('places');
  function renderPlaces() {
    placesEl.replaceChildren();
    [{ name: `The whole ${KINDS[kind].name}`, note: 'home', home: true }, ...PLACES[kind]].forEach((p) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = `<span></span><small></small>`;
      b.firstChild.textContent = p.name; b.lastChild.textContent = p.note;
      b.addEventListener('click', () => { goPlace(p); if (innerWidth < 900) togglePanel(false); });
      placesEl.append(b);
    });
    document.querySelectorAll('#kinds button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.k === kind)));
    $('bKind').textContent = `🔷 ${KINDS[kind].name}`;
  }
  function setKind(k, quiet) {
    stopAuto(); fly = null;
    kind = k; Curio.store.set('mb:kind', k);
    seenKinds.add(k); Curio.store.set('mb:seen', [...seenKinds]);
    if (seenKinds.size >= 6) award('kinds');
    if (mode === 'julia') { mode = 'mandel'; $('bJulia').textContent = '🎯 Julia'; $('bJulia').setAttribute('aria-pressed', 'false'); }
    savedView = null;
    renderPlaces();
    if (!W) return;
    view = homeOf(k);
    imgView = null; ictx.fillStyle = '#000'; ictx.fillRect(0, 0, Wc, Hc);
    paintInfo.best = 0;
    startJob();
    if (!quiet) { Curio.toast(`${KINDS[k].name}: ${KINDS[k].f}`); [392, 523, 659].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.07, 'sine', 0.06), i * 70)); }
  }
  const palsEl = $('pals');
  PALETTES.forEach((p, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.title = p.name; b.setAttribute('aria-label', p.name + ' palette');
    b.style.background = `linear-gradient(90deg, ${p.stops.map(([t, c]) => `${c} ${t * 100}%`).join(',')})`;
    b.addEventListener('click', () => { setPalette(i); Curio.store.set('mb:pal', i); });
    palsEl.append(b);
  });
  function setPalette(i) {
    buildLut(i);
    [...palsEl.children].forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
    if (vals) { if (jobDone) recolourAll(); else requestJob(); }
  }

  function enterPick() {
    stopAuto();
    picking = true;
    $('bJulia').setAttribute('aria-pressed', 'true');
    cv.classList.add('is-pick');
    Curio.toast(matchMedia('(hover: hover)').matches ? 'Hover to preview, click to pick c for your Julia set' : 'Tap anywhere to pick c for your Julia set', 2600);
  }
  function pickJulia(sx, sy) {
    const p = toC(view, sx, sy);
    picking = false; cv.classList.remove('is-pick');
    $('preview').classList.remove('is-on');
    savedView = { ...view };
    mode = 'julia'; jc = { x: p.x, y: p.y };
    view = { cx: 0, cy: 0, scale: Math.max(3.4 / W, 3.0 / H) };
    award('julia');
    imgView = null; ictx.fillStyle = '#000'; ictx.fillRect(0, 0, Wc, Hc);
    $('bJulia').textContent = `↩ ${KINDS[kind].name}`;
    $('bJulia').setAttribute('aria-pressed', 'true');
    startJob();
    Curio.beep(660, 0.1, 'sine', 0.07); setTimeout(() => Curio.beep(880, 0.12, 'sine', 0.06), 90);
  }
  function leaveJulia(quiet) {
    mode = 'mandel';
    view = savedView ? { ...savedView } : homeOf(kind);
    imgView = null; ictx.fillStyle = '#000'; ictx.fillRect(0, 0, Wc, Hc);
    $('bJulia').textContent = '🎯 Julia';
    $('bJulia').setAttribute('aria-pressed', 'false');
    if (!quiet) startJob();
  }
  $('bJulia').addEventListener('click', () => {
    if (mode === 'julia') leaveJulia();
    else if (picking) { picking = false; cv.classList.remove('is-pick'); $('preview').classList.remove('is-on'); $('bJulia').setAttribute('aria-pressed', 'false'); }
    else enterPick();
  });

  const pv = $('pv'), pvx = pv.getContext('2d'), pvImg = pvx.createImageData(pv.width, pv.height), pvPix = new Uint32Array(pvImg.data.buffer);
  let pvWant = null;
  function stepZ(zr, zi, cr, ci) {
    const zr2 = zr * zr, zi2 = zi * zi;
    if (kind === 'mandel') return [zr2 - zi2 + cr, 2 * zr * zi + ci];
    if (kind === 'ship') return [zr2 - zi2 + cr, Math.abs(2 * zr * zi) + ci];
    if (kind === 'tricorn') return [zr2 - zi2 + cr, -2 * zr * zi + ci];
    if (kind === 'celtic') return [Math.abs(zr2 - zi2) + cr, 2 * zr * zi + ci];
    if (kind === 'cubic') return [zr * (zr2 - 3 * zi2) + cr, zi * (3 * zr2 - zi2) + ci];
    const a = zr2 - zi2, b = 2 * zr * zi;
    return [a * a - b * b + cr, 2 * a * b + ci];
  }
  const degOf = () => (kind === 'cubic' ? 3 : kind === 'quartic' ? 4 : 2);
  function drawPreview(c) {
    const w = pv.width, h = pv.height, sc = 3.2 / w, maxI = 120, d = density * LUT_N, fl = kind === 'ship' ? -1 : 1, lg = Math.log(degOf());
    let i = 0;
    for (let y = 0; y < h; y++) {
      const zi0 = (h / 2 - y) * sc * fl;
      for (let x = 0; x < w; x++, i++) {
        let zr = (x - w / 2) * sc, zi = zi0, n = 0;
        while (n < maxI && zr * zr + zi * zi <= 256) { [zr, zi] = stepZ(zr, zi, c.x, c.y * fl); n++; }
        const m2 = zr * zr + zi * zi;
        pvPix[i] = n >= maxI ? insideColor : lut[(((Math.sqrt(Math.max(0, n + 1 - Math.log(Math.log(m2) * 0.5) / lg)) - 1.4) * d + offset * LUT_N + LUT_N) | 0) & (LUT_N - 1)];
      }
    }
    pvx.putImageData(pvImg, 0, 0);
    $('pvLabel').textContent = `c = ${c.x.toFixed(3)} ${c.y < 0 ? '-' : '+'} ${Math.abs(c.y).toFixed(3)}i`;
    $('preview').classList.add('is-on');
  }

  const ov = $('ov'), octx = ov.getContext('2d');
  function orbitOf(sx, sy) {
    const p = toC(view, sx, sy), fl = kind === 'ship' ? -1 : 1;
    let zr, zi, cr, ci;
    if (mode === 'julia') { zr = p.x; zi = p.y * fl; cr = jc.x; ci = jc.y * fl; }
    else { zr = 0; zi = 0; cr = p.x; ci = p.y * fl; }
    const pts = [[zr, zi * fl]];
    let n = 0;
    while (n < 300 && zr * zr + zi * zi <= 64) { [zr, zi] = stepZ(zr, zi, cr, ci); pts.push([zr, zi * fl]); n++; }
    return { pts, escaped: n < 300, n };
  }
  function drawOrbit() {
    octx.setTransform(1, 0, 0, 1, 0, 0);
    octx.clearRect(0, 0, ov.width, ov.height);
    if (!orbitOn || !orbitAt) return;
    octx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const o = orbitOf(orbitAt.x, orbitAt.y);
    const S = (q) => [W / 2 + (q[0] - view.cx) / view.scale, H / 2 - (q[1] - view.cy) / view.scale];
    octx.lineWidth = 1.5; octx.lineJoin = 'round';
    for (let i = 1; i < o.pts.length; i++) {
      const a = S(o.pts[i - 1]), b = S(o.pts[i]);
      octx.strokeStyle = `hsla(${(i * 9) % 360},100%,65%,${Math.max(0.25, 1 - i / o.pts.length)})`;
      octx.beginPath(); octx.moveTo(a[0], a[1]); octx.lineTo(b[0], b[1]); octx.stroke();
    }
    for (let i = 0; i < Math.min(o.pts.length, 80); i++) {
      const a = S(o.pts[i]);
      octx.fillStyle = i === 0 ? '#ffffff' : `hsl(${(i * 9) % 360},100%,70%)`;
      octx.beginPath(); octx.arc(a[0], a[1], i === 0 ? 5 : 2.5, 0, Math.PI * 2); octx.fill();
    }
    const label = o.escaped ? `escapes after ${o.n} steps` : 'stays trapped: inside the set';
    octx.font = '700 13px system-ui, sans-serif';
    const tw = octx.measureText(label).width;
    const lx = Math.min(orbitAt.x + 12, W - tw - 16);
    octx.fillStyle = 'rgba(0,0,0,.65)'; octx.fillRect(lx, orbitAt.y - 28, tw + 12, 20);
    octx.fillStyle = '#fff'; octx.fillText(label, lx + 6, orbitAt.y - 13);
  }
  function playOrbit() {
    if (!orbitAt) return;
    const o = orbitOf(orbitAt.x, orbitAt.y);
    const ac = !Curio.muted && Curio.audioContext && Curio.audioContext();
    if (!ac) return;
    const t0 = ac.currentTime + 0.02;
    const notes = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
    o.pts.slice(1, 25).forEach((q, i) => {
      const ang = (Math.atan2(q[1], q[0]) + Math.PI) / (Math.PI * 2);
      const f = 220 * Math.pow(2, notes[Math.floor(ang * notes.length) % notes.length] / 12) * (Math.hypot(q[0], q[1]) > 2 ? 2 : 1);
      const osc = ac.createOscillator(), g = ac.createGain(), t = t0 + i * 0.11;
      osc.type = 'triangle'; osc.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.07, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      osc.connect(g).connect(ac.destination); osc.start(t); osc.stop(t + 0.22);
    });
  }
  function setOrbit(on) {
    orbitOn = on;
    $('bOrbit').setAttribute('aria-pressed', String(on));
    cv.classList.toggle('is-pick', on);
    if (on) { award('orbit'); Curio.toast('Point anywhere to see z bounce around. Click to hear its orbit.', 2800); }
    else { orbitAt = null; drawOrbit(); }
  }

  function thumbOf() {
    render();
    const t = document.createElement('canvas');
    t.width = 160; t.height = 110;
    const g = t.getContext('2d');
    const sc = Math.max(160 / Wc, 110 / Hc);
    g.drawImage(cv, (160 - Wc * sc) / 2, (110 - Hc * sc) / 2, Wc * sc, Hc * sc);
    try { return t.toDataURL('image/jpeg', 0.72); } catch (e) { return ''; }
  }
  function saveGallery() {
    const entry = { kind, mode, jc: { ...jc }, cx: view.cx, cy: view.cy, h: view.scale * Math.min(W, H), pal: palIdx, den: density, img: thumbOf(), z: fmtZoom(zoomOf(view)) };
    gallery.unshift(entry);
    gallery = gallery.slice(0, 12);
    try { Curio.store.set('mb:gallery', gallery); } catch (e) { }
    if (gallery.length >= 5) award('gallery');
    renderGallery();
    Curio.toast('Saved to your gallery 🖼️');
    Curio.beep(1046, 0.05, 'triangle', 0.06); setTimeout(() => Curio.beep(1318, 0.07, 'triangle', 0.06), 60);
  }
  function renderGallery() {
    const el = $('gallery');
    el.replaceChildren();
    if (!gallery.length) { el.innerHTML = '<p class="empty">Nothing saved yet. Find something beautiful and press Save view.</p>'; return; }
    gallery.forEach((g, i) => {
      const d = document.createElement('div');
      d.className = 'gthumb';
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', `Open saved ${KINDS[g.kind] ? KINDS[g.kind].name : ''} view at ${g.z}`);
      b.style.backgroundImage = g.img ? `url(${g.img})` : 'none';
      b.innerHTML = `<span>${g.z}</span>`;
      b.addEventListener('click', () => openGallery(g));
      const x = document.createElement('button');
      x.type = 'button'; x.className = 'gdel'; x.textContent = '×'; x.setAttribute('aria-label', 'Delete');
      x.addEventListener('click', () => { gallery.splice(i, 1); Curio.store.set('mb:gallery', gallery); renderGallery(); });
      d.append(b, x);
      el.append(d);
    });
  }
  function openGallery(g) {
    if (!KINDS[g.kind]) return;
    stopAuto(); fly = null;
    if (g.kind !== kind) setKind(g.kind, true);
    if (typeof g.pal === 'number' && PALETTES[g.pal]) setPalette(g.pal);
    if (typeof g.den === 'number') { den.value = g.den; applyDen(); }
    const target = { cx: g.cx, cy: g.cy, scale: g.h / Math.min(W, H) };
    if (g.mode === 'julia') {
      savedView = { ...view };
      mode = 'julia'; jc = { ...g.jc };
      $('bJulia').textContent = `↩ ${KINDS[kind].name}`; $('bJulia').setAttribute('aria-pressed', 'true');
      view = target; imgView = null; ictx.fillStyle = '#000'; ictx.fillRect(0, 0, Wc, Hc); startJob();
    } else {
      if (mode === 'julia') leaveJulia(true);
      flyTo(target, 1600);
    }
    intro.classList.add('is-faded');
  }

  const pointers = new Map();
  let drag = null, pinch = null;
  const posOf = (e) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  cv.addEventListener('contextmenu', (e) => e.preventDefault());
  cv.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch') return;
    cv.setPointerCapture?.(e.pointerId);
    const p = posOf(e);
    pointers.set(e.pointerId, p);
    intro.classList.add('is-faded');
    stopAuto(); fly = null;
    if (pointers.size === 1) drag = { x0: p.x, y0: p.y, v0: { ...view }, moved: false, t0: performance.now(), button: e.button, shift: e.shiftKey, id: e.pointerId };
    else if (pointers.size === 2) {
      drag = null;
      const [a, b] = [...pointers.values()];
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, mid0: mid, v0: { ...view } };
    }
  });
  cv.addEventListener('pointermove', (e) => {
    const p = posOf(e);
    if (picking && !pointers.size) pvWant = toC(view, p.x, p.y);
    if (orbitOn && !mdrag && (!pointers.size || pointers.has(e.pointerId))) { orbitAt = p; drawOrbit(); if (pointers.size) { pointers.set(e.pointerId, p); return; } }
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, p);
    if (pinch && pointers.size >= 2) {
      const [a, b] = [...pointers.values()];
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const c0 = toC(pinch.v0, pinch.mid0.x, pinch.mid0.y);
      view.scale = pinch.v0.scale * pinch.d0 / d;
      clampScale();
      view.cx = c0.x - (mid.x - W / 2) * view.scale;
      view.cy = c0.y + (mid.y - H / 2) * view.scale;
      requestJob(); paintInfo();
    } else if (drag && e.pointerId === drag.id) {
      const dx = p.x - drag.x0, dy = p.y - drag.y0;
      if (!drag.moved && Math.hypot(dx, dy) > 6) { drag.moved = true; cv.classList.add('is-grab'); }
      if (drag.moved) {
        view.cx = drag.v0.cx - dx * view.scale;
        view.cy = drag.v0.cy + dy * view.scale;
        requestJob(); paintInfo();
      }
      if (picking) pvWant = toC(view, p.x, p.y);
    }
  });
  function endPointer(e) {
    if (!pointers.has(e.pointerId)) return;
    const p = pointers.get(e.pointerId);
    pointers.delete(e.pointerId);
    cv.classList.remove('is-grab');
    if (drag && e.pointerId === drag.id && !drag.moved && e.type === 'pointerup') {
      if (picking) pickJulia(p.x, p.y);
      else if (orbitOn) { orbitAt = p; drawOrbit(); playOrbit(); }
      else {
        const out = drag.button === 2 || drag.shift;
        const c = toC(view, p.x, p.y);
        if (out) flyTo({ cx: view.cx, cy: view.cy, scale: Math.min(0.05, view.scale * 3) }, 450);
        else flyTo({ cx: c.x, cy: c.y, scale: Math.max(MIN_SCALE, view.scale / 3) }, 550);
        Curio.beep(out ? 330 : 520, 0.06, 'sine', 0.05);
      }
    }
    drag = null;
    if (pointers.size < 2) pinch = null;
    if (pointers.size === 1) { const [id, q] = [...pointers.entries()][0]; drag = { x0: q.x, y0: q.y, v0: { ...view }, moved: true, id }; }
  }
  let mdrag = null;
  function clickAt(p, out) {
    if (picking) { pickJulia(p.x, p.y); return; }
    if (orbitOn) { orbitAt = p; drawOrbit(); playOrbit(); return; }
    const c = toC(view, p.x, p.y);
    if (out) flyTo({ cx: view.cx, cy: view.cy, scale: Math.min(0.05, view.scale * 3) }, 450);
    else flyTo({ cx: c.x, cy: c.y, scale: Math.max(MIN_SCALE, view.scale / 3) }, 550);
    Curio.beep(out ? 330 : 520, 0.06, 'sine', 0.05);
  }
  Curio.drag(cv, {
    start: (p) => {
      if (p.pointerType === 'touch') return;
      intro.classList.add('is-faded');
      stopAuto(); fly = null;
      mdrag = { x0: p.x, y0: p.y, v0: { ...view }, moved: false, shift: p.event.shiftKey };
    },
    move: (p) => {
      if (!mdrag) return;
      if (orbitOn) { orbitAt = { x: p.x, y: p.y }; drawOrbit(); return; }
      const dx = p.x - mdrag.x0, dy = p.y - mdrag.y0;
      if (!mdrag.moved && Math.hypot(dx, dy) > 6) { mdrag.moved = true; cv.classList.add('is-grab'); }
      if (mdrag.moved) { view.cx = mdrag.v0.cx - dx * view.scale; view.cy = mdrag.v0.cy + dy * view.scale; requestJob(); paintInfo(); }
      if (picking) pvWant = toC(view, p.x, p.y);
    },
    end: (p) => {
      if (!mdrag) return;
      const m = mdrag; mdrag = null;
      cv.classList.remove('is-grab');
      if (!m.moved && p) clickAt({ x: p.x, y: p.y }, m.shift);
    }
  });
  cv.addEventListener('contextmenu', (e) => { const p = posOf(e); clickAt(p, true); });
  cv.addEventListener('pointerup', endPointer);
  cv.addEventListener('pointercancel', endPointer);
  cv.addEventListener('wheel', (e) => {
    e.preventDefault();
    stopAuto(); fly = null;
    intro.classList.add('is-faded');
    const p = posOf(e);
    const mult = e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? 400 : 1;
    const dy = e.deltaY * mult, dx = e.deltaX * mult;
    const mouseWheel = e.deltaMode !== 0 || (dx === 0 && Math.abs(dy) >= 40 && Number.isInteger(dy));
    if (e.ctrlKey || mouseWheel) zoomAt(p.x, p.y, Math.exp(Math.max(-1, Math.min(1, dy * (e.ctrlKey ? 0.01 : 0.0018)))));
    else { view.cx += dx * view.scale; view.cy -= dy * view.scale; requestJob(); paintInfo(); }
  }, { passive: false });

  function startAuto() {
    const pool = kind === 'mandel' ? DEEP : PLACES[kind].map((p) => ({ cx: p.cx, cy: p.cy, min: 1e-11 }));
    const target = Curio.pick(pool.filter((d) => !auto || d !== auto.target));
    if (mode === 'julia') leaveJulia(true);
    auto = { target, phase: 'fly' };
    $('bAuto').setAttribute('aria-pressed', 'true');
    flyTo({ cx: target.cx, cy: target.cy, scale: 2.4 / Math.min(W, H) }, 1500);
    fly.done = () => { if (auto) auto.phase = 'dive'; };
    intro.classList.add('is-faded');
  }
  function stopAuto() {
    if (!auto) return;
    auto = null; fly = null;
    $('bAuto').setAttribute('aria-pressed', 'false');
  }
  $('bAuto').addEventListener('click', () => { if (auto) stopAuto(); else { startAuto(); Curio.toast('Diving… press again to stop', 1800); } });

  $('bIn').addEventListener('click', () => { stopAuto(); flyTo({ cx: view.cx, cy: view.cy, scale: Math.max(MIN_SCALE, view.scale / 2.5) }, 450); intro.classList.add('is-faded'); });
  $('bOut').addEventListener('click', () => { stopAuto(); flyTo({ cx: view.cx, cy: view.cy, scale: Math.min(0.05, view.scale * 2.5) }, 450); });
  $('bHome').addEventListener('click', () => {
    stopAuto();
    const home = mode === 'julia' ? { cx: 0, cy: 0, scale: Math.max(3.4 / W, 3.0 / H) } : homeOf(kind);
    flyTo(home, 1200); clampScale.warned = false;
  });
  function togglePanel(force) {
    const p = $('panel'); p.hidden = force === undefined ? !p.hidden : !force;
    $('bPanel').setAttribute('aria-pressed', String(!p.hidden));
  }
  $('bPanel').addEventListener('click', () => togglePanel());
  $('bCycle').addEventListener('click', () => { cycling = !cycling; $('bCycle').setAttribute('aria-pressed', String(cycling)); });
  $('bSave').addEventListener('click', () => {
    render();
    cv.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = `fractal-${fmtZoom(zoomOf(view)).replace(/[^0-9a-z.]+/gi, '')}.png`;
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      Curio.toast('Saved your fractal 🖼️');
    });
  });
  const den = $('den'), det = $('det');
  den.value = Curio.store.get('mb:den', 0.2);
  const applyDen = () => { density = parseFloat(den.value); $('oDen').textContent = density.toFixed(2); if (vals && jobDone) recolourAll(); else if (vals) requestJob(); };
  den.addEventListener('input', applyDen);
  den.addEventListener('change', () => Curio.store.set('mb:den', density));
  const applyDet = () => { detail = parseFloat(det.value); $('oDet').textContent = detail.toFixed(2) + '×'; };
  det.addEventListener('input', applyDet);
  det.addEventListener('change', () => { if (vals) requestJob(); });

  addEventListener('keydown', (e) => {
    if (e.target.closest?.('input, button')) return;
    const k = e.key, step = 80;
    if (k === '+' || k === '=') $('bIn').click();
    else if (k === '-' || k === '_') $('bOut').click();
    else if (k === 'ArrowLeft') { view.cx -= step * view.scale; requestJob(); }
    else if (k === 'ArrowRight') { view.cx += step * view.scale; requestJob(); }
    else if (k === 'ArrowUp') { view.cy += step * view.scale; requestJob(); e.preventDefault(); }
    else if (k === 'ArrowDown') { view.cy -= step * view.scale; requestJob(); e.preventDefault(); }
    else if (k === 'r' || k === 'R') $('bHome').click();
    else if (k === 'j' || k === 'J') $('bJulia').click();
    else if (k === 'a' || k === 'A') $('bAuto').click();
    else if (k === 'f' || k === 'F') $('bKind').click();
    else if (k === 'o' || k === 'O') setOrbit(!orbitOn);
    else if (k === 'g' || k === 'G') saveGallery();
    else return;
    paintInfo();
  });

  let raf = 0, last = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    if (fly) stepFly(now);
    if (auto && auto.phase === 'dive') {
      view.scale *= Math.exp(-dt * 0.75);
      view.cx += (auto.target.cx - view.cx) * Math.min(1, dt * 3);
      view.cy += (auto.target.cy - view.cy) * Math.min(1, dt * 3);
      requestJob(); paintInfo();
      if (view.scale < auto.target.min) {
        Curio.toast(`Reached ${fmtZoom(zoomOf(view))}. Heading somewhere new…`, 2200);
        startAuto();
      }
    }
    if (cycling) { offset = (offset + dt * 0.06) % 1; if (jobDone) recolourAll(); }
    if (wantJob) {
      const k = imgView ? Math.max(imgView.scale / view.scale, view.scale / imgView.scale) : 99;
      if (jobDone || now - jobStart > (fly || auto ? 160 : 90) || k > 2.2) startJob();
    }
    if (pvWant && picking) { drawPreview(pvWant); pvWant = null; }
    if (dirty || fly || auto) { render(); if (orbitOn && orbitAt) drawOrbit(); }
  }
  const start = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  let rzT = 0;
  addEventListener('resize', () => { clearTimeout(rzT); rzT = setTimeout(resize, 120); });

  $('kinds').innerHTML = Object.entries(KINDS).map(([k, v]) => `<button type="button" data-k="${k}"><b>${v.name}</b><small>${v.f}</small></button>`).join('');
  $('kinds').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { setKind(b.dataset.k); intro.classList.add('is-faded'); } });
  $('bKind').addEventListener('click', () => { const ks = Object.keys(KINDS); setKind(ks[(ks.indexOf(kind) + 1) % ks.length]); intro.classList.add('is-faded'); });
  $('bOrbit').addEventListener('click', () => setOrbit(!orbitOn));
  $('bGal').addEventListener('click', saveGallery);
  renderGallery();
  renderBadges();
  if (!Curio.store.get('mb:padtip', false)) { Curio.store.set('mb:padtip', true); setTimeout(() => Curio.toast('Tip: two-finger scroll pans, pinch zooms. Touchpad mode in the top bar makes dragging easy too.', 4200), 2500); }
  seenKinds.add(kind); Curio.store.set('mb:seen', [...seenKinds]);
  renderPlaces();
  const savedPal = Curio.store.get('mb:pal', 0);
  setPalette(PALETTES[savedPal] ? savedPal : 0);
  applyDen(); applyDet();
  resize();
  start();
})();
