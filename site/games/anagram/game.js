(() => {
  const C = window.Curio;
  const $ = (id) => document.getElementById(id);
  const W = window.ANAGRAM_WORDS, TH = window.ANAGRAM_THEMES;
  const DICT = new Set(Object.values(W).flat().concat(Object.values(TH).flatMap((t) => t[1])));
  const POINTS = { 4: 30, 5: 50, 6: 80, 7: 120, 8: 170, 9: 230 };
  const LV = { a: 1, b: 3, c: 3, d: 2, e: 1, f: 4, g: 2, h: 4, i: 1, j: 8, k: 5, l: 1, m: 3, n: 1, o: 1, p: 3, q: 10, r: 1, s: 1, t: 1, u: 1, v: 4, w: 4, x: 8, y: 4, z: 10 };
  const LENS = { easy: [4, 5, 6], normal: [5, 6, 7, 8], hard: [6, 7, 8, 9] };
  const DUR = 60;
  const BADGES = [
    ['first', '🔤', 'First Words', 'Finish a game'],
    ['w10', '📝', 'Ten in Sixty', '10 words in one Sprint'],
    ['w15', '🏃', 'Speed Reader', '15 words in one Sprint'],
    ['long8', '📏', 'Long Haul', 'Solve an 8-letter word with no hint'],
    ['nine', '🧩', 'Nine Lives', 'Solve a 9-letter word'],
    ['streak5', '🔥', 'On a Roll', '5 words in a row'],
    ['alt', '🔁', 'Plot Twist', 'Find a different real word than the one we hid'],
    ['theme', '🎯', 'Theme Park', 'Score 500+ in Themes'],
    ['allthemes', '🗂️', 'Collector', 'Play every theme'],
    ['daily', '📅', 'Daily Ten', 'Finish a daily ten'],
    ['dailyfast', '⚡', 'Under Two', 'Finish a daily ten in under 2 minutes'],
    ['total200', '📚', 'Lexicon', 'Solve 200 words in total']
  ];
  const fresh = () => ({ v: 2, mode: 'sprint', diff: 'normal', theme: 'animals', games: 0, words: 0, longest: '', themesPlayed: {}, badges: {}, daily: {}, bestStreak: 0 });
  function load() {
    const d = C.store.get('an:data', null);
    const f = d && typeof d === 'object' && d.v === 2 ? Object.assign(fresh(), d) : fresh();
    if (!['sprint', 'themes', 'zen', 'daily'].includes(f.mode)) f.mode = 'sprint';
    if (!LENS[f.diff]) f.diff = 'normal';
    if (!TH[f.theme]) f.theme = 'animals';
    ['themesPlayed', 'badges', 'daily'].forEach((k) => { if (!f[k] || typeof f[k] !== 'object') f[k] = {}; });
    return f;
  }
  const data = load();
  const save = () => C.store.set('an:data', data);
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const hash = (s) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const mulberry = (seed) => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  function tone(f, d = 0.12, type = 'sine', vol = 0.12, when = 0) {
    if (C.muted) return;
    const ac = C.audioContext(); if (!ac) return;
    const t = ac.currentTime + when;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d + 0.03);
  }
  const buzz = (ms) => { try { navigator.vibrate?.(ms); } catch {} };

  let mode = data.mode, diff = data.diff, theme = data.theme;
  let word = '', tiles = [], slots = [], hinted = 0, running = false, timeLeft = DUR, elapsed = 0, score = 0, solved = [], streak = 0, maxStreak = 0, used = new Set(), lock = false, timer = 0, lastT = 0, newBadges = [], daily = [], penalty = 0;
  const sortKey = (s) => [...s].sort().join('');
  const lv = (w) => [...w].reduce((a, ch) => a + (LV[ch] || 1), 0);
  const baseFor = (w) => (POINTS[w.length] || 50) + lv(w) * 2;
  const worth = () => Math.max(10, Math.round(baseFor(word) * (1 - .3 * hinted)));
  const bestKey = () => mode === 'daily' ? `daily-${today()}` : mode === 'themes' ? `theme-${theme}` : mode === 'zen' ? `zen-${diff}` : (diff === 'normal' ? 'score' : `sprint-${diff}`);
  const timed = () => mode === 'sprint' || mode === 'themes';

  function paintOpts() {
    document.querySelectorAll('#modes button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.m === mode)));
    document.querySelectorAll('#diffs button').forEach((b) => { b.setAttribute('aria-pressed', String(b.dataset.d === diff)); b.disabled = mode === 'daily' || mode === 'themes'; });
    const th = $('themes');
    if (!th.children.length) Object.entries(TH).forEach(([k, [label]]) => { const b = document.createElement('button'); b.type = 'button'; b.dataset.t = k; b.textContent = label; th.append(b); });
    [...th.children].forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.t === theme)));
    th.parentElement.hidden = mode !== 'themes';
    $('sTimeLabel').textContent = timed() ? 'Seconds' : mode === 'daily' ? 'Time' : 'Mode';
    $('sTime').textContent = timed() ? DUR : mode === 'daily' ? '0:00' : '🧘';
    $('passCost').textContent = timed() ? '(-3s)' : mode === 'daily' ? '(+20s)' : '';
    $('stop').hidden = mode !== 'zen';
    const b = C.getBest(bestKey());
    $('sBest').textContent = b == null ? '-' : mode === 'daily' ? clock(b) : b;
  }
  const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  function pickWord() {
    if (mode === 'daily') return daily[solved.length];
    if (mode === 'themes') {
      const list = TH[theme][1].filter((w) => !used.has(w));
      return C.pick(list.length ? list : TH[theme][1]);
    }
    const lens = LENS[diff];
    const L = mode === 'zen' ? C.pick(lens) : lens[Math.min(lens.length - 1, Math.floor(solved.filter((s) => s.ok).length / 3))];
    let pool = W[L].filter((w) => !used.has(w));
    if (!pool.length) pool = W[L];
    return C.pick(pool);
  }

  function newWord() {
    word = pickWord(); used.add(word);
    let mix;
    for (let i = 0; i < 40; i++) { mix = C.shuffle([...word]).join(''); if (mix !== word && !DICT.has(mix)) break; }
    tiles = [...mix].map((ch, i) => ({ ch, id: i, used: false }));
    slots = Array(word.length).fill(null);
    hinted = 0;
    const tag = $('tag');
    tag.innerHTML = '';
    tag.append(document.createTextNode(`${word.length} letters · ${worth()} pts`));
    if (mode === 'themes') { const s = document.createElement('span'); s.className = 'theme'; s.textContent = TH[theme][0]; tag.prepend(s); }
    if (mode === 'daily') tag.prepend(document.createTextNode(`${solved.length + 1}/10 · `));
    draw(true);
  }

  function draw(deal) {
    const s = $('slots'); s.innerHTML = ''; s.className = 'an-slots';
    slots.forEach((t, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'an-slot' + (t ? ' full' : '') + (i < hinted ? ' hinted' : '');
      b.style.setProperty('--i', i);
      if (t) { b.textContent = t.ch; const sb = document.createElement('sub'); sb.textContent = LV[t.ch] || 1; b.append(sb); }
      b.setAttribute('aria-label', t ? `Remove ${t.ch}` : `Empty slot ${i + 1}`);
      b.addEventListener('click', () => removeAt(i));
      s.append(b);
    });
    const tl = $('tiles');
    const before = {};
    [...tl.children].forEach((el) => { before[el.dataset.id] = el.getBoundingClientRect(); });
    tl.innerHTML = '';
    tiles.forEach((t, k) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'an-tile'; b.textContent = t.ch; b.disabled = t.used; b.dataset.id = t.id;
      const sb = document.createElement('sub'); sb.textContent = LV[t.ch] || 1; b.append(sb);
      b.setAttribute('aria-label', `Letter ${t.ch}`);
      b.addEventListener('click', () => place(t));
      tl.append(b);
      if (deal && b.animate && !matchMedia('(prefers-reduced-motion: reduce)').matches) b.animate([{ transform: 'translateY(-40px) rotate(-20deg) scale(.4)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 320, delay: k * 35, easing: 'cubic-bezier(.2,1.4,.4,1)', fill: 'backwards' });
    });
    if (!deal) [...tl.children].forEach((el) => {
      const a = before[el.dataset.id]; if (!a || !el.animate) return;
      const b = el.getBoundingClientRect();
      const dx = a.left - b.left, dy = a.top - b.top;
      if (dx || dy) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 280, easing: 'cubic-bezier(.3,1.3,.5,1)' });
    });
  }

  function place(t) {
    if (!running || lock || t.used) return;
    const i = slots.indexOf(null); if (i < 0) return;
    t.used = true; slots[i] = t;
    tone(500 + i * 60, .05, 'triangle', .09);
    draw();
    if (!slots.includes(null)) check();
  }
  function removeAt(i) {
    if (!running || lock || i < hinted || !slots[i]) return;
    slots[i].used = false; slots[i] = null;
    const rest = slots.slice(i + 1).filter(Boolean);
    for (let k = i; k < slots.length; k++) slots[k] = null;
    rest.forEach((t, k) => { slots[i + k] = t; });
    tone(300, .03, 'sine', .06);
    draw();
  }
  function backspace() { for (let i = slots.length - 1; i >= hinted; i--) if (slots[i]) return removeAt(i); }
  function clearAll() {
    if (!running || lock) return;
    for (let i = hinted; i < slots.length; i++) if (slots[i]) { slots[i].used = false; slots[i] = null; }
    draw();
  }
  function typed(ch) {
    const t = tiles.find((x) => !x.used && x.ch === ch);
    if (t) place(t);
    else if (running && !lock) tone(150, .05, 'square', .04);
  }
  function shuffle() {
    if (!running || lock) return;
    tiles = C.shuffle(tiles);
    tone(700, .04, 'sine', .06); tone(820, .04, 'sine', .06, .05);
    draw();
  }
  function hint() {
    if (!running || lock || hinted >= word.length - 1) return;
    clearAll();
    const ch = word[hinted];
    const t = tiles.find((x) => !x.used && x.ch === ch);
    t.used = true; slots[hinted] = t; hinted++;
    tone(880, .06, 'sine', .08);
    msg(mode === 'zen' ? `Hint: starts with ${word.slice(0, hinted).toUpperCase()}.` : `Hint: starts with ${word.slice(0, hinted).toUpperCase()}. Now worth ${worth()}.`);
    draw();
    if (!slots.includes(null)) check();
  }

  function check() {
    const guess = slots.map((t) => t.ch).join('');
    if (guess === word || (DICT.has(guess) && sortKey(guess) === sortKey(word))) return win(guess);
    lock = true;
    const bd = $('board'); bd.classList.remove('is-shake'); void bd.offsetWidth; bd.classList.add('is-shake');
    tone(160, .2, 'sawtooth', .08); buzz(50);
    streak = 0;
    msg(C.pick(['Not a word we know. Try again!', 'Nope! Shuffle it up.', 'So close... or not.', 'Letters right, order wrong.']));
    setTimeout(() => { lock = false; if (running) clearAll(); }, 450);
  }

  function burst() {
    const fx = $('fx'), g = fx.getContext('2d');
    const dpr = Math.min(2, devicePixelRatio || 1), Wd = fx.clientWidth, Hd = fx.clientHeight;
    fx.width = Wd * dpr; fx.height = Hd * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const br = $('board').getBoundingClientRect();
    const ps = [];
    [...$('slots').children].forEach((el) => {
      const r = el.getBoundingClientRect();
      for (let i = 0; i < 6; i++) ps.push({ x: r.left - br.left + r.width / 2, y: r.top - br.top + r.height / 2, vx: (Math.random() - .5) * 6, vy: -Math.random() * 6 - 1, c: C.pick(['#ffe082', '#fff', '#81c784', '#ff8a65']), l: 40 + Math.random() * 20 });
    });
    let f = 0;
    (function loop() {
      g.clearRect(0, 0, Wd, Hd);
      ps.forEach((p) => { p.vy += .25; p.x += p.vx; p.y += p.vy; g.globalAlpha = Math.max(0, 1 - f / p.l); g.fillStyle = p.c; g.fillRect(p.x - 3, p.y - 3, 6, 6); });
      g.globalAlpha = 1;
      if (++f < 60 && !document.hidden) requestAnimationFrame(loop); else g.clearRect(0, 0, Wd, Hd);
    })();
  }

  function win(guess) {
    lock = true;
    const pts = mode === 'zen' ? 0 : worth();
    streak++; maxStreak = Math.max(maxStreak, streak);
    const bonus = mode !== 'zen' && streak >= 3 ? Math.min(50, 10 * (streak - 2)) : 0;
    score += pts + bonus;
    solved.push({ w: guess, ok: true, hinted });
    data.words++;
    if (guess.length > data.longest.length) data.longest = guess;
    if (guess !== word) { award('alt'); msg(`Ooh, ${guess.toUpperCase()} works too! (we hid ${word.toUpperCase()})`); }
    if (guess.length >= 8 && hinted === 0) award('long8');
    if (guess.length >= 9) award('nine');
    if (streak >= 5) award('streak5');
    $('slots').classList.add('win');
    burst();
    if (mode !== 'zen') { const f = document.createElement('div'); f.className = 'an-float'; f.textContent = `+${pts + bonus}`; $('board').append(f); setTimeout(() => f.remove(), 1000); }
    bump('sScore', mode === 'zen' ? solved.filter((s) => s.ok).length : score); bump('sWords', solved.filter((s) => s.ok).length);
    if (guess === word) msg(bonus ? `🔥 ${streak} in a row! +${bonus} bonus` : C.pick(['Nice!', 'Unscrambled!', 'Word wizard.', 'Yes!', 'Crisp.', 'Lovely tiles.']));
    [523, 659, 784, 1046].slice(0, Math.min(4, 2 + Math.floor(word.length / 3))).forEach((f2, i) => tone(f2, .1, 'triangle', .1, i * .07));
    if (word.length >= 8 && hinted === 0) C.confetti(40);
    setTimeout(() => {
      lock = false;
      if (!running) return;
      if (mode === 'daily' && solved.length >= 10) return end();
      newWord();
    }, 700);
  }
  function pass() {
    if (!running || lock) return;
    solved.push({ w: word, ok: false });
    streak = 0;
    if (timed()) timeLeft = Math.max(0, timeLeft - 3);
    if (mode === 'daily') { penalty += 20; if (solved.length >= 10) { msg(`It was ${word.toUpperCase()}.`); return end(); } }
    msg(`It was ${word.toUpperCase()}.`);
    tone(260, .1, 'sine', .08);
    newWord();
  }
  function bump(id, v) { const el = $(id); el.textContent = v; el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
  function msg(t) { $('msg').textContent = t; }

  function start() {
    score = 0; solved = []; streak = 0; maxStreak = 0; timeLeft = DUR; elapsed = 0; penalty = 0; used = new Set(); lock = false;
    if (mode === 'daily') {
      const r = mulberry(hash(`an${today()}`));
      daily = [5, 5, 6, 6, 6, 7, 7, 7, 8, 8].map((L) => W[L][Math.floor(r() * W[L].length)]);
    }
    if (mode === 'themes') { data.themesPlayed[theme] = 1; save(); }
    $('sScore').textContent = 0; $('sWords').textContent = 0;
    $('cover').hidden = true; $('board').classList.remove('is-covered'); msg('');
    running = true;
    newWord();
    lastT = performance.now();
    cancelAnimationFrame(timer); timer = requestAnimationFrame(tick);
    tone(660, .08, 'triangle', .1);
    if (innerWidth < 700) $('board').scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
  let lastSec = DUR;
  function tick(now) {
    if (!running) return;
    const dt = Math.min(.1, (now - lastT) / 1000); lastT = now;
    if (!document.hidden) { timeLeft -= dt; elapsed += dt; }
    const bar = $('bar');
    if (timed()) {
      const s = Math.max(0, Math.ceil(timeLeft));
      $('sTime').textContent = s;
      bar.style.transform = `scaleX(${Math.max(0, timeLeft / DUR)})`; bar.classList.toggle('low', timeLeft < 10);
      if (s !== lastSec) { lastSec = s; if (s <= 5 && s > 0) tone(900, .04, 'square', .05); }
      if (timeLeft <= 0) return end();
    } else if (mode === 'daily') {
      $('sTime').textContent = clock(elapsed + penalty);
      bar.style.transform = `scaleX(${solved.length / 10})`; bar.classList.remove('low');
    } else { bar.style.transform = 'scaleX(1)'; bar.classList.remove('low'); }
    timer = requestAnimationFrame(tick);
  }

  function award(id) {
    if (data.badges[id]) return;
    data.badges[id] = Date.now();
    const b = BADGES.find((x) => x[0] === id);
    if (b) { newBadges.push(b); if (running) C.toast(`Badge: ${b[1]} ${b[2]}`); }
  }

  function end() {
    if (!running) return;
    running = false;
    cancelAnimationFrame(timer);
    if (word && mode !== 'daily' && !solved.some((s) => s.w === word && s.ok) && !solved.some((s) => s.w === word)) solved.push({ w: word, ok: false, last: true });
    const got = solved.filter((s) => s.ok).length;
    const total = mode === 'daily' ? Math.round(elapsed + penalty) : mode === 'zen' ? got : score;
    const before = C.getBest(bestKey());
    const { best, isNew } = C.best(bestKey(), total, mode !== 'daily');
    data.games++; data.bestStreak = Math.max(data.bestStreak, maxStreak);
    award('first');
    if (mode === 'sprint' && got >= 10) award('w10');
    if (mode === 'sprint' && got >= 15) award('w15');
    if (mode === 'themes' && score >= 500) award('theme');
    if (Object.keys(TH).every((k) => data.themesPlayed[k])) award('allthemes');
    if (mode === 'daily') { award('daily'); if (total < 120) award('dailyfast'); data.daily[today()] = data.daily[today()] ? Math.min(data.daily[today()], total) : total; }
    if (data.words >= 200) award('total200');
    save();
    const fmtv = (v) => mode === 'daily' ? clock(v) : v;
    $('sBest').textContent = fmtv(best);
    $('logo').hidden = true;
    $('cBig').hidden = false;
    $('cBig').textContent = fmtv(total);
    const isPB = isNew && before != null && total > 0;
    $('cTitle').textContent = isPB ? '🏆 New best!' : mode === 'daily' ? 'Daily ten done!' : got >= 12 ? 'Word wizard!' : got >= 6 ? 'Nicely unscrambled' : mode === 'zen' ? 'Nice and calm' : 'Time!';
    $('cText').textContent = mode === 'daily' ? `${got} of 10 solved, ${penalty / 20} passed · best ${fmtv(best)}` : `${got} word${got === 1 ? '' : 's'} · best ${fmtv(best)}`;
    $('cStats').innerHTML = '';
    [[got, 'Words'], [maxStreak, 'Best streak'], [solved.filter((s) => s.ok).reduce((a, s) => a.length >= s.w.length ? a : s.w, '').toUpperCase() || '-', 'Longest']].forEach(([v, l]) => { const d = document.createElement('div'); const b = document.createElement('b'); b.textContent = v; const s = document.createElement('span'); s.textContent = l; d.append(b, s); $('cStats').append(d); });
    $('cBadges').innerHTML = '';
    newBadges.forEach((bd) => { const s = document.createElement('span'); s.textContent = `${bd[1]} ${bd[2]}`; $('cBadges').append(s); });
    newBadges = [];
    const box = $('cWords'); box.innerHTML = '';
    solved.forEach((s) => { const sp = document.createElement('span'); sp.textContent = s.w; if (!s.ok) sp.className = 'miss'; box.append(sp); });
    $('go').textContent = 'Play again';
    $('share').hidden = false;
    $('cover').hidden = false;
    $('board').classList.add('is-covered');
    tone(440, .12, 'triangle', .1); tone(660, .2, 'triangle', .1, .12);
    if (isPB) C.confetti();
    paintPanels();
    $('go').focus({ preventScroll: true });
  }

  function paintPanels() {
    const got = BADGES.filter((b) => data.badges[b[0]]).length;
    $('badgeCount').textContent = `${got}/${BADGES.length}`;
    $('badgeList').innerHTML = '';
    BADGES.forEach(([id, ico, name, desc]) => {
      const d = document.createElement('div'); d.className = 'an-badge' + (data.badges[id] ? ' is-got' : '');
      const i = document.createElement('i'); i.textContent = ico;
      const t = document.createElement('div'); const b = document.createElement('b'); b.textContent = name; const s = document.createElement('span'); s.textContent = desc;
      t.append(b, s); d.append(i, t); $('badgeList').append(d);
    });
    const rows = [[data.games, 'Games'], [data.words, 'Words solved'], [data.bestStreak, 'Best streak'], [(data.longest || '-').toUpperCase(), 'Longest word'], [C.getBest('score') ?? '-', 'Best Sprint'], [data.daily[today()] ? clock(data.daily[today()]) : '-', 'Today\'s daily'], [C.fmt(DICT.size), 'Words in the bag']];
    $('statTbl').innerHTML = '';
    rows.forEach(([v, l]) => { const d = document.createElement('div'); const b = document.createElement('b'); b.textContent = v; const s = document.createElement('span'); s.textContent = l; d.append(b, s); $('statTbl').append(d); });
  }

  function setOpt(fn) { if (running) { running = false; cancelAnimationFrame(timer); } fn(); save(); paintOpts(); idleCover(); }
  function idleCover() {
    $('logo').hidden = false; $('cBig').hidden = true; $('cStats').innerHTML = ''; $('cBadges').innerHTML = ''; $('cWords').innerHTML = ''; $('share').hidden = true;
    $('cTitle').textContent = mode === 'daily' ? 'Today\'s ten words' : mode === 'themes' ? `${TH[theme][0]} words` : mode === 'zen' ? 'No clock. Just tiles.' : 'Ready to unscramble?';
    $('cText').textContent = mode === 'daily' ? 'Same ten for everyone. The stopwatch runs, passes add 20 seconds.' : mode === 'themes' ? 'Every word fits the theme. Sixty seconds.' : mode === 'zen' ? 'Solve at your own pace. Hints are free. Hit Finish when you are done.' : 'Tap the tiles or just type. Words get longer as you go.';
    $('go').textContent = 'Start';
    $('cover').hidden = false;
    $('board').classList.add('is-covered');
  }

  $('modes').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setOpt(() => { mode = b.dataset.m; data.mode = mode; }); });
  $('diffs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b && !b.disabled) setOpt(() => { diff = b.dataset.d; data.diff = diff; }); });
  $('themes').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setOpt(() => { theme = b.dataset.t; data.theme = theme; }); });
  $('go').addEventListener('click', start);
  $('shuffle').addEventListener('click', shuffle);
  $('hint').addEventListener('click', hint);
  $('clear').addEventListener('click', clearAll);
  $('skip').addEventListener('click', pass);
  $('stop').addEventListener('click', () => { if (running) end(); });
  $('share').addEventListener('click', () => {
    const got = solved.filter((s) => s.ok).length;
    const line = mode === 'daily' ? `Daily ten ${today()}: ${$('cBig').textContent}` : mode === 'zen' ? `${got} words in Zen` : `${score} points, ${got} words (${mode === 'themes' ? TH[theme][0] : 'Sprint ' + diff})`;
    const t = `Curio Anagram 🔤\n${line}\n${solved.map((s) => s.ok ? '🟩' : '🟥').join('')}`;
    navigator.clipboard?.writeText(t).then(() => C.toast('Result copied!'), () => C.toast(line));
  });
  document.querySelector('.an-ptabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]'); if (!b) return;
    document.querySelectorAll('.an-ptabs [data-tab]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    document.querySelectorAll('[data-pane]').forEach((p) => { p.hidden = p.dataset.pane !== b.dataset.tab; });
  });
  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (!running) { if (e.key === 'Enter' && !$('cover').hidden && !e.target.closest('button')) start(); return; }
    if (/^[a-zA-Z]$/.test(e.key)) { typed(e.key.toLowerCase()); e.preventDefault(); }
    else if (e.key === 'Backspace') { e.preventDefault(); if (!lock) backspace(); }
    else if (e.key === ' ') { e.preventDefault(); shuffle(); }
    else if (e.key === '?' || e.key === '/') { e.preventDefault(); hint(); }
    else if (e.key === 'Enter') { e.preventDefault(); pass(); }
    else if (e.key === 'Escape' && mode === 'zen') end();
  });
  paintOpts();
  paintPanels();
  idleCover();
  word = 'tiles';
  tiles = [...'listeqz'.slice(0, 5)].map((ch, i) => ({ ch, id: i, used: false }));
  slots = Array(5).fill(null);
  draw();
  window.__an = { get word() { return word; }, get running() { return running; }, get lock() { return lock; } };
})();
