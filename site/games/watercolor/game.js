(() => {
  const GW = 600, GH = 400, S = 2.5, DW = 1500, DH = 1000, N = GW * GH;
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const cv = $('cv'), g = cv.getContext('2d');
  cv.width = DW; cv.height = DH;
  const PR = 253, PG = 250, PB = 243;

  const PIG = [
    ['Hansa Yellow', '#f3cd10', 0], ['Cadmium Orange', '#ee861c', .1], ['Cadmium Red', '#d0362a', .2], ['Quinacridone Rose', '#d2336f', 0],
    ['Dioxazine Violet', '#5a2e90', .15], ['Ultramarine', '#2a46b6', 1], ['Cerulean', '#2a8acb', .85], ['Phthalo Green', '#0d7a66', 0],
    ['Sap Green', '#5b8a2b', .2], ['Yellow Ochre', '#c8952e', .7], ['Burnt Sienna', '#a14e29', .9], ["Payne's Grey", '#37444f', .35]
  ].map(([name, hex, gran]) => {
    const c = [1, 3, 5].map((i) => parseInt(hex.substr(i, 2), 16));
    const pc = [PR, PG, PB];
    return { name, hex, gran, K: c.map((v, i) => -Math.log(Math.max(6, v) / pc[i])) };
  });

  const Wt = new Float32Array(N), A0 = new Float32Array(N), A1 = new Float32Array(N), A2 = new Float32Array(N), Q = new Float32Array(N);
  const D0 = new Float32Array(N), D1 = new Float32Array(N), D2 = new Float32Array(N), hgt = new Float32Array(N);
  const dW = new Float32Array(N), dA0 = new Float32Array(N), dA1 = new Float32Array(N), dA2 = new Float32Array(N), dQ = new Float32Array(N);
  const STATE = [Wt, A0, A1, A2, Q, D0, D1, D2];

  let seed = 99;
  const srnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  (function makePaper() {
    const a = new Float32Array(N), b = new Float32Array(N);
    for (let i = 0; i < N; i++) { a[i] = srnd(); b[i] = srnd(); }
    const blur = (src, r) => {
      const t = new Float32Array(N), o = new Float32Array(N);
      for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { let s = 0, n = 0; for (let k = -r; k <= r; k++) { const xx = x + k; if (xx >= 0 && xx < GW) { s += src[y * GW + xx]; n++; } } t[y * GW + x] = s / n; }
      for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { let s = 0, n = 0; for (let k = -r; k <= r; k++) { const yy = y + k; if (yy >= 0 && yy < GH) { s += t[yy * GW + x]; n++; } } o[y * GW + x] = s / n; }
      return o;
    };
    const f = blur(a, 1), m = blur(blur(b, 3), 2);
    let lo = 9, hi = -9;
    for (let i = 0; i < N; i++) { const v = f[i] * .55 + m[i] * 1.6; hgt[i] = v; lo = Math.min(lo, v); hi = Math.max(hi, v); }
    for (let i = 0; i < N; i++) hgt[i] = (hgt[i] - lo) / (hi - lo);
  })();
  const tex = mk(DW, DH);
  (function makeTex() {
    const s = mk(GW, GH), sc = s.getContext('2d'), id = sc.createImageData(GW, GH), d = id.data;
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
      const i = y * GW + x, a = hgt[Math.max(0, i - GW - 1)], b = hgt[Math.min(N - 1, i + GW + 1)];
      const v = clamp(249 + (a - b) * 22 + (hgt[i] - .5) * 5, 228, 255);
      d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255;
    }
    sc.putImageData(id, 0, 0);
    const t = tex.getContext('2d'); t.imageSmoothingQuality = 'high'; t.drawImage(s, 0, 0, DW, DH);
    const big = t.getImageData(0, 0, DW, DH), bd = big.data;
    for (let i = 0; i < bd.length; i += 4) { const n = (srnd() - .5) * 6; bd[i] = clamp(bd[i] + n, 0, 255); bd[i + 1] = clamp(bd[i + 1] + n, 0, 255); bd[i + 2] = clamp(bd[i + 2] + n, 0, 255); }
    t.putImageData(big, 0, 0);
  })();

  const EXP = new Float32Array(4097);
  for (let i = 0; i <= 4096; i++) EXP[i] = Math.exp(-i / 400);
  const ex = (v) => EXP[v >= 10.24 ? 4096 : (v * 400) | 0];

  const grid = mk(GW, GH), gc = grid.getContext('2d');
  const img = gc.createImageData(GW, GH), px = img.data;
  for (let i = 0; i < N; i++) { px[i * 4] = PR; px[i * 4 + 1] = PG; px[i * 4 + 2] = PB; px[i * 4 + 3] = 255; }
  gc.putImageData(img, 0, 0);

  let box = null, rbox = null;
  const addBox = (b, x0, y0, x1, y1) => {
    x0 = clamp(x0 | 0, 0, GW - 1); y0 = clamp(y0 | 0, 0, GH - 1); x1 = clamp(Math.ceil(x1), 0, GW - 1); y1 = clamp(Math.ceil(y1), 0, GH - 1);
    if (!b) return { x0, y0, x1, y1 };
    b.x0 = Math.min(b.x0, x0); b.y0 = Math.min(b.y0, y0); b.x1 = Math.max(b.x1, x1); b.y1 = Math.max(b.y1, y1); return b;
  };

  const WET = .02;
  let evapBase = .0012, dryerUntil = 0, frameK = 1;
  function step() {
    if (!box) return;
    const x0 = Math.max(0, box.x0 - 2), y0 = Math.max(0, box.y0 - 2), x1 = Math.min(GW - 1, box.x1 + 2), y1 = Math.min(GH - 1, box.y1 + 2);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const i = y * GW + x;
        for (let k = 0; k < 2; k++) {
          if (k === 0 ? x >= x1 : y >= y1) continue;
          const j = k === 0 ? i + 1 : i + GW;
          const wi = Wt[i], wj = Wt[j];
          if (wi < 1e-4 && wj < 1e-4) continue;
          const iw = wi > WET, jw = wj > WET;
          let f;
          if (iw && jw) f = .15 * (wi - wj);
          else if (iw && wi > .42) f = .025 * (wi - wj) * (1.25 - hgt[j]);
          else if (jw && wj > .42) f = .025 * (wi - wj) * (1.25 - hgt[i]);
          else continue;
          dW[i] -= f; dW[j] += f;
          let s, d, c;
          if (f > 0) { s = i; d = j; c = f / Math.max(wi, .03); } else { s = j; d = i; c = -f / Math.max(wj, .03); }
          if (c > .3) c = .3;
          let m = A0[s] * c; dA0[s] -= m; dA0[d] += m;
          m = A1[s] * c; dA1[s] -= m; dA1[d] += m;
          m = A2[s] * c; dA2[s] -= m; dA2[d] += m;
          m = Q[s] * c; dQ[s] -= m; dQ[d] += m;
          if (iw && jw) {
            const kk = .035;
            m = (A0[i] - A0[j]) * kk; dA0[i] -= m; dA0[j] += m;
            m = (A1[i] - A1[j]) * kk; dA1[i] -= m; dA1[j] += m;
            m = (A2[i] - A2[j]) * kk; dA2[i] -= m; dA2[j] += m;
            m = (Q[i] - Q[j]) * kk; dQ[i] -= m; dQ[j] += m;
          }
        }
      }
    }
    const evap = evapBase * frameK * (performance.now() < dryerUntil ? 14 : 1);
    let nb = null;
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const i = y * GW + x;
        if (dW[i] !== 0) { Wt[i] += dW[i]; dW[i] = 0; }
        if (dA0[i] !== 0 || dA1[i] !== 0 || dA2[i] !== 0 || dQ[i] !== 0) {
          A0[i] = Math.max(0, A0[i] + dA0[i]); A1[i] = Math.max(0, A1[i] + dA1[i]); A2[i] = Math.max(0, A2[i] + dA2[i]); Q[i] = Math.max(0, Q[i] + dQ[i]);
          dA0[i] = dA1[i] = dA2[i] = dQ[i] = 0;
        }
        const w = Wt[i];
        if (w <= 0) { if (A0[i] + A1[i] + A2[i] > 0) { D0[i] += A0[i]; D1[i] += A1[i]; D2[i] += A2[i]; A0[i] = A1[i] = A2[i] = Q[i] = 0; } continue; }
        const n = (x === 0 || Wt[i - 1] < WET) + (x === GW - 1 || Wt[i + 1] < WET) + (y === 0 || Wt[i - GW] < WET) + (y === GH - 1 || Wt[i + GW] < WET);
        const nw = w - evap * (1 + 3.2 * n) * (.7 + .6 * hgt[i]);
        if (nw < .012) {
          D0[i] += A0[i]; D1[i] += A1[i]; D2[i] += A2[i]; A0[i] = A1[i] = A2[i] = Q[i] = 0; Wt[i] = 0;
        } else {
          Wt[i] = nw;
          const sa = A0[i] + A1[i] + A2[i];
          if (sa > 1e-5) {
            const ws = nw > .6 ? 1 : nw / .6;
            let rate = .0025 + .03 * (1 - ws) * (1 - ws);
            const gr = Q[i] / sa;
            let mult = 1 + gr * 3.2 * (.5 - hgt[i]); if (mult < .1) mult = .1;
            rate *= mult; if (rate > 1) rate = 1;
            let m = A0[i] * rate; A0[i] -= m; D0[i] += m;
            m = A1[i] * rate; A1[i] -= m; D1[i] += m;
            m = A2[i] * rate; A2[i] -= m; D2[i] += m;
            Q[i] *= 1 - rate;
          }
          if (!nb) nb = { x0: x, y0: y, x1: x, y1: y };
          else { if (x < nb.x0) nb.x0 = x; if (x > nb.x1) nb.x1 = x; if (y < nb.y0) nb.y0 = y; if (y > nb.y1) nb.y1 = y; }
        }
      }
    }
    rbox = addBox(rbox, x0, y0, x1, y1);
    box = nb;
  }

  function render() {
    if (!rbox) return;
    const { x0, y0, x1, y1 } = rbox;
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const i = y * GW + x, o = i * 4, w = Wt[i];
        const sheen = w > WET ? 1 - Math.min(.05, w * .04) : 1;
        px[o] = PR * ex(D0[i] + A0[i]) * sheen;
        px[o + 1] = PG * ex(D1[i] + A1[i]) * sheen;
        px[o + 2] = PB * ex(D2[i] + A2[i]) * sheen;
      }
    }
    gc.putImageData(img, 0, 0, x0, y0, x1 - x0 + 1, y1 - y0 + 1);
    rbox = null; dirty = true;
  }

  const saved = Curio.store.get('watercolor:state', {});
  let tool = 'paint', size = saved.size || 40, water = saved.water ?? .6, mix = saved.mix || [5], mixing = false;
  let brushK = [0, 0, 0], brushG = 0, load = 1, hover = null;
  function computeBrush() {
    const ks = [0, 0, 0]; let gsum = 0;
    for (const p of mix) { PIG[p].K.forEach((k, c) => { ks[c] += k / mix.length; }); gsum += PIG[p].gran / mix.length; }
    brushK = ks; brushG = gsum;
  }

  function stamp(xd, yd, rd, pr) {
    const gx = xd / S, gy = yd / S, rg = Math.max(1.2, rd / S);
    const bx0 = Math.max(0, Math.floor(gx - rg - 1)), bx1 = Math.min(GW - 1, Math.ceil(gx + rg + 1));
    const by0 = Math.max(0, Math.floor(gy - rg - 1)), by1 = Math.min(GH - 1, Math.ceil(gy + rg + 1));
    const bw = (.22 + water * 1.05) * (.55 + .45 * load);
    const strength = (1.3 - water * .75) * (.35 + .65 * load) * (pr == null ? 1 : .6 + pr * .6);
    const dry = bw < .36;
    const ksum = brushK[0] + brushK[1] + brushK[2];
    for (let y = by0; y <= by1; y++) {
      for (let x = bx0; x <= bx1; x++) {
        const dx = x + .5 - gx, dy = y + .5 - gy, d = Math.sqrt(dx * dx + dy * dy) / rg;
        if (d > 1) continue;
        const i = y * GW + x;
        let f = d < .8 ? 1 : (1 - d) / .2;
        if (d > .75 && hgt[i] < (d - .75) * 3) f *= .3;
        if (tool === 'paint') {
          if (dry) {
            const th = .62 - (bw - .22) * 1.3 - (pr || .5) * .15;
            const tf = hgt[i] > th ? 1 : .08;
            const p = strength * f * tf * .05;
            D0[i] += brushK[0] * p; D1[i] += brushK[1] * p; D2[i] += brushK[2] * p;
            if (Wt[i] > WET) { A0[i] += brushK[0] * p * .5; A1[i] += brushK[1] * p * .5; A2[i] += brushK[2] * p * .5; }
          } else {
            if (bw > Wt[i]) Wt[i] += (bw - Wt[i]) * f * .45;
            if (A0[i] + A1[i] + A2[i] < 7) {
              const p = strength * f * .085;
              A0[i] += brushK[0] * p; A1[i] += brushK[1] * p; A2[i] += brushK[2] * p; Q[i] += brushG * ksum * p;
            }
          }
        } else {
          const tw = 1.15;
          if (tw > Wt[i]) Wt[i] += (tw - Wt[i]) * f * .45;
          const l = .11 * f;
          let m = D0[i] * l; D0[i] -= m; A0[i] += m;
          m = D1[i] * l; D1[i] -= m; A1[i] += m;
          m = D2[i] * l; D2[i] -= m; A2[i] += m;
          const k = 1 - .18 * f; A0[i] *= k; A1[i] *= k; A2[i] *= k; Q[i] *= k;
        }
      }
    }
    box = addBox(box, bx0, by0, bx1, by1);
    rbox = addBox(rbox, bx0, by0, bx1, by1);
  }

  function makeSampler(spacing, emit, K = .5) {
    let sm, raw, pPrev, mPrev, left = 0, vel = 0, prS = null;
    function walk(x0, y0, cx, cy, x1, y1, pa, pb) {
      const est = Math.hypot(cx - x0, cy - y0) + Math.hypot(x1 - cx, y1 - cy);
      const n = Math.max(1, Math.ceil(est / 1.5));
      let px0 = x0, py0 = y0;
      for (let i = 1; i <= n; i++) {
        const t = i / n, u = 1 - t;
        const x = u * u * x0 + 2 * u * t * cx + t * t * x1, y = u * u * y0 + 2 * u * t * cy + t * t * y1;
        let d = Math.hypot(x - px0, y - py0), sp = spacing();
        while (d > 0 && left + d >= sp) {
          const f = (sp - left) / d;
          px0 += (x - px0) * f; py0 += (y - py0) * f;
          emit(px0, py0, pa == null ? null : pa + (pb - pa) * t, vel, false);
          d = Math.hypot(x - px0, y - py0); left = 0; sp = spacing();
        }
        left += d; px0 = x; py0 = y;
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
      end() { walk(mPrev.x, mPrev.y, pPrev.x, pPrev.y, raw.x, raw.y, prS, prS); }
    };
  }

  let rS = null, travelled = 0, lastPt = null;
  function radiusFor(pr, v) {
    let r = pr != null ? size * (.25 + .9 * pr) : size * clamp(1.08 - v * .18, .6, 1.08);
    rS = rS == null ? r : rS + (r - rS) * .2;
    return rS;
  }
  const sampler = makeSampler(() => Math.max(1.5, (rS || size) * .18), (x, y, pr, v) => {
    if (lastPt) { const d = Math.hypot(x - lastPt.x, y - lastPt.y); travelled += d; load = Math.max(.15, load - d * .00022 * (1.3 - water * .6)); }
    lastPt = { x, y };
    stamp(x, y, radiusFor(pr, v), pr);
  });

  const undoStack = [];
  function snapshot() {
    const snap = STATE.map((a) => { const u = new Uint16Array(N); for (let i = 0; i < N; i++) u[i] = Math.min(65535, a[i] * 4096); return u; });
    undoStack.push(snap); if (undoStack.length > 10) undoStack.shift();
  }
  function restoreSnap(snap) {
    STATE.forEach((a, k) => { const u = snap[k]; for (let i = 0; i < N; i++) a[i] = u[i] / 4096; });
    box = null;
    for (let i = 0; i < N; i++) if (Wt[i] > 0) { box = { x0: 0, y0: 0, x1: GW - 1, y1: GH - 1 }; break; }
    rbox = { x0: 0, y0: 0, x1: GW - 1, y1: GH - 1 };
  }

  let drawing = false, activeId = null;
  function toDoc(e) {
    const r = cv.getBoundingClientRect(); const pen = e.pointerType === 'pen' && e.pressure > 0;
    return { x: (e.clientX - r.left) * DW / r.width, y: (e.clientY - r.top) * DH / r.height, pr: pen ? e.pressure : null, t: e.timeStamp || performance.now() };
  }
  function startStroke(e) {
    if (drawing) return;
    e.preventDefault();
    drawing = true; activeId = e.pointerId; snapshot();
    load = 1; rS = null; travelled = 0; lastPt = null;
    sampler.begin(toDoc(e));
    if (tool === 'lift') Curio.beep(700, .05, 'sine', .03);
  }
  cv.addEventListener('pointermove', (e) => { hover = toDoc(e); dirty = true; });
  function moveStroke(e) {
    if (!drawing) return;
    hover = toDoc(e); dirty = true;
    e.preventDefault();
    const list = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
    for (const ev of (list.length ? list : [e])) sampler.move(toDoc(ev));
  }
  const end = () => { if (!drawing) return; sampler.end(); drawing = false; activeId = null; };
  Curio.drag(cv, { start: (p) => startStroke(p.event), move: (p) => moveStroke(p.event), end });
  addEventListener('curio:touchpad', (e) => { if (e.detail) Curio.toast('Touchpad mode: click the paper to touch the brush down, move to paint, click again to lift it', 3600); });
  cv.addEventListener('pointerleave', () => { hover = null; dirty = true; });

  let dirty = true;
  function present() {
    g.globalCompositeOperation = 'source-over'; g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(grid, 0, 0, DW, DH);
    g.globalCompositeOperation = 'multiply'; g.drawImage(tex, 0, 0);
    g.globalCompositeOperation = 'source-over';
    if (hover && !drawing && matchMedia('(hover: hover)').matches) {
      g.strokeStyle = 'rgba(40,40,60,.35)'; g.lineWidth = 2; g.beginPath(); g.arc(hover.x, hover.y, size, 0, Math.PI * 2); g.stroke();
    }
  }

  let wetShown = '', saveT = 0, wasWet = false, lastT = performance.now();
  function loop(t) {
    frameK = clamp((t - lastT) / 16.7, .5, 3); lastT = t;
    if (!document.hidden) {
      if (box) { step(); step(); }
      render();
      const isWet = !!box;
      const label = !isWet ? 'Dry' : performance.now() < dryerUntil ? 'Drying fast...' : 'Wet';
      if (label !== wetShown) { wetShown = label; $('wet').textContent = label === 'Dry' ? '☀️ Dry' : label === 'Wet' ? '💧 Wet' : '🌬️ ' + label; }
      if (wasWet && !isWet) scheduleSave();
      wasWet = isWet;
      if (dirty) { present(); dirty = false; }
    }
    requestAnimationFrame(loop);
  }

  function driedImage() {
    const c = mk(GW, GH), x = c.getContext('2d'), id = x.createImageData(GW, GH), d = id.data;
    for (let i = 0; i < N; i++) { d[i * 4] = PR * ex(D0[i] + A0[i]); d[i * 4 + 1] = PG * ex(D1[i] + A1[i]); d[i * 4 + 2] = PB * ex(D2[i] + A2[i]); d[i * 4 + 3] = 255; }
    x.putImageData(id, 0, 0); return c;
  }
  function scheduleSave() {
    clearTimeout(saveT);
    saveT = setTimeout(() => {
      Curio.store.set('watercolor:state', { size, water, mix });
      try { Curio.store.set('watercolor:art', driedImage().toDataURL('image/png')); } catch {}
    }, 400);
  }
  function restoreArt() {
    const url = Curio.store.get('watercolor:art', null);
    if (!url) { welcome(); return; }
    const im = new Image();
    im.onload = () => {
      const c = mk(GW, GH), x = c.getContext('2d'); x.drawImage(im, 0, 0);
      const d = x.getImageData(0, 0, GW, GH).data;
      for (let i = 0; i < N; i++) { D0[i] = -Math.log(Math.max(1, d[i * 4]) / PR); D1[i] = -Math.log(Math.max(1, d[i * 4 + 1]) / PG); D2[i] = -Math.log(Math.max(1, d[i * 4 + 2]) / PB); if (D0[i] < 0) D0[i] = 0; if (D1[i] < 0) D1[i] = 0; if (D2[i] < 0) D2[i] = 0; }
      rbox = { x0: 0, y0: 0, x1: GW - 1, y1: GH - 1 };
    };
    im.src = url;
  }
  function welcome() {
    const keep = { mix, water, size, tool };
    const run = (m, w, sz, pts) => {
      mix = m; water = w; size = sz; computeBrush(); load = 1; rS = null; lastPt = null;
      sampler.begin({ x: pts[0][0], y: pts[0][1], pr: null, t: 0 });
      let tt = 0;
      for (let k = 1; k < pts.length; k++) for (let q = 1; q <= 8; q++) { tt += 20; sampler.move({ x: pts[k - 1][0] + (pts[k][0] - pts[k - 1][0]) * q / 8, y: pts[k - 1][1] + (pts[k][1] - pts[k - 1][1]) * q / 8, pr: null, t: tt }); }
      sampler.end();
    };
    run([3], .9, 110, [[60, 90], [500, 110], [1000, 80], [1450, 100]]);
    run([3, 1], .9, 110, [[1450, 220], [1000, 200], [500, 230], [60, 210]]);
    run([0], .95, 110, [[60, 330], [500, 350], [1000, 320], [1450, 340]]);
    run([1, 2], .5, 60, [[1100, 470], [1112, 466], [1124, 470]]);
    run([5, 11], .55, 70, [[40, 760], [300, 640], [520, 700], [760, 620], [1000, 720], [1240, 650], [1460, 700]]);
    run([5, 11], .6, 110, [[40, 900], [500, 860], [1000, 900], [1460, 860]]);
    mix = keep.mix; water = keep.water; size = keep.size; tool = keep.tool; computeBrush();
  }

  async function clearAll() {
    const ok = await Curio.modal({ emoji: '🎨', title: 'New sheet?', body: 'Tape down a fresh sheet of cold-press paper. Undo brings the old one back.', buttons: [{ label: 'Fresh paper', value: true }, { label: 'Keep painting', value: false }] });
    if (!ok) return;
    snapshot();
    STATE.forEach((a) => a.fill(0)); box = null; rbox = { x0: 0, y0: 0, x1: GW - 1, y1: GH - 1 };
    scheduleSave(); Curio.beep(520, .1, 'sine', .06);
  }
  function undo() {
    const s = undoStack.pop(); if (!s) { Curio.toast('Nothing to undo'); return; }
    drawing = false; restoreSnap(s); scheduleSave(); Curio.beep(330, .05, 'triangle', .07);
  }
  function savePng() {
    hover = null; render(); present();
    cv.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'curio-watercolour.png';
      document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      Curio.toast('Saved. Frame it, it has earned it.'); Curio.beep(880, .08, 'triangle', .08);
    }, 'image/png');
  }
  function hairDryer() {
    if (!box) { Curio.toast('Already bone dry'); return; }
    dryerUntil = performance.now() + 1800; Curio.toast('Vrrrrrrr');
    const ac = !Curio.muted && Curio.audioContext && Curio.audioContext();
    if (ac) {
      const len = ac.sampleRate * 1.8, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.min(1, i / 4000, (len - i) / 8000);
      const src = ac.createBufferSource(), f = ac.createBiquadFilter(), gn = ac.createGain();
      f.type = 'lowpass'; f.frequency.value = 900; gn.gain.value = .08;
      src.buffer = buf; src.connect(f).connect(gn).connect(ac.destination); src.start();
    }
  }

  const pal = $('pal');
  PIG.forEach((p, i) => {
    const b = document.createElement('button');
    b.className = 'wc-pan'; b.style.background = p.hex; b.title = p.name; b.setAttribute('aria-label', p.name);
    b.innerHTML = '<b></b>';
    b.addEventListener('click', () => {
      if (mixing) { if (mix.includes(i)) { if (mix.length > 1) mix = mix.filter((m) => m !== i); } else if (mix.length < 3) mix.push(i); else mix = [mix[1], mix[2], i]; }
      else mix = [i];
      if (tool !== 'paint') setTool('paint');
      syncPalette(); scheduleSave(); Curio.beep(500 + i * 40, .04, 'sine', .05);
    });
    pal.append(b);
  });
  function mixedHex() { return '#' + brushK.map((k, c) => Math.round([PR, PG, PB][c] * Math.exp(-k * .9)).toString(16).padStart(2, '0')).join(''); }
  function syncPalette() {
    computeBrush();
    [...pal.children].forEach((b, i) => { const k = mix.indexOf(i); b.setAttribute('aria-pressed', String(k >= 0)); if (mixing && k >= 0 && mix.length > 1) { b.dataset.n = k + 1; b.firstChild.textContent = k + 1; } else delete b.dataset.n; });
    $('swatch').style.background = mixedHex();
    const name = mix.length === 1 ? PIG[mix[0]].name : mix.map((m) => PIG[m].name.split(' ').pop()).join(' + ');
    const gr = brushG > .5 ? 'granulating' : brushG > .2 ? 'slightly granulating' : 'smooth and transparent';
    $('mixName').innerHTML = ''; $('mixName').append(name); const sm = document.createElement('small'); sm.textContent = mix.length > 1 ? `mixed, ${gr}` : gr; $('mixName').append(sm);
    $('mix').setAttribute('aria-pressed', String(mixing));
    $('mixHint').textContent = mixing ? 'tap up to 3 to mix' : 'tap to load the brush';
  }
  $('mix').addEventListener('click', () => { mixing = !mixing; if (!mixing && mix.length > 1) mix = mix.slice(); syncPalette(); });
  function setTool(t) { tool = t; document.querySelectorAll('[data-tool]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tool === t))); }
  document.querySelectorAll('[data-tool]').forEach((b) => b.addEventListener('click', () => setTool(b.dataset.tool)));
  const sizeEl = $('size'), waterEl = $('water');
  const wl = () => (water < .2 ? 'Dry brush' : water < .45 ? 'Damp' : water < .75 ? 'Wet' : 'Soaking');
  sizeEl.value = size; $('sizeV').textContent = size; waterEl.value = Math.round(water * 100); $('waterV').textContent = wl();
  sizeEl.addEventListener('input', () => { size = +sizeEl.value; $('sizeV').textContent = size; dirty = true; scheduleSave(); });
  waterEl.addEventListener('input', () => { water = +waterEl.value / 100; $('waterV').textContent = wl(); scheduleSave(); });
  $('dry').addEventListener('click', hairDryer);
  $('undo').addEventListener('click', undo);
  $('clear').addEventListener('click', clearAll);
  $('save').addEventListener('click', savePng);
  addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); return; }
    if (e.key === '[') { size = Math.max(8, size - 6); sizeEl.value = size; $('sizeV').textContent = size; dirty = true; }
    if (e.key === ']') { size = Math.min(140, size + 6); sizeEl.value = size; $('sizeV').textContent = size; dirty = true; }
    if (e.key === 'w' || e.key === 'W') setTool(tool === 'lift' ? 'paint' : 'lift');
    if (e.ctrlKey || e.metaKey || e.altKey || (e.target.closest && e.target.closest('input'))) return;
    const n = '1234567890-='.indexOf(e.key);
    if (n >= 0 && n < PIG.length) pal.children[n].click();
    if (e.key === 'm' || e.key === 'M') $('mix').click();
    if (e.key === 'd' || e.key === 'D') hairDryer();
    if (e.key === 'u' || e.key === 'U') undo();
  });

  syncPalette(); restoreArt();
  if (!Curio.touchpad && !Curio.store.get('tp-hint-watercolor', false) && matchMedia('(pointer: fine)').matches) { Curio.store.set('tp-hint-watercolor', true); setTimeout(() => Curio.toast('Tip: on a laptop touchpad, turn on Touchpad mode in the top bar: click to put the brush down, click again to lift it', 4200), 1800); }
  requestAnimationFrame(loop);
})();
