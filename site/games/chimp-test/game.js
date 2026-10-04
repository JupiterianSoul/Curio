(() => {
  const C = window.Curio, $ = (id) => document.getElementById(id);
  const board = $('board'), grid = $('grid'), screen = $('screen'), bubble = $('bubble');

  const MODES = {
    classic: { name: 'Classic', icon: '🔢', desc: 'Tap 1 and everything else goes blank.' },
    flash: { name: 'Flash', icon: '⚡', desc: 'Numbers vanish on their own, faster every level.' },
    reverse: { name: 'Reverse', icon: '🔁', desc: 'Start at the biggest number, count down.' },
    blackout: { name: 'Blackout', icon: '🌑', desc: 'Empty cells are tiles too. Pure recall.' },
    letters: { name: 'Letters', icon: '🔤', desc: 'A, B, C instead of numbers.' },
    daily: { name: 'Daily', icon: '📅', desc: 'Same boards for everyone today.' }
  };
  const SIZES = { small: { d: [6, 4], p: [4, 6] }, normal: { d: [8, 5], p: [5, 8] }, big: { d: [10, 6], p: [6, 10] } };
  const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const PENTA = [0, 2, 4, 7, 9];

  const settings = FX.load('settings', 1, { mode: 'classic', size: 'normal', lives: 3, startN: 4 });
  if (!MODES[settings.mode]) settings.mode = 'classic';
  if (!SIZES[settings.size]) settings.size = 'normal';
  if (![1, 3, 5].includes(settings.lives)) settings.lives = 3;
  if (![4, 7].includes(settings.startN)) settings.startN = 4;
  const saveSettings = () => FX.save('settings', 1, settings);
  const stats = FX.load('stats', 1, { games: 0, best: {}, total: {}, plays: {}, scores: [], recent: [], daily: {}, levels: 0, fastest: 0 });
  const saveStats = () => FX.save('stats', 1, stats);

  const BADGES = FX.badges([
    { id: 'first', emoji: '🐒', tier: 'bronze', name: 'Lab intern', desc: 'Finish your first test' },
    { id: 'avg', emoji: '🧑', tier: 'bronze', name: 'Average human', desc: 'Reach 7 in any mode' },
    { id: 'ayumu', emoji: '🧠', tier: 'silver', name: 'Ayumu level', desc: 'Reach 9 in any mode' },
    { id: 'twelve', emoji: '🎓', tier: 'silver', name: 'Primate prodigy', desc: 'Reach 12 in any mode' },
    { id: 'fifteen', emoji: '🏆', tier: 'gold', name: 'Out-chimped', desc: 'Reach 15 in any mode' },
    { id: 'twenty', emoji: '💾', tier: 'diamond', name: 'Living hard drive', desc: 'Reach 20 in any mode' },
    { id: 'flawless', emoji: '✨', tier: 'gold', name: 'Flawless', desc: 'Clear 10 numbers without a strike' },
    { id: 'flash', emoji: '⚡', tier: 'silver', name: 'Lightning eyes', desc: 'Reach 7 in Flash' },
    { id: 'reverse', emoji: '🔁', tier: 'silver', name: 'Backwards brain', desc: 'Reach 8 in Reverse' },
    { id: 'blackout', emoji: '🌑', tier: 'gold', name: 'Night vision', desc: 'Reach 8 in Blackout' },
    { id: 'letters', emoji: '🔤', tier: 'silver', name: 'Alphabet ape', desc: 'Reach J (10) in Letters' },
    { id: 'daily', emoji: '📅', tier: 'bronze', name: 'Daily banana', desc: 'Finish a daily board' },
    { id: 'speed', emoji: '🏎️', tier: 'gold', name: 'Speed demon', desc: 'Clear a level of 8+ in under 3 seconds' },
    { id: 'big', emoji: '🗺️', tier: 'silver', name: 'Big board', desc: 'Reach 10 on the big grid' },
    { id: 'onelife', emoji: '🎯', tier: 'gold', name: 'No safety net', desc: 'Reach 9 with only one life' },
    { id: 'ten', emoji: '🍌', tier: 'bronze', name: 'Regular', desc: 'Finish 10 tests' },
    { id: 'fifty', emoji: '🌴', tier: 'gold', name: 'Banana hoarder', desc: 'Finish 50 tests', secret: true }
  ]);

  const SAY = {
    hello: ['Ook! Ready when you are.', 'I have been practising. Have you?', 'Pick a mode. I will judge silently. Mostly.'],
    start: ['Eyes on the grid!', 'Here we go. No pressure.', 'Look first, tap later.', 'Remember: 1 first.'],
    good: ['Nice!', 'Ook ook!', 'Clean.', 'Not bad for a human.', 'Smooth.', 'You remembered!', 'Banana-worthy.'],
    fast: ['Whoa, speedy!', 'That was faster than me. Almost.', 'Blink and you missed it.'],
    avg: ['That is the average human limit. Keep going!'],
    ayumu: ['Nine! That is my number. We are equals now.'],
    beyond: ['You are beyond me. I need a nap.', 'Teach me your ways.', 'This is getting silly. In a good way.'],
    strike: ['Oops.', 'Hmm, not that one.', 'Shake it off.', 'Happens to the best of us. Mostly to you.', 'Close... ish.'],
    over: ['Good effort! Banana break?', 'The board wins this time.', 'Want a rematch?'],
    best: ['NEW RECORD! I am telling everyone.', 'A personal best! Party time!'],
    think: ['Hmm, let me think...', 'Concentrate...', 'Where was 2 again?']
  };

  const apeSvg = `<svg class="ape" data-mood="idle" viewBox="0 0 200 230" role="img" aria-label="Ayumu the chimpanzee">
    <defs>
      <radialGradient id="apeHead" cx=".45" cy=".35" r=".75"><stop offset="0" stop-color="#7d5139"/><stop offset="1" stop-color="#4a2c1d"/></radialGradient>
      <radialGradient id="apeFace" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#f6d7b4"/><stop offset="1" stop-color="#d9a882"/></radialGradient>
      <linearGradient id="apeBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5e3a27"/><stop offset="1" stop-color="#3a2216"/></linearGradient>
      <linearGradient id="apeBan" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff07a"/><stop offset="1" stop-color="#f2b705"/></linearGradient>
    </defs>
    <ellipse cx="100" cy="226" rx="74" ry="8" fill="rgba(60,30,0,.22)"/>
    <path d="M30 230 C30 175 60 150 100 150 C140 150 170 175 170 230 Z" fill="url(#apeBody)"/>
    <path d="M70 230 C72 195 85 182 100 182 C115 182 128 195 130 230 Z" fill="#c9926b" opacity=".55"/>
    <g class="ape-arm">
      <path d="M150 196 C168 186 176 166 170 150" stroke="#4a2c1d" stroke-width="18" stroke-linecap="round" fill="none"/>
      <path d="M152 138 C170 120 190 128 186 150 C176 140 166 140 158 152 Z" fill="url(#apeBan)" stroke="#a87c00" stroke-width="1.5"/>
      <circle cx="168" cy="148" r="11" fill="#d9a882"/>
    </g>
    <g class="ape-head">
      <circle cx="36" cy="92" r="23" fill="#4a2c1d"/><circle cx="36" cy="92" r="13" fill="#e0b48f"/>
      <circle cx="164" cy="92" r="23" fill="#4a2c1d"/><circle cx="164" cy="92" r="13" fill="#e0b48f"/>
      <ellipse cx="100" cy="88" rx="64" ry="66" fill="url(#apeHead)"/>
      <path d="M62 34 Q70 24 80 32 Q88 20 100 30 Q112 20 120 32 Q130 24 138 34" fill="none" stroke="#3a2216" stroke-width="5" stroke-linecap="round"/>
      <path d="M100 66 C80 50 50 58 52 90 C54 108 64 112 70 118 C62 130 64 152 100 156 C136 152 138 130 130 118 C136 112 146 108 148 90 C150 58 120 50 100 66 Z" fill="url(#apeFace)"/>
      <path d="M58 76 Q78 62 98 74 M102 74 Q122 62 142 76" fill="none" stroke="#7a4d33" stroke-width="5" stroke-linecap="round"/>
      <g class="ape-eyes">
        <ellipse cx="80" cy="90" rx="11" ry="12" fill="#fff"/><ellipse cx="120" cy="90" rx="11" ry="12" fill="#fff"/>
        <g class="ape-pupils"><circle cx="81" cy="91" r="7" fill="#2a1a10"/><circle cx="121" cy="91" r="7" fill="#2a1a10"/><circle cx="83" cy="88" r="2.4" fill="#fff"/><circle cx="123" cy="88" r="2.4" fill="#fff"/></g>
      </g>
      <ellipse cx="94" cy="116" rx="3.5" ry="2.5" fill="#6b3f28"/><ellipse cx="106" cy="116" rx="3.5" ry="2.5" fill="#6b3f28"/>
      <path class="ape-m m-idle" d="M80 134 Q100 144 120 134" fill="none" stroke="#6b3f28" stroke-width="4" stroke-linecap="round"/>
      <g class="ape-m m-happy"><path d="M74 128 Q100 160 126 128 Z" fill="#7a2e22"/><path d="M78 129 Q100 136 122 129 L120 134 Q100 140 80 134 Z" fill="#fff"/><ellipse cx="100" cy="146" rx="9" ry="4" fill="#e66a6a"/></g>
      <g class="ape-m m-shock"><ellipse cx="100" cy="138" rx="11" ry="13" fill="#7a2e22"/><ellipse cx="100" cy="143" rx="7" ry="4" fill="#e66a6a"/></g>
      <path class="ape-m m-sad" d="M80 142 Q100 126 120 142" fill="none" stroke="#6b3f28" stroke-width="4" stroke-linecap="round"/>
      <path class="ape-m m-think" d="M84 138 Q96 134 118 132" fill="none" stroke="#6b3f28" stroke-width="4" stroke-linecap="round"/>
      <g class="ape-blush"><ellipse cx="66" cy="114" rx="9" ry="5" fill="#ff8b8b" opacity=".55"/><ellipse cx="134" cy="114" rx="9" ry="5" fill="#ff8b8b" opacity=".55"/></g>
      <path class="ape-sweat" d="M150 60 C146 68 144 72 148 76 C152 78 156 74 154 68 Z" fill="#7fd0ff"/>
      <g class="ape-stars" fill="#ffd93b"><path d="M20 30 l4 9 9 1 -7 6 2 9 -8 -5 -8 5 2 -9 -7 -6 9 -1z"/><path d="M172 22 l3 7 7 1 -5 4 1 7 -6 -4 -6 4 1 -7 -5 -4 7 -1z"/></g>
    </g>
  </svg>`;
  $('ape').innerHTML = apeSvg;
  const ape = $('ape').querySelector('svg');
  let moodTimer = 0;
  function mood(m, ms = 0) {
    ape.dataset.mood = m;
    clearTimeout(moodTimer);
    if (ms) moodTimer = setTimeout(() => { ape.dataset.mood = 'idle'; }, ms);
  }
  function say(key, extra) {
    const list = SAY[key] || [key];
    bubble.textContent = extra || C.pick(list);
    bubble.classList.remove('is-new'); void bubble.offsetWidth; bubble.classList.add('is-new');
  }
  function ook(high = false) {
    FX.sfx.tone(high ? 420 : 260, 0.18, { type: 'sawtooth', vol: 0.05, glide: high ? 640 : 380, filter: 1200 });
    FX.sfx.tone(high ? 560 : 340, 0.16, { type: 'sawtooth', vol: 0.04, glide: high ? 820 : 300, filter: 1200, delay: 0.16 });
  }
  addEventListener('pointermove', (e) => {
    const r = ape.getBoundingClientRect();
    if (!r.width) return;
    const dx = FX.clamp((e.clientX - (r.left + r.width / 2)) / 300, -1, 1) * 3;
    const dy = FX.clamp((e.clientY - (r.top + r.height * 0.4)) / 300, -1, 1) * 3;
    ape.querySelector('.ape-pupils').style.transform = `translate(${dx}px, ${dy}px)`;
  }, { passive: true });

  const leaf = (cls) => `<svg class="${cls}" viewBox="0 0 200 200"><g fill="#7ed957"><path d="M10 190 C40 120 90 60 190 10 C150 80 100 150 10 190Z" opacity=".7"/><path d="M10 190 C30 140 60 100 120 70" stroke="#2f7d32" stroke-width="3" fill="none"/></g><g fill="#4caf50"><path d="M0 120 C30 90 70 80 120 90 C80 110 40 120 0 120Z" opacity=".8"/><path d="M40 200 C50 150 80 120 130 110 C110 150 80 180 40 200Z" opacity=".6"/></g></svg>`;
  board.querySelector('.ct-jungle').innerHTML = leaf('l1') + leaf('l2') + leaf('l3');

  const banana = (lost) => `<svg viewBox="0 0 32 32" class="${lost ? 'is-lost' : ''}" aria-hidden="true"><path d="M5 9 C6 22 16 29 28 24 C27 22 26 21 25 21 C16 24 9 18 8 8 Z" fill="#ffd93b" stroke="#b88a00" stroke-width="1.5" stroke-linejoin="round"/><path d="M7 9 L5 5 L8 4 L9 8 Z" fill="#6b4a00"/><path d="M10 12 C12 18 17 21 23 21" stroke="#fff6b0" stroke-width="1.5" fill="none" opacity=".8"/></svg>`;

  let mode = settings.mode, cfg = {}, cols = 8, rows = 5, n = 4, strikes = 0, score = 0, next = 0, busy = true, cells = [];
  let phase = 'menu', seq = [], levelT0 = 0, firstAt = 0, flashTimer = 0, flashRaf = 0, clockRaf = 0, rand = Math.random;
  let runStrikes = 0, levelTimes = [], runStart = 0, flawlessTo = 0;

  const labelFor = (i) => (cfg.mode === 'letters' ? LETTERS[i] : String(i + 1));
  const isNarrow = () => board.clientWidth < 560;
  function layout() {
    const s = SIZES[cfg.size || settings.size];
    [cols, rows] = isNarrow() ? s.p : s.d;
    grid.style.setProperty('--cols', cols);
  }
  function paintHud() {
    $('level').textContent = cfg.mode === 'letters' ? `${n}` : n;
    $('lives').innerHTML = Array.from({ length: cfg.lives || settings.lives }, (_, i) => banana(i < strikes)).join('');
    $('lives').setAttribute('aria-label', `${(cfg.lives || settings.lives) - strikes} lives left`);
    $('modeLabel').textContent = MODES[cfg.mode || mode].name;
  }
  function blankGrid() {
    layout();
    grid.innerHTML = Array.from({ length: cols * rows }, () => '<div class="ct-cell ct-empty"></div>').join('');
  }
  function showScreen(html) {
    screen.innerHTML = `<div class="ct-inner">${html}</div>`;
    screen.classList.add('is-on');
    const b = screen.querySelector('[data-primary]') || screen.querySelector('button');
    b?.focus({ preventScroll: true });
    return screen;
  }
  const hideScreen = () => screen.classList.remove('is-on');
  function stopTimers() { clearTimeout(flashTimer); cancelAnimationFrame(flashRaf); cancelAnimationFrame(clockRaf); $('flashbar').classList.remove('is-on'); }

  function menu() {
    phase = 'menu'; busy = true; stopTimers();
    cfg = { mode, size: settings.size, lives: settings.lives, startN: settings.startN };
    if (mode === 'daily') Object.assign(cfg, { size: 'normal', lives: 3, startN: 4 });
    strikes = 0; n = cfg.startN; paintHud(); blankGrid(); $('clock').textContent = '0.0s';
    mood('idle'); say('hello');
    const today = stats.daily[FX.dayKey()];
    showScreen(`<div class="ct-label">Choose your test</div>
      <h2>Are you smarter than a chimp?</h2>
      <div class="ct-modes">${Object.entries(MODES).map(([k, m]) => `<button type="button" class="ct-mode" data-mode="${k}" aria-pressed="${k === mode}"><i>${m.icon}</i><b>${m.name}</b><small>${m.desc}</small></button>`).join('')}</div>
      <div class="ct-opts" id="opts"></div>
      ${mode === 'daily' && today != null ? `<p class="ct-dailydone">Today's best: ${today}. Replays still count toward your best.</p>` : ''}
      <div class="c-row"><button class="c-btn" type="button" data-primary id="go">Start ${MODES[mode].name}</button></div>`);
    screen.querySelectorAll('.ct-mode').forEach((b) => b.addEventListener('click', () => {
      mode = b.dataset.mode; settings.mode = mode; saveSettings(); FX.sfx.click(); menu();
      screen.querySelector(`[data-mode="${mode}"]`)?.focus({ preventScroll: true });
    }));
    const opts = $('opts');
    if (mode === 'daily') {
      opts.innerHTML = `<p style="margin:0;font-size:14px">Normal grid, 3 lives, starts at 4. Board #${FX.dayNumber()}.</p>`;
    } else {
      opts.innerHTML = '<div class="ct-opt"><span>Grid</span><div id="oSize"></div></div><div class="ct-opt"><span>Lives</span><div id="oLives"></div></div><div class="ct-opt"><span>Start at</span><div id="oStart"></div></div>';
      FX.seg($('oSize'), [{ v: 'small', label: 'Small' }, { v: 'normal', label: 'Normal' }, { v: 'big', label: 'Big' }], settings.size, (v) => { settings.size = v; cfg.size = v; saveSettings(); blankGrid(); }, 'Grid size');
      FX.seg($('oLives'), [{ v: '1', label: '1' }, { v: '3', label: '3' }, { v: '5', label: '5' }], settings.lives, (v) => { settings.lives = +v; cfg.lives = +v; saveSettings(); paintHud(); }, 'Lives');
      FX.seg($('oStart'), [{ v: '4', label: '4' }, { v: '7', label: '7' }], settings.startN, (v) => { settings.startN = +v; cfg.startN = +v; n = +v; saveSettings(); paintHud(); }, 'Starting numbers');
    }
    $('go').addEventListener('click', startRun);
  }

  function startRun() {
    cfg = { mode, size: settings.size, lives: settings.lives, startN: settings.startN };
    if (mode === 'daily') Object.assign(cfg, { size: 'normal', lives: 3, startN: 4 });
    rand = mode === 'daily' ? FX.rng(FX.daySeed('board')) : Math.random;
    n = cfg.startN; strikes = 0; score = 0; runStrikes = 0; levelTimes = []; runStart = performance.now(); flawlessTo = 0;
    FX.sfx.whoosh(); ook(true); mood('happy', 1200); say('start');
    round();
  }

  function shuffled(count) {
    const a = [...Array(count).keys()];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  function round() {
    hideScreen(); stopTimers(); layout(); paintHud();
    const total = cols * rows;
    const maxN = cfg.mode === 'letters' ? 26 : total;
    if (n > maxN) return gameOver(true);
    phase = 'play'; busy = false; next = 0;
    seq = Array.from({ length: n }, (_, i) => (cfg.mode === 'reverse' ? n - 1 - i : i));
    const spots = shuffled(total).slice(0, n);
    const at = new Map(spots.map((s, i) => [s, i]));
    grid.innerHTML = ''; cells = [];
    board.classList.toggle('is-dark', cfg.mode === 'blackout');
    for (let i = 0; i < total; i++) {
      const v = at.get(i);
      if (v != null || cfg.mode === 'blackout') {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'ct-cell ct-tile';
        if (v != null) { b.textContent = labelFor(v); b.dataset.v = v; b.setAttribute('aria-label', 'Tile ' + labelFor(v)); b.style.animationDelay = (v * 22) + 'ms'; cells.push(b); }
        else { b.classList.add('is-decoy'); b.setAttribute('aria-label', 'Empty tile'); b.style.animationDelay = (Math.random() * 120) + 'ms'; }
        b.addEventListener('pointerdown', (e) => { if (e.button > 0) return; e.preventDefault(); press(b); });
        b.addEventListener('click', (e) => { if (e.detail === 0) press(b); });
        grid.append(b);
      } else {
        const d = document.createElement('div'); d.className = 'ct-cell ct-empty'; grid.append(d);
      }
    }
    levelT0 = performance.now(); firstAt = 0;
    tickClock();
    if (cfg.mode === 'flash') {
      const ms = Math.max(350, 1700 - (n - 4) * 130);
      const bar = $('flashbar'), fill = bar.querySelector('i');
      bar.classList.add('is-on');
      const t0 = performance.now();
      const step = (now) => {
        fill.style.transform = `scaleX(${Math.max(0, 1 - (now - t0) / ms)})`;
        if (now - t0 < ms && phase === 'play') flashRaf = requestAnimationFrame(step);
      };
      flashRaf = requestAnimationFrame(step);
      flashTimer = setTimeout(() => { if (next === 0 && phase === 'play') { hideAll(); FX.sfx.whoosh(); } bar.classList.remove('is-on'); }, ms);
    }
  }

  function tickClock() {
    cancelAnimationFrame(clockRaf);
    const step = () => {
      if (phase !== 'play') return;
      $('clock').textContent = ((performance.now() - levelT0) / 1000).toFixed(1) + 's';
      clockRaf = requestAnimationFrame(step);
    };
    clockRaf = requestAnimationFrame(step);
  }

  function hideAll() {
    cells.forEach((c) => { if (!c.classList.contains('is-done')) { c.classList.add('is-hidden'); c.setAttribute('aria-label', 'Hidden tile'); } });
    if (cfg.mode === 'blackout') grid.querySelectorAll('.is-decoy').forEach((d) => d.setAttribute('aria-label', 'Hidden tile'));
    if (cfg.mode !== 'flash') mood('think', 900);
  }

  function note(i) {
    const step = PENTA[i % 5] + 12 * Math.floor(i / 5);
    const f = 392 * 2 ** (step / 12);
    FX.sfx.tone(f, 0.22, { type: 'triangle', vol: 0.12 });
    FX.sfx.tone(f * 4, 0.06, { type: 'sine', vol: 0.03 });
  }

  function press(b) {
    if (busy || phase !== 'play') return;
    if (b.classList.contains('is-decoy')) return lose(b);
    const v = Number(b.dataset.v);
    if (v !== seq[next]) return lose(b);
    if (next === 0) { firstAt = performance.now(); clearTimeout(flashTimer); $('flashbar').classList.remove('is-on'); hideAll(); }
    b.classList.add('is-done');
    b.setAttribute('aria-label', 'Done');
    note(next);
    FX.burstAt(b, { count: 10, speed: 4, colors: ['#ffe066', '#fffaf0', '#7ed957'], size: 3.5, life: 30 });
    FX.buzz(8);
    next++;
    if (next === n) levelWin();
  }

  function levelWin() {
    busy = true; phase = 'between'; stopTimers();
    const secs = (performance.now() - (firstAt || levelT0)) / 1000;
    levelTimes.push(secs); stats.levels++;
    score = n;
    if (!runStrikes) flawlessTo = n;
    if (n >= 8 && secs < 3) BADGES.unlock('speed');
    if (flawlessTo >= 10) BADGES.unlock('flawless');
    milestoneBadges(score);
    const prev = bestFor(cfg.mode);
    FX.floatAt($('level'), '+1', '#ffe066');
    FX.sfx.good();
    let key = secs < 2.2 && n >= 6 ? 'fast' : 'good';
    if (score === 7) key = 'avg';
    else if (score === 9) key = 'ayumu';
    else if (score > 10 && score % 3 === 0) key = 'beyond';
    mood(score >= 9 ? 'party' : 'happy', 1500); say(key);
    if (score >= 9) ook(true);
    n++;
    paintHud(); FX.bump($('level'));
    const label = cfg.mode === 'letters' ? `${LETTERS[0]} to ${LETTERS[Math.min(25, n - 1)]}` : `${n} numbers`;
    setTimeout(() => {
      showScreen(`<div class="ct-label">Level cleared in ${secs.toFixed(1)}s</div>
        <div class="ct-big">${n}</div>
        <p>Next up: ${label}.${prev != null && score > prev ? ' You are past your old best!' : ''} ${strikes ? `Lives left: ${cfg.lives - strikes}.` : ''}</p>
        <div class="c-row"><button class="c-btn" type="button" data-primary id="cont">Continue</button><button class="c-btn c-btn--ghost" type="button" id="quit">End test</button></div>`);
      $('cont').addEventListener('click', round);
      $('quit').addEventListener('click', () => gameOver(false));
    }, 260);
  }

  function lose(b) {
    busy = true; phase = 'between'; stopTimers();
    strikes++; runStrikes++;
    b.classList.remove('is-hidden'); b.classList.add('is-wrong');
    const expected = cells.find((c) => Number(c.dataset.v) === seq[next]);
    cells.forEach((c) => { if (!c.classList.contains('is-done') && c !== b) { c.classList.remove('is-hidden'); c.classList.add('is-reveal'); } });
    expected?.classList.add('is-next');
    FX.sfx.bad(); FX.buzz([40, 30, 60]);
    board.classList.remove('is-shake'); void board.offsetWidth; board.classList.add('is-shake');
    mood(strikes >= cfg.lives ? 'sad' : 'shock', 1600); say('strike'); ook(false);
    paintHud();
    setTimeout(() => {
      if (strikes >= cfg.lives) return gameOver(false);
      const want = labelFor(seq[next]);
      showScreen(`<div class="ct-label">Strike ${strikes} of ${cfg.lives}</div>
        <h2>${b.dataset.v != null ? `That was ${labelFor(+b.dataset.v)}` : 'That one was empty'}</h2>
        <p>You needed ${want}. Same ${n} again on a fresh board.</p>
        <div class="c-row"><button class="c-btn" type="button" data-primary id="cont">Try again</button></div>`);
      $('cont').addEventListener('click', round);
    }, 1300);
  }

  function bestFor(m) { return m === 'classic' ? C.getBest('score') : (stats.best[m] ?? null); }
  function milestoneBadges(s) {
    if (s >= 7) BADGES.unlock('avg');
    if (s >= 9) BADGES.unlock('ayumu');
    if (s >= 12) BADGES.unlock('twelve');
    if (s >= 15) BADGES.unlock('fifteen');
    if (s >= 20) BADGES.unlock('twenty');
    if (cfg.mode === 'flash' && s >= 7) BADGES.unlock('flash');
    if (cfg.mode === 'reverse' && s >= 8) BADGES.unlock('reverse');
    if (cfg.mode === 'blackout' && s >= 8) BADGES.unlock('blackout');
    if (cfg.mode === 'letters' && s >= 10) BADGES.unlock('letters');
    if (cfg.size === 'big' && cfg.mode !== 'daily' && s >= 10) BADGES.unlock('big');
    if (cfg.lives === 1 && cfg.mode !== 'daily' && s >= 9) BADGES.unlock('onelife');
  }

  function verdict(s) {
    if (s >= 20) return 'You are not a chimp. You are a filing cabinet with legs.';
    if (s >= 15) return 'You out-chimped the chimp. Ayumu would like a word with your agent.';
    if (s >= 12) return 'Way past Ayumu. Primatologists are taking notes.';
    if (s >= 9) return 'Ayumu territory! In Kyoto he recalled 9 numerals flashed for a fraction of a second.';
    if (s >= 7) return 'Right around where most people top out. Ayumu still has the edge.';
    if (s >= 5) return 'A warm-up. Ayumu would breeze past this while eating a banana.';
    return 'The chimps are politely pretending not to laugh.';
  }

  function scaleSvg(s) {
    const max = Math.max(20, s + 2), W = 400, x = (v) => 20 + (v / max) * (W - 40);
    const marks = [[7, 'Avg human'], [9, 'Ayumu']];
    return `<svg class="ct-scale" viewBox="0 0 ${W} 70" role="img" aria-label="Your score ${s} compared with the average human (about 7) and Ayumu (9)">
      <defs><linearGradient id="scl" x1="0" x2="1"><stop offset="0" stop-color="#ffb4a2"/><stop offset=".5" stop-color="#ffe066"/><stop offset="1" stop-color="#7ed957"/></linearGradient></defs>
      <rect x="20" y="30" width="${W - 40}" height="12" rx="6" fill="rgba(255,255,255,.2)"/>
      <rect x="20" y="30" width="${(x(Math.min(s, max)) - 20).toFixed(1)}" height="12" rx="6" fill="url(#scl)"><animate attributeName="width" from="0" to="${(x(Math.min(s, max)) - 20).toFixed(1)}" dur=".9s" fill="freeze" calcMode="spline" keySplines=".2 .8 .3 1" keyTimes="0;1"/></rect>
      ${marks.map(([v, l], i) => `<line x1="${x(v)}" x2="${x(v)}" y1="24" y2="48" stroke="#fff" stroke-width="2" stroke-dasharray="3 2"/><text x="${x(v)}" y="${i ? 62 : 18}" text-anchor="middle">${l} ${v}</text>`).join('')}
      <circle cx="${x(Math.min(s, max))}" cy="36" r="9" fill="#fff" stroke="#ffc233" stroke-width="4"/>
    </svg>`;
  }

  function gameOver(cleared) {
    phase = 'over'; busy = true; stopTimers();
    const m = cfg.mode;
    const prev = bestFor(m);
    let isNew;
    if (m === 'classic') isNew = C.best('score', score, true).isNew && prev != null && score > prev;
    else { isNew = prev != null && score > prev; if (prev == null || score > prev) stats.best[m] = score; }
    stats.games++;
    stats.plays[m] = (stats.plays[m] || 0) + 1;
    stats.total[m] = (stats.total[m] || 0) + score;
    stats.scores.push(score); if (stats.scores.length > 300) stats.scores.shift();
    stats.recent.unshift({ m, s: score, d: Date.now(), z: cfg.size, l: cfg.lives }); stats.recent.length = Math.min(stats.recent.length, 12);
    if (m === 'daily') { const k = FX.dayKey(); stats.daily[k] = Math.max(stats.daily[k] || 0, score); BADGES.unlock('daily'); }
    saveStats();
    BADGES.unlock('first');
    if (stats.games >= 10) BADGES.unlock('ten');
    if (stats.games >= 50) BADGES.unlock('fifty');
    const best = bestFor(m);
    const avgT = levelTimes.length ? levelTimes.reduce((a, b) => a + b, 0) / levelTimes.length : 0;
    if (isNew) { C.confetti(); FX.sfx.fanfare(); mood('party', 4000); say('best'); }
    else if (cleared) { C.confetti(); FX.sfx.fanfare(); mood('party', 4000); say('beyond'); }
    else { FX.sfx.lose(); mood(score >= 9 ? 'happy' : 'sad', 3000); say('over'); }
    paintTabs();
    showScreen(`${isNew ? '<div class="ct-tag">New personal best!</div>' : ''}${cleared ? '<div class="ct-tag">Board complete!</div>' : ''}
      <div class="ct-label">${MODES[m].name} score</div>
      <div class="ct-big" id="finalScore">0</div>
      ${scaleSvg(score)}
      <p>${verdict(score)}</p>
      <div class="ct-res-row"><div><b>${best ?? score}</b><span>Best</span></div><div><b>${levelTimes.length}</b><span>Levels</span></div><div><b>${avgT ? avgT.toFixed(1) + 's' : '-'}</b><span>Avg time</span></div><div><b>${runStrikes}</b><span>Strikes</span></div></div>
      <div class="c-row"><button class="c-btn" type="button" data-primary id="again">Play again</button><button class="c-btn c-btn--ghost" type="button" id="share">Share</button><button class="c-btn c-btn--ghost" type="button" id="menu">Modes</button></div>`);
    FX.countUp($('finalScore'), score, 700);
    $('again').addEventListener('click', startRun);
    $('menu').addEventListener('click', menu);
    $('share').addEventListener('click', () => {
      const bar = '🟩'.repeat(Math.min(score, 20)) + (score > 20 ? '+' : '');
      const head = m === 'daily' ? `Chimp Test daily #${FX.dayNumber()}` : `Chimp Test (${MODES[m].name})`;
      FX.copy(`${head} 🐒\nI reached ${score}${score >= 9 ? ', Ayumu level!' : '.'}\n${bar}\n${'🍌'.repeat(Math.max(0, cfg.lives - strikes))}${'⬛'.repeat(Math.min(strikes, cfg.lives))}`);
    });
  }

  let tabsApi;
  function paintTabs() { tabsApi?.refresh(); }
  tabsApi = FX.tabs($('tabs'), [
    { id: 'how', label: 'How to play', render(p) {
      p.innerHTML = `<ul class="fx-howto">
        <li><i>👀</i><div><b>Look</b><p>Numbers pop up on random squares. Take in where they are, as a whole picture if you can.</p></div></li>
        <li><i>👆</i><div><b>Tap 1</b><p>The moment you tap the first number, every other tile flips blank. In Flash mode they flip on their own.</p></div></li>
        <li><i>🧠</i><div><b>Recall</b><p>Tap the rest in order. Each cleared level adds one more number. Run out of bananas and the test ends.</p></div></li>
        <li><i>🐒</i><div><b>Why a chimp?</b><p>In studies at Kyoto University's Primate Research Institute, a young chimpanzee named Ayumu recalled the positions of numerals 1 to 9 after seeing them for only a split second, beating university students at the short-exposure version.</p></div></li>
      </ul><div class="fx-keys"><span><span class="c-kbd">Enter</span> / <span class="c-kbd">Space</span> start or continue</span><span><span class="c-kbd">Esc</span> back to modes</span></div>`;
    } },
    { id: 'stats', label: 'Stats', render(p) {
      const sc = stats.scores, avg = sc.length ? (sc.reduce((a, b) => a + b, 0) / sc.length).toFixed(1) : '-';
      const top = Math.max(0, ...Object.keys(MODES).map((m) => bestFor(m) ?? 0));
      const buckets = []; for (let v = 4; v <= 20; v += 2) buckets.push({ label: v === 20 ? '20+' : `${v}`, n: sc.filter((s) => (v === 20 ? s >= 20 : s >= v && s <= v + 1)).length, hi: false });
      const lastS = sc[sc.length - 1]; buckets.forEach((b, i) => { const v = 4 + i * 2; b.hi = lastS != null && (v === 20 ? lastS >= 20 : lastS >= v && lastS <= v + 1); });
      p.innerHTML = `${FX.statGrid([[stats.games, 'Tests'], [top || '-', 'Top score'], [avg, 'Average'], [stats.levels, 'Levels cleared']])}
        <h4>Best by mode</h4>${FX.statGrid(Object.entries(MODES).map(([k, m]) => [bestFor(k) ?? '-', m.name]))}
        <h4>Score spread</h4>${sc.length ? FX.histogram(buckets, { label: 'How often you reached each score' }) : '<p class="c-muted">Play a test to see your spread.</p>'}
        <h4>Recent tests</h4><div class="fx-hist-list">${stats.recent.length ? stats.recent.map((r) => `<div><span>${MODES[r.m]?.icon || ''} ${MODES[r.m]?.name || r.m} · ${r.z || ''} · ${new Date(r.d).toLocaleDateString()}</span><b>${r.s}</b></div>`).join('') : '<p class="c-muted">Nothing yet.</p>'}</div>`;
    } },
    { id: 'badges', label: `Badges`, render(p) { BADGES.render(p); } }
  ]);

  FX.onKey((e) => {
    if (e.repeat) return;
    if (e.key === 'Escape' && phase !== 'menu') { e.preventDefault(); menu(); return; }
    if ((e.key === 'Enter' || e.code === 'Space') && screen.classList.contains('is-on')) {
      const btn = screen.querySelector('[data-primary]');
      if (btn && document.activeElement !== btn && !document.activeElement?.closest('.ct-screen button')) { e.preventDefault(); btn.click(); }
    }
  });
  let lastNarrow = null;
  addEventListener('resize', () => {
    const nw = isNarrow();
    if (nw === lastNarrow) return;
    lastNarrow = nw;
    if (phase === 'menu' || phase === 'over') blankGrid();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && phase === 'play' && cfg.mode === 'flash' && next === 0) { clearTimeout(flashTimer); hideAll(); }
  });

  menu();
  lastNarrow = isNarrow();
  window.__chimp = {
    get order() { return seq.map((v) => cells.findIndex((c) => Number(c.dataset.v) === v)); },
    get cells() { return cells; },
    get state() { return { n, strikes, score, phase, mode: cfg.mode }; }
  };
})();
