'use strict';
const FlowGen = (() => {
  function rngf(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function generate(n, seed) {
    const rand = rngf(seed);
    const N = n * n;
    const nbs = (i) => { const x = i % n, y = (i / n) | 0, o = []; if (y > 0) o.push(i - n); if (x < n - 1) o.push(i + 1); if (y < n - 1) o.push(i + n); if (x > 0) o.push(i - 1); return o; };
    const maxK = Math.min(12, n + 3), minK = Math.max(3, n - 1);
    for (let attempt = 0; attempt < 3000; attempt++) {
      const g = new Int16Array(N).fill(-1);
      let c = 0, ok = true, filled = 0;
      const emptyN = (i) => nbs(i).filter((j) => g[j] < 0).length;
      while (filled < N) {
        let best = [], bv = 9;
        for (let i = 0; i < N; i++) if (g[i] < 0) { const e = emptyN(i); if (e < bv) { bv = e; best = [i]; } else if (e === bv) best.push(i); }
        const start = best[(rand() * best.length) | 0];
        const path = [start]; g[start] = c; filled++;
        const target = 3 + Math.floor(rand() * (n * 1.6));
        while (path.length < target) {
          const h = path[path.length - 1];
          const cands = nbs(h).filter((v) => g[v] < 0 && nbs(v).every((w) => w === h || g[w] !== c));
          if (!cands.length) break;
          let pick;
          if (rand() < 0.75) { let m = 9; for (const v of cands) { const e = emptyN(v); if (e < m) { m = e; pick = [v]; } else if (e === m) pick.push(v); } pick = pick[(rand() * pick.length) | 0]; }
          else pick = cands[(rand() * cands.length) | 0];
          path.push(pick); g[pick] = c; filled++;
        }
        if (path.length < 3) {
          let merged = false;
          for (let d = 0; d < c && !merged; d++) {
            const cells = []; for (let i = 0; i < N; i++) if (g[i] === d) cells.push(i);
            const ends = cells.filter((i) => nbs(i).filter((j) => g[j] === d).length === 1);
            for (const e of ends) {
              const seq = nbs(e).includes(path[0]) ? path : nbs(e).includes(path[path.length - 1]) ? path.slice().reverse() : null;
              if (!seq) continue;
              for (const v of path) g[v] = -2;
              let fine = true; let prev = e;
              for (const v of seq) { if (nbs(v).some((w) => w !== prev && g[w] === d)) { fine = false; break; } g[v] = d; prev = v; }
              if (fine) { merged = true; break; }
              for (const v of path) g[v] = c;
            }
          }
          if (!merged) { ok = false; break; }
          continue;
        }
        c++;
      }
      if (!ok || c > maxK || c < minK) continue;
      let ok2 = true;
      for (let d = 0; d < c; d++) { let e = 0; for (let i = 0; i < N; i++) if (g[i] === d) { const k = nbs(i).filter((j) => g[j] === d).length; if (k === 1) e++; else if (k !== 2) ok2 = false; } if (e !== 2) ok2 = false; }
      if (!ok2) continue;
      return { str: [...g].map((v) => String.fromCharCode(97 + v)).join(''), k: c, attempt };
    }
    return null;
  }
  return { generate };
})();

(() => {
  const $ = (id) => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  const COLORS = ['#ff4d4d', '#3ddc65', '#3d8bff', '#ffe03d', '#ff9a2e', '#2ee6e6', '#ff4fb3', '#c8a27a', '#a35cff', '#f2f2f2', '#9be564', '#7486ff'];
  const NAMES = ['red', 'green', 'blue', 'yellow', 'orange', 'cyan', 'pink', 'tan', 'purple', 'white', 'lime', 'indigo'];
  const SYMS = ['●', '▲', '■', '◆', '★', '✚', '♥', '♣', '♠', '✿', '☾', '⬢'];
  const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26];
  const SIZES = [5, 6, 7, 8, 9, 10];
  const PER = 20;
  const LV = window.FLOW_LEVELS;
  const ACH = [
    { id: 'first', name: 'Connected', d: 'Solve any board' },
    { id: 'perfect', name: 'Perfect Flow', d: 'Solve with one move per colour' },
    { id: 'perfect10', name: 'Flow State', d: 'Ten perfect solves' },
    { id: 'big', name: 'Big Picture', d: 'Solve a 10×10 board' },
    { id: 'colors12', name: 'Full Spectrum', d: 'Solve a board with 12 colours' },
    { id: 'pack', name: 'Pack Leader', d: 'Solve all 20 levels of one size' },
    { id: 'daily', name: 'Daily Flow', d: 'Solve the daily board' },
    { id: 'endless5', name: 'Endless Stream', d: 'Solve 5 endless boards' },
    { id: 'speedy', name: 'Rapids', d: 'Solve a 7×7 in under 40 seconds' },
    { id: 'nohint', name: 'Pipe Dream', d: 'Solve a 9×9 or bigger without hints' }
  ];
  const SKEY = 'flow2';
  const loadS = () => {
    const base = { v: 1, done: {}, ach: {}, stats: { solved: 0, perfect: 0, endless: 0, hints: 0, cells: 0 }, symbols: false, glow: true, mode: 'levels', daily: {} };
    const d = Curio.store.get(SKEY, null);
    const s = d && typeof d === 'object' && d.v === 1 ? { ...base, ...d, stats: { ...base.stats, ...(d.stats || {}) } } : base;
    if (!d) { const old = Curio.store.get('flow:done', {}); if (old && typeof old === 'object') for (const k in old) s.done[k] = old[k]; }
    return s;
  };
  const S = loadS();
  const save = () => Curio.store.set(SKEY, S);
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const svg = $('board'), seg = $('seg'), picker = $('picker'), bw = $('bw');
  let mode = ['levels', 'daily', 'endless'].includes(S.mode) ? S.mode : 'levels';
  let n = 5, li = 0, sol, k, ends, paths, history = [], status = 'playing', moves = 0, lastColor = -1, gameId = 0;
  let elapsed = 0, t0 = 0, started = false, hints = 0, drag = null, kc = 0, kHold = false, solPaths, endlessSeed = 1;
  let layers = {};

  SIZES.forEach((s) => {
    const b = document.createElement('button');
    b.type = 'button'; b.dataset.n = s; b.textContent = `${s}×${s}`;
    b.addEventListener('click', () => { n = s; if (mode === 'levels') { const first = Array.from({ length: PER }, (_, i) => i).find((i) => S.done[`${n}-${i}`] == null); load(first == null ? 0 : first); } else load(0); });
    seg.append(b);
  });
  const levelString = (size, i) => {
    if (LV[size] && i < LV[size].length) return LV[size][i];
    return FlowGen.generate(size, size * 1000 + i * 17 + 3).str;
  };
  const fmtT = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const el = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const a in attrs) e.setAttribute(a, attrs[a]); if (parent) parent.append(e); return e; };
  const nbs = (i) => { const x = i % n, y = Math.floor(i / n), o = []; if (y > 0) o.push(i - n); if (x < n - 1) o.push(i + 1); if (y < n - 1) o.push(i + n); if (x > 0) o.push(i - 1); return o; };
  const adj = (a, b) => nbs(a).includes(b);
  const center = (i) => [(i % n) * 100 + 50, Math.floor(i / n) * 100 + 50];
  const keyOf = () => (mode === 'levels' ? `${n}-${li}` : mode === 'daily' ? `daily-${today()}` : null);
  const note = (c, oct = 1, dur = 0.06, vol = 0.05) => Curio.beep(262 * 2 ** (PENTA[c % 12] / 12) * oct, dur, 'triangle', vol);

  function paintModes() {
    document.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
    seg.hidden = mode === 'daily';
    picker.hidden = mode !== 'levels';
    $('next').querySelector('i').nextSibling.textContent = mode === 'endless' ? 'New' : 'Next';
  }
  function paintPicker() {
    if (mode !== 'levels') return;
    picker.innerHTML = '';
    let firstOpen = PER;
    for (let i = 0; i < PER; i++) if (S.done[`${n}-${i}`] == null) { firstOpen = i; break; }
    for (let i = 0; i < PER; i++) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'pk'; b.textContent = i + 1;
      const best = S.done[`${n}-${i}`];
      if (best != null) { b.classList.add('done'); if (best.perfect || best === true) b.classList.add('perfect'); }
      b.disabled = best == null && i > firstOpen + 2;
      b.setAttribute('aria-current', String(i === li));
      b.setAttribute('aria-label', `Level ${i + 1}${best != null ? ', solved' : ''}`);
      b.addEventListener('click', () => load(i));
      picker.append(b);
    }
  }
  function load(i) {
    gameId++;
    li = i;
    let s;
    if (mode === 'levels') { Curio.store.set('flow:last', { n, li }); s = levelString(n, li); }
    else if (mode === 'daily') { n = 8; s = FlowGen.generate(8, [...today()].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261)).str; }
    else { endlessSeed = (Math.random() * 2 ** 31) | 0; s = FlowGen.generate(n, endlessSeed).str; }
    const letters = [...new Set(s)];
    sol = [...s].map((ch) => letters.indexOf(ch));
    k = letters.length;
    ends = Array.from({ length: k }, () => []);
    for (let c = 0; c < n * n; c++) if (nbs(c).filter((j) => sol[j] === sol[c]).length === 1) ends[sol[c]].push(c);
    solPaths = ends.map((e, c) => { const p = [e[0]]; while (p[p.length - 1] !== e[1]) { const h = p[p.length - 1]; p.push(nbs(h).find((j) => sol[j] === c && j !== p[p.length - 2])); } return p; });
    paths = Array.from({ length: k }, () => []);
    history = []; status = 'playing'; moves = 0; lastColor = -1; elapsed = 0; started = false; hints = 0; drag = null; kHold = false;
    kc = ends[0][0];
    bw.classList.remove('won');
    $('result').hidden = true;
    build();
    [...seg.children].forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.n === n)));
    paintModes();
    paintPicker();
    msg(mode === 'daily' ? `Today's board: ${k} colours on 8×8, the same for everyone.` : mode === 'endless' ? `A fresh ${n}×${n} board with ${k} colours, straight from the generator.` : n === 5 && li === 0 ? 'Drag from a dot to its twin. Then fill every gap!' : `${k} colours to connect.`);
    render();
  }
  function build() {
    svg.innerHTML = '';
    svg.setAttribute('viewBox', `0 0 ${n * 100} ${n * 100}`);
    const defs = el('defs', {}, svg);
    COLORS.forEach((c, i) => {
      const g = el('radialGradient', { id: `dg${i}`, cx: '35%', cy: '30%', r: '75%' }, defs);
      el('stop', { offset: '0', 'stop-color': '#ffffff', 'stop-opacity': '.9' }, g);
      el('stop', { offset: '.35', 'stop-color': c }, g);
      el('stop', { offset: '1', 'stop-color': c, 'stop-opacity': '.85' }, g);
    });
    const bg = el('g', {}, svg);
    for (let i = 0; i < n * n; i++) el('rect', { x: (i % n) * 100 + 4, y: Math.floor(i / n) * 100 + 4, width: 92, height: 92, rx: 12, class: 'cellbg' }, bg);
    layers.tint = el('g', {}, svg);
    const grid = el('g', {}, svg);
    for (let t = 1; t < n; t++) { el('line', { x1: t * 100, y1: 0, x2: t * 100, y2: n * 100, class: 'gl' }, grid); el('line', { x1: 0, y1: t * 100, x2: n * 100, y2: t * 100, class: 'gl' }, grid); }
    layers.tints = Array.from({ length: n * n }, (_, i) => el('rect', { x: (i % n) * 100 + 2, y: Math.floor(i / n) * 100 + 2, width: 96, height: 96, rx: 6, class: 'tint', 'fill-opacity': 0 }, layers.tint));
    const pg = el('g', { class: S.glow ? 'glow' : '' }, svg);
    layers.pg = pg;
    layers.pipes = Array.from({ length: k }, (_, c) => { const p = el('polyline', { class: 'pipe', stroke: COLORS[c] }, pg); p.style.setProperty('--c', COLORS[c]); return p; });
    layers.his = Array.from({ length: k }, () => el('polyline', { class: 'pipe-hi' }, svg));
    layers.flows = Array.from({ length: k }, () => el('polyline', { class: 'pipe-flow' }, svg));
    layers.dots = []; layers.rings = [];
    const dg = el('g', { class: S.glow ? 'glow' : '' }, svg);
    layers.dg = dg;
    ends.forEach((e, c) => e.forEach((i) => {
      const [x, y] = center(i);
      const r = el('circle', { cx: x, cy: y, r: 33, stroke: COLORS[c], class: 'dot-ring idle', 'data-c': c }, svg);
      r.style.animationDelay = `${(c * 0.37) % 2.4}s`;
      layers.rings.push(r);
      const d = el('circle', { cx: x, cy: y, r: 33, fill: `url(#dg${c})`, class: 'dot', 'data-c': c }, dg);
      d.style.setProperty('--c', COLORS[c]);
      layers.dots.push(d);
      if (S.symbols) { const t = el('text', { x, y: y + 2, class: 'sym' }, svg); t.textContent = SYMS[c]; }
    }));
    layers.finger = el('circle', { r: 70, class: 'finger', cx: -200, cy: -200 }, svg);
    layers.kcur = el('rect', { width: 90, height: 90, rx: 14, class: 'kcur' }, svg);
  }
  function owner() {
    const o = new Int16Array(n * n).fill(-1);
    paths.forEach((p, c) => p.forEach((i) => { o[i] = c; }));
    return o;
  }
  const complete = (c) => paths[c].length > 1 && ends[c].includes(paths[c][0]) && ends[c].includes(paths[c][paths[c].length - 1]) && paths[c][0] !== paths[c][paths[c].length - 1];
  function msg(t) { $('msg').textContent = t; }
  const wasComplete = [];
  function render() {
    const o = owner();
    let covered = 0;
    for (let i = 0; i < n * n; i++) {
      const c = o[i] >= 0 && paths[o[i]].length > 1 ? o[i] : -1;
      if (c >= 0) covered++;
      layers.tints[i].setAttribute('fill', c >= 0 ? COLORS[c] : 'none');
      layers.tints[i].setAttribute('fill-opacity', c >= 0 ? (complete(c) ? 0.3 : 0.16) : 0);
    }
    paths.forEach((p, c) => {
      const pts = p.map((i) => center(i).join(',')).join(' ');
      layers.pipes[c].setAttribute('points', pts);
      layers.his[c].setAttribute('points', pts);
      layers.flows[c].setAttribute('points', pts);
      const comp = complete(c);
      layers.flows[c].classList.toggle('on', comp);
      if (comp && !wasComplete[c]) layers.rings.filter((r) => +r.dataset.c === c).forEach((r) => { r.classList.remove('idle', 'burst'); void r.getBBox(); r.classList.add('burst'); });
      if (!comp && wasComplete[c]) layers.rings.filter((r) => +r.dataset.c === c).forEach((r) => { r.classList.remove('burst'); r.classList.add('idle'); });
      wasComplete[c] = comp;
    });
    let done = 0; for (let c = 0; c < k; c++) if (complete(c)) done++;
    const pct = Math.round((covered / (n * n)) * 100);
    $('flows').textContent = `${done}/${k}`;
    const mv = $('moves');
    if (mv.textContent !== String(moves)) { mv.textContent = moves; mv.classList.add('bump'); setTimeout(() => mv.classList.remove('bump'), 120); }
    $('pct').textContent = `${pct}%`;
    $('bar').style.width = `${pct}%`;
    $('time').textContent = fmtT(elapsed);
    const kk = keyOf();
    const b = kk ? Curio.getBest(`time-${kk}`) : null;
    $('best').textContent = b == null ? '-' : fmtT(b);
    $('undo').disabled = !history.length || status !== 'playing';
    $('hint').disabled = status !== 'playing';
    $('next').disabled = mode === 'daily' || (mode === 'levels' && li >= PER - 1 && n === 10);
    const [kx, ky] = center(kc);
    layers.kcur.setAttribute('x', kx - 45); layers.kcur.setAttribute('y', ky - 45);
    layers.kcur.style.stroke = kHold && drag ? COLORS[drag.c] : '#fff';
    return { done, covered };
  }
  function cellAt(e) {
    const r = svg.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / r.width) * n), y = Math.floor(((e.clientY - r.top) / r.height) * n);
    if (x < 0 || y < 0 || x >= n || y >= n) return -1;
    return y * n + x;
  }
  function begin(i) {
    if (status !== 'playing') return false;
    const o = owner();
    let c = -1;
    const endC = ends.findIndex((e) => e.includes(i));
    if (endC >= 0) {
      c = endC;
      drag = { c, base: paths.map((p) => p.slice()), before: JSON.stringify(paths) };
      const cont = paths[c].length > 1 && paths[c][paths[c].length - 1] === i && !complete(c);
      if (!cont) paths[c] = [i];
    } else if (o[i] >= 0) {
      c = o[i];
      drag = { c, base: paths.map((p) => p.slice()), before: JSON.stringify(paths) };
      paths[c] = paths[c].slice(0, paths[c].indexOf(i) + 1);
    } else return false;
    if (!started) { started = true; t0 = performance.now(); }
    drag.base[c] = [];
    layers.pipes[c].style.strokeWidth = '40';
    note(c, 1, 0.05, 0.05);
    render();
    return true;
  }
  function stepTo(j) {
    const c = drag.c, p = paths[c];
    const h = p[p.length - 1];
    if (j === h) return;
    if (!adj(h, j)) return;
    const at = p.indexOf(j);
    if (at >= 0) { paths[c] = p.slice(0, at + 1); recut(); return; }
    if (complete(c)) return;
    const endOther = ends.findIndex((e, cc) => cc !== c && e.includes(j));
    if (endOther >= 0) return;
    p.push(j);
    recut();
    if (complete(c)) { note(c, 2, 0.1, 0.08); setTimeout(() => note(c + 2, 2, 0.1, 0.06), 70); navigator.vibrate?.(12); }
    else Curio.beep(420 + Math.min(p.length, 30) * 12, 0.025, 'sine', 0.03);
  }
  function recut() {
    const mine = new Set(paths[drag.c]);
    for (let d = 0; d < k; d++) {
      if (d === drag.c) continue;
      const bp = drag.base[d];
      const cut = bp.findIndex((i) => mine.has(i));
      paths[d] = cut < 0 ? bp.slice() : bp.slice(0, cut);
      if (paths[d].length === 1 && !ends[d].includes(paths[d][0])) paths[d] = [];
    }
  }
  function moveTo(j) {
    if (!drag || j < 0) return;
    let guard = 0;
    while (guard++ < 30) {
      const p = paths[drag.c], h = p[p.length - 1];
      if (h === j) break;
      const hx = h % n, hy = Math.floor(h / n), jx = j % n, jy = Math.floor(j / n);
      const next = Math.abs(jx - hx) >= Math.abs(jy - hy) ? h + Math.sign(jx - hx) : h + Math.sign(jy - hy) * n;
      const before = p.length + ':' + p[p.length - 1];
      stepTo(next);
      const q = paths[drag.c];
      if (q.length + ':' + q[q.length - 1] === before) break;
    }
    render();
  }
  function finish() {
    if (!drag) return;
    const c = drag.c;
    layers.pipes[c].style.strokeWidth = '';
    const changed = JSON.stringify(paths) !== drag.before;
    if (paths[c].length === 1) paths[c] = [];
    if (changed) {
      history.push(JSON.parse(drag.before));
      if (c !== lastColor) { moves++; lastColor = c; }
    }
    drag = null;
    layers.finger.setAttribute('cx', -200);
    render();
    if (changed) checkWin();
  }
  let dragIgnore = false;
  const fingerAt = (p) => { const r = svg.getBoundingClientRect(); layers.finger.setAttribute('cx', (p.x / r.width) * n * 100); layers.finger.setAttribute('cy', (p.y / r.height) * n * 100); };
  const cellXY = (p) => { const r = svg.getBoundingClientRect(); return [Math.floor((p.x / r.width) * n), Math.floor((p.y / r.height) * n)]; };
  Curio.drag(svg, {
    start(p) {
      dragIgnore = true;
      if (drag) return;
      const [x, y] = cellXY(p);
      if (x < 0 || y < 0 || x >= n || y >= n) return;
      const i = y * n + x;
      if (!begin(i)) return;
      dragIgnore = false;
      p.event.preventDefault();
      kc = i; kHold = false;
      if (p.pointerType !== 'mouse' || Curio.touchpad) { layers.finger.setAttribute('fill', COLORS[drag.c]); fingerAt(p); }
    },
    move(p) {
      if (dragIgnore || !drag || kHold) return;
      if (p.pointerType !== 'mouse' || Curio.touchpad) fingerAt(p);
      const [x0, y0] = cellXY(p);
      moveTo(Math.max(0, Math.min(n - 1, y0)) * n + Math.max(0, Math.min(n - 1, x0)));
    },
    end() { if (!dragIgnore && drag && !kHold) finish(); }
  });
  addEventListener('pointerup', () => { if (dragIgnore && Curio.touchpad) { dragIgnore = false; dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); } });
  if (!Curio.touchpad && matchMedia('(pointer: fine)').matches && !Curio.store.get('tpTip', false)) { Curio.store.set('tpTip', true); setTimeout(() => Curio.toast('Tip: on a touchpad, turn on Touchpad mode in the top bar to draw with click, move, click'), 1500); }
  function undo() {
    if (!history.length || status !== 'playing' || drag) return;
    paths = history.pop();
    Curio.beep(330, 0.05, 'sine', 0.06);
    render();
  }
  function hint() {
    if (status !== 'playing' || drag) return;
    const wrong = [];
    for (let c = 0; c < k; c++) {
      const p = paths[c], sp = solPaths[c];
      const okp = p.length === sp.length && (p.every((v, i) => v === sp[i]) || p.every((v, i) => v === sp[sp.length - 1 - i]));
      if (!okp) wrong.push(c);
    }
    if (!wrong.length) return;
    const c = wrong.sort((a, b) => solPaths[b].length - solPaths[a].length)[0];
    history.push(paths.map((p) => p.slice()));
    if (!started) { started = true; t0 = performance.now(); }
    drag = { c, base: paths.map((p) => p.slice()) };
    drag.base[c] = [];
    paths[c] = solPaths[c].slice();
    recut();
    drag = null;
    hints++; S.stats.hints++;
    msg(`Here is where the ${NAMES[c]} pipe goes.`);
    layers.pipes[c].animate([{ opacity: 0.2 }, { opacity: 1 }], { duration: 300, iterations: 3 });
    Curio.beep(880, 0.08, 'sine', 0.06);
    render();
    checkWin();
  }
  const starSvg = (on) => `<svg viewBox="0 0 24 24"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 21l1.6-7L2 9.2l7.1-.6z" fill="${on ? '#ffc93c' : 'var(--surface-2)'}" stroke="${on ? '#e09b00' : 'var(--line)'}" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
  function award(id, fresh) { if (!S.ach[id]) { S.ach[id] = Date.now(); fresh.push(id); } }
  function checkWin() {
    const { done, covered } = render();
    if (done < k) return;
    if (covered < n * n) { msg(`All ${k} pairs linked! Now stretch the pipes to fill the ${n * n - covered} empty square${n * n - covered > 1 ? 's' : ''}.`); return; }
    status = 'won';
    tick();
    const secs = Math.round(elapsed);
    const perfect = moves <= k && !hints;
    const st = hints ? 1 : perfect ? 3 : moves <= k + 3 ? 2 : 1;
    const fresh = [];
    S.stats.solved++; S.stats.cells += n * n;
    if (perfect) S.stats.perfect++;
    award('first', fresh);
    if (perfect) award('perfect', fresh);
    if (S.stats.perfect >= 10) award('perfect10', fresh);
    if (n === 10) award('big', fresh);
    if (k >= 12) award('colors12', fresh);
    if (n === 7 && secs < 40) award('speedy', fresh);
    if (n >= 9 && !hints) award('nohint', fresh);
    const kk = keyOf();
    let bt = { best: null, isNew: false };
    if (mode === 'levels') {
      const prev = S.done[kk];
      S.done[kk] = { m: Math.min(moves, prev && prev.m != null ? prev.m : 999), perfect: !!(perfect || (prev && prev.perfect)) };
      if (Array.from({ length: PER }, (_, i) => S.done[`${n}-${i}`] != null).every(Boolean)) award('pack', fresh);
    }
    if (mode === 'daily') { award('daily', fresh); S.daily[today()] = secs; }
    if (mode === 'endless') { S.stats.endless++; if (S.stats.endless >= 5) award('endless5', fresh); }
    if (kk && !hints) bt = Curio.best(`time-${kk}`, secs, false);
    save();
    bw.classList.add('won');
    paths.forEach((p, c) => { layers.pipes[c].style.setProperty('--d', `${c * 90}ms`); });
    layers.dots.forEach((dt) => dt.style.setProperty('--d', `${+dt.dataset.c * 90}ms`));
    Curio.confetti();
    navigator.vibrate?.([20, 40, 20]);
    for (let c = 0; c < Math.min(k, 6); c++) setTimeout(() => note(c * 2, 2, 0.14, 0.07), c * 90);
    msg(perfect ? 'Perfect! One move per colour.' : 'Board full, every pair flowing.');
    render(); paintPicker();
    const gid = gameId;
    setTimeout(() => {
      if (gid !== gameId) return;
      $('rStars').innerHTML = [1, 2, 3].map((i) => starSvg(i <= st)).join('');
      $('rTitle').textContent = perfect ? 'Perfect flow!' : mode === 'daily' ? 'Daily board done!' : 'Level complete!';
      $('rBody').textContent = `${n}×${n}${mode === 'levels' ? ` level ${li + 1}` : ''} in ${fmtT(secs)} and ${moves} move${moves === 1 ? '' : 's'}${hints ? ` (${hints} hint${hints > 1 ? 's' : ''})` : ''}. ${perfect ? 'That is a perfect score!' : `Perfect is ${k}.`} ${bt.isNew ? 'New best time!' : ''}`;
      $('rBadges').innerHTML = fresh.map((id) => { const a = ACH.find((x) => x.id === id); return `<span class="badge on new" title="${a.d}">★ ${a.name}</span>`; }).join('');
      const nx = $('rNext');
      nx.hidden = mode === 'daily' || (mode === 'levels' && li >= PER - 1 && n === 10);
      nx.textContent = mode === 'endless' ? 'Another board' : 'Next level';
      $('result').hidden = false;
      (nx.hidden ? $('rAgain') : nx).focus({ preventScroll: true });
      paintProgress();
    }, 1200);
  }
  function nextLevel() {
    if (mode === 'endless') { load(0); return; }
    if (mode !== 'levels') return;
    if (li < PER - 1) load(li + 1);
    else if (n < 10) { n++; load(0); }
  }
  $('rNext').addEventListener('click', nextLevel);
  $('rAgain').addEventListener('click', () => { if (mode === 'endless') { $('result').hidden = true; return; } load(li); });
  $('rShare').addEventListener('click', () => {
    const st = $('rStars').querySelectorAll('[fill="#ffc93c"]').length;
    const what = mode === 'daily' ? `Daily ${today()}` : mode === 'endless' ? `Endless ${n}×${n}` : `${n}×${n} level ${li + 1}`;
    const txt = `Curio Flow · ${what}\n${'⭐'.repeat(st)}${'☆'.repeat(3 - st)} ${moves} moves for ${k} colours in ${fmtT(Math.round(elapsed))}`;
    (navigator.clipboard?.writeText(txt) || Promise.reject()).then(() => Curio.toast('Result copied'), () => Curio.toast('Copy failed, sorry'));
  });
  function paintProgress() {
    const st = S.stats;
    $('stats').innerHTML = `<div class="c-stat"><b>${st.solved}</b><span>Solved</span></div><div class="c-stat"><b>${st.perfect}</b><span>Perfect</span></div><div class="c-stat"><b>${Object.keys(S.done).length}/${SIZES.length * PER}</b><span>Levels</span></div><div class="c-stat"><b>${st.cells}</b><span>Squares filled</span></div><div class="c-stat"><b>${st.hints}</b><span>Hints</span></div>`;
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
  svg.addEventListener('keydown', (e) => {
    if (document.querySelector('.curio-modal') || e.metaKey || e.altKey || e.ctrlKey) return;
    const mv = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key];
    if (mv) {
      e.preventDefault();
      const x = kc % n + mv[0], y = Math.floor(kc / n) + mv[1];
      if (x < 0 || y < 0 || x >= n || y >= n) return;
      kc = y * n + x;
      if (kHold && drag) { moveTo(kc); const p = paths[drag.c]; kc = p[p.length - 1]; if (complete(drag.c)) { kHold = false; finish(); } }
      render(); return;
    }
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (kHold && drag) { kHold = false; finish(); }
      else if (begin(kc)) { kHold = true; render(); }
      return;
    }
    if (e.key === 'Escape' && kHold) { kHold = false; finish(); }
  });
  addEventListener('keydown', (e) => {
    if (document.querySelector('.curio-modal') || e.metaKey || e.altKey) return;
    if (e.target.closest?.('input, select, textarea')) return;
    if (e.key === 'z' || e.key === 'Z') { e.preventDefault(); undo(); }
    else if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && mode !== 'endless') load(li);
    else if ((e.key === 'h' || e.key === 'H') && !e.ctrlKey) hint();
  });
  $('undo').addEventListener('click', undo);
  $('restart').addEventListener('click', () => { if (mode === 'endless') { paths = paths.map(() => []); history = []; moves = 0; lastColor = -1; render(); } else load(li); });
  $('hint').addEventListener('click', hint);
  $('next').addEventListener('click', nextLevel);
  document.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => { mode = b.dataset.mode; S.mode = mode; save(); if (mode === 'levels') { const last = Curio.store.get('flow:last', null); if (last && SIZES.includes(last.n)) { n = last.n; load(Math.min(PER - 1, last.li)); return; } } load(0); }));
  $('symbols').checked = !!S.symbols;
  $('glow').checked = S.glow !== false;
  $('symbols').addEventListener('change', (e) => { S.symbols = e.target.checked; save(); const keep = { paths, status }; build(); paths = keep.paths; render(); });
  $('glow').addEventListener('change', (e) => { S.glow = e.target.checked; save(); layers.pg.classList.toggle('glow', S.glow); layers.dg.classList.toggle('glow', S.glow); });

  paintModes();
  const last = Curio.store.get('flow:last', null);
  if (mode === 'levels' && last && SIZES.includes(last.n) && last.li >= 0 && last.li < PER) { n = last.n; load(last.li); } else load(0);
  paintProgress();
  window.__flow = { get sol() { return sol; }, get ends() { return ends; }, get solPaths() { return solPaths; }, get paths() { return paths; }, get status() { return status; }, load, get n() { return n; }, set n(v) { n = v; }, setMode: (m) => { mode = m; }, begin, moveTo, finish, gen: FlowGen.generate };
})();
