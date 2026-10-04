(() => {
  const cv = document.getElementById('cv');
  const ctx = cv.getContext('2d');
  const $ = (id) => document.getElementById(id);
  const intro = $('intro');
  const CELL = 2, A = 1, BORDER = 12;
  const TOOLS = { stick: { n: 1, t: 6 }, rake: { n: 5, t: 4.5 }, wide: { n: 9, t: 4.5 } };
  let W = 0, H = 0, dpr = 1, GW = 0, GH = 0, hgt = null, grainV = null;
  const sand = document.createElement('canvas'), sctx = sand.getContext('2d');
  const grain = document.createElement('canvas'), gctx = grain.getContext('2d');
  let simg = null, spix = null, dirty = null, tool = 'rake', time = 0, objects = [], petals = [], flatAnim = 0;
  let rake = null;
  const little = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1;

  function markDirty(x0, y0, x1, y1) {
    x0 = Math.max(0, Math.floor(x0) - 2); y0 = Math.max(0, Math.floor(y0) - 2);
    x1 = Math.min(GW, Math.ceil(x1) + 2); y1 = Math.min(GH, Math.ceil(y1) + 2);
    if (!dirty) dirty = [x0, y0, x1, y1];
    else { dirty[0] = Math.min(dirty[0], x0); dirty[1] = Math.min(dirty[1], y0); dirty[2] = Math.max(dirty[2], x1); dirty[3] = Math.max(dirty[3], y1); }
  }

  const LX = -0.55, LY = -0.62, LZ = 0.56;
  function relight(x0, y0, x1, y1) {
    const k = 0.85;
    for (let y = y0; y < y1; y++) {
      const ym = y > 0 ? y - 1 : y, yp = y < GH - 1 ? y + 1 : y;
      for (let x = x0; x < x1; x++) {
        const i = y * GW + x;
        const xm = x > 0 ? i - 1 : i, xp = x < GW - 1 ? i + 1 : i;
        const nx = -(hgt[xp] - hgt[xm]) * k, ny = -(hgt[yp * GW + x] - hgt[ym * GW + x]) * k;
        const inv = 1 / Math.sqrt(nx * nx + ny * ny + 1);
        let d = (nx * LX + ny * LY + LZ) * inv;
        d = d < 0 ? 0 : d;
        const ao = 0.93 + 0.07 * Math.max(-1, Math.min(1, hgt[i]));
        const s = (0.6 + 0.52 * d) * ao * grainV[i];
        let r = 232 * s, g = 214 * s, b = 176 * s;
        r = r > 255 ? 255 : r; g = g > 255 ? 255 : g; b = b > 255 ? 255 : b;
        spix[i] = little ? (0xff000000 | (b << 16) | (g << 8) | r) : ((r << 24) | (g << 16) | (b << 8) | 0xff);
      }
    }
  }
  function flush() {
    if (!dirty) return;
    const [x0, y0, x1, y1] = dirty;
    dirty = null;
    if (x1 <= x0 || y1 <= y0) return;
    relight(x0, y0, x1, y1);
    sctx.putImageData(simg, 0, 0, x0, y0, x1 - x0, y1 - y0);
  }

  function carveSeg(ax, ay, bx, by, n, t) {
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy);
    if (len < 1e-4) return;
    const ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
    const half = n * t / 2, edge = t * 0.8, reach = half + edge, TAU = Math.PI * 2;
    const minX = Math.max(1, Math.floor(Math.min(ax, bx) - reach)), maxX = Math.min(GW - 1, Math.ceil(Math.max(ax, bx) + reach));
    const minY = Math.max(1, Math.floor(Math.min(ay, by) - reach)), maxY = Math.min(GH - 1, Math.ceil(Math.max(ay, by) + reach));
    for (let y = minY; y < maxY; y++) {
      for (let x = minX; x < maxX; x++) {
        const rx = x + 0.5 - ax, ry = y + 0.5 - ay;
        const along = rx * ux + ry * uy;
        if (along < -0.6 || along > len + 0.6) continue;
        const d = rx * nx + ry * ny, ad = d < 0 ? -d : d;
        if (ad > reach) continue;
        const i = y * GW + x;
        if (ad <= half) hgt[i] = -A * Math.cos(TAU * (d + half - t / 2) / t);
        else {
          const w = 1 - (ad - half) / edge, ww = w * w * (3 - 2 * w);
          const target = A * 0.7 * w;
          hgt[i] = hgt[i] * (1 - ww) + Math.max(hgt[i], target) * ww;
        }
      }
    }
    markDirty(minX, minY, maxX, maxY);
  }
  function carveRings(cx, cy, r, count, t) {
    const TAU = Math.PI * 2, outer = r + count * t, edge = t;
    const minX = Math.max(1, Math.floor(cx - outer - edge)), maxX = Math.min(GW - 1, Math.ceil(cx + outer + edge));
    const minY = Math.max(1, Math.floor(cy - outer - edge)), maxY = Math.min(GH - 1, Math.ceil(cy + outer + edge));
    for (let y = minY; y < maxY; y++) for (let x = minX; x < maxX; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy), i = y * GW + x;
      if (d < r) hgt[i] = A * 0.4;
      else if (d <= outer) hgt[i] = -A * Math.cos(TAU * (d - r - t / 2) / t);
      else if (d < outer + edge) { const w = 1 - (d - outer) / edge, ww = w * w * (3 - 2 * w); hgt[i] = hgt[i] * (1 - ww) + A * 0.5 * w * ww; }
    }
    markDirty(minX, minY, maxX, maxY);
  }
  function smoothAt(cx, cy, R) {
    const minX = Math.max(1, Math.floor(cx - R)), maxX = Math.min(GW - 1, Math.ceil(cx + R));
    const minY = Math.max(1, Math.floor(cy - R)), maxY = Math.min(GH - 1, Math.ceil(cy + R));
    for (let y = minY; y < maxY; y++) for (let x = minX; x < maxX; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d > R) continue;
      const w = 0.35 * (1 - d / R);
      const i = y * GW + x;
      const avg = (hgt[i - 1] + hgt[i + 1] + hgt[i - GW] + hgt[i + GW]) * 0.25;
      hgt[i] = (hgt[i] * 0.5 + avg * 0.5) * (1 - w);
    }
    markDirty(minX, minY, maxX, maxY);
  }

  function initSand(keep) {
    const old = keep && hgt ? { h: hgt, w: GW, hh: GH } : null;
    GW = Math.ceil(W / CELL); GH = Math.ceil(H / CELL);
    hgt = new Float32Array(GW * GH);
    grainV = new Float32Array(GW * GH);
    for (let i = 0; i < grainV.length; i++) grainV[i] = 0.94 + Math.random() * 0.1;
    sand.width = GW; sand.height = GH;
    simg = sctx.createImageData(GW, GH);
    spix = new Uint32Array(simg.data.buffer);
    if (old) {
      for (let y = 0; y < Math.min(GH, old.hh); y++) for (let x = 0; x < Math.min(GW, old.w); x++) hgt[y * GW + x] = old.h[y * old.w + x];
    } else {
      const t = TOOLS.rake.t, TAU = Math.PI * 2;
      for (let y = 0; y < GH; y++) {
        const v = -A * Math.cos(TAU * y / t);
        for (let x = 0; x < GW; x++) hgt[y * GW + x] = v;
      }
    }
    markDirty(0, 0, GW, GH);
    paintGrain();
  }
  function paintGrain() {
    const w = Math.round(W * dpr), h = Math.round(H * dpr);
    grain.width = Math.min(w, 1400); grain.height = Math.min(h, 1000);
    const id = gctx.createImageData(grain.width, grain.height), d = id.data;
    for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = Math.random() < 0.5 ? 40 : 0; }
    gctx.putImageData(id, 0, 0);
  }

  function rng(seed) { let s = seed >>> 0; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }
  function makeObject(type, x, y, seedIn) {
    const seed = seedIn ?? ((Math.random() * 1e9) | 0), R = rng(seed);
    const o = { type, x, y, seed, rot: R() * 6.283 };
    if (type === 'stone') {
      o.r = (W < 560 ? 16 : 20) + R() * (W < 560 ? 18 : 26);
      const n = 11 + (R() * 5 | 0);
      o.pts = Array.from({ length: n }, (_, k) => { const a = k / n * 6.283; const rr = o.r * (0.8 + R() * 0.28) * (1 + 0.18 * Math.cos(2 * a + o.rot)); return [Math.cos(a) * rr, Math.sin(a) * rr * 0.86]; });
      const tones = [[150, 148, 142], [96, 98, 104], [176, 150, 120], [120, 112, 100], [70, 72, 80]];
      o.tone = tones[(R() * tones.length) | 0];
      o.moss = R() < 0.45;
      o.specks = Array.from({ length: 14 }, () => [(R() - 0.5) * o.r * 1.5, (R() - 0.5) * o.r * 1.3, 0.6 + R() * 1.3, R() < 0.5]);
    } else if (type === 'pond') {
      o.r = (W < 560 ? 48 : 64) + R() * 14;
      o.rx = o.r * 1.25; o.ry = o.r * 0.85;
      o.rim = Array.from({ length: 22 }, (_, k) => { const a = k / 22 * 6.283 + R() * 0.1; return [Math.cos(a) * (o.rx + 4), Math.sin(a) * (o.ry + 4), 5 + R() * 5, 120 + R() * 50]; });
      o.koi = Array.from({ length: 3 }, (_, k) => ({ a: R() * 6.283, d: 0.35 + R() * 0.45, sp: (0.25 + R() * 0.3) * (R() < 0.5 ? -1 : 1), ph: R() * 6.283, c: ['#ff7a2f', '#f4f1ea', '#ffb02e', '#e8463a'][(R() * 4) | 0], spot: R() < 0.6 }));
      o.pads = Array.from({ length: 3 }, () => [(R() - 0.5) * o.rx * 1.2, (R() - 0.5) * o.ry * 1.1, 7 + R() * 6, R() * 6.283, R() < 0.4]);
      o.ripples = [];
    } else if (type === 'lantern') {
      o.r = (W < 560 ? 16 : 20) + R() * 4;
    } else if (type === 'moss') {
      o.r = (W < 560 ? 26 : 34) + R() * 16;
      o.blobs = Array.from({ length: 16 }, () => { const a = R() * 6.283, d = Math.sqrt(R()) * 0.75; return [Math.cos(a) * d, Math.sin(a) * d * 0.8, 0.25 + R() * 0.3, R()]; });
    } else if (type === 'maple') {
      o.r = (W < 560 ? 36 : 46) + R() * 12;
      o.hue = R() < 0.25 ? 40 : 8 + R() * 14;
      o.blobs = Array.from({ length: 34 }, () => { const a = R() * 6.283, d = Math.sqrt(R()) * 0.85; return [Math.cos(a) * d, Math.sin(a) * d * 0.85, 0.16 + R() * 0.2, R()]; }).sort((p, q) => p[1] - q[1]);
    } else if (type === 'plant') {
      o.r = (W < 560 ? 20 : 24) + R() * 12;
      o.kind = R() < 0.5 ? 'grass' : 'fern';
      o.blades = Array.from({ length: o.kind === 'grass' ? 22 : 9 }, () => ({ a: R() * 6.283, l: o.r * (0.6 + R() * 0.6), c: R(), ph: R() * 6.283, bend: (R() - 0.5) * 0.9 }));
      o.flowers = R() < 0.4 ? Array.from({ length: 4 + (R() * 4 | 0) }, () => [(R() - 0.5) * o.r, (R() - 0.5) * o.r, R() < 0.5 ? '#fff6f0' : '#f7a8c4']) : [];
    } else {
      o.r = (W < 560 ? 30 : 38) + R() * 10;
      o.pink = R() < 0.4;
      o.pads = Array.from({ length: 3 + (R() * 2 | 0) }, (_, k) => {
        const a = o.rot + (k - 1.5) * 1.2 + (R() - 0.5) * 0.5, dist = o.r * (0.6 + R() * 0.5);
        return { x: Math.cos(a) * dist, y: Math.sin(a) * dist * 0.8 - o.r * 0.15, r: o.r * (0.42 + R() * 0.16), blobs: Array.from({ length: 20 }, () => { const ba = R() * 6.283, bd = Math.sqrt(R()) * 0.8; return [Math.cos(ba) * bd * 1.2, Math.sin(ba) * bd * 0.75, 0.24 + R() * 0.24, R()]; }).sort((p, q) => p[1] - q[1]) };
      });
    }
    return o;
  }

  function drawStone(o) {
    ctx.save(); ctx.translate(o.x, o.y);
    ctx.beginPath(); o.pts.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
    ctx.shadowColor = 'rgba(60,40,15,.45)'; ctx.shadowBlur = o.r * 0.5; ctx.shadowOffsetX = o.r * 0.22; ctx.shadowOffsetY = o.r * 0.3;
    const [r, g, b] = o.tone;
    const gr = ctx.createRadialGradient(-o.r * 0.35, -o.r * 0.4, o.r * 0.1, 0, 0, o.r * 1.15);
    gr.addColorStop(0, `rgb(${Math.min(255, r + 60)},${Math.min(255, g + 60)},${Math.min(255, b + 58)})`);
    gr.addColorStop(0.55, `rgb(${r},${g},${b})`);
    gr.addColorStop(1, `rgb(${r * 0.55 | 0},${g * 0.55 | 0},${b * 0.55 | 0})`);
    ctx.fillStyle = gr; ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.save(); ctx.clip();
    for (const [x, y, s, light] of o.specks) { ctx.fillStyle = light ? 'rgba(255,255,255,.22)' : 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.arc(x, y, s, 0, 6.283); ctx.fill(); }
    if (o.moss) {
      const mg = ctx.createRadialGradient(-o.r * 0.25, -o.r * 0.5, 0, -o.r * 0.25, -o.r * 0.5, o.r * 0.75);
      mg.addColorStop(0, 'rgba(110,150,60,.95)'); mg.addColorStop(0.6, 'rgba(90,130,50,.7)'); mg.addColorStop(1, 'rgba(90,130,50,0)');
      ctx.fillStyle = mg; ctx.fillRect(-o.r * 1.2, -o.r * 1.2, o.r * 2.4, o.r * 2.4);
    }
    ctx.restore();
    ctx.restore();
  }
  function drawPlant(o) {
    ctx.save(); ctx.translate(o.x, o.y);
    ctx.fillStyle = 'rgba(60,40,15,.16)';
    ctx.beginPath(); ctx.ellipse(o.r * 0.2, o.r * 0.25, o.r * 0.75, o.r * 0.6, 0, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#6b5636'; ctx.beginPath(); ctx.ellipse(0, 0, o.r * 0.22, o.r * 0.18, 0, 0, 6.283); ctx.fill();
    ctx.lineCap = 'round';
    for (const b of o.blades) {
      const sway = Math.sin(time * 1.3 + b.ph) * 0.06;
      const a = b.a + sway, ex = Math.cos(a) * b.l, ey = Math.sin(a) * b.l * 0.85;
      const cx = Math.cos(a + b.bend) * b.l * 0.55, cy = Math.sin(a + b.bend) * b.l * 0.5;
      const L = 32 + b.c * 22;
      if (o.kind === 'fern') {
        ctx.strokeStyle = `hsl(${100 + b.c * 25},45%,${L - 6}%)`; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(cx, cy, ex, ey); ctx.stroke();
        ctx.fillStyle = `hsl(${100 + b.c * 25},50%,${L}%)`;
        for (let k = 1; k < 8; k++) {
          const t = k / 8, px = 2 * (1 - t) * t * cx + t * t * ex, py = 2 * (1 - t) * t * cy + t * t * ey;
          const s = (1 - t) * 5 + 1.2, pa = a + Math.PI / 2;
          ctx.beginPath(); ctx.ellipse(px + Math.cos(pa) * s, py + Math.sin(pa) * s, s, s * 0.45, pa, 0, 6.283); ctx.ellipse(px - Math.cos(pa) * s, py - Math.sin(pa) * s, s, s * 0.45, pa, 0, 6.283); ctx.fill();
        }
      } else {
        ctx.strokeStyle = `hsl(${80 + b.c * 40},${45 + b.c * 15}%,${L}%)`; ctx.lineWidth = 2.2 - b.c;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(cx, cy, ex, ey); ctx.stroke();
      }
    }
    for (const [x, y, c] of o.flowers) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, 2.6, 0, 6.283); ctx.fill(); ctx.fillStyle = '#f2c94c'; ctx.beginPath(); ctx.arc(x, y, 1, 0, 6.283); ctx.fill(); }
    ctx.restore();
  }
  function drawBonsai(o) {
    ctx.save(); ctx.translate(o.x, o.y);
    const pw = o.r * 0.8, ph = o.r * 0.52;
    ctx.shadowColor = 'rgba(60,40,15,.45)'; ctx.shadowBlur = 14; ctx.shadowOffsetX = 8; ctx.shadowOffsetY = 10;
    ctx.fillStyle = '#2f5e7a';
    roundRect(-pw, -ph, pw * 2, ph * 2, ph * 0.5); ctx.fill();
    ctx.shadowColor = 'transparent';
    const pg = ctx.createLinearGradient(-pw, -ph, pw, ph); pg.addColorStop(0, 'rgba(255,255,255,.28)'); pg.addColorStop(0.5, 'rgba(255,255,255,0)'); pg.addColorStop(1, 'rgba(0,0,0,.25)');
    ctx.fillStyle = pg; roundRect(-pw, -ph, pw * 2, ph * 2, ph * 0.5); ctx.fill();
    ctx.fillStyle = '#4a3420'; roundRect(-pw * 0.86, -ph * 0.78, pw * 1.72, ph * 1.56, ph * 0.4); ctx.fill();
    ctx.fillStyle = 'rgba(110,150,60,.8)'; ctx.beginPath(); ctx.ellipse(-pw * 0.4, ph * 0.3, pw * 0.3, ph * 0.25, 0.3, 0, 6.283); ctx.fill();
    const sway = Math.sin(time * 0.8 + o.seed) * 1.2;
    ctx.lineCap = 'round'; ctx.strokeStyle = '#5a3d26';
    for (const p of o.pads) { ctx.lineWidth = o.r * 0.12; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(p.x * 0.3 - o.r * 0.2, p.y * 0.7 + o.r * 0.1, p.x + sway, p.y); ctx.stroke(); }
    ctx.lineWidth = o.r * 0.22; ctx.beginPath(); ctx.arc(0, 0, o.r * 0.12, 0, 6.283); ctx.stroke();
    for (const p of o.pads) {
      const px = p.x + sway, py = p.y;
      ctx.fillStyle = 'rgba(40,30,10,.25)'; ctx.beginPath(); ctx.ellipse(px + 5, py + 7, p.r * 1.1, p.r * 0.75, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = o.pink ? '#b0577a' : '#24461f'; ctx.beginPath(); ctx.ellipse(px, py + p.r * 0.08, p.r * 1.05, p.r * 0.7, 0, 0, 6.283); ctx.fill();
      for (const [bx, by, br, c] of p.blobs) {
        const x = px + bx * p.r, y = py + by * p.r, rr = br * p.r;
        const g = ctx.createRadialGradient(x - rr * 0.4, y - rr * 0.5, rr * 0.1, x, y, rr);
        if (o.pink) { g.addColorStop(0, `hsl(${335 + c * 15},85%,90%)`); g.addColorStop(1, `hsl(${335 + c * 10},60%,${62 + c * 8}%)`); }
        else { g.addColorStop(0, `hsl(${95 + c * 20},50%,${50 + c * 10}%)`); g.addColorStop(1, `hsl(${110 + c * 15},45%,${22 + c * 6}%)`); }
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rr, 0, 6.283); ctx.fill();
      }
    }
    ctx.restore();
  }
  function drawPond(o) {
    ctx.save(); ctx.translate(o.x, o.y);
    for (const [x, y, s, tone] of o.rim) {
      ctx.fillStyle = 'rgba(60,40,15,.25)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 3, s, s * 0.8, 0, 0, 6.283); ctx.fill();
      const g = ctx.createRadialGradient(x - s * 0.3, y - s * 0.4, 1, x, y, s);
      g.addColorStop(0, `rgb(${tone + 50},${tone + 48},${tone + 42})`); g.addColorStop(1, `rgb(${tone * 0.6 | 0},${tone * 0.6 | 0},${tone * 0.58 | 0})`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, s, s * 0.8, 0, 0, 6.283); ctx.fill();
    }
    ctx.beginPath(); ctx.ellipse(0, 0, o.rx, o.ry, 0, 0, 6.283);
    const w = ctx.createRadialGradient(-o.rx * 0.3, -o.ry * 0.3, 4, 0, 0, o.rx);
    w.addColorStop(0, '#4f9db0'); w.addColorStop(0.7, '#2c6d82'); w.addColorStop(1, '#1d4a5a');
    ctx.fillStyle = w; ctx.fill();
    ctx.save(); ctx.clip();
    for (const k of o.koi) {
      k.a += k.sp * 0.016 * (1 + 0.3 * Math.sin(time + k.ph));
      const kx = Math.cos(k.a) * o.rx * k.d, ky = Math.sin(k.a) * o.ry * k.d, dir = k.a + (k.sp > 0 ? Math.PI / 2 : -Math.PI / 2);
      ctx.save(); ctx.translate(kx, ky); ctx.rotate(dir);
      const wag = Math.sin(time * 6 + k.ph) * 0.35, L = o.r * 0.22;
      ctx.fillStyle = 'rgba(0,20,30,.25)'; ctx.beginPath(); ctx.ellipse(3, 4, L, L * 0.38, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = k.c;
      ctx.beginPath(); ctx.ellipse(0, 0, L, L * 0.36, 0, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-L * 0.8, 0); ctx.lineTo(-L * 1.5, L * 0.45 + wag * L); ctx.lineTo(-L * 1.4, wag * L * 0.3); ctx.lineTo(-L * 1.5, -L * 0.45 + wag * L); ctx.closePath(); ctx.fill();
      if (k.spot) { ctx.fillStyle = k.c === '#f4f1ea' ? '#e8463a' : '#f4f1ea'; ctx.beginPath(); ctx.ellipse(L * 0.2, 0, L * 0.3, L * 0.2, 0, 0, 6.283); ctx.fill(); }
      ctx.restore();
    }
    for (const [x, y, s, a, flower] of o.pads) {
      ctx.fillStyle = '#4f8a3a'; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, s, a + 0.35, a + 6.0); ctx.closePath(); ctx.fill();
      if (flower) { ctx.fillStyle = '#ffd1e3'; ctx.beginPath(); ctx.arc(x, y, s * 0.35, 0, 6.283); ctx.fill(); ctx.fillStyle = '#ffe680'; ctx.beginPath(); ctx.arc(x, y, s * 0.12, 0, 6.283); ctx.fill(); }
    }
    o.ripples = o.ripples.filter((r) => (r.t += 0.016) < 2);
    if (Math.random() < 0.01) o.ripples.push({ x: (Math.random() - 0.5) * o.rx, y: (Math.random() - 0.5) * o.ry, t: 0 });
    for (const r of o.ripples) { ctx.strokeStyle = `rgba(220,245,255,${0.5 * (1 - r.t / 2)})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(r.x, r.y, 4 + r.t * 22, (4 + r.t * 22) * 0.7, 0, 0, 6.283); ctx.stroke(); }
    const sh = ctx.createLinearGradient(-o.rx, -o.ry, o.rx, o.ry);
    sh.addColorStop(0, 'rgba(255,255,255,.18)'); sh.addColorStop(0.4, 'rgba(255,255,255,0)');
    ctx.fillStyle = sh; ctx.fillRect(-o.rx, -o.ry, o.rx * 2, o.ry * 2);
    ctx.restore();
    ctx.restore();
  }
  function drawLantern(o) {
    ctx.save(); ctx.translate(o.x, o.y);
    const r = o.r;
    ctx.fillStyle = 'rgba(60,40,15,.35)'; ctx.beginPath(); ctx.ellipse(r * 0.35, r * 0.45, r * 1.05, r * 0.85, 0, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#8d8a80'; ctx.fillRect(-r * 0.8, -r * 0.8, r * 1.6, r * 1.6);
    const glowA = night ? 0.9 : 0.35;
    const lg = ctx.createRadialGradient(0, 0, 1, 0, 0, r * (night ? 3.2 : 1));
    lg.addColorStop(0, `rgba(255,214,140,${glowA})`); lg.addColorStop(1, 'rgba(255,170,80,0)');
    ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(0, 0, r * (night ? 3.2 : 1), 0, 6.283); ctx.fill();
    ctx.beginPath();
    for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283 + 0.39; ctx.lineTo(Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.95); }
    ctx.closePath();
    const rg = ctx.createLinearGradient(-r, -r, r, r); rg.addColorStop(0, '#c9c5b8'); rg.addColorStop(1, '#6e6a60');
    ctx.fillStyle = rg; ctx.fill();
    ctx.strokeStyle = 'rgba(40,35,30,.4)'; ctx.lineWidth = 1;
    for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283 + 0.39; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.95); ctx.stroke(); }
    ctx.fillStyle = '#a8a497'; ctx.beginPath(); ctx.arc(0, 0, r * 0.22, 0, 6.283); ctx.fill();
    ctx.fillStyle = 'rgba(110,150,60,.6)'; ctx.beginPath(); ctx.ellipse(-r * 0.4, r * 0.3, r * 0.3, r * 0.18, 0.4, 0, 6.283); ctx.fill();
    ctx.restore();
  }
  function drawMoss(o) {
    ctx.save(); ctx.translate(o.x, o.y);
    for (const [bx, by, br, c] of o.blobs) {
      const x = bx * o.r, y = by * o.r, rr = br * o.r;
      const g = ctx.createRadialGradient(x - rr * 0.3, y - rr * 0.3, 1, x, y, rr);
      g.addColorStop(0, `hsl(${92 + c * 18},45%,${44 + c * 10}%)`); g.addColorStop(1, `hsla(${100 + c * 15},45%,${28 + c * 6}%,.9)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rr, 0, 6.283); ctx.fill();
    }
    ctx.restore();
  }
  function drawMaple(o) {
    ctx.save(); ctx.translate(o.x, o.y);
    ctx.fillStyle = 'rgba(60,30,10,.28)'; ctx.beginPath(); ctx.ellipse(o.r * 0.3, o.r * 0.4, o.r * 1.05, o.r * 0.85, 0, 0, 6.283); ctx.fill();
    ctx.strokeStyle = '#4a2f1d'; ctx.lineCap = 'round';
    for (let k = 0; k < 5; k++) { const a = k * 1.3 + o.rot; ctx.lineWidth = o.r * 0.08; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * o.r * 0.7, Math.sin(a) * o.r * 0.6); ctx.stroke(); }
    const sway = Math.sin(time * 0.7 + o.seed) * 1.5;
    for (const [bx, by, br, c] of o.blobs) {
      const x = bx * o.r + sway, y = by * o.r, rr = br * o.r;
      const g = ctx.createRadialGradient(x - rr * 0.4, y - rr * 0.5, 1, x, y, rr);
      const h = o.hue + c * 18 + (season === 'autumn' ? 0 : 0);
      g.addColorStop(0, `hsl(${h},90%,${62 + c * 12}%)`); g.addColorStop(1, `hsl(${h - 4},75%,${34 + c * 8}%)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rr, 0, 6.283); ctx.fill();
    }
    ctx.restore();
  }
  function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  function drawFrame() {
    const b = BORDER;
    const wood = ctx.createLinearGradient(0, 0, W, H);
    wood.addColorStop(0, '#7a5235'); wood.addColorStop(0.5, '#5e3e27'); wood.addColorStop(1, '#4a301d');
    ctx.fillStyle = wood;
    ctx.fillRect(0, 0, W, b); ctx.fillRect(0, H - b, W, b); ctx.fillRect(0, 0, b, H); ctx.fillRect(W - b, 0, b, H);
    ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 2; ctx.strokeRect(b - 1, b - 1, W - 2 * b + 2, H - 2 * b + 2);
    ctx.strokeStyle = 'rgba(255,220,180,.12)'; ctx.lineWidth = 1;
    for (let k = 3; k < b; k += 4) { ctx.beginPath(); ctx.moveTo(0, k); ctx.lineTo(W, k + 1); ctx.moveTo(0, H - k); ctx.lineTo(W, H - k - 1); ctx.stroke(); }
    const inner = ctx.createLinearGradient(0, b, 0, b + 14);
    inner.addColorStop(0, 'rgba(50,30,10,.28)'); inner.addColorStop(1, 'rgba(50,30,10,0)');
    ctx.fillStyle = inner; ctx.fillRect(b, b, W - 2 * b, 14);
    const innerL = ctx.createLinearGradient(b, 0, b + 14, 0);
    innerL.addColorStop(0, 'rgba(50,30,10,.22)'); innerL.addColorStop(1, 'rgba(50,30,10,0)');
    ctx.fillStyle = innerL; ctx.fillRect(b, b, 14, H - 2 * b);
  }

  function drawRakeCursor() {
    if (!pointer.on) return;
    const x = rake ? rake.x * CELL : pointer.x, y = rake ? rake.y * CELL : pointer.y;
    const dark = Curio.isDark();
    ctx.save();
    if (TOOLS[tool]) {
      const T = TOOLS[tool], half = T.n * T.t * CELL / 2;
      const ang = rake ? rake.ang : -Math.PI / 2;
      ctx.translate(x, y); ctx.rotate(ang);
      ctx.strokeStyle = 'rgba(70,45,20,.85)'; ctx.lineCap = 'round';
      ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-60, 0); ctx.stroke();
      ctx.fillStyle = '#9c6b3e'; ctx.fillRect(-5, -half - 2, 7, half * 2 + 4);
      ctx.fillStyle = '#6d4626';
      for (let k = 0; k < T.n; k++) { const ty = -half + T.t * CELL * (k + 0.5); ctx.beginPath(); ctx.arc(3, ty, 1.8, 0, 6.283); ctx.fill(); }
    } else if (tool === 'smooth') {
      ctx.strokeStyle = dark ? 'rgba(220,230,255,.7)' : 'rgba(70,45,20,.6)'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.arc(x, y, 30, 0, 6.283); ctx.stroke();
    } else {
      ctx.strokeStyle = dark ? 'rgba(220,230,255,.7)' : 'rgba(70,45,20,.6)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, 14, 0, 6.283); ctx.moveTo(x - 6, y); ctx.lineTo(x + 6, y); ctx.moveTo(x, y - 6); ctx.lineTo(x, y + 6); ctx.stroke();
    }
    ctx.restore();
  }

  function render() {
    flush();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(sand, 0, 0, GW * CELL, GH * CELL);
    ctx.globalAlpha = 0.5; ctx.globalCompositeOperation = 'overlay';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (let y = 0; y < cv.height; y += grain.height) for (let x = 0; x < cv.width; x += grain.width) ctx.drawImage(grain, x, y);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (const p of petals) if (p.landed) drawPetal(p);
    const Z = { moss: 0, pond: 0, stone: 1, plant: 1, lantern: 2, bonsai: 3, maple: 3 };
    const sorted = objects.slice().sort((a, b) => (Z[a.type] - Z[b.type]) || a.y - b.y);
    for (const o of sorted) DRAW[o.type](o);
    for (const p of petals) if (!p.landed) drawPetal(p);
    drawFrame();
    drawSky();
    if (Curio.isDark() && timeOfDay === 'day') {
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = '#7d88b8'; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
      const v = ctx.createRadialGradient(W * 0.7, H * 0.2, 0, W * 0.7, H * 0.2, Math.max(W, H));
      v.addColorStop(0, 'rgba(200,215,255,.10)'); v.addColorStop(1, 'rgba(0,0,20,.35)');
      ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    }
    drawRakeCursor();
  }
  function drawPetal(p) {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a);
    ctx.globalAlpha = Math.min(1, p.life);
    const k = p.kind || 'petals';
    if (k === 'leaves') { ctx.fillStyle = p.c; ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(1, 2); ctx.lineTo(0, 5); ctx.lineTo(-1, 2); ctx.lineTo(-5, 0); ctx.lineTo(-1, -1.5); ctx.lineTo(0, -5); ctx.lineTo(1, -1.5); ctx.closePath(); ctx.fill(); }
    else if (k === 'snow') { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, p.s || 2, 0, 6.283); ctx.fill(); }
    else if (k === 'rain') { if (p.landed) { ctx.strokeStyle = `rgba(255,255,255,${0.5 * p.life})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(0, 0, (1.2 - p.life) * 10, (1.2 - p.life) * 7, 0, 0, 6.283); ctx.stroke(); } else { ctx.rotate(-p.a); ctx.strokeStyle = 'rgba(220,235,255,.55)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-3, -12); ctx.stroke(); } }
    else { ctx.fillStyle = '#f7b6cf'; ctx.beginPath(); ctx.ellipse(0, 0, 3.6, 2.2, 0, 0, 6.283); ctx.fill(); }
    ctx.restore();
  }
  const DRAW = { stone: (o) => drawStone(o), plant: (o) => drawPlant(o), bonsai: (o) => drawBonsai(o), pond: (o) => drawPond(o), lantern: (o) => drawLantern(o), moss: (o) => drawMoss(o), maple: (o) => drawMaple(o) };
  const TIMES = ['day', 'dusk', 'night'];
  let timeOfDay = Curio.store.get('zen:time', 'day'), night = false;
  if (!TIMES.includes(timeOfDay)) timeOfDay = 'day';
  const WEATHER = [['none', '☁️', 'Calm'], ['petals', '🌸', 'Petals'], ['leaves', '🍂', 'Leaves'], ['snow', '❄️', 'Snow'], ['rain', '🌧️', 'Rain']];
  let weather = Curio.store.get('zen:weather', 'petals'), season = 'spring';
  if (!WEATHER.some((w) => w[0] === weather)) weather = 'petals';
  const flies = Array.from({ length: 18 }, () => ({ x: Math.random(), y: Math.random(), ph: Math.random() * 6.283 }));
  function drawSky() {
    night = timeOfDay === 'night' || (timeOfDay === 'day' && Curio.isDark());
    if (timeOfDay === 'dusk') {
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = '#f2b38a'; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
      const v = ctx.createLinearGradient(0, 0, W, H);
      v.addColorStop(0, 'rgba(255,170,90,.18)'); v.addColorStop(1, 'rgba(90,40,80,.28)');
      ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    } else if (timeOfDay === 'night') {
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = '#4a5486'; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      for (const o of objects) if (o.type === 'lantern') {
        const g = ctx.createRadialGradient(o.x, o.y, 2, o.x, o.y, o.r * 6);
        g.addColorStop(0, 'rgba(255,190,110,.55)'); g.addColorStop(1, 'rgba(255,150,60,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(o.x, o.y, o.r * 6, 0, 6.283); ctx.fill();
      }
      for (const f of flies) {
        const x = (f.x * W + Math.sin(time * 0.3 + f.ph) * 40), y = (f.y * H + Math.cos(time * 0.23 + f.ph) * 30), a = 0.5 + 0.5 * Math.sin(time * 2 + f.ph * 3);
        const g = ctx.createRadialGradient(x, y, 0, x, y, 8);
        g.addColorStop(0, `rgba(230,255,140,${0.8 * a})`); g.addColorStop(1, 'rgba(230,255,140,0)');
        ctx.fillStyle = g; ctx.fillRect(x - 8, y - 8, 16, 16);
      }
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  const pointer = { x: 0, y: 0, on: false, down: false, id: null, moved: 0 };
  let held = null;
  const posOf = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  function hitObject(x, y) {
    for (let k = objects.length - 1; k >= 0; k--) { const o = objects[k]; if (Math.hypot(x - o.x, y - o.y) < o.r * 1.05) return o; }
    return null;
  }
  const PLACE = ['stone', 'plant', 'bonsai', 'maple', 'moss', 'lantern', 'pond'];
  function down(x, y) {
    Object.assign(pointer, { x, y, on: true, down: true, moved: 0 });
    intro.classList.add('is-faded');
    audio.start();
    const hit = hitObject(x, y);
    if (hit) {
      if (hit.type === 'pond' && Math.hypot((x - hit.x) / hit.rx, (y - hit.y) / hit.ry) < 0.75) { hit.ripples.push({ x: x - hit.x, y: y - hit.y, t: 0 }); audio.tok(700, 0.15); }
      held = { o: hit, dx: hit.x - x, dy: hit.y - y, x0: hit.x, y0: hit.y }; objects.splice(objects.indexOf(hit), 1); objects.push(hit); return;
    }
    if (PLACE.includes(tool)) { place(tool, x, y); return; }
    rake = { x: x / CELL, y: y / CELL, ang: rake ? rake.ang : -Math.PI / 2, tx: x / CELL, ty: y / CELL };
    if (tool === 'smooth') smoothAt(x / CELL, y / CELL, 15);
  }
  function moveTo(x, y) {
    pointer.moved += Math.hypot(x - pointer.x, y - pointer.y);
    pointer.x = x; pointer.y = y; pointer.on = true;
    if (held) { held.o.x = Math.max(0, Math.min(W, x + held.dx)); held.o.y = Math.max(0, Math.min(H, y + held.dy)); }
    else if (rake && pointer.down) { rake.tx = x / CELL; rake.ty = y / CELL; }
    else if (!pointer.down) rake = rake && TOOLS[tool] ? { ...rake, x: x / CELL, y: y / CELL, tx: x / CELL, ty: y / CELL } : null;
  }
  Curio.drag(cv, {
    start: (p) => { if (!pointer.down) down(p.x, p.y); },
    move: (p) => moveTo(p.x, p.y),
    end: (p) => up(p ? p.pointerType : 'mouse')
  });
  cv.addEventListener('pointermove', (e) => { if (pointer.down) return; const [x, y] = posOf(e); moveTo(x, y); });
  cv.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && !pointer.down) pointer.on = false; });
  function up(type) {
    if (!pointer.down) return;
    pointer.down = false;
    if (type && type !== 'mouse') pointer.on = false;
    if (held) {
      const o = held.o;
      if (o.x < BORDER + 6 || o.y < BORDER + 6 || o.x > W - BORDER - 6 || o.y > H - BORDER - 6) {
        objects.splice(objects.indexOf(o), 1);
        audio.tok(320, 0.12); Curio.toast('Returned to the earth');
      } else if (Math.hypot(o.x - held.x0, o.y - held.y0) > 4) {
        settle(o);
      }
      held = null;
      saveGarden();
    }
    if (rake && !TOOLS[tool]) rake = null;
  }

  let tipShown = false;
  function place(type, x, y) {
    if (x < BORDER + 10 || y < BORDER + 10 || x > W - BORDER - 10 || y > H - BORDER - 10) return;
    if (objects.length >= 40) { Curio.toast('A garden this full is no longer calm. Drag something off the edge.'); return; }
    const o = makeObject(type, x, y);
    objects.push(o);
    settle(o);
    placedTypes.add(type); Curio.store.set('zen:placed', [...placedTypes]);
    if (placedTypes.size >= PLACE.length) award('all', '🎋 Gardener: placed every kind of thing');
    if (type === 'pond') award('koi', '🐟 Koi keeper: dug a pond');
    saveGarden();
    if (!tipShown && objects.length >= 2) { tipShown = true; setTimeout(() => Curio.toast('Drag things around, or off the edge to remove them', 2600), 600); }
  }
  function settle(o, quiet) {
    const tok = quiet ? () => {} : audio.tok;
    if (o.type === 'stone') { carveRings(o.x / CELL, o.y / CELL, o.r / CELL + 2.5, 3, TOOLS.rake.t); tok(150, 0.25); }
    else if (o.type === 'bonsai') { carveRings(o.x / CELL, o.y / CELL, o.r * 1.25 / CELL, 2, TOOLS.rake.t); tok(200, 0.2); }
    else if (o.type === 'pond') { carveRings(o.x / CELL, o.y / CELL, (o.rx + 10) / CELL, 3, TOOLS.rake.t); tok(240, 0.3); }
    else if (o.type === 'lantern' || o.type === 'maple') { carveRings(o.x / CELL, o.y / CELL, o.r * 1.1 / CELL + 2, 2, TOOLS.rake.t); tok(o.type === 'lantern' ? 180 : 260, 0.2); }
    else { smoothAt(o.x / CELL, o.y / CELL, o.r / CELL + 3); tok(420, 0.12); }
  }

  function stepRake() {
    if (!rake || !pointer.down || held) return;
    const dx = rake.tx - rake.x, dy = rake.ty - rake.y, d = Math.hypot(dx, dy);
    if (d < 0.05) { audio.scrape(0); return; }
    const k = Math.min(1, 0.32);
    const nx = rake.x + dx * k, ny = rake.y + dy * k;
    const segLen = Math.hypot(nx - rake.x, ny - rake.y);
    if (tool === 'smooth') {
      const steps = Math.max(1, Math.ceil(segLen / 2));
      for (let s = 1; s <= steps; s++) smoothAt(rake.x + (nx - rake.x) * s / steps, rake.y + (ny - rake.y) * s / steps, 15);
      rake.x = nx; rake.y = ny; audio.scrape(segLen * 0.5);
      return;
    }
    const T = TOOLS[tool];
    const want = Math.atan2(ny - rake.y, nx - rake.x);
    let da = want - rake.ang; da = Math.atan2(Math.sin(da), Math.cos(da));
    rake.ang += da * Math.min(1, 0.25 + segLen * 0.05);
    const steps = Math.max(1, Math.ceil(segLen / 1.2));
    let px = rake.x, py = rake.y;
    for (let s = 1; s <= steps; s++) {
      const qx = rake.x + (nx - rake.x) * s / steps, qy = rake.y + (ny - rake.y) * s / steps;
      carveSeg(px, py, qx, qy, T.n, T.t);
      px = qx; py = qy;
    }
    rake.x = nx; rake.y = ny;
    audio.scrape(segLen);
  }

  const audio = (() => {
    let ac = null, master = null, scrapeGain = null, started = false, nextChime = 0, enabled = Curio.store.get('zen:sound', true), scrapeLevel = 0;
    const NOTES = [293.66, 349.23, 392.0, 440.0, 523.25, 587.33, 698.46];
    function start() {
      if (started) return;
      ac = Curio.audioContext(); if (!ac) return;
      started = true;
      master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination);
      const buf = ac.createBuffer(1, ac.sampleRate * 3, ac.sampleRate), d = buf.getChannelData(0);
      let b0 = 0;
      for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; b0 = 0.985 * b0 + 0.15 * w; d[i] = b0 * 0.6; }
      const wind = ac.createBufferSource(); wind.buffer = buf; wind.loop = true;
      const wf = ac.createBiquadFilter(); wf.type = 'lowpass'; wf.frequency.value = 420;
      const wg = ac.createGain(); wg.gain.value = 0.16;
      const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 0.1;
      lfo.connect(lg).connect(wg.gain); lfo.start();
      wind.connect(wf).connect(wg).connect(master); wind.start();
      const nb = ac.createBuffer(1, ac.sampleRate, ac.sampleRate), nd = nb.getChannelData(0);
      for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
      const sc = ac.createBufferSource(); sc.buffer = nb; sc.loop = true;
      const sf = ac.createBiquadFilter(); sf.type = 'bandpass'; sf.frequency.value = 2600; sf.Q.value = 0.7;
      scrapeGain = ac.createGain(); scrapeGain.gain.value = 0;
      sc.connect(sf).connect(scrapeGain).connect(master); sc.start();
      nextChime = ac.currentTime + 1.5;
    }
    function chime() {
      const t = ac.currentTime, f = NOTES[(Math.random() * NOTES.length) | 0] * (Math.random() < 0.3 ? 2 : 1);
      [[1, 0.05], [2.76, 0.012], [5.4, 0.005]].forEach(([m, v]) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = 'sine'; o.frequency.value = f * m;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 4.5 / m + 0.6);
        o.connect(g).connect(master); o.start(t); o.stop(t + 5.2);
      });
    }
    function tick(visible) {
      if (!started) return;
      const on = enabled && !Curio.muted && visible;
      master.gain.setTargetAtTime(on ? 1 : 0, ac.currentTime, 0.4);
      scrapeLevel *= 0.85;
      scrapeGain.gain.setTargetAtTime(Math.min(0.09, scrapeLevel * 0.02), ac.currentTime, 0.05);
      if (on && ac.currentTime > nextChime) { chime(); if (Math.random() < 0.35) setTimeout(() => started && chime(), 350 + Math.random() * 500); nextChime = ac.currentTime + 4 + Math.random() * 7; }
    }
    return {
      start, tick,
      scrape(v) { scrapeLevel = Math.max(scrapeLevel, v); },
      tok(freq, dur) { Curio.beep(freq, dur, 'sine', 0.14); },
      bell() {
        if (!started || Curio.muted) return;
        const t = ac.currentTime;
        [[1, 0.12], [2.4, 0.05], [3.9, 0.03], [5.6, 0.015]].forEach(([m, v]) => {
          const o = ac.createOscillator(), g = ac.createGain();
          o.type = 'sine'; o.frequency.value = 220 * m;
          g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 7 / m);
          o.connect(g).connect(ac.destination); o.start(t); o.stop(t + 7.2);
        });
      },
      get enabled() { return enabled; },
      set enabled(v) { enabled = v; Curio.store.set('zen:sound', v); }
    };
  })();

  document.querySelectorAll('[data-tool]').forEach((b) => b.addEventListener('click', () => setTool(b.dataset.tool)));
  function setTool(t) {
    tool = t;
    document.querySelectorAll('[data-tool]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tool === t)));
    if (!TOOLS[t] && t !== 'smooth') rake = null;
  }
  $('bClear').addEventListener('click', async () => {
    const v = await Curio.modal({ emoji: '🧺', title: 'Start a new garden?', body: 'The stones and plants go back in the basket and the sand is smoothed flat.', buttons: [{ label: 'Clear it', value: 'yes' }, { label: 'Keep it', value: 'no' }] });
    if (v !== 'yes') return;
    objects = []; petals = []; flatAnim = 40; Curio.store.set('zen:garden', null);
  });
  const sb = $('bSound');
  const paintSound = () => { sb.setAttribute('aria-pressed', String(audio.enabled)); sb.textContent = audio.enabled ? '🎐 Ambience' : '🎐 Silence'; };
  sb.addEventListener('click', () => { audio.enabled = !audio.enabled; audio.start(); paintSound(); if (audio.enabled && Curio.muted) Curio.toast('Sound is muted in the top bar 🔇'); });
  paintSound();

  addEventListener('keydown', (e) => {
    if (e.target.closest?.('input, button')) return;
    const map = { 1: 'stick', 2: 'rake', 3: 'wide', 4: 'smooth', 5: 'stone', 6: 'plant', 7: 'bonsai' };
    if (map[e.key]) setTool(map[e.key]);
  });

  function stepPetals(dt) {
    for (const o of objects) if (o.type === 'bonsai' && o.pink && Math.random() < dt * 0.5) {
      const p = o.pads[(Math.random() * o.pads.length) | 0];
      petals.push({ x: o.x + p.x, y: o.y + p.y, vx: 8 + Math.random() * 12, vy: 4 + Math.random() * 6, a: Math.random() * 6, va: (Math.random() - 0.5) * 3, z: 1 + Math.random() * 1.5, life: 10, landed: false, kind: 'petals' });
    }
    for (const p of petals) {
      if (!p.landed) {
        p.x += (p.vx + Math.sin(time * 1.5 + p.a) * 10) * dt; p.y += p.vy * dt; p.a += p.va * dt; p.z -= dt * 0.6;
        if (p.z <= 0) p.landed = true;
      } else p.life -= dt * 0.6;
    }
    if (petals.length > 260) petals.splice(0, petals.length - 260);
    petals = petals.filter((p) => p.life > 0 && p.x < W + 10);
  }

  let badges = Curio.store.get('zen:badges', []);
  if (!Array.isArray(badges)) badges = [];
  const placedTypes = new Set(Curio.store.get('zen:placed', []));
  function award(id, text) {
    if (badges.includes(id)) return;
    badges.push(id); Curio.store.set('zen:badges', badges);
    setTimeout(() => Curio.toast(`Badge: ${text}`, 2600), 500);
  }

  let pattern = 'lines';
  const PATTERNS = { flat: 'Smooth sand', lines: 'Straight lines', diagonal: 'Diagonal', waves: 'Gentle waves', circles: 'Ripples', spiral: 'Spiral', seigaiha: 'Seigaiha scales', checks: 'Ichimatsu checks' };
  function applyPattern(name, quiet) {
    pattern = name;
    const t = TOOLS.rake.t, TAU = Math.PI * 2, cx = GW / 2, cy = GH / 2, S = 34;
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
      let ph;
      if (name === 'diagonal') ph = (x + y) * 0.7071;
      else if (name === 'waves') ph = y + Math.sin(x * 0.035) * 6;
      else if (name === 'circles') ph = Math.hypot(x - cx, y - cy);
      else if (name === 'spiral') { const d = Math.hypot(x - cx, y - cy), a = Math.atan2(y - cy, x - cx); ph = d + (a / TAU) * t; }
      else if (name === 'flat') ph = 0;
      else if (name === 'checks') { const cell = 40, odd = ((Math.floor(x / cell) + Math.floor(y / cell)) & 1); ph = odd ? x : y; }
      else if (name === 'seigaiha') {
        ph = 0;
        const row0 = Math.floor(y / (S / 2)) + 2;
        for (let r = row0; r >= row0 - 4; r--) {
          const ccy = r * S / 2, off = (r & 1) ? S / 2 : 0;
          const ccx = Math.round((x - off) / S) * S + off;
          const d = Math.hypot(x - ccx, y - ccy);
          if (d < S * 0.78 && y <= ccy + 0.5) { ph = d; break; }
        }
      } else ph = y;
      hgt[y * GW + x] = -A * Math.cos(TAU * ph / t);
    }
    markDirty(0, 0, GW, GH);
    for (const o of objects) settle(o, true);
    if (!quiet) { audio.start(); audio.scrape(30); saveGarden(); }
  }
  $('bPattern').addEventListener('click', async () => {
    const v = await Curio.modal({ emoji: '🌀', title: 'Rake a pattern', body: 'The monk rakes the whole garden in one calm sweep. Your stones and plants keep their ripples.', buttons: Object.entries(PATTERNS).map(([k, l]) => ({ label: l, value: k })).concat([{ label: 'Cancel', value: '' }]) });
    if (v) { applyPattern(v); Curio.toast(`${PATTERNS[v]} 🙏`); award('pattern', '🌀 Patient monk: raked a pattern'); }
  });

  const GARDENS = {
    ryoanji: { name: 'Ryōan-ji', note: 'Fifteen stones in five groups, set in raked gravel. From any seat on the veranda, at least one stone is always hidden.', pattern: 'lines', items: [[0.14, 0.4, 'stone', 5], [0.36, 0.62, 'stone', 2], [0.54, 0.36, 'stone', 3], [0.7, 0.6, 'stone', 2], [0.86, 0.42, 'stone', 3]] },
    koi: { name: 'Koi garden', note: 'A still pond, a lantern for the evening and a maple to drop leaves on the water.', pattern: 'circles', items: [[0.42, 0.52, 'pond', 1], [0.66, 0.36, 'lantern', 1], [0.24, 0.3, 'maple', 1], [0.72, 0.7, 'stone', 1], [0.2, 0.72, 'moss', 1], [0.8, 0.5, 'plant', 1]] },
    tea: { name: 'Tea garden', note: 'Moss, a lantern and stepping stones leading to the tea house.', pattern: 'waves', items: [[0.18, 0.75, 'stone', 1], [0.3, 0.62, 'stone', 1], [0.42, 0.52, 'stone', 1], [0.54, 0.44, 'stone', 1], [0.66, 0.38, 'stone', 1], [0.8, 0.3, 'lantern', 1], [0.25, 0.35, 'moss', 1], [0.75, 0.65, 'moss', 1], [0.88, 0.62, 'bonsai', 1]] },
    autumn: { name: 'Autumn hill', note: 'Two maples on fire, a mossy rock and leaves on the wind.', pattern: 'diagonal', items: [[0.3, 0.4, 'maple', 1], [0.68, 0.55, 'maple', 1], [0.5, 0.7, 'stone', 1], [0.84, 0.28, 'moss', 1]], weather: 'leaves' }
  };
  function loadGarden(id) {
    const G = GARDENS[id];
    objects = []; petals = [];
    applyPattern(G.pattern, true);
    const phone = W < 560;
    for (const [fx, fy, type, n] of G.items) {
      for (let k = 0; k < n; k++) {
        const a = k / n * 6.283 + fx * 10, d = n > 1 ? (phone ? 22 : 34) * (k ? 1 : 0.2) : 0;
        let x = W * fx + Math.cos(a) * d, y = H * fy + Math.sin(a) * d * 0.7;
        if (phone) { x = W * (0.15 + fy * 0.7) + Math.cos(a) * d; y = H * (0.12 + fx * 0.66) + Math.sin(a) * d * 0.7; }
        const o = makeObject(type, x, y);
        if (type === 'stone' && n > 1) o.r *= k === 0 ? 1.15 : 0.72;
        objects.push(o);
      }
    }
    for (const o of objects) settle(o, true);
    if (G.weather) setWeather(G.weather, true);
    saveGarden();
    if (id === 'ryoanji') award('ryoanji', '🏯 Ryōan-ji: fifteen stones, five groups');
  }
  $('bGarden').addEventListener('click', async () => {
    const v = await Curio.modal({ emoji: '🏯', title: 'Famous gardens', body: 'Start from a classic layout. Your current garden will be replaced.', buttons: Object.entries(GARDENS).map(([k, g]) => ({ label: g.name, value: k })).concat([{ label: 'Cancel', value: '' }]) });
    if (!v) return;
    audio.start();
    loadGarden(v);
    Curio.toast(GARDENS[v].note, 4200);
    intro.classList.add('is-faded');
  });

  function setWeather(w, quiet) {
    weather = w; Curio.store.set('zen:weather', w);
    const W8 = WEATHER.find((x) => x[0] === w);
    $('bWeather').innerHTML = `${W8[1]}<span class="lbl"> ${W8[2]}</span>`;
    season = w === 'leaves' ? 'autumn' : w === 'snow' ? 'winter' : 'spring';
    if (w === 'snow') award('snow', '❄️ First snow');
    if (!quiet) audio.tok(600, 0.1);
  }
  $('bWeather').addEventListener('click', () => { const i = WEATHER.findIndex((x) => x[0] === weather); setWeather(WEATHER[(i + 1) % WEATHER.length][0]); });
  function setTime(t) {
    timeOfDay = t; Curio.store.set('zen:time', t);
    $('bTime').innerHTML = `${{ day: '☀️', dusk: '🌇', night: '🌙' }[t]}<span class="lbl"> ${{ day: 'Day', dusk: 'Dusk', night: 'Night' }[t]}</span>`;
    if (t === 'night' && objects.some((o) => o.type === 'lantern')) award('night', '🏮 Lantern light');
  }
  $('bTime').addEventListener('click', () => { setTime(TIMES[(TIMES.indexOf(timeOfDay) + 1) % TIMES.length]); audio.tok(500, 0.1); });

  const breath = { on: false, end: 0, t0: 0, phase: '' };
  async function startBreath() {
    const v = await Curio.modal({ emoji: '🧘', title: 'Breathe with the garden', body: `Follow the light: breathe in for four, out for six. A bell rings at the end. You have breathed here for ${Curio.store.get('zen:minutes', 0)} minutes so far.`, buttons: [{ label: '1 minute', value: 1 }, { label: '3 minutes', value: 3 }, { label: '5 minutes', value: 5 }, { label: 'Not now', value: 0 }] });
    if (!v) return;
    audio.start();
    Object.assign(breath, { on: true, t0: performance.now(), end: performance.now() + v * 60000, mins: v, phase: '' });
    $('breath').classList.remove('hidden');
    intro.classList.add('is-faded');
  }
  function stopBreath(done) {
    if (!breath.on) return;
    breath.on = false;
    $('breath').classList.add('hidden');
    if (done) {
      const total = Curio.store.get('zen:minutes', 0) + breath.mins;
      Curio.store.set('zen:minutes', total);
      audio.bell();
      Curio.toast(`${breath.mins} calm minute${breath.mins > 1 ? 's' : ''}. ${total} in total. 🙏`, 3200);
      award('breathe', '🧘 Still mind: finished a breathing session');
      if (total >= 15) award('breathe15', '🪷 Fifteen quiet minutes');
    }
  }
  function stepBreath() {
    if (!breath.on) return;
    const now = performance.now();
    if (now >= breath.end) { stopBreath(true); return; }
    const c = ((now - breath.t0) / 1000) % 10, inhale = c < 4;
    const ph = inhale ? 'in' : 'out';
    if (ph !== breath.phase) {
      breath.phase = ph;
      $('breathTxt').textContent = inhale ? 'Breathe in' : 'Breathe out';
      const orb = $('orb');
      orb.style.transitionDuration = inhale ? '4s' : '6s';
      orb.style.transform = inhale ? 'scale(1)' : 'scale(.55)';
      if (!inhale) audio.tok(196, 0.6);
    }
    const left = Math.ceil((breath.end - now) / 1000);
    $('breathTime').textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  }
  $('bBreathe').addEventListener('click', () => (breath.on ? stopBreath(false) : startBreath()));
  $('breathStop').addEventListener('click', () => stopBreath(false));

  function saveGarden() {
    try { Curio.store.set('zen:garden', { v: 2, w: W, h: H, pattern, objs: objects.map((o) => [o.type, +(o.x / W).toFixed(4), +(o.y / H).toFixed(4), o.seed, +o.r.toFixed(1)]) }); } catch (e) { }
  }
  function restoreGarden() {
    const g = Curio.store.get('zen:garden', null);
    if (!g || g.v !== 2 || !Array.isArray(g.objs) || !g.objs.length) return false;
    objects = [];
    for (const [type, fx, fy, seed, r] of g.objs) {
      if (!DRAW[type] || typeof fx !== 'number') continue;
      const o = makeObject(type, fx * W, fy * H, seed);
      if (typeof r === 'number' && type === 'stone') { const k = r / o.r; o.r = r; o.pts = o.pts.map(([x, y]) => [x * k, y * k]); o.specks = o.specks.map(([x, y, s, l]) => [x * k, y * k, s, l]); }
      objects.push(o);
    }
    applyPattern(PATTERNS[g.pattern] ? g.pattern : 'lines', true);
    return objects.length > 0;
  }

  const keysDown = new Set();
  addEventListener('keydown', (e) => {
    if (e.target.closest?.('input, button') || e.ctrlKey || e.metaKey || document.querySelector('.curio-modal')) return;
    if (e.key.startsWith('Arrow')) { e.preventDefault(); keysDown.add(e.key); }
    const k = e.key.toLowerCase();
    if (k === '8') setTool('maple');
    else if (k === '9') setTool('moss');
    else if (k === '0') setTool('lantern');
    else if (k === 'k') setTool('pond');
    else if (k === 'p') $('bPattern').click();
    else if (k === 'g') $('bGarden').click();
    else if (k === 'w') $('bWeather').click();
    else if (k === 't') $('bTime').click();
    else if (k === 'b') $('bBreathe').click();
    else if ((k === ' ' || k === 'enter') && PLACE.includes(tool)) { e.preventDefault(); const x = keyPos.on ? keyPos.x : W / 2, y = keyPos.on ? keyPos.y : H / 2; place(tool, x, y); }
  });
  addEventListener('keyup', (e) => { keysDown.delete(e.key); if (!keysDown.size && keyPos.raking) { keyPos.raking = false; up('key'); } });
  const keyPos = { x: 0, y: 0, on: false, raking: false };
  function stepKeys(dt) {
    if (!keysDown.size) return;
    if (!keyPos.on) { keyPos.on = true; keyPos.x = pointer.on ? pointer.x : W / 2; keyPos.y = pointer.on ? pointer.y : H / 2; }
    const sp = 220 * dt;
    if (keysDown.has('ArrowLeft')) keyPos.x -= sp;
    if (keysDown.has('ArrowRight')) keyPos.x += sp;
    if (keysDown.has('ArrowUp')) keyPos.y -= sp;
    if (keysDown.has('ArrowDown')) keyPos.y += sp;
    keyPos.x = Math.max(BORDER + 4, Math.min(W - BORDER - 4, keyPos.x)); keyPos.y = Math.max(BORDER + 4, Math.min(H - BORDER - 4, keyPos.y));
    if (TOOLS[tool] || tool === 'smooth') {
      if (!keyPos.raking) { keyPos.raking = true; held = null; rake = null; down(keyPos.x, keyPos.y); }
      moveTo(keyPos.x, keyPos.y);
    } else { pointer.x = keyPos.x; pointer.y = keyPos.y; pointer.on = true; }
    intro.classList.add('is-faded');
  }
  function spawnWeather(dt) {
    if (weather === 'none') return;
    const rate = weather === 'rain' ? 40 : weather === 'snow' ? 10 : 2.5;
    let n = rate * dt;
    while (n > 0) {
      if (Math.random() < n) {
        const base = { x: Math.random() * (W + 100) - 100, y: Math.random() * H * 0.9, a: Math.random() * 6, va: (Math.random() - 0.5) * 3, z: 1 + Math.random() * 1.5, life: weather === 'rain' ? 1 : 8, landed: false, kind: weather };
        if (weather === 'rain') Object.assign(base, { vx: 30, vy: 60, z: 0.25 + Math.random() * 0.3 });
        else if (weather === 'snow') Object.assign(base, { vx: 6, vy: 10, s: 1.2 + Math.random() * 1.6 });
        else if (weather === 'leaves') Object.assign(base, { vx: 22 + Math.random() * 12, vy: 6, c: `hsl(${8 + Math.random() * 35},85%,${45 + Math.random() * 15}%)` });
        else Object.assign(base, { vx: 14 + Math.random() * 10, vy: 5 });
        petals.push(base);
      }
      n -= 1;
    }
    for (const o of objects) if (o.type === 'maple' && Math.random() < dt * 0.4) petals.push({ x: o.x + (Math.random() - 0.5) * o.r, y: o.y + (Math.random() - 0.5) * o.r, vx: 10 + Math.random() * 10, vy: 5, a: Math.random() * 6, va: (Math.random() - 0.5) * 3, z: 1 + Math.random(), life: 10, landed: false, kind: 'leaves', c: `hsl(${o.hue + Math.random() * 15},85%,52%)` });
  }

  function resize() {
    const r = cv.getBoundingClientRect();
    const first = !W;
    const oldW = W, oldH = H;
    dpr = Math.min(2, devicePixelRatio || 1);
    W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    if (first) { initSand(false); if (!restoreGarden()) seedGarden(); }
    else if (Math.abs(oldW - W) > 1 || Math.abs(oldH - H) > 1) initSand(true);
    else paintGrain();
  }
  function seedGarden() {
    const s = W < 560 ? 0.8 : 1;
    const spots = W < 560 ? [[0.3, 0.42, 'stone'], [0.66, 0.6, 'stone'], [0.72, 0.34, 'plant']] : [[0.62, 0.42, 'stone'], [0.7, 0.52, 'stone'], [0.28, 0.66, 'stone'], [0.83, 0.3, 'plant']];
    for (const [fx, fy, t] of spots) {
      const o = makeObject(t, W * fx, H * fy);
      if (t === 'stone') o.r *= s;
      objects.push(o);
      if (t === 'stone') carveRings(o.x / CELL, o.y / CELL, o.r / CELL + 2.5, 3, TOOLS.rake.t);
    }
    objects.sort((a, b) => a.y - b.y);
  }

  let raf = 0, last = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now; time += dt;
    stepRake();
    if (flatAnim > 0) {
      flatAnim--;
      for (let i = 0; i < hgt.length; i++) hgt[i] *= 0.88;
      markDirty(0, 0, GW, GH);
      audio.scrape(flatAnim > 10 ? 6 : 0);
    }
    stepPetals(dt); spawnWeather(dt); stepKeys(dt); stepBreath();
    audio.tick(true);
    render();
  }
  const start = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; audio.tick(false); };
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  addEventListener('resize', resize);
  setWeather(weather, true); setTime(timeOfDay);
  resize();
  start();
  if (!Curio.store.get('zen:padtip', false)) { Curio.store.set('zen:padtip', true); setTimeout(() => Curio.toast('Tip: on a laptop, turn on Touchpad mode in the top bar, or rake with the arrow keys', 4200), 2500); }
  window.__zen = { loadGarden, applyPattern, setWeather, setTime, place, get objects() { return objects; }, setTool: (t) => setTool(t) };
})();
