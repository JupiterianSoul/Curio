(() => {
  const C = window.Curio, $ = (id) => document.getElementById(id);
  const watchEl = $('watch'), panel = $('panel');
  const CX = 200, CY = 262, TAU = Math.PI * 2;

  const MODES = [
    { v: 'classic', label: 'Classic', sub: '10 s' },
    { v: 'target', label: 'Pick', sub: 'any target' },
    { v: 'random', label: 'Random', sub: 'surprise' },
    { v: 'gauntlet', label: 'Gauntlet', sub: '5 blind' },
    { v: 'rhythm', label: 'Rhythm', sub: 'keep the beat' },
    { v: 'daily', label: 'Daily', sub: 'one target' }
  ];
  const TARGETS = [3000, 5000, 7500, 10000, 12345, 15000, 20000, 30000, 45000, 60000];
  const SKINS = {
    steel: { name: 'Steel', c: ['#f7f9fb', '#aeb8c2', '#59636e'], dial: ['#fffdf8', '#e9e3d6'], ink: '#26292d', soft: '#8b8f94', bez: '#2d3238', hand: '#e0352b' },
    brass: { name: 'Brass', c: ['#fff3c2', '#d6a93c', '#77510d'], dial: ['#fff9e8', '#f0dfb6'], ink: '#3b2a10', soft: '#9a8256', bez: '#3a2a0f', hand: '#1f3b73' },
    rose: { name: 'Rose', c: ['#ffe6dc', '#dc9e88', '#86493a'], dial: ['#fffaf7', '#f3e0d8'], ink: '#4a2a22', soft: '#a7847a', bez: '#4a2a22', hand: '#c2185b' },
    midnight: { name: 'Midnight', c: ['#6b7482', '#2c323b', '#0f1216'], dial: ['#1f2a38', '#0c121a'], ink: '#e9f0f7', soft: '#7f8b99', bez: '#090b0e', hand: '#ffb703' }
  };

  const settings = FX.load('settings', 1, { mode: 'classic', vis: 'visible', skin: 'steel', target: 10000, tick: false, bpm: 90 });
  const legacyMode = C.store.get('sc-mode', null);
  if (legacyMode && settings.mode === 'classic' && settings.vis === 'visible') settings.vis = { easy: 'visible', hard: 'fades', blind: 'blind' }[legacyMode] || 'visible';
  if (!MODES.some((m) => m.v === settings.mode)) settings.mode = 'classic';
  if (!['visible', 'fades', 'blind'].includes(settings.vis)) settings.vis = 'visible';
  if (!SKINS[settings.skin]) settings.skin = 'steel';
  if (!TARGETS.includes(settings.target)) settings.target = 10000;
  if (![60, 90, 120].includes(settings.bpm)) settings.bpm = 90;
  const saveSettings = () => FX.save('settings', 1, settings);

  const stats = FX.load('stats', 1, { total: 0, count: {}, hist: {}, best: {}, gBest: 0, daily: {}, skins: {} });
  const saveStats = () => FX.save('stats', 1, stats);

  const BADGES = FX.badges([
    { id: 'first', emoji: '⏱️', tier: 'bronze', name: 'First tick', desc: 'Stop the clock once' },
    { id: 'c100', emoji: '🎯', tier: 'bronze', name: 'Close call', desc: 'Within 100 ms of 10 s' },
    { id: 'c25', emoji: '🔥', tier: 'silver', name: 'Sharp', desc: 'Within 25 ms of 10 s' },
    { id: 'c5', emoji: '🏆', tier: 'gold', name: 'Human metronome', desc: 'Within 5 ms of 10 s' },
    { id: 'perfect', emoji: '🤯', tier: 'diamond', name: 'Atomic clock', desc: 'Exactly 0 ms off', secret: true },
    { id: 'fades', emoji: '🌫️', tier: 'silver', name: 'Through the fog', desc: 'Within 100 ms with Fading on' },
    { id: 'blind', emoji: '🙈', tier: 'gold', name: 'Inner clock', desc: 'Within 50 ms in Blind (target 5 s+)' },
    { id: 'long', emoji: '🐢', tier: 'gold', name: 'Long haul', desc: 'Within 300 ms on the 60 s target' },
    { id: 'short', emoji: '⚡', tier: 'silver', name: 'Quick draw', desc: 'Within 15 ms on the 3 s target' },
    { id: 'streak', emoji: '🔗', tier: 'gold', name: 'Consistency', desc: '5 attempts in a row within 1%' },
    { id: 'gaunt', emoji: '🛡️', tier: 'silver', name: 'Gauntlet runner', desc: 'Gauntlet total under 1500 ms' },
    { id: 'gaunt2', emoji: '👑', tier: 'gold', name: 'Gauntlet king', desc: 'Gauntlet total under 500 ms' },
    { id: 'rhythm', emoji: '🥁', tier: 'silver', name: 'In the pocket', desc: 'Rhythm within 40 ms' },
    { id: 'daily', emoji: '📅', tier: 'bronze', name: 'Daily dose', desc: 'Try a daily target' },
    { id: 'fifty', emoji: '🔁', tier: 'bronze', name: 'Clock watcher', desc: '50 attempts' },
    { id: 'twohundred', emoji: '⌛', tier: 'silver', name: 'Time lord', desc: '200 attempts', secret: true },
    { id: 'skins', emoji: '🎨', tier: 'bronze', name: 'Collector', desc: 'Use all four watches', secret: true }
  ]);

  let state = 'idle', t0 = 0, raf = 0, frostTimer = 0, tickTimer = 0, lastShown = 0, curRandom = 0, streak = 0;
  let gauntlet = null, rhythmTimers = [], beatIdx = -1;
  const daily = (() => { const r = FX.rng(FX.daySeed('t')); const t = Math.round((4000 + r() * 21000) / 10) * 10; return { target: t, vis: r() < 0.5 ? 'fades' : 'blind' }; })();

  const fmtS = (ms) => (ms / 1000).toFixed(3);
  const sign = (d) => (d === 0 ? '±0' : (d > 0 ? '+' : '-') + Math.abs(d));
  const rhythmTarget = () => Math.round(7 * 60000 / settings.bpm);
  function target() {
    switch (settings.mode) {
      case 'classic': return 10000;
      case 'target': return settings.target;
      case 'random': return curRandom || (curRandom = newRandom());
      case 'gauntlet': return gauntlet ? gauntlet.targets[gauntlet.i] : 10000;
      case 'rhythm': return rhythmTarget();
      case 'daily': return daily.target;
    }
    return 10000;
  }
  function vis() {
    if (settings.mode === 'gauntlet' || settings.mode === 'rhythm') return 'blind';
    if (settings.mode === 'daily') return daily.vis;
    return settings.vis;
  }
  function newRandom() { return Math.round((2000 + Math.random() * 28000) / 10) * 10; }
  function key() {
    const m = settings.mode;
    const mk = m === 'classic' ? '10' : m === 'target' ? 't' + settings.target : m === 'random' ? 'rand' : m === 'rhythm' ? 'r' + settings.bpm : m;
    return `${mk}:${vis()}`;
  }

  function buildWatch() {
    const s = SKINS[settings.skin];
    let ticks = '';
    for (let i = 0; i < 300; i++) {
      const a = i / 300 * TAU - Math.PI / 2, major = i % 25 === 0, sec = i % 5 === 0;
      const r1 = major ? 128 : sec ? 136 : 141, r2 = 147;
      ticks += `<line x1="${(CX + Math.cos(a) * r1).toFixed(1)}" y1="${(CY + Math.sin(a) * r1).toFixed(1)}" x2="${(CX + Math.cos(a) * r2).toFixed(1)}" y2="${(CY + Math.sin(a) * r2).toFixed(1)}" stroke="${major ? s.ink : s.soft}" stroke-width="${major ? 3.2 : sec ? 1.6 : 0.8}"/>`;
    }
    let nums = '';
    for (let i = 1; i <= 12; i++) {
      const a = i / 12 * TAU - Math.PI / 2;
      nums += `<text x="${(CX + Math.cos(a) * 112).toFixed(1)}" y="${(CY + Math.sin(a) * 112 + 7).toFixed(1)}" text-anchor="middle" font-size="19" font-weight="800" fill="${s.ink}" font-family="var(--font)">${i * 5}</text>`;
    }
    const sub = (x, label, n, id) => {
      let t = '';
      for (let i = 0; i < n; i++) { const a = i / n * TAU - Math.PI / 2; t += `<line x1="${(x + Math.cos(a) * 24).toFixed(1)}" y1="${(CY + Math.sin(a) * 24).toFixed(1)}" x2="${(x + Math.cos(a) * 29).toFixed(1)}" y2="${(CY + Math.sin(a) * 29).toFixed(1)}" stroke="${s.ink}" stroke-width="${i % (n / 2) === 0 ? 2 : 1}"/>`; }
      return `<g><circle cx="${x}" cy="${CY}" r="32" fill="rgba(0,0,0,.06)" stroke="${s.soft}" stroke-width="1"/>${t}<text x="${x}" y="${CY + 16}" text-anchor="middle" font-size="7.5" font-weight="900" fill="${s.soft}" letter-spacing="1">${label}</text>
        <g id="${id}"><line x1="${x}" y1="${CY + 5}" x2="${x}" y2="${CY - 25}" stroke="${s.hand}" stroke-width="2.4" stroke-linecap="round"/></g><circle cx="${x}" cy="${CY}" r="3.5" fill="${s.ink}"/></g>`;
    };
    watchEl.innerHTML = `<svg viewBox="0 0 400 450" aria-hidden="true">
      <defs>
        <linearGradient id="wCase" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${s.c[0]}"/><stop offset=".45" stop-color="${s.c[1]}"/><stop offset="1" stop-color="${s.c[2]}"/></linearGradient>
        <linearGradient id="wCase2" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.c[0]}"/><stop offset=".5" stop-color="${s.c[1]}"/><stop offset="1" stop-color="${s.c[2]}"/></linearGradient>
        <radialGradient id="wDial" cx=".5" cy=".38" r=".7"><stop offset="0" stop-color="${s.dial[0]}"/><stop offset="1" stop-color="${s.dial[1]}"/></radialGradient>
        <radialGradient id="wFrost" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#e3eef6"/><stop offset="1" stop-color="#bcd3e3"/></radialGradient>
        <linearGradient id="wGlass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
        <radialGradient id="wLid" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="${s.c[0]}"/><stop offset=".55" stop-color="${s.c[1]}"/><stop offset="1" stop-color="${s.c[2]}"/></radialGradient>
      </defs>
      <circle class="glow" cx="${CX}" cy="${CY}" r="186" fill="none" stroke="var(--accent)" stroke-width="6" opacity="0"/>
      <g class="crown">
        <circle cx="${CX}" cy="30" r="22" fill="none" stroke="url(#wCase)" stroke-width="9"/>
        <rect x="${CX - 21}" y="50" width="42" height="22" rx="6" fill="url(#wCase)" stroke="${s.c[2]}" stroke-width="1.5"/>
        ${Array.from({ length: 7 }, (_, i) => `<line x1="${CX - 15 + i * 5}" y1="53" x2="${CX - 15 + i * 5}" y2="69" stroke="${s.c[2]}" stroke-width="1.2" opacity=".6"/>`).join('')}
        <rect x="${CX - 9}" y="70" width="18" height="18" fill="url(#wCase2)"/>
      </g>
      <g transform="rotate(-42 ${CX} ${CY})"><rect x="${CX - 11}" y="${CY - 196}" width="22" height="20" rx="4" fill="url(#wCase)" stroke="${s.c[2]}"/></g>
      <g transform="rotate(42 ${CX} ${CY})"><rect x="${CX - 11}" y="${CY - 196}" width="22" height="20" rx="4" fill="url(#wCase)" stroke="${s.c[2]}"/></g>
      <circle cx="${CX}" cy="${CY}" r="180" fill="url(#wCase)"/>
      <circle cx="${CX}" cy="${CY}" r="171" fill="url(#wCase2)"/>
      <circle cx="${CX}" cy="${CY}" r="163" fill="${s.bez}"/>
      <circle cx="${CX}" cy="${CY}" r="152" fill="url(#wDial)"/>
      ${ticks}${nums}
      <text x="${CX}" y="${CY - 52}" text-anchor="middle" font-size="13" font-weight="900" letter-spacing="4" fill="${s.ink}">ZOBLE</text>
      <text x="${CX}" y="${CY - 38}" text-anchor="middle" font-size="7.5" font-weight="800" letter-spacing="2.5" fill="${s.soft}">CHRONOGRAPH</text>
      ${sub(CX - 66, 'MIN', 30, 'hMin')}${sub(CX + 66, '1/10 S', 10, 'hTen')}
      <rect class="lcdbg" x="${CX - 56}" y="${CY + 38}" width="112" height="36" rx="8" fill="#d9e4cf" stroke="${s.soft}" stroke-width="1.5"/>
      <text id="lcd" x="${CX}" y="${CY + 64}" text-anchor="middle" font-size="24" font-weight="800" fill="#24301e" font-family="var(--mono)">0.000</text>
      <g class="tmark" id="tmark"><path d="M${CX - 8} ${CY - 163} L${CX + 8} ${CY - 163} L${CX} ${CY - 147} Z" fill="${s.hand}"/><circle cx="${CX}" cy="${CY - 157}" r="2" fill="#fff"/></g>
      <g id="hMain"><path d="M${CX - 2.2} ${CY + 34} L${CX - 1.2} ${CY - 140} L${CX} ${CY - 146} L${CX + 1.2} ${CY - 140} L${CX + 2.2} ${CY + 34} Z" fill="${s.hand}"/><circle cx="${CX}" cy="${CY + 26}" r="7" fill="${s.hand}"/></g>
      <circle cx="${CX}" cy="${CY}" r="9" fill="${s.hand}"/><circle cx="${CX}" cy="${CY}" r="4" fill="${s.c[0]}"/>
      <g class="frost"><circle cx="${CX}" cy="${CY}" r="153" fill="url(#wFrost)"/>
        <path d="M120 200 l40 30 M260 180 l-30 40 M150 330 l50 -20 M250 320 l30 25 M190 160 l10 30" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>
        <text x="${CX}" y="${CY + 8}" text-anchor="middle" font-size="22" font-weight="900" fill="#7d9bb0">? ? ?</text></g>
      <path d="M${CX - 120} ${CY - 70} A150 150 0 0 1 ${CX + 110} ${CY - 100} A170 120 0 0 0 ${CX - 120} ${CY - 70} Z" fill="url(#wGlass)" pointer-events="none"/>
      <g class="lid"><circle cx="${CX}" cy="${CY}" r="172" fill="url(#wLid)" stroke="${s.c[2]}" stroke-width="3"/>
        <circle cx="${CX}" cy="${CY}" r="140" fill="none" stroke="${s.c[2]}" stroke-width="1.5" opacity=".5"/>
        <circle cx="${CX}" cy="${CY}" r="128" fill="none" stroke="${s.c[0]}" stroke-width="1" opacity=".7" stroke-dasharray="2 5"/>
        ${Array.from({ length: 24 }, (_, i) => { const a = i / 24 * TAU; return `<path d="M${(CX + Math.cos(a) * 60).toFixed(1)} ${(CY + Math.sin(a) * 60).toFixed(1)} Q${(CX + Math.cos(a + 0.2) * 100).toFixed(1)} ${(CY + Math.sin(a + 0.2) * 100).toFixed(1)} ${(CX + Math.cos(a) * 125).toFixed(1)} ${(CY + Math.sin(a) * 125).toFixed(1)}" fill="none" stroke="${s.c[2]}" stroke-width="1.2" opacity=".35"/>`; }).join('')}
        <circle cx="${CX}" cy="${CY}" r="46" fill="url(#wCase2)" stroke="${s.c[2]}" stroke-width="2"/>
        <text x="${CX}" y="${CY + 15}" text-anchor="middle" font-size="42" font-weight="900" fill="${s.c[2]}" font-family="Georgia, serif" font-style="italic">C</text></g>
    </svg>`;
    paintMarker();
    setHands(lastShown);
  }

  function paintMarker() {
    const t = target();
    const m = watchEl.querySelector('#tmark');
    if (m) m.style.transform = `rotate(${(t % 60000) / 60000 * 360}deg)`;
  }
  function setHands(ms) {
    lastShown = ms;
    const h = watchEl.querySelector('#hMain'); if (!h) return;
    h.setAttribute('transform', `rotate(${((ms / 60000) * 360).toFixed(2)} ${CX} ${CY})`);
    watchEl.querySelector('#hMin').setAttribute('transform', `rotate(${((ms / 1800000) * 360).toFixed(2)} ${CX - 66} ${CY})`);
    watchEl.querySelector('#hTen').setAttribute('transform', `rotate(${(((ms % 1000) / 1000) * 360).toFixed(2)} ${CX + 66} ${CY})`);
    watchEl.querySelector('#lcd').textContent = fmtS(ms);
  }

  function crownClick(up) {
    watchEl.classList.add('is-press');
    setTimeout(() => watchEl.classList.remove('is-press'), 110);
    FX.sfx.noise(0.04, { freq: up ? 2600 : 1800, vol: 0.3, q: 3 });
    FX.sfx.tone(up ? 1800 : 1200, 0.04, { type: 'square', vol: 0.03 });
    FX.buzz(12);
  }

  function frame() {
    if (state !== 'run') return;
    const ms = performance.now() - t0;
    setHands(ms);
    const t = target();
    if (ms > Math.max(t * 3, t + 30000)) { cancel('Way too long. Attempt cancelled.'); return; }
    raf = requestAnimationFrame(frame);
  }

  function start(stamp) {
    if (settings.mode === 'gauntlet' && (!gauntlet || gauntlet.done)) gauntlet = { targets: Array.from({ length: 5 }, () => Math.round((3000 + Math.random() * 17000) / 10) * 10), i: 0, res: [], done: false };
    state = 'run'; t0 = stamp;
    crownClick(true);
    watchEl.classList.remove('is-good', 'is-bad');
    watchEl.classList.add('is-run');
    const v = vis(), t = target();
    paintMarker();
    if (v === 'blind') watchEl.classList.add('is-lid');
    else if (v === 'fades') { clearTimeout(frostTimer); frostTimer = setTimeout(() => { if (state === 'run') { watchEl.classList.add('is-frost'); FX.sfx.whoosh(); } }, Math.min(3000, t * 0.4)); }
    if (settings.tick && v === 'visible') {
      let n = 1;
      clearInterval(tickTimer);
      tickTimer = setInterval(() => { if (state !== 'run') return; FX.sfx.tick(); n++; }, 1000);
    }
    if (settings.mode === 'rhythm') scheduleBeats();
    renderPanel();
    raf = requestAnimationFrame(frame);
  }

  function scheduleBeats() {
    const iv = 60000 / settings.bpm;
    rhythmTimers.forEach(clearTimeout); rhythmTimers = [];
    beatIdx = -1;
    for (let i = 0; i < 4; i++) {
      rhythmTimers.push(setTimeout(() => {
        if (state !== 'run') return;
        beatIdx = i;
        FX.sfx.noise(0.05, { freq: 1900, vol: 0.4, q: 6 }); FX.sfx.tone(i === 0 ? 1320 : 990, 0.06, { type: 'sine', vol: 0.12 });
        const dots = panel.querySelectorAll('.sc-beat i');
        dots.forEach((d, k) => d.classList.toggle('hit', k === i));
        setTimeout(() => dots[i]?.classList.remove('hit'), 140);
      }, i * iv));
    }
  }

  function cleanupRun() {
    cancelAnimationFrame(raf); clearTimeout(frostTimer); clearInterval(tickTimer);
    rhythmTimers.forEach(clearTimeout); rhythmTimers = [];
    watchEl.classList.remove('is-run');
  }

  function cancel(msg) {
    state = 'idle'; cleanupRun();
    watchEl.classList.remove('is-lid', 'is-frost');
    setHands(0);
    renderPanel(msg);
  }

  function rating(a, t) {
    const p = a / t;
    if (a === 0) return ['🤯', 'PERFECT. Are you secretly a clock?', 'good'];
    if (p <= 0.001) return ['🏆', 'Unreal. Practically telepathic.', 'good'];
    if (p <= 0.003) return ['🔥', 'Amazing timing.', 'good'];
    if (p <= 0.0075) return ['🎯', 'Great, very close!', 'good'];
    if (p <= 0.015) return ['👍', 'Good. Your inner clock ticks nicely.', 'ok'];
    if (p <= 0.03) return ['🙂', 'Not bad at all.', 'ok'];
    if (p <= 0.07) return ['😬', 'Your internal clock needs a new battery.', 'bad'];
    if (p <= 0.2) return ['🐌', 'Way off. Time is a construct anyway.', 'bad'];
    return ['🫠', 'Were you... counting at all?', 'bad'];
  }

  function stop(stamp) {
    const ms = Math.max(0, Math.round(stamp - t0));
    state = 'done'; cleanupRun();
    crownClick(false);
    const t = target(), d = ms - t, a = Math.abs(d), v = vis();
    setHands(ms);
    const wasHidden = watchEl.classList.contains('is-lid') || watchEl.classList.contains('is-frost');
    setTimeout(() => watchEl.classList.remove('is-lid', 'is-frost'), wasHidden ? 150 : 0);
    const [emo, text, cls] = rating(a, t);
    if (cls !== 'ok') watchEl.classList.add(cls === 'good' ? 'is-good' : 'is-bad');
    const k = key();
    stats.total++;
    stats.count[k] = (stats.count[k] || 0) + 1;
    (stats.hist[k] = stats.hist[k] || []).push(d);
    if (stats.hist[k].length > 20) stats.hist[k].shift();
    const prevBest = stats.best[k];
    const isNew = prevBest != null && a < prevBest;
    if (prevBest == null || a < prevBest) stats.best[k] = a;
    if (settings.mode === 'classic') C.best({ visible: 'easy', fades: 'hard', blind: 'blind' }[v], a, false);
    if (settings.mode === 'daily') { const dk = FX.dayKey(); const cur = stats.daily[dk] || { b: null, n: 0 }; cur.n++; if (cur.b == null || a < cur.b) cur.b = a; stats.daily[dk] = cur; BADGES.unlock('daily'); }
    streak = a / t <= 0.01 ? streak + 1 : 0;
    let gSummary = null;
    if (settings.mode === 'gauntlet' && gauntlet) {
      gauntlet.res.push({ t, ms, d });
      gauntlet.i++;
      if (gauntlet.i >= 5) {
        gauntlet.done = true;
        const tot = gauntlet.res.reduce((s, r) => s + Math.abs(r.d), 0);
        const gNew = !stats.gBest || tot < stats.gBest;
        if (gNew) stats.gBest = tot;
        gSummary = { tot, gNew };
        if (tot < 1500) BADGES.unlock('gaunt');
        if (tot < 500) BADGES.unlock('gaunt2');
      }
    }
    saveStats();
    BADGES.unlock('first');
    if (settings.mode === 'classic') { if (a <= 100) BADGES.unlock('c100'); if (a <= 25) BADGES.unlock('c25'); if (a <= 5) BADGES.unlock('c5'); }
    if (a === 0) BADGES.unlock('perfect');
    if (v === 'fades' && a <= 100) BADGES.unlock('fades');
    if (v === 'blind' && t >= 5000 && a <= 50 && settings.mode !== 'rhythm') BADGES.unlock('blind');
    if (t === 60000 && a <= 300) BADGES.unlock('long');
    if (t === 3000 && a <= 15) BADGES.unlock('short');
    if (streak >= 5) BADGES.unlock('streak');
    if (settings.mode === 'rhythm' && a <= 40) BADGES.unlock('rhythm');
    if (stats.total >= 50) BADGES.unlock('fifty');
    if (stats.total >= 200) BADGES.unlock('twohundred');
    if (cls === 'good') { FX.sfx.win(); FX.burstAt(watchEl, { count: 30, speed: 7, colors: ['#ffd166', '#06d6a0', '#ffffff', '#ff5a36'] }); }
    else if (cls === 'ok') FX.sfx.good();
    else { FX.sfx.bad(); FX.shake(watchEl, 6); }
    if (isNew || a / t <= 0.001 || gSummary?.gNew) setTimeout(() => C.confetti(), 200);
    renderResult({ ms, t, d, a, emo, text, cls, isNew, gSummary });
    paintTabs();
    if (settings.mode === 'random') curRandom = 0;
  }

  function toggle(stamp) {
    if (state === 'run') stop(stamp);
    else if (state !== 'busy') start(stamp);
  }

  function meterSvg(d, t) {
    const span = Math.max(200, Math.round(t * 0.05 / 100) * 100), W = 320, mid = W / 2;
    const x = mid + FX.clamp(d / span, -1, 1) * (mid - 20);
    return `<svg class="sc-meter" viewBox="0 0 ${W} 54" role="img" aria-label="Early or late meter">
      <defs><linearGradient id="mg" x1="0" x2="1"><stop offset="0" stop-color="var(--bad)"/><stop offset=".4" stop-color="var(--warn)"/><stop offset=".5" stop-color="var(--good)"/><stop offset=".6" stop-color="var(--warn)"/><stop offset="1" stop-color="var(--bad)"/></linearGradient></defs>
      <rect x="20" y="18" width="${W - 40}" height="10" rx="5" fill="url(#mg)" opacity=".85"/>
      <line x1="${mid}" x2="${mid}" y1="12" y2="34" stroke="var(--ink)" stroke-width="2"/>
      <text x="20" y="48">-${span} early</text><text x="${W - 20}" y="48" text-anchor="end">late +${span}</text><text x="${mid}" y="9" text-anchor="middle">target</text>
      <g style="transform: translateX(${(x - mid).toFixed(1)}px); transition: transform .8s cubic-bezier(.2,1.3,.4,1)"><path d="M${mid - 8} 6 L${mid + 8} 6 L${mid} 18 Z" fill="var(--ink)"/><circle cx="${mid}" cy="23" r="6" fill="var(--surface)" stroke="var(--ink)" stroke-width="3"/></g>
    </svg>`;
  }

  function dotsHtml() {
    if (settings.mode !== 'gauntlet') return '';
    const g = gauntlet && !gauntlet.done ? gauntlet : null;
    const i = g ? g.i : 0;
    return `<div class="sc-dots" aria-label="Gauntlet progress">${Array.from({ length: 5 }, (_, k) => `<i class="${k < i ? 'done' : k === i ? 'on' : ''}"></i>`).join('')}</div>`;
  }
  function modeDesc() {
    switch (settings.mode) {
      case 'classic': return 'The classic. Ten seconds, not a millisecond more.';
      case 'target': return 'Pick a target. Short ones are twitchy, long ones test your patience.';
      case 'random': return 'A fresh target every attempt. Press R for another.';
      case 'gauntlet': return 'Five random targets, watch closed. Lowest total error wins.';
      case 'rhythm': return `Four clicks at ${settings.bpm} BPM, then silence. Stop on beat 8.`;
      case 'daily': return `Daily target #${FX.dayNumber()}, same for everyone. ${daily.vis === 'blind' ? 'Watch closed.' : 'The glass fogs up.'}`;
    }
    return '';
  }

  function renderPanel(msg) {
    const t = target(), running = state === 'run';
    let extra = '';
    if (settings.mode === 'target' && !running) extra = `<div class="sc-chips" id="chips">${TARGETS.map((x) => `<button type="button" class="sc-chip" data-t="${x}" aria-pressed="${x === settings.target}">${x / 1000}s</button>`).join('')}</div>`;
    if (settings.mode === 'rhythm') extra = `${running ? '' : `<div class="sc-chips" id="bpm">${[60, 90, 120].map((b) => `<button type="button" class="sc-chip" data-b="${b}" aria-pressed="${b === settings.bpm}">${b} BPM</button>`).join('')}</div>`}<div class="sc-beat">${Array.from({ length: 8 }, (_, i) => `<i class="${i === 7 ? 'goal' : ''}"></i>`).join('')}</div>`;
    if (settings.mode === 'daily') { const dd = stats.daily[FX.dayKey()]; if (dd) extra = `<p class="sc-hint">Today: best ${dd.b} ms over ${dd.n} ${dd.n === 1 ? 'try' : 'tries'}.</p>`; }
    panel.innerHTML = `${dotsHtml()}<div class="sc-label">${settings.mode === 'gauntlet' && gauntlet && !gauntlet.done ? `Target ${gauntlet.i + 1} of 5` : 'Target'}</div>
      <div class="sc-target">${fmtS(t)}<small> s</small></div>
      <p class="sc-desc">${msg || modeDesc()}</p>${extra}
      <button class="c-btn sc-go${running ? ' is-stop' : ''}" id="go" type="button">${running ? 'Stop' : 'Start'}</button>
      <p class="sc-hint">Tap the button or the watch, or press <span class="c-kbd">Space</span>.</p>`;
    bindPanel();
  }

  function renderResult(r) {
    const g = r.gSummary;
    const again = settings.mode === 'gauntlet' ? (g ? 'New gauntlet' : 'Next target') : 'Go again';
    panel.innerHTML = `${dotsHtml()}${r.isNew ? '<span class="sc-tag">New best!</span>' : ''}${g?.gNew ? '<span class="sc-tag">Best gauntlet!</span>' : ''}
      <div class="sc-label">You stopped at ${fmtS(r.ms)} s</div>
      <div class="sc-diff ${r.cls}">${sign(r.d)} ms</div>
      <div class="sc-rate"><i>${r.emo}</i>${r.text}</div>
      ${meterSvg(r.d, r.t)}
      ${g ? `<div class="sc-glist">${gauntlet.res.map((x, i) => `<div><span>#${i + 1} ${fmtS(x.t)}s</span><b>${sign(x.d)}</b></div>`).join('')}<div><span>Total error</span><b>${g.tot} ms</b></div></div>` : ''}
      <div class="sc-row"><button class="c-btn sc-go" id="go" type="button">${again}</button><button class="c-btn c-btn--ghost" id="share" type="button">Share</button></div>
      <p class="sc-hint">${r.d < 0 ? 'Early' : r.d > 0 ? 'Late' : 'Spot on'}. <span class="c-kbd">Space</span> to go again.</p>`;
    bindPanel();
    $('share').addEventListener('click', () => {
      const m = MODES.find((x) => x.v === settings.mode).label;
      let txt;
      if (g) txt = `Stop the Clock gauntlet ⏱️\nTotal error: ${g.tot} ms over 5 blind targets\n${gauntlet.res.map((x) => (Math.abs(x.d) / x.t <= 0.01 ? '🟩' : Math.abs(x.d) / x.t <= 0.03 ? '🟨' : '🟥')).join('')}`;
      else if (settings.mode === 'daily') { const dd = stats.daily[FX.dayKey()]; txt = `Stop the Clock daily #${FX.dayNumber()} ⏱️\nTarget ${fmtS(r.t)} s\nBest: ${dd.b} ms off in ${dd.n} ${dd.n === 1 ? 'try' : 'tries'}`; }
      else txt = `Stop the Clock (${m}, ${vis()}) ⏱️\nTarget ${fmtS(r.t)} s, I stopped at ${fmtS(r.ms)} s\n${sign(r.d)} ms ${r.emo}`;
      FX.copy(txt);
    });
  }

  function bindPanel() {
    const go = $('go');
    go.addEventListener('pointerdown', (e) => { if (e.button > 0) return; e.preventDefault(); toggle(e.timeStamp || performance.now()); });
    go.addEventListener('click', (e) => { if (e.detail === 0) toggle(performance.now()); });
    panel.querySelectorAll('[data-t]').forEach((b) => b.addEventListener('click', () => { settings.target = +b.dataset.t; saveSettings(); FX.sfx.click(); reset(); }));
    panel.querySelectorAll('[data-b]').forEach((b) => b.addEventListener('click', () => { settings.bpm = +b.dataset.b; saveSettings(); FX.sfx.click(); reset(); }));
  }

  function reset() {
    if (state === 'run') cancel();
    state = 'idle';
    watchEl.classList.remove('is-lid', 'is-frost', 'is-good', 'is-bad');
    setHands(0); paintMarker(); renderPanel(); paintOpts(); paintTabs();
  }

  let visSeg;
  function paintOpts() {
    const forced = ['gauntlet', 'rhythm', 'daily'].includes(settings.mode);
    visSeg.set(vis());
    if (forced) $('vis').dataset.locked = '1'; else delete $('vis').dataset.locked;
    $('tick').disabled = vis() !== 'visible';
  }

  FX.seg($('modes'), MODES, settings.mode, (v) => { settings.mode = v; saveSettings(); if (v === 'gauntlet') gauntlet = null; reset(); }, 'Game mode');
  visSeg = FX.seg($('vis'), [{ v: 'visible', label: '👁️ Visible' }, { v: 'fades', label: '🌫️ Fades' }, { v: 'blind', label: '🙈 Blind' }], settings.vis, (v) => { settings.vis = v; saveSettings(); reset(); }, 'Visibility');
  FX.seg($('skin'), Object.entries(SKINS).map(([k, s]) => ({ v: k, label: s.name })), settings.skin, (v) => {
    settings.skin = v; saveSettings(); stats.skins[v] = 1; saveStats(); buildWatch();
    if (Object.keys(SKINS).every((k) => stats.skins[k])) BADGES.unlock('skins');
  }, 'Watch style');
  $('tick').checked = settings.tick;
  $('tick').addEventListener('change', () => { settings.tick = $('tick').checked; saveSettings(); });

  watchEl.addEventListener('pointerdown', (e) => { if (e.button > 0) return; e.preventDefault(); toggle(e.timeStamp || performance.now()); });

  FX.onKey((e) => {
    if (e.repeat) return;
    const onBtn = e.target.closest?.('button') && e.target.id !== 'go';
    if (e.code === 'Space' || (e.key === 'Enter' && e.target.id === 'go')) {
      if (onBtn && e.code !== 'Space') return;
      if (onBtn) e.target.blur();
      e.preventDefault();
      toggle(e.timeStamp || performance.now());
    } else if (e.key === 'Escape' && state === 'run') cancel('Attempt cancelled.');
    else if ((e.key === 'r' || e.key === 'R') && settings.mode === 'random' && state !== 'run') { curRandom = newRandom(); reset(); FX.sfx.pop(); }
    else if (['1', '2', '3'].includes(e.key) && state !== 'run' && !['gauntlet', 'rhythm', 'daily'].includes(settings.mode)) { settings.vis = ['visible', 'fades', 'blind'][+e.key - 1]; saveSettings(); reset(); }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'run') cancel('Attempt cancelled. No peeking at other tabs!'); });

  function drawChart(hist) {
    const X0 = 66, X1 = 552, MID = 85, H = 70, KEEP = 20;
    const maxAbs = Math.min(5000, Math.max(100, ...hist.map((v) => Math.abs(v))));
    const scale = Math.ceil(maxAbs / 100) * 100;
    const y = (v) => MID - Math.max(-1, Math.min(1, v / scale)) * H;
    const slot = (X1 - X0) / KEEP;
    let out = `<line x1="${X0}" x2="${X1}" y1="${MID}" y2="${MID}" stroke="var(--ink-3)" stroke-width="1.5"/>
      <line x1="${X0}" x2="${X1}" y1="${y(scale)}" y2="${y(scale)}" stroke="var(--line)" stroke-dasharray="4 5"/>
      <line x1="${X0}" x2="${X1}" y1="${y(-scale)}" y2="${y(-scale)}" stroke="var(--line)" stroke-dasharray="4 5"/>
      <text x="${X0 - 8}" y="${MID + 4}" text-anchor="end">target</text><text x="${X0 - 8}" y="${y(scale) + 4}" text-anchor="end">+${scale}</text><text x="${X0 - 8}" y="${y(-scale) + 4}" text-anchor="end">-${scale}</text>`;
    if (!hist.length) out += `<text x="${(X0 + X1) / 2}" y="${MID - 10}" text-anchor="middle">No attempts yet. Late goes up, early goes down.</text>`;
    hist.forEach((v, i) => {
      const a = Math.abs(v), col = a <= 100 ? 'var(--good)' : a <= 500 ? 'var(--warn)' : 'var(--bad)';
      const x = X0 + i * slot + slot * 0.18, w = slot * 0.64, top = Math.min(y(v), MID), h = Math.max(2, Math.abs(y(v) - MID)), last = i === hist.length - 1;
      out += `<rect x="${x.toFixed(1)}" y="${(v === 0 ? MID - 1 : top).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="${col}" opacity="${last ? 1 : 0.7}"><title>${sign(v)} ms</title></rect>`;
      if (last) out += `<text x="${(x + w / 2).toFixed(1)}" y="${v >= 0 ? top - 6 : top + h + 14}" text-anchor="middle" style="fill:var(--ink)">${sign(v)}</text>`;
    });
    return `<svg class="sc-chart" viewBox="0 0 560 170" role="img" aria-label="Your recent attempts">${out}</svg>`;
  }

  let tabsApi;
  function paintTabs() { tabsApi?.refresh(); }
  tabsApi = FX.tabs($('tabs'), [
    { id: 'hist', label: 'History', render(p) {
      const k = key(), hist = stats.hist[k] || [];
      const avg = hist.length ? Math.round(hist.reduce((s, v) => s + Math.abs(v), 0) / hist.length) : null;
      const lean = hist.length >= 3 ? Math.round(hist.reduce((s, v) => s + v, 0) / hist.length) : null;
      p.innerHTML = `<div class="sc-histhead"><h3>Last attempts · ${MODES.find((m) => m.v === settings.mode).label}, ${fmtS(target())} s, ${vis()}</h3><button class="fx-danger" id="clear" type="button">Clear</button></div>
        ${drawChart(hist)}
        ${FX.statGrid([[stats.best[k] != null ? stats.best[k] + ' ms' : '-', 'Best'], [avg != null ? avg + ' ms' : '-', 'Avg error'], [stats.count[k] || 0, 'Attempts']])}
        ${lean != null ? `<p class="sc-lean">${Math.abs(lean) < 15 ? 'No lean: you are neither early nor late on average. Lovely.' : `You tend to stop ${Math.abs(lean)} ms ${lean < 0 ? 'early. Patience!' : 'late. Trust your gut sooner.'}`}</p>` : ''}`;
      $('clear').addEventListener('click', () => { stats.hist[k] = []; saveStats(); paintTabs(); });
    } },
    { id: 'stats', label: 'Stats', render(p) {
      const rows = Object.entries(stats.best).sort((a, b) => a[1] - b[1]).slice(0, 12);
      const label = (k) => { const [m, v] = k.split(':'); const n = m === '10' ? 'Classic 10 s' : m === 'rand' ? 'Random' : m === 'daily' ? 'Daily' : m === 'gauntlet' ? 'Gauntlet target' : m[0] === 't' ? `Target ${+m.slice(1) / 1000} s` : m[0] === 'r' ? `Rhythm ${m.slice(1)} BPM` : m; return `${n} · ${v}`; };
      const dd = stats.daily[FX.dayKey()];
      p.innerHTML = `${FX.statGrid([[stats.total, 'Attempts'], [stats.best['10:visible'] != null ? stats.best['10:visible'] + ' ms' : '-', 'Best 10 s'], [stats.best['10:blind'] != null ? stats.best['10:blind'] + ' ms' : '-', 'Best blind'], [stats.gBest ? stats.gBest + ' ms' : '-', 'Gauntlet'], [dd ? dd.b + ' ms' : '-', 'Today']])}
        <h4>Personal bests</h4><div class="fx-hist-list">${rows.length ? rows.map(([k, v]) => `<div><span>${label(k)}</span><b>${v} ms</b></div>`).join('') : '<p class="c-muted">No attempts yet.</p>'}</div>`;
    } },
    { id: 'badges', label: 'Badges', render(p) { BADGES.render(p); } },
    { id: 'how', label: 'How to play', render(p) {
      p.innerHTML = `<ul class="fx-howto">
        <li><i>▶️</i><div><b>Start</b><p>Press Start, tap the watch or hit Space. The crown clicks and the sweep hand begins.</p></div></li>
        <li><i>⏹️</i><div><b>Stop on target</b><p>Stop when you think the target has passed. The red marker on the dial shows where the hand should land.</p></div></li>
        <li><i>🌫️</i><div><b>Make it harder</b><p>Fades frosts the glass after a moment. Blind snaps the hunter lid shut from the start, so it is all in your head.</p></div></li>
        <li><i>🥁</i><div><b>Rhythm</b><p>Four clicks set a tempo, then silence. Keep counting and stop exactly on beat 8.</p></div></li>
        <li><i>⏳</i><div><b>Did you know?</b><p>Without a clock, people's sense of time drifts with mood, attention and even body temperature. Counting steadily, like "one-Mississippi", is a common trick to stay on pace.</p></div></li>
      </ul><div class="fx-keys"><span><span class="c-kbd">Space</span> start/stop</span><span><span class="c-kbd">1</span><span class="c-kbd">2</span><span class="c-kbd">3</span> visibility</span><span><span class="c-kbd">R</span> new random target</span><span><span class="c-kbd">Esc</span> cancel</span></div>`;
    } }
  ]);

  stats.skins[settings.skin] = 1; saveStats();
  buildWatch(); reset();
  window.__clock = { get running() { return state === 'run'; }, get state() { return state; }, target, toggle: () => toggle(performance.now()), stats };
})();
