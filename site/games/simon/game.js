(() => {
  const C = window.Curio, $ = (id) => document.getElementById(id);
  const boardEl = $('board'), stage = $('stage'), statusEl = $('status'), startBtn = $('start'), timerEl = $('timer');

  const LAYOUTS = {
    classic: { label: 'Classic', n: 4 },
    g3: { label: '3×3', n: 9 },
    g4: { label: '4×4', n: 16 }
  };
  const MODES = {
    normal: { label: 'Normal', sub: 'grows by one' },
    reverse: { label: 'Reverse', sub: 'play it backwards' },
    speed: { label: 'Speed', sub: 'fast + timed' },
    chaos: { label: 'Chaos', sub: 'new tune each level' },
    daily: { label: 'Daily', sub: 'same for all' }
  };
  const SOUNDS = { synth: 'Synth', marimba: 'Marimba', piano: 'Piano', chip: 'Chiptune', bells: 'Bells', drums: 'Drums' };
  const CLASSIC = [{ c: '#22c55e', f: 415.3 }, { c: '#ef4444', f: 311.1 }, { c: '#eab308', f: 247.0 }, { c: '#3b82f6', f: 207.7 }];
  const PALETTE = ['#ef476f', '#ff8c42', '#ffc233', '#8ac926', '#06d6a0', '#1b9aaa', '#4361ee', '#9b5de5', '#f15bb5', '#ff595e', '#2ec4b6', '#e9c46a', '#90be6d', '#577590', '#c77dff', '#f4a261'];
  const PENTA = [0, 2, 4, 7, 9];
  const mixHex = (a, b, t) => { const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16); const ch = (s) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t); return `rgb(${ch(16)},${ch(8)},${ch(0)})`; };
  const noteFreq = (i) => 261.63 * 2 ** ((PENTA[i % 5] + 12 * Math.floor(i / 5)) / 12);
  const KEYMAP = {
    classic: { q: 0, w: 1, a: 2, s: 3, '1': 0, '2': 1, '3': 2, '4': 3 },
    g3: { q: 0, w: 1, e: 2, a: 3, s: 4, d: 5, z: 6, x: 7, c: 8, '7': 0, '8': 1, '9': 2, '4': 3, '5': 4, '6': 5, '1': 6, '2': 7, '3': 8 },
    g4: { '1': 0, '2': 1, '3': 2, '4': 3, q: 4, w: 5, e: 6, r: 7, a: 8, s: 9, d: 10, f: 11, z: 12, x: 13, c: 14, v: 15 }
  };

  const settings = FX.load('settings', 1, { layout: 'g3', mode: 'normal', sound: 'synth', chance: false });
  if (!LAYOUTS[settings.layout]) settings.layout = 'g3';
  if (!MODES[settings.mode]) settings.mode = 'normal';
  if (!SOUNDS[settings.sound]) settings.sound = 'synth';
  const saveSettings = () => FX.save('settings', 1, settings);
  const stats = FX.load('stats', 1, { games: 0, presses: 0, best: {}, levels: [], recent: [], sounds: {}, daily: {} });
  const saveStats = () => FX.save('stats', 1, stats);

  const BADGES = FX.badges([
    { id: 'first', emoji: '🎵', tier: 'bronze', name: 'First notes', desc: 'Finish a game' },
    { id: 'l5', emoji: '🙂', tier: 'bronze', name: 'Warmed up', desc: 'Reach level 5' },
    { id: 'l10', emoji: '🎹', tier: 'silver', name: 'Musician', desc: 'Reach level 10' },
    { id: 'l15', emoji: '🧠', tier: 'gold', name: 'Elephant', desc: 'Reach level 15' },
    { id: 'l20', emoji: '🐘', tier: 'gold', name: 'Mammoth memory', desc: 'Reach level 20' },
    { id: 'l30', emoji: '🌌', tier: 'diamond', name: 'Infinite loop', desc: 'Reach level 30', secret: true },
    { id: 'classic', emoji: '🟢', tier: 'silver', name: 'Old school', desc: 'Level 12 on the Classic board' },
    { id: 'g4', emoji: '🔲', tier: 'gold', name: 'Grid master', desc: 'Level 10 on the 4×4 board' },
    { id: 'reverse', emoji: '🔁', tier: 'silver', name: 'Rewind', desc: 'Level 8 in Reverse' },
    { id: 'speed', emoji: '🏎️', tier: 'gold', name: 'Speed reader', desc: 'Level 10 in Speed' },
    { id: 'chaos', emoji: '🌪️', tier: 'silver', name: 'Chaos tamer', desc: 'Level 7 in Chaos' },
    { id: 'strict', emoji: '🎯', tier: 'gold', name: 'No do-overs', desc: 'Level 12 without second chance' },
    { id: 'daily', emoji: '📅', tier: 'bronze', name: 'Daily tune', desc: 'Play a daily sequence' },
    { id: 'band', emoji: '🎸', tier: 'bronze', name: 'One-person band', desc: 'Play with all six sounds' },
    { id: 'games', emoji: '🔂', tier: 'silver', name: 'On repeat', desc: 'Play 25 games' }
  ]);

  let pads = [], seq = [], pos = 0, state = 'idle', timers = [], token = 0, lives = 0, inputDeadline = 0, timerRaf = 0, rand = Math.random, cfg = {};

  function audio() { return C.muted ? null : C.audioContext(); }
  function play(i, dur) {
    const a = audio(); if (!a) return;
    const kind = cfg.sound || settings.sound;
    const f = (cfg.layout || settings.layout) === 'classic' ? CLASSIC[i].f * (kind === 'synth' ? 1 : 2) : noteFreq(i);
    const t = a.currentTime;
    const env = (g, peak, attack, decay) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + decay); };
    const osc = (type, freq, peak, attack, decay, dest = a.destination) => { const o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.value = freq; env(g, peak, attack, decay); o.connect(g).connect(dest); o.start(t); o.stop(t + decay + 0.05); return o; };
    const d = Math.max(0.18, dur);
    if (kind === 'synth') { osc('triangle', f, 0.18, 0.015, d); osc('sine', f * 2, 0.05, 0.015, d); }
    else if (kind === 'marimba') { osc('sine', f, 0.25, 0.004, 0.5); osc('sine', f * 4, 0.08, 0.002, 0.08); osc('sine', f * 10, 0.02, 0.001, 0.03); }
    else if (kind === 'piano') { const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600; lp.connect(a.destination); osc('triangle', f, 0.2, 0.005, 0.9, lp); osc('sine', f * 2, 0.07, 0.005, 0.6, lp); osc('sine', f * 3, 0.03, 0.005, 0.4, lp); }
    else if (kind === 'chip') { osc('square', f, 0.06, 0.003, d * 0.8); const o2 = osc('square', f * 2, 0.025, 0.003, 0.06); o2.frequency.setValueAtTime(f * 1.5, t + 0.03); }
    else if (kind === 'bells') {
      const car = a.createOscillator(), mod = a.createOscillator(), mg = a.createGain(), g = a.createGain();
      car.frequency.value = f * 2; mod.frequency.value = f * 2 * 3.5; mg.gain.setValueAtTime(f * 4, t); mg.gain.exponentialRampToValueAtTime(1, t + 1.2);
      mod.connect(mg).connect(car.frequency); env(g, 0.15, 0.003, 1.4); car.connect(g).connect(a.destination);
      car.start(t); mod.start(t); car.stop(t + 1.5); mod.stop(t + 1.5);
    } else if (kind === 'drums') {
      const k = i % 6, pitch = 1 + Math.floor(i / 6) * 0.25;
      if (k === 0) { const o = osc('sine', 150 * pitch, 0.5, 0.002, 0.35); o.frequency.exponentialRampToValueAtTime(40, t + 0.3); }
      else if (k === 1) { FX.sfx.noise(0.18, { freq: 1800 * pitch, vol: 0.45, q: 0.8 }); osc('triangle', 190 * pitch, 0.15, 0.002, 0.1); }
      else if (k === 2) FX.sfx.noise(0.06, { freq: 8000, vol: 0.35, q: 1.5, ftype: 'highpass' });
      else if (k === 3) { const o = osc('sine', 220 * pitch, 0.4, 0.002, 0.3); o.frequency.exponentialRampToValueAtTime(110 * pitch, t + 0.28); }
      else if (k === 4) { [0, 0.012, 0.024].forEach((dl) => FX.sfx.noise(0.08, { freq: 1200, vol: 0.35, q: 1, delay: dl })); }
      else { osc('square', 540 * pitch, 0.06, 0.002, 0.3); osc('square', 800 * pitch, 0.05, 0.002, 0.3); }
    }
  }

  function build() {
    const L = cfg.layout || settings.layout;
    pads = [];
    boardEl.innerHTML = '';
    if (L === 'classic') {
      const cx = 200, cy = 200, R = 192, r = 84, gap = 0.07;
      const pt = (rad, a) => `${(cx + Math.cos(a) * rad).toFixed(2)} ${(cy + Math.sin(a) * rad).toFixed(2)}`;
      const sector = (a0, a1) => `M${pt(r, a0 + gap * 1.6)} L${pt(R, a0 + gap * 0.7)} A${R} ${R} 0 0 1 ${pt(R, a1 - gap * 0.7)} L${pt(r, a1 - gap * 1.6)} A${r} ${r} 0 0 0 ${pt(r, a0 + gap * 1.6)} Z`;
      const angles = [[Math.PI, Math.PI * 1.5], [Math.PI * 1.5, Math.PI * 2], [Math.PI * 0.5, Math.PI], [0, Math.PI * 0.5]];
      const svg = `<svg class="sm-svg" viewBox="-6 -6 412 412" role="group" aria-label="Classic four pad board">
        <defs>${CLASSIC.map((p, i) => `<radialGradient id="pg${i}" cx="${[0.25, 0.75, 0.25, 0.75][i]}" cy="${[0.25, 0.25, 0.75, 0.75][i]}" r=".9"><stop offset="0" stop-color="${p.c}" stop-opacity=".55"/><stop offset="1" stop-color="${mixHex(p.c, '#000000', 0.55)}"/></radialGradient>
          <radialGradient id="pl${i}" cx=".5" cy=".5" r=".7"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="${mixHex(p.c, '#ffffff', 0.4)}"/><stop offset="1" stop-color="${p.c}"/></radialGradient>`).join('')}
          <radialGradient id="hub" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#3a3f4b"/><stop offset="1" stop-color="#121418"/></radialGradient>
          <linearGradient id="rim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4b505c"/><stop offset="1" stop-color="#101216"/></linearGradient></defs>
        <circle cx="200" cy="200" r="204" fill="url(#rim)"/>
        <circle cx="200" cy="200" r="197" fill="#0d0f13"/>
        ${angles.map(([a0, a1], i) => `<g class="pad" data-i="${i}" tabindex="-1" role="button" aria-label="${['Green', 'Red', 'Yellow', 'Blue'][i]} pad"><path class="base" d="${sector(a0, a1)}" fill="url(#pg${i})"/><path class="lt" d="${sector(a0, a1)}" fill="url(#pl${i})"/><path d="${sector(a0, a1)}" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="2"/></g>`).join('')}
        <circle cx="200" cy="200" r="${r - 6}" fill="url(#hub)" stroke="#000" stroke-width="3"/>
        <circle cx="200" cy="200" r="${r - 16}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="2"/>
        <text class="sm-hubtext" x="200" y="174" text-anchor="middle">ZOBLE</text>
        <text class="sm-hubnum" id="hubnum" x="200" y="230" text-anchor="middle">0</text>
      </svg>`;
      boardEl.innerHTML = svg;
      pads = [...boardEl.querySelectorAll('.pad')];
    } else {
      const n = L === 'g3' ? 3 : 4;
      const g = document.createElement('div');
      g.className = 'sm-grid'; g.style.setProperty('--n', n);
      const labels = L === 'g3' ? ['7', '8', '9', '4', '5', '6', '1', '2', '3'] : ['1', '2', '3', '4', 'Q', 'W', 'E', 'R', 'A', 'S', 'D', 'F', 'Z', 'X', 'C', 'V'];
      for (let i = 0; i < n * n; i++) {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'sm-pad'; b.style.setProperty('--c', PALETTE[i]);
        b.setAttribute('aria-label', `Pad ${i + 1}`);
        b.innerHTML = `<span>${labels[i]}</span>`;
        g.append(b); pads.push(b);
      }
      boardEl.append(g);
    }
    pads.forEach((p, i) => {
      p.addEventListener('pointerdown', (e) => { if (e.button > 0) return; e.preventDefault(); press(i, e); });
      p.addEventListener('click', (e) => { if (e.detail === 0) press(i); });
      p.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); press(i); } });
    });
    setEnabled(false);
  }
  function setEnabled(on) {
    pads.forEach((p) => { if (p.tagName === 'BUTTON') p.disabled = !on; else p.setAttribute('tabindex', on ? '0' : '-1'); });
    boardEl.classList.toggle('input', on);
  }
  function overClass(on) { const t = boardEl.querySelector('.sm-svg') || boardEl; t.classList.toggle('over', on); }
  function hub(v) { const h = $('hubnum'); if (h) h.textContent = v; }

  function flash(i, ms, e) {
    const p = pads[i]; if (!p) return;
    p.classList.add('lit');
    play(i, ms / 1000);
    setTimeout(() => p.classList.remove('lit'), ms);
    if (e && p.tagName === 'BUTTON') {
      const r = p.getBoundingClientRect(), rip = document.createElement('i');
      rip.className = 'sm-ripple'; rip.style.left = (e.clientX - r.left) + 'px'; rip.style.top = (e.clientY - r.top) + 'px';
      p.append(rip); setTimeout(() => rip.remove(), 520);
    }
  }
  function setStatus(t, cls = '') {
    statusEl.textContent = t; statusEl.className = 'sm-status ' + cls;
    void statusEl.offsetWidth; statusEl.classList.add('pop');
  }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; cancelAnimationFrame(timerRaf); timerEl.classList.remove('is-on'); }
  const paintBest = () => { const b = stats.best[bestKey()]; $('best').textContent = b == null ? '-' : b; };
  const bestKey = () => `${cfg.layout || settings.layout}:${cfg.mode || settings.mode}`;
  function paintLives() { const max = cfg.chance ? 1 : 0; $('lives').innerHTML = max ? `<span class="${lives < 1 ? 'is-lost' : ''}">💛</span>` : ''; }

  function start() {
    clearTimers();
    cfg = { layout: settings.layout, mode: settings.mode, sound: settings.sound, chance: settings.chance };
    if (cfg.mode === 'daily') { cfg.layout = 'g3'; cfg.chance = false; }
    rand = cfg.mode === 'daily' ? FX.rng(FX.daySeed('seq')) : Math.random;
    build();
    stats.sounds[cfg.sound] = 1; saveStats();
    if (Object.keys(SOUNDS).every((k) => stats.sounds[k])) BADGES.unlock('band');
    lives = cfg.chance ? 1 : 0;
    seq = []; overClass(false); pads.forEach((s) => s.classList.remove('wrong', 'right', 'lit'));
    startBtn.hidden = true;
    $('opts').classList.add('is-locked');
    paintLives(); paintBest();
    FX.sfx.whoosh();
    nextLevel();
  }

  const padCount = () => LAYOUTS[cfg.layout].n;
  function nextLevel() {
    if (cfg.mode === 'chaos') { const len = seq.length + 1; seq = Array.from({ length: len }, () => Math.floor(rand() * padCount())); }
    else seq.push(Math.floor(rand() * padCount()));
    $('level').textContent = seq.length; hub(seq.length);
    FX.bump($('level'));
    playSeq();
  }

  function expected(k) { return cfg.mode === 'reverse' ? seq[seq.length - 1 - k] : seq[k]; }

  function playSeq() {
    state = 'show'; pos = 0;
    setEnabled(false); stage.classList.add('is-show');
    setStatus(cfg.mode === 'reverse' ? 'Watch... then play it backwards' : 'Watch closely...');
    const tk = ++token;
    const L = seq.length;
    const step = cfg.mode === 'speed' ? Math.max(170, 430 - L * 22) : Math.max(280, 620 - L * 20);
    seq.forEach((i, k) => timers.push(setTimeout(() => { if (tk === token) flash(i, step * 0.62); }, 650 + k * step)));
    timers.push(setTimeout(() => {
      if (tk !== token) return;
      state = 'input'; stage.classList.remove('is-show');
      setEnabled(true);
      setStatus(cfg.mode === 'reverse' ? 'Your turn, backwards!' : 'Your turn!', 'go');
      if (cfg.mode === 'speed') armTimer();
    }, 650 + L * step));
  }

  function armTimer() {
    const per = 1600;
    inputDeadline = performance.now() + per;
    timerEl.classList.add('is-on');
    const c = timerEl.querySelector('circle');
    cancelAnimationFrame(timerRaf);
    const tick = () => {
      if (state !== 'input') { timerEl.classList.remove('is-on'); return; }
      const left = inputDeadline - performance.now();
      c.style.strokeDashoffset = String(289 * (1 - Math.max(0, left) / per));
      if (left <= 0) { timerEl.classList.remove('is-on'); return mistake(-1); }
      timerRaf = requestAnimationFrame(tick);
    };
    timerRaf = requestAnimationFrame(tick);
  }

  function press(i, e) {
    if (state !== 'input') return;
    flash(i, 220, e);
    FX.buzz(10);
    stats.presses++;
    if (i !== expected(pos)) return mistake(i);
    pos++;
    if (cfg.mode === 'speed') inputDeadline = performance.now() + 1600;
    if (pos === seq.length) {
      state = 'wait'; setEnabled(false); cancelAnimationFrame(timerRaf); timerEl.classList.remove('is-on');
      const L = seq.length;
      FX.floatAt(stage, `Level ${L}!`, 'var(--good)');
      if (L % 5 === 0) { FX.burstAt(stage, { count: 40, speed: 8 }); FX.sfx.win(); setStatus(`Level ${L}! Brain = huge.`, 'go'); }
      else setStatus(C.pick(['Nice!', 'Got it!', 'Perfect.', 'Smooth.', 'Yes!']), 'go');
      checkBadges(L);
      timers.push(setTimeout(nextLevel, 750));
    }
  }

  function checkBadges(L) {
    if (L >= 5) BADGES.unlock('l5');
    if (L >= 10) BADGES.unlock('l10');
    if (L >= 15) BADGES.unlock('l15');
    if (L >= 20) BADGES.unlock('l20');
    if (L >= 30) BADGES.unlock('l30');
    if (cfg.layout === 'classic' && L >= 12) BADGES.unlock('classic');
    if (cfg.layout === 'g4' && L >= 10) BADGES.unlock('g4');
    if (cfg.mode === 'reverse' && L >= 8) BADGES.unlock('reverse');
    if (cfg.mode === 'speed' && L >= 10) BADGES.unlock('speed');
    if (cfg.mode === 'chaos' && L >= 7) BADGES.unlock('chaos');
    if (!cfg.chance && L >= 12) BADGES.unlock('strict');
  }

  function mistake(wrong) {
    clearTimers();
    const exp = expected(pos);
    FX.sfx.bad(); FX.buzz([50, 40, 80]);
    boardEl.classList.remove('shake'); void boardEl.offsetWidth; boardEl.classList.add('shake');
    if (lives > 0) {
      lives--; paintLives();
      state = 'wait'; setEnabled(false);
      setStatus(wrong < 0 ? 'Too slow! Second chance, watch again.' : 'Oops! Second chance, watch again.', 'bad');
      pads[exp]?.classList.add('lit'); setTimeout(() => pads[exp]?.classList.remove('lit'), 500);
      timers.push(setTimeout(playSeq, 1200));
      return;
    }
    gameOver(wrong, exp);
  }

  async function gameOver(wrong, exp) {
    state = 'over'; setEnabled(false); stage.classList.remove('is-show');
    const level = seq.length - 1;
    overClass(true);
    if (wrong >= 0) pads[wrong].classList.add('wrong');
    pads[exp]?.classList.add('right');
    setStatus(wrong < 0 ? 'Out of time!' : 'Oops, wrong pad.', 'bad');
    const k = bestKey(), prev = stats.best[k];
    const isNew = level > 0 && (prev == null || level > prev);
    if (isNew) stats.best[k] = level;
    C.best('level', level);
    stats.games++;
    stats.levels.push(level); if (stats.levels.length > 300) stats.levels.shift();
    stats.recent.unshift({ l: cfg.layout, m: cfg.mode, s: cfg.sound, v: level, d: Date.now() }); stats.recent.length = Math.min(12, stats.recent.length);
    if (cfg.mode === 'daily') { const dk = FX.dayKey(); stats.daily[dk] = Math.max(stats.daily[dk] || 0, level); BADGES.unlock('daily'); }
    saveStats();
    BADGES.unlock('first');
    if (stats.games >= 25) BADGES.unlock('games');
    paintBest(); tabsApi.refresh();
    if (isNew && prev != null) { C.confetti(); FX.sfx.fanfare(); } else FX.sfx.lose();
    await new Promise((r) => setTimeout(r, 1300));
    const quip = level >= 20 ? 'Mammoth memory. Truly.' : level >= 15 ? 'Elephant-grade recall.' : level >= 10 ? 'Seriously impressive.' : level >= 6 ? 'Better than most humans!' : level >= 3 ? 'A solid warm-up.' : 'Goldfish energy. Try again?';
    const body = document.createElement('div');
    body.innerHTML = `<p style="margin:0 0 8px">${quip}</p><p style="margin:0 0 4px;font-weight:800">${LAYOUTS[cfg.layout].label} · ${MODES[cfg.mode].label} · ${SOUNDS[cfg.sound]}</p><p style="margin:0">Best here: level ${stats.best[k] ?? level}${isNew && prev != null ? ' (new record!)' : ''}</p>`;
    const v = await C.modal({ emoji: isNew && prev != null ? '🏆' : level >= 10 ? '🧠' : '🎵', title: `Level ${level}`, body, buttons: [{ label: 'Play again', value: 'again' }, { label: 'Share', value: 'share' }, { label: 'Close', value: 'close' }] });
    if (v === 'share') {
      const head = cfg.mode === 'daily' ? `Sequence Memory daily #${FX.dayNumber()}` : `Sequence Memory (${LAYOUTS[cfg.layout].label}, ${MODES[cfg.mode].label})`;
      const dots = ['🟥', '🟧', '🟨', '🟩', '🟦', '🟪'];
      FX.copy(`${head} 🎵\nLevel ${level}\n${seq.slice(0, Math.min(level, 20)).map((i) => dots[i % 6]).join('')}`);
    }
    if (v === 'again') start();
    else idle();
  }

  function idle() {
    state = 'idle'; startBtn.hidden = false; startBtn.textContent = stats.games ? 'Play again' : 'Start';
    $('opts').classList.remove('is-locked');
    setStatus('Ready when you are.');
  }

  function rebuildPreview() {
    cfg = { layout: settings.mode === 'daily' ? 'g3' : settings.layout, mode: settings.mode, sound: settings.sound, chance: settings.chance };
    build(); hub(0); $('level').textContent = 0; paintBest(); lives = cfg.chance ? 1 : 0; paintLives();
  }

  FX.seg($('oLayout'), Object.entries(LAYOUTS).map(([v, l]) => ({ v, label: l.label })), settings.layout, (v) => { settings.layout = v; saveSettings(); rebuildPreview(); demo(); }, 'Board');
  FX.seg($('oMode'), Object.entries(MODES).map(([v, m]) => ({ v, label: m.label, sub: m.sub })), settings.mode, (v) => { settings.mode = v; saveSettings(); rebuildPreview(); }, 'Mode');
  FX.seg($('oSound'), Object.entries(SOUNDS).map(([v, l]) => ({ v, label: l })), settings.sound, (v) => { settings.sound = v; cfg.sound = v; saveSettings(); demo(); }, 'Instrument');
  $('chance').checked = settings.chance;
  $('chance').addEventListener('change', () => { settings.chance = $('chance').checked; saveSettings(); cfg.chance = settings.chance; lives = cfg.chance ? 1 : 0; paintLives(); });

  function demo() {
    if (state !== 'idle') return;
    const n = Math.min(5, pads.length);
    const order = [0, 1, 3, 2, 0].slice(0, n).map((x) => x % pads.length);
    order.forEach((i, k) => setTimeout(() => { if (state === 'idle') flash(i, 160); }, k * 130));
  }

  startBtn.addEventListener('click', start);
  FX.onKey((e) => {
    if (e.repeat) return;
    const k = e.key.toLowerCase();
    const map = KEYMAP[cfg.layout || settings.layout];
    if (k in map && state === 'input') { e.preventDefault(); press(map[k]); }
    else if ((k === 'enter' || k === ' ') && state === 'idle' && !startBtn.hidden && (document.activeElement === document.body || document.activeElement === startBtn)) { e.preventDefault(); start(); }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && (state === 'show' || state === 'input')) { clearTimers(); token++; state = 'paused'; setEnabled(false); setStatus('Paused'); }
    else if (!document.hidden && state === 'paused') playSeq();
  });

  const tabsApi = FX.tabs($('tabs'), [
    { id: 'how', label: 'How to play', render(p) {
      p.innerHTML = `<ul class="fx-howto">
        <li><i>👀</i><div><b>Watch</b><p>Pads light up and play a note, one after another.</p></div></li>
        <li><i>👆</i><div><b>Repeat</b><p>Play the same pads in the same order. Each level adds one more note to the end.</p></div></li>
        <li><i>🔁</i><div><b>Modes</b><p>Reverse wants the tune backwards. Speed plays faster and gives you 1.6 seconds per press. Chaos invents a brand new tune each level, so no building on the last one. Daily is the same sequence for everyone today.</p></div></li>
        <li><i>🎶</i><div><b>Use your ears</b><p>Every pad has its own pitch. Many people remember the melody rather than the positions. The Classic board uses tones close to the original 1978 Simon toy.</p></div></li>
      </ul><div class="fx-keys"><span>Classic: <span class="c-kbd">Q W A S</span> or <span class="c-kbd">1</span> to <span class="c-kbd">4</span></span><span>3×3: numpad or <span class="c-kbd">QWE ASD ZXC</span></span><span>4×4: <span class="c-kbd">1234 QWER ASDF ZXCV</span></span></div>`;
    } },
    { id: 'stats', label: 'Stats', render(p) {
      const lv = stats.levels, avg = lv.length ? (lv.reduce((a, b) => a + b, 0) / lv.length).toFixed(1) : '-';
      const top = Math.max(0, ...Object.values(stats.best));
      const b = []; for (let v = 0; v <= 24; v += 3) b.push({ label: v === 24 ? '24+' : `${v}`, n: lv.filter((x) => (v === 24 ? x >= 24 : x >= v && x < v + 3)).length });
      const last = lv[lv.length - 1]; b.forEach((x, i) => { x.hi = last != null && (i === 8 ? last >= 24 : last >= i * 3 && last < i * 3 + 3); });
      const rows = Object.entries(stats.best).sort((x, y) => y[1] - x[1]);
      p.innerHTML = `${FX.statGrid([[stats.games, 'Games'], [top || '-', 'Top level'], [avg, 'Average'], [stats.presses, 'Pads pressed']])}
        <h4>Levels reached</h4>${lv.length ? FX.histogram(b, { label: 'Levels reached' }) : '<p class="c-muted">Play a game to fill this in.</p>'}
        <h4>Best per board and mode</h4><div class="fx-hist-list">${rows.length ? rows.map(([k, v]) => { const [l, m] = k.split(':'); return `<div><span>${LAYOUTS[l]?.label || l} · ${MODES[m]?.label || m}</span><b>${v}</b></div>`; }).join('') : '<p class="c-muted">Nothing yet.</p>'}</div>`;
    } },
    { id: 'badges', label: 'Badges', render(p) { BADGES.render(p); } }
  ]);

  rebuildPreview();
  idle();
  window.__simon = { get seq() { return seq.slice(); }, get state() { return state; }, get pads() { return pads; }, expected: (k) => expected(k), get pos() { return pos; }, get cfg() { return cfg; } };
})();
