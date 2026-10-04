(() => {
  const BODIES = window.PA_BODIES;
  const DAY = 864e5;
  const J2000 = Date.UTC(2000, 0, 1, 12);
  const $ = (id) => document.getElementById(id);
  const dpr = () => Math.min(2, window.devicePixelRatio || 1);
  const dob = $('dob');
  const pad = (x) => String(x).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  dob.max = iso(new Date());

  const saved = Curio.store.get('pa:save', null);
  const S = { v: 2, badges: [], speed: 1 };
  if (saved && saved.v === 2) Object.assign(S, saved);
  if (!Array.isArray(S.badges)) S.badges = [];
  if (![0.5, 1, 2, 4].includes(S.speed)) S.speed = 1;
  const save = () => Curio.store.set('pa:save', S);

  let birth = null, trying = null;
  const globes = {};
  const globe = (key, px) => { px = Math.max(12, Math.round(px)); const id = key + px; return globes[id] || (globes[id] = PlanetArt.Globe(key, px)); };

  const fmtDate = (ms) => {
    const d = new Date(ms);
    if (d.getFullYear() > 2200) return `in the year ${d.getFullYear().toLocaleString('en-US')}`;
    return `on ${d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}`;
  };
  const decimalsFor = (b) => Math.max(3, Math.min(8, Math.ceil(-Math.log10(1 / (b.period * 86400) * 0.15))));
  const ordinal = (n) => { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n.toLocaleString('en-US') + (s[(v - 20) % 10] || s[v] || s[0]); };

  const ORB = BODIES.filter((b) => b.au && b.L0 != null);
  const SIZE = { mercury: 5, venus: 7, earth: 7.5, mars: 6, jupiter: 13, saturn: 11, uranus: 9, neptune: 9, pluto: 4 };
  const oc = $('orrery'), og = oc.getContext('2d');
  let OW = 0, OH = 0, OD = 1, ostars = [];
  function sizeOrrery() {
    OD = dpr(); OW = oc.clientWidth; OH = oc.clientHeight;
    oc.width = Math.round(OW * OD); oc.height = Math.round(OH * OD);
    let s = 7; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    ostars = Array.from({ length: Math.round(OW * OH / 1800) }, () => [r() * OW, r() * OH, r() * 1.3 + 0.2, r() * 6.28]);
  }
  const angleAt = (b, ms) => (b.L0 + 360 * ((ms - J2000) / DAY) / b.period) * Math.PI / 180;
  function orbitR(au) {
    const rmax = Math.min(OW * 0.47, OH * 0.4 / 0.62);
    const rmin = OW < 500 ? 30 : 42;
    const f = (x) => Math.pow(x, 0.42);
    return rmin + (rmax - rmin) * (f(au) - f(0.387)) / (f(39.48) - f(0.387));
  }
  const replay = { on: false, paused: false, t0: 0, from: 0, to: 0, dur: 12, last: 0, laps: {}, elapsed: 0, lastBeep: 0 };
  let simT = Date.now(), idleBase = Date.now(), idleStart = performance.now();

  function drawOrrery(now) {
    if (!OW) return;
    const g = og;
    g.setTransform(OD, 0, 0, OD, 0, 0);
    g.clearRect(0, 0, OW, OH);
    const t = now / 1000;
    for (const [x, y, r, p] of ostars) { g.globalAlpha = 0.35 + 0.35 * Math.sin(t * 0.8 + p); g.fillStyle = '#fff'; g.fillRect(x, y, r, r); }
    g.globalAlpha = 1;
    const cx = OW / 2, cy = OH / 2 - 4, k = 0.62;
    g.lineWidth = 1;
    for (const b of ORB) {
      const r = orbitR(b.au);
      g.strokeStyle = 'rgba(160,180,255,.18)';
      g.beginPath(); g.ellipse(cx, cy, r, r * k, 0, 0, Math.PI * 2); g.stroke();
      if (birth && (replay.on || replay.done)) {
        const a = angleAt(b, birth);
        g.fillStyle = b.color; g.globalAlpha = 0.8;
        g.beginPath(); g.arc(cx + Math.cos(a) * r, cy - Math.sin(a) * r * k, 2.2, 0, Math.PI * 2); g.fill();
        g.globalAlpha = 1;
      }
    }
    const items = ORB.map((b) => {
      const r = orbitR(b.au), a = angleAt(b, simT);
      return { b, r, a, x: cx + Math.cos(a) * r, y: cy - Math.sin(a) * r * k };
    });
    if (replay.on) {
      for (const it of items) {
        const span = Math.min(Math.PI * 1.6, (replay.to - replay.from) / DAY / it.b.period * Math.PI * 2);
        const tail = Math.min(span, Math.max(0.3, 40 / Math.max(1, it.b.period / 365) / 10));
        const steps = 24;
        for (let i = 0; i < steps; i++) {
          const a0 = it.a - tail * i / steps, a1 = it.a - tail * (i + 1) / steps;
          g.strokeStyle = it.b.color; g.globalAlpha = 0.55 * (1 - i / steps); g.lineWidth = 2.2;
          g.beginPath(); g.moveTo(cx + Math.cos(a0) * it.r, cy - Math.sin(a0) * it.r * k); g.lineTo(cx + Math.cos(a1) * it.r, cy - Math.sin(a1) * it.r * k); g.stroke();
        }
      }
      g.globalAlpha = 1;
    }
    const sunR = 16;
    const behind = items.filter((i) => i.y < cy), front = items.filter((i) => i.y >= cy);
    const drawP = (it) => {
      const s = SIZE[it.b.key] * (OW < 500 ? 0.8 : 1);
      const gl = globe(it.b.key, s * 2 * OD * (it.b.key === 'saturn' ? 1 : 1));
      gl.draw(g, it.x, it.y, s, t * 0.3, { glow: false });
      g.fillStyle = 'rgba(243,238,231,.75)'; g.font = `700 ${OW < 500 ? 9 : 11}px ${getComputedStyle(document.body).fontFamily}`; g.textAlign = 'center';
      g.fillText(it.b.name, it.x, it.y + s + (it.b.key === 'saturn' ? 10 : 12));
    };
    behind.sort((a, b) => a.y - b.y).forEach(drawP);
    globe('sun', sunR * 2 * OD).draw(g, cx, cy, sunR, t * 0.1);
    front.sort((a, b) => a.y - b.y).forEach(drawP);
  }

  function lapChips() {
    $('laps').innerHTML = ORB.map((b) => `<span class="pa-lap" data-k="${b.key}"><i style="background:${b.color}"></i>${b.name} <b>0</b></span>`).join('');
  }
  function setLaps(ms) {
    if (!birth) return;
    for (const el of $('laps').children) {
      const b = ORB.find((x) => x.key === el.dataset.k);
      const n = Math.max(0, Math.floor((ms - birth) / DAY / b.period));
      const prev = replay.laps[b.key] || 0;
      if (n !== prev) {
        replay.laps[b.key] = n;
        el.querySelector('b').textContent = n.toLocaleString('en-US');
        if (replay.on && n > prev) {
          el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
          setTimeout(() => el.classList.remove('bump'), 160);
          const nowP = performance.now();
          const outer = ORB.indexOf(b);
          if (outer >= 2 || nowP - replay.lastBeep > 110) {
            replay.lastBeep = nowP;
            Curio.beep(1046 / Math.pow(1.22, outer), outer >= 4 ? 0.35 : 0.06, outer >= 4 ? 'triangle' : 'sine', outer >= 4 ? 0.1 : 0.04);
          }
          if (outer >= 4) Curio.toast(`Happy ${ordinal(n)} birthday on ${b.name}!`, 1400);
        }
      }
    }
  }

  function startReplay() {
    if (!birth) { Curio.toast('Enter a birthday first'); dob.focus(); return; }
    Object.assign(replay, { on: true, paused: false, from: birth, to: Date.now(), elapsed: 0, last: performance.now(), laps: {}, done: false });
    for (const el of $('laps').children) el.querySelector('b').textContent = '0';
    $('replay').textContent = 'Pause';
    $('oLabel').textContent = 'Replaying your life';
    $('oHint').hidden = true;
    Curio.beep(392, 0.12, 'triangle', 0.08);
  }
  function endReplay() {
    replay.on = false; replay.done = true;
    $('replay').textContent = 'Replay again';
    $('oLabel').textContent = 'Today';
    simT = Date.now();
    Curio.confetti(90);
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.18, 'triangle', 0.08), i * 110));
    award('replay');
  }
  $('replay').addEventListener('click', () => {
    if (replay.on) { replay.paused = !replay.paused; $('replay').textContent = replay.paused ? 'Resume' : 'Pause'; replay.last = performance.now(); return; }
    startReplay();
  });
  const SPEEDS = [0.5, 1, 2, 4];
  const paintSpeed = () => { $('speed').textContent = `${S.speed}×`; };
  $('speed').addEventListener('click', () => { S.speed = SPEEDS[(SPEEDS.indexOf(S.speed) + 1) % SPEEDS.length]; save(); paintSpeed(); Curio.beep(700, 0.05, 'sine', 0.06); });

  function tickOrrery(now) {
    if (replay.on) {
      if (!replay.paused) replay.elapsed += (now - replay.last) / 1000 * S.speed;
      replay.last = now;
      const k = Math.min(1, replay.elapsed / replay.dur);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      simT = replay.from + (replay.to - replay.from) * (0.15 * k + 0.85 * e);
      setLaps(simT);
      if (k >= 1) endReplay();
    } else if (!replay.done) {
      simT = idleBase + (now - idleStart) / 1000 * 3 * DAY;
    } else simT = Date.now();
    const d = new Date(simT);
    $('oDate').textContent = d.getFullYear() < 1000 ? '' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  const cards = [];
  let filter = 'all';
  const FILTERS = [['all', 'Everything'], ['planets', 'Planets'], ['far', 'Dwarfs & beyond']];
  function buildFilter() {
    $('filter').innerHTML = '';
    for (const [id, l] of FILTERS) {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = l; b.dataset.f = id;
      b.addEventListener('click', () => { filter = id; paintFilter(); applyFilter(); });
      $('filter').append(b);
    }
    paintFilter();
  }
  const paintFilter = () => [...$('filter').children].forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.f === filter)));
  const isPlanet = (b) => !b.dwarf && !b.exo && !b.galactic && b.key !== 'comet';
  function applyFilter() { for (const c of cards) c.el.hidden = filter === 'planets' ? !isPlanet(c.b) : filter === 'far' ? isPlanet(c.b) : false; }

  const vis = new Set();
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => { for (const e of es) { const c = cards.find((x) => x.el === e.target); if (c) { if (e.isIntersecting) vis.add(c); else vis.delete(c); } } }) : null;

  function buildCards() {
    const list = $('list');
    list.innerHTML = ''; cards.length = 0; vis.clear();
    const days = (Date.now() - birth) / DAY;
    BODIES.forEach((b, i) => {
      const age = days / b.period;
      const nextN = Math.floor(age) + 1;
      const nextAt = birth + nextN * b.period * DAY;
      const inDays = Math.ceil((nextAt - Date.now()) / DAY);
      const earthAgeThen = (nextAt - birth) / DAY / 365.2425;
      const el = document.createElement('article');
      el.className = 'c-card pa-card';
      el.style.setProperty('--glow', b.color);
      el.style.animationDelay = `${i * 50}ms`;
      const far = nextAt - Date.now() > 150 * 365 * DAY;
      const nextLine = b.moon
        ? `Next full cycle ${fmtDate(nextAt)} <span class="c-muted">(in ${inDays} day${inDays === 1 ? '' : 's'})</span>`
        : b.galactic ? `Your first galactic birthday is about <b>${Math.round((nextAt - Date.now()) / DAY / 365.25 / 1e6).toLocaleString('en-US')} million years</b> away. Pack snacks.`
        : `You turn <b>${nextN.toLocaleString('en-US')}</b> ${fmtDate(nextAt)}${!far ? ` <span class="c-muted">(in ${inDays.toLocaleString('en-US')} day${inDays === 1 ? '' : 's'}${b.key === 'earth' ? '' : `, when you are ${earthAgeThen.toFixed(1)} on Earth`})</span>` : ` <span class="c-muted">(you would be ${Math.round(earthAgeThen).toLocaleString('en-US')} in Earth years)</span>`}`;
      const frac = age - Math.floor(age);
      const C = 2 * Math.PI * 58;
      const sunrises = b.solar ? Math.floor(days / b.solar) : null;
      const yearLen = b.period >= 3650 ? `${(b.period / 365.25).toLocaleString('en-US', { maximumFractionDigits: b.period > 3.6e6 ? 0 : 1 })} Earth years` : `${b.period.toLocaleString('en-US')} Earth days`;
      el.innerHTML = `<div class="pa-globe"><svg viewBox="0 0 128 128" aria-hidden="true"><circle class="trk" cx="64" cy="64" r="58"/><circle class="prg" cx="64" cy="64" r="58" stroke-dasharray="${C}" stroke-dashoffset="${C}"/></svg><canvas aria-label="${b.name}" role="img"></canvas></div>
        <div><div class="pa-name">${b.name}</div>
        <div class="pa-age"><span class="v">0</span> <small>${b.unit}</small></div>
        <p class="pa-next">${nextLine}</p>
        <p class="pa-note">${b.note(age)}</p>
        <div class="pa-meta"><span>${b.moon ? '1 lunar month' : '1 year'} = ${yearLen}</span>${sunrises != null && !b.moon ? `<span>${sunrises.toLocaleString('en-US')} sunrises seen</span>` : ''}<span>${Math.round(frac * 100)}% to the next one</span></div></div>`;
      list.append(el);
      const c = { el, b, v: el.querySelector('.v'), cv: el.querySelector('canvas'), prg: el.querySelector('.prg'), C, frac, dec: decimalsFor(b), t0: performance.now() + i * 60, ready: null, rot: i };
      cards.push(c);
      io?.observe(el);
      setTimeout(() => {
        const d = dpr(); c.cv.width = c.cv.height = Math.round(108 * d);
        const rad = c.cv.width / 2 / (b.key === 'saturn' ? 2.3 : b.key === 'uranus' ? 2.05 : b.key === 'sun' ? 1.5 : 1.08);
        c.ready = { g: c.cv.getContext('2d'), gl: globe(b.key, rad * 2), rad };
        c.prg.style.strokeDashoffset = String(C * (1 - frac));
        drawCard(c);
      }, 80 + i * 40);
    });
    applyFilter();
  }
  function drawCard(c) {
    if (!c.ready) return;
    const { g, gl, rad } = c.ready;
    g.clearRect(0, 0, c.cv.width, c.cv.height);
    gl.draw(g, c.cv.width / 2, c.cv.height / 2, rad, c.rot);
  }
  let lastAge = 0, lastSpin = 0;
  function tickCards(now) {
    if (!birth) return;
    if (now - lastAge > 90) {
      lastAge = now;
      const days = (Date.now() - birth) / DAY;
      for (const c of cards) {
        const target = days / c.b.period;
        const k = Math.min(1, Math.max(0, (now - c.t0) / 1100));
        const e = 1 - Math.pow(1 - k, 3);
        const v = target * e;
        c.v.textContent = v >= 1e5 ? Math.floor(v).toLocaleString('en-US') : v.toLocaleString('en-US', { minimumFractionDigits: c.dec, maximumFractionDigits: c.dec });
      }
    }
    if (now - lastSpin > 50) {
      lastSpin = now;
      for (const c of vis) { c.rot += 0.015; drawCard(c); }
    }
  }

  function upcoming(years = 3) {
    const out = [];
    const now = Date.now(), end = now + years * 365.25 * DAY;
    for (const b of BODIES) {
      if (b.moon || b.exo || b.galactic) continue;
      let n = Math.floor((now - birth) / DAY / b.period) + 1;
      for (;;) {
        const at = birth + n * b.period * DAY;
        if (at > end) break;
        out.push({ b, n, at });
        n++;
      }
    }
    return out.sort((a, c) => a.at - c.at);
  }
  function paintCalendar() {
    const ev = upcoming();
    $('cal').innerHTML = ev.length ? ev.map((e) => {
      const d = Math.ceil((e.at - Date.now()) / DAY);
      return `<li><i style="background:radial-gradient(circle at 35% 35%, #fff8, ${e.b.color} 60%)"></i><div><b>${ordinal(e.n)} birthday on ${e.b.name}</b></div><span>${new Date(e.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · ${d === 0 ? 'today!' : `in ${d.toLocaleString('en-US')} d`}</span></li>`;
    }).join('') : '<li>No birthdays in the next three years. Space is big.</li>';
    const top = ev.filter((e) => !['comet'].includes(e.b.key))[0];
    if (top) {
      const d = Math.ceil((top.at - Date.now()) / DAY);
      $('nextAny').innerHTML = `<canvas aria-hidden="true"></canvas><div><b>Your next birthday anywhere: ${top.b.name}, ${d <= 0 ? 'today' : `in ${d} day${d === 1 ? '' : 's'}`}</b><span>You will turn ${top.n.toLocaleString('en-US')} ${fmtDate(top.at)}. ${ev.length} birthdays in the next three years across the solar system.</span></div>`;
      const cvn = $('nextAny').querySelector('canvas');
      const D = dpr(); cvn.width = cvn.height = 64 * D;
      const rad = 64 * D / 2 / 1.1;
      globe(top.b.key, rad * 2).draw(cvn.getContext('2d'), 32 * D, 32 * D, rad, 0.4);
      if (d <= 0) Curio.confetti();
    }
  }

  $('ics').addEventListener('click', () => {
    const ev = upcoming();
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const day = (ms) => { const d = new Date(ms); return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`; };
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Zoble//Age on Other Planets//EN', 'CALSCALE:GREGORIAN'];
    ev.forEach((e, i) => {
      const next = new Date(e.at); next.setDate(next.getDate() + 1);
      lines.push('BEGIN:VEVENT', `UID:curio-planet-age-${e.b.key}-${e.n}-${i}@curio`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${day(e.at)}`, `DTEND;VALUE=DATE:${day(next.getTime())}`, `SUMMARY:My ${ordinal(e.n)} birthday on ${e.b.name}`, `DESCRIPTION:One ${e.b.name} year lasts ${e.b.period} Earth days.`, 'END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'space-birthdays.ics';
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    Curio.toast(`${ev.length} space birthdays saved`);
    award('calendar');
  });
  $('share').addEventListener('click', async () => {
    const days = (Date.now() - birth) / DAY;
    const pick = ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'neptune', 'pluto'].map((k) => BODIES.find((b) => b.key === k));
    const txt = `My age around the solar system:\n${pick.map((b) => `${b.name}: ${(days / b.period).toFixed(2)}`).join('\n')}\nCurio: Age on Other Planets`;
    try { await navigator.clipboard.writeText(txt); Curio.toast('Copied to clipboard'); award('share'); } catch { Curio.toast('Could not copy, sorry'); }
  });

  const BADGES = [
    ['launch', 'Lift-off', 'Enter a birthday', '#ff5a36', 'M20 6c5 4 7 10 6 17l-3 3h-6l-3-3c-1-7 1-13 6-17zM14 26l-4 6 7-2zm12 0l4 6-7-2z'],
    ['replay', 'Time traveller', 'Watch your life replay', '#6c5ce7', 'M20 9a11 11 0 1 1-11 11h4a7 7 0 1 0 7-7zM19 14h3v7l5 3-1.5 2.5L19 23z'],
    ['century', 'Mercurian elder', 'Be 100 on Mercury', '#b0a8a0', 'M12 28h16v3H12zM14 14h12v12H14zM18 8h4v6h-4z'],
    ['jovian', 'Jovian', 'Have a Jupiter birthday', '#d8a36c', 'M8 18h24v2H8zM9 23h22v2H9zM12 13h16v2H12z'],
    ['saturn', 'Saturn return', 'Have a Saturn birthday', '#e9cf8f', 'M6 22c6-6 22-8 28-4-6 6-22 8-28 4z'],
    ['uranian', 'Uranian', 'A whole Uranus year', '#7fd6e0', 'M20 8v24M14 12l6-4 6 4'],
    ['historian', 'Historian', "Try something else's birthday", '#2ecc71', 'M10 10h20v20H10zM14 15h12M14 20h12M14 25h8'],
    ['calendar', 'Party planner', 'Download the calendar', '#e84393', 'M10 12h20v18H10zM10 17h20M15 9v6M25 9v6'],
    ['share', 'Broadcaster', 'Copy your ages', '#3b8fe0', 'M12 22l16-8v16zM10 18h4v8h-4z']
  ];
  function paintBadges() {
    $('badges').innerHTML = BADGES.map(([id, n, how, col, d]) => `<div class="pa-b${S.badges.includes(id) ? '' : ' locked'}"><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18" fill="${col}"/><path d="${d}" fill="#fff" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/></svg><div>${n}<small>${S.badges.includes(id) ? 'Unlocked' : how}</small></div></div>`).join('');
  }
  function award(id) {
    if (S.badges.includes(id)) return;
    S.badges.push(id); save(); paintBadges();
    const b = BADGES.find((x) => x[0] === id);
    setTimeout(() => Curio.toast(`Badge unlocked: ${b[1]}`), 300);
    [660, 990].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.1, 'triangle', 0.08), 300 + i * 90));
  }

  function show(value, fresh, isTry) {
    const [y, m, d] = value.split('-').map(Number);
    const t = new Date(y, m - 1, d).getTime();
    if (!y || isNaN(t) || t > Date.now() || y < 1800) { Curio.toast('Hmm, that date is out of this world'); return; }
    birth = t; trying = isTry || null;
    if (!isTry) Curio.store.set('life:dob', value);
    $('out').hidden = false;
    $('replay').disabled = false;
    $('oHint').textContent = isTry ? `Showing ages for ${isTry}. Press Replay to watch the planets since then.` : 'Press Replay to watch every orbit you have lived through.';
    $('oHint').hidden = false;
    replay.on = false; replay.done = false; replay.laps = {};
    $('replay').textContent = 'Replay my life';
    lapChips();
    setLaps(Date.now());
    buildCards(); paintCalendar();
    const days = (Date.now() - birth) / DAY;
    award('launch');
    if (isTry) award('historian');
    if (days / 87.969 >= 100) award('century');
    if (days / 4332.59 >= 1) award('jovian');
    if (days / 10759.22 >= 1) award('saturn');
    if (days / 30685.4 >= 1) award('uranian');
    if (fresh) {
      Curio.beep(523, 0.08, 'triangle', 0.08); setTimeout(() => Curio.beep(784, 0.12, 'triangle', 0.08), 90);
      setTimeout(() => $('orrery').scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
      setTimeout(startReplay, 700);
    }
  }

  $('form').addEventListener('submit', (e) => { e.preventDefault(); if (dob.value) show(dob.value, true); });
  const tryBox = $('try');
  for (const tr of window.PA_TRY) {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = tr.label;
    b.addEventListener('click', () => { show(tr.date, true, tr.label); });
    tryBox.append(b);
  }
  addEventListener('keydown', (e) => {
    if (e.target.closest('input, select, textarea, button')) return;
    if (e.key === 'r' || e.key === 'R') startReplay();
    else if (e.key === ' ' && replay.on) { e.preventDefault(); $('replay').click(); }
  });

  let raf = 0;
  function loop(now) {
    raf = 0;
    if (document.hidden) return;
    tickOrrery(now);
    drawOrrery(now);
    tickCards(now);
    raf = requestAnimationFrame(loop);
  }
  const kick = () => { if (!raf && !document.hidden) { replay.last = performance.now(); raf = requestAnimationFrame(loop); } };
  document.addEventListener('visibilitychange', kick);
  new ResizeObserver(() => { sizeOrrery(); }).observe(oc);
  sizeOrrery();
  buildFilter(); paintBadges(); paintSpeed(); lapChips();
  $('oDate').textContent = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  $('oLabel').textContent = 'Fast-forward from today';
  const savedDob = Curio.store.get('life:dob', null);
  if (savedDob) { dob.value = savedDob; show(savedDob, false); }
  kick();
})();
