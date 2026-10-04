(function () {
  const { els, CATS, SETS } = window.PT;
  const $ = (id) => document.getElementById(id);
  const grid = $('grid');
  const STATE = { solid: { c: '#8fa8c8', name: 'Solid', ico: '🧊' }, liquid: { c: '#4fb3ff', name: 'Liquid', ico: '💧' }, gas: { c: '#ffb45e', name: 'Gas', ico: '💨' }, unknown: { c: '#d4cec6', name: 'Unknown', ico: '❔' } };
  const PRESETS = [
    [0, 'Absolute zero'], [77, 'Liquid nitrogen'], [195, 'Coldest place on Earth'], [298, 'Room temperature'], [310, 'Your body'],
    [373, 'Boiling water'], [1473, 'Lava'], [1811, 'Iron melts'], [3695, 'Tungsten melts'], [5772, 'Surface of the Sun']
  ];
  let mode = 'cat', temp = 298, selected = null, catFilter = null;

  const fmtK = (k, est) => k == null ? 'unknown' : `${est ? '≈' : ''}${Curio.fmt(k, k % 1 ? 2 : 0)} K`;
  const toC = (k) => k - 273.15;
  const massTxt = (e) => e.radioactive ? `[${e.mass}]` : String(e.mass);

  function stateAt(e, T) {
    if (e.mp == null) return 'unknown';
    if (T < e.mp) return 'solid';
    if (e.bp == null) return 'unknown';
    if (T < e.bp) return 'liquid';
    return 'gas';
  }

  const cells = [];
  for (const [r, label] of [[6, '57-71'], [7, '89-103']]) {
    const d = document.createElement('div');
    d.className = 'ph-gap';
    d.style.gridRow = r; d.style.gridColumn = 3;
    d.textContent = label;
    d.setAttribute('aria-hidden', 'true');
    grid.append(d);
  }
  for (const e of els) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'el';
    b.style.gridRow = e.row;
    b.style.gridColumn = e.col;
    b.dataset.z = e.z;
    b.setAttribute('aria-label', `${e.name}, ${e.sym}, atomic number ${e.z}`);
    b.innerHTML = `<span class="n">${e.z}</span><span class="s">${e.sym}</span><span class="nm">${e.name}</span><span class="ph" aria-hidden="true"></span>`;
    grid.append(b);
    cells.push({ e, b });
  }

  function paint() {
    for (const { e, b } of cells) {
      let c;
      b.classList.remove('st-unknown');
      const setV = activeSet() && activeSet().v && activeSet().pct ? activeSet().v[e.sym] : null;
      if (mode === 'cat') { c = CATS[e.cat].c; b.querySelector('.ph').textContent = ''; }
      else if (mode === 'year') { c = yearColor(e.year); b.querySelector('.ph').textContent = ''; }
      else {
        const s = stateAt(e, temp);
        c = STATE[s].c;
        if (s === 'unknown') b.classList.add('st-unknown');
        b.querySelector('.ph').textContent = s === 'unknown' ? '' : STATE[s].ico;
      }
      b.style.setProperty('--c', c);
      if (setV != null) b.querySelector('.ph').textContent = `${setV >= 1 ? Curio.fmt(setV, setV < 10 ? 1 : 0) : setV >= 0.001 ? Curio.fmt(setV, 3) : '<0.001'}%`;
    }
    if (selected) renderCard(selected);
    paintLegend();
    paintCounts();
  }

  function paintCounts() {
    const box = $('counts');
    box.hidden = mode !== 'state';
    if (mode !== 'state') return;
    const n = { solid: 0, liquid: 0, gas: 0, unknown: 0 };
    els.forEach((e) => n[stateAt(e, temp)]++);
    box.innerHTML = Object.keys(n).map((k) => `<span><i style="background:${STATE[k].c}"></i>${n[k]} ${STATE[k].name.toLowerCase()}</span>`).join('');
  }

  function paintLegend() {
    const L = $('legend');
    if (mode === 'year') {
      L.innerHTML = [[0, 'Ancient'], [1700, '1700s'], [1800, '1800s'], [1900, '1900s'], [1950, 'After 1950']].map(([y, n]) => `<span class="lg" style="--c:${yearColor(y === 0 ? 0 : y + 30)}"><i></i>${n}</span>`).join('');
      return;
    }
    if (mode === 'cat') {
      L.innerHTML = Object.entries(CATS).map(([k, v]) => `<button type="button" data-cat="${k}" aria-pressed="${catFilter === k}" style="--c:${v.c}"><i></i>${v.name}</button>`).join('');
    } else {
      L.innerHTML = Object.entries(STATE).map(([k, v]) => `<button type="button" data-state="${k}" aria-pressed="${catFilter === 's:' + k}" style="--c:${v.c}"><i></i>${v.ico} ${v.name} at ${Curio.fmt(temp)} K</button>`).join('');
    }
  }

  $('legend').addEventListener('click', (ev) => {
    const b = ev.target.closest('button');
    if (!b) return;
    const key = b.dataset.cat || 's:' + b.dataset.state;
    catFilter = catFilter === key ? null : key;
    $('q').value = '';
    applyFilter();
    paintLegend();
    Curio.beep(catFilter ? 660 : 440, 0.06, 'triangle', 0.06);
  });

  function applyFilter() {
    const q = $('q').value.trim().toLowerCase();
    let first = null;
    for (const { e, b } of cells) {
      let on = true;
      if (q) on = e.name.toLowerCase().includes(q) || e.sym.toLowerCase() === q || String(e.z) === q || (q.length > 1 && e.sym.toLowerCase().startsWith(q));
      else if (catFilter && catFilter.startsWith('set:')) { const st = activeSet(); on = st.v ? st.v[e.sym] != null : e.year === 0; }
      else if (catFilter && catFilter.startsWith('s:')) on = stateAt(e, temp) === catFilter.slice(2);
      else if (catFilter) on = e.cat === catFilter;
      if (mode === 'year' && !q && e.year > yearNow) on = false;
      b.classList.toggle('dim', !on);
      b.classList.toggle('hit', !!q && on);
      if (on && !first) first = e;
    }
    return first;
  }

  function renderCard(e) {
    const s = stateAt(e, temp);
    const cat = CATS[e.cat];
    const colour = mode === 'cat' ? cat.c : mode === 'year' ? yearColor(e.year) : STATE[s].c;
    const year = e.year === 0 ? 'Ancient times' : String(e.year);
    const sh = shells(e.z);
    const html = `<div class="card" style="--c:${colour}">
      <div class="big"><span>${e.z}</span><b>${e.sym}</b><small>${massTxt(e)}</small></div>
      <div class="head"><h2>${e.name}</h2>
        <div class="tags"><span>${cat.name}</span><span>${STATE[e.phase]?.ico || ''} ${e.phase === 'unknown' ? 'State unknown' : STATE[e.phase].name + ' at room temp'}</span>${e.radioactive ? '<span>☢️ Radioactive</span>' : ''}</div>
        <p class="origin">🏷️ Named after ${e.origin}.</p>
      </div>
      <div class="atom" aria-hidden="true">${atomSvg(sh)}</div>
      <div class="facts">
        <span>Atomic mass <b>${massTxt(e)}</b></span>
        <span>Discovered <b>${year}</b></span>
        <span>${e.sublimes ? 'Sublimes' : 'Melts'} <b>${e.z === 2 ? 'never' : fmtK(e.mp, e.mpEst)}</b>${e.mp != null && e.z !== 2 ? ` <span class="c-muted">${Curio.fmt(toC(e.mp))} °C</span>` : ''}</span>
        <span>Boils <b>${e.sublimes ? 'turns straight to gas' : fmtK(e.bp, e.bpEst)}</b>${e.bp != null && !e.sublimes ? ` <span class="c-muted">${Curio.fmt(toC(e.bp))} °C</span>` : ''}</span>
        <span>Protons <b>${e.z}</b> · electrons <b>${e.z}</b></span>
        <span>Shells <b>${sh.join(' · ')}</b></span>
        <span>Period <b>${period(e)}</b> · ${blockOf(e)}-block</span>
        ${mode === 'state' ? `<span>At ${Curio.fmt(temp)} K <b>${STATE[s].ico} ${STATE[s].name.toLowerCase()}</b></span>` : ''}
      </div>
      <p>${e.z === 2 ? 'Helium never freezes at normal pressure, not even at absolute zero. You have to squeeze it to about 25 atmospheres. ' : ''}${e.fact}</p>
    </div>`;
    target().innerHTML = html;
  }

  function idleCard() {
    target().innerHTML = `<div class="card"><div class="big" style="--c:var(--surface-2);color:var(--ink)"><span>?</span><b>✦</b><small>pick one</small></div>
      <div><h2>Pick an element</h2><div class="tags"><span>118 elements</span><span>94 found in nature</span><span>24 made in labs</span></div></div>
      <p class="hint">Hover or tap any square to learn about it. Everything you have ever touched, eaten or breathed is built from these.</p></div>`;
  }

  const narrow = matchMedia('(max-width: 860px)');
  const target = () => narrow.matches ? $('cardOut') : $('cardSlot');
  narrow.addEventListener('change', () => { $('cardOut').innerHTML = ''; $('cardSlot').innerHTML = ''; selected ? renderCard(selected) : idleCard(); });

  function select(e, sound) {
    selected = e;
    explore(e);
    cells.forEach(({ e: x, b }) => b.classList.toggle('sel', x === e));
    renderCard(e);
    if (sound) Curio.beep(220 * Math.pow(2, (e.z % 24) / 12), 0.09, 'triangle', 0.07);
  }

  grid.addEventListener('mouseover', (ev) => {
    const b = ev.target.closest('.el');
    if (b && !document.body.classList.contains('questing') && matchMedia('(hover: hover)').matches) renderCard(cells[b.dataset.z - 1].e);
  });
  grid.addEventListener('mouseleave', () => { selected ? renderCard(selected) : idleCard(); });
  grid.addEventListener('click', (ev) => {
    const b = ev.target.closest('.el');
    if (!b) return;
    select(cells[b.dataset.z - 1].e, true);
    if (narrow.matches) $('cardOut').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
  grid.addEventListener('focusin', (ev) => {
    if (document.body.classList.contains('questing')) return;
    const b = ev.target.closest('.el');
    if (b) select(cells[b.dataset.z - 1].e, false);
  });
  grid.addEventListener('keydown', (ev) => {
    const b = ev.target.closest('.el');
    if (!b) return;
    const e = cells[b.dataset.z - 1].e;
    const d = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }[ev.key];
    if (!d) return;
    ev.preventDefault();
    let best = null, bestScore = Infinity;
    for (const { e: x, b: xb } of cells) {
      if (x === e) continue;
      const dr = x.row - e.row, dc = x.col - e.col;
      let score;
      if (d[0]) { if (dc !== 0 || Math.sign(dr) !== d[0]) continue; score = Math.abs(dr); }
      else { if (dr !== 0 || Math.sign(dc) !== d[1]) continue; score = Math.abs(dc); }
      if (score < bestScore) { bestScore = score; best = xb; }
    }
    if (best) { best.focus(); best.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
  });

  $('q').addEventListener('input', () => {
    catFilter = null; paintLegend();
    const first = applyFilter();
    if (first && $('q').value.trim()) renderCard(first);
  });
  $('q').addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') {
      const first = applyFilter();
      if (first) { select(first, true); cells[first.z - 1].b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }); }
      else Curio.toast('No element by that name. Yet.');
    }
    if (ev.key === 'Escape') { $('q').value = ''; applyFilter(); }
  });

  function setMode(m) {
    mode = m;
    $('modeCat').setAttribute('aria-pressed', String(m === 'cat'));
    $('modeState').setAttribute('aria-pressed', String(m === 'state'));
    $('modeYear').setAttribute('aria-pressed', String(m === 'year'));
    $('yearbox').hidden = m !== 'year';
    if (m !== 'year') stopYearPlay();
    paintSets();
    catFilter = null;
    applyFilter();
    paint();
  }
  $('modeCat').addEventListener('click', () => { setMode('cat'); Curio.beep(520, 0.06, 'sine', 0.06); });
  $('modeState').addEventListener('click', () => { setMode('state'); Curio.beep(780, 0.06, 'sine', 0.06); });

  function nearestPreset(T) {
    let best = null;
    for (const [k, n] of PRESETS) if (Math.abs(k - T) <= Math.max(4, T * 0.02)) best = n;
    return best;
  }
  let lastCount = null;
  function setTemp(T, fromUser) {
    temp = T;
    $('t').value = T;
    const c = toC(T), f = c * 9 / 5 + 32;
    const tag = nearestPreset(T);
    $('tRead').innerHTML = `${Curio.fmt(T)} K<small>${Curio.fmt(c)} °C · ${Curio.fmt(f)} °F${tag ? ' · ' + tag : ''}</small>`;
    if (mode !== 'state') setMode('state'); else { if (catFilter) applyFilter(); paint(); }
    if (T >= 5700) award('sun');
    const n = els.filter((e) => stateAt(e, T) === 'gas').length;
    if (fromUser && lastCount != null && n !== lastCount) Curio.beep(n > lastCount ? 880 : 330, 0.04, 'sine', 0.04);
    lastCount = n;
  }
  $('t').addEventListener('input', () => setTemp(Number($('t').value), true));
  $('presets').innerHTML = PRESETS.map(([k, n]) => `<button type="button" data-k="${k}">${n}</button>`).join('');
  $('presets').addEventListener('click', (ev) => {
    const b = ev.target.closest('button');
    if (!b) return;
    const from = temp, to = Number(b.dataset.k), t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / 600), k = 1 - Math.pow(1 - p, 3);
      setTemp(Math.round(from + (to - from) * k), true);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });

  const buzz = (ms) => { try { if (!Curio.muted && navigator.vibrate) navigator.vibrate(ms); } catch (x) {} };
  SETS.forEach((st) => { st.pct = ['body', 'air', 'crust'].includes(st.id); });
  function activeSet() { return catFilter && catFilter.startsWith('set:') ? SETS.find((x) => x.id === catFilter.slice(4)) : null; }
  function yearColor(y) {
    if (!y) return '#d9b26f';
    const t = Math.max(0, Math.min(1, (y - 1650) / 360));
    return `hsl(${Math.round(25 + t * 245)}, 70%, ${Math.round(74 - t * 6)}%)`;
  }
  const ORDER = [[1, 0], [2, 0], [2, 1], [3, 0], [3, 1], [4, 0], [3, 2], [4, 1], [5, 0], [4, 2], [5, 1], [6, 0], [4, 3], [5, 2], [6, 1], [7, 0], [5, 3], [6, 2], [7, 1]];
  const FIX = { 24: [4, 3, 1], 29: [4, 3, 1], 41: [5, 4, 1], 42: [5, 4, 1], 44: [5, 4, 1], 45: [5, 4, 1], 46: [5, 4, 2], 47: [5, 4, 1], 57: [4, 5, 1], 58: [4, 5, 1], 64: [4, 5, 1], 78: [6, 5, 1], 79: [6, 5, 1], 89: [5, 6, 1], 90: [5, 6, 2], 91: [5, 6, 1], 92: [5, 6, 1], 93: [5, 6, 1], 96: [5, 6, 1], 103: [6, 7, 1] };
  function shells(z) {
    const sh = [0, 0, 0, 0, 0, 0, 0, 0];
    let left = z;
    for (const [n, l] of ORDER) { if (!left) break; const take = Math.min(left, 4 * l + 2); sh[n] += take; left -= take; }
    const f = FIX[z];
    if (f) { sh[f[0]] -= f[2]; sh[f[1]] += f[2]; }
    return sh.slice(1).filter((v, i, a) => a.slice(i).some((x) => x > 0));
  }
  const period = (e) => e.row > 7 ? e.row - 3 : e.row;
  function blockOf(e) {
    if (e.row > 7) return 'f';
    if (e.z === 2 || e.col <= 2) return 's';
    if (e.col >= 13) return 'p';
    return 'd';
  }
  function atomSvg(sh) {
    const n = sh.length;
    const R = (i) => 16 + (i + 1) * (40 / n);
    let out = `<svg viewBox="-62 -62 124 124"><defs><radialGradient id="nuG"><stop offset="0" stop-color="#ffe0a0"/><stop offset="1" stop-color="#ff5a36"/></radialGradient></defs>`;
    sh.forEach((cnt, i) => {
      const r = R(i);
      out += `<circle r="${r}" fill="none" stroke="currentColor" stroke-opacity=".22" stroke-width="1"/>`;
      out += `<g class="shell" style="animation-duration:${6 + i * 3.5}s;animation-direction:${i % 2 ? 'reverse' : 'normal'}">`;
      for (let k = 0; k < cnt; k++) { const a = k / cnt * Math.PI * 2; out += `<circle cx="${(Math.cos(a) * r).toFixed(1)}" cy="${(Math.sin(a) * r).toFixed(1)}" r="${n > 5 ? 1.7 : 2.4}" fill="#4fb3ff"/>`; }
      out += '</g>';
    });
    const nr = 6 + Math.min(8, n * 1.2);
    out += `<circle r="${nr}" fill="url(#nuG)"/><circle cx="${-nr / 3}" cy="${-nr / 3}" r="${nr / 3}" fill="#fff" opacity=".45"/></svg>`;
    return out;
  }

  const BADGES = [
    { id: 'x10', e: '🔬', name: 'Curious', d: 'Look at 10 elements' },
    { id: 'x50', e: '🧪', name: 'Lab regular', d: 'Look at 50 elements' },
    { id: 'x118', e: '🏆', name: 'Every last one', d: 'Look at all 118 elements' },
    { id: 'sun', e: '☀️', name: 'Solar furnace', d: 'Heat the table to the surface of the Sun' },
    { id: 'history', e: '📜', name: 'Historian', d: 'Play the whole discovery timeline' },
    { id: 'sets', e: '🗂️', name: 'Collector', d: 'Open every collection' },
    { id: 'rush', e: '⚡', name: 'Quick finder', d: 'Find 15 elements in one 60-second rush' },
    { id: 'names', e: '🔤', name: 'Name dropper', d: 'Get 10 out of 10 in Name it' },
    { id: 'daily', e: '📅', name: 'Daily chemist', d: 'Finish the daily quest' }
  ];
  const SKEY = 'pt:save:v1';
  let save = Curio.store.get(SKEY, null);
  if (!save || typeof save !== 'object' || !Array.isArray(save.seen)) save = { seen: [], badges: {}, sets: [] };
  if (!save.badges || typeof save.badges !== 'object') save.badges = {};
  if (!Array.isArray(save.sets)) save.sets = [];
  const persist = () => Curio.store.set(SKEY, save);
  function award(id) {
    if (save.badges[id]) return;
    const b = BADGES.find((x) => x.id === id); if (!b) return;
    save.badges[id] = Date.now(); persist(); paintProgress();
    Curio.toast(`${b.e} Badge: ${b.name}`, 2400);
    [784, 988, 1318].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.14, 'triangle', 0.06), i * 90));
    buzz([20, 40, 20]);
  }
  function explore(e) {
    if (save.seen.includes(e.z)) return;
    save.seen.push(e.z); persist(); paintProgress();
    const n = save.seen.length;
    if (n >= 10) award('x10');
    if (n >= 50) award('x50');
    if (n >= 118) award('x118');
  }
  function paintProgress() {
    const n = save.seen.length;
    $('expBar').style.width = `${n / 118 * 100}%`;
    $('expTxt').textContent = `Explored ${n} of 118`;
    $('badgeCount').textContent = `${BADGES.filter((b) => save.badges[b.id]).length}/${BADGES.length}`;
    cells.forEach(({ e, b }) => b.classList.toggle('seen', save.seen.includes(e.z)));
  }
  $('badgesBtn').addEventListener('click', () => {
    const box = document.createElement('div'); box.className = 'badgeList';
    BADGES.forEach((b) => { const d = document.createElement('div'); if (!save.badges[b.id]) d.className = 'off'; d.innerHTML = `<i>${b.e}</i><div><b></b><span></span></div>`; d.querySelector('b').textContent = b.name; d.querySelector('span').textContent = b.d; box.append(d); });
    Curio.modal({ emoji: '🏅', title: 'Badges', body: box, buttons: [{ label: 'Close', value: 0 }] });
  });

  function paintSets() {
    const box = $('sets');
    box.innerHTML = SETS.map((st) => `<button type="button" data-set="${st.id}" aria-pressed="${catFilter === 'set:' + st.id}">${st.ico} ${st.name}</button>`).join('');
    const st = activeSet();
    let note = $('setNote');
    if (!note) { note = document.createElement('p'); note.id = 'setNote'; note.className = 'setNote'; box.after(note); }
    note.textContent = st ? st.blurb : '';
    note.hidden = !st;
  }
  $('sets').addEventListener('click', (ev) => {
    const b = ev.target.closest('button'); if (!b) return;
    const key = `set:${b.dataset.set}`;
    catFilter = catFilter === key ? null : key;
    $('q').value = '';
    if (catFilter && !save.sets.includes(b.dataset.set)) { save.sets.push(b.dataset.set); persist(); if (SETS.every((x) => save.sets.includes(x.id))) award('sets'); }
    applyFilter(); paint(); paintSets();
    Curio.beep(catFilter ? 700 : 440, 0.07, 'triangle', 0.06);
  });

  let yearNow = 2010;
  const MILESTONES = [[1250, 'Albertus Magnus describes arsenic.'], [1669, 'Hennig Brand boils urine and finds glowing phosphorus: the first element with a known discoverer.'], [1774, 'Oxygen, chlorine and manganese all turn up in the same year.'], [1808, 'Humphry Davy uses batteries to rip out sodium, potassium, calcium and more.'], [1869, 'Mendeleev publishes his periodic table and leaves gaps for elements nobody has found yet.'], [1898, 'Marie and Pierre Curie find polonium and radium.'], [1937, 'Technetium becomes the first element made by humans.'], [1945, 'The atomic age: new elements now come from reactors and bombs.'], [1952, 'Einsteinium and fermium are found in the debris of the first hydrogen bomb test.'], [2010, 'Tennessine, element 117, completes the seventh row.']];
  function setYear(y, fromPlay) {
    yearNow = y;
    $('y').value = y;
    const known = els.filter((e) => e.year <= y).length;
    $('yRead').innerHTML = `${y < 1300 ? 'Ancient' : y}<small>${known} known</small>`;
    let ms = MILESTONES[0][1];
    for (const [yy, t] of MILESTONES) if (y >= yy) ms = t;
    $('yNote').textContent = ms;
    applyFilter();
    if (fromPlay && known !== lastKnown && lastKnown != null) { Curio.beep(330 + known * 6, 0.05, 'triangle', 0.04); }
    lastKnown = known;
  }
  let lastKnown = null;
  $('y').addEventListener('input', () => setYear(Number($('y').value), true));
  $('modeYear').addEventListener('click', () => { setMode('year'); setYear(yearNow, false); Curio.beep(640, 0.06, 'sine', 0.06); });
  let yRaf = 0;
  function stopYearPlay() { cancelAnimationFrame(yRaf); yRaf = 0; $('yPlay').setAttribute('aria-pressed', 'false'); $('yPlay').textContent = '▶ Play history'; }
  $('yPlay').addEventListener('click', () => {
    if (yRaf) { stopYearPlay(); return; }
    const years = [...new Set(els.map((e) => e.year).filter((y) => y > 0))].sort((a, b) => a - b);
    let i = 0, last = performance.now();
    $('yPlay').setAttribute('aria-pressed', 'true'); $('yPlay').textContent = '⏸ Pause';
    setYear(1200, false);
    const step = (now) => {
      if (document.hidden) { stopYearPlay(); return; }
      if (now - last > 170) { last = now; setYear(years[i], true); i++; }
      if (i >= years.length) { stopYearPlay(); setYear(2010, false); award('history'); Curio.confetti(60); return; }
      yRaf = requestAnimationFrame(step);
    };
    yRaf = requestAnimationFrame(step);
  });

  function hashStr(str) { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const today = new Date();
  const dayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  $('dayBtn').addEventListener('click', () => {
    const e = els[hashStr(`pt-day-${dayKey}`) % 118];
    select(e, true);
    const c = cells[e.z - 1].b;
    c.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
    c.classList.remove('pulse'); void c.offsetWidth; c.classList.add('pulse');
    Curio.toast(`✨ Today's element: ${e.name}`);
  });

  const EASY = els.filter((e) => e.z <= 56 || ['Au', 'Pt', 'Hg', 'Pb', 'U', 'Pu', 'Rn', 'W', 'Ra'].includes(e.sym));
  const Q = { on: false, kind: 'find', pool: EASY, list: [], i: 0, score: 0, right: 0, combo: 0, t0: 0, dur: 60, raf: 0, daily: false, log: [] };
  let qKind = 'find', qLevel = 'easy';
  function questMenu() {
    const box = document.createElement('div');
    box.className = 'qmenu';
    const best = (k) => { const b = Curio.getBest(k); return b == null ? 'no score yet' : `best ${b}`; };
    box.innerHTML = `<p>Learn the table by playing with it.</p>
      <div class="qmodes" role="group" aria-label="Quest type">
        <button type="button" data-k="find"><b>🎯 Find it</b><span>60 seconds. Tap each element on the table. ${best('find-easy')}</span></button>
        <button type="button" data-k="name"><b>🔤 Name it</b><span>10 symbols, pick the right name. ${best('name-easy')}</span></button>
        <button type="button" data-k="daily"><b>📅 Daily quest</b><span>Find the same 10 as everyone today, fast. ${best('daily')}</span></button>
      </div>
      <div class="qlevel" role="group" aria-label="Which elements"><button type="button" data-l="easy">Common elements</button><button type="button" data-l="all">All 118</button></div>`;
    const paint = () => {
      box.querySelectorAll('[data-k]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.k === qKind)));
      box.querySelectorAll('[data-l]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.l === qLevel)));
    };
    box.addEventListener('click', (ev) => {
      const b = ev.target.closest('button'); if (!b) return;
      if (b.dataset.k) qKind = b.dataset.k;
      if (b.dataset.l) qLevel = b.dataset.l;
      paint(); Curio.beep(560, 0.05, 'sine', 0.05);
    });
    paint();
    Curio.modal({ emoji: '🎮', title: 'Element Quest', body: box, buttons: [{ label: 'Start', value: 'go' }, { label: 'Not now', value: 0 }] }).then((v) => { if (v === 'go') startQuest(); });
  }
  $('questBtn').addEventListener('click', questMenu);
  function startQuest() {
    stopYearPlay();
    if (mode === 'year') setMode('cat');
    catFilter = null; $('q').value = ''; applyFilter(); paint(); paintSets();
    Q.kind = qKind === 'daily' ? 'find' : qKind;
    Q.daily = qKind === 'daily';
    Q.pool = qLevel === 'all' || Q.daily ? els : EASY;
    const r = Q.daily ? rng(hashStr(`pt-${dayKey}`)) : Math.random;
    const arr = Q.pool.slice();
    for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    Q.list = Q.daily ? arr.filter((e) => e.z <= 92).slice(0, 10) : arr;
    Object.assign(Q, { on: true, i: 0, score: 0, right: 0, combo: 0, t0: performance.now(), log: [], misses: 0 });
    Q.dur = Q.kind === 'find' && !Q.daily ? 60 : 0;
    $('quest').hidden = false;
    document.body.classList.add('questing');
    $('quest').scrollIntoView({ block: 'start', behavior: 'smooth' });
    nextQ();
    cancelAnimationFrame(Q.raf);
    Q.raf = requestAnimationFrame(tickQ);
    Curio.beep(523, 0.1, 'triangle', 0.06); setTimeout(() => Curio.beep(784, 0.15, 'triangle', 0.06), 100);
  }
  function tickQ(now) {
    if (!Q.on) return;
    if (document.hidden) { Q.t0 += 16; Q.raf = requestAnimationFrame(tickQ); return; }
    const el = (now - Q.t0) / 1000;
    if (Q.dur) {
      const left = Math.max(0, Q.dur - el);
      $('qTime').textContent = `${Math.ceil(left)}s`;
      $('qBar').style.width = `${left / Q.dur * 100}%`;
      if (left <= 0) return endQuest();
    } else {
      $('qTime').textContent = Q.daily ? `${Curio.fmt(el, 1)}s` : `${Q.i}/10`;
      $('qBar').style.width = `${Q.i / 10 * 100}%`;
    }
    Q.raf = requestAnimationFrame(tickQ);
  }
  function nextQ() {
    const e = Q.list[Q.i % Q.list.length];
    Q.cur = e;
    const pr = $('qPrompt'), op = $('qOpts');
    op.innerHTML = '';
    if (Q.kind === 'find') {
      pr.innerHTML = `<span>Find</span><b></b>`;
      pr.querySelector('b').textContent = e.name;
    } else {
      pr.innerHTML = `<div class="qtile" style="--c:${CATS[e.cat].c}"><small>${e.z}</small><b>${e.sym}</b></div><span>What is this?</span>`;
      const wrong = Curio.shuffle(Q.pool.filter((x) => x !== e)).slice(0, 3);
      Curio.shuffle([e, ...wrong]).forEach((x) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'qopt'; b.textContent = x.name;
        b.addEventListener('click', () => answerName(x, b));
        op.append(b);
      });
    }
    pr.classList.remove('in'); void pr.offsetWidth; pr.classList.add('in');
  }
  function flashCell(z, cls) { const c = cells[z - 1].b; c.classList.remove('good', 'bad'); void c.offsetWidth; c.classList.add(cls); setTimeout(() => c.classList.remove(cls), 900); }
  function hitFind(e) {
    if (!Q.on || Q.kind !== 'find') return false;
    if (e === Q.cur) {
      Q.combo++; Q.right++;
      const pts = 10 * Math.min(5, 1 + Math.floor(Q.combo / 3));
      Q.score += pts;
      flashCell(e.z, 'good');
      popText(cells[e.z - 1].b, Q.combo >= 3 ? `+${pts} x${Math.min(5, 1 + Math.floor(Q.combo / 3))}` : `+${pts}`);
      Curio.beep(500 + Math.min(Q.combo, 12) * 40, 0.08, 'triangle', 0.07); buzz(12);
      Q.log.push('🟩');
      Q.i++;
      $('qScore').textContent = Q.score;
      if (Q.daily && Q.i >= 10) return endQuest(), true;
      nextQ();
    } else {
      Q.combo = 0; Q.misses++;
      flashCell(e.z, 'bad'); flashCell(Q.cur.z, 'good');
      Curio.beep(170, 0.2, 'sawtooth', 0.05); buzz([30, 20, 30]);
      $('quest').classList.remove('shake'); void $('quest').offsetWidth; $('quest').classList.add('shake');
      Q.log.push('🟥');
      if (Q.daily) Q.t0 -= 5000;
    }
    return true;
  }
  function answerName(x, btn) {
    if (!Q.on || Q.locked) return;
    Q.locked = true;
    const ok = x === Q.cur;
    [...$('qOpts').children].forEach((b) => { b.disabled = true; if (b.textContent === Q.cur.name) b.classList.add('good'); });
    if (ok) { Q.right++; Q.combo++; Q.score += 100 + (Q.combo - 1) * 20; Curio.beep(700 + Q.combo * 30, 0.1, 'triangle', 0.07); buzz(12); Q.log.push('🟩'); }
    else { btn.classList.add('bad'); Q.combo = 0; Curio.beep(170, 0.2, 'sawtooth', 0.05); buzz([30, 20, 30]); Q.log.push('🟥'); }
    flashCell(Q.cur.z, 'good');
    cells[Q.cur.z - 1].b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    $('qScore').textContent = Q.score;
    Q.i++;
    setTimeout(() => { Q.locked = false; if (Q.i >= 10) endQuest(); else nextQ(); }, 900);
  }
  function popText(el, txt) {
    const r = el.getBoundingClientRect();
    const p = document.createElement('div');
    p.className = 'popTxt'; p.textContent = txt;
    p.style.left = `${r.left + r.width / 2}px`; p.style.top = `${r.top}px`;
    document.body.append(p);
    setTimeout(() => p.remove(), 900);
  }
  function stopQuest() { Q.on = false; cancelAnimationFrame(Q.raf); $('quest').hidden = true; document.body.classList.remove('questing'); }
  $('qQuit').addEventListener('click', () => { stopQuest(); Curio.beep(330, 0.1, 'sine', 0.05); });
  function endQuest() {
    const secs = (performance.now() - Q.t0) / 1000;
    stopQuest();
    let key, val, hi = true, title, line;
    if (Q.daily) { key = 'daily'; val = Math.round(secs * 10) / 10; hi = false; title = `${Curio.fmt(val, 1)} seconds`; line = `Daily quest for ${dayKey}: 10 found${Q.misses ? `, ${Q.misses} wrong taps (+5 s each)` : ', no mistakes'}.`; award('daily'); }
    else if (Q.kind === 'find') { key = `find-${qLevel}`; val = Q.score; title = `${Q.right} found!`; line = `${Q.score} points in 60 seconds.`; if (Q.right >= 15) award('rush'); }
    else { key = `name-${qLevel}`; val = Q.score; title = `${Q.right} out of 10`; line = `${Q.score} points.`; if (Q.right === 10) award('names'); }
    const b = Curio.best(key, val, hi);
    if (b.isNew || Q.right >= 10) Curio.confetti();
    [523, 659, 784].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.15, 'triangle', 0.07), i * 100));
    const share = `Periodic Table · ${Q.daily ? `Daily quest ${dayKey}` : Q.kind === 'find' ? 'Find it' : 'Name it'}\n${Q.log.slice(0, 30).join('')}\n${title}`;
    Curio.modal({ emoji: Q.right >= 10 ? '🏆' : '⚗️', title, body: `${line} ${b.isNew ? 'New personal best!' : `Best: ${hi ? b.best : Curio.fmt(b.best, 1) + ' s'}.`}`, buttons: [{ label: 'Play again', value: 'again' }, { label: 'Copy result', value: 'share' }, { label: 'Done', value: 0 }] }).then(async (v) => {
      if (v === 'again') startQuest();
      if (v === 'share') { try { await navigator.clipboard.writeText(share); Curio.toast('Copied! 📋'); } catch (x) { Curio.toast('Could not copy, sorry'); } }
    });
  }
  grid.addEventListener('click', (ev) => {
    if (!Q.on || Q.kind !== 'find') return;
    const b = ev.target.closest('.el'); if (!b) return;
    ev.stopImmediatePropagation();
    hitFind(cells[b.dataset.z - 1].e);
  }, true);

  addEventListener('keydown', (ev) => {
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    const tag = (ev.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    if (ev.key === 'Escape' && Q.on) { stopQuest(); return; }
    if (Q.on && Q.kind === 'name' && /^[1-4]$/.test(ev.key)) { const b = $('qOpts').children[Number(ev.key) - 1]; if (b && !b.disabled) b.click(); return; }
    if (ev.key === '/') { ev.preventDefault(); $('q').focus(); }
  });

  if (Curio.simple) $('sub').textContent = 'All 118 known elements, hung in one gallery. Take the guided tour of the twelve most famous, or tap any square to read its placard.';
  const TOUR = [
    [1, 'The first and simplest element. About three quarters of all normal matter in the universe.'],
    [2, 'Lighter than air and so cold as a liquid that it never freezes on its own.'],
    [6, 'The backbone of every living thing, and of diamonds and pencil lead too.'],
    [8, 'Every breath you take. Also most of the mass of your body, thanks to water.'],
    [10, 'The glow in old shop signs. It refuses to react with almost anything.'],
    [14, 'Sand, glass and the chip in the device you are reading this on.'],
    [26, 'The heart of the Earth and the red in your blood.'],
    [47, 'The best conductor of electricity of all the elements.'],
    [79, 'So unreactive that ancient gold jewellery still shines today.'],
    [80, 'The only metal that is liquid at room temperature.'],
    [92, 'The heaviest element found in nature in any real amount, and the fuel of nuclear power.'],
    [118, 'The heaviest element ever made. Only a handful of atoms, each gone in under a millisecond.']
  ];
  let tourI = -1, tourTimer = 0, tourPlaying = false;
  const dots = $('tDots');
  TOUR.forEach(() => dots.append(document.createElement('i')));
  function tourGo(i) {
    tourI = (i + TOUR.length) % TOUR.length;
    const [z, why] = TOUR[tourI];
    const e = cells[z - 1].e;
    $('tour').hidden = false;
    $('tLabel').textContent = `${tourI + 1} of ${TOUR.length} · ${e.name}`;
    $('tWhy').textContent = why;
    [...dots.children].forEach((d, k) => d.classList.toggle('on', k <= tourI));
    select(e, true);
    const b = cells[z - 1].b;
    b.classList.remove('pulse'); void b.offsetWidth; b.classList.add('pulse');
    b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    if (narrow.matches) $('tour').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    clearTimeout(tourTimer);
    if (tourPlaying) tourTimer = setTimeout(() => { if (tourI === TOUR.length - 1) { tourPause(); Curio.confetti(); Curio.toast('Tour complete! Tap any element to keep exploring.', 2600); } else tourGo(tourI + 1); }, 6500);
  }
  function tourPause() { tourPlaying = false; clearTimeout(tourTimer); $('tPlay').textContent = '▶'; $('tPlay').setAttribute('aria-pressed', 'false'); $('tPlay').setAttribute('aria-label', 'Play tour'); }
  function tourPlay() { tourPlaying = true; $('tPlay').textContent = '⏸'; $('tPlay').setAttribute('aria-pressed', 'true'); $('tPlay').setAttribute('aria-label', 'Pause tour'); tourGo(tourI < 0 || tourI === TOUR.length - 1 ? 0 : tourI + 1); }
  $('tourBtn').addEventListener('click', () => { tourI = -1; tourPlay(); });
  $('tPlay').addEventListener('click', () => (tourPlaying ? tourPause() : tourPlay()));
  $('tNext').addEventListener('click', () => tourGo(tourI + 1));
  $('tPrev').addEventListener('click', () => tourGo(tourI - 1));
  $('tStop').addEventListener('click', () => { tourPause(); $('tour').hidden = true; });
  $('luckyBtn').addEventListener('click', () => {
    tourPause();
    const e = cells[Math.floor(Math.random() * cells.length)].e;
    select(e, true);
    const b = cells[e.z - 1].b;
    b.classList.remove('pulse'); void b.offsetWidth; b.classList.add('pulse');
    b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    if (narrow.matches) $('cardOut').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
  grid.addEventListener('pointerdown', () => { if (tourPlaying) tourPause(); });
  addEventListener('keydown', (ev) => {
    if (!Curio.simple || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    const tag = (ev.target.tagName || '').toLowerCase();
    if (tag === 'input' || ev.target.closest('.grid')) return;
    if ($('tour').hidden) return;
    if (ev.key === 'ArrowRight') { ev.preventDefault(); tourGo(tourI + 1); }
    else if (ev.key === 'ArrowLeft') { ev.preventDefault(); tourGo(tourI - 1); }
    else if (ev.key === ' ' && tag !== 'button') { ev.preventDefault(); tourPlaying ? tourPause() : tourPlay(); }
  });

  cells.forEach(({ b }, i) => { b.style.animationDelay = `${(b.style.gridRow * 30 + b.style.gridColumn * 18)}ms`; b.classList.add('intro'); });
  paintSets();
  paintProgress();
  idleCard();
  paint();
})();

