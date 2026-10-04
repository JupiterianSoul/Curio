(() => {
  const C = window.Curio;
  const $ = (id) => document.getElementById(id);
  const DATA = window.EMOJI_SETS;
  const SETS = { films: ['🎬 Films', 'Film'], tv: ['📺 TV', 'TV show'], songs: ['🎵 Songs', 'Song'], books: ['📚 Books', 'Book or story'], all: ['🎲 Everything', ''] };
  const HINT_COST = 20;
  const BADGES = [
    ['first', '🎟️', 'Opening Night', 'Finish a game'],
    ['perfect', '🏆', 'Oscar Worthy', 'Solve all 10 in Classic'],
    ['nohint', '🧠', 'No Spoilers', 'Solve 8+ in Classic with no hints'],
    ['streak10', '🔥', 'Binge Watcher', '10 correct in a row'],
    ['rush10', '⏱️', 'Speed Reel', 'Solve 10 in one Rush'],
    ['rush20', '🚀', 'Projectionist', 'Solve 20 in one Rush'],
    ['daily', '📅', 'Daily Matinee', 'Finish a daily set'],
    ['tv', '📺', 'Couch Potato', 'Solve 25 TV puzzles in total'],
    ['songs', '🎵', 'Hum Along', 'Solve 25 song puzzles in total'],
    ['books', '📚', 'Bookworm', 'Solve 25 book puzzles in total'],
    ['solved100', '🍿', 'Film Buff', 'Solve 100 puzzles in total'],
    ['typer', '⌨️', 'Fast Fingers', 'Solve 8+ in Classic by typing']
  ];
  const fresh = () => ({ v: 2, set: C.store.get('em-set', 'films'), mode: 'classic', input: 'type', games: 0, solved: 0, perSet: {}, badges: {}, daily: {}, bestStreak: 0 });
  function load() {
    const d = C.store.get('em:data', null);
    const f = d && typeof d === 'object' && d.v === 2 ? Object.assign(fresh(), d) : fresh();
    if (!SETS[f.set]) f.set = 'films';
    if (!['classic', 'rush', 'daily'].includes(f.mode)) f.mode = 'classic';
    if (!['type', 'choice'].includes(f.input)) f.input = 'type';
    ['perSet', 'badges', 'daily'].forEach((k) => { if (!f[k] || typeof f[k] !== 'object') f[k] = {}; });
    return f;
  }
  const data = load();
  const save = () => C.store.set('em:data', data);
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
  const seg = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
  const graphemes = (s) => seg ? [...seg.segment(s)].map((x) => x.segment) : Array.from(s);

  let set = data.set, mode = data.mode, input = data.input;
  let deck = [], n = 0, score = 0, cur = null, revealed = new Set(), hints = 0, busy = false, results = [], wrongs = 0, streak = 0, bestStreak = 0, hintsUsed = 0;
  let rushLeft = 90, raf = 0, last = 0, running = false, newBadges = [];
  const rounds = () => mode === 'classic' ? 10 : mode === 'daily' ? 5 : Infinity;
  const bestKey = () => mode === 'daily' ? `daily-${today()}` : mode === 'rush' ? `rush-${set}` : (input === 'choice' ? `${set}-pick` : set);
  const kindOf = (p) => p.set ? SETS[p.set][1] : SETS[set][1];

  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ').split(' ').filter((w) => w && w !== 'the').join('');
  function lev(a, b) {
    const m = a.length, k = b.length; if (!m) return k; if (!k) return m;
    let prev = Array.from({ length: k + 1 }, (_, i) => i);
    for (let i = 1; i <= m; i++) {
      const row = [i];
      for (let j = 1; j <= k; j++) row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = row;
    }
    return prev[k];
  }
  const tol = (len) => len <= 4 ? 0 : len <= 9 ? 1 : 2;
  function check(guess) {
    const g = norm(guess);
    if (!g) return { ok: false, close: false };
    const targets = [cur[1], ...(cur[2] || [])].map(norm);
    let bestD = Infinity;
    for (const t of targets) {
      const d = lev(g, t);
      if (d <= tol(t.length)) return { ok: true };
      bestD = Math.min(bestD, d / Math.max(1, t.length));
    }
    return { ok: false, close: bestD <= .34 };
  }

  function poolFor(s) {
    if (s === 'all') return Object.keys(DATA).flatMap((k) => DATA[k].map((p) => Object.assign([...p], { set: k })));
    return DATA[s].map((p) => Object.assign([...p], { set: s }));
  }

  function paintOpts() {
    const sw = $('sets');
    if (!sw.children.length) Object.entries(SETS).forEach(([id, [label]]) => { const b = document.createElement('button'); b.type = 'button'; b.dataset.set = id; b.textContent = label; sw.append(b); });
    [...sw.children].forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.set === set)));
    sw.classList.toggle('is-off', mode === 'daily');
    document.querySelectorAll('#modes button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.m === mode)));
    document.querySelectorAll('#inputs button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.i === input)));
  }

  function deal() {
    if (mode === 'daily') {
      const r = mulberry(hash(`em${today()}`));
      return Object.keys(DATA).concat(['films']).map((k) => { const p = DATA[k][Math.floor(r() * DATA[k].length)]; return Object.assign([...p], { set: k }); }).filter((p, i, a) => a.findIndex((q) => q[1] === p[1]) === i).slice(0, 5);
    }
    const pool = poolFor(set);
    const seen = new Set(C.store.get('em-seen-' + set, []));
    const freshP = C.shuffle(pool.filter((p) => !seen.has(p[1])));
    const rest = C.shuffle(pool.filter((p) => seen.has(p[1])));
    return freshP.concat(rest);
  }
  function remember(title) {
    if (mode === 'daily') return;
    const k = 'em-seen-' + set, arr = C.store.get(k, []);
    arr.push(title);
    const max = Math.floor(poolFor(set).length * .7);
    while (arr.length > max) arr.shift();
    C.store.set(k, arr);
  }

  function start() {
    paintOpts();
    deck = deal(); n = 0; score = 0; results = []; streak = 0; bestStreak = 0; hintsUsed = 0;
    rushLeft = 90; running = true;
    $('sScore').textContent = 0; $('sStreak').textContent = 0;
    const b = C.getBest(bestKey()); $('sBest').textContent = b == null ? '-' : b;
    $('play').hidden = false; $('result').hidden = true;
    $('timerWrap').hidden = mode !== 'rush';
    $('prog').hidden = mode === 'rush';
    $('form').hidden = input !== 'type';
    $('choices').hidden = input !== 'choice';
    cancelAnimationFrame(raf);
    if (mode === 'rush') { last = performance.now(); raf = requestAnimationFrame(rushTick); }
    next();
  }

  function rushTick(now) {
    if (!running || mode !== 'rush') return;
    const dt = Math.min(.1, (now - last) / 1000); last = now;
    if (!document.hidden) rushLeft -= dt;
    $('timer').style.transform = `scaleX(${Math.max(0, rushLeft / 90)})`;
    $('sN').textContent = `${Math.ceil(Math.max(0, rushLeft))}s`;
    if (rushLeft <= 0) { running = false; return finish(); }
    raf = requestAnimationFrame(rushTick);
  }

  function next() {
    if (!running) return;
    if (n >= rounds()) return finish();
    if (n >= deck.length) deck = deck.concat(deal());
    cur = deck[n]; n++;
    revealed = new Set(); hints = 0; busy = false; wrongs = 0;
    remember(cur[1]);
    if (mode !== 'rush') { $('sN').textContent = `${n}/${rounds()}`; $('sNLabel').textContent = 'Puzzle'; } else $('sNLabel').textContent = 'Time';
    $('kind').textContent = `${kindOf(cur)} · ${cur[1].replace(/[^A-Za-z0-9]/g, '').length} letters`;
    const th = $('theatre');
    th.classList.add('is-closed');
    setTimeout(() => {
      const e = $('emoji'); e.innerHTML = '';
      graphemes(cur[0]).forEach((g, i) => { const s = document.createElement('span'); s.textContent = g; s.style.animationDelay = `${.15 + i * .12}s`; e.append(s); });
      e.setAttribute('aria-label', `Emoji clue: ${cur[0]}`);
      th.classList.remove('is-closed');
      tone(330, .08, 'triangle', .06); tone(440, .1, 'triangle', .06, .08);
    }, mode === 'rush' ? 120 : 380);
    $('screen').classList.remove('win');
    $('msg').textContent = ''; $('msg').className = 'em-msg';
    $('guess').value = ''; $('guess').disabled = false;
    $('hint').disabled = false; $('skip').disabled = false;
    drawMask(false);
    drawProgress();
    if (input === 'choice') drawChoices();
    else if (matchMedia('(pointer: fine)').matches) $('guess').focus();
  }

  function drawChoices() {
    const pool = poolFor(cur.set || set).filter((p) => p[1] !== cur[1]);
    const opts = C.shuffle([cur[1], ...C.shuffle(pool).slice(0, 3).map((p) => p[1])]);
    const box = $('choices'); box.innerHTML = '';
    opts.forEach((o, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'em-choice'; b.dataset.v = o;
      b.innerHTML = `<span class="k">${i + 1}</span><span class="t"></span>`;
      b.querySelector('.t').textContent = o;
      b.addEventListener('click', () => pickChoice(b));
      box.append(b);
    });
  }
  function pickChoice(b) {
    if (busy) return;
    if (b.dataset.v === cur[1]) { b.classList.add('good'); solved(); }
    else {
      b.classList.add('bad'); b.disabled = true; wrongs++; streak = 0; $('sStreak').textContent = 0;
      tone(180, .18, 'sawtooth', .08); buzz(50);
      msg('Nope, try another.', 'bad');
      if ([...$('choices').children].filter((x) => !x.disabled).length <= 1) skip();
    }
  }

  function drawProgress() {
    const p = $('prog'); p.innerHTML = '';
    if (mode === 'rush') return;
    for (let i = 0; i < rounds(); i++) {
      const el = document.createElement('i');
      if (results[i]) el.className = results[i].pts > 0 ? 'ok' : 'no';
      else if (i === n - 1) el.className = 'cur';
      p.append(el);
    }
  }

  function drawMask(all, freshIdx) {
    const m = $('mask'); m.innerHTML = '';
    cur[1].split(' ').forEach((word, wi, words) => {
      const w = document.createElement('div'); w.className = 'em-word';
      let idx = words.slice(0, wi).reduce((a, x) => a + x.length + 1, 0);
      let k = 0;
      for (const ch of word) {
        const s = document.createElement('span');
        const letter = /[A-Za-z0-9À-ɏ]/.test(ch);
        s.className = 'em-ch' + (letter ? '' : ' p');
        if (!letter || all || revealed.has(idx)) s.textContent = ch.toUpperCase();
        if (all) { s.classList.add('done'); s.style.animationDelay = `${(idx) * 25}ms`; }
        if (freshIdx === idx) s.classList.add('rev');
        w.append(s); idx++; k++;
      }
      m.append(w);
    });
  }

  function hint() {
    if (busy) return;
    const hidden = [];
    [...cur[1]].forEach((ch, i) => { if (/[A-Za-z0-9À-ɏ]/.test(ch) && !revealed.has(i)) hidden.push(i); });
    if (hidden.length <= 1) { msg('No more hints. You can do this!', ''); return; }
    const starts = hidden.filter((i) => i === 0 || cur[1][i - 1] === ' ');
    const i = starts.length ? starts[0] : C.pick(hidden);
    revealed.add(i); hints++; hintsUsed++;
    drawMask(false, i);
    tone(620, .06, 'sine', .1);
    msg(`Hint ${hints}: this one is now worth ${Math.max(20, 100 - hints * HINT_COST)}.`, '');
    if (hidden.length <= 2) $('hint').disabled = true;
    if (input === 'choice') {
      const wrong = [...$('choices').children].filter((b) => b.dataset.v !== cur[1] && !b.disabled);
      if (wrong.length > 1) { wrong[0].disabled = true; wrong[0].style.opacity = '.3'; }
    }
  }

  function msg(t, cls) { const m = $('msg'); m.textContent = t; m.className = 'em-msg ' + (cls || ''); }

  function submit(e) {
    e.preventDefault();
    if (busy) return;
    const g = $('guess').value;
    if (g.trim() === '?') { $('guess').value = ''; hint(); return; }
    if (!g.trim()) { if (matchMedia('(pointer: fine)').matches) $('guess').focus(); return; }
    const r = check(g);
    if (r.ok) return solved();
    wrongs++;
    if (!r.close) { streak = 0; $('sStreak').textContent = 0; }
    const inp = $('guess'); inp.classList.remove('shake'); void inp.offsetWidth; inp.classList.add('shake');
    tone(180, .18, 'sawtooth', .08); buzz(50);
    msg(r.close ? 'Ooh, so close! Check the spelling.' : C.pick(['Nope. Look again.', 'Not quite.', 'Good guess, wrong answer.', 'The emoji disagree.']), 'bad');
    if (wrongs === 3 && hints === 0) setTimeout(() => C.toast('Stuck? A hint reveals a letter. Type ? to get one.'), 400);
  }

  function solved() {
    busy = true;
    streak++; bestStreak = Math.max(bestStreak, streak);
    const base = Math.max(20, 100 - hints * HINT_COST) - (input === 'choice' ? 30 : 0) - (input === 'choice' ? wrongs * 15 : 0);
    const bonus = streak >= 3 ? 10 * Math.min(streak - 2, 5) : 0;
    const pts = Math.max(10, base) + bonus;
    score += pts;
    results.push({ e: cur[0], t: cur[1], pts, set: cur.set });
    data.solved++; data.perSet[cur.set] = (data.perSet[cur.set] || 0) + 1;
    const s = $('sScore'); s.textContent = score; s.classList.remove('bump'); void s.offsetWidth; s.classList.add('bump');
    $('sStreak').textContent = streak;
    drawMask(true);
    $('screen').classList.add('win');
    const f = document.createElement('div'); f.className = 'em-float'; f.textContent = `+${pts}`; $('theatre').append(f); setTimeout(() => f.remove(), 1000);
    msg(C.pick(['🎉 Yes! ', '🍿 Got it! ', '⭐ Bravo! ', '🎬 That is a wrap! ']) + cur[1] + (bonus ? ` · 🔥 streak +${bonus}` : ''), 'good');
    tone(660, .08, 'triangle', .1); tone(880, .08, 'triangle', .1, .09); tone(1320, .16, 'triangle', .09, .18);
    if (streak % 5 === 0) C.confetti(50);
    lock();
    setTimeout(next, mode === 'rush' ? 700 : 1600);
  }
  function skip() {
    if (busy) return;
    busy = true;
    streak = 0; $('sStreak').textContent = 0;
    results.push({ e: cur[0], t: cur[1], pts: 0, set: cur.set });
    drawMask(true);
    msg(`It was ${cur[1]}.`, 'bad');
    tone(300, .1, 'sine', .1); tone(220, .16, 'sine', .1, .1);
    lock();
    setTimeout(next, mode === 'rush' ? 900 : 1900);
  }
  function lock() { $('guess').disabled = true; $('hint').disabled = true; $('skip').disabled = true; [...$('choices').children].forEach((b) => { b.disabled = true; if (b.dataset.v === cur[1]) b.classList.add('good'); }); drawProgress(); }

  function award(id) {
    if (data.badges[id]) return;
    data.badges[id] = Date.now();
    const b = BADGES.find((x) => x[0] === id);
    if (b) newBadges.push(b);
  }

  function finish() {
    running = false;
    cancelAnimationFrame(raf);
    newBadges = [];
    const before = C.getBest(bestKey());
    const { best, isNew } = C.best(bestKey(), score);
    const got = results.filter((r) => r.pts > 0).length;
    data.games++; data.bestStreak = Math.max(data.bestStreak, bestStreak);
    if (mode === 'daily') { data.daily[today()] = Math.max(data.daily[today()] || 0, score); award('daily'); }
    award('first');
    if (mode === 'classic' && got === 10) award('perfect');
    if (mode === 'classic' && got >= 8 && hintsUsed === 0) award('nohint');
    if (mode === 'classic' && got >= 8 && input === 'type') award('typer');
    if (bestStreak >= 10) award('streak10');
    if (mode === 'rush' && got >= 10) award('rush10');
    if (mode === 'rush' && got >= 20) award('rush20');
    if ((data.perSet.tv || 0) >= 25) award('tv');
    if ((data.perSet.songs || 0) >= 25) award('songs');
    if ((data.perSet.books || 0) >= 25) award('books');
    if (data.solved >= 100) award('solved100');
    save();
    $('sBest').textContent = best;
    $('play').hidden = true; $('result').hidden = false;
    const total = results.length;
    $('rScore').textContent = score;
    const isPB = isNew && before != null && score > 0;
    $('rLine').textContent = `${got} of ${total} solved · best streak ${bestStreak} · best ${best}${isPB ? ' (new!)' : ''}`;
    const frac = total ? got / total : 0;
    const stars = frac >= .95 ? 5 : frac >= .75 ? 4 : frac >= .5 ? 3 : frac >= .25 ? 2 : 1;
    $('rStars').innerHTML = Array.from({ length: 5 }, (_, i) => `<span class="${i < stars ? '' : 'off'}" style="animation-delay:${.2 + i * .12}s">⭐</span>`).join('');
    $('rTitle').textContent = isPB ? 'New personal best!' : stars === 5 ? 'Flawless. Oscar-worthy.' : stars >= 4 ? 'Box office smash!' : stars >= 3 ? 'Solid matinee.' : stars >= 2 ? 'Cult classic.' : 'Straight to DVD.';
    $('rBadges').innerHTML = '';
    newBadges.forEach((bd, i) => { const s = document.createElement('span'); s.textContent = `${bd[1]} ${bd[2]}`; s.style.animationDelay = `${.3 + i * .15}s`; $('rBadges').append(s); });
    const list = $('rList'); list.innerHTML = '';
    results.forEach((r) => {
      const d = document.createElement('div');
      d.innerHTML = `<span class="e"></span><span class="t"></span><span class="p"></span>`;
      d.querySelector('.e').textContent = r.e;
      d.querySelector('.t').textContent = r.t;
      const p = d.querySelector('.p'); p.textContent = r.pts ? '+' + r.pts : 'skip'; if (r.pts) p.classList.add('ok');
      list.append(d);
    });
    if (isPB || newBadges.length || stars >= 4) C.confetti();
    [523, 659, 784, 1046].forEach((f, i) => tone(f, .2, 'triangle', .07, i * .09));
    paintPanels();
    $('again').focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  function paintPanels() {
    const got = BADGES.filter((b) => data.badges[b[0]]).length;
    $('badgeCount').textContent = `${got}/${BADGES.length}`;
    $('badgeList').innerHTML = '';
    BADGES.forEach(([id, ico, name, desc]) => {
      const d = document.createElement('div'); d.className = 'em-badge' + (data.badges[id] ? ' is-got' : '');
      const i = document.createElement('i'); i.textContent = ico;
      const t = document.createElement('div'); const b = document.createElement('b'); b.textContent = name; const s = document.createElement('span'); s.textContent = desc;
      t.append(b, s); d.append(i, t); $('badgeList').append(d);
    });
    const totalP = Object.values(DATA).reduce((a, x) => a + x.length, 0);
    const rows = [[data.games, 'Games'], [data.solved, 'Solved'], [data.bestStreak, 'Best streak'], [totalP, 'Puzzles in the box'],
      [data.perSet.films || 0, 'Films solved'], [data.perSet.tv || 0, 'TV solved'], [data.perSet.songs || 0, 'Songs solved'], [data.perSet.books || 0, 'Books solved']];
    $('statTbl').innerHTML = '';
    rows.forEach(([v, l]) => { const d = document.createElement('div'); const b = document.createElement('b'); b.textContent = v; const s = document.createElement('span'); s.textContent = l; d.append(b, s); $('statTbl').append(d); });
  }

  $('sets').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; set = b.dataset.set; data.set = set; save(); start(); });
  $('modes').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; mode = b.dataset.m; data.mode = mode; save(); start(); });
  $('inputs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; input = b.dataset.i; data.input = input; save(); start(); });
  $('form').addEventListener('submit', submit);
  $('hint').addEventListener('click', hint);
  $('skip').addEventListener('click', skip);
  $('again').addEventListener('click', start);
  $('share').addEventListener('click', () => {
    const head = mode === 'daily' ? `Curio Emoji Movies, daily ${today()}` : `Curio Emoji Movies, ${mode === 'rush' ? '90s Rush' : 'Classic'} (${SETS[set][0].slice(3)})`;
    const t = `${head}\n🍿 ${score} points\n${results.map((r) => r.pts ? '🟩' : '🟥').join('')}\n${results.slice(0, 3).map((r) => r.e).join('  ')}`;
    navigator.clipboard?.writeText(t).then(() => C.toast('Result copied!'), () => C.toast(`${score} points`));
  });
  $('guess').addEventListener('input', () => { if ($('msg').classList.contains('bad')) msg('', ''); });
  document.querySelector('.em-ptabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]'); if (!b) return;
    document.querySelectorAll('.em-ptabs [data-tab]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    document.querySelectorAll('[data-pane]').forEach((p) => { p.hidden = p.dataset.pane !== b.dataset.tab; });
  });
  document.addEventListener('keydown', (e) => {
    if ($('play').hidden || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'Escape') { e.preventDefault(); skip(); return; }
    if (input === 'choice') {
      const k = parseInt(e.key, 10);
      if (k >= 1 && k <= 4) { const b = $('choices').children[k - 1]; if (b && !b.disabled) pickChoice(b); }
      else if (e.key === 'h' || e.key === 'H') hint();
    }
  });
  document.addEventListener('visibilitychange', () => { last = performance.now(); });
  paintOpts();
  paintPanels();
  start();
  window.__em = { get cur() { return cur; }, get busy() { return busy; }, get running() { return running; } };
})();
