'use strict';
  const Nono = (() => {
    function clues(line) {
      const out = []; let run = 0;
      for (const v of line) { if (v === 1) run++; else if (run) { out.push(run); run = 0; } }
      if (run) out.push(run);
      return out;
    }
    function solveLine(state, c) {
      const L = state.length, k = c.length;
      const fwd = Array.from({ length: L + 2 }, () => new Uint8Array(k + 1));
      const bwd = Array.from({ length: L + 2 }, () => new Uint8Array(k + 1));
      const fits = (s, len) => { if (s + len > L) return false; for (let i = s; i < s + len; i++) if (state[i] === 0) return false; return s + len === L || state[s + len] !== 1; };
      fwd[0][0] = 1;
      for (let i = 0; i <= L; i++) for (let j = 0; j <= k; j++) {
        if (!fwd[i][j]) continue;
        if (i < L && state[i] !== 1) fwd[i + 1][j] = 1;
        if (j < k && fits(i, c[j])) fwd[Math.min(L, i + c[j] + 1)][j + 1] = 1;
      }
      bwd[L][k] = 1;
      for (let i = L; i >= 0; i--) for (let j = k; j >= 0; j--) {
        if (i < L && state[i] !== 1 && bwd[i + 1][j]) bwd[i][j] = 1;
        if (j < k && fits(i, c[j]) && bwd[Math.min(L, i + c[j] + 1)][j + 1]) bwd[i][j] = 1;
      }
      if (!fwd[L][k]) return null;
      const canE = new Uint8Array(L), canF = new Uint8Array(L);
      for (let i = 0; i < L; i++) for (let j = 0; j <= k; j++) if (fwd[i][j] && bwd[i + 1][j] && state[i] !== 1) canE[i] = 1;
      for (let j = 0; j < k; j++) for (let s = 0; s + c[j] <= L; s++) {
        if (!fwd[s][j] || !fits(s, c[j])) continue;
        if (!bwd[Math.min(L, s + c[j] + 1)][j + 1]) continue;
        for (let i = s; i < s + c[j]; i++) canF[i] = 1;
        if (s + c[j] < L && state[s + c[j]] !== 1) canE[s + c[j]] = 1;
      }
      const out = state.slice();
      for (let i = 0; i < L; i++) {
        if (!canE[i] && !canF[i]) return null;
        if (canF[i] && !canE[i]) out[i] = 1; else if (canE[i] && !canF[i]) out[i] = 0;
      }
      return out;
    }
    function solve(rc, cc, start) {
      const H = rc.length, W = cc.length;
      const g = start ? start.map((r) => r.slice()) : Array.from({ length: H }, () => new Array(W).fill(-1));
      let changed = true;
      while (changed) {
        changed = false;
        for (let y = 0; y < H; y++) {
          const r = solveLine(g[y], rc[y]); if (!r) return null;
          for (let x = 0; x < W; x++) if (r[x] !== g[y][x]) { g[y][x] = r[x]; changed = true; }
        }
        for (let x = 0; x < W; x++) {
          const r = solveLine(g.map((row) => row[x]), cc[x]); if (!r) return null;
          for (let y = 0; y < H; y++) if (r[y] !== g[y][x]) { g[y][x] = r[y]; changed = true; }
        }
      }
      return g;
    }
    function random(n, rnd = Math.random) {
      for (let t = 0; t < 400; t++) {
        let g = Array.from({ length: n }, () => Array.from({ length: n }, () => (rnd() < 0.55 ? 1 : 0)));
        for (let pass = 0; pass < 1; pass++) {
          g = g.map((row, y) => row.map((v, x) => {
            let s = 0;
            for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const yy = y + dy, xx = x + dx; if (yy >= 0 && xx >= 0 && yy < n && xx < n) s += g[yy][xx]; else s += 0.5; }
            return s >= 5 ? 1 : s <= 3 ? 0 : v;
          }));
        }
        const rc = g.map(clues), cc = g[0].map((_, x) => clues(g.map((r) => r[x])));
        if (rc.some((c) => !c.length) || cc.some((c) => !c.length)) continue;
        const s = solve(rc, cc);
        if (s && s.every((row) => row.every((v) => v !== -1))) return g;
      }
      return null;
    }
    return { clues, solve, solveLine, random };
  })();

  (() => {
    const $ = (id) => document.getElementById(id);
    const PAL = { K: '#2d2a32', W: '#ffffff', R: '#e53935', O: '#fb8c00', Y: '#fdd835', G: '#43a047', g: '#1b5e20', B: '#1e88e5', b: '#81d4fa', P: '#f06292', p: '#8e24aa', N: '#6d4c41', n: '#d7a86e', E: '#9e9e9e', L: '#b39ddb' };
    const SIZES = [5, 8, 10, 15];
    const data = window.NONO_PUZZLES;
    const nonoEl = $('nono'), seg = $('seg'), picker = $('picker'), countEl = $('count');
    let size = 5, idx = 0, puzzle, sol, n, rc, cc, st, history = [], mode = 'fill', status = 'playing';
    let lives = 3, mistakes = 0, gameId = 0;
    const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
    const ACH = [
      { id: 'first', name: 'First Picture', d: 'Solve any puzzle' },
      { id: 's5', name: 'Sketchbook', d: 'Solve every 5×5 puzzle' },
      { id: 's8', name: 'Pixel Pal', d: 'Solve every 8×8 puzzle' },
      { id: 's10', name: 'Gallery Wall', d: 'Solve every 10×10 puzzle' },
      { id: 's15', name: 'Masterpiece', d: 'Solve every 15×15 puzzle' },
      { id: 'big', name: 'Big Canvas', d: 'Solve a 15×15 puzzle' },
      { id: 'flawless', name: 'Flawless', d: 'Solve with mistake checking on and no mistakes' },
      { id: 'nohint', name: 'Pure Logic', d: 'Solve a 10×10 or bigger without hints' },
      { id: 'daily', name: 'Daily Doodle', d: 'Solve the daily puzzle' },
      { id: 'random5', name: 'Abstract Artist', d: 'Solve 5 random puzzles' },
      { id: 'speedy', name: 'Quick Sketch', d: 'Solve a 10×10 in under 2 minutes' }
    ];
    const loadS = () => { const base = { v: 1, ach: {}, check: false, stats: { solved: 0, cells: 0, hints: 0, mistakes: 0, random: 0 }, daily: {} }; const d = Curio.store.get('nono2', null); return d && d.v === 1 ? { ...base, ...d, stats: { ...base.stats, ...(d.stats || {}) } } : base; };
    const S = loadS();
    const SIMPLE = Curio.simple;
    const keepCheck = S.check;
    if (SIMPLE) S.check = false;
    const save = () => Curio.store.set('nono2', SIMPLE ? { ...S, check: keepCheck } : S);
    const SEQ = SIMPLE ? [...data[5].map((_, i) => [5, i]), ...data[8].map((_, i) => [8, i])] : [];
    let simpleAt = Math.max(0, Math.min(SEQ.length, +Curio.store.get('nono:simpleAt', 0) || 0));
    const sfx = {
      ac() { return Curio.muted ? null : Curio.audioContext(); },
      pull(len = 1, up = true) {
        const ac = this.ac(); if (!ac) return;
        const d = 0.05 + Math.min(6, len) * 0.012, t = ac.currentTime;
        const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * d), ac.sampleRate), ch = buf.getChannelData(0);
        for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / ch.length);
        const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
        src.buffer = buf; f.type = 'bandpass'; f.Q.value = 3;
        f.frequency.setValueAtTime(up ? 1400 : 2600, t); f.frequency.exponentialRampToValueAtTime(up ? 3200 + len * 120 : 1100, t + d);
        g.gain.value = 0.16; src.connect(f).connect(g).connect(ac.destination); src.start(t);
      },
      knot() { Curio.beep(620, 0.03, 'sine', 0.04); },
      pluck(f, w = 0) { const ac = this.ac(); if (!ac) return; const t = ac.currentTime + w, o = ac.createOscillator(), g = ac.createGain(); o.type = 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5); o.connect(g).connect(ac.destination); o.start(t); o.stop(t + 0.55); }
    };
    function mistake(i) {
      mistakes++; lives--; S.stats.mistakes++; save();
      cellEls[i].classList.remove('bad'); void cellEls[i].offsetWidth; cellEls[i].classList.add('bad');
      Curio.beep(150, 0.2, 'square', 0.06);
      navigator.vibrate?.(60);
      nonoEl.classList.remove('shake'); void nonoEl.offsetWidth; nonoEl.classList.add('shake');
      $('reveal').textContent = lives > 0 ? `Oops, that square is empty. ${lives} heart${lives > 1 ? 's' : ''} left.` : 'Out of hearts!';
      paintLives();
      if (lives <= 0) {
        status = 'lost';
        const gid = gameId;
        setTimeout(() => { if (gid !== gameId) return; showResult({ lost: true }); }, 700);
      }
    }
    function paintLives() {
      const el = $('lives');
      el.hidden = !S.check;
      el.innerHTML = [0, 1, 2].map((k) => `<span class="${k < lives ? 'on' : ''}">♥</span>`).join('');
    }
    function award(id, fresh) { if (!S.ach[id]) { S.ach[id] = Date.now(); fresh.push(id); } }
    let cellEls = [], rowEls = [], colEls = [], cur = 0, elapsed = 0, t0 = 0, started = false, hints = 0, stroke = null;

    SIZES.forEach((k) => {
      const b = document.createElement('button');
      b.type = 'button'; b.dataset.s = k; b.textContent = `${k}×${k}`;
      b.addEventListener('click', () => { size = k; Curio.store.set('nono:size', size); const s = solvedSet(); const first = data[size].findIndex((_, i) => !s.includes(`${size}-${i}`)); load(first < 0 ? 0 : first); });
      seg.append(b);
    });

    const fmtT = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    const solvedSet = () => Curio.store.get('nono:solved', []);
    const pid = () => (idx < 0 ? `r${size}` : `${size}-${idx}`);

    function paintPicker() {
      picker.innerHTML = '';
      const solved = solvedSet();
      data[size].forEach((p, i) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'pk';
        b.setAttribute('aria-current', i === idx);
        const done = solved.includes(`${size}-${i}`);
        b.setAttribute('aria-label', done ? `Puzzle ${i + 1}: ${p.t}` : `Puzzle ${i + 1}`);
        b.title = done ? p.t : `Puzzle ${i + 1}`;
        if (done) {
          const cv = document.createElement('canvas');
          cv.width = size; cv.height = size;
          const g = cv.getContext('2d');
          g.fillStyle = p.bg; g.fillRect(0, 0, size, size);
          p.g.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') { g.fillStyle = PAL[ch]; g.fillRect(x, y, 1, 1); } }));
          b.append(cv);
        } else b.textContent = i + 1;
        b.addEventListener('click', () => load(i));
        picker.append(b);
      });
      const r = document.createElement('button');
      r.type = 'button'; r.className = 'pk rnd'; r.textContent = '🎲 Random';
      r.setAttribute('aria-current', idx < 0);
      r.addEventListener('click', () => load(-1));
      picker.append(r);
      const dl = document.createElement('button');
      dl.type = 'button'; dl.className = 'pk rnd'; dl.textContent = S.daily[today()] != null ? '📅 Daily ✓' : '📅 Daily';
      dl.setAttribute('aria-current', String(idx === -2));
      dl.addEventListener('click', () => load(-2));
      picker.append(dl);
    }

    function load(i) {
      idx = i;
      if (idx >= 0) {
        puzzle = data[size][idx];
        sol = puzzle.g.map((row) => [...row].map((ch) => (ch === '.' ? 0 : 1)));
      } else {
        let rnd = Math.random;
        if (idx === -2) { size = 10; let sd = [...today()].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261); rnd = () => { sd = sd + 0x6D2B79F5 | 0; let t = Math.imul(sd ^ sd >>> 15, 1 | sd); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
        const g = Nono.random(size, rnd) || Nono.random(size, rnd);
        const hue = Math.floor(rnd() * 360);
        sol = g;
        puzzle = { t: 'Random', bg: `hsl(${hue} 70% 92%)`, g: g.map((row) => row.map((v) => (v ? '*' : '.')).join('')), hue };
      }
      n = size;
      rc = sol.map(Nono.clues); cc = sol[0].map((_, x) => Nono.clues(sol.map((r) => r[x])));
      st = Array.from({ length: n * n }, () => 0);
      history = []; status = 'playing'; elapsed = 0; started = false; hints = 0; cur = 0; lives = 3; mistakes = 0;
      gameId++;
      $('result').hidden = true;
      if (idx !== -2 && !SIMPLE) Curio.store.set('nono:last', { size, idx });
      build();
      [...seg.children].forEach((b) => b.setAttribute('aria-pressed', +b.dataset.s === size));
      paintPicker();
      $('reveal').textContent = idx === -2 ? 'Daily puzzle: the same 10×10 for everyone today.' : ''; $('reveal').classList.remove('pop');
      paintLives();
      render();
    }

    function build() {
      nonoEl.innerHTML = '';
      nonoEl.classList.remove('won');
      const maxR = Math.max(...rc.map((c) => Math.max(1, c.length)));
      const maxC = Math.max(...cc.map((c) => Math.max(1, c.length)));
      const avail = Math.min((document.getElementById('bw').clientWidth || 340) - (innerWidth < 421 ? 12 : 28), 620);
      let cs = Math.floor((avail - 6) / (n + maxR * 0.62 + 0.4));
      cs = Math.max(16, Math.min(n === 5 ? 56 : 40, cs));
      const cf = Math.max(10, Math.min(18, Math.round(cs * 0.5)));
      const rcw = Math.ceil(maxR * cf * 0.98 + (maxR - 1) * cf * 0.45 + 10);
      const cch = Math.ceil(maxC * cf * 1.12 + 8);
      nonoEl.style.setProperty('--cf', `${cf}px`);
      nonoEl.style.gridTemplateColumns = `${rcw}px auto`;
      nonoEl.style.gridTemplateRows = `${cch}px auto`;
      const corner = document.createElement('div'); corner.className = 'corner'; corner.textContent = `${n}×${n}`; nonoEl.append(corner);
      const top = document.createElement('div');
      top.style.cssText = `grid-column:2;grid-row:1;display:grid;grid-template-columns:repeat(${n}, ${cs}px);gap:1px;padding:0 2px;`;
      colEls = cc.map((c, x) => { const d = document.createElement('div'); d.className = 'cc'; if (x % 5 === 4 && x < n - 1) d.style.marginRight = '1px'; d.innerHTML = (c.length ? c : [0]).map((v) => `<span>${v}</span>`).join(''); top.append(d); return d; });
      nonoEl.append(top);
      const left = document.createElement('div');
      left.style.cssText = `grid-column:1;grid-row:2;display:grid;grid-template-rows:repeat(${n}, ${cs}px);gap:1px;padding:2px 0;`;
      rowEls = rc.map((c, y) => { const d = document.createElement('div'); d.className = 'rc'; if (y % 5 === 4 && y < n - 1) d.style.marginBottom = '1px'; d.innerHTML = (c.length ? c : [0]).map((v) => `<span>${v}</span>`).join(''); left.append(d); return d; });
      nonoEl.append(left);
      const cells = document.createElement('div');
      cells.className = 'cells';
      cells.style.gridTemplateColumns = `repeat(${n}, ${cs}px)`;
      cells.style.gridTemplateRows = `repeat(${n}, ${cs}px)`;
      cellEls = [];
      for (let i = 0; i < n * n; i++) {
        const c = document.createElement('div');
        const x = i % n, y = Math.floor(i / n);
        c.className = 'c' + (x % 5 === 4 && x < n - 1 ? ' r5' : '') + (y % 5 === 4 && y < n - 1 ? ' b5' : '');
        c.dataset.i = i;
        cells.append(c); cellEls.push(c);
      }
      nonoEl.append(cells);
    }

    const lineVals = (i, horiz) => {
      const out = [];
      if (horiz) for (let x = 0; x < n; x++) out.push(st[i * n + x] === 1 ? 1 : 0);
      else for (let y = 0; y < n; y++) out.push(st[y * n + i] === 1 ? 1 : 0);
      return out;
    };
    const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

    function render() {
      const cx = cur % n, cy = Math.floor(cur / n);
      cellEls.forEach((c, i) => {
        c.classList.toggle('f', st[i] === 1);
        c.classList.toggle('x', st[i] === 2);
        c.classList.toggle('cur', i === cur && status === 'playing' && nonoEl.matches(':focus-visible'));
        c.classList.toggle('hl', status === 'playing' && st[i] === 0 && (i % n === cx || Math.floor(i / n) === cy) && nonoEl.matches(':focus-visible'));
      });
      rowEls.forEach((el, y) => { el.classList.toggle('done', same(Nono.clues(lineVals(y, true)), rc[y])); el.classList.toggle('hl', y === cy && hoverOn); });
      colEls.forEach((el, x) => { el.classList.toggle('done', same(Nono.clues(lineVals(x, false)), cc[x])); el.classList.toggle('hl', x === cx && hoverOn); });
      $('time').textContent = fmtT(elapsed);
      $('pnum').textContent = SIMPLE ? (simpleAt < SEQ.length ? `${simpleAt + 1}/${SEQ.length}` : '🎲') : idx === -2 ? '📅' : idx < 0 ? '🎲' : `${idx + 1}/${data[size].length}`;
      const b = idx < 0 ? null : Curio.getBest(`time-${pid()}`);
      $('best').textContent = b == null ? '-' : fmtT(b);
      const s = solvedSet();
      $('solvedN').textContent = `${data[size].filter((_, i) => s.includes(`${size}-${i}`)).length}/${data[size].length}`;
      $('undo').disabled = !history.length || status !== 'playing';
      $('hint').disabled = status !== 'playing';
      $('mFill').setAttribute('aria-pressed', mode === 'fill');
      $('mX').setAttribute('aria-pressed', mode === 'x');
    }
    let hoverOn = false;

    function startClock() { if (!started) { started = true; t0 = performance.now(); } }

    function snapshot() { history.push(st.slice()); if (history.length > 300) history.shift(); }

    function cellAt(clientX, clientY) {
      const r = nonoEl.querySelector('.cells').getBoundingClientRect();
      const x = Math.floor((clientX - r.left - 2) / ((r.width - 4) / n)), y = Math.floor((clientY - r.top - 2) / ((r.height - 4) / n));
      if (x < 0 || y < 0 || x >= n || y >= n) return null;
      return [x, y];
    }

    function applyStroke(x, y) {
      const s = stroke;
      let cells;
      if (!s.axis) {
        if (x === s.x0 && y === s.y0) cells = [[x, y]];
        else { s.axis = Math.abs(x - s.x0) >= Math.abs(y - s.y0) ? 'h' : 'v'; }
      }
      if (s.axis === 'h') { const a = Math.min(x, s.x0), b = Math.max(x, s.x0); cells = []; for (let k = a; k <= b; k++) cells.push([k, s.y0]); }
      else if (s.axis === 'v') { const a = Math.min(y, s.y0), b = Math.max(y, s.y0); cells = []; for (let k = a; k <= b; k++) cells.push([s.x0, k]); }
      let changed = false;
      for (const [cx, cy] of cells) {
        const i = cy * n + cx;
        if (s.dead) break;
        if (s.from === st[i] && st[i] !== s.to) {
          st[i] = s.to; changed = true;
          if (S.check && s.to === 1 && !sol[cy][cx]) { st[i] = 2; s.dead = true; mistake(i); }
        }
      }
      s.len = cells.length;
      if (changed) {
        s.changed = true;
        if (s.to === 1) sfx.pull(s.len, true); else if (s.to === 2) sfx.knot(); else sfx.pull(1, false);
      }
      cur = s.y0 * n + s.x0;
      render();
    }

    let sIgn = false;
    Curio.drag(nonoEl, {
      start(pt) {
        sIgn = true;
        const e = pt.event;
        if (status !== 'playing') return;
        const p = cellAt(pt.clientX, pt.clientY); if (!p) return;
        e.preventDefault();
        const [x, y] = p, i = y * n + x;
        const want = mode === 'x' ? 2 : 1;
        const from = st[i];
        const to = from === want ? 0 : want;
        const fromState = from === want ? want : from === 0 ? 0 : -1;
        if (fromState < 0) { cellEls[i].animate([{ transform: 'scale(.8)' }, { transform: 'scale(1)' }], 160); return; }
        sIgn = false;
        startClock();
        snapshot();
        stroke = { x0: x, y0: y, from: fromState, to, axis: null, changed: false, len: 1 };
        applyStroke(x, y);
      },
      move(pt) {
        if (sIgn || !stroke) return;
        const p = cellAt(pt.clientX, pt.clientY);
        if (!p) return;
        applyStroke(Math.max(0, Math.min(n - 1, p[0])), Math.max(0, Math.min(n - 1, p[1])));
        if (stroke && stroke.len > 1) { countEl.style.display = 'block'; countEl.style.left = `${pt.clientX}px`; countEl.style.top = `${pt.clientY}px`; countEl.textContent = stroke.len; }
      },
      end() { if (!sIgn) endStroke(); }
    });
    addEventListener('pointerup', () => { if (sIgn && Curio.touchpad) { sIgn = false; dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); } });
    nonoEl.addEventListener('pointermove', (e) => {
      if (stroke || e.pointerType !== 'mouse') return;
      const p = cellAt(e.clientX, e.clientY);
      const was = hoverOn; hoverOn = !!p;
      if (p) { const ni = p[1] * n + p[0]; if (ni !== cur || was !== hoverOn) { cur = ni; render(); } } else if (was) render();
    });
    nonoEl.addEventListener('pointerleave', () => { if (!stroke && hoverOn) { hoverOn = false; render(); } });
    function endStroke() {
      if (!stroke) return;
      countEl.style.display = 'none';
      if (!stroke.changed) history.pop();
      stroke = null;
      render();
      checkWin();
    }
    nonoEl.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (status !== 'playing' || stroke) return;
      const p = cellAt(e.clientX, e.clientY); if (p) setCell(p[1] * n + p[0], 2);
    });

    function setCell(i, want) {
      if (status !== 'playing') return;
      startClock(); snapshot();
      st[i] = st[i] === want ? 0 : want;
      if (S.check && st[i] === 1 && !sol[Math.floor(i / n)][i % n]) { st[i] = 2; mistake(i); render(); return; }
      if (st[i] === 1) sfx.pull(1, true); else if (st[i] === 2) sfx.knot(); else sfx.pull(1, false);
      render(); checkWin();
    }

    function undo() {
      if (!history.length || status !== 'playing') return;
      st = history.pop();
      Curio.beep(330, 0.05, 'sine', 0.06);
      render();
    }

    function hint() {
      if (status !== 'playing') return;
      const wrong = [];
      for (let i = 0; i < n * n; i++) { const s = sol[Math.floor(i / n)][i % n]; if ((st[i] === 1 && !s) || (st[i] === 2 && s)) wrong.push(i); }
      startClock();
      hints++; S.stats.hints++;
      if (wrong.length) {
        snapshot();
        wrong.forEach((i) => { st[i] = 0; cellEls[i].classList.remove('bad'); void cellEls[i].offsetWidth; cellEls[i].classList.add('bad'); });
        Curio.beep(170, 0.15, 'square', 0.05);
        $('reveal').textContent = `${wrong.length} square${wrong.length > 1 ? 's were' : ' was'} wrong. Cleaned up!`;
        render(); return;
      }
      const lines = [];
      for (let k = 0; k < n; k++) { lines.push([true, k]); lines.push([false, k]); }
      let pickI = -1, pickV = 1;
      for (const want of [1, 0]) {
        for (const [horiz, k] of Curio.shuffle(lines)) {
          const idxs = Array.from({ length: n }, (_, j) => (horiz ? k * n + j : j * n + k));
          const line = idxs.map((i) => (st[i] === 1 ? 1 : st[i] === 2 ? 0 : -1));
          const res = Nono.solveLine(line, horiz ? rc[k] : cc[k]);
          if (!res) continue;
          const j = res.findIndex((v, jj) => line[jj] === -1 && v === want);
          if (j >= 0) { pickI = idxs[j]; pickV = want; break; }
        }
        if (pickI >= 0) break;
      }
      if (pickI < 0) {
        for (let i = 0; i < n * n; i++) if (st[i] !== 1 && sol[Math.floor(i / n)][i % n]) { pickI = i; break; }
        if (pickI < 0) return;
      }
      snapshot();
      st[pickI] = pickV ? 1 : 2;
      cellEls[pickI].classList.remove('hint'); void cellEls[pickI].offsetWidth; cellEls[pickI].classList.add('hint');
      Curio.beep(880, 0.08, 'sine', 0.06);
      $('reveal').textContent = pickV ? 'That square needs a stitch. Can you see why?' : 'That square must stay empty, so it gets a knot.';
      render(); checkWin();
    }

    function checkWin() {
      if (status !== 'playing') return;
      for (let y = 0; y < n; y++) if (!same(Nono.clues(lineVals(y, true)), rc[y])) return;
      for (let x = 0; x < n; x++) if (!same(Nono.clues(lineVals(x, false)), cc[x])) return;
      status = 'won';
      tick();
      const secs = Math.round(elapsed);
      const fresh = [];
      let bt = { best: idx < 0 ? null : Curio.getBest(`time-${pid()}`), isNew: false };
      S.stats.solved++; S.stats.cells += n * n;
      award('first', fresh);
      if (idx >= 0) {
        if (!hints) bt = Curio.best(`time-${pid()}`, secs, false);
        const s = solvedSet(); if (!s.includes(pid())) { s.push(pid()); Curio.store.set('nono:solved', s); }
        for (const z of SIZES) if (data[z].every((_, i) => solvedSet().includes(`${z}-${i}`))) award(`s${z}`, fresh);
      }
      if (n === 15) award('big', fresh);
      if (S.check && !mistakes) award('flawless', fresh);
      if (n >= 10 && !hints) award('nohint', fresh);
      if (n === 10 && secs < 120) award('speedy', fresh);
      if (idx === -2) { award('daily', fresh); S.daily[today()] = secs; }
      if (idx === -1) { S.stats.random++; if (S.stats.random >= 5) award('random5', fresh); }
      save();
      nonoEl.classList.add('won');
      cellEls.forEach((c, i) => {
        const x = i % n, y = Math.floor(i / n), ch = puzzle.g[y][x];
        c.style.setProperty('--d', `${(x + y) * (n > 10 ? 25 : 40)}ms`);
        c.classList.remove('x', 'cur', 'hl');
        c.style.setProperty('--cell', puzzle.bg);
        if (ch !== '.') c.style.setProperty('--floss', colorAt(x, y));
      });
      render();
      const r = $('reveal');
      r.textContent = idx < 0 ? 'Abstract art!' : `It's ${/^[AEIOU]/.test(puzzle.t) ? 'an' : 'a'} ${puzzle.t.toLowerCase()}!`;
      r.classList.remove('pop'); void r.offsetWidth; r.classList.add('pop');
      setTimeout(() => { Curio.confetti(); [392, 494, 587, 784, 988, 1175].forEach((f, k) => sfx.pluck(f, k * 0.08)); }, n * 50);
      navigator.vibrate?.([20, 40, 20]);
      const gid = gameId;
      setTimeout(() => { if (gid === gameId) showResult({ secs, bt, fresh }); }, 1300 + n * 60);
    }
    const colorAt = (x, y) => { const ch = puzzle.g[y][x]; return ch === '*' ? `hsl(${(puzzle.hue + x * 6 + y * 6) % 360} 70% 50%)` : PAL[ch]; };
    const starSvg = (on) => `<svg viewBox="0 0 24 24"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 21l1.6-7L2 9.2l7.1-.6z" fill="${on ? '#ffc93c' : 'var(--surface-2)'}" stroke="${on ? '#e09b00' : 'var(--line)'}" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
    function showResult({ lost, secs, bt, fresh = [] }) {
      const cv = $('rPic'), g = cv.getContext('2d');
      cv.width = n; cv.height = n;
      g.fillStyle = puzzle.bg; g.fillRect(0, 0, n, n);
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (puzzle.g[y][x] !== '.' && (!lost || st[y * n + x] === 1)) { g.fillStyle = colorAt(x, y); g.fillRect(x, y, 1, 1); }
      const stars = lost ? 0 : hints ? 1 : (!S.check || !mistakes) ? 3 : 2;
      $('rStars').innerHTML = lost ? '' : [1, 2, 3].map((k) => starSvg(k <= stars)).join('');
      $('rStars').dataset.n = stars;
      $('rTitle').textContent = lost ? 'Out of hearts' : idx === -2 ? 'Daily doodle done!' : idx < 0 ? 'Solved!' : puzzle.t;
      $('rBody').textContent = lost ? 'Three wrong squares and the canvas tears. Try again, or switch mistake checking off for a relaxed game.' : `${idx === -2 ? 'Daily puzzle' : idx < 0 ? 'Random' : `${size}×${size} #${idx + 1}`} solved in ${fmtT(secs)}${hints ? ` with ${hints} hint${hints > 1 ? 's' : ''}` : ''}${S.check ? `, ${mistakes} mistake${mistakes === 1 ? '' : 's'}` : ''}. ${bt.isNew ? 'New best!' : bt.best != null ? `Best: ${fmtT(bt.best)}.` : ''}`;
      $('rBadges').innerHTML = fresh.map((id) => { const a = ACH.find((x) => x.id === id); return `<span class="badge on new" title="${a.d}">★ ${a.name}</span>`; }).join('');
      const nextIdx = idx >= 0 && idx + 1 < data[size].length ? idx + 1 : -1;
      $('rNext').textContent = lost ? 'Try again' : idx === -2 ? 'Random puzzle' : nextIdx >= 0 ? 'Next puzzle' : 'Random puzzle';
      $('rNext').onclick = () => (lost ? load(idx) : SIMPLE ? simpleNext() : load(idx === -2 ? -1 : nextIdx));
      if (SIMPLE && !lost) $('rNext').textContent = simpleAt + 1 < SEQ.length ? 'Next pattern' : 'Surprise pattern';
      $('rShare').hidden = lost;
      $('result').hidden = false;
      $('rNext').focus({ preventScroll: true });
      paintProgress();
    }
    $('rAgain').addEventListener('click', () => { $('result').hidden = true; });
    $('rShare').addEventListener('click', () => {
      const st2 = +$('rStars').dataset.n || 0;
      const emo = { K: '⬛', W: '⬜', R: '🟥', O: '🟧', Y: '🟨', G: '🟩', g: '🟩', B: '🟦', b: '🟦', P: '🟪', p: '🟪', N: '🟫', n: '🟫', E: '⬜', L: '🟪', '*': '🟦' };
      const grid = n <= 10 ? '\n' + puzzle.g.map((row) => [...row].map((ch) => (ch === '.' ? '⬜' : emo[ch] || '⬛')).join('')).join('\n') : '';
      const txt = `Zoble Nonogram · ${idx === -2 ? `Daily ${today()}` : idx < 0 ? `Random ${n}×${n}` : `${puzzle.t} (${n}×${n})`}\n${'⭐'.repeat(st2)}${'☆'.repeat(3 - st2)} in ${fmtT(Math.round(elapsed))}${grid}`;
      (navigator.clipboard?.writeText(txt) || Promise.reject()).then(() => Curio.toast('Result copied'), () => Curio.toast('Copy failed, sorry'));
    });
    function paintProgress() {
      const st2 = S.stats;
      $('stats').innerHTML = `<div class="c-stat"><b>${st2.solved}</b><span>Solved</span></div><div class="c-stat"><b>${solvedSet().length}/${SIZES.reduce((a, z) => a + data[z].length, 0)}</b><span>Gallery</span></div><div class="c-stat"><b>${st2.cells}</b><span>Squares</span></div><div class="c-stat"><b>${st2.mistakes}</b><span>Mistakes</span></div><div class="c-stat"><b>${st2.hints}</b><span>Hints</span></div>`;
      $('badges').innerHTML = ACH.map((a) => `<span class="badge${S.ach[a.id] ? ' on' : ''}" title="${a.d}">${S.ach[a.id] ? '★' : '☆'} ${a.name}</span>`).join('');
      $('badgeCount').textContent = `(${ACH.filter((a) => S.ach[a.id]).length}/${ACH.length} badges)`;
    }

    function tick() {
      const now = performance.now();
      if (status === 'playing' && started && !document.hidden) elapsed += (now - t0) / 1000;
      t0 = now;
      $('time').textContent = fmtT(elapsed);
    }
    setInterval(tick, 250);
    document.addEventListener('visibilitychange', () => { t0 = performance.now(); });

    nonoEl.addEventListener('keydown', (e) => {
      if (document.querySelector('.curio-modal') || e.metaKey || e.altKey || e.ctrlKey) return;
      const mv = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key];
      if (mv) {
        e.preventDefault();
        cur = ((Math.floor(cur / n) + mv[1] + n) % n) * n + ((cur % n) + mv[0] + n) % n;
        render(); return;
      }
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'f' || e.key === 'F') { e.preventDefault(); setCell(cur, 1); return; }
      if (e.key === 'x' || e.key === 'X') { e.preventDefault(); setCell(cur, 2); }
    });
    nonoEl.addEventListener('focus', () => setTimeout(render));
    nonoEl.addEventListener('blur', () => setTimeout(render));
    addEventListener('keydown', (e) => {
      if (document.querySelector('.curio-modal') || e.metaKey || e.altKey) return;
      if (e.key === 'z' || e.key === 'Z') { e.preventDefault(); undo(); }
    });
    $('mFill').addEventListener('click', () => { mode = 'fill'; render(); });
    $('mX').addEventListener('click', () => { mode = 'x'; render(); });
    $('undo').addEventListener('click', undo);
    $('hint').addEventListener('click', hint);
    $('clear').addEventListener('click', async () => {
      if (status !== 'playing' || !st.some((v) => v)) return;
      const v = await Curio.modal({ emoji: '✂️', title: 'Unpick everything?', body: 'All your stitches and knots will go (undo can bring them back).', buttons: [{ label: 'Clear', value: 'y' }, { label: 'Cancel', value: 'n' }] });
      if (v !== 'y') return;
      snapshot(); st = st.map(() => 0); render();
    });
    let rz = 0;
    addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (status !== 'playing') return; const keep = st; build(); st = keep; render(); }, 150); });

    $('check').checked = !!S.check;
    $('check').addEventListener('change', (e) => { S.check = e.target.checked; save(); if (status === 'playing') { lives = 3; mistakes = 0; } paintLives(); Curio.toast(S.check ? 'Mistake checking on: wrong squares cost a heart' : 'Mistake checking off: relaxed mode'); });
    if (!Curio.touchpad && matchMedia('(pointer: fine)').matches && !Curio.store.get('tpTip', false)) { Curio.store.set('tpTip', true); setTimeout(() => Curio.toast('Tip: on a touchpad, turn on Touchpad mode in the top bar to paint lines with click, move, click'), 1500); }
    function simpleLoad() {
      if (simpleAt < SEQ.length) { size = SEQ[simpleAt][0]; load(SEQ[simpleAt][1]); }
      else { size = Math.random() < 0.5 ? 5 : 8; load(-1); }
    }
    function simpleNext() { if (simpleAt < SEQ.length) simpleAt++; Curio.store.set('nono:simpleAt', simpleAt); simpleLoad(); }
    const last = Curio.store.get('nono:last', null);
    if (SIMPLE) simpleLoad();
    else if (last && SIZES.includes(last.size) && last.idx >= 0 && last.idx < data[last.size].length) { size = last.size; load(last.idx); }
    else { size = SIZES.includes(Curio.store.get('nono:size', 5)) ? Curio.store.get('nono:size', 5) : 5; load(0); }
    paintProgress();
    window.__nono = { engine: Nono, setCell, get lives() { return lives; }, get sol() { return sol; }, get st() { return st; }, set st(v) { st = v; render(); checkWin(); }, get status() { return status; }, load, get size() { return size; }, set size(v) { size = v; } };
  })();
  
