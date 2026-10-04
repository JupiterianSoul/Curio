(() => {
  const TEMPOS = [[60, 'Ballad'], [80, 'Stroll'], [100, 'Groove'], [120, 'March'], [140, 'Dance'], [160, 'Punk']];
  const PATTERNS = window.KB_PATTERNS || [];
  const $ = (id) => document.getElementById(id);
  const pad = $('pad'), big = $('big'), small = $('small'), ring = $('ring'), tapfx = $('tapfx'), arm = $('arm'), drum = $('drum');
  const BADGES = [
    ['first', '🥁', 'First Gig', 'Finish any game'],
    ['hold30', '🎯', 'Session Drummer', 'Hold the tempo under 30 ms average error'],
    ['hold15', '🤖', 'Human Click Track', 'Hold the tempo under 15 ms average error'],
    ['steady', '📏', 'Rock Steady', 'Finish within 1 BPM of the tempo'],
    ['long', '🏃', 'Marathon Set', 'Finish a 32 beat silent run'],
    ['setlist', '🎼', 'Full Setlist', 'Hold the tempo at all six tempos'],
    ['copy600', '🪘', 'Copycat', 'Score 600+ in Copy the Rhythm'],
    ['copy750', '🎺', 'Echo Chamber', 'Score 750+ in Copy the Rhythm'],
    ['perfect', '💯', 'Perfect Bar', '95+ on a single groove'],
    ['clave', '🥢', 'Clave Master', '85+ on a clave pattern'],
    ['guess400', '👂', 'Tempo Ears', 'Score 400+ in Guess the BPM'],
    ['exact', '🎧', 'Bang On', 'Guess a tempo exactly']
  ];
  const fresh = () => ({ v: 2, mode: 'hold', bpm: Curio.store.get('kb-bpm', 100), len: 'short', copy: 'normal', games: 0, history: [], badges: {}, tempos: {} });
  function load() {
    const d = Curio.store.get('kb:data', null);
    const f = d && typeof d === 'object' && d.v === 2 ? Object.assign(fresh(), d) : fresh();
    if (!['hold', 'copy', 'guess'].includes(f.mode)) f.mode = 'hold';
    if (!TEMPOS.some((t) => t[0] === f.bpm)) f.bpm = 100;
    if (!['short', 'long'].includes(f.len)) f.len = 'short';
    if (!['normal', 'hard', 'daily'].includes(f.copy)) f.copy = 'normal';
    if (!Array.isArray(f.history)) f.history = [];
    if (!f.tempos || typeof f.tempos !== 'object') f.tempos = {};
    return f;
  }
  const data = load();
  const save = () => Curio.store.set('kb:data', data);
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const hash = (s) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const mulberry = (seed) => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const buzz = (ms) => { try { navigator.vibrate?.(ms); } catch {} };

  let nodes = [], LAT = 0, noiseBuf = null;
  const AC = () => (Curio.muted ? null : Curio.audioContext());
  function latency() {
    const a = AC(); if (!a) return 0;
    return Math.min(80, ((a.outputLatency || 0) + (a.baseLatency || 0)) * 1000);
  }
  function noise(a) {
    if (noiseBuf && noiseBuf.sampleRate === a.sampleRate) return noiseBuf;
    const n = Math.floor(a.sampleRate * .5); noiseBuf = a.createBuffer(1, n, a.sampleRate);
    const ch = noiseBuf.getChannelData(0); for (let i = 0; i < n; i++) ch[i] = Math.random() * 2 - 1;
    return noiseBuf;
  }
  function sound(kind, perfMs, vol = 1) {
    const a = AC(); if (!a) return;
    const t = Math.max(a.currentTime, a.currentTime + (perfMs - LAT - performance.now()) / 1000);
    const env = (node, peak, dur) => { const gn = a.createGain(); gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(peak * vol, t + .002); gn.gain.exponentialRampToValueAtTime(.0001, t + dur); node.connect(gn).connect(a.destination); return gn; };
    if (kind === 'tick' || kind === 'tickHi') {
      const o = a.createOscillator(); o.type = 'square'; o.frequency.setValueAtTime(kind === 'tickHi' ? 1560 : 1040, t);
      env(o, .14, .06); o.start(t); o.stop(t + .08); nodes.push(o);
    } else if (kind === 'kick') {
      const o = a.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + .16);
      env(o, .5, .22); o.start(t); o.stop(t + .25); nodes.push(o);
    } else if (kind === 'snare' || kind === 'tap') {
      const s = a.createBufferSource(); s.buffer = noise(a);
      const f = a.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = kind === 'tap' ? 1800 : 1200;
      s.connect(f); env(f, kind === 'tap' ? .12 : .3, .14); s.start(t); s.stop(t + .16); nodes.push(s);
      const o = a.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(120, t + .08);
      env(o, kind === 'tap' ? .08 : .2, .09); o.start(t); o.stop(t + .1); nodes.push(o);
    } else if (kind === 'chime') {
      [523, 659, 784].forEach((fq, i) => { const o = a.createOscillator(); o.type = 'triangle'; o.frequency.value = fq; const tt = t + i * .07; const gn = a.createGain(); gn.gain.setValueAtTime(.0001, tt); gn.gain.exponentialRampToValueAtTime(.08 * vol, tt + .01); gn.gain.exponentialRampToValueAtTime(.0001, tt + .3); o.connect(gn).connect(a.destination); o.start(tt); o.stop(tt + .32); });
    }
  }
  function stopAudio() { nodes.forEach((n) => { try { n.stop(); } catch {} }); nodes = []; }

  let mode = data.mode, bpm = data.bpm;
  let state = 'idle', raf = 0, lockUntil = 0, newBadges = [];
  let T0 = 0, period = 600, offsets = [], lastIdx = -1, lastTap = 0, shownBeat = -1, LEAD = 8, SILENT = 16, TOTAL = 24;
  let copy = null, guess = null;

  function pulse(accent) {
    ring.classList.remove('is-on', 'is-accent'); void ring.offsetWidth;
    ring.classList.add('is-on'); if (accent) ring.classList.add('is-accent');
  }
  function hitFx() {
    tapfx.classList.remove('is-on'); void tapfx.offsetWidth; tapfx.classList.add('is-on');
    drum.classList.add('is-hit'); setTimeout(() => drum.classList.remove('is-hit'), 80);
    if (Math.random() < .5) {
      const n = document.createElement('span'); n.className = 'kb-note'; n.textContent = Curio.pick(['♪', '♫', '♩', '♬']);
      n.style.left = `${40 + Math.random() * 20}%`; n.style.top = '55%'; n.style.color = Curio.pick(['#ffd54f', '#ff8ad8', '#8ae8ff']);
      pad.append(n); setTimeout(() => n.remove(), 1000);
    }
  }
  function swing(now, t0, p, on) { arm.setAttribute('transform', on ? `rotate(${(26 * Math.cos(Math.PI * (now - t0) / p)).toFixed(1)} 50 104)` : 'rotate(0 50 104)'); }

  function paintModes() {
    document.querySelectorAll('#tabs .kb-tab').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.mode === mode)));
    $('tempos').innerHTML = TEMPOS.map(([b, name]) => `<button type="button" data-b="${b}" aria-pressed="${b === bpm}" ${state === 'run' ? 'disabled' : ''}>${b}<small>${name}</small></button>`).join('');
    document.querySelectorAll('#lengths button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.l === data.len)));
    document.querySelectorAll('#copyOpts button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.c === data.copy)));
    $('tempos').hidden = mode !== 'hold'; $('lengths').hidden = mode !== 'hold'; $('copyOpts').hidden = mode !== 'copy';
    $('beats').hidden = mode !== 'hold'; $('stepWrap').hidden = mode !== 'copy'; $('guessUi').hidden = mode !== 'guess';
  }
  function paintBeats() {
    const el = $('beats');
    el.innerHTML = '';
    for (let i = 0; i < TOTAL; i++) {
      if (i === LEAD) { const gap = document.createElement('span'); gap.className = 'is-gap'; el.append(gap); }
      const s = document.createElement('span');
      s.className = (i < LEAD ? 'is-music' : '') + (offsets[i] != null ? ' is-tap' + (i >= LEAD ? ' is-silent' : '') : '');
      el.append(s);
    }
  }

  function idle() {
    state = 'idle';
    cancelAnimationFrame(raf);
    stopAudio();
    pad.className = 'kb-pad';
    swing(0, 0, 1, false);
    copy = null; guess = null;
    if (mode === 'hold') {
      SILENT = data.len === 'long' ? 32 : 16; TOTAL = LEAD + SILENT;
      big.textContent = `${bpm} BPM`;
      const b = Curio.getBest(holdKey());
      small.textContent = 'Tap here or press Space to start' + (b != null ? ` · best ${b}ms` : '');
      offsets = [];
      paintBeats();
    } else if (mode === 'copy') {
      big.textContent = '🪘';
      const b = Curio.getBest(copyKey());
      small.textContent = 'Tap to hear the first groove' + (b != null ? ` · best ${b}/800` : '');
      buildSteps('x...x...x...x...', true);
      $('stepLabel').textContent = data.copy === 'daily' ? 'Daily grooves: the same 8 for everyone today.' : 'Eight grooves. Listen, then copy.';
    } else {
      big.textContent = '👂';
      const b = Curio.getBest('guess');
      small.textContent = 'Tap to hear the first tempo' + (b != null ? ` · best ${b}/500` : '');
      $('gGo').disabled = true; $('gReplay').disabled = true;
    }
    paintModes();
  }
  const holdKey = () => (data.len === 'long' ? 'tl' : 't') + bpm;
  const copyKey = () => data.copy === 'daily' ? `copy-daily-${today()}` : `copy-${data.copy}`;

  function startHold(stamp) {
    state = 'run';
    period = 60000 / bpm;
    SILENT = data.len === 'long' ? 32 : 16; TOTAL = LEAD + SILENT;
    LAT = latency();
    T0 = stamp + 900 + LAT;
    offsets = []; lastIdx = -1; lastTap = 0; shownBeat = -1;
    for (let i = 0; i < LEAD; i++) sound(i % 4 === 0 ? 'tickHi' : 'tick', T0 + i * period);
    pad.className = 'kb-pad';
    big.textContent = 'Listen…';
    small.textContent = 'Tap along with the clicks';
    $('results').hidden = true;
    paintBeats(); paintModes();
    raf = requestAnimationFrame(holdTick);
  }

  function holdTick() {
    if (state !== 'run') return;
    const now = performance.now();
    const beat = Math.floor((now - T0) / period + 0.0001);
    swing(now, T0, period, beat < LEAD);
    if (beat !== shownBeat && beat >= 0) {
      shownBeat = beat;
      if (beat < LEAD) {
        pulse(beat % 4 === 0);
        big.textContent = String(beat + 1);
        small.textContent = beat < 4 ? 'Tap along with the clicks' : beat < LEAD - 1 ? 'Get ready to fly solo…' : 'Going quiet!';
      } else if (beat === LEAD) {
        pad.classList.add('is-silent');
        small.textContent = 'Keep going on your own';
      }
    }
    if (beat >= LEAD) big.textContent = `🤫 ${offsets.slice(LEAD).filter((o) => o != null).length}/${SILENT}`;
    if (now > T0 + (TOTAL - 1) * period + period * 0.75) return finishHold();
    raf = requestAnimationFrame(holdTick);
  }

  function holdTap(stamp) {
    if (stamp < T0 - period * 0.5) return;
    let idx;
    if (lastIdx < 0) idx = Math.round((stamp - T0) / period);
    else idx = lastIdx + Math.max(1, Math.round((stamp - lastTap) / period));
    if (idx < 0 || idx >= TOTAL) return;
    if (lastIdx >= 0 && stamp - lastTap < period * 0.35) return;
    offsets[idx] = stamp - (T0 + idx * period);
    lastIdx = idx; lastTap = stamp;
    if (idx >= LEAD) sound('tap', performance.now() + LAT, .7);
    paintBeats();
    if (idx === TOTAL - 1) setTimeout(() => { if (state === 'run') finishHold(); }, 120);
  }

  function award(id) {
    if (data.badges[id]) return;
    data.badges[id] = Date.now();
    const b = BADGES.find((x) => x[0] === id);
    if (b) newBadges.push(b);
  }

  function showResults(icon, verdict, drift, stats, extraFn) {
    $('rIcon').textContent = icon;
    $('verdict').textContent = verdict;
    $('drift').textContent = drift;
    $('rStats').innerHTML = '';
    stats.forEach(([v, l]) => { const d = document.createElement('div'); d.className = 'c-stat'; const b = document.createElement('b'); b.textContent = v; const s = document.createElement('span'); s.textContent = l; d.append(b, s); $('rStats').append(d); });
    $('rBadges').innerHTML = '';
    newBadges.forEach((bd, i) => { const s = document.createElement('span'); s.textContent = `${bd[1]} ${bd[2]}`; s.style.animationDelay = `${.3 + i * .15}s`; $('rBadges').append(s); });
    $('chart').style.display = 'none'; $('rTable').innerHTML = '';
    extraFn && extraFn();
    const r = $('results'); r.hidden = false; r.classList.remove('is-on'); void r.offsetWidth; r.classList.add('is-on');
    save(); paintPanels();
    sound('chime', performance.now() + LAT);
    setTimeout(() => r.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 150);
  }

  function finishHold() {
    state = 'done';
    newBadges = [];
    lockUntil = performance.now() + 900;
    cancelAnimationFrame(raf);
    stopAudio();
    swing(0, 0, 1, false);
    pad.className = 'kb-pad is-done';
    const silent = [];
    for (let i = LEAD; i < TOTAL; i++) if (offsets[i] != null) silent.push([i, offsets[i]]);
    const missed = SILENT - silent.length;
    if (silent.length < 4) {
      big.textContent = '🙉';
      small.textContent = 'Too few taps in the quiet part. Tap to try again';
      $('results').hidden = true;
      paintModes();
      return;
    }
    const avgErr = Math.round((silent.reduce((s, [, o]) => s + Math.abs(o), 0) + missed * period * 0.5) / (silent.length + missed));
    const n = silent.length, mx = silent.reduce((s, [i]) => s + i, 0) / n;
    const tms = silent.map(([i, o]) => T0 + i * period + o), my = tms.reduce((a, b) => a + b, 0) / n;
    let num = 0, den = 0;
    silent.forEach(([i], k) => { num += (i - mx) * (tms[k] - my); den += (i - mx) ** 2; });
    const yourPeriod = den ? num / den : period;
    const yourBpm = 60000 / yourPeriod;
    const acc = Math.max(0, Math.min(100, Math.round(100 - avgErr / period * 200)));
    const before = Curio.getBest(holdKey());
    const b = Curio.best(holdKey(), avgErr, false);
    big.textContent = `${avgErr}ms`;
    small.textContent = 'average error · tap to go again';
    data.games++; data.tempos[bpm] = 1;
    data.history.push({ m: 'hold', s: avgErr, t: Date.now() });
    if (data.history.length > 150) data.history = data.history.slice(-150);
    award('first');
    if (avgErr < 30) award('hold30');
    if (avgErr < 15) award('hold15');
    if (Math.abs(yourBpm - bpm) < 1) award('steady');
    if (data.len === 'long') award('long');
    if (TEMPOS.every(([t]) => data.tempos[t])) award('setlist');
    const verdict = avgErr < 15 ? '🤖 Human click track' : avgErr < 30 ? '🥁 Session drummer' : avgErr < 50 ? '🎸 Garage band solid' : avgErr < 80 ? '🎹 A little rubato' : avgErr < 130 ? '🕺 Dancing to your own drum' : '🌊 Free jazz';
    const diff = yourBpm - bpm;
    const isPB = b.isNew && before != null;
    showResults(isPB ? '🏆' : avgErr < 30 ? '🥁' : '🎶', (isPB ? 'New best! ' : '') + verdict,
      (Math.abs(diff) < 1.5 ? `Rock steady: you held ${bpm} BPM almost exactly.` : diff > 0 ? `You rushed: sped up to about ${yourBpm.toFixed(0)} BPM. Classic excitement.` : `You dragged: slowed down to about ${yourBpm.toFixed(0)} BPM. Very relaxed.`) + (missed ? ` Missed ${missed} beat${missed === 1 ? '' : 's'}.` : ''),
      [[avgErr + 'ms', 'Avg error'], [acc + '%', 'Accuracy'], [yourBpm.toFixed(1), 'Your tempo'], [b.best + 'ms', 'Best here']],
      () => { $('chart').style.display = ''; chart(); });
    shareText = `Curio Keep the Beat 🥁\nHeld ${bpm} BPM for ${SILENT} silent beats: ${avgErr}ms average error, ended at ${yourBpm.toFixed(1)} BPM.`;
    paintModes();
    if (isPB || avgErr < 20 || newBadges.length) Curio.confetti();
  }

  function chart() {
    const svg = $('chart');
    const X0 = 48, X1 = 628, YM = 110, H = 84;
    const vals = offsets.filter((o) => o != null).map(Math.abs);
    const lim = Math.max(100, Math.ceil(Math.max(0, ...vals) / 50) * 50);
    const x = (i) => X0 + (i + .5) / TOTAL * (X1 - X0);
    const y = (o) => YM - Math.max(-1, Math.min(1, o / lim)) * H;
    const col = (o) => { const e = Math.abs(o) / period; return e < .05 ? 'var(--good)' : e < .12 ? 'var(--warn)' : 'var(--bad)'; };
    const mid = (x(LEAD - 1) + x(LEAD)) / 2;
    let out = `<rect x="${mid}" y="${YM - H - 8}" width="${X1 - mid}" height="${H * 2 + 16}" rx="8" fill="var(--surface-2)"/>`;
    out += `<text x="${(X0 + mid) / 2}" y="16" text-anchor="middle">with clicks</text><text x="${(mid + X1) / 2}" y="16" text-anchor="middle">on your own 🤫</text>`;
    [lim, lim / 2, 0, -lim / 2, -lim].forEach((v) => {
      out += `<line x1="${X0}" x2="${X1}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" stroke-width="${v === 0 ? 2 : 1}" ${v === 0 ? '' : 'stroke-dasharray="3 5"'}/>`;
      out += `<text x="${X0 - 6}" y="${y(v) + 4}" text-anchor="end">${v > 0 ? '+' : ''}${v}</text>`;
    });
    out += `<text x="${X0 - 6}" y="${YM + H + 30}" text-anchor="end">ms</text><text x="${X0 + 6}" y="${YM - H + 6}" text-anchor="start">↑ late</text><text x="${X0 + 6}" y="${YM + H - 2}" text-anchor="start">↓ early</text>`;
    let path = '';
    for (let i = 0; i < TOTAL; i++) {
      const o = offsets[i];
      if (o == null) { out += `<text x="${x(i)}" y="${YM + 4}" text-anchor="middle" fill="var(--bad)">×</text>`; continue; }
      path += `${path ? 'L' : 'M'}${x(i).toFixed(1)} ${y(o).toFixed(1)} `;
    }
    out += `<path d="${path}" fill="none" stroke="var(--ink-3)" stroke-width="2" stroke-linejoin="round"/>`;
    for (let i = 0; i < TOTAL; i++) {
      const o = offsets[i];
      if (o == null) continue;
      out += `<line x1="${x(i)}" x2="${x(i)}" y1="${YM}" y2="${y(o)}" stroke="${col(o)}" stroke-width="3" opacity=".45"/><circle cx="${x(i)}" cy="${y(o)}" r="5" fill="${col(o)}"><title>Beat ${i + 1}: ${o > 0 ? '+' : ''}${Math.round(o)}ms</title></circle>`;
    }
    for (let i = 0; i < TOTAL; i += 4) out += `<text x="${x(i)}" y="${YM + H + 30}" text-anchor="middle">${i + 1}</text>`;
    svg.innerHTML = out;
  }

  function buildSteps(pat, faint) {
    const el = $('steps');
    el.className = 'kb-steps' + (pat.length > 16 ? ' is-32' : '');
    el.innerHTML = '';
    for (let k = 0; k < pat.length; k++) {
      const s = document.createElement('span');
      s.className = (k % 4 === 0 ? 'is-beat' : '') + (pat[k] === 'x' && !faint ? ' is-note' : '');
      el.append(s);
    }
  }

  function copyStart() {
    const cfg = data.copy;
    const rnd = cfg === 'daily' ? mulberry(hash(`kb${today()}`)) : Math.random;
    const tiers = cfg === 'hard' ? [2, 2, 3, 3, 3, 4, 4, 4] : cfg === 'daily' ? [1, 2, 2, 3, 3, 3, 4, 4] : [1, 1, 2, 2, 2, 3, 3, 3];
    const bpms = cfg === 'hard' ? [95, 98, 100, 103, 106, 109, 112, 115] : cfg === 'daily' ? [88, 90, 92, 94, 96, 98, 100, 102] : [82, 84, 86, 88, 90, 92, 94, 96];
    const used = new Set();
    const rounds = tiers.map((tier, i) => {
      const pool = PATTERNS.filter((p) => p[2] === tier && !used.has(p[0]));
      const p = pool[Math.floor(rnd() * pool.length)] || PATTERNS[0];
      used.add(p[0]);
      return { name: p[0], pat: p[1], bpm: bpms[i] };
    });
    copy = { rounds, i: 0, scores: [] };
    $('results').hidden = true;
    copyRound();
  }

  function copyRound() {
    const r = copy.rounds[copy.i];
    const p = 60000 / r.bpm, step = p / 4, len = r.pat.length, bars = len / 16;
    LAT = latency();
    const now = performance.now();
    const T = now + 700 + LAT;
    const D = T + 4 * p, C2 = D + bars * 4 * p, U = C2 + 4 * p, E = U + len * step;
    Object.assign(copy, { p, step, len, T, D, C2, U, E, taps: [], shown: -1 });
    const totalBeats = 4 + bars * 4 + 4 + bars * 4;
    for (let i = 0; i < totalBeats; i++) {
      const at = T + i * p;
      const inCount = at < D || (at >= C2 && at < U);
      sound(i % 4 === 0 ? 'tickHi' : 'tick', at, inCount ? 1 : .45);
    }
    for (let k = 0; k < len; k++) if (r.pat[k] === 'x') sound(k % 8 === 0 ? 'kick' : 'snare', D + k * step);
    buildSteps(r.pat, true);
    $('stepLabel').textContent = `Groove ${copy.i + 1} of 8 · ${r.name} · ${r.bpm} BPM`;
    state = 'demo';
    pad.className = 'kb-pad';
    big.textContent = 'Listen…';
    small.textContent = 'Count-in, then the groove plays';
    paintModes();
    raf = requestAnimationFrame(copyTick);
  }

  function copyTick() {
    if (!copy || (state !== 'demo' && state !== 'play')) return;
    const now = performance.now();
    const c = copy, r = c.rounds[c.i];
    const cells = $('steps').children;
    swing(now, c.T, c.p, true);
    const beat = Math.floor((now - c.T) / c.p);
    if (beat !== c.shown && beat >= 0) { c.shown = beat; pulse(beat % 4 === 0); }
    [...cells].forEach((s) => s.classList.remove('is-now'));
    if (now < c.D) { big.textContent = String(4 - Math.max(0, Math.min(3, Math.floor((c.D - now) / c.p)))); small.textContent = 'Count-in…'; }
    else if (now < c.C2) {
      const k = Math.floor((now - c.D) / c.step);
      if (cells[k]) { cells[k].classList.add('is-now'); if (r.pat[k] === 'x' && !cells[k].classList.contains('is-play')) { cells[k].classList.add('is-play', 'is-note'); hitFx(); } }
      big.textContent = '🎧'; small.textContent = 'Listen to the groove';
    } else if (now < c.U) {
      if (state === 'demo') { [...cells].forEach((s, k) => { s.classList.remove('is-play'); s.classList.toggle('is-note', r.pat[k] === 'x'); }); }
      if (now > c.U - c.step * .6) state = 'play';
      big.textContent = String(4 - Math.max(0, Math.min(3, Math.floor((c.U - now) / c.p))));
      small.textContent = 'Your turn in…';
      if (data.copy === 'hard') [...cells].forEach((s) => s.classList.remove('is-note'));
    } else if (now < c.E + c.step * .6) {
      state = 'play';
      const k = Math.floor((now - c.U) / c.step);
      if (cells[k]) cells[k].classList.add('is-now');
      big.textContent = '🥁'; small.textContent = 'Play it back!';
    } else return judge();
    raf = requestAnimationFrame(copyTick);
  }

  function copyTap(stamp) {
    const c = copy;
    if (stamp < c.U - c.step * .6 || stamp > c.E + c.step * .6) return;
    c.taps.push(stamp);
    sound('tap', performance.now() + LAT, .8);
    const m = document.createElement('i');
    m.style.left = `${Math.max(0, Math.min(100, (stamp - c.U) / (c.len * c.step) * 100))}%`;
    $('steps').append(m);
  }

  function judge() {
    const c = copy, r = c.rounds[c.i];
    const tol = Math.min(c.step * .9, 180);
    const expected = [];
    for (let k = 0; k < c.len; k++) if (r.pat[k] === 'x') expected.push({ k, t: c.U + k * c.step });
    const used = new Set();
    let sum = 0;
    const cells = $('steps').children;
    expected.forEach((e) => {
      let bi = -1, be = Infinity;
      c.taps.forEach((t, i) => { if (used.has(i)) return; const d = Math.abs(t - e.t); if (d < be) { be = d; bi = i; } });
      if (bi >= 0 && be <= tol) { used.add(bi); sum += Math.max(0, 100 - be * 100 / tol); cells[e.k]?.classList.add('is-hit'); }
      else cells[e.k]?.classList.add('is-miss');
    });
    const extras = c.taps.length - used.size;
    const score = Math.max(0, Math.min(100, Math.round(sum / expected.length - extras * 8)));
    c.scores.push({ name: r.name, score, bpm: r.bpm, extras, missed: expected.length - used.size });
    state = 'between';
    lockUntil = performance.now() + 500;
    swing(0, 0, 1, false);
    big.textContent = `${score}`;
    const word = score >= 95 ? 'Perfect!' : score >= 80 ? 'Tight!' : score >= 60 ? 'Nice groove' : score >= 35 ? 'Loosely inspired' : 'Abstract';
    small.textContent = `${word} · tap for ${c.i + 1 < 8 ? 'the next groove' : 'your results'}`;
    if (score >= 80) { sound('chime', performance.now() + LAT); buzz(20); } else if (score < 35) buzz(60);
    if (score >= 95) Curio.confetti(50);
  }

  function copyNext() {
    copy.i++;
    if (copy.i < 8) return copyRound();
    state = 'done';
    newBadges = [];
    lockUntil = performance.now() + 900;
    pad.className = 'kb-pad is-done';
    const total = copy.scores.reduce((s, x) => s + x.score, 0);
    const before = Curio.getBest(copyKey());
    const b = Curio.best(copyKey(), total);
    big.textContent = `${total}`;
    small.textContent = 'out of 800 · tap to play again';
    data.games++;
    data.history.push({ m: 'copy', s: total, t: Date.now() });
    award('first');
    if (total >= 600) award('copy600');
    if (total >= 750) award('copy750');
    if (copy.scores.some((s) => s.score >= 95)) award('perfect');
    if (copy.scores.some((s) => /clave/i.test(s.name) && s.score >= 85)) award('clave');
    const isPB = b.isNew && before != null;
    const verdict = total >= 720 ? '🥁 Session pro' : total >= 600 ? '🪘 Groove machine' : total >= 450 ? '🎸 Solid bandmate' : total >= 300 ? '🎹 Getting the feel' : '🕺 Enthusiastic beginner';
    const scores = copy.scores;
    showResults(isPB ? '🏆' : '🪘', (isPB ? 'New best! ' : '') + verdict, `You scored ${total} out of 800 across eight grooves.`,
      [[total, 'Total'], [Math.round(total / 8), 'Avg groove'], [Math.max(...scores.map((s) => s.score)), 'Best groove'], [b.best, 'Best here']],
      () => { $('rTable').innerHTML = '<tr><th>#</th><th>Groove</th><th>BPM</th><th>Score</th></tr>' + scores.map((s, i) => `<tr><td>${i + 1}</td><td>${s.name}</td><td>${s.bpm}</td><td><b>${s.score}</b>${s.missed ? ` <span class="c-muted">(${s.missed} missed)</span>` : ''}</td></tr>`).join(''); });
    shareText = `Curio Keep the Beat 🪘 Copy the Rhythm${data.copy === 'daily' ? ` daily ${today()}` : ` (${data.copy})`}\n${total}/800\n` + scores.map((s) => s.score >= 80 ? '🟩' : s.score >= 50 ? '🟨' : '🟥').join('');
    paintModes();
    if (isPB || newBadges.length || total >= 700) Curio.confetti();
  }

  function guessStart() {
    guess = { i: 0, rounds: [], bpm: 0 };
    $('results').hidden = true;
    guessRound();
  }
  function guessRound() {
    guess.bpm = Curio.randInt(50, 200);
    $('gRange').value = 120; $('gVal').textContent = '120';
    $('gGo').textContent = 'Lock it in';
    playGuess();
  }
  function playGuess() {
    state = 'listen';
    $('gGo').disabled = true; $('gReplay').disabled = true;
    const p = 60000 / guess.bpm;
    LAT = latency();
    const T = performance.now() + 500 + LAT;
    for (let i = 0; i < 8; i++) sound(i % 4 === 0 ? 'tickHi' : 'tick', T + i * p);
    guess.T = T; guess.p = p; guess.shown = -1;
    big.textContent = '👂'; small.textContent = `Round ${guess.i + 1} of 5 · listen…`;
    pad.className = 'kb-pad';
    const loop = () => {
      if (state !== 'listen') return;
      const now = performance.now();
      const beat = Math.floor((now - T) / p);
      if (beat >= 0 && beat !== guess.shown && beat < 8) { guess.shown = beat; pulse(beat % 4 === 0); hitFx(); big.textContent = String(beat + 1); }
      swing(now, T, p, now >= T - p && beat < 8);
      if (now > T + 8 * p) { state = 'guess'; swing(0, 0, 1, false); big.textContent = '?'; small.textContent = 'Set the slider to the tempo and lock it in'; $('gGo').disabled = false; $('gReplay').disabled = false; return; }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  }
  function guessLock() {
    if (state === 'reveal') return guessNext();
    if (state !== 'guess') return;
    const g = +$('gRange').value, err = Math.abs(g - guess.bpm);
    const pts = Math.max(0, Math.round(100 - err * 3));
    guess.rounds.push({ bpm: guess.bpm, g, err, pts });
    state = 'reveal';
    big.textContent = `${guess.bpm} BPM`;
    small.textContent = `You said ${g}: +${pts}${err === 0 ? ' · bang on!' : err <= 3 ? ' · so close' : ''}`;
    $('gGo').textContent = guess.i + 1 < 5 ? 'Next tempo' : 'See results';
    $('gReplay').disabled = true;
    if (pts >= 85) sound('chime', performance.now() + LAT); else buzz(40);
    if (err === 0) Curio.confetti(50);
  }
  function guessNext() {
    guess.i++;
    if (guess.i < 5) return guessRound();
    state = 'done';
    newBadges = [];
    lockUntil = performance.now() + 900;
    pad.className = 'kb-pad is-done';
    const total = guess.rounds.reduce((s, r) => s + r.pts, 0);
    const before = Curio.getBest('guess');
    const b = Curio.best('guess', total);
    data.games++;
    data.history.push({ m: 'guess', s: total, t: Date.now() });
    award('first');
    if (total >= 400) award('guess400');
    if (guess.rounds.some((r) => r.err === 0)) award('exact');
    big.textContent = `${total}`; small.textContent = 'out of 500 · tap to play again';
    $('gGo').disabled = true; $('gGo').textContent = 'Lock it in';
    const avg = guess.rounds.reduce((s, r) => s + r.err, 0) / 5;
    const isPB = b.isNew && before != null;
    const rounds = guess.rounds;
    showResults(isPB ? '🏆' : '👂', (isPB ? 'New best! ' : '') + (avg <= 3 ? '🎧 Human metronome' : avg <= 8 ? '🎼 Conductor ears' : avg <= 15 ? '🎸 Band-ready' : avg <= 30 ? '🎵 Roughly right' : '🌊 Vibes only'),
      `Average miss of ${avg.toFixed(1)} BPM.`, [[total, 'Score'], [avg.toFixed(1), 'Avg miss'], [b.best, 'Best']],
      () => { $('rTable').innerHTML = '<tr><th>#</th><th>Tempo</th><th>You</th><th>Points</th></tr>' + rounds.map((r, i) => `<tr><td>${i + 1}</td><td>${r.bpm}</td><td>${r.g}</td><td><b>${r.pts}</b></td></tr>`).join(''); });
    shareText = `Curio Keep the Beat 👂 Guess the BPM\n${total}/500, average miss ${avg.toFixed(1)} BPM`;
    if (isPB || newBadges.length) Curio.confetti();
  }

  let shareText = '';

  function tap(stamp) {
    if (state === 'done' && stamp < lockUntil) return;
    hitFx();
    if (mode === 'hold') {
      if (state === 'idle' || state === 'done') return startHold(stamp);
      if (state === 'run') holdTap(stamp);
      return;
    }
    if (mode === 'copy') {
      if (state === 'idle' || state === 'done') return copyStart();
      if (state === 'between') { if (stamp >= lockUntil) copyNext(); return; }
      if (state === 'play' || state === 'demo') copyTap(stamp);
      return;
    }
    if (state === 'idle' || state === 'done') return guessStart();
    if (state === 'reveal') guessNext();
  }

  function paintPanels() {
    const got = BADGES.filter((b) => data.badges[b[0]]).length;
    $('badgeCount').textContent = `${got}/${BADGES.length}`;
    $('badgeList').innerHTML = '';
    BADGES.forEach(([id, ico, name, desc]) => {
      const d = document.createElement('div'); d.className = 'kb-badge' + (data.badges[id] ? ' is-got' : '');
      const i = document.createElement('i'); i.textContent = ico;
      const t = document.createElement('div'); const b = document.createElement('b'); b.textContent = name; const s = document.createElement('span'); s.textContent = desc;
      t.append(b, s); d.append(i, t); $('badgeList').append(d);
    });
    const hb = TEMPOS.map(([t]) => Curio.getBest('t' + t)).filter((v) => v != null);
    const rows = [[data.games, 'Games'], [hb.length ? Math.min(...hb) + 'ms' : '-', 'Best hold'], [Object.keys(data.tempos).length + '/6', 'Tempos played'],
      [Curio.getBest('copy-normal') ?? '-', 'Best copy'], [Curio.getBest('copy-hard') ?? '-', 'Best copy hard'], [Curio.getBest('guess') ?? '-', 'Best BPM guess']];
    $('statTbl').innerHTML = '';
    rows.forEach(([v, l]) => { const d = document.createElement('div'); const b = document.createElement('b'); b.textContent = v; const s = document.createElement('span'); s.textContent = l; d.append(b, s); $('statTbl').append(d); });
  }

  pad.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    tap(e.timeStamp || performance.now());
  });
  document.addEventListener('keydown', (e) => {
    if (e.code !== 'Space' && e.key !== ' ' && e.key !== 'Enter') return;
    if (mode === 'guess' && state === 'guess' && e.key === 'Enter') { e.preventDefault(); guessLock(); return; }
    if (e.target !== pad && e.target.closest && e.target.closest('button, input, a')) return;
    e.preventDefault();
    if (e.repeat) return;
    tap(e.timeStamp || performance.now());
  });
  const busy = () => ['run', 'demo', 'play', 'between', 'listen', 'guess', 'reveal'].includes(state);
  $('tabs').addEventListener('click', (e) => {
    const b = e.target.closest('.kb-tab'); if (!b) return;
    if (busy() && !confirmSwitch()) return;
    mode = b.dataset.mode; data.mode = mode; save(); $('results').hidden = true; idle();
  });
  const confirmSwitch = () => { Curio.toast('Run abandoned'); return true; };
  $('tempos').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b || state === 'run') return;
    bpm = +b.dataset.b; data.bpm = bpm; save();
    $('results').hidden = true; idle();
    Curio.beep(bpm * 8, .04, 'square', .06);
  });
  $('lengths').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b || state === 'run') return; data.len = b.dataset.l; save(); $('results').hidden = true; idle(); });
  $('copyOpts').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; data.copy = b.dataset.c; save(); $('results').hidden = true; idle(); });
  $('gRange').addEventListener('input', () => { $('gVal').textContent = $('gRange').value; });
  $('gMinus').addEventListener('click', () => { $('gRange').value = +$('gRange').value - 1; $('gVal').textContent = $('gRange').value; });
  $('gPlus').addEventListener('click', () => { $('gRange').value = +$('gRange').value + 1; $('gVal').textContent = $('gRange').value; });
  $('gGo').addEventListener('click', guessLock);
  $('gReplay').addEventListener('click', () => { if (state === 'guess') playGuess(); });
  $('again').addEventListener('click', () => { $('results').hidden = true; idle(); pad.focus({ preventScroll: true }); pad.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
  $('share').addEventListener('click', () => { navigator.clipboard?.writeText(shareText).then(() => Curio.toast('Result copied!'), () => Curio.toast(shareText.split('\n')[1] || '')); });
  document.querySelector('.kb-ptabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]'); if (!b) return;
    document.querySelectorAll('.kb-ptabs [data-tab]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    document.querySelectorAll('[data-pane]').forEach((p) => { p.hidden = p.dataset.pane !== b.dataset.tab; });
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && busy()) { idle(); Curio.toast('Paused: the band waits for nobody, but we will'); }
  });
  idle();
  paintPanels();
  window.__kb = { get state() { return state; }, get copy() { return copy; }, get guess() { return guess; }, get T0() { return T0; }, get period() { return period; } };
})();
