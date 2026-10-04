(() => {
  const $ = (id) => document.getElementById(id);
  const D = window.DM_DATA;
  const ROWS = 12, STEPS = 16, NPAT = 8, LET = 'ABCDEFGH', BROWS = 12;
  const VELS = [0, 0.45, 0.75, 1], PROBS = [1, 1, 0.75, 0.5, 0.25];
  const KITS = Object.fromEntries(D.kits.map((k) => [k.id, k]));
  const SCALES = Object.fromEntries(D.scales.map((s) => [s.id, s]));
  const NOTE = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
  const VER = 3, KEY = 'beat-v3';
  const vib = (p) => { try { navigator.vibrate?.(p); } catch {} };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const grid0 = (v) => Array.from({ length: ROWS }, () => new Array(STEPS).fill(v));
  const emptyPat = () => ({ v: grid0(0), p: grid0(1), r: grid0(1), len: new Array(ROWS).fill(STEPS), bn: new Array(STEPS).fill(-1), ch: [-1, -1, -1, -1] });
  const clonePat = (p) => JSON.parse(JSON.stringify(p));
  const patEmpty = (p) => p.v.every((r) => r.every((x) => !x)) && p.bn.every((x) => x < 0) && p.ch.every((x) => x < 0);
  const RIDE_KITS = ['909', 'acoustic', 'house', 'techno', 'rock', 'jungle'];
  const remapRow = (kit) => [0, 1, 2, 3, 4, 5, 7, RIDE_KITS.includes(kit) ? 10 : 8];
  function fixRows(rows, kit) {
    if (rows.length > 8) return rows;
    const out = new Array(ROWS).fill(''), map = remapRow(kit);
    rows.forEach((r, i) => { out[map[i]] = r; });
    return out;
  }
  function patFromStrings(rows, kit, bass, ch) {
    const p = emptyPat();
    fixRows(rows, kit).forEach((s, r) => { [...(s || '').padEnd(STEPS, '.')].slice(0, STEPS).forEach((c, i) => {
      if (c === 'o') p.v[r][i] = 1; else if (c === 'x') p.v[r][i] = 2; else if (c === 'X') p.v[r][i] = 3;
      else if (c === '2' || c === '3') { p.v[r][i] = 2; p.r[r][i] = +c; }
    }); });
    if (bass) [...bass].slice(0, STEPS).forEach((c, i) => { p.bn[i] = c === '.' ? -1 : parseInt(c, 16); });
    if (ch) p.ch = ch.slice(0, 4).concat([-1, -1, -1, -1]).slice(0, 4);
    return p;
  }
  const DEF_FX = { cut: 1, res: 0.1, drive: 0, crush: 0, delay: 0, fb: 0.35, rev: 0, vol: 0.8, glue: 0.3 };
  const DEF_BASS = { synth: 'sub', root: 0, scale: 'minor', oct: 2, vol: 0.7, cut: 0.55, chVol: 0.4 };
  const freshMix = () => ({ vol: new Array(ROWS).fill(0.8), pan: new Array(ROWS).fill(0), tune: new Array(ROWS).fill(0), filt: new Array(ROWS).fill(0), mute: new Array(ROWS).fill(false), solo: new Array(ROWS).fill(false) });
  function fresh() {
    return { v: VER, kit: '808', tempo: 110, swing: 0, pats: Array.from({ length: NPAT }, emptyPat), cur: 0, chain: [], pm: 'pattern', tool: 'draw', sel: 0, autoFill: false, genre: 'house', adv: false, seenHelp: false,
      mix: freshMix(), fx: { ...DEF_FX }, bass: { ...DEF_BASS }, ach: {}, chal: {}, daily: {}, tried: {}, kitsUsed: {}, stats: { plays: 0, steps: 0 } };
  }
  function upgradePat(p, kit) {
    if (!p || !Array.isArray(p.v)) return emptyPat();
    const n = emptyPat();
    const map = p.v.length === 8 ? remapRow(kit) : null;
    p.v.forEach((row, i) => { const r = map ? map[i] : i; if (r < ROWS && Array.isArray(row)) { n.v[r] = row.slice(0, STEPS).map((x) => clamp(+x || 0, 0, 3)); n.p[r] = (p.p?.[i] || n.p[r]).slice(0, STEPS).map((x) => clamp(+x || 1, 1, 4)); n.r[r] = (p.r?.[i] || n.r[r]).slice(0, STEPS).map((x) => clamp(+x || 1, 1, 3)); } });
    if (Array.isArray(p.len) && !map) n.len = p.len.slice(0, ROWS).map((x) => clamp(+x || 16, 1, 16));
    if (Array.isArray(p.bn)) n.bn = p.bn.slice(0, STEPS).map((x) => (x == null || x < 0 ? -1 : clamp(+x, 0, BROWS - 1)));
    if (Array.isArray(p.ch)) n.ch = p.ch.slice(0, 4).map((x) => (x == null || x < 0 ? -1 : clamp(+x, 0, 6)));
    return n;
  }
  function load() {
    const f = fresh();
    let raw = Curio.store.get(KEY, null);
    if (!raw || typeof raw !== 'object' || raw.v !== VER) {
      const v2 = Curio.store.get('beat-v2', null);
      if (v2 && typeof v2 === 'object' && Array.isArray(v2.pats)) raw = { ...v2, v: VER, mix: null };
      else { loadPresetInto(f, D.presets[0]); return f; }
    }
    const s = { ...f, ...raw };
    if (!KITS[s.kit]) s.kit = '808';
    s.pats = Array.isArray(raw.pats) && raw.pats.length === NPAT ? raw.pats.map((p) => upgradePat(p, s.kit)) : f.pats;
    const m = raw.mix || {}; s.mix = freshMix();
    ['vol', 'pan', 'tune', 'filt', 'mute', 'solo'].forEach((k) => { if (Array.isArray(m[k]) && m[k].length === ROWS) s.mix[k] = m[k]; });
    s.fx = { ...DEF_FX, ...(raw.fx || {}) }; s.bass = { ...DEF_BASS, ...(raw.bass || {}) };
    if (!SCALES[s.bass.scale]) s.bass.scale = 'minor';
    s.stats = { ...f.stats, ...(raw.stats || {}) };
    ['ach', 'chal', 'daily', 'tried', 'kitsUsed'].forEach((k) => { if (!raw[k] || typeof raw[k] !== 'object') s[k] = {}; });
    s.chain = Array.isArray(raw.chain) ? raw.chain.filter((x) => x >= 0 && x < NPAT).slice(0, 32) : [];
    s.cur = clamp(+s.cur || 0, 0, NPAT - 1); s.sel = clamp(+s.sel || 0, 0, ROWS - 1);
    return s;
  }
  function loadPresetInto(st, pr) {
    st.kit = pr.k; st.tempo = pr.t; st.swing = pr.sw;
    st.pats = Array.from({ length: NPAT }, (_, i) => pr.pats[i] ? patFromStrings(pr.pats[i], pr.k, pr.b, pr.ch) : emptyPat());
    st.bass = { ...DEF_BASS, ...(st.bass || {}), ...(pr.bs || {}) };
    st.chain = pr.chain ? pr.chain.slice() : []; st.pm = pr.chain ? 'song' : 'pattern'; st.cur = 0;
  }
  const S = load();
  let saveT = 0; const save = () => { clearTimeout(saveT); saveT = setTimeout(() => Curio.store.set(KEY, S), 300); };
  const kit = () => KITS[S.kit];

  function driveCurve(k) { const n = 2048, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i * 2 / n - 1; c[i] = (1 + k) * x / (1 + k * Math.abs(x)); } return c; }
  function crushCurve(bits) { const n = 4096, c = new Float32Array(n), lv = Math.pow(2, bits); for (let i = 0; i < n; i++) { const x = i * 2 / n - 1; c[i] = Math.round(x * lv) / lv; } return c; }
  function impulse(c, sec) { const len = Math.floor(c.sampleRate * sec), b = c.createBuffer(2, len, c.sampleRate); for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); } return b; }
  function makeGraph(c, live) {
    const g = { c, step: {}, curves: {} };
    g.noise = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const nd = g.noise.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    g.kitLP = c.createBiquadFilter(); g.kitLP.type = 'lowpass'; g.kitLP.Q.value = 0.5;
    g.trk = Array.from({ length: ROWS }, () => {
      const gn = c.createGain(), fl = c.createBiquadFilter(), pn = c.createStereoPanner ? c.createStereoPanner() : null;
      fl.type = 'lowpass'; fl.frequency.value = 20000;
      gn.connect(fl); if (pn) fl.connect(pn).connect(g.kitLP); else fl.connect(g.kitLP);
      return { gn, fl, pn };
    });
    g.drive = c.createWaveShaper(); g.crush = c.createWaveShaper();
    g.filter = c.createBiquadFilter(); g.filter.type = 'lowpass';
    g.bassG = c.createGain(); g.chordG = c.createGain();
    g.out = c.createGain();
    g.kitLP.connect(g.drive); g.bassG.connect(g.drive); g.chordG.connect(g.drive);
    g.drive.connect(g.crush).connect(g.filter).connect(g.out);
    g.dSend = c.createGain(); g.delay = c.createDelay(2); g.fb = c.createGain(); g.dTone = c.createBiquadFilter(); g.dTone.type = 'lowpass'; g.dTone.frequency.value = 3500;
    g.filter.connect(g.dSend).connect(g.delay); g.delay.connect(g.dTone).connect(g.fb).connect(g.delay); g.dTone.connect(g.out);
    g.rSend = c.createGain(); g.conv = c.createConvolver(); g.conv.buffer = impulse(c, 2.4);
    g.filter.connect(g.rSend).connect(g.conv).connect(g.out);
    g.comp = c.createDynamicsCompressor(); g.comp.attack.value = 0.005; g.comp.release.value = 0.15;
    g.out.connect(g.comp);
    if (live) {
      g.an = c.createAnalyser(); g.an.fftSize = 256; g.comp.connect(g.an); g.an.connect(c.destination);
      const sp = c.createChannelSplitter(2); g.comp.connect(sp); g.anL = c.createAnalyser(); g.anR = c.createAnalyser(); g.anL.fftSize = g.anR.fftSize = 512; sp.connect(g.anL, 0); sp.connect(g.anR, 1);
    } else g.comp.connect(c.destination);
    applyAll(g);
    return g;
  }
  function applyAll(g) {
    const c = g.c, t = c.currentTime, fx = S.fx;
    g.kitLP.frequency.setValueAtTime(kit().lp, t);
    g.trk.forEach((tr, i) => {
      tr.gn.gain.setTargetAtTime(S.mix.vol[i], t, 0.01);
      if (tr.pn) tr.pn.pan.setTargetAtTime(S.mix.pan[i], t, 0.01);
      const f = S.mix.filt[i];
      if (f < -0.02) { tr.fl.type = 'lowpass'; tr.fl.frequency.setTargetAtTime(20000 * Math.pow(0.01, -f), t, 0.02); tr.fl.Q.value = 1.5; }
      else if (f > 0.02) { tr.fl.type = 'highpass'; tr.fl.frequency.setTargetAtTime(30 * Math.pow(100, f), t, 0.02); tr.fl.Q.value = 1.5; }
      else { tr.fl.type = 'lowpass'; tr.fl.frequency.setTargetAtTime(20000, t, 0.02); tr.fl.Q.value = 0.5; }
    });
    const dk = Math.round(fx.drive * 100), ck = Math.round(fx.crush * 100);
    if (g.curves.d !== dk) { g.drive.curve = dk > 1 ? driveCurve(fx.drive * 30) : null; g.curves.d = dk; }
    if (g.curves.c !== ck) { g.crush.curve = ck > 1 ? crushCurve(Math.round(12 - fx.crush * 9)) : null; g.curves.c = ck; }
    g.filter.frequency.setTargetAtTime(80 * Math.pow(250, fx.cut), t, 0.02);
    g.filter.Q.setTargetAtTime(0.5 + fx.res * 14, t, 0.02);
    g.delay.delayTime.setValueAtTime((60 / S.tempo) * 0.75, t);
    g.dSend.gain.setTargetAtTime(fx.delay * 0.7, t, 0.02); g.fb.gain.setTargetAtTime(fx.fb * 0.85, t, 0.02);
    g.rSend.gain.setTargetAtTime(fx.rev * 0.9, t, 0.02);
    g.comp.threshold.setTargetAtTime(-6 - fx.glue * 26, t, 0.02); g.comp.ratio.setTargetAtTime(1.5 + fx.glue * 8, t, 0.02);
    g.out.gain.setTargetAtTime(fx.vol * (fx.drive > 0.3 ? 0.7 : 1), t, 0.02);
    g.bassG.gain.setTargetAtTime(S.bass.vol, t, 0.02); g.chordG.gain.setTargetAtTime(S.bass.chVol, t, 0.02);
  }

  function env(gn, t, peak, dec, att = 0.001) { gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + att); gn.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(att + 0.005, dec)); }
  const bq = (c, type, f, q = 1) => { const x = c.createBiquadFilter(); x.type = type; x.frequency.value = f; x.Q.value = q; return x; };
  const osc = (c, type, f, t, dur) => { const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(Math.min(f, c.sampleRate / 2 - 100), t); o.start(t); o.stop(t + dur + 0.05); return o; };
  const nsrc = (g, t, dur, buf) => { const s = g.c.createBufferSource(); s.buffer = buf || g.noise; s.start(t, Math.random() * 0.4); s.stop(t + dur + 0.05); return s; };
  function stepNoise(g, rate) {
    if (g.step[rate]) return g.step[rate];
    const c = g.c, b = c.createBuffer(1, c.sampleRate, c.sampleRate), d = b.getChannelData(0), hold = Math.max(1, Math.round(c.sampleRate / rate));
    let v = 0; for (let i = 0; i < d.length; i++) { if (i % hold === 0) v = Math.random() > 0.5 ? 0.8 : -0.8; d[i] = v; }
    return (g.step[rate] = b);
  }
  const METAL = [205.3, 304.4, 369.6, 522.7, 540, 800];
  const SYN = {
    kick(g, o, t, v, p, k) {
      const c = g.c, os = osc(c, 'sine', p.f0 * k, t, p.dec); os.frequency.exponentialRampToValueAtTime(p.f1 * k, t + p.pd);
      const ga = c.createGain(); env(ga, t, v, p.dec);
      if (p.drive) { const ws = c.createWaveShaper(); ws.curve = driveCurve(p.drive); os.connect(ws).connect(ga); } else os.connect(ga);
      ga.connect(o);
      if (p.click) { const n = nsrc(g, t, 0.03), cg = c.createGain(); env(cg, t, v * p.click, 0.014); n.connect(bq(c, 'highpass', 1800)).connect(cg).connect(o); }
    },
    sub(g, o, t, v, p, k) {
      const c = g.c, os = osc(c, 'sine', p.f0 * k, t, p.dec); os.frequency.exponentialRampToValueAtTime(p.f1 * k, t + 0.09);
      const ws = c.createWaveShaper(); ws.curve = driveCurve(1.5); const ga = c.createGain(); env(ga, t, v * 0.9, p.dec, 0.003);
      os.connect(ws).connect(ga).connect(o);
      const n = nsrc(g, t, 0.02), cg = c.createGain(); env(cg, t, v * 0.2, 0.01); n.connect(bq(c, 'highpass', 2500)).connect(cg).connect(o);
    },
    snare(g, o, t, v, p, k) {
      const c = g.c, os = osc(c, 'triangle', p.tone * k, t, p.td + 0.05); os.frequency.exponentialRampToValueAtTime(p.tone * k * 0.72, t + p.td);
      const og = c.createGain(); env(og, t, v * 0.7, p.td); os.connect(og).connect(o);
      const n = nsrc(g, t, p.nd), ng = c.createGain(); env(ng, t, v * 0.6 * p.na, p.nd); n.connect(bq(c, 'highpass', p.hp)).connect(ng).connect(o);
      if (p.rattle) { const n2 = nsrc(g, t, p.nd * 1.4), g2 = c.createGain(); env(g2, t + 0.004, v * 0.25, p.nd * 1.3); n2.connect(bq(c, 'bandpass', 4200, 0.8)).connect(g2).connect(o); }
    },
    metal(g, o, t, v, p, k) {
      const c = g.c, sum = c.createGain(); sum.gain.value = 0.25;
      METAL.forEach((f) => osc(c, 'square', f * 1.5 * k, t, p.dec).connect(sum));
      const ga = c.createGain(); env(ga, t, v * p.a, p.dec);
      sum.connect(bq(c, 'bandpass', 10000, 0.7)).connect(bq(c, 'highpass', p.hp)).connect(ga).connect(o);
    },
    hat(g, o, t, v, p, k) { const c = g.c, n = nsrc(g, t, p.dec), ga = c.createGain(); env(ga, t, v * p.a, p.dec); n.connect(bq(c, 'highpass', p.hp * Math.min(1.4, k))).connect(ga).connect(o); },
    clap(g, o, t, v, p) {
      const c = g.c, n = nsrc(g, t, p.dec + 0.05), ga = c.createGain();
      ga.gain.setValueAtTime(0.0001, t); [0, 0.011, 0.022].forEach((d) => { ga.gain.setValueAtTime(v * 0.8, t + d); ga.gain.exponentialRampToValueAtTime(v * 0.15, t + d + 0.009); });
      ga.gain.setValueAtTime(v * 0.6, t + 0.031); ga.gain.exponentialRampToValueAtTime(0.0001, t + p.dec);
      n.connect(bq(c, 'bandpass', p.bp, 1.2)).connect(ga).connect(o);
    },
    tom(g, o, t, v, p, k) {
      const c = g.c, os = osc(c, 'sine', p.f0 * k, t, p.dec); os.frequency.exponentialRampToValueAtTime(p.f1 * k, t + p.dec * 0.8);
      const ga = c.createGain(); env(ga, t, v * 0.85, p.dec); os.connect(ga).connect(o);
      if (p.skin) { const n = nsrc(g, t, 0.06), ng = c.createGain(); env(ng, t, v * 0.25, 0.05); n.connect(bq(c, 'bandpass', 900, 1)).connect(ng).connect(o); }
      if (p.ring) { const r = osc(c, 'triangle', p.f0 * 1.52 * k, t, p.dec), rg = c.createGain(); env(rg, t, v * 0.25, p.dec * 1.4); r.connect(rg).connect(o); }
    },
    rim(g, o, t, v, p, k) {
      const c = g.c, os = osc(c, 'square', p.f * k, t, p.dec), ga = c.createGain(); env(ga, t, v * 0.35, p.dec); os.connect(bq(c, 'bandpass', p.f * k, 4)).connect(ga).connect(o);
      const n = nsrc(g, t, 0.03), ng = c.createGain(); env(ng, t, v * 0.3, 0.02); n.connect(bq(c, 'highpass', 3000)).connect(ng).connect(o);
    },
    cow(g, o, t, v, p, k) { const c = g.c, ga = c.createGain(); env(ga, t, v * 0.35, p.dec); const b = bq(c, 'bandpass', (p.f1 + p.f2) * 0.75 * k, 2); b.connect(ga).connect(o); [p.f1, p.f2].forEach((f) => osc(c, 'square', f * k, t, p.dec).connect(b)); },
    crash(g, o, t, v, p) {
      const c = g.c, n = nsrc(g, t, p.dec), ga = c.createGain(); env(ga, t, v * 0.5, p.dec, 0.003); n.connect(p.bp ? bq(c, 'bandpass', p.bp, 0.8) : bq(c, 'highpass', 4500)).connect(ga).connect(o);
      SYN.metal(g, o, t, v * 0.5, { hp: 6000, dec: p.dec * 0.7, a: 0.2 }, 1.2);
    },
    shaker(g, o, t, v, p) { const c = g.c, n = nsrc(g, t, p.dec + 0.02), ga = c.createGain(); env(ga, t, v * 0.4, p.dec, 0.015); n.connect(bq(c, 'bandpass', 6500, 1.5)).connect(ga).connect(o); },
    tamb(g, o, t, v, p) { const c = g.c; [0, 0.012, 0.024].forEach((d, i) => { const n = nsrc(g, t + d, p.dec), ga = c.createGain(); env(ga, t + d, v * (0.4 - i * 0.1), p.dec); n.connect(bq(c, 'highpass', 7000)).connect(ga).connect(o); }); },
    snap(g, o, t, v) { const c = g.c, n = nsrc(g, t, 0.08), ga = c.createGain(); env(ga, t, v * 0.7, 0.06); n.connect(bq(c, 'bandpass', 2600, 3)).connect(ga).connect(o); },
    brush(g, o, t, v, p) { const c = g.c, n = nsrc(g, t, p.dec + 0.1), ga = c.createGain(); env(ga, t, v * 0.35, p.dec + p.a, p.a); n.connect(bq(c, 'bandpass', 3500, 0.8)).connect(ga).connect(o); },
    pop(g, o, t, v) {
      const c = g.c, n = nsrc(g, t, 0.02), ga = c.createGain(); env(ga, t, v * 0.6, 0.015); n.connect(bq(c, 'lowpass', 1800)).connect(ga).connect(o);
      const s = osc(c, 'sine', 70, t, 0.08), sg = c.createGain(); env(sg, t, v * 0.4, 0.07); s.connect(sg).connect(o);
    },
    scratch(g, o, t, v) { const c = g.c, n = nsrc(g, t, 0.25), b = bq(c, 'bandpass', 800, 4), ga = c.createGain(); b.frequency.setValueAtTime(700, t); b.frequency.exponentialRampToValueAtTime(3200, t + 0.08); b.frequency.exponentialRampToValueAtTime(600, t + 0.2); env(ga, t, v * 0.8, 0.22, 0.01); n.connect(b).connect(ga).connect(o); },
    bell(g, o, t, v, p, k) { const c = g.c; [[1, 0.5], [2.76, 0.25], [5.4, 0.12]].forEach(([m, a]) => { const os = osc(c, 'sine', p.f * m * k, t, p.dec), ga = c.createGain(); env(ga, t, v * a, p.dec / m); os.connect(ga).connect(o); }); },
    clang(g, o, t, v, p, k) { const c = g.c; [[1, 0.4], [2.76, 0.3], [5.4, 0.2], [8.93, 0.12]].forEach(([m, a]) => { const os = osc(c, 'sine', p.f * m * k, t, p.dec), ga = c.createGain(); env(ga, t, v * a, p.dec / Math.sqrt(m)); os.connect(ga).connect(o); }); SYN.snap(g, o, t, v * 0.5); },
    orch(g, o, t, v, p, k) {
      const c = g.c, f = bq(c, 'lowpass', 4000, 1), ga = c.createGain();
      f.frequency.setValueAtTime(p.brass ? 2500 : 5000, t); f.frequency.exponentialRampToValueAtTime(600, t + p.dec);
      env(ga, t, v * 0.5, p.dec, 0.006); f.connect(ga).connect(o);
      [1, 1.26, 1.5, 2, 0.5].forEach((m, i) => { const os = osc(c, 'sawtooth', p.f * m * k, t, p.dec); os.detune.value = (i % 2 ? 8 : -8); const og = c.createGain(); og.gain.value = 0.12; os.connect(og).connect(f); });
    },
    glitch(g, o, t, v, p) { const c = g.c; for (let i = 0; i < p.n; i++) { const tt = t + i * 0.018, os = osc(c, 'square', 200 + Math.random() * 2800, tt, 0.02), ga = c.createGain(); env(ga, tt, v * 0.18, 0.015); os.connect(ga).connect(o); } },
    zap(g, o, t, v, p, k) { const c = g.c, os = osc(c, p.type || 'sine', p.f0 * k, t, p.dec); os.frequency.exponentialRampToValueAtTime(p.f1 * k, t + p.dec); const ga = c.createGain(); env(ga, t, v * (p.type ? 0.2 : 0.5), p.dec); os.connect(ga).connect(o); },
    sweep(g, o, t, v, p) { const c = g.c, n = nsrc(g, t, p.dec), b = bq(c, 'bandpass', 300, 3), ga = c.createGain(); b.frequency.setValueAtTime(p.up ? 300 : 6000, t); b.frequency.exponentialRampToValueAtTime(p.up ? 7000 : 300, t + p.dec); ga.gain.setValueAtTime(0.0001, t); ga.gain.linearRampToValueAtTime(v * 0.6, t + p.dec * (p.up ? 0.9 : 0.1)); ga.gain.linearRampToValueAtTime(0.0001, t + p.dec); n.connect(b).connect(ga).connect(o); },
    vox(g, o, t, v, p, k) {
      const c = g.c, os = osc(c, 'sawtooth', p.f * k, t, 0.3); os.frequency.exponentialRampToValueAtTime(p.f * k * 0.8, t + 0.25);
      const ga = c.createGain(); env(ga, t, v * 0.6, 0.28, 0.01); ga.connect(o);
      [[800, 6, 1], [1250, 8, 0.6], [2600, 10, 0.3]].forEach(([fq, q, a]) => { const b = bq(c, 'bandpass', fq, q), bg = c.createGain(); bg.gain.value = a; os.connect(b).connect(bg).connect(ga); });
    },
    whistle(g, o, t, v, p, k) {
      const c = g.c, dur = p.siren ? 0.9 : 0.3, os = osc(c, 'sine', p.f * k, t, dur), l = osc(c, 'sine', p.siren ? 4 : 18, t, dur), lg = c.createGain();
      lg.gain.value = p.siren ? p.f * 0.5 : 60; l.connect(lg).connect(os.frequency);
      const ga = c.createGain(); env(ga, t, v * 0.25, dur, 0.02); os.connect(ga).connect(o);
    },
    mouth(g, o, t, v, p) {
      const c = g.c, K = p.k;
      const nz = (f, q, dec, a, att = 0.002, type = 'bandpass') => { const n = nsrc(g, t, dec), ga = c.createGain(); env(ga, t, v * a, dec, att); n.connect(bq(c, type, f, q)).connect(ga).connect(o); };
      if (K === 'b') { const os = osc(c, 'sine', 95, t, 0.2); os.frequency.exponentialRampToValueAtTime(45, t + 0.12); const ga = c.createGain(); env(ga, t, v, 0.18); os.connect(ga).connect(o); nz(400, 1, 0.05, 0.6, 0.002, 'lowpass'); }
      else if (K === 'pf') { nz(1800, 1, 0.13, 0.9, 0.004); nz(300, 1, 0.03, 0.5, 0.002, 'lowpass'); }
      else if (K === 't') nz(7000, 2, 0.04, 0.6);
      else if (K === 'ts') nz(6500, 1, 0.26, 0.45, 0.01);
      else if (K === 'k') nz(3000, 4, 0.03, 0.9);
      else if (K === 'ch') nz(2500, 0.7, 0.15, 0.7, 0.005);
      else if (K === 'hum') { const os = osc(c, 'sawtooth', 110, t, 0.45), ga = c.createGain(); env(ga, t, v * 0.4, 0.42, 0.03); os.connect(bq(c, 'lowpass', 500, 2)).connect(ga).connect(o); }
      else { const n = nsrc(g, t, 0.4), ga = c.createGain(), tr = c.createGain(), l = osc(c, 'square', 28, t, 0.4), lg = c.createGain(); lg.gain.value = 0.5; tr.gain.value = 0.5; l.connect(lg).connect(tr.gain); env(ga, t, v * 0.8, 0.36, 0.02); n.connect(bq(c, 'lowpass', 350, 1)).connect(tr).connect(ga).connect(o); }
    },
    chipk(g, o, t, v, p, k) { const c = g.c, os = osc(c, 'square', 220 * k, t, 0.2); os.frequency.exponentialRampToValueAtTime(35 * k, t + 0.12); const ga = c.createGain(); env(ga, t, v * 0.45, 0.18); os.connect(ga).connect(o); },
    chipn(g, o, t, v, p) { const c = g.c, n = nsrc(g, t, p.dec, stepNoise(g, p.rate)), ga = c.createGain(); env(ga, t, v * 0.35, p.dec); n.connect(ga).connect(o); },
    blip(g, o, t, v, p, k) { const c = g.c, os = osc(c, 'square', p.f * k, t, 0.09); os.frequency.setValueAtTime(p.f * k * 1.5, t + 0.03); const ga = c.createGain(); env(ga, t, v * 0.2, 0.08); os.connect(ga).connect(o); },
    chipt(g, o, t, v, p, k) { const c = g.c, os = osc(c, 'triangle', p.f0 * k, t, 0.22); os.frequency.exponentialRampToValueAtTime(p.f1 * k, t + 0.2); const ga = c.createGain(); env(ga, t, v * 0.6, 0.22); os.connect(ga).connect(o); },
    arp(g, o, t, v, p, k) { const c = g.c; [1, 1.26, 1.5, 2].forEach((m, i) => { const tt = t + i * 0.028, os = osc(c, 'square', p.f * k * m, tt, 0.03), ga = c.createGain(); env(ga, tt, v * 0.14, 0.026); os.connect(ga).connect(o); }); },
    bass(g, o, t, v, p, k) { const c = g.c, os = osc(c, 'square', p.f * k, t, 0.3), ga = c.createGain(); env(ga, t, v * 0.35, 0.28, 0.003); os.connect(bq(c, 'lowpass', 900)).connect(ga).connect(o); },
    conga(g, o, t, v, p, k) {
      const c = g.c, os = osc(c, 'sine', p.f * k * 1.08, t, p.dec); os.frequency.exponentialRampToValueAtTime(p.f * k, t + 0.04);
      const ga = c.createGain(); env(ga, t, v * 0.8, p.dec); os.connect(ga).connect(o);
      const n = nsrc(g, t, 0.02), ng = c.createGain(); env(ng, t, v * 0.25, 0.015); n.connect(bq(c, 'bandpass', 2500, 1)).connect(ng).connect(o);
    },
    clave(g, o, t, v, p, k) { const c = g.c, os = osc(c, 'sine', p.f * k, t, 0.06), ga = c.createGain(); env(ga, t, v * 0.6, 0.055); os.connect(ga).connect(o); },
    guiro(g, o, t, v) { const c = g.c; for (let i = 0; i < 9; i++) { const tt = t + i * 0.02, n = nsrc(g, tt, 0.015), ga = c.createGain(); env(ga, tt, v * (0.15 + i * 0.03), 0.012); n.connect(bq(c, 'bandpass', 3200, 3)).connect(ga).connect(o); } }
  };
  const vlvl = new Array(ROWS).fill(0);
  function trig(g, row, t, vel) {
    const vc = kit().v[row]; if (!vc) return;
    try { SYN[vc[1]](g, g.trk[row].gn, t, vel, vc[2], Math.pow(2, S.mix.tune[row] / 12)); } catch {}
    if (g === G) setTimeout(() => { vlvl[row] = Math.max(vlvl[row], vel); }, Math.max(0, (t - G.c.currentTime) * 1000));
  }

  const scale = () => SCALES[S.bass.scale] || SCALES.minor;
  function bassMidi(n) { const sc = scale().s, oct = Math.floor(n / sc.length); return 12 * (S.bass.oct + 1) + S.bass.root + 12 * oct + sc[n % sc.length]; }
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function playBass(g, t, midi, dur, vel = 0.8) {
    const c = g.c, f = mtof(midi), syn = S.bass.synth, out = c.createGain(), lp = bq(c, 'lowpass', 400, 1);
    const cut = 150 + Math.pow(S.bass.cut, 2) * 5000;
    out.gain.setValueAtTime(0.0001, t); out.gain.exponentialRampToValueAtTime(0.5 * vel, t + 0.006); out.gain.setValueAtTime(0.5 * vel, t + dur * 0.85); out.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.05);
    lp.connect(out).connect(g.bassG);
    const o1 = (type, fr, det = 0, a = 1) => { const o = osc(c, type, fr, t, dur + 0.1); o.detune.value = det; const og = c.createGain(); og.gain.value = a; o.connect(og).connect(lp); return o; };
    if (syn === 'sub') { o1('sine', f); o1('triangle', f * 2, 0, 0.15); lp.frequency.value = Math.max(300, cut * 0.4); }
    else if (syn === 'acid') { o1('sawtooth', f, 0, 0.7); lp.Q.value = 14; lp.frequency.setValueAtTime(cut + 2500 * vel, t); lp.frequency.exponentialRampToValueAtTime(Math.max(120, cut * 0.4), t + Math.min(0.25, dur)); }
    else if (syn === 'reese') { o1('sawtooth', f, -14, 0.45); o1('sawtooth', f, 14, 0.45); o1('sine', f / 2, 0, 0.5); lp.frequency.value = Math.max(200, cut * 0.6); lp.Q.value = 2; }
    else if (syn === 'pluck') { o1('square', f, 0, 0.5); o1('sawtooth', f, 7, 0.3); lp.Q.value = 4; lp.frequency.setValueAtTime(cut + 2000, t); lp.frequency.exponentialRampToValueAtTime(Math.max(150, cut * 0.3), t + 0.15); out.gain.setTargetAtTime(0.0001, t + 0.02, 0.12); }
    else if (syn === 'square') { o1('square', f, 0, 0.5); o1('square', f / 2, 0, 0.3); lp.frequency.value = cut + 400; lp.Q.value = 1.5; }
    else { o1('sawtooth', f, 0, 0.6); o1('sine', f / 2, 0, 0.6); lp.Q.value = 8; const l = osc(c, 'sine', S.tempo / 60 * 2, t, dur + 0.1), lg = c.createGain(); lg.gain.value = cut * 0.8 + 300; lp.frequency.value = cut * 0.6 + 350; l.connect(lg).connect(lp.frequency); }
  }
  function chordNotes(deg) {
    const sc = scale(), base = sc.base ? SCALES[sc.base].s : sc.s.length === 7 ? sc.s : SCALES.minor.s;
    return [0, 2, 4].map((i) => { const d = deg + i; return 48 + S.bass.root + 12 * Math.floor(d / 7) + base[d % 7]; });
  }
  function chordName(deg) {
    if (deg < 0) return '·';
    const n = chordNotes(deg), root = NOTE[n[0] % 12], third = (n[1] - n[0] + 12) % 12, fifth = (n[2] - n[0] + 12) % 12;
    return root + (third === 3 ? (fifth === 6 ? '°' : 'm') : fifth === 8 ? '+' : '');
  }
  function playChord(g, t, deg, dur) {
    const c = g.c;
    chordNotes(deg).forEach((m) => {
      const f = mtof(m), ga = c.createGain(), lp = bq(c, 'lowpass', 1800, 0.7);
      ga.gain.setValueAtTime(0.0001, t); ga.gain.linearRampToValueAtTime(0.12, t + 0.06); ga.gain.setValueAtTime(0.12, t + dur * 0.8); ga.gain.linearRampToValueAtTime(0.0001, t + dur + 0.25);
      lp.connect(ga).connect(g.chordG);
      [-7, 7].forEach((det) => { const o = osc(c, 'sawtooth', f, t, dur + 0.3); o.detune.value = det; o.connect(lp); });
    });
  }

  let G = null;
  function audio() { const c = Curio.audioContext(); if (!c) return null; if (!G) G = makeGraph(c, true); return c; }
  function hitNow(row, vel = 0.75) { if (Curio.muted) return; const c = audio(); if (!c) return; trig(G, row, c.currentTime + 0.005, vel); }

  const grid = $('grid'), cells = [], rows = [], nameEls = [], msEls = [], lenEls = [], vuEls = [];
  D.colors.forEach((col, i) => {
    const row = document.createElement('div'); row.className = 'dm-row' + (i >= 8 ? ' extra' : '');
    row.innerHTML = `<button class="dm-name" type="button" style="color:${col}"><i style="background:${col}"></i><span style="color:#eee"></span><em class="vu"></em></button><button class="dm-ms m" type="button" aria-pressed="false">M</button><button class="dm-ms s" type="button" aria-pressed="false">S</button><select class="dm-len" aria-label="Track length"></select><div class="dm-steps"></div>`;
    const nb = row.querySelector('.dm-name'); nb.addEventListener('click', () => { hitNow(i); flashName(i); setSel(i); });
    const [mb, sb] = row.querySelectorAll('.dm-ms');
    mb.addEventListener('click', () => { S.mix.mute[i] = !S.mix.mute[i]; paintMS(); save(); });
    sb.addEventListener('click', () => { S.mix.solo[i] = !S.mix.solo[i]; paintMS(); save(); });
    const ls = row.querySelector('.dm-len');
    for (let n = 16; n >= 1; n--) { const o = document.createElement('option'); o.value = n; o.textContent = `${n}`; ls.append(o); }
    ls.addEventListener('change', () => { pushUndo(); editPat().len[i] = +ls.value; paintRow(i); save(); if (+ls.value !== 16) Curio.toast(`Polymeter: this track now loops every ${ls.value} steps`, 1600); });
    const st = row.querySelector('.dm-steps'); cells[i] = [];
    for (let s = 0; s < STEPS; s++) {
      const c = document.createElement('div'); c.setAttribute('role', 'button'); c.tabIndex = 0; c.className = 'dm-cell'; c.style.setProperty('--c', col); c.style.setProperty('--s', s);
      c.dataset.r = i; c.dataset.s = s; c.innerHTML = '<span class="f"></span>';
      st.append(c); cells[i][s] = c;
    }
    rows.push(row); nameEls.push(nb); msEls.push([mb, sb]); lenEls.push(ls); vuEls.push(nb.querySelector('.vu')); grid.append(row);
  });
  function flashName(i) { const n = nameEls[i]; n.classList.remove('hit'); void n.offsetWidth; n.classList.add('hit'); setTimeout(() => n.classList.remove('hit'), 120); }
  function setSel(i) { S.sel = clamp(i, 0, ROWS - 1); rows.forEach((r, k) => r.classList.toggle('sel', k === S.sel)); save(); }
  function paintMS() {
    const anySolo = S.mix.solo.some(Boolean);
    rows.forEach((row, i) => {
      msEls[i][0].setAttribute('aria-pressed', String(!!S.mix.mute[i])); msEls[i][1].setAttribute('aria-pressed', String(!!S.mix.solo[i]));
      msEls[i][0].setAttribute('aria-label', `Mute track ${i + 1}`); msEls[i][1].setAttribute('aria-label', `Solo track ${i + 1}`);
      row.classList.toggle('muted', !!S.mix.mute[i] || (anySolo && !S.mix.solo[i]));
    });
  }
  const audible = (i) => { const anySolo = S.mix.solo.some(Boolean); return !S.mix.mute[i] && (!anySolo || S.mix.solo[i]); };
  function paintNames() { kit().v.forEach((v, i) => { nameEls[i].querySelector('span').textContent = v[0]; nameEls[i].setAttribute('aria-label', `Preview ${v[0]}`); cells[i].forEach((c, s) => c.setAttribute('aria-label', `${v[0]} step ${s + 1}`)); }); }

  let chal = { active: false };
  const editPat = () => chal.active ? chal.mine : S.pats[S.cur];
  function paintCell(r, s) {
    const P = editPat(), v = P.v[r][s], p = P.p[r][s] || 1, rt = P.r[r][s] || 1, c = cells[r][s];
    c.classList.toggle('on', v > 0); c.setAttribute('aria-pressed', String(v > 0));
    c.classList.toggle('out', s >= (P.len[r] || 16));
    c.querySelector('.f').style.height = ['0', '42%', '72%', '100%'][v];
    c.querySelector('.f').style.opacity = v ? String(PROBS[p] * 0.8 + 0.2) : '1';
    let pr = c.querySelector('.pr'); if (v && p > 1) { if (!pr) { pr = document.createElement('span'); pr.className = 'pr'; c.append(pr); } pr.textContent = Math.round(PROBS[p] * 100); } else pr?.remove();
    let ra = c.querySelector('.rt'); if (v && rt > 1) { if (!ra) { ra = document.createElement('span'); ra.className = 'rt'; c.append(ra); } ra.innerHTML = '<i></i>'.repeat(rt); } else ra?.remove();
  }
  function paintRow(r) { for (let s = 0; s < STEPS; s++) paintCell(r, s); lenEls[r].value = editPat().len[r] || 16; }
  function paintAll() { for (let r = 0; r < ROWS; r++) paintRow(r); paintPats(); paintRoll(); paintChords(); }

  let undoStack = [], redoStack = [];
  const snap = () => JSON.stringify({ pats: S.pats, chain: S.chain, cur: S.cur, kit: S.kit, tempo: S.tempo, swing: S.swing, bass: S.bass });
  function pushUndo() { if (chal.active) return; undoStack.push(snap()); if (undoStack.length > 60) undoStack.shift(); redoStack = []; paintUndo(); }
  function restore(js) { const o = JSON.parse(js); S.pats = o.pats; S.chain = o.chain; S.cur = o.cur; S.tempo = o.tempo; S.swing = o.swing; S.bass = o.bass; setKit(o.kit, true); syncKnobs(); syncBassUI(); paintAll(); paintChain(); save(); }
  function undo() { if (!undoStack.length) { Curio.toast('Nothing to undo'); return; } redoStack.push(snap()); restore(undoStack.pop()); paintUndo(); Curio.beep(330, 0.05, 'triangle', 0.06); }
  function redo() { if (!redoStack.length) { Curio.toast('Nothing to redo'); return; } undoStack.push(snap()); restore(redoStack.pop()); paintUndo(); Curio.beep(440, 0.05, 'triangle', 0.06); }
  function paintUndo() { $('undo').disabled = !undoStack.length; $('redo').disabled = !redoStack.length; }
  $('undo').addEventListener('click', undo); $('redo').addEventListener('click', redo);

  let paint = null;
  function applyTool(r, s, first) {
    const P = editPat(), tool = chal.active || !S.adv ? 'draw' : S.tool;
    if (tool === 'draw') {
      if (first) paint = P.v[r][s] ? 0 : 2;
      if ((P.v[r][s] > 0) === (paint > 0)) return;
      P.v[r][s] = paint; if (!paint) { P.p[r][s] = 1; P.r[r][s] = 1; }
      if (paint) { S.stats.steps++; if (!playing) hitNow(r, 0.75); }
    } else if (!first) return;
    else if (tool === 'vel') {
      P.v[r][s] = P.v[r][s] ? [0, 2, 3, 1][P.v[r][s]] : 2;
      if (P.v[r][s] !== 2) unlock('vel');
      if (!playing) hitNow(r, VELS[P.v[r][s]]);
      Curio.toast(['', 'Soft', 'Normal', 'Accent'][P.v[r][s]], 600);
    } else if (tool === 'prob') {
      if (!P.v[r][s]) { P.v[r][s] = 2; P.p[r][s] = 2; } else P.p[r][s] = (P.p[r][s] % 4) + 1;
      if (P.p[r][s] > 1) unlock('prob');
      Curio.toast(`${Math.round(PROBS[P.p[r][s]] * 100)}% chance`, 600);
    } else if (tool === 'rat') {
      if (!P.v[r][s]) { P.v[r][s] = 2; P.r[r][s] = 2; } else P.r[r][s] = (P.r[r][s] % 3) + 1;
      if (P.r[r][s] > 1) unlock('rat');
      Curio.toast(`${P.r[r][s]} hit${P.r[r][s] > 1 ? 's' : ''} per step`, 600);
      if (!playing) { const c = audio(); if (c) for (let k = 0; k < P.r[r][s]; k++) trig(G, r, c.currentTime + 0.01 + k * 0.05, 0.75); }
    }
    paintCell(r, s); paintPats();
  }
  const cellAt = (p) => document.elementFromPoint(p.clientX, p.clientY)?.closest?.('.dm-cell');
  let dragGrid = false;
  grid.querySelectorAll('.dm-steps').forEach((st) => Curio.drag(st, {
    start: (p) => { const c = cellAt(p); if (!c) { dragGrid = false; return; } p.event?.preventDefault(); dragGrid = true; pushUndo(); setSel(+c.dataset.r); applyTool(+c.dataset.r, +c.dataset.s, true); },
    move: (p) => { if (!dragGrid || paint == null) return; const c = cellAt(p); if (c) applyTool(+c.dataset.r, +c.dataset.s, false); },
    end: () => { if (dragGrid) { dragGrid = false; paint = null; save(); } }
  }));
  grid.addEventListener('keydown', (e) => { const c = e.target.closest('.dm-cell'); if (c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); e.stopPropagation(); pushUndo(); applyTool(+c.dataset.r, +c.dataset.s, true); paint = null; save(); } });
  function toggleStep(s) { pushUndo(); applyTool(S.sel, s, true); paint = null; save(); }

  const toolBtns = $('tools').querySelectorAll('button');
  function setTool(t) { S.tool = t; toolBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tool === t))); save(); }
  toolBtns.forEach((b) => b.addEventListener('click', () => { setTool(b.dataset.tool); Curio.beep(600, 0.03, 'square', 0.04); }));

  const patBtns = [];
  for (let i = 0; i < NPAT; i++) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'dm-pat'; b.textContent = LET[i]; b.setAttribute('aria-label', `Pattern ${LET[i]}`);
    b.addEventListener('click', () => selectPat(i)); $('pats').append(b); patBtns.push(b);
  }
  function selectPat(i) { if (chal.active) { Curio.toast('Finish or exit the challenge first'); return; } S.cur = i; paintAll(); save(); Curio.beep(500 + i * 40, 0.04, 'square', 0.04); }
  function paintPats() { patBtns.forEach((b, i) => { b.setAttribute('aria-pressed', String(i === S.cur && !chal.active)); b.classList.toggle('has', !patEmpty(S.pats[i])); b.classList.toggle('playing', playing && i === playPat && S.pm === 'song'); }); $('lcdPat').textContent = chal.active ? 'CHALLENGE' : `PAT ${LET[S.cur]}`; }

  const leds = $('leds'), ledEls = [];
  for (let s = 0; s < STEPS; s++) { const l = document.createElement('i'); l.className = 'dm-led'; leds.append(l); ledEls.push(l); }

  const rollEl = $('roll'), rollCells = [], rollLabels = [];
  for (let row = BROWS - 1; row >= 0; row--) {
    const lab = document.createElement('span'); rollEl.append(lab); rollLabels[row] = lab;
    rollCells[row] = [];
    for (let s = 0; s < STEPS; s++) { const c = document.createElement('div'); c.setAttribute('role', 'button'); c.tabIndex = 0; c.className = 'dm-rc' + (s % 4 === 0 ? ' beat' : ''); c.dataset.n = row; c.dataset.s = s; rollEl.append(c); rollCells[row][s] = c; }
  }
  function paintRoll() {
    const P = editPat();
    for (let row = 0; row < BROWS; row++) {
      const m = bassMidi(row); rollLabels[row].textContent = NOTE[m % 12] + (Math.floor(m / 12) - 1); rollLabels[row].classList.toggle('root', row % scale().s.length === 0);
      for (let s = 0; s < STEPS; s++) { const on = P.bn[s] === row; rollCells[row][s].classList.toggle('on', on); rollCells[row][s].setAttribute('aria-label', `Bass ${rollLabels[row].textContent} step ${s + 1}${on ? ', on' : ''}`); }
    }
  }
  const rcAt = (p) => document.elementFromPoint(p.clientX, p.clientY)?.closest?.('.dm-rc');
  let rollPaint = null;
  function previewBass(n) { if (Curio.muted) return; const c = audio(); if (c) playBass(G, c.currentTime + 0.01, bassMidi(n), 0.25); }
  Curio.drag(rollEl, {
    start: (p) => { const c = rcAt(p); if (!c) { rollPaint = null; return; } p.event?.preventDefault(); pushUndo(); const P = editPat(), n = +c.dataset.n, s = +c.dataset.s; rollPaint = P.bn[s] === n ? 'off' : n; P.bn[s] = rollPaint === 'off' ? -1 : n; if (rollPaint !== 'off') { previewBass(n); unlock('bass'); } paintRoll(); paintPats(); },
    move: (p) => { if (rollPaint == null) return; const c = rcAt(p); if (!c) return; const P = editPat(), s = +c.dataset.s; if (rollPaint === 'off') { if (P.bn[s] === +c.dataset.n) { P.bn[s] = -1; paintRoll(); } } else if (P.bn[s] !== rollPaint) { P.bn[s] = rollPaint; paintRoll(); } },
    end: () => { if (rollPaint != null) { rollPaint = null; save(); paintPats(); } }
  });
  rollEl.addEventListener('keydown', (e) => { const c = e.target.closest('.dm-rc'); if (c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); e.stopPropagation(); pushUndo(); const P = editPat(), n = +c.dataset.n, s = +c.dataset.s; P.bn[s] = P.bn[s] === n ? -1 : n; paintRoll(); save(); } });
  const chSlotEls = [];
  for (let i = 0; i < 4; i++) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'dm-chslot'; b.title = `Chord for beat ${i + 1}: click to change`;
    b.addEventListener('click', () => { pushUndo(); const P = editPat(); P.ch[i] = P.ch[i] >= 6 ? -1 : P.ch[i] + 1; paintChords(); save(); if (P.ch[i] >= 0) { const c = audio(); if (c && !Curio.muted) playChord(G, c.currentTime + 0.01, P.ch[i], 0.5); unlock('chords'); } });
    $('chSlots').append(b); chSlotEls.push(b);
  }
  const chPadEls = [];
  const padChord = (d) => { const c = audio(); if (c && !Curio.muted) playChord(G, c.currentTime + 0.01, d, 0.6); };
  for (let d = 0; d < 7; d++) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'dm-chpad';
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); padChord(d); });
    b.addEventListener('keydown', (e) => { if (e.key === 'Enter') padChord(d); });
    $('chPads').append(b); chPadEls.push(b);
  }
  function paintChords() {
    const P = editPat();
    chSlotEls.forEach((b, i) => { b.textContent = chordName(P.ch[i]); b.classList.toggle('on', P.ch[i] >= 0); b.setAttribute('aria-label', `Chord slot ${i + 1}: ${P.ch[i] >= 0 ? chordName(P.ch[i]) : 'none'}`); });
    chPadEls.forEach((b, d) => { b.textContent = chordName(d); b.title = `Play ${chordName(d)}`; });
  }
  D.synths.forEach((s) => { const o = document.createElement('option'); o.value = s.id; o.textContent = s.n; $('bSynth').append(o); });
  NOTE.forEach((n, i) => { const o = document.createElement('option'); o.value = i; o.textContent = n; $('bRoot').append(o); });
  D.scales.forEach((s) => { const o = document.createElement('option'); o.value = s.id; o.textContent = s.n; $('bScale').append(o); });
  function syncBassUI() { $('bSynth').value = S.bass.synth; $('bRoot').value = S.bass.root; $('bScale').value = S.bass.scale; $('octV').textContent = S.bass.oct; paintRoll(); paintChords(); }
  $('bSynth').addEventListener('change', () => { S.bass.synth = $('bSynth').value; save(); previewBass(0); });
  $('bRoot').addEventListener('change', () => { S.bass.root = +$('bRoot').value; save(); syncBassUI(); previewBass(0); });
  $('bScale').addEventListener('change', () => { S.bass.scale = $('bScale').value; save(); syncBassUI(); previewBass(2); });
  $('octDown').addEventListener('click', () => { S.bass.oct = Math.max(0, S.bass.oct - 1); save(); syncBassUI(); previewBass(0); });
  $('octUp').addEventListener('click', () => { S.bass.oct = Math.min(4, S.bass.oct + 1); save(); syncBassUI(); previewBass(0); });
  $('bassClear').addEventListener('click', () => { pushUndo(); const P = editPat(); P.bn.fill(-1); P.ch = [-1, -1, -1, -1]; paintRoll(); paintChords(); save(); });

  function arcPath(a0, a1) {
    const p = (a) => [24 + 19 * Math.sin(a * Math.PI / 180), 24 - 19 * Math.cos(a * Math.PI / 180)];
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    return `M${x0.toFixed(2)} ${y0.toFixed(2)}A19 19 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  }
  function knob(parent, o) {
    const el = document.createElement('div'); el.className = 'knob' + (o.adv ? ' adv' : ''); el.tabIndex = 0; el.setAttribute('role', 'slider'); el.setAttribute('aria-label', o.aria || o.label);
    el.innerHTML = `<svg viewBox="0 0 48 48" aria-hidden="true"><path class="k-track" d="${arcPath(-135, 135)}"/><path class="k-val"/><circle class="k-cap" cx="24" cy="24" r="13"/><line class="k-dot" x1="24" y1="24" x2="24" y2="14"/></svg><b></b><label></label>`;
    el.querySelector('label').textContent = o.label;
    const toN = (v) => (v - o.min) / (o.max - o.min), fromN = (n) => { let v = o.min + clamp(n, 0, 1) * (o.max - o.min); if (o.step) v = Math.round(v / o.step) * o.step; return +v.toFixed(4); };
    let val = o.get();
    const draw = () => {
      const n = toN(val), a = -135 + n * 270;
      el.querySelector('.k-val').setAttribute('d', n > 0.002 && !(o.bipolar && Math.abs(a) < 1) ? arcPath(o.bipolar ? Math.min(0, a) : -135, o.bipolar ? Math.max(0, a) : a) : '');
      el.querySelector('.k-dot').setAttribute('transform', `rotate(${a} 24 24)`);
      el.querySelector('b').textContent = o.fmt(val);
      el.setAttribute('aria-valuemin', o.min); el.setAttribute('aria-valuemax', o.max); el.setAttribute('aria-valuenow', val); el.setAttribute('aria-valuetext', o.fmt(val));
    };
    const set = (v) => { v = clamp(v, o.min, o.max); if (v === val) return; val = v; draw(); o.set(v); };
    let drag = null;
    Curio.drag(el, {
      start: (p) => { p.event?.preventDefault(); el.focus(); drag = { y: p.clientY, n: toN(val) }; },
      move: (p) => { if (!drag) return; set(fromN(drag.n + (drag.y - p.clientY) / 160)); },
      end: () => { if (drag) { drag = null; o.done?.(); } }
    });
    el.addEventListener('wheel', (e) => { e.preventDefault(); set(fromN(toN(val) - Math.sign(e.deltaY || -e.deltaX) * 0.03)); o.done?.(); }, { passive: false });
    el.addEventListener('keydown', (e) => { if (e.key === 'Home') { e.preventDefault(); set(o.def); o.done?.(); return; } const d = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 5, PageDown: -5 }[e.key]; if (d) { e.preventDefault(); e.stopPropagation(); set(fromN(toN(val) + d * 0.02)); o.done?.(); } });
    el.addEventListener('dblclick', () => { set(o.def); o.done?.(); });
    draw(); parent.append(el);
    return { el, sync() { val = o.get(); draw(); } };
  }
  const knobs = [];
  const K = (parent, o) => { const k = knob(parent, o); knobs.push(k); return k; };
  K($('topKnobs'), { label: 'Tempo', min: 60, max: 200, step: 1, def: 110, get: () => S.tempo, set: (v) => { S.tempo = v; $('lcdBpm').textContent = v; if (G) applyAll(G); }, done: save, fmt: (v) => String(v) });
  K($('topKnobs'), { adv: true, label: 'Swing', min: 0, max: 60, step: 1, def: 0, get: () => S.swing, set: (v) => { S.swing = v; }, done: save, fmt: (v) => v + '%' });
  K($('topKnobs'), { adv: true, label: 'Volume', min: 0, max: 1, step: 0.01, def: 0.8, get: () => S.fx.vol, set: (v) => { S.fx.vol = v; if (G) applyAll(G); }, done: save, fmt: (v) => Math.round(v * 100) });
  const fxOn = () => { if (S.fx.cut < 0.98 || S.fx.drive > 0.02 || S.fx.crush > 0.02 || S.fx.delay > 0.02 || S.fx.rev > 0.02) unlock('fx'); };
  const FXG = [
    ['Filter', [['Cutoff', 'cut', 1, (v) => { const f = 80 * Math.pow(250, v); return f >= 1000 ? (f / 1000).toFixed(1) + 'k' : Math.round(f); }], ['Reso', 'res', 0.1, (v) => Math.round(v * 100)]]],
    ['Drive', [['Amount', 'drive', 0, (v) => Math.round(v * 100)]]],
    ['Crush', [['Bits', 'crush', 0, (v) => v < 0.01 ? 'off' : String(Math.round(12 - v * 9))]]],
    ['Delay', [['Mix', 'delay', 0, (v) => Math.round(v * 100)], ['Repeat', 'fb', 0.35, (v) => Math.round(v * 100)]]],
    ['Reverb', [['Mix', 'rev', 0, (v) => Math.round(v * 100)]]],
    ['Compressor', [['Glue', 'glue', 0.3, (v) => Math.round(v * 100)]]]
  ];
  FXG.forEach(([name, list]) => {
    const g = document.createElement('div'); g.className = 'dm-fxgroup'; g.innerHTML = '<span></span><div></div>'; g.querySelector('span').textContent = name;
    list.forEach(([lab, key, def, fmt]) => K(g.querySelector('div'), { label: lab, aria: `${name} ${lab}`, min: 0, max: 1, step: 0.01, def, get: () => S.fx[key], set: (v) => { S.fx[key] = v; if (key === 'cut') $('sweep').value = v; if (G) applyAll(G); }, done: () => { save(); fxOn(); }, fmt }));
    $('fx').append(g);
  });
  const FXP = [
    ['✨ Clean', {}], ['📻 Radio', { cut: 0.55, res: 0.35, crush: 0.3 }], ['🌊 Dub', { delay: 0.45, fb: 0.6, rev: 0.2, cut: 0.8 }],
    ['⛪ Cathedral', { rev: 0.75 }], ['🔥 Crunch', { drive: 0.55, crush: 0.15, glue: 0.7 }], ['🫧 Underwater', { cut: 0.32, res: 0.5, rev: 0.3 }], ['👾 Arcade', { crush: 0.75, cut: 0.85 }], ['🏟️ Stadium', { rev: 0.45, glue: 0.8, delay: 0.15 }]
  ];
  FXP.forEach(([n, o]) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = n; b.addEventListener('click', () => { S.fx = { ...DEF_FX, vol: S.fx.vol, ...o }; if (G) applyAll(G); knobs.forEach((k) => k.sync()); $('sweep').value = S.fx.cut; save(); fxOn(); Curio.toast(`${n} effects`); }); $('fxPresets').append(b); });
  const sweepEl = $('sweep'); sweepEl.value = S.fx.cut;
  sweepEl.addEventListener('input', () => { S.fx.cut = +sweepEl.value; if (G) applyAll(G); knobs.forEach((k) => k.sync()); unlock('fx'); });
  sweepEl.addEventListener('change', save);
  $('autoFill').addEventListener('click', () => { S.autoFill = !S.autoFill; $('autoFill').setAttribute('aria-pressed', String(S.autoFill)); save(); Curio.toast(S.autoFill ? 'A fill every 4th bar' : 'Auto fill off', 1200); });

  const stripNames = [];
  D.colors.forEach((col, i) => {
    const s = document.createElement('div'); s.className = 'dm-strip'; s.innerHTML = `<span><i style="background:${col}"></i><em></em></span>`;
    stripNames.push(s.querySelector('em'));
    K(s, { label: 'Vol', aria: `Track ${i + 1} volume`, min: 0, max: 1, step: 0.01, def: 0.8, get: () => S.mix.vol[i], set: (v) => { S.mix.vol[i] = v; if (G) applyAll(G); }, done: save, fmt: (v) => Math.round(v * 100) });
    K(s, { label: 'Pan', aria: `Track ${i + 1} pan`, min: -1, max: 1, step: 0.05, def: 0, bipolar: true, get: () => S.mix.pan[i], set: (v) => { S.mix.pan[i] = v; if (G) applyAll(G); }, done: save, fmt: (v) => Math.abs(v) < 0.03 ? 'C' : (v < 0 ? 'L' : 'R') + Math.round(Math.abs(v) * 100) });
    K(s, { label: 'Filter', aria: `Track ${i + 1} filter`, min: -1, max: 1, step: 0.05, def: 0, bipolar: true, get: () => S.mix.filt[i], set: (v) => { S.mix.filt[i] = v; if (G) applyAll(G); }, done: () => { save(); hitNow(i); }, fmt: (v) => Math.abs(v) < 0.03 ? 'off' : v < 0 ? 'LP' + Math.round(-v * 100) : 'HP' + Math.round(v * 100) });
    K(s, { label: 'Tune', aria: `Track ${i + 1} tune`, min: -12, max: 12, step: 1, def: 0, bipolar: true, get: () => S.mix.tune[i], set: (v) => { S.mix.tune[i] = v; }, done: () => { save(); hitNow(i); }, fmt: (v) => (v > 0 ? '+' : '') + v });
    $('mixer').append(s);
  });
  (() => {
    const s = document.createElement('div'); s.className = 'dm-strip'; s.innerHTML = '<span><i style="background:#fff"></i><em>Bass</em></span>';
    K(s, { label: 'Vol', aria: 'Bass volume', min: 0, max: 1, step: 0.01, def: 0.7, get: () => S.bass.vol, set: (v) => { S.bass.vol = v; if (G) applyAll(G); }, done: save, fmt: (v) => Math.round(v * 100) });
    K(s, { label: 'Tone', aria: 'Bass tone', min: 0, max: 1, step: 0.01, def: 0.55, get: () => S.bass.cut, set: (v) => { S.bass.cut = v; }, done: () => { save(); previewBass(0); }, fmt: (v) => Math.round(v * 100) });
    $('mixer').append(s);
    const c2 = document.createElement('div'); c2.className = 'dm-strip'; c2.innerHTML = '<span><i style="background:#8f7bff"></i><em>Chords</em></span>';
    K(c2, { label: 'Vol', aria: 'Chord volume', min: 0, max: 1, step: 0.01, def: 0.4, get: () => S.bass.chVol, set: (v) => { S.bass.chVol = v; if (G) applyAll(G); }, done: save, fmt: (v) => Math.round(v * 100) });
    $('mixer').append(c2);
  })();
  function syncKnobs() { knobs.forEach((k) => k.sync()); $('lcdBpm').textContent = S.tempo; sweepEl.value = S.fx.cut; }

  const kitBtns = [];
  D.kits.forEach((k) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'dm-kit'; b.style.setProperty('--kc', k.accent); b.style.setProperty('--a1', k.art[0]); b.style.setProperty('--a2', k.art[1]);
    b.innerHTML = '<i></i><span></span>'; b.querySelector('i').textContent = k.e; b.querySelector('span').textContent = k.name; b.dataset.k = k.id;
    b.addEventListener('click', () => { pushUndo(); setKit(k.id); hitNow(0); setTimeout(() => hitNow(1), 140); setTimeout(() => hitNow(2, 0.6), 280); save(); });
    $('kits').append(b); kitBtns.push(b);
  });
  function setKit(id, quiet) {
    if (!KITS[id]) return; S.kit = id;
    kitBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.k === id)));
    $('dm').style.setProperty('--kit', kit().accent); document.documentElement.style.setProperty('--kit', kit().accent);
    $('lcdKit').textContent = kit().name.toUpperCase();
    paintNames(); kit().v.forEach((v, i) => { stripNames[i].textContent = v[0]; });
    paintLivePads();
    if (G) applyAll(G);
    S.kitsUsed[id] = 1; if (Object.keys(S.kitsUsed).length >= 10) unlock('kits');
    if (!quiet) { Curio.toast(`${kit().e} ${kit().name} kit`, 900); const b = kitBtns.find((x) => x.dataset.k === id), box = $('kits'); if (b) box.scrollTo({ left: b.offsetLeft - box.clientWidth / 2 + b.offsetWidth / 2, behavior: 'smooth' }); }
  }

  let playing = false, nextTime = 0, step = 0, abs = 0, timer = 0, playPat = 0, chainIdx = 0, barCount = 0, fillArmed = false, fillBar = false;
  const queue = [];
  function srcPat() { if (chal.active) return chal.src === 'target' ? chal.target : chal.mine; return S.pats[playPat]; }
  function fillHit(r, s) {
    if (r === 1) return s === 12 || s === 13 ? [3, 2] : s === 15 ? [2, 3] : null;
    if (r === 6) return s === 14 ? [3, 1] : null;
    if (r === 5) return s === 15 ? [3, 1] : s === 14 ? [2, 1] : null;
    return null;
  }
  function scheduler() {
    const c = G.c;
    while (nextTime < c.currentTime + 0.12) {
      if (step === 0) {
        if (!chal.active && S.adv && S.pm === 'song' && S.chain.length) { playPat = S.chain[chainIdx % S.chain.length]; queue.push({ bar: chainIdx % S.chain.length, pat: playPat, t: nextTime }); chainIdx++; }
        else if (!chal.active) playPat = S.cur;
        barCount++;
        if (fillBar) { fillBar = false; if (!chal.active && !Curio.muted) trig(G, 10, nextTime, 0.9); }
        if (!chal.active && (fillArmed || (S.autoFill && barCount % 4 === 0))) { fillBar = true; fillArmed = false; queue.push({ fill: true, t: nextTime }); }
        if (S.adv && S.pm === 'song' && S.chain.length >= 4 && barCount > S.chain.length) unlock('song');
      }
      const six = 60 / S.tempo / 4, t = nextTime + (step % 2 ? six * (S.swing / 100) * 0.66 : 0);
      const P = srcPat(), fillNow = fillBar && step >= 12 && !chal.active;
      for (let r = 0; r < ROWS; r++) {
        if (!audible(r)) continue;
        const rs = abs % (P.len[r] || 16);
        let v = P.v[r][rs], n = P.r[r][rs] || 1, pr = P.p[r][rs] || 1;
        if (fillNow) { const fh = fillHit(r, step); if (fh) { v = fh[0]; n = fh[1]; pr = 1; } else if (r === 2 || r === 3) v = 0; }
        if (!v || Math.random() > PROBS[pr]) continue;
        if (!Curio.muted) for (let k = 0; k < n; k++) trig(G, r, t + k * six / n, VELS[v] * (k ? 0.8 : 1));
      }
      if (!Curio.muted && !chal.active) {
        const bn = P.bn[step];
        if (bn >= 0) { let d = 1; while (d < 4 && step + d < STEPS && P.bn[step + d] < 0) d++; playBass(G, t, bassMidi(bn), six * Math.min(d, 2) * 0.95, step % 4 === 0 ? 1 : 0.8); }
        if (step % 4 === 0 && P.ch[step / 4] >= 0) playChord(G, t, P.ch[step / 4], six * 4);
      }
      queue.push({ step, abs, t });
      nextTime += six; step = (step + 1) % STEPS; abs++;
    }
  }
  let shownCells = [], shownLed = -1, lastStepT = 0, lastStep = 0;
  function clearPlayhead() { shownCells.forEach((c) => c.classList.remove('ph', 'hit')); shownCells = []; if (shownLed >= 0) ledEls[shownLed].classList.remove('lit'); shownLed = -1; chSlotEls.forEach((b) => b.classList.remove('ph')); }
  function drawQueue() {
    const c = G?.c; if (!c) return;
    while (queue.length && queue[0].t <= c.currentTime) {
      const q = queue.shift();
      if (q.fill) { $('fill').classList.remove('armed'); $('lcdStep').textContent = 'FILL'; continue; }
      if (q.pat != null) { if (!chal.active && S.cur !== q.pat) { S.cur = q.pat; paintAll(); } paintChainNow(q.bar); continue; }
      const s = q.step; lastStep = s; lastStepT = q.t;
      clearPlayhead(); shownLed = s; ledEls[s].classList.add('lit');
      const P = chal.active ? (chal.src === 'target' ? null : chal.mine) : S.pats[S.cur];
      cells.forEach((row, r) => {
        const rs = P ? q.abs % (P.len[r] || 16) : s, el = row[rs]; el.classList.add('ph'); shownCells.push(el);
        if (P && P.v[r][rs] && audible(r)) { el.classList.add('hit'); flashName(r); }
      });
      if (!chal.active) { for (let n = 0; n < BROWS; n++) { rollCells[n][s].classList.add('ph'); shownCells.push(rollCells[n][s]); } chSlotEls[Math.floor(s / 4)].classList.add('ph'); }
      if ($('lcdStep').textContent !== 'FILL' || s < 12) $('lcdStep').textContent = `${Math.floor(s / 4) + 1}.${(s % 4) + 1}`;
      if (s % 4 === 0) { $('dm').classList.add('beat'); setTimeout(() => $('dm').classList.remove('beat'), 90); }
    }
  }
  function start() {
    const c = audio(); if (!c) { Curio.toast('No audio available in this browser'); return; }
    if (Curio.muted) Curio.toast('Sound is muted, unmute in the top bar 🔊');
    applyAll(G);
    playing = true; step = 0; abs = 0; chainIdx = 0; barCount = 0; fillBar = false; nextTime = c.currentTime + 0.06; queue.length = 0;
    scheduler(); timer = setInterval(scheduler, 25);
    $('play').setAttribute('aria-pressed', 'true'); $('playIcon').textContent = '■'; $('playLbl').textContent = 'Stop'; $('play').setAttribute('aria-label', 'Stop');
    S.stats.plays++; unlock('first'); save();
  }
  function stop() {
    playing = false; clearInterval(timer); queue.length = 0; clearPlayhead(); fillArmed = false; $('fill').classList.remove('armed');
    $('play').setAttribute('aria-pressed', 'false'); $('playIcon').textContent = '▶'; $('playLbl').textContent = 'Play'; $('play').setAttribute('aria-label', 'Play');
    $('lcdStep').textContent = '--'; paintPats(); paintChainNow(-1);
    if (chal.active) { chal.src = null; paintChalBtns(); }
  }
  $('play').addEventListener('click', () => playing ? stop() : start());
  document.addEventListener('visibilitychange', () => { if (document.hidden && playing) stop(); });
  function armFill() { if (!playing) { Curio.toast('Press play first, then hit FILL'); return; } fillArmed = true; $('fill').classList.add('armed'); unlock('fill'); }
  $('fill').addEventListener('click', armFill);

  let taps = [];
  function tap() {
    const now = performance.now(); taps = taps.filter((t) => now - t < 2500); taps.push(now);
    $('tap').classList.add('hit'); setTimeout(() => $('tap').classList.remove('hit'), 80);
    Curio.beep(1500, 0.02, 'square', 0.04);
    if (taps.length >= 3) { const iv = (taps[taps.length - 1] - taps[0]) / (taps.length - 1); S.tempo = clamp(Math.round(60000 / iv), 60, 200); syncKnobs(); if (G) applyAll(G); save(); }
  }
  $('tap').addEventListener('click', tap);

  const pmBtns = $('playMode').querySelectorAll('button');
  function setPM(pm) { S.pm = pm; pmBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.pm === pm))); paintChain(); save(); }
  pmBtns.forEach((b) => b.addEventListener('click', () => { setPM(b.dataset.pm); if (b.dataset.pm === 'song' && !S.chain.length) Curio.toast('Add some patterns to the chain first'); }));
  for (let i = 0; i < NPAT; i++) {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = `+${LET[i]}`; b.setAttribute('aria-label', `Add pattern ${LET[i]} to song`);
    b.addEventListener('click', () => { if (S.chain.length >= 32) { Curio.toast('Song is full (32 bars)'); return; } pushUndo(); S.chain.push(i); paintChain(); save(); Curio.beep(500 + i * 40, 0.04, 'square', 0.04); });
    $('chainAdd').append(b);
  }
  const clr = document.createElement('button'); clr.type = 'button'; clr.textContent = 'Clear song'; clr.addEventListener('click', () => { pushUndo(); S.chain = []; paintChain(); save(); }); $('chainAdd').append(clr);
  let chainEls = [];
  function paintChain() {
    pmBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.pm === S.pm)));
    const box = $('chain'); box.innerHTML = ''; chainEls = [];
    if (!S.chain.length) { const e = document.createElement('span'); e.className = 'c-muted'; e.textContent = 'Empty song. Add patterns below.'; box.append(e); }
    S.chain.forEach((p, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'dm-chip'; b.textContent = LET[p]; b.style.setProperty('--pc', D.colors[p]);
      b.setAttribute('aria-label', `Bar ${i + 1}: pattern ${LET[p]}, tap to remove`);
      b.addEventListener('click', () => { pushUndo(); S.chain.splice(i, 1); paintChain(); save(); });
      box.append(b); chainEls.push(b);
    });
    const secs = S.chain.length * 4 * 60 / S.tempo;
    $('songInfo').textContent = S.chain.length ? `${S.chain.length} bars · ${Math.floor(secs / 60)}:${String(Math.round(secs % 60)).padStart(2, '0')}` : '';
  }
  function paintChainNow(i) { chainEls.forEach((e, k) => e.classList.toggle('now', k === i)); paintPats(); }

  const presetBtns = [];
  D.presets.forEach((pr) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'dm-preset' + (S.tried[pr.n] ? ' tried' : '');
    b.innerHTML = '<i></i><b></b><small></small>'; b.querySelector('i').textContent = pr.e; b.querySelector('b').textContent = pr.n;
    b.querySelector('small').textContent = `${pr.t} BPM · ${KITS[pr.k].name}${pr.b ? ' · bass' : ''}${pr.chain ? ' · song' : ''}`;
    b.addEventListener('click', () => loadPreset(pr));
    $('presets').append(b); presetBtns.push(b);
    const o = document.createElement('option'); o.value = D.presets.indexOf(pr); o.textContent = `${pr.e} ${pr.n} (${pr.t} BPM)`; $('presetSel').append(o);
  });
  function loadPreset(pr) {
    if (chal.active) exitChal();
    pushUndo(); loadPresetInto(S, pr); if (!S.adv) S.pm = 'pattern'; setKit(S.kit, true); setPM(S.pm); syncKnobs(); syncBassUI(); paintAll(); paintChain(); save();
    S.tried[pr.n] = 1; presetBtns[D.presets.indexOf(pr)]?.classList.add('tried'); if (Object.keys(S.tried).length >= 10) unlock('presets');
    Curio.toast(`${pr.e} ${pr.n} loaded`); if (!playing) start();
  }
  const ph = document.createElement('option'); ph.value = ''; ph.textContent = 'Choose a preset…'; $('presetSel').prepend(ph); $('presetSel').value = '';
  $('presetSel').addEventListener('change', () => { const pr = D.presets[+$('presetSel').value]; if (pr && $('presetSel').value !== '') loadPreset(pr); $('presetSel').value = ''; });

  const GENRES = {
    house: { n: 'House', kit: 'house', t: [120, 126], sw: [0, 10], rows: { 0: '9000900090009000', 2: '3030303030303030', 3: '0090009000900090', 4: '0000900000009000', 8: '2222222222222222', 11: '0000000000000100' }, bass: '7007007050070050', bs: ['pluck', 'sub', 'acid'], sc: ['minor', 'dorian'], chords: 1 },
    techno: { n: 'Techno', kit: 'techno', t: [128, 136], sw: [0, 0], rows: { 0: '9000900090009000', 2: '5595559555955595', 3: '0080008000800080', 4: '0000500000005000', 7: '6006006006006000', 8: '0010000000100010', 11: '1000000000000000' }, bass: '0070007000700070', bs: ['reese', 'acid'], sc: ['phrygian', 'minor'] },
    trap: { n: 'Trap', kit: 'trap', t: [136, 150], sw: [0, 0], rows: { 0: '9000005000600300', 1: '0000000090000000', 2: '9595959595959595', 3: '0000000000000030', 4: '0000000090000000', 7: '0000000000020000', 11: '0000000000000001' }, bass: '9000005000600300', bs: ['sub'], sc: ['minor', 'harmmin'], rat: 2 },
    boombap: { n: 'Boom bap', kit: 'boombap', t: [86, 96], sw: [20, 35], rows: { 0: '9000000500600000', 1: '0000900000009000', 2: '7070707070707072', 3: '0000000000000030', 8: '1000000000000000', 9: '0000000000000200' }, bass: '7000000500500000', bs: ['sub', 'pluck'], sc: ['minor', 'dorian', 'pentmin'] },
    jungle: { n: 'Drum & bass', kit: 'jungle', t: [168, 176], sw: [0, 0], rows: { 0: '9050000000950000', 1: '0000900303009003', 2: '5050505050505050', 8: '7070707070707070', 11: '9000000000900000' }, bass: '9000000000700000', bs: ['reese', 'sub'], sc: ['minor', 'phrygian'] },
    rock: { n: 'Rock', kit: 'rock', t: [100, 130], sw: [0, 0], rows: { 0: '9000000090500000', 1: '0000900000009000', 2: '9090909090909090', 4: '5000000000000000', 5: '0000000000000033', 6: '0000000000003300' }, bass: '9090909090909090', bs: ['square', 'pluck'], sc: ['major', 'pentmin'] },
    reggaeton: { n: 'Reggaeton', kit: '808', t: [90, 100], sw: [0, 0], rows: { 0: '9000900090009000', 1: '0009009000090090', 2: '5050505050505050', 4: '0003003000030030' }, bass: '9000900090009000', bs: ['sub'], sc: ['minor', 'harmmin'] },
    lofi: { n: 'Lo-fi', kit: 'lofi', t: [72, 86], sw: [25, 40], rows: { 0: '9000000505000000', 1: '0000900000009000', 2: '7070707070707073', 3: '3030303030303030', 7: '0050000000500000', 8: '3000000000000000', 9: '0000000000000300' }, bass: '7000000505000000', bs: ['pluck', 'sub'], sc: ['dorian', 'pentmaj', 'major'], chords: 1 },
    afro: { n: 'Afrobeats', kit: 'afro', t: [100, 110], sw: [5, 15], rows: { 0: '9007007000900700', 2: '7373737373737373', 4: '0000900000009000', 6: '0070070000700700', 8: '9090909909090909', 9: '7000007000700000' }, bass: '9000007000700000', bs: ['sub'], sc: ['major', 'pentmaj'], chords: 1 },
    latin: { n: 'Bossa nova', kit: 'latin', t: [90, 104], sw: [5, 15], rows: { 0: '9009900990099009', 1: '0050005000500050', 3: '9595959595959595', 4: '9009009000900900', 6: '0000000500000005' }, bass: '9000000090000000', bs: ['pluck', 'sub'], sc: ['major', 'dorian'], chords: 1 },
    synthwave: { n: 'Synthwave', kit: 'synthwave', t: [95, 115], sw: [0, 0], rows: { 0: '9000000090000000', 1: '0000900000009000', 2: '7070707070707070', 4: '0000900000009000', 9: '5555555555555555', 10: '9000000000000000' }, bass: '9090909090909090', bs: ['square', 'pluck'], sc: ['minor'], chords: 1 },
    dubstep: { n: 'Dubstep', kit: 'dubstep', t: [138, 142], sw: [0, 0], rows: { 0: '9000000000500000', 1: '0000000090000000', 2: '7070707070707070', 4: '0000000090000000', 8: '9000000000000000', 9: '0000005000000050' }, bass: '9000900050000050', bs: ['wobble'], sc: ['minor', 'phrygian'] },
    jazz: { n: 'Jazz swing', kit: 'jazz', t: [110, 160], sw: [55, 60], rows: { 0: '3000000000000000', 1: '0000003000000030', 2: '5000500050005000', 3: '0000900000009000', 4: '9009900990099009' }, bass: '9000900090009000', bs: ['pluck'], sc: ['major', 'dorian'], chords: 1, walk: 1 },
    chip: { n: 'Chiptune', kit: 'chip', t: [140, 160], sw: [0, 0], rows: { 0: '9000900090009000', 1: '0000900000009000', 2: '5555555555555555', 4: '0090009000900900', 7: '9000900090009000' }, bass: '9090909090909090', bs: ['square'], sc: ['major', 'minor'] },
    industrial: { n: 'Industrial', kit: 'industrial', t: [120, 135], sw: [0, 0], rows: { 0: '9000900090009000', 1: '0000900000009000', 2: '7070707070707070', 4: '0090000000909000', 5: '0000000500000005', 9: '9009009009009000' }, bass: '9000000090000000', bs: ['reese'], sc: ['phrygian'] }
  };
  Object.entries(GENRES).forEach(([id, g]) => { const o = document.createElement('option'); o.value = id; o.textContent = g.n; $('genre').append(o); });
  $('genre').value = GENRES[S.genre] ? S.genre : 'house';
  $('genre').addEventListener('change', () => { S.genre = $('genre').value; save(); });
  const PROG = [[0, 5, 3, 4], [0, 3, 4, 3], [0, 5, 1, 4], [5, 3, 0, 4], [0, 4, 5, 3], [0, 3, 0, 4], [1, 4, 0, 0]];
  const rr = (a, b) => Math.round(a + Math.random() * (b - a));
  function generate() {
    if (chal.active) return;
    pushUndo();
    const g = GENRES[$('genre').value] || GENRES.house, P = editPat();
    if (S.kit !== g.kit) setKit(g.kit, true);
    S.tempo = rr(g.t[0], g.t[1]); S.swing = rr(g.sw[0], g.sw[1]);
    for (let r = 0; r < ROWS; r++) {
      const tpl = g.rows[r]; P.len[r] = 16;
      for (let s = 0; s < STEPS; s++) {
        const lvl = tpl ? +tpl[s] : 0, on = lvl === 9 || Math.random() < lvl / 9 * 0.9;
        P.v[r][s] = on ? (lvl === 9 ? 3 : Math.random() < 0.25 ? 1 : 2) : 0; P.p[r][s] = 1;
        P.r[r][s] = on && g.rat && r === 2 && Math.random() < 0.18 ? (Math.random() < 0.5 ? 2 : 3) : 1;
      }
    }
    S.bass.synth = Curio.pick(g.bs); S.bass.scale = Curio.pick(g.sc); S.bass.root = rr(0, 11); S.bass.oct = S.bass.synth === 'sub' || S.bass.synth === 'reese' ? 1 : 2;
    const len = SCALES[S.bass.scale].s.length, pool = [0, 0, 0, 2, 3, 4, 4, 5, len];
    let walk = 0;
    for (let s = 0; s < STEPS; s++) {
      const lvl = +g.bass[s];
      if (lvl === 9 || Math.random() < lvl / 9) {
        if (g.walk) { walk = ((walk + Curio.pick([1, 1, 2, -1])) % len + len) % len; P.bn[s] = walk; }
        else P.bn[s] = s === 0 ? 0 : Math.min(BROWS - 1, Curio.pick(pool));
      } else P.bn[s] = -1;
    }
    P.ch = g.chords ? Curio.pick(PROG).slice() : [-1, -1, -1, -1];
    syncKnobs(); syncBassUI(); paintAll(); save();
    Curio.toast(`✨ Fresh ${g.n} beat in ${NOTE[S.bass.root]} ${SCALES[S.bass.scale].n.toLowerCase()}`, 1800);
    unlock('gen'); Curio.beep(660, 0.05, 'square', 0.06); setTimeout(() => Curio.beep(990, 0.06, 'square', 0.05), 70);
    if (!playing) start();
  }
  $('rand').addEventListener('click', generate);
  $('clear').addEventListener('click', () => { pushUndo(); const P = editPat(); P.v = grid0(0); P.p = grid0(1); P.r = grid0(1); P.len = new Array(ROWS).fill(16); if (!chal.active) { P.bn.fill(-1); P.ch = [-1, -1, -1, -1]; } paintAll(); save(); Curio.beep(200, 0.1, 'sine', 0.06); });
  $('reset').addEventListener('click', async () => {
    const v = await Curio.modal({ emoji: '⟲', title: 'Reset everything?', body: 'This brings back the starter rock beat and all default settings. You can still press Undo afterwards to get your beat back.', buttons: [{ label: 'Reset', value: 'y' }, { label: 'Cancel', value: 'n' }] });
    if (v !== 'y') return;
    if (chal.active) exitChal();
    pushUndo();
    loadPresetInto(S, D.presets[0]); S.pm = 'pattern'; S.fx = { ...DEF_FX }; S.mix = freshMix(); S.bass = { ...DEF_BASS }; S.tool = 'draw'; S.autoFill = false; S.sel = 0;
    if (G) applyAll(G);
    setKit(S.kit, true); setTool('draw'); setPM('pattern'); syncKnobs(); syncBassUI(); paintMS(); paintAll(); paintChain(); setSel(0); save();
    $('autoFill').setAttribute('aria-pressed', 'false');
    Curio.toast('Back to the starter beat. Undo brings yours back.', 2400); Curio.beep(440, 0.08, 'triangle', 0.07);
  });
  let clip = null;
  function copyPat() { if (chal.active) return; clip = clonePat(S.pats[S.cur]); Curio.toast(`Copied pattern ${LET[S.cur]}`, 1000); }
  function pastePat() { if (chal.active) return; if (!clip) { Curio.toast('Copy a pattern first'); return; } pushUndo(); S.pats[S.cur] = clonePat(clip); paintAll(); save(); Curio.toast(`Pasted into ${LET[S.cur]}`, 1000); }
  $('copy').addEventListener('click', copyPat); $('paste').addEventListener('click', pastePat);
  $('dup').addEventListener('click', () => {
    if (chal.active) return;
    const to = (S.cur + 1) % NPAT; pushUndo(); S.pats[to] = clonePat(S.pats[S.cur]); S.cur = to; paintAll(); save();
    Curio.toast(`Copied to ${LET[to]}. Now make a variation!`);
  });

  const b64e = (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const b64d = (s) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));
  const hx = (n) => n < 0 ? '.' : n.toString(16);
  function encode() {
    let last = 0; S.pats.forEach((p, i) => { if (!patEmpty(p)) last = i; });
    const P = S.pats.slice(0, last + 1).map((p) => {
      const o = { v: p.v.map((r) => r.join('')).join('') };
      if (p.p.some((r) => r.some((x) => x > 1))) o.p = p.p.map((r) => r.join('')).join('');
      if (p.r.some((r) => r.some((x) => x > 1))) o.r = p.r.map((r) => r.join('')).join('');
      if (p.len.some((x) => x !== 16)) o.l = p.len.map((x) => (x - 1).toString(16)).join('');
      if (p.bn.some((x) => x >= 0)) o.b = p.bn.map(hx).join('');
      if (p.ch.some((x) => x >= 0)) o.c = p.ch.map(hx).join('');
      return o;
    });
    return b64e(JSON.stringify({ k: S.kit, t: S.tempo, s: S.swing, m: S.pm, c: S.chain, B: S.bass, P }));
  }
  function decode(hash) {
    const h = hash.replace(/^#/, '');
    if (!h.startsWith('b=')) return false;
    try {
      const o = JSON.parse(b64d(h.slice(2)));
      const kitId = KITS[o.k] ? o.k : '808';
      const pats = Array.from({ length: NPAT }, (_, i) => {
        const q = o.P?.[i]; if (!q || typeof q.v !== 'string') return emptyPat();
        const nr = q.v.length / 16; if (nr !== 8 && nr !== 12) return emptyPat();
        const map = nr === 8 ? remapRow(kitId) : null, p = emptyPat();
        for (let r = 0; r < nr; r++) for (let s = 0; s < STEPS; s++) { const k = r * 16 + s, R = map ? map[r] : r; p.v[R][s] = clamp(+q.v[k] || 0, 0, 3); if (q.p) p.p[R][s] = clamp(+q.p[k] || 1, 1, 4); if (q.r) p.r[R][s] = clamp(+q.r[k] || 1, 1, 3); }
        if (q.l) [...q.l].slice(0, ROWS).forEach((c, r) => { p.len[r] = clamp((parseInt(c, 16) || 15) + 1, 1, 16); });
        if (q.b) [...q.b].slice(0, STEPS).forEach((c, s) => { p.bn[s] = c === '.' ? -1 : clamp(parseInt(c, 16), 0, BROWS - 1); });
        if (q.c) [...q.c].slice(0, 4).forEach((c, s) => { p.ch[s] = c === '.' ? -1 : clamp(parseInt(c, 16), 0, 6); });
        return p;
      });
      S.pats = pats; S.kit = kitId; S.tempo = clamp(+o.t || 110, 60, 200); S.swing = clamp(+o.s || 0, 0, 60);
      if (o.B && typeof o.B === 'object') { S.bass = { ...DEF_BASS, ...o.B }; if (!SCALES[S.bass.scale]) S.bass.scale = 'minor'; }
      S.chain = Array.isArray(o.c) ? o.c.filter((x) => x >= 0 && x < NPAT).slice(0, 32) : []; S.pm = o.m === 'song' ? 'song' : 'pattern'; S.cur = 0;
      return true;
    } catch { return false; }
  }
  $('share').addEventListener('click', async () => {
    const url = location.href.split('#')[0] + '#b=' + encode();
    history.replaceState(null, '', url);
    unlock('share');
    try { await navigator.clipboard.writeText(url); Curio.toast('Link copied. Send your beat to a friend 🎧'); } catch { Curio.toast('Copy the address bar to share your beat'); }
  });

  function wavBlob(buf) {
    const ch = buf.numberOfChannels, len = buf.length, sr = buf.sampleRate, data = new DataView(new ArrayBuffer(44 + len * ch * 2));
    const w = (o, s) => [...s].forEach((c, i) => data.setUint8(o + i, c.charCodeAt(0)));
    w(0, 'RIFF'); data.setUint32(4, 36 + len * ch * 2, true); w(8, 'WAVE'); w(12, 'fmt '); data.setUint32(16, 16, true); data.setUint16(20, 1, true); data.setUint16(22, ch, true);
    data.setUint32(24, sr, true); data.setUint32(28, sr * ch * 2, true); data.setUint16(32, ch * 2, true); data.setUint16(34, 16, true); w(36, 'data'); data.setUint32(40, len * ch * 2, true);
    const chans = Array.from({ length: ch }, (_, i) => buf.getChannelData(i));
    let o = 44; for (let i = 0; i < len; i++) for (let c = 0; c < ch; c++) { const v = clamp(chans[c][i], -1, 1); data.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true); o += 2; }
    return new Blob([data], { type: 'audio/wav' });
  }
  $('wav').addEventListener('click', async () => {
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext; if (!OAC) { Curio.toast('Your browser cannot render audio offline'); return; }
    const bars = S.pm === 'song' && S.chain.length ? S.chain.slice() : [S.cur, S.cur];
    const six = 60 / S.tempo / 4, dur = bars.length * STEPS * six + 2.5, sr = 44100;
    $('wav').disabled = true; $('wav').textContent = '⏳ Rendering…';
    try {
      const c = new OAC(2, Math.ceil(dur * sr), sr), g = makeGraph(c, false);
      let ab = 0;
      bars.forEach((pi, b) => { const P = S.pats[pi]; for (let s = 0; s < STEPS; s++, ab++) { const t = 0.05 + (b * STEPS + s) * six + (s % 2 ? six * (S.swing / 100) * 0.66 : 0);
        for (let r = 0; r < ROWS; r++) { const rs = ab % (P.len[r] || 16), v = P.v[r][rs]; if (!v || !audible(r) || Math.random() > PROBS[P.p[r][rs] || 1]) continue; const n = P.r[r][rs] || 1; for (let k = 0; k < n; k++) trig(g, r, t + k * six / n, VELS[v] * (k ? 0.8 : 1)); }
        const bn = P.bn[s]; if (bn >= 0) { let d = 1; while (d < 4 && s + d < STEPS && P.bn[s + d] < 0) d++; playBass(g, t, bassMidi(bn), six * Math.min(d, 2) * 0.95, s % 4 === 0 ? 1 : 0.8); }
        if (s % 4 === 0 && P.ch[s / 4] >= 0) playChord(g, t, P.ch[s / 4], six * 4); } });
      const buf = await c.startRendering();
      const a = document.createElement('a'); a.href = URL.createObjectURL(wavBlob(buf)); a.download = `curio-beat-${S.tempo}bpm.wav`; document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      unlock('wav'); Curio.toast(`Exported ${bars.length} bar${bars.length > 1 ? 's' : ''} as WAV 💾`);
    } catch { Curio.toast('Export failed, sorry'); }
    $('wav').disabled = false; $('wav').textContent = '⬇ WAV';
  });

  let liveRec = false; const lpEls = [];
  for (let i = 0; i < 8; i++) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'dm-lpad'; b.style.setProperty('--c', D.colors[i]);
    b.innerHTML = '<span></span><small></small>'; b.querySelector('small').textContent = String(i + 1);
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); livePad(i); });
    b.addEventListener('keydown', (e) => { if (e.key === 'Enter') livePad(i); });
    $('livepads').append(b); lpEls.push(b);
  }
  function paintLivePads() { lpEls.forEach((b, i) => { b.querySelector('span').textContent = kit().v[i][0]; }); }
  let liveUndo = false;
  function livePad(i) {
    hitNow(i, 0.85); flashName(i); vib(8);
    const b = lpEls[i]; b.classList.add('hit'); setTimeout(() => b.classList.remove('hit'), 110);
    if (liveRec && playing && !chal.active) {
      const c = G.c, six = 60 / S.tempo / 4, d = Math.round((c.currentTime - lastStepT) / six), s = ((lastStep + d) % STEPS + STEPS) % STEPS;
      const P = S.pats[S.cur]; if (!P.v[i][s]) { if (!liveUndo) { pushUndo(); liveUndo = true; } P.v[i][s] = 2; paintCell(i, s); paintPats(); save(); unlock('live'); }
    }
  }
  $('liveRec').addEventListener('click', () => { liveRec = !liveRec; liveUndo = false; $('liveRec').setAttribute('aria-pressed', String(liveRec)); if (liveRec && !playing) start(); Curio.toast(liveRec ? 'Recording: hit the pads in time' : 'Recording off'); });

  const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  function hashStr(s) { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function dailyLevel() {
    let seed = hashStr('beat' + todayKey());
    const r = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const pick = (a) => a[Math.floor(r() * a.length)];
    const K1 = ['x...x...x...x...', 'x.......x.x.....', 'x.....x...x.....', 'x..x....x.x.....', 'x......x..x.....', 'x.x.......x.....'];
    const S1 = ['....x.......x...', '....x.......x..x', '....x..x.....x..', '...x..x....x..x.'];
    const H1 = ['x.x.x.x.x.x.x.x.', '..x...x...x...x.', 'xxxxxxxxxxxxxxxx', 'x.xxx.xxx.xxx.xx', ''];
    const rowsP = [pick(K1), pick(S1), pick(H1)];
    if (r() < 0.5) rowsP[4] = pick(['........x.......', '....x.......x...']);
    if (r() < 0.35) rowsP[7] = pick(['x.x..x.x..x.x...', 'x...x...x...x...']);
    return { n: 'Daily beat', tip: `Today's mystery groove (${todayKey()}).`, p: rowsP, daily: true };
  }
  function startChal(i) {
    if (playing) stop();
    const L = i === 'daily' ? dailyLevel() : D.levels[i];
    const target = patFromStrings(L.p, '808');
    chal = { active: true, lvl: i, L, target, mine: emptyPat(), used: target.v.map((r, k) => r.some(Boolean) ? k : -1).filter((k) => k >= 0), checks: 0, listens: 0, src: null, saveTempo: S.tempo, saveSwing: S.swing, saveKit: S.kit };
    S.tempo = 100; S.swing = 0; setKit('808', true); syncKnobs();
    rows.forEach((row, r) => row.classList.toggle('dim', !chal.used.includes(r)));
    setTool('draw'); paintAll(); paintChal();
    $('dm').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function exitChal() {
    if (!chal.active) return;
    if (playing) stop();
    S.tempo = chal.saveTempo; S.swing = chal.saveSwing; const k = chal.saveKit; chal = { active: false }; setKit(k, true);
    rows.forEach((row) => row.classList.remove('dim'));
    syncKnobs(); paintAll(); paintChal();
  }
  function listen(src) {
    if (!chal.active) return;
    if (playing && chal.src === src) { stop(); return; }
    if (playing) stop();
    chal.src = src; if (src === 'target') chal.listens++;
    start(); paintChalBtns();
  }
  function check() {
    if (!chal.active) return;
    chal.checks++;
    let wrong = 0;
    for (let r = 0; r < ROWS; r++) for (let s = 0; s < STEPS; s++) {
      const want = chal.target.v[r][s] > 0, got = chal.mine.v[r][s] > 0, c = cells[r][s];
      c.classList.remove('good', 'bad', 'missing');
      if (want && got) c.classList.add('good'); else if (got) { c.classList.add('bad'); wrong++; } else if (want) { if (chal.checks >= 3) c.classList.add('missing'); wrong++; }
    }
    setTimeout(() => cells.flat().forEach((c) => c.classList.remove('good', 'bad', 'missing')), 1800);
    if (!wrong) solved();
    else {
      $('chalMsg').textContent = `${wrong} step${wrong > 1 ? 's' : ''} off. ${chal.checks >= 3 ? 'Yellow outlines show the missing hits.' : 'Red ones are extra. Listen again!'}`;
      $('dm').animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(0)' }], { duration: 300 });
      Curio.beep(180, 0.2, 'sawtooth', 0.06); vib(30);
    }
  }
  async function solved() {
    if (playing) stop();
    const stars = chal.checks <= 1 ? 3 : chal.checks <= 3 ? 2 : 1;
    if (chal.lvl === 'daily') { S.daily[todayKey()] = Math.max(S.daily[todayKey()] || 0, stars); unlock('daily'); }
    else S.chal[chal.lvl] = Math.max(S.chal[chal.lvl] || 0, stars);
    const solvedN = D.levels.filter((_, i) => S.chal[i]).length;
    if (solvedN >= 3) unlock('chal3'); if (solvedN >= D.levels.length) unlock('chalall');
    save(); Curio.confetti(); [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.15, 'triangle', 0.09), i * 90));
    const isLast = chal.lvl === 'daily' || chal.lvl >= D.levels.length - 1;
    const v = await Curio.modal({ emoji: '🕵️', title: `${'⭐'.repeat(stars)} Cracked it!`, body: `"${chal.L.n}" solved with ${chal.checks} check${chal.checks > 1 ? 's' : ''} and ${chal.listens} listen${chal.listens === 1 ? '' : 's'}.`, buttons: isLast ? [{ label: 'Back to my beats', value: 'exit' }, { label: '📋 Share', value: 'share' }] : [{ label: 'Next level', value: 'next' }, { label: 'Back to my beats', value: 'exit' }, { label: '📋 Share', value: 'share' }] });
    if (v === 'next') { const nx = chal.lvl + 1; exitChal(); startChal(nx); }
    else {
      if (v === 'share') { const txt = `🥁 I cracked "${chal.L.n}" on Curio Beat Maker with ${'⭐'.repeat(stars)} (${chal.checks} checks).`; try { await navigator.clipboard.writeText(txt); Curio.toast('Copied!'); } catch { Curio.toast(txt, 4000); } }
      exitChal();
    }
  }
  function paintChalBtns() {
    if (!chal.active || !$('hearT')) return;
    $('hearT').textContent = playing && chal.src === 'target' ? '■ Stop' : '🎧 Hear target';
    $('hearM').textContent = playing && chal.src === 'mine' ? '■ Stop' : '▶ Hear mine';
  }
  function paintChal() {
    const box = $('chal'); box.innerHTML = '';
    if (chal.active) {
      const L = chal.L;
      box.innerHTML = `<div class="dm-chalhead"><div><h3></h3><p></p></div></div><div class="dm-chalbtns"><button class="c-btn" id="hearT" type="button"></button><button class="c-btn c-btn--ghost" id="hearM" type="button"></button><button class="c-btn" id="checkB" type="button">✓ Check</button><button class="c-btn c-btn--ghost" id="exitB" type="button">Exit</button></div><div class="dm-chalmsg" id="chalMsg" aria-live="polite"></div>`;
      box.querySelector('h3').textContent = `🕵️ ${L.n}`; box.querySelector('p').textContent = `${L.tip} Only the lit rows are used. Rebuild the beat in the grid above, then check.`;
      $('hearT').addEventListener('click', () => listen('target')); $('hearM').addEventListener('click', () => listen('mine'));
      $('checkB').addEventListener('click', check); $('exitB').addEventListener('click', exitChal);
      paintChalBtns();
      return;
    }
    const head = document.createElement('div'); head.className = 'dm-chalhead';
    head.innerHTML = '<div><h3>Beat Detective</h3><p>Listen to a mystery beat, then rebuild it step by step. Fewer checks, more stars.</p></div>';
    box.append(head);
    const lv = document.createElement('div'); lv.className = 'dm-levels';
    const dd = document.createElement('button'); dd.type = 'button'; dd.className = 'dm-level'; const ds = S.daily[todayKey()] || 0;
    dd.innerHTML = '📅 Daily beat<small></small>'; dd.querySelector('small').textContent = ds ? '★'.repeat(ds) : 'new today'; dd.addEventListener('click', () => startChal('daily')); lv.append(dd);
    D.levels.forEach((L, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'dm-level'; const st = S.chal[i] || 0;
      b.innerHTML = '<span></span><small></small>'; b.querySelector('span').textContent = `${i + 1}. ${L.n}`; b.querySelector('small').textContent = st ? '★'.repeat(st) + '☆'.repeat(3 - st) : i === 0 || S.chal[i - 1] ? '☆☆☆' : '🔒';
      b.disabled = !(i === 0 || S.chal[i - 1]);
      b.addEventListener('click', () => startChal(i)); lv.append(b);
    });
    box.append(lv);
  }

  const ACH = D.ach.concat([
    { id: 'bass', i: '🎹', n: 'Low end theory', d: 'Write a bass line' },
    { id: 'chords', i: '🎼', n: 'Harmony', d: 'Add a chord' },
    { id: 'gen', i: '✨', n: 'Beat generator', d: 'Generate a beat' },
    { id: 'fill', i: '🥁', n: 'Drum fill', d: 'Trigger a fill' }
  ]).map((a) => a.id === 'kits' ? { ...a, d: 'Play 10 different kits' } : a);
  function paintAch() {
    const box = $('ach'); box.innerHTML = ''; let got = 0;
    ACH.forEach((a) => { const d = document.createElement('div'); d.className = 'dm-badge' + (S.ach[a.id] ? ' got' : ''); if (S.ach[a.id]) got++; d.innerHTML = '<i></i><div><b></b><span></span></div>'; d.querySelector('i').textContent = a.i; d.querySelector('b').textContent = a.n; d.querySelector('span').textContent = a.d; box.append(d); });
    $('achCount').textContent = `${got}/${ACH.length}`;
    const st = $('stats'); st.innerHTML = '';
    [[S.stats.plays, 'Plays'], [Curio.fmt(S.stats.steps), 'Steps placed'], [`${Object.keys(S.kitsUsed).length}/${D.kits.length}`, 'Kits played'], [Object.keys(S.tried).length, 'Presets tried'], [D.levels.filter((_, i) => S.chal[i]).length + '/' + D.levels.length, 'Levels solved']].forEach(([b, s]) => { const d = document.createElement('div'); d.className = 'c-stat'; d.innerHTML = '<b></b><span></span>'; d.querySelector('b').textContent = b; d.querySelector('span').textContent = s; st.append(d); });
  }
  const unlockQ = []; let unlockBusy = false;
  function unlock(id) { if (S.ach[id]) return; const a = ACH.find((x) => x.id === id); if (!a) return; S.ach[id] = Date.now(); save(); paintAch(); unlockQ.push(a); if (!unlockBusy) nextUnlock(); }
  function nextUnlock() {
    const a = unlockQ.shift(); if (!a) { unlockBusy = false; return; }
    unlockBusy = true;
    const el = document.createElement('div'); el.className = 'dm-unlock'; el.setAttribute('role', 'status'); el.innerHTML = '<i></i><div><span></span><small></small></div>';
    el.querySelector('i').textContent = a.i; el.querySelector('span').textContent = a.n; el.querySelector('small').textContent = a.d;
    document.body.append(el); setTimeout(() => { el.remove(); nextUnlock(); }, 3100);
    [880, 1175].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.1, 'triangle', 0.05), i * 90));
  }

  let tab = 'song';
  document.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => {
    tab = b.dataset.tab;
    document.querySelectorAll('[data-tab]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    document.querySelectorAll('[data-panel]').forEach((p) => { p.hidden = p.dataset.panel !== b.dataset.tab; });
    if (b.dataset.tab === 'challenge') paintChal();
  }));

  const scope = $('scope'), sg = scope.getContext('2d');
  let fbuf = null, tbuf = null;
  function drawScope(now) {
    const w = scope.clientWidth, h = scope.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
    if (scope.width !== Math.round(w * dpr)) { scope.width = Math.round(w * dpr); scope.height = Math.round(h * dpr); }
    sg.setTransform(dpr, 0, 0, dpr, 0, 0); sg.clearRect(0, 0, w, h);
    sg.fillStyle = 'rgba(125,255,155,.06)'; for (let y = 2; y < h; y += 3) sg.fillRect(0, y, w, 1);
    const col = kit().accent;
    if (G?.an && playing) {
      if (!fbuf) fbuf = new Uint8Array(G.an.frequencyBinCount);
      G.an.getByteFrequencyData(fbuf);
      const n = 48, bw = w / n;
      for (let i = 0; i < n; i++) { const v = fbuf[Math.floor(i * fbuf.length / n * 0.8)] / 255, bh = v * h * 0.9; sg.fillStyle = col; sg.globalAlpha = 0.18 + v * 0.35; sg.fillRect(i * bw + 1, h - bh, bw - 2, bh); }
      sg.globalAlpha = 1;
    } else {
      sg.strokeStyle = col; sg.globalAlpha = 0.35; sg.beginPath();
      for (let x = 0; x <= w; x += 3) { const y = h / 2 + Math.sin(x / 18 + now / 400) * 3 * Math.sin(now / 1300); if (x) sg.lineTo(x, y); else sg.moveTo(x, y); }
      sg.stroke(); sg.globalAlpha = 1;
    }
  }
  const rms = (an) => { if (!tbuf) tbuf = new Float32Array(512); an.getFloatTimeDomainData(tbuf); let s = 0; for (let i = 0; i < tbuf.length; i++) s += tbuf[i] * tbuf[i]; return Math.sqrt(s / tbuf.length); };
  let lastFrame = performance.now();
  function frame(now) {
    const dt = Math.min(0.1, (now - lastFrame) / 1000); lastFrame = now;
    if (!document.hidden) {
      if (playing) drawQueue();
      drawScope(now);
      for (let r = 0; r < ROWS; r++) { if (vlvl[r] > 0.01) { vuEls[r].style.width = `${vlvl[r] * 100}%`; vlvl[r] *= Math.pow(0.02, dt); } else if (vlvl[r]) { vlvl[r] = 0; vuEls[r].style.width = '0'; } }
      if (G?.anL) { $('vuL').style.height = `${Math.min(100, rms(G.anL) * 260)}%`; $('vuR').style.height = `${Math.min(100, rms(G.anR) * 260)}%`; }
    }
    requestAnimationFrame(frame);
  }

  let booted = false;
  function powerOn() {
    if (booted) return; booted = true;
    audio();
    $('dm').classList.add('booting'); $('boot').classList.add('out');
    [262, 330, 392, 523, 659].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.09, 'square', 0.05), i * 70));
    setTimeout(() => { $('dm').classList.remove('booting'); $('boot').hidden = true; }, 1100);
    vib(20);
  }
  $('power').addEventListener('click', powerOn);
  $('boot').addEventListener('click', powerOn);
  document.addEventListener('pointerdown', () => powerOn(), { once: true, capture: true });

  const STEPKEYS = ['1', '2', '3', '4', '5', '6', '7', '8', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i'];
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && playing) stop();
    if (e.target.matches('input, textarea, select')) return;
    if (document.querySelector('.curio-modal')) return;
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
    if ((e.ctrlKey || e.metaKey) && k === 'y') { e.preventDefault(); redo(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape') return;
    if (e.key === ' ' && !e.target.matches('button, [role="slider"]')) { e.preventDefault(); if (!booted) powerOn(); playing ? stop() : start(); return; }
    if (!booted || e.repeat) return;
    if (e.target.matches('[role="slider"]')) return;
    if (e.shiftKey && /^Digit[1-8]$/.test(e.code) && S.adv) { selectPat(+e.code.slice(5) - 1); return; }
    if (tab === 'pads' && /^[1-8]$/.test(k)) { livePad(+k - 1); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSel(Math.min(S.adv ? 11 : 7, S.sel - 1)); hitNow(S.sel, 0.6); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel(Math.min(S.adv ? 11 : 7, S.sel + 1)); hitNow(S.sel, 0.6); return; }
    const si = STEPKEYS.indexOf(k); if (si >= 0 && !e.shiftKey) { toggleStep(si); return; }
    if (k === 'g') generate();
    else if (!S.adv) return;
    else if (k === 'f') armFill();
    else if (k === 'c') copyPat();
    else if (k === 'v') pastePat();
  });

  function setAdv(v) {
    S.adv = v; $('wrap').classList.toggle('simple', !v);
    $('advBtn').setAttribute('aria-pressed', String(v)); $('advBtn').textContent = `⚙️ Advanced mode: ${v ? 'On' : 'Off'}`;
    if (!v) { if (chal.active) exitChal(); if (liveRec) $('liveRec').click(); if (S.sel > 7) setSel(0); if (S.cur !== 0) { S.cur = 0; } }
    paintAll(); save();
  }
  $('advBtn').addEventListener('click', () => { setAdv(!S.adv); Curio.toast(S.adv ? 'Advanced mode: patterns, bass line, effects, mixer, song mode and more' : 'Simple mode: just the drums', 2200); });
  function showHelp(on) { $('howto').hidden = !on; $('helpBtn').setAttribute('aria-expanded', String(on)); }
  $('helpBtn').addEventListener('click', () => showHelp($('howto').hidden));
  $('howtoOk').addEventListener('click', () => { showHelp(false); S.seenHelp = true; save(); });
  if (location.hash && decode(location.hash)) Curio.toast('Shared beat loaded. Power on and press play!', 2600);
  setAdv(!!S.adv); showHelp(!S.seenHelp);
  setKit(S.kit, true); setTool(S.tool); setPM(S.pm); syncKnobs(); syncBassUI(); paintMS(); paintAll(); paintChain(); paintUndo(); paintAch(); paintChal(); setSel(S.sel);
  $('autoFill').setAttribute('aria-pressed', String(!!S.autoFill));
  addEventListener('curio:touchpad', (e) => { if (e.detail) Curio.toast('Touchpad mode: click a step and move to paint a row, click again to stop. Knobs work the same, or scroll with two fingers', 4000); });
  if (!Curio.touchpad && !Curio.store.get('tp-hint-drum-machine', false)) { Curio.store.set('tp-hint-drum-machine', true); setTimeout(() => Curio.toast('Tip: on a laptop touchpad, turn on Touchpad mode in the top bar', 3600), 1800); }
  requestAnimationFrame(frame);
})();
