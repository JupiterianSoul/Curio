(() => {
  const WTP = window.WTP;
  const { P32, pack, shade, mix, hash, unR, unG, unB, rand } = WTP;
  const CELL = 2, TOPPAD = 80;
  const AIR = 0, SOLID = 1, HOLE = 2, ROCK = 3, RUBBLE = 4, ICE = 5, DEBRIS = 6;
  const K_BOX = 0, K_TEXT = 1, K_IMG = 2, K_GLASS = 3;
  const F_CHAR = 1, F_PAINT = 2, F_ACID = 4;
  const TILE = 32;
  const W = {
    CELL, TOPPAD, AIR, SOLID, HOLE, ROCK, RUBBLE, ICE, DEBRIS, K_TEXT, K_GLASS, K_IMG,
    w: 0, h: 0, n: 0, total: 1, destroyed: 0, ready: false,
    chunks: [], groups: [], words: [], targets: [], tElems: [], burning: [], smoulder: [], iceList: [], sand: [],
    rubbleN: 0, chunkLimit: 70, componentLimit: 900, quality: 2
  };
  WTP.world = W;

  function parseColor(s) {
    const m = /rgba?\(([^)]+)\)/.exec(s || '');
    if (!m) return null;
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    const a = p.length > 3 ? p[3] : 1;
    if (!(a > 0.01)) return null;
    return `rgba(${p[0]},${p[1]},${p[2]},${a})`;
  }
  const textCase = (t, tt) => tt === 'uppercase' ? t.toUpperCase() : tt === 'lowercase' ? t.toLowerCase() : tt === 'capitalize' ? t.replace(/\b\w/g, (c) => c.toUpperCase()) : t;
  const GLASS_RE = /(btn|button|search|pill|badge|-pg-n|e-btn|s-add|chip|tag\b|w-search|q-box|input|field)/i;

  async function rasterize(root, opts = {}) {
    const base = root.getBoundingClientRect();
    const PW = Math.ceil(base.width);
    const PH = Math.ceil(root.scrollHeight || base.height) + TOPPAD;
    const mk = () => { const c = document.createElement('canvas'); c.width = PW; c.height = PH; return c; };
    const bc = mk(), fc = mk(), tc = mk();
    const b = bc.getContext('2d', { willReadFrequently: true }), f = fc.getContext('2d', { willReadFrequently: true }), t = tc.getContext('2d', { willReadFrequently: true });
    const rootBg = parseColor(getComputedStyle(root).backgroundColor) || '#fff';
    b.fillStyle = rootBg; b.fillRect(0, TOPPAD, PW, PH - TOPPAD);
    const area = PW * (PH - TOPPAD);
    const svgs = [], glass = [], tgts = [];
    const clipOf = new Map();
    const els = [root, ...root.querySelectorAll('*')];
    const tsel = opts.targetSel || null;
    for (const el of els) {
      if (el instanceof SVGElement && el.tagName.toLowerCase() !== 'svg') continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      const x = r.left - base.left, y = r.top - base.top + TOPPAD;
      if (tsel && el !== root && el.matches(tsel)) tgts.push({ x, y, w: r.width, h: r.height, label: (el.textContent || '').trim().slice(0, 28) });
      if (el.tagName.toLowerCase() === 'svg') { svgs.push({ el, x, y, w: r.width, h: r.height }); continue; }
      const isBack = el === root || el.hasAttribute('data-back') || r.width * r.height > area * 0.3;
      const g = isBack ? b : f;
      const bg = parseColor(cs.backgroundColor);
      const cls = typeof el.className === 'string' ? el.className : '';
      if (!isBack && (el.hasAttribute('data-glass') || (GLASS_RE.test(cls) && r.width * r.height < 40000 && r.height < 90))) glass.push({ x, y, w: r.width, h: r.height });
      if (bg && el !== root) {
        const rad = Math.min(parseFloat(cs.borderTopLeftRadius) || 0, r.width / 2, r.height / 2);
        g.fillStyle = bg;
        g.beginPath();
        if (rad > 0.5 && g.roundRect) g.roundRect(x, y, r.width, r.height, rad); else g.rect(x, y, r.width, r.height);
        g.fill();
      }
      const bgi = cs.backgroundImage;
      if (bgi && bgi.includes('gradient') && !isBack) {
        const m = bgi.match(/rgba?\([^)]+\)/g);
        if (m && m.length) {
          const gr = g.createLinearGradient(x, y, x + r.width, y + r.height);
          m.forEach((c, i) => gr.addColorStop(m.length === 1 ? 0 : i / (m.length - 1), c));
          g.fillStyle = gr;
          g.fillRect(x, y, r.width, r.height);
        }
      }
      const sides = [['Top', x, y, r.width, 0], ['Bottom', x, y + r.height, r.width, 0], ['Left', x, y, 0, r.height], ['Right', x + r.width, y, 0, r.height]];
      for (const [s, sx, sy, sw, sh] of sides) {
        const bw = parseFloat(cs[`border${s}Width`]) || 0;
        const st = cs[`border${s}Style`];
        const col = parseColor(cs[`border${s}Color`]);
        if (bw < 0.5 || !col || st === 'none' || st === 'hidden') continue;
        const gg = isBack ? b : f;
        gg.fillStyle = col;
        const rx = s === 'Right' ? sx - bw : sx, ry = s === 'Bottom' ? sy - bw : sy;
        const w = sw || bw, h = sh || bw;
        if (st === 'dashed' || st === 'dotted') {
          const seg = st === 'dotted' ? bw : bw * 3;
          if (sw) for (let k = 0; k < w; k += seg * 2) gg.fillRect(rx + k, ry, Math.min(seg, w - k), h);
          else for (let k = 0; k < h; k += seg * 2) gg.fillRect(rx, ry + k, w, Math.min(seg, h - k));
        } else gg.fillRect(rx, ry, w, h);
      }
      if (cs.overflow !== 'visible' || cs.overflowX !== 'visible') clipOf.set(el, { x, y, w: r.width, h: r.height });
    }
    const imgRects = [];
    for (const s of svgs) {
      try {
        const clone = s.el.cloneNode(true);
        clone.setAttribute('width', s.w); clone.setAttribute('height', s.h);
        if (!clone.getAttribute('xmlns')) clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' }));
        const im = new Image();
        await new Promise((res) => { im.onload = res; im.onerror = res; im.src = url; });
        if (im.naturalWidth || im.width) f.drawImage(im, s.x, s.y, s.w, s.h);
        URL.revokeObjectURL(url);
        imgRects.push(s);
      } catch (e) { }
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    const clipCache = new Map();
    const clipFor = (el) => {
      if (clipCache.has(el)) return clipCache.get(el);
      let c = null;
      for (let a = el; a && a !== root; a = a.parentElement) if (clipOf.has(a)) { c = clipOf.get(a); break; }
      clipCache.set(el, c);
      return c;
    };
    const glyphs = [], words = [];
    let node;
    while ((node = walker.nextNode())) {
      const text = node.nodeValue;
      if (!text || !/\S/.test(text)) continue;
      const el = node.parentElement;
      if (!el || el.closest('svg')) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden') continue;
      const col = parseColor(cs.color);
      if (!col) continue;
      const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      f.font = font; t.font = font;
      f.fillStyle = col; t.fillStyle = '#fff';
      f.textBaseline = 'alphabetic'; t.textBaseline = 'alphabetic';
      const ls = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing;
      try { f.letterSpacing = ls; t.letterSpacing = ls; } catch (e) { }
      const fs = parseFloat(cs.fontSize) || 16;
      const under = (cs.textDecorationLine || '').includes('underline');
      const strike = (cs.textDecorationLine || '').includes('line-through');
      const tt = cs.textTransform;
      const clip = clipFor(el);
      if (clip) { f.save(); f.beginPath(); f.rect(clip.x, clip.y, clip.w, clip.h); f.clip(); t.save(); t.beginPath(); t.rect(clip.x, clip.y, clip.w, clip.h); t.clip(); }
      const re = /\S+/gu;
      let m;
      const drawAt = (str, rect) => {
        const mt = f.measureText(str);
        const asc = mt.fontBoundingBoxAscent ?? fs * 0.8, desc = mt.fontBoundingBoxDescent ?? fs * 0.2;
        const x = rect.left - base.left, top = rect.top - base.top + TOPPAD;
        const by = top + (rect.height - (asc + desc)) / 2 + asc;
        f.fillText(str, x, by); t.fillText(str, x, by);
        if (under) { f.fillRect(x, by + Math.max(1, fs * 0.1), rect.width, Math.max(1, fs / 14)); }
        if (strike) { f.fillRect(x, by - fs * 0.3, rect.width, Math.max(1, fs / 14)); }
        const g0 = glyphs.length;
        let off = 0, px0 = 0;
        for (const ch of Array.from(str)) {
          const px1 = f.measureText(str.slice(0, off + ch.length)).width;
          if (/\S/.test(ch)) glyphs.push({ x0: x + px0, x1: x + px1, y0: top, y1: top + rect.height, ch });
          px0 = px1; off += ch.length;
        }
        if (/^[A-Za-z][A-Za-z'-]{3,}$/.test(str.replace(/[.,!?:;"]+$/, ''))) words.push({ text: str.replace(/[.,!?:;"]+$/, ''), g0, g1: glyphs.length, x, y: top, w: rect.width, h: rect.height });
      };
      while ((m = re.exec(text))) {
        range.setStart(node, m.index);
        range.setEnd(node, m.index + m[0].length);
        const rects = range.getClientRects();
        if (!rects.length) continue;
        if (rects.length === 1) { drawAt(textCase(m[0], tt), rects[0]); continue; }
        let off = m.index;
        for (const ch of Array.from(m[0])) {
          range.setStart(node, off); range.setEnd(node, off + ch.length);
          const rr = range.getClientRects()[0];
          if (rr) drawAt(textCase(ch, tt), rr);
          off += ch.length;
        }
      }
      if (clip) { f.restore(); t.restore(); }
    }
    return { PW, PH, fd: f.getImageData(0, 0, PW, PH).data, bd: b.getImageData(0, 0, PW, PH).data, td: t.getImageData(0, 0, PW, PH).data, glyphs, words, glass, tgts, imgRects };
  }

  let levelCv = null, levelCtx = null, img = null, pix = null;
  let mat, back, col, bcol, kind, gid, burn, flag, under, tgt, init = null, sandMark, visit, visitGen = 0;
  let dirtyTiles = null, dirtyList = [], TW = 0, TH = 0;
  const qbuf = new Int32Array(1 << 16);

  function build(data) {
    const { PW, PH, fd, bd, td } = data;
    const w = Math.ceil(PW / CELL), h = Math.ceil(PH / CELL) + 3;
    const n = w * h;
    W.w = w; W.h = h; W.n = n;
    mat = new Uint8Array(n); back = new Uint8Array(n); col = new Uint32Array(n); bcol = new Uint32Array(n);
    kind = new Uint8Array(n); gid = new Int32Array(n); burn = new Uint8Array(n); flag = new Uint8Array(n); under = new Uint8Array(n); tgt = new Uint16Array(n);
    sandMark = new Uint32Array(n); visit = new Uint32Array(n);
    Object.assign(W, { mat, back, col, bcol, kind, gid, burn, flag, tgt });
    levelCv = document.createElement('canvas');
    levelCv.width = w; levelCv.height = h;
    levelCtx = levelCv.getContext('2d');
    img = levelCtx.createImageData(w, h);
    pix = new Uint32Array(img.data.buffer);
    W.levelCv = levelCv; W.pix = pix;
    TW = Math.ceil(w / TILE); TH = Math.ceil(h / TILE);
    dirtyTiles = new Uint8Array(TW * TH);
    const topRow = Math.floor(TOPPAD / CELL);
    let total = 0;
    for (let cy = 0; cy < h; cy++) {
      for (let cx = 0; cx < w; cx++) {
        const i = cy * w + cx;
        if (cy >= h - 3) {
          mat[i] = ROCK;
          const nz = hash(cx, cy) & 7;
          col[i] = cy === h - 3 ? shade(P32['3'], 1, nz) : cy === h - 2 ? shade(P32['2'], 1, nz) : shade(P32['1'], 1, nz);
          continue;
        }
        let ma = 0, mi = -1, br = 0, bgc = 0, bb = 0, bn = 0, ba = 0, ta = 0;
        for (let dy = 0; dy < CELL; dy++) {
          const py = cy * CELL + dy;
          if (py >= PH) continue;
          for (let dx = 0; dx < CELL; dx++) {
            const px = cx * CELL + dx;
            if (px >= PW) continue;
            const o = (py * PW + px) * 4;
            if (fd[o + 3] > ma) { ma = fd[o + 3]; mi = o; }
            if (td[o + 3] > ta) ta = td[o + 3];
            br += bd[o]; bgc += bd[o + 1]; bb += bd[o + 2]; ba += bd[o + 3]; bn++;
          }
        }
        if (!bn) continue;
        br /= bn; bgc /= bn; bb /= bn; ba /= bn;
        const hasBack = cy >= topRow && ba > 100;
        if (hasBack) { back[i] = 1; bcol[i] = pack(br | 0, bgc | 0, bb | 0); }
        if (ma >= 105) {
          const a = fd[mi + 3] / 255;
          const k = Math.min(1, a * 1.25);
          const c = hasBack ? pack((fd[mi] * k + br * (1 - k)) | 0, (fd[mi + 1] * k + bgc * (1 - k)) | 0, (fd[mi + 2] * k + bb * (1 - k)) | 0) : pack(fd[mi], fd[mi + 1], fd[mi + 2]);
          mat[i] = SOLID; col[i] = c; total++;
          if (ta > 90) kind[i] = K_TEXT;
        }
      }
    }
    for (const r of data.imgRects) forRect(r, (i) => { if (mat[i] === SOLID && kind[i] !== K_TEXT) kind[i] = K_IMG; });
    W.groups = [null];
    for (const gl of data.glyphs) {
      const id = W.groups.length;
      let cnt = 0;
      const box = cellBox(gl);
      for (let y = box.y0; y <= box.y1; y++) for (let x = box.x0; x <= box.x1; x++) {
        const i = y * w + x;
        if (mat[i] === SOLID && kind[i] === K_TEXT && !gid[i]) { gid[i] = id; cnt++; }
      }
      W.groups.push({ t: 'g', ...box, n: cnt, ch: gl.ch });
    }
    for (const gr of data.glass) {
      const id = W.groups.length;
      let cnt = 0;
      forRect(gr, (i) => { if (mat[i] === SOLID && kind[i] !== K_TEXT) { kind[i] = K_GLASS; gid[i] = id; cnt++; } });
      const box = cellBox({ x0: gr.x, y0: gr.y, x1: gr.x + gr.w, y1: gr.y + gr.h });
      W.groups.push({ t: 'glass', ...box, n: cnt });
    }
    W.words = data.words.map((wd) => ({ ...wd, ids: Array.from({ length: wd.g1 - wd.g0 }, (_, k) => wd.g0 + k + 1) }));
    W.tElems = data.tgts.map((r) => ({ ...cellBox({ x0: r.x, y0: r.y, x1: r.x + r.w, y1: r.y + r.h }), label: r.label }));
    W.total = Math.max(1, total);
    init = { mat: mat.slice(), col: col.slice(), back: back.slice(), bcol: bcol.slice(), kind: kind.slice(), gid: gid.slice() };
    W.ready = true;
  }
  function cellBox(r) {
    return {
      x0: Math.max(0, Math.floor(r.x0 / CELL)), x1: Math.min(W.w - 1, Math.ceil(r.x1 / CELL) - 1),
      y0: Math.max(0, Math.floor(r.y0 / CELL)), y1: Math.min(W.h - 4, Math.ceil(r.y1 / CELL) - 1)
    };
  }
  function forRect(r, fn) {
    const b = cellBox({ x0: r.x, y0: r.y, x1: r.x + r.w, y1: r.y + r.h });
    for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) fn(y * W.w + x, x, y);
  }

  function reset() {
    mat.set(init.mat); col.set(init.col); back.set(init.back); bcol.set(init.bcol); kind.set(init.kind); gid.set(init.gid);
    burn.fill(0); flag.fill(0); under.fill(0); tgt.fill(0);
    W.chunks = []; W.burning = []; W.smoulder = []; W.iceList = []; W.sand = []; W.rubbleN = 0;
    W.destroyed = 0; W.targets = [];
    for (const g of W.groups) if (g) g.dead = false;
    for (let i = 0; i < W.n; i++) pix[i] = color(i);
    levelCtx.putImageData(img, 0, 0);
    dirtyTiles.fill(0); dirtyList = [];
  }

  const ROCKC = P32['2'];
  function iceCol(c, x, y) {
    const base = mix(c, P32.C, 0.62);
    const h = hash(x, y) & 15;
    return h === 0 ? P32['7'] : h < 3 ? shade(base, 1.12, 8) : base;
  }
  function holeShadowed(i, x) {
    const up = i - W.w;
    const isF = (j) => { const m = mat[j]; return m === SOLID || m === ICE || m === DEBRIS || m === RUBBLE; };
    return (up >= 0 && isF(up)) || (x > 0 && isF(i - 1)) || (up - 1 >= 0 && x > 0 && isF(up - 1));
  }
  function color(i) {
    const m = mat[i];
    if (m === SOLID || m === ROCK || m === RUBBLE || m === DEBRIS) return col[i];
    const x = i % W.w, y = (i / W.w) | 0;
    if (m === ICE) return iceCol(col[i], x, y);
    if (!back[i]) return 0;
    const b = bcol[i];
    const edge = (x > 0 && !back[i - 1]) || (x < W.w - 1 && !back[i + 1]) || (i >= W.w && !back[i - W.w]) || (!back[i + W.w] && mat[i + W.w] !== ROCK);
    if (m === HOLE) {
      const l = WTP.lum(b);
      let c = l > 0.35 ? shade(b, 0.8, (hash(x, y) & 3) - 1) : shade(b, 1, 10 + (hash(x, y) & 3));
      if (holeShadowed(i, x)) c = shade(c, 0.72);
      if (edge) c = shade(b, 1.08, 18);
      return c;
    }
    if (edge) return shade(b, 1.06, 14);
    return b;
  }
  function markTile(x, y) {
    const t = ((y / TILE) | 0) * TW + ((x / TILE) | 0);
    if (!dirtyTiles[t]) { dirtyTiles[t] = 1; dirtyList.push(t); }
  }
  function touch(i) {
    const x = i % W.w, y = (i / W.w) | 0;
    pix[i] = color(i);
    markTile(x, y);
    if (x + 1 < W.w) pix[i + 1] = mat[i + 1] === HOLE || mat[i + 1] === AIR ? color(i + 1) : pix[i + 1];
    const d = i + W.w;
    if (d < W.n) { if (mat[d] === HOLE || mat[d] === AIR) pix[d] = color(d); if (x + 1 < W.w && (mat[d + 1] === HOLE || mat[d + 1] === AIR)) pix[d + 1] = color(d + 1); markTile(x, y + 1); }
    if (x + 1 < W.w) markTile(x + 1, y);
  }
  function touchEdges(i) {
    const x = i % W.w;
    for (const j of [i - 1, i + 1, i - W.w, i + W.w]) if (j >= 0 && j < W.n && Math.abs((j % W.w) - x) <= 1) { pix[j] = color(j); markTile(j % W.w, (j / W.w) | 0); }
  }
  function flush() {
    if (!dirtyList.length) return;
    if (dirtyList.length > 160) {
      let y0 = 1e9, y1 = -1;
      for (const t of dirtyList) { const ty = (t / TW) | 0; if (ty < y0) y0 = ty; if (ty > y1) y1 = ty; dirtyTiles[t] = 0; }
      levelCtx.putImageData(img, 0, 0, 0, y0 * TILE, W.w, (y1 - y0 + 1) * TILE);
    } else {
      dirtyList.sort((a, b) => a - b);
      let k = 0;
      while (k < dirtyList.length) {
        const t0 = dirtyList[k];
        let t1 = t0;
        while (k + 1 < dirtyList.length && dirtyList[k + 1] === t1 + 1 && ((dirtyList[k + 1] / TW) | 0) === ((t0 / TW) | 0)) { k++; t1 = dirtyList[k]; }
        const ty = (t0 / TW) | 0, tx0 = t0 % TW, tx1 = t1 % TW;
        levelCtx.putImageData(img, 0, 0, tx0 * TILE, ty * TILE, (tx1 - tx0 + 1) * TILE, TILE);
        for (let t = t0; t <= t1; t++) dirtyTiles[t] = 0;
        k++;
      }
    }
    dirtyList = [];
  }

  const isSolidM = (m) => m === SOLID || m === ROCK || m === RUBBLE || m === ICE || m === DEBRIS;
  const solid = (x, y) => {
    if (x < 0 || x >= W.w) return true;
    if (y < 0) return false;
    if (y >= W.h) return true;
    return isSolidM(mat[y * W.w + x]);
  };
  const solidI = (i) => isSolidM(mat[i]);
  const frontAt = (x, y) => x >= 0 && y >= 0 && x < W.w && y < W.h && (mat[y * W.w + x] === SOLID || mat[y * W.w + x] === ICE);

  const G = () => WTP.game;
  const FX = () => WTP.fx;
  function counted(i, n = 1) {
    W.destroyed += n;
    const t = tgt[i];
    if (t && W.targets[t]) { const T = W.targets[t]; T.left--; if (!T.done && T.left <= T.total * T.need) { T.done = true; G()?.targetDown?.(T); } }
  }
  function kill(i, x, y, cx, cy, chance, force, opt) {
    const m = mat[i];
    if (m === SOLID || m === ICE) {
      const c = m === ICE ? iceCol(col[i], x, y) : col[i];
      mat[i] = HOLE; burn[i] = 0;
      counted(i);
      if (chance > 0 && Math.random() < chance) {
        const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy) || 1, sp = force * (0.4 + Math.random());
        FX().debris(x + 0.5, y + 0.5, (dx / d) * sp + rand(-20, 20), (dy / d) * sp - rand(20, 80), c, opt);
      }
      touch(i); wakeAbove(i);
      return 1;
    }
    if (m === RUBBLE || m === DEBRIS) {
      const c = col[i];
      clearRubble(i, x, y);
      if (chance > 0 && Math.random() < chance * 0.7) FX().debris(x + 0.5, y + 0.5, rand(-40, 40) + (x - cx) * 4, rand(-90, -20), c, { ns: true });
    }
    return 0;
  }

  function carve(cx, cy, r, o = {}) {
    if (!W.ready) return 0;
    const chance = (o.debris ?? 0.35) * (W.quality >= 2 ? 1 : W.quality === 1 ? 0.6 : 0.35), force = o.force ?? 60;
    let n = 0;
    const R = Math.ceil(r + 3);
    const x0 = Math.max(0, Math.floor(cx - R)), x1 = Math.min(W.w - 1, Math.ceil(cx + R));
    const y0 = Math.max(0, Math.floor(cy - R)), y1 = Math.min(W.h - 4, Math.ceil(cy + R));
    const jit = Math.min(2.2, r * 0.35);
    const hitG = [], hitGlass = [];
    let iceHit = -1;
    const shape = o.square;
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
        const i = y * W.w + x;
        const m = mat[i];
        let inside, d2 = dx * dx + dy * dy;
        if (shape) inside = Math.abs(dx) <= r && Math.abs(dy) <= r;
        else { const jr = r + ((hash(x, y) & 7) / 7 - 0.5) * jit; inside = d2 <= jr * jr; }
        if (inside) {
          if (m === SOLID) {
            if (kind[i] === K_GLASS) { if (hitGlass.indexOf(gid[i]) < 0) hitGlass.push(gid[i]); continue; }
            if (kind[i] === K_TEXT && gid[i] && hitG.length < 24 && hitG.indexOf(gid[i]) < 0) hitG.push(gid[i]);
            n += kill(i, x, y, cx, cy, chance, force, o.dopt);
          } else if (m === ICE) { iceHit = i; }
          else if (m === RUBBLE || m === DEBRIS) kill(i, x, y, cx, cy, o.clean ? 0 : chance, force);
          if (o.back && back[i] && d2 <= (r * o.back) * (r * o.back) * (0.8 + (hash(y, x) & 7) / 20)) { back[i] = 0; pix[i] = color(i); markTile(x, y); touchEdges(i); }
        } else if (o.scorch && m === SOLID && d2 <= (r + 2.6) * (r + 2.6) && !(flag[i] & F_CHAR)) {
          col[i] = shade(col[i], 0.7); flag[i] |= F_CHAR; if (!burn[i]) { pix[i] = col[i]; markTile(x, y); }
        } else if (o.scorch && (m === HOLE) && back[i] && d2 <= (r + 1.5) * (r + 1.5)) {
          bcol[i] = shade(bcol[i], 0.86); pix[i] = color(i); markTile(x, y);
        }
      }
    }
    for (const g of hitGlass) n += shatterGlass(g, cx, cy);
    if (iceHit >= 0) n += shatterIce(iceHit, cx, cy, force);
    if (o.ignite) igniteRing(cx, cy, r, o.ignite);
    if (hitG.length && o.pop !== 0) {
      const pop = o.pop ?? (r < 5 ? 0.65 : 1);
      let got = 0;
      for (const g of hitG) if (Math.random() < pop) { const k = detachGlyph(g, (Math.random() - 0.5) * 60 + (o.vx || 0) * 0.15, -rand(30, 90) + (o.vy || 0) * 0.1); if (k) { n += k; got++; } }
      if (got) { G()?.stat?.('letters', got); if (got >= 3) WTP.audio.play('letters'); }
    }
    if (o.letters) n += letterRing(cx, cy, r, r + o.letters, force);
    if (n && !o.noCrumble) n += crumble(cx, cy, Math.max(0, r - 1), r + (o.crumbleR || 5));
    if (n) G()?.scored?.(n, cx, cy, o.cause);
    return n;
  }
  function letterRing(cx, cy, r0, r1, force) {
    const seen = [];
    const x0 = Math.max(0, Math.floor(cx - r1)), x1 = Math.min(W.w - 1, Math.ceil(cx + r1));
    const y0 = Math.max(0, Math.floor(cy - r1)), y1 = Math.min(W.h - 4, Math.ceil(cy + r1));
    for (let y = y0; y <= y1; y += 2) for (let x = x0; x <= x1; x += 2) {
      const i = y * W.w + x;
      if (mat[i] !== SOLID || kind[i] !== K_TEXT || !gid[i]) continue;
      const dx = x - cx, dy = y - cy, d2 = dx * dx + dy * dy;
      if (d2 > r1 * r1 || d2 < r0 * r0 * 0.6) continue;
      if (seen.indexOf(gid[i]) < 0) seen.push(gid[i]);
      if (seen.length > 28) break;
    }
    let n = 0, got = 0;
    for (const g of seen) {
      const gr = W.groups[g];
      const gx = (gr.x0 + gr.x1) / 2 - cx, gy = (gr.y0 + gr.y1) / 2 - cy, d = Math.hypot(gx, gy) || 1;
      const sp = force * (0.7 + Math.random() * 0.8) * (1 - d / (r1 + 4));
      const k = detachGlyph(g, (gx / d) * sp, (gy / d) * sp - rand(40, 110));
      if (k) { n += k; got++; }
    }
    if (got) { G()?.stat?.('letters', got); if (got >= 8) G()?.event?.('LETTER STORM!', cx, cy); WTP.audio.play('letters'); }
    return n;
  }
  function detachGlyph(g, vx, vy) {
    const gr = W.groups[g];
    if (!gr || gr.dead) return 0;
    const cells = [];
    for (let y = gr.y0; y <= gr.y1; y++) for (let x = gr.x0; x <= gr.x1; x++) {
      const i = y * W.w + x;
      if (gid[i] === g && mat[i] === SOLID) cells.push(x, y, burn[i] ? shade(col[i], 0.6) : col[i]);
    }
    gr.dead = true;
    if (cells.length < 9) { for (let k = 0; k < cells.length; k += 3) { const i = cells[k + 1] * W.w + cells[k]; kill(i, cells[k], cells[k + 1], cells[k], cells[k + 1], 1, 30); } return cells.length / 3; }
    for (let k = 0; k < cells.length; k += 3) {
      const i = cells[k + 1] * W.w + cells[k];
      mat[i] = HOLE; burn[i] = 0; counted(i); touch(i); wakeAbove(i);
    }
    makeChunk(cells, vx, vy, { letter: true });
    return cells.length / 3;
  }
  function shatterGlass(g, cx, cy) {
    const gr = W.groups[g];
    if (!gr || gr.dead) return 0;
    gr.dead = true;
    let n = 0;
    for (let y = gr.y0; y <= gr.y1; y++) for (let x = gr.x0; x <= gr.x1; x++) {
      const i = y * W.w + x;
      if (gid[i] !== g || mat[i] !== SOLID) continue;
      const c = col[i];
      mat[i] = HOLE; counted(i); touch(i); wakeAbove(i); n++;
      if (Math.random() < 0.45) {
        const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy) || 1, sp = rand(40, 160);
        FX().shard(x + 0.5, y + 0.5, (dx / d) * sp + rand(-30, 30), (dy / d) * sp - rand(40, 120), (hash(x, y) & 3) === 0 ? P32['7'] : (hash(x, y) & 3) === 1 ? P32.C : c);
      }
    }
    WTP.audio.play('glass');
    G()?.stat?.('glass', 1);
    G()?.event?.('SHATTERED!', (gr.x0 + gr.x1) / 2, gr.y0);
    crumble((gr.x0 + gr.x1) / 2, (gr.y0 + gr.y1) / 2, 0, Math.max(gr.x1 - gr.x0, gr.y1 - gr.y0) / 2 + 6);
    return n;
  }
  function shatterIce(i0, cx, cy, force = 80) {
    if (mat[i0] !== ICE) return 0;
    let qn = 0, h = 0, n = 0;
    qbuf[qn++] = i0; mat[i0] = 250;
    const list = [];
    while (h < qn && list.length < 6000) {
      const i = qbuf[h++];
      list.push(i);
      const x = i % W.w;
      const nb = [i - W.w, i + W.w, x > 0 ? i - 1 : -1, x < W.w - 1 ? i + 1 : -1];
      for (const j of nb) if (j >= 0 && j < W.n && mat[j] === ICE && qn < qbuf.length) { mat[j] = 250; qbuf[qn++] = j; }
    }
    for (const i of list) {
      const x = i % W.w, y = (i / W.w) | 0;
      const c = iceCol(col[i], x, y);
      mat[i] = HOLE; burn[i] = 0; counted(i); touch(i); wakeAbove(i); n++;
      if (Math.random() < 0.4) {
        const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy) || 1, sp = rand(30, 140) * (force / 80);
        FX().shard(x + 0.5, y + 0.5, (dx / d) * sp + rand(-40, 40), (dy / d) * sp - rand(30, 110), c);
      }
    }
    for (let k = h; k < qn; k++) if (mat[qbuf[k]] === 250) mat[qbuf[k]] = ICE;
    if (n) { WTP.audio.play('ice'); G()?.stat?.('iced', n); if (n > 200) G()?.event?.('ICE BREAKER!', cx, cy); }
    return n;
  }
  function freezeAt(cx, cy, r) {
    let n = 0;
    const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(W.w - 1, Math.ceil(cx + r));
    const y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(W.h - 4, Math.ceil(cy + r));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      if (dx * dx + dy * dy > r * r) continue;
      const i = y * W.w + x;
      if (mat[i] === SOLID && kind[i] !== K_GLASS) {
        mat[i] = ICE; burn[i] = 180 + (Math.random() * 60) | 0; W.iceList.push(i); touch(i); n++;
      }
    }
    return n;
  }
  function updateIce() {
    const L = W.iceList;
    if (!L.length) return;
    for (let k = L.length - 1; k >= 0; k--) {
      const i = L[k];
      if (mat[i] !== ICE) { L[k] = L[L.length - 1]; L.pop(); continue; }
      if (burn[i] > 0) burn[i]--;
      if (burn[i] === 0) {
        const x = i % W.w, y = (i / W.w) | 0;
        const n = shatterIce(i, x + 0.5, y - 2, 50);
        if (n) { G()?.scored?.(n, x, y, 'ice'); crumble(x, y, 0, 12); }
        L[k] = L[L.length - 1]; L.pop();
      } else if ((burn[i] & 31) === 0 && Math.random() < 0.02) {
        FX().spark(i % W.w + 0.5, ((i / W.w) | 0) + 0.5, rand(-5, 5), rand(-10, 0), P32['7'], 0.3);
      }
    }
  }
  function paintAt(cx, cy, r, c) {
    let n = 0;
    const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(W.w - 1, Math.ceil(cx + r));
    const y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(W.h - 4, Math.ceil(cy + r));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy, jr = r + ((hash(x, y) & 7) - 3.5) * 0.25;
      if (dx * dx + dy * dy > jr * jr) continue;
      const i = y * W.w + x;
      if (mat[i] === SOLID || mat[i] === DEBRIS || mat[i] === RUBBLE) {
        col[i] = mix(c, col[i], WTP.lum(col[i]) < 0.3 ? 0.35 : 0.12);
        if ((hash(x, y) & 7) === 0) col[i] = shade(col[i], 1.15, 10);
        if (!(flag[i] & F_PAINT)) { flag[i] |= F_PAINT; n++; }
        if (!burn[i]) { pix[i] = col[i]; markTile(x, y); }
      } else if (back[i] && mat[i] !== ICE) {
        bcol[i] = mix(c, bcol[i], 0.45); pix[i] = color(i); markTile(x, y);
      }
    }
    return n;
  }
  function corrode(i, x, y) {
    if (mat[i] !== SOLID && mat[i] !== DEBRIS && mat[i] !== RUBBLE && mat[i] !== ICE) return false;
    for (const j of [i - 1, i + 1, i + W.w]) if (j >= 0 && j < W.n && mat[j] === SOLID && !(flag[j] & F_ACID)) { col[j] = mix(col[j], P32.l, 0.35); flag[j] |= F_ACID; pix[j] = col[j]; markTile(j % W.w, (j / W.w) | 0); }
    const n = kill(i, x, y, x, y, 0, 0);
    if (n) G()?.scored?.(n, x, y, 'acid');
    return true;
  }

  function ignite(i, gen) {
    if (burn[i] || W.burning.length > 5000) return;
    if (mat[i] === ICE) { const x = i % W.w, y = (i / W.w) | 0; kill(i, x, y, x, y, 0, 0); FX().smoke(x, y, 6, P32['6']); WTP.audio.play('sizzle'); return; }
    if (mat[i] !== SOLID || (flag[i] & F_CHAR && Math.random() < 0.7)) return;
    burn[i] = 30 + ((Math.random() * 50) | 0);
    under[i] = Math.min(250, gen);
    W.burning.push(i);
  }
  function igniteRing(cx, cy, r, chance) {
    for (let k = 0; k < r * 3; k++) {
      if (Math.random() > chance) continue;
      const a = Math.random() * Math.PI * 2, rr = r + rand(-1, 3);
      const x = Math.floor(cx + Math.cos(a) * rr), y = Math.floor(cy + Math.sin(a) * rr);
      if (x >= 0 && x < W.w && y >= 0 && y < W.h - 3) ignite(y * W.w + x, 2);
    }
  }
  function igniteAt(x, y, spread = 10) {
    if (x < 0 || y < 0 || x >= W.w || y >= W.h - 3) return;
    ignite(y * W.w + x, 0);
    for (let z = 0; z < spread; z++) {
      const jx = x + ((Math.random() * 7) | 0) - 3, jy = y + ((Math.random() * 7) | 0) - 3;
      if (jx >= 0 && jx < W.w && jy >= 0 && jy < W.h - 3) ignite(jy * W.w + jx, 1);
    }
  }
  const FIRE = [P32.Y, P32.y, P32.a, P32.o, P32.e, P32.y];
  let burnAcc = 0;
  function updateBurn() {
    const B = W.burning;
    let any = 0, burned = 0;
    for (let k = B.length - 1; k >= 0; k--) {
      const i = B[k];
      const x = i % W.w, y = (i / W.w) | 0;
      if (mat[i] !== SOLID) { burn[i] = 0; B[k] = B[B.length - 1]; B.pop(); touch(i); continue; }
      const t = --burn[i];
      if (t <= 0) {
        burned++;
        B[k] = B[B.length - 1]; B.pop();
        if (Math.random() < 0.55) { any += kill(i, x, y, x + 0.5, y + 1, 0.05, 20); if (Math.random() < 0.15) FX().smoke(x, y - 1, 4); }
        else {
          col[i] = mix(col[i], P32['1'], 0.78); flag[i] |= F_CHAR; touch(i);
          if (W.smoulder.length < 2500) W.smoulder.push(i, 120 + ((Math.random() * 240) | 0));
        }
        continue;
      }
      pix[i] = FIRE[(hash(x, y + t) >>> 3) % 6];
      markTile(x, y);
      if (under[i] < 16 && Math.random() < 0.1) {
        const d = (Math.random() * 5) | 0;
        const nx = x + (d === 0 ? 1 : d === 1 ? -1 : 0), ny = y + (d === 2 ? 1 : d >= 3 ? -1 : 0);
        if (nx >= 0 && nx < W.w && ny >= 0 && ny < W.h - 3) ignite(ny * W.w + nx, under[i] + 1);
      }
      if (Math.random() < 0.012 * (W.quality + 1) / 3) FX().flame(x + 0.5, y);
    }
    const S = W.smoulder;
    for (let k = S.length - 2; k >= 0; k -= 2) {
      const i = S[k];
      if (mat[i] !== SOLID || --S[k + 1] <= 0) { S[k] = S[S.length - 2]; S[k + 1] = S[S.length - 1]; S.length -= 2; if (mat[i] === SOLID) { pix[i] = col[i]; markTile(i % W.w, (i / W.w) | 0); } continue; }
      const x = i % W.w, y = (i / W.w) | 0;
      if ((S[k + 1] & 15) === 0) { const glow = (hash(x, y + S[k + 1]) & 7) < 2; pix[i] = glow ? P32.R : col[i]; markTile(x, y); }
      if (Math.random() < 0.0025 * W.quality) FX().smoke(x + 0.5, y, 3);
    }
    burnAcc += burned;
    if (any) G()?.scored?.(any, -1, -1, 'fire');
    if (burnAcc > 20) { G()?.stat?.('burned', burnAcc); burnAcc = 0; }
  }

  function placeRubble(x, y, c) {
    if (W.rubbleN >= 9000 || x < 0 || x >= W.w || y < 0 || y >= W.h - 3) return false;
    const i = y * W.w + x;
    const m = mat[i];
    if (m !== AIR && m !== HOLE) return false;
    if (G()?.inPlayer?.(x, y)) return false;
    under[i] = m;
    mat[i] = RUBBLE;
    col[i] = shade(c, 0.78 + (hash(x, y) & 7) * 0.025);
    W.rubbleN++;
    touch(i);
    W.sand.push(i);
    return true;
  }
  function clearRubble(i, x, y) {
    mat[i] = under[i] === AIR ? AIR : HOLE;
    W.rubbleN = Math.max(0, W.rubbleN - 1);
    touch(i);
    wakeAbove(i);
  }
  function wakeAbove(i) {
    if (i < W.w) return;
    for (let d = -1; d <= 1; d++) { const j = i - W.w + d; if (mat[j] === RUBBLE) W.sand.push(j); }
  }
  let sandGen = 0;
  function moveRubble(i, j) {
    under[j] = mat[j];
    mat[j] = RUBBLE; col[j] = col[i];
    mat[i] = under[i] === AIR ? AIR : HOLE;
    touch(i); touch(j);
    wakeAbove(i);
  }
  function updateSand() {
    if (!W.sand.length) return;
    sandGen++;
    const list = W.sand;
    W.sand = [];
    if (list.length > 1) list.sort((a, b) => b - a);
    const ip = G()?.inPlayer;
    for (const i0 of list) {
      if (mat[i0] !== RUBBLE || sandMark[i0] === sandGen) continue;
      let i = i0, moved = false;
      for (let s = 0; s < 2; s++) {
        const x = i % W.w, y = (i / W.w) | 0;
        if (y >= W.h - 4) break;
        const b = i + W.w;
        let j = -1;
        const em = (m) => m === AIR || m === HOLE;
        if (em(mat[b]) && !(ip && ip(x, y + 1))) j = b;
        else if (s === 0) {
          const d = (hash(x, y + sandGen) & 1) ? 1 : -1;
          for (const dd of [d, -d]) {
            const nx = x + dd;
            if (nx < 0 || nx >= W.w) continue;
            if (em(mat[b + dd]) && em(mat[i + dd]) && !(ip && ip(nx, y + 1))) { j = b + dd; break; }
          }
        }
        if (j < 0) break;
        moveRubble(i, j);
        i = j; moved = true;
      }
      sandMark[i] = sandGen;
      if (moved) W.sand.push(i);
    }
    if (W.sand.length > 12000) W.sand.length = 12000;
  }

  function crumble(cx, cy, r0, r1) {
    if (++visitGen > 4e9) { visit.fill(0); visitGen = 1; }
    const LIMIT = W.componentLimit;
    let dropped = 0;
    const x0 = Math.max(0, Math.floor(cx - r1)), x1 = Math.min(W.w - 1, Math.ceil(cx + r1));
    const y0 = Math.max(0, Math.floor(cy - r1)), y1 = Math.min(W.h - 4, Math.ceil(cy + r1));
    const w = W.w;
    let budget = 6;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const i0 = y * w + x;
      const m0 = mat[i0];
      if ((m0 !== SOLID && m0 !== DEBRIS) || visit[i0] === visitGen) continue;
      const d2 = (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2;
      if (d2 > r1 * r1 || d2 < r0 * r0 * 0.5) continue;
      let qn = 0;
      qbuf[qn++] = i0;
      visit[i0] = visitGen;
      let anchored = false;
      for (let h = 0; h < qn; h++) {
        const i = qbuf[h];
        const ix = i % w;
        if (ix === 0 || ix === w - 1) { anchored = true; break; }
        for (let dy = -w; dy <= w; dy += w) for (let dx = -1; dx <= 1; dx++) {
          const j = i + dy + dx;
          const mj = mat[j];
          if (mj === ROCK || mj === ICE) { anchored = true; continue; }
          if ((mj !== SOLID && mj !== DEBRIS) || visit[j] === visitGen) continue;
          visit[j] = visitGen;
          qbuf[qn++] = j;
        }
        if (qn > LIMIT) { anchored = true; break; }
      }
      if (anchored) continue;
      if (--budget < 0) return dropped;
      const cells = [];
      let fronts = 0;
      for (let k = 0; k < qn; k++) {
        const i = qbuf[k];
        const ix = i % w, iy = (i / w) | 0;
        cells.push(ix, iy, burn[i] ? shade(col[i], 0.55) : col[i]);
        if (mat[i] === SOLID) { counted(i); fronts++; } else W.rubbleN = Math.max(0, W.rubbleN - 1);
        mat[i] = HOLE; burn[i] = 0; touch(i); wakeAbove(i);
      }
      dropped += fronts;
      if (qn >= 5) makeChunk(cells, rand(-12, 12) + (x - cx) * 2, rand(-30, 0), {});
      else for (let k = 0; k < cells.length; k += 3) FX().debris(cells[k] + 0.5, cells[k + 1] + 0.5, rand(-14, 14), rand(-30, 5), cells[k + 2]);
    }
    return dropped;
  }

  function makeChunk(cells, vx, vy, o = {}) {
    const n = cells.length / 3;
    let sx = 0, sy = 0;
    for (let k = 0; k < cells.length; k += 3) { sx += cells[k]; sy += cells[k + 1]; }
    const mx = sx / n + 0.5, my = sy / n + 0.5;
    const rel = new Float32Array(n * 2), cols = new Uint32Array(n);
    let rad = 0;
    let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    for (let k = 0, j = 0; k < cells.length; k += 3, j++) {
      const dx = cells[k] + 0.5 - mx, dy = cells[k + 1] + 0.5 - my;
      rel[j * 2] = dx; rel[j * 2 + 1] = dy; cols[j] = cells[k + 2];
      rad = Math.max(rad, Math.hypot(dx, dy));
      bx0 = Math.min(bx0, cells[k]); by0 = Math.min(by0, cells[k + 1]); bx1 = Math.max(bx1, cells[k]); by1 = Math.max(by1, cells[k + 1]);
    }
    const bw = bx1 - bx0 + 1, bh = by1 - by0 + 1;
    const mask = new Uint32Array(bw * bh);
    for (let k = 0; k < cells.length; k += 3) mask[(cells[k + 1] - by0) * bw + (cells[k] - bx0)] = cells[k + 2] || 0xff000001;
    const edge = [];
    for (let j = 0; j < n; j++) {
      const lx = Math.round(rel[j * 2] + mx - 0.5) - bx0, ly = Math.round(rel[j * 2 + 1] + my - 0.5) - by0;
      const at = (x, y) => x >= 0 && y >= 0 && x < bw && y < bh && mask[y * bw + x];
      if (!at(lx - 1, ly) || !at(lx + 1, ly) || !at(lx, ly - 1) || !at(lx, ly + 1)) edge.push(j);
    }
    const c = {
      x: mx, y: my, vx, vy, a: 0, va: rand(-1.2, 1.2) * (o.letter ? 2 : 1), rel, cols, n, rad, edge: Int32Array.from(edge),
      ox: mx - bx0, oy: my - by0, bw, bh, mask, t: 0, rest: 0, hits: 0, letter: !!o.letter, held: !!o.held, thrown: false, dmg: o.dmg || 0
    };
    if (!o.held) {
      W.chunks.push(c);
      if (W.chunks.length > W.chunkLimit) settle(W.chunks.shift(), false);
      if (n > 260) { G()?.event?.('TIMBER!', mx, my); }
      G()?.stat?.('chunks', 1);
    }
    return c;
  }
  function chunkBlocked(c, x, y, a) {
    const cs = Math.cos(a), sn = Math.sin(a);
    const E = c.edge, R = c.rel;
    const step = E.length > 160 ? 3 : E.length > 60 ? 2 : 1;
    for (let k = 0; k < E.length; k += step) {
      const j = E[k];
      const dx = R[j * 2], dy = R[j * 2 + 1];
      if (solid(Math.floor(x + dx * cs - dy * sn), Math.floor(y + dx * sn + dy * cs))) return true;
    }
    return false;
  }
  function settle(c, loud = true, shatter = false) {
    const cs = Math.cos(c.a), sn = Math.sin(c.a);
    let placed = 0;
    for (let j = 0; j < c.n; j++) {
      const dx = c.rel[j * 2], dy = c.rel[j * 2 + 1];
      const x = Math.floor(c.x + dx * cs - dy * sn), y = Math.floor(c.y + dx * sn + dy * cs);
      const col0 = c.cols[j];
      if (!shatter && x >= 0 && x < W.w && y >= 0 && y < W.h - 3) {
        const i = y * W.w + x;
        if ((mat[i] === AIR || mat[i] === HOLE) && !(G()?.inPlayer?.(x, y)) && W.rubbleN < 9000) {
          under[i] = mat[i]; mat[i] = DEBRIS; col[i] = shade(col0, 0.88); W.rubbleN++; touch(i); placed++;
          continue;
        }
      }
      if (Math.random() < (shatter ? 0.8 : 0.5)) FX().debris(x + 0.5, y + 0.5, rand(-50, 50) + c.vx * 0.2, rand(-80, -10), col0);
    }
    if (loud) {
      const big = c.n;
      G()?.shake?.(Math.min(8, big / 40));
      for (let k = 0; k < Math.min(8, big / 10); k++) FX().dust(c.x + rand(-c.rad, c.rad), c.y + c.rad * 0.5);
      WTP.audio.play('crash', big);
    }
    return placed;
  }
  function updateChunks(dt) {
    const L = W.chunks;
    for (let k = L.length - 1; k >= 0; k--) {
      const c = L[k];
      if (c.held) continue;
      c.t += dt;
      c.vy = Math.min(360, c.vy + 560 * dt);
      const sp = Math.hypot(c.vx, c.vy);
      const steps = Math.max(1, Math.ceil((sp * dt) / 1.5));
      let hit = false;
      for (let s = 0; s < steps; s++) {
        const nx = c.x + (c.vx * dt) / steps, ny = c.y + (c.vy * dt) / steps, na = c.a + (c.va * dt) / steps;
        if (!chunkBlocked(c, nx, ny, na)) { c.x = nx; c.y = ny; c.a = na; continue; }
        hit = true;
        if (c.thrown && sp > 120) {
          L.splice(k, 1);
          const r = Math.min(16, 4 + Math.sqrt(c.n) * 0.6);
          WTP.weapons?.impactChunk?.(c, r);
          settle(c, true, true);
          break;
        }
        if (!chunkBlocked(c, nx, c.y, c.a)) { c.x = nx; c.vy = -c.vy * 0.22; }
        else if (!chunkBlocked(c, c.x, ny, c.a)) { c.y = ny; c.vx = -c.vx * 0.4; }
        else { c.vy = -c.vy * 0.25; c.vx *= 0.6; }
        c.va = c.va * 0.5 + (c.vx > 0 ? 1 : -1) * Math.min(2, sp / 120);
        c.hits++;
        if (c.hits === 1 && sp > 90) { WTP.audio.play('crash', c.n * 0.6); G()?.shake?.(Math.min(6, c.n / 60)); if (c.letter && Math.random() < 0.4) WTP.audio.play('tink'); }
        break;
      }
      if (!L[k] || L[k] !== c) continue;
      if (hit) {
        c.vx *= 0.85;
        if (Math.abs(c.vy) < 30 && Math.abs(c.vx) < 25) c.rest += dt; else c.rest = 0;
        if (c.rest > 0.12 || c.hits > 7) { L.splice(k, 1); settle(c, c.n > 30); continue; }
      }
      if (c.y > W.h + 20 || c.t > 9) { L.splice(k, 1); settle(c, false); }
    }
  }
  function grabDisk(cx, cy, r) {
    const cells = [];
    const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(W.w - 1, Math.ceil(cx + r));
    const y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(W.h - 4, Math.ceil(cy + r));
    let n = 0;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy, jr = r + ((hash(x, y) & 7) / 7 - 0.5) * 2.4;
      if (dx * dx + dy * dy > jr * jr) continue;
      const i = y * W.w + x;
      const m = mat[i];
      if (m === SOLID || m === DEBRIS || m === RUBBLE || m === ICE) {
        cells.push(x, y, m === ICE ? iceCol(col[i], x, y) : col[i]);
        if (m === SOLID || m === ICE) { counted(i); n++; } else W.rubbleN = Math.max(0, W.rubbleN - 1);
        mat[i] = HOLE; burn[i] = 0; touch(i); wakeAbove(i);
      }
    }
    if (cells.length < 15) {
      for (let k = 0; k < cells.length; k += 3) FX().debris(cells[k], cells[k + 1], rand(-20, 20), rand(-40, 0), cells[k + 2]);
      if (n) G()?.scored?.(n, cx, cy);
      return null;
    }
    if (n) G()?.scored?.(n, cx, cy);
    crumble(cx, cy, r - 1, r + 6);
    return makeChunk(cells, 0, 0, { held: true });
  }
  function releaseChunk(c, vx, vy) {
    c.held = false; c.thrown = true; c.vx = vx; c.vy = vy; c.va = rand(-4, 4);
    W.chunks.push(c);
  }
  function eraseBack(cx, cy, r) {
    const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(W.w - 1, Math.ceil(cx + r));
    const y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(W.h - 4, Math.ceil(cy + r));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const i = y * W.w + x;
      if (!back[i]) continue;
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      if (dx * dx + dy * dy > r * r) continue;
      back[i] = 0; pix[i] = color(i); markTile(x, y); touchEdges(i);
    }
  }
  function nearestSolid(x, y, maxR, pred) {
    let best = null, bd = 1e9;
    const step = maxR > 60 ? 4 : 3;
    for (let dy = -maxR; dy <= maxR; dy += step) for (let dx = -maxR; dx <= maxR; dx += step) {
      const d = dx * dx + dy * dy;
      if (d > maxR * maxR || d >= bd) continue;
      const xx = Math.floor(x + dx), yy = Math.floor(y + dy);
      if (!frontAt(xx, yy)) continue;
      if (pred && !pred(yy * W.w + xx, xx, yy)) continue;
      bd = d; best = [xx + 0.5, yy + 0.5];
    }
    return best;
  }
  function raycast(x, y, dx, dy, max, stepLen = 0.5) {
    for (let s = 0; s < max / stepLen; s++) {
      x += dx * stepLen; y += dy * stepLen;
      if (x < 0 || x >= W.w || y < -200 || y >= W.h) return { x, y, hit: false };
      if (solid(Math.floor(x), Math.floor(y))) return { x, y, hit: true };
    }
    return { x, y, hit: false };
  }
  function setTargetsFromWords(list, need = 0.35) {
    W.targets = [null];
    for (const wd of list) {
      const id = W.targets.length;
      let cnt = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
      for (const g of wd.ids) {
        const gr = W.groups[g];
        if (!gr) continue;
        for (let y = gr.y0; y <= gr.y1; y++) for (let x = gr.x0; x <= gr.x1; x++) {
          const i = y * W.w + x;
          if (gid[i] === g && mat[i] === SOLID) { tgt[i] = id; cnt++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        }
      }
      if (cnt < 6) continue;
      W.targets.push({ id, label: wd.text, total: cnt, left: cnt, need, done: false, x0, y0, x1, y1 });
    }
    return W.targets.length - 1;
  }
  function setTargetsFromRects(list, need = 0.3) {
    W.targets = [null];
    for (const r of list) {
      const id = W.targets.length;
      let cnt = 0;
      for (let y = r.y0; y <= r.y1; y++) for (let x = r.x0; x <= r.x1; x++) {
        const i = y * W.w + x;
        if (mat[i] === SOLID && !tgt[i]) { tgt[i] = id; cnt++; }
      }
      if (cnt < 10) continue;
      W.targets.push({ id, label: r.label || 'target', total: cnt, left: cnt, need, done: false, x0: r.x0, y0: r.y0, x1: r.x1, y1: r.y1 });
    }
    return W.targets.length - 1;
  }
  function densityAround(x, y, r) {
    let n = 0, t = 0;
    for (let dy = -r; dy <= r; dy += 2) for (let dx = -r; dx <= r; dx += 2) { t++; if (frontAt(Math.floor(x + dx), Math.floor(y + dy))) n++; }
    return n / Math.max(1, t);
  }

  Object.assign(W, {
    rasterize, build, reset, solid, solidI, frontAt, carve, crumble, kill, detachGlyph, shatterGlass, shatterIce, freezeAt, updateIce, paintAt, corrode,
    ignite, igniteAt, igniteRing, updateBurn, placeRubble, updateSand, makeChunk, updateChunks, settle, grabDisk, releaseChunk, eraseBack, nearestSolid,
    raycast, flush, touch, color, setTargetsFromWords, setTargetsFromRects, densityAround, letterRing, isSolidM
  });
})();
