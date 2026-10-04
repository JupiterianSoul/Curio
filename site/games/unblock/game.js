(() => {
  const $ = (id) => document.getElementById(id);
  const LEVELS = window.UB_LEVELS;
  const TIERS = window.UB_TIERS;
  const tierOf = (i) => TIERS.filter((t) => i >= t[0]).pop();
  const PAL = ['#ffb020', '#2fb36d', '#1e88e5', '#8e24aa', '#18a6a6', '#f06292', '#7cb342', '#5c6bc0', '#ff7a45', '#8d6e63', '#26c6da', '#c0ca33', '#ab47bc'];
  const TRUCKS = ['#4a6fa5', '#7e57c2', '#00897b', '#6d4c41', '#c2185b'];
  const ACH = [
    ['first', '🚗', 'Learner', 'Clear your first level'],
    ['opt', '🎯', 'Optimal', 'Clear a level in the optimal number of moves'],
    ['opt10', '🧠', 'Efficient', 'Clear 10 levels optimally'],
    ['t1', '🟢', 'Beginner done', 'Clear every Beginner level'],
    ['t2', '🔵', 'Commuter', 'Clear every Intermediate level'],
    ['t3', '🟠', 'Rush hour', 'Clear every Advanced level'],
    ['t4', '🔴', 'Gridlock guru', 'Clear every Expert level'],
    ['t5', '🟣', 'Night owl', 'Clear every Night shift level'],
    ['t6', '⚫', 'Grandmaster', 'Clear every Grandmaster level'],
    ['fast', '⚡', 'Getaway', 'Clear an Advanced or harder level in under a minute'],
    ['hard', '🏔️', 'Long haul', 'Clear a level that needs 30 or more moves'],
    ['daily', '📅', 'Daily driver', 'Clear the daily jam'],
    ['nohint', '🙈', 'No GPS', 'Clear an Expert level without hints']
  ];

  function parse(str) {
    const V = [], seen = {};
    for (let i = 0; i < 36; i++) {
      const ch = str[i]; if (ch === 'o' || seen[ch]) continue; seen[ch] = 1;
      const r = Math.floor(i / 6), c = i % 6, h = c < 5 && str[i + 1] === ch;
      let len = 0;
      if (h) while (c + len < 6 && str[i + len] === ch) len++; else while (r + len < 6 && str[i + len * 6] === ch) len++;
      V.push({ ch, h, len, fixed: h ? r : c, p: h ? c : r });
    }
    const ai = V.findIndex((v) => v.ch === 'A');
    V.unshift(V.splice(ai, 1)[0]);
    return V;
  }
  function occupancy(V, pos, skip = -1) {
    const occ = new Array(36).fill(-1);
    V.forEach((v, i) => { if (i === skip) return; for (let k = 0; k < v.len; k++) occ[v.h ? v.fixed * 6 + pos[i] + k : (pos[i] + k) * 6 + v.fixed] = i; });
    return occ;
  }
  function range(V, pos, i) {
    const occ = occupancy(V, pos, i), v = V[i];
    const at = (p) => (v.h ? v.fixed * 6 + p : p * 6 + v.fixed);
    let lo = pos[i], hi = pos[i];
    while (lo - 1 >= 0 && occ[at(lo - 1)] === -1) lo--;
    while (hi + v.len < 6 && occ[at(hi + v.len)] === -1) hi++;
    return [lo, hi];
  }
  function nextMove(V, pos) {
    const key = (s) => s.join(',');
    const prev = new Map([[key(pos), null]]); let q = [pos];
    while (q.length) {
      const nq = [];
      for (const s of q) {
        if (s[0] === 4) {
          let cur = s, k = key(s), step = null;
          while (prev.get(k)) { step = prev.get(k); cur = step.from; k = key(cur); }
          return step;
        }
        for (let i = 0; i < V.length; i++) {
          const [lo, hi] = range(V, s, i);
          for (let p = lo; p <= hi; p++) {
            if (p === s[i]) continue;
            const n = s.slice(); n[i] = p; const k = key(n);
            if (!prev.has(k)) { prev.set(k, { from: s, i, p }); nq.push(n); }
          }
        }
      }
      q = nq;
    }
    return null;
  }

  function carSvg(len, h, color, hero) {
    const L = len * 100;
    const shade = `color-mix(in srgb, ${color} 70%, #000)`;
    const light = `color-mix(in srgb, ${color} 60%, #fff)`;
    let body;
    if (len === 3) {
      body = `<rect x="4" y="12" width="${L - 96}" height="76" rx="10" fill="${light}" stroke="${shade}" stroke-width="4"/>
        ${Array.from({ length: 5 }, (_, k) => `<path d="M${18 + k * ((L - 130) / 4)} 18v64" stroke="${shade}" stroke-opacity=".35" stroke-width="4"/>`).join('')}
        <rect x="${L - 88}" y="10" width="84" height="80" rx="18" fill="${color}" stroke="${shade}" stroke-width="4"/>
        <path d="M${L - 40} 18q16 32 0 64" stroke="#2a3a4d" stroke-width="13" fill="none" stroke-linecap="round"/>
        <rect x="${L - 78}" y="26" width="24" height="48" rx="6" fill="${light}" opacity=".7"/>
        <rect x="${L - 12}" y="18" width="8" height="14" rx="3" fill="#fff6b0"/><rect x="${L - 12}" y="68" width="8" height="14" rx="3" fill="#fff6b0"/>
        <rect x="8" y="16" width="6" height="12" rx="2" fill="#ff5a4f"/><rect x="8" y="72" width="6" height="12" rx="2" fill="#ff5a4f"/>`;
    } else {
      body = `<rect x="4" y="10" width="${L - 8}" height="80" rx="26" fill="${color}" stroke="${shade}" stroke-width="4"/>
        <rect x="${L * 0.3}" y="22" width="${L * 0.36}" height="56" rx="14" fill="${light}" opacity=".55"/>
        <path d="M${L * 0.7} 20q14 30 0 60" stroke="#2a3a4d" stroke-width="12" fill="none" stroke-linecap="round"/>
        <path d="M${L * 0.26} 24q-10 26 0 52" stroke="#2a3a4d" stroke-width="9" fill="none" stroke-linecap="round" opacity=".85"/>
        <rect x="${L - 14}" y="18" width="8" height="14" rx="3" fill="#fff6b0"/><rect x="${L - 14}" y="68" width="8" height="14" rx="3" fill="#fff6b0"/>
        <rect x="7" y="18" width="6" height="12" rx="2" fill="#ff5a4f"/><rect x="7" y="70" width="6" height="12" rx="2" fill="#ff5a4f"/>
        <rect x="${L * 0.62}" y="4" width="10" height="8" rx="3" fill="${shade}"/><rect x="${L * 0.62}" y="88" width="10" height="8" rx="3" fill="${shade}"/>
        ${hero ? `<path d="M10 44H${L - 10}M10 56H${L - 10}" stroke="#fff" stroke-width="5" opacity=".85"/>` : ''}`;
    }
    const inner = h ? body : `<g transform="translate(100 0) rotate(90)">${body}</g>`;
    return `<svg viewBox="0 0 ${h ? L : 100} ${h ? 100 : L}" preserveAspectRatio="none" aria-hidden="true">${inner}</svg>`;
  }

  const SAVE_V = 2;
  const load = () => {
    const base = { v: SAVE_V, level: Math.max(0, Curio.store.get('ub:level', 0) | 0), done: Curio.store.get('ub:done', {}) || {}, ach: {}, hintsUsed: 0, daily: {}, totalTime: 0 };
    const raw = Curio.store.get('ub:v2', null);
    if (!raw || raw.v !== SAVE_V) return base;
    return { ...base, ...raw, done: raw.done || {}, ach: raw.ach || {}, daily: raw.daily || {} };
  };
  const save = load();
  const persist = () => Curio.store.set('ub:v2', save);

  const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  const dailyIdx = () => { let h = 2166136261; for (const ch of todayKey()) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } const lo = TIERS[2][0]; return lo + ((h >>> 0) % (LEVELS.length - lo)); };

  let idx = Math.min(LEVELS.length - 1, save.level);
  let V, pos, hist, carEls, won, ghostEl, hinted, solving, isDaily = false, t0 = 0, elapsed = 0, ticking = false;
  const lot = $('lot');
  const stars = (m, opt) => (m <= opt ? 3 : m <= Math.ceil(opt * 1.5) + 1 ? 2 : 1);
  const fmtT = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  function loadLevel(i, daily = false) {
    idx = i; isDaily = daily; save.level = idx; persist();
    V = parse(LEVELS[idx][0]); pos = V.map((v) => v.p); hist = []; won = false; hinted = false; solving = false;
    t0 = 0; elapsed = 0; ticking = false;
    lot.querySelectorAll('.car, .ghost, .puff').forEach((e) => e.remove());
    carEls = [];
    let pi = idx * 3, ti = idx;
    V.forEach((v, k) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `car${k === 0 ? ' hero' : ''}`;
      b.style.setProperty('--w', v.h ? v.len : 1); b.style.setProperty('--h', v.h ? 1 : v.len);
      const color = k === 0 ? '#e53935' : v.len === 3 ? TRUCKS[ti++ % TRUCKS.length] : PAL[pi++ % PAL.length];
      b.innerHTML = carSvg(v.len, v.h, color, k === 0);
      b.dataset.i = k;
      lot.append(b); carEls.push(b);
    });
    paint(); hud(); paintPicker();
  }

  function paint() {
    V.forEach((v, i) => {
      const el = carEls[i];
      el.style.setProperty('--r', v.h ? v.fixed : pos[i]);
      el.style.setProperty('--c', v.h ? pos[i] : v.fixed);
      const name = i === 0 ? 'Red car' : `${v.len === 3 ? 'Truck' : 'Car'} ${i}`;
      el.setAttribute('aria-label', `${name}, ${v.h ? 'horizontal' : 'vertical'}, row ${(v.h ? v.fixed : pos[i]) + 1}, column ${(v.h ? pos[i] : v.fixed) + 1}`);
    });
  }

  function hud() {
    const [, name, col] = tierOf(idx);
    $('level').textContent = isDaily ? '📅' : idx + 1;
    $('moves').textContent = hist.length;
    $('opt').textContent = LEVELS[idx][1];
    $('time').textContent = fmtT(elapsed);
    $('tier').textContent = name; $('tier').style.setProperty('--tc', col);
    $('prev').disabled = idx <= 0; $('next').disabled = idx >= LEVELS.length - 1;
    $('undo').disabled = !hist.length || won || solving;
  }
  setInterval(() => { if (!ticking || won || document.hidden) return; elapsed = (performance.now() - t0) / 1000; $('time').textContent = fmtT(elapsed); }, 500);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && ticking) t0 = performance.now() - elapsed * 1000; });

  function paintPicker() {
    const box = $('levels'); box.innerHTML = '';
    const done = save.done;
    TIERS.forEach(([start, name], ti) => {
      const end = TIERS[ti + 1] ? TIERS[ti + 1][0] : LEVELS.length;
      const h = document.createElement('h3'); h.textContent = `${name} · ${LEVELS[start][1]} to ${LEVELS[end - 1][1]} moves`; box.append(h);
      const g = document.createElement('div'); g.className = 'grid';
      for (let i = start; i < end; i++) {
        const b = document.createElement('button'); b.type = 'button'; b.dataset.l = i;
        const s = done[i] ? stars(done[i], LEVELS[i][1]) : 0;
        b.innerHTML = `${i + 1}<small>${'★'.repeat(s)}</small>`;
        b.setAttribute('aria-label', `Level ${i + 1}${s ? `, ${s} stars` : ''}`);
        if (i === idx) b.classList.add('cur');
        if (done[i]) b.classList.add('ok');
        g.append(b);
      }
      box.append(g);
    });
    $('lv-count').textContent = `${Object.keys(done).length}/${LEVELS.length}`;
    const optCount = Object.entries(done).filter(([i, m]) => m <= LEVELS[i][1]).length;
    $('statgrid').innerHTML = [[Object.keys(done).length, 'Cleared'], [optCount, 'Optimal'], [Object.entries(done).reduce((a, [i, m]) => a + stars(m, LEVELS[i][1]), 0), 'Stars'], [save.hintsUsed, 'Hints'], [Object.keys(save.daily).length, 'Dailies'], [fmtT(save.totalTime), 'Time parked']]
      .map(([v, l]) => `<div class="c-stat"><b>${v}</b><span>${l}</span></div>`).join('');
    $('achs').innerHTML = ACH.map(([id, e, n, d]) => `<div class="ach${save.ach[id] ? ' on' : ''}" title="${d}"><span>${e}</span><div><b>${n}</b>${d}</div></div>`).join('');
    $('ach-count').textContent = `${Object.keys(save.ach).length}/${ACH.length}`;
  }
  $('levels').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; loadLevel(+b.dataset.l); window.scrollTo({ top: 0, behavior: 'smooth' }); });

  function unlock(id) {
    if (save.ach[id]) return;
    save.ach[id] = Date.now(); persist();
    const a = ACH.find((x) => x[0] === id);
    if (a) setTimeout(() => Curio.toast(`${a[1]} Badge unlocked: ${a[2]}`, 2400), 1200);
  }

  function clearHint() { carEls.forEach((c) => c.classList.remove('hint')); ghostEl?.remove(); ghostEl = null; }

  function commit(i, p) {
    if (p === pos[i]) return;
    clearHint();
    if (!ticking) { ticking = true; t0 = performance.now() - elapsed * 1000; }
    const last = hist[hist.length - 1];
    if (last && last.i === i) { if (last.from === p) hist.pop(); }
    else hist.push({ i, from: pos[i] });
    pos[i] = p;
    paint(); hud();
    Curio.beep(i === 0 ? 520 : 360 + (i % 5) * 30, 0.05, 'triangle', 0.07);
    if (pos[0] === 4) win();
  }

  async function win() {
    won = true; ticking = false; hud();
    const m = hist.length, opt = LEVELS[idx][1], s = stars(m, opt);
    const el = carEls[0];
    for (let k = 0; k < 4; k++) setTimeout(() => {
      const pf = document.createElement('i'); pf.className = 'puff';
      pf.style.left = `${(pos[0]) / 6 * 100 + 2}%`; pf.style.top = `${2.5 / 6 * 100 - 3}%`;
      lot.append(pf); setTimeout(() => pf.remove(), 750);
    }, k * 90);
    setTimeout(() => { el.classList.add('gone'); el.style.setProperty('--c', 8); }, 150);
    [392, 523, 659, 784].forEach((f, k) => setTimeout(() => Curio.beep(f, 0.12, 'square', 0.05), k * 90));
    try { navigator.vibrate?.([20, 30, 40]); } catch {}
    if (solving) { await new Promise((r) => setTimeout(r, 900)); solving = false; Curio.toast('That is the shortest route. Now try it yourself!'); loadLevel(idx, isDaily); return; }
    const done = save.done;
    if (!done[idx] || m < done[idx]) done[idx] = m;
    save.totalTime += Math.round(elapsed);
    if (isDaily) { save.daily[todayKey()] = m; unlock('daily'); }
    unlock('first');
    if (m <= opt) unlock('opt');
    if (Object.entries(done).filter(([i, mm]) => mm <= LEVELS[i][1]).length >= 10) unlock('opt10');
    const ti = TIERS.indexOf(tierOf(idx));
    const start = TIERS[ti][0], end = TIERS[ti + 1] ? TIERS[ti + 1][0] : LEVELS.length;
    let all = true; for (let k = start; k < end; k++) if (!done[k]) all = false;
    if (all) unlock(`t${ti + 1}`);
    if (ti >= 2 && elapsed < 60) unlock('fast');
    if (opt >= 30) unlock('hard');
    if (ti >= 3 && !hinted) unlock('nohint');
    persist();
    await new Promise((r) => setTimeout(r, 750));
    Curio.confetti();
    const msg = m === opt ? 'Optimal! The computer could not have done better.' : m <= opt + 3 ? `Only ${m - opt} more than optimal. So close.` : `Optimal is ${opt}. Think you can squeeze it down?`;
    const last = idx === LEVELS.length - 1;
    const v = await Curio.modal({ emoji: s === 3 ? '🏁' : '🚗', title: `${'★'.repeat(s)}${'☆'.repeat(3 - s)}`, body: `${isDaily ? 'Daily jam' : `Level ${idx + 1}`} cleared in ${m} moves and ${fmtT(elapsed)}. ${msg}${last ? ' That was the last level. You are a parking legend.' : ''}`, buttons: [...(last || isDaily ? [] : [{ label: 'Next level', value: 'next' }]), { label: 'Replay', value: 'again' }, { label: 'Share', value: 'share' }] });
    if (v === 'share') { try { await navigator.clipboard.writeText(`🚗 Zoble Unblock ${isDaily ? `daily jam ${todayKey()}` : `level ${idx + 1}`}: out in ${m} moves (optimal ${opt}) ${'★'.repeat(s)}`); Curio.toast('Copied!'); } catch { Curio.toast('Could not reach the clipboard.'); } loadLevel(idx, isDaily); return; }
    loadLevel(v === 'next' ? idx + 1 : idx, v !== 'next' && isDaily);
  }

  let drag = null, wantUnlatch = false;
  Curio.drag(lot, {
    start(pt) {
      drag = null;
      const el = pt.event.target.closest('.car');
      if (!el || won || solving) { wantUnlatch = true; return; }
      pt.event.preventDefault();
      const i = +el.dataset.i, v = V[i];
      const cell = lot.getBoundingClientRect().width / 6;
      const [lo, hi] = range(V, pos, i);
      drag = { i, el, start: v.h ? pt.clientX : pt.clientY, p0: pos[i], lo, hi, cell, bonked: false };
      el.classList.add('drag');
      el.focus({ preventScroll: true });
    },
    move(pt) {
      if (!drag) return;
      const v = V[drag.i];
      const d = ((v.h ? pt.clientX : pt.clientY) - drag.start) / drag.cell;
      const raw = drag.p0 + d;
      const f = Math.max(drag.lo, Math.min(drag.hi, raw));
      if ((raw < drag.lo - 0.15 || raw > drag.hi + 0.15) && !drag.bonked) { drag.bonked = true; Curio.beep(110, 0.05, 'square', 0.04); }
      if (raw >= drag.lo && raw <= drag.hi) drag.bonked = false;
      drag.el.style.setProperty(v.h ? '--c' : '--r', f);
    },
    end(pt) {
      if (!drag) return;
      const d = drag; drag = null;
      d.el.classList.remove('drag');
      if (!pt) { paint(); return; }
      const v = V[d.i];
      const f = parseFloat(d.el.style.getPropertyValue(v.h ? '--c' : '--r'));
      const p = Math.round(f);
      if (p !== pos[d.i]) commit(d.i, p); else paint();
    }
  });
  addEventListener('pointerup', () => { if (wantUnlatch) { wantUnlatch = false; if (Curio.touchpad) window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); } });
  lot.addEventListener('keydown', (e) => {
    const el = e.target.closest('.car'); if (!el || won || solving) return;
    const i = +el.dataset.i, v = V[i];
    const d = v.h ? { ArrowLeft: -1, ArrowRight: 1 }[e.key] : { ArrowUp: -1, ArrowDown: 1 }[e.key];
    if (d == null) return;
    e.preventDefault();
    const [lo, hi] = range(V, pos, i);
    const p = pos[i] + d;
    if (p < lo || p > hi) { Curio.beep(140, 0.05, 'square', 0.03); el.classList.remove('bonk'); void el.offsetWidth; el.classList.add('bonk'); return; }
    commit(i, p);
  });

  function undo() {
    if (!hist.length || won || solving) return;
    const h = hist.pop(); pos[h.i] = h.from; clearHint(); paint(); hud();
    Curio.beep(300, 0.05, 'sine', 0.07);
  }
  function hint() {
    if (won || solving) return;
    clearHint();
    const mv = nextMove(V, pos);
    if (!mv) return;
    hinted = true; save.hintsUsed++; persist();
    const v = V[mv.i];
    carEls[mv.i].classList.add('hint');
    ghostEl = document.createElement('div'); ghostEl.className = 'ghost';
    ghostEl.style.setProperty('--w', v.h ? v.len : 1); ghostEl.style.setProperty('--h', v.h ? 1 : v.len);
    ghostEl.style.setProperty('--r', v.h ? v.fixed : mv.p); ghostEl.style.setProperty('--c', v.h ? mv.p : v.fixed);
    lot.append(ghostEl);
    Curio.toast(mv.i === 0 ? 'Floor it!' : `Slide the highlighted ${v.len === 3 ? 'truck' : 'car'} to the dashed spot.`);
  }
  async function showSolution() {
    if (won || solving) return;
    const ok = await Curio.modal({ emoji: '🎬', title: 'Watch the solution?', body: 'The car park resets and the computer drives the shortest route. Your attempt will not count.', buttons: [{ label: 'Show me', value: 'y' }, { label: 'Keep trying', value: 'n' }] });
    if (ok !== 'y') return;
    loadLevel(idx, isDaily);
    solving = true; hinted = true; hud();
    const my = idx;
    while (solving && !won && my === idx) {
      const mv = nextMove(V, pos);
      if (!mv) break;
      await new Promise((r) => setTimeout(r, 520));
      if (!solving || my !== idx) return;
      carEls[mv.i].classList.add('hint');
      setTimeout(() => carEls[mv.i]?.classList.remove('hint'), 400);
      commit(mv.i, mv.p);
    }
  }

  $('undo').addEventListener('click', undo);
  $('reset').addEventListener('click', () => loadLevel(idx, isDaily));
  $('prev').addEventListener('click', () => idx > 0 && loadLevel(idx - 1));
  $('next').addEventListener('click', () => idx < LEVELS.length - 1 && loadLevel(idx + 1));
  $('hint').addEventListener('click', hint);
  $('solve').addEventListener('click', showSolution);
  $('daily').addEventListener('click', () => { loadLevel(dailyIdx(), true); Curio.toast(save.daily[todayKey()] ? `Already cleared today in ${save.daily[todayKey()]} moves. Go for optimal!` : 'Today\'s jam. Same puzzle for everyone!'); });
  addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector('.curio-modal')) return;
    const k = e.key.toLowerCase();
    if (k === 'u') undo(); else if (k === 'h') hint(); else if (k === 'r') loadLevel(idx, isDaily);
  });

  $('logo').innerHTML = `<rect x="0" y="40" width="170" height="16" rx="4" fill="#6a6e76"/><path d="M8 48h18M40 48h18M72 48h18M104 48h18M136 48h18" stroke="#ffd23c" stroke-width="3"/>
    <g transform="translate(6 4) scale(.34)">${carSvg(2, true, '#1e88e5').replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>
    <g class="hero-car"><g transform="translate(84 4) scale(.34)">${carSvg(2, true, '#e53935', true).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g></g>
    <g transform="translate(146 0) scale(.2)"><rect x="1" y="2" width="96" height="96" rx="20" fill="#2fb36d" stroke="#fff" stroke-width="8"/><path d="M26 50h40M52 30l20 20-20 20" stroke="#fff" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`;

  loadLevel(idx);
  window.__ub = { LEVELS, parse, range, nextMove, commit, get pos() { return pos; }, get V() { return V; }, load: loadLevel, get moves() { return hist.length; }, get won() { return won; } };
  if (!Curio.touchpad && !Curio.store.get('padtip:unblock', false)) { Curio.store.set('padtip:unblock', true); setTimeout(() => Curio.toast('Tip: on a laptop touchpad? Turn on Touchpad mode in the top bar.', 3400), 2200); }
})();
