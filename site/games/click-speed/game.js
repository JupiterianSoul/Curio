(() => {
  const $ = (id) => document.getElementById(id);
  const pad = $('pad'), big = $('big'), small = $('small'), timerBar = $('timer'), cv = $('graph'), g = cv.getContext('2d');
  const OPTS = { cps: [1, 5, 10, 30, 60], race: [50, 100, 200], hunt: [15, 30, 60] };
  const SIZES = { big: { px: 76, life: 1.9 }, medium: { px: 56, life: 1.45 }, small: { px: 40, life: 1.15 } };
  const RATINGS = [
    [3, '🦥', 'Sloth', 'Unhurried. Majestic, even.'],
    [5, '🐢', 'Tortoise', 'Slow and steady. Mostly slow.'],
    [6.5, '🐈', 'House Cat', 'Respectable, casually average.'],
    [8, '🐇', 'Rabbit', 'Quick fingers! Above average.'],
    [10, '🐆', 'Cheetah', 'Blazing. Your mouse is sweating.'],
    [12, '🐦', 'Woodpecker', 'That is a jitter-clicking frenzy.'],
    [Infinity, '🤖', 'Robot', 'Inhuman. Show us your hands.']
  ];
  const HUNT_RATINGS = [
    [0.7, '🦥', 'Sloth', 'The targets felt very safe around you.'],
    [1.0, '🐢', 'Tortoise', 'Getting there, one target at a time.'],
    [1.3, '🐈', 'House Cat', 'Decent pounce. Some misses, some glory.'],
    [1.6, '🦉', 'Owl', 'Sharp eyes, steady hand.'],
    [1.9, '🦅', 'Hawk', 'Swoop, snatch, repeat. Very nice.'],
    [2.3, '🐸', 'Frog Tongue', 'Ridiculously fast reactions.'],
    [Infinity, '🤖', 'Aimbot', 'We are checking your computer for software.']
  ];
  const BADGES = [
    ['first', '🎬', 'First Click', 'Finish any test'],
    ['cps8', '🐇', 'Rabbit', 'Reach 8 CPS'],
    ['cps10', '🐆', 'Cheetah', 'Reach 10 CPS'],
    ['cps12', '🐦', 'Woodpecker', 'Reach 12 CPS'],
    ['marathon', '🏃', 'Marathon', 'Finish a 60 second CPS test'],
    ['race100', '🏁', 'Photo Finish', 'Race to 100 in under 12 s'],
    ['race200', '🚀', 'Long Haul', 'Finish a race to 200'],
    ['hunt30', '🎯', 'Sharpshooter', '30 hits in one hunt'],
    ['acc95', '🧿', 'Deadeye', '95% accuracy with 20+ hits'],
    ['combo20', '🔥', 'Hot Streak', 'A 20 hit combo in Target Hunt'],
    ['zx', '🎹', 'Rhythm Hands', '8 CPS with Z + X'],
    ['clicks10k', '🖱️', 'Ten Thousand', '10,000 total clicks']
  ];
  const fresh = () => ({ v: 2, mode: 'cps', cpsDur: Curio.store.get('cs-dur', 5), raceN: 100, huntDur: 30, input: Curio.store.get('cs-input', 'click'), size: 'medium', history: [], badges: {}, clicks: 0 });
  function load() {
    const d = Curio.store.get('cs:data', null);
    const f = d && typeof d === 'object' && d.v === 2 ? Object.assign(fresh(), d) : fresh();
    if (!OPTS[f.mode]) f.mode = 'cps';
    if (!OPTS.cps.includes(f.cpsDur)) f.cpsDur = 5;
    if (!OPTS.race.includes(f.raceN)) f.raceN = 100;
    if (!OPTS.hunt.includes(f.huntDur)) f.huntDur = 30;
    if (!['click', 'space', 'zx'].includes(f.input)) f.input = 'click';
    if (!SIZES[f.size]) f.size = 'medium';
    if (!Array.isArray(f.history)) f.history = [];
    return f;
  }
  const data = load();
  const save = () => Curio.store.set('cs:data', data);

  function tone(f, d = 0.12, type = 'sine', vol = 0.12, when = 0, slide = 0) {
    if (Curio.muted) return;
    const ac = Curio.audioContext(); if (!ac) return;
    const t = ac.currentTime + when;
    const o = ac.createOscillator(), gn = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
    gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(vol, t + 0.005); gn.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(gn).connect(ac.destination); o.start(t); o.stop(t + d + 0.03);
  }
  const buzz = (ms) => { try { navigator.vibrate?.(ms); } catch {} };

  let mode = data.mode, input = data.input;
  let state = 'idle', clicks = [], t0 = 0, raf = 0, lockUntil = 0, lastKey = '', gDur = 5, newBadges = [];
  let hunt = null;
  const dur = () => mode === 'cps' ? data.cpsDur : mode === 'hunt' ? data.huntDur : data.raceN;
  const key = () => mode === 'cps' ? `${input}-${data.cpsDur}` : mode === 'race' ? `race-${input}-${data.raceN}` : `hunt-${data.size}-${data.huntDur}`;
  const verb = () => input === 'space' ? 'Press Space' : input === 'zx' ? 'Alternate Z and X' : 'Click';
  const rate = (v, list = RATINGS) => list.find((r) => v < r[0]);

  function paintModes() {
    document.querySelectorAll('#tabs .cs-tab').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.mode === mode)));
    const durs = $('durs');
    durs.innerHTML = '';
    OPTS[mode].forEach((v) => {
      const b = document.createElement('button');
      b.type = 'button'; b.dataset.d = v;
      b.textContent = mode === 'race' ? `${v} clicks` : `${v}s`;
      b.setAttribute('aria-pressed', String(v === dur()));
      durs.append(b);
    });
    document.querySelectorAll('#inputs button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.i === input)));
    document.querySelectorAll('#sizes button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.s === data.size)));
    $('inputs').hidden = mode === 'hunt';
    $('sizes').hidden = mode !== 'hunt';
    $('gauge').style.display = mode === 'hunt' ? 'none' : '';
    $('graphCard').hidden = mode === 'hunt';
    $('hint').textContent = mode === 'hunt' ? 'Tip: do not chase the first target, let your eyes move first.'
      : input === 'space' ? 'Spacebar mode: hammer the Space key. Needs a keyboard.'
      : input === 'zx' ? 'Z + X mode: alternate two fingers on Z and X. Same key twice does not count.'
      : 'Tip: two fingers on a trackpad or phone count too. We won\'t tell.';
  }

  function setNeedle(cps) {
    const a = -90 + Math.min(16, Math.max(0, cps)) / 16 * 180;
    $('needle').setAttribute('transform', `rotate(${a.toFixed(1)} 100 100)`);
  }

  function idle() {
    state = 'idle';
    cancelAnimationFrame(raf);
    clearHunt();
    pad.className = 'cs-pad' + (mode === 'hunt' ? ' is-hunt' : '');
    $('combo').hidden = true;
    const b = Curio.getBest(key());
    if (mode === 'hunt') {
      big.textContent = '🎯';
      small.textContent = `Click to start a ${data.huntDur} second hunt` + (b != null ? ` · best ${b}` : '');
    } else {
      big.textContent = input === 'space' ? 'Space!' : input === 'zx' ? 'Z X Z X' : 'Click!';
      small.textContent = mode === 'race'
        ? `${verb()} ${data.raceN} times, fast as you can` + (b != null ? ` · best ${b.toFixed(2)}s` : '')
        : `${verb()} to start the ${data.cpsDur} second test` + (b != null ? ` · best ${b.toFixed(2)} CPS` : '');
    }
    timerBar.style.transform = 'scaleX(0)';
    $('live').textContent = '0.0 CPS';
    setNeedle(0);
    clicks = [];
    gDur = mode === 'race' ? 10 : data.cpsDur;
    drawGraph(0);
  }

  function colors() {
    const cs = getComputedStyle(document.documentElement);
    return { line: cs.getPropertyValue('--line').trim(), ink: cs.getPropertyValue('--ink-3').trim(), accent: '#e53935' };
  }

  function series(upto) {
    const w = gDur <= 1 ? 0.25 : gDur <= 5 ? 0.5 : 1;
    const pts = [];
    const step = Math.max(0.05, gDur / 120);
    let lo = 0;
    for (let t = step; t <= upto + 1e-9; t += step) {
      while (lo < clicks.length && clicks[lo] <= t - w) lo++;
      let c = 0;
      for (let k = lo; k < clicks.length && clicks[k] <= t; k++) c++;
      pts.push([t, c / w]);
    }
    return pts;
  }

  function drawGraph(upto) {
    if (mode === 'hunt') return;
    const dpr = Math.min(2, devicePixelRatio || 1);
    const W = cv.clientWidth, H = cv.clientHeight;
    if (!W) return;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    const c = colors();
    const pts = series(upto);
    const maxY = Math.max(10, Math.ceil(Math.max(0, ...pts.map((p) => p[1])) / 5) * 5);
    const L = 28, R = W - 6, T = 8, B = H - 20;
    const X = (t) => L + t / gDur * (R - L), Y = (v) => B - v / maxY * (B - T);
    g.font = '700 11px system-ui, sans-serif';
    g.fillStyle = c.ink; g.strokeStyle = c.line; g.lineWidth = 1;
    for (let v = 0; v <= maxY; v += maxY / 2) {
      g.beginPath(); g.moveTo(L, Y(v)); g.lineTo(R, Y(v)); g.stroke();
      g.textAlign = 'right'; g.fillText(String(v), L - 6, Y(v) + 4);
    }
    g.textAlign = 'center';
    [0, gDur / 2, gDur].forEach((t) => g.fillText(`${+t.toFixed(1)}s`, Math.min(R - 10, Math.max(L + 8, X(t))), H - 4));
    if (pts.length < 2) return;
    const grad = g.createLinearGradient(0, T, 0, B);
    grad.addColorStop(0, 'rgba(229, 57, 53, .35)'); grad.addColorStop(1, 'rgba(229, 57, 53, 0)');
    g.beginPath();
    pts.forEach(([t, v], i) => i ? g.lineTo(X(t), Y(v)) : g.moveTo(X(t), Y(v)));
    g.lineTo(X(pts[pts.length - 1][0]), B); g.lineTo(X(pts[0][0]), B); g.closePath();
    g.fillStyle = grad; g.fill();
    g.beginPath();
    pts.forEach(([t, v], i) => i ? g.lineTo(X(t), Y(v)) : g.moveTo(X(t), Y(v)));
    g.strokeStyle = c.accent; g.lineWidth = 2.5; g.lineJoin = 'round'; g.stroke();
    const lp = pts[pts.length - 1];
    g.fillStyle = c.accent; g.beginPath(); g.arc(X(lp[0]), Y(lp[1]), 4, 0, 7); g.fill();
  }

  function ripple(x, y) {
    const r = document.createElement('span');
    r.className = 'cs-ripple'; r.style.left = x + 'px'; r.style.top = y + 'px';
    pad.append(r);
    setTimeout(() => r.remove(), 600);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    for (let i = 0; i < 5; i++) {
      const s = document.createElement('span');
      s.className = 'cs-spark';
      const a = Math.random() * Math.PI * 2, d = 30 + Math.random() * 40;
      s.style.left = x + 'px'; s.style.top = y + 'px';
      s.style.setProperty('--dx', `${Math.cos(a) * d}px`); s.style.setProperty('--dy', `${Math.sin(a) * d}px`);
      pad.append(s);
      setTimeout(() => s.remove(), 520);
    }
  }

  function floatAt(x, y, text) {
    const f = document.createElement('span');
    f.className = 'cs-float'; f.textContent = text; f.style.left = x + 'px'; f.style.top = y + 'px';
    pad.append(f);
    setTimeout(() => f.remove(), 720);
  }

  function hit(stamp, x, y) {
    if (state === 'done') {
      if (stamp < lockUntil) return;
      $('results').hidden = true;
      idle();
    }
    if (state === 'idle') {
      state = 'run'; t0 = stamp; clicks = [];
      pad.className = 'cs-pad is-run';
      raf = requestAnimationFrame(tick);
    }
    const t = Math.max(0, (stamp - t0) / 1000);
    if (mode === 'cps' && t > data.cpsDur) return;
    clicks.push(t);
    data.clicks++;
    big.textContent = clicks.length;
    pad.classList.remove('is-bump'); void pad.offsetWidth; pad.classList.add('is-bump');
    ripple(x, y);
    tone(700 + Math.min(600, clicks.length * 5), .025, 'square', .03);
    if (mode === 'race') {
      timerBar.style.transform = `scaleX(${clicks.length / data.raceN})`;
      if (clicks.length >= data.raceN) finish(t);
    }
  }

  function tick() {
    if (state !== 'run') return;
    const t = (performance.now() - t0) / 1000;
    if (mode === 'cps') {
      if (t >= data.cpsDur) return finish();
      timerBar.style.transform = `scaleX(${t / data.cpsDur})`;
      small.textContent = `${(data.cpsDur - t).toFixed(1)}s left`;
    } else {
      if (t > gDur * 0.92) gDur = Math.ceil(t * 1.5);
      small.textContent = `${(data.raceN - clicks.length)} to go · ${t.toFixed(2)}s`;
    }
    const pts = series(t);
    const live = pts.length ? pts[pts.length - 1][1] : 0;
    $('live').textContent = `${live.toFixed(1)} CPS`;
    setNeedle(live);
    drawGraph(t);
    raf = requestAnimationFrame(tick);
  }

  function award(id) {
    if (data.badges[id]) return;
    data.badges[id] = Date.now();
    const b = BADGES.find((x) => x[0] === id);
    if (b) newBadges.push(b);
  }

  function stat(v, l) {
    const d = document.createElement('div'); d.className = 'c-stat';
    const b = document.createElement('b'); b.textContent = v; const s = document.createElement('span'); s.textContent = l;
    d.append(b, s); return d;
  }

  function showResult(r, list, val, statsArr, isPB, value) {
    $('rAnimal').textContent = r[1];
    $('rating').textContent = `You are a ${r[2]}`;
    $('ratingSub').textContent = (isPB ? 'New personal best! ' : '') + r[3];
    $('ladder').innerHTML = '';
    const idx = list.indexOf(r);
    list.forEach((x, i) => { const s = document.createElement('span'); s.textContent = x[1]; s.title = x[2]; if (i === idx) s.className = 'is-on'; else if (i < idx) s.className = 'is-past'; $('ladder').append(s); });
    $('rStats').innerHTML = '';
    statsArr.forEach(([v, l]) => $('rStats').append(stat(v, l)));
    $('rBadges').innerHTML = '';
    newBadges.forEach((bd, i) => { const s = document.createElement('span'); s.textContent = `${bd[1]} ${bd[2]}`; s.style.animationDelay = `${.3 + i * .15}s`; $('rBadges').append(s); });
    paintBests();
    const res = $('results');
    res.hidden = false; res.classList.remove('is-on'); void res.offsetWidth; res.classList.add('is-on');
    data.history.push({ k: key(), v: value, t: Date.now() });
    if (data.history.length > 200) data.history = data.history.slice(-200);
    save();
    paintPanels();
    tone(520, .1, 'triangle', .1); tone(780, .14, 'triangle', .1, .11); tone(1040, .18, 'triangle', .08, .22);
    if (isPB || newBadges.length) Curio.confetti();
    if (innerWidth < 700) setTimeout(() => res.scrollIntoView({ block: 'start', behavior: 'smooth' }), 500);
  }

  function finish(raceT) {
    state = 'done';
    newBadges = [];
    lockUntil = performance.now() + 900;
    cancelAnimationFrame(raf);
    timerBar.style.transform = 'scaleX(1)';
    const n = clicks.length;
    const elapsed = mode === 'race' ? Math.max(0.01, raceT) : data.cpsDur;
    if (mode === 'race') gDur = Math.max(1, Math.ceil(elapsed));
    const cps = n / elapsed;
    const pts = series(elapsed);
    const peak = Math.max(cps, ...pts.map((p) => p[1]));
    const before = Curio.getBest(key());
    const value = mode === 'race' ? +elapsed.toFixed(2) : +cps.toFixed(2);
    const b = Curio.best(key(), value, mode !== 'race');
    const r = rate(cps);
    pad.className = 'cs-pad is-done';
    big.textContent = mode === 'race' ? `${elapsed.toFixed(2)}s` : cps.toFixed(2);
    small.textContent = mode === 'race' ? `${data.raceN} clicks · ${cps.toFixed(2)} CPS` : `clicks per second · ${r[1]} ${r[2]}`;
    $('live').textContent = `${cps.toFixed(2)} CPS avg`;
    setNeedle(cps);
    drawGraph(elapsed);
    award('first');
    if (cps >= 8) award('cps8');
    if (cps >= 10) award('cps10');
    if (cps >= 12) award('cps12');
    if (mode === 'cps' && data.cpsDur === 60) award('marathon');
    if (mode === 'race' && data.raceN === 100 && elapsed < 12) award('race100');
    if (mode === 'race' && data.raceN === 200) award('race200');
    if (input === 'zx' && cps >= 8) award('zx');
    if (data.clicks >= 10000) award('clicks10k');
    const isPB = b.isNew && before != null;
    const fmtBest = mode === 'race' ? `${b.best.toFixed(2)}s` : b.best.toFixed(2);
    showResult(r, RATINGS, cps, mode === 'race'
      ? [[`${elapsed.toFixed(2)}s`, 'Time'], [cps.toFixed(2), 'CPS'], [peak.toFixed(1), 'Peak CPS'], [fmtBest, 'Best here']]
      : [[cps.toFixed(2), 'CPS'], [n, 'Clicks'], [peak.toFixed(1), 'Peak CPS'], [fmtBest, 'Best here']], isPB, value);
  }

  function clearHunt() {
    if (!hunt) return;
    clearTimeout(hunt.expire);
    pad.querySelectorAll('.cs-target').forEach((t) => t.remove());
    hunt = null;
  }

  function spawnTarget() {
    if (!hunt || state !== 'run') return;
    const sz = SIZES[data.size];
    const W = pad.clientWidth, H = pad.clientHeight, m = sz.px / 2 + 10;
    let x, y, k = 0;
    do { x = m + Math.random() * (W - 2 * m); y = m + 30 + Math.random() * (H - 2 * m - 40); k++; }
    while (k < 20 && hunt.last && Math.hypot(x - hunt.last[0], y - hunt.last[1]) < sz.px * 1.6);
    hunt.last = [x, y];
    const t = document.createElement('button');
    t.type = 'button'; t.className = 'cs-target'; t.setAttribute('aria-label', 'Target');
    t.style.width = t.style.height = sz.px + 'px';
    t.style.left = x + 'px'; t.style.top = y + 'px';
    t.style.setProperty('--life', sz.life + 's');
    pad.append(t);
    hunt.cur = t; hunt.born = performance.now();
    hunt.expire = setTimeout(() => {
      if (!hunt || hunt.cur !== t) return;
      hunt.faded++; hunt.combo = 0; paintCombo();
      t.remove();
      tone(220, .1, 'triangle', .05, 0, -60);
      spawnTarget();
    }, sz.life * 1000);
  }

  function paintCombo() {
    const c = $('combo');
    c.hidden = !hunt;
    if (hunt) c.textContent = hunt.combo >= 5 ? `🔥 x${Math.min(5, 1 + Math.floor(hunt.combo / 5))} combo ${hunt.combo}` : `combo ${hunt.combo}`;
  }

  function huntStart(stamp) {
    $('results').hidden = true;
    state = 'run'; t0 = stamp;
    hunt = { hits: 0, score: 0, miss: 0, faded: 0, combo: 0, best: 0, rts: [], cur: null, last: null };
    pad.className = 'cs-pad is-hunt is-run';
    big.textContent = '0';
    paintCombo();
    spawnTarget();
    raf = requestAnimationFrame(huntTick);
  }

  function huntTick() {
    if (state !== 'run' || !hunt) return;
    const t = (performance.now() - t0) / 1000;
    if (t >= data.huntDur) return huntFinish();
    timerBar.style.transform = `scaleX(${t / data.huntDur})`;
    small.textContent = `${(data.huntDur - t).toFixed(1)}s left · ${hunt.hits} hits`;
    raf = requestAnimationFrame(huntTick);
  }

  function huntHit(t, x, y) {
    const rt = performance.now() - hunt.born;
    clearTimeout(hunt.expire);
    hunt.hits++; hunt.combo++; hunt.best = Math.max(hunt.best, hunt.combo);
    const mult = Math.min(5, 1 + Math.floor(hunt.combo / 5));
    hunt.score += mult;
    hunt.rts.push(rt);
    data.clicks++;
    big.textContent = hunt.score;
    t.classList.add('is-pop');
    setTimeout(() => t.remove(), 230);
    floatAt(x, y, mult > 1 ? `+${mult}` : '+1');
    ripple(x, y);
    tone(660 + Math.min(hunt.combo, 20) * 30, .07, 'triangle', .09);
    if (hunt.combo % 10 === 0) { tone(1318, .12, 'triangle', .06, .05); buzz(15); }
    paintCombo();
    spawnTarget();
  }

  function huntFinish() {
    state = 'done';
    newBadges = [];
    lockUntil = performance.now() + 900;
    cancelAnimationFrame(raf);
    const h = hunt;
    clearHunt();
    timerBar.style.transform = 'scaleX(1)';
    const tries = h.hits + h.miss + h.faded;
    const acc = tries ? h.hits / tries : 0;
    const avg = h.rts.length ? h.rts.reduce((a, b) => a + b, 0) / h.rts.length : 0;
    const before = Curio.getBest(key());
    const b = Curio.best(key(), h.score);
    const r = rate(h.hits / data.huntDur, HUNT_RATINGS);
    pad.className = 'cs-pad is-hunt is-done';
    $('combo').hidden = true;
    big.textContent = h.score;
    small.textContent = `points · ${h.hits} hits · ${Math.round(acc * 100)}% accuracy`;
    award('first');
    if (h.hits >= 30) award('hunt30');
    if (h.hits >= 20 && acc >= 0.95) award('acc95');
    if (h.best >= 20) award('combo20');
    if (data.clicks >= 10000) award('clicks10k');
    showResult(r, HUNT_RATINGS, 0, [[h.score, 'Points'], [h.hits, 'Hits'], [`${Math.round(acc * 100)}%`, 'Accuracy'], [avg ? `${Math.round(avg)}ms` : '-', 'Avg reaction'], [h.best, 'Best combo'], [b.best, 'Best here']], b.isNew && before != null, h.score);
  }

  function paintBests() {
    const el = $('bests');
    el.innerHTML = '';
    OPTS[mode].forEach((d) => {
      const k = mode === 'cps' ? `${input}-${d}` : mode === 'race' ? `race-${input}-${d}` : `hunt-${data.size}-${d}`;
      const v = Curio.getBest(k);
      const div = document.createElement('div');
      if (d === dur()) div.className = 'is-cur';
      const b = document.createElement('b'); b.textContent = v == null ? '-' : mode === 'hunt' ? v : mode === 'race' ? `${v.toFixed(2)}s` : v.toFixed(2);
      const s = document.createElement('span'); s.textContent = mode === 'race' ? `${d} clicks` : `${d}s ${mode === 'hunt' ? data.size : input}`;
      div.append(b, s); el.append(div);
    });
  }

  function paintPanels() {
    const got = BADGES.filter((b) => data.badges[b[0]]).length;
    $('badgeCount').textContent = `${got}/${BADGES.length}`;
    $('badgeList').innerHTML = '';
    BADGES.forEach(([id, ico, name, desc]) => {
      const d = document.createElement('div'); d.className = 'cs-badge' + (data.badges[id] ? ' is-got' : '');
      const i = document.createElement('i'); i.textContent = ico;
      const t = document.createElement('div'); const b = document.createElement('b'); b.textContent = name; const s = document.createElement('span'); s.textContent = desc;
      t.append(b, s); d.append(i, t); $('badgeList').append(d);
    });
    const hist = data.history.filter((h) => h.k === key()).slice(-12);
    const el = $('hist'); el.innerHTML = '';
    const max = Math.max(1, ...hist.map((h) => h.v));
    hist.forEach((h) => {
      const d = document.createElement('div');
      d.style.height = `${Math.max(4, h.v / max * 100)}%`;
      const s = document.createElement('span'); s.textContent = mode === 'race' ? `${h.v}s` : h.v;
      d.append(s); el.append(d);
    });
    $('histLabel').textContent = hist.length ? `Your last ${hist.length} runs on this setting. ${Curio.fmt(data.clicks)} clicks all time.` : 'No runs on this setting yet. Go make some history.';
  }

  function share() {
    const r = $('rating').textContent;
    const line = mode === 'cps' ? `${big.textContent} CPS over ${data.cpsDur}s (${input})` : mode === 'race' ? `${data.raceN} clicks in ${big.textContent}` : `${big.textContent} points in a ${data.huntDur}s ${data.size} target hunt`;
    const t = `Curio Click Speed ${$('rAnimal').textContent}\n${line}\n${r}`;
    navigator.clipboard?.writeText(t).then(() => Curio.toast('Result copied!'), () => Curio.toast(line));
  }

  pad.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    const r = pad.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const stamp = e.timeStamp || performance.now();
    if (mode === 'hunt') {
      if (state === 'run' && hunt) {
        let t = e.target.closest('.cs-target');
        if (!t && hunt.cur && hunt.last) {
          const R = SIZES[data.size].px / 2;
          if (Math.hypot(x - hunt.last[0], y - hunt.last[1]) < R * 1.45) t = hunt.cur;
        }
        if (t && t === hunt.cur) huntHit(t, x, y);
        else { hunt.miss++; hunt.combo = 0; paintCombo(); tone(180, .06, 'square', .04); floatAt(x, y, '✕'); }
        return;
      }
      if (state === 'done' && stamp < lockUntil) return;
      huntStart(stamp);
      return;
    }
    if (input !== 'click') { Curio.toast(input === 'space' ? 'Spacebar mode! Press Space, or switch to Click.' : 'Z + X mode! Alternate the Z and X keys.'); return; }
    hit(stamp, x, y);
  });
  pad.addEventListener('contextmenu', (e) => { if (state === 'run') e.preventDefault(); });
  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === 'r' && !e.repeat && input !== 'zx') { $('results').hidden = true; idle(); return; }
    if (mode === 'hunt') return;
    const r = pad.getBoundingClientRect();
    const rx = () => r.width * (0.2 + Math.random() * 0.6), ry = () => r.height * (0.2 + Math.random() * 0.6);
    if (e.code === 'Space' || e.key === ' ') {
      if (input !== 'space') { if (e.target === pad) e.preventDefault(); return; }
      e.preventDefault();
      if (e.repeat) return;
      hit(e.timeStamp || performance.now(), rx(), ry());
    } else if (input === 'zx' && (k === 'z' || k === 'x')) {
      e.preventDefault();
      if (e.repeat || k === lastKey) return;
      lastKey = k;
      hit(e.timeStamp || performance.now(), k === 'z' ? r.width * 0.3 : r.width * 0.7, ry());
    }
  });
  document.addEventListener('keyup', (e) => { if (e.code === 'Space' && input === 'space') e.preventDefault(); });
  $('tabs').addEventListener('click', (e) => {
    const b = e.target.closest('.cs-tab'); if (!b || state === 'run') return;
    mode = b.dataset.mode; data.mode = mode; save(); paintModes(); $('results').hidden = true; idle(); paintPanels();
    tone(620, .05, 'triangle', .05);
  });
  $('durs').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b || state === 'run') return;
    const v = +b.dataset.d;
    if (mode === 'cps') data.cpsDur = v; else if (mode === 'race') data.raceN = v; else data.huntDur = v;
    save(); paintModes(); $('results').hidden = true; idle(); paintPanels(); b.blur();
  });
  $('inputs').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b || state === 'run') return;
    input = b.dataset.i; data.input = input; lastKey = ''; save(); paintModes(); $('results').hidden = true; idle(); paintPanels(); b.blur();
  });
  $('sizes').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b || state === 'run') return;
    data.size = b.dataset.s; save(); paintModes(); $('results').hidden = true; idle(); paintPanels(); b.blur();
  });
  $('again').addEventListener('click', () => { $('results').hidden = true; idle(); pad.focus({ preventScroll: true }); pad.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
  $('share').addEventListener('click', share);
  document.querySelector('.cs-ptabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]'); if (!b) return;
    document.querySelectorAll('.cs-ptabs [data-tab]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    document.querySelectorAll('[data-pane]').forEach((p) => { p.hidden = p.dataset.pane !== b.dataset.tab; });
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state === 'run') { idle(); Curio.toast('Run cancelled, you looked away'); }
  });
  window.addEventListener('resize', () => { if (state !== 'run') drawGraph(state === 'done' ? gDur : 0); });
  window.addEventListener('curio:theme', () => { if (state !== 'run') drawGraph(state === 'done' ? gDur : 0); });

  paintModes();
  idle();
  paintPanels();
  window.__cs = { get state() { return state; } };
})();
