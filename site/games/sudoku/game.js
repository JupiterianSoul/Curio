(() => {
  const E = window.SudokuEngine;
  const $ = (id) => document.getElementById(id);
  const KEY = 'sudoku:v2', VER = 2;
  const VARIANTS = {
    classic: { name: 'Classic', blurb: 'The 9×9 original. Rows, columns, boxes.' },
    mini: { name: 'Mini 6×6', blurb: 'Six digits, 2×3 boxes. A coffee-break puzzle.' },
    diagonal: { name: 'Diagonal', blurb: 'Both long diagonals need 1 to 9 too.' },
    killer: { name: 'Killer', blurb: 'Few clues. Dashed cages add up to their sums.' }
  };
  const LEVELS = { easy: 'Easy', medium: 'Medium', hard: 'Hard', expert: 'Expert' };
  const DAILY_PLAN = [['killer', 'easy'], ['classic', 'easy'], ['diagonal', 'medium'], ['mini', 'hard'], ['killer', 'medium'], ['classic', 'hard'], ['diagonal', 'hard']];
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const SKINS = { ocean: 214, matcha: 140, sakura: 335, sunset: 24, grape: 268 };
  const ACH = [
    { id: 'first', icon: '🧩', name: 'First grid', desc: 'Solve any puzzle.' },
    { id: 'mini', icon: '🍪', name: 'Bite-sized', desc: 'Solve a Mini 6×6.' },
    { id: 'diagonal', icon: '✖️', name: 'Cross-checked', desc: 'Solve a Diagonal sudoku.' },
    { id: 'killer', icon: '🔪', name: 'Killer instinct', desc: 'Solve a Killer sudoku.' },
    { id: 'expert', icon: '🎓', name: 'Expert', desc: 'Solve any Expert puzzle.' },
    { id: 'pure', icon: '🧘', name: 'No help', desc: 'Solve a Hard or Expert puzzle with no hints.' },
    { id: 'clean', icon: '✨', name: 'Spotless', desc: 'Solve without a single mistake.' },
    { id: 'quick', icon: '⚡', name: 'Speedy', desc: 'Solve a classic Easy in under 5 minutes.' },
    { id: 'swift', icon: '🏎️', name: 'Swift', desc: 'Solve a classic Medium in under 8 minutes.' },
    { id: 'daily', icon: '📅', name: 'Daily habit', desc: 'Solve a daily puzzle.' },
    { id: 'streak3', icon: '🔥', name: 'Three days running', desc: 'Daily streak of 3.' },
    { id: 'streak7', icon: '🌟', name: 'Full week', desc: 'Daily streak of 7.' },
    { id: 'notes', icon: '✏️', name: 'Pencil pusher', desc: 'Write 40 notes by hand in one puzzle.' },
    { id: 'learner', icon: '💡', name: 'Student', desc: 'Read 10 technique hints.' },
    { id: 'ten', icon: '🏅', name: 'Ten down', desc: 'Solve 10 puzzles.' },
    { id: 'fifty', icon: '🏆', name: 'Half century', desc: 'Solve 50 puzzles.' },
    { id: 'grand', icon: '👑', name: 'Grand master', desc: 'Solve Expert in all four variants.' }
  ];

  function load() {
    const base = { v: VER, variant: 'classic', level: 'easy', set: { check: true, same: true, clean: true, skin: 'ocean' }, stats: {}, ach: {}, daily: {}, solved: 0, hintsRead: 0, expertDone: [], game: null };
    const d = Curio.store.get(KEY, null);
    if (!d || typeof d !== 'object' || d.v !== VER) return base;
    const s = Object.assign(base, d);
    s.set = Object.assign({}, base.set, d.set || {});
    if (!VARIANTS[s.variant]) s.variant = 'classic';
    if (!LEVELS[s.level]) s.level = 'easy';
    if (!SKINS[s.set.skin]) s.set.skin = 'ocean';
    for (const k of ['stats', 'ach', 'daily']) if (!s[k] || typeof s[k] !== 'object') s[k] = {};
    if (!Array.isArray(s.expertDone)) s.expertDone = [];
    if (s.game && !(Array.isArray(s.game.vals) && Array.isArray(s.game.solution) && s.game.vals.length === s.game.solution.length)) s.game = null;
    return s;
  }
  const S = load();
  const save = () => Curio.store.set(KEY, S);

  const SFX = {
    ac() { return Curio.muted ? null : Curio.audioContext(); },
    tone(f, d = 0.1, type = 'sine', vol = 0.08, when = 0, f2 = 0) {
      const ac = this.ac(); if (!ac) return;
      const t = ac.currentTime + when, o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d + 0.03);
    },
    tick() { this.tone(1800, 0.02, 'sine', 0.03); },
    place(d) { const sc = [0, 523, 587, 659, 698, 784, 880, 988, 1047, 1175]; this.tone(sc[d] || 600, 0.12, 'triangle', 0.08); this.tone((sc[d] || 600) * 2, 0.06, 'sine', 0.02, 0.01); },
    note() { this.tone(1400, 0.035, 'sine', 0.035); },
    bad() { this.tone(180, 0.15, 'square', 0.05, 0, 120); },
    unit(k = 0) { [659, 784, 988, 1319].forEach((f, i) => this.tone(f * (1 + k * 0.06), 0.16, 'triangle', 0.06, i * 0.06)); },
    erase() { this.tone(500, 0.07, 'sine', 0.05, 0, 250); },
    hint() { this.tone(880, 0.12, 'sine', 0.06); this.tone(1320, 0.18, 'sine', 0.05, 0.08); },
    win() { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.08, i * 0.11)); },
    ding() { [880, 1320, 1760].forEach((f, i) => this.tone(f, 0.25, 'sine', 0.06, i * 0.08)); }
  };
  const buzz = (p) => { try { if (navigator.vibrate) navigator.vibrate(p); } catch {} };

  let badgeQ = [], badgeOn = false;
  function unlock(id) {
    if (S.ach[id]) return;
    const a = ACH.find((x) => x.id === id); if (!a) return;
    S.ach[id] = Date.now(); save(); badgeQ.push(a); if (!badgeOn) nextBadge();
  }
  function nextBadge() {
    const a = badgeQ.shift(), el = $('badge');
    if (!a) { badgeOn = false; return; }
    badgeOn = true;
    el.innerHTML = `<span class="bi">${a.icon}</span><span><small>Trophy unlocked</small><b></b></span>`;
    el.querySelector('b').textContent = a.name;
    el.classList.add('on'); SFX.ding(); buzz([20, 40, 20]);
    setTimeout(() => { el.classList.remove('on'); setTimeout(nextBadge, 450); }, 2600);
  }

  const fmtT = (s) => { s = Math.floor(s); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = s % 60; return h ? `${h}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}` : `${m}:${String(x).padStart(2, '0')}`; };
  const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const dayNum = (d = new Date()) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
  const todayPlan = () => DAILY_PLAN[new Date().getDay()];
  function streak() {
    let n = 0; const d = new Date();
    if (!S.daily[dayKey(d)]) d.setDate(d.getDate() - 1);
    while (S.daily[dayKey(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function applySkin() { $('root').dataset.sk = S.set.skin; }

  function miniSVG(v) {
    const n = v === 'mini' ? 6 : 9, s = 84 / n, bw = 3, bh = v === 'mini' ? 2 : 3;
    let o = `<svg viewBox="-2 -2 88 88" aria-hidden="true"><rect x="0" y="0" width="84" height="84" rx="6" fill="var(--surface)" stroke="var(--ink-2)" stroke-width="2.4"/>`;
    if (v === 'diagonal') for (let k = 0; k < n; k++) o += `<rect x="${k * s}" y="${k * s}" width="${s}" height="${s}" fill="hsl(var(--h) 80% 60% / .25)"/><rect x="${(n - 1 - k) * s}" y="${k * s}" width="${s}" height="${s}" fill="hsl(var(--h) 80% 60% / .25)"/>`;
    for (let k = 1; k < n; k++) {
      const vb = k % bw === 0, hb = k % bh === 0;
      o += `<line x1="${k * s}" y1="0" x2="${k * s}" y2="84" stroke="var(--ink-${vb ? 2 : 3})" stroke-width="${vb ? 1.8 : .6}"/><line x1="0" y1="${k * s}" x2="84" y2="${k * s}" stroke="var(--ink-${hb ? 2 : 3})" stroke-width="${hb ? 1.8 : .6}"/>`;
    }
    if (v === 'killer') {
      o += `<path d="M1.5 1.5 H${2 * s - 1.5} V${s - 1.5} H${s - 1.5} V${2 * s - 1.5} H1.5 Z" fill="none" stroke="var(--accent)" stroke-width="1.3" stroke-dasharray="3 2"/><text x="3" y="7" font-size="5.5" font-weight="900" fill="var(--ink)">15</text>`;
      o += `<path d="M${4 * s + 1.5} ${3 * s + 1.5} H${7 * s - 1.5} V${4 * s - 1.5} H${4 * s + 1.5} Z" fill="none" stroke="var(--accent)" stroke-width="1.3" stroke-dasharray="3 2"/><text x="${4 * s + 3}" y="${3 * s + 7}" font-size="5.5" font-weight="900" fill="var(--ink)">20</text>`;
      o += `<path d="M${6 * s + 1.5} ${6 * s + 1.5} H${8 * s - 1.5} V${8 * s - 1.5} H${6 * s + 1.5} Z" fill="none" stroke="var(--accent)" stroke-width="1.3" stroke-dasharray="3 2"/><text x="${6 * s + 3}" y="${6 * s + 7}" font-size="5.5" font-weight="900" fill="var(--ink)">24</text>`;
    } else {
      const pts = v === 'mini' ? [[0, 0, 3], [1, 4, 5], [2, 2, 1], [3, 5, 2], [4, 1, 6], [5, 3, 4]] : [[0, 0, 5], [1, 4, 7], [2, 7, 2], [3, 2, 9], [4, 4, 1], [5, 6, 4], [6, 1, 8], [7, 8, 3], [8, 3, 6], [0, 8, 1]];
      for (const [r, c, d] of pts) o += `<text x="${c * s + s / 2}" y="${r * s + s * .72}" font-size="${s * .62}" font-weight="900" text-anchor="middle" fill="${(r + c) % 3 ? 'var(--ink)' : 'hsl(var(--h) 72% var(--ul))'}">${d}</text>`;
    }
    return o + '</svg>';
  }
  function heroSVG() {
    const ds = [5, 3, 0, 6, 0, 1, 0, 9, 8], sol = [5, 3, 4, 6, 7, 2, 1, 9, 8];
    let o = '<svg viewBox="0 0 150 150"><rect x="6" y="10" width="138" height="138" rx="20" fill="#000" opacity=".08"/><rect x="4" y="4" width="138" height="138" rx="20" fill="var(--surface)" stroke="var(--ink-2)" stroke-width="3.5"/>';
    o += '<path d="M50 8 V138 M96 8 V138 M8 50 H138 M8 96 H138" stroke="var(--line)" stroke-width="2.5"/>';
    sol.forEach((d, i) => {
      const x = 27 + (i % 3) * 46, y = 27 + Math.floor(i / 3) * 46;
      const given = ds[i];
      o += `<text class="hd" style="animation-delay:${given ? i * 0.08 : 0.9 + i * 0.22}s" x="${x}" y="${y + 13}" font-size="36" font-weight="${given ? 900 : 700}" text-anchor="middle" fill="${given ? 'var(--ink)' : 'hsl(var(--h) 72% var(--ul))'}" font-family="var(--font)">${d}</text>`;
    });
    o += '<g class="hd" style="animation-delay:2.6s"><circle cx="128" cy="20" r="16" fill="var(--good)"/><path d="M120 20 l6 6 l10 -12" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g></svg>';
    return o;
  }

  function paintHome() {
    applySkin();
    $('heroArt').innerHTML = heroSVG();
    const [dv, dl] = todayPlan(), k = dayKey(), done = S.daily[k];
    const now = new Date(), monday = new Date(now); monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    let week = '';
    for (let i = 0; i < 7; i++) { const d = new Date(monday); d.setDate(monday.getDate() + i); const dk = dayKey(d); week += `<i class="${S.daily[dk] ? 'done' : ''} ${dk === k ? 'today' : ''}" title="${DAYS[d.getDay()]}">${S.daily[dk] ? '✓' : 'MTWTFSS'[i]}</i>`; }
    const st = streak();
    $('daily').innerHTML = `<div class="cal"><b>${now.toLocaleString('en-US', { month: 'short' })}</b><span>${now.getDate()}</span></div><div><h3>Daily puzzle</h3><p>${DAYS[now.getDay()]}: ${VARIANTS[dv].name}, ${LEVELS[dl]}${done ? ` · solved in ${fmtT(done)}` : ''}</p><div class="sd-week">${week}</div><button class="c-btn" type="button" id="dailyBtn">${done ? 'Play it again' : 'Play today\'s puzzle'}</button></div>${st ? `<span class="flame">🔥 ${st} day${st > 1 ? 's' : ''}</span>` : ''}`;
    $('dailyBtn').onclick = () => startDaily();
    const g = S.game;
    $('cont').hidden = !(g && g.status === 'playing');
    if (g && g.status === 'playing') {
      $('cont').innerHTML = `<h3>Continue</h3><p>${g.daily ? 'Daily · ' : ''}${VARIANTS[g.variant].name}, ${LEVELS[g.level]} · ${fmtT(g.elapsed)}</p><div><button class="c-btn c-btn--ghost" type="button" id="contBtn">Resume ▶</button></div>`;
      $('contBtn').onclick = () => resume();
    }
    $('variants').innerHTML = Object.entries(VARIANTS).map(([k2, v]) => { const b = S.stats[`${k2}:${S.level}`]; return `<button type="button" class="sd-var" role="radio" data-v="${k2}" aria-checked="${k2 === S.variant}">${miniSVG(k2)}<b>${v.name}</b><small>${v.blurb}</small><em>${b && b.best != null ? `Best ${LEVELS[S.level]}: ${fmtT(b.best)}` : `${LEVELS[S.level]}: not solved yet`}</em></button>`; }).join('');
    $('levels').innerHTML = Object.entries(LEVELS).map(([k2, v]) => `<button type="button" role="radio" data-v="${k2}" aria-checked="${k2 === S.level}">${v}</button>`).join('');
    $('trophyN').textContent = `${Object.keys(S.ach).length}/${ACH.length}`;
  }
  $('variants').addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (!b) return; S.variant = b.dataset.v; save(); SFX.tick(); paintHome(); $('variants').querySelector(`[data-v="${S.variant}"]`).focus(); });
  $('levels').addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (!b) return; S.level = b.dataset.v; save(); SFX.tick(); paintHome(); $('levels').querySelector(`[data-v="${S.level}"]`).focus(); });

  let G = null, shape = null, cells = [], sel = -1, notesMode = false, hist = [], redo = [], timer = 0, last = 0, paused = false, hintStep = null, generating = false;

  function show(which) { $('home').hidden = which !== 'home'; $('play').hidden = which !== 'play'; scrollTo({ top: 0 }); }

  function newGame(variant, level, daily = null) {
    show('play');
    generating = true;
    $('genCover').hidden = false; $('result').hidden = true; $('pauseCover').hidden = true;
    $('chip').textContent = `${daily ? 'Daily · ' : ''}${VARIANTS[variant].name} · ${LEVELS[level]}`;
    const seed = daily ? (dayNum() * 7919 + 17) >>> 0 : (Math.random() * 2 ** 32) >>> 0;
    setTimeout(() => {
      const p = E.generate({ variant, level, seed });
      G = { variant, level, seed, daily, puzzle: p.puzzle, solution: p.solution, cages: p.cages, n: p.n, vals: p.puzzle.slice(), notes: new Array(p.puzzle.length).fill(0), elapsed: 0, hints: 0, mistakes: 0, notesUsed: 0, status: 'playing' };
      S.game = G; save();
      generating = false;
      setup();
    }, 60);
  }
  function resume() { G = S.game; show('play'); $('result').hidden = true; $('pauseCover').hidden = true; $('chip').textContent = `${G.daily ? 'Daily · ' : ''}${VARIANTS[G.variant].name} · ${LEVELS[G.level]}`; setup(); }
  function startDaily() { const [v, l] = todayPlan(); newGame(v, l, dayKey()); }

  function setup() {
    shape = E.makeShape(G.n, G.variant === 'diagonal');
    $('genCover').hidden = true;
    hist = []; redo = []; hintStep = null; paused = false; $('hintCard').hidden = true;
    buildBoard();
    sel = G.vals.findIndex((v) => !v); if (sel < 0) sel = 0;
    render(); paintPad();
    last = performance.now();
    cells[sel].focus({ preventScroll: true });
    if (!S.seenHow) { S.seenHow = true; save(); setTimeout(() => Curio.toast(G.variant === 'killer' ? 'Killer: cage numbers are sums, and no digit repeats in a cage.' : 'Tip: tap a cell, then a number. Notes mode pencils in maybes.', 3200), 400); }
  }

  const boardEl = $('board');
  function buildBoard() {
    const n = G.n;
    boardEl.style.setProperty('--n', n);
    boardEl.className = `sd-board n${n}${G.cages ? ' killer' : ''}`;
    boardEl.innerHTML = '';
    cells = [];
    const diagSet = new Set();
    if (G.variant === 'diagonal') for (let k = 0; k < n; k++) { diagSet.add(k * n + k); diagSet.add(k * n + n - 1 - k); }
    for (let i = 0; i < n * n; i++) {
      const r = Math.floor(i / n), c = i % n, b = document.createElement('button');
      b.type = 'button'; b.className = 'sd-cell'; b.dataset.i = i; b.tabIndex = -1; b.setAttribute('role', 'gridcell');
      const cls = [];
      if (c === n - 1) cls.push('er'); else if ((c + 1) % shape.bw === 0) cls.push('br');
      if (r === n - 1) cls.push('eb'); else if ((r + 1) % shape.bh === 0) cls.push('bb');
      if (diagSet.has(i)) cls.push('dg');
      b.dataset.base = cls.join(' ');
      boardEl.append(b); cells.push(b);
    }
    drawOverlay();
  }
  function drawOverlay() {
    const svg = $('over'), n = G.n, W = n * 100;
    svg.setAttribute('viewBox', `0 0 ${W} ${W}`);
    let o = '';
    if (G.variant === 'diagonal') o += `<line class="dline" x1="20" y1="20" x2="${W - 20}" y2="${W - 20}"/><line class="dline" x1="${W - 20}" y1="20" x2="20" y2="${W - 20}"/>`;
    if (G.cages) {
      const owner = new Int16Array(n * n).fill(-1);
      G.cages.forEach((cg, k) => cg.cells.forEach((i) => { owner[i] = k; }));
      const same = (r, c, k) => r >= 0 && c >= 0 && r < n && c < n && owner[r * n + c] === k;
      const ins = 8;
      let d = '';
      for (let i = 0; i < n * n; i++) {
        const r = Math.floor(i / n), c = i % n, k = owner[i], x = c * 100, y = r * 100;
        const off = (nr, nc, dr, dc) => (!same(nr, nc, k) ? ins : same(nr + dr, nc + dc, k) ? -ins : 0);
        if (!same(r - 1, c, k)) d += `M${x + off(r, c - 1, -1, 0)} ${y + ins}H${x + 100 - off(r, c + 1, -1, 0)}`;
        if (!same(r + 1, c, k)) d += `M${x + off(r, c - 1, 1, 0)} ${y + 100 - ins}H${x + 100 - off(r, c + 1, 1, 0)}`;
        if (!same(r, c - 1, k)) d += `M${x + ins} ${y + off(r - 1, c, 0, -1)}V${y + 100 - off(r + 1, c, 0, -1)}`;
        if (!same(r, c + 1, k)) d += `M${x + 100 - ins} ${y + off(r - 1, c, 0, 1)}V${y + 100 - off(r + 1, c, 0, 1)}`;
      }
      o += `<path class="cage" d="${d}"/>`;
      G.cages.forEach((cg) => {
        const i = cg.cells[0], x = (i % n) * 100, y = Math.floor(i / n) * 100, t = String(cg.sum);
        o += `<rect class="sumbg" x="${x + 4}" y="${y + 3}" width="${t.length * 10 + 6}" height="21" rx="4"/><text class="sum" x="${x + 7}" y="${y + 19}">${t}</text>`;
      });
    }
    svg.innerHTML = o;
  }

  function conflicts() {
    const bad = new Set();
    for (let i = 0; i < G.vals.length; i++) if (G.vals[i]) for (const j of shape.peers[i]) if (G.vals[j] === G.vals[i]) { bad.add(i); bad.add(j); }
    if (G.cages) for (const cg of G.cages) {
      const vs = cg.cells.map((i) => G.vals[i]);
      if (vs.every(Boolean) && vs.reduce((a, b) => a + b, 0) !== cg.sum) cg.cells.forEach((i) => bad.add(i));
    }
    return bad;
  }
  function render() {
    if (!G) return;
    const bad = conflicts(), sv = sel >= 0 ? G.vals[sel] : 0;
    const peers = sel >= 0 ? new Set(shape.peers[sel]) : new Set();
    const reg = hintStep ? new Set(hintStep.region) : null, foc = hintStep ? new Set(hintStep.focus) : null;
    const nc = G.n === 6 ? 6 : 9;
    for (let i = 0; i < cells.length; i++) {
      const el = cells[i], v = G.vals[i], given = !!G.puzzle[i];
      const cls = ['sd-cell', el.dataset.base];
      if (given) cls.push('given');
      if (reg && reg.has(i)) cls.push('reg');
      else if (peers.has(i)) cls.push('peer');
      if (S.set.same && sv && v === sv && i !== sel) cls.push('same');
      if (i === sel) cls.push('sel');
      if (foc && foc.has(i)) cls.push('foc');
      if (bad.has(i)) cls.push('conf');
      if (S.set.check && v && !given && v !== G.solution[i]) cls.push('wrong');
      for (const k of ['pop', 'shake', 'sweep']) if (el.classList.contains(k)) cls.push(k);
      el.className = cls.join(' ');
      const rc = `Row ${Math.floor(i / G.n) + 1}, column ${i % G.n + 1}`;
      const key = v ? `v${v}` : G.notes[i] ? `n${G.notes[i]}:${sv}` : 'e';
      if (el.dataset.k !== key) {
        el.dataset.k = key;
        if (v) { el.innerHTML = `<span>${v}</span>`; }
        else if (G.notes[i]) {
          let h = '<span class="sd-notes" aria-hidden="true">';
          for (let d = 1; d <= nc; d++) h += `<b class="${sv === d && G.notes[i] & (1 << d) ? 'hl' : ''}">${G.notes[i] & (1 << d) ? d : ''}</b>`;
          el.innerHTML = h + '</span>';
        } else el.innerHTML = '';
      }
      el.setAttribute('aria-label', v ? `${rc}: ${v}${given ? ', given' : ''}` : `${rc}: empty${G.notes[i] ? `, notes ${E.digitsOf(G.notes[i]).join(' ')}` : ''}`);
      el.tabIndex = i === sel ? 0 : -1;
    }
    $('undoBtn').disabled = !hist.length; $('redoBtn').disabled = !redo.length;
    $('notesBtn').setAttribute('aria-pressed', notesMode); $('notesState').textContent = notesMode ? 'on' : 'off';
    $('pad').classList.toggle('notes', notesMode);
    $('mistakes').textContent = `✕ ${G.mistakes}`; $('hintsN').textContent = `💡 ${G.hints}`;
    $('time').textContent = fmtT(G.elapsed);
  }
  function paintPad() {
    const n = G.n, pad = $('pad');
    if (pad.childElementCount !== n) {
      pad.className = `sd-pad n${n}`;
      pad.innerHTML = '';
      for (let d = 1; d <= n; d++) { const b = document.createElement('button'); b.type = 'button'; b.dataset.d = d; b.innerHTML = `${d}<small></small>`; b.setAttribute('aria-label', `Enter ${d}`); pad.append(b); }
    }
    const counts = new Array(10).fill(0);
    G.vals.forEach((v, i) => { if (v && v === G.solution[i]) counts[v]++; });
    [...pad.children].forEach((b) => { const d = +b.dataset.d, left = n - counts[d]; b.classList.toggle('done', left <= 0); b.querySelector('small').textContent = left > 0 ? left : '✓'; });
  }

  function flash(i, k) { const el = cells[i]; el.classList.remove(k); void el.offsetWidth; el.classList.add(k); setTimeout(() => el.classList.remove(k), 700); }
  function setSel(i, focus = true) { sel = i; render(); if (focus) cells[i].focus({ preventScroll: true }); }
  function push() { hist.push({ vals: G.vals.slice(), notes: G.notes.slice() }); if (hist.length > 300) hist.shift(); redo = []; }
  function clearHint() { if (hintStep) { hintStep = null; $('hintCard').hidden = true; } }

  function input(d) {
    if (!G || G.status !== 'playing' || paused || generating || sel < 0 || G.puzzle[sel]) return;
    clearHint();
    if (notesMode && d) {
      if (G.vals[sel]) return;
      push(); G.notes[sel] ^= 1 << d; G.notesUsed++;
      if (G.notesUsed >= 40) unlock('notes');
      SFX.note(); render(); persist(); return;
    }
    if (!d) {
      if (!G.vals[sel] && !G.notes[sel]) return;
      push(); G.vals[sel] = 0; G.notes[sel] = 0; SFX.erase(); render(); paintPad(); persist(); return;
    }
    if (G.vals[sel] === d) return;
    push();
    G.vals[sel] = d; G.notes[sel] = 0;
    if (S.set.clean) for (const j of shape.peers[sel]) G.notes[j] &= ~(1 << d);
    const right = d === G.solution[sel];
    if (!right) { G.mistakes++; const m = $('mistakes'); m.classList.remove('bump'); void m.offsetWidth; m.classList.add('bump'); flash(sel, 'shake'); SFX.bad(); buzz(60); }
    else { flash(sel, 'pop'); SFX.place(d); buzz(8); }
    render(); paintPad();
    if (right) celebrateUnits(sel, d);
    persist(); checkWin();
  }
  function celebrateUnits(i, d) {
    let k = 0;
    for (const ui of shape.unitsOf[i]) {
      const u = shape.units[ui];
      if (u.cells.every((j) => G.vals[j] && G.vals[j] === G.solution[j])) {
        u.cells.forEach((j, t) => { const el = cells[j]; el.style.animationDelay = `${t * 45}ms`; flash(j, 'sweep'); });
        SFX.unit(k++);
      }
    }
    if (G.vals.filter((v, j) => v === d && G.solution[j] === d).length === G.n) {
      const b = $('pad').querySelector(`[data-d="${d}"]`); if (b) { b.classList.remove('fin'); void b.offsetWidth; b.classList.add('fin'); }
    }
  }

  function undo() { if (!hist.length || G.status !== 'playing') return; redo.push({ vals: G.vals.slice(), notes: G.notes.slice() }); const h = hist.pop(); G.vals = h.vals; G.notes = h.notes; clearHint(); SFX.erase(); render(); paintPad(); persist(); }
  function redoFn() { if (!redo.length || G.status !== 'playing') return; hist.push({ vals: G.vals.slice(), notes: G.notes.slice() }); const h = redo.pop(); G.vals = h.vals; G.notes = h.notes; SFX.tick(); render(); paintPad(); persist(); }
  function autoNotes() {
    if (!G || G.status !== 'playing' || paused) return;
    push();
    const cg = G.cages ? E.cageInfo(shape, G.cages) : null;
    for (let i = 0; i < G.vals.length; i++) if (!G.vals[i]) G.notes[i] = E.candidates(shape, G.vals, i, cg);
    cells.forEach((c, i) => { if (!G.vals[i]) { c.style.animationDelay = `${(Math.floor(i / G.n) + (i % G.n)) * 18}ms`; flash(i, 'pop'); } });
    [0, 1, 2, 3].forEach((k) => SFX.tone(1200 + k * 200, 0.05, 'sine', 0.03, k * 0.04));
    render(); persist();
    Curio.toast('Notes filled with every legal option');
  }

  function hint() {
    if (!G || G.status !== 'playing' || paused) return;
    let step = E.findStep(shape, G.vals, G.cages, G.solution);
    if (!step) {
      const cg = G.cages ? E.cageInfo(shape, G.cages) : null;
      let best = -1, bn = 99;
      for (let i = 0; i < G.vals.length; i++) if (!G.vals[i]) { const c = E.bits(E.candidates(shape, G.vals, i, cg)); if (c < bn) { bn = c; best = i; } }
      if (best < 0) return;
      step = { kind: 'reveal', cell: best, digit: G.solution[best], title: 'Tough spot', text: `No simple pattern unlocks a cell right now. This cell has the fewest options (${bn}), so here is its answer to get you moving.`, focus: [best], region: shape.peers[best] };
    }
    hintStep = step;
    G.hints++; S.hintsRead++; if (S.hintsRead >= 10) unlock('learner'); save();
    sel = step.cell;
    const card = $('hintCard');
    const tag = { mistake: 'Check', cage: 'Killer', hidden: 'Basic', naked: 'Basic', advanced: 'Advanced', reveal: 'Reveal' }[step.kind];
    card.innerHTML = `<h4><span></span><small>${tag}</small></h4><p></p><div class="c-row"><button class="c-btn" type="button" data-a="do">${step.kind === 'mistake' ? 'Erase it' : `Place the ${step.digit}`}</button><button class="c-btn c-btn--ghost" type="button" data-a="x">Got it, thanks</button></div>`;
    card.querySelector('span').textContent = step.title; card.querySelector('p').textContent = step.text;
    card.hidden = false;
    card.onclick = (e) => {
      const a = e.target.closest('[data-a]')?.dataset.a; if (!a) return;
      const st = hintStep; clearHint();
      if (a === 'do' && st) { sel = st.cell; const was = notesMode; notesMode = false; input(st.kind === 'mistake' ? 0 : st.digit); notesMode = was; render(); }
      else render();
      cells[sel].focus({ preventScroll: true });
    };
    SFX.hint(); render(); persist();
    if (matchMedia('(max-width: 860px)').matches) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function persist() { if (G) { S.game = G; save(); } }

  function checkWin() {
    if (G.vals.some((v, i) => v !== G.solution[i])) return;
    G.status = 'won'; clearHint();
    const secs = Math.round(G.elapsed), k = `${G.variant}:${G.level}`;
    const st = (S.stats[k] ||= { n: 0, best: null, total: 0 });
    st.n++; st.total += secs;
    const isBest = G.hints === 0 && (st.best == null || secs < st.best);
    if (isBest) st.best = secs;
    S.solved++;
    if (G.daily && !S.daily[G.daily]) S.daily[G.daily] = secs;
    S.game = null; save();
    unlock('first');
    if (G.variant !== 'classic') unlock(G.variant);
    if (G.level === 'expert') { unlock('expert'); if (!S.expertDone.includes(G.variant)) S.expertDone.push(G.variant); if (S.expertDone.length >= 4) unlock('grand'); }
    if ((G.level === 'hard' || G.level === 'expert') && G.hints === 0) unlock('pure');
    if (G.mistakes === 0) unlock('clean');
    if (G.variant === 'classic' && G.level === 'easy' && secs < 300) unlock('quick');
    if (G.variant === 'classic' && G.level === 'medium' && secs < 480) unlock('swift');
    if (G.daily) { unlock('daily'); const s = streak(); if (s >= 3) unlock('streak3'); if (s >= 7) unlock('streak7'); }
    if (S.solved >= 10) unlock('ten');
    if (S.solved >= 50) unlock('fifty');
    save();
    boardEl.classList.add('won');
    cells.forEach((c, i) => { c.style.animationDelay = `${(Math.floor(i / G.n) + (i % G.n)) * 40}ms`; });
    SFX.win(); buzz([40, 60, 40, 60, 120]);
    setTimeout(() => Curio.confetti(), 500);
    const stars = G.hints + G.mistakes === 0 ? 3 : G.hints + G.mistakes <= 3 ? 2 : 1;
    setTimeout(() => {
      boardEl.classList.remove('won'); cells.forEach((c) => { c.style.animationDelay = ''; });
      const box = $('result');
      const ros = Array.from({ length: 16 }, (_, k2) => { const a = k2 / 16 * Math.PI * 2; return `${60 + Math.cos(a) * 52} ${60 + Math.sin(a) * 52}`; });
      box.innerHTML = `<div class="sd-rcard" role="dialog" aria-label="Puzzle solved"><svg viewBox="0 0 120 120" aria-hidden="true"><g class="ros">${ros.map((p) => `<circle cx="${p.split(' ')[0]}" cy="${p.split(' ')[1]}" r="12" fill="hsl(var(--h) 75% 55%)"/>`).join('')}</g><circle cx="60" cy="60" r="50" fill="hsl(var(--h) 75% 55%)"/><circle cx="60" cy="60" r="42" fill="var(--surface)" stroke="hsl(var(--h) 75% 55%)" stroke-width="3" stroke-dasharray="4 4"/><text x="60" y="58" text-anchor="middle" font-size="22" font-weight="900" fill="var(--ink)">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</text><text x="60" y="80" text-anchor="middle" font-size="12" font-weight="900" fill="var(--ink-2)">${LEVELS[G.level].toUpperCase()}</text></svg>
        ${isBest ? '<span class="new">New personal best</span>' : ''}<h3>Solved!</h3><p>${G.daily ? 'Daily puzzle done. ' : ''}${VARIANTS[G.variant].name}, ${LEVELS[G.level]}.</p>
        <div class="sd-rstats"><div><b>${fmtT(secs)}</b><span>Time</span></div><div><b>${G.hints}</b><span>Hints</span></div><div><b>${G.mistakes}</b><span>Mistakes</span></div></div>
        <p style="font-size:13px">${st.best != null ? `Best ${fmtT(st.best)} · ` : ''}${st.n} solved at this level${G.hints ? ' · hint-free solves set records' : ''}</p>
        <div class="c-row"><button class="c-btn" type="button" data-a="next">Next puzzle</button><button class="c-btn c-btn--ghost" type="button" data-a="share">Share</button><button class="c-btn c-btn--ghost" type="button" data-a="menu">Menu</button></div></div>`;
      box.hidden = false;
      box.querySelector('[data-a="next"]').focus({ preventScroll: true });
      box.onclick = async (e) => {
        const a = e.target.closest('[data-a]')?.dataset.a;
        if (a === 'next') newGame(G.variant, G.level);
        else if (a === 'menu') { show('home'); paintHome(); }
        else if (a === 'share') {
          const text = `Curio Sudoku${G.daily ? ` · Daily ${G.daily}` : ''}\n${VARIANTS[G.variant].name}, ${LEVELS[G.level]} solved in ${fmtT(secs)}\n${'⭐'.repeat(stars)} · ${G.hints} hints · ${G.mistakes} mistakes`;
          try { await navigator.clipboard.writeText(text); Curio.toast('Result copied'); } catch { Curio.toast('Could not copy'); }
        }
      };
    }, 1500);
  }

  function setPaused(p) {
    if (!G || G.status !== 'playing' || generating) return;
    paused = p; $('pauseCover').hidden = !p; boardEl.classList.toggle('paused', p);
    $('pauseBtn').querySelector('i').className = p ? 'play' : '';
    if (!p) { last = performance.now(); cells[sel]?.focus({ preventScroll: true }); }
    persist();
  }
  setInterval(() => {
    const now = performance.now();
    if (G && G.status === 'playing' && !paused && !generating && !document.hidden && !$('play').hidden) { G.elapsed += (now - last) / 1000; $('time').textContent = fmtT(G.elapsed); }
    last = now;
  }, 250);
  setInterval(() => { if (G && G.status === 'playing' && !$('play').hidden) persist(); }, 5000);
  document.addEventListener('visibilitychange', () => { last = performance.now(); if (document.hidden) persist(); });

  boardEl.addEventListener('click', (e) => { const el = e.target.closest('.sd-cell'); if (el && !paused) { clearHint(); setSel(+el.dataset.i); SFX.tick(); } });
  $('pad').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { input(+b.dataset.d); cells[sel]?.focus({ preventScroll: true }); } });
  $('eraseBtn').addEventListener('click', () => input(0));
  $('undoBtn').addEventListener('click', undo);
  $('redoBtn').addEventListener('click', redoFn);
  $('notesBtn').addEventListener('click', () => { notesMode = !notesMode; SFX.tick(); render(); });
  $('autoBtn').addEventListener('click', autoNotes);
  $('hintBtn').addEventListener('click', hint);
  $('pauseBtn').addEventListener('click', () => setPaused(!paused));
  $('resumeBtn').addEventListener('click', () => setPaused(false));
  $('backBtn').addEventListener('click', () => { persist(); show('home'); paintHome(); });
  $('startBtn').addEventListener('click', async () => {
    if (S.game && S.game.status === 'playing' && S.game.vals.some((v, i) => v && !S.game.puzzle[i])) {
      const v = await Curio.modal({ emoji: '🧩', title: 'Start a new puzzle?', body: 'Your puzzle in progress will be replaced.', buttons: [{ label: 'New puzzle', value: 'y' }, { label: 'Cancel', value: 'n' }] });
      if (v !== 'y') return;
    }
    newGame(S.variant, S.level);
  });

  addEventListener('keydown', (e) => {
    if (document.querySelector('.curio-modal') || e.metaKey || e.altKey || $('play').hidden || !G) return;
    const k = e.key;
    if (e.ctrlKey) { if (k === 'z') { e.preventDefault(); undo(); } else if (k === 'y') { e.preventDefault(); redoFn(); } return; }
    if (k === 'p' || k === 'P') { setPaused(!paused); return; }
    if (paused || G.status !== 'playing') return;
    const mv = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[k];
    if (mv) { e.preventDefault(); const n = G.n; let r = Math.floor(sel / n), c = sel % n; r = (r + mv[0] + n) % n; c = (c + mv[1] + n) % n; clearHint(); setSel(r * n + c); return; }
    if (/^[1-9]$/.test(k) && +k <= G.n) { input(+k); return; }
    if (k === 'Backspace' || k === 'Delete' || k === '0') { e.preventDefault(); input(0); return; }
    if (k === 'n' || k === 'N') { notesMode = !notesMode; render(); return; }
    if (k === 'z' || k === 'Z') { undo(); return; }
    if (k === 'y' || k === 'Y') { redoFn(); return; }
    if (k === 'h' || k === 'H') hint();
    if (k === 'Escape') clearHint(), render();
  });

  $('howBtn').addEventListener('click', () => {
    const box = document.createElement('div'); box.className = 'sd-how';
    const items = [
      ['The rule', 'Fill the grid so every row, every column and every box contains each digit exactly once (1 to 9, or 1 to 6 on the mini board).'],
      ['Diagonal', 'Same rules, plus both long diagonals must also hold each digit once. The shaded cells show them.'],
      ['Killer', 'Cells inside a dashed cage add up to the small number in its corner, and a digit never repeats inside a cage. Killer puzzles start with very few digits, so the sums do the work.'],
      ['Notes', 'Switch Notes on to pencil in possibilities. Auto notes fills every legal option for you; placing a digit tidies matching notes away.'],
      ['Hints', 'A hint names a real technique (hidden single, last option, cage math, naked pair, pointing pair) and highlights where to look. Read it, then place the digit yourself or let the hint do it.'],
      ['Daily', 'One puzzle per day, the same for everyone, cycling through the variants across the week. Solve on consecutive days to build a streak.']
    ];
    for (const [t, d] of items) { const el = document.createElement('div'); el.innerHTML = '<b></b> '; el.querySelector('b').textContent = t + '.'; el.append(d); box.append(el); }
    Curio.modal({ emoji: '📖', title: 'How to play', body: box, buttons: [{ label: 'Got it', value: 'x' }] });
  });
  $('trophyBtn').addEventListener('click', () => {
    const box = document.createElement('div'); box.className = 'sd-list';
    for (const a of ACH) { const d = document.createElement('div'); d.className = S.ach[a.id] ? '' : 'locked'; d.innerHTML = `<i>${a.icon}</i><div><b></b><span></span></div>`; d.querySelector('b').textContent = a.name; d.querySelector('span').textContent = a.desc; box.append(d); }
    Curio.modal({ emoji: '🏆', title: `Trophies ${Object.keys(S.ach).length}/${ACH.length}`, body: box, buttons: [{ label: 'Close', value: 'x' }] });
  });
  $('statsBtn').addEventListener('click', () => {
    const box = document.createElement('div');
    let h = `<p style="margin:0 0 8px">${S.solved} puzzles solved · daily streak ${streak()} · ${Object.keys(S.daily).length} dailies</p><table class="sd-table"><tr><th>Puzzle</th><th>Solved</th><th>Best</th><th>Average</th></tr>`;
    let any = false;
    for (const v of Object.keys(VARIANTS)) for (const l of Object.keys(LEVELS)) { const st = S.stats[`${v}:${l}`]; if (!st) continue; any = true; h += `<tr><td>${VARIANTS[v].name} ${LEVELS[l]}</td><td>${st.n}</td><td>${st.best != null ? fmtT(st.best) : '-'}</td><td>${fmtT(st.total / st.n)}</td></tr>`; }
    h += '</table>';
    box.innerHTML = any ? h : '<p>No puzzles solved yet. The grid is waiting.</p>';
    Curio.modal({ emoji: '📊', title: 'Your stats', body: box, buttons: [{ label: 'Close', value: 'x' }] });
  });
  $('setBtn').addEventListener('click', () => {
    const box = document.createElement('div'); box.className = 'sd-settings';
    const opts = [['check', 'Show wrong digits in red'], ['same', 'Highlight matching digits'], ['clean', 'Placing a digit clears matching notes']];
    for (const [k, label] of opts) {
      const l = document.createElement('label'); l.innerHTML = `<span></span><input type="checkbox">`; l.querySelector('span').textContent = label;
      const inp = l.querySelector('input'); inp.checked = !!S.set[k]; inp.addEventListener('change', () => { S.set[k] = inp.checked; save(); if (G) render(); });
      box.append(l);
    }
    const sw = document.createElement('div'); sw.className = 'sd-swatches';
    for (const [k, h] of Object.entries(SKINS)) { const b = document.createElement('button'); b.type = 'button'; b.style.background = `hsl(${h} 75% 55%)`; b.setAttribute('aria-label', `${k} colour theme`); b.setAttribute('aria-pressed', String(S.set.skin === k)); b.addEventListener('click', () => { S.set.skin = k; save(); applySkin(); sw.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); SFX.tick(); }); sw.append(b); }
    const lab = document.createElement('p'); lab.textContent = 'Board colour'; lab.style.margin = '6px 0 0'; lab.style.fontWeight = '800';
    box.append(lab, sw);
    Curio.modal({ emoji: '⚙️', title: 'Settings', body: box, buttons: [{ label: 'Done', value: 'x' }] }).then(() => { if (!$('home').hidden) paintHome(); });
  });

  paintHome();
  window.__sudoku = { E, get G() { return G; }, input, setSel, hint, autoNotes, newGame, get shape() { return shape; }, S };
})();
