(() => {
  const $ = (id) => document.getElementById(id);
  const CAP = 4;
  const COLORS = ['#e53935', '#fb8c00', '#fdd835', '#7cb342', '#1b8a4a', '#26c6da', '#1e88e5', '#3f3fb5', '#8e24aa', '#f06292', '#8d5a3b', '#9aa3ab'];
  const NAMES = ['red', 'orange', 'yellow', 'lime', 'green', 'cyan', 'blue', 'indigo', 'purple', 'pink', 'brown', 'grey'];
  const SYMS = ['●', '▲', '■', '◆', '★', '✚', '♥', '☾', '✿', '♠', '⬢', '✕'];
  const ACH = [
    ['first', '🧪', 'Lab assistant', 'Sort your first level'],
    ['perfect', '⭐', 'Steady hands', 'Get three stars on a level'],
    ['l10', '🔟', 'Chemist', 'Reach level 10'],
    ['l25', '🥽', 'Professor', 'Reach level 25'],
    ['l50', '🏛️', 'Nobel material', 'Reach level 50'],
    ['hidden', '❓', 'In the dark', 'Clear a Hidden level'],
    ['hidden10', '🕵️', 'Detective', 'Clear 10 Hidden levels'],
    ['daily', '📅', 'Daily dose', 'Clear the daily puzzle'],
    ['twelve', '🌈', 'Full spectrum', 'Clear a level with all 12 colours'],
    ['nohint', '🧠', 'Self-taught', 'Clear level 20 or later without hints']
  ];

  const rng = (seed) => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const colorsFor = (level) => Math.min(12, 3 + Math.floor((level - 1) / 3));
  const top = (a) => a[a.length - 1];
  const canPour = (t, i, j) => i !== j && t[i].length > 0 && t[j].length < CAP && (!t[j].length || top(t[j]) === top(t[i]));
  function pour(t, i, j) { const a = t[i], b = t[j], c = top(a); let n = 0; while (a.length && top(a) === c && b.length < CAP) { b.push(a.pop()); n++; } return n; }
  const full = (x) => x.length === CAP && x.every((c) => c === x[0]);
  const isSolved = (t) => t.every((x) => !x.length || full(x));

  function solve(start, limit = 150000) {
    const seen = new Set(); let nodes = 0; const path = [];
    const key = (t) => t.map((x) => x.join(',')).sort().join('|');
    function dfs(t) {
      if (isSolved(t)) return true;
      if (++nodes > limit) return null;
      const k = key(t); if (seen.has(k)) return false; seen.add(k);
      const moves = [];
      for (let i = 0; i < t.length; i++) for (let j = 0; j < t.length; j++) {
        if (!canPour(t, i, j)) continue;
        const a = t[i];
        if (!t[j].length && a.every((c) => c === a[0])) continue;
        let run = 0; while (run < a.length && a[a.length - 1 - run] === top(a)) run++;
        moves.push([(t[j].length ? 2 : 0) + (run <= CAP - t[j].length ? 1 : 0), i, j]);
      }
      moves.sort((x, y) => y[0] - x[0]);
      for (const [, i, j] of moves) {
        const n = t.map((x) => x.slice()); pour(n, i, j); path.push([i, j]);
        const r = dfs(n); if (r) return true; if (r === null) return null; path.pop();
      }
      return false;
    }
    const r = dfs(start.map((x) => x.slice()));
    return r ? path.slice() : r;
  }

  function makeLevel(level, salt = 0, nColors) {
    const n = nColors || colorsFor(level);
    for (let attempt = 0; attempt < 60; attempt++) {
      const r = rng(level * 7919 + attempt * 104729 + 13 + salt);
      const balls = []; for (let c = 0; c < n; c++) for (let k = 0; k < CAP; k++) balls.push(c);
      for (let i = balls.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [balls[i], balls[j]] = [balls[j], balls[i]]; }
      const pal = Array.from({ length: 12 }, (_, i) => i);
      for (let i = 11; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pal[i], pal[j]] = [pal[j], pal[i]]; }
      const tubes = []; for (let c = 0; c < n; c++) tubes.push(balls.slice(c * CAP, c * CAP + CAP).map((b) => pal[b]));
      if (tubes.some(full)) continue;
      tubes.push([], []);
      if (solve(tubes)) return tubes;
    }
    return null;
  }

  const SAVE_V = 2;
  const load = () => {
    const base = { v: SAVE_V, mode: 'classic', skin: 'liquid', sym: false, level: { classic: Math.max(1, Curio.store.get('ws:level', 1) | 0), hidden: 1 }, max: { classic: Math.max(1, Curio.store.get('ws:max', 1) | 0), hidden: 1 }, stars: { classic: {}, hidden: {} }, ach: {}, pours: 0, solved: 0, daily: {} };
    const raw = Curio.store.get('ws:v2', null);
    if (!raw || raw.v !== SAVE_V) return base;
    return { ...base, ...raw, level: { ...base.level, ...(raw.level || {}) }, max: { ...base.max, ...(raw.max || {}) }, stars: { classic: {}, hidden: {}, ...(raw.stars || {}) }, ach: raw.ach || {}, daily: raw.daily || {} };
  };
  const save = load();
  if (!['classic', 'hidden', 'daily'].includes(save.mode)) save.mode = 'classic';
  const persist = () => Curio.store.set('ws:v2', save);
  const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  const todaySeed = () => { let h = 2166136261; for (const ch of todayKey()) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) % 100000; };
  const track = () => (save.mode === 'hidden' ? 'hidden' : 'classic');

  let level, tubes, hid, history, moves, sel, busy, extraUsed, undoUsed, hintUsed, won, els = [], doneSet, baseCount;
  const rack = $('rack');

  function loadLevel(L) {
    if (save.mode === 'daily') { level = 0; tubes = makeLevel(todaySeed() + 1, 777, 8); }
    else { level = L; save.level[track()] = level; tubes = makeLevel(level, save.mode === 'hidden' ? 50021 : 0); }
    persist();
    baseCount = tubes.length;
    hid = tubes.map((t) => t.map((_, k) => save.mode === 'hidden' && k < t.length - 1));
    history = []; moves = 0; sel = -1; busy = false; extraUsed = false; undoUsed = false; hintUsed = false; won = false; doneSet = new Set();
    build(); hud(); paintLevels();
  }

  function build() {
    rack.innerHTML = ''; els = [];
    tubes.forEach((t, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'tube'; b.dataset.i = i;
      b.style.setProperty('--cap', CAP);
      if (i >= baseCount) b.classList.add('extra');
      const g = document.createElement('div'); g.className = 'glass';
      for (let k = 0; k < CAP; k++) { const s = document.createElement('div'); s.className = 'seg e'; s.style.setProperty('--bd', `${(i * 0.37 + k * 0.61) % 2.6}s`); s.innerHTML = '<span class="sym"></span>'; g.append(s); }
      b.append(g); rack.append(b); els.push(b);
    });
    layout(); paint(true);
  }

  function layout() {
    const tw = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tw')) || 46;
    const gap = innerWidth <= 480 ? 13 : 22;
    const avail = Math.min(rack.parentElement.clientWidth - 16, 900);
    const perMax = Math.max(3, Math.floor((avail + gap) / (tw + gap)));
    const rows = Math.ceil(tubes.length / perMax);
    rack.style.setProperty('--per', Math.ceil(tubes.length / rows));
  }

  function reveal() {
    tubes.forEach((t, i) => { if (t.length && hid[i][t.length - 1]) { hid[i][t.length - 1] = false; Curio.beep(1046, 0.05, 'sine', 0.05); } });
  }

  function paint(instant) {
    document.body.dataset.skin = save.skin;
    document.body.classList.toggle('symbols', save.sym);
    tubes.forEach((t, i) => {
      const segs = els[i].querySelectorAll('.seg');
      segs.forEach((s, k) => {
        if (instant) s.style.transition = 'none';
        const h = k < t.length && hid[i][k];
        if (k < t.length) { s.style.setProperty('--c', COLORS[t[k]]); s.classList.remove('e'); }
        else s.classList.add('e');
        s.classList.toggle('hid', h);
        s.classList.toggle('top', k === t.length - 1);
        s.classList.toggle('bubbly', k < t.length && !h && (k + i) % 3 === 0);
        s.querySelector('.sym').textContent = h ? '?' : k < t.length ? SYMS[t[k]] : '';
        if (instant) { void s.offsetWidth; s.style.transition = ''; }
      });
      const isFull = full(t);
      els[i].classList.toggle('done', isFull);
      if (isFull && !doneSet.has(i) && !instant) { Curio.beep(880, 0.08, 'sine', 0.09); setTimeout(() => Curio.beep(1320, 0.1, 'sine', 0.07), 90); sparkle(els[i], COLORS[t[0]]); }
      if (isFull) doneSet.add(i); else doneSet.delete(i);
      els[i].classList.toggle('sel', i === sel);
      const desc = t.length ? t.map((c, k) => (hid[i][k] ? 'hidden' : NAMES[c])).join(', ') : 'empty';
      els[i].setAttribute('aria-label', `Tube ${i + 1}: ${desc}${isFull ? ', complete' : ''}${i === sel ? ', selected' : ''}`);
    });
  }

  function sparkle(el, color) {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const r = el.getBoundingClientRect();
    for (let k = 0; k < 12; k++) {
      const d = document.createElement('i'); d.className = 'splash';
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, dist = 30 + Math.random() * 40;
      d.style.left = `${r.left + r.width / 2}px`; d.style.top = `${r.top}px`;
      d.style.background = k % 3 ? color : '#fff';
      d.style.setProperty('--dx', `${Math.cos(a) * dist}px`); d.style.setProperty('--dy', `${Math.sin(a) * dist}px`);
      document.body.append(d); setTimeout(() => d.remove(), 550);
    }
    try { navigator.vibrate?.(15); } catch {}
  }

  const starsNow = () => (extraUsed ? 1 : undoUsed ? 2 : 3);
  function hud() {
    $('level').textContent = save.mode === 'daily' ? '📅' : level;
    $('moves').textContent = moves;
    const b = save.mode === 'daily' ? save.daily[todayKey()] : Curio.getBest(`${save.mode === 'hidden' ? 'h-' : ''}level-${level}`);
    $('best').textContent = b == null ? '-' : b;
    const s = starsNow();
    $('stars').textContent = '★'.repeat(s) + '☆'.repeat(3 - s);
    $('prev').disabled = save.mode === 'daily' || level <= 1;
    $('next').disabled = save.mode === 'daily' || level >= save.max[track()];
    $('undo').disabled = !history.length;
    $('add').disabled = extraUsed || won;
    $('modes').querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.mode === save.mode)));
    $('skins').querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.skin === save.skin)));
    $('sym').checked = save.sym;
  }

  function paintLevels() {
    const box = $('levels'); box.replaceChildren();
    const tk = track(), mx = save.max[tk];
    const shown = Math.max(30, Math.ceil((mx + 6) / 10) * 10);
    for (let L = 1; L <= shown; L++) {
      const b = document.createElement('button'); b.type = 'button';
      const st = save.stars[tk][L] || 0;
      b.innerHTML = `${L}<small>${'★'.repeat(st)}</small>`;
      b.disabled = L > mx;
      if (L === level && save.mode !== 'daily') b.classList.add('cur');
      b.setAttribute('aria-label', `Level ${L}${st ? `, ${st} stars` : ''}${b.disabled ? ', locked' : ''}`);
      b.addEventListener('click', () => { if (busy) return; if (save.mode === 'daily') save.mode = 'classic'; loadLevel(L); window.scrollTo({ top: 0, behavior: 'smooth' }); });
      box.append(b);
    }
    $('lv-count').textContent = `${save.mode === 'hidden' ? 'Hidden' : 'Classic'}: up to ${mx}`;
    $('statgrid').innerHTML = [[save.max.classic, 'Classic level'], [save.max.hidden, 'Hidden level'], [save.solved, 'Sorted'], [Curio.fmt(save.pours), 'Pours'], [Object.values(save.stars.classic).concat(Object.values(save.stars.hidden)).reduce((a, b) => a + b, 0), 'Stars'], [Object.keys(save.daily).length, 'Dailies']]
      .map(([v, l]) => `<div class="c-stat"><b>${v}</b><span>${l}</span></div>`).join('');
    $('achs').innerHTML = ACH.map(([id, e, n, d]) => `<div class="ach${save.ach[id] ? ' on' : ''}" title="${d}"><span>${e}</span><div><b>${n}</b>${d}</div></div>`).join('');
    $('ach-count').textContent = `${Object.keys(save.ach).length}/${ACH.length}`;
  }
  function unlock(id) {
    if (save.ach[id]) return;
    save.ach[id] = Date.now(); persist();
    const a = ACH.find((x) => x[0] === id);
    if (a) setTimeout(() => Curio.toast(`${a[1]} Badge unlocked: ${a[2]}`, 2400), 900);
  }

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  async function doPour(i, j) {
    busy = true;
    const src = els[i], dst = els[j];
    const sr = src.getBoundingClientRect(), dr = dst.getBoundingClientRect();
    const dir = dr.left > sr.left ? 1 : -1;
    const tw = sr.width;
    const dx = (dr.left + dr.width / 2) - (sr.left + sr.width / 2) - dir * tw * 0.42;
    const dy = (dr.top - 26) - sr.top;
    const color = COLORS[top(tubes[i])];
    src.classList.remove('sel');
    src.classList.add('pour');
    src.style.transform = `translate(${dx}px, ${dy}px) rotate(${dir * 72}deg)`;
    await wait(260);
    const stream = document.createElement('div');
    stream.className = 'stream';
    stream.style.background = save.skin === 'balls' ? 'transparent' : color;
    const liquidTop = dr.bottom - 5 - tubes[j].length * (dr.height - 14) / CAP;
    stream.style.left = `${dr.left + dr.width / 2 - 3.5}px`;
    stream.style.top = `${dr.top - 26}px`;
    stream.style.height = `${Math.max(10, liquidTop - dr.top + 26)}px`;
    document.body.append(stream);
    requestAnimationFrame(() => stream.classList.add('on'));
    history.push({ t: tubes.map((t) => t.slice()), h: hid.map((x) => x.slice()) });
    const n = pour(tubes, i, j);
    for (let k = 0; k < n; k++) hid[j][tubes[j].length - n + k] = false;
    hid[i].length = tubes[i].length; hid[j].length = tubes[j].length;
    reveal();
    moves++; save.pours++;
    for (let k = 0; k < n; k++) setTimeout(() => Curio.beep(save.skin === 'balls' ? 500 + k * 90 : 300 + k * 70 + Math.random() * 30, 0.07, save.skin === 'balls' ? 'triangle' : 'sine', 0.06), k * 70);
    await wait(60);
    paint(); hud();
    await wait(320);
    stream.style.transformOrigin = '50% 100%';
    stream.classList.remove('on');
    src.style.transform = '';
    await wait(240);
    stream.remove();
    src.classList.remove('pour');
    busy = false;
    if (isSolved(tubes)) return win();
    if (!anyMove()) Curio.toast('No pours left. Undo, or add a spare tube.', 2600);
  }

  function anyMove() {
    for (let i = 0; i < tubes.length; i++) for (let j = 0; j < tubes.length; j++) {
      if (!canPour(tubes, i, j)) continue;
      if (!tubes[j].length && tubes[i].every((c) => c === tubes[i][0])) continue;
      return true;
    }
    return false;
  }

  async function win() {
    won = true;
    const s = starsNow();
    save.solved++;
    let title, body;
    const quips = ['Satisfying, right?', 'Chemistry teachers everywhere are proud.', 'Not a single drop spilled.', 'The colours thank you.', 'Pure. Sorted. Liquid.'];
    unlock('first');
    if (s === 3) unlock('perfect');
    if (tubes.filter((t) => t.length).length >= 12) unlock('twelve');
    if (save.mode === 'daily') {
      const prev = save.daily[todayKey()];
      if (!prev || moves < prev) save.daily[todayKey()] = moves;
      unlock('daily');
      title = 'Daily puzzle sorted!';
      body = `${moves} pours. ${'★'.repeat(s)}${'☆'.repeat(3 - s)} Come back tomorrow for a fresh one.`;
    } else {
      const tk = track();
      const b = Curio.best(`${tk === 'hidden' ? 'h-' : ''}level-${level}`, moves, false);
      save.max[tk] = Math.max(save.max[tk], level + 1);
      save.stars[tk][level] = Math.max(save.stars[tk][level] || 0, s);
      if (tk === 'classic') { if (level + 1 >= 10) unlock('l10'); if (level + 1 >= 25) unlock('l25'); if (level + 1 >= 50) unlock('l50'); }
      if (tk === 'hidden') { unlock('hidden'); if (Object.keys(save.stars.hidden).length >= 10) unlock('hidden10'); }
      if (level >= 20 && !hintUsed) unlock('nohint');
      title = `Level ${level} sorted!`;
      body = `${moves} pours${extraUsed ? ' with the spare tube' : ''}. ${'★'.repeat(s)}${'☆'.repeat(3 - s)} ${b.isNew ? 'New best for this level!' : `Best: ${b.best}.`} ${Curio.pick(quips)}`;
    }
    persist();
    hud(); paintLevels();
    Curio.confetti();
    [523, 659, 784, 1047].forEach((f, k) => setTimeout(() => Curio.beep(f, 0.14, 'triangle', 0.1), k * 110));
    els.forEach((e, k) => setTimeout(() => { e.classList.remove('done'); void e.offsetWidth; if (tubes[k].length) e.classList.add('done'); }, k * 60));
    await wait(600);
    const v = await Curio.modal({ emoji: '🧪', title, body, buttons: save.mode === 'daily' ? [{ label: 'Classic levels', value: 'classic' }, { label: 'Share', value: 'share' }] : [{ label: 'Next level', value: 'next' }, { label: 'Replay', value: 'again' }, { label: 'Share', value: 'share' }] });
    if (v === 'share') {
      try { await navigator.clipboard.writeText(`🧪 Zoble Water Sort ${save.mode === 'daily' ? `daily ${todayKey()}` : `${save.mode} level ${level}`}: sorted in ${moves} pours ${'★'.repeat(s)}`); Curio.toast('Copied!'); } catch { Curio.toast('Could not reach the clipboard.'); }
      return;
    }
    if (v === 'classic') { save.mode = 'classic'; loadLevel(save.level.classic); return; }
    loadLevel(v === 'next' ? level + 1 : level);
  }

  function clearHint() { els.forEach((e) => e.classList.remove('hint')); }

  function tap(i) {
    if (busy || won || !els[i]) return;
    clearHint();
    if (sel === -1) {
      if (!tubes[i].length || full(tubes[i])) { els[i].classList.remove('bad'); void els[i].offsetWidth; els[i].classList.add('bad'); Curio.beep(150, 0.06, 'square', 0.03); return; }
      sel = i; Curio.beep(600, 0.04, 'triangle', 0.06); paint(); return;
    }
    if (sel === i) { sel = -1; paint(); return; }
    if (canPour(tubes, sel, i)) { const s = sel; sel = -1; doPour(s, i); return; }
    if (tubes[i].length && !full(tubes[i])) { sel = i; Curio.beep(600, 0.04, 'triangle', 0.06); paint(); return; }
    els[i].classList.remove('bad'); void els[i].offsetWidth; els[i].classList.add('bad');
    Curio.beep(150, 0.06, 'square', 0.03);
  }

  function undo() {
    if (busy || !history.length || won) return;
    const h = history.pop(); tubes = h.t; hid = h.h; moves++; sel = -1; undoUsed = true; clearHint();
    if (tubes.length < els.length) build(); else paint();
    hud(); Curio.beep(330, 0.06, 'sine', 0.08);
  }
  function hint() {
    if (busy || won) return;
    clearHint();
    const sol = solve(tubes, 120000);
    hintUsed = true;
    if (sol && sol.length) {
      const [i, j] = sol[0];
      sel = -1; paint();
      els[i].classList.add('hint'); els[j].classList.add('hint');
      Curio.toast(`Try pouring tube ${i + 1} into tube ${j + 1}.`);
    } else if (sol === null) Curio.toast('Even the solver is scratching its head. Try a pour or two.');
    else Curio.toast(extraUsed ? 'This one is a dead end. Undo a few pours.' : 'Dead end from here. Undo, or add a spare tube.', 2600);
  }

  rack.addEventListener('click', (e) => { const b = e.target.closest('.tube'); if (b) tap(+b.dataset.i); });
  $('undo').addEventListener('click', undo);
  $('add').addEventListener('click', () => {
    if (busy || extraUsed || won) return;
    extraUsed = true; tubes.push([]); hid.push([]);
    history = history.map((h) => ({ t: h.t.concat([[]]), h: h.h.concat([[]]) }));
    sel = -1; build(); hud();
    Curio.toast('A fresh empty tube appears. Use it well.');
  });
  $('hint').addEventListener('click', hint);
  $('restart').addEventListener('click', () => { if (!busy) loadLevel(level); });
  $('prev').addEventListener('click', () => { if (!busy && level > 1) loadLevel(level - 1); });
  $('next').addEventListener('click', () => { if (!busy && level < save.max[track()]) loadLevel(level + 1); });
  $('modes').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b || busy) return;
    save.mode = b.dataset.mode; persist();
    loadLevel(save.mode === 'daily' ? 0 : save.level[track()]);
    if (save.mode === 'hidden') Curio.toast('Only the top colour of each tube shows. Pour to reveal what is underneath!', 2800);
    if (save.mode === 'daily') Curio.toast('Today\'s puzzle: eight colours, same for everyone.', 2400);
  });
  $('skins').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; save.skin = b.dataset.skin; persist(); paint(); hud(); Curio.beep(700, 0.04, 'sine', 0.06); });
  $('sym').addEventListener('change', (e) => { save.sym = e.target.checked; persist(); paint(); });
  addEventListener('keydown', (e) => {
    if (document.querySelector('.curio-modal') || e.target.closest?.('input')) return;
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === 'escape') { sel = -1; paint(); }
    else if (k === 'u') undo();
    else if (k === 'h') hint();
    else if (k === 'r') $('restart').click();
    else if (/^[1-9]$/.test(k)) tap(+k - 1);
    else if (k === '0') tap(9);
  });
  addEventListener('resize', () => layout());

  loadLevel(save.mode === 'daily' ? 0 : save.level[track()]);
  window.__ws = { get tubes() { return tubes; }, tap, solve, makeLevel, isSolved, load: loadLevel, get busy() { return busy; }, get won() { return won; }, setMode(m) { save.mode = m; persist(); loadLevel(m === 'daily' ? 0 : save.level[track()]); }, setSkin(s) { save.skin = s; paint(); } };
  if (!Curio.touchpad && !Curio.store.get('padtip:water-sort', false)) { Curio.store.set('padtip:water-sort', true); setTimeout(() => Curio.toast('Tip: on a laptop touchpad? Turn on Touchpad mode in the top bar.', 3400), 2200); }
})();
