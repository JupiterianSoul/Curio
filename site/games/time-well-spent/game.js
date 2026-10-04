(() => {
  const D = window.TW_DATA;
  const C = window.Curio;
  const adv = C.advanced;
  const M = adv ? D.life : D.day;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const buzz = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch {} };

  const ITEMS = M.items.map(([emo, name, dur, fx, cat, note], idx) => {
    const f = {};
    fx.split(' ').filter(Boolean).forEach((p) => { f[p[0]] = parseInt(p.slice(1), 10); });
    return { emo, name, dur, fx: f, cat, note, idx, c: D.cats[cat] };
  });
  const TAKEN = adv ? M.taken.reduce((a, t) => a + t[1], 0) : 0;
  const TOTAL_H = adv ? M.years * 8760 : 0;
  const BUDGET = adv ? TOTAL_H - TAKEN : M.budget;
  const CAT_NAMES = { all: 'Everything', rest: 'Rest', food: 'Food', move: 'Move', mind: 'Mind', screen: 'Screens', people: 'People', chore: 'Chores', travel: 'Travel', make: 'Make' };

  let plan = [];
  let filter = 'all';
  const els = { grid: $('#grid'), visual: $('#visual'), left: $('.tw-left'), meters: $('#meters'), cats: $('#cats'), result: $('#result') };

  const fmtMin = (m) => { const h = Math.floor(m / 60), r = m % 60; return h ? (r ? `${h} h ${r} min` : `${h} h`) : `${r} min`; };
  const fmtH = (h) => `${C.fmt(h)} h`;
  const span = (h) => h >= 8760 ? `${(h / 8760).toFixed(1)} years` : h >= 24 * 14 ? `${Math.round(h / 24 / 7)} weeks` : h >= 48 ? `${Math.round(h / 24)} days` : `${h} hours`;
  const fmt = (v) => adv ? fmtH(v) : fmtMin(v);
  const clock = (m) => { const t = M.start * 60 + m; const h = Math.floor(t / 60) % 24, mm = t % 60; return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`; };

  const used = () => plan.reduce((a, i) => a + ITEMS[i].dur, 0);
  const left = () => BUDGET - used();
  const count = (i) => plan.filter((x) => x === i).length;
  const totals = () => {
    const t = {};
    M.meters.forEach(([k]) => { t[k] = 0; });
    plan.forEach((i) => { for (const [k, v] of Object.entries(ITEMS[i].fx)) t[k] = (t[k] || 0) + v; });
    return t;
  };

  function sound(kind) {
    if (C.muted) return;
    if (kind === 'add') { C.beep(1320, 0.03, 'square', 0.04); setTimeout(() => C.beep(990, 0.05, 'triangle', 0.06), 40); }
    else if (kind === 'sub') { C.beep(700, 0.04, 'triangle', 0.06); setTimeout(() => C.beep(520, 0.05, 'triangle', 0.05), 40); }
    else if (kind === 'full') C.sfx('error');
    else if (kind === 'ding') { [880, 1108, 1318].forEach((f, i) => setTimeout(() => C.beep(f, 0.35, 'sine', 0.07), i * 110)); }
  }

  function setupTexts() {
    if (adv) {
      $('#sub').textContent = `Eighty years is ${C.fmt(TOTAL_H)} hours. Sleep, work and chores take most of them. Spend what is left on a life.`;
      $('#leftLabel').textContent = 'free hours left in your life';
      $('#liveBtn').textContent = 'Live it';
      $('#rKick').textContent = 'Your life, reviewed';
      $('#taken').innerHTML = M.taken.map(([n, h, c, note]) => `<span style="--c:${c}" title="${esc(note)}">${esc(n)} ${span(h)}</span>`).join('');
    } else {
      $('#taken').innerHTML = '<span style="--c:#d8c8b0">7:00 wake up</span><span style="--c:#4a4e69">23:00 bedtime</span>';
    }
    const cats = ['all', ...new Set(ITEMS.map((i) => i.cat))];
    els.cats.innerHTML = cats.map((c) => `<button type="button" data-cat="${c}" aria-pressed="${c === filter}"${c === 'all' ? '' : ` style="--c:${D.cats[c]}"`}>${c === 'all' ? '' : '<i></i>'}${CAT_NAMES[c] || c}</button>`).join('');
    els.meters.innerHTML = M.meters.map(([k, n, c]) => `<div class="tw-meter" data-k="${k}"><span>${n}</span><div class="tw-track"><i style="background:${c}"></i></div><b>0</b></div>`).join('');
  }

  function renderGrid() {
    const lft = left();
    els.grid.innerHTML = ITEMS.filter((it) => filter === 'all' || it.cat === filter).map((it) => {
      const n = count(it.idx);
      const fx = Object.entries(it.fx).map(([k, v]) => { const m = M.meters.find((x) => x[0] === k); return `<span class="${v < 0 ? 'is-neg' : ''}">${v > 0 ? '+' : ''}${v} ${m ? m[1] : k}</span>`; }).join('');
      return `<article class="tw-item${n ? ' has' : ''}" data-i="${it.idx}" style="--c:${it.c}">
        <div class="tw-emo" aria-hidden="true">${it.emo}</div>
        <div class="tw-name">${esc(it.name)}</div>
        <div class="tw-dur">${fmt(it.dur)}${adv && it.dur >= 48 ? ` · ${span(it.dur)}` : ''}</div>
        <p class="tw-note">${esc(it.note)}</p>
        <div class="tw-fx">${fx}</div>
        <div class="tw-ctl"><button type="button" data-act="sub" aria-label="Remove ${esc(it.name)}" ${n ? '' : 'disabled'}>−</button><output aria-label="Times chosen">${n}</output><button type="button" data-act="add" aria-label="Add ${esc(it.name)}" ${it.dur > lft ? 'disabled' : ''}>+</button></div>
      </article>`;
    }).join('');
  }

  function updateItem(i, bump) {
    const lft = left();
    els.grid.querySelectorAll('.tw-item').forEach((el) => {
      const it = ITEMS[+el.dataset.i];
      const n = count(it.idx);
      el.classList.toggle('has', n > 0);
      el.querySelector('output').textContent = n;
      el.querySelector('[data-act="sub"]').disabled = !n;
      el.querySelector('[data-act="add"]').disabled = it.dur > lft;
      if (bump && it.idx === i) { el.classList.remove('is-bump'); void el.offsetWidth; el.classList.add('is-bump'); }
    });
  }

  function ring() {
    const R = 92, CIRC = 2 * Math.PI * R;
    let acc = 0;
    const segs = plan.map((i) => {
      const it = ITEMS[i];
      const len = (it.dur / BUDGET) * CIRC;
      const s = `<circle class="tw-seg" cx="120" cy="120" r="${R}" fill="none" stroke="${it.c}" stroke-width="26" stroke-dasharray="${Math.max(0, len - 1.5)} ${CIRC}" stroke-dashoffset="${-acc}" transform="rotate(-90 120 120)"><title>${esc(it.name)}</title></circle>`;
      acc += len;
      return s;
    }).join('');
    const u = used();
    const ang = (u / BUDGET) * 360;
    const labels = [7, 11, 15, 19, 23].map((h, k) => {
      const a = ((k * 4) / 16) * Math.PI * 2 - Math.PI / 2;
      const r = 124 - 12;
      return k === 4 ? '' : `<text x="${120 + Math.cos(a) * (R + 24)}" y="${124 + Math.sin(a) * (R + 24)}" text-anchor="middle">${h}:00</text>`;
    }).join('');
    const emos = [];
    let a2 = 0;
    plan.forEach((i) => {
      const it = ITEMS[i];
      const mid = a2 + it.dur / 2;
      a2 += it.dur;
      if (it.dur / BUDGET < 0.045) return;
      const a = (mid / BUDGET) * Math.PI * 2 - Math.PI / 2;
      emos.push(`<text x="${120 + Math.cos(a) * R}" y="${125 + Math.sin(a) * R}" text-anchor="middle" style="font-size:13px">${it.emo}</text>`);
    });
    els.visual.innerHTML = `<svg class="tw-ring" viewBox="-22 -6 284 252" role="img" aria-label="Your Saturday from 7:00 to 23:00, ${fmtMin(u)} planned">
      <circle cx="120" cy="120" r="${R}" fill="none" stroke="var(--tw-dim)" stroke-width="26"/>
      ${segs}${emos.join('')}
      <circle cx="120" cy="120" r="70" fill="var(--tw-paper)" stroke="var(--line)" stroke-width="2"/>
      ${labels}
      <g class="tw-hand" style="transform:rotate(${ang}deg)"><path d="M120 120V36" stroke="var(--ink)" stroke-width="4" stroke-linecap="round"/><circle cx="120" cy="120" r="6" fill="var(--ink)"/></g>
      <text class="tw-ctr" x="120" y="118" text-anchor="middle">${clock(u)}</text>
      <text class="tw-ctr2" x="120" y="136" text-anchor="middle">PLANNED UNTIL</text>
    </svg>`;
  }

  let canvas = null;
  function weeks() {
    if (!canvas) {
      els.visual.innerHTML = '<div class="tw-weeks"><canvas id="weeks" width="416" height="640" role="img" aria-label="Your life in weeks"></canvas><small>Your 4,160 weeks, sorted by what they were spent on. Each square is one week.</small></div>';
      canvas = $('#weeks');
    }
    const cols = 52, rows = M.years, cell = 8;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = cols * cell * dpr; canvas.height = rows * cell * dpr;
    const g = canvas.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, cols * cell, rows * cell);
    const blocks = [...M.taken.map(([, h, c]) => [h, c])];
    const grouped = {};
    plan.forEach((i) => { grouped[i] = (grouped[i] || 0) + ITEMS[i].dur; });
    Object.entries(grouped).forEach(([i, h]) => blocks.push([h, ITEMS[i].c]));
    let cellsDone = 0;
    let carry = 0;
    const dim = getComputedStyle(document.documentElement).getPropertyValue('--line').trim() || '#ccc';
    const paint = (n, color) => {
      g.fillStyle = color;
      for (let k = 0; k < n && cellsDone < cols * rows; k++, cellsDone++) {
        const x = cellsDone % cols, y = Math.floor(cellsDone / cols);
        g.beginPath();
        g.roundRect ? g.roundRect(x * cell + 0.5, y * cell + 0.5, cell - 1.5, cell - 1.5, 1.5) : g.rect(x * cell + 0.5, y * cell + 0.5, cell - 1.5, cell - 1.5);
        g.fill();
      }
    };
    for (const [h, c] of blocks) {
      const exact = h / 168 + carry;
      const n = Math.round(exact);
      carry = exact - n;
      paint(n, c);
    }
    paint(cols * rows - cellsDone, dim);
  }

  function paintMeters() {
    const t = totals();
    const scale = adv ? 60 : 24;
    M.meters.forEach(([k]) => {
      const el = els.meters.querySelector(`[data-k="${k}"]`);
      const v = t[k] || 0;
      const w = Math.min(50, (Math.abs(v) / scale) * 50);
      const bar = el.querySelector('i');
      bar.style.left = v >= 0 ? '50%' : `${50 - w}%`;
      bar.style.width = `${w}%`;
      el.querySelector('b').textContent = v > 0 ? `+${v}` : v;
    });
  }

  function paint(bumpI) {
    const lft = left();
    els.left.querySelector('b').textContent = adv ? C.fmt(lft) : fmtMin(lft);
    els.left.classList.remove('is-pop'); void els.left.offsetWidth; els.left.classList.add('is-pop');
    $('#barLeft').textContent = adv ? `${C.fmt(lft)} h left` : `${fmtMin(lft)} left`;
    $('#barNote').textContent = adv ? `about ${span(lft)} of free time` : plan.length ? `planned until ${clock(used())}` : 'bedtime is 23:00';
    if (adv) weeks(); else ring();
    paintMeters();
    updateItem(bumpI, true);
  }

  function add(i) {
    const it = ITEMS[i];
    if (it.dur > left()) { sound('full'); C.toast(adv ? 'Not enough life left for that.' : 'Not enough day left for that.'); return; }
    plan.push(i);
    sound('add'); buzz(8);
    paint(i);
    if (left() === 0) { sound('ding'); C.toast(adv ? 'Every hour spoken for.' : 'Your whole day is planned!'); }
  }
  function sub(i) {
    const k = plan.lastIndexOf(i);
    if (k < 0) return;
    plan.splice(k, 1);
    sound('sub');
    paint(i);
  }

  function live() {
    const t = totals();
    const u = used();
    const lft = left();
    const screen = plan.filter((i) => ITEMS[i].cat === 'screen').reduce((a, i) => a + ITEMS[i].dur, 0);
    const s = { ...t, left: lft, share: u ? screen / u : 0 };
    const rank = M.ranks.find(([test]) => test(s));
    $('#rTitle').textContent = rank[1];
    $('#rText').textContent = rank[2];
    $('#rMeters').innerHTML = M.meters.map(([k, n, c]) => `<div><b style="color:${c}">${t[k] > 0 ? '+' : ''}${t[k]}</b><span>${n}</span></div>`).join('');
    const grouped = {};
    plan.forEach((i) => { grouped[i] = (grouped[i] || 0) + 1; });
    const rows = Object.entries(grouped).map(([i, n]) => [ITEMS[i], n]).sort((a, b) => b[0].dur * b[1] - a[0].dur * a[1]);
    const line = (a, b, cls = '') => `<li class="${cls}"><span>${a}</span><span>${b}</span></li>`;
    $('#rList').innerHTML = [
      ...(adv ? M.taken.map(([n, h]) => line(esc(n), fmtH(h))) : []),
      ...rows.map(([it, n]) => line(`${it.emo} ${esc(it.name)}${n > 1 ? ` x${n}` : ''}`, fmt(it.dur * n))),
      ...(lft > 0 ? [line(adv ? '🫥 Unplanned' : '🧱 Staring at a wall', fmt(lft))] : []),
      line('Total', adv ? fmtH(TOTAL_H) : '16 h', 'is-total')
    ].join('');
    const key = `tw:titles:${C.mode}`;
    const got = C.store.get(key, []);
    const isNew = !got.includes(rank[1]);
    if (isNew) { got.push(rank[1]); C.store.set(key, got); }
    $('#rFound').textContent = `${isNew ? 'New title! ' : ''}Titles found: ${got.length} of ${M.ranks.length}.`;
    C.best(`titles:${C.mode}`, got.length);
    els.result.hidden = false;
    sound('ding');
    if (isNew) C.confetti(80);
    $('#againBtn').focus({ preventScroll: true });
  }

  els.grid.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-act]'); if (!b) return;
    const i = +b.closest('.tw-item').dataset.i;
    if (b.dataset.act === 'add') add(i); else sub(i);
  });
  els.cats.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-cat]'); if (!b) return;
    filter = b.dataset.cat;
    els.cats.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    renderGrid();
  });
  $('#liveBtn').addEventListener('click', live);
  $('#resetBtn').addEventListener('click', () => { if (!plan.length) return; plan = []; C.sfx('whoosh'); renderGrid(); paint(-1); });
  $('#againBtn').addEventListener('click', () => { els.result.hidden = true; plan = []; renderGrid(); paint(-1); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  $('#editBtn').addEventListener('click', () => { els.result.hidden = true; });
  $('#shareBtn').addEventListener('click', () => {
    const top = [...new Set(plan)].slice(0, 4).map((i) => ITEMS[i].name.toLowerCase()).join(', ');
    const txt = `Zoble Time Well Spent: my ${adv ? 'life' : 'Saturday'} was "${$('#rTitle').textContent}"${top ? ` (${top})` : ''}.`;
    (navigator.clipboard?.writeText(txt) || Promise.reject()).then(() => C.toast('Copied!'), () => C.toast(txt, 4000));
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !els.result.hidden) els.result.hidden = true;
  });
  window.addEventListener('curio:theme', () => { if (adv) weeks(); });

  setupTexts();
  renderGrid();
  paint(-1);
})();
