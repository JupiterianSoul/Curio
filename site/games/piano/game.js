(() => {
  const $ = (id) => document.getElementById(id);
  const SONGS = window.PIANO_SONGS, CATS = window.PIANO_CATS;
  const NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  const SOLF = ['Do', 'Di', 'Re', 'Ri', 'Mi', 'Fa', 'Fi', 'Sol', 'Si', 'La', 'Li', 'Ti'];
  const pc = (m) => ((m % 12) + 12) % 12;
  const isBlack = (m) => [1, 3, 6, 8, 10].includes(pc(m));
  const nameOf = (m) => NAMES[pc(m)] + (Math.floor(m / 12) - 1);
  const freq = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const colOf = (m, l = 62) => `hsl(${pc(m) * 30} 88% ${l}%)`;
  const KEYMAP = ['a', 'w', 's', 'e', 'd', 'f', 't', 'g', 'y', 'h', 'u', 'j', 'k', 'o', 'l', 'p', ';', "'"];
  const VER = 2, KEY = 'piano-v2';
  const vib = (p) => { try { navigator.vibrate?.(p); } catch {} };

  const INST = [
    { id: 'piano', name: 'Grand piano', c: '#ff5a36', parts: [[1, 1, 'triangle'], [2, 0.45, 'sine'], [3, 0.18, 'sine'], [4, 0.08, 'sine']], a: 0.004, d: 1.8, decay: true, r: 0.35, vol: 0.32, rev: 0.22, hammer: 0.12 },
    { id: 'epiano', name: 'Electric piano', c: '#e07b39', fm: { ratio: 1, index: 1.6, decay: 0.7 }, parts: [[1, 1, 'sine']], a: 0.003, d: 2.2, decay: true, r: 0.3, vol: 0.3, rev: 0.25 },
    { id: 'organ', name: 'Church organ', c: '#9b5de5', parts: [[0.5, 0.5, 'sine'], [1, 1, 'sine'], [2, 0.6, 'sine'], [3, 0.35, 'sine'], [4, 0.25, 'sine'], [8, 0.1, 'sine']], a: 0.03, d: 0.1, s: 0.9, r: 0.12, vol: 0.14, rev: 0.45, vib: { rate: 6, depth: 4, delay: 0.1 } },
    { id: 'harpsi', name: 'Harpsichord', c: '#b08900', parts: [[1, 0.7, 'sawtooth'], [2, 0.3, 'square']], a: 0.002, d: 1.2, decay: true, r: 0.15, vol: 0.12, rev: 0.2, filter: { type: 'highpass', f: 380, q: 0.7 } },
    { id: 'strings', name: 'String section', c: '#c0392b', parts: [[1, 0.5, 'sawtooth', -8], [1, 0.5, 'sawtooth', 8], [2, 0.1, 'sawtooth', 0]], a: 0.28, d: 0.4, s: 0.85, r: 0.6, vol: 0.11, rev: 0.5, filter: { type: 'lowpass', f: 2600, q: 0.7 }, vib: { rate: 5.5, depth: 6, delay: 0.3 } },
    { id: 'choir', name: 'Choir aah', c: '#1c9cf0', parts: [[1, 0.6, 'sawtooth', -6], [1, 0.6, 'sawtooth', 6]], a: 0.22, d: 0.3, s: 0.9, r: 0.5, vol: 0.12, rev: 0.55, formants: [[800, 6, 1], [1150, 8, 0.6], [2900, 10, 0.25]], vib: { rate: 5, depth: 7, delay: 0.25 } },
    { id: 'marimba', name: 'Marimba', c: '#a0522d', parts: [[1, 1, 'sine'], [4, 0.25, 'sine'], [10, 0.05, 'sine']], a: 0.002, d: 0.6, decay: true, r: 0.2, vol: 0.42, rev: 0.2 },
    { id: 'box', name: 'Music box', c: '#f15bb5', parts: [[2, 1, 'sine'], [8, 0.15, 'sine'], [5.4, 0.08, 'sine']], a: 0.002, d: 1.1, decay: true, r: 0.6, vol: 0.3, rev: 0.4 },
    { id: 'bells', name: 'Celesta', c: '#00bbf9', fm: { ratio: 3.5, index: 2.4, decay: 0.4 }, parts: [[2, 1, 'sine']], a: 0.002, d: 2.4, decay: true, r: 0.6, vol: 0.22, rev: 0.45 },
    { id: 'guitar', name: 'Nylon guitar', c: '#2ec27e', pluck: true, a: 0.002, d: 1.6, decay: true, r: 0.2, vol: 0.5, rev: 0.2 },
    { id: 'lead', name: 'Synth lead', c: '#00c49a', parts: [[1, 0.6, 'sawtooth'], [1.006, 0.5, 'square'], [0.5, 0.3, 'sawtooth']], a: 0.01, d: 0.3, s: 0.6, r: 0.2, vol: 0.1, rev: 0.2, filter: { type: 'lowpass', f: 2200, q: 3, env: 3500 } },
    { id: 'chip', name: 'Chiptune', c: '#6a4c93', parts: [[1, 0.6, 'square']], a: 0.001, d: 0.15, s: 0.7, r: 0.05, vol: 0.08, rev: 0.05 }
  ];
  const INST_BY = Object.fromEntries(INST.map((i) => [i.id, i]));
  const ICONS = {
    piano: '<rect x="5" y="9" width="22" height="14" rx="2" fill="#fff"/><path d="M10 9v8M15 9v8M20 9v8" stroke="#222" stroke-width="2.4"/>',
    epiano: '<rect x="4" y="11" width="24" height="10" rx="2" fill="#fff"/><circle cx="9" cy="8" r="2" fill="#fff"/><circle cx="16" cy="8" r="2" fill="#fff"/><circle cx="23" cy="8" r="2" fill="#fff"/>',
    organ: '<path d="M7 25V12M11 25V8M16 25V5M21 25V8M25 25V12" stroke="#fff" stroke-width="3" stroke-linecap="round"/>',
    harpsi: '<path d="M6 24 26 24 26 20C18 20 12 14 10 6L6 6Z" fill="#fff"/>',
    strings: '<path d="M10 25c-4-3-3-7 0-9 2-1 2-3 1-5l4-4 4 4c-1 2-1 4 1 5 3 2 4 6 0 9z" fill="#fff"/><path d="M16 9v15" stroke="#c0392b" stroke-width="1.5"/>',
    choir: '<circle cx="11" cy="12" r="4" fill="#fff"/><circle cx="21" cy="12" r="4" fill="#fff"/><path d="M5 25c0-5 3-7 6-7s6 2 6 7M15 25c0-5 3-7 6-7s6 2 6 7" fill="#fff"/>',
    marimba: '<path d="M6 8h4v16H6zM12 10h4v12h-4zM18 12h4v8h-4zM24 14h3v4h-3z" fill="#fff"/>',
    box: '<rect x="6" y="13" width="20" height="12" rx="2" fill="#fff"/><path d="M6 13 9 7h14l3 6" fill="none" stroke="#fff" stroke-width="2"/><circle cx="16" cy="19" r="2.5" fill="#f15bb5"/>',
    bells: '<path d="M16 5c-5 0-7 4-7 9v5l-3 4h20l-3-4v-5c0-5-2-9-7-9z" fill="#fff"/><circle cx="16" cy="26" r="2.5" fill="#fff"/>',
    guitar: '<circle cx="12" cy="20" r="6.5" fill="#fff"/><path d="m15 17 11-11" stroke="#fff" stroke-width="3" stroke-linecap="round"/><circle cx="12" cy="20" r="2" fill="#2ec27e"/>',
    lead: '<path d="M4 20 9 9l5 11 5-11 5 11 4-8" fill="none" stroke="#fff" stroke-width="2.6" stroke-linejoin="round"/>',
    chip: '<path d="M8 8h16v16H8z" fill="#fff"/><path d="M11 11h4v4h-4zM17 17h4v4h-4z" fill="#6a4c93"/>'
  };

  function load() {
    const def = { v: VER, inst: Curio.store.get('piano-inst', 'piano'), labels: 'keys', chord: 'off', lmode: 'wait', lspeed: 0.75, ckey: 0, bpm: 100, songs: {}, ach: {}, stats: { notes: 0, insts: {}, pads: {}, maxCombo: 0 }, daily: {}, rec: [] };
    const raw = Curio.store.get(KEY, null);
    if (!raw || typeof raw !== 'object' || raw.v !== VER) {
      const oldRec = Curio.store.get('piano-rec', []);
      if (Array.isArray(oldRec)) def.rec = oldRec.filter((e) => e && typeof e.m === 'number');
      return def;
    }
    const s = { ...def, ...raw };
    s.stats = { ...def.stats, ...(raw.stats || {}) };
    s.songs = raw.songs && typeof raw.songs === 'object' ? raw.songs : {};
    s.ach = raw.ach && typeof raw.ach === 'object' ? raw.ach : {};
    s.daily = raw.daily && typeof raw.daily === 'object' ? raw.daily : {};
    s.rec = Array.isArray(raw.rec) ? raw.rec : [];
    return s;
  }
  const S = load();
  if (!INST_BY[S.inst]) S.inst = 'piano';
  const save = () => Curio.store.set(KEY, S);

  let master = null, revIn = null, analyser = null, meterBuf = null;
  function impulse(a, sec) {
    const len = Math.floor(a.sampleRate * sec), b = a.createBuffer(2, len, a.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    return b;
  }
  function ac() {
    const a = Curio.audioContext(); if (!a) return null;
    if (!master) {
      master = a.createGain(); master.gain.value = 0.55;
      const comp = a.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4;
      revIn = a.createGain(); const conv = a.createConvolver(); conv.buffer = impulse(a, 2.2); const wet = a.createGain(); wet.gain.value = 0.5;
      analyser = a.createAnalyser(); analyser.fftSize = 512; meterBuf = new Float32Array(analyser.fftSize);
      master.connect(comp); revIn.connect(conv).connect(wet).connect(comp); comp.connect(analyser); analyser.connect(a.destination);
    }
    return a;
  }
  const ksCache = new Map();
  function ksBuffer(a, m) {
    if (ksCache.has(m)) return ksCache.get(m);
    const sr = a.sampleRate, len = Math.floor(sr * 1.8), b = a.createBuffer(1, len, sr), d = b.getChannelData(0);
    const N = Math.max(2, Math.round(sr / freq(m))), buf = new Float32Array(N);
    for (let i = 0; i < N; i++) buf[i] = Math.random() * 2 - 1;
    for (let k = 0; k < 2; k++) for (let i = 1; i < N; i++) buf[i] = (buf[i] + buf[i - 1]) * 0.5;
    const damp = Math.min(0.999, 0.9975 - (m - 52) * 0.00012);
    let idx = 0;
    for (let i = 0; i < len; i++) { const nx = (idx + 1) % N, v = buf[idx]; d[i] = v; buf[idx] = (v + buf[nx]) * 0.5 * damp; idx = nx; }
    ksCache.set(m, b); return b;
  }
  let noiseBuf = null;
  const voices = new Map();
  function noteOn(m, vel = 0.8) {
    if (Curio.muted) return;
    const a = ac(); if (!a) return;
    const old = voices.get(m); if (old) { stopVoice(old, 0.03); voices.delete(m); }
    const P = INST_BY[S.inst], t = a.currentTime, f0 = freq(m);
    const peak = P.vol * (0.35 + vel * 0.8) * (m > 84 ? 0.7 : 1);
    const env = a.createGain();
    env.gain.setValueAtTime(0.0001, t); env.gain.linearRampToValueAtTime(peak, t + P.a);
    if (P.decay) env.gain.setTargetAtTime(0.0001, t + P.a, P.d / 3.5 * (m > 76 ? 0.7 : 1));
    else env.gain.setTargetAtTime(peak * P.s, t + P.a, Math.max(0.01, P.d / 3));
    let inp = env;
    if (P.filter) {
      const f = a.createBiquadFilter(); f.type = P.filter.type; f.Q.value = P.filter.q ?? 1;
      if (P.filter.env) { f.frequency.setValueAtTime(P.filter.f + P.filter.env * vel, t); f.frequency.setTargetAtTime(P.filter.f, t, 0.15); } else f.frequency.value = P.filter.f;
      f.connect(env); inp = f;
    }
    if (P.formants) {
      const sum = a.createGain();
      P.formants.forEach(([fq, q, gg]) => { const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = fq; bp.Q.value = q; const g2 = a.createGain(); g2.gain.value = gg * 3; sum.connect(bp); bp.connect(g2).connect(env); });
      inp = sum;
    }
    env.connect(master);
    if (P.rev) { const s = a.createGain(); s.gain.value = P.rev; env.connect(s).connect(revIn); }
    const srcs = [];
    let vibG = null;
    if (P.vib) {
      const l = a.createOscillator(); l.frequency.value = P.vib.rate; vibG = a.createGain();
      vibG.gain.setValueAtTime(0, t); vibG.gain.linearRampToValueAtTime(P.vib.depth, t + (P.vib.delay || 0) + 0.25);
      l.connect(vibG); l.start(t); srcs.push(l);
    }
    if (P.pluck) {
      const src = a.createBufferSource(); src.buffer = ksBuffer(a, m); const g2 = a.createGain(); g2.gain.value = 1;
      src.connect(g2).connect(inp); src.start(t); srcs.push(src);
    } else P.parts.forEach(([mul, amp, type, det]) => {
      const o = a.createOscillator(); o.type = type; o.frequency.value = f0 * mul; if (det) o.detune.value = det;
      if (vibG) vibG.connect(o.detune);
      const g2 = a.createGain(); g2.gain.value = amp;
      if (P.decay && mul > 1.5) g2.gain.setTargetAtTime(0, t, P.d / (mul * 2));
      if (P.fm) {
        const mo = a.createOscillator(); mo.frequency.value = f0 * mul * P.fm.ratio;
        const mg = a.createGain(), idx = P.fm.index * f0 * mul * (0.5 + vel * 0.6);
        mg.gain.setValueAtTime(idx, t); mg.gain.setTargetAtTime(idx * 0.06, t, P.fm.decay / 3);
        mo.connect(mg).connect(o.frequency); mo.start(t); srcs.push(mo);
      }
      o.connect(g2).connect(inp); o.start(t); srcs.push(o);
    });
    if (P.hammer) {
      if (!noiseBuf) { noiseBuf = a.createBuffer(1, a.sampleRate * 0.05, a.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
      const n = a.createBufferSource(); n.buffer = noiseBuf; const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = Math.min(8000, f0 * 6); bp.Q.value = 1.5;
      const ng = a.createGain(); ng.gain.setValueAtTime(P.hammer * vel, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
      n.connect(bp).connect(ng).connect(env); n.start(t); srcs.push(n);
    }
    const v = { env, srcs, P };
    voices.set(m, v);
    if (P.decay) {
      const life = P.d * 1.3 + 0.6;
      srcs.forEach((s) => { try { s.stop(t + life); } catch {} });
      setTimeout(() => { if (voices.get(m) === v) voices.delete(m); }, life * 1000);
    }
  }
  function stopVoice(v, rel) {
    const a = ac(); if (!a || !v) return; const t = a.currentTime;
    v.env.gain.cancelScheduledValues(t); v.env.gain.setValueAtTime(Math.max(0.0001, v.env.gain.value), t); v.env.gain.setTargetAtTime(0.0001, t, rel / 3);
    v.srcs.forEach((o) => { try { o.stop(t + rel + 0.1); } catch {} });
  }
  function noteOff(m, now = false) {
    const v = voices.get(m); if (!v) return;
    if (sustain && !now) return;
    stopVoice(v, now ? 0.02 : v.P.r); voices.delete(m);
  }
  const allOff = () => [...voices.keys()].forEach((m) => noteOff(m, true));

  const keysEl = $('keys'), roll = $('roll'), rg = roll.getContext('2d');
  let mode = 'free', base = 48, kbBase = 48, keyEls = new Map(), geom = new Map(), lo = 48, hi = 84;
  const fitWhites = () => { const w = keysEl.clientWidth || innerWidth; return w < 520 ? 10 : w < 800 ? 15 : 22; };
  function build(l, h) {
    while (isBlack(l)) l--; while (isBlack(h)) h++;
    lo = l; hi = h;
    keysEl.innerHTML = ''; keyEls = new Map();
    let whites = 0; for (let m = lo; m <= hi; m++) if (!isBlack(m)) whites++;
    let wi = 0;
    for (let m = lo; m <= hi; m++) {
      const el = document.createElement('div');
      el.className = 'pn-k ' + (isBlack(m) ? 'pn-b' : 'pn-w');
      el.dataset.m = m; el.setAttribute('role', 'button'); el.setAttribute('aria-label', nameOf(m));
      el.style.setProperty('--kc', colOf(m, isBlack(m) ? 50 : 70));
      el.innerHTML = '<span class="kb"></span><span class="nm"></span>';
      if (isBlack(m)) { el.style.left = `calc(${(wi / whites) * 100}% - ${(0.6 / whites) * 50}%)`; el.style.width = `${(0.6 / whites) * 100}%`; }
      else wi++;
      keysEl.append(el); keyEls.set(m, el);
    }
    labelKeys();
    $('down').disabled = mode === 'learn' ? kbBase <= 24 : base <= 24;
    $('up').disabled = mode === 'learn' ? kbBase >= 96 : hi >= 105;
    requestAnimationFrame(computeGeom);
  }
  function labelKeys() {
    keyEls.forEach((el, m) => {
      const ki = m - kbBase, kb = KEYMAP[ki];
      el.querySelector('.kb').textContent = S.labels === 'keys' && kb ? (kb === ';' || kb === "'" ? kb : kb.toUpperCase()) : '';
      let nm = '';
      if (S.labels === 'keys') nm = pc(m) === 0 ? nameOf(m) : '';
      else if (S.labels === 'names') nm = isBlack(m) ? NAMES[pc(m)] : NAMES[pc(m)] + (pc(m) === 0 ? Math.floor(m / 12) - 1 : '');
      else if (S.labels === 'solfege') nm = SOLF[pc(m)];
      el.querySelector('.nm').textContent = nm;
    });
  }
  function freeBuild() {
    const w = fitWhites(); let m = base, c = 0;
    while (c < w) { if (!isBlack(m)) c++; m++; }
    kbBase = base; build(base, m - 1);
  }
  function computeGeom() {
    const r = roll.getBoundingClientRect(); geom = new Map();
    keyEls.forEach((el, m) => { const k = el.getBoundingClientRect(); geom.set(m, { x: k.left - r.left, w: k.width, b: isBlack(m) }); });
    const dpr = Math.min(2, devicePixelRatio || 1);
    roll.width = Math.round(r.width * dpr); roll.height = Math.round(r.height * dpr);
    rg.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function lcd(t) { $('lcd').textContent = t; }
  function shift(d) {
    if (mode === 'learn') { const nb = kbBase + 12 * d; if (nb < 24 || nb > 96) return; kbBase = nb; labelKeys(); $('down').disabled = kbBase <= 24; $('up').disabled = kbBase >= 96; lcd(`Typing keys start at ${nameOf(kbBase)}`); return; }
    const nb = base + 12 * d; if (nb < 24 || nb > 96) return; base = nb; freeBuild(); lcd(`${nameOf(lo)} to ${nameOf(hi)} · ${INST_BY[S.inst].name}`);
  }
  $('down').addEventListener('click', () => shift(-1));
  $('up').addEventListener('click', () => shift(1));

  const bars = [], sparks = [], chordHeld = new Map();
  const CHORDS = { maj: [0, 4, 7], min: [0, 3, 7], 7: [0, 4, 7, 10], pow: [0, 7, 12] };
  function light(m, on) { keyEls.get(m)?.classList.toggle('on', on); }
  function sound(m, vel) {
    noteOn(m, vel); light(m, true);
    bars.push({ m, t0: performance.now(), t1: 0 });
    if (bars.length > 160) bars.splice(0, 40);
  }
  function unsound(m) {
    noteOff(m); light(m, false);
    for (let i = bars.length - 1; i >= 0; i--) if (bars[i].m === m && !bars[i].t1) { bars[i].t1 = performance.now(); break; }
  }
  function press(m, vel = 0.8) {
    dismissSplash();
    let notes = [m];
    if (mode === 'free' && S.chord !== 'off') notes = CHORDS[S.chord].map((i) => m + i);
    chordHeld.set(m, notes);
    notes.forEach((n) => sound(n, vel));
    S.stats.notes++; S.stats.insts[S.inst] = 1;
    if (S.stats.notes === 1) unlock('first');
    if (S.stats.notes >= 1000) unlock('notes1000');
    if (INST.every((i) => S.stats.insts[i.id])) unlock('insts');
    if (recording) recEvents.push({ t: Math.round(performance.now() - recStart), m, on: 1, v: Math.round(vel * 100) / 100 });
    if (!L) lcd(`♪ ${notes.map(nameOf).join(' ')}${S.chord !== 'off' && mode === 'free' ? ` (${NAMES[pc(m)]}${{ maj: '', min: 'm', 7: '7', pow: '5' }[S.chord]})` : ''}`);
    if (L) learnPress(m);
    saveSoon();
  }
  function release(m) {
    const notes = chordHeld.get(m) || [m]; chordHeld.delete(m);
    notes.forEach(unsound);
    if (recording) recEvents.push({ t: Math.round(performance.now() - recStart), m, on: 0 });
  }
  let saveT = 0; const saveSoon = () => { clearTimeout(saveT); saveT = setTimeout(save, 800); };

  const active = new Map();
  const keyAt = (x, y) => { const el = document.elementFromPoint(x, y)?.closest?.('.pn-k'); return el && keysEl.contains(el) ? el : null; };
  const velAt = (el, y) => { const r = el.getBoundingClientRect(); return Math.min(1, Math.max(0.35, 0.35 + (y - r.top) / r.height * 0.75)); };
  keysEl.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    e.preventDefault();
    const el = keyAt(e.clientX, e.clientY); if (!el) return;
    try { keysEl.setPointerCapture(e.pointerId); } catch {}
    const m = +el.dataset.m; active.set(e.pointerId, m); press(m, velAt(el, e.clientY));
  });
  keysEl.addEventListener('pointermove', (e) => {
    if (!active.has(e.pointerId)) return;
    const el = keyAt(e.clientX, e.clientY), m = el ? +el.dataset.m : null, prev = active.get(e.pointerId);
    if (m !== prev) { if (prev != null) release(prev); if (m != null) press(m, velAt(el, e.clientY)); active.set(e.pointerId, m); }
  });
  const upH = (e) => { const m = active.get(e.pointerId); if (m != null) release(m); active.delete(e.pointerId); };
  keysEl.addEventListener('pointerup', upH); keysEl.addEventListener('pointercancel', upH);
  keysEl.addEventListener('contextmenu', (e) => e.preventDefault());
  let mdrag = false, mouseKey = null;
  Curio.drag(keysEl, {
    start: (p) => {
      if (p.pointerType !== 'mouse') return;
      p.event?.preventDefault(); mdrag = true;
      const el = keyAt(p.clientX, p.clientY); mouseKey = el ? +el.dataset.m : null;
      if (el) press(mouseKey, velAt(el, p.clientY));
    },
    move: (p) => {
      if (!mdrag) return;
      const el = keyAt(p.clientX, p.clientY), m = el ? +el.dataset.m : null;
      if (m !== mouseKey) { if (mouseKey != null) release(mouseKey); if (m != null) press(m, velAt(el, p.clientY)); mouseKey = m; }
    },
    end: () => { if (!mdrag) return; mdrag = false; if (mouseKey != null) release(mouseKey); mouseKey = null; }
  });
  addEventListener('curio:touchpad', (e) => { if (e.detail) Curio.toast('Touchpad mode: click a key to hold it, slide across keys for a glissando, click again to let go', 3600); });

  const held = new Map();
  addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.target.matches('input, textarea, select')) return;
    if (document.querySelector('.curio-modal')) return;
    const k = e.key.toLowerCase();
    if (k === ' ') { if (e.target.matches('button') && !e.target.closest('.pn-keys')) return; e.preventDefault(); if (!e.repeat) setSustain(!sustain); return; }
    if (k === 'z') { shift(-1); return; } if (k === 'x') { shift(1); return; }
    if (k === ',' || k === '.') { const i = INST.findIndex((x) => x.id === S.inst); setInst(INST[(i + (k === '.' ? 1 : -1) + INST.length) % INST.length].id, true); return; }
    if (mode === 'chords' && /^[1-7]$/.test(k)) { if (!e.repeat) padDown(+k - 1); return; }
    if (k === 'escape' && L) { quitLearn(); return; }
    const i = KEYMAP.indexOf(k); if (i < 0 || e.repeat) return;
    e.preventDefault(); const m = kbBase + i; held.set(k, m); press(m, 0.8);
  });
  addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    if (mode === 'chords' && /^[1-7]$/.test(k)) { padUp(+k - 1); return; }
    const m = held.get(k); if (m != null) { held.delete(k); release(m); }
  });
  addEventListener('blur', () => { held.forEach((m) => release(m)); held.clear(); });

  function setInst(id, announce) {
    S.inst = id; save();
    document.querySelectorAll('.pn-inst').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.i === id)));
    const b = document.querySelector(`.pn-inst[data-i="${id}"]`), box = $('insts');
    if (b) { const bl = b.getBoundingClientRect().left - box.getBoundingClientRect().left + box.scrollLeft; if (bl < box.scrollLeft || bl + b.offsetWidth > box.scrollLeft + box.clientWidth) box.scrollTo({ left: bl - 8, behavior: 'smooth' }); }
    lcd(`${INST_BY[id].name}`);
    if (announce) { const m = 60; noteOn(m, 0.7); setTimeout(() => noteOff(m), 300); }
  }
  INST.forEach((it) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'pn-inst'; b.dataset.i = it.id;
    b.innerHTML = `<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="${it.c}"/>${ICONS[it.id]}</svg><span></span>`;
    b.querySelector('span').textContent = it.name;
    b.addEventListener('click', () => { setInst(it.id, true); dismissSplash(); });
    $('insts').append(b);
  });

  let sustain = false;
  function setSustain(v) {
    sustain = v; $('sustain').setAttribute('aria-pressed', String(v));
    if (!v) [...voices.keys()].forEach((m) => { if (![...active.values()].includes(m) && ![...held.values()].includes(m) && !padNotes.has(m)) noteOff(m); });
    lcd(v ? 'Sustain on' : 'Sustain off');
  }
  $('sustain').addEventListener('click', () => setSustain(!sustain));

  function segBind(boxId, attr, get, put) {
    const box = $(boxId);
    const paint = () => box.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset[attr] === String(get()))));
    box.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { put(b.dataset[attr]); paint(); save(); Curio.beep(620, 0.04, 'sine', 0.05); }));
    paint(); return paint;
  }
  segBind('labels', 'l', () => S.labels, (v) => { S.labels = v; labelKeys(); });
  segBind('chordMode', 'c', () => S.chord, (v) => { S.chord = v; lcd(v === 'off' ? 'One note per key' : `One-finger ${({ maj: 'major', min: 'minor', 7: 'seventh', pow: 'power' })[v]} chords`); });
  segBind('lspeed', 's', () => S.lspeed, (v) => { S.lspeed = +v; });

  let recording = false, recStart = 0, recEvents = S.rec, playTimers = [];
  $('play').disabled = !recEvents.some((e) => e.on);
  $('rec').addEventListener('click', () => {
    recording = !recording;
    $('rec').setAttribute('aria-pressed', String(recording));
    $('rec').textContent = recording ? '⏹ Stop' : '⏺ Record';
    if (recording) { stopPlayback(); recEvents = []; recStart = performance.now(); lcd('● Recording… play something!'); }
    else {
      const n = recEvents.filter((e) => e.on).length;
      lcd(n ? `Recorded ${n} notes. Press play back!` : 'Nothing recorded');
      $('play').disabled = !n; S.rec = recEvents.slice(0, 3000); save();
    }
  });
  function stopPlayback() { playTimers.forEach(clearTimeout); playTimers = []; $('play').textContent = '▶ Play back'; keyEls.forEach((el) => el.classList.remove('on')); }
  $('play').addEventListener('click', () => {
    if (playTimers.length) { stopPlayback(); allOff(); return; }
    if (!recEvents.length) return;
    const first = recEvents[0].t; $('play').textContent = '⏹ Stop';
    lcd('▶ Playing your masterpiece');
    recEvents.forEach((ev) => playTimers.push(setTimeout(() => { if (ev.on) sound(ev.m, ev.v || 0.8); else unsound(ev.m); }, ev.t - first)));
    playTimers.push(setTimeout(() => { stopPlayback(); lcd('Encore?'); unlock('rec'); }, recEvents[recEvents.length - 1].t - first + 400));
  });

  let metroOn = false, metroNext = 0, metroBeat = 0, metroTimer = 0;
  $('bpm').value = S.bpm; $('bpmV').textContent = S.bpm;
  $('bpm').addEventListener('input', () => { S.bpm = +$('bpm').value; $('bpmV').textContent = S.bpm; saveSoon(); });
  function click(t, acc) {
    const a = ac(); if (!a || Curio.muted) return;
    const o = a.createOscillator(), g2 = a.createGain(); o.type = 'square'; o.frequency.value = acc ? 1760 : 1200;
    g2.gain.setValueAtTime(0.0001, t); g2.gain.exponentialRampToValueAtTime(acc ? 0.12 : 0.07, t + 0.002); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    o.connect(g2).connect(a.destination); o.start(t); o.stop(t + 0.06);
  }
  function metroTick() {
    const a = ac(); if (!a) return;
    while (metroNext < a.currentTime + 0.12) { click(metroNext, metroBeat % 4 === 0); const beat = metroBeat; setTimeout(() => flashBeat(beat), Math.max(0, (metroNext - a.currentTime) * 1000)); metroNext += 60 / S.bpm; metroBeat++; }
  }
  let beatFlash = 0;
  function flashBeat(b) { beatFlash = b % 4 === 0 ? 1 : 0.6; }
  $('metro').addEventListener('click', () => {
    metroOn = !metroOn; $('metro').setAttribute('aria-pressed', String(metroOn));
    clearInterval(metroTimer);
    if (metroOn) { const a = ac(); if (!a) return; metroNext = a.currentTime + 0.05; metroBeat = 0; metroTick(); metroTimer = setInterval(metroTick, 25); if (Curio.muted) Curio.toast('Sound is muted, the beat will only flash'); }
  });

  const KEYS = [{ n: 'C', r: 60 }, { n: 'G', r: 55 }, { n: 'D', r: 62 }, { n: 'A', r: 57 }, { n: 'E', r: 64 }, { n: 'F', r: 53 }, { n: 'B♭', r: 58 }];
  const DEG = [{ r: 'I', s: [0, 4, 7], q: '' }, { r: 'ii', s: [2, 5, 9], q: 'm' }, { r: 'iii', s: [4, 7, 11], q: 'm' }, { r: 'IV', s: [5, 9, 12], q: '' }, { r: 'V', s: [7, 11, 14], q: '' }, { r: 'vi', s: [9, 12, 16], q: 'm' }, { r: 'vii°', s: [11, 14, 17], q: '°' }];
  const PADC = ['#ff5a36', '#ffb400', '#2ec27e', '#1c9cf0', '#9b5de5', '#f15bb5', '#6a4c93'];
  const padEls = [], padNotes = new Map(), padOn = new Map();
  const ckBox = $('chordKey');
  KEYS.forEach((k, i) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = k.n; b.dataset.k = i; b.addEventListener('click', () => { S.ckey = i; paintPads(); save(); }); ckBox.append(b); });
  DEG.forEach((d, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'pn-pad'; b.style.setProperty('--pc', PADC[i]);
    b.innerHTML = '<span></span><small></small>';
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch {} padDown(i); });
    b.addEventListener('pointerup', () => padUp(i)); b.addEventListener('pointercancel', () => padUp(i));
    b.addEventListener('keydown', (e) => { if ((e.key === 'Enter') && !e.repeat) { padDown(i); setTimeout(() => padUp(i), 500); } });
    $('pads').append(b); padEls.push(b);
  });
  function chordName(i) { const k = KEYS[S.ckey], root = k.r + DEG[i].s[0]; return NAMES[pc(root)].replace('A♯', 'B♭').replace('D♯', 'E♭').replace('G♯', 'A♭') + DEG[i].q; }
  function paintPads() {
    ckBox.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.k === S.ckey)));
    padEls.forEach((b, i) => { b.querySelector('span').textContent = chordName(i); b.querySelector('small').textContent = `${DEG[i].r} · ${i + 1}`; b.setAttribute('aria-label', `${chordName(i)} chord`); });
  }
  function padDown(i) {
    if (padOn.has(i)) return;
    dismissSplash();
    const k = KEYS[S.ckey], notes = DEG[i].s.map((s) => k.r + s);
    notes.push(k.r + DEG[i].s[0] - 12);
    padOn.set(i, notes);
    notes.forEach((n) => { padNotes.set(n, (padNotes.get(n) || 0) + 1); sound(n, 0.75); });
    padEls[i].classList.add('hit');
    lcd(`♪ ${chordName(i)}  (${DEG[i].r})`);
    S.stats.pads[i] = 1; if (Object.keys(S.stats.pads).length >= 4) unlock('pads');
    S.stats.notes += notes.length; saveSoon();
    if (recording) notes.forEach((m) => recEvents.push({ t: Math.round(performance.now() - recStart), m, on: 1, v: 0.75 }));
  }
  function padUp(i) {
    const notes = padOn.get(i); if (!notes) return; padOn.delete(i);
    notes.forEach((n) => { const c = (padNotes.get(n) || 1) - 1; if (c <= 0) padNotes.delete(n); else padNotes.set(n, c); unsound(n); });
    padEls[i].classList.remove('hit');
    if (recording) notes.forEach((m) => recEvents.push({ t: Math.round(performance.now() - recStart), m, on: 0 }));
  }
  paintPads();

  function parseSong(song, speed) {
    const spb = 60 / song.bpm / speed, evs = [];
    let beat = 0;
    for (const tok of song.n.trim().split(/\s+/)) {
      if (tok === '|') continue;
      const [ns, ds] = tok.split(':'); const d = ds ? parseFloat(ds) : 1;
      if (ns !== 'R') {
        const ms = ns.split('+').map((x) => { const mm = x.match(/^([A-G])([#b]?)(\d)$/); return 12 * (+mm[3] + 1) + { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[mm[1]] + (mm[2] === '#' ? 1 : mm[2] === 'b' ? -1 : 0); });
        evs.push({ t: beat * spb, d: Math.max(0.12, d * spb * 0.92), ms, hit: new Set(), done: false, judged: false, played: false });
      }
      beat += d;
    }
    return evs;
  }
  const noteCount = (s) => parseSong(s, 1).reduce((a, e) => a + e.ms.length, 0);

  let L = null;
  const hud = { score: $('hScore'), combo: $('hCombo'), acc: $('hAcc') };
  function bumpHud(el) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
  function startSong(song, lmode = S.lmode) {
    quitLearn(true); stopPlayback(); allOff();
    if (mode !== 'learn') setMode('learn', true);
    const evs = parseSong(song, lmode === 'watch' ? Math.max(0.75, S.lspeed) : S.lspeed);
    const all = evs.flatMap((e) => e.ms), mn = Math.min(...all), mx = Math.max(...all);
    let l = mn, h = mx; while (isBlack(l)) l--; while (isBlack(h)) h++;
    const need = fitWhites(); let whites = 0; for (let m = l; m <= h; m++) if (!isBlack(m)) whites++;
    let flip = 0; while (whites < need) { if (flip++ % 2) { do l--; while (isBlack(l)); } else { do h++; while (isBlack(h)); } whites++; }
    kbBase = mn - pc(mn);
    build(l, h);
    const total = all.length;
    L = { song, evs, mode: lmode, songT: -3.2, total, score: 0, combo: 0, maxCombo: 0, perfect: 0, good: 0, miss: 0, wrong: 0, hits: 0, paused: false, end: evs[evs.length - 1].t + evs[evs.length - 1].d, cd: 3 };
    $('hud').hidden = false; $('progBox').hidden = false; $('prog').style.width = '0';
    hud.score.textContent = '0'; hud.combo.textContent = '0'; hud.acc.textContent = '100%';
    hud.score.parentElement.style.display = lmode === 'along' ? '' : 'none';
    hud.combo.parentElement.style.display = lmode === 'watch' ? 'none' : '';
    hud.acc.parentElement.style.display = lmode === 'watch' ? 'none' : '';
    dismissSplash();
    lcd(`${lmode === 'watch' ? 'Watching' : lmode === 'wait' ? 'Learning' : 'Playing along'}: ${song.t}`);
    $('case').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function quitLearn(silent) {
    if (!L) return;
    L = null; allOff();
    $('hud').hidden = true; $('progBox').hidden = true; $('count').hidden = true;
    keyEls.forEach((el) => el.classList.remove('next', 'on'));
    if (!silent) { lcd('Stopped. Pick another song?'); if (mode === 'learn') freeBuildForLearn(); }
  }
  function freeBuildForLearn() { kbBase = base; freeBuild(); }
  $('quitBtn').addEventListener('click', () => quitLearn());
  $('pauseBtn').addEventListener('click', () => { if (!L) return; L.paused = !L.paused; $('pauseBtn').textContent = L.paused ? '▶' : '❚❚'; lcd(L.paused ? 'Paused' : `Back to ${L.song.t}`); if (L.paused) allOff(); });

  function pending() { return L.evs.find((e) => !e.done); }
  function learnPress(m) {
    if (!L || L.paused || L.songT < -0.4) return;
    if (L.mode === 'wait') {
      const ev = pending(); if (!ev) return;
      if (ev.ms.includes(m) && L.songT >= ev.t - 0.35) {
        ev.hit.add(m);
        if (ev.ms.every((x) => ev.hit.has(x))) {
          ev.done = true; L.hits += ev.ms.length; L.combo++; L.maxCombo = Math.max(L.maxCombo, L.combo); burst(ev.ms, true); paintHud();
        }
      } else if (!ev.ms.includes(m)) { L.wrong++; L.combo = 0; flashBad(m); paintHud(); }
    } else if (L.mode === 'along') {
      let best = null, bd = 1e9;
      for (const ev of L.evs) {
        if (ev.t > L.songT + 0.3) break;
        if (!ev.ms.includes(m) || ev.hit.has(m)) continue;
        const d = Math.abs(ev.t - L.songT); if (d < 0.22 && d < bd) { bd = d; best = ev; }
      }
      if (best) {
        best.hit.add(m); L.hits++;
        const perfect = bd < 0.08; if (perfect) L.perfect++; else L.good++;
        L.combo++; L.maxCombo = Math.max(L.maxCombo, L.combo);
        const mult = 1 + Math.min(4, Math.floor(L.combo / 10)) * 0.25;
        L.score += Math.round((perfect ? 100 : 60) * mult);
        burst([m], perfect); floatText(m, perfect ? 'Perfect' : 'Good', perfect ? '#ffd23f' : '#7dff9b');
        if (best.ms.every((x) => best.hit.has(x))) best.done = true;
        paintHud(true);
      } else { L.wrong++; L.combo = 0; flashBad(m); paintHud(); }
    }
  }
  function flashBad(m) { const el = keyEls.get(m); if (el) { el.classList.remove('bad'); void el.offsetWidth; el.classList.add('bad'); } vib(15); }
  function accOf() { const d = L.hits + L.wrong + L.miss; return d ? Math.round(100 * L.hits / d) : 100; }
  function paintHud(scored) {
    hud.combo.textContent = L.combo; hud.score.textContent = Curio.fmt(L.score); hud.acc.textContent = accOf() + '%';
    if (scored) bumpHud(hud.score);
    if (L.combo && L.combo % 10 === 0) { bumpHud(hud.combo); Curio.beep(1320, 0.06, 'triangle', 0.05); }
    S.stats.maxCombo = Math.max(S.stats.maxCombo || 0, L.combo);
    if (L.combo >= 50) unlock('combo50');
  }
  function updateLearn(dt) {
    if (!L || L.paused) return;
    const wasNeg = L.songT < 0;
    if (L.songT < 0) {
      const before = Math.ceil(-L.songT);
      L.songT += dt;
      const after = Math.ceil(-L.songT);
      if (after !== before && after >= 1 && after <= 3) countdown(after);
      if (L.songT >= 0 && wasNeg) countdown(0);
      return;
    }
    if (L.mode === 'wait') {
      const ev = pending();
      if (ev && L.songT + dt >= ev.t) L.songT = Math.max(L.songT, ev.t);
      else L.songT += dt;
      keyEls.forEach((el) => el.classList.remove('next'));
      if (ev && ev.t - L.songT < 0.6) ev.ms.forEach((m) => { if (!ev.hit.has(m)) keyEls.get(m)?.classList.add('next'); });
    } else L.songT += dt;
    if (L.mode === 'along') {
      for (const ev of L.evs) {
        if (ev.t > L.songT - 0.22) break;
        if (!ev.judged) { ev.judged = true; const missed = ev.ms.filter((m) => !ev.hit.has(m)).length; if (missed) { L.miss += missed; L.combo = 0; paintHud(); } ev.done = true; }
      }
    }
    if (L.mode === 'watch') {
      for (const ev of L.evs) {
        if (ev.t > L.songT) break;
        if (!ev.played) {
          ev.played = true;
          ev.ms.forEach((m) => { sound(m, 0.75); setTimeout(() => { if (L && L.mode === 'watch') unsound(m); }, ev.d * 1000); });
          burst(ev.ms, false);
        }
      }
    }
    $('prog').style.width = `${Math.min(100, (L.songT / L.end) * 100)}%`;
    if (L.songT > L.end + 0.6) finishSong();
  }
  function countdown(n) {
    const el = $('count'); el.hidden = false; el.textContent = n ? n : 'Go!';
    el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick');
    const a = ac(); if (a) click(a.currentTime + 0.01, n === 0);
    if (n === 0) setTimeout(() => { el.hidden = true; }, 800);
  }
  async function finishSong() {
    const R = L; L = null; allOff();
    $('hud').hidden = true; $('progBox').hidden = true;
    keyEls.forEach((el) => el.classList.remove('next', 'on'));
    const song = R.song;
    if (R.mode === 'watch') {
      unlock('watch');
      const v = await Curio.modal({ emoji: '👏', title: 'Your turn!', body: `That was ${song.t}. Ready to try it with the notes waiting for you?`, buttons: [{ label: '🐢 Wait for me', value: 'wait' }, { label: '🎯 Play along', value: 'along' }, { label: 'Back to library', value: 'lib' }] });
      if (v === 'wait' || v === 'along') { S.lmode = v; paintLmode(); startSong(song, v); } else freeBuildForLearn();
      return;
    }
    const acc = Math.max(0, Math.min(100, R.total ? Math.round(100 * R.hits / (R.total + R.wrong)) : 100));
    const stars = acc >= 95 ? 3 : acc >= 80 ? 2 : acc >= 50 ? 1 : 0;
    const rec = S.songs[song.id] || { stars: 0, acc: 0, score: 0, plays: 0 };
    const newBest = stars > rec.stars || (R.mode === 'along' && R.score > rec.score);
    rec.stars = Math.max(rec.stars, stars); rec.acc = Math.max(rec.acc, acc); if (R.mode === 'along') rec.score = Math.max(rec.score, R.score); rec.plays++;
    S.songs[song.id] = rec;
    if (stars >= 1) unlock('song1');
    if (stars === 3) unlock('star3');
    if (R.mode === 'along' && acc === 100 && R.wrong === 0) unlock('flawless');
    if (R.mode === 'along' && S.lspeed >= 1 && stars >= 1) unlock('fast');
    const done = SONGS.filter((s) => (S.songs[s.id]?.stars || 0) >= 1);
    if (done.length >= 10) unlock('songs10');
    if (CATS.filter((c) => c.id !== 'all').every((c) => done.some((s) => s.cat === c.id))) unlock('cats');
    let dailyMsg = '';
    if (song.id === dailySong().id && stars >= 2 && !S.daily[todayKey()]) { S.daily[todayKey()] = 1; unlock('daily'); dailyMsg = 'Song of the day complete! '; }
    save(); paintLib(); paintDaily(); paintStats();
    if (stars >= 2) Curio.confetti(stars === 3 ? 180 : 90);
    [523, 659, 784, 1047].slice(0, stars + 1).forEach((f, i) => setTimeout(() => Curio.beep(f, 0.2, 'triangle', 0.09), 250 * i + 200));
    const box = document.createElement('div'); box.className = 'pn-result';
    const st = document.createElement('div'); st.className = 'pn-stars';
    for (let i = 0; i < 3; i++) { const s = document.createElement('span'); s.textContent = '⭐'; if (i < stars) s.className = 'on'; st.append(s); }
    const grid = document.createElement('div'); grid.className = 'pn-rgrid';
    const cells = R.mode === 'along'
      ? [[Curio.fmt(R.score), 'Score'], [acc + '%', 'Accuracy'], [R.maxCombo, 'Best combo'], [R.perfect, 'Perfect'], [R.good, 'Good'], [R.miss + R.wrong, 'Missed']]
      : [[acc + '%', 'Accuracy'], [R.total, 'Notes'], [R.wrong, 'Wrong keys']];
    cells.forEach(([b, s]) => { const d = document.createElement('div'); d.innerHTML = '<b></b><span></span>'; d.querySelector('b').textContent = b; d.querySelector('span').textContent = s; grid.append(d); });
    const p = document.createElement('p'); p.className = 'c-muted'; p.style.margin = '0';
    p.textContent = dailyMsg + (newBest ? 'New personal best! ' : '') + ['Keep at it, every pianist started with one finger.', 'Not bad! Try it slower to nail the tricky bits.', 'Lovely playing.', 'Concert hall material. Take a bow.'][stars];
    box.append(st, grid, p);
    const idx = SONGS.indexOf(song), next = SONGS[(idx + 1) % SONGS.length];
    const v = await Curio.modal({ emoji: stars === 3 ? '🏆' : stars ? '🎶' : '🎹', title: song.t, body: box, buttons: [{ label: '↻ Play again', value: 'again' }, { label: `Next: ${next.t.length > 22 ? next.t.slice(0, 21) + '…' : next.t}`, value: 'next' }, { label: '📋 Share', value: 'share' }, { label: 'Library', value: 'lib' }] });
    if (v === 'again') startSong(song, R.mode);
    else if (v === 'next') startSong(next, R.mode);
    else {
      freeBuildForLearn();
      if (v === 'share') {
        const txt = `🎹 I played "${song.t}" on Zoble Piano: ${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)} ${acc}% accuracy${R.mode === 'along' ? `, ${Curio.fmt(R.score)} points, ${R.maxCombo} combo` : ''}.`;
        try { await navigator.clipboard.writeText(txt); Curio.toast('Result copied to clipboard'); } catch { Curio.toast(txt, 4000); }
      }
    }
  }

  const floats = [];
  function burst(ms, big) {
    ms.forEach((m) => {
      const k = geom.get(m); if (!k) return;
      for (let i = 0; i < (big ? 16 : 8); i++) sparks.push({ x: k.x + k.w / 2 + (Math.random() - 0.5) * k.w * 0.6, y: rollH(), vx: (Math.random() - 0.5) * 120, vy: -60 - Math.random() * 180, life: 1, c: colOf(m, 66) });
    });
    if (sparks.length > 400) sparks.splice(0, sparks.length - 400);
  }
  function floatText(m, t, c) { const k = geom.get(m); if (k) floats.push({ x: k.x + k.w / 2, y: rollH() - 18, t, c, life: 1 }); }
  const rollH = () => roll.clientHeight;
  function rr(x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); rg.beginPath(); rg.moveTo(x + r, y); rg.arcTo(x + w, y, x + w, y + h, r); rg.arcTo(x + w, y + h, x, y + h, r); rg.arcTo(x, y + h, x, y, r); rg.arcTo(x, y, x + w, y, r); rg.closePath(); }
  const dust = Array.from({ length: 40 }, () => ({ x: Math.random(), y: Math.random(), s: 0.5 + Math.random() * 1.5, v: 0.01 + Math.random() * 0.03 }));
  function drawRoll(now, dt) {
    const W = roll.clientWidth, H = roll.clientHeight; if (!W || !H) return;
    rg.clearRect(0, 0, W, H);
    rg.fillStyle = 'rgba(255,255,255,.035)';
    geom.forEach((k, m) => { if (!k.b && pc(m) === 0) rg.fillRect(k.x, 0, 1, H); });
    rg.fillStyle = 'rgba(255,255,255,.35)';
    for (const d of dust) { d.y -= d.v * dt; if (d.y < 0) { d.y = 1; d.x = Math.random(); } rg.globalAlpha = 0.25 + 0.25 * Math.sin(now / 900 + d.x * 20); rg.fillRect(d.x * W, d.y * H, d.s, d.s); }
    rg.globalAlpha = 1;
    if (beatFlash > 0) { rg.fillStyle = `rgba(255,210,63,${beatFlash * 0.12})`; rg.fillRect(0, 0, W, H); beatFlash = Math.max(0, beatFlash - dt * 3); }
    const pps = H / 2.4;
    if (L) {
      for (const ev of L.evs) {
        const yb = H - (ev.t - L.songT) * pps, yt = yb - ev.d * pps;
        if (yt > H + 4) continue;
        if (yb < -10) break;
        for (const m of ev.ms) {
          const k = geom.get(m); if (!k) continue;
          const pad = k.b ? 1 : 3, x = k.x + pad, w = k.w - pad * 2;
          const hit = ev.hit.has(m), gone = ev.judged && !hit && L.mode === 'along';
          const col = colOf(m, k.b ? 52 : 62);
          rg.save();
          rg.globalAlpha = gone ? 0.25 : hit ? 0.45 : 1;
          rg.shadowColor = col; rg.shadowBlur = hit || gone ? 0 : 12;
          const gr = rg.createLinearGradient(0, yt, 0, yb); gr.addColorStop(0, colOf(m, 74)); gr.addColorStop(1, col);
          rg.fillStyle = gr; rr(x, yt, w, Math.max(6, yb - yt), 6); rg.fill();
          rg.shadowBlur = 0; rg.strokeStyle = 'rgba(255,255,255,.55)'; rg.lineWidth = 1; rg.stroke();
          if (yb - yt > 18 && w > 14) { rg.fillStyle = 'rgba(0,0,0,.55)'; rg.font = `800 ${Math.min(12, w * 0.5)}px system-ui, sans-serif`; rg.textAlign = 'center'; rg.fillText(S.labels === 'solfege' ? SOLF[pc(m)] : NAMES[pc(m)], x + w / 2, yb - 6); }
          rg.restore();
        }
      }
    }
    for (let i = bars.length - 1; i >= 0; i--) {
      const b = bars[i], k = geom.get(b.m); if (!k) { if (!keyEls.has(b.m)) bars.splice(i, 1); continue; }
      const sp = 0.12;
      const top = H - (now - b.t0) * sp, bot = b.t1 ? H - (now - b.t1) * sp : H;
      if (bot < -4) { bars.splice(i, 1); continue; }
      const pad = k.b ? 1 : 4, x = k.x + pad, w = k.w - pad * 2, col = colOf(b.m, 60);
      const gr = rg.createLinearGradient(0, top, 0, bot); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.25, col); gr.addColorStop(1, colOf(b.m, 75));
      rg.save(); rg.globalAlpha = L ? 0.35 : 0.85; rg.shadowColor = col; rg.shadowBlur = 16; rg.fillStyle = gr; rr(x, Math.max(-10, top), w, Math.max(4, bot - Math.max(-10, top)), 5); rg.fill(); rg.restore();
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i]; p.life -= dt * 1.4; if (p.life <= 0) { sparks.splice(i, 1); continue; }
      p.vy += 260 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      rg.globalAlpha = p.life; rg.fillStyle = p.c; rg.beginPath(); rg.arc(p.x, p.y, 2 + p.life * 2, 0, Math.PI * 2); rg.fill();
    }
    rg.globalAlpha = 1;
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i]; f.life -= dt * 1.5; f.y -= 40 * dt; if (f.life <= 0) { floats.splice(i, 1); continue; }
      rg.globalAlpha = f.life; rg.fillStyle = f.c; rg.font = '900 13px system-ui, sans-serif'; rg.textAlign = 'center'; rg.fillText(f.t, f.x, f.y);
    }
    rg.globalAlpha = 1;
    const ln = rg.createLinearGradient(0, H - 3, 0, H); ln.addColorStop(0, 'rgba(255,90,54,0)'); ln.addColorStop(1, L ? 'rgba(255,210,63,.95)' : 'rgba(255,90,54,.6)');
    rg.fillStyle = ln; rg.fillRect(0, H - 6, W, 6);
  }

  let introOn = true;
  function dismissSplash() { if (!introOn) return; introOn = false; $('splash').classList.add('out'); setTimeout(() => { $('splash').hidden = true; }, 400); }
  $('splashLearn').addEventListener('click', () => { dismissSplash(); setMode('learn'); });
  $('splashDaily').addEventListener('click', () => { dismissSplash(); startSong(dailySong()); });

  function setMode(m, keepSong) {
    if (!keepSong) quitLearn(true);
    mode = m;
    document.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.mode === m)));
    document.querySelectorAll('[data-panel]').forEach((p) => { p.hidden = p.dataset.panel !== m; });
    if (!keepSong) { kbBase = base; freeBuild(); }
    if (m === 'chords' && S.inst === 'piano') lcd('Tip: chord pads sound lush on Strings or Choir');
    else if (m === 'learn') lcd('Pick a song from the library below');
    else lcd(`${nameOf(lo)} to ${nameOf(hi)} · ${INST_BY[S.inst].name}`);
  }
  document.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => { setMode(b.dataset.mode); dismissSplash(); Curio.beep(560, 0.05, 'sine', 0.05); }));

  const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  function hashStr(s) { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  const dailySong = () => SONGS[hashStr('piano' + todayKey()) % SONGS.length];
  function paintDaily() {
    const s = dailySong(), done = S.daily[todayKey()];
    const box = $('daily'); box.innerHTML = '';
    const i = document.createElement('i'); i.textContent = done ? '✅' : '⭐';
    const d = document.createElement('div'); const b = document.createElement('b'); b.textContent = `Song of the day: ${s.t}`; const sm = document.createElement('small'); sm.textContent = done ? 'Done for today. Come back tomorrow for a new one.' : 'Earn two stars or more to complete it.';
    d.append(b, sm);
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'c-btn'; btn.textContent = '▶ Play'; btn.addEventListener('click', () => startSong(s));
    box.append(i, d, btn);
  }

  let cat = 'all', query = '';
  const CATCOL = { nursery: '#f15bb5', classical: '#9b5de5', folk: '#2ec27e', holiday: '#e63946', chords: '#1c9cf0' };
  const CATIC = { nursery: '🧸', classical: '🎻', folk: '🪕', holiday: '🎄', chords: '🎼' };
  CATS.forEach((c) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = c.name; b.dataset.c = c.id; b.addEventListener('click', () => { cat = c.id; paintLib(); }); $('cats').append(b); });
  $('search').addEventListener('input', () => { query = $('search').value.trim().toLowerCase(); paintLib(); });
  function paintLib() {
    $('cats').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.c === cat)));
    const box = $('lib'); box.innerHTML = '';
    const list = SONGS.filter((s) => (cat === 'all' || s.cat === cat) && (!query || (s.t + ' ' + s.by).toLowerCase().includes(query)));
    if (!list.length) { const e = document.createElement('div'); e.className = 'pn-empty'; e.textContent = 'No songs match. Try "Beethoven" or "bells".'; box.append(e); return; }
    list.forEach((s) => {
      const r = S.songs[s.id], stars = r?.stars || 0;
      const b = document.createElement('button'); b.type = 'button'; b.className = 'pn-song'; b.style.setProperty('--sc', CATCOL[s.cat]);
      b.innerHTML = '<span class="ic"></span><b></b><small></small><span class="meta"><span class="lv"></span><span class="st"></span><span class="c-muted"></span></span>';
      b.querySelector('.ic').textContent = CATIC[s.cat];
      b.querySelector('b').textContent = s.t;
      b.querySelector('small').textContent = s.by;
      b.querySelector('.lv').textContent = '♪'.repeat(s.lv) + '·'.repeat(3 - s.lv);
      b.querySelector('.lv').title = ['Easy', 'Medium', 'Tricky'][s.lv - 1];
      const st = b.querySelector('.st'); st.textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars); if (!stars) st.classList.add('none');
      b.querySelector('.c-muted').textContent = `${noteCount(s)} notes`;
      b.setAttribute('aria-label', `${s.t}, ${['easy', 'medium', 'tricky'][s.lv - 1]}, ${stars} stars`);
      b.addEventListener('click', () => startSong(s));
      box.append(b);
    });
  }
  function paintStats() {
    const done = SONGS.filter((s) => (S.songs[s.id]?.stars || 0) >= 1).length, three = SONGS.filter((s) => S.songs[s.id]?.stars === 3).length;
    const box = $('pstats'); box.innerHTML = '';
    [[Curio.fmt(S.stats.notes), 'Notes played'], [`${done}/${SONGS.length}`, 'Songs learned'], [three, 'Three-star songs'], [S.stats.maxCombo || 0, 'Best combo']].forEach(([b, s]) => {
      const d = document.createElement('div'); d.className = 'c-stat'; d.innerHTML = '<b></b><span></span>'; d.querySelector('b').textContent = b; d.querySelector('span').textContent = s; box.append(d);
    });
  }
  const paintLmode = segBind('lmode', 'm', () => S.lmode, (v) => { S.lmode = v; });

  const ACH = [
    { id: 'first', i: '🎹', n: 'Middle C', d: 'Play your first note' },
    { id: 'notes1000', i: '🖐️', n: 'Busy fingers', d: 'Play 1,000 notes' },
    { id: 'song1', i: '🎶', n: 'First recital', d: 'Finish a song with a star' },
    { id: 'star3', i: '⭐', n: 'Virtuoso', d: 'Earn three stars on a song' },
    { id: 'songs10', i: '📚', n: 'Repertoire', d: 'Learn 10 different songs' },
    { id: 'cats', i: '🌍', n: 'Genre hopper', d: 'Learn a song in every category' },
    { id: 'flawless', i: '💎', n: 'Flawless', d: '100% in Play along, no wrong keys' },
    { id: 'combo50', i: '🔥', n: 'In the zone', d: 'Reach a 50 combo' },
    { id: 'fast', i: '⚡', n: 'Full speed', d: 'Finish Play along at 100% speed' },
    { id: 'insts', i: '🎻', n: 'One-person orchestra', d: 'Play every instrument' },
    { id: 'rec', i: '📼', n: 'Studio time', d: 'Record and play back a take' },
    { id: 'pads', i: '🎸', n: 'Four chords', d: 'Play four different chord pads' },
    { id: 'watch', i: '👀', n: 'Front row seat', d: 'Watch a full demo' },
    { id: 'daily', i: '📅', n: 'Song of the day', d: 'Complete the daily song' }
  ];
  function paintAch() {
    const box = $('ach'); box.innerHTML = ''; let got = 0;
    ACH.forEach((a) => {
      const d = document.createElement('div'); d.className = 'pn-badge' + (S.ach[a.id] ? ' got' : ''); if (S.ach[a.id]) got++;
      d.innerHTML = '<i></i><div><b></b><span></span></div>'; d.querySelector('i').textContent = a.i; d.querySelector('b').textContent = a.n; d.querySelector('span').textContent = a.d;
      box.append(d);
    });
    $('achCount').textContent = `${got}/${ACH.length}`;
  }
  function unlock(id) {
    if (S.ach[id]) return;
    const a = ACH.find((x) => x.id === id); if (!a) return;
    S.ach[id] = Date.now(); save(); paintAch();
    unlockQ.push(a); if (!unlockBusy) nextUnlock();
  }
  const unlockQ = []; let unlockBusy = false;
  function nextUnlock() {
    const a = unlockQ.shift(); if (!a) { unlockBusy = false; return; }
    unlockBusy = true;
    const el = document.createElement('div'); el.className = 'pn-unlock'; el.setAttribute('role', 'status');
    el.innerHTML = '<i></i><div><span></span><small></small></div>';
    el.querySelector('i').textContent = a.i; el.querySelector('span').textContent = a.n; el.querySelector('small').textContent = a.d;
    document.body.append(el); setTimeout(() => { el.remove(); nextUnlock(); }, 3100);
    [784, 988, 1175].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.12, 'triangle', 0.06), 100 + i * 80));
  }

  let lastT = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
    if (!document.hidden) {
      updateLearn(dt);
      drawRoll(now, dt);
      if (analyser && meterBuf) { analyser.getFloatTimeDomainData(meterBuf); let s = 0; for (let i = 0; i < meterBuf.length; i++) s += meterBuf[i] * meterBuf[i]; $('meter').style.height = `${Math.min(100, Math.sqrt(s / meterBuf.length) * 400)}%`; }
    }
    requestAnimationFrame(loop);
  }
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (!L && mode !== 'learn') { if (fitWhites() !== [...keyEls.keys()].filter((m) => !isBlack(m)).length) freeBuild(); } computeGeom(); }, 150); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { allOff(); stopPlayback(); if (L && !L.paused) { L.paused = true; $('pauseBtn').textContent = '▶'; lcd('Paused'); } if (metroOn) $('metro').click(); }
  });

  base = fitWhites() <= 10 ? 60 : 48; kbBase = base;
  setInst(S.inst); freeBuild(); paintLib(); paintDaily(); paintStats(); paintAch();
  lcd(`${nameOf(lo)} to ${nameOf(hi)} · ${INST_BY[S.inst].name}`);
  if (!Curio.touchpad && !Curio.store.get('tp-hint-piano', false)) { Curio.store.set('tp-hint-piano', true); setTimeout(() => Curio.toast('Tip: on a laptop touchpad, turn on Touchpad mode in the top bar, or just use your keyboard', 3600), 1800); }
  requestAnimationFrame(loop);
})();
