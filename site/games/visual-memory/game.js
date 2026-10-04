(() => {
  const $ = (id) => document.getElementById(id);
  const board = $('board'), grid = $('grid'), msg = $('msg'), fx = $('fx'), banner = $('banner'), timerBar = $('timer');
  const dots = [...document.querySelectorAll('#dots span')];

  const MODES = {
    classic: { name: 'Classic', ico: '🔲' },
    sequence: { name: 'Sequence', ico: '🎼' },
    mirror: { name: 'Mirror', ico: '🪞' },
    daily: { name: 'Daily', ico: '📅' }
  };
  const DIFFS = { relaxed: { name: 'Relaxed', k: 1.6 }, normal: { name: 'Normal', k: 1 }, blitz: { name: 'Blitz', k: 0.55 } };
  const THEMES = {
    ocean: ['#1b4f91', '#2d7ad0'], sunset: ['#a8321a', '#f07a2c'], forest: ['#145a3a', '#2f9a62'], grape: ['#3c1a78', '#7d43d6'], neon: ['#0b1022', '#5ef0ff']
  };
  const BADGES = [
    ['first', '🎬', 'First Flash', 'Finish a game'],
    ['l5', '🌱', 'Warming Up', 'Reach level 5'],
    ['l10', '🧠', 'Sharp', 'Reach level 10'],
    ['l15', '🐘', 'Elephant', 'Reach level 15'],
    ['l20', '📸', 'Photographic', 'Reach level 20'],
    ['perfect5', '✨', 'Flawless Five', 'Clear 5 levels in a row with no mistakes'],
    ['seq8', '🎼', 'Conductor', 'Reach level 8 in Sequence'],
    ['mir8', '🪞', 'Looking Glass', 'Reach level 8 in Mirror'],
    ['blitz8', '⚡', 'Blink', 'Reach level 8 on Blitz'],
    ['daily', '📅', 'Daily Habit', 'Play a daily challenge'],
    ['streak3', '🔥', 'Three-peat', 'Daily challenge 3 days running'],
    ['games25', '🎮', 'Regular', 'Play 25 games']
  ];

  const fresh = () => ({ v: 2, games: 0, levels: 0, tiles: 0, history: [], badges: {}, daily: {}, streak: 0, lastDaily: '', mode: 'classic', diff: 'normal', theme: 'ocean' });
  function load() {
    const d = Curio.store.get('vm:data', null);
    if (!d || typeof d !== 'object' || d.v !== 2) return fresh();
    const f = Object.assign(fresh(), d);
    if (!Array.isArray(f.history)) f.history = [];
    if (!MODES[f.mode]) f.mode = 'classic';
    if (!DIFFS[f.diff]) f.diff = 'normal';
    if (!THEMES[f.theme]) f.theme = 'ocean';
    return f;
  }
  const data = load();
  const save = () => Curio.store.set('vm:data', data);

  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const hash = (s) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = (seed) => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const shuffleWith = (arr, r) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  function tone(f, d = 0.12, type = 'sine', vol = 0.12, when = 0, slide = 0) {
    if (Curio.muted) return;
    const ac = Curio.audioContext(); if (!ac) return;
    const t = ac.currentTime + when;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d + 0.03);
  }
  const buzz = (ms) => { try { navigator.vibrate?.(ms); } catch {} };
  const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5, 1568, 1760];

  const sizeFor = (lv, m) => m === 'sequence' ? (lv <= 3 ? 3 : lv <= 7 ? 4 : lv <= 12 ? 5 : 6) : (lv <= 2 ? 3 : lv <= 4 ? 4 : lv <= 7 ? 5 : lv <= 11 ? 6 : 7);
  const countFor = (lv, m) => m === 'sequence' ? Math.min(lv + 2, sizeFor(lv, m) ** 2) : Math.min(lv + 2, Math.floor(sizeFor(lv, m) ** 2 * 0.62));

  let mode = data.mode, diff = data.diff;
  let level = 1, lives = 3, misses = 0, n = 3, attempt = 0;
  let pattern = [], targets = new Set(), found = new Set(), seqPos = 0;
  let phase = 'menu', timers = [], focusIdx = 0, run = [], perfectStreak = 0, bestStreak = 0, tilesHit = 0, newBadges = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
  const speed = () => mode === 'daily' ? 1 : DIFFS[diff].k;
  const bestKey = () => mode === 'daily' ? `daily-${today()}` : (mode === 'classic' && diff === 'normal' ? 'level' : `${mode}-${diff}`);

  function show(id) {
    ['menu', 'game', 'result'].forEach((s) => { $(s).hidden = s !== id; });
  }

  function paintMenu() {
    document.querySelectorAll('#modes .vm-mode').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.m === mode)));
    document.querySelectorAll('#diffs button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.d === diff)));
    $('diffs').classList.toggle('is-off', mode === 'daily');
    const tw = $('themes');
    if (!tw.children.length) {
      Object.entries(THEMES).forEach(([k, [a, b]]) => {
        const s = document.createElement('button');
        s.type = 'button'; s.className = 'vm-sw'; s.dataset.t = k;
        s.setAttribute('aria-label', `${k} board`);
        s.style.background = `linear-gradient(135deg, ${b}, ${a})`;
        tw.append(s);
      });
    }
    tw.querySelectorAll('.vm-sw').forEach((s) => s.setAttribute('aria-pressed', String(s.dataset.t === data.theme)));
    applyTheme();
    const dToday = data.daily[today()];
    $('dailyDesc').textContent = dToday ? `Today: level ${dToday}. Try to top it.` : 'Same patterns for everyone today.';
    const b = Curio.getBest(bestKey());
    $('menuBest').textContent = mode === 'daily'
      ? `Daily streak: ${data.streak} day${data.streak === 1 ? '' : 's'}`
      : (b == null ? `No ${MODES[mode].name} ${DIFFS[diff].name} record yet.` : `Best ${MODES[mode].name} on ${DIFFS[diff].name}: level ${b}`);
  }
  function applyTheme() {
    Object.keys(THEMES).forEach((k) => board.classList.toggle(`t-${k}`, k === data.theme && k !== 'ocean'));
  }

  function paintStats() {
    $('level').textContent = level;
    $('lives').innerHTML = [0, 1, 2].map((i) => `<i class="${i < lives ? '' : 'is-gone'}">❤️</i>`).join('');
    $('lives').setAttribute('aria-label', `${lives} lives`);
    const b = Curio.getBest(bestKey());
    $('best').textContent = b == null ? '-' : b;
    $('modeChip').textContent = `${MODES[mode].ico} ${MODES[mode].name}${mode === 'daily' ? '' : ' · ' + DIFFS[diff].name}`;
    dots.forEach((d, i) => d.classList.toggle('is-x', i < misses));
    $('dots').hidden = mode === 'sequence';
  }

  function build() {
    const prevN = n;
    n = sizeFor(level, mode);
    board.style.setProperty('--n', n);
    grid.innerHTML = '';
    for (let i = 0; i < n * n; i++) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'vm-tile'; b.dataset.i = i; b.disabled = true;
      b.tabIndex = i === 0 ? 0 : -1;
      b.style.setProperty('--d', (i % n) + Math.floor(i / n));
      b.setAttribute('aria-label', `Row ${Math.floor(i / n) + 1}, column ${i % n + 1}`);
      grid.append(b);
    }
    grid.classList.remove('is-in'); void grid.offsetWidth; grid.classList.add('is-in');
    focusIdx = 0;
    return prevN !== n;
  }
  const tiles = () => [...grid.children];
  const mirrorOf = (i) => Math.floor(i / n) * n + (n - 1 - (i % n));

  function bannerShow(text, sub = '') {
    banner.innerHTML = '';
    banner.append(document.createTextNode(text));
    if (sub) { const s = document.createElement('small'); s.textContent = sub; banner.append(s); }
    banner.classList.remove('is-on'); void banner.offsetWidth; banner.classList.add('is-on');
  }
  function say(t) { msg.textContent = t; msg.classList.remove('is-pop'); void msg.offsetWidth; msg.classList.add('is-pop'); }

  function timerRun(ms) {
    timerBar.style.transition = 'none'; timerBar.style.transform = 'scaleX(1)';
    void timerBar.offsetWidth;
    timerBar.style.transition = `transform ${ms}ms linear`; timerBar.style.transform = 'scaleX(0)';
  }

  function startLevel() {
    clearTimers();
    board.classList.remove('is-win', 'is-lose', 'is-fail');
    misses = 0;
    const grew = build();
    paintStats();
    $('axis').hidden = mode !== 'mirror';
    const count = countFor(level, mode);
    const r = mode === 'daily' ? rng(hash(`vm${today()}:${level}:${attempt}`)) : Math.random;
    pattern = shuffleWith([...Array(n * n).keys()], r).slice(0, count);
    targets = new Set(mode === 'mirror' ? pattern.map(mirrorOf) : pattern);
    found = new Set(); seqPos = 0;
    phase = 'show';
    bannerShow(`Level ${level}`, grew && level > 1 ? `grid grows to ${n}x${n}` : `${count} tile${count === 1 ? '' : 's'}`);
    say(mode === 'sequence' ? `Watch the order: ${count} tiles…` : `Memorise ${count} tiles…`);
    const k = speed();
    const lead = 950;
    if (mode === 'sequence') {
      const on = 520 * k, gap = 170 * k;
      pattern.forEach((idx, j) => {
        later(() => { const t = tiles()[idx]; t.classList.add('is-lit'); tone(SCALE[j % SCALE.length], .16, 'triangle', .09); }, lead + j * (on + gap));
        later(() => tiles()[idx].classList.remove('is-lit'), lead + j * (on + gap) + on);
      });
      const total = pattern.length * (on + gap);
      timerRun(lead + total);
      later(beginPlay, lead + total);
    } else {
      const showMs = (900 + count * 70) * k;
      later(() => {
        tiles().forEach((t, i) => { if (pattern.includes(i)) t.classList.add('is-lit'); });
        tone(523, .1, 'triangle', .07); tone(784, .14, 'triangle', .06, .05);
        timerRun(showMs);
      }, lead);
      later(() => { tiles().forEach((t) => t.classList.remove('is-lit')); beginPlay(); }, lead + showMs);
    }
  }

  function beginPlay() {
    tiles().forEach((t) => { t.disabled = false; });
    phase = 'play';
    const left = targets.size;
    say(mode === 'mirror' ? `Now click the mirror image. ${left} to find.` : mode === 'sequence' ? 'Your turn. Same order!' : `Your turn. ${left} to find.`);
    if (document.activeElement === document.body || document.activeElement === $('play') || document.activeElement === $('again')) tiles()[focusIdx]?.focus({ preventScroll: true });
  }

  function burst(t, color, count = 14) {
    const br = board.getBoundingClientRect(), tr = t.getBoundingClientRect();
    particles.spawn(tr.left - br.left + tr.width / 2, tr.top - br.top + tr.height / 2, color, count);
  }

  function pick(i) {
    if (phase !== 'play') return;
    const t = tiles()[i];
    if (!t || t.classList.contains('is-hit') || t.classList.contains('is-miss')) return;
    const lit = getComputedStyle(board).getPropertyValue('--vm-lit').trim() || '#fff';
    if (mode === 'sequence') {
      if (pattern[seqPos] === i) {
        seqPos++; tilesHit++;
        t.classList.add('is-hit');
        const num = document.createElement('span'); num.className = 'vm-num'; num.textContent = seqPos; t.append(num);
        tone(SCALE[(seqPos - 1) % SCALE.length], .14, 'triangle', .1);
        burst(t, lit);
        if (seqPos >= pattern.length) levelUp(); else say(`${pattern.length - seqPos} to go`);
      } else {
        t.classList.add('is-miss');
        misses = 3;
        failFx();
        loseLife();
      }
      return;
    }
    if (targets.has(i)) {
      found.add(i); tilesHit++;
      t.classList.add('is-hit');
      tone(SCALE[Math.min(SCALE.length - 1, found.size - 1)], .11, 'sine', .11);
      burst(t, lit);
      const left = targets.size - found.size;
      say(left ? `${left} to go` : 'Got them all!');
      if (!left) levelUp();
    } else {
      misses++;
      t.classList.add('is-miss');
      failFx();
      paintStats();
      if (misses >= 3) loseLife();
      else say(`Nope. ${3 - misses} mistake${3 - misses === 1 ? '' : 's'} left this level.`);
    }
  }

  function failFx() {
    tone(160, .22, 'sawtooth', .06, 0, -80);
    buzz(60);
    board.classList.remove('is-fail'); void board.offsetWidth; board.classList.add('is-fail');
  }

  function lockTiles() { tiles().forEach((t) => { t.disabled = true; }); }

  function levelUp() {
    phase = 'between';
    lockTiles();
    board.classList.add('is-win');
    const clean = misses === 0;
    run.push(clean ? 'p' : 'm');
    if (clean) { perfectStreak++; bestStreak = Math.max(bestStreak, perfectStreak); } else perfectStreak = 0;
    [0, 4, 7].forEach((s, j) => tone(SCALE[s] , .18, 'triangle', .08, j * .07));
    const br = board.getBoundingClientRect();
    particles.spawn(br.width / 2, br.height / 2, '#ffc233', 40, 6);
    if (clean && perfectStreak >= 3) bannerShow(`${perfectStreak}x flawless`, 'combo');
    level++;
    const prev = Curio.getBest(bestKey());
    if (prev != null && level === prev + 1) { Curio.toast(`Past your best: level ${level}!`); Curio.confetti(70); }
    later(startLevel, 950);
  }

  function loseLife() {
    phase = 'between';
    lockTiles();
    lives--;
    run.push('x');
    perfectStreak = 0;
    paintStats();
    const hearts = $('lives').querySelectorAll('i');
    hearts[lives]?.classList.add('is-pop');
    board.classList.add('is-lose');
    buzz([80, 60, 120]);
    tiles().forEach((t, i) => {
      if (targets.has(i) && !found.has(i) && !t.classList.contains('is-hit')) {
        t.classList.add('is-reveal');
        if (mode === 'sequence') { const num = document.createElement('span'); num.className = 'vm-num'; num.textContent = pattern.indexOf(i) + 1; num.style.transform = 'none'; t.append(num); }
      }
    });
    attempt++;
    if (lives <= 0) { say('Out of lives.'); later(gameOver, 1300); return; }
    say(mode === 'sequence' ? 'Wrong order. That cost a life.' : 'Ouch, that cost a life. Same level, new pattern.');
    later(startLevel, 1700);
  }

  function verdict(lv) {
    if (lv >= 20) return 'Photographic. Genuinely uncanny.';
    if (lv >= 15) return 'Elephant-grade memory.';
    if (lv >= 12) return 'Way above average. Your friends should worry.';
    if (lv >= 9) return 'Well above average. Most people stop around 8 or 9.';
    if (lv >= 6) return 'Solid! Right in the human ballpark.';
    if (lv >= 4) return 'A decent warm up. Your brain is just stretching.';
    return 'Goldfish mode. Shake it off and try again.';
  }

  function award(id) {
    if (data.badges[id]) return;
    data.badges[id] = Date.now();
    const b = BADGES.find((x) => x[0] === id);
    if (b) newBadges.push(b);
  }

  function medalSvg(lv) {
    const tier = lv >= 15 ? ['#9be7ff', '#3aa6d8', 'Diamond'] : lv >= 10 ? ['#ffe08a', '#e0a100', 'Gold'] : lv >= 6 ? ['#eef1f4', '#9aa5b1', 'Silver'] : ['#f3c79a', '#b86b2c', 'Bronze'];
    return `<defs><radialGradient id="mg" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="${tier[0]}"/><stop offset="1" stop-color="${tier[1]}"/></radialGradient></defs>
      <path d="M32 4 h18 l10 34 h-18z" fill="#ff5a36"/><path d="M78 4 h-18 l-10 34 h18z" fill="#3498db"/>
      <circle cx="55" cy="66" r="38" fill="${tier[1]}"/><circle cx="55" cy="64" r="34" fill="url(#mg)"/>
      <circle cx="55" cy="64" r="26" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="2" stroke-dasharray="4 4"/>
      <text x="55" y="76" text-anchor="middle" font-size="32" font-weight="900" fill="#1d1b19" font-family="system-ui, sans-serif">${lv}</text>
      <title>${tier[2]} medal</title>`;
  }

  function sparkline() {
    const sp = $('spark');
    const hist = data.history.filter((h) => h.m === mode).slice(-20);
    if (hist.length < 2) { sp.innerHTML = ''; sp.style.display = 'none'; return; }
    sp.style.display = '';
    const max = Math.max(5, ...hist.map((h) => h.lv));
    const X = (i) => 14 + i * (392 / (hist.length - 1)), Y = (v) => 60 - (v / max) * 48;
    const pts = hist.map((h, i) => `${X(i).toFixed(1)},${Y(h.lv).toFixed(1)}`).join(' ');
    sp.innerHTML = `<polyline points="14,60 ${pts} 406,60" fill="color-mix(in srgb, var(--accent) 15%, transparent)" stroke="none"/>
      <polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      ${hist.map((h, i) => `<circle cx="${X(i).toFixed(1)}" cy="${Y(h.lv).toFixed(1)}" r="${i === hist.length - 1 ? 5 : 3}" fill="${i === hist.length - 1 ? 'var(--accent)' : 'var(--surface)'}" stroke="var(--accent)" stroke-width="2"/>`).join('')}
      <text x="14" y="69" font-size="9" fill="var(--ink-3)" font-weight="700">last ${hist.length} ${MODES[mode].name} games</text>`;
  }

  function gameOver() {
    phase = 'over';
    clearTimers();
    newBadges = [];
    const reached = level;
    const before = Curio.getBest(bestKey());
    const b = Curio.best(bestKey(), reached);
    data.games++; data.levels += reached - 1; data.tiles += tilesHit;
    data.history.push({ m: mode, d: diff, lv: reached, t: Date.now() });
    if (data.history.length > 120) data.history = data.history.slice(-120);
    if (mode === 'daily') {
      const td = today();
      if (data.lastDaily !== td) {
        const y = new Date(); y.setDate(y.getDate() - 1);
        const yd = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
        data.streak = data.lastDaily === yd ? data.streak + 1 : 1;
        data.lastDaily = td;
      }
      data.daily[td] = Math.max(data.daily[td] || 0, reached);
      award('daily');
      if (data.streak >= 3) award('streak3');
    }
    award('first');
    if (reached >= 5) award('l5');
    if (reached >= 10) award('l10');
    if (reached >= 15) award('l15');
    if (reached >= 20) award('l20');
    if (bestStreak >= 5) award('perfect5');
    if (mode === 'sequence' && reached >= 8) award('seq8');
    if (mode === 'mirror' && reached >= 8) award('mir8');
    if (mode !== 'daily' && diff === 'blitz' && reached >= 8) award('blitz8');
    if (data.games >= 25) award('games25');
    save();

    show('result');
    $('result').scrollIntoView({ block: 'start', behavior: 'smooth' });
    $('medal').innerHTML = medalSvg(reached);
    $('rTitle').textContent = `Level ${reached}`;
    const isPB = b.isNew && before != null;
    $('rVerdict').textContent = (isPB ? 'New personal best! ' : '') + verdict(reached);
    $('rStats').innerHTML = '';
    [[MODES[mode].ico + ' ' + MODES[mode].name, 'Mode'], [b.best, 'Best'], [tilesHit, 'Tiles found'], [bestStreak, 'Flawless streak']].forEach(([v, l]) => {
      const d = document.createElement('div'); d.className = 'c-stat';
      const bb = document.createElement('b'); bb.textContent = v; const s = document.createElement('span'); s.textContent = l;
      d.append(bb, s); $('rStats').append(d);
    });
    $('rRun').textContent = runEmoji();
    $('rBadges').innerHTML = '';
    newBadges.forEach((bd, i) => { const s = document.createElement('span'); s.textContent = `${bd[1]} ${bd[2]}`; s.style.animationDelay = `${.3 + i * .15}s`; $('rBadges').append(s); });
    sparkline();
    paintPanels();
    $('again').focus({ preventScroll: true });
    if (isPB || newBadges.length) Curio.confetti();
    [0, 2, 4, 7].forEach((s, j) => tone(SCALE[s], .25, 'triangle', .07, j * .09));
  }

  const runEmoji = () => run.map((r) => r === 'p' ? '🟩' : r === 'm' ? '🟨' : '🟥').join('');

  function shareText() {
    const head = mode === 'daily' ? `Curio Visual Memory, daily ${today()}` : `Curio Visual Memory, ${MODES[mode].name} (${DIFFS[diff].name})`;
    return `${head}\nReached level ${level} 🧠\n${runEmoji()}`;
  }

  function newGame() {
    level = 1; lives = 3; attempt = 0; run = []; perfectStreak = 0; bestStreak = 0; tilesHit = 0;
    show('game');
    applyTheme();
    startLevel();
    requestAnimationFrame(() => board.scrollIntoView({ block: 'center', behavior: 'smooth' }));
  }

  function toMenu() {
    clearTimers();
    phase = 'menu';
    show('menu');
    paintMenu();
  }

  const particles = (() => {
    const g = fx.getContext('2d');
    let list = [], raf = 0;
    function size() {
      const dpr = Math.min(2, devicePixelRatio || 1);
      const w = fx.clientWidth, h = fx.clientHeight;
      if (fx.width !== Math.round(w * dpr)) { fx.width = Math.round(w * dpr); fx.height = Math.round(h * dpr); }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function loop() {
      g.clearRect(0, 0, fx.clientWidth, fx.clientHeight);
      list = list.filter((p) => p.life > 0);
      for (const p of list) {
        p.vy += .18; p.x += p.vx; p.y += p.vy; p.life -= 1; p.vx *= .98;
        g.globalAlpha = Math.max(0, p.life / p.max);
        g.fillStyle = p.c;
        g.beginPath(); g.arc(p.x, p.y, p.r * (p.life / p.max + .3), 0, 7); g.fill();
      }
      g.globalAlpha = 1;
      raf = list.length && !document.hidden ? requestAnimationFrame(loop) : 0;
      if (!raf) g.clearRect(0, 0, fx.clientWidth, fx.clientHeight);
    }
    return {
      spawn(x, y, c, count = 14, spd = 4) {
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        size();
        for (let i = 0; i < count; i++) {
          const a = Math.random() * Math.PI * 2, v = Math.random() * spd + 1;
          const max = 30 + Math.random() * 25;
          list.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, r: 2 + Math.random() * 3, c: Math.random() < .3 ? '#ffc233' : c, life: max, max });
        }
        if (!raf) raf = requestAnimationFrame(loop);
      }
    };
  })();

  function paintPanels() {
    const got = BADGES.filter((b) => data.badges[b[0]]).length;
    $('badgeCount').textContent = `${got}/${BADGES.length}`;
    $('badgeList').innerHTML = '';
    BADGES.forEach(([id, ico, name, desc]) => {
      const d = document.createElement('div'); d.className = 'vm-badge' + (data.badges[id] ? ' is-got' : '');
      const i = document.createElement('i'); i.textContent = ico;
      const t = document.createElement('div'); const b = document.createElement('b'); b.textContent = name; const s = document.createElement('span'); s.textContent = desc;
      t.append(b, s); d.append(i, t); $('badgeList').append(d);
    });
    const bestOf = (m) => Math.max(0, ...data.history.filter((h) => h.m === m).map((h) => h.lv));
    const avg = data.history.length ? (data.history.reduce((a, h) => a + h.lv, 0) / data.history.length).toFixed(1) : '-';
    const rows = [[data.games, 'Games'], [avg, 'Avg level'], [data.tiles, 'Tiles found'], [data.streak, 'Daily streak'],
      [bestOf('classic') || '-', 'Best Classic'], [bestOf('sequence') || '-', 'Best Sequence'], [bestOf('mirror') || '-', 'Best Mirror'], [data.daily[today()] || '-', 'Today\'s daily']];
    $('statTbl').innerHTML = '';
    rows.forEach(([v, l]) => { const d = document.createElement('div'); const b = document.createElement('b'); b.textContent = v; const s = document.createElement('span'); s.textContent = l; d.append(b, s); $('statTbl').append(d); });
  }

  $('modes').addEventListener('click', (e) => {
    const b = e.target.closest('.vm-mode'); if (!b) return;
    mode = b.dataset.m; data.mode = mode; save(); paintMenu(); tone(660, .06, 'triangle', .06);
  });
  $('diffs').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    diff = b.dataset.d; data.diff = diff; save(); paintMenu(); tone(560, .06, 'triangle', .06);
  });
  $('themes').addEventListener('click', (e) => {
    const b = e.target.closest('.vm-sw'); if (!b) return;
    data.theme = b.dataset.t; save(); paintMenu(); tone(740, .06, 'triangle', .06);
  });
  $('play').addEventListener('click', newGame);
  $('again').addEventListener('click', newGame);
  $('toMenu').addEventListener('click', toMenu);
  $('share').addEventListener('click', async () => {
    const t = shareText();
    try { await navigator.clipboard.writeText(t); Curio.toast('Result copied. Paste it anywhere!'); }
    catch { Curio.toast('Copy failed, but here it is: ' + t.split('\n')[1]); }
  });
  document.querySelector('.vm-tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]'); if (!b) return;
    document.querySelectorAll('.vm-tabs [data-tab]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    document.querySelectorAll('[data-pane]').forEach((p) => { p.hidden = p.dataset.pane !== b.dataset.tab; });
  });

  grid.addEventListener('pointerdown', (e) => {
    const t = e.target.closest('.vm-tile');
    if (!t || t.disabled) return;
    e.preventDefault();
    focusIdx = +t.dataset.i;
    pick(focusIdx);
  });
  grid.addEventListener('click', (e) => {
    if (e.detail !== 0) return;
    const t = e.target.closest('.vm-tile');
    if (t && !t.disabled) pick(+t.dataset.i);
  });
  grid.addEventListener('keydown', (e) => {
    const moves = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] };
    const m = moves[e.key];
    if (!m) return;
    e.preventDefault();
    const r = Math.min(n - 1, Math.max(0, Math.floor(focusIdx / n) + m[0]));
    const c = Math.min(n - 1, Math.max(0, focusIdx % n + m[1]));
    const all = tiles();
    all[focusIdx].tabIndex = -1;
    focusIdx = r * n + c;
    all[focusIdx].tabIndex = 0;
    all[focusIdx].focus();
  });
  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'Escape' && phase !== 'menu') { e.preventDefault(); toMenu(); return; }
    if (phase === 'menu' && /^[1-4]$/.test(e.key)) { mode = Object.keys(MODES)[+e.key - 1]; data.mode = mode; save(); paintMenu(); }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && phase === 'show') { clearTimers(); tiles().forEach((t) => t.classList.remove('is-lit')); phase = 'paused'; }
    else if (!document.hidden && phase === 'paused') startLevel();
  });
  window.addEventListener('resize', () => { fx.width = 0; });

  paintMenu();
  paintPanels();
  window.__vm = { get phase() { return phase; }, get pattern() { return pattern; }, get targets() { return [...targets]; }, get level() { return level; } };
})();
