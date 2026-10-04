(function () {
  const perm = new Uint8Array(512);
  (function () {
    const p = [];
    for (let i = 0; i < 256; i++) p[i] = i;
    let s = 1234567;
    for (let i = 255; i > 0; i--) { s = (s * 16807) % 2147483647; const j = s % (i + 1); const t = p[i]; p[i] = p[j]; p[j] = t; }
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  })();
    function noise(x, y, z) {
    const X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z);
    const fx = x - X, fy = y - Y, fz = z - Z;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
    const xi = X & 255, yi = Y & 255, zi = Z & 255;
    const a = perm[xi] + yi, b = perm[xi + 1] + yi;
    const aa = perm[a & 511] + zi, ab = perm[(a + 1) & 511] + zi, ba = perm[b & 511] + zi, bb = perm[(b + 1) & 511] + zi;
    const p000 = perm[aa & 511], p100 = perm[ba & 511], p010 = perm[ab & 511], p110 = perm[bb & 511];
    const p001 = perm[(aa + 1) & 511], p101 = perm[(ba + 1) & 511], p011 = perm[(ab + 1) & 511], p111 = perm[(bb + 1) & 511];
    const x00 = p000 + (p100 - p000) * u, x10 = p010 + (p110 - p010) * u, x01 = p001 + (p101 - p001) * u, x11 = p011 + (p111 - p011) * u;
    const y0 = x00 + (x10 - x00) * v, y1 = x01 + (x11 - x01) * v;
    return (y0 + (y1 - y0) * w) / 255;
  }
  function fbm(x, y, z, oct = 4) {
    let a = 0.5, f = 1, s = 0, n = 0;
    for (let i = 0; i < oct; i++) { s += a * noise(x * f + i * 17.3, y * f + i * 9.1, z * f + i * 3.7); n += a; a *= 0.5; f *= 2.03; }
    return s / n;
  }
  const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  function ramp(stops, t) {
    t = clamp(t);
    for (let i = 1; i < stops.length; i++) {
      if (t <= stops[i][0]) { const [t0, c0] = stops[i - 1], [t1, c1] = stops[i]; return mix(c0, c1, (t - t0) / (t1 - t0 || 1)); }
    }
    return stops[stops.length - 1][1];
  }
  const R = (arr) => arr.map(([t, c]) => [t, hex(c)]);

  let seedState = 1;
  const rnd = () => { seedState = (seedState * 16807) % 2147483647; return (seedState - 1) / 2147483646; };
  function craters(n, seed, minR, maxR) {
    seedState = seed;
    return Array.from({ length: n }, () => {
      const z = rnd() * 2 - 1, a = rnd() * Math.PI * 2, s = Math.sqrt(1 - z * z);
      const r = minR + Math.pow(rnd(), 2.2) * (maxR - minR);
      return [s * Math.cos(a), z, s * Math.sin(a), r, Math.cos(r)];
    });
  }
  function craterShade(p, list) {
    let k = 0;
    for (const c of list) {
      const d = p[0] * c[0] + p[1] * c[1] + p[2] * c[2];
      if (d < c[4] * 0.97) continue;
      const ang = Math.acos(clamp(d, -1, 1)) / c[3];
      if (ang < 0.85) k -= 0.16 * (1 - ang * 0.4);
      else if (ang < 1.15) k += 0.2 * (1 - Math.abs(ang - 1) / 0.15);
      else if (ang < 1.6) k += 0.05 * (1.6 - ang);
    }
    return k;
  }

  const LAND = [
    [48, -100, 22, 32], [62, -110, 12, 30], [40, -90, 12, 14], [20, -100, 8, 8], [12, -86, 6, 5], [72, -42, 9, 20],
    [-12, -58, 18, 14], [-34, -64, 14, 8], [4, -70, 10, 12],
    [8, 20, 22, 18], [-18, 26, 14, 10], [24, 10, 9, 22], [-20, 47, 6, 3],
    [50, 15, 10, 18], [62, 20, 8, 12], [54, -3, 4, 3], [40, -4, 4, 5],
    [56, 90, 16, 55], [36, 100, 14, 26], [24, 45, 9, 10], [22, 78, 8, 8], [14, 102, 8, 8], [36, 138, 6, 4], [66, 130, 8, 30],
    [-25, 134, 10, 18], [-2, 115, 4, 14], [-6, 142, 3, 8], [-42, 172, 5, 3],
    [-82, 0, 10, 180]
  ];
  function landAmount(lat, lon, p) {
    let best = 0;
    for (const [la, lo, rla, rlo] of LAND) {
      let dl = lon - lo; if (dl > 180) dl -= 360; if (dl < -180) dl += 360;
      const d = Math.pow((lat - la) / rla, 2) + Math.pow(dl * Math.cos(lat * Math.PI / 180) / Math.max(rlo * Math.cos(la * Math.PI / 180), rla * 0.7), 2);
      best = Math.max(best, 1 - d);
    }
    return best + (fbm(p[0] * 3, p[1] * 3, p[2] * 3, 5) - 0.5) * 0.9;
  }

  const RP = [
    R([[0, '#d95a00'], [0.45, '#ff9a1a'], [0.7, '#ffd04a'], [1, '#fff3b0']]),
    R([[0, '#4a4540'], [0.5, '#8a837b'], [1, '#c9c2b8']]),
    R([[0, '#a8742e'], [0.4, '#d9ac5f'], [0.7, '#f1d39a'], [1, '#fff3d6']]),
    R([[0, '#7d7b77'], [0.6, '#b9b7b1'], [1, '#e2e0da']]),
    R([[0, '#5e2410'], [0.4, '#a8481e'], [0.62, '#d2713f'], [1, '#f0a77a']]),
    R([[0, '#3b3029'], [0.6, '#7a6655'], [1, '#a89480']]),
    R([[0, '#3e3b38'], [0.55, '#77726c'], [1, '#a9a39b']]),
    R([[0, '#4b4540'], [0.6, '#8f857a'], [1, '#c2b8aa']]),
    R([[0, '#a8703f'], [0.35, '#c99460'], [0.6, '#ecd3ab'], [1, '#fbf0dc']]),
    R([[0, '#c7a330'], [0.5, '#ead65a'], [0.8, '#f3e9a8'], [1, '#fffbe0']]),
    R([[0, '#bba98f'], [0.6, '#e8dccb'], [1, '#fbf6ee']]),
    R([[0, '#4f4438'], [0.5, '#8a7b6a'], [1, '#d6ccbf']]),
    R([[0, '#2c2620'], [0.6, '#5d5246'], [1, '#d8d0c4']]),
    R([[0, '#c49a55'], [0.5, '#e3c585'], [1, '#f7e6bf']]),
    R([[0, '#a8661c'], [0.5, '#d89a3c'], [1, '#f2c374']]),
    R([[0, '#d6e2ea'], [1, '#ffffff']]),
    R([[0, '#6e6a66'], [0.6, '#b5b0a9'], [1, '#e8e4dc']]),
    R([[0, '#1d3496'], [0.5, '#3a63d6'], [1, '#6f93ff']]),
    R([[0, '#9c8a84'], [0.5, '#d9c7bd'], [1, '#f6ece6']]),
    R([[0, '#4e3526'], [0.45, '#a8805e'], [0.7, '#d9bfa4'], [1, '#f3e6d6']]),
    R([[0, '#625d58'], [0.6, '#a39d95'], [1, '#d8d2ca']]),
    R([[0, '#c9c7c4'], [1, '#ffffff']]),
    R([[0, '#c6c0b8'], [1, '#f4f0ea']]),
    R([[0, '#9a5a3a'], [0.6, '#c98b62'], [1, '#e8c0a0']]),
    R([[0, '#6e1e12'], [0.6, '#a83a22'], [1, '#d8704a']]),
    R([[0, '#7fb8ff'], [0.6, '#dff1ff'], [1, '#ffffff']]),
    R([[0, '#c8dcff'], [1, '#ffffff']]),
    R([[0, '#8a1e0a'], [0.5, '#e0502a'], [1, '#ffb080']]),
    R([[0, '#3a2a40'], [0.45, '#7a4a5a'], [0.55, '#c27a5a'], [1, '#f0c090']])
  ];
  const HX = {};
  const B = {};
  for (const h of ['#0d3e86', '#0f1d5c', '#1f6fc4', '#2f7d3a', '#3a2010', '#3a2418', '#5d5b58', '#5f9e46', '#6f8a5a', '#6fa8d0', '#7a3e26', '#7fd6e0', '#8a5a3a', '#8fa3a0', '#9a8a7a', '#a0524a', '#b8f0f4', '#c2502e', '#d0581f', '#d8b878', '#f2d7d0', '#f4f8ff', '#fbf3e8', '#fbf3ee']) HX[h] = hex(h);
  const def = (key, o) => { B[key] = Object.assign({ key, shade: true }, o); };
  def('sun', { name: 'The Sun', star: true, glow: '#ffb020', tex: (p) => { const n = fbm(p[0] * 9, p[1] * 9, p[2] * 9, 4), m = fbm(p[0] * 2, p[1] * 2, p[2] * 2, 3); return ramp(RP[0], n * 0.8 + m * 0.4 - 0.05); } });
  def('mercury', { name: 'Mercury', tex: (p, cr) => { const n = fbm(p[0] * 3, p[1] * 3, p[2] * 3); const k = craterShade(p, cr) ; return ramp(RP[1], n + k); }, cr: [140, 11, 0.03, 0.22] });
  def('venus', { name: 'Venus', atmo: '#ffe2a8', tex: (p) => { const w = fbm(p[0] * 2, p[1] * 2, p[2] * 2, 4); const n = fbm(p[0] * 1.5 + w * 2, p[1] * 4 + w * 1.5, p[2] * 1.5, 5); return ramp(RP[2], n * 1.3 - 0.15); } });
  def('earth', { name: 'Earth', atmo: '#8ccbff', spec: true, tex: (p, cr, lat, lon) => {
    const l = landAmount(lat, lon, p);
    const ice = Math.abs(lat) > 68 + fbm(p[0] * 6, p[1] * 6, p[2] * 6) * 10;
    let c;
    if (ice) c = HX['#f4f8ff'];
    else if (l > 0.5) {
      const dry = fbm(p[0] * 4 + 9, p[1] * 4, p[2] * 4);
      const desert = sstep(0.3, 0.05, Math.abs(Math.abs(lat) - 24) / 40) * sstep(0.45, 0.6, dry);
      c = mix(mix(HX['#2f7d3a'], HX['#5f9e46'], fbm(p[0] * 8, p[1] * 8, p[2] * 8)), HX['#d8b878'], desert);
      if (Math.abs(lat) > 55) c = mix(c, HX['#6f8a5a'], 0.5);
    } else c = mix(HX['#0d3e86'], HX['#1f6fc4'], sstep(0.2, 0.5, l));
    const cl = fbm(p[0] * 4 + 50, p[1] * 6, p[2] * 4 + 20, 5);
    const cloud = sstep(0.52, 0.72, cl);
    return mix(c, [255, 255, 255], cloud * 0.9);
  } });
  def('moon', { name: 'The Moon', tex: (p, cr) => { const n = fbm(p[0] * 2.2, p[1] * 2.2, p[2] * 2.2); const mare = sstep(0.5, 0.6, fbm(p[0] * 1.3 + 4, p[1] * 1.3, p[2] * 1.3, 4)); return mix(ramp(RP[3], n + craterShade(p, cr)), HX['#5d5b58'], mare * 0.7); }, cr: [90, 23, 0.03, 0.2] });
  def('mars', { name: 'Mars', atmo: '#ffb592', tex: (p, cr, lat) => {
    const n = fbm(p[0] * 2.5, p[1] * 2.5, p[2] * 2.5);
    let c = ramp(RP[4], n + craterShade(p, cr) * 0.6);
    const cap = sstep(72, 80, Math.abs(lat) + fbm(p[0] * 5, p[1] * 5, p[2] * 5) * 8);
    return mix(c, HX['#fbf3ee'], cap);
  }, cr: [40, 31, 0.03, 0.12] });
  def('phobos', { name: 'Phobos', tex: (p, cr) => ramp(RP[5], fbm(p[0] * 3, p[1] * 3, p[2] * 3) + craterShade(p, cr)), cr: [30, 41, 0.05, 0.4] });
  def('ceres', { name: 'Ceres', tex: (p, cr) => { const c = ramp(RP[6], fbm(p[0] * 3, p[1] * 3, p[2] * 3) + craterShade(p, cr)); return mix(c, [250, 250, 245], sstep(0.992, 0.998, p[0] * 0.3 + p[1] * 0.35 + p[2] * 0.89)); }, cr: [80, 51, 0.03, 0.18] });
  def('vesta', { name: 'Vesta', tex: (p, cr) => ramp(RP[7], fbm(p[0] * 3, p[1] * 3, p[2] * 3) + craterShade(p, cr)), cr: [60, 57, 0.04, 0.3] });
  def('jupiter', { name: 'Jupiter', atmo: '#f3dfbf', tex: (p, cr, lat, lon) => {
    const t = fbm(p[0] * 3, p[1] * 3, p[2] * 3, 4);
    const y = Math.sin(lat * Math.PI / 180) + (t - 0.5) * 0.18;
    const band = Math.sin(y * 22) * 0.5 + 0.5, band2 = Math.sin(y * 47 + 1) * 0.5 + 0.5;
    let c = ramp(RP[8], band * 0.75 + band2 * 0.25);
    if (Math.abs(lat) > 60) c = mix(c, HX['#9a8a7a'], 0.4);
    let dl = lon - 40; if (dl > 180) dl -= 360; if (dl < -180) dl += 360;
    const spot = Math.pow((lat + 22) / 6.5, 2) + Math.pow(dl / 14, 2);
    if (spot < 1) c = mix(c, HX['#c2502e'], sstep(1, 0.4, spot));
    return c;
  } });
  def('io', { name: 'Io', tex: (p) => { const n = fbm(p[0] * 3, p[1] * 3, p[2] * 3); let c = ramp(RP[9], n); const v = fbm(p[0] * 9, p[1] * 9, p[2] * 9, 3); if (v > 0.66) c = mix(c, HX['#3a2010'], sstep(0.66, 0.72, v)); else if (v > 0.6) c = mix(c, HX['#d0581f'], 0.6); return c; } });
  def('europa', { name: 'Europa', tex: (p) => { const n = fbm(p[0] * 2, p[1] * 2, p[2] * 2); let c = ramp(RP[10], n); const r = Math.abs(fbm(p[0] * 5, p[1] * 5, p[2] * 5, 4) - 0.5); if (r < 0.02) c = mix(c, HX['#8a5a3a'], 1 - r / 0.02); return c; } });
  def('ganymede', { name: 'Ganymede', tex: (p, cr) => { const n = fbm(p[0] * 2, p[1] * 2, p[2] * 2); return ramp(RP[11], n * 1.2 - 0.1 + craterShade(p, cr) * 0.7); }, cr: [50, 61, 0.02, 0.1] });
  def('callisto', { name: 'Callisto', tex: (p, cr) => ramp(RP[12], fbm(p[0] * 3, p[1] * 3, p[2] * 3) + craterShade(p, cr) * 1.4), cr: [160, 71, 0.015, 0.08] });
  def('saturn', { name: 'Saturn', atmo: '#f5e3b8', ring: { inner: 1.24, outer: 2.27, rot: -0.38, squash: 0.3, col: '#e3cf98' }, tex: (p, cr, lat) => {
    const t = fbm(p[0] * 3, p[1] * 3, p[2] * 3, 3);
    const y = Math.sin(lat * Math.PI / 180) + (t - 0.5) * 0.06;
    const band = Math.sin(y * 18) * 0.5 + 0.5;
    let c = ramp(RP[13], band * 0.7 + t * 0.3);
    if (lat > 70) c = mix(c, HX['#8fa3a0'], 0.5);
    return c;
  } });
  def('titan', { name: 'Titan', atmo: '#ffcf7a', tex: (p) => ramp(RP[14], fbm(p[0] * 1.5, p[1] * 3, p[2] * 1.5, 3)) });
  def('enceladus', { name: 'Enceladus', tex: (p, cr, lat) => { let c = ramp(RP[15], fbm(p[0] * 3, p[1] * 3, p[2] * 3) + craterShade(p, cr) * 0.5); if (lat < -55 && Math.abs(Math.sin(p[0] * 30)) < 0.15) c = mix(c, HX['#6fa8d0'], 0.6); return c; }, cr: [40, 81, 0.02, 0.1] });
  def('mimas', { name: 'Mimas', tex: (p, cr) => ramp(RP[16], fbm(p[0] * 3, p[1] * 3, p[2] * 3) + craterShade(p, cr)), cr: [[0.7, 0.05, 0.71, 0.4, Math.cos(0.4)]] });
  def('uranus', { name: 'Uranus', atmo: '#d9fbff', ring: { inner: 1.6, outer: 2.0, rot: 1.45, squash: 0.2, col: '#cfeef2', faint: true }, tilt: 1.7, tex: (p, cr, lat) => { const y = Math.sin(lat * Math.PI / 180); return mix(HX['#7fd6e0'], HX['#b8f0f4'], (Math.sin(y * 9) * 0.5 + 0.5) * 0.25 + fbm(p[0] * 2, p[1] * 2, p[2] * 2, 3) * 0.2); } });
  def('neptune', { name: 'Neptune', atmo: '#9fb8ff', tex: (p, cr, lat, lon) => {
    const t = fbm(p[0] * 3, p[1] * 3, p[2] * 3, 4);
    const y = Math.sin(lat * Math.PI / 180) + (t - 0.5) * 0.1;
    let c = ramp(RP[17], Math.sin(y * 10) * 0.25 + 0.5 + (t - 0.5) * 0.6);
    let dl = lon + 60; if (dl > 180) dl -= 360;
    if (Math.pow((lat + 20) / 6, 2) + Math.pow(dl / 12, 2) < 1) c = mix(c, HX['#0f1d5c'], 0.8);
    const streak = fbm(p[0] * 2, p[1] * 18, p[2] * 2, 3);
    if (streak > 0.68) c = mix(c, [255, 255, 255], (streak - 0.68) * 3);
    return c;
  } });
  def('triton', { name: 'Triton', tex: (p, cr, lat) => { let c = ramp(RP[18], fbm(p[0] * 4, p[1] * 4, p[2] * 4)); if (lat < -10) c = mix(c, HX['#f2d7d0'], 0.5); return c; } });
  def('pluto', { name: 'Pluto', tex: (p, cr, lat, lon) => {
    let c = ramp(RP[19], fbm(p[0] * 2.5, p[1] * 2.5, p[2] * 2.5));
    let dl = lon - 0; if (dl > 180) dl -= 360;
    const hx = dl / 26, hy = (lat - 2) / 24;
    const heart = Math.pow(hx * hx + hy * hy - 1, 3) - hx * hx * hy * hy * hy;
    c = mix(c, HX['#fbf3e8'], 0.9 * sstep(0.03, -0.05, heart + (fbm(p[0] * 8, p[1] * 8, p[2] * 8, 3) - 0.5) * 0.08));
    c = mix(c, HX['#3a2418'], 0.6 * sstep(-12, -24, lat) * sstep(70, 30, Math.abs(dl + 60)));
    return c;
  } });
  def('charon', { name: 'Charon', tex: (p, cr, lat) => { let c = ramp(RP[20], fbm(p[0] * 3, p[1] * 3, p[2] * 3) + craterShade(p, cr) * 0.6); if (lat > 62) c = mix(c, HX['#7a3e26'], 0.7); return c; }, cr: [30, 91, 0.03, 0.1] });
  def('eris', { name: 'Eris', tex: (p) => ramp(RP[21], fbm(p[0] * 3, p[1] * 3, p[2] * 3)) });
  def('haumea', { name: 'Haumea', tex: (p) => { let c = ramp(RP[22], fbm(p[0] * 3, p[1] * 3, p[2] * 3)); return mix(c, HX['#a0524a'], 0.6 * sstep(0.9, 0.96, p[0] * 0.2 + p[2] * 0.98)); } });
  def('makemake', { name: 'Makemake', tex: (p) => ramp(RP[23], fbm(p[0] * 3, p[1] * 3, p[2] * 3)) });
  def('sedna', { name: 'Sedna', tex: (p) => ramp(RP[24], fbm(p[0] * 3, p[1] * 3, p[2] * 3)) });
  def('comet', { name: 'Comet', tex: (p, cr) => ramp(RP[1], fbm(p[0] * 4, p[1] * 4, p[2] * 4) * 0.5 - 0.15 + craterShade(p, cr) * 0.5), cr: [20, 99, 0.05, 0.3] });
  def('neutron', { name: 'Neutron star', star: true, glow: '#7fc6ff', tex: (p) => ramp(RP[25], fbm(p[0] * 5, p[1] * 5, p[2] * 5)) });
  def('whitedwarf', { name: 'White dwarf', star: true, glow: '#cfe3ff', tex: (p) => ramp(RP[26], fbm(p[0] * 6, p[1] * 6, p[2] * 6)) });
  def('reddwarf', { name: 'Red dwarf', star: true, glow: '#ff6a3a', tex: (p) => ramp(RP[27], fbm(p[0] * 7, p[1] * 7, p[2] * 7, 4)) });
  def('exo', { name: 'Exoplanet', atmo: '#ffc79a', tex: (p, cr, lat) => { const n = fbm(p[0] * 2.5, p[1] * 2.5, p[2] * 2.5); let c = ramp(RP[28], n); if (Math.abs(lat) > 70) c = mix(c, [250, 250, 255], 0.7); return c; } });

  const texCache = {};
  function texture(key, tw = 256) {
    const id = key + ':' + tw;
    if (texCache[id]) return texCache[id];
    const b = B[key];
    const th = tw / 2;
    const data = new Uint8ClampedArray(tw * th * 3);
    let cr = [];
    if (b.cr) cr = Array.isArray(b.cr[0]) ? b.cr : craters(b.cr[0], b.cr[1], b.cr[2], b.cr[3]);
    for (let y = 0; y < th; y++) {
      const lat = 90 - (y + 0.5) / th * 180;
      const la = lat * Math.PI / 180, cl = Math.cos(la), sl = Math.sin(la);
      for (let x = 0; x < tw; x++) {
        const lon = (x + 0.5) / tw * 360 - 180;
        const lo = lon * Math.PI / 180;
        const p = [cl * Math.sin(lo), sl, cl * Math.cos(lo)];
        const c = b.tex(p, cr, lat, lon);
        const i = (y * tw + x) * 3;
        data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2];
      }
    }
    return (texCache[id] = { data, tw, th });
  }

  function Globe(key, size, opts = {}) {
    const b = B[key] || B.mercury;
    const tex = texture(b.key, opts.tw || (size > 200 ? 512 : 256));
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const g = cv.getContext('2d');
    const img = g.createImageData(size, size);
    const r = size / 2;
    const L = opts.light || [-0.55, -0.42, 0.72];
    const ll = Math.hypot(L[0], L[1], L[2]);
    const lx = L[0] / ll, ly = L[1] / ll, lz = L[2] / ll;
    const tilt = b.tilt != null ? b.tilt : (opts.tilt || 0.18);
    const ct = Math.cos(tilt), st = Math.sin(tilt);
    const atmo = b.atmo ? hex(b.atmo) : null;
    const px = [], lonA = [], rowA = [], shA = [], rimA = [], specA = [], alA = [];
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const nx = (x + 0.5 - r) / r, ny = (y + 0.5 - r) / r;
        const d2 = nx * nx + ny * ny;
        if (d2 > 1) continue;
        const nz = Math.sqrt(1 - d2);
        const edge = clamp((1 - Math.sqrt(d2)) * r * 1.2);
        const tx = nx * ct - ny * st, ty = nx * st + ny * ct;
        const lat = Math.asin(clamp(-ty, -1, 1));
        const lon = Math.atan2(tx, nz);
        let shade, rim = 0, spec = 0;
        if (b.star) {
          shade = 0.55 + 0.5 * Math.pow(nz, 0.45);
        } else if (opts.flat) {
          shade = 0.75 + 0.3 * nz;
        } else {
          const dl = nx * lx + ny * ly + nz * lz;
          shade = 0.06 + 0.98 * sstep(-0.12, 0.75, dl);
          if (atmo) rim = Math.pow(1 - nz, 2.4) * sstep(-0.3, 0.5, dl) * 0.85;
          if (b.spec) { const hz = lz + 1, hl = Math.hypot(lx, ly, hz); const hd = (nx * lx / hl + ny * ly / hl + nz * hz / hl); spec = Math.pow(clamp(hd), 40) * 0.6; }
        }
        px.push((y * size + x) * 4);
        lonA.push((lon / (Math.PI * 2) + 0.5) * tex.tw);
        rowA.push(Math.min(tex.th - 1, Math.floor((0.5 - lat / Math.PI) * tex.th)) * tex.tw);
        shA.push(shade); rimA.push(rim); specA.push(spec); alA.push(edge * 255);
      }
    }
    const n = px.length, data = img.data, td = tex.data, tw = tex.tw;
    let last = null;
    function render(rot = 0) {
      const off = ((rot / (Math.PI * 2)) % 1 + 1) % 1 * tw;
      if (last === off) return cv;
      last = off;
      for (let i = 0; i < n; i++) {
        const u = Math.floor(lonA[i] + off) % tw;
        const ti = (rowA[i] + u) * 3;
        const s = shA[i];
        let rr = td[ti] * s, gg = td[ti + 1] * s, bb = td[ti + 2] * s;
        if (atmo && rimA[i]) { const k = rimA[i]; rr += (atmo[0] - rr) * k; gg += (atmo[1] - gg) * k; bb += (atmo[2] - bb) * k; }
        if (specA[i]) { const k = specA[i] * (td[ti + 2] > td[ti] * 1.6 ? 1 : 0.2) * 255; rr += k; gg += k; bb += k; }
        const p = px[i];
        data[p] = rr; data[p + 1] = gg; data[p + 2] = bb; data[p + 3] = alA[i];
      }
      g.putImageData(img, 0, 0);
      return cv;
    }
    function rings(ctx, cx, cy, rad, front) {
      const rg = b.ring;
      if (!rg) return;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rg.rot);
      ctx.scale(1, rg.squash);
      ctx.beginPath();
      if (front) ctx.rect(-rad * 3, 0, rad * 6, rad * 3); else ctx.rect(-rad * 3, -rad * 3, rad * 6, rad * 3);
      ctx.clip();
      const col = hex(rg.col);
      const steps = 26;
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const rr = rad * (rg.inner + (rg.outer - rg.inner) * t);
        const gap = !rg.faint && t > 0.68 && t < 0.74;
        if (gap) continue;
        const a = rg.faint ? 0.18 : (0.35 + 0.5 * Math.abs(Math.sin(t * 9 + 1)) * (t < 0.2 ? 0.5 : 1));
        const shade = 0.75 + 0.25 * Math.sin(t * 23);
        ctx.strokeStyle = `rgba(${col[0] * shade | 0},${col[1] * shade | 0},${col[2] * shade | 0},${a})`;
        ctx.lineWidth = rad * (rg.outer - rg.inner) / steps * 1.15;
        ctx.beginPath(); ctx.arc(0, 0, rr, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
    }
    function draw(ctx, cx, cy, rad, rot = 0, o = {}) {
      if (b.star && o.glow !== false) {
        const gl = ctx.createRadialGradient(cx, cy, rad * 0.9, cx, cy, rad * 1.9);
        const c = hex(b.glow);
        gl.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},.55)`); gl.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
        ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(cx, cy, rad * 1.9, 0, Math.PI * 2); ctx.fill();
      } else if (atmo && o.glow !== false) {
        const gl = ctx.createRadialGradient(cx, cy, rad * 0.96, cx, cy, rad * 1.12);
        gl.addColorStop(0, `rgba(${atmo[0]},${atmo[1]},${atmo[2]},.35)`); gl.addColorStop(1, `rgba(${atmo[0]},${atmo[1]},${atmo[2]},0)`);
        ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(cx, cy, rad * 1.12, 0, Math.PI * 2); ctx.fill();
      }
      rings(ctx, cx, cy, rad, false);
      ctx.drawImage(render(rot), cx - rad, cy - rad, rad * 2, rad * 2);
      rings(ctx, cx, cy, rad, true);
    }
    return { key: b.key, body: b, canvas: cv, render, draw, size, hasRing: !!b.ring };
  }

  window.PlanetArt = { bodies: B, texture, Globe, noise, fbm, def, ramp, R, hex, mix };
})();
