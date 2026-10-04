'use strict';
(() => {
  const DATA = window.DR_DATA, BIOMES = DATA.biomes, CHARS = DATA.chars, POW = DATA.powers;
  const H = 280, P = 3, GROUND = H - 56, DX = 54, BIOME_LEN = 600;
  const DINO_BODY = [
    '.........#######', '........##.#####', '........########', '........########', '........#####...', '........#######.',
    '#......#####....', '#.....#######...', '##...#########..', '###.##########..', '############.#..', '.##########.....', '..########......', '...######.......'
  ];
  const DINO_LEGS = [
    ['...##..##.......', '...#....#.......', '...##...##......'],
    ['...##..##.......', '...#....##......', '...##...........'],
    ['...##..##.......', '...##...#.......', '........##......']
  ];
  const DUCK_BODY = ['.................######.', '#.......######..##.#####', '##....##################', '###################.....', '.#################......', '..##############........', '...##########...........'];
  const DUCK_LEGS = [['....##..##..............', '....#....##.............'], ['....##..##..............', '....##....#.............']];
  const CACTI = {
    small: ['..##..', '..##..', '#.##..', '#.##.#', '#.##.#', '####.#', '..####', '..##..', '..##..', '..##..', '..##..', '..##..'],
    tall: ['...##...', '..####..', '..####..', '#.####..', '#.####.#', '#.####.#', '#.####.#', '######.#', '..######', '..####..', '..####..', '..####..', '..####..', '..####..', '..####..', '..####..']
  };
  const PTERO = [
    ['......#........', '......##.......', '......###......', '..##..####.....', '.###..#####....', '###############', '....##########.', '.....#######...'],
    ['..##...........', '.###...........', '###############', '....##########.', '.....#######...', '......####.....', '......###......', '......##.......', '......#........']
  ];
  function boxes(rows) {
    const out = [];
    for (let i = 0; i < rows.length; i += 3) {
      let min = 99, max = -1;
      for (let j = i; j < Math.min(rows.length, i + 3); j++) { const r = rows[j], a = r.indexOf('#'), b = r.lastIndexOf('#'); if (a >= 0) { min = Math.min(min, a); max = Math.max(max, b); } }
      if (max >= 0) out.push({ x: min * P + 2, y: i * P + 2, w: (max - min + 1) * P - 4, h: Math.min(3, rows.length - i) * P - 4 });
    }
    return out;
  }
  const STAND = DINO_BODY.concat(DINO_LEGS[0]), DUCK = DUCK_BODY.concat(DUCK_LEGS[0]);
  const STAND_BOX = boxes(STAND), DUCK_BOX = boxes(DUCK);
  const runsCache = new Map();
  function toneRuns(rows) {
    const key = rows.join('|');
    let r = runsCache.get(key);
    if (r) return r;
    r = { base: [], hi: [], lo: [] };
    for (let y = 0; y < rows.length; y++) {
      let cur = null, start = 0;
      for (let x = 0; x <= rows[y].length; x++) {
        const on = rows[y][x] === '#';
        const tone = !on ? null : rows[y - 1]?.[x] !== '#' ? 'hi' : rows[y + 1]?.[x] !== '#' ? 'lo' : 'base';
        if (tone !== cur) { if (cur) r[cur].push([start, y, x - start]); cur = tone; start = x; }
      }
    }
    runsCache.set(key, r);
    return r;
  }
  function sprite(g, rows, x, y, col) {
    const r = toneRuns(rows);
    for (const [tone, c] of [['base', col], ['hi', shade(col, 0.3)], ['lo', shade(col, -0.28)]]) {
      g.fillStyle = c;
      for (const [sx, sy, w] of r[tone]) g.fillRect(Math.round(x + sx * P), Math.round(y + sy * P), w * P, P);
    }
  }
  const ACH = [
    { id: 'm100', icon: '👣', name: 'Baby steps', desc: 'Run 100 m.' },
    { id: 'm500', icon: '🏃', name: 'Cardio', desc: 'Run 500 m in one go.' },
    { id: 'm1000', icon: '🦖', name: 'Marathon dino', desc: 'Run 1,000 m.' },
    { id: 'm2500', icon: '🚀', name: 'Unstoppable', desc: 'Run 2,500 m.' },
    { id: 'm5000', icon: '☄️', name: 'Extinction? Never.', desc: 'Run 5,000 m.' },
    { id: 'jungle', icon: '🌴', name: 'Into the green', desc: 'Reach the Steamy Jungle.' },
    { id: 'tundra', icon: '❄️', name: 'Brrr', desc: 'Reach the Frozen Tundra.' },
    { id: 'volcano', icon: '🌋', name: 'Hot feet', desc: 'Reach the Lava Lands.' },
    { id: 'night', icon: '🌙', name: 'Night owl', desc: 'Reach the Moonlit Plains.' },
    { id: 'loop', icon: '🌍', name: 'World tour', desc: 'Run through all five biomes and back to the desert.' },
    { id: 'amber100', icon: '🟠', name: 'Amber rush', desc: 'Collect 100 amber in one run.' },
    { id: 'buy', icon: '🥚', name: 'New friend', desc: 'Unlock a new character.' },
    { id: 'all', icon: '👑', name: 'Full herd', desc: 'Unlock every character.' },
    { id: 'rocket', icon: '💥', name: 'Demolition dino', desc: 'Smash 5 obstacles during one rocket.' },
    { id: 'close', icon: '😅', name: 'Close shave', desc: 'Pull off 10 near misses in one run.' },
    { id: 'shield', icon: '🫧', name: 'Saved by the bubble', desc: 'Let a shield take a hit for you.' },
    { id: 'daily', icon: '📅', name: 'Daily dino', desc: 'Run a Daily course.' },
    { id: 'hardcore', icon: '🔥', name: 'Hardcore hatchling', desc: 'Run 1,000 m in Hardcore.' },
    { id: 'duck', icon: '🦆', name: 'Limbo legend', desc: 'Duck under 25 vines or bats (all time).' }
  ];
  let W = 640, dino, obs, ambers, pups, speed, dist, nextGap, clouds, bumps, stars, flakes, pendingTap, god, flash, mode, R;
  let biomeI, prevBiome, blendT, runAmber, near, rocketSmash, powerT, nextPower, bank, blinkT, dying, lastBiomeShown, tx;
  const A = Arcade({
    width: 640, height: H, reset, update, draw, key, pointer, swipe, idle, swipeDist: 20, achievements: ACH, tip: 'Tip for touchpads: one click or Space jumps, Down arrow ducks. No dragging needed.',
    size: (w, h) => { W = Math.round(Math.max(400, Math.min(940, H * w / h))); return { w: W, h: H }; },
    defaults: { mode: 'endless', char: 'rex' },
    statsList: [['runs', 'Runs'], ['dist', 'Metres run'], ['amber', 'Amber found'], ['jumps', 'Jumps'], ['best', 'Longest run'], ['cleared', 'Obstacles passed'], ['powers', 'Power-ups'], ['ducks', 'Limbo ducks']],
    modeName: () => ({ endless: 'Endless', daily: 'Daily', hardcore: 'Hardcore' }[A.opts.mode] || 'Run'),
    histText: () => `${Curio.fmt(Math.floor(dist))} m`,
    optsChanged, lockedOpt, menu: () => { paintChars(); }
  });
  bank = A.load('bank', 0);
  const owned = () => A.load('owned', { rex: true });
  function optsChanged(o) {
    const d = document.querySelector('[data-desc="mode"]');
    if (d) d.textContent = { endless: 'Run forever through five biomes. Grab power-ups and amber.', daily: 'Today\'s seeded course. Same obstacles for everyone.', hardcore: 'Starts fast. No power-ups. Pure reflexes.' }[o.mode] || '';
    paintChars();
  }
  function paintChars() {
    const own = owned();
    if (!own[A.opts.char]) A.opts.char = 'rex';
    document.querySelectorAll('[data-opt="char"]').forEach((b) => {
      const id = b.dataset.val, c = CHARS[id];
      b.classList.toggle('is-locked', !own[id]);
      b.setAttribute('aria-pressed', String(A.opts.char === id));
      b.querySelector('em').textContent = own[id] ? c.name : `🟠 ${c.cost}`;
      b.title = `${c.name}: ${c.perk}`;
      const cv = b.querySelector('canvas');
      if (cv && !cv.dataset.done) {
        cv.dataset.done = '1';
        const g = cv.getContext('2d');
        g.scale(cv.width / 60, cv.height / 60);
        drawDino(g, 4, 6, id, 1, false, false, 0.8);
      }
    });
    document.querySelectorAll('[data-bank]').forEach((el) => { el.textContent = Curio.fmt(bank); });
    const pk = document.querySelector('[data-perk]');
    if (pk) pk.textContent = `${CHARS[A.opts.char].name}: ${CHARS[A.opts.char].perk}`;
  }
  async function lockedOpt(k, id) {
    if (k !== 'char') return;
    const c = CHARS[id];
    if (bank < c.cost) { Curio.toast(`${c.name} costs ${c.cost} amber. You have ${bank}.`); Curio.beep(200, 0.08, 'square', 0.05); return; }
    const v = await Curio.modal({ emoji: '🥚', title: `Hatch ${c.name}?`, body: `${c.perk} Costs ${c.cost} amber (you have ${bank}).`, buttons: [{ label: `Hatch for ${c.cost}`, value: 'y' }, { label: 'Not now', value: 'n' }] });
    if (v !== 'y') return;
    bank -= c.cost;
    A.save('bank', bank);
    const own = owned();
    own[id] = true;
    A.save('owned', own);
    A.unlock('buy');
    if (Object.keys(CHARS).every((x) => own[x])) A.unlock('all');
    Curio.confetti(90);
    A.chord([523, 659, 784, 1047], 0.08, 'triangle', 0.1);
    A.setOpt('char', id);
  }

  const rnd = () => R();
  function reset() {
    mode = A.opts.mode;
    A.bestKey = `score-${mode}`;
    R = mode === 'daily' ? A.rng(A.seedOf('dr-' + A.today())) : A.rng((Math.random() * 1e9) | 0);
    const ch = owned()[A.opts.char] ? A.opts.char : 'rex';
    dino = { x: DX, y: 0, vy: 0, duck: false, run: 0, jumpHeld: false, fastFall: false, touchDuck: false, dead: false, air: 0, char: ch, shield: ch === 'ember', inv: 0 };
    obs = []; ambers = []; pups = [];
    speed = mode === 'hardcore' ? 470 : 330;
    dist = 0; nextGap = 420; blinkT = 0; dying = 0; pendingTap = null; flash = 0;
    biomeI = 0; prevBiome = 0; blendT = 1; lastBiomeShown = 0;
    runAmber = 0; near = 0; rocketSmash = 0; tx = 0;
    powerT = { magnet: 0, wings: 0, slow: 0, rocket: 0, double: 0 };
    nextPower = 220 + rnd() * 200;
    A.timeScale = 1;
    initScenery();
    hud();
  }
  function initScenery() {
    clouds = Array.from({ length: 5 }, (_, i) => ({ x: 120 + i * 200 + Math.random() * 80, y: 26 + Math.random() * 70, s: 0.7 + Math.random() * 0.6 }));
    bumps = Array.from({ length: 50 }, () => ({ x: Math.random() * 1200, w: 2 + Math.random() * 5, y: 6 + Math.random() * 40 }));
    stars = Array.from({ length: 50 }, () => ({ x: Math.random() * 940, y: 6 + Math.random() * 150, r: Math.random() < 0.3 ? 2 : 1, t: Math.random() * 6 }));
    flakes = Array.from({ length: 50 }, () => ({ x: Math.random() * 940, y: Math.random() * H, s: 0.5 + Math.random(), r: 1 + Math.random() * 2 }));
  }
  function hud() {
    A.hud('amber', runAmber);
    A.hud('biome', BIOMES[biomeI].id[0].toUpperCase() + BIOMES[biomeI].id.slice(1));
  }
  const onGround = () => dino.y >= 0 && !dino.falling;
  function startFall() {
    if (dino.shield) {
      dino.shield = false;
      dino.inv = 1;
      dino.y = -0.01;
      dino.vy = -900;
      A.unlock('shield');
      A.fx.ring(dino.x + 24, GROUND - 10, 50, '#5ad1ff', 0.5, 5);
      A.sweep(1200, 300, 0.3, 'triangle', 0.08);
      return;
    }
    dino.falling = true;
    dino.vy = Math.max(0, dino.vy);
    A.sweep(600, 80, 0.5, 'triangle', 0.08);
  }
  const hasDouble = () => dino.char === 'frost' || powerT.wings > 0;
  function jump(full) {
    if (dino.dead) return;
    if (!onGround()) {
      if (hasDouble() && !dino.air) {
        dino.air = 1;
        dino.vy = -720;
        dino.jumpHeld = full ? 'touch' : true;
        A.sweep(600, 1100, 0.1, 'triangle', 0.05);
        A.fx.burst(dino.x + 22, GROUND + dino.y, 10, ['#ffffff', '#dff3ff'], { speed: 120, life: 0.4, size: 3, gravity: 100, angle: Math.PI / 2, spread: 2, shape: 'dot' });
      }
      return;
    }
    dino.vy = dino.char === 'ruby' ? -860 : -800;
    dino.y = -0.01;
    dino.air = 0;
    dino.jumpHeld = !full ? true : 'touch';
    dino.fastFall = false;
    A.stat('jumps');
    A.sweep(420, 760, 0.1, 'square', 0.045);
    A.fx.burst(dino.x + 20, GROUND, 6, [BIOMES[biomeI].top], { speed: 80, life: 0.35, size: 3, gravity: 150, angle: Math.PI, spread: 1.2 });
  }
  function key(k, down) {
    if (k === ' ' || k === 'ArrowUp' || k === 'w') { if (down) jump(false); else if (dino.jumpHeld === true) dino.jumpHeld = false; }
    if ((k === 'ArrowDown' || k === 's') && down && !onGround()) dino.fastFall = true;
  }
  function pointer(type) {
    if (type === 'down') pendingTap = { t: 0 };
    if (type === 'up') { if (pendingTap) jump(true); pendingTap = null; dino.touchDuck = false; }
  }
  function swipe(dir) {
    if (dir === 'down') { pendingTap = null; dino.touchDuck = true; if (!onGround()) dino.fastFall = true; }
    if (dir === 'up' && pendingTap) { pendingTap = null; jump(true); }
  }
  function makeObs(kind, x) {
    const o = { kind, x, vx: 0, passed: false, minGap: 99 };
    if (kind === 'cactusS' || kind === 'cactusT' || kind === 'iceS') {
      const rows = kind === 'cactusT' ? CACTI.tall : CACTI.small;
      Object.assign(o, { rows, w: rows[0].length * P, h: rows.length * P, y: GROUND - rows.length * P, box: boxes(rows) });
    } else if (kind === 'tumble') Object.assign(o, { w: 26, h: 26, y: GROUND - 26, vx: 70, rot: 0, box: [{ x: 4, y: 4, w: 18, h: 18 }] });
    else if (kind === 'log') Object.assign(o, { w: 50, h: 20, y: GROUND - 20, box: [{ x: 3, y: 3, w: 44, h: 17 }] });
    else if (kind === 'vine') Object.assign(o, { w: 18, h: GROUND - 34, y: 0, box: [{ x: 3, y: 0, w: 12, h: GROUND - 36 }], duckable: true });
    else if (kind === 'bush') Object.assign(o, { w: 32, h: 22, y: GROUND - 22, box: [{ x: 4, y: 5, w: 24, h: 17 }] });
    else if (kind === 'spike') Object.assign(o, { w: 22, h: 40, y: GROUND - 40, box: [{ x: 8, y: 6, w: 6, h: 14 }, { x: 4, y: 20, w: 14, h: 20 }] });
    else if (kind === 'snowball') Object.assign(o, { w: 28, h: 28, y: GROUND - 28, vx: 130, rot: 0, box: [{ x: 4, y: 4, w: 20, h: 22 }] });
    else if (kind === 'pit') { const w = 46 + rnd() * 30; Object.assign(o, { w, h: 10, y: GROUND, box: [], pit: true }); }
    else if (kind === 'boulder') Object.assign(o, { w: 30, h: 24, y: GROUND - 24, box: [{ x: 3, y: 4, w: 24, h: 20 }] });
    else if (kind === 'meteor') Object.assign(o, { w: 26, h: 24, y: -60, fall: true, vy: 0, tx: x, box: [{ x: 4, y: 4, w: 18, h: 18 }] });
    else if (kind === 'bat') { const low = rnd() < 0.5; Object.assign(o, { w: 30, h: 18, y: low ? GROUND - 24 : GROUND - 52, vx: 30, flap: 0, box: [{ x: 4, y: 4, w: 22, h: 10 }], duckable: !low }); }
    else if (kind === 'ptero') { const lvl = [0, 1, 1, 2][(rnd() * 4) | 0]; const bottom = [GROUND - 6, GROUND - 32, GROUND - 66][lvl]; Object.assign(o, { w: 15 * P, h: 27, y: bottom - PTERO[1].length * P, box: boxes(PTERO[1]), flap: 0, vx: 40, duckable: lvl === 1 }); }
    return o;
  }
  function spawn() {
    const B = BIOMES[biomeI];
    let kind = B.kinds[(rnd() * B.kinds.length) | 0];
    if (dist > 250 && rnd() < (biomeI === 4 ? 0.3 : 0.18)) kind = 'ptero';
    const x0 = W + 30;
    if (kind === 'cactusS' || kind === 'cactusT' || kind === 'iceS') {
      const n = speed > 520 ? 1 + ((rnd() * 3) | 0) : speed > 400 ? 1 + ((rnd() * 2) | 0) : 1;
      for (let i = 0; i < n; i++) { const o = makeObs(kind, x0 + i * 22); if (kind === 'iceS') o.ice = true; obs.push(o); }
    } else if (kind === 'meteor') {
      const o = makeObs('meteor', x0 + 120);
      o.x = x0 + 260; o.tx = x0 + 120;
      obs.push(o);
    } else obs.push(makeObs(kind, x0));
    const last = obs[obs.length - 1];
    if (rnd() < 0.45 && !last.duckable && last.kind !== 'meteor') {
      for (let i = 0; i < 7; i++) ambers.push({ x: x0 - 50 + i * 22, y: GROUND - 34 - Math.sin(i / 6 * Math.PI) * 70, t: rnd() * 6 });
    } else if (rnd() < 0.35) {
      const gx = x0 + 160 + rnd() * 80;
      for (let i = 0; i < 5; i++) ambers.push({ x: gx + i * 22, y: GROUND - 20, t: rnd() * 6 });
    }
    nextGap = speed * (0.62 + rnd() * 0.75) + 170 + (kind === 'pit' ? 60 : 0);
  }
  function spawnPower() {
    const keys = Object.keys(POW);
    const k = keys[(rnd() * keys.length) | 0];
    pups.push({ kind: k, x: W + 40, y: GROUND - 70 - rnd() * 30, t: 0 });
    nextPower = dist + 260 + rnd() * 340;
  }
  function getPower(k) {
    A.stat('powers');
    const P2 = POW[k];
    const mul = dino.char === 'shadow' ? 1.5 : 1;
    if (k === 'shield') dino.shield = true;
    else powerT[k] = P2.t * mul;
    if (k === 'rocket') { rocketSmash = 0; A.sweep(200, 900, 0.5, 'sawtooth', 0.07); A.shake(0.3); }
    A.chord([660, 880, 1175], 0.05, 'triangle', 0.08);
    A.pop(P2.name.toUpperCase(), dino.x + 30, GROUND - 90 + dino.y, { color: P2.color, size: 18 });
    A.fx.ring(dino.x + 24, GROUND - 24 + dino.y, 40, P2.color);
    A.buzz(20);
  }
  function hits(ax, ay, abox, bx, by, bbox) {
    for (const a of abox) for (const b of bbox) if (ax + a.x < bx + b.x + b.w && ax + a.x + a.w > bx + b.x && ay + a.y < by + b.y + b.h && ay + a.y + a.h > by + b.y) return true;
    return false;
  }
  function smash(o) {
    o.dead = true;
    A.fx.burst(o.x + o.w / 2, o.y + o.h / 2, 16, [BIOMES[biomeI].obs, BIOMES[biomeI].obs2, '#ffffff'], { speed: 260, life: 0.6, size: 4, gravity: 600 });
    A.noise(0.25, 0.14, 1600);
    A.shake(0.25);
  }
  function die() {
    dino.dead = true;
    dying = 0.9;
    flash = 0.14;
    A.timeScale = 1;
    A.noise(0.3, 0.2, 1500);
    A.sweep(300, 60, 0.5, 'square', 0.08);
    A.shake(0.7);
    A.buzz([60, 40, 120]);
    A.fx.burst(dino.x + 30, GROUND - 30 + dino.y, 18, [CHARS[dino.char].color, '#fff', BIOMES[biomeI].obs], { speed: 220, life: 0.7, size: 4, gravity: 500 });
  }
  function finish() {
    const s = Math.floor(dist);
    A.stat('dist', s);
    A.stat('amber', runAmber);
    A.statMax('best', s);
    bank += runAmber;
    A.save('bank', bank);
    if (mode === 'daily') A.unlock('daily');
    if (mode === 'hardcore' && s >= 1000) A.unlock('hardcore');
    const next = Object.entries(CHARS).find(([id, c]) => !owned()[id] && c.cost > 0);
    const tip = next ? (bank >= next[1].cost ? ` You can afford ${next[1].name} now!` : ` ${next[1].cost - bank} more amber to hatch ${next[1].name}.`) : '';
    A.over({
      title: s >= 2500 ? 'Prehistoric legend!' : s >= 1000 ? 'Marathon dino!' : s >= 300 ? 'Good run!' : 'Extinct!',
      msg: DATA.quips[(Math.random() * DATA.quips.length) | 0] + tip,
      rows: [['Metres', Curio.fmt(s)], ['Amber', runAmber], ['Biome', BIOMES[biomeI].id[0].toUpperCase() + BIOMES[biomeI].id.slice(1)], ['Near misses', near]],
      share: `Curio Dino Run · ${{ endless: 'Endless', daily: 'Daily ' + A.today(), hardcore: 'Hardcore' }[mode]} · ${Curio.fmt(s)} m as ${CHARS[dino.char].name} · reached the ${BIOMES[biomeI].name} · ${runAmber} amber`
    });
    paintChars();
  }
  function update(dt) {
    A.fx.update(dt);
    flash = Math.max(0, flash - dt);
    blendT = Math.min(1, blendT + dt / 2.5);
    for (const k in powerT) powerT[k] = Math.max(0, powerT[k] - dt);
    A.timeScale = powerT.slow > 0 ? 0.62 : 1;
    dino.inv = Math.max(0, dino.inv - dt);
    if (dying) { dying -= dt; if (dying <= 0) finish(); return; }
    if (pendingTap) { pendingTap.t += dt; if (pendingTap.t > 0.06) { pendingTap = null; jump(true); } }
    speed = Math.min(mode === 'hardcore' ? 900 : 820, speed + 7 * dt);
    const sp = speed * (powerT.rocket > 0 ? 1.7 : 1);
    const before = dist;
    dist += sp * dt / 40;
    tx += sp * dt;
    if (Math.floor(dist) !== A.score) A.setScore(Math.floor(dist));
    if (Math.floor(dist / 100) > Math.floor(before / 100)) {
      blinkT = 0.9;
      A.chord([784, 1047], 0.09, 'square', 0.05);
      const m = Math.floor(dist / 100) * 100;
      for (const [n, id] of [[100, 'm100'], [500, 'm500'], [1000, 'm1000'], [2500, 'm2500'], [5000, 'm5000']]) if (m >= n) A.unlock(id);
    }
    blinkT = Math.max(0, blinkT - dt);
    const bi = Math.floor(dist / BIOME_LEN) % BIOMES.length;
    if (bi !== biomeI) {
      prevBiome = biomeI;
      biomeI = bi;
      blendT = 0;
      lastBiomeShown = 2.6;
      A.chord([523, 659, 784], 0.1, 'triangle', 0.08);
      const id = BIOMES[bi].id;
      if (id !== 'desert') A.unlock(id);
      else A.unlock('loop');
      hud();
    }
    lastBiomeShown = Math.max(0, lastBiomeShown - dt);
    const downHeld = A.keys.has('ArrowDown') || A.keys.has('s') || dino.touchDuck;
    const pitUnder = obs.some((o) => o.pit && dino.x + 30 > o.x + 8 && dino.x + 18 < o.x + o.w - 8) && powerT.rocket <= 0 && !god;
    if (dino.falling) {
      dino.vy += 2600 * dt;
      dino.y += dino.vy * dt;
      if (dino.y > 40) { die(); return; }
    } else if (dino.y < 0 || dino.vy < 0) {
      let g = 2600;
      if (dino.fastFall || downHeld) g = 7000;
      else if (dino.jumpHeld !== true && dino.jumpHeld !== 'touch' && dino.vy < -330) dino.vy = -330;
      dino.vy += g * dt;
      dino.y += dino.vy * dt;
      if (dino.y >= 0) {
        if (pitUnder) startFall();
        else {
          dino.y = 0; dino.vy = 0; dino.fastFall = false; dino.jumpHeld = false; dino.air = 0;
          A.fx.burst(dino.x + 24, GROUND, 5, [BIOMES[biomeI].top], { speed: 60, life: 0.3, size: 2.5, gravity: 120, angle: -Math.PI / 2, spread: 2 });
        }
      }
    } else if (pitUnder) startFall();
    dino.duck = onGround() && downHeld;
    dino.run += dt * sp / 30;
    if (dino.char === 'ember' && Math.random() < 0.5) A.fx.burst(dino.x + 2, GROUND - 22 + dino.y, 1, ['#ffb800', '#ff5a1f'], { speed: 50, life: 0.35, size: 3, gravity: -120, angle: Math.PI, spread: 1, glow: true, shape: 'dot' });
    if (powerT.rocket > 0 && Math.random() < 0.9) A.fx.burst(dino.x + 4, GROUND - 22 + dino.y, 2, ['#ffb800', '#ff5a1f', '#fff3a0'], { speed: 160, life: 0.4, size: 4, gravity: 0, angle: Math.PI, spread: 0.6, glow: true, shape: 'dot' });
    for (const o of obs) {
      o.x -= (sp + (o.vx || 0)) * dt;
      if (o.flap != null) o.flap += dt;
      if (o.rot != null) o.rot -= (sp + o.vx) * dt / 14;
      if (o.fall) {
        o.tx -= sp * dt;
        o.vy += 900 * dt;
        o.y += o.vy * dt;
        o.x += (o.tx - o.x) * Math.min(1, dt * 3);
        if (Math.random() < 0.7) A.fx.burst(o.x + 13, o.y + 12, 1, ['#ff9a3d', '#ffe066', '#ff4a1f'], { speed: 40, life: 0.4, size: 4, gravity: -40, glow: true, shape: 'dot' });
        if (o.y >= GROUND - o.h) { o.y = GROUND - o.h; o.fall = false; o.landed = true; A.shake(0.4); A.noise(0.3, 0.15, 900); A.fx.burst(o.x + 13, GROUND, 14, ['#ff9a3d', '#5a4a46', '#ffe066'], { speed: 200, life: 0.6, size: 4, gravity: 500, angle: -Math.PI / 2, spread: 2.4 }); }
      }
    }
    obs = obs.filter((o) => !o.dead && o.x + o.w > -30);
    const grounded = obs.filter((o) => !o.fall);
    const last = grounded[grounded.length - 1];
    if (dist > 14 && (!last || W - (last.x + last.w) > nextGap)) spawn();
    if (mode !== 'hardcore' && dist > nextPower) spawnPower();
    for (const c of clouds) { c.x -= sp * 0.12 * c.s * dt; if (c.x < -80) { c.x = W + Math.random() * 200; c.y = 26 + Math.random() * 70; } }
    for (const b of bumps) { b.x -= sp * dt; if (b.x < -10) b.x += 1200; }
    for (const f of flakes) { f.x -= (sp * 0.3 + 20) * f.s * dt; f.y += 40 * f.s * dt; if (f.x < -5) f.x += W + 10; if (f.y > H) f.y -= H; }
    const magnet = powerT.magnet > 0 ? 150 : dino.char === 'sunny' ? 60 : 0;
    const dcx = dino.x + 24, dcy = GROUND - 26 + dino.y;
    for (let i = ambers.length - 1; i >= 0; i--) {
      const a = ambers[i];
      a.x -= sp * dt;
      a.t += dt;
      if (magnet) { const dx = dcx - a.x, dy = dcy - a.y, d = Math.hypot(dx, dy); if (d < magnet) { a.x += dx / d * 520 * dt; a.y += dy / d * 520 * dt; } }
      if (Math.abs(a.x - dcx) < 22 && Math.abs(a.y - dcy) < 28) {
        ambers.splice(i, 1);
        const n = powerT.double > 0 ? 2 : 1;
        runAmber += n;
        if (runAmber >= 100) A.unlock('amber100');
        A.beep(1100 + (runAmber % 6) * 80, 0.04, 'sine', 0.05);
        A.fx.burst(a.x, a.y, 4, ['#ffc21a', '#fff3a0'], { speed: 80, life: 0.3, size: 2.5, gravity: 0, glow: true, shape: 'dot' });
        hud();
        continue;
      }
      if (a.x < -20) ambers.splice(i, 1);
    }
    for (let i = pups.length - 1; i >= 0; i--) {
      const p = pups[i];
      p.x -= sp * dt;
      p.t += dt;
      if (Math.abs(p.x - dcx) < 26 && Math.abs(p.y + Math.sin(p.t * 3) * 6 - dcy) < 34) { pups.splice(i, 1); getPower(p.kind); continue; }
      if (p.x < -30) pups.splice(i, 1);
    }
    const rows = dino.duck ? DUCK : STAND, box = dino.duck ? DUCK_BOX : STAND_BOX;
    const dy = GROUND - rows.length * P + dino.y;
    for (const o of obs) {
      if (o.dead || o.pit) continue;
      if (!o.passed && o.x + o.w < dino.x) {
        o.passed = true;
        A.stat('cleared');
        if (o.duckable && dino.duck) { if (A.stat('ducks') >= 25) A.unlock('duck'); }
        if (o.minGap < 8 && powerT.rocket <= 0) { near++; A.pop('close call!', dino.x + 30, dy - 10, { color: '#ffe066', size: 14 }); if (near >= 10) A.unlock('close'); }
      }
      if (!o.passed && o.x < dino.x + 48 && o.x + o.w > dino.x) {
        const gap = o.y - (dy + rows.length * P);
        if (gap >= 0) o.minGap = Math.min(o.minGap, gap);
      }
      if (god || dino.inv > 0 || !hits(dino.x, dy, box, o.x, o.y, o.box)) continue;
      if (powerT.rocket > 0) { smash(o); rocketSmash++; if (rocketSmash >= 5) A.unlock('rocket'); continue; }
      if (dino.shield) {
        dino.shield = false;
        dino.inv = 1;
        smash(o);
        A.unlock('shield');
        A.fx.ring(dino.x + 24, dy + 24, 50, '#5ad1ff', 0.5, 5);
        A.sweep(1200, 300, 0.3, 'triangle', 0.08);
        continue;
      }
      die();
      return;
    }
  }
  function idle(dt) {
    if (A.state === 'menu') {
      dino.run += dt * 8;
      tx += 90 * dt;
      for (const b of bumps) { b.x -= 90 * dt; if (b.x < -10) b.x += 1200; }
      for (const c of clouds) { c.x -= 12 * c.s * dt; if (c.x < -80) c.x = W + 40; }
      for (const f of flakes) { f.x -= 30 * f.s * dt; f.y += 40 * f.s * dt; if (f.x < -5) f.x += W + 10; if (f.y > H) f.y -= H; }
      blendT = Math.min(1, blendT + dt / 2.5);
      if (blendT >= 1 && Math.random() < dt / 6) { prevBiome = biomeI; biomeI = (biomeI + 1) % BIOMES.length; blendT = 0; }
    }
  }
  function pal(b) {
    if (!A.dark || b.id === 'night' || b.id === 'volcano') return b;
    const o = {};
    for (const k in b) o[k] = typeof b[k] === 'string' && b[k][0] === '#' && !['obs', 'obs2', 'sun', 'dot'].includes(k) ? mix(b[k], '#141633', 0.38) : b[k];
    o.sky = b.sky.map((c) => mix(c, '#141633', 0.45));
    return o;
  }
  function ridge(x, seed, amp, base) { return base - (Math.sin(x * 0.006 + seed) * 0.5 + Math.sin(x * 0.0137 + seed * 2.1) * 0.3 + Math.sin(x * 0.031 + seed * 3.7) * 0.2) * amp; }
  function drawBiome(g, b, alpha) {
    g.globalAlpha = alpha;
    const sky = g.createLinearGradient(0, 0, 0, GROUND);
    sky.addColorStop(0, b.sky[0]);
    sky.addColorStop(1, b.sky[1]);
    g.fillStyle = sky;
    g.fillRect(0, 0, W, H);
    if (b.deco === 'stars' || b.id === 'volcano') {
      g.fillStyle = '#ffffff';
      for (const s of stars) { g.globalAlpha = alpha * (0.4 + Math.sin(A.time * 2 + s.t) * 0.3) * (b.id === 'volcano' ? 0.4 : 1); g.fillRect(s.x, s.y, s.r, s.r); }
      g.globalAlpha = alpha;
    }
    const sx = W - 96, sy = 52;
    if (b.id === 'night') {
      g.fillStyle = b.sun; g.beginPath(); g.arc(sx, sy, 20, 0, 7); g.fill();
      g.fillStyle = 'rgba(0,0,0,.12)'; g.beginPath(); g.arc(sx - 6, sy - 4, 4, 0, 7); g.arc(sx + 7, sy + 6, 3, 0, 7); g.fill();
    } else if (b.id !== 'volcano') {
      const rg = g.createRadialGradient(sx, sy, 6, sx, sy, 60);
      rg.addColorStop(0, b.sun); rg.addColorStop(0.35, rgba(b.sun, 0.6)); rg.addColorStop(1, rgba(b.sun, 0));
      g.fillStyle = rg; g.fillRect(sx - 60, sy - 60, 120, 120);
    }
    if (b.id === 'tundra') {
      g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) {
        g.strokeStyle = ['rgba(90,255,180,.18)', 'rgba(120,160,255,.15)', 'rgba(200,120,255,.12)'][i];
        g.lineWidth = 14 - i * 3;
        g.beginPath();
        for (let x = 0; x <= W; x += 20) g.lineTo(x, 40 + i * 14 + Math.sin(x * 0.012 + A.time * 0.6 + i) * 12);
        g.stroke();
      }
      g.globalCompositeOperation = 'source-over';
    }
    const off1 = tx * 0.08, off2 = tx * 0.25;
    g.fillStyle = b.far;
    g.beginPath();
    g.moveTo(0, GROUND);
    for (let x = 0; x <= W + 10; x += 10) {
      let y = ridge(x + off1, biomeSeed(b), b.id === 'desert' ? 34 : 46, GROUND - 70);
      if (b.id === 'desert') y = Math.round(y / 18) * 18;
      g.lineTo(x, y);
    }
    g.lineTo(W, GROUND);
    g.fill();
    if (b.id === 'volcano') {
      const vx = ((W * 0.65 - off1 * 0.5) % (W + 400) + W + 400) % (W + 400) - 200;
      g.fillStyle = '#1a0a0a';
      g.beginPath(); g.moveTo(vx - 150, GROUND); g.lineTo(vx - 30, GROUND - 130); g.lineTo(vx + 30, GROUND - 130); g.lineTo(vx + 150, GROUND); g.fill();
      const lg = g.createRadialGradient(vx, GROUND - 132, 4, vx, GROUND - 132, 60);
      lg.addColorStop(0, 'rgba(255,180,60,.9)'); lg.addColorStop(1, 'rgba(255,60,20,0)');
      g.fillStyle = lg; g.fillRect(vx - 60, GROUND - 192, 120, 120);
      g.strokeStyle = 'rgba(255,110,40,.7)'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(vx - 10, GROUND - 128); g.lineTo(vx - 30, GROUND - 90); g.lineTo(vx - 22, GROUND - 60); g.stroke();
    }
    if (b.id === 'tundra') {
      g.fillStyle = 'rgba(255,255,255,.75)';
      for (let x = -((off1) % 140); x < W + 140; x += 140) { const y = ridge(x + off1, biomeSeed(b), 46, GROUND - 70); g.beginPath(); g.moveTo(x - 14, y + 12); g.lineTo(x, y - 2); g.lineTo(x + 14, y + 12); g.fill(); }
    }
    g.fillStyle = b.mid;
    if (b.id === 'jungle' || b.id === 'tundra' || b.id === 'night') {
      const step = b.id === 'jungle' ? 120 : 70;
      const o2 = off2 % step;
      for (let x = -o2 - step; x < W + step; x += step) {
        const k = Math.floor((x + off2) / step);
        const hh = 40 + ((k * 37) % 5) * 9;
        if (b.id === 'jungle') {
          g.fillRect(x + 8, GROUND - hh, 5, hh);
          g.beginPath();
          for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.6; g.moveTo(x + 10, GROUND - hh); g.quadraticCurveTo(x + 10 + Math.cos(a) * 18, GROUND - hh + Math.sin(a) * 18 - 6, x + 10 + Math.cos(a) * 30, GROUND - hh + Math.sin(a) * 18 + 10); }
          g.lineWidth = 6; g.strokeStyle = b.mid; g.stroke();
        } else {
          g.beginPath(); g.moveTo(x - 14, GROUND); g.lineTo(x, GROUND - hh); g.lineTo(x + 14, GROUND); g.fill();
          if (b.id === 'tundra') { g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.moveTo(x - 5, GROUND - hh + 15); g.lineTo(x, GROUND - hh); g.lineTo(x + 5, GROUND - hh + 15); g.fill(); g.fillStyle = b.mid; }
        }
      }
    } else {
      g.beginPath();
      g.moveTo(0, GROUND);
      for (let x = 0; x <= W + 10; x += 10) g.lineTo(x, ridge(x + off2, biomeSeed(b) + 5, 16, GROUND - 22));
      g.lineTo(W, GROUND);
      g.fill();
    }
    if (b.id !== 'night' && b.id !== 'volcano') {
      g.fillStyle = b.id === 'tundra' ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.8)';
      for (const c of clouds) {
        g.beginPath();
        g.arc(c.x, c.y, 11 * c.s, 0, 7); g.arc(c.x + 15 * c.s, c.y - 7 * c.s, 14 * c.s, 0, 7); g.arc(c.x + 32 * c.s, c.y, 10 * c.s, 0, 7);
        g.rect(c.x, c.y, 32 * c.s, 10 * c.s);
        g.fill();
      }
    }
    g.fillStyle = b.ground;
    g.fillRect(0, GROUND, W, H - GROUND);
    g.fillStyle = b.top;
    g.fillRect(0, GROUND - 1, W, 5);
    g.fillStyle = b.dot;
    for (const bp of bumps) if (bp.x < W) g.fillRect(bp.x, GROUND + bp.y, bp.w, 2);
    if (b.id === 'jungle') { g.fillStyle = '#3d8a2e'; for (const bp of bumps) if (bp.x < W && bp.w > 4) { g.fillRect(bp.x, GROUND - 4, 2, 4); g.fillRect(bp.x + 3, GROUND - 6, 2, 6); } }
    if (b.id === 'volcano') {
      g.globalAlpha = alpha * (0.5 + Math.sin(A.time * 3) * 0.2);
      g.fillStyle = '#ff5a1f';
      for (const bp of bumps) if (bp.x < W && bp.w > 3) g.fillRect(bp.x, GROUND + bp.y, bp.w * 3, 1.5);
      g.globalAlpha = alpha;
    }
    if (b.deco === 'snow') { g.fillStyle = '#ffffff'; for (const f of flakes) { g.globalAlpha = alpha * 0.8; g.beginPath(); g.arc(f.x, f.y, f.r, 0, 7); g.fill(); } g.globalAlpha = alpha; }
    if (b.deco === 'embers') { for (const f of flakes) { g.globalAlpha = alpha * 0.7; g.fillStyle = '#ff8a3d'; g.fillRect(f.x, H - f.y, 2, 2); } g.globalAlpha = alpha; }
    if (b.deco === 'stars') { for (let i = 0; i < 10; i++) { const f = flakes[i]; g.globalAlpha = alpha * (0.5 + Math.sin(A.time * 3 + i) * 0.5); g.fillStyle = '#e8ff7a'; g.beginPath(); g.arc(f.x, GROUND - 30 - (f.y % 80), 1.6, 0, 7); g.fill(); } g.globalAlpha = alpha; }
    if (b.deco === 'leaves') { for (let i = 0; i < 12; i++) { const f = flakes[i]; g.save(); g.globalAlpha = alpha * 0.7; g.translate(f.x, f.y * 0.8); g.rotate(A.time + i); g.fillStyle = i % 2 ? '#4caf50' : '#8bc34a'; g.beginPath(); g.ellipse(0, 0, 4, 2, 0, 0, 7); g.fill(); g.restore(); } }
    g.globalAlpha = 1;
  }
  function biomeSeed(b) { return BIOMES.indexOf(b) * 3.3 + 1; }
  function drawObs(g, o, b) {
    const c1 = b.obs, c2 = b.obs2;
    if (o.rows) { sprite(g, o.rows, o.x, o.y, o.ice ? '#8fdcff' : c1); return; }
    g.save();
    if (o.kind === 'tumble') {
      g.translate(o.x + 13, o.y + 13 - Math.abs(Math.sin(o.rot * 0.5)) * 10);
      g.rotate(o.rot);
      g.strokeStyle = '#a0763e'; g.lineWidth = 2;
      for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(0, 0, 12 - i * 1.5, i, i + 4.5); g.stroke(); }
    } else if (o.kind === 'log') {
      g.fillStyle = c1; rrect(g, o.x, o.y, o.w, o.h, 8); g.fill();
      g.fillStyle = c2; g.fillRect(o.x + 6, o.y + 6, o.w - 16, 2); g.fillRect(o.x + 10, o.y + 12, o.w - 22, 2);
      g.fillStyle = '#d9a86a'; g.beginPath(); g.ellipse(o.x + o.w - 6, o.y + o.h / 2, 6, o.h / 2, 0, 0, 7); g.fill();
      g.strokeStyle = c2; g.lineWidth = 1.2; g.beginPath(); g.ellipse(o.x + o.w - 6, o.y + o.h / 2, 3, o.h / 4, 0, 0, 7); g.stroke();
      g.fillStyle = '#4c9a3a'; g.fillRect(o.x + 14, o.y - 3, 8, 4);
    } else if (o.kind === 'vine') {
      const sway = Math.sin(A.time * 2 + o.x * 0.05) * 3;
      g.strokeStyle = '#2f7d32'; g.lineWidth = 5; g.lineCap = 'round';
      g.beginPath(); g.moveTo(o.x + 9, 0); g.quadraticCurveTo(o.x + 9 + sway * 2, o.h / 2, o.x + 9 + sway, o.h); g.stroke();
      g.fillStyle = '#4caf50';
      for (let y = 14; y < o.h; y += 16) { g.beginPath(); g.ellipse(o.x + 9 + sway * y / o.h + (y % 32 ? 6 : -6), y, 6, 3, y % 32 ? 0.5 : -0.5, 0, 7); g.fill(); }
      g.fillStyle = '#e8457a'; g.beginPath(); g.arc(o.x + 9 + sway, o.h + 2, 5, 0, 7); g.fill();
    } else if (o.kind === 'bush') {
      g.fillStyle = '#2f7d32';
      g.beginPath(); g.arc(o.x + 9, o.y + 13, 9, 0, 7); g.arc(o.x + 18, o.y + 9, 10, 0, 7); g.arc(o.x + 25, o.y + 14, 8, 0, 7); g.fill();
      g.fillStyle = '#d63a4f';
      for (const [x, y] of [[8, 9], [17, 5], [24, 12], [14, 15]]) { g.beginPath(); g.arc(o.x + x, o.y + y, 2, 0, 7); g.fill(); }
      g.fillStyle = '#1b5e20'; g.fillRect(o.x + 2, o.y + 20, o.w - 4, 2);
    } else if (o.kind === 'spike') {
      const gr = g.createLinearGradient(o.x, 0, o.x + o.w, 0);
      gr.addColorStop(0, '#d8f4ff'); gr.addColorStop(1, '#5ab8ef');
      g.fillStyle = gr;
      g.beginPath(); g.moveTo(o.x, GROUND); g.lineTo(o.x + 11, o.y); g.lineTo(o.x + 22, GROUND); g.fill();
      g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.moveTo(o.x + 8, GROUND - 6); g.lineTo(o.x + 11, o.y + 8); g.lineTo(o.x + 11, GROUND - 6); g.fill();
    } else if (o.kind === 'snowball') {
      g.translate(o.x + 14, o.y + 14);
      g.rotate(o.rot);
      g.fillStyle = '#ffffff'; g.beginPath(); g.arc(0, 0, 14, 0, 7); g.fill();
      g.fillStyle = '#cfe0f7'; g.beginPath(); g.arc(4, 5, 7, 0, 7); g.arc(-6, -3, 3, 0, 7); g.fill();
    } else if (o.kind === 'pit') {
      const lg = g.createLinearGradient(0, GROUND, 0, H);
      lg.addColorStop(0, '#ffe066'); lg.addColorStop(0.3, '#ff6a1f'); lg.addColorStop(1, '#8a1a0a');
      g.fillStyle = lg;
      g.beginPath(); g.moveTo(o.x, GROUND - 1); g.lineTo(o.x + o.w, GROUND - 1); g.lineTo(o.x + o.w - 8, H); g.lineTo(o.x + 8, H); g.fill();
      g.fillStyle = '#fff3a0';
      for (let i = 0; i < 3; i++) { const bx = o.x + 10 + ((A.time * 30 + i * 17) % (o.w - 20)); g.beginPath(); g.arc(bx, GROUND + 6 + Math.sin(A.time * 5 + i) * 2, 2.5, 0, 7); g.fill(); }
      const hg = g.createLinearGradient(0, GROUND - 26, 0, GROUND); hg.addColorStop(0, 'rgba(255,106,31,0)'); hg.addColorStop(1, 'rgba(255,106,31,.45)'); g.fillStyle = hg; g.fillRect(o.x + 4, GROUND - 26, o.w - 8, 25);
    } else if (o.kind === 'boulder' || o.kind === 'meteor') {
      if (o.fall) {
        g.globalAlpha = 0.35; g.fillStyle = '#000'; g.beginPath(); g.ellipse(o.tx + 13, GROUND + 3, 16, 4, 0, 0, 7); g.fill(); g.globalAlpha = 1;
      }
      g.fillStyle = c1;
      g.beginPath(); g.moveTo(o.x + 2, o.y + o.h); g.lineTo(o.x, o.y + 10); g.lineTo(o.x + 8, o.y); g.lineTo(o.x + 22, o.y + 2); g.lineTo(o.x + o.w, o.y + 12); g.lineTo(o.x + o.w - 2, o.y + o.h); g.fill();
      g.fillStyle = c2; g.fillRect(o.x + 6, o.y + o.h - 6, o.w - 12, 4);
      if (o.kind === 'meteor') { g.strokeStyle = '#ff8a3d'; g.lineWidth = 2; g.beginPath(); g.moveTo(o.x + 8, o.y + 6); g.lineTo(o.x + 14, o.y + 14); g.lineTo(o.x + 20, o.y + 10); g.stroke(); }
    } else if (o.kind === 'bat') {
      const f = Math.sin(o.flap * 18);
      g.translate(o.x + 15, o.y + 9);
      g.fillStyle = '#2a1f3d';
      g.beginPath(); g.moveTo(0, 0); g.lineTo(-15, -6 - f * 6); g.lineTo(-10, 2); g.lineTo(-4, 0); g.lineTo(0, 4); g.lineTo(4, 0); g.lineTo(10, 2); g.lineTo(15, -6 - f * 6); g.closePath(); g.fill();
      g.beginPath(); g.arc(0, 1, 5, 0, 7); g.fill();
      g.fillStyle = '#ff5a5a'; g.fillRect(-3, 0, 2, 2); g.fillRect(1, 0, 2, 2);
    } else if (o.kind === 'ptero') {
      const fr = Math.floor(o.flap * 6) % 2;
      g.restore();
      sprite(g, PTERO[fr], o.x, o.y + (fr ? 0 : -3), b.id === 'night' ? '#c3a8ee' : '#7b5ea7');
      return;
    }
    g.restore();
  }
  function drawAcc(g, x, y, acc, duck, s) {
    const ox = duck ? 8 : 0;
    const px = (cx, cy, w, h, c) => { g.fillStyle = c; g.fillRect(x + (cx + ox) * P * s, y + cy * P * s, w * P * s, h * P * s); };
    if (acc === 'bow') { px(11, -2, 2, 2, '#ff2e7a'); px(14, -2, 2, 2, '#ff2e7a'); px(13, -1, 1, 1, '#ffd1e3'); }
    if (acc === 'shades') { px(9, 1, 5, 1, '#111'); px(10, 2, 2, 1, '#111'); px(10, 1, 1, 1, '#9fe7ff'); }
    if (acc === 'scarf') { px(8, 5, 6, 2, '#e8344e'); px(6 + (Math.floor(A.time * 8) % 2), 6, 2, 2, '#e8344e'); }
    if (acc === 'band') { px(8, 0, 8, 1, '#f3f3f3'); px(6, 0 + (Math.floor(A.time * 6) % 2), 2, 1, '#f3f3f3'); px(5, 1, 1, 1, '#f3f3f3'); }
    if (acc === 'flame') { px(-1, 6, 1, 2, '#ffb800'); }
  }
  function drawDino(g, x, y, ch, s = 1, duck = false, dead = false, legPhase = 0) {
    const c = CHARS[ch] || CHARS.rex;
    const rows = duck ? DUCK_BODY.concat(DUCK_LEGS[Math.floor(legPhase) % 2]) : DINO_BODY.concat(DINO_LEGS[legPhase === -1 ? 0 : 1 + (Math.floor(legPhase) % 2)]);
    g.save();
    g.translate(x, y);
    g.scale(s, s);
    sprite(g, rows, 0, 0, c.color);
    const eyeX = duck ? 19 : 10;
    g.fillStyle = '#ffffff';
    g.fillRect(eyeX * P, P, P, P);
    if (dead) {
      g.strokeStyle = '#ffffff'; g.lineWidth = 1.5;
      const ex = eyeX * P + 1.5, ey = P + 1.5;
      g.fillStyle = c.color; g.fillRect(eyeX * P - 1, P - 1, P + 2, P + 2);
      g.beginPath(); g.moveTo(ex - 3, ey - 3); g.lineTo(ex + 3, ey + 3); g.moveTo(ex + 3, ey - 3); g.lineTo(ex - 3, ey + 3); g.stroke();
    } else { g.fillStyle = '#1a1a1a'; g.fillRect(eyeX * P + 1, P + 1, 2, 2); }
    g.restore();
    if (c.acc) drawAcc(g, x, y, c.acc, duck, s);
  }
  function draw(g) {
    const b = pal(BIOMES[biomeI]), pb = pal(BIOMES[prevBiome]);
    g.save();
    A.applyShake(g, 10);
    if (blendT < 1) { drawBiome(g, pb, 1); drawBiome(g, b, blendT); } else drawBiome(g, b, 1);
    for (const o of obs) if (o.pit) drawObs(g, o, b);
    for (const a of ambers) {
      const sx = Math.abs(Math.cos(a.t * 4));
      g.save();
      g.translate(a.x, a.y);
      g.scale(0.35 + sx * 0.65, 1);
      const ag = g.createLinearGradient(0, -7, 0, 7);
      ag.addColorStop(0, '#ffe08a'); ag.addColorStop(1, '#e08a00');
      g.fillStyle = ag;
      g.beginPath(); g.moveTo(0, -8); g.quadraticCurveTo(7, -1, 5, 4); g.quadraticCurveTo(0, 9, -5, 4); g.quadraticCurveTo(-7, -1, 0, -8); g.fill();
      g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(-2, -4, 2, 3);
      g.fillStyle = 'rgba(80,40,0,.6)'; g.fillRect(0, 1, 2, 1);
      g.restore();
    }
    for (const p of pups) {
      const y = p.y + Math.sin(p.t * 3) * 6, P2 = POW[p.kind];
      g.save();
      g.translate(p.x, y);
      g.shadowColor = P2.color; g.shadowBlur = 14;
      g.fillStyle = 'rgba(255,255,255,.85)';
      g.beginPath(); g.arc(0, 0, 13, 0, 7); g.fill();
      g.shadowBlur = 0;
      g.strokeStyle = P2.color; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 13, 0, 7); g.stroke();
      g.fillStyle = P2.color; g.strokeStyle = P2.color; g.lineWidth = 2.2; g.lineCap = 'round';
      g.beginPath();
      if (p.kind === 'shield') { g.moveTo(0, -7); g.lineTo(6, -4); g.quadraticCurveTo(5, 4, 0, 7); g.quadraticCurveTo(-5, 4, -6, -4); g.closePath(); g.fill(); }
      else if (p.kind === 'magnet') { g.arc(0, 0, 6, Math.PI, 0); g.moveTo(-6, 0); g.lineTo(-6, 5); g.moveTo(6, 0); g.lineTo(6, 5); g.stroke(); }
      else if (p.kind === 'wings') { g.strokeStyle = '#7fb8ff'; g.moveTo(0, 2); g.quadraticCurveTo(-8, -8, -9, 2); g.moveTo(0, 2); g.quadraticCurveTo(8, -8, 9, 2); g.stroke(); }
      else if (p.kind === 'slow') { g.arc(0, 0, 6, 0, 7); g.moveTo(0, 0); g.lineTo(0, -4); g.moveTo(0, 0); g.lineTo(3, 1); g.stroke(); }
      else if (p.kind === 'rocket') { g.moveTo(-6, 4); g.lineTo(4, -6); g.moveTo(-2, 6); g.lineTo(6, -2); g.stroke(); g.beginPath(); g.arc(5, -5, 2.5, 0, 7); g.fill(); }
      else if (p.kind === 'double') { g.font = `900 11px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('x2', 0, 1); }
      g.restore();
    }
    for (const o of obs) if (!o.pit) drawObs(g, o, b);
    const rows = dino.duck ? DUCK : STAND;
    const dy = GROUND - rows.length * P + dino.y;
    const legs = dino.dead || !onGround() ? -1 : dino.run;
    if (dino.inv > 0 && Math.floor(A.time * 14) % 2) g.globalAlpha = 0.4;
    if (powerT.rocket > 0) { g.save(); g.translate(dino.x + 24, dy + 20); g.rotate(-0.08); g.translate(-dino.x - 24, -dy - 20); }
    drawDino(g, dino.x, dy, dino.char, 1, dino.duck, dino.dead, A.state === 'menu' ? dino.run : legs);
    if (powerT.rocket > 0) g.restore();
    g.globalAlpha = 1;
    if (powerT.wings > 0 || dino.char === 'frost') {
      if (!onGround() && !dino.air) { g.fillStyle = 'rgba(255,255,255,.85)'; const f = Math.sin(A.time * 20) * 4; g.beginPath(); g.ellipse(dino.x + 20, dy + 22 + f, 10, 5, -0.4, 0, 7); g.fill(); }
    }
    if (dino.shield) {
      g.save();
      g.strokeStyle = 'rgba(90,209,255,.8)'; g.fillStyle = 'rgba(90,209,255,.12)'; g.lineWidth = 2.5;
      g.beginPath(); g.ellipse(dino.x + 26, dy + rows.length * P / 2, 34, rows.length * P / 2 + 8, 0, 0, 7); g.fill(); g.stroke();
      g.restore();
    }
    A.fx.draw(g);
    A.drawPops(g);
    g.restore();
    const ink = ['night', 'volcano'].includes(BIOMES[biomeI].id) || A.dark ? '#f3eee7' : '#3a3530';
    g.font = `800 18px ${FONT}`;
    g.textAlign = 'right';
    g.fillStyle = ink;
    if (!(blinkT > 0 && Math.floor(blinkT * 8) % 2 === 0) && A.state !== 'menu') g.fillText(String(Math.floor(dist)).padStart(5, '0') + ' m', W - 16, 30);
    let px = 12;
    g.textAlign = 'left';
    g.font = `800 11px ${FONT}`;
    g.textBaseline = 'middle';
    if (A.state === 'play' || A.state === 'paused') for (const k of ['magnet', 'wings', 'slow', 'rocket', 'double']) {
      if (powerT[k] <= 0) continue;
      const label = `${POW[k].name} ${Math.ceil(powerT[k])}`;
      const tw = g.measureText(label).width + 14;
      g.fillStyle = k === 'wings' ? '#7fb8ff' : POW[k].color;
      rrect(g, px, 14, tw, 18, 9); g.fill();
      g.fillStyle = '#fff';
      g.fillText(label, px + 7, 23.5);
      px += tw + 5;
    }
    g.textBaseline = 'alphabetic';
    if (lastBiomeShown > 0 && A.state === 'play') {
      const a = Math.min(1, lastBiomeShown * 2, (2.6 - lastBiomeShown) * 4);
      g.globalAlpha = Math.max(0, a);
      g.textAlign = 'center';
      g.font = `900 30px ${FONT}`;
      g.lineWidth = 6; g.lineJoin = 'round';
      g.strokeStyle = 'rgba(0,0,0,.4)';
      g.fillStyle = '#ffffff';
      g.strokeText(BIOMES[biomeI].name, W / 2, 96);
      g.fillText(BIOMES[biomeI].name, W / 2, 96);
      g.globalAlpha = 1;
    }
    if (flash) { g.fillStyle = `rgba(255,255,255,${flash / 0.14 * 0.6})`; g.fillRect(0, 0, W, H); }
    if (powerT.slow > 0 && A.state === 'play') { g.fillStyle = 'rgba(150,100,255,.08)'; g.fillRect(0, 0, W, H); }
  }
  A.debug = () => ({
    y: dino.y, ducking: dino.duck, speed, dist, biome: BIOMES[biomeI].id, amber: runAmber, bank, state: A.state,
    god(on) { god = on; }, setDist(d) { dist = d; }, power(k) { getPower(k); }, addBank(n) { bank += n; A.save('bank', bank); paintChars(); }
  });
  reset();
  A.state = 'menu';
  A.boot();
})();
