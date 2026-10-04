(() => {
  const WTP = window.WTP;
  const { P32, shade, mix, hash } = WTP;
  const F_PIN = 8, F_NOGLUE = 32;
  const SC = {};
  WTP.scenery = SC;
  const C = (k) => (typeof k === 'number' ? k : P32[k]);

  function kit(k) {
    const W = k.W, M = W.M;
    const ok = (x, y) => x >= 0 && y >= 0 && x < W.w && y < W.h - 3;
    const put = (x, y, c, m = M.METAL, fl = F_NOGLUE) => { x |= 0; y |= 0; if (ok(x, y) && c) W.setCell(x, y, C(c), m, fl); };
    const free = (x, y) => ok(x, y) && W.mat[y * W.w + x] !== W.SOLID && W.mat[y * W.w + x] !== W.ROCK;
    const paint = (x0, y0, w, h, fn, m, fl) => { for (let ly = 0; ly < h; ly++) for (let lx = 0; lx < w; lx++) { const c = fn(lx, ly); if (c) put(x0 + lx, y0 + ly, c, typeof m === 'function' ? m(lx, ly) : m, fl); } };
    const rect = (x0, y0, w, h, c, m, fl) => paint(x0, y0, w, h, () => c, m, fl);
    const pin = (x, y) => { if (ok(x, y)) W.flag[y * W.w + x] |= F_PIN; };
    const glass = (x0, y0, w, h, tint = 'C') => {
      const id = W.groups.length;
      let n = 0;
      for (let ly = 0; ly < h; ly++) for (let lx = 0; lx < w; lx++) {
        const x = x0 + lx, y = y0 + ly;
        if (!ok(x, y)) continue;
        const shine = (lx + ly) % 7 === 0 || (lx + ly) % 7 === 1;
        const c = shine ? P32['7'] : ly === 0 ? shade(C(tint), 1.15, 10) : mix(C(tint), P32.c, 0.25 + ((hash(x, y) & 3) * 0.05));
        put(x, y, c, M.GLASS, F_NOGLUE);
        const i = y * W.w + x;
        W.kind[i] = W.K_GLASS; W.gid[i] = id; n++;
      }
      W.groups.push({ t: 'glass', x0, y0, x1: x0 + w - 1, y1: y0 + h - 1, n });
    };
    const text = (cx, y, str, fg, o = {}) => {
      const tp = k.textPixels(str, '7');
      const x0 = Math.round(cx - tp.w / 2);
      for (let ty = 0; ty < tp.h; ty++) for (let tx = 0; tx < tp.w; tx++) if (tp.on[ty * tp.w + tx]) put(x0 + tx, y + ty, (hash(tx, ty) & 7) === 0 && o.spark ? P32['7'] : C(fg), o.m ?? M.PLASTIC);
      return { x0, w: tp.w, h: tp.h };
    };
    const textW = (str) => k.textPixels(str, '7').w;
    const ent = (o) => { k.ents.push(o); return o; };
    return { ...k, W, M, ok, put, free, paint, rect, pin, glass, text, textW, ent };
  }

  function brickWall(b, x0, y0, w, h, base, mortar, m) {
    b.paint(x0, y0, w, h, (lx, ly) => {
      const row = ly >> 1, off = (row & 1) * 3;
      if ((ly & 1) === 1 && ((lx + off) % 6 === 0)) return mortar;
      if (ly % 2 === 0 && ly > 0 && (lx + off) % 6 === 5) return mortar;
      const v = hash(x0 + lx, y0 + ly) & 7;
      return v === 0 ? shade(C(base), 0.85) : v === 1 ? shade(C(base), 1.1, 6) : C(base);
    }, m ?? b.M.STONE);
  }
  function windows(b, x0, y0, w, h, cols, rows, tint) {
    const ww = Math.max(2, Math.floor((w - (cols + 1) * 2) / cols)), wh = Math.max(3, Math.floor((h - (rows + 1) * 3) / rows));
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = x0 + 2 + c * (ww + 2), y = y0 + 3 + r * (wh + 3);
      if ((hash(x, y) & 3) === 0) b.rect(x, y, ww, wh, (hash(y, x) & 1) ? 'Y' : 'y', b.M.GLASS);
      else b.glass(x, y, ww, wh, tint);
      b.rect(x - 1, y + wh, ww + 2, 1, '5', b.M.STONE);
    }
  }
  function building(b, x0, w, gy, h, o = {}) {
    const top = gy - h + 1;
    brickWall(b, x0, top + 3, w, h - 3, o.brick || 'R', o.mortar || 'r');
    b.rect(x0 - 1, top, w + 2, 2, o.cap || '5', b.M.STONE);
    b.rect(x0 - 1, top + 2, w + 2, 1, '3', b.M.STONE);
    windows(b, x0 + 1, top + 4, w - 2, h - 10, Math.max(1, Math.floor(w / 9)), Math.max(1, Math.floor((h - 10) / 9)), o.tint || 'c');
    const dx = x0 + Math.floor(w / 2) - 3;
    b.rect(dx, gy - 7, 7, 7, 'w', b.M.WOOD);
    b.rect(dx + 1, gy - 6, 5, 6, 'W', b.M.WOOD);
    b.put(dx + 4, gy - 3, 'y', b.M.METAL);
    return top;
  }
  function waterTower(b, x, gy) {
    const legH = 14, tw = 18, th = 13;
    for (let y = gy - legH; y <= gy; y++) { b.put(x + 2, y, '3'); b.put(x + tw - 3, y, '3'); if ((y - gy) % 5 === 0) for (let q = 2; q < tw - 2; q++) b.put(x + q, y, '4'); }
    for (let d = 0; d < 10; d++) { b.put(x + 3 + d, gy - legH + 2 + d, '4'); b.put(x + tw - 4 - d, gy - legH + 2 + d, '4'); }
    const ty = gy - legH - th;
    b.paint(x, ty, tw, th, (lx, ly) => (ly === 2 || ly === th - 3 ? '1' : lx === 0 ? 'w' : lx === tw - 1 ? 'w' : (lx % 4 === 1 ? 'u' : 'W')), b.M.WOOD);
    b.paint(x - 1, ty - 6, tw + 2, 6, (lx, ly) => (Math.abs(lx - (tw + 1) / 2) <= ly * 1.7 + 1 ? (ly === 5 ? '2' : (lx & 1 ? '4' : '5')) : 0), b.M.METAL);
    b.text(x + tw / 2, ty + 4, 'H2O', '7', { m: b.M.WOOD });
    return ty - 6;
  }
  function billboard(b, cx, gy, label, bg, fg) {
    const tw = b.textW(label);
    const w = Math.max(40, tw + 12), h = 18, x0 = Math.round(cx - w / 2), y0 = gy - 30;
    for (let y = y0 + h; y <= gy; y++) { b.put(x0 + 6, y, '3'); b.put(x0 + 7, y, '4'); b.put(x0 + w - 8, y, '3'); b.put(x0 + w - 7, y, '4'); }
    b.paint(x0, y0, w, h, (lx, ly) => (lx === 0 || ly === 0 || lx === w - 1 || ly === h - 1 ? '1' : (ly < 4 ? shade(C(bg), 1.2, 12) : C(bg))), b.M.IMAGE);
    b.text(cx, y0 + 6, label, fg, { m: b.M.IMAGE, spark: true });
    b.rect(x0 - 2, y0 + h, w + 4, 2, '4', b.M.METAL);
    for (let lx = 3; lx < w; lx += 7) { b.put(x0 + lx, y0 - 1, '5'); b.put(x0 + lx, y0 - 2, 'Y', b.M.GLASS); }
    return { x0, y0, w, top: y0 - 2 };
  }
  function antenna(b, x, gy, h) {
    for (let y = gy - h; y <= gy; y++) { b.put(x - 2 + Math.round(((y - gy) / h) * 1.5), y, '3'); b.put(x + 2 - Math.round(((y - gy) / h) * 1.5), y, '3'); if ((y - gy) % 4 === 0) { b.put(x - 1, y, '4'); b.put(x, y, '4'); b.put(x + 1, y, '4'); } else if ((y & 1) === 0) b.put(x, y, '2'); }
    b.ent({ t: 'blink', x: x + 0.5, y: gy - h - 1, o: { c: 'e' } });
    return gy - h;
  }
  function acUnit(b, x, gy) {
    b.paint(x, gy - 6, 10, 7, (lx, ly) => (ly === 0 ? '6' : lx === 0 || lx === 9 ? '3' : (ly > 1 && ly < 6 && lx > 1 && lx < 8 ? ((lx + ly) & 1 ? '2' : '4') : '5')), b.M.METAL);
  }
  function column(b, x, gy, h, w = 5) {
    b.rect(x - 1, gy - 1, w + 2, 2, '5', b.M.STONE);
    b.paint(x, gy - h + 2, w, h - 3, (lx, ly) => (lx === 0 ? '7' : lx === w - 1 ? '4' : (lx & 1 ? '6' : '5')), b.M.STONE);
    b.rect(x - 1, gy - h, w + 2, 2, '6', b.M.STONE);
  }
  function pediment(b, x0, w, y, label) {
    const hh = Math.floor(w / 5);
    b.rect(x0, y, w, 4, '6', b.M.STONE);
    b.rect(x0, y + 4, w, 1, '4', b.M.STONE);
    for (let ly = 0; ly < hh; ly++) { const half = Math.round((w / 2) * (1 - ly / hh)); for (let lx = -half; lx <= half; lx++) b.put(x0 + w / 2 + lx, y - 1 - ly, Math.abs(lx) >= half - 1 ? '7' : (ly & 3) === 0 ? '5' : '6', b.M.STONE); }
    if (label) b.text(x0 + w / 2, y - Math.min(hh - 2, 8), label, '3', { m: b.M.STONE });
    return y - hh;
  }
  function bookshelf(b, x0, gy, w, h) {
    const books = ['e', 'b', 'G', 'a', 'P', 'c', 'R', 'n', 'y', 'g'];
    b.paint(x0, gy - h + 1, w, h, (lx, ly) => {
      if (lx === 0 || lx === w - 1 || ly === 0) return 'w';
      if (ly % 9 === 8) return 'W';
      const s = Math.floor(ly / 9), col = books[hash(x0 + lx >> 1, s * 7 + x0) % books.length];
      const bh = 3 + (hash(x0 + (lx >> 1), s) % 4);
      if (8 - (ly % 9) > bh) return shade(P32.w, 0.7);
      return (lx & 1) ? C(col) : shade(C(col), 0.8);
    }, (lx, ly) => (lx === 0 || lx === w - 1 || ly === 0 || ly % 9 === 8 ? b.M.WOOD : b.M.PAPER));
  }
  function awning(b, x0, y, w, c1, c2) {
    b.paint(x0, y, w, 4, (lx, ly) => (ly === 3 ? ((lx & 3) < 2 ? c1 : 0) : ((lx >> 2) & 1 ? c1 : c2)), b.M.RUBBER);
    b.ent({ t: 'spring', x: x0 + w / 2, y: y - 1, o: { hidden: true, power: 380 } });
  }
  function stall(b, x0, gy, w, c1, c2, goods) {
    for (let y = gy - 16; y <= gy; y++) { b.put(x0 + 1, y, 'w', b.M.WOOD); b.put(x0 + w - 2, y, 'w', b.M.WOOD); }
    b.paint(x0, gy - 5, w, 6, (lx, ly) => (ly === 0 ? 'u' : ly === 5 ? 'w' : (lx % 5 === 0 ? 'w' : 'W')), b.M.WOOD);
    for (let q = 0; q < Math.floor((w - 4) / 4); q++) { const c = goods[q % goods.length]; b.rect(x0 + 2 + q * 4, gy - 8, 3, 3, c, b.M.PLASTIC); b.put(x0 + 3 + q * 4, gy - 8, '7', b.M.PLASTIC); }
    awning(b, x0 - 2, gy - 20, w + 4, c1, c2);
  }
  function cloud(b, cx, cy, r, dark) {
    const lobes = [[0, 0, 1], [-0.8, 0.25, 0.75], [0.8, 0.25, 0.7], [-0.4, -0.35, 0.65], [0.45, -0.3, 0.6]];
    for (const [ox, oy, s] of lobes) {
      const rr = r * s, lx0 = cx + ox * r, ly0 = cy + oy * r;
      for (let y = -rr; y <= rr; y++) for (let x = -rr * 1.2; x <= rr * 1.2; x++) {
        if ((x / 1.2) * (x / 1.2) + y * y > rr * rr) continue;
        const yy = Math.round(ly0 + y), xx = Math.round(lx0 + x);
        if (yy > cy + r * 0.45) continue;
        const shadeK = (yy - (cy - r)) / (r * 1.6);
        b.put(xx, yy, dark ? (shadeK > 0.7 ? '2' : shadeK > 0.4 ? '3' : '4') : (shadeK > 0.75 ? 'C' : shadeK > 0.55 ? '6' : '7'), b.M.RUBBER);
      }
    }
    b.pin(Math.round(cx), Math.round(cy)); b.pin(Math.round(cx) + 1, Math.round(cy)); b.pin(Math.round(cx), Math.round(cy) + 1);
    return Math.round(cy - r);
  }
  function balloon(b, cx, cy) {
    const R = 11, cols = ['e', 'y', 'e', 'c', 'y', 'c'];
    for (let y = -R; y <= R + 4; y++) for (let x = -R; x <= R; x++) {
      const rr = y > 0 ? R - y * 0.55 : R;
      if (x * x + Math.min(0, y) * Math.min(0, y) > rr * rr || rr <= 0) continue;
      if (y > 0 && Math.abs(x) > rr) continue;
      const band = Math.floor((x + R) / 4);
      b.put(cx + x, cy + y, x < -rr + 2 ? shade(C(cols[band % 6]), 0.75) : cols[band % 6], b.M.PAPER);
    }
    for (let y = cy + R + 5; y < cy + R + 12; y++) { b.put(cx - 4, y, '4'); b.put(cx + 4, y, '4'); }
    b.paint(cx - 5, cy + R + 12, 11, 6, (lx, ly) => (ly === 0 ? 'u' : (lx + ly) & 1 ? 'W' : 'w'), b.M.WOOD);
    b.pin(cx, cy); b.pin(cx, cy + R + 14);
    return cy - R;
  }
  function serverRack(b, x0, gy, w, h) {
    b.paint(x0, gy - h + 1, w, h, (lx, ly) => {
      if (lx === 0 || lx === w - 1 || ly === 0) return '1';
      if (ly % 5 === 0) return '2';
      if (ly % 5 === 2 && lx > 1 && lx < w - 2) return lx % 3 === 0 ? (((hash(x0 + lx, ly) & 3) === 0) ? 'e' : 'l') : '0';
      return lx === 1 ? '3' : '2';
    }, b.M.METAL);
    for (let ly = 2; ly < h - 2; ly += 10) b.ent({ t: 'blink', x: x0 + w - 3.5, y: gy - h + 1 + ly + 0.5, o: { c: (ly / 10) & 1 ? 'l' : 'c', rate: 0.5 + (ly % 3) * 0.3 } });
  }
  function dish(b, x, gy) {
    for (let y = gy - 8; y <= gy; y++) b.put(x, y, '3');
    b.rect(x - 3, gy, 7, 1, '2');
    for (let a = 0; a < 18; a++) { const t = a / 17; const dx = Math.round(-9 + t * 18), dy = Math.round(-8 - Math.sin(t * Math.PI) * -4 - (1 - Math.abs(t - 0.5) * 2) * 3); b.put(x + dx, gy + dy - 6, a & 1 ? '6' : '5'); b.put(x + dx, gy + dy - 5, '4'); }
    b.put(x + 1, gy - 18, 'e'); b.put(x, gy - 17, '3'); b.put(x + 1, gy - 16, '3');
  }
  function tree(b, x, gy, h, leafA = 'G', leafB = 'l') {
    for (let y = gy - h; y <= gy; y++) for (let q = -2; q <= 2; q++) b.put(x + q, y, q === -2 ? 'w' : q === 2 ? shade(P32.w, 0.75) : ((hash(q, y >> 1) & 3) === 0 ? 'w' : 'W'), b.M.WOOD);
    for (let q = -6; q <= 6; q++) b.put(x + q, gy, (q & 1) ? 'w' : 'W', b.M.WOOD);
    const branches = [];
    for (let k2 = 0; k2 < 3; k2++) {
      const by = gy - Math.round(h * (0.35 + k2 * 0.22)), dir = k2 & 1 ? 1 : -1, len = 14 + k2 * 3;
      for (let q = 0; q < len; q++) { b.put(x + dir * (3 + q), by - Math.floor(q / 6), 'W', b.M.WOOD); b.put(x + dir * (3 + q), by + 1 - Math.floor(q / 6), 'w', b.M.WOOD); }
      branches.push({ x: x + dir * (3 + len), y: by - Math.floor(len / 6) - 1, dir });
    }
    const canopy = (cx, cy, r) => { for (let y = -r; y <= r; y++) for (let q = -r - 3; q <= r + 3; q++) { if ((q / 1.25) ** 2 + y * y > r * r) continue; const v = hash(cx + q, cy + y) & 7; b.put(cx + q, cy + y, y < -r * 0.4 ? (v < 2 ? 'L' : leafB) : v === 0 ? 'g' : v < 3 ? leafB : leafA, b.M.PAPER); } };
    canopy(x, gy - h - 4, 12);
    for (const br of branches) canopy(br.x, br.y - 4, 6);
    return { top: gy - h - 16, branches };
  }
  function treehouse(b, x0, gy) {
    const w = 22, h = 14;
    b.rect(x0 - 2, gy, w + 4, 2, 'w', b.M.WOOD);
    b.paint(x0, gy - h, w, h, (lx, ly) => (lx === 0 || lx === w - 1 ? 'w' : (ly % 3 === 2 ? 'w' : 'u')), b.M.WOOD);
    b.glass(x0 + 4, gy - h + 4, 5, 4, 'C');
    b.rect(x0 + 13, gy - 8, 5, 8, '0', b.M.WOOD);
    for (let ly = 0; ly < 7; ly++) for (let lx = -ly - 2; lx <= w + ly + 1; lx++) if (lx === -ly - 2 || lx === w + ly + 1 || ly === 6 || ((lx + ly) & 3) === 0) b.put(x0 + lx, gy - h - 7 + ly, ly === 6 ? 'R' : 'e', b.M.WOOD); else b.put(x0 + lx, gy - h - 7 + ly, 'R', b.M.WOOD);
    return gy - h - 7;
  }
  function arcadeCab(b, x0, gy, body, label) {
    const w = 24, h = 40;
    b.paint(x0, gy - h + 1, w, h, (lx, ly) => {
      if (lx === 0 || lx === w - 1) return shade(C(body), 0.6);
      if (ly < 7) return ly === 0 || ly === 6 ? '1' : '0';
      if (ly > 26 && ly < 31) return ly === 27 ? '6' : '2';
      return (lx & 3) === 0 ? shade(C(body), 0.85) : C(body);
    }, b.M.PLASTIC);
    b.text(x0 + w / 2, gy - h + 2, label.slice(0, 6), 'y', { m: b.M.PLASTIC });
    const sx = x0 + 3, sy = gy - h + 9, sw = w - 6, sh = 15;
    b.region('video', sx, sy, sw, sh, (lx, ly) => (lx === 0 || ly === 0 || lx === sw - 1 || ly === sh - 1 ? '1' : ((lx + ly * 3) % 11 === 0 ? 'c' : '0')), b.M.IMAGE);
    b.put(x0 + 6, gy - h + 28, 'e'); b.put(x0 + 10, gy - h + 28, 'l'); b.put(x0 + 13, gy - h + 28, 'c');
    return gy - h;
  }
  function eqBars(b, x0, gy, n, maxH) {
    const cols = ['l', 'L', 'y', 'a', 'o', 'e', 'k', 'P'];
    for (let q = 0; q < n; q++) {
      const hh = 6 + Math.round((Math.sin(q * 1.3) * 0.5 + 0.5) * maxH);
      for (let ly = 0; ly < hh; ly++) { const seg = Math.floor(ly / 3); if (ly % 3 === 2) continue; b.rect(x0 + q * 6, gy - ly, 5, 1, cols[Math.min(cols.length - 1, seg)], b.M.PLASTIC); }
    }
  }
  function neon(b, cx, y, label, col) {
    const t = b.text(cx, y, label, col, { m: b.M.GLASS });
    b.rect(t.x0 - 3, y - 2, t.w + 6, 1, '2', b.M.METAL);
    b.rect(t.x0 - 3, y + t.h + 1, t.w + 6, 1, '2', b.M.METAL);
    b.rect(t.x0 - 3, y - 2, 1, t.h + 4, '2', b.M.METAL);
    b.rect(t.x0 + t.w + 2, y - 2, 1, t.h + 4, '2', b.M.METAL);
    return t;
  }
  function vaultDoor(b, cx, cy, r) {
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
      const d = Math.hypot(x, y);
      if (d > r) continue;
      const a = Math.atan2(y, x);
      let c = d > r - 2 ? '3' : d > r - 4 ? '5' : d < 3 ? 'y' : d < 5 ? '4' : '6';
      if (d < r - 4 && d > 6 && (Math.round(a * 6 / Math.PI) & 1) === 0 && Math.abs(Math.sin(a * 3)) < 0.18) c = '3';
      b.put(cx + x, cy + y, c, b.M.METAL);
    }
    for (let q = -r + 4; q < r - 4; q += 5) { b.put(cx + q, cy - r + 3, '7'); }
  }
  function goldPile(b, x0, gy, rows) {
    for (let r = 0; r < rows; r++) for (let q = 0; q < rows - r; q++) {
      const bx = x0 + q * 7 + r * 3, by = gy - 2 - r * 3;
      b.paint(bx, by, 6, 3, (lx, ly) => (ly === 0 ? (lx === 0 || lx === 5 ? 'a' : 'Y') : ly === 2 ? 'a' : 'y'), b.M.GOLD);
    }
  }
  function gantry(b, x0, gy, h, w) {
    for (let y = gy - h; y <= gy; y++) {
      b.put(x0, y, 'e'); b.put(x0 + w - 1, y, 'e');
      const k2 = (y - gy) % 12;
      if (k2 === 0) for (let q = 0; q < w; q++) b.put(x0 + q, y, '5');
      const t = ((y - gy) % 12 + 12) % 12;
      b.put(x0 + Math.round((t / 12) * (w - 1)), y, 'R'); b.put(x0 + w - 1 - Math.round((t / 12) * (w - 1)), y, 'R');
    }
    for (let q = -6; q < w + 6; q++) b.put(x0 + q, gy - h, q & 1 ? '4' : '5');
    b.ent({ t: 'blink', x: x0 + 0.5, y: gy - h - 1, o: { c: 'e' } });
    b.ent({ t: 'blink', x: x0 + w - 0.5, y: gy - h - 1, o: { c: 'e', rate: 1.3 } });
  }
  function island(b, cx, cy, w, top = 'm') {
    const h = Math.round(w * 0.45);
    for (let y = 0; y < h; y++) {
      const half = Math.round((w / 2) * (1 - (y / h) ** 1.4) - (hash(cx, y) & 1));
      for (let x = -half; x <= half; x++) b.put(cx + x, cy + y, y === 0 ? top : y === 1 ? shade(C(top), 0.7) : ((hash(cx + x, cy + y) & 7) === 0 ? '2' : (x + y) & 3 ? '3' : '4'), b.M.STONE);
    }
    b.pin(cx, cy + 1); b.pin(cx + 1, cy + 1); b.pin(cx, cy + 2);
    return cy;
  }
  function ufo(b, cx, cy) {
    b.glass(cx - 5, cy - 6, 11, 5, 'L');
    for (let x = -14; x <= 14; x++) { const t = Math.abs(x) / 14; for (let y = 0; y < 4 - Math.round(t * 2); y++) b.put(cx + x, cy - 1 + y, y === 0 ? '6' : (x & 3) === 0 && y === 1 ? ((x >> 2) & 1 ? 'k' : 'y') : '4', b.M.METAL); }
    b.pin(cx, cy); b.pin(cx, cy + 1);
    return cy - 6;
  }
  function pipe(b, x0, y0, x1, y1, col = '4') {
    const hor = y0 === y1;
    const n = hor ? Math.abs(x1 - x0) : Math.abs(y1 - y0);
    for (let t = 0; t <= n; t++) {
      const x = hor ? Math.min(x0, x1) + t : x0, y = hor ? y0 : Math.min(y0, y1) + t;
      for (let q = -1; q <= 1; q++) b.put(hor ? x : x + q, hor ? y + q : y, q === -1 ? shade(C(col), 1.25, 10) : q === 1 ? shade(C(col), 0.7) : C(col), b.M.METAL);
      if (t % 14 === 0) for (let q = -2; q <= 2; q++) b.put(hor ? x : x + q, hor ? y + q : y, '2', b.M.METAL);
    }
  }
  function chip(b, cx, cy) {
    const w = 30, h = 20, x0 = cx - w / 2, y0 = cy - h / 2;
    b.paint(x0, y0, w, h, (lx, ly) => (lx === 0 || ly === 0 || lx === w - 1 || ly === h - 1 ? '2' : (lx > 8 && lx < 21 && ly > 5 && ly < 14 ? (((lx + ly) & 1) ? '5' : '6') : '1')), b.M.METAL);
    for (let q = 2; q < w - 2; q += 3) { b.rect(x0 + q, y0 - 3, 1, 3, 'y', b.M.GOLD); b.rect(x0 + q, y0 + h, 1, 3, 'y', b.M.GOLD); }
    b.text(cx, y0 + 7, 'CPU', 'c', { m: b.M.METAL });
    b.ent({ t: 'blink', x: x0 + 3.5, y: y0 + 3.5, o: { c: 'l', rate: 0.4 } });
  }

  function steam(b, x, y) { b.ent({ t: 'steam', x: x + 0.5, y, o: { period: 2.2 + (hash(x, y) & 3) * 0.5 } }); }

  const SKY = {
    city(b) {
      const { PX0, PX1, top } = b;
      const gy = top - 1, pw = PX1 - PX0;
      const lw = Math.min(64, Math.round(pw * 0.26)), lh = 48;
      const lt = building(b, PX0 + 6, lw, gy, lh, { brick: 'R', mortar: 'r', tint: 'c' });
      const wt = waterTower(b, PX0 + 10, lt - 1);
      b.secret(PX0 + 19, lt - 6);
      const rw = Math.min(54, Math.round(pw * 0.22)), rh = 32, rx = PX1 - rw - 8;
      const rt = building(b, rx, rw, gy, rh, { brick: 'b', mortar: 'n', cap: '6', tint: 'C' });
      antenna(b, rx + rw - 8, rt - 1, 26);
      acUnit(b, rx + 4, rt - 1); acUnit(b, rx + 16, rt - 1);
      const bb = billboard(b, PX0 + pw / 2, gy, b.th.sign, b.th.tint === '5' ? 'n' : b.th.tint, 'Y');
      b.ent({ t: 'spring', x: PX0 + lw + 14, y: gy });
      b.ent({ t: 'wire', x: rx + rw - 8, y: rt - 20, o: { len: 14 } });
      b.platform(PX0 + lw + 10, gy - 44, 22, 'girder');
      b.ent({ t: 'shards', x: rx + rw / 2, y: rt - 1, w: 10 });
      b.spawn(PX0 + pw / 2, bb.top);
      return wt;
    },
    library(b) {
      const { PX0, PX1, top } = b;
      const gy = top - 1, pw = PX1 - PX0;
      const tw = Math.min(150, Math.round(pw * 0.6)), tx = Math.round(PX0 + (pw - tw) / 2);
      for (let s = 0; s < 3; s++) b.rect(tx - 6 + s * 3, gy - s * 2, tw + 12 - s * 6, 2, s & 1 ? '5' : '6', b.M.STONE);
      const colH = 36, cy = gy - 6;
      const n = Math.max(3, Math.floor(tw / 22));
      for (let q = 0; q < n; q++) column(b, tx + 4 + Math.round(q * ((tw - 14) / (n - 1))), cy, colH);
      const pt = pediment(b, tx - 4, tw + 8, cy - colH - 4, b.th.sign);
      b.secret(tx + tw / 2, cy - colH + 2);
      const sw = Math.min(26, Math.round((PX0 + pw - (tx + tw) - 10)));
      if (sw > 12) bookshelf(b, tx + tw + 6, gy, sw, 37);
      if (tx - PX0 - 10 > 12) { bookshelf(b, PX0 + 4, gy, Math.min(26, tx - PX0 - 10), 28); b.ent({ t: 'spring', x: PX0 + 8 + Math.min(13, (tx - PX0 - 10) / 2), y: gy - 28 }); }
      b.ent({ t: 'shards', x: tx + tw / 2, y: gy - 6, w: 12 });
      b.spawn(tx + tw / 2, pt);
    },
    market(b) {
      const { PX0, PX1, top } = b;
      const gy = top - 1, pw = PX1 - PX0;
      const goods = [['e', 'a', 'y'], ['l', 'G', 'L'], ['c', 'k', 'P'], ['o', 'u', 'y']];
      const sw = 30, n = Math.max(2, Math.floor((pw - 30) / 48));
      const awn = [['e', '7'], ['G', '7'], ['b', 'Y'], ['k', '7']];
      for (let q = 0; q < n; q++) { const x = Math.round(PX0 + 12 + q * ((pw - 24 - sw) / Math.max(1, n - 1))); stall(b, x, gy, sw, awn[q % 4][0], awn[q % 4][1], goods[q % 4]); }
      const sign = neon(b, PX0 + pw / 2, gy - 76, b.th.sign, 'k');
      b.platform(sign.x0 - 8, gy - 40, sign.w + 16, 'girder');
      for (let y = gy - 70; y < gy - 40; y++) { b.put(sign.x0 - 4, y, '3'); b.put(sign.x0 + sign.w + 3, y, '3'); }
      b.crate(sign.x0 - 6, gy - 49, 9); b.crate(sign.x0 + 4, gy - 49, 9);
      b.barrel(sign.x0 + sign.w + 2, gy - 49, false);
      b.secret(PX0 + pw / 2, gy - 46);
      b.spawn(PX0 + pw / 2, gy - 40);
    },
    cozy(b) {
      const { PX0, PX1, top } = b;
      const gy = top - 1, pw = PX1 - PX0;
      const t = tree(b, PX0 + 34, gy, 52, b.th.leafA || 'G', b.th.leafB || 'l');
      const thx = Math.min(PX1 - 40, PX0 + 70);
      const ht = treehouse(b, thx, gy - 34);
      for (let y = gy - 33; y <= gy; y++) { b.put(thx + 2, y, 'w', b.M.WOOD); b.put(thx + 18, y, 'w', b.M.WOOD); if ((y - gy) % 4 === 0) for (let q = 3; q < 18; q++) b.put(thx + q, y, 'W', b.M.WOOD); }
      b.secret(thx + 8, gy - 40);
      for (let x = PX0 + 4; x < PX1 - 4; x++) { const fx = x - PX0; if (fx % 6 === 0) for (let y = gy - 7; y <= gy; y++) b.put(x, y, y === gy - 7 ? '6' : '7', b.M.WOOD); else { b.put(x, gy - 5, '6', b.M.WOOD); b.put(x, gy - 2, '6', b.M.WOOD); } }
      const mx = PX1 - 26;
      b.rect(mx, gy - 12, 2, 12, 'w', b.M.WOOD);
      b.paint(mx - 4, gy - 18, 10, 6, (lx, ly) => (ly === 0 ? 'R' : lx === 9 && ly < 3 ? 'e' : 'e'), b.M.METAL);
      b.text(PX0 + pw / 2 + 24, gy - 30, b.th.sign, b.th.tint === '5' ? 'u' : b.th.tint, { m: b.M.WOOD, spark: true });
      b.ent({ t: 'spring', x: PX0 + 60, y: gy - 8 });
      b.spawn(thx + 10, ht);
      return t;
    },
    tech(b) {
      const { PX0, PX1, top } = b;
      const gy = top - 1, pw = PX1 - PX0;
      const n = Math.max(3, Math.floor(pw / 45));
      let hi = { y: gy, x: PX0 + pw / 2 };
      for (let q = 0; q < n; q++) {
        const x = Math.round(PX0 + 8 + q * ((pw - 30) / (n - 1))), h = 22 + ((q * 13) % 3) * 12;
        serverRack(b, x, gy, 16, h);
        if (gy - h < hi.y) hi = { y: gy - h, x: x + 8 };
        if (q < n - 1) b.ent({ t: 'wire', x: x + 15, y: gy - h + 3, o: { len: 10 + (q % 3) * 4 } });
        if (q === 1) b.ent({ t: 'fan', x: x + 8, y: gy - h - 8, dir: 1, o: { reach: 60 } });
      }
      dish(b, PX1 - 18, gy - 4);
      b.text(PX0 + pw / 2, gy - 70, b.th.sign, b.th.tint, { m: b.M.GLASS, spark: true });
      b.platform(PX0 + pw / 2 - 30, gy - 60, 60, 'server');
      b.secret(PX0 + pw / 2, gy - 64);
      b.spawn(hi.x, hi.y);
    },
    sky(b) {
      const { PX0, PX1, top } = b;
      const gy = top - 1, pw = PX1 - PX0;
      const dark = b.th.dark;
      const c1 = cloud(b, PX0 + pw * 0.2, gy - 14, 10, dark);
      cloud(b, PX0 + pw * 0.5, gy - 40, 12, dark);
      cloud(b, PX0 + pw * 0.8, gy - 22, 9, dark);
      cloud(b, PX0 + pw * 0.08, gy - 58, 8, dark);
      if (dark) { for (let q = 0; q < 3; q++) b.ent({ t: 'wire', x: PX0 + pw * (0.3 + q * 0.25), y: gy - 30 + q * 8, o: { len: 12, bolt: true } }); }
      else balloon(b, Math.round(PX0 + pw * 0.78), gy - 66);
      for (let k2 = 0; k2 < 7; k2++) { const cols = ['e', 'o', 'y', 'l', 'c', 'b', 'P']; const r = 30 - k2; for (let a = 0; a <= 160; a++) { const t = Math.PI * (a / 160); b.put(Math.round(PX0 + pw * 0.5 + Math.cos(t) * r * 1.8), Math.round(gy - 4 - Math.sin(t) * r), cols[k2], b.M.PAPER); } }
      b.text(PX0 + pw / 2, gy - 82, b.th.sign, dark ? 'y' : 'b', { m: b.M.RUBBER, spark: true });
      b.secret(PX0 + pw * 0.5, gy - 44);
      b.spawn(PX0 + pw * 0.5, gy - 52);
      return c1;
    },
    arcade(b) {
      const { PX0, PX1, top } = b;
      const gy = top - 1, pw = PX1 - PX0;
      const n = Math.max(2, Math.min(4, Math.floor(pw / 60)));
      const bodies = ['P', 'e', 'b', 'G'];
      let tp = gy;
      for (let q = 0; q < n; q++) { const x = Math.round(PX0 + 10 + q * ((pw - 44) / Math.max(1, n - 1))); tp = arcadeCab(b, x, gy, bodies[q % 4], ['ZAP', 'BLAST', 'PIX', 'WRECK'][q % 4]); }
      eqBars(b, PX0 + 40, gy, Math.min(12, Math.floor((pw - 80) / 6)), 14);
      const ns = neon(b, PX0 + pw / 2, gy - 72, b.th.sign, b.th.tint === 'y' ? 'y' : 'k');
      b.platform(ns.x0 - 4, gy - 60, ns.w + 8, 'plastic');
      b.secret(PX0 + pw / 2, gy - 64);
      b.ent({ t: 'spring', x: PX0 + pw / 2, y: gy - 1 });
      b.spawn(PX0 + 22, tp);
    },
    vault(b) {
      const { PX0, PX1, top } = b;
      const gy = top - 1, pw = PX1 - PX0;
      const fw = Math.min(170, Math.round(pw * 0.7)), fx = Math.round(PX0 + (pw - fw) / 2), fh = 50;
      b.paint(fx, gy - fh + 1, fw, fh, (lx, ly) => (ly < 3 ? '6' : (lx % 24 < 2 ? '5' : ((ly >> 2) & 1 ? '4' : '5'))), b.M.STONE);
      vaultDoor(b, fx + fw / 2, gy - fh / 2 + 2, 18);
      b.rect(fx - 3, gy - fh - 2, fw + 6, 3, 'y', b.M.GOLD);
      b.text(fx + fw / 2, gy - fh - 12, b.th.sign, 'y', { m: b.M.GOLD, spark: true });
      goldPile(b, fx - 30 > PX0 ? fx - 30 : PX0 + 2, gy, 4);
      b.safe(fx + fw - 18, gy - fh - 15);
      b.piggy(fx + 6, gy - fh - 9);
      b.ent({ t: 'wire', x: fx + fw / 2 - 30, y: gy - fh + 4, o: { len: 16 } });
      b.ent({ t: 'wire', x: fx + fw / 2 + 30, y: gy - fh + 4, o: { len: 16 } });
      b.secret(fx + fw / 2, gy - fh / 2 + 2);
      b.spawn(fx + fw / 2, gy - fh - 3);
    },
    space(b) {
      const { PX0, PX1, top } = b;
      const gy = top - 1, pw = PX1 - PX0;
      gantry(b, PX0 + 14, gy, 70, 14);
      for (let q = 0; q < 4; q++) b.platform(PX0 + 28, gy - 14 - q * 16, 14 + q * 4, 'girder');
      dish(b, PX1 - 30, gy - 4);
      for (let q = 0; q < 3; q++) b.barrel(Math.round(PX0 + pw * 0.45 + q * 11), gy - 10, true);
      b.text(PX0 + pw / 2, gy - 64, b.th.sign, 'c', { m: b.M.METAL, spark: true });
      b.platform(PX0 + pw / 2 - 24, gy - 54, 48, 'girder');
      b.secret(PX0 + pw / 2, gy - 58);
      b.ent({ t: 'fan', x: PX0 + pw * 0.7, y: gy - 6, dir: -1, o: { reach: 80 } });
      b.spawn(PX0 + 21, gy - 71);
    },
    void(b) {
      const { PX0, PX1, top } = b;
      const gy = top - 1, pw = PX1 - PX0;
      const iw = Math.max(20, Math.round(pw * 0.11));
      island(b, Math.round(PX0 + pw * 0.2), gy - 20, iw + 6);
      island(b, Math.round(PX0 + pw * 0.5), gy - 44, iw + 10);
      island(b, Math.round(PX0 + pw * 0.8), gy - 26, iw + 2);
      island(b, Math.round(PX0 + pw * 0.33), gy - 68, iw);
      for (let y = gy - 40; y < gy - 20; y += 2) b.put(Math.round(PX0 + pw * 0.2) + 6, y, '5');
      ufo(b, Math.round(PX0 + pw * 0.72), gy - 70);
      const t = b.text(PX0 + pw / 2, gy - 10, '404', 'm', { m: b.M.STONE });
      for (let q = 0; q < 3; q++) b.ent({ t: 'shards', x: PX0 + pw * (0.2 + q * 0.3), y: gy, w: 8 });
      b.secret(PX0 + pw * 0.5, gy - 40);
      b.spawn(PX0 + pw * 0.5, gy - 44);
      return t;
    }
  };

  const SIDE_DECOR = {
    city(b, x0, x1, y) { if ((y & 7) < 3) b.glass(x0 + 3, y - 6, Math.max(2, x1 - x0 - 6), 5, 'c'); else b.ent({ t: 'blink', x: (x0 + x1) / 2, y: y - 2, o: { c: 'y', rate: 1.5 } }); },
    library(b, x0, x1, y) { const w = x1 - x0 - 1; if (w > 6) bookshelf(b, x0 + 1, y - 1, w, 10); },
    market(b, x0, x1, y) { if (x1 - x0 > 12) b.crate(x0 + 2, y - 9, 9); },
    cozy(b, x0, x1, y) { for (let q = x0; q <= x1; q++) if ((hash(q, y) & 3) !== 0) b.put(q, y - 1, (hash(q, y) & 1) ? 'l' : 'G', b.M.PAPER); },
    tech(b, x0, x1, y) { if (x1 - x0 > 10) serverRack(b, x0 + 2, y - 1, Math.min(12, x1 - x0 - 3), 9); },
    sky(b, x0, x1, y) { cloud(b, (x0 + x1) / 2, y - 4, 4, b.th.dark); },
    arcade(b, x0, x1, y) { for (let q = x0 + 1; q < x1; q += 3) b.put(q, y - 1, ['k', 'c', 'y', 'l'][(q >> 1) & 3], b.M.GLASS); },
    vault(b, x0, x1, y) { if (x1 - x0 > 8) goldPile(b, x0 + 1, y - 1, 2); },
    space(b, x0, x1, y) { b.ent({ t: 'blink', x: (x0 + x1) / 2, y: y - 2, o: { c: 'c', rate: 0.9 } }); },
    void(b, x0, x1, y) { for (let q = x0; q <= x1; q++) if ((hash(q, y) & 1)) b.put(q, y - 1, 'm', b.M.STONE); }
  };

  SC.sky = (k) => { const b = kit(k); const fam = SKY[k.th.fam] ? k.th.fam : 'city'; SKY[fam](b); };
  SC.sideDecor = (k, x0, x1, y) => { const b = kit(k); const f = SIDE_DECOR[k.th.fam] || SIDE_DECOR.city; f(b, x0, x1, y); };

  SC.basement = (k) => {
    const b = kit(k);
    const W = b.W, R = k.R;
    const y0 = W.bottom, y1 = W.h - 4;
    if (y1 - y0 < 30) return;
    const x0 = 2, x1 = W.w - 3, PX0 = k.PX0, PX1 = k.PX1;
    const tint = b.th.tint || 'c';
    const wallC = mix(P32['2'], C(tint), 0.15), wallD = mix(P32['1'], C(tint), 0.1);
    for (let y = y0 + 6; y <= y1; y++) { for (let q = 0; q < 3; q++) { b.put(x0 + q, y, q === 2 ? wallD : wallC, b.M.STONE); b.put(x1 - q, y, q === 2 ? wallD : wallC, b.M.STONE); } }
    pipe(b, x0 + 3, y0 + 8, x1 - 3, y0 + 8, '4');
    for (let q = 0; q < 4; q++) {
      const px = Math.round(PX0 + 20 + q * ((PX1 - PX0 - 40) / 3));
      pipe(b, px, y0 + 9, px, y0 + 22, q & 1 ? 'a' : '4');
      steam(b, px + 6, y1);
    }
    const midY = Math.round((y0 + y1) / 2) + 4;
    const lw = Math.round((x1 - x0) * 0.3);
    b.platform(x0 + 3, midY, lw, 'girder', 0);
    b.platform(x1 - 2 - lw, midY + 8, lw, 'girder', 0);
    for (let q = 0; q < 3; q++) b.crate(x0 + 6 + q * 10, midY - 9, 9);
    b.barrel(x1 - lw + 4, midY - 3, true);
    b.safe(x1 - 22, y1 - 13);
    const cx = Math.round((PX0 + PX1) / 2);
    const fam = k.th.fam;
    if (fam === 'cozy') { for (let q = -40; q <= 40; q += 2) b.put(cx + q, y0 + 3 + Math.round(Math.abs(Math.sin(q * 0.15)) * 6), 'w', b.M.WOOD); island(b, cx, y1 - 14, 30, 'G'); }
    else if (fam === 'vault') { vaultDoor(b, cx, y1 - 18, 16); goldPile(b, cx - 50, y1, 4); goldPile(b, cx + 24, y1, 4); }
    else if (fam === 'library') { for (let q = -2; q <= 2; q++) column(b, cx + q * 18, y1, 30); b.rect(cx - 42, y1 - 30, 86, 3, '6', b.M.STONE); }
    else if (fam === 'sky') { cloud(b, cx, y1 - 18, 14, true); for (let q = 0; q < 3; q++) b.ent({ t: 'wire', x: cx - 20 + q * 20, y: y1 - 12, o: { len: 8, bolt: true } }); }
    else if (fam === 'arcade') { arcadeCab(b, cx - 12, y1, 'k', 'BOSS'); eqBars(b, cx + 20, y1, 8, 18); }
    else if (fam === 'void') { ufo(b, cx, y1 - 26); island(b, cx - 50, y1 - 10, 24); }
    else { chip(b, cx, y1 - 16); for (let q = -3; q <= 3; q++) if (q) pipe(b, cx + q * 14, y1 - 6, cx + q * 14, y1, 'y'); }
    b.ent({ t: 'secret', x: x0 + 8, y: y1 - 3, o: { idx: 5 } });
    for (let x = x0 + 3; x < x1 - 2; x++) if ((hash(x, y1) & 3) === 0) b.put(x, y1, mix(P32['3'], C(tint), 0.2), b.M.STONE);
    b.text(cx, y0 + 30, 'BEHIND THE PAGE', mix(P32['5'], C(tint), 0.3), { m: b.M.STONE });
    for (let q = 0; q < 5; q++) b.ent({ t: 'blink', x: R.int(x0 + 10, x1 - 10) + 0.5, y: y0 + 4.5, o: { c: q & 1 ? 'y' : tint, rate: 0.6 + q * 0.2 } });
  };
})();
