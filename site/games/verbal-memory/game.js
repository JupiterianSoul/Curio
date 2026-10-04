(() => {
  const $ = (id) => document.getElementById(id);
  const stage = $('stage'), card = $('card'), wordEl = $('word'), deckEl = $('deck');
  const WORDS = window.VM_WORDS || [], EMOJI = window.VM_EMOJI || [];
  const DECKS = { words: 'Words', emoji: 'Emoji', numbers: 'Numbers' };
  const RULES = { classic: 'Classic', sudden: 'Sudden death', sprint: 'Sprint', daily: 'Daily' };
  const BADGES = [
    ['first', '🎬', 'First Card', 'Finish a game'],
    ['s25', '🙂', 'Twenty-Five', 'Score 25 in one game'],
    ['s50', '🧠', 'Fifty', 'Score 50 in one game'],
    ['s100', '🐘', 'Centurion', 'Score 100 in one game'],
    ['s150', '📚', 'Walking Dictionary', 'Score 150 in one game'],
    ['streak30', '🔥', 'On Fire', '30 right answers in a row'],
    ['sudden25', '💀', 'Tightrope', 'Score 25 in Sudden death'],
    ['sprint40', '⏱️', 'Sprinter', 'Score 40 in Sprint'],
    ['emoji50', '🦊', 'Picture Perfect', 'Score 50 with the Emoji deck'],
    ['num30', '🔢', 'Number Cruncher', 'Score 30 with the Numbers deck'],
    ['daily', '📅', 'Daily Habit', 'Play a daily challenge'],
    ['games25', '🎮', 'Regular', 'Play 25 games']
  ];

  const fresh = () => ({ v: 2, games: 0, correct: 0, wrong: 0, history: [], badges: {}, daily: {}, deck: 'words', rule: 'classic', bestStreak: 0 });
  function load() {
    const d = Curio.store.get('wm:data', null);
    if (!d || typeof d !== 'object' || d.v !== 2) return fresh();
    const f = Object.assign(fresh(), d);
    if (!Array.isArray(f.history)) f.history = [];
    if (!DECKS[f.deck]) f.deck = 'words';
    if (!RULES[f.rule]) f.rule = 'classic';
    return f;
  }
  const data = load();
  const save = () => Curio.store.set('wm:data', data);
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const hash = (s) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const mulberry = (seed) => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  function tone(f, d = 0.12, type = 'sine', vol = 0.12, when = 0, slide = 0) {
    if (Curio.muted) return;
    const ac = Curio.audioContext(); if (!ac) return;
    const t = ac.currentTime + when;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d + 0.03);
  }
  const buzz = (ms) => { try { navigator.vibrate?.(ms); } catch {} };

  let deck = data.deck, rule = data.rule;
  let seen = [], seenSet = new Set(), unseen = [], current = '', last = '', rnd = Math.random;
  let score = 0, lives = 3, shown = 0, phase = 'menu', mistakes = new Set(), streak = 0, maxStreak = 0, wrongCount = 0;
  let timeLeft = 60, lastT = 0, raf = 0, newBadges = [];

  const effDeck = () => rule === 'daily' ? 'words' : deck;
  const bestKey = () => rule === 'daily' ? `daily-${today()}` : (deck === 'words' && rule === 'classic' ? 'score' : `${deck}-${rule}`);
  const show = (id) => ['menu', 'game', 'result'].forEach((s) => { $(s).hidden = s !== id; });

  function paintMenu() {
    document.querySelectorAll('#decks .wm-opt').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.deck === deck)));
    document.querySelectorAll('#rules .wm-opt').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.rule === rule)));
    $('decks').classList.toggle('is-off', rule === 'daily');
    $('nWords').textContent = `${Curio.fmt(WORDS.length)} nouns`;
    $('nEmoji').textContent = `${EMOJI.length} pictures`;
    const b = Curio.getBest(bestKey());
    $('menuBest').textContent = rule === 'daily'
      ? (data.daily[today()] != null ? `Today's daily score: ${data.daily[today()]}. Go again to beat it.` : 'Today\'s daily deck is waiting.')
      : (b == null ? `No ${DECKS[deck]} ${RULES[rule]} record yet.` : `Best ${DECKS[deck]} ${RULES[rule]}: ${b}`);
  }

  function paint() {
    $('score').textContent = score;
    if (rule === 'sprint') {
      $('lives').textContent = `${Math.max(0, timeLeft).toFixed(0)}s`;
      $('livesLabel').textContent = 'Time';
    } else {
      const max = rule === 'sudden' ? 1 : 3;
      $('lives').innerHTML = Array.from({ length: max }, (_, i) => `<i class="${i < lives ? '' : 'is-gone'}">❤️</i>`).join('');
      $('lives').setAttribute('aria-label', `${lives} lives`);
      $('livesLabel').textContent = 'Lives';
    }
    const b = Curio.getBest(bestKey());
    $('best').textContent = b == null ? '-' : b;
    const st = $('streak');
    st.textContent = streak >= 5 ? `🔥 streak ${streak}` : `streak ${streak}`;
    st.classList.toggle('is-hot', streak >= 10);
  }

  function makeNumber() {
    const digits = Math.min(7, 3 + Math.floor(shown / 20));
    for (let k = 0; k < 50; k++) {
      let s = String(1 + Math.floor(rnd() * 9));
      for (let i = 1; i < digits; i++) s += Math.floor(rnd() * 10);
      if (!seenSet.has(s)) return s;
    }
    return String(Math.floor(rnd() * 1e9));
  }

  function nextWord() {
    const pSeen = seen.length < 3 ? 0.12 : Math.min(0.55, 0.35 + seen.length / 300);
    const choices = seen.filter((w) => w !== last);
    let w;
    const d = effDeck();
    const canNew = d === 'numbers' || unseen.length;
    if ((rnd() < pSeen && choices.length) || !canNew) w = choices.length ? choices[Math.floor(rnd() * choices.length)] : seen[0];
    else w = d === 'numbers' ? makeNumber() : unseen.pop();
    current = w; last = w; shown++;
    wordEl.textContent = w;
    wordEl.className = 'wm-word' + (d === 'emoji' ? ' is-emoji' : d === 'numbers' ? ' is-num' : '');
    card.classList.remove('is-in'); void card.offsetWidth; card.classList.add('is-in');
    card.style.transform = '';
    $('count').textContent = `Card ${shown} · ${seen.length} tracked`;
  }

  function flyGhost(dir, wrong) {
    const g = card.cloneNode(true);
    g.removeAttribute('id');
    g.querySelector('#word')?.removeAttribute('id');
    g.classList.remove('is-in');
    g.style.position = 'absolute';
    g.style.transform = card.style.transform;
    g.classList.add(dir < 0 ? 'fly-l' : 'fly-r');
    if (wrong) g.classList.add('is-wrong');
    g.setAttribute('aria-hidden', 'true');
    deckEl.append(g);
    setTimeout(() => g.remove(), 360);
  }

  function floatText(t) {
    const f = document.createElement('div');
    f.className = 'wm-float'; f.textContent = t;
    stage.append(f);
    setTimeout(() => f.remove(), 820);
  }

  function answer(saidSeen) {
    if (phase !== 'play') return;
    const wasSeen = seenSet.has(current);
    const ok = wasSeen === saidSeen;
    flyGhost(saidSeen ? -1 : 1, !ok);
    const btn = $(saidSeen ? 'seen' : 'new');
    btn.classList.add('is-press'); setTimeout(() => btn.classList.remove('is-press'), 90);
    stage.classList.remove('is-good', 'is-bad'); void stage.offsetWidth;
    if (ok) {
      score++; streak++; maxStreak = Math.max(maxStreak, streak);
      stage.classList.add('is-good');
      tone((saidSeen ? 620 : 760) * (1 + Math.min(streak, 30) * 0.012), .08, 'triangle', .09);
      if (streak % 10 === 0) { floatText(`🔥 ${streak} in a row!`); tone(1046, .12, 'triangle', .07, .06); tone(1318, .16, 'triangle', .07, .12); }
      else floatText('+1');
    } else {
      wrongCount++; streak = 0;
      mistakes.add(current);
      stage.classList.add('is-bad');
      tone(170, .25, 'sawtooth', .06, 0, -90);
      buzz(70);
      if (rule === 'sprint') { timeLeft -= 5; floatText('-5s'); } else { lives--; floatText('💔'); }
      Curio.toast(wasSeen ? `"${current}" was a repeat!` : `"${current}" was brand new!`);
    }
    if (!wasSeen) { seenSet.add(current); seen.push(current); }
    setTimeout(() => stage.classList.remove('is-good', 'is-bad'), 280);
    paint();
    if (rule !== 'sprint' && lives <= 0) return end();
    if (rule === 'sprint' && timeLeft <= 0) return end();
    nextWord();
  }

  function sprintLoop(t) {
    if (phase !== 'play' || rule !== 'sprint') return;
    if (lastT) timeLeft -= (t - lastT) / 1000;
    lastT = t;
    $('timeBar').style.transform = `scaleX(${Math.max(0, timeLeft / 60)})`;
    const s = Math.ceil(timeLeft);
    if ($('lives').textContent !== `${Math.max(0, s)}s`) { $('lives').textContent = `${Math.max(0, s)}s`; if (s <= 5 && s > 0) tone(880, .05, 'square', .04); }
    if (timeLeft <= 0) return end();
    raf = requestAnimationFrame(sprintLoop);
  }

  function verdict(s) {
    if (s >= 150) return 'Walking dictionary. Are you secretly a search engine?';
    if (s >= 100) return 'Triple digits. Seriously impressive recall.';
    if (s >= 70) return 'Way above average. Your brain has good filing.';
    if (s >= 45) return 'Above average! Most people land around 40 to 50.';
    if (s >= 30) return 'Pretty human. Respectable.';
    if (s >= 15) return 'Warming up. Words are slippery things.';
    return 'Brain was still loading. Try again!';
  }

  function award(id) {
    if (data.badges[id]) return;
    data.badges[id] = Date.now();
    const b = BADGES.find((x) => x[0] === id);
    if (b) newBadges.push(b);
  }

  function sparkline() {
    const sp = $('spark');
    const hist = data.history.filter((h) => h.r === rule && h.d === effDeck()).slice(-20);
    if (hist.length < 2) { sp.innerHTML = ''; sp.style.display = 'none'; return; }
    sp.style.display = '';
    const max = Math.max(10, ...hist.map((h) => h.s));
    const X = (i) => 14 + i * (392 / (hist.length - 1)), Y = (v) => 60 - (v / max) * 48;
    const pts = hist.map((h, i) => `${X(i).toFixed(1)},${Y(h.s).toFixed(1)}`).join(' ');
    sp.innerHTML = `<polyline points="14,60 ${pts} 406,60" fill="color-mix(in srgb, #7d43d6 16%, transparent)" stroke="none"/>
      <polyline points="${pts}" fill="none" stroke="#7d43d6" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      ${hist.map((h, i) => `<circle cx="${X(i).toFixed(1)}" cy="${Y(h.s).toFixed(1)}" r="${i === hist.length - 1 ? 5 : 3}" fill="${i === hist.length - 1 ? '#7d43d6' : 'var(--surface)'}" stroke="#7d43d6" stroke-width="2"/>`).join('')}
      <text x="14" y="69" font-size="9" fill="var(--ink-3)" font-weight="700">last ${hist.length} games like this</text>`;
  }

  function end() {
    phase = 'over';
    cancelAnimationFrame(raf);
    newBadges = [];
    const before = Curio.getBest(bestKey());
    const b = Curio.best(bestKey(), score);
    data.games++; data.correct += score; data.wrong += wrongCount;
    data.bestStreak = Math.max(data.bestStreak, maxStreak);
    data.history.push({ d: effDeck(), r: rule, s: score, t: Date.now() });
    if (data.history.length > 150) data.history = data.history.slice(-150);
    if (rule === 'daily') { data.daily[today()] = Math.max(data.daily[today()] || 0, score); award('daily'); }
    award('first');
    if (score >= 25) award('s25');
    if (score >= 50) award('s50');
    if (score >= 100) award('s100');
    if (score >= 150) award('s150');
    if (maxStreak >= 30) award('streak30');
    if (rule === 'sudden' && score >= 25) award('sudden25');
    if (rule === 'sprint' && score >= 40) award('sprint40');
    if (effDeck() === 'emoji' && score >= 50) award('emoji50');
    if (effDeck() === 'numbers' && score >= 30) award('num30');
    if (data.games >= 25) award('games25');
    save();
    show('result');
    $('result').scrollIntoView({ block: 'start', behavior: 'smooth' });
    const isPB = b.isNew && before != null;
    $('rIcon').textContent = isPB ? '🏆' : score >= 50 ? '🐘' : score >= 25 ? '🧠' : '🐟';
    $('rTitle').textContent = `${score} point${score === 1 ? '' : 's'}`;
    $('rVerdict').textContent = (isPB ? 'New personal best! ' : '') + verdict(score);
    const acc = score + wrongCount ? Math.round(score / (score + wrongCount) * 100) : 0;
    $('rStats').innerHTML = '';
    [[b.best, 'Best'], [seen.length, 'Tracked'], [`${acc}%`, 'Accuracy'], [maxStreak, 'Longest streak']].forEach(([v, l]) => {
      const d = document.createElement('div'); d.className = 'c-stat';
      const bb = document.createElement('b'); bb.textContent = v; const s = document.createElement('span'); s.textContent = l;
      d.append(bb, s); $('rStats').append(d);
    });
    $('rBadges').innerHTML = '';
    newBadges.forEach((bd, i) => { const s = document.createElement('span'); s.textContent = `${bd[1]} ${bd[2]}`; s.style.animationDelay = `${.3 + i * .15}s`; $('rBadges').append(s); });
    const list = $('seenList');
    list.innerHTML = '';
    seen.forEach((w) => { const s = document.createElement('span'); s.textContent = w; if (mistakes.has(w)) s.className = 'is-x'; list.append(s); });
    sparkline();
    paintPanels();
    $('again').focus({ preventScroll: true });
    if (isPB || newBadges.length) Curio.confetti();
    [523, 659, 784, 1046].forEach((f, j) => tone(f, .22, 'triangle', .07, j * .09));
  }

  function start() {
    const d = effDeck();
    rnd = rule === 'daily' ? mulberry(hash(`wm${today()}`)) : Math.random;
    const src = d === 'emoji' ? EMOJI : d === 'words' ? WORDS : [];
    unseen = src.slice();
    for (let i = unseen.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [unseen[i], unseen[j]] = [unseen[j], unseen[i]]; }
    seen = []; seenSet = new Set(); mistakes = new Set();
    score = 0; lives = rule === 'sudden' ? 1 : 3; shown = 0; last = ''; streak = 0; maxStreak = 0; wrongCount = 0;
    timeLeft = 60; lastT = 0;
    phase = 'play';
    show('game');
    $('timeWrap').hidden = rule !== 'sprint';
    $('timeBar').style.transform = 'scaleX(1)';
    paint(); nextWord();
    requestAnimationFrame(() => stage.scrollIntoView({ block: 'center', behavior: 'smooth' }));
    if (rule === 'sprint') raf = requestAnimationFrame(sprintLoop);
    tone(523, .08, 'triangle', .06); tone(784, .1, 'triangle', .06, .06);
  }

  function toMenu() {
    cancelAnimationFrame(raf);
    phase = 'menu';
    show('menu');
    paintMenu();
  }

  function paintPanels() {
    const got = BADGES.filter((b) => data.badges[b[0]]).length;
    $('badgeCount').textContent = `${got}/${BADGES.length}`;
    $('badgeList').innerHTML = '';
    BADGES.forEach(([id, ico, name, desc]) => {
      const d = document.createElement('div'); d.className = 'wm-badge' + (data.badges[id] ? ' is-got' : '');
      const i = document.createElement('i'); i.textContent = ico;
      const t = document.createElement('div'); const b = document.createElement('b'); b.textContent = name; const s = document.createElement('span'); s.textContent = desc;
      t.append(b, s); d.append(i, t); $('badgeList').append(d);
    });
    const bestOf = (k) => Math.max(0, ...data.history.filter((h) => h.d === k).map((h) => h.s));
    const acc = data.correct + data.wrong ? Math.round(data.correct / (data.correct + data.wrong) * 100) + '%' : '-';
    const rows = [[data.games, 'Games'], [data.correct, 'Right answers'], [acc, 'Accuracy'], [data.bestStreak, 'Best streak'],
      [bestOf('words') || '-', 'Best Words'], [bestOf('emoji') || '-', 'Best Emoji'], [bestOf('numbers') || '-', 'Best Numbers'], [data.daily[today()] ?? '-', 'Today\'s daily']];
    $('statTbl').innerHTML = '';
    rows.forEach(([v, l]) => { const d = document.createElement('div'); const b = document.createElement('b'); b.textContent = v; const s = document.createElement('span'); s.textContent = l; d.append(b, s); $('statTbl').append(d); });
  }

  let drag = null;
  Curio.drag(card, {
    start(pt) { if (phase !== 'play') return; drag = { x: pt.clientX, dx: 0 }; },
    move(pt) {
      if (!drag) return;
      drag.dx = pt.clientX - drag.x;
      card.style.transform = `translateX(${drag.dx}px) rotate(${drag.dx / 14}deg)`;
      card.querySelector('.s-seen').style.opacity = Math.max(0, -drag.dx / 90);
      card.querySelector('.s-new').style.opacity = Math.max(0, drag.dx / 90);
    },
    end() {
      if (!drag) return;
      const dx = drag.dx;
      drag = null;
      card.querySelectorAll('.wm-stamp').forEach((s) => { s.style.opacity = ''; });
      if (Math.abs(dx) > 70 && phase === 'play') answer(dx < 0);
      else { card.style.transition = 'transform .2s'; card.style.transform = ''; setTimeout(() => { card.style.transition = ''; }, 220); }
    }
  });

  $('decks').addEventListener('click', (e) => { const b = e.target.closest('[data-deck]'); if (!b) return; deck = b.dataset.deck; data.deck = deck; save(); paintMenu(); tone(660, .05, 'triangle', .05); });
  $('rules').addEventListener('click', (e) => { const b = e.target.closest('[data-rule]'); if (!b) return; rule = b.dataset.rule; data.rule = rule; save(); paintMenu(); tone(560, .05, 'triangle', .05); });
  $('start').addEventListener('click', start);
  $('again').addEventListener('click', start);
  $('toMenu').addEventListener('click', toMenu);
  $('seen').addEventListener('click', () => answer(true));
  $('new').addEventListener('click', () => answer(false));
  $('share').addEventListener('click', async () => {
    const head = rule === 'daily' ? `Zoble Verbal Memory, daily ${today()}` : `Zoble Verbal Memory, ${DECKS[deck]} ${RULES[rule]}`;
    const t = `${head}\n${score} points 🧠, ${seen.length} cards tracked, longest streak ${maxStreak} 🔥`;
    try { await navigator.clipboard.writeText(t); Curio.toast('Result copied!'); } catch { Curio.toast(t.split('\n')[1]); }
  });
  document.querySelector('.wm-tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]'); if (!b) return;
    document.querySelectorAll('.wm-tabs [data-tab]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    document.querySelectorAll('[data-pane]').forEach((p) => { p.hidden = p.dataset.pane !== b.dataset.tab; });
  });
  document.addEventListener('keydown', (e) => {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (phase === 'play' && (k === 's' || k === 'arrowleft')) { e.preventDefault(); answer(true); }
    else if (phase === 'play' && (k === 'n' || k === 'arrowright')) { e.preventDefault(); answer(false); }
    else if (k === 'escape' && phase !== 'menu') { e.preventDefault(); toMenu(); }
    else if (phase !== 'play' && k === 'enter' && !e.target.closest('button')) { e.preventDefault(); start(); }
  });
  document.addEventListener('visibilitychange', () => {
    if (rule !== 'sprint' || phase !== 'play') return;
    if (document.hidden) cancelAnimationFrame(raf);
    else { lastT = 0; raf = requestAnimationFrame(sprintLoop); }
  });

  paintMenu();
  paintPanels();
  window.__wm = { get current() { return current; }, isSeen: (w) => seenSet.has(w), get phase() { return phase; } };
})();
