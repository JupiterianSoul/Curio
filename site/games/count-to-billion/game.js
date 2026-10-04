(() => {
  const $ = (id) => document.getElementById(id);
  const fmt = (n, d = 0) => Number(n).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d });
  const LABEL = ['A thousand', 'A million', 'A billion', 'A trillion'];
  const UNITS = [
    { id: 'time', tab: '⏱️ Seconds', icon: ['⏱️', '📅', '🧓', '🦣'], rows: [
      ['16 minutes 40 seconds', 'A thousand seconds is a coffee break.'],
      ['11 days, 13 hours, 46 minutes', 'A million seconds is a long holiday, almost two weeks.'],
      ['31 years, 8 months', 'A billion seconds is most of a lifetime. Your billionth second arrives about 8 months after your 31st birthday.'],
      ['About 31,700 years', 'A trillion seconds ago, mammoths roamed Europe and people were painting the caves of Chauvet.']
    ] },
    { id: 'rice', tab: '🍚 Grains of rice', icon: ['🥄', '🛍️', '🚛', '🚢'], rows: [
      ['25 grams', 'A thousand grains is a small handful, about two tablespoons.'],
      ['25 kilograms', 'A million grains is a big sack you would struggle to carry up the stairs.'],
      ['25 tonnes', 'A billion grains fills a 20 foot shipping container, or weighs about as much as four elephants.'],
      ['25,000 tonnes', 'A trillion grains is a whole cargo ship of rice, as heavy as three and a half Eiffel Towers.']
    ] },
    { id: 'cash', tab: '💵 $100 bills', icon: ['✉️', '💼', '🏙️', '🛰️'], rows: [
      ['$1,000 = 10 bills, 1 mm thick', 'Fits in an envelope. Barely a stack at all.'],
      ['$1,000,000 = a stack 1.1 m tall', 'Ten thousand bills, 10 kg. It fits in a big briefcase.'],
      ['$1,000,000,000 = a stack 1.1 km tall', 'Taller than the Burj Khalifa. Ten tonnes of cash, about nine pallets.'],
      ['$1,000,000,000,000 = a stack 1,092 km tall', 'Way past the International Space Station, which orbits about 400 km up. It would cover a football pitch in pallets stacked one and a half high.']
    ] },
    { id: 'mm', tab: '📏 Millimetres', icon: ['🚶', '🏃', '🗺️', '🌕'], rows: [
      ['1 metre', 'A thousand millimetres is one big stride.'],
      ['1 kilometre', 'A million millimetres is a 12 minute walk.'],
      ['1,000 kilometres', 'A billion millimetres is about the length of Great Britain, end to end.'],
      ['1,000,000 kilometres', 'A trillion millimetres takes you to the Moon and back, then most of the way there again.']
    ] },
    { id: 'heart', tab: '❤️ Heartbeats', icon: ['💓', '🏖️', '🎓', '🗿'], rows: [
      ['14 minutes', 'Your heart beats a thousand times in about a quarter of an hour.'],
      ['10 days', 'A million beats takes your heart under a week and a half.'],
      ['27 years', 'Your heart reaches a billion beats around the age of 27.'],
      ['27,000 years', 'No heart has ever beaten a trillion times. Not even close: a long human life is about 3 billion.']
    ] },
    { id: 'people', tab: '🧑 People', icon: ['🏫', '🏙️', '🇮🇳', '👻'], rows: [
      ['A big school', 'A thousand people fill a large secondary school assembly hall.'],
      ['A whole city', 'A million people is about the population of Amsterdam or San Jose.'],
      ['One in eight humans', 'India and China each have well over a billion people. The whole world has about 8.2 billion.'],
      ['Nobody, ever', 'Only about 117 billion humans have ever been born. A trillion people is more than eight times everyone who has ever lived.']
    ] }
  ];

  const tabs = $('tabs'), ladder = $('ladder');
  let unit = Curio.store.get('billion:unit', 'time');
  if (!UNITS.some((u) => u.id === unit)) unit = 'time';
  UNITS.forEach((u) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'cb-tab'; b.setAttribute('role', 'tab'); b.textContent = u.tab; b.dataset.id = u.id;
    b.addEventListener('click', () => { unit = u.id; Curio.store.set('billion:unit', unit); Curio.beep(520, 0.05, 'triangle', 0.06); renderLadder(); });
    tabs.append(b);
  });
  function renderLadder() {
    const u = UNITS.find((x) => x.id === unit);
    tabs.querySelectorAll('.cb-tab').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.id === unit)));
    ladder.innerHTML = u.rows.map(([v, d], i) => {
      const pct = Math.pow(10, 3 * i) / 1e9 * 100;
      const note = i === 0 ? 'one millionth of the billion bar' : i === 1 ? 'one thousandth of the billion bar' : i === 2 ? 'the full billion bar' : '1,000 times longer than this bar';
      return `<div class="c-card cb-rung"><div class="cb-rung__icon" aria-hidden="true">${u.icon[i]}</div><div><div class="cb-rung__top"><b>${v}</b><em>${LABEL[i]}</em></div><p>${d}</p><div class="cb-bar${i === 3 ? ' over' : ''}"><i data-w="${Math.min(100, pct)}"></i></div><div class="cb-barnote">${note}</div></div></div>`;
    }).join('');
    requestAnimationFrame(() => requestAnimationFrame(() => ladder.querySelectorAll('.cb-bar i').forEach((el) => { el.style.width = el.dataset.w + '%'; })));
  }
  renderLadder();

  const now = Date.now();
  const yearOf = (ms) => new Date(ms).getFullYear();
  const billionSecAgo = new Date(now - 1e12).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const billionMinYear = yearOf(now - 1e9 * 60000);
  const FACTS = [
    [billionSecAgo, 'was one billion seconds ago. It feels like yesterday to somebody.'],
    [`${billionMinYear} AD`, 'was one billion minutes ago. Hadrian ruled Rome and the Pantheon was brand new.'],
    ['114,000 years', 'is one billion hours. Our ancestors had not yet left Africa in large numbers.'],
    ['$740 billion', 'is what you would have spent if you blew a million dollars every single day since the year 1 AD. Still not a trillion.'],
    ['86 billion', 'neurons in your brain, give or take. Each one wired to thousands of others.'],
    ['100 to 400 billion', 'stars in the Milky Way. Astronomers genuinely are not sure which end is right.'],
    ['117 billion', 'humans have ever been born, according to the Population Reference Bureau. You are one of them.'],
    ['$110 trillion', 'is roughly what the whole world economy produces in a year (IMF, 2024).'],
    ['3 trillion', 'trees on Earth, about 400 for every person alive (Crowther et al., 2015).']
  ];
  $('facts').innerHTML = FACTS.map(([b, p]) => `<div class="c-card"><b>${b}</b><p>${p}</p></div>`).join('');

  const TOTAL = 1e6;
  const box = $('million'), stick = $('stick'), cv = $('dots'), g = cv.getContext('2d');
  let cols = 0, rows = 0, pitch = 3, dot = 2, cw = 0, ch = 0, dpr = 1, pats = null, lastMil = -1;
  const PAD = 12;
  function colours() {
    const dark = Curio.isDark();
    return { bg: dark ? '#1c1a17' : '#ffffff', dot: dark ? '#7d756a' : '#6d665e', first: '#2e9e44', line: dark ? '#f3eee7' : '#1d1b19', label: dark ? '#f3eee7' : '#1d1b19', tag: dark ? 'rgba(33,30,27,.9)' : 'rgba(255,255,255,.9)' };
  }
  function makePattern(color) {
    const t = document.createElement('canvas');
    t.width = Math.round(pitch * dpr); t.height = Math.round(pitch * dpr);
    const tg = t.getContext('2d');
    tg.fillStyle = color;
    tg.fillRect(0, 0, Math.round(dot * dpr), Math.round(dot * dpr));
    const pat = g.createPattern(t, 'repeat');
    pat.setTransform?.(new DOMMatrix().scaleSelf(1 / dpr, 1 / dpr));
    return pat;
  }
  function layout() {
    dpr = Math.min(2, devicePixelRatio || 1);
    cw = stick.clientWidth; ch = stick.clientHeight;
    cols = Math.floor((cw - PAD * 2) / pitch);
    rows = Math.ceil(TOTAL / cols);
    box.style.height = (rows * pitch + ch + 40) + 'px';
    cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
    const c = colours();
    pats = { dot: makePattern(c.dot), first: makePattern(c.first) };
    lastMil = -1;
    draw();
  }
  function fillDots(pat, i0, i1, y0) {
    if (i1 <= i0) return;
    const r0 = Math.floor(i0 / cols), r1 = Math.floor((i1 - 1) / cols);
    g.fillStyle = pat;
    const rect = (r, c0, c1) => {
      const y = r * pitch - y0;
      if (y < -pitch || y > ch) return;
      g.save(); g.translate(PAD, Math.round(y * dpr) / dpr); g.fillRect(c0 * pitch, 0, (c1 - c0) * pitch, pitch); g.restore();
    };
    if (r0 === r1) { rect(r0, i0 % cols, ((i1 - 1) % cols) + 1); return; }
    rect(r0, i0 % cols, cols);
    const fy = (r0 + 1) * pitch - y0, ly = r1 * pitch - y0;
    const top = Math.max(fy, -pitch), bot = Math.min(ly, ch + pitch);
    if (bot > top) {
      const sr = Math.floor((top + y0) / pitch);
      const yy = sr * pitch - y0;
      g.save(); g.translate(PAD, Math.round(yy * dpr) / dpr); g.fillRect(0, 0, cols * pitch, Math.ceil((bot - yy) / pitch) * pitch); g.restore();
    }
    rect(r1, 0, ((i1 - 1) % cols) + 1);
  }
  function draw() {
    if (!cols) return;
    const c = colours();
    const rect = box.getBoundingClientRect();
    const barH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bar-h')) || 52;
    const y0 = Math.max(0, barH - rect.top) - PAD;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = c.bg; g.fillRect(0, 0, cw, ch);
    fillDots(pats.first, 0, 1000, y0);
    fillDots(pats.dot, 1000, TOTAL, y0);
    g.font = '800 12px system-ui, sans-serif'; g.textBaseline = 'middle';
    for (let m = 100000; m <= TOTAL; m += 100000) {
      const r = Math.floor((m - 1) / cols);
      const y = (r + 1) * pitch - y0 + 0.5;
      if (y < -10 || y > ch + 10) continue;
      g.fillStyle = c.line; g.fillRect(PAD, y, cols * pitch, 1.5);
      const txt = m === TOTAL ? '1,000,000 · one million' : fmt(m);
      const tw = g.measureText(txt).width + 14;
      g.fillStyle = c.tag; g.fillRect(cw - PAD - tw, y - 11, tw, 22);
      g.fillStyle = c.label; g.fillText(txt, cw - PAD - tw + 7, y);
    }
    const mid = y0 + ch / 2;
    const seen = Math.max(0, Math.min(TOTAL, Math.floor(mid / pitch) * cols));
    $('hud').innerHTML = `${fmt(seen)}<small>dots</small>`;
    const mil = Math.floor(seen / 100000);
    if (lastMil >= 0 && mil > lastMil) Curio.beep(300 + mil * 60, 0.07, 'triangle', 0.05);
    if (seen >= TOTAL && lastMil < 10 && lastMil >= 0) { Curio.confetti(90); award('million'); }
    lastMil = mil;
  }
  let ticking = false;
  addEventListener('scroll', () => { if (ticking) return; ticking = true; requestAnimationFrame(() => { ticking = false; draw(); }); }, { passive: true });
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(layout, 120); });
  addEventListener('curio:theme', layout);
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', layout);
  $('skip').addEventListener('click', () => { $('after').scrollIntoView({ behavior: 'smooth', block: 'center' }); });
  layout();

  function earn() {
    const s = Math.max(1, +$('salary').value || 0);
    const yrs = 1e9 / s;
    const since = new Date().getFullYear() - yrs;
    let when;
    if (yrs < 120) when = `You would finish in ${Math.round(new Date().getFullYear() + yrs)}.`;
    else if (since > 0) when = `You would have had to start working in the year ${Math.round(since)} AD to be done today.`;
    else if (since > -12000) when = `You would have had to start in ${fmt(Math.round(-since))} BC, before the pyramids${since < -9000 ? ' and before farming' : ''}, to be done today.`;
    else when = `You would have had to start ${fmt(Math.round(yrs))} years ago, back in the Stone Age, to be done today.`;
    $('earn').innerHTML = `At ${fmt(s)} a year it takes <b>${fmt(yrs, yrs < 100 ? 1 : 0)} years</b> to earn a billion, without spending a penny. ${when} A million would take <b>${fmt(1e6 / s, 1)} years</b>.`;
  }
  $('salary').addEventListener('input', earn);
  earn();

  let count = Curio.store.get('billion:count', 0), timer = 0;
  const paint = () => {
    $('digits').textContent = fmt(count);
    const left = 1e6 - count;
    const done = new Date(Date.now() + left * 1000);
    $('eta').textContent = left <= 0 ? 'You did it. One million. Go and lie down.' : `${fmt(count / 1e4, 4)}% of the way. Nonstop, you would hit a million on ${done.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.`;
  };
  function step() {
    if (document.hidden) return;
    count++; Curio.store.set('billion:count', count); paint();
    Curio.beep(count % 10 === 0 ? 880 : 620, 0.03, 'sine', 0.03);
    if (count % 100 === 0) Curio.toast(`${fmt(count)}! Only ${fmt(1e6 - count)} to go.`);
    if (count >= 100) award('count');
  }
  $('go').addEventListener('click', () => {
    if (timer) { clearInterval(timer); timer = 0; $('go').textContent = 'Keep counting'; return; }
    timer = setInterval(step, 1000); $('go').textContent = 'Pause'; step();
  });
  $('reset').addEventListener('click', () => { count = 0; Curio.store.set('billion:count', 0); paint(); });
  paint();
  const buzz = (ms) => { try { if (!Curio.muted && navigator.vibrate) navigator.vibrate(ms); } catch (x) {} };
  const BADGES = [
    { id: 'million', e: '⚫', name: 'Dot counter', d: 'Scroll through all one million dots' },
    { id: 'spend', e: '🛍️', name: 'Big spender', d: 'Spend your first million' },
    { id: 'broke', e: '💸', name: 'Billion gone', d: 'Spend the whole billion (less than $100 left)' },
    { id: 'trees', e: '🌳', name: 'Forester', d: 'Plant a million trees' },
    { id: 'quiz', e: '🎯', name: 'Sense of scale', d: 'Finish a How big is it quiz' },
    { id: 'perfect', e: '🏆', name: 'Order of magnitude', d: 'Get 10 out of 10' },
    { id: 'daily', e: '📅', name: 'Daily numbers', d: 'Play the daily quiz' },
    { id: 'count', e: '🔢', name: 'Patient', d: 'Count to 100 one second at a time' }
  ];
  const BKEY = 'billion:badges:v1';
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

  function cubeSvg(level) {
    const cols = ['#a5d6a7', '#66bb6a', '#2e7d32', '#1b5e20'];
    const c = cols[level];
    const n = 4;
    let h = '';
    const s = 9;
    for (let z = 0; z < n; z++) for (let y = 0; y < n; y++) for (let x = n - 1; x >= 0; x--) {
      if (!(x === n - 1 || y === 0 || z === n - 1)) continue;
      const px = 60 + (x - z) * s * .87, py = 34 + (x + z) * s * .5 - (n - 1 - y) * s;
      h += `<g transform="translate(${px.toFixed(1)} ${py.toFixed(1)})"><path d="M0 0 L${(s * .87).toFixed(1)} ${s * .5} L0 ${s} L${(-s * .87).toFixed(1)} ${s * .5}Z" fill="${c}" opacity=".95"/><path d="M${(-s * .87).toFixed(1)} ${s * .5} L0 ${s} L0 ${s * 2} L${(-s * .87).toFixed(1)} ${s * 1.5}Z" fill="${c}" style="filter:brightness(.78)"/><path d="M${(s * .87).toFixed(1)} ${s * .5} L0 ${s} L0 ${s * 2} L${(s * .87).toFixed(1)} ${s * 1.5}Z" fill="${c}" style="filter:brightness(.62)"/></g>`;
    }
    const sizes = [40, 54, 68, 84];
    return `<svg viewBox="26 4 68 78" width="${sizes[level]}" height="${sizes[level]}" aria-hidden="true">${h}</svg>`;
  }
  document.querySelectorAll('.cube').forEach((el) => { el.innerHTML = cubeSvg(Number(el.dataset.l)); });

  const odo = $('odo');
  const digits = '1,000,000,000'.split('');
  odo.innerHTML = digits.map((d) => d === ',' ? '<span class="sep">,</span>' : `<span class="wheel"><span class="strip">${'0123456789'.split('').map((x) => `<i>${x}</i>`).join('')}</span></span>`).join('');
  const strips = [...odo.querySelectorAll('.strip')];
  let odoN = 0, odoT0 = performance.now();
  function odoTick(now) {
    if (!document.hidden) {
      const p = Math.min(1, (now - odoT0) / 4000);
      const e = 1 - Math.pow(1 - p, 4);
      const n = Math.floor(Math.pow(10, 9 * e));
      if (n !== odoN) {
        odoN = n;
        const str = String(Math.min(1e9, n)).padStart(10, '0');
        strips.forEach((s, i) => { s.style.transform = `translateY(${-Number(str[i]) * 10}%)`; });
      }
      if (p >= 1) return;
    }
    requestAnimationFrame(odoTick);
  }
  requestAnimationFrame(odoTick);

  const SHOP = window.CB_SHOP;
  const BUDGET = 1e9;
  let cart = Curio.store.get('billion:cart:v1', {});
  if (!cart || typeof cart !== 'object') cart = {};
  const spent = () => SHOP.reduce((s, it) => s + (Number(cart[it.id]) || 0) * it.p, 0);
  const money = (n) => `$${fmt(n)}`;
  function shortMoney(n) { if (n >= 1e9) return `$${fmt(n / 1e9, 2)}B`; if (n >= 1e6) return `$${fmt(n / 1e6, n >= 1e8 ? 0 : 1)}M`; if (n >= 1e4) return `$${fmt(n / 1e3, 0)}K`; return money(n); }
  const grid = $('spGrid');
  grid.innerHTML = SHOP.map((it) => `<div class="c-card sp-item" data-id="${it.id}"><div class="sp-e" aria-hidden="true">${it.e}</div><b>${it.n}</b><span class="sp-p">${shortMoney(it.p)}</span><div class="sp-ctl"><button type="button" class="sp-sell" aria-label="Sell one ${it.n}">−</button><input class="sp-n" type="number" min="0" step="1" value="0" aria-label="How many ${it.n}" inputmode="numeric"><button type="button" class="sp-buy" aria-label="Buy one ${it.n}">+</button></div><button type="button" class="sp-max">Max</button></div>`).join('');
  let shown = 0, tweenRaf = 0;
  function paintMoney() {
    const left = BUDGET - spent();
    cancelAnimationFrame(tweenRaf);
    const from = shown, t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / 350);
      shown = from + (left - from) * (1 - Math.pow(1 - p, 3));
      $('spLeft').textContent = money(Math.round(shown));
      if (p < 1) tweenRaf = requestAnimationFrame(step);
    };
    tweenRaf = requestAnimationFrame(step);
    $('spFill').style.width = `${(1 - left / BUDGET) * 100}%`;
    $('spSub').textContent = left <= 0 ? 'all spent!' : `left to spend · ${fmt((1 - left / BUDGET) * 100, (1 - left / BUDGET) * 100 >= 1 ? 1 : 4)}% gone`;
    grid.querySelectorAll('.sp-item').forEach((el) => {
      const it = SHOP.find((x) => x.id === el.dataset.id);
      const n = Number(cart[it.id]) || 0;
      const inp = el.querySelector('.sp-n');
      if (document.activeElement !== inp) inp.value = n;
      el.classList.toggle('owned', n > 0);
      el.querySelector('.sp-buy').disabled = it.p > left;
      el.querySelector('.sp-max').disabled = it.p > left;
      el.querySelector('.sp-sell').disabled = n <= 0;
    });
    const lines = SHOP.filter((it) => cart[it.id] > 0);
    $('spReceipt').innerHTML = lines.length ? `<h3>🧾 Your receipt</h3><ul>${lines.map((it) => `<li><span>${it.e} ${fmt(cart[it.id])} × ${it.n}</span><b>${money(cart[it.id] * it.p)}</b></li>`).join('')}</ul><div class="sp-tot"><span>Total</span><b>${money(spent())}</b></div><button class="c-btn c-btn--ghost" type="button" id="spShare">📋 Copy receipt</button>` : '<p class="c-muted">Your receipt is empty. Start with something small.</p>';
    const sh = $('spShare');
    if (sh) sh.addEventListener('click', async () => { const txt = `I spent ${money(spent())} of a billion on Zoble:\n${lines.map((it) => `${it.e} ${fmt(cart[it.id])} × ${it.n}`).join('\n')}\nLeft: ${money(BUDGET - spent())}`; try { await navigator.clipboard.writeText(txt); Curio.toast('Copied! 📋'); } catch (x) { Curio.toast('Could not copy, sorry'); } });
    Curio.store.set('billion:cart:v1', cart);
    const sp = spent();
    if (sp >= 1e6) award('spend');
    if (BUDGET - sp < 100) award('broke');
    if ((cart.tree || 0) >= 1e6) award('trees');
  }
  function setCount(id, n, el) {
    const it = SHOP.find((x) => x.id === id);
    const cur = Number(cart[id]) || 0;
    const left = BUDGET - spent() + cur * it.p;
    n = Math.max(0, Math.min(Math.floor(left / it.p), Math.floor(Number(n) || 0)));
    const up = n > cur;
    cart[id] = n;
    if (n !== cur) {
      Curio.beep(up ? 880 : 330, 0.06, up ? 'triangle' : 'sine', 0.05);
      if (el) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); if (up) coins(el); }
    }
    paintMoney();
  }
  function coins(el) {
    const r = el.getBoundingClientRect();
    for (let i = 0; i < 6; i++) {
      const c = document.createElement('i');
      c.className = 'coin'; c.textContent = '💵';
      c.style.left = `${r.left + r.width / 2}px`; c.style.top = `${r.top + 20}px`;
      c.style.setProperty('--dx', `${(Math.random() - .5) * 120}px`);
      c.style.setProperty('--dy', `${-40 - Math.random() * 80}px`);
      document.body.append(c);
      setTimeout(() => c.remove(), 800);
    }
  }
  grid.addEventListener('click', (e) => {
    const el = e.target.closest('.sp-item'); if (!el) return;
    const id = el.dataset.id, cur = Number(cart[id]) || 0;
    if (e.target.closest('.sp-buy')) setCount(id, cur + (e.shiftKey ? 10 : 1), el);
    else if (e.target.closest('.sp-sell')) setCount(id, cur - (e.shiftKey ? 10 : 1), el);
    else if (e.target.closest('.sp-max')) setCount(id, 1e15, el);
  });
  grid.addEventListener('change', (e) => { const inp = e.target.closest('.sp-n'); if (!inp) return; const el = inp.closest('.sp-item'); setCount(el.dataset.id, inp.value, el); });
  $('spReset').addEventListener('click', () => { cart = {}; paintMoney(); Curio.beep(440, 0.1, 'sine', 0.05); });
  shown = BUDGET - spent();
  paintMoney();

  function hashStr(str) { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rngF(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let x = Math.imul(a ^ a >>> 15, 1 | a); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; }; }
  const today = new Date();
  const dayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  $('dailyLabel').textContent = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const BUCKETS = ['Hundreds', 'Thousands', 'Millions', 'Billions', 'Trillions', 'Quadrillions'];
  const bucketOf = (v) => Math.max(0, Math.min(5, Math.floor(Math.log10(v) / 3)));
  let qMode = 'classic', openPanel = null;
  const Q = { list: [], i: 0, right: 0, log: [], locked: false };
  document.querySelectorAll('#quizPanel .diff').forEach((b) => b.addEventListener('click', () => { qMode = b.dataset.d; document.querySelectorAll('#quizPanel .diff').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); paintQBest(); Curio.beep(520, 0.06, 'sine', 0.05); }));
  function paintQBest() { const b = Curio.getBest(`q-${qMode}`); $('qBest').textContent = b != null ? `Your best: ${b} out of 10` : 'No score yet'; }
  function closePanels() { $('quizPanel').hidden = true; openPanel = null; document.body.style.overflow = ''; }
  $('quizPanel').addEventListener('click', (e) => { if (e.target === $('quizPanel') || e.target.closest('[data-close]')) closePanels(); });
  function openQuiz() { openPanel = $('quizPanel'); openPanel.hidden = false; document.body.style.overflow = 'hidden'; $('qStart').hidden = false; $('qPlay').hidden = true; $('qEnd').hidden = true; paintQBest(); openPanel.querySelector('.panel__x').focus(); Curio.beep(330, 0.15, 'sine', 0.05); }
  $('openQuiz').addEventListener('click', openQuiz);
  $('qGo').addEventListener('click', () => {
    const r = qMode === 'daily' ? rngF(hashStr(`cb-${dayKey}`)) : Math.random;
    const pool = window.CB_QUIZ.slice();
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    Object.assign(Q, { list: pool.slice(0, 10), i: 0, right: 0, log: [] });
    $('qStart').hidden = true; $('qEnd').hidden = true; $('qPlay').hidden = false; nextQ();
  });
  function nextQ() {
    if (Q.i >= Q.list.length) return endQ();
    Q.locked = false;
    const [e, n] = Q.list[Q.i];
    $('qRound').textContent = `${Q.i + 1}/10`; $('qScore').textContent = Q.right;
    $('qCard').innerHTML = `<span>${e}</span><b></b>`; $('qCard').querySelector('b').textContent = n;
    $('qCard').classList.remove('in'); void $('qCard').offsetWidth; $('qCard').classList.add('in');
    $('qOpts').innerHTML = BUCKETS.map((b, k) => `<button type="button" class="qopt" data-k="${k}"><small>${k + 1}</small> ${b}</button>`).join('');
    $('qMsg').textContent = 'How big is it?';
    $('qNext').hidden = true;
  }
  $('qOpts').addEventListener('click', (e) => {
    const b = e.target.closest('.qopt'); if (!b || Q.locked) return;
    Q.locked = true;
    const [, , v, txt] = Q.list[Q.i];
    const ans = bucketOf(v), k = Number(b.dataset.k);
    $('qOpts').querySelectorAll('.qopt').forEach((x) => { x.disabled = true; if (Number(x.dataset.k) === ans) x.classList.add('good'); });
    const ok = k === ans;
    if (ok) { Q.right++; Curio.beep(700 + Q.right * 30, 0.1, 'triangle', 0.07); buzz(12); }
    else { b.classList.add('bad'); Curio.beep(170, 0.25, 'sawtooth', 0.05); buzz([30, 20, 30]); }
    $('qMsg').textContent = `${ok ? 'Yes!' : `${BUCKETS[ans]}.`} It is ${txt}.${!ok ? ` You were off by ${fmt(Math.pow(1000, Math.abs(k - ans)))}×.` : ''}`;
    Q.log.push(ok ? '🟩' : Math.abs(k - ans) === 1 ? '🟨' : '🟥');
    $('qScore').textContent = Q.right;
    Q.i++;
    $('qNext').hidden = false; $('qNext').textContent = Q.i >= 10 ? 'See results ›' : 'Next ›';
    $('qNext').focus({ preventScroll: true });
  });
  $('qNext').addEventListener('click', nextQ);
  function endQ() {
    $('qPlay').hidden = true; $('qEnd').hidden = false;
    const b = Curio.best(`q-${qMode}`, Q.right);
    $('qEndTitle').textContent = Q.right === 10 ? 'You think in exponents' : Q.right >= 7 ? 'Big brain, big numbers' : Q.right >= 4 ? 'Getting the scale of it' : 'Numbers are wild';
    $('qeScore').textContent = `${Q.right}/10`; $('qeBest').textContent = b.best;
    award('quiz'); if (Q.right === 10) { award('perfect'); Curio.confetti(); } if (qMode === 'daily') award('daily');
    [523, 659, 784].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.15, 'triangle', 0.07), i * 100));
  }
  $('qAgain').addEventListener('click', () => { $('qEnd').hidden = true; $('qStart').hidden = false; paintQBest(); });
  $('qShare').addEventListener('click', async () => { try { await navigator.clipboard.writeText(`What a Billion Looks Like · How big is it?${qMode === 'daily' ? ` (daily ${dayKey})` : ''}\n${Q.log.join('')} ${Q.right}/10`); Curio.toast('Copied! 📋'); } catch (x) { Curio.toast('Could not copy, sorry'); } });
  addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape') { closePanels(); return; }
    if (openPanel) { if (!$('qPlay').hidden && /^[1-6]$/.test(e.key)) { const b = $('qOpts').children[Number(e.key) - 1]; if (b && !b.disabled) b.click(); } else if (e.key === 'Enter' && !$('qNext').hidden && e.target !== $('qNext')) $('qNext').click(); return; }
    if (e.target.matches('input, textarea, select')) return;
    if (e.key.toLowerCase() === 'q') openQuiz();
  });
})();
