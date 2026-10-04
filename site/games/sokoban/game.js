'use strict';
const Soko = (() => {
  const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
  function parse(rows) {
    const H = rows.length, W = Math.max(...rows.map((r) => r.length));
    const wall = new Uint8Array(W * H), goal = new Uint8Array(W * H), inside = new Uint8Array(W * H);
    const boxes = []; let player = -1;
    rows.forEach((r, y) => { for (let x = 0; x < W; x++) {
      const ch = r[x] || ' ', i = y * W + x;
      if (ch === '#') wall[i] = 1;
      if (ch === '.' || ch === '*' || ch === '+') goal[i] = 1;
      if (ch === '$' || ch === '*') boxes.push(i);
      if (ch === '@' || ch === '+') player = i;
    } });
    const q = [player]; inside[player] = 1;
    while (q.length) { const u = q.pop(); const x = u % W, y = Math.floor(u / W); for (let d = 0; d < 4; d++) { const xx = x + DX[d], yy = y + DY[d]; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const v = yy * W + xx; if (!wall[v] && !inside[v]) { inside[v] = 1; q.push(v); } } }
    return { W, H, wall, goal, inside, boxes, player };
  }
  function pathTo(L, boxes, from, to) {
    if (from === to) return [];
    const bs = new Set(boxes), prev = new Int32Array(L.W * L.H).fill(-1), pd = new Int8Array(L.W * L.H);
    prev[from] = from;
    const q = [from];
    for (let qi = 0; qi < q.length; qi++) {
      const u = q[qi];
      for (let d = 0; d < 4; d++) {
        const x = u % L.W + DX[d], y = Math.floor(u / L.W) + DY[d];
        if (x < 0 || y < 0 || x >= L.W || y >= L.H) continue;
        const v = y * L.W + x;
        if (prev[v] >= 0 || L.wall[v] || !L.inside[v] || bs.has(v)) continue;
        prev[v] = u; pd[v] = d;
        if (v === to) { const out = []; let c = v; while (c !== from) { out.push(pd[c]); c = prev[c]; } return out.reverse(); }
        q.push(v);
      }
    }
    return null;
  }
  function solve(L, boxes0, player0, limit = 250000) {
    const { W, wall, goal, inside } = L, N = W * L.H;
    const blocked = (i) => wall[i] || !inside[i];
    const live = new Uint8Array(N);
    const st = []; for (let i = 0; i < N; i++) if (goal[i]) { live[i] = 1; st.push(i); }
    while (st.length) { const b = st.pop(); for (let d = 0; d < 4; d++) { const nb = b + DX[d] + DY[d] * W, pl = nb + DX[d] + DY[d] * W; if (nb < 0 || pl < 0 || nb >= N || pl >= N) continue; if (!blocked(nb) && !blocked(pl) && !live[nb]) { live[nb] = 1; st.push(nb); } } }
    const reach = (bs, p) => { const seen = new Uint8Array(N); const q = [p]; seen[p] = 1; let mn = p; while (q.length) { const u = q.pop(); if (u < mn) mn = u; for (let d = 0; d < 4; d++) { const v = u + DX[d] + DY[d] * W; if (!blocked(v) && !seen[v] && !bs.has(v)) { seen[v] = 1; q.push(v); } } } return { seen, mn }; };
    const b0 = boxes0.slice().sort((a, b) => a - b);
    if (b0.every((b) => goal[b])) return { pushes: 0, first: null };
    if (b0.some((b) => !live[b])) return { pushes: -1, dead: true };
    const nodes = [{ boxes: b0, p: player0, parent: -1, push: null }];
    const seenS = new Set([b0.join(',') + '|' + reach(new Set(b0), player0).mn]);
    for (let qi = 0; qi < nodes.length; qi++) {
      const s = nodes[qi];
      const bs = new Set(s.boxes);
      const { seen } = reach(bs, s.p);
      for (let k = 0; k < s.boxes.length; k++) {
        const b = s.boxes[k];
        for (let d = 0; d < 4; d++) {
          const from = b - DX[d] - DY[d] * W, to = b + DX[d] + DY[d] * W;
          if (!seen[from] || blocked(to) || bs.has(to) || !live[to]) continue;
          const nbx = s.boxes.slice(); nbx[k] = to; nbx.sort((a, c) => a - c);
          const nset = new Set(nbx);
          if (cornerFrozen(L, nset, to)) continue;
          const kk = nbx.join(',') + '|' + reach(nset, b).mn;
          if (seenS.has(kk)) continue;
          seenS.add(kk);
          nodes.push({ boxes: nbx, p: b, parent: qi, push: { box: b, d } });
          if (nbx.every((x) => goal[x])) {
            let c = nodes.length - 1, len = 0, first = null;
            while (nodes[c].parent >= 0) { first = nodes[c].push; len++; c = nodes[c].parent; }
            return { pushes: len, first };
          }
          if (nodes.length > limit) return null;
        }
      }
    }
    return { pushes: -1 };
  }
  function cornerFrozen(L, bs, b) {
    const { W, wall, goal } = L;
    const blockedAxis = (c, axis, visited) => {
      const a = axis === 0 ? [c - 1, c + 1] : [c - W, c + W];
      if (wall[a[0]] || wall[a[1]]) return true;
      for (const n of a) if (bs.has(n) && !visited.has(n)) { visited.add(n); if (blockedAxis(n, 1 - axis, visited)) return true; }
      return false;
    };
    const check = (c) => blockedAxis(c, 0, new Set([c])) && blockedAxis(c, 1, new Set([c]));
    if (!check(b)) return false;
    const group = [b], seen = new Set([b]);
    for (let i = 0; i < group.length; i++) { const c = group[i]; for (const n of [c - 1, c + 1, c - W, c + W]) if (bs.has(n) && !seen.has(n)) { seen.add(n); if (check(n)) group.push(n); } }
    return group.some((c) => !goal[c]);
  }
  return { parse, pathTo, solve, cornerFrozen, DX, DY };
})();

(() => {
  const $ = (id) => document.getElementById(id);
  const PACKS = window.SOKO_PACKS;
  const boardEl = $('board'), picker = $('picker');
  const CRATE = '<svg viewBox="0 0 40 40" aria-hidden="true"><rect class="fr" x="3" y="3" width="34" height="34" rx="5"/><rect class="lid" x="7" y="7" width="26" height="26" rx="2"/><path class="pl" d="M7 15.5h26M7 24.5h26"/><path class="fr2" d="M8 8l24 24M32 8L8 32"/><g class="nail"><circle cx="6.5" cy="6.5" r="1.4"/><circle cx="33.5" cy="6.5" r="1.4"/><circle cx="6.5" cy="33.5" r="1.4"/><circle cx="33.5" cy="33.5" r="1.4"/></g><path class="chk" d="M13 20.5l5 5 9-10"/></svg>';
  const EYES = '<g class="eyes"><circle cx="15" cy="19" r="4" fill="#fff"/><circle cx="25" cy="19" r="4" fill="#fff"/><circle class="pu" cx="15" cy="19" r="2" fill="#1d1b19"/><circle class="pu" cx="25" cy="19" r="2" fill="#1d1b19"/></g>';
  const CHARS = [
    { id: 'worker', name: 'Worker', need: 0, svg: `<svg viewBox="0 0 40 40" aria-hidden="true"><ellipse cx="20" cy="24" rx="14" ry="13" fill="#3a7bd5"/><circle cx="20" cy="20" r="12" fill="#ffcf9e"/><path d="M7 15a13 11 0 0 1 26 0z" fill="#ffc93c"/><rect x="5" y="14" width="30" height="3.5" rx="1.7" fill="#e0a800"/>${EYES}<path d="M16 26q4 3 8 0" stroke="#8a4b2a" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>` },
    { id: 'robot', name: 'Robot', need: 10, svg: `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 4v5" stroke="#8e9aaf" stroke-width="2"/><circle cx="20" cy="4" r="2.5" fill="#ff5a36"/><rect x="6" y="9" width="28" height="26" rx="8" fill="#b7c3d6"/><rect x="9" y="13" width="22" height="13" rx="5" fill="#1b2a3d"/>${EYES.replace(/#fff/g, '#58e6ff').replace(/#1d1b19/g, '#0b3a4a')}<rect x="14" y="29" width="12" height="2.5" rx="1.2" fill="#8e9aaf"/></svg>` },
    { id: 'cat', name: 'Cat', need: 25, svg: `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M7 6l9 7-8 4zM33 6l-9 7 8 4z" fill="#f08c3a"/><circle cx="20" cy="22" r="14" fill="#f5a04e"/><path d="M12 12q8-4 16 0" stroke="#d8742a" stroke-width="2" fill="none"/>${EYES}<path d="M18.5 25h3l-1.5 2z" fill="#ff7aa2"/><path d="M8 25h7M8 28h7M25 25h7M25 28h7" stroke="#8a4b2a" stroke-width=".9"/></svg>` },
    { id: 'penguin', name: 'Penguin', need: 45, svg: `<svg viewBox="0 0 40 40" aria-hidden="true"><ellipse cx="20" cy="21" rx="15" ry="16" fill="#25324a"/><ellipse cx="20" cy="25" rx="10" ry="11" fill="#fff"/>${EYES.replace(/#fff/g, '#e8eef7')}<path d="M17 24l3 3 3-3z" fill="#ff9f1c"/><path d="M12 36h6M22 36h6" stroke="#ff9f1c" stroke-width="2.5" stroke-linecap="round"/></svg>` }
  ];
  const ACH = [
    { id: 'first', name: 'First Delivery', d: 'Clear any level' },
    { id: 'perfect', name: 'Pro Pusher', d: 'Clear a level in the minimum pushes' },
    { id: 'p10', name: 'Shift Manager', d: 'Clear 10 levels' },
    { id: 'p25', name: 'Logistics Lead', d: 'Clear 25 levels' },
    { id: 'classic', name: 'Warehouse Done', d: 'Clear every Warehouse level' },
    { id: 'docks', name: 'Dock Master', d: 'Clear every Docks level' },
    { id: 'factory', name: 'Factory Boss', d: 'Clear every Factory level' },
    { id: 'nohint', name: 'Brain Power', d: 'Clear a Factory level without hints' },
    { id: 'noundo', name: 'No Take-Backs', d: 'Clear a 4+ crate level without undo' },
    { id: 'daily', name: 'Daily Grind', d: 'Clear the daily level' },
    { id: 'speedy', name: 'Forklift', d: 'Clear a level in under 20 seconds' }
  ];
  const SKEY = 'soko2';
  const loadS = () => {
    const base = { v: 1, done: {}, ach: {}, stats: { cleared: 0, moves: 0, pushes: 0, hints: 0, undos: 0 }, char: 'worker', pack: 'classic', idx: {}, daily: {} };
    const d = Curio.store.get(SKEY, null);
    const s = d && typeof d === 'object' && d.v === 1 ? { ...base, ...d, stats: { ...base.stats, ...(d.stats || {}) } } : base;
    const old = Curio.store.get('soko:done', {});
    if (old && typeof old === 'object') for (const k in old) if (!s.done[`classic-${k}`] && old[k] && old[k].m) s.done[`classic-${k}`] = old[k];
    if (!d) s.idx.classic = Curio.store.get('soko:level', 0) | 0;
    return s;
  };
  const S = loadS();
  const save = () => Curio.store.set(SKEY, S);
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const SIMPLE = Curio.simple;
  let pack = SIMPLE ? PACKS[0] : PACKS.find((p) => p.id === S.pack) || PACKS[0];
  const sfx = {
    ac() { return Curio.muted ? null : Curio.audioContext(); },
    noise(d, freq, vol, type = 'lowpass', when = 0) { const ac = this.ac(); if (!ac) return; const t = ac.currentTime + when, len = Math.ceil(ac.sampleRate * d), buf = ac.createBuffer(1, len, ac.sampleRate), ch = buf.getChannelData(0); for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2; const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); src.buffer = buf; f.type = type; f.frequency.value = freq; g.gain.value = vol; src.connect(f).connect(g).connect(ac.destination); src.start(t); },
    tone(f, d, type, vol, when = 0) { const ac = this.ac(); if (!ac) return; const t = ac.currentTime + when, o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.005); g.gain.setValueAtTime(vol, t + d * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d + 0.02); },
    step() { this.noise(0.03, 900, 0.12, 'bandpass'); },
    push() { this.noise(0.14, 260, 0.5); this.tone(70, 0.12, 'sine', 0.08); },
    scan() { this.tone(1850, 0.07, 'square', 0.025); this.tone(1850, 0.07, 'square', 0.025, 0.1); },
    clunk() { this.noise(0.08, 160, 0.6); this.tone(55, 0.18, 'sine', 0.1); },
    bump() { this.noise(0.05, 400, 0.25); }
  };
  let li = 0, L, boxes, player, dir = 2, moves = 0, pushes = 0, history = [], status = 'playing', cs = 48, daily = false, hintsUsed = 0, undos = 0;
  let boxEls = [], playerEl, elapsed = 0, t0 = 0, started = false, walkQ = [], walkTimer = 0, gameId = 0;

  const LEVELS = () => pack.levels;
  const fmtT = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const dkey = (i, p = pack) => `${p.id}-${i}`;
  const starsFor = (p, opt) => (p <= opt ? 3 : p <= Math.ceil(opt * 1.5) ? 2 : 1);
  const unlockedUpTo = () => { let first = LEVELS().findIndex((_, i) => !S.done[dkey(i)]); if (first < 0) first = LEVELS().length - 1; return Math.min(LEVELS().length - 1, first + 2); };
  const totalCleared = () => Object.keys(S.done).length;

  function paintPacks() {
    $('packs').innerHTML = PACKS.map((p) => { const n = p.levels.filter((_, i) => S.done[dkey(i, p)]).length; return `<button type="button" data-pack="${p.id}" aria-pressed="${p === pack && !daily}">${p.name}<small>${n}/${p.levels.length}</small></button>`; }).join('');
  }
  $('packs').addEventListener('click', (e) => { const b = e.target.closest('[data-pack]'); if (!b) return; pack = PACKS.find((p) => p.id === b.dataset.pack); S.pack = pack.id; save(); daily = false; togglePicker(false); load(Math.min(S.idx[pack.id] || 0, unlockedUpTo())); });
  function paintPicker() {
    picker.innerHTML = '';
    const up = unlockedUpTo();
    LEVELS().forEach((lv, i) => {
      const d = S.done[dkey(i)];
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'pk' + (d ? ' done' : '');
      b.innerHTML = `${i + 1}<small>${d ? '★'.repeat(starsFor(d.p, lv.p)) : ''}</small>`;
      b.disabled = i > up && !d;
      b.setAttribute('aria-current', String(i === li && !daily));
      b.setAttribute('aria-label', `Level ${i + 1}${d ? ', solved' : ''}`);
      b.addEventListener('click', () => { togglePicker(false); daily = false; load(i); });
      picker.append(b);
    });
  }
  function togglePicker(open) { picker.classList.toggle('open', open); $('lvlName').setAttribute('aria-expanded', String(open)); }
  function paintChars() {
    const n = totalCleared();
    $('chars').innerHTML = CHARS.map((c) => `<button type="button" data-char="${c.id}" aria-pressed="${S.char === c.id}" ${n >= c.need ? '' : 'disabled'} title="${n >= c.need ? c.name : `Clear ${c.need} levels to unlock`}" aria-label="${c.name}${n >= c.need ? '' : ', locked'}">${c.svg}</button>`).join('');
  }
  $('chars').addEventListener('click', (e) => { const b = e.target.closest('[data-char]'); if (!b || b.disabled) return; S.char = b.dataset.char; save(); paintChars(); if (playerEl) playerEl.innerHTML = charSvg(); render(true); Curio.beep(660, 0.05, 'triangle', 0.06); });
  const charSvg = () => (CHARS.find((c) => c.id === S.char && totalCleared() >= c.need) || CHARS[0]).svg;

  function load(i) {
    gameId++;
    li = i;
    if (SIMPLE) Curio.store.set('soko:simpleAt', li);
    else if (!daily) { S.idx[pack.id] = li; save(); }
    stopWalk();
    L = Soko.parse(LEVELS()[li].m);
    boxes = L.boxes.slice(); player = L.player; dir = 2;
    moves = 0; pushes = 0; history = []; status = 'playing'; elapsed = 0; started = false; hintsUsed = 0; undos = 0;
    $('result').hidden = true;
    build();
    paintPacks();
    paintPicker();
    const nb = boxes.length;
    msg(daily ? `Daily level from the ${pack.name} pack. ${nb} crates, ${LEVELS()[li].p} pushes at best.` : li === 0 && pack.id === 'classic' ? 'Walk into a crate to push it onto the target.' : `${nb} crate${nb > 1 ? 's' : ''}. Can be done in ${LEVELS()[li].p} pushes.`);
    render(true);
  }
  function build() {
    const avail = Math.min((boardEl.closest('.stage').clientWidth || 340) - 30, 640);
    cs = Math.max(24, Math.min(58, Math.floor(avail / L.W)));
    boardEl.style.setProperty('--cs', `${cs}px`);
    boardEl.style.width = `${cs * L.W}px`; boardEl.style.height = `${cs * L.H}px`;
    boardEl.classList.remove('won');
    boardEl.innerHTML = '';
    for (let i = 0; i < L.W * L.H; i++) {
      if (!L.wall[i] && !L.inside[i]) continue;
      if (L.wall[i]) {
        const x = i % L.W, y = Math.floor(i / L.W);
        let near = false;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < L.W && yy < L.H && L.inside[yy * L.W + xx]) near = true; }
        if (!near) continue;
      }
      const t = document.createElement('div');
      const x = i % L.W, y = Math.floor(i / L.W);
      t.className = 't ' + (L.wall[i] ? 'w' : 'f' + ((x + y) % 2 ? ' alt' : '') + (L.goal[i] ? ' g' : ''));
      t.style.left = `${x * cs}px`; t.style.top = `${y * cs}px`;
      t.dataset.i = i;
      boardEl.append(t);
    }
    boxEls = boxes.map(() => { const b = document.createElement('div'); b.className = 'sprite box'; b.innerHTML = CRATE; boardEl.append(b); return b; });
    playerEl = document.createElement('div'); playerEl.className = 'sprite player'; playerEl.innerHTML = charSvg();
    boardEl.append(playerEl);
  }
  const pos = (i) => `translate(${(i % L.W) * cs}px, ${Math.floor(i / L.W) * cs}px)`;
  function isStuck(b) { return !L.goal[b] && Soko.cornerFrozen(L, new Set(boxes), b); }
  function bumpStat(id, v) { const el = $(id); if (el.textContent !== String(v)) { el.textContent = v; el.classList.add('bump'); setTimeout(() => el.classList.remove('bump'), 120); } }
  function render(instant = false) {
    const all = [...boxEls, playerEl];
    if (instant) all.forEach((e) => { e.style.transition = 'none'; });
    boxes.forEach((b, k) => { boxEls[k].style.transform = pos(b); boxEls[k].classList.toggle('on', !!L.goal[b]); boxEls[k].classList.toggle('stuck', isStuck(b)); });
    playerEl.style.transform = pos(player);
    const ex = [0, 1.6, 0, -1.6][dir], ey = [-1.6, 0, 1.6, 0][dir];
    playerEl.querySelectorAll('.pu').forEach((p) => p.setAttribute('transform', `translate(${ex} ${ey})`));
    if (instant) { void boardEl.offsetWidth; all.forEach((e) => { e.style.transition = ''; }); }
    const on = boxes.filter((b) => L.goal[b]).length;
    bumpStat('moves', moves); bumpStat('pushes', pushes);
    $('crates').textContent = `${on}/${boxes.length}`;
    $('time').textContent = fmtT(elapsed);
    const d = SIMPLE ? (Curio.getBest(`simple-${li}`) != null ? { m: Curio.getBest(`simple-${li}`) } : null) : daily ? (S.daily[today()] ? { m: S.daily[today()] } : null) : S.done[dkey(li)];
    $('best').textContent = d ? d.m : '-';
    const st = !daily && S.done[dkey(li)] ? starsFor(S.done[dkey(li)].p, LEVELS()[li].p) : 0;
    $('lvlName').innerHTML = SIMPLE ? `Shift ${li + 1} of ${LEVELS().length}` : `${daily ? 'Daily · ' : ''}${pack.name} ${li + 1}/${LEVELS().length}<small>${st ? '★'.repeat(st) + '☆'.repeat(3 - st) : ''}</small>`;
    $('prev').disabled = li <= 0 || daily;
    $('nextL').disabled = daily || li >= LEVELS().length - 1 || li + 1 > unlockedUpTo();
    $('undo').disabled = !history.length || status !== 'playing';
  }
  function msg(t) { $('msg').textContent = t; }
  function dust(at, d) {
    const x = (at % L.W + 0.5 - Soko.DX[d] * 0.5) * cs, y = (Math.floor(at / L.W) + 0.5 - Soko.DY[d] * 0.5) * cs;
    for (let k = 0; k < 5; k++) {
      const p = document.createElement('div');
      p.className = 'dust';
      p.style.left = `${x - 3}px`; p.style.top = `${y - 3}px`;
      const a = Math.atan2(-Soko.DY[d], -Soko.DX[d]) + (Math.random() - 0.5) * 1.6;
      p.style.setProperty('--dx', `${Math.cos(a) * cs * 0.4}px`);
      p.style.setProperty('--dy', `${Math.sin(a) * cs * 0.4}px`);
      boardEl.append(p);
      setTimeout(() => p.remove(), 460);
    }
  }
  function clearHint() { boardEl.querySelectorAll('.arrowhint').forEach((e) => e.remove()); boxEls.forEach((b) => b.classList.remove('hinted')); boardEl.querySelectorAll('.t.path').forEach((t) => t.classList.remove('path')); }
  function step(d) {
    if (status !== 'playing') return false;
    clearHint();
    dir = d;
    const x = player % L.W + Soko.DX[d], y = Math.floor(player / L.W) + Soko.DY[d];
    const t = y * L.W + x;
    if (L.wall[t]) { bump(); return false; }
    const bk = boxes.indexOf(t);
    if (bk >= 0) {
      const x2 = x + Soko.DX[d], y2 = y + Soko.DY[d], t2 = y2 * L.W + x2;
      if (L.wall[t2] || boxes.includes(t2) || !L.inside[t2]) { bump(); return false; }
      history.push({ player, boxes: boxes.slice(), moves, pushes, dir });
      boxes[bk] = t2; pushes++;
      boxEls[bk].classList.remove('thud'); void boxEls[bk].offsetWidth; boxEls[bk].classList.add('thud');
      dust(t2, d);
      navigator.vibrate?.(8);
      sfx.push(); if (L.goal[t2]) sfx.scan();
      if (isStuck(t2)) { msg('Uh oh, that crate is wedged for good. Undo?'); sfx.clunk(); }
      else if (L.goal[t2]) msg(Curio.pick(['Clunk. Right on target.', 'Nice push!', 'That one is home.', 'Crate delivered.', 'Signed, sealed, delivered.']));
    } else {
      history.push({ player, boxes: boxes.slice(), moves, pushes, dir });
      sfx.step();
    }
    if (history.length > 3000) history.shift();
    if (!started) { started = true; t0 = performance.now(); }
    player = t; moves++;
    playerEl.classList.remove('walk'); void playerEl.offsetWidth; playerEl.classList.add('walk');
    render();
    checkWin();
    return true;
  }
  function bump() { playerEl.classList.remove('bump'); void playerEl.offsetWidth; playerEl.classList.add('bump'); sfx.bump(); render(); }
  function undo() {
    stopWalk(); clearHint();
    const h = history.pop(); if (!h || status !== 'playing') return;
    ({ player, moves, pushes, dir } = h); boxes = h.boxes;
    undos++; S.stats.undos++;
    Curio.beep(330, 0.04, 'sine', 0.05);
    render();
  }
  function restart() {
    stopWalk(); clearHint();
    if (status !== 'playing') { load(li); return; }
    if (moves) history.push({ player, boxes: boxes.slice(), moves, pushes, dir });
    const keep = history;
    player = L.player; boxes = L.boxes.slice(); moves = 0; pushes = 0; dir = 2;
    history = keep;
    msg('Fresh start. Undo brings your old attempt back.');
    render();
  }
  function stopWalk() { clearInterval(walkTimer); walkTimer = 0; walkQ = []; }
  function walk(dirs) {
    stopWalk();
    walkQ = dirs.slice();
    if (!walkQ.length) return;
    step(walkQ.shift());
    if (walkQ.length) walkTimer = setInterval(() => { if (!walkQ.length || status !== 'playing') { stopWalk(); return; } step(walkQ.shift()); }, 75);
  }
  function hint() {
    if (status !== 'playing') return;
    stopWalk(); clearHint();
    const r = Soko.solve(L, boxes, player);
    if (!r) { msg('This one is too tangled for a quick hint. Try undoing a few pushes.'); return; }
    if (r.pushes < 0) { msg(r.dead ? 'A crate is stuck where it can never reach a target. Undo!' : 'No way out from here. Undo or restart.'); Curio.beep(150, 0.15, 'square', 0.04); return; }
    if (!r.first) return;
    hintsUsed++; S.stats.hints++; save();
    const { box, d } = r.first;
    const k = boxes.indexOf(box);
    if (k >= 0) boxEls[k].classList.add('hinted');
    const a = document.createElement('div');
    a.className = 'arrowhint';
    a.textContent = ['▲', '▶', '▼', '◀'][d];
    const tgt = box + Soko.DX[d] + Soko.DY[d] * L.W;
    a.style.transform = pos(tgt);
    boardEl.append(a);
    const stand = box - Soko.DX[d] - Soko.DY[d] * L.W;
    const p = Soko.pathTo(L, boxes, player, stand) || [];
    let c = player;
    for (const dd of p) { c += Soko.DX[dd] + Soko.DY[dd] * L.W; boardEl.querySelector(`.t[data-i="${c}"]`)?.classList.add('path'); }
    msg(`Push the glowing crate ${['up', 'right', 'down', 'left'][d]}. ${r.pushes} pushes to go if you play perfectly.`);
    Curio.beep(880, 0.08, 'sine', 0.06);
  }
  const starSvg = (on) => `<svg viewBox="0 0 24 24"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 21l1.6-7L2 9.2l7.1-.6z" fill="${on ? '#ffc93c' : 'var(--surface-2)'}" stroke="${on ? '#e09b00' : 'var(--line)'}" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
  function award(id, fresh) { if (!S.ach[id]) { S.ach[id] = Date.now(); fresh.push(id); } }
  function checkWin() {
    if (!boxes.every((b) => L.goal[b])) return;
    status = 'won';
    stopWalk();
    tick();
    const secs = Math.round(elapsed);
    const opt = LEVELS()[li].p;
    const st = starsFor(pushes, opt);
    const fresh = [];
    const prev = daily ? null : S.done[dkey(li)];
    const isNew = !daily && (!prev || moves < prev.m || pushes < prev.p);
    const before = totalCleared();
    if (!daily && isNew && !SIMPLE) S.done[dkey(li)] = { m: prev ? Math.min(moves, prev.m) : moves, p: prev ? Math.min(pushes, prev.p) : pushes };
    if (daily) S.daily[today()] = Math.min(S.daily[today()] ?? 1e9, moves);
    S.stats.cleared++; S.stats.moves += moves; S.stats.pushes += pushes;
    award('first', fresh);
    if (pushes <= opt) award('perfect', fresh);
    if (totalCleared() >= 10) award('p10', fresh);
    if (totalCleared() >= 25) award('p25', fresh);
    for (const p of PACKS) if (p.levels.every((_, i) => S.done[dkey(i, p)])) award(p.id, fresh);
    if (pack.id === 'factory' && !hintsUsed) award('nohint', fresh);
    if (boxes.length >= 4 && !undos) award('noundo', fresh);
    if (daily) award('daily', fresh);
    if (secs < 20) award('speedy', fresh);
    save();
    const newChar = CHARS.find((c) => c.need > before && c.need <= totalCleared());
    if (SIMPLE) Curio.best(`simple-${li}`, moves, false);
    else if (!daily) Curio.best(`moves-${pack.id === 'classic' ? '' : pack.id + '-'}${li}`, moves, false);
    boardEl.classList.add('won');
    boxEls.forEach((b, k) => b.style.setProperty('--d', `${k * 90}ms`));
    Curio.confetti();
    navigator.vibrate?.([20, 40, 20]);
    [784, 988, 1175, 1568].forEach((f, k) => sfx.tone(f, 0.12, 'triangle', 0.07, k * 0.09));
    msg(Curio.pick(['Warehouse sorted!', 'Shipment ready to go!', 'Every crate on its mark!']));
    render(); paintPicker(); paintPacks(); paintChars();
    const gid = gameId;
    setTimeout(() => {
      if (gid !== gameId) return;
      const last = !SIMPLE && (daily || li >= LEVELS().length - 1);
      $('rStars').innerHTML = [1, 2, 3].map((i) => starSvg(i <= st)).join('');
      $('rTitle').textContent = SIMPLE ? `Shift ${li + 1} done!` : daily ? 'Daily level cleared!' : pack.levels.every((_, i) => S.done[dkey(i)]) ? `${pack.name} pack complete!` : `Level ${li + 1} cleared!`;
      $('rBody').textContent = `${moves} moves and ${pushes} pushes in ${fmtT(secs)}. ${pushes <= opt ? 'Minimum pushes, a true pro.' : `It can be done in ${opt} pushes.`}${hintsUsed ? ` (${hintsUsed} hint${hintsUsed > 1 ? 's' : ''})` : ''}${newChar ? ` New pusher unlocked: ${newChar.name}!` : ''}`;
      $('rBadges').innerHTML = fresh.map((id) => { const a = ACH.find((x) => x.id === id); return `<span class="badge on new" title="${a.d}">★ ${a.name}</span>`; }).join('');
      $('rNext').hidden = last;
      if (SIMPLE) $('rNext').textContent = 'Next shift';
      $('result').hidden = false;
      ($('rNext').hidden ? $('rAgain') : $('rNext')).focus({ preventScroll: true });
      paintProgress();
    }, 1100);
  }
  $('rNext').addEventListener('click', () => load((li + 1) % LEVELS().length));
  $('rAgain').addEventListener('click', () => load(li));
  $('rShare').addEventListener('click', () => {
    const st = $('rStars').querySelectorAll('[fill="#ffc93c"]').length;
    const txt = `Zoble Box Pusher · ${daily ? `Daily ${today()}` : `${pack.name} ${li + 1}`}\n${'⭐'.repeat(st)}${'☆'.repeat(3 - st)} ${moves} moves, ${pushes} pushes (best possible ${LEVELS()[li].p} pushes)`;
    (navigator.clipboard?.writeText(txt) || Promise.reject()).then(() => Curio.toast('Result copied'), () => Curio.toast('Copy failed, sorry'));
  });
  function paintProgress() {
    const st = S.stats;
    $('stats').innerHTML = `<div class="c-stat"><b>${totalCleared()}</b><span>Levels</span></div><div class="c-stat"><b>${st.pushes}</b><span>Pushes</span></div><div class="c-stat"><b>${st.moves}</b><span>Steps</span></div><div class="c-stat"><b>${st.undos}</b><span>Undos</span></div><div class="c-stat"><b>${st.hints}</b><span>Hints</span></div>`;
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
  document.addEventListener('visibilitychange', () => { t0 = performance.now(); if (document.hidden) stopWalk(); });

  let sw = null;
  boardEl.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    sw = { x: e.clientX, y: e.clientY, id: e.pointerId, moved: false };
    boardEl.setPointerCapture(e.pointerId);
  });
  boardEl.addEventListener('pointermove', (e) => {
    if (!sw || sw.id !== e.pointerId) return;
    const dx = e.clientX - sw.x, dy = e.clientY - sw.y, th = Math.max(26, cs * 0.75);
    if (Math.abs(dx) < th && Math.abs(dy) < th) return;
    sw.moved = true; stopWalk();
    step(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0));
    sw.x = e.clientX; sw.y = e.clientY;
  });
  boardEl.addEventListener('pointerup', (e) => {
    if (!sw || sw.id !== e.pointerId) return;
    const s = sw; sw = null;
    if (s.moved || status !== 'playing') return;
    const r = boardEl.getBoundingClientRect();
    const x = Math.floor((e.clientX - r.left) / cs), y = Math.floor((e.clientY - r.top) / cs);
    if (x < 0 || y < 0 || x >= L.W || y >= L.H) return;
    const t = y * L.W + x;
    const px = player % L.W, py = Math.floor(player / L.W);
    if (boxes.includes(t) && Math.abs(px - x) + Math.abs(py - y) === 1) { stopWalk(); step(x > px ? 1 : x < px ? 3 : y > py ? 2 : 0); return; }
    if (!L.inside[t] || L.wall[t]) return;
    const p = Soko.pathTo(L, boxes, player, t);
    if (p) walk(p); else { msg('You cannot get there from here without pushing something.'); bump(); }
  });
  boardEl.addEventListener('pointercancel', () => { sw = null; });
  document.querySelectorAll('.pad button').forEach((b) => {
    let rep = 0, held = 0;
    const go = () => { stopWalk(); step(+b.dataset.d); };
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); go(); held = setTimeout(() => { rep = setInterval(go, 120); }, 320); });
    const stop = () => { clearTimeout(held); clearInterval(rep); };
    b.addEventListener('pointerup', stop); b.addEventListener('pointerleave', stop); b.addEventListener('pointercancel', stop);
    b.addEventListener('click', (e) => { if (e.detail === 0) go(); });
  });
  addEventListener('keydown', (e) => {
    if (document.querySelector('.curio-modal') || e.metaKey || e.altKey) return;
    if (e.target.closest?.('input, select, textarea')) return;
    if (e.ctrlKey) { if (e.key === 'z') { e.preventDefault(); undo(); } return; }
    if (!$('result').hidden) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const d = { ArrowUp: 0, w: 0, ArrowRight: 1, d: 1, ArrowDown: 2, s: 2, ArrowLeft: 3, a: 3 }[k];
    if (d != null) { e.preventDefault(); stopWalk(); step(d); return; }
    if (k === 'z' || k === 'u' || k === 'Backspace') { e.preventDefault(); undo(); return; }
    if (k === 'r') restart();
    if (k === 'h') hint();
  });
  $('undo').addEventListener('click', undo);
  $('restart').addEventListener('click', restart);
  $('hint').addEventListener('click', hint);
  $('daily').addEventListener('click', () => {
    const all = PACKS.flatMap((p) => p.levels.map((_, i) => [p, i]));
    const day = Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / 864e5);
    const [p, i] = all[(day * 7919) % all.length];
    pack = p; daily = true; togglePicker(false); load(i);
  });
  $('prev').addEventListener('click', () => { if (li > 0) load(li - 1); });
  $('nextL').addEventListener('click', () => { if (li < LEVELS().length - 1 && li + 1 <= unlockedUpTo()) load(li + 1); });
  $('lvlName').addEventListener('click', () => togglePicker(!picker.classList.contains('open')));
  let rz = 0;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { const a = { boxes: boxes.slice(), player }; build(); boxes = a.boxes; player = a.player; render(true); }, 150); });

  paintChars();
  if (SIMPLE) load(Math.max(0, Math.min(LEVELS().length - 1, +Curio.store.get('soko:simpleAt', 0) || 0)));
  else load(Math.max(0, Math.min(LEVELS().length - 1, S.idx[pack.id] || 0, unlockedUpTo())));
  paintProgress();
  window.__soko = { engine: Soko, packs: PACKS, step, get state() { return { player, boxes: boxes.slice(), moves, pushes, status, li, pack: pack.id }; }, load, undo, setPack: (id) => { pack = PACKS.find((p) => p.id === id); daily = false; }, hint, solveHere: () => Soko.solve(L, boxes, player) };
})();
