(() => {
  const $ = (id) => document.getElementById(id);
  const SIZES = [[4, 3], [4, 4], [5, 4], [6, 5], [6, 6]];
  const THEMES = window.MM_THEMES;
  const BOTS = { easy: { label: 'Forgetful', mem: 0.35 }, medium: { label: 'Sharp', mem: 0.7 }, hard: { label: 'Genius', mem: 0.97 } };
  const QUIPS = ['Nice!', 'Got it!', 'Sharp!', 'Boom!', 'Yes!', 'Memory of an elephant.', 'Click, click, match.', 'Smooth.'];
  const ACH = [
    ['first', '🃏', 'First pairs', 'Finish a solo game'],
    ['perfect', '🔮', 'Psychic', 'Finish with zero misses'],
    ['three', '⭐', 'Total recall', 'Earn three stars on 5×4 or bigger'],
    ['big', '🧩', 'Big board', 'Clear the 6×6 board'],
    ['clock', '⏳', 'Beat the clock', 'Win a Countdown game'],
    ['bot1', '🤖', 'Robot tamer', 'Beat the robot'],
    ['bot3', '🧠', 'Outsmarted', 'Beat the Genius robot'],
    ['combo4', '🔥', 'On a roll', 'Make 4 matches in a row'],
    ['pairs', '🎓', 'Scholar', 'Finish a pair theme like Capitals or Elements'],
    ['daily', '📅', 'Daily player', 'Finish the daily deck'],
    ['themes', '🎨', 'Collector', 'Finish games in 6 different themes']
  ];

  const SAVE_V = 2;
  const load = () => {
    const base = { v: SAVE_V, size: Curio.store.get('mm:size', 0), theme: Curio.store.get('mm:theme', 'animals'), mode: Curio.store.get('mm:mode', 'solo'), bot: 'medium', peek: false, ach: {}, games: 0, wins: 0, botW: 0, botL: 0, themesDone: {} };
    const raw = Curio.store.get('mm:v2', null);
    if (!raw || raw.v !== SAVE_V) return base;
    return { ...base, ...raw, ach: raw.ach || {}, themesDone: raw.themesDone || {} };
  };
  const save = load();
  if (!SIZES[save.size]) save.size = 0;
  if (!THEMES[save.theme]) save.theme = 'animals';
  if (!['solo', 'duo', 'bot', 'clock'].includes(save.mode)) save.mode = 'solo';
  if (!BOTS[save.bot]) save.bot = 'medium';
  const persist = () => Curio.store.set('mm:v2', save);

  let deck, open, moves, found, total, t0, elapsed, timer, lock, turn, scores, over, score, streak, bestStreak, misses, timeLeft, daily, memory, botBusy;

  const sizesEl = $('sizes'), themesEl = $('themes'), board = $('board');
  SIZES.forEach(([c, r], i) => { const b = document.createElement('button'); b.type = 'button'; b.dataset.size = i; b.textContent = `${c}×${r}`; sizesEl.append(b); });
  Object.entries(THEMES).forEach(([k, t]) => { const b = document.createElement('button'); b.type = 'button'; b.dataset.theme = k; b.textContent = t.label; themesEl.append(b); });
  Object.entries(BOTS).forEach(([k, b]) => { const el = document.createElement('button'); el.type = 'button'; el.dataset.bot = k; el.textContent = b.label; $('bots').append(el); });

  const fmtT = (s) => `${Math.floor(s / 60)}:${String(Math.floor(Math.max(0, s) % 60)).padStart(2, '0')}`;
  const starsFor = (m, pairs) => (m <= Math.ceil(pairs * 1.6) ? 3 : m <= Math.ceil(pairs * 2.3) ? 2 : 1);
  const buzz = (ms) => { try { navigator.vibrate?.(ms); } catch {} };
  const versus = () => save.mode === 'duo' || save.mode === 'bot';

  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const shuffleWith = (arr, r) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  const todaySeed = () => { let h = 2166136261; for (const ch of todayKey()) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

  function paintOpts() {
    sizesEl.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.size === save.size)));
    themesEl.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.theme === save.theme)));
    $('modes').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === save.mode)));
    $('bots').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.bot === save.bot)));
    $('bots').hidden = save.mode !== 'bot';
    $('wrap').classList.toggle('duo', versus());
    $('n1').textContent = save.mode === 'bot' ? 'You' : 'Player 1';
    $('n2').textContent = save.mode === 'bot' ? `🤖 ${BOTS[save.bot].label}` : 'Player 2';
    $('peek').checked = save.peek;
  }

  function faceHtml(face) {
    const [emoji, text, cls] = face;
    return `${emoji ? `<span>${emoji}</span>` : ''}${text ? `<small class="${cls || ''}"></small>` : ''}`;
  }

  function newGame(isDaily = false) {
    clearInterval(timer); clearTimeout(lock); botBusy = false;
    daily = isDaily;
    const sizeIdx = daily ? 2 : save.size;
    const themeKey = daily ? Object.keys(THEMES)[todaySeed() % Object.keys(THEMES).length] : save.theme;
    const T = THEMES[themeKey];
    const [cols, rows] = SIZES[sizeIdx];
    total = cols * rows / 2;
    const r = daily ? rng(todaySeed()) : Math.random;
    const pool = shuffleWith(T.items, r).slice(0, total);
    const cards = [];
    pool.forEach((it, id) => {
      if (T.pairs) { cards.push({ id, face: it[0] }, { id, face: it[1] }); }
      else { const f = Array.isArray(it) ? [it[0], it[1]] : [it, '']; cards.push({ id, face: f }, { id, face: f }); }
    });
    deck = shuffleWith(cards, r);
    deck.theme = themeKey;
    open = []; moves = 0; found = 0; elapsed = 0; t0 = 0; lock = false; turn = 0; scores = [0, 0]; over = false; score = 0; streak = 0; bestStreak = 0; misses = 0;
    memory = new Map();
    timeLeft = total * 5 + 10;
    board.style.setProperty('--cols', cols);
    board.style.setProperty('--rows', rows);
    const root = document.documentElement.style;
    root.setProperty('--back-a', T.back[0]); root.setProperty('--back-b', T.back[1]);
    root.setProperty('--fa', T.c[0]); root.setProperty('--fb', T.c[1]);
    board.innerHTML = '';
    deck.forEach((c, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'card deal'; b.dataset.i = i;
      b.style.setProperty('--d', `${i * 18}ms`);
      b.setAttribute('aria-label', `Card ${i + 1}, face down`);
      b.innerHTML = `<div class="in"><div class="b"><span>${T.icon}</span></div><div class="f">${faceHtml(c.face)}</div></div>`;
      const sm = b.querySelector('.f small'); if (sm) sm.textContent = c.face[1];
      b.tabIndex = i === 0 ? 0 : -1;
      c.el = b;
      board.append(b);
    });
    setTimeout(() => board.querySelectorAll('.deal').forEach((b) => b.classList.remove('deal')), 450 + deck.length * 18);
    paintOpts(); hud(); bests();
    if (daily) Curio.toast(`Daily deck: ${T.label}. Same cards for everyone today!`);
    if (save.peek) {
      lock = true;
      setTimeout(() => { board.classList.add('peek-on'); Curio.beep(700, 0.05, 'sine', 0.06); }, 500 + deck.length * 18);
      setTimeout(() => { board.classList.remove('peek-on'); lock = false; }, 500 + deck.length * 18 + Math.min(4000, 900 + total * 120));
    }
  }

  function hud() {
    $('moves').textContent = moves;
    $('time').textContent = save.mode === 'clock' && !daily ? fmtT(timeLeft) : fmtT(elapsed);
    $('time-l').textContent = save.mode === 'clock' && !daily ? 'Left' : 'Time';
    $('time-stat').classList.toggle('low', save.mode === 'clock' && !daily && timeLeft <= 10 && !over);
    $('pairs').textContent = `${found}/${total}`;
    $('score').textContent = Curio.fmt(score);
    const s = starsFor(moves, total);
    $('stars').querySelectorAll('i').forEach((el, i) => el.classList.toggle('off', i >= s));
    $('stars').setAttribute('aria-label', `${s} of 3 stars`);
    $('s1').textContent = scores[0]; $('s2').textContent = scores[1];
    $('pl1').classList.toggle('on', turn === 0); $('pl2').classList.toggle('on', turn === 1);
  }

  function bests() {
    const [c, r] = SIZES[save.size];
    const bm = Curio.getBest(`moves-${c}x${r}`), bt = Curio.getBest(`time-${c}x${r}`), bs = Curio.getBest(`score-${c}x${r}`);
    $('bests').textContent = bm == null ? `No best yet on ${c}×${r}. Perfect play is ${c * r / 2} moves.` : `Your best on ${c}×${r}: ${bm} moves, fastest ${fmtT(bt)}${bs ? `, top score ${Curio.fmt(bs)}` : ''}.`;
    const wr = save.botW + save.botL ? Math.round(save.botW / (save.botW + save.botL) * 100) : 0;
    $('statgrid').innerHTML = [[save.games, 'Games'], [save.wins, 'Solo wins'], [Object.keys(save.themesDone).length, 'Themes done'], [save.botW, 'Robot wins'], [save.botL, 'Robot losses'], [`${wr}%`, 'vs robot']].map(([v, l]) => `<div class="c-stat"><b>${v}</b><span>${l}</span></div>`).join('');
    $('achs').innerHTML = ACH.map(([id, e, n, d]) => `<div class="ach${save.ach[id] ? ' on' : ''}" title="${d}"><span>${e}</span><div><b>${n}</b>${d}</div></div>`).join('');
    $('ach-count').textContent = `${Object.keys(save.ach).length}/${ACH.length}`;
  }
  function unlock(id) {
    if (save.ach[id]) return;
    save.ach[id] = Date.now(); persist();
    const a = ACH.find((x) => x[0] === id);
    if (a) setTimeout(() => Curio.toast(`${a[1]} Badge unlocked: ${a[2]}`, 2400), 900);
  }

  function startClock() {
    if (t0) return;
    t0 = performance.now() - elapsed * 1000;
    let last = performance.now();
    timer = setInterval(() => {
      const now = performance.now(), dt = (now - last) / 1000; last = now;
      if (document.hidden || over) return;
      elapsed = (now - t0) / 1000;
      if (save.mode === 'clock' && !daily) {
        const before = Math.ceil(timeLeft);
        timeLeft -= dt;
        if (Math.ceil(timeLeft) !== before && timeLeft <= 5 && timeLeft > 0) Curio.beep(990, 0.04, 'square', 0.05);
        if (timeLeft <= 0) { timeLeft = 0; hud(); timeUp(); return; }
      }
      $('time').textContent = save.mode === 'clock' && !daily ? fmtT(timeLeft) : fmtT(elapsed);
      $('time-stat').classList.toggle('low', save.mode === 'clock' && !daily && timeLeft <= 10);
    }, 200);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && t0 && !over) t0 = performance.now() - elapsed * 1000; });

  function sparks(el, colors) {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const r = el.getBoundingClientRect();
    for (let k = 0; k < 10; k++) {
      const s = document.createElement('i'); s.className = 'spark';
      const a = Math.random() * Math.PI * 2, d = 30 + Math.random() * 40;
      s.style.left = `${r.left + r.width / 2}px`; s.style.top = `${r.top + r.height / 2}px`;
      s.style.background = colors[k % colors.length];
      s.style.setProperty('--dx', `${Math.cos(a) * d}px`); s.style.setProperty('--dy', `${Math.sin(a) * d}px`);
      document.body.append(s); setTimeout(() => s.remove(), 650);
    }
  }
  function comboText(el, text) {
    const r = el.getBoundingClientRect();
    const d = document.createElement('div'); d.className = 'combo'; d.textContent = text;
    d.style.left = `${r.left + r.width / 2}px`; d.style.top = `${r.top}px`;
    document.body.append(d); setTimeout(() => d.remove(), 900);
  }

  function flipBack() {
    for (const c of open) { c.el.classList.remove('up', 'nope'); c.el.setAttribute('aria-label', `Card ${+c.el.dataset.i + 1}, face down`); }
    open = []; lock = false;
  }
  function endMiss() {
    flipBack();
    if (versus()) { turn = 1 - turn; hud(); if (save.mode === 'bot' && turn === 1) botTurn(); }
  }
  const remember = (i) => { if (Math.random() < BOTS[save.bot].mem || save.mode !== 'bot') memory.set(i, deck[i].id); };

  function flip(i, byBot) {
    const c = deck[i];
    if (over || !c || c.done || c.el.classList.contains('up')) return;
    if (save.mode === 'bot' && turn === 1 && !byBot) return;
    if (lock === true) return;
    if (lock) { clearTimeout(lock); endMiss(); if (save.mode === 'bot' && turn === 1 && !byBot) return; }
    startClock();
    c.el.classList.add('up');
    c.el.setAttribute('aria-label', `${c.face[1] || c.face[0]}, face up`);
    open.push(c);
    remember(i);
    Curio.beep(520 + open.length * 90, 0.05, 'triangle', 0.07);
    if (open.length < 2) return;
    moves++;
    const [a, b] = open;
    if (a.id === b.id) {
      found++; streak++; bestStreak = Math.max(bestStreak, streak);
      const gained = 100 * streak + (save.mode === 'clock' ? 20 : 0);
      if (!versus()) score += gained;
      if (versus()) scores[turn]++;
      if (save.mode === 'clock' && !daily) timeLeft += 2;
      for (const x of open) {
        x.done = true;
        memory.delete(deck.indexOf(x));
        x.el.classList.add('done', 'pop');
        if (versus()) x.el.classList.add(turn ? 'p2' : 'p1');
        x.el.setAttribute('aria-label', `${x.face[1] || x.face[0]}, matched`);
      }
      open = [];
      sparks(b.el, ['#ffc233', '#2fb36d', '#ff5a36', '#fff']);
      if (streak >= 2 && !versus()) comboText(b.el, `Combo ×${streak}!`);
      if (streak >= 4 && !versus()) unlock('combo4');
      buzz(15);
      setTimeout(() => { Curio.beep(660 + streak * 40, 0.07, 'sine', 0.1); Curio.beep(990 + streak * 60, 0.1, 'sine', 0.08); }, 120);
      if (found < total && Math.random() < 0.25 && !versus()) Curio.toast(Curio.pick(QUIPS), 1000);
      if (found < total && save.mode === 'duo') Curio.toast(`Player ${turn + 1} goes again!`, 900);
      hud();
      if (found === total) win();
      else if (save.mode === 'bot' && turn === 1) setTimeout(botTurn, 700);
    } else {
      streak = 0; misses++;
      a.el.classList.add('nope'); b.el.classList.add('nope');
      Curio.beep(180, 0.12, 'sawtooth', 0.04);
      lock = setTimeout(endMiss, save.mode === 'bot' && turn === 1 ? 1100 : 850);
      hud();
    }
  }

  function botPick() {
    const known = [...memory.entries()].filter(([i]) => !deck[i].done && !deck[i].el.classList.contains('up'));
    const hidden = deck.map((c, i) => i).filter((i) => !deck[i].done && !deck[i].el.classList.contains('up'));
    if (open.length === 1) {
      const first = deck.indexOf(open[0]);
      const m = known.find(([i, id]) => id === open[0].id && i !== first);
      if (m) return m[0];
      const unknown = hidden.filter((i) => !memory.has(i));
      return Curio.pick(unknown.length ? unknown : hidden);
    }
    const byId = new Map();
    for (const [i, id] of known) { if (byId.has(id)) return byId.get(id); byId.set(id, i); }
    const unknown = hidden.filter((i) => !memory.has(i));
    return Curio.pick(unknown.length ? unknown : hidden);
  }
  async function botTurn() {
    if (over || botBusy || turn !== 1) return;
    botBusy = true;
    await new Promise((r) => setTimeout(r, 650));
    for (let k = 0; k < 2 && !over && turn === 1; k++) {
      const i = botPick();
      if (i == null) break;
      deck[i].el.classList.add('bot');
      setTimeout(() => deck[i].el.classList.remove('bot'), 500);
      flip(i, true);
      await new Promise((r) => setTimeout(r, 600));
      if (!open.length) break;
    }
    botBusy = false;
  }

  async function timeUp() {
    if (over) return;
    over = true; clearInterval(timer); clearTimeout(lock);
    Curio.beep(220, 0.2, 'sawtooth', 0.06); setTimeout(() => Curio.beep(165, 0.3, 'sawtooth', 0.06), 180);
    deck.forEach((c) => { if (!c.done) c.el.classList.add('up'); });
    const v = await Curio.modal({ emoji: '⌛', title: 'Time is up!', body: `You found ${found} of ${total} pairs. Matches add two seconds, so chain them fast.`, buttons: [{ label: 'Try again', value: 'again' }, { label: 'Close', value: 'x' }] });
    if (v === 'again') newGame();
  }

  async function win() {
    over = true; clearInterval(timer);
    elapsed = (performance.now() - t0) / 1000;
    hud();
    Curio.confetti();
    buzz([20, 40, 20]);
    [523, 659, 784, 1047].forEach((f, k) => setTimeout(() => Curio.beep(f, 0.14, 'triangle', 0.1), k * 110));
    const sizeIdx = daily ? 2 : save.size;
    const [c, r] = SIZES[sizeIdx];
    save.games++;
    save.themesDone[deck.theme] = 1;
    if (Object.keys(save.themesDone).length >= 6) unlock('themes');
    if (THEMES[deck.theme].pairs) unlock('pairs');
    if (daily) unlock('daily');
    if (sizeIdx === 4) unlock('big');
    let v;
    if (versus()) {
      const [p, q] = scores;
      const bot = save.mode === 'bot';
      if (bot) { if (p > q) { save.botW++; unlock('bot1'); if (save.bot === 'hard') unlock('bot3'); } else if (q > p) save.botL++; }
      persist(); bests();
      const title = p === q ? 'A tie!' : bot ? (p > q ? 'You beat the robot!' : 'The robot wins!') : `Player ${p > q ? 1 : 2} wins!`;
      v = await Curio.modal({ emoji: p === q ? '🤝' : bot && q > p ? '🤖' : '🏆', title, body: `${p} pairs to ${q}, in ${moves} flips of two. ${p === q ? 'Rematch to settle it?' : 'Rematch?'}`, buttons: [{ label: 'Rematch', value: 'again' }, { label: 'Close', value: 'x' }] });
    } else {
      const s = starsFor(moves, total);
      if (save.mode === 'clock' && !daily) { score += Math.round(timeLeft) * 50; unlock('clock'); }
      save.wins++;
      unlock('first');
      if (moves === total) unlock('perfect');
      if (s === 3 && sizeIdx >= 2) unlock('three');
      persist();
      const bm = Curio.best(`moves-${c}x${r}`, moves, false), bt = Curio.best(`time-${c}x${r}`, Math.round(elapsed), false), bs = Curio.best(`score-${c}x${r}`, score);
      hud();
      const perfect = moves === total;
      const body = document.createElement('div');
      body.innerHTML = `<div style="display:flex;gap:6px;justify-content:center;margin:6px 0 10px">${[[moves, 'Moves'], [fmtT(elapsed), 'Time'], [Curio.fmt(score), 'Score'], [`×${bestStreak}`, 'Combo']].map(([a, b]) => `<div class="c-stat" style="min-width:58px"><b>${a}</b><span>${b}</span></div>`).join('')}</div>`;
      const p = document.createElement('div');
      p.textContent = `${'★'.repeat(s)}${'☆'.repeat(3 - s)} ${perfect ? 'A perfect game, are you psychic?' : bm.isNew ? 'New fewest-moves record!' : bt.isNew ? 'New fastest time!' : bs.isNew ? 'New high score!' : `Best: ${bm.best} moves.`}`;
      body.append(p);
      v = await Curio.modal({ emoji: s === 3 ? '🧠' : s === 2 ? '😎' : '🙂', title: daily ? 'Daily deck done!' : s === 3 ? 'Total recall!' : s === 2 ? 'Well matched!' : 'All pairs found!', body, buttons: [{ label: 'Play again', value: 'again' }, { label: 'Share', value: 'share' }, { label: 'Close', value: 'x' }] });
      if (v === 'share') { try { await navigator.clipboard.writeText(`🃏 Curio Memory Match${daily ? ` daily (${todayKey()})` : ''}: ${total} pairs in ${moves} moves, ${fmtT(elapsed)}, ${'★'.repeat(s)}`); Curio.toast('Copied!'); } catch { Curio.toast('Could not reach the clipboard.'); } }
      bests();
    }
    if (v === 'again') newGame(daily);
  }

  board.addEventListener('click', (e) => { const b = e.target.closest('.card'); if (b) flip(+b.dataset.i); });
  board.addEventListener('keydown', (e) => {
    const b = e.target.closest('.card'); if (!b) return;
    const i = +b.dataset.i, cols = +board.style.getPropertyValue('--cols');
    const d = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols }[e.key];
    if (d == null) return;
    e.preventDefault();
    const j = i + d;
    if (j < 0 || j >= deck.length) return;
    b.tabIndex = -1; deck[j].el.tabIndex = 0; deck[j].el.focus();
  });
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector('.curio-modal') || e.target.closest?.('input')) return;
    if (e.key.toLowerCase() === 'n') newGame();
  });
  sizesEl.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; save.size = +b.dataset.size; persist(); newGame(); });
  themesEl.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; save.theme = b.dataset.theme; persist(); newGame(); });
  $('modes').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; save.mode = b.dataset.mode; persist(); newGame(); });
  $('bots').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; save.bot = b.dataset.bot; persist(); newGame(); });
  $('peek').addEventListener('change', (e) => { save.peek = e.target.checked; persist(); });
  $('new').addEventListener('click', () => newGame());
  $('daily').addEventListener('click', () => newGame(true));

  newGame();
  window.__mm = { get deck() { return deck; }, flip, newGame, get state() { return { moves, found, total, scores, turn, over, score, timeLeft }; }, setMode(m, bot) { save.mode = m; if (bot) save.bot = bot; persist(); newGame(); }, setTheme(t, s) { save.theme = t; if (s != null) save.size = s; persist(); newGame(); } };
  if (!Curio.touchpad && !Curio.store.get('padtip:memory-match', false)) { Curio.store.set('padtip:memory-match', true); setTimeout(() => Curio.toast('Tip: on a laptop touchpad? Turn on Touchpad mode in the top bar.', 3400), 2200); }
})();
