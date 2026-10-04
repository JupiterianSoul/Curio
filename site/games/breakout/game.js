'use strict';
(() => {
  const W = 480, H = 680, PY = 628, PH = 14;
  const COLS = 12, BW = 35, BH = 17, GX = 4, GY = 4, BX0 = (W - (COLS * BW + (COLS - 1) * GX)) / 2;
  const LEVELS = window.BK_LEVELS, BOSSES = window.BK_BOSSES, POWERS = window.BK_POWERS, THEMES = window.BK_THEMES;
  const DIFF = {
    easy: { lives: 5, speed: 290, paddle: 104, bad: 0 },
    normal: { lives: 3, speed: 340, paddle: 86, bad: 1 },
    hard: { lives: 2, speed: 395, paddle: 72, bad: 1.6 }
  };
  const ADJ = ['Wobbly', 'Cosmic', 'Funky', 'Sneaky', 'Molten', 'Frozen', 'Electric', 'Velvet', 'Lucky', 'Grumpy', 'Turbo', 'Mystic', 'Jazzy', 'Rusty', 'Glitter', 'Haunted'];
  const NOUN = ['Wall', 'Garden', 'Maze', 'Tower', 'Reef', 'Grid', 'Hive', 'Cascade', 'Vault', 'Parade', 'Orchard', 'Circuit', 'Bazaar', 'Lagoon', 'Citadel', 'Quilt'];
  const ACH = [
    { id: 'first', icon: '🧱', name: 'First crack', desc: 'Break your very first brick.' },
    { id: 'clear1', icon: '✅', name: 'Warmed up', desc: 'Clear any level.' },
    { id: 'combo10', icon: '🔥', name: 'Combo artist', desc: 'Break 10 bricks without touching the paddle.' },
    { id: 'combo25', icon: '🌋', name: 'Unstoppable', desc: 'Hit a 25 brick combo.' },
    { id: 'tron', icon: '🤖', name: 'Bot breaker', desc: 'Defeat Bricktron.' },
    { id: 'eye', icon: '👁️', name: 'Eye see you', desc: 'Defeat The Eye.' },
    { id: 'mother', icon: '🥚', name: 'Family feud', desc: 'Defeat Brickmother.' },
    { id: 'twins', icon: '♊', name: 'Double trouble', desc: 'Defeat the Twin Cores.' },
    { id: 'mono', icon: '🗿', name: 'Monolith fallen', desc: 'Beat the final boss and finish the campaign.' },
    { id: 'multi8', icon: '🎱', name: 'Ball pit', desc: 'Have 8 or more balls in play at once.' },
    { id: 'power10', icon: '🎁', name: 'Collector', desc: 'Catch 10 power-ups in one run.' },
    { id: 'tnt', icon: '💥', name: 'Chain reaction', desc: 'Destroy 8 bricks with one explosive chain.' },
    { id: 'flawless', icon: '💎', name: 'Flawless', desc: 'Clear level 3 or later without dropping a ball.' },
    { id: 'daily', icon: '📅', name: 'Daily grind', desc: 'Finish all five daily levels.' },
    { id: 'endless10', icon: '♾️', name: 'Endless enthusiast', desc: 'Reach level 10 in Endless.' },
    { id: 'score50k', icon: '💰', name: 'Fifty grand', desc: 'Score 50,000 points in a run.' },
    { id: 'hard5', icon: '🪨', name: 'Hard as bricks', desc: 'Reach level 5 on Hard.' },
    { id: 'laser', icon: '🔫', name: 'Laser show', desc: 'Destroy 50 bricks with lasers (all time).' },
    { id: 'warp', icon: '🌀', name: 'Shortcut', desc: 'Take a warp gate.' },
    { id: 'gold', icon: '🪙', name: 'Gold digger', desc: 'Break 10 gold bricks (all time).' }
  ];
  let mode, diff, D, levelIdx, lives, balls, paddle, bricks, caps, lasers, bolts, bosses, T, clearT, loseT, pointerX, auto;
  let banner, combo, bestCombo, lostHere, powersRun, explosions, chainCount, laserCool, levelDef, R, demo, totalLevels, bossIntroT, warpT;
  const A = Arcade({
    width: W, height: H, reset, update, draw, key, pointer, idle, achievements: ACH, tip: 'Tip for touchpads: no clicking needed to steer, just glide the cursor. Space or a tap launches.',
    defaults: { mode: 'campaign', diff: 'normal', theme: 'auto', start: '1' },
    statsList: [
      ['runs', 'Runs played'], ['bricks', 'Bricks broken'], ['levels', 'Levels cleared'], ['bosses', 'Bosses beaten'],
      ['powers', 'Power-ups caught'], ['combo', 'Best combo'], ['maxLevel', 'Furthest level'], ['lives', 'Balls lost']
    ],
    modeName: () => `${{ campaign: 'Campaign', endless: 'Endless', daily: 'Daily' }[A.opts.mode]} · ${A.opts.diff}`,
    histText: () => `${Curio.fmt(A.score)} · L${levelIdx + 1}`,
    optsChanged, theme: () => { sprites.clear(); bgKey = ''; }, resized: () => { sprites.clear(); bgKey = ''; },
    action, menu: menuPreview
  });
  const th = () => THEMES[A.opts.theme === 'auto' || !THEMES[A.opts.theme] ? (A.dark ? 'neon' : 'candy') : A.opts.theme];
  const levelNo = () => levelIdx + 1;
  const unlockedMax = () => Math.min(LEVELS.length, Math.max(1, A.load('unlocked', 1)));

  function optsChanged(o) {
    const desc = document.querySelector('[data-desc="mode"]');
    if (desc) desc.textContent = {
      campaign: '25 hand-built levels with a boss every fifth stage.',
      endless: 'Random levels forever. Bosses return stronger.',
      daily: `Today's five seeded levels. Same bricks for everyone.`
    }[o.mode] || '';
    const st = document.querySelector('[data-start]');
    if (st) {
      st.hidden = o.mode !== 'campaign';
      const n = Math.max(1, Math.min(unlockedMax(), +o.start || 1));
      st.querySelector('b').textContent = `${n}. ${LEVELS[n - 1].name}`;
      st.querySelector('[data-act="prev"]').disabled = n <= 1;
      st.querySelector('[data-act="next"]').disabled = n >= unlockedMax();
    }
    menuPreview();
  }
  function action(a) {
    if (a === 'prev' || a === 'next') {
      const n = Math.max(1, Math.min(unlockedMax(), (+A.opts.start || 1) + (a === 'next' ? 1 : -1)));
      A.setOpt('start', String(n));
      A.click();
    }
  }
  function menuPreview() {
    if (A.state === 'play') return;
    mode = A.opts.mode;
    const n = mode === 'campaign' ? Math.max(1, Math.min(unlockedMax(), +A.opts.start || 1)) - 1 : 0;
    levelIdx = n;
    R = A.rng(A.seedOf('bk-' + A.today()));
    levelDef = mode === 'campaign' ? LEVELS[n] : genLevel(0, R);
    buildBricks(levelDef);
    bosses = [];
    caps = []; lasers = []; bolts = []; explosions = [];
    demo = { x: W / 2, y: PY - 80, vx: 170, vy: -240 };
    paddle = { x: W / 2, w: 86, stun: 0 };
    balls = [];
  }

  function reset() {
    mode = A.opts.mode;
    diff = DIFF[A.opts.diff] ? A.opts.diff : 'normal';
    D = DIFF[diff];
    A.bestKey = `score-${mode}-${diff}`;
    R = mode === 'daily' ? A.rng(A.seedOf('bk-' + A.today())) : A.rng((Math.random() * 1e9) | 0);
    levelIdx = mode === 'campaign' ? Math.max(1, Math.min(unlockedMax(), +A.opts.start || 1)) - 1 : 0;
    totalLevels = mode === 'campaign' ? LEVELS.length : mode === 'daily' ? 5 : Infinity;
    lives = D.lives;
    T = { wide: 0, slow: 0, laser: 0, catch: 0, mega: 0, fire: 0, shield: 0, shrink: 0, fast: 0 };
    clearT = 0; loseT = 0; pointerX = null; banner = null; bestCombo = 0; powersRun = 0; warpT = 0;
    paddle = { x: W / 2, w: D.paddle, stun: 0 };
    demo = null;
    loadLevel();
    hud();
  }
  function hud() {
    A.hud('lives', lives > 0 ? '♥'.repeat(Math.min(lives, 5)) + (lives > 5 ? '+' : '') : '0');
    A.hud('level', mode === 'daily' ? `${levelNo()}/5` : levelNo());
  }
  function genLevel(i, rnd) {
    const n = i + 1;
    const pickName = () => `${ADJ[(rnd() * ADJ.length) | 0]} ${NOUN[(rnd() * NOUN.length) | 0]}`;
    const tier = Math.min(4, 1 + Math.floor(n / 5));
    const rowsN = 5 + Math.floor(rnd() * 4);
    const dens = 0.55 + rnd() * 0.35;
    const specials = ['X', 'G', '?', 'I', 'R', 'S'];
    const cell = () => {
      if (rnd() > dens) return '.';
      const r = rnd();
      if (r < 0.1 + n * 0.004) return specials[(rnd() * (n > 6 ? 6 : 4)) | 0];
      return String(1 + Math.floor(rnd() * tier));
    };
    if (n % 5 === 0) {
      const keys = ['tron', 'eye', 'mother', 'twins', 'mono'];
      const b = keys[(n / 5 - 1) % 5];
      const rows = ['', ...Array.from({ length: 2 }, () => { const half = Array.from({ length: 6 }, cell).join('').replace(/S/g, '1'); return half + [...half].reverse().join(''); })];
      return { name: `${BOSSES[b].name} ${n > 25 ? 'Returns' : 'Attacks'}`, boss: b, top: 220, rows, hpMul: 1 + Math.floor((n - 1) / 25) * 0.6 + (mode === 'daily' ? -0.2 : 0) };
    }
    for (let tries = 0; tries < 30; tries++) {
      const rows = [];
      for (let r = 0; r < rowsN; r++) {
        const half = Array.from({ length: 6 }, cell).join('');
        rows.push(half + [...half].reverse().join(''));
      }
      const breakable = rows.join('').replace(/[.S]/g, '').length;
      if (breakable >= 14) return { name: pickName(), rows, drift: rnd() < 0.25 ? 30 : 0 };
    }
    return { name: pickName(), rows: ['111111111111', '222222222222', '111111111111'] };
  }
  function buildBricks(L) {
    bricks = [];
    const top = L.top || 86;
    const pal = th().bricks;
    L.rows.forEach((raw, r) => {
      let row = raw;
      if (row.length < COLS) { const pad = COLS - row.length; row = '.'.repeat(pad >> 1) + row + '.'.repeat(pad - (pad >> 1)); }
      [...row.slice(0, COLS)].forEach((ch, c) => {
        if (ch === '.') return;
        const type = /[1-4]/.test(ch) ? 'n' : ch;
        const hp = type === 'n' ? +ch : type === 'S' ? Infinity : type === 'G' ? 3 : type === 'R' ? 2 : type === 'I' ? 2 : 1;
        const x = BX0 + c * (BW + GX), y = top + r * (BH + GY);
        bricks.push({ x, bx: x, y, r, c, hp, max: hp, type, ci: r % pal.length, hitT: 0, shown: type !== 'I', regenT: 0, amp: 0, dir: r % 2 ? 1 : -1 });
      });
    });
    if (L.drift) {
      const rowsMap = {};
      for (const b of bricks) (rowsMap[b.r] ||= []).push(b);
      for (const k in rowsMap) {
        const list = rowsMap[k];
        const minX = Math.min(...list.map((b) => b.bx)), maxX = Math.max(...list.map((b) => b.bx + BW));
        const amp = Math.max(0, Math.min(L.drift, minX - 4, W - 4 - maxX));
        for (const b of list) b.amp = list.some((q) => q.type === 'S') ? 0 : amp;
      }
    }
  }
  function loadLevel() {
    levelDef = mode === 'campaign' ? LEVELS[levelIdx] : genLevel(levelIdx, R);
    buildBricks(levelDef);
    caps = []; lasers = []; bolts = []; explosions = []; chainCount = 0;
    combo = 0; lostHere = false; laserCool = 0; bossIntroT = 0;
    bosses = [];
    if (levelDef.boss) spawnBoss(levelDef.boss, levelDef.hpMul || 1);
    newBall();
    banner = { text: levelDef.boss ? `Boss: ${BOSSES[levelDef.boss].name}` : `Level ${levelNo()}`, sub: levelDef.boss ? `Level ${levelNo()}` : levelDef.name, t: 0, dur: 2.2 };
    if (levelDef.boss) { bossIntroT = 1.2; A.sweep(80, 300, 0.9, 'sawtooth', 0.06); A.shake(0.5); }
    A.statMax('maxLevel', levelNo());
    if (mode === 'endless' && levelNo() >= 10) A.unlock('endless10');
    if (diff === 'hard' && levelNo() >= 5) A.unlock('hard5');
  }
  function spawnBoss(type, mul) {
    const def = BOSSES[type];
    const hpm = { easy: 0.75, normal: 1, hard: 1.3 }[diff] * mul;
    const mk = (x, sub) => ({ type: sub || type, def, x, y: type === 'eye' ? 120 : 76, w: def.w, h: def.h, hp: Math.round(def.hp * hpm), max: Math.round(def.hp * hpm), t: Math.random() * 3, vx: 80, shootT: 2.5, spawnT: 7, hitT: 0, dying: 0, enraged: false, look: 0 });
    if (type === 'twins') { const a = mk(W * 0.3, 'twin'), b = mk(W * 0.7, 'twin'); b.vx = -80; b.t = 1.4; bosses.push(a, b); }
    else bosses.push(mk(W / 2));
  }
  const baseSpeed = () => Math.min(D.speed + 180, D.speed + levelIdx * 7);
  const ballR = () => (T && T.mega > 0 ? 11 : 7);
  function newBall() {
    balls = [{ x: paddle.x, y: PY - 7, vx: 0, vy: 0, stuck: true, off: (Math.random() - 0.5) * 20, trail: [], catchT: 0 }];
  }
  function launch() {
    if (clearT || loseT) return;
    let any = false;
    for (const b of balls) if (b.stuck) {
      const a = (Math.random() - 0.5) * 0.5 + b.off / 50;
      const s = baseSpeed();
      b.vx = Math.sin(a) * s; b.vy = -Math.cos(a) * s; b.stuck = false; any = true;
    }
    if (any) { A.sweep(500, 900, 0.08, 'triangle', 0.07); banner = banner && banner.t < 0.4 ? banner : banner; }
  }
  function key(k, down) {
    if (!down) return;
    if (k === ' ' || k === 'ArrowUp' || k === 'w') launch();
    if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'a' || k === 'd') pointerX = null;
  }
  function pointer(type, p, e) {
    if (type === 'move' || type === 'down') { if (e.pointerType !== 'mouse' || type === 'move') pointerX = p.x; }
    if (type === 'up') launch();
  }
  const speedOf = (b) => Math.hypot(b.vx, b.vy);
  function setSpeed(b, s) { const k = s / (speedOf(b) || 1); b.vx *= k; b.vy *= k; }
  function fixAngle(b) {
    const s = speedOf(b);
    if (Math.abs(b.vy) < s * 0.3) { b.vy = Math.sign(b.vy || -1) * s * 0.3; setSpeed(b, s); }
  }
  function choosePower(force) {
    const bad = D.bad;
    const list = Object.entries(POWERS).filter(([k, p]) => (p.good || bad > 0) && !(k === 'warp' && (levelDef.boss || mode === 'daily')) && !(k === 'life' && lives >= 6));
    let tot = 0;
    for (const [, p] of list) tot += p.good ? p.w : p.w * bad;
    let r = Math.random() * tot;
    for (const [k, p] of list) { r -= p.good ? p.w : p.w * bad; if (r <= 0) return k; }
    return force || 'wide';
  }
  function dropCap(x, y, always) {
    if (!always && Math.random() > 0.13) return;
    caps.push({ x, y, type: choosePower(), vy: 120 + Math.random() * 40, rot: 0 });
  }
  function brickColor(br) {
    const t = th();
    return br.type === 'S' ? t.steel : br.type === 'X' ? '#ff4433' : br.type === 'G' ? '#ffc21a' : br.type === '?' ? '#a45cff' : br.type === 'R' ? '#2fd67a' : t.bricks[br.ci % t.bricks.length];
  }
  function damage(br, dmg, src) {
    if (br.dead) return;
    br.hitT = 0.12;
    if (br.type === 'S') { if (src === 'ball') { A.beep(1500, 0.04, 'square', 0.035); A.fx.burst(br.x + BW / 2, br.y + BH / 2, 3, ['#fff', th().steel], { speed: 90, life: 0.25, size: 2, gravity: 0, shape: 'spark', glow: true }); } return; }
    br.shown = true;
    br.hp -= dmg;
    const cx = br.x + BW / 2, cy = br.y + BH / 2;
    if (br.hp > 0) {
      if (br.type === 'R') br.regenT = 4;
      A.addScore(10);
      A.fx.burst(cx, cy, 5, [brickColor(br), '#ffffff'], { speed: 110, life: 0.3, size: 3, gravity: 200 });
      A.beep(300 + br.hp * 40, 0.05, 'triangle', 0.06);
      return;
    }
    br.dead = true;
    combo++;
    bestCombo = Math.max(bestCombo, combo);
    const mult = Math.min(5, 1 + Math.floor(combo / 4) * 0.5);
    const base = br.type === 'G' ? 500 : 40 + br.max * 10;
    const pts = Math.round(base * mult);
    A.addScore(pts);
    A.stat('bricks');
    A.unlock('first');
    if (combo >= 10) A.unlock('combo10');
    if (combo >= 25) A.unlock('combo25');
    if (src === 'laser' && A.stat('laserBricks') >= 50) A.unlock('laser');
    if (br.type === 'G' && A.stat('gold') >= 10) A.unlock('gold');
    const col = brickColor(br);
    A.fx.burst(cx, cy, br.type === 'G' ? 26 : 14, [col, shade(col, 0.45), shade(col, -0.3)], { speed: 220, life: 0.7, size: 5, gravity: 650 });
    if (th().glow > 0.5) A.fx.burst(cx, cy, 6, [col, '#ffffff'], { speed: 160, life: 0.35, size: 2.5, gravity: 0, shape: 'spark', glow: true });
    A.pop(`+${pts}`, cx, cy, { color: mult > 1 ? '#ffe14d' : '#ffffff', size: mult > 1 ? 17 : 14, life: 0.7 });
    if (combo > 0 && combo % 5 === 0) {
      A.pop(`${combo} COMBO!`, W / 2, PY - 120, { color: '#ff5cd6', size: 26, life: 1.1, vy: -30, tag: 'combo' });
      A.chord([660 + combo * 10, 880 + combo * 10], 0.05, 'square', 0.05);
    }
    const step = Math.min(14, combo);
    A.beep(440 * Math.pow(2, step / 12), 0.07, 'square', 0.055);
    if (br.type === 'X') explosions.push({ x: cx, y: cy, t: 0.08 });
    if (br.type === 'G' || br.type === '?') dropCap(cx, cy, true);
    else dropCap(cx, cy, false);
    if (src === 'boom') { chainCount++; if (chainCount >= 8) A.unlock('tnt'); }
  }
  function applyPower(type) {
    const P = POWERS[type];
    powersRun++;
    A.stat('powers');
    if (powersRun >= 10) A.unlock('power10');
    A.fx.burst(paddle.x, PY, 22, [P.color, '#fff'], { speed: 240, life: 0.6, size: 4, gravity: 300, angle: -Math.PI / 2, spread: 2.2 });
    A.fx.ring(paddle.x, PY + 7, 60, P.color);
    if (P.good) A.chord([660, 880, 1100], 0.045, 'triangle', 0.08);
    else A.sweep(600, 200, 0.3, 'sawtooth', 0.06);
    A.pop(P.name, paddle.x, PY - 30, { color: P.color, size: 20, life: 1.1, stroke: 'rgba(0,0,0,.6)' });
    A.buzz(15);
    if (P.t) T[type] = P.t;
    if (type === 'wide') T.shrink = 0;
    if (type === 'shrink') T.wide = 0;
    if (type === 'slow') T.fast = 0;
    if (type === 'fast') T.slow = 0;
    if (type === 'life') { lives++; hud(); }
    if (type === 'catch') T.catch = P.t;
    if (type === 'warp') { warpT = 0.9; A.unlock('warp'); A.sweep(200, 1600, 0.8, 'sine', 0.08); }
    if (type === 'multi') {
      const add = [];
      for (const b of balls) {
        if (balls.length + add.length >= 12) break;
        if (b.stuck) { b.stuck = false; b.vx = 0; b.vy = -baseSpeed(); }
        for (const da of [-0.5, 0.5]) {
          const s = speedOf(b), a = Math.atan2(b.vx, -b.vy) + da;
          add.push({ x: b.x, y: b.y, vx: Math.sin(a) * s, vy: -Math.cos(a) * s, stuck: false, trail: [], catchT: 0 });
        }
      }
      balls.push(...add);
      if (balls.length >= 8) A.unlock('multi8');
    }
  }
  function circleRect(b, x, y, w, h, r) {
    const cx = Math.max(x, Math.min(b.x, x + w)), cy = Math.max(y, Math.min(b.y, y + h));
    const nx = b.x - cx, ny = b.y - cy;
    return nx * nx + ny * ny < r * r;
  }
  function bounceOff(b, x, y, w, h, r) {
    const px = Math.min(b.x + r - x, x + w - (b.x - r)), py = Math.min(b.y + r - y, y + h - (b.y - r));
    if (px < py) { b.vx = b.x < x + w / 2 ? -Math.abs(b.vx) : Math.abs(b.vx); b.x += b.vx > 0 ? px : -px; }
    else { b.vy = b.y < y + h / 2 ? -Math.abs(b.vy) : Math.abs(b.vy); b.y += b.vy > 0 ? py : -py; }
    fixAngle(b);
  }
  function hitBoss(bs, dmg) {
    if (bs.dying) return;
    bs.hp -= dmg;
    bs.hitT = 0.12;
    A.addScore(25 * dmg);
    A.shake(0.15);
    A.beep(180 + (bs.hp / bs.max) * 300, 0.06, 'square', 0.07);
    A.fx.burst(bs.x, bs.y + bs.h / 2, 6, [bs.def.color, '#fff'], { speed: 180, life: 0.4, size: 3, gravity: 200, shape: 'spark', glow: true });
    if (bs.hp <= 0) {
      bs.dying = 1.4;
      A.noise(1.2, 0.25, 900);
      A.shake(1);
      A.flash('#ffffff', 0.25);
      A.buzz([60, 40, 120]);
      A.addScore(bs.def.pts);
      A.pop(`+${Curio.fmt(bs.def.pts)}`, bs.x, bs.y, { color: '#ffe14d', size: 30, life: 1.6, vy: -40 });
      const other = bosses.find((o) => o !== bs && !o.dying);
      if (other) { other.enraged = true; A.pop('ENRAGED!', other.x, other.y + 50, { color: '#ff3d3d', size: 22 }); }
    }
  }
  function bossShoot(bs, kind) {
    const px = paddle.x, py = PY;
    if (kind === 'bomb') bolts.push({ x: bs.x + (Math.random() - 0.5) * bs.w * 0.6, y: bs.y + bs.h / 2, vx: 0, vy: 190, kind: 'bomb' });
    else {
      const a0 = Math.atan2(py - bs.y, px - bs.x);
      for (const d of kind === 'triple' ? [-0.22, 0, 0.22] : [0]) bolts.push({ x: bs.x, y: bs.y + bs.h * 0.3, vx: Math.cos(a0 + d) * 260, vy: Math.sin(a0 + d) * 260, kind: 'laser' });
    }
    A.sweep(kind === 'bomb' ? 300 : 1200, kind === 'bomb' ? 120 : 400, 0.15, 'square', 0.04);
  }
  function spawnMinions(n) {
    const top = levelDef.top || 86;
    const slots = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < COLS; c++) {
      const x = BX0 + c * (BW + GX), y = top + r * (BH + GY);
      if (!bricks.some((b) => !b.dead && Math.abs(b.bx - x) < 2 && Math.abs(b.y - y) < 2)) slots.push([x, y, r, c]);
    }
    for (const [x, y, r, c] of Curio.shuffle(slots).slice(0, n)) {
      bricks.push({ x, bx: x, y, r, c, hp: 1, max: 1, type: 'n', ci: 3, hitT: 0.3, shown: true, regenT: 0, amp: 0, dir: 1 });
      A.fx.ring(x + BW / 2, y + BH / 2, 22, '#3dff9a');
    }
    A.sweep(200, 700, 0.3, 'triangle', 0.05);
  }
  function updateBoss(bs, dt) {
    bs.t += dt;
    bs.hitT = Math.max(0, bs.hitT - dt);
    if (bs.dying) {
      bs.dying -= dt;
      if (Math.random() < 0.3) A.fx.burst(bs.x + (Math.random() - 0.5) * bs.w, bs.y + (Math.random() - 0.5) * bs.h, 10, [bs.def.color, '#fff', '#ffe14d'], { speed: 220, life: 0.6, size: 4, gravity: 100, glow: true, shape: 'dot' });
      if (Math.random() < 0.08) A.noise(0.3, 0.12, 1400);
      return;
    }
    if (bossIntroT > 0) return;
    const frac = bs.hp / bs.max;
    const rage = bs.enraged ? 1.6 : 1;
    const sweep = (sp) => {
      bs.x += Math.sign(bs.vx) * sp * rage * dt;
      if (bs.x < bs.w / 2 + 8) { bs.x = bs.w / 2 + 8; bs.vx = Math.abs(bs.vx); }
      if (bs.x > W - bs.w / 2 - 8) { bs.x = W - bs.w / 2 - 8; bs.vx = -Math.abs(bs.vx); }
    };
    bs.shootT -= dt;
    bs.spawnT -= dt;
    if (bs.type === 'tron') {
      sweep(90 + (1 - frac) * 60);
      if (bs.shootT <= 0) { bs.shootT = 2.2 - (1 - frac) * 0.8; bossShoot(bs, 'bomb'); }
    } else if (bs.type === 'eye') {
      bs.x = W / 2 + Math.sin(bs.t * 0.7) * 150;
      bs.y = 120 + Math.sin(bs.t * 1.4) * 34;
      if (bs.shootT <= 0) { bs.shootT = 2.6 - (1 - frac); bossShoot(bs, frac < 0.5 ? 'triple' : 'laser'); }
    } else if (bs.type === 'mother') {
      sweep(70);
      if (bs.shootT <= 0) { bs.shootT = 3; bossShoot(bs, 'bomb'); }
      if (bs.spawnT <= 0) { bs.spawnT = 7.5; spawnMinions(5); }
    } else if (bs.type === 'twin') {
      sweep(80);
      bs.y = 80 + Math.sin(bs.t * 2) * 10;
      if (bs.shootT <= 0) { bs.shootT = (bs.enraged ? 1.3 : 2.4) + Math.random() * 0.4; bossShoot(bs, 'laser'); }
    } else if (bs.type === 'mono') {
      const ph = frac > 0.6 ? 1 : frac > 0.25 ? 2 : 3;
      sweep(ph === 3 ? 140 : 60);
      if (bs.shootT <= 0) { bs.shootT = ph === 3 ? 1.3 : 2.2; bossShoot(bs, ph === 1 ? 'bomb' : Math.random() < 0.5 ? 'triple' : 'bomb'); }
      if (ph >= 2 && bs.spawnT <= 0) { bs.spawnT = 9; spawnMinions(4); }
    }
    bs.look = Math.atan2(PY - bs.y, (balls[0]?.x ?? paddle.x) - bs.x);
  }
  function loseBall() {
    lives--;
    lostHere = true;
    A.stat('lives');
    hud();
    A.shake(0.6);
    A.flash('#ff3355', 0.2);
    A.buzz([40, 30, 80]);
    loseT = 1.1;
    combo = 0;
    A.sweep(420, 70, 0.7, 'sawtooth', 0.08);
    for (const k in T) T[k] = 0;
    caps = []; bolts = []; lasers = [];
  }
  function levelCleared(warped) {
    const bonus = 250 * levelNo() + (lostHere ? 0 : 750);
    A.addScore(bonus);
    A.stat('levels');
    A.unlock('clear1');
    if (!lostHere && levelNo() >= 3) A.unlock('flawless');
    if (levelDef.boss) { A.stat('bosses'); A.unlock(levelDef.boss); }
    if (mode === 'campaign') A.save('unlocked', Math.max(A.load('unlocked', 1), Math.min(LEVELS.length, levelNo() + 1)));
    banner = { text: warped ? 'Warped!' : levelDef.boss ? 'Boss defeated!' : 'Level clear!', sub: `+${Curio.fmt(bonus)}${lostHere ? '' : ' flawless'}`, t: 0, dur: 2 };
    clearT = 2.1;
    caps = []; bolts = [];
    for (const b of balls) { b.vx *= 0.2; b.vy *= 0.2; }
    Curio.confetti(70);
    A.chord([523, 659, 784, 1047, 1319], 0.08, 'triangle', 0.1);
    if (A.score >= 50000) A.unlock('score50k');
  }
  function finish(win) {
    A.statMax('combo', bestCombo);
    const mName = { campaign: 'Campaign', endless: 'Endless', daily: 'Daily' }[mode];
    if (win && mode === 'daily') A.unlock('daily');
    const reached = win ? levelNo() : levelNo();
    const title = win ? (mode === 'daily' ? 'Daily cleared!' : 'Campaign complete!') : levelNo() >= 10 ? 'Brick legend!' : levelNo() >= 4 ? 'Nice smashing!' : 'Out of balls';
    const msg = win ? (mode === 'daily' ? 'All five of today\'s levels are rubble. Come back tomorrow for new ones.' : 'The Monolith has fallen. The bricks will tell stories about you.') : `You reached level ${reached} (${levelDef.name}). ${bricks.filter((b) => !b.dead && b.type !== 'S').length} bricks survived to tell the tale.`;
    A.over({
      title, msg,
      medal: win ? ['#ffd34d', '#e0a100', '♛'] : null,
      rows: [['Level', mode === 'daily' ? `${reached}/5` : reached], ['Best combo', bestCombo], ['Power-ups', powersRun]],
      share: `Curio Breakout · ${mName} (${diff}) · ${Curio.fmt(A.score)} pts · level ${reached}${mode === 'daily' ? ' · ' + A.today() : ''} · best combo ${bestCombo}`
    });
  }
  function update(dt) {
    A.fx.update(dt);
    if (banner) { banner.t += dt; if (banner.t > banner.dur) banner = null; }
    for (const k in T) T[k] = Math.max(0, T[k] - dt);
    bossIntroT = Math.max(0, bossIntroT - dt);
    const targetW = D.paddle * (T.wide > 0 ? 1.55 : T.shrink > 0 ? 0.62 : 1);
    paddle.w += (targetW - paddle.w) * Math.min(1, dt * 10);
    paddle.stun = Math.max(0, paddle.stun - dt);
    const left = A.keys.has('ArrowLeft') || A.keys.has('a'), right = A.keys.has('ArrowRight') || A.keys.has('d');
    if (paddle.stun <= 0) {
      if (auto) {
        const tgt = balls.filter((b) => b.vy > 0 && !b.stuck).sort((a, b) => b.y - a.y)[0] || balls[0];
        if (tgt) paddle.x += ((tgt.x + (tgt.stuck ? 0 : 8)) - paddle.x) * Math.min(1, dt * 25);
        if (balls.some((b) => b.stuck)) launch();
      } else if (left || right) paddle.x += (right - left) * 600 * dt;
      else if (pointerX != null) paddle.x += (pointerX - paddle.x) * Math.min(1, dt * 30);
    }
    paddle.x = Math.max(paddle.w / 2 + 4, Math.min(W - paddle.w / 2 - 4, paddle.x));
    for (const br of bricks) {
      br.hitT = Math.max(0, br.hitT - dt);
      if (br.amp) br.x = br.bx + Math.sin(A.time * 0.9) * br.amp * br.dir;
      if (br.regenT > 0) { br.regenT -= dt; if (br.regenT <= 0 && !br.dead && br.hp < br.max) { br.hp = br.max; br.hitT = 0.2; A.fx.ring(br.x + BW / 2, br.y + BH / 2, 18, '#2fd67a'); } }
    }
    if (warpT > 0) {
      warpT -= dt;
      if (warpT <= 0) { for (const b of bricks) if (b.type !== 'S') b.dead = true; bricks = bricks.filter((b) => !b.dead); levelCleared(true); }
      return;
    }
    if (clearT) {
      clearT -= dt;
      for (const b of balls) { b.x += b.vx * dt; b.y += b.vy * dt; }
      if (clearT <= 0) {
        clearT = 0;
        if (levelNo() >= totalLevels) { finish(true); return; }
        levelIdx++;
        loadLevel();
        hud();
      }
      return;
    }
    if (loseT) {
      loseT -= dt;
      if (loseT <= 0) { loseT = 0; if (lives <= 0) finish(false); else newBall(); }
      return;
    }
    for (const bs of bosses) updateBoss(bs, dt);
    bosses = bosses.filter((bs) => !(bs.dying && bs.dying <= 0));
    const slowMul = T.slow > 0 ? 0.62 : T.fast > 0 ? 1.35 : 1;
    const r = ballR();
    for (let i = balls.length - 1; i >= 0; i--) {
      const b = balls[i];
      if (b.stuck) {
        b.x = paddle.x + b.off;
        b.y = PY - r;
        if (b.catchT > 0) { b.catchT -= dt; if (b.catchT <= 0) launch(); }
        continue;
      }
      b.trail.push(b.x, b.y);
      if (b.trail.length > 20) b.trail.splice(0, 2);
      b.x += b.vx * slowMul * dt;
      b.y += b.vy * slowMul * dt;
      if (T.fire > 0 && Math.random() < 0.5) A.fx.burst(b.x, b.y, 1, ['#ff9a2b', '#ff3d1f', '#ffe14d'], { speed: 40, life: 0.35, size: 4, gravity: -60, glow: true, shape: 'dot' });
      if (b.x < r) { b.x = r; b.vx = Math.abs(b.vx); A.beep(240, 0.03, 'triangle', 0.04); }
      if (b.x > W - r) { b.x = W - r; b.vx = -Math.abs(b.vx); A.beep(240, 0.03, 'triangle', 0.04); }
      if (b.y < r) { b.y = r; b.vy = Math.abs(b.vy); A.beep(240, 0.03, 'triangle', 0.04); }
      if (b.vy > 0 && b.y + r >= PY && b.y - r <= PY + PH && Math.abs(b.x - paddle.x) <= paddle.w / 2 + r) {
        const off = Math.max(-1, Math.min(1, (b.x - paddle.x) / (paddle.w / 2)));
        const s = Math.min(baseSpeed() + 220, speedOf(b) + 4), a = off * 1.05;
        b.vx = Math.sin(a) * s;
        b.vy = -Math.cos(a) * s;
        b.y = PY - r;
        if (combo >= 3) A.pop(`${combo} combo`, paddle.x, PY - 18, { color: '#9cff3d', size: 14, life: 0.6, tag: 'combo' });
        combo = 0;
        A.beep(392, 0.05, 'square', 0.05);
        A.fx.burst(b.x, PY, 5, [th().paddle[0], '#fff'], { speed: 90, life: 0.25, size: 2.5, gravity: 0, angle: -Math.PI / 2, spread: 2, shape: 'spark', glow: true });
        if (T.catch > 0) { b.stuck = true; b.off = b.x - paddle.x; b.catchT = 3; }
        continue;
      }
      for (const br of bricks) {
        if (br.dead || !circleRect(b, br.x, br.y, BW, BH, r)) continue;
        if (T.fire > 0 && br.type !== 'S') { damage(br, 99, 'fire'); continue; }
        bounceOff(b, br.x, br.y, BW, BH, r);
        damage(br, T.mega > 0 ? 2 : 1, 'ball');
        break;
      }
      for (const bs of bosses) {
        if (bs.dying || !circleRect(b, bs.x - bs.w / 2, bs.y - bs.h / 2, bs.w, bs.h, r)) continue;
        bounceOff(b, bs.x - bs.w / 2, bs.y - bs.h / 2, bs.w, bs.h, r);
        hitBoss(bs, T.mega > 0 || T.fire > 0 ? 2 : 1);
      }
      if (T.shield > 0 && b.vy > 0 && b.y + r >= PY + PH + 14) {
        b.vy = -Math.abs(b.vy);
        b.y = PY + PH + 14 - r;
        T.shield = 0;
        A.fx.ring(b.x, b.y, 50, '#3dd6ff');
        A.sweep(900, 300, 0.25, 'triangle', 0.07);
      }
      if (b.y - r > H) balls.splice(i, 1);
    }
    if (bricks.some((b) => b.dead)) bricks = bricks.filter((b) => !b.dead);
    for (let i = explosions.length - 1; i >= 0; i--) {
      const e = explosions[i];
      e.t -= dt;
      if (e.t > 0) continue;
      explosions.splice(i, 1);
      A.fx.ring(e.x, e.y, 46, '#ff6a2b', 0.5, 6);
      A.fx.burst(e.x, e.y, 22, ['#ff4433', '#ffb800', '#fff3a0'], { speed: 260, life: 0.55, size: 5, gravity: 100, glow: true, shape: 'dot' });
      A.noise(0.4, 0.16, 1100);
      A.shake(0.35);
      for (const br of bricks) if (!br.dead && Math.abs(br.x + BW / 2 - e.x) <= BW + GX + 2 && Math.abs(br.y + BH / 2 - e.y) <= BH + GY + 2) damage(br, 99, 'boom');
      for (const bs of bosses) if (Math.abs(bs.x - e.x) < bs.w / 2 + 40 && Math.abs(bs.y - e.y) < bs.h / 2 + 30) hitBoss(bs, 3);
    }
    if (!explosions.length) chainCount = 0;
    if (T.laser > 0 && balls.some((b) => !b.stuck)) {
      laserCool -= dt;
      if (laserCool <= 0) {
        laserCool = 0.3;
        lasers.push({ x: paddle.x - paddle.w / 2 + 6, y: PY - 4 }, { x: paddle.x + paddle.w / 2 - 6, y: PY - 4 });
        A.beep(1300, 0.035, 'square', 0.025);
      }
    }
    for (let i = lasers.length - 1; i >= 0; i--) {
      const l = lasers[i];
      l.y -= 720 * dt;
      let hit = l.y < -10;
      if (!hit) for (const br of bricks) if (!br.dead && l.x >= br.x && l.x <= br.x + BW && l.y >= br.y && l.y <= br.y + BH) { damage(br, 1, 'laser'); hit = true; break; }
      if (!hit) for (const bs of bosses) if (!bs.dying && Math.abs(l.x - bs.x) < bs.w / 2 && Math.abs(l.y - bs.y) < bs.h / 2) { hitBoss(bs, 1); hit = true; break; }
      if (hit) lasers.splice(i, 1);
    }
    for (let i = bolts.length - 1; i >= 0; i--) {
      const o = bolts[i];
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      if (o.kind === 'bomb') o.vy += 60 * dt;
      if (o.y > PY - 6 && o.y < PY + PH + 6 && Math.abs(o.x - paddle.x) < paddle.w / 2 + 6) {
        bolts.splice(i, 1);
        paddle.stun = 0.8;
        A.shake(0.5);
        A.buzz(60);
        A.flash('#ff5533', 0.15);
        A.noise(0.3, 0.15, 2000);
        A.pop('ZAPPED!', paddle.x, PY - 26, { color: '#ff5533', size: 18 });
        A.fx.burst(o.x, PY, 14, ['#ff5533', '#ffe14d'], { speed: 200, life: 0.5, size: 3, gravity: 300, glow: true });
        continue;
      }
      if (o.y > H + 20 || o.x < -20 || o.x > W + 20) bolts.splice(i, 1);
    }
    if (bricks.some((b) => b.dead)) bricks = bricks.filter((b) => !b.dead);
    if (!balls.length) { loseBall(); return; }
    for (let i = caps.length - 1; i >= 0; i--) {
      const c = caps[i];
      c.y += c.vy * dt;
      c.rot += dt;
      if (c.y + 9 >= PY && c.y - 9 <= PY + PH && Math.abs(c.x - paddle.x) <= paddle.w / 2 + 16) { applyPower(c.type); caps.splice(i, 1); }
      else if (c.y > H + 20) caps.splice(i, 1);
    }
    const breakable = bricks.some((b) => b.type !== 'S');
    if (levelDef.boss ? !bosses.length : !breakable) {
      if (levelDef.boss) for (const b of bricks) if (b.type !== 'S') { A.fx.burst(b.x + BW / 2, b.y + BH / 2, 6, brickColor(b), { speed: 150, life: 0.5, size: 4 }); b.dead = true; }
      bricks = bricks.filter((b) => !b.dead);
      levelCleared(false);
    }
  }
  function idle(dt) {
    if (A.state === 'menu' && demo) {
      demo.x += demo.vx * dt;
      demo.y += demo.vy * dt;
      if (demo.x < 8 || demo.x > W - 8) demo.vx *= -1;
      if (demo.y < 200 || demo.y > PY - 8) demo.vy *= -1;
      paddle.x += (demo.x - paddle.x) * Math.min(1, dt * 4);
      paddle.x = Math.max(paddle.w / 2 + 4, Math.min(W - paddle.w / 2 - 4, paddle.x));
    }
  }

  const sprites = new Map();
  function spriteScale() { return Math.max(1, A.canvas.width / W); }
  function brickSprite(br) {
    const t = th(), col = brickColor(br), s = spriteScale();
    const key = `${col}|${br.type}|${br.hp}|${br.max}|${s.toFixed(2)}`;
    let c = sprites.get(key);
    if (c) return c;
    const pad = 10;
    c = document.createElement('canvas');
    c.width = Math.ceil((BW + pad * 2) * s);
    c.height = Math.ceil((BH + pad * 2) * s);
    const g = c.getContext('2d');
    g.scale(s, s);
    g.translate(pad, pad);
    const dmg = br.max === Infinity ? 0 : 1 - br.hp / br.max;
    const base = br.type === 'n' && br.max > 1 ? shade(col, -0.12 * (br.hp - 1)) : col;
    if (t.glow > 0) { g.shadowColor = col; g.shadowBlur = 9 * t.glow; }
    const gr = g.createLinearGradient(0, 0, 0, BH);
    gr.addColorStop(0, shade(base, 0.28));
    gr.addColorStop(0.55, base);
    gr.addColorStop(1, shade(base, -0.28));
    g.fillStyle = gr;
    rrect(g, 0, 0, BW, BH, 5);
    g.fill();
    g.shadowBlur = 0;
    g.fillStyle = 'rgba(255,255,255,.38)';
    rrect(g, 3, 2, BW - 6, 4, 2);
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,.25)';
    g.lineWidth = 1;
    rrect(g, 0.5, 0.5, BW - 1, BH - 1, 5);
    g.stroke();
    if (br.type === 'S') {
      g.fillStyle = 'rgba(0,0,0,.35)';
      for (const [x, y] of [[5, 5], [BW - 5, 5], [5, BH - 5], [BW - 5, BH - 5]]) { g.beginPath(); g.arc(x, y, 1.7, 0, 7); g.fill(); }
      g.strokeStyle = 'rgba(255,255,255,.35)';
      g.beginPath(); g.moveTo(10, BH - 3); g.lineTo(16, 3); g.moveTo(15, BH - 3); g.lineTo(21, 3); g.stroke();
    } else if (br.type === 'X') {
      g.save();
      rrect(g, 1, 1, BW - 2, BH - 2, 4);
      g.clip();
      g.fillStyle = 'rgba(20,10,0,.45)';
      for (let x = -BH; x < BW; x += 9) { g.beginPath(); g.moveTo(x, BH); g.lineTo(x + 4, BH); g.lineTo(x + 4 + BH, 0); g.lineTo(x + BH, 0); g.fill(); }
      g.restore();
      g.fillStyle = '#1b1b1b';
      g.beginPath(); g.arc(BW / 2, BH / 2 + 1, 5, 0, 7); g.fill();
      g.strokeStyle = '#ffe14d'; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(BW / 2 + 3, BH / 2 - 3); g.quadraticCurveTo(BW / 2 + 7, BH / 2 - 8, BW / 2 + 9, BH / 2 - 5); g.stroke();
    } else if (br.type === 'G') {
      g.fillStyle = 'rgba(255,255,255,.85)';
      g.beginPath();
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? 2 : 6; g.lineTo(BW / 2 + Math.cos(a) * rr, BH / 2 + Math.sin(a) * rr); }
      g.fill();
    } else if (br.type === '?') {
      g.fillStyle = '#fff';
      g.font = `900 13px ${FONT}`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('?', BW / 2, BH / 2 + 1);
    } else if (br.type === 'R') {
      g.fillStyle = 'rgba(255,255,255,.9)';
      g.fillRect(BW / 2 - 1.5, BH / 2 - 5, 3, 10);
      g.fillRect(BW / 2 - 5, BH / 2 - 1.5, 10, 3);
    } else if (br.max > 1) {
      g.fillStyle = 'rgba(255,255,255,.85)';
      for (let i = 0; i < br.hp; i++) { g.beginPath(); g.arc(BW / 2 + (i - (br.hp - 1) / 2) * 7, BH / 2 + 1, 2, 0, 7); g.fill(); }
    }
    if (dmg > 0 && br.type !== 'S') {
      g.strokeStyle = 'rgba(0,0,0,.45)';
      g.lineWidth = 1.2;
      g.beginPath();
      g.moveTo(7, 2); g.lineTo(12, 8); g.lineTo(9, 14);
      if (dmg > 0.4) { g.moveTo(BW - 8, 2); g.lineTo(BW - 13, 9); g.lineTo(BW - 10, BH - 2); }
      g.stroke();
    }
    sprites.set(key, c);
    if (sprites.size > 400) sprites.clear();
    return c;
  }
  let bgCanvas = null, bgKey = '';
  function bgSprite() {
    const t = th(), s = spriteScale(), key = `${A.opts.theme}|${A.dark}|${s}`;
    if (bgCanvas && bgKey === key) return bgCanvas;
    bgKey = key;
    bgCanvas = document.createElement('canvas');
    bgCanvas.width = Math.ceil(W * s);
    bgCanvas.height = Math.ceil(H * s);
    const g = bgCanvas.getContext('2d');
    g.scale(s, s);
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, t.bg[0]);
    gr.addColorStop(1, t.bg[1]);
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);
    if (t.deco === 'sun') {
      const sy = H * 0.62;
      const sg = g.createLinearGradient(0, sy - 120, 0, sy);
      sg.addColorStop(0, '#ffe066'); sg.addColorStop(1, '#ff2e88');
      g.save();
      g.beginPath(); g.arc(W / 2, sy, 120, Math.PI, 0); g.closePath(); g.clip();
      g.fillStyle = sg; g.fillRect(0, sy - 130, W, 130);
      g.fillStyle = t.bg[0];
      for (let i = 0; i < 6; i++) g.fillRect(0, sy - 60 + i * 11, W, 2 + i * 1.3);
      g.restore();
      g.fillStyle = '#1a0633';
      g.fillRect(0, sy, W, H - sy);
    } else {
      g.strokeStyle = t.grid;
      g.lineWidth = 1;
      g.beginPath();
      for (let x = 0; x <= W; x += 40) { g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, H); }
      for (let y = 0; y <= H; y += 40) { g.moveTo(0, y + 0.5); g.lineTo(W, y + 0.5); }
      g.stroke();
    }
    const v = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, A.dark || t.glow > 0.5 ? 'rgba(0,0,0,.35)' : 'rgba(120,40,80,.08)');
    g.fillStyle = v;
    g.fillRect(0, 0, W, H);
    return bgCanvas;
  }
  function drawDeco(g, t) {
    const time = A.time;
    if (t.deco === 'orbs') {
      g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 5; i++) {
        const x = W / 2 + Math.sin(time * 0.15 + i * 2.1) * 200, y = H / 2 + Math.cos(time * 0.11 + i * 1.7) * 260;
        const rg = g.createRadialGradient(x, y, 0, x, y, 120);
        rg.addColorStop(0, rgba(t.bricks[i * 2 % 8], 0.12));
        rg.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = rg;
        g.fillRect(x - 120, y - 120, 240, 240);
      }
      g.globalCompositeOperation = 'source-over';
    } else if (t.deco === 'sprinkles') {
      for (let i = 0; i < 24; i++) {
        const x = (i * 97 + 13) % W, y = ((i * 53 + time * (12 + i % 5 * 4)) % (H + 20)) - 10;
        g.save();
        g.translate(x, y);
        g.rotate(i + time * 0.5);
        g.fillStyle = rgba(t.bricks[i % 8], 0.35);
        rrect(g, -5, -1.5, 10, 3, 1.5);
        g.fill();
        g.restore();
      }
    } else if (t.deco === 'sun') {
      const sy = H * 0.62;
      g.strokeStyle = t.grid;
      g.lineWidth = 1;
      g.beginPath();
      for (let i = -10; i <= 10; i++) { g.moveTo(W / 2 + i * 12, sy); g.lineTo(W / 2 + i * 90, H); }
      const off = (time * 0.6) % 1;
      for (let k = 0; k < 9; k++) { const p = (k + off) / 9, y = sy + (H - sy) * p * p; g.moveTo(0, y); g.lineTo(W, y); }
      g.stroke();
    } else if (t.deco === 'bubbles') {
      g.strokeStyle = 'rgba(180,240,255,.22)';
      g.lineWidth = 1.2;
      for (let i = 0; i < 18; i++) {
        const x = (i * 71 + Math.sin(time + i) * 10 + 20) % W, y = H - ((i * 113 + time * (18 + i % 4 * 6)) % (H + 30));
        g.beginPath(); g.arc(x, y, 3 + i % 4 * 2, 0, 7); g.stroke();
      }
    }
  }
  function drawBoss(g, bs, t) {
    const c = bs.def.color, flash = bs.hitT > 0;
    g.save();
    g.translate(bs.x, bs.y);
    if (bs.dying) { g.globalAlpha = Math.max(0, bs.dying / 1.4); g.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8); }
    if (bossIntroT > 0) g.scale(1 - bossIntroT * 0.4, 1 - bossIntroT * 0.4);
    const w = bs.w, h = bs.h;
    g.shadowColor = c;
    g.shadowBlur = 24 * Math.max(0.4, t.glow);
    const body = (x, y, ww, hh, r) => {
      const gr = g.createLinearGradient(0, y, 0, y + hh);
      gr.addColorStop(0, flash ? '#ffffff' : shade(c, 0.35));
      gr.addColorStop(1, flash ? '#ffd0d0' : shade(c, -0.45));
      g.fillStyle = gr;
      rrect(g, x, y, ww, hh, r);
      g.fill();
    };
    const eye = (x, y, r) => {
      g.shadowBlur = 0;
      g.fillStyle = '#fff';
      g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
      g.fillStyle = '#16102a';
      g.beginPath(); g.arc(x + Math.cos(bs.look) * r * 0.4, y + Math.sin(bs.look) * r * 0.4, r * 0.5, 0, 7); g.fill();
    };
    if (bs.type === 'tron') {
      g.fillStyle = shade(c, -0.3);
      g.fillRect(-3, -h / 2 - 16, 6, 16);
      g.beginPath(); g.arc(0, -h / 2 - 18, 5 + Math.sin(A.time * 8), 0, 7); g.fillStyle = '#ffe14d'; g.fill();
      body(-w / 2, -h / 2, w, h, 12);
      g.shadowBlur = 0;
      g.strokeStyle = 'rgba(0,0,0,.22)';
      g.lineWidth = 2;
      g.beginPath();
      for (let y = -h / 2 + 15; y < h / 2; y += 15) { g.moveTo(-w / 2 + 4, y); g.lineTo(w / 2 - 4, y); }
      g.stroke();
      eye(-32, -6, 13); eye(32, -6, 13);
      g.fillStyle = '#16102a';
      rrect(g, -30, 14, 60, 10, 4); g.fill();
      g.fillStyle = '#ffe14d';
      for (let i = 0; i < 5; i++) g.fillRect(-26 + i * 12, 16, 6, 6);
    } else if (bs.type === 'eye') {
      g.beginPath(); g.arc(0, 0, w / 2, 0, 7);
      const rg = g.createRadialGradient(-10, -10, 4, 0, 0, w / 2);
      rg.addColorStop(0, flash ? '#fff' : '#fdf6ff'); rg.addColorStop(1, flash ? '#ffd' : '#d9b8ff');
      g.fillStyle = rg; g.fill();
      g.shadowBlur = 0;
      g.strokeStyle = 'rgba(220,40,90,.5)'; g.lineWidth = 1.5;
      for (let i = 0; i < 7; i++) { const a = i * 0.9; g.beginPath(); g.moveTo(Math.cos(a) * w / 2, Math.sin(a) * w / 2); g.quadraticCurveTo(Math.cos(a + 0.3) * w / 3, Math.sin(a + 0.3) * w / 3, Math.cos(a) * w / 4, Math.sin(a) * w / 4); g.stroke(); }
      const ix = Math.cos(bs.look) * 16, iy = Math.sin(bs.look) * 16;
      g.fillStyle = c; g.beginPath(); g.arc(ix, iy, 22, 0, 7); g.fill();
      g.fillStyle = '#120a1f'; g.beginPath(); g.arc(ix, iy, 10 + Math.sin(A.time * 3) * 2, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(ix - 6, iy - 7, 4, 0, 7); g.fill();
      const blink = (A.time % 4) < 0.15 ? 1 : 0;
      if (blink) { g.fillStyle = shade(c, -0.3); g.beginPath(); g.arc(0, 0, w / 2 + 1, 0, 7); g.fill(); }
      g.strokeStyle = c; g.lineWidth = 4; g.beginPath(); g.arc(0, 0, w / 2, 0, 7); g.stroke();
    } else if (bs.type === 'mother') {
      g.beginPath();
      g.moveTo(-w / 2, h / 2); g.quadraticCurveTo(-w / 2, -h / 2, 0, -h / 2 - 10); g.quadraticCurveTo(w / 2, -h / 2, w / 2, h / 2); g.closePath();
      const gr = g.createLinearGradient(0, -h / 2, 0, h / 2);
      gr.addColorStop(0, flash ? '#fff' : shade(c, 0.3)); gr.addColorStop(1, flash ? '#dfd' : shade(c, -0.5));
      g.fillStyle = gr; g.fill();
      g.shadowBlur = 0;
      for (let i = -2; i <= 2; i++) {
        g.fillStyle = (Math.floor(A.time * 3) + i) % 3 === 0 ? '#fff' : shade(c, 0.5);
        rrect(g, i * 26 - 9, 10, 18, 10, 3); g.fill();
      }
      eye(0, -14, 11);
    } else if (bs.type === 'twin') {
      g.rotate(Math.sin(A.time * 2 + bs.t) * 0.1);
      g.beginPath();
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + Math.PI / 6; g.lineTo(Math.cos(a) * w / 2, Math.sin(a) * h / 1.6); }
      g.closePath();
      g.fillStyle = flash ? '#fff' : bs.enraged ? '#ff3d6a' : c; g.fill();
      g.shadowBlur = 0;
      g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 2;
      g.beginPath(); g.arc(0, 0, 18, A.time * 3, A.time * 3 + 4.5); g.stroke();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(0, 0, 9, 0, 7); g.fill();
    } else if (bs.type === 'mono') {
      body(-w / 2, -h / 2, w, h, 6);
      g.shadowBlur = 0;
      g.fillStyle = 'rgba(0,0,0,.35)';
      rrect(g, -w / 2 + 8, -h / 2 + 8, w - 16, h - 16, 4); g.fill();
      const frac = bs.hp / bs.max;
      g.strokeStyle = '#ffe14d'; g.lineWidth = 2;
      g.globalAlpha = 0.6 + Math.sin(A.time * 4) * 0.3;
      for (let i = 0; i < 6; i++) { const x = -w / 2 + 22 + i * 29; g.beginPath(); g.moveTo(x, -12); g.lineTo(x + 6, 0); g.lineTo(x, 12); g.stroke(); }
      g.globalAlpha = 1;
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1.5;
      g.beginPath();
      if (frac < 0.75) { g.moveTo(-w / 2 + 20, -h / 2); g.lineTo(-w / 2 + 34, -6); g.lineTo(-w / 2 + 26, h / 2); }
      if (frac < 0.5) { g.moveTo(w / 2 - 30, -h / 2); g.lineTo(w / 2 - 44, 4); g.lineTo(w / 2 - 36, h / 2); }
      if (frac < 0.25) { g.moveTo(0, -h / 2); g.lineTo(10, 0); g.lineTo(-6, h / 2); }
      g.stroke();
      eye(0, 0, 12);
    }
    g.restore();
  }
  function drawCap(g, c) {
    const P = POWERS[c.type];
    g.save();
    g.translate(c.x, c.y);
    const s = 1 + Math.sin(A.time * 8 + c.x) * 0.05;
    g.scale(s, s);
    g.shadowColor = P.color;
    g.shadowBlur = 12;
    const gr = g.createLinearGradient(0, -10, 0, 10);
    gr.addColorStop(0, shade(P.color, 0.35));
    gr.addColorStop(1, shade(P.color, -0.3));
    g.fillStyle = gr;
    rrect(g, -20, -10, 40, 20, 10);
    g.fill();
    g.shadowBlur = 0;
    g.strokeStyle = P.good ? 'rgba(255,255,255,.75)' : '#ff3355';
    g.lineWidth = 1.5;
    rrect(g, -20, -10, 40, 20, 10);
    g.stroke();
    g.fillStyle = 'rgba(255,255,255,.4)';
    rrect(g, -14, -7, 28, 4, 2);
    g.fill();
    g.strokeStyle = '#fff';
    g.fillStyle = '#fff';
    g.lineWidth = 2;
    g.lineCap = 'round';
    const k = c.type;
    g.beginPath();
    if (k === 'wide') { g.moveTo(-9, 1); g.lineTo(9, 1); g.moveTo(-9, 1); g.lineTo(-5, -3); g.moveTo(-9, 1); g.lineTo(-5, 5); g.moveTo(9, 1); g.lineTo(5, -3); g.moveTo(9, 1); g.lineTo(5, 5); g.stroke(); }
    else if (k === 'shrink') { g.moveTo(-10, 1); g.lineTo(-3, 1); g.lineTo(-6, -2); g.moveTo(-3, 1); g.lineTo(-6, 4); g.moveTo(10, 1); g.lineTo(3, 1); g.lineTo(6, -2); g.moveTo(3, 1); g.lineTo(6, 4); g.stroke(); }
    else if (k === 'multi') { for (const [x, y] of [[-6, 3], [0, -2], [6, 3]]) { g.moveTo(x + 3, y); g.arc(x, y, 3, 0, 7); } g.fill(); }
    else if (k === 'slow') { g.arc(0, 1, 6, 0, 7); g.moveTo(0, 1); g.lineTo(0, -3); g.moveTo(0, 1); g.lineTo(3, 2); g.stroke(); }
    else if (k === 'fast') { g.moveTo(-8, -4); g.lineTo(-2, 1); g.lineTo(-8, 6); g.moveTo(0, -4); g.lineTo(6, 1); g.lineTo(0, 6); g.stroke(); }
    else if (k === 'life') { g.moveTo(0, 6); g.bezierCurveTo(-10, -1, -5, -8, 0, -3); g.bezierCurveTo(5, -8, 10, -1, 0, 6); g.fill(); }
    else if (k === 'laser') { g.moveTo(-6, 6); g.lineTo(-6, -5); g.moveTo(6, 6); g.lineTo(6, -5); g.moveTo(-6, -7); g.lineTo(-6, -8); g.moveTo(6, -7); g.lineTo(6, -8); g.stroke(); }
    else if (k === 'catch') { g.moveTo(-8, -4); g.lineTo(-8, 2); g.arc(0, 2, 8, Math.PI, 0, true); g.lineTo(8, -4); g.stroke(); }
    else if (k === 'mega') { g.arc(0, 1, 7, 0, 7); g.fill(); }
    else if (k === 'fire') { g.moveTo(0, -8); g.quadraticCurveTo(8, 0, 4, 6); g.quadraticCurveTo(0, 9, -4, 6); g.quadraticCurveTo(-8, 0, 0, -8); g.fill(); }
    else if (k === 'shield') { g.moveTo(0, -7); g.lineTo(7, -4); g.quadraticCurveTo(6, 4, 0, 8); g.quadraticCurveTo(-6, 4, -7, -4); g.closePath(); g.stroke(); }
    else if (k === 'warp') { for (let i = 0; i < 18; i++) { const a = i * 0.6 + A.time * 4, r = i * 0.45; g.lineTo(Math.cos(a) * r, Math.sin(a) * r + 1); } g.stroke(); }
    g.restore();
  }
  function draw(g) {
    const t = th();
    g.save();
    A.applyShake(g, 16);
    g.drawImage(bgSprite(), -1, -1, W + 2, H + 2);
    drawDeco(g, t);
    const ss = spriteScale();
    for (const br of bricks) {
      if (br.dead) continue;
      if (!br.shown) {
        g.strokeStyle = rgba(t.text === '#ffffff' ? '#ffffff' : '#4a2240', 0.12 + Math.sin(A.time * 3 + br.c) * 0.06);
        g.setLineDash([3, 4]);
        g.lineWidth = 1;
        rrect(g, br.x + 0.5, br.y + 0.5, BW - 1, BH - 1, 5);
        g.stroke();
        g.setLineDash([]);
        continue;
      }
      const sp = brickSprite(br);
      g.drawImage(sp, br.x - 10, br.y - 10, sp.width / ss, sp.height / ss);
      if (br.type === '?' || br.type === 'G') {
        const sh = ((A.time * 0.8 + br.c * 0.07 + br.r * 0.05) % 2) - 0.5;
        if (sh > 0 && sh < 1) { g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(br.x + sh * BW - 2, br.y + 2, 4, BH - 4); }
      }
      if (br.hitT > 0) { g.globalAlpha = br.hitT / 0.12 * 0.8; g.fillStyle = '#fff'; rrect(g, br.x, br.y, BW, BH, 5); g.fill(); g.globalAlpha = 1; }
    }
    for (const bs of bosses) drawBoss(g, bs, t);
    for (const o of bolts) {
      g.save();
      g.shadowColor = o.kind === 'bomb' ? '#ffb800' : '#ff3d6a';
      g.shadowBlur = 12;
      if (o.kind === 'bomb') {
        g.fillStyle = '#26172e'; g.beginPath(); g.arc(o.x, o.y, 7, 0, 7); g.fill();
        g.fillStyle = Math.floor(A.time * 10) % 2 ? '#ff3d3d' : '#ffe14d'; g.beginPath(); g.arc(o.x, o.y - 8, 2.5, 0, 7); g.fill();
      } else {
        g.strokeStyle = '#ff5c8a'; g.lineWidth = 4; g.lineCap = 'round';
        g.beginPath(); g.moveTo(o.x, o.y); g.lineTo(o.x - o.vx * 0.05, o.y - o.vy * 0.05); g.stroke();
        g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke();
      }
      g.restore();
    }
    for (const c of caps) drawCap(g, c);
    g.save();
    g.shadowColor = '#ff6a2b';
    g.shadowBlur = 10;
    g.strokeStyle = '#ffb36b';
    g.lineWidth = 3;
    g.lineCap = 'round';
    g.beginPath();
    for (const l of lasers) { g.moveTo(l.x, l.y); g.lineTo(l.x, l.y + 14); }
    g.stroke();
    g.restore();
    if (T && T.shield > 0) {
      g.save();
      g.globalAlpha = 0.55 + Math.sin(A.time * 6) * 0.2 * (T.shield < 3 ? 2 : 1);
      g.shadowColor = '#3dd6ff'; g.shadowBlur = 14;
      g.fillStyle = '#3dd6ff';
      g.fillRect(4, PY + PH + 14, W - 8, 3);
      g.restore();
    }
    const pw = paddle.w, px = paddle.x - pw / 2;
    g.save();
    if (paddle.stun > 0 && Math.floor(A.time * 20) % 2) g.globalAlpha = 0.45;
    const [pc1, pc2] = T && T.catch > 0 ? ['#e2a6ff', '#9b3dff'] : t.paddle;
    g.shadowColor = pc1;
    g.shadowBlur = 16 * Math.max(0.35, t.glow);
    const pg = g.createLinearGradient(0, PY, 0, PY + PH);
    pg.addColorStop(0, pc1);
    pg.addColorStop(1, pc2);
    g.fillStyle = pg;
    rrect(g, px, PY, pw, PH, 7);
    g.fill();
    g.shadowBlur = 0;
    g.fillStyle = 'rgba(255,255,255,.55)';
    rrect(g, px + 8, PY + 2.5, pw - 16, 3, 1.5);
    g.fill();
    g.fillStyle = rgba('#000000', 0.25);
    g.fillRect(px + 12, PY + PH - 4, 3, 2);
    g.fillRect(px + pw - 15, PY + PH - 4, 3, 2);
    if (T && T.laser > 0) {
      g.fillStyle = '#ff6a2b';
      for (const x of [px + 6, px + pw - 6]) { rrect(g, x - 3, PY - 7, 6, 10, 2); g.fill(); }
    }
    g.restore();
    const r = balls ? ballR() : 7;
    const ballCol = T && T.fire > 0 ? '#ffb33d' : T && T.mega > 0 ? '#ffd23d' : t.ball;
    for (const b of balls || []) {
      for (let i = 0; i < b.trail.length; i += 2) {
        g.globalAlpha = (i / b.trail.length) * 0.35;
        g.fillStyle = T && T.fire > 0 ? '#ff5a1f' : ballCol;
        g.beginPath();
        g.arc(b.trail[i], b.trail[i + 1], r * (0.3 + 0.7 * i / b.trail.length), 0, 7);
        g.fill();
      }
      g.globalAlpha = 1;
      g.save();
      g.shadowColor = ballCol;
      g.shadowBlur = 14 * Math.max(0.4, t.glow);
      const bg2 = g.createRadialGradient(b.x - r * 0.35, b.y - r * 0.35, 1, b.x, b.y, r);
      bg2.addColorStop(0, '#ffffff');
      bg2.addColorStop(1, ballCol);
      g.fillStyle = t.glow < 0.5 && !(T && (T.fire > 0 || T.mega > 0)) ? ballCol : bg2;
      g.beginPath();
      g.arc(b.x, b.y, r, 0, 7);
      g.fill();
      g.restore();
      g.fillStyle = 'rgba(255,255,255,.7)';
      g.beginPath();
      g.arc(b.x - r * 0.3, b.y - r * 0.3, r * 0.3, 0, 7);
      g.fill();
    }
    if (demo && A.state === 'menu') {
      g.save();
      g.shadowColor = t.ball; g.shadowBlur = 14 * t.glow;
      g.fillStyle = t.ball;
      g.beginPath(); g.arc(demo.x, demo.y, 7, 0, 7); g.fill();
      g.restore();
    }
    A.fx.draw(g);
    A.drawPops(g);
    g.restore();
    A.drawFlash(g);
    if (bosses && bosses.length && A.state !== 'menu') {
      const tot = bosses.reduce((s, b) => s + Math.max(0, b.hp), 0), max = bosses.reduce((s, b) => s + b.max, 0);
      g.fillStyle = 'rgba(0,0,0,.35)';
      rrect(g, 60, 14, W - 120, 12, 6);
      g.fill();
      const hg = g.createLinearGradient(60, 0, W - 60, 0);
      hg.addColorStop(0, '#ff3d7f');
      hg.addColorStop(1, '#ffe14d');
      g.fillStyle = hg;
      rrect(g, 61, 15, (W - 122) * tot / max, 10, 5);
      g.fill();
      g.font = `900 11px ${FONT}`;
      g.fillStyle = t.text;
      g.textAlign = 'center';
      g.fillText(bosses[0].def.name.toUpperCase(), W / 2, 42);
    }
    if (T) {
      let px2 = 8;
      g.font = `800 11px ${FONT}`;
      g.textAlign = 'left';
      g.textBaseline = 'middle';
      for (const k of ['wide', 'shrink', 'slow', 'fast', 'laser', 'catch', 'mega', 'fire', 'shield']) {
        if (T[k] <= 0) continue;
        const P = POWERS[k], label = `${P.name.replace('!', '')} ${Math.ceil(T[k])}`;
        const tw = g.measureText(label).width + 14;
        if (px2 + tw > W - 4) break;
        g.fillStyle = P.color;
        g.globalAlpha = T[k] < 2 && Math.floor(A.time * 8) % 2 ? 0.4 : 1;
        rrect(g, px2, H - 24, tw, 17, 8.5);
        g.fill();
        g.fillStyle = '#fff';
        g.fillText(label, px2 + 7, H - 15);
        g.globalAlpha = 1;
        px2 += tw + 5;
      }
      g.textBaseline = 'alphabetic';
    }
    g.textAlign = 'center';
    if (A.state === 'play' && balls && balls.some((b) => b.stuck && !b.catchT) && !clearT && !loseT) {
      g.fillStyle = rgba(t.text, 0.8);
      g.font = `800 15px ${FONT}`;
      g.fillText('click, tap or press space to launch', W / 2, PY - 46 + Math.sin(A.time * 4) * 3);
    }
    if (A.state === 'play' && combo >= 3) {
      g.font = `900 13px ${FONT}`;
      g.fillStyle = '#ff5cd6';
      g.textAlign = 'right';
      g.fillText(`COMBO ${combo}  x${Math.min(5, 1 + Math.floor(combo / 4) * 0.5)}`, W - 10, H - 30);
      g.textAlign = 'center';
    }
    if (banner && A.state !== 'menu') {
      const a = Math.min(1, banner.t * 5, (banner.dur - banner.t) * 3);
      const s = banner.t < 0.25 ? 0.6 + banner.t / 0.25 * 0.4 : 1;
      g.save();
      g.globalAlpha = Math.max(0, a);
      g.translate(W / 2, 440);
      g.scale(s, s);
      g.font = `900 36px ${FONT}`;
      g.lineWidth = 7;
      g.lineJoin = 'round';
      g.strokeStyle = 'rgba(0,0,0,.55)';
      g.fillStyle = '#ffffff';
      g.strokeText(banner.text, 0, 0);
      g.fillText(banner.text, 0, 0);
      if (banner.sub) {
        g.font = `800 18px ${FONT}`;
        g.strokeText(banner.sub, 0, 30);
        g.fillStyle = t.sub;
        g.fillText(banner.sub, 0, 30);
      }
      g.restore();
    }
    if (warpT > 0) {
      g.save();
      g.globalAlpha = 1 - warpT / 0.9;
      const rg = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, H);
      rg.addColorStop(0, '#ffffff'); rg.addColorStop(1, '#9cff3d');
      g.fillStyle = rg;
      g.fillRect(0, 0, W, H);
      g.restore();
    }
  }
  A.debug = () => ({
    level: levelNo(), lives, balls: balls.length, bricks: bricks.length, bosses: bosses.length, state: A.state,
    autopilot(on) { auto = on; },
    clearLevel() { for (const b of bricks) if (b.type !== 'S') b.dead = true; for (const bs of bosses) bs.hp = 1; },
    killBoss() { for (const bs of bosses) hitBoss(bs, 999); },
    loseAll() { lives = 1; balls = []; },
    power(k) { applyPower(k); },
    goto(n) { levelIdx = n - 1; loadLevel(); hud(); }
  });
  menuPreview();
  A.boot();
})();
