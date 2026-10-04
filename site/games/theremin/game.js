(() => {
  const $ = (id) => document.getElementById(id);
  const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const SCALES = {
    free: { label: 'Off', steps: null },
    chromatic: { label: 'Chromatic', steps: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
    major: { label: 'Major', steps: [0, 2, 4, 5, 7, 9, 11] },
    minor: { label: 'Minor', steps: [0, 2, 3, 5, 7, 8, 10] },
    pentatonic: { label: 'Pentatonic', steps: [0, 2, 4, 7, 9] },
    blues: { label: 'Blues', steps: [0, 3, 5, 6, 7, 10] }
  };
  const WAVES = { sine: 'Sine', triangle: 'Triangle', square: 'Square', sawtooth: 'Saw', warm: 'Warm', ghost: 'Ghost', organ: 'Organ', reed: 'Reed' };
  const PRESETS = [
    { name: '🛸 Classic', s: { wave: 'sine', scale: 'free', vib: 35, glide: 30, dly: 25, rev: 45 } },
    { name: '👽 Sci-fi', s: { wave: 'sine', scale: 'free', vib: 75, glide: 75, dly: 55, rev: 75 } },
    { name: '👻 Ghost', s: { wave: 'ghost', scale: 'minor', vib: 45, glide: 40, dly: 30, rev: 90 } },
    { name: '🎸 Blues', s: { wave: 'sawtooth', scale: 'blues', vib: 20, glide: 15, dly: 45, rev: 30 } },
    { name: '👾 8-bit', s: { wave: 'square', scale: 'major', vib: 0, glide: 0, dly: 20, rev: 10 } },
    { name: '⛪ Organ', s: { wave: 'organ', scale: 'pentatonic', vib: 15, glide: 5, dly: 10, rev: 60 } },
    { name: '🐋 Whale', s: { wave: 'warm', scale: 'minor', lo: 36, vib: 25, glide: 90, dly: 60, rev: 95 } },
    { name: '🎷 Reed', s: { wave: 'reed', scale: 'major', vib: 30, glide: 20, dly: 15, rev: 35 } }
  ];
  const TUNES = [
    { name: 'Twinkle Twinkle', notes: [60, 60, 67, 67, 69, 69, 67, 65, 65, 64, 64, 62, 62, 60] },
    { name: 'Ode to Joy', notes: [64, 64, 65, 67, 67, 65, 64, 62, 60, 60, 62, 64, 64, 62, 62] },
    { name: 'Frère Jacques', notes: [60, 62, 64, 60, 60, 62, 64, 60, 64, 65, 67, 64, 65, 67] },
    { name: 'Mary Had a Little Lamb', notes: [64, 62, 60, 62, 64, 64, 64, 62, 62, 62, 64, 67, 67] },
    { name: 'Happy Birthday', notes: [67, 67, 69, 67, 72, 71, 67, 67, 69, 67, 74, 72] },
    { name: 'When the Saints', notes: [60, 64, 65, 67, 60, 64, 65, 67, 60, 64, 65, 67, 64, 60, 64, 62] },
    { name: 'Für Elise', notes: [76, 75, 76, 75, 76, 71, 74, 72, 69] },
    { name: 'Greensleeves', notes: [69, 72, 74, 76, 77, 76, 74, 71, 67, 69, 71, 72, 69, 69, 68, 69, 71, 68, 64] }
  ];
  const BADGES = [
    ['loop', '🔁 Looper', 'Record a loop'],
    ['layers4', '🎛️ One-person band', 'Stack 4 loop layers'],
    ['beat', '🥁 In the pocket', 'Record a loop over the beat'],
    ['chord', '🎹 Chord', 'Play 3 notes at once'],
    ['tune', '🎼 Sight reader', 'Finish a tune'],
    ['tunes', '🏆 Repertoire', 'Finish every tune'],
    ['fast', '⚡ Quick fingers', 'Finish a tune in under 20 s'],
    ['presets', '🧪 Sound designer', 'Try 6 sound presets']
  ];
  let badges = Curio.store.get('theremin:badges', []);
  if (!Array.isArray(badges)) badges = [];
  const triedPresets = new Set(Curio.store.get('theremin:presets', []));
  const doneTunes = new Set(Curio.store.get('theremin:tunes', []));
  function award(id) {
    if (badges.includes(id)) return;
    badges.push(id);
    Curio.store.set('theremin:badges', badges);
    const b = BADGES.find((x) => x[0] === id);
    if (b) Curio.toast(`Badge: ${b[1]}`);
    renderBadges();
  }
  function renderBadges() {
    $('badges').innerHTML = BADGES.map(([id, n, d]) => `<div class="badge${badges.includes(id) ? ' got' : ''}"><b>${badges.includes(id) ? n : `🔒 ${n.split(' ').slice(1).join(' ')}`}</b>${d}</div>`).join('');
  }

  const SPAN = 36;
  const saved = Curio.store.get('theremin', {});
  const st = Object.assign({ wave: 'sine', scale: 'free', root: 0, lo: 48, vib: 35, glide: 30, dly: 25, rev: 45, mode: 'hover', bpm: 96, beat: false }, saved);
  st.beat = false;
  if (!WAVES[st.wave]) st.wave = 'sine';
  const save = () => Curio.store.set('theremin', st);

  const field = $('field'), cv = $('cv'), g = cv.getContext('2d');
  const scope = $('scope'), sg = scope.getContext('2d');
  let W = 0, H = 0, SW = 0, SH = 0, dpr = 1;
  function resize() {
    dpr = Math.min(2, devicePixelRatio || 1);
    const r = field.getBoundingClientRect(); W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const s = scope.getBoundingClientRect(); SW = s.width; SH = s.height;
    scope.width = Math.round(SW * dpr); scope.height = Math.round(SH * dpr);
  }
  addEventListener('resize', resize);

  let ac = null, master, comp, out, analyser, delay, fb, dWet, conv, rWet, lfo, lfoGain, waveCache = {};
  function impulse(seconds, decay) {
    const len = Math.floor(ac.sampleRate * seconds), buf = ac.createBuffer(2, len, ac.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay) * (i < 60 ? i / 60 : 1);
    }
    return buf;
  }
  function build() {
    ac = Curio.audioContext(); if (!ac) return false;
    if (master) return true;
    master = ac.createGain(); master.gain.value = 1;
    comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    out = ac.createGain(); out.gain.value = Curio.muted ? 0 : 1;
    analyser = ac.createAnalyser(); analyser.fftSize = 2048;
    master.connect(comp);
    comp.connect(analyser); analyser.connect(out); out.connect(ac.destination);
    delay = ac.createDelay(2); delay.delayTime.value = .33;
    fb = ac.createGain(); fb.gain.value = .42;
    const dTone = ac.createBiquadFilter(); dTone.type = 'lowpass'; dTone.frequency.value = 2600;
    dWet = ac.createGain();
    master.connect(delay); delay.connect(dTone); dTone.connect(fb); fb.connect(delay); dTone.connect(dWet); dWet.connect(comp);
    conv = ac.createConvolver(); conv.buffer = impulse(3.2, 3.4);
    rWet = ac.createGain();
    master.connect(conv); conv.connect(rWet); rWet.connect(comp);
    lfo = ac.createOscillator(); lfo.frequency.value = 5.6; lfoGain = ac.createGain(); lfo.connect(lfoGain); lfo.start();
    applyFx();
    return true;
  }
  function periodic(kind) {
    if (waveCache[kind]) return waveCache[kind];
    const amps = kind === 'warm' ? [0, 1, .55, .32, .18, .1, .06, .03] : kind === 'organ' ? [0, 1, .8, .6, 0, .4, 0, .3, 0, 0, 0, 0, .2] : kind === 'reed' ? [0, 1, .7, .9, .5, .6, .3, .4, .2, .25, .1, .12] : [0, 1, .02, .28, .01, .1, 0, .04, 0, .02];
    const real = new Float32Array(amps.length), imag = Float32Array.from(amps);
    return (waveCache[kind] = ac.createPeriodicWave(real, imag));
  }
  function setWave(o) {
    if (['warm', 'ghost', 'organ', 'reed'].includes(st.wave)) o.setPeriodicWave(periodic(st.wave)); else o.type = st.wave;
  }
  function applyFx() {
    if (!master) return;
    const t = ac.currentTime;
    lfoGain.gain.setTargetAtTime(st.vib * .45, t, .05);
    lfo.frequency.setTargetAtTime(4.8 + st.vib / 100 * 2, t, .05);
    dWet.gain.setTargetAtTime(st.dly / 100 * .7, t, .05);
    fb.gain.setTargetAtTime(.15 + st.dly / 100 * .45, t, .05);
    rWet.gain.setTargetAtTime(st.rev / 100 * 1.1, t, .05);
  }

  const voices = new Map();
  function scaleSet() {
    const sc = SCALES[st.scale].steps; if (!sc) return null;
    const list = [];
    for (let m = st.lo - 1; m <= st.lo + SPAN + 1; m++) if (sc.includes(((m - st.root) % 12 + 12) % 12)) list.push(m);
    return list;
  }
  let notes = scaleSet();
  function midiAt(x) {
    const raw = st.lo + x * SPAN;
    if (!notes) return raw;
    let best = notes[0];
    for (const m of notes) if (Math.abs(m - raw) < Math.abs(best - raw)) best = m;
    return best;
  }
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function nameOf(m) { const r = Math.round(m); return NAMES[(r % 12 + 12) % 12] + (Math.floor(r / 12) - 1); }

  function startVoice(id, x, y, layer) {
    if (!build()) return;
    let v = voices.get(id);
    if (v && !v.dead) { moveVoice(v, x, y); return; }
    const o = ac.createOscillator(); setWave(o);
    const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = st.wave === 'square' || st.wave === 'sawtooth' ? 3200 : 9000; f.Q.value = .7;
    const gn = ac.createGain(); gn.gain.value = 0;
    o.connect(f); f.connect(gn); gn.connect(master); lfoGain.connect(o.detune);
    v = { id, o, f, gn, x, y, m: midiAt(x), vol: 0, born: performance.now(), dead: false, trail: [], layer: layer ?? -1 };
    if (v.layer < 0 && [...voices.values()].filter((q) => q.layer < 0 && !q.dead).length >= 2) award('chord');
    o.frequency.value = hz(v.m);
    o.start();
    voices.set(id, v);
    moveVoice(v, x, y);
  }
  function moveVoice(v, x, y) {
    v.x = Math.max(0, Math.min(1, x)); v.y = Math.max(0, Math.min(1, y));
    v.m = midiAt(v.x);
    v.vol = Math.pow(1 - v.y, 1.5);
    if (!ac) return;
    const t = ac.currentTime, glide = .006 + st.glide / 100 * .14;
    v.o.frequency.setTargetAtTime(hz(v.m), t, notes ? Math.min(glide, .03 + st.glide / 100 * .06) : glide);
    const n = [...voices.values()].filter((q) => !q.dead).length || 1;
    v.gn.gain.setTargetAtTime(v.vol * .34 / Math.sqrt(n), t, .03);
  }
  function stopVoice(id) {
    const v = voices.get(id); if (!v || v.dead) return;
    v.dead = true; voices.delete(id);
    const t = ac.currentTime;
    v.gn.gain.cancelScheduledValues(t); v.gn.gain.setTargetAtTime(0, t, .07);
    v.o.stop(t + .7);
    v.o.onended = () => { try { lfoGain.disconnect(v.o.detune); } catch {} v.gn.disconnect(); };
    fading.push({ x: v.x, y: v.y, m: v.m, life: 1 });
  }
  function stopAll() { [...voices.keys()].forEach(stopVoice); }
  const fading = [];

  let awake = false;
  function wake() {
    if (awake) return;
    awake = true; build();
    $('wake').classList.add('gone');
    field.focus({ preventScroll: true });
    if (Curio.muted) Curio.toast('Sound is muted. Unmute in the top bar 🔊');
    else Curio.toast('Hover over the glow ✨');
  }
  $('wakeBtn').addEventListener('click', (e) => { e.stopPropagation(); wake(); });

  function local(e) { const r = field.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; }
  const pid = (e) => e.pointerType === 'mouse' ? 'mouse' : 'p' + e.pointerId;
  field.addEventListener('pointerdown', (e) => {
    if (e.target.closest('#wakeBtn')) return;
    if (!awake) wake();
    if (e.pointerType !== 'mouse') { try { field.setPointerCapture(e.pointerId); } catch {} }
    const [x, y] = local(e);
    if (e.pointerType === 'mouse' && st.mode === 'hold') return;
    if (e.pointerType !== 'mouse' || !voices.has('mouse')) startVoice(pid(e), x, y);
    e.preventDefault();
  });
  field.addEventListener('pointermove', (e) => {
    if (!awake) return;
    const [x, y] = local(e), id = pid(e);
    if (e.pointerType === 'mouse') {
      if (st.mode === 'hover') startVoice(id, x, y);
    } else if (voices.has(id)) moveVoice(voices.get(id), x, y);
  });
  const end = (e) => { if (e.pointerType === 'mouse') { if (st.mode === 'hover' && e.type !== 'pointerup') stopVoice('mouse'); return; } stopVoice(pid(e)); };
  let holdOn = false;
  Curio.drag(field, {
    start: (p) => { if (p.pointerType !== 'mouse' || st.mode !== 'hold' || p.event.target.closest('#wakeBtn')) return; holdOn = true; if (!awake) wake(); startVoice('mouse', p.x / W, p.y / H); },
    move: (p) => { if (holdOn) startVoice('mouse', p.x / W, p.y / H); },
    end: () => { if (holdOn) { holdOn = false; stopVoice('mouse'); } }
  });
  field.addEventListener('pointerup', end);
  field.addEventListener('pointercancel', end);
  field.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') stopVoice('mouse'); });
  field.addEventListener('contextmenu', (e) => e.preventDefault());

  const kpos = { x: .5, y: .35 }; let kOn = false, kShow = false;
  field.addEventListener('keydown', (e) => {
    const step = e.shiftKey ? .06 : .015;
    const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (moves[e.key]) {
      e.preventDefault(); kShow = true;
      kpos.x = Math.max(0, Math.min(1, kpos.x + moves[e.key][0])); kpos.y = Math.max(0, Math.min(1, kpos.y + moves[e.key][1]));
      if (kOn) startVoice('key', kpos.x, kpos.y);
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault(); if (!awake) wake(); kShow = true;
      if (!kOn) { kOn = true; startVoice('key', kpos.x, kpos.y); }
    }
  });
  field.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') { kOn = false; stopVoice('key'); } });
  field.addEventListener('blur', () => { kOn = false; stopVoice('key'); });

  function seg(el, items, key, after) {
    el.innerHTML = '';
    Object.entries(items).forEach(([k, label]) => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.dataset.k = k;
      b.addEventListener('click', () => { st[key] = k; save(); paint(); after?.(); });
      el.append(b);
    });
    const paint = () => el.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.k === st[key])));
    paint();
  }
  seg($('waves'), WAVES, 'wave', () => {
    if (!ac) return;
    voices.forEach((v) => { setWave(v.o); v.f.frequency.value = st.wave === 'square' || st.wave === 'sawtooth' ? 3200 : 9000; });
    if (!voices.size) previewNote();
  });
  seg($('scales'), Object.fromEntries(Object.entries(SCALES).map(([k, v]) => [k, v.label])), 'scale', () => { notes = scaleSet(); voices.forEach((v) => moveVoice(v, v.x, v.y)); });
  $('modes').querySelectorAll('button').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.m === st.mode));
    b.addEventListener('click', () => { st.mode = b.dataset.m; save(); stopVoice('mouse'); $('modes').querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.m === st.mode))); });
  });
  const rootSel = $('root');
  NAMES.forEach((n, i) => { const o = document.createElement('option'); o.value = i; o.textContent = n; rootSel.append(o); });
  rootSel.value = st.root; $('range').value = st.lo;
  rootSel.addEventListener('change', () => { st.root = +rootSel.value; notes = scaleSet(); save(); });
  $('range').addEventListener('change', () => { st.lo = +$('range').value; notes = scaleSet(); save(); voices.forEach((v) => moveVoice(v, v.x, v.y)); });
  [['vib', (v) => v + '%'], ['glide', (v) => v + '%'], ['dly', (v) => v + '%'], ['rev', (v) => v + '%']].forEach(([k, f]) => {
    const el = $(k); el.value = st[k]; $(k + 'V').textContent = f(st[k]);
    el.addEventListener('input', () => { st[k] = +el.value; $(k + 'V').textContent = f(st[k]); applyFx(); save(); });
  });
  function previewNote() {
    if (Curio.muted || !build() || !awake) return;
    const o = ac.createOscillator(); setWave(o); const gn = ac.createGain();
    o.frequency.value = hz(st.lo + 12 + st.root);
    const t = ac.currentTime; gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(.2, t + .03); gn.gain.setTargetAtTime(0, t + .25, .08);
    o.connect(gn); gn.connect(master); o.start(t); o.stop(t + .8);
  }

  const LAYER_COLORS = ['#ff5a8a', '#36d6c3', '#ffc23d', '#8f7bff', '#5fd35f', '#ff8a3d'];
  const loop = { len: 0, layers: [], playing: false, rec: false, recLayer: null, t0: 0, start: 0, lastT: 0 };
  const nowS = () => performance.now() / 1000;
  const loopT = () => (loop.len ? ((nowS() - loop.start) % loop.len + loop.len) % loop.len : 0);
  const beatLen = () => 60 / st.bpm;
  function paintLooper() {
    const rb = $('lpRec');
    rb.classList.toggle('on', loop.rec);
    rb.querySelector('span').textContent = loop.rec ? (loop.layers.length || loop.len ? 'Recording' : 'Stop') : loop.len ? 'Overdub' : 'Rec';
    $('lpPlay').disabled = !loop.len;
    $('lpPlay').textContent = loop.playing ? '⏸' : '▶';
    $('lpUndo').disabled = !loop.layers.length || loop.rec;
    $('lpClear').disabled = !loop.len && !loop.rec;
    $('lpLayers').innerHTML = loop.layers.map((L, i) => `<button type="button" class="lp-layer" data-i="${i}" style="--c:${L.color}" aria-pressed="${!L.muted}" aria-label="Layer ${i + 1}, tap to mute">L${i + 1}</button>`).join('');
    $('lpBeats').innerHTML = loop.len && st.beat ? '<span></span>'.repeat(Math.max(1, Math.round(loop.len / beatLen()))) : '';
    if (!loop.len) $('lpTime').textContent = loop.rec ? 'recording...' : 'no loop';
  }
  function recStart() {
    if (!awake) wake();
    if (loop.layers.length >= 6) { Curio.toast('Six layers is the max. Undo one first.'); return; }
    if (loop.len) {
      loop.rec = true;
      loop.recLayer = { frames: [], color: LAYER_COLORS[loop.layers.length % LAYER_COLORS.length], muted: false, ptr: 0, wrapAt: loopT() };
      if (!loop.playing) { loop.playing = true; loop.start = nowS(); loop.recLayer.wrapAt = 0; }
      Curio.toast('Overdubbing one full loop. Play along!');
    } else {
      loop.rec = true; loop.t0 = nowS();
      if (st.beat) loop.t0 = nextBeatTime();
      loop.recLayer = { frames: [], color: LAYER_COLORS[0], muted: false, ptr: 0 };
      Curio.toast(st.beat ? 'Recording from the next beat. Press again to finish.' : 'Recording. Press again to finish the loop.');
    }
    Curio.beep(880, 0.06, 'square', 0.05);
    paintLooper();
  }
  function recStop() {
    if (!loop.rec) return;
    loop.rec = false;
    const L = loop.recLayer; loop.recLayer = null;
    if (!loop.len) {
      let len = nowS() - loop.t0;
      if (st.beat) { const bar = beatLen() * 4; len = Math.max(bar, Math.round(len / bar) * bar); }
      if (len < 0.8) { Curio.toast('Too short for a loop. Try again.'); paintLooper(); return; }
      loop.len = Math.min(32, len);
      L.frames = L.frames.filter((f) => f.t < loop.len);
      loop.start = loop.t0 + loop.len;
      while (loop.start > nowS()) loop.start -= loop.len;
      loop.playing = true;
      if (st.beat) award('beat');
    }
    if (L.frames.some((f) => f.v.length)) { loop.layers.push(L); award('loop'); if (loop.layers.length >= 4) award('layers4'); }
    else Curio.toast('Nothing was played, so no layer was added.');
    Curio.beep(660, 0.06, 'triangle', 0.06); setTimeout(() => Curio.beep(990, 0.08, 'triangle', 0.06), 70);
    paintLooper();
  }
  function stopLayerVoices(i) { [...voices.keys()].filter((id) => id.startsWith(`L${i}:`)).forEach(stopVoice); }
  function captureAndPlay() {
    const t = nowS();
    if (loop.rec && loop.recLayer) {
      const live = [...voices.values()].filter((v) => v.layer < 0 && !v.dead).map((v) => [v.id, +v.x.toFixed(4), +v.y.toFixed(4)]);
      if (!loop.len) { if (t >= loop.t0) loop.recLayer.frames.push({ t: t - loop.t0, v: live }); }
      else {
        const lt = loopT();
        const L = loop.recLayer;
        if (L.frames.length && lt < L.lastLt - loop.len / 2) L.wrapped = true;
        if (L.wrapped && lt >= L.wrapAt) recStop();
        else { L.frames.push({ t: lt, v: live }); L.lastLt = lt; }
      }
    }
    if (!loop.len) return;
    if (!loop.playing) return;
    const lt = loopT();
    const wrapped = lt < loop.lastT;
    loop.lastT = lt;
    loop.layers.forEach((L, i) => {
      if (L.muted) { stopLayerVoices(i); return; }
      if (wrapped || !L.sorted) { if (!L.sorted) { L.frames.sort((a, b) => a.t - b.t); L.sorted = true; } L.ptr = 0; }
      while (L.ptr + 1 < L.frames.length && L.frames[L.ptr + 1].t <= lt) L.ptr++;
      const f = L.frames[L.ptr];
      const act = f && f.t <= lt && lt - f.t < 0.12 ? f.v : [];
      const want = new Set(act.map((a) => `L${i}:${a[0]}`));
      [...voices.keys()].filter((id) => id.startsWith(`L${i}:`) && !want.has(id)).forEach(stopVoice);
      for (const [id, x, y] of act) startVoice(`L${i}:${id}`, x, y, i);
    });
    $('lpHead').style.width = `${lt / loop.len * 100}%`;
    $('lpHead').classList.toggle('rec', loop.rec);
    $('lpTime').textContent = `${lt.toFixed(1)} / ${loop.len.toFixed(1)} s`;
  }
  $('lpRec').addEventListener('click', () => (loop.rec ? recStop() : recStart()));
  $('lpPlay').addEventListener('click', () => {
    if (!loop.len) return;
    loop.playing = !loop.playing;
    if (loop.playing) { loop.start = nowS(); loop.lastT = 0; } else loop.layers.forEach((_, i) => stopLayerVoices(i));
    paintLooper();
  });
  $('lpUndo').addEventListener('click', () => { const i = loop.layers.length - 1; if (i < 0) return; stopLayerVoices(i); loop.layers.pop(); if (!loop.layers.length) { loop.len = 0; loop.playing = false; } paintLooper(); });
  $('lpClear').addEventListener('click', () => { loop.layers.forEach((_, i) => stopLayerVoices(i)); loop.layers = []; loop.len = 0; loop.playing = false; loop.rec = false; loop.recLayer = null; $('lpHead').style.width = '0'; paintLooper(); Curio.beep(300, 0.08, 'sine', 0.06); });
  $('lpLayers').addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (!b) return; const L = loop.layers[+b.dataset.i]; L.muted = !L.muted; paintLooper(); });

  let beatTimer = 0, nextBeat = 0, beatCount = 0, beatFlash = 0, noiseBuf = null;
  function nextBeatTime() { if (!st.beat || !ac) return nowS(); const ahead = (nextBeat - ac.currentTime); return nowS() + Math.max(0, ahead); }
  function kick(t, accent) {
    const o = ac.createOscillator(), gn = ac.createGain();
    o.frequency.setValueAtTime(accent ? 150 : 120, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    gn.gain.setValueAtTime(accent ? 0.55 : 0.4, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    o.connect(gn).connect(comp); o.start(t); o.stop(t + 0.27);
  }
  function hat(t, vol) {
    if (!noiseBuf) { noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.1, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), gn = ac.createGain();
    s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = 7000;
    gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    s.connect(f).connect(gn).connect(comp); s.start(t); s.stop(t + 0.06);
  }
  function scheduler() {
    if (!ac || !st.beat) return;
    while (nextBeat < ac.currentTime + 0.12) {
      const bi = beatCount % 4;
      kick(nextBeat, bi === 0);
      hat(nextBeat + beatLen() / 2, 0.05);
      if (bi === 1 || bi === 3) hat(nextBeat, 0.09);
      const delayMs = (nextBeat - ac.currentTime) * 1000;
      setTimeout(() => { beatFlash = bi === 0 ? 1 : 0.6; }, Math.max(0, delayMs));
      nextBeat += beatLen(); beatCount++;
    }
  }
  function setBeat(on) {
    st.beat = on; save();
    $('beatBtn').setAttribute('aria-pressed', String(on));
    clearInterval(beatTimer);
    if (on) {
      if (!awake) wake();
      if (!build()) return;
      nextBeat = ac.currentTime + 0.05; beatCount = 0;
      beatTimer = setInterval(scheduler, 25);
    }
    paintLooper();
  }
  $('beatBtn').addEventListener('click', () => setBeat(!st.beat));
  $('bpm').value = st.bpm; $('bpmV').textContent = st.bpm;
  $('bpm').addEventListener('input', () => { st.bpm = +$('bpm').value; $('bpmV').textContent = st.bpm; save(); paintLooper(); });

  const tune = { on: false, i: 0, notes: [], hold: 0, t0: 0, name: '' };
  $('tunes').innerHTML = TUNES.map((t, i) => `<button type="button" data-i="${i}" class="${doneTunes.has(t.name) ? 'done' : ''}">${doneTunes.has(t.name) ? '✅ ' : ''}${t.name}<small>${t.notes.length} notes</small></button>`).join('');
  $('tuneBtn').addEventListener('click', () => {
    if (tune.on) { tune.on = false; $('tuneBtn').setAttribute('aria-pressed', 'false'); $('tuneBtn').textContent = '🎼 Follow a tune'; return; }
    $('tunes').classList.toggle('hidden');
  });
  $('tunes').addEventListener('click', (e) => {
    const b = e.target.closest('[data-i]'); if (!b) return;
    const T = TUNES[+b.dataset.i];
    let shift = 0;
    const mn = Math.min(...T.notes), mx = Math.max(...T.notes);
    while (mn + shift < st.lo + 2) shift += 12;
    while (mx + shift > st.lo + SPAN - 2 && mn + shift - 12 >= st.lo) shift -= 12;
    Object.assign(tune, { on: true, i: 0, hold: 0, t0: nowS(), name: T.name, notes: T.notes.map((m) => m + shift) });
    $('tunes').classList.add('hidden');
    $('tuneBtn').setAttribute('aria-pressed', 'true'); $('tuneBtn').textContent = '✖ Stop tune';
    if (!awake) wake();
    Curio.toast(`${T.name}: glide onto each glowing note and hold it.`, 2600);
    field.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
  function tuneStep(dt) {
    if (!tune.on) return;
    const target = tune.notes[tune.i];
    const live = [...voices.values()].filter((v) => v.layer < 0 && !v.dead && v.vol > 0.08);
    const hit = live.some((v) => Math.abs(v.m - target) < 0.4);
    tune.hold = hit ? tune.hold + dt : Math.max(0, tune.hold - dt * 2);
    if (tune.hold >= 0.22) {
      tune.hold = 0; tune.i++;
      const px = (target - st.lo) / SPAN * W;
      for (let k = 0; k < 18; k++) sparks.push({ x: px, y: H * 0.5, vx: (Math.random() - .5) * 5, vy: (Math.random() - .5) * 5, life: 1, hue: 50 + Math.random() * 40 });
      try { navigator.vibrate && navigator.vibrate(12); } catch (e) { }
      if (tune.i >= tune.notes.length) finishTune();
    }
  }
  async function finishTune() {
    const secs = nowS() - tune.t0;
    tune.on = false;
    $('tuneBtn').setAttribute('aria-pressed', 'false'); $('tuneBtn').textContent = '🎼 Follow a tune';
    doneTunes.add(tune.name); Curio.store.set('theremin:tunes', [...doneTunes]);
    award('tune');
    if (doneTunes.size >= TUNES.length) award('tunes');
    if (secs < 20) award('fast');
    const best = Curio.best(`tune-${tune.name}`, Math.round(secs * 10) / 10, false);
    $('tunes').querySelectorAll('button').forEach((b) => { const T = TUNES[+b.dataset.i]; if (doneTunes.has(T.name)) { b.classList.add('done'); if (!b.textContent.startsWith('✅')) b.insertBefore(document.createTextNode('✅ '), b.firstChild); } });
    Curio.confetti();
    const v = await Curio.modal({ emoji: '🎼', title: `${tune.name}!`, body: `Played in ${secs.toFixed(1)} seconds. ${best.isNew ? 'New best time!' : `Best: ${best.best} s.`} ${doneTunes.size} of ${TUNES.length} tunes mastered.`, buttons: [{ label: 'Another tune', value: 'more' }, { label: 'Copy result', value: 'share' }, { label: 'Free play', value: 'free' }] });
    if (v === 'more') $('tunes').classList.remove('hidden');
    if (v === 'share') { const txt = `🎼 I played ${tune.name} on the Zoble Theremin in ${secs.toFixed(1)} s, no hands touching.`; try { await navigator.clipboard.writeText(txt); Curio.toast('Copied!'); } catch (e) { Curio.toast(txt, 4000); } }
  }
  function drawTune() {
    if (!tune.on) return;
    for (let k = 3; k >= 0; k--) {
      const m = tune.notes[tune.i + k];
      if (m == null) continue;
      const x = (m - st.lo) / SPAN * W, y = H * 0.5 - k * 0;
      const a = k === 0 ? 1 : 0.5 - k * 0.12;
      const r = k === 0 ? 26 + Math.sin(nowS() * 6) * 3 : 14;
      g.strokeStyle = `rgba(255, 215, 90, ${a})`; g.lineWidth = k === 0 ? 3 : 2;
      g.setLineDash(k === 0 ? [] : [4, 4]);
      g.beginPath(); g.arc(x, y + k * 26, r, 0, Math.PI * 2); g.stroke();
      if (k === 0) {
        g.fillStyle = `rgba(255, 215, 90, ${0.15 + tune.hold * 2})`; g.fill();
        g.beginPath(); g.arc(x, y, r + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, tune.hold / 0.22)); g.lineWidth = 4; g.stroke();
        g.fillStyle = '#ffe9a8'; g.font = '800 14px system-ui, sans-serif'; g.textAlign = 'center';
        g.fillText(nameOf(m), x, y - r - 12);
      }
    }
    g.setLineDash([]);
    g.fillStyle = 'rgba(255, 233, 168, .85)'; g.font = '800 12px system-ui, sans-serif'; g.textAlign = 'left';
    g.fillText(`${tune.name} · note ${Math.min(tune.i + 1, tune.notes.length)} of ${tune.notes.length}`, 14, H - 30);
  }
  function drawAntenna(vs) {
    const near = vs.reduce((a, v) => Math.max(a, v.x), 0);
    const ax = W - 16;
    const grd = g.createLinearGradient(ax - 3, 0, ax + 3, 0);
    grd.addColorStop(0, '#6b6488'); grd.addColorStop(0.5, '#e6e1ff'); grd.addColorStop(1, '#6b6488');
    g.fillStyle = grd; g.fillRect(ax - 2.5, H * 0.12, 5, H * 0.62);
    g.fillStyle = `rgba(180, 150, 255, ${0.15 + near * 0.6})`;
    g.beginPath(); g.arc(ax, H * 0.12, 5 + near * 8, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#a69fc6'; g.lineWidth = 3;
    g.beginPath(); g.ellipse(26, H * 0.72, 16, 26, 0, Math.PI * 0.2, Math.PI * 1.8); g.stroke();
    if (beatFlash > 0.01) { g.fillStyle = `rgba(124, 92, 255, ${beatFlash * 0.18})`; g.fillRect(0, 0, W, H); beatFlash *= 0.86; }
  }
  let lastFrame = 0;
  const sparks = [];
  let lastMuted = null;
  function hueOf(m) { return ((m % 12) / 12) * 360 + 250; }
  function draw(ts) {
    raf = 0;
    if (document.hidden) return;
    const now = ts / 1000;
    if (ac && out && lastMuted !== Curio.muted) { lastMuted = Curio.muted; out.gain.setTargetAtTime(Curio.muted ? 0 : 1, ac.currentTime, .03); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const bg = g.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#1b1046'); bg.addColorStop(1, '#07061a');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    const breathe = .5 + .5 * Math.sin(now * .8);
    const glow = g.createRadialGradient(W * .5, H * .55, 10, W * .5, H * .55, Math.max(W, H) * .7);
    glow.addColorStop(0, `rgba(124, 92, 255, ${.18 + breathe * .08})`); glow.addColorStop(1, 'rgba(124, 92, 255, 0)');
    g.fillStyle = glow; g.fillRect(0, 0, W, H);

    g.font = '700 11px ui-monospace, Menlo, monospace'; g.textAlign = 'center';
    let lastLabel = -99;
    for (let m = st.lo; m <= st.lo + SPAN; m++) {
      const pc = ((m - st.root) % 12 + 12) % 12;
      const inScale = !notes || notes.includes(m);
      const x = (m - st.lo) / SPAN * W;
      const isRoot = pc === 0;
      if (notes && !inScale) continue;
      if (!notes && NAMES[(m % 12 + 12) % 12].includes('#')) continue;
      g.fillStyle = isRoot ? 'rgba(200, 180, 255, .32)' : 'rgba(200, 180, 255, .1)';
      g.fillRect(Math.round(x), 0, 1, H);
      const lx = Math.min(W - 24, Math.max(14, x));
      if ((W > 500 || isRoot || (notes && notes.length < 22)) && lx - lastLabel > 24) {
        g.fillStyle = isRoot ? 'rgba(230, 220, 255, .85)' : 'rgba(200, 180, 255, .45)';
        g.fillText(nameOf(m), lx, H - 10); lastLabel = lx;
      }
    }
    g.textAlign = 'right'; g.fillStyle = 'rgba(200, 180, 255, .4)';
    g.fillText('LOUD', W - 10, 20); g.fillText('hush', W - 10, H - 28);
    g.fillRect(W - 4, 24, 2, H - 60);

    const dtF = lastFrame ? Math.min(0.1, now - lastFrame) : 0; lastFrame = now;
    captureAndPlay(); tuneStep(dtF);
    const vs = [...voices.values()];
    drawAntenna(vs); drawTune();
    for (const v of vs) {
      const px = v.x * W, py = v.y * H, hue = hueOf(v.m);
      v.trail.push([px, py]); if (v.trail.length > 24) v.trail.shift();
      if (Math.random() < .5 + v.vol) sparks.push({ x: px, y: py, vx: (Math.random() - .5) * 1.6, vy: -Math.random() * 1.4 - .3, life: 1, hue });
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i]; s.x += s.vx; s.y += s.vy; s.life -= .022;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      g.fillStyle = `hsla(${s.hue}, 100%, 75%, ${s.life * .8})`;
      g.beginPath(); g.arc(s.x, s.y, 1 + s.life * 2.2, 0, Math.PI * 2); g.fill();
    }
    g.globalCompositeOperation = 'lighter';
    for (const v of vs) {
      const px = v.x * W, py = v.y * H, hue = hueOf(v.m), r = 22 + v.vol * 60;
      if (v.trail.length > 1) {
        g.strokeStyle = `hsla(${hue}, 100%, 70%, .35)`; g.lineWidth = 3; g.lineCap = 'round'; g.lineJoin = 'round';
        g.beginPath(); v.trail.forEach(([a, b], i) => i ? g.lineTo(a, b) : g.moveTo(a, b)); g.stroke();
      }
      const freq = hz(v.m), rings = 3;
      for (let k = 0; k < rings; k++) {
        const ph = ((now * (0.4 + freq / 900)) + k / rings) % 1;
        g.strokeStyle = `hsla(${hue}, 100%, 72%, ${(1 - ph) * .45 * (.3 + v.vol)})`; g.lineWidth = 2;
        g.beginPath(); g.arc(px, py, r * .4 + ph * r * 1.8, 0, Math.PI * 2); g.stroke();
      }
      const og = g.createRadialGradient(px, py, 0, px, py, r);
      og.addColorStop(0, `hsla(${hue}, 100%, 92%, .95)`); og.addColorStop(.3, `hsla(${hue}, 100%, 66%, .6)`); og.addColorStop(1, `hsla(${hue}, 100%, 50%, 0)`);
      g.fillStyle = og; g.beginPath(); g.arc(px, py, r, 0, Math.PI * 2); g.fill();
      g.fillStyle = `hsla(${hue}, 100%, 70%, .12)`; g.fillRect(px - 1, 0, 2, H);
    }
    for (let i = fading.length - 1; i >= 0; i--) {
      const f = fading[i]; f.life -= .04; if (f.life <= 0) { fading.splice(i, 1); continue; }
      const px = f.x * W, py = f.y * H;
      g.strokeStyle = `hsla(${hueOf(f.m)}, 100%, 75%, ${f.life * .6})`; g.lineWidth = 2;
      g.beginPath(); g.arc(px, py, 20 + (1 - f.life) * 70, 0, Math.PI * 2); g.stroke();
    }
    g.globalCompositeOperation = 'source-over';
    if (kShow && document.activeElement === field) {
      g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 2; g.setLineDash([4, 4]);
      g.beginPath(); g.arc(kpos.x * W, kpos.y * H, 14, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
    }

    if (vs.length) {
      const sorted = vs.slice().sort((a, b) => a.m - b.m);
      $('note').textContent = sorted.map((v) => nameOf(v.m)).join(' + ');
      if (sorted.length === 1) {
        const v = sorted[0], cents = Math.round((v.m - Math.round(v.m)) * 100);
        $('hz').textContent = `${hz(v.m).toFixed(1)} Hz${notes ? '' : ` · ${cents >= 0 ? '+' : ''}${cents}¢`} · vol ${Math.round(v.vol * 100)}%`;
      } else $('hz').textContent = `${sorted.length}-finger chord`;
    } else { $('note').textContent = awake ? '~' : 'zzz'; $('hz').textContent = awake ? 'waiting for a wave' : 'asleep'; }

    drawScope(now);
    raf = requestAnimationFrame(draw);
  }
  const tbuf = new Float32Array(2048);
  function drawScope(now) {
    sg.setTransform(dpr, 0, 0, dpr, 0, 0);
    sg.fillStyle = '#06110c'; sg.fillRect(0, 0, SW, SH);
    sg.strokeStyle = 'rgba(120, 255, 180, .08)'; sg.lineWidth = 1;
    for (let x = 0; x < SW; x += 24) { sg.beginPath(); sg.moveTo(x + .5, 0); sg.lineTo(x + .5, SH); sg.stroke(); }
    for (let y = SH / 2 % 18; y < SH; y += 18) { sg.beginPath(); sg.moveTo(0, y + .5); sg.lineTo(SW, y + .5); sg.stroke(); }
    let data = null;
    if (analyser && voices.size + fading.length > 0) { analyser.getFloatTimeDomainData(tbuf); data = tbuf; }
    sg.strokeStyle = '#7dffb2'; sg.lineWidth = 2; sg.shadowColor = '#3dff8f'; sg.shadowBlur = 8;
    sg.beginPath();
    if (data) {
      let start = 0;
      for (let i = 1; i < 1024; i++) if (data[i - 1] < 0 && data[i] >= 0) { start = i; break; }
      const n = 900;
      for (let i = 0; i < n; i++) {
        const x = i / (n - 1) * SW, y = SH / 2 - data[start + i] * SH * 1.1;
        i ? sg.lineTo(x, y) : sg.moveTo(x, y);
      }
    } else {
      for (let x = 0; x <= SW; x += 4) { const y = SH / 2 + Math.sin(x * .05 + now * 2) * 1.5; x ? sg.lineTo(x, y) : sg.moveTo(x, y); }
    }
    sg.stroke(); sg.shadowBlur = 0;
  }
  let raf = 0;
  function kick() { if (!raf && !document.hidden) raf = requestAnimationFrame(draw); }
  document.addEventListener('visibilitychange', () => { if (document.hidden) { stopAll(); kOn = false; } else kick(); });
  const presetsEl = $('presets');
  PRESETS.forEach((p) => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = p.name;
    b.addEventListener('click', () => {
      Object.assign(st, p.s); save();
      triedPresets.add(p.name); Curio.store.set('theremin:presets', [...triedPresets]);
      if (triedPresets.size >= 6) award('presets');
      notes = scaleSet();
      $('waves').querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.k === st.wave)));
      $('scales').querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.k === st.scale)));
      ['vib', 'glide', 'dly', 'rev'].forEach((k) => { $(k).value = st[k]; $(k + 'V').textContent = st[k] + '%'; });
      $('range').value = st.lo;
      applyFx();
      if (ac) voices.forEach((v) => { setWave(v.o); moveVoice(v, v.x, v.y); });
      previewNote();
      presetsEl.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    });
    presetsEl.append(b);
  });
  addEventListener('keydown', (e) => {
    if (e.target.closest?.('input, select, button') || e.ctrlKey || e.metaKey || document.querySelector('.curio-modal')) return;
    const k = e.key.toLowerCase();
    if (k === 'r') { e.preventDefault(); $('lpRec').click(); }
    else if (k === 'p') $('lpPlay').click();
    else if (k === 'b') $('beatBtn').click();
  });
  renderBadges();
  paintLooper();
  resize(); kick();
  window.__th = { loop, tune, startVoice, stopVoice, recStart, recStop, get voices() { return voices; }, wake };
})();
