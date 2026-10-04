(() => {
  const ROUNDS = 10;
  const $ = (id) => document.getElementById(id);
  const cv = $('cv'), g = cv.getContext('2d');
  const num = $('num'), range = $('range'), go = $('go'), fb = $('fb');
  const MODES = { guess: '👀 Guess', draw: '✏️ Draw', clock: '🕰️ Clock', daily: '📅 Daily' };
  const DIFFS = { easy: { k: 2, name: 'Easy' }, normal: { k: 3, name: 'Normal' }, expert: { k: 4, name: 'Expert' } };
  const BADGES = [
    ['first', '🎬', 'First Ten', 'Finish a game'],
    ['bull', '🎯', 'Bullseye', 'Nail an angle exactly'],
    ['streak5', '✨', 'Steady Hand', '5 rounds in a row within 5°'],
    ['all10', '🏛️', 'Architect', 'Every round within 10° in one game'],
    ['s900', '📐', 'Human Protractor', 'Score 900+ in one game'],
    ['expert800', '🧠', 'Expert Eye', 'Score 800+ on Expert'],
    ['draw900', '✏️', 'Draftsman', 'Score 900+ in Draw'],
    ['clock900', '🕰️', 'Clockmaker', 'Score 900+ in Clock'],
    ['reflex', '🔄', 'Reflex Master', 'Within 3° on an angle over 180°'],
    ['daily', '📅', 'Daily Habit', 'Play a daily challenge'],
    ['bulls10', '🏹', 'Robin Hood', '10 bullseyes all time'],
    ['games25', '🎮', 'Regular', 'Play 25 games']
  ];
  const fresh = () => ({ v: 2, mode: Curio.store.get('ga-mode', 'guess'), diff: 'normal', games: 0, rounds: 0, totalErr: 0, bulls: 0, history: [], badges: {}, daily: {} });
  function load() {
    const d = Curio.store.get('ga:data', null);
    const f = d && typeof d === 'object' && d.v === 2 ? Object.assign(fresh(), d) : fresh();
    if (!MODES[f.mode]) f.mode = 'guess';
    if (!DIFFS[f.diff]) f.diff = 'normal';
    if (!Array.isArray(f.history)) f.history = [];
    return f;
  }
  const data = load();
  const save = () => Curio.store.set('ga:data', data);
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const hash = (s) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const mulberry = (seed) => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  function tone(f, d = 0.12, type = 'sine', vol = 0.12, when = 0, slide = 0) {
    if (Curio.muted) return;
    const ac = Curio.audioContext(); if (!ac) return;
    const t = ac.currentTime + when;
    const o = ac.createOscillator(), gn = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
    gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(vol, t + 0.006); gn.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(gn).connect(ac.destination); o.start(t); o.stop(t + d + 0.03);
  }
  const buzz = (ms) => { try { navigator.vibrate?.(ms); } catch {} };

  let mode = data.mode, diff = data.diff;
  let round = 0, results = [], phase = 'ask', cur = null, drawn = null, anim = null, raf = 0, rnd = Math.random, newBadges = [], lastTick = 0;
  const effDiff = () => mode === 'daily' ? 'normal' : diff;
  const bestKey = () => mode === 'daily' ? `daily-${today()}` : (diff === 'normal' && (mode === 'guess' || mode === 'draw') ? mode : `${mode}-${diff}`);
  const pointsFor = (err) => Math.max(0, Math.round(100 - err * DIFFS[effDiff()].k));
  const rad = (d) => d * Math.PI / 180;
  const norm = (d) => ((d % 360) + 360) % 360;
  const ri = (a, b) => Math.floor(a + rnd() * (b - a + 1));
  const maxFor = (rd) => rd.kind === 'clock' ? 180 : 360;

  function pal() {
    const dark = Curio.isDark();
    return dark
      ? { paper: '#132640', grid: 'rgba(150, 200, 255, .10)', bold: 'rgba(150, 200, 255, .22)', ink: '#e9f1fb', ink3: '#9fb4cc', accent: '#ff7a59', good: '#3ddc84', bad: '#ff6b6b', glass: 'rgba(120, 190, 255, .14)', face: '#1d3557', rim: '#c9a227', pill: 'rgba(10, 20, 35, .8)' }
      : { paper: '#fffdf6', grid: 'rgba(70, 130, 200, .12)', bold: 'rgba(70, 130, 200, .24)', ink: '#26303b', ink3: '#6b7785', accent: '#ff5a36', good: '#16995a', bad: '#d64545', glass: 'rgba(90, 160, 230, .12)', face: '#fffaf0', rim: '#b8860b', pill: 'rgba(255, 255, 255, .9)' };
  }

  function size() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    const W = cv.clientWidth;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(W * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    return W;
  }

  function paper(W, c) {
    g.fillStyle = c.paper; g.fillRect(0, 0, W, W);
    const step = W / 16;
    for (let i = 1; i < 16; i++) {
      g.strokeStyle = i % 4 === 0 ? c.bold : c.grid; g.lineWidth = i % 4 === 0 ? 1.2 : 1;
      g.beginPath(); g.moveTo(i * step, 0); g.lineTo(i * step, W); g.stroke();
      g.beginPath(); g.moveTo(0, i * step); g.lineTo(W, i * step); g.stroke();
    }
  }

  function ray(cx, cy, R, deg, color, width, dash) {
    g.save();
    g.strokeStyle = color; g.lineWidth = width; g.lineCap = 'round';
    g.shadowColor = 'rgba(0, 0, 0, .25)'; g.shadowBlur = 4; g.shadowOffsetY = 2;
    if (dash) g.setLineDash(dash);
    const ex = cx + R * Math.cos(rad(deg)), ey = cy - R * Math.sin(rad(deg));
    g.beginPath(); g.moveTo(cx, cy); g.lineTo(ex, ey); g.stroke();
    if (!dash) { g.fillStyle = color; g.beginPath(); g.arc(ex, ey, width * .9, 0, 7); g.fill(); }
    g.restore();
  }
  function wedge(cx, cy, r, from, sweep, color, alpha = .3) {
    g.save();
    const gr = g.createRadialGradient(cx, cy, 0, cx, cy, r);
    gr.addColorStop(0, color); gr.addColorStop(1, color);
    g.globalAlpha = alpha; g.fillStyle = gr;
    g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, r, -rad(from), -rad(from + sweep), true); g.closePath(); g.fill();
    g.globalAlpha = 1; g.strokeStyle = color; g.lineWidth = 2.5;
    g.beginPath(); g.arc(cx, cy, r, -rad(from), -rad(from + sweep), true); g.stroke();
    g.restore();
  }
  function arcLine(cx, cy, r, from, sweep, color, w, alpha) {
    g.save(); g.globalAlpha = alpha; g.strokeStyle = color; g.lineWidth = w; g.lineCap = 'round';
    g.beginPath(); g.arc(cx, cy, r, -rad(from), -rad(from + sweep), sweep > 0); g.stroke(); g.restore();
  }
  function pivot(cx, cy, r) {
    const gr = g.createRadialGradient(cx - r * .3, cy - r * .3, 1, cx, cy, r);
    gr.addColorStop(0, '#fff3c4'); gr.addColorStop(.5, '#d4a017'); gr.addColorStop(1, '#7a5a06');
    g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.arc(cx, cy, r * .3, 0, 7); g.fill();
  }
  function pill(x, y, text, color, c, fs) {
    g.font = `900 ${fs}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    const w = g.measureText(text).width + fs * .8, h = fs * 1.4;
    g.fillStyle = c.pill; g.beginPath(); g.roundRect ? g.roundRect(x - w / 2, y - h / 2, w, h, h / 2) : g.rect(x - w / 2, y - h / 2, w, h); g.fill();
    g.fillStyle = color; g.fillText(text, x, y + 1);
  }
  function protractor(cx, cy, R, base, alpha, c) {
    g.save();
    g.globalAlpha = alpha;
    g.fillStyle = c.glass;
    g.beginPath(); g.arc(cx, cy, R * 1.06, 0, Math.PI * 2); g.arc(cx, cy, R * .76, 0, Math.PI * 2, true); g.fill();
    g.strokeStyle = c.ink3; g.fillStyle = c.ink3;
    g.font = `800 ${Math.max(9, R * .06)}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let d = 0; d < 360; d += 5) {
      const a = rad(base + d);
      const len = d % 30 === 0 ? R * .13 : d % 10 === 0 ? R * .085 : R * .045;
      g.lineWidth = d % 30 === 0 ? 2 : 1;
      g.beginPath();
      g.moveTo(cx + R * 1.06 * Math.cos(a), cy - R * 1.06 * Math.sin(a));
      g.lineTo(cx + (R * 1.06 - len) * Math.cos(a), cy - (R * 1.06 - len) * Math.sin(a));
      g.stroke();
      if (d % 30 === 0) g.fillText(String(d), cx + R * .85 * Math.cos(a), cy - R * .85 * Math.sin(a));
    }
    g.restore();
  }

  function clockAngles(rd) {
    const hourCD = 30 * (rd.h % 12) + 0.5 * rd.m, minCD = 6 * rd.m;
    const a1 = 90 - hourCD, a2 = 90 - minCD;
    const s = norm(a2 - a1);
    return { a1, a2, from: s <= 180 ? a1 : a2, sweep: s <= 180 ? s : 360 - s };
  }

  function drawClock(W, c, p) {
    const cx = W / 2, cy = W / 2, R = W * .4;
    g.save();
    g.shadowColor = 'rgba(0,0,0,.3)'; g.shadowBlur = 14; g.shadowOffsetY = 4;
    g.fillStyle = c.rim; g.beginPath(); g.arc(cx, cy, R * 1.12, 0, 7); g.fill();
    g.restore();
    const fg = g.createRadialGradient(cx - R * .3, cy - R * .3, R * .1, cx, cy, R * 1.05);
    fg.addColorStop(0, c.face); fg.addColorStop(1, Curio.isDark() ? '#142a47' : '#f1e6cf');
    g.fillStyle = fg; g.beginPath(); g.arc(cx, cy, R * 1.04, 0, 7); g.fill();
    g.strokeStyle = c.ink; g.fillStyle = c.ink;
    for (let i = 0; i < 60; i++) {
      const a = rad(90 - i * 6), big = i % 5 === 0;
      g.lineWidth = big ? 3 : 1.2;
      g.beginPath(); g.moveTo(cx + R * Math.cos(a), cy - R * Math.sin(a)); g.lineTo(cx + R * (big ? .88 : .94) * Math.cos(a), cy - R * (big ? .88 : .94) * Math.sin(a)); g.stroke();
    }
    g.font = `800 ${R * .14}px Georgia, serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 1; i <= 12; i++) { const a = rad(90 - i * 30); g.fillText(String(i), cx + R * .74 * Math.cos(a), cy - R * .74 * Math.sin(a)); }
    const ca = clockAngles(cur);
    wedge(cx, cy, R * .3, ca.from, ca.sweep, c.accent, .3);
    g.save(); g.lineCap = 'round'; g.shadowColor = 'rgba(0,0,0,.3)'; g.shadowBlur = 5; g.shadowOffsetY = 2;
    g.strokeStyle = c.ink; g.lineWidth = 8; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + R * .5 * Math.cos(rad(ca.a1)), cy - R * .5 * Math.sin(rad(ca.a1))); g.stroke();
    g.lineWidth = 5; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + R * .82 * Math.cos(rad(ca.a2)), cy - R * .82 * Math.sin(rad(ca.a2))); g.stroke();
    g.restore();
    if (phase !== 'ask') {
      const e = 1 - Math.pow(1 - p, 3);
      arcLine(cx, cy, R * .45, ca.from, ca.sweep * e, c.good, 5, 1);
      const mid = rad(ca.from + ca.sweep * e / 2);
      pill(cx + R * .45 * Math.cos(mid), cy - R * .45 * Math.sin(mid), `${fmtDeg(ca.sweep * e)}°`, c.good, c, Math.max(14, W * .045));
    }
    pivot(cx, cy, 9);
  }

  const fmtDeg = (v) => Number.isInteger(Math.round(v * 2) / 2) ? String(Math.round(v)) : (Math.round(v * 2) / 2).toFixed(1);

  function draw(now) {
    const W = size(), c = pal();
    paper(W, c);
    let p = 1;
    if (anim) p = Math.min(1, (now - anim.t) / 1200);
    if (cur.kind === 'clock') drawClock(W, c, p);
    else {
      const cx = W / 2, cy = W / 2, R = W * .42;
      const ease = 1 - Math.pow(1 - p, 3);
      const base = cur.base;
      const shown = cur.kind === 'guess' ? cur.target : drawn;
      if (phase !== 'ask') protractor(cx, cy, R, base, Math.min(1, p * 2.5), c);
      if (shown != null && !(cur.kind === 'guess' && effDiff() === 'expert' && phase === 'ask')) wedge(cx, cy, R * .3, base, shown, c.accent, .28);
      if (phase !== 'ask') {
        const sw = cur.target * ease;
        if (anim.answer != null) {
          const d = cur.target - anim.answer;
          if (p >= 1 && Math.abs(d) > 0.5) arcLine(cx, cy, R * .9, base + anim.answer, d, c.bad, 8, .45);
        }
        wedge(cx, cy, R * .62, base, sw, c.good, .12);
        ray(cx, cy, R * 1.04, base + sw, c.good, 4, cur.kind === 'guess' ? [2, 8] : null);
        if (cur.kind === 'guess') ray(cx, cy, R * .98, base + Math.min(anim.answer, 360), c.accent, 3, [9, 7]);
        const mid = rad(base + sw / 2);
        pill(cx + R * .47 * Math.cos(mid), cy - R * .47 * Math.sin(mid), `${Math.round(sw)}°`, c.good, c, Math.max(15, W * .05));
      }
      ray(cx, cy, R * cur.l1, base, c.ink, 6);
      if (shown != null) ray(cx, cy, R * cur.l2, base + shown, cur.kind === 'draw' && phase === 'ask' ? c.accent : c.ink, 6);
      if (cur.kind === 'draw' && phase === 'ask' && drawn == null) {
        g.fillStyle = c.ink3; g.font = `800 ${Math.max(13, W * .038)}px system-ui, sans-serif`; g.textAlign = 'center';
        const a = rad(base + 180);
        g.fillText('drag around the pivot', cx + R * .5 * Math.cos(a), cy - R * .5 * Math.sin(a) + 30);
      }
      pivot(cx, cy, 10);
    }
    if (anim && p < 1) raf = requestAnimationFrame(draw);
    else if (anim && p >= 1 && !anim.done) { anim.done = true; anim.cb && anim.cb(); }
  }
  const redraw = () => { cancelAnimationFrame(raf); if (cur) draw(performance.now()); };

  function pickRound(i) {
    const d = effDiff();
    const kind = mode === 'daily' ? ['guess', 'draw', 'clock'][Math.floor(rnd() * 3)] : mode;
    if (kind === 'clock') {
      let h, m, a;
      do {
        h = ri(1, 12);
        m = d === 'easy' ? ri(0, 3) * 15 : d === 'normal' ? ri(0, 11) * 5 : ri(0, 59);
        const ang = Math.abs(30 * (h % 12) - 5.5 * m);
        a = ang > 180 ? 360 - ang : ang;
      } while (a < 5 || results.some((r) => Math.abs(r.target - a) < 2));
      return { kind, h, m, target: a, base: 0, l1: 1, l2: 1 };
    }
    const hi = d === 'easy' ? 175 : d === 'normal' ? (i < 5 ? 175 : 355) : 359;
    let t;
    do { t = ri(d === 'easy' ? 10 : 4, hi); } while (results.some((r) => Math.abs(r.target - t) < 4));
    const base = d === 'easy' ? ri(0, 3) * 90 + ri(-10, 10) : ri(0, 359);
    const l1 = d === 'expert' ? 0.55 + rnd() * 0.45 : 1, l2 = d === 'expert' ? 0.55 + rnd() * 0.45 : 1;
    return { kind, target: t, base, l1, l2 };
  }

  function paintSide() {
    $('round').textContent = `${Math.min(round + 1, ROUNDS)}/${ROUNDS}`;
    $('score').textContent = results.reduce((s, r) => s + r.pts, 0);
    const b = Curio.getBest(bestKey());
    $('best').textContent = b == null ? '-' : b;
    $('pips').innerHTML = Array.from({ length: ROUNDS }, (_, i) => {
      const r = results[i];
      const cls = r ? (r.pts >= 80 ? 'is-g' : r.pts >= 50 ? 'is-m' : 'is-b') : i === round ? 'is-cur' : '';
      return `<span class="${cls}"></span>`;
    }).join('');
    document.querySelectorAll('#modes button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.m === mode)));
    document.querySelectorAll('#diffs button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.d === diff)));
    $('diffs').style.opacity = mode === 'daily' ? .45 : 1;
    if (!cur) return;
    $('guessUi').hidden = cur.kind === 'draw';
    $('drawHint').hidden = cur.kind !== 'draw';
    cv.classList.toggle('is-draw', cur.kind === 'draw');
    $('kind').textContent = { guess: '👀 Guess', draw: '✏️ Draw', clock: '🕰️ Clock' }[cur.kind] + ` · ${DIFFS[effDiff()].name}`;
  }

  function setGuess(v, from) {
    const max = maxFor(cur);
    v = Math.max(0, Math.min(max, Math.round(v)));
    if (from !== 'num') num.value = v;
    if (from !== 'range') range.value = v;
    if (Math.abs(v - lastTick) >= 5) { lastTick = v; tone(1400, .012, 'square', .015); }
  }

  function ask() {
    phase = 'ask'; anim = null;
    cur = pickRound(round);
    drawn = null;
    fb.innerHTML = '';
    go.textContent = 'Lock it in';
    go.disabled = cur.kind === 'draw';
    const max = maxFor(cur);
    num.max = max; range.max = max;
    setGuess(cur.kind === 'clock' ? 90 : 90);
    if (cur.kind === 'guess') {
      $('question').innerHTML = effDiff() === 'expert' ? 'How big is the angle between the rays?' : 'How big is the shaded angle?';
      cv.setAttribute('aria-label', 'An angle made of two rays from a pivot. Estimate it in degrees.');
    } else if (cur.kind === 'draw') {
      $('question').innerHTML = `Draw an angle of <b>${cur.target}°</b>`;
      cv.setAttribute('aria-label', `Drag to draw an angle of ${cur.target} degrees. Arrow keys nudge the ray.`);
    } else {
      $('question').innerHTML = `It is <b>${cur.h}:${String(cur.m).padStart(2, '0')}</b>. What is the angle between the hands?`;
      cv.setAttribute('aria-label', `A clock showing ${cur.h}:${String(cur.m).padStart(2, '0')}. Estimate the smaller angle between the hands.`);
    }
    paintSide();
    redraw();
  }

  function submit() {
    if (phase === 'reveal') { if (anim && anim.done) next(); return; }
    if (phase !== 'ask') return;
    let answer;
    if (cur.kind !== 'draw') {
      answer = Math.round(+num.value);
      if (!Number.isFinite(answer) || num.value === '') { Curio.toast('Type a number of degrees first'); num.focus(); return; }
      answer = Math.max(0, Math.min(maxFor(cur), answer));
    } else {
      if (drawn == null) { Curio.toast('Drag around the pivot first'); return; }
      answer = Math.round(drawn);
    }
    const err = Math.round(Math.abs(answer - cur.target) * 2) / 2;
    const pts = pointsFor(err);
    results.push({ kind: cur.kind, target: cur.target, answer, err, pts, label: cur.kind === 'clock' ? `${cur.h}:${String(cur.m).padStart(2, '0')}` : '' });
    phase = 'reveal';
    go.textContent = round + 1 >= ROUNDS ? 'See results' : 'Next angle';
    go.disabled = true;
    fb.innerHTML = '';
    tone(260, 1.1, 'sine', .04, 0, Math.min(900, cur.target * 3));
    anim = { t: performance.now(), answer, cb: () => {
      const cls = pts >= 80 ? '' : pts >= 50 ? ' is-meh' : ' is-bad';
      const quip = err === 0 ? 'Bullseye! Are you a protractor?' : err <= 3 ? 'Ridiculously close.' : err <= 8 ? 'Very nice eye.' : err <= 15 ? 'Not bad at all.' : err <= 30 ? 'In the neighbourhood.' : 'Wildly creative.';
      const verbWord = cur.kind === 'draw' ? 'drew' : 'said';
      fb.innerHTML = `<span class="ga-pts${cls}">+${pts}</span>It was ${fmtDeg(cur.target)}°, you ${verbWord} ${answer}°. Off by ${fmtDeg(err)}°. ${quip}`;
      if (cur.kind === 'clock') fb.innerHTML += `<br><span class="c-muted" style="font-weight:700;font-size:13px">Hour hand at ${fmtDeg(30 * (cur.h % 12) + .5 * cur.m)}°, minute hand at ${6 * cur.m}°.</span>`;
      go.disabled = false;
      go.focus({ preventScroll: true });
      if (err === 0) { Curio.confetti(60); buzz([20, 40, 20]); }
      if (pts >= 80) { tone(784, .1, 'triangle', .09); tone(1046, .14, 'triangle', .09, .08); }
      else if (pts >= 50) tone(620, .12, 'triangle', .09);
      else { tone(200, .2, 'sawtooth', .05, 0, -60); $('board').classList.remove('is-shake'); void $('board').offsetWidth; $('board').classList.add('is-shake'); buzz(60); }
    } };
    paintSide();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(draw);
  }

  function next() {
    round++;
    if (round >= ROUNDS) return finish();
    ask();
    if (innerWidth < 760) $('board').scrollIntoView({ block: 'start', behavior: 'smooth' });
    if (cur.kind !== 'draw' && matchMedia('(pointer: fine)').matches) num.focus({ preventScroll: true });
  }

  function award(id) {
    if (data.badges[id]) return;
    data.badges[id] = Date.now();
    const b = BADGES.find((x) => x[0] === id);
    if (b) newBadges.push(b);
  }

  function medal(total) {
    const tier = total >= 900 ? ['#9be7ff', '#2b8fc4', 'Diamond'] : total >= 750 ? ['#ffe08a', '#d29a00', 'Gold'] : total >= 550 ? ['#eef1f4', '#8f9aa6', 'Silver'] : ['#f3c79a', '#b86b2c', 'Bronze'];
    let ticks = '';
    for (let d = 0; d <= 180; d += 15) { const a = rad(180 - d); ticks += `<line x1="${60 + 44 * Math.cos(a)}" y1="${78 - 44 * Math.sin(a)}" x2="${60 + (d % 45 ? 39 : 35) * Math.cos(a)}" y2="${78 - (d % 45 ? 39 : 35) * Math.sin(a)}" stroke="rgba(0,0,0,.45)" stroke-width="${d % 45 ? 1.2 : 2}"/>`; }
    return `<defs><linearGradient id="mg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".3" stop-color="${tier[0]}"/><stop offset="1" stop-color="${tier[1]}"/></linearGradient></defs>
      <path d="M10 82 A50 50 0 0 1 110 82 Z" fill="${tier[1]}"/><path d="M14 78 A46 46 0 0 1 106 78 Z" fill="url(#mg)"/>${ticks}
      <line x1="60" y1="78" x2="${60 + 40 * Math.cos(rad(180 - total / 1000 * 180))}" y2="${78 - 40 * Math.sin(rad(180 - total / 1000 * 180))}" stroke="#ff5a36" stroke-width="4" stroke-linecap="round"/>
      <circle cx="60" cy="78" r="6" fill="#d4a017"/>
      <rect x="22" y="88" width="76" height="24" rx="12" fill="${tier[1]}"/><text x="60" y="105" text-anchor="middle" font-size="14" font-weight="900" fill="#fff" font-family="system-ui, sans-serif">${tier[2]}</text>`;
  }

  function finish() {
    phase = 'over';
    newBadges = [];
    const total = results.reduce((s, r) => s + r.pts, 0);
    const avg = results.reduce((s, r) => s + r.err, 0) / ROUNDS;
    const before = Curio.getBest(bestKey());
    const b = Curio.best(bestKey(), total);
    data.games++; data.rounds += ROUNDS; data.totalErr += results.reduce((s, r) => s + r.err, 0);
    data.bulls += results.filter((r) => r.err === 0).length;
    data.history.push({ m: mode, d: effDiff(), s: total, t: Date.now() });
    if (data.history.length > 150) data.history = data.history.slice(-150);
    let run = 0, bestRun = 0;
    results.forEach((r) => { run = r.err <= 5 ? run + 1 : 0; bestRun = Math.max(bestRun, run); });
    award('first');
    if (results.some((r) => r.err === 0)) award('bull');
    if (bestRun >= 5) award('streak5');
    if (results.every((r) => r.err <= 10)) award('all10');
    if (total >= 900) award('s900');
    if (effDiff() === 'expert' && total >= 800) award('expert800');
    if (mode === 'draw' && total >= 900) award('draw900');
    if (mode === 'clock' && total >= 900) award('clock900');
    if (results.some((r) => r.target > 180 && r.err <= 3)) award('reflex');
    if (mode === 'daily') { award('daily'); data.daily[today()] = Math.max(data.daily[today()] || 0, total); }
    if (data.bulls >= 10) award('bulls10');
    if (data.games >= 25) award('games25');
    save();
    paintSide();
    $('round').textContent = `${ROUNDS}/${ROUNDS}`;
    go.disabled = true;
    const rating = avg <= 3 ? 'Human protractor' : avg <= 6 ? 'Architect eyes' : avg <= 10 ? 'Carpenter approved' : avg <= 18 ? 'Pretty decent' : avg <= 30 ? 'Ballpark figures' : 'Abstract artist';
    const isPB = b.isNew && before != null;
    $('medal').innerHTML = medal(total);
    $('ovTitle').textContent = `${total} / ${ROUNDS * 100}`;
    $('ovText').textContent = `${rating}. Average error ${avg.toFixed(1)}°. ` + (isPB ? 'New personal best!' : `Best here: ${b.best}.`);
    $('squares').textContent = squares();
    $('rBadges').innerHTML = '';
    newBadges.forEach((bd, i) => { const s = document.createElement('span'); s.textContent = `${bd[1]} ${bd[2]}`; s.style.animationDelay = `${.3 + i * .15}s`; $('rBadges').append(s); });
    const maxE = Math.max(10, ...results.map((r) => r.err));
    $('bars').innerHTML = results.map((r, i) => `<div style="height:${Math.max(4, r.err / maxE * 100)}%;background:${r.pts >= 80 ? 'var(--good)' : r.pts >= 50 ? 'var(--warn)' : 'var(--bad)'};animation-delay:${i * 60}ms"><span>${fmtDeg(r.err)}°</span></div>`).join('');
    $('table').innerHTML = `<tr><th>#</th><th>Angle</th><th>You</th><th>Off by</th><th>Points</th></tr>` +
      results.map((r, i) => `<tr><td>${i + 1}${r.kind === 'clock' ? ' 🕰️' : r.kind === 'draw' ? ' ✏️' : ''}</td><td>${fmtDeg(r.target)}°${r.label ? ` <span class="c-muted">(${r.label})</span>` : ''}</td><td>${r.answer}°</td><td>${fmtDeg(r.err)}°</td><td><b>${r.pts}</b></td></tr>`).join('');
    const over = $('over');
    over.hidden = false; over.classList.remove('is-on'); void over.offsetWidth; over.classList.add('is-on');
    over.scrollIntoView({ behavior: 'smooth', block: 'start' });
    paintPanels();
    [523, 659, 784, 1046].forEach((f, j) => tone(f, .22, 'triangle', .07, j * .09));
    if (isPB || total >= 850 || newBadges.length) Curio.confetti();
  }

  const squares = () => results.map((r) => r.err <= 5 ? '🟩' : r.err <= 15 ? '🟨' : '🟥').join('');

  function newGame() {
    round = 0; results = [];
    rnd = mode === 'daily' ? mulberry(hash(`ga${today()}`)) : Math.random;
    $('over').hidden = true;
    ask();
  }

  function paintPanels() {
    const got = BADGES.filter((b) => data.badges[b[0]]).length;
    $('badgeCount').textContent = `${got}/${BADGES.length}`;
    $('badgeList').innerHTML = '';
    BADGES.forEach(([id, ico, name, desc]) => {
      const d = document.createElement('div'); d.className = 'ga-badge' + (data.badges[id] ? ' is-got' : '');
      const i = document.createElement('i'); i.textContent = ico;
      const t = document.createElement('div'); const b = document.createElement('b'); b.textContent = name; const s = document.createElement('span'); s.textContent = desc;
      t.append(b, s); d.append(i, t); $('badgeList').append(d);
    });
    const bestOf = (m) => Math.max(0, ...data.history.filter((h) => h.m === m).map((h) => h.s));
    const rows = [[data.games, 'Games'], [data.rounds ? (data.totalErr / data.rounds).toFixed(1) + '°' : '-', 'Avg error'], [data.bulls, 'Bullseyes'],
      [bestOf('guess') || '-', 'Best Guess'], [bestOf('draw') || '-', 'Best Draw'], [bestOf('clock') || '-', 'Best Clock'], [data.daily[today()] ?? '-', 'Today\'s daily']];
    $('statTbl').innerHTML = '';
    rows.forEach(([v, l]) => { const d = document.createElement('div'); const b = document.createElement('b'); b.textContent = v; const s = document.createElement('span'); s.textContent = l; d.append(b, s); $('statTbl').append(d); });
  }

  function pointerAngle(pt) {
    const r = cv.getBoundingClientRect();
    const x = pt.x - r.width / 2, y = r.height / 2 - pt.y;
    if (Math.hypot(x, y) < 6) return;
    let d = norm(Math.atan2(y, x) * 180 / Math.PI - cur.base);
    if (drawn != null && drawn > 300 && d < 60) d = 359.9;
    if (drawn != null && drawn < 60 && d > 300) d = 0.1;
    const nd = Math.max(0.1, Math.min(359.9, d));
    if (drawn == null || Math.floor(nd / 5) !== Math.floor(drawn / 5)) tone(1400, .012, 'square', .015);
    drawn = nd;
    go.disabled = false;
    redraw();
  }
  let dragging = false;
  const canDraw = () => cur && cur.kind === 'draw' && phase === 'ask';
  Curio.drag(cv, {
    start(pt) { if (!canDraw()) return; dragging = true; const prev = drawn; drawn = null; pointerAngle(pt); if (drawn == null) drawn = prev; },
    move(pt) { if (dragging && canDraw()) pointerAngle(pt); },
    end() { dragging = false; }
  });
  cv.addEventListener('pointerdown', (e) => { if (canDraw()) e.preventDefault(); });
  cv.tabIndex = 0;
  cv.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); return submit(); }
    if (!cur || cur.kind !== 'draw' || phase !== 'ask') return;
    const step = e.shiftKey ? 10 : 1;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') drawn = Math.min(359, (drawn ?? 90) + step);
    else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') drawn = Math.max(1, (drawn ?? 90) - step);
    else return;
    e.preventDefault(); go.disabled = false; redraw();
  });

  num.addEventListener('input', () => { if (num.value !== '') setGuess(+num.value, 'num'); });
  range.addEventListener('input', () => setGuess(+range.value, 'range'));
  $('minus').addEventListener('click', () => { if (phase === 'ask') setGuess((+num.value || 0) - 1); });
  $('plus').addEventListener('click', () => { if (phase === 'ask') setGuess((+num.value || 0) + 1); });
  num.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
  range.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && phase === 'reveal' && e.target === document.body) { e.preventDefault(); submit(); }
  });
  go.addEventListener('click', submit);
  $('again').addEventListener('click', () => { newGame(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  $('switch').addEventListener('click', () => {
    const order = ['guess', 'draw', 'clock', 'daily'];
    mode = order[(order.indexOf(mode) + 1) % order.length]; data.mode = mode; save(); newGame(); window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  $('share').addEventListener('click', () => {
    const total = results.reduce((s, r) => s + r.pts, 0);
    const head = mode === 'daily' ? `Curio Guess the Angle, daily ${today()}` : `Curio Guess the Angle, ${MODES[mode]} (${DIFFS[diff].name})`;
    const t = `${head}\n📐 ${total}/1000\n${squares()}`;
    navigator.clipboard?.writeText(t).then(() => Curio.toast('Result copied!'), () => Curio.toast(`${total}/1000`));
  });
  $('modes').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b || b.dataset.m === mode) return;
    mode = b.dataset.m; data.mode = mode; save(); newGame();
  });
  $('diffs').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b || b.dataset.d === diff || mode === 'daily') return;
    diff = b.dataset.d; data.diff = diff; save(); newGame();
  });
  document.querySelector('.ga-tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]'); if (!b) return;
    document.querySelectorAll('.ga-tabs [data-tab]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    document.querySelectorAll('[data-pane]').forEach((p) => { p.hidden = p.dataset.pane !== b.dataset.tab; });
  });
  window.addEventListener('resize', redraw);
  window.addEventListener('curio:theme', redraw);
  newGame();
  paintPanels();
  if (!Curio.store.get('ga:tip', false) && matchMedia('(pointer: fine)').matches) { Curio.store.set('ga:tip', true); setTimeout(() => Curio.toast('Tip: on a touchpad, turn on Touchpad mode in the top bar for Draw mode', 3200), 900); }
  window.__ga = { get cur() { return cur; }, get phase() { return phase; }, get anim() { return anim; } };
})();
