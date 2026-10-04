(() => {
  const FW = 960, FH = 720, MAXF = 60, PAPER = '#fffdf5', PAPER_RGB = [255, 253, 245];
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mk = (w = FW, h = FH) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const cv = $('cv'), g = cv.getContext('2d');
  cv.width = FW; cv.height = FH;
  const COLORS = ['#1f1d1a', '#e5383b', '#ff8c1a', '#f2c200', '#2fa84f', '#1e88e5', '#7b4fd6', '#ec5fa4', '#8a5a36', '#9aa0a6'];

  const saved = Curio.store.get('flipbook:state', {});
  let tool = 'pen', color = saved.color ?? 0, width = saved.width || 8, onion = saved.onion ?? true, fps = saved.fps || 8, mode = saved.mode || 'loop';
  let frames = [], cur = 0, uid = 1;
  const newFrame = () => ({ id: uid++, c: mk(), thumb: null });

  function makeSampler(spacing, emit, K = .55) {
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
      end() { walk(mPrev.x, mPrev.y, pPrev.x, pPrev.y, r0.x, r0.y, prS, prS); }
    };
  }

  let last = null, wS = null, box = null, fctx = null;
  const pen = makeSampler(() => Math.max(.8, (wS || width) * .2), (x, y, pr, v) => {
    const base = tool === 'eraser' ? width * 3 : width;
    const w = pr != null ? base * (.3 + pr * 1.2) : base * clamp(1.15 - v * .22, .55, 1.15);
    wS = wS == null ? w : wS + (w - wS) * .3;
    fctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    fctx.strokeStyle = COLORS[color]; fctx.lineWidth = wS; fctx.lineCap = 'round'; fctx.lineJoin = 'round';
    fctx.beginPath(); fctx.moveTo(last ? last.x : x, last ? last.y : y); fctx.lineTo(x + (last ? 0 : .01), y); fctx.stroke();
    fctx.globalCompositeOperation = 'source-over';
    const m = wS + 4;
    if (!box) box = { x0: x - m, y0: y - m, x1: x + m, y1: y + m };
    else { box.x0 = Math.min(box.x0, x - m); box.y0 = Math.min(box.y0, y - m); box.x1 = Math.max(box.x1, x + m); box.y1 = Math.max(box.y1, y + m); }
    last = { x, y }; dirty = true;
  });

  const backup = mk(), bk = backup.getContext('2d');
  const undoStack = [];
  function pushUndo(e) { undoStack.push(e); if (undoStack.length > 40) undoStack.shift(); }
  function framesSnapshot() { return { type: 'frames', list: frames.map((f) => { const c = mk(); c.getContext('2d').drawImage(f.c, 0, 0); return { id: f.id, c }; }), cur }; }

  let drawing = false, activeId = null;
  function toDoc(e) {
    const r = cv.getBoundingClientRect(); const p = e.pointerType === 'pen' && e.pressure > 0;
    return { x: (e.clientX - r.left) * FW / r.width, y: (e.clientY - r.top) * FH / r.height, pr: p ? e.pressure : null, t: e.timeStamp || performance.now() };
  }
  function down(e) {
    if (drawing) return;
    e.preventDefault();
    if (playing) stop();
    drawing = true; activeId = e.pointerId;
    const f = frames[cur]; fctx = f.c.getContext('2d');
    bk.clearRect(0, 0, FW, FH); bk.drawImage(f.c, 0, 0);
    last = null; wS = null; box = null;
    pen.begin(toDoc(e));
  }
  function moveDraw(e) {
    if (!drawing) return;
    e.preventDefault();
    const list = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
    for (const ev of (list.length ? list : [e])) pen.move(toDoc(ev));
  }
  function up() {
    if (!drawing) return;
    pen.end(); drawing = false; activeId = null;
    if (box) {
      const x = clamp(Math.floor(box.x0), 0, FW), y = clamp(Math.floor(box.y0), 0, FH), w = clamp(Math.ceil(box.x1), 0, FW) - x, h = clamp(Math.ceil(box.y1), 0, FH) - y;
      if (w > 0 && h > 0) pushUndo({ type: 'px', frame: frames[cur], x, y, data: bk.getImageData(x, y, w, h) });
    }
    updateThumb(frames[cur]); scheduleSave();
  }
  Curio.drag(cv, { start: (p) => down(p.event), move: (p) => moveDraw(p.event), end: up });
  addEventListener('curio:touchpad', (e) => { if (e.detail) Curio.toast('Touchpad mode: click the page to put the pen down, move to draw, click again to lift it', 3600); });

  const tint = mk(), tc = tint.getContext('2d'), tint2 = mk(), tc2 = tint2.getContext('2d');
  let tintKey = '';
  function buildTints() {
    const key = `${frames[cur - 1]?.id}:${frames[cur - 2]?.id}:${undoStack.length}:${frames.length}`;
    if (key === tintKey) return; tintKey = key;
    const mkT = (ctx, f, col) => { ctx.globalCompositeOperation = 'source-over'; ctx.clearRect(0, 0, FW, FH); if (!f) return; ctx.drawImage(f.c, 0, 0); ctx.globalCompositeOperation = 'source-in'; ctx.fillStyle = col; ctx.fillRect(0, 0, FW, FH); ctx.globalCompositeOperation = 'source-over'; };
    mkT(tc, frames[cur - 1], '#e0505b'); mkT(tc2, frames[cur - 2], '#4f7be0');
  }
  function drawPage(ctx, f) { ctx.fillStyle = PAPER; ctx.fillRect(0, 0, FW, FH); if (f) ctx.drawImage(f.c, 0, 0); }
  let dirty = true;
  function present() {
    if (playing) return;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
    g.fillStyle = PAPER; g.fillRect(0, 0, FW, FH);
    if (onion && cur > 0) {
      buildTints();
      if (cur > 1) { g.globalAlpha = .12; g.drawImage(tint2, 0, 0); }
      g.globalAlpha = .3; g.drawImage(tint, 0, 0); g.globalAlpha = 1;
    }
    g.drawImage(frames[cur].c, 0, 0);
    $('count').textContent = `${cur + 1} / ${frames.length}`;
  }

  const strip = $('strip');
  function updateThumb(f) {
    if (!f.thumb) return;
    const t = f.thumb.getContext('2d'); t.fillStyle = PAPER; t.fillRect(0, 0, 160, 120); t.drawImage(f.c, 0, 0, 160, 120);
  }
  function buildStrip() {
    strip.innerHTML = '';
    frames.forEach((f, i) => {
      const b = document.createElement('button'); b.className = 'fb-thumb'; b.setAttribute('aria-label', `Frame ${i + 1}`);
      if (!f.thumb) { f.thumb = document.createElement('canvas'); f.thumb.width = 160; f.thumb.height = 120; }
      b.append(f.thumb); const s = document.createElement('span'); s.textContent = i + 1; b.append(s);
      b.addEventListener('click', () => { if (playing) stop(); go(i); });
      strip.append(b); updateThumb(f);
    });
    const add = document.createElement('button'); add.className = 'fb-thumb add'; add.textContent = '＋'; add.setAttribute('aria-label', 'Add frame');
    add.addEventListener('click', () => addFrame(false)); strip.append(add);
    markStrip();
  }
  function markStrip() {
    [...strip.children].forEach((b, i) => b.setAttribute('aria-current', String(i === cur)));
    const el = strip.children[cur]; if (el && el.scrollIntoView) { const sl = strip.scrollLeft, l = el.offsetLeft - strip.offsetLeft; if (l < sl || l + el.offsetWidth > sl + strip.clientWidth) strip.scrollTo({ left: l - strip.clientWidth / 2 + el.offsetWidth / 2, behavior: 'smooth' }); }
  }
  function go(i) { cur = clamp(i, 0, frames.length - 1); markStrip(); dirty = true; Curio.beep(500 + cur * 12, .02, 'triangle', .03); }

  function addFrame(copy) {
    if (frames.length >= MAXF) { Curio.toast(`That is a thick flipbook. Max ${MAXF} pages.`); return; }
    pushUndo(framesSnapshot());
    const f = newFrame(); if (copy) f.c.getContext('2d').drawImage(frames[cur].c, 0, 0);
    frames.splice(cur + 1, 0, f); cur++;
    buildStrip(); dirty = true; scheduleSave();
    Curio.beep(copy ? 620 : 520, .05, 'sine', .06);
  }
  function deleteFrame() {
    if (frames.length === 1) { pushUndo(framesSnapshot()); frames[0].c.getContext('2d').clearRect(0, 0, FW, FH); updateThumb(frames[0]); dirty = true; scheduleSave(); return; }
    pushUndo(framesSnapshot());
    frames.splice(cur, 1); cur = Math.min(cur, frames.length - 1);
    buildStrip(); dirty = true; scheduleSave(); Curio.beep(240, .06, 'triangle', .06);
  }
  function clearFrame() {
    const f = frames[cur], c = f.c.getContext('2d');
    pushUndo({ type: 'px', frame: f, x: 0, y: 0, data: c.getImageData(0, 0, FW, FH) });
    c.clearRect(0, 0, FW, FH); updateThumb(f); dirty = true; scheduleSave();
  }
  function undo() {
    if (playing) stop();
    const e = undoStack.pop(); if (!e) { Curio.toast('Nothing to undo'); return; }
    if (e.type === 'px') { const i = frames.indexOf(e.frame); if (i >= 0) { e.frame.c.getContext('2d').putImageData(e.data, e.x, e.y); updateThumb(e.frame); cur = i; markStrip(); } }
    else { frames = e.list.map((f) => ({ id: f.id, c: f.c, thumb: null })); cur = clamp(e.cur, 0, frames.length - 1); buildStrip(); }
    tintKey = ''; dirty = true; scheduleSave(); Curio.beep(330, .05, 'triangle', .07);
  }

  let playing = false, pIdx = 0, dir = 1, nextAt = 0, trans = null;
  function seqNext(i) {
    const n = frames.length;
    if (n === 1) return 0;
    if (mode === 'loop') return (i + 1) % n;
    if (mode === 'once') return i + 1 < n ? i + 1 : -1;
    let j = i + dir; if (j >= n || j < 0) { dir = -dir; j = i + dir; } return j;
  }
  function play() {
    if (frames.length < 2) { Curio.toast('Add a second frame first. One page does not flip.'); return; }
    playing = true; pIdx = mode === 'once' ? 0 : cur; dir = 1; nextAt = performance.now() + 1000 / fps; trans = null;
    $('play').textContent = '⏸ Stop'; renderPlay(performance.now());
  }
  function stop() { playing = false; $('play').textContent = '▶ Flip it'; cur = pIdx; markStrip(); dirty = true; }
  function renderPlay(now) {
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
    drawPage(g, frames[pIdx]);
    if (trans) {
      const k = clamp((now - trans.t0) / trans.dur, 0, 1);
      if (k >= 1) trans = null;
      else {
        const th = k * Math.PI / 2, c = Math.cos(th), s = Math.sin(th);
        const edge = FW * c;
        const sh = g.createLinearGradient(edge, 0, edge + 90 * s + 10, 0);
        sh.addColorStop(0, `rgba(40,30,20,${.28 * s})`); sh.addColorStop(1, 'rgba(40,30,20,0)');
        g.fillStyle = sh; g.fillRect(edge, 0, 100, FH);
        g.save(); g.setTransform(c, -.18 * s, 0, 1, 0, FH * .09 * s);
        drawPage(g, frames[trans.from]);
        g.fillStyle = `rgba(60,45,30,${.35 * s})`; g.fillRect(0, 0, FW, FH);
        g.restore();
      }
    }
    $('count').textContent = `${pIdx + 1} / ${frames.length}`;
  }
  function tickPlay(now) {
    if (now >= nextAt) {
      const nx = seqNext(pIdx);
      if (nx < 0) { stop(); Curio.beep(660, .08, 'sine', .06); return; }
      const dur = Math.min(150, 450 / fps);
      trans = { from: pIdx, t0: now, dur }; pIdx = nx;
      nextAt += 1000 / fps; if (now - nextAt > 500) nextAt = now + 1000 / fps;
      if (!Curio.muted && fps <= 16) Curio.beep(2600 + Math.random() * 600, .012, 'square', .012);
      [...strip.children].forEach((b, i) => b.setAttribute('aria-current', String(i === pIdx)));
    }
    renderPlay(now);
  }

  function loop(t) {
    if (!document.hidden) {
      if (playing) tickPlay(t);
      else if (dirty) { present(); dirty = false; }
    }
    requestAnimationFrame(loop);
  }

  function exportFrames(w, h) {
    const c = mk(w, h), x = c.getContext('2d', { willReadFrequently: true });
    x.imageSmoothingQuality = 'high';
    return frames.map((f) => { x.fillStyle = PAPER; x.fillRect(0, 0, w, h); x.drawImage(f.c, 0, 0, w, h); return x.getImageData(0, 0, w, h).data; });
  }
  function gifPalette() {
    const pal = [PAPER_RGB.slice()];
    const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.substr(i, 2), 16));
    for (const hex of COLORS) {
      const c = rgb(hex);
      for (let s = 1; s <= 24; s++) { const t = s / 24; pal.push(c.map((v, i) => Math.round(PAPER_RGB[i] + (v - PAPER_RGB[i]) * t))); }
    }
    return pal.slice(0, 256);
  }
  function download(blob, name) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }
  async function exportGif() {
    if (playing) stop();
    Curio.toast('Encoding your GIF...');
    await new Promise((r) => setTimeout(r, 30));
    const w = 480, h = 360, data = exportFrames(w, h);
    let seq = frames.map((_, i) => i);
    if (mode === 'pingpong' && frames.length > 2) seq = seq.concat(seq.slice(1, -1).reverse());
    const bytes = window.CurioGif.encode({ width: w, height: h, frames: seq.map((i) => data[i]), delays: seq.map(() => 100 / fps), palette: gifPalette(), loop: mode !== 'once' });
    download(new Blob([bytes], { type: 'image/gif' }), 'curio-flipbook.gif');
    Curio.toast(`GIF saved: ${seq.length} frames, ${Math.round(bytes.length / 1024)} KB`); Curio.beep(880, .08, 'triangle', .08);
  }
  function exportSheet() {
    const n = frames.length, cols = Math.min(6, n), rows = Math.ceil(n / cols), cw = 240, ch = 180, pad = 14;
    const c = mk(cols * (cw + pad) + pad, rows * (ch + pad + 18) + pad), x = c.getContext('2d');
    x.fillStyle = '#efe9da'; x.fillRect(0, 0, c.width, c.height);
    frames.forEach((f, i) => {
      const cx = pad + (i % cols) * (cw + pad), cy = pad + Math.floor(i / cols) * (ch + pad + 18);
      x.fillStyle = PAPER; x.fillRect(cx, cy, cw, ch); x.drawImage(f.c, cx, cy, cw, ch);
      x.strokeStyle = '#d6cdb6'; x.strokeRect(cx + .5, cy + .5, cw - 1, ch - 1);
      x.fillStyle = '#8a826f'; x.font = '700 13px ui-monospace, monospace'; x.fillText(`#${i + 1}`, cx, cy + ch + 14);
    });
    c.toBlob((b) => { if (b) { download(b, 'curio-flipbook-sheet.png'); Curio.toast('Frame sheet saved'); } }, 'image/png');
  }

  function hand(ctx, col, w) { ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; }
  const j = (a) => (Math.random() - .5) * a;
  function wobblyCircle(ctx, x, y, rx, ry) { ctx.beginPath(); for (let i = 0; i <= 36; i++) { const a = i / 36 * Math.PI * 2, r = 1 + j(.03); const px = x + Math.cos(a) * rx * r, py = y + Math.sin(a) * ry * r; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.closePath(); }
  function line(ctx, pts) { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x + j(2), y + j(2)) : ctx.moveTo(x + j(2), y + j(2)))); ctx.stroke(); }
  const STARTERS = {
    ball: () => Array.from({ length: 12 }, (_, i) => {
      const f = newFrame(), c = f.c.getContext('2d'), t = i / 12;
      const hgt = Math.abs(Math.cos(t * Math.PI)), y = 600 - hgt * 420, sq = hgt < .15 ? 1 - (.15 - hgt) * 3 : 1 + (1 - hgt) * .08;
      const x = 180 + t * 600;
      hand(c, COLORS[0], 6); line(c, [[60, 660], [900, 660]]);
      hand(c, COLORS[9], 4); c.globalAlpha = .5; wobblyCircle(c, x, 664, 70 * (1.2 - hgt * .6), 10); c.fill(); c.globalAlpha = 1;
      hand(c, COLORS[1], 7); wobblyCircle(c, x, y - 60 * sq + 60, 62 / Math.sqrt(sq), 62 * sq); c.fillStyle = '#ff8a8c'; c.fill(); c.stroke();
      hand(c, COLORS[0], 5); line(c, [[x - 30, y - 10], [x + 30, y - 30]]);
      return f;
    }),
    wave: () => Array.from({ length: 8 }, (_, i) => {
      const f = newFrame(), c = f.c.getContext('2d'), a = Math.sin(i / 8 * Math.PI * 2);
      hand(c, COLORS[0], 7);
      wobblyCircle(c, 480, 220, 60, 64); c.stroke();
      c.beginPath(); c.arc(480, 232, 30, .2 * Math.PI, .8 * Math.PI); c.stroke();
      c.beginPath(); c.arc(458, 205, 5, 0, Math.PI * 2); c.arc(502, 205, 5, 0, Math.PI * 2); c.fill();
      line(c, [[480, 284], [480, 480]]);
      line(c, [[480, 480], [420, 620]]); line(c, [[480, 480], [540, 620]]);
      line(c, [[480, 330], [400, 420]]);
      const ex = 560, ey = 300, ang = -1.1 + a * .5;
      line(c, [[480, 330], [ex, ey], [ex + Math.cos(ang) * 90, ey + Math.sin(ang) * 90]]);
      hand(c, COLORS[5], 4);
      if (a > .3) { line(c, [[ex + 120, ey - 120], [ex + 150, ey - 140]]); line(c, [[ex + 130, ey - 90], [ex + 165, ey - 95]]); }
      hand(c, COLORS[2], 6); c.font = '900 64px "Comic Sans MS", "Chalkboard SE", sans-serif'; if (i % 4 < 2) c.fillText('hi!', 610, 160);
      return f;
    }),
    flower: () => Array.from({ length: 12 }, (_, i) => {
      const f = newFrame(), c = f.c.getContext('2d'), t = Math.min(1, i / 6), b = clamp((i - 5) / 6, 0, 1);
      hand(c, COLORS[8], 6); line(c, [[200, 660], [760, 660]]);
      hand(c, COLORS[4], 8);
      const top = 660 - t * 360;
      c.beginPath(); c.moveTo(480, 660); c.quadraticCurveTo(450, 660 - t * 180, 480, top); c.stroke();
      if (t > .5) { c.beginPath(); c.ellipse(440, 560, 40 * t, 16 * t, -.5, 0, Math.PI * 2); c.fillStyle = '#7fd08f'; c.fill(); c.stroke(); }
      if (b > 0) {
        hand(c, COLORS[7], 6);
        for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + b * .3; c.beginPath(); c.ellipse(480 + Math.cos(a) * 60 * b, top + Math.sin(a) * 60 * b, 46 * b + 2, 22 * b + 2, a, 0, Math.PI * 2); c.fillStyle = '#ffb3d6'; c.fill(); c.stroke(); }
        hand(c, COLORS[3], 6); wobblyCircle(c, 480, top, 34 * b + 6, 34 * b + 6); c.fillStyle = '#ffe066'; c.fill(); c.strokeStyle = COLORS[2]; c.stroke();
      } else { hand(c, COLORS[4], 6); wobblyCircle(c, 480, top, 18, 26); c.fillStyle = '#9be0a5'; c.fill(); c.stroke(); }
      return f;
    }),
    rocket: () => Array.from({ length: 10 }, (_, i) => {
      const f = newFrame(), c = f.c.getContext('2d'), t = i / 9, y = 520 - t * t * 620;
      hand(c, COLORS[3], 4);
      for (let k = 0; k < 14; k++) { const sx = (k * 197) % 900 + 30, sy = ((k * 131) % 520 + i * 40 * t) % 700; line(c, [[sx - 8, sy], [sx + 8, sy]]); line(c, [[sx, sy - 8], [sx, sy + 8]]); }
      hand(c, COLORS[0], 6); line(c, [[100, 680], [860, 680]]);
      hand(c, COLORS[1], 7);
      c.beginPath(); c.moveTo(480, y - 130); c.quadraticCurveTo(540, y - 60, 530, y + 60); c.lineTo(430, y + 60); c.quadraticCurveTo(420, y - 60, 480, y - 130); c.closePath(); c.fillStyle = '#f2f2f2'; c.fill(); c.stroke();
      hand(c, COLORS[5], 6); wobblyCircle(c, 480, y - 30, 22, 22); c.fillStyle = '#9cc9ff'; c.fill(); c.stroke();
      hand(c, COLORS[1], 7); line(c, [[430, y + 20], [395, y + 80], [432, y + 60]]); line(c, [[530, y + 20], [565, y + 80], [528, y + 60]]);
      if (i > 0) { hand(c, COLORS[2], 6); const fl = 60 + (i % 2) * 40; c.beginPath(); c.moveTo(445, y + 64); c.quadraticCurveTo(480, y + 64 + fl * 1.6, 515, y + 64); c.fillStyle = '#ffd34d'; c.fill(); c.stroke(); }
      if (i < 3) { hand(c, COLORS[9], 5); for (let k = 0; k < 5; k++) { wobblyCircle(c, 400 + k * 40, 660 - (i * 10), 26, 18); c.stroke(); } }
      return f;
    })
  };
  async function loadStarter(name) {
    if (playing) stop();
    const hasArt = frames.length > 1 || undoStack.length > 0;
    if (hasArt) {
      const ok = await Curio.modal({ emoji: '📒', title: 'Swap in a starter?', body: 'This replaces your current pages. Undo can bring them back.', buttons: [{ label: 'Load it', value: true }, { label: 'Keep mine', value: false }] });
      if (!ok) return;
    }
    pushUndo(framesSnapshot());
    frames = STARTERS[name](); cur = 0; tintKey = '';
    buildStrip(); dirty = true; scheduleSave();
    Curio.toast('Loaded. Press Flip it!');
    if (name === 'ball') { fps = 12; } else if (name === 'wave') { fps = 8; } else if (name === 'flower') { fps = 6; } else { fps = 10; }
    syncUi();
  }

  let saveT = 0, warned = false;
  function scheduleSave() {
    clearTimeout(saveT);
    saveT = setTimeout(() => {
      Curio.store.set('flipbook:state', { color, width, onion, fps, mode });
      try {
        const urls = frames.map((f) => f.c.toDataURL('image/png'));
        const total = urls.reduce((a, u) => a + u.length, 0);
        if (total < 3800000) Curio.store.set('flipbook:frames', urls);
        else if (!warned) { warned = true; Curio.toast('Too many pages to autosave. Export a GIF to keep it.'); }
      } catch {}
    }, 800);
  }
  function restore() {
    const urls = Curio.store.get('flipbook:frames', null);
    if (!Array.isArray(urls) || !urls.length) { frames = STARTERS.ball(); fps = saved.fps || 12; cur = 0; buildStrip(); dirty = true; syncUi(); return; }
    frames = urls.map(() => newFrame()); cur = 0; buildStrip();
    urls.forEach((u, i) => { const im = new Image(); im.onload = () => { frames[i]?.c.getContext('2d').drawImage(im, 0, 0); if (frames[i]) updateThumb(frames[i]); tintKey = ''; dirty = true; }; im.src = u; });
  }

  const pal = $('pal');
  COLORS.forEach((hex, i) => {
    const b = document.createElement('button'); b.className = 'fb-sw'; b.style.background = hex; b.setAttribute('aria-label', `Colour ${i + 1}`);
    b.addEventListener('click', () => { color = i; if (tool === 'eraser') tool = 'pen'; syncUi(); scheduleSave(); });
    pal.append(b);
  });
  function syncUi() {
    document.querySelectorAll('[data-tool]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tool === tool)));
    document.querySelectorAll('[data-w]').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.w === width)));
    document.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
    [...pal.children].forEach((b, i) => b.setAttribute('aria-pressed', String(i === color && tool === 'pen')));
    $('onion').setAttribute('aria-pressed', String(onion));
    $('fps').value = fps; $('fpsV').textContent = `${fps} fps`;
  }
  document.querySelectorAll('[data-tool]').forEach((b) => b.addEventListener('click', () => { tool = b.dataset.tool; syncUi(); }));
  document.querySelectorAll('[data-w]').forEach((b) => b.addEventListener('click', () => { width = +b.dataset.w; syncUi(); scheduleSave(); }));
  document.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => { mode = b.dataset.mode; syncUi(); scheduleSave(); }));
  document.querySelectorAll('[data-starter]').forEach((b) => b.addEventListener('click', () => loadStarter(b.dataset.starter)));
  $('onion').addEventListener('click', () => { onion = !onion; syncUi(); dirty = true; scheduleSave(); });
  $('fps').addEventListener('input', (e) => { fps = +e.target.value; $('fpsV').textContent = `${fps} fps`; scheduleSave(); });
  $('undo').addEventListener('click', undo);
  $('clearf').addEventListener('click', clearFrame);
  $('add').addEventListener('click', () => addFrame(false));
  $('dup').addEventListener('click', () => addFrame(true));
  $('del').addEventListener('click', deleteFrame);
  $('play').addEventListener('click', () => (playing ? stop() : play()));
  $('gif').addEventListener('click', exportGif);
  $('sheet').addEventListener('click', exportSheet);
  addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input, button') && e.key === ' ') return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); return; }
    if (e.key === ' ') { e.preventDefault(); playing ? stop() : play(); }
    else if (e.key === 'ArrowRight') { if (playing) stop(); go(cur + 1); }
    else if (e.key === 'ArrowLeft') { if (playing) stop(); go(cur - 1); }
    else if (e.key === 'n' || e.key === 'N') addFrame(false);
    else if (e.key === 'd' || e.key === 'D') addFrame(true);
    else if (e.key === 'o' || e.key === 'O') $('onion').click();
    else if (e.ctrlKey || e.metaKey || e.altKey) return;
    else if (e.key === 'u' || e.key === 'U') undo();
    else if (e.key === 'e' || e.key === 'E') { tool = tool === 'eraser' ? 'pen' : 'eraser'; syncUi(); }
    else if (e.key === 'p' || e.key === 'P') { tool = 'pen'; syncUi(); }
  });

  syncUi(); restore();
  if (!Curio.touchpad && !Curio.store.get('tp-hint-flipbook', false) && matchMedia('(pointer: fine)').matches) { Curio.store.set('tp-hint-flipbook', true); setTimeout(() => Curio.toast('Tip: on a laptop touchpad, turn on Touchpad mode in the top bar: click to put the pen down, click again to lift it', 4200), 1800); }
  requestAnimationFrame(loop);
})();
