'use strict';
(() => {
  const DATA = window.AS_DATA, SKINS = DATA.skins, UPS = DATA.upgrades, RT = DATA.rockTypes, BOSS = DATA.bosses;
  const SIZES = { 3: { r: 44, pts: 20 }, 2: { r: 24, pts: 50 }, 1: { r: 12, pts: 100 } };
  const DIFF = {
    easy: { lives: 5, rock: 0.8, aim: 0.8, label: 'Cadet' },
    normal: { lives: 3, rock: 1, aim: 0.45, label: 'Pilot' },
    hard: { lives: 2, rock: 1.25, aim: 0.2, label: 'Ace' }
  };
  const ACH = [
    { id: 'first', icon: '🪨', name: 'Rock breaker', desc: 'Destroy your first asteroid.' },
    { id: 'wave5', icon: '5️⃣', name: 'Frequent flyer', desc: 'Reach wave 5 in Classic or Daily.' },
    { id: 'wave10', icon: '🔟', name: 'Belt veteran', desc: 'Reach wave 10.' },
    { id: 'wave15', icon: '🌌', name: 'Deep space', desc: 'Reach wave 15.' },
    { id: 'mother', icon: '🛸', name: 'Mothership down', desc: 'Defeat the Mothership.' },
    { id: 'titan', icon: '🗿', name: 'Titan toppler', desc: 'Defeat the Rock Titan.' },
    { id: 'queen', icon: '👑', name: 'Regicide', desc: 'Defeat the Hive Queen.' },
    { id: 'ufo10', icon: '👽', name: 'Saucer hunter', desc: 'Shoot down 10 UFOs (all time).' },
    { id: 'clean', icon: '✨', name: 'Untouchable', desc: 'Clear a wave of 6+ rocks without getting hit.' },
    { id: 'maxed', icon: '🔧', name: 'Fully loaded', desc: 'Max out any ship upgrade.' },
    { id: 'spender', icon: '🛒', name: 'Big spender', desc: 'Spend 1,000 crystals in the shop (all time).' },
    { id: 'rich', icon: '💎', name: 'Crystal hoarder', desc: 'Collect 500 crystals (all time).' },
    { id: 'bomb10', icon: '✹', name: 'Clean sweep', desc: 'Destroy 10 things with one smart bomb.' },
    { id: 'hyper', icon: '🌀', name: 'Blink pilot', desc: 'Use hyperspace 25 times (all time).' },
    { id: 'combo8', icon: '⚡', name: 'Chain gunner', desc: 'Reach an x8 kill chain.' },
    { id: 'blitz', icon: '⏱️', name: 'Blitzed', desc: 'Score 20,000 in a Blitz run.' },
    { id: 'daily', icon: '📅', name: 'Daily pilot', desc: 'Fly a Daily run.' },
    { id: 'score50k', icon: '💰', name: 'Fifty grand', desc: 'Score 50,000 in one run.' },
    { id: 'score150k', icon: '🏆', name: 'Galactic legend', desc: 'Score 150,000 in one run.' },
    { id: 'chainboom', icon: '💥', name: 'Volatile situation', desc: 'Set off 3 red rocks in one chain.' }
  ];
  let mode, diff, D, R, ship, bullets, rocks, ufo, ufoT, wave, lives, nextLife, waveT, beatT, beatHi, cool, thrustSnd, debris, respawnT, overT;
  let crystals, gems, caps, hunters, boss, ups, bombs, combo, comboT, hitThisWave, rocksThisWave, blitzT, banner, cam, hyperCool, overdrive, statShots, statHits, bossIntro;
  let stars = [], nebula = null, nebKey = '';
  const A = Arcade({
    width: 800, height: 600, reset, update, draw, key, idle, achievements: ACH, tip: 'Tip for laptops: it is all keyboard. Arrows to fly, Space to fire, H hyperspace, B bomb.', capture: ['h', 'b', 'Shift'],
    size: (w, h) => ({ w: Math.round(Math.max(460, Math.min(1000, 600 * w / h))), h: 600 }),
    defaults: { mode: 'classic', diff: 'normal', skin: 'arrow', auto: false },
    statsList: [
      ['runs', 'Runs'], ['rocks', 'Rocks smashed'], ['ufos', 'UFOs downed'], ['bosses', 'Bosses beaten'],
      ['crystals', 'Crystals found'], ['wave', 'Best wave'], [(s) => s.shots ? Math.round(100 * (s.hits || 0) / s.shots) : 0, 'Accuracy', (v) => v + '%'], ['deaths', 'Ships lost']
    ],
    modeName: () => `${{ classic: 'Classic', blitz: 'Blitz', daily: 'Daily' }[A.opts.mode]} · ${DIFF[A.opts.diff]?.label || ''}`,
    histText: () => (mode === 'blitz' ? `${Curio.fmt(A.score)}` : `${Curio.fmt(A.score)} · W${wave}`),
    optsChanged, lockedOpt, action, holdKey, resized: () => { nebKey = ''; }, unlocked: () => paintSkins()
  });
  function optsChanged(o) {
    const d = document.querySelector('[data-desc="mode"]');
    if (d) d.textContent = { classic: 'Endless waves, a shop between them, a boss every fifth wave.', blitz: 'Three minutes. Unlimited ships. Score as much as you can.', daily: 'Today\'s seeded asteroid field. Same rocks for everyone.' }[o.mode] || '';
    paintSkins();
  }
  function paintSkins() {
    document.querySelectorAll('[data-opt="skin"]').forEach((b) => {
      const s = SKINS[b.dataset.val];
      b.classList.toggle('is-locked', !!(s.need && !A.has(s.need.ach)));
      b.style.setProperty('--skin', s.glow);
    });
    if (SKINS[A.opts.skin]?.need && !A.has(SKINS[A.opts.skin].need.ach)) A.opts.skin = 'arrow';
  }
  function lockedOpt(k, v) { if (k === 'skin') { Curio.toast(SKINS[v].need.text); Curio.beep(200, 0.08, 'square', 0.05); } }

  function makeStars() {
    stars = [];
    for (let l = 0; l < 3; l++) for (let i = 0; i < 70; i++) stars.push({ x: Math.random(), y: Math.random(), l, r: [0.7, 1.1, 1.7][l], a: Math.random() * 0.6 + 0.3, tw: Math.random() * 6 });
  }
  makeStars();
  function nebulaSprite() {
    const s = Math.max(1, A.canvas.width / A.W), key = `${A.W}|${s}`;
    if (nebula && nebKey === key) return nebula;
    nebKey = key;
    nebula = document.createElement('canvas');
    nebula.width = Math.ceil(A.W * s);
    nebula.height = Math.ceil(A.H * s);
    const g = nebula.getContext('2d');
    g.scale(s, s);
    const bg = g.createLinearGradient(0, 0, A.W, A.H);
    bg.addColorStop(0, '#070818');
    bg.addColorStop(0.5, '#05050f');
    bg.addColorStop(1, '#0c0618');
    g.fillStyle = bg;
    g.fillRect(0, 0, A.W, A.H);
    const rnd = A.rng(7);
    const cols = ['#6b3dff', '#ff3d9a', '#2ad0ff', '#3dffb0', '#ff8a3d'];
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 14; i++) {
      const x = rnd() * A.W, y = rnd() * A.H, r = 80 + rnd() * 220;
      const rg = g.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, rgba(cols[i % cols.length], 0.07 + rnd() * 0.05));
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = rg;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    g.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(200,210,255,${rnd() * 0.25})`; g.fillRect(rnd() * A.W, rnd() * A.H, 1, 1); }
    return nebula;
  }

  const rnd = () => R();
  function reset() {
    mode = A.opts.mode;
    diff = DIFF[A.opts.diff] ? A.opts.diff : 'normal';
    D = DIFF[diff];
    A.bestKey = `score-${mode}-${diff}`;
    R = mode === 'daily' ? A.rng(A.seedOf('as-' + A.today())) : A.rng((Math.random() * 1e9) | 0);
    ups = { rapid: 0, spread: 0, range: 0, engine: 0, shield: 0, magnet: 0, pierce: 0 };
    if (mode === 'blitz') Object.assign(ups, { rapid: 2, spread: 1, range: 1, engine: 1, magnet: 2 });
    ship = newShip();
    ship.inv = 2;
    bullets = []; rocks = []; debris = []; gems = []; caps = []; hunters = [];
    ufo = null; boss = null; bossIntro = 0;
    wave = 0; lives = mode === 'blitz' ? 99 : D.lives; nextLife = 10000;
    waveT = 0; beatT = 1; beatHi = false; cool = 0; thrustSnd = 0; respawnT = 0; overT = 0;
    ufoT = 18; crystals = 0; bombs = mode === 'blitz' ? 2 : 1; combo = 0; comboT = 0; blitzT = 180;
    cam = { x: 0, y: 0 }; hyperCool = 0; overdrive = 0; statShots = 0; statHits = 0; banner = null;
    nextWave();
    hud();
  }
  function hud() {
    A.hud('lives', mode === 'blitz' ? '∞' : lives > 0 ? '▲'.repeat(Math.min(lives, 5)) + (lives > 5 ? '+' : '') : '0');
    A.hud('wave', mode === 'blitz' ? `${Math.max(0, Math.ceil(blitzT))}s` : wave);
    A.hud('gems', `◆${crystals}`);
    A.hud('bombs', bombs);
  }
  const stat = () => ({
    cool: [0.24, 0.19, 0.15, 0.12, 0.09][ups.rapid] * (overdrive > 0 ? 0.55 : 1),
    shots: overdrive > 0 ? Math.max(3, [1, 2, 3, 5][ups.spread]) : [1, 2, 3, 5][ups.spread],
    life: 0.9 * (1 + 0.25 * ups.range), speed: 540 * (1 + 0.12 * ups.range),
    thrust: 330 * (1 + 0.22 * ups.engine), turn: 4.4 * (1 + 0.1 * ups.engine), maxv: 400 * (1 + 0.12 * ups.engine),
    magnet: 34 + 55 * ups.magnet, pierce: ups.pierce
  });
  function newShip() { return { x: A.W / 2, y: A.H / 2, vx: 0, vy: 0, a: -Math.PI / 2, alive: true, inv: 2.5, thrusting: false, shield: ups ? ups.shield : 0, shT: 0 }; }
  function rockType() {
    const r = rnd();
    const w = Math.min(1, wave / 12);
    if (r < 0.03 + w * 0.03) return 'gold';
    if (r < 0.1 + w * 0.12) return 'metal';
    if (r < 0.16 + w * 0.2) return 'volatile';
    if (r < 0.26 + w * 0.22) return 'ice';
    return 'stone';
  }
  function makeRock(x, y, size, speedMul = 1, type = 'stone') {
    const n = 9 + ((rnd() * 5) | 0);
    const shape = Array.from({ length: n }, () => 0.7 + rnd() * 0.38);
    const r = SIZES[size].r;
    const path = new Path2D();
    shape.forEach((m, i) => { const a = i / n * Math.PI * 2; path.lineTo(Math.cos(a) * r * m, Math.sin(a) * r * m); });
    path.closePath();
    const craters = Array.from({ length: size }, () => ({ a: rnd() * 7, d: rnd() * r * 0.5, r: r * (0.1 + rnd() * 0.12) }));
    const a = rnd() * Math.PI * 2, s = (30 + rnd() * 45) * speedMul * D.rock * (1 + (3 - size) * 0.35);
    const T = RT[type];
    return { x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, size, r, rot: rnd() * 7, vr: (rnd() - 0.5) * 1.6, path, craters, type, hp: T.hp + (type === 'metal' ? size - 1 : 0), hitT: 0 };
  }
  function spawnEdgeRock(size) {
    let x, y;
    do { x = rnd() * A.W; y = rnd() * A.H; } while (Math.hypot(x - ship.x, y - ship.y) < 200);
    rocks.push(makeRock(x, y, size, 1 + wave * 0.05, rockType()));
  }
  function nextWave() {
    wave++;
    hitThisWave = false;
    rocksThisWave = 0;
    ship.shield = ups.shield;
    if (mode === 'blitz') {
      for (let i = 0; i < 6; i++) spawnEdgeRock(3);
      banner = { text: 'BLITZ', sub: '180 seconds on the clock', t: 0, dur: 2 };
      hud();
      return;
    }
    const bossWave = wave % 5 === 0;
    if (bossWave) {
      const kind = ['mother', 'titan', 'queen'][((wave / 5) - 1) % 3];
      spawnBoss(kind);
      for (let i = 0; i < 2; i++) spawnEdgeRock(2);
      banner = { text: 'WARNING', sub: BOSS[kind].name + ' approaching', t: 0, dur: 2.6, warn: true };
      bossIntro = 2.2;
      A.sweep(110, 60, 1.2, 'sawtooth', 0.09);
    } else {
      const n = Math.min(3 + wave, 12);
      for (let i = 0; i < n; i++) spawnEdgeRock(3);
      banner = { text: `WAVE ${wave}`, sub: wave === 1 ? 'Shoot the rocks. Don\'t be a rock.' : DATA.facts[wave % DATA.facts.length], t: 0, dur: 2.6 };
      A.chord([392, 523, 659], 0.07, 'triangle', 0.07);
    }
    if (wave >= 5) A.unlock('wave5');
    if (wave >= 10) A.unlock('wave10');
    if (wave >= 15) A.unlock('wave15');
    A.statMax('wave', wave);
    hud();
  }
  function spawnBoss(kind) {
    const def = BOSS[kind];
    const cycle = Math.floor((wave - 1) / 15);
    const hp = Math.round(def.hp * (1 + cycle * 0.5) * { easy: 0.75, normal: 1, hard: 1.25 }[diff]);
    boss = { kind, def, x: kind === 'mother' ? -80 : A.W / 2, y: kind === 'mother' ? 120 : -120, vx: 60, vy: 0, r: def.r, hp, max: hp, t: 0, fireT: 2, spawnT: 5, rot: 0, hitT: 0, dying: 0, chip: 0, ang: 0 };
    if (kind === 'titan') { boss.y = A.H / 2; boss.x = -100; boss.vx = 30; boss.vy = 12; }
    if (kind === 'queen') { boss.y = 90; }
  }
  function wrap(o) {
    if (o.x < 0) o.x += A.W; else if (o.x >= A.W) o.x -= A.W;
    if (o.y < 0) o.y += A.H; else if (o.y >= A.H) o.y -= A.H;
  }
  function dist2(a, b) {
    let dx = Math.abs(a.x - b.x), dy = Math.abs(a.y - b.y);
    if (dx > A.W / 2) dx = A.W - dx;
    if (dy > A.H / 2) dy = A.H - dy;
    return dx * dx + dy * dy;
  }
  function fire() {
    if (!ship.alive) return;
    const S = stat();
    const n = S.shots, spread = n > 1 ? 0.11 : 0;
    for (let i = 0; i < n; i++) {
      const a = ship.a + (i - (n - 1) / 2) * spread;
      const c = Math.cos(a), s = Math.sin(a);
      bullets.push({ x: ship.x + c * 15, y: ship.y + s * 15, vx: c * S.speed + ship.vx, vy: s * S.speed + ship.vy, life: S.life, enemy: false, pierce: S.pierce, hit: new Set() });
    }
    statShots++;
    A.sweep(1500, 420, 0.08, 'square', 0.04);
  }
  function key(k, down) {
    if (!down) return;
    if (k === ' ' && cool <= 0.08) { fire(); cool = stat().cool; }
    if (k === 'h' || k === 'Shift') hyperspace();
    if (k === 'b') smartBomb();
  }
  function hyperspace() {
    if (!ship.alive || hyperCool > 0) return;
    hyperCool = 2.5;
    A.fx.burst(ship.x, ship.y, 18, ['#c49bff', '#fff'], { speed: 200, life: 0.5, size: 2, gravity: 0, glow: true, shape: 'dot' });
    A.fx.ring(ship.x, ship.y, 40, '#c49bff');
    let x, y, tries = 0;
    do { x = 40 + Math.random() * (A.W - 80); y = 40 + Math.random() * (A.H - 80); tries++; } while (tries < 12 && rocks.some((r) => dist2(r, { x, y }) < (r.r + 50) ** 2));
    ship.x = x; ship.y = y; ship.vx *= 0.2; ship.vy *= 0.2; ship.inv = Math.max(ship.inv, 0.6);
    A.fx.ring(x, y, 40, '#c49bff');
    A.sweep(300, 1800, 0.25, 'sine', 0.08);
    if (A.stat('hyper') >= 25) A.unlock('hyper');
  }
  function smartBomb() {
    if (!ship.alive || bombs <= 0) return;
    bombs--;
    hud();
    let kills = 0;
    A.fx.ring(ship.x, ship.y, 700, '#ffffff', 0.8, 10);
    A.fx.ring(ship.x, ship.y, 400, '#7fb8ff', 0.6, 6);
    A.flash('#bfe0ff', 0.35);
    A.shake(0.9);
    A.buzz([30, 30, 90]);
    A.noise(0.9, 0.25, 700);
    bullets = bullets.filter((b) => !b.enemy);
    for (let j = rocks.length - 1; j >= 0; j--) { const r = rocks[j]; if (r.size <= 2 || r.hp <= 3) { breakRock(j, true, 99); kills++; } }
    for (let j = hunters.length - 1; j >= 0; j--) { killHunter(j); kills++; }
    if (ufo) { killUfo(true); kills++; }
    if (boss && !boss.dying) hurtBoss(8);
    if (kills >= 10) A.unlock('bomb10');
  }
  function explode(x, y, n, col, big) {
    A.fx.burst(x, y, n, col, { speed: big ? 190 : 130, life: big ? 1.1 : 0.7, size: 2.2, gravity: 0, drag: 1, glow: true, shape: 'dot' });
    A.fx.burst(x, y, Math.ceil(n / 2), col, { speed: big ? 260 : 170, life: 0.4, size: 2, gravity: 0, drag: 2, glow: true, shape: 'spark' });
    if (big) A.fx.ring(x, y, 50, col[0], 0.45, 3);
    A.noise(big ? 0.55 : 0.28, big ? 0.22 : 0.13, big ? 900 : 1600);
  }
  function dropGems(x, y, n) { for (let i = 0; i < n; i++) gems.push({ x, y, vx: (Math.random() - 0.5) * 120, vy: (Math.random() - 0.5) * 120, life: 9, rot: Math.random() * 7 }); }
  function chain() {
    combo = comboT > 0 ? combo + 1 : 1;
    comboT = 1.6;
    const m = Math.min(8, 1 + Math.floor(combo / 3));
    if (m >= 8) A.unlock('combo8');
    return m;
  }
  let volChain = 0;
  function breakRock(i, byPlayer, dmg = 1) {
    const r = rocks[i];
    if (!r) return;
    r.hp -= dmg;
    r.hitT = 0.1;
    if (r.hp > 0) { A.beep(900, 0.04, 'square', 0.04); A.fx.burst(r.x, r.y, 4, [RT[r.type].stroke], { speed: 120, life: 0.3, size: 2, gravity: 0, glow: true, shape: 'spark' }); return; }
    rocks.splice(i, 1);
    const T = RT[r.type];
    if (byPlayer) {
      const m = chain();
      const pts = Math.round(SIZES[r.size].pts * T.mult * m);
      addPoints(pts);
      A.pop(m > 1 ? `${pts} x${m}` : pts, r.x, r.y, { color: m > 1 ? '#ffe066' : '#dfe8ff', size: m > 1 ? 16 : 13, life: 0.7 });
      A.stat('rocks');
      A.unlock('first');
      rocksThisWave++;
    }
    dropGems(r.x, r.y, r.type === 'gold' ? T.crystals : Math.random() < 0.55 ? T.crystals : 0);
    if (Math.random() < 0.035 && caps.length < 2) caps.push({ x: r.x, y: r.y, vx: (Math.random() - 0.5) * 40, vy: (Math.random() - 0.5) * 40, kind: Curio.pick(['shield', 'bomb', 'overdrive', 'overdrive']), life: 12 });
    explode(r.x, r.y, r.size * 8, [T.stroke, '#ffffff', shade(T.stroke, -0.3)], r.size === 3);
    A.shake(r.size * 0.12);
    if (r.size > 1) for (let k = 0; k < 2; k++) rocks.push(makeRock(r.x, r.y, r.size - 1, 1 + wave * 0.05, r.type === 'volatile' ? 'stone' : r.type === 'gold' ? 'stone' : r.type));
    if (r.type === 'volatile') {
      volChain++;
      if (volChain >= 3) A.unlock('chainboom');
      A.fx.ring(r.x, r.y, 90, '#ff5c5c', 0.5, 8);
      A.flash('#ff6a4a', 0.12);
      A.shake(0.5);
      const blast = { x: r.x, y: r.y };
      setTimeout(() => {
        if (A.state !== 'play' && A.state !== 'paused') return;
        for (let j = rocks.length - 1; j >= 0; j--) if (dist2(rocks[j], blast) < (90 + rocks[j].r * 0.5) ** 2) breakRock(j, byPlayer, 2);
        for (let j = hunters.length - 1; j >= 0; j--) if (dist2(hunters[j], blast) < 90 * 90) killHunter(j);
        if (ship.alive && dist2(ship, blast) < 70 * 70) hurtShip();
        setTimeout(() => { volChain = Math.max(0, volChain - 1); }, 400);
      }, 90);
    }
  }
  function addPoints(p) {
    A.addScore(p);
    if (A.score >= 50000) A.unlock('score50k');
    if (A.score >= 150000) A.unlock('score150k');
    if (mode !== 'blitz' && A.score >= nextLife) {
      nextLife += 10000;
      lives++;
      hud();
      A.chord([880, 1175, 1568], 0.08, 'square', 0.06);
      A.pop('EXTRA SHIP', ship.x, ship.y - 30, { color: '#7dffb0', size: 18 });
    }
  }
  function hurtShip() {
    if (!ship.alive || ship.inv > 0) return;
    hitThisWave = true;
    if (ship.shield > 0) {
      ship.shield--;
      ship.inv = 1.2;
      ship.shT = 0.5;
      A.fx.ring(ship.x, ship.y, 36, '#5ef2ff', 0.5, 5);
      A.sweep(1200, 300, 0.3, 'triangle', 0.08);
      A.shake(0.35);
      A.buzz(40);
      return;
    }
    killShip();
  }
  function killShip() {
    ship.alive = false;
    combo = 0;
    A.stat('deaths');
    const sk = SKINS[A.opts.skin] || SKINS.arrow;
    explode(ship.x, ship.y, 30, [sk.color, '#ffd166', '#ff6b6b'], true);
    A.shake(1);
    A.flash('#ff4060', 0.25);
    A.buzz([80, 40, 160]);
    for (let i = 0; i < 6; i++) {
      const a = Math.random() * 7, s = 30 + Math.random() * 80;
      debris.push({ x: ship.x, y: ship.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, a: Math.random() * 7, va: (Math.random() - 0.5) * 6, len: 8 + Math.random() * 9, life: 1.8, c: sk.color });
    }
    A.sweep(300, 40, 0.9, 'sawtooth', 0.09);
    if (mode === 'blitz') { respawnT = 1.6; A.addScore(-Math.min(A.score, 1000)); A.pop('-1000', ship.x, ship.y, { color: '#ff6b6b', size: 20 }); return; }
    lives--;
    hud();
    if (lives <= 0) overT = 2.2; else respawnT = 2;
  }
  function spawnUfo() {
    const small = wave >= 3 && rnd() < 0.35 + wave * 0.04;
    const fromLeft = rnd() < 0.5;
    ufo = { x: fromLeft ? -20 : A.W + 20, y: 60 + rnd() * (A.H - 120), vx: (fromLeft ? 1 : -1) * (small ? 125 : 90), vy: 0, small, r: small ? 11 : 18, shootT: 1, turnT: 1.2, warble: 0, hp: small ? 1 : 2 };
  }
  function updateUfo(dt) {
    if (!ufo) { ufoT -= dt; if (ufoT <= 0 && (rocks.length || mode === 'blitz') && !boss) spawnUfo(); return; }
    ufo.x += ufo.vx * dt;
    ufo.y += ufo.vy * dt;
    if (ufo.y < 0) ufo.y += A.H;
    if (ufo.y >= A.H) ufo.y -= A.H;
    ufo.turnT -= dt;
    if (ufo.turnT <= 0) { ufo.turnT = 1 + Math.random(); ufo.vy = Curio.pick([-70, 0, 70]); }
    ufo.warble -= dt;
    if (ufo.warble <= 0) { ufo.warble = 0.14; A.beep(ufo.small ? (A.time * 10 % 2 < 1 ? 980 : 1180) : (A.time * 8 % 2 < 1 ? 520 : 640), 0.1, 'sine', 0.02); }
    ufo.shootT -= dt;
    if (ufo.shootT <= 0) {
      ufo.shootT = ufo.small ? 0.9 : 1.3;
      let a = Math.random() * Math.PI * 2;
      if (ufo.small && ship.alive) a = Math.atan2(ship.y - ufo.y, ship.x - ufo.x) + (Math.random() - 0.5) * Math.max(0.1, D.aim - wave * 0.02);
      enemyShot(ufo.x, ufo.y, a, 300);
    }
    if (ufo.x < -40 || ufo.x > A.W + 40) { ufo = null; ufoT = Math.max(6, 18 - wave) + Math.random() * 8; }
  }
  function enemyShot(x, y, a, sp, col = '#ff6b8a') {
    bullets.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1.8, enemy: true, col });
    A.beep(300, 0.05, 'square', 0.03);
  }
  function killUfo(byPlayer) {
    if (byPlayer) {
      const m = chain();
      const pts = (ufo.small ? 1000 : 200) * m;
      addPoints(pts);
      A.pop(pts, ufo.x, ufo.y, { color: '#7dffb0', size: 18 });
      if (A.stat('ufos') >= 10) A.unlock('ufo10');
    }
    dropGems(ufo.x, ufo.y, ufo.small ? 8 : 5);
    explode(ufo.x, ufo.y, 24, ['#b8f7c9', '#6ee7a8', '#ffffff'], true);
    A.shake(0.4);
    ufo = null;
    ufoT = Math.max(6, 18 - wave) + Math.random() * 8;
  }
  function killHunter(j) {
    const h = hunters[j];
    hunters.splice(j, 1);
    const m = chain();
    addPoints(150 * m);
    dropGems(h.x, h.y, 1);
    explode(h.x, h.y, 12, ['#ff9a3d', '#ffe066', '#fff'], false);
  }
  function hurtBoss(dmg) {
    if (!boss || boss.dying || bossIntro > 0) return;
    boss.hp -= dmg;
    boss.hitT = 0.1;
    A.addScore(20 * dmg);
    A.beep(140 + boss.hp / boss.max * 300, 0.05, 'square', 0.05);
    if (boss.kind === 'titan' && ++boss.chip % 5 === 0) {
      const a = Math.random() * 7;
      const r = makeRock(boss.x + Math.cos(a) * boss.r, boss.y + Math.sin(a) * boss.r, 1, 1.4, 'stone');
      rocks.push(r);
    }
    if (boss.hp <= 0) {
      boss.dying = 2;
      addPoints(boss.def.pts);
      A.pop(`+${Curio.fmt(boss.def.pts)}`, boss.x, boss.y, { color: '#ffe066', size: 30, life: 1.8, vy: -30 });
      dropGems(boss.x, boss.y, 40);
      A.stat('bosses');
      A.unlock(boss.kind);
      A.shake(1.2);
      A.flash('#ffffff', 0.4);
      A.buzz([100, 50, 200]);
      A.noise(1.6, 0.3, 700);
      bullets = bullets.filter((b) => !b.enemy);
    }
  }
  function updateBoss(dt) {
    const b = boss;
    b.t += dt;
    b.hitT = Math.max(0, b.hitT - dt);
    if (b.dying) {
      b.dying -= dt;
      if (Math.random() < 0.4) explode(b.x + (Math.random() - 0.5) * b.r * 1.6, b.y + (Math.random() - 0.5) * b.r * 1.2, 10, [b.def.color, '#fff', '#ffe066'], Math.random() < 0.2);
      if (b.dying <= 0) { explode(b.x, b.y, 80, [b.def.color, '#fff', '#ffe066'], true); boss = null; }
      return;
    }
    const frac = b.hp / b.max;
    if (b.kind === 'mother') {
      b.x += b.vx * dt;
      b.y = 120 + Math.sin(b.t * 0.5) * 70 + (b.t < 2 ? 0 : 0);
      if (b.x > A.W + 90) b.x = -90;
      b.fireT -= dt;
      if (b.fireT <= 0 && ship.alive) {
        b.fireT = frac < 0.5 ? 1.1 : 1.6;
        for (const ox of [-40, 0, 40]) enemyShot(b.x + ox, b.y + 12, Math.atan2(ship.y - b.y, ship.x - b.x - ox) + (Math.random() - 0.5) * 0.3, 260, '#7dffb0');
      }
      b.spawnT -= dt;
      if (b.spawnT <= 0) { b.spawnT = 6; if (hunters.length < 5) for (let i = 0; i < 2; i++) hunters.push({ x: b.x, y: b.y + 20, vx: (i - 0.5) * 120, vy: 60, a: 0 }); }
    } else if (b.kind === 'titan') {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.rot += dt * 0.25;
      if (b.x > A.W + b.r) b.x = -b.r;
      if (b.y > A.H + b.r) b.y = -b.r;
      if (b.y < -b.r - 10) b.y = A.H + b.r;
      b.fireT -= dt;
      if (b.fireT <= 0) {
        b.fireT = frac < 0.5 ? 2 : 3;
        for (let i = 0; i < 10; i++) enemyShot(b.x, b.y, i / 10 * Math.PI * 2 + b.rot, 170, '#ffb366');
      }
      if (frac < 0.5 && !b.split) { b.split = true; for (let i = 0; i < 3; i++) rocks.push(makeRock(b.x, b.y, 2, 1.5, 'metal')); A.shake(0.6); }
    } else if (b.kind === 'queen') {
      b.x = A.W / 2 + Math.sin(b.t * 0.6) * (A.W / 2 - 80);
      b.y = A.H / 2 + Math.sin(b.t * 0.9) * (A.H / 2 - 90);
      b.ang += dt * 1.4;
      b.fireT -= dt;
      if (b.fireT <= 0) {
        b.fireT = frac < 0.4 ? 1.2 : 1.9;
        const n = frac < 0.4 ? 10 : 7;
        for (let i = 0; i < n; i++) enemyShot(b.x, b.y, b.ang + i / n * Math.PI * 2, 190, '#ff5cc8');
      }
      b.spawnT -= dt;
      if (b.spawnT <= 0) { b.spawnT = 4.5; if (hunters.length < 7) hunters.push({ x: b.x, y: b.y, vx: 0, vy: 0, a: 0 }); }
    }
    if (ship.alive && ship.inv <= 0 && dist2(ship, b) < (b.r * 0.8 + 10) ** 2) hurtShip();
  }
  function update(dt) {
    A.fx.update(dt);
    cool -= dt;
    hyperCool = Math.max(0, hyperCool - dt);
    overdrive = Math.max(0, overdrive - dt);
    comboT = Math.max(0, comboT - dt);
    if (comboT <= 0) combo = 0;
    bossIntro = Math.max(0, bossIntro - dt);
    if (banner) { banner.t += dt; if (banner.t > banner.dur) banner = null; }
    if (mode === 'blitz') {
      const before = Math.ceil(blitzT);
      blitzT -= dt;
      if (Math.ceil(blitzT) !== before) { hud(); if (blitzT < 10) A.beep(880, 0.05, 'square', 0.05); }
      if (blitzT <= 0) { blitzT = 0; finish(); return; }
      if (rocks.length < 5 + Math.floor((180 - blitzT) / 30)) spawnEdgeRock(Math.random() < 0.7 ? 3 : 2);
    }
    for (const d of debris) { d.x += d.vx * dt; d.y += d.vy * dt; d.a += d.va * dt; d.life -= dt; }
    debris = debris.filter((d) => d.life > 0);
    const S = stat();
    if (ship.alive) {
      const L = A.keys.has('ArrowLeft') || A.keys.has('a'), Rr = A.keys.has('ArrowRight') || A.keys.has('d');
      ship.a += (Rr - L) * S.turn * dt;
      ship.thrusting = A.keys.has('ArrowUp') || A.keys.has('w');
      if (ship.thrusting) {
        ship.vx += Math.cos(ship.a) * S.thrust * dt;
        ship.vy += Math.sin(ship.a) * S.thrust * dt;
        thrustSnd -= dt;
        if (thrustSnd <= 0) { thrustSnd = 0.09; A.noise(0.1, 0.045, 500); }
        if (Math.random() < 0.8) A.fx.burst(ship.x - Math.cos(ship.a) * 12, ship.y - Math.sin(ship.a) * 12, 1, ['#ffb347', '#ff6b3d', '#ffe066'], { speed: 110, life: 0.35, size: 2.5, gravity: 0, angle: ship.a + Math.PI, spread: 0.5, glow: true, shape: 'dot' });
      }
      const k = Math.pow(0.55, dt);
      ship.vx *= k; ship.vy *= k;
      const v = Math.hypot(ship.vx, ship.vy);
      if (v > S.maxv) { ship.vx *= S.maxv / v; ship.vy *= S.maxv / v; }
      ship.x += ship.vx * dt;
      ship.y += ship.vy * dt;
      wrap(ship);
      ship.inv = Math.max(0, ship.inv - dt);
      ship.shT = Math.max(0, ship.shT - dt);
      if ((A.keys.has(' ') || A.opts.auto) && cool <= 0) { fire(); cool = S.cool; }
      cam.x += ship.vx * dt; cam.y += ship.vy * dt;
    } else if (respawnT > 0) {
      respawnT -= dt;
      if (respawnT <= 0) {
        const probe = { x: A.W / 2, y: A.H / 2 };
        if (rocks.some((r) => dist2(r, probe) < (r.r + 80) ** 2) || (boss && dist2(boss, probe) < (boss.r + 100) ** 2)) respawnT = 0.2;
        else { ship = newShip(); A.chord([523, 784], 0.06, 'triangle', 0.07); }
      }
    }
    if (overT > 0) { overT -= dt; if (overT <= 0) { finish(); return; } }
    for (const r of rocks) { r.x += r.vx * dt; r.y += r.vy * dt; r.rot += r.vr * dt; r.hitT = Math.max(0, r.hitT - dt); wrap(r); }
    for (let i = gems.length - 1; i >= 0; i--) {
      const gm = gems[i];
      gm.life -= dt;
      gm.rot += dt * 3;
      const k = Math.exp(-1.5 * dt);
      gm.vx *= k; gm.vy *= k;
      if (ship.alive) {
        const d2 = dist2(gm, ship);
        if (d2 < S.magnet * S.magnet) { const d = Math.sqrt(d2) || 1; gm.vx += (ship.x - gm.x) / d * 900 * dt; gm.vy += (ship.y - gm.y) / d * 900 * dt; }
        if (d2 < 18 * 18) {
          gems.splice(i, 1);
          crystals++;
          A.stat('crystals');
          if ((A.stats().crystals || 0) >= 500) A.unlock('rich');
          if (mode === 'blitz') addPoints(25);
          A.beep(1200 + (crystals % 8) * 90, 0.04, 'sine', 0.05);
          hud();
          continue;
        }
      }
      gm.x += gm.vx * dt; gm.y += gm.vy * dt;
      wrap(gm);
      if (gm.life <= 0) gems.splice(i, 1);
    }
    for (let i = caps.length - 1; i >= 0; i--) {
      const c = caps[i];
      c.x += c.vx * dt; c.y += c.vy * dt; c.life -= dt;
      wrap(c);
      if (ship.alive && dist2(c, ship) < 24 * 24) {
        caps.splice(i, 1);
        if (c.kind === 'shield') { ship.shield = Math.min(Math.max(1, ups.shield), ship.shield + 1); A.pop('SHIELD', ship.x, ship.y - 26, { color: '#5ef2ff' }); }
        if (c.kind === 'bomb') { bombs = Math.min(3, bombs + 1); A.pop('+1 BOMB', ship.x, ship.y - 26, { color: '#ffffff' }); }
        if (c.kind === 'overdrive') { overdrive = 8; A.pop('OVERDRIVE', ship.x, ship.y - 26, { color: '#ffe066' }); }
        A.chord([660, 990, 1320], 0.05, 'triangle', 0.07);
        hud();
        continue;
      }
      if (c.life <= 0) caps.splice(i, 1);
    }
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      wrap(b);
      if (b.life <= 0) { bullets.splice(i, 1); continue; }
      let gone = false;
      for (let j = rocks.length - 1; j >= 0; j--) {
        const r = rocks[j];
        if (b.hit && b.hit.has(r)) continue;
        if (dist2(b, r) < r.r * r.r * 0.9) {
          if (!b.enemy) statHits++;
          breakRock(j, !b.enemy);
          if (!b.enemy && b.pierce > 0) { b.pierce--; b.hit.add(r); } else gone = true;
          break;
        }
      }
      if (!gone && !b.enemy) {
        if (ufo && dist2(b, ufo) < (ufo.r + 3) ** 2) { gone = true; statHits++; if (--ufo.hp <= 0) killUfo(true); else { A.beep(800, 0.04, 'square', 0.04); } }
        for (let j = hunters.length - 1; j >= 0 && !gone; j--) if (dist2(b, hunters[j]) < 13 * 13) { killHunter(j); gone = true; statHits++; }
        if (!gone && boss && !boss.dying && dist2(b, boss) < (boss.r + 2) ** 2) {
          gone = true; statHits++;
          hurtBoss(1);
          A.fx.burst(b.x, b.y, 4, [boss.def.color, '#fff'], { speed: 120, life: 0.3, size: 2, gravity: 0, glow: true, shape: 'spark' });
        }
      }
      if (!gone && b.enemy && ship.alive && ship.inv <= 0 && dist2(b, ship) < 12 * 12) { hurtShip(); gone = true; }
      if (gone) bullets.splice(i, 1);
    }
    updateUfo(dt);
    for (let j = hunters.length - 1; j >= 0; j--) {
      const h = hunters[j];
      if (ship.alive) {
        const a = Math.atan2(ship.y - h.y, ship.x - h.x);
        h.vx += Math.cos(a) * 160 * dt; h.vy += Math.sin(a) * 160 * dt;
      }
      const sp = Math.hypot(h.vx, h.vy), mx = 120 + wave * 3;
      if (sp > mx) { h.vx *= mx / sp; h.vy *= mx / sp; }
      h.a = Math.atan2(h.vy, h.vx);
      h.x += h.vx * dt; h.y += h.vy * dt;
      wrap(h);
      if (ship.alive && ship.inv <= 0 && dist2(h, ship) < 18 * 18) { hunters.splice(j, 1); explode(h.x, h.y, 10, ['#ff9a3d', '#fff'], false); hurtShip(); }
    }
    if (boss) updateBoss(dt);
    if (ship.alive && ship.inv <= 0) {
      for (let j = rocks.length - 1; j >= 0; j--) {
        if (dist2(ship, rocks[j]) < (rocks[j].r * 0.82 + 10) ** 2) { const had = ship.shield; breakRock(j, true, 99); hurtShip(); if (had) ship.inv = Math.max(ship.inv, 1); break; }
      }
      if (ship.alive && ship.inv <= 0 && ufo && dist2(ship, ufo) < (ufo.r + 10) ** 2) { killUfo(true); hurtShip(); }
    }
    if (ufo) for (let j = rocks.length - 1; j >= 0; j--) if (dist2(ufo, rocks[j]) < (rocks[j].r + ufo.r) ** 2) { breakRock(j, false, 99); killUfo(false); break; }
    if (mode !== 'blitz' && !rocks.length && !boss && !hunters.length && overT <= 0) {
      waveT += dt;
      if (waveT > 1.6) {
        waveT = 0;
        if (!hitThisWave && rocksThisWave >= 6) A.unlock('clean');
        const bonus = 100 * wave;
        addPoints(bonus);
        A.chord([523, 659, 784, 1047], 0.08, 'triangle', 0.09);
        if (ship.alive) openShop(); else nextWave();
        return;
      }
    }
    beatT -= dt;
    if (beatT <= 0 && rocks.length && ship.alive) {
      beatT = Math.max(0.28, 1.1 - (1 - Math.min(1, rocks.length / 14)) * 0.7 - wave * 0.03);
      beatHi = !beatHi;
      A.beep(beatHi ? 62 : 55, 0.12, 'square', 0.09);
    }
  }
  function finish() {
    A.stat('shots', statShots);
    A.stat('hits', statHits);
    if (mode === 'daily') A.unlock('daily');
    if (mode === 'blitz' && A.score >= 20000) A.unlock('blitz');
    const acc = statShots ? Math.round(100 * Math.min(statHits, statShots) / statShots) : 0;
    const title = mode === 'blitz' ? 'Time!' : wave >= 10 ? 'Space ace!' : wave >= 5 ? 'Solid flying' : 'Ship destroyed';
    const msg = mode === 'blitz' ? `Three minutes of pure rock violence. ${A.score > 20000 ? 'Impressive.' : 'The rocks are still laughing.'}` : `You made it to wave ${wave}. ${wave >= 10 ? 'The asteroid belt fears you.' : wave >= 5 ? 'Respectable rock busting.' : 'Space is big and rude. Try again?'}`;
    A.over({
      title, msg,
      rows: mode === 'blitz' ? [['Accuracy', acc + '%'], ['Crystals', crystals]] : [['Wave', wave], ['Accuracy', acc + '%'], ['Crystals', crystals]],
      share: `Curio Asteroids · ${{ classic: 'Classic', blitz: 'Blitz', daily: 'Daily ' + A.today() }[mode]} (${D.label}) · ${Curio.fmt(A.score)} pts${mode === 'blitz' ? '' : ' · wave ' + wave} · ${acc}% accuracy`
    });
  }

  const shopEl = document.getElementById('shop-list');
  function openShop() {
    renderShop();
    A.hold('shop');
    const f = document.querySelector('#ov-shop [data-autofocus]');
    f?.focus({ preventScroll: true });
  }
  function renderShop() {
    document.querySelectorAll('[data-shop="gems"]').forEach((el) => { el.textContent = crystals; });
    document.querySelectorAll('[data-shop="wave"]').forEach((el) => { el.textContent = wave + 1; });
    const nb = document.querySelector('[data-shop="next"]');
    if (nb) nb.textContent = (wave + 1) % 5 === 0 ? 'Boss wave ahead. Stock up.' : DATA.facts[(wave + 3) % DATA.facts.length];
    shopEl.innerHTML = '';
    for (const u of UPS) {
      const lvl = u.consumable ? (u.id === 'bomb' ? bombs : lives) : ups[u.id];
      const maxed = u.consumable ? lvl >= u.max : lvl >= u.costs.length;
      const cost = u.consumable ? u.costs[0] : u.costs[lvl];
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'as-up';
      b.dataset.up = u.id;
      b.disabled = maxed || crystals < cost;
      const pips = u.consumable ? `<em>have ${lvl}</em>` : `<span class="as-pips">${u.costs.map((_, i) => `<i class="${i < lvl ? 'on' : ''}"></i>`).join('')}</span>`;
      b.innerHTML = `<span class="as-ic"></span><span class="as-tx"><b></b><small></small>${pips}</span><span class="as-cost"></span>`;
      b.querySelector('.as-ic').textContent = u.icon;
      b.querySelector('b').textContent = u.name;
      b.querySelector('small').textContent = u.desc;
      b.querySelector('.as-cost').textContent = maxed ? 'MAX' : `◆${cost}`;
      shopEl.append(b);
    }
  }
  shopEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-up]');
    if (!b || b.disabled) return;
    const u = UPS.find((x) => x.id === b.dataset.up);
    const lvl = u.consumable ? 0 : ups[u.id];
    const cost = u.consumable ? u.costs[0] : u.costs[lvl];
    if (crystals < cost) return;
    crystals -= cost;
    if (A.stat('spent', cost) >= 1000) A.unlock('spender');
    if (u.id === 'bomb') bombs++;
    else if (u.id === 'hull') lives++;
    else { ups[u.id]++; if (ups[u.id] >= u.costs.length) A.unlock('maxed'); }
    A.chord([660, 880, 1320], 0.05, 'triangle', 0.08);
    A.buzz(15);
    hud();
    renderShop();
    const again = shopEl.querySelector(`[data-up="${u.id}"]`);
    again?.classList.add('is-bought');
    (again && !again.disabled ? again : document.querySelector('#ov-shop [data-autofocus]'))?.focus({ preventScroll: true });
  });
  function launchWave() { if (A.state !== 'hold') return; A.unhold(); ship.inv = 1.5; nextWave(); }
  function action(a) { if (a === 'launch') launchWave(); }
  function holdKey(k, e) { if ((k === 'Enter' || k === ' ') && !e.target.closest('button')) { e.preventDefault(); launchWave(); } }

  function idle(dt) {
    if (A.state === 'menu') for (const r of rocks) { r.x += r.vx * dt; r.y += r.vy * dt; r.rot += r.vr * dt; wrap(r); }
    cam.x += 8 * dt; cam.y += 3 * dt;
  }
  function offsets(o, r) {
    const xs = [0], ys = [0];
    if (o.x < r) xs.push(A.W);
    if (o.x > A.W - r) xs.push(-A.W);
    if (o.y < r) ys.push(A.H);
    if (o.y > A.H - r) ys.push(-A.H);
    const out = [];
    for (const x of xs) for (const y of ys) out.push([x, y]);
    return out;
  }
  function glowStroke(g, path, color, w = 1.6) {
    g.strokeStyle = color;
    g.globalAlpha = 0.14; g.lineWidth = w * 5; g.stroke(path);
    g.globalAlpha = 0.3; g.lineWidth = w * 2.4; g.stroke(path);
    g.globalAlpha = 1; g.lineWidth = w; g.stroke(path);
  }
  const shipPaths = {};
  function shipPath(id) {
    if (shipPaths[id]) return shipPaths[id];
    const p = new Path2D();
    SKINS[id].path.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
    p.closePath();
    return (shipPaths[id] = p);
  }
  function drawShip(g, x, y, a, thrust, alpha = 1, skinId = A.opts.skin) {
    const sk = SKINS[skinId] || SKINS.arrow;
    g.save();
    g.translate(x, y);
    g.rotate(a);
    g.globalAlpha = alpha;
    g.lineJoin = 'round';
    g.fillStyle = rgba(sk.glow, 0.15);
    g.fill(shipPath(skinId in SKINS ? skinId : 'arrow'));
    g.globalCompositeOperation = 'lighter';
    glowStroke(g, shipPath(skinId in SKINS ? skinId : 'arrow'), sk.color, 1.7);
    g.globalAlpha = alpha;
    if (thrust) {
      const f = new Path2D();
      const L = 16 + Math.random() * 10;
      f.moveTo(-8, -4); f.lineTo(-8 - L, 0); f.lineTo(-8, 4);
      glowStroke(g, f, '#ffb347', 1.6);
    }
    g.restore();
  }
  function drawRock(g, r) {
    const T = RT[r.type];
    for (const [ox, oy] of offsets(r, r.r)) {
      g.save();
      g.translate(r.x + ox, r.y + oy);
      g.rotate(r.rot);
      g.fillStyle = T.fill;
      g.fill(r.path);
      g.strokeStyle = rgba(T.stroke, 0.35);
      g.lineWidth = 1;
      for (const c of r.craters) { g.beginPath(); g.arc(Math.cos(c.a) * c.d, Math.sin(c.a) * c.d, c.r, 0, 7); g.stroke(); }
      g.globalCompositeOperation = 'lighter';
      glowStroke(g, r.path, r.hitT > 0 ? '#ffffff' : T.stroke, r.type === 'metal' ? 2.2 : 1.6);
      if (r.type === 'volatile') { g.globalAlpha = 0.25 + Math.sin(A.time * 8 + r.x) * 0.2; g.fillStyle = '#ff3d3d'; g.fill(r.path); }
      if (r.type === 'gold') { g.globalAlpha = 0.5 + Math.sin(A.time * 5) * 0.3; g.fillStyle = '#ffe066'; g.beginPath(); g.arc(0, 0, 2.5, 0, 7); g.fill(); }
      g.restore();
    }
  }
  function drawBoss(g, b) {
    g.save();
    g.translate(b.x, b.y);
    if (b.dying) g.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
    if (bossIntro > 0) g.globalAlpha = 1 - bossIntro / 2.2 * 0.7;
    const c = b.hitT > 0 ? '#ffffff' : b.def.color;
    g.lineJoin = 'round';
    g.globalCompositeOperation = 'lighter';
    if (b.kind === 'mother') {
      const hull = new Path2D();
      hull.moveTo(-90, 6); hull.lineTo(-60, -10); hull.lineTo(60, -10); hull.lineTo(90, 6); hull.lineTo(60, 22); hull.lineTo(-60, 22); hull.closePath();
      const dome = new Path2D();
      dome.moveTo(-34, -10); dome.quadraticCurveTo(0, -56, 34, -10);
      g.fillStyle = rgba(b.def.color, 0.08); g.fill(hull);
      glowStroke(g, hull, c, 2.2);
      glowStroke(g, dome, c, 1.8);
      for (let i = -3; i <= 3; i++) { g.globalAlpha = ((A.time * 6 + i) | 0) % 3 === 0 ? 1 : 0.3; g.fillStyle = c; g.beginPath(); g.arc(i * 22, 8, 3, 0, 7); g.fill(); }
      g.globalAlpha = 1;
      for (const ox of [-40, 0, 40]) { const t = new Path2D(); t.arc(ox, 24, 6, 0, Math.PI); glowStroke(g, t, '#ffffff', 1.2); }
    } else if (b.kind === 'titan') {
      if (!b.path) { const p = new Path2D(); const n = 16; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, m = 0.82 + ((i * 37) % 11) / 55; p.lineTo(Math.cos(a) * b.r * m, Math.sin(a) * b.r * m); } p.closePath(); b.path = p; }
      g.rotate(b.rot);
      g.fillStyle = 'rgba(255,170,90,.07)'; g.fill(b.path);
      glowStroke(g, b.path, c, 2.6);
      const core = 18 + Math.sin(A.time * 4) * 4;
      const rg = g.createRadialGradient(0, 0, 0, 0, 0, core * 2);
      rg.addColorStop(0, 'rgba(255,220,120,.9)'); rg.addColorStop(1, 'rgba(255,100,40,0)');
      g.fillStyle = rg; g.beginPath(); g.arc(0, 0, core * 2, 0, 7); g.fill();
      g.strokeStyle = rgba('#ffb366', 0.5); g.lineWidth = 1.5;
      for (let i = 0; i < 5; i++) { const a = i * 1.26; g.beginPath(); g.moveTo(Math.cos(a) * 20, Math.sin(a) * 20); g.lineTo(Math.cos(a + 0.2) * 55, Math.sin(a + 0.2) * 55); g.lineTo(Math.cos(a) * 80, Math.sin(a) * 80); g.stroke(); }
    } else if (b.kind === 'queen') {
      g.rotate(Math.sin(A.time * 2) * 0.1);
      const body = new Path2D();
      body.ellipse(0, 0, 26, 36, 0, 0, 7);
      const wings = new Path2D();
      const flap = Math.sin(A.time * 14) * 8;
      wings.moveTo(-14, -10); wings.quadraticCurveTo(-70, -40 - flap, -60, 10); wings.quadraticCurveTo(-40, 10, -14, 4);
      wings.moveTo(14, -10); wings.quadraticCurveTo(70, -40 - flap, 60, 10); wings.quadraticCurveTo(40, 10, 14, 4);
      const crown = new Path2D();
      crown.moveTo(-14, -34); crown.lineTo(-10, -48); crown.lineTo(-4, -38); crown.lineTo(0, -52); crown.lineTo(4, -38); crown.lineTo(10, -48); crown.lineTo(14, -34);
      g.fillStyle = rgba(b.def.color, 0.12); g.fill(body);
      glowStroke(g, wings, '#c49bff', 1.6);
      glowStroke(g, body, c, 2.2);
      glowStroke(g, crown, '#ffe066', 1.6);
      g.fillStyle = '#fff';
      g.beginPath(); g.arc(-8, -12, 3, 0, 7); g.arc(8, -12, 3, 0, 7); g.fill();
    }
    g.restore();
  }
  function draw(g) {
    const W = A.W, H = A.H;
    g.save();
    A.applyShake(g, 14);
    g.drawImage(nebulaSprite(), -2, -2, W + 4, H + 4);
    for (const s of stars) {
      const f = [0.04, 0.1, 0.2][s.l];
      let x = (s.x * W - cam.x * f) % W, y = (s.y * H - cam.y * f) % H;
      if (x < 0) x += W;
      if (y < 0) y += H;
      g.globalAlpha = s.a * (0.7 + Math.sin(A.time * 2 + s.tw) * 0.3);
      g.fillStyle = s.l === 2 ? '#ffffff' : '#c9d6ff';
      g.fillRect(x, y, s.r, s.r);
    }
    g.globalAlpha = 1;
    for (const r of rocks) drawRock(g, r);
    g.globalCompositeOperation = 'lighter';
    for (const gm of gems) {
      g.save();
      g.translate(gm.x, gm.y);
      g.rotate(gm.rot);
      g.globalAlpha = gm.life < 2 ? (Math.floor(gm.life * 8) % 2 ? 0.3 : 1) : 1;
      const p = new Path2D();
      p.moveTo(0, -6); p.lineTo(4, 0); p.lineTo(0, 6); p.lineTo(-4, 0); p.closePath();
      g.fillStyle = 'rgba(80,255,170,.35)';
      g.fill(p);
      glowStroke(g, p, '#5effb0', 1.2);
      g.restore();
    }
    for (const c of caps) {
      g.save();
      g.translate(c.x, c.y);
      const col = { shield: '#5ef2ff', bomb: '#ffffff', overdrive: '#ffe066' }[c.kind];
      const p = new Path2D();
      p.arc(0, 0, 11 + Math.sin(A.time * 6) * 1.5, 0, 7);
      g.globalAlpha = c.life < 3 && Math.floor(c.life * 6) % 2 ? 0.3 : 1;
      glowStroke(g, p, col, 1.6);
      g.fillStyle = col;
      g.font = `900 11px ${FONT}`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText({ shield: 'S', bomb: 'B', overdrive: 'O' }[c.kind], 0, 1);
      g.restore();
    }
    g.globalCompositeOperation = 'source-over';
    if (ufo) {
      g.save();
      g.translate(ufo.x, ufo.y);
      const s = ufo.r / 17;
      g.scale(s, s);
      g.globalCompositeOperation = 'lighter';
      const p = new Path2D();
      p.moveTo(-22, 2); p.lineTo(22, 2); p.lineTo(12, 9); p.lineTo(-12, 9); p.closePath();
      p.moveTo(-22, 2); p.lineTo(-10, -5); p.lineTo(10, -5); p.lineTo(22, 2);
      p.moveTo(-8, -5); p.lineTo(-5, -12); p.lineTo(5, -12); p.lineTo(8, -5);
      glowStroke(g, p, '#7dffb0', 1.8 / s);
      g.fillStyle = '#7dffb0';
      for (let i = -1; i <= 1; i++) if (((A.time * 6) | 0) % 3 === i + 1) { g.beginPath(); g.arc(i * 10, 5.5, 1.8, 0, 7); g.fill(); }
      g.restore();
    }
    for (const h of hunters) {
      g.save();
      g.translate(h.x, h.y);
      g.rotate(h.a);
      g.globalCompositeOperation = 'lighter';
      const p = new Path2D();
      p.moveTo(10, 0); p.lineTo(-7, -7); p.lineTo(-3, 0); p.lineTo(-7, 7); p.closePath();
      glowStroke(g, p, '#ff9a3d', 1.5);
      g.restore();
    }
    if (boss) drawBoss(g, boss);
    g.globalCompositeOperation = 'lighter';
    g.lineCap = 'round';
    for (const b of bullets) {
      const col = b.enemy ? b.col || '#ff6b8a' : overdrive > 0 ? '#ffe066' : '#e8f4ff';
      g.strokeStyle = col;
      g.globalAlpha = 0.3; g.lineWidth = 6;
      g.beginPath(); g.moveTo(b.x, b.y); g.lineTo(b.x - b.vx * 0.016, b.y - b.vy * 0.016); g.stroke();
      g.globalAlpha = 1; g.lineWidth = 2.2; g.stroke();
    }
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
    if (ship && ship.alive && A.state !== 'menu') {
      const blink = ship.inv > 0 && Math.floor(A.time * 10) % 2 === 0;
      for (const [ox, oy] of offsets(ship, 18)) drawShip(g, ship.x + ox, ship.y + oy, ship.a, ship.thrusting && A.state === 'play', blink ? 0.35 : 1);
      if (ship.shield > 0 || ship.shT > 0) {
        g.save();
        g.globalCompositeOperation = 'lighter';
        const p = new Path2D();
        p.arc(ship.x, ship.y, 22 + Math.sin(A.time * 5) * 1.5, 0, 7);
        g.globalAlpha = 0.5;
        glowStroke(g, p, '#5ef2ff', ship.shT > 0 ? 2.5 : 1);
        g.restore();
      }
    }
    if (A.state === 'menu') drawShip(g, A.W / 2 + Math.cos(A.time * 0.5) * 120, A.H / 2 + Math.sin(A.time) * 40, A.time * 0.5 + Math.PI / 2 + Math.PI / 2, true, 1);
    g.globalCompositeOperation = 'lighter';
    for (const d of debris) {
      g.globalAlpha = Math.min(1, d.life);
      g.strokeStyle = d.c;
      g.lineWidth = 1.6;
      g.beginPath();
      g.moveTo(d.x - Math.cos(d.a) * d.len / 2, d.y - Math.sin(d.a) * d.len / 2);
      g.lineTo(d.x + Math.cos(d.a) * d.len / 2, d.y + Math.sin(d.a) * d.len / 2);
      g.stroke();
    }
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
    A.fx.draw(g);
    A.drawPops(g);
    g.restore();
    A.drawFlash(g);
    g.textAlign = 'center';
    if (boss && A.state !== 'menu') {
      const bw = Math.min(360, W - 160);
      g.fillStyle = 'rgba(255,255,255,.12)';
      rrect(g, W / 2 - bw / 2, 14, bw, 10, 5); g.fill();
      g.fillStyle = boss.def.color;
      rrect(g, W / 2 - bw / 2, 14, bw * Math.max(0, boss.hp) / boss.max, 10, 5); g.fill();
      g.font = `900 11px ${FONT}`;
      g.fillStyle = '#ffffff';
      g.fillText(boss.def.name.toUpperCase(), W / 2, 40);
    }
    if (A.state === 'play' || A.state === 'paused') {
      g.textAlign = 'left';
      g.font = `800 12px ${FONT}`;
      g.fillStyle = 'rgba(220,230,255,.75)';
      let y = H - 14;
      g.fillText(`BOMBS ${'✹'.repeat(bombs) || '-'}   HYPER ${hyperCool > 0 ? Math.ceil(hyperCool) + 's' : 'ready'}${overdrive > 0 ? '   OVERDRIVE ' + Math.ceil(overdrive) : ''}`, 12, y);
      if (combo >= 3) { g.textAlign = 'right'; g.fillStyle = '#ffe066'; g.font = `900 16px ${FONT}`; g.fillText(`CHAIN x${Math.min(8, 1 + Math.floor(combo / 3))}`, W - 12, H - 14); }
      g.textAlign = 'center';
    }
    if (banner && A.state !== 'menu') {
      const a = Math.max(0, Math.min(1, banner.t * 4, (banner.dur - banner.t) * 3));
      g.globalAlpha = banner.warn ? a * (Math.floor(banner.t * 5) % 2 ? 1 : 0.5) : a;
      g.font = `900 ${banner.warn ? 44 : 38}px ${FONT}`;
      g.fillStyle = banner.warn ? '#ff4d6a' : '#ffffff';
      g.shadowColor = banner.warn ? '#ff4d6a' : '#7fb8ff';
      g.shadowBlur = 18;
      g.fillText(banner.text, W / 2, H / 2 - 60);
      g.shadowBlur = 0;
      g.font = `700 15px ${FONT}`;
      g.fillStyle = 'rgba(220,230,255,.85)';
      const words = banner.sub.split(' ');
      let line = '', yy = H / 2 - 28;
      for (const w of words) {
        if (g.measureText(line + w).width > Math.min(520, W - 60)) { g.fillText(line.trim(), W / 2, yy); line = ''; yy += 20; }
        line += w + ' ';
      }
      g.fillText(line.trim(), W / 2, yy);
      g.globalAlpha = 1;
    }
    if (A.state === 'play' && ship && !ship.alive && respawnT > 0 && (mode === 'blitz' || lives > 0)) {
      g.fillStyle = 'rgba(255,255,255,.8)';
      g.font = `700 16px ${FONT}`;
      g.fillText(mode === 'blitz' ? 'Respawning...' : `${lives} ship${lives === 1 ? '' : 's'} left`, W / 2, H / 2 + 50);
    }
  }
  A.debug = () => ({
    wave, lives, rocks: rocks.length, hasUfo: !!ufo, boss: boss && boss.kind, crystals, ups: { ...ups }, state: A.state,
    spawnUfo() { spawnUfo(); ufo.x = 30; },
    clearWave() { rocks = []; hunters = []; boss = null; },
    gems(n) { crystals += n; hud(); },
    goto(n) { wave = n - 1; rocks = []; hunters = []; boss = null; nextWave(); },
    killBoss() { if (boss) hurtBoss(9999); },
    god() { ship.inv = 9999; },
    die() { lives = 1; ship.inv = 0; ship.shield = 0; hurtShip(); }
  });
  ship = { x: 400, y: 300, alive: false };
  R = A.rng(1);
  D = DIFF.normal;
  wave = 1;
  rocks = [];
  cam = { x: 0, y: 0 };
  for (let i = 0; i < 7; i++) rocks.push(makeRock(Math.random() * 800, Math.random() * 600, Curio.randInt(1, 3), 1, Curio.pick(['stone', 'stone', 'ice', 'metal', 'volatile', 'gold'])));
  bullets = []; gems = []; caps = []; hunters = []; debris = [];
  A.boot();
})();
