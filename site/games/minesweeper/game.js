'use strict';
(() => {
  const DATA = window.MS_DATA, LEVELS = DATA.levels, SKINS = DATA.skins;
  const $ = (id) => document.getElementById(id);
  const fieldEl = $('field'), scroller = $('scroller'), ovEl = $('ov'), cardEl = $('card');
  const VER = 2;
  const load = (k, fb) => { const v = Curio.store.get(`mines:${k}`, null); return v && v.v === VER && v.d != null && typeof v.d === typeof fb && Array.isArray(v.d) === Array.isArray(fb) ? v.d : fb; };
  const save = (k, d) => Curio.store.set(`mines:${k}`, { v: VER, d });
  const ACH = [
    { id: 'win1', icon: '🚩', name: 'Minesweeper', desc: 'Win any game.' },
    { id: 'beginner', icon: '🌱', name: 'Cleared for takeoff', desc: 'Win on Beginner.' },
    { id: 'intermediate', icon: '🧰', name: 'Field medic', desc: 'Win on Intermediate.' },
    { id: 'expert', icon: '🎖️', name: 'Bomb squad', desc: 'Win on Expert.' },
    { id: 'fastB', icon: '⚡', name: 'Speed sweeper', desc: 'Win Beginner in under 15 seconds.' },
    { id: 'fastI', icon: '🏎️', name: 'Quick hands', desc: 'Win Intermediate in under 90 seconds.' },
    { id: 'fastE', icon: '🚀', name: 'Expert expert', desc: 'Win Expert in under 4 minutes.' },
    { id: 'noflag', icon: '🙈', name: 'Flagless', desc: 'Win Intermediate or Expert without placing a single flag.' },
    { id: 'noguess', icon: '🧠', name: 'Pure logic', desc: 'Win a no-guess board.' },
    { id: 'daily', icon: '📅', name: 'Daily sweep', desc: 'Win the Daily board.' },
    { id: 'streak3', icon: '🎩', name: 'Hat trick', desc: 'Win three games in a row.' },
    { id: 'wins25', icon: '🏅', name: 'Veteran', desc: 'Win 25 games.' },
    { id: 'custom', icon: '📐', name: 'Architect', desc: 'Win a custom board with at least 400 squares.' },
    { id: 'dense', icon: '🌶️', name: 'Thrill seeker', desc: 'Win a custom board where a quarter or more of the squares are mines.' },
    { id: 'chord', icon: '🎹', name: 'Chord master', desc: 'Chord 30 times in a single game.' },
    { id: 'nohint', icon: '🦉', name: 'No help needed', desc: 'Win Expert without using a hint.' },
    { id: 'eff', icon: '📈', name: 'Efficient', desc: 'Win Intermediate or Expert at 1.5 3BV per second or faster.' },
    { id: 'boom', icon: '💥', name: 'Kaboom', desc: 'Step on your first mine. It happens to everyone.' },
    { id: 'themes', icon: '🎨', name: 'Decorator', desc: 'Try every theme.' }
  ];
  let got = load('ach', {});
  let stats = load('stats', {});
  let hist = load('hist', []);
  const set = Object.assign({ diff: Curio.store.get('mines:diff', 'beginner'), noguess: false, qmarks: false, skin: 'tabletop', custom: { r: 12, c: 20, m: 45 }, zoom: {} }, load('set', {}));
  if (!LEVELS[set.diff] && set.diff !== 'custom' && set.diff !== 'daily') set.diff = 'beginner';
  if (!SKINS[set.skin]) set.skin = 'classic';
  if (!set.custom || typeof set.custom !== 'object') set.custom = { r: 12, c: 20, m: 45 };
  if (!set.zoom || typeof set.zoom !== 'object') set.zoom = {};
  const keepDiff = set.diff;
  if (Curio.simple) set.diff = 'beginner';
  const saveSet = () => save('set', Curio.simple ? { ...set, diff: keepDiff } : set);

  let gameId = 0, L, cells, els, state, flags, opened, elapsed, t0, timer, flagMode = false, focusIdx = 0;
  let clicks, hintsUsed, chords, flagsPlaced, ng, lastClick, bv3, nbCache = null;

  const idx = (r, c) => r * L.cols + c;
  function nbList(rows, cols) {
    if (nbCache && nbCache.rows === rows && nbCache.cols === cols) return nbCache.list;
    const list = [];
    for (let i = 0; i < rows * cols; i++) {
      const r = Math.floor(i / cols), c = i % cols, out = [];
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const rr = r + dr, cc = c + dc;
        if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) out.push(rr * cols + cc);
      }
      list.push(out);
    }
    nbCache = { rows, cols, list };
    return list;
  }
  const neighbours = (i) => nbList(L.rows, L.cols)[i];

  function mkRng(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const seedOf = (s) => { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

  function layout(rows, cols, mines, safe, rnd) {
    const N = rows * cols, nb = nbList(rows, cols);
    const avoid = new Set([safe, ...nb[safe]]);
    if (N - avoid.size < mines) { avoid.clear(); avoid.add(safe); }
    const pool = [];
    for (let i = 0; i < N; i++) if (!avoid.has(i)) pool.push(i);
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    const mine = new Uint8Array(N);
    for (let k = 0; k < mines; k++) mine[pool[k]] = 1;
    const num = new Uint8Array(N);
    for (let i = 0; i < N; i++) { let n = 0; for (const j of nb[i]) n += mine[j]; num[i] = n; }
    return { mine, num };
  }
  function propagate(st, num, rows, cols, total, reveal, want) {
    const N = rows * cols, nb = nbList(rows, cols);
    let openCount = 0, flagCount = 0;
    for (let i = 0; i < N; i++) { if (st[i] === 1) openCount++; else if (st[i] === 2) flagCount++; }
    const stack = [];
    const openCell = (i) => {
      if (st[i] !== 0) return;
      st[i] = 1; openCount++;
      if (want != null && want.has(i)) want.found = i;
      if (reveal && num[i] === 0) stack.push(i);
      while (stack.length) {
        const j = stack.pop();
        for (const k of nb[j]) if (st[k] === 0) { st[k] = 1; openCount++; if (num[k] === 0) stack.push(k); }
      }
    };
    const flagCell = (i) => { if (st[i] === 0) { st[i] = 2; flagCount++; } };
    const known = reveal ? null : new Uint8Array(N);
    if (!reveal) for (let i = 0; i < N; i++) if (st[i] === 1) known[i] = 1;
    for (let guard = 0; guard < 2000; guard++) {
      if (want && want.found != null) return { openCount, done: false };
      let changed = false;
      const cons = [];
      for (let i = 0; i < N; i++) {
        if (st[i] !== 1 || (!reveal && !known[i]) || num[i] === 0) continue;
        const unk = [];
        let f = 0;
        for (const j of nb[i]) { if (st[j] === 0) unk.push(j); else if (st[j] === 2) f++; }
        if (!unk.length) continue;
        const need = num[i] - f;
        if (need === 0) { for (const j of unk) openCell(j); changed = true; }
        else if (need === unk.length) { for (const j of unk) flagCell(j); changed = true; }
        else cons.push({ cells: unk, need });
      }
      if (want && want.found != null) return { openCount, done: false };
      if (changed) continue;
      const byCell = new Map();
      cons.forEach((c, k) => { for (const j of c.cells) { let a = byCell.get(j); if (!a) byCell.set(j, (a = [])); a.push(k); } });
      outer: for (let a = 0; a < cons.length; a++) {
        const A2 = cons[a], setA = new Set(A2.cells), seen = new Set();
        for (const j of A2.cells) for (const b of byCell.get(j)) {
          if (b === a || seen.has(b)) continue;
          seen.add(b);
          const B = cons[b];
          const onlyB = B.cells.filter((x) => !setA.has(x));
          const setB = new Set(B.cells);
          const onlyA = A2.cells.filter((x) => !setB.has(x));
          const dn = B.need - A2.need;
          if (onlyB.length && dn === onlyB.length) { for (const x of onlyB) flagCell(x); for (const x of onlyA) openCell(x); changed = true; break outer; }
          if (!onlyA.length && onlyB.length && dn === 0) { for (const x of onlyB) openCell(x); changed = true; break outer; }
        }
      }
      if (changed) continue;
      const remM = total - flagCount;
      let unknown = 0;
      for (let i = 0; i < N; i++) if (st[i] === 0) unknown++;
      if (unknown && remM === 0) { for (let i = 0; i < N; i++) if (st[i] === 0) openCell(i); changed = true; }
      else if (unknown && remM === unknown) { for (let i = 0; i < N; i++) if (st[i] === 0) flagCell(i); changed = true; }
      if (!changed) break;
    }
    return { openCount, done: openCount === N - total };
  }
  function solvable(mine, num, rows, cols, total, start) {
    if (mine[start]) return false;
    const st = new Uint8Array(rows * cols);
    const nb = nbList(rows, cols);
    const stack = [start];
    st[start] = 1;
    while (stack.length) { const j = stack.pop(); if (num[j] === 0) for (const k of nb[j]) if (st[k] === 0) { st[k] = 1; stack.push(k); } }
    return propagate(st, num, rows, cols, total, true).done;
  }
  function generate(rows, cols, mines, safe, noGuess, rnd, done) {
    if (!noGuess) { done(layout(rows, cols, mines, safe, rnd), true); return; }
    const maxTries = Math.min(4000, Math.max(300, Math.round(600000 / (rows * cols))));
    let tries = 0, last = null;
    const myGame = gameId;
    const step = () => {
      if (myGame !== gameId) return;
      const t = performance.now();
      while (performance.now() - t < 30 && tries < maxTries) {
        tries++;
        last = layout(rows, cols, mines, safe, rnd);
        if (solvable(last.mine, last.num, rows, cols, mines, safe)) { done(last, true, tries); return; }
      }
      if (tries >= maxTries) { done(last, false, tries); return; }
      setTimeout(step, 0);
    };
    step();
  }
  function calc3BV() {
    const N = cells.length, seen = new Uint8Array(N);
    let n = 0;
    for (let i = 0; i < N; i++) {
      if (cells[i].mine || cells[i].n || seen[i]) continue;
      n++;
      const stack = [i];
      seen[i] = 1;
      while (stack.length) { const j = stack.pop(); for (const k of neighbours(j)) if (!seen[k] && !cells[k].mine) { seen[k] = 1; if (cells[k].n === 0) stack.push(k); } }
    }
    for (let i = 0; i < N; i++) if (!cells[i].mine && !seen[i]) n++;
    return n;
  }

  const FLAG = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6.5 3v13.5" stroke="var(--pole)" stroke-width="2" stroke-linecap="round"/><path d="M7.5 3.2l8.5 3.6-8.5 3.6z" fill="var(--flag)"/><path d="M7.5 3.2l8.5 3.6-3 1.3z" fill="#fff" opacity=".25"/><path d="M3.5 17h6.5" stroke="var(--pole)" stroke-width="2.2" stroke-linecap="round"/></svg>';
  const MINE = '<svg viewBox="0 0 20 20" aria-hidden="true"><g stroke="var(--mine)" stroke-width="2" stroke-linecap="round"><path d="M10 2.2v15.6M2.2 10h15.6M4.6 4.6l10.8 10.8M15.4 4.6L4.6 15.4"/></g><circle cx="10" cy="10" r="5.4" fill="var(--mine)"/><circle cx="8.2" cy="8.2" r="1.7" fill="#fff" opacity=".85"/></svg>';
  const SHOVEL = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2v9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M7 2h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M6 11h8v3a4 4 0 0 1-8 0z" fill="currentColor"/></svg>';
  function faceSVG(mood) {
    const eyes = mood === 'dead' ? '<path d="M12 15l5 5M17 15l-5 5M27 15l5 5M32 15l-5 5" stroke="#3a2a10" stroke-width="2.4" stroke-linecap="round"/>' : mood === 'cool' ? '<path d="M9 16h26" stroke="#1a1a1a" stroke-width="2.5"/><rect x="10" y="15" width="10" height="7" rx="3" fill="#1a1a1a"/><rect x="24" y="15" width="10" height="7" rx="3" fill="#1a1a1a"/><rect x="12" y="16" width="3" height="2" fill="#fff" opacity=".6"/>' : '<circle cx="15" cy="18" r="2.6" fill="#3a2a10"/><circle cx="29" cy="18" r="2.6" fill="#3a2a10"/>';
    const mouth = mood === 'oh' ? '<ellipse cx="22" cy="30" rx="4" ry="5" fill="#3a2a10"/>' : mood === 'dead' ? '<path d="M15 32q7-6 14 0" stroke="#3a2a10" stroke-width="2.6" fill="none" stroke-linecap="round"/>' : mood === 'think' ? '<path d="M16 30h12" stroke="#3a2a10" stroke-width="2.6" stroke-linecap="round"/>' : '<path d="M14 27q8 8 16 0" stroke="#3a2a10" stroke-width="2.6" fill="none" stroke-linecap="round"/>';
    return `<svg viewBox="0 0 44 44" aria-hidden="true"><defs><radialGradient id="fg" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff6b0"/><stop offset=".5" stop-color="#ffd23d"/><stop offset="1" stop-color="#f0a800"/></radialGradient></defs><circle cx="22" cy="22" r="19" fill="url(#fg)" stroke="#d18f00" stroke-width="1.5"/>${eyes}${mouth}${mood === 'cool' || mood === 'smile' ? '<circle cx="11" cy="25" r="3" fill="#ff8a7a" opacity=".5"/><circle cx="33" cy="25" r="3" fill="#ff8a7a" opacity=".5"/>' : ''}</svg>`;
  }
  const setFace = (m) => { $('face').innerHTML = faceSVG(m); };
  function paintFlagTool() {
    $('flagmode').innerHTML = flagMode ? `${FLAG}Flag mode` : `${SHOVEL}Dig mode`;
    $('flagmode').setAttribute('aria-pressed', String(flagMode));
    $('flagmode').style.setProperty('--pole', 'currentColor');
    $('flagmode').style.setProperty('--flag', '#e0352b');
  }

  function applySkin() {
    const S = SKINS[set.skin] || SKINS.classic;
    const v = Curio.isDark() ? S.dark : S.light;
    const map = { cov: v.cov, covAlt: v.covAlt, hi: v.hi, lo: v.lo, open: v.open, openAlt: v.openAlt, line: v.line, frame: v.frame, mine: v.mine, flag: v.flag, pole: v.pole, boom: v.boom };
    for (const k in map) fieldEl.style.setProperty('--' + k, map[k]);
    v.nums.forEach((c, i) => fieldEl.style.setProperty(`--n${i + 1}`, c));
    fieldEl.classList.toggle('glow', !!S.glow);
    fieldEl.dataset.skin = set.skin;
    document.querySelectorAll('.m-skin').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.skin === set.skin)));
  }
  addEventListener('curio:theme', applySkin);
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applySkin);

  function levelFor(d) {
    if (d === 'custom') {
      const r = Math.max(5, Math.min(30, +set.custom.r || 12)), c = Math.max(5, Math.min(40, +set.custom.c || 20));
      const m = Math.max(1, Math.min(r * c - 9, +set.custom.m || 10));
      return { key: 'custom', name: `Custom ${r}×${c}`, rows: r, cols: c, mines: m, cell: c > 30 ? 26 : 32 };
    }
    if (d === 'daily') return { key: 'daily', name: `Daily ${today()}`, ...LEVELS.intermediate, daily: true };
    return { key: d, ...LEVELS[d] };
  }
  function newGame(d = set.diff) {
    set.diff = d;
    saveSet();
    gameId++;
    L = levelFor(d);
    nbList(L.rows, L.cols);
    cells = Array.from({ length: L.rows * L.cols }, () => ({ mine: false, n: 0, open: false, flag: false, q: false }));
    state = 'ready'; flags = 0; opened = 0; elapsed = 0; focusIdx = 0;
    clicks = 0; hintsUsed = 0; chords = 0; flagsPlaced = 0; lastClick = 0; bv3 = 0;
    ng = set.noguess || !!L.daily;
    clearInterval(timer); timer = null;
    document.querySelectorAll('[data-d]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.d === d)));
    $('custom').hidden = d !== 'custom';
    fieldEl.style.setProperty('--cols', L.cols);
    fieldEl.innerHTML = '';
    fieldEl.classList.remove('shake');
    const frag = document.createDocumentFragment();
    els = cells.map((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      const r = Math.floor(i / L.cols), c = i % L.cols;
      b.className = 'cell' + ((r + c) % 2 ? ' alt' : '');
      b.dataset.i = i;
      b.tabIndex = i === 0 ? 0 : -1;
      b.setAttribute('aria-label', `Row ${r + 1}, column ${c + 1}, hidden`);
      frag.append(b);
      return b;
    });
    fieldEl.append(frag);
    fit();
    setFace('smile');
    $('startTip').hidden = !!L.daily;
    $('gen').hidden = true;
    $('tip').textContent = DATA.tips[(Math.random() * DATA.tips.length) | 0];
    hideOv();
    hud();
    if (L.daily) {
      const rnd = mkRng(seedOf('ms-' + today()));
      const start = Math.floor(rnd() * cells.length);
      state = 'gen';
      $('gen').hidden = false;
      setFace('think');
      generate(L.rows, L.cols, L.mines, start, true, rnd, (res) => {
        install(res);
        $('gen').hidden = true;
        state = 'ready-daily';
        setFace('smile');
        floodOpen(start, true);
        hud();
      });
    }
  }
  function fit() {
    const avail = scroller.clientWidth - 22;
    let cs = Math.min(L.cell, Math.floor(avail / L.cols));
    if (cs < 22) cs = 28;
    const z = set.zoom[L.key];
    if (z) cs = Math.max(16, Math.min(52, z));
    fieldEl.style.setProperty('--cs', cs + 'px');
    scroller.classList.toggle('fits', cs * L.cols + 22 <= scroller.clientWidth);
  }
  function zoom(dz) {
    const cur = parseFloat(fieldEl.style.getPropertyValue('--cs')) || 30;
    set.zoom[L.key] = Math.max(16, Math.min(52, cur + dz));
    saveSet();
    fit();
    Curio.beep(dz > 0 ? 700 : 500, 0.03, 'triangle', 0.04);
  }
  function hud() {
    $('left').textContent = L.mines - flags;
    $('time').textContent = Math.min(9999, Math.floor(elapsed));
    $('hint').disabled = !(state === 'playing' || state === 'ready-daily');
  }
  function tick() {
    if (document.hidden || state !== 'playing' || !ovEl.hidden) { t0 = performance.now(); return; }
    const now = performance.now();
    elapsed += (now - t0) / 1000;
    t0 = now;
    hud();
  }
  document.addEventListener('visibilitychange', () => { t0 = performance.now(); if (document.hidden) save('stats', stats); });

  function paint(i, delay) {
    const c = cells[i], el = els[i];
    const r = Math.floor(i / L.cols), col = i % L.cols;
    const rc = `Row ${r + 1}, column ${col + 1}`;
    el.className = 'cell' + ((r + col) % 2 ? ' alt' : '');
    if (c.open) {
      el.classList.add('open');
      if (delay != null) { el.classList.add('reveal'); el.style.setProperty('--d', delay + 'ms'); }
      if (c.mine) { el.innerHTML = MINE; el.setAttribute('aria-label', `${rc}, mine`); }
      else if (c.n) { el.textContent = c.n; el.classList.add('num', 'n' + c.n); el.setAttribute('aria-label', `${rc}, ${c.n}`); }
      else { el.textContent = ''; el.setAttribute('aria-label', `${rc}, empty`); }
    } else if (c.flag) { el.innerHTML = FLAG; el.classList.add('flag'); el.setAttribute('aria-label', `${rc}, flagged`); }
    else if (c.q) { el.innerHTML = '<span class="q">?</span>'; el.setAttribute('aria-label', `${rc}, question mark`); }
    else { el.textContent = ''; el.setAttribute('aria-label', `${rc}, hidden`); }
  }
  function install(res) {
    cells.forEach((c, i) => { c.mine = !!res.mine[i]; c.n = res.num[i]; });
    bv3 = calc3BV();
  }
  function startTimer() {
    state = 'playing';
    t0 = performance.now();
    clearInterval(timer);
    timer = setInterval(tick, 200);
  }
  function begin(i) {
    $('startTip').hidden = true;
    if (!ng) {
      install(layout(L.rows, L.cols, L.mines, i, Math.random));
      startTimer();
      floodOpen(i);
      return;
    }
    state = 'gen';
    $('gen').hidden = false;
    setFace('think');
    const gid = gameId;
    generate(L.rows, L.cols, L.mines, i, true, Math.random, (res, ok) => {
      if (gid !== gameId) return;
      install(res);
      $('gen').hidden = true;
      setFace('smile');
      if (!ok) { ng = false; Curio.toast('No perfectly fair board found in time. This one may need a guess.'); }
      startTimer();
      floodOpen(i);
    });
  }
  function floodOpen(i, quiet) {
    const c = cells[i];
    if (c.flag || c.open) return;
    if (c.mine) { lose(i); return; }
    const order = [], dist = new Map([[i, 0]]), queue = [i];
    while (queue.length) {
      const j = queue.shift(), cj = cells[j];
      if (cj.open || cj.flag) continue;
      cj.open = true; cj.q = false; opened++; order.push(j);
      if (cj.n === 0) for (const k of neighbours(j)) if (!cells[k].open && !cells[k].flag && !dist.has(k)) { dist.set(k, dist.get(j) + 1); queue.push(k); }
    }
    order.forEach((j) => paint(j, Math.min(600, dist.get(j) * 22)));
    if (!quiet) {
      if (order.length > 1) {
        const ac = !Curio.muted && order.length > 6;
        Curio.beep(520, 0.05, 'triangle', 0.05); window.Cafe?.sound('pebble', 0.8);
        if (ac) [660, 784, 988].forEach((f, k) => setTimeout(() => Curio.beep(f, 0.05, 'triangle', 0.04), 40 + k * 45));
      } else { Curio.beep(380 + c.n * 60, 0.03, 'triangle', 0.035); window.Cafe?.sound('tile', 0.6); }
    }
    checkWin();
  }
  function reveal(i) {
    if (state === 'won' || state === 'lost' || state === 'gen') return;
    const c = cells[i];
    if (c.flag || c.open) return;
    clicks++;
    lastClick = i;
    if (state === 'ready') { begin(i); return; }
    if (state === 'ready-daily') startTimer();
    floodOpen(i);
  }
  function chord(i) {
    const c = cells[i];
    if (!c.open || !c.n || (state !== 'playing' && state !== 'ready-daily')) return;
    if (state === 'ready-daily') startTimer();
    const nb = neighbours(i);
    const f = nb.filter((j) => cells[j].flag).length;
    if (f !== c.n) {
      nb.forEach((j) => { if (!cells[j].open && !cells[j].flag) { els[j].classList.add('press'); setTimeout(() => els[j].classList.remove('press'), 160); } });
      return;
    }
    const closed = nb.filter((j) => !cells[j].open && !cells[j].flag);
    if (!closed.length) return;
    clicks++;
    chords++;
    if (chords >= 30) unlock('chord');
    stat('chords');
    const hit = closed.find((j) => cells[j].mine);
    if (hit != null) { lose(hit); return; }
    lastClick = i;
    closed.forEach((j) => floodOpen(j));
  }
  function cycleMark(i) {
    if (state === 'won' || state === 'lost' || state === 'gen') return;
    const c = cells[i];
    if (c.open) return;
    if (!c.flag && !c.q) { c.flag = true; flags++; flagsPlaced++; stat('flags'); }
    else if (c.flag) { c.flag = false; flags--; if (set.qmarks) c.q = true; }
    else c.q = false;
    paint(i);
    if (c.flag) els[i].classList.add('flagged');
    Curio.beep(c.flag ? 880 : 440, 0.04, 'square', 0.02); window.Cafe?.sound('wood', 0.5);
    try { navigator.vibrate?.(15); } catch {}
    hud();
  }
  function checkWin() {
    if (opened !== cells.length - L.mines || (state !== 'playing' && state !== 'ready-daily')) return;
    tick();
    state = 'won';
    clearInterval(timer);
    cells.forEach((c, i) => { if (c.mine && !c.flag) { c.flag = true; paint(i); } });
    flags = L.mines;
    hud();
    setFace('cool');
    const lr = Math.floor(lastClick / L.cols), lc = lastClick % L.cols;
    els.forEach((el, i) => { if (cells[i].mine) return; const d = Math.hypot(Math.floor(i / L.cols) - lr, i % L.cols - lc); el.style.setProperty('--d', Math.round(d * 30) + 'ms'); el.classList.remove('reveal'); el.classList.add('win'); });
    const secs = Math.round(elapsed * 10) / 10;
    const bvs = secs > 0 ? bv3 / secs : bv3;
    const key = L.key === 'custom' ? `time-custom-${L.rows}x${L.cols}x${L.mines}` : `time-${L.key}${ng && !L.daily ? '-ng' : ''}`;
    const b = Curio.best(key, secs, false);
    record(true, secs);
    unlock('win1');
    if (LEVELS[L.key]) unlock(L.key);
    if (L.key === 'beginner' && secs < 15) unlock('fastB');
    if (L.key === 'intermediate' && secs < 90) unlock('fastI');
    if (L.key === 'expert' && secs < 240) unlock('fastE');
    if ((L.key === 'intermediate' || L.key === 'expert' || L.daily) && flagsPlaced === 0) unlock('noflag');
    if (ng) unlock('noguess');
    if (L.daily) unlock('daily');
    if (L.key === 'custom' && L.rows * L.cols >= 400) unlock('custom');
    if (L.key === 'custom' && L.mines / (L.rows * L.cols) >= 0.25) unlock('dense');
    if (L.key === 'expert' && hintsUsed === 0) unlock('nohint');
    if ((L.key === 'intermediate' || L.key === 'expert' || L.daily) && bvs >= 1.5) unlock('eff');
    Curio.confetti();
    [523, 659, 784, 1046, 1318].forEach((f, k) => setTimeout(() => Curio.beep(f, 0.12, 'triangle', 0.1), k * 90));
    const gid = gameId;
    setTimeout(() => {
      if (gid !== gameId) return;
      const best = typeof b.best === 'number' ? b.best : secs;
      showCard(`<div class="m-art">${medal(b.isNew ? '#ffd34d' : '#dfe6ee', b.isNew ? '#e0a100' : '#9aa7b6')}</div><h2>Field cleared!</h2><div class="m-big">${secs.toFixed(1)}s</div>${b.isNew ? '<span class="m-new">★ New best time</span>' : `<p>Best: ${best.toFixed(1)}s</p>`}<div class="m-rows"><div><b>${bv3}</b><span>3BV</span></div><div><b>${bvs.toFixed(2)}</b><span>3BV/s</span></div><div><b>${clicks ? Math.round(100 * bv3 / clicks) : 100}%</b><span>Efficiency</span></div></div><p>${L.name}${ng ? ' · no-guess' : ''}${hintsUsed ? ` · ${hintsUsed} hint${hintsUsed > 1 ? 's' : ''}` : ''}. ${winLine(secs)}</p>`, [
        ['Play again', () => newGame()],
        ['Admire the field', hideOv, true],
        ['Copy result', () => copy(`Zoble Minesweeper · ${L.name}${ng ? ' (no-guess)' : ''} · cleared in ${secs.toFixed(1)}s · 3BV ${bv3} · ${bvs.toFixed(2)} 3BV/s`), true]
      ]);
    }, 900);
  }
  function winLine(s) {
    if (L.key === 'beginner') return s < 10 ? 'Blink and you missed it.' : s < 30 ? 'Nice and tidy.' : 'Safe and sound.';
    if (L.key === 'expert') return s < 200 ? 'Genuinely elite.' : 'The bomb squad wants your number.';
    return 'Not a single toe lost.';
  }
  const medal = (c1, c2) => `<svg viewBox="0 0 120 120"><defs><radialGradient id="mm" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".25" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></radialGradient></defs><path d="M40 6h16l10 30H50zM80 6H64L54 36h16z" fill="#e84a5f"/><circle cx="60" cy="72" r="40" fill="${c2}"/><circle cx="60" cy="70" r="38" fill="url(#mm)"/><g transform="translate(43 52) scale(1.7)"><path d="M6.5 3v13.5" stroke="#5a3a1e" stroke-width="2" stroke-linecap="round"/><path d="M7.5 3.2l8.5 3.6-8.5 3.6z" fill="#e0352b"/><path d="M3.5 17h6.5" stroke="#5a3a1e" stroke-width="2.2" stroke-linecap="round"/></g></svg>`;
  function lose(i) {
    const gid = gameId;
    tick();
    state = 'lost';
    clearInterval(timer);
    setFace('dead');
    record(false, elapsed);
    unlock('boom');
    cells[i].open = true;
    paint(i);
    els[i].classList.add('boom');
    boomAt(els[i], true);
    const mines = [];
    cells.forEach((c, j) => {
      if (c.mine && !c.flag && j !== i) mines.push(j);
      if (c.flag && !c.mine) els[j].classList.add('wrong');
    });
    const r0 = Math.floor(i / L.cols), c0 = i % L.cols;
    mines.sort((a, b) => Math.hypot(Math.floor(a / L.cols) - r0, a % L.cols - c0) - Math.hypot(Math.floor(b / L.cols) - r0, b % L.cols - c0));
    const step = Math.min(40, 1100 / Math.max(1, mines.length));
    mines.forEach((j, k) => setTimeout(() => {
      if (gid !== gameId) return;
      cells[j].open = true;
      paint(j, 0);
      if (k < 25 && k % 2 === 0) boomAt(els[j], false);
    }, 120 + k * step));
    fieldEl.classList.remove('shake'); void fieldEl.offsetWidth; fieldEl.classList.add('shake');
    noise(0.7, 0.25);
    Curio.beep(80, 0.5, 'sawtooth', 0.12);
    try { navigator.vibrate?.([80, 40, 160]); } catch {}
    const left = cells.length - L.mines - opened;
    setTimeout(() => {
      if (gid !== gameId) return;
      showCard(`<div class="m-art">${MINE.replace('aria-hidden="true"', 'style="--mine:#d64545"')}</div><h2>Kaboom.</h2><p>${left} safe square${left === 1 ? '' : 's'} to go. ${left <= 5 ? 'So close it hurts.' : 'The mines were exactly where you would least expect them.'}</p><div class="m-rows"><div><b>${Math.floor(elapsed)}s</b><span>Time</span></div><div><b>${Math.round(100 * opened / Math.max(1, cells.length - L.mines))}%</b><span>Cleared</span></div><div><b>${stats[L.key]?.streak || 0}</b><span>Streak</span></div></div>`, [
        ['Try again', () => newGame()],
        ['Look at the damage', hideOv, true]
      ]);
    }, 1400);
  }
  function stat(k, n = 1) { stats[k] = (stats[k] || 0) + n; return stats[k]; }
  function record(win, secs) {
    const k = L.key;
    const s = stats[k] && typeof stats[k] === 'object' ? stats[k] : { played: 0, won: 0, total: 0, streak: 0, bestStreak: 0 };
    s.played++;
    if (win) { s.won++; s.total += secs; s.streak++; s.bestStreak = Math.max(s.bestStreak, s.streak); }
    else s.streak = 0;
    stats[k] = s;
    stats.allStreak = win ? (stats.allStreak || 0) + 1 : 0;
    if (win) { const w = stat('wins'); if (w >= 25) unlock('wins25'); }
    if (stats.allStreak >= 3) unlock('streak3');
    hist.unshift({ d: today().slice(5), k: L.name, w: win, t: win ? Math.round(secs * 10) / 10 : null, ng });
    hist = hist.slice(0, 15);
    save('stats', stats);
    save('hist', hist);
    renderTab();
  }

  let fxCanvas = null, fxCtx = null, fxList = [], fxRaf = 0;
  function boomAt(el, big) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = el.getBoundingClientRect();
    if (!fxCanvas) {
      fxCanvas = document.createElement('canvas');
      fxCanvas.className = 'm-fx';
      document.body.append(fxCanvas);
      fxCtx = fxCanvas.getContext('2d');
    }
    const dpr = Math.min(2, devicePixelRatio || 1);
    if (fxCanvas.width !== Math.round(innerWidth * dpr)) { fxCanvas.width = Math.round(innerWidth * dpr); fxCanvas.height = Math.round(innerHeight * dpr); }
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const cols = ['#ff5a36', '#ffc233', '#fff3a0', '#5a5a5a'];
    for (let k = 0; k < (big ? 46 : 12); k++) {
      const a = Math.random() * Math.PI * 2, s = (big ? 160 : 90) + Math.random() * (big ? 320 : 160);
      fxList.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80, life: 0.5 + Math.random() * 0.6, size: 2 + Math.random() * (big ? 6 : 4), c: cols[(Math.random() * cols.length) | 0] });
    }
    fxList.push({ ring: true, x, y, life: 0.45, r: big ? 80 : 30 });
    if (!fxRaf) { fxLast = 0; fxRaf = requestAnimationFrame(fxTick); }
  }
  let fxLast = 0;
  function fxTick(t) {
    const dt = fxLast ? Math.min(0.05, (t - fxLast) / 1000) : 0.016;
    fxLast = t;
    const dpr = fxCanvas.width / innerWidth;
    fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fxCtx.clearRect(0, 0, innerWidth, innerHeight);
    for (let k = fxList.length - 1; k >= 0; k--) {
      const p = fxList[k];
      p.life -= dt;
      if (p.life <= 0) { fxList.splice(k, 1); continue; }
      if (p.ring) {
        fxCtx.globalAlpha = p.life / 0.45;
        fxCtx.strokeStyle = '#ffb33d';
        fxCtx.lineWidth = 5 * p.life / 0.45;
        fxCtx.beginPath(); fxCtx.arc(p.x, p.y, p.r * (1 - p.life / 0.45) + 4, 0, 7); fxCtx.stroke();
        continue;
      }
      p.vy += 700 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      fxCtx.globalAlpha = Math.min(1, p.life * 2);
      fxCtx.fillStyle = p.c;
      fxCtx.beginPath(); fxCtx.arc(p.x, p.y, p.size, 0, 7); fxCtx.fill();
    }
    fxCtx.globalAlpha = 1;
    if (fxList.length && !document.hidden) fxRaf = requestAnimationFrame(fxTick);
    else { fxRaf = 0; fxList.length = 0; fxCtx.clearRect(0, 0, innerWidth, innerHeight); }
  }
  let noiseBuf = null;
  function noise(d, vol) {
    if (Curio.muted) return;
    const ac = Curio.audioContext();
    if (!ac) return;
    if (!noiseBuf) { noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const ch = noiseBuf.getChannelData(0); for (let k = 0; k < ch.length; k++) ch[k] = Math.random() * 2 - 1; }
    const t = ac.currentTime, src = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter();
    src.buffer = noiseBuf;
    f.type = 'lowpass';
    f.frequency.setValueAtTime(1200, t);
    f.frequency.exponentialRampToValueAtTime(60, t + d);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    src.connect(f).connect(g).connect(ac.destination);
    src.start(t);
    src.stop(t + d + 0.02);
  }

  function showCard(html, buttons) {
    cardEl.innerHTML = html;
    const row = document.createElement('div');
    row.className = 'c-row';
    for (const [label, fn, ghost] of buttons) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = ghost ? 'c-btn c-btn--ghost' : 'c-btn';
      b.textContent = label;
      b.addEventListener('click', fn);
      row.append(b);
    }
    cardEl.append(row);
    ovEl.hidden = false;
    row.querySelector('button')?.focus({ preventScroll: true });
  }
  function hideOv() { ovEl.hidden = true; }
  ovEl.addEventListener('click', (e) => { if (e.target === ovEl) hideOv(); });
  function copy(text) {
    try { navigator.clipboard.writeText(text).then(() => Curio.toast('Result copied'), () => Curio.toast('Could not copy')); } catch { Curio.toast('Could not copy'); }
  }

  function hint() {
    if (state !== 'playing' && state !== 'ready-daily') return;
    const N = cells.length;
    const st = new Uint8Array(N);
    const num = new Uint8Array(N);
    cells.forEach((c, i) => { if (c.open) st[i] = 1; num[i] = c.n; });
    const want = new Set();
    for (let i = 0; i < N; i++) if (!cells[i].open && !cells[i].mine) want.add(i);
    propagate(st, num, L.rows, L.cols, L.mines, false, want);
    let pick = want.found;
    if (pick == null) {
      const frontier = [...want].filter((i) => neighbours(i).some((j) => cells[j].open));
      const pool = frontier.length ? frontier : [...want];
      if (!pool.length) return;
      pick = pool[(Math.random() * pool.length) | 0];
      Curio.toast('No sure move right now, so here is a free safe square.');
    }
    if (cells[pick].flag) { cells[pick].flag = false; flags--; }
    hintsUsed++;
    stat('hints');
    elapsed += 15;
    if (state === 'ready-daily') startTimer();
    els[pick].classList.add('hinted');
    focusTo(pick, false);
    const el = els[pick];
    el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    Curio.beep(990, 0.07, 'sine', 0.06);
    setTimeout(() => { el.classList.remove('hinted'); }, 3100);
    hud();
  }

  let press = null, suppressClick = false, lastPointer = 'mouse';
  fieldEl.addEventListener('pointerdown', (e) => {
    lastPointer = e.pointerType;
    const el = e.target.closest('.cell');
    if (!el) return;
    if (state === 'playing' || state === 'ready' || state === 'ready-daily') setFace('oh');
    if (e.pointerType !== 'mouse') {
      const i = +el.dataset.i;
      press = { i, x: e.clientX, y: e.clientY, t: setTimeout(() => { suppressClick = true; press = null; if (cells[i].open) chord(i); else act(i, 'flag'); }, 380) };
    }
  });
  const endPress = () => { if (press) clearTimeout(press.t); press = null; if (state === 'playing' || state === 'ready' || state === 'ready-daily') setFace('smile'); };
  fieldEl.addEventListener('pointermove', (e) => { if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 10) { clearTimeout(press.t); press = null; } });
  fieldEl.addEventListener('pointerup', endPress);
  fieldEl.addEventListener('pointercancel', endPress);
  fieldEl.addEventListener('pointerleave', endPress);
  fieldEl.addEventListener('click', (e) => {
    const el = e.target.closest('.cell');
    if (!el) return;
    if (suppressClick) { suppressClick = false; return; }
    act(+el.dataset.i, flagMode ? 'flag' : 'dig');
  });
  fieldEl.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (lastPointer !== 'mouse') return;
    const el = e.target.closest('.cell');
    if (el) act(+el.dataset.i, 'flag');
  });
  function act(i, how) {
    focusTo(i, false);
    const c = cells[i];
    if (c.open) { chord(i); return; }
    if (how === 'flag') { if (state === 'ready') Curio.toast('Dig somewhere first. The first square is always safe.'); else cycleMark(i); }
    else reveal(i);
  }
  function focusTo(i, focus = true) {
    if (els[focusIdx]) els[focusIdx].tabIndex = -1;
    focusIdx = i;
    els[i].tabIndex = 0;
    if (focus) els[i].focus();
  }
  fieldEl.addEventListener('keydown', (e) => {
    const el = e.target.closest('.cell');
    if (!el) return;
    const i = +el.dataset.i, r = Math.floor(i / L.cols), c = i % L.cols;
    const mv = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key];
    if (mv) {
      e.preventDefault();
      focusTo(idx(Math.max(0, Math.min(L.rows - 1, r + mv[0])), Math.max(0, Math.min(L.cols - 1, c + mv[1]))));
    } else if (e.key === 'f' || e.key === 'F') { e.preventDefault(); act(i, 'flag'); }
  });
  $('face').addEventListener('click', () => newGame());
  $('flagmode').addEventListener('click', () => { flagMode = !flagMode; paintFlagTool(); Curio.beep(600, 0.03, 'triangle', 0.05); });
  $('hint').addEventListener('click', hint);
  $('zoomIn').addEventListener('click', () => zoom(4));
  $('zoomOut').addEventListener('click', () => zoom(-4));
  document.querySelectorAll('[data-d]').forEach((b) => b.addEventListener('click', async () => {
    if (state === 'playing' && opened > 10) {
      const v = await Curio.modal({ emoji: '🤔', title: 'Abandon this field?', body: 'Switching boards ends the current game.', buttons: [{ label: 'Switch', value: 'y' }, { label: 'Keep playing', value: 'n' }] });
      if (v !== 'y') return;
    }
    newGame(b.dataset.d);
  }));
  $('custom').addEventListener('submit', (e) => {
    e.preventDefault();
    const r = Math.max(5, Math.min(30, +$('cRows').value || 12)), c = Math.max(5, Math.min(40, +$('cCols').value || 20));
    const m = Math.max(1, Math.min(r * c - 9, +$('cMines').value || 10));
    $('cRows').value = r; $('cCols').value = c; $('cMines').value = m;
    set.custom = { r, c, m };
    newGame('custom');
  });
  $('cRows').value = set.custom.r; $('cCols').value = set.custom.c; $('cMines').value = set.custom.m;
  $('noguess').checked = !!set.noguess;
  $('qmarks').checked = !!set.qmarks;
  $('noguess').addEventListener('change', () => { set.noguess = $('noguess').checked; saveSet(); if (state === 'ready') ng = set.noguess || !!L.daily; else Curio.toast(set.noguess ? 'No-guess boards from your next game' : 'Classic random boards from your next game'); });
  $('qmarks').addEventListener('change', () => { set.qmarks = $('qmarks').checked; saveSet(); });
  for (const [id, S] of Object.entries(SKINS)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'm-skin';
    b.dataset.skin = id;
    b.title = S.name;
    b.setAttribute('aria-label', `${S.name} theme`);
    b.innerHTML = `<i style="background:${S.sw[0]}"></i><i style="background:${S.sw[1]}"></i>`;
    b.addEventListener('click', () => {
      set.skin = id;
      saveSet();
      applySkin();
      Curio.beep(700, 0.04, 'triangle', 0.05);
      const tried = new Set(load('tried', []));
      tried.add(id);
      save('tried', [...tried]);
      if (tried.size >= Object.keys(SKINS).length) unlock('themes');
    });
    $('skins').append(b);
  }
  addEventListener('resize', () => fit());
  let wheelAcc = 0;
  scroller.addEventListener('wheel', (e) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    wheelAcc += e.deltaY;
    if (Math.abs(wheelAcc) < 12) return;
    const cur = parseFloat(fieldEl.style.getPropertyValue('--cs')) || 30;
    set.zoom[L.key] = Math.max(16, Math.min(52, cur + (wheelAcc < 0 ? 2 : -2)));
    wheelAcc = 0;
    saveSet();
    fit();
  }, { passive: false });
  if (!Curio.store.get('mines:tip-touchpad', false)) {
    Curio.store.set('mines:tip-touchpad', true);
    setTimeout(() => Curio.toast('Tip: no right-click needed. Use the Dig/Flag button or press F to flag. Pinch to zoom big boards.', 4200), 900);
  }
  addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.target.closest?.('input') || document.querySelector('.curio-modal')) return;
    if (!ovEl.hidden && e.key === 'Escape') { hideOv(); return; }
    if (e.key === 'n' || e.key === 'N') newGame();
    if (e.key === 'h' || e.key === 'H') hint();
  });

  let badgeQ = [], badgeOn = false;
  function unlock(id) {
    if (got[id]) return;
    const a = ACH.find((x) => x.id === id);
    if (!a) return;
    got[id] = Date.now();
    save('ach', got);
    badgeQ.push(a);
    nextBadge();
    renderTab();
  }
  function nextBadge() {
    if (badgeOn || !badgeQ.length) return;
    const a = badgeQ.shift();
    badgeOn = true;
    Curio.toast(`${a.icon} Badge unlocked: ${a.name}`, 2200);
    setTimeout(() => { badgeOn = false; nextBadge(); }, 2400);
  }
  let tab = 'help';
  function renderTab(t = tab) {
    tab = t;
    document.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === t)));
    document.querySelectorAll('[data-body]').forEach((b) => { b.hidden = b.dataset.body !== t; });
    if (t === 'ach') {
      const box = document.querySelector('[data-body="ach"]');
      box.innerHTML = `<p>${ACH.filter((a) => got[a.id]).length} of ${ACH.length} badges earned.</p><div class="m-achs"></div>`;
      const list = box.querySelector('.m-achs');
      for (const a of ACH) {
        const el = document.createElement('div');
        el.className = 'm-ach' + (got[a.id] ? ' is-got' : '');
        el.innerHTML = '<i></i><div><b></b><span></span></div>';
        el.querySelector('i').textContent = got[a.id] ? a.icon : '?';
        el.querySelector('b').textContent = a.name;
        el.querySelector('span').textContent = a.desc;
        list.append(el);
      }
    }
    if (t === 'stats') {
      const box = document.querySelector('[data-body="stats"]');
      const rows = ['beginner', 'intermediate', 'expert', 'custom', 'daily'].map((k) => {
        const s = stats[k] && typeof stats[k] === 'object' ? stats[k] : { played: 0, won: 0, total: 0, bestStreak: 0 };
        const best = k === 'custom' ? null : Curio.getBest(`time-${k}`);
        const bestNg = LEVELS[k] ? Curio.getBest(`time-${k}-ng`) : null;
        const fmtT = (v) => (typeof v === 'number' ? v.toFixed(1) + 's' : '-');
        return `<tr><td>${k === 'daily' ? 'Daily' : k[0].toUpperCase() + k.slice(1)}</td><td>${s.played}</td><td>${s.played ? Math.round(100 * s.won / s.played) + '%' : '-'}</td><td>${fmtT(best)}</td><td>${fmtT(bestNg)}</td><td>${s.won ? (s.total / s.won).toFixed(0) + 's' : '-'}</td><td>${s.bestStreak || 0}</td></tr>`;
      }).join('');
      box.innerHTML = `<div class="m-tablewrap"><table class="m-table"><thead><tr><th>Board</th><th>Played</th><th>Won</th><th>Best</th><th>Best NG</th><th>Avg</th><th>Streak</th></tr></thead><tbody>${rows}</tbody></table></div><p class="c-muted" style="font-size:12.5px">NG = no-guess boards. Flags planted: ${Curio.fmt(stats.flags || 0)} · chords: ${Curio.fmt(stats.chords || 0)} · hints: ${Curio.fmt(stats.hints || 0)}</p>`;
      if (hist.length) {
        const h = document.createElement('div');
        h.className = 'm-hist';
        h.innerHTML = '<h3>Recent games</h3>';
        for (const r of hist) { const d = document.createElement('div'); d.innerHTML = '<span></span><b></b>'; d.querySelector('span').textContent = `${r.d} · ${r.k}${r.ng ? ' · NG' : ''}`; d.querySelector('b').textContent = r.w ? `✓ ${r.t}s` : '💥'; h.append(d); }
        box.append(h);
      }
    }
  }
  document.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => renderTab(b.dataset.tab)));

  paintFlagTool();
  applySkin();
  newGame(set.diff);
  renderTab('help');

  window.__mines = {
    newGame, reveal, toggleFlag: cycleMark, chord, hint,
    get cells() { return cells; }, get state() { return state; }, get L() { return L; }, get ng() { return ng; },
    solvable: (m, n, r, c, t, s) => solvable(m, n, r, c, t, s), layout, bv3: () => bv3
  };
})();
