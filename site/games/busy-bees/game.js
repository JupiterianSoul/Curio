(() => {
  const C = window.Curio;
  const adv = C.advanced;
  const $ = (s) => document.querySelector(s);
  const buzz = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch {} };
  const GOAL = 3000;
  const SEASON_LEN = 50;
  const SEASONS = [['spring', 'Spring', 1.2], ['summer', 'Summer', 1.5], ['autumn', 'Autumn', 0.8], ['winter', 'Winter', 0]];
  const SAVE = 'bb:adv:v1';

  const fresh = () => ({ honey: 0, total: 0, bees: 1, combs: 0, paws: 0, flowers: [], queen: 0, wrap: 0, smoker: 0, keeper: 0, t: 0, year: 1, nurseT: 0, waspT: 25, winterBad: 0, startedAt: Date.now(), done: false, peak: 1 });
  let S = adv ? Object.assign(fresh(), C.store.get(SAVE, {})) : fresh();

  const FLOWERS = [
    { id: 'clover', name: 'Clover patch', ico: '🍀', cost: 60, mult: 1.3, note: 'Bees gather 30% faster.' },
    { id: 'lavender', name: 'Lavender rows', ico: '💜', cost: 300, mult: 1.5, note: 'Bees gather 50% faster.' },
    { id: 'sunflower', name: 'Sunflower field', ico: '🌻', cost: 1200, mult: 2, note: 'Doubles what bees bring home.' },
    { id: 'orchard', name: 'Cherry orchard', ico: '🌸', cost: 5000, mult: 2.5, note: 'A pink cloud of blossom.' }
  ];
  const fmt = (n) => { n = Math.floor(n); if (n < 1000) return String(n); if (n < 1e6) return `${(n / 1000).toFixed(n < 1e4 ? 1 : 0)}k`; return `${(n / 1e6).toFixed(1)}M`; };
  const cap = () => (200 + S.combs * 320 + S.combs * S.combs * 90) * (S.bigHive ? 1.5 : 1);
  const flowerMult = () => FLOWERS.reduce((m, f) => (S.flowers.includes(f.id) ? m * f.mult : m), 1);
  const seasonIdx = () => Math.max(0, Math.floor(S.t / SEASON_LEN)) % 4;
  const season = () => (adv ? SEASONS[seasonIdx()] : SEASONS[1]);
  const gather = () => S.bees * 0.35 * flowerMult() * (adv ? season()[2] : 1);
  const eat = () => (adv && season()[0] === 'winter' ? S.bees * 0.12 * (S.wrap ? 0.5 : 1) : 0);
  const rate = () => gather() - eat();
  const tapValue = () => (1 + S.bees * 0.05) * Math.pow(2, S.paws) * (adv && season()[0] === 'winter' ? 0.5 : 1);

  const SHOP = [
    { key: 'bee', ico: '🐝', name: 'Worker bee', note: () => `+${(0.35 * flowerMult()).toFixed(2)} honey a second each.`, cost: () => Math.round(12 * Math.pow(1.13, S.bees - 1)), can: () => true, buy: () => { S.bees++; } },
    { key: 'comb', ico: '🍯', name: 'Comb frame', note: () => `More room. Space for ${fmt(cap() + 320 + (2 * S.combs + 1) * 90)} honey.`, cost: () => Math.round(30 * Math.pow(1.5, S.combs)), can: () => true, buy: () => { S.combs++; } },
    { key: 'paws', ico: '🖐️', name: 'Stickier paws', note: () => 'Each tap of the hive is worth double.', cost: () => [40, 400, 4000, 40000][S.paws], can: () => S.paws < 4, buy: () => { S.paws++; } },
    ...FLOWERS.map((f) => ({ key: f.id, ico: f.ico, name: f.name, note: () => f.note, cost: () => f.cost, can: () => !S.flowers.includes(f.id), buy: () => { S.flowers.push(f.id); paintFlowers(); } })),
    { key: 'queen', ico: '👑', name: 'Royal nursery', note: () => 'The queen lays a free bee every 8 seconds.', cost: () => 800, can: () => !S.queen, buy: () => { S.queen = 1; } },
    { key: 'wrap', ico: '🧣', name: 'Straw insulation', note: () => 'Bees eat half as much in winter.', cost: () => 250, can: () => !S.wrap, buy: () => { S.wrap = 1; }, adv: true },
    { key: 'smoker', ico: '💨', name: 'Smoker', note: () => 'Wasps leave after 3 taps instead of 5.', cost: () => 600, can: () => !S.smoker, buy: () => { S.smoker = 1; }, adv: true },
    { key: 'bigHive', ico: '🏠', name: 'Second storey', note: () => 'All comb space is 50% bigger.', cost: () => 2500, can: () => !S.bigHive, buy: () => { S.bigHive = 1; }, adv: true },
    { key: 'keeper', ico: '🧑‍🌾', name: 'Beekeeper', note: () => 'Taps the hive for you, three times a second.', cost: () => 4000, can: () => !S.keeper, buy: () => { S.keeper = 1; }, adv: true }
  ].filter((x) => adv || !x.adv);

  const els = { scene: $('#scene'), hive: $('#hive'), bees: $('#bees'), fx: $('#fx'), shop: $('#shop'), comb: $('#comb'), flowers: $('#flowers') };

  function sound(kind) {
    if (C.muted) return;
    const ac = C.audioContext(); if (!ac) return;
    const t = ac.currentTime;
    if (kind === 'bzz') {
      const o = ac.createOscillator(), l = ac.createOscillator(), lg = ac.createGain(), g = ac.createGain(), f = ac.createBiquadFilter();
      o.type = 'sawtooth'; o.frequency.value = 190 + Math.random() * 40;
      l.frequency.value = 28; lg.gain.value = 18; l.connect(lg).connect(o.frequency);
      f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 2;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      o.connect(f).connect(g).connect(ac.destination); o.start(t); l.start(t); o.stop(t + 0.2); l.stop(t + 0.2);
    } else if (kind === 'buy') { C.sfx('pop'); setTimeout(() => C.beep(1046, 0.1, 'triangle', 0.05), 60); }
    else if (kind === 'big') C.sfx('success');
    else if (kind === 'bad') C.sfx('error');
    else if (kind === 'full') C.beep(330, 0.12, 'triangle', 0.05);
  }

  const beeSvg = '<svg viewBox="0 0 22 18"><ellipse cx="9" cy="5" rx="5" ry="4" fill="#fff" fill-opacity=".85" stroke="#3a2410" stroke-width="1"/><ellipse cx="14" cy="5" rx="4" ry="3.4" fill="#fff" fill-opacity=".85" stroke="#3a2410" stroke-width="1"/><ellipse cx="11" cy="11" rx="8" ry="5.5" fill="#f5b324" stroke="#3a2410" stroke-width="1.4"/><path d="M8 6.5v9M12 6v10" stroke="#3a2410" stroke-width="2"/><circle cx="18" cy="10" r="1.2" fill="#3a2410"/></svg>';
  const sprites = [];
  function syncBees() {
    const want = Math.min(26, Math.max(1, Math.round(Math.sqrt(S.bees) * 3)));
    while (sprites.length < want) {
      const el = document.createElement('div');
      el.className = 'bb-bee';
      el.innerHTML = beeSvg;
      els.bees.append(el);
      sprites.push({ el, p: Math.random(), sp: 0.12 + Math.random() * 0.12, tx: Math.random(), wob: Math.random() * 6 });
    }
    while (sprites.length > want) sprites.pop().el.remove();
  }
  function moveBees(dt, now) {
    const w = els.scene.clientWidth, h = els.scene.clientHeight;
    const hx = w / 2, hy = h * 0.5;
    const winter = adv && season()[0] === 'winter';
    for (const b of sprites) {
      b.p += dt * b.sp * (winter ? 0.25 : 1);
      if (b.p >= 1) { b.p = 0; b.tx = Math.random(); }
      const out = b.p < 0.5 ? b.p * 2 : (1 - b.p) * 2;
      const fx = 20 + b.tx * (w - 40), fy = h * 0.82 + Math.sin(b.tx * 20) * 18;
      const r = winter ? 0.12 : 1;
      const x = hx + (fx - hx) * out * r + Math.sin(now / 300 + b.wob) * 10;
      const y = hy + (fy - hy) * out * r + Math.sin(out * Math.PI) * -60 * r + Math.cos(now / 240 + b.wob) * 6;
      const flip = (b.p < 0.5) === (fx > hx) ? 1 : -1;
      b.el.style.transform = `translate(${x - 11}px, ${y - 9}px) scaleX(${flip})`;
    }
  }

  function flowerSvg(kind, k) {
    const st = 'stroke="#3a2410" stroke-width="1.6"';
    if (kind === 'clover') return `<svg viewBox="0 0 34 60"><path d="M17 60V34" stroke="#3a7d32" stroke-width="3"/><g fill="#ff9fc4" ${st}><circle cx="17" cy="26" r="6"/><circle cx="12" cy="30" r="5"/><circle cx="22" cy="30" r="5"/></g></svg>`;
    if (kind === 'lavender') return `<svg viewBox="0 0 34 60"><path d="M17 60V18" stroke="#3a7d32" stroke-width="3"/><g fill="#9d72ff" ${st}><ellipse cx="17" cy="14" rx="4" ry="6"/><ellipse cx="17" cy="24" rx="4.5" ry="5"/><ellipse cx="17" cy="33" rx="4" ry="4.5"/></g></svg>`;
    if (kind === 'sunflower') return `<svg viewBox="0 0 34 60" style="overflow:visible"><path d="M17 60V24" stroke="#3a7d32" stroke-width="4"/><g fill="#ffc300" ${st}>${Array.from({ length: 10 }, (_, i) => `<ellipse cx="17" cy="9" rx="3.5" ry="7" transform="rotate(${i * 36} 17 18)"/>`).join('')}</g><circle cx="17" cy="18" r="6" fill="#6b3e1f" ${st}/></svg>`;
    if (kind === 'orchard') return `<svg viewBox="0 0 34 60" style="overflow:visible"><path d="M17 60V30" stroke="#7a4a26" stroke-width="5"/><g fill="#ffc2dd" ${st}><circle cx="17" cy="14" r="12"/><circle cx="6" cy="24" r="9"/><circle cx="28" cy="24" r="9"/></g><g fill="#ff6fa8"><circle cx="13" cy="12" r="2"/><circle cx="22" cy="18" r="2"/><circle cx="6" cy="24" r="2"/></g></svg>`;
    const c = ['#ffffff', '#ffe066', '#ff8fab'][k % 3];
    return `<svg viewBox="0 0 34 60"><path d="M17 60V30" stroke="#3a7d32" stroke-width="3"/><g fill="${c}" ${st}>${Array.from({ length: 6 }, (_, i) => `<ellipse cx="17" cy="18" rx="3.5" ry="6" transform="rotate(${i * 60} 17 24)"/>`).join('')}</g><circle cx="17" cy="24" r="3.5" fill="#ffb703" ${st}/></svg>`;
  }
  function paintFlowers() {
    const kinds = ['daisy', ...S.flowers];
    let html = '';
    kinds.forEach((kind, ki) => {
      const n = kind === 'daisy' ? 5 : kind === 'orchard' ? 3 : 6;
      for (let i = 0; i < n; i++) {
        const x = ((i * 37 + ki * 53) % 96) + 1;
        const s = kind === 'sunflower' ? 1.5 : kind === 'orchard' ? 1.9 : 1;
        html += `<div class="bb-flower" style="left:${x}%;bottom:${(i % 3) * 5}%;transform:scale(${s});animation-delay:${-(i * 0.7 + ki)}s">${flowerSvg(kind, i)}</div>`;
      }
    });
    els.flowers.innerHTML = html;
  }

  let combShown = -1;
  function paintComb() {
    const cols = 14, rows = 4, total = cols * rows;
    const filled = Math.round((S.honey / cap()) * total);
    if (filled === combShown) return;
    combShown = filled;
    const r = 11, hw = r * Math.sqrt(3);
    let cells = '';
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const i = y * cols + x;
      const cx = 12 + x * hw + (y % 2 ? hw / 2 : 0), cy = 13 + y * r * 1.5;
      const pts = Array.from({ length: 6 }, (_, k) => { const a = Math.PI / 3 * k + Math.PI / 6; return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`; }).join(' ');
      const on = i < filled;
      cells += `<polygon points="${pts}" fill="${on ? (i === filled - 1 ? '#f8c84a' : '#f5b324') : 'var(--bb-wax)'}" stroke="#c88a1a" stroke-width="2"/>`;
    }
    els.comb.innerHTML = `<svg viewBox="0 0 ${12 + cols * hw + hw / 2 + 2} ${rows * r * 1.5 + 12}" preserveAspectRatio="xMidYMid meet">${cells}</svg>`;
    els.comb.setAttribute('aria-label', `Honeycomb ${Math.round((S.honey / cap()) * 100)}% full`);
  }

  function addHoney(n) {
    const c = cap();
    const room = Math.max(0, c - S.honey);
    const got = Math.min(room, n);
    S.honey += got;
    S.total += got;
    return got;
  }

  function pop(text, x, y) {
    const el = document.createElement('span');
    el.className = 'bb-pop';
    el.textContent = text;
    el.style.left = `${x}px`; el.style.top = `${y}px`;
    els.fx.append(el);
    setTimeout(() => el.remove(), 900);
  }

  let fullWarned = 0;
  function tap(e) {
    const got = addHoney(tapValue());
    const r = els.scene.getBoundingClientRect();
    const x = e && e.clientX ? e.clientX - r.left - 10 : r.width / 2 + C.rand(-40, 40);
    const y = e && e.clientY ? e.clientY - r.top - 30 : r.height * 0.35;
    if (got > 0) { pop(`+${got < 10 ? got.toFixed(1).replace(/\.0$/, '') : fmt(got)}`, x, y); sound('bzz'); }
    else if (performance.now() - fullWarned > 2500) { fullWarned = performance.now(); C.toast('The comb is full! Buy a comb frame.'); sound('full'); }
    els.hive.classList.remove('is-hit'); void els.hive.offsetWidth; els.hive.classList.add('is-hit');
    buzz(5);
    paint();
  }

  function renderShop() {
    let shown = 0;
    els.shop.innerHTML = SHOP.map((s) => s.can() ? `<button type="button" class="bb-buy" data-k="${s.key}">${++shown <= 9 ? `<kbd>${shown}</kbd>` : ''}<span class="bb-ico" aria-hidden="true">${s.ico}</span><b>${s.name}</b><small>${s.note()}</small><em>${fmt(s.cost())}<i>honey</i></em></button>` : '').join('');
    updateShop();
  }
  function updateShop() {
    els.shop.querySelectorAll('.bb-buy').forEach((b) => {
      const s = SHOP.find((x) => x.key === b.dataset.k);
      b.disabled = s.cost() > S.honey;
    });
  }
  function buy(key) {
    const s = SHOP.find((x) => x.key === key);
    if (!s || !s.can()) return;
    const c = s.cost();
    if (c > S.honey) { sound('bad'); return; }
    S.honey -= c;
    s.buy();
    sound('buy');
    syncBees();
    renderShop();
    paint(true);
    save();
  }

  let wasp = null;
  function spawnWasp() {
    if (wasp) return;
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'bb-wasp';
    el.setAttribute('aria-label', 'Wasp! Tap it to chase it away');
    el.innerHTML = '<b>WASP!</b><svg viewBox="0 0 64 56"><ellipse cx="22" cy="14" rx="12" ry="8" fill="#fff" fill-opacity=".8" stroke="#3a2410" stroke-width="2"/><ellipse cx="38" cy="14" rx="10" ry="7" fill="#fff" fill-opacity=".8" stroke="#3a2410" stroke-width="2"/><ellipse cx="30" cy="34" rx="22" ry="12" fill="#ffd60a" stroke="#3a2410" stroke-width="2.5"/><path d="M20 24v20M30 22v24M40 24v20" stroke="#1b1b1b" stroke-width="5"/><circle cx="52" cy="32" r="7" fill="#1b1b1b"/><circle cx="54" cy="30" r="2" fill="#ff3b3b"/><path d="M8 36l-8 4" stroke="#1b1b1b" stroke-width="3"/></svg>';
    els.fx.append(el);
    wasp = { el, hits: 0, need: S.smoker ? 3 : 5, t: 7 };
    const move = () => { if (!wasp) return; el.style.left = `${C.rand(5, 75)}%`; el.style.top = `${C.rand(8, 60)}%`; };
    move();
    wasp.mover = setInterval(move, 900);
    el.addEventListener('click', (e) => { e.stopPropagation(); hitWasp(); });
    sound('bad');
    C.toast('A wasp! Tap it before it steals your honey!', 2200);
  }
  function hitWasp() {
    if (!wasp) return;
    wasp.hits++;
    wasp.el.querySelector('b').textContent = `${wasp.need - wasp.hits} more!`;
    C.sfx('tap');
    if (wasp.hits >= wasp.need) { endWasp(true); }
  }
  function endWasp(won) {
    if (!wasp) return;
    clearInterval(wasp.mover);
    wasp.el.remove();
    wasp = null;
    if (won) { C.toast('Wasp chased off!'); sound('buy'); }
    else { const lost = Math.floor(S.honey * 0.25); S.honey -= lost; C.toast(`The wasp stole ${fmt(lost)} honey.`); sound('bad'); buzz([40, 30, 40]); }
  }

  function paint(force) {
    $('#honey').textContent = fmt(S.honey);
    const r = rate();
    $('#rate').textContent = `${r < 0 ? '' : ''}${Math.abs(r) < 10 ? r.toFixed(1) : fmt(r)}/s`;
    $('#rate').style.color = r < 0 ? 'var(--bad)' : '';
    $('#beeCount').textContent = fmt(S.bees);
    $('#cap').textContent = fmt(cap());
    if (adv) {
      const si = seasonIdx();
      const into = (S.t % SEASON_LEN) / SEASON_LEN;
      $('#goalBar').style.width = `${into * 100}%`;
      const nextName = SEASONS[(si + 1) % 4][1];
      $('#goalText').textContent = `Year ${S.year}, ${season()[1].toLowerCase()}. ${nextName} in ${Math.ceil(SEASON_LEN - (S.t % SEASON_LEN))}s.${si === 2 ? ' Stock up for winter!' : ''}`;
    } else {
      $('#goalBar').style.width = `${Math.min(100, (S.total / GOAL) * 100)}%`;
      $('#goalText').textContent = S.done ? `Big jar filled! Total ${fmt(S.total)} honey.` : `Big jar: ${fmt(S.total)} of ${fmt(GOAL)} honey made`;
    }
    paintComb();
    if (force) renderShop(); else updateShop();
  }

  let lastSeason = -1;
  function seasonTick() {
    const si = seasonIdx();
    if (si === lastSeason) return;
    const was = lastSeason;
    lastSeason = si;
    const [id, name] = SEASONS[si];
    els.scene.dataset.season = id;
    $('#season').textContent = `${['🌷', '☀️', '🍂', '❄️'][si]} ${name}`;
    if (was !== -1) {
      C.toast(id === 'winter' ? 'Winter! No flowers. The bees huddle and eat honey.' : id === 'spring' ? `Spring of year ${S.year}. The colony survived!` : `${name} is here.`, 2600);
      if (id === 'spring') { C.confetti(60); sound('big'); C.best('years', S.year); }
    }
  }

  async function collapse() {
    S.done = true;
    const years = S.year - 1;
    const b = C.best('years', years);
    await C.modal({ emoji: '🥀', title: 'The colony is gone', body: `The last bee went quiet in winter. You kept the hive going for ${years} full year${years === 1 ? '' : 's'}, with a peak of ${fmt(S.peak)} bees and ${fmt(S.total)} honey made. Best: ${b.best} year${b.best === 1 ? '' : 's'}.`, buttons: [{ label: 'Start a new hive', value: 'again' }] });
    S = fresh();
    lastSeason = -1;
    syncBees(); paintFlowers(); renderShop(); save();
  }

  async function jarDone() {
    S.done = true;
    const secs = Math.round((Date.now() - S.startedAt) / 1000);
    const b = C.best('jar:simple', secs, false);
    C.confetti(); sound('big');
    const v = await C.modal({ emoji: '🍯', title: 'The big jar is full!', body: `You made ${fmt(GOAL)} honey in ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}. ${b.isNew ? 'A new best time!' : `Best: ${Math.floor(b.best / 60)}:${String(b.best % 60).padStart(2, '0')}.`} Keep buzzing, or start a fresh hive and go faster.`, buttons: [{ label: 'Keep buzzing', value: 'keep' }, { label: 'New hive', value: 'new' }] });
    if (v === 'new') { S = fresh(); syncBees(); paintFlowers(); renderShop(); }
  }

  function save() { if (adv && !S.done) C.store.set(SAVE, S); }

  let last = performance.now(), acc = 0, keeperAcc = 0, saveAcc = 0, uiAcc = 0;
  function loop(now) {
    const dt = Math.max(0, Math.min(0.1, (now - last) / 1000));
    last = now;
    if (!document.hidden && !S.done) {
      S.t += dt;
      const g = gather() * dt;
      if (g > 0) addHoney(g);
      if (adv) {
        const before = S.year;
        S.year = Math.floor(S.t / (SEASON_LEN * 4)) + 1;
        if (S.year !== before) save();
        seasonTick();
        const e = eat() * dt;
        if (e > 0) {
          S.honey -= e;
          if (S.honey < 0) {
            S.honey = 0;
            S.winterBad += dt;
            if (S.winterBad > 2) { S.winterBad = 0; const lost = Math.max(1, Math.ceil(S.bees * 0.12)); S.bees = Math.max(0, S.bees - lost); C.toast(`${lost} bee${lost > 1 ? 's' : ''} froze. Not enough honey!`); sound('bad'); syncBees(); renderShop(); if (S.bees <= 0) collapse(); }
          }
        }
        if (S.keeper) { keeperAcc += dt; while (keeperAcc > 1 / 3) { keeperAcc -= 1 / 3; addHoney(tapValue() * 0.6); } }
        if (['summer', 'autumn'].includes(season()[0]) && S.total > 300) {
          S.waspT -= dt;
          if (S.waspT <= 0) { S.waspT = C.rand(30, 55); spawnWasp(); }
        }
        if (wasp) { wasp.t -= dt; if (wasp.t <= 0) endWasp(false); }
      }
      if (S.queen) { S.nurseT += dt; if (S.nurseT > 8) { S.nurseT = 0; S.bees++; syncBees(); } }
      S.peak = Math.max(S.peak, S.bees);
      if (!adv && !S.done && S.total >= GOAL) jarDone();
      uiAcc += dt;
      if (uiAcc > 0.12) { uiAcc = 0; paint(); }
      saveAcc += dt;
      if (saveAcc > 4) { saveAcc = 0; save(); }
    }
    moveBees(dt, now);
    requestAnimationFrame(loop);
  }

  els.hive.addEventListener('click', tap);
  els.shop.addEventListener('click', (e) => { const b = e.target.closest('.bb-buy'); if (b) buy(b.dataset.k); });
  window.addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('.curio-modal, input, textarea')) return;
    if (e.key === ' ' && !(e.target.closest && e.target.closest('button:not(.bb-hive)'))) { e.preventDefault(); if (!e.repeat) tap(null); }
    else if (/^[1-9]$/.test(e.key)) { const b = els.shop.querySelectorAll('.bb-buy')[+e.key - 1]; if (b) buy(b.dataset.k); }
    else if ((e.key === 'w' || e.key === 'W') && wasp) hitWasp();
  });
  document.addEventListener('visibilitychange', () => { last = performance.now(); if (document.hidden) save(); });
  window.addEventListener('pagehide', save);

  if (adv) $('#sub').textContent = 'Four seasons a year. Gather all summer, because winter has no flowers and hungry bees. How many years can your colony last?';
  if (!adv) els.scene.dataset.season = 'summer';
  syncBees();
  paintFlowers();
  renderShop();
  paint(true);
  requestAnimationFrame(loop);
})();
