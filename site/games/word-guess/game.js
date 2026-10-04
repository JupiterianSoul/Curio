(() => {
  const X = window.WG_EXTRA;
  const $ = (id) => document.getElementById(id);
  const V5 = new Set([...window.WG_VALID, ...window.WG_ANSWERS, ...X.v5]);
  const SET4 = new Set([...X.a4, ...X.v4]), SET6 = new Set([...X.a6, ...X.v6]);
  const ANS = { 4: X.a4, 5: window.WG_ANSWERS, 6: X.a6 };
  const ROWS = 6, FLIP = 300, KEY = 'wg:v2', VER = 2;
  const PALS = { classic: ['Classic', '#6aaa64', '#c9b458'], ocean: ['Ocean', '#1f9e8f', '#e9a93b'], candy: ['Candy', '#e5488f', '#8f6bf0'], contrast: ['High contrast', '#f5793a', '#3d8fe0'] };
  const PRAISE = ['Genius', 'Magnificent', 'Impressive', 'Splendid', 'Great', 'Phew'];
  const ACH = [
    { id: 'first', icon: '🎉', name: 'First word', desc: 'Win any game.' },
    { id: 'two', icon: '🎯', name: 'Sharpshooter', desc: 'Solve a word in two guesses.' },
    { id: 'ace', icon: '🍀', name: 'Hole in one', desc: 'Solve a word with your first guess.' },
    { id: 'clutch', icon: '😅', name: 'Clutch', desc: 'Solve on your very last guess.' },
    { id: 'hard', icon: '🧗', name: 'Hard as nails', desc: 'Win a game in hard mode.' },
    { id: 'four', icon: '4️⃣', name: 'Short and sweet', desc: 'Win a 4-letter game.' },
    { id: 'six', icon: '6️⃣', name: 'Long haul', desc: 'Win a 6-letter game.' },
    { id: 'daily', icon: '📅', name: 'Daily driver', desc: 'Solve a daily word.' },
    { id: 'triple', icon: '🥇', name: 'Daily triple', desc: 'Solve all three daily words in one day.' },
    { id: 'streak5', icon: '🔥', name: 'Hot streak', desc: 'Win 5 endless games in a row.' },
    { id: 'rush5', icon: '⏱️', name: 'Quick thinker', desc: 'Solve 5 words in one rush.' },
    { id: 'rush10', icon: '🚀', name: 'Rush hour', desc: 'Solve 10 words in one rush.' },
    { id: 'theme10', icon: '🎨', name: 'Topical', desc: 'Solve 10 themed words.' },
    { id: 'pack', icon: '📦', name: 'Pack complete', desc: 'Solve every word in a theme pack.' },
    { id: 'nohint', icon: '🧠', name: 'Unaided', desc: 'Solve a 6-letter word without a hint.' },
    { id: 'wins25', icon: '🏆', name: 'Wordsmith', desc: 'Win 25 games.' }
  ];

  function load() {
    const base = { v: VER, hard: false, pal: 'classic', stats: {}, daily: {}, themes: {}, rushBest: 0, ach: {}, cur: {}, wins: 0, themeWins: 0 };
    const d = Curio.store.get(KEY, null);
    if (!d || typeof d !== 'object' || d.v !== VER) {
      const old = Curio.store.get('wg:stats:unlimited', null);
      if (old && typeof old.played === 'number') base.stats.e5 = { played: old.played, wins: old.wins, streak: old.streak, max: old.maxStreak, dist: Array.isArray(old.dist) ? old.dist.slice(0, 6) : [0, 0, 0, 0, 0, 0] };
      const oldD = Curio.store.get('wg:stats:daily', null);
      if (oldD && typeof oldD.played === 'number') base.stats.d5 = { played: oldD.played, wins: oldD.wins, streak: oldD.streak, max: oldD.maxStreak, dist: Array.isArray(oldD.dist) ? oldD.dist.slice(0, 6) : [0, 0, 0, 0, 0, 0] };
      return base;
    }
    const s = Object.assign(base, d);
    if (!PALS[s.pal]) s.pal = 'classic';
    for (const k of ['stats', 'daily', 'themes', 'ach', 'cur']) if (!s[k] || typeof s[k] !== 'object') s[k] = {};
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
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d + 0.03);
    },
    noise(d = 0.04, vol = 0.06, freq = 3000) {
      const ac = this.ac(); if (!ac) return;
      const len = Math.ceil(ac.sampleRate * d), buf = ac.createBuffer(1, len, ac.sampleRate), ch = buf.getChannelData(0);
      for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
      const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
      src.buffer = buf; f.type = 'highpass'; f.frequency.value = freq; g.gain.value = vol;
      src.connect(f).connect(g).connect(ac.destination); src.start();
    },
    key() { this.noise(0.03, 0.16, 3200); this.noise(0.05, 0.08, 600); this.tone(160 + Math.random() * 30, 0.05, 'triangle', 0.06); },
    del() { this.noise(0.03, 0.06, 1200); },
    flip(s, i) { const base = s === 'hit' ? 660 : s === 'near' ? 520 : 300; this.tone(base * (1 + i * 0.04), 0.09, 'triangle', 0.04); window.Cafe?.sound('tile', 0.7); },
    bad() { this.tone(150, 0.14, 'square', 0.05, 0, 110); },
    win() { [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.2, 'triangle', 0.08, i * 0.08)); },
    lose() { [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.25, 'sawtooth', 0.04, i * 0.15)); },
    ding() { [880, 1320, 1760].forEach((f, i) => this.tone(f, 0.25, 'sine', 0.06, i * 0.08)); },
    tick() { this.tone(1500, 0.03, 'square', 0.03); }
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

  function seeded(seed) { return () => { seed |= 0; seed = seed + 0x6d2b79f5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const ORDER = {};
  for (const L of [4, 5, 6]) { const r = seeded(20240101 + (L === 5 ? 0 : L * 977)), a = ANS[L].slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } ORDER[L] = a; }
  const EPOCH = Date.UTC(2024, 0, 1);
  const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  const dayNumber = () => { const d = new Date(); return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - EPOCH) / 86400000); };
  const dailyWord = (L) => ORDER[L][((dayNumber() % ORDER[L].length) + ORDER[L].length) % ORDER[L].length];

  function valid(w) {
    const L = w.length;
    if (L === 5) return V5.has(w);
    if (L === 4) return SET4.has(w) || V5.has(w + 's');
    if (L === 6) {
      if (SET6.has(w)) return true;
      const st = w.slice(0, 5);
      if (w[5] === 's' && V5.has(st) && !/[sxz]/.test(st[4])) return true;
      if ((w[5] === 'd' || w[5] === 'r') && st[4] === 'e' && V5.has(st)) return true;
      const s4 = w.slice(0, 4), suf = w.slice(4);
      if ((suf === 'ed' || suf === 'er' || suf === 'ly') && (SET4.has(s4) || V5.has(s4 + 's')) && s4[3] !== 'e') return true;
      return false;
    }
    return false;
  }
  function score(guess, answer) {
    const L = answer.length, res = Array(L).fill('miss'), left = {};
    for (let i = 0; i < L; i++) { if (guess[i] === answer[i]) res[i] = 'hit'; else left[answer[i]] = (left[answer[i]] || 0) + 1; }
    for (let i = 0; i < L; i++) if (res[i] !== 'hit' && left[guess[i]]) { res[i] = 'near'; left[guess[i]]--; }
    return res;
  }
  const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'];
  function hardCheck(guess) {
    for (const g of G.guesses) {
      const res = score(g, G.answer), need = {};
      for (let i = 0; i < g.length; i++) {
        if (res[i] === 'hit' && guess[i] !== g[i]) return `The ${ORD[i]} letter must be ${g[i].toUpperCase()}`;
        if (res[i] !== 'miss') need[g[i]] = (need[g[i]] || 0) + 1;
      }
      for (const [ch, n] of Object.entries(need)) if (guess.split('').filter((c) => c === ch).length < n) return `Your guess must contain ${ch.toUpperCase()}`;
    }
    for (const i of G.reveals || []) if (guess[i] !== G.answer[i]) return `The ${ORD[i]} letter must be ${G.answer[i].toUpperCase()}`;
    return null;
  }

  function buildFloat() {
    const el = $('float'), letters = 'WORDGUESSLETTERS', cols = ['var(--hit)', 'var(--near)', 'var(--miss)'];
    for (let i = 0; i < 14; i++) {
      const s = document.createElement('span');
      s.textContent = letters[i % letters.length];
      s.style.left = `${(i * 7.3 + Math.random() * 4) % 100}%`;
      s.style.background = cols[i % 3];
      s.style.animationDuration = `${18 + Math.random() * 16}s`;
      s.style.animationDelay = `${-Math.random() * 30}s`;
      s.style.transform = `scale(${0.6 + Math.random() * 0.8})`;
      el.append(s);
    }
  }
  function paintHome() {
    $('root').dataset.pal = S.pal;
    $('logo').innerHTML = 'GUESS'.split('').map((c, i) => `<b class="${['hit', 'near', 'miss', 'hit', 'near'][i]}" style="animation-delay:${i * 0.12}s">${c}</b>`).join('');
    const tk = todayKey();
    $('dailies').innerHTML = [4, 5, 6].map((L) => {
      const d = S.daily[`${L}:${tk}`];
      const done = d && d.status !== 'playing';
      const pat = d && d.guesses && d.guesses.length ? score(d.guesses[d.guesses.length - 1], d.answer) : null;
      return `<button type="button" class="wg-chip ${done ? 'done' : ''}" data-daily="${L}"><span class="mini">${Array.from({ length: L }, (_, i) => `<i class="${pat ? (pat[i] === 'hit' ? 'h' : pat[i] === 'near' ? 'n' : '') : (i % 3 === 0 ? 'h' : i % 3 === 1 ? 'n' : '')}"></i>`).join('')}</span>${L} letters<small>${done ? (d.status === 'won' ? `${d.guesses.length}/${ROWS}` : 'X/6') : d && d.guesses.length ? 'in progress' : 'Play'}</small></button>`;
    }).join('');
    $('lens').innerHTML = [4, 5, 6].map((L) => { const st = S.stats[`e${L}`]; return `<button type="button" class="wg-chip" data-endless="${L}"><span class="mini">${Array.from({ length: L }, (_, i) => `<i class="${i === 1 ? 'h' : i === L - 1 ? 'n' : ''}"></i>`).join('')}</span>${L} letters<small>${st ? `${st.wins} won · streak ${st.streak}` : 'Not played'}</small></button>`; }).join('');
    $('themes').innerHTML = Object.entries(X.themes).map(([k, t]) => { const done = (S.themes[k] || []).length; return `<button type="button" class="wg-theme" data-theme="${k}"><i>${t.icon}</i>${t.name}<span class="bar"><b style="width:${done / t.words.length * 100}%"></b></span><small class="c-muted">${done}/${t.words.length}</small></button>`; }).join('');
    $('rushBest').textContent = S.rushBest ? `Best: ${S.rushBest} words` : 'No record yet';
    $('hardBox').checked = !!S.hard;
    $('pals').innerHTML = Object.entries(PALS).map(([k, p]) => `<button type="button" role="radio" aria-checked="${k === S.pal}" data-pal="${k}" aria-label="${p[0]} colours"><i style="background:${p[1]}"></i><i style="background:${p[2]}"></i><span>${p[0]}</span></button>`).join('');
    $('trophyN').textContent = `${Object.keys(S.ach).length}/${ACH.length}`;
  }
  $('dailies').addEventListener('click', (e) => { const b = e.target.closest('[data-daily]'); if (b) startDaily(+b.dataset.daily); });
  $('lens').addEventListener('click', (e) => { const b = e.target.closest('[data-endless]'); if (b) startEndless(+b.dataset.endless); });
  $('themes').addEventListener('click', (e) => { const b = e.target.closest('[data-theme]'); if (b) startTheme(b.dataset.theme); });
  $('rushBtn').addEventListener('click', () => startRush());
  $('hardBox').addEventListener('change', () => { S.hard = $('hardBox').checked; save(); SFX.tick(); Curio.toast(S.hard ? 'Hard mode on: found letters must be reused' : 'Hard mode off'); });
  $('pals').addEventListener('click', (e) => { const b = e.target.closest('[data-pal]'); if (!b) return; S.pal = b.dataset.pal; save(); SFX.tick(); paintHome(); });

  let G = null, cur = '', busy = false, tiles = [], keys = {}, rush = null, rushTimer = 0;

  function show(w) { $('home').hidden = w !== 'home'; $('play').hidden = w !== 'play'; scrollTo({ top: 0 }); }
  function startDaily(L) {
    const k = `${L}:${todayKey()}`, ans = dailyWord(L);
    let g = S.daily[k];
    if (!g || g.answer !== ans) g = S.daily[k] = { mode: 'daily', L, answer: ans, guesses: [], status: 'playing', hard: S.hard, reveals: [], key: k };
    begin(g);
    if (g.status !== 'playing') setTimeout(() => showResult(g.status), 300);
  }
  function startEndless(L) {
    let g = S.cur[`e${L}`];
    if (!g || g.status !== 'playing' || g.answer.length !== L) { g = S.cur[`e${L}`] = { mode: 'endless', L, answer: pickNew(ANS[L]), guesses: [], status: 'playing', hard: S.hard, reveals: [] }; }
    g.hard = S.hard && !g.guesses.length ? true : g.hard;
    begin(g);
  }
  function startTheme(k) {
    const t = X.themes[k], done = S.themes[k] || [];
    const left = t.words.filter((w) => !done.includes(w));
    const pool = left.length ? left : t.words;
    let g = S.cur[`t:${k}`];
    if (!g || g.status !== 'playing') g = S.cur[`t:${k}`] = { mode: 'theme', theme: k, L: 5, answer: Curio.pick(pool), guesses: [], status: 'playing', hard: S.hard, reveals: [] };
    begin(g);
  }
  function startRush() {
    rush = { left: 120, solved: 0, words: [], startedAt: Date.now() };
    begin({ mode: 'rush', L: 5, answer: pickNew(ANS[5]), guesses: [], status: 'playing', hard: false, reveals: [] });
    clearInterval(rushTimer);
    let last = performance.now();
    rushTimer = setInterval(() => {
      const now = performance.now(), dt = (now - last) / 1000; last = now;
      if (!rush || document.hidden || $('play').hidden || G.mode !== 'rush' || G.status !== 'playing' && !busy) { if (G && G.mode !== 'rush') clearInterval(rushTimer); return; }
      rush.left = Math.max(0, rush.left - dt);
      paintRush();
      if (rush.left <= 0) endRush();
    }, 100);
    rushReset = () => { last = performance.now(); };
  }
  let rushReset = () => {};
  document.addEventListener('visibilitychange', () => rushReset());
  function pickNew(list) { let a; do a = Curio.pick(list); while (G && a === G.answer && list.length > 1); return a; }

  const kbEl = $('kb'), boardEl = $('board');
  function buildKeyboard() {
    kbEl.innerHTML = ''; keys = {};
    ['qwertyuiop', ' asdfghjkl ', '>zxcvbnm<'].forEach((line) => {
      const row = document.createElement('div'); row.className = 'wg-kbrow';
      for (const ch of line) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'wg-key';
        if (ch === ' ') { b.className = 'wg-key spacer'; b.tabIndex = -1; b.setAttribute('aria-hidden', 'true'); }
        else if (ch === '>') { b.textContent = 'Enter'; b.classList.add('wide'); b.dataset.k = 'Enter'; }
        else if (ch === '<') { b.textContent = '⌫'; b.classList.add('wide'); b.dataset.k = 'Backspace'; b.setAttribute('aria-label', 'Delete'); b.style.fontSize = '20px'; }
        else { b.textContent = ch; b.dataset.k = ch; keys[ch] = b; }
        row.append(b);
      }
      kbEl.append(row);
    });
  }
  function buildBoard() {
    boardEl.style.setProperty('--L', G.L);
    boardEl.innerHTML = ''; tiles = [];
    for (let r = 0; r < ROWS; r++) {
      const row = document.createElement('div'); row.className = 'wg-row'; row.setAttribute('role', 'row');
      tiles.push([]);
      for (let c = 0; c < G.L; c++) { const t = document.createElement('div'); t.className = 'wg-tile'; t.setAttribute('role', 'gridcell'); row.append(t); tiles[r].push(t); }
      boardEl.append(row);
    }
  }
  function begin(g) {
    G = g; cur = ''; busy = false;
    if (G.mode !== 'rush') { clearInterval(rushTimer); rush = rush && G.mode === 'rush' ? rush : null; }
    show('play');
    $('root').dataset.pal = S.pal;
    $('result').hidden = true;
    buildBoard(); buildKeyboard(); paintAll(); save();
  }
  function label() {
    const h = G.hard ? ' · hard' : '';
    if (G.mode === 'daily') return `Daily #${dayNumber() + 1} · ${G.L} letters${h}`;
    if (G.mode === 'endless') return `Endless · ${G.L} letters${h}`;
    if (G.mode === 'theme') return `${X.themes[G.theme].icon} ${X.themes[G.theme].name}${h}`;
    return 'Rush';
  }
  function paintAll() {
    for (let r = 0; r < ROWS; r++) {
      const g = G.guesses[r], res = g ? score(g, G.answer) : null;
      for (let c = 0; c < G.L; c++) {
        const t = tiles[r][c];
        t.className = 'wg-tile' + (g ? ' ' + res[c] : '');
        t.textContent = g ? g[c] : '';
        t.setAttribute('aria-label', g ? `${g[c]}, ${{ hit: 'correct', near: 'wrong spot', miss: 'not in word' }[res[c]]}` : 'empty');
      }
    }
    paintCurrent(); paintKeys();
    $('label').textContent = label();
    $('rushHud').hidden = G.mode !== 'rush';
    $('skipBtn').hidden = G.mode === 'daily' || G.mode === 'rush';
    $('hintBtn').hidden = G.mode === 'daily';
    $('hintBtn').disabled = G.status !== 'playing' || (G.reveals || []).length >= Math.max(1, G.L - 3);
    $('reveals').innerHTML = (G.reveals || []).map((i) => `<span>Letter ${i + 1} is ${G.answer[i].toUpperCase()}</span>`).join('') + (G.mode === 'theme' ? `<span>Theme: ${X.themes[G.theme].name}</span>` : '');
    if (G.mode === 'rush') paintRush();
  }
  function paintRush() {
    if (!rush) return;
    const s = Math.ceil(rush.left), el = $('rushTime');
    el.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    el.classList.toggle('low', rush.left < 15);
    $('rushScore').textContent = `${rush.solved} solved`;
  }
  function paintKeys() {
    const rank = { miss: 1, near: 2, hit: 3 }, best = {};
    for (const g of G.guesses) score(g, G.answer).forEach((s, i) => { if (!best[g[i]] || rank[s] > rank[best[g[i]]]) best[g[i]] = s; });
    for (const [ch, b] of Object.entries(keys)) { b.className = 'wg-key' + (best[ch] ? ' ' + best[ch] : ''); b.setAttribute('aria-label', ch + (best[ch] ? `, ${{ hit: 'correct', near: 'in word', miss: 'not in word' }[best[ch]]}` : '')); }
  }
  function paintCurrent() {
    const r = G.guesses.length; if (r >= ROWS || G.status !== 'playing') return;
    for (let c = 0; c < G.L; c++) {
      const t = tiles[r][c], rv = (G.reveals || []).includes(c);
      t.textContent = cur[c] || (rv ? G.answer[c] : '');
      t.className = 'wg-tile' + (cur[c] ? ' full' : rv ? ' ghost' : '') + (rv ? ' hinted' : '');
    }
  }

  function press(k) {
    if (busy || !G || G.status !== 'playing' || document.querySelector('.curio-modal') || $('play').hidden) return;
    const kb = k === 'Enter' || k === 'Backspace' ? kbEl.querySelector(`[data-k="${k}"]`) : keys[k];
    if (kb) { kb.classList.add('press'); setTimeout(() => kb.classList.remove('press'), 90); }
    if (k === 'Enter') return submit();
    if (k === 'Backspace') { if (cur) { cur = cur.slice(0, -1); SFX.del(); paintCurrent(); } return; }
    if (/^[a-z]$/.test(k) && cur.length < G.L) { cur += k; paintCurrent(); SFX.key(); }
  }
  function reject(msg) {
    const row = boardEl.children[G.guesses.length];
    row.classList.remove('shake'); void row.offsetWidth; row.classList.add('shake');
    Curio.toast(msg); SFX.bad(); buzz(50);
  }
  function submit() {
    if (cur.length < G.L) return reject('Not enough letters');
    if (!valid(cur) && cur !== G.answer) return reject('Not in word list');
    if (G.hard) { const m = hardCheck(cur); if (m) return reject(m); }
    const r = G.guesses.length, guess = cur, res = score(guess, G.answer);
    G.guesses.push(guess); cur = '';
    busy = true;
    res.forEach((s, c) => {
      const t = tiles[r][c];
      setTimeout(() => {
        t.classList.remove('full', 'ghost', 'hinted'); t.classList.add('flip');
        setTimeout(() => { t.className = `wg-tile flip ${s}`; t.textContent = guess[c]; SFX.flip(s, c); }, 250);
      }, c * FLIP);
    });
    const done = guess === G.answer ? 'won' : G.guesses.length === ROWS ? 'lost' : 'playing';
    G.status = done; save();
    $('live').textContent = `${guess}: ${res.map((s) => ({ hit: 'green', near: 'yellow', miss: 'grey' }[s])).join(', ')}`;
    setTimeout(() => {
      busy = false; paintKeys();
      if (done !== 'playing') finish(done);
      else { paintCurrent(); $('hintBtn').disabled = (G.reveals || []).length >= Math.max(1, G.L - 3); }
    }, (G.L - 1) * FLIP + 560);
  }

  function burstFrom(el, n = 14) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = el.getBoundingClientRect();
    for (let k = 0; k < n; k++) {
      const p = document.createElement('i');
      p.style.cssText = `position:fixed;left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;width:8px;height:8px;border-radius:2px;z-index:1400;pointer-events:none;background:${['var(--hit)', 'var(--near)', '#fff'][k % 3]}`;
      document.body.append(p);
      const a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 60;
      p.animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d + 40}px) rotate(${Math.random() * 400}deg) scale(0)`, opacity: 0 }], { duration: 700 + Math.random() * 300, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => p.remove();
    }
  }

  function statKey() { return G.mode === 'daily' ? `d${G.L}` : G.mode === 'endless' ? `e${G.L}` : G.mode === 'theme' ? 't' : null; }
  function finish(result) {
    const sk = statKey();
    if (sk) {
      const st = (S.stats[sk] ||= { played: 0, wins: 0, streak: 0, max: 0, dist: [0, 0, 0, 0, 0, 0] });
      st.played++;
      if (result === 'won') { st.wins++; st.streak++; st.max = Math.max(st.max, st.streak); st.dist[G.guesses.length - 1]++; }
      else st.streak = 0;
      if (sk.startsWith('e') && st.streak >= 5) unlock('streak5');
    }
    if (result === 'won') {
      S.wins++;
      unlock('first');
      if (G.guesses.length === 1) unlock('ace');
      if (G.guesses.length <= 2) unlock('two');
      if (G.guesses.length === ROWS) unlock('clutch');
      if (G.hard) unlock('hard');
      if (G.L === 4) unlock('four');
      if (G.L === 6) { unlock('six'); if (!(G.reveals || []).length) unlock('nohint'); }
      if (G.mode === 'daily') { unlock('daily'); if ([4, 5, 6].every((L) => S.daily[`${L}:${todayKey()}`]?.status === 'won')) unlock('triple'); }
      if (G.mode === 'theme') {
        const list = (S.themes[G.theme] ||= []); if (!list.includes(G.answer)) list.push(G.answer);
        S.themeWins++; if (S.themeWins >= 10) unlock('theme10');
        if (X.themes[G.theme].words.every((w) => list.includes(w))) unlock('pack');
      }
      if (S.wins >= 25) unlock('wins25');
      const row = boardEl.children[G.guesses.length - 1];
      [...row.children].forEach((t, i) => { t.classList.remove('flip'); t.style.animationDelay = `${i * 90}ms`; setTimeout(() => burstFrom(t, 6), i * 90 + 150); });
      row.classList.add('dance');
      SFX.win(); buzz([30, 40, 30, 40, 80]);
      if (G.mode !== 'rush') { Curio.toast(PRAISE[G.guesses.length - 1]); Curio.confetti(); }
    } else { SFX.lose(); buzz([100, 50, 100]); }
    save(); paintAll();
    if (G.mode === 'rush') return rushNext(result);
    if (G.mode === 'endless' || G.mode === 'theme') delete S.cur[G.mode === 'endless' ? `e${G.L}` : `t:${G.theme}`];
    save();
    setTimeout(() => showResult(result), result === 'won' ? 1500 : 900);
  }

  function rushNext(result) {
    if (result === 'won') { rush.solved++; rush.left += 15; rush.words.push(G.answer); Curio.toast(`+15 seconds! ${rush.solved} solved`); }
    else { Curio.toast(`It was ${G.answer.toUpperCase()}`, 1600); rush.left = Math.max(0, rush.left - 0); }
    paintRush();
    setTimeout(() => { if (!rush || rush.left <= 0) return; begin({ mode: 'rush', L: 5, answer: pickNew(ANS[5]), guesses: [], status: 'playing', hard: false, reveals: [] }); }, result === 'won' ? 1100 : 1500);
  }
  function endRush() {
    if (!rush) return;
    clearInterval(rushTimer);
    const r = rush; rush = null;
    G.status = 'over'; busy = false;
    const isBest = r.solved > S.rushBest;
    if (isBest) S.rushBest = r.solved;
    if (r.solved >= 5) unlock('rush5');
    if (r.solved >= 10) unlock('rush10');
    save();
    SFX.tone(220, 0.5, 'square', 0.05); SFX.tone(165, 0.6, 'square', 0.05, 0.25);
    if (r.solved) Curio.confetti(40 + r.solved * 10);
    const box = $('result');
    box.innerHTML = `<div class="wg-rcard" role="dialog" aria-label="Rush over"><h3>Time!</h3><p>${r.solved ? `You solved ${r.solved} word${r.solved > 1 ? 's' : ''}.` : 'No words this time. The clock is cruel.'}${isBest && r.solved ? ' New record!' : ` Best: ${S.rushBest}.`}</p>
      ${G.guesses.length && G.answer ? `<p>The last word was <b>${G.answer.toUpperCase()}</b>.</p>` : ''}
      <div class="ans">${r.words.slice(-8).map((w) => `<span style="font-weight:900;padding:2px 6px;border-radius:6px;background:var(--hit);color:#fff;text-transform:uppercase;font-size:12px">${w}</span>`).join('')}</div>
      <div class="c-row"><button class="c-btn" type="button" data-a="rush">Go again</button><button class="c-btn c-btn--ghost" type="button" data-a="share">Share</button><button class="c-btn c-btn--ghost" type="button" data-a="menu">Menu</button></div></div>`;
    box.hidden = false;
    box.onclick = async (e) => {
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'rush') startRush();
      else if (a === 'menu') { show('home'); paintHome(); }
      else if (a === 'share') copy(`Zoble Word Guess · Rush\n⏱️ ${r.solved} words in one rush${isBest ? ' (personal best)' : ''}`);
    };
    box.querySelector('[data-a="rush"]').focus({ preventScroll: true });
  }

  async function copy(text) { try { await navigator.clipboard.writeText(text); Curio.toast('Copied to clipboard'); } catch { Curio.toast('Could not copy'); } }
  function emojiGrid() {
    const map = { hit: { classic: '🟩', ocean: '🟩', candy: '🟪', contrast: '🟧' }[S.pal], near: { classic: '🟨', ocean: '🟨', candy: '🟦', contrast: '🟦' }[S.pal], miss: '⬛' };
    return G.guesses.map((g) => score(g, G.answer).map((s) => map[s]).join('')).join('\n');
  }

  function showResult(result) {
    const sk = statKey(), st = sk ? S.stats[sk] : null;
    const box = $('result');
    const won = result === 'won';
    const pct = st && st.played ? Math.round(st.wins / st.played * 100) : 0;
    const max = st ? Math.max(1, ...st.dist) : 1;
    const dist = st ? st.dist.map((n, i) => `<div>${i + 1}<i class="${won && G.guesses.length === i + 1 ? 'cur' : ''}" style="width:${Math.max(8, n / max * 100)}%;animation-delay:${i * 60}ms">${n}</i></div>`).join('') : '';
    const next = G.mode === 'daily' && !Curio.simple ? ([4, 5, 6].find((L) => S.daily[`${L}:${todayKey()}`]?.status !== 'won' && S.daily[`${L}:${todayKey()}`]?.status !== 'lost') || null) : null;
    box.innerHTML = `<div class="wg-rcard" role="dialog" aria-label="Game over"><h3>${won ? `${PRAISE[G.guesses.length - 1]}!` : 'So close.'}</h3>
      <div class="ans ${won ? '' : 'lost'}">${G.answer.split('').map((c, i) => `<b style="animation-delay:${i * 90}ms">${c}</b>`).join('')}</div>
      ${st ? `<div class="wg-rstats"><div><b>${st.played}</b><span>Played</span></div><div><b>${pct}</b><span>Win %</span></div><div><b>${st.streak}</b><span>Streak</span></div><div><b>${st.max}</b><span>Best</span></div></div><div class="wg-dist">${dist}</div>` : ''}
      <div class="c-row">${G.mode === 'daily' ? (next ? `<button class="c-btn" type="button" data-a="daily" data-l="${next}">Daily ${next} letters</button>` : `<button class="c-btn" type="button" data-a="endless">Play endless</button>`) : `<button class="c-btn" type="button" data-a="next">Next word</button>`}<button class="c-btn c-btn--ghost" type="button" data-a="share">Share</button><button class="c-btn c-btn--ghost" type="button" data-a="menu">Menu</button></div></div>`;
    box.hidden = false;
    box.querySelector('.c-btn').focus({ preventScroll: true });
    box.onclick = (e) => {
      const b = e.target.closest('[data-a]'); const a = b?.dataset.a;
      if (a === 'next') { if (G.mode === 'theme') startTheme(G.theme); else startEndless(G.L); }
      else if (a === 'daily') startDaily(+b.dataset.l);
      else if (a === 'endless') startEndless(G.L);
      else if (a === 'menu') { if (Curio.simple) startEndless(5); else { show('home'); paintHome(); } }
      else if (a === 'share') {
        const head = G.mode === 'daily' ? `Daily #${dayNumber() + 1} (${G.L} letters)` : G.mode === 'theme' ? `${X.themes[G.theme].name} pack` : `Endless, ${G.L} letters`;
        copy(`Zoble Word Guess · ${head}${G.hard ? ' · hard' : ''}\n${won ? G.guesses.length : 'X'}/${ROWS}\n\n${emojiGrid()}`);
      }
    };
  }

  function hint() {
    if (!G || G.status !== 'playing' || busy || G.mode === 'daily') return;
    const known = new Set(G.reveals || []);
    G.guesses.forEach((g) => score(g, G.answer).forEach((s, i) => { if (s === 'hit') known.add(i); }));
    const opts = [...Array(G.L).keys()].filter((i) => !known.has(i));
    if (!opts.length || (G.reveals || []).length >= Math.max(1, G.L - 3)) { Curio.toast('No more hints for this word'); return; }
    const i = Curio.pick(opts);
    (G.reveals ||= []).push(i);
    if (G.mode === 'rush' && rush) { rush.left = Math.max(1, rush.left - 10); Curio.toast('-10 seconds for the hint'); }
    SFX.tone(990, 0.12, 'sine', 0.07); SFX.tone(1480, 0.16, 'sine', 0.05, 0.08);
    save(); paintAll();
  }
  async function skip() {
    if (busy || !G) return;
    if (G.status === 'playing' && G.guesses.length) {
      const v = await Curio.modal({ emoji: '🏳️', title: 'Give up on this one?', body: 'It counts as a loss, and you will see the word.', buttons: [{ label: 'Give up', value: 'y' }, { label: 'Keep trying', value: 'n' }] });
      if (v !== 'y') return;
      G.status = 'lost'; finish('lost'); return;
    }
    if (G.mode === 'theme') { delete S.cur[`t:${G.theme}`]; startTheme(G.theme); }
    else { delete S.cur[`e${G.L}`]; startEndless(G.L); }
  }

  addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || $('play').hidden) return;
    if (document.activeElement && document.activeElement.closest('.wg-result, .curio-modal')) return;
    if (e.key === 'Enter' || e.key === 'Backspace') { if (document.activeElement && document.activeElement.closest('.wg-bar')) document.activeElement.blur(); e.preventDefault(); press(e.key); }
    else if (/^[a-zA-Z]$/.test(e.key)) press(e.key.toLowerCase());
    else if (e.key === 'Escape') { if ((G.mode === 'rush' && rush) || Curio.simple) return; show('home'); paintHome(); }
  });
  kbEl.addEventListener('click', (e) => { const b = e.target.closest('[data-k]'); if (b) { press(b.dataset.k); b.blur(); } });
  $('backBtn').addEventListener('click', async () => {
    if (G && G.mode === 'rush' && rush) {
      const v = await Curio.modal({ emoji: '⏱️', title: 'End the rush?', body: 'Your score so far will be counted.', buttons: [{ label: 'End it', value: 'y' }, { label: 'Keep going', value: 'n' }] });
      if (v !== 'y') return; endRush(); return;
    }
    show('home'); paintHome();
  });
  $('hintBtn').addEventListener('click', (e) => { e.currentTarget.blur(); hint(); });
  $('skipBtn').addEventListener('click', (e) => { e.currentTarget.blur(); skip(); });

  $('howBtn').addEventListener('click', () => {
    const box = document.createElement('div'); box.className = 'wg-how';
    box.innerHTML = `<p style="margin:0">Guess the hidden word in six tries. Each guess must be a real word. After each guess the tiles change colour:</p>
      <div><div class="ex"><b class="hit">c</b><b>r</b><b>a</b><b>n</b><b>e</b></div><span>C is in the word and in the right spot.</span></div>
      <div><div class="ex"><b>p</b><b class="near">i</b><b>l</b><b>o</b><b>t</b></div><span>I is in the word, but somewhere else.</span></div>
      <div><div class="ex"><b>v</b><b>a</b><b>g</b><b class="miss">u</b><b>e</b></div><span>U is not in the word at all.</span></div>
      <p style="margin:0"><b>Hard mode:</b> any letter you have found must appear in later guesses, and green letters must stay put. <b>Rush:</b> two minutes, plus 15 seconds per solve. <b>Hints</b> reveal one letter (not in dailies). Type on your keyboard or tap the keys.</p>`;
    Curio.modal({ emoji: '📖', title: 'How to play', body: box, buttons: [{ label: 'Got it', value: 'x' }] });
  });
  $('statsBtn').addEventListener('click', () => {
    const box = document.createElement('div');
    const rows = [['d4', 'Daily 4'], ['d5', 'Daily 5'], ['d6', 'Daily 6'], ['e4', 'Endless 4'], ['e5', 'Endless 5'], ['e6', 'Endless 6'], ['t', 'Themes']].filter(([k]) => S.stats[k]);
    box.innerHTML = rows.length ? `<table class="wg-stab"><tr><th>Mode</th><th>Played</th><th>Win %</th><th>Streak</th><th>Best</th></tr>${rows.map(([k, n]) => { const s = S.stats[k]; return `<tr><td>${n}</td><td>${s.played}</td><td>${s.played ? Math.round(s.wins / s.played * 100) : 0}</td><td>${s.streak}</td><td>${s.max}</td></tr>`; }).join('')}</table><p style="margin:10px 0 0">Rush record: ${S.rushBest} words</p>` : '<p>No games yet. Pick a word, any word.</p>';
    Curio.modal({ emoji: '📊', title: 'Your stats', body: box, buttons: [{ label: 'Close', value: 'x' }] });
  });
  $('trophyBtn').addEventListener('click', () => {
    const box = document.createElement('div'); box.className = 'wg-list';
    for (const a of ACH) { const d = document.createElement('div'); d.className = S.ach[a.id] ? '' : 'locked'; d.innerHTML = `<i>${a.icon}</i><div><b></b><span></span></div>`; d.querySelector('b').textContent = a.name; d.querySelector('span').textContent = a.desc; box.append(d); }
    Curio.modal({ emoji: '🏆', title: `Trophies ${Object.keys(S.ach).length}/${ACH.length}`, body: box, buttons: [{ label: 'Close', value: 'x' }] });
  });

  buildFloat();
  paintHome();
  if (Curio.simple) { const d = S.daily[`5:${todayKey()}`]; if (d && d.status !== 'playing' && d.answer === dailyWord(5)) startEndless(5); else startDaily(5); }
  window.__wg = { score, valid, get answer() { return G && G.answer; }, press, get G() { return G; }, startDaily, startEndless, startTheme, startRush, get rush() { return rush; }, counts: { a4: ANS[4].length, a5: ANS[5].length, a6: ANS[6].length } };
})();
