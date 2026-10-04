'use strict';
(() => {
  const D = window.SNAKE_DATA;
  const N = D.N, C = 24, W = N * C, H = N * C;
  const FONT = 'ui-rounded, "SF Pro Rounded", "Nunito", "Segoe UI", system-ui, sans-serif';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const DIRS = { up: { x: 0, y: -1, n: 'up' }, down: { x: 0, y: 1, n: 'down' }, left: { x: -1, y: 0, n: 'left' }, right: { x: 1, y: 0, n: 'right' } };
  const KEYMAP = { arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down', arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right' };
  const SPEEDS = { chill: { v: 6.5, name: 'Chill' }, normal: { v: 9.5, name: 'Normal' }, fast: { v: 13, name: 'Fast' }, insane: { v: 17, name: 'Insane' } };
  const CLASSIC_MAPS = ['open', 'wrap', 'pillars', 'corners', 'tunnels', 'cross', 'rooms', 'donut', 'zigzag', 'portals', 'arena', 'diamond'];
  const DAILY_MAPS = ['pillars', 'corners', 'tunnels', 'cross', 'rooms', 'donut', 'zigzag', 'portals', 'maze', 'arena', 'diamond', 'gates', 'lanes', 'comb', 'spiral'];
  const PORTAL_COL = { a: ['#ff8a3d', '#ffd29c'], b: ['#4aa8ff', '#bfe3ff'], c: ['#c56bff', '#efd1ff'] };
  const SAVE_KEY = 'snake:save', VER = 2;

  const canvas = $('#board'), ctx = canvas.getContext('2d');
  const stage = $('.sn-stage');
  const ovs = { menu: $('#ov-menu'), levels: $('#ov-levels'), skins: $('#ov-skins'), badges: $('#ov-badges'), help: $('#ov-help'), pause: $('#ov-pause'), over: $('#ov-over') };

  function defaults() {
    return {
      v: VER, skin: 'garden', mode: 'classic',
      settings: { speed: 'normal', map: 'open', power: true, haptics: true },
      stats: { games: 0, apples: 0, longest: 0, bestScore: 0, time: 0, ghosts: 0, powers: 0, maxCombo: 0, days: 0, taBest: 0, zenBest: 0, deaths: 0, portals: 0 },
      levels: {}, badges: {}, daily: {}, history: []
    };
  }
  function load() {
    const d = defaults();
    let s = null;
    try { s = Curio.store.get(SAVE_KEY, null); } catch { s = null; }
    if (!s || typeof s !== 'object') {
      const oldMode = Curio.store.get('snake:mode', null);
      if (SPEEDS[oldMode]) d.settings.speed = oldMode;
      if (Curio.store.get('snake:wrap', false)) d.settings.map = 'wrap';
      return d;
    }
    const out = d;
    if (typeof s.skin === 'string') out.skin = s.skin;
    if (typeof s.mode === 'string') out.mode = s.mode;
    for (const k of ['settings', 'stats']) if (s[k] && typeof s[k] === 'object') for (const j in out[k]) if (typeof s[k][j] === typeof out[k][j]) out[k][j] = s[k][j];
    for (const k of ['levels', 'badges', 'daily']) if (s[k] && typeof s[k] === 'object' && !Array.isArray(s[k])) out[k] = s[k];
    if (Array.isArray(s.history)) out.history = s.history.filter((h) => h && typeof h === 'object').slice(0, 20);
    if (!SPEEDS[out.settings.speed]) out.settings.speed = 'normal';
    if (!D.MAPS[out.settings.map]) out.settings.map = 'open';
    if (!D.SKINS.some((k) => k.id === out.skin)) out.skin = 'garden';
    if (!['classic', 'campaign', 'daily', 'time', 'zen'].includes(out.mode)) out.mode = 'classic';
    return out;
  }
  const save = load();
  const persist = () => Curio.store.set(SAVE_KEY, save);

  function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function mulberry(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  function dailyInfo() {
    const date = today(), r = mulberry(hashStr('snake-daily-' + date));
    const map = DAILY_MAPS[Math.floor(r() * DAILY_MAPS.length)];
    const world = D.WORLDS[Math.floor(r() * D.WORLDS.length)];
    return { date, map, theme: world.theme, seed: hashStr('snake-run-' + date) };
  }

  let dark = Curio.isDark();
  const mixHex = (a, b, t) => {
    const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16);
    const c = (s) => Math.round(((x >> s) & 255) * (1 - t) + ((y >> s) & 255) * t);
    return '#' + ((1 << 24) + (c(16) << 16) + (c(8) << 8) + c(0)).toString(16).slice(1);
  };
  const shade = (hex, amt) => mixHex(hex, amt < 0 ? '#000000' : '#ffffff', Math.abs(amt));

  const audio = {
    tone(f, d = 0.08, type = 'sine', vol = 0.12, to = 0, delay = 0) {
      if (Curio.muted) return;
      const ac = Curio.audioContext(); if (!ac) return;
      const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t);
      if (to) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + d);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d + 0.03);
    },
    noise(d = 0.25, vol = 0.12, freq = 1200) {
      if (Curio.muted) return;
      const ac = Curio.audioContext(); if (!ac) return;
      if (!this.buf) { this.buf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const ch = this.buf.getChannelData(0); for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1; }
      const t = ac.currentTime, s = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter();
      s.buffer = this.buf; f.type = 'lowpass'; f.frequency.setValueAtTime(freq, t); f.frequency.exponentialRampToValueAtTime(60, t + d);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      s.connect(f).connect(g).connect(ac.destination); s.start(t); s.stop(t + d + 0.02);
    },
    eat(combo) { const sc = [0, 2, 4, 7, 9, 12, 14, 16, 19]; const f = 392 * Math.pow(2, sc[Math.min(sc.length - 1, combo)] / 12); this.tone(f, 0.09, 'triangle', 0.14); this.tone(f * 2, 0.05, 'sine', 0.05, 0, 0.03); },
    power() { [659, 784, 988, 1319].forEach((f, i) => this.tone(f, 0.09, 'square', 0.05, 0, i * 0.05)); },
    die() { this.tone(420, 0.5, 'sawtooth', 0.09, 60); this.noise(0.3, 0.14, 900); },
    win() { [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.16, 'triangle', 0.12, 0, i * 0.09)); },
    portal() { this.tone(300, 0.22, 'sine', 0.1, 1200); },
    shield() { this.tone(880, 0.25, 'triangle', 0.1, 220); this.noise(0.12, 0.08, 3000); },
    snip() { this.tone(1400, 0.05, 'square', 0.05); this.tone(1000, 0.05, 'square', 0.05, 0, 0.05); },
    click() { this.tone(660, 0.04, 'triangle', 0.07); },
    tick() { this.tone(1200, 0.03, 'square', 0.04); },
    go() { this.tone(880, 0.18, 'triangle', 0.12); }
  };
  const vib = (p) => { if (save.settings.haptics && navigator.vibrate) try { navigator.vibrate(p); } catch {} };

  const fx = {
    list: [],
    burst(x, y, n, colors, { speed = 160, life = 0.6, size = 3, gravity = 200, spread = Math.PI * 2, angle = 0, shape = 'sq' } = {}) {
      for (let i = 0; i < n && this.list.length < 600; i++) {
        const a = angle + (Math.random() - 0.5) * spread, s = speed * (0.35 + Math.random() * 0.65);
        this.list.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: life * (0.6 + Math.random() * 0.4), max: life, size: size * (0.6 + Math.random() * 0.7), c: colors[(Math.random() * colors.length) | 0], g: gravity, r: Math.random() * 6, vr: (Math.random() - 0.5) * 10, shape });
      }
    },
    ring(x, y, color, max = 40) { this.list.push({ ring: true, x, y, life: 0.45, max: 0.45, c: color, rad: max }); },
    update(dt) {
      const L = this.list;
      for (let i = L.length - 1; i >= 0; i--) {
        const p = L[i]; p.life -= dt;
        if (p.life <= 0) { L[i] = L[L.length - 1]; L.pop(); continue; }
        if (p.ring) continue;
        const k = Math.exp(-1.6 * dt); p.vx *= k; p.vy = p.vy * k + p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
      }
    },
    draw(g) {
      for (const p of this.list) {
        const a = Math.max(0, Math.min(1, p.life / p.max * 1.5));
        g.globalAlpha = a;
        if (p.ring) { const k = 1 - p.life / p.max; g.strokeStyle = p.c; g.lineWidth = 4 * (1 - k) + 1; g.beginPath(); g.arc(p.x, p.y, 6 + p.rad * k, 0, 7); g.stroke(); continue; }
        g.fillStyle = p.c;
        if (p.shape === 'star') { g.save(); g.translate(p.x, p.y); g.rotate(p.r); starPath(g, 0, 0, p.size, p.size * 0.45, 5); g.fill(); g.restore(); }
        else if (p.shape === 'dot') { g.beginPath(); g.arc(p.x, p.y, p.size / 2, 0, 7); g.fill(); }
        else { g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6); g.restore(); }
      }
      g.globalAlpha = 1;
    }
  };
  function starPath(g, x, y, R, r, n) { g.beginPath(); for (let i = 0; i < n * 2; i++) { const rr = i % 2 ? r : R, a = i * Math.PI / n - Math.PI / 2; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); }
  function rrect(g, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

  function parseMap(id) {
    const m = D.MAPS[id];
    const walls = new Uint8Array(N * N), portals = {}, pairs = {};
    m.rows.forEach((row, y) => [...row].forEach((ch, x) => {
      if (ch === '#') walls[y * N + x] = 1;
      else if (/[a-z]/.test(ch)) { (pairs[ch] ||= []).push({ x, y }); }
    }));
    for (const k in pairs) { const [p, q] = pairs[k]; if (p && q) { portals[p.y * N + p.x] = { to: q, k }; portals[q.y * N + q.x] = { to: p, k }; } }
    return { id, name: m.name, wrap: !!m.wrap, walls, portals, pairs };
  }
  function findStart(map) {
    const free = (x, y) => x >= 0 && y >= 0 && x < N && y < N && !map.walls[y * N + x] && !map.portals[y * N + x];
    const rows = [];
    for (let k = 0; k < N; k++) { const y = 10 + (k % 2 ? 1 : -1) * Math.ceil(k / 2); if (y >= 0 && y < N) rows.push(y); }
    for (const y of rows) for (let x = 4; x <= 10; x++) {
      let ok = true;
      for (let i = -3; i <= 5; i++) if (!free(x + i, y)) { ok = false; break; }
      if (ok) return { x, y, dir: DIRS.right };
    }
    for (let x = 2; x < N; x++) for (let y = 4; y <= 12; y++) {
      let ok = true;
      for (let i = -3; i <= 5; i++) if (!free(x, y + i)) { ok = false; break; }
      if (ok) return { x, y, dir: DIRS.down };
    }
    return { x: 4, y: 10, dir: DIRS.right };
  }

  let G = null, autoPilot = false;
  let state = 'menu';
  let menuMode = save.mode;
  let shake = 0, flash = 0, time = 0, countdown = 0, overAt = 0;
  let boardCache = null, cacheKey = '';
  let pops = [];

  function newGame(mode, opts = {}) {
    let mapId = 'open', theme = 'meadow', speed = SPEEDS[save.settings.speed].v, power = save.settings.power, rng = Math.random, level = null, daily = null;
    if (mode === 'classic') { mapId = save.settings.map; theme = ['meadow', 'desert', 'tundra', 'volcano', 'cosmos'][CLASSIC_MAPS.indexOf(mapId) % 5] || 'meadow'; }
    else if (mode === 'campaign') { level = D.LEVELS[opts.level - 1]; mapId = level.map; theme = D.WORLDS[level.world].theme; speed = level.speed; power = !!level.power; }
    else if (mode === 'daily') { daily = dailyInfo(); mapId = daily.map; theme = daily.theme; speed = SPEEDS.normal.v; power = true; rng = mulberry(daily.seed); }
    else if (mode === 'time') { mapId = 'open'; theme = 'desert'; speed = 10; power = true; }
    else if (mode === 'zen') { mapId = 'wrap'; theme = 'tundra'; speed = 7; power = false; }
    else if (mode === 'demo') { mapId = 'open'; theme = opts.theme || 'meadow'; speed = 9; power = false; }
    const map = parseMap(mapId);
    const st = findStart(map);
    const snake = [];
    for (let i = 0; i < 4; i++) snake.push({ x: st.x - st.dir.x * i, y: st.y - st.dir.y * i });
    G = {
      mode, map, theme, speed, power, rng, level, daily, wrap: map.wrap,
      snake, prev: snake.map((s) => ({ ...s })), dir: st.dir, queue: [],
      foods: [], pu: null, puTimer: 6 + rng() * 4, effects: { slow: 0, ghost: 0, magnet: 0, double: 0 }, shield: false,
      score: 0, eaten: 0, combo: 0, comboT: 0, bestCombo: 0, moveT: 0, grow: 0, dying: 0, clear: 0, t: 0,
      timeLeft: mode === 'time' ? 75 : 0, portalsUsed: 0, powersGot: 0, ghostWalk: false, grace: 0, steps: 0, newBadges: [], stepsSinceTurn: 0, lastTick: 0
    };
    pops = []; fx.list.length = 0;
    const nFood = mode === 'time' ? 3 : 1;
    for (let i = 0; i < nFood; i++) spawnFood('apple');
    cacheKey = '';
  }

  function occupied(x, y) {
    const i = y * N + x;
    if (G.map.walls[i] || G.map.portals[i]) return true;
    if (G.snake.some((s) => s.x === x && s.y === y)) return true;
    if (G.foods.some((f) => f.x === x && f.y === y)) return true;
    if (G.pu && G.pu.x === x && G.pu.y === y) return true;
    return false;
  }
  function freeCell() {
    const h = G.snake[0], free = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!occupied(x, y) && Math.abs(x - h.x) + Math.abs(y - h.y) > 1) free.push({ x, y });
    if (!free.length) return null;
    return free[Math.floor(G.rng() * free.length)];
  }
  function spawnFood(kind) { const c = freeCell(); if (c) G.foods.push({ ...c, kind, born: time }); return c; }
  function spawnPower() {
    const pool = G.mode === 'time' ? ['clock', 'clock', 'double', 'slow', 'magnet', 'gold', 'shield'] : ['slow', 'ghost', 'magnet', 'double', 'shield', 'scissors', 'gold', 'magnet', 'double'];
    const kind = pool[Math.floor(G.rng() * pool.length)];
    const c = freeCell(); if (!c) return;
    G.pu = { ...c, kind, t: 8, max: 8 };
  }

  const effSpeed = () => {
    let v = G.speed;
    if (G.mode === 'classic' || G.mode === 'daily') v += Math.min(4, G.eaten * 0.1);
    if (G.mode === 'time') v += Math.min(3, G.eaten * 0.06);
    if (G.effects.slow > 0) v *= 0.6;
    return v;
  };
  const interval = () => 1 / effSpeed();

  function enqueue(name) {
    if (state === 'menu' || !G || G.mode === 'demo') return;
    if (state !== 'play') return;
    const d = DIRS[name]; if (!d) return;
    const last = G.queue.length ? G.queue[G.queue.length - 1] : G.dir;
    if (d === last || (d.x === -last.x && d.y === -last.y)) return;
    if (G.queue.length < 3) G.queue.push(d);
    if (G.grace > 0) G.grace = 0;
  }

  function wrapPos(x, y) { return { x: (x + N) % N, y: (y + N) % N }; }
  function blockedFor(x, y, ignoreTail, ghost) {
    if (x < 0 || y < 0 || x >= N || y >= N) return 'edge';
    if (!ghost && G.map.walls[y * N + x]) return 'wall';
    const body = ignoreTail ? G.snake.slice(0, -1) : G.snake;
    if (body.some((s) => s.x === x && s.y === y)) return ghost ? null : 'self';
    return null;
  }
  function nextCell(d) {
    const h = G.snake[0];
    let nx = h.x + d.x, ny = h.y + d.y, tele = null;
    const ghost = G.effects.ghost > 0;
    if (G.wrap || ghost) ({ x: nx, y: ny } = wrapPos(nx, ny));
    if (nx >= 0 && ny >= 0 && nx < N && ny < N) {
      const p = G.map.portals[ny * N + nx];
      if (p) { tele = p.to; nx = p.to.x + d.x; ny = p.to.y + d.y; if (G.wrap || ghost) ({ x: nx, y: ny } = wrapPos(nx, ny)); }
    }
    return { x: nx, y: ny, tele };
  }
  function willGrow(x, y) { return G.grow > 0 || G.foods.some((f) => f.x === x && f.y === y); }

  function step() {
    if (G.queue.length) G.dir = G.queue.shift();
    const ghost = G.effects.ghost > 0;
    let n = nextCell(G.dir);
    let hit = blockedFor(n.x, n.y, !willGrow(n.x, n.y), ghost);
    if (hit && G.mode === 'zen' && hit === 'self') {
      const idx = G.snake.findIndex((s) => s.x === n.x && s.y === n.y);
      if (idx > 0) {
        const cut = G.snake.splice(idx);
        cut.forEach((s, i) => { if (i % 2 === 0) fx.burst((s.x + 0.5) * C, (s.y + 0.5) * C, 3, ['#bfe3ff', '#ffffff'], { speed: 90, life: 0.5, size: 4, gravity: 40, shape: 'dot' }); });
        G.prev.length = G.snake.length;
        audio.snip(); vib(15);
        popText((n.x + 0.5) * C, (n.y + 0.5) * C, 'snip!', '#7fc8ff');
        hit = null;
      }
    }
    if (hit && G.shield) {
      G.shield = false;
      award('shield');
      audio.shield(); vib([20, 30, 20]);
      const h = G.snake[0];
      fx.ring((h.x + 0.5) * C, (h.y + 0.5) * C, '#4fd1a5', 60);
      popText((h.x + 0.5) * C, (h.y + 0.5) * C, 'Shield!', '#2fae85');
      const opts = Object.values(DIRS).filter((d) => !(d.x === -G.dir.x && d.y === -G.dir.y) && d !== G.dir).map((d) => ({ d, c: nextCell(d) }))
        .filter((o) => !blockedFor(o.c.x, o.c.y, true, ghost)).sort((a, b) => space(b.c) - space(a.c));
      G.queue.length = 0;
      if (opts.length) { G.dir = opts[0].d; n = opts[0].c; hit = null; }
      else { G.grace = 0.6; G.prev = G.snake.map((s) => ({ ...s })); return; }
    }
    if (hit) return die(hit);
    if (ghost && G.snake.some((s) => s.x === n.x && s.y === n.y)) { if (!G.ghostWalk) { G.ghostWalk = true; award('ghostwalk'); } }
    const old = G.snake.map((s) => ({ ...s }));
    G.snake.unshift({ x: n.x, y: n.y });
    G.prev = [n.tele ? { x: n.tele.x, y: n.tele.y } : old[0], ...old];
    if (n.tele) {
      G.portalsUsed++; save.stats.portals++;
      audio.portal(); vib(10);
      fx.ring((n.tele.x + 0.5) * C, (n.tele.y + 0.5) * C, PORTAL_COL[G.map.portals[n.tele.y * N + n.tele.x].k][0], 40);
      if (G.portalsUsed >= 10) award('portal10');
    }
    G.steps++;
    const cx = (n.x + 0.5) * C, cy = (n.y + 0.5) * C;
    const fi = G.foods.findIndex((f) => f.x === n.x && f.y === n.y);
    if (fi >= 0) eat(G.foods.splice(fi, 1)[0], cx, cy);
    if (G.pu && G.pu.x === n.x && G.pu.y === n.y) takePower(G.pu, cx, cy);
    if (G.grow > 0) G.grow--; else { G.snake.pop(); G.prev.pop(); }
    if (G.prev.length > G.snake.length) G.prev.length = G.snake.length;
    if (G.effects.magnet > 0 && G.steps % 2 === 0) magnetPull();
    hud();
  }

  function space(c) {
    const seen = new Uint8Array(N * N), q = [c]; let n = 0;
    const body = new Set(G.snake.map((s) => s.y * N + s.x));
    while (q.length && n < 120) {
      const p = q.pop(); if (p.x < 0 || p.y < 0 || p.x >= N || p.y >= N) continue;
      const i = p.y * N + p.x; if (seen[i] || G.map.walls[i] || body.has(i)) continue;
      seen[i] = 1; n++; q.push({ x: p.x + 1, y: p.y }, { x: p.x - 1, y: p.y }, { x: p.x, y: p.y + 1 }, { x: p.x, y: p.y - 1 });
    }
    return n;
  }

  function eat(f, cx, cy) {
    const gold = f.kind === 'gold';
    G.eaten++;
    G.combo = G.comboT > 0 ? G.combo + 1 : 1;
    G.comboT = 2.8;
    G.bestCombo = Math.max(G.bestCombo, G.combo);
    const mult = Math.min(5, G.combo) * (G.effects.double > 0 ? 2 : 1);
    const pts = (gold ? 50 : 10) * mult;
    G.score += pts;
    G.grow += gold ? 3 : 1;
    if (G.mode !== 'demo') {
      save.stats.apples++;
      if (G.eaten === 1) award('first');
      if (Math.min(5, G.combo) >= 5) award('combo5');
      if (save.stats.apples >= 1000) award('apples1000');
    }
    if (G.mode !== 'demo') { audio.eat(Math.min(8, G.combo - 1)); vib(8); }
    const cols = gold ? ['#ffd54a', '#fff3b0', '#ffb300'] : ['#ff4d4d', '#ff8a5c', '#7ed957', '#fff3b0'];
    fx.burst(cx, cy, gold ? 28 : 16, cols, { speed: 210, life: 0.6, size: 5, gravity: 140, shape: gold ? 'star' : 'sq' });
    fx.ring(cx, cy, gold ? '#ffd54a' : '#ffffff', 26);
    popText(cx, cy, '+' + pts, gold ? '#ffb300' : null, Math.min(5, G.combo) > 1 ? 'x' + Math.min(5, G.combo) + ' combo' : '');
    if (G.mode === 'demo') { spawnFood('apple'); return; }
    if (!gold) spawnFood('apple');
    if (!gold && G.eaten % 6 === 0 && G.mode !== 'zen') spawnFood('gold');
    bump('score');
    if (G.mode === 'campaign' && G.eaten >= G.level.goal) levelClear();
    if (!G.foods.length && G.mode !== 'campaign') spawnFood('apple');
  }

  function takePower(p, cx, cy) {
    const P = D.POWERS[p.kind];
    G.pu = null;
    G.powersGot++; save.stats.powers++;
    if (G.powersGot >= 5) award('power5');
    audio.power(); vib([10, 20, 10]);
    fx.burst(cx, cy, 26, [P.color, '#ffffff'], { speed: 230, life: 0.7, size: 5, gravity: 60, shape: 'star' });
    fx.ring(cx, cy, P.color, 50);
    if (p.kind === 'gold') { G.score += 50 * (G.effects.double > 0 ? 2 : 1); G.grow += 3; popText(cx, cy, '+50', '#ffb300'); }
    else if (p.kind === 'shield') { G.shield = true; popText(cx, cy, 'Shield up', P.color); }
    else if (p.kind === 'scissors') {
      const keep = Math.max(4, Math.ceil(G.snake.length * 2 / 3));
      const cut = G.snake.splice(keep); G.prev.length = G.snake.length;
      cut.forEach((s) => fx.burst((s.x + 0.5) * C, (s.y + 0.5) * C, 2, ['#9aa7b4', '#ffffff'], { speed: 80, life: 0.5, size: 4, gravity: 60 }));
      popText(cx, cy, 'Snip!', P.color); audio.snip();
    }
    else if (p.kind === 'clock') { G.timeLeft += 6; popText(cx, cy, '+6s', P.color); }
    else { G.effects[p.kind] = P.dur; popText(cx, cy, P.name, P.color); if (p.kind === 'ghost') save.stats.ghosts++; }
    renderChips(true);
  }

  function magnetPull() {
    const h = G.snake[0];
    for (const f of G.foods) {
      const dx = h.x - f.x, dy = h.y - f.y;
      if (Math.abs(dx) + Math.abs(dy) > 6 || Math.abs(dx) + Math.abs(dy) < 2) continue;
      const cand = Math.abs(dx) >= Math.abs(dy) ? [{ x: f.x + Math.sign(dx), y: f.y }, { x: f.x, y: f.y + Math.sign(dy) }] : [{ x: f.x, y: f.y + Math.sign(dy) }, { x: f.x + Math.sign(dx), y: f.y }];
      for (const c of cand) {
        if (c.x === f.x && c.y === f.y) continue;
        if (c.x < 0 || c.y < 0 || c.x >= N || c.y >= N || occupied(c.x, c.y)) continue;
        fx.burst((f.x + 0.5) * C, (f.y + 0.5) * C, 2, ['#ff6b6b', '#ffd0d0'], { speed: 40, life: 0.3, size: 3, gravity: 0, shape: 'dot' });
        f.x = c.x; f.y = c.y; break;
      }
    }
  }

  function popText(x, y, text, color, sub = '') { pops.push({ x, y, text, color, sub, t: 0 }); }

  function die(reason) {
    G.dying = 1.0; G.reason = reason;
    if (G.mode !== 'demo') { shake = 0.45; flash = 1; audio.die(); vib([40, 40, 80]); }
    const h = G.snake[0];
    fx.burst((h.x + 0.5) * C, (h.y + 0.5) * C, 34, ['#e74c3c', '#ffb142', '#ffffff'], { speed: 280, life: 0.9, size: 6, gravity: 220 });
  }

  function levelClear() {
    G.clear = 1.1;
    audio.win(); vib([20, 40, 20, 40, 60]);
    Curio.confetti(90);
  }

  function update(dt) {
    time += dt;
    fx.update(dt);
    shake = Math.max(0, shake - dt);
    flash = Math.max(0, flash - dt * 2.5);
    for (const p of pops) p.t += dt;
    pops = pops.filter((p) => p.t < 0.9);
    if (!G) return;
    if (state === 'countdown') {
      const before = Math.ceil(countdown);
      countdown -= dt;
      if (Math.ceil(countdown) !== before && countdown > 0) audio.tick();
      if (countdown <= 0) { state = 'play'; audio.go(); }
      return;
    }
    if (state !== 'play' && !(state === 'menu' && G.mode === 'demo')) return;
    if (G.dying) {
      G.dying -= dt;
      if (G.dying <= 0) { if (G.mode === 'demo') startDemo(); else gameOver(); }
      return;
    }
    if (G.clear) { G.clear -= dt; if (G.clear <= 0) gameOver(true); return; }
    G.t += dt;
    if (G.mode !== 'demo') save.stats.time += dt;
    for (const k in G.effects) if (G.effects[k] > 0) G.effects[k] = Math.max(0, G.effects[k] - dt);
    if (G.comboT > 0) { G.comboT -= dt; if (G.comboT <= 0) G.combo = 0; }
    if (G.mode === 'time') {
      const before = Math.ceil(G.timeLeft);
      G.timeLeft -= dt;
      if (G.timeLeft <= 5 && Math.ceil(G.timeLeft) !== before) audio.tick();
      if (G.timeLeft <= 0) { G.timeLeft = 0; hud(); return gameOver(false, 'time'); }
    }
    if (G.power) {
      if (G.pu) { G.pu.t -= dt; if (G.pu.t <= 0) G.pu = null; }
      else { G.puTimer -= dt; if (G.puTimer <= 0) { spawnPower(); G.puTimer = (G.mode === 'time' ? 6 : 10) + G.rng() * 6; } }
    }
    if (G.grace > 0) { G.grace -= dt; G.moveT = 0; if (G.grace > 0) return; }
    G.moveT += dt;
    const iv = interval();
    let n = 0;
    while (G.moveT >= iv && n++ < 4) {
      G.moveT -= iv;
      if (G.mode === 'demo' || autoPilot) aiSteer();
      step();
      if (G.dying || G.clear || state === 'over') { G.moveT = 0; break; }
    }
    if (G.mode !== 'demo' && time - G.lastTick > 0.25) { G.lastTick = time; renderChips(); if (G.mode === 'time') hud(); }
  }

  function aiSteer() {
    const h = G.snake[0], f = G.foods[0];
    const opts = Object.values(DIRS).filter((d) => !(d.x === -G.dir.x && d.y === -G.dir.y)).map((d) => {
      const c = nextCell(d);
      if (blockedFor(c.x, c.y, true, false)) return null;
      const sp = space(c);
      const dist = f ? Math.abs(c.x - f.x) + Math.abs(c.y - f.y) : 0;
      return { d, score: (sp < G.snake.length ? -1000 + sp : 0) - dist + (d === G.dir ? 0.3 : 0) + Math.random() * 0.2 };
    }).filter(Boolean).sort((a, b) => b.score - a.score);
    if (opts.length) G.dir = opts[0].d;
    if (G.mode === 'demo' && G.snake.length > 40) { G.snake.length = 30; G.prev.length = 30; }
    void h;
  }

  function points(t) {
    const pts = [];
    for (let i = 0; i < G.snake.length; i++) {
      const cur = G.snake[i], from = G.prev[i] || cur;
      let dx = cur.x - from.x, dy = cur.y - from.y;
      let x, y;
      if (Math.abs(dx) + Math.abs(dy) > 1.5) {
        if ((G.wrap || G.effects.ghost > 0) && (Math.abs(dx) === N - 1 || Math.abs(dy) === N - 1) && Math.abs(dx) + Math.abs(dy) === N - 1) {
          if (dx > 1) dx -= N; if (dx < -1) dx += N; if (dy > 1) dy -= N; if (dy < -1) dy += N;
          x = cur.x - dx * (1 - t); y = cur.y - dy * (1 - t);
        } else if (i === 0) { x = from.x + (cur.x - from.x) * t; y = from.y + (cur.y - from.y) * t; pts.push({ x, y, jump: true }); continue; }
        else { x = cur.x; y = cur.y; }
      } else { x = from.x + dx * t; y = from.y + dy * t; }
      pts.push({ x, y });
    }
    return pts;
  }

  function skinColor(skin, s, len, tm) {
    const c = skin.c;
    switch (skin.kind) {
      case 'gradient': return mixHex(c[0], c[1], Math.min(1, s / Math.max(6, len)));
      case 'stripes': return Math.floor(s / (skin.stripe || 0.55)) % 2 ? c[1] : c[0];
      case 'rainbow': return `hsl(${(s * 22 - tm * 90) % 360}, 85%, 58%)`;
      case 'neon': return c[1];
      case 'galaxy': return mixHex(c[0], c[1], 0.5 + 0.5 * Math.sin(s * 0.7 + tm));
      case 'metal': return mixHex(c[0], '#fff6cc', Math.max(0, Math.sin(s * 0.9 - tm * 4)) * 0.6);
      case 'lava': return mixHex(c[1], c[0], 0.45 + 0.55 * Math.max(0, Math.sin(s * 1.8 - tm * 5)));
      case 'segments': return Math.floor(s) % 2 ? c[0] : shade(c[0], -0.12);
      default: return c[0];
    }
  }
  function outlineColor(skin) { return skin.outline || (skin.kind === 'neon' ? skin.c[0] : skin.c[1]); }

  function drawBody(g, pts, cs, skin, o = {}) {
    if (!pts.length) return;
    const tm = o.time || 0, dead = o.dead, R = cs * 0.4;
    const runs = []; let cur = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      if (Math.abs(a.x - b.x) > 1.5 || Math.abs(a.y - b.y) > 1.5 || a.jump) { runs.push(cur); cur = [b]; } else cur.push(b);
    }
    runs.push(cur);
    const samples = [];
    let s = 0;
    for (const run of runs) {
      for (let i = 0; i < run.length; i++) {
        const a = run[i], b = run[i + 1];
        if (!b) { samples.push({ x: a.x, y: a.y, s }); continue; }
        const L = Math.hypot(b.x - a.x, b.y - a.y), n = Math.max(1, Math.ceil(L / 0.2));
        for (let k = 0; k < n; k++) samples.push({ x: a.x + (b.x - a.x) * k / n, y: a.y + (b.y - a.y) * k / n, s: s + L * k / n });
        s += L;
      }
      s += 1;
    }
    const total = Math.max(1, s);
    const rad = (q) => { const fromTail = total - q.s; return R * (fromTail < 2.5 ? 0.55 + 0.45 * fromTail / 2.5 : 1); };
    const X = (q) => (q.x + 0.5) * cs + (o.ox || 0), Y = (q) => (q.y + 0.5) * cs + (o.oy || 0);
    g.save();
    if (skin.kind === 'ghost' || o.ghosting) g.globalAlpha = o.ghosting ? 0.55 : 0.75;
    if (skin.kind === 'neon') { g.shadowColor = skin.c[0]; g.shadowBlur = cs * 0.6; }
    g.fillStyle = dead ? '#7a1f1f' : outlineColor(skin);
    for (let i = samples.length - 1; i >= 0; i -= 1) { const q = samples[i]; g.beginPath(); g.arc(X(q), Y(q), rad(q) + cs * 0.07, 0, 7); g.fill(); }
    g.shadowBlur = 0;
    for (let i = samples.length - 1; i >= 0; i--) {
      const q = samples[i];
      g.fillStyle = dead && flash > 0 ? mixHex('#ff6b6b', skinColor(skin, q.s, total, tm).startsWith('#') ? skinColor(skin, q.s, total, tm) : '#ff6b6b', 1 - flash) : skinColor(skin, q.s, total, tm);
      g.beginPath(); g.arc(X(q), Y(q), rad(q), 0, 7); g.fill();
    }
    g.globalAlpha *= 0.4; g.strokeStyle = skin.belly; g.lineCap = 'round'; g.lineJoin = 'round';
    let run = [];
    const flushHi = () => {
      if (run.length < 2) { run = []; return; }
      g.lineWidth = R * 0.62;
      g.beginPath();
      run.forEach((q, i) => { const x = X(q) - rad(q) * 0.2, y = Y(q) - rad(q) * 0.3; if (i) g.lineTo(x, y); else g.moveTo(x, y); });
      g.stroke();
      run = [];
    };
    g.beginPath();
    for (let i = 0; i < samples.length; i++) {
      const q = samples[i], p = samples[i - 1];
      if (p && (Math.abs(p.x - q.x) > 0.6 || Math.abs(p.y - q.y) > 0.6)) flushHi();
      if (i % 3 === 0 || i === samples.length - 1) run.push(q);
    }
    flushHi();
    g.globalAlpha = skin.kind === 'ghost' ? 0.75 : 1;
    if (o.ghosting) g.globalAlpha = 0.55;
    if (skin.kind === 'spots' || skin.kind === 'diamonds' || skin.kind === 'segments' || skin.kind === 'galaxy') {
      let k = 0;
      for (const q of samples) {
        const step = skin.kind === 'segments' ? 1 : skin.kind === 'galaxy' ? 0.6 : 1.2;
        if (q.s < 0.8 || q.s / step - Math.floor(q.s / step) > 0.2 / step) continue;
        k++;
        const r = rad(q), x = X(q), y = Y(q);
        if (skin.kind === 'spots') { g.fillStyle = skin.spot; g.beginPath(); g.arc(x + (k % 2 ? r * 0.3 : -r * 0.3), y + (k % 2 ? -r * 0.2 : r * 0.25), r * 0.28, 0, 7); g.fill(); }
        else if (skin.kind === 'diamonds') { g.fillStyle = skin.spot; g.beginPath(); g.moveTo(x, y - r * 0.6); g.lineTo(x + r * 0.45, y); g.lineTo(x, y + r * 0.6); g.lineTo(x - r * 0.45, y); g.closePath(); g.fill(); }
        else if (skin.kind === 'segments') { g.fillStyle = (k + Math.floor(tm * 6)) % 4 === 0 ? skin.spot : 'rgba(0,0,0,.25)'; g.beginPath(); g.arc(x, y, r * 0.2, 0, 7); g.fill(); }
        else { const tw = 0.5 + 0.5 * Math.sin(tm * 4 + k * 1.7); g.fillStyle = `rgba(255,255,255,${0.35 + tw * 0.65})`; starPath(g, x + Math.sin(k * 2.3) * r * 0.45, y + Math.cos(k * 1.9) * r * 0.45, r * 0.22 * (0.6 + tw * 0.6), r * 0.08, 4); g.fill(); }
      }
    }
    g.restore();
    if (o.noHead) return;
    const h = samples[0], d = o.dir || DIRS.right;
    const hx = X(h), hy = Y(h), hr = R * 1.12;
    g.save();
    if (skin.kind === 'ghost' || o.ghosting) g.globalAlpha = o.ghosting ? 0.6 : 0.8;
    const grad = g.createRadialGradient(hx - hr * 0.3, hy - hr * 0.4, hr * 0.1, hx, hy, hr * 1.1);
    const hc = skinColor(skin, 0, total, tm), hcs = hc.startsWith('#') ? hc : skin.c[0];
    grad.addColorStop(0, shade(hcs, 0.25)); grad.addColorStop(1, dead && flash > 0 ? '#ff6b6b' : hcs);
    g.fillStyle = dead ? '#7a1f1f' : outlineColor(skin);
    g.beginPath(); g.ellipse(hx, hy, hr + cs * 0.07, hr + cs * 0.07, 0, 0, 7); g.fill();
    g.fillStyle = grad;
    g.beginPath(); g.ellipse(hx, hy, hr, hr, 0, 0, 7); g.fill();
    const px = -d.y, py = d.x;
    const blink = !dead && (tm % 3.7) < 0.12;
    for (const sd of [-1, 1]) {
      const ex = hx + d.x * cs * 0.12 + px * sd * cs * 0.21, ey = hy + d.y * cs * 0.12 + py * sd * cs * 0.21;
      g.fillStyle = '#ffffff';
      g.beginPath(); g.arc(ex, ey, cs * 0.14, 0, 7); g.fill();
      if (dead) {
        g.strokeStyle = '#1a1a1a'; g.lineWidth = cs * 0.07; g.lineCap = 'round';
        g.beginPath(); g.moveTo(ex - cs * 0.08, ey - cs * 0.08); g.lineTo(ex + cs * 0.08, ey + cs * 0.08); g.moveTo(ex + cs * 0.08, ey - cs * 0.08); g.lineTo(ex - cs * 0.08, ey + cs * 0.08); g.stroke();
      } else if (blink) {
        g.strokeStyle = '#1a1a1a'; g.lineWidth = cs * 0.06; g.beginPath(); g.moveTo(ex - px * cs * 0.1, ey - py * cs * 0.1); g.lineTo(ex + px * cs * 0.1, ey + py * cs * 0.1); g.stroke();
      } else {
        const lk = o.look || { x: d.x, y: d.y };
        g.fillStyle = '#16161a'; g.beginPath(); g.arc(ex + lk.x * cs * 0.05, ey + lk.y * cs * 0.05, cs * 0.075, 0, 7); g.fill();
        g.fillStyle = '#ffffff'; g.beginPath(); g.arc(ex + lk.x * cs * 0.05 - cs * 0.025, ey + lk.y * cs * 0.05 - cs * 0.03, cs * 0.025, 0, 7); g.fill();
      }
    }
    g.fillStyle = 'rgba(255,120,140,.45)';
    for (const sd of [-1, 1]) { g.beginPath(); g.arc(hx - d.x * cs * 0.05 + px * sd * cs * 0.3, hy - d.y * cs * 0.05 + py * sd * cs * 0.3, cs * 0.07, 0, 7); g.fill(); }
    if (!dead && Math.sin(tm * 5) > 0.7) {
      g.strokeStyle = '#e8435a'; g.lineWidth = cs * 0.08; g.lineCap = 'round';
      const tx = hx + d.x * hr, ty = hy + d.y * hr;
      g.beginPath(); g.moveTo(tx, ty); g.lineTo(tx + d.x * cs * 0.3, ty + d.y * cs * 0.3);
      g.lineTo(tx + d.x * cs * 0.42 + px * cs * 0.12, ty + d.y * cs * 0.42 + py * cs * 0.12);
      g.moveTo(tx + d.x * cs * 0.3, ty + d.y * cs * 0.3); g.lineTo(tx + d.x * cs * 0.42 - px * cs * 0.12, ty + d.y * cs * 0.42 - py * cs * 0.12); g.stroke();
    }
    g.restore();
  }

  function themeOf(id) { return D.THEMES[id] || D.THEMES.meadow; }
  function boardColors(th) {
    const dk = dark && !th.dark;
    return { a: dk ? th.da : th.a, b: dk ? th.db : th.b, wall: dk ? th.dwall : th.wall, top: dk ? th.dwallTop : th.wallTop, wdark: th.wallDark, edge: dk ? th.dedge : th.edge, ink: dk ? th.dink : th.ink };
  }

  function buildBoard() {
    const key = [G.map.id, G.theme, dark, canvas.width].join('|');
    if (key === cacheKey && boardCache) return;
    cacheKey = key;
    boardCache = boardCache || document.createElement('canvas');
    boardCache.width = canvas.width; boardCache.height = canvas.height;
    const g = boardCache.getContext('2d');
    g.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    paintBoard(g, G.map, G.theme, C, true);
  }

  function paintBoard(g, map, themeId, cs, detail) {
    const th = themeOf(themeId), col = boardColors(th), n = N, Wd = n * cs;
    const rnd = mulberry(hashStr(map.id + themeId));
    g.fillStyle = col.a; g.fillRect(0, 0, Wd, Wd);
    g.fillStyle = col.b;
    for (let y = 0; y < n; y++) for (let x = y % 2; x < n; x += 2) g.fillRect(x * cs, y * cs, cs, cs);
    const vg = g.createRadialGradient(Wd / 2, Wd / 2, Wd * 0.2, Wd / 2, Wd / 2, Wd * 0.75);
    vg.addColorStop(0, 'rgba(255,255,255,0)'); vg.addColorStop(1, th.dark || dark ? 'rgba(0,0,0,.28)' : 'rgba(60,40,10,.10)');
    g.fillStyle = vg; g.fillRect(0, 0, Wd, Wd);
    if (detail) {
      for (let i = 0; i < 46; i++) {
        const x = Math.floor(rnd() * n), y = Math.floor(rnd() * n);
        if (map.walls[y * n + x]) continue;
        const px = (x + 0.2 + rnd() * 0.6) * cs, py = (y + 0.2 + rnd() * 0.6) * cs;
        decor(g, th.decor, px, py, cs, rnd);
      }
    }
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (map.walls[y * n + x]) wallCell(g, th, col, map, x, y, cs);
    if (map.wrap) {
      g.strokeStyle = th.dark || dark ? 'rgba(255,255,255,.25)' : 'rgba(40,60,20,.3)';
      g.setLineDash([cs * 0.35, cs * 0.35]); g.lineWidth = cs * 0.1; g.strokeRect(cs * 0.08, cs * 0.08, Wd - cs * 0.16, Wd - cs * 0.16); g.setLineDash([]);
    } else {
      g.strokeStyle = col.edge; g.lineWidth = cs * 0.22; rrect(g, cs * 0.11, cs * 0.11, Wd - cs * 0.22, Wd - cs * 0.22, cs * 0.6); g.stroke();
    }
  }

  function decor(g, kind, x, y, cs, rnd) {
    const s = cs / 24;
    g.save(); g.translate(x, y); g.scale(s, s);
    if (kind === 'flowers') {
      if (rnd() < 0.5) {
        const pc = ['#ffffff', '#ffd54a', '#ff8fb1', '#b39ddb'][Math.floor(rnd() * 4)];
        g.fillStyle = pc; for (let i = 0; i < 5; i++) { const a = i * 1.2566; g.beginPath(); g.arc(Math.cos(a) * 2.6, Math.sin(a) * 2.6, 1.9, 0, 7); g.fill(); }
        g.fillStyle = '#ffb300'; g.beginPath(); g.arc(0, 0, 1.5, 0, 7); g.fill();
      } else { g.strokeStyle = dark ? 'rgba(140,200,110,.35)' : 'rgba(70,130,40,.45)'; g.lineWidth = 1.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(-3, 3); g.lineTo(-4, -2); g.moveTo(0, 3); g.lineTo(0, -4); g.moveTo(3, 3); g.lineTo(4, -2); g.stroke(); }
    } else if (kind === 'cactus') {
      if (rnd() < 0.35) { g.fillStyle = '#5c9e45'; rrect(g, -1.6, -6, 3.2, 10, 1.6); g.fill(); rrect(g, -5, -3, 2.4, 5, 1.2); g.fill(); rrect(g, 2.6, -4, 2.4, 4, 1.2); g.fill(); g.fillRect(-3, 0, 2, 1.6); g.fillRect(1.4, -1.5, 2, 1.6); }
      else { g.fillStyle = dark ? 'rgba(255,220,160,.12)' : 'rgba(150,100,40,.22)'; g.beginPath(); g.ellipse(0, 0, 2.6 + rnd() * 2, 1.6 + rnd(), rnd() * 3, 0, 7); g.fill(); }
    } else if (kind === 'snow') {
      g.strokeStyle = dark ? 'rgba(200,230,255,.3)' : 'rgba(120,170,210,.5)'; g.lineWidth = 1.1; g.lineCap = 'round';
      for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3; g.beginPath(); g.moveTo(Math.cos(a) * 4, Math.sin(a) * 4); g.lineTo(-Math.cos(a) * 4, -Math.sin(a) * 4); g.stroke(); }
    } else if (kind === 'lava') {
      g.strokeStyle = 'rgba(255,110,40,.55)'; g.lineWidth = 1.4; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-6, -2); g.lineTo(-2, 1); g.lineTo(1, -1); g.lineTo(6, 3); g.stroke();
      g.strokeStyle = 'rgba(255,200,90,.35)'; g.lineWidth = 0.6; g.stroke();
    } else if (kind === 'stars') {
      g.fillStyle = `rgba(255,255,255,${0.25 + rnd() * 0.5})`; g.beginPath(); g.arc(0, 0, 0.6 + rnd() * 1.1, 0, 7); g.fill();
    }
    g.restore();
  }

  function wallCell(g, th, col, map, x, y, cs) {
    const px = x * cs, py = y * cs, n = N, W8 = (i, j) => i >= 0 && j >= 0 && i < n && j < n && map.walls[j * n + i];
    const r = cs * 0.22;
    g.fillStyle = 'rgba(0,0,0,.18)'; rrect(g, px + cs * 0.06, py + cs * 0.14, cs, cs, r); g.fill();
    const L = W8(x - 1, y), R = W8(x + 1, y), U = W8(x, y - 1), Dn = W8(x, y + 1);
    g.fillStyle = col.wall;
    rrect(g, px - (L ? 1 : 0), py - (U ? 1 : 0), cs + (L ? 1 : 0) + (R ? 1 : 0), cs + (U ? 1 : 0) + (Dn ? 1 : 0), L || R || U || Dn ? cs * 0.08 : r); g.fill();
    g.fillStyle = col.top;
    rrect(g, px + cs * 0.1, py + cs * 0.08, cs * 0.8, cs * 0.6, cs * 0.18); g.fill();
    if (th.decor === 'flowers') { g.fillStyle = 'rgba(30,70,20,.35)'; for (const [a, b] of [[0.3, 0.3], [0.65, 0.45], [0.4, 0.7]]) { g.beginPath(); g.arc(px + a * cs, py + b * cs, cs * 0.09, 0, 7); g.fill(); } }
    else if (th.decor === 'cactus') { g.strokeStyle = 'rgba(90,50,20,.35)'; g.lineWidth = cs * 0.05; g.beginPath(); g.moveTo(px, py + cs * 0.5); g.lineTo(px + cs, py + cs * 0.5); g.moveTo(px + cs * 0.5, py); g.lineTo(px + cs * 0.5, py + cs * 0.5); g.stroke(); }
    else if (th.decor === 'snow') { g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = cs * 0.07; g.lineCap = 'round'; g.beginPath(); g.moveTo(px + cs * 0.22, py + cs * 0.55); g.lineTo(px + cs * 0.5, py + cs * 0.22); g.stroke(); }
    else if (th.decor === 'lava') { g.strokeStyle = 'rgba(255,110,40,.8)'; g.lineWidth = cs * 0.06; g.beginPath(); g.moveTo(px + cs * 0.15, py + cs * 0.85); g.lineTo(px + cs * 0.45, py + cs * 0.6); g.lineTo(px + cs * 0.8, py + cs * 0.82); g.stroke(); }
    else if (th.decor === 'stars') { g.strokeStyle = 'rgba(180,200,255,.8)'; g.lineWidth = cs * 0.05; rrect(g, px + cs * 0.18, py + cs * 0.16, cs * 0.64, cs * 0.5, cs * 0.12); g.stroke(); }
  }

  function drawApple(g, x, y, s, gold) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(0, C * 0.38, C * 0.3, C * 0.08, 0, 0, 7); g.fill();
    const grd = g.createRadialGradient(-C * 0.12, -C * 0.08, C * 0.04, 0, C * 0.04, C * 0.42);
    if (gold) { grd.addColorStop(0, '#fff6c2'); grd.addColorStop(0.5, '#ffcf3a'); grd.addColorStop(1, '#c48a00'); }
    else { grd.addColorStop(0, '#ff7a6b'); grd.addColorStop(0.55, '#e53935'); grd.addColorStop(1, '#a51d1d'); }
    g.fillStyle = grd;
    g.beginPath(); g.arc(-C * 0.12, C * 0.04, C * 0.29, 0, 7); g.arc(C * 0.12, C * 0.04, C * 0.29, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.ellipse(-C * 0.17, -C * 0.06, C * 0.07, C * 0.11, -0.5, 0, 7); g.fill();
    g.strokeStyle = '#6d4c41'; g.lineWidth = C * 0.09; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, -C * 0.18); g.lineTo(C * 0.04, -C * 0.36); g.stroke();
    g.fillStyle = '#43a047'; g.beginPath(); g.ellipse(C * 0.15, -C * 0.31, C * 0.13, C * 0.065, -0.5, 0, 7); g.fill();
    g.restore();
  }

  function drawPowerIcon(g, kind, x, y, r, tm = 0) {
    const P = D.POWERS[kind];
    g.save(); g.translate(x, y);
    const grd = g.createRadialGradient(-r * 0.3, -r * 0.4, r * 0.1, 0, 0, r);
    grd.addColorStop(0, '#ffffff'); grd.addColorStop(1, P.color);
    g.fillStyle = grd; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill();
    g.strokeStyle = shade(P.color, -0.35); g.lineWidth = r * 0.12; g.stroke();
    const k = r / 12;
    g.scale(k, k);
    g.lineCap = 'round'; g.lineJoin = 'round';
    if (kind === 'gold') { drawAppleMini(g); }
    else if (kind === 'slow') { g.fillStyle = '#8d5a3b'; g.beginPath(); g.arc(1, -1, 5.5, 0, 7); g.fill(); g.strokeStyle = '#f3d2a2'; g.lineWidth = 1.4; g.beginPath(); for (let a = 0; a < 9; a += 0.3) { const rr = a * 0.55; g.lineTo(1 + Math.cos(a) * rr, -1 + Math.sin(a) * rr); } g.stroke(); g.fillStyle = '#c9e07a'; rrect(g, -8, 3, 14, 3.5, 1.7); g.fill(); g.strokeStyle = '#7a8f3a'; g.lineWidth = 1; g.beginPath(); g.moveTo(-6, 3); g.lineTo(-8, -1); g.stroke(); }
    else if (kind === 'ghost') { g.fillStyle = '#ffffff'; g.beginPath(); g.arc(0, -1.5, 5.5, Math.PI, 0); g.lineTo(5.5, 6); for (let i = 0; i < 4; i++) g.lineTo(5.5 - (i + 0.5) * 2.75, i % 2 ? 6 : 3.8); g.lineTo(-5.5, 6); g.closePath(); g.fill(); g.fillStyle = '#3a3a5a'; g.beginPath(); g.arc(-2, -1.5, 1.2, 0, 7); g.arc(2, -1.5, 1.2, 0, 7); g.fill(); }
    else if (kind === 'magnet') { g.strokeStyle = '#d63031'; g.lineWidth = 3.6; g.beginPath(); g.arc(0, -0.5, 4.5, Math.PI, 0); g.lineTo(4.5, 5); g.moveTo(-4.5, -0.5); g.lineTo(-4.5, 5); g.stroke(); g.strokeStyle = '#e0e6ec'; g.beginPath(); g.moveTo(-4.5, 4); g.lineTo(-4.5, 7); g.moveTo(4.5, 4); g.lineTo(4.5, 7); g.stroke(); }
    else if (kind === 'double') { g.fillStyle = '#7a3c00'; g.font = `900 11px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('x2', 0, 0.8); }
    else if (kind === 'shield') { g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(0, -7); g.lineTo(6, -4.5); g.quadraticCurveTo(6, 4, 0, 7.5); g.quadraticCurveTo(-6, 4, -6, -4.5); g.closePath(); g.fill(); g.fillStyle = '#2fae85'; g.beginPath(); g.moveTo(0, -4.5); g.lineTo(3.6, -3); g.quadraticCurveTo(3.6, 2.8, 0, 5); g.closePath(); g.fill(); }
    else if (kind === 'scissors') { g.strokeStyle = '#3c4650'; g.lineWidth = 1.6; g.beginPath(); g.arc(-3.5, 4, 2.2, 0, 7); g.moveTo(5.7, 4); g.arc(3.5, 4, 2.2, 0, 7); g.stroke(); g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.beginPath(); g.moveTo(-2, 2.4); g.lineTo(4, -7); g.moveTo(2, 2.4); g.lineTo(-4, -7); g.stroke(); }
    else if (kind === 'clock') { g.fillStyle = '#ffffff'; g.beginPath(); g.arc(0, 0, 6.5, 0, 7); g.fill(); g.strokeStyle = '#2b7a3a'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -4.5); g.moveTo(0, 0); g.lineTo(3.4, 1.6); g.stroke(); }
    g.restore();
    void tm;
  }
  function drawAppleMini(g) {
    g.fillStyle = '#ffcf3a'; g.beginPath(); g.arc(-2.4, 1, 4.6, 0, 7); g.arc(2.4, 1, 4.6, 0, 7); g.fill();
    g.fillStyle = '#fff7cc'; g.beginPath(); g.ellipse(-3, -0.6, 1.2, 2, -0.5, 0, 7); g.fill();
    g.strokeStyle = '#6d4c41'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(0, -2.5); g.lineTo(0.6, -6); g.stroke();
  }

  function drawPortal(g, x, y, k, tm) {
    const [c1, c2] = PORTAL_COL[k] || PORTAL_COL.a, cx = (x + 0.5) * C, cy = (y + 0.5) * C;
    g.save(); g.translate(cx, cy);
    const grd = g.createRadialGradient(0, 0, 1, 0, 0, C * 0.6);
    grd.addColorStop(0, c2); grd.addColorStop(0.55, c1); grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd; g.beginPath(); g.arc(0, 0, C * 0.62, 0, 7); g.fill();
    g.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      g.rotate(tm * (2 + i) + i * 2);
      g.strokeStyle = i % 2 ? '#ffffff' : c2; g.globalAlpha = 0.85 - i * 0.2; g.lineWidth = C * 0.08;
      g.beginPath(); g.arc(0, 0, C * (0.42 - i * 0.11), 0, Math.PI * 1.2); g.stroke();
    }
    g.restore();
  }

  function fit() {
    const r = stage.getBoundingClientRect();
    const size = Math.max(160, Math.floor(Math.min(r.width, r.height)));
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    canvas.style.width = size + 'px'; canvas.style.height = size + 'px';
    canvas.width = Math.round(size * dpr); canvas.height = Math.round(size * dpr);
    cacheKey = '';
  }

  function draw() {
    if (!G) return;
    buildBoard();
    const g = ctx;
    g.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    g.save();
    if (shake > 0) g.translate((Math.random() - 0.5) * shake * 22, (Math.random() - 0.5) * shake * 22);
    g.drawImage(boardCache, 0, 0, W, H);
    const th = themeOf(G.theme);
    if (th.decor === 'stars') {
      for (let i = 0; i < 18; i++) { const x = (i * 97.3) % W, y = (i * 53.7 + 31) % H, a = 0.5 + 0.5 * Math.sin(time * 2 + i); g.fillStyle = `rgba(255,255,255,${a * 0.8})`; starPath(g, x, y, 2.6 * a + 0.5, 0.8, 4); g.fill(); }
    } else if (th.decor === 'lava') {
      g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 6; i++) { const x = (i * 131) % W, y = (i * 77 + 50) % H, a = 0.15 + 0.1 * Math.sin(time * 1.5 + i * 2); const rg = g.createRadialGradient(x, y, 0, x, y, 60); rg.addColorStop(0, `rgba(255,90,20,${a})`); rg.addColorStop(1, 'rgba(255,90,20,0)'); g.fillStyle = rg; g.fillRect(x - 60, y - 60, 120, 120); }
      g.globalCompositeOperation = 'source-over';
    } else if (th.decor === 'snow') {
      g.fillStyle = 'rgba(255,255,255,.7)';
      for (let i = 0; i < 22; i++) { const x = ((i * 71.3) + Math.sin(time + i) * 10 + W) % W, y = ((i * 37.1) + time * (14 + (i % 5) * 4)) % H; g.beginPath(); g.arc(x, y, 1 + (i % 3) * 0.6, 0, 7); g.fill(); }
    }
    for (const k in G.map.pairs) for (const p of G.map.pairs[k]) drawPortal(g, p.x, p.y, k, time);
    for (const f of G.foods) {
      const age = time - (f.born || 0), pop = Math.min(1, age * 4), sc = (pop < 1 ? 0.3 + 0.7 * easeBack(pop) : 1) * (1 + Math.sin(time * 6 + f.x) * 0.05);
      drawApple(g, (f.x + 0.5) * C, (f.y + 0.5) * C, sc, f.kind === 'gold');
      if (f.kind === 'gold') { g.fillStyle = 'rgba(255,240,170,.9)'; for (let i = 0; i < 3; i++) { const a = time * 3 + i * 2.1; starPath(g, (f.x + 0.5) * C + Math.cos(a) * C * 0.5, (f.y + 0.5) * C + Math.sin(a) * C * 0.5, 3, 1.2, 4); g.fill(); } }
    }
    if (G.pu) {
      const p = G.pu, cx = (p.x + 0.5) * C, cy = (p.y + 0.5) * C + Math.sin(time * 4) * 2;
      if (!(p.t < 2 && Math.sin(time * 22) > 0)) drawPowerIcon(g, p.kind, cx, cy, C * 0.44, time);
      g.strokeStyle = D.POWERS[p.kind].color; g.lineWidth = 2.5; g.beginPath(); g.arc(cx, cy, C * 0.56, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (p.t / p.max)); g.stroke();
    }
    const playing = (state === 'play' || (state === 'menu' && G.mode === 'demo')) && !G.dying && !G.clear;
    const alpha = playing && G.grace <= 0 ? Math.min(1, G.moveT / interval()) : G.dying || G.clear ? 1 : state === 'countdown' ? 0 : 1;
    const pts = points(alpha);
    const skin = D.SKINS.find((s) => s.id === save.skin) || D.SKINS[0];
    const f = G.foods[0];
    const look = f ? (() => { const dx = f.x - pts[0].x, dy = f.y - pts[0].y, m = Math.hypot(dx, dy) || 1; return { x: dx / m, y: dy / m }; })() : null;
    const ghosting = G.effects.ghost > 0;
    const wrapDraw = G.wrap || ghosting;
    g.save(); g.beginPath(); g.rect(0, 0, W, H); g.clip();
    let dy0 = 0;
    if (G.clear) dy0 = -Math.abs(Math.sin(time * 14)) * 4;
    const offs = wrapDraw ? [-1, 0, 1] : [0];
    for (const ox of offs) for (const oy of offs) {
      if (wrapDraw && (ox || oy)) { const near = pts.some((p) => (ox < 0 ? p.x > N - 1.5 : ox > 0 ? p.x < 0.5 : true) && (oy < 0 ? p.y > N - 1.5 : oy > 0 ? p.y < 0.5 : true)); if (!near) continue; }
      drawBody(g, pts, C, skin, { time, dead: G.dying > 0, dir: G.dir, look, ghosting, ox: ox * W, oy: oy * H + dy0 });
    }
    if (G.shield && pts[0]) { const hx = (pts[0].x + 0.5) * C, hy = (pts[0].y + 0.5) * C; g.strokeStyle = `rgba(79,209,165,${0.5 + 0.3 * Math.sin(time * 6)})`; g.lineWidth = 2.5; g.beginPath(); g.arc(hx, hy, C * 0.75, 0, 7); g.stroke(); }
    g.restore();
    fx.draw(g);
    g.textAlign = 'center';
    for (const p of pops) {
      const k = p.t / 0.9;
      g.globalAlpha = 1 - k * k;
      const sc = p.t < 0.15 ? 0.6 + p.t / 0.15 * 0.5 : 1.1 - Math.min(0.1, (p.t - 0.15));
      g.save(); g.translate(p.x, p.y - 16 - p.t * 36); g.scale(sc, sc);
      g.font = `900 17px ${FONT}`; g.lineWidth = 4; g.strokeStyle = 'rgba(0,0,0,.35)'; g.strokeText(p.text, 0, 0);
      g.fillStyle = p.color || '#ffffff'; g.fillText(p.text, 0, 0);
      if (p.sub) { g.font = `800 11px ${FONT}`; g.strokeText(p.sub, 0, 14); g.fillStyle = '#ffe08a'; g.fillText(p.sub, 0, 14); }
      g.restore();
    }
    g.globalAlpha = 1;
    if (G.effects.slow > 0) { const vg = g.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, W * 0.75); vg.addColorStop(0, 'rgba(120,200,255,0)'); vg.addColorStop(1, `rgba(120,200,255,${Math.min(0.35, G.effects.slow * 0.2)})`); g.fillStyle = vg; g.fillRect(0, 0, W, H); }
    if (G.effects.double > 0) { g.strokeStyle = `rgba(255,177,66,${0.4 + 0.3 * Math.sin(time * 8)})`; g.lineWidth = 5; g.strokeRect(2.5, 2.5, W - 5, H - 5); }
    if (state === 'countdown') {
      const n = Math.ceil(countdown), k = countdown - Math.floor(countdown);
      g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, 0, W, H);
      g.save(); g.translate(W / 2, H / 2); const s = 1 + (k > 0.7 ? (k - 0.7) * 2 : 0); g.scale(s, s);
      g.font = `900 90px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineWidth = 10; g.strokeStyle = 'rgba(0,0,0,.35)'; g.strokeText(String(n), 0, 0); g.fillStyle = '#ffffff'; g.fillText(String(n), 0, 0);
      g.font = `800 20px ${FONT}`; g.lineWidth = 5; const sub = G.mode === 'campaign' ? `Level ${G.level.n}: eat ${G.level.goal}` : G.mode === 'daily' ? `Daily: ${G.map.name}` : G.map.name;
      g.strokeText(sub, 0, 70); g.fillText(sub, 0, 70);
      g.restore();
    }
    if (G.dying > 0 && flash > 0) { g.fillStyle = `rgba(255,60,60,${flash * 0.25})`; g.fillRect(0, 0, W, H); }
    g.restore();
  }
  const easeBack = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

  const hudEls = {};
  $$('[data-hud]').forEach((el) => (hudEls[el.dataset.hud] ||= []).push(el));
  const setHud = (k, v) => { for (const el of hudEls[k] || []) if (el.textContent !== String(v)) el.textContent = v; };
  function bump(k) { for (const el of hudEls[k] || []) { el.classList.remove('is-bump'); void el.offsetWidth; el.classList.add('is-bump'); } }
  function bestKey() {
    if (!G) return null;
    if (G.mode === 'classic') return `classic-${save.settings.map}-${save.settings.speed}`;
    if (G.mode === 'campaign') return `lvl-${G.level.n}`;
    if (G.mode === 'daily') return `daily-${G.daily.date}`;
    return G.mode;
  }
  function hud() {
    if (!G || G.mode === 'demo') return;
    setHud('score', Curio.fmt(G.mode === 'zen' ? G.snake.length : G.score));
    setHud('length', G.snake.length);
    const b = Curio.getBest(bestKey()) ?? 0;
    setHud('best', Curio.fmt(Math.max(b, G.mode === 'zen' ? G.snake.length : G.score)));
    $('[data-hud-box="goal"]').hidden = G.mode !== 'campaign';
    $('[data-hud-box="timer"]').hidden = G.mode !== 'time';
    if (G.mode === 'campaign') setHud('goal', `${Math.min(G.eaten, G.level.goal)}/${G.level.goal}`);
    if (G.mode === 'time') { setHud('timer', Math.ceil(G.timeLeft)); $('[data-hud-box="timer"]').classList.toggle('is-low', G.timeLeft <= 10); }
  }
  const chipsWrap = document.createElement('div');
  chipsWrap.className = 'sn-chips__in';
  $('.sn-chips').append(chipsWrap);
  let chipSig = '';
  function renderChips(force) {
    if (!G || G.mode === 'demo') { chipsWrap.textContent = ''; chipSig = ''; return; }
    const act = Object.entries(G.effects).filter(([, v]) => v > 0);
    if (G.shield) act.push(['shield', 0]);
    if (G.combo > 1 && G.comboT > 0) act.push(['combo', G.comboT]);
    const sig = act.map((a) => a[0]).join(',');
    if (sig !== chipSig || force) {
      chipSig = sig; chipsWrap.textContent = '';
      for (const [k] of act) {
        const el = document.createElement('div'); el.className = 'sn-chip'; el.dataset.k = k;
        if (k === 'combo') { el.innerHTML = '<b></b><i></i>'; el.style.setProperty('--c', '#ffb142'); }
        else { const cv = document.createElement('canvas'); cv.width = 36; cv.height = 36; const g = cv.getContext('2d'); drawPowerIcon(g, k, 18, 18, 16); el.append(cv); const b = document.createElement('b'); b.textContent = D.POWERS[k].name; el.append(b); if (k !== 'shield') el.append(document.createElement('i')); el.style.setProperty('--c', D.POWERS[k].color); }
        chipsWrap.append(el);
      }
    }
    for (const el of chipsWrap.children) {
      const k = el.dataset.k;
      if (k === 'combo') { el.querySelector('b').textContent = `x${Math.min(5, G.combo)} combo`; el.style.setProperty('--p', (G.comboT / 2.8 * 100) + '%'); }
      else if (D.POWERS[k]?.dur) el.style.setProperty('--p', (G.effects[k] / D.POWERS[k].dur * 100) + '%');
    }
  }

  function award(id) {
    if (!G || G.mode === 'demo' || save.badges[id]) return;
    const b = D.BADGES.find((x) => x.id === id); if (!b) return;
    save.badges[id] = Date.now();
    G.newBadges.push(b.name);
    Curio.toast(`Badge unlocked: ${b.name}`);
    audio.tone(1047, 0.12, 'triangle', 0.1); audio.tone(1568, 0.18, 'triangle', 0.1, 0, 0.1);
    persist();
  }

  const unlockText = (u) => {
    if (!u) return 'Starter skin';
    if (u.apples) return `Eat ${u.apples} apples`;
    if (u.level) return `Clear level ${u.level}`;
    if (u.length) return `Reach length ${u.length}`;
    if (u.badges) return `Earn ${u.badges} badges`;
    if (u.combo) return `Hit a x${u.combo} combo`;
    if (u.score) return `Score ${u.score} in a game`;
    if (u.daily) return `Play ${u.daily} dailies`;
    if (u.ghosts) return `Grab ${u.ghosts} ghost power-ups`;
    if (u.time) return `Score ${u.time * 2} in Blitz`;
    if (u.games) return `Play ${u.games} games`;
    return '';
  };
  function levelsCleared() { return Object.keys(save.levels).filter((k) => save.levels[k] > 0).length; }
  function maxLevelCleared() { let m = 0; for (const k in save.levels) if (save.levels[k] > 0) m = Math.max(m, +k); return m; }
  function skinUnlocked(sk) {
    const u = sk.unlock, s = save.stats;
    if (!u) return true;
    if (u.apples) return s.apples >= u.apples;
    if (u.level) return maxLevelCleared() >= u.level;
    if (u.length) return s.longest >= u.length;
    if (u.badges) return Object.keys(save.badges).length >= u.badges;
    if (u.combo) return s.maxCombo >= u.combo;
    if (u.score) return s.bestScore >= u.score;
    if (u.daily) return s.days >= u.daily;
    if (u.ghosts) return s.ghosts >= u.ghosts;
    if (u.time) return s.taBest >= u.time * 2;
    if (u.games) return s.games >= u.games;
    return false;
  }

  function gameOver(cleared = false, why = '') {
    if (state === 'over') return;
    const prevSkins = new Set(D.SKINS.filter(skinUnlocked).map((s) => s.id));
    state = 'over'; overAt = performance.now();
    const s = save.stats, len = G.snake.length, mode = G.mode;
    s.games++; if (!cleared) s.deaths++;
    s.longest = Math.max(s.longest, len);
    s.maxCombo = Math.max(s.maxCombo, Math.min(5, G.bestCombo));
    if (mode !== 'zen') s.bestScore = Math.max(s.bestScore, G.score);
    if (len >= 20) award('len20'); if (len >= 40) award('len40'); if (len >= 80) award('len80');
    if (G.score >= 500 && mode !== 'zen') award('score500'); if (G.score >= 1500 && mode !== 'zen') award('score1500');
    if (mode === 'classic' && save.settings.speed === 'insane' && G.score >= 300) award('insane');
    if (mode === 'time') { s.taBest = Math.max(s.taBest, G.score); if (G.score >= 300) award('ta300'); }
    if (mode === 'zen') { s.zenBest = Math.max(s.zenBest, len); if (len >= 60) award('zen60'); }
    let stars = 0;
    if (mode === 'daily') {
      award('daily');
      const d = save.daily[G.daily.date] || { best: 0, plays: 0, first: null };
      if (!d.plays) s.days++;
      d.plays++; d.best = Math.max(d.best, G.score); if (d.first == null) d.first = G.score;
      save.daily[G.daily.date] = d;
      const keys = Object.keys(save.daily).sort(); while (keys.length > 40) delete save.daily[keys.shift()];
    }
    if (mode === 'campaign' && cleared) {
      const t = G.t, par = G.level.par;
      stars = t <= par ? 3 : t <= par * 1.5 ? 2 : 1;
      const prev = save.levels[G.level.n] || 0;
      save.levels[G.level.n] = Math.max(prev, stars);
      if (stars === 3) award('stars3');
      for (let w = 0; w < 5; w++) if ([1, 2, 3, 4, 5, 6].every((i) => save.levels[w * 6 + i] > 0)) award(['w1', 'w2', 'w3', 'w4', 'w5'][w]);
      if (D.LEVELS.every((l) => save.levels[l.n] === 3)) award('allstars');
    }
    const nowSkins = D.SKINS.filter(skinUnlocked);
    if (nowSkins.length >= 5) award('skins5');
    const fresh = D.SKINS.filter(skinUnlocked).filter((sk) => !prevSkins.has(sk.id));
    const score = mode === 'zen' ? len : G.score;
    let isNew = false;
    if (mode !== 'campaign') isNew = Curio.best(bestKey(), score).isNew && score > 0;
    else if (cleared) isNew = Curio.best(bestKey(), Math.round(G.t * 10), false).isNew;
    save.history.unshift({ m: mode, s: score, l: len, d: Date.now(), x: mode === 'campaign' ? G.level.n : mode === 'classic' ? save.settings.map : '' });
    save.history.length = Math.min(save.history.length, 12);
    persist();
    const box = ovs.over, set = (n, v) => { box.querySelector(`[data-o="${n}"]`).textContent = v; };
    const starsEl = box.querySelector('[data-o="stars"]');
    starsEl.hidden = !(mode === 'campaign' && cleared);
    starsEl.innerHTML = [1, 2, 3].map((i) => `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 3l5.2 10.6 11.7 1.7-8.5 8.3 2 11.6L20 29.7 9.6 35.2l2-11.6-8.5-8.3 11.7-1.7z" fill="${i <= stars ? '#ffc233' : '#d8d0c4'}" stroke="${i <= stars ? '#d18a00' : '#b8afa3'}" stroke-width="2" stroke-linejoin="round"/></svg>`).join('');
    starsEl.setAttribute('aria-label', `${stars} of 3 stars`);
    let title, msg;
    if (mode === 'campaign' && cleared) { title = `Level ${G.level.n} cleared!`; msg = `${G.t.toFixed(1)}s, par ${G.level.par}s. ${stars === 3 ? 'Flawless slithering.' : stars === 2 ? 'Beat the par time for 3 stars.' : 'Quicker next time for more stars.'}`; }
    else if (mode === 'time' && why === 'time') { title = "Time's up!"; msg = `You ate ${G.eaten} apples in 75 seconds.`; }
    else if (mode === 'zen') { title = 'Namaste'; msg = `A calm noodle of length ${len}.`; }
    else { title = len > 30 ? 'What a noodle!' : 'Game over'; msg = (G.reason === 'wall' || G.reason === 'edge' ? 'Bonk! ' : 'Chomp! ') + Curio.pick(D.DEATHS); }
    set('title', title);
    set('score', Curio.fmt(mode === 'campaign' && cleared ? G.t : score, mode === 'campaign' && cleared ? 1 : 0) + (mode === 'campaign' && cleared ? 's' : ''));
    set('msg', msg);
    box.querySelector('[data-o="new"]').hidden = !isNew;
    const rs = [[len, 'Length'], [G.eaten, 'Apples'], ['x' + Math.min(5, G.bestCombo), 'Best combo']];
    if (mode === 'campaign' && cleared) rs.unshift([Curio.fmt(G.score), 'Points']); else rs.push([fmtTime(G.t), 'Time']);
    if (mode === 'daily') rs.push([Curio.fmt(save.daily[G.daily.date].best), "Today's best"]);
    box.querySelector('[data-o="stats"]').innerHTML = rs.map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join('');
    const earned = box.querySelector('[data-o="earned"]');
    earned.innerHTML = '';
    G.newBadges.forEach((n, i) => { const sp = document.createElement('span'); sp.textContent = 'Badge: ' + n; sp.style.animationDelay = (0.2 + i * 0.12) + 's'; earned.append(sp); });
    fresh.forEach((sk, i) => { const sp = document.createElement('span'); sp.textContent = 'New skin: ' + sk.name; sp.style.animationDelay = (0.3 + i * 0.12) + 's'; earned.append(sp); });
    const nextBtn = box.querySelector('[data-act="next"]');
    nextBtn.hidden = !(mode === 'campaign' && cleared && G.level.n < D.LEVELS.length);
    box.querySelector('[data-act="restart"]').textContent = mode === 'campaign' && cleared ? 'Replay' : 'Play again';
    if (isNew && mode !== 'campaign') { Curio.confetti(); audio.win(); }
    show('over');
    renderChips();
  }
  const fmtTime = (t) => { t = Math.floor(t); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };

  function shareText() {
    if (!G) return '';
    const len = G.snake.length;
    if (G.mode === 'daily') return `Zoble Snake daily ${G.daily.date} (${G.map.name}): ${G.score} points, length ${len}`;
    if (G.mode === 'campaign') return `Zoble Snake: cleared level ${G.level.n} in ${G.t.toFixed(1)}s (${save.levels[G.level.n] || 0}/3 stars)`;
    if (G.mode === 'time') return `Zoble Snake Blitz: ${G.score} points in 75 seconds`;
    if (G.mode === 'zen') return `Zoble Snake Zen: grew to length ${len}`;
    return `Zoble Snake (${G.map.name}, ${SPEEDS[save.settings.speed].name}): ${G.score} points, length ${len}`;
  }
  async function share() {
    const t = shareText();
    try { await navigator.clipboard.writeText(t); Curio.toast('Copied to clipboard'); }
    catch { Curio.toast(t, 4000); }
  }

  function show(name) {
    for (const k in ovs) ovs[k].hidden = k !== name;
    document.body.classList.toggle('sn-playing', !name || name === 'pause');
    if (name) setTimeout(() => ovs[name].querySelector('.c-btn:not([hidden]), button')?.focus({ preventScroll: true }), 30);
  }

  function start(mode, opts = {}) {
    menuMode = mode === 'campaign' ? 'campaign' : mode;
    if (mode !== 'demo') { save.mode = menuMode; persist(); }
    newGame(mode, opts);
    lastStart = { mode, opts };
    state = 'countdown'; countdown = 2.99;
    show(null);
    $('#ov-pause [data-zen-only]').hidden = mode !== 'zen';
    hud(); renderChips(true);
    audio.tick();
    if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
  }
  let lastStart = null;
  function restart() { if (lastStart) start(lastStart.mode, lastStart.opts); }
  function startDemo() {
    const th = ['meadow', 'desert', 'tundra', 'volcano', 'cosmos'][Math.floor(Math.random() * 5)];
    newGame('demo', { theme: th });
  }
  function toMenu() {
    startDemo();
    state = 'menu';
    show('menu');
    renderMenu();
    renderChips();
    setHud('score', 0); setHud('length', 4);
    $('[data-hud-box="goal"]').hidden = true; $('[data-hud-box="timer"]').hidden = true;
    setHud('best', Curio.fmt(Math.max(0, save.stats.bestScore)));
  }
  function pause() { if (state !== 'play' && state !== 'countdown') return; state = 'paused'; show('pause'); audio.tone(392, 0.06, 'triangle', 0.08); }
  function resume() { if (state !== 'paused') return; state = 'countdown'; countdown = 0.99; show(null); }

  const panel = $('#mode-panel');
  function renderMenu() {
    $$('.sn-modes button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.mode === menuMode)));
    panel.innerHTML = '';
    const P = (html) => { const d = document.createElement('div'); d.innerHTML = html; return d.firstElementChild; };
    if (menuMode === 'classic') {
      panel.append(P('<div class="sn-label">Map</div>'));
      const maps = document.createElement('div'); maps.className = 'sn-maps';
      CLASSIC_MAPS.forEach((id, i) => {
        const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-pressed', String(save.settings.map === id)); b.title = D.MAPS[id].desc;
        const cv = document.createElement('canvas'); cv.width = 120; cv.height = 120;
        const g = cv.getContext('2d'); g.scale(120 / (N * 6), 120 / (N * 6)); paintBoard(g, parseMap(id), ['meadow', 'desert', 'tundra', 'volcano', 'cosmos'][i % 5], 6, false);
        const pm = parseMap(id); for (const k in pm.pairs) for (const p of pm.pairs[k]) { g.fillStyle = PORTAL_COL[k][0]; g.beginPath(); g.arc((p.x + 0.5) * 6, (p.y + 0.5) * 6, 4, 0, 7); g.fill(); }
        b.append(cv, document.createTextNode(D.MAPS[id].name));
        b.addEventListener('click', () => { save.settings.map = id; persist(); audio.click(); renderMenu(); panel.querySelector('[aria-pressed="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); });
        maps.append(b);
      });
      panel.append(maps);
      const sp = P('<div class="sn-seg" role="group" aria-label="Speed"></div>');
      for (const k in SPEEDS) { const b = document.createElement('button'); b.type = 'button'; b.textContent = SPEEDS[k].name; b.setAttribute('aria-pressed', String(save.settings.speed === k)); b.addEventListener('click', () => { save.settings.speed = k; persist(); audio.click(); renderMenu(); }); sp.append(b); }
      panel.append(P('<div class="sn-label">Speed</div>'), sp);
      const ck = P(`<label class="sn-check"><input type="checkbox" ${save.settings.power ? 'checked' : ''}> Power-ups</label>`);
      ck.querySelector('input').addEventListener('change', (e) => { save.settings.power = e.target.checked; persist(); });
      panel.append(ck);
      const best = Curio.getBest(`classic-${save.settings.map}-${save.settings.speed}`) ?? 0;
      panel.append(P(`<p>Best on ${D.MAPS[save.settings.map].name} (${SPEEDS[save.settings.speed].name}): <b>${Curio.fmt(best)}</b></p>`));
      panel.append(playBtn(() => start('classic')));
    } else if (menuMode === 'campaign') {
      const n = levelsCleared(), stars = Object.values(save.levels).reduce((a, b) => a + (b || 0), 0);
      const next = Math.min(D.LEVELS.length, maxLevelCleared() + 1);
      panel.append(P(`<p>Five worlds, 30 levels. Cleared <b>${n}</b>/30 with <b>${stars}</b>/90 stars.</p>`));
      panel.append(P(`<p>Next up: <b>Level ${next}</b> in ${D.WORLDS[D.LEVELS[next - 1].world].name}, ${D.MAPS[D.LEVELS[next - 1].map].name}.</p>`));
      const row = P('<div class="c-row"></div>');
      row.append(playBtn(() => start('campaign', { level: next }), `Play level ${next}`));
      const pick = P('<button class="c-btn c-btn--ghost" type="button">All levels</button>'); pick.addEventListener('click', openLevels); row.append(pick);
      panel.append(row);
    } else if (menuMode === 'daily') {
      const di = dailyInfo(), rec = save.daily[di.date];
      panel.append(P(`<p>Today, <b>${di.date}</b>: everyone gets the same map (<b>${D.MAPS[di.map].name}</b>, ${D.THEMES[di.theme].name}) and the same apple drops.</p>`));
      panel.append(P(`<p>${rec ? `Your best today: <b>${Curio.fmt(rec.best)}</b> (first try ${Curio.fmt(rec.first)}, ${rec.plays} plays)` : 'You have not played today yet.'}</p>`));
      panel.append(playBtn(() => start('daily'), rec ? 'Play again' : 'Play today'));
    } else if (menuMode === 'time') {
      panel.append(P(`<p>75 seconds on the open sand. Three apples at a time, combos matter, and clocks add +6s.</p>`));
      panel.append(P(`<p>Best: <b>${Curio.fmt(Curio.getBest('time') ?? 0)}</b></p>`));
      panel.append(playBtn(() => start('time')));
    } else if (menuMode === 'zen') {
      panel.append(P(`<p>No walls, no game over. Bite your tail and it just snips off. Grow as long as you like, then pause and finish.</p>`));
      panel.append(P(`<p>Longest zen snake: <b>${save.stats.zenBest || 0}</b></p>`));
      panel.append(playBtn(() => start('zen')));
    }
  }
  function playBtn(fn, label = 'Play') {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'c-btn sn-play'; b.textContent = label;
    b.addEventListener('click', fn); return b;
  }
  $$('.sn-modes button').forEach((b) => b.addEventListener('click', () => { menuMode = b.dataset.mode; save.mode = menuMode; persist(); audio.click(); renderMenu(); }));

  function openLevels() {
    const wrap = $('#worlds'); wrap.innerHTML = '';
    const grads = { meadow: 'linear-gradient(135deg,#6fbf4a,#3d8a2c)', desert: 'linear-gradient(135deg,#e7a94f,#b8692a)', tundra: 'linear-gradient(135deg,#6db3e6,#3a6fae)', volcano: 'linear-gradient(135deg,#b8401f,#3b1a14)', cosmos: 'linear-gradient(135deg,#4a3fb8,#141a40)' };
    const unlockedUpTo = maxLevelCleared() + 1;
    D.WORLDS.forEach((w, wi) => {
      const sec = document.createElement('div'); sec.className = 'sn-world'; sec.style.background = grads[w.theme];
      const got = [1, 2, 3, 4, 5, 6].reduce((a, i) => a + (save.levels[wi * 6 + i] || 0), 0);
      sec.innerHTML = `<h3>${wi + 1}. ${w.name}<small>${got}/18 stars</small></h3><p>${w.blurb}</p>`;
      const g = document.createElement('div'); g.className = 'sn-lvls';
      for (let i = 1; i <= 6; i++) {
        const n = wi * 6 + i, st = save.levels[n] || 0, lv = D.LEVELS[n - 1];
        const b = document.createElement('button'); b.type = 'button'; b.className = 'sn-lvl';
        b.disabled = n > unlockedUpTo;
        b.innerHTML = `${n}<small>${[1, 2, 3].map((k) => k <= st ? '★' : '<span class="off">★</span>').join('')}</small>`;
        b.setAttribute('aria-label', `Level ${n}, ${D.MAPS[lv.map].name}, eat ${lv.goal}${b.disabled ? ', locked' : `, ${st} stars`}`);
        b.title = `${D.MAPS[lv.map].name}: eat ${lv.goal}, par ${lv.par}s`;
        b.addEventListener('click', () => start('campaign', { level: n }));
        g.append(b);
      }
      sec.append(g); wrap.append(sec);
    });
    show('levels');
  }

  function previewPts() { const pts = []; for (let i = 0; i <= 18; i++) { const t = i / 18; pts.push({ x: 3.6 - t * 3.3, y: 0.6 + Math.sin(t * Math.PI * 2) * 0.5 }); } return pts; }
  function openSkins() {
    const wrap = $('#skins'); wrap.innerHTML = '';
    for (const sk of D.SKINS) {
      const ok = skinUnlocked(sk);
      const b = document.createElement('button'); b.type = 'button'; b.className = 'sn-skin'; b.disabled = !ok;
      b.setAttribute('aria-pressed', String(save.skin === sk.id));
      const cv = document.createElement('canvas'); cv.width = 232; cv.height = 116;
      const g = cv.getContext('2d'); g.scale(2, 2);
      const pts = previewPts();
      g.translate(2, 2);
      drawBody(g, pts, 22, sk, { time: 1, dir: DIRS.right, look: { x: 1, y: 0 } });
      b.append(cv);
      const nm = document.createElement('b'); nm.textContent = sk.name; b.append(nm);
      const sm = document.createElement('small'); sm.textContent = ok ? (save.skin === sk.id ? 'Wearing' : 'Tap to wear') : unlockText(sk.unlock); b.append(sm);
      b.addEventListener('click', () => { save.skin = sk.id; persist(); audio.power(); vib(10); openSkins(); });
      wrap.append(b);
    }
    show('skins');
  }

  function badgeIcon(g, icon, on) {
    g.clearRect(0, 0, 68, 68);
    const grd = g.createLinearGradient(0, 0, 0, 68);
    grd.addColorStop(0, on ? '#ffe08a' : '#d9d2c8'); grd.addColorStop(1, on ? '#f0a020' : '#a9a197');
    g.fillStyle = grd; g.beginPath();
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + Math.PI / 8; g.lineTo(34 + Math.cos(a) * 32, 34 + Math.sin(a) * 32); }
    g.closePath(); g.fill();
    g.fillStyle = on ? '#fff8e0' : '#ece6dd'; g.beginPath(); g.arc(34, 34, 22, 0, 7); g.fill();
    g.save(); g.translate(34, 34); g.scale(1.6, 1.6);
    const ink = on ? '#7a4a00' : '#8f877c';
    g.fillStyle = ink; g.strokeStyle = ink; g.lineWidth = 2; g.lineCap = 'round'; g.lineJoin = 'round';
    if (icon === 'apple') { g.beginPath(); g.arc(-2.6, 1, 5, 0, 7); g.arc(2.6, 1, 5, 0, 7); g.fill(); g.beginPath(); g.moveTo(0, -3); g.lineTo(1, -8); g.stroke(); }
    else if (icon === 'ruler') { g.beginPath(); g.moveTo(-8, 4); g.quadraticCurveTo(-4, -6, 0, 0); g.quadraticCurveTo(4, 6, 8, -4); g.lineWidth = 3.4; g.stroke(); }
    else if (icon === 'crown') { g.beginPath(); g.moveTo(-8, 5); g.lineTo(-8, -4); g.lineTo(-4, 0); g.lineTo(0, -6); g.lineTo(4, 0); g.lineTo(8, -4); g.lineTo(8, 5); g.closePath(); g.fill(); }
    else if (icon === 'star') { starPath(g, 0, 0, 8, 3.6, 5); g.fill(); }
    else if (icon === 'bolt') { g.beginPath(); g.moveTo(2, -9); g.lineTo(-5, 1); g.lineTo(0, 1); g.lineTo(-2, 9); g.lineTo(5, -1); g.lineTo(0, -1); g.closePath(); g.fill(); }
    else if (icon === 'ghost') { g.beginPath(); g.arc(0, -1.5, 6, Math.PI, 0); g.lineTo(6, 7); g.lineTo(3, 5); g.lineTo(0, 7); g.lineTo(-3, 5); g.lineTo(-6, 7); g.closePath(); g.fill(); }
    else if (icon === 'portal') { g.beginPath(); g.arc(0, 0, 7, 0, 5); g.stroke(); g.beginPath(); g.arc(0, 0, 3.4, 1, 6); g.stroke(); }
    else if (icon === 'shield') { g.beginPath(); g.moveTo(0, -8); g.lineTo(7, -5); g.quadraticCurveTo(7, 5, 0, 8.5); g.quadraticCurveTo(-7, 5, -7, -5); g.closePath(); g.fill(); }
    else if (icon === 'flag') { g.fillRect(-6, -8, 2, 16); g.beginPath(); g.moveTo(-4, -8); g.lineTo(7, -4); g.lineTo(-4, 0); g.fill(); }
    else if (icon === 'calendar') { g.strokeRect(-7, -6, 14, 13); g.fillRect(-7, -6, 14, 4); }
    else if (icon === 'clock') { g.beginPath(); g.arc(0, 0, 7.5, 0, 7); g.stroke(); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -5); g.moveTo(0, 0); g.lineTo(3.5, 2); g.stroke(); }
    else if (icon === 'leaf') { g.beginPath(); g.moveTo(-7, 7); g.quadraticCurveTo(-7, -7, 8, -8); g.quadraticCurveTo(7, 7, -7, 7); g.fill(); }
    else if (icon === 'palette') { g.beginPath(); g.arc(0, 0, 8, 0, 7); g.fill(); g.fillStyle = on ? '#fff8e0' : '#ece6dd'; for (const [x, y] of [[-3, -3], [3, -3], [4, 2]]) { g.beginPath(); g.arc(x, y, 1.6, 0, 7); g.fill(); } }
    g.restore();
  }
  function openBadges() {
    const s = save.stats;
    const cells = [[s.games, 'Games'], [Curio.fmt(s.apples), 'Apples'], [s.longest, 'Longest'], [Curio.fmt(s.bestScore), 'Top score'], ['x' + s.maxCombo, 'Best combo'], [levelsCleared() + '/30', 'Levels'], [s.portals, 'Portal hops'], [fmtTime(s.time), 'Time played']];
    $('#stats').innerHTML = cells.map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join('');
    const bw = $('#badges'); bw.innerHTML = '';
    for (const b of D.BADGES) {
      const on = !!save.badges[b.id];
      const el = document.createElement('div'); el.className = 'sn-badge' + (on ? ' is-on' : '');
      const cv = document.createElement('canvas'); cv.width = 68; cv.height = 68; badgeIcon(cv.getContext('2d'), b.icon, on);
      const t = document.createElement('div'); t.innerHTML = `<b></b><small></small>`; t.querySelector('b').textContent = b.name; t.querySelector('small').textContent = b.desc;
      el.append(cv, t); bw.append(el);
    }
    const names = { classic: 'Classic', campaign: 'Campaign', daily: 'Daily', time: 'Blitz', zen: 'Zen' };
    const hl = $('#history');
    hl.innerHTML = save.history.length ? '' : '<li>No games yet. Go eat something!</li>';
    for (const h of save.history) {
      const li = document.createElement('li');
      const extra = h.m === 'campaign' ? ` L${h.x}` : h.m === 'classic' && D.MAPS[h.x] ? `, ${D.MAPS[h.x].name}` : '';
      li.innerHTML = `<b></b><span></span>`;
      li.querySelector('b').textContent = `${names[h.m] || h.m}${extra}: ${Curio.fmt(h.s)}`;
      li.querySelector('span').textContent = `length ${h.l} · ${new Date(h.d).toLocaleDateString()}`;
      hl.append(li);
    }
    show('badges');
  }
  function openHelp() {
    const w = $('#powers'); w.innerHTML = '';
    for (const k in D.POWERS) {
      const P = D.POWERS[k];
      const el = document.createElement('div');
      const cv = document.createElement('canvas'); cv.width = 72; cv.height = 72; drawPowerIcon(cv.getContext('2d'), k, 36, 36, 30);
      const t = document.createElement('div'); t.innerHTML = '<b></b><small></small>'; t.querySelector('b').textContent = P.name; t.querySelector('small').textContent = P.desc;
      el.append(cv, t); w.append(el);
    }
    show('help');
  }

  $$('[data-act]').forEach((b) => b.addEventListener('click', () => {
    const a = b.dataset.act;
    if (a === 'pause') { if (state === 'play' || state === 'countdown') pause(); else if (state === 'paused') resume(); }
    else if (a === 'resume') resume();
    else if (a === 'restart') { if (performance.now() - overAt > 400) restart(); }
    else if (a === 'menu') toMenu();
    else if (a === 'skins') openSkins();
    else if (a === 'badges') openBadges();
    else if (a === 'help') openHelp();
    else if (a === 'share') share();
    else if (a === 'finish') { show(null); gameOver(); }
    else if (a === 'next' && G?.level) start('campaign', { level: G.level.n + 1 });
  }));

  addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest?.('input, select, textarea')) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key.toLowerCase();
    if (k === 'p' || k === 'escape') {
      if (state === 'play' || state === 'countdown') { pause(); e.preventDefault(); return; }
      if (state === 'paused') { resume(); e.preventDefault(); return; }
      if (k === 'escape' && ['levels', 'skins', 'badges', 'help'].some((n) => !ovs[n].hidden)) { toMenu(); return; }
    }
    if (KEYMAP[k] && (state === 'play' || state === 'countdown')) {
      e.preventDefault();
      if (state === 'countdown' && G) { const d = DIRS[KEYMAP[k]]; if (!(d.x === -G.dir.x && d.y === -G.dir.y)) { G.queue.length = 0; G.queue.push(d); } return; }
      enqueue(KEYMAP[k]); return;
    }
    const onBtn = e.target.closest?.('button, a');
    if ((k === ' ' || k === 'enter') && !onBtn) {
      if (state === 'paused') { resume(); e.preventDefault(); }
      else if (state === 'over' && performance.now() - overAt > 400) { restart(); e.preventDefault(); }
      else if (state === 'menu' && !ovs.menu.hidden) { panel.querySelector('.sn-play')?.click(); e.preventDefault(); }
    }
    if (k === 'r' && (state === 'over' || state === 'paused')) restart();
    if (k === 'n' && state === 'over' && !ovs.over.querySelector('[data-act="next"]').hidden) ovs.over.querySelector('[data-act="next"]').click();
    if (PREVENT.has(e.key) && state !== 'menu') e.preventDefault();
  });
  const PREVENT = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ']);

  let sw = null;
  const steer = (d) => {
    if (state === 'countdown' && G) { const dd = DIRS[d]; if (!(dd.x === -G.dir.x && dd.y === -G.dir.y)) { G.queue.length = 0; G.queue.push(dd); } }
    else enqueue(d);
  };
  stage.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch' && !e.target.closest('.sn-ov')) document.body.classList.add('sn-touch'); });
  Curio.drag(canvas, {
    start(p) { if (state !== 'play' && state !== 'countdown') { sw = null; return; } p.event?.preventDefault?.(); sw = { x: p.clientX, y: p.clientY }; },
    move(p) {
      if (!sw) return;
      const dx = p.clientX - sw.x, dy = p.clientY - sw.y;
      if (Math.hypot(dx, dy) >= 22) { sw.x = p.clientX; sw.y = p.clientY; steer(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')); }
    },
    end() { sw = null; }
  });
  stage.addEventListener('contextmenu', (e) => e.preventDefault());
  $$('.sn-pad [data-dir]').forEach((b) => {
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault(); document.body.classList.add('sn-touch'); b.classList.add('is-down');
      const d = b.dataset.dir;
      if (state === 'countdown' && G) { const dd = DIRS[d]; if (!(dd.x === -G.dir.x && dd.y === -G.dir.y)) { G.queue.length = 0; G.queue.push(dd); } }
      else enqueue(d);
      vib(5);
    });
    const up = () => b.classList.remove('is-down');
    b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up);
    b.addEventListener('contextmenu', (e) => e.preventDefault());
  });

  let raf = 0, last = 0;
  function frame(t) {
    raf = requestAnimationFrame(frame);
    let dt = last ? (t - last) / 1000 : 0; last = t;
    if (dt > 0.1) dt = 0.1;
    if (state === 'paused' || state === 'over') { time += dt; fx.update(dt); for (const p of pops) p.t += dt; }
    else update(dt);
    draw();
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { pause(); cancelAnimationFrame(raf); raf = 0; persist(); }
    else if (!raf) { last = 0; raf = requestAnimationFrame(frame); }
  });
  addEventListener('blur', () => pause());
  addEventListener('pagehide', persist);
  addEventListener('curio:theme', () => requestAnimationFrame(() => { dark = Curio.isDark(); cacheKey = ''; if (state === 'menu') renderMenu(); }));
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { dark = Curio.isDark(); cacheKey = ''; });
  new ResizeObserver(fit).observe(stage);

  window.__snake = {
    get state() { return state; }, get G() { return G; }, save, start, toMenu, step: () => step(),
    feedAhead() { const h = G.snake[0], d = G.queue.length ? G.queue[G.queue.length - 1] : G.dir; const x = (h.x + d.x * 2 + N) % N, y = (h.y + d.y * 2 + N) % N; G.foods[0] = { x, y, kind: 'apple', born: time }; },
    givePower(kind) { G.pu = { ...G.snake[0], kind, t: 8, max: 8 }; const h = G.snake[0], d = G.dir; G.pu.x = (h.x + d.x + N) % N; G.pu.y = (h.y + d.y + N) % N; },
    set auto(v) { autoPilot = !!v; },
    crash() { die('self'); }, skipCountdown() { if (state === 'countdown') countdown = 0.001; }
  };

  fit();
  toMenu();
  raf = requestAnimationFrame(frame);
  if (!Curio.store.get('tip:touchpad:snake', false) && !matchMedia('(pointer: coarse)').matches) {
    Curio.store.set('tip:touchpad:snake', true);
    setTimeout(() => Curio.toast('Tip: steer with the arrow keys, or turn on Touchpad mode in the top bar and click once, then glide to swipe', 4200), 1200);
  }
})();
