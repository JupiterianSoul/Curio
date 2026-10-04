(() => {
  const C = window.Curio;
  const $ = (id) => document.getElementById(id);
  const CATS = window.TRIVIA_CATS;
  const BANK = window.TRIVIA;
  const catOf = (id) => CATS.find((c) => c.id === id);
  const all = [];
  for (const c of CATS) BANK[c.id].forEach((q, i) => all.push({ cat: c.id, id: c.id + i, q: q[0], a: q[1], w: q.slice(2) }));
  const MODES = {
    classic: { name: 'Classic', rounds: 15, limit: 20, lives: 0 },
    survival: { name: 'Survival', rounds: Infinity, limit: 15, lives: 3 },
    blitz: { name: 'Blitz', rounds: Infinity, limit: 0, lives: 0, clock: 60 },
    daily: { name: 'Daily', rounds: 10, limit: 20, lives: 0 },
    simple: { name: 'Quick quiz', rounds: 10, limit: 0, lives: 0 }
  };
  const SIMPLE = C.simple;
  const BADGES = [
    ['first', '🍺', 'First Round', 'Finish a game'],
    ['perfect', '💯', 'Perfect Night', '15 out of 15 in Classic'],
    ['streak10', '🔥', 'On Fire', 'Answer 10 in a row'],
    ['streak25', '🌋', 'Volcanic', 'Answer 25 in a row'],
    ['surv25', '❤️', 'Survivor', '25 right in one Survival run'],
    ['blitz15', '⚡', 'Lightning Round', '15 right in one Blitz'],
    ['daily', '📅', 'Daily Habit', 'Finish a daily quiz'],
    ['allcats', '🌍', 'Polymath', 'Play every category'],
    ['expert', '🎓', 'Specialist', '13+ right in a single-category Classic'],
    ['speedy', '⏱️', 'Quick Draw', 'Answer correctly within 2 seconds'],
    ['solo', '🦸', 'No Help Needed', '12+ right in Classic without lifelines'],
    ['answered500', '📚', 'Bookworm', 'Answer 500 questions']
  ];
  const fresh = () => ({ v: 2, mode: 'classic', games: 0, answered: 0, correct: 0, perCat: {}, played: {}, bestStreak: 0, history: [], badges: {}, daily: {} });
  function load() {
    const d = C.store.get('tv:data', null);
    const f = d && typeof d === 'object' && d.v === 2 ? Object.assign(fresh(), d) : fresh();
    if (!MODES[f.mode]) f.mode = 'classic';
    ['perCat', 'played', 'badges', 'daily'].forEach((k) => { if (!f[k] || typeof f[k] !== 'object') f[k] = {}; });
    if (!Array.isArray(f.history)) f.history = [];
    return f;
  }
  const data = load();
  const save = () => C.store.set('tv:data', data);
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
  function ding() { tone(1318, .5, 'sine', .14); tone(2637, .3, 'sine', .04); tone(1760, .7, 'sine', .14, .16); tone(3520, .4, 'sine', .035, .16); }
  function buzzer() {
    if (C.muted) return;
    const ac = C.audioContext(); if (!ac) return;
    const t = ac.currentTime, o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter();
    o.type = 'square'; o2.type = 'sawtooth'; o.frequency.value = 110; o2.frequency.value = 116;
    f.type = 'lowpass'; f.frequency.value = 900;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + 0.02); g.gain.setValueAtTime(0.09, t + 0.5); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.62);
    o.connect(f); o2.connect(f); f.connect(g).connect(ac.destination); o.start(t); o2.start(t); o.stop(t + 0.65); o2.stop(t + 0.65);
  }
  function jingle() { [523, 659, 784, 1047].forEach((f, i) => tone(f, .14, 'triangle', .09, i * .08)); tone(1568, .4, 'sine', .07, .34); }
  const buzz = (ms) => { try { navigator.vibrate?.(ms); } catch {} };

  let mode = SIMPLE ? 'simple' : data.mode, cat = 'mix', queue = [], round = 0, score = 0, streak = 0, bestStreak = 0, cur = null, answered = false;
  let lives = 3, used = { fifty: false, skip: false, freeze: false }, anyLifeline = false, log = [], timeLeft = 20, clockLeft = 60, frozen = 0, last = 0, raf = 0, advanceT = 0, askedAt = 0, newBadges = [], running = false;
  const M = () => MODES[mode];
  const bestKey = () => mode === 'simple' ? 'simple' : mode === 'daily' ? `daily-${today()}` : mode === 'classic' ? cat : `${mode}-${cat}`;

  function drawMenu() {
    document.querySelectorAll('#modes .tv-mode').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.m === mode)));
    $('qCount').textContent = C.fmt(all.length);
    const dToday = data.daily[today()];
    $('dailySub').textContent = dToday != null ? `Today: ${C.fmt(dToday)} pts` : '10 for everyone today';
    const box = $('cats'); box.innerHTML = '';
    box.classList.toggle('is-off', mode === 'daily');
    const mk = (id, label, emoji, color, sub, cls) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'tv-cat ' + (cls || ''); b.style.setProperty('--c', color);
      const key = mode === 'daily' ? `daily-${today()}` : mode === 'classic' ? id : `${mode}-${id}`;
      const best = C.getBest(key);
      b.innerHTML = `<span class="e" aria-hidden="true"></span><span><b></b><br><small></small></span>`;
      b.querySelector('.e').textContent = emoji;
      b.querySelector('b').textContent = mode === 'daily' && id === 'mix' ? 'Start the daily quiz' : label;
      b.querySelector('small').textContent = best == null ? sub : `Best: ${C.fmt(best)}`;
      const pc = data.perCat[id];
      if (pc && pc[1] >= 5 && id !== 'mix') { const a = document.createElement('span'); a.className = 'acc'; a.textContent = `${Math.round(pc[0] / pc[1] * 100)}%`; b.append(a); }
      b.addEventListener('click', () => start(id));
      box.append(b);
    };
    mk('mix', 'Mixed bag', mode === 'daily' ? '📅' : '🎲', '#3949ab', mode === 'daily' ? 'Ten mixed questions, same for everyone' : 'A bit of everything', 'tv-cat--mix');
    CATS.forEach((c) => mk(c.id, c.label, c.emoji, c.color, `${BANK[c.id].length} questions`));
    const rules = {
      classic: ['⏱️ Faster answers score more', '🔥 Streaks add a bonus', '✂️ 50:50', '⏭️ Skip', '🧊 Freeze the clock'],
      survival: ['❤️ Three wrong answers and you are out', '⏱️ 15 seconds each', '✂️ ⏭️ 🧊 one of each lifeline'],
      blitz: ['⚡ 60 seconds on the clock', '✅ +100 per right answer, streaks add more', '❌ Wrong answers cost 3 seconds'],
      daily: ['📅 Ten questions, same for everyone today', '⏱️ 20 seconds each', '📋 Share your score']
    }[mode] || [];
    $('rules').innerHTML = rules.map((r) => `<span>${r}</span>`).join('');
  }

  function seenSet() { return new Set(C.store.get('trivia-seen', [])); }
  function remember(id) {
    const s = C.store.get('trivia-seen', []);
    s.push(id); while (s.length > 400) s.shift();
    C.store.set('trivia-seen', s);
  }
  function buildQueue() {
    if (mode === 'daily') {
      const r = mulberry(hash(`tv${today()}`));
      const a = all.slice();
      for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
      const out = [], cats = new Set();
      for (const q of a) { if (cats.has(q.cat)) continue; cats.add(q.cat); out.push(q); if (out.length >= 10) break; }
      return out.concat(a.filter((q) => !out.includes(q)).slice(0, 5));
    }
    const seen = seenSet();
    const pool = cat === 'mix' ? all : all.filter((q) => q.cat === cat);
    const fresh = C.shuffle(pool.filter((q) => !seen.has(q.id)));
    const stale = C.shuffle(pool.filter((q) => seen.has(q.id)));
    let list = fresh.concat(stale);
    if (cat === 'mix') {
      const out = [], usedIds = new Set();
      for (const q of list) { if (out.length && out[out.length - 1].cat === q.cat) continue; out.push(q); usedIds.add(q.id); }
      list = out.concat(list.filter((q) => !usedIds.has(q.id)));
    }
    return list;
  }

  function show(id) { ['menu', 'game', 'result'].forEach((s) => { $(s).hidden = s !== id; }); $('panel').hidden = id === 'game'; window.scrollTo(0, 0); }

  function start(c) {
    cat = mode === 'daily' ? 'mix' : c;
    queue = buildQueue(); round = 0; score = 0; streak = 0; bestStreak = 0; log = [];
    lives = M().lives || 0; used = { fifty: false, skip: false, freeze: false }; anyLifeline = false;
    clockLeft = M().clock || 0;
    running = true;
    $('sScore').textContent = 0; $('sStreak').textContent = 0;
    $('fifty').hidden = $('skip').hidden = $('freeze').hidden = mode === 'blitz' || mode === 'simple';
    document.querySelector('.tv-timer').hidden = $('secs').hidden = mode === 'simple';
    show('game');
    jingle();
    if (mode === 'blitz') { last = performance.now(); }
    next();
  }

  function paintTop() {
    if (mode === 'survival') { $('sQLabel').textContent = 'Lives'; $('sQ').innerHTML = [0, 1, 2].map((i) => `<i class="${i < lives ? '' : 'gone'}">❤️</i>`).join(''); $('sQ').className = 'tv-hearts'; }
    else if (mode === 'blitz') { $('sQLabel').textContent = 'Answered'; $('sQ').textContent = log.length; $('sQ').className = ''; }
    else { $('sQLabel').textContent = 'Question'; $('sQ').textContent = `${round}/${M().rounds}`; $('sQ').className = ''; }
    $('flame').innerHTML = Array.from({ length: 5 }, (_, i) => `<i class="${i < Math.min(streak, 5) ? 'on' : ''}"></i>`).join('') + (streak >= 3 ? ` x${streak}` : '');
  }

  function next() {
    if (!running) return;
    if (round >= M().rounds) return finish();
    if (mode === 'survival' && lives <= 0) return finish();
    if (mode === 'blitz' && clockLeft <= 0) return finish();
    if (!queue.length) queue = buildQueue();
    round++;
    cur = queue.shift();
    if (mode !== 'daily') remember(cur.id);
    ask();
  }

  function ask() {
    answered = false; frozen = 0;
    const c = catOf(cur.cat);
    paintTop();
    $('stage').style.setProperty('--c', c.color);
    const chip = $('chip'); chip.textContent = `${c.emoji} ${c.label}`;
    const q = $('q'); q.textContent = cur.q; q.classList.remove('in'); void q.offsetWidth; q.classList.add('in');
    const opts = [cur.a, ...cur.w];
    if (mode === 'daily') { const r = mulberry(hash(cur.id + today())); for (let i = opts.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [opts[i], opts[j]] = [opts[j], opts[i]]; } cur.opts = opts; }
    else cur.opts = C.shuffle(opts);
    const box = $('opts'); box.innerHTML = '';
    cur.opts.forEach((o, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'tv-opt'; b.dataset.v = o;
      b.innerHTML = `<span class="k"><b>${'ABCD'[i]}</b><small>${i + 1}</small></span><span class="t"></span>`;
      b.querySelector('.t').textContent = o;
      b.addEventListener('click', () => answer(o, b));
      box.append(b);
    });
    $('note').textContent = '';
    $('fifty').disabled = used.fifty; $('skip').disabled = used.skip; $('freeze').disabled = used.freeze;
    timeLeft = M().limit; last = performance.now(); askedAt = last;
    cancelAnimationFrame(raf);
    if (mode !== 'simple') raf = requestAnimationFrame(tick);
  }

  let lastSec = 0;
  function tick(now) {
    if (!running) return;
    const dt = Math.min(.1, (now - last) / 1000); last = now;
    const bar = $('bar');
    if (mode === 'blitz') {
      if (!document.hidden) clockLeft -= dt;
      const p = Math.max(0, clockLeft / 60);
      bar.style.transform = `scaleX(${p})`;
      bar.className = p < .2 ? 'low' : p < .45 ? 'warn' : '';
      const s = Math.ceil(Math.max(0, clockLeft));
      $('secs').textContent = s + 's';
      if (s !== lastSec) { lastSec = s; if (s <= 5 && s > 0) tone(880, .04, 'square', .05); }
      if (clockLeft <= 0) { answered = true; return finish(); }
      raf = requestAnimationFrame(tick);
      return;
    }
    if (answered) return;
    if (frozen > 0) frozen -= dt;
    else if (!document.hidden) timeLeft -= dt;
    const p = Math.max(0, timeLeft / M().limit);
    bar.style.transform = `scaleX(${p})`;
    bar.className = frozen > 0 ? 'frozen' : p < .25 ? 'low' : p < .5 ? 'warn' : '';
    const s = Math.ceil(Math.max(0, timeLeft));
    $('secs').textContent = frozen > 0 ? `🧊 ${Math.ceil(frozen)}s` : s + 's';
    if (s !== lastSec) { lastSec = s; if (s <= 5 && s > 0 && frozen <= 0) tone(880, .04, 'square', .05); }
    if (timeLeft <= 0) return answer(null, null);
    raf = requestAnimationFrame(tick);
  }

  function answer(val, btn) {
    if (answered) return;
    answered = true;
    if (mode !== 'blitz') cancelAnimationFrame(raf);
    const ok = val === cur.a;
    const btns = [...$('opts').children];
    btns.forEach((b) => { b.disabled = true; if (b.dataset.v === cur.a) b.classList.add('is-good'); });
    $('fifty').disabled = true; $('skip').disabled = true; $('freeze').disabled = true;
    const took = (performance.now() - askedAt) / 1000;
    if (ok) {
      streak++; bestStreak = Math.max(bestStreak, streak);
      const speed = mode === 'blitz' || mode === 'simple' ? 0 : Math.round(Math.max(0, timeLeft) / M().limit * 100);
      const bonus = 20 * Math.min(streak - 1, 5);
      const pts = 100 + speed + bonus;
      score += pts;
      const f = document.createElement('div'); f.className = 'tv-float'; f.textContent = `+${pts}`;
      $('card').append(f); setTimeout(() => f.remove(), 1000);
      bump('sScore', C.fmt(score));
      bump('sStreak', streak);
      $('note').textContent = streak >= 3 ? `🔥 ${streak} in a row! Streak bonus +${bonus}` : C.pick(['Correct!', 'Nailed it.', 'Yes!', 'Spot on.', 'Big brain.', 'Textbook.', 'The table cheers.']);
      ding();
      if (streak % 5 === 0) { C.confetti(50); tone(1320, .16, 'triangle', .08, .2); }
      if (took < 2) award('speedy');
    } else {
      streak = 0; $('sStreak').textContent = 0;
      if (btn) btn.classList.add('is-bad');
      const st = $('stage'); st.classList.remove('is-bad'); void st.offsetWidth; st.classList.add('is-bad');
      $('note').textContent = val == null ? `⏰ Time! It was ${cur.a}.` : `Nope, it was ${cur.a}.`;
      buzzer();
      buzz(60);
      if (mode === 'survival') lives--;
      if (mode === 'blitz') { clockLeft -= 3; $('note').textContent += ' (-3s)'; }
    }
    const pc = data.perCat[cur.cat] || [0, 0]; pc[1]++; if (ok) pc[0]++; data.perCat[cur.cat] = pc;
    data.answered++; if (ok) data.correct++;
    log.push({ ...cur, given: val, ok });
    paintTop();
    clearTimeout(advanceT);
    advanceT = setTimeout(next, mode === 'blitz' ? (ok ? 350 : 900) : ok ? 1100 : 2000);
  }

  function bump(id, v) { const el = $(id); el.textContent = v; el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }

  function fifty() {
    if (used.fifty || answered || mode === 'blitz') return;
    used.fifty = true; anyLifeline = true; $('fifty').disabled = true;
    const wrong = C.shuffle([...$('opts').children].filter((b) => b.dataset.v !== cur.a)).slice(0, 2);
    wrong.forEach((b) => { b.classList.add('gone'); b.disabled = true; });
    tone(400, .08, 'square', .06); tone(300, .08, 'square', .06, .08);
    $('note').textContent = 'Two wrong answers vanish. Choose wisely.';
  }
  function skip() {
    if (used.skip || answered || mode === 'blitz') return;
    used.skip = true; anyLifeline = true;
    cancelAnimationFrame(raf);
    tone(500, .06, 'sine', .1); tone(700, .06, 'sine', .1, .06);
    if (!queue.length) queue = buildQueue();
    cur = queue.shift(); if (mode !== 'daily') remember(cur.id);
    ask();
    $('skip').disabled = true;
    $('note').textContent = 'Fresh question, same round. Streak kept.';
  }
  function freeze() {
    if (used.freeze || answered || mode === 'blitz') return;
    used.freeze = true; anyLifeline = true; $('freeze').disabled = true;
    frozen = 10;
    tone(1200, .2, 'sine', .06); tone(1500, .25, 'sine', .05, .1);
    $('note').textContent = '🧊 Clock frozen for 10 seconds. Think it through.';
  }

  function award(id) {
    if (data.badges[id]) return;
    data.badges[id] = Date.now();
    const b = BADGES.find((x) => x[0] === id);
    if (b) { newBadges.push(b); if (running) C.toast(`Badge: ${b[1]} ${b[2]}`); }
  }

  function ringSvg(frac, label) {
    const r = 62, L = 2 * Math.PI * r;
    return `<circle cx="75" cy="75" r="${r}" fill="none" stroke="var(--surface-2)" stroke-width="14"/>
      <circle class="fg" cx="75" cy="75" r="${r}" fill="none" stroke="${frac >= .8 ? 'var(--good)' : frac >= .5 ? 'var(--warn)' : 'var(--bad)'}" stroke-width="14" stroke-linecap="round" stroke-dasharray="${L}" stroke-dashoffset="${L}" transform="rotate(-90 75 75)" data-to="${L * (1 - frac)}"/>
      <text x="75" y="76" text-anchor="middle" font-size="30" font-weight="900" fill="var(--ink)" font-family="system-ui, sans-serif">${Math.round(frac * 100)}%</text>
      <text x="75" y="98" text-anchor="middle" font-size="11" font-weight="800" fill="var(--ink-3)" font-family="system-ui, sans-serif">${label}</text>`;
  }

  function finish() {
    if (!running) return;
    running = false;
    cancelAnimationFrame(raf); clearTimeout(advanceT);
    newBadges = [];
    const right = log.filter((l) => l.ok).length;
    const before = C.getBest(bestKey());
    const { best, isNew } = C.best(bestKey(), mode === 'simple' ? right : score);
    data.games++; data.bestStreak = Math.max(data.bestStreak, bestStreak);
    data.played[cat] = 1;
    data.history.push({ m: mode, c: cat, s: score, r: right, n: log.length, t: Date.now() });
    if (data.history.length > 150) data.history = data.history.slice(-150);
    if (mode === 'daily') { data.daily[today()] = Math.max(data.daily[today()] || 0, score); award('daily'); }
    award('first');
    if (mode === 'classic' && right === 15) award('perfect');
    if (bestStreak >= 10) award('streak10');
    if (bestStreak >= 25) award('streak25');
    if (mode === 'survival' && right >= 25) award('surv25');
    if (mode === 'blitz' && right >= 15) award('blitz15');
    if (CATS.every((c) => data.played[c.id])) award('allcats');
    if (mode === 'classic' && cat !== 'mix' && right >= 13) award('expert');
    if (mode === 'classic' && right >= 12 && !anyLifeline) award('solo');
    if (data.answered >= 500) award('answered500');
    save();
    show('result');
    const n = Math.max(1, log.length);
    $('ring').innerHTML = ringSvg(right / n, `${right} of ${log.length} right`);
    requestAnimationFrame(() => requestAnimationFrame(() => { const fg = $('ring').querySelector('.fg'); if (fg) fg.style.strokeDashoffset = fg.dataset.to; }));
    $('rScore').textContent = mode === 'simple' ? `${right}/10` : C.fmt(score);
    const label = mode === 'simple' ? 'Quick quiz' : mode === 'daily' ? `Daily ${today()}` : `${M().name} · ${cat === 'mix' ? 'Mixed bag' : catOf(cat).label}`;
    const isPB = isNew && before != null && score > 0;
    $('rLine').textContent = `${label} · best streak ${bestStreak} · best here ${C.fmt(best)}${isPB ? ' (new!)' : ''}`;
    const acc = right / n;
    const quip = mode === 'survival' ? (right >= 30 ? 'An iron constitution and an encyclopedic brain.' : right >= 15 ? 'You lasted a long, long time. Respect.' : 'Survival is hard. The quizmaster is merciless.')
      : mode === 'blitz' ? (right >= 15 ? 'Fingers and brain, both on fire.' : right >= 8 ? 'Quick thinking under pressure.' : 'The clock won this time.')
      : acc === 1 ? 'A perfect night. The quizmaster weeps.' : acc >= .8 ? 'You are the reason other teams groan when you walk in.' : acc >= .6 ? 'Solid pub-quiz energy. Respect.' : acc >= .4 ? 'Respectable. The bonus round could have been kinder.' : acc >= .2 ? 'Hey, at least you showed up.' : 'Bold strategy: answering with vibes.';
    $('rQuip').textContent = quip;
    $('rTitle').textContent = isPB ? 'New personal best!' : 'Final score';
    const dots = $('rDots'); dots.innerHTML = '';
    log.forEach((l, i) => { const d = document.createElement('i'); d.className = l.ok ? 'ok' : l.given == null ? 'to' : ''; d.style.animationDelay = `${i * 30}ms`; dots.append(d); });
    $('rBadges').innerHTML = '';
    newBadges.forEach((bd, i) => { const s = document.createElement('span'); s.textContent = `${bd[1]} ${bd[2]}`; s.style.animationDelay = `${.3 + i * .15}s`; $('rBadges').append(s); });
    const byCat = {};
    log.forEach((l) => { byCat[l.cat] = byCat[l.cat] || [0, 0]; byCat[l.cat][1]++; if (l.ok) byCat[l.cat][0]++; });
    catBars($('rCats'), byCat);
    const rev = $('review'); rev.innerHTML = '';
    const misses = log.filter((l) => !l.ok);
    if (misses.length) {
      const h = document.createElement('h2'); h.textContent = `Mistakes to learn from (${misses.length})`; rev.append(h);
      misses.forEach((m) => {
        const row = document.createElement('div'); row.className = 'row';
        row.innerHTML = `<b></b><span class="bad"></span><span class="good"></span>`;
        row.querySelector('b').textContent = `${catOf(m.cat).emoji} ${m.q}`;
        row.querySelector('.bad').textContent = m.given == null ? 'No answer' : m.given;
        row.querySelector('.good').textContent = '✓ ' + m.a;
        rev.append(row);
      });
    }
    if (isPB || newBadges.length || acc >= .9) { C.confetti(); }
    [660, 880, 1320].forEach((f, i) => tone(f, .16, 'triangle', .08, i * .11));
    drawMenu(); paintPanels();
    $('again').focus({ preventScroll: true });
  }

  function catBars(el, byCat) {
    el.innerHTML = '';
    Object.keys(byCat).forEach((k) => {
      const c = catOf(k); if (!c) return;
      const [r, t] = byCat[k];
      const row = document.createElement('div'); row.style.setProperty('--c', c.color);
      row.innerHTML = `<span></span><span class="bar"><i style="width:${Math.round(r / t * 100)}%"></i></span><span style="text-align:right">${r}/${t}</span>`;
      row.firstChild.textContent = `${c.emoji} ${c.label}`;
      el.append(row);
    });
  }

  function paintPanels() {
    const got = BADGES.filter((b) => data.badges[b[0]]).length;
    $('badgeCount').textContent = `${got}/${BADGES.length}`;
    $('badgeList').innerHTML = '';
    BADGES.forEach(([id, ico, name, desc]) => {
      const d = document.createElement('div'); d.className = 'tv-badge' + (data.badges[id] ? ' is-got' : '');
      const i = document.createElement('i'); i.textContent = ico;
      const t = document.createElement('div'); const b = document.createElement('b'); b.textContent = name; const s = document.createElement('span'); s.textContent = desc;
      t.append(b, s); d.append(i, t); $('badgeList').append(d);
    });
    const rows = [[data.games, 'Games'], [data.answered, 'Answered'], [data.answered ? Math.round(data.correct / data.answered * 100) + '%' : '-', 'Accuracy'], [data.bestStreak, 'Best streak'], [data.daily[today()] != null ? C.fmt(data.daily[today()]) : '-', 'Today\'s daily']];
    $('statTbl').innerHTML = '';
    rows.forEach(([v, l]) => { const d = document.createElement('div'); const b = document.createElement('b'); b.textContent = v; const s = document.createElement('span'); s.textContent = l; d.append(b, s); $('statTbl').append(d); });
    const pc = {}; CATS.forEach((c) => { if (data.perCat[c.id]) pc[c.id] = data.perCat[c.id]; });
    catBars($('allCats'), pc);
  }

  function quit() {
    if ($('game').hidden) return;
    if (mode === 'simple') { if (log.length) finish(); return; }
    running = false; cancelAnimationFrame(raf); clearTimeout(advanceT);
    save(); show('menu'); drawMenu(); paintPanels();
  }

  $('modes').addEventListener('click', (e) => { const b = e.target.closest('.tv-mode'); if (!b || SIMPLE) return; mode = b.dataset.m; data.mode = mode; save(); drawMenu(); tone(620, .05, 'triangle', .06); });
  $('fifty').addEventListener('click', fifty);
  $('skip').addEventListener('click', skip);
  $('freeze').addEventListener('click', freeze);
  $('again').addEventListener('click', () => start(cat));
  $('back').addEventListener('click', () => { show('menu'); drawMenu(); });
  $('share').addEventListener('click', () => {
    const head = mode === 'simple' ? 'Zoble Trivia Night, quick quiz' : mode === 'daily' ? `Zoble Trivia Night, daily ${today()}` : `Zoble Trivia Night, ${M().name} (${cat === 'mix' ? 'Mixed bag' : catOf(cat).label})`;
    const t = `${head}\n🍻 ${C.fmt(score)} points, ${log.filter((l) => l.ok).length}/${log.length} right\n${log.map((l) => l.ok ? '🟩' : '🟥').join('')}`;
    navigator.clipboard?.writeText(t).then(() => C.toast('Result copied!'), () => C.toast(t.split('\n')[1]));
  });
  document.querySelector('.tv-ptabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]'); if (!b) return;
    document.querySelectorAll('.tv-ptabs [data-tab]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    document.querySelectorAll('[data-pane]').forEach((p) => { p.hidden = p.dataset.pane !== b.dataset.tab; });
  });
  document.addEventListener('keydown', (e) => {
    if ($('game').hidden || e.metaKey || e.ctrlKey || e.altKey) return;
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 4) { const b = $('opts').children[n - 1]; if (b && !b.disabled) b.click(); }
    else if (e.key === 'f' || e.key === 'F') fifty();
    else if (e.key === 's' || e.key === 'S') skip();
    else if (e.key === 'z' || e.key === 'Z') freeze();
    else if (e.key === 'Escape') quit();
  });
  document.addEventListener('visibilitychange', () => { last = performance.now(); });

  drawMenu();
  paintPanels();
  if (SIMPLE) { document.body.classList.add('tv-simple'); start('mix'); }
  window.__tv = { get cur() { return cur; }, get running() { return running; }, get answered() { return answered; } };
})();
