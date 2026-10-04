(() => {
  const T = window.TTT, { SKINS, AVATARS, QUIPS } = window.TTT_ART;
  const $ = (id) => document.getElementById(id);
  const VER = 2, KEY = 'ttt:v2';

  const MODES = {
    classic: { name: 'Classic', size: 3, blurb: 'Three in a row wins. The napkin original.' },
    misere: { name: 'Misère', size: 3, misere: true, blurb: 'Make three in a row and you LOSE.' },
    four: { name: '4×4', size: 4, blurb: 'Bigger board. Four in a row to win.' },
    ultimate: { name: 'Ultimate', size: 9, blurb: 'Nine boards. Your move sends them somewhere.' }
  };
  const OPPS = {
    pip: { name: 'Pip', lvl: 'Easy', blurb: 'A chick who pecks at random.', level: 'easy' },
    hoot: { name: 'Hoot', lvl: 'Medium', blurb: 'A bookish owl. Knows the basics.', level: 'medium' },
    unit: { name: 'Unit-9', lvl: 'Hard', blurb: 'A robot that searches every future.', level: 'hard' },
    friend: { name: 'Friend', lvl: '2 players', blurb: 'Pass the device and take turns.', level: null }
  };
  const ACH = [
    { id: 'first', icon: '🎉', name: 'First win', desc: 'Win any game against the computer.' },
    { id: 'pip', icon: '🐣', name: 'Chick checked', desc: 'Beat Pip.' },
    { id: 'hoot', icon: '🦉', name: 'Night school', desc: 'Beat Hoot.' },
    { id: 'unitdraw', icon: '🤖', name: 'Stalemate the machine', desc: 'Draw with Unit-9 on the classic board.' },
    { id: 'unitwin', icon: '⚡', name: 'Glitch in the matrix', desc: 'Beat Unit-9 in any mode.' },
    { id: 'misere', icon: '🙃', name: 'Backwards genius', desc: 'Win a game of Misère.' },
    { id: 'four', icon: '🔲', name: 'Four the win', desc: 'Win on the 4×4 board.' },
    { id: 'ultimate', icon: '🌌', name: 'Ultimate', desc: 'Win a game of Ultimate.' },
    { id: 'ultihoot', icon: '📚', name: 'Out-thought the owl', desc: 'Beat Hoot at Ultimate.' },
    { id: 'diag', icon: '↘️', name: 'Diagonal thinker', desc: 'Win with a diagonal line.' },
    { id: 'quick', icon: '⏱️', name: 'In three', desc: 'Win classic using only three of your pieces.' },
    { id: 'streak3', icon: '🔥', name: 'On fire', desc: 'Win 3 games in a row against the computer.' },
    { id: 'streak7', icon: '🌋', name: 'Unstoppable', desc: 'Win 7 games in a row against the computer.' },
    { id: 'party', icon: '🎈', name: 'Party game', desc: 'Finish 5 two-player games.' },
    { id: 'fashion', icon: '🎨', name: 'Wardrobe', desc: 'Play a game with every set of pieces.' },
    { id: 'pure', icon: '🧘', name: 'No help needed', desc: 'Beat Hoot or Unit-9 without hints or undo.' },
    { id: 'fifty', icon: '🏅', name: 'Regular', desc: 'Finish 50 games.' },
    { id: 'tour', icon: '🗺️', name: 'Grand tour', desc: 'Finish a game on all four boards.' }
  ];

  function load() {
    const base = { v: VER, mode: 'classic', opp: 'hoot', skin: 'classic', stats: {}, ach: {}, skinsUsed: [], modesUsed: [], games: 0, party: 0, streak: 0, bestStreak: 0 };
    const d = Curio.store.get(KEY, null);
    if (!d || typeof d !== 'object' || d.v !== VER) return base;
    const s = Object.assign(base, d);
    if (!MODES[s.mode]) s.mode = 'classic';
    if (!OPPS[s.opp]) s.opp = 'hoot';
    if (!SKINS[s.skin]) s.skin = 'classic';
    for (const k of ['stats', 'ach']) if (!s[k] || typeof s[k] !== 'object') s[k] = {};
    for (const k of ['skinsUsed', 'modesUsed']) if (!Array.isArray(s[k])) s[k] = [];
    return s;
  }
  const S = load();
  const save = () => Curio.store.set(KEY, S);

  const SFX = {
    ac() { return Curio.muted ? null : Curio.audioContext(); },
    tone(f, d = 0.12, type = 'sine', vol = 0.1, when = 0, f2 = 0) {
      const ac = this.ac(); if (!ac) return;
      const t = ac.currentTime + when, o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d + 0.03);
    },
    noise(d = 0.08, vol = 0.08, when = 0, freq = 2500, q = 1.2) {
      const ac = this.ac(); if (!ac) return;
      const t = ac.currentTime + when, len = Math.ceil(ac.sampleRate * d), buf = ac.createBuffer(1, len, ac.sampleRate), ch = buf.getChannelData(0);
      for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
      src.buffer = buf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q; g.gain.value = vol;
      src.connect(f).connect(g).connect(ac.destination); src.start(t);
    },
    place(p) {
      const kind = SKINS[S.skin].sound, x = p === 'X';
      if (kind === 'pencil') { this.noise(0.07, 0.12, 0, 3200); this.noise(0.07, 0.1, x ? 0.13 : 0.05, 2600); this.tone(x ? 520 : 400, 0.08, 'triangle', 0.05); }
      else if (kind === 'critter') { if (x) this.tone(620, 0.28, 'triangle', 0.09, 0, 880); else { this.tone(240, 0.09, 'square', 0.06, 0, 150); this.tone(240, 0.09, 'square', 0.05, 0.13, 150); } }
      else if (kind === 'zap') this.tone(x ? 900 : 380, 0.2, 'sine', 0.09, 0, x ? 2200 : 140);
      else if (kind === 'pop') { this.tone(x ? 700 : 520, 0.09, 'sine', 0.12, 0, x ? 1300 : 980); this.noise(0.03, 0.1, 0, 5000); }
      else { this.tone(x ? 160 : 260, 0.22, 'sine', 0.12, 0, x ? 90 : 520); }
    },
    win() { [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.1, i * 0.09)); this.tone(1568, 0.5, 'sine', 0.06, 0.45); },
    lose() { [392, 349, 311, 262].forEach((f, i) => this.tone(f, 0.24, 'sawtooth', 0.05, i * 0.16)); },
    draw() { this.tone(440, 0.18, 'triangle', 0.08); this.tone(440, 0.25, 'triangle', 0.08, 0.2); },
    click() { this.tone(660, 0.04, 'sine', 0.05); },
    bad() { this.tone(160, 0.12, 'square', 0.05); },
    ding() { [880, 1320, 1760].forEach((f, i) => this.tone(f, 0.25, 'sine', 0.07, i * 0.08)); }
  };
  const buzz = (p) => { try { if (navigator.vibrate) navigator.vibrate(p); } catch {} };

  const fx = $('fx');
  function burst(x, y, colors, n = 16, spread = 70) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    for (let k = 0; k < n; k++) {
      const el = document.createElement('i');
      const a = Math.random() * Math.PI * 2, d = spread * (0.4 + Math.random() * 0.8), sz = 5 + Math.random() * 7;
      el.style.background = colors[k % colors.length]; el.style.width = el.style.height = `${sz}px`;
      if (k % 3 === 0) el.style.borderRadius = '2px';
      fx.append(el);
      const anim = el.animate([
        { transform: `translate(${x}px, ${y}px) scale(1)`, opacity: 1 },
        { transform: `translate(${x + Math.cos(a) * d}px, ${y + Math.sin(a) * d + 30}px) scale(0) rotate(${Math.random() * 360}deg)`, opacity: 0.2 }
      ], { duration: 500 + Math.random() * 400, easing: 'cubic-bezier(.2,.8,.3,1)' });
      anim.onfinish = () => el.remove();
    }
  }
  const centerOf = (el) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };

  let badgeQ = [], badgeOn = false;
  function unlock(id) {
    if (S.ach[id]) return;
    const a = ACH.find((x) => x.id === id); if (!a) return;
    S.ach[id] = Date.now(); save();
    badgeQ.push(a); if (!badgeOn) nextBadge();
  }
  function nextBadge() {
    const a = badgeQ.shift(); const el = $('badge');
    if (!a) { badgeOn = false; return; }
    badgeOn = true;
    el.innerHTML = `<span class="bi">${a.icon}</span><span><small>Trophy unlocked</small><b></b></span>`;
    el.querySelector('b').textContent = a.name;
    el.classList.add('on'); SFX.ding(); buzz([20, 40, 20]);
    setTimeout(() => { el.classList.remove('on'); setTimeout(nextBadge, 450); }, 2600);
  }

  const markSVG = (p, cls = '', skin = S.skin) => `<svg viewBox="0 0 100 100" aria-hidden="true"><g class="${cls}">${SKINS[skin][p]}</g></svg>`;
  function gridPaths(n) {
    let d = '';
    const w = n * 100, j = () => (Math.random() * 4 - 2).toFixed(1);
    for (let k = 1; k < n; k++) {
      d += `<path pathLength="1" d="M${k * 100 + +j()} 6 C${k * 100 + +j()} ${w * 0.35} ${k * 100 + +j()} ${w * 0.7} ${k * 100 + +j()} ${w - 6}"/>`;
      d += `<path pathLength="1" d="M6 ${k * 100 + +j()} C${w * 0.35} ${k * 100 + +j()} ${w * 0.7} ${k * 100 + +j()} ${w - 6} ${k * 100 + +j()}"/>`;
    }
    return `<svg class="tt-gridsvg" viewBox="0 0 ${w} ${w}" aria-hidden="true">${d}</svg>`;
  }
  function miniFor(mode) {
    const X = (x, y, s, c = 'var(--tx)') => `<path d="M${x - s} ${y - s} L${x + s} ${y + s} M${x + s} ${y - s} L${x - s} ${y + s}" stroke="${c}" stroke-width="${s * 0.5}" stroke-linecap="round"/>`;
    const O = (x, y, s) => `<circle cx="${x}" cy="${y}" r="${s}" fill="none" stroke="var(--to)" stroke-width="${s * 0.45}"/>`;
    const grid = (n, x0 = 0, w = 90, sw = 3) => { let d = ''; for (let k = 1; k < n; k++) { const p = x0 + k * w / n; d += `<line x1="${p}" y1="${x0 === 0 ? 3 : x0}" x2="${p}" y2="${x0 + w - 3}" stroke-width="${sw}" stroke-linecap="round"/><line x1="${x0 === 0 ? 3 : x0}" y1="${p}" x2="${x0 + w - 3}" y2="${p}" stroke-width="${sw}" stroke-linecap="round"/>`; } return d; };
    const open = '<svg class="tt-mini" viewBox="0 0 90 90" aria-hidden="true">';
    if (mode === 'classic') return `${open}${grid(3)}${X(15, 15, 8)}${O(45, 45, 9)}${X(75, 45, 8)}${O(15, 75, 9)}${X(75, 75, 8)}${X(75, 15, 8)}<path d="M75 6 L75 84" stroke="var(--glow)" stroke-width="5" stroke-linecap="round" opacity=".8"/></svg>`;
    if (mode === 'misere') return `${open}${grid(3)}${X(15, 15, 8)}${X(45, 45, 8)}${X(75, 75, 8)}${O(75, 15, 9)}${O(15, 75, 9)}<path d="M8 8 L82 82" stroke="var(--bad)" stroke-width="5" stroke-linecap="round"/><text x="68" y="52" font-size="20" font-weight="900" fill="var(--bad)">!</text></svg>`;
    if (mode === 'four') { let s = `${open}${grid(4)}`; [[0, 0], [1, 1], [2, 2], [3, 3]].forEach(([r, c]) => { s += O(11 + c * 22.5, 11 + r * 22.5, 6); }); [[0, 3], [1, 2], [3, 0]].forEach(([r, c]) => { s += X(11 + c * 22.5, 11 + r * 22.5, 5.5); }); return s + '</svg>'; }
    let s = open;
    for (let b = 0; b < 9; b++) { const bx = (b % 3) * 30 + 2, by = Math.floor(b / 3) * 30 + 2; s += `<rect x="${bx}" y="${by}" width="26" height="26" rx="5" fill="${b === 4 ? 'color-mix(in srgb, var(--glow) 35%, transparent)' : 'none'}" stroke="var(--gridc)" stroke-width="1.2" opacity=".7"/>`; }
    s += X(17, 17, 7) + O(45, 75, 8) + X(75, 17, 7) + X(14, 75, 3) + O(76, 46, 3) + O(38, 38, 2.6) + X(50, 50, 2.6);
    return s + '</svg>';
  }

  const one = (sel, on) => document.querySelectorAll(sel).forEach((b) => b.setAttribute('aria-checked', String(b.dataset.v === on)));
  function recordText(mode, opp) {
    const r = S.stats[`${mode}:${opp}`];
    if (!r) return 'Not played yet';
    return opp === 'friend' ? `${r.w + r.l + r.d} games` : `W ${r.w} · L ${r.l} · D ${r.d}`;
  }
  function buildMenu() {
    $('cast').innerHTML = `<div class="tt-castmark">${markSVG('X', '', S.skin)}</div><div class="tt-castmem">${AVATARS.pip}</div><div class="tt-castmem">${AVATARS.hoot}</div><div class="tt-castmem">${AVATARS.unit}</div><div class="tt-castmark">${markSVG('O', '', S.skin)}</div>`;
    $('modes').innerHTML = Object.entries(MODES).map(([k, m]) => `<button type="button" class="tt-card" role="radio" data-v="${k}">${miniFor(k)}<b>${m.name}</b><small>${m.blurb}</small></button>`).join('');
    $('opps').innerHTML = Object.entries(OPPS).map(([k, o]) => `<button type="button" class="tt-card" role="radio" data-v="${k}">${AVATARS[k]}<b>${o.name}</b><span class="lvl">${o.lvl}</span><small>${o.blurb}</small><span class="rec" data-rec="${k}"></span></button>`).join('');
    $('skins').innerHTML = Object.entries(SKINS).map(([k, s]) => `<button type="button" class="tt-skin" role="radio" data-v="${k}">${markSVG('X', '', k)}${markSVG('O', '', k)}<span>${s.name}</span></button>`).join('');
    paintMenu();
  }
  function paintMenu() {
    one('#modes .tt-card', S.mode); one('#opps .tt-card', S.opp); one('#skins .tt-skin', S.skin);
    document.querySelectorAll('[data-rec]').forEach((el) => { el.textContent = recordText(S.mode, el.dataset.rec); });
    const n = Object.keys(S.ach).length;
    $('trophyCount').textContent = `${n}/${ACH.length}`;
    $('playBtn').textContent = `Play ${MODES[S.mode].name} vs ${OPPS[S.opp].name}`;
  }
  $('modes').addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (!b) return; S.mode = b.dataset.v; save(); SFX.click(); paintMenu(); });
  $('opps').addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (!b) return; S.opp = b.dataset.v; save(); SFX.click(); paintMenu(); const av = b.querySelector('.av'); if (av) { av.dataset.mood = 'happy'; setTimeout(() => { av.dataset.mood = 'idle'; }, 1500); } });
  $('skins').addEventListener('click', (e) => {
    const b = e.target.closest('[data-v]'); if (!b) return;
    S.skin = b.dataset.v; save(); SFX.place(Math.random() < 0.5 ? 'X' : 'O'); paintMenu();
    document.querySelectorAll('.tt-castmark').forEach((el, k) => { el.innerHTML = markSVG(k ? 'O' : 'X', 'in'); });
  });
  for (const id of ['modes', 'opps', 'skins']) {
    $(id).addEventListener('keydown', (e) => {
      const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      if (!(e.key in keys)) return;
      const list = [...$(id).querySelectorAll('[data-v]')], i = list.indexOf(document.activeElement);
      if (i < 0) return;
      e.preventDefault(); e.stopPropagation();
      const n = list[(i + keys[e.key] + list.length) % list.length]; n.focus(); n.click();
    });
  }

  let quietBig = false;
  let G = null, aiBusy = false, aiToken = 0, bubbleT = 0;
  const vsAI = () => G && G.opp !== 'friend';
  const aiLevel = () => {
    const l = OPPS[G.opp].level;
    return G.mode === 'classic' || G.mode === 'misere' ? (l === 'hard' ? 'impossible' : l) : l;
  };
  function say(text, ms = 2200) {
    const b = $('bubble'); if (!text) { b.classList.remove('on'); return; }
    b.textContent = text; b.classList.add('on');
    clearTimeout(bubbleT); bubbleT = setTimeout(() => b.classList.remove('on'), ms);
  }
  function mood(m) { const av = $('faceO').querySelector('.av'); if (av) av.dataset.mood = m; }

  let starterX = true;
  function startGame(fresh = true) {
    if (fresh) starterX = true;
    aiToken++; aiBusy = false;
    const m = MODES[S.mode];
    G = { mode: S.mode, opp: S.opp, skin: S.skin, n: m.size, misere: !!m.misere, over: false, hist: [], assisted: false, moves: { X: 0, O: 0 }, last: -1 };
    if (G.mode === 'ultimate') { G.u = T.U.fresh(); G.u.turn = starterX ? 1 : 2; }
    else G.board = Array(m.size * m.size).fill(null);
    G.turn = starterX ? 'X' : 'O';
    starterX = !starterX;
    if (!S.skinsUsed.includes(S.skin)) S.skinsUsed.push(S.skin);
    $('menu').hidden = true; $('game').hidden = false;
    $('result').hidden = true;
    $('modeChip').textContent = `${m.name} · ${OPPS[G.opp].name}`;
    $('faceX').innerHTML = vsAI() ? markSVG('X') : markSVG('X');
    $('faceO').innerHTML = vsAI() ? AVATARS[G.opp] : markSVG('O');
    $('nameX').textContent = vsAI() ? 'You' : 'Player X';
    $('nameO').textContent = vsAI() ? OPPS[G.opp].name : 'Player O';
    mood('idle');
    buildBoard(); paintScores(); render(); setStatus();
    if (vsAI()) say(Curio.pick(QUIPS[G.opp].hello), 2000);
    if (vsAI() && G.turn === 'O') scheduleAI();
    else focusFirst();
  }

  const boardEl = $('board');
  let cells = [];
  function buildBoard() {
    boardEl.className = 'tt-board' + (G.mode === 'ultimate' ? ' ult' : '');
    boardEl.innerHTML = '';
    cells = [];
    if (G.mode === 'ultimate') {
      boardEl.style.gridTemplateColumns = '';
      for (let b = 0; b < 9; b++) {
        const sm = document.createElement('div'); sm.className = 'tt-small'; sm.dataset.b = b;
        for (let k = 0; k < 9; k++) {
          const c = mkCell(b * 9 + k);
          c.dataset.r = Math.floor(b / 3) * 3 + Math.floor(k / 3); c.dataset.c = (b % 3) * 3 + (k % 3);
          sm.append(c);
        }
        const big = document.createElement('div'); big.className = 'tt-big'; sm.append(big);
        boardEl.append(sm);
      }
    } else {
      boardEl.style.gridTemplateColumns = `repeat(${G.n}, minmax(0, 1fr))`;
      boardEl.style.gridTemplateRows = `repeat(${G.n}, minmax(0, 1fr))`;
      boardEl.insertAdjacentHTML('beforeend', gridPaths(G.n));
      for (let i = 0; i < G.n * G.n; i++) { const c = mkCell(i); c.dataset.r = Math.floor(i / G.n); c.dataset.c = i % G.n; boardEl.append(c); }
    }
    const w = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    w.setAttribute('class', 'tt-winsvg'); w.id = 'winsvg'; w.setAttribute('aria-hidden', 'true');
    boardEl.append(w);
    cells.forEach((c, i) => { c.tabIndex = i === 0 ? 0 : -1; });
  }
  function mkCell(i) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'tt-cell'; b.dataset.i = i; b.setAttribute('role', 'gridcell');
    b.addEventListener('click', () => human(i));
    cells[i] = b;
    return b;
  }
  const valAt = (i) => (G.mode === 'ultimate' ? [null, 'X', 'O'][G.u.cells[i]] : G.board[i]);
  function legal(i) {
    if (G.over) return false;
    if (G.mode === 'ultimate') return T.U.moves(G.u).includes(i);
    return !G.board[i];
  }
  function render(anim = -1) {
    const humanTurn = !vsAI() || G.turn === 'X';
    const legalSet = G.mode === 'ultimate' ? new Set(T.U.moves(G.u)) : null;
    cells.forEach((c, i) => {
      const v = valAt(i);
      if (v && c.dataset.mark !== v) { c.innerHTML = markSVG(v, i === anim ? 'in' : ''); c.dataset.mark = v; }
      else if (!v && c.dataset.mark !== `g${G.turn}`) { c.innerHTML = markSVG(G.turn, 'ghost'); c.dataset.mark = `g${G.turn}`; }
      const ok = !v && !G.over && humanTurn && !aiBusy && (!legalSet || legalSet.has(i));
      c.disabled = !!v || !ok;
      c.classList.toggle('last', i === G.last && !G.over);
      const rc = `row ${+c.dataset.r + 1}, column ${+c.dataset.c + 1}`;
      c.setAttribute('aria-label', `${rc}: ${v || (ok ? 'empty' : 'unavailable')}`);
    });
    if (G.mode === 'ultimate') {
      const ms = legalSet;
      boardEl.querySelectorAll('.tt-small').forEach((sm) => {
        const b = +sm.dataset.b, w = G.u.small[b];
        sm.classList.toggle('active', !G.over && !w && (G.u.next < 0 || G.u.next === b));
        sm.classList.toggle('done', !!w);
        const big = sm.querySelector('.tt-big');
        const want = w === 1 ? 'X' : w === 2 ? 'O' : w === 3 ? 'draw' : '';
        if (big.dataset.w !== want) {
          big.dataset.w = want;
          big.className = 'tt-big' + (want === 'draw' ? ' drawn' : '');
          big.innerHTML = want === 'X' || want === 'O' ? markSVG(want, 'in') : want === 'draw' ? '=' : '';
          if ((want === 'X' || want === 'O') && !quietBig) { const [x, y] = centerOf(sm); burst(x, y, SKINS[G.skin].colors.map((c) => c.startsWith('var') ? (want === 'X' ? '#e53935' : '#1e88e5') : c), 22, 90); SFX.ding(); }
        }
      });
    }
    $('pX').classList.toggle('is-turn', !G.over && G.turn === 'X');
    $('pO').classList.toggle('is-turn', !G.over && G.turn === 'O');
    $('undoBtn').disabled = !G.hist.length || aiBusy;
    $('hintBtn').disabled = G.over || aiBusy || (vsAI() && G.turn !== 'X');
  }
  function setStatus(text) {
    const st = $('status');
    if (text) { st.textContent = text; return; }
    if (G.over) return;
    if (vsAI()) st.innerHTML = G.turn === 'X' ? (G.mode === 'ultimate' ? (G.u.next >= 0 ? 'Your move, in the <span class="x">glowing</span> board.' : 'Your move, <span class="x">anywhere</span> open.') : 'Your move.') : `<span class="o">${OPPS[G.opp].name}</span> is thinking...`;
    else st.innerHTML = `<span class="${G.turn.toLowerCase()}">Player ${G.turn}</span> to play${G.mode === 'ultimate' && G.u.next >= 0 ? ' in the glowing board' : ''}.`;
    if (G.misere && G.turn === 'X' && G.moves.X === 0) st.innerHTML += ' <span class="c-muted">Avoid three in a row!</span>';
  }
  function paintScores() {
    const r = S.stats[`${G.mode}:${G.opp}`] || { w: 0, l: 0, d: 0 };
    $('scoreX').textContent = r.w; $('scoreO').textContent = r.l; $('scoreD').textContent = r.d;
  }
  const bumpEl = (id) => { const el = $(id); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); };

  function snapshot() { return G.mode === 'ultimate' ? { u: T.U.clone(G.u), turn: G.turn, last: G.last, moves: { ...G.moves } } : { board: G.board.slice(), turn: G.turn, last: G.last, moves: { ...G.moves } }; }
  function restore(s) { if (s.u) G.u = s.u; else G.board = s.board; G.turn = s.turn; G.last = s.last; G.moves = s.moves; }

  function play(i, p) {
    G.hist.push(snapshot());
    if (G.mode === 'ultimate') T.U.play(G.u, i); else G.board[i] = p;
    G.moves[p]++; G.last = i;
    G.turn = p === 'X' ? 'O' : 'X';
    SFX.place(p); buzz(12);
    const [x, y] = centerOf(cells[i]);
    burst(x, y, p === 'X' ? ['#ff8a80', '#ffd54f', SKINS[G.skin].colors[0].startsWith('var') ? '#e53935' : SKINS[G.skin].colors[0]] : ['#82b1ff', '#b9f6ca', SKINS[G.skin].colors[1].startsWith('var') ? '#1e88e5' : SKINS[G.skin].colors[1]], 10, 40);
    const r = outcome();
    render(i);
    if (r) finish(r); else setStatus();
  }
  function outcome() {
    if (G.mode === 'ultimate') {
      if (!G.u.winner) return null;
      if (G.u.winner === 3) return { winner: 'draw' };
      const big = T.U.bigLine(G.u.small);
      return { winner: G.u.winner === 1 ? 'X' : 'O', line: big ? big.line : null };
    }
    return T.result(G.board, G.misere);
  }

  function human(i) {
    if (!G || G.over || aiBusy || (vsAI() && G.turn !== 'X')) return;
    if (!legal(i)) { SFX.bad(); cells[i].animate([{ transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'none' }], { duration: 180 }); return; }
    play(i, G.turn);
    if (!G.over && vsAI()) scheduleAI();
    else if (!G.over) focusLegal(i);
  }

  function scheduleAI() {
    aiBusy = true; render(); setStatus();
    mood('think');
    if (Math.random() < 0.45) say(Curio.pick(QUIPS[G.opp].think), 1400);
    const tok = ++aiToken, t0 = performance.now(), lvl = aiLevel();
    const done = (m) => {
      if (tok !== aiToken || !G || G.over) return;
      const wait = Math.max(0, 450 + Math.random() * 300 - (performance.now() - t0));
      setTimeout(() => {
        if (tok !== aiToken || G.over) return;
        aiBusy = false; mood('idle');
        if (m < 0 || !legal(m)) { const ms = G.mode === 'ultimate' ? T.U.moves(G.u) : T.empties(G.board); m = ms[0]; }
        play(m, 'O');
        if (!G.over) focusLegal(m);
      }, wait);
    };
    setTimeout(() => {
      if (tok !== aiToken) return;
      if (G.mode === 'ultimate') T.aiMoveUltimate(G.u, lvl, Math.random, done);
      else if (G.mode === 'four') done(T.aiMove4(G.board, 'O', lvl));
      else done(T.aiMove(G.board, 'O', lvl, Math.random, G.misere));
    }, 60);
  }

  function drawWinLine(line, lose) {
    const svg = $('winsvg'); if (!line) return;
    const n = G.mode === 'ultimate' ? 3 : G.n, w = n * 100;
    svg.setAttribute('viewBox', `0 0 ${w} ${w}`);
    const c = (i) => [50 + (i % n) * 100, 50 + Math.floor(i / n) * 100];
    const [ax, ay] = c(line[0]), [bx, by] = c(line[line.length - 1]);
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy), ex = dx / len * 36, ey = dy / len * 36;
    svg.innerHTML = `<path pathLength="1" class="${lose ? 'lose' : ''}" d="M${ax - ex} ${ay - ey} L${bx + ex} ${by + ey}"/>`;
  }

  function finish(r) {
    G.over = true; aiBusy = false; aiToken++;
    const key = `${G.mode}:${G.opp}`, rec = (S.stats[key] ||= { w: 0, l: 0, d: 0 });
    const n = G.mode === 'ultimate' ? 3 : G.n;
    let outcomeKind;
    if (r.winner === 'draw') { rec.d++; outcomeKind = 'draw'; bumpEl('scoreD'); }
    else if (r.winner === 'X') { rec.w++; outcomeKind = 'win'; bumpEl('scoreX'); }
    else { rec.l++; outcomeKind = 'lose'; bumpEl('scoreO'); }
    S.games++;
    if (!S.modesUsed.includes(G.mode)) S.modesUsed.push(G.mode);
    if (r.line) {
      drawWinLine(r.line, vsAI() && r.winner === 'O');
      const lineCells = G.mode === 'ultimate' ? [] : r.line;
      cells.forEach((c, i) => { if (G.mode !== 'ultimate') c.classList.add(lineCells.includes(i) ? 'win' : 'dim'); });
      if (G.mode === 'ultimate') boardEl.querySelectorAll('.tt-small').forEach((sm) => { if (!r.line.includes(+sm.dataset.b)) sm.style.opacity = '.45'; });
    }
    render();
    $('pX').classList.remove('is-turn'); $('pO').classList.remove('is-turn');
    const human = vsAI();
    if (human) {
      if (outcomeKind === 'win') { S.streak++; S.bestStreak = Math.max(S.bestStreak, S.streak); }
      else if (outcomeKind === 'lose') S.streak = 0;
    } else if (outcomeKind) S.party++;
    save();
    let title, sub;
    if (human) {
      if (outcomeKind === 'win') {
        title = Curio.pick(['You win!', 'Victory!', 'Nailed it!']); mood('sad'); say(Curio.pick(QUIPS[G.opp].lose), 2600);
        SFX.win(); Curio.confetti(); boardEl.classList.add('won'); buzz([30, 50, 60]);
        sub = G.misere ? `${OPPS[G.opp].name} got stuck making three in a row.` : `${G.moves.X} moves. ${G.assisted ? 'With a little help.' : 'All on your own.'}`;
      } else if (outcomeKind === 'lose') {
        title = `${OPPS[G.opp].name} wins`; mood('happy'); say(Curio.pick(QUIPS[G.opp].win), 2600);
        SFX.lose(); boardEl.classList.add('shake'); buzz([80, 40, 80]);
        sub = G.misere ? 'You completed a line. In Misère, that is the bad thing.' : 'Shake it off. Rematch?';
      } else {
        title = 'Draw'; mood('shock'); say(Curio.pick(QUIPS[G.opp].draw), 2600);
        SFX.draw(); sub = G.opp === 'unit' ? 'Against Unit-9 a draw is a moral victory.' : 'Perfectly balanced.';
      }
    } else {
      if (outcomeKind === 'draw') { title = 'Draw'; sub = 'Honours even. Go again?'; SFX.draw(); }
      else { title = `Player ${r.winner} wins!`; sub = 'Loser picks the snacks.'; SFX.win(); Curio.confetti(80); boardEl.classList.add('won'); }
    }
    setStatus(title);
    checkAch(r, outcomeKind);
    setTimeout(() => showResult(title, sub, outcomeKind, r), r.line ? 1300 : 800);
  }

  function checkAch(r, kind) {
    const ai = vsAI();
    if (ai && kind === 'win') {
      unlock('first');
      if (G.opp === 'pip') unlock('pip');
      if (G.opp === 'hoot') unlock('hoot');
      if (G.opp === 'unit') unlock('unitwin');
      if (G.mode === 'misere') unlock('misere');
      if (G.mode === 'four') unlock('four');
      if (G.mode === 'ultimate') { unlock('ultimate'); if (G.opp === 'hoot') unlock('ultihoot'); }
      if (G.mode === 'classic' && G.moves.X === 3) unlock('quick');
      if (r.line && G.mode !== 'ultimate' && G.mode !== 'misere') { const n = G.n, d1 = [...Array(n).keys()].map((k) => k * n + k), d2 = [...Array(n).keys()].map((k) => k * n + (n - 1 - k)); if (r.line.join() === d1.join() || r.line.join() === d2.join()) unlock('diag'); }
      if (!G.assisted && (G.opp === 'hoot' || G.opp === 'unit')) unlock('pure');
      if (S.streak >= 3) unlock('streak3');
      if (S.streak >= 7) unlock('streak7');
    }
    if (ai && kind === 'draw' && G.opp === 'unit' && G.mode === 'classic') unlock('unitdraw');
    if (!ai && S.party >= 5) unlock('party');
    if (Object.keys(SKINS).every((k) => S.skinsUsed.includes(k))) unlock('fashion');
    if (S.games >= 50) unlock('fifty');
    if (Object.keys(MODES).every((k) => S.modesUsed.includes(k))) unlock('tour');
  }

  function showResult(title, sub, kind, r) {
    if (!G.over) return;
    const box = $('result');
    const rec = S.stats[`${G.mode}:${G.opp}`];
    const face = vsAI() ? AVATARS[G.opp].replace('class="av"', `class="av" data-mood="${kind === 'win' ? 'sad' : kind === 'lose' ? 'happy' : 'shock'}"`) : (kind === 'draw' ? markSVG('X') : markSVG(r.winner, 'in'));
    box.innerHTML = `<div class="tt-rcard ${kind === 'lose' ? 'lose' : ''}" role="dialog" aria-label="Game over"><div class="rface">${face}</div><h3></h3><p></p>
      <div class="tt-rstats">${vsAI() ? `<div><b>${rec.w}-${rec.l}-${rec.d}</b><span>W-L-D</span></div><div><b>${S.streak}</b><span>Win streak</span></div><div><b>${S.bestStreak}</b><span>Best streak</span></div>` : `<div><b>${rec.w}</b><span>X wins</span></div><div><b>${rec.d}</b><span>Draws</span></div><div><b>${rec.l}</b><span>O wins</span></div>`}</div>
      <div class="c-row"><button class="c-btn" type="button" data-a="again">Play again</button><button class="c-btn c-btn--ghost" type="button" data-a="share">Share</button><button class="c-btn c-btn--ghost" type="button" data-a="menu">Menu</button></div></div>`;
    box.querySelector('h3').textContent = title; box.querySelector('p').textContent = sub;
    box.hidden = false;
    box.querySelector('[data-a="again"]').focus({ preventScroll: true });
    box.onclick = (e) => {
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'again') startGame(false);
      else if (a === 'menu') toMenu();
      else if (a === 'share') share(kind, r);
    };
  }

  async function share(kind, r) {
    const who = vsAI() ? OPPS[G.opp].name : 'a friend';
    const res = vsAI() ? (kind === 'win' ? 'I beat' : kind === 'lose' ? 'I lost to' : 'I drew with') : (kind === 'draw' ? 'We drew,' : `Player ${r.winner} won`);
    let grid = '';
    if (G.mode !== 'ultimate') {
      const n = G.n;
      for (let y = 0; y < n; y++) grid += G.board.slice(y * n, y * n + n).map((v) => (v === 'X' ? '❌' : v === 'O' ? '⭕' : '⬜')).join('') + '\n';
    } else {
      for (let y = 0; y < 3; y++) grid += G.u.small.slice(y * 3, y * 3 + 3).map((v) => (v === 1 ? '❌' : v === 2 ? '⭕' : v === 3 ? '➖' : '⬜')).join('') + '\n';
    }
    const text = `Zoble Tic Tac Toe · ${MODES[G.mode].name}\n${res} ${vsAI() ? who : ''} ${kind === 'win' ? '🏆' : kind === 'lose' ? '🫠' : '🤝'}\n${grid}Streak ${S.streak} · best ${S.bestStreak}`;
    try { await navigator.clipboard.writeText(text); Curio.toast('Result copied'); } catch { Curio.toast('Could not copy'); }
  }

  function toMenu() {
    aiToken++; aiBusy = false;
    $('game').hidden = true; $('menu').hidden = false;
    paintMenu();
    $('playBtn').focus({ preventScroll: true });
    scrollTo({ top: 0 });
  }

  function undo() {
    if (!G || !G.hist.length || aiBusy) return;
    aiToken++;
    if (G.over) { G.over = false; $('result').hidden = true; boardEl.classList.remove('won', 'shake'); }
    let s = G.hist.pop();
    if (vsAI()) while (s && s.turn !== 'X' && G.hist.length) s = G.hist.pop();
    if (vsAI() && s.turn !== 'X') { G.hist.push(s); return; }
    restore(s);
    G.assisted = true;
    cells.forEach((c) => { c.classList.remove('win', 'dim'); c.dataset.mark = ''; });
    boardEl.querySelectorAll('.tt-small').forEach((sm) => { sm.style.opacity = ''; const big = sm.querySelector('.tt-big'); big.dataset.w = 'reset'; });
    $('winsvg').innerHTML = '';
    SFX.tone(500, 0.08, 'sine', 0.06, 0, 300);
    quietBig = true; render(); quietBig = false; setStatus(); mood('idle');
    if (vsAI() && G.turn === 'O') scheduleAI();
  }

  function hint() {
    if (!G || G.over || aiBusy || (vsAI() && G.turn !== 'X')) return;
    G.assisted = true;
    const me = G.turn, show = (m) => { if (m < 0 || !cells[m]) return; cells[m].classList.remove('hint'); void cells[m].offsetWidth; cells[m].classList.add('hint'); cells[m].focus({ preventScroll: true }); SFX.tone(990, 0.12, 'triangle', 0.07); setTimeout(() => cells[m].classList.remove('hint'), 3100); };
    if (G.mode === 'ultimate') { $('hintBtn').disabled = true; setStatus('Thinking about a good move...'); T.mcts(G.u, 400, Math.random, (m) => { setStatus(); render(); show(m); }); }
    else if (G.mode === 'four') show(T.aiMove4(G.board, me, 'hard'));
    else show(T.aiMove(G.board, me, 'impossible', Math.random, G.misere));
    if (vsAI()) say(Curio.pick(['Getting help, are we?', 'Hint used, I saw that.', 'Peeking at the answers?']), 1600);
  }

  function focusFirst() { const i = cells.findIndex((c, k) => legal(k)); if (i >= 0) setRoving(i, false); }
  function focusLegal(near) {
    if (G.over || (vsAI() && G.turn !== 'X')) return;
    if (document.activeElement && document.activeElement.classList.contains('tt-cell')) {
      const i = cells.findIndex((c, k) => legal(k)); if (i >= 0) setRoving(i, true);
    } else { const i = cells.findIndex((c, k) => legal(k)); if (i >= 0) setRoving(i, false); }
  }
  function setRoving(i, focus) { cells.forEach((c) => { c.tabIndex = -1; }); cells[i].tabIndex = 0; if (focus) cells[i].focus({ preventScroll: true }); }
  boardEl.addEventListener('keydown', (e) => {
    const c = e.target.closest('.tt-cell'); if (!c) return;
    const d = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key];
    if (!d) return;
    e.preventDefault();
    const W = G.mode === 'ultimate' ? 9 : G.n;
    let r = (+c.dataset.r + d[0] + W) % W, col = (+c.dataset.c + d[1] + W) % W;
    const t = cells.find((x) => +x.dataset.r === r && +x.dataset.c === col);
    if (t) setRoving(+t.dataset.i, true);
  });

  addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector('.curio-modal')) return;
    if ($('game').hidden) { if (e.key === 'Enter' && document.activeElement === document.body) startGame(); return; }
    const k = e.key.toLowerCase();
    if (/^[1-9]$/.test(e.key) && G.n === 3 && G.mode !== 'ultimate') { human(+e.key - 1); e.preventDefault(); }
    else if (k === 'u') undo();
    else if (k === 'h') hint();
    else if (k === 'n') { if (G.over) startGame(false); else restartAsk(); }
    else if (e.key === 'Escape') toMenu();
  });

  async function restartAsk() {
    if (G && !G.over && G.hist.length > 1) {
      const v = await Curio.modal({ emoji: '↻', title: 'Restart this game?', body: vsAI() ? 'It will not count as a loss. Promise.' : 'The current board will be cleared.', buttons: [{ label: 'Restart', value: 'y' }, { label: 'Keep playing', value: 'n' }] });
      if (v !== 'y') return;
    }
    starterX = G && G.turn === 'X' ? !starterX : starterX;
    startGame(false);
  }

  const HOW = {
    classic: ['Take turns placing pieces. You are X, and you always see your piece ghosted under the pointer.', 'Get three in a row across, down or diagonally to win.', 'Perfect play is always a draw, so Unit-9 can be held but never beaten here. Can you?'],
    misere: ['Same board, flipped goal: whoever completes three in a row LOSES.', 'Hug the edges, mirror your opponent, and make them run out of safe squares.', 'Unit-9 plays it perfectly. A draw is a great result.'],
    four: ['A 4×4 board where you need four in a row: rows, columns or the two long diagonals.', 'Blocking matters more than ever, because lines are long and slow to build.', 'Watch for double threats: two lines that each need one more piece.'],
    ultimate: ['Nine small boards make one big board. Win a small board with three in a row to claim it.', 'The square you pick inside a small board decides which small board your opponent must play in next. It glows.', 'If you are sent to a board that is already won or full, you may play anywhere.', 'Win three small boards in a row to win the game.']
  };
  function howBody(mode) {
    const box = document.createElement('div'); box.className = 'tt-how';
    const list = mode ? [mode] : Object.keys(MODES);
    for (const m of list) for (const [i, line] of HOW[m].entries()) {
      const d = document.createElement('div');
      d.innerHTML = `${i === 0 ? miniFor(m) : '<svg viewBox="0 0 54 54"></svg>'}<span><b></b></span>`;
      if (i) d.querySelector('svg').remove();
      d.querySelector('b').textContent = i === 0 ? MODES[m].name : '';
      d.querySelector('span').append(line);
      if (i) d.querySelector('b').remove();
      box.append(d);
    }
    return box;
  }
  $('howBtn').addEventListener('click', () => Curio.modal({ emoji: '📖', title: 'How to play', body: howBody(null), buttons: [{ label: 'Got it', value: 'x' }] }));
  $('ruleBtn').addEventListener('click', () => Curio.modal({ emoji: '📖', title: `${MODES[G.mode].name} rules`, body: howBody(G.mode), buttons: [{ label: 'Back to the game', value: 'x' }] }));
  $('trophyBtn').addEventListener('click', () => {
    const box = document.createElement('div'); box.className = 'tt-trophies';
    for (const a of ACH) {
      const d = document.createElement('div'); d.className = 'tt-trophy' + (S.ach[a.id] ? '' : ' locked');
      d.innerHTML = `<i>${a.icon}</i><div><b></b><span></span></div>`;
      d.querySelector('b').textContent = a.name; d.querySelector('span').textContent = a.desc;
      box.append(d);
    }
    Curio.modal({ emoji: '🏆', title: `Trophies ${Object.keys(S.ach).length}/${ACH.length}`, body: box, buttons: [{ label: 'Close', value: 'x' }] });
  });
  $('statsBtn').addEventListener('click', async () => {
    const box = document.createElement('div');
    let h = '<div class="tt-statgrid"><span class="hd"></span><span class="hd">Won</span><span class="hd">Lost</span><span class="hd">Drawn</span>';
    for (const m of Object.keys(MODES)) for (const o of ['pip', 'hoot', 'unit']) {
      const r = S.stats[`${m}:${o}`]; if (!r) continue;
      h += `<span class="lb">${MODES[m].name} vs ${OPPS[o].name}</span><span>${r.w}</span><span>${r.l}</span><span>${r.d}</span>`;
    }
    h += '</div>';
    box.innerHTML = `<p style="margin:0 0 10px">${S.games} games played · best win streak ${S.bestStreak} · ${S.party} two-player games</p>${S.games ? h : '<p>No games yet. Go on, the owl is waiting.</p>'}`;
    const v = await Curio.modal({ emoji: '📊', title: 'Your record', body: box, buttons: [{ label: 'Close', value: 'x' }, { label: 'Reset stats', value: 'reset' }] });
    if (v === 'reset') {
      const ok = await Curio.modal({ emoji: '🧹', title: 'Reset all stats?', body: 'Trophies stay. Win/loss records and streaks go.', buttons: [{ label: 'Reset', value: 'y' }, { label: 'Cancel', value: 'n' }] });
      if (ok === 'y') { S.stats = {}; S.games = 0; S.streak = 0; S.bestStreak = 0; S.party = 0; save(); paintMenu(); }
    }
  });
  $('playBtn').addEventListener('click', () => { SFX.click(); startGame(true); });
  $('undoBtn').addEventListener('click', undo);
  $('hintBtn').addEventListener('click', hint);
  $('newBtn').addEventListener('click', restartAsk);
  $('menuBtn').addEventListener('click', toMenu);
  document.addEventListener('visibilitychange', () => { document.body.classList.toggle('tt-paused', document.hidden); });

  buildMenu();
  window.__ttt = { get G() { return G; }, human, startGame, get busy() { return aiBusy; }, S, unlock };
})();
