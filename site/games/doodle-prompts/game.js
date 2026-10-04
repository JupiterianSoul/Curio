(() => {
  const CW = 960, CH = 720, ROUND = Curio.simple ? 3 : 5, MAXS = ROUND * 5, SK = Curio.simple ? 'stars:simple' : 'stars';
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const P = window.DOODLE_PROMPTS, CRITICS = window.DOODLE_CRITICS, L = window.DOODLE_LINES;
  const COLORS = ['#1f1d1a', '#e5383b', '#ff8c1a', '#f2c200', '#2fa84f', '#1e88e5', '#7b4fd6', '#ec5fa4', '#8a5a36'];
  const cv = $('cv'), g = cv.getContext('2d');
  cv.width = CW; cv.height = CH;

  const st = Curio.store.get('doodle-prompts:settings', {});
  let secs = st.secs || 40, mode = st.mode || 'solo';
  if (Curio.simple) { secs = 45; mode = 'solo'; }
  let round = null, idx = 0, color = 0, width = 9, eraser = false;
  let timeLeft = 0, running = false, lastTick = 0, beepedAt = -1;

  function show(id) { ['sStart', 'sDraw', 'sPass', 'sGuess', 'sGallery'].forEach((s) => { $(s).hidden = s !== id; }); scrollTo(0, 0); }

  function syncStart() {
    document.querySelectorAll('[data-time]').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.time === secs)));
    document.querySelectorAll('[data-gm]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.gm === mode)));
    $('modeInfo').textContent = mode === 'solo' ? 'Draw five prompts, then a distinguished critic rates each one out of five stars.' : 'One artist draws five prompts, then friends guess what each doodle is meant to be. Critics still attend.';
    $('stRounds').textContent = Curio.store.get('doodle-prompts:rounds', 0);
    const b = Curio.getBest(SK), gb = Curio.getBest('guessed');
    $('stBest').textContent = b == null ? '-' : `${b}/${MAXS}`; $('stGuess').textContent = gb == null ? '-' : `${gb}/5`;
    const last = Curio.store.get('doodle-prompts:last', null);
    $('lastWrap').hidden = !last;
    if (last) {
      const box = $('last'); box.innerHTML = '';
      last.items.forEach((it) => { const im = document.createElement('img'); im.src = it.img; im.alt = it.prompt; im.title = it.prompt; box.append(im); });
    }
  }
  document.querySelectorAll('[data-time]').forEach((b) => b.addEventListener('click', () => { secs = +b.dataset.time; persist(); syncStart(); Curio.beep(500, .04, 'sine', .05); }));
  document.querySelectorAll('[data-gm]').forEach((b) => b.addEventListener('click', () => { mode = b.dataset.gm; persist(); syncStart(); Curio.beep(560, .04, 'sine', .05); }));
  function persist() { if (Curio.simple) return; Curio.store.set('doodle-prompts:settings', { secs, mode }); }

  function startRound() {
    const prompts = Curio.shuffle(P).slice(0, ROUND);
    round = { prompts, items: [], mode, secs, guessed: 0 };
    idx = 0; startDrawing();
  }
  function blank() { g.globalCompositeOperation = 'source-over'; g.fillStyle = '#fff'; g.fillRect(0, 0, CW, CH); }
  let stats;
  function startDrawing() {
    show('sDraw');
    blank(); undoStack.length = 0;
    stats = { strokes: 0, colors: new Set(), erased: false };
    $('num').textContent = `Drawing ${idx + 1} of ${ROUND}`;
    $('prompt').textContent = round.prompts[idx];
    $('reroll').disabled = false;
    $('flash').classList.remove('on');
    if (!Curio.touchpad && !Curio.store.get('tp-hint-doodle-prompts', false) && matchMedia('(pointer: fine)').matches) { Curio.store.set('tp-hint-doodle-prompts', true); setTimeout(() => Curio.toast('Tip: on a laptop touchpad, turn on Touchpad mode in the top bar: click to put the pen down, click again to lift it', 4200), 600); }
    timeLeft = round.secs; running = true; lastTick = performance.now(); beepedAt = -1;
    updateClock();
    Curio.beep(660, .08, 'triangle', .07);
  }
  function updateClock() {
    const s = Math.ceil(timeLeft);
    $('clock').textContent = s; $('clock').classList.toggle('hot', timeLeft <= 5);
    const f = clamp(timeLeft / round.secs, 0, 1), bar = $('bar');
    bar.style.transform = `scaleX(${f})`;
    bar.style.background = f > .5 ? 'var(--good)' : f > .2 ? 'var(--warn)' : 'var(--bad)';
  }
  function finishDrawing(timedOut) {
    if (!running) return;
    if (drawing) up();
    running = false; drawing = false; dropDrag();
    const m = measure();
    const used = 1 - clamp(timeLeft, 0, round.secs) / round.secs;
    const small = document.createElement('canvas'); small.width = 480; small.height = 360;
    small.getContext('2d').drawImage(cv, 0, 0, 480, 360);
    const item = { prompt: round.prompts[idx], img: small.toDataURL('image/jpeg', .82), full: cv.toDataURL('image/png'), ...m, strokes: stats.strokes, colors: stats.colors.size, erased: stats.erased, used, timedOut };
    Object.assign(item, critique(item));
    round.items.push(item);
    const next = () => { idx++; if (idx < ROUND) startDrawing(); else endRound(); };
    if (timedOut) {
      $('flash').classList.add('on'); Curio.beep(220, .3, 'sawtooth', .07);
      setTimeout(next, 1100);
    } else { Curio.beep(880, .07, 'triangle', .07); next(); }
  }
  function measure() {
    const c = document.createElement('canvas'); c.width = 160; c.height = 120;
    const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(cv, 0, 0, 160, 120);
    const d = x.getImageData(0, 0, 160, 120).data;
    let ink = 0, x0 = 160, y0 = 120, x1 = -1, y1 = -1;
    for (let y = 0; y < 120; y++) for (let xx = 0; xx < 160; xx++) {
      const o = (y * 160 + xx) * 4;
      if (d[o] + d[o + 1] + d[o + 2] < 720) { ink++; if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    const coverage = ink / (160 * 120), area = x1 < 0 ? 0 : ((x1 - x0 + 1) * (y1 - y0 + 1)) / (160 * 120);
    return { coverage, area };
  }
  function critique(it) {
    const critic = Curio.pick(CRITICS), fill = (s) => s.replace('{p}', it.prompt);
    if (it.coverage < .002) {
      const stars = Math.random() < .5 ? 1 : 5;
      return { critic, stars, review: `${fill(Curio.pick(L.empty))} ${Curio.pick(L.verdict[stars])}` };
    }
    let s = 2.3 + (Math.random() - .5) * 1.6;
    if (it.coverage > .025 && it.coverage < .35) s += .8; else if (it.coverage < .012) s -= .6; else if (it.coverage > .5) s -= .3;
    if (it.colors >= 3) s += .6;
    if (it.strokes >= 8 && it.strokes <= 140) s += .6; else if (it.strokes < 3) s -= .4;
    if (it.area > .25) s += .4; else if (it.area < .06) s -= .4;
    if (it.used > .5) s += .3;
    const stars = clamp(Math.round(s), 1, 5);
    const obs = [];
    if (it.coverage < .02) obs.push('sparse'); if (it.coverage > .3) obs.push('dense');
    if (it.colors <= 1) obs.push('mono'); if (it.colors >= 4) obs.push('colourful');
    if (it.strokes > 70) obs.push('manyStrokes'); if (it.strokes <= 5) obs.push('fewStrokes');
    if (it.used < .55) obs.push('early'); if (it.timedOut) obs.push('late');
    if (it.area < .1) obs.push('small'); if (it.area > .55) obs.push('big');
    if (it.erased) obs.push('erased');
    const picked = Curio.shuffle(obs).slice(0, 2).map((k) => Curio.pick(L[k]));
    return { critic, stars, review: [fill(Curio.pick(L.open)), ...picked, Curio.pick(L.verdict[stars])].join(' ') };
  }

  function endRound() {
    Curio.store.set('doodle-prompts:rounds', Curio.store.get('doodle-prompts:rounds', 0) + 1);
    if (round.mode === 'party') { show('sPass'); Curio.beep(520, .1, 'sine', .07); }
    else showGallery();
  }

  let gi = 0;
  function startGuessing() { gi = 0; round.guessed = 0; show('sGuess'); showGuess(); }
  function showGuess() {
    const it = round.items[gi];
    $('gNum').textContent = `Guess ${gi + 1} of ${ROUND}`; $('gScore').textContent = `${round.guessed} right`;
    $('gImg').src = it.img;
    const others = round.prompts.filter((p) => p !== it.prompt);
    const decoys = Curio.shuffle(others).slice(0, 2);
    while (decoys.length < 3) { const p = Curio.pick(P); if (p !== it.prompt && !decoys.includes(p)) decoys.push(p); }
    const opts = Curio.shuffle([it.prompt, ...decoys]);
    const box = $('opts'); box.innerHTML = '';
    let answered = false;
    opts.forEach((o) => {
      const b = document.createElement('button'); b.className = 'dp-opt'; b.textContent = o;
      b.addEventListener('click', () => {
        if (answered) return; answered = true;
        const ok = o === it.prompt; it.guessed = ok;
        if (ok) { round.guessed++; b.classList.add('right'); Curio.beep(880, .08, 'triangle', .08); setTimeout(() => Curio.beep(1320, .1, 'triangle', .08), 90); }
        else { b.classList.add('wrong'); [...box.children].find((x) => x.textContent === it.prompt).classList.add('right'); Curio.beep(180, .2, 'sawtooth', .05); }
        $('gScore').textContent = `${round.guessed} right`;
        setTimeout(() => { gi++; if (gi < ROUND) showGuess(); else showGallery(); }, ok ? 900 : 1600);
      });
      box.append(b);
    });
  }

  function showGallery() {
    show('sGallery');
    const total = round.items.reduce((a, it) => a + it.stars, 0);
    const party = round.mode === 'party';
    const res = Curio.best(SK, total);
    $('sumStars').textContent = `${total}/${MAXS}`; $('sumBest').textContent = `${res.best}/${MAXS}`;
    $('sumGuessWrap').hidden = !party;
    let newBest = res.isNew && total > 0;
    if (party) {
      $('sumGuess').textContent = `${round.guessed}/5`;
      const gb = Curio.best('guessed', round.guessed); newBest = newBest || (gb.isNew && round.guessed > 0);
    }
    $('galSub').textContent = party
      ? (round.guessed === 5 ? 'Your friends read your mind. Every single one. Suspicious.' : round.guessed >= 3 ? 'Mostly understood. That is more than most artists get.' : 'Your friends were baffled. The critics, however, have thoughts.')
      : total >= 20 ? 'The critics are calling it a movement.' : total >= 14 ? 'A solid opening night. Someone bought a fridge magnet.' : 'The critics have arrived. Someone brought cheese cubes.';
    const gal = $('gal'); gal.innerHTML = '';
    round.items.forEach((it, i) => {
      const card = document.createElement('article'); card.className = 'dp-card';
      const fr = document.createElement('div'); fr.className = 'dp-frame';
      const im = document.createElement('img'); im.src = it.img; im.alt = `Drawing of ${it.prompt}`; fr.append(im);
      const cap = document.createElement('div'); cap.className = 'dp-cap';
      const h = document.createElement('h3'); h.textContent = it.prompt.charAt(0).toUpperCase() + it.prompt.slice(1);
      const stars = document.createElement('div'); stars.className = 'dp-stars'; stars.textContent = '★'.repeat(it.stars) + '☆'.repeat(5 - it.stars); stars.setAttribute('aria-label', `${it.stars} out of 5 stars`);
      const rv = document.createElement('p'); rv.className = 'dp-review'; rv.textContent = `"${it.review}"`;
      const cr = document.createElement('div'); cr.className = 'dp-critic'; cr.textContent = `${it.critic.name}, ${it.critic.outlet}`;
      cap.append(h, stars, rv, cr);
      if (party) { const bd = document.createElement('span'); bd.className = 'dp-badge'; bd.textContent = it.guessed ? '✅ Friends got it' : '❓ Friends were baffled'; cap.append(bd); }
      const sv = document.createElement('button'); sv.className = 'dp-tb'; sv.textContent = 'Save PNG';
      sv.addEventListener('click', () => { const a = document.createElement('a'); a.href = it.full; a.download = `doodle-${i + 1}.png`; document.body.append(a); a.click(); a.remove(); });
      cap.append(sv);
      card.append(fr, cap); gal.append(card);
      setTimeout(() => { card.classList.add('in'); Curio.beep(440 + i * 110, .08, 'triangle', .06); }, 250 + i * 380);
    });
    if (newBest || total >= MAXS * 0.8) setTimeout(() => { Curio.confetti(); Curio.toast(newBest ? 'New personal best!' : 'Critically acclaimed!'); }, 250 + ROUND * 380);
    Curio.store.set('doodle-prompts:last', { items: round.items.map((it) => ({ img: it.img, prompt: it.prompt, stars: it.stars })), total, mode: round.mode });
  }
  function saveGallery() {
    const items = round.items, cw = 480, ch = 360, pad = 24, capH = 70;
    const c = document.createElement('canvas'); c.width = pad + 3 * (cw + pad); c.height = pad + 2 * (ch + capH + pad) + 40;
    const x = c.getContext('2d');
    x.fillStyle = '#f4ede0'; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = '#1d1b19'; x.font = '900 30px system-ui, sans-serif'; x.fillText('Doodle Prompts gallery', pad, 46);
    let loaded = 0;
    items.forEach((it, i) => {
      const im = new Image();
      im.onload = () => {
        const cx = pad + (i % 3) * (cw + pad), cy = 70 + Math.floor(i / 3) * (ch + capH + pad);
        x.fillStyle = '#6b4a2e'; x.fillRect(cx - 8, cy - 8, cw + 16, ch + 16); x.drawImage(im, cx, cy, cw, ch);
        x.fillStyle = '#1d1b19'; x.font = '800 20px system-ui, sans-serif'; x.fillText(it.prompt.length > 42 ? it.prompt.slice(0, 40) + '...' : it.prompt, cx, cy + ch + 34);
        x.fillStyle = '#f2a900'; x.font = '22px system-ui, sans-serif'; x.fillText('★'.repeat(it.stars) + '☆'.repeat(5 - it.stars), cx, cy + ch + 62);
        if (++loaded === items.length) c.toBlob((b) => { if (!b) return; const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'doodle-gallery.png'; document.body.append(a); a.click(); a.remove(); Curio.toast('Gallery saved'); }, 'image/png');
      };
      im.src = it.full;
    });
  }

  function makeSampler(spacing, emit, K = .55) {
    let s, r0, pPrev, mPrev, left = 0, v = 0, prS = null;
    function walk(x0, y0, cx, cy, x1, y1, pa, pb) {
      const est = Math.hypot(cx - x0, cy - y0) + Math.hypot(x1 - cx, y1 - cy);
      const n = Math.max(1, Math.ceil(est / 1.5));
      let px = x0, py = y0;
      for (let i = 1; i <= n; i++) {
        const t = i / n, u = 1 - t;
        const x = u * u * x0 + 2 * u * t * cx + t * t * x1, y = u * u * y0 + 2 * u * t * cy + t * t * y1;
        let d = Math.hypot(x - px, y - py), sp = spacing();
        while (d > 0 && left + d >= sp) {
          const f = (sp - left) / d;
          px += (x - px) * f; py += (y - py) * f;
          emit(px, py, pa == null ? null : pa + (pb - pa) * t, v, false);
          d = Math.hypot(x - px, y - py); left = 0; sp = spacing();
        }
        left += d; px = x; py = y;
      }
    }
    return {
      begin(p) { r0 = p; s = { x: p.x, y: p.y }; pPrev = s; mPrev = s; left = 0; v = 0; prS = p.pr; emit(p.x, p.y, p.pr, 0, true); },
      move(p) {
        const dt = Math.max(1, p.t - r0.t);
        v += (Math.min(Math.hypot(p.x - r0.x, p.y - r0.y) / dt, 8) - v) * .3; r0 = p;
        const prOld = prS; prS = p.pr == null ? null : (prS == null ? p.pr : prS + (p.pr - prS) * .5);
        s = { x: s.x + (p.x - s.x) * K, y: s.y + (p.y - s.y) * K };
        const mid = { x: (pPrev.x + s.x) / 2, y: (pPrev.y + s.y) / 2 };
        walk(mPrev.x, mPrev.y, pPrev.x, pPrev.y, mid.x, mid.y, prOld, prS);
        mPrev = mid; pPrev = s;
      },
      end() { walk(mPrev.x, mPrev.y, pPrev.x, pPrev.y, r0.x, r0.y, prS, prS); }
    };
  }
  let last = null, wS = null, box = null;
  const pen = makeSampler(() => Math.max(.8, (wS || width) * .2), (x, y, pr, v) => {
    const base = eraser ? width * 3 : width;
    const w = pr != null ? base * (.3 + pr * 1.2) : base * clamp(1.15 - v * .22, .55, 1.15);
    wS = wS == null ? w : wS + (w - wS) * .3;
    g.strokeStyle = eraser ? '#fff' : COLORS[color]; g.lineWidth = wS; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(last ? last.x : x, last ? last.y : y); g.lineTo(x + (last ? 0 : .01), y); g.stroke();
    const m = wS + 4;
    if (!box) box = { x0: x - m, y0: y - m, x1: x + m, y1: y + m };
    else { box.x0 = Math.min(box.x0, x - m); box.y0 = Math.min(box.y0, y - m); box.x1 = Math.max(box.x1, x + m); box.y1 = Math.max(box.y1, y + m); }
    last = { x, y };
  });
  const backup = document.createElement('canvas'); backup.width = CW; backup.height = CH; const bk = backup.getContext('2d');
  const undoStack = [];
  let drawing = false, activeId = null;
  function toDoc(e) { const r = cv.getBoundingClientRect(); const p = e.pointerType === 'pen' && e.pressure > 0; return { x: (e.clientX - r.left) * CW / r.width, y: (e.clientY - r.top) * CH / r.height, pr: p ? e.pressure : null, t: e.timeStamp || performance.now() }; }
  function down(e) {
    if (!running || drawing) return;
    e.preventDefault();
    drawing = true; activeId = e.pointerId;
    bk.drawImage(cv, 0, 0); last = null; wS = null; box = null;
    stats.strokes++; if (eraser) stats.erased = true; else stats.colors.add(color);
    $('reroll').disabled = true;
    pen.begin(toDoc(e));
  }
  function moveDraw(e) {
    if (!drawing) return;
    e.preventDefault();
    const list = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
    for (const ev of (list.length ? list : [e])) pen.move(toDoc(ev));
  }
  function up() {
    if (!drawing) return;
    pen.end(); drawing = false; activeId = null;
    if (box) {
      const x = clamp(Math.floor(box.x0), 0, CW), y = clamp(Math.floor(box.y0), 0, CH), w = clamp(Math.ceil(box.x1), 0, CW) - x, h = clamp(Math.ceil(box.y1), 0, CH) - y;
      if (w > 0 && h > 0) { undoStack.push({ x, y, data: bk.getImageData(x, y, w, h) }); if (undoStack.length > 30) undoStack.shift(); }
    }
  }
  let unDrag = null;
  const bindDrag = () => { unDrag = Curio.drag(cv, { start: (p) => down(p.event), move: (p) => moveDraw(p.event), end: up }); };
  function dropDrag() { if (unDrag) unDrag(); cv.classList.remove('curio-latched'); bindDrag(); }
  bindDrag();
  addEventListener('curio:touchpad', (e) => { if (e.detail) Curio.toast('Touchpad mode: click the canvas to put the pen down, move to draw, click again to lift it', 3600); });

  function loop(t) {
    const dt = Math.min(.25, (t - lastTick) / 1000); lastTick = t;
    if (running && !document.hidden) {
      timeLeft -= dt;
      const s = Math.ceil(timeLeft);
      if (timeLeft <= 5 && s !== beepedAt && s > 0) { beepedAt = s; Curio.beep(s <= 2 ? 1100 : 900, .05, 'square', .04); }
      if (timeLeft <= 0) { timeLeft = 0; updateClock(); finishDrawing(true); }
      else updateClock();
    }
    requestAnimationFrame(loop);
  }

  const pal = $('pal');
  COLORS.forEach((hex, i) => {
    const b = document.createElement('button'); b.className = 'dp-sw'; b.style.background = hex; b.setAttribute('aria-label', `Colour ${i + 1}`);
    b.addEventListener('click', () => { color = i; eraser = false; syncTools(); });
    pal.append(b);
  });
  function syncTools() {
    [...pal.children].forEach((b, i) => b.setAttribute('aria-pressed', String(i === color && !eraser)));
    document.querySelectorAll('[data-w]').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.w === width)));
    $('eraser').setAttribute('aria-pressed', String(eraser));
  }
  document.querySelectorAll('[data-w]').forEach((b) => b.addEventListener('click', () => { width = +b.dataset.w; syncTools(); }));
  $('eraser').addEventListener('click', () => { eraser = !eraser; syncTools(); });
  $('undo').addEventListener('click', () => { const e = undoStack.pop(); if (!e) return; g.putImageData(e.data, e.x, e.y); Curio.beep(330, .05, 'triangle', .06); });
  $('clear').addEventListener('click', () => { if (!running) return; bk.drawImage(cv, 0, 0); undoStack.push({ x: 0, y: 0, data: bk.getImageData(0, 0, CW, CH) }); blank(); stats.erased = true; });
  $('reroll').addEventListener('click', () => {
    if (!running || stats.strokes) return;
    let p; do { p = Curio.pick(P); } while (round.prompts.includes(p));
    round.prompts[idx] = p; $('prompt').textContent = p; $('reroll').disabled = true; Curio.beep(700, .05, 'sine', .05);
  });
  $('done').addEventListener('click', () => finishDrawing(false));
  $('go').addEventListener('click', startRound);
  $('ready').addEventListener('click', startGuessing);
  $('again').addEventListener('click', startRound);
  $('home').addEventListener('click', () => { show('sStart'); syncStart(); });
  $('saveAll').addEventListener('click', saveGallery);
  addEventListener('keydown', (e) => {
    if (!running) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); $('undo').click(); }
    if (e.key === 'Enter') { e.preventDefault(); finishDrawing(false); }
    if (e.key === 'e' || e.key === 'E') $('eraser').click();
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'u' || e.key === 'U') $('undo').click();
    const n = '123456789'.indexOf(e.key);
    if (n >= 0 && e.key.length === 1 && pal.children[n]) pal.children[n].click();
    if (e.key === '[' || e.key === ']') { const ws = [4, 9, 18]; width = ws[clamp(ws.indexOf(width) + (e.key === ']' ? 1 : -1), 0, 2)] || 9; syncTools(); }
  });

  syncStart(); syncTools();
  requestAnimationFrame((t) => { lastTick = t; loop(t); });
})();
