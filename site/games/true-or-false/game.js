(() => {
  const C = window.Curio;
  const $ = (id) => document.getElementById(id);
  const FACTS = window.TF_FACTS.map((f, i) => ({ s: f[0], v: f[1], why: f[2], id: i }));
  const MODES = { classic: { lives: 3 }, sudden: { lives: 1 }, speed: { lives: 0, clock: 60 }, daily: { lives: 0, count: 10 } };
  const BADGES = [
    ['first', '🔎', 'Case Opened', 'Finish a game'],
    ['s10', '🧐', 'Fib Finder', '10 correct in one Classic game'],
    ['s25', '🕵️', 'Detective', '25 correct in one Classic game'],
    ['s50', '🏛️', 'Myth Buster', '50 correct in one Classic game'],
    ['streak10', '🔥', 'Hot Streak', '10 correct in a row'],
    ['streak25', '🌋', 'Unfoolable', '25 correct in a row'],
    ['sudden15', '💀', 'Nerves of Steel', '15 correct in Sudden death'],
    ['speed20', '⚡', 'Speed Reader', '20 correct in a Speed round'],
    ['daily10', '📅', 'Perfect Day', '10 out of 10 in the Daily'],
    ['daily', '🗓️', 'Daily Habit', 'Finish a daily ten'],
    ['seen200', '📚', 'Well Read', 'See 200 different facts'],
    ['myths', '🧹', 'Myth Sweeper', 'Correctly call 50 false facts in total']
  ];
  const fresh = () => ({ v: 2, mode: 'classic', games: 0, answered: 0, correct: 0, falsesCaught: 0, seenAll: [], badges: {}, daily: {}, bestStreak: 0 });
  function load() {
    const d = C.store.get('tf:data', null);
    const f = d && typeof d === 'object' && d.v === 2 ? Object.assign(fresh(), d) : fresh();
    if (!MODES[f.mode]) f.mode = 'classic';
    if (!Array.isArray(f.seenAll)) f.seenAll = [];
    ['badges', 'daily'].forEach((k) => { if (!f[k] || typeof f[k] !== 'object') f[k] = {}; });
    return f;
  }
  const data = load();
  const save = () => C.store.set('tf:data', data);
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const hash = (s) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const mulberry = (seed) => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  function tone(f, d = 0.12, type = 'sine', vol = 0.12, when = 0) {
    if (C.muted) return;
    const ac = C.audioContext(); if (!ac) return;
    const t = ac.currentTime + when;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d + 0.03);
  }
  const buzz = (ms) => { try { navigator.vibrate?.(ms); } catch {} };

  let mode = data.mode;
  let deck = [], cur = null, n = 0, score = 0, streak = 0, bestStreak = 0, lives = 3, phase = 'ask', log = [], clockLeft = 60, raf = 0, last = 0, newBadges = [];
  const bestKey = () => mode === 'classic' ? 'score' : mode === 'daily' ? `daily-${today()}` : mode;

  function buildDeck() {
    if (mode === 'daily') {
      const r = mulberry(hash(`tf${today()}`));
      const a = FACTS.slice();
      for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
      return a.slice(0, 10);
    }
    const seen = new Set(C.store.get('tf-seen', []));
    const freshF = FACTS.filter((f) => !seen.has(f.id));
    const pool = freshF.length >= 30 ? freshF : FACTS;
    if (pool === FACTS) C.store.set('tf-seen', []);
    return C.shuffle(pool);
  }
  function remember(id) {
    if (mode !== 'daily') {
      const s = C.store.get('tf-seen', []); s.push(id);
      while (s.length > FACTS.length - 20) s.shift();
      C.store.set('tf-seen', s);
    }
    if (!data.seenAll.includes(id)) data.seenAll.push(id);
  }
  const paintBest = () => { const b = C.getBest(bestKey()); $('sBest').textContent = b == null ? '-' : b; };
  function paintLives() {
    const el = $('lives');
    el.classList.toggle('is-timer', mode === 'speed' || mode === 'daily');
    if (mode === 'speed') { el.textContent = `⏱️ ${Math.ceil(Math.max(0, clockLeft))}s`; return; }
    if (mode === 'daily') { el.textContent = `📅 ${Math.min(n, 10)}/10`; return; }
    el.innerHTML = '';
    for (let i = 0; i < MODES[mode].lives; i++) { const s = document.createElement('span'); s.textContent = '❤️'; if (i >= lives) s.className = 'lost'; el.append(s); }
    el.setAttribute('aria-label', `${lives} lives left`);
  }
  function paintModes() { document.querySelectorAll('#modes button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.m === mode))); }

  function newGame() {
    deck = buildDeck(); n = 0; score = 0; streak = 0; bestStreak = 0; lives = MODES[mode].lives; log = [];
    clockLeft = 60;
    $('sScore').textContent = 0; $('sStreak').textContent = 0;
    $('play').hidden = false; $('result').hidden = true;
    $('timerWrap').hidden = mode !== 'speed';
    paintModes(); paintBest();
    cancelAnimationFrame(raf);
    nextFact();
    paintLives();
    if (mode === 'speed') { last = performance.now(); raf = requestAnimationFrame(tick); }
  }

  function tick(now) {
    if (mode !== 'speed' || phase === 'over') return;
    const dt = Math.min(.1, (now - last) / 1000); last = now;
    if (!document.hidden) clockLeft -= dt;
    $('timer').style.transform = `scaleX(${Math.max(0, clockLeft / 60)})`;
    paintLives();
    if (clockLeft <= 0) return finish();
    raf = requestAnimationFrame(tick);
  }

  function nextFact() {
    if (mode === 'daily' && n >= 10) return finish();
    if (!deck.length) deck = buildDeck();
    cur = deck.shift(); n++;
    remember(cur.id);
    phase = 'ask';
    const card = $('card');
    card.className = 'tf-card'; card.style.transform = ''; card.style.opacity = '';
    void card.offsetWidth; card.classList.add('in');
    $('stT').style.opacity = 0; $('stF').style.opacity = 0;
    const body = $('cardBody'); body.innerHTML = '';
    const num = document.createElement('div'); num.className = 'tf-num'; num.textContent = mode === 'daily' ? `Daily fact ${n} of 10` : `Fact #${n}`;
    const p = document.createElement('p'); p.className = 'tf-fact'; p.textContent = cur.s;
    body.append(num, p);
    fitText(p);
    $('btns').hidden = false; $('next').hidden = true;
    $('bF').disabled = false; $('bT').disabled = false;
    paintLives();
  }
  function fitText(p) {
    p.style.fontSize = '';
    const max = $('stage').clientHeight - 100;
    let size = parseFloat(getComputedStyle(p).fontSize);
    while (p.scrollHeight > max && size > 14) { size -= 1; p.style.fontSize = size + 'px'; }
  }

  function answer(guess) {
    if (phase !== 'ask') return;
    phase = 'shown';
    const ok = guess === cur.v;
    log.push({ f: cur, guess, ok });
    data.answered++; if (ok) { data.correct++; if (!cur.v) data.falsesCaught++; }
    $('bF').disabled = true; $('bT').disabled = true;
    if (ok) {
      score++; streak++; bestStreak = Math.max(bestStreak, streak);
      bump('sScore', score); bump('sStreak', streak);
      tone(660, .08, 'triangle', .12); tone(990, .12, 'triangle', .1, .09);
      if (streak % 10 === 0) { C.toast(`🔥 ${streak} in a row!`); C.confetti(50); }
      const f = document.createElement('div'); f.className = 'tf-float'; f.textContent = streak >= 5 ? `+1 🔥${streak}` : '+1'; $('stage').append(f); setTimeout(() => f.remove(), 900);
    } else {
      streak = 0; $('sStreak').textContent = 0;
      if (mode === 'speed') clockLeft -= 5; else if (MODES[mode].lives) lives--;
      tone(170, .3, 'sawtooth', .09); buzz(70);
    }
    paintLives();
    if (mode === 'speed') {
      fly(guess, () => {
        if (clockLeft <= 0) return finish();
        nextFact();
        const card = $('card'); card.classList.add(ok ? 'is-good' : 'is-bad'); setTimeout(() => card.classList.remove('is-good', 'is-bad'), 300);
      });
      return;
    }
    fly(guess, () => reveal(ok));
  }
  function fly(dir, done) {
    const card = $('card');
    card.classList.remove('drag', 'snap', 'in');
    card.classList.add('fly');
    const w = window.innerWidth;
    card.style.transform = `translateX(${dir ? w : -w}px) rotate(${dir ? 25 : -25}deg)`;
    card.style.opacity = '0';
    setTimeout(done, mode === 'speed' ? 200 : 280);
  }
  function reveal(ok) {
    const card = $('card');
    card.className = 'tf-card shown ' + (ok ? 'is-good' : 'is-bad'); card.style.transform = ''; card.style.opacity = '';
    void card.offsetWidth; card.classList.add('flip');
    $('stT').style.opacity = 0; $('stF').style.opacity = 0;
    const body = $('cardBody'); body.innerHTML = '';
    const v = document.createElement('div'); v.className = 'tf-verdict';
    const stamp = document.createElement('div'); stamp.className = 'tf-big-stamp ' + (cur.v ? 'fact' : 'fib'); stamp.textContent = cur.v ? 'TRUE' : 'FALSE';
    const badge = document.createElement('div'); badge.className = 'tf-badge ' + (ok ? 'good' : 'bad');
    badge.textContent = ok ? C.pick(['✓ Correct!', '✓ Nailed it', '✓ Sharp!', '✓ Yes!']) : C.pick(['✗ Fooled you', '✗ Nope', '✗ Not quite']);
    v.append(stamp, badge);
    const fact = document.createElement('p'); fact.className = 'tf-small'; fact.textContent = cur.s;
    const why = document.createElement('p'); why.className = 'tf-why'; why.textContent = cur.why;
    body.append(v, fact, why);
    tone(ok ? 1200 : 300, .08, 'square', .04, .05);
    $('btns').hidden = true; $('next').hidden = false;
    const over = (MODES[mode].lives && lives <= 0) || (mode === 'daily' && n >= 10);
    $('next').textContent = over ? 'See results →' : 'Next fact →';
    $('next').focus({ preventScroll: true });
  }

  function proceed() {
    if (phase !== 'shown') return;
    if ((MODES[mode].lives && lives <= 0) || (mode === 'daily' && n >= 10)) return finish();
    nextFact();
  }

  function award(id) {
    if (data.badges[id]) return;
    data.badges[id] = Date.now();
    const b = BADGES.find((x) => x[0] === id);
    if (b) newBadges.push(b);
  }

  function finish() {
    if (phase === 'over') return;
    phase = 'over';
    cancelAnimationFrame(raf);
    newBadges = [];
    const before = C.getBest(bestKey());
    const { best, isNew } = C.best(bestKey(), score);
    const sb = C.best('streak', bestStreak);
    data.games++; data.bestStreak = Math.max(data.bestStreak, bestStreak);
    award('first');
    if (mode === 'classic' && score >= 10) award('s10');
    if (mode === 'classic' && score >= 25) award('s25');
    if (mode === 'classic' && score >= 50) award('s50');
    if (bestStreak >= 10) award('streak10');
    if (bestStreak >= 25) award('streak25');
    if (mode === 'sudden' && score >= 15) award('sudden15');
    if (mode === 'speed' && score >= 20) award('speed20');
    if (mode === 'daily') { award('daily'); if (score === 10) award('daily10'); data.daily[today()] = Math.max(data.daily[today()] || 0, score); }
    if (data.seenAll.length >= 200) award('seen200');
    if (data.falsesCaught >= 50) award('myths');
    save();
    paintBest();
    $('play').hidden = true; $('result').hidden = false;
    const total = Math.max(1, log.length), frac = score / total;
    const r = 58, L = 2 * Math.PI * r;
    $('ring').innerHTML = `<circle cx="70" cy="70" r="${r}" fill="none" stroke="var(--surface-2)" stroke-width="13"/><circle class="fg" cx="70" cy="70" r="${r}" fill="none" stroke="${frac >= .8 ? 'var(--good)' : frac >= .5 ? 'var(--warn)' : 'var(--bad)'}" stroke-width="13" stroke-linecap="round" stroke-dasharray="${L}" stroke-dashoffset="${L}" transform="rotate(-90 70 70)"/><text x="70" y="76" text-anchor="middle" font-size="26" font-weight="900" fill="var(--ink)" font-family="system-ui, sans-serif">${Math.round(frac * 100)}%</text>`;
    requestAnimationFrame(() => requestAnimationFrame(() => { const fg = $('ring').querySelector('.fg'); if (fg) fg.style.strokeDashoffset = L * (1 - frac); }));
    const isPB = isNew && before != null && score > 0;
    $('rTitle').textContent = isPB ? `🏆 ${score} correct` : `${score} correct`;
    $('rQuip').textContent = (isPB ? 'New personal best! ' : '') + (score >= 30 ? 'Encyclopaedic. Are you a librarian?' : score >= 15 ? 'A finely tuned nonsense detector.' : score >= 7 ? 'Pretty good at sniffing out fibs.' : 'The internet would fool you too. Try again!');
    $('rStats').innerHTML = '';
    [[log.length, 'Answered'], [bestStreak, 'Best streak'], [best, 'Best here'], [sb.best, 'Best streak ever']].forEach(([v, l]) => { const d = document.createElement('div'); d.className = 'c-stat'; const b = document.createElement('b'); b.textContent = v; const s = document.createElement('span'); s.textContent = l; d.append(b, s); $('rStats').append(d); });
    $('rBadges').innerHTML = '';
    newBadges.forEach((bd, i) => { const s = document.createElement('span'); s.textContent = `${bd[1]} ${bd[2]}`; s.style.animationDelay = `${.3 + i * .15}s`; $('rBadges').append(s); });
    const list = $('rList'); list.innerHTML = '';
    log.filter((l) => !l.ok || mode === 'speed' || mode === 'daily').forEach((l) => {
      const d = document.createElement('div');
      const b = document.createElement('b'); b.textContent = l.ok ? '✅' : '❌';
      const t = document.createElement('span'); t.textContent = `${l.f.s} ${l.f.v ? 'TRUE' : 'FALSE'}: ${l.f.why}`;
      d.append(b, t); list.append(d);
    });
    if (isPB || newBadges.length) C.confetti();
    [523, 659, 784].forEach((f, i) => tone(f, .2, 'triangle', .08, i * .1));
    paintPanels();
    $('again').focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function bump(id, v) { const el = $(id); el.textContent = v; el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }

  function paintPanels() {
    const got = BADGES.filter((b) => data.badges[b[0]]).length;
    $('badgeCount').textContent = `${got}/${BADGES.length}`;
    $('badgeList').innerHTML = '';
    BADGES.forEach(([id, ico, name, desc]) => {
      const d = document.createElement('div'); d.className = 'tf-badgec' + (data.badges[id] ? ' is-got' : '');
      const i = document.createElement('i'); i.textContent = ico;
      const t = document.createElement('div'); const b = document.createElement('b'); b.textContent = name; const s = document.createElement('span'); s.textContent = desc;
      t.append(b, s); d.append(i, t); $('badgeList').append(d);
    });
    const rows = [[data.games, 'Games'], [data.answered, 'Answered'], [data.answered ? Math.round(data.correct / data.answered * 100) + '%' : '-', 'Accuracy'], [data.bestStreak, 'Best streak'], [`${data.seenAll.length}/${FACTS.length}`, 'Facts seen'], [data.falsesCaught, 'Myths busted'], [data.daily[today()] ?? '-', 'Today\'s daily']];
    $('statTbl').innerHTML = '';
    rows.forEach(([v, l]) => { const d = document.createElement('div'); const b = document.createElement('b'); b.textContent = v; const s = document.createElement('span'); s.textContent = l; d.append(b, s); $('statTbl').append(d); });
  }

  const card = $('card');
  let drag = null;
  C.drag(card, {
    start(pt) { if (phase !== 'ask') return; drag = { x: pt.clientX, dx: 0 }; card.classList.remove('snap', 'in'); card.classList.add('drag'); },
    move(pt) {
      if (!drag) return;
      const dx = pt.clientX - drag.x; drag.dx = dx;
      card.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`;
      $('stT').style.opacity = Math.max(0, Math.min(1, dx / 110));
      $('stF').style.opacity = Math.max(0, Math.min(1, -dx / 110));
    },
    end() {
      if (!drag) return;
      const dx = drag.dx; drag = null;
      card.classList.remove('drag');
      if (Math.abs(dx) > 100 && phase === 'ask') answer(dx > 0);
      else { card.classList.add('snap'); card.style.transform = ''; $('stT').style.opacity = 0; $('stF').style.opacity = 0; }
    }
  });

  $('bF').addEventListener('click', () => answer(false));
  $('bT').addEventListener('click', () => answer(true));
  $('next').addEventListener('click', proceed);
  $('again').addEventListener('click', newGame);
  $('modes').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; mode = b.dataset.m; data.mode = mode; save(); newGame(); });
  $('share').addEventListener('click', () => {
    const head = mode === 'daily' ? `Zoble True or False, daily ${today()}` : `Zoble True or False, ${({ classic: 'Classic', sudden: 'Sudden death', speed: '60s Speed' })[mode]}`;
    const t = `${head}\n🔎 ${score} correct, best streak ${bestStreak}\n${log.map((l) => l.ok ? '🟩' : '🟥').join('')}`;
    navigator.clipboard?.writeText(t).then(() => C.toast('Result copied!'), () => C.toast(`${score} correct`));
  });
  document.querySelector('.tf-ptabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]'); if (!b) return;
    document.querySelectorAll('.tf-ptabs [data-tab]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    document.querySelectorAll('[data-pane]').forEach((p) => { p.hidden = p.dataset.pane !== b.dataset.tab; });
  });
  document.addEventListener('keydown', (e) => {
    if (document.querySelector('.curio-modal') || e.metaKey || e.ctrlKey || e.altKey || $('play').hidden) return;
    if (phase === 'ask') {
      if (e.key === 'ArrowLeft' || e.key === 'f' || e.key === 'F') { e.preventDefault(); answer(false); }
      else if (e.key === 'ArrowRight' || e.key === 't' || e.key === 'T') { e.preventDefault(); answer(true); }
    } else if (phase === 'shown' && mode !== 'speed' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter')) {
      e.preventDefault(); proceed();
    }
  });
  document.addEventListener('visibilitychange', () => { last = performance.now(); });
  window.addEventListener('resize', () => { const p = document.querySelector('.tf-fact'); if (p) fitText(p); });
  $('factCount').textContent = `${FACTS.length} facts in the file.`;
  newGame();
  paintPanels();
  window.__tf = { get cur() { return cur; }, get phase() { return phase; } };
})();
