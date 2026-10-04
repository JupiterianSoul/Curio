(() => {
  const D = window.LAVA_DATA;
  const $ = (id) => document.getElementById(id);
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const R = (a, b) => a + Math.random() * (b - a);
  const hexRgb = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const rgbHex = (c) => '#' + c.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');

  const HW = {
    classic: (t) => 0.088 + 0.084 * t ** 1.15 - (t > 0.93 ? (t - 0.93) * 0.12 : 0),
    tall: (t) => 0.058 + 0.05 * t ** 1.2 - (t > 0.95 ? (t - 0.95) * 0.1 : 0),
    globe: (t) => Math.max(0.05, 0.2 * Math.sqrt(Math.max(0, 1 - (2 * t - 1) ** 2))),
    grande: (t) => 0.12 + 0.1 * t - (t > 0.94 ? (t - 0.94) * 0.2 : 0),
    hourglass: (t) => 0.075 + 0.1 * Math.abs(2 * t - 1) ** 1.3,
    wavy: (t) => 0.075 + 0.05 * t + 0.022 * Math.sin(t * Math.PI * 3),
    cylinder: () => 0.1
  };

  const KEY = 'lava-lamp:v2';
  function loadSave() {
    const oldTheme = Curio.store.get('lava-lamp:theme', 'classic');
    const base = { v: 2, lamps: [{ shape: 'classic', theme: D.THEMES[oldTheme] ? oldTheme : 'classic', finish: 'chrome', on: true, wax: 8 }], room: 'studio', speed: +Curio.store.get('lava-lamp:speed', 40) || 40, sound: { on: false, vol: 60, bloops: true }, custom: { wax: '#ff7a3c', liquid: '#2a1050' }, stats: { seconds: 0, warmed: 0, breaths: 0 }, seen: { themes: {}, shapes: {}, rooms: {} }, ach: {}, breath: 'calm' };
    const s = Curio.store.get(KEY, null);
    if (!s || s.v !== 2) return base;
    const out = { ...base, ...s, sound: { ...base.sound, ...(s.sound || {}) }, custom: { ...base.custom, ...(s.custom || {}) }, stats: { ...base.stats, ...(s.stats || {}) }, seen: { themes: {}, shapes: {}, rooms: {}, ...(s.seen || {}) }, ach: s.ach || {} };
    out.lamps = (Array.isArray(s.lamps) && s.lamps.length ? s.lamps : base.lamps).slice(0, 3).map((l) => ({ shape: D.SHAPES[l.shape] ? l.shape : 'classic', theme: D.THEMES[l.theme] ? l.theme : 'classic', finish: D.FINISHES[l.finish] ? l.finish : 'chrome', on: l.on !== false, wax: clamp(+l.wax || 8, 4, 12) }));
    if (!D.ROOMS.some((r) => r.id === out.room)) out.room = 'studio';
    return out;
  }
  const save = loadSave();
  let saveT = 0;
  const persist = () => { clearTimeout(saveT); saveT = setTimeout(() => Curio.store.set(KEY, save), 300); };

  function readHash() {
    const m = location.hash.match(/l=([^&]+)/), r = location.hash.match(/r=([a-z]+)/);
    if (!m) return;
    const lamps = m[1].split(',').slice(0, 3).map((x) => { const [shape, theme, finish, wax] = x.split('.'); return { shape: D.SHAPES[shape] ? shape : 'classic', theme: D.THEMES[theme] && theme !== 'custom' ? theme : 'classic', finish: D.FINISHES[finish] ? finish : 'chrome', on: true, wax: clamp(+wax || 8, 4, 12) }; });
    if (lamps.length) save.lamps = lamps;
    if (r && D.ROOMS.some((x) => x.id === r[1])) save.room = r[1];
  }
  readHash();

  const canvas = $('lamp'), ctx = canvas.getContext('2d');
  const stage = $('stage');
  let W = 0, H = 0, dpr = 1, time = 0, speed = 1, sel = 0, floorY = 0, dark = false;
  let lamps = [];
  let roomCache = null, roomKey = '';

  function themeOf(l) {
    if (l.theme !== 'custom') return D.THEMES[l.theme];
    const w = hexRgb(save.custom.wax), lq = hexRgb(save.custom.liquid);
    return { name: 'Custom', wax: [w, w.map((v) => v * 1.1 + 15), w.map((v) => v * 0.9)], liquid: [rgbHex(lq.map((v) => v * 0.35)), rgbHex(lq.map((v) => v * 0.75)), rgbHex(lq.map((v) => v * 1.15 + 10))], glow: w };
  }

  function makeLamp(cfg) {
    const L = { ...cfg, power: cfg.on ? 1 : 0, blobs: [], pool: [], field: document.createElement('canvas'), GX: 120, GY: 100, img: null, hwRow: null, glitter: [], bubbles: [], geom: null };
    L.fctx = L.field.getContext('2d');
    return L;
  }
  function layout() {
    if (!(W > 20 && H > 20)) return;
    const n = lamps.length;
    floorY = H * (save.room === 'studio' ? 0.97 : 0.9);
    const slotW = W / n;
    const LH = Math.min(floorY * 0.9, slotW * (n === 1 ? 2.4 : 1.9), 900);
    lamps.forEach((L, i) => {
      const S = D.SHAPES[L.shape], f = HW[L.shape];
      const cx = slotW * (i + 0.5), top = floorY - LH;
      const capH = S.cap[0] * LH, glassH = S.glass * LH;
      let maxHW = 0; for (let k = 0; k <= 40; k++) maxHW = Math.max(maxHW, f(k / 40));
      const g = { LH, cx, top, capTop: top, glassTop: top + capH, glassBot: top + capH + glassH, baseBot: floorY, maxHW: maxHW * LH, f: (t) => f(t) * LH };
      L.geom = g;
      const GX = n > 1 || W < 500 ? 90 : 120;
      const cs = (g.maxHW * 2) / GX, GY = Math.max(20, Math.round(glassH / cs) || 20);
      const K = GX / 84;
      if (GY !== L.GY || GX !== L.GX || !L.img) {
        const oldGY = L.GY, oldGX = L.GX;
        L.GX = GX; L.GY = GY; L.field.width = GX; L.field.height = GY;
        L.img = L.fctx.createImageData(GX, GY);
        L.blobs.forEach((b) => { b.y = b.y / oldGY * GY; b.x = b.x / oldGX * GX; b.r = b.r / oldGX * GX; });
      }
      L.K = K; L.cs = cs;
      L.hwRow = new Float32Array(GY);
      for (let y = 0; y < GY; y++) L.hwRow[y] = g.f((y + 0.5) / GY) / cs;
      const bw = L.hwRow[GY - 1];
      L.pool = [{ x: GX * 0.5, y: GY + 6 * K, r: Math.min(13 * K, bw * 0.8) }, { x: GX * 0.5 - bw * 0.45, y: GY + 5 * K, r: Math.min(10 * K, bw * 0.6) }, { x: GX * 0.5 + bw * 0.45, y: GY + 5 * K, r: Math.min(10 * K, bw * 0.6) }];
      if (!L.blobs.length) makeBlobs(L);
      if (!L.glitter.length) L.glitter = Array.from({ length: 90 }, () => ({ x: Math.random(), y: Math.random(), v: R(0.0002, 0.0007), p: Math.random() * 6 }));
    });
  }
  function makeBlobs(L) {
    L.blobs = [];
    const K = L.K || L.GX / 84;
    for (let i = 0; i < L.wax; i++) {
      const r = R(5.5, 10.5) * K * (L.shape === 'tall' ? 0.8 : 1);
      L.blobs.push({ x: L.GX / 2 + R(-10, 10) * K, y: R(0.15, 0.95) * L.GY, r, vx: 0, vy: 0, T: Math.random(), heat: R(0.7, 1.3), phase: Math.random() * 100, hueOff: i * (360 / L.wax), low: true });
    }
  }
  function resize() {
    const r = stage.getBoundingClientRect();
    if (r.width < 20 || r.height < 20) return;
    dpr = Math.min(2, devicePixelRatio || 1);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    roomCache = null;
    layout();
  }

  function physics(L, dt) {
    const GX = L.GX, GY = L.GY, K = L.K;
    const heatOn = L.power;
    for (const b of L.blobs) {
      const v = b.y / GY;
      if (v > 0.84) b.T = Math.min(1, b.T + 0.0055 * b.heat * dt * heatOn);
      else if (v < 0.22) b.T = Math.max(0, b.T - 0.006 * dt);
      else b.T = Math.max(0, b.T - 0.0007 * dt * (heatOn < 0.5 ? 4 : 1));
      if (heatOn < 0.3) b.T = Math.max(0, b.T - 0.003 * dt);
      const buoy = (b.T - 0.5) * 0.02 * K * (10 / (b.r / K + 3));
      b.vy = (b.vy - buoy * dt) * Math.pow(0.97, dt);
      b.vx = (b.vx + Math.sin(time * 0.01 + b.phase) * 0.0025 * K * dt) * Math.pow(0.97, dt);
      b.x += b.vx * dt; b.y += b.vy * dt;
      const minY = b.r * 0.55, maxY = GY - b.r * 0.35;
      if (b.y < minY) { b.y = minY; b.vy = 0; }
      if (b.y > maxY) { b.y = maxY; b.vy = 0; }
      const row = L.hwRow[Math.max(0, Math.min(GY - 1, b.y | 0))];
      const lim = Math.max(0, row - b.r * 0.75);
      if (b.x < GX / 2 - lim) { b.x = GX / 2 - lim; b.vx = Math.abs(b.vx) * 0.3; }
      if (b.x > GX / 2 + lim) { b.x = GX / 2 + lim; b.vx = -Math.abs(b.vx) * 0.3; }
      if (b.y / GY < 0.72 && b.low) { b.low = false; if (b.vy < 0) bloop(b.r / K); }
      else if (b.y / GY > 0.88) b.low = true;
    }
    if (L.power > 0.5 && Math.random() < 0.01 * dt) L.bubbles.push({ x: GX / 2 + R(-0.5, 0.5) * L.hwRow[GY - 1], y: GY - 2, v: R(0.15, 0.35) * K, r: R(0.5, 1.2) * K });
    for (const bb of L.bubbles) { bb.y -= bb.v * dt; bb.x += Math.sin(time * 0.1 + bb.y) * 0.05 * K; }
    L.bubbles = L.bubbles.filter((bb) => bb.y > 1);
    for (const g of L.glitter) { g.y += g.v * dt * (0.6 + 0.4 * Math.sin(time * 0.01 + g.p)); g.x += Math.sin(time * 0.006 + g.p * 3) * 0.0004 * dt; if (g.y > 1) { g.y = 0; g.x = Math.random(); } }
  }

  function hsl(h, s, l) {
    s /= 100; l /= 100;
    const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [f(0) * 255, f(8) * 255, f(4) * 255];
  }
  function renderField(L) {
    const th = themeOf(L), GX = L.GX, GY = L.GY;
    const all = L.blobs.concat(L.pool);
    const cols = all.map((b, i) => th.wax ? th.wax[i % th.wax.length] : hsl((b.hueOff ?? i * 50) + time * 0.25, 95, 60));
    const n = all.length, bx = new Float32Array(n), by = new Float32Array(n), br = new Float32Array(n);
    all.forEach((b, i) => { bx[i] = b.x; by[i] = b.y; br[i] = b.r * b.r; });
    const d = L.img.data;
    for (let y = 0; y < GY; y++) {
      const hw = L.hwRow[y] + 1, x0 = Math.max(0, Math.floor(GX / 2 - hw)), x1 = Math.min(GX, Math.ceil(GX / 2 + hw));
      let o = y * GX * 4;
      for (let x = 0; x < GX; x++, o += 4) {
        if (x < x0 || x >= x1) { d[o + 3] = 0; continue; }
        let f = 0, r = 0, g = 0, b = 0;
        for (let i = 0; i < n; i++) {
          const dx = x + 0.5 - bx[i], dy = y + 0.5 - by[i];
          const w = br[i] / (dx * dx + dy * dy + 0.5);
          f += w;
          const c = cols[i]; r += c[0] * w; g += c[1] * w; b += c[2] * w;
        }
        if (f < 0.94) { d[o + 3] = 0; continue; }
        const a = Math.min(1, (f - 0.94) / 0.12);
        const e = Math.min(1, Math.max(0, (f - 1) / 1.5));
        const light = (0.62 + 0.1 * L.power) + 0.33 * e * (2 - e);
        const inv = 1 / f;
        d[o] = Math.min(255, r * inv * light + 18 * e);
        d[o + 1] = Math.min(255, g * inv * light + 10 * e);
        d[o + 2] = Math.min(255, b * inv * light);
        d[o + 3] = a * a * (3 - 2 * a) * 255;
      }
    }
    L.fctx.putImageData(L.img, 0, 0);
  }

  function glassPath(c, g, inset = 0) {
    c.beginPath();
    const n = 48;
    for (let i = 0; i <= n; i++) { const t = i / n, y = g.glassTop + (g.glassBot - g.glassTop) * t; const x = g.cx - g.f(t) + inset; i ? c.lineTo(x, y) : c.moveTo(x, y); }
    for (let i = n; i >= 0; i--) { const t = i / n, y = g.glassTop + (g.glassBot - g.glassTop) * t; c.lineTo(g.cx + g.f(t) - inset, y); }
    c.closePath();
  }
  function metal(c, x0, x1, fin) {
    const g = c.createLinearGradient(x0, 0, x1, 0), st = D.FINISHES[fin].stops;
    [0, 0.18, 0.35, 0.5, 0.8, 1].forEach((p, i) => g.addColorStop(p, st[i]));
    return g;
  }
  function drawLamp(L, i, breath) {
    const g = L.geom, th = themeOf(L), S = D.SHAPES[L.shape];
    const glow = th.wax ? th.glow : hsl(time * 0.25 + i * 90, 90, 65);
    const gl = glow.map(Math.round);
    const pw = L.power * breath;
    ctx.fillStyle = 'rgba(0,0,0,.28)';
    ctx.beginPath(); ctx.ellipse(g.cx, g.baseBot - 1, S.base[1] * g.LH * 1.4, g.LH * 0.018, 0, 0, TAU); ctx.fill();
    if (pw > 0.02) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const rg = ctx.createRadialGradient(g.cx, g.baseBot, 0, g.cx, g.baseBot, g.LH * 0.4);
      rg.addColorStop(0, `rgba(${gl},${0.22 * pw})`); rg.addColorStop(1, `rgba(${gl},0)`);
      ctx.fillStyle = rg; ctx.fillRect(g.cx - g.LH * 0.4, g.baseBot - g.LH * 0.1, g.LH * 0.8, g.LH * 0.14);
      ctx.restore();
    }
    ctx.save(); glassPath(ctx, g); ctx.clip();
    const lg = ctx.createLinearGradient(0, g.glassTop, 0, g.glassBot);
    const liq = th.liquid.map((h) => { const c = hexRgb(h); const k = 0.55 + 0.45 * L.power; return `rgb(${c.map((v) => Math.round(v * k)).join(',')})`; });
    lg.addColorStop(0, liq[0]); lg.addColorStop(0.6, liq[1]); lg.addColorStop(1, liq[2]);
    ctx.fillStyle = lg; ctx.fillRect(g.cx - g.maxHW, g.glassTop, g.maxHW * 2, g.glassBot - g.glassTop);
    const heat = ctx.createRadialGradient(g.cx, g.glassBot + 10, 4, g.cx, g.glassBot, g.LH * 0.3);
    heat.addColorStop(0, `rgba(${gl},${0.55 * pw})`); heat.addColorStop(1, `rgba(${gl},0)`);
    ctx.fillStyle = heat; ctx.fillRect(g.cx - g.maxHW, g.glassTop, g.maxHW * 2, g.glassBot - g.glassTop);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(L.field, g.cx - g.maxHW, g.glassTop, g.maxHW * 2, g.glassBot - g.glassTop);
    if (th.glitter) {
      const gc = th.glitter;
      for (const p of L.glitter) {
        const y = g.glassTop + p.y * (g.glassBot - g.glassTop), hw = g.f(p.y) * 0.92, x = g.cx + (p.x * 2 - 1) * hw;
        const tw = 0.4 + 0.6 * Math.abs(Math.sin(time * 0.05 + p.p * 7));
        ctx.fillStyle = `rgba(${gc},${tw * 0.9})`; ctx.fillRect(x, y, 1.6, 1.6);
      }
    }
    for (const bb of L.bubbles) {
      const x = g.cx - g.maxHW + bb.x * L.cs, y = g.glassTop + bb.y * L.cs;
      ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, bb.r * L.cs * 0.5 + 0.6, 0, TAU); ctx.stroke();
    }
    const sh = ctx.createLinearGradient(g.cx - g.maxHW, 0, g.cx + g.maxHW, 0);
    sh.addColorStop(0, 'rgba(0,0,0,.45)'); sh.addColorStop(0.2, 'rgba(255,255,255,0)'); sh.addColorStop(0.3, 'rgba(255,255,255,.22)'); sh.addColorStop(0.36, 'rgba(255,255,255,.04)');
    sh.addColorStop(0.75, 'rgba(255,255,255,0)'); sh.addColorStop(0.86, 'rgba(255,255,255,.1)'); sh.addColorStop(1, 'rgba(0,0,0,.5)');
    ctx.fillStyle = sh; ctx.fillRect(g.cx - g.maxHW, g.glassTop, g.maxHW * 2, g.glassBot - g.glassTop);
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1; glassPath(ctx, g); ctx.stroke();

    const capBotHW = g.f(0) + g.LH * 0.004, capTopHW = S.cap[1] * g.LH;
    ctx.fillStyle = metal(ctx, g.cx - capBotHW, g.cx + capBotHW, L.finish);
    ctx.beginPath();
    if (S.square) { const r = Math.min(capTopHW, g.LH * 0.03); ctx.moveTo(g.cx - capTopHW, g.glassTop + 1); ctx.lineTo(g.cx - capTopHW, g.capTop + r); ctx.quadraticCurveTo(g.cx - capTopHW, g.capTop, g.cx - capTopHW + r, g.capTop); ctx.lineTo(g.cx + capTopHW - r, g.capTop); ctx.quadraticCurveTo(g.cx + capTopHW, g.capTop, g.cx + capTopHW, g.capTop + r); ctx.lineTo(g.cx + capTopHW, g.glassTop + 1); }
    else { ctx.moveTo(g.cx - capTopHW, g.capTop + g.LH * 0.012); ctx.quadraticCurveTo(g.cx, g.capTop - g.LH * 0.012, g.cx + capTopHW, g.capTop + g.LH * 0.012); ctx.lineTo(g.cx + capBotHW + 1, g.glassTop + 1); ctx.lineTo(g.cx - capBotHW - 1, g.glassTop + 1); }
    ctx.closePath(); ctx.fill();

    const topHW = g.f(1) + g.LH * 0.006, waist = S.base[0] * g.LH, bot = S.base[1] * g.LH;
    ctx.fillStyle = metal(ctx, g.cx - bot, g.cx + bot, L.finish);
    const bt = g.glassBot - 1, bm = g.glassBot + (g.baseBot - g.glassBot) * 0.45;
    ctx.beginPath();
    if (S.square) {
      const r = g.LH * 0.02;
      ctx.moveTo(g.cx - bot, bt); ctx.lineTo(g.cx + bot, bt); ctx.lineTo(g.cx + bot, g.baseBot - r); ctx.quadraticCurveTo(g.cx + bot, g.baseBot, g.cx + bot - r, g.baseBot); ctx.lineTo(g.cx - bot + r, g.baseBot); ctx.quadraticCurveTo(g.cx - bot, g.baseBot, g.cx - bot, g.baseBot - r);
    } else {
      ctx.moveTo(g.cx - topHW - 2, bt);
      ctx.quadraticCurveTo(g.cx - waist * 0.9, bm - g.LH * 0.02, g.cx - waist, bm);
      ctx.quadraticCurveTo(g.cx - waist * 1.05, g.baseBot - g.LH * 0.05, g.cx - bot, g.baseBot);
      ctx.lineTo(g.cx + bot, g.baseBot);
      ctx.quadraticCurveTo(g.cx + waist * 1.05, g.baseBot - g.LH * 0.05, g.cx + waist, bm);
      ctx.quadraticCurveTo(g.cx + waist * 0.9, bm - g.LH * 0.02, g.cx + topHW + 2, bt);
    }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = `rgba(${gl},${0.3 * pw})`;
    ctx.fillRect(g.cx - topHW - 2, bt, (topHW + 2) * 2, g.LH * 0.008);
    const sx = g.cx, sy = g.baseBot - (g.baseBot - g.glassBot) * 0.28, sr = Math.max(4, g.LH * 0.012);
    L.switch = { x: sx, y: sy, r: sr * 2.4 };
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.arc(sx, sy, sr * 1.3, 0, TAU); ctx.fill();
    ctx.fillStyle = L.on ? `rgb(${gl})` : '#555'; ctx.beginPath(); ctx.arc(sx, sy, sr, 0, TAU); ctx.fill();
    if (L.on) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(${gl},.5)`; ctx.beginPath(); ctx.arc(sx, sy, sr * 2, 0, TAU); ctx.fill(); ctx.restore(); }
    if (lamps.length > 1 && i === sel && !document.body.classList.contains('ambient')) {
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2; ctx.setLineDash([5, 6]); ctx.lineDashOffset = -time * 0.3;
      ctx.beginPath(); ctx.ellipse(g.cx, g.baseBot + 4, bot * 1.25, g.LH * 0.025, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    }
  }

  function roomDark() { return save.room !== 'studio' || dark || document.body.classList.contains('ambient'); }
  function paintRoom() {
    const key = `${save.room}:${W}:${H}:${dark}:${document.body.classList.contains('ambient')}`;
    if (roomCache && key === roomKey) return;
    roomKey = key;
    roomCache = document.createElement('canvas'); roomCache.width = Math.round(W * dpr); roomCache.height = Math.round(H * dpr);
    const c = roomCache.getContext('2d'); c.scale(dpr, dpr);
    const room = save.room, amb = document.body.classList.contains('ambient');
    if (room === 'studio') {
      if (amb || dark) { c.fillStyle = '#0b090d'; c.fillRect(0, 0, W, H); }
      else { c.fillStyle = 'rgba(0,0,0,0)'; }
      return;
    }
    if (room === 'bedroom') {
      c.fillStyle = '#2a2440'; c.fillRect(0, 0, W, H);
      for (let x = 0; x < W; x += 26) { c.fillStyle = x % 52 ? 'rgba(255,255,255,.025)' : 'rgba(0,0,0,.04)'; c.fillRect(x, 0, 13, floorY); }
      const wx = W * 0.62, wy = H * 0.1, ww = Math.min(W * 0.3, 300), wh = H * 0.42;
      c.fillStyle = '#0a1030'; c.fillRect(wx, wy, ww, wh);
      const sky = c.createLinearGradient(0, wy, 0, wy + wh); sky.addColorStop(0, '#081038'); sky.addColorStop(1, '#2a3a78'); c.fillStyle = sky; c.fillRect(wx, wy, ww, wh);
      c.fillStyle = '#f6efd9'; c.beginPath(); c.arc(wx + ww * 0.7, wy + wh * 0.28, Math.min(ww, wh) * 0.1, 0, TAU); c.fill();
      c.fillStyle = '#2a3a78'; c.beginPath(); c.arc(wx + ww * 0.74, wy + wh * 0.25, Math.min(ww, wh) * 0.09, 0, TAU); c.fill();
      c.fillStyle = '#121a3a'; for (let k = 0; k < 6; k++) c.fillRect(wx + k * ww / 6, wy + wh * (0.75 + (k % 3) * 0.06), ww / 6 - 3, wh);
      c.strokeStyle = '#d8cfc0'; c.lineWidth = 6; c.strokeRect(wx, wy, ww, wh); c.lineWidth = 3; c.beginPath(); c.moveTo(wx + ww / 2, wy); c.lineTo(wx + ww / 2, wy + wh); c.moveTo(wx, wy + wh / 2); c.lineTo(wx + ww, wy + wh / 2); c.stroke();
      c.fillStyle = '#7a3a5a'; for (const side of [-1, 1]) { c.beginPath(); const cx = side < 0 ? wx - 10 : wx + ww + 10; c.moveTo(cx, wy - 14); c.quadraticCurveTo(cx + side * 30, wy + wh * 0.5, cx + side * 12, wy + wh + 30); c.lineTo(cx + side * 46, wy + wh + 30); c.quadraticCurveTo(cx + side * 56, wy + wh * 0.4, cx + side * 40, wy - 14); c.fill(); }
      c.fillStyle = '#e8743b'; c.fillRect(W * 0.08, H * 0.16, Math.min(110, W * 0.16), Math.min(150, H * 0.24));
      c.fillStyle = '#ffd36a'; c.beginPath(); c.arc(W * 0.08 + Math.min(110, W * 0.16) / 2, H * 0.16 + Math.min(150, H * 0.24) * 0.4, Math.min(30, W * 0.04), 0, TAU); c.fill();
      c.fillStyle = '#3a1f12'; c.fillRect(0, floorY, W, H - floorY);
      c.fillStyle = '#5a3420'; c.fillRect(0, floorY, W, 6);
      c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(0, 0, W, H);
      starsIn = { x: wx, y: wy, w: ww, h: wh * 0.7 };
    } else if (room === 'den') {
      c.fillStyle = '#5a3416'; c.fillRect(0, 0, W, H);
      for (let x = 0; x < W; x += 34) { const gr = c.createLinearGradient(x, 0, x + 34, 0); gr.addColorStop(0, '#6e4220'); gr.addColorStop(0.5, '#7c4c26'); gr.addColorStop(1, '#4e2c12'); c.fillStyle = gr; c.fillRect(x, 0, 33, floorY); c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(x + 33, 0, 1, floorY); }
      for (let i = 0; i < 160; i++) { c.strokeStyle = 'rgba(40,20,5,.12)'; c.beginPath(); const x = Math.random() * W, y = Math.random() * floorY; c.moveTo(x, y); c.bezierCurveTo(x + 4, y + 20, x - 4, y + 40, x + 2, y + 70); c.stroke(); }
      c.fillStyle = '#e8a33a'; c.beginPath(); c.arc(W * 0.12, H * 0.22, Math.min(W, H) * 0.08, 0, TAU); c.fill();
      c.fillStyle = '#d4602a'; c.beginPath(); c.arc(W * 0.12, H * 0.22, Math.min(W, H) * 0.055, 0, TAU); c.fill();
      c.fillStyle = '#7a2a18'; c.beginPath(); c.arc(W * 0.12, H * 0.22, Math.min(W, H) * 0.03, 0, TAU); c.fill();
      const sg = c.createLinearGradient(0, floorY, 0, H); sg.addColorStop(0, '#8a5a2a'); sg.addColorStop(1, '#5a3a18'); c.fillStyle = sg; c.fillRect(0, floorY, W, H - floorY);
      for (let i = 0; i < W * 2; i++) { c.strokeStyle = `rgba(${Math.random() < 0.5 ? '200,140,70' : '90,50,20'},.5)`; const x = Math.random() * W, y = floorY + 6 + Math.random() * (H - floorY); c.beginPath(); c.moveTo(x, y); c.lineTo(x + R(-2, 2), y - R(4, 8)); c.stroke(); }
      c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(0, 0, W, H);
    } else if (room === 'rain') {
      const sky = c.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#16202e'); sky.addColorStop(1, '#2a3646'); c.fillStyle = sky; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 40; i++) { const x = Math.random() * W, y = H * 0.4 + Math.random() * H * 0.45, r = R(8, 30); const g = c.createRadialGradient(x, y, 0, x, y, r); const col = Curio.pick(['255,200,120', '255,140,90', '150,200,255', '255,240,200']); g.addColorStop(0, `rgba(${col},.35)`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
      c.fillStyle = 'rgba(200,220,255,.05)'; c.fillRect(0, 0, W, H);
      c.strokeStyle = '#1a1410'; c.lineWidth = Math.max(10, W * 0.012);
      c.strokeRect(-2, -2, W + 4, floorY + 2); c.beginPath(); c.moveTo(W / 2, 0); c.lineTo(W / 2, floorY); c.stroke();
      c.fillStyle = '#4a3a2c'; c.fillRect(0, floorY, W, H - floorY); c.fillStyle = '#6a5440'; c.fillRect(0, floorY, W, 8);
      c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, 0, W, H);
      drops = Array.from({ length: Math.round(W / 9) }, () => ({ x: Math.random() * W, y: Math.random() * floorY, v: R(0.4, 2.5), r: R(1.2, 3.2), stuck: Math.random() < 0.5 }));
    } else if (room === 'space') {
      c.fillStyle = '#0c0f16'; c.fillRect(0, 0, W, H);
      for (let x = 0; x < W; x += 60) { c.fillStyle = 'rgba(255,255,255,.03)'; c.fillRect(x, 0, 2, H); }
      c.fillStyle = 'rgba(255,255,255,.04)'; for (let y = 20; y < floorY; y += 80) c.fillRect(0, y, W, 2);
      porthole = { x: W * 0.5, y: H * 0.36, r: Math.min(W * 0.36, H * 0.33) };
      c.fillStyle = '#262b36'; c.beginPath(); c.arc(porthole.x, porthole.y, porthole.r * 1.12, 0, TAU); c.fill();
      for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; c.fillStyle = '#4a5160'; c.beginPath(); c.arc(porthole.x + Math.cos(a) * porthole.r * 1.06, porthole.y + Math.sin(a) * porthole.r * 1.06, 3, 0, TAU); c.fill(); }
      c.fillStyle = '#2e3440'; c.fillRect(0, floorY, W, H - floorY); c.fillStyle = '#4a5160'; c.fillRect(0, floorY, W, 5);
      c.fillStyle = 'rgba(80,255,160,.8)'; for (let i = 0; i < 6; i++) c.fillRect(W * 0.06 + i * 10, floorY + 16, 5, 3);
      c.fillStyle = 'rgba(255,90,60,.8)'; c.fillRect(W * 0.9, floorY + 16, 6, 3);
      c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, 0, W, H);
      spaceStars = Array.from({ length: 140 }, () => ({ a: Math.random() * TAU, d: Math.sqrt(Math.random()), s: R(0.5, 1.6), v: R(0.2, 1) }));
    } else if (room === 'desk') {
      c.fillStyle = '#2a2a38'; c.fillRect(0, 0, W, H);
      const shelfY = H * 0.24;
      c.fillStyle = '#4a3220'; c.fillRect(W * 0.04, shelfY, W * 0.92, 8);
      let bx = W * 0.06;
      while (bx < W * 0.9) { const bw = R(12, 26), bh = R(40, 70); c.fillStyle = Curio.pick(['#8a2a2a', '#2a5a8a', '#2a7a4a', '#c89a2a', '#6a3a8a', '#d4602a', '#3a3a4a']); c.fillRect(bx, shelfY - bh, bw, bh); c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(bx + 3, shelfY - bh + 8, bw - 6, 2); bx += bw + R(1, 3); if (Math.random() < 0.08) bx += 30; }
      c.fillStyle = '#e8e2d6'; c.beginPath(); c.arc(W * 0.86, H * 0.5, Math.min(W, H) * 0.06, 0, TAU); c.fill();
      c.strokeStyle = '#2a2a38'; c.lineWidth = 2; c.beginPath(); c.moveTo(W * 0.86, H * 0.5); c.lineTo(W * 0.86, H * 0.5 - Math.min(W, H) * 0.04); c.moveTo(W * 0.86, H * 0.5); c.lineTo(W * 0.86 + Math.min(W, H) * 0.03, H * 0.5); c.stroke();
      const dg = c.createLinearGradient(0, floorY, 0, H); dg.addColorStop(0, '#6a4428'); dg.addColorStop(1, '#3e2614'); c.fillStyle = dg; c.fillRect(0, floorY, W, H - floorY);
      c.fillStyle = '#8a5a34'; c.fillRect(0, floorY, W, 5);
      const mugX = W * 0.1, mugY = floorY;
      c.fillStyle = '#d4d0c8'; c.fillRect(mugX, mugY - 34, 28, 34); c.strokeStyle = '#d4d0c8'; c.lineWidth = 5; c.beginPath(); c.arc(mugX + 30, mugY - 18, 8, -1.2, 1.2); c.stroke();
      mug = { x: mugX + 14, y: mugY - 36 };
      for (let k = 0; k < 3; k++) { c.fillStyle = Curio.pick(['#2a5a8a', '#8a2a2a', '#c89a2a']); c.fillRect(W * 0.78, floorY - 10 - k * 10, W * 0.16, 10); }
      c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(0, 0, W, H);
    }
  }
  let starsIn = null, drops = [], porthole = null, spaceStars = [], mug = null;
  function roomAnim() {
    const room = save.room;
    if (room === 'bedroom' && starsIn) {
      for (let i = 0; i < 26; i++) { const x = starsIn.x + ((i * 97) % 100) / 100 * starsIn.w, y = starsIn.y + ((i * 53) % 100) / 100 * starsIn.h; ctx.fillStyle = `rgba(255,255,255,${0.3 + 0.5 * Math.abs(Math.sin(time * 0.02 + i))})`; ctx.fillRect(x, y, 1.6, 1.6); }
    } else if (room === 'rain') {
      ctx.strokeStyle = 'rgba(190,210,240,.35)'; ctx.lineWidth = 1;
      for (const d of drops) {
        if (!d.stuck || Math.random() < 0.002) { d.stuck = false; d.y += d.v * speed; }
        if (d.y > floorY) { d.y = -5; d.x = Math.random() * W; d.stuck = Math.random() < 0.5; }
        ctx.fillStyle = 'rgba(210,225,250,.35)'; ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, TAU); ctx.fill();
        if (!d.stuck) { ctx.beginPath(); ctx.moveTo(d.x, d.y - d.r); ctx.lineTo(d.x, d.y - d.r - d.v * 8); ctx.stroke(); }
      }
      if (Math.random() < 0.0008) { thunder(); flashT = 1; }
      if (flashT > 0) { ctx.fillStyle = `rgba(220,230,255,${flashT * 0.25})`; ctx.fillRect(0, 0, W, floorY); flashT -= 0.04; }
    } else if (room === 'space' && porthole) {
      const p = porthole;
      ctx.save(); ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.clip();
      ctx.fillStyle = '#01020a'; ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
      for (const s of spaceStars) { const a = s.a + time * 0.0004 * s.v; ctx.fillStyle = `rgba(255,255,255,${0.4 + s.v * 0.5})`; ctx.fillRect(p.x + Math.cos(a) * s.d * p.r, p.y + Math.sin(a) * s.d * p.r, s.s, s.s); }
      const er = p.r * 1.6, ey = p.y + p.r * 1.75;
      const eg = ctx.createRadialGradient(p.x - er * 0.2, ey - er * 0.5, er * 0.2, p.x, ey, er);
      eg.addColorStop(0, '#5fb0ff'); eg.addColorStop(0.7, '#1a5aa8'); eg.addColorStop(1, '#0a2a60');
      ctx.fillStyle = eg; ctx.beginPath(); ctx.arc(p.x, ey, er, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(70,140,80,.75)';
      for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + Math.sin(time * 0.0007 + k * 1.3) * 0.7, x = p.x + Math.cos(a) * er * 0.92, y = ey + Math.sin(a) * er * 0.92; ctx.beginPath(); ctx.ellipse(x, y, er * 0.12, er * 0.04, a + Math.PI / 2, 0, TAU); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + Math.sin(time * 0.001 + k * 2.1) * 0.8; ctx.beginPath(); ctx.ellipse(p.x + Math.cos(a) * er * 0.97, ey + Math.sin(a) * er * 0.97, er * 0.15, er * 0.02, a + Math.PI / 2, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = 'rgba(120,190,255,.6)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(p.x, ey, er + 2, 0, TAU); ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x - p.r * 0.2, p.y - p.r * 0.2, p.r * 0.75, 3.6, 4.4); ctx.stroke();
    } else if (room === 'desk' && mug) {
      ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 2;
      for (let k = 0; k < 3; k++) { ctx.beginPath(); for (let y = 0; y < 50; y += 4) { const x = mug.x - 6 + k * 6 + Math.sin(y * 0.15 + time * 0.03 + k) * 4; y ? ctx.lineTo(x, mug.y - y) : ctx.moveTo(x, mug.y - y); } ctx.stroke(); }
    } else if (room === 'den' && lamps.length === 1) {
      const rx = W * 0.88, ry = floorY - 14, rr = Math.min(60, W * 0.08);
      ctx.fillStyle = '#2a1a10'; ctx.fillRect(rx - rr * 1.2, ry - 4, rr * 2.4, 18);
      ctx.save(); ctx.translate(rx, ry); ctx.scale(1, 0.3);
      ctx.fillStyle = '#0a0a0c'; ctx.beginPath(); ctx.arc(0, 0, rr, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.08)'; for (let k = 3; k < 10; k++) { ctx.beginPath(); ctx.arc(0, 0, rr * k / 10, 0, TAU); ctx.stroke(); }
      ctx.rotate(time * 0.06 * speed); ctx.fillStyle = '#d4602a'; ctx.beginPath(); ctx.arc(0, 0, rr * 0.3, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffd36a'; ctx.fillRect(-2, -rr * 0.28, 4, rr * 0.2);
      ctx.restore();
    }
  }
  let flashT = 0;

  let breathOn = false, breathT = 0, breathStep = 0, breathCount = 0;
  function breathMod() {
    if (!breathOn) return 1;
    const pat = D.BREATHS.find((b) => b.id === save.breath) || D.BREATHS[0];
    const [label, dur] = pat.steps[breathStep];
    const p = clamp(breathT / dur, 0, 1);
    if (label === 'Breathe in') return 0.55 + 0.45 * p;
    if (label === 'Breathe out') return 1 - 0.45 * p;
    return breathStep === 1 || (pat.steps.length === 4 && breathStep === 1) ? 1 : 0.55;
  }
  function stepBreath(dt) {
    if (!breathOn) return;
    const pat = D.BREATHS.find((b) => b.id === save.breath) || D.BREATHS[0];
    breathT += dt;
    const [, dur] = pat.steps[breathStep];
    if (breathT >= dur) {
      breathT = 0; breathStep = (breathStep + 1) % pat.steps.length;
      if (breathStep === 0) { breathCount++; save.stats.breaths++; if (save.stats.breaths >= 10) unlock('breathe'); persist(); }
      chimeSoft(pat.steps[breathStep][0]);
    }
    const [label, d2] = pat.steps[breathStep];
    $('breathLbl').textContent = label;
    $('breathNum').textContent = String(Math.ceil(d2 - breathT));
    $('breathCount').textContent = `${breathCount} breath${breathCount === 1 ? '' : 's'}`;
    const ring = $('breathRing'), m = breathMod();
    ring.style.transform = `translate(-50%, -50%) scale(${0.6 + (m - 0.55) / 0.45 * 0.6})`;
  }
  function setBreath(on) {
    breathOn = on; breathT = 0; breathStep = 0; breathCount = 0;
    $('breathe').hidden = !on;
    $('breathBtn').setAttribute('aria-pressed', String(on)); $('breathBtn').textContent = on ? '⏹ Stop breathing' : '🌬️ Start breathing';
    if (on) chimeSoft('Breathe in');
  }

  let A = null;
  function audioCtx() { return Curio.audioContext(); }
  function startSound() {
    const ac = audioCtx(); if (!ac) return;
    stopSound();
    const master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination);
    const filt = ac.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 2400; filt.connect(master);
    A = { ac, master, filt, nodes: [], next: {}, room: save.room };
    const noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const d = noiseBuf.getChannelData(0); let last = 0;
    for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
    A.noise = noiseBuf;
    const white = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate); const wd = white.getChannelData(0); for (let i = 0; i < wd.length; i++) wd[i] = Math.random() * 2 - 1; A.white = white;
    const hum = ac.createOscillator(), hg = ac.createGain(); hum.frequency.value = 60; hg.gain.value = 0.025; hum.connect(hg).connect(filt); hum.start(); A.nodes.push(hum);
    const hum2 = ac.createOscillator(), hg2 = ac.createGain(); hum2.frequency.value = 120; hg2.gain.value = 0.008; hum2.connect(hg2).connect(filt); hum2.start(); A.nodes.push(hum2);
    const room = save.room;
    if (room === 'rain') {
      const s = ac.createBufferSource(); s.buffer = white; s.loop = true; const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 0.5; const g = ac.createGain(); g.gain.value = 0.16; s.connect(bp).connect(g).connect(master); s.start(); A.nodes.push(s);
      const s2 = ac.createBufferSource(); s2.buffer = noiseBuf; s2.loop = true; const g2 = ac.createGain(); g2.gain.value = 0.25; s2.connect(g2).connect(filt); s2.start(); A.nodes.push(s2);
    }
    if (room === 'space') {
      for (const f of [55, 55.4, 82.4]) { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220; const g = ac.createGain(); g.gain.value = 0.03; o.connect(lp).connect(g).connect(master); o.start(); A.nodes.push(o); }
    }
    if (room === 'den' || room === 'studio') {
      const s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true; const g = ac.createGain(); g.gain.value = room === 'den' ? 0.05 : 0.03; s.connect(g).connect(filt); s.start(); A.nodes.push(s);
    }
    setVolume();
    unlock('sound');
  }
  function stopSound() {
    if (!A) return;
    const { ac, master } = A;
    try { master.gain.setTargetAtTime(0, ac.currentTime, 0.2); } catch {}
    const nodes = A.nodes; setTimeout(() => nodes.forEach((n) => { try { n.stop(); } catch {} }), 800);
    A = null;
  }
  function setVolume() {
    if (!A) return;
    const v = Curio.muted || !save.sound.on ? 0 : (save.sound.vol / 100) * 0.9 * sleepFade;
    A.master.gain.setTargetAtTime(v, A.ac.currentTime, 0.3);
  }
  function blip(f0, f1, dur, vol, type = 'sine', when = 0, dest) {
    if (!A) return;
    const { ac } = A, t = ac.currentTime + when, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.05, dur / 4)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(dest || A.filt); o.start(t); o.stop(t + dur + 0.05);
  }
  function noiseHit(dur, freq, vol, type = 'bandpass', q = 1) {
    if (!A) return;
    const { ac } = A, t = ac.currentTime, s = ac.createBufferSource(); s.buffer = A.white;
    const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(A.master); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }
  function bloop(size) { if (!A || !save.sound.bloops) return; const f = 520 - size * 25; blip(f, f * 0.5, 0.35, 0.05); }
  function thunder() { if (!A) return; const { ac } = A, t = ac.currentTime + 0.4, s = ac.createBufferSource(); s.buffer = A.noise; const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.6, t + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + 3); s.connect(g).connect(A.filt); s.start(t); s.stop(t + 3.2); }
  function chimeSoft(label) { if (!A) return; const f = label === 'Breathe in' ? 528 : label === 'Breathe out' ? 396 : 440; blip(f, f * 0.998, 1.6, 0.05, 'sine'); blip(f * 2, f * 2, 1, 0.015, 'sine'); }
  const CHORDS = [[174.6, 220, 261.6, 329.6], [164.8, 196, 246.9, 293.7], [146.8, 174.6, 220, 261.6], [130.8, 164.8, 196, 246.9]];
  let chordI = 0;
  function soundTick() {
    if (!A) return;
    if (A.room !== save.room) { startSound(); return; }
    const { ac } = A, now = ac.currentTime, n = A.next, room = save.room;
    if (room === 'bedroom' && (n.cr || 0) < now) { const base = R(4200, 4800); for (let k = 0; k < 3; k++) blip(base, base, 0.04, 0.012, 'sine', k * 0.07); n.cr = now + R(0.6, 2.2); }
    if (room === 'den') {
      if ((n.crackle || 0) < now) { noiseHit(0.01, R(2000, 6000), R(0.01, 0.04), 'highpass'); n.crackle = now + R(0.05, 0.4); }
      if ((n.chord || 0) < now) { CHORDS[chordI % 4].forEach((f) => blip(f, f, 7.5, 0.025, 'triangle')); chordI++; n.chord = now + 7; }
    }
    if (room === 'space' && (n.beep || 0) < now) { blip(1320, 1320, 0.12, 0.02, 'sine'); blip(1760, 1760, 0.12, 0.015, 'sine', 0.15); n.beep = now + R(8, 16); }
    if (room === 'desk' && (n.tick || 0) < now) { noiseHit(0.02, 3000, 0.03, 'bandpass', 8); n.tick = now + 1; }
    if (room === 'studio' && (n.pad || 0) < now) { const f = Curio.pick([196, 220, 261.6, 293.7]); blip(f, f, 6, 0.012, 'sine'); n.pad = now + R(5, 9); }
  }

  let sleepEnd = 0, sleepFade = 1;
  function setSleep(min) {
    sleepEnd = min ? performance.now() + min * 60000 : 0; sleepFade = 1;
    $('sleepSel').value = String(min || 0);
    if (min) Curio.toast(`Sleep timer: ${min} minutes. Sweet dreams 🌙`);
  }
  function stepSleep() {
    if (!sleepEnd) return;
    const left = sleepEnd - performance.now();
    if (left < 60000) { sleepFade = clamp(left / 60000, 0, 1); setVolume(); }
    if (left <= 0) { lamps.forEach((L) => { L.on = false; }); syncSave(); sleepEnd = 0; paintControls(); }
  }

  function draw() {
    const amb = document.body.classList.contains('ambient');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    paintRoom();
    if (roomCache.width && roomCache.height) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(roomCache, 0, 0); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    roomAnim();
    const bm = breathMod();
    const isDark = roomDark();
    ctx.save(); ctx.globalCompositeOperation = isDark ? 'lighter' : 'source-over';
    lamps.forEach((L, i) => {
      if (!L.geom) return;
      const g = L.geom, th = themeOf(L), glow = (th.wax ? th.glow : hsl(time * 0.25 + i * 90, 90, 65)).map(Math.round);
      const pw = L.power * bm;
      if (pw < 0.02) return;
      const cy = (g.glassTop + g.glassBot) / 2;
      const room = ctx.createRadialGradient(g.cx, cy, g.LH * 0.05, g.cx, cy, Math.max(W, H) * (lamps.length > 1 ? 0.45 : 0.7));
      room.addColorStop(0, `rgba(${glow},${(isDark ? 0.32 : 0.26) * pw})`);
      room.addColorStop(0.5, `rgba(${glow},${(isDark ? 0.08 : 0.06) * pw})`);
      room.addColorStop(1, `rgba(${glow},0)`);
      ctx.fillStyle = room; ctx.fillRect(0, 0, W, H);
    });
    ctx.restore();
    lamps.forEach((L, i) => { if (L.img && L.geom) drawLamp(L, i, bm); });
    void amb;
  }

  let raf = 0, last = 0, secAcc = 0;
  function frame(t) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(3, (t - (last || t)) / 16.67); last = t;
    const k = dt * speed;
    time += k;
    for (const L of lamps) {
      if (!L.img || !L.geom) continue;
      const target = L.on ? 1 : 0;
      L.power += (target - L.power) * Math.min(1, 0.006 * dt * (L.on ? 1 : 1.4));
      const sub = Math.ceil(k / 1.5);
      for (let i = 0; i < sub; i++) physics(L, k / sub);
      renderField(L);
    }
    draw();
    stepBreath(dt / 60);
    stepSleep();
    soundTick();
    secAcc += dt / 60;
    if (secAcc >= 10) { save.stats.seconds += secAcc; secAcc = 0; const m = save.stats.seconds / 60; if (m >= 5) unlock('min5'); if (m >= 30) unlock('min30'); if (m >= 120) unlock('min120'); persist(); paintStatLine(); }
  }
  const start = () => { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  document.addEventListener('visibilitychange', () => { if (document.hidden) { stop(); if (A) A.master.gain.setTargetAtTime(0, A.ac.currentTime, 0.1); } else { start(); setVolume(); } });

  function syncSave() { save.lamps = lamps.map((L) => ({ shape: L.shape, theme: L.theme, finish: L.finish, on: L.on, wax: L.wax })); persist(); }
  function selLamp() { return lamps[clamp(sel, 0, lamps.length - 1)]; }

  canvas.addEventListener('pointerdown', (e) => {
    const r = canvas.getBoundingClientRect();
    const px = e.clientX - r.left, py = e.clientY - r.top;
    let hitI = -1;
    lamps.forEach((L, i) => { const g = L.geom; if (px > g.cx - g.LH * 0.26 && px < g.cx + g.LH * 0.26 && py > g.top - 10 && py < g.baseBot + 10) hitI = i; });
    if (hitI < 0) return;
    const L = lamps[hitI];
    if (hitI !== sel) { sel = hitI; paintControls(); }
    const sw = L.switch;
    if (sw && Math.hypot(px - sw.x, py - sw.y) < sw.r) { togglePower(L); return; }
    const g = L.geom;
    if (py < g.glassTop || py > g.glassBot) return;
    const gx = (px - (g.cx - g.maxHW)) / L.cs, gy = (py - g.glassTop) / L.cs;
    let hit = false;
    for (const b of L.blobs) {
      const d = Math.hypot(b.x - gx, b.y - gy);
      if (d < b.r + 14 * L.K) { b.T = Math.min(1, b.T + 0.35); b.vy -= 0.12 * L.K; b.vx += (b.x - gx) * 0.01; hit = true; }
    }
    if (hit) {
      save.stats.warmed++; unlock('warm'); if (save.stats.warmed >= 100) unlock('warm100'); persist();
      if (A) blip(R(180, 240), R(140, 170), 0.4, 0.06); else Curio.beep(R(180, 240), 0.25, 'sine', 0.05);
      if (navigator.vibrate && e.pointerType === 'touch') navigator.vibrate(6);
    }
  });
  function togglePower(L) {
    L.on = !L.on; syncSave(); paintControls();
    Curio.beep(L.on ? 900 : 500, 0.04, 'square', 0.05);
    Curio.toast(L.on ? 'Warming up… give it a moment' : 'Lamp off. The wax will settle.', 1600);
  }

  const panel = $('panel');
  let tab = 'lamp';
  function seg(label, items, cur, onPick, render) {
    const wrap = document.createElement('div'); wrap.className = 'll-group';
    const h = document.createElement('div'); h.className = 'll-glabel'; h.textContent = label; wrap.append(h);
    const row = document.createElement('div'); row.className = 'll-chips';
    for (const it of items) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'll-chip';
      b.setAttribute('aria-pressed', String(it.id === cur)); b.title = it.name; b.setAttribute('aria-label', it.name);
      render(b, it);
      b.addEventListener('click', () => onPick(it.id));
      row.append(b);
    }
    wrap.append(row);
    return wrap;
  }
  function shapeIcon(id) {
    const c = document.createElement('canvas'); c.width = 56; c.height = 76; c.style.width = '28px'; c.style.height = '38px';
    const x = c.getContext('2d'), S = D.SHAPES[id], f = HW[id], LH = 70, top = 3, gt = top + S.cap[0] * LH, gb = gt + S.glass * LH, cx = 28;
    x.fillStyle = '#9aa0aa'; x.fillRect(cx - S.cap[1] * LH, top, S.cap[1] * LH * 2, gt - top);
    x.fillStyle = '#ff7a3c'; x.beginPath();
    for (let i = 0; i <= 20; i++) { const t = i / 20; x.lineTo(cx - f(t) * LH, gt + (gb - gt) * t); }
    for (let i = 20; i >= 0; i--) { const t = i / 20; x.lineTo(cx + f(t) * LH, gt + (gb - gt) * t); }
    x.fill();
    x.fillStyle = '#9aa0aa'; x.beginPath(); x.moveTo(cx - f(1) * LH, gb); x.lineTo(cx + f(1) * LH, gb); x.lineTo(cx + S.base[1] * LH, top + LH); x.lineTo(cx - S.base[1] * LH, top + LH); x.fill();
    return c;
  }
  function paintControls() {
    const L = selLamp();
    panel.textContent = '';
    document.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
    if (tab === 'lamp') {
      if (lamps.length > 1) {
        const wrap = document.createElement('div'); wrap.className = 'll-group';
        wrap.innerHTML = '<div class="ll-glabel">Editing lamp</div>';
        const row = document.createElement('div'); row.className = 'll-seg';
        lamps.forEach((_, i) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = `Lamp ${i + 1}`; b.setAttribute('aria-pressed', String(i === sel)); b.addEventListener('click', () => { sel = i; paintControls(); }); row.append(b); });
        wrap.append(row); panel.append(wrap);
      }
      panel.append(seg('Wax color', Object.entries(D.THEMES).map(([id, t]) => ({ id, name: t.name })), L.theme, (id) => { L.theme = id; seeTheme(id); syncSave(); paintControls(); }, (b, it) => {
        const t = D.THEMES[it.id];
        b.classList.add('ll-sw');
        b.style.background = it.id === 'rainbow' ? 'conic-gradient(#ff5a5a, #ffc233, #6bff6b, #3ad7ff, #8a6bff, #ff6fd8, #ff5a5a)' : it.id === 'custom' ? `radial-gradient(circle at 35% 35%, ${save.custom.wax}, ${save.custom.liquid} 75%)` : `radial-gradient(circle at 35% 35%, rgb(${t.wax[1]}), rgb(${t.wax[0]}) 45%, ${t.liquid[1]} 75%)`;
        if (t.glitter) b.classList.add('ll-glit');
      }));
      if (L.theme === 'custom') {
        const row = document.createElement('div'); row.className = 'll-custom';
        row.innerHTML = '<label>Wax <input type="color" id="cWax"></label><label>Liquid <input type="color" id="cLiq"></label>';
        row.querySelector('#cWax').value = save.custom.wax; row.querySelector('#cLiq').value = save.custom.liquid;
        row.querySelector('#cWax').addEventListener('input', (e) => { save.custom.wax = e.target.value; unlock('custom'); persist(); });
        row.querySelector('#cLiq').addEventListener('input', (e) => { save.custom.liquid = e.target.value; unlock('custom'); persist(); });
        panel.append(row);
      }
      panel.append(seg('Shape', Object.entries(D.SHAPES).map(([id, s]) => ({ id, name: s.name })), L.shape, (id) => { L.shape = id; save.seen.shapes[id] = 1; if (Object.keys(D.SHAPES).every((s) => save.seen.shapes[s])) unlock('shapes'); L.blobs = []; L.img = null; layout(); syncSave(); paintControls(); }, (b, it) => { b.classList.add('ll-shape'); b.append(shapeIcon(it.id)); const s = document.createElement('span'); s.textContent = it.name; b.append(s); }));
      panel.append(seg('Base finish', Object.entries(D.FINISHES).map(([id, f]) => ({ id, name: f.name })), L.finish, (id) => { L.finish = id; syncSave(); paintControls(); }, (b, it) => { b.classList.add('ll-sw', 'll-fin'); const st = D.FINISHES[it.id].stops; b.style.background = `linear-gradient(90deg, ${st[0]}, ${st[2]} 45%, ${st[4]})`; }));
      const g = document.createElement('div'); g.className = 'll-group ll-row';
      g.innerHTML = '<label class="ll-range">Wax amount <input type="range" id="waxR" min="4" max="12" step="1"></label><button type="button" class="ll-toggle" id="powBtn"></button><div class="ll-seg" id="countSeg" role="group" aria-label="Number of lamps"><button type="button">1</button><button type="button">2</button><button type="button">3</button></div>';
      const wr = g.querySelector('#waxR'); wr.value = L.wax; wr.addEventListener('change', () => { L.wax = +wr.value; makeBlobs(L); syncSave(); });
      const pb = g.querySelector('#powBtn'); pb.textContent = L.on ? '💡 On' : '⚫ Off'; pb.setAttribute('aria-pressed', String(L.on)); pb.addEventListener('click', () => togglePower(L));
      g.querySelectorAll('#countSeg button').forEach((b, i) => { b.setAttribute('aria-pressed', String(lamps.length === i + 1)); b.setAttribute('aria-label', `${i + 1} lamp${i ? 's' : ''}`); b.addEventListener('click', () => setCount(i + 1)); });
      panel.append(g);
    } else if (tab === 'room') {
      const grid = document.createElement('div'); grid.className = 'll-rooms';
      for (const r of D.ROOMS) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'll-room'; b.setAttribute('aria-pressed', String(save.room === r.id));
        b.innerHTML = '<i></i><b></b><small></small>'; b.querySelector('i').textContent = r.icon; b.querySelector('b').textContent = r.name; b.querySelector('small').textContent = r.blurb;
        b.addEventListener('click', () => setRoom(r.id));
        grid.append(b);
      }
      panel.append(grid);
    } else if (tab === 'sound') {
      const g = document.createElement('div'); g.className = 'll-group ll-row';
      g.innerHTML = `<button type="button" class="ll-toggle" id="sndBtn"></button>
        <label class="ll-range">Volume <input type="range" id="volR" min="0" max="100"></label>
        <button type="button" class="ll-toggle" id="bloopBtn"></button>
        <label class="ll-range">Sleep timer <select id="sleepSel" class="ll-select"><option value="0">Off</option><option value="15">15 min</option><option value="30">30 min</option><option value="60">60 min</option></select></label>`;
      const sb = g.querySelector('#sndBtn'); sb.textContent = save.sound.on ? '🔊 Soundscape on' : '🔈 Soundscape off'; sb.setAttribute('aria-pressed', String(save.sound.on));
      sb.addEventListener('click', () => { save.sound.on = !save.sound.on; persist(); if (save.sound.on) { startSound(); if (Curio.muted) Curio.toast('Unmute Zoble (top bar) to hear it'); } else stopSound(); paintControls(); });
      const vr = g.querySelector('#volR'); vr.value = save.sound.vol; vr.addEventListener('input', () => { save.sound.vol = +vr.value; persist(); setVolume(); });
      const bb = g.querySelector('#bloopBtn'); bb.textContent = save.sound.bloops ? '🫧 Bloops on' : '🫧 Bloops off'; bb.setAttribute('aria-pressed', String(save.sound.bloops)); bb.addEventListener('click', () => { save.sound.bloops = !save.sound.bloops; persist(); paintControls(); });
      const ss = g.querySelector('#sleepSel'); ss.value = sleepEnd ? String(Math.round((sleepEnd - performance.now()) / 60000 / 15) * 15 || 15) : '0'; ss.addEventListener('change', () => setSleep(+ss.value));
      panel.append(g);
      const p = document.createElement('p'); p.className = 'll-note'; p.textContent = `Each room has its own ambience: crickets in the bedroom, vinyl and slow chords in the den, rain and thunder at the window, a deep hum in orbit, a ticking clock at the desk.`;
      panel.append(p);
    } else if (tab === 'breathe') {
      panel.append(seg('Pattern', D.BREATHS.map((b) => ({ id: b.id, name: b.name })), save.breath, (id) => { save.breath = id; persist(); if (breathOn) setBreath(true); paintControls(); }, (b, it) => { b.textContent = it.name; b.classList.add('ll-text'); }));
      const g = document.createElement('div'); g.className = 'll-group ll-row';
      g.innerHTML = '<button type="button" class="c-btn" id="breathBtn2"></button>';
      const bb = g.querySelector('#breathBtn2'); bb.textContent = breathOn ? '⏹ Stop breathing' : '🌬️ Start breathing'; bb.addEventListener('click', () => { setBreath(!breathOn); paintControls(); });
      panel.append(g);
      const p = document.createElement('p'); p.className = 'll-note'; p.textContent = 'Follow the glow: it brightens as you breathe in and dims as you breathe out. Slow breathing like this is a simple way to unwind.';
      panel.append(p);
    }
  }
  const seeTheme = (id) => { save.seen.themes[id] = 1; if (Object.keys(save.seen.themes).length >= 8) unlock('themes'); };
  function setCount(n) {
    while (lamps.length < n) { const prev = lamps[lamps.length - 1]; const keys = Object.keys(D.THEMES).filter((k) => k !== 'custom'); lamps.push(makeLamp({ shape: prev.shape, theme: keys[(keys.indexOf(prev.theme) + 3) % keys.length] || 'blue', finish: prev.finish, on: true, wax: 7 })); }
    while (lamps.length > n) lamps.pop();
    sel = Math.min(sel, n - 1);
    lamps.forEach((L) => { L.blobs = []; L.img = null; });
    layout(); syncSave(); paintControls();
    if (n === 3) unlock('trio');
  }
  function setRoom(id) {
    save.room = id; save.seen.rooms[id] = 1; if (D.ROOMS.every((r) => save.seen.rooms[r.id])) unlock('rooms');
    persist(); roomCache = null; layout(); paintControls();
    if (A) startSound();
  }
  function applyPreset(p) {
    lamps = p.lamps.map(([shape, theme, finish]) => makeLamp({ shape, theme, finish, on: true, wax: p.lamps.length > 1 ? 7 : 8 }));
    p.lamps.forEach(([s, t]) => { save.seen.shapes[s] = 1; seeTheme(t); });
    sel = 0; save.room = p.room; save.seen.rooms[p.room] = 1;
    if (D.ROOMS.every((r) => save.seen.rooms[r.id])) unlock('rooms');
    if (lamps.length === 3) unlock('trio');
    roomCache = null; layout(); syncSave(); paintControls();
    for (const L of lamps) for (let i = 0; i < 160; i++) physics(L, 1);
    if (A) startSound();
    Curio.toast(`${p.name}: ${p.blurb}`);
  }
  document.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => { tab = b.dataset.tab; paintControls(); }));

  const drawer = $('drawer'), drawerBody = $('drawerBody');
  function openDrawer(title, build) {
    $('drawerT').textContent = title; drawerBody.textContent = ''; build(drawerBody);
    drawer.hidden = false; requestAnimationFrame(() => drawer.classList.add('is-on'));
    drawer.querySelector('.ll-drawer__x').focus();
  }
  function closeDrawer() { drawer.classList.remove('is-on'); setTimeout(() => { drawer.hidden = true; }, 200); }
  drawer.addEventListener('click', (e) => { if (e.target === drawer) closeDrawer(); });
  drawer.querySelector('.ll-drawer__x').addEventListener('click', closeDrawer);
  function presetArt(p) {
    const c = document.createElement('canvas'); c.width = 120; c.height = 90; c.style.width = '60px'; c.style.height = '45px';
    const x = c.getContext('2d');
    x.fillStyle = '#1a1424'; x.fillRect(0, 0, 120, 90);
    p.lamps.forEach(([shape, theme, finish], i) => {
      const n = p.lamps.length, cx = 120 / n * (i + 0.5), S = D.SHAPES[shape], f = HW[shape], LH = 80, top = 6, gt = top + S.cap[0] * LH, gb = gt + S.glass * LH, t = D.THEMES[theme], st = D.FINISHES[finish].stops;
      const gl = t.wax ? t.glow : [255, 200, 255];
      const rg = x.createRadialGradient(cx, 45, 2, cx, 45, 50); rg.addColorStop(0, `rgba(${gl},.35)`); rg.addColorStop(1, `rgba(${gl},0)`); x.fillStyle = rg; x.fillRect(0, 0, 120, 90);
      x.fillStyle = st[2]; x.fillRect(cx - S.cap[1] * LH, top, S.cap[1] * LH * 2, gt - top);
      x.fillStyle = t.liquid[1]; x.beginPath(); for (let k = 0; k <= 16; k++) x.lineTo(cx - f(k / 16) * LH, gt + (gb - gt) * k / 16); for (let k = 16; k >= 0; k--) x.lineTo(cx + f(k / 16) * LH, gt + (gb - gt) * k / 16); x.fill();
      x.fillStyle = t.wax ? `rgb(${t.wax[0]})` : '#ff6fd8'; x.beginPath(); x.arc(cx - 2, gt + (gb - gt) * 0.35, 4, 0, TAU); x.arc(cx + 3, gt + (gb - gt) * 0.75, 6, 0, TAU); x.fill();
      x.fillStyle = st[2]; x.beginPath(); x.moveTo(cx - f(1) * LH, gb); x.lineTo(cx + f(1) * LH, gb); x.lineTo(cx + S.base[1] * LH, top + LH); x.lineTo(cx - S.base[1] * LH, top + LH); x.fill();
    });
    return c;
  }
  function openLibrary() {
    openDrawer('Lamp library', (box) => {
      const grid = document.createElement('div'); grid.className = 'll-presets';
      for (const p of D.PRESETS) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'll-preset';
        b.append(presetArt(p));
        const s = document.createElement('span'); s.innerHTML = '<b></b><small></small>'; s.querySelector('b').textContent = p.name; s.querySelector('small').textContent = `${p.blurb} · ${D.ROOMS.find((r) => r.id === p.room).name}`;
        b.append(s);
        b.addEventListener('click', () => { closeDrawer(); hideStart(); applyPreset(p); });
        grid.append(b);
      }
      box.append(grid);
    });
  }
  function openTrophies() {
    openDrawer('Trophies and stats', (box) => {
      const st = document.createElement('div'); st.className = 'll-stats';
      const m = save.stats.seconds / 60;
      const rows = [['Time relaxing', m < 60 ? `${Math.floor(m)} min` : `${Math.floor(m / 60)} h ${Math.floor(m % 60)} min`], ['Blobs warmed', Curio.fmt(save.stats.warmed)], ['Breaths', Curio.fmt(save.stats.breaths)], ['Colors tried', `${Object.keys(save.seen.themes).length} / ${Object.keys(D.THEMES).length}`], ['Shapes tried', `${Object.keys(save.seen.shapes).length} / ${Object.keys(D.SHAPES).length}`], ['Rooms visited', `${Object.keys(save.seen.rooms).length} / ${D.ROOMS.length}`]];
      for (const [k, v] of rows) { const d = document.createElement('div'); d.innerHTML = '<b></b><span></span>'; d.querySelector('b').textContent = v; d.querySelector('span').textContent = k; st.append(d); }
      box.append(st);
      const h = document.createElement('h3'); h.textContent = `Achievements ${Object.keys(save.ach).length} / ${D.ACH.length}`; box.append(h);
      const ag = document.createElement('div'); ag.className = 'll-ach';
      for (const a of D.ACH) { const d = document.createElement('div'); d.className = save.ach[a.id] ? 'on' : ''; d.innerHTML = '<i></i><b></b><small></small>'; d.querySelector('i').textContent = save.ach[a.id] ? a.icon : '🔒'; d.querySelector('b').textContent = a.name; d.querySelector('small').textContent = a.desc; ag.append(d); }
      box.append(ag);
      const f = document.createElement('h3'); f.textContent = 'Lava lamp facts'; box.append(f);
      const ul = document.createElement('ul'); ul.className = 'll-facts'; for (const x of D.FACTS) { const li = document.createElement('li'); li.textContent = x; ul.append(li); } box.append(ul);
    });
  }

  const ACH = Object.fromEntries(D.ACH.map((a) => [a.id, a]));
  function unlock(id) {
    if (save.ach[id] || !ACH[id]) return;
    save.ach[id] = Date.now(); persist();
    const a = ACH[id];
    const el = document.createElement('div'); el.className = 'll-badge';
    el.innerHTML = '<i></i><div><small>Achievement unlocked</small><b></b></div>';
    el.querySelector('i').textContent = a.icon; el.querySelector('b').textContent = a.name;
    document.body.append(el);
    requestAnimationFrame(() => el.classList.add('is-on'));
    setTimeout(() => { el.classList.remove('is-on'); setTimeout(() => el.remove(), 500); }, 3000);
    Curio.beep(784, 0.12, 'triangle', 0.06); setTimeout(() => Curio.beep(1175, 0.18, 'triangle', 0.06), 110);
  }

  let hideTimer = 0;
  function poke() { document.body.classList.remove('hide-cursor'); clearTimeout(hideTimer); hideTimer = setTimeout(() => document.body.classList.add('hide-cursor'), 2200); }
  function setAmbient(on) {
    document.body.classList.toggle('ambient', on);
    if (on) { poke(); document.documentElement.requestFullscreen?.().then(() => unlock('ambient')).catch(() => {}); }
    else { clearTimeout(hideTimer); document.body.classList.remove('hide-cursor'); if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {}); }
    roomCache = null;
    requestAnimationFrame(resize);
  }
  $('ambient').addEventListener('click', () => setAmbient(true));
  $('exit').addEventListener('click', () => setAmbient(false));
  $('libBtn').addEventListener('click', openLibrary);
  $('trophyBtn').addEventListener('click', openTrophies);
  $('shareBtn').addEventListener('click', async () => {
    const code = `l=${lamps.map((L) => `${L.shape}.${L.theme === 'custom' ? 'classic' : L.theme}.${L.finish}.${L.wax}`).join(',')}&r=${save.room}`;
    const url = `${location.origin}${location.pathname}#${code}`;
    try { await navigator.clipboard.writeText(url); Curio.toast('Link to this setup copied 📋'); unlock('share'); } catch { Curio.toast('Could not copy the link'); }
  });
  $('breathBtn').addEventListener('click', () => { setBreath(!breathOn); if (tab === 'breathe') paintControls(); });
  addEventListener('pointermove', () => { if (document.body.classList.contains('ambient')) poke(); });
  addEventListener('pointerdown', () => { if (document.body.classList.contains('ambient')) poke(); });
  addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input, select, textarea')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape') { if (!drawer.hidden) closeDrawer(); else if (document.body.classList.contains('ambient')) setAmbient(false); else if (!startEl.hidden) hideStart(); return; }
    if (Curio.simple && (e.key.toLowerCase() === 'l' || e.key.toLowerCase() === 'b')) return;
    if (!startEl.hidden || !drawer.hidden) return;
    const k = e.key.toLowerCase();
    if (k === 'f') setAmbient(!document.body.classList.contains('ambient'));
    else if (k === ' ') { e.preventDefault(); togglePower(selLamp()); }
    else if (k === 'b') $('breathBtn').click();
    else if (k === 'l') openLibrary();
    else if (/^[1-3]$/.test(k) && +k <= lamps.length) { sel = +k - 1; paintControls(); }
    else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const keys = Object.keys(D.THEMES); const L = selLamp(); L.theme = keys[(keys.indexOf(L.theme) + (e.key === 'ArrowRight' ? 1 : keys.length - 1)) % keys.length]; seeTheme(L.theme); syncSave(); paintControls(); }
    else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); speedEl.value = clamp(+speedEl.value + (e.key === 'ArrowUp' ? 8 : -8), 0, 100); speedEl.dispatchEvent(new Event('input')); }
  });
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && document.body.classList.contains('ambient')) setAmbient(false); });
  addEventListener('resize', resize);
  if (window.ResizeObserver) new ResizeObserver(() => { const r = stage.getBoundingClientRect(); if (Math.abs(r.width - W) > 1 || Math.abs(r.height - H) > 1) resize(); }).observe(stage);
  addEventListener('curio:theme', () => { dark = Curio.isDark(); roomCache = null; });
  const speedEl = $('speed');
  const readSpeed = () => { speed = 0.25 * Math.pow(16, speedEl.value / 100); };
  speedEl.value = save.speed;
  speedEl.addEventListener('input', () => { readSpeed(); save.speed = +speedEl.value; persist(); });
  readSpeed();

  const startEl = $('start');
  function paintStatLine() { const m = Math.floor(save.stats.seconds / 60); $('stLine').textContent = m ? `${m} minute${m === 1 ? '' : 's'} of relaxing so far · ${Object.keys(save.ach).length}/${D.ACH.length} trophies` : 'First visit? Pull up a beanbag.'; }
  function showStart() { $('stFact').textContent = Curio.pick(D.FACTS); paintStatLine(); startEl.hidden = false; requestAnimationFrame(() => startEl.classList.add('is-on')); $('goRelax').focus(); }
  function hideStart() { startEl.classList.remove('is-on'); setTimeout(() => { startEl.hidden = true; }, 300); if (save.sound.on && !A) startSound(); }
  $('goRelax').addEventListener('click', hideStart);
  $('goLib').addEventListener('click', openLibrary);
  $('goBreathe').addEventListener('click', () => { hideStart(); tab = 'breathe'; setBreath(true); paintControls(); });
  $('menuBtn').addEventListener('click', showStart);

  window.__lava = { get lamps() { return lamps; }, setRoom, setCount, applyPreset, setBreath, get save() { return save; }, setAmbient };

  dark = Curio.isDark();
  lamps = save.lamps.map((c) => makeLamp(c));
  lamps.forEach((L) => { save.seen.shapes[L.shape] = 1; seeTheme(L.theme); });
  save.seen.rooms[save.room] = 1;
  resize();
  for (const L of lamps) for (let i = 0; i < 200; i++) physics(L, 1);
  paintControls();
  const SIMPLE = Curio.simple;
  const QUICK = ['Classic 1965', 'Midnight study', 'Rainy Sunday', 'Space oddity', 'Mermaid lagoon', 'Bubblegum pop', 'Gold rush'];
  function paintQuick() {
    const box = $('quick'); box.textContent = '';
    for (const name of QUICK) {
      const p = D.PRESETS.find((x) => x.name === name); if (!p) continue;
      const th = D.THEMES[p.lamps[0][1]] || {};
      const b = document.createElement('button'); b.type = 'button'; b.className = 'll-q';
      b.title = `${p.name}: ${p.blurb}`; b.setAttribute('aria-label', p.name);
      const sw = document.createElement('i'); const w = th.wax ? `rgb(${th.wax[0].join(',')})` : '#ff7ad9', lq = th.liquid || ['#111', '#333', '#555'];
      sw.style.background = `radial-gradient(circle at 42% 64%, ${w} 0 26%, transparent 28%), radial-gradient(circle at 62% 34%, ${w} 0 16%, transparent 18%), linear-gradient(180deg, ${lq[0]}, ${lq[2]})`;
      const t = document.createElement('span'); t.textContent = p.name;
      b.append(sw, t);
      b.addEventListener('click', () => { applyPreset(p); if (navigator.vibrate) navigator.vibrate(8); box.querySelectorAll('.ll-q').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); });
      box.append(b);
    }
  }
  function surprise() {
    const themes = Object.keys(D.THEMES), shapes = Object.keys(D.SHAPES), fins = Object.keys(D.FINISHES);
    const n = Math.random() < 0.7 ? 1 : Curio.randInt(2, 3);
    const room = Curio.pick(D.ROOMS).id;
    applyPreset({ name: 'Surprise', blurb: `${n} lamp${n > 1 ? 's' : ''} in the ${D.ROOMS.find((r) => r.id === room).name.toLowerCase()}`, room, lamps: Array.from({ length: n }, () => [Curio.pick(shapes), Curio.pick(themes), Curio.pick(fins)]) });
    $('quick').querySelectorAll('.ll-q').forEach((x) => x.setAttribute('aria-pressed', 'false'));
    if (navigator.vibrate) navigator.vibrate([6, 40, 6]);
  }
  $('surprise').addEventListener('click', surprise);
  addEventListener('keydown', (e) => { if (SIMPLE && e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey && !(e.target.closest && e.target.closest('input'))) surprise(); });
  if (SIMPLE) { paintQuick(); startEl.hidden = true; } else showStart();
  start();
})();
