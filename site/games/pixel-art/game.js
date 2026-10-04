(() => {
  const D = window.PIXEL_DATA;
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const SIZES = [8, 16, 24, 32, 48, 64];
  const MAX_LAYERS = 6, MAX_FRAMES = 24;
  const TOOLS = [
    { id: 'pencil', icon: '✏️', name: 'Pencil', key: 'b' },
    { id: 'eraser', icon: '🧽', name: 'Eraser', key: 'e' },
    { id: 'fill', icon: '🪣', name: 'Fill', key: 'g' },
    { id: 'replace', icon: '🔁', name: 'Replace color', key: 'a' },
    { id: 'picker', icon: '💧', name: 'Eyedropper', key: 'i' },
    { id: 'line', icon: '📏', name: 'Line', key: 'l' },
    { id: 'rect', icon: '⬜', name: 'Rectangle', key: 'r' },
    { id: 'ellipse', icon: '⭕', name: 'Ellipse', key: 'o' },
    { id: 'dither', icon: '▦', name: 'Dither brush', key: 'd' },
    { id: 'spray', icon: '💨', name: 'Spray', key: 's' },
    { id: 'shade', icon: '🌓', name: 'Shade', key: 'h' },
    { id: 'move', icon: '✋', name: 'Move layer', key: 'v' }
  ];

  const hexU = (h) => { const n = parseInt(h.slice(1), 16); return ((255 << 24) | ((n & 255) << 16) | (((n >> 8) & 255) << 8) | (n >> 16)) >>> 0; };
  const uHex = (u) => '#' + [u & 255, (u >>> 8) & 255, (u >>> 16) & 255].map((v) => v.toString(16).padStart(2, '0')).join('');
  function shadeU(u, dir) {
    if (!u) return 0;
    let r = u & 255, g = (u >>> 8) & 255, b = (u >>> 16) & 255;
    const k = dir > 0 ? 0.16 : -0.16;
    if (k > 0) { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; } else { r *= 1 + k; g *= 1 + k; b *= 1 + k; }
    return ((255 << 24) | (Math.round(b) << 16) | (Math.round(g) << 8) | Math.round(r)) >>> 0;
  }

  const META = 'pixel-art:meta';
  const meta = (() => {
    const base = { v: 2, ach: {}, stats: { pixels: 0, exports: 0, saves: 0 }, tools: {}, palettes: {}, palette: 'curio', recent: [], tphint: false };
    const s = Curio.store.get(META, null);
    if (!s || s.v !== 2) return base;
    return { ...base, ...s, stats: { ...base.stats, ...(s.stats || {}) }, tools: s.tools || {}, palettes: s.palettes || {}, ach: s.ach || {}, recent: Array.isArray(s.recent) ? s.recent : [] };
  })();
  let metaT = 0;
  const persistMeta = () => { clearTimeout(metaT); metaT = setTimeout(() => Curio.store.set(META, meta), 400); };

  let N = 32, layers = [], frameCount = 1, cf = 0, cl = 0, fps = 8, color = '#ff5a36', tool = 'pencil';
  let size = 1, filled = false, mirrorX = false, mirrorY = false, shadeDir = 1, showGrid = true, onion = false, projName = 'Untitled';
  const blank = () => new Uint32Array(N * N);
  function newProject(n, name = 'Untitled') {
    N = n; frameCount = 1; cf = 0; cl = 0; projName = name;
    layers = [{ name: 'Layer 1', vis: true, op: 1, frames: [blank()] }];
  }

  function encode() {
    const cols = [], idx = new Map();
    const enc = (buf) => {
      const out = []; let prev = null, run = 0;
      const flush = () => { if (prev == null) return; out.push(run > 1 ? `${prev}x${run}` : String(prev)); };
      for (let i = 0; i < buf.length; i++) {
        const u = buf[i]; let k = '-';
        if (u) { if (!idx.has(u)) { idx.set(u, cols.length); cols.push(uHex(u)); } k = idx.get(u); }
        if (k === prev) run++; else { flush(); prev = k; run = 1; }
      }
      flush(); return out.join(',');
    };
    const ls = layers.map((L) => ({ name: L.name, vis: L.vis, op: L.op, data: L.frames.map(enc) }));
    return { v: 2, n: N, fps, frames: frameCount, name: projName, cols, layers: ls };
  }
  function decode(p) {
    if (!p || p.v !== 2 || !SIZES.includes(p.n) || !Array.isArray(p.layers) || !p.layers.length) return false;
    const n = p.n, us = (p.cols || []).map(hexU);
    const dec = (s) => {
      const buf = new Uint32Array(n * n); let i = 0;
      for (const tok of String(s).split(',')) {
        if (!tok) continue;
        const [k, c] = tok.split('x'); const cnt = c ? +c : 1, u = k === '-' ? 0 : (us[+k] || 0);
        for (let j = 0; j < cnt && i < buf.length; j++) buf[i++] = u;
      }
      return buf;
    };
    const fc = clamp(+p.frames || 1, 1, MAX_FRAMES);
    N = n; fps = clamp(+p.fps || 8, 1, 24); frameCount = fc; cf = 0; cl = 0; projName = p.name || 'Untitled';
    layers = p.layers.slice(0, MAX_LAYERS).map((L, i) => ({ name: L.name || `Layer ${i + 1}`, vis: L.vis !== false, op: clamp(+L.op || 1, 0.1, 1), frames: Array.from({ length: fc }, (_, f) => (L.data && L.data[f] != null ? dec(L.data[f]) : new Uint32Array(n * n))) }));
    return true;
  }
  let autoT = 0;
  function autosave() { clearTimeout(autoT); autoT = setTimeout(() => Curio.store.set('pixel-art:v2', { ...encode(), color }), 500); }
  function loadInitial() {
    const s = Curio.store.get('pixel-art:v2', null);
    if (s && decode(s)) { if (s.color) color = s.color; return true; }
    const old = Curio.store.get('pixel-art', null);
    if (old && [16, 32, 64].includes(old.n) && Array.isArray(old.px) && old.px.length === old.n * old.n) {
      newProject(old.n); old.px.forEach((c, i) => { if (c) layers[0].frames[0][i] = hexU(c); }); if (old.color) color = old.color; return true;
    }
    newProject(32);
    const heart = ['01100110', '11111111', '11111111', '11111111', '01111110', '00111100', '00011000'];
    const ox = (N - 8) >> 1, oy = (N - 7) >> 1;
    heart.forEach((row, y) => [...row].forEach((v, x) => { if (v === '1') layers[0].frames[0][(oy + y) * N + ox + x] = hexU('#ff004d'); }));
    return false;
  }

  const box = $('box'), view = $('view'), art = $('art'), over = $('over');
  const ag = art.getContext('2d'), og = over.getContext('2d');
  let lcan = [];
  const tmp = document.createElement('canvas'), tg = tmp.getContext('2d');
  function bufCanvas(buf, c) {
    c = c || document.createElement('canvas');
    if (c.width !== N) { c.width = N; c.height = N; }
    const x = c.getContext('2d'), id = x.createImageData(N, N);
    new Uint32Array(id.data.buffer).set(buf);
    x.putImageData(id, 0, 0);
    return c;
  }
  function refreshLayer(i) { lcan[i] = bufCanvas(layers[i].frames[cf], lcan[i]); }
  function refreshAll() { lcan.length = layers.length; layers.forEach((_, i) => refreshLayer(i)); }
  function compositeTo(ctx, f, scale = 1, skipHidden = true) {
    ctx.imageSmoothingEnabled = false;
    for (const L of layers) {
      if (skipHidden && !L.vis) continue;
      bufCanvas(L.frames[f], tmp);
      ctx.globalAlpha = L.op;
      ctx.drawImage(tmp, 0, 0, N * scale, N * scale);
    }
    ctx.globalAlpha = 1;
  }
  function paintArt() {
    if (art.width !== N) { art.width = N; art.height = N; }
    ag.clearRect(0, 0, N, N); ag.imageSmoothingEnabled = false;
    if (onion && frameCount > 1) {
      ag.globalAlpha = 0.22; if (cf > 0) { const c = document.createElement('canvas'); c.width = c.height = N; compositeTo(c.getContext('2d'), cf - 1); ag.globalAlpha = 0.25; ag.drawImage(c, 0, 0); }
      if (cf < frameCount - 1) { const c = document.createElement('canvas'); c.width = c.height = N; compositeTo(c.getContext('2d'), cf + 1); ag.globalAlpha = 0.12; ag.drawImage(c, 0, 0); }
      ag.globalAlpha = 1;
    }
    layers.forEach((L, i) => {
      if (!L.vis || !lcan[i]) return;
      if (moveDrag && i === cl) return;
      ag.globalAlpha = L.op; ag.drawImage(lcan[i], 0, 0);
    });
    ag.globalAlpha = 1;
  }

  let S = 512, zoom = 1, panX = 0, panY = 0, odpr = 1;
  function sizeBox() {
    S = box.clientWidth;
    odpr = Math.min(2, devicePixelRatio || 1);
    over.width = over.height = Math.round(S * odpr);
    applyView();
  }
  function clampPan() {
    const span = S * zoom;
    if (zoom <= 1) { panX = (S - span) / 2; panY = (S - span) / 2; return; }
    panX = clamp(panX, S - span - S * 0.25, S * 0.25); panY = clamp(panY, S - span - S * 0.25, S * 0.25);
  }
  function applyView() {
    clampPan();
    view.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
    $('zoomLbl').textContent = `${Math.round(zoom * 100)}%`;
    drawOverlay();
  }
  function zoomAt(z, sx, sy) {
    const nz = clamp(z, 1, 16);
    const wx = (sx - panX) / zoom, wy = (sy - panY) / zoom;
    zoom = nz; panX = sx - wx * zoom; panY = sy - wy * zoom;
    applyView();
  }
  const cellPx = () => S * zoom / N;
  function cellAt(x, y) { const c = cellPx(); return [Math.floor((x - panX) / c), Math.floor((y - panY) / c)]; }
  const inside = (x, y) => x >= 0 && y >= 0 && x < N && y < N;

  let hover = null, preview = null, moveDrag = null;
  function drawOverlay() {
    og.setTransform(odpr, 0, 0, odpr, 0, 0);
    og.clearRect(0, 0, S, S);
    const c = cellPx();
    og.imageSmoothingEnabled = false;
    if (moveDrag && lcan[cl]) { og.globalAlpha = layers[cl].op; og.drawImage(lcan[cl], panX + moveDrag.dx * c, panY + moveDrag.dy * c, N * c, N * c); og.globalAlpha = 1; }
    if (preview) {
      og.fillStyle = preview.erase ? 'rgba(128,128,128,.55)' : color;
      for (const [x, y] of preview.pts) for (const [a, b] of expand(x, y)) og.fillRect(panX + a * c, panY + b * c, c, c);
    }
    if (showGrid && c >= 5) {
      og.fillStyle = 'rgba(0,0,0,.13)';
      for (let i = 1; i < N; i++) { const q = Math.round(panX + i * c), r = Math.round(panY + i * c); og.fillRect(q, panY, 1, N * c); og.fillRect(panX, r, N * c, 1); }
      og.fillStyle = 'rgba(0,0,0,.25)';
      for (let i = 8; i < N; i += 8) { const q = Math.round(panX + i * c), r = Math.round(panY + i * c); og.fillRect(q, panY, 1, N * c); og.fillRect(panX, r, N * c, 1); }
    }
    og.lineWidth = 2; og.setLineDash([8, 6]); og.strokeStyle = 'rgba(255,90,54,.75)';
    if (mirrorX) { og.beginPath(); og.moveTo(panX + N * c / 2, panY); og.lineTo(panX + N * c / 2, panY + N * c); og.stroke(); }
    if (mirrorY) { og.beginPath(); og.moveTo(panX, panY + N * c / 2); og.lineTo(panX + N * c, panY + N * c / 2); og.stroke(); }
    og.setLineDash([]);
    if (hover && inside(...hover)) {
      og.strokeStyle = 'rgba(255,90,54,.95)'; og.lineWidth = 2;
      for (const [a, b] of expand(...hover)) og.strokeRect(panX + a * c + 1, panY + b * c + 1, c - 2, c - 2);
    }
    if (strokeLatched) { og.fillStyle = 'rgba(255,90,54,.9)'; og.font = '800 12px ui-rounded, system-ui, sans-serif'; og.fillText('Drawing · click to stop', 8, S - 10); }
  }

  function expand(x, y) {
    const pts = [];
    const o = size === 1 ? [0] : size === 2 ? [0, 1] : [-1, 0, 1];
    for (const dy of o) for (const dx of o) {
      const a = x + dx, b = y + dy;
      pts.push([a, b]);
      if (mirrorX) pts.push([N - 1 - a, b]);
      if (mirrorY) pts.push([a, N - 1 - b]);
      if (mirrorX && mirrorY) pts.push([N - 1 - a, N - 1 - b]);
    }
    return pts;
  }
  let strokeSet = null, placed = 0;
  function plot(x, y, mode) {
    const buf = layers[cl].frames[cf];
    for (const [a, b] of expand(x, y)) {
      if (!inside(a, b)) continue;
      const i = b * N + a;
      if (mode === 'erase') buf[i] = 0;
      else if (mode === 'dither') { if ((a + b) % 2 === 0) { if (buf[i] !== hexU(color)) placed++; buf[i] = hexU(color); } }
      else if (mode === 'shade') { if (strokeSet.has(i) || !buf[i]) continue; strokeSet.add(i); buf[i] = shadeU(buf[i], shadeDir); }
      else { const u = hexU(color); if (buf[i] !== u) placed++; buf[i] = u; }
    }
  }
  function linePts(x0, y0, x1, y1) {
    const pts = []; const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (let g = 0; g < 400; g++) { pts.push([x0, y0]); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
    return pts;
  }
  function rectPts(x0, y0, x1, y1) {
    const pts = [], a = Math.min(x0, x1), b = Math.max(x0, x1), c = Math.min(y0, y1), d = Math.max(y0, y1);
    if (filled) { for (let y = c; y <= d; y++) for (let x = a; x <= b; x++) pts.push([x, y]); return pts; }
    for (let x = a; x <= b; x++) pts.push([x, c], [x, d]);
    for (let y = c; y <= d; y++) pts.push([a, y], [b, y]);
    return pts;
  }
  function ellipsePts(x0, y0, x1, y1) {
    const pts = [], a = Math.min(x0, x1), b = Math.max(x0, x1), c = Math.min(y0, y1), d = Math.max(y0, y1);
    const cx = (a + b) / 2, cy = (c + d) / 2, rx = (b - a) / 2 + 0.5, ry = (d - c) / 2 + 0.5;
    const inE = (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
    for (let y = c; y <= d; y++) for (let x = a; x <= b; x++) {
      if (!inE(x, y)) continue;
      if (filled || !inE(x - 1, y) || !inE(x + 1, y) || !inE(x, y - 1) || !inE(x, y + 1)) pts.push([x, y]);
    }
    return pts;
  }
  function floodFill(x, y) {
    const buf = layers[cl].frames[cf], target = buf[y * N + x], u = hexU(color);
    if (target === u) return 0;
    const stack = [y * N + x]; let n = 0;
    while (stack.length) {
      const i = stack.pop();
      if (buf[i] !== target) continue;
      buf[i] = u; n++;
      const px = i % N, py = (i / N) | 0;
      if (px > 0) stack.push(i - 1); if (px < N - 1) stack.push(i + 1); if (py > 0) stack.push(i - N); if (py < N - 1) stack.push(i + N);
    }
    return n;
  }
  function replaceAll(x, y) {
    const buf = layers[cl].frames[cf], target = buf[y * N + x], u = hexU(color);
    if (target === u) return 0; let n = 0;
    for (let i = 0; i < buf.length; i++) if (buf[i] === target) { buf[i] = u; n++; }
    return n;
  }
  function pickAt(x, y) {
    for (let i = layers.length - 1; i >= 0; i--) { const L = layers[i]; if (!L.vis) continue; const u = L.frames[cf][y * N + x]; if (u) return uHex(u); }
    return null;
  }

  let undo = [], redo = [];
  const snapshot = () => ({ N, frameCount, cf, cl, fps, layers: layers.map((L) => ({ name: L.name, vis: L.vis, op: L.op, frames: L.frames.map((f) => f.slice()) })) });
  function restoreSnap(s) { N = s.N; frameCount = s.frameCount; cf = s.cf; cl = s.cl; fps = s.fps; layers = s.layers.map((L) => ({ ...L, frames: L.frames.map((f) => f.slice()) })); }
  function pushProj() { undo.push({ kind: 'proj', state: snapshot() }); if (undo.length > 60) undo.shift(); redo = []; syncUndo(); }
  function pushPx(before) { const after = layers[cl].frames[cf].slice(); let same = true; for (let i = 0; i < after.length; i++) if (after[i] !== before[i]) { same = false; break; } if (same) return false; undo.push({ kind: 'px', li: cl, fi: cf, before, after }); if (undo.length > 120) undo.shift(); redo = []; syncUndo(); return true; }
  function applyEntry(e, dir) {
    if (e.kind === 'proj') { const cur = snapshot(); restoreSnap(e.state); return { kind: 'proj', state: cur }; }
    const L = layers[e.li]; if (!L || !L.frames[e.fi]) return e;
    L.frames[e.fi].set(dir === 'undo' ? e.before : e.after);
    cl = e.li; cf = e.fi;
    return e;
  }
  function doUndo() { const e = undo.pop(); if (!e) return; redo.push(applyEntry(e, 'undo')); afterStructural(); Curio.beep(330, 0.05, 'triangle', 0.07); }
  function doRedo() { const e = redo.pop(); if (!e) return; undo.push(applyEntry(e, 'redo')); afterStructural(); Curio.beep(440, 0.05, 'triangle', 0.07); }
  function syncUndo() { $('undo').disabled = !undo.length; $('redo').disabled = !redo.length; }
  function afterStructural() { cl = clamp(cl, 0, layers.length - 1); cf = clamp(cf, 0, frameCount - 1); refreshAll(); paintArt(); sizeSel(); paintLayers(); paintFrames(); drawOverlay(); syncUndo(); autosave(); }

  let stroke = null, strokeLatched = false;
  const touches = new Map();
  let pinch = null;
  over.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch') return;
    touches.set(e.pointerId, [e.clientX, e.clientY]);
    if (touches.size === 2) {
      if (stroke) { layers[stroke.li].frames[stroke.fi].set(stroke.before); refreshLayer(stroke.li); paintArt(); stroke = null; preview = null; }
      const [a, b] = [...touches.values()], r = over.getBoundingClientRect();
      pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), z: zoom, cx: (a[0] + b[0]) / 2 - r.left, cy: (a[1] + b[1]) / 2 - r.top, px: panX, py: panY };
    }
  });
  over.addEventListener('pointermove', (e) => {
    if (!touches.has(e.pointerId)) return;
    touches.set(e.pointerId, [e.clientX, e.clientY]);
    if (!pinch || touches.size < 2) return;
    const [a, b] = [...touches.values()], r = over.getBoundingClientRect();
    const d = Math.hypot(a[0] - b[0], a[1] - b[1]), cx = (a[0] + b[0]) / 2 - r.left, cy = (a[1] + b[1]) / 2 - r.top;
    const nz = clamp(pinch.z * d / pinch.d, 1, 16);
    const wx = (pinch.cx - pinch.px) / pinch.z, wy = (pinch.cy - pinch.py) / pinch.z;
    zoom = nz; panX = cx - wx * zoom; panY = cy - wy * zoom; applyView();
  });
  const tEnd = (e) => { touches.delete(e.pointerId); if (touches.size < 2) pinch = null; };
  addEventListener('pointerup', tEnd); addEventListener('pointercancel', tEnd);

  Curio.drag(over, {
    start(p) {
      if (pinch || !startEl.hidden) return;
      const [x, y] = cellAt(p.x, p.y);
      hover = [x, y];
      if (!inside(x, y) && tool !== 'move') return;
      meta.tools[tool] = 1; if (Object.keys(meta.tools).length >= 6) unlock('tools6');
      if (tool === 'picker') { const c = pickAt(x, y); if (c) { setColor(c); Curio.beep(880, 0.04, 'sine', 0.08); setTool('pencil'); } return; }
      const before = layers[cl].frames[cf].slice();
      if (tool === 'fill' || tool === 'replace') {
        const n = tool === 'fill' ? floodFill(x, y) : replaceAll(x, y);
        if (n) { placed += n; pushPx(before); afterStroke(); Curio.beep(520, 0.07, 'triangle', 0.08); }
        return;
      }
      stroke = { li: cl, fi: cf, before, x0: x, y0: y, last: [x, y], sx: p.x, sy: p.y };
      strokeSet = new Set();
      strokeLatched = Curio.touchpad && p.pointerType === 'mouse';
      if (tool === 'pencil' || tool === 'eraser' || tool === 'dither' || tool === 'shade') { plot(x, y, tool === 'eraser' ? 'erase' : tool === 'pencil' ? 'draw' : tool); refreshLayer(cl); paintArt(); tick(); }
      else if (tool === 'spray') spray(x, y);
      else if (tool === 'move') moveDrag = { dx: 0, dy: 0, x0: x, y0: y };
      else preview = { pts: [[x, y]] };
      drawOverlay();
    },
    move(p) {
      if (pinch) return;
      const [x, y] = cellAt(p.x, p.y);
      hover = p.pointerType === 'touch' && !stroke ? null : [x, y];
      if (stroke) {
        if (tool === 'pencil' || tool === 'eraser' || tool === 'dither' || tool === 'shade') {
          if (stroke.last[0] !== x || stroke.last[1] !== y) { for (const [a, b] of linePts(stroke.last[0], stroke.last[1], x, y)) plot(a, b, tool === 'eraser' ? 'erase' : tool === 'pencil' ? 'draw' : tool); stroke.last = [x, y]; refreshLayer(cl); paintArt(); tick(); }
        } else if (tool === 'spray') { stroke.last = [x, y]; }
        else if (tool === 'move') { moveDrag.dx = x - moveDrag.x0; moveDrag.dy = y - moveDrag.y0; paintArt(); }
        else preview = { pts: tool === 'line' ? linePts(stroke.x0, stroke.y0, x, y) : tool === 'rect' ? rectPts(stroke.x0, stroke.y0, x, y) : ellipsePts(stroke.x0, stroke.y0, x, y) };
      }
      drawOverlay();
    },
    end(p) {
      if (!stroke) return;
      strokeLatched = false;
      if (!p && (tool === 'line' || tool === 'rect' || tool === 'ellipse' || tool === 'move')) { preview = null; moveDrag = null; stroke = null; paintArt(); drawOverlay(); return; }
      if (tool === 'line' || tool === 'rect' || tool === 'ellipse') { for (const [a, b] of preview.pts) plot(a, b, 'draw'); preview = null; Curio.beep(600, 0.05, 'triangle', 0.07); }
      if (tool === 'move' && moveDrag) { shiftLayer(moveDrag.dx, moveDrag.dy); moveDrag = null; }
      refreshLayer(cl); paintArt();
      pushPx(stroke.before);
      stroke = null;
      afterStroke();
      drawOverlay();
    }
  });
  over.addEventListener('pointerleave', () => { if (!stroke) { hover = null; drawOverlay(); } });
  over.addEventListener('pointermove', (e) => { if (stroke || e.pointerType !== 'mouse') return; const r = over.getBoundingClientRect(); hover = cellAt(e.clientX - r.left, e.clientY - r.top); drawOverlay(); });
  over.addEventListener('contextmenu', (e) => e.preventDefault());
  over.addEventListener('wheel', (e) => {
    e.preventDefault();
    const r = over.getBoundingClientRect();
    if (e.ctrlKey || e.metaKey) zoomAt(zoom * Math.exp(-e.deltaY * 0.01), e.clientX - r.left, e.clientY - r.top);
    else if (zoom > 1) { panX -= e.deltaX; panY -= e.deltaY; applyView(); }
  }, { passive: false });
  let lastTick = 0;
  function tick() { const now = performance.now(); if (now - lastTick > 45) { lastTick = now; Curio.beep(700 + Math.random() * 200, 0.02, 'square', 0.025); } }
  function spray(x, y) {
    const r = size + 1.5;
    for (let k = 0; k < 3 + size * 2; k++) {
      const a = Math.random() * Math.PI * 2, d = Math.random() * r;
      const px = Math.round(x + Math.cos(a) * d), py = Math.round(y + Math.sin(a) * d);
      if (!inside(px, py)) continue;
      const buf = layers[cl].frames[cf], i = py * N + px; const u = hexU(color); if (buf[i] !== u) placed++; buf[i] = u;
      if (mirrorX) buf[py * N + (N - 1 - px)] = u;
      if (mirrorY) buf[(N - 1 - py) * N + px] = u;
    }
    refreshLayer(cl); paintArt();
  }
  function shiftLayer(dx, dy) {
    if (!dx && !dy) return;
    const buf = layers[cl].frames[cf], out = new Uint32Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const nx = x + dx, ny = y + dy; if (inside(nx, ny)) out[ny * N + nx] = buf[y * N + x]; }
    buf.set(out);
  }
  function afterStroke() {
    if (placed) {
      meta.stats.pixels += placed; placed = 0;
      unlock('first'); if (meta.stats.pixels >= 1000) unlock('px1k'); if (meta.stats.pixels >= 10000) unlock('px10k');
      if (mirrorX || mirrorY) unlock('mirror');
      if (N === 64) { let n = 0; for (const L of layers) for (const v of L.frames[cf]) if (v) n++; if (n >= 600) unlock('big'); }
      persistMeta();
    }
    paintFrameThumb(cf); paintLayerThumbs(); autosave();
  }

  const toolsEl = $('tools');
  TOOLS.forEach((t) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'pa-tool'; b.dataset.tool = t.id;
    b.title = `${t.name} (${t.key.toUpperCase()})`; b.setAttribute('aria-label', t.name); b.textContent = t.icon;
    b.addEventListener('click', () => { setTool(t.id); Curio.beep(600, 0.03, 'sine', 0.06); });
    toolsEl.append(b);
  });
  function setTool(t) {
    tool = t;
    toolsEl.querySelectorAll('.pa-tool').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tool === t)));
    $('toolName').textContent = TOOLS.find((x) => x.id === t).name;
    $('shadeOpt').hidden = t !== 'shade';
    $('fillOpt').hidden = !['rect', 'ellipse'].includes(t);
    over.style.cursor = t === 'move' ? 'move' : t === 'picker' ? 'copy' : 'crosshair';
  }
  function bindSeg(id, onPick) { $(id).querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { onPick(b.dataset.v); paintOpts(); })); }
  bindSeg('sizeSeg', (v) => { size = +v; });
  bindSeg('shadeSeg', (v) => { shadeDir = +v; });
  $('filledBtn').addEventListener('click', () => { filled = !filled; paintOpts(); });
  $('mirXBtn').addEventListener('click', () => { mirrorX = !mirrorX; paintOpts(); drawOverlay(); });
  $('mirYBtn').addEventListener('click', () => { mirrorY = !mirrorY; paintOpts(); drawOverlay(); });
  $('gridBtn').addEventListener('click', () => { showGrid = !showGrid; paintOpts(); drawOverlay(); });
  $('onionBtn').addEventListener('click', () => { onion = !onion; paintOpts(); paintArt(); });
  function paintOpts() {
    $('sizeSeg').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.v === size)));
    $('shadeSeg').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.v === shadeDir)));
    $('filledBtn').setAttribute('aria-pressed', String(filled));
    $('mirXBtn').setAttribute('aria-pressed', String(mirrorX)); $('mirYBtn').setAttribute('aria-pressed', String(mirrorY));
    $('gridBtn').setAttribute('aria-pressed', String(showGrid)); $('onionBtn').setAttribute('aria-pressed', String(onion));
  }

  const palEl = $('pal'), palSel = $('palSel');
  D.PALETTES.forEach((p) => { const o = document.createElement('option'); o.value = p.id; o.textContent = `${p.name} (${p.colors.length})`; palSel.append(o); });
  function paintPalette() {
    const p = D.PALETTES.find((x) => x.id === meta.palette) || D.PALETTES[0];
    palSel.value = p.id; palEl.textContent = '';
    for (const c of p.colors) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'pa-sw'; b.style.background = c; b.dataset.c = c; b.setAttribute('aria-label', `Color ${c}`); b.title = c;
      b.addEventListener('click', () => { setColor(c); if (tool === 'eraser' || tool === 'picker') setTool('pencil'); });
      palEl.append(b);
    }
    paintSwatchSel();
  }
  palSel.addEventListener('change', () => { meta.palette = palSel.value; meta.palettes[palSel.value] = 1; if (Object.keys(meta.palettes).length >= 5) unlock('palettes'); persistMeta(); paintPalette(); });
  const picker = $('picker'), hex = $('hex');
  function setColor(c) {
    color = c.toLowerCase(); picker.value = color; hex.textContent = color; $('curSw').style.background = color;
    meta.recent = [color].concat(meta.recent.filter((x) => x !== color)).slice(0, 10); persistMeta();
    paintSwatchSel(); paintRecent(); autosave();
  }
  function paintSwatchSel() { palEl.querySelectorAll('.pa-sw').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.c === color))); }
  function paintRecent() {
    const r = $('recent'); r.textContent = '';
    for (const c of meta.recent) { const b = document.createElement('button'); b.type = 'button'; b.className = 'pa-sw pa-sw--sm'; b.style.background = c; b.setAttribute('aria-label', `Recent color ${c}`); b.addEventListener('click', () => setColor(c)); r.append(b); }
  }
  picker.addEventListener('change', () => setColor(picker.value));
  picker.addEventListener('input', () => { color = picker.value.toLowerCase(); hex.textContent = color; $('curSw').style.background = color; });

  const layersEl = $('layers');
  function paintLayers() {
    layersEl.textContent = '';
    for (let i = layers.length - 1; i >= 0; i--) {
      const L = layers[i];
      const row = document.createElement('div'); row.className = 'pa-layer'; row.setAttribute('aria-selected', String(i === cl));
      const eye = document.createElement('button'); eye.type = 'button'; eye.className = 'pa-eye'; eye.textContent = L.vis ? '👁️' : '🙈'; eye.setAttribute('aria-label', `${L.vis ? 'Hide' : 'Show'} ${L.name}`);
      eye.addEventListener('click', () => { L.vis = !L.vis; paintArt(); paintLayers(); autosave(); });
      const th = document.createElement('canvas'); th.className = 'pa-lthumb'; th.width = th.height = N; th.dataset.li = i;
      const name = document.createElement('button'); name.type = 'button'; name.className = 'pa-lname'; name.textContent = L.name;
      name.addEventListener('click', () => { cl = i; paintLayers(); });
      row.append(eye, th, name);
      layersEl.append(row);
    }
    paintLayerThumbs();
    $('opR').value = Math.round(layers[cl].op * 100);
    $('layAdd').disabled = layers.length >= MAX_LAYERS;
    $('layDel').disabled = layers.length <= 1;
    $('layUp').disabled = cl >= layers.length - 1; $('layDown').disabled = cl <= 0; $('layMerge').disabled = cl <= 0;
  }
  function paintLayerThumbs() { layersEl.querySelectorAll('.pa-lthumb').forEach((c) => { const L = layers[+c.dataset.li]; if (L) bufCanvas(L.frames[cf], c); }); }
  $('layAdd').addEventListener('click', () => { if (layers.length >= MAX_LAYERS) return; pushProj(); layers.splice(cl + 1, 0, { name: `Layer ${layers.length + 1}`, vis: true, op: 1, frames: Array.from({ length: frameCount }, blank) }); cl++; if (layers.length >= 3) unlock('layers'); afterStructural(); });
  $('layDel').addEventListener('click', () => { if (layers.length <= 1) return; pushProj(); layers.splice(cl, 1); cl = Math.max(0, cl - 1); afterStructural(); });
  $('layUp').addEventListener('click', () => { if (cl >= layers.length - 1) return; pushProj(); [layers[cl], layers[cl + 1]] = [layers[cl + 1], layers[cl]]; cl++; afterStructural(); });
  $('layDown').addEventListener('click', () => { if (cl <= 0) return; pushProj(); [layers[cl], layers[cl - 1]] = [layers[cl - 1], layers[cl]]; cl--; afterStructural(); });
  $('layMerge').addEventListener('click', () => {
    if (cl <= 0) return; pushProj();
    const top = layers[cl], bot = layers[cl - 1];
    for (let f = 0; f < frameCount; f++) { const a = top.frames[f], b = bot.frames[f]; for (let i = 0; i < a.length; i++) if (a[i] && top.vis) b[i] = a[i]; }
    layers.splice(cl, 1); cl--; afterStructural(); Curio.toast('Merged down');
  });
  $('opR').addEventListener('input', () => { layers[cl].op = +$('opR').value / 100; paintArt(); });
  $('opR').addEventListener('change', autosave);

  const framesEl = $('frames');
  function paintFrames() {
    framesEl.textContent = '';
    for (let f = 0; f < frameCount; f++) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'pa-frame'; b.setAttribute('aria-pressed', String(f === cf)); b.setAttribute('aria-label', `Frame ${f + 1}`);
      const c = document.createElement('canvas'); c.width = c.height = N; c.dataset.f = f; b.append(c);
      const s = document.createElement('span'); s.textContent = f + 1; b.append(s);
      b.addEventListener('click', () => gotoFrame(f));
      framesEl.append(b);
      paintFrameThumb(f);
    }
    $('frDel').disabled = frameCount <= 1; $('frAdd').disabled = $('frDup').disabled = frameCount >= MAX_FRAMES;
    $('frLeft').disabled = cf <= 0; $('frRight').disabled = cf >= frameCount - 1;
    $('fpsLbl').textContent = `${fps} fps`; $('fpsR').value = fps;
    $('frInfo').textContent = `Frame ${cf + 1} of ${frameCount}`;
  }
  function paintFrameThumb(f) { const c = framesEl.querySelector(`canvas[data-f="${f}"]`); if (!c) return; const x = c.getContext('2d'); x.clearRect(0, 0, N, N); compositeTo(x, f); }
  function gotoFrame(f) { cf = clamp(f, 0, frameCount - 1); refreshAll(); paintArt(); paintFrames(); paintLayerThumbs(); drawOverlay(); }
  $('frAdd').addEventListener('click', () => { if (frameCount >= MAX_FRAMES) return; pushProj(); layers.forEach((L) => L.frames.splice(cf + 1, 0, blank())); frameCount++; cf++; if (frameCount >= 4) unlock('anim'); afterStructural(); });
  $('frDup').addEventListener('click', () => { if (frameCount >= MAX_FRAMES) return; pushProj(); layers.forEach((L) => L.frames.splice(cf + 1, 0, L.frames[cf].slice())); frameCount++; cf++; if (frameCount >= 4) unlock('anim'); afterStructural(); });
  $('frDel').addEventListener('click', () => { if (frameCount <= 1) return; pushProj(); layers.forEach((L) => L.frames.splice(cf, 1)); frameCount--; cf = Math.min(cf, frameCount - 1); afterStructural(); });
  $('frLeft').addEventListener('click', () => { if (cf <= 0) return; pushProj(); layers.forEach((L) => { [L.frames[cf], L.frames[cf - 1]] = [L.frames[cf - 1], L.frames[cf]]; }); cf--; afterStructural(); });
  $('frRight').addEventListener('click', () => { if (cf >= frameCount - 1) return; pushProj(); layers.forEach((L) => { [L.frames[cf], L.frames[cf + 1]] = [L.frames[cf + 1], L.frames[cf]]; }); cf++; afterStructural(); });
  $('fpsR').addEventListener('input', () => { fps = +$('fpsR').value; $('fpsLbl').textContent = `${fps} fps`; autosave(); });

  const prev = $('preview'), pg = prev.getContext('2d');
  let playing = true, pf = 0, plast = 0;
  $('playBtn').addEventListener('click', () => { playing = !playing; $('playBtn').textContent = playing ? '⏸' : '▶'; $('playBtn').setAttribute('aria-label', playing ? 'Pause preview' : 'Play preview'); });
  function previewLoop(t) {
    requestAnimationFrame(previewLoop);
    if (document.hidden) return;
    if (t - plast < 1000 / fps) return;
    plast = t;
    if (playing && frameCount > 1) pf = (pf + 1) % frameCount; else pf = cf;
    if (pf >= frameCount) pf = 0;
    prev.width = prev.height = N;
    pg.clearRect(0, 0, N, N); compositeTo(pg, pf);
  }

  function sizeSel() { $('sizeSel').value = String(N); }
  $('sizeSel').addEventListener('change', () => {
    const n = +$('sizeSel').value; if (n === N) return;
    pushProj();
    const old = N;
    layers.forEach((L) => { L.frames = L.frames.map((buf) => { const nx = new Uint32Array(n * n); for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) nx[y * n + x] = buf[Math.floor(y * old / n) * old + Math.floor(x * old / n)]; return nx; }); });
    N = n; zoom = 1; afterStructural(); applyView();
  });
  function transform(kind) {
    pushProj();
    const L = layers[cl], buf = L.frames[cf], out = new Uint32Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const v = buf[y * N + x];
      if (kind === 'fh') out[y * N + (N - 1 - x)] = v; else if (kind === 'fv') out[(N - 1 - y) * N + x] = v; else out[x * N + (N - 1 - y)] = v;
    }
    buf.set(out); afterStructural();
  }
  $('flipH').addEventListener('click', () => transform('fh'));
  $('flipV').addEventListener('click', () => transform('fv'));
  $('rot').addEventListener('click', () => transform('rot'));
  $('undo').addEventListener('click', doUndo);
  $('redo').addEventListener('click', doRedo);
  $('clear').addEventListener('click', () => { if (!layers[cl].frames[cf].some(Boolean)) return; pushProj(); layers[cl].frames[cf].fill(0); afterStructural(); Curio.toast('Layer cleared. Undo if you regret it.'); });
  $('zin').addEventListener('click', () => zoomAt(zoom * 1.5, S / 2, S / 2));
  $('zout').addEventListener('click', () => zoomAt(zoom / 1.5, S / 2, S / 2));
  $('zfit').addEventListener('click', () => { zoom = 1; applyView(); });

  function download(url, name) { const a = document.createElement('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove(); }
  const scaleOf = () => { const s = +$('scaleSel').value; return Math.max(1, Math.min(s, Math.floor(2048 / N / Math.max(1, $('scaleSel').dataset.sheet ? frameCount : 1)))); };
  const fileBase = () => (projName || 'pixel-art').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'pixel-art';
  $('expPng').addEventListener('click', () => {
    const s = scaleOf(), c = document.createElement('canvas'); c.width = c.height = N * s;
    compositeTo(c.getContext('2d'), cf, s);
    download(c.toDataURL('image/png'), `${fileBase()}.png`);
    exported('png', `Saved a ${N * s}×${N * s} PNG 🖼️`);
  });
  $('expSheet').addEventListener('click', () => {
    const s = Math.max(1, Math.min(+$('scaleSel').value, Math.floor(4096 / (N * frameCount)))), c = document.createElement('canvas'); c.width = N * s * frameCount; c.height = N * s;
    const x = c.getContext('2d');
    for (let f = 0; f < frameCount; f++) { x.save(); x.translate(f * N * s, 0); compositeTo(x, f, s); x.restore(); }
    download(c.toDataURL('image/png'), `${fileBase()}-sheet.png`);
    exported('sheet', `Saved a ${frameCount}-frame sprite sheet 🗂️`);
  });
  $('expGif').addEventListener('click', () => {
    const s = Math.max(1, Math.min(+$('scaleSel').value, Math.floor(1024 / N)));
    const bytes = makeGif(s);
    const url = URL.createObjectURL(new Blob([bytes], { type: 'image/gif' }));
    download(url, `${fileBase()}.gif`);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    exported('gif', frameCount > 1 ? `Saved a ${frameCount}-frame GIF at ${fps} fps 🎬` : 'Saved a GIF (add frames to animate it) 🎬');
  });
  function exported(kind, msg) {
    meta.stats.exports++; unlock(kind === 'png' ? 'png' : kind === 'gif' ? (frameCount > 1 ? 'gif' : 'png') : 'sheet'); persistMeta();
    Curio.toast(msg); Curio.beep(880, 0.08, 'triangle', 0.1); setTimeout(() => Curio.beep(1320, 0.1, 'triangle', 0.1), 80);
  }

  function frameRGBA(f, s) {
    const c = document.createElement('canvas'); c.width = c.height = N * s;
    const x = c.getContext('2d'); compositeTo(x, f, s);
    return new Uint32Array(x.getImageData(0, 0, N * s, N * s).data.buffer);
  }
  function makeGif(s) {
    const W = N * s;
    const frames = Array.from({ length: frameCount }, (_, f) => frameRGBA(f, s));
    let quant = 0;
    const key = (u) => { const a = u >>> 24; if (a < 128) return -1; if (!quant) return u & 0xffffff; const m = 0xff - ((1 << quant) - 1); return (u & m) | (((u >>> 8) & m) << 8) | (((u >>> 16) & m) << 16); };
    let map;
    for (;;) {
      map = new Map();
      for (const fr of frames) { for (const u of fr) { const k = key(u); if (k >= 0 && !map.has(k)) map.set(k, map.size + 1); } if (map.size > 255) break; }
      if (map.size <= 255) break;
      quant++;
    }
    const out = [];
    const w8 = (v) => out.push(v & 255), w16 = (v) => { out.push(v & 255, (v >> 8) & 255); }, str = (t) => { for (const ch of t) out.push(ch.charCodeAt(0)); };
    str('GIF89a'); w16(W); w16(W);
    w8(0xf7); w8(0); w8(0);
    const table = new Array(256).fill(0); for (const [k, i] of map) table[i] = k;
    for (let i = 0; i < 256; i++) { const k = table[i]; w8(k & 255); w8((k >> 8) & 255); w8((k >> 16) & 255); }
    w8(0x21); w8(0xff); w8(11); str('NETSCAPE2.0'); w8(3); w8(1); w16(0); w8(0);
    const delay = Math.max(2, Math.round(100 / fps));
    for (const fr of frames) {
      w8(0x21); w8(0xf9); w8(4); w8(0b00001001); w16(delay); w8(0); w8(0);
      w8(0x2c); w16(0); w16(0); w16(W); w16(W); w8(0);
      const idx = new Uint8Array(fr.length);
      for (let i = 0; i < fr.length; i++) { const k = key(fr[i]); idx[i] = k < 0 ? 0 : map.get(k); }
      const data = lzw(idx, 8);
      w8(8);
      for (let i = 0; i < data.length; i += 255) { const n = Math.min(255, data.length - i); w8(n); for (let j = 0; j < n; j++) out.push(data[i + j]); }
      w8(0);
    }
    w8(0x3b);
    return new Uint8Array(out);
  }
  function lzw(idx, minSize) {
    const clear = 1 << minSize, eoi = clear + 1;
    let codeSize = minSize + 1, next = eoi + 1, table = new Map();
    const bytes = []; let cur = 0, bits = 0;
    const emit = (code) => { cur |= code << bits; bits += codeSize; while (bits >= 8) { bytes.push(cur & 255); cur >>>= 8; bits -= 8; } };
    emit(clear);
    let ib = idx[0];
    for (let i = 1; i < idx.length; i++) {
      const k = idx[i], ck = (ib << 8) | k, code = table.get(ck);
      if (code === undefined) {
        emit(ib);
        if (next === 4096) { emit(clear); next = eoi + 1; codeSize = minSize + 1; table = new Map(); }
        else { if (next >= (1 << codeSize)) codeSize++; table.set(ck, next++); }
        ib = k;
      } else ib = code;
    }
    emit(ib); emit(eoi);
    if (bits > 0) bytes.push(cur & 255);
    return bytes;
  }

  const drawer = $('drawer'), drawerBody = $('drawerBody');
  function openDrawer(title, build) {
    $('drawerT').textContent = title; drawerBody.textContent = ''; build(drawerBody);
    drawer.hidden = false; requestAnimationFrame(() => drawer.classList.add('is-on'));
    drawer.querySelector('.pa-drawer__x').focus();
  }
  function closeDrawer() { drawer.classList.remove('is-on'); setTimeout(() => { drawer.hidden = true; }, 200); }
  drawer.addEventListener('click', (e) => { if (e.target === drawer) closeDrawer(); });
  drawer.querySelector('.pa-drawer__x').addEventListener('click', closeDrawer);

  function templateCanvas(t, px = 64, f = 0) {
    const c = document.createElement('canvas'); c.width = c.height = 16; c.style.width = c.style.height = `${px}px`;
    const x = c.getContext('2d');
    t.frames[f].forEach((row, y) => [...row].forEach((ch, xx) => { const col = t.pal[ch]; if (col) { x.fillStyle = col; x.fillRect(xx, y, 1, 1); } }));
    return c;
  }
  function loadTemplate(t) {
    pushProj();
    N = 16; frameCount = t.frames.length; cf = 0; cl = 0; fps = t.fps || 8; projName = t.name;
    layers = [{ name: 'Layer 1', vis: true, op: 1, frames: t.frames.map((rows) => { const b = new Uint32Array(256); rows.forEach((row, y) => [...row].forEach((ch, x) => { const col = t.pal[ch]; if (col) b[y * 16 + x] = hexU(col); })); return b; }) }];
    zoom = 1; unlock('template'); if (frameCount >= 4) unlock('anim');
    afterStructural(); applyView();
    Curio.toast(`${t.name} loaded. Make it yours!`);
  }
  function openTemplates() {
    openDrawer('Templates', (box) => {
      const p = document.createElement('p'); p.className = 'pa-lead'; p.textContent = 'Start from a sprite and remix it. The animated ones come with frames ready to play. You can undo a template load.';
      box.append(p);
      const grid = document.createElement('div'); grid.className = 'pa-tpls';
      for (const t of D.TEMPLATES) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'pa-tpl';
        const c = templateCanvas(t, 64); b.append(c);
        if (t.frames.length > 1) { let f = 0; const iv = setInterval(() => { if (!b.isConnected) { clearInterval(iv); return; } f = (f + 1) % t.frames.length; const nc = templateCanvas(t, 64, f); c.getContext('2d').clearRect(0, 0, 16, 16); c.getContext('2d').drawImage(nc, 0, 0); }, 1000 / (t.fps || 8)); }
        const s = document.createElement('span'); s.textContent = t.name; b.append(s);
        if (t.frames.length > 1) { const sm = document.createElement('small'); sm.textContent = `${t.frames.length} frames`; b.append(sm); }
        b.addEventListener('click', () => { closeDrawer(); hideStart(); loadTemplate(t); });
        grid.append(b);
      }
      box.append(grid);
      const h = document.createElement('h3'); h.textContent = 'Blank canvas'; box.append(h);
      const row = document.createElement('div'); row.className = 'pa-blank';
      for (const n of SIZES) { const b = document.createElement('button'); b.type = 'button'; b.className = 'c-btn c-btn--ghost'; b.textContent = `${n}×${n}`; b.addEventListener('click', () => { closeDrawer(); hideStart(); startBlank(n); }); row.append(b); }
      box.append(row);
    });
  }
  function startBlank(n) { pushProj(); newProject(n); fps = 8; zoom = 1; afterStructural(); applyView(); }

  const GKEY = 'pixel-art:gallery';
  const gallery = () => { const g = Curio.store.get(GKEY, []); return Array.isArray(g) ? g.filter((x) => x && x.p && x.id) : []; };
  function thumbURL() { const c = document.createElement('canvas'); const s = Math.max(1, Math.floor(96 / N)); c.width = c.height = N * s; compositeTo(c.getContext('2d'), 0, s); return c.toDataURL('image/png'); }
  function saveToGallery(name) {
    const g = gallery();
    projName = name || projName;
    const id = `a${Date.now().toString(36)}`;
    g.unshift({ id, name: projName, t: Date.now(), thumb: thumbURL(), p: encode(), prompt: todayPrompt() });
    const trimmed = g.slice(0, 24);
    Curio.store.set(GKEY, trimmed);
    const ok = gallery().some((x) => x.id === id);
    if (!ok) { Curio.toast('Gallery is full. Delete a few pieces first.'); return; }
    meta.stats.saves++; if (trimmed.length >= 5) unlock('gallery');
    if (name && name.toLowerCase().includes(todayPrompt().toLowerCase())) unlock('daily');
    persistMeta(); autosave();
    Curio.toast(`Saved "${projName}" to your gallery 🏛️`); Curio.confetti(60);
  }
  function openGallery() {
    openDrawer('Gallery', (box) => {
      const f = document.createElement('form'); f.className = 'pa-saveform';
      f.innerHTML = '<input class="c-input" maxlength="40" aria-label="Artwork name"><button class="c-btn" type="submit">💾 Save current</button>';
      const inp = f.querySelector('input'); inp.value = projName === 'Untitled' ? `${todayPrompt()}` : projName;
      f.addEventListener('submit', (e) => { e.preventDefault(); saveToGallery(inp.value.trim() || 'Untitled'); closeDrawer(); });
      box.append(f);
      const tip = document.createElement('p'); tip.className = 'pa-lead'; tip.textContent = `Today's prompt is "${todayPrompt()}". Save with the prompt in the name to earn the daily badge.`;
      box.append(tip);
      const g = gallery();
      if (!g.length) { const p = document.createElement('p'); p.className = 'pa-lead'; p.textContent = 'Nothing saved yet. Your saved pieces show up here with thumbnails.'; box.append(p); return; }
      const grid = document.createElement('div'); grid.className = 'pa-gal';
      for (const item of g) {
        const card = document.createElement('div'); card.className = 'pa-gitem';
        const img = document.createElement('img'); img.src = item.thumb; img.alt = item.name; img.width = 96; img.height = 96;
        const t = document.createElement('b'); t.textContent = item.name;
        const d = document.createElement('small'); d.textContent = `${item.p.n}×${item.p.n}${item.p.frames > 1 ? ` · ${item.p.frames} frames` : ''} · ${new Date(item.t).toLocaleDateString()}`;
        const row = document.createElement('div');
        const open = document.createElement('button'); open.type = 'button'; open.className = 'c-btn'; open.textContent = 'Open';
        open.addEventListener('click', () => { pushProj(); if (decode(item.p)) { zoom = 1; afterStructural(); applyView(); closeDrawer(); hideStart(); Curio.toast(`Opened "${item.name}"`); } });
        const del = document.createElement('button'); del.type = 'button'; del.className = 'c-btn c-btn--ghost'; del.textContent = '🗑'; del.setAttribute('aria-label', `Delete ${item.name}`);
        del.addEventListener('click', () => { Curio.store.set(GKEY, gallery().filter((x) => x.id !== item.id)); card.remove(); });
        row.append(open, del);
        card.append(img, t, d, row);
        grid.append(card);
      }
      box.append(grid);
    });
  }
  function openTrophies() {
    openDrawer('Trophies and stats', (box) => {
      const st = document.createElement('div'); st.className = 'pa-stats';
      for (const [k, v] of [['Pixels placed', Curio.fmt(meta.stats.pixels)], ['Exports', meta.stats.exports], ['Gallery saves', meta.stats.saves], ['Tools used', `${Object.keys(meta.tools).length} / ${TOOLS.length}`]]) { const d = document.createElement('div'); d.innerHTML = '<b></b><span></span>'; d.querySelector('b').textContent = v; d.querySelector('span').textContent = k; st.append(d); }
      box.append(st);
      const h = document.createElement('h3'); h.textContent = `Achievements ${Object.keys(meta.ach).length} / ${D.ACH.length}`; box.append(h);
      const ag = document.createElement('div'); ag.className = 'pa-ach';
      for (const a of D.ACH) { const d = document.createElement('div'); d.className = meta.ach[a.id] ? 'on' : ''; d.innerHTML = '<i></i><b></b><small></small>'; d.querySelector('i').textContent = meta.ach[a.id] ? a.icon : '🔒'; d.querySelector('b').textContent = a.name; d.querySelector('small').textContent = a.desc; ag.append(d); }
      box.append(ag);
    });
  }
  function openHelp() {
    openDrawer('How to draw', (box) => {
      const keys = TOOLS.map((t) => `<span class="c-kbd">${t.key.toUpperCase()}</span> ${t.name.toLowerCase()}`).join(' · ');
      box.innerHTML = `<div class="pa-help">
        <p><b>Draw</b> by clicking or dragging on the canvas. Shapes (line, rectangle, ellipse) preview as you drag and land when you let go. The eraser is a tool, no right-click needed.</p>
        <p><b>Touchpad?</b> Turn on Touchpad mode (🖱️ in the top bar): click once to put the pen down, glide to draw, click again to lift it. Esc cancels a shape.</p>
        <p><b>Zoom</b> with a pinch or the + and - buttons, then scroll with two fingers to move around. Mirror X and Y draw symmetrically. Onion skin shows the neighbouring frames faintly.</p>
        <p><b>Animate:</b> add or duplicate frames under the canvas, watch the live preview, then export a GIF or sprite sheet. Layers work across all frames.</p>
        <p class="pa-keys">${keys} · <span class="c-kbd">[</span> <span class="c-kbd">]</span> brush size · <span class="c-kbd">X</span> <span class="c-kbd">Y</span> mirror · <span class="c-kbd">T</span> grid · <span class="c-kbd">Q</span> onion · <span class="c-kbd">,</span> <span class="c-kbd">.</span> frames · <span class="c-kbd">+</span> <span class="c-kbd">-</span> <span class="c-kbd">0</span> zoom · <span class="c-kbd">Ctrl</span>+<span class="c-kbd">Z</span> / <span class="c-kbd">Y</span> undo and redo</p>
      </div>`;
    });
  }
  $('tplBtn').addEventListener('click', openTemplates);
  $('galBtn').addEventListener('click', openGallery);
  $('trophyBtn').addEventListener('click', openTrophies);
  $('helpBtn').addEventListener('click', openHelp);
  $('menuBtn').addEventListener('click', () => showStart());

  const ACH = Object.fromEntries(D.ACH.map((a) => [a.id, a]));
  function unlock(id) {
    if (meta.ach[id] || !ACH[id]) return;
    meta.ach[id] = Date.now(); persistMeta();
    const a = ACH[id];
    const el = document.createElement('div'); el.className = 'pa-badge';
    el.innerHTML = '<i></i><div><small>Achievement unlocked</small><b></b></div>';
    el.querySelector('i').textContent = a.icon; el.querySelector('b').textContent = a.name;
    document.body.append(el);
    requestAnimationFrame(() => el.classList.add('is-on'));
    setTimeout(() => { el.classList.remove('is-on'); setTimeout(() => el.remove(), 500); }, 3000);
    Curio.beep(784, 0.12, 'triangle', 0.06); setTimeout(() => Curio.beep(1175, 0.18, 'triangle', 0.06), 110);
  }

  const todayPrompt = () => { const d = new Date(); let h = 7; for (const ch of `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return D.PROMPTS[h % D.PROMPTS.length]; };
  const startEl = $('start');
  function showStart() {
    $('stPrompt').textContent = todayPrompt();
    $('goContinue').textContent = hadSave ? '▶ Continue drawing' : '▶ Start drawing';
    const g = gallery(); $('stLine').textContent = `${Curio.fmt(meta.stats.pixels)} pixels placed · ${g.length} in your gallery · ${Object.keys(meta.ach).length}/${D.ACH.length} trophies`;
    startEl.hidden = false; requestAnimationFrame(() => startEl.classList.add('is-on'));
    $('goContinue').focus();
  }
  function hideStart() {
    startEl.classList.remove('is-on'); setTimeout(() => { startEl.hidden = true; sizeBox(); }, 250);
    if (!meta.tphint && !Curio.touchpad) { meta.tphint = true; persistMeta(); setTimeout(() => Curio.toast('Tip: on a touchpad, turn on Touchpad mode (🖱️ in the top bar). Click to put the pen down, click again to lift it.', 5000), 2000); }
  }
  $('goContinue').addEventListener('click', hideStart);
  $('goNew').addEventListener('click', () => { hideStart(); startBlank(+$('stSize').value); });
  $('goTpl').addEventListener('click', openTemplates);
  $('goGal').addEventListener('click', openGallery);
  $('goPrompt').addEventListener('click', () => { hideStart(); startBlank(32); projName = todayPrompt(); Curio.toast(`Today's prompt: draw ${todayPrompt()}!`, 3200); });
  $('promptChip').addEventListener('click', () => Curio.toast(`Today's prompt: draw ${todayPrompt()}. Save it to your gallery with that name.`, 3600));

  addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input, textarea, select')) return;
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); e.shiftKey ? doRedo() : doUndo(); return; }
    if ((e.ctrlKey || e.metaKey) && k === 'y') { e.preventDefault(); doRedo(); return; }
    if ((e.ctrlKey || e.metaKey) && k === 's') { e.preventDefault(); openGallery(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape') { if (!drawer.hidden) closeDrawer(); return; }
    if (!startEl.hidden || !drawer.hidden) return;
    const t = TOOLS.find((x) => x.key === k) || (k === 'p' ? TOOLS[0] : null);
    if (t) { setTool(t.id); return; }
    if (k === '[') { size = Math.max(1, size - 1); paintOpts(); }
    else if (k === ']') { size = Math.min(3, size + 1); paintOpts(); }
    else if (k === 'x') $('mirXBtn').click(); else if (k === 'y') $('mirYBtn').click();
    else if (k === 't') $('gridBtn').click(); else if (k === 'q') $('onionBtn').click();
    else if (k === 'f') $('filledBtn').click();
    else if (k === ',') gotoFrame(cf - 1); else if (k === '.') gotoFrame(cf + 1);
    else if (k === '+' || k === '=') $('zin').click(); else if (k === '-') $('zout').click(); else if (k === '0') $('zfit').click();
    else if (e.key.startsWith('Arrow') && zoom > 1) { e.preventDefault(); const s = 40; if (e.key === 'ArrowLeft') panX += s; if (e.key === 'ArrowRight') panX -= s; if (e.key === 'ArrowUp') panY += s; if (e.key === 'ArrowDown') panY -= s; applyView(); }
  });
  addEventListener('resize', () => sizeBox());
  addEventListener('curio:touchpad', () => { strokeLatched = false; drawOverlay(); });

  window.__pixel = { get layers() { return layers; }, get N() { return N; }, get frameCount() { return frameCount; }, makeGif, lzw, loadTemplate, setTool, setColor, encode, decode, TEMPLATES: D.TEMPLATES, get undoLen() { return undo.length; }, doUndo };

  const hadSave = loadInitial();
  refreshAll(); paintArt();
  setTool('pencil'); setColor(color); paintPalette(); paintRecent(); paintOpts(); sizeSel(); paintLayers(); paintFrames(); syncUndo();
  sizeBox();
  requestAnimationFrame(previewLoop);
  showStart();
})();
