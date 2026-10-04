(() => {
  const $ = (id) => document.getElementById(id);
  const DAY = 864e5;
  const fmt = (n, d = 0) => Number(n).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d });
  const longDate = (d) => d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const CNY = '131,219,208,129,216,204,125,213,202,122,210,130,218,206,126,214,203,123,211,201,220,208,128,216,205,124,213,202,123,210,130,217,206,126,214,204,124,211,131,219,208,127,215,205,125,213,202,122,210,129,217,206,127,214,204,124,212,131,218,208,128,215,205,125,213,202,121,209,130,217,206,127,215,203,123,211,131,218,207,128,216,205,125,213,202,220,209,129,217,206,127,215,204,123,210,131,219,207,128,216,205,124,212,201,122,209,129,218,207,126,214,203,123,210,131,219,208,128,216,205,125,212,201,122,210,129,217,207,126,213,202,123,211,131,219,208,128,215,204,124,212,201,122,210,130,217,206,126,214,202,123,211,201,219,208,128,215,204,124,212,202,121,209,129,217,205,126,214,203,123,211,131,219,207,127,215,205,124,212,202,122,209,129,217,206,126,214,203,124,210,130,218,207,127,215,205,125,212,201,121,209'.split(',').map(Number);

  const DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const RHYME = [
    'And the child that is born on the Sabbath day is bonny and blithe, and good and gay.',
    "Monday's child is fair of face.", "Tuesday's child is full of grace.", "Wednesday's child is full of woe.",
    "Thursday's child has far to go.", "Friday's child is loving and giving.", "Saturday's child works hard for a living."
  ];
  const DOW_NOTE = [
    'Sunday births are among the rarest, because fewer planned births are scheduled at weekends.',
    'A Monday baby: you started the week as you mean to go on.',
    'Tuesday is, statistically, one of the most common days to be born.',
    'Midweek arrival. Ignore the rhyme, it was written before therapy.',
    'Thursday: the day named after Thor. Thunderous entrance.',
    'You arrived just in time for the weekend.',
    'Saturday births are rarer, since fewer planned births happen at weekends.'
  ];
  const ZODIAC = [
    ['Capricorn', '♑', 'Earth', [12, 22], [1, 19]], ['Aquarius', '♒', 'Air', [1, 20], [2, 18]], ['Pisces', '♓', 'Water', [2, 19], [3, 20]],
    ['Aries', '♈', 'Fire', [3, 21], [4, 19]], ['Taurus', '♉', 'Earth', [4, 20], [5, 20]], ['Gemini', '♊', 'Air', [5, 21], [6, 20]],
    ['Cancer', '♋', 'Water', [6, 21], [7, 22]], ['Leo', '♌', 'Fire', [7, 23], [8, 22]], ['Virgo', '♍', 'Earth', [8, 23], [9, 22]],
    ['Libra', '♎', 'Air', [9, 23], [10, 22]], ['Scorpio', '♏', 'Water', [10, 23], [11, 21]], ['Sagittarius', '♐', 'Fire', [11, 22], [12, 21]]
  ];
  const ANIMALS = [['Rat', '🐀', 'quick-witted and resourceful'], ['Ox', '🐂', 'diligent and dependable'], ['Tiger', '🐅', 'brave and competitive'], ['Rabbit', '🐇', 'gentle and elegant'], ['Dragon', '🐉', 'confident and ambitious'], ['Snake', '🐍', 'wise and enigmatic'], ['Horse', '🐎', 'energetic and free-spirited'], ['Goat', '🐐', 'calm and creative'], ['Monkey', '🐒', 'clever and curious'], ['Rooster', '🐓', 'observant and hardworking'], ['Dog', '🐕', 'loyal and honest'], ['Pig', '🐖', 'generous and easygoing']];
  const ELEMENTS = ['Wood', 'Wood', 'Fire', 'Fire', 'Earth', 'Earth', 'Metal', 'Metal', 'Water', 'Water'];
  const STONES = [['Garnet', '🔴', 'deep red, for friendship'], ['Amethyst', '🟣', 'purple quartz, once thought to prevent drunkenness'], ['Aquamarine', '🩵', 'sea-blue beryl, the sailor\'s stone'], ['Diamond', '💎', 'the hardest natural material'], ['Emerald', '🟢', 'green beryl, Cleopatra\'s favourite'], ['Pearl', '🦪', 'also alexandrite and moonstone'], ['Ruby', '❤️', 'red corundum, the king of gems'], ['Peridot', '🍏', 'olive-green, sometimes found in meteorites'], ['Sapphire', '🔷', 'blue corundum, the ruby\'s sibling'], ['Opal', '🌈', 'also tourmaline'], ['Topaz', '🟠', 'also citrine'], ['Turquoise', '🩵', 'also tanzanite and zircon']];
  const FLOWERS = [['Carnation and snowdrop', '🌸'], ['Violet and primrose', '🪻'], ['Daffodil', '🌼'], ['Daisy and sweet pea', '🌼'], ['Lily of the valley and hawthorn', '🤍'], ['Rose and honeysuckle', '🌹'], ['Larkspur and water lily', '🪷'], ['Gladiolus and poppy', '🌺'], ['Aster and morning glory', '💜'], ['Marigold and cosmos', '🏵️'], ['Chrysanthemum', '🌼'], ['Narcissus and holly', '🎄']];
  const GENS = [[1901, 1927, 'The Greatest Generation'], [1928, 1945, 'The Silent Generation'], [1946, 1964, 'Baby Boomer'], [1965, 1980, 'Generation X'], [1981, 1996, 'Millennial'], [1997, 2012, 'Generation Z'], [2013, 2024, 'Generation Alpha'], [2025, 2039, 'Generation Beta']];
  const EVENTS = window.BD_EVENTS;
  const FAMOUS = window.BD_FAMOUS;

  function zodiac(m, d) {
    for (const z of ZODIAC) {
      const [, , , [m1, d1], [m2, d2]] = z;
      if ((m === m1 && d >= d1) || (m === m2 && d <= d2)) return z;
    }
    return ZODIAC[0];
  }
  function chinese(y, m, d) {
    let cy = y;
    const idx = y - 1900;
    if (idx >= 0 && idx < CNY.length) {
      const c = CNY[idx];
      if (m * 100 + d < c) cy = y - 1;
    }
    const a = ANIMALS[((cy - 4) % 12 + 12) % 12];
    const e = ELEMENTS[((cy - 4) % 10 + 10) % 10];
    return { cy, a, e, yang: (cy - 4) % 2 === 0, early: cy !== y };
  }
  function moonAt(ms) {
    const syn = 29.530588853;
    const age = (((ms - Date.UTC(2000, 0, 6, 18, 14)) / DAY) % syn + syn) % syn;
    const names = [[1.0, 'New Moon', '🌑'], [6.4, 'Waxing Crescent', '🌒'], [8.4, 'First Quarter', '🌓'], [13.8, 'Waxing Gibbous', '🌔'], [15.8, 'Full Moon', '🌕'], [21.1, 'Waning Gibbous', '🌖'], [23.1, 'Last Quarter', '🌗'], [28.5, 'Waning Crescent', '🌘'], [30, 'New Moon', '🌑']];
    const r = names.find(([lim]) => age < lim);
    return [r[0], r[1], r[2], age];
  }
  function moonSvg(age) {
    const syn = 29.530588853;
    const ph = age / syn;
    const k = Math.cos(ph * 2 * Math.PI);
    const r = 20, rx = Math.abs(k) * r;
    const waxing = ph < 0.5;
    const lit = waxing ? 1 : 0;
    const outer = `M24 4 A20 20 0 0 ${lit} 24 44`;
    const inner = `A${rx.toFixed(2)} 20 0 0 ${k > 0 ? (waxing ? 0 : 1) : (waxing ? 1 : 0)} 24 4`;
    return `<svg class="bd-moon" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="20" fill="#2b2f45"/><path d="${outer} ${inner}Z" fill="#fff6d5"/><circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,.25)"/><circle cx="17" cy="18" r="3" fill="#000" opacity=".08"/><circle cx="29" cy="30" r="4" fill="#000" opacity=".07"/></svg>`;
  }

  function card(ic, label, big, text) {
    return `<div class="c-card bd-card"><div class="bd-ic" aria-hidden="true">${ic}</div><div><small>${label}</small><b>${big}</b><p>${text}</p></div></div>`;
  }

  let birth = null, by = 0, bm = 0, bd = 0, partyDone = false;
  const dob = $('dob');
  const today = new Date();
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  dob.max = iso(today);

  function nextBirthday(now) {
    const ny = now.getFullYear();
    const mk = (y) => {
      const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
      return bm === 2 && bd === 29 && !leap ? new Date(y, 1, 28) : new Date(y, bm - 1, bd);
    };
    const t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let nb = mk(ny);
    if (nb < t0) nb = mk(ny + 1);
    let pb = mk(nb.getFullYear() - 1);
    return { nb, pb, isToday: nb.getTime() === t0.getTime() };
  }

  function build() {
    const b = new Date(by, bm - 1, bd);
    const dow = b.getDay();
    $('dow').textContent = DOW[dow];
    $('rhyme').textContent = `"${RHYME[dow]}"`;
    const z = zodiac(bm, bd);
    const c = chinese(by, bm, bd);
    const st = STONES[bm - 1], fl = FLOWERS[bm - 1];
    const gen = GENS.find(([a, z2]) => by >= a && by <= z2);
    const moon = moonAt(Date.UTC(by, bm - 1, bd, 12));
    const doy = Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(by, 0, 1)) / DAY) + 1;
    const leapYear = (by % 4 === 0 && by % 100 !== 0) || by % 400 === 0;
    $('cards').innerHTML = [
      card(z[1], 'Star sign', z[0], `${/^[AE]/.test(z[2]) ? 'An' : 'A'} ${z[2].toLowerCase()} sign, for ${ZODIAC.indexOf(z) === 0 ? '22 Dec to 19 Jan' : `${z[3][1]} ${monthShort(z[3][0])} to ${z[4][1]} ${monthShort(z[4][0])}`}.`),
      card(c.a[1], 'Chinese zodiac', `${c.e} ${c.a[0]}`, `${c.yang ? 'Yang' : 'Yin'}, ${c.a[2]}.${c.early ? ` Born before Chinese New Year, so you belong to ${c.cy}.` : ''}`),
      card(st[1], 'Birthstone', st[0], st[2][0].toUpperCase() + st[2].slice(1) + '.'),
      card(fl[1], 'Birth flower', fl[0], `The traditional flower${fl[0].includes(' and ') ? 's' : ''} of ${monthLong(bm)}.`),
      card(moonSvg(moon[3]), 'The Moon that night', moon[1], `About ${Math.round(moon[3])} days into its cycle, ${Math.round((1 - Math.cos(moon[3] / 29.530588853 * 2 * Math.PI)) * 50)}% lit.`),
      card('📆', 'Day of the year', `Day ${doy}`, `of ${leapYear ? 366 : 365}${leapYear ? ', in a leap year' : ''}. ${DOW_NOTE[dow]}`),
      gen ? card('👥', 'Generation', gen[2], `Born ${gen[0]} to ${gen[1]}, by the usual definitions.`) : '',
      card('🌍', 'World population', `${popAt(by)} billion`, `Roughly how many people were alive in ${by}. There are about 8.2 billion now.`),
      card('🎂', 'Birthday sharers', 'about 22 million', `People alive today who share your ${bm === 2 && bd === 29 ? 'leap day birthday: only about 5 million' : 'birthday'}, give or take.`)
    ].join('');

    const rows = EVENTS.map(([y, mo, t]) => `<tr class="${y === by ? 'me' : y < by ? 'pre' : ''}" data-y="${y}"><td>${y}</td><td>${mo}</td><td>${t}</td></tr>`).join('');
    $('table').innerHTML = rows;
    const ev = EVENTS.find((e) => e[0] === by);
    if (ev) $('yearCard').innerHTML = `<b>🗞️ ${by}: ${ev[2]}</b><p>That was the big story of your birth year (${ev[1]}). Your row is highlighted below. The faded years happened before you were born.</p>`;
    else if (by < 1900) $('yearCard').innerHTML = `<b>🗞️ You were born before 1900</b><p>Our timeline starts in 1900, so you've lived through every single event below. Impressive.</p>`;
    else $('yearCard').innerHTML = `<b>🗞️ You were born in ${by}</b><p>Our timeline runs to 2024, so you're newer than every event below. Welcome!</p>`;
    requestAnimationFrame(() => {
      const wrap = $('tableWrap');
      const row = wrap.querySelector(`tr[data-y="${by}"]`);
      wrap.scrollTop = row ? row.offsetTop - wrap.clientHeight / 2 + row.offsetHeight / 2 : by > 2024 ? wrap.scrollHeight : 0;
    });
    buildMiles();
    buildWeekdays();
    buildPlanets();
    buildTwins();
    buildCake(true);
    $('bigDate').textContent = longDate(b);
  }

  function buildWeekdays() {
    const out = [];
    const now = new Date();
    for (let k = 0; k < 8; k++) {
      const y = now.getFullYear() + k;
      const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
      const d = bm === 2 && bd === 29 && !leap ? new Date(y, 1, 28) : new Date(y, bm - 1, bd);
      if (d < new Date(now.getFullYear(), now.getMonth(), now.getDate())) continue;
      const wd = d.getDay();
      out.push(`<div class="${wd === 0 || wd === 6 ? 'we' : ''}"><b>${DOW[wd].slice(0, 3)}</b><span>${y}</span></div>`);
      if (out.length >= 6) break;
    }
    $('weekdays').innerHTML = `<small>Your next birthdays fall on</small><div class="bd-wd">${out.join('')}</div>`;
  }

  const PLANETS = [
    ['Mercury', 87.969, '#b0a597', 4], ['Venus', 224.701, '#e8c27a', 6], ['Earth', 365.256, '#4f8fe0', 6.5], ['Mars', 686.98, '#d9603b', 5],
    ['Jupiter', 4332.59, '#d7a77a', 11], ['Saturn', 10759.22, '#e5cf8f', 9.5], ['Uranus', 30688.5, '#8fd6e0', 8], ['Neptune', 60182, '#4a6fe0', 8]
  ];
  function buildPlanets() {
    const days = (Date.now() - birth) / DAY;
    const svg = $('orbits');
    let g = '<defs><radialGradient id="bdSun"><stop offset="0" stop-color="#fff59d"/><stop offset=".6" stop-color="#ffb300"/><stop offset="1" stop-color="#ff6f00" stop-opacity="0"/></radialGradient></defs><circle cx="200" cy="200" r="34" fill="url(#bdSun)"/><circle cx="200" cy="200" r="15" fill="#ffca28"/>';
    PLANETS.forEach(([n, p, col, r], i) => {
      const R = 34 + i * 21;
      const a = ((days / p) % 1) * Math.PI * 2 - Math.PI / 2;
      const x = 200 + Math.cos(a) * R, y = 200 + Math.sin(a) * R;
      g += `<circle cx="200" cy="200" r="${R}" fill="none" stroke="currentColor" stroke-opacity=".16" stroke-dasharray="${n === 'Earth' ? '0' : '2 4'}"/>`;
      if (n === 'Saturn') g += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${r * 1.7}" ry="${r * 0.55}" fill="none" stroke="#c9b27a" stroke-width="2"/>`;
      g += `<circle class="bd-pl" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${col}"><title>${n}</title></circle>`;
    });
    svg.innerHTML = g;
    $('plist').innerHTML = PLANETS.map(([n, p, col]) => {
      const age = days / p;
      const next = Math.ceil(age + 1e-9) - age;
      const nd = new Date(Date.now() + next * p * DAY);
      return `<div class="bd-p"><i style="background:${col}"></i><div><b>${n}</b><small>${age >= 100 ? fmt(age) : age.toFixed(age < 1 ? 3 : 2)} ${n === 'Earth' ? 'years' : `${n} years`}</small></div><span>Next ${n} birthday<br><em>${nd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</em></span></div>`;
    }).join('');
  }

  function buildLife() {
    const days = (Date.now() - birth) / DAY;
    const min = days * 1440;
    const awake = min * (2 / 3);
    const rows = [
      ['💓', fmt(min * 80), 'heartbeats', 'at around 80 a minute'],
      ['🌬️', fmt(min * 15), 'breaths', 'about 15 a minute'],
      ['😴', fmt(days / 3 / 365.2425, 1), 'years asleep', 'roughly a third of your life'],
      ['👁️', fmt(awake * 15), 'blinks', 'about 15 a minute while awake'],
      ['🌅', fmt(Math.floor(days)), 'sunrises', 'one for every day you have been around'],
      ['🌕', fmt(Math.floor(days / 29.530588853)), 'full moons', 'one every 29.5 days'],
      ['🌍', fmt(days * 2.57e6, 0), 'km around the Sun', 'Earth travels about 2.57 million km a day'],
      ['💇', fmt(days * 0.035, 1), 'cm of hair grown', 'about 1 cm a month, if you never cut it'],
      ['🍽️', fmt(Math.floor(days * 3)), 'meals', 'give or take a skipped breakfast']
    ];
    const el = $('life');
    if (el.children.length !== rows.length) el.innerHTML = rows.map(([e, , u, n]) => `<div><span class="e">${e}</span><b></b><span class="u">${u}</span><small>${n}</small></div>`).join('');
    rows.forEach(([, v], i) => { const b = el.children[i].querySelector('b'); if (b.textContent !== v) b.textContent = v; });
  }

  function buildTwins() {
    const same = FAMOUS.filter(([m, d]) => m === bm && d === bd);
    const doyOf = (m, d) => Math.round((Date.UTC(2000, m - 1, d) - Date.UTC(2000, 0, 1)) / DAY);
    const me = doyOf(bm, bd);
    const near = FAMOUS.filter(([m, d]) => !(m === bm && d === bd)).map((f) => { let dd = doyOf(f[0], f[1]) - me; if (dd > 183) dd -= 366; if (dd < -183) dd += 366; return [f, dd]; }).sort((a, b) => Math.abs(a[1]) - Math.abs(b[1])).slice(0, same.length ? 3 : 5);
    const tile = (f, label) => `<div class="bd-twin${label ? '' : ' exact'}"><span class="e">${f[5]}</span><div><b>${f[3]}</b><small>${f[4]}, born ${f[1]} ${monthLong(f[0])} ${f[2]}</small>${label ? `<em>${label}</em>` : '<em class="hot">Same birthday!</em>'}</div></div>`;
    $('twins').innerHTML = (same.length ? '' : '<p class="bd-twin-none">No one on our list shares your exact birthday, so you are officially an original. Your closest neighbours:</p>') +
      same.map((f) => tile(f)).join('') +
      near.map(([f, dd]) => tile(f, `${Math.abs(dd)} day${Math.abs(dd) === 1 ? '' : 's'} ${dd < 0 ? 'before' : 'after'} you`)).join('');
  }

  let flames = [], cakeT = 0, blowing = false, blowStart = 0;
  function buildCake(reset) {
    const now = new Date();
    let age = now.getFullYear() - by;
    if (now.getMonth() + 1 < bm || (now.getMonth() + 1 === bm && now.getDate() < bd)) age--;
    age = Math.max(0, age);
    const n = Math.max(1, Math.min(age, 60));
    const svg = $('cake');
    const cols = ['#ef5350', '#42a5f5', '#ffca28', '#66bb6a', '#ab47bc', '#ff7043', '#26c6da'];
    let s2 = '<defs><linearGradient id="bdC1" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#f8bbd0"/><stop offset="1" stop-color="#ec407a"/></linearGradient><linearGradient id="bdC2" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff8e1"/><stop offset="1" stop-color="#ffe082"/></linearGradient><radialGradient id="bdG"><stop offset="0" stop-color="#fff59d" stop-opacity=".85"/><stop offset="1" stop-color="#fff59d" stop-opacity="0"/></radialGradient></defs>';
    s2 += '<ellipse cx="200" cy="246" rx="170" ry="12" fill="#000" opacity=".1"/><ellipse cx="200" cy="236" rx="168" ry="16" fill="#e0e0e0"/><ellipse cx="200" cy="232" rx="160" ry="13" fill="#fafafa"/>';
    s2 += '<rect x="56" y="160" width="288" height="72" rx="16" fill="url(#bdC1)"/><rect x="86" y="112" width="228" height="56" rx="14" fill="url(#bdC2)"/>';
    let drip = 'M56 172'; for (let x = 56; x < 344; x += 24) drip += ` q12 ${14 + ((x / 24) % 3) * 4} 24 0`;
    s2 += `<path d="${drip} V164 H56Z" fill="#fff" opacity=".9"/>`;
    let drip2 = 'M86 122'; for (let x = 86; x < 314; x += 19) drip2 += ` q9.5 ${10 + ((x / 19) % 2) * 5} 19 0`;
    s2 += `<path d="${drip2} V116 H86Z" fill="#ec407a" opacity=".85"/>`;
    for (let k = 0; k < 18; k++) s2 += `<rect x="${70 + (k * 53) % 260}" y="${186 + (k * 17) % 36}" width="7" height="3" rx="1.5" fill="${cols[k % cols.length]}" transform="rotate(${(k * 47) % 180} ${73 + (k * 53) % 260} ${187 + (k * 17) % 36})"/>`;
    flames = [];
    const perRow = n <= 12 ? n : Math.ceil(n / Math.ceil(n / 14));
    const rowsN = Math.ceil(n / perRow);
    let c = 0;
    for (let r = 0; r < rowsN; r++) {
      const inRow = Math.min(perRow, n - c);
      const depth = rowsN - 1 - r;
      const w = Math.min(200, inRow * 26) - depth * 16, x0 = 200 - w / 2;
      for (let k = 0; k < inRow; k++, c++) {
        const x = inRow === 1 ? 200 : x0 + (w * k) / (inRow - 1);
        const yb = 120 - depth * 7, h = 30;
        const cx = x + (depth % 2 ? 6 : 0);
        s2 += `<rect x="${cx - 3.5}" y="${yb - h}" width="7" height="${h}" rx="2.5" fill="${cols[c % cols.length]}"/><path d="M${cx - 3.5} ${yb - h + 6}l7 -4M${cx - 3.5} ${yb - h + 14}l7 -4M${cx - 3.5} ${yb - h + 22}l7 -4" stroke="#fff" stroke-opacity=".6" stroke-width="2"/>`;
        s2 += `<g class="bd-flame" data-i="${c}"><circle cx="${cx}" cy="${yb - h - 8}" r="11" fill="url(#bdG)"/><path d="M${cx} ${yb - h - 18} q6 8 0 14 q-6 -6 0 -14z" fill="#ff9800"/><path d="M${cx} ${yb - h - 12} q3 4 0 7 q-3 -3 0 -7z" fill="#fff59d"/></g><g class="bd-smoke" data-i="${c}" opacity="0"><path d="M${cx} ${yb - h - 4} q-5 -8 0 -16 q5 -8 0 -16" stroke="#9e9e9e" stroke-width="2.5" fill="none" stroke-linecap="round"/></g>`;
        flames.push({ lit: 1 });
      }
    }
    if (age > 60) s2 += `<text x="200" y="208" text-anchor="middle" font-size="22" font-weight="900" fill="#fff">${age} (we ran out of room)</text>`;
    else s2 += `<text x="200" y="210" text-anchor="middle" font-size="30" font-weight="900" fill="#fff" opacity=".95">${age}</text>`;
    svg.innerHTML = s2;
    if (reset) $('cakeText').textContent = `${n} candle${n === 1 ? '' : 's'}. Press and hold the button, the cake or Space to blow them out. In Touchpad mode, click once to start and again to stop.`;
    const bst = Curio.store.get('bday:blowBest', null);
    $('cakeBest').textContent = bst ? `Personal best: ${bst.toFixed(2)}s for a full cake` : '';
  }
  function blowTick() {
    if (!blowing) return;
    const lit = flames.filter((f) => f.lit > 0);
    const svg = $('cake');
    const strength = Math.min(1, (performance.now() - blowStart) / 900);
    lit.forEach((f, i) => {
      if (Math.random() < 0.012 + strength * 0.045) {
        f.lit = 0;
        const idx = flames.indexOf(f);
        svg.querySelector(`.bd-flame[data-i="${idx}"]`)?.classList.add('out');
        const sm = svg.querySelector(`.bd-smoke[data-i="${idx}"]`);
        if (sm) { sm.classList.remove('puff'); void sm.getBoundingClientRect(); sm.classList.add('puff'); }
        Curio.beep(1200 + Math.random() * 400, 0.03, 'sine', 0.02);
      }
    });
    svg.querySelectorAll('.bd-flame:not(.out)').forEach((g) => { g.style.transform = `skewX(${-10 - strength * 25}deg)`; });
    const left = flames.filter((f) => f.lit > 0).length;
    if (!left) {
      blowing = false;
      const t = (performance.now() - blowStart) / 1000;
      const r = Curio.best('bday:blowBest', t, false);
      Curio.store.set('bday:blowBest', r.best);
      $('cakeText').textContent = `All out in ${t.toFixed(2)} seconds! ${r.isNew ? 'A new record. ' : ''}Make a wish. We promise not to peek.`;
      Curio.confetti(150);
      [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.18, 'triangle', 0.08), i * 120));
      try { navigator.vibrate?.([30, 60, 30]); } catch (e) { }
      buildCake(false);
      $('cake').querySelectorAll('.bd-flame').forEach((g) => g.classList.add('out'));
      flames.forEach((f) => { f.lit = 0; });
      return;
    }
    $('cakeText').textContent = `${left} candle${left === 1 ? '' : 's'} left. Keep blowing!`;
    cakeT = requestAnimationFrame(blowTick);
  }
  function startBlow(e) {
    if (e) e.preventDefault();
    if (blowing || !flames.some((f) => f.lit > 0)) return;
    blowing = true; blowStart = performance.now();
    $('blow').classList.add('is-on');
    const ac = !Curio.muted && Curio.audioContext && Curio.audioContext();
    if (ac) {
      const len = ac.sampleRate * 1.5, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
      const src = ac.createBufferSource(); src.buffer = buf;
      const fl = ac.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = 900; fl.Q.value = 0.4;
      const g = ac.createGain(); g.gain.setValueAtTime(0.0001, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.15, ac.currentTime + 0.15); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 1.4);
      src.connect(fl).connect(g).connect(ac.destination); src.start(); src.stop(ac.currentTime + 1.5);
    }
    blowTick();
  }
  function stopBlow() {
    if (!blowing) return;
    blowing = false;
    cancelAnimationFrame(cakeT);
    $('blow').classList.remove('is-on');
    $('cake').querySelectorAll('.bd-flame').forEach((g) => { g.style.transform = ''; });
    const left = flames.filter((f) => f.lit > 0).length;
    if (left) $('cakeText').textContent = `Out of breath! ${left} candle${left === 1 ? '' : 's'} still burning. Take a big breath and go again.`;
  }
  ['blow', 'cake'].forEach((id) => {
    Curio.drag($(id), { start: (p) => { p.event?.preventDefault?.(); startBlow(); if (Curio.touchpad) $('cakeText').textContent = 'Blowing! Click again to take a breath.'; }, end: () => stopBlow() });
  });
  if (!Curio.store.get('bday:tptip', false)) { Curio.store.set('bday:tptip', true); Curio.toast('Tip: on a touchpad, turn on Touchpad mode in the top bar to blow candles with a click instead of holding.', 4500); }
  $('blow').addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) startBlow(e); });
  $('blow').addEventListener('keyup', stopBlow);
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Space' || e.repeat || !birth || /INPUT|BUTTON|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    const r = $('cake').getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    startBlow(e);
  });
  window.addEventListener('keyup', (e) => { if (e.code === 'Space') stopBlow(); });
  $('relight').addEventListener('click', () => { buildCake(true); Curio.beep(500, 0.08, 'triangle', 0.06); });

  function compareFriend() {
    const v = $('fdob').value;
    const name = ($('fname').value.trim() || 'Your friend').slice(0, 24);
    const [y, m, d] = v.split('-').map(Number);
    const t = new Date(y, m - 1, d);
    if (!y || isNaN(t) || t > new Date() || y < 1900) { Curio.toast('Pick a real birthday for your friend'); return; }
    Curio.store.set('bday:friend', { name, v });
    const fb = t.getTime();
    const diff = Math.round((fb - birth) / DAY);
    const esc = (x) => x.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const nm = esc(name);
    const older = diff > 0 ? 'You are' : diff < 0 ? `${nm} is` : 'You are both';
    const yz = zodiac(bm, bd), fz = zodiac(m, d);
    const pair = [yz[2], fz[2]].sort().join('+');
    const comp = { 'Fire+Fire': 'Two fires: fun, loud, occasionally on fire.', 'Air+Fire': 'Air feeds fire. Expect big ideas and bigger plans.', 'Earth+Fire': 'One builds, one burns. A great team if someone holds the extinguisher.', 'Fire+Water': 'Steamy. Lots of feelings, lots of energy.', 'Air+Air': 'Endless conversation. Nobody remembers to eat.', 'Air+Earth': 'Dreamer meets planner. Very productive, slightly confused.', 'Air+Water': 'Thoughts meet feelings. Good at long talks at 2am.', 'Earth+Earth': 'Solid as a rock. Possibly literally.', 'Earth+Water': 'Things grow here. A gardening duo.', 'Water+Water': 'Deep, intuitive, and very good at sharing snacks.' }[pair];
    const younger = Math.min(birth, fb), olderMs = Math.max(birth, fb);
    const gap = olderMs - younger;
    const doubleDay = new Date(olderMs + gap);
    const bothDays = Math.floor((Date.now() - younger) / DAY) + Math.floor((Date.now() - olderMs) / DAY);
    const together = new Date(younger + Math.max(0, (100 * 365.2425 * DAY - (Date.now() - younger) - (Date.now() - olderMs)) / 2 + (Date.now() - younger)));
    $('fout').innerHTML = `<div class="bd-fgrid">
      <div><span class="e">⚖️</span><b>${diff === 0 ? 'Born the same day!' : `${older} older by ${fmt(Math.abs(diff))} day${Math.abs(diff) === 1 ? '' : 's'}`}</b><small>${diff === 0 ? 'Actual twins, or a cosmic coincidence.' : `That is ${(Math.abs(diff) / 365.2425).toFixed(1)} years.`}</small></div>
      <div><span class="e">${yz[1]}${fz[1]}</span><b>${yz[0]} + ${fz[0]}</b><small>${comp}</small></div>
      <div><span class="e">➕</span><b>${fmt(bothDays)} days</b><small>Your combined age. That's ${(bothDays / 365.2425).toFixed(1)} years of experience.</small></div>
      <div><span class="e">💯</span><b>${together.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</b><small>The day your ages add up to 100 years.</small></div>
      ${diff !== 0 ? `<div><span class="e">✌️</span><b>${doubleDay < new Date() ? 'Already happened' : longDate(doubleDay)}</b><small>The day the elder of you was exactly twice as old as the younger.</small></div>` : ''}
      <div><span class="e">📅</span><b>${DOW[t.getDay()]}</b><small>The day ${nm} was born. ${t.getDay() === new Date(birth).getDay() ? 'Same as you!' : `You were a ${DOW[new Date(birth).getDay()]}.`}</small></div>
    </div>`;
    Curio.beep(660, 0.08, 'triangle', 0.07);
  }
  $('fform').addEventListener('submit', (e) => { e.preventDefault(); compareFriend(); });

  $('share').addEventListener('click', async () => {
    const z = zodiac(bm, bd), c = chinese(by, bm, bd);
    const txt = `🎂 I was born on a ${DOW[new Date(birth).getDay()]} ${z[1]} ${z[0]}, ${c.e} ${c.a[0]} ${c.a[1]}, under a ${moonAt(Date.UTC(by, bm - 1, bd, 12))[1]}. I'm ${fmt(Math.floor((Date.now() - birth) / DAY))} days old and ${((Date.now() - birth) / DAY / 4332.59).toFixed(2)} on Jupiter. Find yours on Zoble: Your Birthday`;
    try { await navigator.clipboard.writeText(txt); Curio.toast('Copied! Paste it anywhere.'); } catch (e) { Curio.toast(txt, 5000); }
  });
  const monthShort = (m) => new Date(2000, m - 1, 1).toLocaleDateString('en-GB', { month: 'short' });
  const monthLong = (m) => new Date(2000, m - 1, 1).toLocaleDateString('en-GB', { month: 'long' });
  const POP = [[1900, 1.65], [1910, 1.75], [1920, 1.86], [1930, 2.07], [1940, 2.3], [1950, 2.5], [1960, 3.02], [1970, 3.7], [1980, 4.44], [1990, 5.32], [2000, 6.15], [2010, 6.99], [2020, 7.84], [2025, 8.19], [2030, 8.5]];
  function popAt(y) {
    for (let i = 1; i < POP.length; i++) if (y <= POP[i][0]) { const [x0, v0] = POP[i - 1], [x1, v1] = POP[i]; return (v0 + (v1 - v0) * (y - x0) / (x1 - x0)).toFixed(1); }
    return '8.2';
  }

  function buildMiles() {
    const b = birth;
    const add = (ms) => new Date(b + ms);
    const list = [
      ['1 million minutes old', add(1e6 * 6e4)], ['10,000 days old', add(1e4 * DAY)], ['500 million seconds old', add(5e8 * 1e3)],
      ['100,000 hours old', add(1e5 * 36e5)], ['1,000 weeks old', add(1e3 * 7 * DAY)], ['20,000 days old', add(2e4 * DAY)],
      ['1 billion seconds old', add(1e9 * 1e3)], ['10 years old on Mars', add(10 * 686.98 * DAY)], ['1 year old on Jupiter', add(4332.59 * DAY)],
      ['500,000 hours old', add(5e5 * 36e5)], ['30,000 days old', add(3e4 * DAY)], ['2 billion seconds old', add(2e9 * 1e3)],
      ['1,000 months old', new Date(by, bm - 1 + 1000, bd)]
    ].sort((a, c) => a[1] - c[1]);
    const now = Date.now();
    const soonIdx = list.findIndex((x) => x[1].getTime() > now);
    $('miles').innerHTML = list.map(([t, d], i) => `<li class="${d.getTime() < now ? 'past' : i === soonIdx ? 'soon' : ''}"><b>${i === soonIdx ? '👉 ' : d.getTime() < now ? '✅ ' : ''}${t}</b><span>${longDate(d)}</span></li>`).join('');
  }

  function update() {
    if (!birth) return;
    const now = new Date();
    const ms = now - birth;
    const { nb, pb, isToday } = nextBirthday(now);
    const age = nb.getFullYear() - by;
    if (isToday) {
      $('nextDays').textContent = '🎉 Today!';
      $('nextText').textContent = `Happy birthday! You're ${age} today.`;
      $('nextBar').style.width = '100%';
      $('nextPct').textContent = '';
      if (!partyDone) { partyDone = true; Curio.confetti(160); Curio.beep(784, 0.15, 'triangle', 0.08); setTimeout(() => Curio.beep(1046, 0.25, 'triangle', 0.08), 160); }
    } else {
      const t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const days = Math.round((nb - t0) / DAY);
      $('nextDays').textContent = `${days} day${days === 1 ? '' : 's'}`;
      $('nextText').textContent = `until you turn ${age}, on ${longDate(nb)}.${bm === 2 && bd === 29 && nb.getDate() === 28 ? ' (Not a leap year, so most leaplings celebrate on the 28th.)' : ''}`;
      const pct = Math.max(0, Math.min(100, (now - pb) / (nb - pb) * 100));
      $('nextBar').style.width = pct.toFixed(1) + '%';
      $('nextPct').textContent = `${pct.toFixed(1)}% of the way through your ${ordinal(age - 1)} year`;
    }
    let months = (now.getFullYear() - by) * 12 + now.getMonth() - (bm - 1);
    if (now.getDate() < bd) months--;
    const years = Math.floor(months / 12);
    const exact = ms / (365.2425 * DAY);
    const units = [
      [fmt(years), 'years'], [exact.toFixed(7), 'years, exactly'], [fmt(months), 'months'], [fmt(Math.floor(ms / (7 * DAY))), 'weeks'],
      [fmt(Math.floor(ms / DAY)), 'days'], [fmt(Math.floor(ms / 36e5)), 'hours'], [fmt(Math.floor(ms / 6e4)), 'minutes'], [fmt(Math.floor(ms / 1e3)), 'seconds']
    ];
    const el = $('ages');
    if (!el.children.length) el.innerHTML = units.map(([, u]) => `<div><b></b><span>${u}</span></div>`).join('');
    units.forEach(([v], i) => { const b = el.children[i].firstChild; if (b.textContent !== v) b.textContent = v; });
    buildLife();
  }
  const ordinal = (n) => { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };

  function start(value, fresh) {
    const [y, m, d] = value.split('-').map(Number);
    const t = new Date(y, m - 1, d);
    if (!y || isNaN(t) || t > new Date() || y < 1900 || t.getDate() !== d) { Curio.toast('That birthday looks a bit unlikely'); return; }
    by = y; bm = m; bd = d; birth = t.getTime(); partyDone = false;
    Curio.store.set('bday:dob', value);
    $('empty').hidden = true; $('out').hidden = false;
    $('ages').innerHTML = '';
    build(); update();
    if (fresh) { Curio.beep(660, 0.08, 'triangle', 0.08); setTimeout(() => Curio.beep(880, 0.1, 'triangle', 0.08), 90); $('out').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    $('out').classList.remove('bd-reveal'); void $('out').offsetWidth; $('out').classList.add('bd-reveal');
  }
  $('form').addEventListener('submit', (e) => { e.preventDefault(); if (dob.value) start(dob.value, true); });
  dob.addEventListener('change', () => { if (dob.value && dob.value.length === 10 && +dob.value.slice(0, 4) >= 1900) start(dob.value, false); });
  const saved = Curio.store.get('bday:dob', null);
  if (saved) { dob.value = saved; start(saved, false); }
  const fr = Curio.store.get('bday:friend', null);
  if (fr && typeof fr.v === 'string') { $('fname').value = fr.name || ''; $('fdob').value = fr.v; if (birth) compareFriend(); }
  $('fdob').max = iso(today);
  setInterval(() => { if (!document.hidden) update(); }, 1000);
})();
