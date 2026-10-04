(() => {
  const M = window.MoonCalc;
  const $ = (id) => document.getElementById(id);
  const DAY = 864e5;
  const NAMES = [
    ['Wolf Moon', 'January', 'Wolves were thought to howl more in the hungry depths of winter.'],
    ['Snow Moon', 'February', 'Usually the snowiest month in much of North America.'],
    ['Worm Moon', 'March', 'Thawing ground brings earthworms and the birds that eat them.'],
    ['Pink Moon', 'April', 'Named after pink phlox wildflowers, not the colour of the Moon.'],
    ['Flower Moon', 'May', 'Spring flowers are everywhere.'],
    ['Strawberry Moon', 'June', 'Wild strawberries ripen and get picked.'],
    ['Buck Moon', 'July', 'Young male deer are growing new antlers.'],
    ['Sturgeon Moon', 'August', 'The big fish were easiest to catch in the Great Lakes.'],
    ['Corn Moon', 'September', 'Corn harvest time. Often replaced by the Harvest Moon.'],
    ["Hunter's Moon", 'October', 'Bright evenings for hunting before winter, often after the Harvest Moon.'],
    ['Beaver Moon', 'November', 'Beavers retreat into their lodges and trappers set their traps.'],
    ['Cold Moon', 'December', 'The long nights of midwinter arrive.']
  ];
  const PHASE_TEXT = {
    'New Moon': 'The Moon sits between us and the Sun, its sunlit side turned away. Best night for stargazing.',
    'Waxing Crescent': 'A thin smile in the western sky just after sunset, growing every evening.',
    'First Quarter': 'Half lit and high in the sky at sunset. Craters along the terminator look spectacular in binoculars.',
    'Waxing Gibbous': 'More than half lit and fattening up. It rises in the afternoon and sets after midnight.',
    'Full Moon': 'The whole face lit up, rising at sunset and setting at sunrise. Werewolves, take note.',
    'Waning Gibbous': 'Shrinking after full, rising later each night. The early birds get the best view.',
    'Last Quarter': 'Half lit on the other side, rising around midnight and hanging in the morning sky.',
    'Waning Crescent': 'A thin sliver in the dawn sky, about to vanish into the Sun\'s glare.'
  };

  let t = Date.now(), live = true, south = Curio.store.get('moon:south', false), calMonth = null;
  const fmtDate = (ms, o) => new Date(ms).toLocaleString('en-GB', o);
  const fmtFull = (ms) => fmtDate(ms, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const fmtShort = (ms) => fmtDate(ms, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  function phaseName(s) {
    const near = (ms) => ms != null && Math.abs(ms - t) < 0.5 * DAY;
    const prev = s.prev;
    const lastNear = prev && t - prev.t < 0.5 * DAY ? prev.type : null;
    const evts = [s.next[0], s.next[1], s.next[2], s.next[3]];
    const types = ['New Moon', 'First Quarter', 'Full Moon', 'Last Quarter'];
    for (let i = 0; i < 4; i++) if (near(evts[i])) return types[i];
    if (lastNear != null) return types[lastNear];
    const lit = s.illum;
    if (s.waxing) return lit < 0.5 ? 'Waxing Crescent' : 'Waxing Gibbous';
    return lit < 0.5 ? 'Waning Crescent' : 'Waning Gibbous';
  }

  function moonPath(illum, waxing, r) {
    const k = Math.max(0, Math.min(1, illum));
    const rx = Math.abs(2 * k - 1) * r;
    const gib = k > 0.5;
    if (waxing) return `M0 ${-r}A${r} ${r} 0 0 1 0 ${r}A${rx} ${r} 0 0 ${gib ? 1 : 0} 0 ${-r}Z`;
    return `M0 ${-r}A${r} ${r} 0 0 0 0 ${r}A${rx} ${r} 0 0 ${gib ? 0 : 1} 0 ${-r}Z`;
  }
  function moonIcon(illum, waxing, size) {
    const r = 10;
    const flip = south ? ' transform="rotate(180)"' : '';
    return `<svg width="${size}" height="${size}" viewBox="-11 -11 22 22" aria-hidden="true"><circle r="${r}" fill="#2f3550"/><path${flip} d="${moonPath(illum, waxing, r)}" fill="#f6efd6"/><circle r="${r}" fill="none" stroke="rgba(0,0,0,.25)" stroke-width=".8"/></svg>`;
  }

  const cv = $('moon');
  const g = cv.getContext('2d');
  let N = 0, albedo = null, nx = null, ny = null, nz = null, inside = null, img = null;

  function hash(x, y) {
    const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return s - Math.floor(s);
  }
  function vnoise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  const MARIA = [
    [-0.56, -0.02, 0.27, 0.5, 0.2, 0.32], [-0.3, -0.45, 0.26, 0.22, -0.3, 0.42], [0.17, -0.42, 0.15, 0.14, 0, 0.42],
    [0.34, -0.1, 0.2, 0.17, 0.4, 0.4], [0.72, -0.3, 0.1, 0.13, 0, 0.45], [0.6, 0.15, 0.12, 0.17, 0.3, 0.36],
    [0.4, 0.32, 0.08, 0.09, 0, 0.36], [-0.18, 0.38, 0.17, 0.13, 0.2, 0.34], [-0.5, 0.4, 0.09, 0.09, 0, 0.38],
    [-0.05, -0.74, 0.45, 0.07, 0.1, 0.3], [0.05, -0.2, 0.08, 0.07, 0, 0.32], [-0.12, -0.12, 0.12, 0.08, 0, 0.18],
    [0.0, 0.05, 0.08, 0.1, 0, 0.16]
  ];
  const CRATERS = [[-0.12, 0.74, 0.04, 0.5], [-0.27, -0.18, 0.035, 0.35], [-0.66, -0.12, 0.025, 0.4], [0.47, 0.55, 0.03, 0.15], [-0.4, 0.6, 0.03, 0.15], [0.25, 0.75, 0.04, 0.12], [-0.6, 0.7, 0.035, 0.12]];

  function buildAlbedo() {
    const css = cv.clientWidth || 300;
    const dpr = Math.min(2, devicePixelRatio || 1);
    N = Math.max(120, Math.round(css * dpr));
    cv.width = N; cv.height = N;
    albedo = new Float32Array(N * N); nx = new Float32Array(N * N); ny = new Float32Array(N * N); nz = new Float32Array(N * N); inside = new Float32Array(N * N);
    img = g.createImageData(N, N);
    const R = N / 2 - 2;
    for (let py = 0; py < N; py++) for (let px = 0; px < N; px++) {
      const i = py * N + px;
      const x = (px + 0.5 - N / 2) / R, y = (py + 0.5 - N / 2) / R;
      const rr = x * x + y * y;
      const edge = Math.max(0, Math.min(1, (1 - Math.sqrt(rr)) * R + 0.5));
      inside[i] = edge;
      if (edge <= 0) continue;
      const z = Math.sqrt(Math.max(0, 1 - rr));
      nx[i] = x; ny[i] = y; nz[i] = z;
      let a = 0.86 + 0.1 * (vnoise(x * 6 + 10, y * 6 + 3) - 0.5) + 0.07 * (vnoise(x * 19, y * 19) - 0.5) + 0.04 * (vnoise(x * 50, y * 50) - 0.5);
      for (const [cx, cy, rx, ry, rot, dark] of MARIA) {
        const c = Math.cos(rot), s = Math.sin(rot);
        const dx = x - cx, dy = y - cy;
        const u = (dx * c + dy * s) / rx, v = (-dx * s + dy * c) / ry;
        const wob = 0.25 * (vnoise(x * 9 + cx * 7, y * 9 + cy * 7) - 0.5);
        const d = Math.sqrt(u * u + v * v) + wob;
        if (d < 1.3) a -= dark * 0.85 * Math.max(0, Math.min(1, (1.3 - d) / 0.6));
      }
      for (const [cx, cy, r, ray] of CRATERS) {
        const d = Math.hypot(x - cx, y - cy) / r;
        if (d < 1) a += 0.25 * (1 - d);
        if (ray > 0.3 && d < 14) {
          const ang = Math.atan2(y - cy, x - cx);
          const streak = Math.pow(Math.max(0, Math.sin(ang * 9 + 1.3) * Math.sin(ang * 5)), 6);
          a += ray * 0.18 * streak * Math.max(0, 1 - d / 14);
        }
      }
      for (let k = 0; k < 3; k++) {
        const n = vnoise(x * (14 + k * 11) + 40, y * (14 + k * 11) - 20);
        if (n > 0.82) a += (n - 0.82) * 0.6;
      }
      albedo[i] = Math.max(0.3, Math.min(1.08, a));
    }
  }

  function drawMoon(s) {
    if (!albedo || cv.width !== Math.max(120, Math.round((cv.clientWidth || 300) * Math.min(2, devicePixelRatio || 1)))) buildAlbedo();
    const ph = s.phaseAngle * Math.PI / 180;
    const side = s.waxing ? 1 : -1;
    const lx = side * Math.sin(ph), lz = Math.cos(ph);
    const d = img.data;
    for (let py = 0; py < N; py++) for (let px = 0; px < N; px++) {
      const sx = south ? N - 1 - px : px, sy = south ? N - 1 - py : py;
      const i = sy * N + sx;
      const o = (py * N + px) * 4;
      const e = inside[i];
      if (e <= 0) { d[o + 3] = 0; continue; }
      const dot = nx[i] * lx + nz[i] * lz;
      const lit = Math.max(0, Math.min(1, (dot + 0.035) / 0.1));
      const shade = dot > 0 ? 0.62 + 0.38 * Math.pow(dot, 0.35) : 0.62;
      const a = albedo[i];
      const L = lit * shade * a;
      const es = 0.075 * (1 - lit) * a;
      d[o] = Math.min(255, 255 * L * 1.0 + 255 * es * 0.85);
      d[o + 1] = Math.min(255, 255 * L * 0.98 + 255 * es * 0.95);
      d[o + 2] = Math.min(255, 255 * L * 0.9 + 255 * es * 1.25);
      d[o + 3] = 255 * e;
    }
    g.putImageData(img, 0, 0);
  }

  function starfield() {
    const svg = $('stars');
    let h = '';
    for (let i = 0; i < 70; i++) {
      const x = (hash(i, 1) * 100).toFixed(2), y = (hash(i, 2) * 100).toFixed(2), r = (0.3 + hash(i, 3) * 1.1).toFixed(2), o = (0.25 + hash(i, 4) * 0.6).toFixed(2);
      h += `<circle cx="${x}%" cy="${y}%" r="${r}" fill="#fff" opacity="${o}" class="tw" style="animation-delay:-${(hash(i, 5) * 4).toFixed(2)}s;animation-duration:${(2 + hash(i, 6) * 3).toFixed(2)}s"/>`;
    }
    svg.innerHTML = h;
    svg.setAttribute('width', '100%'); svg.setAttribute('height', '100%');
  }

  function fullName(ft) {
    const d = new Date(ft);
    const y = d.getUTCFullYear();
    const eq = Date.UTC(y, 8, 22, 18);
    const near = M.phasesAround(eq).filter((p) => p.type === 2).sort((a, b) => Math.abs(a.t - eq) - Math.abs(b.t - eq))[0].t;
    if (Math.abs(ft - near) < DAY) return 'Harvest Moon';
    if (ft > near && ft - near < 31 * DAY) return "Hunter's Moon";
    return NAMES[d.getMonth()][0];
  }
  function fullsFrom(ms, count) {
    const out = [];
    let probe = ms;
    while (out.length < count) {
      const list = M.phasesAround(probe).filter((p) => p.type === 2 && p.t > (out.length ? out[out.length - 1] : ms - 1));
      for (const p of list) if (out.length < count && !out.includes(p.t)) out.push(p.t);
      probe += 90 * DAY;
    }
    return out.sort((a, b) => a - b);
  }
  function isBlue(ft) {
    const d = new Date(ft);
    const start = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    return M.phasesAround(ft).some((p) => p.type === 2 && p.t >= start && p.t < ft - DAY);
  }

  let lastName = '';
  function render() {
    const s = M.state(t);
    const name = phaseName(s);
    $('dateLabel').textContent = (live ? 'Right now, ' : '') + fmtFull(t);
    $('phaseName').textContent = name;
    $('blurb').textContent = PHASE_TEXT[name];
    $('illum').textContent = (s.illum * 100).toFixed(s.illum > 0.995 || s.illum < 0.005 ? 1 : 0) + '%';
    $('age').textContent = s.age.toFixed(1);
    $('dist').textContent = Math.round(s.dist).toLocaleString('en-US');
    cv.setAttribute('aria-label', `The Moon: ${name}, ${Math.round(s.illum * 100)} percent lit`);
    document.querySelector('.mn-moonbox').style.setProperty('--glow', (0.08 + 0.32 * s.illum).toFixed(2));
    const lbl = ['New moon', 'First quarter', 'Full moon', 'Last quarter'];
    const icons = [[0, true], [0.5, true], [1, true], [0.5, false]];
    $('next').innerHTML = [0, 1, 2, 3].map((k) => ({ k, ms: s.next[k] })).sort((a, b) => a.ms - b.ms)
      .map(({ k, ms }) => `<li>${moonIcon(icons[k][0], icons[k][1], 26)}<div><b>${lbl[k]}</b>${fmtShort(ms)}</div></li>`).join('');
    drawMoon(s);
    drawOrbit(s);
    const off = Math.round((t - Date.now()) / DAY);
    $('offLabel').textContent = Math.abs(off) < 1 ? 'Today' : `${off > 0 ? '+' : ''}${off} days`;
    if (+$('scrub').value !== Math.max(-400, Math.min(400, off))) $('scrub').value = Math.max(-400, Math.min(400, off));
    const d = new Date(t);
    $('dateIn').value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    $('hemi').textContent = south ? 'Southern view' : 'Northern view';
    $('hemi').setAttribute('aria-pressed', String(south));
    const mk = d.getFullYear() * 12 + d.getMonth();
    if (calMonth == null || calMonth.sel !== mk || calMonth.day !== d.getDate()) renderCal(d.getFullYear(), d.getMonth());
    if (name !== lastName) {
      if (lastName && (name === 'Full Moon' || name === 'New Moon')) Curio.beep(name === 'Full Moon' ? 880 : 330, 0.12, 'sine', 0.08);
      lastName = name;
    }
  }

  function renderCal(y, m) {
    calMonth = { y, m, sel: new Date(t).getFullYear() * 12 + new Date(t).getMonth(), day: new Date(t).getDate() };
    $('monthLabel').textContent = new Date(y, m, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    const first = new Date(y, m, 1);
    const days = new Date(y, m + 1, 0).getDate();
    const pad = (first.getDay() + 6) % 7;
    const events = M.phasesAround(new Date(y, m, 15).getTime());
    const lbl = ['New', '1st Q', 'Full', 'Last Q'];
    let h = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((x) => `<div class="mn-dow">${x}</div>`).join('');
    for (let i = 0; i < pad; i++) h += '<div class="mn-pad"></div>';
    const now = new Date();
    const sel = new Date(t);
    for (let day = 1; day <= days; day++) {
      const start = new Date(y, m, day).getTime(), end = new Date(y, m, day + 1).getTime();
      const s = M.state(new Date(y, m, day, 21).getTime());
      const ev = events.find((e) => e.t >= start && e.t < end);
      const isToday = now.getFullYear() === y && now.getMonth() === m && now.getDate() === day;
      const isSel = sel.getFullYear() === y && sel.getMonth() === m && sel.getDate() === day;
      h += `<button type="button" class="mn-day${isToday ? ' today' : ''}${isSel ? ' sel' : ''}" data-d="${day}" aria-label="${new Date(y, m, day).toDateString()}, ${Math.round(s.illum * 100)}% lit${ev ? ', ' + lbl[ev.type] : ''}"><span class="mn-dn">${day}</span>${moonIcon(s.illum, s.waxing, 30)}<span class="mn-tag">${ev ? lbl[ev.type] : ''}</span></button>`;
    }
    $('cal').innerHTML = h;
  }

  function renderFulls() {
    const list = fullsFrom(Date.now() - DAY * 0.5, 12);
    $('fulls').innerHTML = list.map((ft) => {
      const s = M.state(ft);
      let badge = '';
      if (s.dist < 362000) badge += '<span class="mn-badge">Supermoon</span>';
      if (s.dist > 405000) badge += '<span class="mn-badge micro">Micromoon</span>';
      if (isBlue(ft)) badge += '<span class="mn-badge blue">Blue moon</span>';
      return `<div class="c-card mn-fm">${moonIcon(1, true, 40)}<div><b>${fullName(ft)}${badge}</b><span>${fmtDate(ft, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} · ${Math.round(s.dist).toLocaleString('en-US')} km</span></div></div>`;
    }).join('');
  }

  function renderNames() {
    $('names').innerHTML = NAMES.map(([n, mo, why]) => `<div class="c-card"><b>${mo}: ${n}</b><p>${why}</p></div>`).join('') +
      '<div class="c-card"><b>Harvest Moon</b><p>The full moon closest to the September equinox, rising soon after sunset for several nights in a row so farmers could work late.</p></div>' +
      '<div class="c-card"><b>Blue Moon</b><p>The second full moon in one calendar month. It happens about every two and a half years and is almost never actually blue.</p></div>';
  }

  function setT(ms, isLive) { t = ms; live = !!isLive; render(); }
  $('scrub').addEventListener('input', (e) => { const v = +e.target.value; setT(Date.now() + v * DAY, v === 0); });
  $('prevDay').addEventListener('click', () => setT(t - DAY));
  $('nextDay').addEventListener('click', () => setT(t + DAY));
  $('today').addEventListener('click', () => { setT(Date.now(), true); Curio.beep(660, 0.06, 'triangle', 0.06); });
  $('dateIn').addEventListener('change', (e) => {
    const [y, m, d] = e.target.value.split('-').map(Number);
    if (!y) return;
    const now = new Date();
    setT(new Date(y, m - 1, d, now.getHours(), now.getMinutes()).getTime());
  });
  $('hemi').addEventListener('click', () => { south = !south; Curio.store.set('moon:south', south); render(); renderFulls(); });
  $('cal').addEventListener('click', (e) => {
    const b = e.target.closest('.mn-day');
    if (!b) return;
    const now = new Date();
    setT(new Date(calMonth.y, calMonth.m, +b.dataset.d, now.getHours(), now.getMinutes()).getTime());
    Curio.beep(520, 0.04, 'triangle', 0.05);
  });
  const shiftMonth = (k) => {
    const d = new Date(t);
    const target = new Date(d.getFullYear(), d.getMonth() + k, 1);
    const day = Math.min(d.getDate(), new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate());
    setT(new Date(target.getFullYear(), target.getMonth(), day, d.getHours(), d.getMinutes()).getTime());
  };
  $('prevMonth').addEventListener('click', () => shiftMonth(-1));
  $('nextMonth').addEventListener('click', () => shiftMonth(1));
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { albedo = null; render(); }, 150); });
  setInterval(() => { if (!document.hidden && live) { t = Date.now(); render(); } }, 60000);

  const buzz = (ms) => { try { if (!Curio.muted && navigator.vibrate) navigator.vibrate(ms); } catch (x) {} };
  const BADGES = [
    { id: 'drag', e: '🖐️', name: 'Moon mover', d: 'Drag the Moon through time' },
    { id: 'play', e: '▶️', name: 'Time-lapse', d: 'Play a whole lunar month' },
    { id: 'super', e: '🌕', name: 'Supermoon spotter', d: 'Visit a full moon closer than 362,000 km' },
    { id: 'south', e: '🦘', name: 'Down under', d: 'Switch to the southern view' },
    { id: 'bday', e: '🎂', name: 'Born under it', d: 'Find your birthday moon' },
    { id: 'famous', e: '📜', name: 'History buff', d: 'Visit a famous night' },
    { id: 'quiz', e: '🌗', name: 'Phase reader', d: 'Finish a Name that phase quiz' },
    { id: 'perfect', e: '🏆', name: 'Lunar expert', d: 'Get 10 out of 10' },
    { id: 'daily', e: '📅', name: 'Nightly habit', d: 'Play the daily quiz' }
  ];
  const BKEY = 'moon:badges:v1';
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
  function paintBadges() { $('badgeCount').textContent = `${BADGES.filter((b) => badges[b.id]).length}/${BADGES.length}`; }
  $('badgesBtn').addEventListener('click', () => {
    const box = document.createElement('div'); box.className = 'badgeList';
    BADGES.forEach((b) => { const d = document.createElement('div'); if (!badges[b.id]) d.className = 'off'; d.innerHTML = `<i>${b.e}</i><div><b></b><span></span></div>`; d.querySelector('b').textContent = b.name; d.querySelector('span').textContent = b.d; box.append(d); });
    Curio.modal({ emoji: '🏅', title: 'Badges', body: box, buttons: [{ label: 'Close', value: 0 }] });
  });
  paintBadges();

  let uid = 0;
  function bigMoon(illum, waxing, size, flip) {
    const id = `bm${uid++}`;
    const r = 10;
    const tr = flip ? ' transform="rotate(180)"' : '';
    return `<svg width="${size}" height="${size}" viewBox="-12 -12 24 24" aria-hidden="true"><defs><radialGradient id="${id}g" cx="-.25" cy="-.3" r="1.2"><stop offset="0" stop-color="#fffbe9"/><stop offset=".6" stop-color="#efe6c8"/><stop offset="1" stop-color="#c9bf9f"/></radialGradient><clipPath id="${id}c"><path${tr} d="${moonPath(illum, waxing, r)}"/></clipPath><radialGradient id="${id}h"><stop offset=".78" stop-color="#ffe9a8" stop-opacity=".35"/><stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/></radialGradient></defs><circle r="12" fill="url(#${id}h)" opacity="${(0.2 + illum * 0.8).toFixed(2)}"/><circle r="${r}" fill="#262b45"/><g clip-path="url(#${id}c)"><circle r="${r}" fill="url(#${id}g)"/><g fill="#b3a986" opacity=".7"><ellipse cx="-4" cy="-2" rx="2.6" ry="2"/><ellipse cx="-1" cy="-5" rx="2" ry="1.4"/><ellipse cx="2.5" cy="-1" rx="1.6" ry="1.4"/><ellipse cx="-3" cy="3" rx="1.4" ry="1.1"/><circle cx="-1" cy="7.2" r="1"/></g></g><circle r="${r}" fill="none" stroke="rgba(0,0,0,.3)" stroke-width=".5"/></svg>`;
  }
  function classify(s) {
    const L = s.illum;
    if (L < 0.03) return 'New Moon';
    if (L > 0.97) return 'Full Moon';
    if (Math.abs(L - 0.5) < 0.04) return s.waxing ? 'First Quarter' : 'Last Quarter';
    if (s.waxing) return L < 0.5 ? 'Waxing Crescent' : 'Waxing Gibbous';
    return L < 0.5 ? 'Waning Crescent' : 'Waning Gibbous';
  }

  function drawOrbit(s) {
    const E = ((((180 - s.phaseAngle) % 360) + 360) % 360) * Math.PI / 180;
    const mx = -80 * Math.cos(E), my = 80 * Math.sin(E);
    let h = '<defs><radialGradient id="obE" cx=".3" cy=".4"><stop offset="0" stop-color="#7fd0ff"/><stop offset="1" stop-color="#1c4fa0"/></radialGradient></defs>';
    for (let y = -90; y <= 90; y += 30) h += `<path d="M-118 ${y} h26" stroke="#ffcf6e" stroke-width="2" stroke-linecap="round" opacity=".7" class="ob-ray"/><path d="M-94 ${y - 4} l6 4 l-6 4" fill="none" stroke="#ffcf6e" stroke-width="2" opacity=".7"/>`;
    h += '<text x="-112" y="-102" fill="#ffcf6e" font-size="10" font-weight="800">Sunlight</text>';
    h += '<circle r="80" fill="none" stroke="currentColor" stroke-opacity=".25" stroke-dasharray="3 4"/>';
    h += '<circle r="16" fill="url(#obE)"/><path d="M0 -16 A16 16 0 0 1 0 16 Z" fill="rgba(0,0,10,.55)"/>';
    h += `<g transform="translate(${mx.toFixed(1)} ${my.toFixed(1)})"><circle r="9" fill="#3a3f5c"/><path d="M0 -9 A9 9 0 0 0 0 9 Z" fill="#f6efd6"/><circle r="12" fill="none" stroke="var(--accent)" stroke-width="1.5" class="ob-ping"/></g>`;
    const lbl = [['New', -100, 4], ['Full', 92, 4], ['1st quarter', -20, 104], ['Last quarter', -26, -96]];
    lbl.forEach(([t2, x, y]) => { h += `<text x="${x}" y="${y}" font-size="9" font-weight="700" fill="currentColor" opacity=".55">${t2}</text>`; });
    h += '<path d="M80 -30 a85 85 0 0 0 -20 -30" fill="none" stroke="currentColor" stroke-opacity=".4" stroke-width="1.5"/><path d="M57 -63 l8 0 l-3 7z" fill="currentColor" opacity=".4"/>';
    $('orbit').innerHTML = h;
    const d2 = Math.round(s.dist);
    $('orbitTxt').textContent = `Seen from above the North Pole. The Moon is ${Curio.fmt(Math.round(Math.min(s.phaseAngle, 360 - s.phaseAngle)))} degrees from full, ${d2.toLocaleString('en-US')} km away, and moves about 13 degrees around its orbit each day.`;
    if (s.dist < 362000 && s.illum > 0.98) award('super');
  }

  const cvm = $('moon');
  let dragT0 = 0, dragX0 = 0, dragged = false;
  Curio.drag(cvm, {
    start: (p) => { dragT0 = t; dragX0 = p.x; dragged = false; stopPlay(); cvm.classList.add('grab'); },
    move: (p) => {
      const days = (p.x - dragX0) / Math.max(120, cvm.clientWidth) * 29.53;
      if (Math.abs(days) > 0.05) dragged = true;
      t = dragT0 + days * DAY; live = false; render();
    },
    end: () => { cvm.classList.remove('grab'); if (dragged) { award('drag'); $('dragHint').classList.add('gone'); Curio.beep(520, 0.05, 'triangle', 0.05); } }
  });
  cvm.addEventListener('wheel', (e) => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && !e.ctrlKey) { e.preventDefault(); stopPlay(); setT(t + e.deltaX / 40 * DAY * 0.5); } }, { passive: false });

  let playRaf = 0, playLast = 0, playAcc = 0;
  function stopPlay() { if (!playRaf) return; cancelAnimationFrame(playRaf); playRaf = 0; $('play').textContent = '▶ Play a month'; $('play').setAttribute('aria-pressed', 'false'); }
  function startPlay() {
    if (playRaf) return stopPlay();
    playLast = performance.now(); playAcc = 0;
    $('play').textContent = '⏸ Pause'; $('play').setAttribute('aria-pressed', 'true');
    const step = (now) => {
      if (document.hidden) { stopPlay(); return; }
      const dt = Math.min(0.1, (now - playLast) / 1000); playLast = now;
      const days = dt * 4.5;
      playAcc += days;
      t += days * DAY; live = false; render();
      if (playAcc >= 29.53) { award('play'); playAcc = 0; }
      playRaf = requestAnimationFrame(step);
    };
    playRaf = requestAnimationFrame(step);
  }
  $('play').addEventListener('click', startPlay);
  $('hemi').addEventListener('click', () => { if (south) award('south'); });

  function bdayShow() {
    const v = $('bday').value;
    if (!v) { Curio.toast('Pick a date first'); return; }
    const [y, m, d] = v.split('-').map(Number);
    const ms = new Date(y, m - 1, d, 21).getTime();
    Curio.store.set('moon:bday', v);
    const s = M.state(ms);
    const nm = classify(s);
    const nextFull = s.next[2];
    const out = $('bdayOut');
    out.innerHTML = `<div class="bmoon">${bigMoon(s.illum, s.waxing, 120, south)}</div><div><b>${nm}</b><span>${Math.round(s.illum * 100)}% lit · ${s.age.toFixed(1)} days old</span><span>Next full moon after: ${fmtDate(nextFull, { day: 'numeric', month: 'short', year: 'numeric' })}</span><div class="c-row"><button class="c-btn c-btn--ghost" type="button" id="bdayJump">See that night</button><button class="c-btn c-btn--ghost" type="button" id="bdayShare">Copy</button></div></div>`;
    out.classList.remove('in'); void out.offsetWidth; out.classList.add('in');
    $('bdayJump').addEventListener('click', () => { setT(ms); document.querySelector('.mn-sky').scrollIntoView({ behavior: 'smooth', block: 'center' }); });
    $('bdayShare').addEventListener('click', async () => { try { await navigator.clipboard.writeText(`I was born under a ${nm} (${Math.round(s.illum * 100)}% lit). 🌙 Moon Tonight on Zoble`); Curio.toast('Copied! 📋'); } catch (x) { Curio.toast('Could not copy, sorry'); } });
    award('bday');
    [523, 659, 784].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.12, 'sine', 0.06), i * 90));
  }
  $('bdayGo').addEventListener('click', bdayShow);
  const savedB = Curio.store.get('moon:bday', '');
  if (typeof savedB === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(savedB)) $('bday').value = savedB;

  const FAMOUS = [
    ['On the Origin of Species published', 1859, 11, 24, '📗'], ['Wright brothers first flight', 1903, 12, 17, '🛩️'], ['The Titanic sinks', 1912, 4, 14, '🚢'],
    ['Pluto discovered', 1930, 2, 18, '🔭'], ['Yuri Gagarin orbits Earth', 1961, 4, 12, '👨‍🚀'], ['Apollo 11 lands on the Moon', 1969, 7, 20, '🌕'],
    ["Halley's Comet closest to the Sun", 1986, 2, 9, '☄️'], ['The Berlin Wall falls', 1989, 11, 9, '🧱'], ['A new millennium', 1999, 12, 31, '🎆'],
    ['Great American Eclipse', 2017, 8, 21, '🌑'], ['North American total eclipse', 2024, 4, 8, '🌑'], ['Total eclipse over Spain', 2026, 8, 12, '🇪🇸']
  ];
  $('famous').innerHTML = FAMOUS.map(([n, y, m, d, e], i) => {
    const s = M.state(new Date(y, m - 1, d, 22).getTime());
    return `<button type="button" class="c-card mn-fam" data-i="${i}">${bigMoon(s.illum, s.waxing, 46, south)}<div><b>${e} ${n}</b><span>${new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · ${classify(s)}, ${Math.round(s.illum * 100)}% lit</span></div></button>`;
  }).join('');
  $('famous').addEventListener('click', (e) => {
    const b = e.target.closest('.mn-fam'); if (!b) return;
    const [, y, m, d] = FAMOUS[Number(b.dataset.i)];
    setT(new Date(y, m - 1, d, 22).getTime());
    award('famous');
    document.querySelector('.mn-sky').scrollIntoView({ behavior: 'smooth', block: 'center' });
    Curio.beep(600, 0.08, 'triangle', 0.05);
  });

  const MFACTS = [
    ['📏', 'Drifting away', 'The Moon moves about 3.8 cm farther from Earth every year, roughly as fast as your fingernails grow.'],
    ['🔒', 'Same face, mostly', 'It spins exactly once per orbit, so the same side always faces us. A slight wobble lets us see about 59% of it over time.'],
    ['👣', 'Twelve visitors', 'Only 12 people have walked on the Moon, all between 1969 and 1972. Their footprints could last for millions of years.'],
    ['🪶', 'One sixth gravity', 'You would weigh about a sixth of your Earth weight there. A good jump would carry you several metres.'],
    ['📐', 'A quarter of Earth', 'It is about 3,474 km across, a quarter of Earth\'s width, and the fifth biggest moon in the solar system.'],
    ['🌅', 'Very long days', 'From one lunar sunrise to the next takes about 29.5 Earth days, the same as the cycle of phases.'],
    ['✨', 'Earthshine', 'The faint glow on the dark part of a crescent Moon is sunlight bounced off Earth and back again.'],
    ['🔍', 'The Moon illusion', 'It looks huge near the horizon, but if you measure it, it is the same size as when it is high in the sky.'],
    ['💥', 'Born in a crash', 'It probably formed about 4.5 billion years ago from debris thrown out when a Mars-sized world hit the young Earth.'],
    ['🌊', 'Two tides a day', 'The Moon\'s pull stretches the oceans into two bulges, so most coasts get two high tides every day.'],
    ['📳', 'Moonquakes', 'Seismometers left by Apollo astronauts recorded moonquakes, and some shallow ones lasted for more than 10 minutes.'],
    ['🌡️', 'Hot and cold', 'With no air to hold heat, the surface swings from about 127 °C in sunlight to about -173 °C at night.']
  ];
  $('mfacts').innerHTML = MFACTS.map(([e, h, p]) => `<div class="c-card mn-fact"><i>${e}</i><div><b>${h}</b><p>${p}</p></div></div>`).join('');

  function hashStr(str) { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rngF(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let x = Math.imul(a ^ a >>> 15, 1 | a); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; }; }
  const today = new Date();
  const dayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  $('dailyLabel').textContent = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const PH = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];
  let qMode = 'classic';
  const Q = { list: [], i: 0, right: 0, log: [], locked: false };
  document.querySelectorAll('#quizPanel .diff').forEach((b) => b.addEventListener('click', () => { qMode = b.dataset.d; document.querySelectorAll('#quizPanel .diff').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); paintQBest(); Curio.beep(520, 0.06, 'sine', 0.05); }));
  function paintQBest() { const b = Curio.getBest(`q-${qMode}`); $('qBest').textContent = b != null ? `Your best: ${b} out of 10` : 'No score yet'; }
  let openPanel = null;
  function closePanels() { $('quizPanel').hidden = true; openPanel = null; document.body.style.overflow = ''; }
  $('quizPanel').addEventListener('click', (e) => { if (e.target === $('quizPanel') || e.target.closest('[data-close]')) closePanels(); });
  function openQuiz() {
    stopPlay();
    openPanel = $('quizPanel'); openPanel.hidden = false; document.body.style.overflow = 'hidden';
    $('qStart').hidden = false; $('qPlay').hidden = true; $('qEnd').hidden = true; paintQBest();
    openPanel.querySelector('.panel__x').focus();
    Curio.beep(330, 0.15, 'sine', 0.05); setTimeout(() => Curio.beep(660, 0.12, 'sine', 0.04), 70);
  }
  $('openQuiz').addEventListener('click', openQuiz);
  function makeQuiz() {
    const r = qMode === 'daily' ? rngF(hashStr(`moon-${dayKey}`)) : Math.random;
    const out = [];
    const t0 = Date.UTC(1950, 0, 1), span = Date.UTC(2080, 0, 1) - t0;
    let guard = 0;
    while (out.length < 10 && guard++ < 3000) {
      const ms = t0 + r() * span;
      const s = M.state(ms);
      const L = s.illum;
      if ((L > 0.02 && L < 0.09) || (L > 0.91 && L < 0.98) || (Math.abs(L - 0.5) > 0.025 && Math.abs(L - 0.5) < 0.1)) continue;
      const ans = classify(s);
      if (out.filter((o) => o.ans === ans).length >= 2) continue;
      const wrong = PH.filter((p) => p !== ans);
      for (let i = wrong.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [wrong[i], wrong[j]] = [wrong[j], wrong[i]]; }
      const opts = [ans, ...wrong.slice(0, 3)];
      for (let i = 3; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [opts[i], opts[j]] = [opts[j], opts[i]]; }
      out.push({ s, ans, opts });
    }
    return out;
  }
  $('qGo').addEventListener('click', () => { Object.assign(Q, { list: makeQuiz(), i: 0, right: 0, log: [] }); $('qStart').hidden = true; $('qEnd').hidden = true; $('qPlay').hidden = false; nextQ(); });
  function nextQ() {
    if (Q.i >= Q.list.length) return endQ();
    Q.locked = false;
    const q = Q.list[Q.i];
    $('qRound').textContent = `Moon ${Q.i + 1}/${Q.list.length}`;
    $('qScore').textContent = Q.right;
    $('qMoon').innerHTML = bigMoon(q.s.illum, q.s.waxing, 170, false);
    $('qMoon').classList.remove('in'); void $('qMoon').offsetWidth; $('qMoon').classList.add('in');
    $('qOpts').innerHTML = '';
    q.opts.forEach((o, k) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'qopt'; b.innerHTML = `<small>${k + 1}</small> ${o}`; b.addEventListener('click', () => answerQ(o, b)); $('qOpts').append(b); });
    $('qMsg').textContent = 'Seen from the Northern Hemisphere.';
    $('qNext').hidden = true;
  }
  function answerQ(o, btn) {
    if (Q.locked) return; Q.locked = true;
    const q = Q.list[Q.i];
    const ok = o === q.ans;
    [...$('qOpts').children].forEach((b) => { b.disabled = true; if (b.textContent.includes(q.ans)) b.classList.add('good'); });
    if (ok) { Q.right++; Curio.beep(700 + Q.right * 30, 0.1, 'triangle', 0.07); buzz(12); $('qMsg').textContent = `Yes! ${Math.round(q.s.illum * 100)}% lit.`; }
    else { btn.classList.add('bad'); Curio.beep(170, 0.25, 'sawtooth', 0.05); buzz([30, 20, 30]); $('qMsg').textContent = `It is a ${q.ans}, ${Math.round(q.s.illum * 100)}% lit. ${q.s.waxing ? 'Lit on the right means waxing.' : 'Lit on the left means waning.'}`; }
    Q.log.push(ok ? '🌕' : '🌑');
    $('qScore').textContent = Q.right;
    Q.i++;
    $('qNext').hidden = false; $('qNext').textContent = Q.i >= Q.list.length ? 'See results ›' : 'Next ›';
    $('qNext').focus({ preventScroll: true });
  }
  $('qNext').addEventListener('click', nextQ);
  function endQ() {
    $('qPlay').hidden = true; $('qEnd').hidden = false;
    const b = Curio.best(`q-${qMode}`, Q.right);
    $('qTrophy').innerHTML = bigMoon(Q.right / 10, true, 120, false);
    $('qEndTitle').textContent = Q.right === 10 ? 'A perfect full moon!' : Q.right >= 7 ? 'Bright work' : Q.right >= 4 ? 'Waxing nicely' : 'A new moon of learning';
    $('qeScore').textContent = `${Q.right}/10`; $('qeBest').textContent = b.best;
    award('quiz');
    if (Q.right === 10) { award('perfect'); Curio.confetti(); }
    if (qMode === 'daily') award('daily');
    [523, 659, 784].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.15, 'triangle', 0.07), i * 100));
  }
  $('qAgain').addEventListener('click', () => { $('qEnd').hidden = true; $('qStart').hidden = false; paintQBest(); });
  $('qShare').addEventListener('click', async () => { try { await navigator.clipboard.writeText(`Moon Tonight · Name that phase${qMode === 'daily' ? ` (daily ${dayKey})` : ''}\n${Q.log.join('')} ${Q.right}/10`); Curio.toast('Copied! 📋'); } catch (x) { Curio.toast('Could not copy, sorry'); } });

  addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape') { closePanels(); return; }
    if (openPanel) {
      if (!$('qPlay').hidden && /^[1-4]$/.test(e.key)) { const b = $('qOpts').children[Number(e.key) - 1]; if (b && !b.disabled) b.click(); }
      return;
    }
    if (e.target.matches('input, select, textarea')) return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); stopPlay(); setT(t + (e.key === 'ArrowLeft' ? -1 : 1) * (e.shiftKey ? DAY / 24 : DAY)); }
    else if (e.key === ' ' && !e.target.matches('button')) { e.preventDefault(); startPlay(); }
    else if (e.key.toLowerCase() === 'n') { stopPlay(); setT(Date.now(), true); }
    else if (e.key.toLowerCase() === 'q') openQuiz();
  });
  starfield();
  renderNames();
  renderFulls();
  render();
  if (!Curio.store.get('moon:padtip', false) && !Curio.touchpad) setTimeout(() => { Curio.toast('Tip: on a touchpad, turn on Touchpad mode in the top bar, then click the Moon once to grab it and again to let go.', 5200); Curio.store.set('moon:padtip', true); }, 1600);
})();
