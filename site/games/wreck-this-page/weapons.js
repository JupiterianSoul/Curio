(() => {
  const WTP = window.WTP;
  const { P32, rand, randInt, pick } = WTP;
  const SP = WTP.sprites;
  const PR = SP.PROJ;
  const W = () => WTP.world, FX = () => WTP.fx, G = () => WTP.game, PL = () => WTP.player, EN = () => WTP.enemies;
  const A = (n, x) => WTP.audio.play(n, x);

  const CATS = [
    { id: 'side', short: 'Pistol', name: 'Sidearms', icon: 'gun', col: '5' },
    { id: 'auto', short: 'Auto', name: 'Automatics', icon: 'bolt', col: 'a' },
    { id: 'shot', short: 'Shotgun', name: 'Shotguns', icon: 'skull', col: 'o' },
    { id: 'prec', short: 'Snipe', name: 'Precision', icon: 'target', col: 'c' },
    { id: 'energy', short: 'Energy', name: 'Energy', icon: 'bolt', col: 'm' },
    { id: 'chem', short: 'Chem', name: 'Chemical', icon: 'zen', col: 'l' },
    { id: 'boom', short: 'Boom', name: 'Explosives', icon: 'star', col: 'e' },
    { id: 'melee', short: 'Melee', name: 'Melee', icon: 'cross', col: 'u' },
    { id: 'gadget', short: 'Gadget', name: 'Gadgets', icon: 'gear', col: 'k' },
    { id: 'disaster', short: 'Chaos', name: 'Disasters', icon: 'skull', col: 'y' }
  ];
  const D = [
    { id: 'pistol', name: 'Pistol', cat: 'side', price: 0, rate: 0.17, flash: 'small', shell: true, recoil: 2, shake: 1.5, snd: 'pistol', st: [2, 3, 4, 1], tip: 'Reliable little holes. Pops letters right off the line.' },
    { id: 'revolver', name: 'Hand Cannon', cat: 'side', price: 400, rate: 0.48, flash: 'big', recoil: 4, shake: 4, kick: 40, snd: 'revolver', st: [4, 2, 4, 2], tip: 'Six huge rounds that punch straight through paragraphs.', mag: 6, reload: 1 },
    { id: 'dual', name: 'Dual Pistols', cat: 'side', price: 900, rate: 0.085, flash: 'small', shell: true, recoil: 1.5, shake: 1, snd: 'dual', st: [2, 4, 3, 2], tip: 'Golden twins. Alternating fire, maximum style.' },
    { id: 'nailgun', name: 'Nail Gun', cat: 'side', price: 600, rate: 0.06, flash: 'small', recoil: 1, shake: 0.6, snd: 'nail', st: [1, 5, 3, 1], tip: 'Staples the page to itself. Very fast, very small.' },
    { id: 'flare', name: 'Flare Gun', cat: 'side', price: 1200, rate: 0.6, flash: 'fire', recoil: 2, shake: 2, snd: 'flare', st: [2, 2, 3, 4], tip: 'A burning flare that sticks and sets everything around it on fire.' },
    { id: 'smg', name: 'SMG', cat: 'auto', price: 0, rate: 0.055, flash: 'small', shell: true, recoil: 1.4, shake: 0.8, snd: 'smg', st: [2, 5, 3, 2], tip: 'Hold to shred text into confetti.' },
    { id: 'rifle', name: 'Assault Rifle', cat: 'auto', price: 700, rate: 0.095, flash: 'big', shell: true, recoil: 2, shake: 1.6, snd: 'rifle', st: [3, 4, 5, 2], tip: 'Accurate, punchy, goes through a few lines at once.' },
    { id: 'minigun', name: 'Minigun', cat: 'auto', price: 3500, rate: 0.028, flash: 'big', shell: true, recoil: 2.5, shake: 2.2, snd: 'minigun', spin: true, st: [3, 5, 4, 4], tip: 'Spin up, then a wall of lead. Pushes you backwards.' },
    { id: 'shotgun', name: 'Shotgun', cat: 'shot', price: 0, rate: 0.7, flash: 'big', shell: true, recoil: 5, shake: 7, kick: 130, snd: 'shotgun', st: [4, 2, 2, 3], tip: 'Spray of pellets. Fire downward for a shotgun jump.' },
    { id: 'double', name: 'Double Barrel', cat: 'shot', price: 1100, rate: 1.05, flash: 'big', recoil: 7, shake: 11, kick: 230, snd: 'double', st: [5, 1, 2, 4], tip: 'Both barrels at once. Launches you across the page.' },
    { id: 'flak', name: 'Flak Cannon', cat: 'shot', price: 2200, rate: 0.8, flash: 'big', recoil: 5, shake: 5, kick: 60, snd: 'flak', st: [4, 2, 4, 4], tip: 'A shell that bursts into a cloud of shrapnel mid-air.' },
    { id: 'confetti', name: 'Confetti Cannon', cat: 'shot', price: 800, rate: 0.5, flash: 'pink', recoil: 3, shake: 3, kick: 50, snd: 'confetti', st: [2, 3, 2, 5], tip: 'Party time. Paints the page and pokes tiny holes.' },
    { id: 'sniper', name: 'Sniper Rifle', cat: 'prec', price: 1500, rate: 1.1, flash: 'big', shell: true, recoil: 6, shake: 6, kick: 60, snd: 'sniper', st: [4, 1, 5, 2], tip: 'Laser sight, one shot, three walls deep.' },
    { id: 'railgun', name: 'Railgun', cat: 'prec', price: 3000, rate: 1.15, flash: 'energy', recoil: 8, shake: 14, kick: 180, snd: 'rail', st: [5, 1, 5, 3], tip: 'Charges, then pierces the entire page edge to edge.', charge: 0.45 },
    { id: 'crossbow', name: 'Crossbow', cat: 'prec', price: 1000, rate: 0.62, recoil: 2, shake: 2, snd: 'throw', st: [3, 2, 4, 2], tip: 'Bolts skewer whole words and knock every letter loose.' },
    { id: 'harpoon', name: 'Harpoon', cat: 'prec', price: 1800, rate: 1, recoil: 4, shake: 3, snd: 'harpoon', st: [3, 2, 4, 4], tip: 'Spears a chunk of the page and yanks it toward you.' },
    { id: 'laser', name: 'Laser', cat: 'energy', price: 1600, hold: true, loop: 'laser', flash: 'pink', st: [3, 5, 5, 2], tip: 'Melts a clean tunnel wherever you point it.' },
    { id: 'plasma', name: 'Plasma Rifle', cat: 'energy', price: 2000, rate: 0.33, flash: 'pink', recoil: 3, shake: 3, snd: 'plasma', st: [4, 3, 4, 3], tip: 'Hot purple balls that pop into neat craters.' },
    { id: 'tesla', name: 'Tesla Coil', cat: 'energy', price: 2600, rate: 0.13, flash: 'energy', recoil: 1, shake: 1.5, snd: 'tesla', st: [3, 4, 3, 5], tip: 'Chain lightning that arcs from letter to letter.' },
    { id: 'freeze', name: 'Freeze Ray', cat: 'energy', price: 1900, hold: true, loop: 'freeze', st: [2, 5, 3, 4], tip: 'Turns pixels to ice. Ice shatters. Beautifully.' },
    { id: 'sound', name: 'Sound Cannon', cat: 'energy', price: 2400, rate: 0.9, recoil: 5, shake: 8, kick: 90, snd: 'sound', st: [3, 2, 3, 5], tip: 'A shockwave cone that rattles everything loose.' },
    { id: 'eraser', name: 'Pixel Eraser', cat: 'energy', price: 1300, hold: true, loop: 'eraser', st: [3, 5, 3, 1], tip: 'Ctrl+Z for reality. Rubs out pixels wherever you aim.' },
    { id: 'glitch', name: 'Glitch Gun', cat: 'energy', price: 4200, rate: 0.28, flash: 'pink', recoil: 2, shake: 3, snd: 'glitch', st: [3, 3, 4, 5], tip: 'Corrupts the page. Rows tear, colours scramble, pixels flee.' },
    { id: 'flame', name: 'Flamethrower', cat: 'chem', price: 1400, hold: true, loop: 'flame', st: [3, 5, 2, 5], tip: 'Pixels catch fire, fire spreads, the page smoulders.' },
    { id: 'acid', name: 'Acid Sprayer', cat: 'chem', price: 1700, hold: true, loop: 'acid', st: [3, 4, 2, 4], tip: 'Green goo that drips and eats its way downward.' },
    { id: 'paint', name: 'Paint Gun', cat: 'chem', price: 500, rate: 0.085, flash: 'pink', recoil: 1, shake: 0.5, snd: 'paint', st: [1, 5, 3, 3], tip: 'Recolours the internet. Vandalism, technically.' },
    { id: 'lava', name: 'Lava Launcher', cat: 'chem', price: 2800, rate: 0.26, flash: 'fire', recoil: 2, shake: 2, snd: 'lava', st: [4, 3, 3, 5], tip: 'Lobs molten blobs that melt straight down through the page.' },
    { id: 'water', name: 'Water Cannon', cat: 'chem', price: 600, hold: true, loop: 'water', st: [1, 5, 3, 3], tip: 'Washes rubble away and puts out fires. Aim down to fly.' },
    { id: 'grenade', name: 'Grenades', cat: 'boom', price: 0, rate: 0.5, throw: true, snd: 'throw', st: [4, 2, 3, 3], tip: 'Bouncy, then boom.' },
    { id: 'rocket', name: 'Rocket Launcher', cat: 'boom', price: 1200, rate: 0.62, flash: 'fire', recoil: 5, shake: 3, kick: 30, snd: 'rocket', st: [5, 2, 4, 4], tip: 'Big craters and the classic rocket jump.' },
    { id: 'homing', name: 'Homing Missiles', cat: 'boom', price: 2700, rate: 0.9, flash: 'fire', recoil: 3, shake: 3, snd: 'launch', st: [4, 2, 5, 4], tip: 'Four little missiles that hunt down whatever you point at.' },
    { id: 'cluster', name: 'Cluster Bomb', cat: 'boom', price: 1600, rate: 0.9, throw: true, snd: 'throw', st: [4, 1, 3, 5], tip: 'One bomb becomes seven bombs. Maths!' },
    { id: 'sticky', name: 'Sticky Bombs', cat: 'boom', price: 1500, rate: 0.3, throw: true, snd: 'throw', st: [4, 3, 3, 4], tip: 'They stick. Press ALT to blow them all, or wait.', alt: 'Detonate all' },
    { id: 'mine', name: 'Proximity Mines', cat: 'boom', price: 1100, rate: 0.45, throw: true, snd: 'throw', st: [4, 2, 2, 4], tip: 'Arm, wait, boom when anything wanders close. ALT detonates.', alt: 'Detonate all' },
    { id: 'firework', name: 'Fireworks', cat: 'boom', price: 1400, rate: 0.55, flash: 'pink', recoil: 2, shake: 2, snd: 'firework', st: [3, 2, 4, 5], tip: 'A rocket that bursts into burning stars.' },
    { id: 'nuke', name: 'Pocket Nuke', cat: 'boom', price: 9000, rate: 7, flash: 'fire', recoil: 6, shake: 4, snd: 'nukeLaunch', st: [5, 1, 4, 5], tip: 'Do not aim this at anything you love.' },
    { id: 'hammer', name: 'Giant Hammer', cat: 'melee', price: 0, rate: 0.36, melee: true, snd: 'swoosh', st: [4, 3, 1, 3], tip: 'Smash. Hit the floor to pogo upward.' },
    { id: 'chainsaw', name: 'Chainsaw', cat: 'melee', price: 1500, hold: true, loop: 'saw', melee: true, st: [3, 5, 1, 3], tip: 'Carves right through, up close and personal.' },
    { id: 'katana', name: 'Katana', cat: 'melee', price: 1000, rate: 0.26, melee: true, snd: 'slash', st: [3, 4, 2, 3], tip: 'Clean cuts. Sliced pieces fall away in one piece.' },
    { id: 'drill', name: 'Power Drill', cat: 'melee', price: 2000, hold: true, loop: 'drill', melee: true, st: [3, 5, 1, 2], tip: 'Pulls you forward through anything. Tunnel time.' },
    { id: 'wrecking', name: 'Wrecking Ball', cat: 'melee', price: 2600, hold: true, melee: true, st: [5, 3, 2, 4], tip: 'A ball on a chain. Hold fire to swing it toward your aim.' },
    { id: 'portal', name: 'Portal Gun', cat: 'gadget', price: 2200, rate: 0.35, flash: 'energy', snd: 'portal', st: [1, 3, 5, 4], tip: 'Blue, then orange. Things that go in come out. ALT clears.', alt: 'Clear portals' },
    { id: 'gravity', name: 'Gravity Gun', cat: 'gadget', price: 3200, hold: true, loop: 'grav', st: [4, 3, 3, 5], tip: 'Hold to rip out a chunk, let go to throw it.' },
    { id: 'magnet', name: 'Magnet', cat: 'gadget', price: 1800, hold: true, loop: 'magnet', st: [2, 4, 3, 4], tip: 'Rips letters off the page. Let go to fling them back.' },
    { id: 'ballgun', name: 'Bouncy Balls', cat: 'gadget', price: 900, rate: 0.16, flash: 'pink', recoil: 1, shake: 0.6, snd: 'ball', st: [2, 4, 4, 4], tip: 'Rubber balls that ricochet and chip away at everything.' },
    { id: 'boomerang', name: 'Boomerang', cat: 'gadget', price: 700, rate: 0.3, throw: true, snd: 'boomerang', st: [3, 3, 3, 3], tip: 'Out and back again, carving both ways.' },
    { id: 'blackhole', name: 'Black Hole', cat: 'gadget', price: 6000, rate: 2.4, throw: true, snd: 'throw', st: [5, 1, 3, 5], tip: 'Swallows letters, debris and the occasional hero.' },
    { id: 'snowball', name: 'Snowballs', cat: 'gadget', price: 300, rate: 0.22, throw: true, snd: 'snow', st: [1, 4, 3, 2], tip: 'Freezes a little patch. Follow up with anything.' },
    { id: 'banana', name: 'Banana Bomb', cat: 'gadget', price: 450, rate: 1.2, throw: true, snd: 'banana', st: [4, 1, 3, 5], tip: 'Splits into five smaller bananas. All of them explode.' },
    { id: 'airstrike', name: 'Airstrike', cat: 'disaster', price: 3800, rate: 1.8, throw: true, snd: 'throw', st: [5, 1, 5, 5], tip: 'Throw a flare. Bombs follow shortly after.' },
    { id: 'orbital', name: 'Orbital Laser', cat: 'disaster', price: 7000, rate: 4, throw: true, snd: 'beep', st: [5, 1, 5, 5], tip: 'Throw a beacon. Space answers with a column of light.' },
    { id: 'meteor', name: 'Meteor Shower', cat: 'disaster', price: 5000, rate: 4, call: true, snd: 'meteor', st: [5, 1, 5, 5], tip: 'Rains burning rocks around your aim point.' },
    { id: 'bees', name: 'Bee Swarm', cat: 'disaster', price: 3000, rate: 3, call: true, snd: 'buzz', st: [3, 1, 5, 4], tip: 'Fourteen hungry bees with a taste for typography.' },
    { id: 'tornado', name: 'Tornado', cat: 'disaster', price: 4500, rate: 5, call: true, snd: 'swoosh', st: [4, 1, 4, 5], tip: 'A funnel that rips through the page, sucking everything up.' },
    { id: 'quake', name: 'Earthquake', cat: 'disaster', price: 4000, rate: 6, call: true, snd: 'quake', st: [4, 1, 5, 5], tip: 'Shakes the whole page until loose things fall off.' }
  ];
  const BY = {};
  D.forEach((d, i) => { d.idx = i; d.sprite = SP.WEAPON[d.id] || SP.WEAPON.pistol; BY[d.id] = d; });

  const st = { cur: 'pistol', cd: 0, spin: 0, charge: 0, mag: {}, reload: 0, held: null, heldT: 0, ball: null, portals: [], portalNext: 0, stickies: [], mines: [], boomers: 0, dualSide: 0, katanaDir: 1, was: false, quakeT: 0, tornados: [], beam: null, orb: [], paintIdx: 0, ammo: null, nukeT: 0 };
  const shots = [];
  const owned = (id) => WTP.game?.allWeapons?.() || BY[id].price === 0 || !!WTP.save.owned[id];

  function aimPoint(o) {
    const G0 = G();
    if (G0 && G0.mouseWorld && WTP.input.aim.src === 'mouse' && WTP.input.mouse.in) return G0.mouseWorld();
    const r = W().raycast(o.x, o.y, o.ax, o.ay, 140);
    return { x: r.x, y: r.y };
  }
  function addShot(s) {
    s.age = 0;
    s.from = s.from || 'p';
    shots.push(s);
    if (shots.length > 700) shots.shift();
    return s;
  }
  function bullet(o, spread, speed, r, dmg, extra = {}) {
    const a = Math.atan2(o.ay, o.ax) + rand(-spread, spread);
    return addShot(Object.assign({ t: 'bullet', x: o.x, y: o.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: 1.4, r, dmg, pierce: 0, spr: 'bullet' }, extra));
  }
  function lob(o, type, speed, extra = {}) {
    const a = Math.atan2(o.ay, o.ax);
    const P = PL();
    return addShot(Object.assign({ t: type, x: o.x, y: o.y, vx: Math.cos(a) * speed + P.vx * 0.35, vy: Math.sin(a) * speed - 30, life: 6, spin: 0 }, extra));
  }

  function explode(x, y, r, o = {}) {
    const Wd = W();
    const n = Wd.carve(x, y, r, { debris: 0.45, force: 110 + r * 3, scorch: o.scorch !== false, back: r >= 11 ? (o.back ?? 0.72) : 0, letters: o.letters ?? Math.min(16, r * 0.7), ignite: o.fire ?? 0.12, cause: o.cause || 'boom', crumbleR: 6 + r * 0.25 });
    FX().explosion(x, y, r, o.kind || 'fire');
    FX().blast(x, y, r * 3, 260);
    const g = G();
    g?.shake?.(Math.min(32, 3 + r * 0.75));
    if (r >= 16) g?.hitstop?.(Math.min(0.12, 0.025 + r * 0.0012));
    if (r >= 40) g?.slowmo?.(0.3, 1.1);
    if (r >= 24) FX().flash(Math.min(0.9, r / 70), o.kind === 'ice' ? '#8fe3ff' : o.kind === 'plasma' ? '#d07bff' : '#fff3b0');
    if (r >= 30) g?.chroma?.(Math.min(1, r / 60));
    const P = PL(), pc = P.center();
    const dx = pc.x - x, dy = pc.y - y, d = Math.hypot(dx, dy);
    if (d < r * 2.4 && !o.noPush) { const f = (1 - d / (r * 2.4)) * (260 + r * 4); P.impulse((dx / (d || 1)) * f * 0.85, (dy / (d || 1)) * f - 50); }
    for (const c of Wd.chunks) {
      const qx = c.x - x, qy = c.y - y, qd = Math.hypot(qx, qy) || 1;
      if (qd < r * 3) { const f = (1 - qd / (r * 3)) * 300; c.vx += (qx / qd) * f; c.vy += (qy / qd) * f - 60; c.va += rand(-3, 3); c.rest = 0; }
    }
    EN()?.damageCircle?.(x, y, r * 1.35, o.dmg ?? r * 4, 'boom');
    for (const m of st.mines) if (!m.dead && Math.hypot(m.x - x, m.y - y) < r + 6) m.trig = Math.min(m.trig ?? 0.12, 0.12);
    A(o.sound || 'boom', r);
    g?.stat?.('explosions', 1);
    WTP.vibe(Math.min(120, 20 + r * 2));
    return n;
  }

  const FIRE = {
    pistol(o) { bullet(o, 0.015, 560, 3.6, 12); },
    revolver(o) {
      const m = st.mag.revolver ?? 6;
      if (m <= 0) return false;
      st.mag.revolver = m - 1;
      bullet(o, 0.005, 760, 5.5, 45, { pierce: 22, spr: 'bigbullet' });
      if (st.mag.revolver === 0) { st.reload = 1; st.reloadFor = 'revolver'; G()?.label?.('RELOADING', 700); setTimeout(() => A('rack'), 500); }
    },
    dual(o) {
      st.dualSide ^= 1;
      const nx = -o.ay * (st.dualSide ? 2.5 : -2.5), ny = o.ax * (st.dualSide ? 2.5 : -2.5);
      bullet({ ...o, x: o.x + nx, y: o.y + ny }, 0.05, 580, 3.1, 9);
    },
    nailgun(o) { bullet(o, 0.04, 680, 1.7, 5, { spr: 'nail', nail: true, life: 0.9 }); },
    flare(o) { lob(o, 'flare', 300, { life: 6, burnT: 3, spr: 'flare' }); },
    smg(o) { bullet(o, 0.09, 600, 2.9, 7); },
    rifle(o) { bullet(o, 0.028, 740, 3.4, 14, { pierce: 5 }); },
    minigun(o) {
      bullet(o, 0.12, rand(580, 660), 2.9, 7);
      const P = PL();
      P.vx -= o.ax * 9; if (!P.ground) P.vy -= o.ay * 7;
    },
    shotgun(o) { for (let k = 0; k < 9; k++) bullet(o, 0.27, rand(380, 520), 3.4, 9, { life: rand(0.25, 0.38), spr: 'pellet' }); },
    double(o) { for (let k = 0; k < 17; k++) bullet(o, 0.33, rand(360, 560), 3.6, 10, { life: rand(0.22, 0.36), spr: 'pellet' }); },
    flak(o) { const s = lob(o, 'flak', 420, { life: 0.3, spr: 'flak', g: 120 }); s.vy += 30; },
    confetti(o) {
      for (let k = 0; k < 22; k++) {
        const a = Math.atan2(o.ay, o.ax) + rand(-0.35, 0.35), sp = rand(200, 420);
        addShot({ t: 'confetti', x: o.x, y: o.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.25, 0.45), col: P32[pick(['e', 'y', 'l', 'c', 'k', 'P', 'o'])], dmg: 4 });
        FX().confetti(o.x, o.y, Math.cos(a) * sp * 0.5, Math.sin(a) * sp * 0.5);
      }
    },
    sniper(o) { hitscan(o, 520, 2.4, 80, 140, P32.y); },
    railgun(o) { hitscan(o, 2000, 3.3, 99999, 200, P32.C, true); },
    crossbow(o) { addShot({ t: 'bolt', x: o.x, y: o.y, vx: o.ax * 540, vy: o.ay * 540, life: 2, g: 60, spr: 'bolt', pierce: 46, dmg: 35 }); },
    harpoon(o) { addShot({ t: 'harpoon', x: o.x, y: o.y, vx: o.ax * 480, vy: o.ay * 480, life: 1.2, g: 80, spr: 'harpoon', dmg: 30 }); },
    plasma(o) { addShot({ t: 'plasma', x: o.x, y: o.y, vx: o.ax * 270, vy: o.ay * 270, life: 2.5, spr: 'plasma', dmg: 40 }); },
    tesla(o) { tesla(o); },
    sound(o) { soundWave(o); },
    glitch(o) { addShot({ t: 'glitch', x: o.x, y: o.y, vx: o.ax * 420, vy: o.ay * 420, life: 1.5, dmg: 25 }); },
    paint(o) {
      const cols = ['k', 'c', 'y', 'l', 'P', 'o', 'e', 't'];
      const c = P32[cols[st.paintIdx++ % cols.length]];
      for (let k = 0; k < 2; k++) { const a = Math.atan2(o.ay, o.ax) + rand(-0.06, 0.06), sp = rand(330, 400); addShot({ t: 'paint', x: o.x, y: o.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1.2, g: 160, col: c, dmg: 2 }); }
    },
    lava(o) { lob(o, 'lavab', 320, { life: 3, g: 420, dmg: 20 }); },
    grenade(o) { lob(o, 'grenade', 240, { fuse: 1.5, spr: 'grenade', g: 520, bounce: 0.5 }); },
    rocket(o) { addShot({ t: 'rocket', x: o.x, y: o.y, vx: o.ax * 150, vy: o.ay * 150, life: 4, spr: 'rocket', dmg: 80 }); PL().vx -= o.ax * 30; },
    homing(o) {
      const tp = aimPoint(o);
      for (let k = 0; k < 4; k++) {
        const a = Math.atan2(o.ay, o.ax) + (k - 1.5) * 0.35;
        addShot({ t: 'missile', x: o.x, y: o.y, vx: Math.cos(a) * 160, vy: Math.sin(a) * 160 - 40, life: 4, spr: 'missile', tx: tp.x + rand(-14, 14), ty: tp.y + rand(-10, 10), delay: 0.12 + k * 0.05, dmg: 40 });
      }
    },
    cluster(o) { lob(o, 'cluster', 250, { fuse: 1.3, spr: 'cluster', g: 520, bounce: 0.4 }); },
    sticky(o) {
      if (st.stickies.length >= 8) { G()?.label?.('ALT TO DETONATE', 900); return false; }
      const s = lob(o, 'sticky', 280, { fuse: 5, spr: 'sticky', g: 480 });
      st.stickies.push(s);
    },
    mine(o) {
      if (st.mines.length >= 8) st.mines[0].trig = 0.01;
      const s = lob(o, 'mine', 170, { spr: 'mine', g: 520, arm: 0.8, life: 60 });
      st.mines.push(s);
    },
    firework(o) { addShot({ t: 'firework', x: o.x, y: o.y, vx: o.ax * 220, vy: o.ay * 220 - 40, life: 0.85, spr: 'firework', dmg: 20 }); },
    nuke(o) { addShot({ t: 'nuke', x: o.x, y: o.y, vx: o.ax * 120, vy: o.ay * 120 - 20, life: 6, g: 60, spr: 'nuke', dmg: 999 }); G()?.label?.('NUCLEAR LAUNCH DETECTED', 1400); },
    hammer(o) { hammer(o); },
    katana(o) { katana(o); },
    portal(o) { addShot({ t: 'portal', x: o.x, y: o.y, vx: o.ax * 520, vy: o.ay * 520, life: 1.2, which: st.portalNext, spr: st.portalNext ? 'portalO' : 'portalB' }); st.portalNext ^= 1; },
    ballgun(o) { addShot({ t: 'ball', x: o.x, y: o.y, vx: o.ax * 330 + rand(-10, 10), vy: o.ay * 330, life: 7, g: 300, spr: 'ball', bounces: 12, dmg: 10 }); },
    boomerang(o) {
      if (st.boomers >= 2) return false;
      st.boomers++;
      addShot({ t: 'boomerang', x: o.x, y: o.y, vx: o.ax * 340, vy: o.ay * 340, life: 3, spr: 'boomerang', out: 0.45, dmg: 25, spin: 0 });
    },
    blackhole(o) { lob(o, 'bhole', 190, { life: 9, spr: 'blackhole', g: 0, drag: true }); },
    snowball(o) { lob(o, 'snow', 300, { life: 3, spr: 'snowball', g: 380, dmg: 8 }); },
    banana(o) { lob(o, 'banana', 240, { fuse: 1.6, spr: 'banana', g: 520, bounce: 0.35, big: true }); },
    airstrike(o) { lob(o, 'aflare', 230, { fuse: 1.2, spr: 'flare', g: 520, life: 9 }); },
    orbital(o) { lob(o, 'beacon', 230, { fuse: 1.2, spr: 'beacon', g: 520, life: 6 }); },
    meteor(o) {
      const tp = aimPoint(o);
      const top = G()?.camTop?.() ?? tp.y - 120;
      for (let k = 0; k < 12; k++) addShot({ t: 'meteor', x: tp.x + rand(-70, 70) - 60, y: top - 30 - k * 18, vx: 90 + rand(-20, 20), vy: 160, life: 8, delay: k * 0.18, spr: 'meteor', dmg: 60 });
      G()?.event?.('METEOR SHOWER!', tp.x, tp.y - 30);
    },
    bees(o) {
      for (let k = 0; k < 14; k++) addShot({ t: 'bee', x: o.x, y: o.y, vx: rand(-80, 80) + o.ax * 120, vy: rand(-80, 40) + o.ay * 120, life: 8, spr: 'bee', tx: null, eat: 0, dmg: 6 });
      WTP.audio.loop('bees', true);
    },
    tornado(o) {
      const tp = aimPoint(o);
      st.tornados.push({ x: tp.x, y: tp.y, dir: o.ax >= 0 ? 1 : -1, t: 0, life: 5.5 });
      G()?.event?.('TORNADO!', tp.x, tp.y - 30);
    },
    quake() { st.quakeT = 2.8; A('quake'); G()?.event?.('EARTHQUAKE!', PL().x, PL().y - 30); }
  };

  const HOLD = {
    laser(o, dt) {
      const r = W().raycast(o.x, o.y, o.ax, o.ay, 260, 0.5);
      const e = EN()?.rayHit?.(o.x, o.y, o.ax, o.ay, Math.hypot(r.x - o.x, r.y - o.y));
      const ex = e ? e.x : r.x, ey = e ? e.y : r.y;
      FX().beam([o.x, o.y, ex, ey], { kind: 'laser', life: 0.03, c1: P32['7'], c2: P32.k });
      if (e) e.enemy.damage(90 * dt, 'laser');
      else if (r.hit) {
        W().carve(r.x + o.ax * 0.8, r.y + o.ay * 0.8, 3.8, { debris: 0.25, force: 50, scorch: true, ignite: 0.02, cause: 'laser', pop: 0.3 });
        if (Math.random() < 0.6) FX().spark(r.x, r.y, rand(-60, 60) - o.ax * 40, rand(-80, 10) - o.ay * 40, Math.random() < 0.5 ? P32.Y : P32.k);
        if (Math.random() < 0.2) FX().smoke(r.x, r.y, 1);
        G()?.shake?.(1);
      }
    },
    freeze(o, dt) {
      const r = W().raycast(o.x, o.y, o.ax, o.ay, 150, 0.6);
      for (let k = 0; k < 3; k++) { const a = Math.atan2(o.ay, o.ax) + rand(-0.12, 0.12), sp = rand(150, 260); FX().pix(o.x, o.y, Math.cos(a) * sp, Math.sin(a) * sp, Math.random() < 0.5 ? P32.C : P32['7'], 0.3); }
      FX().beam([o.x, o.y, r.x, r.y], { kind: 'tractor', life: 0.03, c1: P32.C, c2: P32['7'] });
      EN()?.damageCircle?.(r.x, r.y, 8, 30 * dt, 'freeze');
      if (r.hit) { const n = W().freezeAt(r.x + o.ax * 2, r.y + o.ay * 2, 5.5); if (n) A('freezeHit'); }
    },
    eraser(o, dt) {
      const tp = aimPoint(o);
      const d = Math.hypot(tp.x - o.x, tp.y - o.y);
      const k = d > 90 ? 90 / d : 1;
      const x = o.x + (tp.x - o.x) * k, y = o.y + (tp.y - o.y) * k;
      st.eraserAt = { x, y };
      const n = W().carve(x, y, 5, { square: true, debris: 0, clean: true, cause: 'eraser', pop: 0.15, noCrumble: Math.random() < 0.6 });
      W().eraseBack(x, y, 3);
      EN()?.damageCircle?.(x, y, 7, 50 * dt, 'eraser');
      if (n) for (let q = 0; q < 2; q++) FX().pix(x + rand(-5, 5), y + rand(-5, 5), rand(-30, 30), rand(-40, 0), Math.random() < 0.5 ? P32.K : P32.k, 0.5);
    },
    flame(o) {
      for (let k = 0; k < 3; k++) {
        const a = Math.atan2(o.ay, o.ax) + rand(-0.2, 0.2), s = rand(160, 240);
        addShot({ t: 'flame', x: o.x, y: o.y, vx: Math.cos(a) * s + PL().vx * 0.3, vy: Math.sin(a) * s, life: rand(0.32, 0.5), dmg: 1.2 });
      }
    },
    acid(o) {
      for (let k = 0; k < 2; k++) { const a = Math.atan2(o.ay, o.ax) + rand(-0.1, 0.1), s = rand(180, 250); FX().acid(o.x, o.y, Math.cos(a) * s, Math.sin(a) * s); }
      const r = W().raycast(o.x, o.y, o.ax, o.ay, 80);
      EN()?.damageCircle?.(r.x, r.y, 10, 0.6, 'acid');
    },
    water(o, dt) {
      for (let k = 0; k < 4; k++) { const a = Math.atan2(o.ay, o.ax) + rand(-0.08, 0.08), s = rand(260, 340); FX().water(o.x, o.y, Math.cos(a) * s, Math.sin(a) * s); }
      const P = PL();
      P.vx -= o.ax * 380 * dt; P.vy -= o.ay * 900 * dt;
      if (o.ay > 0.6 && P.vy < -140) P.vy = -140;
      const r = W().raycast(o.x, o.y, o.ax, o.ay, 120, 0.6);
      if (r.hit) {
        const Wd = W();
        for (let k = 0; k < 10; k++) {
          const x = Math.floor(r.x + rand(-4, 4)), y = Math.floor(r.y + rand(-4, 4));
          if (x < 0 || y < 0 || x >= Wd.w || y >= Wd.h - 3) continue;
          const i = y * Wd.w + x;
          if (Wd.mat[i] === Wd.RUBBLE || Wd.mat[i] === Wd.DEBRIS) { const c = Wd.col[i]; Wd.kill(i, x, y, x, y, 0, 0); FX().debris(x + 0.5, y + 0.5, o.ax * 200 + rand(-40, 40), o.ay * 200 - rand(10, 60), c, { ns: true }); }
          if (Wd.burn[i]) { Wd.burn[i] = 0; FX().smoke(x, y, 1, P32['6']); A('sizzle'); }
        }
        for (const c of Wd.chunks) if (Math.hypot(c.x - r.x, c.y - r.y) < c.rad + 8) { c.vx += o.ax * 600 * dt; c.vy += o.ay * 600 * dt - 200 * dt; c.rest = 0; }
      }
      EN()?.push?.(r.x, r.y, 14, o.ax * 400 * dt, o.ay * 400 * dt);
    },
    chainsaw(o) {
      const cx = o.x + o.ax * 4, cy = o.y + o.ay * 4;
      const n = W().carve(cx, cy, 4.8, { debris: 0.5, force: 90, cause: 'saw', pop: 0.4 });
      st.swing = 0.05;
      EN()?.damageCircle?.(cx, cy, 8, 4, 'saw');
      if (n) {
        G()?.shake?.(2.5);
        PL().vx += o.ax * 6;
        for (let z = 0; z < 2; z++) FX().spark(cx, cy, -o.ax * rand(40, 120) + rand(-40, 40), rand(-110, -20), Math.random() < 0.5 ? P32.Y : P32.a, rand(0.12, 0.3));
        WTP.vibe(8);
      }
    },
    drill(o, dt) {
      const cx = o.x + o.ax * 3, cy = o.y + o.ay * 3;
      const n = W().carve(cx, cy, 5.5, { debris: 0.4, force: 70, cause: 'drill', pop: 0.5, crumbleR: 3 });
      EN()?.damageCircle?.(cx, cy, 8, 3, 'drill');
      const P = PL();
      if (n) {
        P.vx += o.ax * 900 * dt; P.vy += o.ay * 700 * dt - 400 * dt;
        G()?.shake?.(1.8);
        for (let z = 0; z < 2; z++) FX().spark(cx, cy, -o.ax * rand(40, 140) + rand(-30, 30), -o.ay * rand(40, 140) + rand(-30, 30), Math.random() < 0.5 ? P32['6'] : P32.y, 0.25);
        WTP.vibe(6);
      }
      st.drillSpin = (st.drillSpin || 0) + dt * 30;
    },
    gravity(o, dt) {
      const Wd = W();
      if (!st.held) {
        st.grabT = (st.grabT || 0) + dt;
        const r = Wd.raycast(o.x, o.y, o.ax, o.ay, 90, 0.7);
        FX().beam([o.x, o.y, r.x, r.y], { kind: 'tractor', life: 0.03 });
        let best = null, bd = 1e9;
        for (const c of Wd.chunks) { const d = Math.hypot(c.x - r.x, c.y - r.y); if (d < c.rad + 10 && d < bd) { bd = d; best = c; } }
        if (best) { Wd.chunks.splice(Wd.chunks.indexOf(best), 1); best.held = true; st.held = best; A('grab'); }
        else if (r.hit && st.grabT > 0.12) { const c = Wd.grabDisk(r.x + o.ax * 6, r.y + o.ay * 6, 9.5); if (c) { st.held = c; A('grab'); G()?.shake?.(4); } st.grabT = 0; }
      }
      if (st.held) {
        const c = st.held;
        const tx = o.x + o.ax * (c.rad + 8), ty = o.y + o.ay * (c.rad + 8);
        c.vx = (tx - c.x) * 18; c.vy = (ty - c.y) * 18;
        c.x += c.vx * dt; c.y += c.vy * dt; c.a += dt * 2;
        FX().beam([o.x, o.y, c.x, c.y], { kind: 'tractor', life: 0.03 });
        if (Math.random() < 0.3) FX().spark(c.x + rand(-c.rad, c.rad), c.y + rand(-c.rad, c.rad), 0, -20, P32.y, 0.2);
      }
    },
    magnet(o, dt) {
      const Wd = W();
      const base = Math.atan2(o.ay, o.ax);
      let got = 0;
      for (let k = 0; k < 18; k++) {
        const a = base + rand(-0.35, 0.35), d = rand(8, 85);
        const x = Math.floor(o.x + Math.cos(a) * d), y = Math.floor(o.y + Math.sin(a) * d);
        if (x < 0 || x >= Wd.w || y < 0 || y >= Wd.h - 3) continue;
        const i = y * Wd.w + x;
        if (Wd.mat[i] === Wd.SOLID && Wd.kind[i] === Wd.K_TEXT && Wd.gid[i] && Math.random() < 0.18) {
          const gr = Wd.groups[Wd.gid[i]];
          const dx = o.x - (gr.x0 + gr.x1) / 2, dy = o.y - (gr.y0 + gr.y1) / 2, dd = Math.hypot(dx, dy) || 1;
          got += Wd.detachGlyph(Wd.gid[i], (dx / dd) * 160, (dy / dd) * 160 - 40);
        } else if (Wd.mat[i] === Wd.SOLID && Math.random() < 0.2) {
          const c = Wd.col[i];
          got += Wd.kill(i, x, y, x, y, 0, 0);
          FX().mag(x + 0.5, y + 0.5, c);
        } else if (Wd.mat[i] === Wd.RUBBLE || Wd.mat[i] === Wd.DEBRIS) {
          const c = Wd.col[i];
          Wd.kill(i, x, y, x, y, 0, 0);
          FX().mag(x + 0.5, y + 0.5, c);
        }
      }
      FX().magnetize(o.x, o.y, o.ax, o.ay, 90);
      for (const c of Wd.chunks) {
        const dx = o.x - c.x, dy = o.y - c.y, d = Math.hypot(dx, dy) || 1;
        if (d < 110 && (dx * o.ax + dy * o.ay) < 0) { c.vx += (dx / d) * 700 * dt; c.vy += (dy / d) * 700 * dt - 560 * dt * 0.8; c.rest = 0; }
      }
      if (got) G()?.scored?.(got, -1, -1, 'magnet');
      FX().beam([o.x + o.ax * 5, o.y + o.ay * 5, o.x + o.ax * 70, o.y + o.ay * 70], { kind: 'tractor', life: 0.03, c1: P32.e, c2: P32.c });
      EN()?.pull?.(o.x, o.y, 90, 400 * dt);
    },
    wrecking(o, dt) { st.ballPull = true; }
  };
  const RELEASE = {
    gravity(o) {
      if (!st.held) return;
      const c = st.held;
      st.held = null;
      W().releaseChunk(c, o.ax * 460 + PL().vx * 0.5, o.ay * 460 - 30);
      A('fling'); G()?.shake?.(5); G()?.stat?.('throws', 1);
      PL().impulse(-o.ax * 60, -o.ay * 40);
    },
    magnet(o) { FX().fling(o.ax, o.ay, 380); A('fling'); }
  };
  const ALT = {
    sticky() { if (!st.stickies.length) return; st.stickies.forEach((s, k) => { s.fuse = 0.05 + k * 0.07; }); st.stickies = []; A('beep'); },
    mine() { st.mines.forEach((m, k) => { m.trig = 0.05 + k * 0.08; }); A('beep'); },
    portal() { st.portals = []; A('portalOut'); }
  };

  function hitscan(o, range, r, depth, dmg, col, all) {
    const Wd = W();
    let x = o.x, y = o.y, solidN = 0, n = 0, k = 0;
    const x0 = x, y0 = y;
    const hitE = new Set();
    while (Math.hypot(x - x0, y - y0) < range && x > -4 && x < Wd.w + 4 && y > -150 && y < Wd.h) {
      const s = Wd.solid(Math.floor(x), Math.floor(y));
      if (s) {
        solidN++;
        if (solidN > depth) break;
        n += Wd.carve(x, y, r, { debris: 0.35, force: 140, scorch: true, noCrumble: true, cause: 'pierce', pop: 0.8, back: all ? 0.5 : 0 });
        if (++k % 10 === 0) n += Wd.crumble(x, y, 2, 12);
      }
      const e = EN()?.at?.(x, y, r + 2);
      if (e && !hitE.has(e)) { hitE.add(e); e.damage(dmg, 'pierce'); }
      x += o.ax * 1.5; y += o.ay * 1.5;
    }
    FX().beam([x0, y0, x, y], { kind: 'rail', life: all ? 0.55 : 0.3, c1: P32['7'], c2: col, c3: all ? P32.C : P32.a, w: all ? 4 : 2 });
    for (let q = 0; q < (all ? 50 : 20); q++) { const t = Math.random(); FX().spark(x0 + (x - x0) * t, y0 + (y - y0) * t, rand(-30, 30), rand(-30, 30), Math.random() < 0.5 ? col : P32['7'], rand(0.2, 0.5)); }
    const P = PL();
    if (all) { P.impulse(-o.ax * 170, -o.ay * 140); G()?.hitstop?.(0.06); G()?.chroma?.(0.5); }
    if (n > 40) FX().pop((x0 + x) / 2, (y0 + y) / 2, `PIERCE +${n}`, { scale: 1, ramp: ['7', 'C', 'c'] });
    if (n) G()?.scored?.(0, x, y, 'pierce');
  }
  function tesla(o) {
    const Wd = W();
    const pts = [];
    let cx = o.x, cy = o.y;
    const base = Math.atan2(o.ay, o.ax);
    const visited = new Set();
    let tgt = EN()?.nearest?.(cx, cy, 110, base, 0.6);
    let first = tgt ? { x: tgt.x, y: tgt.y, e: tgt } : null;
    if (!first) {
      let best = null, bd = 1e9;
      for (let k = 0; k < 50; k++) {
        const a = base + rand(-0.45, 0.45), d = rand(10, 110);
        const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
        if (Wd.frontAt(Math.floor(x), Math.floor(y))) { const sc = d - (Wd.kind[Math.floor(y) * Wd.w + Math.floor(x)] === Wd.K_TEXT ? 25 : 0); if (sc < bd) { bd = sc; best = { x, y }; } }
      }
      first = best;
    }
    if (!first) {
      const r = Wd.raycast(o.x, o.y, o.ax, o.ay, 90);
      FX().bolt(o.x, o.y, r.x, r.y);
      return;
    }
    let cur = first;
    for (let hop = 0; hop < 6 && cur; hop++) {
      FX().bolt(cx, cy, cur.x, cur.y);
      pts.push(cur);
      if (cur.e) cur.e.damage(28, 'tesla');
      else {
        const i = Math.floor(cur.y) * Wd.w + Math.floor(cur.x);
        if (Wd.kind[i] === Wd.K_TEXT && Wd.gid[i] && Math.random() < 0.7) Wd.detachGlyph(Wd.gid[i], rand(-60, 60), rand(-120, -40));
        Wd.carve(cur.x, cur.y, 3.2, { debris: 0.3, force: 70, scorch: true, cause: 'tesla', ignite: 0.05 });
        for (let z = 0; z < 3; z++) FX().spark(cur.x, cur.y, rand(-80, 80), rand(-80, 40), Math.random() < 0.5 ? P32.C : P32['7'], 0.2);
      }
      cx = cur.x; cy = cur.y;
      visited.add(`${Math.floor(cx / 8)},${Math.floor(cy / 8)}`);
      const e2 = EN()?.nearest?.(cx, cy, 45);
      if (e2 && e2 !== cur.e) { cur = { x: e2.x, y: e2.y, e: e2 }; continue; }
      let nb = null, nd = 1e9;
      for (let k = 0; k < 40; k++) {
        const a = Math.random() * Math.PI * 2, d = rand(8, 42);
        const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
        const key = `${Math.floor(x / 8)},${Math.floor(y / 8)}`;
        if (visited.has(key)) continue;
        if (!Wd.frontAt(Math.floor(x), Math.floor(y))) continue;
        const isT = Wd.kind[Math.floor(y) * Wd.w + Math.floor(x)] === Wd.K_TEXT;
        const sc = d - (isT ? 20 : 0);
        if (sc < nd) { nd = sc; nb = { x, y }; }
      }
      cur = nb;
    }
    G()?.shake?.(2);
  }
  function soundWave(o) {
    st.waves = st.waves || [];
    st.waves.push({ x: o.x, y: o.y, a: Math.atan2(o.ay, o.ax), t: 0, r: 0 });
    FX().beam([o.x, o.y, Math.atan2(o.ay, o.ax)], { kind: 'wave', life: 0.4, r: 120, spread: 0.6 });
    FX().blast(o.x + o.ax * 40, o.y + o.ay * 40, 70, 300);
  }
  function hammer(o) {
    st.swing = 0.22; st.swingDir = PL().face;
    const cx = o.x + o.ax * 7, cy = o.y + o.ay * 7;
    const n = W().carve(cx, cy, 12.5, { debris: 0.55, force: 150, cause: 'hammer', letters: 6 });
    EN()?.damageCircle?.(cx, cy, 15, 50, 'hammer');
    if (n) {
      G()?.shake?.(10); G()?.hitstop?.(0.05);
      A('hammer');
      FX().anim('ring', 32, cx, cy, 0.2);
      const P = PL();
      if (o.ay > 0.45) { P.vy = Math.min(P.vy, -230); P.ground = false; P.jumps = 1; }
      else P.vx -= o.ax * 70;
      WTP.vibe(30);
    }
  }
  function katana(o) {
    st.katanaDir *= -1;
    st.swing = 0.18; st.swingDir = st.katanaDir;
    const base = Math.atan2(o.ay, o.ax);
    const Wd = W();
    let n = 0;
    const R = PL().dashT > 0 ? 26 : 19;
    const span = 1.1;
    for (let r = R - 3; r <= R; r += 1.5) {
      for (let a = -span; a <= span; a += 0.05) {
        const ang = base + a * st.katanaDir;
        n += Wd.carve(o.x - o.ax * 6 + Math.cos(ang) * r, o.y - o.ay * 6 + Math.sin(ang) * r, 0.9, { debris: 0.12, force: 60, noCrumble: true, pop: 0, cause: 'katana' });
      }
    }
    n += Wd.crumble(o.x, o.y, 0, R + 6);
    for (let k = 0; k < 4; k++) { const a = base + rand(-span, span); Wd.letterRing(o.x + Math.cos(a) * R * 0.6, o.y + Math.sin(a) * R * 0.6, 0, 5, 120); }
    EN()?.damageCircle?.(o.x + o.ax * 12, o.y + o.ay * 12, R, 45, 'katana');
    FX().anims.push({ slash: true, x: o.x - o.ax * 4, y: o.y - o.ay * 4, a: base, dir: st.katanaDir, t: 0, dur: 0.16, r: R });
    if (n) { G()?.shake?.(3); G()?.hitstop?.(0.03); A('impact'); }
  }

  function tryFire(d, o) {
    if (st.ammo) {
      const left = st.ammo[d.id];
      if (left == null) return false;
      if (left <= 0) { G()?.label?.('OUT OF AMMO', 700); A('deny'); st.cd = 0.4; return false; }
    }
    const res = FIRE[d.id] ? FIRE[d.id](o) : null;
    if (res === false) return false;
    if (st.ammo) { st.ammo[d.id]--; G()?.ammoChanged?.(); }
    const P = PL();
    P.recoil = Math.max(P.recoil, d.recoil || 0);
    if (d.kick) P.impulse(-o.ax * d.kick, -o.ay * d.kick * (d.id === 'shotgun' || d.id === 'double' ? 1.1 : 0.8));
    if (d.shake) G()?.shake?.(d.shake);
    if (d.flash) FX().flashSprite(d.flash, o.x, o.y, Math.atan2(o.ay, o.ax));
    if (d.shell) FX().shell(o.hx, o.hy - 1, PL().face, d.id === 'shotgun' ? P32.e : P32.a);
    if (d.snd) A(d.snd);
    if (d.throw) { st.swing = 0.15; st.swingDir = 1; }
    G()?.stat?.('shots', 1);
    G()?.weaponUsed?.(d.id);
    return true;
  }
  let wasFiring = false;
  function update(dt, want, alt, o) {
    const d = BY[st.cur];
    st.cd = Math.max(0, st.cd - dt);
    st.reload = Math.max(0, st.reload - dt);
    if (st.reload === 0 && st.reloadFor) { st.mag[st.reloadFor] = 6; st.reloadFor = null; }
    st.swing = Math.max(0, (st.swing || 0) - dt);
    st.ballPull = false;
    st.eraserAt = null;
    if (d.spin) {
      if (want) st.spin = Math.min(1, st.spin + dt * 1.8); else st.spin = Math.max(0, st.spin - dt * 1.2);
      WTP.audio.loop('spin', st.spin > 0.02, st.spin);
    }
    if (d.charge) {
      if (want && st.cd <= 0) { if (st.charge === 0) A('charge'); st.charge += dt; if (Math.random() < 0.5) FX().spark(o.x + rand(-2, 2), o.y + rand(-2, 2), rand(-20, 20), rand(-20, 20), P32.C, 0.15); }
      else st.charge = 0;
    }
    if (d.hold) {
      const ok = !st.ammo || (st.ammo[d.id] ?? 0) > 0;
      if (want && ok) {
        HOLD[d.id](o, dt);
        if (d.loop) WTP.audio.loop(d.loop, true);
        if (st.ammo && (st.holdAcc = (st.holdAcc || 0) + dt) > 0.5) { st.holdAcc = 0; st.ammo[d.id]--; G()?.ammoChanged?.(); }
        if (!wasFiring) { G()?.stat?.('shots', 1); }
        G()?.weaponUsed?.(d.id, dt);
        G()?.startTimer?.();
      } else if (d.loop) WTP.audio.loop(d.loop, false);
      if (wasFiring && !want && RELEASE[d.id]) RELEASE[d.id](o);
    } else if (want && st.cd <= 0 && st.reload <= 0) {
      const ready = !(d.spin && st.spin < 1) && !(d.charge && st.charge < d.charge);
      if (ready && tryFire(d, o)) { st.cd = d.rate; st.charge = 0; G()?.startTimer?.(); }
    }
    if (alt && ALT[d.id]) ALT[d.id](o);
    wasFiring = want;
    if (d.id === 'wrecking' || st.ball) updateBall(dt, o, d.id === 'wrecking');
    if (d.id !== 'gravity' && st.held) RELEASE.gravity(o);
    updateShots(dt);
    updateWaves(dt);
    updateTornados(dt);
    updateQuake(dt);
    updatePortals(dt);
    for (let k = FX().anims.length - 1; k >= 0; k--) { const a = FX().anims[k]; if (a.slash) { a.t += dt; if (a.t > a.dur) FX().anims.splice(k, 1); } }
    if (d.id === 'sniper' && !st.cd) {
      const r = W().raycast(o.x, o.y, o.ax, o.ay, 300, 1);
      FX().beam([o.x, o.y, r.x, r.y], { kind: 'sight', life: 0.02, c1: P32.e });
    }
  }
  function updateBall(dt, o, active) {
    const P = PL();
    if (!st.ball) st.ball = { x: o.hx + 10, y: o.hy, vx: 0, vy: 0, len: 26, r: 4.5 };
    const b = st.ball;
    if (!active) { st.ball = null; return; }
    const hx = o.hx, hy = o.hy;
    b.vy += 520 * dt;
    if (st.ballPull) {
      const tx = hx + o.ax * b.len, ty = hy + o.ay * b.len;
      b.vx += (tx - b.x) * 40 * dt; b.vy += (ty - b.y) * 40 * dt;
      const tang = { x: -o.ay, y: o.ax };
      b.vx += tang.x * 300 * dt * P.face; b.vy += tang.y * 300 * dt * P.face;
    }
    b.vx *= 0.995; b.vy *= 0.995;
    b.x += b.vx * dt; b.y += b.vy * dt;
    const dx = b.x - hx, dy = b.y - hy, d = Math.hypot(dx, dy) || 1;
    if (d > b.len) {
      const nx = dx / d, ny = dy / d;
      b.x = hx + nx * b.len; b.y = hy + ny * b.len;
      const vr = b.vx * nx + b.vy * ny;
      if (vr > 0) { b.vx -= vr * nx; b.vy -= vr * ny; }
    }
    const sp = Math.hypot(b.vx, b.vy);
    const Wd = W();
    if (Wd.solid(Math.floor(b.x), Math.floor(b.y))) {
      if (sp > 90) {
        const n = Wd.carve(b.x, b.y, b.r + Math.min(4, sp / 120), { debris: 0.5, force: sp * 0.5, cause: 'wrecking', letters: 4 });
        if (n) { G()?.shake?.(Math.min(8, sp / 60)); if (sp > 200) { A('hammer'); G()?.hitstop?.(0.03); } }
        b.vx *= 0.72; b.vy *= 0.72;
      } else { b.vx *= -0.3; b.vy *= -0.3; b.y -= 1; }
    }
    EN()?.damageCircle?.(b.x, b.y, b.r + 3, sp * 0.08 * dt * 10, 'wrecking');
    if (sp > 160 && Math.random() < 0.4) FX().trail(b.x, b.y, P32['4'], 0.2);
    if (sp > 230 && st.ballPull && (b.wT = (b.wT || 0) - dt) <= 0) { b.wT = 0.35; A('swoosh'); }
  }
  function updateWaves(dt) {
    if (!st.waves) return;
    const Wd = W();
    for (let k = st.waves.length - 1; k >= 0; k--) {
      const w = st.waves[k];
      const r0 = w.r;
      w.t += dt; w.r = w.t * 300;
      if (w.r > 120) { st.waves.splice(k, 1); continue; }
      let n = 0;
      for (let a = -0.6; a <= 0.6; a += 0.04) {
        for (let rr = r0; rr < w.r; rr += 3) {
          if (Math.random() > 0.35 * (1 - rr / 140)) continue;
          const x = w.x + Math.cos(w.a + a) * rr, y = w.y + Math.sin(w.a + a) * rr;
          n += Wd.carve(x, y, 2.4, { debris: 0.4, force: 160, noCrumble: true, cause: 'sound', pop: 0.6 });
        }
      }
      const mx = w.x + Math.cos(w.a) * w.r, my = w.y + Math.sin(w.a) * w.r;
      Wd.crumble(mx, my, 0, 26);
      EN()?.damageCircle?.(mx, my, 20, 30 * dt * 4, 'sound');
      for (const c of Wd.chunks) { const d = Math.hypot(c.x - mx, c.y - my); if (d < 30) { c.vx += Math.cos(w.a) * 200; c.vy += Math.sin(w.a) * 200 - 80; } }
      if (n) G()?.shake?.(3);
    }
  }
  function updateTornados(dt) {
    const Wd = W();
    for (let k = st.tornados.length - 1; k >= 0; k--) {
      const T = st.tornados[k];
      T.t += dt;
      if (T.t > T.life) { st.tornados.splice(k, 1); if (!st.tornados.length) WTP.audio.loop('wind', false); FX().smoke(T.x, T.y - 10, 8, P32['5']); continue; }
      WTP.audio.loop('wind', true);
      const P0 = PL();
      const chase = Math.sign(P0.x - T.x) * 0.15;
      T.x += (T.dir + Math.sin(T.t * 1.3) * 0.6 + chase) * 30 * dt;
      if (T.x < 6) { T.x = 6; T.dir = 1; } else if (T.x > Wd.w - 6) { T.x = Wd.w - 6; T.dir = -1; }
      let gy = T.y;
      if (!Wd.solid(Math.floor(T.x), Math.floor(gy + 1))) { for (let s = 0; s < 200 && !Wd.solid(Math.floor(T.x), Math.floor(gy + 1)); s++) gy++; }
      else for (let s = 0; s < 40 && Wd.solid(Math.floor(T.x), Math.floor(gy)); s++) gy--;
      T.y += (gy - T.y) * Math.min(1, dt * 3);
      const H = 78;
      const grow = Math.min(1, T.t / 0.6) * Math.min(1, (T.life - T.t) / 0.5);
      let n = 0;
      for (let q = 0; q < 70 * grow; q++) {
        const hh = rand(-10, H), wdt = 5 + Math.max(0, hh) * 0.36;
        const x = T.x + rand(-wdt, wdt) + Math.sin(T.t * 6 + hh * 0.1) * 4, y = T.y - hh;
        const ix = Math.floor(x), iy = Math.floor(y);
        if (ix < 0 || iy < 0 || ix >= Wd.w || iy >= Wd.h - 3) continue;
        const i = iy * Wd.w + ix;
        const m = Wd.mat[i];
        if ((m === Wd.SOLID || m === Wd.RUBBLE || m === Wd.DEBRIS || m === Wd.ICE) && Math.random() < (hh < 6 ? 0.7 : 0.35)) {
          const c = Wd.col[i];
          n += Wd.kill(i, ix, iy, ix, iy, 0, 0);
          FX().suck(x, y, rand(-60, 60), -rand(40, 120), c, T.x + Math.sin(T.t * 4) * 10, T.y - H - 10, 1.6);
        }
      }
      if (n) { G()?.scored?.(n, -1, -1, 'tornado'); if (Math.random() < 0.25) Wd.crumble(T.x, T.y - 20, 0, 36); if (Math.random() < 0.2) Wd.letterRing(T.x, T.y - 10, 0, 22, 140); }
      for (let q = 0; q < 5; q++) { const hh = Math.random() * H; FX().pix(T.x + Math.sin(T.t * 9 + hh) * (5 + hh * 0.36), T.y - hh, rand(-40, 40), -rand(20, 60), Math.random() < 0.5 ? P32['5'] : P32['6'], 0.35); }
      if (Math.random() < 0.5) FX().dust(T.x + rand(-12, 12), T.y - 2);
      FX().suckAll(T.x, T.y - H / 2, 50, 1);
      for (const c of Wd.chunks) { const d = Math.hypot(c.x - T.x, c.y - (T.y - 35)); if (d < 55) { c.vx += (T.x - c.x) * 4 * dt + T.dir * 40 * dt; c.vy -= 900 * dt; c.va += dt * 6; c.rest = 0; } }
      const P = PL(), pc = P.center(), d = Math.hypot(pc.x - T.x, pc.y - (T.y - 30));
      if (d < 40) { P.vx += (T.x - pc.x) * 6 * dt; P.vy -= 700 * dt; }
      EN()?.damageCircle?.(T.x, T.y - 30, 30, 40 * dt, 'tornado');
      G()?.shake?.(1.5);
    }
  }
  function updateQuake(dt) {
    if (st.quakeT <= 0) return;
    st.quakeT -= dt;
    WTP.audio.loop('rumble', st.quakeT > 0);
    const g = G(); if (!g) return;
    g.shake(Math.min(14, 6 + st.quakeT * 3));
    const Wd = W();
    const v = g.view();
    let n = 0;
    for (let k = 0; k < 6; k++) {
      const x = v.x + Math.random() * v.w, y = v.y + Math.random() * v.h;
      const p = Wd.nearestSolid(x, y, 14);
      if (!p) continue;
      n += Wd.carve(p[0], p[1], rand(1.5, 3.2), { debris: 0.5, force: 80, cause: 'quake', pop: 0.7, crumbleR: 10 });
    }
    if (Math.random() < 0.25) Wd.crumble(v.x + Math.random() * v.w, v.y + Math.random() * v.h, 0, 40);
    for (const c of Wd.chunks) if (Math.random() < 0.05) { c.vy -= 120; c.vx += rand(-60, 60); c.rest = 0; }
    EN()?.damageCircle?.(PL().x, PL().y, 500, 8 * dt, 'quake');
    if (st.quakeT <= 0) WTP.audio.loop('rumble', false);
  }
  function updatePortals(dt) {
    if (st.portals.length < 2) return;
    const [b, o] = st.portals;
    const P = PL();
    st.portalCd = Math.max(0, (st.portalCd || 0) - dt);
    const pc = P.center();
    for (const [src, dst] of [[b, o], [o, b]]) {
      if (st.portalCd <= 0 && Math.hypot(pc.x - src.x, pc.y - src.y) < 7) {
        P.x = dst.x + dst.nx * 9 - P.w / 2; P.y = dst.y + dst.ny * 9 - P.h / 2;
        const sp = Math.max(160, Math.hypot(P.vx, P.vy));
        P.vx = dst.nx * sp; P.vy = dst.ny * sp - 40;
        st.portalCd = 0.35;
        A('portalOut'); G()?.stat?.('portals', 1);
        for (let k = 0; k < 12; k++) FX().spark(dst.x, dst.y, rand(-80, 80), rand(-80, 80), dst === b ? P32.c : P32.o, 0.3);
      }
    }
    for (const s of shots) {
      if (s.t === 'portal' || s.portalCd > 0) { s.portalCd = Math.max(0, (s.portalCd || 0) - dt); continue; }
      for (const [src, dst] of [[b, o], [o, b]]) {
        if (Math.hypot(s.x - src.x, s.y - src.y) < 6) {
          const sp = Math.hypot(s.vx, s.vy);
          s.x = dst.x + dst.nx * 6; s.y = dst.y + dst.ny * 6; s.vx = dst.nx * sp; s.vy = dst.ny * sp; s.portalCd = 0.2;
          break;
        }
      }
    }
    for (const c of W().chunks) {
      for (const [src, dst] of [[b, o], [o, b]]) {
        if (!c.portalCd && Math.hypot(c.x - src.x, c.y - src.y) < 8) {
          const sp = Math.max(120, Math.hypot(c.vx, c.vy));
          c.x = dst.x + dst.nx * (c.rad + 4); c.y = dst.y + dst.ny * (c.rad + 4); c.vx = dst.nx * sp; c.vy = dst.ny * sp; c.portalCd = 0.3; c.rest = 0;
          break;
        }
      }
      if (c.portalCd) c.portalCd = Math.max(0, c.portalCd - dt);
    }
  }

  function physStep(s, dt, bounceK) {
    const Wd = W();
    const steps = Math.max(1, Math.ceil(Math.hypot(s.vx, s.vy) * dt));
    let hit = false;
    for (let q = 0; q < steps; q++) {
      const nx = s.x + (s.vx * dt) / steps, ny = s.y + (s.vy * dt) / steps;
      if (Wd.solid(Math.floor(nx), Math.floor(s.y))) { s.vx = -s.vx * bounceK; hit = 'x'; } else s.x = nx;
      if (Wd.solid(Math.floor(s.x), Math.floor(ny))) { if (Math.abs(s.vy) > 40 && s.t === 'grenade') A('ball'); s.vy = -s.vy * bounceK * 0.85; s.vx *= 0.8; hit = hit || 'y'; } else s.y = ny;
    }
    return hit;
  }
  function travel(s, dt, onHit) {
    const Wd = W();
    const dist = Math.hypot(s.vx, s.vy) * dt;
    const steps = Math.max(1, Math.ceil(dist / 0.7));
    for (let q = 0; q < steps; q++) {
      s.x += (s.vx * dt) / steps; s.y += (s.vy * dt) / steps;
      const ix = Math.floor(s.x), iy = Math.floor(s.y);
      if (ix < -6 || ix >= Wd.w + 6 || iy >= Wd.h || iy < -400) return true;
      if (s.from === 'p') {
        const e = EN()?.at?.(s.x, s.y, s.rad || 2);
        if (e && !(s.hitSet && s.hitSet.has(e))) {
          e.damage(s.dmg || 10, s.t);
          if (s.pierce) { (s.hitSet = s.hitSet || new Set()).add(e); } else if (onHit(s.x, s.y, true, e)) return true;
        }
      }
      if (Wd.solid(ix, iy)) { if (onHit(s.x, s.y, false)) return true; }
    }
    return false;
  }
  function stickSurface(s) {
    const Wd = W();
    let nx = 0, ny = 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (Wd.solid(Math.floor(s.x + dx * 2), Math.floor(s.y + dy * 2))) { nx -= dx; ny -= dy; }
    const m = Math.hypot(nx, ny) || 1;
    return { nx: nx / m || 0, ny: ny / m || -1 };
  }

  function impactChunk(c, r) {
    explode(c.x, c.y, r, { letters: 8, fire: 0.03, cause: 'throw', sound: 'boom' });
  }

  function updateShots(dt) {
    const Wd = W();
    for (let k = shots.length - 1; k >= 0; k--) {
      const s = shots[k];
      if (s.delay > 0) { s.delay -= dt; continue; }
      s.age += dt; s.life -= dt;
      let dead = s.life <= 0;
      switch (s.t) {
        case 'bullet': {
          if (dead) break;
          const pierced = s.pierce || 0;
          dead = travel(s, dt, (x, y, isE) => {
            if (isE) { FX().spark(x, y, rand(-50, 50), rand(-50, 50), P32.y); return true; }
            const n = Wd.carve(x, y, s.r, { debris: 0.6, force: 70, cause: 'bullet', vx: s.vx, vy: s.vy, noCrumble: !!s.pierce });
            if (s.nail && Math.random() < 0.6) Wd.placeRubble(Math.floor(x), Math.floor(y), P32['5']);
            for (let z = 0; z < 2; z++) FX().spark(x, y, -s.vx * 0.15 + rand(-50, 50), -s.vy * 0.15 + rand(-50, 50), P32.Y, rand(0.08, 0.2));
            A('impact');
            if (pierced > 0) { s.pierce -= Math.max(1, s.r * 1.5); if (s.pierce > 0) { if (n) Wd.crumble(x, y, 2, 8); return false; } }
            return true;
          });
          if (!dead && Math.random() < 0.6) FX().trail(s.x - s.vx * 0.006, s.y - s.vy * 0.006, P32.a, 0.06);
          break;
        }
        case 'confetti':
          dead = dead || travel(s, dt, (x, y, isE) => { if (!isE) { Wd.paintAt(x, y, 2.5, s.col); Wd.carve(x, y, 1.4, { debris: 0.4, force: 40, cause: 'confetti', pop: 0.25 }); } return true; });
          break;
        case 'flame': {
          s.vy -= 70 * dt; s.vx *= 0.985; s.vy *= 0.985;
          const k2 = s.age / 0.45;
          if (Math.random() < 0.5) FX().flame(s.x, s.y);
          if (dead) break;
          dead = travel(s, dt, (x, y, isE, e) => {
            if (isE) { e.burn = 2; return true; }
            const ix = Math.floor(x), iy = Math.floor(y);
            Wd.igniteAt(ix, iy, 8);
            return true;
          });
          s.r = 1 + k2 * 4;
          break;
        }
        case 'flak': {
          s.vy += (s.g || 0) * dt;
          const burst = () => {
            explode(s.x, s.y, 6, { letters: 2, fire: 0.05, sound: 'impact', noPush: true });
            for (let q = 0; q < 14; q++) { const a = Math.atan2(s.vy, s.vx) + rand(-0.9, 0.9), sp = rand(300, 460); addShot({ t: 'bullet', x: s.x, y: s.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.2, 0.35), r: 2.8, dmg: 9, spr: 'pellet' }); }
            A('flak');
          };
          if (dead) { burst(); break; }
          dead = travel(s, dt, () => { burst(); return true; });
          break;
        }
        case 'flare': case 'aflare': {
          if (!s.stuck) {
            s.vy += (s.g || 520) * dt;
            const h = physStep(s, dt, 0.3);
            if (h && (s.t === 'flare' || Math.hypot(s.vx, s.vy) < 50)) { s.stuck = true; s.vx = 0; s.vy = 0; }
          }
          if (Math.random() < 0.7) FX().smoke(s.x, s.y - 1, 1, Math.random() < 0.5 ? P32.e : P32.K);
          if (Math.random() < 0.5) FX().spark(s.x, s.y, rand(-30, 30), rand(-60, -10), P32.y, 0.2);
          if (s.t === 'flare') {
            if (s.stuck) { s.burnT -= dt; if (Math.random() < 0.5) Wd.igniteAt(Math.floor(s.x + rand(-5, 5)), Math.floor(s.y + rand(-5, 5)), 2); if (s.burnT <= 0) dead = true; }
            EN()?.damageCircle?.(s.x, s.y, 8, 20 * dt, 'flare');
          } else {
            s.fuse -= dt;
            if (s.fuse <= 0 && !s.called) {
              s.called = true; s.life = 2.6;
              A('siren');
              G()?.event?.('INCOMING!', s.x, s.y - 14);
              const top = Math.min(s.y - 60, (G()?.camTop?.() ?? s.y - 120) - 10);
              for (let b = 0; b < 8; b++) addShot({ t: 'bomb', x: s.x + rand(-26, 26) + (b - 3.5) * 5, y: top - b * 22, vx: rand(-5, 5), vy: 140, life: 8, delay: 0.4 + b * 0.15, spr: 'bomb', dmg: 50 });
            }
          }
          break;
        }
        case 'bomb':
          if (!s.whistled) { s.whistled = true; A('whistle'); }
          s.vy = Math.min(560, s.vy + 600 * dt);
          dead = dead || travel(s, dt, (x, y) => { explode(x, y + 2, 16, { letters: 8 }); WTP.vibe(30); return true; });
          break;
        case 'meteor':
          if (!s.whistled) { s.whistled = true; A('meteor'); }
          s.vy = Math.min(520, s.vy + 300 * dt);
          if (Math.random() < 0.9) FX().flame(s.x - s.vx * 0.01, s.y - s.vy * 0.01);
          if (Math.random() < 0.5) FX().smoke(s.x, s.y, 1);
          dead = dead || travel(s, dt, (x, y) => { explode(x, y, rand(11, 16), { fire: 0.4, letters: 10 }); return true; });
          break;
        case 'rocket': {
          const sp = Math.hypot(s.vx, s.vy);
          const ns = Math.min(480, sp + 900 * dt);
          s.vx *= ns / sp; s.vy *= ns / sp;
          if (Math.random() < 0.9) FX().smoke(s.x - s.vx * 0.012, s.y - s.vy * 0.012, 1);
          if (Math.random() < 0.6) FX().flame(s.x - s.vx * 0.014, s.y - s.vy * 0.014);
          if (dead) { explode(s.x, s.y, 22); break; }
          dead = travel(s, dt, (x, y) => { explode(x, y, 22); return true; });
          break;
        }
        case 'missile': {
          const dx = s.tx - s.x, dy = s.ty - s.y, d = Math.hypot(dx, dy) || 1;
          const sp = Math.min(380, Math.hypot(s.vx, s.vy) + 600 * dt);
          const want = Math.atan2(dy, dx), cur = Math.atan2(s.vy, s.vx);
          let da = want - cur; while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2;
          const na = cur + Math.max(-6 * dt, Math.min(6 * dt, da)) * (s.age > 0.15 ? 1 : 0.2);
          s.vx = Math.cos(na) * sp; s.vy = Math.sin(na) * sp;
          if (Math.random() < 0.8) FX().smoke(s.x, s.y, 1, P32['5']);
          if (dead || d < 3) { explode(s.x, s.y, 10, { letters: 6 }); dead = true; break; }
          dead = travel(s, dt, (x, y) => { explode(x, y, 10, { letters: 6 }); return true; });
          break;
        }
        case 'plasma':
          if (Math.random() < 0.7) FX().spark(s.x, s.y, rand(-20, 20), rand(-20, 20), Math.random() < 0.5 ? P32.m : P32.K, 0.25);
          if (dead) { explode(s.x, s.y, 11, { kind: 'plasma', fire: 0, letters: 8 }); break; }
          dead = travel(s, dt, (x, y) => { explode(x, y, 11, { kind: 'plasma', fire: 0, letters: 8 }); return true; });
          break;
        case 'glitch':
          if (Math.random() < 0.8) FX().pix(s.x + rand(-2, 2), s.y + rand(-2, 2), 0, 0, P32[pick(['k', 'C', 'P', 'l'])], 0.2);
          if (dead) { glitchAt(s.x, s.y); break; }
          dead = travel(s, dt, (x, y) => { glitchAt(x, y); return true; });
          break;
        case 'paint':
          s.vy += (s.g || 0) * dt;
          dead = dead || travel(s, dt, (x, y, isE) => {
            if (!isE) {
              const n = Wd.paintAt(x, y, 5.5, s.col);
              if (n) G()?.stat?.('painted', n);
              for (let q = 0; q < 4; q++) FX().paint(x, y, rand(-50, 50), rand(-80, 0), s.col);
              A('paint');
            }
            return true;
          });
          break;
        case 'lavab':
          s.vy += s.g * dt;
          if (Math.random() < 0.5) FX().spark(s.x, s.y, rand(-10, 10), rand(-10, 10), P32.a, 0.2);
          dead = dead || travel(s, dt, (x, y) => {
            Wd.carve(x, y, 4, { debris: 0.3, force: 40, scorch: true, ignite: 0.3, cause: 'lava' });
            for (let q = 0; q < 10; q++) FX().lava(x + rand(-3, 3), y - 2, rand(-50, 50), rand(-60, 0));
            FX().anim('fire', 14, x, y, 0.3);
            A('lava');
            return true;
          });
          break;
        case 'snow':
          s.vy += s.g * dt;
          dead = dead || travel(s, dt, (x, y, isE, e) => {
            if (isE) { e.freeze = 2.5; }
            Wd.freezeAt(x, y, 5);
            for (let q = 0; q < 8; q++) FX().pix(x, y, rand(-60, 60), rand(-80, 0), P32['7'], 0.5);
            A('snow');
            return true;
          });
          break;
        case 'grenade': case 'cluster': case 'banana': case 'mini': {
          s.vy += (s.g || 520) * dt;
          s.spin += s.vx * dt * 0.1;
          const h = physStep(s, dt, s.bounce || 0.5);
          s.fuse -= dt;
          if (s.t === 'cluster' && (h || s.fuse <= 0) && s.age > 0.15) {
            explode(s.x, s.y, 9, { letters: 4 });
            for (let q = 0; q < 7; q++) { const a = -Math.PI / 2 + rand(-1.2, 1.2), sp = rand(120, 220); addShot({ t: 'mini', x: s.x, y: s.y - 2, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, fuse: rand(0.45, 0.9), life: 3, spr: 'bomblet', g: 500, bounce: 0.4, spin: 0, r: 10 }); }
            dead = true; break;
          }
          if (s.fuse <= 0) {
            if (s.t === 'banana' && s.big) {
              explode(s.x, s.y, 13, { letters: 8 });
              for (let q = 0; q < 5; q++) { const a = -Math.PI / 2 + (q - 2) * 0.35, sp = rand(160, 230); addShot({ t: 'banana', x: s.x, y: s.y - 3, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, fuse: rand(0.9, 1.4), life: 4, spr: 'banana', g: 500, bounce: 0.3, spin: 0, big: false }); }
            } else explode(s.x, s.y, s.t === 'grenade' ? 19 : s.t === 'banana' ? 10 : (s.r || 10), { letters: 10 });
            dead = true;
          }
          if (s.t === 'grenade' && Math.random() < 0.3) FX().trail(s.x, s.y - 2, P32['4'], 0.25);
          break;
        }
        case 'sticky': {
          if (!s.stuck) {
            s.vy += s.g * dt;
            dead = dead || travel(s, dt, (x, y, isE, e) => { s.stuck = true; s.on = e || null; if (e) { s.ox = s.x - e.x; s.oy = s.y - e.y; } A('impact'); return false; });
            if (s.stuck) { s.vx = 0; s.vy = 0; }
          } else if (s.on) { if (s.on.dead) s.on = null; else { s.x = s.on.x + s.ox; s.y = s.on.y + s.oy; } }
          s.fuse -= dt;
          if (s.stuck && ((s.age * 4) | 0) % 2 === 0 && Math.random() < 0.1) FX().spark(s.x, s.y - 2, 0, -10, P32.e, 0.1);
          if (s.fuse <= 0) { explode(s.x, s.y, 16, { letters: 8 }); dead = true; const ix = st.stickies.indexOf(s); if (ix >= 0) st.stickies.splice(ix, 1); }
          break;
        }
        case 'mine': {
          if (!s.stuck) { s.vy += s.g * dt; const h = physStep(s, dt, 0.2); if (h === 'y' && Math.abs(s.vy) < 30) { s.stuck = true; s.vx = 0; s.vy = 0; } }
          else if (!Wd.solid(Math.floor(s.x), Math.floor(s.y + 3))) { s.stuck = false; }
          s.arm -= dt;
          if (s.arm <= 0 && s.trig == null) {
            if (EN()?.nearest?.(s.x, s.y, 14)) s.trig = 0.15;
            for (const c of Wd.chunks) if (Math.hypot(c.x - s.x, c.y - s.y) < c.rad + 6) s.trig = 0.15;
            const pc = PL().center();
            if (Math.hypot(pc.x - s.x, pc.y - s.y) < 8 && s.arm < -0.6) s.trig = 0.25;
            if (s.trig != null) A('beep');
          }
          if (s.trig != null) { s.trig -= dt; if (s.trig <= 0) { explode(s.x, s.y - 2, 20, { letters: 12 }); dead = true; } }
          if (dead) { const ix = st.mines.indexOf(s); if (ix >= 0) st.mines.splice(ix, 1); }
          break;
        }
        case 'firework': {
          s.vy -= 120 * dt;
          s.vx += Math.sin(s.age * 25) * 200 * dt;
          if (Math.random() < 0.9) FX().spark(s.x, s.y, rand(-20, 20), rand(20, 60), P32[pick(['y', 'k', 'C', 'l'])], 0.3);
          const burst = () => {
            explode(s.x, s.y, 7, { fire: 0.1, letters: 4, noPush: true });
            const cols = [P32.k, P32.y, P32.C, P32.l, P32.m, P32.o];
            const c1 = pick(cols), c2 = pick(cols);
            for (let q = 0; q < 46; q++) { const a = (q / 46) * Math.PI * 2, sp = rand(110, 190); FX().star(s.x, s.y, Math.cos(a) * sp, Math.sin(a) * sp - 30, q & 1 ? c1 : c2); }
            A('sparkle'); FX().flash(0.15, '#ff5fa2');
          };
          if (dead) { burst(); break; }
          dead = travel(s, dt, () => { burst(); return true; });
          break;
        }
        case 'nuke': {
          s.vy += (s.g || 0) * dt;
          if (Math.random() < 0.6) FX().smoke(s.x, s.y, 1);
          if (((s.age * 6) | 0) !== ((s.age * 6 - dt * 6) | 0)) A('beep');
          const boom = () => nuke(s.x, s.y);
          if (dead) { boom(); break; }
          dead = travel(s, dt, () => { boom(); return true; });
          break;
        }
        case 'bolt': case 'harpoon': {
          s.vy += (s.g || 0) * dt;
          if (s.t === 'harpoon') FX().beam([PL().gun().x, PL().gun().y, s.x, s.y], { kind: 'rope', life: 0.02 });
          if (dead) break;
          dead = travel(s, dt, (x, y, isE, e) => {
            if (s.t === 'harpoon') {
              const c = isE ? null : Wd.grabDisk(x + s.vx * 0.012, y + s.vy * 0.012, 8);
              if (isE) { e.vx = (e.vx || 0) - s.vx * 0.5; e.vy = (e.vy || 0) - 200; }
              if (c) { const g0 = PL().gun(); const dx = g0.x - c.x, dy = g0.y - c.y, d = Math.hypot(dx, dy) || 1; W().releaseChunk(c, (dx / d) * 330, (dy / d) * 330 - 120); c.thrown = false; A('fling'); G()?.shake?.(4); }
              else if (!isE) Wd.carve(x, y, 4, { cause: 'harpoon' });
              return true;
            }
            if (isE) return false;
            Wd.carve(x, y, 1.9, { debris: 0.3, force: 60, noCrumble: true, cause: 'bolt', pop: 1 });
            s.pierce -= 1;
            if (s.pierce <= 0) { Wd.crumble(x, y, 0, 14); A('impact'); s.stuckT = 3; return true; }
            return false;
          });
          break;
        }
        case 'portal':
          dead = dead || travel(s, dt, (x, y) => {
            const n = stickSurface({ x, y });
            const p = { x: x - s.vx * 0.004, y: y - s.vy * 0.004, nx: n.nx, ny: n.ny, which: s.which, t: 0 };
            Wd.carve(x, y, 3, { debris: 0.2, cause: 'portal', pop: 0.4 });
            st.portals[s.which] = p;
            A('portal');
            for (let q = 0; q < 10; q++) FX().spark(x, y, rand(-60, 60), rand(-60, 60), s.which ? P32.o : P32.c, 0.3);
            return true;
          });
          break;
        case 'ball': {
          s.vy += s.g * dt;
          const before = Math.hypot(s.vx, s.vy);
          const h = physStep(s, dt, 0.88);
          if (h) {
            const n = Wd.carve(s.x, s.y, 3.2, { debris: 0.5, force: 80, cause: 'ball', pop: 0.5 });
            s.bounces--; A('ball');
            if (n) { const sp = Math.max(before, 260) * 1.02; const m = Math.hypot(s.vx, s.vy) || 1; s.vx = (s.vx / m) * sp; s.vy = (s.vy / m) * sp; }
            if (s.bounces <= 0) dead = true;
          }
          const e = EN()?.at?.(s.x, s.y, 3);
          if (e) { e.damage(s.dmg, 'ball'); s.vx = -s.vx; s.vy = -Math.abs(s.vy); s.bounces--; }
          if (Math.random() < 0.5) FX().trail(s.x, s.y, P32.K, 0.15);
          break;
        }
        case 'boomerang': {
          s.spin += dt * 25;
          if (s.age > s.out) {
            const g0 = PL().gun();
            const dx = g0.x - s.x, dy = g0.y - s.y, d = Math.hypot(dx, dy) || 1;
            s.vx += (dx / d) * 1500 * dt; s.vy += (dy / d) * 1500 * dt;
            const sp = Math.hypot(s.vx, s.vy); if (sp > 360) { s.vx *= 360 / sp; s.vy *= 360 / sp; }
            if (d < 6 || s.life <= 0.05) { dead = true; }
          }
          s.x += s.vx * dt; s.y += s.vy * dt;
          Wd.carve(s.x, s.y, 3.6, { debris: 0.4, force: 70, cause: 'boomerang', noCrumble: Math.random() < 0.7, pop: 0.5 });
          EN()?.damageCircle?.(s.x, s.y, 6, s.dmg * dt * 4, 'boomerang');
          A('boomerang');
          if (dead) st.boomers = Math.max(0, st.boomers - 1);
          break;
        }
        case 'bhole': {
          if (!s.on) {
            const dr = Math.pow(0.08, dt); s.vx *= dr; s.vy *= dr;
            physStep(s, dt, 0.3);
            if (s.age > 0.55 || Math.hypot(s.vx, s.vy) < 25) { s.on = true; s.life = 2.8; s.hr = 4; A('hole'); WTP.audio.loop('hole', true); }
          } else blackHole(s, dt);
          if (s.life <= 0 && s.on) { explode(s.x, s.y, 22, { kind: 'plasma', letters: 14 }); WTP.audio.loop('hole', false); dead = true; }
          break;
        }
        case 'beacon': {
          if (!s.stuck) { s.vy += s.g * dt; const h = physStep(s, dt, 0.25); if (h && Math.hypot(s.vx, s.vy) < 60) { s.stuck = true; s.vx = 0; s.vy = 0; } }
          s.fuse -= dt;
          if (((s.age * 8) | 0) % 2 === 0) FX().spark(s.x, s.y - 2, 0, -30, P32.C, 0.1);
          if (s.fuse <= 0 && !s.fired) {
            s.fired = true; s.life = 1.7; A('orbital');
            G()?.event?.('ORBITAL STRIKE!', s.x, s.y - 20);
            setTimeout(() => { A('beam'); WTP.audio.loop('beam', true); }, 250);
            st.orb.push({ x: s.x, t: -0.25, life: 1.5 });
          }
          if (s.life <= 0) dead = true;
          break;
        }
        case 'bee': {
          s.eat -= dt;
          if (s.te && s.te.dead) { s.te = null; s.tx = null; }
          if (s.tx == null || (!s.te && !Wd.frontAt(Math.floor(s.tx), Math.floor(s.ty))) || Math.random() < 0.01) {
            const e = EN()?.nearest?.(s.x, s.y, 90);
            if (e) { s.tx = e.x; s.ty = e.y; s.te = e; }
            else {
              let p = Wd.nearestSolid(s.x + rand(-20, 20), s.y + rand(-20, 20), 50, (i) => Wd.kind[i] === Wd.K_TEXT);
              if (!p) p = Wd.nearestSolid(s.x + rand(-30, 30), s.y + rand(-30, 30), 70);
              if (p) { s.tx = p[0]; s.ty = p[1]; s.te = null; } else { s.tx = s.x + rand(-40, 40); s.ty = s.y + rand(-30, 30); s.te = null; }
            }
          }
          if (s.te) { s.tx = s.te.x; s.ty = s.te.y; }
          const dx = s.tx - s.x, dy = s.ty - s.y, d = Math.hypot(dx, dy) || 1;
          if (d < 9) { s.vx *= 0.82; s.vy *= 0.82; }
          s.vx += (dx / d) * 700 * dt + rand(-160, 160) * dt; s.vy += (dy / d) * 700 * dt + rand(-160, 160) * dt;
          if (d < 4.5 && s.eat <= 0) {
            s.eat = 0.06;
            if (s.te) s.te.damage(s.dmg, 'bee');
            else {
              const got = Wd.carve(s.tx + rand(-1, 1), s.ty + rand(-1, 1), 1.6, { debris: 0.5, force: 30, cause: 'bees', pop: 0.15, noCrumble: Math.random() < 0.7 });
              if (got) { G()?.stat?.('bees', got); if (Math.random() < 0.3) FX().pix(s.x, s.y, rand(-20, 20), rand(-30, 0), P32.y, 0.3); }
              else s.tx = null;
            }
          }
          const sp = Math.hypot(s.vx, s.vy); if (sp > 150) { s.vx *= 150 / sp; s.vy *= 150 / sp; }
          s.x += s.vx * dt; s.y += s.vy * dt;
          if (Math.random() < 0.02) A('buzz');
          if (dead && !shots.some((o2) => o2 !== s && o2.t === 'bee')) WTP.audio.loop('bees', false);
          break;
        }
        default: break;
      }
      if (dead) { const ix = shots.indexOf(s); if (ix >= 0) shots.splice(ix, 1); }
    }
    for (let k = st.orb.length - 1; k >= 0; k--) {
      const O = st.orb[k];
      O.t += dt;
      if (O.t > O.life) { st.orb.splice(k, 1); if (!st.orb.length) WTP.audio.loop('beam', false); continue; }
      if (O.t < 0) continue;
      const top = (G()?.camTop?.() ?? 0) - 40;
      const depth = Math.min(Wd.h - 4, top + (O.t / 0.5) * (Wd.h - top));
      FX().beam([O.x, depth], { kind: 'column', life: 0.03, w: 7 });
      let n = 0;
      for (let y = Math.max(0, Math.floor(depth - 26)); y < depth; y += 3) n += Wd.carve(O.x + rand(-1.5, 1.5), y, 8, { debris: 0.4, force: 160, back: 1, noCrumble: true, cause: 'orbital', pop: 1, ignite: 0.05 });
      if (Math.random() < 0.5) Wd.crumble(O.x, depth - 10, 6, 26);
      Wd.eraseBack(O.x, depth - 12, 9);
      EN()?.damageCircle?.(O.x, depth - 10, 14, 200 * dt, 'orbital');
      const P = PL(), pc = P.center();
      if (Math.abs(pc.x - O.x) < 20) P.vx += (pc.x < O.x ? -1 : 1) * 600 * dt;
      G()?.shake?.(9);
      for (let q = 0; q < 3; q++) FX().spark(O.x + rand(-8, 8), depth, rand(-160, 160), rand(-200, -40), Math.random() < 0.5 ? P32.C : P32['7'], 0.4);
      if (n > 0 && Math.random() < 0.1) G()?.chroma?.(0.3);
    }
  }
  function blackHole(s, dt) {
    const Wd = W();
    s.hr = Math.min(28, s.hr + dt * 16);
    const R = s.hr, R2 = R * R;
    const x0 = Math.max(0, Math.floor(s.x - R)), x1 = Math.min(Wd.w - 1, Math.ceil(s.x + R));
    const y0 = Math.max(0, Math.floor(s.y - R)), y1 = Math.min(Wd.h - 4, Math.ceil(s.y + R));
    let n = 0;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const dx = x + 0.5 - s.x, dy = y + 0.5 - s.y, d2 = dx * dx + dy * dy;
      if (d2 > R2) continue;
      const i = y * Wd.w + x;
      const m = Wd.mat[i];
      if (m !== Wd.SOLID && m !== Wd.RUBBLE && m !== Wd.DEBRIS && m !== Wd.ICE) { if (Wd.back[i] && d2 < R2 * 0.3 && Math.random() < 0.05) Wd.eraseBack(x, y, 1); continue; }
      if (Math.random() > 0.02 + 0.2 * (1 - Math.sqrt(d2) / R)) continue;
      const c = Wd.col[i];
      n += Wd.kill(i, x, y, x, y, 0, 0);
      if (Math.random() < 0.6) FX().suck(x + 0.5, y + 0.5, -dy * 4, dx * 4, c, s.x, s.y, 2.5);
    }
    if (n) { G()?.scored?.(n, -1, -1, 'hole'); G()?.stat?.('eaten', n); if (Math.random() < 0.1) Wd.crumble(s.x, s.y, R - 2, R + 10); }
    G()?.shake?.(2.5);
    const P = PL(), pc = P.center(), dx = s.x - pc.x, dy = s.y - pc.y, d = Math.hypot(dx, dy);
    if (d < 90 && d > 3) { const f = (1 - d / 90) * 520 * dt; P.vx += (dx / d) * f; P.vy += (dy / d) * f; }
    FX().suckAll(s.x, s.y, 100, 1.5);
    for (const c of Wd.chunks) {
      const qx = s.x - c.x, qy = s.y - c.y, qd = Math.hypot(qx, qy) || 1;
      if (qd < 110) { c.vx += (qx / qd) * 900 * dt; c.vy += (qy / qd) * 900 * dt - 560 * dt; c.va += dt * 4; c.rest = 0; }
      if (qd < 6) { c.t = 99; }
    }
    EN()?.pull?.(s.x, s.y, 100, 500 * dt);
    EN()?.damageCircle?.(s.x, s.y, R * 0.8, 60 * dt, 'hole');
    if (Math.random() < 0.6) { const a = Math.random() * 6.28, r = R + rand(4, 18); FX().suck(s.x + Math.cos(a) * r, s.y + Math.sin(a) * r, -Math.sin(a) * 60, Math.cos(a) * 60, Math.random() < 0.5 ? P32.m : P32.K, s.x, s.y, 1.2); }
  }
  function glitchAt(x, y) {
    const Wd = W();
    const w = 30, h = 14;
    const x0 = Math.max(0, Math.floor(x - w / 2)), y0 = Math.max(0, Math.floor(y - h / 2));
    let n = 0;
    for (let yy = y0; yy < Math.min(Wd.h - 4, y0 + h); yy++) {
      const shift = randInt(-6, 6);
      const row = [];
      for (let xx = x0; xx < Math.min(Wd.w, x0 + w); xx++) row.push(Wd.mat[yy * Wd.w + xx] === Wd.SOLID ? Wd.col[yy * Wd.w + xx] : 0);
      for (let xx = x0; xx < Math.min(Wd.w, x0 + w); xx++) {
        const i = yy * Wd.w + xx;
        if (Wd.mat[i] !== Wd.SOLID) continue;
        if (Math.random() < 0.35) { const c = Wd.col[i]; n += Wd.kill(i, xx, yy, x, y, 0, 0); FX().pix(xx, yy, rand(-80, 80), rand(-60, 20), Math.random() < 0.5 ? c : P32[pick(['k', 'C', 'l', 'P'])], rand(0.4, 1)); continue; }
        const src = row[(xx - x0 - shift + row.length * 2) % row.length];
        Wd.col[i] = src ? (Math.random() < 0.2 ? P32[pick(['k', 'C', 'l', 'P', 'y'])] : src) : P32[pick(['k', 'C'])];
        Wd.touch(i);
      }
    }
    Wd.crumble(x, y, 0, 24);
    EN()?.damageCircle?.(x, y, 16, 30, 'glitch');
    if (n) G()?.scored?.(n, x, y, 'glitch');
    G()?.shake?.(4); G()?.chroma?.(0.4);
    A('glitch');
  }
  function nuke(x, y) {
    G()?.stat?.('nukes', 1);
    explode(x, y, 64, { back: 0.95, letters: 30, fire: 0.3, sound: 'nuke', dmg: 999 });
    G()?.slowmo?.(0.25, 1.6);
    FX().flash(1, '#ffffff');
    G()?.chroma?.(1);
    G()?.event?.('KABOOM!', x, y - 40, 3);
    for (let k = 0; k < 40; k++) FX().smoke(x + rand(-14, 14), y - k * 2.5, 1, k < 20 ? P32.a : P32['4']);
    for (let k = 0; k < 30; k++) FX().smoke(x + rand(-40, 40), y - 60 + rand(-10, 10), 1, P32['5']);
    FX().anim('ring', 128, x, y, 0.6);
    setTimeout(() => { explode(x + rand(-30, 30), y + rand(-20, 20), 20, { letters: 10, noPush: true }); }, 250);
    setTimeout(() => { explode(x + rand(-40, 40), y + rand(-30, 30), 18, { letters: 10, noPush: true }); }, 500);
  }

  function draw(ctx) {
    for (const s of shots) {
      if (s.delay > 0) continue;
      const sp = s.spr && PR[s.spr];
      if (s.t === 'flame') {
        const k = Math.min(1, s.age / 0.45), r = Math.round(1 + k * 3);
        ctx.fillStyle = k < 0.25 ? WTP.PAL.Y : k < 0.55 ? WTP.PAL.a : WTP.PAL.o;
        ctx.fillRect(Math.round(s.x - r / 2), Math.round(s.y - r / 2), r, r);
        continue;
      }
      if (s.t === 'confetti' || s.t === 'paint') { ctx.fillStyle = WTP.css32(s.col); ctx.fillRect(Math.round(s.x), Math.round(s.y), 2, 2); continue; }
      if (s.t === 'glitch') { ctx.fillStyle = Math.random() < 0.5 ? WTP.PAL.k : WTP.PAL.C; ctx.fillRect(Math.round(s.x) - 2, Math.round(s.y) - 1, 4 + randInt(0, 3), 2); continue; }
      if (s.t === 'lavab') { ctx.fillStyle = WTP.PAL.o; ctx.fillRect(Math.round(s.x) - 1, Math.round(s.y) - 1, 3, 3); ctx.fillStyle = WTP.PAL.Y; ctx.fillRect(Math.round(s.x), Math.round(s.y) - 1, 1, 1); continue; }
      if (s.t === 'bhole') { drawHole(ctx, s); continue; }
      if (!sp) continue;
      let ang = Math.atan2(s.vy, s.vx);
      if (s.t === 'grenade' || s.t === 'cluster' || s.t === 'mini' || s.t === 'banana' || s.t === 'snow') ang = s.spin || 0;
      if (s.t === 'boomerang') ang = s.spin;
      if (s.t === 'sticky' || s.t === 'mine' || s.t === 'beacon' || s.t === 'ball' || s.t === 'bee' || s.t === 'portal' || s.t === 'flare' || s.t === 'aflare' || s.t === 'meteor') ang = s.t === 'bee' ? (s.vx < 0 ? Math.PI : 0) : 0;
      const flip = (s.t === 'rocket' || s.t === 'missile' || s.t === 'bolt' || s.t === 'harpoon' || s.t === 'firework' || s.t === 'nuke') && Math.cos(ang) < 0;
      const r = sp.rotated(ang, flip);
      ctx.drawImage(r.cv, Math.round(s.x - r.ox), Math.round(s.y - r.oy));
      if (s.t === 'mine' && s.arm <= 0 && ((performance.now() / 250) | 0) % 2) { ctx.fillStyle = WTP.PAL.e; ctx.fillRect(Math.round(s.x), Math.round(s.y) - 4, 1, 1); }
    }
    for (const p of st.portals) {
      if (!p) continue;
      p.t = (p.t || 0) + 0.016;
      const c1 = p.which ? WTP.PAL.o : WTP.PAL.c, c2 = p.which ? WTP.PAL.a : WTP.PAL.C;
      const tx = -p.ny, ty = p.nx;
      for (let k = -6; k <= 6; k++) {
        const w = Math.sqrt(1 - (k / 7) ** 2) * 2;
        const x = Math.round(p.x + tx * k), y = Math.round(p.y + ty * k);
        ctx.fillStyle = Math.abs(k) > 4 || ((k + ((p.t * 20) | 0)) & 3) === 0 ? c2 : c1;
        ctx.fillRect(x - Math.round(p.nx * w), y - Math.round(p.ny * w), 2, 2);
      }
    }
    if (st.ball) {
      const g0 = PL().gunPos || PL().center();
      const b = st.ball;
      const n = 8;
      for (let k = 1; k < n; k++) { const t = k / n; ctx.fillStyle = k & 1 ? WTP.PAL['4'] : WTP.PAL['3']; ctx.fillRect(Math.round(g0.x + (b.x - g0.x) * t), Math.round(g0.y + (b.y - g0.y) * t), 1, 1); }
      ctx.fillStyle = WTP.PAL['0'];
      ctx.beginPath(); ctx.arc(Math.round(b.x), Math.round(b.y), b.r + 1, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = WTP.PAL['3']; ctx.beginPath(); ctx.arc(Math.round(b.x), Math.round(b.y), b.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = WTP.PAL['5']; ctx.fillRect(Math.round(b.x - 2), Math.round(b.y - 2), 2, 2);
    }
    for (const T of st.tornados) {
      const H = 78;
      const grow = Math.min(1, T.t / 0.6) * Math.min(1, Math.max(0, (T.life - T.t) / 0.5));
      const top = Math.round(H * grow);
      for (let h = 0; h < top; h++) {
        const w = 3 + h * 0.36;
        const wob = Math.sin(T.t * 6 + h * 0.1) * 4;
        const cx = T.x + wob;
        ctx.globalAlpha = 0.45; ctx.fillStyle = WTP.PAL['4'];
        ctx.fillRect(Math.round(cx - w), Math.round(T.y - h), Math.round(w * 2), 1);
        ctx.globalAlpha = 1;
        for (let s = 0; s < 4; s++) {
          const a = T.t * 16 + h * 0.32 + s * 1.57;
          const x = cx + Math.cos(a) * w;
          const front = Math.sin(a) > 0;
          ctx.fillStyle = front ? (h % 6 < 2 ? WTP.PAL['7'] : WTP.PAL['6']) : WTP.PAL['4'];
          ctx.fillRect(Math.round(x), Math.round(T.y - h), front ? 3 : 2, 1);
        }
      }
    }
    if (st.eraserAt) {
      const e = st.eraserAt;
      ctx.strokeStyle = WTP.PAL.k; ctx.lineWidth = 1;
      ctx.strokeRect(Math.round(e.x) - 5.5, Math.round(e.y) - 5.5, 11, 11);
    }
    for (const a of FX().anims) {
      if (!a.slash) continue;
      const frames = SP.explosions().slash;
      const fr = frames[Math.min(frames.length - 1, Math.floor((a.t / a.dur) * frames.length))];
      ctx.save();
      ctx.translate(Math.round(a.x), Math.round(a.y));
      ctx.rotate(Math.round(a.a / (Math.PI / 8)) * (Math.PI / 8));
      if (a.dir < 0) ctx.scale(1, -1);
      const s = a.r / 14;
      ctx.drawImage(fr, -16 * s, -16 * s, 32 * s, 32 * s);
      ctx.restore();
    }
  }
  function drawHole(ctx, s) {
    const r = s.on ? Math.round(s.hr * 0.42 + Math.sin(s.age * 20) * 0.6) : 2;
    const t = s.age;
    for (let k = 0; k < 40; k++) {
      const a = t * 3 + k * 0.157 * 2;
      const rr = r * (1.4 + (k % 3) * 0.4);
      ctx.fillStyle = k % 3 === 0 ? WTP.PAL.K : k % 3 === 1 ? WTP.PAL.m : WTP.PAL.P;
      ctx.fillRect(Math.round(s.x + Math.cos(a) * rr * 1.6), Math.round(s.y + Math.sin(a) * rr * 0.6), 1, 1);
    }
    ctx.fillStyle = WTP.PAL.P;
    ctx.beginPath(); ctx.arc(Math.round(s.x), Math.round(s.y), r + 1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = WTP.PAL['0'];
    ctx.beginPath(); ctx.arc(Math.round(s.x), Math.round(s.y), r, 0, Math.PI * 2); ctx.fill();
  }
  function reset() {
    shots.length = 0;
    Object.assign(st, { cd: 0, spin: 0, charge: 0, mag: {}, reload: 0, reloadFor: null, held: null, ball: null, portals: [], stickies: [], mines: [], boomers: 0, waves: [], tornados: [], quakeT: 0, orb: [] });
    WTP.audio.stopLoops();
  }
  function select(id) {
    if (!BY[id]) return false;
    if (st.cur !== id) {
      const old = BY[st.cur];
      if (old && old.loop) WTP.audio.loop(old.loop, false);
      WTP.audio.loop('spin', false);
      if (st.held) { st.held.held = false; W().chunks.push(st.held); st.held = null; }
      st.spin = 0; st.charge = 0;
    }
    st.cur = id;
    st.cd = Math.min(st.cd, 0.15);
    return true;
  }

  WTP.weapons = {
    CATS, DEFS: D, BY, st, shots, update, draw, reset, select, owned, explode, impactChunk,
    heldChunk: () => st.held,
    magnetOn: () => st.cur === 'magnet' && WTP.input.wantFire(),
    current: () => BY[st.cur],
    setAmmo: (a) => { st.ammo = a ? { ...a } : null; },
    ammo: () => st.ammo,
    swing: () => {
      const d = BY[st.cur];
      if (d.id === 'hammer' && st.swing > 0) return -(st.swing / 0.22) * 1.8 * st.swingDir * PL().face + 0.6 * PL().face;
      if (d.id === 'katana' && st.swing > 0) return st.swingDir * (1 - st.swing / 0.18) * 1.6 - st.swingDir * 0.8;
      if (d.throw && st.swing > 0) return -st.swing * 6 * PL().face;
      return 0;
    }
  };
})();
