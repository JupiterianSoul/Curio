(() => {
  if (window.Cafe) return;
  const C = window.Curio;
  const KEY = 'classics:ambience';
  let nb = null;
  const ac = () => (C && !C.muted && C.audioContext ? C.audioContext() : null);
  const noiseBuf = (a) => {
    if (nb && nb.sampleRate === a.sampleRate) return nb;
    nb = a.createBuffer(1, a.sampleRate * 2, a.sampleRate);
    const ch = nb.getChannelData(0);
    let last = 0;
    for (let i = 0; i < ch.length; i++) { const w = Math.random() * 2 - 1; last = (last + 0.04 * w) / 1.04; ch[i] = w * 0.6 + last * 3; }
    return nb;
  };
  function tone(a, f, d, type = 'sine', vol = 0.1, when = 0, to = 0, out) {
    const t = a.currentTime + when, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(out || a.destination);
    o.start(t); o.stop(t + d + 0.03);
  }
  function hiss(a, d, vol, freq, q = 1, when = 0, kind = 'bandpass', to = 0, out) {
    const t = a.currentTime + when, s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    s.buffer = noiseBuf(a); f.type = kind; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (to) f.frequency.exponentialRampToValueAtTime(to, t + d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(f).connect(g).connect(out || a.destination);
    s.start(t, Math.random() * 1.5); s.stop(t + d + 0.02);
  }
  const jit = (v, p = 0.08) => v * (1 + (Math.random() * 2 - 1) * p);
  const KIND = {
    wood: (a, n = 1) => { hiss(a, 0.05, 0.5 * n, jit(1100), 2.5); tone(a, jit(190), 0.09, 'sine', 0.28 * n, 0, 120); tone(a, jit(620), 0.03, 'triangle', 0.08 * n); },
    thock: (a, n = 1) => { hiss(a, 0.07, 0.4 * n, jit(700), 1.6); tone(a, jit(140), 0.14, 'sine', 0.3 * n, 0, 80); },
    stone: (a, n = 1) => { hiss(a, 0.03, 0.35 * n, jit(3200), 3); tone(a, jit(2300), 0.06, 'sine', 0.07 * n); tone(a, jit(3400), 0.04, 'sine', 0.05 * n, 0.004); },
    pebble: (a, n = 1) => { for (let i = 0; i < 3; i++) { hiss(a, 0.02, 0.22 * n, jit(2600, 0.2), 4, i * jit(0.035, 0.4)); tone(a, jit(1800, 0.25), 0.04, 'sine', 0.05 * n, i * 0.035); } },
    plastic: (a, n = 1) => { [0, 0.05, 0.085, 0.11].forEach((w, i) => { hiss(a, 0.03, (0.3 - i * 0.06) * n, jit(2000), 3, w); tone(a, jit(900), 0.04, 'triangle', (0.09 - i * 0.02) * n, w); }); },
    card: (a, n = 1) => { hiss(a, 0.045, 0.5 * n, jit(3800), 0.8, 0, 'highpass'); hiss(a, 0.02, 0.2 * n, 900, 1, 0.01); },
    deal: (a, n = 1) => { hiss(a, 0.14, 0.28 * n, 5000, 0.7, 0, 'bandpass', 1800); hiss(a, 0.03, 0.35 * n, 3200, 1, 0.12, 'highpass'); },
    shuffle: (a, n = 1) => { for (let i = 0; i < 14; i++) hiss(a, 0.02, (0.16 + Math.random() * 0.12) * n, jit(4200, 0.3), 1, i * jit(0.028, 0.3), 'highpass'); },
    chip: (a, n = 1) => { tone(a, jit(3300), 0.05, 'sine', 0.08 * n); tone(a, jit(4700), 0.04, 'sine', 0.05 * n, 0.003); hiss(a, 0.025, 0.25 * n, 5200, 2); },
    chips: (a, n = 1) => { for (let i = 0; i < 4; i++) { tone(a, jit(3300, 0.12), 0.05, 'sine', 0.06 * n, i * 0.04); hiss(a, 0.02, 0.2 * n, 5000, 2, i * 0.04); } },
    pencil: (a, n = 1) => { hiss(a, 0.12, 0.22 * n, jit(3000), 4, 0, 'bandpass', 4200); hiss(a, 0.06, 0.12 * n, 6000, 2, 0.03); },
    paper: (a, n = 1) => hiss(a, 0.18, 0.2 * n, 2600, 0.6, 0, 'highpass'),
    felt: (a, n = 1) => { hiss(a, 0.08, 0.35 * n, 380, 0.8, 0, 'lowpass'); tone(a, 95, 0.1, 'sine', 0.12 * n); },
    tile: (a, n = 1) => { hiss(a, 0.035, 0.35 * n, jit(1700), 3); tone(a, jit(420), 0.07, 'triangle', 0.12 * n); tone(a, jit(1250), 0.03, 'sine', 0.05 * n); },
    glass: (a, n = 1) => { tone(a, jit(2900, 0.03), 0.6, 'sine', 0.05 * n); tone(a, jit(4350, 0.03), 0.4, 'sine', 0.03 * n); tone(a, jit(6100, 0.03), 0.2, 'sine', 0.015 * n); },
    bell: (a, n = 1) => { [1, 2.76, 5.4].forEach((m, i) => tone(a, 1318 * m, 1.1 - i * 0.3, 'sine', (0.08 - i * 0.022) * n)); },
    tada: (a, n = 1) => { [523.3, 659.3, 784, 1046.5].forEach((f, i) => { tone(a, f, 0.42, 'triangle', 0.08 * n, i * 0.08); tone(a, f * 2, 0.25, 'sine', 0.025 * n, i * 0.08); }); },
    sad: (a, n = 1) => { tone(a, 392, 0.3, 'triangle', 0.07 * n); tone(a, 330, 0.3, 'triangle', 0.07 * n, 0.2); tone(a, 262, 0.55, 'triangle', 0.07 * n, 0.4); },
    tick: (a, n = 1) => { tone(a, 1800, 0.02, 'square', 0.03 * n); },
    pop: (a, n = 1) => tone(a, 380, 0.09, 'sine', 0.12 * n, 0, 950)
  };
  function sound(kind, n = 1) {
    const a = ac(); if (!a || !KIND[kind]) return;
    try { KIND[kind](a, n); } catch {}
  }
  let amb = null;
  function ambOn() {
    const a = ac(); if (!a || amb) return;
    const out = a.createGain(); out.gain.value = 0.0001; out.connect(a.destination);
    out.gain.exponentialRampToValueAtTime(1, a.currentTime + 1.6);
    const src = a.createBufferSource(); src.buffer = noiseBuf(a); src.loop = true;
    const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 520; bp.Q.value = 0.9;
    const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400;
    const g = a.createGain(); g.gain.value = 0.05;
    const lfo = a.createOscillator(), lg = a.createGain(); lfo.frequency.value = 0.23; lg.gain.value = 0.018; lfo.connect(lg).connect(g.gain);
    const lfo2 = a.createOscillator(), lg2 = a.createGain(); lfo2.frequency.value = 0.71; lg2.gain.value = 140; lfo2.connect(lg2).connect(bp.frequency);
    src.connect(bp).connect(lp).connect(g).connect(out);
    src.start(); lfo.start(); lfo2.start();
    amb = { a, out, nodes: [src, lfo, lfo2], timer: 0 };
    const ping = () => {
      if (!amb) return;
      const r = Math.random();
      if (r < 0.5) { tone(a, jit(2700, 0.1), 0.5, 'sine', 0.012, 0, 0, out); tone(a, jit(4100, 0.1), 0.35, 'sine', 0.007, 0.01, 0, out); }
      else if (r < 0.75) { for (let i = 0; i < 3; i++) tone(a, jit(3100, 0.15), 0.25, 'sine', 0.007, i * 0.09, 0, out); }
      else if (r < 0.9) hiss(a, 1.8, 0.012, 4200, 0.7, 0, 'highpass', 0, out);
      else hiss(a, 0.4, 0.02, 600, 1.2, 0, 'bandpass', 900, out);
      amb.timer = setTimeout(ping, 2500 + Math.random() * 6000);
    };
    amb.timer = setTimeout(ping, 1200);
  }
  function ambOff() {
    if (!amb) return;
    const { a, out, nodes, timer } = amb; amb = null;
    clearTimeout(timer);
    try { out.gain.cancelScheduledValues(a.currentTime); out.gain.setValueAtTime(out.gain.value, a.currentTime); out.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.4); } catch {}
    setTimeout(() => { nodes.forEach((n) => { try { n.stop(); } catch {} }); try { out.disconnect(); } catch {} }, 500);
  }
  let wanted = !!(C && C.store.get(KEY, false));
  const sync = () => { if (wanted && !document.hidden && !(C && C.muted)) ambOn(); else ambOff(); paint(); };
  const btns = [];
  const CUP = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 10h12v4a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" fill="currentColor" opacity=".9"/><path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H15" fill="none" stroke="currentColor" stroke-width="1.8"/><path class="st" d="M8 3c-1 1.5 1 2.5 0 4M11.5 3c-1 1.5 1 2.5 0 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M3 21h15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  function paint() { btns.forEach((b) => { b.setAttribute('aria-pressed', String(wanted)); b.title = wanted ? 'Cafe sounds on' : 'Cafe sounds off'; }); }
  function toggle(on = !wanted) {
    wanted = !!on; if (C) C.store.set(KEY, wanted);
    if (wanted && C && C.muted) C.toast('Sound is muted in the top bar');
    sync();
  }
  function button(label = true) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'cafe-amb';
    b.setAttribute('aria-label', 'Cafe ambience');
    b.innerHTML = CUP + (label ? '<span>Cafe sounds</span>' : '');
    b.addEventListener('click', () => toggle());
    btns.push(b); paint();
    return b;
  }
  function decorate() {
    const ss = document.body.dataset.simpleSub;
    if (ss && C && C.simple) { const sub = document.querySelector('main .c-sub'); if (sub) sub.textContent = ss; }
    if (document.querySelector('.cafe-sign')) return;
    const t = document.querySelector('[data-cafe-sign]') || document.querySelector('main .c-title');
    if (!t || document.body.dataset.cafeSign === 'off') return;
    const s = document.createElement('div');
    s.className = 'cafe-sign';
    s.innerHTML = '<span class="cafe-plate">Zoble Classics</span>';
    s.append(button());
    t.parentNode.insertBefore(s, t);
  }
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('curio:sound', sync);
  const first = () => { window.removeEventListener('pointerdown', first, true); window.removeEventListener('keydown', first, true); sync(); };
  window.addEventListener('pointerdown', first, true);
  window.addEventListener('keydown', first, true);
  window.Cafe = { sound, button, toggle, decorate, get ambience() { return wanted; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', decorate); else setTimeout(decorate, 0);
})();
