(function () {
  const R = 6371;
  const SEC = [[0, 0.2, 6000], [0.2, 5, 500], [5, 15, 250], [15, 700, 8], [700, R, 1.3]];
  const SIMPLE = Curio.simple;
  const HL = new Set(['Six feet under', 'Paris Catacombs', 'Seikan Tunnel', 'Deepest cave: Veryovkina', 'Deepest mine: Mponeng', 'Everest, upside down', 'Challenger Deep (for comparison)', 'Kola Superdeep Borehole', 'Moho (under continents)', 'Diamonds are born', 'Deepest earthquakes', 'Core-mantle boundary', 'The geodynamo', 'Inner core boundary', 'As hot as the Sun', 'The centre of the Earth']);
  const ITEMS = SIMPLE ? window.EARTH_MARKERS.filter((it) => HL.has(it.name)) : window.EARTH_MARKERS;
  const LAYERS = [
    { d: 0, name: 'Crust', note: 'Solid rock. The thin skin we live on.' },
    { d: 35, name: 'Upper mantle', note: 'Solid, rigid rock: still part of the tectonic plate.' },
    { d: 100, name: 'Asthenosphere', note: 'Hot rock that can flow very slowly.' },
    { d: 410, name: 'Transition zone', note: 'Minerals crushed into denser crystals.' },
    { d: 660, name: 'Lower mantle', note: 'Hot, solid rock, squeezed hard.' },
    { d: 2891, name: 'Outer core', note: 'Liquid iron and nickel.' },
    { d: 5150, name: 'Inner core', note: 'Solid iron and nickel, as hot as the Sun\'s surface.' }
  ];
  const TEMP = [[0, 15], [0.02, 12], [1, 40], [4, 65], [12.262, 180], [35, 550], [100, 1300], [410, 1500], [660, 1650], [2700, 2500], [2891, 3800], [5150, 5300], [R, 5400]];
  const PRES = [[0, 0], [35, 1.0], [100, 3.2], [220, 7.1], [410, 13.8], [660, 23.4], [1000, 38.6], [2000, 88.8], [2891, 135.8], [4000, 240], [5150, 328.9], [5700, 353], [R, 364]];
  const STOPS = [[0, [110, 76, 46]], [0.2, [96, 72, 54]], [5, [80, 68, 62]], [35, [92, 62, 50]], [100, [138, 54, 30]], [660, [158, 44, 22]], [2890, [104, 22, 12]], [2892, [214, 104, 18]], [5149, [240, 160, 36]], [5151, [246, 186, 70]], [R, [252, 214, 120]]];
  const NOTES = [
    [0.15, 'Nearly everything humans have ever built underground is above this line.'],
    [3.3, 'It is getting hot: the rock warms by roughly 25 °C for every kilometre down.'],
    [13.6, 'Below this point nothing humans have made has ever been. Everything we know comes from earthquake waves.'],
    [25, 'Compared to the whole Earth, the crust you just dug through is thinner than the skin of an apple.'],
    [1000, 'The mantle makes up 84% of Earth\'s volume. Settle in.'],
    [2050, 'Still mantle. It is around 2,500 °C, yet solid: the pressure stops the rock from melting.'],
    [3000, 'Splash. The outer core is liquid metal, about as runny as water but ten times denser.'],
    [4700, 'The core is a little bigger than the whole planet Mars.'],
    [5900, 'The solid inner core is about 70% as wide as the Moon.']
  ];

  const $ = (id) => document.getElementById(id);
  const earth = $('earth'), ruler = $('ruler'), rock = $('rock'), meter = $('meter'), pointer = $('pointer');
  const yOf = (d) => { let y = 0; for (const [a, b, r] of SEC) { if (d <= b) return y + (Math.max(d, a) - a) * r; y += (b - a) * r; } return y; };
  const dOf = (y) => { let acc = 0; for (const [a, b, r] of SEC) { const s = (b - a) * r; if (y <= acc + s) return a + (y - acc) / r; acc += s; } return R; };
  const floorY = yOf(R);
  const TAIL = Math.max(640, Math.round(innerHeight * 0.8));
  earth.style.height = `${floorY + TAIL}px`;

  const fmtD = (d, short) => d < 1 ? `${Curio.fmt(d * 1000, d < 0.01 ? 1 : 0)} m` : d < 20 && !short ? `${Curio.fmt(d * 1000)} m` : `${Curio.fmt(d, d < 20 ? 1 : 0)} km`;

  let rh = '';
  for (const [a, b, r] of SEC) {
    const steps = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500];
    const step = steps.find((s) => s * r >= 90) || 500;
    for (let v = a + step; v <= b + 1e-9; v += step) { const val = Math.round(v * 1000) / 1000; rh += `<div class="tick" style="top:${yOf(val)}px"><span>${fmtD(val, true)}</span></div>`; }
  }
  ruler.innerHTML = rh;

  for (const L of LAYERS) {
    if (L.d === 0) continue;
    const el = document.createElement('div');
    el.className = 'layer';
    el.style.top = `${yOf(L.d)}px`;
    el.innerHTML = `<b>${L.name} · ${Curio.fmt(L.d)} km</b>`;
    earth.append(el);
  }
  const SECBANDS = SEC.slice(1).map(([a, , r], i) => ({ d: a, r, prev: SEC[i][2] }));
  for (const s of SECBANDS) {
    if (LAYERS.some((L) => L.d === s.d)) continue;
    const el = document.createElement('div');
    el.className = 'layer sec';
    el.style.top = `${yOf(s.d)}px`;
    const z = s.prev / s.r;
    el.innerHTML = `<b>Speeding up ${Curio.fmt(z, z < 10 ? 1 : 0)}× · 1 km = ${Curio.fmt(s.r, s.r < 10 ? 1 : 0)} px</b>`;
    earth.append(el);
  }

  const end = document.createElement('div');
  end.className = 'end';
  end.style.top = `${floorY + 150}px`;
  end.innerHTML = '<h2>🎯 You reached the centre of the Earth</h2><p>6,371 km down. Every direction is now up. If you kept digging you would come out at your antipode, which for most people is somewhere in the ocean.</p><div class="c-row" style="justify-content:center"><button class="c-btn" type="button" id="again">Back to the surface ⏫</button><button class="c-btn c-btn--ghost adv" type="button" id="endThru">🌏 Dig straight through</button><button class="c-btn c-btn--ghost adv" type="button" id="endQuiz">🎯 Quiz</button><button class="c-btn c-btn--ghost simple-only" type="button" id="endAdv">⛏️ All 56 stops</button></div>';
  earth.append(end);

  const noteCards = (SIMPLE ? NOTES.filter((n, i) => i % 3 === 0) : NOTES).map(([d, t]) => {
    const el = document.createElement('p');
    el.className = 'note';
    el.textContent = t;
    earth.append(el);
    return { it: { d }, el, note: true };
  });
  const cards0 = ITEMS.map((it) => {
    const el = document.createElement('article');
    el.className = 'item';
    el.tabIndex = 0;
    el.innerHTML = `<div class="hd"><span class="em" role="img"></span><div><div class="nm"></div><div class="dp"></div></div></div><p></p>`;
    el.querySelector('.em').textContent = it.e;
    el.querySelector('.em').setAttribute('aria-label', it.name);
    el.querySelector('.nm').textContent = it.name;
    el.querySelector('.dp').textContent = it.d < 1 ? `${fmtD(it.d)} · ${Curio.fmt(it.d * 3280.84)} ft` : `${fmtD(it.d)} · ${Curio.fmt(it.d * 0.621371, it.d < 20 ? 1 : 0)} mi`;
    el.querySelector('p').textContent = it.fact;
    earth.append(el);
    const pin = document.createElement('div');
    pin.className = 'pin';
    pin.style.top = `${yOf(it.d)}px`;
    earth.append(pin);
    return { it, el };
  });
  earth.addEventListener('click', (e) => {
    const card = e.target.closest('.item');
    document.querySelectorAll('.item.open').forEach((x) => { if (x !== card) x.classList.remove('open'); });
    if (card) card.classList.toggle('open');
  });
  const cards = cards0.concat(noteCards).sort((a, b) => a.it.d - b.it.d);
  const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  function layout() {
    const W = earth.clientWidth;
    const rw = W < 600 ? 44 : 64;
    const inner = W - rw - 14;
    const C = W < 600 ? 2 : W < 900 ? 3 : 4;
    const colW = inner / C;
    for (const c of cards) {
      const cw = c.note ? Math.min(colW * 2 - 12, W < 600 ? 230 : 300) : Math.min(colW - 10, W < 600 ? 170 : 230);
      c.el.style.width = `${cw}px`;
      c.w = cw;
    }
    for (const c of cards) c.h = c.el.offsetHeight;
    const bottoms = new Array(C).fill(-1e9);
    const bandYs = LAYERS.slice(1).map((L) => yOf(L.d)).concat(SECBANDS.map((s) => yOf(s.d))).sort((a, b) => a - b);
    let bi = 0, last = -1;
    cards.forEach((c, i) => {
      const lineY = yOf(c.it.d);
      while (bi < bandYs.length && lineY - 20 >= bandYs[bi]) {
        for (let j = 0; j < C; j++) bottoms[j] = Math.max(bottoms[j], bandYs[bi] + 40);
        bi++;
      }
      const target = Math.max(30, lineY - 26);
      const span = c.note ? 2 : 1;
      const free = [];
      for (let j = 0; j <= C - span; j++) {
        let ok = j !== last;
        for (let s = 0; s < span; s++) if (bottoms[j + s] + 12 > target) ok = false;
        if (ok) free.push(j);
      }
      let col, top;
      const maxB = (j) => Math.max(...bottoms.slice(j, j + span));
      if (free.length) { col = free[Math.floor(hash(i) * free.length)]; top = target; }
      else {
        col = 0;
        for (let j = 1; j <= C - span; j++) if (maxB(j) < maxB(col)) col = j;
        top = Math.max(target, maxB(col) + 12);
      }
      last = col;
      for (let s = 0; s < span; s++) bottoms[col + s] = top + c.h;
      const slotW = colW * span;
      const x = rw + 14 + col * colW + (slotW - c.w) * (c.note ? 0.5 : hash(i + 7) * 0.8);
      c.el.style.left = `${x}px`;
      c.el.style.top = `${top}px`;
      if (!c.note) c.el.style.setProperty('--ty', `${Math.max(12, Math.min(c.h - 10, lineY - top))}px`);
    });
  }

  const lerp = (a, b, t) => a + (b - a) * t;
  const interp = (T, d) => { for (let i = 1; i < T.length; i++) if (d <= T[i][0]) return lerp(T[i - 1][1], T[i][1], (d - T[i - 1][0]) / (T[i][0] - T[i - 1][0])); return T[T.length - 1][1]; };
  function rockColor(d) {
    for (let i = 1; i < STOPS.length; i++) if (d <= STOPS[i][0]) {
      const t = (d - STOPS[i - 1][0]) / (STOPS[i][0] - STOPS[i - 1][0]);
      return STOPS[i - 1][1].map((v, j) => Math.round(lerp(v, STOPS[i][1][j], t)));
    }
    return STOPS[STOPS.length - 1][1];
  }
  function fmtP(gpa) {
    const atm = gpa * 9869.23 + 1;
    if (atm < 10000) return `${Curio.fmt(atm)} atm`;
    if (atm < 1e6) return `${Curio.fmt(atm / 1000)}k atm`;
    return `${Curio.fmt(atm / 1e6, 2)}M atm`;
  }

  let depth = 0, layerIdx = 0, maxLayer = 0, reached = false;
  function update() {
    const top = earth.getBoundingClientRect().top;
    const d = Math.max(0, Math.min(R, dOf(Math.max(0, innerHeight / 2 - top))));
    depth = d;
    const inside = top < innerHeight * 0.55;
    meter.classList.toggle('off', !inside);
    pointer.classList.toggle('off', !inside);
    const [r, g, b] = rockColor(d);
    rock.style.background = `rgb(${r},${g},${b})`;
    if (d < 1) $('mD').innerHTML = `${Curio.fmt(d * 1000)} <small>m</small>`;
    else $('mD').innerHTML = `${Curio.fmt(d, d < 20 ? 2 : 0)} <small>km</small>`;
    $('mMi').textContent = `${Curio.fmt(d * 0.621371, d < 20 ? 2 : 0)} miles · ${Curio.fmt((d / R) * 100, 1)}%`;
    const T = interp(TEMP, d), P = interp(PRES, d);
    if (d > 12.3) award('kola');
    if (d > 2891) award('liquid');
    $('mT').textContent = `${Curio.fmt(T)} °C`;
    $('mP').textContent = fmtP(P);
    const tp = Math.min(1, T / 5500), pp = Math.min(1, Math.sqrt(P / 364));
    $('gT').querySelector('i').style.width = `${tp * 100}%`;
    $('gP').querySelector('i').style.width = `${pp * 100}%`;
    const rr = (1 - d / R) * 100;
    $('mapDot').setAttribute('cx', (rr * Math.SQRT1_2).toFixed(1));
    $('mapDot').setAttribute('cy', (100 - rr * Math.SQRT1_2).toFixed(1));
    let li = 0;
    for (let i = 0; i < LAYERS.length; i++) if (d >= LAYERS[i].d) li = i;
    if (li !== layerIdx || !$('mLayerNote').dataset.set) {
      $('mLayer').textContent = LAYERS[li].name;
      $('mLayerNote').textContent = LAYERS[li].note;
      $('mLayerNote').dataset.set = '1';
    }
    if (li !== layerIdx) {
      if (li > maxLayer) {
        meter.classList.remove('flash'); void meter.offsetWidth; meter.classList.add('flash');
        Curio.beep(300 - li * 25, 0.5, 'sawtooth', 0.04);
        setTimeout(() => Curio.beep(150, 0.6, 'sine', 0.06), 120);
        Curio.toast(`Entering the ${LAYERS[li].name.toLowerCase()}`);
        maxLayer = li;
      }
      layerIdx = li;
    }
    if (!reached && d >= R - 2) {
      reached = true;
      setDig(false);
      Curio.confetti();
      [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.18, 'triangle', 0.08), i * 110));
      const b = Curio.best('cores', (Curio.getBest('cores') || 0) + 1);
      Curio.toast(b.best > 1 ? `Centre of the Earth, visit #${b.best} 🎯` : 'You reached the centre of the Earth! 🎯', 2800);
      award('core');
    }
  }

  let digging = false, lastT = 0, running = true;
  const digBtn = $('dig');
  function setDig(on) {
    digging = on;
    digBtn.setAttribute('aria-pressed', String(on));
    digBtn.textContent = on ? '⏸ Stop' : '⏬ Dig';
    if (on) { lastT = performance.now(); requestAnimationFrame(frame); }
  }
  let hold = 0, spot = null;
  const curY = () => innerHeight / 2 - earth.getBoundingClientRect().top;
  const stopY = (c) => parseFloat(c.el.style.top) + c.h / 2;
  const stops = () => cards.filter((c) => !c.note).sort((a, b) => stopY(a) - stopY(b));
  function spotlight(c) {
    if (spot) spot.el.classList.remove('spot');
    spot = c;
    if (!c) return;
    c.el.classList.add('spot', 'open');
    const i = stops().indexOf(c);
    Curio.beep(330 - i * 12, 0.22, 'triangle', 0.06); setTimeout(() => Curio.beep(220 - i * 8, 0.3, 'sine', 0.05), 90);
  }
  function tourStep(now, dt) {
    if (now < hold) return;
    const y = curY();
    const st = stops().find((c) => stopY(c) > y + 3);
    if (!st) { window.scrollBy(0, 700 * dt); return; }
    const gap = stopY(st) - y;
    const v = gap < 300 ? Math.max(80, gap * 2.6) : Math.min(2600, 800 + gap * 0.5);
    const step = Math.min(gap, v * dt);
    window.scrollBy(0, step);
    if (gap - step < 4) { hold = now + 2700; spotlight(st); }
  }
  function nextStop() {
    const y = curY();
    const st = stops().find((c) => stopY(c) > y + 6);
    setDig(false);
    if (!st) { scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' }); return; }
    window.scrollBy({ top: stopY(st) - y, behavior: 'smooth' });
    setTimeout(() => spotlight(st), 500);
  }
  function frame(now) {
    if (!digging || !running) return;
    const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
    if (SIMPLE) tourStep(now, dt); else window.scrollBy(0, 420 * SPEEDS[speedI] * dt);
    if (depth >= R) setDig(false);
    requestAnimationFrame(frame);
  }
  digBtn.addEventListener('click', () => { hold = 0; setDig(!digging); });
  $('nextStop').addEventListener('click', nextStop);
  $('endAdv').addEventListener('click', () => Curio.setMode('advanced'));
  if (SIMPLE) $('dig0').textContent = 'Take the express drill ↓';
  $('dig0').addEventListener('click', () => { Curio.beep(220, 0.15, 'square', 0.04); earth.scrollIntoView({ behavior: 'smooth' }); setTimeout(() => setDig(true), 700); });
  const toSurface = () => { setDig(false); scrollTo({ top: 0, behavior: 'smooth' }); Curio.beep(880, 0.2, 'sine', 0.05); };
  $('up').addEventListener('click', toSurface);
  $('again').addEventListener('click', toSurface);
  ['wheel', 'touchstart'].forEach((ev) => addEventListener(ev, (e) => { if (digging && e.target !== digBtn && e.target !== $('nextStop') && e.target !== $('dig0')) setDig(false); }, { passive: true }));
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (document.hidden) setDig(false); });

  const buzz = (ms) => { try { if (!Curio.muted && navigator.vibrate) navigator.vibrate(ms); } catch (x) {} };
  const BADGES = [
    { id: 'core', e: '🎯', name: 'Centre of it all', d: 'Reach the centre of the Earth' },
    { id: 'kola', e: '🕳️', name: 'Deeper than Kola', d: 'Go deeper than any hole humans have dug' },
    { id: 'liquid', e: '🫗', name: 'Splash', d: 'Reach the liquid outer core' },
    { id: 'turbo', e: '⚡', name: 'Turbo drill', d: 'Dig at 5× speed' },
    { id: 'thru', e: '🌏', name: 'Other side', d: 'Find an antipode on land' },
    { id: 'fall', e: '🪂', name: 'Gravity tunnel', d: 'Fall all the way through the Earth' },
    { id: 'streak', e: '🔥', name: 'Rock solid', d: 'Get a streak of 10 in Deeper or shallower' },
    { id: 'daily', e: '📅', name: 'Daily digger', d: 'Play the daily challenge' }
  ];
  const BKEY = 'el:badges:v1';
  let badges = Curio.store.get(BKEY, {});
  if (!badges || typeof badges !== 'object') badges = {};
  function award(id) {
    if (badges[id]) return;
    const b = BADGES.find((x) => x.id === id); if (!b) return;
    badges[id] = Date.now(); Curio.store.set(BKEY, badges); paintBadges();
    Curio.toast(`${b.e} Badge: ${b.name}`, 2400);
    [784, 988, 1318].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.14, 'triangle', 0.06), i * 90));
    buzz([20, 40, 20]);
  }
  function paintBadges() { $('badgeCount').textContent = `${BADGES.filter((b) => badges[b.id]).length}/${BADGES.length} badges`; }
  $('badgesBtn').addEventListener('click', () => {
    const box = document.createElement('div'); box.className = 'badgeList';
    BADGES.forEach((b) => { const d = document.createElement('div'); if (!badges[b.id]) d.className = 'off'; d.innerHTML = `<i>${b.e}</i><div><b></b><span></span></div>`; d.querySelector('b').textContent = b.name; d.querySelector('span').textContent = b.d; box.append(d); });
    Curio.modal({ emoji: '🏅', title: 'Badges', body: box, buttons: [{ label: 'Close', value: 0 }] });
  });
  paintBadges();
  $('statN').textContent = `⛏️ ${ITEMS.length} stops on the way`;

  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -5% 0px' }) : null;
  cards0.forEach((c) => { c.el.classList.add('rv'); if (io) io.observe(c.el); else c.el.classList.add('in'); });

  const DECOR = [[0.0008, '🦴'], [0.004, '🐚'], [0.012, '💎'], [0.03, '🏺'], [0.09, '🦕'], [0.16, '🪨'], [0.7, '💧'], [3, '🔥']];
  DECOR.forEach(([d, e], i) => { const el = document.createElement('div'); el.className = 'decor'; el.textContent = e; el.style.top = `${yOf(d)}px`; el.style.left = `${[72, 18, 55, 88, 30, 66, 44, 80][i]}%`; earth.append(el); });

  const SPEEDS = [1, 2, 5];
  let speedI = 0;
  $('speed').addEventListener('click', () => {
    speedI = (speedI + 1) % SPEEDS.length;
    $('speed').textContent = `${SPEEDS[speedI]}×`;
    Curio.beep(300 + speedI * 150, 0.08, 'square', 0.04);
    if (SPEEDS[speedI] === 5) award('turbo');
    if (!digging) setDig(true);
  });

  const cv = $('rockC'), g = cv.getContext('2d');
  const RK = { w: 0, h: 0, parts: [] };
  function sizeRock() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    RK.w = innerWidth; RK.h = innerHeight;
    cv.width = RK.w * dpr; cv.height = RK.h * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
    RK.parts = Array.from({ length: Math.round(RK.w * RK.h / 5000) }, () => ({ x: Math.random() * RK.w, y: Math.random() * RK.h * 2, r: 1 + Math.random() * 5, z: .3 + Math.random() * .9, s: Math.random(), p: Math.random() * 6.3 }));
  }
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let lastScroll = scrollY;
  function drawRock(now) {
    if (!document.hidden) {
      const t = now / 1000, d = depth;
      g.clearRect(0, 0, RK.w, RK.h);
      const zone = d < 35 ? 0 : d < 2891 ? 1 : d < 5150 ? 2 : 3;
      const sy = scrollY;
      const H2 = RK.h * 2;
      if (zone === 0) {
        for (const p of RK.parts) {
          const y = ((p.y - sy * p.z * .5) % H2 + H2) % H2 - RK.h * .5;
          if (y < -10 || y > RK.h + 10) continue;
          g.fillStyle = p.s < .5 ? 'rgba(0,0,0,.16)' : p.s < .8 ? 'rgba(255,240,220,.08)' : 'rgba(40,20,10,.22)';
          g.beginPath(); g.ellipse(p.x, y, p.r * 1.4, p.r, p.p, 0, 6.283); g.fill();
        }
        g.strokeStyle = 'rgba(0,0,0,.08)'; g.lineWidth = 2;
        for (let i = 0; i < 6; i++) { const y = ((i * 170 - sy * .35) % (RK.h + 200) + RK.h + 200) % (RK.h + 200) - 100; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= RK.w; x += 40) g.lineTo(x, y + Math.sin(x / 90 + i) * 12); g.stroke(); }
      } else if (zone === 1) {
        for (const p of RK.parts) {
          const y = ((p.y - sy * p.z * .4 - t * 12 * p.z) % H2 + H2) % H2 - RK.h * .5;
          if (y < -20 || y > RK.h + 20) continue;
          const a = .08 + .1 * Math.sin(t * 1.5 + p.p) ** 2;
          const gr = g.createRadialGradient(p.x, y, 0, p.x, y, p.r * 8);
          gr.addColorStop(0, `rgba(255,${120 + p.s * 80 | 0},40,${a})`); gr.addColorStop(1, 'rgba(255,90,20,0)');
          g.fillStyle = gr; g.beginPath(); g.arc(p.x, y, p.r * 8, 0, 6.283); g.fill();
        }
      } else if (zone === 2) {
        for (let i = 0; i < 9; i++) {
          g.strokeStyle = `rgba(255,${200 + i * 5},120,.12)`; g.lineWidth = 10 + i * 2;
          const y0 = (i / 9) * RK.h + Math.sin(t * .6 + i) * 30;
          g.beginPath(); g.moveTo(0, y0);
          for (let x = 0; x <= RK.w; x += 30) g.lineTo(x, y0 + Math.sin(x / 120 + t * 1.2 + i) * 26);
          g.stroke();
        }
      } else {
        for (const p of RK.parts) {
          const y = ((p.y - sy * p.z * .2) % H2 + H2) % H2 - RK.h * .5;
          if (y < 0 || y > RK.h) continue;
          g.globalAlpha = .25 + .5 * Math.sin(t * 2 + p.p) ** 2;
          g.fillStyle = '#fffbe0';
          g.save(); g.translate(p.x, y); g.rotate(.785); g.fillRect(-p.r * .5, -p.r * .5, p.r, p.r); g.restore();
        }
        g.globalAlpha = 1;
      }
      if (digging && Math.abs(scrollY - lastScroll) > 0) {
        for (let i = 0; i < 3; i++) sparks.push({ x: RK.w * .5 + (Math.random() - .5) * 40, y: RK.h * .5, vx: (Math.random() - .5) * 5, vy: -Math.random() * 4 - 1, l: 1 });
      }
      lastScroll = scrollY;
      for (const s of sparks) { s.x += s.vx; s.y += s.vy; s.vy += .2; s.l -= .03; g.globalAlpha = Math.max(0, s.l); g.fillStyle = zone === 0 ? '#c9a27a' : '#ffcf6e'; g.fillRect(s.x, s.y, 3, 3); }
      g.globalAlpha = 1;
      for (let i = sparks.length - 1; i >= 0; i--) if (sparks[i].l <= 0) sparks.splice(i, 1);
    }
    if (!still) requestAnimationFrame(drawRock);
  }
  const sparks = [];
  sizeRock();
  addEventListener('resize', sizeRock);
  requestAnimationFrame(drawRock);
  if (still) addEventListener('scroll', () => requestAnimationFrame(drawRock), { passive: true });

  let openPanel = null;
  function showPanel(id) {
    closePanels(); setDig(false);
    openPanel = $(id); openPanel.hidden = false;
    document.body.style.overflow = 'hidden';
    openPanel.scrollTop = 0;
    openPanel.querySelector('.panel__x').focus();
    Curio.beep(330, 0.15, 'sine', 0.05); setTimeout(() => Curio.beep(660, 0.12, 'sine', 0.04), 70);
  }
  function closePanels() { document.querySelectorAll('.panel').forEach((p) => { p.hidden = true; }); openPanel = null; document.body.style.overflow = ''; stopFall(); }
  document.querySelectorAll('.panel').forEach((p) => p.addEventListener('click', (e) => { if (e.target === p || e.target.closest('[data-close]')) closePanels(); }));

  const CITIES = [['London', 51.5, -0.13], ['Paris', 48.86, 2.35], ['Madrid', 40.42, -3.7], ['Rome', 41.9, 12.5], ['Berlin', 52.52, 13.4], ['Moscow', 55.76, 37.62], ['Reykjavík', 64.15, -21.94], ['Cairo', 30.04, 31.24], ['Lagos', 6.52, 3.38], ['Nairobi', -1.29, 36.82], ['Cape Town', -33.92, 18.42], ['Dubai', 25.2, 55.27], ['Mumbai', 19.08, 72.88], ['Delhi', 28.61, 77.21], ['Beijing', 39.9, 116.4], ['Shanghai', 31.23, 121.47], ['Hong Kong', 22.32, 114.17], ['Tokyo', 35.68, 139.69], ['Seoul', 37.57, 126.98], ['Singapore', 1.35, 103.82], ['Jakarta', -6.2, 106.85], ['Sydney', -33.87, 151.21], ['Auckland', -36.85, 174.76], ['Christchurch', -43.53, 172.64], ['Honolulu', 21.31, -157.86], ['Anchorage', 61.22, -149.9], ['Vancouver', 49.28, -123.12], ['Los Angeles', 34.05, -118.24], ['Mexico City', 19.43, -99.13], ['Chicago', 41.88, -87.63], ['New York', 40.71, -74.01], ['Bogotá', 4.71, -74.07], ['Lima', -12.05, -77.04], ['São Paulo', -23.55, -46.63], ['Buenos Aires', -34.6, -58.38]];
  const X = (lon) => (lon + 180) * 2, Y = (lat) => (90 - lat) * 2;
  function inPoly(lon, lat, arr) {
    let inside = false;
    for (let i = 0, j = arr.length - 2; i < arr.length; j = i, i += 2) {
      const xi = arr[i], yi = arr[i + 1], xj = arr[j], yj = arr[j + 1];
      if ((yi > lat) !== (yj > lat) && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  const onLand = (lat, lon) => (window.EL_LAND || []).some((p) => inPoly(lon, lat, p)) && !(window.EL_LAKES || []).some((p) => inPoly(lon, lat, p));
  function oceanName(lat, lon) {
    if (lat < -60) return 'the Southern Ocean';
    if (lat > 66) return 'the Arctic Ocean';
    if (lat > 30 && lat < 46 && lon > -5 && lon < 36) return 'the Mediterranean Sea';
    if (lat >= 0) {
      if (lon > -80 && lon < 0) return 'the Atlantic Ocean';
      if (lon >= -100 && lon <= -80 && lat > 17) return 'the Gulf of Mexico';
      if (lon > 30 && lon < 100 && lat < 30) return 'the Indian Ocean';
      return 'the Pacific Ocean';
    }
    if (lon > -70 && lon < 20) return 'the Atlantic Ocean';
    if (lon >= 20 && lon < 135) return 'the Indian Ocean';
    return 'the Pacific Ocean';
  }
  const fmtLL = (lat, lon) => `${Curio.fmt(Math.abs(lat), 1)}° ${lat >= 0 ? 'N' : 'S'}, ${Curio.fmt(Math.abs(lon), 1)}° ${lon >= 0 ? 'E' : 'W'}`;
  let mapBuilt = false;
  function buildMap() {
    if (mapBuilt) return; mapBuilt = true;
    const svg = $('wsvg');
    let h = '<rect width="720" height="360" class="sea"/>';
    for (let lat = -60; lat <= 60; lat += 30) h += `<line x1="0" x2="720" y1="${Y(lat)}" y2="${Y(lat)}" class="grat"/>`;
    for (let lon = -150; lon <= 150; lon += 30) h += `<line y1="0" y2="360" x1="${X(lon)}" x2="${X(lon)}" class="grat"/>`;
    h += '<g class="land">' + (window.EL_LAND || []).map((p) => { let d = ''; for (let i = 0; i < p.length; i += 2) d += `${i ? 'L' : 'M'}${X(p[i]).toFixed(1)} ${Y(p[i + 1]).toFixed(1)}`; return `<path d="${d}Z"/>`; }).join('') + '</g>';
    h += '<g class="lakes">' + (window.EL_LAKES || []).map((p) => { let d = ''; for (let i = 0; i < p.length; i += 2) d += `${i ? 'L' : 'M'}${X(p[i]).toFixed(1)} ${Y(p[i + 1]).toFixed(1)}`; return `<path d="${d}Z"/>`; }).join('') + '</g>';
    h += '<g id="mk"></g>';
    svg.innerHTML = h;
    svg.addEventListener('click', (e) => {
      const r = svg.getBoundingClientRect();
      const lon = (e.clientX - r.left) / r.width * 360 - 180, lat = 90 - (e.clientY - r.top) / r.height * 180;
      $('city').value = '';
      pickPoint(lat, lon, null);
    });
    const sel = $('city');
    sel.innerHTML = '<option value="">Pick a city…</option>' + CITIES.map((c, i) => `<option value="${i}">${c[0]}</option>`).join('');
    sel.addEventListener('change', () => { if (sel.value !== '') { const c = CITIES[Number(sel.value)]; pickPoint(c[1], c[2], c[0]); } });
  }
  function pickPoint(lat, lon, name) {
    const alat = -lat, alon = lon > 0 ? lon - 180 : lon + 180;
    const land = onLand(alat, alon);
    const startLand = onLand(lat, lon);
    const near = CITIES.map((c) => ({ c, d: Math.hypot(c[1] - alat, (c[2] - alon) * Math.cos(alat * Math.PI / 180)) })).sort((a, b) => a.d - b.d)[0];
    const mk = $('mk');
    mk.innerHTML = `<path d="M${X(lon)} ${Y(lat)} Q360 180 ${X(alon)} ${Y(alat)}" class="arc"/><circle cx="${X(lon)}" cy="${Y(lat)}" r="7" class="pA"/><circle cx="${X(alon)}" cy="${Y(alat)}" r="7" class="pB ${land ? 'land' : 'sea'}"/><circle cx="${X(alon)}" cy="${Y(alat)}" r="7" class="ping"/>`;
    const out = $('thruOut');
    const where = land ? (near && near.d < 6 ? `on land, not far from ${near.c[0]}` : 'on dry land') : `in ${oceanName(alat, alon)}`;
    out.innerHTML = `<div class="tA"><i>🅰️</i><div><b></b><span>${fmtLL(lat, lon)}${startLand ? '' : ' · at sea'}</span></div></div><div class="tArrow">⬇ 12,742 km through the core</div><div class="tB ${land ? 'land' : 'sea'}"><i>${land ? '🏝️' : '🌊'}</i><div><b>You come out ${where}</b><span>${fmtLL(alat, alon)}</span></div></div><p class="c-muted">${land ? 'Lucky! Only about 4% of land on Earth sits opposite other land.' : 'Bring a snorkel: most of the planet\'s land is opposite ocean.'}</p>`;
    out.querySelector('.tA b').textContent = name || 'Your spot';
    out.classList.remove('in'); void out.offsetWidth; out.classList.add('in');
    if (land) { award('thru'); [660, 880, 1100].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.12, 'triangle', 0.06), i * 80)); }
    else { Curio.beep(220, 0.3, 'sine', 0.06); setTimeout(() => Curio.beep(160, 0.4, 'sine', 0.05), 150); }
    buzz(20);
  }
  function openThru() { showPanel('thruPanel'); buildMap(); if (!$('mk').innerHTML) { $('city').value = '2'; pickPoint(CITIES[2][1], CITIES[2][2], CITIES[2][0]); } }
  $('openThru').addEventListener('click', openThru);

  let fallRaf = 0, fallT0 = 0;
  const FALL_MIN = 38;
  function stopFall() { cancelAnimationFrame(fallRaf); fallRaf = 0; $('jump').textContent = '🪂 Jump in'; }
  $('jump').addEventListener('click', () => {
    if (fallRaf) { stopFall(); return; }
    fallT0 = performance.now();
    $('jump').textContent = '⏸ Stop';
    Curio.beep(500, 0.2, 'sine', 0.05);
    let said = 0;
    const step = (now) => {
      if (document.hidden) { stopFall(); return; }
      const mins = (now - fallT0) / 1000;
      const ph = Math.min(1, mins / FALL_MIN);
      const y = 150 - 138 * Math.cos(Math.PI * ph);
      $('faller').setAttribute('cy', y.toFixed(1));
      const m = Math.floor(mins), s = Math.floor((mins - m) * 60);
      $('fallT').textContent = `${m}:${String(s).padStart(2, '0')}`;
      const msgs = [[0, 'Falling! You speed up as you drop through the crust and mantle.'], [12, 'Into the liquid outer core. You are now going faster than any bullet.'], [19, 'Passing the very centre at top speed, with the whole planet pulling equally in every direction.'], [26, 'Now gravity pulls back. You are slowing down as you climb.'], [37, 'You drift up to the surface on the far side and stop. Grab on!']];
      for (let i = msgs.length - 1; i >= 0; i--) if (mins >= msgs[i][0]) { if (said !== i + 1) { said = i + 1; $('fallInfo').textContent = msgs[i][1]; Curio.beep(400 + i * 120, 0.1, 'triangle', 0.05); } break; }
      if (ph >= 1) { stopFall(); award('fall'); Curio.confetti(60); $('fallInfo').textContent = 'About 38 minutes, end to end. Let go now and you would fall back and arrive home 38 minutes later, forever.'; return; }
      fallRaf = requestAnimationFrame(step);
    };
    fallRaf = requestAnimationFrame(step);
  });

  function hashStr(str) { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const today = new Date();
  const dayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  $('dailyLabel').textContent = `10 rounds for ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  let qMode = 'endless';
  const Q = { list: [], i: 0, score: 0, ref: null, cur: null, locked: false, log: [] };
  document.querySelectorAll('#quizPanel .diff').forEach((b) => b.addEventListener('click', () => { qMode = b.dataset.d; document.querySelectorAll('#quizPanel .diff').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); paintQBest(); Curio.beep(520, 0.06, 'sine', 0.05); }));
  function paintQBest() { const b = Curio.getBest(`q-${qMode}`); $('qBest').textContent = b != null ? `Your best: ${b}` : 'No score yet'; }
  function openQuiz() { showPanel('quizPanel'); $('qStart').hidden = false; $('qPlay').hidden = true; $('qEnd').hidden = true; paintQBest(); }
  $('openQuiz').addEventListener('click', openQuiz);
  const fmtDepth = (d) => d < 1 ? `${Curio.fmt(d * 1000, d < 0.01 ? 1 : 0)} m` : `${Curio.fmt(d, d < 20 ? 1 : 0)} km`;
  function vcard(el, it, show) {
    el.innerHTML = `<span class="e"></span><b></b><span class="dp"></span>`;
    el.querySelector('.e').textContent = it.e;
    el.querySelector('b').textContent = it.name;
    el.querySelector('.dp').textContent = show ? fmtDepth(it.d) : '?';
    el.classList.remove('in', 'right', 'wrong'); void el.offsetWidth; el.classList.add('in');
  }
  function startQuiz() {
    const r = qMode === 'daily' ? rng(hashStr(`el-${dayKey}`)) : Math.random;
    const arr = ITEMS.slice();
    for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    Object.assign(Q, { list: arr, i: 1, score: 0, ref: arr[0], log: [] });
    $('qStart').hidden = true; $('qEnd').hidden = true; $('qPlay').hidden = false;
    nextQuiz();
  }
  function nextQuiz() {
    Q.locked = false;
    let c = Q.list[Q.i % Q.list.length];
    while (Math.abs(c.d - Q.ref.d) / Math.max(c.d, Q.ref.d) < 0.03) { Q.i++; c = Q.list[Q.i % Q.list.length]; }
    Q.cur = c;
    vcard($('qRef'), Q.ref, true); vcard($('qCur'), c, false);
    $('qRound').textContent = qMode === 'daily' ? `Round ${Q.log.length + 1}/10` : `Streak ${Q.score}`;
    $('qMsg').textContent = `Is it deeper or shallower than ${Q.ref.name}?`;
    $('qUp').disabled = $('qDown').disabled = false;
  }
  function answer(deeper) {
    if (Q.locked) return; Q.locked = true;
    $('qUp').disabled = $('qDown').disabled = true;
    const ok = (Q.cur.d > Q.ref.d) === deeper;
    $('qCur').querySelector('.dp').textContent = fmtDepth(Q.cur.d);
    $('qCur').classList.add(ok ? 'right' : 'wrong');
    Q.log.push(ok ? '🟫' : '🟥');
    if (ok) { Q.score++; $('qMsg').textContent = `Yes! ${fmtDepth(Q.cur.d)}.`; Curio.beep(500 + Math.min(Q.score, 20) * 30, 0.1, 'triangle', 0.07); buzz(12); if (Q.score >= 10) award('streak'); }
    else { $('qMsg').textContent = `Nope, it is ${fmtDepth(Q.cur.d)}.`; Curio.beep(150, 0.3, 'sawtooth', 0.05); buzz([40, 30, 40]); }
    $('qScore').textContent = Q.score;
    const done = qMode === 'daily' ? Q.log.length >= 10 : !ok;
    setTimeout(() => { if (done) endQuiz(); else { Q.ref = Q.cur; Q.i++; nextQuiz(); } }, ok ? 900 : 1400);
  }
  $('qUp').addEventListener('click', () => answer(false));
  $('qDown').addEventListener('click', () => answer(true));
  $('qGo').addEventListener('click', startQuiz);
  $('qAgain').addEventListener('click', () => { $('qEnd').hidden = true; $('qStart').hidden = false; paintQBest(); });
  function endQuiz() {
    $('qPlay').hidden = true; $('qEnd').hidden = false;
    const b = Curio.best(`q-${qMode}`, Q.score);
    const top = qMode === 'daily' ? Q.score >= 9 : Q.score >= 10;
    const col = top ? '#ffc233' : Q.score >= 5 ? '#c0c8d4' : '#d08a4a';
    $('qTrophy').innerHTML = `<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="56" fill="${col}" opacity=".2"/><path d="M28 30 L76 78" stroke="#8a5a33" stroke-width="8" stroke-linecap="round"/><path d="M70 72 L96 98 Q94 112 80 108 L62 90Z" fill="#9aa4ae"/><text x="40" y="96" text-anchor="middle" font-size="30" font-weight="900" fill="${col}" font-family="sans-serif">${Q.score}</text></svg>`;
    $('qEndTitle').textContent = top ? 'Geologist level!' : Q.score >= 5 ? 'Solid digging' : 'The ground is tricky';
    $('qeScore').textContent = Q.score; $('qeBest').textContent = b.best;
    if (qMode === 'daily') award('daily');
    if (top) Curio.confetti();
    [523, 659, 784].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.15, 'triangle', 0.07), i * 100));
  }
  $('qShare').addEventListener('click', async () => {
    const txt = `Dig to the Core · Deeper or shallower? ${qMode === 'daily' ? `(daily ${dayKey})` : '(endless)'}\n${Q.log.join('')} ${Q.score}`;
    try { await navigator.clipboard.writeText(txt); Curio.toast('Copied! 📋'); } catch (x) { Curio.toast('Could not copy, sorry'); }
  });

  addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (e.key === 'Escape') { if (openPanel) closePanels(); return; }
    if (openPanel) {
      if (openPanel.id === 'quizPanel' && !$('qPlay').hidden) { if (e.key === 'ArrowUp') { e.preventDefault(); answer(false); } if (e.key === 'ArrowDown') { e.preventDefault(); answer(true); } }
      return;
    }
    if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
    const k = e.key.toLowerCase();
    if (e.key === ' ' && tag !== 'button') { e.preventDefault(); setDig(!digging); return; }
    if (SIMPLE) { if (e.key === 'ArrowDown' || k === 'n') { e.preventDefault(); nextStop(); } else if (e.key === 'Home') { e.preventDefault(); toSurface(); } return; }
    if (digging && k !== 'shift') setDig(false);
    if (k === 't') openThru();
    else if (k === 'q') openQuiz();
    else if (e.key === 'Home') { e.preventDefault(); toSurface(); }
  });

  $('endThru').addEventListener('click', openThru);
  $('endQuiz').addEventListener('click', openQuiz);
  layout();
  addEventListener('scroll', update, { passive: true });
  let lw = innerWidth;
  addEventListener('resize', () => { if (innerWidth !== lw) { lw = innerWidth; layout(); } update(); });
  update();
})();

