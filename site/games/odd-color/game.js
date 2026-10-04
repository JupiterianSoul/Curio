(() => {
  const C = window.Curio;
  const $ = (id) => document.getElementById(id);
  const MODES = {
    classic: { name: 'Classic', icon: '⏱️', intro: 'Sixty seconds on the clock. Wrong taps cost 3 seconds.' },
    zen: { name: 'Zen', icon: '🌿', intro: 'No clock at all. Three lives. How deep can you go?' },
    twins: { name: 'Twins', icon: '👯', intro: 'Two odd tiles hide on every board. Find both. Sixty seconds.' },
    daily: { name: 'Daily', icon: '📅', intro: 'Same boards for everyone today. Classic rules, one hint.' }
  };
  const SKINS = [
    ['tile', 'Tiles', 0], ['dot', 'Dots', 5], ['petal', 'Petals', 10], ['gem', 'Gems', 15], ['hex', 'Hexes', 22], ['star', 'Stars', 30]
  ];
  const RANKS = [
    [0, '🐶', 'Dog', 'Dogs are dichromats: they see mostly blues and yellows, so reds and greens blur together.'],
    [5, '🐱', 'Cat', 'Cats trade colour for night vision. They see muted hues but cope with far less light than we do.'],
    [10, '🐝', 'Bee', 'Bees cannot see red at all, but they spot ultraviolet patterns on flowers that are invisible to us.'],
    [15, '🧑', 'Human', 'Three types of cone cell let a typical human tell apart something like a million shades.'],
    [20, '🐦', 'Pigeon', 'Pigeons have four types of cone, including one tuned to ultraviolet light.'],
    [25, '🦅', 'Eagle', 'An eagle packs so many cones into its eye that its vision is several times sharper than ours.'],
    [30, '🦋', 'Butterfly', 'The common bluebottle butterfly has 15 kinds of photoreceptor. You have 3.'],
    [36, '🦐', 'Mantis shrimp', 'Mantis shrimp have 12 to 16 photoreceptor types. Twist: tests suggest they are worse than you at telling close colours apart.']
  ];
  const NAMED = 'Crimson DC143C,Red FF0000,Tomato FF6347,Coral FF7F50,Salmon FA8072,Light Coral F08080,Indian Red CD5C5C,Fire Brick B22222,Dark Red 8B0000,Maroon 800000,Orange Red FF4500,Dark Orange FF8C00,Orange FFA500,Gold FFD700,Goldenrod DAA520,Dark Goldenrod B8860B,Khaki F0E68C,Dark Khaki BDB76B,Yellow FFFF00,Yellow Green 9ACD32,Olive Drab 6B8E23,Olive 808000,Chartreuse 7FFF00,Lawn Green 7CFC00,Lime Green 32CD32,Forest Green 228B22,Green 008000,Dark Green 006400,Sea Green 2E8B57,Medium Sea Green 3CB371,Spring Green 00FF7F,Pale Green 98FB98,Light Green 90EE90,Medium Aquamarine 66CDAA,Aquamarine 7FFFD4,Light Sea Green 20B2AA,Teal 008080,Dark Cyan 008B8B,Dark Turquoise 00CED1,Turquoise 40E0D0,Medium Turquoise 48D1CC,Cadet Blue 5F9EA0,Steel Blue 4682B4,Sky Blue 87CEEB,Deep Sky Blue 00BFFF,Dodger Blue 1E90FF,Cornflower Blue 6495ED,Royal Blue 4169E1,Blue 0000FF,Medium Blue 0000CD,Navy 000080,Midnight Blue 191970,Slate Blue 6A5ACD,Dark Slate Blue 483D8B,Medium Slate Blue 7B68EE,Medium Purple 9370DB,Rebecca Purple 663399,Blue Violet 8A2BE2,Dark Violet 9400D3,Dark Orchid 9932CC,Medium Orchid BA55D3,Purple 800080,Indigo 4B0082,Orchid DA70D6,Violet EE82EE,Plum DDA0DD,Magenta FF00FF,Medium Violet Red C71585,Deep Pink FF1493,Hot Pink FF69B4,Pale Violet Red DB7093,Sienna A0522D,Chocolate D2691E,Peru CD853F,Sandy Brown F4A460,Tan D2B48C,Rosy Brown BC8F8F,Saddle Brown 8B4513,Brown A52A2A,Slate Gray 708090,Dark Slate Gray 2F4F4F'
    .split(',').map((s) => { const i = s.lastIndexOf(' '); const h = s.slice(i + 1); return [s.slice(0, i), parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; });
  const BADGES = [
    ['first', '👁️', 'First look', 'Find your first odd tile'],
    ['l10', '🐝', 'Bee eyes', 'Reach level 10'],
    ['l20', '🐦', 'Pigeon eyes', 'Reach level 20'],
    ['l30', '🦋', 'Butterfly eyes', 'Reach level 30'],
    ['l36', '🦐', 'Shrimp mode', 'Reach level 36'],
    ['zen25', '🌿', 'Inner calm', 'Reach level 25 in Zen'],
    ['twins15', '👯', 'Double vision', 'Reach level 15 in Twins'],
    ['daily', '📅', 'Daily look', 'Play a daily board'],
    ['nohint', '🙈', 'No help needed', 'Level 20 without a hint'],
    ['clean', '🎯', 'Clean sweep', 'Level 15 with zero misses'],
    ['quick', '⚡', 'Quick draw', '5 finds in a row, each under a second'],
    ['cb15', '🌗', 'Light reader', 'Level 15 in colour-blind mode'],
    ['skins', '💠', 'Collector', 'Unlock every tile skin'],
    ['veteran', '🏅', 'Veteran', 'Find 500 odd tiles in total']
  ];
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  function fresh() { return { v: 2, played: 0, found: 0, misses: 0, top: 0, badges: {}, curve: [] }; }
  let data = C.store.get('oc-data', null);
  if (!data || typeof data !== 'object' || data.v !== 2) data = fresh();
  data = Object.assign(fresh(), data);
  if (!data.badges || typeof data.badges !== 'object') data.badges = {};
  if (!Array.isArray(data.curve)) data.curve = [];
  const oldBest = Math.max(C.getBest('colour') || 0, C.getBest('lightness') || 0);
  data.top = Math.max(data.top || 0, oldBest);
  const save = () => C.store.set('oc-data', data);

  let cb = C.store.get('oc-cb', false), mode = C.store.get('oc-mode', 'classic'), skin = C.store.get('oc-skin', 'tile');
  if (!MODES[mode]) mode = 'classic';
  if (!SKINS.some((s) => s[0] === skin)) skin = 'tile';
  let running = false, playing = false, score = 0, timeLeft = 60, lastT = 0, raf = 0, odds = [], foundSet = new Set(), base = null, oddCol = null, n = 2, lastDelta = 0, lives = 3, hints = 3, hintsUsed = 0, misses = 0, levelT = 0, quickRun = 0, quickBest = 0, levelLog = [];
  let rng = Math.random, kbMode = false;
  document.addEventListener('keydown', (e) => { if (e.key.startsWith('Arrow')) kbMode = true; });
  document.addEventListener('pointerdown', () => { kbMode = false; });
  $('cb').checked = cb;

  function seeded(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    let a = h >>> 0;
    return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const rnd = (a, b) => a + rng() * (b - a);
  const pk = (arr) => arr[Math.floor(rng() * arr.length)];

  const sizeFor = (lv) => Math.min(9, (mode === 'twins' ? 3 : 2) + Math.floor(lv / 3));
  const deltaFor = (lv) => Math.max(cb ? 2.5 : 2, (mode === 'twins' ? 28 : 24) * Math.pow(0.9, lv));
  const bestKey = () => {
    if (mode === 'classic') return cb ? 'lightness' : 'colour';
    if (mode === 'daily') return `daily-${today()}-${cb ? 'l' : 'c'}`;
    return `${mode}-${cb ? 'l' : 'c'}`;
  };
  const hsl = (c) => `hsl(${c.h.toFixed(1)} ${c.s.toFixed(1)}% ${c.l.toFixed(1)}%)`;
  function hslToRgb(h, s, l) {
    s /= 100; l /= 100;
    const k = (x) => (x + h / 30) % 12, a = s * Math.min(l, 1 - l);
    const f = (x) => l - a * Math.max(-1, Math.min(k(x) - 3, Math.min(9 - k(x), 1)));
    return [f(0) * 255, f(8) * 255, f(4) * 255];
  }
  function nameOf(c) {
    const [r, g, b] = hslToRgb(c.h, c.s, c.l);
    let best = null, bd = Infinity;
    NAMED.forEach((nm) => { const d = (nm[1] - r) ** 2 * 2 + (nm[2] - g) ** 2 * 4 + (nm[3] - b) ** 2 * 3; if (d < bd) { bd = d; best = nm[0]; } });
    return best;
  }
  const rankFor = (lv) => RANKS.reduce((a, r) => (lv >= r[0] ? r : a), RANKS[0]);
  const buzz = (ms) => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} };

  function makeLevel() {
    const lv = score;
    n = sizeFor(lv);
    const d = deltaFor(lv); lastDelta = d;
    const h = rng() * 360, s = rnd(45, 80), l = rnd(38, 62);
    base = { h, s, l };
    const sign = l > 55 ? -1 : l < 45 ? 1 : pk([-1, 1]);
    if (cb) oddCol = { h, s, l: l + sign * d };
    else oddCol = { h: (h + pk([-1, 1]) * d * 1.6 + 360) % 360, s, l: l + sign * d * 0.45 };
    const count = mode === 'twins' ? 2 : 1;
    odds = [];
    while (odds.length < count) { const o = Math.floor(rng() * n * n); if (!odds.includes(o)) odds.push(o); }
    foundSet = new Set();
    document.querySelectorAll('.oc-blobs i').forEach((b, i) => b.style.setProperty('--b', hsl({ h: (h + i * 40) % 360, s: 70, l: 60 })));
    const board = $('board');
    board.innerHTML = '';
    board.className = 'oc-board skin-' + skin;
    board.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
    board.style.setProperty('--gap', n <= 3 ? '10px' : n <= 6 ? '6px' : '4px');
    board.style.setProperty('--r', n <= 3 ? '18px' : n <= 6 ? '11px' : '7px');
    for (let i = 0; i < n * n; i++) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'oc-tile';
      b.style.setProperty('--c', hsl(odds.includes(i) ? oddCol : base));
      b.style.animationDelay = `${Math.min(i * 5, 160)}ms`;
      b.setAttribute('aria-label', `Tile ${Math.floor(i / n) + 1}, ${i % n + 1}`);
      b.addEventListener('click', (e) => tap(i, b, e));
      board.append(b);
    }
    if (running && document.activeElement && document.activeElement.classList.contains('oc-tile') === false && kbMode) board.children[Math.floor(n * n / 2)].focus({ preventScroll: true });
    levelT = performance.now();
  }

  function fxAt(el, text, bad) {
    const wrap = $('wrap').getBoundingClientRect(), r = el.getBoundingClientRect();
    const x = r.left + r.width / 2 - wrap.left, y = r.top + r.height / 2 - wrap.top;
    const ring = document.createElement('i'); ring.className = 'oc-ring'; ring.style.left = x + 'px'; ring.style.top = y + 'px';
    ring.style.setProperty('--c', bad ? 'var(--bad)' : getComputedStyle(el).backgroundColor);
    const t = document.createElement('b'); t.className = 'oc-float' + (bad ? ' bad' : ''); t.textContent = text; t.style.left = x + 'px'; t.style.top = y + 'px';
    $('fx').append(ring, t);
    ring.addEventListener('animationend', () => ring.remove()); t.addEventListener('animationend', () => t.remove());
  }

  function tap(i, el) {
    if (!running || el.classList.contains('dim') || foundSet.has(i)) return;
    if (odds.includes(i)) {
      foundSet.add(i);
      el.classList.add('found');
      buzz(15);
      if (foundSet.size < odds.length) { C.beep(620, .06, 'triangle', .09); fxAt(el, 'One more!'); return; }
      const took = (performance.now() - levelT) / 1000;
      quickRun = took < 1 ? quickRun + 1 : 0; quickBest = Math.max(quickBest, quickRun);
      levelLog.push({ lv: score + 1, t: took, d: lastDelta });
      score++; data.found++;
      bump('sScore', score, 'bump');
      C.beep(500 + Math.min(score, 40) * 20, .07, 'triangle', .1);
      setTimeout(() => C.beep(750 + Math.min(score, 40) * 20, .06, 'sine', .07), 60);
      fxAt(el, took < 1 ? '⚡ Quick!' : '+1');
      const prevRank = rankFor(score - 1), nowRank = rankFor(score);
      if (nowRank !== prevRank) { msg(`${nowRank[1]} You see like a ${nowRank[2].toLowerCase()} now!`); C.confetti(40); }
      else if (score % 5 === 0) msg(`Level ${score + 1}: ${sizeFor(score)}×${sizeFor(score)} grid`);
      else msg('');
      running = false;
      setTimeout(() => { if (playing) { running = true; makeLevel(); } }, 170);
    } else {
      misses++; data.misses++;
      el.classList.remove('miss'); void el.offsetWidth; el.classList.add('miss');
      const b = $('board'); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
      C.beep(160, .18, 'sawtooth', .08); buzz([40, 30, 40]);
      quickRun = 0;
      if (mode === 'zen') {
        lives--; paintLives(); fxAt(el, '💔', true);
        msg(lives > 0 ? `That one matches. ${lives} ${lives === 1 ? 'life' : 'lives'} left.` : 'Out of lives!');
        if (lives <= 0) end();
      } else {
        timeLeft = Math.max(0, timeLeft - 3);
        bump('sTime', Math.ceil(timeLeft), 'hurt');
        fxAt(el, '-3s', true);
        msg('-3 seconds! That one matches.');
      }
    }
  }
  function bump(id, v, cls) { const el = $(id); el.textContent = v; el.classList.remove('bump', 'hurt'); void el.offsetWidth; el.classList.add(cls); }
  function msg(t) { $('msg').textContent = t; }
  function paintLives() { const el = $('sTime'); el.textContent = '❤️'.repeat(Math.max(0, lives)) + '🖤'.repeat(Math.max(0, 3 - lives)); el.classList.add('oc-lives'); }

  function useHint() {
    if (!running || hints <= 0) return;
    hints--; hintsUsed++; $('hintN').textContent = hints; $('hint').disabled = hints <= 0;
    const tiles = [...$('board').children];
    const pool = C.shuffle(tiles.map((t, i) => i).filter((i) => !odds.includes(i) && !tiles[i].classList.contains('dim')));
    pool.slice(0, Math.floor(pool.length / 2)).forEach((i) => tiles[i].classList.add('dim'));
    C.beep(880, .08, 'sine', .08); setTimeout(() => C.beep(1175, .08, 'sine', .07), 80);
    msg('💡 Half the decoys faded away.');
  }

  function start() {
    score = 0; timeLeft = 60; lives = 3; misses = 0; hintsUsed = 0; quickRun = 0; quickBest = 0; levelLog = [];
    hints = mode === 'daily' ? 1 : 3;
    rng = mode === 'daily' ? seeded(`oc-${today()}-${cb}`) : Math.random;
    running = true; playing = true;
    $('hintN').textContent = hints; $('hint').disabled = false;
    $('sScore').textContent = 0; $('cover').hidden = true; msg('');
    $('cb').disabled = true; paintModes();
    if (mode === 'zen') { paintLives(); $('sTimeL').textContent = 'Lives'; } else { $('sTime').classList.remove('oc-lives'); $('sTimeL').textContent = 'Seconds'; }
    makeLevel();
    lastT = performance.now();
    cancelAnimationFrame(raf); raf = requestAnimationFrame(tick);
    C.beep(523, .08, 'triangle'); setTimeout(() => C.beep(784, .1, 'triangle'), 90);
  }
  let lastSec = 60;
  function tick(now) {
    if (!playing) return;
    const dt = Math.min(.1, (now - lastT) / 1000); lastT = now;
    if (mode !== 'zen') {
      if (!document.hidden) timeLeft -= dt;
      const s = Math.max(0, Math.ceil(timeLeft));
      $('sTime').textContent = s;
      const bar = $('bar'); bar.style.transform = `scaleX(${Math.max(0, timeLeft / 60)})`; bar.classList.toggle('low', timeLeft < 10);
      if (s !== lastSec) { lastSec = s; if (s <= 5 && s > 0) C.beep(900, .04, 'square', .05); }
      if (timeLeft <= 0) return end();
    } else { $('bar').style.transform = `scaleX(${lives / 3})`; $('bar').classList.toggle('low', lives === 1); }
    raf = requestAnimationFrame(tick);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) lastT = performance.now(); });

  function unlock(id) {
    if (data.badges[id]) return;
    data.badges[id] = Date.now();
    const b = BADGES.find((x) => x[0] === id);
    if (b) setTimeout(() => { C.toast(`${b[1]} Badge unlocked: ${b[2]}`); [660, 880, 1175].forEach((f, i) => setTimeout(() => C.beep(f, .09, 'triangle', .08), i * 90)); }, 1300);
  }

  let shareStr = '';
  function end() {
    running = false; playing = false; cancelAnimationFrame(raf);
    $('cb').disabled = false; $('hint').disabled = true;
    const tiles = $('board').children;
    odds.forEach((o) => { if (tiles[o]) tiles[o].classList.add('found'); });
    const { best, isNew } = C.best(bestKey(), score);
    const prevTop = data.top;
    data.played++; data.top = Math.max(data.top, score);
    data.curve.push(score); data.curve = data.curve.slice(-30);
    if (score >= 1) unlock('first');
    if (score >= 10) unlock('l10');
    if (score >= 20) unlock('l20');
    if (score >= 30) unlock('l30');
    if (score >= 36) unlock('l36');
    if (mode === 'zen' && score >= 25) unlock('zen25');
    if (mode === 'twins' && score >= 15) unlock('twins15');
    if (mode === 'daily') unlock('daily');
    if (score >= 20 && hintsUsed === 0) unlock('nohint');
    if (score >= 15 && misses === 0) unlock('clean');
    if (quickBest >= 5) unlock('quick');
    if (cb && score >= 15) unlock('cb15');
    if (data.top >= SKINS[SKINS.length - 1][2]) unlock('skins');
    if (data.found >= 500) unlock('veteran');
    save();
    const newSkins = SKINS.filter((s) => s[2] > prevTop && s[2] <= data.top);
    paintBest(); paintPanels();
    const rk = rankFor(score);
    setTimeout(() => {
      $('art').hidden = true;
      const r = $('rank'); r.hidden = false; r.innerHTML = '<div class="em"></div><small>You see like a</small><strong></strong>';
      r.querySelector('.em').textContent = rk[1]; r.querySelector('strong').textContent = rk[2];
      $('cTitle').textContent = isNew && score > 0 ? `🏆 New best: level ${score}!` : `Level ${score}`;
      const diffTxt = cb ? `a lightness gap of ${lastDelta.toFixed(1)} points` : `a hue shift of ${(lastDelta * 1.6).toFixed(0)}°`;
      $('cText').textContent = `${rk[3]} Final grid ${n}×${n}, ${diffTxt}. Best: ${best}.`;
      const sw = $('cSw'); sw.hidden = false; sw.innerHTML = '';
      [[base, 'normal'], [oddCol, 'odd one']].forEach(([c, label]) => { const sp = document.createElement('span'); sp.style.setProperty('--c', hsl(c)); sp.textContent = `${nameOf(c)} · ${label}`; sw.append(sp); });
      $('go').textContent = 'Play again'; $('share').hidden = false;
      $('cover').hidden = false;
      $('go').focus({ preventScroll: true });
      msg(newSkins.length ? `✨ New skin unlocked: ${newSkins.map((s) => s[1]).join(', ')}!` : '');
    }, 900);
    shareStr = `👁️ Curio Odd Colour Out, ${MODES[mode].name}${mode === 'daily' ? ' ' + today() : ''}${cb ? ' (lightness)' : ''}\nLevel ${score} · I see like a ${rk[2].toLowerCase()} ${rk[1]}\n` + levelLog.slice(0, 40).map((l) => (l.t < 1 ? '🟩' : l.t < 2.5 ? '🟨' : '🟧')).join('');
    [660, 520, 400].forEach((f, i) => setTimeout(() => C.beep(f, .1, 'triangle'), i * 100));
    if (isNew && score > 0) setTimeout(() => C.confetti(), 900);
  }
  const paintBest = () => { const b = C.getBest(bestKey()); $('sBest').textContent = b == null ? '-' : b; };

  function paintModes() {
    const box = $('modes'); box.innerHTML = '';
    Object.entries(MODES).forEach(([id, m], i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'oc-mode'; b.setAttribute('aria-pressed', id === mode); b.disabled = playing && id !== mode;
      b.innerHTML = '<span></span>'; b.firstChild.textContent = m.icon; b.append(m.name); b.title = `${m.intro} (key ${i + 1})`;
      b.addEventListener('click', () => setMode(id));
      box.append(b);
    });
  }
  function setMode(id) {
    if (playing || !MODES[id]) return;
    mode = id; C.store.set('oc-mode', id); C.beep(520, .04, 'triangle', .06);
    paintModes(); paintBest(); idleCover(); preview();
  }
  function idleCover() {
    $('art').hidden = false; $('rank').hidden = true; $('cSw').hidden = true; $('share').hidden = true;
    $('cTitle').textContent = mode === 'twins' ? 'Seeing double?' : mode === 'zen' ? 'Take a deep breath' : mode === 'daily' ? `Daily board, ${today()}` : 'How good are your eyes?';
    $('cText').textContent = MODES[mode].intro; $('go').textContent = 'Start';
    $('sTime').classList.remove('oc-lives');
    $('sTimeL').textContent = mode === 'zen' ? 'Lives' : 'Seconds';
    $('sTime').textContent = mode === 'zen' ? '❤️❤️❤️' : 60;
    if (mode === 'zen') $('sTime').classList.add('oc-lives');
    $('bar').style.transform = 'scaleX(1)'; $('bar').classList.remove('low');
  }
  function paintPanels() {
    const sk = $('skins'); sk.innerHTML = '';
    SKINS.forEach(([id, name, need]) => {
      const locked = data.top < need;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'oc-skin' + (locked ? ' locked' : ''); b.setAttribute('aria-pressed', id === skin); b.disabled = locked;
      b.innerHTML = `<span class="pv skin-${id}"><i></i><i></i><i></i><i></i></span><span></span>`;
      b.querySelector('.pv').querySelectorAll('i').forEach((i) => { i.className = 'oc-tile'; i.style.animation = 'none'; i.style.width = '14px'; i.style.height = '14px'; i.style.setProperty('--c', '#29b6f6'); i.style.setProperty('--r', '4px'); });
      b.querySelector('.pv').querySelectorAll('i')[3].style.setProperty('--c', '#5cc8f8');
      b.lastChild.textContent = locked ? `🔒 Level ${need}` : name;
      b.addEventListener('click', () => { if (locked) return; skin = id; C.store.set('oc-skin', id); C.beep(700, .05, 'triangle', .07); paintPanels(); $('board').className = 'oc-board skin-' + skin; });
      sk.append(b);
    });
    const st = $('stats'); st.innerHTML = '';
    const rk = rankFor(data.top);
    [[data.played, 'games'], [data.found, 'odd tiles found'], [data.top, 'highest level'], [data.found + data.misses ? Math.round(100 * data.found / (data.found + data.misses)) + '%' : '-', 'accuracy'], [rk[1] + ' ' + rk[2], 'best eyes']]
      .forEach(([v, l]) => { const d = document.createElement('div'); d.innerHTML = '<b></b><span></span>'; d.firstChild.textContent = v; d.lastChild.textContent = l; st.append(d); });
    const cv = $('curve'); cv.innerHTML = '';
    if (data.curve.length >= 2) {
      const W = 300, H = 70, mx = Math.max(10, ...data.curve);
      const pts = data.curve.map((v, i) => [8 + i * ((W - 16) / (data.curve.length - 1)), H - 12 - (v / mx) * (H - 22)]);
      cv.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Levels reached in recent games"><line class="gr" x1="8" x2="${W - 8}" y1="${H - 12}" y2="${H - 12}"/><path class="ln" d="M${pts.map((p) => p.map((x) => x.toFixed(1)).join(',')).join('L')}"/>${pts.map((p) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2.6" fill="var(--oc)"/>`).join('')}<text class="ax" x="8" y="${H - 1}">last ${data.curve.length} games</text><text class="ax" x="${W - 8}" y="10" text-anchor="end">peak ${mx}</text></svg>`;
    }
    const bd = $('badges'); bd.innerHTML = '';
    BADGES.forEach(([id, ic, name, desc]) => {
      const d = document.createElement('div'); d.className = 'oc-badge' + (data.badges[id] ? ' on' : '');
      d.innerHTML = '<i></i><div><b></b><span></span></div>';
      d.querySelector('i').textContent = ic; d.querySelector('b').textContent = name; d.querySelector('span').textContent = desc;
      bd.append(d);
    });
    $('badgeCount').textContent = `${Object.keys(data.badges).length}/${BADGES.length}`;
  }
  async function share() {
    try { await navigator.clipboard.writeText(shareStr); C.toast('Result copied to clipboard'); }
    catch (e) { const p = document.createElement('pre'); p.style.whiteSpace = 'pre-wrap'; p.style.textAlign = 'left'; p.textContent = shareStr; C.modal({ emoji: '📋', title: 'Copy your result', body: p, buttons: [{ label: 'Done', value: 1 }] }); }
  }

  $('go').addEventListener('click', start);
  $('share').addEventListener('click', share);
  $('hint').addEventListener('click', useHint);
  $('cb').addEventListener('change', () => { cb = $('cb').checked; C.store.set('oc-cb', cb); paintBest(); if (!playing) preview(); });
  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || document.querySelector('.curio-modal')) return;
    const arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (arrows[e.key] && running) {
      e.preventDefault();
      const tiles = [...$('board').children];
      let i = tiles.indexOf(document.activeElement);
      if (i < 0) i = Math.floor(n * n / 2) - (n % 2 ? 0 : Math.floor(n / 2));
      else {
        const [dx, dy] = arrows[e.key];
        const x = Math.max(0, Math.min(n - 1, i % n + dx)), y = Math.max(0, Math.min(n - 1, Math.floor(i / n) + dy));
        i = y * n + x;
      }
      tiles[Math.max(0, Math.min(tiles.length - 1, i))].focus();
      return;
    }
    if (e.key === 'h' || e.key === 'H') useHint();
    else if (/^[1-4]$/.test(e.key) && !playing) setMode(Object.keys(MODES)[+e.key - 1]);
    else if (e.key === 'Enter' && !playing && !$('cover').hidden && document.activeElement?.tagName !== 'BUTTON') { e.preventDefault(); start(); }
  });
  function preview() { const s0 = score; rng = Math.random; score = 3; makeLevel(); score = s0; }
  paintModes(); paintBest(); idleCover(); paintPanels(); preview();
})();
