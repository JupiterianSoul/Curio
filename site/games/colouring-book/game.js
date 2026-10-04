(() => {
  const N = 1000;
  const LINE_T = 110;
  const CLASSIC = [
    '#ffffff', '#e0e0e0', '#9e9e9e', '#616161', '#212121', '#ffdbac', '#e0ac69', '#8d5524',
    '#ffcdd2', '#ef5350', '#d32f2f', '#8e1b1b', '#f8bbd0', '#f06292', '#d81b60', '#880e4f',
    '#ffe0b2', '#ffb74d', '#fb8c00', '#e65100', '#fff9c4', '#fff176', '#fdd835', '#f9a825',
    '#dcedc8', '#9ccc65', '#43a047', '#1b5e20', '#b2dfdb', '#4db6ac', '#00897b', '#004d40',
    '#b3e5fc', '#4fc3f7', '#1e88e5', '#0d47a1', '#c5cae9', '#7986cb', '#3949ab', '#1a237e',
    '#e1bee7', '#ba68c8', '#8e24aa', '#4a148c', '#d7ccc8', '#a1887f', '#6d4c41', '#3e2723'
  ];
  const PAGES = window.COLOUR_PAGES;
  const $ = (id) => document.getElementById(id);
  const view = $('view'), art = $('art'), paintCv = $('paint'), linesCv = $('lines');
  paintCv.width = paintCv.height = N; linesCv.width = linesCv.height = N;
  const pc = paintCv.getContext('2d', { willReadFrequently: true });
  const lc = linesCv.getContext('2d', { willReadFrequently: true });

  let pageIdx = Math.max(0, PAGES.findIndex((p) => p.id === Curio.store.get('cb-page', 'mandala')));
  let tool = 'fill', style = Curio.store.get('cb-style', 'solid');
  let colour = Curio.store.get('cb-colour', '#ff7043');
  let size = Curio.store.get('cb-size', 14);
  let lineA = null, nonLine = 1;
  let undo = [];
  let z = 1, tx = 0, ty = 0;
  let ready = false;
  let progress = Curio.store.get('cb-progress', {});
  if (!progress || typeof progress !== 'object') progress = {};

  const hexToRgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const lum = (c) => (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
  const toHex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

  function linesOf(p) { return p.fn().map((x) => (typeof x === 'string' ? { d: x, w: 7 } : x)); }

  function drawLines() {
    lc.clearRect(0, 0, N, N);
    lc.lineCap = 'round'; lc.lineJoin = 'round'; lc.strokeStyle = '#1f1d1b';
    for (const o of linesOf(PAGES[pageIdx])) { lc.lineWidth = o.w; lc.stroke(new Path2D(o.d)); }
    const d = lc.getImageData(0, 0, N, N).data;
    lineA = new Uint8Array(N * N);
    nonLine = 0;
    for (let i = 0; i < N * N; i++) { lineA[i] = d[i * 4 + 3]; if (lineA[i] < LINE_T) nonLine++; }
  }

  function setBusy(on, text) { const b = $('busy'); if (text) b.textContent = text; b.classList.toggle('is-on', on); }

  function loadPage(i) {
    pageIdx = (i + PAGES.length) % PAGES.length;
    const p = PAGES[pageIdx];
    Curio.store.set('cb-page', p.id);
    $('pEmoji').textContent = p.emoji; $('pName').textContent = p.name;
    ready = false; setBusy(true, 'Loading page...');
    undo = []; syncUndo();
    resetView();
    requestAnimationFrame(() => {
      drawLines();
      pc.globalCompositeOperation = 'source-over';
      pc.fillStyle = '#fff'; pc.fillRect(0, 0, N, N);
      let src = null;
      try { src = localStorage.getItem(`curio:cb-img:${p.id}`); } catch {}
      const done = () => { ready = true; setBusy(false); updatePct(false); paintPages(); };
      if (src) {
        const im = new Image();
        im.onload = () => { pc.drawImage(im, 0, 0, N, N); done(); };
        im.onerror = done;
        im.src = src;
      } else done();
    });
  }

  let saveT = 0, warned = false;
  function scheduleSave() {
    clearTimeout(saveT);
    saveT = setTimeout(saveNow, 700);
  }
  function saveNow() {
    const p = PAGES[pageIdx];
    const pct = updatePct(true);
    try {
      if (pct === 0) localStorage.removeItem(`curio:cb-img:${p.id}`);
      else localStorage.setItem(`curio:cb-img:${p.id}`, paintCv.toDataURL('image/png'));
    } catch {
      if (!warned) { warned = true; Curio.toast('Storage is full, so this page could not be saved'); }
    }
    paintPages();
  }
  function updatePct(store) {
    const d = pc.getImageData(0, 0, N, N).data;
    let c = 0;
    for (let i = 0; i < N * N; i++) {
      if (lineA[i] >= LINE_T) continue;
      const k = i * 4;
      if (d[k] < 250 || d[k + 1] < 250 || d[k + 2] < 250) c++;
    }
    const pct = Math.round((c / nonLine) * 100);
    $('pPct').textContent = pct + '%';
    const prev = progress[PAGES[pageIdx].id] || 0;
    if (store) {
      progress[PAGES[pageIdx].id] = pct;
      Curio.store.set('cb-progress', progress);
      if (prev < 95 && pct >= 95) { Curio.confetti(); Curio.toast('Page complete! Gorgeous.'); }
    }
    return pct;
  }

  function pushUndo(x, y, w, h, data) {
    undo.push({ x, y, w, h, data });
    if (undo.length > 40) undo.shift();
    syncUndo();
  }
  function syncUndo() { $('undo').disabled = !undo.length; }
  function doUndo() {
    const u = undo.pop();
    if (!u) return;
    pc.putImageData(new ImageData(u.data, u.w, u.h), u.x, u.y);
    syncUndo(); scheduleSave();
    Curio.beep(330, .05, 'triangle', .07);
  }

  function crop(img, x, y, w, h) {
    const out = new Uint8ClampedArray(w * h * 4);
    for (let r = 0; r < h; r++) out.set(img.data.subarray(((y + r) * N + x) * 4, ((y + r) * N + x + w) * 4), r * w * 4);
    return out;
  }

  function fillAt(px, py, opt = {}) {
    let sx = Math.floor(px), sy = Math.floor(py);
    if (sx < 0 || sy < 0 || sx >= N || sy >= N) return;
    if (lineA[sy * N + sx] >= LINE_T) {
      let best = null;
      for (let r = 1; r <= 8 && !best; r++) for (let dy = -r; dy <= r && !best; dy++) for (let dx = -r; dx <= r; dx++) {
        const x = sx + dx, y = sy + dy;
        if (x >= 0 && y >= 0 && x < N && y < N && lineA[y * N + x] < LINE_T) { best = [x, y]; break; }
      }
      if (!best) return;
      [sx, sy] = best;
    }
    const img = pc.getImageData(0, 0, N, N);
    const d = img.data;
    const i0 = (sy * N + sx) * 4;
    const r0 = d[i0], g0 = d[i0 + 1], b0 = d[i0 + 2];
    const tv = opt.tol != null ? opt.tol : +$('tol').value;
    const t2 = tv >= 100 ? Infinity : Math.pow(tv * 2.6, 2);
    const mark = new Uint8Array(N * N);
    const ok = (x, y) => {
      const i = y * N + x;
      if (mark[i] || lineA[i] >= LINE_T) return false;
      const k = i * 4, dr = d[k] - r0, dg = d[k + 1] - g0, db = d[k + 2] - b0;
      return dr * dr + dg * dg + db * db <= t2;
    };
    let minX = sx, maxX = sx, minY = sy, maxY = sy, count = 0;
    const stack = [sx, sy];
    while (stack.length) {
      const y = stack.pop(), x = stack.pop();
      if (!ok(x, y)) continue;
      let xl = x, xr = x;
      while (xl > 0 && ok(xl - 1, y)) xl--;
      while (xr < N - 1 && ok(xr + 1, y)) xr++;
      for (let i = xl; i <= xr; i++) mark[y * N + i] = 1;
      count += xr - xl + 1;
      if (xl < minX) minX = xl; if (xr > maxX) maxX = xr; if (y < minY) minY = y; if (y > maxY) maxY = y;
      for (const ny of [y - 1, y + 1]) {
        if (ny < 0 || ny >= N) continue;
        for (let i = xl; i <= xr; i++) if (ok(i, ny) && (i === xl || !ok(i - 1, ny))) stack.push(i, ny);
      }
    }
    if (!count) return;
    const bx = Math.max(0, minX - 4), by = Math.max(0, minY - 4), bx2 = Math.min(N - 1, maxX + 4), by2 = Math.min(N - 1, maxY + 4);
    for (let pass = 0; pass < 3; pass++) {
      const add = [];
      for (let y = by; y <= by2; y++) for (let x = bx; x <= bx2; x++) {
        const i = y * N + x;
        if (mark[i] || !lineA[i]) continue;
        if ((x > 0 && mark[i - 1] === 1) || (x < N - 1 && mark[i + 1] === 1) || (y > 0 && mark[i - N] === 1) || (y < N - 1 && mark[i + N] === 1)) add.push(i);
      }
      for (const i of add) mark[i] = 1;
    }
    const w = bx2 - bx + 1, h = by2 - by + 1;
    const before = crop(img, bx, by, w, h);
    const base = hexToRgb(opt.colour || colour);
    const fstyle = opt.style || style;
    const light = mix(base, [255, 255, 255], .62);
    const dark = mix(base, [0, 0, 0], .28);
    const alt = lum(base) > .85 ? mix(base, [120, 120, 120], .35) : light;
    const spanY = Math.max(1, maxY - minY), spanX = Math.max(1, maxX - minX);
    let changed = false;
    for (let y = by; y <= by2; y++) for (let x = bx; x <= bx2; x++) {
      const i = y * N + x;
      if (!mark[i]) continue;
      let c = base;
      if (fstyle === 'gradient') { const t = Math.min(1, Math.max(0, (y - minY) / spanY * .8 + (x - minX) / spanX * .2)); c = mix(base, alt, t); }
      else if (fstyle === 'rainbow') { const hh = ((x - minX) / spanX * 300 + (y - minY) / spanY * 60) % 360; c = hsl2rgb(hh, .75, .62); }
      else if (fstyle === 'glitter') { const hsh = ((x * 73856093) ^ (y * 19349663)) >>> 0; c = hsh % 23 === 0 ? [255, 255, 255] : hsh % 7 === 0 ? light : base; }
      else if (fstyle === 'stripes') c = (((x + y) / 16) | 0) % 2 ? alt : base;
      else if (fstyle === 'checks') c = ((((x / 26) | 0) + ((y / 26) | 0)) % 2) ? alt : base;
      else if (fstyle === 'dots') { const gx = ((x + ((y / 28 | 0) % 2) * 14) % 28) - 14, gy = (y % 28) - 14; c = gx * gx + gy * gy < 49 ? dark : alt; }
      const k = i * 4;
      if (d[k] !== (c[0] | 0) || d[k + 1] !== (c[1] | 0) || d[k + 2] !== (c[2] | 0)) changed = true;
      d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = 255;
    }
    if (!changed) return false;
    pc.putImageData(img, 0, 0, bx, by, w, h);
    if (opt.silent) return true;
    pushUndo(bx, by, w, h, before);
    scheduleSave();
    Curio.beep(380 + Math.random() * 260, .07, 'triangle', .07);
    popAt(px, py, opt.colour);
    stats.fills++; usedStyles(fstyle);
    if (stats.fills >= 100) badge('fills100');
    return true;
  }

  function hsl2rgb(h, s2, l) { const f2 = (n) => { const k = (n + h / 30) % 12, a = s2 * Math.min(l, 1 - l); return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))); }; return [f2(0), f2(8), f2(4)]; }
  function popAt(px, py, col) {
    const s = view.clientWidth / N;
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;left:${px * s * z + tx - 14}px;top:${py * s * z + ty - 14}px;width:28px;height:28px;border-radius:50%;border:3px solid ${col || colour};pointer-events:none;transition:transform .35s ease-out,opacity .35s ease-out;`;
    view.append(el);
    requestAnimationFrame(() => { el.style.transform = 'scale(2.2)'; el.style.opacity = '0'; });
    setTimeout(() => el.remove(), 400);
  }

  function pick(px, py) {
    const x = Math.floor(px), y = Math.floor(py);
    if (x < 0 || y < 0 || x >= N || y >= N) return;
    const d = pc.getImageData(x, y, 1, 1).data;
    setColour(toHex([d[0], d[1], d[2]]));
    setTool('fill');
    Curio.beep(880, .05, 'sine', .07);
  }

  let stroke = null;
  function brushStart(p) {
    stroke = { before: pc.getImageData(0, 0, N, N), pts: [p], minX: p.x, maxX: p.x, minY: p.y, maxY: p.y };
    pc.lineCap = 'round'; pc.lineJoin = 'round';
    pc.strokeStyle = tool === 'eraser' ? '#ffffff' : colour;
    pc.fillStyle = pc.strokeStyle;
    pc.lineWidth = size;
    pc.beginPath(); pc.arc(p.x, p.y, size / 2, 0, Math.PI * 2); pc.fill();
  }
  function brushMove(p) {
    const s = stroke, pts = s.pts, l = pts[pts.length - 1];
    if (Math.hypot(p.x - l.x, p.y - l.y) < 1) return;
    pts.push(p);
    s.minX = Math.min(s.minX, p.x); s.maxX = Math.max(s.maxX, p.x); s.minY = Math.min(s.minY, p.y); s.maxY = Math.max(s.maxY, p.y);
    const n = pts.length;
    pc.beginPath();
    if (n === 2) { pc.moveTo(pts[0].x, pts[0].y); pc.lineTo((pts[0].x + p.x) / 2, (pts[0].y + p.y) / 2); }
    else {
      const a = pts[n - 3], b = pts[n - 2];
      pc.moveTo((a.x + b.x) / 2, (a.y + b.y) / 2);
      pc.quadraticCurveTo(b.x, b.y, (b.x + p.x) / 2, (b.y + p.y) / 2);
    }
    pc.stroke();
  }
  function brushEnd(cancel) {
    const s = stroke; stroke = null;
    if (!s) return;
    const l = s.pts[s.pts.length - 1];
    if (!cancel && s.pts.length > 1) { const b = s.pts[s.pts.length - 2]; pc.beginPath(); pc.moveTo((b.x + l.x) / 2, (b.y + l.y) / 2); pc.lineTo(l.x, l.y); pc.stroke(); }
    const pad = Math.ceil(size / 2) + 3;
    const x = Math.max(0, Math.floor(s.minX - pad)), y = Math.max(0, Math.floor(s.minY - pad));
    const w = Math.min(N, Math.ceil(s.maxX + pad)) - x, h = Math.min(N, Math.ceil(s.maxY + pad)) - y;
    if (w <= 0 || h <= 0) return;
    const before = crop(s.before, x, y, w, h);
    if (cancel) { pc.putImageData(new ImageData(before, w, h), x, y); return; }
    pushUndo(x, y, w, h, before);
    scheduleSave();
  }

  function viewSize() { return view.clientWidth; }
  function applyView() {
    const vs = viewSize();
    const minT = vs - vs * z;
    tx = Math.min(0, Math.max(minT, tx)); ty = Math.min(0, Math.max(minT, ty));
    art.style.transform = `translate(${tx}px, ${ty}px) scale(${z})`;
    $('zLbl').textContent = Math.round(z * 100) + '%';
  }
  function zoomAt(nz, cx, cy) {
    nz = Math.max(1, Math.min(8, nz));
    const ax = (cx - tx) / z, ay = (cy - ty) / z;
    z = nz; tx = cx - ax * z; ty = cy - ay * z;
    applyView();
  }
  function resetView() { z = 1; tx = 0; ty = 0; applyView(); }
  function toPage(e) {
    const b = view.getBoundingClientRect();
    const s = N / viewSize();
    return { x: ((e.clientX - b.left - tx) / z) * s, y: ((e.clientY - b.top - ty) / z) * s };
  }

  const ptrs = new Map();
  let gesture = null, panDrag = null, tap = null, spaceDown = false;
  let latched = false, downAt = null;
  function endLatch() {
    if (!latched) return;
    latched = false; view.classList.remove('is-latched');
    if (stroke) brushEnd(false);
    if (panDrag) { panDrag = null; view.classList.remove('is-panning'); }
    ptrs.clear();
  }
  view.addEventListener('pointerdown', (e) => {
    if (!ready || e.target.closest('.cb-zoom')) return;
    e.preventDefault();
    if (latched) { endLatch(); return; }
    downAt = { x: e.clientX, y: e.clientY };
    view.setPointerCapture?.(e.pointerId);
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const b = view.getBoundingClientRect();
    if (ptrs.size === 2) {
      if (stroke) brushEnd(true);
      tap = null; panDrag = null;
      const [p1, p2] = [...ptrs.values()];
      gesture = { d: Math.hypot(p1.x - p2.x, p1.y - p2.y), z, mx: (p1.x + p2.x) / 2 - b.left, my: (p1.y + p2.y) / 2 - b.top, tx, ty };
      return;
    }
    if (ptrs.size > 2) return;
    if (tool === 'pan' || spaceDown || e.button === 1) { panDrag = { x: e.clientX, y: e.clientY, tx, ty }; view.classList.add('is-panning'); return; }
    const p = toPage(e);
    if (tool === 'brush' || tool === 'eraser') brushStart(p);
    else tap = { x: e.clientX, y: e.clientY, p };
  });
  view.addEventListener('pointermove', (e) => {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (gesture && ptrs.size >= 2) {
      const [p1, p2] = [...ptrs.values()];
      const b = view.getBoundingClientRect();
      const dd = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      const mx2 = (p1.x + p2.x) / 2 - b.left, my2 = (p1.y + p2.y) / 2 - b.top;
      const nz = Math.max(1, Math.min(8, gesture.z * dd / Math.max(10, gesture.d)));
      const ax = (gesture.mx - gesture.tx) / gesture.z, ay = (gesture.my - gesture.ty) / gesture.z;
      z = nz; tx = mx2 - ax * z; ty = my2 - ay * z;
      applyView();
      return;
    }
    if (panDrag) { tx = panDrag.tx + e.clientX - panDrag.x; ty = panDrag.ty + e.clientY - panDrag.y; applyView(); return; }
    if (stroke) {
      const list = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
      for (const ev of (list.length ? list : [e])) brushMove(toPage(ev));
    }
    if (tap && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > 10) tap = null;
  });
  const endPtr = (e) => {
    if (!ptrs.has(e.pointerId) || latched) return;
    if (e.type === 'pointerup' && Curio.touchpad && e.pointerType === 'mouse' && (stroke || panDrag) && downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) < 6) {
      latched = true; view.classList.add('is-latched');
      try { view.releasePointerCapture(e.pointerId); } catch {}
      return;
    }
    ptrs.delete(e.pointerId);
    if (gesture) { if (ptrs.size < 2) gesture = null; if (!ptrs.size) gesture = null; return; }
    if (panDrag) { panDrag = null; view.classList.remove('is-panning'); return; }
    if (stroke) brushEnd(e.type === 'pointercancel');
    if (tap && e.type === 'pointerup') { const t = tap; tap = null; if (tool === 'picker') pick(t.p.x, t.p.y); else fillAt(t.p.x, t.p.y); }
    tap = null;
  };
  view.addEventListener('pointerup', endPtr);
  view.addEventListener('pointercancel', endPtr);
  view.addEventListener('touchstart', (e) => { if (!e.target.closest('.cb-zoom')) e.preventDefault(); }, { passive: false });
  view.addEventListener('wheel', (e) => {
    const b = view.getBoundingClientRect();
    if (e.ctrlKey || e.metaKey) { e.preventDefault(); zoomAt(z * Math.exp(-e.deltaY * .01), e.clientX - b.left, e.clientY - b.top); }
    else if (z > 1) { e.preventDefault(); tx -= e.deltaX; ty -= e.deltaY; applyView(); }
  }, { passive: false });
  view.addEventListener('contextmenu', (e) => e.preventDefault());
  $('zIn').addEventListener('click', () => zoomAt(z * 1.5, viewSize() / 2, viewSize() / 2));
  $('zOut').addEventListener('click', () => zoomAt(z / 1.5, viewSize() / 2, viewSize() / 2));
  $('zFit').addEventListener('click', resetView);

  const toolBtns = [...document.querySelectorAll('[data-tool]')];
  function setTool(t) { tool = t; view.dataset.tool = t; toolBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tool === t))); }
  toolBtns.forEach((b) => b.addEventListener('click', () => setTool(b.dataset.tool)));
  const styleBtns = [...document.querySelectorAll('[data-style]')];
  function setStyle(s) { style = s; Curio.store.set('cb-style', s); styleBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.style === s))); if (tool !== 'fill') setTool('fill'); }
  styleBtns.forEach((b) => b.addEventListener('click', () => setStyle(b.dataset.style)));
  const sizeBtns = [...document.querySelectorAll('[data-size]')];
  function setSize(s) { size = s; Curio.store.set('cb-size', s); sizeBtns.forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.size === s))); }
  sizeBtns.forEach((b) => b.addEventListener('click', () => { setSize(+b.dataset.size); if (tool !== 'eraser') setTool('brush'); }));
  $('tol').value = Curio.store.get('cb-tol2', 65);
  const paintTol = () => { const v = +$('tol').value; $('tolV').textContent = v >= 100 ? 'Any' : v; };
  $('tol').addEventListener('input', paintTol);
  $('tol').addEventListener('change', (e) => Curio.store.set('cb-tol2', +e.target.value));
  paintTol();

  const THEMES = {
    classic: ['Classic', CLASSIC],
    pastel: ['Pastel', ['#ffffff', '#fde2e4', '#fad2e1', '#e2ece9', '#bee1e6', '#f0efeb', '#dfe7fd', '#cddafd', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#a0c4ff', '#bdb2ff', '#ffc6ff', '#fffffc', '#f1c0e8', '#cfbaf0', '#a3c4f3', '#90dbf4', '#8eecf5', '#98f5e1', '#b9fbc0', '#fbf8cc']],
    neon: ['Neon', ['#0d0221', '#261447', '#ff3864', '#2de2e6', '#f6019d', '#fff700', '#00ff9c', '#00b8ff', '#d600ff', '#ff6c11', '#39ff14', '#ff073a', '#fe53bb', '#08f7fe', '#09fbd3', '#f5d300', '#ffffff', '#7b2cbf', '#ff9e00', '#00f5d4', '#9b5de5', '#f15bb5', '#fee440', '#00bbf9']],
    earth: ['Earthy', ['#3d2b1f', '#5c3a26', '#8b5a2b', '#a0522d', '#c68642', '#d9a066', '#e9c46a', '#f4e1c1', '#606c38', '#283618', '#a3a86b', '#dda15e', '#bc6c25', '#fefae0', '#6b705c', '#a5a58d', '#b7b7a4', '#cb997e', '#ddbea9', '#ffe8d6', '#3f4238', '#7f5539', '#9c6644', '#b08968']],
    ocean: ['Ocean', ['#03045e', '#023e8a', '#0077b6', '#0096c7', '#00b4d8', '#48cae4', '#90e0ef', '#ade8f4', '#caf0f8', '#ffffff', '#2a9d8f', '#264653', '#e9c46a', '#f4a261', '#e76f51', '#ff8fab', '#80ffdb', '#72efdd', '#64dfdf', '#56cfe1', '#5390d9', '#5e60ce', '#6930c3', '#fefae0']],
    sunset: ['Sunset', ['#2b1d3a', '#7a2e5b', '#e0566a', '#f79d65', '#ffe3a3', '#ffcb77', '#fe6d73', '#ff9f1c', '#ffbf69', '#cbf3f0', '#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93', '#f72585', '#b5179e', '#7209b7', '#560bad', '#480ca8', '#f3722c', '#f8961e', '#f9c74f', '#ffffff']]
  };
  let theme = Curio.store.get('cb-theme', 'classic');
  if (!THEMES[theme]) theme = 'classic';
  let PAL = THEMES[theme][1];
  const pal = $('pal');
  function buildPal() {
  pal.innerHTML = '';
  for (const c of PAL) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'cb-sw'; b.style.background = c; b.dataset.c = c;
    b.setAttribute('aria-label', `Colour ${c}`);
    b.addEventListener('click', () => { setColour(c); if (tool === 'eraser' || tool === 'picker' || tool === 'pan') setTool('fill'); Curio.beep(500 + PAL.indexOf(c) * 12, .03, 'sine', .05); });
    pal.append(b);
  }
  pal.querySelectorAll('.cb-sw').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.c === colour)));
  }
  buildPal();
  function setColour(c) {
    colour = c; Curio.store.set('cb-colour', c);
    $('big').style.background = c; $('hex').textContent = c; $('custom').value = c;
    pal.querySelectorAll('.cb-sw').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.c === c)));
  }
  $('custom').addEventListener('input', (e) => setColour(e.target.value));

  $('undo').addEventListener('click', doUndo);
  $('clear').addEventListener('click', async () => {
    const v = await Curio.modal({ emoji: '🧽', title: 'Start this page over?', body: 'All the colour on this page will be wiped. This cannot be undone.', buttons: [{ label: 'Wipe it', value: 'yes' }, { label: 'Keep it', value: 'no' }] });
    if (v !== 'yes') return;
    pc.fillStyle = '#fff'; pc.fillRect(0, 0, N, N);
    undo = []; syncUndo(); saveNow();
  });
  $('png').addEventListener('click', () => {
    const c = document.createElement('canvas');
    c.width = c.height = N;
    const x = c.getContext('2d');
    x.drawImage(paintCv, 0, 0); x.drawImage(linesCv, 0, 0);
    const a = document.createElement('a');
    a.download = `colouring-${PAGES[pageIdx].id}.png`;
    a.href = c.toDataURL('image/png');
    a.click();
    Curio.beep(700, .06, 'triangle', .08);
  });

  function pageSvg(p) {
    return '<svg viewBox="0 0 1000 1000" aria-hidden="true">' + linesOf(p).map((o) => `<path d="${o.d}" fill="none" stroke="#1f1d1b" stroke-width="${o.w * 1.6}" stroke-linecap="round" stroke-linejoin="round"/>`).join('') + '</svg>';
  }
  function buildPages() {
    const wrap = $('pages');
    PAGES.forEach((p, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'cb-page';
      b.setAttribute('aria-label', `Colour the ${p.name} page`);
      b.innerHTML = `<div class="cb-thumb"><img alt="" hidden>${pageSvg(p)}</div><b></b><div class="cb-meter"><i></i></div><em></em>`;
      b.querySelector('b').textContent = `${p.emoji} ${p.name}`;
      b.addEventListener('click', () => {
        if (i === pageIdx) return;
        clearTimeout(saveT);
        if (ready) saveNow();
        loadPage(i);
        view.scrollIntoView({ behavior: 'smooth', block: 'center' });
        Curio.beep(520, .05, 'sine', .07);
      });
      wrap.append(b);
    });
  }
  function paintPages() {
    let started = 0, finished = 0;
    [...$('pages').children].forEach((b, i) => {
      const p = PAGES[i];
      const pct = progress[p.id] || 0;
      if (pct > 0) started++;
      if (pct >= 95) finished++;
      b.setAttribute('aria-current', String(i === pageIdx));
      b.querySelector('.cb-meter i').style.width = pct + '%';
      b.querySelector('em').textContent = pct ? `${pct}% coloured` : 'Blank';
      const img = b.querySelector('img');
      let src = null;
      try { src = localStorage.getItem(`curio:cb-img:${p.id}`); } catch {}
      if (src) { if (img.src !== src) img.src = src; img.hidden = false; } else img.hidden = true;
    });
    $('tally').textContent = `${PAGES.length} pages · ${started} started · ${finished} finished`;
    checkProgressBadges();
  }

  window.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, select')) return;
    if (e.key === 'Escape' && latched) { endLatch(); return; }
    if (document.querySelector('.curio-modal')) return;
    if ((e.key === 'm' || e.key === 'M') && !e.ctrlKey && !e.metaKey) { magic(); return; }
    if (e.key === 'ArrowRight' && !e.ctrlKey) { $('nextPage').click(); return; }
    if (e.key === 'ArrowLeft' && !e.ctrlKey) { $('prevPage').click(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); doUndo(); return; }
    if (e.key === ' ') { if (e.target === document.body || e.target.closest('.cb-view')) e.preventDefault(); spaceDown = true; view.classList.add('is-space'); return; }
    const map = { f: 'fill', b: 'brush', e: 'eraser', i: 'picker', h: 'pan' };
    if (map[e.key.toLowerCase()] && !e.ctrlKey && !e.metaKey) setTool(map[e.key.toLowerCase()]);
    else if (e.key === '+' || e.key === '=') zoomAt(z * 1.4, viewSize() / 2, viewSize() / 2);
    else if (e.key === '-') zoomAt(z / 1.4, viewSize() / 2, viewSize() / 2);
    else if (e.key === '0') resetView();
  });
  window.addEventListener('keyup', (e) => { if (e.key === ' ') { spaceDown = false; view.classList.remove('is-space'); } });
  window.addEventListener('resize', () => { const k = z; resetView(); if (k > 1) zoomAt(k, viewSize() / 2, viewSize() / 2); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && ready) { clearTimeout(saveT); saveNow(); } });
  window.addEventListener('pagehide', () => { if (ready) { clearTimeout(saveT); saveNow(); } });

  const themeSel = $('theme');
  Object.entries(THEMES).forEach(([k, v]) => { const o = document.createElement('option'); o.value = k; o.textContent = v[0]; themeSel.append(o); });
  themeSel.value = theme;
  themeSel.addEventListener('change', () => { theme = themeSel.value; Curio.store.set('cb-theme', theme); PAL = THEMES[theme][1]; buildPal(); Curio.beep(600, .05, 'sine', .05); });

  const CAT = { animals: ['cat', 'ocean', 'dragon', 'butterfly', 'owl', 'turtle', 'snail', 'dino', 'lion', 'whale', 'penguin', 'fox', 'bunny', 'elephant', 'jelly', 'pig', 'monster'], patterns: ['mandala', 'star-mandala', 'quilt', 'hearts', 'lotus', 'hexes', 'snowflakes'], places: ['garden', 'city', 'house', 'space', 'castle', 'forest', 'rainbow', 'balloon', 'sailboat', 'solar', 'lighthouse', 'treehouse', 'volcano', 'desert', 'launch'], things: ['cupcake', 'robot', 'icecream', 'pizza', 'sushi', 'tea', 'guitar', 'bike', 'train', 'fruit', 'carousel'] };
  const catOf = (id) => Object.keys(CAT).find((k) => CAT[k].includes(id)) || 'things';
  const CATL = { all: 'All', animals: 'Animals', patterns: 'Patterns', places: 'Places', things: 'Things' };
  let catF = 'all';
  Object.entries(CATL).forEach(([k, v]) => {
    const b = document.createElement('button'); b.type = 'button'; b.dataset.c = k; b.textContent = v;
    b.addEventListener('click', () => { catF = k; paintCats(); });
    $('cats').append(b);
  });
  function paintCats() {
    $('cats').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.c === catF)));
    [...$('pages').children].forEach((b, i) => { b.hidden = catF !== 'all' && catOf(PAGES[i].id) !== catF; });
  }

  const today = new Date().toISOString().slice(0, 10);
  const dailyIdx = (() => { let h = 11; for (const ch of today) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h % PAGES.length; })();
  function goPage(i) { if (i === pageIdx) return; clearTimeout(saveT); if (ready) saveNow(); loadPage(i); Curio.beep(520, .05, 'sine', .07); }
  $('daily').addEventListener('click', () => { goPage(dailyIdx); badge('daily'); Curio.toast(`Today's page: ${PAGES[dailyIdx].emoji} ${PAGES[dailyIdx].name}`); view.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
  $('nextPage').addEventListener('click', () => goPage((pageIdx + 1) % PAGES.length));
  $('prevPage').addEventListener('click', () => goPage((pageIdx + PAGES.length - 1) % PAGES.length));
  $('rndPage').addEventListener('click', () => { let j; do { j = Curio.randInt(0, PAGES.length - 1); } while (j === pageIdx); goPage(j); });

  let magicking = false;
  async function magic() {
    if (!ready || magicking) return;
    magicking = true; $('magic').disabled = true;
    const before = pc.getImageData(0, 0, N, N);
    pushUndo(0, 0, N, N, before.data.slice());
    const cols = Curio.shuffle(PAL.filter((c) => { const v = hexToRgb(c); return lum(v) < .97 && lum(v) > .08; }));
    const d = before.data;
    const seeds = [];
    for (let y = 6; y < N; y += 9) for (let x = 6; x < N; x += 9) { const i = y * N + x; if (lineA[i] < LINE_T && d[i * 4] > 250 && d[i * 4 + 1] > 250 && d[i * 4 + 2] > 250) seeds.push([x, y]); }
    let k = 0, filled = 0, t0 = performance.now();
    const styles = ['solid', 'solid', 'solid', 'gradient'];
    for (const [x, y] of seeds) {
      const px = pc.getImageData(x, y, 1, 1).data;
      if (px[0] < 250 || px[1] < 250 || px[2] < 250) continue;
      if (fillAt(x, y, { colour: cols[k++ % cols.length], tol: 8, silent: true, style: Curio.pick(styles) })) {
        filled++;
        if (filled % 6 === 0) Curio.beep(300 + (filled % 24) * 30, .03, 'triangle', .03);
      }
      if (performance.now() - t0 > 30) { await new Promise((r) => requestAnimationFrame(r)); t0 = performance.now(); }
    }
    magicking = false; $('magic').disabled = false;
    scheduleSave();
    Curio.toast(`🪄 ${filled} areas coloured. Undo if you hate it.`);
    stats.magic++; saveStats(); badge('magic');
  }
  $('magic').addEventListener('click', magic);

  const stats = Object.assign({ v: 1, fills: 0, magic: 0, styles: [] }, Curio.store.get('cb-stats', {}) || {});
  if (!Array.isArray(stats.styles)) stats.styles = [];
  let badges = Curio.store.get('cb-badges', []) || [];
  function saveStats() { Curio.store.set('cb-stats', stats); }
  function usedStyles(st) { if (!stats.styles.includes(st)) { stats.styles.push(st); if (stats.styles.length >= 7) badge('styles'); } saveStats(); }
  const BADGES = [
    { id: 'first', icon: '🖍️', name: 'First splash', d: 'Colour your first page' },
    { id: 'done1', icon: '🖼️', name: 'Finished piece', d: 'Complete a page' },
    { id: 'done10', icon: '📚', name: 'Bookworm', d: 'Complete 10 pages' },
    { id: 'done50', icon: '🏆', name: 'Cover to cover', d: 'Complete every page' },
    { id: 'started25', icon: '🌈', name: 'Explorer', d: 'Start 25 pages' },
    { id: 'fills100', icon: '🪣', name: 'Bucket brigade', d: 'Make 100 fills' },
    { id: 'styles', icon: '✨', name: 'Stylist', d: 'Use all seven fill styles' },
    { id: 'magic', icon: '🪄', name: 'Wizard', d: 'Use Magic colour' },
    { id: 'daily', icon: '📅', name: 'Daily doodler', d: "Open today's page" }
  ];
  function badge(id) {
    if (badges.includes(id)) return;
    badges.push(id); Curio.store.set('cb-badges', badges);
    const b = BADGES.find((x) => x.id === id);
    if (b) setTimeout(() => { Curio.toast(`${b.icon} Badge: ${b.name}`, 2400); [784, 988, 1318].forEach((f2, i) => setTimeout(() => Curio.beep(f2, .1, 'triangle', .06), i * 80)); }, 400);
    renderBadges();
  }
  function renderBadges() {
    const el = $('badges'); el.innerHTML = '';
    BADGES.forEach((b) => {
      const d = document.createElement('div'); d.className = 'cb-badge' + (badges.includes(b.id) ? ' got' : '');
      d.innerHTML = `<i aria-hidden="true">${b.icon}</i><div><b></b><span></span></div>`;
      d.querySelector('b').textContent = b.name; d.querySelector('span').textContent = b.d;
      el.append(d);
    });
    const vals = Object.values(progress);
    $('stats2').innerHTML = [[vals.filter((v) => v > 0).length, 'Pages started'], [vals.filter((v) => v >= 95).length, 'Pages finished'], [stats.fills, 'Fills'], [stats.magic, 'Magic spells'], [`${badges.length}/${BADGES.length}`, 'Badges']]
      .map(([v, l]) => `<div class="c-stat"><b>${v}</b><span>${l}</span></div>`).join('');
  }
  function checkProgressBadges() {
    const vals = Object.values(progress);
    if (vals.some((v) => v > 0)) badge('first');
    const done = vals.filter((v) => v >= 95).length;
    if (done >= 1) badge('done1');
    if (done >= 10) badge('done10');
    if (done >= PAGES.length) badge('done50');
    if (vals.filter((v) => v > 0).length >= 25) badge('started25');
    renderBadges();
  }
  if (matchMedia('(pointer: fine)').matches && !Curio.touchpad && !Curio.store.get('cb-tp-tip', false)) { Curio.store.set('cb-tp-tip', true); setTimeout(() => Curio.toast('Tip: on a touchpad, turn on Touchpad mode in the top bar', 4000), 1200); }

  setTool('fill'); setStyle(style); setSize(size); setColour(colour);
  buildPages();
  paintCats();
  renderBadges();
  loadPage(pageIdx);
  window.__colour = {
    get ready() { return ready; },
    fillAt, setColour, setStyle, setTool, loadPage,
    pixel(x, y) { return [...pc.getImageData(x, y, 1, 1).data]; },
    pct() { return updatePct(false); },
    get undoCount() { return undo.length; }, doUndo
  };
})();
