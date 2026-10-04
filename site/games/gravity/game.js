(() => {
  const D = window.GRAVITY_DATA;
  const TYPES = D.TYPES;
  const $ = (id) => document.getElementById(id);
  const TAU = Math.PI * 2;
  const G = 1, EPS2 = 4, DT = 0.25, SUB = 8, TRAIL = 160, FLING = 0.06, CFLING = 0.08, MAXDRAG = 230;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const hexRgb = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const smooth = (t) => t * t * (3 - 2 * t);

  const SAVE_KEY = 'gravity:v2';
  function loadSave() {
    const base = { v: 2, stats: { launched: 0, merges: 0, eaten: 0, starborn: 0, maxOrbits: 0, maxBodies: 0 }, presets: {}, ach: {}, levels: {}, daily: {}, settings: { trails: true, speed: 1, type: 'ocean', size: 1 } };
    const s = Curio.store.get(SAVE_KEY, null);
    if (!s || s.v !== 2 || typeof s !== 'object') return base;
    return { ...base, ...s, stats: { ...base.stats, ...(s.stats || {}) }, settings: { ...base.settings, ...(s.settings || {}) }, presets: s.presets || {}, ach: s.ach || {}, levels: s.levels || {}, daily: s.daily || {} };
  }
  const save = loadSave();
  if (!TYPES[save.settings.type]) save.settings.type = 'ocean';
  let saveT = 0;
  const persist = () => { clearTimeout(saveT); saveT = setTimeout(() => Curio.store.set(SAVE_KEY, save), 300); };

  function hash(i, j, s) {
    let h = Math.imul(i, 374761393) ^ Math.imul(j, 668265263) ^ Math.imul(s, 1442695041);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function vnoise(x, y, P, s) {
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
    const x0 = ((xi % P) + P) % P, x1 = (x0 + 1) % P;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = hash(x0, yi, s), b = hash(x1, yi, s), c = hash(x0, yi + 1, s), d = hash(x1, yi + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(u, v, P, s, oct = 4) {
    let sum = 0, amp = 0.5, f = 1, norm = 0;
    for (let k = 0; k < oct; k++) { sum += amp * vnoise(u * P * f, v * P * f * 0.5, P * f, s + k * 17); norm += amp; amp *= 0.5; f *= 2; }
    return sum / norm;
  }
  function rng(seed) {
    let s = (seed >>> 0) || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }
  function strSeed(str) { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

  function starPal(m) {
    if (m < 5000) return { core: [255, 226, 200], mid: [255, 138, 74], edge: [200, 64, 30], glow: '255,110,60' };
    if (m < 14000) return { core: [255, 251, 232], mid: [255, 211, 106], edge: [240, 138, 36], glow: '255,190,90' };
    if (m < 26000) return { core: [255, 255, 255], mid: [255, 241, 184], edge: [255, 191, 74], glow: '255,225,150' };
    return { core: [255, 255, 255], mid: [207, 227, 255], edge: [122, 168, 255], glow: '150,190,255' };
  }

  function buildTexture(b, S) {
    const TW = S * 2, TH = S, look = TYPES[b.t].look, seed = b.seed;
    const c = document.createElement('canvas'); c.width = Math.round(TW * 1.5); c.height = TH;
    const x = c.getContext('2d');
    const img = x.createImageData(TW, TH), d = img.data;
    const scheme = (look === 'gas' ? D.GAS_SCHEMES[seed % D.GAS_SCHEMES.length] : look === 'dwarf' ? ['#5a1e28', '#8c3232', '#3c141e', '#aa463c', '#6e2830', '#963c36'] : ['#000']).map(hexRgb);
    const bands = 8 + (seed % 6);
    const spot = { u: hash(seed, 1, 3), v: 0.55 + hash(seed, 2, 3) * 0.2, w: 0.07 + hash(seed, 3, 3) * 0.05 };
    const sp = look === 'star' ? starPal(b.m) : null;
    const icePale = seed % 3 === 0;
    for (let py = 0; py < TH; py++) {
      const v = (py + 0.5) / TH, lat = Math.abs(v - 0.5) * 2;
      for (let px = 0; px < TW; px++) {
        const u = (px + 0.5) / TW;
        let col;
        if (look === 'rock' || look === 'moon') {
          const n = fbm(u, v, 6, seed, 5);
          col = look === 'rock' ? mix([64, 56, 50], [156, 142, 126], n) : mix([92, 92, 98], [196, 196, 202], n);
          if (look === 'moon' && fbm(u, v, 3, seed + 5, 3) > 0.58) col = col.map((q) => q * 0.72);
          const sp2 = hash(px, py, seed) * 14 - 7; col = col.map((q) => q + sp2);
        } else if (look === 'desert') {
          const n = fbm(u, v, 6, seed, 5);
          col = n < 0.45 ? mix([92, 38, 22], [172, 80, 42], n / 0.45) : n < 0.7 ? mix([172, 80, 42], [216, 137, 82], (n - 0.45) / 0.25) : mix([216, 137, 82], [238, 186, 128], (n - 0.7) / 0.3);
          if (lat > 0.84 + 0.1 * (n - 0.5)) col = [242, 240, 244];
        } else if (look === 'ocean') {
          const h = fbm(u, v, 5, seed, 6);
          if (lat > 0.82 + 0.08 * (h - 0.5)) col = [236, 243, 250];
          else if (h > 0.53) {
            const t = (h - 0.53) / 0.47;
            col = t < 0.35 ? mix([58, 122, 56], [104, 132, 66], t / 0.35) : mix([104, 132, 66], [168, 142, 100], (t - 0.35) / 0.65);
            if (lat < 0.45 && fbm(u, v, 4, seed + 9, 3) > 0.58) col = mix(col, [212, 180, 118], 0.75);
          } else {
            const dep = clamp((0.53 - h) * 3.2, 0, 1);
            col = mix([46, 140, 206], [10, 40, 104], dep);
          }
        } else if (look === 'lava') {
          const n = fbm(u, v, 5, seed, 4), r = 1 - Math.abs(2 * fbm(u, v, 7, seed + 3, 4) - 1);
          col = mix([28, 15, 13], [74, 38, 28], n);
          if (r > 0.8) col = mix(col, mix([210, 60, 10], [255, 226, 100], clamp((r - 0.8) / 0.2, 0, 1)), clamp((r - 0.8) * 8, 0, 1));
        } else if (look === 'ice') {
          const n = fbm(u, v, 6, seed, 5), r = 1 - Math.abs(2 * fbm(u, v, 9, seed + 4, 3) - 1);
          col = mix([150, 190, 222], [236, 246, 252], n);
          if (r > 0.9) col = mix(col, [88, 136, 186], (r - 0.9) * 8);
        } else if (look === 'gas' || look === 'dwarf') {
          const turb = fbm(u, v, 8, seed, 4);
          const t = v + 0.05 * (turb - 0.5) + 0.012 * Math.sin(u * TAU * 4 + v * 30);
          const bf = t * bands, bi = Math.floor(bf), fr = smooth(bf - bi);
          col = mix(scheme[((bi % scheme.length) + scheme.length) % scheme.length], scheme[(((bi + 1) % scheme.length) + scheme.length) % scheme.length], fr);
          const fine = 0.9 + 0.2 * fbm(u, v, 24, seed + 2, 2);
          col = col.map((q) => q * fine);
          let du = Math.abs(u - spot.u); du = Math.min(du, 1 - du);
          const e = (du / spot.w) ** 2 + ((v - spot.v) / (spot.w * 0.9)) ** 2;
          if (e < 1 && look === 'gas') {
            const sw = 0.5 + 0.5 * Math.sin(Math.sqrt(e) * 16 + Math.atan2(v - spot.v, du) * 2);
            col = mix(col, mix([196, 92, 60], [232, 160, 120], sw), smooth(1 - e));
          }
        } else if (look === 'icegiant') {
          const n = fbm(u, v, 6, seed, 3);
          const base = icePale ? [168, 226, 232] : [80, 170, 222];
          const t = v + 0.03 * (n - 0.5);
          col = base.map((q) => q * (0.9 + 0.08 * Math.sin(t * 46) + 0.06 * (n - 0.5)));
        } else if (look === 'star') {
          const n = fbm(u, v, 14, seed, 4);
          col = mix(sp.edge, sp.core, 0.35 + n * 0.75);
          const spt = fbm(u, v, 5, seed + 7, 3);
          if (spt > 0.72 && lat < 0.6) col = mix(col, sp.edge.map((q) => q * 0.75), clamp((spt - 0.72) * 6, 0, 0.6));
        } else col = [128, 128, 128];
        const o = (py * TW + px) * 4;
        d[o] = clamp(col[0], 0, 255); d[o + 1] = clamp(col[1], 0, 255); d[o + 2] = clamp(col[2], 0, 255); d[o + 3] = 255;
      }
    }
    x.putImageData(img, 0, 0);
    if (look === 'moon' || look === 'rock' || look === 'ice') {
      const r = rng(seed * 7 + 1), n = look === 'rock' ? 10 : 18;
      for (let k = 0; k < n; k++) {
        const cu = r() * TW, cv = (0.12 + r() * 0.76) * TH, cr = (0.02 + r() * r() * 0.08) * TH;
        for (const off of [-TW, 0, TW]) {
          const g = x.createRadialGradient(cu + off - cr * 0.2, cv - cr * 0.2, cr * 0.1, cu + off, cv, cr);
          g.addColorStop(0, 'rgba(0,0,0,.28)'); g.addColorStop(0.75, 'rgba(0,0,0,.12)'); g.addColorStop(0.88, 'rgba(255,255,255,.22)'); g.addColorStop(1, 'rgba(255,255,255,0)');
          x.fillStyle = g; x.beginPath(); x.ellipse(cu + off, cv, cr * 2, cr, 0, 0, TAU); x.fill();
        }
      }
    }
    x.drawImage(c, 0, 0, TW / 2, TH, TW, 0, TW / 2, TH);
    let clouds = null;
    if (look === 'ocean' || (look === 'icegiant' && !icePale)) {
      clouds = document.createElement('canvas'); clouds.width = c.width; clouds.height = TH;
      const cx = clouds.getContext('2d'), ci = cx.createImageData(TW, TH), cd = ci.data;
      for (let py = 0; py < TH; py++) for (let px = 0; px < TW; px++) {
        const u = (px + 0.5) / TW, v = (py + 0.5) / TH;
        const n = fbm(u, v, look === 'ocean' ? 6 : 10, seed + 11, 5);
        const a = clamp((n - 0.52) * 3.2, 0, 1) * (look === 'ocean' ? 0.92 : 0.45);
        const o = (py * TW + px) * 4; cd[o] = 255; cd[o + 1] = 255; cd[o + 2] = 255; cd[o + 3] = a * 255;
      }
      cx.putImageData(ci, 0, 0); cx.drawImage(clouds, 0, 0, TW / 2, TH, TW, 0, TW / 2, TH);
    }
    return { S, canvas: c, clouds };
  }

  let texBudget = 0;
  function getTex(b, R) {
    const want = clamp(2 ** Math.ceil(Math.log2(Math.max(8, R * 2.2))), 16, 256);
    const key = b.t + (TYPES[b.t].look === 'star' ? starPal(b.m).glow : '');
    const ok = b.tex && b.tex.key === key;
    if (ok && b.tex.S >= want) return b.tex;
    const cost = want * want * 2;
    if (cost > texBudget) {
      if (ok) return b.tex;
      b.tex = buildTexture(b, 16); b.tex.key = key; return b.tex;
    }
    texBudget -= cost;
    b.tex = buildTexture(b, want); b.tex.key = key;
    return b.tex;
  }

  function drawSphere(c, img, sx, sy, R, spin) {
    const TW = img.width / 1.5, TH = img.height;
    const n = clamp(Math.round(R / 2.5), 6, 30);
    for (let i = 0; i < n; i++) {
      const xa = -1 + 2 * i / n, xb = -1 + 2 * (i + 1) / n;
      const la = Math.asin(xa), lb = Math.asin(xb);
      let ua = (spin + la / TAU + 0.25) % 1; if (ua < 0) ua += 1;
      const sw = (lb - la) / TAU * TW;
      c.drawImage(img, ua * TW, 0, Math.max(0.5, sw), TH, sx + xa * R, sy - R, (xb - xa) * R + 0.7, R * 2);
    }
  }

  function lumpyPath(c, b, sx, sy, R) {
    c.beginPath();
    for (let k = 0; k <= 14; k++) {
      const a = k / 14 * TAU + b.spin * TAU, rr = R * (0.78 + 0.22 * hash(b.seed, k % 14, 9));
      const px = sx + Math.cos(a) * rr, py = sy + Math.sin(a) * rr;
      k ? c.lineTo(px, py) : c.moveTo(px, py);
    }
    c.closePath();
  }

  function drawRings(c, b, sx, sy, R, front) {
    c.save(); c.translate(sx, sy); c.rotate(b.ringRot); c.scale(1, 0.34);
    const a0 = front ? 0 : Math.PI, a1 = front ? Math.PI : TAU;
    const bandsR = [[1.38, 0.10, 0.55], [1.52, 0.16, 0.8], [1.72, 0.12, 0.45], [1.9, 0.18, 0.75], [2.12, 0.08, 0.35]];
    for (const [k, w, a] of bandsR) {
      c.strokeStyle = `rgba(230,214,180,${a})`; c.lineWidth = R * w;
      c.beginPath(); c.arc(0, 0, R * k, a0, a1); c.stroke();
    }
    c.restore();
  }

  function drawStar(c, b, sx, sy, R, time) {
    const sp = starPal(b.m);
    const fl = 1 + 0.04 * Math.sin(time * 0.05 + b.seed) + 0.02 * Math.sin(time * 0.13 + b.seed * 3);
    c.save(); c.globalCompositeOperation = 'lighter';
    const gR = Math.min(R * 6 * fl, R + 260);
    const g = c.createRadialGradient(sx, sy, R * 0.6, sx, sy, gR);
    g.addColorStop(0, `rgba(${sp.glow},.55)`); g.addColorStop(0.25, `rgba(${sp.glow},.16)`); g.addColorStop(1, `rgba(${sp.glow},0)`);
    c.fillStyle = g; c.beginPath(); c.arc(sx, sy, gR, 0, TAU); c.fill();
    if (R > 5) {
      for (let k = 0; k < 4; k++) {
        const a = k * Math.PI / 4 + time * 0.0015 + b.seed, L = Math.min(R * (2.4 + 0.5 * Math.sin(time * 0.03 + k)) * fl, R + 90);
        const lg = c.createLinearGradient(sx - Math.cos(a) * L, sy - Math.sin(a) * L, sx + Math.cos(a) * L, sy + Math.sin(a) * L);
        lg.addColorStop(0, `rgba(${sp.glow},0)`); lg.addColorStop(0.5, `rgba(${sp.glow},.2)`); lg.addColorStop(1, `rgba(${sp.glow},0)`);
        c.strokeStyle = lg; c.lineWidth = Math.max(1, R * 0.08);
        c.beginPath(); c.moveTo(sx - Math.cos(a) * L, sy - Math.sin(a) * L); c.lineTo(sx + Math.cos(a) * L, sy + Math.sin(a) * L); c.stroke();
      }
    }
    c.restore();
    if (R < 3) { c.fillStyle = `rgb(${sp.core})`; c.beginPath(); c.arc(sx, sy, Math.max(1.5, R), 0, TAU); c.fill(); return; }
    c.save(); c.beginPath(); c.arc(sx, sy, R, 0, TAU); c.clip();
    drawSphere(c, getTex(b, R).canvas, sx, sy, R, b.spin);
    const lim = c.createRadialGradient(sx, sy, 0, sx, sy, R);
    lim.addColorStop(0, `rgba(${sp.core},.55)`); lim.addColorStop(0.55, `rgba(${sp.core},.12)`); lim.addColorStop(0.86, `rgba(${sp.edge},.25)`); lim.addColorStop(1, `rgba(${sp.edge},.85)`);
    c.fillStyle = lim; c.fillRect(sx - R, sy - R, R * 2, R * 2);
    c.restore();
  }

  function drawBH(c, b, sx, sy, R, time) {
    R = Math.max(R, 4);
    c.save(); c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(sx, sy, R, sx, sy, R * 7);
    g.addColorStop(0, 'rgba(255,150,70,.35)'); g.addColorStop(0.4, 'rgba(255,90,40,.08)'); g.addColorStop(1, 'rgba(255,80,40,0)');
    c.fillStyle = g; c.beginPath(); c.arc(sx, sy, R * 7, 0, TAU); c.fill();
    c.restore();
    const disk = (front) => {
      c.save(); c.translate(sx, sy); c.rotate(b.ringRot); c.scale(1, 0.3);
      c.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 6; k++) {
        const rr = R * (1.7 + k * 0.42);
        c.strokeStyle = `hsla(${28 + k * 5},100%,${72 - k * 6}%,${(front ? 0.75 : 0.45) * (1 - k * 0.12)})`;
        c.lineWidth = R * 0.34;
        c.setLineDash([R * (0.6 + k * 0.2), R * (0.35 + k * 0.1)]);
        c.lineDashOffset = -time * (2.4 - k * 0.3) * (R / 10);
        c.beginPath(); c.arc(0, 0, rr, front ? 0 : Math.PI, front ? Math.PI : TAU); c.stroke();
      }
      c.restore();
    };
    disk(false);
    c.save(); c.globalCompositeOperation = 'lighter';
    c.strokeStyle = 'rgba(255,190,120,.55)'; c.lineWidth = R * 0.28;
    c.beginPath(); c.ellipse(sx, sy, R * 1.55, R * 1.3, b.ringRot, Math.PI * 1.02, Math.PI * 1.98); c.stroke();
    c.restore();
    c.fillStyle = '#000'; c.beginPath(); c.arc(sx, sy, R * 1.05, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,236,200,.9)'; c.lineWidth = Math.max(1, R * 0.08);
    c.beginPath(); c.arc(sx, sy, R * 1.12, 0, TAU); c.stroke();
    disk(true);
  }

  function drawPlanet(c, b, sx, sy, R, lx, ly, time) {
    const T = TYPES[b.t];
    if (R < 2.4) {
      const tex = b.dot || (b.dot = dotColor(b));
      c.fillStyle = tex; c.beginPath(); c.arc(sx, sy, Math.max(1.4, R), 0, TAU); c.fill(); return;
    }
    if (T.atm) {
      const g = c.createRadialGradient(sx, sy, R * 0.9, sx, sy, R * 1.35);
      g.addColorStop(0, `rgba(${T.atm},.4)`); g.addColorStop(1, `rgba(${T.atm},0)`);
      c.fillStyle = g; c.beginPath(); c.arc(sx, sy, R * 1.35, 0, TAU); c.fill();
    }
    if (T.look === 'lava' || T.look === 'dwarf') {
      const g = c.createRadialGradient(sx, sy, R * 0.8, sx, sy, R * 2.2);
      g.addColorStop(0, 'rgba(255,90,30,.28)'); g.addColorStop(1, 'rgba(255,90,30,0)');
      c.fillStyle = g; c.beginPath(); c.arc(sx, sy, R * 2.2, 0, TAU); c.fill();
    }
    if (T.rings) drawRings(c, b, sx, sy, R, false);
    const tex = getTex(b, R);
    c.save();
    if (T.look === 'rock') lumpyPath(c, b, sx, sy, R); else { c.beginPath(); c.arc(sx, sy, R, 0, TAU); }
    c.clip();
    drawSphere(c, tex.canvas, sx, sy, R, b.spin);
    if (tex.clouds) drawSphere(c, tex.clouds, sx, sy, R, b.spin * 1.25 + 0.3);
    const self = T.look === 'lava' || T.look === 'dwarf';
    const g = c.createRadialGradient(sx + lx * R * 0.5, sy + ly * R * 0.5, R * 0.1, sx + lx * R * 0.3, sy + ly * R * 0.3, R * 1.75);
    g.addColorStop(0, 'rgba(255,255,255,.12)'); g.addColorStop(0.4, 'rgba(0,0,0,0)');
    g.addColorStop(0.6, `rgba(3,4,14,${self ? 0.35 : 0.6})`); g.addColorStop(0.8, `rgba(3,4,14,${self ? 0.55 : 0.92})`); g.addColorStop(1, `rgba(3,4,14,${self ? 0.6 : 0.97})`);
    c.fillStyle = g; c.fillRect(sx - R - 1, sy - R - 1, R * 2 + 2, R * 2 + 2);
    if (T.atm && R > 6) {
      c.strokeStyle = `rgba(${T.atm},.35)`; c.lineWidth = R * 0.1;
      c.beginPath(); c.arc(sx, sy, R * 0.97, Math.atan2(ly, lx) - 1.3, Math.atan2(ly, lx) + 1.3); c.stroke();
    }
    if (T.look === 'ocean' && R > 8) {
      const sg = c.createRadialGradient(sx + lx * R * 0.45, sy + ly * R * 0.45, 0, sx + lx * R * 0.45, sy + ly * R * 0.45, R * 0.35);
      sg.addColorStop(0, 'rgba(255,255,255,.28)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = sg; c.fillRect(sx - R, sy - R, R * 2, R * 2);
    }
    c.restore();
    if (T.rings) drawRings(c, b, sx, sy, R, true);
  }
  function dotColor(b) {
    const look = TYPES[b.t].look;
    return { rock: '#9b8e80', moon: '#c4c4ca', desert: '#d0773f', ocean: '#4a9be0', lava: '#ff7a33', ice: '#d8ecf8', gas: '#e2bf8f', icegiant: '#6fd0e8', dwarf: '#c0504a' }[look] || '#ccc';
  }

  function drawProbe(c, b, sx, sy, time) {
    const a = Math.atan2(b.vy, b.vx);
    c.save(); c.translate(sx, sy); c.rotate(a);
    c.globalCompositeOperation = 'lighter';
    const fl = 6 + Math.random() * 5;
    const g = c.createLinearGradient(-4, 0, -4 - fl, 0); g.addColorStop(0, 'rgba(255,200,90,.95)'); g.addColorStop(1, 'rgba(255,80,30,0)');
    c.fillStyle = g; c.beginPath(); c.moveTo(-3, -2.5); c.lineTo(-4 - fl, 0); c.lineTo(-3, 2.5); c.fill();
    c.globalCompositeOperation = 'source-over';
    c.fillStyle = '#eef2ff'; c.beginPath(); c.moveTo(7, 0); c.lineTo(-4, -4.5); c.lineTo(-2, 0); c.lineTo(-4, 4.5); c.closePath(); c.fill();
    c.fillStyle = '#ff5a36'; c.beginPath(); c.arc(1.5, 0, 1.6, 0, TAU); c.fill();
    c.restore();
  }

  const canvas = $('space'), ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1, baseScale = 1, bg = null, stars = [];
  const cam = { x: 0, y: 0, zoom: 1, tx: 0, ty: 0, tz: 1 };
  let shake = 0;
  const scale = () => baseScale * cam.zoom;
  const toWorld = (sx, sy) => [(sx - W / 2) / scale() + cam.x, (sy - H / 2) / scale() + cam.y];
  const toScreen = (x, y) => [W / 2 + (x - cam.x) * scale(), H / 2 + (y - cam.y) * scale()];

  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(2, devicePixelRatio || 1);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    fitBase();
    bg = document.createElement('canvas'); bg.width = canvas.width; bg.height = canvas.height;
    const b = bg.getContext('2d'); b.setTransform(dpr, 0, 0, dpr, 0, 0);
    const gr = b.createRadialGradient(W * 0.5, H * 0.45, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.8);
    gr.addColorStop(0, '#101634'); gr.addColorStop(0.6, '#070a1c'); gr.addColorStop(1, '#03040b');
    b.fillStyle = gr; b.fillRect(0, 0, W, H);
    const r2 = rng(1234);
    const neb = [[280, 70, 200], [200, 60, 180], [320, 60, 150], [180, 70, 220]];
    for (let k = 0; k < 7; k++) {
      const [h, s, l] = neb[k % neb.length], x = r2() * W, y = r2() * H, rr = (0.2 + r2() * 0.35) * Math.max(W, H);
      const g = b.createRadialGradient(x, y, 0, x, y, rr);
      g.addColorStop(0, `hsla(${h},${s}%,45%,.10)`); g.addColorStop(0.5, `hsla(${h + 20},${s}%,35%,.04)`); g.addColorStop(1, 'hsla(0,0%,0%,0)');
      b.fillStyle = g; b.fillRect(0, 0, W, H);
    }
    for (let i = 0; i < W * H / 9000; i++) {
      const x = r2() * W, y = r2() * H, rr = r2() * 0.8 + 0.2;
      b.fillStyle = `rgba(255,255,255,${r2() * 0.35})`; b.fillRect(x, y, rr, rr);
    }
    stars = Array.from({ length: Math.round(W * H / 2400) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.3 + 0.3, a: Math.random() * 0.7 + 0.2, tw: Math.random() * 6.28, d: Math.random() < 0.7 ? 0.02 : 0.06, c: Curio.pick(['#ffffff', '#ffffff', '#cfe0ff', '#ffe8c8']) }));
  }
  function fitBase() {
    const view = mode === 'sandbox' ? 430 : (level ? level.view : 400);
    const hAvail = H - (W < 600 ? 150 : 110);
    const avail = Math.max(Math.min(W, hAvail), Math.min(W * 1.3, hAvail));
    baseScale = Math.max(0.2, avail / (view * 2));
  }

  let bodies = [], dust = [], sparks = [], waves = [], merges = 0, nextId = 1;
  let paused = false, trails = save.settings.trails, speed = save.settings.speed;
  let mode = 'sandbox', level = null, levelIdx = -1, isDaily = false;
  let selected = null, follow = null, tool = 'fling';
  let time = 0;

  const radiusOf = (t, m) => TYPES[t].dens * Math.cbrt(m);
  function nameFor(t, r) {
    const S = D.SYL;
    if (t === 'blackhole') return `${S.bh[(r() * S.bh.length) | 0]}-${1 + ((r() * 98) | 0)}`;
    if (t === 'star' || t === 'giant') return `${S.star[(r() * S.star.length) | 0]}-${10 + ((r() * 980) | 0)}`;
    if (t === 'asteroid') return `Rock ${100 + ((r() * 899) | 0)}`;
    return S.a[(r() * S.a.length) | 0] + S.b[(r() * S.b.length) | 0] + S.c[(r() * S.c.length) | 0];
  }
  function mkBody(t, x, y, vx, vy, m, extra = {}) {
    const seed = extra.seed ?? ((Math.random() * 1e9) | 0);
    const r = rng(seed + 99);
    const b = { id: nextId++, t, x, y, vx, vy, ax: 0, ay: 0, m, r: radiusOf(t, m), seed, name: extra.name || nameFor(t, r), tr: new Float32Array(TRAIL * 2), ti: 0, tn: 0, flash: 0, spin: r(), spinV: (0.0006 + r() * 0.0018) * (r() < 0.15 ? -1 : 1), ringRot: (r() - 0.5) * 0.7, tex: null, mine: !!extra.mine, prim: null, ang: 0, orbits: 0, probe: !!extra.probe, born: time };
    return b;
  }
  function updateType(b, byMerge) {
    if (b.t === 'blackhole' || b.probe) { b.r = radiusOf(b.t, b.m); return; }
    if (b.rk) { b.r = b.rk * Math.cbrt(b.m); return; }
    let nt = b.t;
    if (b.m >= 25000 && TYPES[b.t].look !== 'star') nt = 'giant';
    else if (b.m >= 2500 && TYPES[b.t].look !== 'star') nt = 'star';
    else if (b.m >= 800 && b.m < 2500 && !['star', 'giant', 'dwarf'].includes(b.t)) nt = 'dwarf';
    if (nt !== b.t) {
      b.t = nt; b.tex = null; b.dot = null;
      if (byMerge && !dry && (nt === 'star' || nt === 'giant')) { save.stats.starborn++; unlock('starborn'); feed(`✨ ${b.name} ignited into a star!`); persist(); }
    }
    b.r = radiusOf(b.t, b.m);
  }

  const vcirc = (M, r) => Math.sqrt(G * M * r * r / Math.pow(r * r + EPS2, 1.5));
  function accel(list) {
    for (const b of list) { b.ax = 0; b.ay = 0; }
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      for (let j = i + 1; j < list.length; j++) {
        const b = list[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d2 = dx * dx + dy * dy + EPS2;
        const inv = G / (d2 * Math.sqrt(d2));
        a.ax += dx * inv * b.m; a.ay += dy * inv * b.m;
        b.ax -= dx * inv * a.m; b.ay -= dy * inv * a.m;
      }
    }
  }
  function leapfrog(list, dt) {
    for (const b of list) { b.vx += b.ax * dt * 0.5; b.vy += b.ay * dt * 0.5; b.x += b.vx * dt; b.y += b.vy * dt; }
    accel(list);
    for (const b of list) { b.vx += b.ax * dt * 0.5; b.vy += b.ay * dt * 0.5; }
  }
  function dustStep(dt) {
    const heavy = bodies.filter((b) => b.m > 5);
    const n = heavy.length;
    if (!n) { for (const p of dust) { p.x += p.vx * dt; p.y += p.vy * dt; } return; }
    const hx = heavy.map((b) => b.x), hy = heavy.map((b) => b.y), hm = heavy.map((b) => b.m), hr = heavy.map((b) => (b.t === 'blackhole' ? b.r * 2.2 : b.r));
    for (const p of dust) {
      if (p.dead) continue;
      let ax = 0, ay = 0;
      for (let k = 0; k < n; k++) {
        const dx = hx[k] - p.x, dy = hy[k] - p.y, d2 = dx * dx + dy * dy;
        if (d2 < hr[k] * hr[k]) { p.dead = true; if (heavy[k].t === 'blackhole') heavy[k].flash = Math.min(1, heavy[k].flash + 0.05); break; }
        const e = d2 + EPS2, inv = G * hm[k] / (e * Math.sqrt(e));
        ax += dx * inv; ay += dy * inv;
      }
      p.vx += ax * dt; p.vy += ay * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      p.heat = Math.min(1, Math.hypot(p.vx, p.vy) / 22);
    }
  }

  function collide() {
    let hit = false;
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const a = bodies[i], b = bodies[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const bh = a.t === 'blackhole' ? a : b.t === 'blackhole' ? b : null;
        const rr = bh ? bh.r * 2 + (bh === a ? b : a).r * 0.5 : (a.r + b.r) * 0.85;
        if (dx * dx + dy * dy >= rr * rr) continue;
        if (a.probe || b.probe) {
          const pr = a.probe ? a : b, other = pr === a ? b : a;
          probeHit(pr, other);
          return true;
        }
        let big = a.m >= b.m ? a : b, small = big === a ? b : a;
        if (bh && small === bh) { big = bh; small = bh === a ? b : a; }
        const m = a.m + b.m;
        big.x = (a.x * a.m + b.x * b.m) / m; big.y = (a.y * a.m + b.y * b.m) / m;
        big.vx = (a.vx * a.m + b.vx * b.m) / m; big.vy = (a.vy * a.m + b.vy * b.m) / m;
        big.m = m; big.flash = 1;
        updateType(big, true);
        onMerge(big, small, !!bh);
        bodies.splice(bodies.indexOf(small), 1);
        if (selected === small) selectBody(null);
        if (follow === small) follow = big;
        hit = true; i = -1;
        break;
      }
    }
    if (hit) accel(bodies);
    return hit;
  }

  function onMerge(big, small, intoBH) {
    merges++;
    if (dry) return;
    if (mode === 'sandbox') { save.stats.merges++; unlock('merge'); if (save.stats.merges >= 25) unlock('merge25'); }
    const ratio = small.m / big.m;
    if (intoBH) {
      for (let k = 0; k < 36; k++) { const a = Math.random() * TAU, rr = small.r + Math.random() * 10; sparks.push({ x: small.x + Math.cos(a) * rr, y: small.y + Math.sin(a) * rr, vx: -Math.sin(a) * 2, vy: Math.cos(a) * 2, life: 1, hue: 30, pull: big }); }
      gulp();
      if (mode === 'sandbox') { save.stats.eaten++; unlock('eaten'); if (save.stats.eaten >= 50) unlock('eaten50'); }
      feed(`🕳️ ${small.name} fell into ${big.name}. Gone.`);
      shake = Math.max(shake, 6);
    } else {
      const n = Math.min(40, 8 + small.m / 8);
      const hue = TYPES[small.t].look === 'star' ? 40 : [20, 200, 30, 120, 260][small.seed % 5];
      for (let k = 0; k < n; k++) { const a = Math.random() * TAU, v = Math.random() * 3 + 0.6; sparks.push({ x: small.x, y: small.y, vx: Math.cos(a) * v + small.vx * 0.2, vy: Math.sin(a) * v + small.vy * 0.2, life: 1, hue }); }
      waves.push({ x: (big.x + small.x) / 2, y: (big.y + small.y) / 2, r: small.r, max: small.r * 6 + 30, life: 1, hot: TYPES[big.t].look === 'star' });
      thud(small.m);
      shake = Math.max(shake, Math.min(14, 2 + ratio * 40));
      const lk = TYPES[big.t].look;
      feed(lk === 'star' ? `🔥 ${small.name} was vaporized by ${big.name}` : `💥 ${small.name} smashed into ${big.name}`);
      if (navigator.vibrate && ratio > 0.05) navigator.vibrate(Math.min(60, 10 + ratio * 200));
    }
    persist();
  }

  let master = null, noiseBuf = null;
  function audio() {
    if (Curio.muted) return null;
    const ac = Curio.audioContext(); if (!ac) return null;
    if (!master) {
      master = ac.createDynamicsCompressor(); master.threshold.value = -16; master.connect(ac.destination);
      noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return ac;
  }
  function tone(f, dur, type = 'sine', vol = 0.1, f2 = 0, delay = 0) {
    const ac = audio(); if (!ac) return;
    const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.05);
  }
  function hiss(dur, freq, vol, sweep, type = 'bandpass') {
    const ac = audio(); if (!ac) return;
    const t = ac.currentTime, s = ac.createBufferSource(); s.buffer = noiseBuf;
    const f = ac.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, t + dur); f.Q.value = 1.2;
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(master); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }
  function thud(m) { tone(Math.max(45, 170 - Math.log10(m + 1) * 40), 0.45, 'sine', 0.3, 32); hiss(0.35, 600, 0.12, 120, 'lowpass'); }
  function gulp() { tone(220, 0.8, 'sine', 0.22, 30); hiss(0.9, 1200, 0.08, 80, 'lowpass'); }
  function whoosh(v) { hiss(0.35, 500, 0.06 + Math.min(0.1, v * 0.006), 2400); }
  function chime(notes = [523, 659, 784, 1047]) { notes.forEach((f, i) => tone(f, 0.35, 'triangle', 0.09, 0, i * 0.09)); }

  const feedEl = $('feed');
  function feed(text) {
    const li = document.createElement('li'); li.textContent = text;
    feedEl.prepend(li);
    while (feedEl.children.length > 4) feedEl.lastChild.remove();
    setTimeout(() => li.classList.add('is-old'), 3600);
    setTimeout(() => li.remove(), 4400);
  }

  function addOrbiter(center, t, r, m, ang, dir = 1, extra) {
    const v = vcirc(center.m, r);
    const b = mkBody(t, center.x + Math.cos(ang) * r, center.y + Math.sin(ang) * r, center.vx - Math.sin(ang) * v * dir, center.vy + Math.cos(ang) * v * dir, m, extra);
    bodies.push(b); return b;
  }
  function zeroMomentum() {
    let px = 0, py = 0, m = 0, cx = 0, cy = 0;
    for (const b of bodies) { px += b.vx * b.m; py += b.vy * b.m; m += b.m; cx += b.x * b.m; cy += b.y * b.m; }
    if (!m) return;
    for (const b of bodies) { b.vx -= px / m; b.vy -= py / m; b.x -= cx / m; b.y -= cy / m; }
  }
  function diskDust(center, n, r0, r1, hue, dir = 1, thick = 0) {
    for (let k = 0; k < n; k++) {
      const a = Math.random() * TAU, r = r0 + (r1 - r0) * Math.sqrt(Math.random()), v = vcirc(center.m, r) * (1 + (Math.random() - 0.5) * thick);
      dust.push({ x: center.x + Math.cos(a) * r, y: center.y + Math.sin(a) * r, vx: center.vx - Math.sin(a) * v * dir, vy: center.vy + Math.cos(a) * v * dir, hue: typeof hue === 'function' ? hue(r) : hue, heat: 0 });
    }
  }
  function clearWorld() { bodies = []; dust = []; sparks = []; waves = []; merges = 0; selectBody(null); follow = null; }

  const PRESETS = {
    solar() {
      const sun = mkBody('star', 0, 0, 0, 0, 20000, { name: 'Sol' }); bodies.push(sun);
      addOrbiter(sun, 'lava', 62, 3, 0.3, 1, { name: 'Ember' });
      addOrbiter(sun, 'rocky', 100, 6, 2.1, 1, { name: 'Dune' });
      const earth = addOrbiter(sun, 'ocean', 150, 40, 4.2, 1, { name: 'Azur' });
      addOrbiter(earth, 'moon', 11, 0.4, 0, 1, { name: 'Pale' });
      addOrbiter(sun, 'rocky', 215, 8, 1.1, 1, { name: 'Rust' });
      const jup = addOrbiter(sun, 'gas', 310, 160, 5.3, 1, { name: 'Titanor' });
      addOrbiter(jup, 'moon', 24, 0.5, 1, 1);
      addOrbiter(sun, 'ringed', 410, 110, 3.0, 1, { name: 'Halo' });
      zeroMomentum();
      return 'A sun, six planets and two moons. Fling in your own.';
    },
    earthmoon() {
      const e = mkBody('ocean', 0, 0, 0, 0, 3000, { name: 'Terra' }); e.r = 1.6 * Math.cbrt(3000) * 1.4; e.rk = e.r / Math.cbrt(e.m);
      bodies.push(e);
      addOrbiter(e, 'moon', 170, 37, 0.8, 1, { name: 'Luna' });
      diskDust(e, 160, 60, 90, 200);
      zeroMomentum();
      return 'A heavy blue world with a big moon and a ring of satellites. Try launching your own moon.';
    },
    jupiter() {
      const j = mkBody('gas', 0, 0, 0, 0, 2200, { name: 'Jove', seed: 4 }); j.r = 30; j.rk = j.r / Math.cbrt(j.m); bodies.push(j);
      const ms = [['lava', 'Io', 70], ['ice', 'Europa', 110], ['moon', 'Ganymede', 170], ['moon', 'Callisto', 260]];
      ms.forEach(([t, n, r], i) => addOrbiter(j, t, r, 4 + i, i * 1.7, 1, { name: n }));
      zeroMomentum();
      return 'A giant with four big moons, like Jupiter\'s Io, Europa, Ganymede and Callisto.';
    },
    saturn() {
      const s = mkBody('ringed', 0, 0, 0, 0, 1800, { name: 'Saturnia', seed: 1 }); s.r = 26; s.rk = s.r / Math.cbrt(s.m); bodies.push(s);
      diskDust(s, 1000, 60, 150, (r) => (r < 95 ? 40 : r < 105 ? 30 : 45));
      addOrbiter(s, 'ice', 205, 2, 1, 1, { name: 'Shepherd' });
      addOrbiter(s, 'moon', 290, 3, 3.5, 1, { name: 'Titanis' });
      return 'A ring world: a thousand icy bits in a disk. Throw a moon through it!';
    },
    binary() {
      const m = 9000, d = 140, v = Math.sqrt(G * m * (d / 2)) / d;
      bodies.push(mkBody('star', -d / 2, 0, 0, -v, m), mkBody('star', d / 2, 0, 0, v, m));
      const both = { x: 0, y: 0, vx: 0, vy: 0, m: 2 * m };
      addOrbiter(both, 'ocean', 290, 15, 0.7);
      addOrbiter(both, 'ringed', 390, 60, 3.5);
      addOrbiter(both, 'ice', 470, 6, 5);
      return 'Two suns dancing. Planets out here orbit both, like Tatooine.';
    },
    eight() { eightBodies(bodies); return 'Three equal stars chasing each other along one figure-eight. Nudge it and watch it fall apart.'; },
    pythag() {
      const L = 70;
      [[3, 1, 3], [4, -2, -1], [5, 1, -1]].forEach(([m, x, y]) => bodies.push(mkBody('star', x * L, y * L, 0, 0, m * 1200)));
      zeroMomentum();
      return 'Masses 3, 4 and 5 at the corners of a 3-4-5 triangle, starting at rest. Famously chaotic.';
    },
    trojans() {
      const sun = mkBody('star', 0, 0, 0, 0, 20000, { name: 'Sol' }); bodies.push(sun);
      const R = 280, a0 = 0.4, jup = addOrbiter(sun, 'gas', R, 400, a0, 1, { name: 'Jove' });
      for (const off of [Math.PI / 3, -Math.PI / 3]) {
        for (let k = 0; k < 140; k++) {
          const a = a0 + off + (Math.random() - 0.5) * 0.35, r = R * (1 + (Math.random() - 0.5) * 0.07), v = vcirc(20400, r);
          dust.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, vx: -Math.sin(a) * v, vy: Math.cos(a) * v, hue: 30, heat: 0 });
        }
      }
      void jup;
      return 'Two swarms of asteroids share the giant\'s orbit, 60 degrees ahead and behind: the Lagrange points L4 and L5.';
    },
    belt() {
      const sun = mkBody('star', 0, 0, 0, 0, 18000, { name: 'Sol' }); bodies.push(sun);
      addOrbiter(sun, 'rocky', 120, 8, 1);
      addOrbiter(sun, 'ocean', 170, 30, 3);
      diskDust(sun, 700, 230, 290, 30, 1, 0.04);
      addOrbiter(sun, 'gas', 380, 240, 4.5);
      for (let k = 0; k < 6; k++) addOrbiter(sun, 'asteroid', Curio.rand(235, 285), Curio.rand(0.3, 1.2), Math.random() * TAU);
      zeroMomentum();
      return 'An asteroid belt between the rocky worlds and the giant.';
    },
    comet() {
      const sun = mkBody('star', 0, 0, 0, 0, 20000, { name: 'Sol' }); bodies.push(sun);
      addOrbiter(sun, 'ocean', 140, 30, 2);
      addOrbiter(sun, 'gas', 300, 200, 4);
      const c = mkBody('ice', 460, 0, 0, 2.2, 0.8, { name: 'Halley-ish' }); c.comet = true; bodies.push(c);
      zeroMomentum();
      return 'An icy comet on a long, skinny orbit. It speeds up as it dives toward the sun.';
    },
    blackhole() {
      const bh = mkBody('blackhole', 0, 0, 0, 0, 25000, { name: 'Abyss-1' }); bodies.push(bh);
      diskDust(bh, 1100, 50, 260, (r) => 10 + r / 8);
      addOrbiter(bh, 'star', 330, 1500, 1.2);
      addOrbiter(bh, 'star', 420, 2000, 4.1);
      zeroMomentum();
      return 'A black hole with a glowing disk. Watch the inner dust speed up and vanish.';
    },
    galaxies() {
      const a = mkBody('blackhole', -260, -60, 1.6, 0.5, 9000, { name: 'Core A' }), b = mkBody('blackhole', 260, 60, -1.6, -0.5, 9000, { name: 'Core B' });
      bodies.push(a, b);
      diskDust(a, 650, 25, 150, (r) => 200 + r / 3);
      diskDust(b, 650, 25, 150, (r) => 300 + r / 4, -1);
      return 'Two spiral galaxies on a collision course. Watch the tidal tails.';
    },
    chaos() {
      for (let k = 0; k < 3; k++) {
        const a = k / 3 * TAU + Math.random(), r = Curio.rand(60, 160);
        bodies.push(mkBody('star', Math.cos(a) * r, Math.sin(a) * r, -Math.sin(a) * 4 + Curio.rand(-1, 1), Math.cos(a) * 4 + Curio.rand(-1, 1), Curio.rand(3000, 7000)));
      }
      const ts = ['asteroid', 'moon', 'rocky', 'ocean', 'lava', 'ice'];
      for (let k = 0; k < 36; k++) {
        const a = Math.random() * TAU, r = Curio.rand(180, 420), v = vcirc(15000, r) * Curio.rand(0.6, 1.2);
        bodies.push(mkBody(Curio.pick(ts), Math.cos(a) * r, Math.sin(a) * r, -Math.sin(a) * v, Math.cos(a) * v, Curio.rand(1, 30)));
      }
      zeroMomentum();
      return 'Three stars and a swarm of rocks. Nobody is safe.';
    },
    empty() { bodies.push(mkBody('star', 0, 0, 0, 0, 20000, { name: 'Sol' })); return 'Just you and the sun. Make something.'; }
  };
  function eightBodies(list) {
    const L = 170, m = 4000, vs = Math.sqrt(G * m / L);
    const p = [0.97000436, -0.24308753], v3 = [-0.93240737, -0.86473146];
    list.push(mkBody('star', p[0] * L, p[1] * L, -v3[0] / 2 * vs, -v3[1] / 2 * vs, m, { seed: 11 }));
    list.push(mkBody('star', -p[0] * L, -p[1] * L, -v3[0] / 2 * vs, -v3[1] / 2 * vs, m, { seed: 12 }));
    list.push(mkBody('star', 0, 0, v3[0] * vs, v3[1] * vs, m, { seed: 13 }));
  }

  let preset = null;
  function loadPreset(id, quiet) {
    if (!PRESETS[id]) return;
    clearWorld();
    preset = id;
    const msg = PRESETS[id]();
    accel(bodies);
    cam.tx = 0; cam.ty = 0; cam.tz = { blackhole: 1.7, saturn: 1.9, earthmoon: 1.3, jupiter: 1.25, galaxies: 0.85, trojans: 1.1, eight: 1.2, pythag: 1.1 }[id] || 1;
    if (!quiet) { Curio.toast(msg, 3200); if (mode === 'sandbox') { save.presets[id] = 1; if (Object.keys(save.presets).length >= 8) unlock('presets'); persist(); } }
    paintPresetLbl();
  }

  function primaryOf(b) {
    let best = null, bv = 0;
    for (const o of bodies) {
      if (o === b || o.m <= b.m * 2) continue;
      const d2 = (o.x - b.x) ** 2 + (o.y - b.y) ** 2 + EPS2, f = o.m / d2;
      if (f > bv) { bv = f; best = o; }
    }
    return best;
  }
  function trackOrbits() {
    if (time % 4) return;
    for (const b of bodies) {
      const p = primaryOf(b);
      if (p !== b.prim) { b.prim = p; b.ang = 0; b.orbits = 0; b.la = p ? Math.atan2(b.y - p.y, b.x - p.x) : 0; continue; }
      if (!p) continue;
      const a = Math.atan2(b.y - p.y, b.x - p.x);
      let da = a - b.la; if (da > Math.PI) da -= TAU; if (da < -Math.PI) da += TAU;
      b.la = a; b.ang += da;
      const o = Math.floor(Math.abs(b.ang) / TAU);
      if (o > b.orbits) {
        b.orbits = o;
        if (b.mine && mode === 'sandbox') {
          if (o > save.stats.maxOrbits) { save.stats.maxOrbits = o; persist(); }
          if (o >= 10) unlock('orbit10');
          if (o === 1 || o === 5 || o === 10) feed(`🔁 ${b.name} completed ${o} orbit${o > 1 ? 's' : ''} of ${p.name}`);
        }
      }
    }
  }

  function simulate() {
    const steps = SUB;
    const reps = speed >= 1 ? speed : 1;
    const dt = (DT * (speed < 1 ? speed : 1)) / steps;
    for (let r = 0; r < reps; r++) {
      for (let k = 0; k < steps; k++) {
        leapfrog(bodies, dt);
        if (dust.length) dustStep(dt);
        collide();
        if (mode !== 'sandbox') challengeStep();
        if (mode !== 'sandbox' && shot.state !== 'flying') break;
      }
      if (mode !== 'sandbox' && shot.state !== 'flying') break;
    }
    for (const b of bodies) {
      if (trails || b.probe) { b.tr[b.ti * 2] = b.x; b.tr[b.ti * 2 + 1] = b.y; b.ti = (b.ti + 1) % TRAIL; if (b.tn < TRAIL) b.tn++; }
      if (b.flash > 0) b.flash = Math.max(0, b.flash - 0.03);
      b.spin = (b.spin + b.spinV * Math.max(1, speed)) % 1;
    }
    if (mode === 'sandbox') {
      const before = bodies.length;
      bodies = bodies.filter((b) => Math.abs(b.x) < 9000 && Math.abs(b.y) < 9000);
      if (bodies.length !== before) { accel(bodies); if (selected && !bodies.includes(selected)) selectBody(null); }
      trackOrbits();
      if (bodies.length > save.stats.maxBodies) { save.stats.maxBodies = bodies.length; if (bodies.length >= 60) unlock('crowd'); }
    }
    if (time % 30 === 0) dust = dust.filter((p) => !p.dead && Math.abs(p.x) < 6000 && Math.abs(p.y) < 6000);
    for (const s of sparks) {
      if (s.pull && bodies.includes(s.pull)) { const dx = s.pull.x - s.x, dy = s.pull.y - s.y, d = Math.hypot(dx, dy) + 1; s.vx += dx / d * 0.5 - dy / d * 0.3; s.vy += dy / d * 0.5 + dx / d * 0.3; }
      s.x += s.vx; s.y += s.vy; s.vx *= 0.96; s.vy *= 0.96; s.life -= 0.018;
    }
    sparks = sparks.filter((s) => s.life > 0);
    for (const w of waves) { w.r += (w.max - w.r) * 0.08 + 0.5; w.life -= 0.025; }
    waves = waves.filter((w) => w.life > 0);
  }

  function lightFor(b) {
    let best = null, bv = 0;
    for (const o of bodies) {
      if (o === b || TYPES[o.t].look !== 'star') continue;
      const f = o.m / ((o.x - b.x) ** 2 + (o.y - b.y) ** 2 + 1);
      if (f > bv) { bv = f; best = o; }
    }
    if (!best) return [-0.6, -0.8];
    const dx = best.x - b.x, dy = best.y - b.y, d = Math.hypot(dx, dy) || 1;
    return [dx / d, dy / d];
  }

  let shooting = null;
  function render() {
    texBudget = 140000;
    const sc = scale();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(bg, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let ox = 0, oy = 0;
    if (shake > 0.2) { ox = (Math.random() - 0.5) * shake; oy = (Math.random() - 0.5) * shake; shake *= 0.88; } else shake = 0;
    for (const s of stars) {
      const x = ((s.x - cam.x * sc * s.d) % W + W) % W, y = ((s.y - cam.y * sc * s.d) % H + H) % H;
      ctx.globalAlpha = s.a * (0.7 + 0.3 * Math.sin(time * 0.03 + s.tw)); ctx.fillStyle = s.c; ctx.fillRect(x, y, s.r, s.r);
    }
    ctx.globalAlpha = 1;
    if (!shooting && Math.random() < 0.003) shooting = { x: Math.random() * W, y: Math.random() * H * 0.5, vx: 6 + Math.random() * 6, vy: 2 + Math.random() * 3, life: 1 };
    if (shooting) {
      const s = shooting, g = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 10, s.y - s.vy * 10);
      g.addColorStop(0, `rgba(255,255,255,${s.life})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = g; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * 10, s.y - s.vy * 10); ctx.stroke();
      s.x += s.vx; s.y += s.vy; s.life -= 0.025; if (s.life <= 0) shooting = null;
    }
    ctx.translate(ox, oy);
    if (mode !== 'sandbox') drawChallengeBack(sc);
    if (trails) {
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const b of bodies) drawTrail(b, sc);
    } else for (const b of bodies) if (b.probe) drawTrail(b, sc);
    if (dust.length) {
      ctx.globalCompositeOperation = 'lighter';
      const ds = Math.max(1.3, Math.min(2.8, sc * 2));
      for (const p of dust) {
        if (p.dead) continue;
        const sx = W / 2 + (p.x - cam.x) * sc, sy = H / 2 + (p.y - cam.y) * sc;
        if (sx < -4 || sy < -4 || sx > W + 4 || sy > H + 4) continue;
        ctx.fillStyle = `hsla(${p.hue},${95 - p.heat * 30}%,${55 + p.heat * 35}%,${0.5 + p.heat * 0.5})`;
        ctx.fillRect(sx - ds / 2, sy - ds / 2, ds, ds);
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    for (const w of waves) {
      const [sx, sy] = toScreen(w.x, w.y);
      ctx.strokeStyle = w.hot ? `rgba(255,200,120,${w.life * 0.7})` : `rgba(200,225,255,${w.life * 0.6})`;
      ctx.lineWidth = 2 + w.life * 4; ctx.beginPath(); ctx.arc(sx, sy, w.r * sc, 0, TAU); ctx.stroke();
    }
    ctx.globalCompositeOperation = 'lighter';
    for (const s of sparks) { const [sx, sy] = toScreen(s.x, s.y); ctx.fillStyle = `hsla(${s.hue},100%,${60 + s.life * 25}%,${s.life})`; ctx.fillRect(sx - 1.2, sy - 1.2, 2.6, 2.6); }
    ctx.globalCompositeOperation = 'source-over';
    const order = bodies.slice().sort((a, b) => a.m - b.m);
    for (const b of order) {
      const [sx, sy] = toScreen(b.x, b.y);
      const R = b.r * sc;
      const pad = R * 8 + 40;
      if (sx < -pad || sy < -pad || sx > W + pad || sy > H + pad) continue;
      if (b.probe) { drawProbe(ctx, b, sx, sy, time); continue; }
      const look = TYPES[b.t].look;
      if (look === 'star') drawStar(ctx, b, sx, sy, R, time);
      else if (look === 'bh') drawBH(ctx, b, sx, sy, R, time);
      else { const [lx, ly] = lightFor(b); drawPlanet(ctx, b, sx, sy, R, lx, ly, time); }
      if (b.comet) drawCometTail(b, sx, sy, R, sc);
      if (b.flash > 0) {
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(sx, sy, R, sx, sy, R + 30 * b.flash + R * b.flash);
        g.addColorStop(0, `rgba(255,230,190,${b.flash * 0.6})`); g.addColorStop(1, 'rgba(255,230,190,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, R + 30 * b.flash + R * b.flash, 0, TAU); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }
      if (b === selected) {
        ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 5]); ctx.lineDashOffset = -time * 0.3;
        ctx.beginPath(); ctx.arc(sx, sy, Math.max(R, 4) + 8, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      }
    }
    if (mode !== 'sandbox') drawChallengeFront(sc);
    drawAim(sc);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  function drawCometTail(b, sx, sy, R, sc) {
    const [lx, ly] = lightFor(b);
    const L = 30 + 4000 / (Math.hypot(b.x, b.y) + 40);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const tx = sx - lx * L * sc * 2, ty = sy - ly * L * sc * 2;
    const g = ctx.createLinearGradient(sx, sy, tx, ty);
    g.addColorStop(0, 'rgba(190,230,255,.7)'); g.addColorStop(1, 'rgba(190,230,255,0)');
    ctx.strokeStyle = g; ctx.lineWidth = Math.max(2, R * 2.2); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(tx, ty); ctx.stroke();
    ctx.restore();
  }
  function trailColor(b, a) {
    const look = TYPES[b.t].look;
    if (b.probe) return `rgba(255,140,90,${a})`;
    const c = { star: '255,210,140', bh: '255,140,80', ocean: '110,180,255', gas: '230,190,140', icegiant: '120,220,240', lava: '255,120,60', ice: '200,230,255', desert: '230,140,90', dwarf: '230,100,90', moon: '200,200,210', rock: '170,160,150' }[look] || '200,200,200';
    return `rgba(${c},${a})`;
  }
  function drawTrail(b, sc) {
    if (b.tn < 2) return;
    const chunks = 6, per = Math.ceil(b.tn / chunks);
    ctx.lineWidth = Math.max(1, Math.min(3, b.r * sc * 0.5));
    for (let c = 0; c < chunks; c++) {
      ctx.beginPath();
      let started = false;
      for (let k = c * per; k <= Math.min(b.tn - 1, (c + 1) * per); k++) {
        const idx = (b.ti - b.tn + k + TRAIL * 2) % TRAIL;
        const sx = W / 2 + (b.tr[idx * 2] - cam.x) * sc, sy = H / 2 + (b.tr[idx * 2 + 1] - cam.y) * sc;
        if (!started) { ctx.moveTo(sx, sy); started = true; } else ctx.lineTo(sx, sy);
      }
      ctx.strokeStyle = trailColor(b, 0.05 + 0.5 * (c + 1) / chunks);
      ctx.stroke();
    }
  }

  let aim = null, predicted = [], predEnd = null;
  function predict() {
    predicted = []; predEnd = null;
    if (!aim) return;
    const launch = launchState();
    const ghost = bodies.map((b) => ({ x: b.x, y: b.y, vx: b.vx, vy: b.vy, ax: 0, ay: 0, m: b.m, r: b.r, t: b.t }));
    const probe = { x: launch.x, y: launch.y, vx: launch.vx, vy: launch.vy, ax: 0, ay: 0, m: launch.m, r: launch.r, t: launch.t };
    ghost.push(probe);
    accel(ghost);
    const dt = 0.2;
    const steps = mode === 'sandbox' ? (ghost.length > 30 ? 200 : 340) : Math.round(level.predict / dt);
    for (let k = 0; k < steps; k++) {
      leapfrog(ghost, dt);
      if (k % 2 === 0) predicted.push(probe.x, probe.y);
      for (let j = 0; j < ghost.length - 1; j++) {
        const o = ghost[j], dx = o.x - probe.x, dy = o.y - probe.y;
        const rr = o.t === 'blackhole' ? o.r * 2 + probe.r * 0.5 : (o.r + probe.r) * 0.85;
        if (dx * dx + dy * dy < rr * rr) { predEnd = [probe.x, probe.y]; return; }
      }
      if (Math.abs(probe.x) > 5000 || Math.abs(probe.y) > 5000) return;
    }
  }
  function curMass() { const T = TYPES[save.settings.type]; return T.mass * save.settings.size; }
  function launchState() {
    if (mode === 'sandbox') {
      const m = curMass(), t = save.settings.type;
      return { x: aim.x0, y: aim.y0, vx: (aim.x1 - aim.x0) * FLING, vy: (aim.y1 - aim.y0) * FLING, m, r: radiusOf(t, m), t };
    }
    const p = padPos();
    let dx = aim.x1 - aim.x0, dy = aim.y1 - aim.y0;
    const L = Math.hypot(dx, dy); if (L > MAXDRAG) { dx *= MAXDRAG / L; dy *= MAXDRAG / L; }
    return { x: p.x, y: p.y, vx: p.vx + dx * CFLING, vy: p.vy + dy * CFLING, m: 0.05, r: 1, t: 'asteroid' };
  }
  function drawAim(sc) {
    if (!aim) return;
    const L = launchState();
    const [x0, y0] = toScreen(L.x, L.y);
    const vx = (L.vx - (mode === 'sandbox' ? 0 : padPos().vx)), vy = (L.vy - (mode === 'sandbox' ? 0 : padPos().vy));
    const k = (mode === 'sandbox' ? 1 / FLING : 1 / CFLING) * sc;
    const x1 = x0 + vx * k, y1 = y0 + vy * k;
    ctx.save();
    ctx.lineWidth = 2; ctx.lineCap = 'round';
    const n = predicted.length / 2;
    for (let i = 2; i < predicted.length; i += 2) {
      const [ax, ay] = toScreen(predicted[i - 2], predicted[i - 1]), [bx, by] = toScreen(predicted[i], predicted[i + 1]);
      const t = i / 2 / n;
      ctx.strokeStyle = `rgba(255,255,255,${0.75 * (1 - t) + 0.08})`;
      if ((i / 2) % 3 === 0) continue;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    }
    if (predEnd) {
      const [ex, ey] = toScreen(...predEnd); ctx.strokeStyle = '#ff6b4a'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(ex - 6, ey - 6); ctx.lineTo(ex + 6, ey + 6); ctx.moveTo(ex + 6, ey - 6); ctx.lineTo(ex - 6, ey + 6); ctx.stroke();
    }
    const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, 'rgba(255,90,54,.4)'); g.addColorStop(1, '#ff5a36');
    ctx.strokeStyle = g; ctx.fillStyle = '#ff5a36'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    const ang = Math.atan2(y1 - y0, x1 - x0), len = Math.hypot(x1 - x0, y1 - y0);
    if (len > 8) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - 12 * Math.cos(ang - 0.45), y1 - 12 * Math.sin(ang - 0.45)); ctx.lineTo(x1 - 12 * Math.cos(ang + 0.45), y1 - 12 * Math.sin(ang + 0.45)); ctx.closePath(); ctx.fill(); }
    if (mode === 'sandbox') {
      const ghost = { t: L.t, m: L.m, seed: 77, spin: time * 0.002, ringRot: 0.2, tex: aimTex };
      const R = Math.max(2.5, L.r * sc);
      ctx.globalAlpha = 0.85;
      if (TYPES[L.t].look === 'star') drawStar(ctx, ghost, x0, y0, R, time);
      else if (TYPES[L.t].look === 'bh') drawBH(ctx, ghost, x0, y0, R, time);
      else drawPlanet(ctx, ghost, x0, y0, R, -0.6, -0.8, time);
      aimTex = ghost.tex;
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = '700 12px ui-rounded, system-ui, sans-serif'; ctx.textAlign = 'center';
    const v = Math.hypot(vx, vy);
    ctx.fillText(`speed ${v.toFixed(1)}`, x1, y1 - 14);
    ctx.restore();
  }
  let aimTex = null;

  let shot = { state: 'idle' }, shotsUsed = 0, gemsGot = [], levelDone = false, dry = false;
  function padPos() {
    const p = level.pad;
    if (p.on != null) { const b = bodies[p.on]; return { x: b.x + p.x, y: b.y + p.y, vx: b.vx, vy: b.vy }; }
    return { x: p.x, y: p.y, vx: 0, vy: 0 };
  }
  function buildLevelBodies(L) {
    bodies = []; dust = [];
    if (L.bodies === 'eight') { eightBodies(bodies); }
    else {
      L.bodies.forEach((s, i) => {
        if (s.orbit) {
          const c = bodies[s.orbit[0]];
          addOrbiter(c, s.t, s.orbit[1], s.m, s.orbit[2], s.orbit[3] || 1, { seed: 1000 + i * 31 + (L.seed || 0) });
        } else bodies.push(mkBody(s.t, s.x, s.y, s.vx || 0, s.vy || 0, s.m, { seed: 1000 + i * 31 + (L.seed || 0) }));
      });
    }
    if (L.dust === 'disk') diskDust(bodies[0], 700, 45, 110, (r) => 10 + r / 6);
    accel(bodies);
  }
  function startLevel(L, idx, daily) {
    mode = daily ? 'daily' : 'challenge'; level = L; levelIdx = idx; isDaily = !!daily;
    shotsUsed = 0; gemsGot = (L.goal.gems || []).map(() => false); levelDone = false;
    sparks = []; waves = []; selectBody(null); follow = null;
    cam.x = cam.tx = 0; cam.y = cam.ty = 0; cam.zoom = cam.tz = 1;
    fitBase();
    resetShot();
    setDock();
    $('modeLbl').textContent = daily ? `Daily orbit · ${todayStr()}` : `Challenge ${idx + 1} · ${L.name}`;
    Curio.toast(L.tip, 3600);
    const h = $('hint'); h.textContent = 'Drag anywhere to aim, release to launch'; h.classList.remove('is-faded');
  }
  function resetShot() {
    buildLevelBodies(level);
    shot = { state: 'aim', frames: 0, ang: 0, la: null, gate: 0 };
    paintGoal();
  }
  function launchProbe(L) {
    if (shot.state !== 'aim' || levelDone) return;
    if (shotsUsed >= level.shots) return;
    shotsUsed++;
    const p = mkBody('asteroid', L.x, L.y, L.vx, L.vy, 0.05, { probe: true, name: 'Probe' });
    p.r = 1.2; p.probe = true;
    bodies.push(p); accel(bodies);
    shot = { state: 'flying', probe: p, frames: 0, ang: 0, la: null, gate: 0 };
    whoosh(Math.hypot(L.vx, L.vy));
    paintGoal();
  }
  function centerOf(around) {
    if (around === 'com') {
      let m = 0, x = 0, y = 0;
      for (const b of bodies) if (!b.probe) { m += b.m; x += b.x * b.m; y += b.y * b.m; }
      return { x: x / m, y: y / m };
    }
    return bodies[around];
  }
  function challengeStep() {
    if (shot.state !== 'flying') return;
    const p = shot.probe, g = level.goal;
    if (!bodies.includes(p)) return;
    if (g.type === 'orbit') {
      const c = centerOf(g.around);
      if (!c) return;
      const a = Math.atan2(p.y - c.y, p.x - c.x);
      if (shot.la != null) { let da = a - shot.la; if (da > Math.PI) da -= TAU; if (da < -Math.PI) da += TAU; shot.ang += da; }
      shot.la = a;
      if (Math.abs(shot.ang) >= g.n * TAU) return win();
    } else if (g.type === 'gates') {
      const gt = g.gates[shot.gate];
      if ((p.x - gt[0]) ** 2 + (p.y - gt[1]) ** 2 < gt[2] * gt[2]) {
        shot.gate++; if (!dry) { tone(660 + shot.gate * 110, 0.2, 'triangle', 0.1); burst(gt[0], gt[1], 140); }
        if (shot.gate >= g.gates.length) return win();
      }
    } else if (g.type === 'gems') {
      g.gems.forEach((gm, i) => {
        if (gemsGot[i]) return;
        if ((p.x - gm[0]) ** 2 + (p.y - gm[1]) ** 2 < 22 * 22) { gemsGot[i] = true; if (!dry) { tone(880 + gemsGot.filter(Boolean).length * 120, 0.25, 'triangle', 0.1); burst(gm[0], gm[1], 180); } }
      });
      if (gemsGot.every(Boolean)) return win();
    }
    const lim = level.view * 2.4;
    if (Math.abs(p.x) > lim || Math.abs(p.y) > lim) endShot('Lost in space', 'Your probe drifted off into the dark.');
  }
  function burst(x, y, hue) { for (let k = 0; k < 24; k++) { const a = Math.random() * TAU, v = Math.random() * 2 + 0.5; sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, hue }); } waves.push({ x, y, r: 4, max: 50, life: 1 }); }
  function probeHit(p, other) {
    if (level && level.goal.type === 'land' && bodies.indexOf(other) === level.goal.target) { bodies.splice(bodies.indexOf(p), 1); if (!dry) { burst(p.x, p.y, 20); thud(5); } return win(); }
    bodies.splice(bodies.indexOf(p), 1);
    if (dry) { shot.state = 'over'; return; }
    for (let k = 0; k < 20; k++) { const a = Math.random() * TAU, v = Math.random() * 2 + 0.5; sparks.push({ x: p.x, y: p.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, hue: 15 }); }
    thud(1); shake = 5;
    endShot(TYPES[other.t].look === 'bh' ? 'Spaghettified' : 'Crashed', `Your probe hit ${other.name}.`);
  }
  function frameChallenge() {
    if (shot.state !== 'flying') return;
    shot.frames += Math.max(1, speed);
    if (shot.frames > 60 * 50) endShot('Out of fuel', 'The probe wandered for too long.');
    paintGoal();
  }
  function endShot(title, why) {
    if (shot.state !== 'flying') return;
    if (dry) { shot.state = 'over'; return; }
    shot.state = 'over';
    if (navigator.vibrate) navigator.vibrate(30);
    if (shotsUsed >= level.shots) {
      setTimeout(() => showResult(false, title, why), 700);
    } else {
      feed(`${title}. ${why} ${level.shots - shotsUsed} shot${level.shots - shotsUsed === 1 ? '' : 's'} left.`);
      setTimeout(() => { if (shot.state === 'over' && mode !== 'sandbox') resetShot(); }, 1100);
    }
  }
  function starsFor() {
    if (level.goal.type === 'gems') return shotsUsed <= 2 ? 3 : shotsUsed <= 3 ? 2 : 1;
    return shotsUsed <= 1 ? 3 : shotsUsed === 2 ? 2 : 1;
  }
  function win() {
    if (shot.state !== 'flying') return;
    if (dry) { shot.state = 'won'; return; }
    shot.state = 'won'; levelDone = true;
    const st = starsFor();
    chime(); Curio.confetti(); if (navigator.vibrate) navigator.vibrate([20, 40, 20]);
    if (isDaily) {
      const k = todayStr(), prev = save.daily[k];
      if (!prev || prev.shots > shotsUsed) save.daily[k] = { shots: shotsUsed, stars: st };
      unlock('daily');
    } else {
      const prev = save.levels[levelIdx] || 0;
      if (st > prev) save.levels[levelIdx] = st;
      const cleared = Object.keys(save.levels).length;
      unlock('lvl1'); if (cleared >= 6) unlock('lvl6'); if (cleared >= D.LEVELS.length) unlock('lvlall');
      if (D.LEVELS.every((_, i) => save.levels[i] === 3)) unlock('perfect');
    }
    if (shotsUsed === 1) unlock('hole1');
    persist();
    paintGoal();
    setTimeout(() => showResult(true), 900);
  }
  function paintGoal() {
    const box = $('goal');
    if (mode === 'sandbox' || !level) { box.hidden = true; return; }
    box.hidden = false;
    const g = level.goal;
    let txt = '', prog = 0;
    if (g.type === 'orbit') { const nm = g.around === 'com' ? 'all the stars' : bodies[g.around]?.name || 'the target'; const done = shot.state === 'flying' || shot.state === 'won' ? Math.abs(shot.ang) / TAU : 0; txt = `Orbit ${nm} ${g.n}×`; prog = done / g.n; $('goalS').textContent = `${Math.min(g.n, done).toFixed(1)} / ${g.n} orbits`; }
    if (g.type === 'gates') { txt = `Fly through ${g.gates.length} gates in order`; prog = (shot.gate || 0) / g.gates.length; $('goalS').textContent = `${shot.gate || 0} / ${g.gates.length} gates`; }
    if (g.type === 'gems') { const n = gemsGot.filter(Boolean).length; txt = `Collect all ${g.gems.length} gems`; prog = n / g.gems.length; $('goalS').textContent = `${n} / ${g.gems.length} gems`; }
    if (g.type === 'land') { txt = `Land on ${bodies[g.target]?.name || 'the target'}`; prog = shot.state === 'won' ? 1 : 0; $('goalS').textContent = 'Direct hit needed'; }
    $('goalT').textContent = txt;
    $('goalBar').style.width = `${clamp(prog, 0, 1) * 100}%`;
    $('shots').innerHTML = '';
    for (let i = 0; i < level.shots; i++) { const s = document.createElement('i'); s.className = i < shotsUsed ? 'used' : ''; $('shots').append(s); }
  }
  function drawChallengeBack(sc) {
    const g = level.goal;
    if (g.type === 'orbit') {
      const c = centerOf(g.around); if (!c) return;
      const [sx, sy] = toScreen(c.x, c.y);
      ctx.strokeStyle = 'rgba(126,224,195,.35)'; ctx.setLineDash([2, 8]); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(sx, sy, 26 + Math.sin(time * 0.05) * 3, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    }
    if (g.type === 'gates') {
      g.gates.forEach((gt, i) => {
        const [sx, sy] = toScreen(gt[0], gt[1]), R = gt[2] * sc, done = (shot.gate || 0) > i, next = (shot.gate || 0) === i;
        ctx.strokeStyle = done ? 'rgba(126,224,195,.35)' : next ? `rgba(126,224,195,${0.7 + 0.3 * Math.sin(time * 0.1)})` : 'rgba(255,255,255,.35)';
        ctx.lineWidth = next ? 3 : 2; ctx.setLineDash(done ? [] : [6, 6]); ctx.lineDashOffset = -time * 0.4;
        ctx.beginPath(); ctx.arc(sx, sy, R, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = done ? 'rgba(126,224,195,.6)' : '#fff'; ctx.font = '800 13px ui-rounded, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(done ? '✓' : String(i + 1), sx, sy);
      });
    }
    if (g.type === 'gems') {
      g.gems.forEach((gm, i) => {
        if (gemsGot[i]) return;
        const [sx, sy] = toScreen(gm[0], gm[1]), s = 9 + Math.sin(time * 0.08 + i) * 1.5;
        ctx.save(); ctx.translate(sx, sy); ctx.rotate(time * 0.01 + i);
        ctx.globalCompositeOperation = 'lighter';
        const gl = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 3); gl.addColorStop(0, 'rgba(120,255,220,.5)'); gl.addColorStop(1, 'rgba(120,255,220,0)');
        ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, 0, s * 3, 0, TAU); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#7ef0d0'; ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * 0.8, 0); ctx.lineTo(0, s); ctx.lineTo(-s * 0.8, 0); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * 0.4, -s * 0.1); ctx.lineTo(-s * 0.3, -s * 0.1); ctx.closePath(); ctx.fill();
        ctx.restore();
      });
    }
    if (g.type === 'land') {
      const t = bodies[g.target]; if (t) { const [sx, sy] = toScreen(t.x, t.y), R = t.r * sc + 10 + Math.sin(time * 0.1) * 3; ctx.strokeStyle = 'rgba(255,90,54,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx, sy, R, 0, TAU); ctx.moveTo(sx - R - 6, sy); ctx.lineTo(sx - R + 4, sy); ctx.moveTo(sx + R + 6, sy); ctx.lineTo(sx + R - 4, sy); ctx.moveTo(sx, sy - R - 6); ctx.lineTo(sx, sy - R + 4); ctx.moveTo(sx, sy + R + 6); ctx.lineTo(sx, sy + R - 4); ctx.stroke(); }
    }
  }
  function drawChallengeFront() {
    if (shot.state !== 'aim') return;
    const p = padPos(), [sx, sy] = toScreen(p.x, p.y);
    const pulse = 0.5 + 0.5 * Math.sin(time * 0.08);
    ctx.strokeStyle = `rgba(255,90,54,${0.5 + pulse * 0.5})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(sx, sy, 9 + pulse * 3, 0, TAU); ctx.stroke();
    if (!aim) {
      ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.font = '800 11px ui-rounded, system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('LAUNCH', sx, sy - 18);
      drawProbe(ctx, { vx: 0, vy: -1 }, sx, sy, time);
    }
  }

  function todayStr() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
  function dailyLevel() {
    const r = rng(strSeed('gravity' + todayStr()));
    const sunM = 14000 + r() * 8000;
    const bodiesSpec = [{ t: 'star', m: Math.round(sunM), x: 0, y: 0 }];
    const np = 1 + Math.floor(r() * 2);
    for (let i = 0; i < np; i++) bodiesSpec.push({ t: ['gas', 'ringed', 'icegiant'][Math.floor(r() * 3)], m: Math.round(150 + r() * 450), orbit: [0, Math.round(280 + i * 70 + r() * 30), r() * TAU] });
    const gems = [];
    let tries = 0;
    while (gems.length < 4 && tries++ < 200) {
      const a = r() * TAU, rr = 120 + r() * 220, gx = Math.round(Math.cos(a) * rr), gy = Math.round(Math.sin(a) * rr);
      if (gems.every(([x, y]) => Math.hypot(x - gx, y - gy) > 110)) gems.push([gx, gy]);
    }
    const pa = r() * TAU, pr = 150 + r() * 60;
    return { name: 'Daily orbit', tip: 'Today\'s sky. Grab every gem in as few shots as you can.', bodies: bodiesSpec, pad: { x: Math.round(Math.cos(pa) * pr), y: Math.round(Math.sin(pa) * pr) }, goal: { type: 'gems', gems }, shots: 8, predict: 40, view: 400, seed: 7 };
  }

  const ACH = Object.fromEntries(D.ACH.map((a) => [a.id, a]));
  function unlock(id) {
    if (save.ach[id] || !ACH[id]) return;
    save.ach[id] = Date.now(); persist();
    const a = ACH[id];
    const el = document.createElement('div'); el.className = 'gp-badge';
    el.innerHTML = '<i></i><div><small>Achievement unlocked</small><b></b></div>';
    el.querySelector('i').textContent = a.icon; el.querySelector('b').textContent = a.name;
    document.body.append(el);
    requestAnimationFrame(() => el.classList.add('is-on'));
    setTimeout(() => { el.classList.remove('is-on'); setTimeout(() => el.remove(), 500); }, 3200);
    chime([784, 988, 1319]);
  }

  const sheet = $('sheet'), sheetBody = $('sheetBody');
  function openSheet(title, build) {
    $('sheetT').textContent = title; sheetBody.textContent = ''; build(sheetBody);
    sheet.hidden = false; requestAnimationFrame(() => sheet.classList.add('is-on'));
    sheet.querySelector('.gp-sheet__x').focus();
  }
  function closeSheet() { sheet.classList.remove('is-on'); setTimeout(() => { sheet.hidden = true; }, 220); }
  sheet.addEventListener('click', (e) => { if (e.target === sheet) closeSheet(); });
  sheet.querySelector('.gp-sheet__x').addEventListener('click', closeSheet);

  function miniPlanet(t, size = 44) {
    const c = document.createElement('canvas'); c.width = c.height = size * 2; c.style.width = c.style.height = `${size}px`;
    const x = c.getContext('2d'); x.scale(2, 2);
    const T = TYPES[t];
    const b = { t, m: T.mass, seed: 3 + D.PICKER.indexOf(t) * 7, spin: 0.1, ringRot: -0.3, tex: null };
    const R = T.look === 'star' ? size * 0.22 : T.look === 'bh' ? size * 0.13 : T.rings ? size * 0.24 : size * 0.34;
    texBudget = 1e6;
    if (T.look === 'star') drawStar(x, b, size / 2, size / 2, R, 0);
    else if (T.look === 'bh') drawBH(x, b, size / 2, size / 2, R, 0);
    else drawPlanet(x, b, size / 2, size / 2, R, -0.7, -0.7, 0);
    return c;
  }
  function openTypes() {
    openSheet('Pick what to fling', (box) => {
      const grid = document.createElement('div'); grid.className = 'gp-types';
      for (const t of D.PICKER) {
        const T = TYPES[t], b = document.createElement('button'); b.type = 'button'; b.className = 'gp-type';
        b.setAttribute('aria-pressed', String(save.settings.type === t));
        b.append(miniPlanet(t));
        const s = document.createElement('span'); s.innerHTML = '<b></b><small></small>'; s.querySelector('b').textContent = T.name; s.querySelector('small').textContent = T.blurb;
        b.append(s);
        b.addEventListener('click', () => { setType(t); closeSheet(); });
        grid.append(b);
      }
      box.append(grid);
      const row = document.createElement('div'); row.className = 'gp-sizes';
      row.innerHTML = '<span>Size</span>';
      [[0.4, 'Small'], [1, 'Normal'], [2.5, 'Huge']].forEach(([v, l]) => {
        const b = document.createElement('button'); b.type = 'button'; b.textContent = l; b.setAttribute('aria-pressed', String(save.settings.size === v));
        b.addEventListener('click', () => { save.settings.size = v; persist(); row.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); paintType(); });
        row.append(b);
      });
      box.append(row);
    });
  }
  function setType(t) { save.settings.type = t; persist(); paintType(); tool = 'fling'; paintTool(); Curio.beep(520, 0.05, 'triangle', 0.06); }
  function paintType() {
    const btn = $('typeBtn'); btn.textContent = '';
    btn.append(miniPlanet(save.settings.type, 30));
    const s = document.createElement('span'); s.textContent = TYPES[save.settings.type].name; btn.append(s);
    btn.setAttribute('aria-label', `Body type: ${TYPES[save.settings.type].name}. Change`);
  }
  function openPresets() {
    openSheet('Presets', (box) => {
      const grid = document.createElement('div'); grid.className = 'gp-presets';
      D.PRESETS.forEach((p, i) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'gp-preset';
        b.setAttribute('aria-pressed', String(preset === p.id));
        b.innerHTML = '<i></i><b></b><small></small><em></em>';
        b.querySelector('i').textContent = p.icon; b.querySelector('b').textContent = p.name; b.querySelector('small').textContent = p.blurb;
        b.querySelector('em').textContent = i < 9 ? String(i + 1) : '';
        if (save.presets[p.id]) b.classList.add('seen');
        b.addEventListener('click', () => { closeSheet(); goSandbox(p.id); });
        grid.append(b);
      });
      box.append(grid);
    });
  }
  function openLevels() {
    openSheet('Orbit challenges', (box) => {
      const total = D.LEVELS.reduce((s, _, i) => s + (save.levels[i] || 0), 0);
      const p = document.createElement('p'); p.className = 'gp-sheet__lead'; p.textContent = `${total} of ${D.LEVELS.length * 3} stars. Launch a probe from the pad and complete the goal. Each shot restarts the system.`;
      box.append(p);
      const grid = document.createElement('div'); grid.className = 'gp-levels';
      D.LEVELS.forEach((L, i) => {
        const locked = i > 0 && !save.levels[i - 1] && !save.levels[i];
        const b = document.createElement('button'); b.type = 'button'; b.className = 'gp-level'; b.disabled = locked;
        const st = save.levels[i] || 0;
        b.innerHTML = '<em></em><b></b><span></span>';
        b.querySelector('em').textContent = locked ? '🔒' : String(i + 1);
        b.querySelector('b').textContent = L.name;
        b.querySelector('span').textContent = '★'.repeat(st) + '☆'.repeat(3 - st);
        if (st) b.classList.add('done');
        b.addEventListener('click', () => { closeSheet(); hideStart(); startLevel(L, i, false); });
        grid.append(b);
      });
      box.append(grid);
    });
  }
  function openTrophies() {
    openSheet('Trophies and stats', (box) => {
      const s = save.stats;
      const stats = document.createElement('div'); stats.className = 'gp-stats';
      const rows = [['Bodies flung', s.launched], ['Collisions', s.merges], ['Black hole meals', s.eaten], ['Stars born', s.starborn], ['Best orbit count', s.maxOrbits], ['Most bodies at once', s.maxBodies], ['Challenge stars', D.LEVELS.reduce((a, _, i) => a + (save.levels[i] || 0), 0)], ['Daily orbits done', Object.keys(save.daily).length]];
      for (const [k, v] of rows) { const d = document.createElement('div'); d.innerHTML = '<b></b><span></span>'; d.querySelector('b').textContent = Curio.fmt(v); d.querySelector('span').textContent = k; stats.append(d); }
      box.append(stats);
      const n = Object.keys(save.ach).length;
      const h = document.createElement('h3'); h.textContent = `Achievements ${n} / ${D.ACH.length}`; box.append(h);
      const grid = document.createElement('div'); grid.className = 'gp-ach';
      for (const a of D.ACH) {
        const d = document.createElement('div'); d.className = save.ach[a.id] ? 'on' : '';
        d.innerHTML = '<i></i><b></b><small></small>';
        d.querySelector('i').textContent = save.ach[a.id] ? a.icon : '🔒'; d.querySelector('b').textContent = a.name; d.querySelector('small').textContent = a.desc;
        grid.append(d);
      }
      box.append(grid);
    });
  }
  function openHelp() {
    openSheet('How to play', (box) => {
      box.innerHTML = `<div class="gp-help">
        <p><b>Fling:</b> press, drag and let go. The arrow is the launch speed and the dotted line is where gravity will take it.</p>
        <p><b>Tap a body</b> to see its name, mass and orbit count. Follow it with the camera or delete it.</p>
        <p><b>Collisions</b> merge bodies. Pile up enough mass and a planet ignites into a star. Black holes swallow everything.</p>
        <p><b>Challenges:</b> launch a probe from the pad. Orbit, fly through gates, grab gems or hit a target. Fewer shots, more stars.</p>
        <p><b>Zoom</b> by pinching (on a touchpad or a phone) or with the + and - buttons. Scroll with two fingers or use the arrow keys to pan.</p>
        <p><b>Touchpad?</b> Turn on Touchpad mode (🖱️ in the top bar): click once to start aiming, move, then click again to fling. No holding needed.</p>
        <p class="gp-keys"><span class="c-kbd">Space</span> pause · <span class="c-kbd">T</span> trails · <span class="c-kbd">E</span> eraser · <span class="c-kbd">B</span> black hole · <span class="c-kbd">F</span> follow · <span class="c-kbd">[</span> <span class="c-kbd">]</span> speed · <span class="c-kbd">+</span> <span class="c-kbd">-</span> zoom · <span class="c-kbd">1</span>-<span class="c-kbd">9</span> presets · <span class="c-kbd">R</span> retry shot · <span class="c-kbd">Esc</span> menu</p>
      </div>`;
    });
  }

  const infoEl = $('info');
  function selectBody(b) {
    selected = b;
    infoEl.hidden = !b;
    if (b) paintInfo();
  }
  function paintInfo() {
    if (!selected) return;
    const b = selected;
    $('infoName').textContent = b.name;
    $('infoType').textContent = b.probe ? 'Probe' : TYPES[b.t].name;
    const v = Math.hypot(b.vx, b.vy);
    $('infoStats').innerHTML = '';
    const rows = [['Mass', b.m < 10 ? b.m.toFixed(1) : Curio.fmt(b.m)], ['Speed', v.toFixed(1)], ['Orbiting', b.prim ? b.prim.name : 'nothing'], ['Orbits', b.orbits]];
    for (const [k, val] of rows) { const d = document.createElement('div'); d.innerHTML = '<span></span><b></b>'; d.querySelector('span').textContent = k; d.querySelector('b').textContent = val; $('infoStats').append(d); }
    $('infoFollow').setAttribute('aria-pressed', String(follow === b));
  }
  $('infoClose').addEventListener('click', () => selectBody(null));
  $('infoFollow').addEventListener('click', () => { follow = follow === selected ? null : selected; if (!follow) { cam.tx = cam.x; cam.ty = cam.y; } paintInfo(); });
  $('infoDel').addEventListener('click', () => { if (!selected) return; removeBody(selected); });
  function removeBody(b) {
    const i = bodies.indexOf(b); if (i < 0) return;
    bodies.splice(i, 1); accel(bodies);
    for (let k = 0; k < 16; k++) { const a = Math.random() * TAU; sparks.push({ x: b.x, y: b.y, vx: Math.cos(a) * 1.5, vy: Math.sin(a) * 1.5, life: 0.8, hue: 200 }); }
    if (follow === b) follow = null;
    if (selected === b) selectBody(null);
    tone(400, 0.12, 'sine', 0.07, 200);
  }

  function hitBody(wx, wy, pad = 10) {
    let best = null, bd = Infinity;
    const sc = scale();
    for (const b of bodies) {
      const d = Math.hypot(b.x - wx, b.y - wy), lim = b.r + pad / sc;
      if (d < lim && d < bd) { bd = d; best = b; }
    }
    return best;
  }
  const touches = new Map();
  let pinch = null;
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  const tLocal = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch') return;
    touches.set(e.pointerId, tLocal(e));
    if (touches.size === 2) {
      aim = null; predicted = [];
      const [a, b] = [...touches.values()];
      pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), z: cam.tz, c: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], cx: cam.tx, cy: cam.ty };
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!touches.has(e.pointerId)) return;
    touches.set(e.pointerId, tLocal(e));
    if (!pinch || touches.size < 2) return;
    const [a, b] = [...touches.values()];
    const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
    cam.tz = clamp(pinch.z * d / pinch.d, 0.25, 5); cam.zoom = cam.tz;
    const c = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    cam.tx = pinch.cx - (c[0] - pinch.c[0]) / scale(); cam.ty = pinch.cy - (c[1] - pinch.c[1]) / scale();
    cam.x = cam.tx; cam.y = cam.ty; follow = null;
  });
  const tEnd = (e) => { touches.delete(e.pointerId); if (touches.size < 2 && pinch) { pinch = null; aim = null; predicted = []; } };
  addEventListener('pointerup', tEnd);
  addEventListener('pointercancel', tEnd);

  Curio.drag(canvas, {
    start(p) {
      if (!startEl.hidden || !$('result').hidden || pinch) return;
      const [wx, wy] = toWorld(p.x, p.y);
      if (mode === 'sandbox' && tool === 'erase') { const b = hitBody(wx, wy, 14); if (b) removeBody(b); aim = { erase: true }; return; }
      if (mode !== 'sandbox' && (shot.state !== 'aim' || levelDone)) return;
      const on = mode === 'sandbox' ? hitBody(wx, wy, 8) : null;
      aim = { x0: wx, y0: wy, x1: wx, y1: wy, sx: p.x, sy: p.y, on };
      if (on && Curio.touchpad && p.pointerType === 'mouse') selectBody(on);
      predict();
      $('hint').classList.add('is-faded');
    },
    move(p) {
      if (!aim || pinch) return;
      const [wx, wy] = toWorld(p.x, p.y);
      if (aim.erase) { const b = hitBody(wx, wy, 14); if (b) removeBody(b); return; }
      aim.x1 = wx; aim.y1 = wy;
      if (time % 2 === 0 || bodies.length < 20) predict();
    },
    end(p) {
      if (!aim) return;
      if (aim.erase || !p || pinch) { aim = null; predicted = []; return; }
      const moved = Math.hypot(p.x - aim.sx, p.y - aim.sy);
      if (mode === 'sandbox' && moved < 6 && aim.on) { selectBody(aim.on); aim = null; predicted = []; Curio.beep(700, 0.04, 'sine', 0.05); return; }
      const L = launchState();
      if (mode === 'sandbox') {
        const t = save.settings.type;
        const b = mkBody(t, L.x, L.y, L.vx, L.vy, L.m * Curio.rand(0.9, 1.1), { mine: true });
        updateType(b, false);
        bodies.push(b); accel(bodies);
        save.stats.launched++; unlock('fling'); if (save.stats.launched >= 100) unlock('launch100'); persist();
        whoosh(Math.hypot(L.vx, L.vy));
        tone(320 + Math.random() * 160, 0.15, 'sine', 0.06, 520);
        if (navigator.vibrate) navigator.vibrate(8);
      } else {
        if (moved < 6) { aim = null; predicted = []; return; }
        launchProbe(L);
      }
      aim = null; predicted = []; predEnd = null;
    }
  });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const p = tLocal(e), [wx, wy] = toWorld(...p);
      const z = clamp(cam.tz * Math.exp(-e.deltaY * 0.01), 0.25, 5);
      cam.tz = z; cam.zoom = z;
      if (!follow) { cam.tx = wx - (p[0] - W / 2) / scale(); cam.ty = wy - (p[1] - H / 2) / scale(); cam.x = cam.tx; cam.y = cam.ty; }
    } else {
      follow = null;
      const k = e.deltaMode === 1 ? 16 : 1;
      cam.tx += e.deltaX * k / scale(); cam.ty += e.deltaY * k / scale(); cam.x = cam.tx; cam.y = cam.ty;
    }
  }, { passive: false });
  function zoomBy(f) { cam.tz = clamp(cam.tz * f, 0.25, 5); }

  const dock = $('dock');
  function setDock() {
    dock.dataset.mode = mode === 'sandbox' ? 'sandbox' : 'challenge';
    $('modeLbl').textContent = mode === 'sandbox' ? 'Sandbox' : $('modeLbl').textContent;
    paintGoal();
    paintCounts();
  }
  function paintTool() { $('eraseBtn').setAttribute('aria-pressed', String(tool === 'erase')); canvas.style.cursor = tool === 'erase' ? 'not-allowed' : 'crosshair'; }
  function paintPresetLbl() { const p = D.PRESETS.find((x) => x.id === preset); $('presetBtn').querySelector('span').textContent = p ? p.name : 'Presets'; }
  function paintCounts() { $('nb').textContent = bodies.filter((b) => !b.probe).length; $('nm').textContent = merges; $('nd').textContent = dust.filter((p) => !p.dead).length; }
  function togglePause() { paused = !paused; $('pauseBtn').setAttribute('aria-pressed', String(paused)); $('pauseBtn').textContent = paused ? '▶' : '⏸'; $('pauseBtn').setAttribute('aria-label', paused ? 'Play' : 'Pause'); }
  const SPEEDS = [0.25, 0.5, 1, 2, 4];
  function setSpeed(v) { speed = v; save.settings.speed = v; persist(); $('speedBtn').textContent = `${v}×`; }
  function stepSpeed(d) { const i = clamp(SPEEDS.indexOf(speed) + d, 0, SPEEDS.length - 1); setSpeed(SPEEDS[i]); }
  function setTrails(v) { trails = v; save.settings.trails = v; persist(); $('trailBtn').setAttribute('aria-pressed', String(v)); if (!v) bodies.forEach((b) => { if (!b.probe) b.tn = 0; }); }

  $('typeBtn').addEventListener('click', openTypes);
  $('bhBtn').addEventListener('click', () => setType('blackhole'));
  $('eraseBtn').addEventListener('click', () => { tool = tool === 'erase' ? 'fling' : 'erase'; paintTool(); });
  $('presetBtn').addEventListener('click', openPresets);
  $('pauseBtn').addEventListener('click', togglePause);
  $('speedBtn').addEventListener('click', () => { const i = SPEEDS.indexOf(speed); setSpeed(SPEEDS[(i + 1) % SPEEDS.length]); });
  $('trailBtn').addEventListener('click', () => setTrails(!trails));
  $('zinBtn').addEventListener('click', () => zoomBy(1.3));
  $('zoutBtn').addEventListener('click', () => zoomBy(1 / 1.3));
  $('homeBtn').addEventListener('click', () => { follow = null; cam.tx = 0; cam.ty = 0; cam.tz = 1; });
  $('clearBtn').addEventListener('click', () => { goSandbox('empty'); });
  $('retryBtn').addEventListener('click', () => { if (mode !== 'sandbox' && !levelDone) { if (shot.state === 'flying') endShot('Abandoned', 'You called the probe back.'); else resetShot(); } });
  $('levelsBtn').addEventListener('click', () => { if (isDaily) showStart(); else openLevels(); });
  $('cspeedBtn').addEventListener('click', () => { const i = SPEEDS.indexOf(speed); setSpeed(SPEEDS[(i + 1) % SPEEDS.length]); $('cspeedBtn').textContent = `${speed}×`; });
  $('menuBtn').addEventListener('click', showStart);
  $('trophyBtn').addEventListener('click', openTrophies);
  $('helpBtn').addEventListener('click', openHelp);

  addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input, textarea')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key;
    if (k === 'Escape') { if (!sheet.hidden) closeSheet(); else if (!$('result').hidden) return; else showStart(); return; }
    if (!startEl.hidden || !sheet.hidden) return;
    if (k === ' ') { e.preventDefault(); togglePause(); }
    else if (k === 't' || k === 'T') setTrails(!trails);
    else if (k === 'e' || k === 'E') { tool = tool === 'erase' ? 'fling' : 'erase'; paintTool(); }
    else if (k === 'b' || k === 'B') setType('blackhole');
    else if (k === 'f' || k === 'F') { if (selected) $('infoFollow').click(); }
    else if (k === '[') stepSpeed(-1); else if (k === ']') stepSpeed(1);
    else if (k === '+' || k === '=') zoomBy(1.3); else if (k === '-' || k === '_') zoomBy(1 / 1.3);
    else if (k === 'r' || k === 'R') $('retryBtn').click();
    else if (k === 'Delete' || k === 'Backspace') { if (selected) removeBody(selected); }
    else if (/^[1-9]$/.test(k) && mode === 'sandbox') { const p = D.PRESETS[+k - 1]; if (p) goSandbox(p.id); }
    else if (k.startsWith('Arrow')) { e.preventDefault(); const s = 60 / scale(); follow = null; if (k === 'ArrowLeft') cam.tx -= s; if (k === 'ArrowRight') cam.tx += s; if (k === 'ArrowUp') cam.ty -= s; if (k === 'ArrowDown') cam.ty += s; }
  });

  const startEl = $('start');
  function showStart() {
    paused = false;
    $('pauseBtn').setAttribute('aria-pressed', 'false'); $('pauseBtn').textContent = '⏸';
    if (mode !== 'sandbox') { mode = 'sandbox'; level = null; fitBase(); loadPreset('solar', true); setDock(); }
    $('result').hidden = true;
    const total = D.LEVELS.reduce((s, _, i) => s + (save.levels[i] || 0), 0);
    $('stLevels').textContent = `${total} / ${D.LEVELS.length * 3} ★`;
    const dd = save.daily[todayStr()];
    $('stDaily').textContent = dd ? `Done · ${'★'.repeat(dd.stars)} in ${dd.shots}` : 'New today';
    $('stFact').textContent = Curio.pick(D.FACTS);
    $('stLine').textContent = `${Curio.fmt(save.stats.launched)} flung · ${Curio.fmt(save.stats.merges)} collisions · ${Object.keys(save.ach).length}/${D.ACH.length} trophies`;
    startEl.hidden = false; requestAnimationFrame(() => startEl.classList.add('is-on'));
    document.querySelector('.gp-start__go').focus();
  }
  function hideStart() {
    startEl.classList.remove('is-on'); setTimeout(() => { startEl.hidden = true; }, 300);
    if (!Curio.store.get('gravity:tphint', false) && !Curio.touchpad) { Curio.store.set('gravity:tphint', true); setTimeout(() => Curio.toast('Tip: on a laptop touchpad, turn on Touchpad mode (🖱️ in the top bar). Click to aim, click again to fling.', 5000), 3800); }
  }
  function goSandbox(p) {
    mode = 'sandbox'; level = null; isDaily = false; $('result').hidden = true;
    fitBase();
    loadPreset(p || preset || 'solar');
    setDock(); hideStart();
    $('modeLbl').textContent = 'Sandbox';
    $('hint').textContent = 'Press, drag and release to fling';
  }
  $('goSandbox').addEventListener('click', () => goSandbox(preset || 'solar'));
  $('goLevels').addEventListener('click', () => { const next = D.LEVELS.findIndex((_, i) => !save.levels[i]); openLevels(); void next; });
  $('goDaily').addEventListener('click', () => { hideStart(); startLevel(dailyLevel(), -1, true); });
  $('goHelp').addEventListener('click', openHelp);

  async function showResult(won, title, why) {
    const box = $('result');
    const st = won ? starsFor() : 0;
    $('resEmoji').textContent = won ? (st === 3 ? '🏆' : '🛰️') : '💫';
    $('resTitle').textContent = won ? (st === 3 ? 'Perfect orbit!' : 'Mission complete') : 'Out of shots';
    $('resBody').textContent = won ? `${level.name} cleared in ${shotsUsed} shot${shotsUsed === 1 ? '' : 's'}.` : `${title}. ${why}`;
    const starsEl = $('resStars'); starsEl.textContent = '';
    for (let i = 0; i < 3; i++) { const s = document.createElement('span'); s.textContent = i < st ? '★' : '☆'; s.style.animationDelay = `${0.15 + i * 0.15}s`; if (i < st) setTimeout(() => tone(660 + i * 220, 0.2, 'triangle', 0.08), 150 + i * 150); starsEl.append(s); }
    const bestSt = isDaily ? (save.daily[todayStr()]?.stars || 0) : (save.levels[levelIdx] || 0);
    $('resBest').textContent = isDaily ? `Today's best: ${save.daily[todayStr()] ? save.daily[todayStr()].shots + ' shots' : 'none yet'}` : `Best: ${'★'.repeat(bestSt)}${'☆'.repeat(3 - bestSt)}`;
    const next = $('resNext');
    next.hidden = !won || isDaily || levelIdx >= D.LEVELS.length - 1;
    $('resShare').hidden = !won;
    box.hidden = false;
    requestAnimationFrame(() => box.classList.add('is-on'));
    (won && !next.hidden ? next : $('resRetry')).focus();
  }
  function hideResult() { const box = $('result'); box.classList.remove('is-on'); box.hidden = true; }
  $('resRetry').addEventListener('click', () => { hideResult(); startLevel(level, levelIdx, isDaily); });
  $('resNext').addEventListener('click', () => { hideResult(); startLevel(D.LEVELS[levelIdx + 1], levelIdx + 1, false); });
  $('resMenu').addEventListener('click', () => { hideResult(); showStart(); });
  $('resShare').addEventListener('click', async () => {
    const st = starsFor();
    const txt = isDaily ? `🪐 Gravity Playground daily orbit ${todayStr()}: ${'★'.repeat(st)}${'☆'.repeat(3 - st)} in ${shotsUsed} shot${shotsUsed === 1 ? '' : 's'}` : `🪐 Gravity Playground: cleared "${level.name}" ${'★'.repeat(st)}${'☆'.repeat(3 - st)} in ${shotsUsed} shot${shotsUsed === 1 ? '' : 's'}`;
    try { await navigator.clipboard.writeText(txt); Curio.toast('Result copied. Paste it anywhere!'); } catch { Curio.toast(txt, 4000); }
  });

  let raf = 0, last = 0, acc = 0;
  function frame(t) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(100, t - (last || t)); last = t;
    acc += dt;
    let n = 0;
    while (acc >= 1000 / 60 && n < 3) {
      acc -= 1000 / 60; n++;
      time++;
      const frozen = mode !== 'sandbox' && shot.state !== 'flying';
      if (!paused && !frozen) { simulate(); if (mode !== 'sandbox') frameChallenge(); }
      else if (!paused && frozen) { for (const s of sparks) { s.x += s.vx; s.y += s.vy; s.life -= 0.02; } sparks = sparks.filter((s) => s.life > 0); for (const w of waves) { w.r += (w.max - w.r) * 0.08; w.life -= 0.025; } waves = waves.filter((w) => w.life > 0); }
      if (aim && !aim.erase && !paused && !frozen && time % 6 === 0) predict();
      if (follow && bodies.includes(follow)) { cam.tx = follow.x; cam.ty = follow.y; }
      cam.x = lerp(cam.x, cam.tx, follow ? 0.25 : 0.15); cam.y = lerp(cam.y, cam.ty, follow ? 0.25 : 0.15); cam.zoom = lerp(cam.zoom, cam.tz, 0.15);
    }
    if (n === 3) acc = 0;
    if (n) {
      render();
      if (time % 10 === 0) { paintCounts(); if (selected) paintInfo(); }
    }
  }
  const start = () => { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  addEventListener('resize', resize);

  window.__gravity = {
    get bodies() { return bodies; }, get dust() { return dust; }, get merges() { return merges; }, get mode() { return mode; }, get shot() { return shot; }, get save() { return save; },
    loadPreset, simulate, goSandbox, startLevel: (i) => { hideStart(); startLevel(D.LEVELS[i], i, false); }, startDaily: () => { hideStart(); startLevel(dailyLevel(), -1, true); },
    tryShot(i, dx, dy, frames = 3600, gems) {
      const L = i === 'daily' ? dailyLevel() : D.LEVELS[i];
      const saved = { mode, level, levelIdx, bodies, dust, shot, gemsGot, shotsUsed, levelDone, isDaily, sparks, waves, merges };
      dry = true;
      mode = 'challenge'; level = L; isDaily = false; gemsGot = gems ? gems.slice() : (L.goal.gems || []).map(() => false); shotsUsed = 0; levelDone = false;
      buildLevelBodies(L); dust = [];
      aim = { x0: 0, y0: 0, x1: dx, y1: dy };
      const ls = launchState(); aim = null;
      const p = mkBody('asteroid', ls.x, ls.y, ls.vx, ls.vy, 0.05, { probe: true }); p.r = 1.2;
      bodies.push(p); accel(bodies);
      shot = { state: 'flying', probe: p, frames: 0, ang: 0, la: null, gate: 0 };
      const dtt = DT / SUB;
      for (let f = 0; f < frames && shot.state === 'flying'; f++) {
        for (let k = 0; k < SUB; k++) {
          leapfrog(bodies, dtt);
          collide();
          if (shot.state !== 'flying') break;
          challengeStep();
          if (shot.state !== 'flying') break;
        }
      }
      const result = shot.state === 'won' ? 'won' : shot.state === 'over' ? 'lost' : 'timeout';
      const out = { result, gems: gemsGot.slice(), orbits: Math.abs(shot.ang || 0) / TAU };
      dry = false;
      ({ mode, level, levelIdx, bodies, dust, shot, gemsGot, shotsUsed, levelDone, isDaily, sparks, waves, merges } = saved);
      return out;
    }
  };

  resize();
  paintType(); paintTool(); setTrails(trails); setSpeed(SPEEDS.includes(speed) ? speed : 1);
  loadPreset('solar', true);
  setDock();
  showStart();
  start();
})();
