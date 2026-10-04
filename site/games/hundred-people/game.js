(() => {
  const SIMPLE = Curio.simple;
  const KEEP = ['start', 'sex', 'age', 'cont', 'country', 'urban', 'net', 'power', 'water', 'read', 'poor', 'hand', 'red', 'space', 'end'];
  const FACTS = SIMPLE ? window.HP.FACTS.filter((f) => KEEP.includes(f.id)) : window.HP.FACTS;
  const $ = (id) => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  const svg = $('village');
  const buzz = (ms) => { try { if (!Curio.muted && navigator.vibrate) navigator.vibrate(ms); } catch (x) {} };
  const SKIN = ['#f3d2b3', '#e8b98f', '#c98e62', '#a96f45', '#7d4e2f', '#5a3620'];
  const HAIR = ['#2a1d14', '#4a2f1d', '#1c1c1c', '#7a4a24', '#c9a26b', '#b5462a', '#8f8f8f'];
  const COLS = 10, X0 = 15, Y0 = 50, DX = 19.4, DY = 24.2;
  const slotXY = (s) => [X0 + (s % COLS) * DX, Y0 + Math.floor(s / COLS) * DY];

  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function perm(seed) { const r = rng(seed); const a = Array.from({ length: 100 }, (_, i) => i); for (let i = 99; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  const ident = Array.from({ length: 100 }, (_, i) => { const r = rng(1000 + i); return { skin: SKIN[Math.floor(r() * SKIN.length)], hair: HAIR[Math.floor(r() * HAIR.length)], style: Math.floor(r() * 4), blink: r() * 6 }; });

  svg.innerHTML = `<defs><linearGradient id="hpSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="sk1"/><stop offset="1" class="sk2"/></linearGradient><radialGradient id="hpSun"><stop offset="0" stop-color="#fff6c9"/><stop offset=".6" stop-color="#ffd23f"/><stop offset="1" stop-color="#ffd23f" stop-opacity="0"/></radialGradient></defs>
    <rect x="0" y="0" width="220" height="300" rx="14" fill="url(#hpSky)"/>
    <circle cx="186" cy="16" r="14" fill="url(#hpSun)" class="hp-sun"/>
    <g class="hp-cloud"><path d="M30 16q3-8 11-6 4-6 11-2 8-1 8 6 6 1 4 6H29q-5-1 1-4z" fill="#fff" opacity=".85"/></g>
    <path d="M0 40 Q40 22 80 34 T160 30 T220 34 V300 H0Z" class="hp-hill"/>
    <g transform="translate(18 18)"><rect x="0" y="8" width="18" height="14" fill="#f2e6d0"/><path d="M-3 9 L9 0 L21 9Z" fill="#c0453a"/><rect x="7" y="14" width="4" height="8" fill="#7a4a2a"/></g>
    <g transform="translate(98 16)"><rect x="0" y="8" width="22" height="16" fill="#e6efe0"/><path d="M-3 9 L11 -2 L25 9Z" fill="#3a6fb0"/><rect x="4" y="12" width="5" height="5" fill="#9fd4ff"/><rect x="13" y="12" width="5" height="5" fill="#9fd4ff"/></g>
    <g transform="translate(150 20)"><rect x="-1.5" y="8" width="3" height="10" fill="#7a4a2a"/><circle cy="5" r="7" fill="#3f8a4a"/></g>
    <g transform="translate(66 22)"><rect x="-1.5" y="6" width="3" height="10" fill="#7a4a2a"/><circle cy="4" r="6" fill="#4a9a52"/></g>
    <rect x="4" y="44" width="212" height="252" rx="12" class="hp-ground"/>
    <g id="hpPeople"></g>`;
  const layer = svg.querySelector('#hpPeople');
  const people = ident.map((id, i) => {
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'hp-person');
    g.dataset.i = i;
    const hairPath = ['M5.3 6 Q10 -1.5 14.7 6 Q14 2.5 10 2.4 Q6 2.5 5.3 6Z', 'M5 7 Q5 0.5 10 1.6 Q15 0.5 15 7 L15 10 Q14 4 10 4 Q6 4 5 10Z', 'M5.4 5 Q10 0 14.6 5 L15.5 3.8 Q10 -2.5 4.5 3.8Z', 'M5.3 6 Q10 -1 14.7 6 Q13 3 10 3 Q7 3 5.3 6Z M14 4 Q18 6 16 12 Q16 8 14 7Z'][id.style];
    g.innerHTML = `<g class="hp-in" style="animation-delay:-${id.blink.toFixed(2)}s"><ellipse cx="10" cy="24.6" rx="6" ry="1.4" class="hp-shadow"/><path class="hp-p" d="M3.6 24 V18.6 a6.4 6.4 0 0 1 12.8 0 V24 z"/><circle cx="10" cy="7" r="4.6" fill="${id.skin}"/><path d="${hairPath}" fill="${id.hair}"/><g class="hp-eyes" style="animation-delay:${id.blink.toFixed(2)}s"><circle cx="8.3" cy="7.4" r=".7" fill="#1d1b19"/><circle cx="11.7" cy="7.4" r=".7" fill="#1d1b19"/></g></g><rect x="2" y="0" width="16" height="25" fill="transparent"/>`;
    layer.append(g);
    return { g, body: g.querySelector('.hp-p'), slot: i };
  });
  const place = (p, s, delay) => { const [x, y] = slotXY(s); p.slot = s; p.g.style.transitionDelay = `${delay}ms`; p.g.style.transform = `translate(${x - 10}px, ${y}px)`; };
  people.forEach((p, i) => place(p, i, 0));

  const P0 = perm(77);
  const member = FACTS.map((f, idx) => {
    const lab = new Array(100).fill(null);
    if (f.seg) {
      let k = 0;
      for (const [l, n] of f.seg) for (let j = 0; j < n; j++) lab[P0[k++]] = l;
    } else {
      const order = f.base ? P0 : perm(500 + idx * 31);
      let k = 0;
      for (const [l, n] of f.g) for (let j = 0; j < n && k < 100; j++) lab[order[k++]] = l;
    }
    return lab;
  });
  const colourOf = (f, l) => { const g = f.g.find((x) => x[0] === l); return g ? g[2] : 'var(--hp-rest)'; };

  const factsEl = $('facts');
  const dots = $('dots');
  FACTS.forEach((f, idx) => {
    const sec = document.createElement('section');
    sec.className = 'hp-fact';
    sec.dataset.i = idx;
    const total = f.g.reduce((s, x) => s + x[1], 0);
    const items = f.g.map(([label, n, col]) => `<li><i style="background:${col}"></i><b>${n}</b><span>${label}</span></li>`).join('');
    const rest = total < 100 ? `<li class="rest"><i style="background:var(--hp-rest)"></i><b>${100 - total}</b><span>${f.rest || 'everyone else'}</span></li>` : '';
    sec.innerHTML = `<div class="c-card ${f.end ? 'hp-end' : ''}"><div class="hp-emoji" aria-hidden="true">${f.e}</div>
      ${f.q ? `<div class="hp-guess"><p class="hp-q"></p><div class="hp-gval"><b>50</b><span>of 100</span></div><input type="range" min="0" max="100" value="50" aria-label="Your guess"><button class="c-btn" type="button">Reveal</button></div>` : ''}
      <div class="hp-body"><h2></h2><p class="hp-p2"></p>${f.end ? '' : `<ul class="hp-legend">${items}${rest}</ul>`}${f.s ? '<small class="hp-src"></small>' : ''}</div>
      ${f.end ? '<div class="hp-score" id="score"></div><div class="c-row"><button class="c-btn" type="button" id="again">Walk through again</button><button class="c-btn c-btn--ghost" type="button" id="shuffle">Shuffle the villagers</button><button class="c-btn c-btn--ghost" type="button" id="share" hidden>Copy my score</button></div>' : ''}</div>`;
    sec.querySelector('h2').textContent = f.t;
    sec.querySelector('.hp-p2').textContent = f.p;
    if (f.s) sec.querySelector('.hp-src').textContent = 'Source: ' + f.s;
    if (f.q) {
      sec.querySelector('.hp-q').textContent = f.q;
      const r = sec.querySelector('input'), val = sec.querySelector('.hp-gval b');
      r.addEventListener('input', () => { val.textContent = r.value; Curio.beep(300 + Number(r.value) * 6, 0.02, 'sine', 0.025); });
      sec.querySelector('.hp-guess .c-btn').addEventListener('click', () => reveal(idx, Number(r.value)));
    }
    if (idx === 0) {
      const hint = document.createElement('div');
      hint.className = 'hp-hint'; hint.textContent = 'Scroll down ↓';
      sec.querySelector('.c-card').append(hint);
    }
    factsEl.append(sec);
    const d = document.createElement('button');
    d.type = 'button'; d.className = 'hp-dot'; d.setAttribute('aria-label', `Go to: ${f.t}`); d.title = f.t;
    d.addEventListener('click', () => goTo(idx));
    dots.append(d);
  });
  const sections = [...document.querySelectorAll('.hp-fact')];

  const SKEY = 'hp:save:v1';
  let save = Curio.store.get(SKEY, null);
  if (!save || typeof save !== 'object') save = {};
  save.met = Array.isArray(save.met) ? save.met : [];
  save.badges = save.badges && typeof save.badges === 'object' ? save.badges : {};
  const persist = () => Curio.store.set(SKEY, save);
  const BADGES = [
    { id: 'end', e: '🌍', name: 'Village tour', d: 'Walk through every fact' },
    { id: 'meet', e: '👋', name: 'Neighbourly', d: 'Meet 10 villagers' },
    { id: 'meet50', e: '🤝', name: 'Mayor', d: 'Meet 50 villagers' },
    { id: 'guess', e: '🎯', name: 'Guesser', d: 'Finish the village in guess mode' },
    { id: 'sharp', e: '🧠', name: 'Sharp eye', d: 'Score 75% or more in guess mode' },
    { id: 'bull', e: '🎯', name: 'Spot on', d: 'Guess a number exactly' },
    { id: 'shuffle', e: '🔀', name: 'Mix it up', d: 'Shuffle the villagers' }
  ];
  function award(id) {
    if (save.badges[id]) return;
    const b = BADGES.find((x) => x.id === id); if (!b) return;
    save.badges[id] = Date.now(); persist(); paintBadges();
    Curio.toast(`${b.e} Badge: ${b.name}`, 2400);
    [784, 988, 1318].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.14, 'triangle', 0.06), i * 90));
    buzz([20, 40, 20]);
  }
  function paintBadges() { $('badgeCount').textContent = `${BADGES.filter((b) => save.badges[b.id]).length}/${BADGES.length}`; $('metCount').textContent = save.met.length; }
  $('badgesBtn').addEventListener('click', () => {
    const box = document.createElement('div'); box.className = 'badgeList';
    BADGES.forEach((b) => { const d = document.createElement('div'); if (!save.badges[b.id]) d.className = 'off'; d.innerHTML = `<i>${b.e}</i><div><b></b><span></span></div>`; d.querySelector('b').textContent = b.name; d.querySelector('span').textContent = b.d; box.append(d); });
    Curio.modal({ emoji: '🏅', title: 'Badges', body: box, buttons: [{ label: 'Close', value: 0 }] });
  });
  paintBadges();

  let guessMode = false;
  const guesses = {};
  function setGuess(on) {
    guessMode = on;
    document.body.classList.toggle('guessing', on);
    $('guessBtn').setAttribute('aria-pressed', String(on));
    $('guessBtn').textContent = on ? '🎯 Guess mode: on' : '🎯 Guess mode: off';
    sections.forEach((s) => s.classList.toggle('revealed', !on || guesses[s.dataset.i] != null || !FACTS[s.dataset.i].q));
    const i = current; current = -1; show(i, true);
    paintScore();
    Curio.beep(on ? 700 : 400, 0.08, 'triangle', 0.06);
  }
  $('guessBtn').addEventListener('click', () => {
    if (!guessMode && Object.keys(guesses).length) Object.keys(guesses).forEach((k) => delete guesses[k]);
    setGuess(!guessMode);
    if (guessMode) goTo(1);
  });
  const answerOf = (f) => f.ans != null ? f.ans : f.g[0][1];
  function reveal(idx, v) {
    if (guesses[idx] != null) return;
    const f = FACTS[idx];
    const a = answerOf(f);
    const pts = Math.max(0, 100 - Math.abs(v - a) * 3);
    guesses[idx] = { v, a, pts };
    const sec = sections[idx];
    sec.classList.add('revealed');
    const res = document.createElement('p');
    res.className = 'hp-res';
    res.textContent = v === a ? `Spot on! Exactly ${a}. +100` : `You said ${v}, it is ${a}. +${pts}`;
    sec.querySelector('.hp-guess').append(res);
    sec.querySelector('.hp-guess .c-btn').disabled = true;
    sec.querySelector('.hp-guess input').disabled = true;
    if (v === a) { award('bull'); Curio.confetti(50); [880, 1175, 1568].forEach((fq, i) => setTimeout(() => Curio.beep(fq, 0.12, 'triangle', 0.07), i * 70)); }
    else if (pts >= 70) Curio.beep(700, 0.12, 'triangle', 0.06);
    else { Curio.beep(200, 0.25, 'sawtooth', 0.05); buzz([30, 20, 30]); }
    const i = current; current = -1; show(i, true);
    paintScore();
    if (FACTS.every((x, k) => !x.q || guesses[k] != null)) finishGuess();
  }
  function paintScore() {
    const el = $('score');
    const ks = Object.keys(guesses);
    if (!guessMode || !ks.length) { el.innerHTML = ''; $('share').hidden = true; $('gProg').textContent = ''; return; }
    const tot = ks.reduce((s, k) => s + guesses[k].pts, 0);
    const pct = Math.round(tot / ks.length);
    const n = FACTS.filter((f) => f.q).length;
    $('gProg').textContent = `${ks.length}/${n} guessed · ${pct}%`;
    el.innerHTML = `<div class="hp-ring" style="--p:${pct}"><b>${pct}%</b><span>accuracy</span></div><p>${ks.length} of ${n} guessed. ${pct >= 75 ? 'You know this village well.' : pct >= 50 ? 'Not bad. The world is often better, and sometimes worse, than we think.' : 'The world surprised you. That is the point.'}</p>`;
    $('share').hidden = false;
  }
  function finishGuess() {
    const ks = Object.keys(guesses);
    const pct = Math.round(ks.reduce((s, k) => s + guesses[k].pts, 0) / ks.length);
    const b = Curio.best('guess', pct);
    award('guess');
    if (pct >= 75) award('sharp');
    Curio.toast(b.isNew ? `New best: ${pct}% 🎯` : `You scored ${pct}% (best ${b.best}%)`, 2600);
  }

  let current = -1, gestured = false, partied = false;
  ['pointerdown', 'keydown', 'touchstart'].forEach((ev) => addEventListener(ev, () => { gestured = true; }, { once: true, passive: true }));
  const shuffles = { n: 0 };
  function show(idx, quiet) {
    if (idx === current) return;
    current = idx;
    const f = FACTS[idx];
    const hidden = guessMode && f.q && guesses[idx] == null;
    const lab = member[idx];
    const order = [...f.g.map((x) => x[0]), null];
    const groups = order.map((l) => people.filter((p, i) => lab[(i + shuffles.n * 37) % 100] === l).sort((a, b) => a.slot - b.slot));
    let s = 0;
    groups.forEach((grp) => grp.forEach((p) => {
      const i = Number(p.g.dataset.i);
      const l = lab[(i + shuffles.n * 37) % 100];
      p.body.style.fill = hidden ? 'var(--hp-hidden)' : colourFor(f, l);
      const old = p.slot;
      place(p, hidden ? i : s, Math.min(500, Math.abs(old - s) * 3) + (i % 10) * 6);
      p.g.classList.toggle('walk', old !== (hidden ? i : s));
      s++;
    }));
    setTimeout(() => people.forEach((p) => p.g.classList.remove('walk')), 1100);
    $('capTitle').textContent = hidden ? 'Make your guess...' : f.t;
    $('capNum').textContent = `${idx + 1} / ${FACTS.length}`;
    [...dots.children].forEach((d, i) => { d.classList.toggle('on', i === idx); d.classList.toggle('seen', i <= maxSeen); });
    sections.forEach((sct) => sct.classList.toggle('on', +sct.dataset.i === idx));
    if (!quiet && gestured) Curio.beep(380 + idx * 18, 0.06, 'triangle', 0.06);
    if (f.end && !quiet && !partied) { partied = true; Curio.confetti(80); award('end'); }
    if (openId != null) paintProfile(openId);
  }
  function colourFor(f, l) { return l == null ? 'var(--hp-rest)' : colourOf(f, l); }
  let maxSeen = 0;

  function pick() {
    const mid = innerHeight * (innerWidth <= 760 ? 0.68 : 0.5);
    let best = 0, bestD = Infinity;
    sections.forEach((s, i) => {
      const r = s.querySelector('.c-card').getBoundingClientRect();
      const d = Math.abs((r.top + r.bottom) / 2 - mid);
      if (d < bestD) { bestD = d; best = i; }
    });
    maxSeen = Math.max(maxSeen, best);
    show(best);
  }
  let ticking = false;
  addEventListener('scroll', () => { if (ticking) return; ticking = true; requestAnimationFrame(() => { ticking = false; pick(); }); }, { passive: true });
  addEventListener('resize', pick);
  function goTo(i) {
    i = Math.max(0, Math.min(FACTS.length - 1, i));
    const card = sections[i].querySelector('.c-card');
    const r = card.getBoundingClientRect();
    const mid = innerHeight * (innerWidth <= 760 ? 0.68 : 0.5);
    scrollTo({ top: scrollY + (r.top + r.bottom) / 2 - mid, behavior: 'smooth' });
  }

  let openId = null;
  const pop = $('profile');
  function paintProfile(i) {
    const id = ident[i];
    const rows = FACTS.map((f, k) => ({ f, k })).filter(({ f, k }) => f.prof && k <= Math.max(maxSeen, current));
    const lab = (k) => member[k][(i + shuffles.n * 37) % 100];
    pop.querySelector('.pf-av').innerHTML = `<svg viewBox="0 0 20 26"><path d="M3.6 24 V18.6 a6.4 6.4 0 0 1 12.8 0 V24 z" fill="${current >= 0 ? colourFor(FACTS[current], lab(current)) : '#06b37e'}"/><circle cx="10" cy="7" r="4.6" fill="${id.skin}"/><circle cx="8.3" cy="7.4" r=".7" fill="#1d1b19"/><circle cx="11.7" cy="7.4" r=".7" fill="#1d1b19"/></svg>`;
    pop.querySelector('.pf-name').textContent = `Villager #${i + 1}`;
    const list = pop.querySelector('.pf-list');
    list.innerHTML = '';
    if (!rows.length) { list.innerHTML = '<li class="c-muted">Keep scrolling to learn about them.</li>'; return; }
    rows.forEach(({ f, k }) => {
      const l = lab(k);
      const li = document.createElement('li');
      li.innerHTML = `<i>${f.e}</i><span></span>`;
      li.querySelector('span').textContent = l == null ? (f.rest || 'everyone else') : l;
      li.style.setProperty('--c', colourFor(f, l));
      list.append(li);
    });
  }
  layer.addEventListener('click', (e) => {
    const g = e.target.closest('.hp-person'); if (!g) return;
    const i = Number(g.dataset.i);
    openId = i;
    people.forEach((p) => p.g.classList.toggle('sel', p === people[i]));
    paintProfile(i);
    pop.hidden = false;
    pop.classList.remove('in'); void pop.offsetWidth; pop.classList.add('in');
    Curio.beep(520 + (i % 12) * 30, 0.08, 'triangle', 0.06);
    if (!save.met.includes(i)) { save.met.push(i); persist(); paintBadges(); if (save.met.length >= 10) award('meet'); if (save.met.length >= 50) award('meet50'); }
  });
  $('pfClose').addEventListener('click', () => { pop.hidden = true; openId = null; people.forEach((p) => p.g.classList.remove('sel')); });

  $('again').addEventListener('click', () => { scrollTo({ top: 0, behavior: 'smooth' }); });
  $('shuffle').addEventListener('click', () => {
    shuffles.n++;
    const i = current; current = -1; show(i, true);
    Curio.beep(660, 0.08, 'triangle', 0.08);
    award('shuffle');
  });
  $('share').addEventListener('click', async () => {
    const ks = Object.keys(guesses);
    const pct = Math.round(ks.reduce((s, k) => s + guesses[k].pts, 0) / Math.max(1, ks.length));
    const row = FACTS.map((f, k) => guesses[k] ? (guesses[k].pts >= 100 ? '🎯' : guesses[k].pts >= 70 ? '🟩' : guesses[k].pts >= 40 ? '🟨' : '🟥') : '').join('');
    try { await navigator.clipboard.writeText(`If the World Were 100 People · guess mode\n${row}\n${pct}% accurate`); Curio.toast('Copied! 📋'); } catch (x) { Curio.toast('Could not copy, sorry'); }
  });
  addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    const k = e.key.toLowerCase();
    if (k === 'j' || k === 'n') goTo(current + 1);
    else if (k === 'k' || k === 'p') goTo(current - 1);
    else if (k === 'g' && !SIMPLE) $('guessBtn').click();
    else if (e.key === 'Escape') $('pfClose').click();
  });

  let auto = 0;
  function autoStop() { clearInterval(auto); auto = 0; $('playBtn').textContent = '▶ Play the slideshow'; $('playBtn').setAttribute('aria-pressed', 'false'); }
  function autoStep() { if (current >= FACTS.length - 1) { autoStop(); return; } goTo(current + 1); }
  $('playBtn').addEventListener('click', () => {
    if (auto) { autoStop(); return; }
    gestured = true;
    $('playBtn').textContent = '⏸ Pause'; $('playBtn').setAttribute('aria-pressed', 'true');
    if (current >= FACTS.length - 1) goTo(0); else goTo(current + 1);
    auto = setInterval(autoStep, 5200);
  });
  ['wheel', 'touchstart'].forEach((ev) => addEventListener(ev, () => { if (auto) autoStop(); }, { passive: true }));
  document.addEventListener('visibilitychange', () => { if (document.hidden && auto) autoStop(); });
  if (SIMPLE) addEventListener('keydown', (e) => { if (e.key === ' ' && !(e.target.closest && e.target.closest('button, input'))) { e.preventDefault(); $('playBtn').click(); } });
  show(0, true);
  requestAnimationFrame(pick);
})();
