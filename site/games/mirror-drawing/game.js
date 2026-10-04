(() => {
  const spinA = () => (performance.now() / 1000) * .35;
  const rotP = (p, a) => ({ x: 50 + (p.x - 50) * Math.cos(a) - (p.y - 50) * Math.sin(a), y: 50 + (p.x - 50) * Math.sin(a) + (p.y - 50) * Math.cos(a) });
  const MODES = [
    { id: 'lr', name: 'Mirror', sym: '↔', desc: 'Left and right are swapped. Up is still up.', map: (p) => ({ x: 100 - p.x, y: p.y }), inv: (p) => ({ x: 100 - p.x, y: p.y }) },
    { id: 'ud', name: 'Upside down', sym: '↕', desc: 'Up and down are swapped. Left is still left.', map: (p) => ({ x: p.x, y: 100 - p.y }), inv: (p) => ({ x: p.x, y: 100 - p.y }) },
    { id: 'both', name: 'Both', sym: '↔↕', desc: 'Everything is flipped. Good luck.', map: (p) => ({ x: 100 - p.x, y: 100 - p.y }), inv: (p) => ({ x: 100 - p.x, y: 100 - p.y }) },
    { id: 'rot', name: 'Rotated', sym: '↻ 90°', desc: 'A quarter turn: move right and the pen goes down.', map: (p) => ({ x: 100 - p.y, y: p.x }), inv: (p) => ({ x: p.y, y: 100 - p.x }) },
    { id: 'swap', name: 'Diagonal', sym: '⤡', desc: 'The mirror is diagonal: right means down, up means left.', map: (p) => ({ x: p.y, y: p.x }), inv: (p) => ({ x: p.y, y: p.x }) },
    { id: 'spin', name: 'Spinning', sym: '🌀', desc: 'Your controls slowly rotate. Even standing still, the pen drifts.', map: (p) => rotP(p, spinA()), inv: (p) => rotP(p, -spinA()), live: true }
  ];
  const f = (n) => Math.round(n * 10) / 10;
  const star = (n, ro, ri) => { let d = ''; for (let i = 0; i < n * 2; i++) { const r = i % 2 ? ri : ro; const a = -Math.PI / 2 + (i / (n * 2)) * Math.PI * 2; d += (i ? ' L' : 'M') + f(50 + r * Math.cos(a)) + ' ' + f(52 + r * Math.sin(a)); } return d + ' Z'; };
  const SHAPES = [
    { id: 'star', name: 'Classic star', d: star(6, 40, 21), closed: true },
    { id: 'square', name: 'Square', d: 'M18 18 L82 18 L82 82 L18 82 Z', closed: true },
    { id: 'tri', name: 'Triangle', d: 'M50 14 L88 82 L12 82 Z', closed: true },
    { id: 'circle', name: 'Circle', d: 'M86 50 A36 36 0 1 1 14 50 A36 36 0 1 1 86 50 Z', closed: true },
    { id: 'heart', name: 'Heart', d: 'M50 84 C24 66 10 52 12 34 C14 18 36 12 50 30 C64 12 86 18 88 34 C90 52 76 66 50 84 Z', closed: true },
    { id: 'zig', name: 'Zigzag', d: 'M12 24 L32 76 L50 24 L68 76 L88 24', closed: false },
    { id: 'pent', name: 'Pentagon', d: (() => { let d = ''; for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i / 5 * Math.PI * 2; d += (i ? ' L' : 'M') + f(50 + 38 * Math.cos(a)) + ' ' + f(53 + 38 * Math.sin(a)); } return d + ' Z'; })(), closed: true },
    { id: 'diamond', name: 'Diamond', d: 'M50 10 L86 50 L50 90 L14 50 Z', closed: true },
    { id: 'plus', name: 'Plus', d: 'M40 14 L60 14 L60 40 L86 40 L86 60 L60 60 L60 86 L40 86 L40 60 L14 60 L14 40 L40 40 Z', closed: true },
    { id: 'arrow', name: 'Arrow', d: 'M12 42 L56 42 L56 22 L88 50 L56 78 L56 58 L12 58 Z', closed: true },
    { id: 'house', name: 'House', d: 'M18 86 L18 44 L50 16 L82 44 L82 86 Z', closed: true },
    { id: 'bolt', name: 'Lightning', d: 'M58 10 L26 54 L46 54 L38 90 L76 42 L54 42 L64 10 Z', closed: true },
    { id: 'moon', name: 'Moon', d: 'M60 14 A38 38 0 1 0 60 86 A40 40 0 0 1 60 14 Z', closed: true },
    { id: 'cloud', name: 'Cloud', d: 'M26 70 C12 70 10 52 22 48 C20 34 36 28 44 36 C48 22 70 22 72 38 C86 36 92 54 82 62 C84 70 78 72 72 70 Z', closed: true },
    { id: 'infinity', name: 'Infinity', d: (() => { let d = ''; for (let i = 0; i <= 160; i++) { const t = i / 160 * Math.PI * 2, k = 1 + Math.sin(t) ** 2; d += (i ? ' L' : 'M') + f(50 + 38 * Math.cos(t) / k) + ' ' + f(50 + 38 * Math.sin(t) * Math.cos(t) / k); } return d + ' Z'; })(), closed: true },
    { id: 'wave', name: 'Wave', d: (() => { let d = ''; for (let i = 0; i <= 100; i++) { const t = i / 100; d += (i ? ' L' : 'M') + f(12 + t * 76) + ' ' + f(50 + 22 * Math.sin(t * Math.PI * 3)); } return d; })(), closed: false },
    { id: 'S', name: 'Letter S', d: 'M74 24 C66 10 34 10 30 28 C26 46 72 48 72 68 C72 88 36 92 26 76', closed: false },
    { id: 'M', name: 'Letter M', d: 'M16 84 L16 16 L50 60 L84 16 L84 84', closed: false },
    { id: 'clover', name: 'Clover', d: (() => { let d = ''; for (let i = 0; i <= 200; i++) { const t = i / 200 * Math.PI * 2, r = 22 + 18 * Math.abs(Math.cos(2 * t)); d += (i ? ' L' : 'M') + f(50 + r * Math.cos(t)) + ' ' + f(50 + r * Math.sin(t)); } return d + ' Z'; })(), closed: true },
    { id: 'spiral', name: 'Spiral', d: (() => { let d = ''; for (let i = 0; i <= 120; i++) { const t = i / 120, a = t * Math.PI * 4.5, r = 8 + t * 32; d += (i ? ' L' : 'M') + f(50 + r * Math.cos(a)) + ' ' + f(50 + r * Math.sin(a)); } return d; })(), closed: false }
  ];
  const HALF = 4.6, STEP = .6, MARGIN = 6;
  const COMMENTS = [
    [92, ['Your brain is suspiciously flexible.', 'Are you secretly left-handed AND right-handed?', 'Mirror master.']],
    [80, ['Seriously impressive.', 'Your neurons adapted fast.', 'Smooth operator.']],
    [65, ['Not bad for a scrambled brain.', 'Wobbly, but you got there.', 'Respectable mirror work.']],
    [45, ['Your hand and eyes had a disagreement.', 'Brains are weird, right?', 'Practice makes less wobbly.']],
    [0, ['The star escaped.', 'That went everywhere.', 'Your brain filed a complaint.']]
  ];

  const $ = (id) => document.getElementById(id);
  const board = $('board'), cv = $('cv'), g = cv.getContext('2d');
  const probe = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  const holder = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  holder.setAttribute('aria-hidden', 'true');
  holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  holder.append(probe); document.body.append(holder);

  let modeIdx = Math.max(0, MODES.findIndex((m) => m.id === Curio.store.get('mi-mode', 'lr')));
  let shapeIdx = Math.max(0, SHAPES.findIndex((s) => s.id === Curio.store.get('mi-shape', 'star')));
  let samples = [], covered = null, path2d = null;
  let trail = [];
  let pen = null, pid = null, ghost = null, ghostT = 0;
  let state = 'ready';
  let tStart = 0, timerRaf = 0;
  let inLen = 0, totLen = 0, errors = 0, outside = false;
  let size = 0, dpr = 1;

  const paper = () => (Curio.isDark() ? '#1d1b18' : '#fffdf7');
  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  function applyPaper() { document.documentElement.style.setProperty('--paper', paper()); }
  const unit = () => size * (1 - MARGIN * 2 / 100) / 100;
  const off = () => size * MARGIN / 100;

  function sample(d) {
    probe.setAttribute('d', d);
    const L = probe.getTotalLength();
    const n = Math.ceil(L / STEP);
    const out = [];
    for (let i = 0; i <= n; i++) { const p = probe.getPointAtLength(i / n * L); out.push({ x: p.x, y: p.y }); }
    return out;
  }
  function nearestDist(p) {
    let m = Infinity;
    for (let i = 0; i < samples.length; i++) { const dx = samples[i].x - p.x, dy = samples[i].y - p.y, d = dx * dx + dy * dy; if (d < m) m = d; }
    return Math.sqrt(m);
  }
  function markCover(p) {
    const r2 = (HALF + .6) * (HALF + .6);
    for (let i = 0; i < samples.length; i++) { if (covered[i]) continue; const dx = samples[i].x - p.x, dy = samples[i].y - p.y; if (dx * dx + dy * dy <= r2) covered[i] = 1; }
  }
  const coverage = () => { let c = 0; for (let i = 0; i < covered.length; i++) c += covered[i]; return c / covered.length; };

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    size = board.clientWidth;
    cv.width = Math.round(size * dpr); cv.height = Math.round(size * dpr);
    draw();
  }

  function draw() {
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = paper(); g.fillRect(0, 0, cv.width, cv.height);
    const u = unit();
    g.setTransform(dpr * u, 0, 0, dpr * u, dpr * off(), dpr * off());
    const dark = Curio.isDark();
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = dark ? '#8a8174' : '#3b3631';
    g.lineWidth = HALF * 2 + .9;
    g.stroke(path2d);
    g.strokeStyle = dark ? '#2c2925' : '#f3ede2';
    g.lineWidth = HALF * 2 - .4;
    g.stroke(path2d);
    g.save();
    g.strokeStyle = dark ? 'rgba(94,200,255,.16)' : 'rgba(36,99,235,.1)';
    g.lineWidth = HALF * 2 - .6;
    g.beginPath();
    let run = false;
    for (let i = 0; i < samples.length; i++) {
      const p = samples[i];
      if (covered[i]) { if (run) g.lineTo(p.x, p.y); else { g.moveTo(p.x, p.y); g.lineTo(p.x + .01, p.y); } run = true; }
      else run = false;
    }
    g.stroke();
    g.restore();
    const s0 = samples[0];
    g.fillStyle = '#1fb35a';
    g.beginPath(); g.arc(s0.x, s0.y, 2.6, 0, Math.PI * 2); g.fill();
    if (!SHAPES[shapeIdx].closed) {
      const s1 = samples[samples.length - 1];
      g.fillStyle = '#d64545';
      g.beginPath(); g.arc(s1.x, s1.y, 2.6, 0, Math.PI * 2); g.fill();
    }
    g.lineWidth = Math.max(.7, 2.4 / u);
    for (let i = 1; i < trail.length - 1; i++) {
      const p = trail;
      if (p[i + 1].gap) continue;
      const a = i === 1 || p[i].gap ? p[i - 1] : { x: (p[i - 1].x + p[i].x) / 2, y: (p[i - 1].y + p[i].y) / 2 };
      const b = { x: (p[i].x + p[i + 1].x) / 2, y: (p[i].y + p[i + 1].y) / 2 };
      g.strokeStyle = p[i].in ? (dark ? '#5ec8ff' : '#2463eb') : '#e5484d';
      g.beginPath(); g.moveTo(a.x, a.y); g.quadraticCurveTo(p[i].x, p[i].y, b.x, b.y); g.stroke();
    }
    const target = state === 'ready' ? s0 : pen;
    if (state === 'ready' || (state === 'paused' && pen)) {
      const t = performance.now() / 1000;
      g.strokeStyle = state === 'ready' ? '#1fb35a' : (css('--accent') || '#ff5a36');
      g.lineWidth = .6;
      g.globalAlpha = .5 + .5 * Math.sin(t * 5);
      g.beginPath(); g.arc(target.x, target.y, 4.2 + Math.sin(t * 5), 0, Math.PI * 2); g.stroke();
      g.globalAlpha = 1;
    }
    if (ghost && state !== 'drawing' && state !== 'done') {
      g.strokeStyle = dark ? '#bcb3a8' : '#5d5750';
      g.lineWidth = .4; g.setLineDash([1.2, 1]);
      g.beginPath(); g.arc(ghost.x, ghost.y, 2.6, 0, Math.PI * 2); g.stroke();
      g.setLineDash([]);
      g.beginPath(); g.moveTo(ghost.x - 4, ghost.y); g.lineTo(ghost.x + 4, ghost.y); g.moveTo(ghost.x, ghost.y - 4); g.lineTo(ghost.x, ghost.y + 4); g.stroke();
    }
    if (pen) {
      g.fillStyle = state === 'drawing' ? (outside ? '#e5484d' : (dark ? '#f3eee7' : '#1d1b19')) : (dark ? '#bcb3a8' : '#5d5750');
      g.beginPath(); g.arc(pen.x, pen.y, 1.4, 0, Math.PI * 2); g.fill();
      g.strokeStyle = g.fillStyle; g.lineWidth = .35;
      g.beginPath(); g.arc(pen.x, pen.y, 2.8, 0, Math.PI * 2); g.stroke();
    }
  }

  let pulseRaf = 0;
  function pulse() {
    cancelAnimationFrame(pulseRaf);
    const loop = () => { if (state === 'ready' || state === 'paused') { draw(); pulseRaf = requestAnimationFrame(loop); } };
    if (!document.hidden) pulseRaf = requestAnimationFrame(loop);
  }

  function raw(e) {
    const b = cv.getBoundingClientRect();
    const k = size / b.width;
    return { x: ((e.clientX - b.left) * k - off()) / unit(), y: ((e.clientY - b.top) * k - off()) / unit() };
  }
  const mapped = (e) => MODES[modeIdx].map(raw(e));

  function down(q) {
    if (state === 'done' || pid !== null) return false;
    const e = q.event || q;
    if (e.cancelable) e.preventDefault();
    board.classList.toggle('is-mouse', e.pointerType === 'mouse');
    const p = mapped(q);
    const anchor = state === 'ready' ? samples[0] : pen;
    if (Math.hypot(p.x - anchor.x, p.y - anchor.y) > 7) {
      showGhost(p, e.pointerType !== 'mouse');
      Curio.toast(state === 'ready' ? 'Start on the green dot. Remember: it is mirrored! (Or use the arrow keys.)' : 'Carry on from where your pen stopped');
      Curio.beep(170, .12, 'square', .05);
      shakeBoard();
      return false;
    }
    pid = e.pointerId != null ? e.pointerId : 'kb';
    beginAt(p);
    return true;
  }
  function beginAt(p) {
    if (state === 'ready') {
      tStart = performance.now(); tickTimer();
      trail = [];
      Curio.beep(660, .06, 'triangle', .08);
    }
    ghost = null;
    state = 'drawing';
    pen = p;
    const inside = nearestDist(p) <= HALF;
    outside = !inside;
    trail.push({ x: p.x, y: p.y, in: inside, gap: trail.length > 0 });
    markCover(p);
    draw();
  }

  function addPoint(p) {
    const l = pen;
    const dist = Math.hypot(p.x - l.x, p.y - l.y);
    if (dist < .3) return;
    const n = Math.max(1, Math.ceil(dist / 1));
    for (let k = 1; k <= n; k++) {
      const q = { x: l.x + (p.x - l.x) * k / n, y: l.y + (p.y - l.y) * k / n };
      const inside = nearestDist(q) <= HALF;
      const seg = dist / n;
      totLen += seg; if (inside) { inLen += seg; markCover(q); }
      if (!inside && !outside) { errors++; outside = true; shakeBoard(); Curio.beep(140, .09, 'sawtooth', .05); if (navigator.vibrate) try { navigator.vibrate(25); } catch {} }
      else if (inside && nearestDist(q) < HALF - 1) outside = false;
    }
    pen = p;
    trail.push({ x: p.x, y: p.y, in: !outside });
  }

  function showGhost(p, temporary) {
    ghost = p;
    clearTimeout(ghostT);
    if (temporary) ghostT = setTimeout(() => { ghost = null; draw(); }, 1400);
    draw();
  }

  function move(q) {
    if (pid === null || state !== 'drawing') return;
    const e = q.event;
    const list = e && e.getCoalescedEvents ? e.getCoalescedEvents() : [];
    for (const ev of (list.length ? list : [q])) addPoint(mapped(ev));
    lastRaw = raw(q);
    afterMove();
  }
  function afterMove() {
    syncStats();
    const c = coverage();
    const end = SHAPES[shapeIdx].closed ? samples[0] : samples[samples.length - 1];
    if (c >= .96 && Math.hypot(pen.x - end.x, pen.y - end.y) < HALF + 2) return finish();
    if (c >= .995) return finish();
    draw();
  }

  function up() {
    if (pid === null) return;
    pid = null; lastRaw = null;
    if (state === 'drawing') { state = 'paused'; outside = false; syncStats(); pulse(); }
  }

  function syncStats() {
    $('prog').textContent = Math.floor(coverage() * 100) + '%';
    $('inside').textContent = totLen > 0 ? Math.round(inLen / totLen * 100) + '%' : '-';
    $('errs').textContent = errors;
    $('finishB').disabled = !(state === 'drawing' || state === 'paused') || totLen < 5;
  }

  function tickTimer() {
    cancelAnimationFrame(timerRaf);
    const loop = () => { if (state === 'done' || !tStart) return; $('time').textContent = ((performance.now() - tStart) / 1000).toFixed(1); timerRaf = requestAnimationFrame(loop); };
    timerRaf = requestAnimationFrame(loop);
  }

  function finish() {
    if (state === 'done' || totLen < 5) return;
    state = 'done'; pid = null;
    cancelAnimationFrame(timerRaf);
    const secs = (performance.now() - tStart) / 1000;
    $('time').textContent = secs.toFixed(1);
    const ins = inLen / totLen, cov = coverage();
    const score = Math.max(0, Math.round(100 * Math.pow(ins, 1.5) * Math.min(1, cov / .96) - Math.min(30, errors * 1.5)));
    const key = `${MODES[modeIdx].id}:${SHAPES[shapeIdx].id}`;
    const had = Curio.getBest(key) != null;
    const b = Curio.best(key, score, true);
    if (b.isNew) Curio.store.set(`mi-time:${key}`, secs);
    $('big').textContent = score;
    $('big').style.color = `hsl(${Math.max(0, Math.min(130, (score - 35) * 2.2)).toFixed(0)} 72% ${Curio.isDark() ? 60 : 40}%)`;
    $('msg').textContent = Curio.pick(COMMENTS.find(([m]) => score >= m)[1]);
    $('rTime').textContent = secs.toFixed(1);
    $('rIn').textContent = Math.round(ins * 100) + '%';
    $('rErr').textContent = errors;
    $('rNew').innerHTML = b.isNew && had ? '<span class="mi-new">New best for this mode!</span>' : (had ? `<span class="c-muted">Best: ${b.best}</span>` : '');
    $('nextMode').textContent = modeIdx < MODES.length - 1 ? `Next: ${MODES[modeIdx + 1].name} ›` : 'Back to Mirror ›';
    $('res').classList.add('is-on');
    syncStats();
    Curio.beep(330 + score * 5, .1, 'triangle', .12);
    setTimeout(() => Curio.beep(440 + score * 6, .18, 'triangle', .1), 110);
    if (score >= 80 || (b.isNew && had)) Curio.confetti();
    afterFinish(score, secs);
    paintBests();
    draw();
    $('nextMode').focus({ preventScroll: true });
  }

  function reset() {
    usedKeys = false;
    state = 'ready'; pid = null; pen = null; trail = []; ghost = null;
    covered = new Uint8Array(samples.length);
    inLen = 0; totLen = 0; errors = 0; outside = false; tStart = 0;
    cancelAnimationFrame(timerRaf);
    $('time').textContent = '0.0';
    $('res').classList.remove('is-on');
    syncStats();
    $('tag').textContent = `${MODES[modeIdx].sym} ${MODES[modeIdx].name.toUpperCase()}`;
    const b = Curio.getBest(`${MODES[modeIdx].id}:${SHAPES[shapeIdx].id}`);
    $('tag2').textContent = b == null ? '' : `best ${b}`;
    $('desc').textContent = MODES[modeIdx].desc;
    draw(); pulse();
  }

  function setShape(i) {
    if (daily && i !== daily.si) { daily = null; $('dailyB').setAttribute('aria-pressed', 'false'); }
    shapeIdx = i; Curio.store.set('mi-shape', SHAPES[i].id);
    samples = sample(SHAPES[i].d);
    path2d = new Path2D(SHAPES[i].d);
    document.querySelectorAll('.mi-shape').forEach((b, j) => b.setAttribute('aria-pressed', String(j === i)));
    reset(); paintBests();
  }
  function setMode(i) {
    if (daily && i !== daily.mi) { daily = null; $('dailyB').setAttribute('aria-pressed', 'false'); }
    modeIdx = i; Curio.store.set('mi-mode', MODES[i].id);
    document.querySelectorAll('.mi-mode').forEach((b, j) => b.setAttribute('aria-pressed', String(j === i)));
    reset(); paintBests();
    Curio.beep(500 + i * 90, .06, 'sine', .07);
  }

  function paintBests() {
    const tb = $('bests'); tb.innerHTML = '';
    MODES.forEach((m, i) => {
      const key = `${m.id}:${SHAPES[shapeIdx].id}`;
      const b = Curio.getBest(key), t = Curio.store.get(`mi-time:${key}`, null);
      const tr = document.createElement('tr');
      const a = document.createElement('td'); a.textContent = `${m.sym} ${m.name}`; if (i === modeIdx) a.style.fontWeight = '900';
      const c = document.createElement('td'); c.textContent = b == null ? '-' : b;
      const d = document.createElement('td'); d.textContent = t == null ? '-' : `${Number(t).toFixed(1)} s`;
      tr.append(a, c, d); tb.append(tr);
    });
    document.querySelectorAll('.mi-mode small').forEach((s, i) => { const b = Curio.getBest(`${MODES[i].id}:${SHAPES[shapeIdx].id}`); s.textContent = b == null ? MODES[i].sym : `${MODES[i].sym}  ${b}`; });
  }

  MODES.forEach((m, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'mi-mode';
    b.innerHTML = '<b></b><small></small>';
    b.querySelector('b').textContent = `${i + 1}. ${m.name}`;
    b.addEventListener('click', () => setMode(i));
    $('modes').append(b);
  });
  SHAPES.forEach((s, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'mi-shape'; b.title = s.name;
    b.setAttribute('aria-label', s.name);
    b.innerHTML = `<svg viewBox="-4 -4 108 108" aria-hidden="true"><path d="${s.d}" fill="none" stroke="currentColor" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
    b.addEventListener('click', () => setShape(i));
    $('shapes').append(b);
  });

  $('restart').addEventListener('click', reset);
  $('dailyB').addEventListener('click', startDaily);
  $('retry').addEventListener('click', reset);
  $('finishB').addEventListener('click', finish);
  $('nextMode').addEventListener('click', () => setMode((modeIdx + 1) % MODES.length));
  let started = false;
  Curio.drag(cv, { start: (q) => { started = down(q); }, move: (q) => { if (started) move(q); }, end: () => { if (started) up(); started = false; } });
  cv.addEventListener('pointermove', (e) => { if (pid === null && e.pointerType === 'mouse' && state !== 'done') showGhost(mapped(e), false); });
  if (matchMedia('(pointer: fine)').matches && !Curio.touchpad && !Curio.store.get('mi-tp-tip', false)) { Curio.store.set('mi-tp-tip', true); setTimeout(() => Curio.toast('Tip: on a touchpad, turn on Touchpad mode in the top bar', 4000), 1200); }
  cv.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && pid === null) { ghost = null; draw(); } });
  cv.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
  window.addEventListener('resize', resize);
  window.addEventListener('curio:theme', () => { applyPaper(); draw(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) pulse(); });
  window.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea')) return;
    if (document.querySelector('.curio-modal')) return;
    if (e.key >= '1' && e.key <= String(MODES.length)) setMode(+e.key - 1);
    else if (e.key === 'r' || e.key === 'R') reset();
    else if (e.key === 'Enter' && !$('finishB').disabled) finish();
    else if (KEYS[e.key]) { e.preventDefault(); held.add(e.key); usedKeys = true; kbStart(); }
  });

  const KEYS = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1], a: [-1, 0], d: [1, 0], w: [0, -1], s: [0, 1], A: [-1, 0], D: [1, 0], W: [0, -1], S: [0, 1] };
  const held = new Set();
  let kbRaf = 0, kbRaw = null, kbLast = 0, lastRaw = null;
  window.addEventListener('keyup', (e) => { held.delete(e.key); });
  window.addEventListener('blur', () => held.clear());
  function kbStart() {
    if (kbRaf || state === 'done') return;
    if (pid !== null && pid !== 'kb') return;
    if (pid === null) {
      const anchor = state === 'ready' ? samples[0] : pen;
      kbRaw = MODES[modeIdx].inv(anchor);
      pid = 'kb'; board.classList.remove('is-mouse');
      beginAt(MODES[modeIdx].map(kbRaw));
    }
    kbLast = performance.now();
    const loop = (now) => {
      const dt = Math.min(.05, (now - kbLast) / 1000); kbLast = now;
      if (!held.size || state !== 'drawing') { kbRaf = 0; if (state === 'drawing' && pid === 'kb') up(); return; }
      let vx = 0, vy = 0;
      held.forEach((k) => { if (KEYS[k]) { vx += KEYS[k][0]; vy += KEYS[k][1]; } });
      const m = Math.hypot(vx, vy) || 1;
      kbRaw = { x: Math.max(-5, Math.min(105, kbRaw.x + vx / m * 26 * dt)), y: Math.max(-5, Math.min(105, kbRaw.y + vy / m * 26 * dt)) };
      addPoint(MODES[modeIdx].map(kbRaw));
      afterMove();
      kbRaf = requestAnimationFrame(loop);
    };
    kbRaf = requestAnimationFrame(loop);
  }
  function liveTick() {
    requestAnimationFrame(liveTick);
    if (document.hidden || !MODES[modeIdx].live || state !== 'drawing' || pid === null || pid === 'kb' || !lastRaw) return;
    addPoint(MODES[modeIdx].map(lastRaw)); afterMove();
  }
  requestAnimationFrame(liveTick);
  const today = new Date().toISOString().slice(0, 10);
  const stats = Object.assign({ v: 1, runs: 0, clean: 0, daily: {}, modes: [], best: 0 }, Curio.store.get('mi-stats', {}) || {});
  if (!stats.daily || typeof stats.daily !== 'object') stats.daily = {};
  if (!Array.isArray(stats.modes)) stats.modes = [];
  let badges = Curio.store.get('mi-badges', []) || [];
  let daily = null;
  const BADGES = [
    { id: 'first', icon: '🪞', name: 'Through the looking glass', d: 'Finish any trace' },
    { id: 'eighty', icon: '🎯', name: 'Rewired', d: 'Score 80 or more' },
    { id: 'ninetyfive', icon: '🧠', name: 'Ambidextrous brain', d: 'Score 95 or more' },
    { id: 'clean', icon: '✨', name: 'No slips', d: 'Finish without leaving the track' },
    { id: 'allmodes', icon: '🔁', name: 'Every angle', d: 'Finish in every control mode' },
    { id: 'spin', icon: '🌀', name: 'Dizzy', d: 'Score 60+ in Spinning mode' },
    { id: 'spiral', icon: '🐚', name: 'Snail trail', d: 'Finish the spiral' },
    { id: 'keys', icon: '⌨️', name: 'Keyboard warrior', d: 'Finish using the arrow keys' },
    { id: 'daily', icon: '📅', name: 'Daily reflection', d: 'Finish the daily mirror' },
    { id: 'runs25', icon: '🏃', name: 'Practice makes perfect', d: 'Finish 25 traces' }
  ];
  let usedKeys = false;
  function badge(id) {
    if (badges.includes(id)) return;
    badges.push(id); Curio.store.set('mi-badges', badges);
    const b = BADGES.find((x) => x.id === id);
    if (b) setTimeout(() => { Curio.toast(`${b.icon} Badge: ${b.name}`, 2400); [784, 988, 1318].forEach((f, i) => setTimeout(() => Curio.beep(f, .1, 'triangle', .06), i * 80)); }, 600);
    renderBadges();
  }
  function renderBadges() {
    const el = $('badges'); el.innerHTML = '';
    BADGES.forEach((b) => {
      const d = document.createElement('div'); d.className = 'mi-badge' + (badges.includes(b.id) ? ' got' : '');
      d.innerHTML = `<i aria-hidden="true">${b.icon}</i><div><b></b><span></span></div>`;
      d.querySelector('b').textContent = b.name; d.querySelector('span').textContent = b.d;
      el.append(d);
    });
    $('stats2').innerHTML = [[stats.runs, 'Traces'], [stats.best, 'Best score'], [stats.clean, 'Clean runs'], [`${stats.modes.length}/${MODES.length}`, 'Modes beaten'], [stats.daily[today] != null ? stats.daily[today] : '-', "Today's daily"], [`${badges.length}/${BADGES.length}`, 'Badges']]
      .map(([v, l]) => `<div class="c-stat"><b>${v}</b><span>${l}</span></div>`).join('');
  }
  function afterFinish(score) {
    stats.runs++; stats.best = Math.max(stats.best, score);
    if (!errors) stats.clean++;
    const mid = MODES[modeIdx].id;
    if (!stats.modes.includes(mid)) stats.modes.push(mid);
    badge('first');
    if (score >= 80) badge('eighty');
    if (score >= 95) badge('ninetyfive');
    if (!errors) badge('clean');
    if (stats.modes.length >= MODES.length) badge('allmodes');
    if (mid === 'spin' && score >= 60) badge('spin');
    if (SHAPES[shapeIdx].id === 'spiral') badge('spiral');
    if (usedKeys) badge('keys');
    if (stats.runs >= 25) badge('runs25');
    if (daily) {
      const prev = stats.daily[today];
      if (prev == null || score > prev) stats.daily[today] = score;
      badge('daily');
      $('rNew').innerHTML += ` <button class="c-btn c-btn--ghost" id="shareDaily" type="button" style="padding:5px 12px;font-size:13px;margin-top:6px">📋 Share daily</button>`;
      $('shareDaily').addEventListener('click', async () => {
        const t = `🪞 Curio Mirror Drawing daily ${today}: ${score}/100 (${MODES[modeIdx].name}, ${SHAPES[shapeIdx].name}, ${errors} slips)`;
        try { await navigator.clipboard.writeText(t); Curio.toast('Copied 📋'); } catch { Curio.toast('Copy failed'); }
      });
    }
    Curio.store.set('mi-stats', stats);
    renderBadges();
  }
  function seeded(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } let a = h >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function startDaily() {
    const r = seeded('mirror-' + today);
    const si = Math.floor(r() * SHAPES.length), mi = Math.floor(r() * MODES.length);
    setShape(si); setMode(mi);
    daily = { si, mi };
    $('dailyB').setAttribute('aria-pressed', 'true');
    Curio.toast(`Daily mirror: ${SHAPES[si].name} in ${MODES[mi].name} mode`);
  }
  function shakeBoard() { board.classList.remove('shake'); void board.offsetWidth; board.classList.add('shake'); }

  applyPaper();
  renderBadges();
  size = board.clientWidth;
  setShape(shapeIdx);
  setMode(modeIdx);
  resize();
  window.__mirror = {
    get state() { return state; },
    get stats() { return { cov: coverage(), inside: totLen ? inLen / totLen : 0, errors }; },
    handPath() {
      const b = cv.getBoundingClientRect(); const k = b.width / size;
      const inv = MODES[modeIdx].inv;
      return samples.map((s) => { const h = inv(s); return [b.left + (off() + h.x * unit()) * k, b.top + (off() + h.y * unit()) * k]; });
    },
    setMode
  };
})();
