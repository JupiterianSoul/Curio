(function () {
  const C = window.Curio;
  const F = window.SketchFace;
  const CASES = window.SKETCH_CASES;
  const VOICES = window.SKETCH_VOICES;
  const INNOCENTS = window.SKETCH_INNOCENTS;
  const $ = (s) => document.querySelector(s);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const PASS = 50;
  const KEY = 'sketch-artist:v1';

  const RANKS = [
    { at: 0, title: 'Rookie', emoji: '✏️' },
    { at: 1, title: 'Doodle Deputy', emoji: '🖍️' },
    { at: 4, title: 'Crayon Constable', emoji: '👮' },
    { at: 8, title: 'Sketch Sergeant', emoji: '📝' },
    { at: 13, title: 'Lieutenant Linework', emoji: '📐' },
    { at: 19, title: 'Inspector Ink', emoji: '🖋️' },
    { at: 26, title: 'Captain Charcoal', emoji: '🎖️' },
    { at: 34, title: 'Chief Sketch Artist', emoji: '🕵️' }
  ];

  let data = C.store.get(KEY, null);
  if (!data || typeof data !== 'object') data = {};
  data.best = data.best || {};
  data.thumbs = data.thumbs || {};
  data.gallery = Array.isArray(data.gallery) ? data.gallery : [];
  const save = () => {
    C.store.set(KEY, data);
    if (C.store.get(KEY, null) == null && data.gallery.length > 6) { data.gallery = data.gallery.slice(0, 6); C.store.set(KEY, data); }
  };

  const solvedCount = () => Object.values(data.best).filter((v) => v >= PASS).length;
  const rankFor = (n) => { let r = RANKS[0]; for (const k of RANKS) if (n >= k.at) r = k; return r; };
  const caseNo = (i) => String(i + 1).padStart(2, '0');

  const views = { home: $('#home'), case: $('#case'), reveal: $('#reveal') };
  function show(name) {
    for (const [k, v] of Object.entries(views)) v.hidden = k !== name;
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function renderHome() {
    const n = solvedCount();
    const rank = rankFor(n);
    const next = RANKS.find((r) => r.at > n);
    $('#rankEmoji').textContent = rank.emoji;
    $('#rankTitle').textContent = rank.title;
    const prevAt = rank.at;
    const pct = next ? ((n - prevAt) / (next.at - prevAt)) * 100 : 100;
    $('#rankBar').style.width = `${pct}%`;
    $('#rankNext').textContent = next ? `${next.at - n} more solved case${next.at - n === 1 ? '' : 's'} until ${next.title}` : 'Top of the force. The whole precinct uses your doodles.';
    const scores = Object.values(data.best);
    $('#statSolved').textContent = `${n}/${CASES.length}`;
    $('#statAvg').textContent = scores.length ? `${Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)}%` : '-';
    $('#statSketches').textContent = String(data.gallery.length);

    const board = $('#board');
    board.innerHTML = '';
    CASES.forEach((c, i) => {
      const best = data.best[i];
      const solved = best >= PASS;
      const b = el('button', `sk-folder${solved ? ' is-solved' : ''}${best != null && !solved ? ' is-tried' : ''}`);
      b.type = 'button';
      b.setAttribute('aria-label', `Case ${i + 1}: ${c.name}. ${solved ? `Solved, best ${best} percent` : best != null ? `Open, best ${best} percent` : 'Open'}`);
      const pics = solved
        ? `<div class="sk-folder__pics"><span class="sk-mini sk-mini--paper">${data.thumbs[i] ? `<img src="${data.thumbs[i]}" alt="">` : ''}</span><span class="sk-mini">${F.svg(c.spec, { chart: true })}</span></div>`
        : `<div class="sk-folder__pics"><span class="sk-mini sk-mini--unknown">?</span><span class="sk-folder__voices">${c.w.map((w) => VOICES[w[0]].emoji).join(' ')}</span></div>`;
      b.innerHTML = `<span class="sk-folder__tab">CASE ${caseNo(i)}</span>
        <span class="sk-folder__name">${esc(c.name)}</span>
        <span class="sk-folder__crime">${esc(c.crime)}</span>
        ${pics}
        <span class="sk-folder__stamp">${solved ? `SOLVED ${best}%` : best != null ? `OPEN · BEST ${best}%` : 'OPEN'}</span>`;
      b.addEventListener('click', () => openCase(i));
      board.append(b);
    });

    const gal = $('#gallery');
    gal.innerHTML = '';
    if (!data.gallery.length) {
      gal.append(el('p', 'sk-empty', 'No sketches on file yet. Crack a case and your masterpieces will hang here, next to the people they were supposed to look like.'));
    } else {
      for (const g of data.gallery) {
        const c = CASES[g.c];
        if (!c) continue;
        const card = el('figure', 'sk-gcard');
        card.innerHTML = `<div class="sk-gcard__pics"><span class="sk-mini sk-mini--paper"><img src="${g.img}" alt="Your sketch for ${esc(c.name)}"></span><span class="sk-mini">${F.svg(c.spec, { chart: true, label: `The real ${esc(c.name)}` })}</span></div>
          <figcaption><b>${esc(c.name)}</b><span class="sk-gcard__score ${g.s >= PASS ? 'is-good' : 'is-bad'}">${g.s}%</span><small>${new Date(g.t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</small></figcaption>`;
        gal.append(card);
      }
    }
  }

  function setTab(name) {
    for (const t of document.querySelectorAll('.sk-tab')) {
      const on = t.dataset.tab === name;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.classList.toggle('is-on', on);
    }
    $('#board').hidden = name !== 'board';
    $('#gallery').hidden = name !== 'gallery';
    C.store.set('sketch-artist:tab', name);
  }
  for (const t of document.querySelectorAll('.sk-tab')) t.addEventListener('click', () => setTab(t.dataset.tab));

  const nextOpen = (from = -1) => {
    for (let k = 1; k <= CASES.length; k++) {
      const i = (from + k) % CASES.length;
      if (!(data.best[i] >= PASS)) return i;
    }
    return (from + 1) % CASES.length;
  };
  $('#startBtn').addEventListener('click', () => openCase(nextOpen()));
  $('#randomBtn').addEventListener('click', () => openCase(C.randInt(0, CASES.length - 1)));

  const canvas = $('#cv');
  const padEl = $('#pad');
  const ctx = canvas.getContext('2d');
  const SIZES = [2.2, 4.6, 9];
  const INK = '#2a2a31';
  let strokes = [];
  let cur = null;
  let tool = 'p';
  let size = 1;
  let scale = 1;

  function drawSeg(g, st, i, sc, fixed) {
    const p = st.p;
    const w = Math.max(0.6, (fixed && st.t !== 'e' ? fixed : p[i][2] * (st.t === 'e' ? 2.6 : 1)) * sc);
    g.lineWidth = w;
    g.beginPath();
    if (i === 0) {
      if (p.length === 1) { g.arc(p[0][0] * sc, p[0][1] * sc, w / 2, 0, Math.PI * 2); g.fill(); return; }
      g.moveTo(p[0][0] * sc, p[0][1] * sc);
      g.lineTo(((p[0][0] + p[1][0]) / 2) * sc, ((p[0][1] + p[1][1]) / 2) * sc);
    } else if (i === p.length - 1) {
      g.moveTo(((p[i - 1][0] + p[i][0]) / 2) * sc, ((p[i - 1][1] + p[i][1]) / 2) * sc);
      g.lineTo(p[i][0] * sc, p[i][1] * sc);
    } else {
      g.moveTo(((p[i - 1][0] + p[i][0]) / 2) * sc, ((p[i - 1][1] + p[i][1]) / 2) * sc);
      g.quadraticCurveTo(p[i][0] * sc, p[i][1] * sc, ((p[i][0] + p[i + 1][0]) / 2) * sc, ((p[i][1] + p[i + 1][1]) / 2) * sc);
    }
    g.stroke();
  }
  function prep(g, st) {
    g.globalCompositeOperation = st.t === 'e' ? 'destination-out' : 'source-over';
    g.strokeStyle = INK; g.fillStyle = INK;
    g.lineCap = 'round'; g.lineJoin = 'round';
  }
  function drawStroke(g, st, sc, fixed) {
    prep(g, st);
    for (let i = 0; i < st.p.length; i++) drawSeg(g, st, i, sc, fixed);
  }
  function liveStrokes() {
    let k = strokes.length - 1;
    while (k >= 0 && !strokes[k].clear) k--;
    return strokes.slice(k + 1);
  }
  function renderAll(g, sc, w, h, fixed) {
    g.clearRect(0, 0, w, h);
    for (const st of liveStrokes()) drawStroke(g, st, sc, fixed);
    g.globalCompositeOperation = 'source-over';
  }
  function resize() {
    const r = padEl.getBoundingClientRect();
    if (!r.width) return;
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.width * (4 / 3) * dpr);
    scale = canvas.width / 300;
    renderAll(ctx, scale, canvas.width, canvas.height);
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(padEl);
  else window.addEventListener('resize', resize);

  const toPad = (e) => {
    const r = canvas.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * 300, ((e.clientY - r.top) / r.height) * 400];
  };
  let sm = null;
  let raw = null;
  function addPoint(e, exact) {
    const [x, y] = exact || toPad(e);
    raw = [x, y];
    const last = cur.p[cur.p.length - 1];
    const k = exact ? 1 : 0.6;
    const sx = sm[0] + (x - sm[0]) * k;
    const sy = sm[1] + (y - sm[1]) * k;
    const dist = Math.hypot(sx - last[0], sy - last[1]);
    if (dist < 0.8) return;
    const base = SIZES[cur.s];
    let f;
    if (e.pointerType === 'pen' && e.pressure > 0) f = 0.35 + e.pressure * 1.3;
    else f = Math.max(0.62, Math.min(1.25, 1.3 - dist * 0.045));
    const w = last[2] * 0.72 + base * f * 0.28;
    sm = [sx, sy];
    cur.p.push([+sx.toFixed(1), +sy.toFixed(1), +w.toFixed(2)]);
    const n = cur.p.length;
    prep(ctx, cur);
    if (n === 2) drawSeg(ctx, cur, 0, scale);
    else drawSeg(ctx, cur, n - 2, scale);
    ctx.globalCompositeOperation = 'source-over';
  }
  const startStroke = (e) => {
    if (cur) return;
    e.preventDefault();
    const [x, y] = toPad(e);
    sm = [x, y];
    raw = null;
    cur = { t: tool, s: size, p: [[+x.toFixed(1), +y.toFixed(1), SIZES[size]]] };
    strokes.push(cur);
    padEl.classList.add('is-drawing');
  };
  const moveStroke = (e) => {
    if (!cur) return;
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
    for (const ev of evs.length ? evs : [e]) addPoint(ev);
  };
  const end = () => {
    if (!cur) return;
    if (raw && cur.p.length > 1) addPoint({ pointerType: 'mouse' }, raw);
    raw = null;
    prep(ctx, cur);
    if (cur.p.length === 1) drawSeg(ctx, cur, 0, scale);
    else drawSeg(ctx, cur, cur.p.length - 1, scale);
    ctx.globalCompositeOperation = 'source-over';
    cur = null;
    padEl.classList.remove('is-drawing');
    syncTools();
  };
  C.drag(canvas, { start: (p) => startStroke(p.event), move: (p) => moveStroke(p.event), end });
  addEventListener('curio:touchpad', (e) => { if (e.detail) C.toast('Touchpad mode: click the pad to put the pencil down, move to draw, click again to lift it', 3600); });

  const isEmpty = () => !liveStrokes().some((s) => s.t === 'p');
  function syncTools() {
    for (const b of document.querySelectorAll('[data-tool]')) b.setAttribute('aria-pressed', b.dataset.tool === tool ? 'true' : 'false');
    for (const b of document.querySelectorAll('[data-size]')) b.setAttribute('aria-pressed', +b.dataset.size === size ? 'true' : 'false');
    $('#undoBtn').disabled = strokes.length === 0;
    $('#clearBtn').disabled = liveStrokes().length === 0;
    padEl.dataset.tool = tool;
  }
  const undo = () => { if (!strokes.length) return; strokes.pop(); renderAll(ctx, scale, canvas.width, canvas.height); syncTools(); C.beep(330, 0.04, 'triangle', 0.05); };
  const clearPad = () => { if (!liveStrokes().length) return; strokes.push({ clear: true }); renderAll(ctx, scale, canvas.width, canvas.height); syncTools(); C.beep(200, 0.08, 'sawtooth', 0.04); C.toast('Page torn out. Undo brings it back.'); };
  for (const b of document.querySelectorAll('[data-tool]')) b.addEventListener('click', () => { tool = b.dataset.tool; syncTools(); });
  for (const b of document.querySelectorAll('[data-size]')) b.addEventListener('click', () => { size = +b.dataset.size; syncTools(); });
  $('#undoBtn').addEventListener('click', undo);
  $('#clearBtn').addEventListener('click', clearPad);
  const guideBtn = $('#guideBtn');
  const setGuide = (on) => { padEl.classList.toggle('show-guide', on); guideBtn.setAttribute('aria-pressed', on ? 'true' : 'false'); C.store.set('sketch-artist:guide', on); };
  setGuide(C.store.get('sketch-artist:guide', true));
  guideBtn.addEventListener('click', () => setGuide(!padEl.classList.contains('show-guide')));

  document.addEventListener('keydown', (e) => {
    if (views.case.hidden) return;
    if (e.target.closest && e.target.closest('input, textarea')) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === 'p' || k === 'b') { tool = 'p'; syncTools(); }
    else if (k === 'e') { tool = 'e'; syncTools(); }
    else if (k === '1' || k === '2' || k === '3') { size = +k - 1; syncTools(); }
    else if (k === 'g') setGuide(!padEl.classList.contains('show-guide'));
    else if (k === 'u') undo();
  });

  let current = -1;
  let typing = null;
  let suspectRaster = null;

  function rasterSuspect(i) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const cv = document.createElement('canvas');
        cv.width = 300; cv.height = 400;
        const g = cv.getContext('2d');
        g.fillStyle = '#fff'; g.fillRect(0, 0, 300, 400);
        g.drawImage(img, 0, 0, 300, 400);
        resolve(cv);
      };
      img.onerror = () => resolve(null);
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(F.svg(CASES[i].spec, { line: true }));
    });
  }

  function openCase(i) {
    current = i;
    const c = CASES[i];
    strokes = []; cur = null; tool = 'p';
    $('#caseNo').textContent = `Case #${caseNo(i)}`;
    $('#caseName').textContent = c.name;
    $('#caseCrime').textContent = c.crime;
    const best = data.best[i];
    $('#caseBest').textContent = best != null ? `Your best: ${best}%` : 'First attempt';
    show('case');
    resize();
    syncTools();
    suspectRaster = rasterSuspect(i);
    location.hash = `case-${i + 1}`;
    playWitnesses(c);
    if (!C.touchpad && !C.store.get('tp-hint-sketch-artist', false) && matchMedia('(pointer: fine)').matches) { C.store.set('tp-hint-sketch-artist', true); setTimeout(() => C.toast('Tip: on a laptop touchpad, turn on Touchpad mode in the top bar: click to put the pencil down, click again to lift it', 4200), 1500); }
  }

  function playWitnesses(c) {
    if (typing) typing.cancel();
    const feed = $('#feed');
    feed.innerHTML = '';
    $('#skipBtn').hidden = false;
    let idx = 0, alive = true, timer = 0, finishCurrent = null;
    const done = () => {
      $('#skipBtn').hidden = true;
      const li = el('li', 'sk-note', 'That\'s every witness. Draw what you heard, then hit <b>Submit sketch</b>.');
      feed.append(li);
      scrollFeed();
    };
    const scrollFeed = () => { feed.scrollTo({ top: feed.scrollHeight, behavior: reduced ? 'auto' : 'smooth' }); };
    const wait = (ms, fn) => { timer = setTimeout(function tick() { if (!alive) return; if (document.hidden) { timer = setTimeout(tick, 300); return; } fn(); }, ms); };
    const bubble = (w) => {
      const v = VOICES[w[0]];
      const li = el('li', 'sk-bub');
      li.style.setProperty('--tint', v.tint);
      li.innerHTML = `<span class="sk-bub__av" aria-hidden="true">${v.emoji}</span><div class="sk-bub__body"><div class="sk-bub__who"><b>${esc(v.name)}</b><small>${esc(v.role)}</small></div><p class="sk-bub__text"><span class="sk-dots"><i></i><i></i><i></i></span></p></div>`;
      feed.append(li);
      scrollFeed();
      return li;
    };
    const next = () => {
      if (!alive) return;
      if (idx >= c.w.length) { done(); return; }
      const w = c.w[idx++];
      const v = VOICES[w[0]];
      const li = bubble(w);
      const p = li.querySelector('.sk-bub__text');
      if (reduced) { p.textContent = w[1]; wait(500, next); return; }
      wait(520, () => {
        p.textContent = '';
        let n = 0;
        const full = w[1];
        finishCurrent = () => { n = full.length; p.textContent = full; };
        li.addEventListener('click', () => finishCurrent && finishCurrent());
        const step = () => {
          if (!alive) return;
          if (n >= full.length) { finishCurrent = null; p.textContent = full; wait(750, next); return; }
          n += full[n] === ' ' ? 2 : 1;
          p.textContent = full.slice(0, n);
          if (n % 3 === 0 && /[a-z]/i.test(full[n - 1] || '')) C.beep(v.pitch + Math.random() * 60, 0.025, w[0] === 'robot' ? 'square' : 'triangle', 0.025);
          if (n % 40 === 0) scrollFeed();
          wait(full[n - 1] === '.' || full[n - 1] === '!' || full[n - 1] === '?' ? 150 : 19, step);
        };
        step();
      });
    };
    typing = {
      cancel() { alive = false; clearTimeout(timer); },
      all() {
        alive = false; clearTimeout(timer);
        feed.innerHTML = '';
        for (const w of c.w) { const li = bubble(w); li.querySelector('.sk-bub__text').textContent = w[1]; li.classList.add('is-instant'); }
        done();
      }
    };
    next();
  }
  $('#skipBtn').addEventListener('click', () => typing && typing.all());
  $('#backBtn').addEventListener('click', () => { if (typing) typing.cancel(); history.replaceState(null, '', location.pathname); renderHome(); show('home'); });

  const GW = 60, GH = 80;
  function grid(cv) {
    const d = cv.getContext('2d').getImageData(0, 0, 300, 400).data;
    const g = new Float32Array(GW * GH);
    for (let y = 0; y < 400; y++) {
      const row = ((y / 5) | 0) * GW;
      for (let x = 0; x < 300; x++) {
        const i = (y * 300 + x) * 4;
        const dark = 1 - (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11) / 255;
        g[row + ((x / 5) | 0)] += dark / 25;
      }
    }
    return g;
  }
  function blur(src, r) {
    let a = Float32Array.from(src), b = new Float32Array(src.length);
    for (let pass = 0; pass < 2; pass++) {
      for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
        let s = 0, n = 0;
        for (let k = -r; k <= r; k++) { const xx = x + k; if (xx >= 0 && xx < GW) { s += a[y * GW + xx]; n++; } }
        b[y * GW + x] = s / n;
      }
      for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
        let s = 0, n = 0;
        for (let k = -r; k <= r; k++) { const yy = y + k; if (yy >= 0 && yy < GH) { s += b[yy * GW + x]; n++; } }
        a[y * GW + x] = s / n;
      }
    }
    return a;
  }
  const cellsOf = (rects) => {
    const out = [];
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
      const px = x * 5 + 2.5, py = y * 5 + 2.5;
      if (rects.some(([rx, ry, rw, rh]) => px >= rx && px < rx + rw && py >= ry && py < ry + rh)) out.push(y * GW + x);
    }
    return out;
  };
  const REGIONS = [
    { key: 'hair', weight: 1.2, rects: [[20, 0, 260, 172]] },
    { key: 'brows', weight: 0.8, rects: [[88, 168, 124, 30]] },
    { key: 'eyes', weight: 1.2, rects: [[88, 192, 124, 36]] },
    { key: 'nose', weight: 0.8, rects: [[118, 210, 64, 48]] },
    { key: 'mouth', weight: 1, rects: [[100, 252, 100, 50]] },
    { key: 'face', weight: 1.1, rects: [[28, 160, 74, 160], [198, 160, 74, 160]] },
    { key: 'extras', weight: 0.8, rects: [[0, 312, 300, 88], [0, 0, 22, 312], [278, 0, 22, 312]] }
  ].map((r) => ({ ...r, cells: cellsOf(r.rects) }));
  const ALL = Array.from({ length: GW * GH }, (_, i) => i);

  const sum = (a, cells) => { let s = 0; for (const i of cells) s += a[i]; return s; };

  const ink = (g) => g.map((v) => Math.max(0, Math.min(1, (v - 0.12) * 3.5)));
  const near = (g, r, k) => blur(g, r).map((v) => Math.min(1, v * k));
  function f1(ui, si, nu, ns, cells, slack) {
    let su = 0, ss = 0, hitU = 0, hitS = 0;
    for (const i of cells) { su += ui[i]; ss += si[i]; hitU += ui[i] * ns[i]; hitS += si[i] * nu[i]; }
    if (su < 0.05 || ss < 0.05) return { f: 0, p: 0, r: 0, su, ss };
    const p = hitU / su, r = hitS / ss;
    const f = p + r > 0 ? (2 * p * r) / (p + r) : 0;
    return { f: f * Math.min(1, (slack * ss) / su), p, r, su, ss };
  }
  function compare(userCv, suspCv) {
    const ui = ink(grid(userCv)), si = ink(grid(suspCv));
    const nu = near(ui, 2, 6), ns = near(si, 1, 4);
    const g = f1(ui, si, nu, ns, ALL, 1.5);
    if (g.su < 0.5) return { raw: 0, regions: REGIONS.map((r) => ({ key: r.key, score: 0, has: sum(si, r.cells) > 1 })) };
    let ws = 0, acc = 0;
    const regions = REGIONS.map((r) => {
      const ss = sum(si, r.cells);
      const has = ss > 1;
      if (!has) return { key: r.key, score: 0, has };
      const sc = f1(ui, si, nu, ns, r.cells, 1.8).f;
      ws += r.weight; acc += r.weight * sc;
      return { key: r.key, score: sc, has };
    });
    const regional = ws ? acc / ws : 0;
    const raw = 0.4 * g.f + 0.6 * regional;
    return { raw, global: g.f, regional, regions };
  }
  const toPct = (raw) => Math.round(100 * Math.pow(Math.max(0, Math.min(1, (raw - 0.34) / 0.6)), 1.1));

  function exportSketch(w, h, bg, fixed) {
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const g = cv.getContext('2d');
    const layer = document.createElement('canvas');
    layer.width = w; layer.height = h;
    renderAll(layer.getContext('2d'), w / 300, w, h, fixed);
    if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
    g.drawImage(layer, 0, 0);
    return cv;
  }
  function thumbURL() {
    const cv = exportSketch(150, 200, null);
    const webp = cv.toDataURL('image/webp', 0.8);
    return webp.startsWith('data:image/webp') ? webp : cv.toDataURL('image/png');
  }

  function featureName(key, spec) {
    const N = F.NAMES;
    switch (key) {
      case 'hair': return spec.hat !== 'none' ? N.hat[spec.hat] : N.hair[spec.hair];
      case 'brows': return N.brows[spec.brows] || 'eyebrows';
      case 'eyes': return spec.gl !== 'none' ? N.gl[spec.gl] : N.eyes[spec.eyes];
      case 'nose': return N.nose[spec.nose] || 'nose';
      case 'mouth': return ['mustache', 'handlebar', 'pencil', 'beard', 'wizard', 'goatee'].includes(spec.fh) ? N.fh[spec.fh] : N.mouth[spec.mouth];
      case 'face': return N.head[spec.head];
      default: return spec.acc.length ? N.acc[spec.acc[spec.acc.length - 1]] : 'shoulders';
    }
  }
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const LINES = {
    good: ['Nailed the {f}', 'The {f}: chef\'s kiss', '{F}: spot on', 'Perfect {f}, detective', '{F}: the witnesses gasped'],
    ok: ['{F}: close enough for court', '{F}: the jury will allow it', '{F}: right neighborhood', '{F}: a solid maybe'],
    bad: ['{F}: the witnesses are confused', '{F}: went missing', '{F}: a creative interpretation', '{F}: needs another look', '{F}: fled the scene']
  };
  const VERDICTS = [
    [92, ['This is not a sketch, it is a photograph. The suspect turned himself in out of respect.', 'Flawless. The suspect asked for a signed copy.']],
    [78, ['Spot on. The suspect saw the poster and just sighed.', 'Uncanny. His own mother called the tip line.']],
    [64, ['Strong likeness. We picked them up at a sandwich shop within the hour.', 'Good work. A mall cop recognized them from the poster.']],
    [PASS, ['Close enough. They were the only person in town who matched it. Barely.', 'The squint test passed. Squint harder and it is perfect.']],
    [35, ['We arrested someone. It was not them. It was, however, someone.', 'The poster went up. Twelve people called. None were right.']],
    [18, ['This could be anyone. Literally anyone. We arrested a mailbox.', 'The suspect walked past the poster and waved.']],
    [-1, ['Is this... a potato? The suspect is laughing at us from a boat.', 'The chief has asked if you were holding the pencil with your foot.', 'Bold minimalism. Zero arrests.']]
  ];

  function randomSpec() {
    const p = C.pick;
    return F.parse([
      `head:${p(['oval', 'round', 'square', 'long', 'egg', 'pear', 'heart'])}`, `skin:${p(['1', '2', '3', '4', '5', '6'])}`,
      `hair:${p(['short', 'none', 'bob', 'curly', 'spiky', 'long', 'buzz', 'combover'])}`, `hc:${p(['black', 'brown', 'blonde', 'red', 'gray'])}`,
      `eyes:${p(['dot', 'round', 'sleepy'])}`, `mouth:${p(['smile', 'flat', 'open', 'frown'])}`, `nose:${p(['button', 'big', 'pointy'])}`,
      `fh:${p(['none', 'none', 'mustache', 'beard'])}`, `gl:${p(['none', 'none', 'round', 'square'])}`, `shirt:${p(['blue', 'gray', 'green', 'red', 'teal'])}`
    ].join(' '));
  }

  let lastResult = null;
  async function submit() {
    if (current < 0) return;
    if (isEmpty()) {
      const v = await C.modal({ emoji: '📄', title: 'Submit a blank page?', body: 'Bold choice. The suspect will be absolutely thrilled.', buttons: [{ label: 'Keep drawing', value: 'no' }, { label: 'Submit anyway', value: 'yes' }] });
      if (v !== 'yes') return;
    }
    if (typing) typing.all();
    const i = current, c = CASES[i], spec = F.parse(c.spec);
    const susp = await suspectRaster;
    const userCv = exportSketch(300, 400, '#ffffff', 3.2);
    const res = susp ? compare(userCv, susp) : { raw: 0, regions: [] };
    const pct = isEmpty() ? 0 : toPct(res.raw);
    lastResult = { pct, res };
    const thumb = thumbURL();
    const prevBest = data.best[i];
    const prevSolved = solvedCount();
    const isNewBest = prevBest == null || pct > prevBest;
    if (isNewBest) { data.best[i] = pct; data.thumbs[i] = thumb; }
    if (!isEmpty()) data.gallery.unshift({ c: i, s: pct, img: thumb, t: Date.now() });
    data.gallery = data.gallery.slice(0, 30);
    save();
    showReveal(i, spec, pct, res, isNewBest, prevBest, prevSolved);
  }
  $('#submitBtn').addEventListener('click', submit);

  function showReveal(i, spec, pct, res, isNewBest, prevBest, prevSolved) {
    const c = CASES[i];
    show('reveal');
    const big = exportSketch(600, 800, null);
    const url = big.toDataURL('image/png');
    $('#youImg').src = url;
    $('#ghostImg').src = url;
    $('#realFrame').innerHTML = F.svg(spec, { chart: true, label: `The real suspect: ${c.name}` });
    $('#realCap').textContent = `Suspect #${caseNo(i)} · ${c.name}`;
    const cmp = $('#compare');
    cmp.classList.remove('is-in', 'is-overlay');
    $('#overlayBtn').setAttribute('aria-pressed', 'false');
    void cmp.offsetWidth;
    cmp.classList.add('is-in');

    const pctEl = $('#pct');
    const box = $('#result');
    box.classList.remove('is-done', 'is-good', 'is-bad');
    $('#stamp').textContent = '';
    $('#verdict').textContent = 'Comparing with the mugshot...';
    $('#checklist').innerHTML = '';
    $('#bestLine').textContent = '';
    $('#wrongGuy').hidden = true;
    pctEl.textContent = '0%';

    const finish = () => {
      pctEl.textContent = `${pct}%`;
      const good = pct >= PASS;
      box.classList.add('is-done', good ? 'is-good' : 'is-bad');
      $('#stamp').textContent = good ? 'Suspect apprehended' : 'Wrong guy arrested';
      const tier = VERDICTS.find(([t]) => pct >= t);
      $('#verdict').textContent = C.pick(tier[1]);
      const list = $('#checklist');
      const rows = res.regions.filter((r) => r.has);
      rows.sort((a, b) => b.score - a.score);
      rows.forEach((r, k) => {
        const name = featureName(r.key, spec);
        const rp = toPct(r.score);
        let kind = rp >= 62 ? 'good' : rp >= 30 ? 'ok' : 'bad';
        if (pct < 25 && kind === 'good') kind = 'ok';
        const tpl = LINES[kind][(k + i) % LINES[kind].length];
        const li = el('li', `is-${kind}`);
        li.innerHTML = `<span aria-hidden="true">${kind === 'good' ? '✅' : kind === 'ok' ? '👍' : '❓'}</span>`;
        li.append(document.createTextNode(tpl.replace('{f}', name).replace('{F}', cap(name))));
        li.style.animationDelay = `${k * 70}ms`;
        list.append(li);
      });
      const bestTxt = isNewBest && prevBest != null ? `New best for this case! (was ${prevBest}%)` : isNewBest ? 'First sketch on file for this case.' : `Your best for this case: ${prevBest}%`;
      $('#bestLine').textContent = bestTxt;
      if (!good) {
        const wg = $('#wrongGuy');
        wg.hidden = false;
        $('#wrongFace').innerHTML = F.svg(randomSpec(), { chart: true });
        $('#wrongName').textContent = C.pick(INNOCENTS);
      }
      if (good) {
        C.confetti(pct >= 85 ? 180 : 100);
        [523, 659, 784, 1047].forEach((f, k) => setTimeout(() => C.beep(f, 0.14, 'triangle', 0.12), k * 90));
      } else {
        [392, 370, 349, 311].forEach((f, k) => setTimeout(() => C.beep(f, k === 3 ? 0.5 : 0.22, 'sawtooth', 0.06), k * 260));
      }
      renderHome();
      const nowSolved = solvedCount();
      if (rankFor(nowSolved).title !== rankFor(prevSolved).title) {
        const r = rankFor(nowSolved);
        setTimeout(() => C.modal({ emoji: r.emoji, title: 'Promoted!', body: `You are now ${r.title}. The precinct has framed one of your doodles.`, buttons: [{ label: 'Carry on', value: 'ok' }] }), 1200);
      }
      $('#nextBtn').focus({ preventScroll: true });
    };
    if (reduced) { finish(); return; }
    const t0 = performance.now(), dur = 1500;
    let lastBeep = 0;
    const tick = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      const v = Math.round(pct * e);
      pctEl.textContent = `${v}%`;
      if (t - lastBeep > 70 && k < 1) { lastBeep = t; C.beep(300 + v * 6, 0.03, 'square', 0.03); }
      if (k < 1) requestAnimationFrame(tick); else finish();
    };
    setTimeout(() => requestAnimationFrame(tick), 650);
  }

  $('#overlayBtn').addEventListener('click', () => {
    const on = $('#compare').classList.toggle('is-overlay');
    $('#overlayBtn').setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  $('#nextBtn').addEventListener('click', () => openCase(nextOpen(current)));
  $('#retryBtn').addEventListener('click', () => openCase(current));
  $('#boardBtn').addEventListener('click', () => { history.replaceState(null, '', location.pathname); renderHome(); show('home'); });

  window.addEventListener('hashchange', () => {
    const m = /^#case-(\d+)$/.exec(location.hash);
    if (m && +m[1] - 1 !== current && CASES[+m[1] - 1]) openCase(+m[1] - 1);
  });

  renderHome();
  setTab(C.store.get('sketch-artist:tab', 'board') === 'gallery' ? 'gallery' : 'board');
  const m = /^#case-(\d+)$/.exec(location.hash);
  if (m && CASES[+m[1] - 1]) openCase(+m[1] - 1);
  else show('home');
})();
