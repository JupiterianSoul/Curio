(() => {
  const C = window.Curio;
  const $ = (id) => document.getElementById(id);
  const MODES = {
    sprint: { name: 'Sprint', icon: '⏱️', desc: 'Sixty seconds. Answer as many as you can.' },
    survival: { name: 'Survival', icon: '❤️', desc: 'Start with 15 seconds. Right answers buy time, slips cost 4 seconds.' },
    race: { name: 'Race 25', icon: '🏁', desc: 'Twenty-five answers, as fast as possible. Skips cost 3 seconds.' },
    daily: { name: 'Daily', icon: '📅', desc: 'Same sixty-second mixed set for everyone today. One fresh puzzle per day.' }
  };
  const OPS = [
    ['add', '+', 'Add'], ['sub', '−', 'Subtract'], ['mul', '×', 'Times'], ['div', '÷', 'Divide'],
    ['mix', '±×÷', 'Mixed'], ['sq', 'x²', 'Squares'], ['root', '√', 'Roots'], ['cube', 'x³', 'Cubes'],
    ['pct', '%', 'Percent'], ['miss', '?', 'Missing'], ['dbl', '2×', 'Doubles'], ['chain', 'a∘b∘c', 'Chains']
  ];
  const DIFFS = { easy: { name: 'Easy', f: .6 }, normal: { name: 'Normal', f: 1 }, hard: { name: 'Hard', f: 1.7 } };
  const BADGES = [
    ['first', '🌱', 'First spark', 'Answer your first question'],
    ['ten', '🔟', 'Double digits', 'Get 10 right in one game'],
    ['quarter', '⚡', 'Lightning brain', '25 right in a Sprint'],
    ['calc', '🤖', 'Human calculator', '40 right in a Sprint'],
    ['streak10', '🔥', 'On fire', 'A streak of 10'],
    ['streak25', '☄️', 'Unstoppable', 'A streak of 25'],
    ['quick', '🏎️', 'Reflexes', 'Answer in under 0.8 seconds'],
    ['survivor', '❤️', 'Survivor', 'Last 60 seconds in Survival'],
    ['iron', '🛡️', 'Iron will', 'Last 120 seconds in Survival'],
    ['race60', '🏁', 'Finisher', 'Finish Race 25 under 60s'],
    ['race30', '🚀', 'Speed demon', 'Finish Race 25 under 30s'],
    ['daily', '📅', 'Daily habit', 'Play a daily challenge'],
    ['daily3', '🗓️', 'Regular', 'Play 3 different daily challenges'],
    ['allops', '🎓', 'Polymath', 'Play all 12 operations'],
    ['hard20', '🧗', 'Hard mode hero', '20 right on Hard'],
    ['flawless', '💎', 'Flawless', '20+ right with no slips or skips'],
    ['hundred', '💯', 'Century', '100 correct answers in total'],
    ['thousand', '🏛️', 'Mathlete', '1000 correct answers in total']
  ];
  const SYMS = ['+', '−', '×', '÷', '=', '%', '√', 'π', '7', '3', '9', '∑', '²', '½'];
  const DATA_KEY = 'mm-data';
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

  function fresh() { return { v: 2, played: 0, correct: 0, bestStreak: 0, fastest: null, opsPlayed: [], dailies: [], badges: {}, history: [] }; }
  let data = C.store.get(DATA_KEY, null);
  if (!data || typeof data !== 'object' || data.v !== 2) data = fresh();
  data = Object.assign(fresh(), data);
  if (!Array.isArray(data.history)) data.history = [];
  if (!Array.isArray(data.opsPlayed)) data.opsPlayed = [];
  if (!Array.isArray(data.dailies)) data.dailies = [];
  if (!data.badges || typeof data.badges !== 'object') data.badges = {};
  const save = () => C.store.set(DATA_KEY, data);

  let mode = C.store.get('mm-mode', 'sprint'); if (!MODES[mode]) mode = 'sprint';
  let op = C.store.get('mm-level', 'add'); if (!OPS.some((o) => o[0] === op)) op = 'add';
  let diff = C.store.get('mm-diff', 'normal'); if (!DIFFS[diff]) diff = 'normal';
  let state = 'idle', q = null, input = '', score = 0, streak = 0, runBestStreak = 0, slips = 0, skips = 0, log = [], timeLeft = 60, elapsed = 0, t0 = 0, lastT = 0, raf = 0, k = 0, endedAt = 0, slipped = false, lastSec = 0;
  let rng = Math.random;

  function seeded(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    let a = h >>> 0;
    return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const R = (a, b) => Math.floor(a + rng() * (b - a + 1));
  const P = (arr) => arr[Math.floor(rng() * arr.length)];
  const curOp = () => (mode === 'daily' ? 'all' : op);
  const curDiff = () => (mode === 'daily' ? 'normal' : diff);

  function gen(kind) {
    const st = Math.min(k, 30), f = DIFFS[curDiff()].f;
    const sc = (n, min = 3) => Math.max(min, Math.round(n * f));
    if (kind === 'mix') kind = P(['add', 'sub', 'mul', 'div']);
    if (kind === 'all') kind = P(['add', 'sub', 'mul', 'div', 'sq', 'root', 'pct', 'miss', 'dbl', 'add', 'mul']);
    if (kind === 'add') { const hi = sc(12 + st * 3); const a = R(2, hi), b = R(2, hi); return { text: `${a} + ${b}`, a: a + b }; }
    if (kind === 'sub') { const hi = sc(15 + st * 3, 6); const a = R(5, hi), b = R(1, a); return { text: `${a} − ${b}`, a: a - b }; }
    if (kind === 'mul' || kind === 'div') {
      const hi = sc(st < 10 ? 10 : 12 + Math.floor((st - 10) / 4), 5);
      const a = R(2, hi), b = R(2, hi);
      return kind === 'mul' ? { text: `${a} × ${b}`, a: a * b } : { text: `${a * b} ÷ ${b}`, a };
    }
    if (kind === 'sq' || kind === 'root') {
      const n = R(st < 8 ? 2 : 4, Math.min(sc(st < 8 ? 12 : Math.min(25, 12 + st)), 40));
      return kind === 'sq' ? { text: `${n}<sup>2</sup>`, plain: `${n}²`, a: n * n } : { text: `√${n * n}`, a: n };
    }
    if (kind === 'cube') { const n = R(1, Math.min(sc(st < 10 ? 6 : 10), 15)); return { text: `${n}<sup>3</sup>`, plain: `${n}³`, a: n * n * n }; }
    if (kind === 'pct') {
      const opts = [[10, 10], [50, 2], [20, 5], [25, 4], [5, 20], [30, 10], [75, 4], [40, 5], [60, 5], [1, 100], [200, 1], [150, 2], [15, 20], [90, 10]];
      const [p, u] = P(opts.slice(0, Math.min(opts.length, 4 + Math.floor(st / 2) + (diff === 'hard' ? 4 : 0))));
      const base = R(1, sc(8 + st)) * u;
      return { text: `${p}% of ${base}`, a: (p * base) / 100, long: true };
    }
    if (kind === 'miss') {
      const form = P(['add', 'sub', 'mul', 'add2']);
      if (form === 'mul') { const hi = sc(st < 10 ? 9 : 12, 5); const a = R(2, hi), b = R(2, hi); return { text: `${a} × <i>?</i> = ${a * b}`, plain: `${a} × ? = ${a * b}`, a: b, long: true }; }
      const hi = sc(12 + st * 3); const a = R(2, hi), b = R(2, hi);
      if (form === 'sub') return { text: `${a + b} − <i>?</i> = ${a}`, plain: `${a + b} − ? = ${a}`, a: b, long: true };
      if (form === 'add2') return { text: `<i>?</i> + ${a} = ${a + b}`, plain: `? + ${a} = ${a + b}`, a: b, long: true };
      return { text: `${a} + <i>?</i> = ${a + b}`, plain: `${a} + ? = ${a + b}`, a: b, long: true };
    }
    if (kind === 'dbl') {
      const n = R(3, sc(20 + st * 5));
      return rng() < .5 ? { text: `<small>double</small>${n}`, plain: `double ${n}`, a: n * 2 } : { text: `<small>half of</small>${n * 2}`, plain: `half of ${n * 2}`, a: n };
    }
    const form = P(['amb', 'apb', 'pmc']);
    if (form === 'amb') { const a = R(2, sc(9, 4)), b = R(2, sc(9, 4)), c = R(1, sc(20)); return { text: `${a} × ${b} + ${c}`, a: a * b + c, long: true }; }
    if (form === 'pmc') { const a = R(2, sc(9, 4)), b = R(2, sc(9, 4)), c = R(1, a * b); return { text: `${a} × ${b} − ${c}`, a: a * b - c, long: true }; }
    const a = R(5, sc(30)), b = R(2, sc(30)), c = R(1, a + b); return { text: `${a} + ${b} − ${c}`, a: a + b - c, long: true };
  }

  const bestKey = () => {
    if (mode === 'daily') return `daily-${today()}`;
    if (mode === 'sprint' && diff === 'normal') return op;
    return `${mode}-${op}-${diff}`;
  };
  const lowerBetter = () => mode === 'race';
  const fmtBest = (v) => (v == null ? '-' : mode === 'race' ? C.fmt(v, 1) + 's' : mode === 'survival' ? v : v);

  function drawModes() {
    const box = $('modes'); box.innerHTML = '';
    Object.entries(MODES).forEach(([id, m]) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'mm-mode'; b.setAttribute('aria-pressed', id === mode);
      b.innerHTML = '<span></span>'; b.firstChild.textContent = m.icon; b.append(m.name);
      b.addEventListener('click', () => { if (state === 'play' || state === 'count') return; mode = id; C.store.set('mm-mode', id); C.beep(520, .04, 'triangle', .06); refreshSetup(); });
      box.append(b);
    });
    $('modeDesc').textContent = MODES[mode].desc;
  }
  function drawLevels() {
    const box = $('levels'); box.innerHTML = '';
    OPS.forEach(([id, sym, name]) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'mm-level'; b.setAttribute('aria-pressed', mode !== 'daily' && id === op); b.disabled = mode === 'daily';
      b.innerHTML = '<b></b><span></span><small></small>';
      b.querySelector('b').textContent = sym; b.querySelector('span').textContent = name;
      const savedOp = op;
      op = id; const best = C.getBest(bestKey()); op = savedOp;
      b.querySelector('small').textContent = best == null ? 'no best' : `best ${fmtBest(best)}`;
      b.addEventListener('click', () => { if (state === 'play' || state === 'count') return; op = id; C.store.set('mm-level', id); C.beep(600, .04, 'triangle', .06); refreshSetup(); });
      box.append(b);
    });
  }
  function drawDiffs() {
    const box = $('diffs'); box.innerHTML = '';
    Object.entries(DIFFS).forEach(([id, d]) => {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = d.name; b.setAttribute('aria-pressed', mode !== 'daily' && id === diff); b.disabled = mode === 'daily';
      b.addEventListener('click', () => { diff = id; C.store.set('mm-diff', id); C.beep(440, .04, 'triangle', .06); refreshSetup(); });
      box.append(b);
    });
  }
  function refreshSetup(keep) { drawModes(); drawLevels(); drawDiffs(); paintBest(); if (!keep) { preview(); paintIdleStats(); if (state === 'over') idleCover(); } paintShelf(); }
  function idleCover() {
    state = 'idle'; $('art').hidden = false; $('medal').hidden = true; $('share').hidden = true;
    $('cTitle').textContent = `${MODES[mode].icon} ${MODES[mode].name}, ready?`; $('cText').textContent = MODES[mode].desc; $('go').textContent = 'Start';
  }
  const paintBest = () => { $('sBest').textContent = fmtBest(C.getBest(bestKey())); };
  function paintIdleStats() {
    $('sTimeL').textContent = mode === 'race' ? 'Elapsed' : 'Seconds';
    $('sTime').textContent = mode === 'race' ? '0.0' : mode === 'survival' ? 15 : 60;
    $('bar').style.transform = 'scaleX(1)'; $('bar').classList.remove('low');
  }

  function drawPad() {
    const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', 'skip', '0', 'del'];
    keys.forEach((key) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'mm-key' + (key.length > 1 ? ' alt' : ''); b.dataset.key = key;
      b.textContent = key === 'del' ? '⌫' : key === 'skip' ? 'Skip' : key;
      b.setAttribute('aria-label', key === 'del' ? 'Delete' : key === 'skip' ? 'Skip question' : key);
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); press(key); });
      b.addEventListener('click', (e) => { if (e.detail === 0) press(key); });
      $('pad').append(b);
    });
  }
  function flashKey(key) {
    const b = $('pad').querySelector(`[data-key="${key}"]`);
    if (!b) return; b.classList.add('press'); setTimeout(() => b.classList.remove('press'), 90);
  }
  function drawBgSyms() {
    const box = $('bgsym');
    for (let i = 0; i < 16; i++) {
      const s = document.createElement('span');
      s.textContent = SYMS[i % SYMS.length];
      s.style.left = (i * 61 % 100) + '%'; s.style.top = (i * 37 % 90) + '%';
      s.style.fontSize = (18 + (i * 13 % 30)) + 'px';
      s.style.animationDuration = (6 + i % 5) + 's'; s.style.animationDelay = (-i * .7) + 's';
      box.append(s);
    }
  }

  const buzz = (ms) => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} };
  function pop(text, cls = '') {
    const el = document.createElement('div'); el.className = 'mm-pop ' + cls; el.textContent = text;
    el.style.left = (50 + (Math.random() - .5) * 20) + '%';
    const fx = $('fx'); const old = fx.querySelectorAll('.mm-pop'); if (old.length > 3) old[0].remove();
    fx.append(el); el.addEventListener('animationend', () => el.remove());
  }
  function sparks(n, colors) {
    for (let i = 0; i < n; i++) {
      const s = document.createElement('i'); s.className = 'mm-spark';
      const a = Math.random() * Math.PI * 2, d = 50 + Math.random() * 70;
      s.style.setProperty('--dx', Math.cos(a) * d + 'px'); s.style.setProperty('--dy', Math.sin(a) * d * .6 + 'px');
      s.style.background = colors[i % colors.length];
      $('fx').append(s); s.addEventListener('animationend', () => s.remove());
    }
  }
  function chord(freqs, gap = 70, len = .09, type = 'triangle') { freqs.forEach((f, i) => setTimeout(() => C.beep(f, len, type, .09), i * gap)); }

  function press(key) {
    if (state === 'idle' || state === 'over') {
      if (key === 'del') return;
      if (state === 'over' && performance.now() - endedAt < 900) return;
      if (state === 'over' && key !== 'skip') return;
      begin(); return;
    }
    if (state !== 'play') return;
    if (key === 'del') { input = input.slice(0, -1); C.beep(300, .02, 'sine', .05); }
    else if (key === 'skip') { skip(); return; }
    else if (input.length < 5) { input += key; C.beep(500 + Number(key) * 30, .03, 'triangle', .06); }
    paintAns();
    const want = String(q.a);
    if (input === want) ok();
    else if (input.length >= want.length && input !== want.slice(0, input.length)) wrong();
  }
  function paintAns() { $('ansText').textContent = input; }
  function record(kind) { log.push({ text: q.plain || q.text, a: q.a, t: (performance.now() - t0) / 1000, ok: kind === 'ok', slip: slipped }); }

  function wrong() {
    const a = $('ans'); a.classList.remove('bad'); void a.offsetWidth; a.classList.add('bad');
    const s = $('screen'); s.classList.remove('shake'); void s.offsetWidth; s.classList.add('shake');
    C.beep(160, .12, 'sawtooth', .06); buzz(50);
    slips++; slipped = true; streak = 0; paintStreak();
    if (mode === 'survival') { timeLeft -= 4; pop('-4s', 'bad'); }
    else pop('✗', 'bad');
    setTimeout(() => { input = ''; paintAns(); a.classList.remove('bad'); }, 260);
  }
  function skip() {
    record('skip'); skips++; streak = 0; paintStreak();
    C.beep(250, .08, 'sine', .08); flashKey('skip');
    if (mode === 'race') { elapsed += 3; pop('+3s', 'bad'); }
    if (mode === 'survival') { timeLeft -= 2; pop('-2s', 'bad'); }
    next();
  }
  function ok() {
    record('ok');
    score++; streak++; runBestStreak = Math.max(runBestStreak, streak);
    const s = $('sScore'); s.textContent = score; s.classList.remove('bump'); void s.offsetWidth; s.classList.add('bump');
    $('ans').classList.add('good');
    C.beep(700 + Math.min(streak, 30) * 18, .07, 'triangle', .1); buzz(12);
    sparks(8, ['#ffd54f', '#fff', '#b39ddb', '#69f0ae']);
    if (mode === 'survival') { const bonus = Math.max(1, 3 - score * .04); timeLeft = Math.min(30, timeLeft + bonus); pop('+' + C.fmt(bonus, 1) + 's'); }
    else pop('+1');
    if (streak && streak % 5 === 0) {
      pop(`🔥 ${streak} streak!`, 'big');
      chord([880, 1100, 1320], 60); sparks(16, ['#ff7043', '#ffca28', '#fff']);
      const sc = $('screen'); sc.classList.add('glow'); setTimeout(() => sc.classList.remove('glow'), 400);
    }
    paintStreak();
    setTimeout(() => { $('ans').classList.remove('good'); }, 140);
    if (mode === 'race' && score >= 25) return end();
    next();
  }
  function paintStreak() {
    const f = $('flame'), el = $('sStreak');
    el.textContent = streak; el.classList.toggle('hot', streak >= 5);
    f.textContent = streak >= 10 ? `🔥🔥 x${streak}` : `🔥 x${streak}`;
    f.classList.toggle('on', streak >= 3); f.classList.toggle('big', streak >= 10);
  }
  function setQ(qq) {
    const el = $('q'); el.innerHTML = qq.text; el.classList.toggle('long', !!qq.long);
    el.setAttribute('aria-label', (qq.plain || qq.text).replace(/<[^>]+>/g, ''));
  }
  function next() {
    k++;
    let nq; let guard = 0; do { nq = gen(curOp()); } while (q && nq.text === q.text && guard++ < 10);
    q = nq; input = ''; slipped = false; paintAns();
    setQ(q); const el = $('q'); el.classList.remove('in'); void el.offsetWidth; el.classList.add('in');
    t0 = performance.now();
  }
  function preview() { k = 0; rng = Math.random; q = gen(curOp()); setQ(q); }

  function begin() {
    state = 'count';
    document.querySelector('.mm').classList.add('playing');
    $('coverIn').hidden = true; const c = $('count'); c.hidden = false;
    $('result').hidden = true; $('pad').hidden = false;
    let n = 3;
    const step = () => {
      if (state !== 'count') return;
      if (n === 0) { c.hidden = true; $('coverIn').hidden = false; start(); return; }
      c.innerHTML = `<span>${n}</span>`; C.beep(n === 1 ? 660 : 440, .08, 'triangle', .08);
      n--; setTimeout(step, 420);
    };
    step();
  }
  function start() {
    state = 'play'; score = 0; streak = 0; runBestStreak = 0; slips = 0; skips = 0; log = []; k = 0; q = null; elapsed = 0;
    timeLeft = mode === 'survival' ? 15 : 60;
    rng = mode === 'daily' ? seeded('mm-' + today()) : Math.random;
    $('sScore').textContent = 0; paintStreak(); $('cover').hidden = true;
    next();
    lastT = performance.now(); lastSec = -1;
    cancelAnimationFrame(raf); raf = requestAnimationFrame(tick);
    chord([523, 784]);
  }
  function tick(now) {
    if (state !== 'play') return;
    const dt = Math.min(.1, (now - lastT) / 1000); lastT = now;
    if (!document.hidden) { elapsed += dt; if (mode !== 'race') timeLeft -= dt; }
    const bar = $('bar');
    if (mode === 'race') {
      $('sTime').textContent = C.fmt(elapsed, 1);
      bar.style.transform = `scaleX(${Math.max(0.001, 1 - score / 25)})`; bar.classList.remove('low');
    } else {
      const s = Math.max(0, Math.ceil(timeLeft));
      $('sTime').textContent = s;
      const full = mode === 'survival' ? 30 : 60;
      bar.style.transform = `scaleX(${Math.max(0, Math.min(1, timeLeft / full))})`; bar.classList.toggle('low', timeLeft < (mode === 'survival' ? 5 : 10));
      if (s !== lastSec) { lastSec = s; if (s <= 5 && s > 0) C.beep(900, .04, 'square', .05); }
      if (timeLeft <= 0) return end();
    }
    raf = requestAnimationFrame(tick);
  }
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) hiddenAt = performance.now();
    else { lastT = performance.now(); if (hiddenAt) { t0 += performance.now() - hiddenAt; hiddenAt = 0; } }
  });

  function quit() {
    if (state !== 'play' && state !== 'count') return;
    state = 'idle'; cancelAnimationFrame(raf);
    document.querySelector('.mm').classList.remove('playing');
    $('cover').hidden = false; $('count').hidden = true; $('coverIn').hidden = false;
    $('cTitle').textContent = 'Run abandoned'; $('cText').textContent = 'No harm done. Pick a mode and go again.';
    $('go').textContent = 'Start'; $('share').hidden = true; $('medal').hidden = true; $('art').hidden = false;
    refreshSetup();
  }

  function grade() {
    const per = mode === 'race' ? (score >= 25 ? 25 / elapsed * 60 : score) : mode === 'survival' ? elapsed / 3 : score;
    const f = DIFFS[curDiff()].f;
    const v = per / Math.sqrt(f);
    if (v >= 40) return ['S', '#ffd54f', '#ff8f00'];
    if (v >= 28) return ['A', '#e0e0e0', '#9e9e9e'];
    if (v >= 18) return ['B', '#ffcc80', '#e65100'];
    if (v >= 10) return ['C', '#b39ddb', '#5e35b1'];
    return ['D', '#90a4ae', '#455a64'];
  }
  function medalSVG(g) {
    return `<svg viewBox="0 0 120 130"><path d="M38 0h18l10 40H48zM82 0H64L54 40h18z" fill="#ef5350"/><path d="M44 0h6l10 40h-6zM70 0h6L66 40h-6z" fill="#fff" opacity=".5"/><circle cx="60" cy="80" r="44" fill="${g[2]}"/><circle cx="60" cy="80" r="38" fill="${g[1]}"/><circle cx="60" cy="80" r="30" fill="none" stroke="${g[2]}" stroke-width="2" stroke-dasharray="4 4"/><text x="60" y="96" text-anchor="middle" font-family="ui-rounded,system-ui,sans-serif" font-size="46" font-weight="900" fill="${g[2]}">${g[0]}</text><path d="M30 60a36 36 0 0 1 22-18" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".6"/></svg>`;
  }

  function unlock(id) {
    if (data.badges[id]) return;
    data.badges[id] = Date.now();
    const b = BADGES.find((x) => x[0] === id);
    if (b) setTimeout(() => { C.toast(`${b[1]} Badge unlocked: ${b[2]}`); chord([660, 880, 1175], 90); }, 700);
  }

  function end() {
    state = 'over'; endedAt = performance.now(); cancelAnimationFrame(raf);
    document.querySelector('.mm').classList.remove('playing');
    const finished = mode !== 'race' || score >= 25;
    const result = mode === 'race' ? Math.round(elapsed * 10) / 10 : mode === 'survival' ? score : score;
    const { isNew } = finished ? C.best(bestKey(), result, !lowerBetter()) : { isNew: false };
    const surv = Math.round(elapsed);
    data.played++; data.correct += score; data.bestStreak = Math.max(data.bestStreak, runBestStreak);
    const okTimes = log.filter((l) => l.ok && !l.slip).map((l) => l.t);
    const fast = okTimes.length ? Math.min(...okTimes) : null;
    if (fast != null && (data.fastest == null || fast < data.fastest)) data.fastest = fast;
    if (mode !== 'daily' && !data.opsPlayed.includes(op)) data.opsPlayed.push(op);
    if (mode === 'daily' && !data.dailies.includes(today())) data.dailies.push(today());
    data.history.unshift({ d: Date.now(), m: mode, o: curOp(), f: curDiff(), s: score, t: Math.round(elapsed * 10) / 10 });
    data.history = data.history.slice(0, 40);
    if (score >= 1) unlock('first');
    if (score >= 10) unlock('ten');
    if (mode === 'sprint' && score >= 25) unlock('quarter');
    if (mode === 'sprint' && score >= 40) unlock('calc');
    if (runBestStreak >= 10) unlock('streak10');
    if (runBestStreak >= 25) unlock('streak25');
    if (fast != null && fast < .8) unlock('quick');
    if (mode === 'survival' && elapsed >= 60) unlock('survivor');
    if (mode === 'survival' && elapsed >= 120) unlock('iron');
    if (mode === 'race' && finished && elapsed < 60) unlock('race60');
    if (mode === 'race' && finished && elapsed < 30) unlock('race30');
    if (mode === 'daily') unlock('daily');
    if (data.dailies.length >= 3) unlock('daily3');
    if (data.opsPlayed.length >= OPS.length) unlock('allops');
    if (curDiff() === 'hard' && score >= 20) unlock('hard20');
    if (score >= 20 && slips === 0 && skips === 0) unlock('flawless');
    if (data.correct >= 100) unlock('hundred');
    if (data.correct >= 1000) unlock('thousand');
    save();

    const g = grade();
    const opName = mode === 'daily' ? 'Daily mix' : OPS.find((o) => o[0] === op)[2];
    $('art').hidden = true; const m = $('medal'); m.hidden = false; m.innerHTML = medalSVG(g);
    if (mode === 'race') $('cTitle').textContent = finished ? (isNew ? `🏆 New best: ${C.fmt(elapsed, 1)}s!` : `Finished in ${C.fmt(elapsed, 1)}s`) : `${score} of 25`;
    else if (mode === 'survival') $('cTitle').textContent = isNew && score > 0 ? `🏆 New best: ${score} answers, ${surv}s alive!` : `${score} answers, survived ${surv}s`;
    else $('cTitle').textContent = isNew && score > 0 ? `🏆 New ${opName} best: ${score}!` : `${score} correct`;
    const lines = { S: 'Are you secretly a calculator?', A: 'Lightning brain. Seriously quick.', B: 'Nicely done. One more for an A?', C: 'Warming up. The next one is yours.', D: 'The numbers won this time.' };
    $('cText').textContent = `Grade ${g[0]}: ${lines[g[0]]}`;
    $('go').textContent = 'Play again'; $('share').hidden = false;
    $('cover').hidden = false; $('coverIn').hidden = false;
    if (isNew && score > 0) C.confetti();
    if (g[0] === 'S' || g[0] === 'A') chord([523, 659, 784, 1047], 90); else chord([660, 520, 400], 100);
    lastShare = shareText(g[0], opName, finished);
    results();
    refreshSetup(true);
    requestAnimationFrame(() => $('screen').scrollIntoView({ block: 'center', behavior: 'smooth' }));
  }

  let lastShare = '';
  function shareText(gr, opName, finished) {
    const head = `🧠 Zoble Mental Math, ${MODES[mode].name}${mode === 'daily' ? ' ' + today() : ` (${opName}, ${DIFFS[diff].name})`}`;
    const main = mode === 'race' ? (finished ? `🏁 25 answers in ${C.fmt(elapsed, 1)}s` : `🏁 ${score}/25`) : mode === 'survival' ? `❤️ ${score} answers, ${Math.round(elapsed)}s alive` : `⏱️ ${score} correct in 60s`;
    const strip = log.slice(0, 30).map((l) => (l.ok ? (l.slip ? '🟨' : '🟩') : '⬜')).join('');
    return `${head}\n${main} · grade ${gr} · best streak ${runBestStreak}\n${strip}`;
  }
  async function share() {
    try { await navigator.clipboard.writeText(lastShare); C.toast('Result copied to clipboard'); }
    catch (e) { C.modal({ emoji: '📋', title: 'Copy your result', body: lastShare, buttons: [{ label: 'Done', value: 1 }] }); }
  }

  function results() {
    const box = $('result'); box.hidden = false;
    $('pad').hidden = true;
    const done = log.filter((l) => l.ok);
    const avg = done.length ? done.reduce((a, l) => a + l.t, 0) / done.length : 0;
    const fastest = done.length ? done.reduce((a, l) => (l.t < a.t ? l : a)) : null;
    const sum = $('summary'); sum.innerHTML = '';
    [`✓ ${done.length} correct`, `⏭️ ${skips} skipped`, `✗ ${slips} slips`, `🔥 best streak ${runBestStreak}`, `⏱️ ${done.length ? C.fmt(avg, 2) + 's' : '-'} average`, fastest ? `⚡ fastest: ${fastest.text} in ${C.fmt(fastest.t, 2)}s` : ''].filter(Boolean)
      .forEach((t) => { const s = document.createElement('span'); s.textContent = t; sum.append(s); });
    drawChart(avg);
  }

  let tipT = 0;
  function drawChart(avg) {
    const svg = $('chart');
    const W = 480, H = 170, L = 30, B = 22, T = 10, Rr = 6;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = '';
    const ns = 'http://www.w3.org/2000/svg';
    const el = (tag, attrs) => { const e = document.createElementNS(ns, tag); for (const k2 in attrs) e.setAttribute(k2, attrs[k2]); svg.append(e); return e; };
    if (!log.length) { const t = el('text', { x: W / 2, y: H / 2, 'text-anchor': 'middle', class: 'axis' }); t.textContent = 'No answers this time'; return; }
    const maxT = Math.max(2, Math.ceil(Math.max(...log.map((l) => l.t))));
    const step = maxT <= 4 ? 1 : maxT <= 10 ? 2 : 5;
    const top = Math.ceil(maxT / step) * step;
    const ph = H - B - T, pw = W - L - Rr;
    for (let v = 0; v <= top; v += step) {
      const y = T + ph - (v / top) * ph;
      el('line', { x1: L, x2: W - Rr, y1: y, y2: y, class: 'grid' });
      const t = el('text', { x: L - 6, y: y + 4, 'text-anchor': 'end', class: 'axis' }); t.textContent = v + 's';
    }
    const slot = pw / log.length, bw = Math.max(2, Math.min(22, slot - 2));
    let tip = document.querySelector('.mm-tip'); if (!tip) { tip = document.createElement('div'); tip.className = 'mm-tip'; document.body.append(tip); } tip.hidden = true;
    log.forEach((l, i) => {
      const h = Math.max(2, (l.t / top) * ph);
      const x = L + i * slot + (slot - bw) / 2, y = T + ph - h;
      const r = Math.min(4, bw / 2);
      const d = `M${x},${T + ph}V${y + r}Q${x},${y} ${x + r},${y}H${x + bw - r}Q${x + bw},${y} ${x + bw},${y + r}V${T + ph}Z`;
      const p = el('path', { d, class: 'bar' + (l.ok ? (l.slip ? ' slip' : '') : ' skip') });
      const hit = el('rect', { x: L + i * slot, y: T, width: slot, height: ph, fill: 'transparent' });
      const label = `#${i + 1}  ${l.text} = ${l.a}  ·  ${C.fmt(l.t, 2)}s${l.ok ? (l.slip ? ' (after a slip)' : '') : ' (skipped)'}`;
      const ttl = document.createElementNS(ns, 'title'); ttl.textContent = label; hit.append(ttl);
      hit.addEventListener('pointerenter', () => { tip.textContent = label; tip.hidden = false; p.style.opacity = .7; });
      hit.addEventListener('pointermove', (e) => { tip.style.left = e.clientX + 'px'; tip.style.top = e.clientY + 'px'; });
      hit.addEventListener('pointerleave', () => { tip.hidden = true; p.style.opacity = ''; });
      hit.addEventListener('click', (e) => { tip.textContent = label; tip.hidden = false; tip.style.left = e.clientX + 'px'; tip.style.top = e.clientY + 'px'; clearTimeout(tipT); tipT = setTimeout(() => { tip.hidden = true; }, 2200); });
    });
    if (avg) { const y = T + ph - (avg / top) * ph; el('line', { x1: L, x2: W - Rr, y1: y, y2: y, class: 'avg' }); }
    const every = Math.ceil(log.length / 12);
    log.forEach((l, i) => {
      if (i % every && i !== log.length - 1) return;
      const t = el('text', { x: L + i * slot + slot / 2, y: H - 6, 'text-anchor': 'middle', class: 'axis' }); t.textContent = i + 1;
    });
  }

  function paintShelf() {
    const st = $('pane-stats'); st.innerHTML = '';
    const grid = document.createElement('div'); grid.className = 'mm-grid';
    [[data.played, 'games played'], [data.correct, 'answers right'], [data.bestStreak, 'best streak'], [data.fastest == null ? '-' : C.fmt(data.fastest, 2) + 's', 'fastest answer'], [data.dailies.length, 'dailies played'], [`${data.opsPlayed.length}/${OPS.length}`, 'operations tried']]
      .forEach(([v, l]) => { const d = document.createElement('div'); d.innerHTML = '<b></b><span></span>'; d.firstChild.textContent = v; d.lastChild.textContent = l; grid.append(d); });
    st.append(grid);
    const sprints = data.history.filter((h) => h.m === 'sprint' || h.m === 'daily').slice(0, 20).reverse();
    if (sprints.length >= 2) {
      const ns = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('class', 'mm-spark-line'); svg.setAttribute('viewBox', '0 0 300 60'); svg.setAttribute('preserveAspectRatio', 'none');
      svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'Recent sprint scores');
      const mx = Math.max(5, ...sprints.map((h) => h.s));
      const pts = sprints.map((h, i) => [6 + i * (288 / (sprints.length - 1)), 54 - (h.s / mx) * 48]);
      const path = document.createElementNS(ns, 'path'); path.setAttribute('d', 'M' + pts.map((p) => p.join(',')).join('L')); svg.append(path);
      const last = pts[pts.length - 1]; const c = document.createElementNS(ns, 'circle'); c.setAttribute('cx', last[0]); c.setAttribute('cy', last[1]); c.setAttribute('r', 4); svg.append(c);
      const cap = document.createElement('p'); cap.className = 'c-muted'; cap.style.margin = '10px 0 0'; cap.style.fontSize = '13px'; cap.textContent = 'Recent Sprint and Daily scores';
      st.append(cap, svg);
    }
    if (data.history.length) {
      const ul = document.createElement('ul'); ul.className = 'mm-hist';
      data.history.slice(0, 6).forEach((h) => {
        const li = document.createElement('li');
        const opn = h.o === 'all' ? 'Daily mix' : (OPS.find((o) => o[0] === h.o) || ['', '', h.o])[2];
        const res = h.m === 'race' ? (h.s >= 25 ? `${C.fmt(h.t, 1)}s` : `${h.s}/25`) : h.m === 'survival' ? `${h.s} in ${Math.round(h.t)}s` : `${h.s}`;
        li.innerHTML = '<span></span><b></b>'; li.firstChild.textContent = `${MODES[h.m] ? MODES[h.m].icon : ''} ${opn} · ${DIFFS[h.f] ? DIFFS[h.f].name : ''}`; li.lastChild.textContent = res;
        ul.append(li);
      });
      st.append(ul);
    }
    const bd = $('pane-badges'); bd.innerHTML = '';
    const bg = document.createElement('div'); bg.className = 'mm-badges';
    BADGES.forEach(([id, ic, name, desc]) => {
      const d = document.createElement('div'); d.className = 'mm-badge' + (data.badges[id] ? ' on' : '');
      d.innerHTML = '<i></i><div><b></b><span></span></div>';
      d.querySelector('i').textContent = ic; d.querySelector('b').textContent = name; d.querySelector('span').textContent = desc;
      bg.append(d);
    });
    bd.append(bg);
    $('badgeCount').textContent = `${Object.keys(data.badges).length}/${BADGES.length}`;
    const be = $('pane-bests'); be.innerHTML = '';
    const bb = document.createElement('div'); bb.className = 'mm-bests';
    const savedMode = mode, savedOp = op, savedDiff = diff;
    ['sprint', 'survival', 'race'].forEach((mm) => OPS.forEach(([id, , name]) => {
      mode = mm; op = id; diff = savedDiff;
      const v = C.getBest(bestKey());
      if (v == null) return;
      const d = document.createElement('div'); d.innerHTML = '<span></span><b></b>';
      d.firstChild.textContent = `${MODES[mm].icon} ${name}`; d.lastChild.textContent = fmtBest(v); bb.append(d);
    }));
    mode = savedMode; op = savedOp; diff = savedDiff;
    if (!bb.children.length) { const p = document.createElement('p'); p.className = 'c-muted'; p.textContent = `No ${DIFFS[diff].name} bests yet. Play a round!`; be.append(p); }
    else { const p = document.createElement('p'); p.className = 'c-muted'; p.style.margin = '0 0 8px'; p.style.fontSize = '13px'; p.textContent = `Showing ${DIFFS[diff].name} difficulty`; be.append(p, bb); }
  }
  document.querySelectorAll('.mm-tab').forEach((t) => t.addEventListener('click', () => {
    document.querySelectorAll('.mm-tab').forEach((x) => x.setAttribute('aria-selected', x === t));
    ['stats', 'badges', 'bests'].forEach((id) => { $('pane-' + id).hidden = id !== t.dataset.tab; });
  }));

  function how() {
    const d = document.createElement('div'); d.className = 'mm-howcard';
    d.innerHTML = '<p>Type the answer with the keypad or keyboard. It locks in the moment it is right, no Enter needed. Wrong answers flash red. Skip anything that stumps you.</p><ul><li><b>Sprint</b>: 60 seconds, most answers wins.</li><li><b>Survival</b>: the clock is your life. Right answers add time, slips take it away.</li><li><b>Race 25</b>: get 25 right as fast as you can.</li><li><b>Daily</b>: one fixed mixed set per day, the same for everyone.</li></ul><p>Every 5 in a row lights the fire. Collect all 18 badges. <span class="c-kbd">Esc</span> quits a run.</p>';
    C.modal({ emoji: '🧠', title: 'How to play', body: d, buttons: [{ label: 'Got it', value: 1 }] });
  }

  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (document.querySelector('.curio-modal')) return;
    if (/^[0-9]$/.test(e.key)) { if (state === 'play') { e.preventDefault(); flashKey(e.key); press(e.key); } }
    else if (e.key === 'Backspace') { if (state === 'play') { e.preventDefault(); flashKey('del'); press('del'); } }
    else if (e.key === 'Escape') { quit(); }
    else if (e.key === 'Enter') {
      if (state !== 'play' && document.activeElement && document.activeElement.tagName === 'BUTTON') return;
      e.preventDefault();
      if (state === 'play') press('skip');
      else if (state === 'idle' || (state === 'over' && performance.now() - endedAt > 900)) begin();
    }
  });
  $('go').addEventListener('click', () => { if (state === 'idle' || state === 'over') begin(); });
  $('share').addEventListener('click', share);
  $('how').addEventListener('click', how);
  drawPad(); drawBgSyms(); refreshSetup();
})();
