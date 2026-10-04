(() => {
  const LW = 800, LH = 600, TAU = Math.PI * 2;
  const PR = window.ONE_LINE_PROMPTS;
  const INKS = [['ink', 'Ink'], ['#ff5a36', 'Tomato'], ['#2f6fed', 'Blue'], ['#13a86b', 'Green'], ['#9b51e0', 'Violet'], ['#ff4fa3', 'Pink'], ['#f2a900', 'Gold'], ['#00b8d9', 'Cyan']];
  const STYLES = ['ink', 'brush', 'neon', 'rainbow', 'crayon'];
  const SPEEDS = [0.5, 1, 2, 4, 8, 16];
  const CAPTIONS = {
    short: ['Minimalism. Bold choice.', 'A lot is left to the imagination.', 'Short, sweet, mysterious.', 'Picasso would call that a warm-up.'],
    mid: ['Recognisable! Probably!', 'That has real charm.', 'Confident line, no regrets.', 'A gallery would hang that. Sideways, maybe.'],
    long: ['Wow, that line went on a journey.', 'Not one lift. Respect.', 'The pen did a marathon.', 'Absolutely committed to the bit.'],
    epic: ['That is basically a tapestry.', 'Your pen needs a holiday.', 'Is that a drawing or a map of your commute?', 'Unbroken and unhinged. We love it.']
  };
  const $ = (id) => document.getElementById(id);
  const board = $('board'), cv = $('cv'), g = cv.getContext('2d');
  const live = $('live'), capEl = $('cap'), statsEl = $('stats'), prog = $('prog'), timerEl = $('timer');
  const btnReplay = $('replay'), btnKeep = $('keep'), btnPng = $('png');
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const capitalise = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  let mode = Curio.store.get('ol-mode', 'prompt');
  if (!['prompt', 'speed', 'dots', 'free'].includes(mode)) mode = 'prompt';
  let diff = Curio.store.get('ol-diff', 'medium');
  if (!PR[diff]) diff = 'medium';
  let prompt = Curio.pick(PR[diff]);
  let ink = Curio.store.get('ol-ink', 'ink');
  let style = Curio.store.get('ol-style', 'ink');
  if (!STYLES.includes(style)) style = 'ink';
  let width = Curio.store.get('ol-width', 6);
  if (Curio.simple) { mode = 'prompt'; diff = 'easy'; prompt = Curio.pick(PR.easy); style = 'rainbow'; width = 8; }
  let speedIdx = Curio.store.get('ol-speed', 2);
  let gallery = Curio.store.get('ol-gallery', []);
  if (!Array.isArray(gallery)) gallery = [];
  const stats = Object.assign({ v: 1, drawings: 0, ink: 0, longest: 0, rounds: 0, dots: {}, styles: [], dotBest: 0 }, Curio.store.get('ol-stats', {}) || {});
  if (!Array.isArray(stats.styles)) stats.styles = [];
  if (!stats.dots || typeof stats.dots !== 'object') stats.dots = {};
  let badges = Curio.store.get('ol-badges', []) || [];
  const saveStats = () => Curio.store.set('ol-stats', stats);

  let pts = [], state = 'idle', pid = null, t0 = 0, scale = 1, dpr = 1, shown = null, anim = null, kept = false;
  const sparks = [];

  const paper = () => (Curio.isDark() ? '#1d1b18' : '#fffdf7');
  const inkColor = (k) => (k === 'ink' ? (Curio.isDark() ? '#f3eee7' : '#1d1b19') : k);
  function applyPaper() { document.documentElement.style.setProperty('--paper', paper()); }
  let grain = null;
  function makeGrain() {
    const c = document.createElement('canvas'); c.width = c.height = 160;
    const x = c.getContext('2d'), img = x.createImageData(160, 160);
    for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 11; }
    x.putImageData(img, 0, 0); grain = c;
  }
  makeGrain();

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = board.clientWidth, h = board.clientHeight;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    scale = w / LW;
    if (anim) return;
    render();
  }

  function segs(list, n, tip, fn) {
    if (n < 2 && !tip) return;
    let prev = { x: list[0].x, y: list[0].y };
    for (let i = 1; i < n; i++) {
      const a = list[i], b = i + 1 < n ? list[i + 1] : (tip || null);
      const end = b ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } : { x: a.x, y: a.y };
      fn(prev, a, end, i);
      prev = end;
    }
    if (tip) fn(prev, prev, tip, n);
  }
  function strokeSmooth(c, list, n, tip) {
    if (!list.length || n < 1) return;
    c.beginPath(); c.moveTo(list[0].x, list[0].y);
    if (n === 1 && !tip) { c.lineTo(list[0].x + .01, list[0].y); c.stroke(); return; }
    segs(list, n, tip, (p, ctl, e) => c.quadraticCurveTo(ctl.x, ctl.y, e.x, e.y));
    c.stroke();
  }
  function drawLine(c, d, n, tip) {
    const list = d.pts, w = d.width, col = inkColor(d.ink), st = d.style || 'ink';
    c.lineCap = 'round'; c.lineJoin = 'round';
    if (st === 'neon') {
      c.save(); c.strokeStyle = d.ink === 'ink' ? '#00e5ff' : col; c.lineWidth = w; c.shadowColor = c.strokeStyle; c.shadowBlur = 8 + w * 2.2;
      strokeSmooth(c, list, n, tip); strokeSmooth(c, list, n, tip);
      c.shadowBlur = 0; c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = Math.max(1.2, w * .35); strokeSmooth(c, list, n, tip);
      c.restore(); return;
    }
    if (st === 'rainbow') {
      let len = 0;
      segs(list, n, tip, (p, ctl, e) => {
        len += Math.hypot(e.x - p.x, e.y - p.y);
        c.strokeStyle = `hsl(${(len * .45) % 360} 85% ${Curio.isDark() ? 62 : 52}%)`; c.lineWidth = w;
        c.beginPath(); c.moveTo(p.x, p.y); c.quadraticCurveTo(ctl.x, ctl.y, e.x, e.y); c.stroke();
      });
      return;
    }
    if (st === 'brush') {
      let ww = w;
      c.strokeStyle = col;
      segs(list, n, tip, (p, ctl, e, i) => {
        const a = list[Math.min(i, list.length - 1)], b = list[Math.max(0, i - 1)];
        const dt = Math.max(1, a.t - b.t), v = Math.hypot(a.x - b.x, a.y - b.y) / dt;
        const target = w * clamp(2.1 - v * 1.4, .35, 2.1);
        ww += (target - ww) * .35;
        c.lineWidth = ww; c.beginPath(); c.moveTo(p.x, p.y); c.quadraticCurveTo(ctl.x, ctl.y, e.x, e.y); c.stroke();
      });
      return;
    }
    if (st === 'crayon') {
      c.save(); c.strokeStyle = col;
      [[0, 0, .55], [1.2, -.8, .35], [-1, 1, .35]].forEach(([ox, oy, al], k) => {
        c.globalAlpha = al; c.lineWidth = w * (k ? .7 : 1); c.setLineDash([w * .9, w * .35 + k]); c.lineDashOffset = k * 3;
        c.save(); c.translate(ox, oy); strokeSmooth(c, list, n, tip); c.restore();
      });
      c.restore(); return;
    }
    c.strokeStyle = col; c.lineWidth = w; strokeSmooth(c, list, n, tip);
  }

  function current() { return shown || { pts, ink, width, style }; }

  function paintPaper(c, w, h) {
    c.fillStyle = paper(); c.fillRect(0, 0, w, h);
    if (grain) { c.save(); c.globalAlpha = Curio.isDark() ? .5 : .9; c.fillStyle = c.createPattern(grain, 'repeat'); c.fillRect(0, 0, w, h); c.restore(); }
  }
  function render(upto, tip) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    paintPaper(g, cv.width, cv.height);
    g.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    if (mode !== 'dots' || shown) { g.strokeStyle = Curio.isDark() ? 'rgba(255,120,120,.12)' : 'rgba(230,80,80,.16)'; g.lineWidth = 2; g.beginPath(); g.moveTo(64, 0); g.lineTo(64, LH); g.stroke(); }
    if (mode === 'dots' && !shown) drawDots(g);
    const d = current();
    if (!d.pts.length) return;
    const n = upto == null ? d.pts.length : upto;
    drawLine(g, d, n, tip);
    if (state === 'drawing' && d.pts.length) {
      const p = d.pts[d.pts.length - 1];
      g.fillStyle = d.style === 'neon' ? '#fff' : inkColor(d.ink);
      g.beginPath(); g.arc(p.x, p.y, d.width * .9, 0, TAU); g.fill();
    }
    if (tip) drawTip(g, tip, d);
    burst.forEach((b) => { g.strokeStyle = `rgba(19,168,107,${b.life})`; g.lineWidth = 3; g.beginPath(); g.arc(b.x, b.y, 24 + (1 - b.life) * 30, 0, TAU); g.stroke(); });
  }
  function drawTip(c, p, d) {
    const col = d.ink === 'ink' ? '#ffb000' : inkColor(d.ink);
    c.save();
    const r = 14 + d.width * 1.4;
    const grad = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
    grad.addColorStop(0, 'rgba(255,255,255,.95)'); grad.addColorStop(.25, col); grad.addColorStop(1, 'rgba(255,255,255,0)');
    c.globalAlpha = .9; c.fillStyle = grad; c.beginPath(); c.arc(p.x, p.y, r, 0, TAU); c.fill();
    c.globalAlpha = 1; c.shadowColor = col; c.shadowBlur = 18; c.fillStyle = '#fff';
    c.beginPath(); c.arc(p.x, p.y, Math.max(3, d.width * .55), 0, TAU); c.fill();
    c.restore();
    for (const s of sparks) { c.globalAlpha = Math.max(0, s.life); c.fillStyle = col; c.beginPath(); c.arc(s.x, s.y, 2.2 * s.life + .6, 0, TAU); c.fill(); }
    c.globalAlpha = 1;
  }

  const today = new Date().toISOString().slice(0, 10);
  function seeded(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } let a = h >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const DOTN = { easy: 6, medium: 10, hard: 15 };
  let dots = [], dotsDaily = true, dotsSeed = 0;
  const burst = [];
  function makeDots() {
    const rand = dotsDaily ? seeded(`dots-${today}-${diff}`) : Math.random;
    const n = DOTN[diff], out = [];
    for (let t = 0; out.length < n && t < 4000; t++) {
      const x = 70 + rand() * (LW - 140), y = 60 + rand() * (LH - 120);
      if (out.every((d) => Math.hypot(d.x - x, d.y - y) > 95)) out.push({ x, y, hit: false });
    }
    dots = out;
  }
  function drawDots(c) {
    const t = performance.now() / 1000;
    dots.forEach((d, i) => {
      if (d.hit) {
        c.fillStyle = '#13a86b'; c.beginPath(); c.arc(d.x, d.y, 16, 0, TAU); c.fill();
        c.strokeStyle = '#fff'; c.lineWidth = 3.5; c.beginPath(); c.moveTo(d.x - 6, d.y); c.lineTo(d.x - 1, d.y + 5); c.lineTo(d.x + 7, d.y - 5); c.stroke();
      } else {
        const pulse = 1 + Math.sin(t * 3 + i) * .08;
        c.fillStyle = Curio.isDark() ? 'rgba(80,140,255,.18)' : 'rgba(47,111,237,.12)'; c.beginPath(); c.arc(d.x, d.y, 26 * pulse, 0, TAU); c.fill();
        c.fillStyle = '#2f6fed'; c.beginPath(); c.arc(d.x, d.y, 11, 0, TAU); c.fill();
        c.fillStyle = '#fff'; c.beginPath(); c.arc(d.x - 3, d.y - 3, 3, 0, TAU); c.fill();
      }
    });
  }
  function checkDots(p) {
    let any = false;
    dots.forEach((d) => {
      if (!d.hit && Math.hypot(d.x - p.x, d.y - p.y) < 24) {
        d.hit = true; any = true;
        const k = dots.filter((x) => x.hit).length;
        Curio.beep(440 * Math.pow(2, k / 12 * 2), .08, 'triangle', .07);
        burst.push({ x: d.x, y: d.y, life: 1 });
        if (navigator.vibrate) try { navigator.vibrate(8); } catch {}
      }
    });
    return any;
  }

  function pos(e) { const b = cv.getBoundingClientRect(); return { x: (e.clientX - b.left) / b.width * LW, y: (e.clientY - b.top) / b.height * LH }; }
  function stopAnim() { if (anim) { cancelAnimationFrame(anim.raf); anim = null; prog.style.width = '0'; sparks.length = 0; } stopShow(); }

  let speed = null;
  function start(e) {
    if (state === 'drawing') return;
    if (mode === 'speed' && (!speed || speed.wait)) { if (!speed) startSpeed(); return; }
    e.preventDefault();
    stopAnim();
    pid = e.pointerId;
    cv.setPointerCapture?.(pid);
    shown = null; kept = false; pts = [];
    if (mode === 'dots') dots.forEach((d) => { d.hit = false; });
    t0 = performance.now();
    const p = pos(e);
    pts.push({ x: p.x, y: p.y, t: 0 });
    if (mode === 'dots') checkDots(p);
    state = 'drawing';
    board.classList.add('is-busy');
    capEl.textContent = ''; statsEl.textContent = '';
    setButtons();
    Curio.beep(520, .05, 'triangle', .06);
    render();
  }
  function move(e) {
    if (state !== 'drawing') return;
    const list = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
    for (const ev of (list.length ? list : [e])) {
      const p = pos(ev), l = pts[pts.length - 1];
      if (Math.hypot(p.x - l.x, p.y - l.y) < 1.6) continue;
      const q = { x: clamp(p.x, -20, LW + 20), y: clamp(p.y, -20, LH + 20), t: performance.now() - t0 };
      if (mode === 'dots') { const steps = Math.ceil(Math.hypot(q.x - l.x, q.y - l.y) / 8); for (let s = 1; s <= steps; s++) checkDots({ x: l.x + (q.x - l.x) * s / steps, y: l.y + (q.y - l.y) * s / steps }); }
      pts.push(q);
    }
    live.textContent = mode === 'dots' ? `${dots.filter((d) => d.hit).length}/${dots.length} dots` : `${Math.round(lengthOf(pts) / 10) / 10} m of ink`;
    render();
  }
  function end() {
    pid = null;
    if (state !== 'drawing') return;
    state = 'done';
    live.textContent = '';
    const len = lengthOf(pts);
    if (len < 40) {
      state = 'idle'; pts = [];
      board.classList.remove('is-busy');
      capEl.textContent = 'That was more of a dot. Keep the pen down and draw!';
      pop(capEl);
      Curio.beep(180, .15, 'square', .06);
      if (mode === 'dots') dots.forEach((d) => { d.hit = false; });
      render(); setButtons();
      return;
    }
    Curio.beep(660, .08, 'triangle', .1);
    setTimeout(() => Curio.beep(880, .12, 'triangle', .09), 90);
    const ms = pts[pts.length - 1].t;
    stats.drawings++; stats.ink += len / 100; stats.longest = Math.max(stats.longest, len / 100);
    if (!stats.styles.includes(style)) stats.styles.push(style);
    saveStats();
    badge('first');
    if (stats.drawings >= 25) badge('d25');
    if (len / 100 >= 60) badge('marathon');
    if (ms < 2500 && mode !== 'dots') badge('quick');
    if (stats.styles.length >= STYLES.length) badge('styles');
    if (mode === 'dots') finishDots(len, ms);
    else if (mode === 'speed') finishSpeed(len, ms);
    else finishCaption(len, ms);
    setButtons(); render(); renderStats();
    if (mode !== 'speed') setTimeout(() => { if (state === 'done' && !anim) replay(); }, 450);
  }
  function lengthOf(list) { let s = 0; for (let i = 1; i < list.length; i++) s += Math.hypot(list[i].x - list[i - 1].x, list[i].y - list[i - 1].y); return s; }
  function pop(el) { el.classList.remove('is-in'); void el.offsetWidth; el.classList.add('is-in'); }
  function finishCaption(len, ms) {
    const tier = len < 900 ? 'short' : len < 3000 ? 'mid' : len < 7000 ? 'long' : 'epic';
    const subject = mode === 'free' ? 'Your masterpiece' : capitalise(prompt[1]);
    capEl.textContent = `${subject}. ${Curio.pick(CAPTIONS[tier])}`;
    pop(capEl);
    statsEl.textContent = `${Curio.fmt(len / 100, 1)} m of line · ${Curio.fmt(ms / 1000, 1)} s · ${Curio.fmt(len / Math.max(.3, ms / 1000) / 100, 1)} m/s`;
  }
  function finishDots(len, ms) {
    const hits = dots.filter((d) => d.hit).length, n = dots.length, all = hits === n;
    const score = hits * 100 + (all ? Math.max(0, Math.round(600 - ms / 1000 * 25 - len / 30)) : 0);
    const key = `${today}-${diff}`;
    let isBest = false;
    if (dotsDaily) { if (score > (stats.dots[key] || 0)) { stats.dots[key] = score; isBest = true; } badge('daily'); }
    if (score > stats.dotBest) { stats.dotBest = score; isBest = true; }
    saveStats();
    capEl.textContent = all ? `All ${n} dots! ${isBest ? 'New best!' : 'Smooth.'}` : hits >= n - 2 ? `${hits} of ${n}. So close!` : `${hits} of ${n} dots. The rest are still waiting.`;
    pop(capEl);
    statsEl.textContent = `Score ${score} · ${Curio.fmt(ms / 1000, 1)} s · ${Curio.fmt(len / 100, 1)} m of ink${dotsDaily ? ` · today's best ${stats.dots[key] || 0}` : ''}`;
    if (all) { Curio.confetti(110); badge('dots'); if (diff === 'hard') badge('dotshard'); [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => Curio.beep(f, .12, 'triangle', .07), i * 100)); }
    lastShare = `🔵 Zoble One Line Dot Run${dotsDaily ? ` ${today}` : ''} (${diff}): ${hits}/${n} dots, score ${score}\n${dots.map((d) => (d.hit ? '🟢' : '⚪')).join('')}`;
    $('next').textContent = '📋 Share';
  }
  let lastShare = '';

  const SPEED_T = { easy: 15, medium: 12, hard: 10 };
  function startSpeed() {
    stopAnim();
    const pool = Curio.shuffle(PR[diff].slice()).slice(0, 5);
    speed = { pool, i: 0, results: [], wait: false, deadline: 0, raf: 0 };
    nextSpeed();
  }
  function nextSpeed() {
    if (speed.i >= 5) { endSpeed(); return; }
    pts = []; shown = null; state = 'idle'; kept = false;
    prompt = speed.pool[speed.i];
    setPrompt(prompt);
    capEl.textContent = `Prompt ${speed.i + 1} of 5`; pop(capEl); statsEl.textContent = '';
    board.classList.remove('is-busy');
    speed.wait = false;
    speed.deadline = performance.now() + SPEED_T[diff] * 1000;
    render(); setButtons();
    Curio.beep(700, .08, 'square', .05);
    tickSpeed();
  }
  function tickSpeed() {
    if (!speed || speed.wait) return;
    const left = Math.max(0, speed.deadline - performance.now()) / 1000;
    timerEl.textContent = left.toFixed(1);
    timerEl.classList.toggle('low', left < 3);
    if (left <= 0) {
      if (state === 'drawing') end();
      if (speed && !speed.wait) { speed.results.push({ p: prompt, pts: [] }); speed.i++; speed.wait = true; capEl.textContent = 'Time! Skipped.'; pop(capEl); Curio.beep(160, .2, 'sawtooth', .05); setTimeout(nextSpeed, 900); }
      return;
    }
    speed.raf = requestAnimationFrame(tickSpeed);
  }
  function finishSpeed(len, ms) {
    speed.results.push({ p: prompt, pts: pts.slice(), ink, width, style });
    speed.i++; speed.wait = true;
    capEl.textContent = `${capitalise(prompt[1])}, done in ${Curio.fmt(ms / 1000, 1)} s!`; pop(capEl);
    statsEl.textContent = `${Curio.fmt(len / 100, 1)} m of line`;
    timerEl.textContent = '';
    setTimeout(nextSpeed, 1000);
  }
  async function endSpeed() {
    timerEl.textContent = ''; timerEl.classList.remove('low');
    const res = speed.results; speed = null;
    stats.rounds++; saveStats(); badge('speed');
    const done = res.filter((r) => r.pts.length).length;
    if (done === 5) { Curio.confetti(90); badge('speed5'); }
    const box = document.createElement('div');
    const p = document.createElement('p'); p.style.margin = '0 0 4px'; p.textContent = `${done} of 5 drawn before the buzzer.`;
    const sheet = document.createElement('div'); sheet.className = 'ol-sheet';
    res.forEach((r) => {
      const f = document.createElement('figure'); const c = document.createElement('canvas');
      thumb(c, { ink: r.ink || 'ink', w: r.width || 6, s: r.style, d: pack(r.pts) });
      const fc = document.createElement('figcaption'); fc.textContent = `${r.p[0]} ${r.p[1]}`;
      f.append(c, fc); sheet.append(f);
    });
    box.append(p, sheet);
    const v = await Curio.modal({ emoji: '⏱️', title: 'Speed round complete', body: box, buttons: [{ label: 'Play again', value: 'again' }, { label: 'Keep all', value: 'keep' }, { label: 'Done', value: 'x' }] });
    if (v === 'keep') {
      res.filter((r) => r.pts.length).forEach((r, i) => gallery.unshift({ id: Date.now() + i, p: r.p[1], e: r.p[0], ink: r.ink, w: r.width, s: r.style, d: pack(r.pts) }));
      gallery = gallery.slice(0, 60); Curio.store.set('ol-gallery', gallery); renderGallery(); Curio.toast('Saved to your gallery');
    }
    clearBoard();
    if (v === 'again') startSpeed();
    else { capEl.textContent = 'Press Start for another round'; setPrompt(prompt); }
    renderStats();
  }

  function replayTimes(list) { const out = [0]; for (let i = 1; i < list.length; i++) out.push(out[i - 1] + Math.min(250, Math.max(0, list[i].t - list[i - 1].t))); return out; }
  function replay(onDone) {
    const d = current();
    if (d.pts.length < 2) return;
    if (anim) { cancelAnimationFrame(anim.raf); anim = null; }
    const times = replayTimes(d.pts), total = times[times.length - 1];
    const startAt = performance.now();
    let lastNow = startAt, i = 1, lastTick = 0;
    board.classList.add('is-busy');
    anim = { raf: 0 };
    const step = (now) => {
      if (!anim) return;
      const T = (now - startAt) * SPEEDS[speedIdx];
      const dt = Math.min(50, now - lastNow) / 1000; lastNow = now;
      while (i < times.length && times[i] <= T) i++;
      let tip;
      if (i >= times.length) tip = null;
      else {
        const a = d.pts[i - 1], b = d.pts[i], f = (T - times[i - 1]) / Math.max(1, times[i] - times[i - 1]);
        tip = { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
        if (Math.random() < .7) sparks.push({ x: tip.x, y: tip.y, vx: Curio.rand(-60, 60), vy: Curio.rand(-60, 60), life: 1 });
        if (now - lastTick > 70) { lastTick = now; Curio.beep(1200 - (tip.y / LH) * 400, .015, 'sine', .015); }
      }
      for (let k = sparks.length - 1; k >= 0; k--) { const s = sparks[k]; s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt * 2.2; if (s.life <= 0) sparks.splice(k, 1); }
      prog.style.width = `${Math.min(100, (T / Math.max(1, total)) * 100)}%`;
      if (!tip) {
        anim = null; sparks.length = 0; prog.style.width = '0';
        render(); Curio.beep(1046, .12, 'triangle', .08);
        if (onDone) onDone();
        return;
      }
      render(i, tip);
      anim.raf = requestAnimationFrame(step);
    };
    anim.raf = requestAnimationFrame(step);
  }

  let show = null;
  function stopShow() { if (show) { clearTimeout(show.t); show = null; $('show').textContent = '🎞️ Exhibition'; } }
  function startShow() {
    if (show) { stopAnim(); return; }
    if (!gallery.length) { Curio.toast('Keep a few drawings first'); return; }
    if (anim) { cancelAnimationFrame(anim.raf); anim = null; }
    show = { i: 0, t: 0 };
    $('show').textContent = '⏹ Stop';
    board.scrollIntoView({ behavior: 'smooth', block: 'center' });
    badge('show');
    const playOne = () => {
      if (!show) return;
      const e = gallery[show.i % gallery.length];
      state = 'done';
      shown = { pts: unpack(e.d), ink: e.ink, width: e.w, style: e.s || 'ink', label: e.p || 'free' };
      capEl.textContent = `${e.e || ''} ${e.p ? capitalise(e.p) : 'A free drawing'} · ${show.i % gallery.length + 1}/${gallery.length}`; pop(capEl);
      statsEl.textContent = '';
      replay(() => { if (!show) return; show.i++; show.t = setTimeout(playOne, 900); });
    };
    playOne();
  }

  function setButtons() {
    const has = current().pts.length > 1 && state !== 'drawing';
    btnReplay.disabled = !has;
    btnPng.disabled = !has;
    btnKeep.disabled = !has || kept || !!shown || mode === 'speed';
    btnKeep.textContent = kept ? '✓ Kept' : '⭐ Keep';
  }
  function pack(list) { const out = []; for (const p of list) out.push(Math.round(p.x), Math.round(p.y), Math.round(p.t)); return out; }
  function unpack(arr) { const out = []; for (let i = 0; i + 2 < arr.length; i += 3) out.push({ x: arr[i], y: arr[i + 1], t: arr[i + 2] }); return out; }
  function keep() {
    if (kept || pts.length < 2 || mode === 'speed') return;
    const label = mode === 'free' ? null : mode === 'dots' ? `Dot Run (${dots.filter((d) => d.hit).length}/${dots.length})` : prompt[1];
    const entry = { id: Date.now(), p: label, e: mode === 'free' ? '✏️' : mode === 'dots' ? '🔵' : prompt[0], ink, w: width, s: style, d: pack(pts) };
    gallery.unshift(entry); gallery = gallery.slice(0, 60);
    Curio.store.set('ol-gallery', gallery);
    kept = true; setButtons(); renderGallery();
    Curio.toast('Saved to your gallery');
    Curio.beep(784, .08, 'triangle', .1); setTimeout(() => Curio.beep(1175, .12, 'triangle', .08), 80);
    if (gallery.length === 5 || gallery.length === 10) Curio.confetti();
    if (gallery.length >= 10) badge('gallery');
  }
  function savePng() {
    const d = current();
    if (d.pts.length < 2) return;
    const c = document.createElement('canvas'); c.width = LW * 2; c.height = LH * 2;
    const x = c.getContext('2d');
    paintPaper(x, c.width, c.height);
    x.setTransform(2, 0, 0, 2, 0, 0);
    drawLine(x, d, d.pts.length);
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.font = '700 22px system-ui, sans-serif'; x.fillStyle = Curio.isDark() ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.3)';
    x.fillText('One Line · Zoble', 24, c.height - 24);
    const a = document.createElement('a');
    a.download = `one-line-${(d.label || (mode === 'free' ? 'drawing' : prompt[1])).replace(/[^a-z]+/gi, '-')}.png`;
    a.href = c.toDataURL('image/png'); a.click();
    Curio.beep(600, .06, 'triangle', .08);
  }
  function thumb(c, entry) {
    const w = 320, h = 240; c.width = w; c.height = h;
    const x = c.getContext('2d');
    paintPaper(x, w, h);
    x.setTransform(w / LW, 0, 0, h / LH, 0, 0);
    const list = unpack(entry.d);
    if (list.length) drawLine(x, { pts: list, ink: entry.ink, width: Math.max(entry.w, 5), style: entry.s }, list.length);
  }
  function renderGallery() {
    const gal = $('gal'); gal.innerHTML = '';
    $('galCount').textContent = gallery.length ? `${gallery.length} saved` : '';
    if (!gallery.length) { const e = document.createElement('div'); e.className = 'ol-empty'; e.textContent = 'Nothing kept yet. Finish a drawing and press Keep to start your collection.'; gal.append(e); return; }
    gallery.forEach((entry, idx) => {
      const card = document.createElement('div'); card.className = 'ol-card'; card.style.animationDelay = Math.min(idx * 30, 400) + 'ms';
      const open = document.createElement('button'); open.type = 'button'; open.className = 'ol-open';
      open.setAttribute('aria-label', `Replay ${entry.p || 'free drawing'}`);
      const c = document.createElement('canvas'); thumb(c, entry); open.append(c);
      const meta = document.createElement('div'); meta.className = 'ol-meta';
      const name = document.createElement('b'); name.textContent = `${entry.e || ''} ${entry.p ? capitalise(entry.p) : 'Free drawing'}`;
      const date = document.createElement('span'); date.textContent = new Date(entry.id).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      meta.append(name, date);
      const del = document.createElement('button'); del.type = 'button'; del.className = 'ol-del'; del.textContent = '✕'; del.setAttribute('aria-label', 'Delete drawing');
      del.addEventListener('click', () => { gallery = gallery.filter((x) => x.id !== entry.id); Curio.store.set('ol-gallery', gallery); renderGallery(); });
      open.addEventListener('click', () => {
        stopAnim(); state = 'done';
        shown = { pts: unpack(entry.d), ink: entry.ink, width: entry.w, style: entry.s || 'ink', label: entry.p || 'free' };
        capEl.textContent = `${entry.e || ''} ${entry.p ? capitalise(entry.p) : 'A free drawing'}, from your gallery`; pop(capEl);
        statsEl.textContent = `${Curio.fmt(lengthOf(shown.pts) / 100, 1)} m of line · ${Curio.fmt(shown.pts[shown.pts.length - 1].t / 1000, 1)} s`;
        board.classList.add('is-busy'); setButtons();
        board.scrollIntoView({ behavior: 'smooth', block: 'center' });
        replay();
      });
      card.append(open, meta, del); gal.append(card);
    });
  }

  function setPrompt(p) {
    prompt = p;
    const chip = $('chip');
    $('next').style.display = mode === 'free' ? 'none' : '';
    $('diffs').style.display = mode === 'free' ? 'none' : '';
    $('next').textContent = mode === 'speed' ? '▶ Start round' : mode === 'dots' ? (dotsDaily ? '🎯 Practice layout' : '📅 Daily layout') : '🔀 New prompt';
    if (mode === 'free') { $('emo').textContent = '✏️'; $('chipLbl').textContent = 'Draw'; $('word').textContent = 'anything you like'; }
    else if (mode === 'dots') { $('emo').textContent = '🔵'; $('chipLbl').textContent = dotsDaily ? `Daily · ${today}` : 'Practice'; $('word').textContent = `Hit all ${DOTN[diff]} dots`; }
    else if (mode === 'speed' && !speed) { $('emo').textContent = '⏱️'; $('chipLbl').textContent = `5 prompts · ${SPEED_T[diff]}s each`; $('word').textContent = 'Speed round'; }
    else { $('emo').textContent = p[0]; $('chipLbl').textContent = mode === 'speed' ? `Speed ${speed.i + 1}/5` : 'Draw'; $('word').textContent = p[1]; }
    $('hintTxt').innerHTML = mode === 'dots' ? 'Pass through every blue dot<br>in one single line.' : mode === 'speed' && !speed ? 'Press Start, then draw fast.<br>The clock is ticking.' : 'Press down and keep going.<br>No lifting allowed.';
    chip.classList.remove('is-pop'); void chip.offsetWidth; chip.classList.add('is-pop');
  }
  function clearBoard() {
    stopAnim();
    pts = []; shown = null; state = 'idle'; kept = false;
    board.classList.remove('is-busy');
    capEl.textContent = ''; statsEl.textContent = ''; timerEl.textContent = '';
    if (mode === 'dots') dots.forEach((d) => { d.hit = false; });
    setButtons(); render();
  }
  function nextPrompt() {
    if (mode === 'speed') { if (!speed) startSpeed(); return; }
    if (mode === 'dots') {
      if (state === 'done' && lastShare && $('next').textContent.includes('Share')) { copy(lastShare); return; }
      dotsDaily = !dotsDaily; makeDots(); setPrompt(prompt); clearBoard(); return;
    }
    let p; do { p = Curio.pick(PR[diff]); } while (p === prompt);
    setPrompt(p); clearBoard();
    Curio.beep(440 + Math.random() * 200, .05, 'sine', .07);
  }
  async function copy(t) { try { await navigator.clipboard.writeText(t); Curio.toast('Result copied 📋'); } catch { Curio.toast('Copy failed'); } }
  function setMode(m) {
    if (speed) { cancelAnimationFrame(speed.raf); speed = null; }
    mode = Curio.simple ? 'prompt' : m; if (!Curio.simple) Curio.store.set('ol-mode', mode);
    $('modes').querySelectorAll('[data-gm]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.gm === mode)));
    if (mode === 'dots') { dotsDaily = true; makeDots(); }
    lastShare = '';
    setPrompt(prompt); clearBoard();
  }
  function setDiff(d) {
    if (speed) return;
    diff = d; Curio.store.set('ol-diff', diff);
    $('diffs').querySelectorAll('[data-d]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.d === diff)));
    if (mode === 'dots') makeDots();
    if (mode === 'prompt') prompt = Curio.pick(PR[diff]);
    setPrompt(prompt); clearBoard();
  }

  const BADGES = [
    { id: 'first', icon: '✏️', name: 'First line', d: 'Finish a drawing' },
    { id: 'd25', icon: '📒', name: 'Sketchbook', d: 'Finish 25 drawings' },
    { id: 'marathon', icon: '🏃', name: 'Marathon', d: 'Draw 60 m in one line' },
    { id: 'quick', icon: '⚡', name: 'Quick draw', d: 'Finish in under 2.5 s' },
    { id: 'styles', icon: '🎨', name: 'Pen collector', d: 'Use all five pen styles' },
    { id: 'gallery', icon: '🖼️', name: 'Curator', d: 'Keep 10 drawings' },
    { id: 'show', icon: '🎞️', name: 'Opening night', d: 'Run an exhibition' },
    { id: 'speed', icon: '⏱️', name: 'Against the clock', d: 'Finish a speed round' },
    { id: 'speed5', icon: '🏁', name: 'Beat the buzzer', d: 'Draw all 5 in a speed round' },
    { id: 'daily', icon: '📅', name: 'Daily dotter', d: 'Play the daily Dot Run' },
    { id: 'dots', icon: '🔵', name: 'Join the dots', d: 'Hit every dot' },
    { id: 'dotshard', icon: '🌌', name: 'Constellation', d: 'Hit all 15 dots on hard' }
  ];
  function badge(id) {
    if (badges.includes(id)) return;
    badges.push(id); Curio.store.set('ol-badges', badges);
    const b = BADGES.find((x) => x.id === id);
    if (b) { setTimeout(() => Curio.toast(`${b.icon} Badge: ${b.name}`, 2400), 300); setTimeout(() => [784, 988, 1318].forEach((f, i) => setTimeout(() => Curio.beep(f, .1, 'triangle', .06), i * 80)), 300); }
    renderBadges();
  }
  function renderBadges() {
    const el = $('badges'); el.innerHTML = '';
    BADGES.forEach((b) => {
      const d = document.createElement('div'); d.className = 'ol-badge' + (badges.includes(b.id) ? ' got' : '');
      d.innerHTML = `<i aria-hidden="true">${b.icon}</i><div><b></b><span></span></div>`;
      d.querySelector('b').textContent = b.name; d.querySelector('span').textContent = b.d;
      el.append(d);
    });
    renderStats();
  }
  function renderStats() {
    $('stats2').innerHTML = [[stats.drawings, 'Drawings'], [`${Curio.fmt(stats.ink, 0)} m`, 'Total ink'], [`${Curio.fmt(stats.longest, 1)} m`, 'Longest line'], [stats.rounds, 'Speed rounds'], [stats.dotBest, 'Dot Run best'], [`${badges.length}/${BADGES.length}`, 'Badges']]
      .map(([v, l]) => `<div class="c-stat"><b>${v}</b><span>${l}</span></div>`).join('');
  }

  const inks = $('inks');
  for (const [k, name] of INKS) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'ol-sw'; b.dataset.ink = k;
    b.setAttribute('aria-label', `${name} ink`); b.style.background = k === 'ink' ? 'var(--ink)' : k;
    b.addEventListener('click', () => { ink = k; Curio.store.set('ol-ink', ink); paintInks(); if (state === 'done' && !shown) render(); });
    inks.append(b);
  }
  function paintInks() { inks.querySelectorAll('.ol-sw').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.ink === ink))); }
  function setStyle(s) { style = s; Curio.store.set('ol-style', s); $('styles').querySelectorAll('[data-s]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.s === style))); if (state === 'done' && !shown) render(); Curio.beep(500 + STYLES.indexOf(s) * 90, .04, 'sine', .05); }
  $('styles').querySelectorAll('[data-s]').forEach((b) => b.addEventListener('click', () => setStyle(b.dataset.s)));
  const widthBtns = [...document.querySelectorAll('[data-w]')];
  function paintWidths() { widthBtns.forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.w === width))); }
  widthBtns.forEach((b) => b.addEventListener('click', () => { width = +b.dataset.w; Curio.store.set('ol-width', width); paintWidths(); if (state === 'done' && !shown) render(); }));
  const speedEl = $('speed');
  speedEl.value = speedIdx;
  const paintSpeed = () => { $('speedLbl').textContent = `${SPEEDS[speedIdx]}x`; };
  speedEl.addEventListener('input', () => { speedIdx = +speedEl.value; Curio.store.set('ol-speed', speedIdx); paintSpeed(); });
  $('modes').querySelectorAll('[data-gm]').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.gm)));
  $('diffs').querySelectorAll('[data-d]').forEach((b) => b.addEventListener('click', () => setDiff(b.dataset.d)));

  $('next').addEventListener('click', nextPrompt);
  $('again').addEventListener('click', () => { if (mode === 'prompt' && state === 'done') nextPrompt(); else if (mode === 'dots' && $('next').textContent.includes('Share')) { setPrompt(prompt); clearBoard(); } else if (!speed) clearBoard(); });
  $('show').addEventListener('click', startShow);
  btnReplay.addEventListener('click', () => replay());
  btnKeep.addEventListener('click', keep);
  btnPng.addEventListener('click', savePng);
  Curio.drag(cv, { start: (q) => start(q.event), move: (q) => move(q.event), end: (q) => end(q ? q.event : { pointerId: pid }) });
  if (matchMedia('(pointer: fine)').matches && !Curio.touchpad && !Curio.store.get('ol-tp-tip', false)) { Curio.store.set('ol-tp-tip', true); setTimeout(() => Curio.toast('Tip: on a touchpad, turn on Touchpad mode in the top bar', 4000), 1200); }
  cv.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
  window.addEventListener('resize', resize);
  window.addEventListener('curio:theme', () => { applyPaper(); render(); renderGallery(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopAnim(); });
  window.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, select') || document.querySelector('.curio-modal')) return;
    const k = e.key.toLowerCase();
    if (k === 'r') { if (!btnReplay.disabled) replay(); }
    else if (k === 'n') nextPrompt();
    else if (k === 'k' && Curio.advanced) keep();
    else if (/^[1-5]$/.test(k) && Curio.advanced) setStyle(STYLES[+k - 1]);
  });
  (function idle() {
    requestAnimationFrame(idle);
    if (document.hidden) return;
    let need = false;
    for (let i = burst.length - 1; i >= 0; i--) { burst[i].life -= .04; need = true; if (burst[i].life <= 0) burst.splice(i, 1); }
    if (mode === 'dots' && !shown && !anim && state !== 'drawing') need = true;
    if (need && !anim && state !== 'drawing') render();
  })();

  applyPaper();
  if (mode === 'dots') makeDots();
  $('modes').querySelectorAll('[data-gm]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.gm === mode)));
  $('diffs').querySelectorAll('[data-d]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.d === diff)));
  $('styles').querySelectorAll('[data-s]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.s === style)));
  paintInks(); paintWidths(); paintSpeed();
  setPrompt(prompt);
  renderGallery(); renderBadges();
  setButtons();
  resize();
  window.__oneLine = { get state() { return state; }, get count() { return pts.length; }, get animating() { return !!anim; } };
})();
