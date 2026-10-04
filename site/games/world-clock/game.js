(() => {
  const $ = (id) => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  const RAD = Math.PI / 180;
  const LAT_TOP = 84, LAT_BOT = -61;
  const X = (lon) => (lon + 180) * 2;
  const Y = (lat) => (90 - lat) * 2;

  const CITIES = [
    ['London', '🇬🇧', 'Europe/London', 51.51, -0.13], ['New York', '🇺🇸', 'America/New_York', 40.71, -74.01],
    ['Los Angeles', '🇺🇸', 'America/Los_Angeles', 34.05, -118.24], ['Chicago', '🇺🇸', 'America/Chicago', 41.88, -87.63],
    ['Mexico City', '🇲🇽', 'America/Mexico_City', 19.43, -99.13], ['São Paulo', '🇧🇷', 'America/Sao_Paulo', -23.55, -46.63],
    ['Buenos Aires', '🇦🇷', 'America/Argentina/Buenos_Aires', -34.6, -58.38], ['Reykjavík', '🇮🇸', 'Atlantic/Reykjavik', 64.15, -21.94],
    ['Paris', '🇫🇷', 'Europe/Paris', 48.86, 2.35], ['Berlin', '🇩🇪', 'Europe/Berlin', 52.52, 13.4],
    ['Lagos', '🇳🇬', 'Africa/Lagos', 6.52, 3.38], ['Cairo', '🇪🇬', 'Africa/Cairo', 30.04, 31.24],
    ['Nairobi', '🇰🇪', 'Africa/Nairobi', -1.29, 36.82], ['Johannesburg', '🇿🇦', 'Africa/Johannesburg', -26.2, 28.05],
    ['Moscow', '🇷🇺', 'Europe/Moscow', 55.76, 37.62], ['Dubai', '🇦🇪', 'Asia/Dubai', 25.2, 55.27],
    ['Mumbai', '🇮🇳', 'Asia/Kolkata', 19.08, 72.88], ['Kathmandu', '🇳🇵', 'Asia/Kathmandu', 27.72, 85.32],
    ['Bangkok', '🇹🇭', 'Asia/Bangkok', 13.76, 100.5], ['Singapore', '🇸🇬', 'Asia/Singapore', 1.35, 103.82],
    ['Beijing', '🇨🇳', 'Asia/Shanghai', 39.9, 116.4], ['Tokyo', '🇯🇵', 'Asia/Tokyo', 35.68, 139.69],
    ['Sydney', '🇦🇺', 'Australia/Sydney', -33.87, 151.21], ['Auckland', '🇳🇿', 'Pacific/Auckland', -36.85, 174.76],
    ['Honolulu', '🇺🇸', 'Pacific/Honolulu', 21.31, -157.86],
    ['Anchorage', '🇺🇸', 'America/Anchorage', 61.22, -149.9], ['Vancouver', '🇨🇦', 'America/Vancouver', 49.28, -123.12],
    ['Denver', '🇺🇸', 'America/Denver', 39.74, -104.99], ['Toronto', '🇨🇦', 'America/Toronto', 43.65, -79.38],
    ['Havana', '🇨🇺', 'America/Havana', 23.11, -82.37], ['Bogotá', '🇨🇴', 'America/Bogota', 4.71, -74.07],
    ['Lima', '🇵🇪', 'America/Lima', -12.05, -77.04], ['Santiago', '🇨🇱', 'America/Santiago', -33.45, -70.67],
    ["St. John's", '🇨🇦', 'America/St_Johns', 47.56, -52.71], ['Lisbon', '🇵🇹', 'Europe/Lisbon', 38.72, -9.14],
    ['Madrid', '🇪🇸', 'Europe/Madrid', 40.42, -3.7], ['Rome', '🇮🇹', 'Europe/Rome', 41.9, 12.5],
    ['Stockholm', '🇸🇪', 'Europe/Stockholm', 59.33, 18.07], ['Athens', '🇬🇷', 'Europe/Athens', 37.98, 23.73],
    ['Istanbul', '🇹🇷', 'Europe/Istanbul', 41.01, 28.98], ['Kyiv', '🇺🇦', 'Europe/Kiev', 50.45, 30.52],
    ['Tehran', '🇮🇷', 'Asia/Tehran', 35.69, 51.39], ['Karachi', '🇵🇰', 'Asia/Karachi', 24.86, 67.0],
    ['Dhaka', '🇧🇩', 'Asia/Dhaka', 23.81, 90.41], ['Jakarta', '🇮🇩', 'Asia/Jakarta', -6.2, 106.85],
    ['Hong Kong', '🇭🇰', 'Asia/Hong_Kong', 22.32, 114.17], ['Seoul', '🇰🇷', 'Asia/Seoul', 37.57, 126.98],
    ['Manila', '🇵🇭', 'Asia/Manila', 14.6, 120.98], ['Perth', '🇦🇺', 'Australia/Perth', -31.95, 115.86],
    ['Adelaide', '🇦🇺', 'Australia/Adelaide', -34.93, 138.6], ['Casablanca', '🇲🇦', 'Africa/Casablanca', 33.57, -7.59],
    ['Addis Ababa', '🇪🇹', 'Africa/Addis_Ababa', 9.03, 38.74], ['Kinshasa', '🇨🇩', 'Africa/Kinshasa', -4.44, 15.27],
    ['Chatham Islands', '🇳🇿', 'Pacific/Chatham', -43.95, -176.55], ['Kiritimati', '🇰🇮', 'Pacific/Kiritimati', 1.87, -157.4],
    ['Amsterdam', '🇳🇱', 'Europe/Amsterdam', 52.37, 4.9], ['Warsaw', '🇵🇱', 'Europe/Warsaw', 52.23, 21.01],
    ['Helsinki', '🇫🇮', 'Europe/Helsinki', 60.17, 24.94], ['Jerusalem', '🇮🇱', 'Asia/Jerusalem', 31.77, 35.21],
    ['Riyadh', '🇸🇦', 'Asia/Riyadh', 24.71, 46.68], ['Kabul', '🇦🇫', 'Asia/Kabul', 34.53, 69.17],
    ['Tashkent', '🇺🇿', 'Asia/Tashkent', 41.3, 69.24], ['Colombo', '🇱🇰', 'Asia/Colombo', 6.93, 79.86],
    ['Yangon', '🇲🇲', 'Asia/Yangon', 16.84, 96.17], ['Ho Chi Minh City', '🇻🇳', 'Asia/Ho_Chi_Minh', 10.82, 106.63],
    ['Taipei', '🇹🇼', 'Asia/Taipei', 25.03, 121.57], ['Ulaanbaatar', '🇲🇳', 'Asia/Ulaanbaatar', 47.89, 106.91],
    ['Darwin', '🇦🇺', 'Australia/Darwin', -12.46, 130.84], ['Brisbane', '🇦🇺', 'Australia/Brisbane', -27.47, 153.03],
    ['Port Moresby', '🇵🇬', 'Pacific/Port_Moresby', -9.44, 147.18], ['Suva', '🇫🇯', 'Pacific/Fiji', -18.14, 178.44],
    ["Nuku'alofa", '🇹🇴', 'Pacific/Tongatapu', -21.14, -175.2], ['Apia', '🇼🇸', 'Pacific/Apia', -13.83, -171.76],
    ['Easter Island', '🇨🇱', 'Pacific/Easter', -27.11, -109.35], ['Caracas', '🇻🇪', 'America/Caracas', 10.48, -66.9],
    ['Halifax', '🇨🇦', 'America/Halifax', 44.65, -63.58], ['Phoenix', '🇺🇸', 'America/Phoenix', 33.45, -112.07],
    ['Dakar', '🇸🇳', 'Africa/Dakar', 14.72, -17.47], ['Accra', '🇬🇭', 'Africa/Accra', 5.6, -0.19],
    ['Dar es Salaam', '🇹🇿', 'Africa/Dar_es_Salaam', -6.79, 39.21], ['Praia', '🇨🇻', 'Atlantic/Cape_Verde', 14.93, -23.51],
    ['Azores', '🇵🇹', 'Atlantic/Azores', 37.74, -25.67], ['Longyearbyen', '🇳🇴', 'Arctic/Longyearbyen', 78.22, 15.65],
    ['Nuuk', '🇬🇱', 'America/Nuuk', 64.18, -51.72]
  ].map(([name, flag, tz, lat, lon]) => ({ name, flag, tz, lat, lon }));
  const DEFAULT = CITIES.slice(0, 25).map((c) => c.name);
  const byName = new Map(CITIES.map((c) => [c.name, c]));

  let list = Curio.store.get('wc:cities', DEFAULT).filter((n) => byName.has(n));
  let sel = Curio.store.get('wc:sel', 'London');
  let h12 = Curio.store.get('wc:h12', false);
  let shiftMin = 0, playing = false;

  const fmtCache = new Map();
  function parts(tz, ms) {
    let f = fmtCache.get(tz);
    if (!f) {
      f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', weekday: 'short' });
      fmtCache.set(tz, f);
    }
    const o = {};
    for (const p of f.formatToParts(ms)) o[p.type] = p.value;
    const h = +o.hour % 24;
    const off = Math.round((Date.UTC(+o.year, +o.month - 1, +o.day, h, +o.minute, +o.second) - Math.floor(ms / 1000) * 1000) / 60000);
    return { y: +o.year, mo: +o.month, d: +o.day, h, mi: +o.minute, s: +o.second, wd: o.weekday, off };
  }
  const pad = (n) => String(n).padStart(2, '0');
  const timeStr = (p, secs) => {
    if (h12) { const hh = p.h % 12 || 12; return `${hh}:${pad(p.mi)}${secs ? ':' + pad(p.s) : ''} ${p.h < 12 ? 'am' : 'pm'}`; }
    return `${pad(p.h)}:${pad(p.mi)}${secs ? ':' + pad(p.s) : ''}`;
  };
  const offStr = (m) => {
    const sgn = m < 0 ? '-' : '+'; const a = Math.abs(m);
    return `UTC${sgn}${Math.floor(a / 60)}${a % 60 ? ':' + pad(a % 60) : ''}`;
  };

  function sun(ms) {
    const n = ms / 864e5 + 2440587.5 - 2451545.0;
    const L = (280.46 + 0.9856474 * n) % 360;
    const g = ((357.528 + 0.9856003 * n) % 360) * RAD;
    const lam = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD;
    const eps = (23.439 - 0.0000004 * n) * RAD;
    const dec = Math.asin(Math.sin(eps) * Math.sin(lam));
    const ra = Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam)) / RAD;
    const gmst = (18.697374558 + 24.06570982441908 * n) % 24;
    let lon = ra - gmst * 15;
    lon = ((lon + 540) % 360) - 180;
    return { dec, lon };
  }
  const altitude = (s, lat, lon) => Math.asin(Math.sin(lat * RAD) * Math.sin(s.dec) + Math.cos(lat * RAD) * Math.cos(s.dec) * Math.cos((lon - s.lon) * RAD)) / RAD;

  const land = $('land');
  let lh = '<g class="wc-grid">';
  for (let lon = -150; lon <= 150; lon += 30) lh += `<line x1="${X(lon)}" y1="0" x2="${X(lon)}" y2="360"/>`;
  for (let lat = -60; lat <= 60; lat += 30) lh += `<line x1="0" y1="${Y(lat)}" x2="720" y2="${Y(lat)}"/>`;
  lh += '</g><g class="wc-land">';
  const poly = (a) => { let d = ''; for (let i = 0; i < a.length; i += 2) d += (i ? 'L' : 'M') + X(a[i]).toFixed(1) + ' ' + Y(a[i + 1]).toFixed(1); return d + 'Z'; };
  for (const a of window.WC_LAND) lh += `<path d="${poly(a)}"/>`;
  for (const a of window.WC_LAKES) lh += `<path class="lake" d="${poly(a)}"/>`;
  land.innerHTML = lh + '</g>';

  const cv = $('night'), g = cv.getContext('2d');
  const NW = 360, NH = LAT_TOP - LAT_BOT;
  cv.width = NW; cv.height = NH;
  const img = g.createImageData(NW, NH);
  function drawNight(s) {
    const d = img.data;
    const sd = Math.sin(s.dec), cd = Math.cos(s.dec);
    const dark = Curio.isDark();
    const R = dark ? 2 : 8, G = dark ? 4 : 14, B = dark ? 20 : 52, MAX = dark ? 0.72 : 0.6;
    for (let j = 0; j < NH; j++) {
      const lat = (LAT_TOP - j - 0.5) * RAD;
      const a = Math.sin(lat) * sd, b = Math.cos(lat) * cd;
      for (let i = 0; i < NW; i++) {
        const lon = -180 + i + 0.5;
        const h = Math.asin(a + b * Math.cos((lon - s.lon) * RAD)) / RAD;
        let t = (0.8 - h) / 18.8;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        t = t < 0.04 ? t * 4 : 0.16 + (t - 0.04) * 0.875;
        const o = (j * NW + i) * 4;
        d[o] = R; d[o + 1] = G; d[o + 2] = B; d[o + 3] = Math.round(255 * MAX * Math.min(1, t));
      }
    }
    g.putImageData(img, 0, 0);
  }

  const over = $('over');
  function drawOver(s, t) {
    let h = '';
    const sx = X(s.lon), sy = Y(s.dec / RAD);
    h += `<g class="wc-sun" transform="translate(${sx.toFixed(1)} ${sy.toFixed(1)})"><circle r="13" fill="#ffd54f" opacity=".35"/><circle r="7.5" fill="#ffca28" stroke="#ff8f00" stroke-width="1.5"/>`;
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; h += `<line x1="${(Math.cos(a) * 10).toFixed(1)}" y1="${(Math.sin(a) * 10).toFixed(1)}" x2="${(Math.cos(a) * 15).toFixed(1)}" y2="${(Math.sin(a) * 15).toFixed(1)}" stroke="#ff8f00" stroke-width="2" stroke-linecap="round"/>`; }
    h += '</g>';
    let label = '';
    for (const n of list) {
      const c = byName.get(n);
      const night = altitude(s, c.lat, c.lon) < -0.8;
      const isSel = n === sel;
      const x = X(c.lon), y = Y(c.lat);
      h += `<g class="wc-dot${night ? ' night' : ''}${isSel ? ' sel' : ''}" data-n="${n}"><circle class="hit" cx="${x}" cy="${y}" r="9"/>${isSel ? `<circle class="ring" cx="${x}" cy="${y}" r="4"/>` : ''}<circle class="c" cx="${x}" cy="${y}" r="${isSel ? 4.5 : 3.2}"/></g>`;
      if (isSel) {
        const p = parts(c.tz, t);
        const right = x < 560;
        label = `<text class="wc-label" x="${right ? x + 8 : x - 8}" y="${y + 4}" text-anchor="${right ? 'start' : 'end'}">${c.name} ${timeStr(p)}</text>`;
      }
    }
    over.innerHTML = h + label;
  }

  function clockSvg(p, night) {
    const ha = ((p.h % 12) + p.mi / 60) * 30, ma = (p.mi + p.s / 60) * 6;
    const face = night ? '#1f2547' : '#fff8e1', ink = night ? '#e8eaff' : '#3b3631';
    let ticks = '';
    for (let k = 0; k < 12; k++) ticks += `<line x1="0" y1="-19" x2="0" y2="${k % 3 ? -17 : -15.5}" transform="rotate(${k * 30})" stroke="${ink}" stroke-width="${k % 3 ? 1 : 1.8}" stroke-linecap="round"/>`;
    return `<svg viewBox="-24 -24 48 48" aria-hidden="true"><circle r="22.5" fill="${face}" stroke="${night ? '#5c6bc0' : '#ffb300'}" stroke-width="2"/>${ticks}<line x1="0" y1="2" x2="0" y2="-10" stroke="${ink}" stroke-width="3" stroke-linecap="round" transform="rotate(${ha.toFixed(1)})"/><line x1="0" y1="3" x2="0" y2="-16" stroke="${ink}" stroke-width="2" stroke-linecap="round" transform="rotate(${ma.toFixed(1)})"/><line x1="0" y1="4" x2="0" y2="-17" stroke="#ff5a36" stroke-width="1" stroke-linecap="round" transform="rotate(${p.s * 6})"/><circle r="1.8" fill="#ff5a36"/></svg>`;
  }

  const citiesEl = $('cities');
  function buildCards() {
    citiesEl.innerHTML = '';
    for (const n of list) {
      const c = byName.get(n);
      const el = document.createElement('div');
      el.className = 'c-card wc-city';
      el.dataset.n = n;
      el.tabIndex = 0;
      el.setAttribute('role', 'button');
      el.innerHTML = `<span class="wc-clock"></span><div class="wc-txt"><div class="wc-name">${c.flag} ${c.name}</div><div class="wc-time"></div><div class="wc-meta"></div><div class="wc-meta wc-off"></div></div><button class="wc-x" type="button" aria-label="Remove ${c.name}">×</button>`;
      citiesEl.append(el);
    }
    fillSelect();
  }
  function fillSelect() {
    const s = $('addSel');
    const opts = CITIES.filter((c) => !list.includes(c.name)).sort((a, b) => a.name.localeCompare(b.name));
    s.innerHTML = opts.length ? opts.map((c) => `<option value="${c.name}">${c.flag} ${c.name}</option>`).join('') : '<option value="">All cities added</option>';
    $('addBtn').disabled = !opts.length;
  }

  const myTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  function tick() {
    const t = Date.now() + shiftMin * 60000;
    const s = sun(t);
    const me = parts(myTz, t);
    $('myTime').textContent = timeStr(me, true);
    $('myZone').textContent = `${me.wd} · your time (${myTz.replace(/_/g, ' ')}, ${offStr(me.off)})`;
    const myDay = Date.UTC(me.y, me.mo - 1, me.d);
    citiesEl.querySelectorAll('.wc-city').forEach((el) => {
      const c = byName.get(el.dataset.n);
      const p = parts(c.tz, t);
      const alt = altitude(s, c.lat, c.lon);
      const night = alt < -0.8;
      const icon = alt > 0 ? '☀️' : alt > -6 ? '🌇' : alt > -18 ? '🌆' : '🌙';
      const dd = Math.round((Date.UTC(p.y, p.mo - 1, p.d) - myDay) / 864e5);
      const rel = dd === 0 ? 'Today' : dd === 1 ? 'Tomorrow' : dd === -1 ? 'Yesterday' : dd > 0 ? `+${dd} days` : `${dd} days`;
      el.querySelector('.wc-clock').innerHTML = clockSvg(p, night);
      el.querySelector('.wc-time').textContent = timeStr(p);
      el.querySelector('.wc-meta').textContent = `${icon} ${p.wd}, ${rel.toLowerCase()}`;
      el.querySelector('.wc-off').textContent = offStr(p.off);
      el.classList.toggle('sel', el.dataset.n === sel);
      el.style.backgroundImage = `linear-gradient(135deg, ${alt > 0 ? 'rgba(255,200,60,.22)' : alt > -12 ? 'rgba(255,128,60,.22)' : 'rgba(63,81,181,.3)'}, transparent 65%)`;
    });
    drawNight(s);
    drawOver(s, t);
    lastS = s; drawLights(s);
    $('shiftLabel').textContent = shiftMin === 0 ? 'Now' : `${shiftMin > 0 ? '+' : '-'}${Math.floor(Math.abs(shiftMin) / 60)}h${Math.abs(shiftMin) % 60 ? ' ' + pad(Math.abs(shiftMin) % 60) + 'm' : ''}`;
    $('shift').value = Math.max(-1440, Math.min(1440, shiftMin));
  }

  function select(n, beep) {
    sel = n; Curio.store.set('wc:sel', sel);
    if (beep) Curio.beep(700, 0.05, 'triangle', 0.06);
    tick();
  }
  citiesEl.addEventListener('click', (e) => {
    const card = e.target.closest('.wc-city');
    if (!card) return;
    if (e.target.closest('.wc-x')) {
      list = list.filter((n) => n !== card.dataset.n);
      Curio.store.set('wc:cities', list);
      Curio.beep(240, 0.07, 'sine', 0.06);
      buildCards(); tick();
      return;
    }
    select(card.dataset.n, true);
  });
  citiesEl.addEventListener('keydown', (e) => {
    const card = e.target.closest('.wc-city');
    if (card && e.target === card && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); select(card.dataset.n, true); }
  });
  over.addEventListener('click', (e) => {
    const d = e.target.closest('.wc-dot');
    if (!d) return;
    select(d.dataset.n, true);
    citiesEl.querySelector(`.wc-city[data-n="${CSS.escape(d.dataset.n)}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
  $('addBtn').addEventListener('click', () => {
    const n = $('addSel').value;
    if (!n || list.includes(n)) return;
    list.push(n); Curio.store.set('wc:cities', list);
    Curio.beep(880, 0.06, 'triangle', 0.07);
    buildCards(); select(n);
    Curio.toast(`${byName.get(n).name} added`);
    if (list.length >= 30) award('ten');
    paintPlanPick();
  });
  $('restore').addEventListener('click', () => { list = DEFAULT.slice(); Curio.store.set('wc:cities', list); buildCards(); tick(); });
  $('shift').addEventListener('input', (e) => { shiftMin = +e.target.value; tick(); });
  $('back').addEventListener('click', () => { shiftMin = Math.max(-1440, shiftMin - 60); tick(); });
  $('fwd').addEventListener('click', () => { shiftMin = Math.min(1440, shiftMin + 60); tick(); });
  $('reset').addEventListener('click', () => { shiftMin = 0; setPlay(false); tick(); });
  const paintH12 = () => { $('h12').textContent = h12 ? '12 h' : '24 h'; $('h12').setAttribute('aria-pressed', String(h12)); };
  $('h12').addEventListener('click', () => { h12 = !h12; Curio.store.set('wc:h12', h12); paintH12(); tick(); paintPlan(); });
  paintH12();

  let raf = 0, last = 0, spinAcc = 0;
  function setPlay(on) {
    playing = on;
    $('play').textContent = on ? '⏸ Pause' : '▶ Spin the planet';
    $('play').setAttribute('aria-pressed', String(on));
    cancelAnimationFrame(raf);
    if (on) { last = 0; raf = requestAnimationFrame(spin); }
  }
  function spin(ts) {
    if (!playing) return;
    raf = requestAnimationFrame(spin);
    if (document.hidden) { last = 0; return; }
    if (last) {
      shiftMin += (ts - last) / 1000 * 90;
      spinAcc += (ts - last) / 1000 * 90;
      if (spinAcc >= 1440) award('spin');
      if (shiftMin > 1440) shiftMin = -1440;
      shiftMin = Math.round(shiftMin * 100) / 100;
    }
    last = ts;
    const keep = shiftMin;
    shiftMin = Math.round(keep);
    tick();
    shiftMin = keep;
  }
  $('play').addEventListener('click', () => setPlay(!playing));
  addEventListener('curio:theme', tick);

  const buzz = (ms) => { try { if (!Curio.muted && navigator.vibrate) navigator.vibrate(ms); } catch (x) {} };
  const BADGES = [
    { id: 'spin', e: '🌍', name: 'Full rotation', d: 'Spin the planet through a whole day' },
    { id: 'drag', e: '↔️', name: 'Time bender', d: 'Drag the map to move the Sun' },
    { id: 'ten', e: '🗺️', name: 'Globetrotter', d: 'Have 30 clocks on your list' },
    { id: 'plan', e: '🤝', name: 'Organiser', d: 'Find a meeting hour that works for 4 or more cities' },
    { id: 'quiz', e: '🎯', name: 'Zone hopper', d: 'Finish a time zone quiz' },
    { id: 'perfect', e: '🏆', name: 'Human atomic clock', d: 'Get 10 out of 10' },
    { id: 'daily', e: '📅', name: 'Every day', d: 'Play the daily quiz' }
  ];
  const BKEY = 'wc:badges:v1';
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

  const mapEl = $('map');
  let dragStart = 0, dragX = 0, didDrag = false;
  Curio.drag(mapEl, {
    start: (p) => { dragStart = shiftMin; dragX = p.x; didDrag = false; setPlay(false); mapEl.classList.add('grab'); },
    move: (p) => {
      const dx = p.x - dragX;
      if (Math.abs(dx) > 4) didDrag = true;
      if (!didDrag) return;
      shiftMin = Math.round(Math.max(-1440, Math.min(1440, dragStart - dx / mapEl.clientWidth * 1440)));
      tick();
    },
    end: () => { mapEl.classList.remove('grab'); if (didDrag) { award('drag'); Curio.beep(520, 0.05, 'triangle', 0.05); } }
  });
  mapEl.addEventListener('wheel', (e) => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && !e.ctrlKey) { e.preventDefault(); setPlay(false); shiftMin = Math.round(Math.max(-1440, Math.min(1440, shiftMin + e.deltaX * 2))); tick(); } }, { passive: false });

  const PLAN_KEY = 'wc:plan:v1';
  let plan = Curio.store.get(PLAN_KEY, null);
  if (!Array.isArray(plan)) plan = list.slice(0, 4);
  let planCol = null;
  function planCities() { return plan.filter((n) => byName.has(n)); }
  function paintPlanPick() {
    $('planPick').innerHTML = CITIES.filter((c) => list.includes(c.name) || plan.includes(c.name)).map((c) => `<button type="button" data-n="${c.name}" aria-pressed="${plan.includes(c.name)}">${c.flag} ${c.name}</button>`).join('');
  }
  $('planPick').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    const n = b.dataset.n;
    plan = plan.includes(n) ? plan.filter((x) => x !== n) : plan.concat(n).slice(-8);
    Curio.store.set(PLAN_KEY, plan);
    Curio.beep(plan.includes(n) ? 660 : 330, 0.05, 'triangle', 0.05);
    paintPlanPick(); paintPlan();
  });
  function hourClass(h) { return h < 6 || h >= 22 ? 'n' : h < 8 || h >= 19 ? 'e' : h < 9 || h >= 17 ? 'm' : 'w'; }
  function paintPlan() {
    const cs = planCities();
    const me = parts(myTz, Date.now());
    const base = Date.UTC(me.y, me.mo - 1, me.d) - me.off * 60000;
    let h = `<div class="pr head"><span class="pn">Your time</span><div class="ph">${Array.from({ length: 24 }, (_, k) => `<button type="button" data-c="${k}" class="${planCol === k ? 'on' : ''}">${h12 ? (k % 12 || 12) + (k < 12 ? 'a' : 'p') : pad(k)}</button>`).join('')}</div></div>`;
    const good = new Array(24).fill(cs.length > 0);
    const rows = cs.map((n) => {
      const c = byName.get(n);
      const cells = Array.from({ length: 24 }, (_, k) => {
        const p = parts(c.tz, base + k * 3600000);
        const cls = hourClass(p.h);
        if (!(p.h >= 8 && p.h < 19)) good[k] = false;
        return `<i class="${cls}${planCol === k ? ' on' : ''}" title="${c.name} ${timeStr(p)}">${h12 ? (p.h % 12 || 12) : p.h}${p.mi ? '½' : ''}</i>`;
      }).join('');
      return `<div class="pr"><span class="pn">${c.flag} ${c.name}</span><div class="ph">${cells}</div></div>`;
    }).join('');
    const stars = `<div class="pr stars"><span class="pn"></span><div class="ph">${good.map((g2) => `<i>${g2 ? '★' : ''}</i>`).join('')}</div></div>`;
    $('planGrid').innerHTML = h + rows + (cs.length ? stars : '');
    const sum = $('planSum');
    if (!cs.length) { sum.textContent = 'Pick at least one city above.'; return; }
    const nGood = good.filter(Boolean).length;
    if (planCol == null) { sum.textContent = nGood ? `${nGood} hour${nGood > 1 ? 's' : ''} fit everyone's day (8:00 to 19:00). Tap a column to check one.` : 'No hour fits everyone between 8:00 and 19:00. Someone will be up late. Tap a column to see who.'; return; }
    const t = base + planCol * 3600000;
    sum.innerHTML = `<b>${timeStr(parts(myTz, t))} your time:</b> ` + cs.map((n) => { const c = byName.get(n); const p = parts(c.tz, t); const cls = hourClass(p.h); return `<span class="ps ${cls}">${c.flag} ${c.name} ${timeStr(p)}${cls === 'n' ? ' 😴' : ''}</span>`; }).join(' ');
    if (good[planCol] && cs.length >= 4) award('plan');
  }
  $('planGrid').addEventListener('click', (e) => { const b = e.target.closest('[data-c]'); if (!b) return; planCol = Number(b.dataset.c); Curio.beep(500 + planCol * 15, 0.05, 'triangle', 0.05); paintPlan(); });
  paintPlanPick(); paintPlan();
  setInterval(() => { if (!document.hidden) paintPlan(); }, 60000);

  const lc = $('lights'), lg = lc.getContext('2d');
  const LP = [];
  (function buildLights() {
    let seed = 7;
    const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const inPoly = (lon, lat, a) => { let ins = false; for (let i = 0, j = a.length - 2; i < a.length; j = i, i += 2) { const xi = a[i], yi = a[i + 1], xj = a[j], yj = a[j + 1]; if ((yi > lat) !== (yj > lat) && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) ins = !ins; } return ins; };
    for (const c of CITIES) { LP.push([c.lat, c.lon, 1.4, r()]); for (let k = 0; k < 6; k++) LP.push([c.lat + (r() - .5) * 5, c.lon + (r() - .5) * 7, .5 + r() * .5, r()]); }
    let tries = 0;
    while (LP.length < 900 && tries++ < 20000) {
      const lat = -45 + r() * 110, lon = -180 + r() * 360;
      if (window.WC_LAND.some((a) => inPoly(lon, lat, a))) LP.push([lat, lon, .3 + r() * .5, r()]);
    }
  })();
  function drawLights(s) {
    const dpr = Math.min(2, devicePixelRatio || 1);
    const W = lc.clientWidth, H = lc.clientHeight;
    if (lc.width !== Math.round(W * dpr)) { lc.width = Math.round(W * dpr); lc.height = Math.round(H * dpr); }
    lg.setTransform(dpr, 0, 0, dpr, 0, 0);
    lg.clearRect(0, 0, W, H);
    const tw = performance.now() / 700;
    for (const [lat, lon, sz, ph] of LP) {
      if (lat > LAT_TOP || lat < LAT_BOT) continue;
      const alt = altitude(s, lat, lon);
      if (alt > -3) continue;
      const k = Math.min(1, (-3 - alt) / 9);
      const x = X(lon) / 720 * W, y = (Y(lat) - 12) / 290 * H;
      const a = k * (.55 + .45 * Math.sin(tw + ph * 20));
      const rad = sz * 3.2 * (W / 720 + .4);
      const gr = lg.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, `rgba(255,230,150,${(a * .95).toFixed(3)})`);
      gr.addColorStop(.35, `rgba(255,190,90,${(a * .45).toFixed(3)})`);
      gr.addColorStop(1, 'rgba(255,170,60,0)');
      lg.fillStyle = gr;
      lg.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
  }
  let lastS = null;
  (function twinkle() { if (!document.hidden && lastS && !matchMedia('(prefers-reduced-motion: reduce)').matches) drawLights(lastS); setTimeout(() => requestAnimationFrame(twinkle), 120); })();

  function hashStr(str) { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rngF(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let x = Math.imul(a ^ a >>> 15, 1 | a); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; }; }
  const today = new Date();
  const dayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  $('dailyLabel').textContent = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  let qMode = 'classic', openPanel = null;
  const Q = { list: [], i: 0, right: 0, log: [], locked: false };
  document.querySelectorAll('#quizPanel .diff').forEach((b) => b.addEventListener('click', () => { qMode = b.dataset.d; document.querySelectorAll('#quizPanel .diff').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); paintQBest(); Curio.beep(520, 0.06, 'sine', 0.05); }));
  function paintQBest() { const b = Curio.getBest(`q-${qMode}`); $('qBest').textContent = b != null ? `Your best: ${b} out of 10` : 'No score yet'; }
  function closePanels() { $('quizPanel').hidden = true; openPanel = null; document.body.style.overflow = ''; }
  $('quizPanel').addEventListener('click', (e) => { if (e.target === $('quizPanel') || e.target.closest('[data-close]')) closePanels(); });
  function openQuiz() { setPlay(false); openPanel = $('quizPanel'); openPanel.hidden = false; document.body.style.overflow = 'hidden'; $('qStart').hidden = false; $('qPlay').hidden = true; $('qEnd').hidden = true; paintQBest(); openPanel.querySelector('.panel__x').focus(); Curio.beep(330, 0.15, 'sine', 0.05); }
  $('openQuiz').addEventListener('click', openQuiz);
  const hm = (m) => { m = ((m % 1440) + 1440) % 1440; const H = Math.floor(m / 60), M = m % 60; return h12 ? `${H % 12 || 12}:${pad(M)} ${H < 12 ? 'am' : 'pm'}` : `${pad(H)}:${pad(M)}`; };
  $('qGo').addEventListener('click', () => {
    const r = qMode === 'daily' ? rngF(hashStr(`wc-${dayKey}`)) : Math.random;
    const now = Date.now();
    const out = [];
    let guard = 0;
    while (out.length < 10 && guard++ < 500) {
      const a = CITIES[Math.floor(r() * CITIES.length)], b = CITIES[Math.floor(r() * CITIES.length)];
      if (a === b) continue;
      const oa = parts(a.tz, now).off, ob = parts(b.tz, now).off;
      if (oa === ob || out.some((q) => q.a === a && q.b === b)) continue;
      const tA = Math.floor(r() * 48) * 30;
      const ans = tA + ob - oa;
      const ds = [60, -60, 120, -120, 180, -180, 30, -30, 720].filter((d) => d !== 0);
      const opts = [ans];
      while (opts.length < 4) { const d = ds[Math.floor(r() * ds.length)]; const v = ans + d; if (!opts.some((o) => ((o - v) % 1440 + 1440) % 1440 === 0)) opts.push(v); }
      for (let i = 3; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [opts[i], opts[j]] = [opts[j], opts[i]]; }
      out.push({ a, b, tA, ans, opts, diff: ob - oa });
    }
    Object.assign(Q, { list: out, i: 0, right: 0, log: [] });
    $('qStart').hidden = true; $('qEnd').hidden = true; $('qPlay').hidden = false; nextQ();
  });
  function nextQ() {
    if (Q.i >= Q.list.length) return endQ();
    Q.locked = false;
    const q = Q.list[Q.i];
    $('qRound').textContent = `${Q.i + 1}/10`; $('qScore').textContent = Q.right;
    $('qCard').innerHTML = `<div class="qa"><span>${q.a.flag}</span><b>${hm(q.tA)}</b><small></small></div><div class="qarrow">→</div><div class="qa"><span>${q.b.flag}</span><b>?</b><small></small></div>`;
    $('qCard').querySelectorAll('small')[0].textContent = `in ${q.a.name}`;
    $('qCard').querySelectorAll('small')[1].textContent = `in ${q.b.name}`;
    $('qCard').classList.remove('in'); void $('qCard').offsetWidth; $('qCard').classList.add('in');
    $('qOpts').innerHTML = q.opts.map((o, k) => `<button type="button" class="qopt" data-k="${k}"><small>${k + 1}</small> ${hm(o)}</button>`).join('');
    $('qMsg').textContent = 'Using today\'s clocks.';
    $('qNext').hidden = true;
  }
  $('qOpts').addEventListener('click', (e) => {
    const b = e.target.closest('.qopt'); if (!b || Q.locked) return;
    Q.locked = true;
    const q = Q.list[Q.i];
    const pick = q.opts[Number(b.dataset.k)];
    const ok = pick === q.ans;
    $('qOpts').querySelectorAll('.qopt').forEach((x) => { x.disabled = true; if (q.opts[Number(x.dataset.k)] === q.ans) x.classList.add('good'); });
    $('qCard').querySelectorAll('.qa b')[1].textContent = hm(q.ans);
    const d = q.diff, ad = Math.abs(d);
    const dtxt = `${q.b.name} is ${Math.floor(ad / 60)}${ad % 60 ? `:${pad(ad % 60)}` : ''} hour${ad === 60 ? '' : 's'} ${d > 0 ? 'ahead of' : 'behind'} ${q.a.name}`;
    const dayNote = q.tA + d >= 1440 ? ' (the next day)' : q.tA + d < 0 ? ' (the day before)' : '';
    if (ok) { Q.right++; Curio.beep(700 + Q.right * 30, 0.1, 'triangle', 0.07); buzz(12); $('qMsg').textContent = `Yes! ${dtxt}${dayNote}.`; }
    else { b.classList.add('bad'); Curio.beep(170, 0.25, 'sawtooth', 0.05); buzz([30, 20, 30]); $('qMsg').textContent = `It is ${hm(q.ans)}${dayNote}. ${dtxt}.`; }
    Q.log.push(ok ? '🟩' : '🟥');
    $('qScore').textContent = Q.right;
    Q.i++;
    $('qNext').hidden = false; $('qNext').textContent = Q.i >= 10 ? 'See results ›' : 'Next ›';
    $('qNext').focus({ preventScroll: true });
  });
  $('qNext').addEventListener('click', nextQ);
  function endQ() {
    $('qPlay').hidden = true; $('qEnd').hidden = false;
    const b = Curio.best(`q-${qMode}`, Q.right);
    $('qTrophy').innerHTML = clockSvg({ h: 10, mi: 10, s: 0 }, false);
    $('qEndTitle').textContent = Q.right === 10 ? 'A human atomic clock!' : Q.right >= 7 ? 'Well travelled' : Q.right >= 4 ? 'Jet-lagged but getting there' : 'Time zones are chaos';
    $('qeScore').textContent = `${Q.right}/10`; $('qeBest').textContent = b.best;
    award('quiz'); if (Q.right === 10) { award('perfect'); Curio.confetti(); } if (qMode === 'daily') award('daily');
    [523, 659, 784].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.15, 'triangle', 0.07), i * 100));
  }
  $('qAgain').addEventListener('click', () => { $('qEnd').hidden = true; $('qStart').hidden = false; paintQBest(); });
  $('qShare').addEventListener('click', async () => { try { await navigator.clipboard.writeText(`World Clock · What time is it there?${qMode === 'daily' ? ` (daily ${dayKey})` : ''}\n${Q.log.join('')} ${Q.right}/10`); Curio.toast('Copied! 📋'); } catch (x) { Curio.toast('Could not copy, sorry'); } });

  addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape') { closePanels(); return; }
    if (openPanel) { if (!$('qPlay').hidden && /^[1-4]$/.test(e.key)) { const b = $('qOpts').children[Number(e.key) - 1]; if (b && !b.disabled) b.click(); } return; }
    if (e.target.matches('input, select, textarea')) return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); setPlay(false); shiftMin = Math.max(-1440, Math.min(1440, shiftMin + (e.key === 'ArrowLeft' ? -60 : 60))); tick(); }
    else if (e.key === ' ' && !e.target.matches('button')) { e.preventDefault(); setPlay(!playing); }
    else if (e.key === '0') { shiftMin = 0; setPlay(false); tick(); }
    else if (e.key.toLowerCase() === 'q') openQuiz();
  });
  buildCards();
  tick();
  setInterval(() => { if (!document.hidden && !playing) tick(); }, 1000);
  if (!Curio.store.get('wc:padtip', false) && !Curio.touchpad) setTimeout(() => { Curio.toast('Tip: on a touchpad, turn on Touchpad mode in the top bar, then click the map once to grab it and again to let go.', 5200); Curio.store.set('wc:padtip', true); }, 1600);
})();
