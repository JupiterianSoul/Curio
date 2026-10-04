(function () {
  const SIMPLE = Curio.simple;
  const HL = new Set(['Ladybird', 'House cat', 'You (roughly)', 'Giraffe', 'Tyrannosaurus rex', 'Blue whale (on its tail)', 'Statue of Liberty', 'Saturn V rocket', 'Hyperion', 'Great Pyramid of Giza', 'Eiffel Tower', 'Empire State Building', 'Burj Khalifa', 'Mount Fuji', 'Mount Everest', 'Cruising airliner', 'Felix Baumgartner', 'Kármán line', 'Northern lights', 'International Space Station']);
  const ITEMS = SIMPLE ? window.TALL_ITEMS.filter((it) => HL.has(it.name)) : window.TALL_ITEMS;
  const SEC = [[0, 0.2, 2000], [0.2, 2, 400], [2, 12, 160], [12, 120, 20], [120, 1000, 4], [1000, 10000, 0.25], [10000, 100000, 0.04], [100000, 430000, 0.008]];
  const TOP_H = 430000, HEAD = 560;
  const $ = (id) => document.getElementById(id);
  const world = $('world'), ruler = $('ruler'), meter = $('meter');
  const yOf = (h) => {
    let y = 0;
    for (const [a, b, r] of SEC) { if (h <= b) return y + (Math.max(h, a) - a) * r; y += (b - a) * r; }
    return y;
  };
  const hOf = (y) => {
    let acc = 0;
    for (const [a, b, r] of SEC) { const span = (b - a) * r; if (y <= acc + span) return a + (y - acc) / r; acc += span; }
    return TOP_H;
  };
  const rateAt = (h) => { for (const s of SEC) if (h < s[1]) return s[2]; return SEC[SEC.length - 1][2]; };
  const WORLD_H = yOf(TOP_H) + HEAD;
  world.style.height = `${WORLD_H}px`;

  function fmtH(h, short) {
    if (h < 0.01) return `${Curio.fmt(h * 1000, 1)} mm`;
    if (h < 1) return `${Curio.fmt(h * 100, h < 0.1 ? 1 : 0)} cm`;
    if (h < 10) return `${Curio.fmt(h, 2)} m`;
    if (h < 100000 || !short) return `${Curio.fmt(h)} m`;
    return `${Curio.fmt(h / 1000)} km`;
  }
  const fmtFt = (h) => h * 3.28084 < 10 ? `${Curio.fmt(h * 39.3701, 1)} in` : h > 20000 ? `${Curio.fmt(h / 1609.344, 1)} miles` : `${Curio.fmt(h * 3.28084)} ft`;

  let rh = '';
  for (const [a, b, r] of SEC) {
    const steps = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];
    const step = steps.find((s) => s * r >= 80) || 100000;
    for (let v = a + step; v <= b + 1e-9; v += step) {
      const val = Math.round(v * 1000) / 1000;
      rh += `<div class="tick" style="bottom:${yOf(val)}px"><span>${fmtH(val, true)}</span></div>`;
    }
  }
  ruler.innerHTML = rh;

  const BANDS = SEC.slice(1).map(([a, , r], i) => ({ h: a, r, prev: SEC[i][2] }));
  for (const bd of BANDS) {
    const el = document.createElement('div');
    el.className = 'band';
    el.style.bottom = `${yOf(bd.h)}px`;
    const z = bd.prev / bd.r;
    el.innerHTML = `<b>Zooming out ${Curio.fmt(z, z < 10 ? 1 : 0)}× · <i>1 ${bd.r >= 1 ? 'm' : 'km'} = ${bd.r >= 1 ? Curio.fmt(bd.r) : Curio.fmt(bd.r * 1000)} px</i></b>`;
    world.append(el);
  }

  const end = document.createElement('div');
  end.className = 'endcard c-card';
  end.style.bottom = `${yOf(TOP_H) + 150}px`;
  end.innerHTML = '<h2>🛰️ You made it to space</h2><p>420 km up, the ISS is closer to you than Paris is to Berlin. The Moon is about 900 times farther away than this. Maybe next time.</p><div class="c-row" style="justify-content:center"><button class="c-btn" type="button" id="again">Back to the ground ⏬</button><button class="c-btn c-btn--ghost adv" type="button" id="endCmp">📏 Compare</button><button class="c-btn c-btn--ghost adv" type="button" id="endGuess">🎯 Guess game</button><button class="c-btn c-btn--ghost simple-only" type="button" id="endAdv">🔭 All 74 things</button></div>';
  world.append(end);
  const NOTES = [
    [0.7, 'Scroll up to climb. Everything inside one zoom level is drawn on the same ruler.'],
    [10, 'Anything taller than a giraffe needs a ladder. Or a crane.'],
    [700, 'The Burj Khalifa\'s spire alone is about 244 m: taller than many skyscrapers.'],
    [2300, 'Above about 2,500 m, some people start to get altitude sickness.'],
    [7500, 'Above 8,000 m is the "death zone": there is not enough oxygen to survive for long.'],
    [14000, 'Welcome to the stratosphere. All the weather is below you now.'],
    [20500, 'Above about 19 km, water boils at body temperature. Without a pressure suit, your spit would boil.'],
    [31000, 'Up here the sky is dark blue, nearly black, even at noon.'],
    [45000, 'The ozone layer, mostly between 15 and 35 km, is now below you.'],
    [65000, 'Too high for planes, too low for satellites. Only rockets pass through here.'],
    [150000, 'Satellites cannot stay this low for long: even this thin air drags them down within days.'],
    [260000, 'The thin air here can reach over 1,000 °C, but you would still freeze: there is almost nothing to carry the heat.'],
    [385000, 'Almost there. Look out for a large shiny thing moving at 28,000 km/h.']
  ];
  const noteCards = (SIMPLE ? NOTES.filter((n, i) => i % 3 === 0) : NOTES).map(([h, t]) => {
    const el = document.createElement('p');
    el.className = 'note';
    el.textContent = t;
    world.append(el);
    return { it: { h, w: 230 }, el, note: true };
  });
  const cards0 = ITEMS.map((it) => {
    const el = document.createElement('article');
    el.className = 'item';
    el.tabIndex = 0;
    el.innerHTML = `<div class="art" role="img"></div><div class="nm"></div><div class="ht"></div><p></p>`;
    el.querySelector('.art').innerHTML = it.art;
    el.querySelector('.art').setAttribute('aria-label', it.name);
    el.querySelector('.nm').textContent = it.name;
    el.querySelector('.ht').textContent = `${fmtH(it.h, true)} · ${fmtFt(it.h)}`;
    el.querySelector('p').textContent = it.fact;
    world.append(el);
    const pin = document.createElement('div');
    pin.className = 'pin';
    pin.style.bottom = `${yOf(it.h)}px`;
    pin.title = it.name;
    world.append(pin);
    return { it, el };
  });
  world.addEventListener('click', (e) => {
    const card = e.target.closest('.item');
    document.querySelectorAll('.item.open').forEach((x) => { if (x !== card) x.classList.remove('open'); });
    if (card) card.classList.toggle('open');
  });
  const cards = cards0.concat(noteCards).sort((a, b) => a.it.h - b.it.h);
  const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  function layout() {
    const W = world.clientWidth;
    const rw = W < 600 ? 46 : 64;
    const inner = W - rw - 14;
    const C = W < 600 ? 2 : W < 900 ? 3 : 4;
    const colW = inner / C;
    const k = W < 600 ? 0.62 : 0.85;
    for (const c of cards) {
      const cw = c.note ? Math.min(colW * 1.6, W < 600 ? 190 : 250) : Math.min(colW - 10, Math.max(W < 600 ? 140 : 180, c.it.w * k + 22));
      c.el.style.width = `${cw}px`;
      c.w = cw;
      if (!c.note) c.el.querySelector('.art').style.width = `${Math.round(c.it.w * k)}px`;
    }
    for (const c of cards) c.hgt = c.el.offsetHeight;
    const tops = new Array(C).fill(-1e9);
    const bandYs = BANDS.map((b) => yOf(b.h));
    let bi = 0, last = -1;
    cards.forEach((c, i) => {
      const lineY = yOf(c.it.h);
      while (bi < bandYs.length && lineY - c.hgt / 2 > bandYs[bi] - 10) {
        for (let j = 0; j < C; j++) tops[j] = Math.max(tops[j], bandYs[bi] + 22);
        bi++;
      }
      const artH = c.note ? c.hgt : c.el.querySelector('.art').offsetHeight;
      const target = Math.max(8, lineY - artH / 2 - 8);
      const free = [];
      const span = c.note ? 2 : 1;
      for (let j = 0; j <= C - span; j++) {
        let ok = j !== last;
        for (let s = 0; s < span; s++) if (tops[j + s] + 12 > target) ok = false;
        if (ok) free.push(j);
      }
      let col, bottom;
      if (free.length) { col = free[Math.floor(hash(i) * free.length)]; bottom = target; }
      else {
        col = 0;
        for (let j = 1; j <= C - span; j++) if (Math.max(...tops.slice(j, j + span)) < Math.max(...tops.slice(col, col + span))) col = j;
        bottom = Math.max(target, Math.max(...tops.slice(col, col + span)) + 12);
      }
      last = col;
      for (let s = 0; s < span; s++) tops[col + s] = bottom + c.hgt;
      const slotW = colW * span;
      const x = rw + 14 + col * colW + (slotW - c.w) * (c.note ? 0.5 : hash(i + 99));
      c.el.style.left = `${x}px`;
      c.el.style.bottom = `${bottom}px`;
      if (!c.note) c.el.style.setProperty('--ty', `${Math.max(10, Math.min(c.hgt - 10, lineY - bottom))}px`);
    });
  }

  const SKY_L = [[0, [160, 214, 255]], [3000, [128, 196, 250]], [10000, [84, 152, 232]], [20000, [42, 92, 182]], [40000, [20, 40, 112]], [80000, [8, 12, 42]], [120000, [3, 4, 14]]];
  const SKY_D = [[0, [36, 62, 102]], [3000, [30, 54, 94]], [10000, [24, 44, 86]], [20000, [18, 32, 72]], [40000, [10, 18, 52]], [80000, [5, 8, 26]], [120000, [2, 3, 10]]];
  const lerp = (a, b, t) => a + (b - a) * t;
  function skyColor(h) {
    const S = Curio.isDark() ? SKY_D : SKY_L;
    for (let i = 1; i < S.length; i++) if (h <= S[i][0]) {
      const t = (h - S[i - 1][0]) / (S[i][0] - S[i - 1][0]);
      return S[i - 1][1].map((v, j) => Math.round(lerp(v, S[i][1][j], t)));
    }
    return S[S.length - 1][1];
  }
  const interp = (T, h) => {
    for (let i = 1; i < T.length; i++) if (h <= T[i][0]) return lerp(T[i - 1][1], T[i][1], (h - T[i - 1][0]) / (T[i][0] - T[i - 1][0]));
    return T[T.length - 1][1];
  };
  const TEMP = [[0, 15], [11000, -56.5], [20000, -56.5], [32000, -44.5], [47000, -2.5], [51000, -2.5], [71000, -58.5], [86000, -86], [100000, -78], [120000, 87], [150000, 357], [200000, 577], [300000, 677], [430000, 730]];
  const LOGP = [[0, 0], [5500, -0.3], [11000, -0.65], [20000, -1.26], [32000, -1.94], [47000, -2.71], [51000, -2.86], [71000, -3.69], [86000, -5.43], [100000, -6.5], [150000, -8.3], [200000, -9.1], [300000, -10.1], [430000, -10.9]];
  const ZONES = [[0, 'Ground level'], [12, 'Troposphere'], [12000, 'Stratosphere'], [50000, 'Mesosphere'], [85000, 'Thermosphere'], [100000, 'Space! (thermosphere)']];

  let height = 0, zoneIdx = 0, reachedTop = false, lastBand = 0;
  function update() {
    const r = world.getBoundingClientRect();
    const yFromBottom = r.bottom - innerHeight / 2;
    const h = Math.max(0, Math.min(TOP_H, hOf(Math.max(0, yFromBottom))));
    height = h;
    const groundTop = $('ground').getBoundingClientRect().top;
    meter.classList.toggle('off', groundTop < innerHeight * 0.62);
    const [cr, cg, cb] = skyColor(h);
    $('sky').style.background = `rgb(${cr},${cg},${cb})`;
    $('stars').style.opacity = String(Math.max(0, Math.min(1, (h - 25000) / 50000)));
    hud(h);
    $('mH').textContent = fmtH(h, true);
    $('mFt').textContent = fmtFt(h);
    const t = interp(TEMP, h);
    $('mTemp').textContent = `🌡 ${Math.round(t)} °C`;
    const p = Math.pow(10, interp(LOGP, h)) * 100;
    $('mAir').textContent = `💨 Air ${p >= 1 ? Curio.fmt(p, p < 10 ? 1 : 0) + '%' : p >= 0.001 ? Curio.fmt(p, 3) + '%' : '≈ 0%'}`;
    const rate = rateAt(h);
    $('mPace').textContent = `Ruler: 1 ${rate >= 1 ? 'm' : 'km'} = ${rate >= 1 ? Curio.fmt(rate) : Curio.fmt(rate * 1000)} px`;
    $('mBar').style.width = `${(yOf(h) / yOf(TOP_H)) * 100}%`;
    let z = 0;
    for (let i = 0; i < ZONES.length; i++) if (h >= ZONES[i][0]) z = i;
    if (z !== zoneIdx) {
      $('mZone').textContent = ZONES[z][1];
      if (z > zoneIdx) { meter.classList.remove('flash'); void meter.offsetWidth; meter.classList.add('flash'); Curio.beep(990, 0.4, 'sine', 0.05); }
      zoneIdx = z;
    }
    let band = 0;
    for (let i = 0; i < BANDS.length; i++) if (h >= BANDS[i].h) band = i + 1;
    if (band > lastBand) Curio.beep(520 + band * 60, 0.12, 'triangle', 0.05);
    lastBand = band;
    if (!reachedTop && h >= 415000) {
      reachedTop = true;
      setClimb(false);
      Curio.confetti();
      [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.18, 'triangle', 0.08), i * 110));
      const best = Curio.best('summits', (Curio.getBest('summits') || 0) + 1);
      Curio.toast(best.best > 1 ? `Docked with the ISS again! Climb #${best.best} 🛰️` : 'You reached the ISS! 🛰️🎉', 2800);
      award('iss');
    }
  }

  let climbing = false, lastT = 0, running = true;
  const climbBtn = $('climb');
  function setClimb(on) { climbing = on; climbBtn.setAttribute('aria-pressed', String(on)); climbBtn.textContent = on ? '⏸ Stop' : '🚀 Climb'; if (on) { lastT = performance.now(); requestAnimationFrame(frame); } }
  let hold = 0, spot = null;
  const centerY = () => world.getBoundingClientRect().bottom - innerHeight / 2;
  const stopY = (c) => parseFloat(c.el.style.bottom) + c.hgt / 2;
  const stops = () => cards.filter((c) => !c.note).sort((a, b) => stopY(a) - stopY(b));
  function spotlight(c) {
    if (spot) spot.el.classList.remove('spot');
    spot = c;
    if (!c) return;
    c.el.classList.add('spot', 'open');
    const i = stops().indexOf(c);
    Curio.beep(392 + i * 30, 0.2, 'triangle', 0.05); setTimeout(() => Curio.beep(588 + i * 30, 0.25, 'triangle', 0.04), 100);
  }
  function tourStep(now, dt) {
    if (now < hold) return;
    const y = centerY();
    const st = stops().find((c) => stopY(c) > y + 3);
    if (!st) { window.scrollBy(0, -600 * dt); return; }
    const gap = stopY(st) - y;
    const v = gap < 300 ? Math.max(80, gap * 2.6) : Math.min(2400, 800 + gap * 0.5);
    const step = Math.min(gap, v * dt);
    window.scrollBy(0, -step);
    if (gap - step < 4) { hold = now + 2700; spotlight(st); }
  }
  function nextStop() {
    const y = centerY();
    const st = stops().find((c) => stopY(c) > y + 6);
    setClimb(false);
    if (!st) { scrollTo({ top: 0, behavior: 'smooth' }); return; }
    window.scrollBy({ top: -(stopY(st) - y), behavior: 'smooth' });
    setTimeout(() => spotlight(st), 500);
  }
  function frame(now) {
    if (!climbing || !running) return;
    const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
    if (SIMPLE) tourStep(now, dt); else window.scrollBy(0, -380 * SPEEDS[speedI] * dt);
    if (scrollY <= 0) setClimb(false);
    requestAnimationFrame(frame);
  }
  climbBtn.addEventListener('click', () => { hold = 0; setClimb(!climbing); });
  $('nextStop').addEventListener('click', nextStop);
  $('endAdv').addEventListener('click', () => Curio.setMode('advanced'));
  if (SIMPLE) { $('go').textContent = 'Ride the lift to space ↑'; }
  $('go').addEventListener('click', () => { Curio.beep(660, 0.15, 'sine', 0.06); setClimb(true); });
  $('again').addEventListener('click', () => $('down').click());
  $('down').addEventListener('click', () => { setClimb(false); scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' }); Curio.beep(330, 0.2, 'sine', 0.05); });
  ['wheel', 'touchstart'].forEach((ev) => addEventListener(ev, (e) => { if (climbing && e.target !== climbBtn && e.target !== $('go') && e.target !== $('nextStop')) setClimb(false); }, { passive: true }));
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (document.hidden) setClimb(false); });
  window.addEventListener('curio:theme', update);

  const buzz = (ms) => { try { if (!Curio.muted && navigator.vibrate) navigator.vibrate(ms); } catch (e) {} };
  const BADGES = [
    { id: 'iss', e: '🛰️', name: 'Docked', d: 'Climb all the way to the ISS' },
    { id: 'space', e: '🌌', name: 'Astronaut', d: 'Cross the Kármán line, 100 km up' },
    { id: 'fast', e: '⚡', name: 'Express lift', d: 'Climb at 5× speed' },
    { id: 'compare', e: '📏', name: 'Side by side', d: 'Compare four things at once' },
    { id: 'bull', e: '🎯', name: 'Bullseye', d: 'Guess a height within 10%' },
    { id: 'eye', e: '👁️', name: 'Eagle eye', d: 'Score 800+ in Guess the height' },
    { id: 'daily', e: '📅', name: 'Daily climber', d: 'Play the daily challenge' },
    { id: 'streak', e: '🔥', name: 'On a roll', d: 'Get a streak of 10 in Taller?' }
  ];
  const BKEY = 'tt:badges:v1';
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
  $('statN').textContent = `📏 ${ITEMS.length} tall things`;

  const CLOUDS = [[1.5, .9], [25, .7], [180, .8], [700, 1], [1500, 1.1], [2600, .9], [4200, 1.2], [6500, .8], [9500, .7], [16000, .6], [30000, .4]];
  CLOUDS.forEach(([h, s], i) => {
    const c = document.createElement('div');
    c.className = 'cloudd';
    c.style.bottom = `${yOf(h)}px`;
    c.style.left = `${(i * 37) % 80 + 6}%`;
    c.style.setProperty('--s', s);
    c.style.animationDuration = `${40 + (i * 13) % 30}s`;
    c.innerHTML = '<svg viewBox="0 0 200 90" aria-hidden="true"><path d="M20 80 Q0 80 6 62 Q10 44 34 48 Q36 20 66 22 Q84 0 112 14 Q140 4 152 30 Q186 28 188 56 Q200 80 176 80Z" fill="#fff"/><path d="M30 80 Q60 66 100 72 Q140 64 176 80Z" fill="#dbe8f5"/></svg>';
    world.append(c);
  });
  [[3, '🐦'], [40, '🦅'], [300, '🪁'], [3500, '🦅'], [10500, '✈️']].forEach(([h, e], i) => {
    const b = document.createElement('div');
    b.className = 'flyer';
    b.textContent = e;
    b.style.bottom = `${yOf(h)}px`;
    b.style.animationDelay = `${-i * 7}s`;
    world.append(b);
  });

  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -5% 0px' }) : null;
  cards0.forEach((c) => { c.el.classList.add('rv'); if (io) io.observe(c.el); else c.el.classList.add('in'); });

  const VEH = [[0, '🚶'], [3, '🪜'], [60, '🛗'], [1000, '🧗'], [9000, '✈️'], [20000, '🎈'], [60000, '🚀'], [400000, '🛰️']];
  let vehNow = '';
  const SPEEDS = [1, 2, 5];
  let speedI = 0;
  $('speed').addEventListener('click', () => {
    speedI = (speedI + 1) % SPEEDS.length;
    $('speed').textContent = `${SPEEDS[speedI]}×`;
    Curio.beep(400 + speedI * 200, 0.08, 'square', 0.04);
    if (SPEEDS[speedI] === 5) award('fast');
    if (!climbing) setClimb(true);
  });
  function hud(h) {
    let v = VEH[0][1];
    for (const [a, e] of VEH) if (h >= a) v = e;
    if (v !== vehNow) { vehNow = v; const el = $('veh'); el.textContent = v; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
    const lim = Math.max(0, Math.min(1, (h - 30000) / 120000));
    $('limb').style.opacity = String(lim);
    $('limb').style.setProperty('--k', String(lim));
    if (h >= 100000) award('space');
  }

  let openPanel = null;
  function showPanel(id) {
    closePanels(); setClimb(false);
    openPanel = $(id); openPanel.hidden = false;
    document.body.style.overflow = 'hidden';
    openPanel.scrollTop = 0;
    openPanel.querySelector('.panel__x').focus();
    Curio.beep(330, 0.15, 'sine', 0.05); setTimeout(() => Curio.beep(660, 0.12, 'sine', 0.04), 70);
  }
  function closePanels() { document.querySelectorAll('.panel').forEach((p) => { p.hidden = true; }); openPanel = null; document.body.style.overflow = ''; }
  document.querySelectorAll('.panel').forEach((p) => p.addEventListener('click', (e) => { if (e.target === p || e.target.closest('[data-close]')) closePanels(); }));

  const SORTED = ITEMS.slice().sort((a, b) => a.h - b.h);
  const byName = (n) => SORTED.find((i) => i.name === n);
  let picks = Curio.store.get('tt:cmp', null);
  if (!Array.isArray(picks) || picks.length !== 4) picks = ['You (roughly)', 'Giraffe', 'Blue whale (on its tail)', ''];
  let logScale = false;
  function buildPicks() {
    const box = $('cmpPicks'); box.innerHTML = '';
    picks.forEach((p, i) => {
      const sel = document.createElement('select');
      sel.className = 'c-input';
      sel.setAttribute('aria-label', `Thing ${i + 1}`);
      sel.innerHTML = `<option value="">${i < 1 ? 'Pick something' : '(none)'}</option>` + SORTED.map((it) => `<option>${it.name.replace(/</g, '')}</option>`).join('');
      sel.value = byName(p) ? p : '';
      sel.addEventListener('change', () => { picks[i] = sel.value; drawCmp(); Curio.beep(500 + i * 80, 0.07, 'sine', 0.05); });
      box.append(sel);
    });
  }
  function drawCmp() {
    Curio.store.set('tt:cmp', picks);
    const list = picks.map(byName).filter(Boolean);
    const st = $('cmpStage'); st.innerHTML = '';
    if (!list.length) { $('cmpSay').textContent = ''; return; }
    const H = innerWidth < 600 ? 240 : 320;
    const maxH = Math.max(...list.map((i) => i.h));
    const minL = -3;
    const px = (h) => logScale ? Math.max(4, (Math.log10(h) - minL) / (Math.log10(maxH) - minL) * H) : h / maxH * H;
    list.forEach((it, i) => {
      const col = document.createElement('div');
      col.className = 'ccol';
      col.style.animationDelay = `${i * 70}ms`;
      const p = px(it.h);
      const pole = logScale || it.h > 9000 || p < 34;
      col.innerHTML = `<div class="cvis" style="height:${H + 40}px"></div><b></b><span></span>`;
      const vis = col.querySelector('.cvis');
      if (pole) vis.innerHTML = `<div class="cpole" style="height:${p}px"></div><div class="cicon" style="bottom:${p + 2}px">${it.art}</div>`;
      else vis.innerHTML = `<div class="cart" style="height:${p}px">${it.art}</div>`;
      col.querySelector('b').textContent = it.name;
      col.querySelector('span').textContent = fmtH(it.h, true);
      st.append(col);
    });
    if (list.length >= 4) award('compare');
    const s = list.slice().sort((a, b) => b.h - a.h);
    const say = [];
    if (s.length >= 2) {
      const r = s[0].h / s[s.length - 1].h;
      say.push(`${s[0].name} is ${r >= 100 ? Curio.fmt(r) : Curio.fmt(r, r < 10 ? 1 : 0)}× taller than ${s[s.length - 1].name}.`);
      if (r >= 2 && r < 1e7) say.push(`You would need to stack about ${Curio.fmt(Math.round(r))} of ${s[s.length - 1].name.replace(/ \(.*\)/, '')} to reach the top.`);
    }
    $('cmpSay').textContent = say.join(' ');
  }
  $('cmpLog').addEventListener('click', () => { logScale = !logScale; $('cmpLog').setAttribute('aria-pressed', String(logScale)); $('cmpLog').textContent = `Log scale: ${logScale ? 'on' : 'off'}`; drawCmp(); });
  $('cmpRand').addEventListener('click', () => {
    const sh = Curio.shuffle(SORTED).slice(0, 3);
    picks = [sh[0].name, sh[1].name, sh[2].name, ''];
    buildPicks(); drawCmp(); Curio.beep(700, 0.08, 'triangle', 0.05);
  });
  function openCmp() { showPanel('cmpPanel'); buildPicks(); drawCmp(); }
  $('openCmp').addEventListener('click', openCmp);

  function hashStr(str) { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const today = new Date();
  const dayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  $('dailyLabel').textContent = `Puzzle for ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  let gMode = 'classic';
  const G = { round: 0, score: 0, list: [], log: [], locked: false, ref: null, cur: null, streak: 0 };
  document.querySelectorAll('#guessPanel .diff').forEach((b) => b.addEventListener('click', () => {
    gMode = b.dataset.d;
    document.querySelectorAll('#guessPanel .diff').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    paintGBest(); Curio.beep(520, 0.06, 'sine', 0.05);
  }));
  function paintGBest() {
    const b = Curio.getBest(`g-${gMode}`);
    $('gBest').textContent = b != null ? `Your best here: ${b}${gMode === 'hilo' ? ' in a row' : ' points'}` : 'No score yet in this mode';
  }
  function openGuess() { showPanel('guessPanel'); $('gStart').hidden = false; $('gPlay').hidden = true; $('gEnd').hidden = true; paintGBest(); }
  $('openGuess').addEventListener('click', openGuess);
  function showThing(it, withH) {
    const t = $('gThing');
    t.innerHTML = `<div class="gart">${it.art}</div><b></b><span></span>`;
    t.querySelector('b').textContent = it.name;
    t.querySelector('span').textContent = withH ? fmtH(it.h, true) : '';
    t.classList.remove('in'); void t.offsetWidth; t.classList.add('in');
  }
  function startGuess() {
    const r = gMode === 'daily' ? rng(hashStr(`tt-${dayKey}`)) : Math.random;
    const pool = ITEMS.slice();
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    Object.assign(G, { round: 0, score: 0, list: pool, log: [], streak: 0 });
    $('gStart').hidden = true; $('gEnd').hidden = true; $('gPlay').hidden = false;
    $('gSlide').hidden = gMode === 'hilo'; $('gHilo').hidden = gMode !== 'hilo';
    if (gMode === 'hilo') { G.ref = G.list[0]; G.round = 1; nextHilo(); } else nextGuess();
  }
  $('gGo').addEventListener('click', startGuess);
  $('gAgain').addEventListener('click', () => { $('gEnd').hidden = true; $('gStart').hidden = false; paintGBest(); });
  const gr = $('gRange');
  function paintSlider() { const h = Math.pow(10, Number(gr.value)); $('gVal').textContent = fmtH(h, true); $('gValFt').textContent = fmtFt(h); }
  gr.addEventListener('input', () => { paintSlider(); Curio.beep(300 + (Number(gr.value) + 3) * 60, 0.025, 'sine', 0.025); });
  function nextGuess() {
    if (G.round >= 10) return endGuess();
    G.locked = false;
    G.cur = G.list[G.round];
    showThing(G.cur, false);
    $('gRound').textContent = `${G.round + 1}/10`;
    $('gProg').style.width = `${G.round * 10}%`;
    gr.value = '1'; gr.disabled = false; paintSlider();
    $('gLock').hidden = false; $('gNext').hidden = true;
    $('gMsg').textContent = 'How tall, or how high up?';
  }
  $('gLock').addEventListener('click', () => {
    if (G.locked) return; G.locked = true;
    const guess = Math.pow(10, Number(gr.value));
    const err = Math.abs(Math.log2(guess / G.cur.h));
    const pts = err < Math.log2(1.1) ? 100 : Math.max(0, Math.round(100 - err * 25));
    G.score += pts;
    G.log.push(pts >= 100 ? '🎯' : pts >= 75 ? '🟩' : pts >= 40 ? '🟨' : '🟥');
    gr.disabled = true;
    $('gThing').querySelector('span').textContent = fmtH(G.cur.h, true);
    const ratio = guess > G.cur.h ? guess / G.cur.h : G.cur.h / guess;
    $('gMsg').textContent = pts >= 100 ? `Bullseye! +100. It is ${fmtH(G.cur.h, true)}.` : `+${pts}. It is ${fmtH(G.cur.h, true)}: you were ${Curio.fmt(ratio, ratio < 10 ? 1 : 0)}× too ${guess > G.cur.h ? 'high' : 'low'}.`;
    if (pts >= 100) { award('bull'); [880, 1175, 1568].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.12, 'triangle', 0.07), i * 70)); buzz(30); }
    else if (pts >= 50) Curio.beep(660, 0.12, 'triangle', 0.06);
    else { Curio.beep(180, 0.25, 'sawtooth', 0.05); buzz([40, 30, 40]); }
    $('gScore').textContent = G.score;
    G.round++;
    $('gProg').style.width = `${G.round * 10}%`;
    $('gLock').hidden = true; $('gNext').hidden = false;
    $('gNext').textContent = G.round >= 10 ? 'See results ›' : 'Next ›';
    $('gNext').focus({ preventScroll: true });
  });
  function nextHilo() {
    G.locked = false;
    let n = G.list[G.round % G.list.length];
    if (Math.abs(n.h - G.ref.h) / G.ref.h < 0.02) { G.round++; n = G.list[G.round % G.list.length]; }
    G.cur = n;
    showThing(n, false);
    $('hiName').textContent = n.name;
    $('hiRef').textContent = `${G.ref.name} (${fmtH(G.ref.h, true)})`;
    $('gRound').textContent = `Streak ${G.streak}`;
    $('gProg').style.width = `${Math.min(100, G.streak * 5)}%`;
    $('gMsg').textContent = '';
    $('gNext').hidden = true;
    $('hiUp').disabled = $('hiDown').disabled = false;
  }
  function hilo(up) {
    if (G.locked) return; G.locked = true;
    $('hiUp').disabled = $('hiDown').disabled = true;
    const ok = (G.cur.h > G.ref.h) === up;
    $('gThing').querySelector('span').textContent = fmtH(G.cur.h, true);
    if (ok) {
      G.streak++; G.score = G.streak;
      $('gScore').textContent = G.streak;
      $('gMsg').textContent = `Yes! ${G.cur.name} is ${fmtH(G.cur.h, true)}.`;
      Curio.beep(600 + Math.min(G.streak, 20) * 30, 0.1, 'triangle', 0.07); buzz(15);
      if (G.streak >= 10) award('streak');
      G.ref = G.cur; G.round++;
      setTimeout(nextHilo, 900);
    } else {
      $('gMsg').textContent = `Nope, ${G.cur.name} is ${fmtH(G.cur.h, true)}.`;
      Curio.beep(160, 0.3, 'sawtooth', 0.05); buzz([40, 30, 40]);
      $('gThing').classList.add('shake');
      setTimeout(endGuess, 1200);
    }
  }
  $('hiUp').addEventListener('click', () => hilo(true));
  $('hiDown').addEventListener('click', () => hilo(false));
  $('gNext').addEventListener('click', nextGuess);
  function endGuess() {
    $('gPlay').hidden = true; $('gEnd').hidden = false;
    const hl = gMode === 'hilo';
    const b = Curio.best(`g-${gMode}`, G.score);
    const n = hl ? G.score : Math.round(G.score / 100);
    const col = (hl ? G.score >= 10 : G.score >= 800) ? '#ffc233' : (hl ? G.score >= 5 : G.score >= 500) ? '#c0c8d4' : '#d08a4a';
    $('gTrophy').innerHTML = `<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="56" fill="${col}" opacity=".18"/><path d="M60 10 L60 104" stroke="#8a96a6" stroke-width="4"/>${Array.from({ length: 9 }, (_, i) => `<path d="M60 ${100 - i * 10} h${i % 2 ? 8 : 14}" stroke="#8a96a6" stroke-width="3"/>`).join('')}<path d="M62 18 L96 26 L62 36Z" fill="${col}"/><text x="40" y="70" text-anchor="middle" font-size="26" font-weight="900" fill="${col}" font-family="sans-serif">${hl ? G.score : n}</text></svg>`;
    $('gEndTitle').textContent = hl ? (G.score >= 10 ? 'Unstoppable!' : G.score >= 5 ? 'Nice streak!' : 'Heights are hard') : (G.score >= 800 ? 'You have a ruler for eyes' : G.score >= 500 ? 'Pretty good sense of scale' : 'Scale is sneaky');
    $('geScore').textContent = G.score; $('geBest').textContent = b.best;
    $('geNote').textContent = b.isNew ? 'New personal best!' : '';
    if (!hl && G.score >= 800) award('eye');
    if (gMode === 'daily') award('daily');
    if (hl ? G.score >= 10 : G.score >= 700) Curio.confetti();
    [523, 659, 784].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.15, 'triangle', 0.07), i * 100));
  }
  $('gShare').addEventListener('click', async () => {
    const txt = gMode === 'hilo' ? `Tall Things · Taller? streak: ${G.score} 🔥` : `Tall Things · Guess the height${gMode === 'daily' ? ` (daily ${dayKey})` : ''}\n${G.log.join('')} ${G.score}/1000`;
    try { await navigator.clipboard.writeText(txt); Curio.toast('Copied! 📋'); } catch (e) { Curio.toast('Could not copy, sorry'); }
  });

  addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (e.key === 'Escape') { if (openPanel) closePanels(); return; }
    if (openPanel) {
      if (openPanel.id === 'guessPanel' && !$('gPlay').hidden) {
        if (gMode === 'hilo') { if (e.key === 'ArrowUp') { e.preventDefault(); hilo(true); } if (e.key === 'ArrowDown') { e.preventDefault(); hilo(false); } }
        else if (e.key === 'Enter' && tag !== 'button') { if (!$('gLock').hidden) $('gLock').click(); else if (!$('gNext').hidden) $('gNext').click(); }
      }
      return;
    }
    if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
    const k = e.key.toLowerCase();
    if (e.key === ' ' && tag !== 'button') { e.preventDefault(); setClimb(!climbing); return; }
    if (SIMPLE) { if (e.key === 'ArrowUp' || k === 'n') { e.preventDefault(); nextStop(); } else if (e.key === 'End') { e.preventDefault(); $('down').click(); } return; }
    if (climbing && k !== 'shift') setClimb(false);
    if (k === 'c') openCmp();
    else if (k === 'g') openGuess();
    else if (e.key === 'End') { e.preventDefault(); $('down').click(); }
  });

  $('endCmp').addEventListener('click', openCmp);
  $('endGuess').addEventListener('click', openGuess);
  addEventListener('resize', () => { if (openPanel && openPanel.id === 'cmpPanel') drawCmp(); });
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  layout();
  const toGround = () => scrollTo(0, document.documentElement.scrollHeight);
  toGround();
  requestAnimationFrame(() => { toGround(); update(); });
  addEventListener('scroll', update, { passive: true });
  let rw = innerWidth;
  addEventListener('resize', () => { if (innerWidth !== rw) { rw = innerWidth; const h = height; layout(); scrollTo(0, world.offsetTop + WORLD_H - yOf(h) - innerHeight / 2); } update(); });
  update();
})();

