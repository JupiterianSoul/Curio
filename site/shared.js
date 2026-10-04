(function () {
  const slug = document.body?.dataset.game || '';
  const game = (window.CURIO_GAMES || []).find((g) => g.slug === slug);
  const root = document.body?.dataset.root ?? (slug ? '../../' : './');
  const html = document.documentElement;
  const framed = (() => {
    try { return window.parent !== window && window.parent.location.origin === location.origin && !!window.parent.ZobleDesktop; } catch { return false; }
  })();
  if (framed) { html.classList.add('curio-framed'); html.style.setProperty('--bar-h', '0px'); }
  const isHub = !!document.body?.classList.contains('hub');
  const stage = { mount: null, bounds: null };
  const host = () => (stage.mount && stage.mount.isConnected ? stage.mount : document.body);
  const area = () => { const b = stage.bounds?.(); return b || { left: 0, top: 0, right: innerWidth, bottom: innerHeight }; };

  const store = {
    get(key, fallback = null) {
      try {
        const raw = localStorage.getItem(`curio:${key}`);
        return raw == null ? fallback : JSON.parse(raw);
      } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(`curio:${key}`, JSON.stringify(value)); } catch {}
    },
    remove(key) {
      try { localStorage.removeItem(`curio:${key}`); } catch {}
    }
  };

  const P = (face, hilite, light, shadow, desk, t1, t2, it1, it2, ttext, ittext, win, text, sel, seltext) => ({ face, hilite, light, shadow, desk, t1, t2, it1, it2, ttext, ittext, win, text, sel, seltext });
  const LOOKS = [
    { id: 'zob', name: 'ZobOS', toy: true, dark: false, note: 'Blueberry desk, bubblegum titles', pal: P('#fbf1e1', '#ffffff', '#fff8ec', '#d9c3a3', '#4a42a6', '#e23d74', '#f0628f', '#e9dccb', '#f2e8db', '#ffffff', '#8c7a6a', '#fffdf8', '#2b2347', '#e8457c', '#ffffff') },
    { id: 'mint', name: 'Mint Choc', toy: true, dark: false, note: 'Mint windows on a chocolate desk', pal: P('#e9f5ec', '#ffffff', '#f5fbf6', '#a9cdb5', '#6b4a35', '#23866a', '#47b08a', '#d3e5d8', '#e0ede4', '#ffffff', '#6f8a78', '#ffffff', '#2d1f17', '#23866a', '#ffffff') },
    { id: 'sherbet', name: 'Sherbet', toy: true, dark: false, note: 'Orange fizz with grape titles', pal: P('#fff0e0', '#ffffff', '#fff8ef', '#efbf96', '#ef7a4c', '#6c3fc9', '#9470ea', '#f1dccb', '#f7e8da', '#ffffff', '#8f7466', '#fffaf4', '#3a1e3c', '#6c3fc9', '#ffffff') },
    { id: 'zobnight', name: 'Zob After Dark', toy: true, dark: true, note: 'Lamp off, screen glowing', pal: P('#2f2a4f', '#5d5590', '#3a3460', '#1d1936', '#17142f', '#c2386c', '#e2588a', '#3a3460', '#474070', '#ffffff', '#a49cc8', '#221e3d', '#f2ecff', '#e2588a', '#ffffff') },
    { id: 'standard', name: 'Zoble Classic', dark: false, note: 'Teal desk, navy titles', pal: P('#c0c0c0', '#ffffff', '#dfdfdf', '#808080', '#008080', '#000080', '#1084d0', '#808080', '#b5b5b5', '#ffffff', '#c0c0c0', '#ffffff', '#000000', '#000080', '#ffffff') },
    { id: 'rainy', name: 'Rainy Day', dark: false, note: 'Slate blue and puddles', pal: P('#bcc5cf', '#ffffff', '#dde3ea', '#6f7d8c', '#4f6c86', '#2c4a66', '#6d93b6', '#7f8a95', '#b3bcc5', '#ffffff', '#dde3ea', '#ffffff', '#000000', '#2c4a66', '#ffffff') },
    { id: 'desert', name: 'Desert', dark: false, note: 'Sand, with a teal oasis', pal: P('#d8cdb5', '#fffdf6', '#ece4d2', '#8f8264', '#a8916a', '#00706b', '#3fa79d', '#9b9078', '#c9bea3', '#ffffff', '#ece4d2', '#fffdf6', '#000000', '#00706b', '#ffffff') },
    { id: 'marine', name: 'Marine', dark: false, note: 'Sea foam and deep water', pal: P('#b8cfcc', '#ffffff', '#dbe8e6', '#5f7a77', '#00505f', '#00454f', '#2b8c98', '#789692', '#aac2bf', '#ffffff', '#dbe8e6', '#ffffff', '#000000', '#00454f', '#ffffff') },
    { id: 'lilac', name: 'Lilac', dark: false, note: 'Soft purple, smells nice', pal: P('#c8c0dc', '#ffffff', '#e4dff0', '#7d7398', '#6a5b97', '#4b3b86', '#9a86cf', '#8d84a5', '#c0b8d4', '#ffffff', '#e4dff0', '#ffffff', '#000000', '#4b3b86', '#ffffff') },
    { id: 'brick', name: 'Brick', dark: false, note: 'Red brick and mortar', pal: P('#c7b8aa', '#fffaf4', '#e3d8cd', '#85715f', '#7f3326', '#7a1d12', '#c4563f', '#94847a', '#c2b3a6', '#ffffff', '#e3d8cd', '#fffaf4', '#000000', '#7a1d12', '#ffffff') },
    { id: 'pumpkin', name: 'Pumpkin', dark: false, note: 'Orange, warm, a bit spooky', pal: P('#e2c896', '#fffaf0', '#f1e2c4', '#9a7a3e', '#8a4a12', '#a33f00', '#f08a24', '#a89064', '#d6c091', '#ffffff', '#f1e2c4', '#fffaf0', '#000000', '#a33f00', '#ffffff') },
    { id: 'eggplant', name: 'Eggplant', dark: false, note: 'Purple skin, green leaves', pal: P('#a9c2a6', '#f4fff2', '#d0e0ce', '#5c7459', '#4a2350', '#5a1e63', '#a75db3', '#7d927a', '#b3c6b0', '#ffffff', '#d0e0ce', '#ffffff', '#000000', '#5a1e63', '#ffffff') },
    { id: 'contrast', name: 'High Contrast Black', dark: true, note: 'Black, white, nothing else', pal: P('#000000', '#ffffff', '#808080', '#808080', '#000000', '#800080', '#800080', '#008000', '#008000', '#ffffff', '#ffffff', '#000000', '#ffffff', '#800080', '#ffffff') },
    { id: 'midnight', name: 'Midnight', dark: true, note: 'Ink blue, for night owls', pal: P('#2e3047', '#7a7ea8', '#45486a', '#16172a', '#0b0d24', '#3a1f78', '#7a52d8', '#34364d', '#555872', '#ffffff', '#a4a6c0', '#17192e', '#e8e8f6', '#6a4ad0', '#ffffff') }
  ];
  const lookById = (id) => LOOKS.find((l) => l.id === id);

  const legacy = store.get('theme', 'auto');
  const DEFAULT_PREFS = { look: 'zob', ui: true, volume: 0.8, calm: false, cursor: 'normal', big: false, contrast: false, wallpaper: 'sprinkles', saver: 'zobs', saverWait: 3, restore: false, clicks: 'single', zob: true, trails: false, welcome: true, gameWindow: 'max' };
  let prefs = Object.assign({}, DEFAULT_PREFS, store.get('prefs', {}));
  if (!prefs.v98) {
    const old = prefs.look;
    prefs.look = old === 'midnight' || legacy === 'dark' ? 'midnight' : old === 'auto' && !store.get('prefs', null) ? 'standard' : 'standard';
    prefs.v98 = 1;
    store.set('prefs', prefs);
  }
  if (!prefs.vzob) {
    if (prefs.look === 'standard') prefs.look = 'zob';
    if (prefs.wallpaper === 'none' && prefs.look === 'zob') prefs.wallpaper = 'sprinkles';
    prefs.vzob = 1;
    store.set('prefs', prefs);
  }
  const savePrefs = () => store.set('prefs', prefs);
  const osDark = () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  const osCalm = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const resolved = () => (prefs.look === 'auto' || !lookById(prefs.look)) ? (prefs.look === 'auto' && osDark() ? 'zobnight' : 'zob') : prefs.look;
  let shownLook = '';
  function applyLook(silent) {
    const id = resolved();
    const l = lookById(id);
    html.dataset.look = id;
    html.dataset.theme = l.dark ? 'dark' : 'light';
    html.dataset.skin = l.toy ? 'toy' : 'classic';
    const changed = shownLook && shownLook !== id;
    shownLook = id;
    if (changed && !silent) window.dispatchEvent(new CustomEvent('curio:theme', { detail: l.dark ? 'dark' : 'light' }));
  }
  function applyPrefs() {
    html.classList.toggle('curio-calm', !!prefs.calm);
    html.classList.toggle('curio-big', !!prefs.big);
    html.classList.toggle('curio-contrast', !!prefs.contrast);
    html.classList.toggle('curio-cursor-pencil', prefs.cursor === 'pencil');
    html.classList.toggle('curio-cursor-big', prefs.cursor === 'big');
    if (master) master.gain.value = prefs.volume;
    trail(!!prefs.trails);
  }
  applyLook(true);
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => { if (prefs.look === 'auto') applyLook(); });
  const isDark = () => !!lookById(html.dataset.look || resolved())?.dark;
  const calm = () => !!prefs.calm || osCalm();

  function setLook(id) {
    if (id !== 'auto' && !lookById(id)) return;
    prefs.look = id; savePrefs();
    store.set('theme', id === 'auto' ? 'auto' : lookById(id).dark ? 'dark' : 'light');
    applyLook();
    const tried = store.get('hub:looks', {});
    tried[id === 'auto' ? resolved() : id] = 1;
    store.set('hub:looks', tried);
    if (LOOKS.every((l) => tried[l.id])) unlock('wardrobe');
  }
  function setPref(key, value) {
    prefs[key] = value; savePrefs(); applyPrefs();
    window.dispatchEvent(new CustomEvent('curio:prefs', { detail: { key, value } }));
  }

  let muted = store.get('muted', false);
  let touchpad = store.get('touchpad', false);
  const applyTouchpad = () => html.classList.toggle('curio-touchpad', touchpad);
  applyTouchpad();
  function setTouchpad(on) {
    touchpad = !!on;
    store.set('touchpad', touchpad);
    applyTouchpad();
    window.dispatchEvent(new CustomEvent('curio:touchpad', { detail: touchpad }));
  }
  const MODE_KEY = `mode:${slug || 'hub'}`;
  let mode = store.get(MODE_KEY, null) || store.get('modeDefault', 'simple');
  if (mode !== 'simple' && mode !== 'advanced') mode = 'simple';
  html.dataset.mode = mode;
  const hasModes = () => !!slug && document.body?.dataset.modes != null;
  function setMode(next) {
    next = next === 'advanced' ? 'advanced' : 'simple';
    if (next === mode) return;
    mode = next;
    store.set(MODE_KEY, mode);
    store.set('modeDefault', mode);
    html.dataset.mode = mode;
    window.dispatchEvent(new CustomEvent('curio:mode', { detail: mode }));
    if (framed) tell({ zoble: 'mode', mode });
    const firstFlip = !store.get('hub:secrets', {}).switch;
    if (document.body.dataset.modes !== 'live') { if (firstFlip) { const g = store.get('hub:secrets', {}); g.switch = Date.now(); store.set('hub:secrets', g); store.set('hub:later', 'switch'); } location.reload(); }
    else unlock('switch');
  }
  function setMuted(on) {
    muted = !!on; store.set('muted', muted);
    window.dispatchEvent(new CustomEvent('curio:sound', { detail: !muted }));
  }

  window.addEventListener('storage', (e) => {
    if (!e.key || !e.key.startsWith('curio:')) return;
    if (e.key === 'curio:prefs') {
      prefs = Object.assign({}, DEFAULT_PREFS, store.get('prefs', {}));
      applyLook(); applyPrefs();
      window.dispatchEvent(new CustomEvent('curio:prefs', { detail: { key: '*' } }));
    } else if (e.key === 'curio:muted') {
      muted = store.get('muted', false);
      window.dispatchEvent(new CustomEvent('curio:sound', { detail: !muted }));
    } else if (e.key === 'curio:touchpad') {
      touchpad = store.get('touchpad', false); applyTouchpad();
      window.dispatchEvent(new CustomEvent('curio:touchpad', { detail: touchpad }));
    }
  });

  let audio = null, master = null;
  function ctx() {
    if (!audio) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { audio = new AC(); } catch { return null; }
      try {
        const out = audio.destination;
        master = audio.createGain();
        master.gain.value = prefs.volume;
        master.connect(out);
        Object.defineProperty(audio, 'destination', { value: master, configurable: true });
      } catch { master = null; }
    }
    if (audio.state === 'suspended') audio.resume().catch(() => {});
    return audio;
  }
  function beep(freq = 440, duration = 0.08, type = 'sine', volume = 0.15) {
    if (muted) return;
    const ac = ctx(); if (!ac) return;
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain).connect(ac.destination);
    osc.start(t); osc.stop(t + duration + 0.02);
  }

  let noiseBuf = null;
  function tone(ac, f, d, type, vol, when = 0, to = 0, attack = 0.006) {
    const t = ac.currentTime + when;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(ac.destination);
    o.start(t); o.stop(t + d + 0.03);
  }
  function pad(ac, f, d, vol, when = 0, attack = 0.25) {
    const t = ac.currentTime + when;
    const g = ac.createGain(), lp = ac.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(900, t); lp.frequency.linearRampToValueAtTime(2600, t + attack + 0.4);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    lp.connect(g).connect(ac.destination);
    [-6, 0, 7].forEach((det, i) => {
      const o = ac.createOscillator();
      o.type = i === 1 ? 'triangle' : 'sawtooth'; o.frequency.setValueAtTime(f, t); o.detune.value = det;
      const og = ac.createGain(); og.gain.value = i === 1 ? 0.7 : 0.16;
      o.connect(og).connect(lp); o.start(t); o.stop(t + d + 0.05);
    });
  }
  function noise(ac, d, vol, freq, q = 1, when = 0, kind = 'bandpass', to = 0) {
    if (!noiseBuf) {
      noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
      const ch = noiseBuf.getChannelData(0);
      for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    }
    const t = ac.currentTime + when;
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; f.type = kind; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (to) f.frequency.exponentialRampToValueAtTime(to, t + d);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(f).connect(g).connect(ac.destination);
    s.start(t, Math.random() * 0.3); s.stop(t + d + 0.02);
  }
  const PENTA = [261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3, 784, 880, 1046.5];
  const SFX = {
    tap: (ac) => { noise(ac, 0.025, 0.25, 3200, 1.2); tone(ac, 1800, 0.018, 'square', 0.02); },
    click: (ac) => { noise(ac, 0.02, 0.22, 3600, 1.4); tone(ac, 2400, 0.012, 'square', 0.015); },
    hover: (ac, n = 0) => tone(ac, 1250 + (n % 7) * 90, 0.025, 'square', 0.012),
    menu: (ac) => { noise(ac, 0.03, 0.12, 2400, 1); tone(ac, 900, 0.03, 'triangle', 0.03); },
    on: (ac) => { tone(ac, 660, 0.06, 'square', 0.04); tone(ac, 990, 0.08, 'square', 0.04, 0.05); },
    off: (ac) => { tone(ac, 760, 0.06, 'square', 0.04); tone(ac, 500, 0.09, 'square', 0.04, 0.05); },
    open: (ac) => { tone(ac, 420, 0.12, 'triangle', 0.07, 0, 840); noise(ac, 0.1, 0.06, 1200, 1, 0, 'bandpass', 3000); },
    close: (ac) => { tone(ac, 700, 0.12, 'triangle', 0.06, 0, 350); noise(ac, 0.08, 0.05, 2600, 1, 0, 'bandpass', 800); },
    max: (ac) => { tone(ac, 330, 0.14, 'triangle', 0.06, 0, 990); },
    min: (ac) => { tone(ac, 990, 0.14, 'triangle', 0.06, 0, 330); },
    restore: (ac) => { tone(ac, 440, 0.1, 'triangle', 0.06, 0, 660); tone(ac, 660, 0.1, 'triangle', 0.05, 0.08); },
    ding: (ac) => { tone(ac, 1320, 0.6, 'sine', 0.11, 0, 0, 0.004); tone(ac, 2640, 0.3, 'sine', 0.03, 0, 0, 0.004); tone(ac, 1980, 0.4, 'triangle', 0.02, 0.01); },
    chord: (ac) => { [523.3, 659.3, 784].forEach((f) => { tone(ac, f, 0.7, 'triangle', 0.06, 0, 0, 0.004); tone(ac, f * 2, 0.35, 'sine', 0.015); }); },
    question: (ac) => { tone(ac, 660, 0.18, 'sine', 0.09); tone(ac, 880, 0.35, 'sine', 0.09, 0.14); },
    critical: (ac) => { tone(ac, 220, 0.28, 'square', 0.05); tone(ac, 233, 0.28, 'square', 0.04); noise(ac, 0.12, 0.2, 300, 0.8, 0, 'lowpass'); },
    notify: (ac) => { tone(ac, 1046.5, 0.12, 'sine', 0.07); tone(ac, 1568, 0.25, 'sine', 0.06, 0.09); },
    startup: (ac) => {
      [[261.6, 0], [392, 0.18], [523.3, 0.36], [659.3, 0.54]].forEach(([f, w]) => pad(ac, f, 3.2 - w, 0.07, w, 0.35));
      [1046.5, 1318.5, 1568, 2093].forEach((f, i) => tone(ac, f, 0.9, 'sine', 0.035, 0.9 + i * 0.16, 0, 0.01));
      pad(ac, 130.8, 3.4, 0.05, 0.1, 0.6);
    },
    shutdown: (ac) => {
      [[659.3, 0], [523.3, 0.22], [392, 0.44], [261.6, 0.66]].forEach(([f, w]) => pad(ac, f, 2.4 - w * 0.5, 0.07, w, 0.12));
      pad(ac, 130.8, 2.6, 0.05, 0.5, 0.4);
    },
    success: (ac) => { [523.3, 659.3, 784, 1046.5].forEach((f, i) => { tone(ac, f, 0.28, 'square', 0.035, i * 0.075); tone(ac, f * 2, 0.16, 'sine', 0.02, i * 0.075); }); },
    error: (ac) => { tone(ac, 196, 0.16, 'square', 0.045); tone(ac, 147, 0.22, 'square', 0.045, 0.11); },
    stamp: (ac) => { noise(ac, 0.07, 0.45, 900, 0.7, 0, 'lowpass'); tone(ac, 120, 0.14, 'sine', 0.22, 0, 55); },
    pop: (ac) => tone(ac, 380, 0.09, 'square', 0.05, 0, 950),
    unpop: (ac) => tone(ac, 820, 0.09, 'square', 0.04, 0, 330),
    roll: (ac) => { for (let i = 0; i < 9; i++) noise(ac, 0.03, 0.3 - i * 0.025, 1800 + Math.random() * 1500, 2, i * 0.06 + Math.random() * 0.03); },
    squeak: (ac) => { tone(ac, 820, 0.1, 'square', 0.035, 0, 1500); tone(ac, 1400, 0.12, 'square', 0.03, 0.09, 1000); },
    paper: (ac) => noise(ac, 0.14, 0.1, 3500, 0.6, 0, 'highpass'),
    whoosh: (ac) => noise(ac, 0.4, 0.18, 300, 0.8, 0, 'bandpass', 3000),
    crumple: (ac) => { for (let i = 0; i < 14; i++) noise(ac, 0.04, 0.25, 2000 + Math.random() * 3000, 1.5, i * 0.035 + Math.random() * 0.02, 'bandpass'); },
    note: (ac, n = 0) => { const f = PENTA[((n % PENTA.length) + PENTA.length) % PENTA.length]; tone(ac, f, 0.4, 'square', 0.04); tone(ac, f * 2, 0.2, 'triangle', 0.03); },
    snore: (ac) => noise(ac, 0.8, 0.06, 260, 2, 0, 'bandpass', 160),
    coin: (ac) => { tone(ac, 988, 0.08, 'square', 0.05); tone(ac, 1319, 0.3, 'square', 0.05, 0.08); },
    blip: (ac, n = 0) => tone(ac, 330 + (n % 8) * 55, 0.05, 'square', 0.035),
    lift: (ac) => { noise(ac, 0.12, 0.3, 160, 0.8, 0, 'lowpass'); tone(ac, 90, 0.2, 'sine', 0.2, 0, 60); tone(ac, 520, 0.12, 'triangle', 0.05, 0.12, 780); },
    flip: (ac) => { tone(ac, 520, 0.07, 'square', 0.04, 0, 760); noise(ac, 0.05, 0.12, 4200, 1, 0.02, 'highpass'); }
  };
  let lastHover = 0;
  function sfx(name, n) {
    if (muted || !prefs.ui) return;
    if (name === 'hover') { const now = performance.now(); if (now - lastHover < 70) return; lastHover = now; }
    const ac = ctx(); if (!ac || !SFX[name]) return;
    try { SFX[name](ac, n); } catch {}
  }

  const ICONS = {
    home: '<path d="M3.4 11.4 12 4.1l8.7 7.5"/><path d="M5.6 9.9v9.4h12.8V9.6"/><path d="M10 20v-5.7h4V20"/>',
    sound: '<path d="M3.9 9.4h3.3L12 5.3v13.6l-4.8-4.1H3.9z"/><path d="M15.3 9.3c1.4 1.5 1.4 4 0 5.5"/><path d="M17.9 6.7c2.9 3 2.9 7.8 0 10.8"/>',
    mute: '<path d="M3.9 9.4h3.3L12 5.3v13.6l-4.8-4.1H3.9z"/><path d="M15.6 9.6l4.9 5M20.6 9.5l-5.1 5.2"/>',
    close: '<path d="M6.1 6.3 17.9 17.7M18 6.1 6 18"/>',
    check: '<path d="M4.6 12.7l4.5 4.4 10.4-10.5"/>',
    star: '<path d="M12 3.4l2.6 5.4 5.9.8-4.3 4.1 1.1 5.8L12 16.7l-5.3 2.8 1-5.8-4.3-4.1 6-.8z"/>',
    starf: '<path class="s" d="M12 3.4l2.6 5.4 5.9.8-4.3 4.1 1.1 5.8L12 16.7l-5.3 2.8 1-5.8-4.3-4.1 6-.8z"/>',
    dice: '<path d="M5 4h14v16H5z"/><circle class="f" cx="8.4" cy="8.4" r="1.45"/><circle class="f" cx="15.6" cy="15.6" r="1.45"/><circle class="f" cx="12" cy="12" r="1.45"/>',
    arrow: '<path d="M4.5 12.2h14.2M13.6 6.8l5.4 5.4-5.4 5.3"/>',
    trophy: '<path d="M7.4 4.4h9.2v4.7c0 2.7-2 4.9-4.6 4.9s-4.6-2.2-4.6-4.9z"/><path d="M12 14v3.4M8.4 19.9h7.2l-.6-2.5H9z"/>'
  };
  function sprite() {
    if (document.getElementById('curio-icons')) return;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'curio-icons';
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    svg.innerHTML = Object.entries(ICONS).map(([k, v]) => `<symbol id="ci-${k}" viewBox="0 0 24 24">${v}</symbol>`).join('');
    document.body.prepend(svg);
  }
  const icon = (name, cls = '') => {
    if (!ICONS[name] && PXI[name]) return `<img class="z-px ${cls}" src="${px(name, 16)}" width="16" height="16" alt="">`;
    return `<svg class="ci ${cls}" aria-hidden="true" focusable="false"><use href="#ci-${ICONS[name] ? name : 'star'}"></use></svg>`;
  };

  const ZOB = (() => {
    const W = 24, H = 28;
    const grid = () => Array.from({ length: H }, () => Array(W).fill(''));
    const base = grid(), eye = grid(), shut = grid(), smile = grid(), oh = grid();
    const inBody = (x, y) => ((x + 0.5 - 12) / 9.6) ** 2 + ((y + 0.5 - 16.6) / 9.1) ** 2 <= 1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (inBody(x, y)) {
        const edge = !inBody(x - 1, y) || !inBody(x + 1, y) || !inBody(x, y - 1) || !inBody(x, y + 1);
        if (edge) base[y][x] = 'K';
        else {
          const d = (x + 0.5 - 12) * 0.35 + (y + 0.5 - 16.6) * 0.95;
          const e = ((x + 0.5 - 12) / 9.6) ** 2 + ((y + 0.5 - 16.6) / 9.1) ** 2;
          base[y][x] = d > 5.6 ? 'D' : (e > 0.5 && x < 10 && y < 14 && x + y < 17) ? 'L' : 'P';
        }
      }
    }
    [[12, 6], [12, 5], [13, 4]].forEach(([x, y]) => { base[y][x] = 'K'; });
    for (let y = 0; y < 5; y++) for (let x = 11; x < 18; x++) {
      const r = Math.hypot(x + 0.5 - 14.5, y + 0.5 - 2.3);
      if (r <= 1.75) base[y][x] = 'Y';
      else if (r <= 2.55) base[y][x] = 'K';
    }
    base[1][14] = 'W';
    for (let y = 8; y < 21; y++) for (let x = 6; x < 18; x++) {
      const r = Math.hypot(x + 0.5 - 12, y + 0.5 - 14.2);
      if (r <= 4.3) eye[y][x] = 'W';
      else if (r <= 5.2) eye[y][x] = 'K';
      const p = Math.hypot(x + 0.5 - 12.6, y + 0.5 - 14.7);
      if (p <= 2.1) eye[y][x] = 'E';
    }
    eye[13][13] = 'W';
    for (let x = 8; x <= 16; x++) shut[14][x] = 'K';
    shut[15][8] = 'K'; shut[15][16] = 'K';
    [[6, 19], [7, 19], [17, 19], [16, 19]].forEach(([x, y]) => { if (base[y][x] && base[y][x] !== 'K') base[y][x] = 'C'; });
    [[9, 21], [10, 22], [11, 22], [12, 22], [13, 22], [14, 21]].forEach(([x, y]) => { smile[y][x] = 'K'; });
    [[11, 21], [12, 21], [11, 22], [12, 22]].forEach(([x, y]) => { oh[y][x] = 'K'; });
    [[8, 26], [8, 27], [7, 27], [15, 26], [15, 27], [16, 27], [2, 17], [1, 18], [21, 17], [22, 18]].forEach(([x, y]) => { base[y][x] = 'K'; });
    const COL = { K: '#1b1830', P: '#dc2f6c', D: '#a51f50', L: '#ff86b2', C: '#ff9ec4', W: '#fffdf6', E: '#1b1830', Y: '#ffcf3a', B: '#2f4fb0', R: '#d6332b', Q: '#2b2140', O: '#ff8a2a', G: '#ffe14a', S: '#fffdf6' };
    const hats = {
      night: ['......SS................', '.....BBBS...............', '....BBBBB...............', '...BBBBBBB..............', '..BBBBBBBBBB............', '.BBBBBBBBBBBBB..........', 'SSSSSSSSSSSSSSS.........'],
      party: ['...........R............', '..........GGG...........', '..........GRG...........', '.........GGGGG..........', '.........GRGGG..........', '........GGGGRGG.........', '........GGGGGGG.........'],
      witch: ['..........QQ............', '.........QQQ............', '........QQQQ............', '.......QQQQQQ...........', '.......OOOOOO...........', '......QQQQQQQQ..........', '..QQQQQQQQQQQQQQQQQQ....'],
      scarf: ['RRRRRRRRRRRRRRRRRRRR', '.RRRRRRRRRRRRRRRRRR.', '..............RRR...', '..............RRRR..']
    };
    const hatAt = { night: [0, 4], party: [0, 0], witch: [0, 1], scarf: [2, 21] };
    function paths(g, ox = 0, oy = 0) {
      const d = {};
      g.forEach((row, y) => { let x = 0; while (x < row.length) { const c = row[x]; if (!c || c === '.') { x++; continue; } let x1 = x; while (x1 < row.length && row[x1] === c) x1++; d[c] = (d[c] || '') + `M${x + ox} ${y + oy}h${x1 - x}v1h-${x1 - x}z`; x = x1; } });
      return Object.entries(d).map(([c, v]) => `<path fill="${COL[c]}" d="${v}"/>`).join('');
    }
    const hatGrid = (k) => hats[k].map((r) => r.split(''));
    function svg(cls = '') {
      const hatSvg = Object.keys(hats).map((k) => `<g class="pim__hat pim__hat--${k}">${paths(hatGrid(k), hatAt[k][0], hatAt[k][1])}</g>`).join('');
      return `<svg class="pim ${cls}" viewBox="0 0 24 28" shape-rendering="crispEdges" aria-hidden="true" focusable="false"><g class="pim__all">${paths(base)}<g class="pim__shut">${paths(shut)}</g><g class="pim__open">${paths(eye)}</g><g class="pim__smile">${paths(smile)}</g><g class="pim__o">${paths(oh)}</g>${hatSvg}</g></svg>`;
    }
    function draw(g, ox, oy, state = '') {
      const layers = [base, state === 'sleep' ? shut : eye, state === 'surprised' || state === 'sleep' ? oh : smile];
      for (const L of layers) L.forEach((row, y) => row.forEach((c, x) => { if (c && c !== '.') { g.fillStyle = COL[c]; g.fillRect(ox + x, oy + y, 1, 1); } }));
    }
    return { svg, draw, COL };
  })();
  const pim = (cls = '') => ZOB.svg(cls);

  const PXC = new Map();
  function canvas(n) { const c = document.createElement('canvas'); c.width = c.height = n; return c; }
  function painter(n) {
    const c = canvas(n), g = c.getContext('2d');
    const k = n / 32;
    const P = {
      n, k, g, c, big: n >= 32,
      shape(test, fill, line, line2) {
        const inside = [];
        for (let j = 0; j < n; j++) { inside.push([]); for (let i = 0; i < n; i++) inside[j].push(!!test((i + 0.5) / k, (j + 0.5) / k)); }
        for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
          if (!inside[j][i]) continue;
          const out = (a, b) => a < 0 || b < 0 || a >= n || b >= n || !inside[b][a];
          const edge = out(i - 1, j) || out(i + 1, j) || out(i, j - 1) || out(i, j + 1);
          let col = fill;
          if (edge && line) col = line2 && (out(i + 1, j) || out(i, j + 1)) ? line2 : line;
          if (!col) continue;
          g.fillStyle = col; g.fillRect(i, j, 1, 1);
        }
        return P;
      },
      rect(x, y, w, h, fill, line, line2) { return P.shape((a, b) => a >= x && a < x + w && b >= y && b < y + h, fill, line, line2); },
      disc(cx, cy, r, fill, line) { return P.shape((a, b) => (a - cx) ** 2 + (b - cy) ** 2 <= r * r, fill, line); },
      ring(cx, cy, r0, r1, col, filt) { return P.shape((a, b) => { const d = Math.hypot(a - cx, b - cy); return d >= r0 && d <= r1 && (!filt || filt(a, b)); }, col); },
      ellipse(cx, cy, rx, ry, fill, line) { return P.shape((a, b) => ((a - cx) / rx) ** 2 + ((b - cy) / ry) ** 2 <= 1, fill, line); },
      poly(pts, fill, line, line2) {
        return P.shape((a, b) => {
          let ins = false;
          for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
            const [xi, yi] = pts[i], [xj, yj] = pts[j];
            if ((yi > b) !== (yj > b) && a < ((xj - xi) * (b - yi)) / (yj - yi) + xi) ins = !ins;
          }
          return ins;
        }, fill, line, line2);
      },
      dot(x, y, col) { g.fillStyle = col; g.fillRect(Math.floor(x * k), Math.floor(y * k), 1, 1); return P; },
      hl(x0, x1, y, col) { g.fillStyle = col; const a = Math.round(x0 * k), b = Math.max(a + 1, Math.round(x1 * k)); g.fillRect(a, Math.floor(y * k), b - a, 1); return P; },
      vl(x, y0, y1, col) { g.fillStyle = col; const a = Math.round(y0 * k), b = Math.max(a + 1, Math.round(y1 * k)); g.fillRect(Math.floor(x * k), a, 1, b - a); return P; },
      line(x0, y0, x1, y1, col) {
        let a = Math.floor(x0 * k), b = Math.floor(y0 * k); const c2 = Math.floor(x1 * k), d = Math.floor(y1 * k);
        const dx = Math.abs(c2 - a), dy = -Math.abs(d - b), sx = a < c2 ? 1 : -1, sy = b < d ? 1 : -1; let err = dx + dy;
        g.fillStyle = col;
        for (;;) { g.fillRect(a, b, 1, 1); if (a === c2 && b === d) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; a += sx; } if (e2 <= dx) { err += dx; b += sy; } }
        return P;
      },
      map(rows, pal, x, y, outline) {
        const h = rows.length, w = rows[0].length;
        if (outline) {
          g.fillStyle = outline;
          for (let j = -1; j <= h; j++) for (let i = -1; i <= w; i++) {
            const has = (a, b) => b >= 0 && b < h && a >= 0 && a < w && rows[b][a] !== '.';
            if (has(i, j)) continue;
            if (has(i - 1, j) || has(i + 1, j) || has(i, j - 1) || has(i, j + 1)) g.fillRect(x + i, y + j, 1, 1);
          }
        }
        rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== '.' && pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(x + i, y + j, 1, 1); } }));
        return P;
      }
    };
    return P;
  }

  const EMB = {
    classic: ['...RR.....', '..RRRR....', '..RRRR....', '...RR.....', '....K.....', '....K.....', '..KKKKKK..', '.KGGGGGGK.', '.KGGRGGGK.', '..KKKKKK..'],
    gym: ['..........', 'RR......RR', 'RR......RR', 'RRKKKKKKRR', 'RRKKKKKKRR', 'RR......RR', 'RR......RR', '..........'],
    explore: ['...BBBB...', '..BGGBBB..', '.BGGGBBBB.', '.BBGGBBGB.', '.BBBBBGGB.', '.BBBBGGGB.', '.BGBBBGBB.', '..BGGBBB..', '...BBBB...'],
    life: ['...YYYY...', '..YYYYYY..', '.YYYKKYYY.', '.YYKYYYYY.', '.YYYKKYYY.', '.YYYYYKYY.', '.YYYKKYYY.', '..YYYYYY..', '...YYYY...'],
    absurd: ['..........', '...KKKK...', '.KKWWWWKK.', 'KWWWBBWWWK', 'KWWBKKBWWK', 'KWWWBBWWWK', '.KKWWWWKK.', '...KKKK...'],
    skill: ['...RRRR...', '..RWWWWR..', '.RWRRRRWR.', '.RWRWWRWR.', '.RWRWWRWR.', '.RWRRRRWR.', '..RWWWWR..', '...RRRR...'],
    brain: ['...YYYY...', '..YYWYYY..', '.YYWYYYYY.', '.YYYYYYYY.', '..YYYYYY..', '...YYYY...', '...GGGG...', '...GGGG...', '....GG....'],
    arcade: ['..V....V..', '...V..V...', '..VVVVVV..', '.VV.VV.VV.', 'VVVVVVVVVV', 'V.VVVVVV.V', 'V.V....V.V', '...VV.VV..'],
    puzzle: ['....PP....', '...PPPP...', 'PPPPPPPPP.', 'PPPPPPPPPP', '.PPPPPPPPP', 'PPPPPPPPPP', 'PPPPPPPPP.', 'PPPP..PPP.'],
    versus: ['G........G', '.G......G.', '..G....G..', '...G..G...', '....GG....', '....GG....', '...G..G...', '.YN....NY.', 'YN......NY'],
    toy: ['...RRRR...', '..RRWWRR..', '.RRWRRRRR.', '.RRRRRRRR.', '.YYYYYYYY.', '.YYYYYYYY.', '..BBBBBB..', '...BBBB...'],
    make: ['.GGGGGG...', 'GGGGGGG...', '.GGGGGG...', '...NN.....', '...NN.....', '...NN.....', '...NN.....', '...NN.....'],
    draw: ['.......PP.', '......YYP.', '.....YYY..', '....YYY...', '...YYY....', '..YYY.....', '.NNY......', '.KN.......', 'K.........'],
    star: ['....YY....', '....YY....', '...YYYY...', 'YYYYYYYYYY', '.YYYYYYYY.', '..YYYYYY..', '..YYYYYY..', '.YYY..YYY.', '.YY....YY.'],
    clock: ['..KKKKK...', '.KWWKWWK..', 'KWWWKWWWK.', 'KWWWKWWWK.', 'KWWWKKKWK.', 'KWWWWWWWK.', '.KWWWWWK..', '..KKKKK...'],
    fresh: ['....Y.....', '....Y.....', '...YYY....', 'YYYYWYYYY.', '...YYY....', '....Y.....', '....Y.....'],
    eye: ['..........', '...KKKK...', '.KKWWWWKK.', 'KWWWBBWWWK', 'KWWBKKBWWK', 'KWWWBBWWWK', '.KKWWWWKK.', '...KKKK...'],
    zob: ['....Y.....', '....K.....', '..KKKKK...', '.KPPPPPK..', 'KPWWWPPPK.', 'KPWEWPPPK.', 'KPWWWPPPK.', '.KPPPPPK..', '..KKKKK...']
  };
  const EPAL = { R: '#e02020', K: '#1b1b1b', G: '#a8a8a8', B: '#2a6fdb', Y: '#ffd23f', W: '#ffffff', V: '#3ac43a', P: '#9c3ad6', N: '#8b5a2b', E: '#1b1830' };
  const FOLDER_TINT = { classic: '#ff9d5c', gym: '#ff7ab0', explore: '#7ec8ff', life: '#8fe08f', absurd: '#e0a0ff', skill: '#ff8f8f', brain: '#ffe066', arcade: '#9cf09c', puzzle: '#c9a0ff', versus: '#ffb070', toy: '#ffc06b', make: '#a0d8ff', draw: '#ffd0a0' };

  const PXI = {
    folder(p, o = {}) {
      const col = o.tint && !p.big ? o.tint : '#f6d55c', dk = '#8a6a10';
      p.poly([[2, 6], [12, 6], [14, 9], [29, 9], [29, 27], [2, 27]], '#e0b43c', dk);
      p.poly([[2, 12], [30, 12], [29, 27], [2, 27]], col, dk);
      p.hl(3.1, 28.9, 12 + 1 / p.k + 0.01, '#fff3b0');
      if (o.emb && EMB[o.emb] && p.big) p.map(EMB[o.emb], EPAL, 19, 15, '#2a2a2a');
      if (o.emb && EMB[o.emb] && !p.big && o.small) p.map(o.small, EPAL, 9, 7);
    },
    folderOpen(p) {
      p.poly([[2, 6], [12, 6], [14, 9], [27, 9], [27, 27], [2, 27]], '#e0b43c', '#8a6a10');
      p.rect(6, 11, 18, 10, '#ffffff', '#808080');
      p.poly([[6, 15], [31, 15], [27, 27], [2, 27]], '#f6d55c', '#8a6a10');
    },
    computer(p) {
      p.rect(3, 2, 26, 20, '#c0c0c0', '#000000', '#000000');
      p.hl(4.1, 27.9, 2 + 1.01 / p.k, '#ffffff');
      p.rect(6, 5, 20, 14, '#008080', '#404040');
      if (p.big) { p.poly([[13, 8], [21, 12], [13, 16]], '#ffff00', '#806000'); }
      else p.rect(13, 9, 6, 6, '#ffff00');
      p.rect(11, 22, 10, 3, '#a0a0a0', '#000');
      p.rect(5, 25, 22, 5, '#c0c0c0', '#000', '#000');
      if (p.big) { p.hl(18, 24, 27, '#00c000'); }
    },
    bin(p, o = {}) {
      p.poly([[7, 8], [25, 8], [23, 30], [9, 30]], '#d4d4d4', '#303030');
      if (p.big) { [11, 14, 17, 20].forEach((x, i) => p.line(x + 0.5, 11, x + 0.5 + (i - 1.5) * 0.4, 28, '#8a8a8a')); }
      else p.vl(16, 10, 28, '#8a8a8a');
      p.rect(5, 5, 22, 4, '#eeeeee', '#303030');
      if (o.full) { p.disc(11, 5, 4.5, '#ffffff', '#606060'); p.disc(19, 4.5, 4, '#fff7c0', '#806000'); p.disc(15, 3, 3, '#cfe8ff', '#305080'); }
    },
    doc(p, o = {}) {
      p.poly([[6, 2], [20, 2], [26, 8], [26, 30], [6, 30]], o.paper || '#ffffff', '#000000');
      p.poly([[20, 2], [20, 8], [26, 8]], '#c0c0c0', '#000000');
      const lines = p.big ? [11, 14, 17, 20, 23, 26] : [12, 18, 24];
      if (!o.blank) lines.forEach((y, i) => p.hl(9, i % 3 === 2 ? 18 : 23, y, o.ink || '#000080'));
    },
    notepad(p) {
      p.rect(5, 4, 22, 27, '#ffffff', '#000');
      p.rect(5, 4, 22, 5, '#00a0a0', '#000');
      if (p.big) { [9, 13, 17, 21].forEach((x) => p.rect(x, 2, 2, 4, '#808080', '#000')); [13, 16, 19, 22, 25].forEach((y, i) => p.hl(8, i === 4 ? 18 : 24, y, '#000080')); }
      else { p.hl(8, 24, 16, '#000080'); p.hl(8, 24, 22, '#000080'); }
    },
    app(p, o = {}) {
      p.rect(2, 5, 28, 23, '#c0c0c0', '#000', '#000');
      p.rect(4, 7, 24, 4, o.title || '#000080');
      p.rect(4, 13, 24, 13, o.body || '#ffffff', '#808080');
      if (o.glyph === 'q' && p.big) p.map(['.KKK.', 'K...K', '...K.', '..K..', '.....', '..K..'], EPAL, 13, 16);
    },
    control(p) {
      p.rect(3, 4, 26, 24, '#c0c0c0', '#000', '#000');
      [9, 16, 23].forEach((x, i) => {
        p.vl(x, 8, 25, '#000');
        const y = [11, 19, 14][i];
        p.rect(x - 2.5, y, 6, 4, ['#e02020', '#20a020', '#2060e0'][i], '#000');
      });
    },
    display(p) {
      p.rect(3, 3, 26, 19, '#c0c0c0', '#000', '#000');
      p.rect(6, 6, 20, 13, '#000', '#404040');
      ['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff'].forEach((c, i) => p.rect(7 + i * 3, 7, 3, 11, c));
      p.rect(11, 22, 10, 3, '#a0a0a0', '#000');
      p.rect(7, 25, 18, 4, '#c0c0c0', '#000', '#000');
    },
    sound(p, o = {}) {
      p.rect(4, 12, 7, 9, '#606060', '#000');
      p.poly([[10, 12], [19, 4], [19, 28], [10, 21]], '#a0a0a0', '#000');
      if (o.muted) { p.line(21, 10, 30, 22, '#e00000'); p.line(30, 10, 21, 22, '#e00000'); p.line(22, 10, 31, 22, '#e00000'); p.line(31, 10, 22, 22, '#e00000'); }
      else { p.ring(19, 16, 5, 6.4, '#000', (a) => a > 21); p.ring(19, 16, 9, 10.4, '#000', (a) => a > 22); }
    },
    mouse(p) {
      p.line(16, 1, 16, 6, '#000'); p.line(16, 1, 22, 0, '#000');
      p.ellipse(16, 18, 10, 12.5, '#ececec', '#000');
      p.hl(6.5, 25.5, 14, '#000'); p.vl(16, 6, 14, '#000');
      p.rect(7, 7, 8.5, 6.5, '#d0d0d0');
    },
    touchpad(p, o = {}) {
      p.rect(2, 5, 28, 22, o.on ? '#b8e0ff' : '#d8d8d8', '#000', '#000');
      p.hl(3, 29, 20, '#000'); p.vl(16, 20, 26, '#000');
      p.disc(12, 12, 3, '#ffcf3a', '#000');
    },
    find(p) {
      PXI.doc(p, { ink: '#808080' });
      p.ring(13, 13, 6, 8.6, '#000');
      p.disc(13, 13, 6.4, '#bfe8ff');
      p.dot(10.5, 10.5, '#ffffff');
      p.poly([[18, 17], [21, 16], [30, 26], [27, 29]], '#7a3f10', '#000');
    },
    run(p) {
      PXI.app(p, { body: '#ffffff' });
      p.poly([[10, 15], [22, 19.5], [10, 24]], '#00a000', '#004000');
    },
    shutdown(p) {
      p.rect(3, 3, 26, 19, '#c0c0c0', '#000', '#000');
      p.rect(6, 6, 20, 13, '#000040', '#404040');
      p.disc(16, 12.5, 5, '#ffe14a');
      p.disc(18.5, 11, 4.4, '#000040');
      if (p.big) { p.dot(9, 9, '#fff'); p.dot(23, 16, '#fff'); p.dot(22, 8, '#fff'); }
      p.rect(11, 22, 10, 3, '#a0a0a0', '#000');
      p.rect(7, 25, 18, 4, '#c0c0c0', '#000', '#000');
    },
    help(p) {
      p.rect(6, 2, 21, 27, '#2a6fdb', '#000', '#000');
      p.rect(8, 27, 18, 3, '#ffffff', '#000');
      p.vl(9, 3, 27, '#0a3a8a');
      if (p.big) p.map(['.WWWW.', 'WW..WW', '....WW', '...WW.', '..WW..', '..WW..', '......', '..WW..', '..WW..'], EPAL, 13, 9);
      else p.map(['WWW', '..W', '.W.', '...', '.W.'], EPAL, 7, 5);
    },
    trophy(p) {
      p.ring(8, 9.5, 3, 5, '#c08a00', (a) => a < 10);
      p.ring(24, 9.5, 3, 5, '#c08a00', (a) => a > 22);
      p.poly([[8, 3], [24, 3], [23, 12], [19, 17], [13, 17], [9, 12]], '#ffd23f', '#7a5a00');
      if (p.big) p.vl(12, 5, 13, '#fff7c0');
      p.rect(14, 17, 4, 5, '#c08a00', '#7a5a00');
      p.rect(10, 22, 12, 3, '#ffd23f', '#7a5a00');
      p.rect(8, 25, 16, 5, '#8b5a2b', '#3a2210');
    },
    lock(p) {
      p.ring(16, 12, 5, 7.5, '#808080', (a, b) => b < 14);
      p.rect(7, 13, 18, 15, '#ffd23f', '#7a5a00');
      p.rect(15, 18, 2, 5, '#000');
    },
    star(p) {
      const pts = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 6.5 : 14.5; pts.push([16 + Math.cos(a) * r, 17 + Math.sin(a) * r]); }
      p.poly(pts, '#ffd23f', '#806000');
    },
    clock(p) {
      p.disc(16, 16, 13.5, '#ffffff', '#000');
      p.vl(16, 7, 16.5, '#000'); p.hl(16, 22, 16, '#000');
      if (p.big) [[16, 4.5], [27.5, 16], [16, 27.5], [4.5, 16]].forEach(([x, y]) => p.dot(x, y, '#808080'));
    },
    die(p) {
      p.rect(4, 4, 24, 24, '#ffffff', '#000', '#000');
      p.hl(5.1, 27, 4 + 1.01 / p.k, '#ffffff');
      [[10, 10], [22, 10], [16, 16], [10, 22], [22, 22]].forEach(([x, y]) => p.disc(x, y, p.big ? 2.3 : 2.1, '#d00000'));
    },
    info(p) { p.disc(16, 16, 14, '#2a6fdb', '#00205a'); p.map(p.big ? ['WW', 'WW', '..', 'WW', 'WW', 'WW', 'WW', 'WW', 'WW', 'WW'] : ['W', '.', 'W', 'W', 'W'], EPAL, p.big ? 15 : 7, p.big ? 9 : 5); },
    warn(p) { p.poly([[16, 1.5], [31, 29], [1, 29]], '#ffd800', '#000'); p.map(p.big ? ['KK', 'KK', 'KK', 'KK', 'KK', 'KK', '..', 'KK', 'KK'] : ['K', 'K', 'K', '.', 'K'], EPAL, p.big ? 15 : 7, p.big ? 11 : 6); },
    question(p) {
      p.poly([[8, 24], [5, 31], [14, 26]], '#ffffff', '#000');
      p.ellipse(16, 14, 14, 12, '#ffffff', '#000');
      p.map(p.big ? ['.BBBB.', 'BB..BB', '....BB', '...BB.', '..BB..', '..BB..', '......', '..BB..'] : ['BBB', '..B', '.B.', '...', '.B.'], EPAL, p.big ? 13 : 7, p.big ? 7 : 4);
    },
    error(p) { p.disc(16, 16, 14, '#e01010', '#600000'); p.map(p.big ? ['WW....WW', 'WWW..WWW', '.WWWWWW.', '..WWWW..', '..WWWW..', '.WWWWWW.', 'WWW..WWW', 'WW....WW'] : ['W...W', '.W.W.', '..W..', '.W.W.', 'W...W'], EPAL, p.big ? 12 : 5, p.big ? 12 : 5); },
    door(p) {
      p.rect(7, 2, 18, 28, '#8b5a2b', '#2a1608', '#2a1608');
      if (p.big) { p.rect(10, 5, 12, 9, '#9c6a3a', '#5a3414'); p.rect(10, 17, 12, 9, '#9c6a3a', '#5a3414'); }
      p.disc(21, 17, 1.6, '#ffd23f');
    },
    box(p) {
      p.poly([[3, 12], [16, 7], [29, 12], [16, 17]], '#e8c48a', '#5a3c14');
      p.poly([[3, 12], [16, 17], [16, 30], [3, 25]], '#c9a26f', '#5a3c14');
      p.poly([[16, 17], [29, 12], [29, 25], [16, 30]], '#b88d58', '#5a3c14');
    },
    globe(p) {
      p.disc(16, 16, 13, '#2a6fdb', '#00205a');
      p.poly([[9, 8], [16, 6], [17, 12], [12, 15], [8, 13]], '#3ac43a');
      p.poly([[17, 17], [24, 15], [26, 21], [20, 26]], '#3ac43a');
      p.poly([[20, 3], [26, 3], [26, 8], [29, 8], [23, 14], [17, 8], [20, 8]], '#ffd23f', '#000');
    },
    zob(p) {
      if (p.big) { ZOB.draw(p.g, 4, 2); return; }
      p.map(['.........KK.....', '........KYYK....', '........KYYK....', '........K.......', '....KKKKKKKK....', '...KPPPPPPPPK...', '..KPPKKKKKPPPK..', '..KPKWWWWWKPPK..', '.KPPKWWEEWKPPPK.', '.KPPKWWEEWKPPPK.', '.KPPKWWWWWKPPPK.', '.KPPPKKKKKPPPPK.', '.KPCPPPPPPPPCPK.', '..KPPPKKKPPPPK..', '...KKPPPPPPKK...', '.....KKKKKK.....'], { K: '#1b1830', Y: '#ffcf3a', P: '#dc2f6c', W: '#fffdf6', E: '#1b1830', C: '#ff9ec4' }, 0, 0);
    },
    start(p) { PXI.zob(p); },
    desktop(p) { PXI.computer(p); },
    programs(p) { PXI.folder(p); p.rect(14, 15, 16, 13, '#c0c0c0', '#000'); p.rect(15, 16, 14, 3, '#000080'); },
    documents(p) { p.poly([[10, 2], [22, 2], [27, 7], [27, 25], [10, 25]], '#ffffff', '#000'); PXI.doc(p, {}); },
    settings(p) { PXI.control(p); },
    secrets(p) { PXI.trophy(p); },
    favs(p) { PXI.folder(p, { emb: 'star', tint: '#ffe066' }); },
    recent(p) { PXI.folder(p, { emb: 'clock', tint: '#c8d8ff' }); },
    nothing(p) { PXI.app(p, { body: '#e0e0e0', glyph: 'q' }); },
    keyboard(p) { p.rect(1, 9, 30, 15, '#c0c0c0', '#000', '#000'); for (let y = 12; y < 22; y += 4) for (let x = 4; x < 28; x += 4) p.rect(x, y, 3, 3, '#ffffff', '#606060'); },
    saver(p) { PXI.computer(p); p.rect(6, 5, 20, 14, '#000020', '#404040'); [[9, 8], [20, 9], [14, 14], [23, 15], [11, 16]].forEach(([x, y]) => p.dot(x, y, '#ffffff')); p.disc(17, 11, 2, '#dc2f6c'); },
    wallpaper(p) { PXI.display(p); },
    tray(p) { PXI.app(p); },
    shortcut(p) { p.rect(0, 22, 10, 10, '#ffffff', '#000'); p.map(p.big ? ['....KK', '...KKK', '..K.KK', '.K....', 'K.....'] : ['.KK', 'K.K', 'K..'], EPAL, p.big ? 2 : 1, p.big ? 24 : 12); },
    prompt(p) { p.rect(2, 5, 28, 23, '#c0c0c0', '#000', '#000'); p.rect(4, 7, 24, 4, '#000080'); p.rect(4, 13, 24, 13, '#000000', '#808080'); if (p.big) p.map(['W....', '.W...', '..W..', '.W...', 'W..WW'], EPAL, 7, 16); else p.hl(5, 12, 22, '#c0c0c0'); },
    back(p) { p.poly([[3, 16], [15, 4], [15, 11], [29, 11], [29, 21], [15, 21], [15, 28]], '#20a020', '#004000'); },
    fwd(p) { p.poly([[29, 16], [17, 4], [17, 11], [3, 11], [3, 21], [17, 21], [17, 28]], '#20a020', '#004000'); },
    upf(p) { PXI.folder(p); p.poly([[16, 13], [24, 21], [19, 21], [19, 27], [13, 27], [13, 21], [8, 21]], '#000000'); },
    views(p) { [[3, 3], [17, 3], [3, 17], [17, 17]].forEach(([x, y]) => { p.rect(x, y, 12, 12, '#ffffff', '#000'); p.rect(x + 3, y + 3, 6, 6, '#2a6fdb'); }); },
    coin(p) { p.disc(16, 16, 13, '#ffd23f', '#7a5a00'); p.disc(16, 16, 8.5, '#ffe680', '#c08a00'); if (p.big) p.map(['.KK.', 'K...', '.KK.', '...K', '.KK.'], { K: '#7a5a00' }, 14, 13); },
    dumbbell(p) { p.rect(8, 14, 16, 4, '#a0a0a0', '#000'); p.rect(3, 7, 6, 18, '#e02020', '#000'); p.rect(23, 7, 6, 18, '#e02020', '#000'); },
    gamepad(p) { p.ellipse(16, 18, 14, 9, '#c0c0c0', '#000'); p.rect(7, 14, 8, 2.5, '#202020'); p.rect(9.8, 11, 2.5, 8, '#202020'); p.disc(21, 15, 2, '#e02020'); p.disc(25, 19, 2, '#2060e0'); }
  };
  const SMALL_EMB = { star: ['.Y.', 'YYY', 'Y.Y'], clock: ['KKK', 'KWK', 'KKK'] };
  function px(name, size = 32, opt) {
    const key = `${name}:${size}:${opt ? JSON.stringify(opt) : ''}`;
    if (PXC.has(key)) return PXC.get(key);
    const p = painter(size);
    const fn = PXI[name] || PXI.app;
    try { fn(p, opt || {}); } catch {}
    const url = p.c.toDataURL();
    PXC.set(key, url);
    return url;
  }
  function folderIcon(tag, size = 32) {
    return px('folder', size, { emb: tag, tint: FOLDER_TINT[tag] || '#f6d55c' });
  }
  function overlayShortcut(url, size) {
    const key = `lnk:${url.length}:${url.slice(-40)}:${size}`;
    if (PXC.has(key)) return Promise.resolve(PXC.get(key));
    return new Promise((res) => {
      const img = new Image();
      img.onload = () => {
        const c = canvas(size), g = c.getContext('2d');
        g.drawImage(img, 0, 0, size, size);
        g.drawImage(Object.assign(new Image(), { src: px('shortcut', size) }), 0, 0);
        const out = c.toDataURL(); PXC.set(key, out); res(out);
      };
      img.onerror = () => res(url);
      img.src = url;
    });
  }

  const PAL256 = (() => {
    const out = [];
    for (let r = 0; r < 6; r++) for (let g = 0; g < 6; g++) for (let b = 0; b < 6; b++) out.push([r * 51, g * 51, b * 51]);
    [[128, 0, 0], [0, 128, 0], [128, 128, 0], [0, 0, 128], [128, 0, 128], [0, 128, 128], [192, 192, 192], [128, 128, 128]].forEach((c) => out.push(c));
    for (let i = 1; i <= 24 && out.length < 256; i++) { const v = Math.round(i * 10.2); out.push([v, v, v]); }
    return out;
  })();
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const nearest = (r, g, b) => {
    let best = 0, bd = 1e9;
    for (let i = 0; i < PAL256.length; i++) {
      const c = PAL256[i];
      const d = (c[0] - r) * (c[0] - r) * 0.3 + (c[1] - g) * (c[1] - g) * 0.59 + (c[2] - b) * (c[2] - b) * 0.11;
      if (d < bd) { bd = d; best = i; }
    }
    return PAL256[best];
  };
  function quantize(c) {
    const g = c.getContext('2d');
    const d = g.getImageData(0, 0, c.width, c.height);
    const a = d.data, w = c.width;
    for (let i = 0; i < a.length; i += 4) {
      const p = i / 4, x = p % w, y = (p / w) | 0;
      const t = (BAYER[(y & 3) * 4 + (x & 3)] / 16 - 0.5) * 34;
      const [r, gg, b] = nearest(Math.max(0, Math.min(255, a[i] + t)), Math.max(0, Math.min(255, a[i + 1] + t)), Math.max(0, Math.min(255, a[i + 2] + t)));
      a[i] = r; a[i + 1] = gg; a[i + 2] = b; a[i + 3] = 255;
    }
    g.putImageData(d, 0, 0);
  }
  const GIC = new Map();
  const queue = [];
  let running = 0;
  function pump() {
    while (running < 4 && queue.length) {
      const job = queue.shift();
      running++;
      job().finally(() => { running--; pump(); });
    }
  }
  function gameIcon(gslug, size = 32) {
    const key = `${gslug}:${size}`;
    if (GIC.has(key)) return GIC.get(key);
    const pr = new Promise((resolve) => {
      queue.push(() => new Promise((done) => {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => {
          try {
            const full = document.createElement('canvas');
            full.width = 400; full.height = 300;
            full.getContext('2d').drawImage(img, 0, 0, 400, 300);
            const big = canvas(96), bg = big.getContext('2d');
            bg.imageSmoothingQuality = 'high';
            const s = 252;
            bg.drawImage(full, (400 - s) / 2, (300 - s) / 2, s, s, 0, 0, 96, 96);
            const mid = canvas(48), mg = mid.getContext('2d');
            mg.imageSmoothingQuality = 'high'; mg.drawImage(big, 0, 0, 48, 48);
            const inner = size - 2;
            const sm = canvas(inner), sg = sm.getContext('2d');
            sg.imageSmoothingQuality = 'high'; sg.drawImage(size >= 32 ? mid : mid, 0, 0, inner, inner);
            quantize(sm);
            const out = canvas(size), og = out.getContext('2d');
            og.fillStyle = '#000'; og.fillRect(0, 0, size, size);
            og.drawImage(sm, 1, 1);
            og.fillStyle = 'rgba(255,255,255,.55)'; og.fillRect(1, 1, inner, 1); og.fillRect(1, 1, 1, inner);
            og.fillStyle = 'rgba(0,0,0,.35)'; og.fillRect(1, size - 2, inner, 1); og.fillRect(size - 2, 1, 1, inner);
            resolve(out.toDataURL());
          } catch { resolve(px('app', size)); }
          done();
        };
        img.onerror = () => { resolve(px('app', size)); done(); };
        img.src = `${root}games/${gslug}/thumb.svg`;
      }));
      pump();
    });
    GIC.set(key, pr);
    return pr;
  }

  function parseLabel(label) {
    const raw = String(label).replace(/&&/g, '\u0001');
    const i = raw.indexOf('&');
    const back = (t) => esc(t.replace(/\u0001/g, '&'));
    if (i < 0) return { html: back(raw), key: '', text: raw.replace(/\u0001/g, '&') };
    const k = raw[i + 1] || '';
    return { html: `${back(raw.slice(0, i))}<u>${back(k)}</u>${back(raw.slice(i + 2))}`, key: k.toLowerCase(), text: (raw.slice(0, i) + raw.slice(i + 1)).replace(/\u0001/g, '&') };
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  const Menus = (() => {
    const stack = [];
    let outsideBound = false;
    function onOutside(e) {
      if (!stack.length) return;
      if (stack.some((m) => m.el.contains(e.target))) return;
      if (stack[0].opener && stack[0].opener.contains(e.target)) return;
      closeAll();
    }
    function bind() {
      if (outsideBound) return;
      outsideBound = true;
      document.addEventListener('pointerdown', onOutside, true);
      window.addEventListener('blur', () => { if (stack.length && !document.hasFocus()) closeAll(); });
      window.addEventListener('resize', () => closeAll());
    }
    function closeFrom(level, refocus) {
      while (stack.length > level) {
        const m = stack.pop();
        clearTimeout(m.hoverT);
        m.el.remove();
        m.parentItem?.classList.remove('is-open');
        m.parentItem?.setAttribute('aria-expanded', 'false');
        if (stack.length === 0) {
          m.opts.onClose?.();
          if (refocus && m.opener?.isConnected) m.opener.focus({ preventScroll: true });
        }
      }
      if (refocus && stack.length) stack[stack.length - 1].focusItem?.();
    }
    function closeAll(refocus) { closeFrom(0, refocus); }
    function place(el, opts) {
      const B = area();
      el.style.maxHeight = `${Math.max(120, B.bottom - B.top - (opts.reserve || 0) - 8)}px`;
      const r = el.getBoundingClientRect();
      const W = B.right, H = B.bottom - (opts.reserve || 0), L = B.left + 2, T = B.top + 2;
      let x = opts.x ?? 0, y = opts.y ?? 0;
      const a = opts.anchor;
      if (a && opts.side === 'right') {
        x = a.right - 3; y = a.top - 3;
        if (x + r.width > W - 2) x = a.left - r.width + 3;
        if (x < L) x = Math.max(L, Math.min(W - r.width - 2, a.left + 16));
        if (y + r.height > H - 2) y = Math.max(T, H - r.height - 2);
      } else if (a && opts.side === 'up') {
        x = a.left; y = a.top - r.height;
        if (y < T) y = T;
        if (x + r.width > W - 2) x = Math.max(L, W - r.width - 2);
      } else if (a) {
        x = a.left; y = a.bottom;
        if (y + r.height > H - 2) y = a.top - r.height >= T ? a.top - r.height : Math.max(T, H - r.height - 2);
        if (x + r.width > W - 2) x = Math.max(L, W - r.width - 2);
      } else {
        if (x + r.width > W - 2) x = Math.max(L, x - r.width);
        if (y + r.height > H - 2) y = Math.max(T, y - r.height);
        x = Math.max(L, x); y = Math.max(T, y);
      }
      el.style.left = `${Math.round(x)}px`;
      el.style.top = `${Math.round(y)}px`;
    }
    function open(items, opts = {}) {
      bind();
      const level = opts.level || 0;
      closeFrom(level);
      if (typeof items === 'function') items = items();
      const el = document.createElement('div');
      el.className = `z-menu z98${opts.big ? ' is-big' : ''}${opts.className ? ` ${opts.className}` : ''}`;
      el.setAttribute('role', 'menu');
      if (opts.label) el.setAttribute('aria-label', opts.label);
      el.tabIndex = -1;
      if (opts.banner) el.insertAdjacentHTML('afterbegin', `<div class="z-menu__banner" aria-hidden="true"><span>${opts.banner}</span></div>`);
      const list = document.createElement('div');
      list.className = 'z-menu__list';
      el.append(list);
      const rec = { el, opts, level, opener: opts.opener, parentItem: opts.parentItem, items: [] };
      if (!items.length) list.insertAdjacentHTML('beforeend', '<div class="z-menu__empty">(Empty)</div>');
      items.forEach((it) => {
        if (!it) return;
        if (it.sep) { const s = document.createElement('div'); s.className = 'z-menu__sep'; s.setAttribute('role', 'separator'); list.append(s); return; }
        const b = document.createElement('button');
        b.type = 'button';
        const lab = parseLabel(it.label || '');
        b.className = `z-menu__item${it.icon ? ' has-icon' : ''}${it.sub ? ' has-sub' : ''}`;
        b.setAttribute('role', it.radio ? 'menuitemradio' : it.checked != null ? 'menuitemcheckbox' : 'menuitem');
        if (it.checked != null) b.setAttribute('aria-checked', String(!!it.checked));
        if (it.sub) { b.setAttribute('aria-haspopup', 'menu'); b.setAttribute('aria-expanded', 'false'); }
        if (it.disabled) b.setAttribute('aria-disabled', 'true');
        if (it.title) b.title = it.title;
        if (it.id) b.dataset.id = it.id;
        b.tabIndex = -1;
        b.innerHTML = `<span class="z-menu__mark" aria-hidden="true"></span>${it.icon ? `<img class="z-menu__icon" alt="" src="${it.icon}">` : '<span></span>'}<span class="z-menu__label">${lab.html}</span><span class="z-menu__accel">${it.accel ? esc(it.accel) : ''}</span><span class="z-menu__sub" aria-hidden="true"></span>`;
        if (it.iconAsync) it.iconAsync.then((u) => { const im = b.querySelector('.z-menu__icon'); if (im) im.src = u; });
        b._it = it; b._key = lab.key || (lab.text || it.label || '').replace('&', '').trim()[0]?.toLowerCase();
        list.append(b);
        rec.items.push(b);
        b.addEventListener('pointerenter', () => {
          if (b.getAttribute('aria-disabled') === 'true') { b.focus({ preventScroll: true }); closeFrom(level + 1); return; }
          b.focus({ preventScroll: true });
          clearTimeout(rec.hoverT);
          rec.hoverT = setTimeout(() => { if (it.sub) openSub(rec, b); else closeFrom(level + 1); }, it.sub ? 180 : 250);
        });
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          if (it.disabled) { sfx('tap'); return; }
          if (it.sub) { clearTimeout(rec.hoverT); openSub(rec, b, true); return; }
          activate(it);
        });
      });
      document.body.append(el);
      place(el, opts);
      stack.push(rec);
      rec.focusItem = () => { (document.activeElement && el.contains(document.activeElement) ? document.activeElement : rec.items[0])?.focus({ preventScroll: true }); };
      el.addEventListener('keydown', (e) => keys(e, rec));
      if (opts.focus !== false) requestAnimationFrame(() => { if (opts.focusLast) rec.items[rec.items.length - 1]?.focus({ preventScroll: true }); else rec.items[0]?.focus({ preventScroll: true }); });
      else el.focus({ preventScroll: true });
      return rec;
    }
    function openSub(rec, b, focusFirst) {
      if (b.classList.contains('is-open') && stack[rec.level + 1]) { if (focusFirst) stack[rec.level + 1].items[0]?.focus(); return; }
      closeFrom(rec.level + 1);
      b.classList.add('is-open');
      b.setAttribute('aria-expanded', 'true');
      const sub = b._it.sub;
      const r = b.getBoundingClientRect();
      open(typeof sub === 'function' ? sub() : sub, { anchor: r, side: 'right', level: rec.level + 1, parentItem: b, focus: !!focusFirst, reserve: rec.opts.reserve, className: rec.opts.subClass || '' });
    }
    function activate(it) {
      closeAll();
      sfx('menu');
      setTimeout(() => it.action?.(), 0);
    }
    function keys(e, rec) {
      const items = rec.items;
      const i = items.indexOf(document.activeElement);
      const move = (d) => { const n = items.length; if (!n) return; let j = i; for (let k = 0; k < n; k++) { j = (j + d + n) % n; if (items[j]) break; } items[j].focus({ preventScroll: true }); };
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Home') { e.preventDefault(); items[0]?.focus(); }
      else if (e.key === 'End') { e.preventDefault(); items[items.length - 1]?.focus(); }
      else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const b = items[i];
        if (b?._it.sub && !b._it.disabled) openSub(rec, b, true);
        else stack[0].opts.onSide?.(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (rec.level > 0) { const pi = rec.parentItem; closeFrom(rec.level); pi?.focus(); }
        else stack[0].opts.onSide?.(-1);
      } else if (e.key === 'Escape') {
        e.preventDefault(); e.stopPropagation();
        if (rec.level > 0) { const pi = rec.parentItem; closeFrom(rec.level); pi?.focus(); }
        else closeAll(true);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        items[i]?.click();
      } else if (e.key === 'Tab') {
        e.preventDefault(); closeAll(true);
      } else if (e.key.length === 1 && /\S/.test(e.key)) {
        const k = e.key.toLowerCase();
        const hits = items.filter((b) => b._key === k);
        if (hits.length === 1) { e.preventDefault(); hits[0].focus(); hits[0].click(); }
        else if (hits.length > 1) { e.preventDefault(); const j = hits.indexOf(items[i]); hits[(j + 1) % hits.length].focus(); }
      }
    }
    return { open, closeAll, get isOpen() { return stack.length > 0; }, get top() { return stack[0]; } };
  })();

  function menubar(container, menus, opts = {}) {
    const bar = document.createElement('div');
    bar.className = 'z-menubar';
    bar.setAttribute('role', 'menubar');
    if (opts.label) bar.setAttribute('aria-label', opts.label);
    const buttons = [];
    let openIdx = -1;
    menus.forEach((m, idx) => {
      if (!m) return;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'z-menubar__item';
      b.setAttribute('role', 'menuitem');
      b.setAttribute('aria-haspopup', 'menu');
      b.setAttribute('aria-expanded', 'false');
      const lab = parseLabel(m.label);
      b.innerHTML = lab.html;
      b._key = lab.key;
      b.tabIndex = idx === 0 ? 0 : -1;
      b.addEventListener('pointerdown', (e) => e.stopPropagation());
      b.addEventListener('click', (e) => { if (openIdx === buttons.indexOf(b)) { Menus.closeAll(); return; } show(buttons.indexOf(b), e.detail === 0); });
      b.addEventListener('pointerenter', () => { if (openIdx >= 0 && openIdx !== buttons.indexOf(b) && Menus.isOpen) show(buttons.indexOf(b), false); });
      b.addEventListener('keydown', (e) => {
        const j = buttons.indexOf(b);
        if (e.key === 'ArrowRight') { e.preventDefault(); buttons[(j + 1) % buttons.length].focus(); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); buttons[(j - 1 + buttons.length) % buttons.length].focus(); }
        else if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(j, true); }
        else if (e.key === 'Escape') { b.blur(); opts.onEscape?.(); }
      });
      b._menu = m;
      buttons.push(b);
      bar.append(b);
    });
    function show(j, focus) {
      const b = buttons[j];
      if (!b) return;
      buttons.forEach((x) => x.setAttribute('aria-expanded', 'false'));
      b.setAttribute('aria-expanded', 'true');
      openIdx = j;
      sfx('menu');
      Menus.open(b._menu.items, {
        anchor: b.getBoundingClientRect(), opener: b, focus, label: b.textContent,
        reserve: opts.reserve || 0,
        onClose: () => { b.setAttribute('aria-expanded', 'false'); if (openIdx === j) openIdx = -1; },
        onSide: (d) => { const k = (j + d + buttons.length) % buttons.length; show(k, true); }
      });
    }
    container.append(bar);
    return {
      el: bar, buttons,
      open(key) { const j = buttons.findIndex((b) => b._key === key); if (j >= 0) { show(j, true); return true; } return false; },
      focus() { buttons[0]?.focus(); },
      openFirst() { show(0, true); }
    };
  }

  let tipEl = null, tipT = 0;
  function tooltip(el, text) {
    el.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'touch') return;
      clearTimeout(tipT);
      tipT = setTimeout(() => {
        const t = typeof text === 'function' ? text() : text;
        if (!t || !el.isConnected) return;
        tipEl?.remove();
        tipEl = document.createElement('div');
        tipEl.className = 'z-tip';
        tipEl.setAttribute('role', 'tooltip');
        tipEl.textContent = t;
        document.body.append(tipEl);
        const r = el.getBoundingClientRect(), tr = tipEl.getBoundingClientRect();
        let x = Math.min(innerWidth - tr.width - 4, Math.max(4, r.left + r.width / 2 - tr.width / 2));
        let y = r.bottom + 6; if (y + tr.height > innerHeight - 4) y = r.top - tr.height - 6;
        tipEl.style.left = `${x}px`; tipEl.style.top = `${y}px`;
      }, 600);
    });
    const hide = () => { clearTimeout(tipT); tipEl?.remove(); tipEl = null; };
    el.addEventListener('pointerleave', hide);
    el.addEventListener('pointerdown', hide);
  }

  function tell(msg) { try { window.parent.postMessage(msg, location.origin); } catch {} }

  const SECRETS = [
    ['konami', 'Up, up, down, down', 'Typed an old cheat code on the desktop.'],
    ['poke', 'Hello, Zob', 'Clicked the little desktop helper.'],
    ['dizzy', 'Room is spinning', 'Poked Zob until everything went round.'],
    ['sleepy', 'Shh, he is asleep', 'Sat still long enough for Zob to nod off.'],
    ['night', 'Night owl', 'Booted Zoble between midnight and five.'],
    ['early', 'Early bird', 'Booted Zoble before seven in the morning.'],
    ['wardrobe', 'Wardrobe change', 'Tried on every colour scheme.'],
    ['bottom', 'Rock bottom', 'Scrolled to the very end of a folder.'],
    ['whoosh', 'Whoosh', 'Flung a window across the desktop.'],
    ['nothing', 'It does nothing', 'Kept running the program that does nothing.'],
    ['composer', 'Z, O, B, L, E', 'Played the Start menu banner like a xylophone.'],
    ['answer', 'Don\'t panic', 'Asked Find for the answer to everything.'],
    ['snoop', 'Snoop', 'Found the back room.'],
    ['lights', 'Lights on', 'Pulled the chain in the back room.'],
    ['trail', 'Ghost pointers', 'Turned on pointer trails.'],
    ['regular', 'Regular', 'Booted Zoble ten times. Hello again.'],
    ['explorer', 'Explorer', 'Tried ten different things.'],
    ['drawer', 'Completionist', 'Tried everything in one folder.'],
    ['misprint', 'Time warp', 'Triple-clicked the clock.'],
    ['console', 'Hello, developer', 'Said hi to Zob in the console.'],
    ['lost', 'Lost and found', 'Went looking for something you lost.'],
    ['missed', 'Zob missed you', 'Wandered off to another tab and came back.'],
    ['roller', 'High roller', 'Let the die pick a game five times.'],
    ['peek', 'Hide and seek', 'Found Zob hiding behind a desktop icon.'],
    ['coin', 'Insert coin', 'Fed the Arcade folder three coins in a row.'],
    ['gains', 'Do you even lift', 'Lifted the Noggin Gym dumbbell ten times.'],
    ['switch', 'Two minds', 'Flipped a game between Simple and Advanced.'],
    ['tickle', 'Ticklish', 'Kept the pointer on Zob until he giggled.'],
    ['shutdown', 'It is now safe', 'Shut Zoble down and saw the orange letters.'],
    ['bin', 'Bin diving', 'Tried to empty the Recycle Bin.'],
    ['saver', 'Screen saved', 'Watched the screen saver kick in.'],
    ['juggler', 'Juggler', 'Had five windows open at once.'],
    ['prompt', 'Command line hero', 'Typed a command into the Zoble Prompt.'],
    ['lamp', 'Lights out', 'Clicked the desk lamp and changed the mood.'],
    ['coffee', 'Caffeinated', 'Took five sips from Zob\'s mug.'],
    ['plant', 'Green thumb', 'Watered the plant on Zob\'s desk.'],
    ['notes', 'Sticky fingers', 'Read every sticky note on the monitor.'],
    ['power', 'Off and on again', 'Pressed the power button on the monitor.'],
    ['bird', 'Bird watcher', 'Waved at the bird outside the window.']
  ];
  const BOOK = {
    konami: 'An old cheat code. Arrows, then two letters.', poke: 'Say hello to the little guy.', dizzy: 'Say hello. A lot. Quickly.',
    sleepy: 'Sit very, very still.', night: 'Come back when the moon is out.', early: 'Come back before breakfast.',
    wardrobe: 'Try on every colour scheme.', bottom: 'How far down does a folder go?', whoosh: 'Throw a window. Gently.',
    nothing: 'Something on the desktop does nothing.', composer: 'The Start menu has a banner. It hums.', answer: 'Ask Find the big question.',
    snoop: 'Every bin has a back door.', lights: 'It is dark back there. Find the chain.', trail: 'Pointers can leave ghosts.',
    regular: 'Keep coming back.', explorer: 'Try ten different things.', drawer: 'Empty a whole folder.',
    misprint: 'The clock is a little loose.', console: 'Developers have their own way in.', lost: 'Lost something? Look for it.',
    missed: 'Leave, then come back.', roller: 'Let the die decide. Often.', peek: 'Someone is hiding behind an icon.',
    coin: 'The arcade takes coins. Quickly.', gains: 'The gym has equipment. Use it.', switch: 'Some games have two minds.', tickle: 'Hover where it tickles.',
    shutdown: 'Everything has to sleep sometime.', bin: 'Try to take the rubbish out.', saver: 'Leave the desktop alone for a while.',
    juggler: 'Open, open, open, open, open.', prompt: 'Run the prompt and type something.',
    lamp: 'Every desk has a lamp. Every lamp has a switch.', coffee: 'Zob left his coffee out. Have a sip. Or five.', plant: 'Plants get thirsty too.',
    notes: 'Someone has been leaving notes on the monitor.', power: 'Every monitor has a button. Every button wants pressing.', bird: 'Look out of the window. Someone is visiting.'
  };
  function unlock(id) {
    const got = store.get('hub:secrets', {});
    if (got[id] || !SECRETS.some((s) => s[0] === id)) return false;
    got[id] = Date.now();
    store.set('hub:secrets', got);
    const s = SECRETS.find((x) => x[0] === id);
    setTimeout(() => sticker(s[1], s[2]), 60);
    window.dispatchEvent(new CustomEvent('curio:secret', { detail: id }));
    return true;
  }
  const found = () => store.get('hub:secrets', {});
  function sticker(title, text) {
    if (framed) { tell({ zoble: 'balloon', title: `Secret found: ${title}`, text, icon: 'trophy' }); return; }
    sfx('success');
    balloon(text, { title: `Secret found: ${title}`, icon: 'trophy', ms: 4200 });
  }

  let toastEl = null, toastTimer = 0;
  function balloon(text, { title = '', icon: ic = '', ms = 2200 } = {}) {
    if (!toastEl || !toastEl.isConnected) {
      toastEl = document.createElement('div');
      toastEl.className = 'curio-toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      host().append(toastEl);
    }
    toastEl.innerHTML = `${title ? `<div class="curio-toast__title">${ic ? `<img alt="" src="${px(ic, 16)}">` : ''}<span></span></div>` : ''}<div class="curio-toast__body"></div>`;
    if (title) toastEl.querySelector('.curio-toast__title span').textContent = title;
    toastEl.querySelector('.curio-toast__body').textContent = text;
    toastEl.classList.remove('is-on');
    void toastEl.offsetWidth;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), Math.min(ms, 6000));
  }
  function toast(text, ms = 1800) { balloon(String(text), { ms }); }

  const ERR = /[💀💥❌😵💣☠🚫⛔😭😢🙈💔😬🪦]/u;
  const WARN = /[⚠❗‼🚨🔥⏰⌛⏳]/u;
  const ASK = /[❓🤔❔🤷]/u;
  function dialogKind(emoji, title, buttons, kind) {
    if (kind) return kind;
    if (emoji && ERR.test(emoji)) return 'error';
    if (emoji && WARN.test(emoji)) return 'warn';
    if (emoji && ASK.test(emoji)) return 'question';
    const t = `${title}`.toLowerCase();
    if (/game over|crash|you lose|you lost|wrong|failed|oops|busted/.test(t)) return 'warn';
    if (/\?\s*$/.test(t) && buttons.length > 1) return 'question';
    return 'info';
  }
  function windowFrame({ title, iconUrl, controls = ['close'], cls = '' }) {
    const box = document.createElement('div');
    box.className = `window ${cls}`;
    box.innerHTML = `<div class="title-bar"><div class="title-bar-text">${iconUrl ? `<img class="curio-bar__icon" alt="" src="${iconUrl}">` : ''}<span></span></div><div class="title-bar-controls">${controls.map((c) => `<button type="button" class="${c}" aria-label="${c === 'close' ? 'Close' : c === 'help' ? 'Help' : c === 'minimize' ? 'Minimize' : 'Maximize'}"></button>`).join('')}</div></div>`;
    box.querySelector('.title-bar-text span').textContent = title;
    box.querySelectorAll('.title-bar-controls button').forEach((b) => b.addEventListener('pointerdown', (e) => e.stopPropagation()));
    return box;
  }
  function draggable(box, handle) {
    let sx = 0, sy = 0, ox = 0, oy = 0;
    drag(handle, {
      start: (p) => { sx = p.clientX; sy = p.clientY; ox = box._dx || 0; oy = box._dy || 0; },
      move: (p) => {
        const r = box.getBoundingClientRect();
        let dx = ox + p.clientX - sx, dy = oy + p.clientY - sy;
        const bx = r.left - (box._dx || 0), by = r.top - (box._dy || 0);
        dx = Math.max(-bx - r.width + 60, Math.min(innerWidth - bx - 60, dx));
        dy = Math.max(-by, Math.min(innerHeight - by - 24, dy));
        box._dx = dx; box._dy = dy;
        box.style.transform = `translate(${dx}px, ${dy}px)`;
      }
    });
  }
  function trapTab(e, scope) {
    if (e.key !== 'Tab') return;
    const f = [...scope.querySelectorAll('button, input, select, textarea, a[href], [tabindex="0"]')].filter((x) => !x.disabled && x.offsetParent);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function modal({ emoji = '', title = '', body = '', buttons = [{ label: 'Play again', value: 'again' }], wide = false, icon: kind = '', caption = '' } = {}) {
    if (!buttons || !buttons.length) buttons = [{ label: 'OK', value: 'ok' }];
    return new Promise((resolve) => {
      const wrap = document.createElement('div');
      wrap.className = 'curio-modal z98';
      const k = dialogKind(emoji, title, buttons, kind);
      const cap = caption || (game ? game.title : document.body?.dataset.title || 'Zoble');
      const box = windowFrame({ title: cap, controls: ['close'], cls: 'curio-modal__box' });
      box.setAttribute('role', k === 'error' || k === 'warn' ? 'alertdialog' : 'dialog');
      box.setAttribute('aria-modal', 'true');
      if (wide) box.classList.add('is-wide');
      const bodyEl = document.createElement('div');
      bodyEl.className = 'window-body';
      const showEmoji = emoji && k === 'info';
      bodyEl.innerHTML = `<div class="curio-modal__main"><div class="curio-modal__ico" aria-hidden="true">${showEmoji ? '' : `<img alt="" src="${px(k, 32)}">`}</div><div class="curio-modal__text"><div class="curio-modal__title"></div><div class="curio-modal__body"></div></div></div><div class="curio-modal__btns"></div>`;
      if (showEmoji) bodyEl.querySelector('.curio-modal__ico').textContent = emoji;
      const tEl = bodyEl.querySelector('.curio-modal__title');
      tEl.textContent = title;
      if (!title) tEl.remove();
      const b = bodyEl.querySelector('.curio-modal__body');
      if (body instanceof Node) { b.append(body); bodyEl.querySelector('.curio-modal__main').style.display = 'block'; bodyEl.querySelector('.curio-modal__ico').style.display = 'none'; }
      else b.textContent = body;
      const id = `cm${Math.random().toString(36).slice(2, 8)}`;
      tEl.id = id; if (title) box.setAttribute('aria-labelledby', id);
      box.append(bodyEl);
      const row = bodyEl.querySelector('.curio-modal__btns');
      let done = false;
      const finish = (v) => {
        if (done) return; done = true;
        document.removeEventListener('keydown', onKey, true);
        wrap.remove();
        resolve(v);
      };
      buttons.forEach((btn, i) => {
        const el = document.createElement('button');
        el.type = 'button';
        if (i === 0) el.className = 'default';
        el.textContent = btn.label;
        el.addEventListener('click', () => { sfx('click'); finish(btn.value); });
        row.append(el);
      });
      const cancelValue = buttons[buttons.length - 1].value;
      box.querySelector('.title-bar-controls .close').addEventListener('click', () => { sfx('click'); finish(cancelValue); });
      const onKey = (e) => {
        if (!wrap.isConnected) return;
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finish(cancelValue); }
        else if (e.key === 'Enter' && document.activeElement?.tagName !== 'BUTTON' && !(document.activeElement instanceof HTMLInputElement)) { e.preventDefault(); finish(buttons[0].value); }
        else trapTab(e, box);
      };
      document.addEventListener('keydown', onKey, true);
      wrap.append(box);
      host().append(wrap);
      draggable(box, box.querySelector('.title-bar'));
      sfx(k === 'error' ? 'critical' : k === 'warn' ? 'chord' : k === 'question' ? 'question' : 'ding');
      row.querySelector('button')?.focus();
    });
  }

  function confetti(count = 120) {
    if (calm()) return;
    const c = document.createElement('canvas');
    c.className = 'curio-confetti';
    const scale = 3;
    c.width = Math.ceil(innerWidth / scale); c.height = Math.ceil(innerHeight / scale);
    c.style.width = '100%'; c.style.height = '100%';
    document.body.append(c);
    const g = c.getContext('2d');
    const colors = ['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ffffff', '#ff8000'];
    const W = c.width, H = c.height;
    const bits = Array.from({ length: count }, () => ({
      x: W / 2 + (Math.random() - .5) * 70, y: H * .35,
      vx: (Math.random() - .5) * 5, vy: -Math.random() * 4.6 - 1.4,
      s: Math.random() < .3 ? 2 : 1, ph: Math.random() * 6,
      c: colors[(Math.random() * colors.length) | 0]
    }));
    let frames = 0;
    (function tick() {
      g.clearRect(0, 0, W, H);
      for (const p of bits) {
        p.vy += .12; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.ph += .3;
        g.fillStyle = p.c;
        const w = Math.sin(p.ph) > 0 ? p.s + 1 : p.s;
        g.fillRect(Math.round(p.x), Math.round(p.y), w, p.s + 1);
      }
      if (++frames < 190) requestAnimationFrame(tick); else c.remove();
    })();
  }

  let trailOn = false, trailN = 0;
  function onTrail(e) {
    if (e.pointerType === 'touch') return;
    if (++trailN % 3) return;
    const d = document.createElement('i');
    d.className = 'curio-trail';
    d.style.left = `${e.clientX}px`; d.style.top = `${e.clientY}px`;
    document.body.append(d);
    setTimeout(() => d.remove(), 460);
  }
  function trail(on = !trailOn) {
    on = !!on;
    if (on === trailOn) return trailOn;
    trailOn = on;
    window[trailOn ? 'addEventListener' : 'removeEventListener']('pointermove', onTrail);
    return trailOn;
  }

  function best(key, score, higherIsBetter = true) {
    const k = `best:${slug || 'hub'}:${key}`;
    const prev = store.get(k, null);
    const isNew = prev == null || (higherIsBetter ? score > prev : score < prev);
    if (isNew) store.set(k, score);
    return { best: isNew ? score : prev, isNew };
  }
  const getBest = (key) => store.get(`best:${slug || 'hub'}:${key}`, null);

  function drag(el, { start, move, end } = {}) {
    let active = null;
    let latched = false;
    let downAt = null;
    let moved = false;
    const at = (e) => {
      const r = el.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top, clientX: e.clientX, clientY: e.clientY, pressure: e.pressure || 0.5, pointerType: e.pointerType, event: e };
    };
    const finish = (e) => {
      if (active == null) return;
      active = null;
      latched = false;
      el.classList.remove('curio-latched');
      end?.(e ? at(e) : null);
    };
    const onDown = (e) => {
      if (e.button != null && e.button > 0) return;
      if (latched) { e.preventDefault(); finish(e); return; }
      active = e.pointerId;
      downAt = { x: e.clientX, y: e.clientY };
      moved = false;
      try { el.setPointerCapture(e.pointerId); } catch {}
      start?.(at(e));
    };
    const onMove = (e) => {
      if (latched) { move?.(at(e)); return; }
      if (active !== e.pointerId) return;
      if (downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 6) moved = true;
      move?.(at(e));
    };
    const onUp = (e) => {
      if (active !== e.pointerId || latched) return;
      if (touchpad && e.pointerType === 'mouse' && !moved) {
        latched = true;
        el.classList.add('curio-latched');
        try { el.releasePointerCapture(e.pointerId); } catch {}
        return;
      }
      finish(e);
    };
    const onOutside = (e) => { if (latched && !el.contains(e.target)) finish(null); };
    const onKey = (e) => { if (e.key === 'Escape' && latched) finish(null); };
    const onBlur = () => { if (latched) finish(null); };
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('keydown', onKey);
    window.addEventListener('blur', onBlur);
    window.addEventListener('pointerdown', onOutside, true);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('pointerdown', onOutside, true);
    };
  }

  const settingsTabs = [];
  let sheet = null, sheetReturn = null;
  function closeSettings() {
    if (!sheet) return;
    const s = sheet; sheet = null;
    sfx('close');
    s.classList.remove('is-open');
    s.remove();
    document.removeEventListener('keydown', sheetKeys, true);
    sheetReturn?.focus?.();
    window.dispatchEvent(new CustomEvent('curio:settings', { detail: false }));
  }
  function sheetKeys(e) {
    if (!sheet) return;
    if (e.key === 'Escape' && !Menus.isOpen) { e.preventDefault(); e.stopPropagation(); closeSettings(); return; }
    trapTab(e, sheet);
  }
  const radio = (name, value, label, checked, extra = '') => { const id = `r${Math.random().toString(36).slice(2, 8)}`; return `<span class="curio-opt"><input type="radio" id="${id}" name="${name}" value="${value}" ${checked ? 'checked' : ''} ${extra}><label for="${id}">${label}</label></span>`; };
  const check = (key, label, checked, hint = '') => { const id = `c${Math.random().toString(36).slice(2, 8)}`; return `<span class="curio-opt"><input type="checkbox" id="${id}" data-key="${key}" ${checked ? 'checked' : ''}><label for="${id}">${label}</label>${hint ? `<small>${hint}</small>` : ''}</span>`; };
  function openSettings(from, opts = {}) {
    if (sheet) { closeSettings(); }
    sheetReturn = from instanceof Element ? from : document.activeElement;
    sfx('open');
    const wrap = document.createElement('div');
    wrap.className = 'curio-sheet z98 is-open';
    wrap.setAttribute('open', '');
    const box = windowFrame({ title: 'Control Panel', iconUrl: px('control', 16), controls: ['help', 'close'], cls: 'curio-sheet__panel' });
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Zoble Control Panel');
    const tabs = [
      { id: 'display', label: 'Appearance' },
      ...settingsTabs.filter((t) => t.before).map((t) => ({ id: t.id, label: t.label })),
      { id: 'sound', label: 'Sound' },
      { id: 'mouse', label: 'Mouse' },
      { id: 'games', label: 'Games' },
      ...settingsTabs.filter((t) => !t.before).map((t) => ({ id: t.id, label: t.label })),
      { id: 'data', label: 'Data' }
    ];
    let tab = opts.tab && tabs.some((t) => t.id === opts.tab) ? opts.tab : 'display';
    const bodyEl = document.createElement('div');
    bodyEl.className = 'window-body';
    bodyEl.innerHTML = `<menu role="tablist" class="curio-sheet__tabs">${tabs.map((t) => `<li role="tab" aria-selected="${t.id === tab}" data-tab="${t.id}"><a href="#${t.id}">${t.label}</a></li>`).join('')}</menu><div class="window" role="tabpanel"></div>`;
    const panel = bodyEl.querySelector('[role=tabpanel]');
    const btns = document.createElement('div');
    btns.className = 'curio-sheet__btns';
    btns.innerHTML = '<button type="button" class="default" data-act="ok">OK</button><button type="button" data-act="cancel">Close</button>';
    box.append(bodyEl, btns);
    const pal = (l) => Object.entries(l.pal).map(([k, v]) => `--pv-${k}:${v}`).join(';');
    const def = () => (store.get('modeDefault', 'simple') === 'advanced' ? 'advanced' : 'simple');
    const panes = {
      display: () => {
        const cur = lookById(resolved());
        return `<div class="curio-set"><div class="curio-preview" style="${pal(cur)}"><div class="curio-preview__win is-back"><div class="curio-preview__title">Inactive window</div></div><div class="curio-preview__win"><div class="curio-preview__title">Active window</div><div class="curio-preview__body">Window text <i>Selected</i></div></div></div>
          <fieldset><legend>Colour scheme</legend><div class="curio-schemes z-sunken" role="radiogroup" aria-label="Colour scheme">${LOOKS.map((l, i) => `${i === 0 ? '<div class="curio-schemes__head" aria-hidden="true">ZobOS</div>' : !l.toy && LOOKS[i - 1].toy ? '<div class="curio-schemes__head" aria-hidden="true">Classic</div>' : ''}<button type="button" role="radio" data-look="${l.id}" aria-checked="${prefs.look === l.id}">${l.name}${l.dark ? ' (dark)' : ''}</button>`).join('')}<button type="button" role="radio" data-look="auto" aria-checked="${prefs.look === 'auto'}">Match my device</button></div></fieldset></div>
          <fieldset><legend>Comfort</legend>${check('calm', 'Reduce motion', prefs.calm, 'Fewer animations, no window zooms, calmer screen saver.')}${check('big', 'Bigger text', prefs.big)}${check('contrast', 'Stronger text', prefs.contrast)}</fieldset>`;
      },
      sound: () => `<div class="curio-set curio-danger"><img alt="" src="${px('sound', 32)}"><p>Sounds are made on the spot by your computer. Nothing is downloaded.</p></div>
          <fieldset><legend>Sounds</legend>${check('sound', 'Game sounds', !muted, 'Beeps, boops and booms inside the games.')}${check('ui', 'System sounds', prefs.ui, 'Clicks, chimes and dings in menus, windows and dialogs.')}</fieldset>
          <fieldset><legend>Volume</legend><div class="field-row" style="width:100%"><label for="cvol">Low</label><input id="cvol" class="curio-range" type="range" min="0" max="100" step="5" data-key="volume" aria-label="Volume"><label for="cvol">High</label></div></fieldset>`,
      mouse: () => `<div class="curio-set curio-danger"><img alt="" src="${px('mouse', 32)}"><p>Touchpad mode turns every drag into click to grab, click to drop. No holding the button down.</p></div>
          <fieldset><legend>Touchpad</legend>${check('touchpad', 'Touchpad mode', touchpad, 'Click once to grab or draw, click again to let go. Esc lets go too.')}</fieldset>
          <fieldset><legend>Pointer</legend>${radio('cursor', 'normal', 'Classic arrow', prefs.cursor === 'normal')}${radio('cursor', 'big', 'Big arrow', prefs.cursor === 'big')}${radio('cursor', 'pencil', 'Pencil', prefs.cursor === 'pencil')}${check('trails', 'Show pointer trails', prefs.trails)}</fieldset>
          ${isHub ? `<fieldset><legend>Opening things</legend>${radio('clicks', 'single', 'Single-click to open an item', prefs.clicks !== 'double')}${radio('clicks', 'double', 'Double-click to open an item (single-click selects)', prefs.clicks === 'double')}</fieldset>` : ''}`,
      games: () => `${isHub ? `<fieldset><legend>Opening games</legend>${radio('gwin', 'max', 'Fill Zob\'s screen (maximized)', prefs.gameWindow !== 'window')}${radio('gwin', 'window', 'In a window I can move around', prefs.gameWindow === 'window')}</fieldset>` : ''}<fieldset><legend>New games start in</legend><p style="margin:0 0 6px">Simple is quick to pick up. Advanced has every mode, stat and setting.</p>${radio('defmode', 'simple', 'Simple', def() === 'simple')}${radio('defmode', 'advanced', 'Advanced', def() === 'advanced')}</fieldset>
          ${hasModes() ? `<fieldset><legend>This game: ${esc(game?.title || '')}</legend><p style="margin:0 0 6px">Switching may restart the game.</p>${radio('thismode', 'simple', 'Simple', mode === 'simple')}${radio('thismode', 'advanced', 'Advanced', mode === 'advanced')}</fieldset>` : ''}
          <fieldset><legend>Secrets</legend><p style="margin:0 0 8px">${Object.keys(found()).length} of ${SECRETS.length} secrets found.</p><button type="button" data-act="book">Open Secrets...</button></fieldset>`,
      data: () => `<div class="curio-set curio-danger"><img alt="" src="${px('warn', 32)}"><p>Everything Zoble remembers lives in this browser only: scores, favourites, what you played, secrets. No accounts, no tracking.</p></div>
          <fieldset><legend>Start fresh</legend><p style="margin:0 0 8px">Forgets played marks, favourites, recent games, desktop layout and secrets. Game high scores stay.</p><button type="button" data-act="reset">Reset desktop data...</button></fieldset>`
    };
    settingsTabs.forEach((t) => { panes[t.id] = () => t.render(); });
    function paint() {
      bodyEl.querySelectorAll('[role=tab]').forEach((li) => li.setAttribute('aria-selected', String(li.dataset.tab === tab)));
      panel.innerHTML = `<div class="curio-sheet__pane">${panes[tab]()}</div>`;
      const vol = panel.querySelector('[data-key="volume"]');
      if (vol) {
        vol.value = Math.round(prefs.volume * 100);
        vol.addEventListener('input', () => { prefs.volume = vol.value / 100; applyPrefs(); });
        vol.addEventListener('change', () => { savePrefs(); sfx('ding'); });
      }
      settingsTabs.find((t) => t.id === tab)?.mount?.(panel, paint);
    }
    paint();
    bodyEl.querySelector('menu').addEventListener('click', (e) => {
      const li = e.target.closest('[role=tab]');
      if (!li) return;
      e.preventDefault();
      tab = li.dataset.tab; sfx('click'); paint();
      bodyEl.querySelector(`[data-tab="${tab}"] a`)?.focus();
    });
    bodyEl.querySelector('menu').addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      const i = tabs.findIndex((t) => t.id === tab);
      tab = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length].id;
      paint(); bodyEl.querySelector(`[data-tab="${tab}"] a`)?.focus();
    });
    panel.addEventListener('change', (e) => {
      const t = e.target;
      if (t.type === 'checkbox') {
        const k = t.dataset.key, on = t.checked;
        if (k === 'sound') setMuted(!on);
        else if (k === 'touchpad') setTouchpad(on);
        else if (k) { setPref(k, on); if (k === 'trails' && on) unlock('trail'); }
        sfx(on ? 'on' : 'off');
      } else if (t.type === 'radio') {
        if (t.name === 'cursor') setPref('cursor', t.value);
        else if (t.name === 'clicks') setPref('clicks', t.value);
        else if (t.name === 'gwin') setPref('gameWindow', t.value);
        else if (t.name === 'defmode') { store.set('modeDefault', t.value); toast(`New games will open in ${t.value === 'advanced' ? 'Advanced' : 'Simple'} mode`, 1800); }
        else if (t.name === 'thismode') { const keepDef = store.get('modeDefault', 'simple'); setMode(t.value); store.set('modeDefault', keepDef); }
        else settingsTabs.find((x) => x.id === tab)?.change?.(t);
        sfx('click');
      }
    });
    panel.addEventListener('click', (e) => {
      const lb = e.target.closest('[data-look]');
      if (lb) { setLook(lb.dataset.look); sfx('click'); paint(); panel.querySelector(`[data-look="${lb.dataset.look}"]`)?.focus(); return; }
      if (e.target.closest('[data-act="book"]')) { closeSettings(); setTimeout(openBook, 60); return; }
      if (e.target.closest('[data-act="reset"]')) {
        modal({ icon: 'warn', caption: 'Confirm Reset', title: 'Wipe the desktop clean?', body: 'Played marks, favourites, recent games, the desktop layout and found secrets go in the bin. Game scores stay put.', buttons: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }] }).then((v) => {
          if (v !== 'yes') return;
          ['played', 'hub:favs', 'hub:secrets', 'hub:looks', 'hub:seen', 'hub:tag', 'hub:view', 'hub:visits', 'hub:rolls', 'hub:pokes', 'hub:thumbs', 'hub:lost', 'hub:credits', 'hub:lifts', 'hub:peeked', 'hub:session', 'hub:icons', 'hub:bin'].forEach((k) => store.remove(k));
          toast('Swept. Fresh as a new floppy.');
          window.dispatchEvent(new CustomEvent('curio:reset'));
        });
      }
    });
    panel.addEventListener('keydown', (e) => {
      const cur = e.target.closest('.curio-schemes button');
      if (!cur || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
      e.preventDefault();
      const all = [...panel.querySelectorAll('.curio-schemes button')];
      const n = all[(all.indexOf(cur) + (e.key === 'ArrowDown' ? 1 : -1) + all.length) % all.length];
      setLook(n.dataset.look); paint(); panel.querySelector(`[data-look="${n.dataset.look}"]`)?.focus();
    });
    btns.addEventListener('click', (e) => { if (e.target.closest('button')) closeSettings(); });
    box.querySelector('.title-bar-controls .close').addEventListener('click', closeSettings);
    box.querySelector('.title-bar-controls .help').addEventListener('click', () => toast('Pick a tab, change a thing. Changes apply straight away and are remembered in this browser.', 3600));
    wrap.addEventListener('pointerdown', (e) => { if (e.target === wrap) { sfx('error'); box.animate?.([{ filter: 'none' }, { filter: 'invert(1)' }, { filter: 'none' }], { duration: 160, iterations: 2 }); } });
    wrap.append(box);
    host().append(wrap);
    draggable(box, box.querySelector('.title-bar'));
    sheet = wrap;
    document.addEventListener('keydown', sheetKeys, true);
    window.dispatchEvent(new CustomEvent('curio:settings', { detail: true }));
    setTimeout(() => bodyEl.querySelector(`[data-tab="${tab}"] a`)?.focus(), 30);
  }

  function openBook() {
    const got = found();
    const wrapEl = document.createElement('div');
    const list = document.createElement('div');
    list.className = 'curio-book';
    list.setAttribute('role', 'list');
    SECRETS.forEach(([id, name, text]) => {
      const has = !!got[id];
      const c = document.createElement('div');
      c.className = `curio-book__item${has ? ' is-got' : ''}`;
      c.setAttribute('role', 'listitem');
      c.innerHTML = `<img alt="" src="${px(has ? 'trophy' : 'lock', 32)}"><b></b><span></span>`;
      c.querySelector('b').textContent = has ? name : 'Not found yet';
      c.querySelector('span').textContent = has ? text : (BOOK[id] || 'Keep poking around.');
      list.append(c);
    });
    const n = Object.keys(got).length;
    const bar = document.createElement('div');
    bar.className = 'curio-book__bar';
    bar.innerHTML = `<div class="progress-indicator segmented"><span class="progress-indicator-bar" style="width:${Math.round(n / SECRETS.length * 100)}%"></span></div><p style="margin:6px 0 0">${n} of ${SECRETS.length} secrets found.</p>`;
    wrapEl.append(list, bar);
    return modal({ icon: 'info', caption: 'Secrets', title: '', body: wrapEl, wide: true, buttons: [{ label: 'Close', value: 'ok' }] });
  }

  let helpFn = null;
  function howTo(fnOrText) { helpFn = fnOrText; if (framed) tell({ zoble: 'help', has: true }); }
  function findHelp() {
    if (helpFn) return helpFn;
    const cand = [...document.querySelectorAll('[data-howto], button, a[href^="#"], summary')].find((el) => {
      if (el.closest('.curio-bar, .curio-modal, .curio-sheet')) return false;
      if (el.matches('[data-howto]')) return true;
      const t = (el.textContent || el.getAttribute('aria-label') || '').trim().toLowerCase();
      return t.length < 30 && /(how to play|how it works|how to|rules|^help$|^\?$|instructions|tutorial)/.test(t);
    });
    return cand || null;
  }
  function runHelp() {
    const h = findHelp();
    if (typeof h === 'function') return h();
    if (typeof h === 'string') return modal({ icon: 'info', caption: 'How to play', title: game?.title || 'How to play', body: h, buttons: [{ label: 'OK', value: 'ok' }] });
    if (h instanceof Element) { h.scrollIntoView?.({ block: 'center' }); h.click(); return; }
    return modal({ icon: 'info', caption: 'How to play', title: game?.title || document.title, body: `${game?.blurb || ''}${game?.blurb ? '.' : ''}\n\nPoke at things and see what happens. Most games also work with the keyboard.`, buttons: [{ label: 'OK', value: 'ok' }] });
  }
  function about() {
    const best0 = (() => {
      let out = null;
      try { const pre = `curio:best:${slug}:`; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(pre)) { const v = JSON.parse(localStorage.getItem(k)); if (typeof v === 'number' && (out == null || v > out)) out = v; } } } catch {}
      return out;
    })();
    const tags = window.CURIO_TAGS || {};
    const body = game ? `${game.blurb}.\n\nFolder: ${tags[game.tag] || game.tag}\nMode: ${hasModes() ? (mode === 'advanced' ? 'Advanced' : 'Simple') : 'One size fits all'}${best0 != null ? `\nYour best: ${fmt(best0, best0 % 1 ? 2 : 0)}` : ''}\n\nPart of Zoble, running on ZobOS. Made by hand, no ads, nothing to sign up for.` : 'ZobOS, the operating system on Zob\'s computer. A desk full of small games and toys. Made by hand, no ads, nothing to sign up for.';
    return modal({ icon: 'info', caption: `About ${game ? game.title : 'Zoble'}`, title: game ? game.title : 'ZobOS', body, buttons: [{ label: 'OK', value: 'ok' }] });
  }
  const fmt = (n, d = 0) => Number(n).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d });
  function randomGame() {
    sfx('roll');
    const others = (window.CURIO_READY || []).filter((g) => g.slug !== slug);
    const g = others[Math.floor(Math.random() * others.length)];
    if (g) setTimeout(() => { location.href = `${root}games/${g.slug}/index.html`; }, calm() ? 0 : 220);
  }
  function toggleFull() {
    try {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else document.documentElement.requestFullscreen?.().catch(() => toast('Full screen is not allowed here.'));
    } catch { toast('Full screen is not allowed here.'); }
  }
  const goHome = () => { sfx('min'); location.href = `${root}index.html${slug ? `#open=${slug}` : ''}`; };

  function schemeItems() {
    return [...LOOKS.flatMap((l, i) => [...(i && !l.toy && LOOKS[i - 1].toy ? [{ sep: true }] : []), { label: l.name, radio: true, checked: prefs.look === l.id, action: () => { setLook(l.id); toast(`${l.name}: ${l.note.toLowerCase()}`, 1600); } }]), { sep: true }, { label: 'Match my device', radio: true, checked: prefs.look === 'auto', action: () => setLook('auto') }];
  }

  function bar() {
    sprite();
    if (document.body.dataset.nobar != null || framed) return;
    const el = document.createElement('header');
    el.className = 'curio-bar z98';
    const title = game ? game.title : (document.body.dataset.title || document.title.replace(/\s*·.*$/, ''));
    el.innerHTML = `<button type="button" class="curio-bar__home" aria-label="Back to Zob's desk" title="Back to Zob's desk"><img alt="" width="32" height="32" src="${px('zob', 32)}"></button><div class="curio-bar__title"><img class="curio-bar__icon" alt="" width="16" height="16" src="${px('app', 16)}"><span></span></div><div class="curio-bar__row"></div><button type="button" class="curio-bar__more" aria-haspopup="menu" aria-label="Menu" title="Menu"><i aria-hidden="true"></i><i aria-hidden="true"></i><i aria-hidden="true"></i></button><div class="curio-bar__end"></div><div class="title-bar-controls curio-bar__win"><button type="button" class="maximize" aria-label="Maximize" title="Full screen"></button><button type="button" class="close" aria-label="Close" title="Close: back to Zob's desk"></button></div>`;
    el.querySelector('.curio-bar__title span').textContent = title;
    if (slug) gameIcon(slug, 16).then((u) => { el.querySelector('.curio-bar__icon').src = u; });
    else el.querySelector('.curio-bar__icon').src = px(document.body.dataset.icon || 'zob', 16);
    const row = el.querySelector('.curio-bar__row');
    const end = el.querySelector('.curio-bar__end');
    const modes = hasModes();
    const menus = [
      { label: '&File', items: () => [
        { label: '&Restart', accel: 'F5', action: () => location.reload() },
        { label: 'Random &game', icon: px('die', 16), action: randomGame },
        { sep: true },
        { label: '&Back to Zob\'s desk', icon: px('computer', 16), action: goHome }
      ] },
      { label: '&View', items: () => [
        ...(modes ? [{ label: '&Simple', radio: true, checked: mode === 'simple', action: () => setMode('simple') }, { label: '&Advanced', radio: true, checked: mode === 'advanced', action: () => setMode('advanced') }, { sep: true }] : []),
        { label: '&Colour scheme', sub: schemeItems },
        { label: '&Touchpad mode', checked: touchpad, action: () => { setTouchpad(!touchpad); toast(touchpad ? 'Touchpad mode on: click to grab, click again to let go' : 'Touchpad mode off', 2400); } },
        { label: 'S&ound', checked: !muted, action: () => { setMuted(!muted); sfx('on'); } },
        { sep: true },
        { label: '&Full screen', accel: 'F11', checked: !!document.fullscreenElement, action: toggleFull },
        { label: 'Control &Panel...', icon: px('control', 16), action: () => openSettings() }
      ] },
      { label: '&Help', items: () => [
        { label: '&How to play', icon: px('help', 16), action: runHelp },
        { label: '&Secrets...', icon: px('trophy', 16), action: openBook },
        { sep: true },
        { label: `&About ${title.replace(/&/g, '&&')}`, action: about }
      ] }
    ];
    const mb = menubar(row, menus, { label: `${title} menu` });
    const more = el.querySelector('.curio-bar__more');
    more.addEventListener('click', () => {
      sfx('menu');
      const flat = menus.map((m) => ({ label: m.label.replace('&', ''), sub: m.items }));
      Menus.open(flat, { anchor: more.getBoundingClientRect(), opener: more, label: 'Menu' });
    });
    if (modes) {
      const box = document.createElement('div');
      box.className = 'curio-mode';
      box.setAttribute('role', 'group');
      box.setAttribute('aria-label', 'Game mode');
      box.innerHTML = '<button type="button" data-mode="simple" title="Simple: quick and easy">Simple</button><button type="button" data-mode="advanced" title="Advanced: more content, longer games">Advanced</button>';
      const paintMode = () => box.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
      paintMode();
      box.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-mode]');
        if (!b || b.dataset.mode === mode) return;
        sfx('click');
        setMode(b.dataset.mode);
        paintMode();
      });
      window.addEventListener('curio:mode', paintMode);
      end.append(box);
      el.classList.add('has-mode');
    }
    const tray = document.createElement('div');
    tray.className = 'curio-bar__tray';
    tray.innerHTML = '<button type="button" class="curio-bar__tbtn" data-act="touchpad"><img alt=""></button><button type="button" class="curio-bar__tbtn" data-act="sound"><img alt=""></button><button type="button" class="curio-bar__tbtn" data-act="settings" aria-label="Control Panel" title="Control Panel"><img alt=""></button>';
    end.append(tray);
    const sound = tray.querySelector('[data-act="sound"]');
    const pad = tray.querySelector('[data-act="touchpad"]');
    tray.querySelector('[data-act="settings"] img').src = px('settings', 16);
    const paintTray = () => {
      sound.querySelector('img').src = px('sound', 16, { muted });
      sound.setAttribute('aria-label', muted ? 'Sound is off. Turn on' : 'Sound is on. Mute');
      sound.title = muted ? 'Sound is off' : 'Sound is on';
      pad.querySelector('img').src = px('touchpad', 16, { on: touchpad });
      pad.setAttribute('aria-pressed', String(touchpad));
      pad.setAttribute('aria-label', 'Touchpad mode');
      pad.title = touchpad ? 'Touchpad mode on: click once to grab, click again to let go' : 'Touchpad mode off';
    };
    paintTray();
    sound.addEventListener('click', () => { setMuted(!muted); sfx('on'); });
    pad.addEventListener('click', () => { setTouchpad(!touchpad); sfx(touchpad ? 'on' : 'off'); toast(touchpad ? 'Touchpad mode on: click to start a drag, click again to let go' : 'Touchpad mode off', 2600); });
    tray.querySelector('[data-act="settings"]').addEventListener('click', (e) => openSettings(e.currentTarget));
    window.addEventListener('curio:sound', paintTray);
    window.addEventListener('curio:touchpad', paintTray);
    const ctr = el.querySelectorAll('.curio-bar__win button');
    ctr.forEach((b) => b.addEventListener('pointerdown', (e) => e.stopPropagation()));
    el.querySelector('.curio-bar__home').addEventListener('click', goHome);
    ctr[0].addEventListener('click', () => { sfx('max'); toggleFull(); });
    ctr[1].addEventListener('click', () => { sfx('close'); location.href = `${root}index.html`; });
    el.querySelector('.curio-bar__title').addEventListener('dblclick', toggleFull);
    document.addEventListener('fullscreenchange', () => ctr[0].classList.toggle('restore', !!document.fullscreenElement));
    document.addEventListener('keydown', (e) => {
      if (e.defaultPrevented) return;
      if (e.altKey && !e.ctrlKey && !e.metaKey && e.key.length === 1 && /[fvh]/i.test(e.key)) { if (mb.open(e.key.toLowerCase())) e.preventDefault(); }
      else if (e.key === 'F10' && !e.shiftKey) { e.preventDefault(); mb.focus(); }
    });
    document.body.prepend(el);
    document.body.classList.add('curio-has-bar');
  }

  function framedBoot() {
    sprite();
    const info = () => ({ zoble: 'hello', slug, title: game ? game.title : (document.body.dataset.title || document.title.replace(/\s*·.*$/, '')), modes: hasModes(), live: document.body.dataset.modes === 'live', mode, help: !!findHelp(), icon: document.body.dataset.icon || '' });
    tell(info());
    setTimeout(() => tell(info()), 800);
    window.addEventListener('message', (e) => {
      if (e.origin !== location.origin || !e.data || typeof e.data !== 'object') return;
      const d = e.data;
      if (d.zoble === 'setMode') setMode(d.mode);
      else if (d.zoble === 'restart') location.reload();
      else if (d.zoble === 'help') runHelp();
      else if (d.zoble === 'about') about();
      else if (d.zoble === 'ping') tell(info());
    });
    const act = () => tell({ zoble: 'activate' });
    let lastPing = 0;
    const ping = () => { const t = Date.now(); if (t - lastPing > 4000) { lastPing = t; tell({ zoble: 'activity' }); } };
    ['pointermove', 'keydown', 'wheel', 'touchstart'].forEach((ev) => window.addEventListener(ev, ping, { passive: true, capture: true }));
    document.addEventListener('pointerdown', act, true);
    window.addEventListener('focus', act);
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey && e.key === 'Escape') || e.key === 'Meta' || e.key === 'OS') { e.preventDefault(); tell({ zoble: 'key', key: 'start' }); }
      else if (e.altKey && (e.key === 'F4' || e.key.toLowerCase() === 'x')) { e.preventDefault(); tell({ zoble: 'key', key: 'close' }); }
      else if (e.altKey && e.key === 'Tab') { tell({ zoble: 'key', key: 'next' }); }
    }, true);
  }

  if (slug) {
    const played = store.get('played', {});
    played[slug] = Date.now();
    store.set('played', played);
    if (Object.keys(played).length >= 10) setTimeout(() => unlock('explorer'), 1500);
  }

  window.Curio = {
    slug, game, store, beep, toast, modal, confetti, best, getBest, isDark,
    get muted() { return muted; },
    get touchpad() { return touchpad; },
    get mode() { return mode; },
    get simple() { return mode === 'simple'; },
    get advanced() { return mode === 'advanced'; },
    get framed() { return framed; },
    setMode,
    get look() { return resolved(); },
    get prefs() { return { ...prefs }; },
    get calm() { return calm(); },
    setTouchpad, setMuted, setLook, setPref, drag,
    looks: LOOKS.map((l) => ({ ...l, pal: { ...l.pal } })),
    audioContext: ctx,
    sfx, icon, pim, unlock, found, secrets: SECRETS.map(([id, name, text]) => ({ id, name, text, hint: BOOK[id] })),
    setStage: (o = {}) => { if ('mount' in o) stage.mount = o.mount; if ('bounds' in o) stage.bounds = o.bounds; },
    get stage() { return host(); },
    settings: openSettings, closeSettings, stickerBook: openBook, secretsWindow: openBook, trail, howTo, help: runHelp, about,
    balloon, px, gameIcon, folderIcon, overlayShortcut, menu: Menus, menubar, tooltip, windowFrame, draggable, schemeItems, settingsTabs, zobDraw: ZOB.draw,
    rand: (a, b) => a + Math.random() * (b - a),
    randInt: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
    pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
    shuffle: (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
    fmt
  };
  applyPrefs();

  window.zob = () => {
    console.log('%c (o) %c hi! I am Zob. I live inside this computer. It is mine, actually. You found my secret door.', 'background:#dc2f6c;color:#fff;font-size:16px;padding:4px 6px', 'font-size:14px');
    unlock('console');
    return 'squeak';
  };

  function later() {
    const id = store.get('hub:later', null);
    if (!id) return;
    store.remove('hub:later');
    const s = SECRETS.find((x) => x[0] === id);
    if (s) setTimeout(() => sticker(s[1], s[2]), 700);
  }
  const boot = () => { if (framed) framedBoot(); else bar(); later(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
