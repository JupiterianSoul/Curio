(() => {
  const $ = (id) => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  const money = (n) => '$' + Math.round(n).toLocaleString('en-US');
  const short = (n) => {
    const a = Math.abs(n);
    if (a >= 1e9) return '$' + (n / 1e9).toFixed(a >= 1e10 ? 0 : 1).replace(/\.0$/, '') + 'B';
    if (a >= 1e6) return '$' + (n / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M';
    if (a >= 1e3) return '$' + Math.round(n / 1e3) + 'k';
    return '$' + Math.round(n);
  };
  const INF = 0.025;
  const ids = ['start', 'monthly', 'rate', 'years', 'fee'];
  const saved = Curio.store.get('ci:vals', null);
  if (saved) ids.forEach((k) => { if (saved[k] != null) $(k).value = saved[k]; });
  $('real').checked = !!Curio.store.get('ci:real', false);

  function simulate(P, C, r, years, fee = 0) {
    const n = Math.round(years * 12);
    const i = (r - fee) / 100 / 12;
    const bal = new Float64Array(n + 1), con = new Float64Array(n + 1), yInt = [];
    bal[0] = P; con[0] = P;
    let yearStartInt = 0, cumInt = 0;
    for (let m = 1; m <= n; m++) {
      const interest = bal[m - 1] * i;
      cumInt += interest;
      bal[m] = bal[m - 1] + interest + C;
      con[m] = con[m - 1] + C;
      if (m % 12 === 0) { yInt.push(cumInt - yearStartInt); yearStartInt = cumInt; }
    }
    return { bal, con, yInt, n };
  }
  const real = () => $('real').checked;
  const deflate = (v, m) => (real() ? v / Math.pow(1 + INF, m / 12) : v);

  const svg = $('chart');
  let W = 640, H = 450, PW = 0, PH = 0;
  const L = 52, R = 12, T = 16, B = 30;
  function setSize() {
    const narrow = (svg.parentElement.clientWidth || 640) < 520;
    W = narrow ? 380 : 640; H = narrow ? 320 : 450;
    PW = W - L - R; PH = H - T - B;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  }
  setSize();
  const S = 160;
  let shown = null, target = null, anim = 0, yMaxShown = 1, yMaxTarget = 1, cur = null;
  svg.innerHTML = `<defs><linearGradient id="ciGc" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#90caf9"/><stop offset="1" stop-color="#42a5f5"/></linearGradient><linearGradient id="ciGi" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#81c784"/><stop offset="1" stop-color="#2e7d32"/></linearGradient></defs><g class="grid" id="grid"></g><path class="a-c" id="aC"/><path class="a-i" id="aI"/><path class="l-t" id="lT"/><g class="xax" id="xax"></g><g class="ms" id="ms"></g><path class="l-g" id="lG"/><g class="cursor" id="cursor" style="display:none"><line id="cl"/><circle id="cd" r="5" fill="var(--ci)" stroke="var(--surface)" stroke-width="2"/></g>`;

  function sampled(sim, years) {
    const c = new Float64Array(S + 1), t = new Float64Array(S + 1);
    for (let k = 0; k <= S; k++) {
      const mf = k / S * sim.n;
      const m0 = Math.floor(mf), m1 = Math.min(sim.n, m0 + 1), f = mf - m0;
      t[k] = deflate(sim.bal[m0] + (sim.bal[m1] - sim.bal[m0]) * f, mf);
      c[k] = deflate(sim.con[m0] + (sim.con[m1] - sim.con[m0]) * f, mf);
    }
    return { c, t, years };
  }
  function niceMax(v) {
    if (v <= 0) return 1000;
    const e = Math.pow(10, Math.floor(Math.log10(v)));
    for (const s of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (s * e >= v) return s * e;
    return 10 * e;
  }
  const px = (k) => L + k / S * PW;
  const py = (v, max) => T + PH - Math.max(0, v) / max * PH;
  function drawGrid(max, years) {
    let g = '';
    for (let k = 0; k <= 4; k++) {
      const v = max * k / 4, y = py(v, max);
      g += `<line x1="${L}" x2="${W - R}" y1="${y}" y2="${y}"/><text x="${L - 8}" y="${y + 4}" text-anchor="end">${short(v)}</text>`;
    }
    $('grid').innerHTML = g;
    let x = '';
    const step = years <= 10 ? 1 : years <= 20 ? 2 : years <= 40 ? 5 : 10;
    for (let y = 0; y <= years; y += step) x += `<text x="${L + y / years * PW}" y="${H - 10}" text-anchor="middle">${y === 0 ? 'Now' : y + 'y'}</text>`;
    $('xax').innerHTML = x;
  }
  function paths(d, max) {
    let top = '', mid = '', base = '';
    for (let k = 0; k <= S; k++) {
      top += (k ? 'L' : 'M') + px(k).toFixed(1) + ' ' + py(d.t[k], max).toFixed(1);
      mid += (k ? 'L' : 'M') + px(k).toFixed(1) + ' ' + py(Math.min(d.c[k], d.t[k]), max).toFixed(1);
    }
    let rev = '';
    for (let k = S; k >= 0; k--) rev += 'L' + px(k).toFixed(1) + ' ' + py(Math.min(d.c[k], d.t[k]), max).toFixed(1);
    base = `L${px(S)} ${T + PH}L${px(0)} ${T + PH}Z`;
    $('aC').setAttribute('d', mid + base);
    $('aI').setAttribute('d', top + rev + 'Z');
    $('lT').setAttribute('d', top);
    if (ghost) {
      let g = '';
      for (let k = 0; k <= S; k++) g += (k ? 'L' : 'M') + px(k).toFixed(1) + ' ' + py(ghost.t[k], max).toFixed(1);
      $('lG').setAttribute('d', g);
    } else $('lG').setAttribute('d', '');
  }
  function frame(t0, from, fromMax) {
    const p = Math.min(1, (performance.now() - t0) / 550);
    const e = 1 - Math.pow(1 - p, 3);
    const d = { c: new Float64Array(S + 1), t: new Float64Array(S + 1) };
    for (let k = 0; k <= S; k++) { d.c[k] = from.c[k] + (target.c[k] - from.c[k]) * e; d.t[k] = from.t[k] + (target.t[k] - from.t[k]) * e; }
    yMaxShown = fromMax + (yMaxTarget - fromMax) * e;
    shown = d;
    paths(d, yMaxShown);
    drawGrid(yMaxShown, target.years);
    if (p < 1) anim = requestAnimationFrame(() => frame(t0, from, fromMax)); else { anim = 0; drawMarks(); }
  }

  let ghost = null;
  let pinned = (() => { const p = Curio.store.get('ci:pin', null); return p && typeof p.start === 'number' ? p : null; })();
  let sim = null, vals = null, partied = Curio.store.get('ci:million', false);
  function compute() {
    vals = { P: +$('start').value, C: +$('monthly').value, r: +$('rate').value, Y: +$('years').value, f: +$('fee').value };
    Curio.store.set('ci:vals', { start: vals.P, monthly: vals.C, rate: vals.r, years: vals.Y, fee: vals.f });
    $('feeOut').textContent = vals.f.toFixed(2) + '%';
    $('startOut').textContent = money(vals.P);
    $('monthlyOut').textContent = money(vals.C);
    $('rateOut').textContent = vals.r.toFixed(1) + '%';
    $('yearsOut').textContent = vals.Y;
    sim = simulate(vals.P, vals.C, vals.r, vals.Y, vals.f);
    const n = sim.n;
    const total = deflate(sim.bal[n], n), contrib = deflate(sim.con[n], n);
    $('resLabel').textContent = `After ${vals.Y} year${vals.Y === 1 ? '' : 's'} you would have${real() ? ', in today\'s money,' : ''}`;
    $('total').textContent = money(total);
    $('sumC').textContent = money(contrib);
    $('sumI').textContent = money(Math.max(0, total - contrib));
    const mult = sim.con[n] > 0 ? sim.bal[n] / sim.con[n] : 0;
    $('resNote').textContent = sim.con[n] > 0 ? (mult >= 1.995 ? `Every dollar you saved turned into ${mult.toFixed(1)} dollars.` : `Interest added ${Math.round((mult - 1) * 100)}% on top of what you saved.`) : 'Start with something, even a little, and watch.';
    milestones();
    rule72();
    race();
    extras(total);
    target = sampled(sim, vals.Y);
    ghost = pinned ? sampled(simulate(pinned.start, pinned.monthly, pinned.rate, vals.Y, pinned.fee || 0), vals.Y) : null;
    yMaxTarget = niceMax(Math.max(...target.t, ...(ghost ? ghost.t : [0])) * 1.04);
    if (!shown) { shown = target; yMaxShown = yMaxTarget; paths(shown, yMaxShown); drawGrid(yMaxShown, vals.Y); drawMarks(); }
    else { cancelAnimationFrame(anim); $('ms').innerHTML = ''; const from = shown, fm = yMaxShown; anim = requestAnimationFrame(() => frame(performance.now(), from, fm)); }
    if (sim.bal[n] >= 1e6 && !partied) { partied = true; Curio.store.set('ci:million', true); Curio.confetti(); Curio.toast('Millionaire! (Eventually.)'); Curio.beep(880, 0.12, 'triangle', 0.08); }
    if (sim.bal[n] >= 1e6) award('million');
    if (sim.bal[n] >= 1e9) award('billion');
    if (vals.Y >= 60) award('patient');
    if (vals.f <= 0.1 && vals.Y >= 30) award('feefighter');
    pop($('total'));
    if (cur != null) showCursor(cur);
  }

  function findMonth(pred) { for (let m = 0; m <= sim.n; m++) if (pred(m)) return m; return -1; }
  const when = (m) => { const y = Math.floor(m / 12), mo = m % 12; return y === 0 ? `${mo} month${mo === 1 ? '' : 's'}` : `${y} year${y === 1 ? '' : 's'}${mo ? `, ${mo} month${mo === 1 ? '' : 's'}` : ''}`; };
  let marks = [];
  function milestones() {
    const list = [];
    marks = [];
    const val = (m) => deflate(sim.bal[m], m);
    const cross = findMonth((m) => m > 0 && sim.bal[m] - sim.con[m] > sim.con[m]);
    list.push(['⚖️', 'Interest overtakes your savings', cross >= 0 ? `After ${when(cross)}, more than half your pot is interest.` : 'Not within this time frame. Try more years or a higher return.', cross >= 0]);
    if (cross >= 0) marks.push([cross, 'interest > savings', true]);
    let yr = -1;
    for (let k = 0; k < sim.yInt.length; k++) if (sim.yInt[k] >= vals.C * 12 && vals.C > 0) { yr = k + 1; break; }
    list.push(['🔁', 'Your money out-earns you', yr > 0 ? `In year ${yr}, interest alone adds more than your ${money(vals.C * 12)} of yearly saving.` : vals.C > 0 ? 'Not yet in this time frame.' : 'Add a monthly amount to unlock this one.', yr > 0]);
    for (const [goal, e] of [[1e4, '🪙'], [1e5, '💵'], [5e5, '💰'], [1e6, '🏆'], [1e7, '🛥️']]) {
      const m = findMonth((mm) => val(mm) >= goal);
      if (m === -1 && goal > 1e6 && val(sim.n) < goal / 10) continue;
      list.push([e, `${short(goal)} reached`, m >= 0 ? (m === 0 ? 'Right from the start.' : `After ${when(m)}.`) : 'Not within this time frame.', m >= 0]);
      if (m > 0 && (goal === 1e5 || goal === 1e6 || goal === 1e7)) marks.push([m, short(goal)]);
    }
    $('miles').innerHTML = list.map(([e, t, d, ok]) => `<li class="${ok ? '' : 'no'}"><span class="e" aria-hidden="true">${ok ? e : '🔒'}</span><div><b>${t}</b><span>${d}</span></div></li>`).join('');
  }
  function drawMarks() {
    let h = '';
    for (const [m, label, below] of marks) {
      const k = m / sim.n * S;
      const x = px(k), v = deflate(sim.bal[m], m), y = py(v, yMaxShown);
      const flip = below && x > W - 150;
      const tx = below && !flip ? x + 9 : x - 9;
      h += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5"/><text x="${tx.toFixed(1)}" y="${(below ? y + 18 : y - 9).toFixed(1)}" text-anchor="${below && !flip ? 'start' : 'end'}">${label}</text>`;
    }
    $('ms').innerHTML = h;
  }

  function rule72() {
    const r = vals.r;
    if (r <= 0) {
      $('r72').innerHTML = '∞<small>years to double</small>';
      $('r72text').textContent = 'At 0% your money never doubles. With inflation it actually shrinks. Nudge the return slider up.';
      $('r72dbl').innerHTML = '';
      return;
    }
    const est = 72 / r;
    const exact = Math.log(2) / (12 * Math.log(1 + r / 100 / 12));
    $('r72').innerHTML = `${est.toFixed(1)}<small>years to double</small>`;
    $('r72text').textContent = `Divide 72 by your return (${r.toFixed(1)}%) and you get roughly how many years it takes money to double. The exact answer with monthly compounding is ${exact.toFixed(1)} years, so the shortcut is ${Math.abs(est - exact) < 0.3 ? 'spot on' : 'close enough for dinner-party maths'}. Over ${vals.Y} years, a lump sum doubles about ${(vals.Y / exact).toFixed(1)} times:`;
    let s = '';
    const lump = Math.max(vals.P, 1000);
    for (let k = 0; k <= Math.min(8, Math.floor(vals.Y / exact)); k++) s += `<span>${k === 0 ? 'Now' : `${Math.round(k * exact)}y`}: ${short(lump * Math.pow(2, k))}</span>`;
    $('r72dbl').innerHTML = s;
  }

  function race() {
    const C = vals.C || 200, r = vals.r;
    const people = [[20, 'Ana'], [30, 'Ben'], [40, 'Cleo']].map(([age, name]) => {
      const s = simulate(0, C, r, 65 - age);
      return { age, name, total: s.bal[s.n], put: s.con[s.n], months: s.n };
    });
    const max = Math.max(...people.map((p) => p.total)) || 1;
    $('raceIntro').textContent = `Three friends each save ${money(C)} a month at ${r.toFixed(1)}% until they retire at 65. The only difference is when they start.`;
    $('race').innerHTML = people.map((p) => `<div class="ci-runner"><div class="who">${p.name}<small>starts at ${p.age}</small></div><div class="ci-track"><i class="c" style="width:0" data-w="${(p.put / max * 100).toFixed(2)}"></i><i class="n" style="width:0" data-w="${(Math.max(0, p.total - p.put) / max * 100).toFixed(2)}"></i><span>${money(p.total)}</span></div></div>`).join('');
    requestAnimationFrame(() => requestAnimationFrame(() => $('race').querySelectorAll('.ci-track i').forEach((el) => { el.style.width = el.dataset.w + '%'; })));
    const [a, , c] = people;
    const i = r / 100 / 12;
    const months = (65 - 40) * 12;
    const need = i > 0 ? a.total / ((Math.pow(1 + i, months) - 1) / i) : a.total / months;
    $('raceNote').innerHTML = `Ana puts in ${money(a.put - c.put)} more than Cleo but ends up with <b>${money(a.total - c.total)}</b> more. To catch up, Cleo would need to save about <b>${money(need)}</b> a month, ${(need / C).toFixed(1)} times as much.`;
  }

  const tip = $('tip');
  function showCursor(k) {
    cur = k;
    const m = Math.round(k / S * sim.n);
    const x = px(k);
    const tot = deflate(sim.bal[m], m), con = deflate(sim.con[m], m);
    const y = py(tot, yMaxShown);
    $('cursor').style.display = '';
    $('cl').setAttribute('x1', x); $('cl').setAttribute('x2', x); $('cl').setAttribute('y1', T); $('cl').setAttribute('y2', T + PH);
    $('cd').setAttribute('cx', x); $('cd').setAttribute('cy', y);
    const box = svg.getBoundingClientRect(), card = svg.parentElement.getBoundingClientRect();
    const sx = box.left - card.left + x / W * box.width, sy = box.top - card.top + y / H * box.height;
    tip.style.left = Math.max(90, Math.min(card.width - 90, sx)) + 'px';
    tip.style.top = Math.max(70, sy) + 'px';
    tip.innerHTML = `<b>${m === 0 ? 'Now' : 'After ' + when(m)}</b><br>Total ${money(tot)}<br>You put in ${money(con)}<br>Interest ${money(Math.max(0, tot - con))}`;
    tip.style.opacity = 1;
  }
  function pointer(e) {
    const box = svg.getBoundingClientRect();
    const x = (e.clientX - box.left) / box.width * W;
    const k = Math.max(0, Math.min(S, (x - L) / PW * S));
    showCursor(k);
  }
  svg.setAttribute('tabindex', '0');
  svg.addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const step = S / Math.max(1, vals.Y);
    let k = cur == null ? 0 : cur;
    if (e.key === 'ArrowLeft') k -= step; else if (e.key === 'ArrowRight') k += step; else if (e.key === 'Home') k = 0; else k = S;
    showCursor(Math.max(0, Math.min(S, Math.round(k / step) * step)));
  });
  svg.addEventListener('blur', () => { cur = null; tip.style.opacity = 0; $('cursor').style.display = 'none'; });
  svg.addEventListener('pointermove', pointer);
  svg.addEventListener('pointerdown', pointer);
  svg.addEventListener('pointerleave', () => { cur = null; tip.style.opacity = 0; $('cursor').style.display = 'none'; });

  let lastBeep = 0;
  ids.forEach((k) => $(k).addEventListener('input', () => {
    compute();
    const now = performance.now();
    if (now - lastBeep > 70) { lastBeep = now; Curio.beep(300 + +$(k).value / +$(k).max * 600, 0.03, 'sine', 0.04); }
  }));
  $('real').addEventListener('change', () => { Curio.store.set('ci:real', $('real').checked); compute(); });

  const PRESETS = [
    ['☕ Skip the latte', { start: 0, monthly: 150, rate: 7, years: 40 }],
    ['🏦 Savings account', { start: 5000, monthly: 200, rate: 3, years: 20 }],
    ['📈 Index fund', { start: 1000, monthly: 500, rate: 7, years: 35 }],
    ['🎁 One gift at birth', { start: 5000, monthly: 0, rate: 7, years: 60 }],
    ['🚀 Go big', { start: 50000, monthly: 2000, rate: 8, years: 30 }],
    ['🎓 First job', { start: 500, monthly: 300, rate: 7, years: 45, fee: 0.1 }],
    ['🐷 Kid\'s piggy bank', { start: 100, monthly: 20, rate: 4, years: 18 }],
    ['🏦 Pricey fund', { start: 10000, monthly: 500, rate: 7, years: 30, fee: 1.5 }],
    ['🧓 Late starter', { start: 20000, monthly: 1000, rate: 6, years: 15 }],
    ['🛏️ Mattress money', { start: 10000, monthly: 200, rate: 0, years: 30, fee: 0 }]
  ];
  PRESETS.forEach(([label, v]) => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = label;
    b.addEventListener('click', () => { Object.entries(v).forEach(([k, x]) => { $(k).value = x; }); compute(); Curio.beep(660, 0.06, 'triangle', 0.06); });
    $('presets').append(b);
  });

  let rz = 0, lastNarrow = W;
  addEventListener('resize', () => {
    clearTimeout(rz);
    rz = setTimeout(() => {
      setSize();
      if (W === lastNarrow) return;
      lastNarrow = W;
      cancelAnimationFrame(anim); anim = 0;
      shown = target; yMaxShown = yMaxTarget;
      paths(shown, yMaxShown); drawGrid(yMaxShown, target.years); drawMarks();
    }, 150);
  });
  const BADGES = { million: ['🏆', 'Millionaire'], billion: ['🛥️', 'Billionaire'], patient: ['🐢', 'Patient'], feefighter: ['🛡️', 'Fee fighter'], comparer: ['📌', 'Comparer'], goal: ['🎯', 'Goal setter'] };
  let badges = Curio.store.get('ci:badges', []);
  if (!Array.isArray(badges)) badges = [];
  function award(id) {
    if (badges.includes(id)) return;
    badges.push(id);
    Curio.store.set('ci:badges', badges);
    Curio.toast(`${BADGES[id][0]} Badge: ${BADGES[id][1]}`);
    paintBadges();
  }
  function paintBadges() {
    $('badges').innerHTML = Object.entries(BADGES).map(([id, [e, n]]) => `<span class="${badges.includes(id) ? 'on' : ''}" title="${n}">${e} ${n}</span>`).join('');
  }
  function pop(el) { el.classList.remove('ci-pop'); void el.offsetWidth; el.classList.add('ci-pop'); }

  const ITEMS = [
    ['☕', 'cups of fancy coffee', 5], ['🍕', 'large pizzas', 18], ['🎬', 'cinema tickets', 12], ['📚', 'paperback books', 15], ['🎮', 'new video games', 70],
    ['👟', 'pairs of good trainers', 120], ['📱', 'new smartphones', 1000], ['💻', 'laptops', 1200], ['🚲', 'nice bicycles', 800], ['✈️', 'round-the-world trips', 5000],
    ['🚗', 'new family cars', 35000], ['🎓', 'years of private university', 60000], ['🏠', 'typical US homes', 410000], ['🦄', 'years of a $60k salary', 60000], ['🏝️', 'small private islands', 5000000]
  ];
  function buy(total) {
    const show = ITEMS.slice().sort((a, b) => a[2] - b[2]).filter(([, , p]) => total / p >= 1).slice(-6);
    if (!show.length) { $('buy').innerHTML = '<div class="ci-buy-none">Not quite enough for a coffee yet. Slide something up!</div>'; return; }
    $('buy').innerHTML = show.map(([e, n, p]) => {
      const q = total / p;
      const icons = Math.min(30, Math.floor(q));
      return `<div class="ci-item"><div class="ci-icons" aria-hidden="true">${e.repeat(Math.max(1, icons))}${q > 30 ? '<em>+</em>' : ''}</div><b>${q >= 100 ? C(Math.floor(q)) : q.toFixed(q < 10 ? 1 : 0)}</b><span>${n}</span><small>at about ${money(p)} each</small></div>`;
    }).join('');
  }
  const C = (n) => Math.round(n).toLocaleString('en-US');
  function live(total) {
    const r = Math.max(0, vals.r - vals.f) / 100;
    const yearly = total * 0.04;
    const i = r / 12, n = 30 * 12;
    const draw = i > 0 ? total * i / (1 - Math.pow(1 + i, -n)) : total / n;
    const months = total > 0 ? Math.floor(total / 3000) : 0;
    $('live').innerHTML = `<div class="ci-live-grid">
      <div><span class="e">🌳</span><b>${money(yearly / 12)}/month</b><small>Forever-ish, using the 4% rule: take out 4% of the pot each year and it has historically tended to last 30 years or more.</small></div>
      <div><span class="e">🏖️</span><b>${money(draw)}/month</b><small>If you spend it all over 30 years, while the rest keeps earning ${(r * 100).toFixed(1)}%.</small></div>
      <div><span class="e">🧾</span><b>${months >= 12 ? `${(months / 12).toFixed(1)} years` : `${months} months`}</b><small>How long it would cover $3,000 a month of bills if it earned nothing at all.</small></div>
    </div>`;
  }
  function goal() {
    const G = +$('gAmt').value, Y = +$('gYrs').value;
    const r = (vals.r - vals.f) / 100 / 12, n = Y * 12;
    const grow = vals.P * Math.pow(1 + r, n);
    const need = G <= grow ? 0 : r > 0 ? (G - grow) * r / (Math.pow(1 + r, n) - 1) : (G - vals.P) / n;
    const put = vals.P + need * n;
    $('goalOut').innerHTML = need <= 0 ? `<b>You're already there.</b> Your ${money(vals.P)} start grows past ${money(G)} on its own in ${Y} years at ${(vals.r - vals.f).toFixed(1)}%.` : `<div class="ci-goal-big">${money(need)}<small>a month</small></div><p>Starting with ${money(vals.P)} at ${(vals.r - vals.f).toFixed(1)}% after fees. You'd put in ${money(put)} and interest would add the other <b>${money(G - put)}</b>${G - put > put ? ', which is more than you saved' : ''}.</p><button class="c-btn c-btn--ghost" id="useGoal" type="button">Use this plan</button>`;
    const u = $('useGoal');
    if (u) u.addEventListener('click', () => { $('monthly').value = Math.min(+$('monthly').max, Math.round(need / 25) * 25); $('years').value = Y; compute(); award('goal'); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }
  function fees() {
    const levels = [0, vals.f, 1, 2].filter((v, k, a) => a.indexOf(v) === k).sort((a, b) => a - b);
    const res = levels.map((f) => { const s2 = simulate(vals.P, vals.C, vals.r, vals.Y, f); return [f, s2.bal[s2.n]]; });
    const max = Math.max(...res.map((x) => x[1])) || 1;
    const lost = res[0][1] - (res.find((x) => x[0] === vals.f) || res[0])[1];
    $('fees').innerHTML = `<p>A fee looks tiny because it is a percentage. But it is taken every year from the whole pot, so it compounds against you. Over ${vals.Y} years:</p>` +
      res.map(([f, v]) => `<div class="ci-fee${f === vals.f ? ' me' : ''}"><span>${f.toFixed(2)}% fee${f === vals.f ? ' (yours)' : ''}</span><div class="ci-fee-bar"><i style="width:${(v / max * 100).toFixed(1)}%"></i></div><b>${short(deflate(v, vals.Y * 12))}</b></div>`).join('') +
      `<p class="ci-fee-sum">${vals.f > 0 ? `Your ${vals.f.toFixed(2)}% fee eats <b>${money(deflate(lost, vals.Y * 12))}</b>, about ${Math.round(lost / res[0][1] * 100)}% of what you'd have with no fees.` : 'No fees at all. The fee monster goes hungry.'}</p>`;
  }
  function table() {
    let h = '';
    for (let y = 1; y <= vals.Y; y++) {
      const m = y * 12;
      h += `<tr><td>${y}</td><td>${money(deflate(sim.con[m], m))}</td><td>${money(deflate(sim.yInt[y - 1] || 0, m))}</td><td>${money(deflate(sim.bal[m], m))}</td></tr>`;
    }
    $('ytable').innerHTML = h;
  }
  function pills(total) {
    const p = [];
    const r = vals.r - vals.f;
    if (r > 0) p.push(`🔁 Doubles every ${(Math.log(2) / Math.log(1 + r / 100)).toFixed(1)} years`);
    p.push(`🌳 ${money(total * 0.04 / 12)}/month at 4%`);
    if (pinned) {
      const g = simulate(pinned.start, pinned.monthly, pinned.rate, vals.Y, pinned.fee || 0);
      const d = deflate(sim.bal[sim.n] - g.bal[g.n], sim.n);
      p.push(`📌 ${d >= 0 ? '+' : '-'}${money(Math.abs(d))} vs pinned`);
    }
    $('pills').innerHTML = p.map((x) => `<span>${x}</span>`).join('');
  }
  function extras(total) { buy(total); live(total); goal(); fees(); table(); pills(total); }
  $('gAmt').addEventListener('change', goal);
  $('gYrs').addEventListener('change', goal);
  function paintPin() {
    $('pin').textContent = pinned ? '✖ Unpin plan' : '📌 Pin this plan to compare';
    $('pinNote').textContent = pinned ? `Pinned: ${money(pinned.start)} + ${money(pinned.monthly)}/mo at ${pinned.rate}%` : '';
    $('pinLegend').hidden = !pinned;
  }
  $('pin').addEventListener('click', () => {
    if (pinned) pinned = null;
    else { pinned = { start: vals.P, monthly: vals.C, rate: vals.r, fee: vals.f }; award('comparer'); Curio.toast('Pinned! Now change the sliders to compare.'); }
    Curio.store.set('ci:pin', pinned);
    paintPin();
    compute();
    Curio.beep(620, 0.06, 'triangle', 0.06);
  });
  const FACTS = [
    ['🏛️', 'Ben Franklin\'s 200-year gift', 'In his will, Benjamin Franklin left 1,000 pounds each to Boston and Philadelphia to be lent out and left to grow for 200 years. By 1990 the funds had grown to millions of dollars.'],
    ['♟️', 'Rice on a chessboard', 'Put 1 grain on the first square and double it on each square. The last square alone holds over 9 quintillion grains, far more rice than the world grows in a year.'],
    ['👴', 'Warren Buffett\'s late bloom', 'Buffett started investing as a child, but the vast majority of his fortune arrived after his 60th birthday. Time did most of the heavy lifting.'],
    ['📄', 'Fold a sheet of paper', 'Fold paper in half 42 times and, in theory, it would be thick enough to reach the Moon. Doubling gets out of hand fast.'],
    ['🦠', 'Bacteria in a jar', 'If bacteria double every minute and fill a jar at noon, the jar was only half full at 11:59. Exponential growth always looks slow until suddenly it does not.'],
    ['💳', 'It works backwards too', 'Credit card debt at 25% a year doubles in about three years if you pay nothing. Compounding does not care whose side it is on.'],
    ['🏝️', 'The Manhattan story', 'Legend says Manhattan was bought in 1626 for goods worth about 24 dollars. Invested at 7% a year, 24 dollars would now be worth trillions.'],
    ['📏', 'Rule of 72 vs 70', 'Some people use 70 or 69.3 instead of 72. 72 is popular because it divides neatly by 2, 3, 4, 6, 8, 9 and 12.']
  ];
  $('facts').innerHTML = FACTS.map(([e, t, d]) => `<div class="ci-fact"><span class="e">${e}</span><b>${t}</b><p>${d}</p></div>`).join('');
  $('share').addEventListener('click', async () => {
    const t = `💰 Saving ${money(vals.C)} a month from ${money(vals.P)} at ${vals.r}% for ${vals.Y} years grows to ${$('total').textContent}. Get Rich Slowly on Zoble.`;
    try { await navigator.clipboard.writeText(t); Curio.toast('Copied!'); } catch (e) { Curio.toast(t, 4000); }
  });
  let growRaf = 0;
  function grow() {
    cancelAnimationFrame(growRaf);
    const target = Curio.simple ? 40 : Math.max(10, +$('years').value);
    const t0 = performance.now(), dur = 5200;
    $('grow').textContent = '⏳ Growing...';
    let last = -1;
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const y = Math.max(1, Math.round(1 + (target - 1) * p * p));
      if (y !== last) { last = y; $('years').value = y; $('years').dispatchEvent(new Event('input')); if (y % 5 === 0) Curio.beep(330 + y * 14, 0.06, 'triangle', 0.05); }
      if (p < 1) growRaf = requestAnimationFrame(step);
      else { $('grow').textContent = '▶ Watch it grow again'; Curio.beep(1046, 0.25, 'triangle', 0.07); if (Curio.simple) Curio.confetti(60); }
    };
    growRaf = requestAnimationFrame(step);
  }
  $('grow').addEventListener('click', grow);
  ['pointerdown', 'keydown'].forEach((ev) => $('years').addEventListener(ev, () => cancelAnimationFrame(growRaf)));
  if (Curio.simple) $('sub').textContent = 'Put a little away every month and let it snowball. Pick how much and how long, then press Watch it grow.';
  paintBadges();
  paintPin();
  compute();
})();
