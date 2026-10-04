(() => {
  const { PICS, render } = window.SLIDE_ART, SV = window.SlideSolver;
  const $ = (id) => document.getElementById(id);
  const KEY = 'slide:v2', VER = 2;
  const SETS = ['Wild', 'Places', 'Cosmos', 'Cozy'];
  const SKINS = { wood: ['Wood', 'linear-gradient(160deg,#e7b77c,#c98c4b)', '#5b3415'], candy: ['Candy', 'linear-gradient(160deg,#ff8ac0,#ff4f9a)', '#fff'], neon: ['Neon', '#120f24', '#7df9ff'], paper: ['Paper', '#fffdf5', '#2b3a67'] };
  const MULT = { 4: 2.1, 5: 2.6, 6: 3 };
  const ACH = [
    { id: 'first', icon: '🧩', name: 'First slide', desc: 'Solve any puzzle.' },
    { id: 'three', icon: '⭐', name: 'Star turn', desc: 'Earn three stars on a puzzle.' },
    { id: 'n4', icon: '4️⃣', name: 'Fifteen', desc: 'Solve a 4×4 board, the classic 15 puzzle.' },
    { id: 'n5', icon: '5️⃣', name: 'Twenty-four', desc: 'Solve a 5×5 board.' },
    { id: 'n6', icon: '6️⃣', name: 'Thirty-five', desc: 'Solve a 6×6 board.' },
    { id: 'quick', icon: '⚡', name: 'Quick fingers', desc: 'Solve a 3×3 in under 30 seconds.' },
    { id: 'set', icon: '🖼️', name: 'Full set', desc: 'Solve all four pictures in one set.' },
    { id: 'collector', icon: '🏛️', name: 'Curator', desc: 'Solve all sixteen pictures.' },
    { id: 'starry', icon: '🌌', name: 'Starry gallery', desc: 'Three stars on eight different pictures.' },
    { id: 'daily', icon: '📅', name: 'Daily slider', desc: 'Solve a daily puzzle.' },
    { id: 'streak3', icon: '🔥', name: 'Three in a row', desc: 'Solve the daily three days running.' },
    { id: 'skins', icon: '🎨', name: 'Material world', desc: 'Solve a number board in all four styles.' },
    { id: 'pure', icon: '🧘', name: 'No peeking', desc: 'Solve 5×5 or bigger with no hints, peeks or undos.' },
    { id: 'robot', icon: '🤖', name: 'Lazy genius', desc: 'Watch the robot solve a puzzle.' },
    { id: 'twenty', icon: '🏆', name: 'Twenty solved', desc: 'Solve 20 puzzles.' }
  ];

  function load() {
    const base = { v: VER, n: 4, nums: false, skin: 'wood', pics: {}, numsBest: {}, skinsDone: [], daily: {}, ach: {}, solved: 0, cur: null };
    const d = Curio.store.get(KEY, null);
    if (!d || typeof d !== 'object' || d.v !== VER) { const oldN = Curio.store.get('slide:n', 4); if ([3, 4, 5].includes(oldN)) base.n = oldN; return base; }
    const s = Object.assign(base, d);
    if (![3, 4, 5, 6].includes(s.n)) s.n = 4;
    if (!SKINS[s.skin]) s.skin = 'wood';
    for (const k of ['pics', 'numsBest', 'daily', 'ach']) if (!s[k] || typeof s[k] !== 'object') s[k] = {};
    if (!Array.isArray(s.skinsDone)) s.skinsDone = [];
    if (s.cur && !(Array.isArray(s.cur.t) && s.cur.t.length === s.cur.n * s.cur.n)) s.cur = null;
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
    noise(d = 0.06, vol = 0.08, freq = 900, when = 0) {
      const ac = this.ac(); if (!ac) return;
      const len = Math.ceil(ac.sampleRate * d), buf = ac.createBuffer(1, len, ac.sampleRate), ch = buf.getChannelData(0);
      for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
      src.buffer = buf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 0.8; g.gain.value = vol;
      src.connect(f).connect(g).connect(ac.destination); src.start(ac.currentTime + when);
    },
    slide(k = 1) { for (let i = 0; i < Math.min(k, 4); i++) { this.noise(0.07, 0.1, S.nums && !G.pic ? 1400 : 700 + Math.random() * 300, i * 0.035); } this.tone(180 + Math.random() * 40, 0.05, 'triangle', 0.05, 0.05); },
    home(i) { this.tone(880 + i * 30, 0.08, 'sine', 0.04); },
    bump() { this.tone(110, 0.06, 'square', 0.03); },
    win() { [392, 523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.24, 'triangle', 0.08, i * 0.09)); [1319, 1568].forEach((f, i) => this.tone(f, 0.5, 'sine', 0.04, 0.5 + i * 0.12)); },
    star(i) { this.tone(1046 + i * 262, 0.2, 'sine', 0.07); },
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

  const fmtT = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const dayKey = (d = new Date()) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  const dayNum = () => { const d = new Date(); return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000); };
  const dailyPic = () => PICS[dayNum() % PICS.length];
  function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const inversions = (arr) => { let n = 0; const a = arr.filter((v) => v); for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) if (a[i] > a[j]) n++; return n; };
  function shuffled(n, r = Math.random) {
    let a;
    do {
      a = Array.from({ length: n * n - 1 }, (_, i) => i + 1);
      for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
      if (inversions(a) % 2) [a[0], a[1]] = [a[1], a[0]];
      a.push(0);
    } while (a.every((v, i) => v === (i + 1) % (n * n)) || SV.heur(a, n) < n * 2);
    return a;
  }
  function streak() { let k = 0; const d = new Date(); if (!S.daily[dayKey(d)]) d.setDate(d.getDate() - 1); while (S.daily[dayKey(d)]) { k++; d.setDate(d.getDate() - 1); } return k; }

  function heroTiles() {
    const el = $('heroTiles'), url = render('balloons', 300);
    let h = '';
    for (let i = 0; i < 8; i++) {
      const r = Math.floor(i / 3), c = i % 3;
      const cls = i === 7 ? 'mv' : i === 4 ? 'mv2' : '';
      h += `<i class="${cls}" style="left:calc(6px + ${c} * (100% - 12px + 4px) / 3);top:calc(6px + ${r} * (100% - 12px + 4px) / 3);background-image:url(${url});background-position:${c * 50}% ${r * 50}%"></i>`;
    }
    el.innerHTML = h;
  }
  function starStr(n) { return '★'.repeat(n) + `<i>${'★'.repeat(3 - n)}</i>`; }
  function paintHome() {
    $('sizes').innerHTML = [3, 4, 5, 6].map((n) => `<button type="button" role="radio" aria-checked="${n === S.n}" data-n="${n}">${n}×${n}</button>`).join('');
    $('numsBox').checked = S.nums;
    $('skins').innerHTML = Object.entries(SKINS).map(([k, s]) => `<button type="button" class="sp-skin" role="radio" aria-checked="${k === S.skin}" data-skin="${k}" title="${s[0]}" aria-label="${s[0]} tiles" style="background:${s[1]};color:${s[2]}">7</button>`).join('');
    const dp = dailyPic(), dd = S.daily[dayKey()];
    $('daily').innerHTML = `<img src="${render(dp.id, 240)}" alt="Today's picture: ${dp.name}"><div><h3>Daily puzzle</h3><p>${dp.name} · 4×4 · same shuffle for everyone today${dd ? `<br>Solved in ${dd.moves} moves, ${fmtT(dd.time)}` : ''}</p><button class="c-btn" type="button" id="dailyBtn">${dd ? 'Play again' : 'Play today\'s'}</button></div>${streak() ? `<span class="tag">🔥 ${streak()}</span>` : ''}`;
    $('dailyBtn').onclick = () => start({ pic: dp.id, n: 4, daily: dayKey() });
    const c = S.cur;
    $('cont').hidden = !c;
    if (c) {
      $('cont').innerHTML = `${c.pic ? `<img src="${render(c.pic, 120)}" alt="">` : ''}<div><b>Continue</b><span>${c.pic ? PICS.find((p) => p.id === c.pic)?.name : 'Number board'} · ${c.n}×${c.n} · ${c.moves} moves</span></div><button class="c-btn c-btn--ghost" type="button" id="contBtn">Resume ▶</button>`;
      $('contBtn').onclick = () => resume();
    }
    $('gallery').innerHTML = SETS.map((set) => {
      const pics = PICS.filter((p) => p.set === set);
      const done = pics.filter((p) => S.pics[p.id]).length;
      return `<section class="sp-set"><h2><span>${set}</span><span>${done}/${pics.length} solved</span></h2><div class="sp-pics">${pics.map((p) => {
        const rec = S.pics[p.id] && S.pics[p.id][S.n];
        return `<button type="button" class="sp-pic ${S.pics[p.id] ? '' : 'fresh'}" data-pic="${p.id}"><img src="${render(p.id, 300)}" alt="${p.name}" loading="lazy"><span class="grid" style="background-size:${100 / S.n}% ${100 / S.n}%"></span><span class="meta"><b>${p.name}</b><span class="st" aria-label="${rec ? rec.stars : 0} stars">${starStr(rec ? rec.stars : 0)}</span></span></button>`;
      }).join('')}</div></section>`;
    }).join('');
    $('trophyN').textContent = `${Object.keys(S.ach).length}/${ACH.length}`;
    heroTiles();
  }
  $('sizes').addEventListener('click', (e) => { const b = e.target.closest('[data-n]'); if (!b) return; S.n = +b.dataset.n; save(); SFX.tone(600 + S.n * 60, 0.05); paintHome(); $('sizes').querySelector(`[data-n="${S.n}"]`).focus(); });
  $('numsBox').addEventListener('change', () => { S.nums = $('numsBox').checked; save(); SFX.tone(700, 0.05); });
  $('skins').addEventListener('click', (e) => { const b = e.target.closest('[data-skin]'); if (!b) return; S.skin = b.dataset.skin; save(); SFX.slide(1); paintHome(); });
  $('gallery').addEventListener('click', (e) => { const b = e.target.closest('[data-pic]'); if (b) start({ pic: b.dataset.pic, n: S.n }); });
  $('numPlay').addEventListener('click', () => start({ pic: null, n: S.n }));

  let G = null, tileEls = [], timer = 0, last = 0, plan = null, solving = false, peeking = false;
  const boardEl = $('board'), innerEl = $('inner');

  function show(w) { $('home').hidden = w !== 'home'; $('play').hidden = w !== 'play'; scrollTo({ top: 0 }); }
  function start({ pic, n, daily = null }) {
    const r = daily ? rng(dayNum() * 2654435761) : Math.random;
    const t = shuffled(n, r);
    let par;
    if (n === 3) { const p = SV.idaStar(t, 3); par = Math.ceil((p ? p.length : 24) * 1.25); }
    else par = Math.round(SV.heur(t, n) * MULT[n]);
    G = { pic, n, t, skin: pic ? null : S.skin, moves: 0, elapsed: 0, started: false, daily, par, hist: [], assisted: false, helped: false, solved: false };
    S.cur = G; save();
    show('play'); setup();
  }
  function resume() { G = S.cur; G.hist = G.hist || []; G.started = G.moves > 0; show('play'); setup(); }
  function setup() {
    plan = null; solving = false;
    $('result').hidden = true; $('peek').classList.remove('done', 'on');
    const n = G.n;
    boardEl.style.setProperty('--n', n);
    boardEl.className = `sp-board ${G.pic ? 'pic' : `skin-${G.skin}`}${G.pic && S.nums ? ' shownums' : ''}`;
    if (G.pic) { const url = render(G.pic, n >= 5 ? 900 : 720); boardEl.style.setProperty('--img', `url(${url})`); $('peek').style.setProperty('--img', `url(${url})`); }
    innerEl.innerHTML = ''; tileEls = [null];
    for (let v = 1; v < n * n; v++) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'sp-tile'; b.dataset.v = v;
      const hr = Math.floor((v - 1) / n), hc = (v - 1) % n;
      b.style.backgroundPosition = `${hc / (n - 1) * 100}% ${hr / (n - 1) * 100}%`;
      b.style.setProperty('--hue', Math.round((v - 1) / (n * n - 1) * 300));
      b.innerHTML = `<span class="nm">${v}</span>`;
      innerEl.append(b); tileEls.push(b);
    }
    $('chip').textContent = `${G.daily ? 'Daily · ' : ''}${G.pic ? PICS.find((p) => p.id === G.pic).name : `${SKINS[G.skin][0]} numbers`} · ${n}×${n}`;
    $('peekBtn').disabled = !G.pic; $('numBtn').disabled = !G.pic;
    $('numBtn').setAttribute('aria-pressed', String(!!(G.pic && S.nums)));
    $('solveBtn').disabled = false;
    paint(); hud();
    last = performance.now();
  }
  function paint(flashHome = -1) {
    const n = G.n;
    for (let v = 1; v < n * n; v++) {
      const el = tileEls[v], p = G.t.indexOf(v), r = Math.floor(p / n), c = p % n;
      el.style.setProperty('--r', r); el.style.setProperty('--c', c);
      const home = p === v - 1;
      if (home && flashHome === v && !el.classList.contains('home')) { el.classList.remove('home-flash'); void el.offsetWidth; el.classList.add('home-flash'); SFX.home(v % 8); }
      el.classList.toggle('home', home);
      el.setAttribute('aria-label', `Tile ${v}${home ? ', in place' : ''}, row ${r + 1}, column ${c + 1}`);
    }
  }
  function hud(bump) {
    $('moves').textContent = G.moves; $('time').textContent = fmtT(G.elapsed); $('par').textContent = G.par;
    if (bump) { const m = $('moves'); m.classList.remove('bump'); void m.offsetWidth; m.classList.add('bump'); }
    $('undoBtn').disabled = !G.hist.length || G.solved || solving;
    $('hintBtn').disabled = G.solved || solving;
    $('shuffleBtn').disabled = solving;
  }

  function stepTo(cell) {
    const z = G.t.indexOf(0);
    const v = G.t[cell]; G.t[z] = v; G.t[cell] = 0;
    return v;
  }
  function slideFrom(cell, fromUser = true) {
    if (!G || G.solved || (solving && fromUser) || peeking) return false;
    const n = G.n, z = G.t.indexOf(0);
    if (cell === z) return false;
    const br = Math.floor(z / n), bc = z % n, r = Math.floor(cell / n), c = cell % n;
    if (r !== br && c !== bc) { SFX.bump(); const el = tileEls[G.t[cell]]; el?.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(.7)' }, { filter: 'brightness(1)' }], { duration: 200 }); return false; }
    const step = r === br ? (c > bc ? 1 : -1) : (r > br ? n : -n);
    const steps = [];
    let k = z, moved = [];
    while (k !== cell) { const nx = k + step; steps.push(k); moved.push(stepTo(nx)); k = nx; }
    G.hist.push(steps);
    if (G.hist.length > 500) G.hist.shift();
    G.moves += steps.length;
    if (!G.started) { G.started = true; last = performance.now(); }
    if (plan && fromUser) { if (steps.length === 1 && plan[0] === cell) plan.shift(); else plan = null; }
    boardEl.querySelectorAll('.sp-tile.hint').forEach((e) => e.classList.remove('hint'));
    paint(moved[moved.length - 1]);
    moved.forEach((v) => { if (G.t.indexOf(v) === v - 1) paint(v); });
    hud(true);
    SFX.slide(steps.length); buzz(6);
    persist();
    checkWin();
    return true;
  }
  function push(dr, dc) {
    const z = G.t.indexOf(0), n = G.n, r = Math.floor(z / n) - dr, c = z % n - dc;
    if (r < 0 || r >= n || c < 0 || c >= n) { SFX.bump(); return; }
    slideFrom(r * n + c);
  }
  function undo() {
    if (!G || !G.hist.length || G.solved || solving) return;
    const steps = G.hist.pop();
    for (let i = steps.length - 1; i >= 0; i--) stepTo(steps[i]);
    G.moves = Math.max(0, G.moves - steps.length);
    G.helped = true; plan = null;
    paint(); hud(true); SFX.tone(400, 0.08, 'sine', 0.05, 0, 250); persist();
  }
  function persist() { if (G && !G.solved) { S.cur = G; save(); } }

  function getPlan(cb) {
    if (plan && plan.length) return cb(plan);
    $('hintBtn').disabled = true;
    if (G.n >= 5) Curio.toast('Thinking...', 900);
    setTimeout(() => { plan = SV.solve(G.t.slice(), G.n); $('hintBtn').disabled = false; cb(plan); }, 30);
  }
  function hint() {
    if (!G || G.solved || solving) return;
    G.helped = true;
    getPlan((p) => {
      if (!p || !p.length) { Curio.toast('Too tangled to plan from here. Try finishing the top row first.'); return; }
      const el = tileEls[G.t[p[0]]]; if (!el) return;
      el.classList.remove('hint'); void el.offsetWidth; el.classList.add('hint'); el.focus({ preventScroll: true });
      SFX.tone(990, 0.12, 'triangle', 0.06);
    });
  }
  async function autoSolve() {
    if (!G || G.solved || solving) return;
    const v = await Curio.modal({ emoji: '🤖', title: 'Let the robot solve it?', body: 'You can watch every move, but this round will not earn stars.', buttons: [{ label: 'Solve it', value: 'y' }, { label: 'I\'ll keep going', value: 'n' }] });
    if (v !== 'y') return;
    G.assisted = true;
    getPlan((p) => {
      if (!p) { Curio.toast('The robot got confused. Try again after a few moves.'); return; }
      solving = true; hud();
      const steps = p.slice(); const speed = Math.max(35, Math.min(160, 9000 / steps.length));
      const tick = () => {
        if (!solving || !G || G.solved) return;
        if (document.hidden) { setTimeout(tick, 300); return; }
        const m = steps.shift(); if (m == null) { solving = false; return; }
        slideFrom(m, false);
        if (!G.solved) setTimeout(tick, speed);
      };
      tick();
    });
  }

  function checkWin() {
    for (let i = 0; i < G.t.length - 1; i++) if (G.t[i] !== i + 1) return;
    G.solved = true; solving = false; plan = null;
    const secs = Math.round(G.elapsed);
    S.cur = null;
    const stars = G.assisted ? 0 : G.moves <= G.par ? 3 : G.moves <= G.par * 1.6 ? 2 : 1;
    let isBest = false;
    if (!G.assisted) {
      S.solved++;
      if (G.pic) {
        const rec = ((S.pics[G.pic] ||= {})[G.n] ||= { stars: 0, moves: null, time: null });
        rec.stars = Math.max(rec.stars, stars);
        if (rec.moves == null || G.moves < rec.moves) { rec.moves = G.moves; isBest = true; }
        if (rec.time == null || secs < rec.time) rec.time = secs;
      } else {
        const rec = (S.numsBest[G.n] ||= { moves: null, time: null });
        if (rec.moves == null || G.moves < rec.moves) { rec.moves = G.moves; isBest = true; }
        if (rec.time == null || secs < rec.time) rec.time = secs;
        if (!S.skinsDone.includes(G.skin)) S.skinsDone.push(G.skin);
      }
      if (G.daily && !S.daily[G.daily]) S.daily[G.daily] = { moves: G.moves, time: secs };
      unlock('first');
      if (stars === 3) unlock('three');
      if (G.n >= 4) unlock(`n${G.n}`);
      if (G.n === 3 && secs < 30) unlock('quick');
      if (G.n >= 5 && !G.helped) unlock('pure');
      if (G.daily) { unlock('daily'); if (streak() >= 3) unlock('streak3'); }
      if (SETS.some((set) => PICS.filter((p) => p.set === set).every((p) => S.pics[p.id]))) unlock('set');
      if (PICS.every((p) => S.pics[p.id])) unlock('collector');
      if (PICS.filter((p) => Object.values(S.pics[p.id] || {}).some((r) => r.stars === 3)).length >= 8) unlock('starry');
      if (Object.keys(SKINS).every((k) => S.skinsDone.includes(k))) unlock('skins');
      if (S.solved >= 20) unlock('twenty');
    } else unlock('robot');
    save();
    hud();
    boardEl.classList.add('solved');
    if (G.pic) setTimeout(() => { if (G.solved) $('peek').classList.add('done'); }, 700);
    SFX.win(); buzz([30, 50, 30, 50, 120]);
    setTimeout(() => Curio.confetti(), 700);
    const box = $('result');
    const name = G.pic ? PICS.find((p) => p.id === G.pic).name : `${SKINS[G.skin][0]} numbers`;
    box.innerHTML = `<div class="sp-rcard" role="dialog" aria-label="Solved"><div class="sp-stars">${[0, 1, 2].map((i) => `<span class="${i < stars ? '' : 'off'}" style="animation-delay:${1.4 + i * 0.18}s">★</span>`).join('')}</div>
      ${isBest ? '<span class="new">Personal best</span>' : ''}<h3>${G.assisted ? 'Robot wins!' : Curio.pick(['Solved!', 'Picture perfect!', 'Beautiful!', 'All home!'])}</h3>
      <p>${name}, ${G.n}×${G.n}: ${G.moves} moves in ${fmtT(secs)}. Par was ${G.par}.${G.assisted ? ' No stars for robot help.' : ''}</p>
      <div class="c-row"><button class="c-btn" type="button" data-a="next">${G.pic && !G.daily ? 'Next picture' : 'Play again'}</button><button class="c-btn c-btn--ghost" type="button" data-a="share">Share</button><button class="c-btn c-btn--ghost" type="button" data-a="menu">Gallery</button></div></div>`;
    box.hidden = false;
    if (!G.assisted) [0, 1, 2].forEach((i) => { if (i < stars) setTimeout(() => SFX.star(i), 1400 + i * 180); });
    box.onclick = async (e) => {
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'next') {
        if (G.pic && !G.daily) { const i = PICS.findIndex((p) => p.id === G.pic); const nxt = PICS.slice(i + 1).concat(PICS.slice(0, i + 1)).find((p) => !(S.pics[p.id] && S.pics[p.id][G.n]?.stars === 3)) || PICS[(i + 1) % PICS.length]; start({ pic: nxt.id, n: G.n }); }
        else start({ pic: G.pic, n: G.n });
      } else if (a === 'menu') { show('home'); paintHome(); }
      else if (a === 'share') {
        const text = `Zoble Sliding Puzzle${G.daily ? ` · Daily ${G.daily}` : ''}\n${name} ${G.n}×${G.n}: ${G.moves} moves, ${fmtT(secs)} ${'⭐'.repeat(stars)}`;
        try { await navigator.clipboard.writeText(text); Curio.toast('Result copied'); } catch { Curio.toast('Could not copy'); }
      }
    };
    setTimeout(() => box.querySelector('[data-a="next"]')?.focus({ preventScroll: true }), 1300);
  }

  setInterval(() => {
    const now = performance.now();
    if (G && G.started && !G.solved && !document.hidden && !$('play').hidden) { G.elapsed += (now - last) / 1000; $('time').textContent = fmtT(G.elapsed); }
    last = now;
  }, 250);
  document.addEventListener('visibilitychange', () => { last = performance.now(); if (document.hidden) persist(); });

  let sx = 0, sy = 0, swipedAt = 0;
  Curio.drag(boardEl, {
    start: (p) => { sx = p.clientX; sy = p.clientY; },
    end: (p) => {
      if (!p) return;
      const dx = p.clientX - sx, dy = p.clientY - sy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) > 24) { swipedAt = performance.now(); if (Math.abs(dx) > Math.abs(dy)) push(0, dx > 0 ? 1 : -1); else push(dy > 0 ? 1 : -1, 0); }
    }
  });
  boardEl.addEventListener('click', (e) => {
    if (performance.now() - swipedAt < 400 || e.detail === 0) return;
    const hit = document.elementFromPoint(e.clientX, e.clientY);
    const t = (hit && hit.closest('.sp-tile')) || e.target.closest('.sp-tile');
    if (t && G) slideFrom(G.t.indexOf(+t.dataset.v));
  });
  boardEl.addEventListener('keydown', (e) => { const t = e.target.closest('.sp-tile'); if (t && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); e.stopPropagation(); slideFrom(G.t.indexOf(+t.dataset.v)); } });
  const KEYS = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1], w: [-1, 0], s: [1, 0], a: [0, -1], d: [0, 1] };
  addEventListener('keydown', (e) => {
    if (document.querySelector('.curio-modal') || e.ctrlKey || e.metaKey || $('play').hidden || !G) return;
    const k = KEYS[e.key.length === 1 ? e.key.toLowerCase() : e.key];
    if (k) { e.preventDefault(); push(k[0], k[1]); return; }
    if (e.key === 'u' || e.key === 'U') undo();
    else if (e.key === 'h' || e.key === 'H') hint();
    else if (e.key === ' ' && G.pic && !e.target.closest('button')) { e.preventDefault(); if (!e.repeat) setPeek(true); }
    else if ((e.key === 'p' || e.key === 'P') && G.pic) togglePeek();
    else if (e.key === 'Escape') { persist(); show('home'); paintHome(); }
  });
  addEventListener('keyup', (e) => { if (e.key === ' ' && peeking) setPeek(false); });
  function setPeek(on) { if (!G || !G.pic || G.solved) on = false; if (on && !peeking) G.helped = true; peeking = on; $('peek').classList.toggle('on', on); $('peekBtn').classList.toggle('on', on); }
  let peekT = 0;
  function togglePeek() { clearTimeout(peekT); setPeek(!peeking); if (peeking) peekT = setTimeout(() => setPeek(false), 2500); }
  $('peekBtn').addEventListener('click', togglePeek);
  $('undoBtn').addEventListener('click', undo);
  $('hintBtn').addEventListener('click', hint);
  $('solveBtn').addEventListener('click', autoSolve);
  $('numBtn').addEventListener('click', () => { S.nums = !S.nums; save(); boardEl.classList.toggle('shownums', S.nums); $('numBtn').setAttribute('aria-pressed', String(S.nums)); });
  $('shuffleBtn').addEventListener('click', async () => {
    if (G && !G.solved && G.moves > 5) {
      const v = await Curio.modal({ emoji: '🔀', title: 'Reshuffle?', body: 'This board starts over with a fresh shuffle.', buttons: [{ label: 'Shuffle', value: 'y' }, { label: 'Cancel', value: 'n' }] });
      if (v !== 'y') return;
    }
    solving = false; start({ pic: G.pic, n: G.n, daily: G.daily });
  });
  $('backBtn').addEventListener('click', () => { solving = false; persist(); show('home'); paintHome(); });

  $('howBtn').addEventListener('click', () => {
    const box = document.createElement('div'); box.style.textAlign = 'left';
    box.innerHTML = '<p style="margin:0 0 8px">Put the tiles back in order: on a picture the image becomes whole, on a number board 1 sits top left and the gap ends bottom right.</p><p style="margin:0 0 8px"><b>Moving:</b> tap any tile in the same row or column as the gap and the whole line slides. Swipe on the board, or use the arrow keys.</p><p style="margin:0 0 8px"><b>Stars:</b> beat par for three stars, stay under 1.6 times par for two. Par on 3×3 comes from the perfect solution; bigger boards use an estimate.</p><p style="margin:0"><b>Help:</b> Peek shows the finished picture, Hint flashes a good next tile (planned by a real solver), and the robot can finish the board for you, for zero stars.</p>';
    Curio.modal({ emoji: '📖', title: 'How to play', body: box, buttons: [{ label: 'Got it', value: 'x' }] });
  });
  $('trophyBtn').addEventListener('click', () => {
    const box = document.createElement('div'); box.className = 'sp-list';
    for (const a of ACH) { const d = document.createElement('div'); d.className = S.ach[a.id] ? '' : 'locked'; d.innerHTML = `<i>${a.icon}</i><div><b></b><span></span></div>`; d.querySelector('b').textContent = a.name; d.querySelector('span').textContent = a.desc; box.append(d); }
    Curio.modal({ emoji: '🏆', title: `Trophies ${Object.keys(S.ach).length}/${ACH.length}`, body: box, buttons: [{ label: 'Close', value: 'x' }] });
  });
  $('statsBtn').addEventListener('click', () => {
    const box = document.createElement('div');
    const totStars = PICS.reduce((a, p) => a + Object.values(S.pics[p.id] || {}).reduce((b, r) => b + r.stars, 0), 0);
    let h = `<p style="margin:0 0 8px">${S.solved} puzzles solved · ${totStars} stars · ${PICS.filter((p) => S.pics[p.id]).length}/${PICS.length} pictures</p><table class="sp-stab"><tr><th>Board</th><th>Fewest moves</th><th>Fastest</th></tr>`;
    for (const n of [3, 4, 5, 6]) { const r = S.numsBest[n]; let bm = r?.moves ?? null, bt = r?.time ?? null; for (const p of PICS) { const x = S.pics[p.id]?.[n]; if (x) { if (bm == null || x.moves < bm) bm = x.moves; if (bt == null || x.time < bt) bt = x.time; } } h += `<tr><td>${n}×${n}</td><td>${bm ?? '-'}</td><td>${bt != null ? fmtT(bt) : '-'}</td></tr>`; }
    box.innerHTML = h + '</table>';
    Curio.modal({ emoji: '📊', title: 'Your stats', body: box, buttons: [{ label: 'Close', value: 'x' }] });
  });

  if (matchMedia('(pointer: fine)').matches && !Curio.store.get('slide:tipTouchpad', false)) { Curio.store.set('slide:tipTouchpad', true); setTimeout(() => Curio.toast('Tip: click tiles to slide them. Touchpad mode in the top bar adds click-move-click swipes', 4200), 900); }
  paintHome();
  window.__slide = { get G() { return G; }, slideFrom, push, start, SV, hint, undo, get solving() { return solving; } };
})();
