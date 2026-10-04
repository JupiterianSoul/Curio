(() => {
  const WTP = window.WTP;
  const C = WTP.C;
  let ac = null, master = null, sfxBus = null, musBus = null, musFilter = null, noiseBuf = null, pulse25 = null, pulse12 = null, comp = null;
  const loops = {};
  const last = {};
  const muted = () => !!C.muted;
  function ctx() {
    if (muted()) return null;
    const a = C.audioContext && C.audioContext();
    if (!a) return null;
    if (a !== ac) {
      ac = a;
      comp = a.createDynamicsCompressor();
      comp.threshold.value = -16; comp.ratio.value = 5; comp.attack.value = 0.003; comp.release.value = 0.2;
      master = a.createGain(); master.gain.value = 0.9;
      sfxBus = a.createGain(); sfxBus.gain.value = WTP.save.settings.sfx;
      musBus = a.createGain(); musBus.gain.value = WTP.save.settings.music * 0.5;
      musFilter = a.createBiquadFilter(); musFilter.type = 'lowpass'; musFilter.frequency.value = 18000; musFilter.Q.value = 0.7;
      musBus.connect(musFilter).connect(master);
      sfxBus.connect(comp).connect(master);
      master.connect(a.destination);
      noiseBuf = a.createBuffer(1, a.sampleRate * 2, a.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const mkPulse = (duty) => {
        const n = 40, re = new Float32Array(n), im = new Float32Array(n);
        for (let k = 1; k < n; k++) im[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
        return a.createPeriodicWave(re, im);
      };
      pulse25 = mkPulse(0.25); pulse12 = mkPulse(0.125);
    }
    return ac;
  }
  function setVolumes() {
    if (!ac) return;
    const t = ac.currentTime;
    sfxBus.gain.setTargetAtTime(WTP.save.settings.sfx, t, 0.05);
    musBus.gain.setTargetAtTime(WTP.save.settings.music * 0.5, t, 0.05);
  }
  function osc(type, f0, f1, dur, vol, o = {}) {
    const a = ctx(); if (!a) return;
    const t = a.currentTime + (o.delay || 0);
    const s = a.createOscillator();
    if (type === 'p25') s.setPeriodicWave(pulse25); else if (type === 'p12') s.setPeriodicWave(pulse12); else s.type = type;
    s.frequency.setValueAtTime(Math.max(20, f0), t);
    if (f1 !== f0) s.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + (o.attack || 0.004));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = s;
    if (o.lp) { const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; node.connect(f); node = f; }
    node.connect(g).connect(o.bus || sfxBus);
    s.start(t); s.stop(t + dur + 0.05);
  }
  function noise(dur, f0, f1, vol, type = 'lowpass', q = 0.8, o = {}) {
    const a = ctx(); if (!a) return;
    const t = a.currentTime + (o.delay || 0);
    const s = a.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const fl = a.createBiquadFilter(); fl.type = type; fl.Q.value = q;
    fl.frequency.setValueAtTime(Math.max(30, f0), t); fl.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + (o.attack || 0.003));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl).connect(g).connect(o.bus || sfxBus);
    s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
  }
  const throttle = (k, ms) => { const now = performance.now(); if (last[k] && now - last[k] < ms) return false; last[k] = now; return true; };
  const vary = (f) => f * (0.94 + Math.random() * 0.12);

  const SFX = {
    pistol() { noise(0.09, 3200, 400, 0.45); osc('square', vary(300), 90, 0.07, 0.07); },
    revolver() { noise(0.22, 2600, 120, 0.7); osc('sine', 140, 40, 0.25, 0.4); osc('square', vary(220), 70, 0.08, 0.06); },
    dual() { noise(0.07, 3800, 500, 0.35); osc('square', vary(360), 120, 0.05, 0.05); },
    smg() { if (!throttle('smg', 40)) return; noise(0.05, 4200, 700, 0.28); osc('square', vary(280), 120, 0.035, 0.035); },
    rifle() { if (!throttle('rifle', 50)) return; noise(0.08, 3400, 300, 0.4); osc('sine', vary(160), 60, 0.08, 0.2); },
    minigun() { if (!throttle('mini', 32)) return; noise(0.04, 5200, 900, 0.22); osc('square', vary(200), 110, 0.03, 0.03); },
    shotgun() { noise(0.32, 2600, 100, 0.85); osc('sine', 110, 38, 0.24, 0.45); setTimeout(() => SFX.rack(), 260); },
    rack() { noise(0.04, 2500, 1800, 0.12, 'bandpass', 3); noise(0.05, 1800, 1200, 0.12, 'bandpass', 3, { delay: 0.08 }); },
    double() { noise(0.4, 2200, 80, 0.95); osc('sine', 90, 30, 0.35, 0.55); },
    flak() { noise(0.25, 1600, 90, 0.7); osc('triangle', 220, 60, 0.2, 0.2); },
    sniper() { noise(0.5, 6000, 150, 0.7, 'lowpass', 0.6); osc('sine', 120, 35, 0.5, 0.5); osc('square', 1800, 200, 0.06, 0.05); },
    rail() { osc('sawtooth', 2200, 60, 0.45, 0.1); noise(0.5, 7000, 200, 0.55, 'highpass', 0.5); osc('sine', 80, 25, 0.6, 0.6); },
    charge() { osc('sawtooth', 200, 1600, 0.4, 0.05, { lp: 3000 }); },
    plasma() { osc('p25', vary(900), 180, 0.22, 0.09); osc('sine', 400, 80, 0.2, 0.15); },
    tesla() { if (!throttle('tesla', 70)) return; noise(0.12, 5000, 2000, 0.3, 'bandpass', 2); osc('sawtooth', vary(120), 90, 0.1, 0.07); },
    sound() { osc('sine', 90, 40, 0.5, 0.7); osc('square', 180, 50, 0.4, 0.08, { lp: 900 }); noise(0.4, 600, 80, 0.4); },
    paint() { if (!throttle('paint', 60)) return; noise(0.08, 1200, 3000, 0.18, 'bandpass', 1.5); osc('sine', vary(500), 300, 0.06, 0.05); },
    rocket() { noise(0.5, 300, 2600, 0.38, 'bandpass', 1.4); osc('sawtooth', 90, 60, 0.3, 0.05, { lp: 600 }); },
    launch() { noise(0.18, 800, 3000, 0.25, 'bandpass', 2); osc('square', 300, 700, 0.1, 0.05); },
    throw() { noise(0.12, 900, 2500, 0.16, 'bandpass', 1.5); osc('triangle', vary(400), 250, 0.08, 0.06); },
    beep() { osc('square', 1500, 1500, 0.05, 0.05); },
    nukeLaunch() { osc('sawtooth', 60, 220, 1.1, 0.12, { lp: 900 }); noise(1, 200, 1200, 0.3); },
    slash() { noise(0.12, 6000, 1500, 0.35, 'highpass', 0.7); osc('sine', vary(1400), 600, 0.08, 0.05); },
    hammer() { osc('sine', 130, 40, 0.25, 0.6); noise(0.2, 900, 90, 0.55); },
    swoosh() { noise(0.16, 500, 2500, 0.18, 'bandpass', 1.2); },
    portal() { osc('sine', 300, 1200, 0.25, 0.1); osc('p12', 600, 2400, 0.2, 0.04); },
    portalOut() { osc('sine', 1200, 300, 0.25, 0.1); },
    grab() { osc('sine', 120, 400, 0.2, 0.2); noise(0.15, 300, 1500, 0.15, 'bandpass', 2); },
    fling() { noise(0.2, 400, 3000, 0.35, 'bandpass', 1); osc('sine', 300, 60, 0.25, 0.3); },
    ball() { if (!throttle('ball', 35)) return; osc('sine', vary(600), 300, 0.08, 0.12); osc('square', vary(900), 600, 0.03, 0.03); },
    boomerang() { if (!throttle('boom', 120)) return; noise(0.15, 1200, 600, 0.1, 'bandpass', 4); },
    nail() { if (!throttle('nail', 40)) return; osc('square', vary(1200), 400, 0.03, 0.05); noise(0.03, 5000, 2000, 0.15, 'highpass'); },
    harpoon() { noise(0.15, 3000, 600, 0.35); osc('sawtooth', 300, 100, 0.15, 0.06); },
    lava() { if (!throttle('lava', 80)) return; noise(0.2, 400, 150, 0.25); osc('sine', vary(90), 60, 0.2, 0.2); },
    firework() { noise(0.6, 800, 4000, 0.18, 'bandpass', 2); osc('sine', 500, 1500, 0.5, 0.05); },
    sparkle() { for (let i = 0; i < 5; i++) osc('square', 1500 + Math.random() * 2000, 1200, 0.05, 0.03, { delay: i * 0.05 + Math.random() * 0.03 }); noise(0.3, 6000, 3000, 0.25, 'highpass', 0.5); },
    confetti() { noise(0.15, 2000, 6000, 0.3, 'highpass'); osc('square', 700, 900, 0.12, 0.05); osc('square', 900, 1200, 0.12, 0.05, { delay: 0.06 }); },
    flare() { noise(0.3, 800, 3000, 0.2, 'bandpass', 2); },
    water() { if (!throttle('water', 60)) return; noise(0.1, 1500, 700, 0.2, 'bandpass', 1); },
    snow() { noise(0.1, 2500, 1200, 0.14, 'bandpass', 2); },
    glitch() { if (!throttle('glitch', 50)) return; for (let i = 0; i < 3; i++) osc('square', 200 + Math.random() * 2000, 100 + Math.random() * 3000, 0.04, 0.04, { delay: i * 0.03 }); },
    banana() { osc('triangle', 300, 600, 0.12, 0.1); },
    impact() { if (!throttle('impact', 35)) return; noise(0.05, 2000, 500, 0.16, 'bandpass', 1.2); },
    tink() { if (!throttle('tink', 45)) return; osc('square', vary(3200), 2800, 0.03, 0.02); osc('sine', vary(4800), 4000, 0.05, 0.02); },
    boom(r = 20) {
      if (!throttle('boom' + Math.round(r / 10), 40)) return;
      const big = Math.min(1, r / 60);
      noise(0.45 + r * 0.025, 1500, 50, 0.7 + big * 0.3);
      osc('sine', 100 - big * 40, 25, 0.45 + big * 0.6, 0.6 + big * 0.4);
      if (r > 30) noise(1.4 * big + 0.4, 300, 40, 0.5, 'lowpass', 0.5, { delay: 0.05 });
    },
    nuke() { noise(3.2, 2400, 30, 1); osc('sine', 70, 18, 3, 1); osc('sawtooth', 50, 25, 2.5, 0.12, { lp: 300 }); },
    crash(n = 50) { if (!throttle('crash', 70)) return; noise(0.2 + Math.min(0.35, n / 600), 1100, 110, Math.min(0.55, 0.14 + n / 500)); osc('sine', 90, 40, 0.15, Math.min(0.3, n / 800)); },
    glass() { if (!throttle('glass', 60)) return; for (let i = 0; i < 6; i++) osc('triangle', 2400 + Math.random() * 3200, 1800 + Math.random() * 2000, 0.12 + Math.random() * 0.15, 0.035, { delay: Math.random() * 0.12 }); noise(0.25, 8000, 3000, 0.35, 'highpass', 0.5); },
    ice() { if (!throttle('ice', 60)) return; for (let i = 0; i < 4; i++) osc('sine', 3000 + Math.random() * 3000, 2500, 0.1, 0.04, { delay: Math.random() * 0.08 }); noise(0.18, 9000, 4000, 0.25, 'highpass'); },
    freezeHit() { if (!throttle('fz', 90)) return; osc('sine', vary(1800), 2600, 0.12, 0.03); },
    sizzle() { if (!throttle('sizzle', 120)) return; noise(0.3, 5000, 3000, 0.08, 'highpass'); },
    letters() { if (!throttle('letters', 90)) return; for (let i = 0; i < 3; i++) osc('square', 600 + i * 220 + Math.random() * 80, 300, 0.05, 0.025, { delay: i * 0.03 }); },
    whistle() { osc('sine', 1600, 500, 0.7, 0.05); },
    siren() { osc('sawtooth', 500, 900, 0.45, 0.05, { lp: 2000 }); osc('sawtooth', 500, 900, 0.45, 0.05, { lp: 2000, delay: 0.5 }); },
    hole() { osc('sine', 60, 25, 2.4, 0.5); noise(2.2, 220, 50, 0.3); },
    orbital() { osc('sawtooth', 80, 1600, 1.2, 0.08, { lp: 4000 }); },
    beam() { noise(1.6, 400, 4000, 0.6, 'bandpass', 0.6); osc('sine', 55, 30, 1.8, 0.7); },
    quake() { noise(2.6, 120, 40, 0.8, 'lowpass', 0.5); osc('sine', 40, 25, 2.5, 0.8); },
    meteor() { noise(0.8, 3000, 300, 0.2, 'bandpass', 1); },
    buzz() { if (!throttle('buzz', 300)) return; osc('sawtooth', vary(220), 240, 0.25, 0.03, { lp: 1200 }); },
    jump() { osc('p25', 330, 640, 0.09, 0.06); },
    djump() { osc('p25', 480, 980, 0.1, 0.06); noise(0.08, 1500, 4000, 0.06, 'bandpass', 2); },
    walljump() { osc('p25', 420, 820, 0.08, 0.06); noise(0.05, 800, 400, 0.1); },
    dash() { noise(0.18, 600, 5000, 0.3, 'bandpass', 1.2); osc('sine', 200, 500, 0.1, 0.08); },
    land() { if (!throttle('land', 120)) return; noise(0.06, 600, 150, 0.2); },
    step() { if (!throttle('step', 140)) return; noise(0.025, 900, 400, 0.05, 'bandpass', 2); },
    hurt() { osc('square', 400, 90, 0.25, 0.12); noise(0.2, 1500, 300, 0.3); },
    die() { osc('square', 600, 60, 0.9, 0.12); osc('square', 400, 40, 0.9, 0.08, { delay: 0.15 }); },
    pickup() { osc('p25', 880, 880, 0.06, 0.06); osc('p25', 1320, 1320, 0.1, 0.06, { delay: 0.06 }); },
    coin() { osc('p25', 1046, 1046, 0.05, 0.05); osc('p25', 1568, 1568, 0.12, 0.05, { delay: 0.05 }); },
    heal() { [523, 659, 784].forEach((f, i) => osc('triangle', f, f, 0.12, 0.08, { delay: i * 0.06 })); },
    select() { osc('p25', 660, 660, 0.04, 0.05); osc('p25', 990, 990, 0.06, 0.05, { delay: 0.04 }); },
    hover() { if (!throttle('hover', 50)) return; osc('p12', 1200, 1200, 0.025, 0.025); },
    back() { osc('p25', 660, 440, 0.08, 0.05); },
    deny() { osc('square', 180, 120, 0.15, 0.06); },
    unlock() { [660, 880, 990, 1320].forEach((f, i) => osc('p25', f, f, 0.16, 0.07, { delay: i * 0.08 })); },
    buy() { [523, 784, 1046, 1568].forEach((f, i) => osc('p25', f, f, 0.1, 0.06, { delay: i * 0.05 })); noise(0.2, 3000, 6000, 0.1, 'highpass', 1, { delay: 0.2 }); },
    achievement() { [784, 988, 1175, 1568].forEach((f, i) => osc('p25', f, f, 0.18, 0.06, { delay: i * 0.09 })); osc('triangle', 392, 392, 0.5, 0.1, { delay: 0.27 }); },
    combo(tier = 1) { const b = 440 * Math.pow(2, Math.min(tier, 12) / 12); osc('p25', b, b, 0.07, 0.06); osc('p25', b * 1.5, b * 1.5, 0.1, 0.06, { delay: 0.06 }); },
    announce(tier = 1) { const b = 220 * Math.pow(2, Math.min(tier, 8) / 8); osc('sawtooth', b, b * 2, 0.25, 0.06, { lp: 2500 }); osc('p25', b * 2, b * 2, 0.3, 0.05, { delay: 0.1 }); noise(0.3, 2000, 8000, 0.12, 'highpass', 0.7); },
    tick() { osc('p12', 1800, 1800, 0.02, 0.03); },
    tally() { if (!throttle('tally', 45)) return; osc('p25', 1200 + Math.random() * 200, 1200, 0.03, 0.035); },
    stamp() { osc('sine', 160, 50, 0.3, 0.6); noise(0.25, 1200, 100, 0.6); },
    gradeS() { [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => osc('p25', f, f, 0.2, 0.06, { delay: i * 0.07 })); },
    countdown() { osc('p25', 880, 880, 0.1, 0.07); },
    go() { osc('p25', 1760, 1760, 0.3, 0.08); },
    alarm() { osc('square', 880, 660, 0.15, 0.06); osc('square', 880, 660, 0.15, 0.06, { delay: 0.2 }); },
    enemyShot() { if (!throttle('es', 60)) return; osc('square', vary(700), 300, 0.08, 0.04); },
    enemyDie() { noise(0.25, 2000, 200, 0.35); osc('square', 500, 80, 0.25, 0.06); },
    popup() { osc('p25', 1046, 1046, 0.06, 0.05); osc('p25', 1318, 1318, 0.08, 0.05, { delay: 0.06 }); },
    title() { [262, 330, 392, 523].forEach((f, i) => osc('p25', f, f, 0.12, 0.06, { delay: i * 0.05 })); }
  };
  function play(name, arg) {
    if (muted()) return;
    const f = SFX[name];
    if (f) { try { f(arg); } catch (e) { } }
  }
  function loop(kind, on, intensity = 1) {
    const cur = loops[kind];
    if (!on || muted()) {
      if (cur) {
        const t = cur.a.currentTime;
        cur.g.gain.cancelScheduledValues(t); cur.g.gain.setTargetAtTime(0.0001, t, 0.05);
        cur.nodes.forEach((n) => { try { n.stop(t + 0.3); } catch (e) { } });
        delete loops[kind];
      }
      return;
    }
    if (cur) { if (cur.setI) cur.setI(intensity); return; }
    const a = ctx(); if (!a) return;
    const g = a.createGain(); g.gain.value = 0.0001;
    const nodes = [];
    let out = g, vol = 0.1, setI = null;
    const mkNoise = (type, f, q) => { const s = a.createBufferSource(); s.buffer = noiseBuf; s.loop = true; const fl = a.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; s.connect(fl).connect(g); nodes.push(s); return fl; };
    const mkOsc = (type, f, lfoF = 0, lfoA = 0, lp = 0) => {
      const o = a.createOscillator();
      if (type === 'p25') o.setPeriodicWave(pulse25); else o.type = type;
      o.frequency.value = f;
      if (lfoF) { const l = a.createOscillator(); l.frequency.value = lfoF; const lg = a.createGain(); lg.gain.value = lfoA; l.connect(lg).connect(o.frequency); nodes.push(l); }
      let n = o;
      if (lp) { const fl = a.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; o.connect(fl); n = fl; }
      n.connect(g); nodes.push(o); return o;
    };
    if (kind === 'laser') { mkOsc('sawtooth', 880, 22, 60, 2600); mkOsc('sine', 220, 7, 10); vol = 0.06; }
    else if (kind === 'flame') { mkNoise('bandpass', 700, 0.6); mkNoise('lowpass', 200, 0.7); vol = 0.28; }
    else if (kind === 'acid') { mkNoise('bandpass', 2500, 1.5); mkOsc('sine', 300, 13, 120); vol = 0.1; }
    else if (kind === 'freeze') { mkNoise('highpass', 5000, 0.7); mkOsc('sine', 1600, 9, 300); vol = 0.06; }
    else if (kind === 'saw') { mkOsc('sawtooth', 95, 31, 40, 1600); mkNoise('bandpass', 1800, 2); vol = 0.1; }
    else if (kind === 'drill') { mkOsc('square', 70, 45, 20, 900); mkNoise('bandpass', 900, 3); vol = 0.1; }
    else if (kind === 'magnet') { mkOsc('sine', 70, 6, 18); mkOsc('sine', 140, 6, 30); vol = 0.22; }
    else if (kind === 'grav') { mkOsc('sine', 110, 3, 20); mkOsc('p25', 220, 5, 8, 800); vol = 0.1; }
    else if (kind === 'spin') { const o = mkOsc('sawtooth', 60, 48, 30, 1400); vol = 0.06; setI = (i) => { o.frequency.setTargetAtTime(60 + i * 120, a.currentTime, 0.05); }; }
    else if (kind === 'eraser') { mkNoise('bandpass', 3200, 2); mkOsc('triangle', 180, 25, 40); vol = 0.12; }
    else if (kind === 'water') { mkNoise('bandpass', 1300, 0.8); vol = 0.25; }
    else if (kind === 'beam') { mkOsc('sawtooth', 55, 9, 6, 500); mkNoise('lowpass', 500, 1); vol = 0.4; }
    else if (kind === 'wind') { mkNoise('bandpass', 500, 1.5); mkNoise('lowpass', 150, 1); vol = 0.4; }
    else if (kind === 'rumble') { mkNoise('lowpass', 90, 1); mkOsc('sine', 32, 3, 6); vol = 0.7; }
    else if (kind === 'bees') { mkOsc('sawtooth', 220, 17, 15, 1500); mkOsc('sawtooth', 233, 13, 12, 1500); vol = 0.04; }
    else if (kind === 'tesla') { mkNoise('bandpass', 4000, 3); mkOsc('sawtooth', 120, 40, 50, 2000); vol = 0.09; }
    else if (kind === 'hole') { mkOsc('sine', 45, 0.5, 8); mkNoise('lowpass', 180, 1); vol = 0.35; }
    else { mkNoise('bandpass', 1000, 1); }
    g.connect(sfxBus);
    nodes.forEach((n) => n.start());
    g.gain.setTargetAtTime(vol, a.currentTime, 0.04);
    loops[kind] = { a, g, nodes, setI };
  }
  function stopLoops() { for (const k of Object.keys(loops)) loop(k, false); }

  const NOTE = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
  const midi = (n) => { const m = /^([A-G][#b]?)(\d)$/.exec(n); return m ? 12 * (Number(m[2]) + 1) + NOTE[m[1]] : null; };
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const chord = (root, kind) => { const r = midi(root); const iv = { m: [0, 3, 7], M: [0, 4, 7], m7: [0, 3, 7, 10], M7: [0, 4, 7, 11], 7: [0, 4, 7, 10] }[kind]; return iv.map((x) => r + x); };
  const SONGS = {
    title: {
      bpm: 132, lead: 'p25', leadVol: 0.05,
      lead1: ['G4 . G4 Eb4 . C4 Eb4 . G4 - C5 - Bb4 - G4 .', 'Ab4 . Ab4 C5 . Eb5 - C5 Ab4 - G4 - F4 - Eb4 .', 'G4 . Bb4 G4 . Eb4 G4 . Bb4 - Eb5 - D5 - Bb4 .', 'F4 . Bb4 D5 . F5 - D5 C5 - Bb4 - D5 - - .'],
      chords: [chord('C3', 'm'), chord('Ab2', 'M'), chord('Eb3', 'M'), chord('Bb2', 'M')],
      bass: 'R..R..R.R..R.OR.', arp: 'x.x.x.x.x.x.x.x.',
      K: 'x...x...x...x...', Sn: '....x.......x...', H: 'x.x.x.x.x.x.x.x.'
    },
    wreck: {
      bpm: 150, lead: 'p25', leadVol: 0.045,
      lead1: ['A4 A4 . C5 . A4 E5 . D5 . C5 . A4 - G4 .', 'F4 F4 . A4 . C5 F5 . E5 . C5 . A4 - C5 .', 'E5 - D5 C5 . G4 . C5 E5 - G5 - E5 . C5 .', 'D5 - B4 G4 . D5 . G5 F#5 - D5 - B4 - A4 .'],
      chords: [chord('A2', 'm'), chord('F2', 'M'), chord('C3', 'M'), chord('G2', 'M')],
      bass: 'R.RO.RR.R.RO.RRO', arp: 'xxxxxxxxxxxxxxxx',
      K: 'x..x..x.x..x..x.', Sn: '....x.......x..x', H: 'xxxxxxxxxxxxxxxx'
    },
    wreck2: {
      bpm: 156, lead: 'square', leadVol: 0.032,
      lead1: ['E5 . E5 D5 E5 . G5 . E5 . D5 . C5 . D5 .', 'C5 . C5 B4 C5 . E5 . C5 . B4 . A4 . B4 .', 'A4 . C5 . E5 . A5 . G5 . E5 . C5 . E5 .', 'B4 - - . D5 - - . G5 - F#5 - E5 - D5 .'],
      chords: [chord('E2', 'm'), chord('C2', 'M'), chord('A2', 'm'), chord('B2', 'M')],
      bass: 'RORORORORORORORO', arp: 'x.xx.xx.x.xx.xx.',
      K: 'x...x...x...x.x.', Sn: '....x.......x...', H: '..x...x...x...xx'
    },
    survival: {
      bpm: 168, lead: 'p25', leadVol: 0.045,
      lead1: ['D5 . D5 . A4 . D5 F5 E5 . D5 . C5 . A4 .', 'Bb4 . Bb4 . F4 . Bb4 D5 C5 . Bb4 . A4 . F4 .', 'C5 . E5 . G5 . E5 C5 D5 . E5 . G5 - - .', 'A4 . C#5 . E5 . A5 - G5 . E5 . C#5 . A4 .'],
      chords: [chord('D2', 'm'), chord('Bb1', 'M'), chord('C2', 'M'), chord('A1', 'M')],
      bass: 'RRORRORRRRORRORF', arp: 'x.x.x.x.x.x.x.x.',
      K: 'x.x.x.x.x.x.x.xx', Sn: '....x..x....x.x.', H: 'x.xxx.xxx.xxx.xx'
    },
    zen: {
      bpm: 78, lead: 'triangle', leadVol: 0.07,
      lead1: ['A4 - - - C5 - - - E5 - - - D5 - - -', 'G4 - - - B4 - - - D5 - - - . . . .', 'F4 - - - A4 - - - C5 - - - E5 - - -', 'E4 - - - G4 - - - B4 - - - . . . .'],
      chords: [chord('F2', 'M7'), chord('E2', 'm7'), chord('D2', 'm7'), chord('C2', 'M7')],
      bass: 'R.......F.......', arp: 'x..x..x..x..x..x', arpWave: 'triangle',
      K: 'x.........x.....', Sn: '................', H: '..x...x...x...x.'
    },
    boss: {
      bpm: 176, lead: 'sawtooth', leadVol: 0.03,
      lead1: ['E5 E5 . E5 . G5 . E5 D5 . C5 . B4 . C5 .', 'F5 F5 . F5 . A5 . F5 E5 . D5 . C5 . D5 .', 'E5 E5 . E5 . G5 . E5 D5 . C5 . B4 . G4 .', 'A4 . B4 . C5 . D5 . E5 - - . E5 - - .'],
      chords: [chord('E2', 'm'), chord('F2', 'M'), chord('E2', 'm'), chord('A2', 'm')],
      bass: 'RRRRRRRRRRRRRROO', arp: 'xxxxxxxxxxxxxxxx',
      K: 'x.x.x.x.x.x.x.x.', Sn: '....x.......x.xx', H: 'xxxxxxxxxxxxxxxx'
    }
  };
  for (const k in SONGS) SONGS[k].leadN = SONGS[k].lead1.map((bar) => bar.split(/\s+/));
  const mus = { song: null, step: 0, next: 0, timer: 0, name: null, muffled: false, paused: false };
  function playNote(type, f, t, dur, vol, bus) {
    const o = ac.createOscillator();
    if (type === 'p25') o.setPeriodicWave(pulse25); else if (type === 'p12') o.setPeriodicWave(pulse12); else o.type = type;
    o.frequency.setValueAtTime(f, t);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.006);
    g.gain.setValueAtTime(vol, t + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(bus);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function drum(kind, t) {
    if (kind === 'K') {
      const o = ac.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
      const g = ac.createGain(); g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      o.connect(g).connect(musBus); o.start(t); o.stop(t + 0.2);
    } else {
      const s = ac.createBufferSource(); s.buffer = noiseBuf;
      const f = ac.createBiquadFilter(); f.type = kind === 'H' ? 'highpass' : 'bandpass'; f.frequency.value = kind === 'H' ? 7000 : 1800; f.Q.value = kind === 'H' ? 0.7 : 0.9;
      const g = ac.createGain(); const v = kind === 'H' ? 0.06 : 0.22, d = kind === 'H' ? 0.04 : 0.13;
      g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      s.connect(f).connect(g).connect(musBus); s.start(t, Math.random()); s.stop(t + d + 0.02);
    }
  }
  function schedule() {
    if (!mus.song || mus.paused) return;
    if (muted() || document.hidden) { mus.next = 0; return; }
    const a = ctx(); if (!a) return;
    const S = mus.song;
    const stepDur = 60 / S.bpm / 4;
    if (!mus.next || mus.next < a.currentTime - 0.2) mus.next = a.currentTime + 0.06;
    while (mus.next < a.currentTime + 0.15) {
      const t = mus.next;
      const st = mus.step % 64, bar = Math.floor(st / 16), s16 = st % 16;
      const ch = S.chords[bar];
      const tok = S.leadN[bar][s16];
      if (tok && tok !== '.' && tok !== '-') {
        let len = 1;
        while (S.leadN[bar][s16 + len] === '-') len++;
        const m = midi(tok);
        if (m) {
          const alt = mus.step % 128 >= 64 && S.lead !== 'triangle';
          playNote(S.lead, hz(m), t, stepDur * len * 0.95, S.leadVol, musBus);
          if (alt) playNote('p12', hz(m + 12), t, stepDur * len * 0.6, S.leadVol * 0.35, musBus);
        }
      }
      const b = S.bass[s16];
      if (b && b !== '.') {
        const root = ch[0] - 12 + (b === 'O' ? 12 : 0) + (b === 'F' ? 7 : 0);
        playNote('triangle', hz(root), t, stepDur * 0.9, 0.16, musBus);
      }
      if (S.arp[s16] === 'x') {
        const tone = ch[(mus.step) % ch.length] + 12 + (Math.floor(mus.step / 4) % 2 ? 12 : 0);
        playNote(S.arpWave || 'p12', hz(tone), t, stepDur * 0.7, S.arpWave ? 0.03 : 0.018, musBus);
      }
      if (S.K[s16] === 'x') drum('K', t);
      if (S.Sn[s16] === 'x') drum('S', t);
      if (S.H[s16] === 'x') drum('H', t);
      mus.step++;
      mus.next += stepDur;
    }
  }
  function music(name) {
    if (mus.name === name) return;
    mus.name = name;
    mus.song = name ? SONGS[name] : null;
    mus.step = 0; mus.next = 0;
    if (!mus.timer) mus.timer = setInterval(schedule, 40);
    if (!name) { clearInterval(mus.timer); mus.timer = 0; }
  }
  function muffle(on) {
    mus.muffled = on;
    if (!ac || !musFilter) return;
    musFilter.frequency.setTargetAtTime(on ? 700 : 18000, ac.currentTime, 0.15);
  }
  function jingle(kind) {
    const a = ctx(); if (!a) return;
    const t0 = a.currentTime + 0.05;
    const seqs = {
      win: [[523, 0, 0.12], [659, 0.12, 0.12], [784, 0.24, 0.12], [1046, 0.36, 0.4], [988, 0.8, 0.12], [1046, 0.92, 0.6]],
      lose: [[392, 0, 0.25], [370, 0.28, 0.25], [349, 0.56, 0.25], [330, 0.84, 0.7]],
      start: [[392, 0, 0.1], [523, 0.1, 0.1], [659, 0.2, 0.1], [784, 0.3, 0.3]]
    };
    for (const [f, d, l] of seqs[kind] || []) { playNote('p25', f, t0 + d, l, 0.07, sfxBus); playNote('triangle', f / 2, t0 + d, l, 0.12, sfxBus); }
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) { stopLoops(); if (ac && ac.state === 'running') { try { ac.suspend(); } catch (e) { } } } else if (ac && !muted()) { try { ac.resume(); } catch (e) { } } });
  setInterval(() => { if (muted()) stopLoops(); }, 500);
  WTP.audio = { play, loop, stopLoops, music, muffle, jingle, setVolumes, ctx, get song() { return mus.name; } };
})();
