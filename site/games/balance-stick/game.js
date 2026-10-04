(() => {
  const stage = document.getElementById('stage');
  const cv = document.getElementById('cv');
  const g = cv.getContext('2d');
  const $ = (id) => document.getElementById(id);
  const card = $('card'), timeEl = $('time'), levelEl = $('level'), gustEl = $('gust');
  const DT = 1 / 240;
  const K = 650, C = 2 * Math.sqrt(650);
  const SUBS = {
    single: 'Keep the pole upright on your fingertip. Move left and right to catch it as it tips.',
    double: 'Two poles, one hinge in the middle. Real double pendulum physics. Good luck.',
    stars: 'Tilt the tip into the stars to grab them. Lean too far and it is timber.',
    zen: 'No wind, no storm, no pressure. Just you and a stick at sunset.'
  };
  const LEVELS = [[0, 'Calm'], [6, 'Breezy'], [15, 'Windy'], [30, 'Stormy'], [50, 'Hurricane!']];
  const SKINS = [
    { id: 'pole', ico: '🥢', name: 'Wooden pole', need: null, col: '#c98b4a' },
    { id: 'broom', ico: '🧹', name: 'Broom', need: 's10', col: '#b07a3e' },
    { id: 'bamboo', ico: '🎋', name: 'Bamboo', need: 's30', col: '#7cb342' },
    { id: 'torch', ico: '🔥', name: 'Torch', need: 'd10', col: '#6d4c41' },
    { id: 'neon', ico: '✨', name: 'Neon rod', need: 'stars10', col: '#5ef0ff' }
  ];
  const BADGES = [
    ['first', '🪵', 'Timber!', 'Drop your first stick'],
    ['s10', '🌬️', 'Breezy', '10 s with one stick (unlocks Broom)'],
    ['s30', '🌪️', 'Storm Chaser', '30 s with one stick (unlocks Bamboo)'],
    ['s60', '🌀', 'Hurricane Hunter', '60 s with one stick'],
    ['d10', '🔥', 'Chaos Tamer', '10 s on Double (unlocks Torch)'],
    ['stars10', '⭐', 'Stargazer', '10 stars in one run (unlocks Neon)'],
    ['stars25', '🌟', 'Constellation', '25 stars in one run'],
    ['zen60', '🧘', 'Inner Peace', '60 s in Zen'],
    ['gust10', '🪁', 'Kite Flyer', 'Survive 10 gusts in one run'],
    ['keys', '🎹', 'Look, No Mouse', '15 s using only the arrow keys'],
    ['total600', '⏱️', 'Ten Minutes', 'Balance for 10 minutes in total'],
    ['games25', '🎮', 'Regular', 'Play 25 rounds']
  ];
  const fresh = () => ({ v: 2, mode: Curio.store.get('bs-mode', 'single'), skin: 'pole', games: 0, total: 0, history: [], badges: {} });
  function load() {
    const d = Curio.store.get('bs:data', null);
    const f = d && typeof d === 'object' && d.v === 2 ? Object.assign(fresh(), d) : fresh();
    if (!SUBS[f.mode]) f.mode = 'single';
    if (!Array.isArray(f.history)) f.history = [];
    if (!f.badges || typeof f.badges !== 'object') f.badges = {};
    if (!SKINS.some((s) => s.id === f.skin)) f.skin = 'pole';
    return f;
  }
  const data = load();
  const save = () => Curio.store.set('bs:data', data);
  const unlocked = (s) => !s.need || !!data.badges[s.need];

  function tone(f, d = 0.12, type = 'sine', vol = 0.12, when = 0, slide = 0) {
    if (Curio.muted) return;
    const ac = Curio.audioContext(); if (!ac) return;
    const t = ac.currentTime + when;
    const o = ac.createOscillator(), gn = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
    gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(vol, t + 0.01); gn.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(gn).connect(ac.destination); o.start(t); o.stop(t + d + 0.03);
  }
  function noise(dur, vol, freq, type = 'bandpass') {
    if (Curio.muted) return;
    const ac = Curio.audioContext(); if (!ac) return;
    const n = Math.floor(ac.sampleRate * dur), buf = ac.createBuffer(1, n, ac.sampleRate), ch = buf.getChannelData(0);
    for (let i = 0; i < n; i++) ch[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource(); src.buffer = buf;
    const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = .8;
    const gn = ac.createGain(); const t = ac.currentTime;
    gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(vol, t + dur * .3); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(gn).connect(ac.destination); src.start(t);
  }
  const buzz = (ms) => { try { navigator.vibrate?.(ms); } catch {} };

  let mode = data.mode;
  let W = 0, H = 0, floorY = 0, pivotY = 0;
  let state = 'idle';
  let x = 0, v = 0, a = 0, target = 0, keyDir = 0;
  let p1 = 0, w1 = 0, p2 = 0, w2 = 0, bend1 = 0, bend2 = 0;
  let t = 0, last = 0, raf = 0, acc = 0, clock = 0;
  let overAt = 0, wind = 0, gust = null, nextGust = 6, streaks = [], shake = 0, fallT = 0, bounces = 0;
  let skyLv = 0, lvIdx = 0, flash = 0, nextBolt = 0, rain = [], clouds = [], skyStars = [], parts = [];
  let stars = [], starCount = 0, nextStarAt = 0, gustsSurvived = 0, usedPointer = false, nextMilestone = 10, newBadges = [];

  const fmt = (s) => s.toFixed(2);
  const dark = () => Curio.isDark();
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (c1, c2, k) => { const a1 = hex(c1), a2 = hex(c2); return `rgb(${a1.map((v, i) => Math.round(v + (a2[i] - v) * k)).join(',')})`; };
  const mixHex = (c1, c2, k) => { const a1 = hex(c1), a2 = hex(c2); return '#' + a1.map((v, i) => Math.round(v + (a2[i] - v) * k).toString(16).padStart(2, '0')).join(''); };
  const SKY = {
    light: [['#7cc8f7', '#e6f6ff'], ['#6fb6ea', '#fdf0d5'], ['#f08a4b', '#fbd3a0'], ['#5b6b85', '#a3afc0'], ['#2b2f45', '#5f6680']],
    dark: [['#0b1530', '#26365e'], ['#101a3a', '#3a3560'], ['#2a1838', '#6b3a4a'], ['#151b28', '#3a4558'], ['#07090f', '#252a3a']]
  };

  function params() {
    const k = mode === 'zen' ? 0 : Math.min(1, t / 60);
    if (mode !== 'double') {
      const L = Math.min(H * .5, 230) * (1 + .3 * k);
      return { L1: L, g: 900 * (1 + 1.3 * k), m1: 1, ball: 9 + 9 * k };
    }
    const L = Math.min(H * .27, 140) * (1 + .15 * k);
    return { L1: L, L2: L, g: 500 * (1 + .8 * k), m1: 2, m2: 1, ball: 8 + 4 * k };
  }
  function levelIndex() {
    if (mode === 'zen') return 2;
    let i = 0;
    LEVELS.forEach(([s], k) => { if (t >= s) i = k; });
    return i;
  }

  function seedScenery() {
    clouds = Array.from({ length: 7 }, (_, i) => ({ x: Math.random() * W, y: 30 + Math.random() * H * .35, s: .6 + Math.random() * .9, sp: 8 + Math.random() * 10 }));
    skyStars = Array.from({ length: 60 }, () => ({ x: Math.random() * W, y: Math.random() * H * .6, r: Math.random() * 1.4 + .3, p: Math.random() * 6 }));
  }

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = stage.clientWidth; H = stage.clientHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    floorY = H - 64;
    pivotY = H - 130;
    if (state === 'idle') { x = target = W / 2; }
    x = Math.max(30, Math.min(W - 30, x)); target = Math.max(30, Math.min(W - 30, target));
    seedScenery();
    draw();
  }

  function stepPhysics(dt, control) {
    const P = params();
    if (control) {
      target = Math.max(30, Math.min(W - 30, target + keyDir * 900 * dt));
      a = K * (target - x) - C * v;
      a = Math.max(-9000, Math.min(9000, a));
    } else a = -v * 8;
    v += a * dt; x += v * dt;
    if (x < 30) { x = 30; v = 0; } else if (x > W - 30) { x = W - 30; v = 0; }
    const gw = wind;
    if (mode !== 'double') {
      const dd = (P.g * Math.sin(p1) - a * Math.cos(p1) + gw * Math.cos(p1)) / P.L1 - .25 * w1;
      w1 += dd * dt; p1 += w1 * dt;
      bend1 += ((-dd * .0035) - bend1) * .2;
    } else {
      const { L1, L2, m1, m2 } = P;
      const s12 = Math.sin(p1 - p2), c12 = Math.cos(p1 - p2);
      const A = (m1 + m2) * L1, B = m2 * L2 * c12, Cc = L1 * c12, D = L2;
      const R1 = -m2 * L2 * w2 * w2 * s12 + (m1 + m2) * (P.g * Math.sin(p1) - a * Math.cos(p1) + gw * .5 * Math.cos(p1));
      const R2 = L1 * w1 * w1 * s12 + P.g * Math.sin(p2) - a * Math.cos(p2) + gw * Math.cos(p2);
      const det = A * D - B * Cc;
      const d1 = (R1 * D - B * R2) / det - .3 * w1;
      const d2 = (A * R2 - Cc * R1) / det - .3 * (w2 - w1);
      w1 += d1 * dt; w2 += d2 * dt; p1 += w1 * dt; p2 += w2 * dt;
      bend1 += ((-d1 * .002) - bend1) * .2; bend2 += ((-d2 * .002) - bend2) * .2;
    }
  }

  function updateWind(dt) {
    if (state !== 'run' || mode === 'zen') { wind *= .96; return; }
    if (!gust && t >= nextGust) {
      const amp = Math.min(750, 180 + t * 10) * Curio.rand(.7, 1.1) * (mode === 'double' ? .7 : mode === 'stars' ? .6 : 1);
      gust = { start: t + .7, dur: Curio.rand(.8, 1.8), amp: amp * (Math.random() < .5 ? -1 : 1) };
      gustEl.textContent = gust.amp > 0 ? 'Gust → 💨' : '💨 ← Gust';
      gustEl.classList.add('is-on');
      noise(1.4, .08, 500);
      buzz(20);
    }
    if (gust) {
      const u = (t - gust.start) / gust.dur;
      if (u < 0) wind = 0;
      else if (u <= 1) wind = gust.amp * Math.sin(Math.PI * u);
      else { wind = 0; gust = null; gustsSurvived++; gustEl.classList.remove('is-on'); nextGust = t + Math.max(1.6, Curio.rand(3, 6) - t / 30); }
    }
    if (Math.abs(wind) > 40 && Math.random() < Math.abs(wind) / 12000) {
      streaks.push({ x: wind > 0 ? -60 : W + 60, y: Curio.rand(H * .12, floorY - 10), len: Curio.rand(30, 90), sp: Math.sign(wind) * Curio.rand(500, 900) });
    }
    streaks.forEach((s) => { s.x += s.sp * dt; });
    streaks = streaks.filter((s) => s.x > -120 && s.x < W + 120);
  }

  function failed() {
    if (mode !== 'double') return Math.abs(p1) > 1.15;
    return Math.abs(p1) > 1.1 || Math.abs(p2) > 1.25;
  }

  function joints() {
    const P = params();
    const j1 = { x: x + P.L1 * Math.sin(p1), y: pivotY - P.L1 * Math.cos(p1) };
    if (mode !== 'double') return [j1];
    return [j1, { x: j1.x + P.L2 * Math.sin(p2), y: j1.y - P.L2 * Math.cos(p2) }];
  }

  function burst(px, py, color, n = 18, sp = 220) {
    for (let i = 0; i < n; i++) {
      const an = Math.random() * Math.PI * 2, s = Math.random() * sp + 40;
      parts.push({ x: px, y: py, vx: Math.cos(an) * s, vy: Math.sin(an) * s - 60, life: .7 + Math.random() * .4, max: 1.1, c: color, r: 2 + Math.random() * 3, gr: 400 });
    }
  }

  function spawnStar() {
    const P = params();
    const s = Math.random() < .5 ? -1 : 1;
    const th = s * Curio.rand(.16, .5);
    const L = P.L1 * Curio.rand(.85, 1.02);
    stars.push({ x: Math.max(40, Math.min(W - 40, x + L * Math.sin(th))), y: pivotY - L * Math.cos(th), born: clock, life: 7, got: false });
  }

  function updateStars() {
    if (mode !== 'stars' || state !== 'run') return;
    const tip = joints()[0];
    const P = params();
    stars.forEach((s) => {
      if (s.got) return;
      if (Math.hypot(tip.x - s.x, tip.y - s.y) < P.ball + 20) {
        s.got = true; starCount++;
        $('starCount').textContent = `⭐ ${starCount}`;
        burst(s.x, s.y, '#ffd54a', 22);
        tone(880 + (starCount % 8) * 60, .1, 'triangle', .1); tone(1320 + (starCount % 8) * 60, .14, 'triangle', .07, .06);
        buzz(15);
        nextStarAt = clock + .4;
      }
    });
    stars = stars.filter((s) => !s.got && clock - s.born < s.life);
    if (!stars.length && clock >= nextStarAt) spawnStar();
  }

  function banner(text) {
    const b = $('banner');
    b.textContent = text;
    b.classList.remove('is-on'); void b.offsetWidth; b.classList.add('is-on');
  }

  function loop(now) {
    if (state !== 'run' && state !== 'falling') return;
    const dt = Math.min(.05, (now - last) / 1000);
    last = now;
    acc += dt; clock += dt;
    while (acc >= DT) {
      acc -= DT;
      if (state === 'run') {
        t += DT;
        updateWind(DT);
        stepPhysics(DT, true);
        if (failed()) fall();
      } else {
        updateWind(DT);
        fallT += DT;
        stepPhysics(DT, false);
        const js = joints();
        const low = js.findIndex((j) => j.y > floorY - 4);
        if (low >= 0) {
          if (mode !== 'double' || low === 0) {
            const cosHit = (pivotY - floorY + 4) / params().L1;
            const ang = Math.acos(Math.max(-1, Math.min(1, cosHit)));
            p1 = Math.sign(p1) * ang;
            if (Math.abs(w1) > 1.2 && bounces < 3) {
              w1 = -w1 * .32; bounces++; shake = Math.min(14, 4 + Math.abs(w1) * 2);
              tone(90 + bounces * 20, .14, 'sine', .16); noise(.25, .1, 300, 'lowpass');
              const tip = joints()[0]; burst(tip.x, floorY, '#b89a6a', 10, 120); buzz(40);
            } else { w1 = 0; if (mode === 'double') w2 *= .6; }
          }
          if (mode === 'double' && low === 1) { w2 = -w2 * .3; w1 *= .7; if (bounces < 4) { bounces++; shake = 8; tone(110, .1, 'sine', .12); } }
        }
        if (fallT > 1.8) { state = 'over'; showOver(); return; }
      }
    }
    if (state === 'run') {
      updateStars();
      const li = levelIndex();
      if (li !== lvIdx) { lvIdx = li; levelEl.textContent = LEVELS[li][1]; levelEl.classList.remove('is-pop'); void levelEl.offsetWidth; levelEl.classList.add('is-pop'); if (li > 0 && mode !== 'zen') { banner(LEVELS[li][1]); tone(440, .3, 'triangle', .06, 0, 220); } }
      if (t >= nextMilestone) { if (mode !== 'zen' || nextMilestone % 30 === 0) banner(`${nextMilestone} seconds!`); [660, 880, 1100].forEach((f, j) => tone(f, .12, 'triangle', .07, j * .07)); nextMilestone += 10; }
    }
    skyLv += (levelIndex() - skyLv) * Math.min(1, dt * .8);
    if (skyLv > 3.5 && clock > nextBolt && state === 'run') { flash = 1; nextBolt = clock + Curio.rand(3, 7); setTimeout(() => noise(1.6, .14, 120, 'lowpass'), 250); }
    flash *= .9;
    shake *= .88;
    parts.forEach((p) => { p.vy += p.gr * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; });
    parts = parts.filter((p) => p.life > 0);
    timeEl.textContent = fmt(t);
    if (state !== 'run') levelEl.textContent = 'Timber!';
    stage.classList.toggle('is-dark', dark() || skyLv > 2.6);
    draw();
    raf = requestAnimationFrame(loop);
  }

  function drawStick(x0, y0, x1, y1, bend, width, warn, skin) {
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    const len = Math.hypot(x1 - x0, y1 - y0);
    const nx = -(y1 - y0) / len, ny = (x1 - x0) / len;
    const off = Math.max(-28, Math.min(28, bend * len));
    const cx = mx + nx * off, cy = my + ny * off;
    const path = () => { g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(cx, cy, x1, y1); };
    g.lineCap = 'round';
    g.strokeStyle = 'rgba(0,0,0,.2)'; g.lineWidth = width + 4; path(); g.stroke();
    if (skin.id === 'neon') { g.save(); g.shadowColor = skin.col; g.shadowBlur = 18; }
    const grad = g.createLinearGradient(x0 + nx * width, y0 + ny * width, x0 - nx * width, y0 - ny * width);
    grad.addColorStop(0, mixHex(skin.col, '#ffffff', .25)); grad.addColorStop(.5, skin.col); grad.addColorStop(1, mixHex(skin.col, '#000000', .3));
    g.strokeStyle = grad; g.lineWidth = width; path(); g.stroke();
    if (skin.id === 'neon') g.restore();
    if (warn > 0) { g.strokeStyle = `rgba(255, 60, 40, ${(warn * .55).toFixed(2)})`; g.lineWidth = width; path(); g.stroke(); }
    if (skin.id === 'bamboo') {
      g.strokeStyle = '#4e7d27'; g.lineWidth = 2.5;
      for (let k = 1; k < 6; k++) {
        const u = k / 6, bx = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cx + u * u * x1, by = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * cy + u * u * y1;
        g.beginPath(); g.moveTo(bx - nx * width * .6, by - ny * width * .6); g.lineTo(bx + nx * width * .6, by + ny * width * .6); g.stroke();
      }
    } else if (skin.id === 'pole' || skin.id === 'broom' || skin.id === 'torch') {
      g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(x0 + nx * 2.5, y0 + ny * 2.5); g.quadraticCurveTo(cx + nx * 2.5, cy + ny * 2.5, x1 + nx * 2.5, y1 + ny * 2.5); g.stroke();
    }
  }

  function drawTop(top, prev, ball, skin) {
    const dx = top.x - prev.x, dy = top.y - prev.y, l = Math.hypot(dx, dy) || 1;
    const ux = dx / l, uy = dy / l, nx = -uy, ny = ux;
    if (skin.id === 'broom') {
      const L = 34 + ball, w0 = 8, w1 = 22 + ball * .6;
      g.fillStyle = '#d9a441';
      g.beginPath(); g.moveTo(top.x + nx * w0, top.y + ny * w0); g.lineTo(top.x + ux * L + nx * w1, top.y + uy * L + ny * w1);
      g.lineTo(top.x + ux * L - nx * w1, top.y + uy * L - ny * w1); g.lineTo(top.x - nx * w0, top.y - ny * w0); g.closePath(); g.fill();
      g.strokeStyle = '#a8761f'; g.lineWidth = 1.5;
      for (let k = -3; k <= 3; k++) { g.beginPath(); g.moveTo(top.x + nx * k * 2, top.y + ny * k * 2); g.lineTo(top.x + ux * L + nx * k * w1 / 3.3, top.y + uy * L + ny * k * w1 / 3.3); g.stroke(); }
      g.fillStyle = '#c0392b'; g.fillRect(top.x - 9, top.y - 3, 18, 6);
      return;
    }
    if (skin.id === 'bamboo') {
      g.fillStyle = '#66bb6a';
      [[-1, .6], [1, -.4]].forEach(([s, rot]) => { g.save(); g.translate(top.x, top.y); g.rotate(Math.atan2(uy, ux) + s * .7 + rot * .2); g.beginPath(); g.ellipse(14 + ball * .5, 0, 16 + ball * .5, 5, 0, 0, 7); g.fill(); g.restore(); });
      g.fillStyle = '#7cb342'; g.beginPath(); g.arc(top.x, top.y, 6, 0, 7); g.fill();
      return;
    }
    if (skin.id === 'torch') {
      g.fillStyle = '#8d6e63'; g.beginPath(); g.arc(top.x, top.y, 8, 0, 7); g.fill();
      const f = 1 + Math.sin(clock * 30) * .08 + Math.sin(clock * 17) * .06;
      const hgt = (26 + ball) * f;
      const grd = g.createRadialGradient(top.x, top.y - hgt * .3, 2, top.x, top.y - hgt * .3, hgt);
      grd.addColorStop(0, '#fff7c2'); grd.addColorStop(.35, '#ffb300'); grd.addColorStop(1, 'rgba(255, 87, 34, 0)');
      g.fillStyle = grd;
      g.beginPath(); g.moveTo(top.x - 11, top.y); g.quadraticCurveTo(top.x - 14, top.y - hgt * .6, top.x + Math.sin(clock * 9) * 4, top.y - hgt); g.quadraticCurveTo(top.x + 14, top.y - hgt * .6, top.x + 11, top.y); g.closePath(); g.fill();
      if (Math.random() < .3) parts.push({ x: top.x + Curio.rand(-5, 5), y: top.y - 10, vx: Curio.rand(-20, 20) + wind * .05, vy: Curio.rand(-90, -50), life: .6, max: .6, c: '#ffb300', r: 1.6, gr: -20 });
      return;
    }
    g.save();
    const col = skin.id === 'neon' ? '#ff4fd8' : '#ff5a36';
    if (skin.id === 'neon') { g.shadowColor = col; g.shadowBlur = 20; }
    const bg = g.createRadialGradient(top.x - ball * .35, top.y - ball * .35, 1, top.x, top.y, ball);
    bg.addColorStop(0, '#fff'); bg.addColorStop(.3, col); bg.addColorStop(1, mixHex(col, '#000000', .35));
    g.fillStyle = bg; g.beginPath(); g.arc(top.x, top.y, ball, 0, 7); g.fill();
    g.restore();
  }

  function drawStarShape(sx, sy, r, rot) {
    g.beginPath();
    for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * .45 : r, an = rot + i * Math.PI / 5 - Math.PI / 2; g.lineTo(sx + rr * Math.cos(an), sy + rr * Math.sin(an)); }
    g.closePath();
  }

  function drawScene() {
    const pal = dark() ? SKY.dark : SKY.light;
    const i0 = Math.floor(skyLv), i1 = Math.min(4, i0 + 1), k = skyLv - i0;
    const top = mix(pal[i0][0], pal[i1][0], k), bot = mix(pal[i0][1], pal[i1][1], k);
    const sky = g.createLinearGradient(0, 0, 0, floorY);
    sky.addColorStop(0, top); sky.addColorStop(1, bot);
    g.fillStyle = sky; g.fillRect(-20, -20, W + 40, floorY + 20);
    const gloom = Math.min(1, skyLv / 4);
    if (dark()) {
      skyStars.forEach((s) => { g.globalAlpha = (.4 + .6 * Math.abs(Math.sin(clock + s.p))) * (1 - gloom * .8); g.fillStyle = '#fff'; g.beginPath(); g.arc(s.x, s.y, s.r, 0, 7); g.fill(); });
      g.globalAlpha = 1;
      const mx = W * .82, my = H * .16 + gloom * 40;
      g.fillStyle = `rgba(255, 250, 230, ${1 - gloom * .7})`; g.beginPath(); g.arc(mx, my, 28, 0, 7); g.fill();
      g.fillStyle = mix(pal[i0][0], pal[i1][0], k); g.beginPath(); g.arc(mx + 11, my - 7, 24, 0, 7); g.fill();
    } else {
      const sx = W * .82, sy = H * .14 + skyLv * H * .09;
      const sg = g.createRadialGradient(sx, sy, 4, sx, sy, 90);
      sg.addColorStop(0, `rgba(255, 244, 200, ${.95 - gloom * .8})`); sg.addColorStop(.35, `rgba(255, 210, 90, ${.6 - gloom * .5})`); sg.addColorStop(1, 'rgba(255, 210, 90, 0)');
      g.fillStyle = sg; g.beginPath(); g.arc(sx, sy, 90, 0, 7); g.fill();
      g.fillStyle = `rgba(255, 236, 160, ${1 - gloom * .85})`; g.beginPath(); g.arc(sx, sy, 30, 0, 7); g.fill();
    }
    const cc = dark() ? mix('#3a4a70', '#1a1f2c', gloom) : mix('#ffffff', '#6b7488', gloom);
    clouds.forEach((c) => {
      g.globalAlpha = dark() ? .5 : .85; g.fillStyle = cc;
      const s = c.s * (1 + gloom * .4);
      [[0, 0, 26], [24, -10, 22], [48, 0, 24], [22, 8, 22]].forEach(([dx, dy, r]) => { g.beginPath(); g.arc(c.x + dx * s, c.y + dy * s, r * s, 0, 7); g.fill(); });
    });
    g.globalAlpha = 1;
    const hillF = dark() ? mix('#1f3a3a', '#141a22', gloom) : mix('#a6d99c', '#6f7f78', gloom);
    const hillN = dark() ? mix('#18302a', '#10151c', gloom) : mix('#78c06f', '#56665e', gloom);
    g.fillStyle = hillF; g.beginPath(); g.moveTo(-20, floorY);
    for (let px = -20; px <= W + 20; px += 20) g.lineTo(px, floorY - 70 - Math.sin(px / 140) * 30 - Math.sin(px / 57) * 10);
    g.lineTo(W + 20, floorY); g.fill();
    g.fillStyle = hillN; g.beginPath(); g.moveTo(-20, floorY);
    for (let px = -20; px <= W + 20; px += 20) g.lineTo(px, floorY - 30 - Math.sin(px / 90 + 2) * 18);
    g.lineTo(W + 20, floorY); g.fill();
    const grd = g.createLinearGradient(0, floorY, 0, H);
    grd.addColorStop(0, dark() ? mix('#2e4a2a', '#1a2219', gloom) : mix('#5fae55', '#4c6a48', gloom));
    grd.addColorStop(1, dark() ? '#121a12' : mix('#3f8a3a', '#34503a', gloom));
    g.fillStyle = grd; g.fillRect(-20, floorY, W + 40, H - floorY + 20);
    g.strokeStyle = 'rgba(255,255,255,.15)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-20, floorY + 1); g.lineTo(W + 20, floorY + 1); g.stroke();
  }

  function drawHand() {
    const skin = '#f2b98d', edge = '#c98b6a';
    g.fillStyle = '#3d7bd9'; g.beginPath(); g.roundRect ? g.roundRect(x - 26, pivotY + 88, 52, H, 14) : g.rect(x - 26, pivotY + 88, 52, H); g.fill();
    g.fillStyle = '#2f63b3'; g.fillRect(x - 26, pivotY + 88, 52, 8);
    g.fillStyle = skin; g.strokeStyle = edge; g.lineWidth = 2;
    g.beginPath(); g.roundRect ? g.roundRect(x - 22, pivotY + 44, 44, 50, 14) : g.rect(x - 22, pivotY + 44, 44, 50); g.fill(); g.stroke();
    [-14, -5, 4].forEach((dx) => { g.beginPath(); g.ellipse(x + dx + 4, pivotY + 48, 5, 7, 0, 0, 7); g.fill(); g.stroke(); });
    g.beginPath(); g.ellipse(x + 22, pivotY + 66, 8, 12, -.5, 0, 7); g.fill(); g.stroke();
    g.beginPath(); g.roundRect ? g.roundRect(x - 9, pivotY + 2, 18, 56, 9) : g.rect(x - 9, pivotY + 2, 18, 56); g.fill(); g.stroke();
    g.fillStyle = '#ffd9c0'; g.beginPath(); g.ellipse(x, pivotY + 9, 5, 4, 0, 0, 7); g.fill();
    g.fillStyle = '#5d4037'; g.beginPath(); g.arc(x, pivotY, 5, 0, 7); g.fill();
  }

  function draw() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    g.save();
    if (shake > .3) g.translate(Curio.rand(-shake, shake), Curio.rand(-shake, shake) * .6);
    drawScene();
    if (skyLv > 2.6) {
      const n = Math.floor((skyLv - 2.6) * 60);
      while (rain.length < n) rain.push({ x: Math.random() * W, y: Math.random() * floorY, sp: Curio.rand(600, 900) });
      g.strokeStyle = 'rgba(200, 220, 255, .45)'; g.lineWidth = 1.5;
      rain.forEach((r) => {
        r.y += r.sp / 60; r.x += wind * .02 + 1.5;
        if (r.y > floorY) { r.y = -10; r.x = Math.random() * W; }
        g.beginPath(); g.moveTo(r.x, r.y); g.lineTo(r.x - (wind * .01 + 3), r.y - 14); g.stroke();
      });
    } else rain.length = 0;
    clouds.forEach((c) => { c.x += (c.sp + wind * .03) / 60; if (c.x > W + 100) c.x = -120; if (c.x < -140) c.x = W + 90; });
    g.strokeStyle = dark() || skyLv > 2.6 ? 'rgba(255,255,255,.5)' : 'rgba(40,60,90,.35)'; g.lineCap = 'round';
    streaks.forEach((s) => { g.lineWidth = 2; g.beginPath(); g.moveTo(s.x, s.y); g.lineTo(s.x - Math.sign(s.sp) * s.len, s.y); g.stroke(); });
    const P = params();
    const js = joints();
    const skin = SKINS.find((s) => s.id === data.skin) || SKINS[0];
    stars.forEach((s) => {
      const age = clock - s.born, fade = Math.min(1, (s.life - age) / 1.2);
      g.save(); g.globalAlpha = Math.max(0, fade); g.shadowColor = '#ffd54a'; g.shadowBlur = 16;
      g.fillStyle = '#ffd54a'; drawStarShape(s.x, s.y + Math.sin(clock * 3 + s.born) * 4, 15 + Math.sin(clock * 6) * 1.5, clock * .8); g.fill();
      g.restore();
    });
    const warn1 = Math.max(0, Math.min(1, (Math.abs(p1) - .35) / .7));
    if (state === 'idle' || state === 'run') {
      g.globalAlpha = .18; g.strokeStyle = dark() || skyLv > 2.6 ? '#fff' : '#1d1b19'; g.lineWidth = 2; g.setLineDash([4, 8]);
      g.beginPath(); g.moveTo(x, pivotY); g.lineTo(x, pivotY - (mode !== 'double' ? P.L1 : P.L1 + P.L2) - 20); g.stroke();
      g.setLineDash([]); g.globalAlpha = 1;
    }
    drawStick(x, pivotY, js[0].x, js[0].y, bend1, 11, warn1, skin);
    if (mode === 'double') {
      const warn2 = Math.max(0, Math.min(1, (Math.abs(p2) - .35) / .8));
      drawStick(js[0].x, js[0].y, js[1].x, js[1].y, bend2, 9, warn2, skin);
      g.fillStyle = '#5d4037'; g.beginPath(); g.arc(js[0].x, js[0].y, 7, 0, 7); g.fill();
      g.fillStyle = '#ffc233'; g.beginPath(); g.arc(js[0].x, js[0].y, 3, 0, 7); g.fill();
    }
    const tp = js[js.length - 1], prev = js.length > 1 ? js[0] : { x, y: pivotY };
    drawTop(tp, prev, P.ball, skin);
    drawHand();
    parts.forEach((p) => { g.globalAlpha = Math.max(0, p.life / p.max); g.fillStyle = p.c; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill(); });
    g.globalAlpha = 1;
    g.restore();
    if (flash > .02) { g.fillStyle = `rgba(255,255,255,${(flash * .7).toFixed(2)})`; g.fillRect(0, 0, W, H); }
  }

  function begin() {
    cancelAnimationFrame(raf);
    t = 0; acc = 0; wind = 0; gust = null; nextGust = 6; streaks = []; shake = 0; fallT = 0; bounces = 0;
    stars = []; starCount = 0; nextStarAt = .8; gustsSurvived = 0; usedPointer = false; nextMilestone = 10; lvIdx = 0; parts = [];
    v = 0; a = 0; x = Math.max(30, Math.min(W - 30, target || W / 2)); target = x;
    const s = Math.random() < .5 ? -1 : 1;
    p1 = s * .025; w1 = 0; p2 = s * .04; w2 = 0; bend1 = bend2 = 0;
    gustEl.classList.remove('is-on');
    $('starCount').hidden = mode !== 'stars'; $('starCount').textContent = '⭐ 0';
    levelEl.textContent = mode === 'zen' ? 'Zen' : 'Calm';
    card.hidden = true;
    state = 'run';
    stage.classList.add('is-run'); stage.classList.remove('is-over', 'is-falling');
    tone(660, .08, 'triangle', .08);
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }

  function fall() {
    state = 'falling';
    fallT = 0;
    stage.classList.add('is-falling'); stage.classList.remove('is-run');
    gust = null; gustEl.classList.remove('is-on');
    tone(300, .25, 'sawtooth', .05, 0, -120);
    tone(200, .3, 'sawtooth', .05, .14, -80);
    buzz([30, 30, 60]);
  }

  function comment(s) {
    if (mode === 'double') {
      if (s >= 30) return 'Two sticks for half a minute? That is circus-level stuff.';
      if (s >= 15) return 'Seriously impressive. Chaos theory is shaking.';
      if (s >= 7) return 'Respectable! Double pendulums hate everyone.';
      if (s >= 3) return 'It is meant to be nearly impossible. You did fine.';
      return 'The double stack wins this round.';
    }
    if (mode === 'stars') {
      if (starCount >= 25) return 'A whole constellation. Astronomers are jealous.';
      if (starCount >= 10) return 'Star catcher! Greedy, but in a good way.';
      if (starCount >= 4) return 'Nice grabs. Lean, catch, recover.';
      return 'Tip: lean a little, then move under it to recover.';
    }
    if (mode === 'zen') return s >= 60 ? 'Pure calm. The stick and you are one.' : 'Breathe in, breathe out, try again.';
    if (s >= 60) return 'You survived the hurricane. Juggling school next?';
    if (s >= 30) return 'Steady hands through a proper storm.';
    if (s >= 15) return 'Nice balance! The wind is not impressed, but we are.';
    if (s >= 7) return 'Getting the hang of it. Small, early moves.';
    if (s >= 3) return 'Tip: move toward the way it is leaning.';
    return 'Timber! The stick had other plans.';
  }

  function placeCard() {
    const head = document.querySelector('.bs-head');
    const hb = head.offsetTop + head.offsetHeight;
    const top = Math.round(Math.max(60, hb + 10));
    card.style.top = top + 'px';
    card.style.maxHeight = Math.max(200, H - top - 66) + 'px';
  }

  function award(id) {
    if (data.badges[id]) return;
    data.badges[id] = Date.now();
    const b = BADGES.find((q) => q[0] === id);
    if (b) newBadges.push(b);
  }

  function spark() {
    const sp = $('spark');
    const hist = data.history.filter((h) => h.m === mode).slice(-15);
    if (hist.length < 2) { sp.hidden = true; return; }
    sp.hidden = false;
    const max = Math.max(1, ...hist.map((h) => h.s));
    const X = (i) => 10 + i * (340 / (hist.length - 1)), Y = (val) => 44 - val / max * 36;
    const pts = hist.map((h, i) => `${X(i).toFixed(1)},${Y(h.s).toFixed(1)}`).join(' ');
    sp.innerHTML = `<polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round"/>` +
      hist.map((h, i) => `<circle cx="${X(i).toFixed(1)}" cy="${Y(h.s).toFixed(1)}" r="${i === hist.length - 1 ? 4.5 : 2.5}" fill="var(--accent)"/>`).join('');
  }

  function bestText(m) {
    const b = Curio.getBest(m);
    if (b == null) return '-';
    return m === 'stars' ? `⭐ ${b}` : fmt(b) + 's';
  }

  function showOver() {
    cancelAnimationFrame(raf);
    overAt = performance.now();
    newBadges = [];
    stage.classList.remove('is-run', 'is-falling'); stage.classList.add('is-over');
    const s = Math.round(t * 100) / 100;
    const scoreVal = mode === 'stars' ? starCount : s;
    const prev = Curio.getBest(mode);
    const b = Curio.best(mode, scoreVal);
    data.games++; data.total += s;
    data.history.push({ m: mode, s: scoreVal, t: Date.now() });
    if (data.history.length > 150) data.history = data.history.slice(-150);
    award('first');
    if (mode === 'single' && s >= 10) award('s10');
    if (mode === 'single' && s >= 30) award('s30');
    if (mode === 'single' && s >= 60) award('s60');
    if (mode === 'double' && s >= 10) award('d10');
    if (mode === 'stars' && starCount >= 10) award('stars10');
    if (mode === 'stars' && starCount >= 25) award('stars25');
    if (mode === 'zen' && s >= 60) award('zen60');
    if (gustsSurvived >= 10) award('gust10');
    if (!usedPointer && s >= 15) award('keys');
    if (data.total >= 600) award('total600');
    if (data.games >= 25) award('games25');
    save();
    const isPB = b.isNew && prev != null;
    $('best').textContent = bestText(mode);
    $('cEmoji').textContent = isPB ? '🏆' : mode === 'double' ? '🔥' : mode === 'stars' ? '⭐' : mode === 'zen' ? '🧘' : '🪵';
    $('cTitle').textContent = mode === 'stars' ? `⭐ ${starCount}` : fmt(s) + 's';
    $('cNew').innerHTML = isPB ? '<span class="bs-new">New best!</span>' : '';
    $('cText').textContent = comment(s) + (isPB ? '' : ` Best: ${bestText(mode)}.`);
    const rs = $('rStats'); rs.hidden = false; rs.innerHTML = '';
    [[fmt(s) + 's', 'Time'], [mode === 'zen' ? 'Zen' : LEVELS[levelIndex()][1].replace('!', ''), 'Reached'], [gustsSurvived, 'Gusts survived']].concat(mode === 'stars' ? [[starCount, 'Stars']] : []).forEach(([val, l]) => {
      const d = document.createElement('div'); d.className = 'c-stat';
      const bb = document.createElement('b'); bb.textContent = val; const sp = document.createElement('span'); sp.textContent = l;
      d.append(bb, sp); rs.append(d);
    });
    $('rChips').innerHTML = '';
    newBadges.forEach((bd, i) => {
      const c = document.createElement('span'); c.textContent = `${bd[1]} ${bd[2]}`; c.style.animationDelay = `${.2 + i * .15}s`; $('rChips').append(c);
      const sk = SKINS.find((q) => q.need === bd[0]);
      if (sk) setTimeout(() => Curio.toast(`Unlocked: ${sk.ico} ${sk.name}!`), 600 + i * 400);
    });
    spark();
    $('share').hidden = false;
    $('go').textContent = 'Balance again';
    $('extra').hidden = true;
    paintSkins(); paintBadgeCount();
    card.hidden = false;
    placeCard();
    $('go').focus({ preventScroll: true });
    if (isPB || newBadges.length) Curio.confetti();
    draw();
  }

  function paintSkins() {
    const el = $('skins'); el.innerHTML = '';
    SKINS.forEach((s) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'bs-skin' + (unlocked(s) ? '' : ' is-locked'); b.dataset.s = s.id; b.textContent = s.ico;
      const need = s.need ? BADGES.find((q) => q[0] === s.need) : null;
      b.title = unlocked(s) ? s.name : `${s.name}: ${need ? need[3].replace(/ \(.*\)/, '') : ''}`;
      b.setAttribute('aria-label', b.title);
      b.setAttribute('aria-pressed', String(data.skin === s.id));
      el.append(b);
    });
  }
  function paintBadgeCount() { $('badgeCount').textContent = `${BADGES.filter((b) => data.badges[b[0]]).length}/${BADGES.length}`; }

  function setMode(m) {
    if (state === 'run' || state === 'falling') return;
    mode = m; data.mode = m; save();
    document.querySelectorAll('#modes button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.m === m)));
    $('sub').textContent = SUBS[m];
    $('best').textContent = bestText(m);
    state = 'idle'; t = 0; p1 = p2 = w1 = w2 = bend1 = bend2 = 0; streaks = []; wind = 0; stars = []; skyLv = levelIndex(); rain = [];
    stage.classList.remove('is-over', 'is-run', 'is-falling');
    stage.classList.toggle('is-dark', dark() || skyLv > 2.6);
    $('cEmoji').textContent = { single: '🥢', double: '🔥', stars: '⭐', zen: '🧘' }[m];
    $('cTitle').textContent = 'Ready?';
    $('cNew').innerHTML = '';
    $('rStats').hidden = true; $('rChips').innerHTML = ''; $('spark').hidden = true; $('share').hidden = true; $('extra').hidden = true;
    $('cText').textContent = m === 'double' ? 'Hard mode. The top stick swings on its own hinge.' : m === 'stars' ? 'Stars appear near the tip. Lean into them to collect.' : 'Mouse: just move. Touch: drag anywhere. Keyboard: arrow keys.';
    $('go').textContent = 'Start balancing';
    card.hidden = false;
    placeCard();
    draw();
  }

  function showExtra(kind) {
    const ex = $('extra');
    if (!ex.hidden && ex.dataset.kind === kind) { ex.hidden = true; return; }
    ex.dataset.kind = kind; ex.hidden = false; ex.innerHTML = '';
    if (kind === 'badges') {
      const wrap = document.createElement('div'); wrap.className = 'bs-badges';
      BADGES.forEach(([id, ico, name, desc]) => {
        const d = document.createElement('div'); d.className = 'bs-badge' + (data.badges[id] ? ' is-got' : '');
        const i = document.createElement('i'); i.textContent = ico;
        const tx = document.createElement('div'); const b = document.createElement('b'); b.textContent = name; tx.append(b, document.createTextNode(desc));
        d.append(i, tx); wrap.append(d);
      });
      ex.append(wrap);
    } else {
      const p = document.createElement('p');
      p.style.cssText = 'text-align:left;font-size:14px;margin:10px 0 0';
      p.textContent = 'Move under the stick in the direction it leans: small, early moves beat big late ones. The wind picks up every few seconds and the sky turns stormy as you last longer, while gravity slowly gets stronger. Double stacks a second pole on a hinge. Stars mode rewards leaning the tip into floating stars. Zen has no wind at all. Earn badges to unlock new sticks: Broom, Bamboo, Torch and Neon.';
      ex.append(p);
    }
  }

  const toX = (e) => e.clientX - cv.getBoundingClientRect().left;
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse' || state === 'run') { target = Math.max(30, Math.min(W - 30, toX(e))); if (state === 'run') usedPointer = true; }
  });
  cv.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    target = Math.max(30, Math.min(W - 30, toX(e)));
    if (state === 'idle' || (state === 'over' && performance.now() - overAt > 700)) { x = target; begin(); }
  });
  $('go').addEventListener('click', () => { if (state === 'idle' || state === 'over') begin(); });
  $('modes').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setMode(b.dataset.m); });
  $('skins').addEventListener('click', (e) => {
    const b = e.target.closest('.bs-skin'); if (!b) return;
    const s = SKINS.find((q) => q.id === b.dataset.s);
    if (!unlocked(s)) { Curio.toast(`Locked. ${b.title}`); tone(200, .1, 'square', .04); return; }
    data.skin = s.id; save(); paintSkins(); draw(); tone(760, .06, 'triangle', .06);
  });
  $('showBadges').addEventListener('click', () => showExtra('badges'));
  $('showHow').addEventListener('click', () => showExtra('how'));
  $('share').addEventListener('click', () => {
    const line = mode === 'stars' ? `caught ${starCount} stars in ${fmt(t)}s` : `balanced for ${fmt(t)}s (${mode})`;
    const txt = `Curio Balance the Stick 🥢\nI ${line}, reached ${LEVELS[levelIndex()][1].replace('!', '')}.`;
    navigator.clipboard?.writeText(txt).then(() => Curio.toast('Result copied!'), () => Curio.toast(line));
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); keyDir = e.key === 'ArrowLeft' ? -1 : 1; if (state === 'idle') begin(); }
    else if ((e.key === 'Enter' || e.key === ' ') && state === 'over' && !e.target.closest('button') && performance.now() - overAt > 700) { e.preventDefault(); begin(); }
  });
  document.addEventListener('keyup', (e) => {
    if ((e.key === 'ArrowLeft' && keyDir < 0) || (e.key === 'ArrowRight' && keyDir > 0)) keyDir = 0;
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else if (state === 'run' || state === 'falling') { last = performance.now(); raf = requestAnimationFrame(loop); }
  });
  window.addEventListener('resize', () => { resize(); placeCard(); });
  window.addEventListener('curio:theme', () => { stage.classList.toggle('is-dark', dark() || skyLv > 2.6); draw(); });
  window.__stick = { get state() { return state; }, get angle() { return p1; }, get angle2() { return p2; }, get omega() { return w1; }, get omega2() { return w2; }, get wind() { return wind; }, get x() { return x; }, get time() { return t; }, setTarget(val) { target = val; }, setT(val) { t = val; }, get stars() { return starCount; } };
  W = stage.clientWidth; H = stage.clientHeight;
  paintSkins(); paintBadgeCount();
  resize();
  setMode(mode);
})();
