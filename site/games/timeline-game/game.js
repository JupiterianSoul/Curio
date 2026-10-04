'use strict';
(() => {
  const C = window.Curio;
  const $ = (id) => document.getElementById(id);
  const EVENTS = window.TIMELINE_EVENTS.map(([year, text, icon, cat], i) => ({ id: i, year, text, icon, cat }));
  const CATS = {
    world: { name: 'World events', short: 'World', c: '#e8833a', g: 'linear-gradient(135deg,#f7b267,#fbe3c0)' },
    sci: { name: 'Science', short: 'Science', c: '#14a37f', g: 'linear-gradient(135deg,#34d399,#ccfbf1)' },
    tech: { name: 'Inventions', short: 'Tech', c: '#3b82f6', g: 'linear-gradient(135deg,#93c5fd,#dbeafe)' },
    space: { name: 'Space', short: 'Space', c: '#7c3aed', g: 'linear-gradient(135deg,#c4b5fd,#ede9fe)' },
    culture: { name: 'Arts', short: 'Arts', c: '#db2777', g: 'linear-gradient(135deg,#f9a8d4,#fce7f3)' },
    pop: { name: 'Pop culture', short: 'Pop', c: '#f97316', g: 'linear-gradient(135deg,#fdba74,#ffedd5)' },
    sport: { name: 'Sport', short: 'Sport', c: '#16a34a', g: 'linear-gradient(135deg,#86efac,#dcfce7)' },
    explore: { name: 'Explorers & Earth', short: 'Explore', c: '#0284c7', g: 'linear-gradient(135deg,#7dd3fc,#e0f2fe)' }
  };
  const DECKS = [
    { id: 'all', name: 'All of history', art: 'world', f: () => true },
    { id: 'ancient', name: 'Ancient world', art: 'culture', f: (e) => e.year < 500 },
    { id: 'medieval', name: 'Middle Ages & Renaissance', art: 'world', f: (e) => e.year >= 500 && e.year < 1700 },
    { id: 'industry', name: 'Revolutions & Industry', art: 'tech', f: (e) => e.year >= 1700 && e.year < 1900 },
    { id: 'c20', name: 'The 20th century', art: 'pop', f: (e) => e.year >= 1900 && e.year < 2000 },
    { id: 'c21', name: 'The 21st century', art: 'tech', f: (e) => e.year >= 2000 },
    { id: 'sci', name: 'Science & medicine', art: 'sci', f: (e) => e.cat === 'sci' },
    { id: 'tech', name: 'Inventions & tech', art: 'tech', f: (e) => e.cat === 'tech' },
    { id: 'space', name: 'Space', art: 'space', f: (e) => e.cat === 'space' },
    { id: 'culture', name: 'Art, books & music', art: 'culture', f: (e) => e.cat === 'culture' },
    { id: 'pop', name: 'Pop culture & games', art: 'pop', f: (e) => e.cat === 'pop' },
    { id: 'sport', name: 'Sport', art: 'sport', f: (e) => e.cat === 'sport' },
    { id: 'explore', name: 'Explorers & Earth', art: 'explore', f: (e) => e.cat === 'explore' },
    { id: 'world', name: 'World events', art: 'world', f: (e) => e.cat === 'world' }
  ];
  const MODES = {
    classic: { name: 'Classic', desc: 'Three lives. How long a timeline can you build?', icon: 'heart' },
    sudden: { name: 'Sudden death', desc: 'One mistake and you\'re history.', icon: 'skull' },
    blitz: { name: 'Blitz', desc: '90 seconds. Right +3s, wrong -10s.', icon: 'clock' },
    daily: { name: 'Daily deck', desc: '12 cards, same for everyone today.', icon: 'cal' }
  };
  const BADGES = [
    { id: 'first', name: 'Time Traveller', desc: 'Place your first card correctly.' },
    { id: 'streak5', name: 'On a Roll', desc: 'Get a streak of 5.' },
    { id: 'streak10', name: 'Historian', desc: 'Get a streak of 10.' },
    { id: 'streak20', name: 'Chronologist', desc: 'Get a streak of 20.' },
    { id: 'classic15', name: 'Long Memory', desc: 'Place 15 cards in Classic.' },
    { id: 'classic30', name: 'Walking Almanac', desc: 'Place 30 cards in Classic.' },
    { id: 'sudden10', name: 'Nerves of Steel', desc: 'Place 10 in Sudden death.' },
    { id: 'blitz15', name: 'Speed Reader', desc: 'Place 15 in a Blitz.' },
    { id: 'daily', name: 'Daily Digest', desc: 'Finish a daily deck.' },
    { id: 'dailyperfect', name: 'Perfect Day', desc: 'Get 12 out of 12 on a daily deck.' },
    { id: 'nohint20', name: 'No Peeking', desc: 'Place 20 cards in one game without hints.' },
    { id: 'close', name: 'Photo Finish', desc: 'Correctly place a card in a gap of 3 years or less.' },
    { id: 'bc', name: 'Before Christ', desc: 'Correctly place 10 BC events in total.' },
    { id: 'decks5', name: 'Deck Hopper', desc: 'Play 5 different decks.' },
    { id: 'deckclear', name: 'Full House', desc: 'Place every card in a deck.' },
    { id: 'cards500', name: 'Five Centuries', desc: 'Place 500 cards correctly in total.' }
  ];
  const SAVE_KEY = 'timeline:save', VER = 2;
  function load() {
    const d = { v: VER, mode: 'classic', deck: 'all', stats: { games: 0, placed: 0, wrong: 0, bestStreak: 0, hints: 0, bc: 0 }, decks: {}, badges: {}, daily: {}, history: [] };
    let s; try { s = C.store.get(SAVE_KEY, null); } catch { s = null; }
    if (!s || typeof s !== 'object') return d;
    if (MODES[s.mode]) d.mode = s.mode;
    if (DECKS.some((x) => x.id === s.deck)) d.deck = s.deck;
    if (s.stats && typeof s.stats === 'object') for (const k in d.stats) if (Number.isFinite(s.stats[k])) d.stats[k] = s.stats[k];
    for (const k of ['decks', 'badges', 'daily']) if (s[k] && typeof s[k] === 'object' && !Array.isArray(s[k])) d[k] = s[k];
    if (Array.isArray(s.history)) d.history = s.history.filter((h) => h && typeof h === 'object').slice(0, 15);
    return d;
  }
  const save = load();
  const persist = () => C.store.set(SAVE_KEY, save);
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function mulberry(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function shuffle(arr, rnd = Math.random) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const fmtYear = (y) => (y < 0 ? `${-y}<small>BC</small>` : y < 1000 ? `${y}<small>AD</small>` : `${y}`);
  const plainYear = (y) => (y < 0 ? `${-y} BC` : y < 1000 ? `AD ${y}` : `${y}`);
  function century(y) {
    if (y < 0) { const c = Math.ceil(-y / 100); return `${ord(c)} century BC`; }
    const c = Math.floor((y - 1) / 100) + 1;
    if (y >= 1000) return `the ${Math.floor(y / 100) * 100}s`;
    return `${ord(Math.max(1, c))} century AD`;
  }
  function ord(n) { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const vib = (p) => { if (navigator.vibrate) try { navigator.vibrate(p); } catch {} };

  const sfx = {
    tone(f, d, type = 'triangle', vol = 0.12, delay = 0, to = 0) {
      if (C.muted) return;
      const ac = C.audioContext(); if (!ac) return;
      const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d + 0.03);
    },
    good(streak) { const b = 523 * Math.pow(2, Math.min(12, streak) / 24); this.tone(b, 0.1); this.tone(b * 1.25, 0.1, 'triangle', 0.1, 0.07); this.tone(b * 1.5, 0.18, 'triangle', 0.1, 0.14); },
    bad() { this.tone(200, 0.35, 'sawtooth', 0.08, 0, 90); this.tone(150, 0.3, 'square', 0.04, 0.05); },
    deal() { this.tone(900, 0.04, 'square', 0.03); this.tone(1300, 0.05, 'triangle', 0.04, 0.03); },
    hint() { [880, 1175, 1568].forEach((f, i) => this.tone(f, 0.12, 'sine', 0.08, i * 0.05)); },
    fanfare() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.11, i * 0.09)); },
    tick() { this.tone(1200, 0.03, 'square', 0.03); },
    whoosh() { this.tone(300, 0.15, 'sine', 0.05, 0, 900); }
  };

  const view = { menu: $('menu'), game: $('game'), result: $('result'), stats: $('stats') };
  function show(name) { for (const k in view) view[k].hidden = k !== name; scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); }

  const ICONS = {
    heart: '<svg viewBox="0 0 40 40"><path d="M20 34S5 25 5 14a8 8 0 0 1 15-4 8 8 0 0 1 15 4c0 11-15 20-15 20z" fill="#ef4444"/><path d="M11 12a4 4 0 0 1 5-2" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".7"/></svg>',
    skull: '<svg viewBox="0 0 40 40"><path d="M20 5c-8 0-13 6-13 13 0 5 3 7 4 9v5h18v-5c1-2 4-4 4-9 0-7-5-13-13-13z" fill="#e5e7eb" stroke="#6b7280" stroke-width="2"/><circle cx="14.5" cy="19" r="4" fill="#374151"/><circle cx="25.5" cy="19" r="4" fill="#374151"/><path d="M17 31v3M20 31v3M23 31v3" stroke="#6b7280" stroke-width="2"/></svg>',
    clock: '<svg viewBox="0 0 40 40"><circle cx="20" cy="22" r="14" fill="#fff" stroke="#f59e0b" stroke-width="3"/><rect x="17" y="3" width="6" height="5" rx="2" fill="#f59e0b"/><path d="M20 22V13M20 22l7 4" stroke="#111" stroke-width="2.6" stroke-linecap="round"/><path d="M29 8l4 4" stroke="#f59e0b" stroke-width="3" stroke-linecap="round"/></svg>',
    cal: '<svg viewBox="0 0 40 40"><rect x="6" y="8" width="28" height="26" rx="5" fill="#fff" stroke="#3b82f6" stroke-width="2.5"/><path d="M6 13a5 5 0 0 1 5-5h18a5 5 0 0 1 5 5v3H6z" fill="#3b82f6"/><rect x="12" y="4" width="3" height="7" rx="1.5" fill="#1e40af"/><rect x="25" y="4" width="3" height="7" rx="1.5" fill="#1e40af"/><text x="20" y="30" font-size="12" font-weight="900" text-anchor="middle" fill="#1e40af" font-family="system-ui">12</text></svg>'
  };
  const heartSvg = '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 34S5 25 5 14a8 8 0 0 1 15-4 8 8 0 0 1 15 4c0 11-15 20-15 20z" fill="#ef4444"/><path d="M11 12a4 4 0 0 1 5-2" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".7"/></svg>';

  const modesEl = document.querySelector('.tl-modes');
  for (const id in MODES) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'tl-mode'; b.setAttribute('role', 'radio'); b.dataset.mode = id;
    b.innerHTML = `${ICONS[MODES[id].icon]}<b></b><small></small>`;
    b.querySelector('b').textContent = MODES[id].name; b.querySelector('small').textContent = MODES[id].desc;
    b.addEventListener('click', () => { save.mode = id; persist(); sfx.tick(); renderMenu(); });
    modesEl.append(b);
  }
  function renderMenu() {
    modesEl.querySelectorAll('.tl-mode').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.mode === save.mode)));
    const wrap = $('decks'); wrap.innerHTML = '';
    const daily = save.mode === 'daily';
    for (const d of DECKS) {
      const n = EVENTS.filter(d.f).length;
      const b = document.createElement('button'); b.type = 'button'; b.className = 'tl-deck'; b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(!daily && save.deck === d.id));
      if (daily) b.setAttribute('disabled', '');
      const best = C.getBest(`${save.mode}-${d.id}`);
      b.innerHTML = `<svg aria-hidden="true"><use href="#art-${d.art}"/></svg><div><b></b><small>${n} cards${best != null ? ` · best <i>${best}</i>` : ''}</small></div>`;
      b.querySelector('b').textContent = d.name;
      b.addEventListener('click', () => { if (daily) return; save.deck = d.id; persist(); sfx.tick(); renderMenu(); });
      wrap.append(b);
    }
    const rec = save.daily[today()];
    $('play').textContent = daily ? (rec ? `Replay today (${rec.first}/12 first try)` : 'Play today\'s deck') : 'Play';
  }

  let G = null, busy = false, sel = -1, timerRaf = 0;
  const dock = $('dock'), list = $('list');

  function newGame() {
    const mode = save.mode;
    const deck = mode === 'daily' ? DECKS[0] : DECKS.find((d) => d.id === save.deck) || DECKS[0];
    let cards;
    if (mode === 'daily') {
      const rnd = mulberry(hashStr('timeline-' + today()));
      cards = shuffle(EVENTS, rnd).slice(0, 13);
    } else cards = shuffle(EVENTS.filter(deck.f));
    const first = cards.pop();
    G = {
      mode, deck, cards, timeline: [{ ...first, status: 'start' }], current: null, lives: mode === 'classic' ? 3 : mode === 'sudden' ? 1 : 0,
      score: 0, wrong: 0, streak: 0, bestStreak: 0, hints: mode === 'daily' ? 0 : 3, hintsUsed: 0, hinted: false, grid: [], newBadges: [],
      timeLeft: mode === 'blitz' ? 90 : 0, start: performance.now(), total: cards.length, lastPlaced: null, ended: false
    };
    save.decks[deck.id] = (save.decks[deck.id] || 0) + 1;
    if (Object.keys(save.decks).length >= 5) award('decks5');
    persist();
    $('deckname').textContent = mode === 'daily' ? `Daily deck · ${today()}` : `${MODES[mode].name} · ${deck.name}`;
    $('timer').hidden = mode !== 'blitz';
    $('lives-label').textContent = mode === 'blitz' ? 'Seconds' : mode === 'daily' ? 'Cards left' : 'Lives';
    paintHud();
    show('game');
    deal();
    if (mode === 'blitz') { lastT = performance.now(); cancelAnimationFrame(timerRaf); timerRaf = requestAnimationFrame(tickTimer); }
  }
  let lastT = 0;
  function tickTimer(t) {
    if (!G || G.ended || G.mode !== 'blitz') return;
    timerRaf = requestAnimationFrame(tickTimer);
    const dt = Math.min(0.2, (t - lastT) / 1000); lastT = t;
    if (document.hidden) return;
    const before = Math.ceil(G.timeLeft);
    G.timeLeft -= dt;
    if (G.timeLeft <= 10 && Math.ceil(G.timeLeft) !== before) sfx.tick();
    paintTimer();
    if (G.timeLeft <= 0) { G.timeLeft = 0; paintTimer(); finish('time'); }
  }
  function paintTimer() {
    const t = $('timer'); t.querySelector('i').style.width = Math.max(0, Math.min(100, G.timeLeft / 90 * 100)) + '%';
    t.classList.toggle('low', G.timeLeft < 15);
    $('lives').innerHTML = `<b style="font-size:24px;font-weight:900">${Math.ceil(G.timeLeft)}</b>`;
  }
  function paintHud(popLife = -1) {
    $('score').textContent = G.score;
    $('streak').textContent = G.streak;
    const b = C.getBest(bestKey());
    $('best').textContent = b == null ? '-' : b;
    $('hints').textContent = G.hints;
    $('hint').disabled = G.hints <= 0 || !G.current || G.hinted;
    $('hint').hidden = G.mode === 'daily';
    const lv = $('lives');
    if (G.mode === 'blitz') paintTimer();
    else if (G.mode === 'daily') lv.innerHTML = `<b style="font-size:24px;font-weight:900">${G.cards.length + (G.current ? 1 : 0)}</b>`;
    else {
      lv.innerHTML = '';
      const max = G.mode === 'classic' ? 3 : 1;
      for (let i = 0; i < max; i++) { const w = document.createElement('span'); w.innerHTML = heartSvg; const s = w.firstChild; if (i >= G.lives) s.classList.add('lost'); if (i === popLife) s.classList.add('pop'); lv.append(s); }
      lv.setAttribute('aria-label', `${G.lives} lives left`);
    }
  }
  const bestKey = () => (G.mode === 'daily' ? `daily-${today()}` : `${G.mode}-${G.deck.id}`);
  function bumpEl(id) { const el = $(id); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }

  function cardHtml(ev) {
    const cat = CATS[ev.cat];
    return `<div class="tl-card__art"><svg aria-hidden="true"><use href="#art-${ev.cat}"/></svg><div class="tl-medal" aria-hidden="true"></div><span class="tl-cat">${cat.short}</span></div>
      <div class="tl-card__body"><div><div class="tl-card__t"></div><div class="tl-card__q">When did this happen?</div></div><div class="tl-year-q" aria-hidden="true">????</div></div>`;
  }
  function deal() {
    G.current = G.cards.pop() || null;
    G.hinted = false;
    if (!G.current) return finish('cleared');
    dock.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'tl-card'; card.id = 'card'; card.tabIndex = -1; card.setAttribute('aria-live', 'polite');
    card.innerHTML = cardHtml(G.current);
    card.querySelector('.tl-medal').textContent = G.current.icon;
    card.querySelector('.tl-card__t').textContent = G.current.text;
    bindDrag(card);
    dock.append(card);
    sel = -1;
    renderList();
    list.classList.add('active');
    paintHud();
    sfx.deal();
  }
  function slotLabel(i) {
    const tl = G.timeline, before = tl[i - 1], after = tl[i];
    return !before ? `before ${plainYear(after.year)}` : !after ? `after ${plainYear(before.year)}` : `between ${plainYear(before.year)} and ${plainYear(after.year)}`;
  }
  function slot(i) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'tl-slot'; b.dataset.i = i;
    b.innerHTML = '<span>Place here</span>';
    b.setAttribute('aria-label', `Place card ${slotLabel(i)}`);
    b.addEventListener('click', () => place(i));
    const li = document.createElement('li'); li.append(b);
    return li;
  }
  function itemEl(ev, isNew) {
    const li = document.createElement('li');
    const cat = CATS[ev.cat];
    li.className = 'tl-item' + (isNew ? ' new' : '') + (ev.status === 'good' ? ' good' : ev.status === 'bad' ? ' bad' : '');
    li.style.setProperty('--c', cat.c); li.style.setProperty('--g', cat.g);
    li.innerHTML = `<div class="y">${fmtYear(ev.year)}</div><div class="m" aria-hidden="true"></div><div class="t"></div>${ev.status === 'good' ? '<span class="tag">Nice!</span>' : ev.status === 'bad' ? '<span class="tag">Moved</span>' : ''}`;
    li.querySelector('.m').textContent = ev.icon;
    li.querySelector('.t').textContent = ev.text;
    return li;
  }
  function renderList() {
    list.innerHTML = '';
    G.timeline.forEach((ev, i) => { if (G.current) list.append(slot(i)); list.append(itemEl(ev, ev === G.lastPlaced)); });
    if (G.current) list.append(slot(G.timeline.length));
    if (sel >= 0) list.querySelector(`.tl-slot[data-i="${sel}"]`)?.classList.add('hot');
    if (G.hinted) markHint();
  }
  function correctRange(y) {
    const tl = G.timeline, ok = [];
    for (let i = 0; i <= tl.length; i++) if ((i === 0 || tl[i - 1].year <= y) && (i === tl.length || y <= tl[i].year)) ok.push(i);
    return ok;
  }
  function place(i) {
    if (busy || !G.current || G.ended) return;
    busy = true;
    const cur = G.current, y = cur.year, tl = G.timeline;
    const ok = (i === 0 || tl[i - 1].year <= y) && (i === tl.length || y <= tl[i].year);
    const ev = { ...cur, status: ok ? 'good' : 'bad' };
    tl.push(ev); tl.sort((a, b) => a.year - b.year || (a === ev ? 1 : -1));
    G.lastPlaced = ev; G.current = null;
    G.grid.push(ok ? 1 : 0);
    undrag?.(); undrag = null;
    if (ghost) { ghost.remove(); ghost = null; } dragging = false; cancelAnimationFrame(scrollRaf); clearHot();
    dock.innerHTML = '';
    list.classList.remove('active');
    renderList();
    const landed = [...list.querySelectorAll('.tl-item')][tl.indexOf(ev)];
    landed?.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
    const s = save.stats;
    if (ok) {
      G.score++; G.streak++; G.bestStreak = Math.max(G.bestStreak, G.streak);
      s.placed++; if (y < 0) s.bc++;
      if (G.mode === 'blitz') G.timeLeft = Math.min(99, G.timeLeft + 3);
      sfx.good(G.streak); vib(12);
      bumpEl('score'); bumpEl('streak');
      award('first');
      if (G.streak >= 5) award('streak5'); if (G.streak >= 10) award('streak10'); if (G.streak >= 20) award('streak20');
      if (G.mode === 'classic' && G.score >= 15) award('classic15'); if (G.mode === 'classic' && G.score >= 30) award('classic30');
      if (G.mode === 'sudden' && G.score >= 10) award('sudden10');
      if (G.mode === 'blitz' && G.score >= 15) award('blitz15');
      if (G.hintsUsed === 0 && G.score >= 20) award('nohint20');
      if (s.bc >= 10) award('bc');
      if (s.placed >= 500) award('cards500');
      const idx = tl.indexOf(ev), a = tl[idx - 1], b = tl[idx + 1];
      if (a && b && b.year - a.year <= 3) award('close');
      if (G.streak > 0 && G.streak % 10 === 0) { C.confetti(80); sfx.fanfare(); C.toast(`${G.streak} in a row! Unstoppable.`); }
      else if (G.streak === 5) C.toast('5 in a row!');
    } else {
      G.streak = 0; G.wrong++; s.wrong++;
      if (G.mode === 'classic' || G.mode === 'sudden') G.lives--;
      if (G.mode === 'blitz') G.timeLeft = Math.max(0, G.timeLeft - 10);
      sfx.bad(); vib([30, 40, 30]);
      C.toast(`Not quite: that was ${plainYear(y)}`);
    }
    s.bestStreak = Math.max(s.bestStreak, G.bestStreak);
    persist();
    paintHud(ok ? -1 : G.lives);
    setTimeout(() => {
      busy = false;
      if (G.ended) return;
      if ((G.mode === 'classic' || G.mode === 'sudden') && G.lives <= 0) finish('lives');
      else deal();
    }, ok ? 850 : 1600);
  }

  function useHint() {
    if (!G || !G.current || G.hints <= 0 || G.hinted || busy) return;
    G.hints--; G.hintsUsed++; G.hinted = true; save.stats.hints++; persist();
    sfx.hint();
    const q = dock.querySelector('.tl-card__q');
    q.innerHTML = 'Hint: it happened in <b></b>.';
    q.querySelector('b').textContent = century(G.current.year);
    markHint();
    paintHud();
  }
  function markHint() {
    if (!G.current) return;
    const y = G.current.year, lo = y < 0 ? -Math.ceil(-y / 100) * 100 : Math.floor(y / 100) * 100, hi = lo + 99;
    const tl = G.timeline;
    list.querySelectorAll('.tl-slot').forEach((s) => {
      const i = +s.dataset.i, a = tl[i - 1], b = tl[i];
      const from = a ? a.year : -99999, to = b ? b.year : 99999;
      if (from <= hi && to >= lo) s.classList.add('hint');
    });
  }

  let ghost = null, hot = null, dragging = false, startX = 0, startY = 0, lastPointer = null, scrollRaf = 0, undrag = null;
  function bindDrag(card) {
    undrag?.();
    undrag = C.drag(card, {
      start(p) { if (busy) return; startX = p.clientX; startY = p.clientY; dragging = false; lastPointer = null; },
      move(p) {
        if (busy) return;
        if (!dragging && Math.hypot(p.clientX - startX, p.clientY - startY) < 6) return;
        if (!dragging) {
          dragging = true;
          ghost = card.cloneNode(true); ghost.removeAttribute('id'); ghost.classList.add('tl-drag');
          document.body.append(ghost); card.classList.add('ghosted');
          scrollRaf = requestAnimationFrame(autoScroll);
          sfx.whoosh();
        }
        lastPointer = p;
        const w = ghost.offsetWidth;
        ghost.style.left = (p.clientX - Math.min(w / 2, 200)) + 'px';
        ghost.style.top = (p.clientY - 40) + 'px';
        highlight(p.clientY);
      },
      end() {
        cancelAnimationFrame(scrollRaf);
        if (!dragging) { if (!C.touchpad) C.toast('Drag me into the timeline, or tap a gap'); return; }
        dragging = false;
        ghost?.remove(); ghost = null; card.classList.remove('ghosted');
        const target = hot; clearHot();
        if (target) place(+target.dataset.i);
      }
    });
  }
  addEventListener('pointerdown', (e) => {
    if (!dragging || !C.touchpad || e.target.closest('#card')) return;
    const target = hot;
    if (target) { e.preventDefault(); place(+target.dataset.i); }
  }, true);
  function clearHot() { hot?.classList.remove('hot'); hot = null; }
  function highlight(y) {
    let best = null, bd = Infinity;
    for (const s of list.querySelectorAll('.tl-slot')) { const r = s.getBoundingClientRect(); const d = Math.abs(r.top + r.height / 2 - y); if (d < bd) { bd = d; best = s; } }
    const lr = list.getBoundingClientRect();
    if (y < lr.top - 80 || y > lr.bottom + 80) best = null;
    if (best !== hot) { clearHot(); hot = best; hot?.classList.add('hot'); if (hot) sfx.tick(); }
  }
  function autoScroll() {
    if (lastPointer) {
      const y = lastPointer.clientY, edge = 90;
      if (y < edge + 60) scrollBy(0, -Math.ceil((edge + 60 - y) / 5));
      else if (y > innerHeight - edge) scrollBy(0, Math.ceil((y - innerHeight + edge) / 5));
      highlight(y);
    }
    scrollRaf = requestAnimationFrame(autoScroll);
  }

  addEventListener('keydown', (e) => {
    if (view.game.hidden || !G || !G.current || busy) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const n = G.timeline.length;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      sel = sel < 0 ? (e.key === 'ArrowDown' ? 0 : n) : Math.max(0, Math.min(n, sel + (e.key === 'ArrowDown' ? 1 : -1)));
      list.querySelectorAll('.tl-slot').forEach((s) => s.classList.toggle('hot', +s.dataset.i === sel));
      const s = list.querySelector(`.tl-slot[data-i="${sel}"]`); s?.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
      sfx.tick();
    } else if ((e.key === 'Enter' || e.key === ' ') && sel >= 0 && !e.target.closest('button')) { e.preventDefault(); place(sel); }
    else if (e.key.toLowerCase() === 'h') useHint();
  });

  function emblem(tier) {
    const c = { gold: ['#ffd54a', '#c98a00'], silver: ['#e3e8ee', '#8a96a3'], bronze: ['#f0a76b', '#a4592a'], none: ['#d6cfc4', '#948c82'] }[tier];
    return `<svg viewBox="0 0 84 84" aria-hidden="true"><path d="M30 4h24l-6 22H36z" fill="#ff5a36"/><circle cx="42" cy="50" r="30" fill="${c[1]}"/><circle cx="42" cy="50" r="25" fill="${c[0]}"/><path d="M28 42h28M28 50h28M28 58h18" stroke="${c[1]}" stroke-width="4" stroke-linecap="round"/><circle cx="58" cy="58" r="6" fill="#fff" stroke="${c[1]}" stroke-width="3"/><path d="M58 55v3l2 2" stroke="${c[1]}" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`;
  }
  function ribbon(tl) {
    const n = tl.length, W = 520, pad = 16;
    const xs = (i) => pad + (n <= 1 ? (W - 2 * pad) / 2 : i * (W - 2 * pad) / (n - 1));
    let s = `<svg viewBox="0 0 ${W} 54"><line x1="${pad}" y1="22" x2="${W - pad}" y2="22" stroke="currentColor" stroke-opacity=".2" stroke-width="4" stroke-linecap="round"/>`;
    tl.forEach((ev, i) => { const col = ev.status === 'good' ? '#1f9d55' : ev.status === 'bad' ? '#d64545' : '#948c82'; s += `<circle cx="${xs(i).toFixed(1)}" cy="22" r="${n > 40 ? 3.5 : 6}" fill="${col}"><title>${plainYear(ev.year)}</title></circle>`; });
    s += `<text x="${pad}" y="48" font-size="12" font-weight="800" fill="currentColor" opacity=".6">${plainYear(tl[0].year)}</text><text x="${W - pad}" y="48" font-size="12" font-weight="800" fill="currentColor" opacity=".6" text-anchor="end">${plainYear(tl[n - 1].year)}</text></svg>`;
    return s;
  }
  function finish(why) {
    if (G.ended) return;
    G.ended = true; cancelAnimationFrame(timerRaf);
    const s = save.stats; s.games++;
    const isNew = C.best(bestKey(), G.score).isNew && G.score > 0;
    if (G.mode === 'daily') {
      award('daily');
      if (G.score === 12) award('dailyperfect');
      const d = save.daily[today()] || { first: null, best: 0, plays: 0 };
      d.plays++; d.best = Math.max(d.best, G.score); if (d.first == null) { d.first = G.score; d.grid = G.grid.join(''); }
      save.daily[today()] = d;
      const keys = Object.keys(save.daily).sort(); while (keys.length > 40) delete save.daily[keys.shift()];
    }
    if (why === 'cleared' && G.mode !== 'daily' && G.wrong === 0) award('deckclear');
    if (why === 'cleared' && G.mode !== 'daily' && G.deck.id !== 'all') award('deckclear');
    save.history.unshift({ m: G.mode, d: G.deck.id, s: G.score, w: G.wrong, t: Date.now() });
    save.history.length = Math.min(15, save.history.length);
    persist();
    const acc = G.score + G.wrong ? Math.round(G.score / (G.score + G.wrong) * 100) : 0;
    const tier = G.mode === 'daily' ? (G.score >= 11 ? 'gold' : G.score >= 8 ? 'silver' : G.score >= 5 ? 'bronze' : 'none') : (G.score >= 25 ? 'gold' : G.score >= 12 ? 'silver' : G.score >= 5 ? 'bronze' : 'none');
    $('r-emblem').innerHTML = emblem(tier);
    $('r-title').textContent = why === 'cleared' ? (G.mode === 'daily' ? 'Daily deck done!' : 'Deck cleared!') : why === 'time' ? "Time's up!" : 'Out of lives';
    $('r-score').textContent = G.mode === 'daily' ? `${G.score}/12` : G.score;
    $('r-new').hidden = !isNew;
    const rs = [[acc + '%', 'Accuracy'], [G.bestStreak, 'Best streak'], [G.timeline.length, 'Timeline'], [G.hintsUsed, 'Hints']];
    $('r-stats').innerHTML = rs.map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join('');
    const quip = why === 'cleared' && G.mode !== 'daily' ? 'You placed the entire deck. Take a bow, professor.' : G.score >= 25 ? 'A walking history book.' : G.score >= 15 ? 'Genuinely impressive.' : G.score >= 8 ? 'Solid grasp of the past.' : G.score >= 3 ? 'History class was a while ago, huh?' : 'The past is a foreign country.';
    $('r-msg').textContent = quip + (G.mode === 'daily' ? ` Come back tomorrow for a new deck.` : '');
    $('r-ribbon').innerHTML = ribbon(G.timeline);
    const earned = $('r-earned'); earned.innerHTML = '';
    G.newBadges.forEach((n, i) => { const sp = document.createElement('span'); sp.textContent = 'Badge: ' + n; sp.style.animationDelay = (0.2 + i * 0.1) + 's'; earned.append(sp); });
    const fin = $('final'); fin.innerHTML = '';
    G.timeline.forEach((ev) => fin.append(itemEl(ev, false)));
    if (isNew) { C.confetti(); sfx.fanfare(); }
    show('result');
  }
  function shareText() {
    const grid = G.grid.map((g) => (g ? '🟩' : '🟥')).join('');
    if (G.mode === 'daily') return `Curio Timeline daily ${today()}: ${G.score}/12\n${grid}`;
    return `Curio Timeline (${MODES[G.mode].name}, ${G.deck.name}): ${G.score} placed, best streak ${G.bestStreak}\n${grid}`;
  }

  function award(id) {
    if (save.badges[id]) return;
    const b = BADGES.find((x) => x.id === id); if (!b) return;
    save.badges[id] = Date.now(); G?.newBadges.push(b.name);
    C.toast(`Badge unlocked: ${b.name}`);
    persist();
  }
  function badgeSvg(i, on) {
    const hue = (i * 47) % 360;
    const c1 = on ? `hsl(${hue} 80% 62%)` : '#cfc8bd', c2 = on ? `hsl(${hue} 70% 40%)` : '#9a9288';
    return `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 2l5 4 6-1 2 6 5 3-2 6 2 6-5 3-2 6-6-1-5 4-5-4-6 1-2-6-5-3 2-6-2-6 5-3 2-6 6 1z" fill="${c1}"/><circle cx="20" cy="20" r="10" fill="#fff" fill-opacity=".85"/><path d="M15 20l3.5 3.5L26 16" stroke="${c2}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
  function openStats() {
    const s = save.stats;
    const acc = s.placed + s.wrong ? Math.round(s.placed / (s.placed + s.wrong) * 100) : 0;
    const cells = [[s.games, 'Games'], [s.placed, 'Cards placed'], [acc + '%', 'Accuracy'], [s.bestStreak, 'Best streak'], [Object.keys(save.decks).length + '/14', 'Decks tried'], [s.hints, 'Hints used'], [Object.keys(save.daily).length, 'Dailies'], [Object.keys(save.badges).length + '/' + BADGES.length, 'Badges']];
    $('statgrid').innerHTML = cells.map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join('');
    const bw = $('badges'); bw.innerHTML = '';
    BADGES.forEach((b, i) => {
      const on = !!save.badges[b.id];
      const el = document.createElement('div'); el.className = 'tl-badge' + (on ? ' on' : '');
      el.innerHTML = `${badgeSvg(i, on)}<div><b></b><small></small></div>`;
      el.querySelector('b').textContent = b.name; el.querySelector('small').textContent = b.desc;
      bw.append(el);
    });
    const hl = $('history'); hl.innerHTML = save.history.length ? '' : '<li>No games yet.</li>';
    for (const h of save.history) {
      const li = document.createElement('li'); li.innerHTML = '<b></b><span></span>';
      li.querySelector('b').textContent = `${MODES[h.m]?.name || h.m}: ${h.s} placed`;
      li.querySelector('span').textContent = `${(DECKS.find((d) => d.id === h.d) || DECKS[0]).name} · ${new Date(h.t).toLocaleDateString()}`;
      hl.append(li);
    }
    show('stats');
  }

  $('play').addEventListener('click', newGame);
  $('again').addEventListener('click', newGame);
  $('to-menu').addEventListener('click', () => { renderMenu(); show('menu'); });
  $('open-stats').addEventListener('click', openStats);
  $('stats-back').addEventListener('click', () => { renderMenu(); show('menu'); });
  $('hint').addEventListener('click', useHint);
  $('quit').addEventListener('click', async () => {
    if (!G || G.ended) return;
    const v = await C.modal({ emoji: '', title: 'Quit this game?', body: 'Your timeline so far will be scored.', buttons: [{ label: 'Keep playing', value: 'no' }, { label: 'Quit', value: 'yes' }] });
    if (v === 'yes') finish('quit');
  });
  $('share').addEventListener('click', async () => { const t = shareText(); try { await navigator.clipboard.writeText(t); C.toast('Copied to clipboard'); } catch { C.toast(t.split('\n')[0], 4000); } });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) lastT = performance.now(); });

  window.__timeline = {
    get G() { return G; }, save, newGame, place, useHint, correct() { return correctRange(G.current.year)[0]; },
    wrongSlot() { const ok = correctRange(G.current.year); for (let i = 0; i <= G.timeline.length; i++) if (!ok.includes(i)) return i; return -1; }
  };
  renderMenu();
  if (!C.store.get('tip:touchpad:timeline', false) && !matchMedia('(pointer: coarse)').matches) {
    C.store.set('tip:touchpad:timeline', true);
    setTimeout(() => C.toast('Tip: tap a gap to place a card, or turn on Touchpad mode in the top bar to carry cards without holding', 4200), 1200);
  }
})();
