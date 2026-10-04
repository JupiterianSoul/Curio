(function () {
  const PX = 3474;
  const C = 299792.458;
  const SUN_D = 1392700;
  const SUN_X = 300;
  const $ = (id) => document.getElementById(id);
  const sc = $('scroller'), track = $('track');

  const BODIES = [
    { n: 'Mercury', d: 4879, a: 57.9e6, c: '#a7a29a', f: 'A year here lasts 88 days, but one sunrise to the next takes 176 Earth days.' },
    { n: 'Venus', d: 12104, a: 108.2e6, c: '#e8c27a', f: 'The hottest planet, around 465 °C. Its day is longer than its year.' },
    { n: 'Earth', d: 12742, a: 149.6e6, c: 'radial-gradient(circle at 35% 35%, #7fd0ff, #2a6fd6 60%, #1c8a4b)', f: 'You are here. Everyone who has ever lived, lived on this 3.7 pixel dot.' },
    { n: 'Moon', d: 3474, a: 149.6e6 + 384400, c: '#d8d8d8', f: 'Our ruler: exactly 1 pixel. It sits 110 pixels from Earth.', low: true, moon: true },
    { n: 'Mars', d: 6779, a: 227.9e6, c: '#d0623a', f: 'Home of Olympus Mons, a volcano about 2.5 times taller than Everest.' },
    { n: 'Ceres', d: 939, a: 413.7e6, c: '#9c958c', f: 'The biggest thing in the asteroid belt, and a dwarf planet. Less than a third of a pixel.', low: true, dwarf: true },
    { n: 'Jupiter', d: 139820, a: 778.5e6, c: 'repeating-linear-gradient(175deg, #e6c9a0 0 6%, #c98d5a 6% 12%, #f0dcc0 12% 18%, #b9794a 18% 22%)', f: 'More than twice as massive as all the other planets combined. Its Great Red Spot is a storm wider than Earth.' },
    { n: 'Saturn', d: 116460, a: 1432.0e6, c: 'repeating-linear-gradient(175deg, #f2dca6 0 10%, #d9b87a 10% 18%)', f: 'Its rings are about 270,000 km across but mostly only around 10 metres thick.', rings: 273000 },
    { n: 'Uranus', d: 50724, a: 2867.0e6, c: 'radial-gradient(circle at 40% 35%, #d6fbff, #7fd6e0 70%)', f: 'It rolls around the Sun on its side, tipped over by about 98°.' },
    { n: 'Neptune', d: 49244, a: 4515.0e6, c: 'radial-gradient(circle at 40% 35%, #8fb5ff, #3557d6 70%)', f: 'The windiest planet, with gusts up to about 2,100 km/h.' },
    { n: 'Pluto', d: 2377, a: 5906.4e6, c: '#d9bfa5', f: 'Found in 1930, and it still has not finished a single lap of the Sun: one takes 248 years.', dwarf: true }
  ];
  const NOTES = [
    [3e6, 'This is the Sun. On this map 1 pixel = 3,474 km, the width of our Moon. Off you go →'],
    [22e6, 'Mercury is coming up. Do not blink: it is about 1.4 pixels wide.'],
    [82e6, 'Nothing yet. Get used to it: this is what most of the solar system looks like.'],
    [128e6, 'If the Moon is one pixel, you are about half a millionth of a pixel tall.'],
    [153e6, 'All the other planets would fit, side by side, in the gap between Earth and the Moon. Just.'],
    [188e6, 'Every human who has ever left Earth has stayed within about 400,000 km of it. Out here, nobody has been.'],
    [262e6, 'Messages to Mars rovers take between 3 and 22 minutes to arrive, depending on where the planets are.'],
    [340e6, 'Welcome to the asteroid belt. Unlike in the movies, spacecraft fly straight through without dodging a thing.'],
    [560e6, 'Get ready. Jupiter is huge compared to everything so far.'],
    [900e6, 'You have now passed more empty space than all the planets put together, many thousands of times over.'],
    [1100e6, 'Snack break? Saturn is still 330 million km away.'],
    [1300e6, 'At the speed of light, you would have been travelling for over an hour by now.'],
    [1530e6, 'Sunlight out here is about 100 times dimmer than on Earth.'],
    [1900e6, 'Saturn is less dense than water. Find a bathtub big enough and it would float.'],
    [2300e6, 'Nothing. Nothing. Still nothing.'],
    [2600e6, 'Your scroll wheel is doing great. Your finger may disagree.'],
    [3250e6, 'Only one spacecraft, Voyager 2, has ever visited Uranus and Neptune. It took 12 years to reach Neptune.'],
    [3691e6, 'This is exactly halfway between Uranus and Neptune. It is not a scenic stop.'],
    [4100e6, 'A radio message from here takes almost 4 hours to get home.'],
    [4800e6, 'Welcome to the Kuiper belt: icy leftovers, comets and dwarf planets, very far apart.'],
    [5300e6, 'Almost there. Pluto is coming up, and it is smaller than a pixel.'],
    [40e6, 'Sunlight reaching this spot left the Sun just over 2 minutes ago.'],
    [100e6, 'Venus and Earth are almost the same size. Twins in size, total opposites in comfort.'],
    [205e6, 'Earth and Mars can be anywhere from about 55 to 400 million km apart, depending on where they are in their orbits.'],
    [650e6, 'The Juno spacecraft took almost five years to get from Earth to Jupiter.'],
    [2000e6, 'Saturn\'s moon Titan has lakes and seas of liquid methane, and a thick orange sky.'],
    [3000e6, 'Uranus is the coldest planet of all, down to about -224 °C, even colder than Neptune.'],
    [4400e6, 'Neptune was found with maths: in 1846 astronomers worked out where it had to be from wobbles in Uranus\'s orbit, then looked.'],
    [5650e6, 'New Horizons flew past Pluto in 2015, nine and a half years after it launched.']
  ];
  const MOONS = [
    { n: 'Io', p: 'Jupiter', r: 421700, d: 3643, c: '#e9d36a', side: 1, f: 'The most volcanic place in the solar system.' },
    { n: 'Europa', p: 'Jupiter', r: 671034, d: 3122, c: '#d9cbb3', side: -1, f: 'An ocean hides under its ice.' },
    { n: 'Ganymede', p: 'Jupiter', r: 1070412, d: 5268, c: '#a69a8a', side: 1, f: 'The biggest moon of all, wider than Mercury.' },
    { n: 'Callisto', p: 'Jupiter', r: 1882709, d: 4821, c: '#6f6559', side: -1, f: 'One of the most cratered places we know.' },
    { n: 'Enceladus', p: 'Saturn', r: 237948, d: 504, c: '#f4f8ff', side: -1, f: 'Sprays water out of cracks at its south pole.' },
    { n: 'Rhea', p: 'Saturn', r: 527108, d: 1527, c: '#cfcac2', side: 1, f: 'Saturn\'s second biggest moon.' },
    { n: 'Titan', p: 'Saturn', r: 1221870, d: 5150, c: '#e0a24a', side: -1, f: 'The only moon with a thick atmosphere.' },
    { n: 'Iapetus', p: 'Saturn', r: 3560820, d: 1469, c: '#8a7b68', side: 1, f: 'One side is dark as coal, the other bright as snow.' },
    { n: 'Titania', p: 'Uranus', r: 435910, d: 1578, c: '#bdb3a8', side: 1, f: 'Uranus\'s largest moon, named after a Shakespeare fairy queen.' },
    { n: 'Oberon', p: 'Uranus', r: 583520, d: 1523, c: '#a49a90', side: -1, f: 'The outermost of Uranus\'s big moons.' },
    { n: 'Triton', p: 'Neptune', r: 354759, d: 2707, c: '#e3d6cf', side: 1, f: 'Orbits backwards, so it was probably captured.' },
    { n: 'Charon', p: 'Pluto', r: 19591, d: 1212, c: '#a9a29a', side: 1, f: 'Half Pluto\'s width: they orbit each other.', nolabel: true }
  ];
  const MARKS = [
    { n: 'Parker Solar Probe', a: 6.9e6, e: '🛰️', f: 'Closest pass of the fastest human-made object, about 690,000 km/h.' },
    { n: 'James Webb Telescope', a: 149.6e6 + 1.5e6, e: '🔭', f: 'Parked 1.5 million km beyond Earth, on the side away from the Sun.' },
    { n: 'Vesta', a: 353.3e6, e: '🪨', f: 'Second biggest asteroid, 525 km wide. Dawn orbited it in 2011.', stamp: true },
    { n: 'Halley\'s Comet', a: 5.25e9, e: '☄️', f: 'Its farthest point from the Sun. Next back near us in 2061.', stamp: true }
  ];
  const INFO = {
    Sun: { tag: 'Our star', day: '25 to 35 days', year: '230 million years around the galaxy', moons: '8 planets', g: '274 m/s²', t: '5,500 °C surface' },
    Mercury: { tag: 'The smallest planet', day: '176 days', year: '88 days', moons: '0', g: '3.7 m/s²', t: '-173 to 427 °C' },
    Venus: { tag: 'The hottest planet', day: '117 days', year: '225 days', moons: '0', g: '8.9 m/s²', t: '465 °C' },
    Earth: { tag: 'Home', day: '24 hours', year: '365.25 days', moons: '1', g: '9.8 m/s²', t: '15 °C average' },
    Moon: { tag: 'Our 1-pixel ruler', day: '29.5 days', year: '27.3 days around Earth', moons: '0', g: '1.6 m/s²', t: '-173 to 127 °C' },
    Mars: { tag: 'The red planet', day: '24 h 40 min', year: '687 days', moons: '2', g: '3.7 m/s²', t: '-63 °C average' },
    Vesta: { tag: 'A big asteroid', day: '5.3 hours', year: '3.6 years', moons: '0', g: '0.25 m/s²', t: 'about -100 °C' },
    Ceres: { tag: 'Dwarf planet of the belt', day: '9 hours', year: '4.6 years', moons: '0', g: '0.28 m/s²', t: 'about -105 °C' },
    Jupiter: { tag: 'The giant', day: '9 h 56 min', year: '11.9 years', moons: '95+', g: '24.8 m/s²', t: '-110 °C cloud tops' },
    Saturn: { tag: 'The ringed one', day: '10 h 33 min', year: '29.4 years', moons: '270+', g: '10.4 m/s²', t: '-140 °C' },
    Uranus: { tag: 'The sideways planet', day: '17 h 14 min', year: '84 years', moons: '28+', g: '8.7 m/s²', t: '-195 °C' },
    Neptune: { tag: 'The windy one', day: '16 h 6 min', year: '165 years', moons: '16', g: '11.2 m/s²', t: '-200 °C' },
    Pluto: { tag: 'Dwarf planet with a heart', day: '6.4 days', year: '248 years', moons: '5', g: '0.6 m/s²', t: '-230 °C' }
  };
  const W = Math.ceil(SUN_X + 5906.4e6 / PX + 900);
  const END_KM = (W - SUN_X) * PX;
  track.style.width = `${W}px`;
  const x = (km) => SUN_X + km / PX;

  let html = `<div class="sun" style="left:${SUN_X}px;width:${SUN_D / PX}px;height:${SUN_D / PX}px" role="img" aria-label="The Sun, 401 pixels wide"></div>`;
  html += `<div class="belt" style="left:${x(329e6)}px;width:${(479e6 - 329e6) / PX}px"></div><div class="zone-tag" style="left:${x(404e6)}px">Asteroid belt</div>`;
  html += `<div class="belt kuiper" style="left:${x(4488e6)}px;width:${(END_KM - 4488e6) / PX}px"></div><div class="zone-tag" style="left:${x(5200e6)}px">Kuiper belt</div>`;
  for (const b of BODIES) {
    const px = b.d / PX;
    const s = Math.max(px, 1);
    const lt = b.a / C;
    html += `<div class="body${px < 5 ? ' tiny' : ''}" style="left:${x(b.a)}px;width:${s}px;height:${s}px;background:${b.c}" role="img" aria-label="${b.n}"></div>`;
    if (b.rings) html += `<div class="ring" style="left:${x(b.a)}px;width:${b.rings / PX}px;height:${b.rings / PX * 0.32}px"></div>`;
    const off = px > 30 ? px / 2 : 0;
    html += `<div class="label${b.low ? ' low' : ''}" style="left:${x(b.a)}px;${b.low ? `margin-top:${off}px` : `margin-top:-${off}px`}"><b>${b.n}</b><i>${Curio.fmt(b.d)} km wide · ${px < 10 ? Curio.fmt(px, 2) : Curio.fmt(px, 0)} px</i><span>${b.moon ? '384,400 km from Earth' : `${Curio.fmt(b.a / 1e6, 1)} million km from the Sun · light takes ${fmtTime(lt)}`}</span><span>${b.f}</span></div>`;
  }
  NOTES.forEach(([km, t], i) => { html += `<p class="note" style="left:${x(km)}px;top:${i % 2 ? 76 : 20}%">${t}</p>`; });
  html += `<p class="note" style="left:${W - 210}px;top:40%;width:min(360px, 86vw);font-style:normal;color:#eef1ff">🎉 <b>You walked to Pluto.</b><br>That was 1.7 million pixels. The nearest star, Proxima Centauri, would be another 11.6 billion pixels to the right: about 6,800 more trips like this one.<br><br>Voyager 1, launched in 1977, is already more than four times farther out than Pluto.</p>`;
  for (const m of MOONS) {
    const p = BODIES.find((b) => b.n === m.p);
    const cx = x(p.a), rx = m.r / PX;
    const mx = cx + rx * m.side;
    const sz = Math.max(m.d / PX, 1);
    html += `<div class="orbit" style="left:${cx}px;width:${rx * 2}px;height:${Math.max(6, rx * 0.16)}px"></div>`;
    html += `<div class="body moonb" style="left:${mx}px;width:${sz}px;height:${sz}px;background:radial-gradient(circle at 35% 35%, #fff, ${m.c} 55%)" role="img" aria-label="${m.n}, moon of ${m.p}"></div>`;
    if (!m.nolabel) html += `<div class="mlabel${m.side > 0 ? '' : ' up'}" style="left:${mx}px"><b>${m.n}</b><span>${m.f}</span></div>`;
  }
  for (const m of MARKS) {
    html += `<div class="mark" style="left:${x(m.a)}px"><i>${m.e}</i><b>${m.n}</b><span>${m.f}</span></div>`;
  }
  track.innerHTML = html;

  const map = $('map');
  const mapMax = 5906.4e6;
  map.insertAdjacentHTML('afterbegin', [{ n: 'Sun', a: 0, c: '#ffd23f' }, ...BODIES.filter((b) => !b.moon && !b.dwarf), BODIES[BODIES.length - 1]].map((b) => `<div class="dot${b.a > 700e6 || b.a === 0 ? ' big' : ''}" style="left:${b.a / mapMax * 100}%;--c:${b.c.startsWith('#') ? b.c : '#9fb4ff'}"><span>${b.n}</span></div>`).join(''));

  function fmtTime(s) {
    if (s < 60) return `${Curio.fmt(s, s < 10 ? 1 : 0)} s`;
    if (s < 3600) { const m = Math.floor(s / 60); return `${m} min ${Math.round(s - m * 60)} s`; }
    const h = Math.floor(s / 3600); return `${h} h ${Math.round((s - h * 3600) / 60)} min`;
  }
  function fmtKm(km) {
    if (km < 1e6) return Curio.fmt(km);
    return Curio.fmt(km);
  }

  let lastNear = '', lastPassed = -1;
  function centerKm() { return Math.max(0, (sc.scrollLeft + sc.clientWidth / 2 - SUN_X) * PX); }
  function update() {
    const km = centerKm();
    $('km').textContent = fmtKm(Math.round(km / 1000) * 1000);
    $('lt').textContent = `light: ${fmtTime(km / C)}`;
    $('au').textContent = `from the Sun · ${Curio.fmt(km / 149.6e6, 2)} AU · ${Curio.fmt(km / PX)} px`;
    let near = 'Leaving the Sun', idx = -1;
    for (let i = 0; i < BODIES.length; i++) if (km >= BODIES[i].a - 1e5) idx = i;
    if (km < 5e6) near = 'At the Sun';
    else if (idx >= 0) {
      const b = BODIES[idx];
      const nx = BODIES[idx + 1];
      near = Math.abs(km - b.a) < 3e6 ? `At ${b.n}` : nx ? `Next: ${nx.n} in ${Curio.fmt((nx.a - km) / 1e6, 0)} million km` : 'Past Pluto';
    } else near = `Next: Mercury in ${Curio.fmt((57.9e6 - km) / 1e6, 0)} million km`;
    if (near !== lastNear) { $('near').textContent = near; lastNear = near; }
    if (idx > lastPassed) {
      if (lastPassed >= -1 && idx >= 0 && started) {
        Curio.beep(440 + idx * 60, 0.25, 'sine', 0.06);
        if (BODIES[idx].n === 'Pluto') { Curio.confetti(); Curio.toast('You made it to Pluto! 🎉', 2600); award('pluto'); }
      }
      lastPassed = idx;
    } else if (idx < lastPassed) lastPassed = idx;
    const p = Math.min(1, km / mapMax);
    $('fill').style.width = `${p * 100}%`;
    $('you').style.left = `${p * 100}%`;
    map.setAttribute('aria-valuenow', String(Math.round(p * 100)));
    if (sc.scrollLeft > 60) $('intro').classList.add('gone');
    paintLens(km);
    updateEta();
  }

  let started = false;
  let lightOn = false, mult = 1, pos = 0, lastT = 0, raf = 0;
  function updateEta() {
    if (!lightOn) { $('eta').textContent = 'Pluto at light speed: 5 h 28 min'; return; }
    const left = Math.max(0, 5906.4e6 - centerKm());
    $('eta').textContent = left > 0 ? `Pluto in ${fmtTime(left / (C * mult))}` : 'Arrived';
  }
  function loop(now) {
    if (!lightOn) return;
    const dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
    pos += (C * mult / PX) * dt;
    if (pos >= sc.scrollWidth - sc.clientWidth) { pos = sc.scrollWidth - sc.clientWidth; setLight(false); }
    sc.scrollLeft = pos;
    raf = requestAnimationFrame(loop);
  }
  function setLight(on) {
    lightOn = on;
    $('light').setAttribute('aria-pressed', String(on));
    $('light').innerHTML = on ? '⏸ Stop' : '💡 <span class="long">Travel at </span>light speed';
    cancelAnimationFrame(raf);
    if (on) { started = true; pos = sc.scrollLeft; lastT = performance.now(); raf = requestAnimationFrame(loop); Curio.beep(660, 0.15, 'sine', 0.06); }
    updateEta();
  }
  $('light').addEventListener('click', () => setLight(!lightOn));
  $('speeds').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    mult = Number(b.dataset.m);
    if (mult === 1000) award('warp');
    $('speeds').querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    Curio.beep(400 + Math.log10(mult) * 200, 0.08, 'triangle', 0.06);
    if (!lightOn) setLight(true); else updateEta();
  });
  const SIMPLE = Curio.simple;
  const HOPS = [{ n: 'Sun', a: 0 }, ...BODIES.filter((b) => b.n !== 'Ceres')];
  let flight = 0;
  function hopIndex() { const km = centerKm(); let i = 0; HOPS.forEach((h, k) => { if (km >= h.a - 5e4) i = k; }); return i; }
  function paintHop() {
    const i = hopIndex();
    const nx = HOPS[i + 1];
    $('hopNext').textContent = nx ? `Fly to ${nx.n} ›` : 'Back to the Sun ↺';
    $('hopBack').disabled = i === 0;
  }
  function flyTo(km) {
    setLight(false);
    cancelAnimationFrame(flight);
    started = true;
    const from = sc.scrollLeft, to = Math.max(0, x(km) - sc.clientWidth / 2);
    const dist = Math.abs(to - from);
    const dur = Math.min(4200, 900 + Math.log10(1 + dist) * 520);
    const t0 = performance.now();
    $('stage').classList.add('flying');
    Curio.beep(220, 0.5, 'sine', 0.04); setTimeout(() => Curio.beep(330, 0.4, 'sine', 0.03), 150);
    const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const step = (now) => {
      const t = Math.min(1, (now - t0) / dur);
      sc.scrollLeft = from + (to - from) * ease(t);
      if (t < 1) flight = requestAnimationFrame(step);
      else { $('stage').classList.remove('flying'); paintHop(); if (!lensOpen && SIMPLE) $('lensToggle').click(); }
    };
    flight = requestAnimationFrame(step);
  }
  function hop(dir) {
    const i = hopIndex();
    const j = i + dir;
    if (j >= HOPS.length) { flyTo(0); return; }
    if (j < 0) return;
    flyTo(HOPS[j].a);
  }
  $('hopNext').addEventListener('click', () => hop(1));
  $('hopBack').addEventListener('click', () => hop(-1));
  $('start').addEventListener('click', () => { started = true; sc.focus({ preventScroll: true }); if (SIMPLE) hop(1); else setLight(true); });
  if (SIMPLE) { $('start').textContent = 'Fly to Mercury →'; sc.addEventListener('scroll', () => paintHop(), { passive: true }); }
  $('home').addEventListener('click', () => { setLight(false); sc.scrollLeft = 0; Curio.beep(880, 0.15, 'sine', 0.05); });
  map.addEventListener('click', (e) => {
    const r = map.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    started = true;
    jumpTo(p * mapMax);
  });
  map.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault(); e.stopPropagation();
    const km = centerKm();
    const list = [0, ...BODIES.filter((b) => !b.moon).map((b) => b.a)];
    const target = e.key === 'ArrowRight' ? list.find((a) => a > km + 3e6) : list.slice().reverse().find((a) => a < km - 3e6);
    if (target != null) jumpTo(target);
  });
  function jumpTo(km) {
    const was = lightOn; setLight(false);
    sc.scrollLeft = Math.max(0, x(km) - sc.clientWidth / 2);
    lastPassed = -1;
    for (let i = 0; i < BODIES.length; i++) if (km >= BODIES[i].a - 1e5) lastPassed = i;
    if (was) setLight(true);
    Curio.beep(700, 0.1, 'triangle', 0.05);
  }

  sc.addEventListener('scroll', () => { if (!lightOn) pos = sc.scrollLeft; update(); }, { passive: true });
  sc.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      sc.scrollLeft += e.deltaY * (e.deltaMode === 1 ? 30 : 1) * (e.shiftKey ? 10 : 1);
    }
    started = true;
    if (lightOn) setLight(false);
  }, { passive: false });
  sc.addEventListener('touchstart', () => { started = true; cancelAnimationFrame(flight); if (lightOn) setLight(false); }, { passive: true });
  addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input, select, textarea')) return;
    const step = e.shiftKey ? sc.clientWidth * 10 : sc.clientWidth * 0.4;
    let d = 0;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') d = step;
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') d = -step;
    else if (e.key === 'Home') { e.preventDefault(); $('home').click(); return; }
    else if (e.key === ' ' && (e.target === document.body || e.target === sc)) { e.preventDefault(); if (SIMPLE) hop(1); else setLight(!lightOn); return; }
    if (SIMPLE && (e.key === 'ArrowRight' || e.key === 'ArrowLeft') && e.target !== map) { e.preventDefault(); hop(e.key === 'ArrowRight' ? 1 : -1); return; }
    if (!d || e.target === map) return;
    e.preventDefault();
    started = true;
    if (lightOn) setLight(false);
    sc.scrollLeft += d;
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && lightOn) setLight(false); });
  addEventListener('resize', update);
  const buzz = (ms) => { try { if (!Curio.muted && navigator.vibrate) navigator.vibrate(ms); } catch (e) {} };
  const STOPS = [{ n: 'Sun', a: 0 }, ...BODIES.map((b) => ({ n: b.n, a: b.a })), ...MARKS.filter((m) => m.stamp).map((m) => ({ n: m.n, a: m.a }))].sort((p, q) => p.a - q.a);
  const SKEY = 'sw:passport:v1';
  let pass = Curio.store.get(SKEY, null);
  if (!pass || typeof pass !== 'object' || !pass.stamps) pass = { stamps: {}, badges: {} };
  const save = () => Curio.store.set(SKEY, pass);
  const BADGES = [
    { id: 'moon', e: '🌕', n: 'Moon spotter', d: 'Find the 1-pixel Moon' },
    { id: 'pluto', e: '🥾', n: 'All the way', d: 'Walk to Pluto' },
    { id: 'warp', e: '🚀', n: 'Warp drive', d: 'Travel at 1000× light speed' },
    { id: 'photon', e: '💡', n: 'Patient photon', d: 'Ride at real light speed for 3 minutes' },
    { id: 'grand', e: '🎫', n: 'Grand tour', d: 'Collect every passport stamp' }
  ];
  function award(id) {
    if (pass.badges[id]) return;
    const b = BADGES.find((x) => x.id === id); if (!b) return;
    pass.badges[id] = Date.now(); save();
    Curio.toast(`${b.e} Badge: ${b.n}`, 2400);
    [784, 988, 1318].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.14, 'triangle', 0.06), i * 90));
    buzz([20, 40, 20]);
  }
  function stamp(n) {
    if (pass.stamps[n]) return;
    pass.stamps[n] = Date.now(); save();
    paintPassCount();
    if (n === 'Moon') award('moon');
    const el = $('stampFx');
    el.innerHTML = `${PlanetArt.planet(n === 'Halley\'s Comet' ? 'Moon' : n, 70)}<b></b>`;
    el.querySelector('b').textContent = n;
    el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
    Curio.beep(220, 0.08, 'square', 0.05); setTimeout(() => Curio.beep(660, 0.14, 'triangle', 0.05), 70);
    buzz(25);
    if (STOPS.every((s) => pass.stamps[s.n])) award('grand');
  }
  function paintPassCount() { $('passN').textContent = `${STOPS.filter((s) => pass.stamps[s.n]).length}/${STOPS.length}`; }

  let lensOpen = Curio.store.get('sw:lens', innerWidth > 600);
  let lensName = '';
  const lens = $('lens');
  function nearest(km) {
    let best = null, bd = Infinity;
    for (const s of STOPS) { const d = Math.abs(s.a - km); if (d < bd) { bd = d; best = s; } }
    return { s: best, d: bd };
  }
  function tripTimes(km) {
    const h = (v) => km / v;
    const f = (hours) => {
      if (hours < 1 / 60) return `${Curio.fmt(hours * 3600, 0)} s`;
      if (hours < 1) return `${Curio.fmt(hours * 60, 0)} min`;
      if (hours < 48) return `${Curio.fmt(hours, 1)} h`;
      if (hours < 24 * 730) return `${Curio.fmt(hours / 24, 0)} days`;
      return `${Curio.fmt(hours / 8766, 0)} years`;
    };
    return [['🚶', 'Walking', f(h(5))], ['🚗', 'Car', f(h(100))], ['✈️', 'Jet', f(h(900))], ['🛰️', 'Voyager 1', f(h(61000))], ['💡', 'Light', f(h(C * 3600))]];
  }
  function paintLens(km) {
    const { s, d } = nearest(km);
    const vis = sc.clientWidth / 2 * PX * 1.1;
    const show = s && d < Math.max(vis, s.n === 'Sun' ? 2e6 : 0) && sc.scrollLeft > 60;
    if (show && d < Math.max(2e6, sc.clientWidth * 0.15 * PX)) stamp(s.n);
    lens.classList.toggle('show', !!show);
    lens.classList.toggle('open', !!lensOpen);
    if (!show || s.n === lensName) return;
    lensName = s.n;
    const body = BODIES.find((b) => b.n === s.n);
    const mark = MARKS.find((m) => m.n === s.n);
    const info = INFO[s.n] || INFO[s.n === 'Halley\'s Comet' ? 'Pluto' : 'Moon'];
    const art = s.n === 'Halley\'s Comet' ? '<svg viewBox="0 0 100 100" width="120" height="120" role="img" aria-label="Halley\'s Comet"><defs><linearGradient id="hc" x1="0" x2="1"><stop offset="0" stop-color="#9fdcff" stop-opacity="0"/><stop offset="1" stop-color="#e6f6ff"/></linearGradient></defs><path d="M6 30 L70 58 L64 66z" fill="url(#hc)"/><path d="M10 48 L70 60 L66 66z" fill="url(#hc)" opacity=".6"/><circle cx="70" cy="62" r="9" fill="#e9f6ff"/><circle cx="70" cy="62" r="4" fill="#fff"/></svg>' : PlanetArt.planet(s.n, 120);
    $('lensArt').innerHTML = art;
    $('lensName').textContent = s.n;
    $('lensTag').textContent = mark && !INFO[s.n] ? mark.f : info.tag;
    const st = $('lensStats');
    st.innerHTML = '';
    const rows = s.n === 'Halley\'s Comet' ? [['Orbit', '76 years'], ['Nucleus', '15 km long'], ['Last visit', '1986'], ['Next', '2061']] : [['Size', `${Curio.fmt(body ? body.d : s.n === 'Sun' ? SUN_D : 525)} km`], ['Day', info.day], ['Year', info.year], ['Moons', info.moons], ['Gravity', info.g], ['Temp', info.t]];
    rows.forEach(([k, v]) => { const dd = document.createElement('div'); dd.innerHTML = '<span></span><b></b>'; dd.firstChild.textContent = k; dd.lastChild.textContent = v; st.append(dd); });
    const tt = $('lensTrip');
    tt.innerHTML = s.a > 0 ? '<p>Getting here from the Sun</p>' : '<p>Getting to Pluto from here</p>';
    tripTimes(s.a > 0 ? s.a : 5906.4e6).forEach(([e, n, v]) => { const dd = document.createElement('div'); dd.innerHTML = `<i>${e}</i><span></span><b></b>`; dd.children[1].textContent = n; dd.children[2].textContent = v; tt.append(dd); });
    lens.classList.remove('pop'); void lens.offsetWidth; lens.classList.add('pop');
  }
  $('lensToggle').addEventListener('click', () => {
    lensOpen = !lensOpen; Curio.store.set('sw:lens', lensOpen);
    lens.classList.toggle('open', lensOpen);
    $('lensToggle').setAttribute('aria-expanded', String(lensOpen));
    Curio.beep(lensOpen ? 700 : 500, 0.07, 'sine', 0.05);
  });
  $('lensToggle').setAttribute('aria-expanded', String(lensOpen));

  $('passBtn').addEventListener('click', () => {
    const box = document.createElement('div');
    box.className = 'passport';
    const grid = document.createElement('div'); grid.className = 'stamps';
    STOPS.forEach((s, i) => {
      const got = pass.stamps[s.n];
      const d = document.createElement('div');
      d.className = `stamp${got ? ' got' : ''}`;
      d.style.setProperty('--r', `${((i * 37) % 17) - 8}deg`);
      d.innerHTML = got ? `${s.n === 'Halley\'s Comet' ? '<span class="cm">☄️</span>' : PlanetArt.planet(s.n, 46)}<b></b><span></span>` : '<span class="q">?</span><b></b><span></span>';
      d.querySelector('b').textContent = got ? s.n : '???';
      d.querySelector('span:last-child').textContent = got ? new Date(got).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : `${Curio.fmt(s.a / 1e6, 0)}M km`;
      grid.append(d);
    });
    box.append(grid);
    const bl = document.createElement('div'); bl.className = 'blist';
    BADGES.forEach((b) => { const d = document.createElement('div'); d.className = pass.badges[b.id] ? '' : 'off'; d.innerHTML = `<i>${b.e}</i><div><b></b><span></span></div>`; d.querySelector('b').textContent = b.n; d.querySelector('span').textContent = b.d; bl.append(d); });
    box.append(bl);
    Curio.modal({ emoji: '🎫', title: `Space passport · ${STOPS.filter((s) => pass.stamps[s.n]).length} of ${STOPS.length} stamps`, body: box, buttons: [{ label: 'Keep walking', value: 1 }] });
  });
  paintPassCount();

  let photonT = 0;
  setInterval(() => {
    if (lightOn && mult === 1 && !document.hidden) { photonT++; if (photonT >= 180) award('photon'); } else photonT = 0;
  }, 1000);

  const sky = { dirty: true, stars: [], w: 0, h: 0 };
  const cv = $('sky'), g = cv.getContext('2d');
  function sizeSky() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    sky.w = cv.clientWidth; sky.h = cv.clientHeight;
    cv.width = sky.w * dpr; cv.height = sky.h * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
    sky.stars = Array.from({ length: Math.round(sky.w * sky.h / 2600) }, () => ({ x: Math.random() * sky.w * 3, y: Math.random() * sky.h, r: Math.random() * 1.3 + .2, z: [0.02, 0.06, 0.14][Math.floor(Math.random() * 3)], p: Math.random() * 6.3, c: Math.random() < .15 ? '#ffe2b8' : Math.random() < .2 ? '#cfe0ff' : '#ffffff' }));
    sky.dirty = true;
  }
  function drawSky(now) {
    if (!document.hidden) {
      const t = now / 1000;
      g.clearRect(0, 0, sky.w, sky.h);
      const sl = sc.scrollLeft;
      const W3 = sky.w * 3;
      const glow = Math.max(0, 1 - sl / 1600);
      if (glow > 0) {
        const gr = g.createRadialGradient(SUN_X - sl, sky.h * .46, 0, SUN_X - sl, sky.h * .46, 900);
        gr.addColorStop(0, `rgba(255,170,60,${.35 * glow})`); gr.addColorStop(1, 'rgba(255,120,20,0)');
        g.fillStyle = gr; g.fillRect(0, 0, sky.w, sky.h);
      }
      const mw = Math.min(1, sl / 200000);
      const mg = g.createLinearGradient(0, sky.h * .1, sky.w, sky.h * .9);
      mg.addColorStop(0, 'rgba(120,90,200,0)'); mg.addColorStop(.5, `rgba(120,110,220,${.06 + .05 * mw})`); mg.addColorStop(1, 'rgba(60,140,200,0)');
      g.fillStyle = mg; g.fillRect(0, 0, sky.w, sky.h);
      for (const s of sky.stars) {
        const xx = ((s.x - sl * s.z) % W3 + W3) % W3;
        if (xx > sky.w) continue;
        g.globalAlpha = (.45 + .55 * Math.sin(t * (.8 + s.z * 8) + s.p) ** 2) * (.4 + s.z * 4);
        g.fillStyle = s.c;
        g.fillRect(xx, s.y, s.r * (1 + s.z * 4), s.r * (1 + s.z * 4));
      }
      g.globalAlpha = 1;
    }
    if (!still) requestAnimationFrame(drawSky);
  }
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  sizeSky();
  addEventListener('resize', sizeSky);
  requestAnimationFrame(drawSky);
  if (still) sc.addEventListener('scroll', () => requestAnimationFrame(drawSky), { passive: true });
  update();
})();

