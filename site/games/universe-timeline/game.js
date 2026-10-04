  (function () {
  const T0 = 13.8e9;
  const NOW = 2026;
  const LOG_FROM = -51, LOG_TO = 8.6, PPD = 70;
  const SEGS = [
    { name: 'The first moments', c: '#ffcf6e', bg: [26, 10, 52], log: true, h: (LOG_TO - LOG_FROM) * PPD },
    { name: 'The age of galaxies', c: '#b06cff', bg: [14, 16, 52], from: T0 - Math.pow(10, LOG_TO), to: 4.6e9, h: 2400 },
    { name: 'Young Earth', c: '#ff8a3c', bg: [58, 24, 18], from: 4.6e9, to: 5.45e8, h: 3000 },
    { name: 'Life gets complicated', c: '#4fc3f7', bg: [10, 44, 70], from: 5.45e8, to: 6.6e7, h: 3200 },
    { name: 'The age of mammals', c: '#66d17a', bg: [16, 52, 30], from: 6.6e7, to: 7e6, h: 1700 },
    { name: 'Our ancestors', c: '#e6b25c', bg: [64, 44, 18], from: 7e6, to: 3e5, h: 1500 },
    { name: 'Our species', c: '#ff9a7a', bg: [50, 30, 30], from: 3e5, to: 5e4, h: 1000 },
    { name: 'The ice age', c: '#9fdcff', bg: [22, 50, 68], from: 5e4, to: 1.2e4, h: 1500 },
    { name: 'Civilisation', c: '#ffcf6e', bg: [56, 40, 16], from: 1.2e4, to: 600, h: 2200 },
    { name: 'The modern world', c: '#ff7aa8', bg: [40, 24, 52], from: 600, to: 100, h: 1200 },
    { name: 'The last century', c: '#7ae0c4', bg: [20, 26, 44], from: 100, to: 0, h: 1300 }
  ];
  let acc = 0;
  for (const s of SEGS) { s.y0 = acc; acc += s.h; }
  const TOTAL = acc;
  const TAIL = Math.max(560, Math.round(innerHeight * 0.75));

  function yOfEvent(ev) {
    if (ev.s != null && Math.log10(ev.s) < LOG_TO) return SEGS[0].y0 + (Math.log10(ev.s) - LOG_FROM) * PPD;
    const ago = ev.ago != null ? ev.ago : T0 - ev.s;
    for (let i = 1; i < SEGS.length; i++) {
      const s = SEGS[i];
      if (ago <= s.from && ago >= s.to) return s.y0 + (s.from - ago) / (s.from - s.to) * s.h;
    }
    return TOTAL;
  }
  function segAt(y) { let k = 0; for (let i = 0; i < SEGS.length; i++) if (y >= SEGS[i].y0) k = i; return k; }
  function timeAt(y) {
    y = Math.max(0, Math.min(TOTAL, y));
    const k = segAt(y), s = SEGS[k];
    if (s.log) { const since = Math.pow(10, LOG_FROM + (y - s.y0) / PPD); return { since, ago: T0 - since, k }; }
    const ago = s.from - (y - s.y0) / s.h * (s.from - s.to);
    return { ago, since: T0 - ago, k };
  }

  const tl = document.getElementById('tl');
  const $ = (id) => document.getElementById(id);
  tl.style.height = `${TOTAL + TAIL}px`;

  function fmtYears(y) {
    if (y >= 1e9) return [Curio.fmt(y / 1e9, 2), 'billion years'];
    if (y >= 1e6) return [Curio.fmt(y / 1e6, y >= 1e8 ? 0 : 1), 'million years'];
    if (y >= 1) return [Curio.fmt(y), Math.round(y) === 1 ? 'year' : 'years'];
    return null;
  }
  function fmtSince(yrs) {
    const sec = yrs * 31557600;
    if (sec < 1e-3) { const e = Math.floor(Math.log10(sec)); return `10${String(e).replace('-', '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])} seconds`; }
    if (sec < 1) return `${Curio.fmt(sec * 1000, 1)} milliseconds`;
    if (sec < 60) return `${Curio.fmt(sec, 1)} seconds`;
    if (sec < 3600) return `${Curio.fmt(sec / 60, 1)} minutes`;
    if (sec < 86400) return `${Curio.fmt(sec / 3600, 1)} hours`;
    if (yrs < 1) return `${Curio.fmt(sec / 86400)} days`;
    const f = fmtYears(yrs); return `${f[0]} ${f[1]}`;
  }
  const calYear = (ago) => { const y = Math.round(NOW - ago); return y <= 0 ? `${Curio.fmt(1 - y)} BCE` : `${y} CE`; };

  for (const s of SEGS) {
    const el = document.createElement('div');
    el.className = 'era';
    el.style.top = `${s.y0}px`;
    let pace;
    if (s.log) pace = 'Log scale: every step down is 10× more time';
    else { const per = (s.from - s.to) / s.h * 1000; const f = fmtYears(per); pace = `1,000 px = ${f[0]} ${f[1]}`; }
    el.innerHTML = `<div style="border-color:${s.c}"><b>${s.name}</b><span>${pace}</span></div>`;
    if (s.y0 > 0) tl.append(el); else { el.style.top = '30px'; tl.append(el); }
  }

  const NOTES = [
    [{ s: 1e-36 }, 'Every step of this section covers ten times more time than the step before. It gets faster, then slower.'],
    [{ s: 1e-27 }, 'Nothing much happens for a while. Well, lots happens, but physicists are still arguing about what.'],
    [{ s: 1 }, 'One year after the Big Bang. Everything is still a glowing soup of millions of degrees.'],
    [{ ago: 12e9 }, 'Galaxies everywhere are colliding and merging. Space is a busy place.'],
    [{ ago: 7e9 }, 'Billions of years go by. Stars are born, live and die, and each generation leaves heavier elements behind: the stuff of planets, and of you.'],
    [{ ago: 2.9e9 }, 'For the next couple of billion years, life is just microbes. Very patient microbes.'],
    [{ ago: 1.45e9 }, 'Geologists call this stretch "the boring billion". Not much changes.'],
    [{ ago: 1.5e7 }, 'No humans yet. Not even close.'],
    [{ ago: 85 }, 'Your grandparents were probably born around here.']
  ];
  const items = [];
  const evs = [];
  NOTES.forEach(([t, txt]) => {
    const el = document.createElement('p');
    el.className = 'note';
    el.textContent = txt;
    tl.append(el);
    items.push({ y: yOfEvent(t), el, note: true });
  });
  window.UNIVERSE_EVENTS.forEach((ev) => {
    const y = yOfEvent(ev);
    const k = segAt(y);
    const c = SEGS[k].c;
    const dot = document.createElement('div');
    dot.className = 'dot';
    dot.style.top = `${y}px`;
    dot.style.setProperty('--c', c);
    tl.append(dot);
    const el = document.createElement('article');
    el.className = 'ev';
    el.tabIndex = 0;
    el.style.setProperty('--c', c);
    el.innerHTML = `<div class="em" role="img"></div><h3></h3><div class="wh"></div><p></p>`;
    el.querySelector('.em').textContent = ev.e;
    el.querySelector('.em').setAttribute('aria-label', ev.name);
    el.querySelector('h3').textContent = ev.name;
    el.querySelector('.wh').textContent = ev.when;
    el.querySelector('p').textContent = ev.text;
    tl.append(el);
    items.push({ y, el, dot, ev, c });
    evs.push({ y, el, dot, ev, c, since: ev.s != null ? ev.s : T0 - ev.ago });
  });
  items.sort((a, b) => a.y - b.y);

  const endEl = document.createElement('div');
  endEl.className = 'end c-card';
  endEl.style.top = `${TOTAL + 140}px`;
  endEl.innerHTML = '<h2>📍 You are here</h2><p>13.8 billion years, and you showed up in the last 0.002% of it. Every atom in your body (except the hydrogen) was made inside stars that lived and died before the Sun was born.</p><div class="badgeRow" id="endBadges"></div><div class="c-row" style="justify-content:center"><button class="c-btn" type="button" id="again">Back to the Big Bang ⏫</button><button class="c-btn c-btn--ghost" type="button" id="endCal">📅 Cosmic Calendar</button><button class="c-btn c-btn--ghost" type="button" id="endQuiz">❓ Quiz</button></div>';
  tl.append(endEl);

  function layout() {
    const W = tl.clientWidth;
    const narrow = W <= 700;
    const lanes = [-1e9, -1e9];
    let alt = 0;
    const eraYs = SEGS.slice(1).map((s) => s.y0);
    let ei = 0;
    for (const it of items) {
      while (ei < eraYs.length && it.y + 40 >= eraYs[ei]) { lanes[0] = Math.max(lanes[0], eraYs[ei] + 46); lanes[1] = Math.max(lanes[1], eraYs[ei] + 46); ei++; }
      const h = it.el.offsetHeight;
      const target = Math.max(it.y - 24, 70);
      if (narrow) {
        const top = Math.max(target, Math.max(lanes[0], lanes[1]) + 12);
        it.el.style.top = `${top}px`;
        it.el.style.left = '';
        it.el.classList.add('R');
        lanes[0] = lanes[1] = top + h;
        continue;
      }
      let lane;
      if (it.note) {
        const top = Math.max(target, Math.max(lanes[0], lanes[1]) + 12);
        lane = lanes[0] <= lanes[1] ? 0 : 1;
        it.el.style.top = `${top}px`;
        it.el.style.left = lane === 0 ? `calc(25% - 150px)` : `calc(75% - 150px)`;
        lanes[lane] = top + h;
        continue;
      }
      if (Math.abs(lanes[0] - lanes[1]) < 4) lane = alt; else lane = lanes[0] < lanes[1] ? 0 : 1;
      alt = 1 - lane;
      const top = Math.max(target, lanes[lane] + 12);
      it.el.style.top = `${top}px`;
      it.el.classList.toggle('L', lane === 0);
      it.el.classList.toggle('R', lane === 1);
      it.el.style.left = lane === 0 ? `calc(50% - 32px - min(400px, calc(50% - 40px)))` : 'calc(50% + 32px)';
      lanes[lane] = top + h;
    }
    const bottom = Math.max(lanes[0], lanes[1]);
    const endTop = Math.max(TOTAL + 140, bottom + 60);
    endEl.style.top = `${endTop}px`;
    tl.style.height = `${Math.max(TOTAL + TAIL, endTop + endEl.offsetHeight + innerHeight * 0.45)}px`;
  }

  const lerp = (a, b, t) => a + (b - a) * t;
  let lastK = -1, reached = false;
  function update() {
    const top = tl.getBoundingClientRect().top;
    const y = innerHeight / 2 - top;
    const on = top < innerHeight * 0.5;
    $('clock').classList.toggle('off', !on);
    const t = timeAt(y);
    const k = t.k, s = SEGS[k];
    const frac = Math.max(0, Math.min(1, (y - s.y0) / s.h));
    const n = SEGS[Math.min(SEGS.length - 1, k + 1)];
    const col = s.bg.map((v, i) => Math.round(lerp(v, n.bg[i], frac * frac)));
    $('bg').style.backgroundColor = `rgb(${col.join(',')})`;
    sky.col = col; sky.k = k; sky.y = y;
    if (y > 0 && !seenEras.has(k)) { seenEras.add(k); paintEraMenu(); if (seenEras.size === SEGS.length) award('eras'); }
    if (y <= 0) { $('cAgo').innerHTML = '13.8 billion <small>years ago</small>'; $('cSub').textContent = 'Just before the Big Bang... if there was a before'; }
    else if (s.log) {
      $('cAgo').innerHTML = '13.8 billion <small>years ago</small>';
      $('cSub').textContent = `${fmtSince(t.since)} after the Big Bang`;
    } else if (t.ago < 0.5) {
      $('cAgo').innerHTML = 'Today';
      $('cSub').textContent = `${NOW} CE · 13.8 billion years after the Big Bang`;
    } else {
      const f = fmtYears(t.ago);
      $('cAgo').innerHTML = `${f[0]} <small>${f[1]} ago</small>`;
      $('cSub').textContent = t.ago < 12000 ? `The year ${calYear(t.ago)}` : `${fmtSince(t.since)} after the Big Bang`;
    }
    if (s.log) $('cPace').textContent = `${s.name} · each step = 10× more time`;
    else { const per = (s.from - s.to) / s.h * innerHeight; const f = fmtYears(per) || ['<1', 'year']; $('cPace').textContent = `${s.name} · 1 screen ≈ ${f[0]} ${f[1]}`; }
    $('cBar').style.width = `${Math.max(0, Math.min(1, y / TOTAL)) * 100}%`;
    if (k !== lastK) {
      if (lastK >= 0 && k > lastK && y > 0) { buzz(15); Curio.beep(330 + k * 55, 0.3, 'sine', 0.05); setTimeout(() => Curio.beep(495 + k * 55, 0.35, 'sine', 0.04), 120); }
      lastK = k;
    }
    if (!reached && y >= TOTAL - 4) {
      reached = true;
      setPlay(false);
      Curio.confetti();
      [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.18, 'triangle', 0.08), i * 110));
      const b = Curio.best('trips', (Curio.getBest('trips') || 0) + 1);
      Curio.toast(b.best > 1 ? `13.8 billion years, trip #${b.best} 🎉` : 'You made it to today! 🎉', 2600);
      award('trip');
      paintEndBadges();
      layout();
    }
  }

  let playing = false, lastT = 0, running = true;
  function setPlay(on) {
    playing = on;
    $('play').setAttribute('aria-pressed', String(on));
    $('play').textContent = on ? '⏸ Pause' : '▶ Play';
    if (on) { lastT = performance.now(); requestAnimationFrame(frame); }
  }
  function frame(now) {
    if (!playing || !running) return;
    const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
    scrollBy(0, 240 * SPEEDS[speedI] * dt);
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 2) setPlay(false);
    requestAnimationFrame(frame);
  }
  $('play').addEventListener('click', () => setPlay(!playing));
  const toStart = () => { setPlay(false); scrollTo({ top: tl.offsetTop - innerHeight / 2 + 10, behavior: 'smooth' }); Curio.beep(880, 0.2, 'sine', 0.05); };
  $('restart').addEventListener('click', toStart);
  $('again').addEventListener('click', () => { reached = false; toStart(); });
  $('start').addEventListener('click', () => {
    Curio.beep(110, 0.6, 'sawtooth', 0.06); setTimeout(() => Curio.beep(880, 0.4, 'sine', 0.05), 80);
    scrollTo({ top: tl.offsetTop - innerHeight / 2 + 10, behavior: 'smooth' });
    setTimeout(() => setPlay(true), 900);
  });
  ['wheel', 'touchstart'].forEach((ev) => addEventListener(ev, (e) => { if (playing && e.target !== $('play') && e.target !== $('start')) setPlay(false); }, { passive: true }));
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (document.hidden) setPlay(false); });

  const SPEEDS = [1, 3, 8];
  let speedI = 0;
  const buzz = (ms) => { try { if (!Curio.muted && navigator.vibrate) navigator.vibrate(ms); } catch (e) {} };
  const seenEras = new Set();

  const BADGES = [
    { id: 'trip', e: '📍', name: 'Time traveller', d: 'Scroll all the way to today' },
    { id: 'eras', e: '🗺️', name: 'Every era', d: 'Visit all 11 eras of the timeline' },
    { id: 'calendar', e: '📅', name: 'Calendar keeper', d: 'Open the Cosmic Calendar' },
    { id: 'dec31', e: '🕛', name: 'Last-minute visitor', d: 'Look at the final minute of December 31st' },
    { id: 'quiz', e: '❓', name: 'Quizzer', d: 'Finish a Which came first quiz' },
    { id: 'perfect', e: '🏆', name: 'Perfect order', d: 'Get 10 out of 10 in a quiz' },
    { id: 'hard', e: '🧠', name: 'Close call expert', d: 'Score 8 or more on Hard' },
    { id: 'daily', e: '🌅', name: 'Daily dose', d: 'Play the daily challenge' },
    { id: 'fast', e: '⏩', name: 'Fast forward', d: 'Play the timeline at 8× speed' }
  ];
  const BKEY = 'ut:badges:v1';
  let badges = {};
  try { const b = Curio.store.get(BKEY, {}); badges = b && typeof b === 'object' ? b : {}; } catch (e) { badges = {}; }
  function award(id) {
    if (badges[id]) return;
    const b = BADGES.find((x) => x.id === id); if (!b) return;
    badges[id] = Date.now();
    Curio.store.set(BKEY, badges);
    paintBadgeCount();
    Curio.toast(`${b.e} Badge: ${b.name}`, 2400);
    [784, 988, 1318].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.14, 'triangle', 0.06), i * 90));
    buzz([20, 40, 20]);
  }
  function paintBadgeCount() { $('badgeCount').textContent = `${Object.keys(badges).filter((k) => BADGES.some((b) => b.id === k)).length}/${BADGES.length}`; }
  function badgeListNode() {
    const box = document.createElement('div');
    box.className = 'badgeList';
    BADGES.forEach((b) => {
      const d = document.createElement('div');
      if (!badges[b.id]) d.className = 'off';
      d.innerHTML = `<i>${b.e}</i><div><b></b><span></span></div>`;
      d.querySelector('b').textContent = b.name;
      d.querySelector('span').textContent = b.d;
      box.append(d);
    });
    return box;
  }
  function paintEndBadges() {
    const row = $('endBadges'); if (!row) return;
    row.innerHTML = '';
    BADGES.filter((b) => badges[b.id]).forEach((b) => { const p = document.createElement('span'); p.className = 'pill'; p.textContent = `${b.e} ${b.name}`; row.append(p); });
  }
  $('badgesBtn').addEventListener('click', () => Curio.modal({ emoji: '🏅', title: 'Badges', body: badgeListNode(), buttons: [{ label: 'Close', value: 0 }] }));
  paintBadgeCount();

  const sky = { col: [26, 10, 52], k: 0, y: 0, stars: [], neb: [], w: 0, h: 0, dpr: 1, t: 0 };
  const cv = $('sky'), g = cv.getContext('2d');
  function sizeSky() {
    sky.dpr = Math.min(2, devicePixelRatio || 1);
    sky.w = innerWidth; sky.h = innerHeight;
    cv.width = sky.w * sky.dpr; cv.height = sky.h * sky.dpr;
    g.setTransform(sky.dpr, 0, 0, sky.dpr, 0, 0);
    const n = Math.round(sky.w * sky.h / 3200);
    sky.stars = Array.from({ length: n }, () => ({ x: Math.random() * sky.w, y: Math.random() * sky.h, r: Math.random() * 1.4 + .3, z: Math.random() * .8 + .2, p: Math.random() * 6.28, hue: Math.random() < .2 ? 30 : Math.random() < .3 ? 220 : 0 }));
    sky.neb = Array.from({ length: 5 }, (_, i) => ({ x: Math.random() * sky.w, y: Math.random() * sky.h * 3, r: 180 + Math.random() * 260, i }));
  }
  const NEB = ['#b06cff', '#ff8a3c', '#4fc3f7', '#ff7aa8', '#66d17a'];
  let skyRaf = 0;
  function drawSky(now) {
    skyRaf = 0;
    if (document.hidden) return;
    sky.t = now / 1000;
    const { w, h } = sky;
    g.clearRect(0, 0, w, h);
    const k = sky.k;
    const starA = k <= 1 ? 1 : k <= 3 ? .55 : .35;
    const sy = scrollY;
    for (const n of sky.neb) {
      const yy = ((n.y - sy * .08) % (h * 3) + h * 3) % (h * 3) - h;
      const grd = g.createRadialGradient(n.x, yy, 0, n.x, yy, n.r);
      const c = NEB[(n.i + k) % NEB.length];
      grd.addColorStop(0, c + (k <= 1 ? '38' : '20'));
      grd.addColorStop(1, c + '00');
      g.fillStyle = grd;
      g.beginPath(); g.arc(n.x, yy, n.r, 0, 6.283); g.fill();
    }
    for (const s of sky.stars) {
      const yy = ((s.y - sy * s.z * .15) % h + h) % h;
      const tw = .55 + .45 * Math.sin(sky.t * (1 + s.z * 2) + s.p);
      g.globalAlpha = starA * tw * (.4 + s.z * .6);
      g.fillStyle = s.hue === 30 ? '#ffe2b0' : s.hue === 220 ? '#cfe0ff' : '#fff';
      g.beginPath(); g.arc(s.x, yy, s.r * s.z + .2, 0, 6.283); g.fill();
    }
    g.globalAlpha = 1;
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) skyRaf = requestAnimationFrame(drawSky);
  }
  function kickSky() { if (!skyRaf) skyRaf = requestAnimationFrame(drawSky); }
  sizeSky();
  addEventListener('resize', sizeSky);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kickSky(); });
  addEventListener('scroll', kickSky, { passive: true });
  kickSky();

  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' }) : null;
  evs.forEach((r) => { if (io) io.observe(r.el); else r.el.classList.add('in'); });

  const ticks = $('ticks');
  SEGS.slice(1).forEach((s) => { const i = document.createElement('i'); i.style.left = `${s.y0 / TOTAL * 100}%`; ticks.append(i); });
  function jumpY(y, smooth = true) { setPlay(false); scrollTo({ top: tl.offsetTop + y - innerHeight / 2 + 4, behavior: smooth ? 'smooth' : 'auto' }); }
  document.querySelector('.clock .bar').addEventListener('click', (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    jumpY((e.clientX - r.left) / r.width * TOTAL); Curio.beep(660, 0.08, 'sine', 0.05);
  });

  const menu = $('eraMenu');
  function paintEraMenu() {
    menu.innerHTML = '';
    SEGS.forEach((s, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      if (seenEras.has(i)) b.className = 'seen';
      b.innerHTML = `<i style="background:${s.c};color:${s.c}"></i><span></span><small></small>`;
      b.querySelector('span').textContent = s.name;
      b.querySelector('small').textContent = s.log ? '0 s' : (fmtYears(s.from) || ['', '']).join(' ').replace(' years', ' yrs').replace('million', 'M').replace('billion', 'B');
      b.addEventListener('click', () => { closeMenu(); jumpY(s.y0 + 60); Curio.beep(520 + i * 40, 0.12, 'sine', 0.05); });
      menu.append(b);
    });
  }
  function closeMenu() { menu.hidden = true; $('eras').setAttribute('aria-expanded', 'false'); }
  $('eras').addEventListener('click', (e) => { e.stopPropagation(); menu.hidden = !menu.hidden; $('eras').setAttribute('aria-expanded', String(!menu.hidden)); });
  document.addEventListener('click', (e) => { if (!menu.hidden && !menu.contains(e.target)) closeMenu(); });
  paintEraMenu();

  $('speed').addEventListener('click', () => {
    speedI = (speedI + 1) % SPEEDS.length;
    $('speed').textContent = `${SPEEDS[speedI]}×`;
    Curio.beep(400 + speedI * 200, 0.08, 'square', 0.04);
    if (SPEEDS[speedI] === 8) award('fast');
    if (!playing) setPlay(true);
  });

  function stepEra(dir) {
    const t = timeAt(innerHeight / 2 - tl.getBoundingClientRect().top);
    const k = Math.max(0, Math.min(SEGS.length - 1, t.k + dir));
    jumpY(SEGS[k].y0 + 60);
  }

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const MDAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const YEAR_S = 365 * 86400;
  function calOf(since) {
    const secs = Math.min(YEAR_S - 0.001, since / T0 * YEAR_S);
    const day = Math.floor(secs / 86400);
    let m = 0, d = day;
    while (d >= MDAYS[m]) { d -= MDAYS[m]; m++; }
    const rest = secs - day * 86400;
    return { secs, m, d: d + 1, h: Math.floor(rest / 3600), mi: Math.floor(rest % 3600 / 60), s: rest % 60, toEnd: YEAR_S - secs };
  }
  function calLabel(c) {
    const date = `${MONTHS[c.m].slice(0, 3)} ${c.d}`;
    if (c.m < 11 || c.d < 31) return date;
    const hh = c.h % 12 || 12, ap = c.h < 12 ? 'am' : 'pm';
    const mm = String(c.mi).padStart(2, '0');
    if (c.toEnd < 600) return `${date}, ${hh}:${mm}:${String(Math.floor(c.s)).padStart(2, '0')} ${ap}`;
    return `${date}, ${hh}:${mm} ${ap}`;
  }
  const calEvs = evs.map((r) => ({ ...r, cal: calOf(Math.max(r.since, 1e-9)) })).sort((a, b) => a.since - b.since);
  let calBuilt = false, selMonth = -1;
  function buildCal() {
    if (calBuilt) return; calBuilt = true;
    const wrap = $('months');
    MONTHS.forEach((name, m) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'month'; b.setAttribute('aria-pressed', 'false');
      const inM = calEvs.filter((r) => r.cal.m === m);
      b.innerHTML = `<h4><span>${name}</span><small>${inM.length || ''}</small></h4><div class="days"></div>`;
      const days = b.querySelector('.days');
      for (let d = 1; d <= MDAYS[m]; d++) {
        const i = document.createElement('i');
        const on = inM.filter((r) => r.cal.d === d);
        if (on.length) { i.className = on.length > 1 ? 'on many' : 'on'; i.style.setProperty('--c', on[0].c); i.title = on.map((r) => r.ev.name).join(', '); }
        days.append(i);
      }
      b.setAttribute('aria-label', `${name}: ${inM.length} moments`);
      b.addEventListener('click', () => showMonth(m));
      wrap.append(b);
    });
    buildZoom();
  }
  function showMonth(m) {
    selMonth = m;
    [...$('months').children].forEach((b, i) => b.setAttribute('aria-pressed', String(i === m)));
    const box = $('calDetail');
    const inM = calEvs.filter((r) => r.cal.m === m);
    box.innerHTML = `<h3>${MONTHS[m]}</h3>`;
    if (!inM.length) { box.insertAdjacentHTML('beforeend', `<p class="c-muted">Nothing on our list happens in ${MONTHS[m]}. That is about 1.1 billion years of stars quietly being born and dying.</p>`); }
    else {
      const list = document.createElement('div'); list.className = 'calList';
      inM.forEach((r, i) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'calItem'; b.style.setProperty('--c', r.c); b.style.animationDelay = `${i * 25}ms`;
        b.innerHTML = '<span class="e"></span><b></b><span></span>';
        b.querySelector('.e').textContent = r.ev.e;
        b.querySelector('b').textContent = r.ev.name;
        b.lastElementChild.textContent = `${calLabel(r.cal)} · ${r.ev.when}`;
        b.addEventListener('click', () => goEvent(r));
        list.append(b);
      });
      box.append(list);
    }
    Curio.beep(500 + m * 30, 0.08, 'sine', 0.05);
  }
  function buildZoom() {
    const z = $('zoom');
    z.innerHTML = '<h3>December 31st, up close</h3>';
    const last = calEvs.filter((r) => r.cal.toEnd <= 86400);
    const strips = [
      { cls: 'day', lab: 'Dec 31, midnight', end: 'midnight', span: 86400, from: 3600 },
      { cls: 'hour', lab: '11:00 pm', end: 'midnight', span: 3600, from: 60 },
      { cls: 'min', lab: '11:59 pm', end: 'midnight', span: 60, from: 12 },
      { cls: 'sec', lab: '11:59:48 pm, written history', end: 'midnight', span: 12, from: 0 }
    ];
    strips.forEach((st, si) => {
      const d = document.createElement('div');
      d.className = `strip ${st.cls}`;
      d.innerHTML = `<span class="lab">${st.lab}</span><span class="end2">${st.end}</span>`;
      let prev = -99, lift = 0;
      last.filter((r) => r.cal.toEnd <= st.span && r.cal.toEnd > st.from).forEach((r) => {
        const b = document.createElement('button');
        b.type = 'button';
        const x = Math.max(3, Math.min(97, (1 - r.cal.toEnd / st.span) * 100));
        lift = x - prev < 3.2 ? (lift + 1) % 3 : 0;
        prev = x;
        b.style.left = `${x}%`;
        b.style.bottom = `${6 + lift * 26}px`;
        b.textContent = r.ev.e;
        b.setAttribute('aria-label', r.ev.name);
        const show = () => {
          const s = r.cal.toEnd;
          const before = s >= 3600 ? `${Curio.fmt(s / 3600, 1)} hours` : s >= 60 ? `${Curio.fmt(s / 60, 1)} minutes` : `${Curio.fmt(s, s < 1 ? 2 : 1)} seconds`;
          $('zoomTip').innerHTML = '';
          const t = document.createElement('span');
          t.innerHTML = `<b></b> ${calLabel(r.cal)}, ${before} before midnight. Really: ${r.ev.when.toLowerCase()}.`;
          t.querySelector('b').textContent = `${r.ev.e} ${r.ev.name}:`;
          $('zoomTip').append(t);
          if (si >= 2) award('dec31');
          Curio.beep(700 + si * 200, 0.08, 'triangle', 0.05);
        };
        b.addEventListener('click', show);
        b.addEventListener('mouseenter', show);
        d.append(b);
      });
      z.append(d);
    });
    z.insertAdjacentHTML('beforeend', '<div class="zoomTip" id="zoomTip">Tap an icon. All of written history fits in the last 12 seconds of the year.</div>');
  }
  function goEvent(r) {
    closePanels();
    jumpY(r.y, false);
    setTimeout(() => { r.el.classList.add('in', 'flash'); r.el.focus({ preventScroll: true }); setTimeout(() => r.el.classList.remove('flash'), 1500); }, 60);
  }

  let openPanel = null;
  function showPanel(id) {
    closePanels(); closeMenu(); setPlay(false);
    openPanel = $(id); openPanel.hidden = false;
    document.body.style.overflow = 'hidden';
    openPanel.scrollTop = 0;
    openPanel.querySelector('.panel__x').focus();
    Curio.beep(330, 0.15, 'sine', 0.05); setTimeout(() => Curio.beep(660, 0.12, 'sine', 0.04), 70);
  }
  function closePanels() {
    document.querySelectorAll('.panel').forEach((p) => { p.hidden = true; });
    openPanel = null; document.body.style.overflow = '';
  }
  document.querySelectorAll('.panel').forEach((p) => {
    p.addEventListener('click', (e) => { if (e.target === p || e.target.closest('[data-close]')) closePanels(); });
  });
  function openCal() { buildCal(); showPanel('calPanel'); award('calendar'); if (selMonth < 0) showMonth(11); }
  $('openCal').addEventListener('click', openCal);
  $('endCal').addEventListener('click', openCal);

  function hashStr(str) { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const today = new Date();
  const dayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  $('dailyLabel').textContent = `Puzzle for ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  const pool = calEvs.filter((r) => r.since > 1e5 && r.ev.ago !== 0);
  let qDiff = 'easy';
  const Q = { round: 0, score: 0, streak: 0, right: 0, pairs: [], locked: false };
  document.querySelectorAll('.diff').forEach((b) => b.addEventListener('click', () => {
    qDiff = b.dataset.d;
    document.querySelectorAll('.diff').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    paintQBest(); Curio.beep(520, 0.06, 'sine', 0.05);
  }));
  function paintQBest() {
    const bst = Curio.getBest(`quiz-${qDiff}`);
    const daily = Curio.store.get('ut:daily', null);
    let txt = bst != null ? `Best on ${qDiff}: ${bst} points` : 'No score yet on this mode';
    if (qDiff === 'daily' && daily && daily.day === dayKey) txt += ` · today you scored ${daily.score}`;
    $('qBest').textContent = txt;
  }
  function makePairs() {
    const r = qDiff === 'daily' ? rng(hashStr(`ut-${dayKey}`)) : Math.random;
    const hard = qDiff === 'hard';
    const out = []; const used = new Set();
    let guard = 0;
    while (out.length < 10 && guard++ < 5000) {
      const a = pool[Math.floor(r() * pool.length)], b = pool[Math.floor(r() * pool.length)];
      if (a === b || used.has(a) || used.has(b)) continue;
      const ra = T0 - a.since + 1, rb = T0 - b.since + 1;
      const ratio = Math.max(ra, rb) / Math.min(ra, rb);
      if (Math.abs(a.since - b.since) < 1) continue;
      if (hard ? ratio > 2.2 : ratio < 6) continue;
      used.add(a); used.add(b);
      out.push(r() < .5 ? [a, b] : [b, a]);
    }
    return out;
  }
  function openQuiz() { showPanel('quizPanel'); $('qStart').hidden = false; $('qPlay').hidden = true; $('qEnd').hidden = true; paintQBest(); }
  $('openQuiz').addEventListener('click', openQuiz);
  $('endQuiz').addEventListener('click', openQuiz);
  function startQuiz() {
    Object.assign(Q, { round: 0, score: 0, streak: 0, right: 0, pairs: makePairs(), log: [] });
    $('qStart').hidden = true; $('qEnd').hidden = true; $('qPlay').hidden = false;
    nextRound();
  }
  $('qGo').addEventListener('click', startQuiz);
  $('qAgain').addEventListener('click', () => { $('qEnd').hidden = true; $('qStart').hidden = false; paintQBest(); });
  function gap(a, b) {
    const d = Math.abs(a.since - b.since);
    const f = fmtYears(d) || ['less than 1', 'year'];
    return `${f[0]} ${f[1]}`;
  }
  function nextRound() {
    if (Q.round >= Q.pairs.length) return endQuiz();
    Q.locked = false;
    const [a, b] = Q.pairs[Q.round];
    $('qRound').textContent = `Round ${Q.round + 1}/${Q.pairs.length}`;
    $('qProg').style.width = `${Q.round / Q.pairs.length * 100}%`;
    $('qStreak').textContent = Q.streak > 1 ? `🔥 ${Q.streak} in a row` : '';
    $('qMsg').textContent = 'Which happened first?';
    $('qNext').hidden = true;
    const pair = $('pair'); pair.innerHTML = '';
    [a, b].forEach((r, i) => {
      const c = document.createElement('button');
      c.type = 'button'; c.className = 'qcard'; c.style.setProperty('--c', r.c); c.style.animationDelay = `${i * 80}ms`;
      c.innerHTML = '<span class="e"></span><b></b><span class="when"></span>';
      c.querySelector('.e').textContent = r.ev.e;
      c.querySelector('b').textContent = r.ev.name;
      c.addEventListener('click', () => answer(i));
      pair.append(c);
    });
    pair.firstElementChild.focus({ preventScroll: true });
  }
  function answer(i) {
    if (Q.locked) return; Q.locked = true;
    const p = Q.pairs[Q.round];
    const first = p[0].since < p[1].since ? 0 : 1;
    const cards = [...$('pair').children];
    cards.forEach((c, j) => { c.disabled = true; c.querySelector('.when').textContent = p[j].ev.when; });
    const ok = i === first;
    if (ok) {
      Q.streak++; Q.right++;
      const pts = 100 + (Q.streak - 1) * 20;
      Q.score += pts;
      cards[i].classList.add('right');
      $('qMsg').textContent = `${Curio.pick(['Correct!', 'Nailed it!', 'Yes!', 'Spot on!'])} +${pts}. They are ${gap(p[0], p[1])} apart.`;
      [660, 880].forEach((f, k) => setTimeout(() => Curio.beep(f + Q.streak * 20, 0.1, 'triangle', 0.07), k * 80));
      buzz(15);
    } else {
      Q.streak = 0;
      cards[i].classList.add('wrong'); cards[first].classList.add('right');
      $('qMsg').textContent = `Not quite. ${p[first].ev.name} came first, by ${gap(p[0], p[1])}.`;
      Curio.beep(180, 0.25, 'sawtooth', 0.05);
      buzz([40, 30, 40]);
    }
    Q.log.push(ok ? '🟩' : '🟥');
    $('qScore').textContent = Q.score;
    $('qStreak').textContent = Q.streak > 1 ? `🔥 ${Q.streak} in a row` : '';
    Q.round++;
    $('qProg').style.width = `${Q.round / Q.pairs.length * 100}%`;
    $('qNext').hidden = false;
    $('qNext').textContent = Q.round >= Q.pairs.length ? 'See results ›' : 'Next ›';
    $('qNext').focus({ preventScroll: true });
  }
  $('qNext').addEventListener('click', nextRound);
  function trophySvg(n) {
    const col = n >= 9 ? '#ffc233' : n >= 6 ? '#c0c8d4' : '#d08a4a';
    return `<svg viewBox="0 0 120 120"><defs><linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset=".3" stop-color="${col}"/><stop offset="1" stop-color="${col}"/></linearGradient></defs><circle cx="60" cy="60" r="56" fill="${col}" opacity=".15"/><path d="M36 22h48v18c0 18-10 30-24 30S36 58 36 40z" fill="url(#tg)" stroke="rgba(0,0,0,.2)" stroke-width="2"/><path d="M36 28H22c0 14 8 20 16 22M84 28h14c0 14-8 20-16 22" fill="none" stroke="${col}" stroke-width="6" stroke-linecap="round"/><rect x="54" y="68" width="12" height="16" fill="${col}"/><rect x="40" y="84" width="40" height="12" rx="4" fill="${col}"/><text x="60" y="52" text-anchor="middle" font-size="22" font-weight="900" fill="#fff" font-family="sans-serif">${n}</text></svg>`;
  }
  function endQuiz() {
    $('qPlay').hidden = true; $('qEnd').hidden = false;
    const n = Q.right;
    const b = Curio.best(`quiz-${qDiff}`, Q.score);
    $('qTrophy').innerHTML = trophySvg(n);
    $('qEndTitle').textContent = n === 10 ? 'Perfect timeline!' : n >= 8 ? 'Brilliant!' : n >= 5 ? 'Not bad at all' : 'Time is tricky';
    $('qeScore').textContent = Q.score; $('qeRight').textContent = `${n}/${Q.pairs.length}`; $('qeBest').textContent = b.best;
    $('qeNote').textContent = b.isNew ? 'New personal best!' : `Your best on ${qDiff} is ${b.best}.`;
    award('quiz');
    if (n === 10) award('perfect');
    if (qDiff === 'hard' && n >= 8) award('hard');
    if (qDiff === 'daily') { award('daily'); Curio.store.set('ut:daily', { day: dayKey, score: Q.score }); }
    if (n >= 8) Curio.confetti();
    [523, 659, 784].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.15, 'triangle', 0.07), i * 100));
  }
  $('qShare').addEventListener('click', async () => {
    const txt = `Universe Timeline · Which came first? (${qDiff === 'daily' ? `daily ${dayKey}` : qDiff})\n${Q.log.join('')} ${Q.right}/10 · ${Q.score} pts`;
    try { await navigator.clipboard.writeText(txt); Curio.toast('Copied! 📋'); } catch (e) { Curio.toast('Could not copy, sorry'); }
  });

  addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (e.key === 'Escape') { if (openPanel) closePanels(); closeMenu(); return; }
    if (openPanel) {
      if (openPanel.id === 'quizPanel' && !$('qPlay').hidden) {
        if (e.key === '1' || e.key === 'ArrowLeft') { const c = $('pair').children[0]; if (c && !c.disabled) c.click(); }
        if (e.key === '2' || e.key === 'ArrowRight') { const c = $('pair').children[1]; if (c && !c.disabled) c.click(); }
      }
      return;
    }
    if (tag === 'input' || tag === 'textarea') return;
    const k = e.key.toLowerCase();
    if (e.key === ' ' && tag !== 'button') { e.preventDefault(); setPlay(!playing); return; }
    if (playing && ![' ', 'shift'].includes(k)) setPlay(false);
    if (k === 'c') openCal();
    else if (k === 'q') openQuiz();
    else if (k === 'n') stepEra(1);
    else if (k === 'p') stepEra(-1);
    else if (e.key === 'Home') { e.preventDefault(); toStart(); }
    else if (e.key === 'End') { e.preventDefault(); jumpY(TOTAL); }
  });
  $('statN').textContent = `🕰️ ${evs.length} moments`;

  layout();
  addEventListener('scroll', update, { passive: true });
  let lw = innerWidth;
  addEventListener('resize', () => { if (innerWidth !== lw) { lw = innerWidth; layout(); } update(); });
  update();
})();

