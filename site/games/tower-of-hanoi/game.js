'use strict';
(() => {
  const $ = (id) => document.getElementById(id);
  const stage = $('stage'), seg = $('seg');
  const MODES = { classic: { P: 3, name: 'Classic' }, four: { P: 4, name: '4 pegs' }, cyclic: { P: 3, name: 'Clockwise' } };
  const SKINS = [
    { id: 'rainbow', name: 'Rainbow', c: (s, n) => `hsl(${Math.round((s - 1) * 300 / Math.max(1, n - 1))}deg 78% 62%)` },
    { id: 'wood', name: 'Wood', c: (s, n) => `hsl(${24 + (s % 2) * 8}deg ${45 + (s * 3) % 15}% ${68 - (s - 1) * 30 / Math.max(1, n - 1)}%)` },
    { id: 'candy', name: 'Candy', c: (s) => ['#ff8fab', '#ffc6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#a0c4ff', '#bdb2ff', '#ffc6ff', '#ffadad', '#b9fbc0'][(s - 1) % 10] },
    { id: 'neon', name: 'Neon', c: (s) => ['#ff3cac', '#ffde59', '#39ff88', '#00e5ff', '#7b61ff', '#ff6b3d', '#c6ff00', '#ff4081', '#18ffff', '#ffd740'][(s - 1) % 10] }
  ];
  const ACH = [
    { id: 'first', name: 'First Tower', d: 'Solve any tower' },
    { id: 'flawless', name: 'Flawless', d: 'Perfect solution with 5 or more discs' },
    { id: 'eight', name: 'Eight Is Great', d: 'Perfect solution with 8 discs' },
    { id: 'ten', name: 'Monk Apprentice', d: 'Solve a 10 disc tower' },
    { id: 'four', name: 'Reve’s Puzzle', d: 'Solve a 4-peg tower' },
    { id: 'cyclic', name: 'Clockwork', d: 'Solve a clockwise tower' },
    { id: 'scramble', name: 'Neat Freak', d: 'Tidy a scramble in the fewest moves' },
    { id: 'daily', name: 'Daily Monk', d: 'Solve the daily puzzle' },
    { id: 'speedy', name: 'Speedy', d: 'Solve 5 discs in under 30 seconds' },
    { id: 'stars30', name: 'Stargazer', d: 'Collect 30 stars' }
  ];
  const FACTS = [
    'The puzzle was invented by French mathematician Édouard Lucas in 1883.',
    'Lucas sold it under the pen name N. Claus de Siam, an anagram of Lucas d’Amiens.',
    'At one move per second, 64 discs would take the monks about 585 billion years.',
    'In the perfect solution the smallest disc moves on every other turn.',
    'The perfect solution for n discs on three pegs takes 2ⁿ - 1 moves.',
    'With four pegs, the Frame-Stewart method was proved optimal by Thierry Bousch in 2014.',
    'Drawn as a graph, every position of the puzzle forms a Sierpinski triangle.',
    'The discs moved in the perfect solution follow the ruler sequence: 1, 2, 1, 3, 1, 2, 1...'
  ];
  const SKEY = 'hanoi2';
  const loadS = () => {
    const base = { v: 1, stars: {}, ach: {}, skin: 'rainbow', mode: 'classic', n: Curio.store.get('hanoi:n', 3) | 0 || 3, stats: { solved: 0, moves: 0, perfect: 0, hints: 0 }, daily: {} };
    const d = Curio.store.get(SKEY, null);
    if (!d || typeof d !== 'object' || d.v !== 1) return base;
    return { ...base, ...d, stats: { ...base.stats, ...(d.stats || {}) } };
  };
  const S = loadS();
  const save = () => Curio.store.set(SKEY, S);
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const NAMES4 = ['Left', 'Middle', 'Right'];
  const pegName = (i) => (P === 4 ? ['First', 'Second', 'Third', 'Fourth'][i] : NAMES4[i]);
  let mode = MODES[S.mode] ? S.mode : 'classic', P = MODES[mode].P;
  let n = 3, pegs, discEls = [], moves = 0, history = [], held = -1, cursor = 0, assisted = false, solving = null;
  let status = 'playing', elapsed = 0, t0 = 0, started = false, geo = null, drag = null, kind = 'stack', optimalN = 7, factI = 0;
  let gameId = 0, base, poles = [], labels = [], hits = [], arrows = [];

  for (let k = 3; k <= 10; k++) {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = k; b.dataset.n = k; b.setAttribute('aria-label', `${k} discs`);
    b.addEventListener('click', () => { kind = 'stack'; newGame(k); });
    seg.append(b);
  }
  document.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => { mode = b.dataset.mode; P = MODES[mode].P; S.mode = mode; save(); kind = 'stack'; buildBoard(); newGame(n); }));

  function buildBoard() {
    [base, ...poles, ...labels, ...hits, ...arrows].forEach((el) => el && el.remove());
    base = document.createElement('div'); base.className = 'base'; stage.append(base);
    poles = Array.from({ length: P }, (_, i) => { const p = document.createElement('div'); p.className = 'pole' + (i === P - 1 ? ' goal' : ''); stage.append(p); return p; });
    labels = Array.from({ length: P }, (_, i) => { const l = document.createElement('div'); l.className = 'peg-label' + (i === P - 1 ? ' goal' : ''); l.textContent = i === P - 1 ? 'Goal' : pegName(i); stage.append(l); return l; });
    arrows = mode === 'cyclic' ? Array.from({ length: P }, (_, i) => { const a = document.createElement('div'); a.className = 'cyc'; a.textContent = i === P - 1 ? '↩ to Left' : '→'; stage.append(a); return a; }) : [];
    hits = Array.from({ length: P }, (_, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'peg-hit'; b.tabIndex = i === 0 ? 0 : -1;
      b.setAttribute('aria-label', `${pegName(i)} peg`);
      b.addEventListener('focus', () => { cursor = i; paintCursor(); });
      stage.append(b);
      return b;
    });
    $('result').remove();
    stage.append($('result') || resultEl);
    document.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
  }
  const resultEl = $('result');

  const cache = new Map();
  function solver() {
    const key = `${mode}-${n}`;
    if (cache.has(key)) return cache.get(key);
    const pw = [1];
    for (let i = 1; i <= n; i++) pw[i] = pw[i - 1] * P;
    const total = pw[n];
    const dist = new Uint16Array(total).fill(65535);
    const q = new Int32Array(total);
    let goal = 0;
    for (let s = 1; s <= n; s++) goal += (P - 1) * pw[s - 1];
    dist[goal] = 0;
    let qh = 0, qt = 0;
    q[qt++] = goal;
    const tops = new Int32Array(P);
    const cyc = mode === 'cyclic';
    while (qh < qt) {
      const code = q[qh++];
      let c = code;
      tops.fill(n + 1);
      for (let s = 1; s <= n; s++) { const p = c % P; c = (c - p) / P; if (tops[p] > n) tops[p] = s; }
      const nd = dist[code] + 1;
      for (let a = 0; a < P; a++) for (let b = 0; b < P; b++) {
        if (a === b || (cyc && b !== (a + 1) % P)) continue;
        const d = tops[b];
        if (d > n || d >= tops[a]) continue;
        const nc = code + (a - b) * pw[d - 1];
        if (dist[nc] === 65535) { dist[nc] = nd; q[qt++] = nc; }
      }
    }
    const sv = { dist, pw };
    cache.set(key, sv);
    return sv;
  }
  const codeOf = () => { const { pw } = solver(); let c = 0; pegs.forEach((st, p) => st.forEach((s) => { c += p * pw[s - 1]; })); return c; };
  const maxN = () => (mode === 'cyclic' ? 7 : 10);
  const allowed = (a, b) => a !== b && (mode !== 'cyclic' || b === (a + 1) % P);

  const fmtT = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const top = (p) => pegs[p][pegs[p].length - 1] || 0;
  const skin = () => SKINS.find((k) => k.id === S.skin) || SKINS[0];

  function layout() {
    const W = stage.clientWidth, H = stage.clientHeight;
    const colW = W / P, baseY = H - 38;
    const discH = Math.min(30, (H - 96) / (n + 0.5));
    const maxW = colW - (P === 4 ? 8 : 14), minW = Math.max(28, maxW * 0.26);
    const poleH = Math.max((n + 0.9) * discH + 16, Math.min(baseY - discH - 30, (n + 2.5) * discH));
    geo = { W, H, colW, baseY, discH, maxW, minW, poleTop: baseY - poleH };
    base.style.top = `${baseY}px`;
    poles.forEach((p, i) => { p.style.left = `${colW * (i + 0.5)}px`; p.style.top = `${geo.poleTop}px`; p.style.height = `${poleH}px`; });
    labels.forEach((l, i) => { l.style.left = `${colW * (i + 0.5)}px`; });
    arrows.forEach((a, i) => { a.style.left = `${i === P - 1 ? colW * (i + 0.5) : colW * (i + 1)}px`; a.style.top = `${baseY + 2}px`; a.style.color = i === P - 1 ? 'var(--accent-ink)' : ''; a.style.fontSize = i === P - 1 ? '10px' : ''; });
    hits.forEach((h, i) => { h.style.left = `${colW * i}px`; h.style.width = `${colW}px`; });
    discEls.forEach((el, s) => { if (!el) return; const w = widthOf(s); el.style.width = `${w}px`; el.style.height = `${discH - 2}px`; });
  }
  const widthOf = (s) => geo.minW + (geo.maxW - geo.minW) * (s - 1) / Math.max(1, n - 1);
  const restXY = (s, p, k) => [geo.colW * (p + 0.5) - widthOf(s) / 2, geo.baseY - (k + 1) * geo.discH];
  const liftXY = (s, p) => [geo.colW * (p + 0.5) - widthOf(s) / 2, Math.max(4, geo.poleTop - geo.discH - 6)];
  const tf = ([x, y]) => `translate(${x}px, ${y}px)`;

  function place(s, xy) { const el = discEls[s]; el.getAnimations().forEach((a) => a.cancel()); el.style.transform = tf(xy); }
  function animate(s, frames, dur) {
    const el = discEls[s];
    const cur = getComputedStyle(el).transform;
    el.getAnimations().forEach((a) => a.cancel());
    const kf = [{ transform: cur === 'none' ? frames[0] : cur }, ...frames.map((f) => ({ transform: f }))];
    el.style.transform = frames[frames.length - 1];
    return el.animate(kf, { duration: dur, easing: 'cubic-bezier(.45,.05,.3,1)' }).finished.catch(() => {});
  }
  function settleAll() {
    pegs.forEach((stack, p) => stack.forEach((s, k) => { if (s !== held && (!drag || drag.s !== s)) place(s, restXY(s, p, k)); }));
    if (held > 0) { const p = pegOf(held); place(held, liftXY(held, p)); }
  }
  const pegOf = (s) => pegs.findIndex((st) => st.includes(s));
  function paintSkin() {
    stage.className = stage.className.replace(/\bskin-\w+/g, '').trim() + ' skin-' + skin().id;
    for (let s = 1; s <= n; s++) if (discEls[s]) discEls[s].style.setProperty('--dc', skin().c(s, n));
    $('skins').innerHTML = SKINS.map((k) => `<button type="button" data-skin="${k.id}" aria-pressed="${k.id === skin().id}"><i style="background:linear-gradient(90deg,${k.c(1, 5)},${k.c(3, 5)},${k.c(5, 5)})"></i>${k.name}</button>`).join('');
  }
  $('skins').addEventListener('click', (e) => { const b = e.target.closest('[data-skin]'); if (!b) return; S.skin = b.dataset.skin; save(); paintSkin(); Curio.beep(660, 0.05, 'triangle', 0.06); });

  function seeded(seed) {
    let s = seed >>> 0;
    return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function newGame(k = n, opts = {}) {
    if (solving) { clearTimeout(solving); solving = null; }
    gameId++;
    n = Math.max(3, Math.min(maxN(), k));
    S.n = n; save();
    pegs = Array.from({ length: P }, () => []);
    const { dist, pw } = solver();
    if (kind === 'stack') {
      for (let s = n; s >= 1; s--) pegs[0].push(s);
    } else {
      const rnd = kind === 'daily' ? seeded([...today()].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261)) : Math.random;
      let tries = 0, pos;
      do {
        pos = Array.from({ length: n + 1 }, () => Math.floor(rnd() * P));
        let c = 0;
        for (let s = 1; s <= n; s++) c += pos[s] * pw[s - 1];
        if (dist[c] >= Math.min(2 ** n - 1, n * 3) && dist[c] !== 65535) break;
      } while (++tries < 200);
      for (let s = n; s >= 1; s--) pegs[pos[s]].push(s);
    }
    optimalN = dist[codeOf()];
    moves = 0; history = []; held = -1; assisted = false; status = 'playing'; elapsed = 0; started = false;
    stage.classList.remove('won');
    $('result').hidden = true;
    discEls.forEach((el) => el && el.remove());
    discEls = [null];
    for (let s = 1; s <= n; s++) {
      const el = document.createElement('div');
      el.className = 'disc';
      el.textContent = s; el.setAttribute('aria-hidden', 'true');
      stage.insertBefore(el, hits[0]);
      discEls.push(el);
    }
    paintSkin();
    layout();
    settleAll();
    seg.querySelectorAll('button').forEach((b) => { b.setAttribute('aria-pressed', String(+b.dataset.n === n)); b.disabled = +b.dataset.n > maxN(); });
    const what = kind === 'daily' ? `Daily puzzle: tidy this ${n}-disc scramble onto the goal peg.` : kind === 'scramble' ? 'Scrambled! Stack every disc on the goal peg.' : `Move all ${n} discs to the goal peg.`;
    legend(`${what} The best possible is ${optimalN} moves.${opts.quiet ? '' : ' ' + FACTS[factI++ % FACTS.length]}`);
    render();
  }

  function legend(t) { $('legend').textContent = t; }
  function bestKey() { return mode === 'classic' ? `moves-${n}` : `${mode}-moves-${n}`; }
  function render() {
    const mv = $('moves');
    if (mv.textContent !== String(moves)) { mv.textContent = moves; mv.classList.add('bump'); setTimeout(() => mv.classList.remove('bump'), 140); }
    $('opt').textContent = optimalN;
    $('time').textContent = fmtT(elapsed);
    const b = kind === 'stack' ? Curio.getBest(bestKey()) : kind === 'daily' ? S.daily[today()] : null;
    $('best').textContent = b == null ? '-' : b;
    $('undo').disabled = !history.length || status !== 'playing' || !!solving;
    $('hint').disabled = status !== 'playing' || !!solving;
    $('solve').setAttribute('aria-pressed', String(!!solving));
    $('solve').innerHTML = solving ? '<i>⏸</i>Stop' : '<i>▶</i>Solve';
    $('meter').style.width = `${(pegs[P - 1].length / n) * 100}%`;
  }
  function paintCursor() { hits.forEach((h, i) => { h.classList.toggle('cursor', i === cursor && h.matches(':focus-visible')); h.tabIndex = i === cursor ? 0 : -1; }); }
  function startClock() { if (!started) { started = true; t0 = performance.now(); } }
  const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
  function note(s, vol = 0.08) {
    const f = 262 * 2 ** (PENTA[Math.max(0, Math.min(9, n - s))] / 12);
    Curio.beep(f, 0.12, 'triangle', vol);
    Curio.beep(f * 2, 0.06, 'sine', vol * 0.3);
  }
  function puff(s, p, k) {
    const [x, y] = restXY(s, p, k);
    const w = widthOf(s);
    for (let i = 0; i < 6; i++) {
      const d = document.createElement('div');
      d.className = 'puff';
      const left = i < 3;
      d.style.left = `${x + (left ? 4 : w - 10)}px`;
      d.style.top = `${y + geo.discH - 8}px`;
      d.style.setProperty('--dx', `${(left ? -1 : 1) * (10 + Math.random() * 16)}px`);
      d.style.setProperty('--dy', `${-4 - Math.random() * 10}px`);
      stage.append(d);
      setTimeout(() => d.remove(), 520);
    }
  }

  function doMove(a, b, opts = {}) {
    const s = top(a);
    if (!s) return false;
    if (!allowed(a, b)) { bounce(s, a, b, 'cyc'); return false; }
    if (top(b) && top(b) < s) { bounce(s, a, b); return false; }
    startClock();
    pegs[a].pop(); pegs[b].push(s);
    if (!opts.undo) { history.push([a, b]); moves++; } else moves--;
    held = -1;
    const dur = opts.fast ? opts.fast : 330;
    const k = pegs[b].length - 1;
    const frames = opts.fromDrag ? [tf(liftXY(s, b)), tf(restXY(s, b, k))] : [tf(liftXY(s, a)), tf(liftXY(s, b)), tf(restXY(s, b, k))];
    discEls[s].classList.remove('lift');
    const dd = opts.fromDrag ? dur * 0.6 : dur;
    animate(s, frames, dd);
    if (!opts.fast || opts.fast > 120) setTimeout(() => puff(s, b, k), dd * 0.9);
    note(s);
    navigator.vibrate?.(6);
    render();
    if (!opts.undo) checkWin();
    return true;
  }

  function bounce(s, a, b, why) {
    held = -1;
    const k = pegs[a].length - 1;
    discEls[s].classList.remove('lift');
    animate(s, [tf(liftXY(s, b)), tf(liftXY(s, a)), tf(restXY(s, a, k))], 420);
    discEls[s].classList.remove('shake'); void discEls[s].offsetWidth; discEls[s].classList.add('shake');
    poles[b].classList.add('bad'); setTimeout(() => poles[b].classList.remove('bad'), 420);
    Curio.beep(150, 0.18, 'square', 0.06);
    navigator.vibrate?.([30, 30, 30]);
    legend(why === 'cyc' ? `Clockwise rules: from the ${pegName(a).toLowerCase()} peg a disc can only go to the ${pegName((a + 1) % P).toLowerCase()} peg.` : Curio.pick(['Nope. Big discs never sit on small ones.', 'That disc is too wide for that peg.', 'Squish! Only smaller discs can go on top.', 'The monks would not approve of that move.']));
  }

  function pick(p) {
    const s = top(p); if (!s) return;
    held = s;
    discEls[s].classList.add('lift');
    animate(s, [tf(liftXY(s, p))], 160);
    Curio.beep(520, 0.04, 'sine', 0.05);
  }
  function drop() {
    if (held < 0) return;
    const s = held, p = pegOf(s);
    held = -1;
    discEls[s].classList.remove('lift');
    animate(s, [tf(restXY(s, p, pegs[p].length - 1))], 160);
  }
  function pressPeg(p) {
    if (status !== 'playing' || solving) return;
    cursor = p; paintCursor();
    if (held > 0) {
      const from = pegOf(held);
      if (from === p) { drop(); return; }
      doMove(from, p, { fromDrag: true });
    } else pick(p);
  }
  function pegAt(clientX) {
    const r = stage.getBoundingClientRect();
    return Math.max(0, Math.min(P - 1, Math.floor((clientX - r.left) / (r.width / P))));
  }

  let dIgn = false;
  Curio.drag(stage, {
    start(p) {
      dIgn = true;
      const e = p.event;
      if (e.target.closest('.result') || e.target.closest('button:not(.peg-hit)')) return;
      if (status !== 'playing' || solving) return;
      const pg = pegAt(p.clientX);
      if (held > 0) { e.preventDefault(); pressPeg(pg); return; }
      const s = top(pg); if (!s) return;
      e.preventDefault();
      const [x0, y0] = restXY(s, pg, pegs[pg].length - 1);
      drag = { s, from: pg, sx: p.clientX, sy: p.clientY, ox: p.x - x0, oy: p.y - y0, moved: false };
      dIgn = false;
    },
    move(p) {
      if (dIgn || !drag) return;
      if (!drag.moved && Math.hypot(p.clientX - drag.sx, p.clientY - drag.sy) < 8) return;
      if (!drag.moved) { drag.moved = true; discEls[drag.s].classList.add('lift'); Curio.beep(520, 0.04, 'sine', 0.05); }
      const x = Math.max(-20, Math.min(geo.W - widthOf(drag.s) + 20, p.x - drag.ox));
      const y = Math.max(0, Math.min(geo.baseY - geo.discH, p.y - drag.oy));
      place(drag.s, [x, y]);
      const tp = pegAt(p.clientX);
      poles.forEach((pl, i) => pl.classList.toggle('target', i === tp && i !== drag.from && allowed(drag.from, i) && !(top(i) && top(i) < drag.s)));
    },
    end(p) {
      if (dIgn || !drag) return;
      const d = drag; drag = null;
      poles.forEach((pl) => pl.classList.remove('target'));
      if (!p) { discEls[d.s].classList.remove('lift'); animate(d.s, [tf(restXY(d.s, d.from, pegs[d.from].length - 1))], 200); return; }
      if (!d.moved) { pressPeg(d.from); return; }
      const to = pegAt(p.clientX);
      if (to === d.from) { discEls[d.s].classList.remove('lift'); animate(d.s, [tf(restXY(d.s, d.from, pegs[d.from].length - 1))], 200); return; }
      doMove(d.from, to, { fromDrag: true });
    }
  });
  addEventListener('pointerup', () => { if (dIgn && Curio.touchpad) { dIgn = false; dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); } });
  if (!Curio.touchpad && matchMedia('(pointer: fine)').matches && !Curio.store.get('tpTip', false)) { Curio.store.set('tpTip', true); setTimeout(() => Curio.toast('Tip: on a touchpad, turn on Touchpad mode in the top bar to carry discs with click, move, click'), 1500); }

  function undo() {
    if (!history.length || status !== 'playing' || solving) return;
    if (held > 0) drop();
    const [a, b] = history.pop();
    const s = top(b);
    pegs[b].pop(); pegs[a].push(s);
    moves--;
    const k = pegs[a].length - 1;
    animate(s, [tf(liftXY(s, b)), tf(liftXY(s, a)), tf(restXY(s, a, k))], 300);
    Curio.beep(330, 0.05, 'sine', 0.06);
    render();
  }
  function nextBest() {
    const { dist, pw } = solver();
    const code = codeOf(), d0 = dist[code];
    if (!d0) return null;
    for (let a = 0; a < P; a++) {
      const s = top(a); if (!s) continue;
      for (let b = 0; b < P; b++) {
        if (!allowed(a, b) || (top(b) && top(b) < s)) continue;
        if (dist[code + (b - a) * pw[s - 1]] === d0 - 1) return [a, b, d0];
      }
    }
    return null;
  }
  function hint() {
    if (status !== 'playing' || solving) return;
    if (held > 0) drop();
    const mv = nextBest();
    if (!mv) return;
    const [a, b, left] = mv;
    assisted = true;
    S.stats.hints++; save();
    legend(`Hint: move disc ${top(a)} from the ${pegName(a).toLowerCase()} peg to the ${pegName(b).toLowerCase()} peg. ${left} moves to go from here.`);
    poles[a].classList.add('hintfrom'); poles[b].classList.add('target');
    setTimeout(() => { poles[a].classList.remove('hintfrom'); poles[b].classList.remove('target'); }, 900);
    Curio.beep(880, 0.08, 'sine', 0.06);
  }
  function stopSolve() { if (solving) { clearTimeout(solving); solving = null; } if (pegs) render(); }
  function autoSolve() {
    if (solving) { stopSolve(); legend('Paused. Take it from here, or press Solve again.'); return; }
    if (status !== 'playing') return;
    if (held > 0) drop();
    const first = nextBest();
    if (!first) return;
    assisted = true;
    legend(`Watch closely: ${first[2]} moves to go.${mode === 'classic' ? ' Notice the smallest disc moves every other turn.' : ''}`);
    const gap = Math.max(45, 420 - n * 42);
    const step = () => {
      const mv = nextBest();
      if (!mv || document.hidden) { solving = mv ? setTimeout(step, 300) : null; render(); return; }
      doMove(mv[0], mv[1], { fast: gap * 0.9 });
      solving = status === 'playing' ? setTimeout(step, gap) : null;
      render();
    };
    solving = setTimeout(step, 50);
    render();
  }

  const starSvg = (on) => `<svg viewBox="0 0 24 24"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 21l1.6-7L2 9.2l7.1-.6z" fill="${on ? '#ffc93c' : 'var(--surface-2)'}" stroke="${on ? '#e09b00' : 'var(--line)'}" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
  function award(id, fresh) {
    if (S.ach[id]) return;
    S.ach[id] = Date.now();
    fresh.push(id);
  }
  function totalStars() { return Object.values(S.stars).reduce((a, b) => a + b, 0); }
  function checkWin() {
    if (pegs[P - 1].length !== n) return;
    status = 'won';
    if (solving) { clearTimeout(solving); solving = null; }
    tick();
    const secs = Math.round(elapsed);
    const perfect = moves === optimalN;
    const stars = assisted ? 0 : perfect ? 3 : moves <= Math.ceil(optimalN * 1.5) ? 2 : 1;
    let bm = { best: null, isNew: false };
    const fresh = [];
    if (!assisted) {
      S.stats.solved++; S.stats.moves += moves; if (perfect) S.stats.perfect++;
      award('first', fresh);
      if (perfect && n >= 5) award('flawless', fresh);
      if (perfect && n === 8) award('eight', fresh);
      if (n === 10) award('ten', fresh);
      if (mode === 'four') award('four', fresh);
      if (mode === 'cyclic') award('cyclic', fresh);
      if (kind !== 'stack' && perfect) award('scramble', fresh);
      if (n === 5 && secs < 30) award('speedy', fresh);
      if (kind === 'stack') {
        bm = Curio.best(bestKey(), moves, false);
        Curio.best(`${mode}-time-${n}`, secs, false);
        const sk = `${mode}-${n}`;
        S.stars[sk] = Math.max(S.stars[sk] || 0, stars);
      }
      if (kind === 'daily') { award('daily', fresh); S.daily[today()] = Math.min(S.daily[today()] ?? 9999, moves); }
      if (totalStars() >= 30) award('stars30', fresh);
      save();
    }
    render();
    const gid = gameId, mvs = moves;
    setTimeout(() => {
      if (gid !== gameId) return;
      stage.classList.add('won');
      for (let s = 1; s <= n; s++) discEls[s].style.animationDelay = `${(n - s) * 60}ms`;
      if (!assisted) Curio.confetti();
      [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.14, 'triangle', 0.1), i * 110));
    }, 380);
    legend(perfect ? 'Flawless. Not a single wasted move.' : `Done! ${moves - optimalN} more than the perfect ${optimalN}.`);
    setTimeout(() => {
      if (gid !== gameId) return;
      $('stars').innerHTML = [1, 2, 3].map((i) => starSvg(i <= stars)).join('');
      $('rTitle').textContent = assisted ? 'Tower moved, with help' : perfect ? 'Perfect tower!' : 'Tower moved!';
      $('rBody').textContent = assisted
        ? `Finished in ${mvs} moves with a little help. Solve it on your own to earn stars.`
        : `${mvs} moves in ${fmtT(secs)}. ${perfect ? 'That is the perfect solution!' : `The perfect solution takes ${optimalN}.`} ${bm.isNew ? 'New best!' : bm.best != null ? `Best: ${bm.best} moves.` : ''}`;
      $('rBadges').innerHTML = fresh.map((id) => { const a = ACH.find((x) => x.id === id); return `<span class="badge on new" title="${a.d}">★ ${a.name}</span>`; }).join('');
      const next = $('rNext');
      next.hidden = !(kind === 'stack' && n < maxN());
      next.textContent = `Try ${n + 1} discs`;
      $('result').hidden = false;
      (next.hidden ? $('rAgain') : next).focus({ preventScroll: true });
      paintProgress();
    }, 1300);
  }
  $('rNext').addEventListener('click', () => newGame(n + 1));
  $('rAgain').addEventListener('click', () => newGame(n));
  $('rShare').addEventListener('click', () => {
    const stars = $('stars').querySelectorAll('[fill="#ffc93c"]').length;
    const what = kind === 'daily' ? `Daily ${today()}` : `${MODES[mode].name}, ${n} discs${kind === 'scramble' ? ' (scrambled)' : ''}`;
    const txt = `Curio Tower of Hanoi · ${what}\n${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)} ${moves} moves (best possible ${optimalN}) in ${fmtT(Math.round(elapsed))}`;
    (navigator.clipboard?.writeText(txt) || Promise.reject()).then(() => Curio.toast('Result copied'), () => Curio.toast('Copy failed, sorry'));
  });

  function paintProgress() {
    const sm = $('starmap');
    let h = '<span></span>' + Array.from({ length: 8 }, (_, i) => `<span>${i + 3}</span>`).join('');
    for (const m of Object.keys(MODES)) {
      h += `<span class="sm-row">${MODES[m].name}</span>`;
      for (let k = 3; k <= 10; k++) { if (k > (m === 'cyclic' ? 7 : 10)) { h += '<span class="sm-cell none">-</span>'; continue; } const st = S.stars[`${m}-${k}`] || 0; h += `<span class="sm-cell${st ? '' : ' none'}" title="${MODES[m].name}, ${k} discs">${st ? '★'.repeat(st) : '·'}</span>`; }
    }
    sm.innerHTML = h;
    const st = S.stats;
    $('stats').innerHTML = `<div class="c-stat"><b>${st.solved}</b><span>Solved</span></div><div class="c-stat"><b>${st.perfect}</b><span>Perfect</span></div><div class="c-stat"><b>${totalStars()}</b><span>Stars</span></div><div class="c-stat"><b>${st.moves}</b><span>Moves made</span></div><div class="c-stat"><b>${st.hints}</b><span>Hints used</span></div>`;
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

  $('undo').addEventListener('click', undo);
  $('restart').addEventListener('click', () => { kind = kind === 'scramble' ? 'scramble' : kind; if (kind === 'stack') newGame(n, { quiet: true }); else restartSame(); });
  let startPegs = null;
  const origNew = newGame;
  function restartSame() {
    if (!startPegs) return newGame(n);
    stopSolve();
    gameId++;
    const sp = startPegs;
    pegs = sp.map((st) => st.slice());
    moves = 0; history = []; held = -1; assisted = false; status = 'playing'; elapsed = 0; started = false;
    stage.classList.remove('won');
    $('result').hidden = true;
    settleAll();
    legend('Back to the start of this scramble.');
    render();
  }
  newGame = (k, o) => { origNew(k, o); startPegs = pegs.map((st) => st.slice()); };
  $('hint').addEventListener('click', hint);
  $('solve').addEventListener('click', autoSolve);
  $('scramble').addEventListener('click', () => { kind = 'scramble'; newGame(n); Curio.beep(400, 0.06, 'triangle', 0.06); });
  $('daily').addEventListener('click', () => { if (mode !== 'classic') { mode = 'classic'; P = 3; buildBoard(); } kind = 'daily'; newGame(7); });
  $('howBtn').addEventListener('click', () => { const h = $('how'); h.hidden = !h.hidden; $('howBtn').setAttribute('aria-expanded', String(!h.hidden)); });
  addEventListener('resize', () => { if (!pegs) return; layout(); settleAll(); });
  addEventListener('keydown', (e) => {
    if (document.querySelector('.curio-modal') || e.metaKey || e.altKey) return;
    if (e.target.closest?.('input, select, textarea')) return;
    if (e.ctrlKey) { if (e.key === 'z') { e.preventDefault(); undo(); } return; }
    if (!$('result').hidden) return;
    const num = +e.key;
    if (num >= 1 && num <= P) { e.preventDefault(); cursor = num - 1; hits[cursor].focus({ preventScroll: true }); pressPeg(cursor); return; }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      cursor = (cursor + (e.key === 'ArrowLeft' ? P - 1 : 1)) % P;
      hits[cursor].focus({ preventScroll: true }); paintCursor();
      if (held > 0) { const s = held; animate(s, [tf(liftXY(s, cursor))], 140); }
      return;
    }
    if ((e.key === ' ' || e.key === 'Enter') && !e.target.closest('button:not(.peg-hit), summary')) { e.preventDefault(); pressPeg(cursor); return; }
    if (e.key === 'Escape') { drop(); return; }
    if (e.key === 'z' || e.key === 'Z') { undo(); return; }
    if (e.key === 'r' || e.key === 'R') $('restart').click();
    if (e.key === 'h' || e.key === 'H') hint();
  });
  stage.addEventListener('focusout', () => setTimeout(paintCursor));

  buildBoard();
  newGame(Math.min(10, Math.max(3, S.n | 0)));
  paintProgress();
  window.__hanoi = { get pegs() { return pegs; }, doMove: (a, b) => doMove(a, b), get status() { return status; }, get moves() { return moves; }, get optimal() { return optimalN; }, nextBest, newGame: (k) => newGame(k), setMode: (m) => { mode = m; P = MODES[m].P; buildBoard(); }, setKind: (k) => { kind = k; } };
})();
