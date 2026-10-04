(() => {
  const $ = (s) => document.querySelector(s);
  const C = window.Curio;
  const board = $('#board'), list = $('#list'), search = $('#search'), hint = $('#hint'), goalsEl = $('#goals');
  const EMOJI = {}, RECIPES = new Map(), MAKERS = {}, USES = {};
  window.IC_BASE.forEach(([n, e]) => { EMOJI[n] = e; });
  window.IC_RECIPES.trim().split('\n').forEach((line) => {
    const m = line.match(/^(.+?) \+ (.+?) = (.+) (\S+)$/);
    if (!m) return;
    const k = [m[1], m[2]].sort().join('|');
    if (RECIPES.has(k)) return;
    RECIPES.set(k, m[3]);
    if (!EMOJI[m[3]]) EMOJI[m[3]] = m[4];
    (MAKERS[m[3]] ||= []).push([m[1], m[2]]);
    (USES[m[1]] ||= []).push(k);
    if (m[2] !== m[1]) (USES[m[2]] ||= []).push(k);
  });
  const TOTAL = Object.keys(EMOJI).length;
  const key = (a, b) => [a, b].sort().join('|');
  const baseNames = window.IC_BASE.map((b) => b[0]);

  const TIER = {};
  baseNames.forEach((n) => { TIER[n] = 0; });
  for (let changed = true; changed;) {
    changed = false;
    for (const [k, r] of RECIPES) {
      const [a, b] = k.split('|');
      if (TIER[a] == null || TIER[b] == null) continue;
      const t = Math.max(TIER[a], TIER[b]) + 1;
      if (TIER[r] == null || t < TIER[r]) { TIER[r] = t; changed = true; }
    }
  }
  const MAXTIER = Math.max(...Object.values(TIER));

  let found = C.store.get('ic:found', null);
  if (!Array.isArray(found) || !found.length) found = baseNames.slice();
  found = found.filter((n) => EMOJI[n]);
  baseNames.forEach((n) => { if (!found.includes(n)) found.unshift(n); });
  const foundSet = new Set(found);
  const freshMeta = () => ({ v: 1, how: {}, combos: 0, fails: 0, hints: 0, daily: {}, streak: 0, lastDaily: '', badges: [] });
  let meta = C.store.get('ic:meta', null);
  if (!meta || meta.v !== 1 || typeof meta.how !== 'object') meta = freshMeta();
  meta = Object.assign(freshMeta(), meta);
  const save = () => { C.store.set('ic:found', found); C.store.set('ic:meta', meta); };
  $('#total').textContent = `of ${TOTAL}`;

  const today = (() => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; })();
  function seeded(str) { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; }; }
  const DAILY = (() => {
    const r = seeded(`ic-${today}`);
    const bands = [[3, 4], [5, 6], [7, 9]];
    return bands.map(([lo, hi]) => {
      const pool = Object.keys(TIER).filter((n) => TIER[n] >= lo && TIER[n] <= hi).sort();
      return pool[Math.floor(r() * pool.length)];
    }).filter(Boolean);
  })();
  const LEGENDS = ['Dragon', 'Phoenix', 'Unicorn', 'Internet', 'Time Machine', 'Black Hole', 'Big Bang', 'Atlantis', 'Excalibur', 'Mona Lisa', 'Multiverse', 'Frankenstein', 'Kraken', 'Lightsaber', 'Infinite Craft', 'Universe'].filter((n) => EMOJI[n]);
  const BADGES = [
    { id: 'f10', e: '🌱', n: 'Sprout', t: '10 elements', ok: () => found.length >= 10 },
    { id: 'f50', e: '🌳', n: 'Grove', t: '50 elements', ok: () => found.length >= 50 },
    { id: 'f100', e: '🏙️', n: 'City', t: '100 elements', ok: () => found.length >= 100 },
    { id: 'f250', e: '🌍', n: 'World', t: '250 elements', ok: () => found.length >= 250 },
    { id: 'f500', e: '🌌', n: 'Galaxy', t: '500 elements', ok: () => found.length >= 500 },
    { id: 'f1000', e: '♾️', n: 'Infinite', t: '1000 elements', ok: () => found.length >= 1000 },
    { id: 'tier8', e: '🧗', n: 'Deep Diver', t: 'Reach tier 8', ok: () => found.some((n) => TIER[n] >= 8) },
    { id: 'daily', e: '📅', n: 'Daily Done', t: 'Finish a daily set', ok: () => DAILY.every((n) => foundSet.has(n)) || meta.streak > 0 },
    { id: 'legend3', e: '🐉', n: 'Myth Maker', t: '3 legends', ok: () => LEGENDS.filter((n) => foundSet.has(n)).length >= 3 },
    { id: 'legendAll', e: '👑', n: 'Legendary', t: 'All legends', ok: () => LEGENDS.every((n) => foundSet.has(n)) },
    { id: 'nohint', e: '🧠', n: 'No Help', t: '100 with no hints', ok: () => found.length >= 100 && meta.hints === 0 },
    { id: 'combo', e: '⚗️', n: 'Mad Scientist', t: '500 combos', ok: () => meta.combos >= 500 }
  ];

  let tab = 'el';
  function setTab(t) {
    tab = t;
    $('#tabEl').setAttribute('aria-selected', String(t === 'el'));
    $('#tabGoal').setAttribute('aria-selected', String(t === 'goal'));
    list.hidden = t !== 'el';
    $('#filters').hidden = t !== 'el';
    goalsEl.hidden = t !== 'goal';
    if (t === 'goal') renderGoals();
  }
  $('#tabEl').addEventListener('click', () => setTab('el'));
  $('#tabGoal').addEventListener('click', () => setTab('goal'));

  function chipFor(n, cls = 'ic-chip') {
    const b = document.createElement('button');
    b.type = 'button'; b.className = cls;
    b.dataset.name = n;
    b.innerHTML = '<span class="em"></span><span class="nm"></span><span class="t"></span>';
    b.querySelector('.em').textContent = EMOJI[n];
    b.querySelector('.nm').textContent = n;
    b.querySelector('.t').textContent = TIER[n] ? `T${TIER[n]}` : '';
    return b;
  }
  function renderList(fresh) {
    const q = search.value.trim().toLowerCase();
    list.innerHTML = '';
    let items = found.filter((n) => !q || n.toLowerCase().includes(q));
    const sort = $('#sort').value;
    if (sort === 'new') items = items.slice().reverse();
    else if (sort === 'az') items = items.slice().sort((a, b) => a.localeCompare(b));
    else if (sort === 'tier') items = items.slice().sort((a, b) => (TIER[b] - TIER[a]) || a.localeCompare(b));
    const frag = document.createDocumentFragment();
    for (const n of items) {
      const b = chipFor(n);
      if (n === fresh) b.classList.add('new');
      if (DAILY.includes(n) || LEGENDS.includes(n)) b.classList.add('goal');
      frag.append(b);
    }
    list.append(frag);
    if (!items.length) { const p = document.createElement('div'); p.className = 'ic-empty'; p.textContent = q ? `No "${search.value.trim()}" yet. Maybe you haven't invented it.` : 'Nothing yet. Keep smashing things together.'; list.append(p); }
    $('#count').textContent = found.length;
    $('#bar').style.width = (found.length / TOTAL * 100) + '%';
    if (fresh) list.querySelector('.new')?.scrollIntoView({ block: 'nearest' });
  }

  function goalRow(n, sub) {
    const d = foundSet.has(n);
    const el = document.createElement('div');
    el.className = 'ic-goal' + (d ? ' done' : '');
    el.innerHTML = `<span class="em"></span><div><b></b><small></small></div><span class="ck">${d ? '✅' : '⬜'}</span>`;
    el.querySelector('.em').textContent = EMOJI[n];
    el.querySelector('b').textContent = n;
    el.querySelector('small').textContent = sub;
    return el;
  }
  function renderGoals() {
    goalsEl.innerHTML = '';
    const dDone = DAILY.filter((n) => foundSet.has(n)).length;
    const s1 = document.createElement('div'); s1.className = 'ic-sec';
    s1.innerHTML = `<h3>Today's targets <small>${dDone}/${DAILY.length} · 🔥 ${meta.streak} day streak</small></h3>`;
    const labels = ['Warm-up', 'Tricky', 'Brain melter'];
    DAILY.forEach((n, i) => s1.append(goalRow(n, `${labels[i]} · tier ${TIER[n]}${foundSet.has(n) ? '' : ` · ${hintFor(n)}`}`)));
    goalsEl.append(s1);
    const s2 = document.createElement('div'); s2.className = 'ic-sec';
    const lDone = LEGENDS.filter((n) => foundSet.has(n)).length;
    s2.innerHTML = `<h3>Legends <small>${lDone}/${LEGENDS.length}</small></h3>`;
    LEGENDS.forEach((n) => s2.append(goalRow(n, `Tier ${TIER[n]}${foundSet.has(n) && meta.how[n] ? ` · you made it from ${meta.how[n].join(' + ')}` : ''}`)));
    goalsEl.append(s2);
    const s3 = document.createElement('div'); s3.className = 'ic-sec';
    s3.innerHTML = '<h3>Badges</h3><div class="ic-badges"></div>';
    const bg = s3.querySelector('.ic-badges');
    BADGES.forEach((b) => {
      const d = document.createElement('div');
      d.className = 'ic-badge' + (meta.badges.includes(b.id) ? ' on' : '');
      d.title = b.t;
      d.innerHTML = `<span>${b.e}</span>${b.n}<br><small>${b.t}</small>`;
      bg.append(d);
    });
    goalsEl.append(s3);
    const s4 = document.createElement('div'); s4.className = 'ic-sec';
    const hi = found.reduce((m, n) => Math.max(m, TIER[n] || 0), 0);
    s4.innerHTML = `<h3>Stats</h3><div class="ic-stats"><div class="c-stat"><b>${C.fmt(meta.combos)}</b><span>Combos</span></div><div class="c-stat"><b>${hi}/${MAXTIER}</b><span>Top tier</span></div><div class="c-stat"><b>${meta.hints}</b><span>Hints</span></div></div>`;
    goalsEl.append(s4);
  }
  function hintFor(n) {
    const opts = (MAKERS[n] || []).slice().sort((x, y) => Math.max(TIER[x[0]], TIER[x[1]]) - Math.max(TIER[y[0]], TIER[y[1]]));
    const best = opts.find(([a, b]) => foundSet.has(a) || foundSet.has(b)) || opts[0];
    if (!best) return 'mystery';
    const known = foundSet.has(best[0]) ? best[0] : foundSet.has(best[1]) ? best[1] : null;
    return known ? `needs ${EMOJI[known]} ${known} + ?` : 'needs ? + ?';
  }
  function checkBadges() {
    for (const b of BADGES) {
      if (!meta.badges.includes(b.id) && b.ok()) {
        meta.badges.push(b.id);
        setTimeout(() => C.toast(`${b.e} Badge unlocked: ${b.n}`, 2600), 900);
      }
    }
  }
  function checkDaily(name) {
    if (!DAILY.includes(name)) return;
    if (DAILY.every((n) => foundSet.has(n)) && meta.lastDaily !== today) {
      const y = new Date(); y.setDate(y.getDate() - 1);
      const yk = `${y.getFullYear()}-${y.getMonth() + 1}-${y.getDate()}`;
      meta.streak = meta.lastDaily === yk ? meta.streak + 1 : 1;
      meta.lastDaily = today;
      setTimeout(() => { C.confetti(180); C.toast(`🎯 Daily targets done! Streak: ${meta.streak}`, 3000); }, 600);
    } else setTimeout(() => C.toast(`🎯 Daily target found: ${EMOJI[name]} ${name}`, 2400), 600);
  }

  const insts = new Set();
  let selected = null, zTop = 10;
  function place(el, x, y) {
    const bw = board.clientWidth, bh = board.clientHeight;
    const w = el.offsetWidth || 100, h = el.offsetHeight || 36;
    x = Math.max(4, Math.min(bw - w - 4, x)); y = Math.max(4, Math.min(bh - h - 4, y));
    el._x = x; el._y = y;
    el.style.transform = `translate(${x}px, ${y}px)`;
  }
  function spawn(name, x, y, pop = true) {
    const el = document.createElement('div');
    el.className = 'ic-el' + (pop ? ' pop' : '');
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.dataset.name = name;
    el.setAttribute('aria-label', name + ' on the board');
    el.innerHTML = '<span class="em"></span><span></span>';
    el.firstChild.textContent = EMOJI[name]; el.lastChild.textContent = name;
    el.style.zIndex = ++zTop;
    board.append(el);
    place(el, x - el.offsetWidth / 2, y - el.offsetHeight / 2);
    insts.add(el);
    hint.style.opacity = 0;
    el.addEventListener('animationend', () => el.classList.remove('pop', 'shake'));
    el._undrag = C.drag(el, {
      start: (p) => { const e = p.event; e.preventDefault?.(); startDrag(e, el, false); },
      move: (p) => dragMove(p.clientX, p.clientY, p.event?.movementX),
      end: (p) => dragEnd(p ? p.clientX : null, p ? p.clientY : null)
    });
    el.addEventListener('dblclick', () => dup(el));
    el.addEventListener('contextmenu', (e) => { e.preventDefault(); info(name); });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSelect(el); }
      if (e.key === 'Delete' || e.key === 'Backspace') { removeInst(el); }
      if (e.key === 'i') info(name);
      if (e.key === 'd') dup(el);
    });
    return el;
  }
  function dup(el) { spawn(el.dataset.name, el._x + el.offsetWidth / 2 + 24, el._y + el.offsetHeight / 2 + 24); C.beep(700, .05, 'triangle', .08); }
  function removeInst(el) {
    el._undrag?.();
    insts.delete(el); if (selected === el) selected = null;
    el.classList.add('gone'); setTimeout(() => el.remove(), 160);
  }
  function toggleSelect(el) {
    if (selected && selected !== el) {
      const s = selected; s.classList.remove('sel'); selected = null;
      combine(el, s); return;
    }
    if (selected === el) { el.classList.remove('sel'); selected = null; return; }
    selected = el; el.classList.add('sel');
    C.beep(520, .04, 'sine', .06);
  }
  function freeSpot() {
    const bw = board.clientWidth, bh = board.clientHeight;
    let best = null, bestD = -1;
    for (let i = 0; i < 24; i++) {
      const x = C.rand(bw * .15, bw * .85), y = C.rand(Math.min(110, bh * .3), bh * .82);
      let d = 1e9;
      insts.forEach((o) => { d = Math.min(d, Math.hypot(o._x + o.offsetWidth / 2 - x, o._y + o.offsetHeight / 2 - y)); });
      if (d > bestD) { bestD = d; best = [x, y]; }
    }
    return best;
  }
  function overlapTarget(el) {
    const cx = el._x + el.offsetWidth / 2, cy = el._y + el.offsetHeight / 2;
    let best = null, bd = 1e9;
    insts.forEach((o) => {
      if (o === el || o.classList.contains('gone')) return;
      const ox = o._x + o.offsetWidth / 2, oy = o._y + o.offsetHeight / 2;
      const dx = Math.abs(cx - ox), dy = Math.abs(cy - oy);
      if (dx < (el.offsetWidth + o.offsetWidth) / 2 - 8 && dy < (el.offsetHeight + o.offsetHeight) / 2 - 4) {
        const d = dx + dy; if (d < bd) { bd = d; best = o; }
      }
    });
    return best;
  }

  function burst(x, y, big) {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const cols = big ? ['#ffd24a', '#ff8a3a', '#ff5a8a', '#7aa8ff', '#5ad1a0'] : ['#ffd24a', '#ffffff', '#ffb86b'];
    const n = big ? 22 : 10;
    for (let i = 0; i < n; i++) {
      const s = document.createElement('i');
      s.className = 'ic-spark';
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.4, d = (big ? 70 : 40) + Math.random() * 40;
      s.style.left = `${x - 4}px`; s.style.top = `${y - 4}px`;
      s.style.background = cols[i % cols.length];
      s.style.setProperty('--tx', `${Math.cos(a) * d}px`); s.style.setProperty('--ty', `${Math.sin(a) * d}px`);
      board.append(s);
      setTimeout(() => s.remove(), 750);
    }
    if (big) { const r = document.createElement('i'); r.className = 'ic-ring'; r.style.left = `${x}px`; r.style.top = `${y}px`; board.append(r); setTimeout(() => r.remove(), 650); }
  }
  function flash(name) {
    const f = document.createElement('div');
    f.className = 'ic-flash';
    f.innerHTML = '<small>New discovery!</small><span></span><em class="tierline"></em>';
    f.querySelector('span').textContent = EMOJI[name] + ' ' + name;
    const t = TIER[name] || 0;
    f.querySelector('.tierline').textContent = `${'★'.repeat(Math.min(5, Math.ceil(t / 2)))} Tier ${t} · #${found.length} of ${TOTAL}`;
    board.append(f);
    setTimeout(() => f.remove(), 2300);
  }
  function chime(t) {
    const base = 520 + Math.min(10, t) * 40;
    [1, 1.25, 1.5, 2].forEach((m, i) => setTimeout(() => C.beep(base * m, .12, 'triangle', .09), i * 65));
  }
  const milestones = [10, 25, 50, 100, 150, 200, 250, 300, 400, 500, 750, 1000, 1250, 1500];
  let hintState = null;
  function combine(a, b) {
    const res = RECIPES.get(key(a.dataset.name, b.dataset.name));
    meta.combos++;
    if (!res) {
      meta.fails++;
      [a, b].forEach((x) => { x.classList.remove('shake'); void x.offsetWidth; x.classList.add('shake'); });
      C.beep(150, .12, 'sawtooth', .05);
      try { navigator.vibrate?.(30); } catch (e) { }
      save();
      return false;
    }
    const x = b._x + b.offsetWidth / 2, y = b._y + b.offsetHeight / 2;
    a._undrag?.(); b._undrag?.();
    insts.delete(a); insts.delete(b); a.remove(); b.remove();
    if (selected === a || selected === b) selected = null;
    const el = spawn(res, x, y);
    if (!foundSet.has(res)) {
      foundSet.add(res); found.push(res);
      meta.how[res] = [a.dataset.name, b.dataset.name];
      el.classList.add('fresh');
      setTimeout(() => el.classList.remove('fresh'), 2400);
      renderList(res);
      flash(res); chime(TIER[res] || 0);
      burst(x, y, true);
      try { navigator.vibrate?.([20, 40, 20]); } catch (e) { }
      if (hintState && hintState.r === res) { hintState = null; $('.ic-hintbox')?.remove(); }
      checkDaily(res);
      if (milestones.includes(found.length)) { C.confetti(); C.toast(`🎉 ${found.length} elements! You are basically a god now.`); }
      checkBadges();
      if (found.length === TOTAL) C.modal({ emoji: '🌌', title: 'You made everything', body: `All ${TOTAL} elements discovered. The universe thanks you.`, buttons: [{ label: 'Nice', value: 1 }] });
      if (tab === 'goal') renderGoals();
    } else {
      burst(x, y, false);
      C.beep(880, .06, 'triangle', .08);
    }
    save();
    return true;
  }

  function showHint() {
    let st = hintState;
    if (st && foundSet.has(st.r)) st = null;
    if (!st) {
      const cands = [];
      for (const [k, r] of RECIPES) {
        if (foundSet.has(r)) continue;
        const [p, q] = k.split('|');
        if (foundSet.has(p) && foundSet.has(q)) cands.push({ a: p, b: q, r });
      }
      if (!cands.length) { C.toast('No hints left. You have found everything reachable!'); return; }
      const goalC = cands.filter((c) => DAILY.includes(c.r) || LEGENDS.includes(c.r));
      const pool = goalC.length ? goalC : cands.sort((x, y) => (TIER[x.r] - TIER[y.r])).slice(0, 12);
      st = hintState = Object.assign(C.pick(pool), { lvl: 0 });
      meta.hints++;
      save();
    } else st.lvl = Math.min(2, st.lvl + 1);
    $('.ic-hintbox')?.remove();
    const box = document.createElement('div');
    box.className = 'ic-hintbox';
    const tx = st.lvl === 0 ? `Try ${EMOJI[st.a]} ${st.a} with something you have` : st.lvl === 1 ? `${EMOJI[st.a]} ${st.a} + ${EMOJI[st.b]} ${st.b}` : `${EMOJI[st.a]} ${st.a} + ${EMOJI[st.b]} ${st.b} = ${EMOJI[st.r]} ${st.r}`;
    box.innerHTML = `<small>${st.lvl < 2 ? 'Hint · press again for more' : 'Full answer'}</small><span></span>`;
    box.querySelector('span').textContent = tx;
    board.append(box);
    C.beep(740, .08, 'sine', .07);
    clearTimeout(showHint.t);
    showHint.t = setTimeout(() => box.remove(), 6000);
  }
  $('#hintBtn').addEventListener('click', showHint);
  let infoMode = false;
  function setInfoMode(on) { infoMode = on; $('#infoBtn').setAttribute('aria-pressed', String(on)); board.classList.toggle('info-mode', on); if (on) C.toast('Click any element to read its story'); }
  $('#infoBtn').addEventListener('click', () => setInfoMode(!infoMode));
  if (!C.store.get('ic:tptip', false)) { C.store.set('ic:tptip', true); setTimeout(() => C.toast('Tip: on a touchpad, turn on Touchpad mode in the top bar. Click to pick up, click again to drop.', 5000), 1500); }

  function info(name) {
    const d = document.createElement('div');
    d.className = 'ic-info';
    const mk = MAKERS[name] || [];
    const uses = USES[name] || [];
    const usedFound = uses.filter((k) => foundSet.has(RECIPES.get(k))).length;
    const how = meta.how[name];
    const rc = mk.slice(0, 8).map(([a, b]) => {
      const ka = foundSet.has(a), kb = foundSet.has(b);
      return `<span class="${ka && kb ? '' : 'unk'}">${ka ? `${EMOJI[a]} ${a}` : '❔'} + ${kb ? `${EMOJI[b]} ${b}` : '❔'}</span>`;
    }).join('');
    d.innerHTML = `<div class="ic-info-big"></div><div class="ic-info-tier">${baseNames.includes(name) ? 'Base element' : `Tier ${TIER[name]} of ${MAXTIER}`}</div>
      ${how ? '<h4>You first made it from</h4><div class="rc"><span class="how"></span></div>' : ''}
      ${mk.length ? `<h4>Recipes (${mk.length})</h4><div class="rc">${rc}</div>` : ''}
      <h4>Used in</h4><div>${uses.length} recipes, ${usedFound} discovered so far</div>`;
    d.querySelector('.ic-info-big').textContent = EMOJI[name];
    if (how) d.querySelector('.how').textContent = `${EMOJI[how[0]]} ${how[0]} + ${EMOJI[how[1]]} ${how[1]}`;
    C.modal({ emoji: '', title: name, body: d, buttons: [{ label: 'Place on board', value: 'place' }, { label: 'Close', value: 0 }] }).then((v) => {
      if (v === 'place') { const [x, y] = freeSpot(); spawn(name, x, y); }
    });
  }

  let drag = null;
  function startDrag(e, el, fromList) {
    if (e.button > 0) return;
    e.preventDefault();
    const r = board.getBoundingClientRect();
    drag = { el, id: e.pointerId, ox: e.clientX - r.left - el._x, oy: e.clientY - r.top - el._y, sx: e.clientX, sy: e.clientY, moved: fromList, fromList };
    el.classList.add('drag');
    el.style.zIndex = ++zTop;
  }
  window.addEventListener('pointermove', (e) => {
    if (press && e.pointerId === press.id && Math.hypot(e.clientX - press.sx, e.clientY - press.sy) > 8) { clearTimeout(press.t); press = null; }
    if (pending && e.pointerId === pending.id && !drag) {
      if (Math.hypot(e.clientX - pending.sx, e.clientY - pending.sy) > 6) {
        const r = board.getBoundingClientRect();
        const el = spawn(pending.name, e.clientX - r.left, e.clientY - r.top, false);
        drag = { el, id: e.pointerId, ox: el.offsetWidth / 2, oy: el.offsetHeight / 2, moved: true, fromList: true };
        el.classList.add('drag');
        pending.used = true; pending = null;
      }
    }
    if (!drag || !drag.fromList || e.pointerId !== drag.id) return;
    dragMove(e.clientX, e.clientY, e.movementX);
  });
  function dragMove(cx, cy, mx) {
    if (!drag) return;
    const r = board.getBoundingClientRect();
    if (Math.hypot(cx - (drag.sx ?? cx), cy - (drag.sy ?? cy)) > 5) drag.moved = true;
    drag.el.style.transform = `translate(${cx - r.left - drag.ox}px, ${cy - r.top - drag.oy}px) rotate(${Math.max(-6, Math.min(6, (mx || 0) * 0.8))}deg)`;
    drag.el._x = cx - r.left - drag.ox; drag.el._y = cy - r.top - drag.oy;
    const t = overlapTarget(drag.el);
    insts.forEach((o) => o.classList.toggle('hover', o === t));
  }
  function endDrag(e) {
    if (pending && e.pointerId === pending.id) pending = null;
    if (press && e.pointerId === press.id) { clearTimeout(press.t); press = null; }
    if (!drag || !drag.fromList || e.pointerId !== drag.id) return;
    dragEnd(e.clientX, e.clientY);
  }
  function dragEnd(cx, cy) {
    if (!drag) return;
    const e = { clientX: cx ?? -1e6, clientY: cy ?? -1e6 };
    if (cx == null) { const r0 = board.getBoundingClientRect(); e.clientX = r0.left + drag.el._x + 10; e.clientY = r0.top + drag.el._y + 10; }
    const { el, moved } = drag; drag = null;
    el.classList.remove('drag');
    insts.forEach((o) => o.classList.remove('hover'));
    const br = board.getBoundingClientRect();
    const outside = e.clientX > br.right || e.clientY > br.bottom || e.clientX < br.left || e.clientY < br.top;
    if (outside) { removeInst(el); C.beep(300, .05, 'sine', .05); return; }
    if (!moved) { place(el, el._x, el._y); if (infoMode) { setInfoMode(false); info(el.dataset.name); return; } toggleSelect(el); return; }
    place(el, el._x, el._y);
    const t = overlapTarget(el);
    if (t) combine(el, t);
  }
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  let pending = null, press = null, suppressClick = false;
  list.addEventListener('pointerdown', (e) => {
    const chip = e.target.closest('.ic-chip');
    if (!chip) return;
    if (e.pointerType !== 'mouse') {
      press = { id: e.pointerId, sx: e.clientX, sy: e.clientY, t: setTimeout(() => { press = null; suppressClick = true; info(chip.dataset.name); }, 520) };
      return;
    }
    if (e.button !== 0) return;
    e.preventDefault();
    pending = { name: chip.dataset.name, id: e.pointerId, sx: e.clientX, sy: e.clientY };
  });
  list.addEventListener('contextmenu', (e) => {
    const chip = e.target.closest('.ic-chip');
    if (!chip) return;
    e.preventDefault();
    pending = null;
    info(chip.dataset.name);
  });
  list.addEventListener('click', (e) => {
    const chip = e.target.closest('.ic-chip');
    if (!chip) return;
    if (suppressClick) { suppressClick = false; return; }
    const name = chip.dataset.name;
    if (infoMode) { setInfoMode(false); info(name); return; }
    if (selected) {
      const s = selected; s.classList.remove('sel'); selected = null;
      const el = spawn(name, s._x + s.offsetWidth / 2 + 30, s._y + s.offsetHeight / 2 + 26);
      setTimeout(() => { if (insts.has(el) && insts.has(s)) combine(el, s); }, 220);
      return;
    }
    const [x, y] = freeSpot();
    spawn(name, x, y);
    C.beep(600, .04, 'sine', .06);
  });

  search.addEventListener('input', () => renderList());
  $('#sort').addEventListener('change', () => { C.store.set('ic:sort', $('#sort').value); renderList(); });
  $('#sort').value = ['time', 'new', 'az', 'tier'].includes(C.store.get('ic:sort', 'time')) ? C.store.get('ic:sort', 'time') : 'time';
  $('#clear').addEventListener('click', () => { insts.forEach(removeInst); hint.style.opacity = 1; });
  $('#tidy').addEventListener('click', () => {
    const els = [...insts];
    if (!els.length) return;
    const bw = board.clientWidth;
    let x = 16, y = 96, rowH = 0;
    els.sort((a, b) => a.dataset.name.localeCompare(b.dataset.name)).forEach((el, i) => {
      const w = el.offsetWidth, h = el.offsetHeight;
      if (x + w > bw - 16) { x = 16; y += rowH + 10; rowH = 0; }
      el.style.transition = 'transform .35s cubic-bezier(.2,.9,.3,1.2)';
      place(el, x, y);
      setTimeout(() => { el.style.transition = ''; }, 400);
      x += w + 10; rowH = Math.max(rowH, h);
    });
    C.beep(660, .05, 'triangle', .06);
  });
  $('#reset').addEventListener('click', async () => {
    const v = await C.modal({ emoji: '💥', title: 'Forget everything?', body: `You will lose all ${found.length} discoveries, your badges and your streak, and go back to the four classics.`, buttons: [{ label: 'Keep my stuff', value: 0 }, { label: 'Reset', value: 1 }] });
    if (!v) return;
    found = baseNames.slice(); foundSet.clear(); found.forEach((n) => foundSet.add(n));
    meta = freshMeta(); hintState = null;
    save();
    insts.forEach(removeInst); renderList(); hint.style.opacity = 1;
    if (tab === 'goal') renderGoals();
  });
  window.addEventListener('keydown', (e) => {
    if (document.querySelector('.curio-modal')) return;
    const typing = e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT');
    if (e.key === '/' && !typing) { e.preventDefault(); setTab('el'); search.focus(); }
    else if (e.key === 'Escape') { if (typing) { search.value = ''; renderList(); search.blur(); } if (selected) { selected.classList.remove('sel'); selected = null; } }
    else if (!typing && (e.key === 'h' || e.key === 'H')) showHint();
    else if (!typing && (e.key === 'g' || e.key === 'G')) setTab(tab === 'goal' ? 'el' : 'goal');
    else if (!typing && (e.key === 'i' || e.key === 'I') && !(e.target && e.target.classList?.contains('ic-el'))) setInfoMode(!infoMode);
    else if (!typing && (e.key === 'c' || e.key === 'C')) $('#clear').click();
  });
  window.addEventListener('resize', () => insts.forEach((el) => place(el, el._x, el._y)));

  checkBadges();
  save();
  renderList();
  const bw = board.clientWidth, bh = board.clientHeight;
  if (found.length <= 4) {
    baseNames.forEach((n, i) => spawn(n, bw * (.2 + .2 * i), bh * (i % 2 ? .62 : .5)));
    hint.style.opacity = 0;
  }
  window.__ic = { TOTAL, recipes: RECIPES.size, tier: TIER, DAILY, combine: (a, b) => { const [x, y] = freeSpot(); const ea = spawn(a, x, y), eb = spawn(b, x + 5, y); return combine(ea, eb); }, found: () => found.length };
})();
