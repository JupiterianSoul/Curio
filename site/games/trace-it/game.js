(() => {
  const SHAPES = Curio.simple ? window.TRACE_SHAPES.filter((x) => x.lvl === 1) : window.TRACE_SHAPES;
  const LVL = ['', 'Easy', 'Medium', 'Tricky'];
  const STEP = 0.6, COVER_R = 4, MARGIN = 7;
  const COMMENTS = [
    [97, ['Are you a photocopier?', 'Laser precision. Suspicious, even.', 'The outline asked for your autograph.']],
    [92, ['Beautifully done.', 'Surgeon hands.', 'Nearly invisible seams.']],
    [85, ['Very tidy tracing!', 'A steady hand indeed.', 'That would pass any art class.']],
    [75, ['Pretty good. Slight wobble.', 'Coffee hands, but solid.', 'Close enough to frame.']],
    [60, ['The outline is a suggestion, right?', 'Wobbly but brave.', 'Getting there!']],
    [40, ['Interpretive tracing.', 'You traced... something.', 'Bold. Loose. Expressive.']],
    [0, ['Was that a scribble?', 'The outline is over there.', 'Modern art, at least.']]
  ];

  const $ = (id) => document.getElementById(id);
  const board = $('board'), cv = $('cv'), g = cv.getContext('2d'), probe = $('probe');
  let idx = Math.max(0, SHAPES.findIndex((s) => s.id === Curio.store.get('tr-shape', 'circle')));
  let fade = Curio.store.get('tr-fade', false);
  let samples = [];
  let covered = null;
  let strokes = [];
  let cur = null, pid = null;
  let tStart = 0, tEnd = 0, timerRaf = 0;
  let state = 'ready';
  let result = null;
  let outlineAlpha = 1, fadeAt = 0, fadeRaf = 0;
  let size = 0, dpr = 1, pathCache = null;

  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const paper = () => (Curio.isDark() ? '#1d1b18' : '#fffdf7');
  const unit = () => (size - MARGIN * 2 * size / 100) / 100;
  const toScreen = (p) => ({ x: MARGIN * size / 100 + p.x * unit(), y: MARGIN * size / 100 + p.y * unit() });
  function applyPaper() { document.documentElement.style.setProperty('--paper', paper()); }

  function sample(d) {
    probe.setAttribute('d', d);
    const L = probe.getTotalLength();
    const out = [];
    const n = Math.max(2, Math.ceil(L / STEP));
    for (let i = 0; i <= n; i++) { const p = probe.getPointAtLength((i / n) * L); out.push({ x: p.x, y: p.y }); }
    return out;
  }

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    size = board.clientWidth;
    cv.width = Math.round(size * dpr); cv.height = Math.round(size * dpr);
    draw();
  }

  function smoothPath(c, pts) {
    c.beginPath();
    c.moveTo(pts[0].x, pts[0].y);
    if (pts.length === 1) { c.lineTo(pts[0].x + .01, pts[0].y); return; }
    for (let i = 1; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      c.quadraticCurveTo(a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2);
    }
    const l = pts[pts.length - 1];
    c.lineTo(l.x, l.y);
  }

  function hue(d) {
    const e = Math.min(1, Math.max(0, d - .8) / 6);
    return `hsl(${Math.round(130 * (1 - e))} 78% ${Curio.isDark() ? 58 : 42}%)`;
  }

  function draw() {
    const s = SHAPES[idx];
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = paper(); g.fillRect(0, 0, cv.width, cv.height);
    const u = unit();
    const off = MARGIN * size / 100;
    g.setTransform(dpr * u, 0, 0, dpr * u, dpr * off, dpr * off);
    if (!pathCache || pathCache.d !== s.d) pathCache = { d: s.d, p: new Path2D(s.d) };
    const ink = css('--ink') || '#222';
    const showA = state === 'done' ? 1 : outlineAlpha;
    if (showA > 0.01) {
      g.save();
      g.lineCap = 'round'; g.lineJoin = 'round';
      g.globalAlpha = showA * (Curio.isDark() ? .16 : .12);
      g.strokeStyle = ink; g.lineWidth = COVER_R * 1.6;
      g.stroke(pathCache.p);
      g.globalAlpha = showA * (state === 'done' ? .5 : .38);
      g.lineWidth = .7;
      g.setLineDash([2.2, 1.6]);
      g.stroke(pathCache.p);
      g.restore();
    }
    if (state === 'done' && result) {
      g.save();
      g.fillStyle = Curio.isDark() ? 'rgba(255,90,90,.75)' : 'rgba(214,69,69,.7)';
      for (let i = 0; i < samples.length; i += 2) if (!covered[i]) { const p = samples[i]; g.beginPath(); g.arc(p.x, p.y, .7, 0, Math.PI * 2); g.fill(); }
      g.restore();
    }
    g.lineCap = 'round'; g.lineJoin = 'round';
    const lw = Math.max(1.3, 3.2 / u);
    g.lineWidth = lw;
    const all = cur ? strokes.concat([cur]) : strokes;
    for (const st of all) {
      if (state === 'done' && result) {
        const p = st.pts;
        if (p.length < 3) { g.strokeStyle = hue(st.d ? st.d[0] : 0); smoothPath(g, p); g.stroke(); continue; }
        for (let i = 1; i < p.length - 1; i++) {
          const a = i === 1 ? p[0] : { x: (p[i - 1].x + p[i].x) / 2, y: (p[i - 1].y + p[i].y) / 2 };
          const b = i === p.length - 2 ? p[p.length - 1] : { x: (p[i].x + p[i + 1].x) / 2, y: (p[i].y + p[i + 1].y) / 2 };
          g.strokeStyle = hue(st.d[i]);
          g.beginPath(); g.moveTo(a.x, a.y); g.quadraticCurveTo(p[i].x, p[i].y, b.x, b.y); g.stroke();
        }
      } else {
        g.strokeStyle = Curio.isDark() ? '#5ec8ff' : '#2463eb';
        smoothPath(g, st.pts); g.stroke();
      }
    }
    if (state !== 'done' && outlineAlpha > .01 && !strokes.length && !cur && samples.length) {
      const p = samples[0];
      g.fillStyle = css('--accent') || '#ff5a36';
      g.globalAlpha = outlineAlpha;
      g.beginPath(); g.arc(p.x, p.y, 1.8, 0, Math.PI * 2); g.fill();
      g.globalAlpha = 1;
    }
  }

  function pos(e) {
    const b = cv.getBoundingClientRect();
    const k = size / b.width;
    const off = MARGIN * size / 100;
    return { x: ((e.clientX - b.left) * k - off) / unit(), y: ((e.clientY - b.top) * k - off) / unit() };
  }

  function markCover(p) {
    let hit = 0;
    const r2 = COVER_R * COVER_R;
    for (let i = 0; i < samples.length; i++) {
      if (covered[i]) continue;
      const dx = samples[i].x - p.x, dy = samples[i].y - p.y;
      if (dx * dx + dy * dy <= r2) { covered[i] = 1; hit++; }
    }
    return hit;
  }
  function coverage() { let c = 0; for (let i = 0; i < covered.length; i++) c += covered[i]; return c / covered.length; }
  function addPoint(st, p) {
    const l = st.pts[st.pts.length - 1];
    const dist = l ? Math.hypot(p.x - l.x, p.y - l.y) : 0;
    if (l && dist < .35) return;
    if (l && dist > 1) {
      const n = Math.ceil(dist / 1);
      for (let k = 1; k < n; k++) markCover({ x: l.x + (p.x - l.x) * k / n, y: l.y + (p.y - l.y) * k / n });
    }
    st.pts.push(p);
    markCover(p);
  }

  function down(e) {
    if (state === 'done' || pid !== null) return;
    e.preventDefault();
    pid = e.pointerId;
    cv.setPointerCapture?.(pid);
    if (!tStart) { tStart = performance.now(); tick(); }
    cur = { pts: [] };
    addPoint(cur, pos(e));
    state = 'drawing';
    draw();
  }
  function move(e) {
    if (!cur) return;
    const list = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
    for (const ev of (list.length ? list : [e])) addPoint(cur, pos(ev));
    $('cov').textContent = Math.floor(coverage() * 100) + '%';
    draw();
  }
  function up() {
    pid = null;
    if (!cur) return;
    strokes.push(cur); cur = null;
    state = 'ready';
    syncButtons();
    const c = coverage();
    $('cov').textContent = Math.floor(c * 100) + '%';
    if (c >= .985) finish();
    else draw();
  }

  function recomputeCover() {
    covered = new Uint8Array(samples.length);
    for (const st of strokes) {
      const tmp = { pts: [] };
      for (const p of st.pts) addPoint(tmp, p);
    }
    $('cov').textContent = Math.floor(coverage() * 100) + '%';
  }

  function tick() {
    cancelAnimationFrame(timerRaf);
    const loop = () => {
      if (!tStart || state === 'done') return;
      $('time').textContent = ((performance.now() - tStart) / 1000).toFixed(1);
      timerRaf = requestAnimationFrame(loop);
    };
    timerRaf = requestAnimationFrame(loop);
  }

  function nearest(p) {
    let m = Infinity;
    for (let i = 0; i < samples.length; i++) {
      const dx = samples[i].x - p.x, dy = samples[i].y - p.y;
      const d = dx * dx + dy * dy;
      if (d < m) m = d;
    }
    return Math.sqrt(m);
  }

  function evaluate() {
    let sum = 0, n = 0;
    for (const st of strokes) {
      st.d = st.pts.map(nearest);
      for (let i = 0; i < st.pts.length; i++) {
        const w = i ? Math.hypot(st.pts[i].x - st.pts[i - 1].x, st.pts[i].y - st.pts[i - 1].y) : .5;
        sum += Math.max(0, 1 - Math.max(0, st.d[i] - .8) / 6) * w; n += w;
      }
    }
    const precision = n ? sum / n : 0;
    const cov = coverage();
    const score = Math.max(0, Math.min(100, 100 * Math.pow(precision, 1.4) * Math.min(1, cov / .985)));
    return { score: Math.round(score * 10) / 10, precision, cov };
  }

  function bestKey() { return `${SHAPES[idx].id}:${fade ? 'mem' : 'std'}`; }

  function finish() {
    if (!strokes.length || state === 'done') return;
    state = 'done';
    tEnd = performance.now();
    cancelAnimationFrame(timerRaf);
    const secs = (tEnd - tStart) / 1000;
    $('time').textContent = secs.toFixed(1);
    result = evaluate();
    const s = result.score;
    const pct = $('pct');
    countUp(pct, s);
    $('stars').innerHTML = [1, 2, 3].map((k) => `<span class="${k <= starsFor(s) ? 'on' : ''}" style="animation-delay:${250 + k * 160}ms">★</span>`).join('');
    pct.style.color = `hsl(${Math.max(0, Math.min(130, (s - 40) * 2.2)).toFixed(0)} 72% ${Curio.isDark() ? 60 : 40}%)`;
    $('msg').textContent = Curio.pick(COMMENTS.find(([m]) => s >= m)[1]);
    $('det').textContent = `Precision ${Math.round(result.precision * 100)}% · Coverage ${Math.round(result.cov * 100)}% · ${secs.toFixed(1)} s`;
    const had = Curio.getBest(bestKey()) != null;
    const b = Curio.best(bestKey(), s, true);
    $('newb').innerHTML = b.isNew && had ? '<span class="tr-new">New best!</span>' : '';
    if (b.isNew) Curio.store.set(`tr-time:${bestKey()}`, secs);
    $('best').textContent = b.best.toFixed(0) + '%';
    $('res').classList.add('is-on');
    Curio.beep(300 + s * 5, .1, 'triangle', .12);
    setTimeout(() => Curio.beep(420 + s * 7, .16, 'triangle', .1), 110);
    if (s >= 90 || (b.isNew && had && s >= 75)) Curio.confetti();
    afterScore(s, b);
    syncButtons();
    paintGrid();
    draw();
    $('go').focus({ preventScroll: true });
  }

  function syncButtons() {
    $('fade').disabled = !!daily;
    const has = strokes.length > 0 && state !== 'done';
    $('undo').disabled = !has;
    $('clear').disabled = !has;
    $('done').disabled = !has;
  }

  function startFade() {
    cancelAnimationFrame(fadeRaf);
    const mem = $('mem');
    if (!fade) { outlineAlpha = 1; mem.classList.remove('is-on'); return; }
    outlineAlpha = 1;
    fadeAt = performance.now() + 2000;
    mem.classList.add('is-on');
    const loop = (now) => {
      const left = (fadeAt - now) / 1000;
      if (left > 0) { mem.textContent = `Memorise it! ${left.toFixed(1)}`; outlineAlpha = 1; }
      else { mem.classList.remove('is-on'); outlineAlpha = Math.max(0, 1 + left / .7); }
      draw();
      if (outlineAlpha > 0 && state !== 'done') fadeRaf = requestAnimationFrame(loop);
    };
    fadeRaf = requestAnimationFrame(loop);
  }

  function load(i) {
    idx = (i + SHAPES.length) % SHAPES.length;
    Curio.store.set('tr-shape', SHAPES[idx].id);
    const s = SHAPES[idx];
    samples = sample(s.d);
    $('name').textContent = `${s.emoji} ${s.name}`;
    $('lvl').textContent = daily ? `Daily ${daily.i + 1}/5 · ${LVL[s.lvl]}` : `${LVL[s.lvl]} · ${CATS[s.cat] || ''}`;
    reset();
    paintGrid();
  }

  function reset() {
    strokes = []; cur = null; pid = null; result = null;
    covered = new Uint8Array(samples.length);
    tStart = 0; state = 'ready';
    cancelAnimationFrame(timerRaf);
    $('time').textContent = '0.0'; $('cov').textContent = '0%';
    const b = Curio.getBest(bestKey());
    $('best').textContent = b == null ? '-' : Number(b).toFixed(0) + '%';
    $('res').classList.remove('is-on');
    syncButtons();
    startFade();
    draw();
  }

  function thumbSvg(s) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '-6 -6 112 112');
    svg.setAttribute('aria-hidden', 'true');
    const p = document.createElementNS(ns, 'path');
    p.setAttribute('d', s.d);
    p.setAttribute('fill', 'none');
    p.setAttribute('stroke', 'currentColor');
    p.setAttribute('stroke-width', '5');
    p.setAttribute('stroke-linecap', 'round');
    p.setAttribute('stroke-linejoin', 'round');
    svg.append(p);
    return svg;
  }

  function buildGrid() {
    const grid = $('grid');
    const tabs = $('cats');
    Object.entries(CATS).forEach(([k, label]) => {
      const b = document.createElement('button'); b.type = 'button'; b.dataset.c = k; b.textContent = label;
      b.addEventListener('click', () => { catF = k; paintGrid(); Curio.beep(600, .03, 'sine', .04); });
      tabs.append(b);
    });
    SHAPES.forEach((s, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'tr-tile';
      b.setAttribute('aria-label', `Trace ${s.name}`);
      b.append(thumbSvg(s));
      const n = document.createElement('span'); n.textContent = s.name;
      const em = document.createElement('em');
      const st = document.createElement('i'); st.className = 'tr-st';
      b.append(st, n, em);
      b.addEventListener('click', () => { load(i); board.scrollIntoView({ behavior: 'smooth', block: 'center' }); Curio.beep(520, .05, 'sine', .07); });
      grid.append(b);
    });
  }
  function paintGrid() {
    let done = 0, stars = 0;
    $('cats').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.c === catF)));
    [...$('grid').children].forEach((b, i) => {
      const v = Curio.getBest(`${SHAPES[i].id}:${fade ? 'mem' : 'std'}`);
      b.setAttribute('aria-current', String(i === idx));
      b.hidden = catF !== 'all' && SHAPES[i].cat !== catF;
      b.querySelector('em').textContent = v == null ? '' : Number(v).toFixed(0) + '%';
      const k = v == null ? 0 : starsFor(v);
      b.querySelector('.tr-st').textContent = v == null ? '' : '★'.repeat(k) + '☆'.repeat(3 - k);
      b.classList.toggle('is-gold', v != null && v >= 90);
      if (v != null) { done++; stars += k; }
    });
    $('tally').textContent = `${done} of ${SHAPES.length} traced${fade ? ' from memory' : ''} · ${stars}/${SHAPES.length * 3} ★`;
    totalStars = stars;
    renderStats();
  }

  $('prev').addEventListener('click', () => { if (!daily) load(idx - 1); });
  $('nextS').addEventListener('click', () => { if (!daily) load(idx + 1); });
  $('rnd').addEventListener('click', () => { if (daily) return; let j; do { j = Curio.randInt(0, SHAPES.length - 1); } while (j === idx); load(j); });
  $('go').addEventListener('click', () => { if (daily) dailyNext(); else load(idx + 1); });
  $('retry').addEventListener('click', reset);
  $('clear').addEventListener('click', reset);
  $('done').addEventListener('click', finish);
  $('undo').addEventListener('click', () => { strokes.pop(); recomputeCover(); syncButtons(); draw(); });
  $('daily').addEventListener('click', () => (daily ? stopDaily() : startDaily()));
  const fadeBtn = $('fade');
  fadeBtn.setAttribute('aria-pressed', String(fade));
  fadeBtn.addEventListener('click', () => {
    fade = !fade; Curio.store.set('tr-fade', fade);
    fadeBtn.setAttribute('aria-pressed', String(fade));
    Curio.toast(fade ? 'Memory mode: the outline vanishes after 2 seconds' : 'Memory mode off');
    reset(); paintGrid();
  });
  Curio.drag(cv, { start: (q) => down(q.event), move: (q) => move(q.event), end: () => up() });
  if (matchMedia('(pointer: fine)').matches && !Curio.touchpad && !Curio.store.get('tr-tp-tip', false)) { Curio.store.set('tr-tp-tip', true); setTimeout(() => Curio.toast('Tip: on a touchpad, turn on Touchpad mode in the top bar', 4000), 1200); }
  cv.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
  window.addEventListener('resize', resize);
  window.addEventListener('curio:theme', () => { applyPaper(); draw(); });
  window.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea')) return;
    if (document.querySelector('.curio-modal')) return;
    if (e.key === 'ArrowRight' && !daily) load(idx + 1);
    else if (e.key === 'ArrowLeft' && !daily) load(idx - 1);
    else if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey) reset();
    else if ((e.key === 'm' || e.key === 'M') && !daily) $('fade').click();
    else if (e.key === 'Enter' && state === 'done') $('go').click();
    else if (e.key === 'Enter' && !$('done').disabled) finish();
    else if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); if (!$('undo').disabled) $('undo').click(); }
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && tStart && state !== 'done') tick(); });

  const CATS = { all: 'All', shapes: 'Shapes', curves: 'Curves', letters: 'Letters', objects: 'Objects', animals: 'Animals', nature: 'Nature' };
  let catF = 'all', totalStars = 0, daily = null;
  const starsFor = (v) => (v >= 95 ? 3 : v >= 85 ? 2 : v >= 70 ? 1 : 0);
  const stats = Object.assign({ v: 1, traces: 0, daily: {}, best: 0 }, Curio.store.get('tr-stats', {}) || {});
  if (!stats.daily || typeof stats.daily !== 'object') stats.daily = {};
  let badges = Curio.store.get('tr-badges', []) || [];
  const today = new Date().toISOString().slice(0, 10);
  function countUp(el, target) {
    const t0 = performance.now(), dur = 700;
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = (target * e).toFixed(1) + '%';
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  const BADGES = [
    { id: 'first', icon: '✏️', name: 'First trace', d: 'Score any shape' },
    { id: 'ninety', icon: '🎯', name: 'Steady hand', d: 'Score 90% or more' },
    { id: 'surgeon', icon: '🩺', name: 'Surgeon', d: 'Score 98% or more' },
    { id: 'ten', icon: '🔟', name: 'Warming up', d: 'Trace 10 different shapes' },
    { id: 'fifty', icon: '🗂️', name: 'Collector', d: 'Trace 50 different shapes' },
    { id: 'all', icon: '🏁', name: 'Completionist', d: 'Trace every shape' },
    { id: 'memory', icon: '🧠', name: 'Photographic', d: 'Score 85% in memory mode' },
    { id: 'tricky', icon: '🌀', name: 'Tricky stuff', d: 'Score 85% on a tricky shape' },
    { id: 'daily', icon: '📅', name: 'Daily tracer', d: 'Finish a Daily Five' },
    { id: 'daily450', icon: '🏆', name: 'Daily champion', d: 'Score 450+ in a Daily Five' },
    { id: 'stars50', icon: '⭐', name: 'Star gazer', d: 'Collect 50 stars' },
    { id: 'stars150', icon: '🌟', name: 'Constellation', d: 'Collect 150 stars' }
  ];
  function badge(id) {
    if (badges.includes(id)) return;
    badges.push(id); Curio.store.set('tr-badges', badges);
    const b = BADGES.find((x) => x.id === id);
    if (b) setTimeout(() => { Curio.toast(`${b.icon} Badge: ${b.name}`, 2400); [784, 988, 1318].forEach((f, i) => setTimeout(() => Curio.beep(f, .1, 'triangle', .06), i * 80)); }, 700);
    renderBadges();
  }
  function renderBadges() {
    const el = $('badges'); el.innerHTML = '';
    BADGES.forEach((b) => {
      const d = document.createElement('div'); d.className = 'tr-badge' + (badges.includes(b.id) ? ' got' : '');
      d.innerHTML = `<i aria-hidden="true">${b.icon}</i><div><b></b><span></span></div>`;
      d.querySelector('b').textContent = b.name; d.querySelector('span').textContent = b.d;
      el.append(d);
    });
    renderStats();
  }
  function renderStats() {
    const el = $('stats2'); if (!el) return;
    el.innerHTML = [[stats.traces, 'Traces'], [`${totalStars}`, 'Stars'], [`${Math.round(stats.best)}%`, 'Best ever'], [stats.daily[today] != null ? stats.daily[today] : '-', "Today's Daily Five"], [`${badges.length}/${BADGES.length}`, 'Badges']]
      .map(([v, l]) => `<div class="c-stat"><b>${v}</b><span>${l}</span></div>`).join('');
  }
  function afterScore(s) {
    stats.traces++; stats.best = Math.max(stats.best, s);
    Curio.store.set('tr-stats', stats);
    badge('first');
    if (s >= 90) badge('ninety');
    if (s >= 98) badge('surgeon');
    if (fade && s >= 85) badge('memory');
    if (SHAPES[idx].lvl === 3 && s >= 85) badge('tricky');
    const traced = SHAPES.filter((sh) => Curio.getBest(`${sh.id}:std`) != null || Curio.getBest(`${sh.id}:mem`) != null).length;
    if (traced >= 10) badge('ten');
    if (traced >= 50) badge('fifty');
    if (traced >= SHAPES.length) badge('all');
    setTimeout(() => { if (totalStars >= 50) badge('stars50'); if (totalStars >= 150) badge('stars150'); }, 50);
    if (daily) {
      daily.scores[daily.i] = s;
      $('go').textContent = daily.i < 4 ? 'Next daily shape ›' : 'See results ›';
    }
  }
  function seeded(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } let a = h >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function startDaily() {
    const r = seeded('trace-' + today), pool = SHAPES.map((_, i) => i);
    const picks = [];
    [1, 1, 2, 2, 3].forEach((lv) => { const c = pool.filter((i) => SHAPES[i].lvl === lv && !picks.includes(i)); picks.push(c[Math.floor(r() * c.length)]); });
    if (fade) { fade = false; $('fade').setAttribute('aria-pressed', 'false'); }
    daily = { picks, i: 0, scores: [], prevIdx: idx };
    $('daily').setAttribute('aria-pressed', 'true'); $('daily').textContent = '✕ Quit daily';
    Curio.toast('Daily Five: five shapes, everyone gets the same ones today');
    load(picks[0]);
  }
  function stopDaily() {
    const back = daily ? daily.prevIdx : idx;
    daily = null;
    $('daily').setAttribute('aria-pressed', 'false'); $('daily').textContent = '📅 Daily Five';
    $('go').textContent = 'Next shape ›';
    load(back);
  }
  async function dailyNext() {
    if (daily.i < 4) { daily.i++; load(daily.picks[daily.i]); return; }
    const total = Math.round(daily.scores.reduce((a, b) => a + (b || 0), 0));
    const prev = stats.daily[today];
    if (prev == null || total > prev) stats.daily[today] = total;
    Curio.store.set('tr-stats', stats);
    badge('daily'); if (total >= 450) badge('daily450');
    if (total >= 400) Curio.confetti(140);
    const sq = daily.scores.map((v) => (v >= 95 ? '🟩' : v >= 85 ? '🟨' : v >= 70 ? '🟧' : '🟥')).join('');
    const names = daily.picks.map((i) => SHAPES[i].emoji).join(' ');
    const share = `✏️ Zoble Trace It Daily Five ${today}: ${total}/500\n${sq}\n${names}`;
    const v = await Curio.modal({ emoji: '📅', title: `Daily Five: ${total}/500`, body: `${daily.scores.map((v, i) => `${SHAPES[daily.picks[i]].emoji} ${Math.round(v)}%`).join('  ·  ')}${prev != null && total <= prev ? `  (today's best: ${prev})` : ''}`, buttons: [{ label: 'Copy result', value: 'share' }, { label: 'Done', value: 'done' }] });
    if (v === 'share') { try { await navigator.clipboard.writeText(share); Curio.toast('Result copied 📋'); } catch { Curio.toast('Copy failed'); } }
    stopDaily();
    renderStats();
  }

  applyPaper();
  buildGrid();
  renderBadges();
  resize();
  load(idx);
  window.__trace = {
    get state() { return state; },
    get result() { return result; },
    screenPath() {
      const b = cv.getBoundingClientRect();
      const k = b.width / size;
      return samples.map((p) => { const s = toScreen(p); return [b.left + s.x * k, b.top + s.y * k]; });
    },
    shapeCount: SHAPES.length,
    load
  };
})();
