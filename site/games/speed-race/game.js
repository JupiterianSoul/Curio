(function () {
  let customs = Curio.store.get('speed-race:me:v1', []);
  if (!Array.isArray(customs)) customs = [];
  customs = customs.filter((c) => c && typeof c.v === 'number' && c.v > 0 && typeof c.name === 'string').slice(0, 3);
  let ALL, byId;
  function refreshAll() {
    ALL = window.SPEEDS.concat(customs.map((c, i) => ({ id: `me${i}`, e: c.e || '🏃', name: c.name, v: c.v, me: true, fact: `${c.name}, added by you. Real-life speeds below are worked out from ${Curio.fmt(c.v, c.v < 10 ? 1 : 0)} km/h.` }))).sort((a, b) => a.v - b.v);
    byId = Object.fromEntries(ALL.map((x) => [x.id, x]));
  }
  refreshAll();
  const COLORS = ['#ff5a36', '#2e8bff', '#1f9d55', '#a259ff', '#e6a100', '#e84393'];
  const DISTS = [
    { k: 0.1, n: '100 m sprint' }, { k: 42.195, n: 'Marathon' }, { k: 5570, n: 'London to New York' },
    { k: 40075, n: 'Around the Earth' }, { k: 384400, n: 'To the Moon' }, { k: 54.6e6, n: 'To Mars (closest)' }, { k: 149.6e6, n: 'To the Sun' }, { k: 4.495e9, n: 'To Neptune' }, { k: 2.5e10, n: 'To Voyager 1' }, { k: 4.0175e13, n: 'To the nearest star' }
  ];
  const $ = (id) => document.getElementById(id);
  const MAX = 6;
  let picked = Curio.store.get('speed-race:picked', ['walk', 'bolt', 'cheetah', 'f1', 'airliner']).filter((id) => byId[id]).slice(0, MAX);
  let mode = 'lin';
  let distIdx = 0;
  let focusId = picked[picked.length - 1] || 'cheetah';
  let race = null;

  $('dist').innerHTML = DISTS.map((d, i) => `<option value="${i}">🏁 ${d.n}</option>`).join('');

  function fmtSpeed(v) {
    if (v >= 1e6) return `${Curio.fmt(v / 1e6, v >= 1e8 ? 0 : 2)} million km/h`;
    if (v >= 100) return `${Curio.fmt(v)} km/h`;
    if (v >= 1) return `${Curio.fmt(v, 1)} km/h`;
    return `${Number(v.toPrecision(2))} km/h`;
  }
  function fmtDur(sec) {
    if (!isFinite(sec)) return 'forever';
    if (sec < 1e-3) return `${Curio.fmt(sec * 1e6, 1)} µs`;
    if (sec < 1) return `${Curio.fmt(sec * 1000, 1)} ms`;
    if (sec < 60) return `${Curio.fmt(sec, sec < 10 ? 2 : 1)} s`;
    if (sec < 3600) return `${Curio.fmt(sec / 60, 1)} min`;
    if (sec < 86400 * 2) return `${Curio.fmt(sec / 3600, 1)} hours`;
    if (sec < 86400 * 365.25 * 2) return `${Curio.fmt(sec / 86400, 0)} days`;
    const y = sec / (86400 * 365.25);
    if (y < 1e6) return `${Curio.fmt(y, 0)} years`;
    if (y < 1e9) return `${Curio.fmt(y / 1e6, 1)} million years`;
    return `${Curio.fmt(y / 1e9, 1)} billion years`;
  }
  const realTime = (v, km) => (km / v) * 3600;
  const lcol = (id) => COLORS[picked.indexOf(id) % COLORS.length];

  function raceDurations() {
    const vs = picked.map((id) => byId[id].v);
    const vmax = Math.max(...vs);
    return picked.map((id) => {
      const v = byId[id].v;
      if (mode === 'lin') return 4 * vmax / v;
      return 3 * (1 + 0.42 * (Math.log10(vmax) - Math.log10(v)));
    });
  }

  function renderLanes() {
    const L = $('lanes');
    if (!picked.length) {
      L.innerHTML = '<div class="empty">No racers yet. Pick some from the list below 👇</div>';
    } else {
      L.innerHTML = picked.map((id) => {
        const x = byId[id];
        const cls = x.flip ? 'flip' : x.tilt ? 'tilt' : '';
        return `<div class="lane" data-id="${id}" style="--lc:${lcol(id)}">
          <div class="who"><button class="x" type="button" aria-label="Remove ${x.name}">✕</button><div style="min-width:0"><b>${x.name}</b><small>${fmtSpeed(x.v)}</small></div></div>
          <div class="track" role="img" aria-label="${x.name} lane"><div class="trail"></div><div class="runner"><span class="${cls}">${x.e}</span></div></div>
          <div class="res"><span>ready</span><em></em></div>
        </div>`;
      }).join('');
    }
    $('go').disabled = picked.length < 1;
    updateNote();
    setPositions(new Array(picked.length).fill(0));
  }

  function updateNote() {
    const n = $('note');
    if (!picked.length) { n.textContent = ''; return; }
    const vs = picked.map((id) => byId[id].v);
    const r = Math.max(...vs) / Math.min(...vs);
    n.textContent = mode === 'lin'
      ? (r > 1.01 ? `True scale: the fastest racer here is ${r >= 1e4 ? Curio.fmt(r, 0) : Curio.fmt(r, r < 10 ? 1 : 0)} times faster than the slowest. Everyone moves at their real relative speed.` : 'True scale: every racer moves at their real relative speed.')
      : 'Log scale: every 10x jump in speed counts the same, so a snail and a beam of light can share one track.';
  }

  function setPositions(ps) {
    const lanes = $('lanes').querySelectorAll('.lane');
    lanes.forEach((ln, i) => {
      const track = ln.querySelector('.track');
      const w = track.clientWidth - 40;
      const p = Math.max(0, Math.min(1, ps[i] || 0));
      ln.querySelector('.runner').style.transform = `translate(${p * w}px, -50%)`;
      ln.querySelector('.trail').style.width = `${p * w + 10}px`;
    });
  }

  function renderRoster() {
    $('roster').innerHTML = ALL.map((x) => {
      const on = picked.includes(x.id);
      return `<button type="button" class="pick" data-id="${x.id}" aria-pressed="${on}" style="--lc:${on ? lcol(x.id) : 'var(--accent)'}"><span class="em">${x.e}</span><b>${x.name}</b><small>${fmtSpeed(x.v)}</small></button>`;
    }).join('');
    $('count').textContent = `${picked.length} of ${MAX} lanes filled · ${ALL.length} racers`;
  }

  function renderInfo(id) {
    const x = byId[id];
    if (!x) return;
    const ms = x.v / 3.6, mph = x.v / 1.609344;
    $('info').classList.remove('in'); void $('info').offsetWidth; $('info').classList.add('in');
    const walk = x.v / 5, snail = x.v / byId.snail.v, light = byId.light.v / x.v;
    const comps = [];
    if (id !== 'walk') comps.push(x.v > 5 ? `<b>${walk >= 1e4 ? Curio.fmt(walk, 0) : Curio.fmt(walk, walk < 10 ? 1 : 0)}x</b> faster than walking` : `<b>${Curio.fmt(1 / walk, 1 / walk < 10 ? 1 : 0)}x</b> slower than walking`);
    if (id !== 'snail' && x.v > byId.snail.v) comps.push(`<b>${Curio.fmt(snail, 0)}x</b> faster than a garden snail`);
    comps.push(`100 m sprint in <b>${fmtDur(realTime(x.v, 0.1))}</b>`);
    comps.push(`Around the Earth in <b>${fmtDur(realTime(x.v, 40075))}</b>`);
    comps.push(`To the Moon in <b>${fmtDur(realTime(x.v, 384400))}</b>`);
    if (id !== 'light') comps.push(`Light is <b>${light >= 1e6 ? Curio.fmt(light / 1e6, 1) + ' million' : Curio.fmt(light, 0)}x</b> faster`);
    $('info').innerHTML = `<div class="big" aria-hidden="true">${x.e}</div>
      <h2>${x.name}</h2>
      <div class="units"><span>${fmtSpeed(x.v)}</span><span>${mph >= 1e6 ? Curio.fmt(mph / 1e6, 1) + ' million' : mph < 1 ? Number(mph.toPrecision(2)) : Curio.fmt(mph, mph < 10 ? 1 : 0)} mph</span><span>${ms >= 1e6 ? Curio.fmt(ms / 1e3, 0) + ' km/s' : (ms < 1 ? Number(ms.toPrecision(2)) : Curio.fmt(ms, ms < 10 ? 1 : 0)) + ' m/s'}</span></div>
      <p>${x.fact}</p><ul>${comps.map((c) => `<li>${c}</li>`).join('')}</ul>`;
  }

  function save() { Curio.store.set('speed-race:picked', picked); }

  function toggle(id) {
    stopRace(true);
    focusId = id;
    if (picked.includes(id)) picked = picked.filter((p) => p !== id);
    else if (picked.length >= MAX) { Curio.toast('Six lanes max. Remove someone first.'); renderInfo(id); return; }
    else picked.push(id);
    Curio.beep(picked.includes(id) ? 660 : 330, 0.07, 'triangle', 0.07);
    save(); renderLanes(); renderRoster(); renderInfo(id);
  }

  $('roster').addEventListener('click', (e) => { const b = e.target.closest('.pick'); if (b) toggle(b.dataset.id); });
  $('lanes').addEventListener('click', (e) => {
    const ln = e.target.closest('.lane'); if (!ln) return;
    if (e.target.closest('.x')) toggle(ln.dataset.id);
    else { focusId = ln.dataset.id; renderInfo(focusId); }
  });

  function setMode(m) {
    mode = m;
    $('lin').setAttribute('aria-pressed', String(m === 'lin'));
    $('log').setAttribute('aria-pressed', String(m === 'log'));
    stopRace(true); updateNote();
    Curio.beep(m === 'lin' ? 520 : 780, 0.06, 'sine', 0.06);
  }
  $('lin').addEventListener('click', () => setMode('lin'));
  $('log').addEventListener('click', () => setMode('log'));
  $('dist').addEventListener('change', () => { distIdx = Number($('dist').value); theme(); if (!race) showReal(); Curio.store.set('speed-race:dist', distIdx); });

  function showReal() {
    const lanes = $('lanes').querySelectorAll('.lane');
    const D = DISTS[distIdx];
    lanes.forEach((ln, i) => {
      const x = byId[picked[i]];
      ln.querySelector('.res').innerHTML = `<span>${fmtDur(realTime(x.v, D.k))}</span><em>in real life</em>`;
      ln.querySelector('.res').classList.remove('win');
    });
  }

  function stopRace(reset) {
    if (race) cancelAnimationFrame(race.raf);
    race = null;
    $('go').textContent = '🏁 Race!';
    if (reset) { setPositions([]); $('clock').textContent = '0.0 s'; showReal(); }
  }

  function startRace() {
    if (!picked.length) return;
    stopRace(true);
    const durs = raceDurations();
    const order = [];
    const limit = Math.min(Math.max(...durs), 14);
    race = { t0: 0, durs, order, limit, raf: 0, finished: new Set() };
    $('go').textContent = '⏹ Stop';
    $('lanes').querySelectorAll('.res').forEach((r) => { r.innerHTML = '<span>…</span><em></em>'; r.classList.remove('win'); });
    $('podium').hidden = true;
    countdown();
    const go = () => {
      if (!race) return;
      race.t0 = performance.now();
      const tick = (now) => {
        if (!race) return;
        const t = (now - race.t0) / 1000;
        $('clock').textContent = `${Curio.fmt(t, 1)} s`;
        const ps = durs.map((d) => t / d);
        setPositions(ps);
        const lanes = $('lanes').querySelectorAll('.lane');
        durs.forEach((d, i) => {
          if (t >= d && !race.finished.has(i)) {
            race.finished.add(i);
            order.push(i);
            const res = lanes[i].querySelector('.res');
            const place = order.length;
            res.innerHTML = `<span>${place === 1 ? '🥇' : place === 2 ? '🥈' : place === 3 ? '🥉' : '#' + place} ${Curio.fmt(d, 2)} s</span><em>${place === 1 ? 'winner!' : 'finished'}</em>`;
            if (place === 1) res.classList.add('win');
            lanes[i].querySelector('.runner').classList.add('done');
            Curio.beep(880 - place * 90, 0.12, 'triangle', 0.07);
            puff(lanes[i]);
            if (place === 1) buzz(25);
          }
        });
        if (t >= limit) { finish(); return; }
        race.raf = requestAnimationFrame(tick);
      };
      race.raf = requestAnimationFrame(tick);
    };
    setTimeout(go, 1500);
  }

  function finish() {
    const { durs, order } = race;
    const lanes = $('lanes').querySelectorAll('.lane');
    const D = DISTS[distIdx];
    const left = [];
    durs.forEach((d, i) => {
      if (!race.finished.has(i)) {
        const res = lanes[i].querySelector('.res');
        res.innerHTML = `<span>${Curio.fmt(Math.max(0.0001, 100 * race.limit / d), d / race.limit > 1e4 ? 4 : 1)}%</span><em>needs ${fmtDur(d)}</em>`;
        left.push(i);
      }
    });
    const winner = byId[picked[order[0]]];
    podium(order, durs, left);
    afterRace(order, left);
    race = null;
    $('go').textContent = '🏁 Race again';
    if (picked.length > 1) {
      Curio.confetti(80);
      const slow = left.length ? byId[picked[left[left.length - 1]]] : null;
      const msg = slow ? `${winner.e} ${winner.name} wins! ${slow.name} would need ${fmtDur(durs[left[left.length - 1]])} to finish this race.` : `${winner.e} ${winner.name} wins!`;
      Curio.toast(msg, 3600);
    }
    setTimeout(() => {
      lanes.forEach((ln, i) => {
        const r = ln.querySelector('.res');
        const x = byId[picked[i]];
        r.title = `${x.name}: ${fmtDur(realTime(x.v, D.k))} in real life (${D.n})`;
      });
    }, 10);
  }

  $('go').addEventListener('click', () => { if (race) { stopRace(true); } else startRace(); });
  $('rand').addEventListener('click', () => {
    stopRace(true);
    const n = Curio.randInt(3, MAX);
    const pool = Curio.shuffle(ALL.map((x) => x.id));
    const slowish = Curio.pick(ALL.slice(0, 10)).id;
    picked = [slowish, ...pool.filter((p) => p !== slowish).slice(0, n - 1)].sort((a, b) => byId[a].v - byId[b].v);
    focusId = picked[picked.length - 1];
    save(); renderLanes(); renderRoster(); renderInfo(focusId); showReal();
    Curio.beep(500, 0.06, 'triangle', 0.06);
  });
  addEventListener('resize', () => { if (!race) setPositions([]); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && race) stopRace(true); });
  addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape') { closePanels(); return; }
    if (openPanel) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
    if (e.key === ' ' && tag !== 'button') { e.preventDefault(); $('go').click(); }
    else if (e.key.toLowerCase() === 'r') $('rand').click();
    else if (e.key.toLowerCase() === 'o') openOrder();
    else if (e.key.toLowerCase() === 'l') setMode(mode === 'lin' ? 'log' : 'lin');
  });

  function buzz(ms) { try { if (!Curio.muted && navigator.vibrate) navigator.vibrate(ms); } catch (x) {} }
  const THEMES = ['track', 'road', 'sea', 'globe', 'space', 'space', 'sun', 'deep', 'deep', 'stars'];
  function theme() {
    const st = $('stage');
    THEMES.forEach((t) => st.classList.remove(`th-${t}`));
    st.classList.add(`th-${THEMES[distIdx] || 'track'}`);
  }
  function countdown() {
    const c = $('count3');
    c.classList.add('on');
    const lights = c.querySelectorAll('.lights i');
    lights.forEach((l) => l.className = '');
    $('countTxt').textContent = '';
    [0, 1, 2].forEach((i) => setTimeout(() => {
      if (!race) { c.classList.remove('on'); return; }
      lights[i].className = 'red';
      $('countTxt').textContent = String(3 - i);
      Curio.beep(392, 0.12, 'square', 0.05);
    }, i * 400));
    setTimeout(() => {
      if (!race) { c.classList.remove('on'); return; }
      lights.forEach((l) => l.className = 'green');
      $('countTxt').textContent = 'GO!';
      Curio.beep(784, 0.3, 'square', 0.06);
      buzz(40);
      setTimeout(() => c.classList.remove('on'), 500);
    }, 1200);
  }
  function puff(lane) {
    const tr = lane.querySelector('.track');
    for (let k = 0; k < 8; k++) {
      const p = document.createElement('i');
      p.className = 'spark';
      p.style.setProperty('--dx', `${(Math.random() - .5) * 60}px`);
      p.style.setProperty('--dy', `${(Math.random() - .5) * 40}px`);
      p.style.background = ['#ffc233', '#ff5a36', '#2e8bff', '#1f9d55'][k % 4];
      tr.append(p);
      setTimeout(() => p.remove(), 700);
    }
  }
  function podium(order, durs, left) {
    if (picked.length < 2) { $('podium').hidden = true; return; }
    const D = DISTS[distIdx];
    const top = order.slice(0, 3).map((i) => byId[picked[i]]);
    const steps = [1, 0, 2].filter((k) => top[k]);
    const H = [120, 86, 64];
    const slow = left.length ? byId[picked[left[left.length - 1]]] : byId[picked[order[order.length - 1]]];
    const fast = top[0];
    const ratio = fast.v / slow.v;
    const box = $('podium');
    box.innerHTML = `<div class="pod">${steps.map((k) => `<div class="step s${k + 1}" style="--h:${H[k]}px"><span class="pe ${top[k].flip ? 'flip' : ''}">${top[k].e}</span><div class="blk"><b>${k + 1}</b></div><small>${top[k].name.replace(/</g, '')}</small></div>`).join('')}</div>
      <div class="podTxt"><h3>${fast.e} ${fast.name.replace(/</g, '')} wins the ${D.n.toLowerCase()}</h3>
      <p>In real life: <b>${fmtDur(realTime(fast.v, D.k))}</b>. ${slow !== fast ? `${slow.name.replace(/</g, '')} would need <b>${fmtDur(realTime(slow.v, D.k))}</b>, ${ratio >= 1e4 ? Curio.fmt(ratio, 0) : Curio.fmt(ratio, ratio < 10 ? 1 : 0)} times longer.` : ''}</p>
      <div class="c-row"><button class="c-btn c-btn--ghost" type="button" id="podShare">📋 Copy result</button></div></div>`;
    box.hidden = false;
    box.classList.remove('in'); void box.offsetWidth; box.classList.add('in');
    $('podShare').addEventListener('click', async () => {
      const txt = `How Fast? · ${D.n}\n${order.map((i, n) => `${['🥇', '🥈', '🥉'][n] || `#${n + 1}`} ${byId[picked[i]].e} ${byId[picked[i]].name}`).join('\n')}${left.map((i) => `\n🐌 ${byId[picked[i]].e} ${byId[picked[i]].name}: still going`).join('')}`;
      try { await navigator.clipboard.writeText(txt); Curio.toast('Copied! 📋'); } catch (x) { Curio.toast('Could not copy, sorry'); }
    });
  }

  const BADGES = [
    { id: 'first', e: '🏁', name: 'Green flag', d: 'Run your first race' },
    { id: 'ten', e: '🏎️', name: 'Pit regular', d: 'Run 10 races' },
    { id: 'mismatch', e: '🐌', name: 'Hopeless', d: 'Race light against something slower than a snail' },
    { id: 'star', e: '✨', name: 'Interstellar', d: 'Race to the nearest star' },
    { id: 'me', e: '🏃', name: 'In the race', d: 'Add yourself as a racer' },
    { id: 'beatme', e: '🥇', name: 'Personal podium', d: 'Win a race with your own racer' },
    { id: 'order', e: '🧩', name: 'In order', d: 'Solve a slowest to fastest puzzle perfectly' },
    { id: 'daily', e: '📅', name: 'Daily racer', d: 'Play the daily puzzle' }
  ];
  const BKEY = 'speed-race:badges:v1';
  let badges = Curio.store.get(BKEY, {});
  if (!badges || typeof badges !== 'object') badges = {};
  function award(id) {
    if (badges[id]) return;
    const b = BADGES.find((x) => x.id === id); if (!b) return;
    badges[id] = Date.now(); Curio.store.set(BKEY, badges); paintBadges();
    setTimeout(() => Curio.toast(`${b.e} Badge: ${b.name}`, 2400), 900);
    [784, 988, 1318].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.14, 'triangle', 0.06), 900 + i * 90));
  }
  function paintBadges() { $('badgeCount').textContent = `${BADGES.filter((b) => badges[b.id]).length}/${BADGES.length}`; }
  $('badgesBtn').addEventListener('click', () => {
    const box = document.createElement('div'); box.className = 'badgeList';
    BADGES.forEach((b) => { const d = document.createElement('div'); if (!badges[b.id]) d.className = 'off'; d.innerHTML = `<i>${b.e}</i><div><b></b><span></span></div>`; d.querySelector('b').textContent = b.name; d.querySelector('span').textContent = b.d; box.append(d); });
    Curio.modal({ emoji: '🏅', title: 'Badges', body: box, buttons: [{ label: 'Close', value: 0 }] });
  });
  paintBadges();
  function afterRace(order, left) {
    const n = (Curio.store.get('speed-race:races', 0) || 0) + 1;
    Curio.store.set('speed-race:races', n);
    award('first');
    if (n >= 10) award('ten');
    if (picked.includes('light') && picked.some((id) => byId[id].v < byId.snail.v)) award('mismatch');
    if (distIdx === DISTS.length - 1) award('star');
    if (picked.length > 1 && byId[picked[order[0]]].me) award('beatme');
  }

  let openPanel = null;
  function showPanel(id) {
    closePanels(); stopRace(true);
    openPanel = $(id); openPanel.hidden = false;
    document.body.style.overflow = 'hidden';
    openPanel.scrollTop = 0;
    openPanel.querySelector('.panel__x').focus();
    Curio.beep(330, 0.15, 'sine', 0.05); setTimeout(() => Curio.beep(660, 0.12, 'sine', 0.04), 70);
  }
  function closePanels() { document.querySelectorAll('.panel').forEach((p) => { p.hidden = true; }); openPanel = null; document.body.style.overflow = ''; }
  document.querySelectorAll('.panel').forEach((p) => p.addEventListener('click', (e) => { if (e.target === p || e.target.closest('[data-close]')) closePanels(); }));

  function hashStr(str) { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const today = new Date();
  const dayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  $('dailyLabel').textContent = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  let oMode = 'classic';
  const O = { puzzles: [], p: 0, set: [], chosen: [], score: 0, log: [], on: false };
  document.querySelectorAll('#orderPanel .diff').forEach((b) => b.addEventListener('click', () => { if (O.on) return; oMode = b.dataset.d; document.querySelectorAll('#orderPanel .diff').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); oIdle(); Curio.beep(520, 0.06, 'sine', 0.05); }));
  function oIdle() {
    O.on = false;
    $('oSlots').innerHTML = ''; $('oPool').innerHTML = '';
    const b = Curio.getBest(`order-${oMode}`);
    $('oRound').textContent = ''; $('oScore').textContent = '';
    $('oMsg').textContent = b != null ? `Your best here: ${b} points` : 'Press start. Two racers are never too close to call.';
    $('oGo').hidden = false; $('oGo').textContent = 'Start'; $('oUndo').hidden = true; $('oShare').hidden = true;
  }
  function openOrder() { showPanel('orderPanel'); oIdle(); }
  $('openOrder').addEventListener('click', openOrder);
  function makePuzzles() {
    const r = oMode === 'daily' ? rng(hashStr(`sr-${dayKey}`)) : Math.random;
    const pool = window.SPEEDS.slice();
    const out = [];
    const n = oMode === 'daily' ? 1 : 5;
    let guard = 0;
    while (out.length < n && guard++ < 2000) {
      const set = [];
      let g2 = 0;
      while (set.length < 5 && g2++ < 500) {
        const c = pool[Math.floor(r() * pool.length)];
        if (set.some((s2) => s2 === c || Math.max(s2.v, c.v) / Math.min(s2.v, c.v) < 1.25)) continue;
        set.push(c);
      }
      if (set.length === 5) out.push(set);
    }
    return out;
  }
  $('oGo').addEventListener('click', () => {
    if (!O.on || O.p >= O.puzzles.length) { Object.assign(O, { puzzles: makePuzzles(), p: 0, score: 0, log: [], on: true }); }
    oPuzzle();
  });
  function oPuzzle() {
    O.set = O.puzzles[O.p].slice(); O.chosen = [];
    $('oGo').hidden = true; $('oShare').hidden = true; $('oUndo').hidden = false;
    $('oRound').textContent = oMode === 'daily' ? `Daily puzzle · ${dayKey}` : `Puzzle ${O.p + 1}/${O.puzzles.length}`;
    $('oScore').textContent = O.score;
    $('oMsg').textContent = 'Tap the slowest first.';
    paintOrder();
  }
  function paintOrder() {
    const slots = $('oSlots'); slots.innerHTML = '';
    for (let i = 0; i < 5; i++) {
      const x = O.chosen[i];
      const d = document.createElement('div');
      d.className = `oslot${x ? ' full' : ''}`;
      d.innerHTML = `<small>${i === 0 ? 'Slowest' : i === 4 ? 'Fastest' : i + 1}</small>${x ? `<span>${x.e}</span><b></b>` : '<span>?</span>'}`;
      if (x) d.querySelector('b').textContent = x.name;
      slots.append(d);
    }
    const pool = $('oPool'); pool.innerHTML = '';
    O.set.filter((x) => !O.chosen.includes(x)).forEach((x) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'ocard';
      b.innerHTML = '<span></span><b></b>';
      b.firstChild.textContent = x.e; b.lastChild.textContent = x.name;
      b.addEventListener('click', () => { O.chosen.push(x); Curio.beep(400 + O.chosen.length * 90, 0.06, 'triangle', 0.05); if (O.chosen.length === 5) checkOrder(); else paintOrder(); });
      pool.append(b);
    });
  }
  $('oUndo').addEventListener('click', () => { if (O.chosen.length && O.chosen.length < 5) { O.chosen.pop(); paintOrder(); Curio.beep(300, 0.05, 'sine', 0.05); } });
  function checkOrder() {
    paintOrder();
    const right = O.set.slice().sort((a, b) => a.v - b.v);
    let ok = 0;
    [...$('oSlots').children].forEach((d, i) => {
      const good = O.chosen[i] === right[i];
      if (good) ok++;
      d.classList.add(good ? 'good' : 'bad');
      const sp = document.createElement('em'); sp.textContent = fmtSpeed(O.chosen[i].v); d.append(sp);
    });
    const pts = ok * 20 + (ok === 5 ? 50 : 0);
    O.score += pts;
    O.log.push(ok === 5 ? '🟩' : ok >= 3 ? '🟨' : '🟥');
    $('oScore').textContent = O.score;
    $('oUndo').hidden = true;
    if (ok === 5) { award('order'); [660, 880, 1100].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.12, 'triangle', 0.07), i * 90)); buzz(30); }
    else { Curio.beep(200, 0.25, 'sawtooth', 0.05); buzz([30, 20, 30]); }
    $('oMsg').textContent = ok === 5 ? `Perfect! +${pts}` : `${ok} of 5 in the right spot. +${pts}. Right order: ${right.map((x) => x.e).join(' ')}`;
    O.p++;
    if (O.p >= O.puzzles.length) {
      const b = Curio.best(`order-${oMode}`, O.score);
      if (oMode === 'daily') award('daily');
      $('oMsg').textContent += ` · Final score ${O.score}${b.isNew ? ', a new best!' : ''}`;
      if (O.log.every((l) => l === '🟩')) Curio.confetti();
      $('oGo').hidden = false; $('oGo').textContent = 'Play again'; $('oShare').hidden = false; O.on = false;
    } else { $('oGo').hidden = false; $('oGo').textContent = 'Next puzzle ›'; }
  }
  $('oShare').addEventListener('click', async () => {
    const txt = `How Fast? · Slowest to fastest${oMode === 'daily' ? ` (daily ${dayKey})` : ''}\n${O.log.join('')} ${O.score} pts`;
    try { await navigator.clipboard.writeText(txt); Curio.toast('Copied! 📋'); } catch (x) { Curio.toast('Could not copy, sorry'); }
  });

  const EMOS = ['🏃', '🚴', '🛹', '⛸️', '🏊', '🧑‍🦽', '🐕', '🚗'];
  const PRESETS = [['Jogging', 10, '🏃'], ['Cycling', 20, '🚴'], ['Skateboard', 15, '🛹'], ['My dog', 30, '🐕'], ['My car', 50, '🚗']];
  let meEmo = EMOS[0];
  function paintMe() {
    $('meEmo').innerHTML = EMOS.map((e) => `<button type="button" aria-pressed="${e === meEmo}">${e}</button>`).join('');
    $('mePresets').innerHTML = PRESETS.map(([n, v, e]) => `<button type="button" data-n="${n}" data-v="${v}" data-e="${e}">${e} ${n} · ${v} km/h</button>`).join('');
    const v = Number($('meV').value) || 0;
    const near = ALL.filter((x) => !x.me).reduce((a, b) => Math.abs(Math.log(b.v / Math.max(v, 1e-9))) < Math.abs(Math.log(a.v / Math.max(v, 1e-9))) ? b : a);
    $('mePreview').textContent = v > 0 ? `${meEmo} ${Curio.fmt(v, v < 10 ? 1 : 0)} km/h is closest to ${near.e} ${near.name}. A 100 m sprint would take you ${fmtDur(realTime(v, 0.1))}.` : 'Enter a speed above zero.';
    $('meList').innerHTML = customs.length ? `<h3>Your racers</h3>${customs.map((c, i) => `<div><span>${c.e} ${c.name.replace(/</g, '')} · ${fmtSpeed(c.v)}</span><button type="button" class="c-btn c-btn--ghost" data-del="${i}">Remove</button></div>`).join('')}` : '';
  }
  $('meEmo').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; meEmo = b.textContent; paintMe(); Curio.beep(600, 0.05, 'sine', 0.05); });
  $('mePresets').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; $('meName').value = b.dataset.n; $('meV').value = b.dataset.v; meEmo = b.dataset.e; paintMe(); });
  $('meV').addEventListener('input', paintMe);
  $('meList').addEventListener('click', (e) => {
    const b = e.target.closest('[data-del]'); if (!b) return;
    const i = Number(b.dataset.del);
    customs.splice(i, 1);
    picked = picked.filter((id) => !id.startsWith('me'));
    saveMe();
  });
  function saveMe() {
    Curio.store.set('speed-race:me:v1', customs);
    refreshAll();
    picked = picked.filter((id) => byId[id]);
    save(); renderLanes(); renderRoster(); showReal(); paintMe();
  }
  $('meAdd').addEventListener('click', () => {
    const v = Number($('meV').value);
    const name = ($('meName').value || 'Me').trim().slice(0, 18) || 'Me';
    if (!(v > 0 && v <= 1e6)) { Curio.toast('Pick a speed between 0 and 1,000,000 km/h'); return; }
    if (customs.length >= 3) customs.shift();
    customs.push({ name, v, e: meEmo });
    saveMe();
    const id = `me${customs.length - 1}`;
    picked = picked.filter((p) => !p.startsWith('me') || byId[p]);
    if (!picked.includes(id)) { if (picked.length >= MAX) picked.shift(); picked.push(id); }
    save(); renderLanes(); renderRoster(); renderInfo(id); showReal();
    award('me');
    closePanels();
    Curio.toast(`${meEmo} ${name} joins the race!`);
    $('stage').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  $('openMe').addEventListener('click', () => { showPanel('mePanel'); paintMe(); });
  distIdx = Math.max(0, Math.min(DISTS.length - 1, Number(Curio.store.get('speed-race:dist', 0)) || 0));
  $('dist').value = String(distIdx);
  renderLanes(); renderRoster(); renderInfo(focusId); showReal(); theme();
})();

