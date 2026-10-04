(() => {
  const D = window.LS_DATA;
  const YEAR_MS = 365.2425 * 864e5, DAY = 864e5;
  const $ = (id) => document.getElementById(id);
  const n0 = (n) => Math.floor(n).toLocaleString('en-US');
  const n1 = (n, d = 1) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const big = (n) => {
    const a = Math.abs(n);
    if (a >= 1e12) return n1(n / 1e12, 3) + ' trillion';
    if (a >= 1e9) return n1(n / 1e9, 3) + ' billion';
    return n0(n);
  };
  const pad = (x) => String(x).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const dob = $('dob'), tob = $('tob');
  dob.max = iso(new Date());

  const saved = Curio.store.get('ls:save', null);
  const S = { v: 2, badges: [], tabs: [], exp: 73, visits: [], tab: 'body' };
  if (saved && saved.v === 2) Object.assign(S, saved);
  ['badges', 'tabs', 'visits'].forEach((k) => { if (!Array.isArray(S[k])) S[k] = []; });
  S.exp = Math.max(60, Math.min(100, S.exp | 0 || 73));
  const today = iso(new Date());
  if (!S.visits.includes(today)) { S.visits.push(today); S.visits = S.visits.slice(-30); }
  const save = () => Curio.store.set('ls:save', S);
  save();

  const interp = (tbl, y) => {
    if (y <= tbl[0][0]) return tbl[0][1];
    for (let i = 1; i < tbl.length; i++) if (y <= tbl[i][0]) { const [x0, v0] = tbl[i - 1], [x1, v1] = tbl[i]; return v0 + (v1 - v0) * (y - x0) / (x1 - x0); }
    return tbl[tbl.length - 1][1];
  };
  const yearFrac = (t) => { const d = new Date(t); const y = d.getFullYear(); const a = new Date(y, 0, 1).getTime(); return y + (t - a) / (new Date(y + 1, 0, 1).getTime() - a); };
  function bornBetween(t0, t1) {
    let sum = 0; const step = YEAR_MS / 12;
    for (let t = t0; t < t1; t += step) { const dt = Math.min(step, t1 - t); sum += interp(D.births, yearFrac(t + dt / 2)) * 1e6 * dt / YEAR_MS; }
    return sum;
  }
  const popNow = (t) => 8.2e9 + 70e6 * (t - Date.UTC(2025, 6, 1)) / YEAR_MS;
  const popAt = (t) => { const y = yearFrac(t); return y >= 2025 ? popNow(t) : interp(D.pop, y) * 1e9; };

  let birth = null;
  const ISS = Date.UTC(1998, 10, 20);
  const OLYMPICS = []; for (let y = 1896; y <= 2032; y += 4) if (![1916, 1940, 1944, 2020].includes(y)) OLYMPICS.push(Date.UTC(y, 6, 25)); OLYMPICS.push(Date.UTC(2021, 6, 23));
  const WORLDCUPS = [1930, 1934, 1938, 1950, 1954, 1958, 1962, 1966, 1970, 1974, 1978, 1982, 1986, 1990, 1994, 1998, 2002, 2006, 2010, 2014, 2018].map((y) => Date.UTC(y, 5, 15)).concat([Date.UTC(2022, 10, 20), Date.UTC(2026, 5, 11), Date.UTC(2030, 5, 15)]);
  const countBetween = (list, a, b) => list.filter((t) => t >= a && t <= b).length;
  function countWeekday(a, b, wd) {
    const d0 = new Date(a); const first = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate() + ((wd - d0.getDay() + 7) % 7)).getTime();
    return first > b ? 0 : Math.floor((b - first) / (7 * DAY)) + 1;
  }
  function countFn(a, b, test) {
    let n = 0; const d = new Date(a); d.setHours(12, 0, 0, 0);
    const y0 = d.getFullYear(), y1 = new Date(b).getFullYear();
    for (let y = y0; y <= y1; y++) n += test(y, a, b);
    return n;
  }
  const leapDays = (a, b) => countFn(a, b, (y) => { if (!((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0)) return 0; const t = new Date(y, 1, 29, 12).getTime(); return t >= a && t <= b ? 1 : 0; });
  const fri13 = (a, b) => countFn(a, b, (y) => { let c = 0; for (let m = 0; m < 12; m++) { const d = new Date(y, m, 13, 12); if (d.getDay() === 5 && d.getTime() >= a && d.getTime() <= b) c++; } return c; });
  const newYears = (a, b) => countFn(a, b, (y) => { const t = new Date(y, 0, 1, 0, 0, 1).getTime(); return t > a && t <= b ? 1 : 0; });

  const sec = (now) => (now - birth) / 1000;
  const days = (now) => sec(now) / 86400;
  const yrs = (now) => (now - birth) / YEAR_MS;
  const after = (now, ageDays) => Math.max(0, days(now) - ageDays);

  const STATS = {
    body: [
      ['heart', 'Your heart has beaten about', 'times', (n) => n0(sec(n) / 60 * 70), 'at around 70 beats a minute'],
      ['lungs', 'You have taken roughly', 'breaths', (n) => n0(sec(n) / 60 * 16), 'about 16 a minute'],
      ['eye', 'You have blinked around', 'times', (n) => n0(sec(n) / 60 * 15 * 16 / 24), 'about 15 blinks a minute while awake'],
      ['moon', 'You have slept for about', 'hours', (n) => n0(sec(n) / 3600 / 3), (n) => `that is ${n1(yrs(n) / 3, 1)} whole years in bed`],
      ['dream', 'You have had roughly', 'dreams', (n) => n0(days(n) * 5), 'about five a night, most of them forgotten'],
      ['plate', 'You have eaten roughly', 'meals', (n) => n0(days(n) * 3)],
      ['drop', 'You have drunk about', 'litres of water', (n) => n0(days(n) * 2), (n) => `enough to fill ${n1(days(n) * 2 / 2500000, 4)} Olympic pools`],
      ['blood', 'Your heart has pumped about', 'litres of blood', (n) => n0(sec(n) / 60 * 5), 'around 5 litres a minute'],
      ['hair', 'Never cut your hair? It would be', 'metres long', (n) => n1(yrs(n) * 0.15, 3), 'hair grows about 15 cm a year'],
      ['nail', 'One uncut fingernail would be', 'cm long', (n) => n1(yrs(n) * 4.2, 2), 'nails grow about 3.5 mm a month'],
      ['skin', 'You have shed about', 'skin cells', (n) => big(sec(n) / 60 * 35000), 'roughly 35,000 a minute: a lot of household dust is you'],
      ['steps', 'You have walked about', 'steps', (n) => n0(after(n, 365) * 5000), (n) => `around ${n0(after(n, 365) * 5000 * 0.7 / 1000)} km, from age one`],
      ['talk', 'You have said roughly', 'words', (n) => big(after(n, 730) * 16000), 'about 16,000 a day since you were two'],
      ['fire', 'You have burned through about', 'calories', (n) => big(days(n) * 2000), 'roughly 2,000 a day, averaged over a lifetime']
    ],
    space: [
      ['spin', 'Earth has spun on its axis', 'times', (n) => n1(sec(n) / 86164.1, 5), 'one sidereal day is 23 h 56 min 4 s'],
      ['sun', 'You have travelled around the Sun', 'kilometres', (n) => n0(yrs(n) * 940e6), 'about 29.8 km every second'],
      ['moon', 'You have seen', 'full moons', (n) => n1(days(n) / 29.530589, 4), 'one every 29.53 days'],
      ['galaxy', 'The galaxy has carried you', 'kilometres', (n) => n0(sec(n) * 230), 'the Sun orbits the Milky Way at about 230 km/s'],
      ['star', 'You have orbited the Sun', 'times', (n) => n1(yrs(n), 8)],
      ['light', 'Light that left Earth at your birth is', 'kilometres away', (n) => big(sec(n) * 299792.458), (n) => { const ly = yrs(n); const past = D.stars.filter((s) => s[1] <= ly); return past.length ? `${n1(ly, 2)} light-years: it has already passed ${past[past.length - 1][0]}` : `${n1(ly, 2)} light-years: not even at Proxima Centauri yet`; }],
      ['iss', 'The space station has circled Earth', 'times', (n) => n0(Math.max(0, n - Math.max(birth, ISS)) / 1000 / 60 / 92.9), (n) => birth < ISS ? 'since its first module launched in 1998' : 'since you were born, every 93 minutes'],
      ['moonaway', 'The Moon has drifted', 'cm farther away', (n) => n1(yrs(n) * 3.8, 2), 'it creeps away about 3.8 cm a year'],
      ['globe', 'The Atlantic has widened by', 'cm', (n) => n1(yrs(n) * 2.5, 2), 'about as fast as your fingernails grow']
    ],
    world: [
      ['baby', 'Since you were born, roughly', 'babies have been born', (n) => n0(bornBetween(birth, n)), 'about 4 every second right now'],
      ['people', 'When you were born the world had about', 'people', () => n0(Math.round(popAt(birth) / 1e6) * 1e6), 'UN estimate for your birth year'],
      ['chart', 'Since then the population grew by', 'people', (n) => n0(Math.max(0, popNow(n) - popAt(birth))), () => `it is now about ${n1(popNow(Date.now()) / 1e9, 2)} billion`],
      ['medal', 'You are older than about', 'of everyone alive', () => n1(Math.min(99.9, bornBetween(birth, Date.now()) / popNow(Date.now()) * 100), 1) + '%', 'a rough guess that ignores who has since died'],
      ['bolt', 'Lightning has struck about', 'times', (n) => big(sec(n) * 44), 'around 44 flashes a second worldwide'],
      ['leap', 'You have lived through', 'leap days', (n) => n0(leapDays(birth, n)), 'every 29 February since you were born'],
      ['rings', 'There have been', 'Summer Olympics', (n) => n0(countBetween(OLYMPICS, birth, n)), 'Tokyo 2020 counts, held in 2021'],
      ['ball', 'There have been', 'football World Cups', (n) => n0(countBetween(WORLDCUPS, birth, n)), 'the men\'s tournament, since 1930']
    ],
    time: [
      ['cal', 'You are', 'years old', (n) => n1(yrs(n), 9)],
      ['cal', 'Or', 'months old', (n) => n1(yrs(n) * 12, 6)],
      ['cal', 'Or', 'weeks old', (n) => n1(days(n) / 7, 5)],
      ['clock', 'Or', 'days old', (n) => n1(days(n), 4)],
      ['clock', 'Or', 'hours old', (n) => n0(sec(n) / 3600)],
      ['clock', 'Or', 'minutes old', (n) => n0(sec(n) / 60)],
      ['party', 'You have celebrated', 'birthdays', (n) => n0(Math.floor(yrs(n) + 1e-9))],
      ['coffee', 'You have survived', 'Mondays', (n) => n0(countWeekday(birth, n, 1))],
      ['party', 'You have enjoyed', 'weekends', (n) => n0(countWeekday(birth, n, 6))],
      ['cat13', 'You have dodged', 'Friday the 13ths', (n) => n0(fri13(birth, n))],
      ['star', 'You have seen in', 'New Years', (n) => n0(newYears(birth, n))]
    ],
    fun: [
      ['dog', 'In classic dog years you are', 'years old', (n) => n1(yrs(n) * 7, 6), 'the famous, scientifically dodgy, x7 rule'],
      ['dog', 'In "epigenetic" dog years you are', 'years old', (n) => n1(Math.max(0, 16 * Math.log(Math.max(1e-6, yrs(n))) + 31), 2), 'the 2019 DNA-clock formula: 16 ln(age) + 31, which counts from a dog\'s first year'],
      ['plane', 'Walking non-stop all your life, you would have gone', 'times around Earth', (n) => n1(sec(n) / 3600 * 5 / 40075, 3), 'at 5 km/h, no naps'],
      ['party', 'Your whole life is as long as', 'back-to-back films', (n) => n0(sec(n) / 7200), 'two hours each'],
      ['talk', 'Or this many plays of a 6-minute rock epic:', 'plays', (n) => n0(sec(n) / 355)],
      ['plate', 'If one meal in ten was pizza, you ate', 'pizzas', (n) => n0(days(n) * 3 / 10)],
      ['tree', 'A tree planted on your birthday could be', 'metres tall', (n) => n1(Math.min(30, yrs(n) * 0.6), 1), 'assuming a brisk 60 cm a year, topping out at 30 m']
    ]
  };
  const TABS = [['body', 'Your body'], ['space', 'In space'], ['world', 'The world'], ['time', 'Time'], ['fun', 'Just for fun']];

  const FILLED = new Set(['heart', 'lungs', 'eye', 'moon', 'drop', 'nail', 'skin', 'steps', 'talk', 'dream', 'fire', 'spin', 'baby', 'people', 'medal', 'bolt', 'cat13', 'star', 'tree', 'plane']);
  function icon(id, size = 46) {
    const [col, d] = D.icons[id] || D.icons.star;
    const f = FILLED.has(id);
    return `<svg viewBox="0 0 40 40" width="${size}" height="${size}" aria-hidden="true"><rect x="1" y="1" width="38" height="38" rx="12" fill="${col}"/><rect x="1" y="1" width="38" height="19" rx="12" fill="#fff" opacity=".14"/><path d="${d}" fill="${f ? '#fff' : 'none'}" fill-rule="evenodd" stroke="#fff" stroke-width="${f ? 0.6 : 2.4}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  const ticks = [];
  function buildTabs() {
    $('tabs').innerHTML = '';
    for (const [id, label] of TABS) {
      const b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'tab'); b.dataset.t = id; b.textContent = label;
      b.addEventListener('click', () => { setTab(id); Curio.beep(560, 0.05, 'triangle', 0.08); });
      $('tabs').append(b);
    }
  }
  function setTab(id) {
    S.tab = id;
    if (!S.tabs.includes(id)) S.tabs.push(id);
    if (S.tabs.length >= TABS.length) award('explorer');
    save();
    [...$('tabs').children].forEach((b) => b.setAttribute('aria-selected', String(b.dataset.t === id)));
    buildGrid();
  }
  function buildGrid() {
    ticks.length = 0;
    const grid = $('grid');
    grid.innerHTML = '';
    STATS[S.tab].forEach(([ic, before, afterTxt, fn, note], i) => {
      const el = document.createElement('div');
      el.className = 'c-card ls-stat';
      el.style.animationDelay = `${i * 35}ms`;
      el.innerHTML = `${icon(ic)}<div><p>${before}</p><b>0</b><p>${afterTxt}</p>${note ? '<div class="ls-note"></div>' : ''}</div>`;
      grid.append(el);
      const b = el.querySelector('b'), nt = el.querySelector('.ls-note');
      const t0 = performance.now() + i * 35;
      ticks.push((now, pnow) => {
        const k = Math.min(1, Math.max(0, (pnow - t0) / 900));
        let v;
        if (k < 1) {
          const e = 1 - Math.pow(1 - k, 3);
          v = fn(birth + (now - birth) * e);
        } else v = fn(now);
        if (b.textContent !== v) { b.textContent = v; const L = v.length; b.style.fontSize = L > 15 ? '18px' : L > 12 ? '21px' : ''; }
        if (nt) { const tx = typeof note === 'function' ? note(now) : note; if (nt.textContent !== tx) nt.textContent = tx; }
      });
    });
  }

  let odoStr = '';
  function setOdo(n) {
    const str = n0(n);
    const box = $('odo');
    if (str.length !== odoStr.length) {
      box.innerHTML = [...str].map((ch) => ch === ',' ? '<span class="c">,</span>' : `<span class="d"><i>${'0123456789'.split('').map((x) => `<span>${x}</span>`).join('')}</i></span>`).join('');
    }
    odoStr = str;
    const ds = box.querySelectorAll('.d i');
    let k = 0;
    for (const ch of str) if (ch !== ',') { ds[k].style.transform = `translateY(${-Number(ch)}em)`; k++; }
    box.setAttribute('aria-label', `${str} seconds alive`);
  }

  function nextBirthday(now) {
    const b = new Date(birth);
    const t = new Date(now); let y = t.getFullYear();
    const todayStart = new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime();
    let next = new Date(y, b.getMonth(), b.getDate());
    if (next.getTime() < todayStart) next = new Date(++y, b.getMonth(), b.getDate());
    const last = new Date(next.getFullYear() - 1, b.getMonth(), b.getDate());
    return { next, last, isToday: next.getTime() === todayStart, age: y - b.getFullYear() };
  }

  let bdConfetti = false;
  function update(pnow) {
    const now = Date.now();
    setOdo((now - birth) / 1000);
    const y = yrs(now);
    $('units').innerHTML = `<span>${n0(y)} years</span><span>${n0(y * 12)} months</span><span>${n0(days(now) / 7)} weeks</span><span>${n0(days(now))} days</span><span>${n0(sec(now) / 3600)} hours</span>`;
    for (const f of ticks) f(now, pnow);
    const nb = nextBirthday(now);
    const frac = Math.min(1, (now - nb.last.getTime()) / (nb.next.getTime() - nb.last.getTime()));
    const C = 2 * Math.PI * 52;
    $('ring').style.strokeDasharray = String(C);
    $('ring').style.strokeDashoffset = String(C * (1 - (nb.isToday ? 1 : frac)));
    $('ringPct').textContent = `${Math.floor((nb.isToday ? 1 : frac) * 100)}%`;
    if (nb.isToday) {
      $('nextTitle').textContent = 'Happy birthday!';
      $('nextAge').textContent = `You are ${nb.age} today. The cake is on us (it is imaginary).`;
      ['cd', 'ch', 'cm', 'cs'].forEach((id) => { $(id).textContent = '0'; });
      if (!bdConfetti) { bdConfetti = true; Curio.confetti(); award('bday'); }
    } else {
      const d = Math.max(0, nb.next.getTime() - now);
      $('nextTitle').textContent = 'Your next birthday';
      $('nextAge').textContent = `You will be ${nb.age} on ${nb.next.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`;
      $('cd').textContent = Math.floor(d / DAY); $('ch').textContent = Math.floor(d / 36e5) % 24;
      $('cm').textContent = Math.floor(d / 6e4) % 60; $('cs').textContent = Math.floor(d / 1e3) % 60;
    }
  }

  function addMonths(t, n) { const d = new Date(t); const m = d.getMonth() + n; const r = new Date(d.getFullYear() + Math.floor(m / 12), ((m % 12) + 12) % 12, d.getDate(), d.getHours(), d.getMinutes()); return r.getTime(); }
  function milestoneAt(m) {
    switch (m.u) {
      case 'days': return birth + m.n * DAY;
      case 'weeks': return birth + m.n * 7 * DAY;
      case 'hours': return birth + m.n * 36e5;
      case 'minutes': return birth + m.n * 6e4;
      case 'seconds': return birth + m.n * 1e3;
      case 'months': return addMonths(birth, m.n);
      case 'heartbeats': return birth + m.n / 70 * 6e4;
      case 'Mercury years': return birth + m.n * 87.969 * DAY;
      case 'Jupiter year': case 'Jupiter years': return birth + m.n * 4332.59 * DAY;
      case 'Saturn year': return birth + m.n * 10759.22 * DAY;
    }
    return 0;
  }
  let milestones = [];
  function paintMiles() {
    const now = Date.now();
    milestones = D.milestones.map((m) => ({ ...m, at: milestoneAt(m) })).filter((m) => m.at - birth < 105 * YEAR_MS).sort((a, b) => a.at - b.at);
    const nextI = milestones.findIndex((m) => m.at > now);
    $('miles').innerHTML = milestones.map((m, i) => {
      const past = m.at <= now;
      const d = Math.ceil((m.at - now) / DAY);
      const date = new Date(m.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const label = `${m.n >= 1e6 ? big(m.n).replace('.000', '') : m.n.toLocaleString('en-US')} ${m.u}`;
      return `<li class="${past ? 'past' : i === nextI ? 'next' : ''}"><span class="dot"></span><span>${label}</span><span>${date}${past ? '' : ` · ${d === 0 ? 'today!' : `in ${d.toLocaleString('en-US')} d`}`}</span></li>`;
    }).join('');
    if (milestones.some((m) => m.u === 'seconds' && m.n === 1e9 && m.at <= now)) award('billion');
    if (milestones.some((m) => m.u === 'days' && m.n === 10000 && m.at <= now)) award('tenk');
    if (milestones.some((m) => Math.abs(m.at - now) < DAY && new Date(m.at).toDateString() === new Date(now).toDateString())) { Curio.confetti(); Curio.toast('A milestone is today!'); }
  }
  $('ics').addEventListener('click', () => {
    const now = Date.now();
    const up = milestones.filter((m) => m.at > now);
    if (!up.length) { Curio.toast('No milestones left to add. Legendary.'); return; }
    const day = (ms) => { const d = new Date(ms); return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`; };
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Zoble//Life Stats//EN'];
    up.forEach((m, i) => { const e = new Date(m.at); e.setDate(e.getDate() + 1); L.push('BEGIN:VEVENT', `UID:curio-life-${i}-${day(m.at)}@curio`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${day(m.at)}`, `DTEND;VALUE=DATE:${day(e.getTime())}`, `SUMMARY:I am ${m.n.toLocaleString('en-US')} ${m.u} old`, 'END:VEVENT'); });
    L.push('END:VCALENDAR');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([L.join('\r\n')], { type: 'text/calendar' }));
    a.download = 'life-milestones.ics'; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    Curio.toast(`${up.length} milestones saved`); award('calendar');
  });

  function paintDecode() {
    const b = new Date(birth);
    const m = b.getMonth(), d = b.getDate(), y = b.getFullYear();
    const sign = D.signs.find(([, em, ed]) => m + 1 < em || (m + 1 === em && d <= ed))[0];
    const animal = D.animals[((y - 4) % 12 + 12) % 12];
    const gen = (D.generations.find(([a, z]) => y >= a && y <= z) || [0, 0, 'ahead of every generation name'])[2];
    const doy = Math.round((new Date(y, m, d) - new Date(y, 0, 1)) / DAY) + 1;
    const north = ['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter'][m];
    const south = { winter: 'summer', summer: 'winter', spring: 'autumn', autumn: 'spring' }[north];
    const half = new Date(addMonths(birth, 6));
    const cards = [
      ['Born on a', b.toLocaleDateString('en-US', { weekday: 'long' }), `According to the old rhyme, ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][b.getDay()]}'s child ${['is bonny and blithe', 'is fair of face', 'is full of grace', 'is full of woe', 'has far to go', 'is loving and giving', 'works hard for a living'][b.getDay()]}.`],
      ['Star sign', sign, 'For entertainment purposes only. The stars have not been consulted.'],
      ['Chinese zodiac', `Year of the ${animal}`, (m < 2 ? 'Born in January or February? Check the lunar new year date, you might be the previous animal.' : `The ${animal} comes round every 12 years.`)],
      ['Birthstone', D.stones[m], `Birth flower: ${D.flowers[m]}.`, D.stoneColors[m]],
      ['Generation', gen.replace(/^(a|the) /, '').replace(/^./, (c) => c.toUpperCase()), `You are ${gen}.`],
      ['Day of the year', `Day ${doy}`, `Born in ${north} up north, ${south} down south.`],
      ['Half birthday', half.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }), 'A perfectly good excuse for half a cake.'],
      ['Birthday twins', `about ${n0(popNow(Date.now()) / 365.25 / 1e6)} million`, 'people alive today share your birthday (give or take).']
    ];
    $('decode').innerHTML = cards.map(([k, v, s, col]) => `<div class="ls-dc"><small>${k}</small><b>${col ? `<i style="background:${col}"></i>` : ''}${v}</b><span>${s}</span></div>`).join('');
  }

  const globes = {};
  function paintPlanets() {
    const box = $('planets');
    const dd = days(Date.now());
    box.innerHTML = D.planets.map(([k, n, p]) => `<div class="ls-pl"><canvas data-k="${k}" aria-hidden="true"></canvas><b>${(dd / p) >= 100 ? n0(dd / p) : n1(dd / p, 2)}</b><span>on ${n}</span></div>`).join('');
    box.querySelectorAll('canvas').forEach((cv, i) => setTimeout(() => {
      const dp = Math.min(2, devicePixelRatio || 1); cv.width = cv.height = Math.round(64 * dp);
      const k = cv.dataset.k, ring = k === 'saturn' ? 2.3 : k === 'uranus' ? 2.05 : 1.1;
      const rad = cv.width / 2 / ring;
      const gl = globes[k] || (globes[k] = PlanetArt.Globe(k, Math.round(rad * 2)));
      gl.draw(cv.getContext('2d'), cv.width / 2, cv.height / 2, rad, 0.5 + i);
    }, 60 + i * 50));
  }

  const STAGES = [[0, 5, '#ffb3c7', 'Early childhood'], [5, 13, '#ff8fb1', 'Childhood'], [13, 20, '#e84393', 'Teens'], [20, 40, '#b8327a', '20s and 30s'], [40, 65, '#8e44ad', '40 to 64'], [65, 200, '#6c5ce7', '65 and up']];
  let wk = { cell: 0, labelW: 26, rows: 90 };
  function drawWeeks() {
    const cv = $('weeks');
    const W = Math.min(640, cv.parentElement.clientWidth);
    const cols = 52, rows = Math.max(90, S.exp + 5), labelW = 24;
    const cell = Math.max(3, (W - labelW) / cols);
    const H = rows * cell;
    const dp = Math.min(2, devicePixelRatio || 1);
    cv.width = W * dp; cv.height = H * dp; cv.style.height = H + 'px'; cv.style.width = W + 'px';
    wk = { cell, labelW, rows, cols, W };
    const g = cv.getContext('2d'); g.setTransform(dp, 0, 0, dp, 0, 0);
    g.clearRect(0, 0, W, H);
    const cs = getComputedStyle(document.documentElement);
    const lineC = cs.getPropertyValue('--line').trim(), ink3 = cs.getPropertyValue('--ink-3').trim();
    const lived = Math.floor((Date.now() - birth) / (7 * DAY));
    const gap = cell > 6 ? 1.5 : 0.8;
    g.font = `700 ${Math.min(10, cell * 1.3)}px system-ui, sans-serif`; g.textBaseline = 'middle';
    for (let r = 0; r < rows; r++) {
      if (r % 10 === 0) { g.fillStyle = ink3; g.fillText(String(r), 0, r * cell + cell / 2); }
      const st = STAGES.find(([a, z]) => r >= a && r < z);
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        g.fillStyle = i < lived ? st[2] : i === lived ? '#ffc233' : lineC;
        g.globalAlpha = i >= lived && r >= S.exp ? 0.45 : 1;
        g.fillRect(labelW + c * cell, r * cell, cell - gap, cell - gap);
      }
    }
    g.globalAlpha = 1;
    g.strokeStyle = '#ffc233'; g.lineWidth = 1.5;
    g.strokeRect(labelW - 1, S.exp * cell - 1, cols * cell, 1);
    g.fillStyle = cs.getPropertyValue('--ink').trim();
    g.font = `800 ${Math.min(11, cell * 1.5)}px system-ui, sans-serif`;
    const lr = Math.floor(lived / cols), lc = lived % cols;
    g.beginPath(); g.arc(labelW + lc * cell + cell / 2, lr * cell + cell / 2, cell * 1.4, 0, Math.PI * 2); g.strokeStyle = '#ffc233'; g.lineWidth = 2; g.stroke();
    const pct = (Date.now() - birth) / (S.exp * YEAR_MS) * 100;
    $('pctLabel').textContent = pct >= 100 ? `You have outlived a ${S.exp}-year life by ${n1((Date.now() - birth) / YEAR_MS - S.exp, 1)} years` : `${n1(pct, 2)}% of a ${S.exp}-year life`;
    $('weeksLabel').textContent = `${lived.toLocaleString('en-US')} weeks lived · ${Math.max(0, Math.round(S.exp * 52.18 - lived)).toLocaleString('en-US')} to go`;
    $('pctBar').style.width = Math.min(100, pct) + '%';
    $('legend').innerHTML = STAGES.map(([, , c, l]) => `<span><i style="background:${c}"></i>${l}</span>`).join('') + `<span><i style="background:#ffc233"></i>This week</span><span><i style="background:${lineC}"></i>Weeks to come</span>`;
  }
  function weekTip(e) {
    const cv = $('weeks');
    const r = cv.getBoundingClientRect();
    const x = e.clientX - r.left - wk.labelW, y = e.clientY - r.top;
    const c = Math.floor(x / wk.cell), row = Math.floor(y / wk.cell);
    const tip = $('tip');
    if (c < 0 || c >= wk.cols || row < 0 || row >= wk.rows) { tip.hidden = true; return; }
    const i = row * wk.cols + c;
    const start = new Date(birth + i * 7 * DAY);
    const lived = Math.floor((Date.now() - birth) / (7 * DAY));
    tip.hidden = false;
    tip.textContent = `Week ${(i + 1).toLocaleString('en-US')} · age ${row} · ${start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}${i === lived ? ' · now!' : i < lived ? '' : ' · future'}`;
    tip.style.left = `${Math.max(80, Math.min(r.width - 80, e.clientX - r.left))}px`;
    tip.style.top = `${y}px`;
    award('weeks');
  }
  $('weeks').addEventListener('pointermove', weekTip);
  $('weeks').addEventListener('pointerdown', weekTip);
  $('weeks').addEventListener('pointerleave', () => { $('tip').hidden = true; });
  $('exp').addEventListener('input', (e) => { S.exp = +e.target.value; $('expV').textContent = S.exp; save(); drawWeeks(); });

  const BADGES = [
    ['start', 'Hello, world', 'Enter your birthday', '#e84393', 'heart'],
    ['explorer', 'Explorer', 'Open every stat tab', '#4ea6ef', 'globe'],
    ['billion', 'Billionaire', 'Live 1 billion seconds', '#ffb020', 'medal'],
    ['tenk', '10K club', 'Live 10,000 days', '#2ecc71', 'cal'],
    ['weeks', 'Week watcher', 'Explore your life in weeks', '#6c5ce7', 'clock'],
    ['calendar', 'Planner', 'Save milestones to a calendar', '#ff9f43', 'party'],
    ['share', 'Show-off', 'Copy your stats', '#9b59b6', 'talk'],
    ['bday', 'Birthday!', 'Visit on your birthday', '#ff5a36', 'fire'],
    ['regular', 'Regular', 'Visit on 3 different days', '#16a085', 'star']
  ];
  function paintBadges() {
    $('badges').innerHTML = BADGES.map(([id, n, how, , ic]) => `<div class="ls-b${S.badges.includes(id) ? '' : ' locked'}">${icon(ic, 38)}${n}<small>${S.badges.includes(id) ? 'Unlocked' : how}</small></div>`).join('');
  }
  function award(id) {
    if (S.badges.includes(id)) return;
    S.badges.push(id); save(); paintBadges();
    const b = BADGES.find((x) => x[0] === id);
    Curio.toast(`Badge unlocked: ${b[1]}`);
    [660, 990].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.1, 'triangle', 0.08), i * 90));
  }

  function shareText() {
    const now = Date.now();
    return `I have been alive for ${n0(sec(now))} seconds.\nMy heart has beaten about ${big(sec(now) / 60 * 70)} times.\nI have travelled ${big(yrs(now) * 940e6)} km around the Sun.\nI am ${n1(days(now) / 87.969, 1)} on Mercury and ${n1(days(now) / 686.98, 1)} on Mars.\nCurio: Life Stats`;
  }
  $('share').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(shareText()); Curio.toast('Copied to clipboard'); award('share'); } catch { Curio.toast('Could not copy, sorry'); }
  });
  $('forget').addEventListener('click', async () => {
    const ok = await Curio.modal({ emoji: '🧽', title: 'Forget your birthday?', body: 'It is only stored on this device, but we can wipe it.', buttons: [{ label: 'Forget it', value: true }, { label: 'Keep it', value: false }] });
    if (!ok) return;
    Curio.store.set('life:dob', null); Curio.store.set('life:time', null);
    birth = null; $('out').hidden = true; dob.value = ''; tob.value = '';
    cancelAnimationFrame(raf); raf = 0;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  let raf = 0, last = 0;
  function loop(ts) {
    raf = 0;
    if (document.hidden || !birth) return;
    if (ts - last > 45) { last = ts; update(ts); }
    raf = requestAnimationFrame(loop);
  }
  const kick = () => { if (!raf && birth && !document.hidden) raf = requestAnimationFrame(loop); };
  document.addEventListener('visibilitychange', kick);

  function start(value, time, fresh) {
    const [y, m, d] = value.split('-').map(Number);
    const [hh, mm] = (time || '00:00').split(':').map(Number);
    const t = new Date(y, m - 1, d, hh || 0, mm || 0).getTime();
    if (!y || isNaN(t) || t > Date.now() || y < 1900) { Curio.toast('That birthday looks a bit unlikely'); return; }
    birth = t;
    Curio.store.set('life:dob', value);
    Curio.store.set('life:time', time || null);
    $('out').hidden = false;
    buildTabs(); setTab(STATS[S.tab] ? S.tab : 'body');
    paintMiles(); paintDecode(); paintPlanets(); drawWeeks(); paintBadges();
    $('expV').textContent = S.exp; $('exp').value = S.exp;
    $('shareTxt').textContent = shareText();
    update(performance.now());
    award('start');
    if (S.visits.length >= 3) award('regular');
    kick();
    if (fresh) {
      Curio.beep(660, 0.08, 'triangle'); setTimeout(() => Curio.beep(990, 0.12, 'triangle'), 90);
      setTimeout(() => $('out').scrollIntoView({ behavior: 'smooth' }), 60);
    }
  }

  $('form').addEventListener('submit', (e) => { e.preventDefault(); if (dob.value) start(dob.value, tob.value, true); });
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => birth && drawWeeks(), 150); });
  addEventListener('curio:theme', () => birth && drawWeeks());
  const savedDob = Curio.store.get('life:dob', null);
  const savedTime = Curio.store.get('life:time', null);
  if (savedDob) { dob.value = savedDob; if (savedTime) tob.value = savedTime; start(savedDob, savedTime, false); }
})();
