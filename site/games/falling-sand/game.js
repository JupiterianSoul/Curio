(() => {
  const DATA = window.SANDLAB;
  const C = window.Curio;
  const $ = (s) => document.querySelector(s);

  const vw = Math.min(innerWidth, document.documentElement.clientWidth || innerWidth);
  const W = vw < 600 ? 150 : vw < 980 ? 240 : 300;
  const H = vw < 600 ? 170 : vw < 980 ? 170 : 200;
  const N = W * H;

  const MV = { none: 0, wall: 1, solid: 2, powder: 3, liquid: 4, gas: 5, fire: 6 };
  const DRAWS = { fire: 1, bluefire: 2, coldfire: 3, rainbow: 4, sparkle: 5, lit: 6, flicker: 7, hue: 8, blink: 9, electric: 10, blackhole: 11 };
  const keys = ['empty', ...Object.keys(DATA.els)];
  const NE = keys.length;
  const ID = Object.fromEntries(keys.map((k, i) => [k, i]));
  const E = keys.map((k) => (k === 'empty' ? { n: 'Empty', c: ['#000000'], m: 'none', cat: '' } : DATA.els[k]));

  const MOVE = new Uint8Array(NE), DENS = new Float32Array(NE), VISC = new Float32Array(NE), SPREAD = new Uint8Array(NE);
  const T0 = new Float32Array(NE), COND = new Float32Array(NE), THI = new Float32Array(NE), TLO = new Float32Array(NE);
  const BURN = new Float32Array(NE), IG = new Float32Array(NE), BT = new Int16Array(NE), BTEMP = new Float32Array(NE);
  const LMIN = new Int16Array(NE), LMAX = new Int16Array(NE), ELEC = new Uint8Array(NE), DRAW = new Uint8Array(NE);
  const HARD = new Float32Array(NE), BOOM = new Uint8Array(NE), EXT = new Uint8Array(NE), FIXT = new Float32Array(NE);
  const AMB = new Float32Array(NE), GLOW = new Uint8Array(NE), SLIDE = new Float32Array(NE), LIGHT = new Uint8Array(NE), SINGLE = new Uint8Array(NE);
  const SHI = [], SLO = [], BINTO = [], DECAY = [], FN = new Array(NE).fill(null);
  const resolve = (v) => (v == null ? null : (Array.isArray(v) ? v : [v]).map((s) => {
    if (!(s in ID)) throw new Error('Unknown element ' + s);
    return ID[s];
  }));

  E.forEach((e, t) => {
    const m = MV[e.m] ?? 0;
    MOVE[t] = m;
    DENS[t] = e.d ?? (m === 3 ? 1500 : m === 4 ? 1000 : m === 5 ? 1 : m === 6 ? 0.3 : 1e9);
    VISC[t] = e.v ?? 0;
    SPREAD[t] = VISC[t] < 0.35 ? 4 : VISC[t] < 0.8 ? 2 : 1;
    T0[t] = e.t ?? 20;
    COND[t] = e.k ?? 0.5;
    THI[t] = e.hi ? e.hi[0] : Infinity;
    TLO[t] = e.lo ? e.lo[0] : -Infinity;
    SHI[t] = e.hi ? resolve(e.hi[1]) : null;
    SLO[t] = e.lo ? resolve(e.lo[1]) : null;
    if (e.burn) {
      BURN[t] = e.burn[0]; IG[t] = e.burn[1]; BT[t] = e.burn[2];
      BINTO[t] = resolve(e.burn[3] ?? 'empty'); BTEMP[t] = e.burn[4] ?? 600;
    }
    if (e.boom) { BOOM[t] = e.boom; IG[t] = e.ig ?? 300; }
    if (e.life) { LMIN[t] = e.life[0]; LMAX[t] = e.life[1]; DECAY[t] = resolve(e.life[2] ?? 'empty'); }
    ELEC[t] = e.elec ? 1 : 0;
    DRAW[t] = DRAWS[e.draw] || 0;
    HARD[t] = e.hard ?? (m === 1 ? 1 : 0);
    EXT[t] = e.ext ? 1 : 0;
    FIXT[t] = e.fix ?? (m === 6 ? T0[t] : NaN);
    if (e.fix != null) T0[t] = e.fix;
    GLOW[t] = e.glow ? 1 : 0;
    AMB[t] = e.amb ?? 0.004;
    SLIDE[t] = e.slide ?? 1;
    LIGHT[t] = e.light ? 1 : 0;
    SINGLE[t] = e.single ? 1 : 0;
  });
  ['person', 'meteor', 'lightning', 'explosion'].forEach((k) => (SINGLE[ID[k]] = 1));
  const HOTPAINT = new Uint8Array(NE);
  ['fire', 'blue_fire', 'ember', 'plasma'].forEach((k) => (HOTPAINT[ID[k]] = 1));
  const CRATE = new Float32Array(NE).fill(0.2);
  CRATE[ID.fireworks] = 0.03; CRATE[ID.lava] = 0.6; CRATE[ID.person] = 0.01; CRATE[ID.head] = 0.01;
  const SPARSE = new Float32Array(NE);
  ['ant', 'worm', 'fish', 'jellyfish', 'bird', 'butterfly', 'bee', 'firefly', 'snail'].forEach((k) => (SPARSE[ID[k]] = 0.08));

  const RL = [];
  const RX = new Int32Array(NE * NE).fill(-1);
  const HASR = new Uint8Array(NE);
  let ruleCount = 0;
  const arr = (v) => (Array.isArray(v) ? v : [v]);
  for (const [A, B, a2, b2, p, o = {}] of DATA.reactions) {
    ruleCount++;
    for (const a of arr(A)) for (const b of arr(B)) {
      const ia = ID[a], ib = ID[b];
      if (ia == null || ib == null) throw new Error('Bad reaction ' + a + '+' + b);
      const res = (v, self) => (v == null ? null : v === '@lo' ? (SLO[self] || [self]) : resolve(v));
      const ra = res(a2, ia), rb = res(b2, ib);
      const r = { a2: ra, b2: rb, p, tMin: o.tMin ?? -Infinity, tMax: o.tMax ?? Infinity };
      RX[ia * NE + ib] = RL.length; RL.push(r);
      if (RX[ib * NE + ia] < 0) { RX[ib * NE + ia] = RL.length; RL.push({ a2: rb, b2: ra, p, tMin: r.tMin, tMax: r.tMax }); }
      HASR[ia] = 1; HASR[ib] = 1;
    }
  }
  const pairSet = new Set();
  for (let a = 0; a < NE; a++) for (let b = 0; b < NE; b++) if (RX[a * NE + b] >= 0) pairSet.add(a < b ? a + ':' + b : b + ':' + a);
  const REACTIONS = pairSet.size;
  const visible = keys.filter((k, i) => i > 0 && !E[i].hide);

  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const cl = (v) => (v < 0 ? 0 : v > 255 ? 255 : v | 0);
  const pack = (r, g, b) => ((255 << 24) | (cl(b) << 16) | (cl(g) << 8) | cl(r)) >>> 0;
  const PAL = new Uint32Array(NE * 8);
  const LITC = new Uint32Array(NE);
  E.forEach((e, t) => {
    const cols = (Array.isArray(e.c) ? e.c : [e.c]).map(hex);
    const vary = e.vary ?? 9;
    for (let s = 0; s < 8; s++) {
      const base = cols[s % cols.length];
      const off = ((((s * 5) % 8) / 7) - 0.5) * 2 * vary;
      PAL[t * 8 + s] = pack(base[0] + off, base[1] + off, base[2] + off);
    }
    if (e.lit) { const l = hex(e.lit); LITC[t] = pack(l[0], l[1], l[2]); }
    else LITC[t] = pack(cols[0][0] + 90, cols[0][1] + 90, cols[0][2] + 60);
  });
  const ramp = (stops, n) => {
    const out = new Uint32Array(n);
    for (let i = 0; i < n; i++) {
      const f = (i / (n - 1)) * (stops.length - 1), k = Math.min(stops.length - 2, Math.floor(f)), u = f - k;
      const a = stops[k], b = stops[k + 1];
      out[i] = pack(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u);
    }
    return out;
  };
  const FIREPAL = ramp([[150, 30, 10], [235, 70, 15], [255, 140, 30], [255, 210, 80], [255, 250, 200]], 64);
  const BLUEPAL = ramp([[20, 40, 160], [40, 110, 255], [120, 190, 255], [230, 245, 255]], 64);
  const COLDPAL = ramp([[40, 120, 200], [110, 220, 255], [200, 250, 255], [255, 255, 255]], 64);
  const HUEPAL = new Uint32Array(64);
  for (let h = 0; h < 64; h++) {
    const a = (h / 64) * 6, k = Math.floor(a), f = a - k;
    const rgb = [[1, f, 0], [1 - f, 1, 0], [0, 1, f], [0, 1 - f, 1], [f, 0, 1], [1, 0, 1 - f]][k % 6];
    HUEPAL[h] = pack(70 + rgb[0] * 185, 70 + rgb[1] * 185, 70 + rgb[2] * 185);
  }
  const HEATPAL = ramp([[40, 0, 120], [30, 60, 220], [30, 160, 230], [40, 40, 50], [200, 40, 30], [255, 140, 20], [255, 240, 120], [255, 255, 255]], 256);
  const heatIdx = (T) => {
    let v;
    if (T < 20) v = 109 - Math.min(109, Math.sqrt((20 - T) / 290) * 109);
    else v = 109 + Math.min(146, Math.log10(1 + (T - 20) / 15) * 58);
    return v | 0;
  };
  const WHITE = pack(255, 255, 255), ZAP = pack(255, 246, 140), CHARGE = pack(255, 230, 90);
  const BGROW = new Uint32Array(H);
  for (let y = 0; y < H; y++) { const f = y / H; BGROW[y] = pack(17 + f * 10, 15 + f * 8, 26 + f * 10); }

  const type = new Uint16Array(N), temp = new Float32Array(N), life = new Int16Array(N), data = new Int32Array(N);
  const shade = new Uint8Array(N), flag = new Uint8Array(N), chg = new Uint8Array(N), cd = new Uint8Array(N);
  const stamp = new Uint8Array(N);
  temp.fill(20);

  let seed = (Math.random() * 2147483647) | 1;
  const rnd = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967296; };
  const pick = (a) => (a.length === 1 ? a[0] : a[(rnd() * a.length) | 0]);

  const CS = 16, CW = Math.ceil(W / CS), CH = Math.ceil(H / CS);
  let act = new Uint8Array(CW * CH).fill(1), nxt = new Uint8Array(CW * CH).fill(1);
  function wake(x, y) {
    const cx = x >> 4, cy = y >> 4, b = cy * CW + cx, lx = x & 15, ly = y & 15;
    nxt[b] = 1;
    if (lx === 0 && cx > 0) nxt[b - 1] = 1; else if (lx === 15 && cx < CW - 1) nxt[b + 1] = 1;
    if (ly === 0 && cy > 0) nxt[b - CW] = 1; else if (ly === 15 && cy < CH - 1) nxt[b + CW] = 1;
  }
  const wakeI = (i) => wake(i % W, (i / W) | 0);
  const wakeAll = () => nxt.fill(1);

  let SV = 1, TK = 0, busy = false, frameNo = 0;

  function setCell(i, t) {
    type[i] = t;
    temp[i] = T0[t];
    life[i] = LMAX[t] ? LMIN[t] + ((rnd() * (LMAX[t] - LMIN[t] + 1)) | 0) : 0;
    data[i] = 0; shade[i] = (rnd() * 8) | 0; flag[i] = 0; chg[i] = 0; cd[i] = 0;
    wakeI(i);
  }
  function morph(i, t) {
    const T = temp[i];
    setCell(i, t);
    if (t && FIXT[t] !== FIXT[t]) temp[i] = T;
  }
  function swap(i, j) {
    let a = type[i]; type[i] = type[j]; type[j] = a;
    const f = temp[i]; temp[i] = temp[j]; temp[j] = f;
    a = life[i]; life[i] = life[j]; life[j] = a;
    a = data[i]; data[i] = data[j]; data[j] = a;
    a = shade[i]; shade[i] = shade[j]; shade[j] = a;
    a = flag[i]; flag[i] = flag[j]; flag[j] = a;
    a = chg[i]; chg[i] = chg[j]; chg[j] = a;
    a = cd[i]; cd[i] = cd[j]; cd[j] = a;
    stamp[i] = SV; stamp[j] = SV;
    wakeI(i); wakeI(j);
  }
  const DX8 = [0, 0, -1, 1, -1, 1, -1, 1], DY8 = [-1, 1, 0, 0, -1, -1, 1, 1];
  function nb(i, x, y, r) {
    const nx = x + DX8[r], ny = y + DY8[r];
    if (nx < 0 || nx >= W || ny < 0 || ny >= H) return -1;
    return i + DY8[r] * W + DX8[r];
  }
  const nb4 = (i, x, y) => nb(i, x, y, (rnd() * 4) | 0);
  const nb8 = (i, x, y) => nb(i, x, y, (rnd() * 8) | 0);
  const isFluid = (u) => u === 0 || MOVE[u] >= 4;
  function canFall(t, j) {
    const u = type[j];
    if (!u) return true;
    const m = MOVE[u];
    return m >= 4 && DENS[u] < DENS[t] && (m !== 4 || rnd() < 0.55);
  }
  function ignite(i) {
    const t = type[i];
    if (!BURN[t] || flag[i] & 1) return;
    flag[i] |= 1;
    life[i] = Math.max(1, (BT[t] * (0.7 + rnd() * 0.6)) | 0);
    wakeI(i);
  }

  const S = ID;
  const FIRE = S.fire, SMOKE = S.smoke, STEAM = S.steam, WATER = S.water, PERSON = S.person, HEAD = S.head;
  const LIGHTNING = S.lightning, SPARK = S.firework_spark, PUMP = S.pump, GOLD = S.gold, BLACK_HOLE = S.black_hole;
  const set = (list) => { const s = new Uint8Array(NE); list.forEach((k) => (s[ID[k]] = 1)); return s; };
  const SOIL = set(['dirt', 'mud', 'grass', 'clay', 'dead_plant']);
  const WATERY = set(['water', 'salt_water', 'sugar_water', 'dirty_water']);
  const DIGGABLE = set(['dirt', 'sand', 'mud', 'red_sand', 'clay', 'ash', 'grass']);
  const WORMABLE = set(['dirt', 'mud', 'clay', 'dead_plant', 'ash']);
  const STONY = set(['stone', 'rock', 'basalt', 'granite', 'brick', 'concrete', 'marble', 'limestone', 'sandstone', 'gravel']);
  const CLEAR = set(['glass', 'water', 'salt_water', 'sugar_water', 'ice', 'diamond', 'quartz', 'liquid_nitrogen', 'slush', 'glass_shard', 'crystal']);
  const NOCLONE = set(['clone', 'void', 'drain', 'wall', 'portal_in', 'portal_out', 'black_hole', 'white_hole']);
  const VOIDSAFE = set(['void', 'wall', 'clone', 'drain', 'portal_in', 'portal_out', 'black_hole', 'white_hole', 'sun']);
  const INFECT = new Uint8Array(NE);
  for (let t = 1; t < NE; t++) INFECT[t] = HARD[t] < 0.9 && !NOCLONE[t] && E[t].cat !== 'machines' && t !== S.virus ? 1 : 0;
  const RANDOMS = visible.map((k) => ID[k]).filter((t) => !SINGLE[t] && !NOCLONE[t] && !['random', 'nuke', 'virus', 'antimatter', 'filler', 'midas', 'everfrost', 'sun', 'c4', 'tnt'].includes(keys[t]));
  const WHITE_OUT = ['sand', 'water', 'glitter', 'confetti', 'stardust', 'flower', 'seed', 'popcorn', 'candy', 'bubble', 'salt', 'fire', 'plasma', 'honey', 'slime', 'snow'].map((k) => ID[k]);

  let portalsOut = [], nextPortals = [];
  let lastBeep = 0;
  function sfx(freq, dur, type, vol) {
    const now = performance.now();
    if (now - lastBeep < 70) return;
    lastBeep = now;
    C.beep(freq, dur, type, vol);
  }
  let flashAmt = 0;

  function explode(cx, cy, r) {
    const r2 = r * r;
    for (let dy = -r; dy <= r; dy++) {
      const y = cy + dy; if (y < 0 || y >= H) continue;
      for (let dx = -r; dx <= r; dx++) {
        const x = cx + dx; if (x < 0 || x >= W) continue;
        const d2 = dx * dx + dy * dy; if (d2 > r2) continue;
        const j = y * W + x, u = type[j], f = 1 - d2 / r2;
        if (u) {
          if (HARD[u] >= 1) continue;
          if (HARD[u] > 0 && rnd() < HARD[u]) { temp[j] += 300 * f; wakeI(j); continue; }
          if (BOOM[u] || u === S.nuke) { temp[j] = Math.max(temp[j], IG[u] + 60, 600); wakeI(j); continue; }
        }
        if (rnd() < 0.6 * f + 0.15) {
          const k = rnd();
          setCell(j, k < 0.5 * f + 0.15 ? FIRE : k < 0.75 ? 0 : SMOKE);
          if (type[j] === SMOKE) temp[j] = 300;
        } else if (u) { temp[j] += 700 * f; wakeI(j); }
      }
    }
    flashAmt = Math.min(0.85, flashAmt + r / 30);
    sfx(60 + Math.random() * 30, Math.min(0.9, 0.2 + r / 25), 'sawtooth', 0.22);
  }
  let clist = [];
  function charge(n) {
    if (chg[n] || cd[n] || !ELEC[type[n]]) return;
    chg[n] = 1; clist.push(n); wakeI(n);
  }
  function elecPass() {
    const list = clist;
    clist = [];
    for (let k = 0; k < list.length; k++) {
      const i = list[k], t = type[i];
      if (!chg[i] || !ELEC[t]) { chg[i] = 0; continue; }
      chg[i] = 0; cd[i] = 12;
      const x = i % W, y = (i / W) | 0;
      chargeAround(i, x, y);
      onCharge(i, x, y, t);
    }
  }
  function chargeAround(i, x, y) {
    for (let r = 0; r < 4; r++) {
      const n = nb(i, x, y, r);
      if (n >= 0) charge(n);
    }
  }
  function onCharge(i, x, y, t) {
    if (LIGHT[t]) {
      life[i] = 40;
      if (t === S.speaker) sfx(180 + (H - y) * 7, 0.06, 'square', 0.06);
    } else if (t === S.c4) { setCell(i, 0); explode(x, y, BOOM[t]); }
    else if (t === S.fireworks) setCell(i, S.rocket);
    else if (t === S.igniter) {
      for (let r = 0; r < 8; r++) {
        const n = nb(i, x, y, r);
        if (n < 0) continue;
        if (type[n] === 0 && rnd() < 0.5) setCell(n, FIRE); else if (BURN[type[n]]) ignite(n); else temp[n] += 40;
      }
    } else if (t === S.salt_water && rnd() < 0.04) setCell(i, rnd() < 0.66 ? S.hydrogen : S.oxygen);
    else if (t === S.neon) life[i] = 10;
  }

  function strike(cx, cy) {
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      const x = cx + dx, y = cy + dy;
      if (x < 0 || x >= W || y < 0 || y >= H) continue;
      const d2 = dx * dx + dy * dy; if (d2 > 10) continue;
      const j = y * W + x, u = type[j];
      if (!u) continue;
      if (ELEC[u]) charge(j);
      temp[j] += 2200 * (1 - d2 / 11);
      if (BURN[u]) ignite(j);
      wakeI(j);
    }
    flashAmt = Math.min(0.6, flashAmt + 0.35);
    sfx(1200, 0.12, 'square', 0.08);
  }

  function walker(i, x, y, t, speed, dig, edgeShy) {
    busy = true;
    if (y < H - 1 && canFall(t, i + W)) return false;
    if (rnd() > speed) return true;
    let d = data[i] || (rnd() < 0.5 ? -1 : 1);
    if (rnd() < 0.02) d = -d;
    const nx = x + d;
    if (nx < 0 || nx >= W) { data[i] = -d; return true; }
    const s = i + d;
    if (type[s] === 0) {
      if (edgeShy && y < H - 1 && type[s + W] === 0 && rnd() < 0.7) { data[i] = -d; return true; }
      swap(i, s); data[s] = d; return true;
    }
    if (y > 0 && type[i - W] === 0 && type[s - W] === 0) { swap(i, s - W); data[s - W] = d; return true; }
    if (dig && DIGGABLE[type[s]] && rnd() < 0.08) { swap(i, s); data[s] = d; return true; }
    data[i] = -d;
    return true;
  }
  function flyer(i, x, y, speed, upBias) {
    busy = true;
    if (rnd() > speed) return true;
    let d = data[i] || (rnd() < 0.5 ? -1 : 1);
    if (rnd() < 0.03) d = -d;
    const r = rnd();
    let dy = r < upBias ? -1 : r < upBias * 2 ? 1 : 0;
    if (y > H - 5) dy = -1;
    const nx = x + d, ny = y + dy;
    if (nx < 0 || nx >= W || ny < 0 || ny >= H) { data[i] = -d; return true; }
    const j = ny * W + nx;
    if (type[j] === 0) { swap(i, j); data[j] = d; return true; }
    data[i] = -d;
    if (y > 0 && type[i - W] === 0 && rnd() < 0.5) swap(i, i - W);
    return true;
  }
  function swimmer(i, x, y, speed, vert) {
    let wet = 0;
    for (let r = 0; r < 4; r++) { const n = nb(i, x, y, r); if (n >= 0 && WATERY[type[n]]) wet++; }
    if (!wet) {
      busy = true;
      if (y > 0 && y < H - 1 && type[i + W] && type[i - W] === 0 && rnd() < 0.02) { swap(i, i - W); return true; }
      return false;
    }
    busy = true;
    if (rnd() > speed) return true;
    let d = data[i] || (rnd() < 0.5 ? -1 : 1);
    if (rnd() < 0.03) d = -d;
    const dy = rnd() < vert ? (rnd() < 0.5 ? -1 : 1) : 0;
    const nx = x + d, ny = y + dy;
    if (nx < 0 || nx >= W || ny < 0 || ny >= H) { data[i] = -d; return true; }
    const j = ny * W + nx;
    if (WATERY[type[j]]) { swap(i, j); data[j] = d; } else data[i] = -d;
    return true;
  }
  function canopy(cx, cy, r) {
    for (let dy = -r; dy <= Math.ceil(r / 2); dy++) for (let dx = -r - 1; dx <= r + 1; dx++) {
      const x = cx + dx, y = cy + dy;
      if (x < 0 || x >= W || y < 0 || y >= H) continue;
      if ((dx * dx) / ((r + 1) * (r + 1)) + (dy * dy) / (r * r) > 1) continue;
      const j = y * W + x;
      if (type[j] === 0 && rnd() < 0.85) setCell(j, S.leaf);
    }
    for (let k = 1; k < r; k++) {
      for (const s of [-1, 1]) {
        const x = cx + s * k, y = cy - (k >> 1);
        if (x >= 0 && x < W && y >= 0 && rnd() < 0.7) setCell(y * W + x, S.wood);
      }
    }
  }
  function moveTo(i, j) { swap(i, j); return j; }

  const F = {
    plant: () => true,
    seed(i, x, y) {
      if (y < H - 1 && SOIL[type[i + W]]) {
        busy = true;
        if (rnd() < 0.03) { setCell(i, S.sprout); data[i] = 8 + ((rnd() * 16) | 0); }
        return true;
      }
      return false;
    },
    sprout(i, x, y) {
      busy = true;
      if (rnd() > 0.07) return true;
      const bloom = () => {
        const sh = (rnd() * 8) | 0;
        setCell(i, S.flower); shade[i] = sh;
        for (const n of [i - 1, i + 1, i - W, i - W - 1, i - W + 1]) {
          if (n >= 0 && n < N && type[n] === 0 && Math.abs((n % W) - x) <= 1 && rnd() < 0.8) { setCell(n, S.flower); shade[n] = sh; }
        }
        if (y > 1 && type[i - W] === S.flower) { shade[i] = 4; }
      };
      if (data[i] <= 0 || y < 2) { bloom(); return true; }
      const up = i - W;
      if (type[up] === 0) {
        const h = data[i];
        setCell(up, S.sprout); data[up] = h - 1; stamp[up] = SV;
        setCell(i, S.plant);
        if (rnd() < 0.3) {
          const sd = rnd() < 0.5 ? -1 : 1;
          if (x + sd >= 0 && x + sd < W && type[i + sd] === 0) setCell(i + sd, S.plant);
        }
      } else if (rnd() < 0.2) bloom();
      return true;
    },
    grass(i, x, y) {
      busy = true;
      if (rnd() < 0.006) {
        const n = nb8(i, x, y);
        if (n >= W && type[n] === S.dirt && type[n - W] === 0) setCell(n, S.grass);
      }
      if (y > 0 && rnd() < 0.004) {
        const u = type[i - W];
        if (u && (MOVE[u] === 3 || MOVE[u] === 2) && E[u].cat !== 'life') morph(i, S.dirt);
      }
      return true;
    },
    sapling(i, x, y) {
      if (y < H - 1 && SOIL[type[i + W]]) {
        busy = true;
        if (rnd() < 0.03) { setCell(i, S.tree_tip); data[i] = 14 + ((rnd() * 22) | 0); }
        return true;
      }
      return false;
    },
    treetip(i, x, y) {
      busy = true;
      if (rnd() > 0.09) return true;
      const h = data[i];
      if (h <= 0 || y < 4) { canopy(x, y, 4 + ((rnd() * 3) | 0)); setCell(i, S.wood); return true; }
      let nx = x;
      if (h < 14 && rnd() < 0.18) nx += rnd() < 0.5 ? -1 : 1;
      if (nx < 0 || nx >= W) nx = x;
      const up = (y - 1) * W + nx;
      if (type[up] === 0 || type[up] === S.leaf) {
        setCell(up, S.tree_tip); data[up] = h - 1; stamp[up] = SV;
        setCell(i, S.wood);
        if (h < 12 && rnd() < 0.12) {
          const sd = rnd() < 0.5 ? -1 : 1;
          let bx = x, by = y;
          for (let k = 0; k < 3 + rnd() * 3; k++) {
            bx += sd; by -= rnd() < 0.5 ? 1 : 0;
            if (bx < 0 || bx >= W || by < 0) break;
            const b = by * W + bx;
            if (type[b] !== 0 && type[b] !== S.leaf) break;
            setCell(b, S.wood);
          }
          canopy(bx, by, 2);
        }
      } else { canopy(x, y, 3 + ((rnd() * 2) | 0)); setCell(i, S.wood); }
      return true;
    },
    spore(i, x, y) {
      if (y < H - 1) {
        const u = type[i + W];
        if ((u === S.dirt || u === S.wood || u === S.mud || u === S.grass || u === S.dead_plant) && rnd() < 0.05) {
          setCell(i, S.mush_tip); data[i] = 2 + ((rnd() * 4) | 0); return true;
        }
      }
      return false;
    },
    mushtip(i, x, y) {
      busy = true;
      if (rnd() > 0.05) return true;
      if (data[i] > 0 && y > 3 && type[i - W] === 0) {
        setCell(i - W, S.mush_tip); data[i - W] = data[i] - 1; stamp[i - W] = SV;
        setCell(i, S.mushroom_stem);
        return true;
      }
      const r = 2 + ((rnd() * 2) | 0);
      for (let dy = -r; dy <= 0; dy++) for (let dx = -r - 1; dx <= r + 1; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || xx >= W || yy < 0) continue;
        if ((dx * dx) / ((r + 1.5) * (r + 1.5)) + (dy * dy) / ((r + 0.5) * (r + 0.5)) > 1) continue;
        const j = yy * W + xx;
        if (type[j] === 0 || j === i) { setCell(j, S.mushroom); shade[j] = rnd() < 0.18 ? 2 : (rnd() < 0.5 ? 0 : 1); }
      }
      return true;
    },
    moss(i, x, y) {
      busy = true;
      if (rnd() > 0.004 || (data[i] & 255) > 18) return true;
      const n = nb8(i, x, y);
      if (n < 0 || type[n] !== 0) return true;
      const nx = n % W, ny = (n / W) | 0;
      for (let r = 0; r < 4; r++) {
        const m = nb(n, nx, ny, r);
        if (m >= 0 && STONY[type[m]]) { setCell(n, S.moss); data[n] = (data[i] & 255) + 1; break; }
      }
      return true;
    },
    cactus(i, x, y) {
      const d = data[i];
      if (d >= 1000) return true;
      if (d === 0) {
        if (y < H - 1 && (type[i + W] === S.sand || type[i + W] === S.red_sand)) data[i] = 1;
        else return true;
      }
      busy = true;
      if (rnd() > 0.01) return true;
      const h = data[i], max = 6 + ((x * 7) % 5);
      if (h < max && y > 0 && type[i - W] === 0) { setCell(i - W, S.cactus); data[i - W] = h + 1; }
      if (h === 3 || h === 4) {
        const sd = rnd() < 0.5 ? -1 : 1;
        if (rnd() < 0.5 && x + sd * 2 >= 0 && x + sd * 2 < W && type[i + sd] === 0 && type[i + sd * 2] === 0) {
          setCell(i + sd, S.cactus); data[i + sd] = 1000;
          setCell(i + sd * 2, S.cactus); data[i + sd * 2] = max - 2;
        }
      }
      data[i] = 1000;
      return true;
    },
    vine(i, x, y) {
      if (data[i] >= 1000) return true;
      busy = true;
      if (rnd() > 0.02) return true;
      if (y < H - 1 && type[i + W] === 0 && data[i] < 25 + (x % 9)) { setCell(i + W, S.vine); data[i + W] = data[i] + 1; }
      data[i] = 1000;
      return true;
    },
    coral(i, x, y) {
      busy = true;
      if (rnd() > 0.004 || data[i] > 14) return true;
      const n = nb8(i, x, y);
      if (n >= 0 && type[n] === S.salt_water && n < i + W) { const sh = shade[i]; setCell(n, S.coral); shade[n] = sh; data[n] = data[i] + 1; }
      return true;
    },
    algae(i, x, y) {
      let wet = 0;
      for (let r = 0; r < 4; r++) { const n = nb(i, x, y, r); if (n >= 0 && WATERY[type[n]]) wet++; }
      if (!wet) return false;
      busy = true;
      if (rnd() < 0.05) { const n = nb4(i, x, y); if (n >= 0 && WATERY[type[n]]) swap(i, n); }
      else if (rnd() < 0.003 && data[i] < 6) {
        const n = nb4(i, x, y);
        if (n >= 0 && WATERY[type[n]]) { setCell(n, S.algae); data[n] = data[i] + 1; }
      }
      return true;
    },
    ant: (i, x, y, t) => walker(i, x, y, t, 0.35, true, false),
    snail: (i, x, y, t) => walker(i, x, y, t, 0.03, false, true),
    worm(i, x, y, t) {
      busy = true;
      if (y < H - 1 && canFall(t, i + W)) return false;
      if (rnd() > 0.12) return true;
      const n = nb4(i, x, y);
      if (n >= 0 && WORMABLE[type[n]]) swap(i, n);
      return true;
    },
    fish: (i, x, y) => swimmer(i, x, y, 0.35, 0.18),
    jelly: (i, x, y) => swimmer(i, x, y, 0.08, 0.6),
    bird: (i, x, y) => flyer(i, x, y, 0.55, 0.22),
    butterfly: (i, x, y) => flyer(i, x, y, 0.3, 0.38),
    firefly: (i, x, y) => flyer(i, x, y, 0.15, 0.4),
    bee(i, x, y) {
      if (rnd() < 0.03) {
        const n = nb8(i, x, y);
        if (n >= 0 && type[n] === S.flower && rnd() < 0.08 && y < H - 1 && type[i + W] === 0) setCell(i + W, S.honey);
      }
      return flyer(i, x, y, 0.5, 0.35);
    },
    hive(i, x, y) {
      busy = true;
      if (rnd() < 0.0005) { const n = nb8(i, x, y); if (n >= 0 && type[n] === 0) setCell(n, S.bee); }
      if (rnd() < 0.0004 && y < H - 1 && type[i + W] === 0) setCell(i + W, S.honey);
      return true;
    },
    person(i, x, y) {
      busy = true;
      let head = y > 0 && type[i - W] === HEAD;
      if (!head && y > 0 && type[i - W] === 0) { setCell(i - W, HEAD); stamp[i - W] = SV; head = true; }
      if (temp[i] > 150 || flag[i] & 1) {
        setCell(i, SMOKE); if (head) setCell(i - W, SMOKE);
        return true;
      }
      if (temp[i] < -40) { setCell(i, S.ice); if (head) setCell(i - W, S.ice); return true; }
      if (y < H - 1) {
        const b = i + W, u = type[b];
        if (u === 0 || (MOVE[u] >= 4 && DENS[u] < 1100 && MOVE[u] !== 4) || (MOVE[u] === 4 && rnd() < 0.3)) {
          swap(i, b); if (head) swap(i - W, i);
          return true;
        }
      }
      if (head && y > 1 && MOVE[type[i - 2 * W]] === 4 && rnd() < 0.35) {
        swap(i - W, i - 2 * W); swap(i, i - W);
        return true;
      }
      const hot = temp[i] > 55;
      if (rnd() > (hot ? 0.6 : 0.12)) return true;
      let d = data[i] || (rnd() < 0.5 ? -1 : 1);
      if (rnd() < 0.02) d = -d;
      const nx = x + d;
      if (nx < 0 || nx >= W) { data[i] = -d; return true; }
      const free = (c) => c >= 0 && (type[c] === 0 || MOVE[type[c]] >= 5);
      const s = i + d, sh = s - W;
      if (free(s) && (!head || free(sh))) {
        swap(i, s); if (head) swap(i - W, sh);
        data[s] = d; return true;
      }
      if (y > 1 && !free(s) && free(sh) && free(sh - W)) {
        if (head) swap(i - W, sh - W);
        swap(i, sh); data[sh] = d; return true;
      }
      data[i] = -d;
      return true;
    },
    head(i, x, y) {
      if (y >= H - 1 || type[i + W] !== PERSON) { setCell(i, PERSON); return true; }
      if (temp[i] > 150) { setCell(i, SMOKE); return true; }
      return true;
    },
    popcorn(i, x, y) {
      if (data[i]) return false;
      data[i] = 1; busy = true;
      let j = i, yy = y, xx = x;
      const k = 2 + ((rnd() * 6) | 0);
      for (let s = 0; s < k; s++) {
        if (yy <= 0) break;
        const dx = rnd() < 0.3 ? (rnd() < 0.5 ? -1 : 1) : 0;
        if (xx + dx < 0 || xx + dx >= W) break;
        const n = j - W + dx;
        if (type[n] !== 0) break;
        j = moveTo(j, n); yy--; xx += dx;
      }
      sfx(500 + Math.random() * 400, 0.03, 'triangle', 0.1);
      return true;
    },
    soda(i, x, y) {
      busy = true;
      if (y > 0 && rnd() < 0.002 && type[i - W] === 0) { setCell(i - W, S.bubble); life[i - W] = 15 + ((rnd() * 25) | 0); }
      return false;
    },
    battery(i, x, y) { busy = true; chargeAround(i, x, y); return true; },
    lit(i, x, y, t) {
      if (life[i] > 0) {
        life[i]--; busy = true;
        if (t === S.light_bulb && temp[i] < 160) temp[i] += 0.8;
      }
      return true;
    },
    sensor(i, x, y) {
      for (let r = 0; r < 8; r++) {
        const n = nb(i, x, y, r);
        if (n < 0) continue;
        const u = type[n];
        if (u && !ELEC[u] && u !== S.sensor && MOVE[u] !== 1) { busy = true; chargeAround(i, x, y); return true; }
      }
      return true;
    },
    solar(i, x, y) {
      busy = true;
      if (rnd() > 0.06) return true;
      for (let yy = y - 1; yy >= 0; yy--) {
        const u = type[yy * W + x];
        if (u && MOVE[u] !== 5 && u !== S.solar_panel) return true;
      }
      chargeAround(i, x, y);
      return true;
    },
    pump(i, x, y) {
      let src = -1;
      if (y < H - 1 && MOVE[type[i + W]] === 4) src = i + W;
      else if (x > 0 && MOVE[type[i - 1]] === 4) src = i - 1;
      else if (x < W - 1 && MOVE[type[i + 1]] === 4) src = i + 1;
      if (src < 0) return true;
      let k = i - W;
      while (k >= 0 && type[k] === PUMP) k -= W;
      if (k >= 0 && type[k] === 0) { swap(src, k); busy = true; }
      return true;
    },
    faucet(i, x, y) {
      busy = true;
      if (y < H - 1 && type[i + W] === 0 && rnd() < 0.5) setCell(i + W, WATER);
      return true;
    },
    clone(i, x, y) {
      busy = true;
      if (!data[i]) {
        for (let r = 0; r < 8; r++) {
          const n = nb(i, x, y, r);
          if (n >= 0 && type[n] && !NOCLONE[type[n]]) { data[i] = type[n] === HEAD ? PERSON : type[n]; break; }
        }
        return true;
      }
      if (rnd() < CRATE[data[i]]) { const n = nb4(i, x, y); if (n >= 0 && type[n] === 0) setCell(n, data[i]); }
      return true;
    },
    void(i, x, y) {
      for (let r = 0; r < 4; r++) {
        const n = nb(i, x, y, r);
        if (n >= 0 && type[n] && !VOIDSAFE[type[n]]) { setCell(n, 0); busy = true; }
      }
      return true;
    },
    drain(i, x, y) {
      for (let r = 0; r < 4; r++) {
        const n = nb(i, x, y, r);
        if (n >= 0 && MOVE[type[n]] >= 4) { setCell(n, 0); busy = true; }
      }
      return true;
    },
    conveyor(i, x, y, t) {
      if (y === 0) return true;
      const a = i - W, u = type[a];
      if (!u || MOVE[u] === 1 || MOVE[u] === 2) return true;
      busy = true;
      if (rnd() > 0.5) return true;
      const d = t === S.conveyor_left ? -1 : 1;
      if (x + d < 0 || x + d >= W) return true;
      if (type[a + d] === 0) swap(a, a + d);
      return true;
    },
    fan(i, x, y) {
      for (let k = 14; k >= 1; k--) {
        const c = i - k * W;
        if (c - W < 0) continue;
        const u = type[c];
        if (u && MOVE[u] >= 3 && type[c - W] === 0 && rnd() < 0.7) { swap(c, c - W); busy = true; }
      }
      return true;
    },
    antimatter(i, x, y, t) {
      const n = nb8(i, x, y);
      if (n >= 0) {
        const u = type[n];
        if (u && u !== t && HARD[u] < 1) { setCell(i, 0); explode(x, y, 4); return true; }
      }
      return false;
    },
    portalIn(i, x, y) {
      busy = true;
      if (!portalsOut.length) return true;
      for (let r = 0; r < 4; r++) {
        const n = nb(i, x, y, r);
        if (n < 0) continue;
        const u = type[n];
        if (!u || MOVE[u] < 3 || u === S.portal_in || u === S.portal_out) continue;
        const o = portalsOut[(rnd() * portalsOut.length) | 0];
        const ox = o % W, oy = (o / W) | 0, s = (rnd() * 4) | 0;
        for (let q = 0; q < 4; q++) {
          const e = nb(o, ox, oy, (s + q) & 3);
          if (e >= 0 && type[e] === 0) { swap(n, e); break; }
        }
      }
      return true;
    },
    portalOut(i) { busy = true; nextPortals.push(i); return true; },
    blackhole(i, x, y) {
      busy = true;
      const R = 18;
      for (let s = 0; s < 22; s++) {
        const dx = ((rnd() * (2 * R + 1)) | 0) - R, dy = ((rnd() * (2 * R + 1)) | 0) - R;
        const d2 = dx * dx + dy * dy;
        if (!d2 || d2 > R * R) continue;
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || xx >= W || yy < 0 || yy >= H) continue;
        const j = yy * W + xx, u = type[j];
        if (!u || HARD[u] >= 1) continue;
        if (d2 <= 2) { setCell(j, 0); continue; }
        const k = j - Math.sign(dy) * W - Math.sign(dx);
        if (type[k] === 0) swap(j, k); else if (type[k] === BLACK_HOLE) setCell(j, 0);
      }
      return true;
    },
    whitehole(i, x, y) {
      busy = true;
      if (rnd() < 0.15) { const n = nb8(i, x, y); if (n >= 0 && type[n] === 0) setCell(n, pick(WHITE_OUT)); }
      return true;
    },
    virus(i, x, y) {
      busy = true;
      if (rnd() < 0.05) {
        const n = nb8(i, x, y);
        if (n >= 0 && INFECT[type[n]] && type[n]) { const T = temp[n]; setCell(n, S.virus); temp[n] = T; }
      }
      return true;
    },
    crystal(i, x, y) {
      if (data[i] & 256) return true;
      busy = true;
      if (rnd() > 0.006) return true;
      if ((data[i] & 255) < 12) {
        const n = nb8(i, x, y);
        if (n >= 0 && type[n] === 0) { const sh = shade[i]; setCell(n, S.crystal); shade[n] = sh; data[n] = (data[i] & 255) + 1; }
      }
      data[i] |= 256;
      return true;
    },
    midas(i, x, y) {
      const n = nb8(i, x, y);
      if (n >= 0) {
        const u = type[n];
        if (u && u !== GOLD && u !== S.midas && HARD[u] < 1) { setCell(n, GOLD); data[i]++; busy = true; }
      }
      if (data[i] > 30) { setCell(i, GOLD); return true; }
      return false;
    },
    meteor(i, x, y) {
      busy = true;
      let d = data[i] || (rnd() < 0.5 ? -1 : 1);
      data[i] = d;
      let j = i, xx = x, yy = y;
      for (let s = 0; s < 3; s++) {
        if (yy >= H - 1) break;
        const nx = s === 1 ? xx + d : xx;
        if (nx < 0 || nx >= W) { d = -d; continue; }
        const n = (yy + 1) * W + nx, u = type[n];
        if (u === 0 || MOVE[u] >= 5) {
          j = moveTo(j, n);
          const back = yy * W + xx;
          if (type[back] === 0 && rnd() < 0.7) setCell(back, rnd() < 0.6 ? FIRE : SMOKE);
          yy++; xx = nx;
        } else { impact(); return true; }
      }
      if (yy >= H - 1) impact();
      return true;
      function impact() {
        setCell(j, 0);
        explode(xx, yy, 8);
        for (let k = 0; k < 18; k++) {
          const ax = xx + ((rnd() * 7) | 0) - 3, ay = yy + ((rnd() * 4) | 0) - 1;
          if (ax >= 0 && ax < W && ay >= 0 && ay < H) setCell(ay * W + ax, rnd() < 0.4 ? S.lava : S.rock);
        }
      }
    },
    random(i) { setCell(i, pick(RANDOMS)); return true; },
    filler(i, x, y) {
      for (let r = 0; r < 4; r++) {
        const n = nb(i, x, y, r);
        if (n >= 0 && type[n] === 0) { setCell(n, S.filler); stamp[n] = SV; busy = true; }
      }
      return true;
    },
    cold: () => true,
    cloud(i, x, y, t) {
      busy = true;
      if (rnd() < 0.03) {
        let d = data[i] || (x & 1 ? 1 : -1);
        const nx = x + d;
        if (nx >= 0 && nx < W && type[i + d] === 0) swap(i, i + d); else data[i] = -d;
      }
      if (y < H - 1 && type[i + W] === 0) {
        const thunder = t === S.thunder_cloud;
        if (rnd() < (thunder ? 0.005 : 0.002)) {
          setCell(i + W, t === S.snow_cloud ? S.snow : WATER);
          if (rnd() < 0.2) { setCell(i, 0); return true; }
        }
        if (thunder && rnd() < 0.00004) setCell(i + W, LIGHTNING);
      }
      return true;
    },
    torch(i, x, y) {
      busy = true;
      if (y > 0 && rnd() < 0.45 && type[i - W] === 0) setCell(i - W, FIRE);
      return true;
    },
    sparkler(i, x, y) {
      busy = true;
      if (rnd() < 0.4) {
        const n = nb8(i, x, y);
        if (n >= 0 && type[n] === 0) { setCell(n, SPARK); data[n] = (rnd() * 64) | 0; life[n] = 4 + ((rnd() * 10) | 0); }
      }
      return true;
    },
    radiation(i, x, y) {
      if (rnd() < 0.02) { const n = nb8(i, x, y); if (n >= 0 && type[n]) { temp[n] += 4; wakeI(n); } }
      return false;
    },
    electric(i, x, y) {
      for (let r = 0; r < 8; r++) {
        const n = nb(i, x, y, r);
        if (n < 0) continue;
        const u = type[n];
        if (ELEC[u]) {
          charge(n);
          setCell(i, 0); return true;
        }
        if (BURN[u] && rnd() < 0.05) ignite(n);
      }
      return false;
    },
    lightning(i, x, y) {
      if (data[i]) return true;
      data[i] = 1; busy = true;
      let cx = x;
      for (let yy = y + 1; yy < H; yy++) {
        if (rnd() < 0.5) cx = Math.max(0, Math.min(W - 1, cx + (rnd() < 0.5 ? -1 : 1)));
        const j = yy * W + cx, u = type[j];
        if (u === 0 || MOVE[u] >= 5) {
          setCell(j, LIGHTNING); data[j] = 1; stamp[j] = SV;
          if (rnd() < 0.04) {
            let bx = cx, by = yy;
            const sd = rnd() < 0.5 ? -1 : 1;
            for (let k = 0; k < 10; k++) {
              bx += sd; by += rnd() < 0.6 ? 1 : 0;
              if (bx < 0 || bx >= W || by >= H) break;
              const b = by * W + bx;
              if (type[b] !== 0) break;
              setCell(b, LIGHTNING); data[b] = 1; stamp[b] = SV;
            }
          }
          if (yy === H - 1) strike(cx, yy);
          continue;
        }
        strike(cx, yy);
        break;
      }
      return true;
    },
    laser(i, x, y) {
      busy = true;
      let j = i, yy = y, last = i, steps = 0;
      while (steps < 6) {
        if (yy >= H - 1) { setCell(i, 0); return true; }
        const n = j + W, u = type[n];
        yy++; j = n;
        if (u === 0) { last = n; steps++; continue; }
        if (CLEAR[u] || MOVE[u] >= 5) continue;
        temp[n] += 220; wakeI(n);
        if (BURN[u] && rnd() < 0.3) ignite(n);
        setCell(i, 0);
        return true;
      }
      if (last !== i) swap(i, last);
      return true;
    },
    explosion(i, x, y) {
      const r = data[i] || 7;
      setCell(i, 0);
      explode(x, y, r);
      return true;
    },
    nuke(i, x, y) {
      const below = y < H - 1 ? type[i + W] : 1;
      if ((below && MOVE[below] !== 5 && MOVE[below] !== 6 && below !== S.nuke) || temp[i] > 400) {
        setCell(i, 0);
        explode(x, y, 30);
        for (let k = 0; k < 120; k++) {
          const a = rnd() * Math.PI * 2, d = rnd() * 40;
          const xx = (x + Math.cos(a) * d) | 0, yy = (y + Math.sin(a) * d) | 0;
          if (xx >= 0 && xx < W && yy >= 0 && yy < H && type[yy * W + xx] === 0) setCell(yy * W + xx, S.radiation);
        }
        flashAmt = 1;
        return true;
      }
      return false;
    },
    rocket(i, x, y) {
      busy = true;
      if (y <= 1) { life[i] = 1; return true; }
      let nx = x + (rnd() < 0.15 ? (rnd() < 0.5 ? -1 : 1) : 0);
      if (nx < 0 || nx >= W) nx = x;
      const up = (y - 1) * W + nx;
      if (type[up] === 0 || MOVE[type[up]] >= 5) {
        swap(i, up);
        if (type[i] === 0 && rnd() < 0.7) { setCell(i, SPARK); data[i] = 6 + ((rnd() * 4) | 0); life[i] = 4 + ((rnd() * 8) | 0); }
      } else life[i] = Math.min(life[i], 2);
      return true;
    },
    burst(i, x, y) {
      const hue = (rnd() * 64) | 0, R = 8 + rnd() * 8, ring = rnd() < 0.5;
      for (let k = 0; k < 130; k++) {
        const a = rnd() * Math.PI * 2, d = ring ? R * (0.8 + rnd() * 0.25) : R * Math.sqrt(rnd());
        const xx = Math.round(x + Math.cos(a) * d), yy = Math.round(y + Math.sin(a) * d);
        if (xx < 0 || xx >= W || yy < 0 || yy >= H) continue;
        const j = yy * W + xx;
        if (type[j] !== 0) continue;
        setCell(j, SPARK); data[j] = (hue + ((rnd() * 7) | 0)) & 63;
      }
      setCell(i, SPARK); data[i] = hue;
      sfx(140 + Math.random() * 120, 0.25, 'triangle', 0.14);
      return true;
    }
  };
  E.forEach((e, t) => { if (e.fn) { if (!F[e.fn]) throw new Error('Missing fn ' + e.fn); FN[t] = F[e.fn]; } });

  const AMB_C = 0.0008;

  function update(i, x, y, t) {
    let T = temp[i];
    const r4 = (rnd() * 4) | 0;
    const j = r4 === 0 ? (y > 0 ? i - W : -1) : r4 === 1 ? (y < H - 1 ? i + W : -1) : r4 === 2 ? (x > 0 ? i - 1 : -1) : (x < W - 1 ? i + 1 : -1);
    if (j >= 0) {
      const u = type[j];
      if (u === 0) {
        if (T > 21) { T -= (T - 20) * AMB[t]; busy = true; } else if (T < 19) { T += (20 - T) * AMB_C; busy = true; }
      } else {
        const k = Math.min(COND[t], COND[u]) * 0.5;
        const d = (temp[j] - T) * k;
        if (d > 0.03 || d < -0.03) {
          T += d; temp[j] -= d; busy = true;
          if (d > 1 || d < -1) wakeI(j);
        }
      }
    }
    const fx = FIXT[t];
    if (fx === fx) T = fx;
    temp[i] = T;

    if (T > THI[t]) { morph(i, pick(SHI[t])); return; }
    if (T < TLO[t]) { morph(i, pick(SLO[t])); return; }
    if (BOOM[t] && T >= IG[t]) { setCell(i, 0); explode(x, y, BOOM[t]); return; }

    if (flag[i] & 1) {
      busy = true;
      if (T < BTEMP[t]) temp[i] = BTEMP[t];
      const n = nb8(i, x, y);
      if (n >= 0) {
        const u = type[n];
        if (u === 0) { if (rnd() < 0.3) setCell(n, FIRE); }
        else if (EXT[u]) { if (rnd() < 0.35) { flag[i] &= ~1; temp[i] = 80; if (rnd() < 0.5) setCell(n, STEAM); return; } }
        else if (BURN[u] && !(flag[n] & 1) && rnd() < BURN[u] * 1.5) ignite(n);
        else if (BOOM[u]) { temp[n] += 30; wakeI(n); }
      }
      if (--life[i] <= 0) {
        const into = pick(BINTO[t]);
        morph(i, into);
        if (!into && rnd() < 0.4) setCell(i, SMOKE);
        return;
      }
    } else if (BURN[t] && T >= IG[t] && rnd() < BURN[t] * 0.5 + 0.03) { ignite(i); busy = true; }

    if (LMAX[t] && !(flag[i] & 1)) {
      busy = true;
      if (--life[i] <= 0) { setCell(i, pick(DECAY[t])); return; }
    }

    if (ELEC[t] && (cd[i] || chg[i])) {
      if (cd[i]) cd[i]--;
      busy = true;
    }

    if (HASR[t]) {
      const n = nb8(i, x, y);
      if (n >= 0) {
        const u = type[n];
        if (u) {
          const ri = RX[t * NE + u];
          if (ri >= 0) {
            busy = true;
            const r = RL[ri];
            if (rnd() < r.p) {
              const hot = T > temp[n] ? T : temp[n];
              if (hot >= r.tMin && hot <= r.tMax) {
                if (r.b2) setCell(n, pick(r.b2));
                if (r.a2) { setCell(i, pick(r.a2)); return; }
              }
            }
          }
        }
      }
    }

    if (MOVE[t] === 6) {
      busy = true;
      if (T0[t] > 100) {
        const n = nb8(i, x, y);
        if (n >= 0) { const u = type[n]; if (u && BURN[u] && !(flag[n] & 1) && rnd() < BURN[u] * 2) ignite(n); }
      }
      if (y > 0 && rnd() < 0.75) {
        const dx = ((rnd() * 3) | 0) - 1, nx = x + dx;
        if (nx >= 0 && nx < W) { const up = i - W + dx; if (type[up] === 0) swap(i, up); }
      }
      return;
    }

    const f = FN[t];
    if (f && f(i, x, y, t)) return;

    const m = MOVE[t];
    if (m === 3) powder(i, x, y, t);
    else if (m === 4) liquid(i, x, y, t);
    else if (m === 5) gas(i, x, y, t);
  }

  function powder(i, x, y, t) {
    if (y >= H - 1) return;
    const b = i + W;
    if (canFall(t, b)) { swap(i, b); return; }
    if (SLIDE[t] < 1 && rnd() > SLIDE[t]) {
      if ((x > 0 && type[b - 1] === 0) || (x < W - 1 && type[b + 1] === 0)) busy = true;
      return;
    }
    const d = rnd() < 0.5 ? -1 : 1;
    let nx = x + d;
    if (nx >= 0 && nx < W && isFluid(type[i + d]) && canFall(t, b + d)) { swap(i, b + d); return; }
    nx = x - d;
    if (nx >= 0 && nx < W && isFluid(type[i - d]) && canFall(t, b - d)) { swap(i, b - d); }
  }
  function liquid(i, x, y, t) {
    if (y < H - 1) {
      const b = i + W;
      if (canFall(t, b)) { swap(i, b); return; }
      const d = rnd() < 0.5 ? -1 : 1;
      if (x + d >= 0 && x + d < W && canFall(t, b + d)) { swap(i, b + d); return; }
      if (x - d >= 0 && x - d < W && canFall(t, b - d)) { swap(i, b - d); return; }
    }
    if (VISC[t] && rnd() < VISC[t]) {
      if ((x > 0 && type[i - 1] === 0) || (x < W - 1 && type[i + 1] === 0)) busy = true;
      return;
    }
    let d = rnd() < 0.5 ? -1 : 1;
    let tg = flow(i, x, d, SPREAD[t]);
    if (tg < 0) { d = -d; tg = flow(i, x, d, SPREAD[t]); }
    if (tg >= 0) swap(i, tg);
  }
  function flow(i, x, d, reach) {
    let best = -1;
    for (let k = 1; k <= reach; k++) {
      const nx = x + d * k;
      if (nx < 0 || nx >= W) break;
      const j = i + d * k, u = type[j];
      if (u === 0) { best = j; continue; }
      if (k === 1 && MOVE[u] >= 5) best = j;
      break;
    }
    return best;
  }
  function gas(i, x, y, t) {
    busy = true;
    const r = rnd();
    const dn = DENS[t];
    let dy;
    if (dn < 1.2) dy = r < 0.5 ? -1 : r < 0.9 ? 0 : 1;
    else if (dn < 2.4) dy = r < 0.2 ? -1 : r < 0.65 ? 0 : 1;
    else dy = r < 0.12 ? -1 : r < 0.5 ? 0 : 1;
    const dx = ((rnd() * 3) | 0) - 1;
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || nx >= W || ny < 0 || ny >= H) return;
    const j = ny * W + nx, u = type[j];
    if (u === 0) { swap(i, j); return; }
    const m = MOVE[u];
    if (m === 5 || m === 6) {
      if ((dy < 0 && dn < DENS[u]) || (dy > 0 && dn > DENS[u]) || (dy === 0 && rnd() < 0.25)) swap(i, j);
    } else if (m === 4 && dy < 0 && dn < 50) swap(i, j);
  }

  function tick() {
    TK++;
    SV = SV >= 255 ? 1 : SV + 1;
    if (SV === 1) stamp.fill(0);
    const tmp = act; act = nxt; nxt = tmp; nxt.fill(0);
    for (let k = 0; k < 8 && clist.length; k++) elecPass();
    portalsOut = nextPortals; nextPortals = [];
    for (let cy = CH - 1; cy >= 0; cy--) {
      const y0 = cy * CS, y1 = Math.min(H, y0 + CS) - 1;
      for (let y = y1; y >= y0; y--) {
        const ltr = ((y + TK) & 1) === 0;
        const row = y * W;
        for (let k = 0; k < CW; k++) {
          const cx = ltr ? k : CW - 1 - k;
          if (!act[cy * CW + cx]) continue;
          const x0 = cx * CS, x1 = Math.min(W, x0 + CS) - 1;
          if (ltr) {
            for (let x = x0; x <= x1; x++) {
              const i = row + x, t = type[i];
              if (t === 0 || stamp[i] === SV) continue;
              busy = false; update(i, x, y, t); if (busy) wake(x, y);
            }
          } else {
            for (let x = x1; x >= x0; x--) {
              const i = row + x, t = type[i];
              if (t === 0 || stamp[i] === SV) continue;
              busy = false; update(i, x, y, t); if (busy) wake(x, y);
            }
          }
        }
      }
    }
  }

  const canvas = $('#board');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d', { alpha: false });
  const img = ctx.createImageData(W, H);
  const buf = new Uint32Array(img.data.buffer);
  let heatView = false;
  let hover = { x: -1, y: -1 }, brushR = 4, brushShape = 'circle';
  let outline = [];

  function render() {
    frameNo++;
    const fr = frameNo;
    let count = 0;
    for (let y = 0, i = 0; y < H; y++) {
      const bg = BGROW[y];
      for (let x = 0; x < W; x++, i++) {
        const t = type[i];
        if (!t) { buf[i] = bg; continue; }
        count++;
        const T = temp[i];
        if (heatView) { buf[i] = HEATPAL[heatIdx(T)]; continue; }
        let c = PAL[t * 8 + shade[i]];
        const dm = DRAW[t];
        if (dm) {
          switch (dm) {
            case 1: { const l = life[i] * 2 + ((rnd() * 22) | 0); c = FIREPAL[l > 63 ? 63 : l]; break; }
            case 2: { const l = life[i] * 2 + ((rnd() * 22) | 0); c = BLUEPAL[l > 63 ? 63 : l]; break; }
            case 3: { const l = life[i] * 2 + ((rnd() * 22) | 0); c = COLDPAL[l > 63 ? 63 : l]; break; }
            case 4: c = HUEPAL[((x + y + (fr >> 1)) >> 1) & 63]; break;
            case 5: if (rnd() < 0.04) c = WHITE; break;
            case 6: if (life[i] > 0) c = LITC[t]; break;
            case 7: c = PAL[t * 8 + ((rnd() * 8) | 0)]; break;
            case 8: c = HUEPAL[data[i] & 63]; break;
            case 9: if (((fr + i * 7) % 110) < 30) c = LITC[t]; break;
            case 10: c = rnd() < 0.5 ? WHITE : ZAP; break;
            case 11: c = rnd() < 0.12 ? pack(60 + rnd() * 60, 10, 90 + rnd() * 80) : 0xff000000; break;
          }
        }
        if (ELEC[t] && (chg[i] || cd[i] > 10) && dm !== 6) c = CHARGE;
        if (flag[i] & 1) { const l = 30 + ((rnd() * 34) | 0); if (rnd() < 0.6) c = FIREPAL[l]; }
        if (T > 480 && !GLOW[t]) {
          const f = T > 1800 ? 0.85 : (T - 480) / 1550;
          const r0 = c & 255, g0 = (c >> 8) & 255, b0 = (c >> 16) & 255;
          c = pack(r0 + (255 - r0) * f, g0 + (110 - g0) * f * 0.8, b0 + (30 - b0) * f * 0.9);
        }
        buf[i] = c;
      }
    }
    if (hover.x >= 0 && !touchMode) {
      for (const [dx, dy] of outline) {
        const x = hover.x + dx, y = hover.y + dy;
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        const i = y * W + x, c = buf[i];
        buf[i] = pack(((c & 255) + 255) >> 1, (((c >> 8) & 255) + 255) >> 1, (((c >> 16) & 255) + 255) >> 1);
      }
    }
    ctx.putImageData(img, 0, 0);
    stats.count = count;
  }

  let tool = 'sand';
  let replace = false, paused = false, speed = 1, acc = 0;
  let down = false, erasing = false, lastG = null, lastSingle = -99, touchMode = false;
  const stats = { count: 0, fps: 60, ms: 0 };

  function brushOffsets() {
    const r = brushR - 1, list = [];
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (brushShape !== 'square' && dx * dx + dy * dy > r * r + r * 0.8) continue;
      list.push([dx, dy]);
    }
    return list;
  }
  let offsets = brushOffsets();
  function rebuildBrush() {
    offsets = brushOffsets();
    const inSet = new Set(offsets.map(([a, b]) => a + ',' + b));
    outline = brushR <= 1 ? [[0, 0]] : offsets.filter(([a, b]) => !inSet.has(a + 1 + ',' + b) || !inSet.has(a - 1 + ',' + b) || !inSet.has(a + ',' + (b + 1)) || !inSet.has(a + ',' + (b - 1)));
  }
  rebuildBrush();

  function applyCell(i, sel) {
    if (sel === 'tool_erase') { if (type[i]) setCell(i, 0); return; }
    if (sel === 'tool_heat') { if (type[i]) { temp[i] += 14; wakeI(i); } return; }
    if (sel === 'tool_cool') { if (type[i]) { temp[i] -= 14; wakeI(i); } return; }
    if (sel === 'tool_ignite') {
      const u = type[i];
      if (BURN[u]) ignite(i);
      else if (BOOM[u]) { temp[i] = IG[u] + 20; wakeI(i); }
      else if (u === S.fireworks || u === S.nuke) { temp[i] = 500; wakeI(i); }
      else if (!u && rnd() < 0.06) setCell(i, FIRE);
      return;
    }
    if (sel === 'tool_shock') {
      const u = type[i];
      if (ELEC[u]) charge(i);
      else if (!u && rnd() < 0.04) setCell(i, S.electric);
      return;
    }
    const t = ID[sel];
    if (t == null) return;
    if (HOTPAINT[t] && type[i] && !replace) {
      const u = type[i];
      if (BURN[u]) ignite(i); else if (BOOM[u]) { temp[i] = IG[u] + 20; wakeI(i); } else if (T0[t] > 0) { temp[i] += 20; wakeI(i); }
      return;
    }
    if (type[i] === 0 || (replace && type[i] !== t)) {
      if (SPARSE[t] && rnd() > SPARSE[t]) return;
      if (brushShape === 'spray' && rnd() > 0.12) return;
      setCell(i, t);
      poured++;
    }
  }
  function paintAt(gx, gy) {
    const sel = erasing ? 'tool_erase' : tool;
    if (sel === 'tool_pick' || sel === 'tool_drag') return;
    const t = ID[sel];
    if (t != null && SINGLE[t]) {
      if (frameNo - lastSingle < (t === PERSON ? 8 : 12)) return;
      lastSingle = frameNo;
      if (gx < 0 || gx >= W || gy < 0 || gy >= H) return;
      const i = gy * W + gx;
      if (type[i] === 0 || replace) setCell(i, t);
      if (t === S.explosion) data[i] = Math.max(4, Math.min(16, brushR + 3));
      return;
    }
    if (sel === 'tool_mix') {
      const cells = [];
      for (const [dx, dy] of offsets) {
        const x = gx + dx, y = gy + dy;
        if (x >= 0 && x < W && y >= 0 && y < H && MOVE[type[y * W + x]] !== 1) cells.push(y * W + x);
      }
      for (let k = 0; k < cells.length; k++) { const a = cells[k], b = cells[(rnd() * cells.length) | 0]; swap(a, b); }
      return;
    }
    for (const [dx, dy] of offsets) {
      const x = gx + dx, y = gy + dy;
      if (x < 0 || x >= W || y < 0 || y >= H) continue;
      applyCell(y * W + x, sel);
    }
  }
  function paintLine(a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const n = Math.max(Math.abs(dx), Math.abs(dy));
    const step = Math.max(1, Math.floor(brushR / 2));
    for (let s = step; s <= n; s += step) paintAt(Math.round(a.x + (dx * s) / n), Math.round(a.y + (dy * s) / n));
    if (n % step) paintAt(b.x, b.y);
  }
  function dragMove(a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    if (!dx && !dy) return;
    const items = [];
    for (const [ox, oy] of offsets) {
      const x = a.x + ox, y = a.y + oy;
      if (x < 0 || x >= W || y < 0 || y >= H) continue;
      const i = y * W + x, t = type[i];
      if (!t || MOVE[t] === 1) continue;
      items.push([i, x, y, t, temp[i], life[i], data[i], shade[i], flag[i]]);
      type[i] = 0; wakeI(i);
    }
    for (const it of items) {
      const nx = it[1] + dx, ny = it[2] + dy;
      let j = nx >= 0 && nx < W && ny >= 0 && ny < H ? ny * W + nx : -1;
      if (j < 0 || type[j]) j = type[it[0]] ? -1 : it[0];
      if (j < 0) continue;
      type[j] = it[3]; temp[j] = it[4]; life[j] = it[5]; data[j] = it[6]; shade[j] = it[7]; flag[j] = it[8]; chg[j] = 0; cd[j] = 0;
      wakeI(j);
    }
  }

  function gridPos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: Math.floor(((e.clientX - r.left) / r.width) * W), y: Math.floor(((e.clientY - r.top) / r.height) * H) };
  }
  const HIDDEN_PARENT = { sprout: 'seed', tree_tip: 'sapling', head: 'person', mushroom_stem: 'mushroom', mush_tip: 'mushroom_spore', rocket: 'fireworks', firework_burst: 'fireworks', firework_spark: 'fireworks', dried_glue: 'glue', solid_mercury: 'mercury' };
  function pickAt(g) {
    if (g.x >= 0 && g.x < W && g.y >= 0 && g.y < H) {
      const t = type[g.y * W + g.x];
      if (t) { const k = HIDDEN_PARENT[keys[t]] || keys[t]; select(k, true); C.toast(`Picked ${E[ID[k]].n}`); return true; }
    }
    return false;
  }
  function beginPaint(e, erase) {
    touchMode = e.pointerType === 'touch';
    const g = gridPos(e);
    hover = g;
    if (tool === 'tool_pick' && !erase) { pickAt(g); return; }
    down = true;
    acted++;
    erasing = erase;
    lastG = g;
    paintAt(g.x, g.y);
    if (!C.muted && ID[tool] != null && !erasing) sfx(300 + Math.random() * 80, 0.03, 'sine', 0.04);
  }
  function movePaint(e) {
    const g = gridPos(e);
    hover = g;
    if (!down) return;
    if (tool === 'tool_drag' && !erasing) dragMove(lastG, g);
    else { paintLine(lastG, g); pourSound(); }
    lastG = g;
  }
  const up = () => { down = false; erasing = false; };
  C.drag(canvas, {
    start: (p) => { p.event.preventDefault(); beginPaint(p.event, false); },
    move: (p) => movePaint(p.event),
    end: up
  });
  canvas.addEventListener('pointermove', (e) => { if (!down) hover = gridPos(e); });
  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 2) return;
    e.preventDefault();
    try { canvas.setPointerCapture(e.pointerId); } catch {}
    beginPaint(e, true);
    const rel = (ev) => { if (ev.pointerId !== e.pointerId) return; canvas.removeEventListener('pointermove', mv); removeEventListener('pointerup', rel); removeEventListener('pointercancel', rel); up(); };
    const mv = (ev) => { if (ev.pointerId === e.pointerId) movePaint(ev); };
    canvas.addEventListener('pointermove', mv);
    addEventListener('pointerup', rel);
    addEventListener('pointercancel', rel);
  });
  canvas.addEventListener('pointerleave', () => { if (!down) hover = { x: -1, y: -1 }; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  const fmtT = (T) => (Math.abs(T) >= 1000 ? Math.round(T).toLocaleString('en-US') : Math.round(T)) + '°C';
  const infoEl = $('#hoverInfo'), statEl = $('#stats'), swEl = $('#hoverSw');
  let lastInfo = '';
  function updateInfo() {
    let txt = idleInfo, col = 'transparent';
    if (hover.x >= 0 && hover.x < W && hover.y >= 0 && hover.y < H) {
      const i = hover.y * W + hover.x, t = type[i];
      if (!t) txt = `Empty air · ${hover.x}, ${hover.y}`;
      else {
        const k = HIDDEN_PARENT[keys[t]];
        const name = k && keys[t] !== 'head' ? `${E[t].n}` : E[t].n;
        const extra = [];
        if (flag[i] & 1) extra.push('burning');
        if (ELEC[t] && (chg[i] || cd[i])) extra.push('charged');
        if (LIGHT[t] && life[i] > 0) extra.push('on');
        if (t === S.clone && data[i]) extra.push('copying ' + E[data[i]].n);
        txt = `${name} · ${fmtT(temp[i])}${extra.length ? ' · ' + extra.join(', ') : ''}`;
        const c = PAL[t * 8 + shade[i]];
        col = `rgb(${c & 255},${(c >> 8) & 255},${(c >> 16) & 255})`;
      }
    }
    if (txt !== lastInfo) { infoEl.textContent = txt; swEl.style.background = col; lastInfo = txt; }
    statEl.textContent = `${C.fmt(stats.count)} px · ${Math.round(stats.fps)} fps`;
  }

  let raf = 0, lastT = 0, fpsAcc = 0, fpsN = 0;
  function frame(now) {
    raf = 0;
    if (document.hidden) return;
    const t0 = performance.now();
    if (down && lastG && tool !== 'tool_drag') paintAt(lastG.x, lastG.y);
    if (!paused) {
      acc += speed;
      while (acc >= 1) { tick(); acc -= 1; }
    }
    render();
    const t1 = performance.now();
    stats.ms = stats.ms * 0.9 + (t1 - t0) * 0.1;
    if (lastT) { fpsAcc += now - lastT; fpsN++; }
    lastT = now;
    if (fpsN >= 20) { stats.fps = 1000 / (fpsAcc / fpsN); fpsAcc = 0; fpsN = 0; }
    if (frameNo % 6 === 0) updateInfo();
    if (flashAmt > 0.01) { flashEl.style.opacity = flashAmt.toFixed(2); flashAmt *= 0.86; } else if (flashEl.style.opacity !== '0') flashEl.style.opacity = '0';
    raf = requestAnimationFrame(frame);
  }
  const flashEl = $('#flash');
  const start = () => { if (!raf && !document.hidden) { lastT = 0; raf = requestAnimationFrame(frame); } };
  document.addEventListener('visibilitychange', () => { if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = 0; } else start(); });

  function clearAll() {
    type.fill(0); temp.fill(20); life.fill(0); data.fill(0); flag.fill(0); chg.fill(0); cd.fill(0); clist = [];
    wakeAll();
  }
  const put = (x, y, k) => {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || x >= W || y < 0 || y >= H) return -1;
    const i = y * W + x;
    setCell(i, ID[k]);
    return i;
  };
  const rect = (x0, y0, x1, y1, k, p = 1) => {
    for (let y = Math.round(y0); y <= Math.round(y1); y++) for (let x = Math.round(x0); x <= Math.round(x1); x++) if (rnd() < p) put(x, y, k);
  };
  const disc = (cx, cy, r, k, p = 1) => {
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r && rnd() < p) put(cx + x, cy + y, k);
  };
  const box = (x0, y0, x1, y1, k) => { rect(x0, y0, x1, y0, k); rect(x0, y1, x1, y1, k); rect(x0, y0, x0, y1, k); rect(x1, y0, x1, y1, k); };
  const cloudAt = (cx, cy, w, k = 'cloud') => {
    for (let b = 0; b < 5; b++) disc(cx - w / 2 + (b * w) / 4, cy - (b % 2) * 2, Math.max(2, Math.round(w / 7 + (b % 2) * 2)), k, 0.95);
  };
  const person = (x, y) => { put(x, y, 'person'); put(x, y - 1, 'head'); };

  const PRESETS = {
    volcano: { name: 'Volcano island', icon: '🌋', build() {
      const sea = Math.round(H * 0.7), cx = Math.round(W * 0.58), peak = Math.round(H * 0.3), half = Math.round(W * 0.3);
      rect(0, sea, W - 1, H - 1, 'salt_water');
      rect(0, H - 6, W - 1, H - 1, 'sand');
      rect(0, H - 3, W - 1, H - 1, 'gravel', 0.5);
      for (let y = peak; y < H - 6; y++) {
        const w = Math.round(((y - peak) / (H - peak)) * half) + 3;
        rect(cx - w, y, cx + w, y, 'stone');
        rect(cx - w, y, cx + w, y, 'basalt', 0.25);
      }
      for (let y = peak - 2; y < H - 6; y++) {
        const w = Math.round(((y - peak) / (H - peak)) * half) + 3;
        if (y > peak + 6 && rnd() < 0.6) { put(cx - w - 1, y, 'sand'); }
      }
      const cy = Math.round(H * 0.8);
      disc(cx, cy, Math.round(H * 0.08), 'lava');
      rect(cx - 2, peak, cx + 2, cy, 'lava');
      rect(cx, peak + 3, cx, cy, 'super_heater');
      for (const k of [-2, 2]) { const c = put(cx + k, peak - 1, 'clone'); data[c] = ID.lava; }
      const bx = Math.round(W * 0.06), bw = Math.round(W * 0.18);
      for (let y = sea - 8; y < H - 6; y++) {
        const w = y < sea ? Math.max(2, bw - Math.round((sea - y) * 1.5)) : bw + Math.round((y - sea) * 0.5);
        rect(bx, y, bx + w, y, y < sea - 2 ? 'sand' : 'sandstone');
      }
      put(bx + 6, sea - 9, 'cactus'); data[(sea - 9) * W + bx + 6] = 1;
      person(bx + 3, sea - 9); person(bx + 12, sea - 9);
      cloudAt(Math.round(W * 0.2), Math.round(H * 0.12), Math.round(W * 0.16));
      cloudAt(Math.round(W * 0.86), Math.round(H * 0.1), Math.round(W * 0.12), 'thunder_cloud');
      for (let k = 0; k < 8; k++) put(rnd() * W, sea + 6 + rnd() * (H - sea - 14), k < 6 ? 'fish' : 'jellyfish');
      disc(Math.round(W * 0.92), H - 8, 3, 'coral');
      for (let k = 0; k < 4; k++) put(W * 0.1 + rnd() * W * 0.3, H * 0.2 + rnd() * 20, 'bird');
    } },
    garden: { name: 'Garden', icon: '🌻', build() {
      const g = Math.round(H * 0.74);
      rect(0, g, W - 1, H - 1, 'dirt');
      rect(0, H - 6, W - 1, H - 1, 'stone');
      rect(0, g + 6, W - 1, H - 7, 'mud', 0.08);
      rect(0, g, W - 1, g, 'grass');
      const px = Math.round(W * 0.62), pw = Math.round(W * 0.16);
      for (let y = g; y < g + 12; y++) { const w = pw - Math.round((y - g) * 1.2); rect(px - w, y, px + w, y, 'water'); }
      for (let k = 0; k < 3; k++) put(px - 4 + rnd() * 8, g + 4, 'fish');
      rect(px - 6, g + 9, px + 6, g + 10, 'algae', 0.3);
      for (let k = 0; k < 7; k++) put(W * 0.05 + rnd() * W * 0.38, g - 1, 'seed');
      for (let k = 0; k < 3; k++) put(W * 0.84 + k * 9, g - 1, 'seed');
      put(W * 0.24, g - 1, 'sapling'); put(W * 0.9, g - 1, 'sapling');
      const hx = Math.round(W * 0.44);
      rect(hx, g - 22, hx + 1, g - 1, 'wood');
      disc(hx + 1, g - 26, 3, 'hive');
      for (let k = 0; k < 4; k++) put(hx - 6 + rnd() * 14, g - 32 + rnd() * 10, 'bee');
      for (let k = 0; k < 5; k++) put(rnd() * W, g + 3 + rnd() * 10, 'worm');
      for (let k = 0; k < 5; k++) put(W * 0.3 + rnd() * 20, g - 1, 'ant');
      person(Math.round(W * 0.08), g - 1); person(Math.round(W * 0.78), g - 1);
      for (let k = 0; k < 3; k++) put(rnd() * W, H * 0.3 + rnd() * 20, 'butterfly');
      cloudAt(Math.round(W * 0.66), Math.round(H * 0.1), Math.round(W * 0.18));
      put(W * 0.2, H * 0.2, 'bird');
      const lx = Math.round(W * 0.31);
      rect(lx, g - 3, lx + 12, g - 1, 'wood');
      for (let k = 0; k < 3; k++) put(lx + 2 + k * 4, g - 4, 'mushroom_spore');
      disc(Math.round(W * 0.96), g - 3, 4, 'stone');
      put(Math.round(W * 0.96), g - 8, 'moss');
      rect(Math.round(W * 0.56), g - 1, Math.round(W * 0.57), g - 1, 'snail');
    } },
    kitchen: { name: 'Kitchen', icon: '🍳', build() {
      const f = Math.round(H * 0.86), X = (v) => Math.round(W * v);
      rect(0, f, W - 1, H - 1, 'brick');
      const s0 = X(0.03), s1 = X(0.31);
      rect(s0, f - 2, s1, f - 1, 'heater');
      rect(s0 + 1, f - 3, s1 - 1, f - 3, 'steel');
      rect(s0 + 1, f - 7, s0 + 1, f - 4, 'steel'); rect(s1 - 1, f - 7, s1 - 1, f - 4, 'steel');
      const third = Math.round((s1 - s0) / 3);
      rect(s0 + 2, f - 5, s0 + third, f - 4, 'popcorn_kernel', 0.85);
      rect(s0 + third + 3, f - 4, s0 + third + 6, f - 4, 'butter');
      disc(s0 + third + 11, f - 5, 1, 'egg');
      rect(s1 - third + 2, f - 6, s1 - 3, f - 4, 'chocolate');
      const z0 = X(0.04), z1 = X(0.24), zt = Math.round(H * 0.14), zb = Math.round(H * 0.44);
      box(z0, zt, z1, zb, 'cooler');
      rect(z0 + 2, zb - 6, Math.round((z0 + z1) / 2), zb - 1, 'ice_cream');
      rect(Math.round((z0 + z1) / 2) + 2, zb - 8, z1 - 2, zb - 1, 'juice');
      rect(z0 + 1, Math.round((zt + zb) / 2), z1 - 1, Math.round((zt + zb) / 2), 'cooler');
      rect(z0 + 3, Math.round((zt + zb) / 2) - 5, z1 - 3, Math.round((zt + zb) / 2) - 1, 'milk');
      const o0 = X(0.36), o1 = X(0.64), ot = Math.round(H * 0.42);
      box(o0, ot, o1, f - 1, 'brick');
      rect(o0 + 1, f - 2, o1 - 1, f - 2, 'heater');
      rect(o0 + 1, ot + 1, o1 - 1, ot + 1, 'heater');
      const t1 = f - 7, t2 = Math.round((ot + f) / 2);
      rect(o0 + 3, t1, o1 - 3, t1, 'steel');
      rect(o0 + 5, t1 - 4, Math.round((o0 + o1) / 2) - 2, t1 - 1, 'cake_batter');
      rect(Math.round((o0 + o1) / 2) + 2, t1 - 3, o1 - 5, t1 - 1, 'cookie_dough');
      rect(o0 + 3, t2, o1 - 3, t2, 'steel');
      rect(o0 + 6, t2 - 4, o1 - 6, t2 - 1, 'dough');
      const p0 = X(0.69), p1 = X(0.81), pt = f - 22;
      rect(p0 - 1, f - 2, p1 + 1, f - 1, 'heater');
      box(p0, pt, p1, f - 3, 'steel');
      rect(p0 + 1, pt, p1 - 1, pt, 'empty');
      rect(p0 + 1, pt + 8, p1 - 1, f - 4, 'water');
      rect(p0 + 2, pt + 4, p1 - 2, pt + 6, 'rice');
      const j0 = X(0.86), j1 = X(0.96), jt = f - 30;
      box(j0, jt, j1, f - 1, 'glass');
      rect(j0 + 1, jt, j1 - 1, jt, 'empty');
      rect(j0 + 1, jt + 10, j1 - 1, f - 2, 'soda');
      disc(Math.round((j0 + j1) / 2), jt - 30, 1, 'mint');
      person(X(0.33), f - 1);
    } },
    circuit: { name: 'Circuit lab', icon: '💡', build() {
      const f = H - 4, X = (v) => Math.round(W * v), Y = (v) => Math.round(H * v);
      rect(0, f, W - 1, H - 1, 'concrete');
      const y1 = Y(0.22), x0 = X(0.05);
      rect(x0, y1 - 3, x0 + 4, y1 + 3, 'battery');
      rect(x0 + 5, y1, X(0.86), y1, 'wire');
      for (let k = 0; k < 6; k++) { const bx = x0 + 16 + k * X(0.12); rect(bx, y1 - 4, bx + 2, y1 - 1, 'light_bulb'); }
      rect(X(0.86), y1, X(0.86), y1 + 14, 'wire');
      ['led_red', 'led_green', 'led_blue', 'led_red', 'led_green', 'led_blue', 'led_red', 'led_green'].forEach((k, n) => rect(X(0.86) - 2 - n * 3, y1 + 15, X(0.86) - n * 3, y1 + 15, k));
      const ty = Y(0.48), tx0 = X(0.5), tx1 = X(0.88);
      box(tx0, ty, tx1, ty + 6, 'glass');
      rect(tx0 + 1, ty + 1, tx1 - 1, ty + 5, 'neon');
      rect(tx1, ty + 3, X(0.95), ty + 3, 'wire');
      rect(X(0.95), Y(0.36), X(0.95), ty + 3, 'wire');
      rect(X(0.92), Y(0.36) - 1, X(0.98), Y(0.36) - 1, 'solar_panel');
      rect(X(0.92), Y(0.36), X(0.98), Y(0.36), 'wire');
      const sx = X(0.36), sy = Y(0.72);
      const cl = put(sx, Y(0.4), 'clone'); data[cl] = ID.sand;
      rect(sx - 3, sy, sx + 3, sy, 'sensor');
      rect(sx + 4, sy, sx + 40, sy, 'wire');
      for (let k = 0; k < 6; k++) rect(sx + 8 + k * 6, sy - 2, sx + 9 + k * 6, sy - 1, ['led_red', 'led_green', 'led_blue'][k % 3]);
      rect(sx - 3, sy + 1, sx + 3, sy + 1, 'conveyor_left');
      rect(sx - 22, sy + 1, sx - 4, sy + 1, 'conveyor_left');
      rect(sx - 24, sy - 2, sx - 24, f - 1, 'void');
      const hx = X(0.05), hy = Y(0.78);
      rect(hx, hy, hx + 1, f - 1, 'heater');
      rect(hx + 2, hy, hx + 30, hy, 'glass');
      rect(hx + 2, hy + 5, hx + 30, f - 1, 'water');
      rect(hx + 31, hy, hx + 32, f - 1, 'cooler');
      person(X(0.75), f - 1); person(X(0.45), f - 1);
    } },
    fireworks: { name: 'Fireworks night', icon: '🎆', build() {
      const g = Math.round(H * 0.84);
      rect(0, g, W - 1, H - 1, 'dirt');
      rect(0, g, W - 1, g, 'grass');
      for (let k = 0; k < 5; k++) {
        const x = Math.round(W * (0.12 + k * 0.19));
        rect(x - 3, g - 1, x + 3, g + 1, 'brick');
        put(x - 1, g - 1, 'heater'); put(x + 1, g - 1, 'heater'); put(x, g, 'heater');
        const c = put(x, g - 1, 'clone'); data[c] = ID.fireworks;
        put(x, g - 2, 'fireworks');
      }
      for (let k = 0; k < 7; k++) person(Math.round(W * 0.03 + k * W * 0.14 + 9), g - 1);
      rect(Math.round(W * 0.5), g - 3, Math.round(W * 0.5), g - 1, 'wood');
      put(W * 0.5, g - 4, 'sparkler');
      for (let k = 0; k < 14; k++) put(rnd() * W, H * 0.45 + rnd() * H * 0.3, 'firefly');
      for (let k = 0; k < 3; k++) put(W * 0.9 + k * 6, g - 1, 'sapling');
    } }
  };
  function loadPreset(k) {
    clearAll();
    PRESETS[k].build();
    wakeAll();
  }

  const enc = (arr) => {
    const out = [];
    let prev = arr[0], n = 0;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] === prev) n++;
      else { out.push(n > 1 ? `${prev}*${n}` : `${prev}`); prev = arr[i]; n = 1; }
    }
    out.push(n > 1 ? `${prev}*${n}` : `${prev}`);
    return out.join(',');
  };
  const dec = (s, len) => {
    const out = new Array(len).fill(0);
    let i = 0;
    for (const part of s.split(',')) {
      const [v, n] = part.split('*');
      const c = n ? +n : 1;
      for (let k = 0; k < c && i < len; k++) out[i++] = +v;
    }
    return out;
  };
  function serialize() {
    const map = new Map(), ids = [], tv = new Array(N), kv = new Array(N), dv = new Array(N);
    for (let i = 0; i < N; i++) {
      const t = type[i];
      let m = map.get(t);
      if (m === undefined) { m = ids.length; ids.push(keys[t]); map.set(t, m); }
      tv[i] = m;
      kv[i] = t ? Math.round(temp[i]) : 20;
      dv[i] = t === S.clone && data[i] ? keys[data[i]] : '';
    }
    const clones = [];
    dv.forEach((v, i) => { if (v) clones.push([i, v]); });
    return { v: 1, w: W, h: H, ids, t: enc(tv), k: enc(kv), c: clones };
  }
  function deserialize(o) {
    if (!o || !o.ids || !o.t) return false;
    clearAll();
    const n = o.w * o.h, tv = dec(o.t, n), kv = dec(o.k || '', n);
    const ox = Math.floor((W - o.w) / 2), oy = H - o.h;
    const idx = o.ids.map((k) => ID[k] ?? 0);
    const sx = (i) => (i % o.w) + ox, sy = (i) => Math.floor(i / o.w) + oy;
    for (let i = 0; i < n; i++) {
      const t = idx[tv[i]];
      if (!t) continue;
      const x = sx(i), y = sy(i);
      if (x < 0 || x >= W || y < 0 || y >= H) continue;
      const j = y * W + x;
      setCell(j, t);
      if (kv[i] != null && FIXT[t] !== FIXT[t]) temp[j] = kv[i];
    }
    for (const [i, k] of o.c || []) {
      const x = sx(i), y = sy(i);
      if (x >= 0 && x < W && y >= 0 && y < H && ID[k]) data[y * W + x] = ID[k];
    }
    wakeAll();
    return true;
  }

  const catsEl = $('#cats'), elsEl = $('#els'), searchEl = $('#search'), descEl = $('#desc');
  let curCat = 'land';
  const toolDefs = Object.fromEntries(DATA.tools.map((t) => [t.id, t]));
  const nameOf = (k) => (toolDefs[k] ? toolDefs[k].n : E[ID[k]].n);
  const swatch = (k) => {
    if (toolDefs[k]) return toolDefs[k].c;
    const c = E[ID[k]].c, cols = Array.isArray(c) ? c : [c];
    if (E[ID[k]].draw === 'rainbow') return 'linear-gradient(135deg,#ff4d4d,#ffd23f,#4dff7a,#4da6ff,#b07cff)';
    return cols.length > 1 ? `linear-gradient(135deg,${cols.slice(0, 3).join(',')})` : cols[0];
  };
  const TOOL_ICON = { tool_heat: '🔥', tool_cool: '❄️', tool_ignite: '🕯️', tool_shock: '⚡', tool_mix: '🌀', tool_drag: '✋', tool_pick: '💉', tool_erase: '🧽' };

  DATA.cats.forEach((c) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'sl-cat'; b.dataset.cat = c.id;
    b.setAttribute('role', 'tab');
    const n = c.id === 'tools' ? DATA.tools.length : visible.filter((k) => E[ID[k]].cat === c.id).length;
    b.innerHTML = `<span class="sl-cat__i" aria-hidden="true"></span><span class="sl-cat__n"></span><span class="sl-cat__c"></span>`;
    b.querySelector('.sl-cat__i').textContent = c.icon;
    b.querySelector('.sl-cat__n').textContent = c.name;
    b.querySelector('.sl-cat__c').textContent = n;
    b.title = `${c.name}: ${n}`;
    b.addEventListener('click', () => { searchEl.value = ''; showCat(c.id); });
    catsEl.append(b);
  });
  function chip(k) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'sl-el'; b.dataset.k = k;
    b.setAttribute('aria-pressed', String(k === tool));
    const sw = document.createElement('span');
    sw.className = 'sl-sw'; sw.style.background = swatch(k);
    if (TOOL_ICON[k]) { sw.textContent = TOOL_ICON[k]; sw.classList.add('sl-sw--tool'); }
    const nm = document.createElement('span'); nm.textContent = nameOf(k);
    b.append(sw, nm);
    b.title = toolDefs[k] ? toolDefs[k].desc : (E[ID[k]].desc || E[ID[k]].n);
    b.addEventListener('click', () => select(k));
    return b;
  }
  function showCat(cat) {
    curCat = cat;
    catsEl.querySelectorAll('.sl-cat').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.cat === cat)));
    const list = cat === 'tools' ? DATA.tools.map((t) => t.id) : visible.filter((k) => E[ID[k]].cat === cat);
    elsEl.replaceChildren(...list.map(chip));
    elsEl.scrollLeft = 0; elsEl.scrollTop = 0;
  }
  function showSearch(q) {
    q = q.trim().toLowerCase();
    if (!q) { showCat(curCat); return; }
    catsEl.querySelectorAll('.sl-cat').forEach((b) => b.setAttribute('aria-selected', 'false'));
    const list = [...visible, ...DATA.tools.map((t) => t.id)].filter((k) => nameOf(k).toLowerCase().includes(q) || k.includes(q.replace(/ /g, '_')));
    if (!list.length) {
      const p = document.createElement('p'); p.className = 'sl-none c-muted'; p.textContent = `Nothing called "${q}". Yet.`;
      elsEl.replaceChildren(p);
    } else elsEl.replaceChildren(...list.map(chip));
  }
  searchEl.addEventListener('input', () => showSearch(searchEl.value));
  searchEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { const f = elsEl.querySelector('.sl-el'); if (f) { select(f.dataset.k); searchEl.blur(); } }
    if (e.key === 'Escape') { searchEl.value = ''; showSearch(''); searchEl.blur(); }
  });

  function describe(k) {
    if (toolDefs[k]) return { title: `${TOOL_ICON[k]} ${toolDefs[k].n}`, body: toolDefs[k].desc, facts: [] };
    const t = ID[k], e = E[t], facts = [];
    const state = { 0: 'Creature', 1: 'Indestructible', 2: 'Solid', 3: 'Powder', 4: 'Liquid', 5: 'Gas', 6: 'Flame' }[MOVE[t]];
    facts.push(state);
    facts.push(`starts at ${fmtT(T0[t])}`);
    if (SHI[t]) facts.push(`${MOVE[t] === 4 ? 'boils' : MOVE[t] === 5 ? 'becomes' : 'melts'} at ${fmtT(THI[t])} → ${E[SHI[t][0]]?.n || 'nothing'}`);
    if (SLO[t]) facts.push(`${MOVE[t] === 5 ? 'condenses' : 'freezes'} below ${fmtT(TLO[t])} → ${E[SLO[t][0]].n}`);
    if (BURN[t]) facts.push(`burns from ${fmtT(IG[t])}`);
    if (BOOM[t]) facts.push(`explodes at ${fmtT(IG[t])}`);
    if (ELEC[t]) facts.push('conducts electricity');
    if (FIXT[t] === FIXT[t] && MOVE[t] !== 6) facts.push(`always ${fmtT(FIXT[t])}`);
    let rx = 0;
    for (let u = 1; u < NE; u++) if (RX[t * NE + u] >= 0) rx++;
    if (rx) facts.push(`reacts with ${rx} element${rx > 1 ? 's' : ''}`);
    return { title: e.n, body: e.desc || '', facts };
  }
  function select(k, jump) {
    tool = k;
    syncJars();
    elsEl.querySelectorAll('.sl-el').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.k === k)));
    if (jump) {
      const cat = toolDefs[k] ? 'tools' : E[ID[k]].cat;
      if (cat !== curCat || searchEl.value) { searchEl.value = ''; showCat(cat); }
      elsEl.querySelectorAll('.sl-el').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.k === k)));
      elsEl.querySelector('[aria-pressed="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    const d = describe(k);
    descEl.replaceChildren();
    const h = document.createElement('b'); h.textContent = d.title;
    const sw = document.createElement('span'); sw.className = 'sl-sw'; sw.style.background = swatch(k);
    if (TOOL_ICON[k]) sw.hidden = true;
    const p = document.createElement('span'); p.className = 'sl-desc__body'; p.textContent = d.body;
    const f = document.createElement('span'); f.className = 'sl-desc__facts'; f.textContent = d.facts.join(' · ');
    const top = document.createElement('span'); top.className = 'sl-desc__top'; top.append(sw, h);
    descEl.append(top, p, f);
    if (C.mode === 'advanced') C.store.set('sandlab:tool', k);
  }

  const brushEl = $('#brush'), brushV = $('#brushV');
  brushEl.addEventListener('input', () => { brushR = +brushEl.value; brushV.textContent = brushR; rebuildBrush(); });
  document.querySelectorAll('[data-shape]').forEach((b) => b.addEventListener('click', () => {
    brushShape = b.dataset.shape; rebuildBrush();
    document.querySelectorAll('[data-shape]').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
  }));
  const replaceBtn = $('#replace');
  const setReplace = (v) => { replace = v; replaceBtn.setAttribute('aria-pressed', String(v)); };
  replaceBtn.addEventListener('click', () => setReplace(!replace));
  const pauseBtn = $('#pause'), stage = $('#stage');
  const setPaused = (v) => {
    paused = v;
    pauseBtn.textContent = v ? '▶️ Play' : '⏸️ Pause';
    pauseBtn.setAttribute('aria-pressed', String(v));
    stage.classList.toggle('is-paused', v);
  };
  pauseBtn.addEventListener('click', () => setPaused(!paused));
  $('#step').addEventListener('click', () => { if (!paused) setPaused(true); tick(); });
  const speedEl = $('#speed');
  speedEl.addEventListener('change', () => { speed = +speedEl.value; });
  const heatBtn = $('#heatview');
  heatBtn.addEventListener('click', () => { heatView = !heatView; heatBtn.setAttribute('aria-pressed', String(heatView)); });
  $('#clear').addEventListener('click', () => { clearAll(); C.beep(220, 0.1, 'triangle', 0.08); C.toast('Fresh, empty universe'); });
  $('#save').addEventListener('click', () => {
    try { C.store.set('sandlab:scene', serialize()); C.toast('Scene saved'); C.beep(660, 0.08, 'sine', 0.1); }
    catch { C.toast('Could not save, storage is full'); }
  });
  $('#load').addEventListener('click', () => {
    const o = C.store.get('sandlab:scene', null);
    if (o && deserialize(o)) { C.toast('Scene loaded'); C.beep(520, 0.08, 'sine', 0.1); } else C.toast('Nothing saved yet');
  });
  const presetEl = $('#preset');
  Object.entries(PRESETS).forEach(([k, p]) => { const o = document.createElement('option'); o.value = k; o.textContent = `${p.icon} ${p.name}`; presetEl.append(o); });
  presetEl.addEventListener('change', () => {
    if (!presetEl.value) return;
    loadPreset(presetEl.value);
    C.toast(`${PRESETS[presetEl.value].icon} ${PRESETS[presetEl.value].name}`);
    presetEl.value = '';
  });

  let prevTool = 'sand';
  addEventListener('curio:touchpad', (ev) => { if (ev.detail) C.toast('Touchpad mode: click the sandbox to start pouring, move to paint, click again to stop', 3600); });
  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, select, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === ' ') { e.preventDefault(); setPaused(!paused); }
    else if (e.key === '.' || e.key === 'n') { if (!paused) setPaused(true); tick(); }
    else if (e.key === '[' || e.key === ']') { brushEl.value = +brushEl.value + (e.key === ']' ? 1 : -1); brushEl.dispatchEvent(new Event('input')); }
    else if (e.key === 'r') setReplace(!replace);
    else if (e.key === 'h') heatBtn.click();
    else if (e.key === 'e' || e.key === 'E') { if (tool === 'tool_erase') select(prevTool, true); else { prevTool = tool; select('tool_erase', true); } C.toast(tool === 'tool_erase' ? '🧽 Eraser on (E again to go back)' : `Back to ${nameOf(tool)}`, 1600); }
    else if (e.key === 'i' || e.key === 'I') { if (!pickAt(hover)) C.toast('Point at a pixel, then press I to pick it up', 2000); }
    else if (e.key === 'Escape' && down) up();
    else if (e.key === '/') { e.preventDefault(); searchEl.focus(); }
  });

  const layout = () => {
    const wide = innerWidth >= 980;
    const head = $('.sl-head').getBoundingClientRect().height;
    const barH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bar-h')) || 0;
    const avail = innerHeight - barH - head - (wide ? 150 : 280);
    const maxW = Math.max(wide ? 520 : 260, (avail * W) / H);
    stage.style.maxWidth = innerWidth < 600 ? '' : `${Math.round(maxW)}px`;
    const panel = $('.sl-panel');
    if (wide) panel.style.height = `${Math.max(420, Math.round($('.sl-left').getBoundingClientRect().height))}px`;
    else panel.style.height = '';
  };
  canvas.style.aspectRatio = `${W} / ${H}`;
  addEventListener('resize', layout);

  $('#elCount').textContent = visible.length;
  $('#rxCount').textContent = REACTIONS;
  const coarse = matchMedia('(hover: none)').matches;
  searchEl.placeholder = coarse ? `Search ${visible.length} elements` : `Search ${visible.length} elements (press /)`;
  const idleInfo = coarse ? 'Touch and drag to paint' : 'Hover over the sandbox to inspect';
  infoEl.textContent = idleInfo;
  showCat('land');
  const saved = C.store.get('sandlab:tool', 'sand');
  select(ID[saved] != null || toolDefs[saved] ? saved : 'sand', true);
  loadPreset('volcano');

  const MODE = C.mode;
  let poured = 0, lastPour = 0, acted = 0;
  function pourSound() {
    const now = performance.now();
    if (C.muted || now - lastPour < 85 || erasing) return;
    lastPour = now;
    const t = ID[tool];
    if (t == null) return;
    const m = MOVE[t];
    if (m === 4) C.beep(260 + Math.random() * 160, 0.05, 'sine', 0.035);
    else if (m === 3) C.beep(1800 + Math.random() * 900, 0.015, 'square', 0.012);
    else if (m === 5 || m === 6) C.beep(140 + Math.random() * 60, 0.06, 'sawtooth', 0.015);
    else C.beep(420 + Math.random() * 60, 0.025, 'triangle', 0.025);
  }
  const popEl = $('#pop');
  let popT = 0;
  function pop(text) { popEl.textContent = text; popEl.classList.add('is-on'); clearTimeout(popT); popT = setTimeout(() => popEl.classList.remove('is-on'), 2200); }

  const JARS = [
    ['sand', '⏳'], ['water', '💧'], ['lava', '🌋'], ['fire', '🔥'], ['seed', '🌱'], ['wood', '🪵'], ['ice', '🧊'], ['oil', '🛢️'],
    ['acid', '🧪'], ['tnt', '🧨'], ['fireworks', '🎆', 'Rocket'], ['lightning', '⚡', 'Zap'], ['cloud', '🌧️', 'Rain'], ['person', '🧍', 'People'], ['glitter', '✨'], ['tool_erase', '🧽']
  ].filter(([k]) => ID[k] != null || toolDefs[k]);
  const jarsEl = $('#jars');
  function syncJars() { document.querySelectorAll('#jars .sl-jar').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.k === tool))); }
  JARS.forEach(([k, icon, short], n) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'sl-jar'; b.dataset.k = k;
    b.title = `${nameOf(k)}${n < 9 ? ` (${n + 1})` : ''}`;
    const g = document.createElement('span'); g.className = 'sl-jar__glass';
    const f = document.createElement('span'); f.className = 'sl-jar__fill';
    const sw = swatch(k);
    f.style.setProperty('--fill', k === 'tool_erase' ? 'repeating-linear-gradient(45deg,#f2b8b8 0 6px,#fbe3e3 6px 12px)' : sw);
    g.style.setProperty('--jar-lid', ['fire', 'lava', 'tnt', 'fireworks'].includes(k) ? '#d0503a' : ['water', 'ice', 'cloud'].includes(k) ? '#4f8fd6' : ['seed', 'wood', 'acid'].includes(k) ? '#4f9a5a' : '#8a8f9c');
    const ic = document.createElement('span'); ic.className = 'sl-jar__icon'; ic.textContent = icon;
    g.append(f, ic);
    const nm = document.createElement('span'); nm.className = 'sl-jar__name'; nm.textContent = short || nameOf(k);
    b.append(g, nm);
    b.addEventListener('click', () => { select(k, true); if (!C.muted) { C.beep(1320 + n * 30, 0.04, 'sine', 0.06); setTimeout(() => C.beep(1760 + n * 30, 0.05, 'sine', 0.04), 45); } });
    jarsEl.append(b);
  });

  const sPause = $('#sPause');
  const paintPause = () => { sPause.textContent = paused ? '▶️ Play' : '⏸️ Pause'; sPause.setAttribute('aria-pressed', String(paused)); };
  sPause.addEventListener('click', () => { setPaused(!paused); paintPause(); });
  pauseBtn.addEventListener('click', paintPause);
  $('#sClear').addEventListener('click', () => { clearAll(); baseline(); C.beep(220, 0.1, 'triangle', 0.08); pop('Fresh, empty tank'); });
  const sizeBtns = document.querySelectorAll('[data-size]');
  const setSize = (v) => { brushR = v; brushEl.value = v; brushV.textContent = v; rebuildBrush(); sizeBtns.forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.size === v))); };
  sizeBtns.forEach((b) => b.addEventListener('click', () => { setSize(+b.dataset.size); C.beep(500 + +b.dataset.size * 30, 0.04, 'triangle', 0.05); }));
  const scenesEl = $('#sScenes');
  Object.entries(PRESETS).forEach(([k, p]) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'sl-scene';
    b.innerHTML = '<b aria-hidden="true"></b><span></span>';
    b.firstChild.textContent = p.icon; b.lastChild.textContent = p.name.split(' ')[0];
    b.title = p.name;
    b.addEventListener('click', () => { loadPreset(k); baseline(); pop(`${p.icon} ${p.name}`); C.beep(660, 0.06, 'sine', 0.06); });
    scenesEl.append(b);
  });

  const floor = (k = 'stone', h = 6) => rect(0, H - h, W - 1, H - 1, k);
  const RECIPES = [
    { name: 'Lava meets the sea', tool: 'lava', build() { floor('sand'); rect(0, Math.round(H * 0.62), W - 1, H - 7, 'water'); for (let k = 0; k < 4; k++) disc(Math.round(W * (0.2 + k * 0.2)), Math.round(H * 0.18 + rnd() * 20), 5, 'lava'); } },
    { name: 'Rainy garden', tool: 'seed', build() { const g = Math.round(H * 0.78); rect(0, g, W - 1, H - 1, 'dirt'); rect(0, g, W - 1, g, 'grass'); for (let k = 0; k < 10; k++) put(W * 0.05 + rnd() * W * 0.9, g - 1, 'seed'); cloudAt(Math.round(W * 0.3), Math.round(H * 0.12), Math.round(W * 0.2)); cloudAt(Math.round(W * 0.72), Math.round(H * 0.16), Math.round(W * 0.18)); } },
    { name: 'Popcorn party', tool: 'popcorn_kernel', build() { floor('brick'); const x0 = Math.round(W * 0.25), x1 = Math.round(W * 0.75), y = H - 8; rect(x0, y, x1, y + 1, 'super_heater'); rect(x0, y - 40, x0, y, 'glass'); rect(x1, y - 40, x1, y, 'glass'); rect(x0 + 2, y - 4, x1 - 2, y - 1, 'popcorn_kernel', 0.7); } },
    { name: 'Mint in soda', tool: 'mint', build() { floor(); const x0 = Math.round(W * 0.38), x1 = Math.round(W * 0.62); rect(x0, Math.round(H * 0.35), x0, H - 7, 'glass'); rect(x1, Math.round(H * 0.35), x1, H - 7, 'glass'); rect(x0 + 1, Math.round(H * 0.45), x1 - 1, H - 7, 'soda'); disc(Math.round(W / 2), Math.round(H * 0.15), 3, 'mint'); } },
    { name: 'TNT quarry', tool: 'fire', build() { floor('stone', 10); for (let x = 0; x < W; x++) { const h = Math.round(H * 0.3 + Math.sin(x / 13) * 10); rect(x, H - 10 - h, x, H - 11, x % 5 ? 'sand' : 'gravel'); } for (let k = 0; k < 5; k++) disc(Math.round(W * (0.15 + k * 0.17)), Math.round(H * 0.8), 4, 'tnt'); rect(2, Math.round(H * 0.3), 3, Math.round(H * 0.45), 'torch'); } },
    { name: 'Thunder over the lake', tool: 'lightning', build() { floor('sand'); rect(0, Math.round(H * 0.6), W - 1, H - 7, 'water'); for (let k = 0; k < 6; k++) put(rnd() * W, H * 0.7 + rnd() * 20, 'fish'); cloudAt(Math.round(W * 0.5), Math.round(H * 0.12), Math.round(W * 0.4), 'thunder_cloud'); } },
    { name: 'Ice versus lava', tool: 'lava', build() { floor(); rect(Math.round(W * 0.1), Math.round(H * 0.45), Math.round(W * 0.45), H - 7, 'ice'); disc(Math.round(W * 0.75), Math.round(H * 0.2), 9, 'lava'); } },
    { name: 'Acid bath', tool: 'acid', build() { floor('glass'); rect(0, Math.round(H * 0.7), W - 1, H - 7, 'acid'); for (let k = 0; k < 4; k++) rect(Math.round(W * (0.12 + k * 0.22)), Math.round(H * 0.45), Math.round(W * (0.12 + k * 0.22)) + 10, Math.round(H * 0.82), ['iron', 'copper', 'wood', 'limestone'][k]); } },
    { name: 'Fireworks show', tool: 'fireworks', build() { const g = H - 8; floor('dirt', 8); for (let k = 0; k < 4; k++) { const x = Math.round(W * (0.2 + k * 0.2)); put(x, g, 'heater'); put(x - 1, g, 'heater'); put(x + 1, g, 'heater'); put(x, g - 1, 'fireworks'); } for (let k = 0; k < 5; k++) person(Math.round(W * (0.1 + k * 0.2)), g - 1); } },
    { name: 'Snow day', tool: 'snow', build() { floor('dirt', 8); cloudAt(Math.round(W * 0.3), Math.round(H * 0.1), Math.round(W * 0.28), 'snow_cloud'); cloudAt(Math.round(W * 0.75), Math.round(H * 0.14), Math.round(W * 0.22), 'snow_cloud'); for (let k = 0; k < 4; k++) person(Math.round(W * (0.15 + k * 0.22)), H - 9); } },
    { name: 'Oil slick on fire', tool: 'fire', build() { floor('sand'); rect(0, Math.round(H * 0.62), W - 1, H - 7, 'water'); rect(0, Math.round(H * 0.56), W - 1, Math.round(H * 0.61), 'oil'); put(W * 0.1, H * 0.5, 'ember'); } },
    { name: 'Black hole snack', tool: 'sand', build() { disc(Math.round(W / 2), Math.round(H * 0.55), 3, 'black_hole'); for (let k = 0; k < 6; k++) disc(Math.round(rnd() * W), Math.round(rnd() * H * 0.3), 5, ['sand', 'water', 'glitter', 'confetti', 'salt', 'gravel'][k]); } },
    { name: 'Volcano in a jar', tool: 'water', build() { floor('stone'); const cx = Math.round(W / 2); for (let y = Math.round(H * 0.5); y < H - 6; y++) { const w = Math.round((y - H * 0.5) * 0.7) + 2; rect(cx - w, y, cx + w, y, 'basalt'); } rect(cx - 1, Math.round(H * 0.5), cx + 1, H - 7, 'lava'); rect(cx, Math.round(H * 0.6), cx, H - 7, 'super_heater'); } },
    { name: 'Bakery', tool: 'dough', build() { floor('brick'); rect(Math.round(W * 0.1), H - 8, Math.round(W * 0.9), H - 7, 'heater'); rect(Math.round(W * 0.15), H - 12, Math.round(W * 0.35), H - 9, 'dough'); rect(Math.round(W * 0.42), H - 12, Math.round(W * 0.58), H - 9, 'cake_batter'); rect(Math.round(W * 0.65), H - 12, Math.round(W * 0.85), H - 9, 'cookie_dough'); } }
  ].filter((r) => ID[r.tool] != null);
  let lastRecipe = -1;
  function surprise() {
    let n;
    do n = Math.floor(Math.random() * RECIPES.length); while (n === lastRecipe && RECIPES.length > 1);
    lastRecipe = n;
    const r = RECIPES[n];
    clearAll();
    try { r.build(); } catch {}
    wakeAll();
    baseline();
    select(r.tool, true);
    pop(`🎲 ${r.name}`);
    flashAmt = 0.25;
    if (!C.muted) [523, 659, 784, 1046].forEach((f, k) => setTimeout(() => C.beep(f, 0.07, 'triangle', 0.05), k * 55));
  }
  $('#surprise').addEventListener('click', surprise);

  const GOALS = [
    ['glass', 'Melt sand into glass', ['glass', 'molten_glass']], ['steam', 'Boil water into steam', ['steam']], ['obsidian', 'Cool lava into obsidian', ['obsidian']],
    ['mud', 'Make mud', ['mud']], ['plant', 'Grow a plant from a seed', ['plant', 'sprout', 'flower']], ['leaf', 'Grow a whole tree', ['leaf']],
    ['popcorn', 'Pop some popcorn', ['popcorn']], ['bread', 'Bake bread', ['bread', 'toast']], ['cake', 'Bake a cake', ['cake']],
    ['caramel', 'Melt sugar into caramel', ['caramel']], ['foam', 'Mint in soda', ['foam']], ['rust', 'Rust some iron', ['rust']],
    ['charcoal', 'Char wood into charcoal', ['charcoal']], ['salt_water', 'Dissolve salt in water', ['salt_water']], ['slaked_lime', 'Slake some quicklime', ['slaked_lime']],
    ['cooked_egg', 'Fry an egg', ['cooked_egg']], ['toasted', 'Toast a marshmallow', ['toasted_marshmallow']], ['explosion', 'Set off an explosion', ['explosion']],
    ['plasma', 'Make plasma', ['plasma']], ['ice', 'Freeze water solid', ['ice']], ['latte', 'Make a latte', ['latte']], ['chocolate_milk', 'Stir chocolate milk', ['chocolate_milk']]
  ].map(([id, name, ks]) => ({ id, name, ks: ks.filter((k) => ID[k] != null).map((k) => ID[k]) })).filter((g) => g.ks.length);
  const found = C.store.get('sandlab:found', {});
  let base = new Set(), touched = false, baseAt = 0, pouredAtBase = 0;
  function baseline() { base = new Set(); for (let i = 0; i < N; i++) if (type[i]) base.add(type[i]); touched = false; baseAt = performance.now(); pouredAtBase = poured + acted; }
  const goalsEl = $('#goals');
  function paintGoals(fresh) {
    goalsEl.replaceChildren(...GOALS.map((g) => { const li = document.createElement('li'); li.textContent = g.name; if (found[g.id]) li.classList.add('is-done'); if (fresh === g.id) li.classList.add('is-new'); return li; }));
    $('#discN').textContent = `${GOALS.filter((g) => found[g.id]).length} / ${GOALS.length}`;
  }
  const slotsEl = $('#slots');
  const SLOT_KEYS = ['sandlab:scene', 'sandlab:scene2', 'sandlab:scene3'];
  function paintSlots() {
    slotsEl.replaceChildren(...SLOT_KEYS.map((key, n) => {
      const o = C.store.get(key, null);
      const row = document.createElement('div'); row.className = 'sl-slot';
      const lbl = document.createElement('span'); lbl.className = 'sl-slot__lbl';
      lbl.textContent = `Jar ${n + 1}: ${o ? (o.at ? new Date(o.at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'saved') : 'empty'}`;
      const sv = document.createElement('button'); sv.type = 'button'; sv.className = 'c-btn c-btn--ghost'; sv.textContent = 'Save';
      const ld = document.createElement('button'); ld.type = 'button'; ld.className = 'c-btn c-btn--ghost'; ld.textContent = 'Load'; ld.disabled = !o;
      sv.addEventListener('click', () => { try { C.store.set(key, { ...serialize(), at: Date.now() }); pop(`💾 Saved to jar ${n + 1}`); C.beep(660, 0.08, 'sine', 0.1); } catch { C.toast('Could not save, storage is full'); } paintSlots(); });
      ld.addEventListener('click', () => { const s2 = C.store.get(key, null); if (s2 && deserialize(s2)) { baseline(); pop(`📂 Jar ${n + 1} poured back`); C.beep(520, 0.08, 'sine', 0.1); } });
      row.append(lbl, sv, ld);
      return row;
    }));
  }
  async function packCode(obj) {
    const json = JSON.stringify(obj);
    try {
      const cs = new CompressionStream('deflate-raw');
      const buf = await new Response(new Blob([json]).stream().pipeThrough(cs)).arrayBuffer();
      let bin = ''; const u = new Uint8Array(buf); for (let i = 0; i < u.length; i++) bin += String.fromCharCode(u[i]);
      return 'ZSL1.' + btoa(bin);
    } catch { return 'ZSL0.' + btoa(unescape(encodeURIComponent(json))); }
  }
  async function unpackCode(code) {
    code = code.trim();
    if (code.startsWith('ZSL0.')) return JSON.parse(decodeURIComponent(escape(atob(code.slice(5)))));
    if (!code.startsWith('ZSL1.')) throw new Error('bad');
    const bin = atob(code.slice(5)); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    const ds = new DecompressionStream('deflate-raw');
    return JSON.parse(await new Response(new Blob([u]).stream().pipeThrough(ds)).text());
  }
  $('#shareCopy').addEventListener('click', async () => {
    const code = await packCode(serialize());
    let ok = false;
    try { await navigator.clipboard.writeText(code); ok = true; } catch {}
    const ta = document.createElement('textarea'); ta.className = 'sl-code'; ta.value = code; ta.readOnly = true; ta.setAttribute('aria-label', 'Share code');
    const wrap = document.createElement('div'); const p = document.createElement('p'); p.textContent = ok ? `Copied ${C.fmt(code.length)} characters. Send it to a friend; they paste it into their Sand Lab.` : 'Copy this code and send it to a friend.';
    wrap.append(p, ta);
    C.modal({ emoji: '📋', title: 'Share code', body: wrap, buttons: [{ label: 'Done', value: 1 }] });
    setTimeout(() => ta.select(), 50);
  });
  $('#sharePaste').addEventListener('click', async () => {
    const ta = document.createElement('textarea'); ta.className = 'sl-code'; ta.placeholder = 'Paste a ZSL1 code here'; ta.setAttribute('aria-label', 'Paste share code');
    const v = C.modal({ emoji: '📥', title: 'Paste a share code', body: ta, buttons: [{ label: 'Pour it in', value: 'go' }, { label: 'Cancel', value: '' }] });
    setTimeout(() => ta.focus(), 50);
    if (await v !== 'go') return;
    try { const o = await unpackCode(ta.value); if (!deserialize(o)) throw new Error('bad'); baseline(); pop('📥 Shared scene loaded'); C.beep(700, 0.08, 'sine', 0.1); }
    catch { C.toast('That code did not work. Check it was copied whole.'); }
  });
  const totalPoured0 = C.store.get('sandlab:poured', 0);
  function scan() {
    const counts = new Map();
    let hot = -273;
    for (let i = 0; i < N; i++) { const t = type[i]; if (t) { counts.set(t, (counts.get(t) || 0) + 1); if (temp[i] > hot) hot = temp[i]; } }
    if (performance.now() - baseAt < 9000) counts.forEach((_, t) => base.add(t));
    else if (poured + acted > pouredAtBase) touched = true;
    if (touched) {
      for (const g of GOALS) {
        if (found[g.id]) continue;
        if (g.ks.some((t) => counts.get(t) && !base.has(t))) {
          found[g.id] = Date.now(); C.store.set('sandlab:found', found);
          paintGoals(g.id);
          pop(`🔬 Discovery: ${g.name}`);
          if (!C.muted) [784, 988, 1318].forEach((f, k) => setTimeout(() => C.beep(f, 0.09, 'sine', 0.07), k * 80));
          if (GOALS.every((x) => found[x.id])) C.confetti();
        }
      }
    }
    if (MODE !== 'advanced') return;
    let px = 0; counts.forEach((v) => { px += v; });
    $('#stPx').textContent = C.fmt(px);
    $('#stKinds').textContent = counts.size;
    $('#stPoured').textContent = C.fmt(totalPoured0 + poured);
    $('#stHot').textContent = px ? fmtT(hot) : '20°C';
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    const max = top.length ? top[0][1] : 1;
    $('#topList').replaceChildren(...top.map(([t, n]) => {
      const li = document.createElement('li');
      const sw = document.createElement('span'); sw.className = 'sl-sw'; sw.style.width = sw.style.height = '12px'; sw.style.background = swatch(keys[t]);
      const bar = document.createElement('span'); const i = document.createElement('i'); i.style.width = `${Math.max(4, (n / max) * 100)}%`; bar.append(document.createTextNode(E[t].n), i);
      const c = document.createElement('span'); c.textContent = C.fmt(n);
      li.append(sw, bar, c);
      return li;
    }));
  }
  setInterval(() => { if (!document.hidden) { scan(); if (poured) C.store.set('sandlab:poured', totalPoured0 + poured); } }, 1000);
  canvas.addEventListener('wheel', (e) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    const v = Math.max(1, Math.min(30, brushR + (e.deltaY < 0 ? 1 : -1)));
    if (v !== brushR) { brushR = v; brushEl.value = v; brushV.textContent = v; rebuildBrush(); }
  }, { passive: false });
  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, select, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^[1-9]$/.test(e.key)) {
      const list = MODE === 'simple' ? JARS.map((j) => j[0]) : [...elsEl.querySelectorAll('.sl-el')].map((b) => b.dataset.k);
      const k = list[+e.key - 1];
      if (k) { select(k, true); pop(nameOf(k)); }
    } else if (e.key === 's' || e.key === 'S') surprise();
  });
  if (MODE === 'simple') { const v = C.store.get('sandlab:simpleTool', null); if (v && JARS.some((j) => j[0] === v)) select(v, true); else select('sand', true); setSize(6); }
  addEventListener('pagehide', () => { if (MODE === 'simple') C.store.set('sandlab:simpleTool', tool); });
  paintGoals(); paintSlots();
  baseline();
  layout();
  requestAnimationFrame(layout);
  start();
  if (!coarse && !C.touchpad && !C.store.get('tp-hint-falling-sand', false)) { C.store.set('tp-hint-falling-sand', true); setTimeout(() => C.toast('Tip: on a laptop touchpad, turn on Touchpad mode in the top bar: click to start pouring, click again to stop', 4200), 1800); }

  window.SandLab = {
    W, H, ID, keys, stats, elements: visible.length, rules: ruleCount, reactions: REACTIONS,
    select: (k) => select(k, true),
    paint: (x, y, r = brushR) => { acted++; const o = brushR; brushR = r; rebuildBrush(); paintAt(x, y); brushR = o; rebuildBrush(); },
    rect: (x0, y0, x1, y1, k) => rect(x0, y0, x1, y1, k),
    tick: (n = 1) => { for (let k = 0; k < n; k++) tick(); },
    clear: clearAll,
    preset: loadPreset,
    count: (k) => { const t = ID[k]; let n = 0; for (let i = 0; i < N; i++) if (type[i] === t) n++; return n; },
    at: (x, y) => keys[type[y * W + x]],
    cell: (x, y) => { const i = y * W + x; return { k: keys[type[i]], t: temp[i], life: life[i], data: data[i], burning: !!(flag[i] & 1), chg: chg[i] + cd[i] }; },
    tally() { const o = {}; for (let i = 0; i < N; i++) if (type[i]) o[keys[type[i]]] = (o[keys[type[i]]] || 0) + 1; return o; },
    active() { let n = 0; for (let b = 0; b < act.length; b++) n += act[b]; return n + '/' + act.length; },
    pause: (v) => setPaused(v),
    bench(n = 60) { const t0 = performance.now(); for (let k = 0; k < n; k++) { tick(); render(); } return (performance.now() - t0) / n; }
  };
})();
