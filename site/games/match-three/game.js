(() => {
  const $ = (id) => document.getElementById(id);
  const N = 8, K = 6;
  const NAMES = ['ruby', 'amber', 'star', 'emerald', 'sapphire', 'amethyst'];
  const WORLDS = window.GS_WORLDS || [];
  const LEVELS = window.GS_LEVELS || [];
  const star = Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 20 : 46; return `${(50 + Math.cos(a) * r).toFixed(1)},${(53 + Math.sin(a) * r).toFixed(1)}`; }).join(' ');
  const starIn = Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 10 : 24; return `${(50 + Math.cos(a) * r).toFixed(1)},${(53 + Math.sin(a) * r).toFixed(1)}`; }).join(' ');
  const SHAPES = [
    ['<rect x="9" y="9" width="82" height="82" rx="18"/>', '<rect x="27" y="27" width="46" height="46" rx="8"/>', 'M9 9L27 27M91 9L73 27M9 91L27 73M91 91L73 73'],
    ['<circle cx="50" cy="50" r="43"/>', '<circle cx="50" cy="50" r="24"/>', 'M50 7V26M50 74V93M7 50H26M74 50H93'],
    [`<polygon points="${star}" stroke-linejoin="round"/>`, `<polygon points="${starIn}"/>`, ''],
    ['<polygon points="50,4 95,50 50,96 5,50" stroke-linejoin="round"/>', '<polygon points="50,26 72,50 50,74 28,50"/>', 'M50 4V26M95 50H72M50 96V74M5 50H28'],
    ['<polygon points="27,8 73,8 96,50 73,92 27,92 4,50" stroke-linejoin="round"/>', '<polygon points="38,30 62,30 74,50 62,70 38,70 26,50"/>', 'M27 8L38 30M73 8L62 30M96 50H74M73 92L62 70M27 92L38 70M4 50H26'],
    ['<polygon points="50,6 96,90 4,90" stroke-linejoin="round"/>', '<polygon points="50,40 70,78 30,78"/>', 'M50 6V40M96 90L70 78M4 90L30 78']
  ];
  const STROKE = ['#8e0f27', '#a85200', '#a87a00', '#0d6b31', '#0b3d80', '#5a1470'];
  const svgFor = (k) => `<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="url(#g${k})" stroke="${STROKE[k]}" stroke-width="4">${SHAPES[k][0]}</g><g fill="#fff" opacity=".22">${SHAPES[k][1]}</g><path d="${SHAPES[k][2]}" stroke="#fff" stroke-opacity=".28" stroke-width="2.5" fill="none"/><ellipse cx="36" cy="30" rx="13" ry="8" fill="#fff" opacity=".55" transform="rotate(-30 36 30)"/><circle cx="70" cy="66" r="3" fill="#fff" opacity=".7"/></svg>`;
  const crateSvg = (hp) => `<svg viewBox="0 0 100 100" aria-hidden="true"><rect x="6" y="6" width="88" height="88" rx="10" fill="#c98a4b" stroke="#6b4423" stroke-width="5"/><path d="M8 36h84M8 64h84" stroke="#8a5a2b" stroke-width="4"/><path d="M14 86L86 14" stroke="#a46b35" stroke-width="12"/><path d="M14 86L86 14" stroke="#6b4423" stroke-width="3" stroke-dasharray="1 0"/><g fill="#5a3a1a"><circle cx="16" cy="16" r="3"/><circle cx="84" cy="16" r="3"/><circle cx="16" cy="84" r="3"/><circle cx="84" cy="84" r="3"/></g>${hp > 1 ? '<g fill="#9aa4b8" stroke="#4d5260" stroke-width="2"><path d="M6 6h26v8H14v18H6z"/><path d="M94 6H68v8h18v18h8z"/><path d="M6 94h26v-8H14V68H6z"/><path d="M94 94H68v-8h18V68h8z"/></g>' : ''}</svg>`;
  const lockSvg = '<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke-linecap="round"><path d="M6 6L94 94M94 6L6 94" stroke="#4d5260" stroke-width="12"/><path d="M6 6L94 94M94 6L6 94" stroke="#c9ced8" stroke-width="7" stroke-dasharray="11 6"/></g><rect x="33" y="44" width="34" height="28" rx="6" fill="#ffc233" stroke="#8a5a00" stroke-width="4"/><path d="M40 44v-8a10 10 0 0 1 20 0v8" fill="none" stroke="#8a5a00" stroke-width="5"/><circle cx="50" cy="57" r="4" fill="#8a5a00"/></svg>';
  const iceIcon = '<svg viewBox="0 0 100 100" aria-hidden="true"><rect x="8" y="8" width="84" height="84" rx="16" fill="#cdeeff" stroke="#5ab4ff" stroke-width="6"/><path d="M26 30q10-8 22-6M30 70l14-14 8 6 16-18" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/></svg>';
  const ACH = [
    ['first', '💎', 'First sparkle', 'Clear level 1'],
    ['three', '⭐', 'Superstar', 'Get three stars on a level'],
    ['w0', '🌼', 'Meadow master', 'Clear every Meadow level'],
    ['w1', '❄️', 'Ice breaker', 'Clear every Frost Peak level'],
    ['w2', '📦', 'Crate crusher', 'Clear every Old Quarry level'],
    ['w3', '⛓️', 'Chain breaker', 'Clear every Iron Vault level'],
    ['w4', '🌠', 'Starfall legend', 'Clear every Starfall level'],
    ['bomb', '🌈', 'Colour bomber', 'Create a colour bomb'],
    ['nova', '💥', 'Supernova', 'Swap two colour bombs together'],
    ['cascade', '🌊', 'Cascade', 'Chain a 5-step cascade'],
    ['blitz10', '⏱️', 'Quick hands', 'Score 10,000 in Blitz'],
    ['blitz25', '🚀', 'Blitz master', 'Score 25,000 in Blitz'],
    ['hammer', '🔨', 'Smash', 'Use the hammer'],
    ['stars100', '🏆', 'Constellation', 'Collect 100 stars']
  ];

  const SAVE_V = 2;
  const load = () => {
    const base = { v: SAVE_V, stars: Curio.store.get('gs:stars', {}) || {}, max: Math.max(0, Curio.store.get('gs:max', 0) | 0), level: Math.max(0, Curio.store.get('gs:level', 0) | 0), hammers: 3, shuffles: 3, blitzBest: 0, ach: {}, seenIntro: {} };
    const raw = Curio.store.get('gs:v2', null);
    if (!raw || raw.v !== SAVE_V) return base;
    return { ...base, ...raw, stars: raw.stars || {}, ach: raw.ach || {}, seenIntro: raw.seenIntro || {} };
  };
  const save = load();
  save.max = Math.min(save.max, LEVELS.length - 1);
  const persist = () => Curio.store.set('gs:v2', save);

  const board = $('board'), cur = $('cur');
  let grid = [], cells = [], els = {}, level = 0;
  let def, moves, score, need, busy = false, sel = -1, idleTimer = 0, over = true, nextId = 1, kbCur = 27, kbMode = false;
  let blitz = false, timeLeft = 0, blitzTimer = 0, hammerMode = false, maxCascade = 0, lastT = 0;
  document.addEventListener('visibilitychange', () => { lastT = performance.now(); });

  const rc = (i) => [Math.floor(i / N), i % N];
  const colorAt = (g, i) => (g[i] && g[i].s !== 'color' ? g[i].k : -1);
  const playable = (i) => !cells[i].hole && !cells[i].crate;
  const movable = (i) => !!grid[i] && !cells[i].lock;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const buzz = (ms) => { try { navigator.vibrate?.(ms); } catch {} };

  function makeGem(k, s = null) {
    const el = document.createElement('div');
    el.className = 'gem';
    el.innerHTML = '<div class="in"></div>';
    const gem = { id: nextId++, k, s, el };
    dress(gem);
    board.append(el);
    return gem;
  }
  function dress(g) {
    const inn = g.el.querySelector('.in');
    g.el.classList.remove('s-h', 's-v', 's-bomb', 's-color');
    if (g.s === 'color') { inn.innerHTML = '<div class="orb"></div>'; g.el.classList.add('s-color'); }
    else { inn.innerHTML = svgFor(g.k) + (g.s === 'h' || g.s === 'v' ? '<div class="st"></div>' : ''); if (g.s) g.el.classList.add(`s-${g.s}`); }
    g.el.setAttribute('aria-hidden', 'true');
  }
  function place(g, i) { const [r, c] = rc(i); g.el.style.setProperty('--r', r); g.el.style.setProperty('--c', c); }

  function cellEl(cls, i, html = '') {
    const d = document.createElement('div');
    const [r, c] = rc(i);
    d.className = `cell ${cls}`; d.style.setProperty('--r', r); d.style.setProperty('--c', c);
    d.innerHTML = html;
    board.append(d);
    return d;
  }
  function paintCell(i) {
    const c = cells[i];
    if (c.ice) {
      if (!els.ice[i]) els.ice[i] = cellEl('ice', i);
      els.ice[i].classList.toggle('h2', c.ice > 1);
    } else if (els.ice[i]) { const e = els.ice[i]; els.ice[i] = null; e.style.opacity = '0'; e.style.transform = 'scale(1.3)'; setTimeout(() => e.remove(), 300); }
    if (c.crate) {
      if (!els.crate[i]) els.crate[i] = cellEl('crate', i);
      els.crate[i].innerHTML = crateSvg(c.crate);
    } else if (els.crate[i]) { els.crate[i].remove(); els.crate[i] = null; }
    if (c.lock) { if (!els.lock[i]) els.lock[i] = cellEl('lock', i, lockSvg); }
    else if (els.lock[i]) { els.lock[i].remove(); els.lock[i] = null; }
  }

  function findRuns(g) {
    const runs = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N;) {
      const k = colorAt(g, r * N + c); let e = c + 1;
      while (e < N && k >= 0 && colorAt(g, r * N + e) === k) e++;
      if (k >= 0 && e - c >= 3) runs.push({ dir: 'h', k, cells: Array.from({ length: e - c }, (_, j) => r * N + c + j) });
      c = k >= 0 ? e : c + 1;
    }
    for (let c = 0; c < N; c++) for (let r = 0; r < N;) {
      const k = colorAt(g, r * N + c); let e = r + 1;
      while (e < N && k >= 0 && colorAt(g, e * N + c) === k) e++;
      if (k >= 0 && e - r >= 3) runs.push({ dir: 'v', k, cells: Array.from({ length: e - r }, (_, j) => (r + j) * N + c) });
      r = k >= 0 ? e : r + 1;
    }
    return runs;
  }

  function groupRuns(runs, prefer) {
    const groups = [];
    for (const run of runs) {
      const hit = groups.filter((gp) => gp.k === run.k && run.cells.some((c) => gp.cells.has(c)));
      let gp;
      if (hit.length) { gp = hit[0]; for (const o of hit.slice(1)) { o.cells.forEach((c) => gp.cells.add(c)); gp.runs.push(...o.runs); groups.splice(groups.indexOf(o), 1); } }
      else { gp = { k: run.k, cells: new Set(), runs: [] }; groups.push(gp); }
      run.cells.forEach((c) => gp.cells.add(c)); gp.runs.push(run);
    }
    for (const gp of groups) {
      const maxLen = Math.max(...gp.runs.map((r) => r.cells.length));
      const hasH = gp.runs.some((r) => r.dir === 'h'), hasV = gp.runs.some((r) => r.dir === 'v');
      gp.special = maxLen >= 5 ? 'color' : hasH && hasV ? 'bomb' : maxLen === 4 ? gp.runs[0].dir : null;
      if (!gp.special) continue;
      const free = [...gp.cells].filter((c) => !cells[c].lock);
      if (!free.length) { gp.special = null; continue; }
      const pref = (prefer || []).find((p) => gp.cells.has(p) && !cells[p].lock);
      if (pref != null) gp.at = pref;
      else if (gp.special === 'bomb') {
        const h = gp.runs.find((r) => r.dir === 'h'), v = gp.runs.find((r) => r.dir === 'v');
        gp.at = h.cells.find((c) => v.cells.includes(c) && !cells[c].lock) ?? free[0];
      } else { const long = gp.runs.reduce((a, b) => (b.cells.length > a.cells.length ? b : a)); const mid = long.cells[Math.floor(long.cells.length / 2)]; gp.at = cells[mid].lock ? free[0] : mid; }
    }
    return groups;
  }

  function effectCells(i, g) {
    const [r, c] = rc(i), out = [];
    if (g.s === 'h') for (let x = 0; x < N; x++) out.push(r * N + x);
    else if (g.s === 'v') for (let y = 0; y < N; y++) out.push(y * N + c);
    else if (g.s === 'bomb') { for (let y = r - 1; y <= r + 1; y++) for (let x = c - 1; x <= c + 1; x++) if (y >= 0 && x >= 0 && y < N && x < N) out.push(y * N + x); }
    else if (g.s === 'color') {
      let t = g.target;
      if (t == null) { const cnt = Array(K).fill(0); grid.forEach((q) => { if (q && q.s !== 'color') cnt[q.k]++; }); t = cnt.indexOf(Math.max(...cnt)); }
      grid.forEach((q, j) => { if (q && q.k === t && q.s !== 'color') out.push(j); });
    }
    return out.filter((j) => !cells[j].hole);
  }

  function fx(i, g) {
    const [r, c] = rc(i);
    const el = document.createElement('div');
    if (g.s === 'h') { el.className = 'beam'; el.style.cssText = `left:0;right:0;top:${r * 12.5 + 3}%;height:6.5%;--dir:90deg`; }
    else if (g.s === 'v') { el.className = 'beam'; el.style.cssText = `top:0;bottom:0;left:${c * 12.5 + 3}%;width:6.5%;--dir:180deg`; }
    else if (g.s === 'bomb') { el.className = 'flash'; el.style.cssText = `left:${(c - 1) * 12.5}%;top:${(r - 1) * 12.5}%;width:37.5%;height:37.5%`; }
    else { el.className = 'flash'; el.style.cssText = `left:${(c - 3) * 12.5}%;top:${(r - 3) * 12.5}%;width:87.5%;height:87.5%`; }
    board.append(el); setTimeout(() => el.remove(), 450);
  }
  function shards(i, colors) {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const [r, c] = rc(i);
    for (let k = 0; k < 6; k++) {
      const s = document.createElement('i'); s.className = 'shard';
      const a = Math.random() * Math.PI * 2, d = 18 + Math.random() * 22;
      s.style.left = `calc(${(c + 0.5) * 12.5}% - 3px)`; s.style.top = `calc(${(r + 0.5) * 12.5}% - 3px)`;
      s.style.background = colors[k % colors.length];
      s.style.setProperty('--dx', `${Math.cos(a) * d}px`); s.style.setProperty('--dy', `${Math.sin(a) * d}px`);
      board.append(s); setTimeout(() => s.remove(), 600);
    }
  }
  function popText(text, i) {
    const [r, c] = rc(i);
    const p = document.createElement('div'); p.className = 'pts'; p.textContent = text;
    p.style.left = `${(c + 0.5) * 12.5}%`; p.style.top = `${(r + 0.5) * 12.5}%`;
    board.append(p); setTimeout(() => p.remove(), 900);
  }
  function banner(text) {
    const b = document.createElement('div'); b.className = 'banner'; b.textContent = text;
    board.append(b); setTimeout(() => b.remove(), 1000);
  }
  function shake() { board.classList.remove('shake'); void board.offsetWidth; board.classList.add('shake'); }

  function hitIce(i) {
    if (!cells[i].ice) return 0;
    cells[i].ice--;
    const e = els.ice[i]; if (e) { e.classList.remove('crack'); void e.offsetWidth; e.classList.add('crack'); }
    shards(i, ['#e3f6ff', '#9fd5ff', '#ffffff']);
    paintCell(i);
    return 40;
  }
  function hitCrate(i) {
    if (!cells[i].crate) return 0;
    cells[i].crate--;
    const e = els.crate[i]; if (e) { e.classList.remove('hit'); void e.offsetWidth; e.classList.add('hit'); }
    shards(i, ['#c98a4b', '#8a5a2b', '#e9c79a']);
    paintCell(i);
    return 60;
  }

  async function blast(clear, create, mult) {
    const queue = [...clear], fired = new Set();
    const createAt = new Map(create.map((c) => [c.at, c]));
    let specials = 0;
    while (queue.length) {
      const i = queue.shift(), g = grid[i];
      if (!g || !g.s || fired.has(g.id)) continue;
      fired.add(g.id); specials++;
      fx(i, g);
      for (const j of effectCells(i, g)) if (!clear.has(j)) { clear.add(j); queue.push(j); }
    }
    if (specials) { Curio.beep(180, 0.18, 'sawtooth', 0.06); Curio.beep(90, 0.25, 'sine', 0.12); shake(); buzz(20); }
    let n = 0, bonus = 0;
    const crateHits = new Set(), popped = [];
    for (const i of clear) {
      if (cells[i].crate) { crateHits.add(i); continue; }
      const g = grid[i]; if (!g) continue;
      bonus += hitIce(i);
      if (cells[i].lock) { cells[i].lock = false; paintCell(i); bonus += 60; Curio.beep(1200, 0.05, 'square', 0.04); shards(i, ['#c9ced8', '#ffc233']); continue; }
      const made = createAt.get(i);
      if (made) { g.k = made.k; g.s = made.s; delete g.target; dress(g); g.el.classList.add('born'); setTimeout(() => g.el.classList.remove('born'), 400); popped.push(i); continue; }
      if (g.s !== 'color' && need[g.k] > 0) need[g.k]--;
      n++; popped.push(i);
      g.el.classList.add('pop');
      const el = g.el; setTimeout(() => el.remove(), 260);
      grid[i] = null;
    }
    for (const i of popped) {
      const [r, c] = rc(i);
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const rr = r + dr, cc = c + dc;
        if (rr >= 0 && cc >= 0 && rr < N && cc < N && cells[rr * N + cc].crate) crateHits.add(rr * N + cc);
      }
    }
    for (const i of crateHits) bonus += hitCrate(i);
    if (crateHits.size) Curio.beep(140, 0.1, 'square', 0.06);
    const gained = n * 30 * mult + specials * 100 + create.length * 60 + bonus;
    score += gained;
    if (blitz && create.length) { timeLeft += create.length * 2; popText(`+${create.length * 2}s`, create[0].at); }
    if (n || bonus) {
      const center = [...clear].sort((a, b) => a - b)[Math.floor(clear.size / 2)];
      popText(`+${gained}`, center);
      const base = [523, 587, 659, 698, 784, 880, 988, 1047];
      Curio.beep(base[Math.min(mult - 1, 7)], 0.09, 'triangle', 0.1);
      setTimeout(() => Curio.beep(base[Math.min(mult, 7)] * 1.5, 0.08, 'sine', 0.06), 60);
    }
    hud(true);
    await wait(250);
  }

  async function gravity() {
    const start = new Map();
    grid.forEach((g, i) => { if (g) start.set(g, i); });
    const spawned = [];
    const colSpawn = Array(N).fill(0);
    for (let pass = 0; pass < 80; pass++) {
      let changed = false;
      for (let r = N - 1; r >= 0; r--) for (let c = 0; c < N; c++) {
        const i = r * N + c;
        if (!playable(i) || grid[i]) continue;
        let k = r - 1;
        while (k >= 0 && cells[k * N + c].hole) k--;
        if (k < 0) {
          const g = makeGem(Curio.randInt(0, K - 1));
          colSpawn[c]++;
          g.el.style.transition = 'none';
          g.el.style.setProperty('--r', -colSpawn[c]); g.el.style.setProperty('--c', c);
          grid[i] = g; spawned.push(g); changed = true;
          continue;
        }
        const j = k * N + c;
        if (grid[j] && !cells[j].lock) { grid[i] = grid[j]; grid[j] = null; changed = true; continue; }
        if (playable(j) && !grid[j] && !cells[j].lock) continue;
        for (const dc of Math.random() < 0.5 ? [-1, 1] : [1, -1]) {
          const cc = c + dc; if (cc < 0 || cc >= N || r === 0) continue;
          const d = (r - 1) * N + cc, below = r * N + cc;
          if (grid[d] && !cells[d].lock && !(playable(below) && !grid[below])) { grid[i] = grid[d]; grid[d] = null; changed = true; break; }
        }
      }
      if (!changed) break;
    }
    void board.offsetWidth;
    grid.forEach((g, i) => {
      if (!g) return;
      const moved = !start.has(g) || start.get(g) !== i;
      g.el.style.transition = '';
      place(g, i);
      if (moved) { g.el.classList.remove('land'); setTimeout(() => { g.el.classList.add('land'); setTimeout(() => g.el.classList.remove('land'), 260); }, 200); }
    });
    await wait(240);
  }

  async function resolve(prefer, mult = 1) {
    for (;;) {
      const runs = findRuns(grid);
      if (!runs.length) break;
      const groups = groupRuns(runs, prefer);
      const clear = new Set(), create = [];
      for (const gp of groups) { gp.cells.forEach((c) => clear.add(c)); if (gp.special) create.push({ at: gp.at, k: gp.k, s: gp.special }); }
      if (mult === 3) banner(Curio.pick(['Sweet!', 'Tasty!', 'Lovely!']));
      if (mult === 5) { banner(Curio.pick(['Divine!', 'Dazzling!'])); unlock('cascade'); }
      if (mult === 7) banner('Unstoppable!');
      maxCascade = Math.max(maxCascade, mult);
      if (create.some((c) => c.s === 'color')) { Curio.toast('Colour bomb created!', 1200); unlock('bomb'); }
      await blast(clear, create, mult);
      await gravity();
      prefer = null; mult++;
    }
  }

  async function combo(a, b) {
    const ga = grid[a], gb = grid[b];
    const all = (pred) => new Set(grid.map((q, j) => (q && pred(q) ? j : -1)).filter((j) => j >= 0));
    if (ga.s === 'color' && gb.s === 'color') {
      banner('Supernova!'); unlock('nova'); shake();
      ga.s = gb.s = null;
      const set = all(() => true);
      cells.forEach((c, j) => { if (c.crate) set.add(j); });
      await blast(set, [], 2);
    } else if (ga.s === 'color' || gb.s === 'color') {
      const [ci, other] = ga.s === 'color' ? [a, gb] : [b, ga];
      const c = grid[ci];
      if (other.s) {
        banner('Mega blast!');
        const targets = grid.map((q, j) => (q && q.s !== 'color' && q.k === other.k ? j : -1)).filter((j) => j >= 0);
        for (const j of targets) { const q = grid[j]; q.s = other.s === 'bomb' ? 'bomb' : Math.random() < 0.5 ? 'h' : 'v'; dress(q); q.el.classList.add('born'); }
        Curio.beep(880, 0.2, 'triangle', 0.08);
        await wait(450);
        c.s = null;
        await blast(new Set([ci, ...targets]), [], 2);
      } else {
        c.target = other.k;
        await blast(new Set([ci]), [], 2);
      }
    } else {
      const [r, c0] = rc(b);
      const set = new Set();
      const s1 = ga.s, s2 = gb.s;
      ga.s = gb.s = null;
      const line = (rr, cc) => { if (rr >= 0 && rr < N) for (let x = 0; x < N; x++) set.add(rr * N + x); if (cc >= 0 && cc < N) for (let y = 0; y < N; y++) set.add(y * N + cc); };
      const striped = (s) => s === 'h' || s === 'v';
      if (striped(s1) && striped(s2)) { line(r, c0); fx(b, { s: 'h' }); fx(b, { s: 'v' }); }
      else if (s1 === 'bomb' && s2 === 'bomb') { for (let y = r - 2; y <= r + 2; y++) for (let x = c0 - 2; x <= c0 + 2; x++) if (y >= 0 && x >= 0 && y < N && x < N) set.add(y * N + x); fx(b, { s: 'color' }); banner('Kaboom!'); }
      else { for (let d = -1; d <= 1; d++) line(r + d, c0 + d); fx(b, { s: 'color' }); banner('Cross blast!'); }
      for (const j of [...set]) if (cells[j].hole) set.delete(j);
      await blast(set, [], 2);
    }
    await gravity();
    await resolve(null, 2);
  }

  function swapIn(a, b) {
    const t = grid[a]; grid[a] = grid[b]; grid[b] = t;
    [a, b].forEach((i) => { grid[i].el.classList.add('swap'); place(grid[i], i); });
  }
  function adjacent(a, b) { const [r1, c1] = rc(a), [r2, c2] = rc(b); return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1; }

  async function trySwap(a, b) {
    if (busy || over || !adjacent(a, b) || !grid[a] || !grid[b]) return;
    if (cells[a].lock || cells[b].lock) { Curio.toast('Chained gems cannot move. Match them to free them!'); Curio.beep(160, 0.08, 'square', 0.04); const l = els.lock[cells[a].lock ? a : b]; l?.animate?.([{ transform: 'rotate(-8deg)' }, { transform: 'rotate(8deg)' }, { transform: 'none' }], { duration: 250 }); return; }
    busy = true; clearHint(); setSel(-1);
    swapIn(a, b);
    Curio.beep(440, 0.04, 'triangle', 0.06);
    await wait(180);
    const ga = grid[b], gb = grid[a];
    [a, b].forEach((i) => grid[i].el.classList.remove('swap'));
    if (ga.s === 'color' || gb.s === 'color' || (ga.s && gb.s)) {
      if (!blitz) moves--; hud();
      await combo(b, a);
    } else if (findRuns(grid).length) {
      if (!blitz) moves--; hud();
      await resolve([a, b]);
    } else {
      Curio.beep(160, 0.08, 'square', 0.04);
      swapIn(a, b);
      await wait(190);
      [a, b].forEach((i) => grid[i].el.classList.remove('swap'));
      busy = false; armHint();
      return;
    }
    await settle();
    busy = false;
  }

  function findMove(g = grid) {
    const mov = (i) => g[i] && !cells[i].lock;
    for (let i = 0; i < N * N; i++) for (const j of [i + 1, i + N]) {
      if (j >= N * N || (j === i + 1 && i % N === N - 1)) continue;
      if (!mov(i) || !mov(j)) continue;
      const a = g[i], b = g[j];
      if (a.s === 'color' || b.s === 'color' || (a.s && b.s)) return [i, j];
      const t = g.slice(); t[i] = b; t[j] = a;
      if (findRuns(t).length) return [i, j];
    }
    return null;
  }

  async function shuffleBoard(manual) {
    banner('Shuffle!');
    Curio.beep(330, 0.1, 'triangle', 0.07);
    const spots = [], gems = [];
    grid.forEach((g, i) => { if (g && !cells[i].lock) { spots.push(i); gems.push(g); } });
    let tries = 0, best = null;
    do {
      const arr = Curio.shuffle(gems);
      const t = grid.slice();
      spots.forEach((s, k) => { t[s] = arr[k]; });
      tries++;
      if (tries > 200) t.forEach((q, i) => { if (q && !q.s && !cells[i].lock) { q.k = Curio.randInt(0, K - 1); dress(q); } });
      best = t;
    } while ((findRuns(best).length || !findMove(best)) && tries < 400);
    grid = best;
    grid.forEach((g, i) => { if (g) place(g, i); });
    await wait(400);
    await resolve(null);
    if (manual) await settle();
  }

  const goalsMet = () => !blitz && Object.entries(need).every(([, n]) => n <= 0) && cells.every((c) => !c.ice && !c.crate && !c.lock) && score >= def.s;

  async function settle() {
    hud();
    if (blitz) {
      if (timeLeft <= 0) return finish(true);
      let guard = 0;
      while (!findMove() && guard++ < 5) await shuffleBoard();
      armHint();
      return;
    }
    if (goalsMet()) return finish(true);
    if (moves <= 0) return finish(false);
    let guard = 0;
    while (!findMove() && guard++ < 5) await shuffleBoard();
    armHint();
  }

  function unlock(id) {
    if (save.ach[id]) return;
    save.ach[id] = Date.now(); persist();
    const a = ACH.find((x) => x[0] === id);
    if (a) setTimeout(() => Curio.toast(`${a[1]} Badge unlocked: ${a[2]}`, 2400), 600);
    paintAch();
  }
  const totalStars = () => Object.values(save.stars).reduce((a, b) => a + b, 0);

  async function finish(win) {
    over = true; clearHint(); clearInterval(blitzTimer);
    if (blitz) {
      const isNew = score > save.blitzBest;
      if (isNew) save.blitzBest = score;
      persist();
      if (score >= 10000) unlock('blitz10');
      if (score >= 25000) unlock('blitz25');
      Curio.confetti();
      [523, 659, 784, 1047].forEach((f, k) => setTimeout(() => Curio.beep(f, 0.14, 'triangle', 0.1), k * 110));
      const v = await Curio.modal({ emoji: '⏱️', title: `${Curio.fmt(score)} points!`, body: `${isNew ? 'A new Blitz record!' : `Your record: ${Curio.fmt(save.blitzBest)}.`} Longest cascade: x${maxCascade}.`, buttons: [{ label: 'Go again', value: 'again' }, { label: 'Share', value: 'share' }, { label: 'Map', value: 'map' }] });
      if (v === 'share') { try { await navigator.clipboard.writeText(`💎 Zoble Gem Swap Blitz: ${Curio.fmt(score)} points in 60 seconds!`); Curio.toast('Copied!'); } catch { Curio.toast('Could not reach the clipboard.'); } showMap(); }
      else if (v === 'again') startBlitz(); else showMap();
      return;
    }
    if (win) {
      if (moves > 0) {
        banner('Bonus moves!');
        for (let k = 0; k < Math.min(moves, 12); k++) setTimeout(() => Curio.beep(660 + k * 40, 0.06, 'triangle', 0.07), k * 70);
        score += moves * 250; moves = 0; hud();
        await wait(900);
      }
      const s = score >= def.s * 2 ? 3 : score >= def.s * 1.5 ? 2 : 1;
      const b = Curio.best(`level-${level}`, score);
      const firstClear = !save.stars[level];
      save.max = Math.max(save.max, Math.min(LEVELS.length - 1, level + 1));
      if (s === 3 && (save.stars[level] || 0) < 3) { save.hammers++; setTimeout(() => Curio.toast('Three stars! +1 hammer 🔨'), 1500); }
      save.stars[level] = Math.max(save.stars[level] || 0, s);
      persist();
      unlock('first');
      if (s === 3) unlock('three');
      const w = Math.floor(level / 9);
      if (Array.from({ length: 9 }, (_, k) => w * 9 + k).every((k) => save.stars[k])) { unlock(`w${w}`); if (firstClear) { save.shuffles += 2; persist(); } }
      if (totalStars() >= 100) unlock('stars100');
      Curio.confetti();
      buzz([20, 40, 20]);
      [523, 659, 784, 1047].forEach((f, k) => setTimeout(() => Curio.beep(f, 0.14, 'triangle', 0.1), k * 110));
      hud();
      const last = level >= LEVELS.length - 1;
      const v = await Curio.modal({ emoji: '💎', title: `${'★'.repeat(s)}${'☆'.repeat(3 - s)}`, body: `Level ${level + 1} complete with ${Curio.fmt(score)} points. ${b.isNew ? 'New best for this level!' : `Best: ${Curio.fmt(b.best)}.`}${last ? ' You beat the final level. Legend!' : ''}`, buttons: [...(last ? [] : [{ label: 'Next level', value: 'next' }]), { label: 'Replay', value: 'again' }, { label: 'Map', value: 'map' }] });
      if (v === 'next') start(level + 1); else if (v === 'again') start(level); else showMap();
    } else {
      Curio.beep(220, 0.2, 'sawtooth', 0.06); setTimeout(() => Curio.beep(165, 0.3, 'sawtooth', 0.06), 180);
      const left = Object.entries(need).filter(([, n]) => n > 0).map(([k, n]) => `${n} ${NAMES[k]}`);
      const ice = cells.filter((c) => c.ice).length, crates = cells.filter((c) => c.crate).length, locks = cells.filter((c) => c.lock).length;
      const what = [score < def.s ? `${Curio.fmt(def.s - score)} points` : null, ...left, ice ? `${ice} ice` : null, crates ? `${crates} crate${crates > 1 ? 's' : ''}` : null, locks ? `${locks} chain${locks > 1 ? 's' : ''}` : null].filter(Boolean).join(', ');
      const v = await Curio.modal({ emoji: '😵', title: 'Out of moves!', body: `So close. Still needed: ${what}.`, buttons: [{ label: 'Try again', value: 'again' }, { label: 'Map', value: 'map' }] });
      if (v === 'again') start(level); else showMap();
    }
  }

  function goalChips(target, bumpKeys = new Set()) {
    target.innerHTML = '';
    const chip = (html, ok, label, key) => {
      const d = document.createElement('div'); d.className = `goal${ok ? ' ok' : ''}${bumpKeys.has(key) ? ' bump' : ''}`;
      d.innerHTML = html; d.setAttribute('aria-label', label); target.append(d);
    };
    if (blitz) { chip(`<span>⏱️</span><span>${Math.max(0, Math.ceil(timeLeft))}s</span>`, false, 'Time left', 't'); return; }
    chip(`<span>🎯</span><span>${score >= def.s ? '✓' : Curio.fmt(def.s)}</span>`, score >= def.s, 'Target score', 's');
    for (const [k, n] of Object.entries(need)) chip(`${svgFor(+k)}<span>${n <= 0 ? '✓' : n}</span>`, n <= 0, `${NAMES[k]}: ${n <= 0 ? 'done' : `${n} to go`}`, `c${k}`);
    const ice = cells.filter((c) => c.ice).length, crates = cells.filter((c) => c.crate).length, locks = cells.filter((c) => c.lock).length;
    if (def.hasIce) chip(`${iceIcon}<span>${ice || '✓'}</span>`, !ice, `Ice: ${ice} left`, 'ice');
    if (def.hasCrate) chip(`${crateSvg(1)}<span>${crates || '✓'}</span>`, !crates, `Crates: ${crates} left`, 'crate');
    if (def.hasLock) chip(`${lockSvg}<span>${locks || '✓'}</span>`, !locks, `Chains: ${locks} left`, 'lock');
  }

  let lastGoalSig = '';
  function hud(bump) {
    $('level').textContent = blitz ? '⏱️' : level + 1;
    $('level-l').textContent = blitz ? 'Blitz' : 'Level';
    $('moves').textContent = blitz ? Math.max(0, Math.ceil(timeLeft)) : moves;
    $('moves-l').textContent = blitz ? 'Seconds' : 'Moves left';
    $('moves-stat').classList.toggle('low', blitz ? timeLeft <= 10 : moves <= 3 && !over);
    $('score').textContent = Curio.fmt(score);
    $('fill').style.width = blitz ? `${Math.min(100, score / Math.max(10000, save.blitzBest || 10000) * 100)}%` : `${Math.min(100, score / (def.s * 2) * 100)}%`;
    const sig = JSON.stringify([need, cells.map((c) => c.ice + c.crate * 3 + (c.lock ? 9 : 0)).join(''), score >= (def?.s || 0)]);
    goalChips($('goals'), bump && sig !== lastGoalSig ? new Set(['s', 'ice', 'crate', 'lock', ...Object.keys(need).map((k) => `c${k}`)]) : new Set());
    lastGoalSig = sig;
    $('hammer-n').textContent = `×${save.hammers}`;
    $('shuffle-n').textContent = `×${save.shuffles}`;
    $('hammerBtn').disabled = save.hammers <= 0 && !hammerMode;
    $('shuffleBtn').disabled = save.shuffles <= 0;
  }

  function buildBoard(layout) {
    board.querySelectorAll('.gem, .pts, .banner, .beam, .flash, .cell, .shard').forEach((e) => e.remove());
    els = { ice: [], crate: [], lock: [] };
    cells = [];
    for (let i = 0; i < N * N; i++) {
      const [r, c] = rc(i);
      const ch = layout ? layout[r][c] : '.';
      cells.push({ hole: ch === '#', ice: ch === 'i' || ch === 'k' ? 1 : ch === 'I' ? 2 : 0, crate: ch === 'c' ? 1 : ch === 'C' ? 2 : 0, lock: ch === 'l' || ch === 'k' });
      if (ch !== '#') cellEl(`tile${(r + c) % 2 ? ' alt' : ''}`, i);
    }
    let tries = 0;
    do {
      board.querySelectorAll('.gem').forEach((e) => e.remove());
      grid = Array(N * N).fill(null);
      for (let i = 0; i < N * N; i++) {
        if (!playable(i)) continue;
        const [r, c] = rc(i);
        let k, guard = 0;
        do { k = Curio.randInt(0, K - 1); guard++; } while (guard < 40 && ((c >= 2 && grid[i - 1]?.k === k && grid[i - 2]?.k === k) || (r >= 2 && grid[i - N]?.k === k && grid[i - 2 * N]?.k === k)));
        grid[i] = makeGem(k);
      }
      tries++;
    } while ((!findMove() || findRuns(grid).length) && tries < 60);
    for (let i = 0; i < N * N; i++) paintCell(i);
    grid.forEach((g, i) => { if (!g) return; g.el.style.transition = 'none'; g.el.style.setProperty('--r', Math.floor(i / N) - N); g.el.style.setProperty('--c', i % N); });
    void board.offsetWidth;
    grid.forEach((g, i) => { if (!g) return; g.el.style.transition = `transform .45s cubic-bezier(.3, 1.2, .5, 1) ${(N - Math.floor(i / N)) * 30 + (i % N) * 8}ms`; place(g, i); });
    setTimeout(() => grid.forEach((g) => { if (g) g.el.style.transition = ''; }), 900);
  }

  function showPlay() { $('map-view').hidden = true; $('play-view').hidden = false; }
  function showMap() {
    over = true; clearInterval(blitzTimer); clearHint(); setHammer(false);
    document.querySelector('.curio-modal')?.remove();
    $('play-view').hidden = true; $('map-view').hidden = false;
    paintMap();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function start(i) {
    blitz = false; clearInterval(blitzTimer); setHammer(false);
    level = Math.max(0, Math.min(LEVELS.length - 1, i)); save.level = level; persist();
    const L = LEVELS[level];
    def = { ...L, hasIce: false, hasCrate: false, hasLock: false };
    if (L.L) { const flat = L.L.join(''); def.hasIce = /[iIk]/.test(flat); def.hasCrate = /[cC]/.test(flat); def.hasLock = /[lk]/.test(flat); }
    moves = def.m; score = 0; over = true; busy = false; sel = -1; maxCascade = 0;
    need = Object.fromEntries(Object.entries(def.g || {}).map(([k, n]) => [k, n]));
    showPlay();
    buildBoard(L.L);
    hud();
    const w = WORLDS[Math.floor(level / 9)] || WORLDS[0];
    $('intro-title').textContent = `${w.emoji} Level ${level + 1}`;
    const bits = [];
    if (def.hasIce) bits.push('Crack all the ice by matching on top of it.');
    if (def.hasCrate) bits.push('Smash every crate by matching beside it.');
    if (def.hasLock) bits.push('Free every chained gem by matching it.');
    if (Object.keys(need).length) bits.push('Collect the gems shown.');
    bits.push(`Reach ${Curio.fmt(def.s)} points in ${def.m} moves.`);
    $('intro-text').textContent = bits.join(' ');
    goalChips($('intro-goals'));
    $('intro').hidden = false;
    $('intro-go').focus();
  }
  function begin() {
    $('intro').hidden = true;
    over = false;
    armHint();
    if (kbMode) board.focus({ preventScroll: true });
    Curio.beep(660, 0.06, 'triangle', 0.07);
  }

  function startBlitz() {
    blitz = true; setHammer(false);
    def = { m: 0, s: 0 }; need = {}; score = 0; moves = 0; maxCascade = 0; busy = false; sel = -1; over = false;
    timeLeft = 60;
    showPlay();
    buildBoard(null);
    $('intro').hidden = true;
    hud();
    banner('Go!');
    armHint();
    clearInterval(blitzTimer);
    lastT = performance.now();
    blitzTimer = setInterval(() => {
      const now = performance.now(), dt = (now - lastT) / 1000; lastT = now;
      if (document.hidden || over) return;
      const before = Math.ceil(timeLeft);
      timeLeft -= dt;
      if (Math.ceil(timeLeft) !== before) { hud(); if (timeLeft <= 5 && timeLeft > 0) Curio.beep(990, 0.04, 'square', 0.05); }
      if (timeLeft <= 0 && !busy) { timeLeft = 0; clearInterval(blitzTimer); hud(); banner('Time!'); setTimeout(() => finish(true), 700); over = true; }
    }, 100);
  }

  function clearHint() { clearTimeout(idleTimer); board.querySelectorAll('.hint').forEach((e) => e.classList.remove('hint')); }
  function armHint() { clearHint(); idleTimer = setTimeout(showHint, blitz ? 4000 : 6000); }
  function showHint() {
    if (busy || over || document.hidden) { armHint(); return; }
    const m = findMove(); if (!m) return;
    m.forEach((i) => grid[i].el.classList.add('hint'));
  }

  function setSel(i) {
    if (sel >= 0 && grid[sel]) grid[sel].el.classList.remove('sel');
    sel = i;
    if (sel >= 0 && grid[sel]) grid[sel].el.classList.add('sel');
  }

  function setHammer(on) {
    hammerMode = on;
    board.classList.toggle('hammer', on);
    if ($('hammerBtn')) $('hammerBtn').setAttribute('aria-pressed', String(on));
  }
  async function smash(i) {
    if (busy || over || cells[i].hole) return;
    if (!grid[i] && !cells[i].crate) return;
    setHammer(false);
    save.hammers--; persist(); unlock('hammer');
    busy = true; clearHint();
    Curio.beep(120, 0.15, 'square', 0.1); shake(); buzz(30);
    const set = new Set([i]);
    await blast(set, [], 1);
    await gravity();
    await resolve(null);
    await settle();
    busy = false;
  }

  function cellFromEvent(e) {
    const r = board.getBoundingClientRect();
    const c = Math.floor((e.clientX - r.left) / r.width * N), rr = Math.floor((e.clientY - r.top) / r.height * N);
    if (c < 0 || rr < 0 || c >= N || rr >= N) return -1;
    return rr * N + c;
  }

  let ptr = null, wantUnlatch = false;
  const unlatch = () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  const cellAt = (x, y) => { const r = board.getBoundingClientRect(); const c = Math.floor((x - r.left) / r.width * N), rr = Math.floor((y - r.top) / r.height * N); return c < 0 || rr < 0 || c >= N || rr >= N ? -1 : rr * N + c; };
  Curio.drag(board, {
    start(p) {
      ptr = null;
      if (busy || over) { wantUnlatch = true; return; }
      kbMode = false; board.classList.remove('kb');
      const i = cellAt(p.clientX, p.clientY); if (i < 0) { wantUnlatch = true; return; }
      if (hammerMode) { smash(i); wantUnlatch = true; return; }
      if (sel >= 0 && sel !== i && adjacent(sel, i)) { const s0 = sel; setSel(-1); trySwap(s0, i); wantUnlatch = true; return; }
      ptr = { i, x: p.clientX, y: p.clientY, done: false };
      if (Curio.touchpad && p.pointerType === 'mouse' && grid[i] && sel !== i) { setSel(i); ptr.picked = true; }
      armHint();
    },
    move(p) {
      if (!ptr || ptr.done) return;
      const dx = p.clientX - ptr.x, dy = p.clientY - ptr.y, cell = board.getBoundingClientRect().width / N;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < cell * 0.55) return;
      ptr.done = true;
      const [r, c] = rc(ptr.i);
      const [nr, nc] = Math.abs(dx) > Math.abs(dy) ? [r, c + Math.sign(dx)] : [r + Math.sign(dy), c];
      if (Curio.touchpad) setTimeout(unlatch, 0);
      setSel(-1);
      if (nr < 0 || nc < 0 || nr >= N || nc >= N) return;
      trySwap(ptr.i, nr * N + nc);
    },
    end(p) {
      const pt = ptr; ptr = null;
      if (!pt || !p || pt.done || busy || over) return;
      const j = cellAt(p.clientX, p.clientY);
      if (pt.picked) {
        if (j >= 0 && j !== pt.i && adjacent(pt.i, j)) { setSel(-1); trySwap(pt.i, j); }
        else if (j === pt.i) Curio.beep(620, 0.03, 'triangle', 0.05);
        else setSel(-1);
        return;
      }
      if (!grid[pt.i]) return;
      if (sel >= 0 && adjacent(sel, pt.i)) { const s = sel; setSel(-1); trySwap(s, pt.i); }
      else if (sel === pt.i) setSel(-1);
      else { setSel(pt.i); Curio.beep(620, 0.03, 'triangle', 0.05); }
    }
  });
  addEventListener('pointerup', () => { if (wantUnlatch) { wantUnlatch = false; if (Curio.touchpad) unlatch(); } });

  function paintCur() { const [r, c] = rc(kbCur); cur.style.setProperty('--r', r); cur.style.setProperty('--c', c); }
  board.addEventListener('keydown', (e) => {
    const d = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key];
    if (!d && e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Escape') return;
    e.preventDefault();
    kbMode = true; board.classList.add('kb'); armHint();
    if (busy || over) return;
    if (e.key === 'Escape') { setSel(-1); setHammer(false); return; }
    if (e.key === 'Enter' || e.key === ' ') { if (hammerMode) { smash(kbCur); return; } setSel(sel === kbCur ? -1 : kbCur); return; }
    const [r, c] = rc(kbCur), nr = r + d[0], nc = c + d[1];
    if (nr < 0 || nc < 0 || nr >= N || nc >= N) return;
    if (sel >= 0) { const s = sel; kbCur = nr * N + nc; paintCur(); trySwap(s, kbCur); }
    else { kbCur = nr * N + nc; paintCur(); }
  });
  paintCur();
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector('.curio-modal')) return;
    const k = e.key.toLowerCase();
    if (!$('intro').hidden && (k === 'enter' || k === ' ')) { e.preventDefault(); begin(); return; }
    if ($('play-view').hidden) return;
    if (k === 'h') { clearHint(); showHint(); }
    else if (k === 'r') $('restart').click();
    else if (k === 'm') showMap();
  });

  function paintMap() {
    const ts = totalStars();
    $('topline').innerHTML = [[`${ts}/${LEVELS.length * 3}`, 'Stars'], [Object.keys(save.stars).length, 'Cleared'], [save.hammers, 'Hammers'], [save.shuffles, 'Shuffles']].map(([v, l]) => `<div class="c-stat"><b>${v}</b><span>${l}</span></div>`).join('');
    $('continue-label').textContent = save.stars[save.max] ? `Replay level ${save.max + 1}` : `Play level ${save.max + 1}`;
    $('blitz-best').textContent = save.blitzBest ? `60 seconds, unlimited swaps. Record: ${Curio.fmt(save.blitzBest)}.` : '60 seconds, unlimited swaps. Specials add time!';
    const box = $('worlds'); box.replaceChildren();
    WORLDS.forEach((w, wi) => {
      const sec = document.createElement('section');
      const first = wi * 9, unlocked = first <= save.max;
      const wStars = Array.from({ length: 9 }, (_, k) => save.stars[first + k] || 0).reduce((a, b) => a + b, 0);
      sec.className = `world${unlocked ? '' : ' locked'}`;
      sec.style.setProperty('--wh', w.hue);
      sec.innerHTML = `<h2><span>${w.emoji}</span><span></span><small>${unlocked ? `★ ${wStars}/27` : '🔒 Locked'}</small></h2><p></p><div class="lv-row"></div>`;
      sec.querySelector('h2 span:nth-child(2)').textContent = `${wi + 1}. ${w.name}`;
      sec.querySelector('p').textContent = w.blurb;
      const row = sec.querySelector('.lv-row');
      for (let k = 0; k < 9; k++) {
        const li = first + k;
        if (li >= LEVELS.length) break;
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'lv' + (li === save.max && !save.stars[li] ? ' next' : '');
        b.disabled = li > save.max;
        const st = save.stars[li] || 0;
        b.innerHTML = `${li > save.max ? '🔒' : li + 1}${st ? `<span class="stars">${'★'.repeat(st)}</span>` : ''}`;
        b.setAttribute('aria-label', `Level ${li + 1}${li > save.max ? ', locked' : st ? `, ${st} stars` : ''}`);
        b.addEventListener('click', () => { Curio.beep(620, 0.05, 'triangle', 0.06); start(li); });
        row.append(b);
      }
      box.append(sec);
    });
    paintAch();
  }

  function paintAch() {
    $('achs').innerHTML = ACH.map(([id, e, n, d]) => `<div class="ach${save.ach[id] ? ' on' : ''}" title="${d}"><span>${e}</span><div><b>${n}</b>${d}</div></div>`).join('');
    $('ach-count').textContent = `${Object.keys(save.ach).length}/${ACH.length}`;
  }

  function buildStatic() {
    $('logo').innerHTML = [0, 4, 2, 5].map((k, i) => `<g><svg x="${8 + i * 40}" y="${i % 2 ? 14 : 4}" width="38" height="38" viewBox="0 0 100 100">${svgFor(k).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg></g>`).join('');
    const tip = (icon, text) => `<div>${icon}<span>${text}</span></div>`;
    const sp = (s) => `<svg viewBox="0 0 100 100" aria-hidden="true">${s}</svg>`;
    $('howto').innerHTML = [
      tip(sp(svgFor(4).replace(/^<svg[^>]*>|<\/svg>$/g, '') + '<rect x="28" y="28" width="44" height="44" rx="12" fill="none" stroke="#fff" stroke-width="5" stroke-dasharray="6 5"/>'), 'Match 4 in a line for a striped gem that clears a row or column.'),
      tip(sp('<circle cx="50" cy="50" r="40" fill="url(#g1)" stroke="#fff" stroke-width="6"/>'), 'Match in an L or T for a bomb that clears a 3×3.'),
      tip('<svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="hcb" x1="0" x2="1"><stop offset="0" stop-color="#ff4d4d"/><stop offset=".5" stop-color="#3ccf6e"/><stop offset="1" stop-color="#b05bff"/></linearGradient></defs><circle cx="50" cy="50" r="42" fill="url(#hcb)"/><circle cx="50" cy="50" r="16" fill="#241a3a"/></svg>', 'Match 5 for a colour bomb. Swap it to wipe out a colour.'),
      tip(iceIcon, 'Ice: match gems sitting on it. Thick ice needs two hits.'),
      tip(crateSvg(2), 'Crates: match next to them. Banded crates take two hits.'),
      tip(lockSvg, 'Chains: these gems cannot be swapped. Match them to break free.'),
      tip(sp('<text x="50" y="68" font-size="56" text-anchor="middle">🔨</text>'), 'Hammer smashes any one tile. Earn more with three-star clears.'),
      tip(sp('<text x="50" y="68" font-size="56" text-anchor="middle">⏱️</text>'), 'Blitz: 60 seconds, no move limit, specials add bonus seconds.')
    ].join('');
  }

  $('hintBtn').addEventListener('click', () => { clearHint(); showHint(); });
  $('restart').addEventListener('click', () => { if (busy) return; if (blitz) startBlitz(); else start(level); });
  $('to-map').addEventListener('click', () => { if (!busy) showMap(); });
  $('intro-go').addEventListener('click', begin);
  $('go-continue').addEventListener('click', () => start(save.max));
  $('go-blitz').addEventListener('click', startBlitz);
  $('hammerBtn').addEventListener('click', () => {
    if (busy || over) return;
    if (hammerMode) { setHammer(false); return; }
    if (save.hammers <= 0) { Curio.toast('No hammers left. Three-star a level to earn one.'); return; }
    setHammer(true); setSel(-1);
    Curio.toast('Tap any tile to smash it.');
  });
  $('shuffleBtn').addEventListener('click', async () => {
    if (busy || over || save.shuffles <= 0) return;
    save.shuffles--; persist(); busy = true; clearHint();
    await shuffleBoard(true);
    busy = false; hud();
  });

  buildStatic();
  showMap();
  window.__gs = {
    get grid() { return grid; }, get cells() { return cells; }, trySwap, findMove, findRuns, groupRuns, get busy() { return busy; }, get score() { return score; }, get moves() { return moves; }, get need() { return need; }, get over() { return over; },
    setColors(ks, specials = {}) { ks.forEach((k, i) => { if (!grid[i]) return; grid[i].k = k; grid[i].s = specials[i] || null; dress(grid[i]); }); },
    start, begin, startBlitz, showMap, smash, setHammer, gravity, levels: LEVELS.length,
    unlockAll() { save.max = LEVELS.length - 1; persist(); paintMap(); }
  };
  if (!Curio.touchpad && !Curio.store.get('padtip:match-three', false)) { Curio.store.set('padtip:match-three', true); setTimeout(() => Curio.toast('Tip: on a laptop touchpad? Turn on Touchpad mode in the top bar.', 3400), 2200); }
})();
